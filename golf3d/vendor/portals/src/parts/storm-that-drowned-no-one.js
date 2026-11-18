// The ship wearing fire: a three-masted ship of about 1600 in a gale, every truck, yard end and the bowsprit end
// holding a pale flame that burns nothing, smaller flames running along her yards and stays; and her twin, the same
// ship with every sail furled, for still water, with a mirrored copy under it.
//
// Space: origin at the waterline amidships, +Y up, bow to +Z (so starboard is -X). Metres.
// buildHero(ctx, opts) returns the storm ship; hero.twin() makes the calm ship from the same buffers.
// The fire runs for ever on courses drawn from the part's own stream; the storm ship takes no weather from outside:
// she wears her fire, pitches, rolls and shakes her canvas for ever.
// ONE RULE OF DRAWING: the twin's copy in the water stands at its own mirrored place (the same ship, y to -y at her
// waterline); only the depth at which its fragments are written is taken from the sight ray, so that it shows under
// the water's skin. Nothing else of the copy's place, shape, colour or light reads the eye (its ropes are ribbons as
// every rope here is: flat to the eye, never thinner than 0.0016 rad; the gloss term is nil on a dry ship with no fire).
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// her measures (metres): the hull is 38 on deck from taffrail to stem, the bowsprit ends 13 beyond the stem
export const SHIP = {
  STERN: -19, STEM: 19, SPRIT: 32, BEAM: 4.5, KEEL: -3.6,
  MAIN: { z: 2, truck: 36, top: 22, yard: 17, yardLen: 20, tyard: 27, tyardLen: 14 },
  FORE: { z: 12, truck: 31, top: 19, yard: 15, yardLen: 17, tyard: 24, tyardLen: 12 },
  MIZ: { z: -11, truck: 25, yardLen: 18 },
  LANTERN_Y: 10.6, FLYBY: 32, HEIGHT: 36, LENGTH: 51,
};

// ---------------------------------------------------------------- a small mesh builder
// position, colour, aK (x: window glimmer, y: flutter in metres, z: plank pitch in metres or 0, w: amber lamp), aUV
class MB {
  constructor() { this.p = []; this.c = []; this.k = []; this.uv = []; this.i = []; this.n = 0; }
  v(p, c, k = [0, 0, 0, 0], uv = [0, 0]) {
    this.p.push(p[0], p[1], p[2]); this.c.push(c[0], c[1], c[2]); this.k.push(k[0], k[1], k[2], k[3]); this.uv.push(uv[0], uv[1]);
    return this.n++;
  }
  // a grid of nu by nv quads; fn(u, v) returns { p, c, k, uv }
  grid(nu, nv, fn, flip = false) {
    const o = this.n;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = fn(i / nu, j / nv); this.v(q.p, q.c, q.k, q.uv); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = o + j * (nu + 1) + i, b = a + 1, d = a + nu + 1, e = d + 1;
      if (flip) this.i.push(a, d, b, b, d, e); else this.i.push(a, b, d, b, e, d);
    }
  }
  // a tapered round spar from a to b
  tube(a, b, r0, r1, col, sides = 8, k = [0, 0, 0, 0], segs = 1) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length(); d.normalize();
    const s = new THREE.Vector3(1, 0, 0); if (Math.abs(d.x) > 0.9) s.set(0, 1, 0);
    const e1 = new THREE.Vector3().crossVectors(d, s).normalize(), e2 = new THREE.Vector3().crossVectors(d, e1);
    this.grid(sides, segs, (u, v) => {
      const an = u * TAU, r = lerp(r0, r1, v), cx = Math.cos(an) * r, sx = Math.sin(an) * r;
      return { p: [a[0] + d.x * len * v + e1.x * cx + e2.x * sx, a[1] + d.y * len * v + e1.y * cx + e2.y * sx, a[2] + d.z * len * v + e1.z * cx + e2.z * sx], c: col, k, uv: [u, v * len] };
    });
  }
  // an upright box with its base centre at (x, y, z)
  box(x, y, z, w, h, d, col, k = [0, 0, 0, 0]) {
    const X = [x - w / 2, x + w / 2], Y = [y, y + h], Z = [z - d / 2, z + d / 2];
    const f = (a, b, c2, e) => { const o = this.n; for (const q of [a, b, c2, e]) this.v(q, col, k, [q[0] + q[2], q[1]]); this.i.push(o, o + 1, o + 2, o, o + 2, o + 3); };
    f([X[0], Y[0], Z[1]], [X[1], Y[0], Z[1]], [X[1], Y[1], Z[1]], [X[0], Y[1], Z[1]]);
    f([X[1], Y[0], Z[0]], [X[0], Y[0], Z[0]], [X[0], Y[1], Z[0]], [X[1], Y[1], Z[0]]);
    f([X[1], Y[0], Z[1]], [X[1], Y[0], Z[0]], [X[1], Y[1], Z[0]], [X[1], Y[1], Z[1]]);
    f([X[0], Y[0], Z[0]], [X[0], Y[0], Z[1]], [X[0], Y[1], Z[1]], [X[0], Y[1], Z[0]]);
    f([X[0], Y[1], Z[1]], [X[1], Y[1], Z[1]], [X[1], Y[1], Z[0]], [X[0], Y[1], Z[0]]);
  }
  quad(a, b, c2, d, col, k = [0, 0, 0, 0]) { const o = this.n; this.v(a, col, k, [0, 0]); this.v(b, col, k, [1, 0]); this.v(c2, col, k, [1, 1]); this.v(d, col, k, [0, 1]); this.i.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 4)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i); g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- the hull's lines
const S = SHIP;
// half breadth at the widest height, by station u (0 taffrail .. 1 stem)
const halfBeam = (u) => S.BEAM * (u < 0.45 ? lerp(0.6, 1, smoothstep(0, 0.45, u)) : Math.pow(Math.max(1 - Math.pow((u - 0.45) / 0.55, 2.3), 0), 0.62));
// the rail's height: high and narrow aft (the stern castle), low in the waist, rising a little to the forecastle
const railY = (u) => 4.5 + 4.6 * (1 - smoothstep(0.06, 0.4, u)) + 1.3 * smoothstep(0.76, 0.98, u);
// the section: 0 at the keel, full at the wale, tumbling home to the rail
const sect = (v) => Math.pow(Math.sin(Math.PI / 2 * Math.min(1, v / 0.46)), 0.62) * (1 - 0.2 * smoothstep(0.5, 1, v));
const stemZ = (u, y) => lerp(S.STERN, S.STEM, u) + (u > 0.9 ? (u - 0.9) * 10 * 0.16 * Math.max(y, 0) : 0) - (u < 0.06 ? (0.06 - u) / 0.06 * 0.1 * Math.max(y - 2, 0) : 0);
const hullPoint = (u, v, side) => {
  const top = railY(u), y = lerp(S.KEEL * (0.55 + 0.45 * Math.sin(Math.PI * clamp(u * 1.1, 0, 1))), top, v);
  return [side * halfBeam(u) * sect(v), y, stemZ(u, y)];
};
// half breadth of the hull at height y of station u (for decks and bulkheads)
const breadthAt = (u, y) => { const top = railY(u), k0 = S.KEEL * (0.55 + 0.45 * Math.sin(Math.PI * clamp(u * 1.1, 0, 1))); return halfBeam(u) * sect(clamp((y - k0) / (top - k0), 0, 1)); };
const deckY = (u) => (u < 0.2 ? 8.0 : u < 0.38 ? 6.3 : u < 0.8 ? 3.2 : 4.7);

const OAK = lin('#4a3524'), OAK_D = lin('#2c2118'), OCHRE = lin('#b08a3c'), RED = lin('#7a2e24'), DECK = lin('#8a7558'), TAR = lin('#1d1a18');
const CANVAS = lin('#e6dcc4'), SPAR = lin('#6a4e32'), AMBER = lin('#f09a3a'), CRIMSON = lin('#b3202a');

// ---------------------------------------------------------------- hull, decks, castles and spars (shared by both ships)
function shipGeometry() {
  const b = new MB();
  // the sides: rows from the keel to the rail; doubled rows give the two painted bands a crisp edge
  const rows = [[0, null], [0.1, null], [0.2, null], [0.3, null], [0.38, null], [0.46, null], [0.56, null], [0.64, null], [0.64, OCHRE], [0.71, OCHRE], [0.71, null], [0.79, null], [0.79, RED], [0.86, RED], [0.86, null], [0.95, null], [0.95, OAK_D], [1, OAK_D]];
  const NU = 46;
  for (const side of [1, -1]) {
    const o = b.n;
    for (let j = 0; j < rows.length; j++) for (let i = 0; i <= NU; i++) {
      const u = i / NU, [v, band] = rows[j], p = hullPoint(u, v, side);
      let c = band || mix3(OAK_D, OAK, 0.55 + 0.45 * Math.sin(u * 37 + v * 11) * Math.sin(u * 13));
      if (!band && p[1] < 0.5) c = mix3(lin('#1c2420'), c, smoothstep(-0.4, 0.5, p[1]));
      b.v(p, mul3(c, 0.8 + 0.2 * smoothstep(0, 0.5, v)), [0, 0, 0.42, 0], [p[2], p[1]]);
    }
    for (let j = 0; j < rows.length - 1; j++) {
      if (rows[j][0] === rows[j + 1][0]) continue;
      for (let i = 0; i < NU; i++) { const a = o + j * (NU + 1) + i, c2 = a + 1, d = a + NU + 1, e = d + 1; if (side > 0) b.i.push(a, d, c2, c2, d, e); else b.i.push(a, c2, d, c2, e, d); }
    }
    // closed gun ports along the lower wale, and the channels the shrouds come down to
    for (let k = 0; k < 7; k++) {
      const u = 0.36 + k * 0.062, q = (du, dv) => { const p = hullPoint(u + du, 0.585 + dv, side); return [p[0] + side * 0.05, p[1], p[2]]; };
      const A = q(-0.011, -0.035), B = q(0.011, -0.035), C = q(0.011, 0.035), D = q(-0.011, 0.035);
      if (side > 0) b.quad(B, A, D, C, mul3(RED, 0.75)); else b.quad(A, B, C, D, mul3(RED, 0.75));
    }
  }
  // decks, fore and aft planks; and the bulkheads at the breaks
  const deck = (u0, u1, n) => b.grid(n, 2, (a, c) => { const u = lerp(u0, u1, a), y = deckY((u0 + u1) / 2), w = breadthAt(u, y) - 0.12, x = lerp(-w, w, c); return { p: [x, y, stemZ(u, y)], c: mul3(DECK, 0.8 + 0.2 * Math.abs(c * 2 - 1)), k: [0, 0, 0.32, 0], uv: [stemZ(u, y), x] }; }, true);
  deck(0.005, 0.2, 5); deck(0.2, 0.38, 5); deck(0.38, 0.8, 12); deck(0.8, 0.985, 6);
  const bulk = (u, y0, y1, face) => { const w0 = breadthAt(u, y0) - 0.1, w1 = breadthAt(u, y1) - 0.1, z = stemZ(u, y0), A = [-w0, y0, z], B = [w0, y0, z], C = [w1, y1, z], D = [-w1, y1, z]; if (face > 0) b.quad(A, B, C, D, mul3(OAK, 0.9), [0, 0, 0.5, 0]); else b.quad(B, A, D, C, mul3(OAK, 0.9), [0, 0, 0.5, 0]); };
  bulk(0.2, 6.3, 8.0, 1); bulk(0.38, 3.2, 6.3, 1); bulk(0.8, 3.2, 4.7, -1);
  // the transom, its gallery of five windows and the ledge under them
  b.grid(8, 10, (a, c) => { const y = lerp(0.6, railY(0), c), w = breadthAt(0, y), x = lerp(w, -w, a); return { p: [x, y, stemZ(0, y)], c: mul3(c > 0.86 ? RED : OAK, 0.85), k: [0, 0, 0.42, 0], uv: [x, y] }; });
  const zt = stemZ(0, 6);
  for (let k = -2; k <= 2; k++) {
    const x = k * 0.92, z = zt - 0.06;
    b.quad([x + 0.33, 5.35, z], [x - 0.33, 5.35, z], [x - 0.33, 6.7, z], [x + 0.33, 6.7, z], lin('#2a2418'), [1, 0, 0, 0]);
  }
  b.box(0, 4.95, zt - 0.35, 5.0, 0.22, 0.8, mul3(OCHRE, 0.8));
  b.box(0, 6.95, zt - 0.18, 5.2, 0.16, 0.4, mul3(OCHRE, 0.8));
  // three stern lanterns on posts over the taffrail
  const lanterns = [];
  for (const x of [-1.6, 0, 1.6]) {
    const top = S.LANTERN_Y + (x === 0 ? 0.5 : 0), zl = S.STERN - 0.25;
    b.tube([x, railY(0) - 0.2, zl + 0.2], [x, top - 0.75, zl], 0.06, 0.05, TAR, 5);
    b.box(x, top - 0.75, zl, 0.5, 0.75, 0.5, mul3(AMBER, 0.9), [0, 0, 0, 1]);
    b.box(x, top, zl, 0.62, 0.1, 0.62, TAR);
    lanterns.push([x, top - 0.35, zl]);
  }
  // hatch gratings, the capstan, the beakhead under the bowsprit
  b.box(0, 3.2, 6.6, 2.2, 0.14, 2.6, mul3(OAK_D, 0.8), [0, 0, 0.16, 0]); b.box(0, 3.2, -2.6, 2.0, 0.14, 2.2, mul3(OAK_D, 0.8), [0, 0, 0.16, 0]);
  b.tube([0, 3.2, -5.2], [0, 4.4, -5.2], 0.5, 0.36, SPAR, 8);
  b.grid(4, 1, (a, c) => { const z = lerp(S.STEM - 0.3, S.STEM + 5.6, a), w = lerp(1.5, 0.25, a) * (c * 2 - 1); return { p: [w, lerp(4.9, 5.9, a), z], c: mul3(OAK, 0.9), k: [0, 0, 0.3, 0], uv: [z, w] }; }, true);
  for (const sx of [1, -1]) b.tube([sx * 1.5, 5.6, S.STEM - 0.3], [sx * 0.25, 6.5, S.STEM + 5.6], 0.07, 0.06, OCHRE, 5);
  // rails round the waist and the castles
  for (const sx of [1, -1]) for (const [u0, u1] of [[0.01, 0.2], [0.2, 0.38], [0.38, 0.8], [0.8, 0.97]]) {
    for (let k = 0; k < 6; k++) { const ua = lerp(u0, u1, k / 6), ub = lerp(u0, u1, (k + 1) / 6), A = hullPoint(ua, 1, sx), B = hullPoint(ub, 1, sx); b.tube([A[0], A[1] + 0.06, A[2]], [B[0], B[1] + 0.06, B[2]], 0.09, 0.09, OAK_D, 5); }
  }
  return { b, lanterns };
}

// ---------------------------------------------------------------- masts, tops, yards, bowsprit; the places the fire stands and runs
const YARDS = [
  { id: 'mainYard', mast: 0, a: [-S.MAIN.yardLen / 2, S.MAIN.yard, S.MAIN.z + 0.5], b: [S.MAIN.yardLen / 2, S.MAIN.yard, S.MAIN.z + 0.5], r: 0.24 },
  { id: 'mainTop', mast: 0, a: [-S.MAIN.tyardLen / 2, S.MAIN.tyard, S.MAIN.z + 0.4], b: [S.MAIN.tyardLen / 2, S.MAIN.tyard, S.MAIN.z + 0.4], r: 0.17 },
  { id: 'foreYard', mast: 1, a: [-S.FORE.yardLen / 2, S.FORE.yard, S.FORE.z + 0.5], b: [S.FORE.yardLen / 2, S.FORE.yard, S.FORE.z + 0.5], r: 0.22 },
  { id: 'foreTop', mast: 1, a: [-S.FORE.tyardLen / 2, S.FORE.tyard, S.FORE.z + 0.4], b: [S.FORE.tyardLen / 2, S.FORE.tyard, S.FORE.z + 0.4], r: 0.15 },
  { id: 'mizzen', mast: 2, a: [0.35, 9.4, S.MIZ.z + 5.6], b: [0.35, 22.2, S.MIZ.z - 7.0], r: 0.17 },
  { id: 'sprit', mast: 1, a: [-4.5, 8.5, 26.4], b: [4.5, 8.5, 26.4], r: 0.13 },
];
const SPRIT_A = [0, 5.2, 16.6], SPRIT_B = [0, 10.6, S.SPRIT];
const TRUCKS = [[0, S.MAIN.truck, S.MAIN.z], [0, S.FORE.truck, S.FORE.z], [0, S.MIZ.truck, S.MIZ.z]];
// the stays the small flames run along (mast: which mast's gathering takes them)
const STAYS = [
  { mast: 0, a: [0, 21.6, S.MAIN.z + 0.3], b: [0, 5.4, S.FORE.z + 1.4] },
  { mast: 0, a: [0, 34.6, S.MAIN.z], b: [0, 19.6, S.FORE.z - 0.3] },
  { mast: 1, a: [0, 18.6, S.FORE.z + 0.3], b: [0, 8.3, 25.2] },
  { mast: 1, a: [0, 30.2, S.FORE.z], b: [0, 10.6, S.SPRIT - 0.2] },
  { mast: 2, a: [0, 17.2, S.MIZ.z + 0.2], b: [0, 6.6, S.MAIN.z - 1.0] },
];

function sparsInto(b) {
  const mast = (z, top, truck, r, rake) => {
    b.tube([0, 1.5, z], [0, top + 1.6, z + rake * top], r, r * 0.72, SPAR, 10, [0, 0, 0, 0], 3);
    b.tube([0, top - 1.2, z + rake * top + 0.5], [0, truck, z], r * 0.6, r * 0.24, SPAR, 8, [0, 0, 0, 0], 3);
    // the round top: a floor and a low rim
    b.tube([0, top, z + 0.2], [0, top + 0.22, z + 0.2], 1.25, 1.5, mul3(SPAR, 0.8), 14);
    b.tube([0, top + 0.22, z + 0.2], [0, top + 0.9, z + 0.2], 1.5, 1.62, mul3(OAK, 0.9), 14);
    b.grid(14, 1, (u, v) => { const an = u * TAU, rr = v * 1.5; return { p: [Math.cos(an) * rr, top + 0.23, z + 0.2 + Math.sin(an) * rr], c: mul3(DECK, 0.7), k: [0, 0, 0, 0], uv: [u, v] }; });
    // the truck's cap
    b.tube([0, truck - 0.1, z], [0, truck + 0.12, z], 0.2, 0.16, OCHRE, 8);
  };
  mast(S.MAIN.z, S.MAIN.top, S.MAIN.truck, 0.46, 0);
  mast(S.FORE.z, S.FORE.top, S.FORE.truck, 0.42, 0);
  b.tube([0, 5.5, S.MIZ.z], [0, S.MIZ.truck, S.MIZ.z], 0.3, 0.09, SPAR, 8, [0, 0, 0, 0], 3);
  b.tube([0, S.MIZ.truck - 0.1, S.MIZ.z], [0, S.MIZ.truck + 0.1, S.MIZ.z], 0.15, 0.12, OCHRE, 8);
  for (const y of YARDS) {
    const m = [(y.a[0] + y.b[0]) / 2, (y.a[1] + y.b[1]) / 2, (y.a[2] + y.b[2]) / 2];
    b.tube(m, y.a, y.r, y.r * 0.5, SPAR, 7, [0, 0, 0, 0], 2); b.tube(m, y.b, y.r, y.r * 0.5, SPAR, 7, [0, 0, 0, 0], 2);
  }
  b.tube(SPRIT_A, SPRIT_B, 0.36, 0.15, SPAR, 9, [0, 0, 0, 0], 3);
}

// a sail furled along a yard in a neat roll with gaskets
function furlInto(b, y, seed) {
  const d = [y.b[0] - y.a[0], y.b[1] - y.a[1], y.b[2] - y.a[2]], len = Math.hypot(d[0], d[1], d[2]), n = Math.max(8, Math.round(len / 0.7));
  const dx = d[0] / len, dy = d[1] / len, dz = d[2] / len;
  // two axes across the yard: mostly up, and mostly forward
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(dx, dy, dz), e2 = new THREE.Vector3().crossVectors(dir, up);
  if (e2.lengthSq() < 0.01) e2.set(1, 0, 0);
  e2.normalize(); const e1 = new THREE.Vector3().crossVectors(e2, dir).normalize();
  b.grid(8, n, (u, v) => {
    const t = 0.04 + 0.92 * v, an = u * TAU, tie = Math.abs(((t * len + seed) % 1.7) - 0.85) < 0.1;
    const rr = (0.3 + 0.1 * Math.sin(t * len * 2.1 + seed * 5) * Math.sin(t * len * 0.7 + seed)) * (1 - 0.55 * Math.pow(Math.abs(t * 2 - 1), 3)) * (tie ? 0.8 : 1) * (y.r / 0.24 * 0.6 + 0.4);
    const cx = Math.cos(an) * rr, sx = Math.sin(an) * rr * 1.25, off = y.r + rr * 0.75;
    const p = [lerp(y.a[0], y.b[0], t) + e1.x * (off + cx) + e2.x * sx, lerp(y.a[1], y.b[1], t) + e1.y * (off + cx) + e2.y * sx, lerp(y.a[2], y.b[2], t) + e1.z * (off + cx) + e2.z * sx];
    return { p, c: tie ? mul3(TAR, 1.6) : mul3(CANVAS, 0.74 + 0.2 * Math.cos(an) + 0.06 * Math.sin(t * len * 3.3)), k: [0, 0, 0, 0], uv: [u, t * len] };
  });
}

// a set sail: its head on the yard (a to b), a drop of `drop` metres, bellying towards +Z, shaking in the gale
function sailInto(b, y, drop, footK, belly, flutter) {
  b.grid(14, 10, (u, v) => {
    const w = lerp(1, footK, v), x = lerp(y.a[0], y.b[0], 0.5 + (u - 0.5) * w * 0.96), sag = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 0.8 + 0.12));
    const p = [x, y.a[1] - y.r - drop * v + 0.5 * Math.pow(Math.abs(u * 2 - 1), 2) * v, y.a[2] + 0.2 + belly * sag];
    const seam = Math.abs(((u * 14) % 2) - 1) < 0.12 ? 0.88 : 1, reef = v > 0.72 && v < 0.82 ? 0.9 : 1;
    return { p, c: mul3(CANVAS, (0.82 + 0.18 * sag) * seam * reef), k: [0, flutter * (0.25 + v) * Math.sin(Math.PI * clamp(u, 0.04, 0.96)), 0, 0], uv: [u, v] };
  });
}

// the long plain pennant at the main truck: streaming (storm) or hanging (calm)
function pennantInto(b, streaming) {
  const L = 11, top = S.MAIN.truck - 0.2;
  b.grid(18, 1, (u, v) => {
    const w = lerp(0.75, 0.06, u) * (v - 0.5);
    const p = streaming ? [0.25 + L * u, top + w - 0.6 * u * u, S.MAIN.z - 0.4 * u] : [0.2 + 0.5 * Math.sin(u * 5) * u, top - L * u * 0.82 + w * 0.2, S.MAIN.z + 0.25 * Math.sin(u * 7) * u + w];
    return { p, c: mul3(CRIMSON, 0.85 + 0.15 * Math.sin(u * 21)), k: [0, (streaming ? 1.3 : 0.22) * u, 0, 0], uv: [u, v] };
  });
}

// ---------------------------------------------------------------- rigging: every rope a ribbon that faces the eye
function rigGeometry() {
  const segs = [];
  const rope = (a, b, w, sag = 0) => {
    if (!sag) { segs.push([a, b, w]); return; }
    const n = 6; let p = a;
    for (let k = 1; k <= n; k++) { const t = k / n, q = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)]; segs.push([p, q, w]); p = q; }
  };
  const railPt = (z, sx) => { const u = clamp((z - S.STERN) / (S.STEM - S.STERN), 0.01, 0.99), p = hullPoint(u, 1, sx); return [p[0] + sx * 0.3, p[1] - 0.2, p[2]]; };
  // lower shrouds with ratlines
  const shrouds = (z, top, n, sx, r) => {
    const feet = [], head = [sx * r, top - 0.4, z];
    for (let k = 0; k < n; k++) feet.push(railPt(z - 0.5 - k * 1.05, sx));
    for (const f of feet) rope(f, head, 0.075);
    for (let y = feet[0][1] + 1.0; y < top - 1.6; y += 0.62) {
      const at = (f) => { const t = (y - f[1]) / (head[1] - f[1]); return [lerp(f[0], head[0], t), y, lerp(f[2], head[2], t)]; };
      rope(at(feet[0]), at(feet[n - 1]), 0.035);
    }
  };
  for (const sx of [1, -1]) {
    shrouds(S.MAIN.z, S.MAIN.top, 5, sx, 0.4); shrouds(S.FORE.z, S.FORE.top, 4, sx, 0.36); shrouds(S.MIZ.z, 17.5, 3, sx, 0.25);
    // topmast shrouds from the rim of each top
    for (const M of [S.MAIN, S.FORE]) for (let k = 0; k < 3; k++) rope([sx * 1.5, M.top + 0.9, M.z + 0.7 - k * 0.6], [sx * 0.12, M.truck - 3.2, M.z], 0.05);
    // backstays, lifts and braces
    rope([0, S.MAIN.truck - 2, S.MAIN.z], railPt(S.MAIN.z - 6.5, sx), 0.06); rope([0, S.FORE.truck - 2, S.FORE.z], railPt(S.FORE.z - 5.5, sx), 0.06);
    for (const y of YARDS.slice(0, 4)) {
      const M = y.mast === 0 ? S.MAIN : S.FORE, end = sx > 0 ? y.b : y.a, upper = y.id.endsWith('Top');
      rope(end, [0, end[1] + (upper ? 5.5 : 4.2), M.z + 0.3], 0.04);
    }
    const e = (y) => (sx > 0 ? y.b : y.a);
    rope(e(YARDS[0]), railPt(-9.5, sx), 0.045, 0.8); rope(e(YARDS[1]), [0, 22.5, S.MIZ.z], 0.04, 0.5);
    rope(e(YARDS[2]), [sx * 0.3, 16.4, S.MAIN.z + 0.6], 0.045, 0.6); rope(e(YARDS[3]), [sx * 0.3, 22.6, S.MAIN.z + 0.5], 0.04, 0.4);
    rope(e(YARDS[5]), railPt(15.5, sx), 0.04, 0.3);
  }
  for (const s of STAYS) rope(s.a, s.b, 0.085);
  // the lateen yard's lifts and the bobstay under the bowsprit
  rope(YARDS[4].b, [0, S.MIZ.truck - 0.6, S.MIZ.z], 0.04); rope(YARDS[4].a, railPt(S.MIZ.z + 7.5, 1), 0.04); rope(YARDS[4].a, railPt(S.MIZ.z + 7.5, -1), 0.04);
  rope([0, 1.2, S.STEM + 0.4], [0, 9.2, 28.2], 0.07);
  const n = segs.length, pos = new Float32Array(n * 12), oth = new Float32Array(n * 12), sw = new Float32Array(n * 8), idx = [];
  for (let k = 0; k < n; k++) {
    const [a, b2, w] = segs[k];
    for (let c = 0; c < 4; c++) {
      const p = c < 2 ? a : b2, q = c < 2 ? b2 : a, o = k * 12 + c * 3;
      pos[o] = p[0]; pos[o + 1] = p[1]; pos[o + 2] = p[2]; oth[o] = q[0]; oth[o + 1] = q[1]; oth[o + 2] = q[2];
      // side: the two ends see the other end in opposite directions, so the sign is swapped at the far end
      sw[k * 8 + c * 2] = (c % 2 ? 1 : -1) * (c < 2 ? 1 : -1); sw[k * 8 + c * 2 + 1] = w;
    }
    idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 1, k * 4 + 3, k * 4 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aOther', new THREE.BufferAttribute(oth, 3)); g.setAttribute('aSW', new THREE.BufferAttribute(sw, 2));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 18, 4), 42);
  return g;
}

// ---------------------------------------------------------------- materials
// One smooth tileable noise texture (R: coarse, G: medium, B: fine, A: another coarse), for flames here and for the world's shaders.
function noiseTexture(rng) {
  const N = 128, data = new Uint8Array(N * N * 4);
  const layer = (cells, ch) => {
    const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rng();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = x / N * cells, fy = y / N * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = g[(y0 % cells) * cells + (x0 % cells)], b = g[(y0 % cells) * cells + ((x0 + 1) % cells)], c = g[((y0 + 1) % cells) * cells + (x0 % cells)], d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
      data[(y * N + x) * 4 + ch] = Math.round(255 * lerp(lerp(a, b, sx), lerp(c, d, sx), sy));
    }
  };
  layer(8, 0); layer(16, 1); layer(32, 2); layer(6, 3);
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// THE COPY IN STILL WATER is the same ship truly mirrored at her waterline (y to -y), standing under the water sheet.
// A mirror image is seen in the mirror's own face, so each of its fragments is depth-tested where the line of sight
// meets the water (a hand over the sheet): what stands before the water hides it, and the bed under the nook does not.
const MIRROR_FRAG = /* glsl */`
  uniform mat4 projectionMatrix;
  float mirrorDepth(vec3 w, float waterY) {
    vec3 d = w - cameraPosition; float t = (waterY + .2 - cameraPosition.y) / min(d.y, -1e-4);
    vec4 c = projectionMatrix * viewMatrix * vec4(cameraPosition + d * t, 1.);
    return clamp(c.z / max(c.w, 1e-4) * .5 + .5, 0., 1.);
  }`;

const SHIP_VERT = /* glsl */`
  attribute vec4 aK; attribute vec2 aUV;
  uniform float uTime, uGale, uWaterY;
  varying vec3 vN, vW, vC; varying vec4 vK; varying vec2 vUV; varying float vOx;
  #include <fog_pars_vertex>
  void main() {
    vec3 p = position;
    float fl = aK.y * (.12 + .88 * uGale);
    p += normal * fl * (sin(uTime * 9.1 + position.x * 1.7 + position.y * 2.3) * .15 + sin(uTime * 5.3 + position.y * 1.1 - position.x * .8) * .22);
    p.x += aK.w * .2 * sin(uTime * 1.9 + position.x * 2.);
    vec4 wp = modelMatrix * vec4(p, 1.);
    #ifdef MIRROR
      // the copy trembles with the water's ripples, more the further it lies from her waterline
      float dp = clamp((uWaterY - wp.y) / 36., 0., 1.);
      wp.x += (.05 + dp * .3) * sin(uTime * 1.3 + wp.y * .9 + wp.z * .21); wp.z += (.05 + dp * .3) * sin(uTime * 1.1 + wp.y * .7 + wp.x * .17);
    #endif
    vN = normalize(mat3(modelMatrix) * normal); vW = wp.xyz; vC = color; vK = aK; vUV = aUV; vOx = position.x;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const SHIP_FRAG = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uSky, uGround, uFireCol; uniform vec4 uFire[6];
  uniform float uTime, uWet, uGlim, uGlimPh, uLamp, uWaterY, uGain; uniform vec3 uWaterTint;
  varying vec3 vN, vW, vC; varying vec4 vK; varying vec2 vUV; varying float vOx;
  #include <fog_pars_fragment>
  #ifdef MIRROR
  ${MIRROR_FRAG}
  #endif
  void main() {
    #ifdef MIRROR
      if (vW.y > uWaterY - .02) discard;
    #endif
    vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
    #ifdef MIRROR
      // the copy is lit as she is: the light on her does not turn over with her
      n.y = -n.y;
    #endif
    vec3 alb = vC;
    if (vK.z > 0.) {
      float q = vUV.y / max(vK.z, .05), f = fract(q);
      alb *= clamp(mix(.6, 1., smoothstep(0., .07, f) * smoothstep(1., .93, f)) * (.88 + .24 * fract(sin(floor(q) * 12.9898) * 43758.5453)), .5, 1.12);
    }
    float sail = step(.001, vK.y);
    vec3 hemi = mix(uGround, uSky, n.y * .5 + .5);
    float nl = dot(n, uSunDir);
    vec3 sun = uSunCol * (max(nl * .85 + .15, 0.) + sail * .4 * max(-nl, 0.));
    vec3 fire = vec3(0.); float spec = 0.;
    vec3 v = normalize(cameraPosition - vW);
    for (int i = 0; i < 6; i++) {
      vec3 L = uFire[i].xyz - vW; float d2 = dot(L, L); vec3 l = L * inversesqrt(max(d2, 1e-4));
      float a = uFire[i].w / (1. + d2 / 110.);
      fire += uFireCol * a * (max(dot(n, l) * .7 + .3, 0.) + sail * .35 * max(-dot(n, l), 0.));
      vec3 h = normalize(l + v); float nh = max(dot(n, h), 0.); float nh2 = nh * nh; nh2 *= nh2; nh2 *= nh2;
      spec += a * nh2 * nh2;
    }
    // canvas never burns out under the fire: its light is eased towards 1, so seams, reef bands and the belly's shade stay
    vec3 lt = hemi + sun + fire; float lm = max(lt.r, max(lt.g, lt.b));
    if (lm > .6) lt *= mix(1., (.6 + .4 * (1. - exp(-(lm - .6) / .4))) / lm, sail);
    vec3 col = alb * lt + uFireCol * spec * uWet * .22;
    // pale fire glimmering in the cabin windows in turn; glass takes the sky when nothing burns
    float turn = .5 + .5 * sin(uTime * 1.3 + uGlimPh + floor(vOx * 1.09 + .5) * 2.4);
    col = mix(col, uFireCol * (2.2 * uGlim * turn * turn) + uSky * .35 * (1. - uGlim), step(.5, vK.x));
    col += vec3(1., .56, .16) * vK.w * uLamp * (.85 + .15 * sin(uTime * 7. + vOx * 5.));
    col *= uGain;
    #ifdef MIRROR
      // seen in the water: darker than she is and taking the water's own colour, more towards her trucks
      col = mix(col * .8, uWaterTint, .2 + .4 * clamp((uWaterY - vW.y) / 36., 0., 1.));
      gl_FragDepth = mirrorDepth(vW, uWaterY);
    #endif
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

const RIG_VERT = /* glsl */`
  attribute vec3 aOther; attribute vec2 aSW;
  varying float vA; varying vec3 vW;
  #include <fog_pars_vertex>
  void main() {
    vec4 wa = modelMatrix * vec4(position, 1.), wb = modelMatrix * vec4(aOther, 1.);
    vW = wa.xyz;
    vec4 a = viewMatrix * wa, b = viewMatrix * wb;
    vec3 dir = b.xyz - a.xyz; vec3 c = cross(dir, a.xyz); float cl = length(c);
    vec3 side = cl > 1e-5 ? c / cl : vec3(1., 0., 0.);
    // never thinner to the eye than 0.0016 rad: a far rope keeps that width and fades instead
    float w = max(aSW.y, max(-a.z, .1) * .0016);
    vA = clamp(aSW.y / w, 0., 1.);
    a.xyz += side * aSW.x * w * .5;
    vec4 mvPosition = a;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const RIG_FRAG = /* glsl */`
  uniform vec3 uSky, uSunCol, uFireCol; uniform vec4 uFire[6]; uniform float uWaterY, uGain;
  varying float vA; varying vec3 vW;
  #include <fog_pars_fragment>
  #ifdef MIRROR
  ${MIRROR_FRAG}
  #endif
  void main() {
    #ifdef MIRROR
      if (vW.y > uWaterY - .02) discard;
      gl_FragDepth = mirrorDepth(vW, uWaterY);
    #endif
    float f = 0.;
    for (int i = 0; i < 6; i++) { vec3 L = uFire[i].xyz - vW; f += uFire[i].w / (1. + dot(L, L) / 110.); }
    vec3 col = vec3(.075, .065, .055) * (uSky * 1.2 + uSunCol * .45) + uFireCol * f * .16;
    #ifdef MIRROR
      gl_FragColor = vec4(col * uGain, vA * .45);
    #else
      gl_FragColor = vec4(col * uGain, vA);
    #endif
    #include <fog_fragment>
  }`;

// ---------------------------------------------------------------- the fire: soft cold tongues, sized in metres
// Each flame is two crossed sheets and a glow. A tongue is drawn by moving noise inside its sheet (whitest at the root,
// clear blue at a torn tip, its edge feathered by the noise and never by the sheet's outline); it leans with the gale;
// its glow is two and a half times its height across.
const FLAME_VERT = /* glsl */`
  attribute vec3 iPos; attribute vec2 iHP;
  uniform float uTime; uniform vec3 uWind;
  varying vec2 vUv; varying float vKind, vPh, vH;
  void main() {
    float h = iHP.x, kind = position.z;
    vKind = kind; vPh = iHP.y; vH = h;
    vec4 mv;
    if (kind > 1.5) {
      // the glow: a soft dab that turns about its own place to face the eye
      mv = modelViewMatrix * vec4(iPos + vec3(0., h * .4, 0.), 1.);
      float s = (h * 1.25 + .3) * step(.01, h);
      mv.xy += vec2(position.x * 2., position.y * 2. - 1.) * s;
      vUv = vec2(position.x * 2., position.y * 2. - 1.);
    } else {
      float w = .44 * pow(max(h, 0.), .75), y = position.y;
      vec3 dir = kind < .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.);
      vec3 p = iPos + dir * (position.x * 2. * w) + vec3(0., y * h, 0.);
      p += uWind * (y * y * h * .45) + vec3(sin(uTime * 7. + iHP.y * 40. + y * 4.), 0., cos(uTime * 6.1 + iHP.y * 31. + y * 3.)) * (.08 * h * y);
      mv = modelViewMatrix * vec4(p, 1.);
      vUv = vec2(position.x * 2., y);
    }
    gl_Position = projectionMatrix * mv;
  }`;
const FLAME_FRAG = /* glsl */`
  uniform sampler2D uNoise; uniform float uTime, uGlow; uniform vec3 uCol;
  varying vec2 vUv; varying float vKind, vPh, vH;
  void main() {
    vec3 col;
    float flick = .8 + .2 * sin(uTime * 13. + vPh * 60.) * sin(uTime * 7.3 + vPh * 21.);
    if (vKind > 1.5) {
      float r = clamp(length(vUv), 0., 1.);
      col = mix(uCol, vec3(.45, .65, 1.), .35) * (exp(-r * r * 3.4) * (1. - smoothstep(.7, 1., r)) * uGlow * flick);
    } else {
      float x = clamp(vUv.x, -1., 1.), y = clamp(vUv.y, 0., 1.);
      // moving noise: broad slow licks, quick small ones and a fine tearing, all rising
      float n1 = texture2D(uNoise, vec2(x * .16 + vPh, y * .26 * (1. + vH * .15) - uTime * .7)).r;
      float n2 = texture2D(uNoise, vec2(x * .37 - vPh * 3., y * .55 - uTime * 1.5)).g;
      float n3 = texture2D(uNoise, vec2(x * .8 + vPh * 7., y * 1.1 - uTime * 2.3)).b;
      // widest a fifth of the way up, thinning to the tip; its middle line wanders with the noise
      float wd = (.14 + .44 * smoothstep(0., .2, y)) * pow(clamp(1. - y, 0., 1.), .85);
      float d = abs(x - ((n1 - .5) * .7 + (n2 - .5) * .25) * y) / max(wd, 1e-3);
      float body = smoothstep(1.15, .15, d + (n3 - .5) * .7 + (n2 - .5) * .5);
      body *= smoothstep(1., .5, y + (n2 - .5) * .5) * (1. - smoothstep(.75, 1., abs(x))) * smoothstep(0., .05, y);
      float root = smoothstep(.7, 0., d) * (1. - smoothstep(0., .55, y)) * smoothstep(0., .05, y);
      col = (mix(uCol * .62, vec3(.16, .38, 1.) * .55, smoothstep(.05, .85, y)) * body + vec3(.8, .9, 1.) * root * .32) * flick;
    }
    gl_FragColor = vec4(col, 1.);
  }`;

// n flames in one body; set(i, x, y, z, height, phase) in the space of the mesh's parent, then commit()
export function makeFlames(n, noise, color) {
  const pos = [], idx = [];
  for (let kind = 0; kind < 3; kind++) {
    const rows = kind === 2 ? 1 : 6, o = pos.length / 3;
    for (let j = 0; j <= rows; j++) for (const x of [-0.5, 0.5]) pos.push(x, j / rows, kind);
    for (let j = 0; j < rows; j++) { const a = o + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), iHP = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2);
  iPos.setUsage(THREE.DynamicDrawUsage); iHP.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', iPos); g.setAttribute('iHP', iHP); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const uniforms = { uTime: { value: 0 }, uWind: { value: new THREE.Vector3(0.5, 0, 0.25) }, uNoise: { value: noise }, uGlow: { value: 0.3 }, uCol: { value: new THREE.Color(color || '#cfeaff') } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return {
    mesh, uniforms, count: n,
    set(i, x, y, z, h, ph) { iPos.array[i * 3] = x; iPos.array[i * 3 + 1] = y; iPos.array[i * 3 + 2] = z; iHP.array[i * 2] = h; iHP.array[i * 2 + 1] = ph; },
    commit() { iPos.needsUpdate = true; iHP.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- where each flame stands or runs (drawn once from the part's own stream)
const GATHER = { run: 1.3, hold: 1.5, burst: 1.0 };
function fireCourse(rng) {
  const tracks = [], flames = [];
  const hubOn = (mast) => (mast === 0 ? S.MAIN.z : mast === 1 ? S.FORE.z : S.MIZ.z);
  const track = (a, b, mast, group, hubT) => {
    const t = { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), mast, group, hubT, list: [] };
    t.hub = [0, lerp(a[1], b[1], hubT), hubOn(mast)];
    tracks.push(t); return t;
  };
  YARDS.forEach((y, i) => track(y.a, y.b, y.mast, i === 5 ? 5 : y.mast === 0 ? 3 : y.mast === 1 ? 4 : 2, i === 4 ? 0.44 : 0.5));
  const sprit = track([0, 6.2, S.STEM + 0.4], SPRIT_B, 1, 5, 0);
  STAYS.forEach((s) => track(s.a, s.b, s.mast, s.mast === 0 ? 3 : s.mast === 1 ? 4 : 2, 0));
  // the three tall flames at the trucks
  TRUCKS.forEach((p, i) => flames.push({ truck: true, fixed: p, mast: i, group: i, h0: rng.range(3, 4.5), ph: rng() }));
  // one at each of the ten yard ends and one at the bowsprit end
  for (let i = 0; i < 5; i++) for (const p of [0, 1]) flames.push({ t: tracks[i], p, end: true, mast: tracks[i].mast, group: tracks[i].group, h0: rng.range(1.2, 2), ph: rng() });
  flames.push({ t: sprit, p: 1, end: true, tip: true, mast: 1, group: 5, h0: rng.range(1.5, 2), ph: rng() });
  // about seventy small ones, shared out by the length of each course
  const total = tracks.reduce((s, t) => s + t.len, 0);
  for (const t of tracks) {
    const n = Math.max(2, Math.round(70 * t.len / total));
    for (let k = 0; k < n; k++) {
      const v = rng.range(2, 6), w1 = v / (0.63 * t.len);
      flames.push({ t, run: true, mast: t.mast, group: t.group, h0: rng.range(0.5, 1.5), ph: rng(), c0: rng.range(0.42, 0.58), w1, f1: rng.range(0, TAU), w2: w1 * rng.range(2.0, 2.7), f2: rng.range(0, TAU) });
    }
  }
  flames.forEach((f, i) => { f.i = i; if (f.t) f.t.list.push(f); });
  // the gatherings: the three masts take turns without a gap, so that one of them is always gathering, gathered or
  // bursting; which mast takes each of the 18 turns is drawn (never the same twice running), and the round begins
  // at a drawn point of its whole length
  const events = [], turn = GATHER.run + GATHER.hold + GATHER.burst; let last = -1;
  for (let k = 0; k < 18; k++) { let mast = rng.int(0, 2); if (mast === last) mast = (mast + 1 + rng.int(0, 1)) % 3; events.push({ at: k * turn, mast }); last = mast; }
  if (events[17].mast === events[0].mast) { const a = events[0].mast, b = events[16].mast; events[17].mast = a === b ? (a + 1) % 3 : 3 - a - b; }
  return { tracks, flames, events, loop: 18 * turn, phase: rng() * 18 * turn };
}
// how far mast m's flames are gathered at this time: 0 spread out .. 1 all in one flame at the truck
function gatherAt(course, time, out) {
  out[0] = out[1] = out[2] = 0;
  const t = (((time + course.phase) % course.loop) + course.loop) % course.loop;
  for (const e of course.events) {
    const d = t - e.at;
    if (d < 0 || d > GATHER.run + GATHER.hold + GATHER.burst) continue;
    out[e.mast] = Math.max(out[e.mast], smoothstep(0, GATHER.run, d) * (1 - smoothstep(GATHER.run + GATHER.hold, GATHER.run + GATHER.hold + GATHER.burst, d)));
  }
  return out;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  // (her own stream of chance: the world's fork for her, or one under her own name)
  const rng = opts.rng || makeRng(hashSeed('fire-ship:' + ctx.seed));
  await ctx.yield();
  const noise = opts.noiseTexture || noiseTexture(rng);
  await ctx.yield();
  // geometry
  const hull = shipGeometry();
  await ctx.yield();
  sparsInto(hull.b);
  await ctx.yield();
  for (const i of [0, 3, 4, 5]) furlInto(hull.b, YARDS[i], i * 1.37);
  await ctx.yield();
  // (a ship is one body: her hull and spars are drawn together with what her yards carry, set or furled)
  const both = (a, b) => { const o = new MB(); o.p = a.p.concat(b.p); o.c = a.c.concat(b.c); o.k = a.k.concat(b.k); o.uv = a.uv.concat(b.uv); o.i = a.i.concat(b.i.map((q) => q + a.n)); o.n = a.n + b.n; return o; };
  const sb = new MB(); sailInto(sb, YARDS[2], 6.2, 0.9, 1.9, 0.5); sailInto(sb, YARDS[1], 7.4, 1.18, 1.7, 0.45); pennantInto(sb, true);
  const gSet = both(hull.b, sb).build();
  await ctx.yield();
  const fb = new MB(); furlInto(fb, YARDS[2], 2.9); furlInto(fb, YARDS[1], 4.3); pennantInto(fb, false);
  const gFurled = both(hull.b, fb).build();
  await ctx.yield();
  const gRig = rigGeometry();
  await ctx.yield();

  // the light of one ship's own place; the world writes each ship's values once, from the weather where she lies
  const timeU = { value: 0 };
  const lightSet = () => ({
    uSunDir: { value: new THREE.Vector3(0.908, 0.342, -0.243) }, uSunCol: { value: new THREE.Vector3(0.5, 0.52, 0.55) },
    uSky: { value: new THREE.Vector3(0.16, 0.22, 0.24) }, uGround: { value: new THREE.Vector3(0.05, 0.09, 0.085) },
    uFireCol: { value: new THREE.Color(opts.fireColor || '#cfeaff') }, uTime: timeU, uWaterY: { value: 0 }, uGlimPh: { value: opts.glimmer || 0 },
    uWaterTint: { value: new THREE.Vector3(0.6, 0.66, 0.68) },
  });
  const LU = lightSet();
  const fogU = () => ({ fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } });
  const mats = (own, mirror, light) => {
    const u = { ...fogU(), ...light, ...own }, defines = mirror ? { MIRROR: 1 } : {};
    const ship = new THREE.ShaderMaterial({ uniforms: u, defines, vertexShader: SHIP_VERT, fragmentShader: SHIP_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide });
    const rig = new THREE.ShaderMaterial({ uniforms: u, defines, vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    return { ship, rig };
  };
  const zero6 = () => Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0));
  const assemble = (m, geos) => {
    const g = new THREE.Group();
    for (const geo of geos) g.add(new THREE.Mesh(geo, m.ship));
    const r = new THREE.Mesh(gRig, m.rig); r.renderOrder = 2; g.add(r);
    return g;
  };

  // the storm ship: an outer group the world places, an inner one that pitches, rolls and heaves
  const own = { uFire: { value: zero6() }, uGale: { value: 1 }, uWet: { value: 1 }, uGlim: { value: 1 }, uLamp: { value: 3 }, uGain: { value: 1 } };
  const object = new THREE.Group(), rock = assemble(mats(own, false, LU), [gSet]);
  object.add(rock);
  const course = fireCourse(rng), flames = makeFlames(course.flames.length, noise, opts.fireColor);
  rock.add(flames.mesh);
  const gat = [0, 0, 0], sums = new Float32Array(24), q = new THREE.Vector3(), eul = new THREE.Euler(0, 0, 0, 'YXZ');
  const rollPh = rng.range(0, TAU), pitchPh = rng.range(0, TAU);
  const lerp3 = (a, b, t, o) => { o[0] = lerp(a[0], b[0], t); o[1] = lerp(a[1], b[1], t); o[2] = lerp(a[2], b[2], t); return o; };
  const P = [0, 0, 0];

  const fireUpdate = (time) => {
    gatherAt(course, time, gat);
    sums.fill(0);
    // where each flame is and how tall, before any two meet
    for (const f of course.flames) {
      const g = gat[f.mast]; let h = f.h0;
      if (f.truck) { P[0] = f.fixed[0]; P[1] = f.fixed[1]; P[2] = f.fixed[2]; h = lerp(f.h0, 7, smoothstep(0.55, 1, g)); f.pp = -1; }
      else {
        const t = f.t; let p = f.run ? clamp(f.c0 + 0.34 * Math.sin(f.w1 * time + f.f1) + 0.13 * Math.sin(f.w2 * time + f.f2), 0.03, 0.97) : f.p;
        p = lerp(p, t.hubT, smoothstep(0, 0.6, g)); f.pp = p;
        lerp3(t.a, t.b, p, P);
        if (g > 0.6) { const k = smoothstep(0.6, 1, g), T = TRUCKS[f.mast]; P[0] = lerp(P[0], T[0], k); P[1] = lerp(P[1], T[1], k); P[2] = lerp(P[2], T[2], k); h *= 1 - 0.9 * k; }
      }
      f.x = P[0]; f.y = P[1]; f.z = P[2]; f.h = h;
    }
    // two that come within a metre and a half on one course fuse into one flame of their summed height, then part
    for (const t of course.tracks) for (let a = 0; a < t.list.length; a++) for (let b2 = a + 1; b2 < t.list.length; b2++) {
      const A = t.list[a], B = t.list[b2], d = Math.abs(A.pp - B.pp) * t.len;
      if (d < 1.5) { const k = 1 - smoothstep(0.5, 1.5, d), give = B.h * k; A.h += give; B.h -= give; }
    }
    for (const f of course.flames) {
      flames.set(f.i, f.x, f.y, f.z, f.h, f.ph);
      const o = f.group * 4; sums[o] += f.x * f.h; sums[o + 1] += f.y * f.h; sums[o + 2] += f.z * f.h; sums[o + 3] += f.h;
    }
    flames.commit(); flames.uniforms.uTime.value = time;
    rock.updateMatrixWorld(true);
    for (let k = 0; k < 6; k++) {
      const w = sums[k * 4 + 3], v = own.uFire.value[k];
      if (w < 1e-3) { v.w = 0; continue; }
      q.set(sums[k * 4] / w, sums[k * 4 + 1] / w + 0.8, sums[k * 4 + 2] / w).applyMatrix4(rock.matrixWorld);
      v.set(q.x, q.y, q.z, (opts.fireLight ?? 0.2) * Math.pow(w, 0.7));
    }
  };

  // her twin for still water: the same hull and spars, every sail furled, no fire, lanterns unlit; and the copy under her
  const twin = () => {
    const tOwn = { uFire: { value: zero6() }, uGale: { value: 0 }, uWet: { value: 0 }, uGlim: { value: 0 }, uLamp: { value: 0 }, uGain: { value: 1 } };
    const mOwn = { ...tOwn, uGain: { value: 1 } }, tLight = lightSet();
    const tObject = new THREE.Group(), up = assemble(mats(tOwn, false, tLight), [gFurled]), down = assemble(mats(mOwn, true, tLight), [gFurled]);
    down.scale.y = -1;
    tObject.add(up, down);
    return { object: tObject, upright: up, mirror: down, uniforms: tOwn, mirrorUniforms: mOwn, light: tLight };
  };

  const world = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const anchors = {
    trucks: TRUCKS.map(world),
    yardEnds: YARDS.slice(0, 5).flatMap((y) => [world(y.a), world(y.b)]),
    bowspritEnd: world(SPRIT_B),
    lanterns: hull.lanterns.map(world),
    mainTop: new THREE.Vector3(0, S.MAIN.top, S.MAIN.z), foreYard: new THREE.Vector3(0, S.FORE.yard, S.FORE.z),
    // the fly-by line: FLYBY to starboard of the keel, from abeam of the taffrail to abeam of the bowsprit end
    flyBy: [new THREE.Vector3(-S.FLYBY, S.MAIN.yard + 3.5, S.STERN), new THREE.Vector3(-S.FLYBY, S.MAIN.yard + 1, S.SPRIT)],
  };
  fireUpdate(0);

  return {
    object, radius: 28, height: S.HEIGHT, center: new THREE.Vector3(0, 15, 4), anchors, ground: true, groundY: -0.05,
    light: LU, uniforms: own, fire: own.uFire.value, flames, noiseTexture: noise, twin, rock,
    // the sea under her, if the world has one: (x, z, time) => height
    heightAt: opts.heightAt || null,
    update(dt, time, camera) {
      timeU.value = time;
      const hAt = this.heightAt;
      // she pitches 5 degrees, rolls 7 and heaves with the sea under her, for ever
      let heave = 0.9 * Math.sin(time * 0.83 + pitchPh), pitch = 0.087 * Math.sin(time * 0.71 + pitchPh);
      if (hAt) {
        object.updateMatrixWorld(true);
        const e = object.matrixWorld.elements, ox = e[12], oz = e[14], fx = e[8], fz = e[10];
        const hb = hAt(ox + fx * 14, oz + fz * 14, time), hs = hAt(ox - fx * 14, oz - fz * 14, time), hm = hAt(ox, oz, time);
        heave = (hb + hs + 2 * hm) / 4 * 0.85; pitch = clamp(Math.atan2(hs - hb, 28) * 0.8, -0.1, 0.1);
      }
      eul.set(pitch, 0, 0.122 * (0.75 * Math.sin(time * 0.57 + rollPh) + 0.25 * Math.sin(time * 1.31 + rollPh * 2)));
      rock.rotation.copy(eul); rock.position.y = heave;
      fireUpdate(time);
    },
    dispose() { if (!opts.noiseTexture) noise.dispose(); for (const g of [gSet, gFurled, gRig]) g.dispose(); },
  };
}

// ---------------------------------------------------------------- cloud shaped as architecture
// Plain massing (surfaces of revolution, blocks with rounded edges, bent tubes) with smooth normals. Each vertex
// carries the size of the billows it is to swell by (metres), its building's number, its height in the building
// (0 at the foot, 1 at the top), the building's whole height in metres, and how open it lies (1) or how deep in a hollow (0).
// The swelling itself is done by the cloud shader, so that the cloud can breathe and melt.
export class CloudBuilder {
  constructor(edgeK = 1) { this.cap = 0; this.icap = 0; this.n = 0; this.ni = 0; this.from = 0; this.k = edgeK; this.ax = 0; this.az = 0; this.ar = 1; this.room(4096, 16384); }
  // typed stores that double when full
  room(nv, nix) {
    if (nv > this.cap) { const c = Math.max(nv, this.cap * 2), g = (old, w) => { const a = new Float32Array(c * w); if (old) a.set(old.subarray(0, this.n * w)); return a; }; this.P = g(this.P, 3); this.N = g(this.N, 3); this.L = g(this.L, 4); this.O = g(this.O, 1); this.C = g(this.C, 4); this.cap = c; }
    if (nix > this.icap) { const c = Math.max(nix, this.icap * 2), a = new Uint32Array(c); if (this.I) a.set(this.I.subarray(0, this.ni)); this.I = a; this.icap = c; }
  }
  v(x, y, z, nx, ny, nz, amp, open) {
    const i = this.n; if (i >= this.cap) this.room(i + 1, 0);
    const P = this.P, N = this.N, j = i * 3;
    P[j] = x; P[j + 1] = y; P[j + 2] = z; N[j] = nx; N[j + 1] = ny; N[j + 2] = nz; this.L[i * 4] = amp; this.O[i] = open;
    // (how far it stands, on the flat, from the upright axis of the piece it belongs to, and that piece's own reach)
    this.C[i * 4] = x - this.ax; this.C[i * 4 + 1] = z - this.az; this.C[i * 4 + 2] = this.ar;
    return this.n++;
  }
  // a sheet of (nu + 1) by (nv + 1) vertices from base, turned so that its faces look the way its normals do
  sheet(nu, nv, base) {
    const P = this.P, N = this.N, i0 = this.ni; this.room(0, i0 + nu * nv * 6);
    const I = this.I; let w = i0;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I[w] = a; I[w + 1] = c; I[w + 2] = b; I[w + 3] = b; I[w + 4] = c; I[w + 5] = d; w += 6; }
    this.ni = w;
    let sum = 0;
    for (let t = i0; t < w; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      sum += (uy * vz - uz * vy) * N[a] + (uz * vx - ux * vz) * N[a + 1] + (ux * vy - uy * vx) * N[a + 2];
    }
    if (sum < 0) for (let t = i0; t < w; t += 3) { const q = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = q; }
  }
  // a surface of revolution about a vertical axis; prof = [[radius, y], ...] from the foot up, closed where the radius is 0.
  // o.open(angle, y) -> 0..1 sinks a hollow (a door, a belfry) into it; o.lean = [x, z] metres of lean per metre of height
  lathe(cx, cy, cz, prof, o = {}) {
    const amp = o.amp ?? 2, edge = (o.edge ?? amp * 0.5) * this.k, sx = o.sx ?? 1, sz = o.sz ?? 1, lx = o.lean ? o.lean[0] : 0, lz = o.lean ? o.lean[1] : 0, pts = [];
    for (let i = 0; i < prof.length - 1; i++) {
      const a = prof[i], b = prof[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / edge));
      for (let k = 0; k < n; k++) pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    pts.push(prof[prof.length - 1]);
    let rmax = 0; for (const p of pts) rmax = Math.max(rmax, p[0]);
    this.ar = rmax * Math.max(sx, sz);
    const nu = clamp(Math.ceil(TAU * rmax * Math.max(sx, sz) / edge), 8, 72), nv = pts.length - 1, base = this.n;
    for (let j = 0; j <= nv; j++) {
      const p = pts[j], a = pts[Math.max(0, j - 1)], b = pts[Math.min(nv, j + 1)];
      const tr = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tr, ty) || 1, nr = ty / tl, ny = -tr / tl;
      this.ax = cx + lx * p[1]; this.az = cz + lz * p[1];
      for (let i = 0; i <= nu; i++) {
        const th = i / nu * TAU, c = Math.cos(th), s = Math.sin(th), d = o.open ? o.open(th, p[1]) : 0, r = Math.max(0, p[0] - d * (o.recess ?? 1.5));
        this.v(cx + c * r * sx + lx * p[1], cy + p[1], cz + s * r * sz + lz * p[1], c * nr, ny, s * nr, amp * (1 - 0.5 * d), (o.shade ?? 1) * (1 - 0.68 * d));
      }
    }
    this.sheet(nu, nv, base);
  }
  ball(cx, cy, cz, rx, ry, rz, o = {}) {
    const prof = []; for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI; prof.push([rx * Math.sin(a), -ry * Math.cos(a)]); }
    prof[0][0] = 0; prof[10][0] = 0;
    this.lathe(cx, cy, cz, prof, { ...o, sz: rz / rx });
  }
  // a block with rounded edges, hx by hy by hz half sizes; o.taper narrows it in x towards the top (near 1: a gable);
  // o.yaw turns it about the vertical; o.open(axis, side, x, y, z) -> 0..1 sinks a hollow into a face; o.skip names faces
  // that are never seen ('y-': the underside)
  box(cx, cy, cz, hx, hy, hz, o = {}) {
    this.ax = cx; this.az = cz; this.ar = Math.min(hx, hz);
    const amp = o.amp ?? 2, edge = (o.edge ?? amp * 0.5) * this.k, rd = Math.max(0.05, Math.min(o.round ?? amp, hx, hy, hz)), yaw = o.yaw ?? 0, cs = Math.cos(yaw), sn = Math.sin(yaw), taper = o.taper ?? 0, H = [hx, hy, hz];
    for (let ax = 0; ax < 3; ax++) for (let sg = -1; sg <= 1; sg += 2) {
      if (o.skip && o.skip.includes('xyz'[ax] + (sg < 0 ? '-' : '+'))) continue;
      const u = (ax + 1) % 3, w = (ax + 2) % 3, nu = Math.max(1, Math.ceil(2 * H[u] / edge)), nw = Math.max(1, Math.ceil(2 * H[w] / edge)), base = this.n, p = [0, 0, 0];
      for (let j = 0; j <= nw; j++) for (let i = 0; i <= nu; i++) {
        p[ax] = sg * H[ax]; p[u] = (i / nu * 2 - 1) * H[u]; p[w] = (j / nw * 2 - 1) * H[w];
        const qx = clamp(p[0], -hx + rd, hx - rd), qy = clamp(p[1], -hy + rd, hy - rd), qz = clamp(p[2], -hz + rd, hz - rd);
        let nx = p[0] - qx, ny = p[1] - qy, nz = p[2] - qz; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        const d = o.open ? o.open(ax, sg, p[0], p[1], p[2]) : 0, rr = rd - d * (o.recess ?? 1.5);
        let x = qx + nx * rr, y = qy + ny * rr, z = qz + nz * rr;
        if (taper) { x *= 1 - taper * (y + hy) / (2 * hy); ny += Math.abs(nx) * taper * hx / (2 * hy); const l2 = Math.hypot(nx, ny, nz) || 1; nx /= l2; ny /= l2; nz /= l2; }
        this.v(cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs, nx * cs + nz * sn, ny, -nx * sn + nz * cs, amp * (1 - 0.5 * d), (o.shade ?? 1) * (1 - 0.68 * d));
      }
      this.sheet(nu, nw, base);
    }
  }
  // a round tube along points [[x, y, z], ...] with closed ends; o.ref is a direction the tube never runs along
  tube(pts, r, o = {}) {
    const amp = o.amp ?? 1.5, edge = (o.edge ?? amp * 0.5) * this.k, nu = clamp(Math.ceil(TAU * r / edge), 6, 40), ref = o.ref ?? [0, 0, 1], base = this.n, m = pts.length;
    for (let j = -1; j <= m; j++) {
      const k = clamp(j, 0, m - 1), a = pts[Math.max(0, k - 1)], b = pts[Math.min(m - 1, k + 1)], p = pts[k];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let ax = ref[1] * tz - ref[2] * ty, ay = ref[2] * tx - ref[0] * tz, az = ref[0] * ty - ref[1] * tx; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
      const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax, cap = j < 0 ? -1 : j === m ? 1 : 0;
      this.ax = p[0]; this.az = p[2]; this.ar = r;
      for (let i = 0; i <= nu; i++) {
        const th = i / nu * TAU, c = Math.cos(th), s = Math.sin(th), nx = ax * c + bx * s, ny = ay * c + by * s, nz = az * c + bz * s;
        if (cap) this.v(p[0] + tx * cap * r * 0.7, p[1] + ty * cap * r * 0.7, p[2] + tz * cap * r * 0.7, tx * cap, ty * cap, tz * cap, amp, o.shade ?? 1);
        else this.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, amp, o.shade ?? 1);
      }
    }
    this.sheet(nu, m + 1, base);
  }
  // everything built since the last call is one building: turned about the vertical, set down, numbered, its heights
  // written; dome 1: it sinks under a rounded head (the melt's shape); firm 1: it keeps a firm outline (the near rank)
  place(x, y, z, yaw, index, top, scale = 1, dome = 0, firm = 0) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw), P = this.P, N = this.N, L = this.L, C = this.C;
    for (let i = this.from; i < this.n; i++) {
      const px = P[i * 3] * scale, py = P[i * 3 + 1] * scale, pz = P[i * 3 + 2] * scale, nx = N[i * 3], nz = N[i * 3 + 2];
      P[i * 3] = x + px * cs + pz * sn; P[i * 3 + 1] = y + py; P[i * 3 + 2] = z - px * sn + pz * cs;
      N[i * 3] = nx * cs + nz * sn; N[i * 3 + 2] = -nx * sn + nz * cs;
      L[i * 4] *= scale; L[i * 4 + 1] = index; L[i * 4 + 2] = clamp(py / (top * scale), 0, 1); L[i * 4 + 3] = top * scale;
      const ox = C[i * 4] * scale, oz = C[i * 4 + 1] * scale; C[i * 4] = ox * cs + oz * sn; C[i * 4 + 1] = -ox * sn + oz * cs; C[i * 4 + 2] = dome ? Math.max(C[i * 4 + 2] * scale, 0.6) : 0; C[i * 4 + 3] = firm;
    }
    this.from = this.n;
  }
  geometry(sphere) {
    const g = new THREE.BufferGeometry();
    const n = this.n, at = (a, w) => new THREE.BufferAttribute(a.slice(0, n * w), w);
    g.setAttribute('position', at(this.P, 3)); g.setAttribute('normal', at(this.N, 3)); g.setAttribute('aL', at(this.L, 4)); g.setAttribute('aO', at(this.O, 1)); g.setAttribute('aC', at(this.C, 4));
    g.setIndex(new THREE.BufferAttribute(this.I.slice(0, this.ni), 1)); if (sphere) g.boundingSphere = sphere; else g.computeBoundingSphere();
    return g;
  }
}

// a tower's outline: a plinth, storeys parted by cornices, a drum, a dome, a lantern and its point (R at the foot, H in all)
function towerProfile(R, H, storeys) {
  const y0 = H * 0.045, shaft = H * 0.66, c = Math.max(1, R * 0.14), pr = [[0, 0], [R * 1.14, 0], [R * 1.14, H * 0.03], [R, y0]];
  let r = R, y = y0;
  for (let k = 1; k <= storeys; k++) {
    const y1 = lerp(y0, shaft, k / storeys), r1 = R * (1 - 0.2 * k / storeys);
    pr.push([lerp(r, r1, 0.8), y1 - c * 1.6], [r * 1.02 + c, y1 - c * 0.8], [r * 1.02 + c, y1], [r1, y1 + c * 0.9]);
    r = r1; y = y1 + c * 0.9;
  }
  const rd = r * 0.8, yd = y + H * 0.1, yb = yd + R * 0.22, dome = (H - yb) * 0.66;
  pr.push([rd, y + R * 0.25], [rd, yd], [rd * 1.12, yd + R * 0.1], [rd * 1.12, yb]);
  for (let k = 1; k <= 5; k++) { const a = k / 6 * Math.PI / 2; pr.push([Math.max(rd * 0.36, rd * Math.cos(a)), yb + dome * Math.sin(a)]); }
  const yl = yb + dome * Math.sin(5 / 12 * Math.PI);
  pr.push([rd * 0.36, lerp(yl, H, 0.6)], [rd * 0.2, lerp(yl, H, 0.85)], [0, H]);
  return pr;
}
// a drum, its cornice, a dome and a lantern: R the drum's radius, top the height of the point
function domeProfile(R, drum, dome, top) {
  const pr = [[0, 0], [R, 0], [R, drum], [R * 1.1, drum + R * 0.08], [R * 1.1, drum + R * 0.2], [R * 0.97, drum + R * 0.28]], yb = drum + R * 0.28;
  for (let k = 1; k <= 6; k++) { const a = k / 7 * Math.PI / 2; pr.push([Math.max(R * 0.2, R * 0.97 * Math.cos(a)), yb + dome * Math.sin(a)]); }
  const yl = yb + dome * Math.sin(6 / 14 * Math.PI);
  pr.push([R * 0.2, lerp(yl, top, 0.6)], [R * 0.12, lerp(yl, top, 0.85)], [0, top]);
  return pr;
}
// a column of cloud: a spread foot, a shaft that bulges and narrows by its own phase, a heaped head (no ruled line on it)
// (firm: a shaft of the near rank, which tapers a tenth from foot to neck and wavers a third as much)
const columnProfile = (r, h, ph = 0, firm = 0) => {
  const pr = [[0, 0], [r * 1.3, 0], [r * 1.2, h * 0.04]], w = firm ? 0.3 : 1;
  for (let k = 1; k <= 9; k++) pr.push([r * ((firm ? 0.98 - 0.012 * k : 0.88) + w * (0.16 * Math.sin(k * 1.9 + ph) + 0.07 * Math.sin(k * 4.3 + ph * 2))), h * (0.04 + 0.085 * k)]);
  pr.push([r * 1.28, h * 0.88], [r * 1.42, h * 0.94], [r * 1.05, h * 0.985], [0, h]);
  return pr;
};
// one arched hollow in every bay of a wall: metres from the bay's middle line, sill and head
const bay = (x, y, pitch, wide, y0, y1) => {
  const a = Math.abs(((x / pitch % 1) + 1.5) % 1 - 0.5) * pitch, top = y1 - Math.min(1, a / wide) * Math.min(1, a / wide) * wide;
  return smoothstep(wide + 0.5, wide - 0.5, a) * smoothstep(y0 - 0.5, y0 + 0.5, y) * (1 - smoothstep(top - 0.5, top + 0.5, y));
};
// one tall arched hollow on each of n sides of a tower's top storey (a belfry), wide metres half across
const belfry = (H, storeys, n, wide) => (th, y) => {
  const y0 = H * 0.045, sh = (H * 0.66 - y0) / storeys, y1 = y - y0 - (storeys - 1) * sh;
  return y1 < 0 || y1 > sh ? 0 : bay(th / TAU * n * 10, y1, 10, wide, sh * 0.16, sh * 0.82);
};

// The buildings of the pageant, each in its own metres with its foot at y = 0 and its front to +Z. Each is a generator:
// it yields between its pieces (so that the build can breathe) and returns its height.
export const PAGEANT = {
  // twin towers: storeys, cornices, domes and lanterns under caps of heaped cloud, a gate between them
  *towers(b, h1, h2) {
    for (const [x, H] of [[-19, h1], [19, h2]]) {
      b.lathe(x, 0, 0, towerProfile(11, H, 3), { amp: 2.8, edge: 1.7, open: belfry(H, 3, 4, 3.4), recess: 4.5 });
      yield;
      b.ball(x, H - 7, 0, 10, 6, 10, { amp: 3.6, edge: 1.9 });
      b.ball(x + 6, H - 12, 3, 6.5, 4, 6.5, { amp: 2.6, edge: 1.7 }); b.ball(x - 5, H - 13, -4, 6, 3.6, 6, { amp: 2.6, edge: 1.7 });
      yield;
    }
    b.box(0, 13, 0, 12, 13, 7, { amp: 2, edge: 1.8, skip: 'y-', open: (ax, sg, x, y) => ax === 2 ? bay(x, y, 60, 4.5, -12, 4) : 0, recess: 5 });
    b.box(0, 27.5, 0, 13.5, 2.2, 8.5, { amp: 1.8, edge: 2 });
    return Math.max(h1, h2);
  },
  // a palace 150 m long: terrace, the long front with two rows of windows, attic, a middle pavilion under the great dome, two end pavilions with lesser domes, colonnades between
  *palace(b) {
    const rows = (ax, sg, x, y) => ax === 2 ? bay(x, y, 21.4, 4.6, -11, 8) : 0;
    b.box(0, 1.5, 3, 82, 1.5, 22, { amp: 2, edge: 3.6, skip: 'y-' });
    yield;
    b.box(0, 16, 0, 75, 13, 12, { amp: 2.4, edge: 2, skip: 'y-', open: rows, recess: 4.5 });
    yield;
    b.box(0, 30.5, 0, 76.5, 2.2, 13.5, { amp: 2, edge: 2.6 });
    b.box(0, 35, 0, 58, 3.5, 9.5, { amp: 2.2, edge: 2.4, skip: 'y-' });
    yield;
    b.box(0, 21, 5, 17, 18, 16, { amp: 1.8, edge: 1.7, skip: 'y-', open: (ax, sg, x, y) => ax === 2 && sg > 0 ? bay(x, y, 80, 5, -16, 4) : 0, recess: 3 });
    yield;
    b.box(0, 44, 5, 18.5, 5, 17, { amp: 1.4, edge: 1.8, taper: 0.9, skip: 'y-' });
    yield;
    b.lathe(0, 39, -2, domeProfile(13, 12, 17, 36), { amp: 2, edge: 1.6, open: (th, y) => bay(th / TAU * 120, y, 10, 1.8, 2.5, 9.5), recess: 1.6 });
    for (const sx of [-1, 1]) {
      yield;
      b.box(sx * 63, 19, 3, 12, 16, 15, { amp: 2.4, edge: 2, skip: 'y-', open: (ax, sg, x, y) => ax === 2 ? bay(x, y, 60, 4.2, -14, 6) : 0, recess: 4.5 });
      b.lathe(sx * 63, 35, 3, domeProfile(8.5, 4, 9.5, 19), { amp: 1.6, edge: 1.6 });
      yield;
      for (let k = 0; k < 3; k++) b.lathe(sx * (26 + k * 11), 3, 17.5, columnProfile(2.7, 24, k * 2.3 + sx, 1), { amp: 1.1, edge: 1.7, lean: [sx * 0.03 * (k - 1), 0.02] });
      yield;
    }
    return 75;
  },
  // a temple 80 m wide: three steps, 24 columns 30 m tall round a closed dark room, a beam, and a gabled roof
  *temple(b) {
    for (let k = 0; k < 3; k++) b.box(0, 0.85 + k * 1.7, 0, 44.5 - k * 1.6, 0.85, 30.5 - k * 1.6, { amp: 0.7, edge: 3.4, round: 0.6, skip: 'y-' });
    yield;
    b.box(0, 20, 0, 27, 15, 15, { amp: 1.2, edge: 2.6, shade: 0.34, skip: 'y-y+', open: (ax, sg, x, y) => ax === 2 ? bay(x, y, 80, 4, -15, 6) : 0, recess: 2 });
    const col = (x, z) => b.lathe(x, 5, z, columnProfile(3, 30, x * 0.31 + z, 1), { amp: 1.2, edge: 1.9, lean: [Math.sin(x * 0.7 + z) * 0.025, Math.cos(x * 0.4 - z) * 0.025] });
    yield;
    for (let i = 0; i < 8; i++) { col(-36.4 + i * 10.4, 22); col(-36.4 + i * 10.4, -22); if (i % 2) yield; }
    yield;
    for (let j = 1; j <= 4; j++) { col(-36.4, 22 - j * 8.8); col(36.4, 22 - j * 8.8); if (j === 2) yield; }
    yield;
    b.box(0, 39, 0, 40.8, 4, 26.4, { amp: 1.4, edge: 2.1 });
    yield;
    b.box(0, 54.5, 0, 42, 13.5, 27.2, { amp: 1.7, edge: 2, taper: 0.96, skip: 'y-', open: (ax, sg, x, y) => ax === 2 ? smoothstep(-9.5, -8, y) * (1 - smoothstep(4, 7, y)) * 0.6 : 0, recess: 1.4 });
    return 68;
  },
  // three slender towers
  *slender(b, hs) {
    for (let i = 0; i < hs.length; i++) {
      const H = hs[i], x = (i - 1) * 24, z = i === 1 ? 5 : -3;
      b.lathe(x, 0, z, towerProfile(5.2, H, 4), { amp: 1.7, edge: 1.9, open: belfry(H, 4, 4, 2.2), recess: 2.6, lean: [(i - 1) * 0.02, 0.012] });
      b.ball(x, H - 4, z, 5.5, 3.4, 5.5, { amp: 2.2, edge: 1.5 });
      yield;
    }
    return Math.max(...hs);
  },
  // the last arch, 54 m wide and 60 m tall: two piers with columns before them, a vault of three ribs over an opening
  // 26 m wide and 43 m tall, and an attic. The billows are small on the faces that look into the opening.
  *arch(b) {
    for (const sx of [-1, 1]) {
      b.box(sx * 20, 23, 0, 7, 23, 8, { amp: 1.1, edge: 1.5, skip: 'y-y+' });
      yield;
      for (const sz of [-1, 1]) for (const dx of [14.6, 25.4]) b.lathe(sx * dx, 3, sz * 9.4, columnProfile(1.7, 34, dx + sz), { amp: 0.6, edge: 1.5 });
      b.box(sx * 20, 1.5, 0, 9, 1.5, 11.5, { amp: 0.7, edge: 2.2, skip: 'y-' });
      yield;
    }
    for (const z of [-5.2, 0, 5.2]) {
      const pts = []; for (let k = 0; k <= 26; k++) { const a = k / 26 * Math.PI; pts.push([16.5 * Math.cos(a), 30 + 16.5 * Math.sin(a), z]); }
      b.tube(pts, 3.5, { amp: 0.8, edge: 1.3 });
      yield;
    }
    yield;
    b.box(0, 52, 0, 27, 8, 8.5, { amp: 1.5, edge: 1.7, open: (ax, sg, x, y) => ax === 2 ? smoothstep(22, 20, Math.abs(x)) * smoothstep(-5, -3.5, y) * (1 - smoothstep(3.5, 5, y)) * 0.5 : 0, recess: 1 });
    yield;
    b.box(0, 43.2, 0, 28.5, 1.2, 10.2, { amp: 0.8, edge: 2.2 });
    b.box(0, 60.2, 0, 28.8, 1.3, 10, { amp: 1.2, edge: 2.2 });
    return 61.5;
  },
  // one free column of the colonnade, 30 m tall and 6 m thick: ph its own bulging, lean its own lean
  column(b, x, z, ph, lean) {
    b.lathe(x, 0, z, columnProfile(3, 30, ph, 1), { amp: 1.3, edge: 1.5, lean });
    b.ball(x + lean[0] * 30, 30.5, z + lean[1] * 30, 5, 2.6, 5, { amp: 1.6, edge: 1.7 });
    return 33;
  },
  // a cumulus head of radius R, its bellying base at y = y0: a body heaped to 0.46 R k over it, and lobes round it,
  // each [bearing, how far out (of R), size (of R)]; k flattens it (the floor of mist is a low head). y0 keeps the
  // head clear of the fraying that a building's foot has.
  heap(b, x, z, R, lobes, k = 1, y0 = 0) {
    const o = { amp: R * 0.1, edge: R * 0.24, shade: 0.9 }, h = R * k;
    b.lathe(x, y0, z, [[0, 0.05 * h], [0.4 * R, 0], [0.78 * R, 0.05 * h], [R, 0.17 * h], [0.92 * R, 0.29 * h], [0.6 * R, 0.4 * h], [0, 0.46 * h]], o);
    for (const [an, d, sz] of lobes) b.ball(x + Math.cos(an) * d * R, y0 + 0.24 * h, z + Math.sin(an) * d * R, sz * R * 0.5, sz * h * 0.3, sz * R * 0.5, o);
  },
  // the great rank's buildings, coarse (they stand 350 m and more tall when set down): a dome on a drum, a pair of
  // towers, a gabled roof on six columns, one tower. GREAT gives each kind's height and its reach from its middle.
  great(b, kind) {
    if (kind === 0) {
      b.box(0, 13, 0, 27, 13, 27, { amp: 2.8, edge: 6, skip: 'y-' });
      b.lathe(0, 22, 0, domeProfile(23, 34, 26, 78), { amp: 2.8, edge: 4.8, open: (th, y) => bay(th / TAU * 60, y, 10, 2.6, 6, 28), recess: 4 });
    } else if (kind === 1) {
      b.lathe(-15, 0, 0, towerProfile(9, 96, 3), { amp: 2.6, edge: 4.6 }); b.lathe(15, 0, 0, towerProfile(9, 78, 3), { amp: 2.6, edge: 4.6 });
      b.box(0, 14, 0, 26, 14, 9, { amp: 2.2, edge: 5, skip: 'y-', open: (ax, sg, x, y) => ax === 2 ? bay(x, y, 60, 5, -13, 6) : 0, recess: 4 });
    } else if (kind === 2) {
      b.box(0, 4, 0, 40, 4, 24, { amp: 2, edge: 6, skip: 'y-' });
      b.box(0, 30, 0, 30, 22, 15, { amp: 2.2, edge: 6, shade: 0.4, skip: 'y-y+' });
      for (let i = 0; i < 6; i++) b.lathe(-33 + i * 13.2, 8, 20, columnProfile(4.2, 44, i * 1.7), { amp: 1.3, edge: 4.6, lean: [Math.sin(i * 2.1) * 0.03, 0.02] });
      b.box(0, 68, 0, 39, 16, 24, { amp: 2.4, edge: 5, taper: 0.95, skip: 'y-' });
    } else {
      b.lathe(0, 0, 0, towerProfile(13, 120, 4), { amp: 3, edge: 5, open: belfry(120, 4, 4, 4), recess: 5 });
      b.ball(0, 112, 0, 13, 8, 13, { amp: 4, edge: 4.5 });
    }
    return GREAT[kind].H;
  },
  // the great globe, 250 m across, its foot at y = 0: bands sunk into it along its latitudes, broken along its turning
  globe(b) {
    b.ball(0, 125, 0, 125, 125, 125, { amp: 11, edge: 7.2, recess: 7, open: (th, y) => smoothstep(0.1, 0.5, Math.sin(y / 125 * 7.4)) * (0.45 + 0.55 * smoothstep(-0.3, 0.3, Math.sin(th * 3 + y / 125 * 2.2))) });
    return 250;
  },
};

// (hx, hz: half its footprint along its own x and z)
export const GREAT = [{ H: 100, reach: 39, hx: 27, hz: 27 }, { H: 96, reach: 30, hx: 26, hz: 9.5 }, { H: 84, reach: 47, hx: 40, hz: 24 }, { H: 120, reach: 17, hx: 13, hz: 13 }];

// ---------------------------------------------------------------- the cloud's own shader
// Warm light on the faces to the sun, blue-grey shade at half of it, hollows and undersides at a third, thin gold rims,
// a ragged outline, a foot that frays into mist, and per building a front (0 foot .. 1 top).
// THE MELT'S SHAPE, for every building that sinks and heaps (aC.z): what stands above the front is gathered into a
// ROUNDED HEAD upon it. Each piece of the building (a shaft, a wing, a dome) closes over its own upright axis: with R
// the piece's own reach (a shaft's widest radius, a wing's lesser half width), a corner that stood o metres above the
// front is drawn in toward the axis by the cosine and lifted 0.8 R by the sine of a quarter turn run through in 2.4 R
// of o (7 m at the least; all that stood higher lies at the crown), billows half as large again and leans a little to
// the lee. So at every height of the front the remnant ends in a billowing head as wide as itself, never in a point
// or a torn edge. (The arch and the globe keep the older law: above their breathing fronts
// the cloud boils, lifts, goes to the lee and is eaten away.)
// THE NEAR RANK (aC.w) keeps a firm outline: its billows are under half the size, its rim is cut clean, and it is
// lit in two tones by the sun's bearing: warm on the faces to the sun, cool on the faces from it.
export const CLOUD_BUILDINGS = 18;
const CLOUD_NOISE = /* glsl */`
  uniform sampler2D uNoise; uniform float uTime;
  // a noise of the place itself (the same on every lump that passes through a point): three flat lookups, each sheared by the third axis
  float cn(vec3 q) {
    return texture2D(uNoise, q.xz * .125 + q.y * vec2(.046, .014)).r * .4 + texture2D(uNoise, q.xy * .0625 + q.z * vec2(.014, .026) + .37).g * .35
      + texture2D(uNoise, q.zy * .0625 + q.x * vec2(.019, .011) + .71).g * .25;
  }`;
const CLOUD_VERT = CLOUD_NOISE + /* glsl */`
  attribute vec4 aL, aC; attribute float aO;
  uniform float uFront[${CLOUD_BUILDINGS}]; uniform vec3 uWindDir;
  varying vec3 vW, vN, vP; varying vec4 vK; varying float vM, vF;
  // metres by which the cloud swells at a place: broad lobes, billows about three times their height across, smaller ones on them, slowly crawling
  float billow(vec3 p, float amp) {
    vec3 q = p / max(amp * 3.4, .05) + uTime * vec3(.026, .011, .019);
    return amp * ((cn(q * .31 + 2.1) - .5) * 2.4 + (cn(q) - .47) * 3.4 + (cn(q * 2.7 + 5.3) - .5) * 1.1);
  }
  void main() {
    float amp = aL.x, span = aL.w; int bi = int(aL.y + .5);
    vec3 n = normalize(normal), p = position;
    // the melt: how far this place stands above its building's front (in building heights), the front a little uneven
    float front = uFront[bi], over = max(aL.z + (cn(p * .021) - .5) * .1 - front, 0.), mv = smoothstep(0., .1, over);
    // (the rounded head)
    float dome = step(.3, aC.z), rh = max(aC.z, .6), rr = max(length(aC.xy), .05), hs = clamp(over * span / max(2.4 * rh, 7.), 0., 1.), ca = cos(hs * 1.5708), sa = sin(hs * 1.5708);
    p.xz -= aC.xy * ((1. - ca) * dome);
    p.y += (rh * .8 * sa - over * span) * dome;
    n = normalize(mix(n, vec3(aC.x / rr * ca, sa + 1e-3, aC.y / rr * ca), dome * mv));
    float boil = amp * (1. + 1.3 * mv) * (1. - .55 * aC.w);
    vec3 t1 = normalize(cross(n, abs(n.y) > .9 ? vec3(1., 0., 0.) : vec3(0., 1., 0.))), t2 = cross(n, t1);
    float e = max(amp * 1.1, .05), d0 = billow(p, boil), d1 = billow(p + t1 * e, boil), d2 = billow(p + t2 * e, boil);
    vec3 nn = normalize(n - (t1 * (d1 - d0) + t2 * (d2 - d0)) * (.8 / e));
    p += n * d0;
    vec4 wp = modelMatrix * vec4(p, 1.);
    // what stands above the front lifts, goes to the lee and thins away (the taller the building, the further)
    wp.xyz += (uWindDir + vec3(0., .38, 0.)) * mix(max(16., span * .1) * mv * mv, min(rh, 14.) * .3 * hs, dome);
    vN = normalize(mat3(modelMatrix) * nn); vW = wp.xyz; vP = position;
    float gone = 1. - smoothstep(-.12, .04, front);
    vK = vec4(max(mv * (1. - dome), gone), aO, aL.z * span, clamp(d0 / max(boil, .05) * .4 + .5, 0., 1.));
    vM = mv; vF = aC.w;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
  }`;
// (veil is the world's own sky: its skyAt and stormVeil, so that the storm hides this cloud exactly as it hides the sky)
const cloudFrag = (veil) => veil + /* glsl */`
  uniform vec3 uLit, uShade, uHollow, uGold, uRing, uHaze; uniform vec4 uRingAt;
  varying vec3 vW, vN, vP; varying vec4 vK; varying float vM, vF;
  void main() {
    vec3 N0 = normalize(vN), toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3);
    // fine fluff: three flat lookups weighted by the facing, at two sizes
    vec3 w = abs(N0); w /= max(w.x + w.y + w.z, 1.);
    vec3 f = texture2D(uNoise, vP.zy * .11).rgb * w.x + texture2D(uNoise, vP.xz * .11).rgb * w.y + texture2D(uNoise, vP.xy * .11).rgb * w.z;
    vec3 g = texture2D(uNoise, vP.zy * .027 + .3).rgb * w.x + texture2D(uNoise, vP.xz * .027 + .3).rgb * w.y + texture2D(uNoise, vP.xy * .027 + .3).rgb * w.z;
    float eat = g.r * .62 + f.g * .38;
    // eaten away above the melting front; a ragged outline; a foot that frays into the mist
    if (eat < vK.x * 1.2 - .06) discard;
    if (dot(N0, V) < (eat - .36) * .55 * (1. - .7 * vF)) discard;
    if (vK.z < (eat - .22) * 14.) discard;
    vec3 N = normalize(N0 + (g.gbr - .5) * (.4 - .28 * vF));
    float nv = clamp(dot(N, V), 0., 1.), ndl = dot(N, uSunDir), lit = smoothstep(mix(-.25, -.14, vF), mix(.5, .34, vF), ndl);
    // the creases between billows lie in shade, their crowns in the light
    float crease = smoothstep(.2, .6, vK.w) * (.55 + .45 * smoothstep(.3, .62, g.r));
    vec3 col = mix(uShade * mix(vec3(1.), vec3(.9, .95, 1.07), vF), uLit * mix(vec3(1.), vec3(1.06, 1., .9), vF), lit * mix(.42 + .58 * crease, .7 + .3 * crease, vF));
    col += uGold * (.1 * lit * smoothstep(.55, .9, vK.w));
    // undersides lie in the deepest shade, and so do hollows: doorways, between columns, under cornices
    float belly = 1. - smoothstep(-.75, .1, N.y);
    col = mix(col, uHollow * (.75 + .5 * crease), belly * .8);
    col = mix(uHollow, col, clamp(vK.y * (.75 + .25 * crease), 0., 1.));
    // a thin gold rim towards the sun; the air between pales the far ones a little
    float rim = 1. - nv, r3 = rim * rim * rim, vs = clamp(dot(-V, uSunDir), 0., 1.);
    col = mix(col, uGold, r3 * (.25 + .6 * vs * vs) * (.4 + .6 * lit));
    col = mix(col, uHaze, (1. - exp(-dist * .0005)) * .7);
    // the melting front glows pale gold
    col += uGold * (smoothstep(0., .5, vM) * .3);
    // the ring's light on the last arch
    vec3 L = uRingAt.xyz - vW; float d2 = dot(L, L);
    col += uRing * ((clamp(dot(N, L * inversesqrt(max(d2, 1e-3))), 0., 1.) * .8 + .2) * uRingAt.w / (1. + d2 / 150.));
    // from under the storm: what its skirts hide is hidden, and its rain veils the rest
    float hide = stormVeil(-V, dist);
    if (hide > .002) col = mix(col, skyAt(-V, 0.), hide);
    gl_FragColor = vec4(col, 1.);
  }`;
// o: wind (unit Vector3 the wisps go to), lit, shade, hollow, gold, ring, haze (colours), ringAt (Vector4: place and strength),
// sky { glsl, uniforms }: the world's sky (it declares uNoise and uSunDir and brings skyAt and stormVeil)
export function makeCloudMaterial(o) {
  const uniforms = {
    uTime: { value: 0 }, uFront: { value: new Array(CLOUD_BUILDINGS).fill(1.3) }, uWindDir: { value: o.wind },
    uLit: { value: o.lit }, uShade: { value: o.shade }, uHollow: { value: o.hollow }, uGold: { value: o.gold }, uRing: { value: o.ring }, uRingAt: { value: o.ringAt }, uHaze: { value: o.haze },
    ...o.sky.uniforms,
  };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: CLOUD_VERT, fragmentShader: cloudFrag(o.sky.glsl) });
}
