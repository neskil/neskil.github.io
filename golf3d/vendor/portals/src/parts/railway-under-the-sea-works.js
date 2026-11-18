// railway-under-the-sea: the WORKS OF THE FLATS (film worlds D; one builder's part; design section 7c).
// What stands here, all of it timber standing IN the still sea (every pile, stake and leg runs plumb or raked
// through y = 0 down to y = -0.6; no level face within 10 cm of the water):
//   - the STAKE GROYNES (the real Lahnungen): low double rows of hand-driven stakes packed with brushwood, in
//     great rectangles either side of the line. The stakes are instanced (noMirror); the brushwood is one merged
//     mesh (noMirror). A plumb ribbon along each row's middle carries the same double row painted and alpha cut:
//     within 30 m of the route it is for the mirror only (mirrorOnly: the cheap ragged dark strip of the design);
//     further off it is seen too, behind the thinning real stakes, and is mirrored like any other mesh.
//   - a line of WITHIES (birch saplings) marking a channel across the line; the stake rows are broken where the
//     channel runs through them;
//   - two timber REFUGE BEACONS (one near, west; one far, east);
//   - the timber HALT on piles with its roofed shelter, two lanterns and a tide gauge (blocks only, no numerals);
//   - a BOARDWALK on piles from the back of the halt to three STILT HOUSES, each reached by a spur and a stair.
// TYPED DESIGN DECISIONS (true on every seed, by places of the world, never by the lens):
//   - stakes are thinned EVENLY by their level distance from the ROUTE (design 7c: at most 5,000): all of them
//     within 30 m, none beyond about 56 m, where the painted ribbon carries the row;
//   - the halt's shelter stands at the end of the halt the line reaches first (the railcar stands at the far end);
//   - windows and lanterns are emissive surfaces of ONE material; setNight(n) changes its emissive strength only.
// All places come from the law file (beside, lineHeading, HALT, RING). Draws only from named seeded streams.
import * as THREE from 'three';
import { HALT, LEVEL, RING, BEACON, channelZ, beside, lineHeading } from './railway-under-the-sea-line.js';

const DEEP = -0.6;                                       // every foot goes down to here (under the bed at -0.5)
const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };   // linear working colour
const tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---- a small geometry accumulator: position, normal, colour, uv; a current frame (origin + turn about Y).
// The wood texture is 1.6 m long (u, along the grain) by 0.8 m (v, across: four planks of 0.2 m with a dark
// seam between). A beam maps its faces inside ONE plank (no seam); a planked face maps v in metres (seams show).
const UL = 1 / 1.6, VL = 1 / 0.8;
class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.U = []; this.I = []; this.n = 0; this.frame(0, 0, 0, 0); this.pl = 0; }
  frame(ox, oz, yaw = 0, oy = 0) { this.ox = ox; this.oz = oz; this.oy = oy; this.c = Math.cos(yaw); this.s = Math.sin(yaw); return this; }
  v(x, y, z, nx, ny, nz, col, u, w) {
    const c = this.c, s = this.s;
    this.P.push(this.ox + x * c + z * s, this.oy + y, this.oz - x * s + z * c);
    this.N.push(nx * c + nz * s, ny, -nx * s + nz * c);
    this.C.push(col[0], col[1], col[2]); this.U.push(u, w);
    return this.n++;
  }
  // a flat face from four corners given counter-clockwise as seen from its front
  face(p0, p1, p2, p3, col, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], bx = p3[0] - p0[0], by = p3[1] - p0[1], bz = p3[2] - p0[2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const a = this.v(p0[0], p0[1], p0[2], nx, ny, nz, col, u0, v0), b = this.v(p1[0], p1[1], p1[2], nx, ny, nz, col, u1, v0);
    const c = this.v(p2[0], p2[1], p2[2], nx, ny, nz, col, u1, v1), d = this.v(p3[0], p3[1], p3[2], nx, ny, nz, col, u0, v1);
    this.I.push(a, b, c, a, c, d);
  }
  // a sawn timber from A to B: w across (level, square to it), h the other way; a plumb one has w along the
  // frame's x and h along its z. Grain runs along it; the two ends show darker end grain.
  beam(ax, ay, az, bx, by, bz, w, h, col, ends = true) {
    let dx = bx - ax, dy = by - ay, dz = bz - az; const L = Math.hypot(dx, dy, dz) || 1e-6; dx /= L; dy /= L; dz /= L;
    const hl = Math.hypot(dx, dz); let sx = 1, sz = 0; if (hl > 1e-4) { sx = -dz / hl; sz = dx / hl; }
    const tx = -sz * dy, ty = sz * dx - sx * dz, tz = sx * dy;                       // t = s x d (s is level)
    const pl = (this.pl = (this.pl + 1) % 4) * 0.25 + 0.03, u0 = (this.n % 7) * 0.13, u1 = u0 + L * UL;
    const F = [[tx, ty, tz, sx, 0, sz, h / 2, w / 2], [-tx, -ty, -tz, -sx, 0, -sz, h / 2, w / 2], [sx, 0, sz, -tx, -ty, -tz, w / 2, h / 2], [-sx, 0, -sz, tx, ty, tz, w / 2, h / 2]];
    for (const [nx, ny, nz, mx, my, mz, hn, hm] of F) {
      const ox = nx * hn, oy = ny * hn, oz = nz * hn, qx = mx * hm, qy = my * hm, qz = mz * hm, v1 = pl + Math.min(2 * hm, 0.15) * VL;
      const a = this.v(ax + ox + qx, ay + oy + qy, az + oz + qz, nx, ny, nz, col, u0, pl), b = this.v(bx + ox + qx, by + oy + qy, bz + oz + qz, nx, ny, nz, col, u1, pl);
      const c = this.v(bx + ox - qx, by + oy - qy, bz + oz - qz, nx, ny, nz, col, u1, v1), d = this.v(ax + ox - qx, ay + oy - qy, az + oz - qz, nx, ny, nz, col, u0, v1);
      this.I.push(a, b, c, a, c, d);
    }
    if (!ends) return;
    const e = tint(col, 0.72), hw = w / 2, hh = h / 2;
    for (const k of [1, -1]) {                                                      // k = 1: the B end (normal +d)
      const px = k > 0 ? bx : ax, py = k > 0 ? by : ay, pz = k > 0 ? bz : az, a1x = k > 0 ? tx : sx, a1y = k > 0 ? ty : 0, a1z = k > 0 ? tz : sz;
      const b1x = k > 0 ? sx : tx, b1y = k > 0 ? 0 : ty, b1z = k > 0 ? sz : tz, ha = k > 0 ? hh : hw, hb = k > 0 ? hw : hh;
      const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => this.v(px + a1x * ha * i + b1x * hb * j, py + a1y * ha * i + b1y * hb * j, pz + a1z * ha * i + b1z * hb * j, dx * k, dy * k, dz * k, e, 0.4 + 0.05 * i, pl + 0.05 + 0.04 * j));
      this.I.push(q[0], q[1], q[2], q[0], q[2], q[3]);
    }
  }
  // a block square to the frame; the grain runs along its longest side
  box(cx, cy, cz, sx, sy, sz, col, ends = true) {
    if (sx >= sy && sx >= sz) this.beam(cx - sx / 2, cy, cz, cx + sx / 2, cy, cz, sz, sy, col, ends);
    else if (sz >= sy) this.beam(cx, cy, cz - sz / 2, cx, cy, cz + sz / 2, sx, sy, col, ends);
    else this.beam(cx, cy - sy / 2, cz, cx, cy + sy / 2, cz, sx, sz, col, ends);
  }
  // a round timber from A to B through rings at shares ts of its length (radius r0 to r1), each ring its colour
  round(ax, ay, az, bx, by, bz, r0, r1, sides, ts, cols, cap = true) {
    let dx = bx - ax, dy = by - ay, dz = bz - az; const L = Math.hypot(dx, dy, dz) || 1e-6; dx /= L; dy /= L; dz /= L;
    let e1x = 1 - dx * dx, e1y = -dx * dy, e1z = -dx * dz; const l1 = Math.hypot(e1x, e1y, e1z) || 1; e1x /= l1; e1y /= l1; e1z /= l1;
    const e2x = dy * e1z - dz * e1y, e2y = dz * e1x - dx * e1z, e2z = dx * e1y - dy * e1x;   // e2 = d x e1
    const pl = (this.pl = (this.pl + 1) % 4) * 0.25 + 0.03, ph = (this.n % 5) * 0.4, base = this.n;
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i], r = r0 + (r1 - r0) * t, cx = ax + dx * L * t, cy = ay + dy * L * t, cz = az + dz * L * t;
      for (let k = 0; k <= sides; k++) {
        const a = ph + (k / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), nx = ca * e1x + sa * e2x, ny = ca * e1y + sa * e2y, nz = ca * e1z + sa * e2z;
        this.v(cx + nx * r, cy + ny * r, cz + nz * r, nx, ny, nz, cols[i], L * t * UL, pl + (k / sides) * 0.19);
      }
    }
    const W = sides + 1;
    for (let i = 0; i < ts.length - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * W + k, b = a + 1, c = b + W, d = a + W; this.I.push(a, b, c, a, c, d); }
    if (!cap) return;
    const e = tint(cols[cols.length - 1], 1.18), c0 = this.v(bx, by, bz, dx, dy, dz, e, 0.5, pl + 0.1), top = this.n;   // the sawn end
    for (let k = 0; k <= sides; k++) {
      const a = ph + (k / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      this.v(bx + (ca * e1x + sa * e2x) * r1, by + (ca * e1y + sa * e2y) * r1, bz + (ca * e1z + sa * e2z) * r1, dx, dy, dz, e, 0.5 + ca * 0.05, pl + 0.1 + sa * 0.05);
    }
    for (let k = 0; k < sides; k++) this.I.push(c0, top + k, top + k + 1);
  }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setIndex(this.I); g.computeBoundingSphere();
    return g;
  }
}
// ---- the self-made textures (freed in dispose): weathered planks, a shingle roof, and the four lamp tones
function finish(t, renderer, srgb) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  let an = 1; try { an = renderer.capabilities.getMaxAnisotropy(); } catch (e) { an = 1; }
  t.anisotropy = Math.max(1, Math.min(8, an || 1)); t.needsUpdate = true;
  return t;
}
function woodTexture(rng, renderer) {
  const S = 256, d = new Uint8Array(S * S * 4);
  for (let p = 0; p < 4; p++) {                              // four planks across (v); the grain runs along u
    const tone = 0.84 + 0.16 * rng(), k1 = 1 + Math.floor(rng() * 3), ph1 = rng() * 6.28, ph2 = rng() * 6.28;
    const crack = []; for (let i = 0; i < 3; i++) crack.push([5 + Math.floor(rng() * 54), Math.floor(rng() * S), 40 + Math.floor(rng() * 120)]);
    let walk = 0;
    for (let r = 0; r < 64; r++) {
      walk = walk * 0.6 + (rng() - 0.5) * 0.2;
      const seam = r < 2 || r > 61 ? 0.4 : (r < 3 || r > 60 ? 0.8 : 1), y = p * 64 + r;
      for (let x = 0; x < S; x++) {
        let v = tone * (0.95 + walk + 0.035 * Math.sin((x / S) * 6.2832 * k1 + ph1 + r * 0.21) + 0.02 * Math.sin((x / S) * 6.2832 * 7 + ph2 + r * 1.3)) * seam;
        for (const c of crack) if (r === c[0] && ((x - c[1] + S) % S) < c[2]) v *= 0.55;
        v += (rng() - 0.5) * 0.03;
        const b = Math.max(0, Math.min(255, Math.round(v * 255))), o = (y * S + x) * 4; d[o] = b; d[o + 1] = b; d[o + 2] = b; d[o + 3] = 255;
      }
    }
  }
  return finish(new THREE.DataTexture(d, S, S, THREE.RGBAFormat), renderer, true);
}
function shingleTexture(rng, renderer) {
  const S = 256, d = new Uint8Array(S * S * 4);
  for (let c = 0; c < 4; c++) {                              // four courses up the slope (v), eight shingles along (u)
    const shift = Math.floor(rng() * 32), tones = []; let mean = 0; for (let i = 0; i < 8; i++) { tones.push(0.86 + 0.22 * (rng() - 0.5)); mean += tones[i] / 8; }
    for (let i = 0; i < 8; i++) tones[i] += 0.86 - mean;          // every course the same in the mean: no blocks when the roof is seen small
    for (let r = 0; r < 64; r++) {
      const y = c * 64 + r, top = 63 - r;
      for (let x = 0; x < S; x++) {
        const xs = (x + shift) % S, i = xs >> 5, fx = xs & 31;
        let v = tones[i] * (0.94 + 0.06 * Math.sin(fx * 1.9 + i * 2.3 + r * 0.05));
        if (top < 7) v *= 0.42 + 0.08 * top; else if (r < 3) v *= 1.08;       // the shade under the course above; the butt edge
        if (fx === 0) v *= 0.55; else if (fx === 31 || fx === 1) v *= 0.86;      // the joint
        v += (rng() - 0.5) * 0.05;
        const b = Math.max(0, Math.min(255, Math.round(v * 255))), o = (y * S + x) * 4; d[o] = b; d[o + 1] = b; d[o + 2] = b; d[o + 3] = 255;
      }
    }
  }
  return finish(new THREE.DataTexture(d, S, S, THREE.RGBAFormat), renderer, true);
}
// a row of stakes and their brushwood painted on a ribbon (alpha cut): 6.4 m of double row (u) by 1 m of height (v)
function combTexture(rng, renderer) {
  const W = 256, H = 64, d = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { d[i * 4] = 104; d[i * 4 + 1] = 96; d[i * 4 + 2] = 86; d[i * 4 + 3] = 0; }
  let hb = 0.36;                                             // the brushwood band behind the stakes (dark, ragged, 0.3 to 0.45 m)
  for (let x = 0; x < W; x++) {
    hb = Math.min(0.45, Math.max(0.3, hb + (rng() - 0.5) * 0.05)); const top = Math.round(hb * H) + (rng() < 0.2 ? 1 : 0);
    for (let y = 0; y < top; y++) { const o = (y * W + x) * 4, k = 0.75 + 0.5 * rng(); d[o] = 44 * k; d[o + 1] = 36 * k; d[o + 2] = 29 * k; d[o + 3] = 255; }
  }
  for (let k = 0; k < 26; k++) {
    const x0 = Math.round(((k + 0.15 + 0.7 * rng()) * W) / 26), wpx = 3 + (rng() < 0.4 ? 1 : 0), top = Math.round(H * (0.5 + 0.4 * rng())), lean = (rng() - 0.5) * 3, tone = 0.6 + 0.5 * rng(), warm = rng();
    for (let y = 0; y < top; y++) {
      const sh = (0.42 + 0.58 * Math.min(1, y / (H * 0.45))) * (y >= top - 2 ? 1.25 : 1) * tone;
      for (let j = 0; j < wpx; j++) {
        const x = (((x0 + j + Math.round((lean * y) / H)) % W) + W) % W, o = (y * W + x) * 4, e = j === 0 ? 0.8 : 1;
        d[o] = Math.min(255, 148 * sh * e + 8 * warm); d[o + 1] = Math.min(255, 136 * sh * e); d[o + 2] = Math.min(255, 120 * sh * e - 8 * warm); d[o + 3] = 255;
      }
    }
  }
  const t = finish(new THREE.DataTexture(d, W, H, THREE.RGBAFormat), renderer, true); t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
// lamp tones (linear): 0 dark glass, 1 a dim room, 2 a lit room, 3 a lantern's flame behind its glass
const LAMP = { off: 0.125, dim: 0.375, lit: 0.625, lantern: 0.875 };
function lampTexture() {
  const d = new Uint8Array([0, 0, 0, 255, 68, 42, 17, 255, 134, 86, 35, 255, 255, 176, 74, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}

// ---- timber tones (weathered greys, tar blacks, the wet and weedy foot of everything that stands in the sea)
const TONE = {
  grey: hex('#8d857a'), silver: hex('#a59e93'), brown: hex('#6f5e4b'), tar: hex('#2c2925'), larch: hex('#84705a'),
  wet: hex('#23271f'), weed: hex('#2f3a26'), white: hex('#d9d6cc'), black: hex('#1b1a19'), iron: hex('#34322f'),
  brush: hex('#17130f'), brushDry: hex('#2f271e'), rope: hex('#9c8a63'),
};
// a round pile standing plumb from the bed to `top`, dark and weedy to just above the water, weathered above
function pile(g, x, z, top, r, col, sides = 7, cap = true) {
  const H = top - DEEP, ts = [0, (0.16 - DEEP) / H, (0.46 - DEEP) / H, 1];
  g.round(x, DEEP, z, x, top, z, r * 1.06, r * 0.94, sides, ts, [TONE.wet, mix(TONE.weed, TONE.wet, 0.4), tint(col, 0.86), col], cap);
}
// a raked round leg from a foot at the bed to a head at `top` (the beacons' legs, a stair's trestle)
function leg(g, fx, fz, hx, hz, top, r0, r1, col, sides = 7, cap = false) {
  const H = top - DEEP, ts = [0, (0.16 - DEEP) / H, (0.46 - DEEP) / H, 1];
  g.round(fx, DEEP, fz, hx, top, hz, r0, r1, sides, ts, [TONE.wet, mix(TONE.weed, TONE.wet, 0.4), tint(col, 0.86), col], cap);
}
// ---- THE STAKE GROYNES. Rows are given in the line's own terms: a row PARALLEL to the line at `c` metres off it
// from z = a to z = b, or a CROSS row square to the line at z = c from off a to off b (design 7c).
const ROWS = (() => {
  const rows = [], par = (c, a, b) => rows.push({ par: true, c, a, b }), cross = (c, a, b) => rows.push({ par: false, c, a, b });
  for (const off of [38, 120]) { par(off, 300, -420); par(off, -860, -1150); }
  for (const z of [240, 130, 20, -90, -200, -310, -420, -880, -990, -1100]) cross(z, 14, 120);
  for (const off of [-44, -130]) { par(off, 300, -390); par(off, -760, -1150); }
  for (const z of [190, 80, -30, -140, -250, -360, -800, -910, -1020]) cross(z, -20, -130);
  return rows;
})();
const rowPoint = (r, s) => (r.par ? beside(s, r.c) : beside(r.c, s));
const SLOT = 0.5, MAX_STAKES = 5000, COMB_FROM = 30;
// the share of stakes kept at x = (distance from the route) / reach: all of them close by, none beyond
const keepShare = (x) => (x <= 30 ? 1 : x <= 36 ? 1 - (x - 30) * 0.083 : x <= 46 ? 0.5 - (x - 36) * 0.015 : x <= 56 ? (0.35 * (56 - x)) / 10 : 0);

async function buildGroynes(ctx, R, routeDist, lost, want) {
  // 1. every slot of every row: its place, its distance from the route, whether weather or another work took it
  const rows = [];
  let total = 0;
  for (let ri = 0; ri < ROWS.length; ri++) {
    const r = ROWS[ri], L = Math.abs(r.b - r.a), n = Math.max(2, Math.round(L / SLOT)), dir = Math.sign(r.b - r.a), rng = R('row' + ri);
    const gaps = []; let pos = rng.range(10, 46);
    for (let k = 0; k < 40 && pos < L; k++) { const len = rng() < 0.15 ? rng.range(9, 22) : rng.range(2, 6); gaps.push(pos, pos + len); pos += len + rng.range(24, 78); }
    const X = new Float32Array(n), Z = new Float32Array(n), D = new Float32Array(n), gone = new Uint8Array(n);
    const [x0, z0] = rowPoint(r, r.a), [x1, z1] = rowPoint(r, r.a + dir * 1), tl = Math.hypot(x1 - x0, z1 - z0) || 1;
    for (let i = 0; i < n; i++) {
      const sl = i * SLOT, [x, z] = rowPoint(r, r.a + dir * sl); X[i] = x; Z[i] = z; D[i] = routeDist(x, z);
      let g = lost(x, z); for (let k = 0; k < gaps.length && !g; k += 2) g = sl >= gaps[k] && sl < gaps[k + 1];
      gone[i] = g ? 1 : 0;
      if (i % 1200 === 1199) await ctx.yield();
    }
    for (let i = 0, a = 0; i <= n; i++) if (i === n || gone[i]) { if (i - a < 10) for (let k = a; k < i; k++) gone[k] = 1; a = i + 1; }   // no stubs under 5 m: a speck reads as noise
    rows.push({ n, X, Z, D, gone, tx: (x1 - x0) / tl, tz: (z1 - z0) / tl, ph1: rng() * 6.28, ph2: rng() * 6.28, rng });
    total += n;
  }
  // 2. every candidate stake's dice, drawn before any test: two a slot (the two rows of the double row)
  const NC = total * 2, cx = new Float32Array(NC), cz = new Float32Array(NC), cd = new Float32Array(NC), ch = new Float32Array(NC), cr = new Float32Array(NC);
  const cl1 = new Float32Array(NC), cl2 = new Float32Array(NC), ct = new Float32Array(NC), cu = new Float32Array(NC), ok = new Uint8Array(NC);
  let c = 0;
  for (const row of rows) {
    const { n, X, Z, D, gone, tx, tz, ph1, ph2, rng } = row, nx = -tz, nz = tx;
    const ph = rng();                                                            // thinning is EVEN along the row: a golden-ratio sequence
    for (let i = 0; i < n; i++) {
      const base = 0.69 + 0.1 * Math.sin(i * 0.043 + ph1) + 0.06 * Math.sin(i * 0.17 + ph2);
      for (let k = 0; k < 2; k++, c++) {
        const al = (k ? 0.25 : 0) + (rng() - 0.5) * 0.16, la = (k ? -0.2 : 0.2) + (rng() - 0.5) * 0.06, hh = Math.min(0.9, Math.max(0.5, base + (rng() - 0.5) * 0.34));
        const big = rng() < 0.1 ? 3 : 1;
        cx[c] = X[i] + tx * al + nx * la; cz[c] = Z[i] + tz * al + nz * la; cd[c] = D[i]; ch[c] = hh; cr[c] = 0.04 + rng() * 0.011;
        cl1[c] = (rng() - 0.5) * 0.11 * big; cl2[c] = (rng() - 0.5) * 0.11 * big; ct[c] = rng(); cu[c] = (ph + c * 0.6180339887) % 1; ok[c] = gone[i] ? 0 : 1;
      }
    }
    await ctx.yield();
  }
  // 3. the reach of the stakes: the widest that keeps the count at or under what is wanted (never over 5,000)
  const count = (q) => { let m = 0; for (let i = 0; i < NC; i++) if (ok[i] && cu[i] < keepShare(cd[i] / q)) m++; return m; };
  let lo = 0.3, hi = 1.7;
  for (let it = 0; it < 14; it++) { const q = (lo + hi) / 2; if (count(q) > want) hi = q; else lo = q; }
  const reach = lo, NEAR = 33;
  await ctx.yield();
  // 4. the instances: near stakes are four-sided with a sawn top, further ones three-sided
  const stakeGeo = (sides) => {
    const P = [], N = [], C = [], U = [], I = [];
    for (let j = 0; j < 2; j++) for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2 + 0.4, y = j ? 1 - 0.02 * (k % 2) : 0, sh = j ? 1 : 0.2;
      P.push(Math.cos(a), y, Math.sin(a)); N.push(Math.cos(a), 0, Math.sin(a)); C.push(sh, sh, sh); U.push(y * 0.75, 0.04 + (k / sides) * 0.17);
    }
    for (let k = 0; k < sides; k++) { const a = k, b = (k + 1) % sides; I.push(a, a + sides, b, b, a + sides, b + sides); }
    for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2 + 0.4; P.push(Math.cos(a), 1 - 0.02 * (k % 2), Math.sin(a)); N.push(0, 1, 0); C.push(1.3, 1.28, 1.22); U.push(0.5 + 0.03 * Math.cos(a), 0.12 + 0.03 * Math.sin(a)); }
    for (let k = 1; k < sides - 1; k++) I.push(2 * sides, 2 * sides + k + 1, 2 * sides + k);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
    return g;
  };
  const picks = [[], []];
  for (let i = 0; i < NC && picks[0].length + picks[1].length < MAX_STAKES; i++) if (ok[i] && cu[i] < keepShare(cd[i] / reach)) picks[cd[i] < NEAR ? 0 : 1].push(i);
  return { rows, picks, stakeGeo, reach, at: { cx, cz, cd, ch, cr, cl1, cl2, ct } };
}
// the groynes' meshes: instanced stakes (near, further), the brushwood, and the painted ribbon in two parts
// (near the route: for the mirror only; further off: seen and mirrored)
async function groyneMeshes(ctx, gr, matWood, matBrush, matStrip, hash) {
  const { rows, picks, stakeGeo, at } = gr, meshes = [], geos = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  picks.forEach((list, far) => {
    if (!list.length) return;
    const geo = stakeGeo(far ? 3 : 4), mesh = new THREE.InstancedMesh(geo, matWood, list.length); geos.push(geo);
    for (let j = 0; j < list.length; j++) {
      const i = list[j], t = at.ct[i], k = t < 0.13 ? 0.55 : 0.8 + 0.6 * ((t * 7.3) % 1), w = (t * 3.1) % 1;
      e.set(at.cl1[i], t * 6.28, at.cl2[i]); q.setFromEuler(e); pos.set(at.cx[i], DEEP, at.cz[i]); sc.set(at.cr[i], at.ch[i] - DEEP, at.cr[i]);
      mesh.setMatrixAt(j, m4.compose(pos, q, sc));
      const c3 = mix(TONE.grey, TONE.brown, w); col.setRGB(c3[0] * k, c3[1] * k, c3[2] * k); mesh.setColorAt(j, col);
    }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.noMirror = true; mesh.name = far ? 'works: stakes (further)' : 'works: stakes (near)';
    meshes.push(mesh);
  });
  await ctx.yield();
  const B = new Geo(), M = new Geo(), K = new Geo();
  const NEARSEC = [[-0.165, -0.55, -1, 0.05], [-0.17, 0.2, -0.8, 0.6], [0, 0.38, 0, 1], [0.17, 0.2, 0.8, 0.6], [0.165, -0.55, 1, 0.05]];
  const FARSEC = [[-0.2, -0.55, -0.95, 0.3], [0, 0.38, 0, 1], [0.2, -0.55, 0.95, 0.3]];
  for (let ri = 0; ri < rows.length; ri++) {
    if (ri % 6 === 5) await ctx.yield();
    const row = rows[ri], { n, X, Z, D, gone, tx, tz, rng } = row, nx = -tz, nz = tx;
    let prev = null, prevM = -1, prevFar = false, since = 1e9, sinceM = 1e9;
    const ring = (type, i, end, d1, d2, d3, d4, shift) => {
      const sec = type ? FARSEC : NEARSEC, base = B.n, d = D[i], farK = Math.min(1, Math.max(0, (d - 60) / 60));    // far off the crest itself goes ragged
      const crest = end ? -0.22 : 0.3 + 0.15 * d1 + (type ? 0.3 * d2 * farK : 0), sway = (d3 - 0.5) * 0.12;
      for (let j = 0; j < sec.length; j++) {
        const [l0, y0, nl, nu] = sec[j], isTop = y0 > 0.3, isFoot = y0 < 0;
        const l = isTop ? sway : l0 * (1 + 0.2 * (d4 - 0.5)), y = isTop ? crest : isFoot ? y0 : (end ? -0.3 : y0 + 0.09 * (j === 1 ? d2 : d4));
        const jx = (d1 - 0.5) * 0.9, c = isFoot ? TONE.wet : isTop ? mix(mix(TONE.brush, TONE.brushDry, 0.2 + 0.7 * d4), tint(TONE.brown, 0.55), type ? 0.5 * farK : 0) : tint(TONE.brush, 0.7 + 0.6 * d3);
        B.v(X[i] + tx * shift + nx * l, y, Z[i] + tz * shift + nz * l, nx * nl + tx * jx, nu, nz * nl + tz * jx, c, (i * SLOT + shift) * 0.7, j * (type ? 0.75 : 0.5) + d2 * 0.04);
      }
      if (!type && !end && d < 27) for (let k = 0; k < 3; k++) {                      // close to the route: stout twig ends stand out of the bundle
        const h1 = hash(ri, i, k * 5), h2 = hash(ri, i, k * 5 + 1), h3 = hash(ri, i, k * 5 + 2), h4 = hash(ri, i, k * 5 + 3), h5 = hash(ri, i, k * 5 + 4);
        const al = h1 * SLOT, la = (h2 - 0.5) * 0.26, dir = h3 < 0.5 ? -1 : 1, up = 0.18 + 0.75 * h4, out = (h5 - 0.5) * 0.9, len = 0.18 + 0.26 * h3 * (2 - h3), w = 0.024;
        const bx = X[i] + tx * al + nx * la, bz = Z[i] + tz * al + nz * la, by = crest - 0.06 - Math.abs(la) * 0.5, c = tint(TONE.brushDry, 0.5 + 0.9 * h2);
        const ex = bx + (tx * dir + nx * out) * len * (1 - up * 0.5), ez = bz + (tz * dir + nz * out) * len * (1 - up * 0.5), ey = by + len * up;
        const q = B.v(bx - nx * w, by, bz - nz * w, nx * 0.3, 0.95, nz * 0.3, c, 0.1, 0.06); B.v(bx + nx * w, by, bz + nz * w, nx * 0.3, 0.95, nz * 0.3, c, 0.1, 0.1); B.v(ex, ey, ez, nx * 0.3, 0.95, nz * 0.3, tint(c, 1.3), 0.4, 0.08);
        B.I.push(q, q + 1, q + 2);
      }
      return { type, base, m: sec.length };
    };
    const join = (a, b) => { for (let j = 0; j < a.m - 1; j++) B.I.push(a.base + j, a.base + j + 1, b.base + j + 1, a.base + j, b.base + j + 1, b.base + j); };
    for (let i = 0; i < n; i++) {
      const d1 = rng(), d2 = rng(), d3 = rng(), d4 = rng();                         // this slot's dice, drawn before any test
      if (gone[i]) { prev = null; prevM = -1; continue; }
      const d = D[i], first = i === 0 || gone[i - 1] === 1, last = i === n - 1 || gone[i + 1] === 1, end = first || last;
      const type = d < 34 ? 0 : 1, step = d < 34 ? 0.5 : d < 60 ? 1 : d < 110 ? 1.5 : 2.5;
      since += SLOT; sinceM += SLOT;
      if (end || !prev || since >= step - 1e-3 || prev.type !== type) {
        if (prev && prev.type !== type) { const r0 = ring(prev.type, i, false, d1, d2, d3, d4, 0); join(prev, r0); prev = null; }
        if (first) prev = ring(type, i, true, d1, d2, d3, d4, -0.22);                    // a run of brushwood ends short and steep, not in a long ramp
        const r1 = ring(type, i, false, d1, d2, d3, d4, 0); if (prev) join(prev, r1); prev = r1; since = 0;
        if (last) { join(r1, ring(type, i, true, d1, d2, d3, d4, 0.22)); prev = null; }
      }
      // the comb ribbon: a plumb ribbon along the row's middle carrying a row of painted stakes (alpha cut).
      // Close to the route it is for the MIRROR only (the real stakes stand there); further off it is seen too.
      const far = d >= COMB_FROM, G2 = far ? K : M, stepM = d < COMB_FROM ? 1 : d < 60 ? 2 : 4;
      if (end || prevM < 0 || sinceM >= stepM - 1e-3 || far !== prevFar) {
        const put = (g) => { const c = tint(mix(TONE.grey, TONE.brown, d3), 0.75 + 0.5 * d4), u = (i * SLOT) / 6.4 + row.ph1; const a = g.v(X[i], -0.12, Z[i], nx, 0, nz, c, u, -0.12); g.v(X[i], 1, Z[i], nx, 0, nz, c, u, 1); return a; };
        if (prevM >= 0 && far !== prevFar) { const a = put(prevFar ? K : M), g = prevFar ? K : M; g.I.push(prevM, a, a + 1, prevM, a + 1, prevM + 1); prevM = -1; }
        const a = put(G2);
        if (prevM >= 0) G2.I.push(prevM, a, a + 1, prevM, a + 1, prevM + 1);
        prevM = a; prevFar = far; sinceM = 0;
      }
    }
  }
  await ctx.yield();
  const brushGeo = B.build(), stripGeo = M.build(), combGeo = K.build(); geos.push(brushGeo, stripGeo, combGeo);
  const brush = new THREE.Mesh(brushGeo, matBrush); brush.userData.noMirror = true; brush.name = 'works: brushwood';
  const strip = new THREE.Mesh(stripGeo, matStrip); strip.userData.mirrorOnly = true; strip.name = 'works: near groynes for the mirror';
  strip.layers.set(1);                                    // the mirror's camera sees layer 1 only (design 6): never the lens
  const comb = new THREE.Mesh(combGeo, matStrip); comb.name = 'works: further groynes (stake comb)';
  meshes.push(brush, strip, comb);
  return { meshes, geos };
}
// ---- carpentry helpers (frame coordinates). Posts at the given places [x, z] with a top rail laid ON them and a
// mid rail fixed to their side: no timber is pushed through another.
function railRun(g, pts, y0, h, col, o = {}) {
  const ps = o.post || 0.08, side = o.side || 1;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    if (!(o.openFirst && i === 0) && !(o.openLast && i === pts.length - 1)) g.beam(x, y0, z, x, y0 + h - 0.06, z, ps, ps, col, false);
    if (!i) continue;
    const [px, pz] = pts[i - 1], l = Math.hypot(x - px, z - pz) || 1, ox = (-(z - pz) / l) * (ps / 2 + 0.02) * side, oz = ((x - px) / l) * (ps / 2 + 0.02) * side;
    g.beam(px, y0 + h - 0.03, pz, x, y0 + h - 0.03, z, ps + 0.03, 0.06, tint(col, 1.06));
    g.beam(px + ox, y0 + h * 0.52, pz + oz, x + ox, y0 + h * 0.52, z + oz, 0.04, 0.08, col);
  }
}
const spread = (a, b, step) => { const n = Math.max(1, Math.round(Math.abs(b - a) / step)), out = []; for (let i = 0; i <= n; i++) out.push(a + ((b - a) * i) / n); return out; };
// a planked slab (a deck seen from further off): top and underside show plank seams square to `along`
function slab(g, x0, z0, x1, z1, yTop, th, col, alongX) {
  const y0 = yTop - th, u = alongX ? (z1 - z0) * UL : (x1 - x0) * UL, v = alongX ? (x1 - x0) * VL : (z1 - z0) * VL, d = tint(col, 0.7);
  if (alongX) {                                           // planks lie along z (across a walk that runs along x)
    g.face([x0, yTop, z1], [x0, yTop, z0], [x1, yTop, z0], [x1, yTop, z1], col, 0, 0, u, v);
    g.face([x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], d, 0, 0, u, v);
  } else {
    g.face([x0, yTop, z0], [x1, yTop, z0], [x1, yTop, z1], [x0, yTop, z1], col, 0, 0, u, v);
    g.face([x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1], d, 0, 0, u, v);
  }
  g.face([x0, y0, z1], [x1, y0, z1], [x1, yTop, z1], [x0, yTop, z1], d, 0, 0.05, 1, 0.1); g.face([x1, y0, z0], [x0, y0, z0], [x0, yTop, z0], [x1, yTop, z0], d, 0, 0.05, 1, 0.1);
  g.face([x1, y0, z1], [x1, y0, z0], [x1, yTop, z0], [x1, yTop, z1], d, 0, 0.05, 1, 0.1); g.face([x0, y0, z0], [x0, y0, z1], [x0, yTop, z1], [x0, yTop, z0], d, 0, 0.05, 1, 0.1);
}

// ---- THE HALT (HALT in the law): a plank deck on two rows of round piles, following the line's own curve
const DECK = LEVEL.haltDeck, SHELTER = { z: -758, len: 8, depth: 2.4, ridge: 3.2 };   // the shelter's middle on the line
function buildHalt(G, rng) {
  const e0 = HALT.edge, e1 = HALT.edge + HALT.width, zA = HALT.z0, len = HALT.z0 - HALT.z1, nb = Math.round(len / 3), bay = len / nb;
  const at = (z) => { const [x, zz] = beside(z, 0); return G.frame(x, zz, lineHeading(z)); };
  const timber = () => tint(mix(TONE.larch, TONE.grey, 0.3 + 0.5 * rng()), 0.8 + 0.3 * rng());
  for (let i = 0; i <= nb; i++) {                          // the bents: two piles, a cross-head, a flat cross brace
    at(zA - i * bay); const zz = i === 0 ? -0.24 : i === nb ? 0.24 : 0, c = timber();
    pile(G, e0 + 0.3, zz, 0.5, 0.125, timber(), 8); pile(G, e1 - 0.3, zz, 0.5, 0.125, timber(), 8);
    G.beam(e0 + 0.03, 0.6, zz, e1 - 0.03, 0.6, zz, 0.2, 0.2, c);
    G.beam(e0 + 0.46, 0.26, zz + 0.17, e1 - 0.46, 0.42, zz + 0.17, 0.05, 0.1, tint(c, 0.9)); G.beam(e0 + 0.46, 0.42, zz - 0.17, e1 - 0.46, 0.26, zz - 0.17, 0.05, 0.1, tint(c, 0.9));
  }
  for (let i = 0; i < nb; i++) {                           // stringers, the pale kerb at the track's side, knee braces
    at(zA - (i + 0.5) * bay); const h = bay / 2;
    for (const x of [e0 + 0.11, e0 + 1.15, e1 - 1.15, e1 - 0.11]) G.beam(x, 0.8025, h, x, 0.8025, -h, 0.1, 0.205, timber());
    G.beam(e0 + 0.07, DECK + 0.04, h, e0 + 0.07, DECK + 0.04, -h, 0.13, 0.08, tint(TONE.white, 0.82 + 0.14 * rng()));
    for (const k of [1, -1]) G.beam(e0 + 0.14, 0.3, k * (h - 0.14), e0 + 0.14, 0.69, k * (h - 0.56), 0.06, 0.09, timber());
  }
  const np = Math.round(len / 0.214), pw = len / np;       // the deck: every plank its own, a hair uneven at the back
  for (let k = 0; k < np; k++) { at(zA - (k + 0.5) * pw); G.beam(e0, DECK - 0.0225, 0, e1 + rng() * 0.05, DECK - 0.0225, 0, pw - 0.012, 0.045, tint(mix(TONE.grey, TONE.silver, rng()), 0.8 + 0.32 * rng())); }
  // rails: along the back (open at the shelter and where the boardwalk leaves) and across both ends
  const zS0 = SHELTER.z + SHELTER.len / 2, zS1 = SHELTER.z - SHELTER.len / 2, xb = e1 - 0.07, rc = tint(TONE.grey, 0.9);
  for (const [a, b] of [[zA - 0.06, zS0 + 0.12], [zS1 - 0.12, -767 + 0.98], [-767 - 0.98, HALT.z1 + 0.06]]) {
    const zm = (a + b) / 2; at(zm); railRun(G, spread(a - zm, b - zm, 1.9).map((z) => [xb, z]), DECK, 1.1, rc, { side: -1 });
  }
  at(zA); railRun(G, spread(xb - 0.12, e0 + 0.6, 1.4).map((x) => [x, -0.07]), DECK, 1.1, rc, { openFirst: true });
  at(HALT.z1); railRun(G, spread(xb - 0.12, e0 + 0.6, 1.4).map((x) => [x, 0.07]), DECK, 1.1, rc, { openFirst: true });
  // the tide gauge: a post with a tall white board banded in black blocks (blocks only), standing in the sea
  const [gx, gz] = beside(-786, 3.4); G.frame(gx, gz, lineHeading(-786));
  G.beam(0, DEEP, 0, 0, 0.42, 0, 0.16, 0.16, TONE.wet, false); G.beam(0, 0.42, 0, 0, 3.0, 0, 0.16, 0.16, tint(TONE.grey, 0.8), false);
  G.box(0, 3.03, 0, 0.26, 0.06, 0.26, tint(TONE.tar, 1.2));
  for (let k = 0; k < 14; k++) for (const sd of [0, 1]) {
    const y = DEEP + k * 0.24, dark = (k + sd) % 2 === 0, c = y < 0.1 ? (dark ? TONE.wet : tint(TONE.weed, 1.5)) : dark ? TONE.black : TONE.white;
    G.beam(-0.105, y, (sd ? 0.08 : -0.08), -0.105, y + 0.24, (sd ? 0.08 : -0.08), 0.05, 0.16, c, k === 13);
  }
}
// a lit or dark pane: one flat face whose uv picks its lamp tone
const pane = (GL, p0, p1, p2, p3, tone) => GL.face(p0, p1, p2, p3, [1, 1, 1], tone, 0.5, tone, 0.5);
// a small lantern hung on a rod: iron cap, base and bars, four panes of warm glass
function lantern(G, GL, x, yTop, z, yHook) {
  const ir = TONE.iron;
  G.box(x, yTop + 0.035, z, 0.27, 0.03, 0.27, ir); G.box(x, yTop + 0.07, z, 0.11, 0.04, 0.11, ir); G.beam(x, yTop + 0.09, z, x, yHook, z, 0.024, 0.024, ir, false);
  G.box(x, yTop - 0.305, z, 0.23, 0.03, 0.23, ir);
  for (const i of [-1, 1]) for (const j of [-1, 1]) G.beam(x + 0.097 * i, yTop - 0.29, z + 0.097 * j, x + 0.097 * i, yTop + 0.02, z + 0.097 * j, 0.022, 0.022, ir, false);
  const a = 0.086, y0 = yTop - 0.285, y1 = yTop + 0.015, t = LAMP.lantern;
  pane(GL, [x - a, y0, z + a], [x + a, y0, z + a], [x + a, y1, z + a], [x - a, y1, z + a], t); pane(GL, [x + a, y0, z - a], [x - a, y0, z - a], [x - a, y1, z - a], [x + a, y1, z - a], t);
  pane(GL, [x + a, y0, z + a], [x + a, y0, z - a], [x + a, y1, z - a], [x + a, y1, z + a], t); pane(GL, [x - a, y0, z - a], [x - a, y0, z + a], [x - a, y1, z + a], [x - a, y1, z - a], t);
}
// a pitched roof in frame coordinates, ridge along z at x = 0: shingles above (RF), boards below, fascias, barge
// boards and a ridge cap (G). xE, zE: half spans to the eave and the gable edge; m: rise per metre.
function pitchedRoof(G, RF, ridgeY, m, xE, zE, shingle, trim, under) {
  const yE = ridgeY - m * xE, sl = Math.hypot(xE, m * xE), th = 0.07;
  RF.face([-xE, yE, -zE], [-xE, yE, zE], [0, ridgeY, zE], [0, ridgeY, -zE], shingle, 0, 0, 2 * zE * UL, sl / 1.2);
  RF.face([xE, yE, zE], [xE, yE, -zE], [0, ridgeY, -zE], [0, ridgeY, zE], shingle, 0.37, 0, 0.37 + 2 * zE * UL, sl / 1.2);
  G.face([-xE, yE - th, zE], [-xE, yE - th, -zE], [0, ridgeY - th, -zE], [0, ridgeY - th, zE], under, 0, 0, 2 * zE * UL, sl * VL);
  G.face([xE, yE - th, -zE], [xE, yE - th, zE], [0, ridgeY - th, zE], [0, ridgeY - th, -zE], under, 0, 0, 2 * zE * UL, sl * VL);
  for (const k of [-1, 1]) {
    G.beam(k * xE, yE - 0.05, -zE, k * xE, yE - 0.05, zE, 0.03, 0.14, trim);
    for (const e of [-1, 1]) G.beam(k * xE, yE - 0.045, e * zE, 0, ridgeY - 0.045, e * zE, 0.04, 0.18, trim);
  }
  G.beam(0, ridgeY + 0.02, -zE - 0.03, 0, ridgeY + 0.02, zE + 0.03, 0.17, 0.05, tint(trim, 0.8));
}
function buildShelter(G, RF, GL, rng) {
  const hd = SHELTER.depth / 2, hl = SHELTER.len / 2, [ox, oz] = beside(SHELTER.z, HALT.edge + HALT.width - hd), yaw = lineHeading(SHELTER.z);
  G.frame(ox, oz, yaw); RF.frame(ox, oz, yaw); GL.frame(ox, oz, yaw);
  const plate = DECK + 2.2, ridge = DECK + SHELTER.ridge, post = tint(TONE.grey, 0.78), xE = hd + 0.45, zE = hl + 0.4;
  const m = (ridge - 0.07 - (plate + 0.24)) / hd, yU = (x) => ridge - 0.07 - m * Math.abs(x);
  const board = () => tint(mix(TONE.brown, TONE.grey, 0.3 + 0.55 * rng()), 0.85 + 0.4 * rng());
  const zs = [-hl + 0.06, -1.32, 1.32, hl - 0.06];
  for (const z of zs) {
    for (const x of [-hd + 0.06, hd - 0.06]) G.beam(x, DECK, z, x, plate, z, 0.12, 0.12, post, false);
    G.beam(-hd + 0.12, plate - 0.08, z, hd - 0.12, plate - 0.08, z, 0.09, 0.14, post, false);              // a tie between each pair of posts
  }
  for (const x of [-hd + 0.06, hd - 0.06]) G.beam(x, plate + 0.07, -hl - 0.14, x, plate + 0.07, hl + 0.14, 0.12, 0.14, post);
  for (const z of zs) for (const k of [-1, 1]) {                                                           // knee braces along the open front
    if (Math.abs(z + k * 0.5) > hl) continue;
    G.beam(-hd + 0.06, plate - 0.52, z + k * 0.08, -hd + 0.06, plate - 0.03, z + k * 0.57, 0.06, 0.09, post);
  }
  const zb = spread(-hl + 0.08, hl - 0.08, 0.16), xb = spread(-hd + 0.08, hd - 0.08, 0.16), pz = zb[1] - zb[0], px = xb[1] - xb[0];   // boards edge to edge
  for (const z of zb) G.beam(hd + 0.013, DECK + 0.03, z, hd + 0.013, plate + 0.13, z, 0.026, pz, board(), false);                    // the boarded back
  for (const e of [-1, 1]) for (const x of xb) G.beam(x, DECK + 0.03, e * (hl + 0.013), x, yU(Math.abs(x) + px / 2) - 0.012, e * (hl + 0.013), px, 0.026, board(), false);
  for (const z of spread(-hl + 0.03, hl - 0.03, 0.88)) for (const k of [-1, 1]) G.beam(k * (xE - 0.05), yU(xE - 0.05) - 0.062, z, k * 0.04, yU(0.04) - 0.062, z, 0.06, 0.1, tint(post, 0.9));   // rafters, their tails under the eaves
  pitchedRoof(G, RF, ridge, m, xE, zE, tint(hex('#8a8375'), 0.95), tint(TONE.tar, 1.25), tint(TONE.brown, 0.75));
  G.box(hd - 0.3, DECK + 0.45, 0, 0.36, 0.045, 2 * hl - 0.6, tint(TONE.silver, 0.9));                        // a plank bench along the back
  for (const z of spread(-hl + 0.6, hl - 0.6, 1.7)) G.box(hd - 0.28, DECK + 0.214, z, 0.3, 0.427, 0.05, post, false);
  for (const z of [-2.63, 2.63]) lantern(G, GL, -hd - 0.2, DECK + 2.1, z, yU(hd + 0.2));              // two lanterns under the front eave
}
// ---- THE BOARDWALK and the three STILT HOUSES. One frame for them all: its origin on the line at WALK.z, its x
// the metres off the line (east), so the walk runs along +x and the houses stand square to it.
const WALK = { z: -767, end: 132, width: 1.6 };
const HOUSES = [                                          // sx across the ridge, sz along it; turn 1 = ridge along the walk
  { z: -748, off: 66, sx: 7.0, sz: 9.2, turn: 0, floor: 5.5, wall: 2.55, m: 0.84, gal: 1.2, stairX: -1.7, roof: '#858a86', walls: '#34383a', trim: '#d6d2c6', door: '#6f7f86' },
  { z: -792, off: 96, sx: 7.4, sz: 9.8, turn: 1, floor: 5.9, wall: 2.7, m: 0.92, gal: 1.25, stairX: -2.6, roof: '#55605a', walls: '#8e877b', trim: '#34322f', door: '#3d4a44' },
  { z: -752, off: 126, sx: 6.4, sz: 8.2, turn: 0, floor: 5.1, wall: 2.4, m: 0.74, gal: 1.1, stairX: 1.3, roof: '#5c6560', walls: '#9a9b8f', trim: '#d6d2c6', door: '#2f4650' },
];
function walkFrame() { const [x, z] = beside(WALK.z, 0), yaw = lineHeading(WALK.z); return { x, z, yaw, c: Math.cos(yaw), s: Math.sin(yaw) }; }
function inWalk(f, wx, wz) { const dx = wx - f.x, dz = wz - f.z; return [dx * f.c - dz * f.s, dx * f.s + dz * f.c]; }

// a straight open stair along z from (x, z0, y0) up to (x, z1, y1): two stringers, treads, a rail either side
function stair(G, x, z0, y0, z1, y1, col) {
  const n = Math.round((y1 - y0) / 0.19), rise = (y1 - y0) / n, go = (z1 - z0) / n, k = Math.sign(go), sl = Math.hypot(1, rise / Math.abs(go));
  for (const sd of [-1, 1]) {
    G.beam(x + sd * 0.5, y0 - 0.13 * sl, z0, x + sd * 0.5, y1 - 0.13 * sl, z1, 0.06, 0.26, col);
    for (const t of [0.04, 0.35, 0.66, 0.97]) { const yn = y0 + (y1 - y0) * t, zz = z0 + (z1 - z0) * t; G.beam(x + sd * 0.565, yn - 0.1, zz, x + sd * 0.565, yn + 0.94, zz, 0.07, 0.07, col, false); }
    G.beam(x + sd * 0.565, y0 + 0.99, z0 - k * 0.06, x + sd * 0.565, y1 + 0.99, z1, 0.08, 0.07, tint(col, 1.06));
    G.beam(x + sd * 0.62, y0 + 0.5, z0, x + sd * 0.62, y1 + 0.5, z1, 0.04, 0.07, col);
  }
  for (let i = 1; i < n; i++) G.box(x, y0 + i * rise - 0.02, z0 + (i - 0.5) * go, 0.94, 0.04, Math.abs(go) + 0.03, tint(col, 0.92 + 0.14 * ((i * 7) % 3) / 2));
  const zm = (z0 + z1) / 2, ym = (y0 + y1) / 2 - 0.27 * sl - 0.08;                 // a trestle under the middle of the flight
  G.beam(x - 0.8, ym, zm, x + 0.8, ym, zm, 0.14, 0.16, col);
  for (const sd of [-1, 1]) pile(G, x + sd * 0.62, zm, ym - 0.08, 0.09, col, 6, false);
}

function buildWalk(G, rng, f, spurs) {
  G.frame(f.x, f.z, f.yaw);
  const x0 = HALT.edge + HALT.width + 0.07, x1 = WALK.end, hw = WALK.width / 2, tim = () => tint(mix(TONE.larch, TONE.grey, 0.3 + 0.5 * rng()), 0.8 + 0.3 * rng());
  const bents = spread(x0 + 0.45, x1 - 0.3, 3);
  for (const x of bents) {
    for (const sd of [-1, 1]) pile(G, x, sd * 0.6, 0.5, 0.09, tim(), 6);
    G.beam(x, 0.58, -hw - 0.06, x, 0.58, hw + 0.06, 0.14, 0.16, tim());
  }
  for (const sd of [-1, 1]) G.beam(x0, 0.7825, sd * 0.6, x1, 0.7825, sd * 0.6, 0.09, 0.245, tint(TONE.larch, 0.8));
  const plankEnd = x0 + 26, np = Math.round((plankEnd - x0) / 0.205), pw = (plankEnd - x0) / np;     // the near end plank by plank
  for (let i = 0; i < np; i++) G.beam(x0 + (i + 0.5) * pw, DECK - 0.0225, -hw - rng() * 0.04, x0 + (i + 0.5) * pw, DECK - 0.0225, hw + rng() * 0.04, pw - 0.012, 0.045, tint(mix(TONE.grey, TONE.silver, rng()), 0.8 + 0.32 * rng()));
  for (const xa of spread(plankEnd, x1, 3).slice(0, -1)) slab(G, xa, -hw, Math.min(x1, xa + (x1 - plankEnd) / Math.round((x1 - plankEnd) / 3)), hw, DECK, 0.045, tint(mix(TONE.grey, TONE.silver, rng()), 0.82 + 0.22 * rng()), true);
  // the handrail on the walk's far side (-z), open where a spur leaves that side
  const rc = tint(TONE.grey, 0.9), cuts = spurs.filter((sp) => sp.sg < 0).map((sp) => sp.x).sort((a, b) => a - b);
  let from = x0 + 0.1;
  for (const cut of [...cuts, null]) {
    const to = cut === null ? x1 - 0.06 : cut - 0.72, pts = [from, ...bents.filter((x) => x > from + 0.5 && x < to - 0.5), to];
    railRun(G, pts.map((x) => [x, -hw + 0.07]), DECK, 1.05, rc);
    if (cut !== null) from = cut + 0.72;
  }
  // the spurs: a narrower walk from the main one to the foot of each house's stair, then the stair
  for (const sp of spurs) {
    const a = sp.sg * hw, b = sp.zs, c = tim();
    for (const z of spread(a + sp.sg * 0.6, b - sp.sg * 0.3, 3)) { for (const sd of [-1, 1]) pile(G, sp.x + sd * 0.45, z, 0.5, 0.085, tim(), 6); G.beam(sp.x - 0.7, 0.58, z, sp.x + 0.7, 0.58, z, 0.14, 0.16, tim()); }
    for (const sd of [-1, 1]) G.beam(sp.x + sd * 0.45, 0.7825, a, sp.x + sd * 0.45, 0.7825, b, 0.08, 0.245, tint(c, 0.85));
    slab(G, sp.x - 0.6, Math.min(a, b), sp.x + 0.6, Math.max(a, b), DECK, 0.045, tint(mix(TONE.grey, TONE.silver, rng()), 0.86 + 0.2 * rng()), false);
    railRun(G, spread(a + sp.sg * 0.12, b - sp.sg * 0.1, 1.9).map((z) => [sp.x + 0.53, z]), DECK, 1.05, rc);
    stair(G, sp.x, b, DECK, sp.zg, sp.floor, tint(TONE.grey, 0.86));
  }
}
// a stilt house's understructure (walk frame): a forest of larch piles under bearers, two levels of ties, cross
// braces bay by bay on the outer faces (one outside the piles, its partner inside: they pass, never cut), the
// gallery deck and its rail, open where the stair arrives.
function houseBase(G, rng, f, h, sp) {
  G.frame(f.x, f.z, f.yaw);
  const { hx, hz, ex, ez } = sp, F = h.floor, r = 0.15, col = () => tint(mix(TONE.larch, TONE.brown, rng()), 0.72 + 0.34 * rng());
  const xs = spread(hx - ex + 0.45, hx + ex - 0.45, 2.9), zs = spread(hz - ez + 0.45, hz + ez - 0.45, 2.9);
  for (const x of xs) for (const z of zs) pile(G, x, z, F - 0.32, r, col(), 7, false);
  for (const z of zs) G.beam(hx - ex + 0.08, F - 0.19, z, hx + ex - 0.08, F - 0.19, z, 0.22, 0.26, col());
  for (const sd of [-1, 1]) G.beam(hx + sd * (ex - 0.04), F - 0.16, hz - ez + 0.02, hx + sd * (ex - 0.04), F - 0.16, hz + ez - 0.02, 0.07, 0.2, col());
  slab(G, hx - ex, hz - ez, hx + ex, hz + ez, F, 0.06, tint(TONE.grey, 0.92), false);
  const yA = 1.55, yB = F - 1.05, xa = xs[0], xb = xs[xs.length - 1], za = zs[0], zb = zs[zs.length - 1], o = r + 0.04, tc = col(), y1 = yA + 0.16, y2 = yB - 0.36;
  for (const sd of [-1, 1]) {
    const zf = sd < 0 ? za : zb, xf = sd < 0 ? xa : xb;
    for (const y of [yA, yB]) {
      G.beam(xa - 0.35, y, zf + sd * o, xb + 0.35, y, zf + sd * o, 0.07, 0.18, tc);
      G.beam(xf + sd * o, y - 0.2, za - 0.35, xf + sd * o, y - 0.2, zb + 0.35, 0.07, 0.18, tc);
    }
    for (let i = 0; i < xs.length - 1; i++) {
      G.beam(xs[i] + 0.08, y1, zf + sd * (o + 0.075), xs[i + 1] - 0.08, y2, zf + sd * (o + 0.075), 0.06, 0.15, tc);
      G.beam(xs[i] + 0.08, y2, zf - sd * (r + 0.035), xs[i + 1] - 0.08, y1, zf - sd * (r + 0.035), 0.06, 0.15, tc);
    }
    for (let j = 0; j < zs.length - 1; j++) {
      G.beam(xf + sd * (o + 0.075), y1 - 0.2, zs[j] + 0.08, xf + sd * (o + 0.075), y2 - 0.2, zs[j + 1] - 0.08, 0.06, 0.15, tc);
      G.beam(xf - sd * (r + 0.035), y2 - 0.2, zs[j] + 0.08, xf - sd * (r + 0.035), y1 - 0.2, zs[j + 1] - 0.08, 0.06, 0.15, tc);
    }
  }
  const X0 = hx - ex + 0.07, X1 = hx + ex - 0.07, Zn = hz - sp.sg * (ez - 0.07), Zf = hz + sp.sg * (ez - 0.07);
  const pts = [...spread(sp.x + 0.64, X1, 1.5).map((x) => [x, Zn]), ...spread(Zn, Zf, 1.5).slice(1).map((z) => [X1, z]), ...spread(X1, X0, 1.5).slice(1).map((x) => [x, Zf]),
    ...spread(Zf, Zn, 1.5).slice(1).map((z) => [X0, z]), ...spread(X0, sp.x - 0.64, 1.5).slice(1).map((x) => [x, Zn])];
  railRun(G, pts, F, 1.0, tint(hex(h.trim), h.trim === '#34322f' ? 1.6 : 0.8), { side: sp.sg });
}
// the house itself (its own frame: ridge along z): boarded walls, framed windows whose panes take a lamp tone,
// a door toward the walk, a shingle roof with overhang, corner boards, a stove pipe
function houseBody(G, RF, GL, rng, f, h, sp) {
  const [wx, wz] = beside(h.z, h.off), yaw = f.yaw + (h.turn ? Math.PI / 2 : 0);
  G.frame(wx, wz, yaw); RF.frame(wx, wz, yaw); GL.frame(wx, wz, yaw);
  const a = h.sx / 2, b = h.sz / 2, F = h.floor, top = F + h.wall, m = h.m, ridge = top + 0.07 + m * a, wallC = hex(h.walls), trim = hex(h.trim);
  const walls = [[[a, -b], [a, b]], [[-a, b], [-a, -b]], [[a, b], [-a, b]], [[-a, -b], [a, -b]]];
  const doorWall = h.turn ? (sp.sg > 0 ? 0 : 1) : (sp.sg > 0 ? 3 : 2);
  walls.forEach(([P, Q], wi) => {
    const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]), d = [(Q[0] - P[0]) / L, (Q[1] - P[1]) / L], n = [d[1], -d[0]], gable = wi > 1;
    const at = (s, y, out) => [P[0] + d[0] * s + n[0] * out, y, P[1] + d[1] * s + n[1] * out], yTop = (s) => (gable ? top + m * (a - Math.abs(P[0] + d[0] * s)) : top);
    const ns = 2 * Math.ceil(L / 1.2);
    for (let i = 0; i < ns; i++) {
      const s0 = (L * i) / ns, s1 = (L * (i + 1)) / ns;
      G.face(at(s0, F, 0), at(s0, yTop(s0), 0), at(s1, yTop(s1), 0), at(s1, F, 0), tint(wallC, 0.88 + 0.24 * rng()), 0, s0 * VL, (yTop(s0) - F) * UL, s1 * VL);
    }
    const ax = Math.abs(d[0]) > 0.5, dp = 0.06, fw = 0.075;
    const stile = (s, y0, y1, wd, c = trim) => { const q = at(s, 0, dp / 2); G.beam(q[0], y0, q[2], q[0], y1, q[2], ax ? wd : dp, ax ? dp : wd, c, false); };
    const rail = (y, s0, s1, ht, out = dp, c = trim) => { const q0 = at(s0, y, out / 2), q1 = at(s1, y, out / 2); G.beam(q0[0], y, q0[2], q1[0], y, q1[2], out, ht, c); };
    const win = (t, w, hg, sill, tone) => {
      pane(GL, at(t + w / 2, sill, 0.03), at(t - w / 2, sill, 0.03), at(t - w / 2, sill + hg, 0.03), at(t + w / 2, sill + hg, 0.03), tone);
      stile(t - w / 2 - fw / 2, sill - 0.02, sill + hg + 0.02, fw); stile(t + w / 2 + fw / 2, sill - 0.02, sill + hg + 0.02, fw); stile(t, sill, sill + hg, 0.04);
      rail(sill + hg + fw / 2, t - w / 2 - fw, t + w / 2 + fw, fw); rail(sill - 0.035, t - w / 2 - fw - 0.03, t + w / 2 + fw + 0.03, 0.07, 0.1); rail(sill + hg * 0.6, t - w / 2, t + w / 2, 0.035, 0.05);
    };
    const tone = () => { const u = rng(); return u < 0.6 ? LAMP.lit : u < 0.78 ? LAMP.dim : LAMP.off; };   // one deal for all four walls
    const spots = gable ? [0.24, 0.76] : L > 9.4 ? [0.13, 0.38, 0.62, 0.87] : [0.18, 0.5, 0.82];
    for (const k of spots) { const t0 = tone(); if (wi === doorWall && Math.abs(k - 0.5) < 0.2) continue; win(L * k, gable ? 1.0 : 1.1, 1.25, F + 0.92, t0); }
    if (gable && m * a > 2.2) win(L / 2, 0.62, 0.62, top + 0.42, tone());
    if (wi === doorWall) {                                                         // the door: boards, a frame, one small light
      const t = L / 2, w = 0.96, hg = 2.05;
      G.face(at(t - w / 2, F, 0.035), at(t - w / 2, F + hg, 0.035), at(t + w / 2, F + hg, 0.035), at(t + w / 2, F, 0.035), hex(h.door), 0, 0, hg * UL, w * VL);
      stile(t - w / 2 - 0.045, F, F + hg + 0.09, 0.09); stile(t + w / 2 + 0.045, F, F + hg + 0.09, 0.09); rail(F + hg + 0.045, t - w / 2, t + w / 2, 0.09);
      pane(GL, at(t + 0.22, F + 1.38, 0.045), at(t - 0.22, F + 1.38, 0.045), at(t - 0.22, F + 1.78, 0.045), at(t + 0.22, F + 1.78, 0.045), LAMP.lit);
    }
  });
  for (const i of [-1, 1]) for (const j of [-1, 1]) G.beam(i * (a + 0.012), F, j * (b + 0.012), i * (a + 0.012), top + 0.02, j * (b + 0.012), 0.1, 0.1, trim, false);
  const dark = h.trim === '#34322f';
  pitchedRoof(G, RF, ridge, m, a + 0.55, b + 0.5, hex(h.roof), dark ? tint(trim, 1.2) : tint(trim, 0.92), tint(TONE.brown, 0.6));
  const px = -a * 0.3, pz = -b * 0.36, py = ridge - m * Math.abs(px) - 0.05;                    // a stove pipe with a cap
  G.round(px, py, pz, px, py + 1.05, pz, 0.075, 0.075, 6, [0, 1], [TONE.iron, TONE.iron], false);
  G.box(px, py + 1.09, pz, 0.04, 0.08, 0.04, TONE.iron, false); G.box(px, py + 1.145, pz, 0.26, 0.03, 0.26, TONE.iron);
}
// ---- THE REFUGE BEACON (the real Rettungsbake): four splayed legs, ties at three levels, cross braces on every
// face (one outside the ties, its partner inside the legs), a railed cage platform reached by a ladder, a short
// mast with a woven ball top-mark
function ball(G, cx, cy, cz, r, nu, nv, c1, c2) {
  const P = (a, b) => [Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a0 = (i / nu) * 6.2832, a1 = ((i + 1) / nu) * 6.2832, b0 = -1.5708 + (j / nv) * 3.1416, b1 = -1.5708 + ((j + 1) / nv) * 3.1416, c = (i + j) % 2 ? c1 : c2;
    const q = [P(a1, b0), P(a0, b0), P(a0, b1), P(a1, b1)].map((n) => G.v(cx + n[0] * r, cy + n[1] * r, cz + n[2] * r, n[0], n[1], n[2], c, 0.2, 0.1));
    G.I.push(q[0], q[1], q[2], q[0], q[2], q[3]);
  }
}
function beacon(G, rng, bz, off, S, turn) {
  const [ox, oz] = beside(bz, off); G.frame(ox, oz, lineHeading(bz) + turn);
  const yP = 6.3 * S, foot = 2.35 * S, head = 0.88 * S, col = () => tint(mix(TONE.larch, TONE.grey, 0.4 + 0.5 * rng()), 0.66 + 0.3 * rng());
  const hw = (y) => foot + ((head - foot) * (y - DEEP)) / (yP - DEEP), tc = col();
  for (const i of [-1, 1]) for (const j of [-1, 1]) leg(G, i * foot, j * foot, i * head, j * head, yP, 0.17 * S, 0.125 * S, col(), 7, false);
  const levels = [1.75 * S, 3.6 * S, 5.25 * S];
  for (const sd of [-1, 1]) {
    for (const y of levels) {
      const w1 = hw(y) + 0.2, y2 = y - 0.19, w2 = hw(y2) + 0.2;
      G.beam(-w1 - 0.25, y, sd * w1, w1 + 0.25, y, sd * w1, 0.07, 0.17, tc); G.beam(sd * w2, y2, -w2 - 0.25, sd * w2, y2, w2 + 0.25, 0.07, 0.17, tc);
    }
    for (let t = 0; t < 2; t++) {
      const y1 = levels[t] + 0.12, y2 = levels[t + 1] - 0.3, a = hw(y1), b = hw(y2), a2 = hw(y1 - 0.19), b2 = hw(y2 - 0.19);
      G.beam(-a + 0.1, y1, sd * (a + 0.275), b - 0.1, y2, sd * (b + 0.275), 0.06, 0.15, tc); G.beam(-b + 0.1, y2, sd * (b - 0.19), a - 0.1, y1, sd * (a - 0.19), 0.06, 0.15, tc);
      G.beam(sd * (a2 + 0.275), y1 - 0.19, -a2 + 0.1, sd * (b2 + 0.275), y2 - 0.19, b2 - 0.1, 0.06, 0.15, tc); G.beam(sd * (b2 - 0.19), y2 - 0.19, -b2 + 0.1, sd * (a2 - 0.19), y1 - 0.19, a2 - 0.1, 0.06, 0.15, tc);
    }
    G.beam(-1.25 * S, yP + 0.09, sd * head, 1.25 * S, yP + 0.09, sd * head, 0.16, 0.18, col());           // bearers on the legs' heads
  }
  const hp = 1.2 * S, yD = yP + 0.35;
  for (const x of [-hp + 0.1, 0, hp - 0.1]) G.beam(x, yP + 0.24, -hp, x, yP + 0.24, hp, 0.08, 0.12, tc);
  slab(G, -hp, -hp, hp, hp, yD, 0.05, tint(TONE.grey, 0.85), false);
  const c = hp - 0.07, cage = [...spread(0.36, c, 0.8).map((x) => [x, -c]), ...spread(-c, c, 0.8).slice(1).map((z) => [c, z]), ...spread(c, -c, 0.8).slice(1).map((x) => [x, c]),
    ...spread(c, -c, 0.8).slice(1).map((z) => [-c, z]), ...spread(-c, -0.36, 0.8).slice(1).map((x) => [x, -c])];
  railRun(G, cage, yD, 1.05, tint(TONE.grey, 0.8), { side: -1 });
  const lz = (y) => -(hw(Math.min(y, yP)) + 0.43), yL = yD + 1.0, lc = tint(TONE.grey, 0.75);              // the ladder up the -z face
  for (const sd of [-1, 1]) {
    G.beam(sd * 0.27, DEEP, lz(DEEP), sd * 0.27, 0.45, lz(0.45), 0.05, 0.1, TONE.wet, false);
    G.beam(sd * 0.27, 0.45, lz(0.45), sd * 0.27, yL, lz(yL), 0.05, 0.1, lc);
  }
  for (let y = 0.55; y < yD; y += 0.3) G.beam(-0.245, y, lz(y), 0.245, y, lz(y), 0.04, 0.04, lc, false);
  const mt = yD + 1.75 * S;
  G.round(0, yD, 0, 0, mt, 0, 0.085, 0.06, 6, [0, 1], [tc, tc], false);
  ball(G, 0, mt + 0.3 * S, 0, 0.42 * S, 10, 6, tint(TONE.brown, 0.55), tint(TONE.brown, 0.3));
}
// ---- A WITHY: a birch sapling stuck in the flat, tar-dark, a broom of twigs at its top
function withy(G, rng, x, z) {
  G.frame(x, z, rng() * 6.28);
  const H = 3 + rng(), lx = (rng() - 0.5) * 0.5, lz = (rng() - 0.5) * 0.5, dark = tint(TONE.tar, 0.7 + 0.5 * rng()), n = 11 + Math.floor(rng() * 4);
  const at = (t) => [lx * t, DEEP + (H - DEEP) * t, lz * t], b0 = at(0.58), b1 = at(0.84), b2 = at(1.07);
  G.round(0, DEEP, 0, lx, H, lz, 0.04, 0.015, 5, [0, (0.2 - DEEP) / (H - DEEP), 1], [TONE.wet, dark, dark], false);
  G.round(b0[0], b0[1], b0[2], b1[0], b1[1], b1[2], 0.014, 0.09, 5, [0, 1], [dark, dark], false);
  G.round(b1[0], b1[1], b1[2], b2[0], b2[1], b2[2], 0.09, 0.004, 5, [0, 1], [dark, tint(dark, 1.3)], false);
  for (let i = 0; i < 15; i++) {                                                 // every twig's dice are drawn; n of them stand
    const t = 0.55 + 0.4 * rng(), an = rng() * 6.28, sp = 0.16 + 0.3 * rng(), len = 0.55 + 0.7 * rng(), p = at(t);
    if (i < n) G.round(p[0], p[1], p[2], p[0] + Math.cos(an) * sp * len, p[1] + len, p[2] + Math.sin(an) * sp * len, 0.024, 0.007, 3, [0, 1], [dark, tint(dark, 1.25)], false);
  }
}

// ---- the withies' places: one every 9 m along the tidal channel (the law's channelZ; design 7c), 16 west, 12 east
const WITHY_OFFS = (() => { const st = 9 / Math.hypot(1, 0.45), a = []; for (let i = 0; i < 16; i++) a.push(-16 - i * st); for (let i = 0; i < 12; i++) a.push(14 + i * st); return a; })();
const BEACONS = [{ z: BEACON.z, off: BEACON.off, scale: 1 }, { z: -620, off: 210, scale: 1.08 }];   // the near one is the law's (the island's landing); the far one stands out on the east flats
const LAMP_GAIN = 6;                                    // the emissive strength of lit glass at full night (bloom does the rest)

export async function buildWorks(ctx, opts = {}) {
  const core = ctx.core, path = opts.path;
  const R = (name) => core.makeRng(core.hashSeed('works:' + name + ':' + ctx.seed));
  const vary = ctx.vary || {}, dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1)), detail = Math.min(1, Math.max(0.5, (ctx.quality && ctx.quality.detail) ?? 1));
  // the level distance from the route; behind the entry the opening's camera flies the entry frame's level axis
  const p0 = path.start, t0 = path.startTangent, tl = Math.hypot(t0.x, t0.z) || 1;
  const routeDist = (x, z) => {
    const ax = x - p0.x, az = z - p0.z;
    return ax * t0.x + az * t0.z < 0 ? Math.abs(ax * t0.z - az * t0.x) / tl : path.nearestXZ(x, z).dist;
  };
  // what the stake rows keep 12 m clear of: every withy (the channel runs through the rows), the beacons, the ring
  const withies = WITHY_OFFS.map((off) => beside(channelZ(off), off));
  const clear = withies.map(([x, z]) => [x, z, 12.6]);
  for (const b of BEACONS) { const [x, z] = beside(b.z, b.off); clear.push([x, z, 15.5]); }
  clear.push([RING.x, RING.z, 32]);
  const lost = (x, z) => { for (const k of clear) { const dx = x - k[0], dz = z - k[1]; if (dx * dx + dz * dz < k[2] * k[2]) return true; } return false; };

  const texs = [woodTexture(R('wood'), ctx.renderer)]; await ctx.yield();
  texs.push(shingleTexture(R('shingle'), ctx.renderer), lampTexture(), combTexture(R('comb'), ctx.renderer)); await ctx.yield();
  const matWood = new THREE.MeshStandardMaterial({ vertexColors: true, map: texs[0], roughness: 0.93, metalness: 0 });
  const matRoof = new THREE.MeshStandardMaterial({ vertexColors: true, map: texs[1], roughness: 0.88, metalness: 0 });
  const matGlass = new THREE.MeshStandardMaterial({ color: '#1d2b38', roughness: 0.2, metalness: 0, emissive: '#ffffff', emissiveMap: texs[2], emissiveIntensity: 0 });
  const matBrush = new THREE.MeshStandardMaterial({ vertexColors: true, map: texs[0], roughness: 1, metalness: 0, side: THREE.DoubleSide });   // twig ends are single faces
  const matStrip = new THREE.MeshStandardMaterial({ vertexColors: true, map: texs[3], alphaTest: 0.3, roughness: 1, metalness: 0, side: THREE.DoubleSide });   // the stake comb
  const mats = [matWood, matRoof, matGlass, matBrush, matStrip], geos = [];
  const object = new THREE.Group(); object.name = 'railway-under-the-sea: works of the flats';
  await ctx.yield();

  // the groynes
  const want = Math.min(MAX_STAKES - 60, Math.round(4350 * dens * (0.7 + 0.3 * (detail - 0.5) / 0.5)));
  const gr = await buildGroynes(ctx, R, routeDist, lost, want);
  await ctx.yield();
  const hs = core.hashSeed('works:twigs:' + ctx.seed) | 0;                       // a pure dice of (row, slot, twig): nothing is drawn and thrown away
  const hash = (a, b, c) => { let h = (hs + Math.imul(a + 1, 374761393) + Math.imul(b + 1, 668265263) + Math.imul(c + 1, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const gm = await groyneMeshes(ctx, gr, matWood, matBrush, matStrip, hash);
  for (const m of gm.meshes) object.add(m);
  geos.push(...gm.geos);
  await ctx.yield();

  // the timber works: the flats (withies, beacons); the halt and the walk; the houses; roofs; lit glass
  const GF = new Geo(), GH = new Geo(), GS = new Geo(), RF = new Geo(), GL = new Geo();
  { const rng = R('withies'); for (const [x, z] of withies) withy(GF, rng, x, z); }
  await ctx.yield();
  BEACONS.forEach((b, i) => beacon(GF, R('beacon' + i), b.z, b.off, b.scale, i ? -0.5 : 0.35));
  await ctx.yield();
  buildHalt(GH, R('halt')); buildShelter(GH, RF, GL, R('shelter'));
  await ctx.yield();
  const f = walkFrame();
  const spurs = HOUSES.map((h) => {
    const [hx, hz] = inWalk(f, ...beside(h.z, h.off)), sg = hz > 0 ? 1 : -1, ex = (h.turn ? h.sz : h.sx) / 2 + h.gal, ez = (h.turn ? h.sx : h.sz) / 2 + h.gal, zg = hz - sg * ez;
    return { hx, hz, ex, ez, sg, x: hx + h.stairX, zg, zs: zg - (sg * (h.floor - DECK)) / 0.78, floor: h.floor };
  });
  buildWalk(GH, R('walk'), f, spurs);
  await ctx.yield();
  for (let i = 0; i < HOUSES.length; i++) { const rng = R('house' + i); houseBase(GS, rng, f, HOUSES[i], spurs[i]); houseBody(GS, RF, GL, rng, f, HOUSES[i], spurs[i]); await ctx.yield(); }
  const mesh = (G, mat, name) => { const geo = G.build(); geos.push(geo); const m = new THREE.Mesh(geo, mat); m.name = name; object.add(m); return m; };
  mesh(GF, matWood, 'works: withies and beacons'); mesh(GH, matWood, 'works: halt and boardwalk'); mesh(GS, matWood, 'works: stilt houses');
  mesh(RF, matRoof, 'works: roofs'); mesh(GL, matGlass, 'works: lit glass');
  await ctx.yield();

  let night = -1;
  return {
    object,
    setNight(n) { n = n < 0 ? 0 : n > 1 ? 1 : n; if (n !== night) { night = n; matGlass.emissiveIntensity = LAMP_GAIN * n; } },
    dispose() { for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); for (const t of texs) t.dispose(); },
  };
}
