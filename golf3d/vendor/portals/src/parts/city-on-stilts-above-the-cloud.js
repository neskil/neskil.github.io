// HERO SET PIECE for "city-on-stilts-above-the-cloud": a whole small city on a raft of great beams, held up above the
// cloud by a few slender stilts.
//
// WHAT IT IS
//   A raft of crossed beams with a plank deck (the lowest terrace) and, stepped back on it, five more terraces rising
//   to a summit square; houses with wide eaves, tiled roofs and blue shutters stand with their backs to each terrace's
//   wall (the walls themselves broken by blind arches with doors, drains with their stains, vines from tubs, small
//   balconies); a stair street climbs the north slope on the city's axis under a footbridge; windmills, dew catchers
//   over cisterns, orchards in tubs, washing, hanging gardens slung from troughs, kites on their cords; along every
//   rail (the raft's, the terraces', the light wells', the jetty's) stations a few metres apart, and at each station
//   from which THE EARTH can be seen through one of the cloud's standing gaps a brass spyglass clamped on the rail, aimed
//   down through that gap and sweeping slowly about its aim (where the cloud hides the earth: no tube, or one folded on
//   the rail); on the terraces' corners a few great telescopes on wheeled carriages, aimed likewise; a market on the
//   summit square (two rows of stalls under awnings along its middle way, a fountain, four trees in tubs, benches, a
//   paved border) and stalls on the terraces; plainly
//   dressed folk (caps, kerchiefs, shawls, aprons, baskets on the arm or the head): watchers at the rails who look out
//   and down by the rail's own outward side, on every side of the city alike, walkers on the stair street's two files,
//   others at a tree, a washing line, a cistern, a stall, a kite's winder, facing what they are at. A short timber jetty
//   goes out from the summit on the city's axis: a landing, a flight of steps down, a walk 4 m under the summit square,
//   and on its end a great brass ring.
//   Six slender legs in all: four under the raft, one beside the jetty's walk, and the ladder leg, which stands apart
//   (270 m to the south-west) and carries on its head the long gangway, a hung foot-bridge that comes in at the raft's beams.
//
// WHAT THIS FILE EXPORTS
//   stiltsPlan(seed, vary, tick)  the whole place as arithmetic (no meshes): the wood's lie, the stilts, the city's
//                                 plan, the route and every dealt thing with its lane test. Node scripts count on it.
//   Geo                           the geometry accumulator (static or moving vertices)
//   makeKitMaterials(U)           the two lit materials of everything built here (one static, one moved in the shader)
//   kitUniforms(), placePatch(m)  the shared uniforms; the patch that gives a kit material the place's light
//   addStilt, addSpyglass, addKite, addWindmill   the makers the world uses
//   buildHero(ctx, opts)          the city on its raft (standalone: with the heads of its stilts)
//
// WHAT MOVES, AND BY WHAT (all on the world's clock uKTime, each from a phase of its own; nothing reads the visitor)
//   SPIN    windmill sails, weather vanes' cups        SCOPE   a spyglass sweeping about its own aim
//   SWAY    kites on their strings, lanterns, figures  FLUTTER washing, awnings, sails' cloth, kite tails
//   TRAVEL  a bucket on its rope                       WALK    the stair street's folk, round its circuit at the street's pace
//   LINE    strings and ropes: ribbons of the cord's own width. A round cord shows the same width from every side, so the ribbon turns
//           its flat toward the lens (the shader takes the lens's place for this, and for nothing else: where the cord IS, how it
//           sways and what it is tied to are the plan's; the cloud's haze, likewise, pales a thing by the sight line's length in it)
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed, makePath, makeNoise } from '../kit/core.js';

const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const MAT = { PLAIN: 0, PLASTER: 1, PLANK: 2, TILE: 3, TIMBER: 4, IRON: 5, BRASS: 6, GLASS: 7, WINDOW: 8, LAMP: 9, CLOTH: 10, LEAF: 11, WATER: 12, STONE: 13, MAST: 14 };
export const ANIM = { NONE: 0, SPIN: 1, SCOPE: 2, SWAY: 3, FLUTTER: 4, TRAVEL: 5, LINE: 6, WALK: 7 };
export const COL = {
  timber: lin('#d2c7b0'), timberDark: lin('#a3977f'), mast: lin('#bd9a6c'), mastDark: lin('#8f6f4b'), iron: lin('#5c5d5e'), plank: lin('#b79f7c'), plankDark: lin('#8d7658'), beam: lin('#9a8466'),
  plaster: lin('#e8c79a'), plasterPale: lin('#f0dcb8'), plasterRose: lin('#e2b08c'), roof: lin('#b5533a'), roofDark: lin('#8f3f2e'), shutter: lin('#3f7fa8'),
  brass: lin('#d9a441'), glass: lin('#22303c'), lamp: lin('#ffd08a'), cloth: lin('#f1ead8'), kiteA: lin('#f2d24b'), kiteB: lin('#d9486a'),
  leaf: lin('#6fa64a'), leafDark: lin('#2f6b3a'), water: lin('#9fc8e0'), stone: lin('#c2b59c'), rope: lin('#cdbf9a'), straw: lin('#c9b06a'),
  coat: [lin('#e9e2cf'), lin('#7f93a8'), lin('#c9a15a'), lin('#8a6a52'), lin('#b9c4a8')],
};
// the sway of a kite on its string: every part of one kite takes the same law from its phase
export const kiteRate = (ph) => 0.5 + ((ph * 0.37) % 1) * 0.5;
// how far each moving kind can reach from where it is built (the world's lane test and the node counts use these)
export const REACH = { scope: 1.7, flutter: 0.9, kiteCone: 1.6 };

// ---------------------------------------------------------------- the geometry accumulator
// Indexed triangles with position, normal, colour, a surface kind (aMat) and, for moving geometry, aAnim (kind, phase,
// p1, p2), aPivot and aAxis. Normals of flat faces are taken from the winding, so both faces light rightly.
export class Geo {
  constructor(anim = false, cap = 8192) {
    this.anim = anim; this.n = 0; this.ni = 0; this.cap = cap; this.capI = cap * 2;
    this.P = new Float32Array(cap * 3); this.N = new Float32Array(cap * 3); this.C = new Float32Array(cap * 3); this.M = new Float32Array(cap);
    if (anim) { this.A = new Float32Array(cap * 4); this.V = new Float32Array(cap * 3); this.X = new Float32Array(cap * 3); }
    this.I = new Uint32Array(this.capI);
    this.col = [1, 1, 1]; this.mat = 0; this.an = [0, 0, 0, 0]; this.pv = [0, 0, 0]; this.ax = [0, 1, 0];
  }
  _grow(nv, ni) {
    if (this.n + nv > this.cap) {
      while (this.n + nv > this.cap) this.cap *= 2;
      const g = (a, k) => { const b = new Float32Array(this.cap * k); b.set(a); return b; };
      this.P = g(this.P, 3); this.N = g(this.N, 3); this.C = g(this.C, 3); this.M = g(this.M, 1);
      if (this.anim) { this.A = g(this.A, 4); this.V = g(this.V, 3); this.X = g(this.X, 3); }
    }
    if (this.ni + ni > this.capI) { while (this.ni + ni > this.capI) this.capI *= 2; const b = new Uint32Array(this.capI); b.set(this.I); this.I = b; }
  }
  set(col, mat = 0) { this.col = col; this.mat = mat; return this; }
  move(kind, phase = 0, p1 = 0, p2 = 0, pivot = null, axis = null) { this.an = [kind, phase, p1, p2]; if (pivot) this.pv = pivot; if (axis) this.ax = axis; return this; }
  still() { this.an = [0, 0, 0, 0]; return this; }
  v(x, y, z, nx, ny, nz, k = 1) {
    const i = this.n++, j = i * 3, c = this.col;
    this.P[j] = x; this.P[j + 1] = y; this.P[j + 2] = z; this.N[j] = nx; this.N[j + 1] = ny; this.N[j + 2] = nz;
    this.C[j] = c[0] * k; this.C[j + 1] = c[1] * k; this.C[j + 2] = c[2] * k; this.M[i] = this.mat;
    if (this.anim) { const a = this.an, q = i * 4; this.A[q] = a[0]; this.A[q + 1] = a[1]; this.A[q + 2] = a[2]; this.A[q + 3] = a[3]; this.V[j] = this.pv[0]; this.V[j + 1] = this.pv[1]; this.V[j + 2] = this.pv[2]; this.X[j] = this.ax[0]; this.X[j + 1] = this.ax[1]; this.X[j + 2] = this.ax[2]; }
    return i;
  }
  tri3(a, b, c) { this.I[this.ni++] = a; this.I[this.ni++] = b; this.I[this.ni++] = c; }
  // a flat triangle and a flat quad (a, b, c, d in order round the face); ka..kd shade the corners
  tri(a, b, c, ka = 1, kb = 1, kc = 1) {
    this._grow(3, 3);
    let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = this.v(a[0], a[1], a[2], nx, ny, nz, ka); this.v(b[0], b[1], b[2], nx, ny, nz, kb); this.v(c[0], c[1], c[2], nx, ny, nz, kc);
    this.tri3(i, i + 1, i + 2);
  }
  quad(a, b, c, d, k0 = 1, k1 = k0) {
    this._grow(4, 6);
    let nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = this.v(a[0], a[1], a[2], nx, ny, nz, k0); this.v(b[0], b[1], b[2], nx, ny, nz, k0); this.v(c[0], c[1], c[2], nx, ny, nz, k1); this.v(d[0], d[1], d[2], nx, ny, nz, k1);
    this.tri3(i, i + 1, i + 2); this.tri3(i, i + 2, i + 3);
  }
  get triangles() { return this.ni / 3; }
}

const _dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const _sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const _cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const _norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const _add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
// a frame square to the unit direction d: e1 level where it can be, e2 = d x e1
const _frame = (d) => { const e1 = Math.abs(d[1]) > 0.999 ? [1, 0, 0] : _norm(_cross(d, [0, 1, 0])); return [e1, _cross(d, e1)]; };

Object.assign(Geo.prototype, {
  // a quad wound so that its face looks along 'out'
  quadOut(a, b, c, d, out, k0 = 1, k1 = k0) {
    const n = _cross(_sub(b, a), _sub(d, a));
    if (_dot(n, out) >= 0) this.quad(a, b, c, d, k0, k1); else this.quad(b, a, d, c, k0, k1);
  },
  triOut(a, b, c, out, ka = 1, kb = 1, kc = 1) {
    const n = _cross(_sub(b, a), _sub(c, a));
    if (_dot(n, out) >= 0) this.tri(a, b, c, ka, kb, kc); else this.tri(a, c, b, ka, kc, kb);
  },
  // a box by its centre and full sizes, turned by yaw; faces: 1 +x, 2 -x, 4 top, 8 bottom, 16 +z, 32 -z; kb, kt shade the feet and heads of its sides
  box(cx, cy, cz, sx, sy, sz, yaw = 0, faces = 63, kb = 1, kt = 1) {
    const c = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const P = (lx, ly, lz) => [cx + lx * c + lz * s, cy + ly, cz - lx * s + lz * c];
    if (faces & 1) this.quad(P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), kb, kt);
    if (faces & 2) this.quad(P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), kb, kt);
    if (faces & 4) this.quad(P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz), kt, kt);
    if (faces & 8) this.quad(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), kb * 0.8, kb * 0.8);
    if (faces & 16) this.quad(P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), kb, kt);
    if (faces & 32) this.quad(P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz), kb, kt);
  },
  // a squared timber or rod from a to b, w wide and h deep (h measured toward 'up' where the beam is not upright)
  beam(a, b, w, h = w, caps = false, k = 1) {
    const d = _norm(_sub(b, a)), [e1, e2] = _frame(d), hw = w / 2, hh = h / 2;
    const c = (p, i, j) => [p[0] + e1[0] * hw * i + e2[0] * hh * j, p[1] + e1[1] * hw * i + e2[1] * hh * j, p[2] + e1[2] * hw * i + e2[2] * hh * j];
    this.quadOut(c(a, 1, -1), c(a, 1, 1), c(b, 1, 1), c(b, 1, -1), e1, k, k);
    this.quadOut(c(a, -1, -1), c(a, -1, 1), c(b, -1, 1), c(b, -1, -1), [-e1[0], -e1[1], -e1[2]], k, k);
    this.quadOut(c(a, -1, 1), c(a, 1, 1), c(b, 1, 1), c(b, -1, 1), e2, k, k);
    this.quadOut(c(a, -1, -1), c(a, 1, -1), c(b, 1, -1), c(b, -1, -1), [-e2[0], -e2[1], -e2[2]], k * 0.85, k * 0.85);
    if (caps) { this.quadOut(c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1), [-d[0], -d[1], -d[2]], k); this.quadOut(c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1), d, k); }
  },
  // a round, smooth-sided shaft from a (radius r0) to b (radius r1); k0, k1 shade its two ends
  cyl(a, b, r0, r1, sides = 8, k0 = 1, k1 = 1, cap0 = false, cap1 = false) {
    const d = _norm(_sub(b, a)), [e1, e2] = _frame(d);
    this._grow((sides + 1) * 2, sides * 6);
    const i0 = this.n;
    for (let i = 0; i <= sides; i++) {
      const t = i / sides * TAU, cs = Math.cos(t), sn = Math.sin(t), nx = e1[0] * cs + e2[0] * sn, ny = e1[1] * cs + e2[1] * sn, nz = e1[2] * cs + e2[2] * sn;
      this.v(a[0] + nx * r0, a[1] + ny * r0, a[2] + nz * r0, nx, ny, nz, k0); this.v(b[0] + nx * r1, b[1] + ny * r1, b[2] + nz * r1, nx, ny, nz, k1);
    }
    for (let i = 0; i < sides; i++) { const p = i0 + i * 2; this.tri3(p, p + 2, p + 3); this.tri3(p, p + 3, p + 1); }
    if (cap0 && r0 > 0) this.disc(a, [-d[0], -d[1], -d[2]], r0, sides, k0);
    if (cap1 && r1 > 0) this.disc(b, d, r1, sides, k1);
  },
  // a flat disc facing n
  disc(c, n, r, sides = 8, k = 1) {
    const [e1, e2] = _frame(n); this._grow(sides + 1, sides * 3);
    const i0 = this.v(c[0], c[1], c[2], n[0], n[1], n[2], k);
    for (let i = 0; i < sides; i++) { const t = i / sides * TAU, cs = Math.cos(t) * r, sn = Math.sin(t) * r; this.v(c[0] + e1[0] * cs + e2[0] * sn, c[1] + e1[1] * cs + e2[1] * sn, c[2] + e1[2] * cs + e2[2] * sn, n[0], n[1], n[2], k); }
    // e2 = n x e1, so the ring runs counter-clockwise seen from the side n looks to
    for (let i = 0; i < sides; i++) this.tri3(i0, i0 + 1 + i, i0 + 1 + (i + 1) % sides);
  },
  // a roof over a w x d rectangle whose eaves stand at height y: hipped (four slopes) or gabled (two slopes along x); 'over' is the eaves' overhang
  roof(cx, y, cz, w, d, rise, yaw = 0, over = 0.8, gabled = false) {
    const c = Math.cos(yaw), s = Math.sin(yaw), hx = w / 2 + over, hz = d / 2 + over, yo = y - over * rise / (d / 2) * 0.6;
    const P = (lx, ly, lz) => [cx + lx * c + lz * s, ly, cz - lx * s + lz * c], rx = gabled ? hx : Math.max(w / 2 - d / 2, 0.01);
    const A = P(-hx, yo, hz), B = P(hx, yo, hz), C = P(hx, yo, -hz), D = P(-hx, yo, -hz), R0 = P(-rx, y + rise, 0), R1 = P(rx, y + rise, 0);
    const up = [0, 1, 0];
    this.quadOut(A, B, R1, R0, up, 0.86, 1.05); this.quadOut(C, D, R0, R1, up, 0.86, 1.05);
    if (!gabled) { this.triOut(B, C, R1, up, 0.86, 0.86, 1.05); this.triOut(D, A, R0, up, 0.86, 0.86, 1.05); }
    // the underside of the eaves, in shade
    const k = 0.5; this.quadOut(A, B, C, D, [0, -1, 0], k, k);
  },
  // bigFirst (m2): the triangles are put in two runs, those of that area or more first (the walls, roofs, decks: what throws the city's
  // shadows), the small after; userData.bigIndices is the first run's length in indices
  async sortBig(bigFirst, tick = async () => {}) {
    {
      const I = this.I, P = this.P, nt = this.ni / 3, big = new Uint32Array(this.ni), small = new Uint32Array(this.ni); let nb = 0, ns = 0, lim = 4 * bigFirst * bigFirst;
      for (let t = 0; t < nt; t++) { if (t % 8192 === 8191) await tick(); const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, to = cx * cx + cy * cy + cz * cz >= lim ? big : small, at = to === big ? nb : ns;
        to[at] = I[t * 3]; to[at + 1] = I[t * 3 + 1]; to[at + 2] = I[t * 3 + 2]; if (to === big) nb += 3; else ns += 3; }
      this.I.set(big.subarray(0, nb), 0); this.I.set(small.subarray(0, ns), nb); this.bigIndices = nb;
    }
  },
  // the bounding sphere found with breaths (the box's middle, then the farthest vertex), so that toGeometry need not walk the vertices in one step
  async bound(tick = async () => {}) {
    const P = this.P, n = this.n; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let i = 0; i < n; i++) { if (i % 65536 === 65535) await tick(); const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2; let r2 = 0;
    for (let i = 0; i < n; i++) { if (i % 65536 === 65535) await tick(); const dx = P[i * 3] - cx, dy = P[i * 3 + 1] - cy, dz = P[i * 3 + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
    this.sphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
  },
  toGeometry() {
    const g = new THREE.BufferGeometry(), n = this.n;
    if (this.bigIndices !== undefined) g.userData.bigIndices = this.bigIndices;
    // (views of the accumulator's own arrays: nothing is copied)
    g.setAttribute('position', new THREE.BufferAttribute(this.P.subarray(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(this.N.subarray(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.subarray(0, n * 3), 3)); g.setAttribute('aMat', new THREE.BufferAttribute(this.M.subarray(0, n), 1));
    if (this.anim) { g.setAttribute('aAnim', new THREE.BufferAttribute(this.A.subarray(0, n * 4), 4)); g.setAttribute('aPivot', new THREE.BufferAttribute(this.V.subarray(0, n * 3), 3)); g.setAttribute('aAxis', new THREE.BufferAttribute(this.X.subarray(0, n * 3), 3)); }
    g.setIndex(new THREE.BufferAttribute(this.I.subarray(0, this.ni), 1));
    if (this.sphere) g.boundingSphere = this.sphere.clone(); else g.computeBoundingSphere();
    if (this.anim) g.boundingSphere.radius += 8;
    return g;
  },
});

// ---------------------------------------------------------------- the place's light, shared by every lit material
// LIGHT BY PLACE (standing laws, in world space): above the cloud the sun is whole here (the city's own cast shadows are the
// world's one shadow light's, a standing map); under the cloud the sun is cut by the cloud except under its standing gaps, by the
// city's pierced shadow (the city's plan, a small texture of heights, looked up where the sun's ray meets the raft: ONE list of
// outline and light wells makes both the raft and its shadow), by the legs' own thin shadows, by slow cloud shadows on the clock,
// and under the crowns by the leaves' dapple on the clock. The cloud's body is a haze that lies by height and by place (open at the
// gaps, carried with the high wind on the clock). Nothing here reads the route, the flight's clock or the visitor: the eye's place
// enters only as the near end of the sight line through the haze, as in any fog.
export function kitUniforms() {
  const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); tex.needsUpdate = true;
  return {
    uKTime: { value: 0 }, uKSun: { value: new THREE.Vector3(0.3, 0.8, 0.5).normalize() }, uKPlan: { value: tex },
    // the plan's square (x0, z0, 1 / size) and the lowest deck's height; metres of height per unit of r, the height where the wood's light gives way to the city's, night 0..1, the pierced shadow's strength
    uKPlanA: { value: new THREE.Vector4(0, 0, 1 / 384, 1e4) }, uKPlanB: { value: new THREE.Vector4(102, 1e5, 0, 0.78) },
    // the ride (its axis' x, z from, z to, half width) and two glades (x, z, radius): open sky, no dapple
    uKRide: { value: new THREE.Vector4(0, 1e6, 1e6, 10) }, uKGlade: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },
    // the high wind (x, z), the cloud shadows' speed in m/s, the dapple's strength
    uKWind: { value: new THREE.Vector4(1, 0, 5, 1) },
    // THE CLOUD'S HAZE, a slab that lies by height: its bottom, its top, its thickness to the eye (per metre of sight line inside it), the strength of the light its floor throws upward; and its colour
    uKCloud: { value: new THREE.Vector4(1e5, 1e5 + 1, 0, 0) }, uKCloudCol: { value: new THREE.Color(1, 1, 1) },
    // the far air under the cloud: its colour, and one over the distance at which the cloud's underside is two thirds paled into it
    uKAir: { value: new THREE.Vector4(1, 1, 1, 0) },
    // THE CLOUD'S STANDING GAPS (x, z, radius of each; a radius of 0 is none; the first four are the rounds of the one gap about the
    // ladder leg and the city, in their order from the leg) and THE LEGS (x, z, the height of each one's head, its radius) whose thin shadows lie across the wood
    uKGap: { value: Array.from({ length: 11 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uKLeg: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    // THE FAR COUNTRY'S OPEN PLACES, painted on the wood's roof: the stream's law (the ride's x, the side, the swing's size and phase), six
    // glades (x, z, radius; 0 is none) and three rides (each a ray: x, z of its start, its bearing, its half width; 0 is none)
    // THE STAIR STREET'S CIRCUIT, for the figures that walk it (the city's own frame): the files' distance from the axis, the z of the two
    // crossings, the pace in m/s; and the six flights on it (z from, z to, height from, height to: the street's five, then the jetty's steps)
    uKWalk: { value: new THREE.Vector4(3, 0, 1, 1) }, uKStair: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 1, 0, 0)) },
    uKStream: { value: new THREE.Vector4(0, 1, 3, 0) }, uKFar: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uKWay: { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, 0, 0, 0)) },
  };
}
const KIT_PLACE_GLSL = /* glsl */`
uniform float uKTime; uniform vec3 uKSun; uniform sampler2D uKPlan; uniform vec4 uKPlanA, uKPlanB, uKRide, uKWind; uniform vec4 uKGlade[2]; uniform vec4 uKCloud; uniform vec3 uKCloudCol; uniform vec4 uKAir; uniform vec4 uKGap[11]; uniform vec4 uKLeg[6]; uniform vec4 uKStream; uniform vec4 uKFar[6]; uniform vec4 uKWay[3];
float kHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float kNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(kHash(i), kHash(i + vec2(1., 0.)), f.x), mix(kHash(i + vec2(0., 1.)), kHash(i + vec2(1., 1.)), f.x), f.y); }
vec4 kPlan(vec2 xz, float lod){
  vec2 uv = (xz - uKPlanA.xy) * uKPlanA.z; float inside = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
  return textureLod(uKPlan, clamp(uv, 0., 1.), lod) * inside; }
// THE CITY'S SHADOW ON THE WOOD: the sun's ray from p is followed up to the lowest deck's plane (the raft, pierced by its light wells)
// and on through the city's own body above it, 4.5 m of height at a step (the plan's picture holds each place's height): cut where a
// terrace or a roof stands as high as the ray. So the shadow has the raft's outline and holes and, on the side away from the sun, the
// stepped outline of the terraces, roofs and towers. Asked only within 420 m of the plan's middle (no shadow of the city falls further).
float kPierced(vec3 p){
  float t = (uKPlanA.w - p.y) / max(uKSun.y, 0.12); vec2 q = p.xz + uKSun.xz * t, mid = uKPlanA.xy + 0.5 / uKPlanA.z;
  if (abs(q.x - mid.x) > 420. || abs(q.y - mid.y) > 420.) return 0.;
  float s = kPlan(q, 0.6).g; vec2 st = uKSun.xz / max(uKSun.y, 0.12);
  for (int i = 1; i <= 12; i++) { float hgt = float(i) * 4.5; vec4 c = kPlan(q + st * hgt, 0.6); s = max(s, c.g * step(hgt, c.r * uKPlanB.x)); }
  return s; }
// the thin shadow of each leg across the wood: a strip from its foot away from the sun, as long as the leg's head is high over the place; paler toward its far end
float kLegShade(vec3 p){
  vec2 a = -uKSun.xz; float hl = max(length(a), 1e-3); a /= hl; float run = hl / max(uKSun.y, 0.12), sh = 0.;
  for (int i = 0; i < 6; i++) { vec2 v = p.xz - uKLeg[i].xy; float t = dot(v, a), far = (uKLeg[i].z - p.y) * run, w = uKLeg[i].w * (1.2 + 2.4 * t / max(far, 1.));
    sh = max(sh, step(0.001, uKLeg[i].w) * step(1.5, t) * (1. - smoothstep(far * 0.96, far, t)) * (1. - smoothstep(w * 0.55, w, abs(v.x * a.y - v.y * a.x))) * mix(0.8, 0.42, clamp(t / max(far, 1.), 0., 1.))); }
  return sh; }
// the kites' and the mills' small shadows playing in the pierced shadow's holes and along its edge (on the clock)
float kFlicker(vec3 p){ vec2 q = p.xz * 0.16; float t = uKTime;
  return smoothstep(0.6, 0.78, kNoise(q + vec2(sin(t * 0.9) * 0.5, cos(t * 0.7) * 0.5)) * 0.55 + kNoise(q * 2.7 + vec2(t * 0.45, -t * 0.3)) * 0.45); }
float kCloudShade(vec3 p){ vec2 q = p.xz * 0.0042 + uKWind.xy * (uKTime * uKWind.z * 0.0042); return smoothstep(0.5, 0.74, kNoise(q) * 0.65 + kNoise(q * 2.3 + 7.1) * 0.35); }
float kOpen(vec2 xz){
  float o = (1. - smoothstep(uKRide.w * 0.55, uKRide.w * 1.1, abs(xz.x - uKRide.x))) * step(uKRide.y, xz.y) * step(xz.y, uKRide.z);
  for (int i = 0; i < 2; i++) o = max(o, 1. - smoothstep(uKGlade[i].z * 0.7, uKGlade[i].z * 1.05 + 0.01, length(xz - uKGlade[i].xy)));
  return o; }
float kDapple(vec3 p){ vec2 q = p.xz * 0.4; float t = uKTime * 0.2;
  return smoothstep(0.4, 0.62, kNoise(q + vec2(t, -t * 0.7)) * 0.6 + kNoise(q * 2.1 - vec2(t * 0.8, t * 0.5) + 3.7) * 0.4); }
// how much of the sun reaches p (n: the face's normal in world space). Over the cloud the city's own shadows are the shadow light's
// (one standing shadow map over the city, see the world file); under it the city's pierced shadow, the legs' and the cloud's lie by place.
float kSunAt(vec3 p, vec3 n){
  if (p.y > uKPlanB.y) return 1.;
  float pc = kPierced(p), near = kPlan(p.xz + uKSun.xz * ((uKPlanA.w - p.y) / max(uKSun.y, 0.12)), 4.).g;
  float s = (1. - uKPlanB.w * pc) * (1. - 0.3 * kFlicker(p) * smoothstep(0.02, 0.2, near) * (1. - pc)) * (1. - kLegShade(p)) * (1. - 0.28 * kCloudShade(p));
  float cover = (1. - kOpen(p.xz)) * (1. - smoothstep(7., 13., p.y)) * uKWind.w;
  return s * mix(1., 0.4 + 0.6 * kDapple(p), cover); }
// under the city's shadow the sky's fill is cut too, and cooler (the city hides part of the sky)
vec3 kFill(vec3 p){ return mix(vec3(1.), vec3(0.56, 0.64, 0.84), kPierced(p) * uKPlanB.w * step(p.y, uKPlanB.y)); }
// THE CLOUD'S STANDING GAPS: 1 where the cloud is open over a place of the world, 0 where it is whole; the gaps' rims are broken by a
// standing unevenness of the place (nothing here moves or reads the eye)
// (a gap's rim is no circle: it wanders by a slow law of the place, 26 m, and a finer one, 9 m: kGapWarp is that wander at a place)
vec2 kGapWarp(vec2 xz){ return 26. * vec2(kNoise(xz * 0.021), kNoise(xz * 0.021 + 31.7)) - 13. + 9. * vec2(kNoise(xz * 0.083 + 5.1), kNoise(xz * 0.083 + 47.)) - 4.5; }
// kGapWay: how much of the straight way from a to b (two wandered places) lies in the gaps' clear air, and tIn: the share of the way
// at which it first comes into cloud. A gap is a round of clear air with a soft rim (from 0.84 to 1.02 of its radius); the open part
// of the way is the mean of its chords in four rounds across that rim, worked out exactly, so a rim seen at any angle is one even
// bank (no steps along the sight line to show as strips).
float kGapWay(vec2 a, vec2 b, out float tIn){
  vec2 d = b - a; float aa = max(dot(d, d), 1e-4), open = 0.; tIn = 0.;
  // THE GAP ABOUT THE LADDER LEG AND THE CITY is a row of four rounds that run into one another, one clear air: its part of the way
  // is from where the way first comes into any of the four to where it last leaves one
  for (int j = 0; j < 4; j++) { float k = 0.8625 + 0.045 * float(j), lo = 2., hi = -1.;
    for (int i = 0; i < 4; i++) { vec2 m = a - uKGap[i].xy; float R = uKGap[i].z * k, bb = dot(d, m), disc = bb * bb - aa * (dot(m, m) - R * R);
      if (disc > 0.) { float s = sqrt(disc); lo = min(lo, (-bb - s) / aa); hi = max(hi, (-bb + s) / aa); } }
    float t0 = clamp(lo, 0., 1.), t1 = clamp(hi, 0., 1.); if (t1 > t0) { open += 0.25 * (t1 - t0); if (lo < 0.) tIn += 0.25 * t1; } }
  for (int i = 4; i < 11; i++) { if (uKGap[i].z < 0.5) continue; vec2 m = a - uKGap[i].xy; float bb = dot(d, m), c0 = dot(m, m);
    for (int j = 0; j < 4; j++) { float R = uKGap[i].z * (0.8625 + 0.045 * float(j)), cc = c0 - R * R, disc = bb * bb - aa * cc;
      if (disc > 0.) { float s = sqrt(disc), t0 = clamp((-bb - s) / aa, 0., 1.), t1 = clamp((-bb + s) / aa, 0., 1.); open += 0.25 * (t1 - t0); if (cc < 0.) tIn += 0.25 * t1; } } }
  tIn = min(tIn, 1.); return min(open, 1.); }
// A GAP'S WALL: where a sight line comes into the cloud through the side of a gap (out of the gap's clear air, inside the body's own
// height) it meets a wall of cloud, and the wall is lit by where it stands: the wall on the gap's side away from the sun faces the
// sun and is white, the wall on the sun's side faces away from it and is blue-grey. kWallSun: 1 on a wall that faces the sun, 0 on
// one that faces away, at a place e of the wall (the nearest gap's middle gives the way the wall faces; the gap about the leg and
// the city by the nearest place of its own middle line).
float kWallSun(vec2 e){
  vec2 ax = uKGap[3].xy - uKGap[0].xy; float t = clamp(dot(e - uKGap[0].xy, ax) / max(dot(ax, ax), 1.), 0., 1.);
  vec2 v = e - (uKGap[0].xy + ax * t), n = v / max(length(v), 1e-3); float best = length(v) / max(mix(uKGap[0].z, uKGap[3].z, t), 1.);
  for (int i = 4; i < 11; i++) { if (uKGap[i].z < 0.5) continue; vec2 w = e - uKGap[i].xy; float q = length(w) / uKGap[i].z; if (q < best) { best = q; n = w / max(length(w), 1e-3); } }
  return clamp(0.5 - 0.75 * dot(n, uKSun.xz / max(length(uKSun.xz), 1e-3)), 0., 1.); }
float kWallK = 0., kWallL = 0.;
// THE CLOUD'S BODY: a slab that lies between two heights, whole but for its standing gaps. How much of a thing at p is lost in it: by
// the length of the sight line that lies inside the slab (as the scene's fog pales a thing by its distance) where that line passes
// through cloud, nothing where it passes through a gap. So a thing is seen clear (through a gap, or with no cloud between) or it is
// in the cloud: the same law for any eye anywhere.
// (the body thickens evenly over its lowest 12 m, is whole from there up to 9 m under its top and thins evenly to nothing at the top:
// its foot and its top are no hard floors. Under the foot hangs a thin skirt of scud, 16 m deep: a fiftieth of the body's thickness at
// the foot, thinning downward to nothing, so that seen from the foot's own height the cloud's underside is no level line. kBody is how
// much body lies under a height)
float kBody(float y){ float c = clamp(y, uKCloud.x, uKCloud.y), e = min(c - uKCloud.x, 12.), d = max(c - (uKCloud.y - 9.), 0.), t = clamp((y - uKCloud.x) / 16. + 1., 0., 1.);
  return e * e / 24. + max(c - uKCloud.x - 12., 0.) - d * d / 18. + 0.02 * (16. / 3. * t * t * t + e); }
// hIn: the height (0 at the body's foot, 1 at its top) at which the sight line first comes into cloud; dIn: how far from the eye
float kHaze(vec3 p, out float hIn, out float dIn){
  float y0 = cameraPosition.y, y1 = p.y, len = distance(cameraPosition, p), dy = abs(y1 - y0);
  float a = clamp(y0, uKCloud.x, uKCloud.y), b = clamp(y1, uKCloud.x, uKCloud.y);
  hIn = (a - uKCloud.x) / (uKCloud.y - uKCloud.x); dIn = 0.; kWallK = 0.; kWallL = 0.;
  float inside = dy > 0.02 ? len * abs(kBody(y1) - kBody(y0)) / dy : len * (kBody(y0 + 0.5) - kBody(y0 - 0.5));
  if (inside < 0.02) return 0.;
  // how much of that part lies in cloud and not in a gap (kGapWay over the part, the rim's wander taken at its two ends): a thing
  // beyond a stretch of whole cloud is lost though the line then comes out into a gap. Where the line first comes into cloud gives
  // hIn and dIn.
  float f0 = dy > 0.02 ? clamp((a - y0) / (y1 - y0), 0., 1.) : 0., f1 = dy > 0.02 ? clamp((b - y0) / (y1 - y0), 0., 1.) : 1., tIn;
  vec2 xa = mix(cameraPosition.xz, p.xz, f0), xb = mix(cameraPosition.xz, p.xz, f1);
  float open = kGapWay(xa + kGapWarp(xa), xb + kGapWarp(xb), tIn);
  // A GAP IS A WELL, NOT A LANE: a sight line that runs far along inside the body's own height finds no clear way down the wells (their
  // rims' heaps close ranks across it): the wells' clear air counts whole for a run of 60 m inside the body and less, for nothing
  // from 300 m, lost slowly at first (by the fourth power of the way between the two). So a gap is seen into from above and from
  // below, never along the cloud as a flat slit.
  { float kRun = clamp((distance(xa, xb) - 60.) / 240., 0., 1.); open *= 1. - kRun * kRun * kRun * kRun; }
  hIn = (mix(a, b, tIn) - uKCloud.x) / (uKCloud.y - uKCloud.x); dIn = len * mix(f0, f1, tIn);
  // (through a gap's side: the way begins in a gap's clear air and comes into cloud further on)
  kWallK = smoothstep(0.02, 0.12, tIn) * (1. - smoothstep(0.985, 1., tIn)); kWallL = kWallK > 0. ? kWallSun(mix(xa, xb, tIn)) : 0.;
  return 1. - exp(-uKCloud.z * inside * (1. - open)); }
// THE CLOUD'S FACE. q: the place where the sight line from the eye to p comes into the cloud's body (through its top from over it,
// through its foot from under it; where the line starts, when it starts inside the body), carried with the high wind on the world's
// clock as the kit's heaps are (the gaps stand).
vec2 kHazeAt(vec3 p){
  float y0 = cameraPosition.y, dy = p.y - y0;
  return mix(cameraPosition.xz, p.xz, abs(dy) > 0.02 ? clamp((clamp(y0, uKCloud.x, uKCloud.y) - y0) / dy, 0., 1.) : 0.) - uKWind.xy * (1.6 * uKTime); }
float kCloudH(vec2 q){ return kNoise(q * 0.016) * 0.65 + kNoise(q * 0.045 + 5.) * 0.35; }
// its colour there, by the HEIGHT at which the sight line comes into the body (the body's own colour by height: a law of place): at
// its foot a mottled underside (dark bellies, paler thin places), at its top a floor of heaps and hollows lit from the sun's side,
// between the two inside it. (fw, in metres of the face: THE LONGER of the picture's grain on the face (kGrain) and the sight
// line's own way through the body's soft depth (kSoftWay); the relief is smoothed away where it is finer than that length, as a
// texture's mip levels are; nothing else here reads the picture)
// hIn, dIn: see kHaze. THE FACE'S MARKINGS GO INTO THEIR OWN MEAN WHERE THAT LENGTH IS LONGER THAN THEY ARE, AND FOR NO OTHER REASON:
// they are whole where it is 14 m or less and gone where it is 34 m (the billows and heaps are 22 to 90 m across); the broad hollows
// likewise from 58 m to 142 m. Nothing of them goes by a bearing's threshold, by the line or by a moment of the visit: the two
// lengths are the picture's own and the body's own, the same for every eye, and no number is set here for them.
// The underside pales into the far air's colour by the distance at which the line comes into it (uKAir: the colour, and
// one over the distance at which it is two thirds paled), as everything under a cloud does.
// kGrain: THE PICTURE'S GRAIN ON THE FACE, as a texture's filter takes it: one picture element covers a strip of the face, as long
// as the face's place q changes from this element to the next one sideways and to the next one upward; seen at a low angle the
// strip is long along the look and short across it, and the grain is THE LONGER of the two lengths (in metres of the face).
float kGrain(vec2 q){ vec2 gx = dFdx(q), gy = dFdy(q); return sqrt(max(dot(gx, gx), dot(gy, gy))); }
// kSoftWay: THE SIGHT LINE'S WAY THROUGH THE BODY'S SOFT DEPTH, in metres of the face (in plan). The body has no skin: its top thins
// over 9 m and its foot thickens over 12 m (kBody), so the face's colour is not met at one place but gathered along the line, from
// where the line comes into the body's height (where q is taken; the eye itself, when it is inside) to where its haze from there on
// is whole but for one part in e (kHaze's own exponent, uKCloud.z a metre of the line in the body, come to one), or to the thing
// looked at, or to where the line leaves the body's height again, whichever is first. A marking shorter than that way is seen through
// its neighbours. The way is found on kBody itself, by halving the height between the two twelve times, and laid flat by the angle
// at which the line meets the level face: from over the top, about 8 m of the face at 45 degrees, 15 m at 21, 22 m at 10, 34 m at
// 4.5, 41 m at 3, 72 m at 1; through the foot 9, 16, 25, 36, 44 and 70 m; from the body's whole middle about 5 m. (the two floors
// of a thousandth are guards against a division by nothing, not measures: at a slope of a thousandth the way from outside the body
// is some 300 m, beyond every marking's length)
float kSoftWay(vec3 p){
  vec3 d = p - cameraPosition; float sg = max(abs(d.y) / max(length(d), 1e-3), 1e-3);
  float a = clamp(cameraPosition.y, uKCloud.x, uKCloud.y), b = clamp(p.y, uKCloud.x, uKCloud.y), up = b < a ? -1. : 1., lo = 0., hi = abs(b - a);
  float b0 = kBody(a), want = sg / max(uKCloud.z, 1e-4);
  if (abs(kBody(b) - b0) > want) for (int i = 0; i < 12; i++) { float m = 0.5 * (lo + hi); if (abs(kBody(a + up * m) - b0) < want) lo = m; else hi = m; }
  return hi * sqrt(1. - sg * sg) / sg; }
vec3 kHazeTint(vec2 q, float fw, float hIn, float dIn){
  float over = smoothstep(0., 1., hIn), keep = clamp(1.7 - fw * 0.05, 0., 1.);
  // THE UNDERSIDE: grey-blue billows, dark bellies and paler thin places between them (where the billows are finer than the picture,
  // the underside takes their MEAN tone: 0.48 of the way from the darkest to the palest, counted over the law)
  float n0 = kNoise(q * 0.011) * 0.6 + kNoise(q * 0.029 + 17.3) * 0.4, belly = mix(0.48, smoothstep(0.28, 0.74, n0), keep);
  // (the body hides the sun: its underside is grey, darker than the sky that shows through its gaps and than the gaps' lit walls)
  vec3 under = uKCloudCol * mix(vec3(0.36, 0.41, 0.55), vec3(0.8, 0.83, 0.92), belly);
  float hx = kCloudH(q + vec2(9., 0.)) - kCloudH(q - vec2(9., 0.)), hz = kCloudH(q + vec2(0., 9.)) - kCloudH(q - vec2(0., 9.)), hh = kCloudH(q);
  // (the top's light where its heaps cannot be told apart: the mean of the law, 0.53)
  float lit = mix(0.53, clamp(0.58 - 5.6 * dot(vec2(hx, hz), uKSun.xz), 0., 1.) * (0.8 + 0.34 * hh), keep);
  // (and broad hollows, a quarter of a kilometre across, lying bluer and darker than the shelves between them; where they are finer
  // than the picture the top takes the MEAN of hollow and shelf: 0.915, 0.945, 1, the law's mean hollow of 0.424 counted over 60 km)
  float hollow = 1. - smoothstep(0.3, 0.6, kNoise(q * 0.0042 + 9.3)), keepB = clamp(1.7 - fw * 0.012, 0., 1.);
  vec3 top = uKCloudCol * mix(vec3(0.6, 0.68, 0.9), vec3(1.2, 1.17, 1.1), lit) * mix(vec3(0.915, 0.945, 1.), mix(vec3(1.), vec3(0.8, 0.87, 1.), hollow), keepB);
  under = mix(under, uKAir.rgb, 1. - exp(-dIn * dIn * uKAir.w * uKAir.w));
  // A GAP'S WALL (see kWallSun): white where it faces the sun, blue-grey where it faces away, darker toward its foot, where less of
  // the sky lights it; and bluer toward the far air like the underside
  vec3 wall = uKCloudCol * mix(vec3(0.56, 0.64, 0.86), vec3(1.2, 1.17, 1.1), kWallL * (0.6 + 0.4 * hIn)) * (0.86 + 0.14 * hIn);
  return mix(mix(under, top, over), wall, kWallK); }
void kHazeOver(inout vec3 col, vec3 p){
  vec2 q = kHazeAt(p); float hIn, dIn, fw = max(kGrain(q), kSoftWay(p)), a = kHaze(p, hIn, dIn);
  if (a > 0.004) col = mix(col, kHazeTint(q, fw, hIn, dIn), a); }
// THE STREAM'S LINE: its x at a z of the world. Near the ride it is the plan's own law (streamX: 124 and 194 are the entry's z + 14 and
// + 84, where it swings away from the ride); from 170 m off it wanders more and more, as a stream of the far country does.
float kStreamX(float z){
  float far = smoothstep(170., 620., abs(z - 40.));
  return uKStream.x + uKStream.y * (10. + uKStream.z * sin(z * 0.043 + uKStream.w) + 1.5 * sin(z * 0.117 + uKStream.w * 1.7) + 44. * smoothstep(124., 194., z))
    + far * (90. * sin(z * 0.0062 + uKStream.w * 2.1) + 38. * sin(z * 0.0171 + uKStream.w)); }
// THE FAR COUNTRY'S OPEN PLACES on the wood's roof: returns 1 on open ground (a glade, a ride, the stream's banks), 0 on the crowns;
// sh is the shade that the wall of trees on the sunward side throws on that open ground, water is 1 on the stream itself
float kOpenLand(vec2 p, out float sh, out float water){
  float o = 0.; sh = 0.; vec2 sdir = uKSun.xz / max(uKSun.y, 0.2) * 20.;
  vec2 q = p + 9. * vec2(kNoise(p * 0.05), kNoise(p * 0.05 + 11.3)) - 4.5;
  for (int i = 0; i < 6; i++) { float r = uKFar[i].z, d = length(q - uKFar[i].xy), in1 = step(0.5, r) * (1. - smoothstep(r - 2., r + 2., d));
    o = max(o, in1); sh = max(sh, in1 * smoothstep(r - 3., r + 3., length(q + sdir - uKFar[i].xy))); }
  for (int i = 0; i < 3; i++) { float hw = uKWay[i].w; vec2 dir = vec2(sin(uKWay[i].z), cos(uKWay[i].z)), v = q - uKWay[i].xy, v2 = v + sdir;
    float in1 = step(0.5, hw) * step(0., dot(v, dir)) * (1. - smoothstep(hw - 1.5, hw + 1.5, abs(v.x * dir.y - v.y * dir.x)));
    o = max(o, in1); sh = max(sh, in1 * smoothstep(hw - 2., hw + 2., abs(v2.x * dir.y - v2.y * dir.x))); }
  float sl = kStreamX(p.y + 1.) - kStreamX(p.y), k = inversesqrt(1. + sl * sl), w = 3.2 + 4.5 * smoothstep(170., 900., abs(p.y - 40.));
  float sd = abs(p.x - kStreamX(p.y)) * k, in2 = 1. - smoothstep(w + 2., w + 7., abs(q.x - kStreamX(q.y)) * k);
  o = max(o, in2); sh = max(sh, in2 * smoothstep(w + 3., w + 8., abs(q.x + sdir.x - kStreamX(q.y + sdir.y)) * k));
  water = 1. - smoothstep(w - 0.8, w + 0.8, sd);
  return o; }
`;

// Give a kit material (flora's leaves, the terrain) the place's light: its direct light is multiplied by kSunAt at
// the fragment's place in the world. The patch is chained after the kit's own; if a kit text it looks for is ever
// absent the material simply keeps the kit's light.
export function placePatch(mat, U, name = 'k', albedo = '', after = '') {
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, U);
    // after the last thing the kit adds to the direct light (flora: its wrapped and through-the-leaf light), else after the lights themselves
    const mine = '\n{ vec3 kW = cameraPosition + (vec4(-vViewPosition, 0.) * viewMatrix).xyz; reflectedLight.directDiffuse *= kSunAt(kW, vec3(0., 1., 0.)); reflectedLight.indirectDiffuse *= kFill(kW); }\n';
    const floraEnd = 'reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);', at = sh.fragmentShader.includes(floraEnd) ? floraEnd : '#include <lights_fragment_end>';
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + KIT_PLACE_GLSL).replace(at, at + mine)
      .replace('#include <fog_fragment>', '#include <fog_fragment>\n{ vec3 kW = cameraPosition + (vec4(-vViewPosition, 0.) * viewMatrix).xyz; kHazeOver(gl_FragColor.rgb, kW); }\n' + after);
    // 'albedo': GLSL that may change diffuseColor by the place kW (a leaf mottle on the canopy's shell)
    if (albedo) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 kW = cameraPosition + (vec4(-vViewPosition, 0.) * viewMatrix).xyz; ' + albedo + ' }\n');
  };
  mat.customProgramCacheKey = () => key + '-stilts-' + name;
  return mat;
}

// THE KIT'S CLOUD HEAPS take the cloud body's haze as every other thing here does: a heap's colour is carried toward the haze's by the
// length of the sight line that lies inside the slab (kHaze at the fragment's place), so that inside the cloud a heap melts into the
// same pale air as the leg and the sky behind it, and nothing of it stands out with an edge. The kit's material is given the place's
// uniforms and two lines of text; where the kit's own text is not as expected the heap simply keeps the kit's look.
export function hazePuffs(mat, U) {
  const head = 'void main(){', end = 'gl_FragColor = vec4(col, a);';
  if (!mat || !mat.fragmentShader || !mat.uniforms || !mat.fragmentShader.includes(head) || !mat.fragmentShader.includes(end) || !mat.fragmentShader.includes('vWorld')) return false;
  Object.assign(mat.uniforms, U);
  mat.fragmentShader = mat.fragmentShader.replace(head, KIT_PLACE_GLSL + '\n' + head).replace(end, '{ vec2 kQ = kHazeAt(vWorld); float kH, kD, kF = max(kGrain(kQ), kSoftWay(vWorld)), kA = kHaze(vWorld, kH, kD); if (kA > 0.004) col = mix(col, kHazeTint(kQ, kF, kH, kD), kA); }\n  ' + end);
  mat.needsUpdate = true; return true;
}
// THE KIT'S CREATURES (birds, deer, butterflies) take the cloud body's haze too: a bird beyond the cloud is lost in it like the leg,
// not seen through it. Every creature material under 'root' whose text is as the kit writes it (its world place in vWorld, its
// colour set before the fog) is given the place's uniforms and one line after the fog; any other is left as the kit made it.
export function hazeCreatures(root, U) {
  let n = 0;
  root.traverse((o) => {
    const mat = o.material, head = 'void main(){', fog = '#include <fog_fragment>';
    if (!mat || !mat.isShaderMaterial || !mat.uniforms || mat.userData.stiltsHaze || typeof mat.fragmentShader !== 'string') return;
    if (!mat.fragmentShader.includes('vec3 gEmitF') || !mat.fragmentShader.includes('vWorld') || !mat.fragmentShader.includes(head) || !mat.fragmentShader.includes(fog)) return;
    Object.assign(mat.uniforms, U);
    mat.fragmentShader = mat.fragmentShader.replace(head, KIT_PLACE_GLSL + '\n' + head).replace(fog, fog + '\n  { vec2 kQ = kHazeAt(vWorld); float kH, kD, kF = max(kGrain(kQ), kSoftWay(vWorld)), kA = kHaze(vWorld, kH, kD); if (kA > 0.004) gl_FragColor.rgb = mix(gl_FragColor.rgb, kHazeTint(kQ, kF, kH, kD), kA); }');
    mat.userData.stiltsHaze = true; mat.needsUpdate = true; n++;
  });
  return n;
}
// THE KIT'S SMOKE (a veil of puffs whose colour is already weighed by its cover) is lost in the cloud's body too: its colour and its
// cover are both faded by the body's haze between the eye and it. Only a material whose text is as the kit writes it (its world place
// in vWorld, one main, its colour set as colour times cover) is touched; any other is left as the kit made it.
export function hazeVeil(mat, U) {
  const head = 'void main(){';
  if (!mat || !mat.isShaderMaterial || !mat.uniforms || mat.userData.stiltsHaze || typeof mat.fragmentShader !== 'string') return false;
  const f = mat.fragmentShader, end = f.lastIndexOf('}');
  if (end < 0 || !f.includes('vWorld') || !f.includes(head) || !f.includes('gl_FragColor = vec4(col*a')) return false;
  Object.assign(mat.uniforms, U);
  mat.fragmentShader = (f.slice(0, end) + '  { float kH, kD; gl_FragColor *= 1. - kHaze(vWorld, kH, kD); }\n' + f.slice(end)).replace(head, KIT_PLACE_GLSL + '\n' + head);
  mat.userData.stiltsHaze = true; mat.needsUpdate = true; return true;
}
// ---------------------------------------------------------------- the two materials of everything built here
const KIT_VERT = /* glsl */`
attribute float aMat;
varying vec3 vKitW; varying vec3 vKitN; varying float vMat;
uniform float uKTime;
#ifdef KIT_ANIM
attribute vec4 aAnim; attribute vec3 aPivot; attribute vec3 aAxis;
uniform vec4 uKWalk; uniform vec4 uKStair[6];
vec3 kRot(vec3 v, vec3 a, float t){ float c = cos(t), s = sin(t); return v * c + cross(a, v) * s + a * dot(a, v) * (1. - c); }
#endif
void kitAnim(inout vec3 p, inout vec3 n){
#ifdef KIT_ANIM
  float kind = floor(aAnim.x + .5), ph = aAnim.y;
  // SPIN about aAxis through aPivot: p1 radians a second
  if (kind == 1.) {
    float a = uKTime * aAnim.z + ph; p = aPivot + kRot(p - aPivot, aAxis, a); n = kRot(n, aAxis, a);
  // SCOPE: sweeps about its own aim (aAxis) by p1 radians, one round in p2 seconds
  } else if (kind == 2.) {
    vec3 e1 = normalize(cross(aAxis, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), e2 = cross(aAxis, e1); float w = 6.2831853 / max(aAnim.w, 1.);
    float a1 = aAnim.z * sin(uKTime * w + ph), a2 = aAnim.z * 0.7 * sin(uKTime * w * 0.61 + ph * 1.7);
    p = aPivot + kRot(kRot(p - aPivot, e1, a1), e2, a2); n = kRot(kRot(n, e1, a1), e2, a2);
  // SWAY: a pendulum about aPivot, p1 radians at p2 radians a second, about aAxis and the level line square to it
  } else if (kind == 3.) {
    vec3 e2 = normalize(cross(aAxis, vec3(0., 1., 0.)) + vec3(0., 0., 1e-5));
    float a1 = aAnim.z * sin(uKTime * aAnim.w + ph), a2 = aAnim.z * 0.6 * sin(uKTime * aAnim.w * 0.73 + ph * 2.3);
    p = aPivot + kRot(kRot(p - aPivot, aAxis, a1), e2, a2); n = kRot(kRot(n, aAxis, a1), e2, a2);
  // FLUTTER: cloth moves along aAxis by up to 0.9 x p1 metres; p2 waves a metre
  } else if (kind == 4.) {
    float w = sin(uKTime * 3.1 + ph + dot(p, vec3(1.3, 0.9, 1.1)) * aAnim.w) + 0.5 * sin(uKTime * 5.3 + ph * 1.7 + dot(p, vec3(-0.8, 1.7, 0.6)) * aAnim.w);
    p += aAxis * (aAnim.z * w * 0.6);
  // TRAVEL: along aAxis by p1 metres and back, one round in p2 seconds
  } else if (kind == 5.) {
    p += aAxis * (aAnim.z * (0.5 - 0.5 * cos(uKTime * 6.2831853 / max(aAnim.w, 1.) + ph)));
  // LINE: p on the centre line, aAxis its direction, p1 the side times half its own width (a cord is as thick as it is, at any distance;
  // the ribbon only turns its flat to the eye, as a round cord shows the same width from every side); sways about aPivot by p2 radians like its kite
  } else if (kind == 6.) {
    float rate = 0.5 + fract(ph * 0.37) * 0.5; vec3 e2 = normalize(cross(vec3(1., 0., 0.), vec3(0., 1., 0.)));
    float a1 = aAnim.w * sin(uKTime * rate + ph), a2 = aAnim.w * 0.6 * sin(uKTime * rate * 0.73 + ph * 2.3);
    p = aPivot + kRot(kRot(p - aPivot, vec3(1., 0., 0.), a1), e2, a2); vec3 t = kRot(kRot(aAxis, vec3(1., 0., 0.), a1), e2, a2);
    vec3 toEye = (inverse(modelMatrix) * vec4(cameraPosition, 1.)).xyz - p; float dist = length(toEye); vec3 side = normalize(cross(t, toEye) + vec3(0., 1e-5, 0.));
    p += side * aAnim.z; n = toEye / max(dist, 1e-3);
  // WALK: a figure of the stair street (built at aPivot, facing +z; its phase is its metres round the circuit at time 0) goes round the
  // circuit at the street's pace: up the one file, across, down the other, across; its height is the flights' own, tread by tread
  // (going up, the foot rises in the last six tenths of a tread before a riser; going down, it sinks in the first six tenths after
  // it). aAxis.x marks a leg (-1, 1), aAxis.z an arm: they swing with the stride. The plan's walkAt is this same law.
  } else if (kind == 7.) {
    float xf = uKWalk.x, zA = uKWalk.y, zB = uKWalk.z, lf = zB - zA, len = 2. * lf + 4. * xf, s = mod(ph + uKTime * uKWalk.w, len), hh = 0.5;
    float c1 = lf, c2 = lf + 2. * xf, c3 = 2. * lf + 2. * xf;
    vec2 xz = s < c1 ? vec2(-xf, zA + s) : (s < c2 ? vec2(s - c1 - xf, zB) : (s < c3 ? vec2(xf, zB - (s - c2)) : vec2(xf - (s - c3), zA)));
    float yaw = 1.5707963 * (smoothstep(c1 - hh, c1 + hh, s) + smoothstep(c2 - hh, c2 + hh, s) + smoothstep(c3 - hh, c3 + hh, s) + smoothstep(len - hh, len + hh, s) + smoothstep(-hh, hh, s) - 1.);
    float y = 0.;
    for (int i = 0; i < 6; i++) { vec4 st = uKStair[i]; float nt = i < 5 ? 18. : 8.; float dz = (st.y - st.x) / nt; float u = (xz.y - st.x) / dz + (st.w > st.z ? 0.8 : 0.2); y += (st.w - st.z) / nt * clamp(floor(u) + smoothstep(0.2, 0.8, fract(u)), 0., nt); }
    vec3 q = p - aPivot; float sw = sin(s * 4.4);
    q.z += (aAxis.x * 0.3 * clamp(1. - q.y / 0.95, 0., 1.) + aAxis.z * 0.16 * clamp((1.5 - q.y) / 0.6, 0., 1.)) * sw; q.y += 0.03 * abs(sw);
    float cy = cos(yaw), sy = sin(yaw);
    p = vec3(xz.x + q.x * cy + q.z * sy, y + q.y, xz.y - q.x * sy + q.z * cy); n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
  }
#endif
}`;
const KIT_FRAG = /* glsl */`
varying vec3 vKitW; varying vec3 vKitN; varying float vMat;
// what a surface is made of: m is the kind (see MAT); c its colour, spec the strength of its glint, emit its own light
void kitSurface(inout vec3 c, float m, vec3 p, vec3 n, out float spec, out vec3 emit){
  spec = 0.; emit = vec3(0.);
  // plaster: mottled, with the weather's runs down it
  if (m == 1.) { c *= (0.9 + 0.2 * kNoise(p.xz * 1.1 + p.y * 0.7)) * (0.9 + 0.17 * kNoise(vec2((p.x + p.z) * 2.6, p.y * 0.22))); }
  else if (m == 2.) {
    float u = (abs(n.y) > 0.6 ? p.x : p.x + p.z) / 0.34, w = fwidth(u);
    float gap = smoothstep(0.42, 0.5, abs(fract(u) - 0.5)), tint = 0.86 + 0.28 * kHash(vec2(floor(u), 3.7));
    // (far off, where the boards are finer than the picture's grain, the surface takes the mean of its own near law: 0.964; so each kind below)
    c *= mix(0.964, tint * (1. - 0.45 * gap), clamp(1.4 - w * 2., 0., 1.));
  } else if (m == 3.) {
    vec2 hn = n.xz; float hl = max(length(hn), 1e-3); vec2 td = vec2(-hn.y, hn.x) / hl;
    float v = p.y / 0.26, u0 = dot(p.xz, td) / 0.32, w = max(fwidth(v), fwidth(u0)), u = u0 + 0.5 * floor(v);
    float sh = (0.78 + 0.34 * fract(v)) * (0.88 + 0.24 * kHash(vec2(floor(u), floor(v)))) * (1. - 0.3 * smoothstep(0.4, 0.5, abs(fract(u) - 0.5)));
    c *= mix(0.92, sh, clamp(1.3 - w * 1.6, 0., 1.));
  } else if (m == 4.) {
    // staves: boards about 0.3 m wide running up, butted at staggered joints
    float u = (p.x * 0.83 + p.z * 0.56) / 0.3, w = fwidth(u), id = floor(u), v = p.y / 3.3 + kHash(vec2(id, 1.3));
    float gap = smoothstep(0.38, 0.5, abs(fract(u) - 0.5)), joint = smoothstep(0.47, 0.5, abs(fract(v) - 0.5)), tint = 0.8 + 0.3 * kHash(vec2(id, 7.1)) + 0.08 * kHash(vec2(id, floor(v)));
    c *= mix(0.932, tint * (1. - 0.45 * gap) * (1. - 0.16 * joint), clamp(1.4 - w * 2., 0., 1.)) * (0.9 + 0.2 * kNoise(vec2(u * 0.7, p.y * 0.22)));
  }
  else if (m == 5.) { spec = 0.5; }
  else if (m == 6.) { spec = 2.4; c *= 0.9 + 0.2 * kNoise(p.xz * 5. + p.y * 3.); }
  else if (m == 7.) { spec = 3.; }
  // a window: by night its lamp is lit; by day a lamp burns in a few of the rooms whose front is turned away from the sun (one window in
  // five of a shaded front, by the window's own place)
  else if (m == 8.) { spec = 1.2; vec2 wc = floor(p.xz * 0.45) + floor(p.y * 0.4);
    emit = vec3(1., 0.72, 0.38) * (3.2 * uKPlanB.z + 1.5 * (1. - uKPlanB.z) * step(dot(n, uKSun), -0.08) * step(0.8, kHash(wc + 3.1))) * (0.55 + 0.45 * kHash(wc)); }
  else if (m == 9.) { emit = vec3(1., 0.78, 0.45) * (0.9 + 2.6 * uKPlanB.z); }
  else if (m == 10.) { c *= 0.94 + 0.1 * kNoise(p.xz * 3. + p.y * 2.); }
  else if (m == 11.) { c *= 0.72 + 0.56 * kNoise(p.xz * 2.3 + p.y * 1.9); }
  else if (m == 12.) { spec = 1.5; c *= 0.8 + 0.4 * kNoise(vec2((p.x + p.z) * 3., p.y * 1.5 + uKTime * 2.5)); }
  else if (m == 13.) {
    // courses of dressed stone, 0.46 m high, the blocks about 1 m long and broken joint
    vec2 q = abs(n.y) > 0.6 ? p.xz / 0.92 : vec2((abs(n.x) > abs(n.z) ? p.z : p.x) / 1.02, p.y / 0.46);
    float v = q.y, u = q.x + 0.5 * floor(v), w = max(fwidth(u), fwidth(v));
    float mort = max(smoothstep(0.44, 0.5, abs(fract(u) - 0.5)), smoothstep(0.42, 0.5, abs(fract(v) - 0.5))), tint = 0.84 + 0.3 * kHash(vec2(floor(u), floor(v)));
    c *= mix(0.945, tint * (1. - 0.34 * mort), clamp(1.3 - w * 1.6, 0., 1.)) * (0.92 + 0.16 * kNoise(p.xz * 0.9 + p.y * 1.3));
  } else if (m == 14.) {
    // a leg's mast: nine great balks standing round its heart (told apart by the way the round's own side faces), a dark seam between
    // each two, each balk its own tone, grain running up it, butted every 7.5 m at staggered heights; the weather on it: dark runs
    // down its sides, green on its foot under the wood's roof
    float ang = atan(n.z, n.x) / 6.2831853 * 9. + 0.5, id = floor(ang), f = fract(ang), w = length(fwidth(n.xz)) * 1.5;
    float seam = smoothstep(0.4, 0.5, abs(f - 0.5)), v = p.y / 7.5 + kHash(vec2(id, 2.3)), joint = smoothstep(0.485, 0.5, abs(fract(v) - 0.5));
    float tint = 0.78 + 0.34 * kHash(vec2(id, floor(v))), grain = (0.8 + 0.4 * kNoise(vec2(ang * 9., p.y * 0.35))) * (0.9 + 0.2 * kNoise(vec2(ang * 37., p.y * 0.09))), run = kNoise(vec2(ang * 1.7, p.y * 0.045));
    // (far off, where the balks are finer than the picture's grain, the mast takes the mean of tone, seam and joint: 0.893, counted)
    c *= mix(0.893, tint * (1. - 0.55 * seam) * (1. - 0.3 * joint), clamp(1.5 - w * 2.5, 0., 1.)) * grain * (0.74 + 0.4 * run);
    c = mix(c, c * vec3(0.7, 0.96, 0.58), (1. - smoothstep(6., 46., p.y)) * (0.3 + 0.45 * run));
  }
}`;
export function makeKitMaterials(U) {
  const make = (anim) => {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    if (anim) m.defines = { KIT_ANIM: 1 };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + KIT_VERT)
        .replace('#include <beginnormal_vertex>', 'vec3 kP = position; vec3 kN = normal; kitAnim(kP, kN); vec3 objectNormal = kN;')
        .replace('#include <begin_vertex>', 'vec3 transformed = kP;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\n vKitW = (modelMatrix * vec4(transformed, 1.)).xyz; vKitN = normalize(mat3(modelMatrix) * objectNormal); vMat = aMat;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + KIT_PLACE_GLSL + KIT_FRAG)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float kM = floor(vMat + 0.5), kSpec = 0.; vec3 kEmit = vec3(0.), kNw = normalize(vKitN) * (gl_FrontFacing ? 1. : -1.);
          kitSurface(diffuseColor.rgb, kM, vKitW, kNw, kSpec, kEmit);`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          { float kS = kSunAt(vKitW, kNw); reflectedLight.directDiffuse *= kS; reflectedLight.indirectDiffuse *= kFill(vKitW);
          // above the cloud its bright floor throws light up under everything (most on what looks down, a little on walls); by night the fill is less blue
          reflectedLight.indirectDiffuse += diffuseColor.rgb * uKCloudCol * (uKCloud.w * max(0.25 - 0.75 * kNw.y, 0.) * step(uKPlanB.y, vKitW.y));
          // under the cloud its whole pale ceiling lights what stands in the wood (most on what looks up, three fifths on upright faces)
          reflectedLight.indirectDiffuse += diffuseColor.rgb * uKCloudCol * (uKCloud.w * (0.6 + 0.4 * kNw.y) * (1. - step(uKPlanB.y, vKitW.y)));
          reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, vec3(dot(reflectedLight.indirectDiffuse, vec3(0.333))) * vec3(0.86, 0.96, 1.18), 0.55 * uKPlanB.z);
          #if NUM_DIR_LIGHTS > 0
            vec3 kH = normalize(directionalLights[0].direction + normalize(vViewPosition));
            reflectedLight.directDiffuse += directionalLights[0].color * (kSpec * kS * pow(max(dot(normal, kH), 0.), 42.)) * mix(vec3(1.), diffuseColor.rgb * 3., step(5.5, kM) * step(kM, 6.5));
          #endif
          totalEmissiveRadiance += kEmit; }`)
        .replace('#include <fog_fragment>', '#include <fog_fragment>\n kHazeOver(gl_FragColor.rgb, vKitW);');
    };
    m.customProgramCacheKey = () => 'stilts-kit-' + (anim ? 'a' : 's');
    return m;
  };
  return { solid: make(false), moving: make(true) };
}

// THE CLOUD'S HAZE OVER THE SKY: a great ball standing about the place (it follows nothing), clear but for the cloud's
// haze by the same law as on every other thing: from under or inside the slab the sky beyond is paled as the mast is.
export function makeHazeSky(U, radius = 3300) {
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
    vertexShader: 'varying vec3 vHazeW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vHazeW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: KIT_PLACE_GLSL + 'varying vec3 vHazeW; void main(){ vec2 q = kHazeAt(vHazeW); float hIn, dIn, fw = max(kGrain(q), kSoftWay(vHazeW)), a = kHaze(vHazeW, hIn, dIn); if (a < 0.004) discard; gl_FragColor = vec4(kHazeTint(q, fw, hIn, dIn), a); }',
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), mat); mesh.name = 'haze-sky'; mesh.renderOrder = 1; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the place as arithmetic
// THE FRAME. The stilt we climb (S0, the ladder leg) stands at the origin, north is -z, heights are metres over S0's
// foot. The plan is worked out for the hand +1 (the route rounds S0 and goes up the city's west side, -x) and mirrored in x
// at the end for the hand -1. The city stands to the north-east of S0; its own frame: (lx, lz) = (x - cityX, z - cityZ),
// y measured from the lowest deck.
// WHY THESE NUMBERS (each is a measure of the place, not of a picture):
//   cityX, cityZ  the city's middle from S0: 269 m, the length of the gangway that S0's head carries plus the raft's half
//   R             the round we fly about S0: 30 m, twenty times the leg's own radius (the landings reach 4.2 m)
//   railOut/railUp the line beside the west rail: 13 m outside it and 7 m over the lowest deck (near enough to read the rail's stations,
//                 their spyglasses and their watchers)
//   LANE          clear air kept about the line: 2.5 m and the thing's whole reach, everywhere (the line's only say in the plan)
//   streetFoot    the stair street is broader at its foot: on the lowest deck its houses stand 1.5 m further back than on the terraces
//   jettyLen      the jetty from 3 m inside the summit's south edge to the ring: 100 m (a landing, a flight of steps down, 90 m of walk; the raft's south rail lies under its 36th metre, the last 64 m hang over the cloud's great hole)
//   slab          the cloud's own body under its tops: from 30 m under them to 4 m under them
//   well          the cloud's well about the ladder leg (the first round of the gap about the leg and the city): 64 m, 1.6 times the
//                 glade at the leg's foot, so that the well's open middle stands over the glade
export const DIM = { R: 30, EYE: 4.4, LANE: 2.5, deckY: 268, raft: 6, lift: 9, cityX: 185, cityZ: -195, rideHalf: 7, glade: 40, entryZ: 110, backRide: 365, cutIn: 11, cutOut: 30, streetHalf: 8, streetFoot: 9.5, planSize: 320, planRes: 256, woodKeep: 0.68, coverKeep: 0.75, mastR: 1.5, railOut: 13, railUp: 7, jettyLen: 100, slab: [30, 4], holeDown: 32, holeSide: 39, climbSide: 57, climbUp: 6, well: 64 };
const STREAMS = ['lay', 'hour', 'wood', 'stilts', 'city', 'houses', 'wells', 'scopes', 'people', 'kites', 'mills', 'tubs', 'wash', 'trees', 'mast', 'deer', 'far', 'lamps', 'dew', 'gardens', 'ferns', 'stones', 'smoke', 'roofs', 'great', 'walls', 'folk', 'gaps', 'stalls', 'square', 'lines', 'gang'];
export const HOURS = ['day', 'day', 'day', 'day', 'golden', 'golden', 'dawn', 'night'];
// the sun (or the moon) by the hour: elevation, and its bearing as degrees off north toward the hand's side (the west, for the hand +1)
const HOUR_SUN = { day: [32, 36, 44], golden: [17, 58, 74], dawn: [13, 46, 64], night: [44, 34, 44] };

export async function stiltsPlan(seed, vary = {}, tick = async () => {}) {
  const R = {}; for (const k of STREAMS) R[k] = makeRng(hashSeed(k + ':' + seed));
  const noise = makeNoise(hashSeed('stilts-ground:' + seed)), n2 = noise.n2, ss = smoothstep;
  const lay = R.lay, D = DIM;
  const hourDrawn = R.hour.pick(HOURS), hourName = HOUR_SUN[vary.hour] ? vary.hour : hourDrawn;
  const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3), dens = lerp(1, density, 0.35) * (vary.detail !== undefined && vary.detail < 1 ? 0.6 + 0.4 * vary.detail : 1);
  const h = lay.chance(0.5) ? 1 : -1;
  // canonical (hand +1): the sun stands beyond the city, a little to the hand's side, so the city's shadow falls beside S0's foot on the other side
  const HS = HOUR_SUN[hourName], sunEl = HS[0], sunAz = -lay.range(HS[1], HS[2]);
  // the high wind blows toward the south, up to 34 degrees to either side (x, z)
  const windA = lay.range(-0.6, 0.6), wind = [Math.sin(windA), Math.cos(windA)];
  const cloudTop = D.deckY - 40, deckY = D.deckY, H = (k) => k * D.lift;
  // ---- the city's levels (local): level 0 is the raft's deck; each next one stands 9 m higher, stepped back
  const j = (a) => lay.range(-a, a);
  const LV = [
    { x0: -65, x1: 78 + j(3), z0: -70, z1: 88 },
    { x0: -51 + j(2), x1: 56 + j(3), z0: -52 + j(1.2), z1: 82 + j(0.8) },
    { x0: -40 + j(2), x1: 44 + j(3), z0: -34 + j(1.2), z1: 76 + j(0.8) },
    { x0: -30 + j(1.5), x1: 34 + j(2.5), z0: -16 + j(1.2), z1: 70 + j(0.8) },
    { x0: -21 + j(1.2), x1: 25 + j(2), z0: 4 + j(1.2), z1: 64 + j(0.8) },
    { x0: -17 + j(1), x1: 17 + j(1), z0: 27, z1: 55 },
  ];
  LV.forEach((l, k) => { l.k = k; l.y = H(k); });
  // the raft's cut corners: NW (fixed: the half turn goes round it), NE, SE, SW
  const cham = [12, lay.range(8, 16), lay.range(6, 12), lay.range(6, 12)];
  // (the raft's own middle in the city's frame, whose origin is the foot of the stair street's axis)
  const raftMid = [(LV[0].x0 + LV[0].x1) / 2, (LV[0].z0 + LV[0].z1) / 2];
  const L0 = LV[0], poly0 = [[L0.x0, L0.z0 + cham[0]], [L0.x0 + cham[0], L0.z0], [L0.x1 - cham[1], L0.z0], [L0.x1, L0.z0 + cham[1]], [L0.x1, L0.z1 - cham[2]], [L0.x1 - cham[2], L0.z1], [L0.x0 + cham[3], L0.z1], [L0.x0, L0.z1 - cham[3]]];
  const inPoly0 = (x, z, m = 0) => x > L0.x0 + m && x < L0.x1 - m && z > L0.z0 + m && z < L0.z1 - m
    && (x - L0.x0) + (z - L0.z0) > cham[0] + m * 1.42 && (L0.x1 - x) + (z - L0.z0) > cham[1] + m * 1.42 && (L0.x1 - x) + (L0.z1 - z) > cham[2] + m * 1.42 && (x - L0.x0) + (L0.z1 - z) > cham[3] + m * 1.42;
  const inLv = (k, x, z, m = 0) => (k === 0 ? inPoly0(x, z, m) : x > LV[k].x0 + m && x < LV[k].x1 - m && z > LV[k].z0 + m && z < LV[k].z1 - m);
  // light wells through the raft, in the lowest deck's outer band: what makes the city's shadow a pierced one
  const wells = [];
  { const w = R.wells, tryWell = (x0, x1, z0, z1) => { if (inPoly0(x0, z0, 3) && inPoly0(x1, z1, 3) && inPoly0(x0, z1, 3) && inPoly0(x1, z0, 3) && !(x1 > LV[1].x0 - 3.2 && x0 < LV[1].x1 + 3.2 && z1 > LV[1].z0 - 3.2 && z0 < LV[1].z1 + 3.2) && !(x0 < 18 && x1 > -18 && z0 < LV[1].z0) && wells.every((q) => x1 < q.x0 - 4 || x0 > q.x1 + 4 || z1 < q.z0 - 4 || z0 > q.z1 + 4)) wells.push({ x0, x1, z0, z1 }); };
    for (let i = 0; i < 46; i++) {
      // (the east band is the widest: its wells are the great ones, long slots of light with bridges of deck between them)
      const side = w.int(0, 2), a = w.range(0.06, 0.94), len = w.range(9, 20) * (side === 1 ? 1.5 : side === 0 ? 1.25 : 1), wid = w.range(5, 8.5) * (side === 1 ? 1.5 : 1);
      // (each lies in the middle of its band's free width: 3 m in from the raft's edge, 3.2 m out from the first terrace's wall, and is no wider than that)
      if (side === 0) { const b0 = L0.z0 + 3.05, b1 = LV[1].z0 - 3.25, wd = Math.min(wid, b1 - b0), xc = lerp(L0.x0, L0.x1, a), zc = (b0 + b1) / 2; tryWell(xc - len / 2, xc + len / 2, zc - wd / 2, zc + wd / 2); }
      else if (side === 1) { const b0 = LV[1].x1 + 3.25, b1 = L0.x1 - 3.05, wd = Math.min(wid, b1 - b0), zc = lerp(L0.z0, L0.z1, a), xc = (b0 + b1) / 2; tryWell(xc - wd / 2, xc + wd / 2, zc - len / 2, zc + len / 2); }
      else { const b0 = L0.x0 + 3.05, b1 = LV[1].x0 - 3.25, wd = Math.min(wid, b1 - b0), zc = lerp(L0.z0, L0.z1, a), xc = (b0 + b1) / 2; tryWell(xc - wd / 2, xc + wd / 2, zc - len / 2, zc + len / 2); }
    } }
  const inWell = (x, z, m = 0) => wells.some((q) => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m);
  // the stair street on the axis: a flight up each level's north face; the height of the ground on the street's line
  const stairs = []; for (let k = 1; k <= 5; k++) { const run = Math.min(14, LV[k].z0 - LV[k - 1].z0 - 3); stairs.push({ k, z0: LV[k].z0 - run, z1: LV[k].z0, y0: H(k - 1), y1: H(k), hw: 6 }); }
  // THE JETTY: short, on the city's own axis: the stair street's line carried on from the summit's south edge out over the raft's south
  // side to the ring (psi, its bearing east of south, is 0). The side away from the sun, where the city's shadow lies on the wood, is
  // then on its left hand, 48 degrees off its line by day. Its line is the route's own last straight:
  // (ax, az) its first point on the axis, (jx, jz) its direction, len its length, all in the city's frame.
  // The jetty's walk lies 4 m under the summit square (a landing at the square's own height, then a flight of eight steps down, a0 to
  // a1 along it): the line goes out level from the square, so it runs 8.4 m over the walk and one looks down past the walk's rail into
  // the cloud's great hole; the ring stands on the walk's end, its middle at the line's height.
  const jetty = { hw: 4.3, drop: 4, y: H(5) - 4, a0: 0, a1: 6, psi: 0, ax: 0, az: LV[5].z1 - 3, jx: 0, jz: 1, len: D.jettyLen };
  jetty.jx = Math.sin(jetty.psi); jetty.jz = Math.cos(jetty.psi);
  // a local point in the jetty's own measures: metres along its axis from its first point, metres to the left of it (east, for the hand +1)
  const onJetty = (x, z) => [(x - jetty.ax) * jetty.jx + (z - jetty.az) * jetty.jz, (x - jetty.ax) * jetty.jz - (z - jetty.az) * jetty.jx];
  const jettyPt = (along, left = 0) => [jetty.ax + jetty.jx * along + jetty.jz * left, jetty.az + jetty.jz * along - jetty.jx * left];
  // the height of the deck one stands on at a local point (-1e9: no deck: a well, or off the raft)
  const deckAt = (x, z) => {
    { const [a, l] = onJetty(x, z); if (Math.abs(l) <= jetty.hw && a >= 0 && a <= jetty.len && z >= LV[5].z1 - 0.01) return a <= jetty.a0 ? H(5) : a >= jetty.a1 ? jetty.y : lerp(H(5), jetty.y, (a - jetty.a0) / (jetty.a1 - jetty.a0)); }
    for (const s of stairs) if (Math.abs(x) <= s.hw && z >= s.z0 && z <= s.z1) return lerp(s.y0, s.y1, (z - s.z0) / (s.z1 - s.z0));
    for (let k = 5; k >= 1; k--) if (inLv(k, x, z)) return H(k);
    return inPoly0(x, z) && !inWell(x, z) ? 0 : -1e9;
  };
  await tick();
  // ---- THE ROUTE (hand +1), laid by its curvature so that no turn begins or ends at once. North along the ride,
  // level for its first 60 m; an easing-in curve (curvature rising evenly over 50 m) onto a round of 30 m about S0,
  // counter-clockwise from above, the leg on the left hand, climbing, for a little under one turn (so that the look, kept
  // toward the leg's side, passes over the wood to the south, then the city's shadow to the east, then the city's legs to
  // the north-east as we come up under the cloud); an easing-out, on which we go up through the cloud beside the leg, onto a
  // straight toward the north-east that passes under the gangway toward the city; an easing left onto the line outside the
  // city's west rail (D.railOut); north along the rail; a half turn round the north-west
  // corner, eased in and out, its top 16 m outside the north rail; south up the stair street on one even slope; over the
  // summit square and straight on along the jetty to the ring.
  const eyeRide = 3.6, zB = D.entryZ - 60, knots = [], place = {}, Lc = 50, Lc2 = 45, Lt = 40, cX = D.cityX, cZ = D.cityZ;
  const xW = cX + L0.x0 - D.railOut, zW0 = cZ - 10, yRail = deckY + D.railUp;
  // a level course by pieces [metres, curvature at its start, at its end] from a pose; th is the heading, clockwise from north
  const course = (x, z, th, pieces, s0 = 0) => {
    const pts = [[x, z, th, s0]]; let s = s0;
    for (const [len, k0, k1] of pieces) { const n = Math.max(1, Math.round(len)), ds = len / n; for (let i = 0; i < n; i++) { const k = lerp(k0, k1, (i + 0.5) / n); th += k * ds * 0.5; x += Math.sin(th) * ds; z -= Math.cos(th) * ds; th += k * ds * 0.5; s += ds; pts.push([x, z, th, s]); } }
    return pts;
  };
  const last = (a) => a[a.length - 1];
  // where the ride must run so that the round's centre is S0: the easing-in from (0, 0) heading north ends at a point whose centre of curvature is the ride's offset
  const cIn = last(course(0, 0, 0, [[Lc, 0, -1 / D.R]])), rideX = -(cIn[0] - D.R * Math.cos(cIn[2])), zIn = -(cIn[1] - D.R * Math.sin(cIn[2]));
  // the first part: the ride, the easing-in, the round (one whole turn less dl radians), the easing-out, the straight toward the city, the left turn of dl onto the west rail's line
  const part1 = (dl, straight) => { const arc = (TAU - dl - Lc / D.R) * D.R; return course(rideX, D.entryZ, 0, [[D.entryZ - zIn, 0, 0], [Lc, 0, -1 / D.R], [arc, -1 / D.R, -1 / D.R], [Lc, -1 / D.R, 0], [straight, 0, 0], [Lc2, 0, -dl / Lc2], [Lc2, -dl / Lc2, 0]]); };
  // for a turn dl, the straight that brings the end onto x = xW (the end's x grows evenly with the straight's length)
  const fit1 = (dl) => { const e0 = last(part1(dl, 0)), st = (xW - e0[0]) / Math.sin(dl); return [st, last(part1(dl, st))]; };
  // the turn dl for which that end lies at the west leg's first point (10 m north of the city's middle: we come in beside the raft's south-west corner on the turn itself)
  let dlo = 0.12, dhi = 1.3; for (let i = 0; i < 26; i++) { const mid = (dlo + dhi) / 2, e = fit1(mid)[1]; if (e[1] < zW0) dlo = mid; else dhi = mid; if (i % 6 === 5) await tick(); }
  const dl = (dlo + dhi) / 2, straight1 = fit1(dl)[0], c1 = part1(dl, straight1), s1 = last(c1)[3];
  // the level metres at which the round's easing-out ends (where the straight toward the city begins)
  const sOut = D.entryZ - zIn + Lc + (TAU - dl - Lc / D.R) * D.R + Lc;
  await tick();
  // the half turn: its radius is found so that it ends on the city's axis heading south; the leg before it so that its top lies 16 m outside the north rail
  const part2 = (Rt, leg) => course(xW, last(c1)[1], 0, [[leg, 0, 0], [Lt, 0, 1 / Rt], [(Math.PI - Lt / Rt) * Rt, 1 / Rt, 1 / Rt], [Lt, 1 / Rt, 0]], s1);
  let rlo = 30, rhi = 60; for (let i = 0; i < 26; i++) { const mid = (rlo + rhi) / 2; if (last(part2(mid, 0))[0] < cX) rlo = mid; else rhi = mid; }
  const Rt = (rlo + rhi) / 2, top0 = Math.min(...part2(Rt, 0).map((q) => q[1])), leg = top0 - (cZ + L0.z0 - 16), c2 = part2(Rt, Math.max(leg, 10)), zTs = c2[0][1] - Math.max(leg, 10), zTe = last(c2)[1], s2 = last(c2)[3];
  // the last part: one straight south down the axis, up the street, over the summit and along the jetty to the ring
  const c3 = course(cX, zTe, Math.PI, [[cZ + jetty.az + jetty.len - zTe, 0, 0]], s2);
  // the jetty lies under that last straight: its axis from 3 m inside the summit's south edge to the ring
  jetty.a0 = (3 + jetty.jx * jetty.hw) / jetty.jz + 0.6; jetty.a1 = jetty.a0 + 6;
  // THE CLIMB'S LAW over the level metres from the end of the ride's first 60 m: the slope rises from nothing to m1 between a0 and a1
  // and holds m1 round the leg, so that the whole round but its last eighth is flown UNDER the cloud (the look, kept toward the leg's
  // side, passes over the wood, then over the city's shadow on it, then over the city's own legs standing across the wood); the line
  // comes to the cloud's foot (yC: 30 m under its tops) where the round's easing-out begins (sC), goes up through the cloud
  // beside the leg on that same slope, eases to the gentle m2 as it comes out of the cloud's tops with the city ahead and a little
  // above, passes UNDER the gangway (sX, found on the level course itself; the walk's truss is 11 m and more over the eye there) and
  // is level from 50 m before the rail's line. m1 and m2 are the two slopes that bring us to yC at sC and to the rail's height at the end.
  const gB = [cX, cZ + L0.z1 + 1.5], sideOf = (q) => q[0] * gB[1] - q[1] * gB[0];
  let sX = sOut; for (let i = c1.length - 2; i > 0; i--) if (sideOf(c1[i]) * sideOf(c1[i + 1]) <= 0 && c1[i][0] * gB[0] + c1[i][1] * gB[1] > 0) { sX = c1[i][3]; break; }
  const a0 = 4, a1 = 70, sC = sOut - 60 - Lc, yC = cloudTop - D.slab[0], b0 = sC + 10, b1 = sC + 50, Sig = s1 - 60, e0 = Sig - 110, e1 = Sig - 50;
  const f1 = (s) => (s < a1 ? ss(a0, a1, s) : 1 - ss(b0, b1, s)), f2 = (s) => (s < b1 ? ss(b0, b1, s) : 1 - ss(e0, e1, s));
  let F1 = 0, F2 = 0; const nCl = Math.ceil(Sig), T1 = new Float32Array(nCl + 2), T2 = new Float32Array(nCl + 2);
  for (let i = 0; i <= nCl; i++) { T1[i] = F1; T2[i] = F2; F1 += f1(i + 0.5); F2 += f2(i + 0.5); }
  T1[nCl + 1] = F1; T2[nCl + 1] = F2;
  // (two heights, two slopes: y = eyeRide + m1 T1 + m2 T2 at the cloud's foot and at the end)
  const iO = Math.round(sC), yOut = yC, det = T1[iO] * T2[nCl] - T2[iO] * T1[nCl];
  const mSlope = ((yOut - eyeRide) * T2[nCl] - T2[iO] * (yRail - eyeRide)) / det, m2 = (T1[iO] * (yRail - eyeRide) - (yOut - eyeRide) * T1[nCl]) / det;
  const yClimb = (s) => { const q = clamp(s, 0, nCl), i = Math.floor(q), f = q - i; return eyeRide + mSlope * lerp(T1[i], T1[i + 1], f) + m2 * lerp(T2[i], T2[i + 1], f); };
  // the height over the lowest deck from the half turn's top on, by the local z: the rail's own height at the turn's top, 2 m more over
  // the north rail, then one even slope up the stair street as far as zq (30 m before the summit's edge), from where the slope eases
  // evenly to nothing at ze, 4 m inside the summit square (4.4 m over the square and the jetty): the line comes over the summit
  // without a knee. yq is the height at zq for which that holds.
  const zq = LV[5].z0 - 30, ze = LV[5].z0 + 4, yTop = H(5) + D.EYE, rq = (ze - zq) / (2 * (zq - L0.z0)), yq = (yTop + (D.railUp + 2) * rq) / (1 + rq);
  const sk = [[-1e6, D.railUp], [L0.z0 - 16, D.railUp], [L0.z0, D.railUp + 2], [zq, yq]];
  const yStreet = (lz) => { if (lz >= ze) return yTop; if (lz > zq) { const t = (lz - zq) / (ze - zq); return yq + (yTop - yq) * (2 * t - t * t); }
    for (let i = 1; i < sk.length; i++) if (lz <= sk[i][0]) return lerp(sk[i - 1][1], sk[i][1], (lz - sk[i - 1][0]) / (sk[i][0] - sk[i - 1][0])); return yTop; };
  // knots every 8 m of the level course (every 15 m on the first straight)
  for (let i = 0; i < c1.length - 1; i += (c1[i][3] < D.entryZ - zIn - 16 ? 15 : 8)) knots.push([c1[i][0], c1[i][3] <= 60 ? eyeRide : yClimb(c1[i][3] - 60), c1[i][1]]);
  { let past = false; for (let i = 0; i < c2.length - 1; i += 8) { if (c2[i][2] > Math.PI * 0.5) past = true; knots.push([c2[i][0], past ? deckY + yStreet(c2[i][1] - cZ) : yRail, c2[i][1]]); } }
  for (let i = 0; i < c3.length - 1; i += 8) knots.push([c3[i][0], deckY + yStreet(c3[i][1] - cZ), c3[i][1]]);
  { const E = last(c3); knots.push([E[0], deckY + H(5) + D.EYE, E[1]]); }
  await tick();
  // ---- the wood's ground (the world's frame): level round S0's foot, along the ride and beside the stream
  const sph = R.wood.range(0, TAU), sAmp = R.wood.range(2, 4);
  // (behind the entry the stream swings 44 m away from the ride and goes on under the wood's roof)
  // (the stream runs on the ride's far side from the ladder leg; the deer's glade lies on the leg's side)
  const ws = Math.sign(rideX), streamX = (z) => rideX + ws * (10 + sAmp * Math.sin(z * 0.043 + sph) + 1.5 * Math.sin(z * 0.117 + sph * 1.7) + 44 * ss(D.entryZ + 14, D.entryZ + 84, z));
  const deer = { x: rideX - ws * R.deer.range(22, 26), z: R.deer.range(62, 104), r: R.deer.range(8, 10) };
  const ground = (x, z) => {
    const ds = Math.abs(x - streamX(z));
    const level = Math.max(1 - ss(16, 70, Math.hypot(x, z)), (1 - ss(7, 26, Math.abs(x - rideX))) * ss(10, 50, z), (1 - ss(32, 52, Math.abs(x - rideX))) * ss(D.entryZ + 30, D.entryZ + 90, z), 1 - ss(8, 40, ds), 1 - ss(deer.r * 0.6, deer.r * 2.4, Math.hypot(x - deer.x, z - deer.z)));
    return (n2(x * 0.0075 + 3.1, z * 0.0075 - 1.7) * 4.5 + n2(x * 0.03 - 5, z * 0.03 + 9) * 1.1) * (1 - level) - 2.1 * (1 - ss(1.4, 4.8, ds));
  };
  // ---- THE STILTS, slender and far apart: S0 (ours, the ladder leg: its head carries the gangway's end), four under the raft, inset
  // from its edge, and one beside the jetty (9 m to its left, 22 m before the ring) that carries the jetty's head
  const stilts = [{ x: 0, z: 0, y0: 0, y1: deckY - 3 - 1.6, r: D.mastR, own: true, ph: R.stilts.range(0, TAU) }];
  for (const [bx, bz] of [[-38, -44], [52, -40], [48, 62], [-36, 58]]) {
    const lx = bx + R.stilts.range(-7, 7), lz = bz + R.stilts.range(-7, 7), x = lx + cX, z = lz + cZ;
    stilts.push({ x, z, lx, lz, y0: ground(x, z), y1: deckY - D.raft, r: D.mastR * 1.45 * R.stilts.range(0.86, 1), own: false, ph: R.stilts.range(0, TAU) });
  }
  { const [lx, lz] = jettyPt(jetty.len - 22, 9), x = lx + cX, z = lz + cZ; stilts.push({ x, z, lx, lz, y0: ground(x, z), y1: deckY + jetty.y - 1.5, r: D.mastR * 1.45 * R.stilts.range(0.9, 1), own: false, jetty: true, ph: R.stilts.range(0, TAU) }); }
  // a well that would open onto a stilt's head is dropped (after its draws)
  for (let i = wells.length - 1; i >= 0; i--) { const q = wells[i]; if (stilts.some((s) => !s.own && s.lx > q.x0 - 7 && s.lx < q.x1 + 7 && s.lz > q.z0 - 7 && s.lz < q.z1 + 7)) wells.splice(i, 1); }
  // THE GANGWAY from S0's head to the middle of the raft's south edge, 3 m under the lowest deck (it comes in at the raft's beams and
  // a short flight brings one up to the deck): the world's frame; its end in the city's too. The line passes UNDER it (20 m below the walk) on its way from the cloud's top to the city.
  const gangway = { a: [0, deckY - 3, 0], lb: [0, L0.z1 + 1.5], hw: 0.9 };
  gangway.b = [gB[0], deckY - 3, gB[1]]; gangway.len = Math.hypot(gangway.b[0], gangway.b[2]);
  await tick();
  // ---- the line that is flown (hand +1 here; the world mirrors x by the hand), eyes every 2 m of it for every clearance test
  const cpath = makePath(knots);
  await tick();
  const nEye = Math.floor(cpath.length / 2) + 1, ex = new Float32Array(nEye), ey = new Float32Array(nEye), ez = new Float32Array(nEye);
  { const v = new THREE.Vector3(); for (let i = 0; i < nEye; i++) { cpath.posAtDist(Math.min(i * 2, cpath.length), v); ex[i] = v.x; ey[i] = v.y; ez[i] = v.z; if (i % 128 === 127) await tick(); } }
  await tick();
  // the nearest the line comes to a point of the world, and to a point of the city's own frame (lx, height over the lowest deck, lz)
  // THE ENTRY'S AXIS BEHIND THE ENTRY: the line's first tangent continued backward, level, for 360 m (the eye that draws
  // this place inside the previous world's opening flies there from far behind); the lane holds along it as along the line.
  // The ride itself is carried back under it for D.backRide metres: the wood's ground is level there, trees line it, and the
  // world's shell (the wood's roof) is cut open over it from D.cutIn to D.cutOut metres to either side of the axis.
  const nBack = 180, bkx = new Float32Array(nBack), bky = new Float32Array(nBack), bkz = new Float32Array(nBack);
  const bux = -(ex[1] - ex[0]) / (Math.hypot(ex[1] - ex[0], ez[1] - ez[0]) || 1), buz = -(ez[1] - ez[0]) / (Math.hypot(ex[1] - ex[0], ez[1] - ez[0]) || 1), bLen = 2 * nBack;
  for (let i = 0; i < nBack; i++) { bkx[i] = ex[0] + bux * 2 * (i + 1); bky[i] = ey[0]; bkz[i] = ez[0] + buz * 2 * (i + 1); }
  const laneW = (x, y, z) => {
    let b = 1e12;
    for (let i = 0; i < nEye; i++) { const dx = ex[i] - x, dy = ey[i] - y, dz = ez[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; }
    // (the axis behind the entry is one straight level stretch: the nearest point of it, in closed form)
    { const along = clamp((x - ex[0]) * bux + (z - ez[0]) * buz, 0, bLen), dx = ex[0] + bux * along - x, dy = ey[0] - y, dz = ez[0] + buz * along - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; }
    return Math.sqrt(b);
  };
  const lane = (lx, ly, lz) => laneW(lx + cX, ly + deckY, lz + cZ);
  // a thing that reaches r round the points of a line from a to b (r0 at a, r1 at b) keeps the lane?
  const clearSeg = (a, b, r0, r1 = r0, n = 8) => { for (let i = 0; i <= n; i++) { const t = i / n; if (lane(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)) < D.LANE + lerp(r0, r1, t)) return false; } return true; };
  // the places of the flight in metres from its start, each found on the line itself
  const firstEye = (f) => { for (let i = 0; i < nEye; i++) if (f(ex[i], ey[i], ez[i], i)) return i * 2; return cpath.length; };
  place.rideEnd = firstEye((x, y, z) => z <= zB);
  place.helix = firstEye((x, y, z) => Math.hypot(x, z) < D.R + 1.5);
  place.cloudIn = firstEye((x, y) => y >= cloudTop - D.slab[0]);
  place.helixEnd = firstEye((x, y, z, i) => i * 2 > place.helix + 60 && Math.hypot(x, z) > D.R + 2.5);
  place.cloudOut = firstEye((x, y) => y >= cloudTop + 12);
  place.rail = firstEye((x, y, z) => y > 200 && z <= zW0 + 2);
  place.turn = firstEye((x, y, z) => y > 200 && z <= zTs);
  place.northRail = firstEye((x, y, z, i) => i * 2 > place.turn + 30 && x > xW + Rt && z >= L0.z0 + cZ);
  place.street = firstEye((x, y, z, i) => i * 2 > place.turn + 30 && z >= zTe);
  place.summit = firstEye((x, y, z, i) => i * 2 > place.street && z >= LV[5].z0 + cZ);
  place.jetty = firstEye((x, y, z, i) => i * 2 > place.street && z >= LV[5].z1 + cZ);
  // where the round's easing-out ends and the straight toward the city begins; where the last straight (the jetty's) begins
  place.out = firstEye((x, y, z, i) => i * 2 > place.helix + 60 && Math.hypot(x, z) > D.R + 2.5);
  place.last = firstEye((x, y, z, i) => i * 2 > place.street && z >= LV[5].z0 + 4 + cZ);
  place.end = cpath.length;
  // ---- the registry of what stands in the city (boxes in its own frame) and of what reaches through its air (balls)
  const solids = [], balls = [];
  // how many dealt things the lane leaves out, by kind (a thing left out is not dealt again: the node counts read this)
  const leftOut = { house: 0, mill: 0, dew: 0, tub: 0, post: 0, kite: 0, wash: 0, stall: 0, line: 0, smoke: 0, flock: 0, watch: 0, walk: 0, terrace: 0, tree: 0 };
  // every thing the plan has room for, in the order dealt, those the lane then leaves out among them (out: true): what is dealt AFTER a thing
  // (its mill, its smoke, the figure at it) draws its lots for each of these alike, so a thing the lane refuses moves no later draw
  const dealt = { houses: [], tubs: [], dews: [], wash: [], stalls: [], kites: [] };
  const hitBox = (x0, x1, z0, z1, y0 = -1e9, y1 = 1e9, m = 0) => solids.some((q) => x1 + m > q.x0 && x0 - m < q.x1 && z1 + m > q.z0 && z0 - m < q.z1 && y1 > q.y0 && y0 < q.y1);
  const hitBall = (x, y, z, r) => balls.some((q) => Math.hypot(q.x - x, q.y - y, q.z - z) < q.r + r) || solids.some((q) => x + r > q.x0 && x - r < q.x1 && z + r > q.z0 && z - r < q.z1 && y + r > q.y0 && y - r < q.y1);
  const addBox = (x0, x1, z0, z1, y0, y1, kind) => { const q = { x0, x1, z0, z1, y0, y1, kind }; solids.push(q); return q; };
  // the terraces themselves are solids for whatever flies or hangs (a kite's string, a trail of leaves)
  for (let k = 1; k <= 5; k++) addBox(LV[k].x0, LV[k].x1, LV[k].z0, LV[k].z1, -D.raft, H(k), 'terrace');
  for (const s of stairs) addBox(-s.hw, s.hw, s.z0, s.z1, s.y0, s.y1, 'stair');
  for (const q of wells) addBox(q.x0, q.x1, q.z0, q.z1, -1e9, 2.5, 'well');
  // which level's deck a free-standing thing may stand on at (x, z), keeping m metres inside that level's band (-1: none)
  const standOn = (x, z, m) => { const y = deckAt(x, z); if (y < 0 || Math.abs(y / D.lift - Math.round(y / D.lift)) > 1e-6) return -1; const k = Math.round(y / D.lift); if (!inLv(k, x, z, m)) return -1; if (k < 5 && inLv(k + 1, x, z, -m)) return -1; if (k === 0 && inWell(x, z, m)) return -1; return k; };
  // the nearest the line comes to a box of the city's frame
  const laneBox = (x0, x1, y0, y1, z0, z1) => { let b = 1e12; for (let i = 0; i < nEye; i++) { const px = ex[i] - cX, py = ey[i] - deckY, pz = ez[i] - cZ, dx = Math.max(x0 - px, 0, px - x1), dy = Math.max(y0 - py, 0, py - y1), dz = Math.max(z0 - pz, 0, pz - z1), d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  // ---- the houses: rows with their backs to each terrace's wall, tall gabled houses flanking the stair street, a few round the summit square
  const houses = [], hr = R.houses, tint = { plaster: R.city.range(0, 1), roof: R.city.range(0, 1), shut: R.city.range(0, 1) };
  // yaw: the way the front looks (0 south, PI north, PI/2 east, -PI/2 west); w along the front, d the depth
  const addHouse = (o) => {
    const side = Math.abs(Math.sin(o.yaw)) > 0.5, hx = (side ? o.d : o.w) / 2, hz = (side ? o.w : o.d) / 2, y = H(o.k), over = o.over ?? 0.8;
    o.y = y; o.seed = Math.floor(hr() * 1e9); o.coat = hr.int(0, 2); o.gabled = o.gabled ?? hr.chance(0.4);
    // the chimney: on the ridge's line, toward one end
    o.chim = hr.range(-0.3, 0.3);
    // (skip: its lots are drawn, but the plan has no place for it: the tower it leans on does not stand)
    if (o.skip || hitBox(o.x - hx, o.x + hx, o.z - hz, o.z + hz, y, y + o.hgt + o.rise, 0.3)) return null;
    // (the plan has its place: its box stands in the plan's registry whether or not the line then leaves it out, so that nothing later is dealt into the room of a thing left out)
    dealt.houses.push(o); o.box = addBox(o.x - hx, o.x + hx, o.z - hz, o.z + hz, y, y + o.hgt + o.rise, 'house');
    if (laneBox(o.x - hx - over, o.x + hx + over, y, y + o.hgt + o.rise + 1.6, o.z - hz - over, o.z + hz + over) < D.LANE) { leftOut.house++; o.out = true; return null; }
    houses.push(o); return o;
  };
  const row = (k, side, a0, a1, keep) => {
    const n = LV[k + 1], band = side === 'N' ? n.z0 - LV[k].z0 : side === 'W' ? n.x0 - LV[k].x0 : LV[k].x1 - n.x1;
    let a = a0 + hr.range(0.3, 2);
    for (let guard = 0; guard < 40; guard++) {
      const w = hr.range(6, 9.5), d = Math.min(hr.range(5.6, 7), band - 3.8), hgt = Math.min(hr.range(5, 8.2), 8.2), rise = hr.range(1.8, 2.8), gap = hr.chance(0.22) ? hr.range(2.6, 5) : hr.range(0.5, 1.3), take = hr.chance(keep);
      if (a + w > a1) break;
      if (take && d >= 4.6) {
        if (side === 'N') addHouse({ k, x: a + w / 2, z: n.z0 - 0.6 - d / 2, w, d, yaw: Math.PI, hgt, rise, kind: 'row' });
        else if (side === 'W') addHouse({ k, x: n.x0 - 0.6 - d / 2, z: a + w / 2, w, d, yaw: -Math.PI / 2, hgt, rise, kind: 'row' });
        else addHouse({ k, x: n.x1 + 0.6 + d / 2, z: a + w / 2, w, d, yaw: Math.PI / 2, hgt, rise, kind: 'row' });
      }
      a += w + gap;
    }
  };
  // the street's own houses first (they flank the stairs), the bridge's two towers among them on the third terrace
  const kBridge = 2; let bridge = null;
  for (let k = 0; k <= 4; k++) {
    const zA = (k === 0 ? L0.z0 + 4 : LV[k].z0 + 3.5), zZ = LV[k + 1].z0 - 0.6, len = zZ - zA;
    for (const sgn of [-1, 1]) {
      // (the street is broader at its foot: on the lowest deck its houses stand further back)
      const d = hr.range(6, 7.2), yaw = sgn > 0 ? -Math.PI / 2 : Math.PI / 2, x = sgn * ((k === 0 ? D.streetFoot : D.streetHalf) + 1.5 + d / 2);
      if (k === kBridge) {
        const w = 7.4, tw = addHouse({ k, x, z: zA + w / 2, w, d: 7, yaw, hgt: 21.6, rise: 3.4, gabled: false, kind: 'tower' });
        if (len - w - 0.8 > 5.5) addHouse({ k, x, z: zZ - (len - w - 0.8) / 2, w: len - w - 0.8, d, yaw, hgt: hr.range(9.5, 11.5), rise: hr.range(2.4, 3), gabled: true, kind: 'street', skip: !tw });
      } else if (len > 15.5) {
        const w1 = len * hr.range(0.44, 0.56) - 0.4;
        addHouse({ k, x, z: zA + w1 / 2, w: w1, d, yaw, hgt: hr.range(9.5, 12.6), rise: hr.range(2.4, 3.2), gabled: true, kind: 'street' });
        addHouse({ k, x, z: zZ - (len - w1 - 0.8) / 2, w: len - w1 - 0.8, d: d - hr.range(0, 0.8), yaw, hgt: hr.range(10.5, 12.6), rise: hr.range(2.4, 3.2), gabled: true, kind: 'street' });
      } else addHouse({ k, x, z: (zA + zZ) / 2, w: len, d, yaw, hgt: hr.range(10, 12.6), rise: hr.range(2.4, 3.2), gabled: true, kind: 'street' });
    }
  }
  { const tw = houses.filter((q) => q.kind === 'tower'); if (tw.length === 2) { const z = (tw[0].z + tw[1].z) / 2, y = H(kBridge) + 19; bridge = { z, y, x0: -D.streetHalf - 1.5, x1: D.streetHalf + 1.5, hw: 1.1 }; if (laneBox(bridge.x0, bridge.x1, y - 0.9, y + 1.3, z - 1.3, z + 1.3) < D.LANE) bridge = null; else addBox(bridge.x0, bridge.x1, z - 1.2, z + 1.2, y - 0.9, y + 1.3, 'bridge'); } }
  await tick();
  for (let k = 0; k <= 3; k++) {
    const n = LV[k + 1], keep = Math.min(0.97, 0.9 * dens);
    row(k, 'N', n.x0 + 1, -(D.streetHalf + 10), keep); row(k, 'N', D.streetHalf + 10, n.x1 - 1, keep);
    row(k, 'W', n.z0 + 1.5, n.z1 - 1.5, keep); row(k, 'E', n.z0 + 1.5, n.z1 - 1.5, Math.min(0.9, 0.5 * dens));
  }
  // the summit square's houses, fronts to the square: two on the west side, one on the east (the jetty leaves by the south-east)
  for (const sgn of [-1, 1]) for (const t of [0.37, 0.79]) { const d = hr.range(5.4, 6.4), w = hr.range(7, 8.6); if (sgn < 0 || t < 0.5) addHouse({ k: 5, x: sgn > 0 ? LV[5].x1 - 0.9 - d / 2 : LV[5].x0 + 0.9 + d / 2, z: lerp(LV[5].z0, LV[5].z1, t) + hr.range(-1, 1), w, d, yaw: sgn > 0 ? -Math.PI / 2 : Math.PI / 2, hgt: hr.range(5.2, 7.4), rise: hr.range(2, 2.8), kind: 'summit' }); }
  await tick();
  // ---- the rails: every outer edge of every level, the wells' rims, the jetty's two sides (n: the way out over the edge; for a well's rim, into the well)
  const rails = [];
  const pushRail = (ax, az, bx, bz, k, kind, y = H(k)) => { const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz); if (l > 0.8) rails.push({ ax, az, bx, bz, k, y, kind, l, nx: dz / l, nz: -dx / l }); };
  for (let i = 0; i < 8; i++) { const a = poly0[i], b = poly0[(i + 1) % 8]; pushRail(a[0], a[1], b[0], b[1], 0, 'edge'); }
  for (let k = 1; k <= 5; k++) {
    const l = LV[k], gap = stairs[k - 1].hw + 0.3;
    pushRail(l.x0, l.z0, -gap, l.z0, k, 'edge'); pushRail(gap, l.z0, l.x1, l.z0, k, 'edge'); pushRail(l.x1, l.z0, l.x1, l.z1, k, 'edge');
    if (k < 5) pushRail(l.x1, l.z1, l.x0, l.z1, k, 'edge'); else { const xc = jetty.ax + 3 * jetty.jx / jetty.jz, half = jetty.hw / jetty.jz + 0.3; pushRail(l.x1, l.z1, xc + half, l.z1, k, 'edge'); pushRail(xc - half, l.z1, l.x0, l.z1, k, 'edge'); }
    pushRail(l.x0, l.z1, l.x0, l.z0, k, 'edge');
  }
  for (const q of wells) { pushRail(q.x1, q.z0, q.x0, q.z0, 0, 'well'); pushRail(q.x1, q.z1, q.x1, q.z0, 0, 'well'); pushRail(q.x0, q.z1, q.x1, q.z1, 0, 'well'); pushRail(q.x0, q.z0, q.x0, q.z1, 0, 'well'); }
  // (the walk's two rails from the foot of the steps to the ring, at the walk's own height; the left one walked outward, the right one back,
  // so that each looks out; the landing's and the steps' rails are drawn with the jetty)
  pushRail(...jettyPt(jetty.a1, jetty.hw), ...jettyPt(jetty.len - 0.3, jetty.hw), 5, 'jetty', jetty.y); pushRail(...jettyPt(jetty.len - 0.3, -jetty.hw), ...jettyPt(jetty.a1, -jetty.hw), 5, 'jetty', jetty.y);
  // ---- windmills: one great one at a corner of the summit, small ones on roofs by the street, others standing on the terraces
  const mills = [], mr = R.mills, windAx = [wind[0], 0, wind[1]];
  const addMill = (o) => {
    // the hub stands 1.3 m upwind of the tower's axis; the sails sweep a disc square to the wind: a ball of their radius holds every place they reach
    // (its lot, drawn by the caller before any test: the sails' phase, their turning and their number)
    o.hx = o.x - wind[0] * 1.3; o.hz = o.z - wind[1] * 1.3; o.ph = o.lot[0]; o.rate = o.lot[1] * (4.5 / o.r); o.sails = o.lot[2];
    // (null: no room for it in the plan; false: the plan has room, but its sails would sweep within the lane: left out, not dealt again)
    if (o.skip || hitBall(o.hx, o.y + o.hub, o.hz, o.r + 0.4) || (!o.roof && hitBox(o.x - o.tw, o.x + o.tw, o.z - o.tw, o.z + o.tw, o.y, o.y + o.hub, 0.6))) return null;
    if (!o.roof) addBox(o.x - o.tw, o.x + o.tw, o.z - o.tw, o.z + o.tw, o.y, o.y + o.hub + 0.8, 'mill');
    balls.push({ x: o.hx, y: o.y + o.hub, z: o.hz, r: o.r + 0.4 });
    if (lane(o.hx, o.y + o.hub, o.hz) < D.LANE + o.r + 0.5) { leftOut.mill++; return false; }
    mills.push(o); return o;
  };
  const millLot = () => [mr.range(0, TAU), mr.range(0.5, 0.95) * (mr.chance(0.5) ? 1 : -1), mr.pick([4, 4, 5, 6])];
  { const sgn = mr.chance(0.5) ? 1 : -1; addMill({ x: sgn > 0 ? LV[5].x1 - 2.7 : LV[5].x0 + 2.7, z: LV[5].z0 + 2.7, y: H(5), hub: mr.range(14, 16.5), r: mr.range(5.8, 6.6), tw: 1.7, big: true, lot: millLot() }); }
  for (const hs of dealt.houses) {
    const r = mr.range(1.9, 2.6), up = r + mr.range(0.8, 1.3), take = mr.chance(hs.kind === 'street' ? 0.42 : hs.kind === 'row' ? 0.07 : 0), lot = millLot();
    if (take) { const m = addMill({ lot, x: hs.x, z: hs.z + (Math.abs(Math.sin(hs.yaw)) > 0.5 ? hs.chim * -hs.w : 0), y: hs.y + hs.hgt + hs.rise, hub: up, r, tw: 0.2, roof: true, skip: !!hs.out }); if (m) hs.mill = m; }
  }
  for (let i = 0, n = 0, want = Math.round(5 * dens); i < 60 && n < want; i++) {
    const k = mr.int(0, 2), l = LV[k], x = mr.range(l.x0, l.x1), z = mr.range(l.z0, l.z1), hub = mr.range(9, 12.5), r = mr.range(3.8, 5.2), lot = millLot();
    if (standOn(x, z, 3.4) === k && (Math.abs(x) > 12 || z > LV[5].z0) && addMill({ x, z, y: H(k), hub, r, tw: 1.3, lot }) !== null) n++;
  }
  await tick();
  // ---- dew catchers, each with its cistern: on the terraces' open bands
  const dews = [], dr = R.dew;
  for (let i = 0, n = 0, want = Math.round(7 * dens); i < 420 && n < want; i++) {
    const k = dr.int(0, 3), l = LV[k], x = dr.range(l.x0, l.x1), z = dr.range(l.z0, l.z1), alongX = dr.chance(0.5), w = dr.range(5, 7), hgt = dr.range(5.5, 7.5), side = dr.sign(), ph = dr.range(0, TAU);
    const hx = alongX ? w / 2 : 1.3, hz = alongX ? 1.3 : w / 2, cx = x + (alongX ? 0 : side * 3.2), cz = z + (alongX ? side * 3.2 : 0);
    if (standOn(x - hx, z - hz, 1.7) !== k || standOn(x + hx, z + hz, 1.7) !== k || standOn(cx, cz, 2.5) !== k || (Math.abs(x) < 13 && z < LV[5].z0)) continue;
    const x0 = Math.min(x - hx, cx - 1.7), x1 = Math.max(x + hx, cx + 1.7), z0 = Math.min(z - hz, cz - 1.7), z1 = Math.max(z + hz, cz + 1.7);
    if (hitBox(x0, x1, z0, z1, H(k), H(k) + hgt, 0.9)) continue;
    // (the plan has room for it: it counts as dealt; the net's flutter reaches 0.5 m)
    n++; const dw = { k, x, z, y: H(k), alongX, w, hgt, cx, cz, ph }; dealt.dews.push(dw);
    dw.box = addBox(x0, x1, z0, z1, H(k), H(k) + hgt, 'dew');
    if (laneBox(x0, x1, H(k), H(k) + hgt, z0, z1) < D.LANE + 0.5) { leftOut.dew++; dw.out = true; continue; }
    dews.push(dw);
  }
  // ---- orchards in tubs: on a loose grid over every level, thick where the orchard's own noise says so
  const tubs = [], tr = R.tubs;
  for (let k = 0; k <= 5; k++) {
    const l = LV[k];
    for (let gx = l.x0 + 2.5; gx < l.x1 - 2; gx += 4.7) for (let gz = l.z0 + 2.5; gz < l.z1 - 2; gz += 4.7) {
      const x = gx + tr.range(-0.9, 0.9), z = gz + tr.range(-0.9, 0.9), hgt = tr.range(3, 4.6), cr = tr.range(1.25, 1.9), sd = Math.floor(tr() * 1e9), take = tr.chance(Math.min(0.95, (0.1 + 0.34 * ss(-0.1, 0.5, n2(x * 0.045 + 31, z * 0.045 - 17)) + (x > LV[1].x1 ? 0.22 : 0)) * dens));
      if (!take || standOn(x, z, 2.3) !== k || (Math.abs(x) < 8.2 && z < LV[5].z0 + 1) || (k === 5 && Math.abs(x) < 6.5)) continue;
      if (hitBox(x - 1, x + 1, z - 1, z + 1, H(k), H(k) + hgt, 1.2) || hitBall(x, H(k) + hgt - cr, z, cr + 0.3)) continue;
      const tb = { k, x, z, y: H(k), hgt, cr, seed: sd }; dealt.tubs.push(tb);
      tb.box = addBox(x - 0.9, x + 0.9, z - 0.9, z + 0.9, H(k), H(k) + hgt, 'tub');
      if (lane(x, H(k) + hgt - cr, z) < D.LANE + cr + 0.4) { leftOut.tub++; tb.out = true; continue; }
      tubs.push(tb);
    }
  }
  // THE SUMMIT SQUARE'S OWN FOUR: a tree in a tub to either side of the square's middle way at its north end (by the stairs' head)
  // and at its south end (by the jetty's landing), 7 m from the way's middle; each by the same tests as the orchards'
  for (const sx of [-1, 1]) for (const zs of [LV[5].z0 + 2.2, LV[5].z1 - 2.2]) {
    const x = sx * 7, z = zs, hgt = tr.range(3.2, 4.2), cr = tr.range(1.3, 1.7), sd = Math.floor(tr() * 1e9), k = 5;
    {
      if (standOn(x, z, 1.2) !== k || hitBox(x - 1, x + 1, z - 1, z + 1, H(k), H(k) + hgt, 0.4) || hitBall(x, H(k) + hgt - cr, z, cr + 0.3)) continue;
      const tb = { k, x, z, y: H(k), hgt, cr, seed: sd }; dealt.tubs.push(tb);
      tb.box = addBox(x - 0.9, x + 0.9, z - 0.9, z + 0.9, H(k), H(k) + hgt, 'tub');
      if (lane(x, H(k) + hgt - cr, z) < D.LANE + cr + 0.4) { leftOut.tub++; tb.out = true; continue; }
      tubs.push(tb);
    }
  }
  await tick();
  // ---- THE CLOUD'S STANDING GAPS (the world's frame, [x, z, radius]): places where the cloud is open, whoever looks and from wherever.
  // THE GAP ABOUT THE LADDER LEG AND THE CITY: one clear air from the leg's well to the raft's, a row of four rounds on the straight
  // way from the leg to the raft's middle that run into one another ('leg': the well over the leg's glade, D.well wide; two 'rift'
  // rounds between; 'city': the clear air about the raft, 92 m), each wider than the last: from the wood one sees up it to the
  // raft's underside and the legs under it, from the leg's ladder the city stands over its far end, and the gangway hangs across it.
  // 'great': THE GREAT HOLE under the jetty's end, on the side away from the sun: its
  // middle lies up to 62 m from the point under the jetty's end, toward the place where the line from the jetty's head to the city's pierced
  // shadow on the wood crosses the cloud; through it one looks down from the jetty on the wood. And six dealt gaps
  // of blue over the wood, each at its own place.
  const sunA = sunAz * Math.PI / 180, anti = [-Math.sin(sunA), Math.cos(sunA)];
  // the pierced shadow's middle on the crowns (where the sun's ray through the raft's middle meets them, about 25 m over S0's foot)
  const shadowAt = [cX + anti[0] * (deckY - 25) / Math.tan(sunEl * Math.PI / 180), 25, cZ + anti[1] * (deckY - 25) / Math.tan(sunEl * Math.PI / 180)];
  const greatAt = (() => { const e = [cX + jettyPt(jetty.len, 0)[0], cZ + jettyPt(jetty.len, 0)[1]], hd = [cX + jettyPt(jetty.a1, 0)[0], cZ + jettyPt(jetty.a1, 0)[1]], ey = deckY + H(5) + D.EYE, t = (ey - (cloudTop - 15)) / (ey - 25);
    const c = [hd[0] + (shadowAt[0] - hd[0]) * t, hd[1] + (shadowAt[2] - hd[1]) * t], dx = c[0] - e[0], dz = c[1] - e[1], l = Math.hypot(dx, dz), k = Math.min(1, 62 / l);
    return [e[0] + dx * k, e[1] + dz * k]; })();
  const gaps = [0, 1, 2, 3].map((i) => ({ x: (cX + raftMid[0]) * i / 3, z: (cZ + raftMid[1]) * i / 3, r: lerp(D.well, 92, i / 3), kind: ['leg', 'rift', 'rift', 'city'][i] }));
  gaps.push({ x: greatAt[0], z: greatAt[1], r: 120, kind: 'great' });
  for (let i = 0; i < 6; i++) { const a = R.gaps.range(0, TAU), d = R.gaps.range(170, 560), r = R.gaps.range(34, 62), x = Math.cos(a) * d, z = Math.sin(a) * d; gaps.push({ x, z, r, kind: 'blue' }); }
  // THE RARE VISIT: the same sea, more broken: its six dealt gaps of blue stand half as wide again (after their draws)
  if (rare) for (const g of gaps) if (g.kind === 'blue') g.r *= 1.5;
  // ---- THE SPYGLASSES. The people of this city look at THE EARTH: a spyglass stands where the earth can be seen, and is aimed at it.
  // THE LAW (it names no line). Along every rail (the outer edge of every level, the rims of the light wells, the jetty's two sides)
  // there is a STATION every few metres. A station's SWING is the rail's own outward normal, 35 degrees to either hand, 20 to 70 degrees
  // under the level. By the cloud's own plan (its standing gaps, above) a station whose swing reaches a gap gets a tube, clamped on the
  // rail, aimed THROUGH that gap at the land under it: each station is dealt six aims within its swing, and the first whose sight line
  // meets nothing of the city (no deck, terrace, beam, walk, house, mill or tub) and passes the cloud's whole depth inside a gap's open
  // middle is its aim. A station none of whose aims sees the earth gets no tube (four in ten of those have a folded tube lying on the
  // rail). So the rows stand dense over the gaps, round the light wells and beside the great hole, and thin elsewhere. On the terraces'
  // corners a few GREAT telescopes on wheeled carriages, by the same law (the corner's diagonal for its normal, 10 to 32 degrees under
  // the level: its tube clears the corner's rail). Each sweeps slowly about its aim on the world's clock.
  // THE LINE'S ONLY SAY: a tube whose whole reach (eyepiece to far glass, widened by its sweep) comes within 2.5 m of it is left out
  // after its draws (the station then stands without one).
  const scopes = [], stations = [], sr = R.scopes, gt = R.great, SWEEP = 0.1, RAD = Math.PI / 180, slabTop = cloudTop - D.slab[1], slabFoot = cloudTop - D.slab[0];
  // how far from a gap's middle the cloud is surely open: the cloud's own law opens it whole within 0.84 of its radius, and the unevenness of its rim shifts a place by 17.5 m at most
  const openR = (g) => Math.max(0, g.r * 0.84 - 17.5), gapOver = (wx, wz) => gaps.some((g) => Math.hypot(wx - g.x, wz - g.z) < openR(g));
  // the height of the city's own ground at a local point, the jetty apart (-1e9: none: a well, or off the raft)
  const bodyAt = (x, z) => { for (const s of stairs) if (Math.abs(x) <= s.hw && z >= s.z0 && z <= s.z1) return lerp(s.y0, s.y1, (z - s.z0) / (s.z1 - s.z0)); for (let k = 5; k >= 1; k--) if (inLv(k, x, z)) return H(k); return inPoly0(x, z) && !inWell(x, z) ? 0 : -1e9; };
  const near = (v, first, step) => Math.abs((((v - first) % step) + step + step / 2) % step - step / 2);
  // THE EARTH IS SEEN from the local point p along a (unit, downward)?
  const seesEarth = (px, py, pz, a) => {
    if (a[1] > -0.1) return false;
    for (const yy of [slabTop, slabFoot]) { const t = (yy - deckY - py) / a[1]; if (!gapOver(px + cX + a[0] * t, pz + cZ + a[2] * t)) return false; }
    for (let t = 0.9, tEnd = (-D.raft - 1 - py) / a[1]; t < tEnd; t += 0.6) {
      const x = px + a[0] * t, y = py + a[1] * t, z = pz + a[2] * t, b = bodyAt(x, z);
      if (b > -1e8 && y < b + 0.25 && y > -D.raft) return false;
      // (the raft's beams cross under the light wells and their heads stand out 1.5 m past the deck's edge: those along x lie 0.5 to 3.2 m under the deck every 10.5 m, those along z 3.2 to 6 m under it every 11.5 m)
      if (y < -0.4 && inPoly0(x, z, -1.6) && ((y > -3.3 && near(z, L0.z0 + 5, 10.5) < 0.65) || (y < -3.1 && y > -6.1 && near(x, L0.x0 + 6, 11.5) < 0.75))) return false;
      // (the jetty: its deck and rails, and under the deck its joists, which stand out half a metre past its edge)
      { const [al, lf] = onJetty(x, z); if (al > 0 && al < jetty.len + 0.5 && z >= LV[5].z1 && y < jetty.y + 1.2 && y > jetty.y - 1.7 && Math.abs(lf) < jetty.hw + (y < jetty.y - 0.3 ? 0.6 : 0.15)) return false; }
      if (solids.some((q) => q.kind !== 'well' && q.kind !== 'terrace' && q.kind !== 'stair' && x > q.x0 - 0.15 && x < q.x1 + 0.15 && z > q.z0 - 0.15 && z < q.z1 + 0.15 && y > q.y0 - 0.15 && y < q.y1 + 0.15)) return false;
    }
    return true;
  };
  // one spyglass by the foot of its pivot (x, z on the deck y; pv: the pivot's height; tail: metres of tube behind the pivot), the way its rail looks
  // out, and its six dealt aims (yaw from that way, pitch down). Returns the tube, or why there is none: 'cloud' (no aim sees the earth),
  // 'lane' (an aim sees it, but the tube would reach within the lane), 'room' (its far glass would stand in something, or another tube is too near).
  const tryScope = (o, aims) => {
    let why = 'cloud';
    for (const [yw, pt] of aims) {
      const c = Math.cos(yw), sn = Math.sin(yw), a = [(o.nx * c - o.nz * sn) * Math.cos(pt), -Math.sin(pt), (o.nx * sn + o.nz * c) * Math.cos(pt)], py = o.y + o.pv;
      if (!seesEarth(o.x, py, o.z, a)) continue;
      let lane0 = true; for (let i = 0; i <= 4 && lane0; i++) { const t = lerp(-o.tail, o.len - o.tail, i / 4); if (lane(o.x + a[0] * t, py + a[1] * t, o.z + a[2] * t) < D.LANE + o.rad + 0.25 + Math.abs(t) * 0.21) lane0 = false; }
      // (an aim that sees the earth but would bring the tube within the lane ends the matter: the tube is left out; it is not turned to
      // its next aim because of the line)
      if (!lane0) return 'lane';
      if (hitBall(o.x + a[0] * (o.len - o.tail), py + a[1] * (o.len - o.tail), o.z + a[2] * (o.len - o.tail), 0.3) || scopes.some((q) => q.y === o.y && Math.hypot(q.x - o.x, q.z - o.z) < (q.great || o.great ? 3.4 : 2.2))) { if (why !== 'lane') why = 'room'; continue; }
      // the land it is set on: where its line meets the crowns (about 18 m over S0's foot); where its watcher stands: behind the eyepiece, on a step that brings the eye to it
      const tt = (py + deckY - 18) / -a[1], fl = Math.hypot(a[0], a[2]) || 1, back = o.tail * Math.cos(pt) + 0.42, eyeY = py + o.tail * Math.sin(pt), step = Math.max(0, eyeY - o.y - 1.6);
      const q = { ...o, yw, pt, aim: a, sweep: SWEEP, target: [o.x + cX + a[0] * tt, 18, o.z + cZ + a[2] * tt], stand: [o.x - a[0] / fl * back, o.y + step, o.z - a[2] / fl * back], step };
      scopes.push(q); return q;
    }
    return why;
  };
  const corner = (k, cx, cz, dx, dz, always, inset) => {
    const take = gt.chance(0.62), len = gt.range(4.2, 5), rad = gt.range(0.3, 0.36), period = gt.range(40, 80), ph = gt.range(0, TAU), aims = [];
    for (let i = 0; i < 6; i++) aims.push([gt.range(-35, 35) * RAD, gt.range(10, 32) * RAD]);
    const x = cx - dx * inset, z = cz - dz * inset;
    if ((!take && !always) || standOn(x, z, 1) !== k || hitBox(x - 1.1, x + 1.1, z - 1.1, z + 1.1, H(k), H(k) + 3.4, 0.4)) return;
    const q = tryScope({ x, y: H(k), z, nx: dx * Math.SQRT1_2, nz: dz * Math.SQRT1_2, len, rad, period, ph, k, kind: 'corner', great: true, pv: 2.5, tail: len * 0.3 }, aims);
    if (typeof q !== 'string') addBox(x - 1.1, x + 1.1, z - 1.1, z + 1.1, H(k), H(k) + 3, 'great');
  };
  for (let k = 1; k <= 4; k++) for (const [cx, cz, dx, dz] of [[LV[k].x0, LV[k].z0, -1, -1], [LV[k].x1, LV[k].z0, 1, -1], [LV[k].x1, LV[k].z1, 1, 1], [LV[k].x0, LV[k].z1, -1, 1]]) corner(k, cx, cz, dx, dz, false, 1.5);
  // (and one on each south corner of the summit square, beside the jetty's head: dealt after the others, taken wherever it can stand and see the earth)
  for (const [cx, cz, dx, dz] of [[LV[5].x1, LV[5].z1, 1, 1], [LV[5].x0, LV[5].z1, -1, 1]]) corner(5, cx, cz, dx, dz, true, 1.6);
  await tick();
  { let nSt = 0;
    for (const rl of rails) {
      const pitchM = (rl.kind === 'jetty' ? 6.5 : rl.kind === 'well' ? 7 : rl.k === 0 ? 6 : rl.k === 5 ? 7 : 10) / dens;
      for (let s = sr.range(1.6, pitchM * 0.8); s < rl.l - 1.6; s += pitchM * sr.range(0.8, 1.2)) {
        const x = rl.ax + (rl.bx - rl.ax) * s / rl.l - rl.nx * 0.05, z = rl.az + (rl.bz - rl.az) * s / rl.l - rl.nz * 0.05, len = sr.range(2.0, 2.5), rad = sr.range(0.17, 0.21), period = sr.range(26, 60), ph = sr.range(0, TAU), fold = sr.chance(0.4), aims = [];
        for (let i = 0; i < 6; i++) aims.push([sr.range(-35, 35) * RAD, sr.range(20, 70) * RAD]);
        if (++nSt % 12 === 0) await tick();
        // the station's own standing room: 0.6 m behind the rail on the rail's own deck, with nothing standing in it
        const bx = x - rl.nx * 0.6, bz = z - rl.nz * 0.6;
        if (deckAt(bx, bz) !== rl.y || solids.some((q) => q.kind !== 'well' && bx + 0.45 > q.x0 && bx - 0.45 < q.x1 && bz + 0.45 > q.z0 && bz - 0.45 < q.z1 && rl.y + 1.9 > q.y0 && rl.y < q.y1)) continue;
        const st = { x, z, y: rl.y, nx: rl.nx, nz: rl.nz, tx: (rl.bx - rl.ax) / rl.l, tz: (rl.bz - rl.az) / rl.l, kind: rl.kind, k: rl.k, tube: null, why: '', folded: false, ph };
        const q = tryScope({ x, y: rl.y, z, nx: rl.nx, nz: rl.nz, len, rad, period, ph, k: rl.k, kind: rl.kind, great: false, pv: 1.42, tail: 0.5 }, aims);
        if (typeof q === 'string') { st.why = q; st.folded = fold; } else st.tube = q;
        stations.push(st);
      }
    }
  }
  await tick();
  // ---- posts (lantern posts by the stairs' heads; tall posts on the jetty, the summit's corners and the terraces' edges) and the kites that fly from them
  const posts = [], postPlan = [], kites = [], kr = R.kites, lr = R.lamps;
  const addPost = (x, z, y, hgt, lamp, inw = [x >= 0 ? -1 : 1, 0]) => {
    const p = { x, z, y, hgt, lamp, inw, ph: lr.range(0, TAU) };
    if (scopes.some((q) => q.y === y && Math.hypot(q.x - x, q.z - z) < 1.3) || postPlan.some((q) => Math.hypot(q.x - x, q.z - z) < 1.5) || hitBox(x - 0.15, x + 0.15, z - 0.15, z + 0.15, y, y + hgt, 0.3)) return null;
    postPlan.push(p);
    // (a tall post carries a pennant 1.5 m long at its head, a short one a lantern on an arm of half a metre: the post's whole reach)
    if (lane(x, y + hgt, z) < D.LANE + (hgt > 3.2 ? 1.5 : 0.5) || lane(x, y + hgt * 0.5, z) < D.LANE + 0.5) { leftOut.post++; p.out = true; return p; }
    posts.push(p); return p;
  };
  for (let k = 1; k <= 5; k++) for (const sgn of [-1, 1]) addPost(sgn * (stairs[k - 1].hw + 1.2), LV[k].z0 + 0.9, H(k), 3, true);
  const kitePosts = [];
  // (the jetty is dressed its whole length: a tall post with a lantern and a pennant every 10 m on both rails)
  for (let a = jetty.a1 + 3; a < jetty.len - 6; a += 10) for (const sgn of [-1, 1]) { const q = jettyPt(a, sgn * (jetty.hw + 0.25)); const p = addPost(q[0], q[1], jetty.y, 4.6, true, [-sgn * jetty.jz, sgn * jetty.jx]); if (p) { p.rail = sgn; kitePosts.push(p); } }
  for (const [cx, cz] of [[LV[5].x0, LV[5].z0], [LV[5].x1, LV[5].z0], [LV[5].x0, LV[5].z1], [LV[5].x1, LV[5].z1]]) { const p = addPost(cx, cz, H(5), 3.6, false); if (p) kitePosts.push(p); }
  for (let k = 0; k <= 4; k++) for (const t of [0.3, 0.7]) for (const east of [0, 1]) { const l = LV[k], z = lerp(l.z0, l.z1, t) + kr.range(-5, 5), x = east ? l.x1 : l.x0; if (k > 0 || inPoly0(x + (east ? -0.2 : 0.2), z)) { const p = addPost(x, z, H(k), 3.6, false); if (p) kitePosts.push(p); } }
  // THE WIND'S LAW: a kite flies down the wind from its post, on a string of 14 to 30 m (short enough that the hand's post and the
  // kite are seen together). On the jetty kites fly from THE LEE RAIL ONLY (the rail on the side the wind blows toward: one hand), and
  // down the wind on that rail's own side of the walk: none hangs over the walk.
  const lee = windA >= 0 ? 1 : -1;
  for (const p of kitePosts) {
    const L = kr.range(14, 30), e = kr.range(0.66, 1.08), da0 = windA + kr.range(-0.3, 0.3), da = p.rail ? lee * Math.max(Math.abs(da0), 0.12) : da0, size = kr.range(1.3, 1.9), amp = kr.range(0.035, 0.07), ph = kr.range(0, 40), tail = kr.range(4, 7), col = kr.int(0, 3), take = kr.chance(Math.min(0.95, 0.8 * dens));
    const A = [p.x, p.y + p.hgt, p.z], K = [A[0] + L * Math.cos(e) * Math.sin(da), A[1] + L * Math.sin(e), A[2] + L * Math.cos(e) * Math.cos(da)], sw = amp * 1.17 * L;
    // (the plan first: no kite from a post that does not stand, none whose string or body would cross a thing of the city or another kite;
    // then the line's say: the string's and the kite's whole reach, with their swing, and the tail's, 2.5 m and more from it)
    let ok = take && !p.out && (!p.rail || p.rail === lee), clear = true;
    for (let i = 1; i <= 10 && ok; i++) { const s = i / 10, q = [lerp(A[0], K[0], s), lerp(A[1], K[1], s), lerp(A[2], K[2], s)], r = 0.25 + sw * s + (i === 10 ? size : 0); if (hitBall(q[0], q[1], q[2], r)) ok = false; if (lane(q[0], q[1], q[2]) < D.LANE + 0.5 + r) clear = false; }
    if (!ok) continue;
    // (the tail as it is built: from the kite's foot it hangs down the wind, half its length along the string's own level heading and
    // nine tenths of it down; it swings with the kite about the post, on the longer arm)
    { const Tl = [K[0] + Math.sin(da) * 0.5 * tail, K[1] - 1.3 * size - 0.9 * tail, K[2] + Math.cos(da) * 0.5 * tail]; if (!clearSeg(K, Tl, 0.6 + sw, 0.6 + amp * 1.17 * (L + tail), 6)) clear = false; }
    for (let i = 2; i <= 10; i += 2) { const s = i / 10; balls.push({ x: lerp(A[0], K[0], s), y: lerp(A[1], K[1], s), z: lerp(A[2], K[2], s), r: 0.25 + sw * s + (i === 10 ? size : 0) }); }
    if (!clear) { leftOut.kite++; dealt.kites.push({ A, K, post: p, out: true }); continue; }
    const kt = { A, K, L, size, amp, ph, tail, col, post: p }; p.kite = kt; kites.push(kt); dealt.kites.push(kt);
  }
  await tick();
  // ---- washing lines between two posts on the terraces' bands
  const wash = [], wr = R.wash;
  for (let i = 0, n = 0, want = Math.round(9 * dens); i < 320 && n < want; i++) {
    const k = wr.int(0, 3), l = LV[k], x = wr.range(l.x0, l.x1), z = wr.range(l.z0, l.z1), alongX = wr.chance(0.5), len = wr.range(6, 9), sd = Math.floor(wr() * 1e9), ph = wr.range(0, TAU);
    const hx = alongX ? len / 2 : 0, hz = alongX ? 0 : len / 2, y = H(k);
    if (standOn(x - hx, z - hz, 1.4) !== k || standOn(x + hx, z + hz, 1.4) !== k || (Math.abs(x) - hx < 8.4 && z < LV[5].z0 + 1)) continue;
    if (hitBox(x - hx - 0.2, x + hx + 0.2, z - hz - 0.2, z + hz + 0.2, y, y + 2.8, 0.8)) continue;
    n++; const ws = { k, x, z, y, alongX, len, seed: sd, ph }; dealt.wash.push(ws);
    ws.box = addBox(x - hx - 0.2, x + hx + 0.2, z - hz - 0.2, z + hz + 0.2, y, y + 2.8, 'wash');
    if (!clearSeg([x - hx, y + 1.9, z - hz], [x + hx, y + 1.9, z + hz], 1.4, 1.4, 5)) { leftOut.wash++; ws.out = true; continue; }
    wash.push(ws);
  }
  // ---- MARKET STALLS: a table under an awning on four posts (3 m by 2 m). Up to five stand on the summit square in two rows, their
  // long sides to its middle way, 7.2 to 8 m from the way's middle (the way is kept open from the stairs' head to the jetty's landing,
  // the house fronts stand behind the rows); others are dealt on the terraces' open bands. One that would reach within the lane is left out after its draws (it is not dealt again).
  const stalls = [], sl = R.stalls;
  const addStall = (k, x, z, alongX, col, seed, ph) => {
    const hx = alongX ? 1.5 : 1.0, hz = alongX ? 1.0 : 1.5, y = H(k);
    if (standOn(x - hx, z - hz, 0.8) !== k || standOn(x + hx, z + hz, 0.8) !== k || hitBox(x - hx, x + hx, z - hz, z + hz, y, y + 2.9, 0.7) || stations.some((q) => q.y === y && Math.hypot(q.x - x, q.z - z) < 2.6)) return 0;
    const s = { k, x, z, y, alongX, col, seed, ph }; dealt.stalls.push(s);
    s.box = addBox(x - hx, x + hx, z - hz, z + hz, y, y + 2.9, 'stall');
    if (laneBox(x - hx, x + hx, y, y + 2.9, z - hz, z + hz) < D.LANE + 0.3) { leftOut.stall++; s.out = true; return 1; }
    stalls.push(s); return 1;
  };
  for (let i = 0, n = 0; i < 9; i++) { const sgn = sl.sign(), x = sgn * sl.range(7.2, 8), z = sl.range(LV[5].z0 + 5, LV[5].z1 - 5), col = sl.int(0, 3), seed = Math.floor(sl() * 1e9), ph = sl.range(0, TAU); if (n < 5) n += addStall(5, x, z, false, col, seed, ph); }
  for (let i = 0, n = 0, want = Math.round(7 * dens); i < 90; i++) {
    const k = sl.int(0, 4), l = LV[k], x = sl.range(l.x0, l.x1), z = sl.range(l.z0, l.z1), alongX = sl.chance(0.5), col = sl.int(0, 3), seed = Math.floor(sl() * 1e9), ph = sl.range(0, TAU);
    if (n < want && !(Math.abs(x) < 11.5 && z < LV[5].z0)) n += addStall(k, x, z, alongX, col, seed, ph);
  }
  // ---- THE SUMMIT SQUARE'S OWN THINGS: a round fountain in its middle (a low basin with a bowl on a short pillar, 1.8 m to the top of
  // its water: the middle way goes round it), four benches by its north and south rails
  const square = { fountain: null, benches: [] };
  { const l = LV[5], fx = 0, fz = (l.z0 + l.z1) / 2, r = 2.3;
    if (!hitBox(fx - r, fx + r, fz - r, fz + r, H(5), H(5) + 1.2, 0.3) && lane(fx, H(5) + 1.8, fz) >= D.LANE) { square.fountain = { x: fx, z: fz, y: H(5), r }; addBox(fx - r, fx + r, fz - r, fz + r, H(5), H(5) + 1.2, 'fountain'); }
    for (const [bx, bz, yaw] of [[-10.5, l.z0 + 1.1, 0], [10.5, l.z0 + 1.1, 0], [-10.5, l.z1 - 1.1, Math.PI], [10.5, l.z1 - 1.1, Math.PI]]) {
      if (hitBox(bx - 1, bx + 1, bz - 0.4, bz + 0.4, H(5), H(5) + 1, 0.3) || stations.some((q) => q.y === H(5) && Math.hypot(q.x - bx, q.z - bz) < 1.6) || laneBox(bx - 1, bx + 1, H(5), H(5) + 1, bz - 0.4, bz + 0.4) < D.LANE) continue;
      square.benches.push({ x: bx, z: bz, y: H(5), yaw }); addBox(bx - 1, bx + 1, bz - 0.4, bz + 0.4, H(5), H(5) + 1, 'bench');
    }
  }
  // ---- WASHING ACROSS THE STAIR STREET: over each flight two ropes are dealt, each from house wall to house wall where two of the street's
  // houses face one another, 3.4 to 5 m over the stairs there and under both houses' eaves. THE STREET'S LAW OF HEIGHTS: a rope hangs
  // over the LOWER half of its flight, where the walls stand highest over the steps (a rope over a flight's head would hang level
  // with the next terrace's own floor, across the way of everyone who comes off the stairs). One whose hanging cloth would reach within
  // the lane is left out after its draws.
  const lines = [], linePlan = [], ln = R.lines;
  for (let k = 0; k <= 4; k++) for (let j = 0; j < 2; j++) {
    const t = ln.range(0.06, 0.5), up = ln.range(3.4, 5), sd = Math.floor(ln() * 1e9), ph = ln.range(0, TAU);
    const zA = (k === 0 ? L0.z0 + 4 : LV[k].z0 + 3.5), zZ = LV[k + 1].z0 - 0.6, z = lerp(zA, zZ, t), y = bodyAt(0, z) + up;
    const a = houses.find((q) => (q.kind === 'street' || q.kind === 'tower') && q.k === k && q.x < 0 && Math.abs(z - q.z) < q.w / 2 - 0.6), b = houses.find((q) => (q.kind === 'street' || q.kind === 'tower') && q.k === k && q.x > 0 && Math.abs(z - q.z) < q.w / 2 - 0.6);
    if (!a || !b || y > H(k) + Math.min(a.hgt, b.hgt) - 0.5 || linePlan.some((q) => Math.abs(q.z - z) < 2.5 && Math.abs(q.y - y) < 2)) continue;
    const x0 = a.x + a.d / 2, x1 = b.x - b.d / 2; linePlan.push({ z, y });
    if (!clearSeg([x0, y - 0.7, z], [x1, y - 0.7, z], 1.1, 1.1, 10)) { leftOut.line++; continue; }
    lines.push({ k, z, y, x0, x1, seed: sd, ph });
  }
  await tick();
  // ---- THE PEOPLE, each about its own business by a standing law of the place (none of these laws names the line or the visitor):
  //   A WATCHER stands at a rail station and looks OUT AND DOWN over the rail: with an eye at the station's spyglass where it has one
  //   (along the tube's own aim), else bent over the rail along the rail's outward normal. A station has its watcher by one chance,
  //   the same whatever its side, its level or its tube (0.23 by the city's density, 0.4 at most); every great telescope has one.
  //   STAIR FOLK walk the stair street on its two files, by the street's rule: up on the one hand, down on the other, round and round
  //   (from the lowest deck up every flight, over the summit square beside its middle way and down the jetty's steps; they turn on the
  //   jetty's walk and at the street's foot), all at the street's own pace, each looking where it walks. The files are kept free: no
  //   other figure stands in them.
  //   TERRACE FOLK are at a terrace's own things and face the thing: tending an orchard tub, pegging washing on a line, drawing water at
  //   a dew catcher's cistern, at a market stall (one behind its table, one before it), winding a kite's cord at its post.
  //   THE LINE'S ONLY SAY: a figure whose whole reach (a metre about it, 2.6 m high) comes within 2.5 m of the line is left out after
  //   its draws (none is dealt in its place).
  const people = [], pr = R.people;
  // (every figure draws the same seven values: coat, phase, height, head dress, apron, shawl, what it carries)
  const figure = (rng) => ({ coat: rng.int(0, 4), ph: rng.range(0, TAU), tall: rng.range(0.98, 1.1), head: rng.int(0, 3), apron: rng.chance(0.4), shawl: rng.chance(0.3), carry: rng.int(0, 5) });
  const railSide = (nx, nz) => (Math.abs(nx) > Math.abs(nz) ? (nx > 0 ? 'E' : 'W') : (nz > 0 ? 'S' : 'N'));
  const ghosts = [], roomFor = (x, y, z, m) => !people.some((p) => Math.abs(p.y - y) < 2.5 && Math.hypot(p.x - x, p.z - z) < m) && !ghosts.some((p) => Math.abs(p.y - y) < 2.5 && Math.hypot(p.x - x, p.z - z) < m);
  const reachClear = (x, y, z) => lane(x, y + 1.1, z) >= D.LANE + 1.1 && lane(x, y + 2.0, z) >= D.LANE + 0.6;
  // THE STAIR STREET'S CIRCUIT (the city's frame): up the one file from the street's foot, flight by flight, over the summit square and
  // down the jetty's eight steps; across the jetty's walk; back by the other file; across at the street's foot. walkAt(s): the place and
  // the way a walker faces at s metres round it; the height is the flights' own, tread by tread (going up, the foot rises in the last
  // six tenths of a tread before each riser; going down a flight, it sinks in the first six tenths after it: never under the tread).
  // The moving material walks its figures by this same law (kind WALK in the shader).
  const flights = stairs.map((s) => ({ z0: s.z0, z1: s.z1, y0: s.y0, y1: s.y1, n: 18 })); flights.push({ z0: jetty.az + jetty.a0, z1: jetty.az + jetty.a1, y0: H(5), y1: jetty.y, n: 8 });
  const walk = { xf: 3.1, zA: stairs[0].z0 - 1.3, zB: jetty.az + jetty.a1 + 1.1, pace: 1.15, flights }; walk.lf = walk.zB - walk.zA; walk.len = 2 * walk.lf + 4 * walk.xf;
  const stairY = (z) => { let y = 0; for (const s of flights) { const dz = (s.z1 - s.z0) / s.n, u = (z - s.z0) / dz + (s.y1 > s.y0 ? 0.8 : 0.2), fl = Math.floor(u); y += (s.y1 - s.y0) / s.n * clamp(fl + ss(0.2, 0.8, u - fl), 0, s.n); } return y; };
  const walkAt = (s0) => {
    const { xf, zA, zB, lf, len } = walk, s = ((s0 % len) + len) % len, hh = 0.5, c1 = lf, c2 = lf + 2 * xf, c3 = 2 * lf + 2 * xf;
    const p = s < c1 ? [-xf, zA + s] : s < c2 ? [-xf + (s - c1), zB] : s < c3 ? [xf, zB - (s - c2)] : [xf - (s - c3), zA];
    const yaw = Math.PI / 2 * (ss(c1 - hh, c1 + hh, s) + ss(c2 - hh, c2 + hh, s) + ss(c3 - hh, c3 + hh, s) + ss(len - hh, len + hh, s) + ss(-hh, hh, s) - 1);
    return { x: p[0], y: stairY(p[1]), z: p[1], yaw, up: s < c1 - hh, down: s >= c2 + hh && s < c3 - hh };
  };
  // (the files' own ground, m metres about them: where no other figure stands)
  const onWalk = (x, z, m) => Math.abs(x) < walk.xf + m && z > walk.zA - m && z < walk.zB + m;
  // (the whole circuit against the lane: every walker goes round all of it, so all are left out together if any place of it comes within the lane)
  let walkClear = true; for (let s = 0; s < walk.len && walkClear; s += 0.5) { const q = walkAt(s); if (!reachClear(q.x, q.y, q.z)) walkClear = false; }
  for (const q of scopes) {
    if (!q.great) continue;
    const f = figure(pr), x = q.stand[0], y = q.stand[1], z = q.stand[2];
    if (deckAt(x, z) !== q.y || !roomFor(x, y, z, 1.3) || onWalk(x, z, 0.8)) continue;
    if (!reachClear(x, y, z)) { leftOut.watch++; ghosts.push({ x, y, z }); continue; }
    people.push({ ...f, x, y, z, deck: q.y, face: Math.atan2(q.aim[0], q.aim[2]), pose: 'watch', kind: 'watch', side: railSide(q.nx, q.nz), scope: q, carry: 5 }); q.manned = true;
  }
  for (const st of stations) {
    // (one chance for every station on every rail, with a tube or without: the watchers stand as the rails run, on every side alike)
    const f = figure(pr), q = st.tube, take = pr.chance(Math.min(0.4, 0.23 * dens));
    if (!take) continue;
    const x = q ? q.stand[0] : st.x - st.nx * 0.42, y = q ? q.stand[1] : st.y, z = q ? q.stand[2] : st.z - st.nz * 0.42;
    if (deckAt(x, z) !== st.y || !roomFor(x, y, z, 1.3) || onWalk(x, z, 0.8)) continue;
    if (!reachClear(x, y, z)) { leftOut.watch++; ghosts.push({ x, y, z }); continue; }
    people.push({ ...f, x, y, z, deck: st.y, face: q ? Math.atan2(q.aim[0], q.aim[2]) : Math.atan2(st.nx, st.nz), pose: q ? 'watch' : 'lean', kind: 'watch', side: railSide(st.nx, st.nz), scope: q, carry: 5 }); if (q) q.manned = true;
  }
  await tick();
  { const fr = R.folk, n = Math.round(24 * dens), slot = walk.len / n;
    for (let i = 0; i < n; i++) {
      const f = figure(fr), s0 = (i + fr.range(0.15, 0.85)) * slot, take = fr.chance(0.85), q = walkAt(s0);
      if (!take) continue;
      if (!walkClear) { leftOut.walk++; continue; }
      people.push({ ...f, x: q.x, y: q.y, z: q.z, deck: q.y, face: 0, pose: 'walk', kind: 'walk', s0, carry: f.carry > 2 ? 5 : f.carry });
    }
    await tick();
    // the terrace folk: 'own' is the thing's own box (the figure stands at it); a place off the thing's deck, in another thing or on another figure is no place
    const at = (y, x, z, face, f, pose, own, m = 0.5) => {
      const k = Math.round(y / D.lift), level = Math.abs(y - H(k)) < 1e-6;
      if ((level ? standOn(x, z, m) !== k : deckAt(x, z) !== y) || onWalk(x, z, 0.9) || solids.some((q) => q !== own && q.kind !== 'well' && x + 0.55 > q.x0 && x - 0.55 < q.x1 && z + 0.55 > q.z0 && z - 0.55 < q.z1 && y + 1.9 > q.y0 && y < q.y1) || !roomFor(x, y, z, 1.2) || (Math.abs(x) < 7.4 && z < LV[5].z0 + 4)) return;
      if (!reachClear(x, y, z)) { leftOut.terrace++; ghosts.push({ x, y, z }); return; }
      people.push({ ...f, x, y, z, deck: y, face, pose, kind: 'terrace' });
    };
    for (const t of dealt.tubs) { const f = figure(fr), a = fr.range(0, TAU), take = fr.chance(Math.min(0.5, 0.2 * dens)); if (take && !t.out) at(t.y, t.x + Math.sin(a) * 1.55, t.z + Math.cos(a) * 1.55, a + Math.PI, { ...f, carry: f.carry > 1 ? 5 : 0 }, 'reach', t.box); }
    for (const w of dealt.wash) { const f = figure(fr), u = fr.range(-0.35, 0.35) * w.len, side = fr.sign(), take = fr.chance(0.6); if (take && !w.out) at(w.y, w.x + (w.alongX ? u : side * 0.85), w.z + (w.alongX ? side * 0.85 : u), w.alongX ? (side > 0 ? Math.PI : 0) : (side > 0 ? -Math.PI / 2 : Math.PI / 2), { ...f, carry: 5 }, 'reach', w.box); }
    for (const d of dealt.dews) { const f = figure(fr), a = fr.range(0, TAU), take = fr.chance(0.5); if (take && !d.out) at(d.y, d.cx + Math.sin(a) * 2.35, d.cz + Math.cos(a) * 2.35, a + Math.PI, { ...f, carry: 3 }, 'stand', d.box); }
    for (const s of dealt.stalls) for (const side of [-1, 1]) { const f = figure(fr), u = fr.range(-0.7, 0.7), take = fr.chance(side < 0 ? 0.8 : 0.6); if (take && !s.out) at(s.y, s.x + (s.alongX ? u : side * 1.05), s.z + (s.alongX ? side * 1.05 : u), s.alongX ? (side > 0 ? Math.PI : 0) : (side > 0 ? -Math.PI / 2 : Math.PI / 2), { ...f, carry: side > 0 ? (f.carry > 2 ? 0 : f.carry) : 5 }, side < 0 ? 'hold' : 'stand', s.box); }
    // (a kite's flyer stands three quarters of a metre inside its post, the winder in its hands, and faces the kite)
    for (const kt of dealt.kites) { const f = figure(fr), take = fr.chance(0.55), p = kt.post, dx = kt.K[0] - kt.A[0], dz = kt.K[2] - kt.A[2]; if (take && !kt.out) at(p.y, p.x + p.inw[0] * 0.75, p.z + p.inw[1] * 0.75, Math.atan2(dx, dz), { ...f, carry: 5 }, 'fly', null, 0.2); }
  }
  await tick();
  // A FEW FOLK ON THE GANGWAY (the world's frame): five places dealt along it, an eighth of its length and more from either head; each
  // stands at one of its two rails and leans out over the cloud's sea by that rail's own outward side (two nearer than 4 m: the later
  // is no place; one within the lane is left out after its draws: the line passes 20 m under the walk)
  const gangFolk = [];
  { const G = gangway, gu = [G.b[0] / G.len, G.b[2] / G.len];
    for (let i = 0; i < 5; i++) {
      const f = figure(R.gang), s = R.gang.range(0.125, 0.875) * G.len, side = R.gang.sign(), x = G.a[0] + gu[0] * s - gu[1] * side * (G.hw - 0.32), z = G.a[2] + gu[1] * s + gu[0] * side * (G.hw - 0.32);
      if (gangFolk.some((q) => Math.abs(q.s - s) < 4)) continue;
      if (laneW(x, G.a[1] + 1.1, z) < D.LANE + 1.1) { leftOut.gang = (leftOut.gang || 0) + 1; continue; }
      gangFolk.push({ ...f, s, x, y: G.a[1], z, face: Math.atan2(-gu[1] * side, gu[0] * side), pose: 'lean', kind: 'gang', carry: 5 });
    } }
  // ---- hanging gardens: trails of leaves under the raft's edge, down the terraces' south walls and beside the stairs
  const gardens = [], gr = R.gardens;
  const addTrail = (x, y, z, len, nx, nz, kind) => { const sd = Math.floor(gr() * 1e9), ph = gr.range(0, TAU); if (clearSeg([x, y, z], [x, y - len, z], 1.5, 1.5 + 0.05 * len, 4)) gardens.push({ x, y, z, len, nx, nz, seed: sd, ph, kind }); };
  for (const rl of rails) {
    if (rl.kind !== 'edge' || rl.k !== 0) continue;
    for (let s = gr.range(1.5, 5); s < rl.l - 1; s += gr.range(5, 9) / dens) addTrail(rl.ax + (rl.bx - rl.ax) * s / rl.l + rl.nx * 0.5, -0.5, rl.az + (rl.bz - rl.az) * s / rl.l + rl.nz * 0.5, gr.range(4.5, 12), rl.nx, rl.nz, 'edge');
  }
  for (let k = 1; k <= 5; k++) {
    const l = LV[k];
    for (let x = l.x0 + gr.range(1.5, 4); x < l.x1 - 1.5; x += gr.range(4, 7) / dens) { const len = gr.range(3, 7.6); if (k < 5 || Math.abs(x - jetty.ax - 3 * jetty.jx / jetty.jz) > jetty.hw / jetty.jz + 2) addTrail(x, H(k) - 0.15, l.z1 + 0.4, len, 0, 1, 'wall'); }
    for (const sgn of [-1, 1]) addTrail(sgn * (stairs[k - 1].hw + 0.4 + gr.range(0.6, 1.5)), H(k) - 0.15, l.z0 - 0.4, gr.range(3, 6.5), 0, -1, 'wall');
  }
  await tick();
  // ---- kitchen smoke: the first few chimneys of a dealt order smoke; a column (rising 16 m and bending 8 m down the wind, 2.5 m wide at its
  // foot and 5 m at its head) that would reach within the lane is left out (no other chimney smokes in its place)
  const smokes = [], sm = R.smoke, chimAt = chimneyAt;
  { const can = dealt.houses.filter((q) => q.kind !== 'tower'); sm.shuffle(can);
    for (const hs of can.slice(0, Math.round(4 * dens))) { if (hs.out) continue; const c = chimAt(hs); if (clearSeg(c, [c[0] + wind[0] * 8, c[1] + 16, c[2] + wind[1] * 8], 2.5, 5, 6)) { hs.smoke = true; smokes.push(c); } else leftOut.smoke++; } }
  // ---- the pigeons' round: a level ring over the east terraces (the city's broad side), its middle 21 to 30 m and its own radius east of
  // the stair street's axis, 10 to 27 m over the fourth terrace. The plan deals rounds until one keeps 4 m from the mills' sails and the
  // kites' strings; that one is the round. The line's say, after: by the kit's law a bird of this flock keeps within 17.2 m of its round
  // (counted on seeds 1 to 40: the formation's spread, its wander and the bird's own span), so a round that comes within 2.5 m and that
  // pad of the line is left out (none is dealt in its place).
  let flock = null;
  for (let i = 0; i < 24; i++) {
    const r = R.far.range(14, 21), x = r + R.far.range(21, 30), z = R.far.range(-16, 40), y = H(4) + R.far.range(10, 27); let ok = !flock;
    for (let a = 0; a < 24 && ok; a++) if (hitBall(x + Math.cos(a / 24 * TAU) * r, y, z + Math.sin(a / 24 * TAU) * r, 4)) ok = false;
    if (ok) flock = { x, y, z, r };
  }
  if (flock) { let clear = true; for (let a = 0; a < 24; a++) if (lane(flock.x + Math.cos(a / 24 * TAU) * flock.r, flock.y, flock.z + Math.sin(a / 24 * TAU) * flock.r) < D.LANE + 17.2) clear = false; if (!clear) { leftOut.flock++; flock = null; } }
  await tick();
  // ---- THE WOOD'S TREES (the world's frame). The wood has two open places, both MADE and KEPT: THE RIDE (its axis from the glade to
  // the entry and on behind the entry, D.rideHalf to either side) and THE GLADE about the ladder leg's foot (D.glade: out to the
  // ride's far edge, so that the ride's last metres run through the glade's east side and the ladder's round stands in its open air).
  // woodD: how far a point lies from the nearer of the ride's axis and the glade's rim. Trees are dealt on a jittered grid within 75 m
  // of those two (beyond, the wood's roof is one shell); each is a trunk and a crown's ball. THE PLAN'S LAW OF THE OPEN PLACES: no tree
  // is planted in them, and none so near that its crown would hang into them: a tree stands back from the ride's kept width, from
  // the glade's rim and from the deer's glade by its own crown's whole reach to the side and the wind's sway (1.2 m); the same
  // before and behind the entry and where the ride runs into the glade. The line's only say comes after: a tree whose crown's ball
  // (with the sway) or trunk would still reach within 2.5 m of it, or of the entry's axis behind the entry, is left out after its
  // draws and the plan's tests (counted in leftOut.tree).
  const trees = [], treePlan = [], tg = R.trees, cell = 14 / Math.sqrt(dens);
  const woodD = (x, z) => Math.min(Math.hypot(x - rideX, z - clamp(z, 24, D.entryZ)), Math.abs(Math.hypot(x, z) - D.glade));
  let nLow = 0; while (nLow < nEye && ey[nLow] < 90) nLow++;
  for (let gx = (ws > 0 ? -105 : -130); gx < (ws > 0 ? 130 : 105); gx += cell) {
    for (let gz = -100; gz < 235; gz += cell) {
      const x = gx + tg.range(0.1, 0.9) * cell, z = gz + tg.range(0.1, 0.9) * cell, v = tg.int(0, 3), s = (v === 3 ? tg.range(1.5, 2.0) : tg.range(1.9, 2.7)), rot = tg.range(0, TAU), thin = tg();
      const d = woodD(x, z); if (d > 75) continue;
      // the kit's trees, measured: an oak of 12.5 m reaches 0.7 of its height to the side, a maple 0.54, a birch (13.5 m) 0.45; the crown hangs from
      // about a quarter of the height. A crown is taken as a flat ball round 0.62 of the height, widened by 1.2 m for the wind's sway.
      const hgt = (v === 3 ? 13.5 : 12.5) * s, back = hgt * (v < 2 ? 0.7 : v === 2 ? 0.54 : 0.45) + 1.2, rx = back + D.LANE, ry = hgt * 0.4 + 1.2 + D.LANE, cy = hgt * 0.62, y = ground(x, z);
      if ((Math.abs(x - rideX) < D.rideHalf + back && z > 24 - back) || Math.hypot(x, z) < D.glade + back || Math.hypot(x - deer.x, z - deer.z) < deer.r + back || Math.abs(x - streamX(z)) < 2.8) continue;
      // THE WOOD IS THINNED EVENLY: every tree draws its lot last, and those over the share are left out (the wood pays for the city and
      // the cloud); and no two trees of the plan stand within 5 m of one another. A tree that the line then leaves out keeps its
      // place in the plan: none is dealt into its room.
      if (thin > D.woodKeep || treePlan.some((t) => Math.hypot(t.x - x, t.z - z) < 5)) continue;
      treePlan.push({ x, z });
      // THE LINE'S SAY, after the plan's: the crown's ball with its sway, and the trunk, keep 2.5 m from the line and from the entry's
      // axis behind the entry (the true clearance in space; the world then measures every bough of the kit's own tree besides)
      let inCrown = false; for (let i = 0; i < nLow && !inCrown; i++) { const dx = ex[i] - x, dy = ey[i] - y - cy, dz = ez[i] - z; if ((dx * dx + dz * dz) / (rx * rx) + (dy * dy) / (ry * ry) < 1) inCrown = true; }
      for (let i = 0; i < nBack && !inCrown; i++) { const dx = bkx[i] - x, dy = bky[i] - y - cy, dz = bkz[i] - z; if ((dx * dx + dz * dz) / (rx * rx) + (dy * dy) / (ry * ry) < 1) inCrown = true; }
      if (inCrown || laneW(x, y + hgt * 0.12, z) < D.LANE + 1.6 * s) { leftOut.tree++; continue; }
      trees.push({ x, y, z, s, rot, v, d, near: d < 30, hgt, rx: rx - 1.2 - D.LANE });
    }
    await tick();
  }
  // ---- the trees that line the ride where it is carried back behind the entry (dealt after the wood, from the same stream, by
  // the same law of the ride's kept width and the same tests): one to a side in every row of 15 m, each up to 19 m behind the place
  // where its own crown would touch the ride's kept width, from where the wood's own trees end to 352 m back
  {
    const cell2 = 15 / Math.sqrt(dens);
    for (let gz = D.entryZ + 56; gz < D.entryZ + 352; gz += cell2) {
      for (const side of [-1, 1]) {
        const off = tg.range(0, 19), z = gz + tg.range(0.1, 0.9) * cell2, v = tg.int(0, 3), s = (v === 3 ? tg.range(1.5, 2.0) : tg.range(1.9, 2.7)), rot = tg.range(0, TAU), thin = tg();
        const hgt = (v === 3 ? 13.5 : 12.5) * s, back = hgt * (v < 2 ? 0.7 : v === 2 ? 0.54 : 0.45) + 1.2, rx = back + D.LANE, ry = hgt * 0.4 + 1.2 + D.LANE, cy = hgt * 0.62, x = rideX + side * (D.rideHalf + back + off), y = ground(x, z);
        const d = woodD(x, z); if (d <= 75) continue;
        if (Math.abs(x - streamX(z)) < 2.8 || thin > D.woodKeep || treePlan.some((t) => Math.hypot(t.x - x, t.z - z) < 5)) continue;
        treePlan.push({ x, z });
        let inCrown = false; for (let i = 0; i < nBack && !inCrown; i++) { const dx = bkx[i] - x, dy = bky[i] - y - cy, dz = bkz[i] - z; if ((dx * dx + dz * dz) / (rx * rx) + (dy * dy) / (ry * ry) < 1) inCrown = true; }
        if (inCrown || laneW(x, y + hgt * 0.12, z) < D.LANE + 1.6 * s) { leftOut.tree++; continue; }
        trees.push({ x, y, z, s, rot, v, d, near: false, back: true, hgt, rx: rx - 1.2 - D.LANE });
      }
    }
  }
  await tick();
  // ---- THE STREAM'S STONES (the world's frame): the stream runs in a bed of its own with stones along its two edges and some standing
  // in the water. A place every 1.6 m of its length from where it leaves the ride behind the entry to where it goes under the wood
  // north of the glade; three places in four hold a stone, on a dealt side: one in five of them out in the water (0.3 to 2.2 m from
  // the stream's middle, its head out of the water), the others on the water's edge (2.5 to 3.9 m from the middle, sunk a third
  // into the bank). The line's only say comes after (a stone within 2.5 m and its own size of it is left out after its draws).
  const stones = [], WATER = -1.05;
  for (let z = 194; z > -112; z -= 1.6) {
    const sn = R.stones, keep = sn() < 0.75, side = sn.sign(), q = sn(), r = sn.range(0.22, 0.75), fl = sn.range(0.45, 0.8), wide = sn.range(0.8, 1.4), sd = Math.floor(sn() * 1e9);
    if (!keep) continue;
    const wet = q < 0.2, ds = wet ? lerp(0.3, 2.2, q / 0.2) : lerp(2.5, 3.9, (q - 0.2) / 0.8), x = streamX(z) + side * ds, y = wet ? WATER - r * fl * 0.3 : Math.max(ground(x, z), WATER) - r * fl * 0.3;
    if (laneW(x, y, z) < D.LANE + r * 1.4) { leftOut.stone = (leftOut.stone || 0) + 1; continue; }
    stones.push({ x, y, z, r, fl, wide, seed: sd });
  }
  // further places of the line, each found on the line itself: where it passes under the gangway (after the round), where its climb from
  // the cloud comes to the LINE'S OWN cruising height beside the west rail (yRail: a measure of the line, read by the line's own
  // looks only; no rule of a thing reads it), where it comes over the north edge of the fifth terrace (the one under the
  // summit) on its way up the stair street; and under the jetty: where it passes over the south edge of the second terrace (the last
  // ledge before the lowest deck)
  place.gang = firstEye((x, y, z, i) => i * 2 > place.out && (x - gangway.a[0]) * (gangway.b[2] - gangway.a[2]) - (z - gangway.a[2]) * (gangway.b[0] - gangway.a[0]) >= 0);
  place.level = firstEye((x, y, z, i) => i * 2 > place.out && y >= yRail - 0.5);
  place.terrace = firstEye((x, y, z, i) => i * 2 > place.street && z >= LV[4].z0 + cZ);
  place.low = firstEye((x, y, z, i) => i * 2 > place.street && z >= LV[1].z1 + cZ);
  // two more: where, on the round, the city's middle comes square abeam of the line's own level heading (from there on it stands
  // before the beam: the round turns toward it); and where the line passes over the raft's south rail, under the jetty's walk
  { const mx = cX + raftMid[0], mz = cZ + raftMid[1];
    place.abeam = firstEye((x, y, z, i) => i * 2 > place.helix + 60 && i + 1 < nEye && (ex[i + 1] - x) * (mx - x) + (ez[i + 1] - z) * (mz - z) >= 0);
    // and where, further round, the city's middle stands at the climb's own look (D.climbSide degrees to the leg's side of the level
    // heading): from there the look can rest on the city while the round turns on
    const cs = Math.cos(D.climbSide * Math.PI / 180);
    place.cross = firstEye((x, y, z, i) => { if (i * 2 <= place.abeam || i + 1 >= nEye) return false; const hx = ex[i + 1] - x, hz = ez[i + 1] - z, tx = mx - x, tz = mz - z; return (hx * tx + hz * tz) / ((Math.hypot(hx, hz) || 1) * (Math.hypot(tx, tz) || 1)) >= cs; }); }
  place.southRail = firstEye((x, y, z, i) => i * 2 > place.street && z >= L0.z1 + cZ);
  // and where it passes over the foot of the jetty's own steps (jetty.a1 along the jetty: from there on the walk and its rail lie
  // at their full depth, 8.4 m, under the line)
  place.steps = firstEye((x, y, z, i) => i * 2 > place.street && z >= jetty.az + jetty.a1 + cZ);
  return {
    seed, hand: h, hour: hourName, rare, dens, sunEl, sunAz, wind, windA, stones, water: WATER, cloudTop, deckY, D, LV, cham, poly0, wells, stairs, jetty, jettyPt, onJetty, gangway, gaps, raftMid, anti, shadowAt, sOut, sX, straight1, stilts, ground, streamX, sAmp, sph, ws, m2, deer,
    knots, cpath, place, eyes: { n: nEye, x: ex, y: ey, z: ez }, back: { n: nBack, x: bkx, y: bky, z: bkz }, lane, laneW, laneBox, clearSeg, deckAt, bodyAt, inPoly0, inWell, inLv, H, solids, balls, leftOut, dealt,
    houses, bridge, tint, rails, mills, windAx, dews, tubs, scopes, stations, people, gangFolk, walk, walkAt, stairY, stalls, square, lines, posts, kites, wash, gardens, smokes, flock, trees, woodD, rideX, zIn, Rt, dl, xW, zW0, zTs, zTe, yRail, mSlope,
  };
}

// ---------------------------------------------------------------- the makers
// K is a pair of accumulators { s: still geometry, m: geometry moved in the shader }.
// a ribbon that turns its flat to the eye (kind LINE) from a to b: strings, ropes, stays; sway > 0 lets it swing about 'pivot' with the kite it holds
function addLine(K, a, b, halfW, col, ph = 0, sway = 0, pivot = a, segs = 1) {
  const g = K.m, d = _norm(_sub(b, a)); g.set(col, MAT.PLAIN); g._grow((segs + 1) * 2, segs * 6);
  const i0 = g.n;
  for (let i = 0; i <= segs; i++) { const t = i / segs, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; g.move(ANIM.LINE, ph, halfW, sway, pivot, d); g.v(p[0], p[1], p[2], 0, 1, 0); g.move(ANIM.LINE, ph, -halfW, sway, pivot, d); g.v(p[0], p[1], p[2], 0, 1, 0); }
  for (let i = 0; i < segs; i++) { const p = i0 + i * 2; g.tri3(p, p + 1, p + 3); g.tri3(p, p + 3, p + 2); }
  g.still();
}
// WASHING ON A ROPE from a to b: the rope sags between its ends (a parabola, 'sag' metres at the middle); on it hang sheets in folds,
// shirts by the hem with the sleeves down and trousers by the waist, each held by two pegs. A piece's top stays on the rope; only what
// hangs moves in the wind (along 'ax', square to the rope). Nothing hangs lower than 'drop' under the rope's ends.
function addWashing(K, a, b, o) {
  const m = K.m, rng = o.rng, len = Math.hypot(b[0] - a[0], b[2] - a[2]), d = [(b[0] - a[0]) / len, 0, (b[2] - a[2]) / len], ax = [d[2], 0, -d[0]], sag = o.sag;
  const on = (s, dy = 0, off = 0) => { const t = s / len; return [a[0] + d[0] * s + ax[0] * off, lerp(a[1], b[1], t) - sag * 4 * t * (1 - t) + dy, a[2] + d[2] * s + ax[2] * off]; };
  for (let i = 0; i < 6; i++) addLine(K, on(len * i / 6), on(len * (i + 1) / 6), 0.02, COL.rope);
  // a hanging quad: its two upper corners still, its two lower ones in the wind
  const hang = (p0, p1, p2, p3, k0, k1, all = false) => {
    m._grow(4, 6); const n = _norm(_cross(_sub(p1, p0), _sub(p3, p0)));
    if (all) m.move(ANIM.FLUTTER, o.ph, 0.2, 0.9, null, ax); else m.still();
    const i = m.v(p0[0], p0[1], p0[2], n[0], n[1], n[2], k0); m.v(p1[0], p1[1], p1[2], n[0], n[1], n[2], k0);
    m.move(ANIM.FLUTTER, o.ph, 0.2, 0.9, null, ax); m.v(p2[0], p2[1], p2[2], n[0], n[1], n[2], k1); m.v(p3[0], p3[1], p3[2], n[0], n[1], n[2], k1);
    m.tri3(i, i + 1, i + 2); m.tri3(i, i + 2, i + 3); m.still();
  };
  const peg = (s) => { const p = on(s, 0.05), q = on(s, -0.08); m.still(); m.set(COL.plankDark, MAT.PLAIN); m.beam(p, q, 0.035); };
  for (let u = o.u0; u < len - o.u1;) {
    const kind = rng(), col = rng.pick(o.cols), w = kind < 0.4 ? rng.range(0.9, 1.6) : kind < 0.75 ? rng.range(0.55, 0.7) : rng.range(0.44, 0.54);
    if (u + w > len - o.u1 + 0.4) break;
    const dropAt = (s) => o.drop - (lerp(a[1], b[1], s / len) - on(s)[1]);
    if (kind < 0.4) {
      // a sheet over the rope: pleats of a third of a metre, lit and shaded turn about, the hem a little uneven
      const n = Math.max(3, Math.round(w / 0.3)), h = Math.min(rng.range(0.8, 1.45), dropAt(u + w / 2));
      for (let j = 0; j < n; j++) { const s0 = u + w * j / n, s1 = u + w * (j + 1) / n, f0 = (j & 1 ? 1 : -1) * 0.06, f1 = -f0, e = (j & 1) ? 0.04 : 0; m.set(col, MAT.CLOTH); hang(on(s0, -0.02), on(s1, -0.02), on(s1 - 0.02, -h + e, f1), on(s0 + 0.02, -h + (e ? 0 : 0.04), f0), j & 1 ? 0.98 : 0.8, j & 1 ? 0.84 : 0.7); }
    } else if (kind < 0.75) {
      // a shirt pegged by its hem: the body in two folds, the sleeves hanging below the shoulders and a little out
      const h = Math.min(rng.range(0.66, 0.8), dropAt(u + w / 2) - 0.34), sl = 0.34;
      m.set(col, MAT.CLOTH); hang(on(u, -0.02), on(u + w / 2, -0.02), on(u + w / 2, -h, 0.05), on(u - 0.03, -h), 0.95, 0.84); hang(on(u + w / 2, -0.02), on(u + w, -0.02), on(u + w + 0.03, -h), on(u + w / 2, -h, 0.05), 0.8, 0.72);
      for (const sx of [0, 1]) { const s0 = sx ? u + w + 0.03 : u - 0.03, dir = sx ? 1 : -1; hang(on(s0, -h + 0.16), on(s0 - dir * 0.16, -h), on(s0 - dir * 0.02, -h - sl, 0.03), on(s0 + dir * 0.13, -h - sl + 0.05, 0.03), sx ? 0.74 : 0.9, sx ? 0.66 : 0.8, true); }
    } else {
      // trousers pegged by the waist: two legs with the air between them
      const h = Math.min(rng.range(0.95, 1.15), dropAt(u + w / 2)), lw = w * 0.44;
      m.set(col, MAT.CLOTH); hang(on(u, -0.02), on(u + w / 2, -0.02), on(u + lw - 0.03, -h, 0.04), on(u - 0.04, -h), 0.92, 0.8); hang(on(u + w / 2, -0.02), on(u + w, -0.02), on(u + w + 0.04, -h, -0.03), on(u + w - lw + 0.03, -h), 0.78, 0.68);
    }
    peg(u + 0.05); peg(u + w - 0.05);
    u += w + rng.range(0.18, 0.6);
  }
  m.still();
}
// a lantern hanging from a point: a small iron cage with a lit pane, swinging a little on the clock
function addLantern(K, top, ph, size = 1) {
  const g = K.m, s = 0.2 * size, y = top[1] - 0.5 * size;
  g.move(ANIM.SWAY, ph, 0.1, 1.3 + (ph % 1) * 0.5, top, [1, 0, 0]);
  g.set(COL.iron, MAT.IRON); g.beam(top, [top[0], y + s, top[2]], 0.04 * size); g.roof(top[0], y + s, top[2], s * 2, s * 2, s * 0.9, 0, 0.06 * size);
  g.set(COL.lamp, MAT.LAMP); g.box(top[0], y, top[2], s * 1.5, s * 2, s * 1.5, 0, 51);
  g.set(COL.iron, MAT.IRON); g.box(top[0], y - s - 0.03, top[2], s * 1.8, 0.06, s * 1.8, 0, 63);
  g.still();
}
// THE STILT: a mast of silvered staves and iron bands from y0 to y1 with a ladder winding up it, landings (a bench and
// a lantern on ours), stays, a stork's nest on a bracket and a bucket travelling on its rope. o: { x, z, y0, y1, r, ph, own }
export function addStilt(K, o, seed = 1) {
  const g = K.s, rng = makeRng(hashSeed('stilt:' + seed + ':' + Math.round(o.x) + ':' + Math.round(o.z))), sides = o.own ? 12 : 8, Hh = o.y1 - o.y0, x = o.x, z = o.z;
  const rAt = (y) => o.r * lerp(1.14, 0.84, clamp((y - o.y0) / Hh, 0, 1)), turn = 38, angAt = (y) => o.ph + (y - o.y0) / turn * TAU;
  // the mast, in lengths of about 12 m, each a little apart in tone; an iron band at every joint and two more between (every 4 m)
  const nSeg = Math.max(2, Math.round(Hh / 12));
  for (let i = 0; i < nSeg; i++) {
    const ya = o.y0 + Hh * i / nSeg, yb = o.y0 + Hh * (i + 1) / nSeg, k = 0.93 + rng() * 0.12;
    g.set(mixc(COL.mast, COL.mastDark, rng() * 0.3), MAT.MAST); g.cyl([x, ya, z], [x, yb, z], rAt(ya), rAt(yb), sides, k, k * 1.03);
    g.set(COL.iron, MAT.IRON); g.cyl([x, yb - 0.3, z], [x, yb + 0.3, z], rAt(yb) + 0.09, rAt(yb) + 0.09, sides);
    for (const f of [1 / 3, 2 / 3]) { const yh = lerp(ya, yb, f); g.cyl([x, yh - 0.16, z], [x, yh + 0.16, z], rAt(yh) + 0.07, rAt(yh) + 0.07, sides); }
  }
  // the plinth: two courses of stone and an iron shoe
  if (!o.cut) {
    g.set(mulc(COL.stone, 1.05), MAT.STONE); g.cyl([x, o.y0 - 2.5, z], [x, o.y0 + 1.1, z], o.r + 2.6, o.r + 2.3, 8, 0.8, 1, false, true); g.cyl([x, o.y0 + 1.1, z], [x, o.y0 + 2.3, z], o.r + 1.3, o.r + 1.1, 8, 0.9, 1, false, true);
    g.set(COL.iron, MAT.IRON); g.cyl([x, o.y0 + 2.3, z], [x, o.y0 + 3.5, z], rAt(o.y0) + 0.16, rAt(o.y0) + 0.12, sides);
  }
  // the ladder: two stiles and its rungs, winding once in 38 m
  const stepY = o.own ? 0.62 : 1.5, lr = (y) => rAt(y) + 0.34, at = (y, da, dr = 0) => { const a = angAt(y) + da; return [x + Math.cos(a) * (lr(y) + dr), y, z + Math.sin(a) * (lr(y) + dr)]; };
  g.set(mulc(COL.timberDark, 0.8), MAT.TIMBER);
  for (let y = o.y0 + 0.4; y < o.y1 - 3; y += stepY) {
    const y2 = Math.min(y + stepY, o.y1 - 3), w = 0.3 / lr(y), out = [Math.cos(angAt(y)), 0, Math.sin(angAt(y))];
    g.quadOut(at(y, -w, -0.04), at(y, -w, 0.07), at(y2, -w, 0.07), at(y2, -w, -0.04), [-out[2], 0, out[0]].map((q) => -q)); g.quadOut(at(y, w, -0.04), at(y, w, 0.07), at(y2, w, 0.07), at(y2, w, -0.04), [-out[2], 0, out[0]]);
    if (o.own || (Math.round(y / stepY) & 1)) g.quadOut(at(y, -w, 0.03), at(y, w, 0.03), at(y + 0.07, w, 0.03), at(y + 0.07, -w, 0.03), out);
  }
  // landings: a quarter ring of planks on brackets with a rail; on ours a bench and a lantern; stays up to the next band
  const gap = o.own ? 31 : 44, lands = [];
  for (let y = o.y0 + rng.range(14, 22); y < o.y1 - 22; y += gap * rng.range(0.85, 1.15)) lands.push(y);
  // (on the ladder leg the ladder's FIRST landing stands 5 m over its foot, with its rail, bench and lantern: the foot's own mark)
  for (const y of (o.own && !o.cut ? [o.y0 + 5, ...lands] : lands)) {
    const a0 = angAt(y) - 0.25, span = 1.55, r0 = rAt(y) + 0.05, r1 = rAt(y) + 2.7, n = 5, pt = (a, r, yy) => [x + Math.cos(a) * r, yy, z + Math.sin(a) * r];
    for (let i = 0; i < n; i++) {
      const a = a0 + span * i / n, b = a0 + span * (i + 1) / n;
      g.set(COL.plank, MAT.PLANK); g.quadOut(pt(a, r0, y), pt(a, r1, y), pt(b, r1, y), pt(b, r0, y), [0, 1, 0]); g.set(COL.plankDark, MAT.PLANK); g.quadOut(pt(a, r0, y - 0.18), pt(a, r1, y - 0.18), pt(b, r1, y - 0.18), pt(b, r0, y - 0.18), [0, -1, 0], 0.85); g.quadOut(pt(a, r1, y - 0.18), pt(b, r1, y - 0.18), pt(b, r1, y), pt(a, r1, y), [Math.cos(a), 0, Math.sin(a)], 0.8);
      g.set(COL.timberDark, MAT.TIMBER); g.beam(pt(a, r1 - 0.08, y), pt(a, r1 - 0.08, y + 1.05), 0.09); g.beam(pt(a, r1 - 0.08, y + 1.05), pt(b, r1 - 0.08, y + 1.05), 0.08); g.beam(pt(a, r1 - 0.08, y + 0.55), pt(b, r1 - 0.08, y + 0.55), 0.05);
      if (i % 2 === 0) g.beam(pt(a, r1 - 0.3, y - 0.1), pt(a, r0, y - 2.3), 0.16);
    }
    g.beam(pt(a0 + span, r1 - 0.08, y), pt(a0 + span, r1 - 0.08, y + 1.05), 0.09);
    const am = a0 + span * 0.62;
    if (o.own) { g.set(COL.plank, MAT.PLANK); g.box(...pt(am, r0 + 0.45, y + 0.45), 1.5, 0.08, 0.42, -am + Math.PI / 2); g.box(...pt(am, r0 + 0.45, y + 0.22), 1.3, 0.44, 0.1, -am + Math.PI / 2, 51, 0.7); }
    const lp = pt(a0 + span * 0.96, r1 - 0.2, y + 2.5); g.set(COL.iron, MAT.IRON); g.beam(pt(a0 + span * 0.96, r1 - 0.08, y + 1), [lp[0], lp[1] + 0.12, lp[2]], 0.06); addLantern(K, lp, rng.range(0, 40), o.own ? 1.25 : 1.6);
    // (where each lantern's light is: the world lays a glow on those that hang in the cloud)
    (K.lamps || (K.lamps = [])).push([lp[0], lp[1] - (o.own ? 0.62 : 0.8), lp[2]]);
    for (const f of [0.05, 0.95]) addLine(K, pt(a0 + span * f, r1 - 0.08, y + 1.05), pt(a0 + span * f, rAt(y + 13) + 0.1, y + 13), 0.03, COL.iron);
  }
  // THE BRACING (every leg is of the ladder leg's kind: a great mast of balks, hooped, braced and shored). Between the landings, a
  // crosstree at every 'brace' metres: two crossed balks through the mast under an iron hoop, a knee brace under each of their four
  // ends, and from each end a shroud up to the mast 15 m above. At the foot, four great raking shores from stone footings out in the
  // wood up to a hoop on the mast (on the city's far legs they stand out over the crowns: the leg is seen to stand in the wood).
  const brace = o.own ? 31 : 34, hoop = (y, w = 0.3) => { g.set(COL.iron, MAT.IRON); g.cyl([x, y - w, z], [x, y + w, z], rAt(y) + 0.12, rAt(y) + 0.12, sides); };
  for (let y = o.y0 + (o.own ? 31 : 64) + rng.range(0, 8); y < o.y1 - 26; y += brace) {
    if (lands.some((l) => Math.abs(l - y) < 7)) continue;
    const r = rAt(y), a = angAt(y) + 0.6, arm = r + 3.3; hoop(y - 0.5, 0.25);
    for (let k = 0; k < 2; k++) {
      const c = Math.cos(a + k * Math.PI / 2), sn = Math.sin(a + k * Math.PI / 2), yy = y + k * 0.42;
      g.set(mulc(COL.beam, 0.88), MAT.TIMBER); g.beam([x - c * arm, yy, z - sn * arm], [x + c * arm, yy, z + sn * arm], 0.4, 0.4, true);
      for (const sg of [-1, 1]) { g.set(mulc(COL.beam, 0.74), MAT.TIMBER); g.beam([x + sg * c * (arm - 0.3), yy - 0.2, z + sg * sn * (arm - 0.3)], [x + sg * c * rAt(y - 5), y - 5, z + sg * sn * rAt(y - 5)], 0.22); addLine(K, [x + sg * c * (arm - 0.1), yy + 0.2, z + sg * sn * (arm - 0.1)], [x + sg * c * rAt(y + 15), y + 15, z + sg * sn * rAt(y + 15)], 0.04, COL.iron); }
    }
  }
  if (!o.cut) {
    const out = o.own ? 10.5 : 17, up = o.own ? 21 : 52, w = o.own ? 0.6 : 0.9; hoop(o.y0 + up, 0.4);
    for (let k = 0; k < 4; k++) {
      const a = o.ph + 0.4 + k * TAU / 4, c = Math.cos(a), sn = Math.sin(a), f = [x + c * (o.r + out), o.y0 - 0.6, z + sn * (o.r + out)];
      g.set(mulc(COL.stone, 1.0), MAT.STONE); g.box(f[0], o.y0 - 0.2, f[2], 2.4, 2.6, 2.4, -a, 63, 0.8, 1);
      g.set(mulc(COL.mast, 0.92), MAT.TIMBER); g.beam(f, [x + c * (rAt(o.y0 + up) + 0.1), o.y0 + up, z + sn * (rAt(o.y0 + up) + 0.1)], w, w * 1.15, false, 0.95);
      // (a strut from the shore's middle in to the mast)
      g.set(mulc(COL.beam, 0.8), MAT.TIMBER); g.beam([x + c * (o.r + out * 0.5), o.y0 + up * 0.5 - 0.3, z + sn * (o.r + out * 0.5)], [x + c * rAt(o.y0 + up * 0.36), o.y0 + up * 0.36, z + sn * rAt(o.y0 + up * 0.36)], w * 0.6);
    }
  }
  return { rng, lands, rAt, angAt };
}
// a stork's nest on a bracket at height y on the side 'a' of a stilt, with its stork standing on it (a small sway on the clock)
export function addNest(K, o, st, y, a, ph) {
  const g = K.s, r = st.rAt(y), p = (rr, yy) => [o.x + Math.cos(a) * rr, yy, o.z + Math.sin(a) * rr], c = p(r + 2.6, y);
  g.set(COL.timberDark, MAT.TIMBER); g.beam(p(r - 0.1, y - 0.1), p(r + 3.2, y - 0.1), 0.2); g.beam(p(r, y - 2.4), p(r + 2.7, y - 0.2), 0.16);
  g.set(COL.straw, MAT.LEAF); g.cyl([c[0], y, c[2]], [c[0], y + 0.45, c[2]], 0.75, 1.1, 9, 0.6, 1); g.set(mulc(COL.straw, 0.55), MAT.LEAF); g.disc([c[0], y + 0.4, c[2]], [0, 1, 0], 0.95, 9, 0.8);
  const m = K.m, base = [c[0], y + 0.42, c[2]], b = [c[0], y + 1.35, c[2]], hd = [c[0] + Math.cos(a + 1.2) * 0.42, y + 2.0, c[2] + Math.sin(a + 1.2) * 0.42];
  m.move(ANIM.SWAY, ph, 0.035, 0.8, base, [Math.cos(a), 0, Math.sin(a)]);
  m.set(lin('#c0392b'), MAT.PLAIN); m.beam([c[0] - 0.1, y + 0.42, c[2]], [c[0] - 0.08, y + 1.15, c[2]], 0.045); m.beam([c[0] + 0.1, y + 0.42, c[2]], [c[0] + 0.08, y + 1.15, c[2]], 0.045);
  m.set(lin('#f3f1ea'), MAT.PLAIN); m.cyl([b[0] - Math.cos(a + 1.2) * 0.55, b[1] - 0.05, b[2] - Math.sin(a + 1.2) * 0.55], [b[0] + Math.cos(a + 1.2) * 0.3, b[1] + 0.12, b[2] + Math.sin(a + 1.2) * 0.3], 0.1, 0.26, 6, 0.75, 1, true, true); m.cyl([b[0] + Math.cos(a + 1.2) * 0.22, b[1] + 0.1, b[2] + Math.sin(a + 1.2) * 0.22], hd, 0.1, 0.07, 5);
  m.set(lin('#22252b'), MAT.PLAIN); m.cyl([b[0] - Math.cos(a + 1.2) * 0.75, b[1] - 0.16, b[2] - Math.sin(a + 1.2) * 0.75], [b[0] - Math.cos(a + 1.2) * 0.3, b[1] + 0.05, b[2] - Math.sin(a + 1.2) * 0.3], 0.03, 0.2, 5);
  m.set(lin('#d9482b'), MAT.PLAIN); m.cyl(hd, [hd[0] + Math.cos(a + 1.2) * 0.5, hd[1] - 0.22, hd[2] + Math.sin(a + 1.2) * 0.5], 0.05, 0.01, 4);
  m.still();
}
// a bucket travelling on its rope under an arm at height y on the side 'a' of a stilt: 'run' metres down and back, one round in 'period' seconds
export function addBucket(K, o, st, y, a, run, period, ph) {
  const g = K.s, r = st.rAt(y), p = (rr, yy) => [o.x + Math.cos(a) * rr, yy, o.z + Math.sin(a) * rr], e = p(r + 3.4, y), ta = [-Math.sin(a), 0, Math.cos(a)];
  // the jib: a balk out from the mast with a brace above it and a knee under it, and on its end the pulley: a wooden wheel in an iron fork
  g.set(COL.timberDark, MAT.TIMBER); g.beam(p(r - 0.1, y), p(r + 3.9, y), 0.3, 0.34, true); g.beam(p(r, y + 2.6), p(r + 3.1, y + 0.15), 0.18); g.beam(p(r, y - 1.9), p(r + 2.2, y - 0.15), 0.18);
  g.set(COL.iron, MAT.IRON); for (const sg of [-1, 1]) g.beam([e[0] + ta[0] * 0.2 * sg, y - 0.1, e[2] + ta[2] * 0.2 * sg], [e[0] + ta[0] * 0.2 * sg, y - 0.95, e[2] + ta[2] * 0.2 * sg], 0.07);
  g.set(mulc(COL.plank, 0.9), MAT.PLANK); g.cyl([e[0] - ta[0] * 0.13, y - 0.62, e[2] - ta[2] * 0.13], [e[0] + ta[0] * 0.13, y - 0.62, e[2] + ta[2] * 0.13], 0.46, 0.46, 10, 0.8, 1, true, true);
  addLine(K, [e[0], y - 0.9, e[2]], [e[0], y - run - 3.0, e[2]], 0.05, COL.rope);
  const m = K.m, by = y - 2.6; m.move(ANIM.TRAVEL, ph, run, period, e, [0, -1, 0]);
  m.set(COL.plank, MAT.PLANK); m.cyl([e[0], by - 1.0, e[2]], [e[0], by, e[2]], 0.42, 0.56, 10, 0.8, 1, true, false);
  m.set(COL.iron, MAT.IRON); m.cyl([e[0], by - 0.82, e[2]], [e[0], by - 0.7, e[2]], 0.455, 0.47, 10); m.cyl([e[0], by - 0.2, e[2]], [e[0], by - 0.08, e[2]], 0.545, 0.56, 10);
  m.beam([e[0] - 0.54, by, e[2]], [e[0], by + 0.8, e[2]], 0.05); m.beam([e[0] + 0.54, by, e[2]], [e[0], by + 0.8, e[2]], 0.05);
  m.set(COL.water, MAT.WATER); m.disc([e[0], by - 0.08, e[2]], [0, 1, 0], 0.5, 10);
  m.still();
}
// the head of a stilt under what it carries: struts fanning from a collar 'drop' metres under its top to the points 'to' (in the frame of the stilt's top)
export function addHead(K, o, to, drop = 17) {
  const g = K.s, y = o.y1 - drop, r = o.r * 0.9;
  g.set(COL.iron, MAT.IRON); g.cyl([o.x, y - 0.7, o.z], [o.x, y + 0.7, o.z], r + 0.22, r + 0.22, 10); g.cyl([o.x, o.y1 - 1.2, o.z], [o.x, o.y1, o.z], r + 0.5, r + 0.9, 10, 0.9, 1, false, true);
  g.set(mulc(COL.beam, 0.95), MAT.TIMBER);
  for (const t of to) { const d = Math.hypot(t[0], t[1]) || 1; g.beam([o.x + t[0] / d * r, y, o.z + t[1] / d * r], [o.x + t[0], o.y1 + (t[2] || 0), o.z + t[1]], 0.5, 0.62, false, 0.9); }
}
// THE SPYGLASS clamped on its rail: a brass tube as long as a man, in three draws, thicker toward its far glass, with a dark hood and
// a pale glint on the glass, pointed along q.aim (down over the rail, through a gap of the cloud at the land) and sweeping slowly
// about that aim on the clock (kind SCOPE); an iron shoe on the rail's top bar and a brass stem carry its fork; behind it the small
// step its watcher stands on. A GREAT one (q.great) rides a wheeled carriage with a standing board.
export function addSpyglass(K, q) {
  const g = K.s, m = K.m, piv = [q.x, q.y + q.pv, q.z], a = q.aim, f = (t) => [piv[0] + a[0] * t, piv[1] + a[1] * t, piv[2] + a[2] * t];
  const fl = Math.hypot(a[0], a[2]) || 1, fw = [a[0] / fl, 0, a[2] / fl], sd = [fw[2], 0, -fw[0]], r = q.rad, L = q.len, t0 = -q.tail, t1 = L - q.tail;
  const at = (dfw, dy, dsd = 0) => [q.x + fw[0] * dfw + sd[0] * dsd, q.y + dy, q.z + fw[2] * dfw + sd[2] * dsd];
  if (q.great) {
    // the carriage: two wheels on an axle, a bed of two beams with a trail, two cheeks up to the trunnions, a standing board with steps behind
    g.set(mulc(COL.timberDark, 0.62), MAT.TIMBER);
    for (const s of [-1, 1]) { g.cyl(at(0.2, 0.8, s * 0.95), at(0.2, 0.8, s * 1.12), 0.8, 0.8, 12, 0.75, 1, true, true); g.beam(at(-2.3, 0.25, s * 0.5), at(1.0, 0.95, s * 0.6), 0.2, 0.3); g.beam(at(-0.5, 0.75, s * 0.6), at(0, q.pv, s * (r + 0.16)), 0.2, 0.26); g.beam(at(0.75, 0.9, s * 0.6), at(0, q.pv, s * (r + 0.16)), 0.2, 0.26); }
    g.set(COL.iron, MAT.IRON); g.cyl(at(0.2, 0.8, -1.2), at(0.2, 0.8, 1.2), 0.1, 0.1, 6, 1, 1, true, true); g.cyl(at(0, q.pv, -(r + 0.3)), at(0, q.pv, r + 0.3), 0.08, 0.08, 6, 1, 1, true, true);
    g.set(COL.plank, MAT.PLANK); const bx = q.stand[0], bz = q.stand[2], yaw = Math.atan2(fw[0], fw[2]);
    g.box(bx, q.y + q.step - 0.05, bz, 1.5, 0.1, 1.0, yaw); g.box(bx - fw[0] * 0.75, q.y + q.step * 0.62, bz - fw[2] * 0.75, 1.3, 0.08, 0.5, yaw); g.box(bx - fw[0] * 1.2, q.y + q.step * 0.3, bz - fw[2] * 1.2, 1.3, 0.08, 0.5, yaw);
    g.set(mulc(COL.timberDark, 0.62), MAT.TIMBER); for (const s of [-1, 1]) { g.beam([bx + sd[0] * s * 0.65 + fw[0] * 0.4, q.y, bz + sd[2] * s * 0.65 + fw[2] * 0.4], [bx + sd[0] * s * 0.65 + fw[0] * 0.4, q.y + q.step, bz + sd[2] * s * 0.65 + fw[2] * 0.4], 0.12); g.beam([bx + sd[0] * s * 0.65 - fw[0] * 1.4, q.y, bz + sd[2] * s * 0.65 - fw[2] * 1.4], [bx + sd[0] * s * 0.65 + fw[0] * 0.4, q.y + q.step, bz + sd[2] * s * 0.65 + fw[2] * 0.4], 0.1); }
  } else {
    // the clamp: an iron shoe on the rail's top bar, a brass stem up to the tube's fork; the step behind
    const rx = q.x + q.nx * 0.05, rz = q.z + q.nz * 0.05;
    g.set(COL.iron, MAT.IRON); g.box(rx, q.y + 1.1, rz, 0.34, 0.2, 0.26, Math.atan2(q.nx, q.nz), 63);
    g.set(COL.brass, MAT.BRASS); g.cyl([rx, q.y + 1.18, rz], [q.x, q.y + q.pv - 0.1, q.z], 0.05, 0.045, 6); g.cyl([q.x, q.y + q.pv - 0.16, q.z], [q.x, q.y + q.pv - 0.06, q.z], 0.1, 0.08, 6);
    if (q.step > 0.05) { g.set(COL.plankDark, MAT.PLANK); const yaw = Math.atan2(fw[0], fw[2]); g.box(q.stand[0], q.y + q.step * 0.5, q.stand[2], 0.62, q.step, 0.44, yaw, 63, 0.75, 1); g.box(q.stand[0] - fw[0] * 0.42, q.y + q.step * 0.25, q.stand[2] - fw[2] * 0.42, 0.62, q.step * 0.5, 0.4, yaw, 63, 0.75, 1); }
  }
  m.move(ANIM.SCOPE, q.ph, q.sweep, q.period, piv, a);
  const sides = q.great ? 10 : 8;
  // the eyepiece, two draws, the great tube flaring to the far glass, a band at each joint, the dark hood
  m.set(mulc(COL.brass, 0.55), MAT.BRASS); m.cyl(f(t0), f(t0 + L * 0.06), r * 0.42, r * 0.34, 6, 1, 1, true, false);
  m.set(COL.brass, MAT.BRASS); m.cyl(f(t0 + L * 0.05), f(t0 + L * 0.37), r * 0.46, r * 0.46, 6, 0.85, 1);
  m.cyl(f(t0 + L * 0.35), f(t0 + L * 0.64), r * 0.68, r * 0.68, sides, 0.9, 1, true);
  m.cyl(f(t0 + L * 0.62), f(t1 - L * 0.05), r * 0.88, r, sides, 0.9, 1.06, true);
  m.set(mulc(COL.brass, 0.6), MAT.BRASS); m.cyl(f(t0 + L * 0.345), f(t0 + L * 0.375), r * 0.74, r * 0.74, sides); m.cyl(f(t0 + L * 0.615), f(t0 + L * 0.65), r * 0.95, r * 0.95, sides);
  m.set(lin('#3a2f22'), MAT.BRASS); m.cyl(f(t1 - L * 0.07), f(t1), r * 1.14, r * 1.14, sides, 1, 1, false, false);
  // the far glass and the glint on it
  m.set(COL.glass, MAT.GLASS); m.disc(f(t1 - L * 0.03), a, r * 1.08, sides);
  { const [e1, e2] = _frame(a), c = f(t1 - L * 0.025), o = [c[0] + (e1[0] * 0.3 - e2[0] * 0.35) * r, c[1] + (e1[1] * 0.3 - e2[1] * 0.35) * r, c[2] + (e1[2] * 0.3 - e2[2] * 0.35) * r]; m.set(lin('#d5ecfa'), MAT.GLASS); m.disc(o, a, r * 0.42, 6); }
  // the yoke that carries it (a great one: a finder on its back as well)
  m.set(mulc(COL.brass, 0.75), MAT.BRASS); m.box(piv[0], piv[1] - r * 0.6, piv[2], r * 2.5, r * 0.5, r * 2.5, Math.atan2(fw[0], fw[2]), 63);
  if (q.great) { const up = _cross(a, sd), o = (t) => { const p = f(t); return [p[0] + up[0] * r * 1.3, p[1] + up[1] * r * 1.3, p[2] + up[2] * r * 1.3]; }; m.set(COL.brass, MAT.BRASS); m.cyl(o(t0 + L * 0.3), o(t0 + L * 0.62), r * 0.22, r * 0.3, 6, 0.9, 1, true, true); }
  m.still();
}
// a spyglass folded and laid on the rail's top bar at a station that sees no gap: its draws pushed home, a strap about it
export function addFoldedTube(K, st) {
  const g = K.s, y = st.y + 1.24, cx = st.x + st.nx * 0.05, cz = st.z + st.nz * 0.05, a = [cx - st.tx * 0.5, y, cz - st.tz * 0.5], b = [cx + st.tx * 0.5, y, cz + st.tz * 0.5], mid = (k) => [lerp(a[0], b[0], k), y, lerp(a[2], b[2], k)];
  g.set(COL.brass, MAT.BRASS); g.cyl(a, mid(0.55), 0.08, 0.08, 6, 0.9, 1, true, false); g.cyl(mid(0.5), b, 0.1, 0.1, 6, 0.9, 1, false, true);
  g.set(COL.iron, MAT.IRON); g.box(cx, st.y + 1.2, cz, 0.12, 0.18, 0.26, Math.atan2(st.nx, st.nz), 63);
}
const KITE_COLS = [[COL.kiteA, COL.kiteB], [COL.kiteB, COL.cloth], [COL.kiteA, COL.cloth], [COL.kiteB, COL.kiteA]];
// THE KITE on its string: kt = { A (the post's head), K (the kite), size, amp, ph, tail, col }. Kite, tail and string swing together about A (kinds SWAY and LINE on one law)
export function addKite(K, kt) {
  const m = K.m, A = kt.A, C = kt.K, d = _norm(_sub(C, A)), sd = _norm(_cross(d, [0, 1, 0])), up = _cross(sd, d), s = kt.size, cols = KITE_COLS[kt.col % 4];
  addLine(K, A, C, 0.035, COL.rope, kt.ph, kt.amp, A, 7);
  m.move(ANIM.SWAY, kt.ph, kt.amp, kiteRate(kt.ph), A, [1, 0, 0]);
  const top = _add(C, up, s), bot = _add(C, up, -s * 1.3), l = _add(_add(C, sd, -s * 0.78), up, s * 0.25), r = _add(_add(C, sd, s * 0.78), up, s * 0.25), nose = _add(_add(C, d, s * 0.16), up, s * 0.2);
  m.set(cols[0], MAT.CLOTH); m.tri(top, l, nose); m.tri(top, nose, r); m.set(cols[1], MAT.CLOTH); m.tri(l, bot, nose, 1, 0.85, 1); m.tri(nose, bot, r, 1, 0.85, 1);
  m.set(mulc(COL.timberDark, 0.7), MAT.TIMBER); m.beam(top, bot, 0.05); m.beam(l, r, 0.05);
  // the tail: bows on a thread that hangs down the wind
  let p = bot; const hd = _norm([d[0], 0, d[2]]);
  for (let i = 0; i < 6; i++) {
    const q = [p[0] + hd[0] * kt.tail / 6 * 0.5, p[1] - kt.tail / 6 * 0.9, p[2] + hd[2] * kt.tail / 6 * 0.5], w = s * 0.22;
    m.set(cols[i & 1], MAT.CLOTH); m.tri(_add(q, sd, -w), _add(q, sd, w), _add(_add(q, sd, 0), up, w * 1.3)); m.tri(_add(q, sd, -w), _add(_add(q, sd, 0), up, -w * 1.3), _add(q, sd, w));
    m.set(COL.rope, MAT.PLAIN); m.quad(_add(p, sd, -0.03), _add(p, sd, 0.03), _add(q, sd, 0.03), _add(q, sd, -0.03));
    p = q;
  }
  m.still();
}
// THE WINDMILL: o = { x, z, y, hub (height of its axle over y), r (sails), tw (half the tower's foot), hx, hz, ph, rate, sails, roof, big }; axis: the wind's level direction
export function addWindmill(K, o, axis) {
  const g = K.s, m = K.m, yb = o.y, yt = o.y + o.hub, hubP = [o.hx, yt, o.hz], px = [-axis[2], 0, axis[0]];
  if (o.roof) { g.set(mulc(COL.timberDark, 0.8), MAT.TIMBER); g.beam([o.x, yb - 0.6, o.z], [o.x, yt + 0.3, o.z], 0.16); }
  else {
    // a tapered timber tower on four legs with boarded sides and a little cap
    const t0 = o.tw, t1 = o.tw * 0.5, yaw = Math.atan2(axis[0], axis[2]), c = Math.cos(yaw), s = Math.sin(yaw), P = (lx, y, lz) => [o.x + lx * c + lz * s, y, o.z - lx * s + lz * c];
    const lv = [0, 0.5, 1];
    for (let i = 0; i < 2; i++) {
      const ta = lerp(t0, t1, lv[i]), tb = lerp(t0, t1, lv[i + 1]), ya = lerp(yb, yt + 0.6, lv[i]), y2 = lerp(yb, yt + 0.6, lv[i + 1]);
      g.set(i === 0 ? COL.plank : COL.plankDark, MAT.PLANK);
      const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let j = 0; j < 4; j++) { const a = cs[j], b = cs[(j + 1) % 4], out = P((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2); g.quadOut(P(a[0] * ta, ya, a[1] * ta), P(b[0] * ta, ya, b[1] * ta), P(b[0] * tb, y2, b[1] * tb), P(a[0] * tb, y2, a[1] * tb), [out[0] - o.x, 0, out[2] - o.z], 0.85, 1); }
      g.set(mulc(COL.timberDark, 0.85), MAT.TIMBER); for (const a of cs) g.beam(P(a[0] * ta, ya, a[1] * ta), P(a[0] * tb, y2, a[1] * tb), 0.22);
    }
    g.set(COL.roof, MAT.TILE); g.roof(o.x, yt + 0.6, o.z, t1 * 2.3, t1 * 2.3, t1 * 1.5, yaw, 0.35);
    g.set(COL.plankDark, MAT.PLANK); g.box(o.x, lerp(yb, yt, 0.5), o.z, lerp(t0, t1, 0.5) * 2 + 1.5, 0.14, lerp(t0, t1, 0.5) * 2 + 1.5, yaw);
  }
  // the axle and a vane behind
  g.set(COL.iron, MAT.IRON); g.cyl([o.x + axis[0] * 0.9, yt, o.z + axis[2] * 0.9], hubP, 0.16, 0.16, 6, 1, 1, true, true);
  g.set(o.roof ? COL.shutter : COL.kiteB, MAT.CLOTH); const v0 = [o.x + axis[0] * 0.8, yt, o.z + axis[2] * 0.8], vl = o.roof ? o.r * 0.7 : o.r * 0.5; g.quad(_add(v0, [0, 1, 0], vl * 0.3), _add(_add(v0, axis, vl), [0, 1, 0], vl * 0.42), _add(_add(v0, axis, vl), [0, 1, 0], -vl * 0.42), _add(v0, [0, 1, 0], -vl * 0.3));
  // the sails: a spar, three bars and a cloth each, turning together about the axle
  m.move(ANIM.SPIN, o.ph, o.rate, 0, hubP, axis);
  m.set(COL.iron, MAT.IRON); m.cyl(_add(hubP, axis, -0.25), _add(hubP, axis, 0.12), 0.3, 0.2, 6, 1, 1, true, true);
  for (let i = 0; i < o.sails; i++) {
    const a = i / o.sails * TAU, u = [px[0] * Math.cos(a), Math.sin(a), px[2] * Math.cos(a)], w = _cross(axis, u), tip = _add(hubP, u, o.r), wd = o.r * 0.3;
    m.set(mulc(COL.timberDark, 0.85), MAT.TIMBER); m.beam(_add(hubP, axis, -0.1), _add(tip, axis, -0.1), o.r * 0.03 + 0.04);
    const c0 = _add(_add(hubP, u, o.r * 0.22), axis, -0.12), c1 = _add(tip, axis, -0.12);
    m.set(i & 1 ? COL.cloth : mixc(COL.cloth, COL.kiteA, 0.12), MAT.CLOTH); m.quad(c0, c1, _add(_add(c1, w, wd), axis, wd * 0.22), _add(_add(c0, w, wd), axis, wd * 0.22), 1, 0.9);
    m.set(mulc(COL.timberDark, 0.85), MAT.TIMBER); for (const f of [0.22, 0.61, 1]) { const b = _add(_add(hubP, u, o.r * f), axis, -0.1); m.beam(b, _add(_add(b, w, wd), axis, wd * 0.22), 0.05); }
  }
  m.still();
}
// where a house's chimney stands (the plan tests its smoke from here; the maker builds it here)
export const chimneyAt = (hs) => { const side = Math.abs(Math.sin(hs.yaw)) > 0.5, o = hs.chim * hs.w; return [hs.x + (side ? 0.7 : o), hs.y + hs.hgt + hs.rise + 1.1, hs.z + (side ? o : 0.7)]; };
const PLASTERS = [COL.plaster, COL.plasterPale, COL.plasterRose];
// A HOUSE: plaster walls with a shaded foot, timber corner posts, a tiled roof with wide eaves, windows with shutters
// (lit at night), flower boxes, a door with a step and sometimes an awning, a chimney, sometimes a balcony.
function addHouseGeo(K, hs, tint) {
  const g = K.s, rng = makeRng(hs.seed), c = Math.cos(hs.yaw), s = Math.sin(hs.yaw), w = hs.w, d = hs.d, Hh = hs.hgt, hw = w / 2, hd = d / 2;
  const P = (lx, ly, lz) => [hs.x + lx * c + lz * s, hs.y + ly, hs.z - lx * s + lz * c], N = (lx, lz) => [lx * c + lz * s, 0, -lx * s + lz * c];
  const wall = mulc(mixc(PLASTERS[hs.coat], lin('#f6e6c8'), tint.plaster * 0.4), 0.94 + rng() * 0.12), shut = mulc(mixc(COL.shutter, lin('#3f9a8c'), tint.shut * 0.6), 0.9 + rng() * 0.25);
  const roofC = mulc(mixc(mixc(COL.roof, lin('#c9683c'), tint.roof * 0.6), COL.roofDark, rng() * 0.45), 1.05), tim = mulc(COL.timberDark, 0.62);
  // the walls, each in three bands: the foot stained by the splash and the damp (dark at the ground, clean a metre up), the wall, and
  // the eaves' shade on its top (darkening up to the roof)
  g.set(wall, MAT.PLASTER);
  const ft = Math.min(1, Hh * 0.2), ev = Math.min(0.9, Hh * 0.18), wallQ = (a, b, n) => { g.quadOut(a(0), b(0), b(ft), a(ft), n, 0.6, 0.93); g.quadOut(a(ft), b(ft), b(Hh - ev), a(Hh - ev), n, 0.93, 1); g.quadOut(a(Hh - ev), b(Hh - ev), b(Hh), a(Hh), n, 1, 0.62); };
  wallQ((y) => P(-hw, y, hd), (y) => P(hw, y, hd), N(0, 1)); wallQ((y) => P(-hw, y, -hd), (y) => P(hw, y, -hd), N(0, -1));
  wallQ((y) => P(hw, y, -hd), (y) => P(hw, y, hd), N(1, 0)); wallQ((y) => P(-hw, y, -hd), (y) => P(-hw, y, hd), N(-1, 0));
  if (hs.gabled) { g.triOut(P(hw, Hh, -hd), P(hw, Hh, hd), P(hw, Hh + hs.rise, 0), N(1, 0)); g.triOut(P(-hw, Hh, -hd), P(-hw, Hh, hd), P(-hw, Hh + hs.rise, 0), N(-1, 0)); }
  g.set(roofC, MAT.TILE); g.roof(hs.x, hs.y + Hh, hs.z, w, d, hs.rise, hs.yaw, hs.over ?? 0.8, hs.gabled);
  // timber: the front's corner posts and a band at every floor
  const floors = Hh < 6.3 ? 1 : Hh < 9.6 ? 2 : Hh < 14 ? 3 : 5, fh = Hh / floors;
  g.set(tim, MAT.TIMBER); for (const sx of [-1, 1]) g.beam(P(sx * (hw - 0.05), 0, hd + 0.03), P(sx * (hw - 0.05), Hh, hd + 0.03), 0.24, 0.12);
  for (let f = 1; f < floors; f++) g.beam(P(-hw, f * fh, hd + 0.03), P(hw, f * fh, hd + 0.03), 0.2, 0.1);
  // windows with shutters on a wall: 'along' runs along the wall, 'out' looks out of it
  const windows = (x0, x1, at, out, door) => {
    const n = Math.max(1, Math.floor((x1 - x0) / 2.7)), o3 = N(out[0], out[1]), sr = makeRng(hashSeed('shutters:' + hs.seed + ':' + Math.round(x0 * 10) + ':' + out[0] + ':' + out[1]));
    for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
      const u = lerp(x0, x1, (i + 0.5) / n), y0 = f * fh + Math.min(1.15, fh * 0.3), y1 = Math.min(y0 + 1.35, (f + 1) * fh - 0.45), isDoor = door && f === 0 && i === (n >> 1), box = rng.chance(0.3), open = rng.chance(0.8);
      const Q = (du, y, off) => at(u + du, y, off);
      if (isDoor) {
        g.set(mulc(shut, 0.8), MAT.PLANK); g.quadOut(Q(-0.6, 0, 0.04), Q(0.6, 0, 0.04), Q(0.6, 2.15, 0.04), Q(-0.6, 2.15, 0.04), o3);
        g.set(mulc(COL.stone, 1.05), MAT.STONE); const st = Q(0, 0.1, 0.45); g.box(st[0], st[1], st[2], Math.abs(o3[0]) > 0.5 ? 0.9 : 1.7, 0.2, Math.abs(o3[0]) > 0.5 ? 1.7 : 0.9, 0, 63);
        if (rng.chance(0.4)) { const m = K.m, ac = rng.pick([COL.kiteA, COL.kiteB, COL.cloth, COL.shutter]); m.move(ANIM.FLUTTER, rng.range(0, 40), 0.06, 1.6, null, [0, 1, 0]); m.set(ac, MAT.CLOTH); m.quadOut(Q(-1.1, 2.75, 0.05), Q(1.1, 2.75, 0.05), Q(1.1, 2.3, 1.25), Q(-1.1, 2.3, 1.25), [0, 1, 0], 1, 0.85); m.still(); }
        continue;
      }
      g.set(COL.glass, MAT.WINDOW); g.quadOut(Q(-0.45, y0, 0.03), Q(0.45, y0, 0.03), Q(0.45, y1, 0.03), Q(-0.45, y1, 0.03), o3);
      // the sill, and its shade on the wall under it
      g.set(mulc(COL.stone, 1.1), MAT.PLAIN); g.quadOut(Q(-0.6, y0 - 0.09, 0.1), Q(0.6, y0 - 0.09, 0.1), Q(0.6, y0, 0.1), Q(-0.6, y0, 0.1), o3);
      g.set(mulc(wall, 0.56), MAT.PLASTER); g.quadOut(Q(-0.6, y0 - 0.34, 0.035), Q(0.6, y0 - 0.34, 0.035), Q(0.6, y0 - 0.09, 0.035), Q(-0.6, y0 - 0.09, 0.035), o3, 1.6, 1);
      // the shutters: shut, laid back flat on the wall, or (every other open pair, by a draw of their own) standing half open on their hinges
      const half = sr.chance(0.5), hx = half ? 0.3 : 0.46, ho = half ? 0.42 : 0.07;
      g.set(shut, MAT.PLANK);
      if (open) { g.quadOut(Q(-0.47 - hx, y0, ho), Q(-0.47, y0, 0.07), Q(-0.47, y1, 0.07), Q(-0.47 - hx, y1, ho), o3, half ? 0.86 : 1, half ? 0.86 : 1); g.quadOut(Q(0.47, y0, 0.07), Q(0.47 + hx, y0, ho), Q(0.47 + hx, y1, ho), Q(0.47, y1, 0.07), o3, half ? 1.06 : 1, half ? 1.06 : 1); }
      else g.quadOut(Q(-0.45, y0, 0.08), Q(0.45, y0, 0.08), Q(0.45, y1, 0.08), Q(-0.45, y1, 0.08), o3, 0.92, 1);
      if (box) {
        const b = Q(0, y0 - 0.14, 0.2); g.set(COL.plankDark, MAT.PLANK); g.box(b[0], b[1], b[2], Math.abs(o3[0]) > 0.5 ? 0.3 : 1.05, 0.24, Math.abs(o3[0]) > 0.5 ? 1.05 : 0.3, 0, 63);
        g.set(mixc(COL.leaf, COL.leafDark, rng()), MAT.LEAF); g.triOut(Q(-0.55, y0 - 0.05, 0.2), Q(0.55, y0 - 0.05, 0.2), Q(rng.range(-0.2, 0.2), y0 + 0.42, 0.34), o3); g.triOut(Q(-0.5, y0 - 0.02, 0.36), Q(0.5, y0 - 0.02, 0.36), Q(rng.range(-0.3, 0.3), y0 - 0.5, 0.4), o3, 1, 1, 0.8);
        g.set(rng.chance(0.5) ? COL.kiteB : COL.kiteA, MAT.PLAIN); for (let q = 0; q < 3; q++) { const fu = rng.range(-0.4, 0.4), fy = y0 + rng.range(0.05, 0.3); g.triOut(Q(fu - 0.09, fy, 0.37), Q(fu + 0.09, fy, 0.37), Q(fu, fy + 0.16, 0.39), o3); }
      }
    }
  };
  windows(-hw + 0.5, hw - 0.5, (u, y, off) => P(u, y, hd + off), [0, 1], true);
  if (hs.kind !== 'row') { windows(-hd + 0.4, hd - 0.4, (u, y, off) => P(hw + off, y, u), [1, 0], false); windows(-hd + 0.4, hd - 0.4, (u, y, off) => P(-hw - off, y, u), [-1, 0], false); }
  // the chimney
  const ch = chimneyAt(hs); g.set(mulc(wall, 0.9), MAT.PLASTER); g.box(ch[0], ch[1] - 1.5, ch[2], 0.75, 3, 0.75, 0, 51, 0.9, 1); g.set(mulc(roofC, 0.8), MAT.TILE); g.box(ch[0], ch[1] + 0.06, ch[2], 0.95, 0.14, 0.95, 0, 63);
  // a balcony on the front of some houses of two floors or more
  if (floors >= 2 && hs.kind !== 'tower' && rng.chance(0.38)) {
    const bw = Math.min(w * 0.55, 4.2), y = fh; g.set(COL.plank, MAT.PLANK); const b = P(0, y - 0.07, hd + 0.5); g.box(b[0], b[1], b[2], Math.abs(s) > 0.5 ? 1 : bw, 0.14, Math.abs(s) > 0.5 ? bw : 1, 0, 63);
    g.set(tim, MAT.TIMBER); g.beam(P(-bw / 2, y + 0.95, hd + 0.95), P(bw / 2, y + 0.95, hd + 0.95), 0.07); for (let i = 0; i <= 4; i++) g.beam(P(lerp(-bw / 2, bw / 2, i / 4), y, hd + 0.95), P(lerp(-bw / 2, bw / 2, i / 4), y + 0.95, hd + 0.95), 0.06);
    for (const sx of [-1, 1]) { g.beam(P(sx * bw / 2, y + 0.95, hd), P(sx * bw / 2, y + 0.95, hd + 0.95), 0.07); g.beam(P(sx * bw / 2, y - 0.1, hd + 0.9), P(sx * bw / 2, y - 0.9, hd + 0.02), 0.1); }
  }
}
// a lumpy ball of leaves: 'seg' sides and 'rings' rings, each vertex pushed in or out a little; darker underneath
function addBlob(g, c, rx, ry, rz, rng, seg = 6, rings = 3, col = COL.leaf) {
  g._grow(seg * (rings - 1) + 2, seg * 2 * (rings - 1) * 3);
  const i0 = g.n, tone = 0.85 + rng() * 0.3; g.set(mulc(col, tone), MAT.LEAF);
  g.v(c[0], c[1] + ry, c[2], 0, 1, 0, 1.12);
  for (let r = 1; r < rings; r++) { const ph = r / rings * Math.PI, sy = Math.cos(ph), sr = Math.sin(ph); for (let i = 0; i < seg; i++) { const a = (i + (r & 1) * 0.5) / seg * TAU, k = 0.82 + rng() * 0.36, nx = Math.cos(a) * sr, nz = Math.sin(a) * sr; g.v(c[0] + nx * rx * k, c[1] + sy * ry * k, c[2] + nz * rz * k, nx, sy, nz, 0.62 + 0.5 * (sy * 0.5 + 0.5)); } }
  const bot = g.v(c[0], c[1] - ry, c[2], 0, -1, 0, 0.5);
  for (let i = 0; i < seg; i++) g.tri3(i0, i0 + 1 + (i + 1) % seg, i0 + 1 + i);
  for (let r = 1; r < rings - 1; r++) { const a = i0 + 1 + (r - 1) * seg, b = a + seg; for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; g.tri3(a + i, a + j, b + i); g.tri3(a + j, b + j, b + i); } }
  const last = i0 + 1 + (rings - 2) * seg; for (let i = 0; i < seg; i++) g.tri3(bot, last + i, last + (i + 1) % seg);
}
// a rail along a line at height y: posts every 2.5 m or so, a top rail and a mid rail
function addRail(g, ax, az, bx, bz, y, hgt = 1.1) {
  const l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(l / 2.5));
  g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER);
  for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(ax, bx, t), z = lerp(az, bz, t); g.beam([x, y, z], [x, y + hgt, z], 0.13); }
  g.beam([ax, y + hgt, az], [bx, y + hgt, bz], 0.16, 0.09); g.beam([ax, y + hgt * 0.5, az], [bx, y + hgt * 0.5, bz], 0.06);
}
// THE WALLS OF A LIVED TOWN: every bay of every terrace's retaining wall that no house stands against is given, by its own lot (a stream
// of the seed), a blind arch with a door or a dark store in it, a drain spout with its stain, a vine climbing from a tub, or a small
// balcony on brackets. All lie within a metre of the wall; one whose box would come within the lane (2.5 m of the line) is left out after its lot.
async function addWallLife(K, P, tick) {
  const g = K.s, H = P.H, rng = makeRng(hashSeed('stilts-walls:' + P.seed));
  const covered = (x0, x1, z0, z1, y0, y1, kinds) => P.solids.some((q) => kinds.includes(q.kind) && x1 > q.x0 && x0 < q.x1 && z1 > q.z0 && z0 < q.z1 && y1 > q.y0 && y0 < q.y1);
  for (let k = 1; k <= 5; k++) {
    const l = P.LV[k], y0 = H(k - 1), y1 = H(k), cs = [[l.x0, l.z0], [l.x1, l.z0], [l.x1, l.z1], [l.x0, l.z1]], stone = mulc(lin('#cdbfa6'), 0.96 + 0.04 * k);
    for (let i = 0; i < 4; i++) {
      const a = cs[i], b = cs[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), tx = dx / len, tz = dz / len, out = [dz / len, 0, -dx / len], n = Math.max(2, Math.round(len / 4.6));
      for (let j = 0; j < n; j++) {
        const lot = rng(), lot2 = rng(), tone = 0.9 + rng() * 0.2, br = makeRng(Math.floor(rng() * 1e9)), s = (j + 0.5) / n * len, cx = a[0] + tx * s, cz = a[1] + tz * s, bw = len / n;
        // (every bay takes its four draws whatever stands there: a vine's own leaves are dealt from the bay's own stream 'br', so no bay's
        // lot hangs on what another bay was refused for)
        // the wall's own face at this bay, pushed out by d: a point u along the wall from the bay's middle, at height y
        const W = (u, y, d) => [cx + tx * u + out[0] * d, y, cz + tz * u + out[2] * d];
        const fx0 = Math.min(cx - Math.abs(tx) * 1.6, cx + out[0] * 0.1, cx + out[0] * 1.3) - 0.1, fx1 = Math.max(cx + Math.abs(tx) * 1.6, cx + out[0] * 0.1, cx + out[0] * 1.3) + 0.1, fz0 = Math.min(cz - Math.abs(tz) * 1.6, cz + out[2] * 0.1, cz + out[2] * 1.3) - 0.1, fz1 = Math.max(cz + Math.abs(tz) * 1.6, cz + out[2] * 0.1, cz + out[2] * 1.3) + 0.1;
        // not where a house, a stair or the stair street's own flight stands against the wall; not where the level below is not there (the raft's cut corners, a well)
        if (covered(fx0, fx1, fz0, fz1, y0, y1, ['house', 'stair']) || P.deckAt(cx + out[0] * 1.0, cz + out[2] * 1.0) !== y0 || P.laneBox(fx0, fx1, y0, y1, fz0, fz1) < P.D.LANE) continue;
        const clear = !covered(fx0, fx1, fz0, fz1, y0, y1, ['tub', 'dew', 'mill', 'wash', 'great']);
        if (lot < 0.46) {
          // a blind arch 2.6 m wide: jambs, a round head of dressed stones, the dark of the recess, and in it a door or a store's barrels
          const hw = 1.3, hj = 3.3, dark = mulc(stone, 0.34);
          g.set(dark, MAT.PLAIN); g.quadOut(W(-hw, y0, 0.05), W(hw, y0, 0.05), W(hw, y0 + hj, 0.05), W(-hw, y0 + hj, 0.05), out, 0.8, 1);
          for (let q = 0; q < 6; q++) { const a0 = q / 6 * Math.PI, a1 = (q + 1) / 6 * Math.PI; g.set(dark, MAT.PLAIN); g.triOut(W(0, y0 + hj, 0.05), W(Math.cos(a0) * hw, y0 + hj + Math.sin(a0) * hw, 0.05), W(Math.cos(a1) * hw, y0 + hj + Math.sin(a1) * hw, 0.05), out); g.set(mulc(stone, 1.12 * tone), MAT.PLAIN); g.quadOut(W(Math.cos(a0) * hw, y0 + hj + Math.sin(a0) * hw, 0.1), W(Math.cos(a1) * hw, y0 + hj + Math.sin(a1) * hw, 0.1), W(Math.cos(a1) * (hw + 0.42), y0 + hj + Math.sin(a1) * (hw + 0.42), 0.1), W(Math.cos(a0) * (hw + 0.42), y0 + hj + Math.sin(a0) * (hw + 0.42), 0.1), out, q & 1 ? 0.9 : 1.04); }
          g.set(mulc(stone, 1.1 * tone), MAT.STONE); for (const sx of [-1, 1]) g.quadOut(W(sx * hw, y0, 0.1), W(sx * (hw + 0.42), y0, 0.1), W(sx * (hw + 0.42), y0 + hj, 0.1), W(sx * hw, y0 + hj, 0.1), out, 0.85, 1);
          if (lot2 < 0.55) { g.set(mulc(mixc(COL.shutter, lin('#3f9a8c'), P.tint.shut * 0.6), 0.8 + lot2 * 0.5), MAT.PLANK); g.quadOut(W(-0.75, y0, 0.08), W(0.75, y0, 0.08), W(0.75, y0 + 2.5, 0.08), W(-0.75, y0 + 2.5, 0.08), out, 0.85, 1); g.set(mulc(COL.stone, 1.05), MAT.STONE); const st = W(0, y0 + 0.1, 0.5); g.box(st[0], st[1], st[2], Math.abs(out[0]) > 0.5 ? 0.9 : 2, 0.2, Math.abs(out[0]) > 0.5 ? 2 : 0.9, 0, 63); }
          else if (clear) for (const u of [-0.55, 0.5]) { const c = W(u, y0, 0.55); g.set(COL.plank, MAT.PLANK); g.cyl([c[0], y0, c[2]], [c[0], y0 + 1.1, c[2]], 0.45, 0.45, 8, 0.75, 1, false, true); g.set(COL.iron, MAT.IRON); g.cyl([c[0], y0 + 0.3, c[2]], [c[0], y0 + 0.4, c[2]], 0.47, 0.47, 8); g.cyl([c[0], y0 + 0.75, c[2]], [c[0], y0 + 0.85, c[2]], 0.47, 0.47, 8); }
        } else if (lot < 0.62) {
          // a drain: a stone spout near the wall's head and the long stain the water has left under it
          const u = (lot2 - 0.5) * bw * 0.5, sp = W(u, y1 - 1.5, 0.3); g.set(mulc(stone, 0.8), MAT.STONE); g.box(sp[0], sp[1], sp[2], Math.abs(out[0]) > 0.5 ? 0.7 : 0.34, 0.26, Math.abs(out[0]) > 0.5 ? 0.34 : 0.7, 0, 63);
          g.set(mulc(mixc(stone, COL.leafDark, 0.45), 0.62), MAT.PLAIN); g.triOut(W(u - 0.32, y1 - 1.62, 0.04), W(u + 0.32, y1 - 1.62, 0.04), W(u + 0.1 * (lot2 - 0.5), y0 + 0.4 + lot2 * 2, 0.04), out, 1, 1, 0.75);
        } else if (lot < 0.88 && clear) {
          // a vine out of a tub at the wall's foot: leaf masses climbing the bay, thinner upward
          const c = W(0, y0, 0.55); g.set(COL.plank, MAT.PLANK); g.cyl([c[0], y0, c[2]], [c[0], y0 + 0.6, c[2]], 0.42, 0.5, 8, 0.8, 1); g.set(lin('#6b5540'), MAT.TIMBER); g.beam([c[0], y0 + 0.5, c[2]], W(0.2, y0 + 3, 0.12), 0.09);
          const lc = mixc(COL.leaf, COL.leafDark, 0.2 + lot2 * 0.6), top = y0 + 3.5 + lot2 * 4.2, nb = 6 + Math.round(lot2 * 3);
          for (let q = 0; q < nb; q++) { const f = q / (nb - 1), yy = lerp(y0 + 1.2, top, f), u = (br() - 0.5) * lerp(1.6, bw * 0.8, f), r = lerp(0.95, 0.6, f) * (0.8 + br() * 0.4), p = W(u, yy, 0.22); addBlob(g, p, Math.abs(tx) > 0.5 ? r : r * 0.3, r * 0.9, Math.abs(tx) > 0.5 ? r * 0.3 : r, br, 5, 3, lc); }
        } else if (lot >= 0.88 && clear) {
          // a small balcony on two brackets with a rail, a door behind it
          const yb = y0 + 4.6; g.set(mulc(stone, 0.34), MAT.PLAIN); g.quadOut(W(-0.6, yb, 0.05), W(0.6, yb, 0.05), W(0.6, yb + 2.2, 0.05), W(-0.6, yb + 2.2, 0.05), out);
          g.set(COL.plank, MAT.PLANK); const c = W(0, yb - 0.07, 0.55); g.box(c[0], c[1], c[2], Math.abs(out[0]) > 0.5 ? 1.1 : 2.6, 0.14, Math.abs(out[0]) > 0.5 ? 2.6 : 1.1, 0, 63);
          g.set(mulc(COL.timberDark, 0.62), MAT.TIMBER); g.beam(W(-1.3, yb + 0.95, 1.05), W(1.3, yb + 0.95, 1.05), 0.07); for (let q = 0; q <= 4; q++) g.beam(W(lerp(-1.3, 1.3, q / 4), yb, 1.05), W(lerp(-1.3, 1.3, q / 4), yb + 0.95, 1.05), 0.06);
          for (const sx of [-1, 1]) { g.beam(W(sx * 1.3, yb + 0.95, 0.05), W(sx * 1.3, yb + 0.95, 1.05), 0.07); g.beam(W(sx * 1.1, yb - 0.1, 0.95), W(sx * 1.1, yb - 1, 0.05), 0.1); }
        }
      }
      await tick();
    }
  }
}
// THE RAFT AND THE TERRACES: the crossed beams, the plank deck with its light wells, the five stepped terraces with
// their stone walls, timber posts and paved tops, the stair street's flights, every rail.
async function addCityBase(K, P, tick) {
  const g = K.s, D = P.D, L0 = P.LV[0], H = P.H, ch = P.cham;
  const xL = (z) => L0.x0 + Math.max(0, ch[0] - (z - L0.z0)) + Math.max(0, ch[3] - (L0.z1 - z)), xR = (z) => L0.x1 - Math.max(0, ch[1] - (z - L0.z0)) - Math.max(0, ch[2] - (L0.z1 - z));
  // the deck in strips between every z where its outline or a well begins or ends
  const zs = [...new Set([L0.z0, L0.z0 + ch[0], L0.z0 + ch[1], L0.z1 - ch[2], L0.z1 - ch[3], L0.z1, ...P.wells.flatMap((q) => [q.z0, q.z1])])].sort((a, b) => a - b);
  for (let i = 0; i < zs.length - 1; i++) {
    const za = zs[i], zb = zs[i + 1], cuts = P.wells.filter((q) => q.z0 <= za + 1e-6 && q.z1 >= zb - 1e-6).sort((a, b) => a.x0 - b.x0);
    const xs = [[xL(za), xL(zb)], ...cuts.flatMap((q) => [[q.x0, q.x0], [q.x1, q.x1]]), [xR(za), xR(zb)]];
    for (let j = 0; j < xs.length; j += 2) {
      const a = xs[j], b = xs[j + 1];
      g.set(COL.plank, MAT.PLANK); g.quadOut([a[0], 0, za], [b[0], 0, za], [b[1], 0, zb], [a[1], 0, zb], [0, 1, 0]);
      g.set(mulc(COL.plankDark, 0.7), MAT.PLANK); g.quadOut([a[0], -0.5, za], [b[0], -0.5, za], [b[1], -0.5, zb], [a[1], -0.5, zb], [0, -1, 0]);
    }
  }
  // the deck's edge board all round, and each well's sides down through the beams
  g.set(COL.plankDark, MAT.PLANK);
  for (let i = 0; i < 8; i++) { const a = P.poly0[i], b = P.poly0[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1]; g.quadOut([a[0], -0.9, a[1]], [b[0], -0.9, b[1]], [b[0], 0.12, b[1]], [a[0], 0.12, a[1]], [dz, 0, -dx], 0.8, 1); }
  for (const q of P.wells) { g.set(mulc(COL.beam, 0.85), MAT.TIMBER); g.quadOut([q.x0, -3.2, q.z0], [q.x1, -3.2, q.z0], [q.x1, 0, q.z0], [q.x0, 0, q.z0], [0, 0, 1], 0.6, 1); g.quadOut([q.x0, -3.2, q.z1], [q.x1, -3.2, q.z1], [q.x1, 0, q.z1], [q.x0, 0, q.z1], [0, 0, -1], 0.6, 1); g.quadOut([q.x0, -3.2, q.z0], [q.x0, -3.2, q.z1], [q.x0, 0, q.z1], [q.x0, 0, q.z0], [1, 0, 0], 0.6, 1); g.quadOut([q.x1, -3.2, q.z0], [q.x1, -3.2, q.z1], [q.x1, 0, q.z1], [q.x1, 0, q.z0], [-1, 0, 0], 0.6, 1); }
  await tick();
  // the raft: great beams along x under greater beams along z, their heads standing out past the deck's edge
  for (let z = L0.z0 + 5; z < L0.z1 - 2; z += 10.5) { g.set(mulc(COL.beam, 0.9 + 0.1 * Math.sin(z)), MAT.TIMBER); g.beam([xL(z) - 1.3, -1.85, z], [xR(z) + 1.3, -1.85, z], 0.9, 2.7, true, 0.95); }
  for (let x = L0.x0 + 6; x < L0.x1 - 2; x += 11.5) { const za = L0.z0 + Math.max(0, ch[0] - (x - L0.x0), ch[1] - (L0.x1 - x)), zb = L0.z1 - Math.max(0, ch[3] - (x - L0.x0), ch[2] - (L0.x1 - x)); g.set(mulc(COL.beam, 0.82), MAT.TIMBER); g.beam([x, -4.6, za - 1.5], [x, -4.6, zb + 1.5], 1.1, 2.8, true, 0.9); }
  await tick();
  // the terraces: stone walls with timber posts, a board along the top, a paved top
  for (let k = 1; k <= 5; k++) {
    const l = P.LV[k], y0 = H(k - 1) - (k === 1 ? 0 : 0.0), y1 = H(k), cs = [[l.x0, l.z0], [l.x1, l.z0], [l.x1, l.z1], [l.x0, l.z1]];
    for (let i = 0; i < 4; i++) {
      const a = cs[i], b = cs[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), out = [dz / len, 0, -dx / len], n = Math.max(2, Math.round(len / 4.6));
      g.set(mulc(lin('#cdbfa6'), 0.96 + 0.04 * k), MAT.STONE); g.quadOut([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], out, 0.72, 1);
      g.set(mulc(COL.timberDark, 0.7), MAT.TIMBER); for (let j = 0; j <= n; j++) { const t = j / n, x = lerp(a[0], b[0], t) + out[0] * 0.1, z = lerp(a[1], b[1], t) + out[2] * 0.1; g.beam([x, y0, z], [x, y1, z], 0.3, 0.26); }
      g.set(COL.plankDark, MAT.PLANK); g.quadOut([a[0] + out[0] * 0.14, y1 - 0.55, a[1] + out[2] * 0.14], [b[0] + out[0] * 0.14, y1 - 0.55, b[1] + out[2] * 0.14], [b[0] + out[0] * 0.14, y1 + 0.1, b[1] + out[2] * 0.14], [a[0] + out[0] * 0.14, y1 + 0.1, a[1] + out[2] * 0.14], out);
    }
    g.set(lin('#d6ccb6'), MAT.STONE); g.quadOut([l.x0, y1, l.z0], [l.x1, y1, l.z0], [l.x1, y1, l.z1], [l.x0, y1, l.z1], [0, 1, 0]);
    await tick();
  }
  await tick();
  // the stair street's flights, each with low side walls
  for (const s of P.stairs) {
    const n = 18, dz = (s.z1 - s.z0) / n, dy = (s.y1 - s.y0) / n;
    for (let i = 0; i < n; i++) { const z = s.z0 + i * dz, y = s.y0 + i * dy; g.set(lin('#9c8d74'), MAT.PLAIN); g.quadOut([-s.hw, y, z], [s.hw, y, z], [s.hw, y + dy, z], [-s.hw, y + dy, z], [0, 0, -1], 0.62, 0.86); g.set(lin('#ddd3bd'), MAT.STONE); g.quadOut([-s.hw, y + dy, z], [s.hw, y + dy, z], [s.hw, y + dy, z + dz], [-s.hw, y + dy, z + dz], [0, 1, 0]); }
    for (const sx of [-1, 1]) { g.set(lin('#cdbfa6'), MAT.STONE); g.triOut([sx * s.hw, s.y0, s.z0], [sx * s.hw, s.y0, s.z1], [sx * s.hw, s.y1, s.z1], [sx, 0, 0], 0.75, 0.75, 1); g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER); g.beam([sx * s.hw, s.y0 + 1.1, s.z0], [sx * s.hw, s.y1 + 1.1, s.z1], 0.16, 0.1); for (let i = 0; i <= 5; i++) { const t = i / 5; g.beam([sx * s.hw, lerp(s.y0, s.y1, t), lerp(s.z0, s.z1, t)], [sx * s.hw, lerp(s.y0, s.y1, t) + 1.1, lerp(s.z0, s.z1, t)], 0.13); } }
  }
  await tick();
  await addWallLife(K, P, tick);
  let railN = 0;
  for (const r of P.rails) { addRail(g, r.ax, r.az, r.bx, r.bz, r.y); if (++railN % 6 === 0) await tick(); }
  await tick();
}
// a ring of round section about the centre c, in the upright plane square to the level direction d; radius R, tube r
function addTorus(g, c, d, R, r, seg = 40, sides = 8) {
  g._grow((seg + 1) * (sides + 1), seg * sides * 6);
  const i0 = g.n, e = [d[2], 0, -d[0]];
  for (let i = 0; i <= seg; i++) { const a = i / seg * TAU, ca = Math.cos(a), sa = Math.sin(a); for (let j = 0; j <= sides; j++) { const b = j / sides * TAU, cb = Math.cos(b), sb = Math.sin(b), q = R + r * cb; g.v(c[0] + e[0] * ca * q + d[0] * r * sb, c[1] + sa * q, c[2] + e[2] * ca * q + d[2] * r * sb, e[0] * ca * cb + d[0] * sb, sa * cb, e[2] * ca * cb + d[2] * sb, 0.9 + 0.1 * sb); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < sides; j++) { const p = i0 + i * (sides + 1) + j, q = p + sides + 1; g.tri3(p, q, p + 1); g.tri3(p + 1, q, q + 1); }
}
// THE JETTY, short, from the summit's south edge out over the raft's south side to THE BRASS RING at its end: its deck, its stringers
// and joists, posts down onto the terraces it passes over, braces from the raft's edge and from the head of the leg that stands beside
// it; the ring with its cheeks, lamps and pennants; the footbridge; the posts. Everything by the jetty's own measures (along, left).
async function addJettyAndRing(K, P, tick) {
  const g = K.s, J = P.jetty, y = J.y, hw = J.hw, H = P.H, Ln = J.len, d = [J.jx, 0, J.jz], lf = [J.jz, 0, -J.jx], a0 = J.a0, a1 = J.a1, yS = H(5), rise = (yS - y) / 8;
  const pt = (a, l, yy) => [J.ax + J.jx * a + J.jz * l, yy, J.az + J.jz * a - J.jx * l];
  // the landing at the summit's own height (a hand's breadth over its paving where it lies on it), its edge beam, its rails
  g.set(COL.plank, MAT.PLANK); g.quadOut(pt(0, -hw, yS + 0.04), pt(0, hw, yS + 0.04), pt(a0, hw, yS + 0.04), pt(a0, -hw, yS + 0.04), [0, 1, 0]);
  g.set(mulc(COL.beam, 0.9), MAT.TIMBER); g.beam(pt(a0 - 0.2, -hw, yS - 0.3), pt(a0 - 0.2, hw, yS - 0.3), 0.4, 0.6, true);
  for (const sx of [-1, 1]) { const aE = (3 + sx * J.jx * hw) / J.jz, p0 = pt(aE, sx * hw, 0), p1 = pt(a0, sx * hw, 0); addRail(g, p0[0], p0[2], p1[0], p1[2], yS); }
  // the flight of eight steps down to the walk: treads and risers, a stringer under each side, a sloping rail on each hand
  for (let i = 0; i < 8; i++) {
    const sa = a0 + (a1 - a0) * i / 8, sb = a0 + (a1 - a0) * (i + 1) / 8, sy = yS - rise * (i + 1) + 0.04;
    g.set(COL.plank, MAT.PLANK); g.quadOut(pt(sa, -hw, sy), pt(sa, hw, sy), pt(sb, hw, sy), pt(sb, -hw, sy), [0, 1, 0]);
    g.set(mulc(COL.plankDark, 0.8), MAT.PLANK); g.quadOut(pt(sa, -hw, sy), pt(sa, hw, sy), pt(sa, hw, sy + rise), pt(sa, -hw, sy + rise), d);
  }
  for (const sx of [-1, 1]) {
    g.set(mulc(COL.beam, 0.9), MAT.TIMBER); g.beam(pt(a0, sx * (hw - 0.4), yS - 0.7), pt(a1, sx * (hw - 0.4), y - 0.7), 0.4, 0.8, true);
    g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER);
    for (const t of [0, 0.5, 1]) { const a = lerp(a0, a1, t), yy = lerp(yS, y, t); g.beam(pt(a, sx * hw, yy), pt(a, sx * hw, yy + 1.1), 0.13); }
    g.beam(pt(a0, sx * hw, yS + 1.1), pt(a1, sx * hw, y + 1.1), 0.16, 0.09); g.beam(pt(a0, sx * hw, yS + 0.55), pt(a1, sx * hw, y + 0.55), 0.06);
  }
  // the walk: its deck, its underside, a stringer under each edge, a joist every 5 m
  g.set(COL.plank, MAT.PLANK); g.quadOut(pt(a1, -hw, y + 0.04), pt(a1, hw, y + 0.04), pt(Ln, hw, y + 0.04), pt(Ln, -hw, y + 0.04), [0, 1, 0]);
  g.set(mulc(COL.plankDark, 0.7), MAT.PLANK); g.quadOut(pt(a1, -hw, y - 0.4), pt(a1, hw, y - 0.4), pt(Ln, hw, y - 0.4), pt(Ln, -hw, y - 0.4), [0, -1, 0]);
  // (the ring's light lies on the last planks: three paler bands toward it)
  for (let i = 0; i < 3; i++) { g.set(mixc(COL.plank, COL.lamp, 0.16 + 0.14 * i), MAT.PLANK); g.quadOut(pt(Ln - 9 + i * 3, -hw + 0.3, y + 0.06), pt(Ln - 9 + i * 3, hw - 0.3, y + 0.06), pt(Ln - 6 + i * 3, hw - 0.3, y + 0.06), pt(Ln - 6 + i * 3, -hw + 0.3, y + 0.06), [0, 1, 0], 1 + 0.06 * i, 1.06 + 0.06 * i); }
  const under = (x, z) => { for (let k = 4; k >= 0; k--) if (P.inLv(k, x, z)) return H(k); return -1e9; };
  for (const sx of [-1, 1]) {
    g.set(mulc(COL.beam, 0.95), MAT.TIMBER); g.beam(pt(a1 - 0.5, sx * (hw - 0.4), y - 0.9), pt(Ln + 0.4, sx * (hw - 0.4), y - 0.9), 0.5, 1, true);
    // posts down onto whatever terrace lies under the stringer, every 9 m; past the raft's edge a long brace up from the edge beam
    let lastOn = null;
    for (let a = a0 + 1; a < Ln - 2; a += 9) { const p = pt(a, sx * (hw - 0.4), 0), u = under(p[0], p[2]); if (u > -1e8) { g.beam([p[0], u, p[2]], [p[0], Math.min(yS, a < a1 ? yS - 1 : y) - 1.3, p[2]], 0.36, 0.36, false, 0.9); lastOn = [a, u]; } }
    if (lastOn) { const b0 = lastOn[0], b1 = Math.min(Ln - 4, Math.max(a1 + 2, b0 + 22)); g.set(mulc(COL.beam, 0.85), MAT.TIMBER); g.beam(pt(b0, sx * (hw - 0.4), lastOn[1] + 0.3), pt(b1, sx * (hw - 0.4), y - 1.3), 0.6, 0.8, false, 0.9); }
  }
  g.set(mulc(COL.beam, 0.9), MAT.TIMBER); for (let a = a1 + 0.5; a < Ln; a += 5) g.beam(pt(a, -hw - 0.5, y - 0.62), pt(a, hw + 0.5, y - 0.62), 0.26, 0.4, true, 0.92);
  await tick();
  // the ring: a great brass eyepiece standing on the walk's end, its middle at the summit square's eye height (the line's own), a knurled
  // band outside it, held by two cheeks and a cradle beam; two great lanterns and three pennants on it
  const c = pt(Ln, 0, yS + P.D.EYE), Rr = 7.55, back = (p, m) => [p[0] - d[0] * m, p[1], p[2] - d[2] * m], ringPt = (ang, rr, m) => back([c[0] + lf[0] * Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr, c[2] + lf[2] * Math.cos(ang) * rr], m);
  g.set(COL.brass, MAT.BRASS); addTorus(g, c, d, Rr, 0.46, 44, 8); g.set(mulc(COL.brass, 0.62), MAT.BRASS); addTorus(g, back(c, 0.7), d, Rr + 0.15, 0.3, 44, 6);
  g._grow(45 * 2, 44 * 6); { const i0 = g.n; g.set(mulc(COL.brass, 0.8), MAT.BRASS); for (let i = 0; i <= 44; i++) { const a = i / 44 * TAU, p0 = ringPt(a, Rr + 0.2, 0.7), p1 = ringPt(a, Rr + 0.2, -0.1), nx = lf[0] * Math.cos(a), nz = lf[2] * Math.cos(a); g.v(p0[0], p0[1], p0[2], nx, Math.sin(a), nz, 0.8 + 0.2 * (i & 1)); g.v(p1[0], p1[1], p1[2], nx, Math.sin(a), nz, 1); } for (let i = 0; i < 44; i++) { const p = i0 + i * 2; g.tri3(p, p + 2, p + 3); g.tri3(p, p + 3, p + 1); } }
  g.set(mulc(COL.beam, 0.9), MAT.TIMBER);
  for (const sx of [-1, 1]) {
    const ang = (a) => (sx > 0 ? a : Math.PI - a);
    g.beam(pt(Ln - 5, sx * (hw - 0.3), y - 0.6), ringPt(ang(0.42), Rr - 0.1, 0.5), 0.5, 0.5, false, 0.95); g.beam(pt(Ln - 1, sx * (hw - 0.3), y - 0.6), ringPt(ang(-0.35), Rr - 0.1, 0.5), 0.5, 0.5); g.beam(pt(Ln - 9, sx * (hw - 0.6), y - 1.4), ringPt(ang(-1.25), Rr - 0.2, 0.5), 0.5, 0.5, false, 0.85);
    // a great lantern on an iron arm from the cheek, level with the ring's middle
    const lp = ringPt(ang(0.08), Rr - 1.5, 1.6); g.set(COL.iron, MAT.IRON); g.beam(ringPt(ang(0.3), Rr - 0.3, 0.6), [lp[0], lp[1] + 0.2, lp[2]], 0.09); addLantern(K, lp, sx > 0 ? 3.1 : 7.7, 2.4);
    g.set(mulc(COL.beam, 0.9), MAT.TIMBER);
  }
  // (the cradle: a great beam across under the ring's foot, wider than the walk, on two short struts from the stringers)
  g.beam(pt(Ln - 0.4, -6.4, y - 0.5), pt(Ln - 0.4, 6.4, y - 0.5), 0.6, 0.7, true); for (const sx of [-1, 1]) g.beam(pt(Ln - 5, sx * (hw - 0.4), y - 1.5), pt(Ln - 0.4, sx * 6, y - 0.9), 0.36, 0.36, false, 0.9);
  for (const a of [1.0, Math.PI / 2, Math.PI - 1.0]) { const p0 = ringPt(a, Rr + 0.3, 0.3), p1 = ringPt(a, Rr + 2.6, 0.3), m = K.m; g.set(mulc(COL.timberDark, 0.75), MAT.TIMBER); g.beam(p0, p1, 0.12); m.move(ANIM.FLUTTER, a * 5.3, 0.2, 1.1, null, [lf[0], 0, lf[2]]); m.set(a > 1.5 && a < 1.7 ? COL.kiteA : COL.kiteB, MAT.CLOTH); m.tri(p1, [p1[0], p1[1] - 0.9, p1[2]], [p1[0] + P.wind[0] * 2.4, p1[1] - 0.45, p1[2] + P.wind[1] * 2.4]); m.still(); }
  await tick();
  // the footbridge: a low timber arch between the two towers, with rails
  if (P.bridge) {
    const b = P.bridge, n = 8, yb = (t) => b.y + 0.7 * Math.sin(t * Math.PI);
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, xa = lerp(b.x0, b.x1, t0), xb = lerp(b.x0, b.x1, t1); g.set(COL.plank, MAT.PLANK); g.quadOut([xa, yb(t0), b.z - b.hw], [xb, yb(t1), b.z - b.hw], [xb, yb(t1), b.z + b.hw], [xa, yb(t0), b.z + b.hw], [0, 1, 0]); g.set(mulc(COL.plankDark, 0.75), MAT.PLANK); g.quadOut([xa, yb(t0) - 0.3, b.z - b.hw], [xb, yb(t1) - 0.3, b.z - b.hw], [xb, yb(t1) - 0.3, b.z + b.hw], [xa, yb(t0) - 0.3, b.z + b.hw], [0, -1, 0]);
      for (const sz of [-1, 1]) { g.set(mulc(COL.beam, 0.9), MAT.TIMBER); g.beam([xa, yb(t0) - 0.45, b.z + sz * b.hw], [xb, yb(t1) - 0.45, b.z + sz * b.hw], 0.22, 0.5); g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER); g.beam([xa, yb(t0) + 1.1, b.z + sz * b.hw], [xb, yb(t1) + 1.1, b.z + sz * b.hw], 0.12, 0.08); g.beam([xa, yb(t0), b.z + sz * b.hw], [xa, yb(t0) + 1.1, b.z + sz * b.hw], 0.1); } }
    for (const sz of [-1, 1]) for (const sx of [0, 1]) g.beam([sx ? b.x1 : b.x0, b.y - 3.4, b.z + sz * b.hw], [lerp(b.x0, b.x1, sx ? 0.72 : 0.28), yb(0.28) - 0.5, b.z + sz * b.hw], 0.2, 0.2, false, 0.85);
  }
  // the posts: a lantern on those that carry one (hung toward the walk), a pennant on the tall ones
  for (const p of P.posts) {
    g.set(mulc(COL.timberDark, 0.75), MAT.TIMBER); g.beam([p.x, p.y, p.z], [p.x, p.y + p.hgt, p.z], 0.16, 0.16, true);
    if (p.lamp) { const top = [p.x + p.inw[0] * 0.55, p.y + Math.min(p.hgt, 2.9), p.z + p.inw[1] * 0.55]; g.set(COL.iron, MAT.IRON); g.beam([p.x, top[1] + 0.05, p.z], [top[0], top[1] + 0.05, top[2]], 0.06); addLantern(K, top, p.ph, 1.2); }
    if (p.hgt > 3.2 && !p.kite) { const m = K.m; m.move(ANIM.FLUTTER, p.ph, 0.16, 1.2, null, [1, 0, 0]); m.set(p.ph % 2 > 1 ? COL.kiteA : COL.kiteB, MAT.CLOTH); m.tri([p.x, p.y + p.hgt - 0.1, p.z], [p.x, p.y + p.hgt - 0.75, p.z], [p.x + P.wind[0] * 1.5, p.y + p.hgt - 0.45, p.z + P.wind[1] * 1.5]); m.still(); }
  }
  await tick();
}
// THE CITY'S FOLK, plainly dressed: a coat or a smock, trousers or a skirt; on the head a cap, a kerchief or nothing; some in an apron,
// some with a shawl over the shoulders; a basket on the arm or on the head, a bundle on the shoulder, a jug in the hand. No faces.
// Each by its pose: 'watch' (bent to a spyglass's eyepiece, hands on the tube), 'lean' (bent over the rail on its forearms, looking
// out and down), 'walk' (the stair street's walkers: kind WALK), 'reach' (arms up at a tree or a washing line), 'hold' (hands on a
// stall's table), 'fly' (a kite's winder in the hands, the head back), 'stand'. All but the walkers shift their weight on the clock.
const DRESS = {
  skirt: [lin('#7a5a4a'), lin('#5d6f8a'), lin('#85845f'), lin('#9a4f48'), lin('#6b6470')], kerchief: [lin('#e4ddc9'), lin('#b5563f'), lin('#c9a23f'), lin('#5f86a0')],
  cap: [lin('#4f463c'), lin('#6a6f78'), lin('#7a5c3e')], hair: [lin('#2e2620'), lin('#5a4630'), lin('#8c8478')],
  trouser: [lin('#4b4a52'), lin('#5b5040'), lin('#3f4a55')], skin: lin('#b98d6a'), apron: lin('#e9e4d4'), basket: lin('#b08a4e'),
};
function addFigure(K, p) {
  const m = K.m, walk = p.pose === 'walk', yaw = walk ? 0 : p.face, f = [Math.sin(yaw), 0, Math.cos(yaw)], sd = [f[2], 0, -f[0]], t = p.tall, foot = [p.x, p.y, p.z];
  const at = (fw, up, sw = 0) => [p.x + f[0] * fw + sd[0] * sw, p.y + up * t, p.z + f[2] * fw + sd[2] * sw];
  // (a walker's parts are marked: which leg, which arm; the others sway together about the foot)
  const part = (leg = 0, arm = 0) => { if (walk) m.move(ANIM.WALK, p.s0, 0, 0, foot, [leg, 0, arm]); };
  if (!walk) m.move(ANIM.SWAY, p.ph, 0.022, 0.55 + (p.ph % 1) * 0.3, foot, sd);
  const woman = p.head >= 2, v = Math.floor(p.ph * 7.3) % 5, coat = COL.coat[p.coat], bent = p.pose === 'watch' || p.pose === 'lean';
  // where the hips, the shoulders and the head are (forward, up), and the head's own lean
  const hip = bent ? [-0.1, 0.86] : [0, 0.88], sh = p.pose === 'lean' ? [0.2, 1.33] : p.pose === 'watch' ? [0.24, 1.4] : [0.03, 1.44];
  const hd = p.pose === 'lean' ? [0.36, 1.4] : p.pose === 'watch' ? [0.33, 1.47] : p.pose === 'fly' ? [0.0, 1.5] : [0.05, 1.5], hup = p.pose === 'lean' ? [0.1, 0.14] : p.pose === 'watch' ? [0.08, 0.15] : p.pose === 'fly' ? [-0.06, 0.17] : [0.01, 0.18];
  // legs: trousers, or a skirt over two feet
  if (woman) {
    m.set(DRESS.trouser[0], MAT.CLOTH); part(-1); m.beam(at(0.02, 0, -0.1), at(0, 0.2, -0.1), 0.13); part(1); m.beam(at(0.02, 0, 0.1), at(0, 0.2, 0.1), 0.13);
    part(); m.set(DRESS.skirt[v], MAT.CLOTH); m.cyl(at(hip[0] * 0.3, 0.14), at(hip[0], 0.95), 0.32, 0.21, 7, 0.75, 1);
  } else { m.set(DRESS.trouser[v % 3], MAT.CLOTH); part(-1); m.beam(at(-0.02, 0, -0.12), at(hip[0], 0.9, -0.1), 0.18); part(1); m.beam(at(0.02, 0, 0.12), at(hip[0], 0.9, 0.1), 0.18); }
  part(); m.set(coat, MAT.CLOTH); m.cyl(at(hip[0], hip[1] - 0.02), at(sh[0], sh[1]), 0.26, 0.21, 7, 0.82, 1, true, true);
  if (p.apron) { m.set(DRESS.apron, MAT.CLOTH); m.quadOut(at(hip[0] + 0.3, 0.42, -0.2), at(hip[0] + 0.3, 0.42, 0.2), at(lerp(hip[0], sh[0], 0.5) + 0.26, 1.14, 0.15), at(lerp(hip[0], sh[0], 0.5) + 0.26, 1.14, -0.15), f, 0.9, 1); }
  if (p.shawl) { m.set(DRESS.kerchief[(v + 1) % 4], MAT.CLOTH); m.triOut(at(sh[0] - 0.25, sh[1] + 0.02, -0.27), at(sh[0] - 0.25, sh[1] + 0.02, 0.27), at(lerp(hip[0], sh[0], 0.35) - 0.3, 1.0, 0), [-f[0], 0, -f[2]], 1, 1, 0.85); m.quadOut(at(sh[0] - 0.2, sh[1] + 0.04, -0.28), at(sh[0] - 0.2, sh[1] + 0.04, 0.28), at(sh[0] + 0.18, sh[1] - 0.02, 0.24), at(sh[0] + 0.18, sh[1] - 0.02, -0.24), [0, 1, 0]); }
  // arms, by the pose and by what is carried (cs: the hand that carries)
  const cs = v & 1 ? 1 : -1, free = p.pose === 'walk' || p.pose === 'stand';
  const arm = (s, to, mark = 0) => { part(0, mark); m.set(coat, MAT.CLOTH); m.beam(at(sh[0], sh[1] - 0.05, s * 0.27), to, 0.11); m.set(DRESS.skin, MAT.PLAIN); m.box(to[0], to[1], to[2], 0.09, 0.09, 0.09, yaw, 63); };
  const hands = p.pose === 'watch' ? [at(0.56, 1.5, -0.1), at(0.56, 1.5, 0.1)] : p.pose === 'lean' ? [at(0.45, 1.16 / t, -0.2), at(0.45, 1.16 / t, 0.2)] : p.pose === 'reach' ? [at(0.42, 1.78, -0.17), at(0.46, 1.62, 0.17)]
    : p.pose === 'hold' ? [at(0.42, 1.02, -0.16), at(0.42, 1.02, 0.16)] : p.pose === 'fly' ? [at(0.36, 1.2, -0.12), at(0.36, 1.2, 0.12)] : [at(0.06, 0.9, -0.31), at(0.06, 0.9, 0.31)];
  if (free && p.carry <= 2) hands[cs > 0 ? 1 : 0] = p.carry === 0 ? at(0.16, 1.02, cs * 0.34) : p.carry === 1 ? at(0.06, 1.84, cs * 0.2) : at(0.1, 1.4, cs * 0.2);
  arm(-1, hands[0], free && !(p.carry <= 2 && cs < 0) ? 1 : 0); arm(1, hands[1], free && !(p.carry <= 2 && cs > 0) ? -1 : 0);
  part();
  // the head and what is on it: a cap with its peak, bare hair, or a kerchief with its tail behind
  const h0 = at(hd[0], hd[1] - 0.04), h1 = at(hd[0] + hup[0], hd[1] + hup[1]), top = (k) => [h0[0] + (h1[0] - h0[0]) * k, h0[1] + (h1[1] - h0[1]) * k, h0[2] + (h1[2] - h0[2]) * k];
  m.set(DRESS.skin, MAT.PLAIN); m.cyl(h0, h1, 0.11, 0.105, 6, 0.9, 1, true, true);
  if (p.head === 0) { m.set(DRESS.cap[v % 3], MAT.CLOTH); m.cyl(top(0.72), top(1.2), 0.13, 0.12, 7, 0.9, 1, false, true); m.quadOut(_add(top(0.78), sd, -0.09), _add(top(0.78), sd, 0.09), _add(_add(top(0.74), f, 0.2), sd, 0.07), _add(_add(top(0.74), f, 0.2), sd, -0.07), [0, 1, 0], 0.8); }
  else if (p.head === 1) { m.set(DRESS.hair[v % 3], MAT.PLAIN); m.cyl(top(0.6), top(1.14), 0.118, 0.085, 6, 0.9, 1, false, true); }
  else { m.set(DRESS.kerchief[(p.head === 2 ? v : v + 2) % 4], MAT.CLOTH); m.cyl(top(0.45), top(1.22), 0.135, 0.07, 7, 0.88, 1, false, true); m.triOut(_add(_add(top(0.5), f, -0.11), sd, -0.11), _add(_add(top(0.5), f, -0.11), sd, 0.11), _add(top(-0.5), f, -0.16), [-f[0], 0, -f[2]], 1, 1, 0.8); }
  // what is carried: a basket on the arm, a basket on the head, a bundle on the shoulder, a jug in the hand; a kite flyer's winder
  if (free && p.carry === 0) { const b = at(0.2, 0.78, cs * 0.36); m.set(DRESS.basket, MAT.PLANK); m.cyl(b, [b[0], b[1] + 0.2 * t, b[2]], 0.15, 0.2, 7, 0.75, 1, true, false); m.set(v > 2 ? COL.kiteA : lin('#c8573a'), MAT.PLAIN); m.disc([b[0], b[1] + 0.17 * t, b[2]], [0, 1, 0], 0.18, 7); }
  else if (free && p.carry === 1) { const b = top(1.22); m.set(DRESS.basket, MAT.PLANK); m.cyl(b, [b[0], b[1] + 0.17, b[2]], 0.19, 0.27, 8, 0.75, 1, true, false); m.set(v > 2 ? COL.cloth : lin('#8fae5a'), MAT.PLAIN); m.disc([b[0], b[1] + 0.15, b[2]], [0, 1, 0], 0.25, 8); }
  else if (free && p.carry === 2) { m.set(mulc(COL.cloth, 0.86), MAT.CLOTH); m.cyl(at(-0.2, 1.12, cs * 0.18), at(-0.08, 1.52, cs * 0.2), 0.17, 0.14, 6, 0.8, 1, true, true); }
  else if (p.carry === 3) { const b = at(0.1, 0.62, cs * 0.31); m.set(lin('#a8623f'), MAT.PLAIN); m.cyl(b, [b[0], b[1] + 0.26 * t, b[2]], 0.1, 0.06, 6, 0.8, 1, true, true); }
  if (p.pose === 'fly') { m.set(mulc(COL.timberDark, 0.7), MAT.TIMBER); m.cyl(at(0.38, 1.2, -0.2), at(0.38, 1.2, 0.2), 0.05, 0.05, 5, 1, 1, true, true); m.set(COL.rope, MAT.PLAIN); m.cyl(at(0.38, 1.2, -0.09), at(0.38, 1.2, 0.09), 0.085, 0.085, 6, 0.85, 1, true, true); }
  m.still();
}
// what stands on the decks: dew catchers with their cisterns, orchard trees in tubs, washing, the hanging gardens, the few people
async function addCityLife(K, P, tick) {
  const g = K.s, m = K.m;
  for (const d of P.dews) {
    // two poles and a top beam, a pale sheet of net between them, a gutter along its foot running to the cistern, a thread of water
    const ax = d.alongX ? [1, 0] : [0, 1], hw = d.w / 2, a = [d.x - ax[0] * hw, d.y, d.z - ax[1] * hw], b = [d.x + ax[0] * hw, d.y, d.z + ax[1] * hw], up = (p, h) => [p[0], p[1] + h, p[2]];
    g.set(mulc(COL.timberDark, 0.75), MAT.TIMBER); g.beam(a, up(a, d.hgt), 0.2); g.beam(b, up(b, d.hgt), 0.2); g.beam(up(a, d.hgt), up(b, d.hgt), 0.16);
    m.move(ANIM.FLUTTER, d.ph, 0.1, 0.5, null, [ax[1], 0, ax[0]]); const ns = Math.max(4, Math.round((d.hgt - 1.65) / 0.66)); for (let i = 0; i < ns; i++) { const f0 = i / ns, f1 = (i + 0.52) / ns, y0 = lerp(1.5, d.hgt - 0.15, f0), y1 = lerp(1.5, d.hgt - 0.15, f1), yb = lerp(1.2, d.hgt - 0.15, f0), yc = lerp(1.2, d.hgt - 0.15, f1); m.set(i & 1 ? lin('#f3f1e4') : lin('#dde6e2'), MAT.CLOTH); m.quad(up(a, y0), up(b, yb), up(b, yc), up(a, y1), 0.9, 1); }
    m.still(); g.set(mulc(COL.timberDark, 0.8), MAT.TIMBER); g.beam(up(a, lerp(1.5, d.hgt, 0.5)), up(b, lerp(1.2, d.hgt, 0.5)), 0.07); g.beam(up([(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2], 1.3), up([(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2], d.hgt), 0.07);
    g.set(COL.plankDark, MAT.PLANK); g.beam(up(a, 1.45), up(b, 1.1), 0.3, 0.2);
    const gx = Math.abs(d.cx - a[0]) + Math.abs(d.cz - a[2]) < Math.abs(d.cx - b[0]) + Math.abs(d.cz - b[2]) ? a : b, sp = [(gx[0] + d.cx) / 2, d.y + 2.3, (gx[2] + d.cz) / 2];
    g.beam(up(gx, 1.1), [d.cx, d.y + 2.5, d.cz], 0.2, 0.14);
    // the cistern: staves, two hoops, water to its brim
    g.set(COL.plank, MAT.PLANK); g.cyl([d.cx, d.y + 0.25, d.cz], [d.cx, d.y + 2.2, d.cz], 1.5, 1.62, 12, 0.8, 1); g.set(COL.iron, MAT.IRON); g.cyl([d.cx, d.y + 0.7, d.cz], [d.cx, d.y + 0.85, d.cz], 1.56, 1.57, 12); g.cyl([d.cx, d.y + 1.7, d.cz], [d.cx, d.y + 1.85, d.cz], 1.62, 1.63, 12);
    g.set(COL.water, MAT.WATER); g.disc([d.cx, d.y + 2.05, d.cz], [0, 1, 0], 1.55, 12); g.quad([d.cx - 0.05, d.y + 2.5, d.cz - 0.05], [d.cx + 0.05, d.y + 2.5, d.cz + 0.05], [d.cx + 0.05, d.y + 2.06, d.cz + 0.05], [d.cx - 0.05, d.y + 2.06, d.cz - 0.05]);
    g.set(mulc(COL.timberDark, 0.7), MAT.TIMBER); for (let i = 0; i < 4; i++) { const an = i * TAU / 4 + 0.6; g.beam([d.cx + Math.cos(an) * 1.2, d.y, d.cz + Math.sin(an) * 1.2], [d.cx + Math.cos(an) * 1.2, d.y + 0.3, d.cz + Math.sin(an) * 1.2], 0.3); }
  }
  await tick();
  let tubN = 0;
  for (const t of P.tubs) {
    if (++tubN % 5 === 0) await tick();
    const rng = makeRng(t.seed), top = t.y + t.hgt, cy = top - t.cr;
    g.set(COL.plank, MAT.PLANK); g.cyl([t.x, t.y, t.z], [t.x, t.y + 0.8, t.z], 0.7, 0.85, 9, 0.8, 1); g.set(COL.iron, MAT.IRON); g.cyl([t.x, t.y + 0.5, t.z], [t.x, t.y + 0.62, t.z], 0.82, 0.83, 9);
    g.set(lin('#4a3a2a'), MAT.PLAIN); g.disc([t.x, t.y + 0.72, t.z], [0, 1, 0], 0.8, 9);
    g.set(lin('#6b5540'), MAT.TIMBER); g.cyl([t.x, t.y + 0.7, t.z], [t.x + rng.range(-0.15, 0.15), cy, t.z + rng.range(-0.15, 0.15)], 0.13, 0.08, 5);
    const lc = mixc(COL.leaf, COL.leafDark, rng.range(0.15, 0.6));
    addBlob(g, [t.x, cy, t.z], t.cr * 0.8, t.cr * 0.75, t.cr * 0.8, rng, 7, 4, lc);
    for (let i = 0; i < 3; i++) { const a = rng.range(0, TAU), r = t.cr * 0.5; addBlob(g, [t.x + Math.cos(a) * r, cy + rng.range(-0.3, 0.45) * t.cr, t.z + Math.sin(a) * r], t.cr * 0.55, t.cr * 0.45, t.cr * 0.55, rng, 6, 3, lc); }
    // its fruit
    g.set(rng.chance(0.6) ? COL.kiteA : lin('#e8842c'), MAT.PLAIN); for (let i = 0; i < 6; i++) { const a = rng.range(0, TAU), e = rng.range(-0.5, 0.6), r = t.cr * 0.86, p = [t.x + Math.cos(a) * Math.cos(e) * r, cy + Math.sin(e) * r * 0.9, t.z + Math.sin(a) * Math.cos(e) * r]; g.cyl([p[0], p[1] - 0.09, p[2]], [p[0], p[1] + 0.09, p[2]], 0.1, 0.1, 4, 0.8, 1.1, true, true); }
  }
  await tick();
  let washN = 0;
  for (const w of P.wash) {
    if (++washN % 5 === 0) await tick();
    const rng = makeRng(w.seed), ax = w.alongX ? [1, 0] : [0, 1], a = [w.x - ax[0] * w.len / 2, w.y, w.z - ax[1] * w.len / 2], b = [w.x + ax[0] * w.len / 2, w.y, w.z + ax[1] * w.len / 2];
    g.set(mulc(COL.timberDark, 0.75), MAT.TIMBER); g.beam(a, [a[0], a[1] + 2.5, a[2]], 0.12); g.beam(b, [b[0], b[1] + 2.5, b[2]], 0.12);
    addWashing(K, [a[0], a[1] + 2.4, a[2]], [b[0], b[1] + 2.4, b[2]], { rng, cols: WASH, sag: 0.16 + 0.012 * w.len, ph: w.ph, u0: 0.5, u1: 0.5, drop: 1.75 });
  }
  await tick();
  // the hanging gardens: each trail a chain of leaf masses, thinner downward, swaying a little about its head. Each hangs from what is
  // seen to carry it: a planting trough on the wall's head, or (under the raft's edge) a trough slung outside the edge board on two brackets
  let gardenN = 0;
  for (const t of P.gardens) {
    if (++gardenN % 12 === 0) await tick();
    const rng = makeRng(t.seed), n = Math.max(3, Math.round(t.len / 1.25)), lc = mixc(COL.leaf, COL.leafDark, rng.range(0.1, 0.75)), edge = t.kind !== 'wall', top = [t.x, t.y - (edge ? 0.55 : 0), t.z], along = Math.abs(t.nz) > Math.abs(t.nx);
    g.set(COL.plankDark, MAT.PLANK);
    if (!edge) g.box(t.x, t.y + 0.05, t.z, along ? 1.5 : 0.4, 0.34, along ? 0.4 : 1.5, 0, 63);
    else { const yaw = Math.atan2(t.nx, t.nz); g.box(t.x + t.nx * 0.15, t.y - 0.5, t.z + t.nz * 0.15, 1.7, 0.42, 0.5, yaw, 63, 0.8, 1); g.set(COL.iron, MAT.IRON); for (const s of [-0.7, 0.7]) g.beam([t.x - t.nx * 0.5 + t.nz * s, t.y - 0.1, t.z - t.nz * 0.5 - t.nx * s], [t.x + t.nx * 0.3 + t.nz * s, t.y - 0.72, t.z + t.nz * 0.3 - t.nx * s], 0.07); }
    m.move(ANIM.SWAY, t.ph, 0.03, 0.9 + (t.ph % 1) * 0.5, top, [t.nx, 0, t.nz]);
    let px = t.x, pz = t.z;
    for (let i = 0; i < n; i++) { const f = i / n, r = lerp(edge ? 0.62 : 0.95, 0.38, f) * (0.8 + rng() * 0.4); px += rng.range(-0.25, 0.25); pz += rng.range(-0.25, 0.25); addBlob(m, [px + t.nx * r * 0.5, top[1] - 0.25 - r * 0.6 - f * t.len, pz + t.nz * r * 0.5], r, r * 0.95, r, rng, 5, 3, lc); }
    m.set(rng.chance(0.5) ? COL.kiteB : COL.kiteA, MAT.PLAIN); for (let i = 0; i < 4; i++) { const f = rng(), p = [t.x + t.nx * 0.9 + rng.range(-0.5, 0.5), top[1] - 0.9 - f * t.len * 0.8, t.z + t.nz * 0.9 + rng.range(-0.5, 0.5)]; m.tri([p[0] - 0.14, p[1], p[2]], [p[0] + 0.14, p[1], p[2]], [p[0], p[1] + 0.24, p[2] + 0.05]); }
    m.still();
  }
  await tick();
  let peopleN = 0;
  for (const p of P.people) { if (++peopleN % 12 === 0) await tick(); addFigure(K, p); }
  await tick();
}

// THE MARKET, THE SUMMIT SQUARE'S OWN THINGS AND THE STREET'S WASHING: the stalls (a table with its baskets under a striped awning on
// four posts, a crate behind), the fountain (a stone basin, a bowl on a short pillar, water falling from its lip), the benches, the
// square's paving (a border, the middle way with its cross bands, a ring of setts about the fountain), and the ropes of washing from
// house to house across the stair street
const AWN = [COL.kiteA, COL.kiteB, COL.shutter, lin('#6fa07a')], WASH = [COL.cloth, COL.cloth, COL.kiteA, COL.kiteB, COL.shutter, lin('#f4f4f0'), lin('#b9c4a8')];
async function addMarket(K, P, tick) {
  const g = K.s, m = K.m, H = P.H;
  for (const s of P.stalls) {
    const rng = makeRng(s.seed), yaw = s.alongX ? 0 : Math.PI / 2, c = Math.cos(yaw), sn = Math.sin(yaw), Q = (lx, ly, lz) => [s.x + lx * c + lz * sn, s.y + ly, s.z - lx * sn + lz * c];
    g.set(COL.plank, MAT.PLANK); { const b = Q(0, 0.86, 0); g.box(b[0], b[1], b[2], 2.8, 0.08, 1.1, yaw, 63); }
    g.set(mulc(COL.timberDark, 0.7), MAT.TIMBER); for (const sx of [-1.2, 1.2]) { g.beam(Q(sx, 0, -0.4), Q(sx, 0.82, 0), 0.07); g.beam(Q(sx, 0, 0.4), Q(sx, 0.82, 0), 0.07); }
    for (const sx of [-1.42, 1.42]) { g.beam(Q(sx, 0, -0.9), Q(sx, 2.72, -0.9), 0.09); g.beam(Q(sx, 0, 0.9), Q(sx, 2.22, 0.9), 0.09); }
    m.move(ANIM.FLUTTER, s.ph, 0.05, 1.4, null, [0, 1, 0]);
    for (let i = 0; i < 4; i++) { const x0 = -1.5 + i * 0.75, x1 = x0 + 0.75; m.set(i & 1 ? COL.cloth : AWN[s.col % 4], MAT.CLOTH); m.quadOut(Q(x0, 2.75, -0.98), Q(x1, 2.75, -0.98), Q(x1, 2.2, 1.0), Q(x0, 2.2, 1.0), [0, 1, 0], 1, 0.9); }
    m.still();
    for (let i = 0; i < 4; i++) { const b = Q(-1.05 + i * 0.7 + rng.range(-0.08, 0.08), 0.9, rng.range(-0.2, 0.2)), r = rng.range(0.2, 0.27); g.set(DRESS.basket, MAT.PLANK); g.cyl(b, [b[0], b[1] + 0.16, b[2]], r * 0.8, r, 7, 0.75, 1); g.set(rng.pick([COL.kiteA, lin('#c8573a'), lin('#8fae5a'), lin('#e8842c'), COL.cloth]), MAT.PLAIN); g.disc([b[0], b[1] + 0.14, b[2]], [0, 1, 0], r * 0.95, 7); }
    { const b = Q(rng.range(-1.1, 1.1), 0.25, -0.68); g.set(COL.plankDark, MAT.PLANK); g.box(b[0], b[1], b[2], 0.7, 0.5, 0.5, yaw, 63, 0.8, 1); }
  }
  await tick();
  const l = P.LV[5], y5 = H(5), stone = lin('#cfc4ab');
  if (P.square.fountain) {
    const F = P.square.fountain, up = (h) => [F.x, F.y + h, F.z], ri = F.r - 0.28, pt = (a, r, h) => [F.x + Math.cos(a) * r, F.y + h, F.z + Math.sin(a) * r];
    g.set(stone, MAT.STONE); g.cyl(up(0), up(0.72), F.r, F.r, 14, 0.75, 1); g.cyl(up(0.5), up(0.72), ri, ri, 14, 0.7, 0.85);
    for (let i = 0; i < 14; i++) { const a0 = i / 14 * TAU, a1 = (i + 1) / 14 * TAU; g.quadOut(pt(a0, ri, 0.72), pt(a0, F.r, 0.72), pt(a1, F.r, 0.72), pt(a1, ri, 0.72), [0, 1, 0], i & 1 ? 0.94 : 1.04); }
    g.set(COL.water, MAT.WATER); g.disc(up(0.52), [0, 1, 0], ri, 14);
    g.set(stone, MAT.STONE); g.cyl(up(0.5), up(1.4), 0.34, 0.26, 8, 0.8, 1); g.cyl(up(1.34), up(1.58), 0.36, 1.0, 10, 0.72, 1.05);
    g.set(COL.water, MAT.WATER); g.disc(up(1.55), [0, 1, 0], 0.95, 10); g.cyl(up(1.55), up(1.76), 0.15, 0.03, 6);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.4; g.beam(pt(a, 1.0, 1.57), pt(a, 1.22, 0.53), 0.12, 0.03); }
  }
  for (const b of P.square.benches) {
    const dz = Math.cos(b.yaw); g.set(COL.plank, MAT.PLANK); g.box(b.x, b.y + 0.46, b.z, 2, 0.07, 0.42, 0, 63); g.beam([b.x - 1, b.y + 0.86, b.z - dz * 0.2], [b.x + 1, b.y + 0.86, b.z - dz * 0.2], 0.06, 0.2);
    g.set(mulc(COL.timberDark, 0.7), MAT.TIMBER); for (const sx of [-0.8, 0.8]) { g.box(b.x + sx, b.y + 0.22, b.z, 0.1, 0.44, 0.38, 0, 51); g.beam([b.x + sx, b.y + 0.46, b.z - dz * 0.2], [b.x + sx, b.y + 0.86, b.z - dz * 0.2], 0.06); }
  }
  // the square's paving, laid a finger over the terrace's top: the border, the middle way (as far as the jetty's landing), its cross bands, the ring
  { const flat = (x0, x1, z0, z1, dy, k = 1) => g.quadOut([x0, y5 + dy, z0], [x1, y5 + dy, z0], [x1, y5 + dy, z1], [x0, y5 + dy, z1], [0, 1, 0], k), zS = l.z1 - 3.1;
    g.set(lin('#b3a78e'), MAT.STONE); flat(l.x0 + 0.6, l.x1 - 0.6, l.z0 + 0.6, l.z0 + 1.5, 0.04); flat(l.x0 + 0.6, l.x0 + 1.5, l.z0 + 1.5, l.z1 - 1.5, 0.04); flat(l.x1 - 1.5, l.x1 - 0.6, l.z0 + 1.5, l.z1 - 1.5, 0.04); flat(l.x0 + 0.6, -4.7, l.z1 - 1.5, l.z1 - 0.6, 0.04); flat(4.7, l.x1 - 0.6, l.z1 - 1.5, l.z1 - 0.6, 0.04);
    g.set(lin('#e9e2d0'), MAT.STONE); flat(-4.4, 4.4, l.z0 + 0.1, zS, 0.03);
    g.set(lin('#a89c84'), MAT.PLAIN); for (let z = l.z0 + 2.2; z < zS - 0.5; z += 3.4) if (!P.square.fountain || Math.abs(z - P.square.fountain.z) > 4.6) flat(-4.4, 4.4, z, z + 0.32, 0.05);
    for (const sx of [-1, 1]) flat(sx * 4.4 - 0.16, sx * 4.4 + 0.16, l.z0 + 0.1, zS, 0.05);
    if (P.square.fountain) { const F = P.square.fountain, pt = (a, r) => [F.x + Math.cos(a) * r, y5 + 0.06, F.z + Math.sin(a) * r]; for (let i = 0; i < 16; i++) { const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU; g.set(i & 1 ? lin('#b3a78e') : lin('#d9c9a8'), MAT.PLAIN); g.quadOut(pt(a0, F.r + 0.15), pt(a0, 4.3), pt(a1, 4.3), pt(a1, F.r + 0.15), [0, 1, 0]); } }
  }
  await tick();
  for (const ln of P.lines) {
    addWashing(K, [ln.x0, ln.y, ln.z], [ln.x1, ln.y, ln.z], { rng: makeRng(ln.seed), cols: WASH, sag: 0.03 * (ln.x1 - ln.x0), ph: ln.ph, u0: 0.7, u1: 0.7, drop: 1.25 });
  }
  await tick();
}
// ---------------------------------------------------------------- putting it together
// the whole city in its own frame (x east, z south, y from the lowest deck)
export async function buildCityGeo(P, tick = async () => {}) {
  const K = { s: new Geo(false, 1 << 16), m: new Geo(true, 1 << 15) };
  await addCityBase(K, P, tick);
  for (let i = 0; i < P.houses.length; i++) { addHouseGeo(K, P.houses[i], P.tint); if (i % 2 === 1) await tick(); }
  await tick();
  await addJettyAndRing(K, P, tick);
  for (let i = 0; i < P.mills.length; i++) { addWindmill(K, P.mills[i], P.windAx); if (i % 2 === 1) await tick(); }
  await tick();
  for (let i = 0; i < P.scopes.length; i++) { addSpyglass(K, P.scopes[i]); if (i % 8 === 7) await tick(); }
  { let n = 0; for (const st of P.stations) if (st.folded) { addFoldedTube(K, st); if (++n % 30 === 0) await tick(); } }
  await tick();
  for (let i = 0; i < P.kites.length; i++) { addKite(K, P.kites[i]); if (i % 5 === 4) await tick(); }
  await tick();
  await addCityLife(K, P, tick);
  await addMarket(K, P, tick);
  return K;
}
// THE GANGWAY (the world's frame, hand +1): a hung foot-bridge, 3 m under the lowest deck, from a round stage about the ladder leg's
// head to the middle of the raft's south edge. A narrow plank walk on a fish-bellied timber truss; under the planks a cross-beam at
// every joint, standing out a metre past the walk on either hand, and two crossed braces in every bay; a gate of two tall posts and a
// head beam near each end, from whose tops two cables sag to just over the rails at mid-span, a hanger from the cable down to every
// cross-beam's end, and back-stays from the posts' tops down to the stage and to the walk's end; a rail on each hand, a lantern post
// every third bay, a few folk at the rails, a ladder up to the deck at its end. The line passes UNDER it, 20 m below the walk
// (a lantern or a figure that came within the lane would be left out: none does).
export function addGangway(K, P) {
  const g = K.s, G = P.gangway, y = G.a[1], L = G.len, u = [G.b[0] / L, 0, G.b[2] / L], sd = [-u[2], 0, u[0]], hw = G.hw, rs = 4.4, ow = hw + 1.0;
  const at = (s, side = 0, dy = 0) => [G.a[0] + u[0] * s + sd[0] * side, y + dy, G.a[2] + u[2] * s + sd[2] * side];
  // the stage: a round deck with a rail, open toward the walk
  g.set(COL.plank, MAT.PLANK); g.disc([0, y, 0], [0, 1, 0], rs, 14); g.set(mulc(COL.plankDark, 0.7), MAT.PLANK); g.disc([0, y - 0.3, 0], [0, -1, 0], rs, 14, 0.7); g.cyl([0, y - 0.3, 0], [0, y, 0], rs, rs, 14, 0.8, 1);
  g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER);
  for (let i = 0; i < 14; i++) { const a0 = i / 14 * TAU, a1 = (i + 1) / 14 * TAU, p0 = [Math.cos(a0) * (rs - 0.1), y, Math.sin(a0) * (rs - 0.1)], p1 = [Math.cos(a1) * (rs - 0.1), y, Math.sin(a1) * (rs - 0.1)], open = (Math.cos((a0 + a1) / 2) * u[0] + Math.sin((a0 + a1) / 2) * u[2]) > 0.93; g.beam(p0, [p0[0], y + 1.1, p0[2]], 0.12); if (!open) { g.beam([p0[0], y + 1.1, p0[2]], [p1[0], y + 1.1, p1[2]], 0.14, 0.08); g.beam([p0[0], y + 0.55, p0[2]], [p1[0], y + 0.55, p1[2]], 0.06); } }
  // the walk, bay by bay: planks, two top chords, the deep bottom chord, a post and two struts at each joint, the rails
  const n = Math.max(4, Math.round((L - rs) / 8)), bay = (L - rs + 0.4) / n, dep = (s) => 1.3 + 3.4 * Math.sin(Math.PI * clamp((s - rs) / (L - rs), 0, 1));
  for (let i = 0; i < n; i++) {
    const s0 = rs - 0.4 + i * bay, s1 = s0 + bay, sm = (s0 + s1) / 2;
    g.set(COL.plank, MAT.PLANK); g.quadOut(at(s0, -hw), at(s0, hw), at(s1, hw), at(s1, -hw), [0, 1, 0]); g.set(mulc(COL.plankDark, 0.7), MAT.PLANK); g.quadOut(at(s0, -hw, -0.16), at(s0, hw, -0.16), at(s1, hw, -0.16), at(s1, -hw, -0.16), [0, -1, 0]);
    g.set(mulc(COL.beam, 0.92), MAT.TIMBER); for (const s of [-1, 1]) g.beam(at(s0, s * (hw - 0.1), -0.42), at(s1, s * (hw - 0.1), -0.42), 0.26, 0.5);
    g.beam(at(s0, 0, -dep(s0)), at(s1, 0, -dep(s1)), 0.34, 0.4, false, 0.85);
    g.set(mulc(COL.beam, 0.8), MAT.TIMBER); g.beam(at(s1, 0, -0.6), at(s1, 0, -dep(s1)), 0.22); for (const s of [-1, 1]) g.beam(at(s0, s * (hw - 0.1), -0.6), at(s1, 0, -dep(s1) + 0.1), 0.15);
    g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER);
    for (const s of [-1, 1]) { g.beam(at(s0, s * hw), at(s0, s * hw, 1.1), 0.1); g.beam(at(sm, s * hw), at(sm, s * hw, 1.1), 0.08); g.beam(at(s0, s * hw, 1.1), at(s1, s * hw, 1.1), 0.12, 0.07); g.beam(at(s0, s * hw, 0.55), at(s1, s * hw, 0.55), 0.05); }
    if (i % 3 === 1 && P.laneW(at(sm, 0, 2.2)[0], y + 2.2, at(sm, 0, 2.2)[2]) >= P.D.LANE + 0.9) { const s = (i & 2) ? 1 : -1, top = at(sm, s * (hw - 0.45), 2.7); g.beam(at(sm, s * hw), at(sm, s * hw, 3.1), 0.12); g.set(COL.iron, MAT.IRON); g.beam(at(sm, s * hw, 2.76), [top[0], top[1] + 0.06, top[2]], 0.05); addLantern(K, top, i * 1.7, 1.3); }
    // under the planks: the joint's cross-beam, and the bay's two crossed braces
    g.set(mulc(COL.beam, 0.86), MAT.TIMBER); g.beam(at(s0, -ow, -0.3), at(s0, ow, -0.3), 0.2, 0.26, true); g.set(mulc(COL.beam, 0.74), MAT.TIMBER); g.beam(at(s0, -(hw - 0.1), -0.5), at(s1, hw - 0.1, -0.5), 0.1); g.beam(at(s0, hw - 0.1, -0.5), at(s1, -(hw - 0.1), -0.5), 0.1);
  }
  g.set(mulc(COL.beam, 0.86), MAT.TIMBER); g.beam(at(L, -ow, -0.3), at(L, ow, -0.3), 0.2, 0.26, true);
  // the two gates, the cables with their hangers, the back-stays
  const sA = rs + 2, sB = L - 12, hTop = 15, hMid = 1.5, sM = (sA + sB) / 2, cab = (s) => hMid + (hTop - hMid) * ((s - sM) / (sB - sM)) ** 2;
  for (const s of [sA, sB]) { g.set(mulc(COL.beam, 0.9), MAT.TIMBER); for (const sx of [-1, 1]) { g.beam(at(s, sx * ow, -0.5), at(s, sx * ow, hTop + 0.4), 0.34, 0.34, true); g.beam(at(s, sx * ow, 5), at(s, sx * (hw + 0.1), 0.2), 0.14); } g.beam(at(s, -ow - 0.3, hTop), at(s, ow + 0.3, hTop), 0.3, 0.36, true); g.beam(at(s, -ow, hTop - 2.6), at(s, ow, hTop - 2.6), 0.2, 0.22); g.beam(at(s, -ow, -0.3), at(s, ow, -0.3), 0.3, 0.3, true); }
  for (const sx of [-1, 1]) {
    for (let i = 0; i < n; i++) { const s0 = rs - 0.4 + i * bay, s1 = s0 + bay, c0 = clamp(s0, sA, sB), c1 = clamp(s1, sA, sB); if (c1 - c0 > 0.5) addLine(K, at(c0, sx * ow, cab(c0)), at(c1, sx * ow, cab(c1)), 0.09, COL.rope); if (s0 > sA + 1 && s0 < sB - 1) addLine(K, at(s0, sx * ow, cab(s0)), at(s0, sx * ow, -0.2), 0.04, COL.rope); }
    addLine(K, at(sA, sx * ow, hTop), at(-rs + 0.3, sx * 1.2, 0.2), 0.09, COL.rope); addLine(K, at(sB, sx * ow, hTop), at(L - 0.3, sx * ow, -0.2), 0.09, COL.rope);
  }
  for (const p of P.gangFolk) addFigure(K, p);
  // the ladder from the walk's end up to the lowest deck's edge: two rails and a rung every 0.4 m
  g.set(mulc(COL.timberDark, 0.72), MAT.TIMBER);
  { const bx = G.b[0], bz = G.b[2], foot = (s) => [bx + s * 0.36, y, bz - 0.25], head = (s) => [bx + s * 0.36, P.deckY + 1.0, bz - 1.42];
    for (const s of [-1, 1]) g.beam(foot(s), head(s), 0.1);
    for (let r = 0.4; r < 3.05; r += 0.4) { const t = r / 4, a = foot(-1), b = head(-1), c = foot(1), d = head(1); g.beam([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], [lerp(c[0], d[0], t), lerp(c[1], d[1], t), lerp(c[2], d[2], t)], 0.06); } }
}
// the stream's stones (the world's frame): each a rounded lump of grey stone, broader than it is high, mossed on its head
export function addStreamStones(K, P) {
  const g = K.s;
  for (const st of P.stones) { const rng = makeRng(st.seed); addBlob(g, [st.x, st.y, st.z], st.r * st.wide, st.r * st.fl, st.r / st.wide * 1.1, rng, 6, 3, mixc(lin('#8f8a7c'), lin('#6f7f58'), rng() * 0.45)); }
}
// the stilts in the world's frame (hand +1), each with its head's struts; ours (the ladder leg) with nests, buckets and the gangway on its
// head; the others with one bucket and (two of them) a nest. yCut: build only what stands above this height (the hero shown alone).
export async function buildStiltsGeo(P, tick = async () => {}, yCut = -1e9) {
  const K = { s: new Geo(false, 1 << 14), m: new Geo(true, 1 << 12) }, J = P.jetty;
  for (let i = 0; i < P.stilts.length; i++) {
    if (yCut > -1e8 && P.stilts[i].own) continue;
    const o0 = P.stilts[i], o = yCut > o0.y0 ? { ...o0, y0: yCut, cut: true } : o0, st = addStilt(K, o, P.seed), rng = st.rng, L = st.lands;
    if (o.own) {
      const u = [P.gangway.b[0] / P.gangway.len, P.gangway.b[2] / P.gangway.len];
      addHead(K, o, [[u[0] * 9, u[1] * 9, 1], [u[0] * 21, u[1] * 21, 0.6], [-u[0] * 3.6, -u[1] * 3.6, 1.2], [-u[1] * 3.6, u[0] * 3.6, 1.2], [u[1] * 3.6, -u[0] * 3.6, 1.2]], 19);
      for (const j of [1, 4, 7]) if (L[j + 1]) addNest(K, o, st, (L[j] + L[j + 1]) / 2 + rng.range(-3, 3), st.angAt(L[j]) + Math.PI + rng.range(-0.5, 0.5), rng.range(0, 40));
      for (const j of [2, 5, 8]) if (L[j]) addBucket(K, o, st, L[j] + 2.7, st.angAt(L[j]) + 0.55, rng.range(18, 24), rng.range(30, 48), rng.range(0, TAU));
      await tick();
      if (yCut < -1e8) { addGangway(K, P); addStreamStones(K, P); }
    } else if (o.jetty) {
      // the leg beside the jetty: struts from its collar to the jetty's near stringer and across under its deck (the jetty's own measures, turned to the world's frame)
      const to = []; for (const [a, l] of [[-11, -5.1], [0, -5.1], [11, -5.1], [-5, -12.9], [5, -12.9]]) to.push([J.jx * a + J.jz * l, J.jz * a - J.jx * l, 0.6]);
      addHead(K, o, to, 18);
      if (L[1]) addBucket(K, o, st, L[1] + 2.7, st.angAt(L[1]) + 0.55, rng.range(18, 24), rng.range(30, 48), rng.range(0, TAU));
    } else {
      const to = []; for (let a = 0; a < 8; a++) to.push([Math.cos(a / 8 * TAU + 0.39) * 11, Math.sin(a / 8 * TAU + 0.39) * 11]);
      addHead(K, o, to, 16);
      if (L[1]) addBucket(K, o, st, L[1] + 2.7, st.angAt(L[1]) + 0.55, rng.range(18, 24), rng.range(30, 48), rng.range(0, TAU));
      if (i % 2 === 1 && L[2]) addNest(K, o, st, (L[1] + L[2]) / 2, st.angAt(L[1]) + Math.PI, rng.range(0, 40));
    }
    await tick();
  }
  return K;
}
// THE CITY'S PLAN AS A PICTURE of heights (the place's light reads it): r = height over the lowest deck / 102 m, g = 1 where the raft, a terrace or the jetty covers, 0 in a well or off the raft
export function planRaster(P, hand = 1) {
  const n = DIM.planRes, size = DIM.planSize, lx0 = -152, lz0 = -100, s = size / n, hg = new Float32Array(n * n).fill(-1);
  const ix = (x) => clamp(Math.round((x - lx0) / s - 0.5), 0, n - 1), iz = (z) => clamp(Math.round((z - lz0) / s - 0.5), 0, n - 1);
  const paint = (x0, x1, z0, z1, y) => { for (let j = iz(z0); j <= iz(z1); j++) for (let i = ix(x0); i <= ix(x1); i++) { const q = j * n + i; if (hg[q] < y) hg[q] = y; } };
  const L0 = P.LV[0];
  for (let j = iz(L0.z0); j <= iz(L0.z1); j++) for (let i = ix(L0.x0); i <= ix(L0.x1); i++) { const x = lx0 + (i + 0.5) * s, z = lz0 + (j + 0.5) * s; if (P.inPoly0(x, z) && !P.inWell(x, z)) hg[j * n + i] = 0; }
  for (let k = 1; k <= 5; k++) paint(P.LV[k].x0, P.LV[k].x1, P.LV[k].z0, P.LV[k].z1, P.H(k));
  for (const st of P.stairs) for (let j = iz(st.z0); j <= iz(st.z1); j++) paint(-st.hw, st.hw, lz0 + (j + 0.5) * s, lz0 + (j + 0.5) * s, lerp(st.y0, st.y1, clamp((lz0 + (j + 0.5) * s - st.z0) / (st.z1 - st.z0), 0, 1)));
  // the jetty: every square of the picture whose middle lies on its deck
  { const J = P.jetty, e = P.jettyPt(J.len, 0), x0 = Math.min(J.ax, e[0]) - J.hw - 1, x1 = Math.max(J.ax, e[0]) + J.hw + 1, z0 = Math.min(J.az, e[1]) - J.hw - 1, z1 = Math.max(J.az, e[1]) + J.hw + 1;
    for (let j = iz(z0); j <= iz(z1); j++) for (let i = ix(x0); i <= ix(x1); i++) { const [a, l] = P.onJetty(lx0 + (i + 0.5) * s, lz0 + (j + 0.5) * s); if (a >= 0 && a <= J.len && Math.abs(l) <= J.hw) { const q = j * n + i; if (hg[q] < J.y) hg[q] = J.y; } } }
  for (const q of P.solids) if (q.kind === 'house' || q.kind === 'mill' || q.kind === 'bridge' || q.kind === 'tub') paint(q.x0, q.x1, q.z0, q.z1, q.kind === 'house' ? q.y1 - 1 : q.kind === 'tub' ? q.y1 - 0.6 : q.y1);
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const q = j * n + (hand > 0 ? i : n - 1 - i), o = (j * n + i) * 4, h = hg[q]; data[o] = h < 0 ? 0 : clamp(Math.round(h / 102 * 255), 0, 255); data[o + 1] = h < 0 ? 0 : 255; data[o + 3] = 255; }
  return { data, n, size, x0: hand > 0 ? lx0 + DIM.cityX : -(lx0 + size + DIM.cityX), z0: lz0 + DIM.cityZ, lz0, lx0 };
}
export function planTexture(ras) {
  const t = new THREE.DataTexture(ras.data, ras.n, ras.n, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// THE HERO: the city on its raft. Shown alone it stands with the top 75 m of its stilts under it (origin 75 m under
// the lowest deck, the jetty and the ring toward +Z). The world passes its own plan, uniforms and materials
// (opts.plan, opts.uniforms, opts.materials) and builds the stilts itself at their whole height.
export async function buildHero(ctx, opts = {}) {
  const tick = ctx && ctx.yield ? () => ctx.yield() : async () => {};
  const alone = !opts.plan, P = opts.plan || await stiltsPlan(ctx.seed ?? 1, { hour: ctx.vary?.hour, rare: ctx.vary?.rare, density: ctx.vary?.density, detail: ctx.quality?.detail }, tick);
  const U = opts.uniforms || kitUniforms(), mats = opts.materials || makeKitMaterials(U), DROP = 75;
  // the stair street's circuit, for the shader that walks its folk (the city's own frame)
  U.uKWalk.value.set(P.walk.xf, P.walk.zA, P.walk.zB, P.walk.pace); P.walk.flights.forEach((s, i) => U.uKStair.value[i].set(s.z0, s.z1, s.y0, s.y1));
  const object = new THREE.Group(), city = new THREE.Group();
  const K = await buildCityGeo(P, tick);
  await tick();
  // the still geometry in two meshes that share their vertices: 'city', its big faces (walls, roofs, decks, stairs: what throws the
  // city's shadows), and 'city-trim', all the small work (which only receives them)
  await K.s.sortBig(0.7, tick); await tick(); await K.s.bound(tick); await tick(); const gs = K.s.toGeometry(); await tick(); await K.m.bound(tick); await tick(); const gm = K.m.toGeometry(), nb = gs.userData.bigIndices;
  const part = (from, to) => { const q = new THREE.BufferGeometry(); for (const k in gs.attributes) q.setAttribute(k, gs.attributes[k]); q.setIndex(new THREE.BufferAttribute(gs.index.array.subarray(from, to), 1)); q.boundingSphere = gs.boundingSphere.clone(); return q; };
  const solid = new THREE.Mesh(part(0, nb), mats.solid), trim = new THREE.Mesh(part(nb, gs.index.count), mats.solid), moving = new THREE.Mesh(gm, mats.moving);
  solid.name = 'city'; trim.name = 'city-trim'; moving.name = 'city-moving'; city.add(solid, trim, moving); city.position.set(0, DROP, 0); object.add(city);
  let triangles = K.s.triangles + K.m.triangles;
  if (alone) {
    // its own light: the plan's picture in this frame, the sun of the viewer's sky or a late-morning one
    const ras = planRaster(P, 1), tex = planTexture(ras);
    // (the stand-in picture of kitUniforms is freed here, where it is replaced)
    U.uKPlan.value.dispose(); U.uKPlan.value = tex; U.uKPlanA.value.set(ras.lx0, ras.lz0, 1 / ras.size, DROP); U.uKPlanB.value.set(102, -1e5, opts.night ? 1 : 0, 0.78);
    if (opts.sunDir) U.uKSun.value.copy(opts.sunDir); else U.uKSun.value.set(-0.35, 0.72, -0.6).normalize();
    const S = await buildStiltsGeo(P, tick, P.deckY - DROP), sg = new THREE.Group();
    const s1 = new THREE.Mesh(S.s.toGeometry(), mats.solid), s2 = new THREE.Mesh(S.m.toGeometry(), mats.moving);
    // the stilts are laid in the world's frame: bring them into the city's
    sg.add(s1, s2); sg.position.set(-P.D.cityX, DROP - P.deckY, -P.D.cityZ); object.add(sg); triangles += S.s.triangles + S.m.triangles;
  }
  // (uniforms made here own their plan's picture, the stand-in or the hero's own: freed with the hero; the world's are the world's to free)
  if (!opts.uniforms) object.userData.dispose = () => U.uKPlan.value.dispose();
  const sm = P.smokes.map((c) => new THREE.Vector3(c[0], c[1] + DROP, c[2]));
  return {
    object, radius: 150, height: DROP + 75, center: new THREE.Vector3(0, DROP + 22, 20),
    anchors: { deck: new THREE.Vector3(0, DROP, 0), summit: new THREE.Vector3(0, DROP + P.H(5), 40), ring: new THREE.Vector3(P.jettyPt(P.jetty.len, 0)[0], DROP + P.H(5) + DIM.EYE, P.jettyPt(P.jetty.len, 0)[1]), smokes: sm, flock: P.flock ? new THREE.Vector4(P.flock.x, P.flock.y + DROP, P.flock.z, P.flock.r) : null },
    plan: P, uniforms: U, materials: mats, triangles, drop: DROP,
    update(dt, time) { U.uKTime.value = time; },
    dispose() { object.userData.dispose?.(); },
    ground: false, groundY: 0,
  };
}
