// THE COURTS IN THE ATTICS: the gates of the law and the makers the world shares with them.
// The hero: a plain gate standing open in a high blank wall, a keeper on his feet beside it, a head taller than a man
// (a long fur coat, a large sharp nose, a long thin dark beard; he carries nothing but a plain staff), and by him the
// old man on his stool; behind it a hall and a second gate with a mightier keeper, and a third, vaster still; behind
// the third the last court of the law (the law's own innermost office: shelves of files up its walls, ladders, plain
// dark curtains, this world's oil lamps on brackets and chains, benches, lecterns, and the people small and many) and
// its great door, from which a radiance streams out over all of them. Built at three times life.
// NO FIGURE REGARDS THE VISITOR: every pose, turn and motion of a figure is worked out from the world's clock and the
// figure's own number, and nothing else (the eye's place is read by its shader for the sheen of its shading alone).
// Everything here is lit without three.js lights: light is worked out once, in build, at every corner of every
// triangle (lamps, skylight beams, the radiance, soft contact shade), and the one shader of the place multiplies it
// with a material drawn in the fragment (wood grain, stone courses, slate, paper, cloth, fur). No lettering anywhere.
// Exports: buildHero (the gates), makeBatch (geometry with baked light), makeLighter, courtUniforms, courtMaterial,
// makePeople (the court's people: carved forms that rise, bow, turn their heads on habits of their own, write, carry), figure geometries.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const TAU = Math.PI * 2;
export const S = 3;
export const MAN = 1.75 * S;
// ONE MEASURE JOINS A SEAT AND ITS SITTER. The seated pose of the figure (FIG_VERT below: the thighs laid level, the
// body let down by 0.21) carries the underside of the thighs SITK of the figure's height over his soles; a seat's top
// stands SEAT over its floor (the thighs of a full-grown man), and one who sits is dealt to his seat's top: his soles
// are SITK of his own height under it (a short man's feet hang a little clear of the floor). One who sits on a step
// has his knees up and his soles on the tread below: his thighs at the hip are STEPK of his height over his soles
// (the body let down by 0.34, the thighs raised 29 degrees), so a tread of a man's rise is his seat.
export const SITK = 0.225, STEPK = 0.095, SEAT = SITK * MAN;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const PAL = {
  sky: lin('#8a7f72'), shade: lin('#3b3229'), wood: lin('#b08a5a'), paper: lin('#e9dfc8'), soot: lin('#1b1a1c'),
  slate: lin('#7c8794'), rad: lin('#ffe2a0'),
};
// what a surface is made of (drawn in the fragment)
export const K = { PLAIN: 0, WOOD: 1, STONE: 2, PAPER: 3, CLOTH: 4, SLATE: 5, FUR: 6, GLOW: 7, PICTURE: 8, METAL: 9, GLASS: 10, LATTICE: 11, STAINED: 12, WEB: 13, SHELF: 14 };

// ------------------------------------------------------------------------------------------------ geometry with baked light
// One batch is one mesh in world space. Every triangle is flat; its light is worked out at each corner by the batch's
// lighter (x, y, z, nx, ny, nz, out). T is the coordinate the material is drawn in: wood grain runs along T.z.
const BX = Array.from({ length: 8 }, () => [0.5, 0.5, 0.5]), BQ = Array.from({ length: 8 }, () => [0.5, 0.5, 0.5]);
export function makeBatch(cap = 1 << 14) {
  let P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), L = new Float32Array(cap * 3), Sf = new Float32Array(cap * 4), T = new Float32Array(cap * 3);
  let n = 0, M = null, lighter = null, toff = 0;
  const col = [1, 1, 1], sf = [0, 0, 0, 0], tx = [0, 1, 2], out = [1, 1, 1];
  const a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), c3 = new THREE.Vector3(), d3 = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3();
  const mk = new Float64Array(1024 * 6), mv = new Float64Array(1024 * 3), mg = new Int32Array(1024); let gen = 1;
  const grow = () => {
    cap *= 2;
    const g = (A, k) => { const B = new Float32Array(cap * k); B.set(A); return B; };
    P = g(P, 3); N = g(N, 3); C = g(C, 3); L = g(L, 3); Sf = g(Sf, 4); T = g(T, 3);
  };
  const put = (w, t) => {
    if (n >= cap) grow();
    const i = n * 3;
    P[i] = w.x; P[i + 1] = w.y; P[i + 2] = w.z; N[i] = nn.x; N[i + 1] = nn.y; N[i + 2] = nn.z;
    C[i] = col[0]; C[i + 1] = col[1]; C[i + 2] = col[2];
    if (lighter) {
      // (a corner that several triangles of one face share is lit once: the last corners lit are kept by place, facing
      // and lighter, and the same numbers are given again where the place is the same and the facing the same to a
      // millionth; b.light begins anew)
      const x = w.x, y = w.y, z = w.z, nx = nn.x, ny = nn.y, nz = nn.z;
      const h = (Math.imul((x * 1024) | 0, 73856093) ^ Math.imul((y * 1024) | 0, 19349663) ^ Math.imul((z * 1024) | 0, 83492791) ^ Math.imul(Math.round(nx * 24) + Math.round(ny * 24) * 64 + Math.round(nz * 24) * 4096, 40503)) & 1023, k = h * 6;
      if (mg[h] === gen && mk[k] === x && mk[k + 1] === y && mk[k + 2] === z && Math.abs(mk[k + 3] - nx) < 1e-6 && Math.abs(mk[k + 4] - ny) < 1e-6 && Math.abs(mk[k + 5] - nz) < 1e-6) { out[0] = mv[h * 3]; out[1] = mv[h * 3 + 1]; out[2] = mv[h * 3 + 2]; }
      else {
        lighter(x, y, z, nx, ny, nz, out);
        mg[h] = gen; mk[k] = x; mk[k + 1] = y; mk[k + 2] = z; mk[k + 3] = nx; mk[k + 4] = ny; mk[k + 5] = nz; mv[h * 3] = out[0]; mv[h * 3 + 1] = out[1]; mv[h * 3 + 2] = out[2];
      }
    } else { out[0] = out[1] = out[2] = 1; }
    L[i] = out[0]; L[i + 1] = out[1]; L[i + 2] = out[2];
    T[i] = t[tx[0]] + toff; T[i + 1] = t[tx[1]]; T[i + 2] = t[tx[2]];
    Sf[n * 4] = sf[0]; Sf[n * 4 + 1] = t.length > 3 ? t[3] : sf[1]; Sf[n * 4 + 2] = sf[2]; Sf[n * 4 + 3] = sf[3];
    n++;
  };
  const b = {
    get triangles() { return n / 3; },
    col(c, k = 1) { col[0] = c[0] * k; col[1] = c[1] * k; col[2] = c[2] * k; return b; },
    surf(id, p1 = 0, p2 = 0, p3 = 0) { sf[0] = id; sf[1] = p1; sf[2] = p2; sf[3] = p3; return b; },
    tr(m) { M = m; return b; },
    light(fn) { lighter = fn; gen++; return b; },
    // which of a point's own coordinates go to T.x, T.y, T.z (0 x, 1 y, 2 z)
    tex(i0 = 0, i1 = 1, i2 = 2) { tx[0] = i0; tx[1] = i1; tx[2] = i2; return b; },
    piece() { toff = (toff + 7.31) % 97; return b; },
    tri(pa, pb, pc, ta = pa, tb = pb, tc = pc) {
      a3.set(pa[0], pa[1], pa[2]); b3.set(pb[0], pb[1], pb[2]); c3.set(pc[0], pc[1], pc[2]);
      if (M) { a3.applyMatrix4(M); b3.applyMatrix4(M); c3.applyMatrix4(M); }
      e1.subVectors(b3, a3); e2.subVectors(c3, a3); nn.crossVectors(e1, e2);
      const l = nn.length(); if (l < 1e-9) return b;
      nn.multiplyScalar(1 / l);
      put(a3, ta); put(b3, tb); put(c3, tc);
      return b;
    },
    // a, b, c, d counter-clockwise seen from the lit side
    quad(pa, pb, pc, pd, ta = pa, tb = pb, tc = pc, td = pd) { b.tri(pa, pb, pc, ta, tb, tc); b.tri(pa, pc, pd, ta, tc, td); return b; },
    // a sheet of nu x nv cells; f(u, v, o) writes the point (and, as o[3], the corner's own first surface number, such as how
    // freely cloth swings there); flip turns the lit side
    grid(nu, nv, f, flip = false) {
      const row = [], pts = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const o = [0, 0, 0]; f(i / nu, j / nv, o); pts.push(o); }
      const at = (i, j) => pts[j * (nu + 1) + i];
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const p00 = at(i, j), p10 = at(i + 1, j), p11 = at(i + 1, j + 1), p01 = at(i, j + 1);
        if (flip) b.quad(p00, p01, p11, p10); else b.quad(p00, p10, p11, p01);
      }
      return b;
    },
    // a flat sheet from a corner o along two edges eu and ev, in cells of about `cell`, lit on the side `want` points to
    sheet(o, eu, ev, cell, want) {
      const lu = Math.hypot(eu[0], eu[1], eu[2]), lv = Math.hypot(ev[0], ev[1], ev[2]);
      if (lu < 1e-4 || lv < 1e-4) return b;
      const cx = eu[1] * ev[2] - eu[2] * ev[1], cy = eu[2] * ev[0] - eu[0] * ev[2], cz = eu[0] * ev[1] - eu[1] * ev[0];
      const flip = cx * want[0] + cy * want[1] + cz * want[2] < 0;
      return b.grid(Math.max(1, Math.round(lu / cell)), Math.max(1, Math.round(lv / cell)), (u, v, p) => { p[0] = o[0] + eu[0] * u + ev[0] * v; p[1] = o[1] + eu[1] * u + ev[1] * v; p[2] = o[2] + eu[2] * u + ev[2] * v; }, flip);
    },
    // a box by its middle and its three sizes; the grain runs along its longest side (its eight corners are worked
    // out once, in arrays kept for the purpose: BX the places, BQ the box's own coordinates; corner i: bit 0 +x, bit 1 +y, bit 2 +z)
    box(cx, cy, cz, w, h, d, yaw = 0) {
      const hx = w / 2, hy = h / 2, hz = d / 2, ca = Math.cos(yaw), sa = Math.sin(yaw), k0 = tx[0], k1 = tx[1], k2 = tx[2];
      if (w >= h && w >= d) b.tex(2, 1, 0); else if (h >= w && h >= d) b.tex(0, 2, 1); else b.tex(0, 1, 2);
      for (let i = 0; i < 8; i++) { const x = i & 1 ? hx : -hx, y = i & 2 ? hy : -hy, z = i & 4 ? hz : -hz, p = BX[i], q = BQ[i]; p[0] = cx + x * ca + z * sa; p[1] = cy + y; p[2] = cz - x * sa + z * ca; q[0] = x; q[1] = y; q[2] = z; }
      b.piece();
      b.quad(BX[4], BX[5], BX[7], BX[6], BQ[4], BQ[5], BQ[7], BQ[6]); b.quad(BX[1], BX[0], BX[2], BX[3], BQ[1], BQ[0], BQ[2], BQ[3]);
      b.quad(BX[5], BX[1], BX[3], BX[7], BQ[5], BQ[1], BQ[3], BQ[7]); b.quad(BX[0], BX[4], BX[6], BX[2], BQ[0], BQ[4], BQ[6], BQ[2]);
      b.quad(BX[6], BX[7], BX[3], BX[2], BQ[6], BQ[7], BQ[3], BQ[2]); b.quad(BX[0], BX[1], BX[5], BX[4], BQ[0], BQ[1], BQ[5], BQ[4]);
      tx[0] = k0; tx[1] = k1; tx[2] = k2;
      return b;
    },
    // a round bar from pa to pb, radii r0 and r1; the grain runs along it
    rod(pa, pb, r0, r1 = r0, seg = 6, caps = false) {
      const ax = e1.set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]), len = ax.length(); if (len < 1e-6) return b;
      const u = new THREE.Vector3(ax.x / len, ax.y / len, ax.z / len), v = new THREE.Vector3(), w = new THREE.Vector3();
      v.set(Math.abs(u.y) > 0.9 ? 1 : 0, Math.abs(u.y) > 0.9 ? 0 : 1, 0).cross(u).normalize(); w.crossVectors(u, v);
      const ring = (p, r, k) => [p[0] + (v.x * Math.cos(k) + w.x * Math.sin(k)) * r, p[1] + (v.y * Math.cos(k) + w.y * Math.sin(k)) * r, p[2] + (v.z * Math.cos(k) + w.z * Math.sin(k)) * r];
      b.piece();
      for (let i = 0; i < seg; i++) {
        const k0 = i / seg * TAU, k1 = (i + 1) / seg * TAU;
        const A = ring(pa, r0, k0), B = ring(pa, r0, k1), Cc = ring(pb, r1, k1), D = ring(pb, r1, k0);
        b.quad(A, B, Cc, D, [k0 * r0, 0, 0], [k1 * r0, 0, 0], [k1 * r0, 0, len], [k0 * r0, 0, len]);
        if (caps) { b.tri(pb, D, Cc, [0, 0, len], [k0, 0, len], [k1, 0, len]); b.tri(pa, B, A, [0, 0, 0], [k1, 0, 0], [k0, 0, 0]); }
      }
      return b;
    },
    // a turned shape round the y axis at (cx, cz): profile of [radius, height]
    lathe(prof, seg, cx = 0, cz = 0, sx = 1, sz = 1) {
      b.piece();
      for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < seg; i++) {
        const k0 = i / seg * TAU, k1 = (i + 1) / seg * TAU, r0 = prof[j][0], y0 = prof[j][1], r1 = prof[j + 1][0], y1 = prof[j + 1][1];
        const A = [cx + Math.sin(k0) * r0 * sx, y0, cz + Math.cos(k0) * r0 * sz], B = [cx + Math.sin(k1) * r0 * sx, y0, cz + Math.cos(k1) * r0 * sz];
        const Cc = [cx + Math.sin(k1) * r1 * sx, y1, cz + Math.cos(k1) * r1 * sz], D = [cx + Math.sin(k0) * r1 * sx, y1, cz + Math.cos(k0) * r1 * sz];
        const ta = [k0 * 2, y0, 0], tb = [k1 * 2, y0, 0], tc = [k1 * 2, y1, 0], td = [k0 * 2, y1, 0];
        if (r0 < 1e-5) b.tri(A, Cc, D, ta, tc, td); else if (r1 < 1e-5) b.tri(A, B, Cc, ta, tb, tc); else b.quad(A, B, Cc, D, ta, tb, tc, td);
      }
      return b;
    },
    build() {
      // (a batch more than half full gives its own arrays, cut to length without a copy; a emptier one is copied small)
      const g = new THREE.BufferGeometry(), cutTo = (A, k) => (n * 2 > cap ? A.subarray(0, n * k) : A.slice(0, n * k));
      g.setAttribute('position', new THREE.BufferAttribute(cutTo(P, 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(cutTo(N, 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(cutTo(C, 3), 3)); g.setAttribute('aL', new THREE.BufferAttribute(cutTo(L, 3), 3));
      g.setAttribute('aS', new THREE.BufferAttribute(cutTo(Sf, 4), 4)); g.setAttribute('aT', new THREE.BufferAttribute(cutTo(T, 3), 3));
      return g;
    },
  };
  return b;
}

// A built geometry in n pieces: pick(x, y, z) of each triangle's middle names the piece it goes to.
export function splitGeometry(geo, n, pick) {
  const P = geo.getAttribute('position').array, tri = P.length / 9, which = new Uint8Array(tri), count = new Array(n).fill(0);
  for (let t = 0, i = 0; t < tri; t++, i += 9) { const k = pick((P[i] + P[i + 3] + P[i + 6]) / 3, (P[i + 1] + P[i + 4] + P[i + 7]) / 3, (P[i + 2] + P[i + 5] + P[i + 8]) / 3); which[t] = k; count[k]++; }
  const out = [];
  for (let k = 0; k < n; k++) {
    const g = new THREE.BufferGeometry();
    for (const name of Object.keys(geo.attributes)) {
      const A = geo.getAttribute(name), sz = A.itemSize * 3, src = A.array, dst = new src.constructor(count[k] * sz);
      for (let t = 0, o = 0; t < tri; t++) if (which[t] === k) { dst.set(src.subarray(t * sz, (t + 1) * sz), o); o += sz; }
      g.setAttribute(name, new THREE.BufferAttribute(dst, A.itemSize));
    }
    out.push(g);
  }
  return out;
}
// The same in pieces of work: it hands back to the engine (breathe is the build's own yield) after the triangles are told
// apart and after every array it fills, so that no step of it is long; what it returns is the same to the last bit.
export async function splitGeometryAsync(geo, n, pick, breathe) {
  const P = geo.getAttribute('position').array, tri = P.length / 9, which = new Uint8Array(tri), count = new Array(n).fill(0);
  for (let t = 0, i = 0; t < tri; t++, i += 9) { const k = pick((P[i] + P[i + 3] + P[i + 6]) / 3, (P[i + 1] + P[i + 4] + P[i + 7]) / 3, (P[i + 2] + P[i + 5] + P[i + 8]) / 3); which[t] = k; count[k]++;
    if ((t & 32767) === 32767) await breathe(); }
  await breathe();
  const out = [];
  for (let k = 0; k < n; k++) {
    const g = new THREE.BufferGeometry();
    for (const name of Object.keys(geo.attributes)) {
      const A = geo.getAttribute(name), sz = A.itemSize * 3, src = A.array, dst = new src.constructor(count[k] * sz);
      for (let t = 0, o = 0; t < tri; t++) if (which[t] === k) { dst.set(src.subarray(t * sz, (t + 1) * sz), o); o += sz; }
      g.setAttribute(name, new THREE.BufferAttribute(dst, A.itemSize));
      await breathe();
    }
    out.push(g);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ the light of one room
// o: { up, down (ambient from above and below), lamps: [[x, y, z, r, g, b, reach]], beams: [{ c: [x,y,z], d: [x,y,z] (the way
//      the light travels), a: [x,y,z], ha, b: [x,y,z], hb (the two half sizes of the opening along unit axes a and b), col, soft }],
//      occ: [[x, z, radius]] (things that stand on the floor at floorY and shade it), floorY, gain }
export function makeLighter(o) {
  const up = o.up || [0.2, 0.2, 0.2], dn = o.down || [0.08, 0.08, 0.08], lamps = o.lamps || [], beams = o.beams || [], occ = o.occ || [], fy = o.floorY ?? 0, gain = o.gain ?? 1;
  // high: light that gathers under a roof, { y0, y1, col }
  // cut: a lamp's light ends at cut times its reach (a small flame in a big dark room lights a pool, not the room)
  // wrap: how far round a timber a lamp's light reaches (0.25 unless given)
  const hi = o.high || null, cut = o.cut || 0, wrap = o.wrap ?? 0.25;
  // (the lamps laid out flat, nine numbers each: place, colour, reach, reach squared, and the square of how far it counts;
  // laid out again whenever the list has grown)
  // A room of many lamps: the room is taken in cells of CELL metres, each cell knowing every lamp whose light can
  // reach into it, so that a corner asks only the lamps of its own cell (a lamp that carries further than five cells is
  // asked by every corner). A cell's list is made when its first corner asks (most cells of a room hold no corner).
  // The light is the same to the last lamp; only the asking is shorter.
  let F = null, nF = -1, cells = null, wide = null, narrow = null, FAR = null, CELL = 1;
  const flat = () => {
    nF = lamps.length; F = new Float64Array(nF * 9);
    for (let i = 0; i < nF; i++) { const q = lamps[i], R2 = q[6] * q[6], j = i * 9; F[j] = q[0]; F[j + 1] = q[1]; F[j + 2] = q[2]; F[j + 3] = q[3]; F[j + 4] = q[4]; F[j + 5] = q[5]; F[j + 6] = q[6]; F[j + 7] = R2; F[j + 8] = R2 * (cut ? cut * cut : 30); }
    cells = null;
    if (nF < 10) return;
    FAR = new Float64Array(nF); for (let i = 0; i < nF; i++) FAR[i] = Math.sqrt(F[i * 9 + 8]);
    // (a cell is a third of the middle lamp's carry: a corner then asks the lamps within one carry of it, and few more)
    CELL = Math.max(6, Array.from(FAR).sort((a, b) => a - b)[nF >> 1] / 3);
    const w = [], nr = [];
    for (let i = 0; i < nF; i++) (FAR[i] > 5 * CELL ? w : nr).push(i);
    cells = new Map(); wide = Int32Array.from(w); narrow = Int32Array.from(nr);
  };
  // (the lamps, in their own order, whose carry reaches into the cell cx, cy, cz)
  const listOf = (key, cx, cy, cz) => {
    const l = [];
    for (let k = 0; k < narrow.length; k++) {
      const i = narrow[k], j = i * 9, f = FAR[i];
      if (Math.floor((F[j] - f) / CELL) <= cx && cx <= Math.floor((F[j] + f) / CELL) && Math.floor((F[j + 1] - f) / CELL) <= cy && cy <= Math.floor((F[j + 1] + f) / CELL) && Math.floor((F[j + 2] - f) / CELL) <= cz && cz <= Math.floor((F[j + 2] + f) / CELL)) l.push(i);
    }
    const a = Int32Array.from(l); cells.set(key, a); return a;
  };
  return (x, y, z, nx, ny, nz, out) => {
    const h = 0.5 + 0.5 * ny;
    let r = dn[0] + (up[0] - dn[0]) * h, g = dn[1] + (up[1] - dn[1]) * h, bl = dn[2] + (up[2] - dn[2]) * h;
    if (nF !== lamps.length) flat();
    let near = null;
    if (cells) { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL), key = (cx + 2048) + (cy + 2048) * 4096 + (cz + 2048) * 16777216; near = cells.get(key) || listOf(key, cx, cy, cz); }
    const nW = cells ? wide.length : 0, nA = cells ? nW + near.length : nF;
    for (let i = 0; i < nA; i++) {
      const j = (cells ? (i < nW ? wide[i] : near[i - nW]) : i) * 9;
      const dx = F[j] - x, dy = F[j + 1] - y, dz = F[j + 2] - z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > F[j + 8]) continue;
      const R2 = F[j + 7], d = Math.sqrt(d2) + 1e-4, ndl = Math.max(((nx * dx + ny * dy + nz * dz) / d) * (1 - wrap) + wrap, 0), k = ndl / (1 + d2 / R2) * (cut ? 1 - smoothstep(F[j + 6] * cut * 0.5, F[j + 6] * cut, d) : 1);
      r += F[j + 3] * k; g += F[j + 4] * k; bl += F[j + 5] * k;
    }
    for (let i = 0; i < beams.length; i++) {
      const q = beams[i], px = x - q.c[0], py = y - q.c[1], pz = z - q.c[2], t = px * q.d[0] + py * q.d[1] + pz * q.d[2];
      if (t < 0) continue;
      const qx = px - t * q.d[0], qy = py - t * q.d[1], qz = pz - t * q.d[2];
      const ua = Math.abs(qx * q.a[0] + qy * q.a[1] + qz * q.a[2]), ub = Math.abs(qx * q.b[0] + qy * q.b[1] + qz * q.b[2]), s = q.soft ?? 1.4;
      if (ua > q.ha + s || ub > q.hb + s) continue;
      // (len: how far the beam carries before it is spent)
      const m = (1 - smoothstep(q.ha - s, q.ha + s, ua)) * (1 - smoothstep(q.hb - s, q.hb + s, ub)) * (q.len ? 1 - smoothstep(q.len * 0.3, q.len, t) : 1);
      const k = m * Math.max(-(nx * q.d[0] + ny * q.d[1] + nz * q.d[2]), 0.12);
      r += q.col[0] * k; g += q.col[1] * k; bl += q.col[2] * k;
    }
    if (ny > 0.5 && y < fy + 0.5) {
      let ao = 1;
      for (let i = 0; i < occ.length; i++) { const q = occ[i], dx = q[0] - x, dz = q[1] - z, d2 = dx * dx + dz * dz, R2 = q[2] * q[2]; if (d2 < R2 * 4) ao *= 1 - 0.62 * Math.exp(-d2 / R2 * 1.6); }
      r *= ao; g *= ao; bl *= ao;
    }
    if (hi) { const t = smoothstep(hi.y0, hi.y1, y); r += hi.col[0] * t; g += hi.col[1] * t; bl += hi.col[2] * t; }
    out[0] = r * gain; out[1] = g * gain; out[2] = bl * gain;
  };
}

// ------------------------------------------------------------------------------------------------ the shader of the place
export function courtUniforms() {
  return {
    uTime: { value: 0 },
    // rgb of the air the far things sink into, and how thick it is: the air of the PLACE a thing stands in (each piece of
    // the world has its own material, with its own uFog; nothing changes it in flight). Where one piece reaches out of
    // one air into another (the gates: out of the cathedral's dark into the court's grey), uFogB is the second air, and
    // how deep a thing stands beyond the plane uFogP (over uFogS metres) tells its share; uFogS 0: one air
    uFog: { value: new THREE.Vector4(0.1, 0.1, 0.1, 0.004) },
    uFogB: { value: new THREE.Vector4(0.1, 0.1, 0.1, 0.004) }, uFogP: { value: new THREE.Vector4(0, 0, 0, 0) }, uFogS: { value: 0 },
    // how far the warm share of the baked light breathes (a place's own number, never changed in flight)
    uBreath: { value: 0.5 },
    // the sky the wet slates and the panes mirror
    uSky: { value: new THREE.Vector3(0.25, 0.23, 0.2) },
    // the break in the cloud over the roofs, where the sky has one (its place in the sky, its colour): the wet slates mirror it
    uBreak: { value: new THREE.Vector3(0, 1, 0) }, uBreakC: { value: new THREE.Vector3(0, 0, 0) },
    // where on the route the visitor is (worked out from u each frame). ONE thing reads it: dust is not drawn further
    // than uFar from it (what is drawn). No light, no shaft and no mote gives way by it: a shaft and a mote keep off
    // the LINE by their own place, the same at every moment (aG, iG).
    uEye: { value: new THREE.Vector3() },
    // 1 on the rare visit when every door of the long corridor stands open
    uOpen: { value: 0 },
    // the six lights the floors and the polished wood mirror (x, y, z, reach) and their colours: set once, in build
    uGl: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -1000, 0, 1)) }, uGlC: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()) },
  };
}
export const COURT_NOISE = /* glsl */`
float cHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float cNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(cHash(i), cHash(i + vec2(1., 0.)), f.x), mix(cHash(i + vec2(0., 1.)), cHash(i + vec2(1., 1.)), f.x), f.y); }
float cFbm(vec2 p){ return .5 * cNoise(p) + .3 * cNoise(p * 2.3 + 7.1) + .2 * cNoise(p * 5.1 + 3.7); }
`;
const COURT_VERT = /* glsl */`
attribute vec3 aL; attribute vec4 aS; attribute vec3 aT;
uniform float uTime;
varying vec3 vC, vL, vT, vN, vW; varying vec4 vS;
void main(){
  vC = color; vL = aL; vS = aS; vT = aT; vN = normal;
  vec3 p = position;
  // cloth that hangs stirs: aS.y is how freely this corner swings
  float id = floor(aS.x + .5);
  if (id == 4.) p += normal * (sin(uTime * 1.1 + aT.x * .7 + aT.z * .9) + .5 * sin(uTime * 2.3 + aT.x * 1.9)) * aS.y * .22;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const COURT_FRAG = /* glsl */`
uniform float uTime, uFogS, uBreath; uniform vec4 uFog, uFogB, uFogP; uniform vec3 uSky, uBreak, uBreakC; uniform vec4 uGl[6]; uniform vec3 uGlC[6];
varying vec3 vC, vL, vT, vN, vW; varying vec4 vS;
${COURT_NOISE}
// the same clouds, each finer share of them dying out as it nears the size of one dot of the picture (pp: a dot, in p's measure)
float cFbmA(vec2 p, float pp){
  return .5 * mix(.5, cNoise(p), clamp(1.5 - 3. * pp, 0., 1.)) + .3 * mix(.5, cNoise(p * 2.3 + 7.1), clamp(1.5 - 6.9 * pp, 0., 1.)) + .2 * mix(.5, cNoise(p * 5.1 + 3.7), clamp(1.5 - 15.3 * pp, 0., 1.));
}
// what a worn floor or polished wood gives back of the small lights of the place
vec3 glint(vec3 n, vec3 v, float tight){
  vec3 r = reflect(-v, n), s = vec3(0.);
  for (int i = 0; i < 6; i++) {
    vec3 l = uGl[i].xyz - vW; float d = length(l) + 1e-3;
    s += uGlC[i] * pow(max(dot(r, l / d), 0.), tight) / (1. + d * d / (uGl[i].w * uGl[i].w));
  }
  return s;
}
// the painter's one picture: a heath, two frail trees far apart, a low band of light behind them
vec3 heath(vec2 q){
  float hz = .4 + .03 * cNoise(vec2(q.x * 5., 1.));
  vec3 sky = mix(vec3(.62, .55, .42), vec3(.3, .3, .32), smoothstep(hz, 1., q.y));
  sky = mix(sky, vec3(.24, .24, .27), .6 * smoothstep(.35, .75, cFbm(q * vec2(3., 7.) + 2.)));
  vec3 land = vec3(.1, .085, .06) * (.6 + .9 * cNoise(q * vec2(40., 14.)));
  vec3 c = q.y > hz ? sky : land;
  for (int i = 0; i < 2; i++) {
    float tx = i == 0 ? .27 : .7, top = i == 0 ? .78 : .7;
    float lean = (q.y - hz) * (i == 0 ? .12 : -.1);
    float tr = smoothstep(.012, .004, abs(q.x - tx - lean)) * step(hz - .05, q.y) * step(q.y, top);
    float cr = smoothstep(.11, .04, length((q - vec2(tx + lean, top)) * vec2(1., 1.5)) + .05 * cNoise(q * 30.));
    c = mix(c, vec3(.06, .05, .04), max(tr, cr * .85));
  }
  return c;
}
// the altar picture: a tall figure in armour leaning on a sword, almost lost in brown varnish
vec3 altarpiece(vec2 q){
  vec3 c = vec3(.05, .035, .025) * (.7 + .6 * cFbm(q * 6.));
  float body = smoothstep(.17, .1, abs(q.x - .5) * (1.6 - .7 * q.y)) * step(.1, q.y) * smoothstep(.8, .7, q.y);
  float head = smoothstep(.065, .045, length((q - vec2(.5, .8)) * vec2(1., .8)));
  float sword = smoothstep(.012, .004, abs(q.x - .66)) * step(.08, q.y) * smoothstep(.62, .58, q.y);
  float halo = smoothstep(.02, 0., abs(length((q - vec2(.5, .82)) * vec2(1., .8)) - .1));
  c = mix(c, vec3(.2, .17, .15), body * .8);
  c = mix(c, vec3(.42, .3, .2), head);
  return c + vec3(.3, .3, .32) * sword * .6 + vec3(.35, .25, .08) * halo * .5;
}
void main(){
  float id = floor(vS.x + .5);
  vec3 alb = vC, emi = vec3(0.), add = vec3(0.);
  vec3 n = normalize(vN);
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye);
  vec3 v = toEye / max(dist, 1e-3);
  if (!gl_FrontFacing) n = -n;
  float ndv = clamp(dot(n, v), 0., 1.);
  float fogK = 1.;
  if (id == 1.) {
    float pw = vS.y, tone = 1.;
    vec2 g = vT.xz;
    if (pw > 0.) {
      float k = vT.x / pw, f = fract(k), cell = floor(k);
      float seam = smoothstep(0., .04, f) * smoothstep(1., .96, f);
      float j = fract(vT.z / (pw * 9.) + cHash(vec2(cell, 9.)));
      tone = (.8 + .34 * cHash(vec2(cell, 3.))) * (.4 + .6 * seam) * (.65 + .35 * smoothstep(0., .012, j));
      g.y += cell * 3.7;
    }
    float grain = cNoise(vec2((g.x + vT.y) * 2.4, g.y * .22)), fine = cNoise(vec2((g.x + vT.y) * 17., g.y * .9));
    // knots, and the wear of feet and hands in great soft patches
    vec2 kc = vec2(g.x + vT.y, g.y * .35), ki = floor(kc * .8);
    float kd = length((fract(kc * .8) - .2 - .6 * vec2(cHash(ki), cHash(ki + 7.))) * vec2(1., .45));
    float knot = step(.72, cHash(ki + 3.)) * (1. - smoothstep(.03, .11, kd));
    float wear = cFbm(vW.xz * .16 + vW.y * .2);
    alb *= tone * (.56 + .5 * grain + .2 * fine) * (1. - .6 * knot) * (.74 + .5 * wear);
    alb = mix(alb, alb.ggg * vec3(1.05, 1., .92), .25 * smoothstep(.45, .8, wear));
    if (vS.z > 0.) {
      vec3 nb = normalize(n + (vec3(grain, 0., fine) - .5) * .12);
      add = glint(nb, v, 26.) * vS.z * (.2 + .8 * pow(1. - ndv, 3.)) * (.5 + .5 * tone);
    }
  } else if (id == 2.) {
    // stone is drawn in the world's own measure: courses lie level on any wall, flags on any floor
    vec2 q = abs(n.y) > .7 ? vW.xz : vec2(vW.z * n.x - vW.x * n.z, vW.y);
    // (pm: what one dot of the picture spans of this face, in metres: nothing finer than that is drawn, at any distance,
    // so that far stone is stone and never a grain of dots)
    float pm = dist * .0016 / max(ndv, .2), lies = n.y > .7 ? 1. : 0.;
    float bh = vS.y, tone = .8 + .32 * cFbmA(q * .33, pm * .33);
    if (bh > 0.) {
      // a wall is laid in long courses, each breaking joint with the last; a floor (vS.w: 2) in square flags on the
      // diagonal, dark and pale by turns
      float lay = lies * step(1.5, vS.w), asp = mix(2.2, 1., lay);
      if (lay > .5) q = vec2(q.x + q.y, q.x - q.y) * .7071;
      float row = floor(q.y / bh), bx = q.x / (bh * asp) + (1. - lay) * (row * .5 + cHash(vec2(row, 1.)) * .3);
      float fx = fract(bx), fy = fract(q.y / bh);
      float px = pm / bh, jx = max(.02, px / asp), jy = max(.05, px);
      float m = smoothstep(0., jx, fx) * smoothstep(1., 1. - jx, fx) * smoothstep(0., jy, fy) * smoothstep(1., 1. - jy, fy);
      // (a joint widened to a dot's size pales as it widens; a block smaller than four dots has the tone of its wall)
      float thin = clamp(.05 / jy, 0., 1.), each = clamp(1.3 - 4. * px, 0., 1.);
      float hb = cHash(vec2(floor(bx), row));
      tone *= mix(1., .9 + .2 * hb, each) * mix(1., .52 + .48 * m, thin);
      if (lay > .5) tone *= mix(1., mod(floor(bx) + row, 2.) < .5 ? .8 : 1.1, each);
      alb *= mix(vec3(1.), mix(vec3(.96, .99, 1.06), vec3(1.06, 1., .92), cHash(vec2(row, floor(bx)) + 5.)), each);
    }
    // rain and soot have run down the walls
    if (vS.w > 0. && lies < .5) tone *= 1. - vS.w * .55 * smoothstep(.35, .8, cFbmA(vec2(q.x * .45, q.y * .06) + 3., pm * .45));
    alb *= tone;
    if (vS.z > 0.) {
      vec3 nb = normalize(n + (vec3(cNoise(q * 1.7), 0., cNoise(q * 1.7 + 9.)) - .5) * .1 * clamp(1.5 - 5.1 * pm, 0., 1.));
      add = glint(nb, v, 40.) * vS.z * (.15 + .85 * pow(1. - ndv, 3.)) * (.4 + .6 * tone);
      // worn flags have a sheen: seen low, a floor gives back the grey of what stands over it, so that it reads to its far end
      if (n.y > .7) add += uSky * .24 * vS.z * pow(1. - ndv, 3.) * (.35 + .65 * tone);
    }
  } else if (id == 3.) {
    // a bundle is sheets: on its sides the edges of the files show as lines, coarse and fine; its top is the top sheet
    float e = fract(vW.y * 7.), e2 = fract(vW.y * 23. + 3. * cNoise(vT.xz * 2.));
    alb *= mix(1., (.6 + .4 * smoothstep(0., .3, e)) * (.84 + .16 * smoothstep(0., .5, e2)), 1. - abs(n.y));
    float tape = vS.z * (1. - smoothstep(.1, .14, abs(vT.z)));
    alb = mix(alb, vec3(.2, .15, .11), tape * .8);
  } else if (id == 4.) {
    alb *= (.84 + .16 * cNoise(vT.xy * 16. + vT.z * 16.)) * (.82 + .18 * sin(vT.x * 3.1 + vT.z * 2.3 + vT.y * .7));
  } else if (id == 5.) {
    float row = floor(vT.y / .8), k = vT.x / .6 + .5 * mod(row, 2.);
    float fx = fract(k), fy = fract(vT.y / .8);
    float edge = smoothstep(0., .06, fx) * smoothstep(0., .12, fy);
    alb *= (.64 + .5 * cHash(vec2(floor(k), row))) * (.45 + .55 * edge);
    float fres = 1. - ndv;
    fres = fres * fres * fres;
    float wet = .55 + .45 * cNoise(vT.xy * .8 + vec2(0., uTime * .35));
    add = uSky * (.1 + .85 * fres) * wet * edge;
    // (a wet slate mirrors the sky: where the cloud is broken it mirrors the break, a soft warm sheen)
    float brk = max(dot(reflect(-v, n), uBreak), 0.);
    add += uBreakC * (.5 * pow(brk, 5.) + .9 * pow(brk, 40.)) * wet * edge * (.25 + .75 * fres);
    // (and the lamp glow out of a roof light near it, by the share its corners were given where they stand: vS.y)
    add += vec3(1., .6, .25) * vS.y * wet * edge * (.5 + .5 * fres) * .9;
  } else if (id == 6.) {
    float s = cNoise(vec2(vT.x * 10., vT.y * 1.3 + 2. * cNoise(vT.xy * 2.)));
    alb *= .5 + .75 * s;
    float rim = 1. - ndv;
    add = alb * vL * rim * rim * .9;
  } else if (id == 7.) {
    float fl = vS.z > 0. ? .12 * sin(uTime * (7. + vS.z) + vS.z * 40.) + .08 * sin(uTime * 13.3 + vS.z * 17.) : 0.;
    emi = vC * vS.y * (1. + fl);
    alb = vec3(0.);
    fogK = .45;
  } else if (id == 8.) {
    // (a picture is drawn in vT.yz: vT.x carries each piece's own offset of the wood grain)
    alb = (vS.y > .5 ? altarpiece(clamp(vT.yz, 0., 1.)) : heath(clamp(vT.yz, 0., 1.))) * vC * 2.2;
  } else if (id == 9.) {
    float sp = ndv * ndv; sp *= sp; sp *= sp; sp *= sp;
    float tw = .7 + .3 * sin(uTime * 2.1 + vW.y * 3. + vW.x * 2.);
    alb *= .45;
    add = vC * (dot(vL, vec3(.34)) * 5. + .03) * sp * tw + vC * glint(n, v, 14.) * (.35 + vS.y);
  } else if (id == 10. && vS.w < .5) {
    // A pane of wet glass seen from near (vT.x: metres along its sash, vT.y: metres up it): the grey sky's
    // sheen, lighter to the top and in one soft slanting band, the roofs' dark low in it; a few thin runs of rain
    // going down it on the world's clock. Nothing in it is a picture of clouds.
    float up = smoothstep(.8, 8.2, vT.y), slant = vT.x * .8 + vT.y * .55 - 4.4;
    float sheen = .42 + .58 * up + .24 * exp(-slant * slant * .55);
    float lane = floor(vT.x * 7.), hr = cHash(vec2(lane, 3.7)), xr = fract(vT.x * 7.) - .2 - .6 * hr;
    float fall = fract(vT.y * .13 + uTime * (.05 + .09 * hr) + hr * 9.);
    float run = step(.55, hr) * (1. - smoothstep(.012, .05, abs(xr))) * smoothstep(0., .35, fall) * (1. - smoothstep(.8, 1., fall));
    emi = vC * vS.y * sheen * (1. + .45 * run);
    alb = vec3(0.);
    fogK = .45;
  } else if (id == 10.) {
    float streak = .7 + .5 * cNoise(vec2(vT.x * 14., vT.y * 2.2 + uTime * 1.3));
    float bx = fract(vT.x * max(vS.z, 1.)), by = fract(vT.y * max(vS.w, 1.));
    float bar = smoothstep(0., .05, bx) * smoothstep(1., .95, bx) * smoothstep(0., .05, by) * smoothstep(1., .95, by);
    emi = vC * vS.y * streak * (.12 + .88 * bar);
    alb = vec3(0.);
    fogK = .45;
  } else if (id == 12.) {
    // Glass in leads, the day behind it and rain running down it. vS.w > 0: a window of two lights, each under its own
    // pointed head, a small round eye between the heads (vT.yz: across the window 0..1 and up it in the same measure; vS.w:
    // the height at which its own head begins). vS.w < 0: a rose (vT.yz from its middle, -1..1). vS.z: small panes across.
    // The stone of the tracery is drawn dark between the lights.
    vec2 q = vT.yz, g; float nP = max(vS.z, 2.), glass = 0., zone = 0., line = 0.;
    if (vS.w < 0.) {
      // the rose: a round eye, twelve petals between spokes of stone, a ring of twelve small round lights at its rim
      float r = length(q), sec = atan(q.y, q.x) / 6.2832 * 12. + 6., fs = fract(sec) - .5, arc = r * .5236;
      float eye = 1. - smoothstep(.2, .22, r);
      float petal = smoothstep(.26, .28, r) * (1. - smoothstep(.69, .71, r)) * smoothstep(.014, .026, (.5 - abs(fs)) * arc);
      float small = (1. - smoothstep(.075, .09, length(vec2(fs * arc, r - .86)))) * step(.74, r);
      glass = max(eye, max(petal, small));
      zone = eye > .5 ? 3. : (small > .5 ? 4. : floor(sec) + 5.);
      g = vec2(sec * 3., r * 9.) * nP * .14;
    } else {
      float li = floor(q.x * 2.), xl = abs(q.x - (.25 + .5 * li)), t = q.y - (vS.w - .25);
      float arch = xl - .22 * (t < 0. ? 1. : max(1. - t * t * 3.3, -1.));
      float eye = length(vec2(q.x - .5, q.y - (vS.w + .42))) - .11;
      glass = max((1. - smoothstep(-.014, 0., arch)) * step(.04, q.y), 1. - smoothstep(-.014, 0., eye));
      float border = step(-.05, arch) * step(0., -arch);
      float my = fract(q.y / .9 + .5 * li) - .5, med = length(vec2(xl, my * .9)) - .125;
      zone = li;
      g = q * nP;
      if (eye < 0.) { zone = 3.; g = g * 1.5 + 9.; }
      else if (border > .5) { zone = 10. + li; g = vec2(li * 7. + 40., (q.y + xl) * nP * 1.1); }
      else if (med < 0.) { zone = 20. + li + 2. * floor(q.y / .9 + .5 * li); g = g * 1.8 + 23.; }
      line = max((1. - smoothstep(.0, .008, abs(med) - .003)) * (1. - border), 1. - smoothstep(.0, .008, abs(arch + .05) - .003));
    }
    // small panes of many sizes: each a cell about a point of its own, the leads where two cells meet
    vec2 gi = floor(g), gf = fract(g), cid = gi; float d1 = 9., d2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), c = gi + o, pp = o + .15 + .7 * vec2(cHash(c + zone), cHash(c * 1.7 + 5. + zone)) - gf;
      float d = dot(pp, pp);
      if (d < d1) { d2 = d1; d1 = d; cid = c; } else if (d < d2) d2 = d;
    }
    float lead = smoothstep(.03, .1, sqrt(d2) - sqrt(d1)) * (1. - .92 * line);
    float h = cHash(cid + 11. + zone * 3.), h2 = cHash(cid * 1.7 + 3.);
    // ruby, blue, gold, green, violet, and now and then a pale pane; each zone has its own ground
    float hz = fract(h * .6 + .23 * zone);
    vec3 pane = hz < .3 ? vec3(.78, .07, .05) : (hz < .58 ? vec3(.06, .17, .8) : (hz < .76 ? vec3(.9, .6, .1) : (hz < .88 ? vec3(.08, .5, .2) : (hz < .95 ? vec3(.42, .1, .55) : vec3(.8, .82, .76)))));
    if (zone >= 10. && zone < 20.) pane = fract(g.y * .5) < .5 ? vec3(.75, .08, .06) : vec3(.07, .16, .7);
    // (Glass that throws no shaft gives no gleam of colour: a faint cold glow of wet glass in its leads, a
    // breath of its colours in it; only the one window of the shaft keeps its colours whole)
    pane = mix(pane, vec3(.5, .6, .76) * (.75 + .5 * dot(pane, vec3(.3, .5, .2))), .78 * (1. - smoothstep(.4, 1., vS.y)));
    float streak = .7 + .45 * cNoise(vec2(q.x * 9., q.y * 1.6 + uTime * 1.1));
    float cloud = .75 + .5 * cNoise(q * 2.3 + 7.);
    emi = vC * pane * vS.y * streak * cloud * lead * (.45 + .75 * h2) * glass * 1.9;
    alb = vec3(.3, .3, .31) * (1. - glass);
    fogK = .45;
  } else if (id == 13.) {
    // a cobweb in a corner: spokes and sagging rings, nothing between them (T.xy from the corner it is spun in)
    float a = atan(vT.y, vT.x), r = length(vT.xy);
    float spoke = abs(fract(a * 4.5) - .5) * r, ring = abs(fract(r * 3.4 - .25 * abs(sin(a * 14.1))) - .5) / 3.4;
    if (min(spoke, ring) > .028) discard;
    alb = vC;
  } else if (id == 11.) {
    float s = max(vS.y, .1);
    float f = abs(fract((vT.x + vT.y) / s) - .5), g = abs(fract((vT.x - vT.y) / s) - .5);
    if (f < .34 && g < .34) discard;
    alb *= .7 + .4 * cNoise(vT.xy * 3.);
  } else if (id == 14.) {
    // Shelves of files up a wall (vT.xy: along the wall and up it, in metres; vS.y, vS.z: a pigeon-hole's width and
    // height; vS.w: the height of the floor they stand on): uprights and boards of dark wood; in each hole a pile of
    // files of its own height and paper, some holes empty; the lowest row is cupboards, their doors shut. Far off the
    // holes die out into the wall's mean tone (nothing finer than a dot of the picture is drawn).
    vec2 hs = vec2(vS.y, vS.z), c = vec2(vT.x, vT.y - vS.w) / hs, ci = floor(c), cf = fract(c);
    float pm = dist * .0016 / max(ndv, .2), each = clamp(1.3 - 3. * pm / hs.y, 0., 1.);
    float h1 = cHash(ci + 3.), h2 = cHash(ci * 1.7 + 11.);
    vec2 bw = max(vec2(.06, .08), vec2(pm) / hs);
    float board = 1. - smoothstep(bw.x, bw.x * 1.5, min(cf.x, 1. - cf.x)) * smoothstep(bw.y, bw.y * 1.5, cf.y);
    float pile = step(.14, h2) * (.3 + .62 * h1), inPile = 1. - smoothstep(pile - .03, pile, cf.y);
    vec3 paper = mix(vec3(.62, .56, .44), mix(vec3(.5, .52, .55), vec3(.45, .33, .24), step(.6, h1)), step(.5, fract(h2 * 7.)));
    paper *= mix(.87, .75 + .25 * step(.5, fract(cf.y * hs.y * 5. + h1 * 3.)), clamp(1.5 - 12. * pm, 0., 1.));
    vec3 wood = vC * (.8 + .4 * cNoise(vT.xy * vec2(.7, 4.)));
    vec3 cell = mix(vec3(.035, .03, .028), paper * .9, inPile);
    if (ci.y < 1.) cell = wood * (.7 + .3 * smoothstep(.1, .14, min(min(cf.x, 1. - cf.x), min(cf.y, 1. - cf.y))));
    alb = mix(mix(wood, vec3(.36, .33, .27), .6), mix(cell, wood, board), each);
  } else {
    // plaster: its own grain, and (vS.y) the grime of years in clouds and runs; (vS.z) how much of the air's veil a far thing takes
    alb *= .9 + .2 * cNoise(vT.xy * 3. + vT.z * 3.);
    if (vS.z > 0.) fogK = vS.z;
    if (vS.y > 0.) {
      vec2 q = abs(n.y) > .7 ? vW.xz : vec2(vW.z * n.x - vW.x * n.z, vW.y);
      float gr = .6 * cFbm(q * .21) + .4 * cFbm(vec2(q.x * .9, q.y * .12) + 5.);
      alb *= 1. - vS.y * .7 * smoothstep(.3, .75, gr);
    }
  }
  // flame and radiance are never still: the warm share of the baked light breathes in great soft patches (on the clock)
  float warm = clamp((vL.r - 1.45 * vL.b) * 2.5, 0., 1.);
  // (so does the day's own light where it falls in a pool: rain runs down the panes it comes through)
  warm = max(warm, .6 * clamp(dot(vL, vec3(.34)) * 1.6 - .35, 0., 1.));
  float breath = cNoise(vW.xz * .05 + vec2(uTime * .37, -uTime * .29)) + .5 * cNoise(vW.xz * .13 + vW.y * .1 - vec2(uTime * .5, uTime * .21)) - .75;
  vec3 col = alb * vL * (1. + uBreath * warm * breath) + emi + add;
  vec4 air = uFogS > 0. ? mix(uFog, uFogB, smoothstep(0., uFogS, dot(vW, uFogP.xyz) + uFogP.w)) : uFog;
  float fog = 1. - exp(-dist * air.w);
  col = mix(col, air.rgb, clamp(fog * fogK, 0., 1.));
  gl_FragColor = vec4(col, 1.);
}`;
export function courtMaterial(uniforms) {
  return new THREE.ShaderMaterial({ uniforms, vertexShader: COURT_VERT, fragmentShader: COURT_FRAG, vertexColors: true, side: THREE.DoubleSide });
}

// ------------------------------------------------------------------------------------------------ the court's people
// Carved, simple forms one unit tall, facing +z. aS = (part, takes the coat's colour, a mark, forearm):
// part 0 legs and shoes; 1 the coat (mark 1: its skirt); 2 neck, head and face (mark 1: the hat on the head, 2: hair,
// 3: a moustache some wear); 3 the arms (forearm 1: below the elbow, with the hand); 4 an armful of files; 5 the hat held
// in the hands; 6 (keepers) the staff; 7 a sheet of paper held up in both hands.
const SKIN = [0.62, 0.5, 0.38], DARK = [0.05, 0.045, 0.045];
// A form turned on few sides is rounded in its light: corners that share a place and a part, and whose faces lie within
// `crease` degrees of one another, take the mean of their faces' normals (a box keeps its edges).
function rounded(g, crease = 62) {
  const P = g.getAttribute('position'), N = g.getAttribute('normal'), S = g.getAttribute('aS'), n = P.count, cosC = Math.cos(crease * Math.PI / 180);
  const at = new Map(), out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = Math.round(P.getX(i) * 4000) + ',' + Math.round(P.getY(i) * 4000) + ',' + Math.round(P.getZ(i) * 4000) + ',' + Math.round(S.getX(i));
    if (!at.has(k)) at.set(k, []);
    at.get(k).push(i);
  }
  for (const list of at.values()) for (const i of list) {
    let x = 0, y = 0, z = 0;
    for (const j of list) if (N.getX(i) * N.getX(j) + N.getY(i) * N.getY(j) + N.getZ(i) * N.getZ(j) > cosC) { x += N.getX(j); y += N.getY(j); z += N.getZ(j); }
    const l = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return g;
}
// lod 1: the same man of half as many sides and without his smallest parts, for one who is never seen from near (the
// crowds of the halls and the last court)
export function personGeometry(lod = 0) {
  const b = makeBatch(1 << 12), S = (n) => (lod ? Math.max(4, Math.ceil(n * 0.5)) : n);
  // A man's own measure: his shoulders a quarter of his height across, a long coat, narrow sleeves.
  // trousers and shoes
  b.col([0.72, 0.72, 0.76]).surf(0, 1, 0);
  for (const s of [-1, 1]) b.lathe([[0.037, 0.03], [0.042, 0.16], [0.047, 0.27], [0.056, 0.5]], S(8), s * 0.056, 0, 1, 1.15);
  b.col(DARK).surf(0, 0, 0);
  for (const s of [-1, 1]) b.lathe([[0.044, 0], [0.047, 0.03], [0.036, 0.05], [0, 0.056]], S(7), s * 0.056, 0.034, 1, 2.1);
  // the coat: its skirt, the waist, the chest, the round of the shoulders; its collar turned up round the neck
  b.col([1, 1, 1]).surf(1, 1, 1);
  b.lathe([[0.176, 0.25], [0.167, 0.35], [0.157, 0.44], [0.149, 0.52]], S(10), 0, 0, 0.72, 0.56);
  b.surf(1, 1, 0);
  b.lathe([[0.149, 0.5], [0.146, 0.56], [0.158, 0.65], [0.18, 0.73], [0.196, 0.778], [0.18, 0.812], [0.12, 0.836], [0.05, 0.85]], S(10), 0, 0, 0.7, 0.52);
  b.col([0.5, 0.5, 0.5]).surf(1, 1, 0);
  if (!lod) b.box(0, 0.68, 0.088, 0.018, 0.22, 0.012);
  b.col([1.5, 1.45, 1.4]).surf(1, 1, 0);
  if (!lod) b.lathe([[0.05, 0.822], [0.064, 0.838], [0.06, 0.862], [0.05, 0.866]], 8, 0, -0.004, 1, 0.95);
  b.col([0.72, 0.69, 0.62]).surf(1, 0, 0);
  b.box(0, 0.826, 0.052, 0.05, 0.03, 0.02);
  // neck and head: an egg, a nose, and under the brow a band of shadow where the eyes lie: the hint of a face, no more
  // (no feature of it is drawn, and no two men are told apart by it)
  b.col(SKIN).surf(2, 0, 0);
  b.lathe([[0.036, 0.82], [0.034, 0.866]], S(8));
  b.lathe([[0, 0.845], [0.04, 0.853], [0.058, 0.882], [0.064, 0.918], [0.056, 0.948], [0.032, 0.964], [0, 0.969]], S(10), 0, 0.005, 0.95, 1.1);
  b.rod([0, 0.908, 0.064], [0, 0.888, 0.092], 0.013, 0.008, S(5));
  if (!lod) b.box(0, 0.931, 0.05, 0.1, 0.012, 0.058);
  if (!lod) b.col([0.26, 0.2, 0.15]).box(0, 0.917, 0.049, 0.094, 0.016, 0.054);
  b.col(SKIN);
  if (!lod) for (const s of [-1, 1]) b.lathe([[0, 0.895], [0.012, 0.9], [0.014, 0.915], [0, 0.925]], 4, s * 0.061, 0.002, 0.5, 1);
  b.col(DARK).surf(2, 0, 3);
  b.box(0, 0.874, 0.066, 0.046, 0.016, 0.014);
  b.col([0.2, 0.17, 0.14]).surf(2, 0, 2);
  b.lathe([[0.066, 0.9], [0.068, 0.932], [0.056, 0.958], [0.03, 0.972], [0, 0.975]], S(10), 0, -0.01, 0.95, 1.06);
  // the hat: its brim all round (wider before and behind), its crown
  b.col(DARK).surf(2, 0, 1);
  b.lathe([[0.064, 0.944], [0.11, 0.937], [0.114, 0.944], [0.064, 0.956]], S(10), 0, 0.004, 1, 1.12);
  b.lathe([[0.066, 0.953], [0.065, 0.985], [0.054, 1.003], [0, 1.008]], S(10));
  // the arms: shoulder and upper arm; below the elbow the sleeve, the cuff, the hand and its thumb
  for (const s of [-1, 1]) {
    b.col([1, 1, 1]).surf(3, 1, 0, 0).lathe([[0.032, 0.62], [0.039, 0.7], [0.045, 0.775], [0.04, 0.815], [0, 0.836]], S(8), s * 0.158, 0);
    b.surf(3, 1, 0, 1).lathe([[0.027, 0.47], [0.029, 0.53], [0.032, 0.62]], S(8), s * 0.158, 0);
    b.col([0.74, 0.71, 0.64]).surf(3, 0, 0, 1).lathe([[0.025, 0.458], [0.029, 0.472]], S(8), s * 0.158, 0);
    b.col(SKIN).surf(3, 0, 0, 1).lathe([[0, 0.4], [0.018, 0.408], [0.026, 0.436], [0.023, 0.462]], S(6), s * 0.158, 0, 0.62, 1.15);
    if (!lod) b.rod([s * 0.158, 0.45, 0.022], [s * 0.15, 0.424, 0.04], 0.008, 0.006, 4);
  }
  // an armful of files; the hat held in the hands; a sheet held up before the chest (blank)
  b.col(PAL.paper).surf(4, 0, 0);
  // (the far man carries no files: none of the crowd he is drawn for walks with them)
  if (!lod) for (let i = 0; i < 3; i++) b.box(0.012 * (i - 1), 0.57 + i * 0.05, 0.19, 0.2 - 0.02 * i, 0.046, 0.15, 0.12 * (i - 1));
  b.col([0.35, 0.2, 0.14]).surf(4, 0, 0);
  if (!lod) b.box(0, 0.645, 0.19, 0.026, 0.156, 0.156);
  b.col(DARK).surf(5, 0, 0);
  b.lathe([[0.06, 0.6], [0.11, 0.6], [0.11, 0.612], [0.062, 0.614]], S(10), 0, 0.2);
  b.lathe([[0.062, 0.61], [0.058, 0.655], [0, 0.66]], S(10), 0, 0.2);
  b.col(PAL.paper).surf(7, 0, 0);
  b.quad([-0.07, 0.6, 0.2], [0.07, 0.6, 0.2], [0.07, 0.76, 0.16], [-0.07, 0.76, 0.16]).quad([0.07, 0.6, 0.2], [-0.07, 0.6, 0.2], [-0.07, 0.76, 0.16], [0.07, 0.76, 0.16]);
  return rounded(b.build());
}
// The doorkeeper, one unit to the crown of his bare head, on his feet (stand) or seated: a great fur coat with a
// collar, a large sharp nose, a long thin dark beard (mark 4), dark hair; a plain staff with no head to it in his
// hand. Nothing else is told of him, and nothing else is made: no cap, no weapon, no features.
export function keeperGeometry(stand = true) {
  const b = makeBatch(1 << 11), FURC = [1, 1, 1];
  const up = stand ? new THREE.Matrix4().makeScale(0.78, 0.78, 0.78).setPosition(0, 0.2224, 0) : null;
  b.col(FURC).surf(0, 1, 0);
  if (stand) {
    // (a tall man in a long coat, not a squat one: the coat two fifths of his height across at its hem)
    b.lathe([[0.2, 0.085], [0.2, 0.3], [0.187, 0.56]], 12, 0, 0, 1, 0.78);
    b.col([1.4, 1.34, 1.22]).lathe([[0.19, 0.05], [0.222, 0.07], [0.226, 0.11], [0.202, 0.135]], 12, 0, 0, 1, 0.78);
    b.col(DARK).surf(0, 0, 0);
    for (const s of [-1, 1]) b.lathe([[0.062, 0], [0.066, 0.05], [0.05, 0.085], [0, 0.09]], 7, s * 0.085, 0.09, 1, 1.7);
  } else {
    b.lathe([[0.32, 0.02], [0.34, 0.2], [0.31, 0.42]], 12, 0, -0.03, 1, 0.82);
    for (const s of [-1, 1]) { b.rod([s * 0.135, 0.37, 0.02], [s * 0.14, 0.37, 0.43], 0.105, 0.095, 7, true); b.rod([s * 0.14, 0.37, 0.42], [s * 0.14, 0.07, 0.44], 0.09, 0.07, 7); }
    b.lathe([[0.2, 0.3], [0.19, 0.46]], 8, 0, 0.26, 1, 0.9);
    b.col(DARK).surf(0, 0, 0);
    for (const s of [-1, 1]) b.lathe([[0.085, 0], [0.09, 0.05], [0.07, 0.09], [0, 0.1]], 7, s * 0.14, 0.5, 1, 1.7);
  }
  b.tr(up);
  b.col(FURC).surf(1, 1, 0);
  const W = stand ? 0.78 : 1;
  b.lathe([[0.305 * W, 0.4], [0.335 * W, 0.55], [0.31 * W, 0.7], [0.21 * W, 0.79], [0.1, 0.815]], 12, 0, 0, 1, 0.76);
  b.col([1.4, 1.34, 1.22]).surf(1, 1, 0);
  b.lathe([[0.18 * W, 0.74], [0.262 * W, 0.775], [0.25 * W, 0.822], [0.13, 0.843], [0.1, 0.82]], 12, 0, 0, 1, 0.86);
  b.lathe([[0.06, 0.5], [0.07, 0.76]], 6, 0, 0.21 * W, 1, 0.5);
  b.col(FURC).surf(3, 1, 0);
  b.rod([-0.31 * W, 0.73, 0], [-0.345 * W, 0.53, 0.08], 0.076, 0.07, 7, true); b.rod([-0.345 * W, 0.53, 0.08], [-0.25 * W, 0.46, 0.3], 0.068, 0.058, 7, true);
  b.rod([0.31 * W, 0.73, 0], [0.36 * W, 0.54, 0.09], 0.076, 0.07, 7, true); b.rod([0.36 * W, 0.54, 0.09], [0.415 * W, 0.56, 0.28], 0.068, 0.058, 7, true);
  b.col(SKIN).surf(3, 0, 0);
  b.lathe([[0, 0.4], [0.05, 0.42], [0.054, 0.47], [0, 0.5]], 6, -0.24 * W, 0.33);
  b.lathe([[0, 0.51], [0.05, 0.53], [0.054, 0.59], [0, 0.62]], 6, 0.425 * W, 0.31);
  b.col([0.8, 0.64, 0.48]).surf(2, 0, 0);
  b.lathe([[0, 0.79], [0.08, 0.815], [0.104, 0.88], [0.096, 0.94], [0, 0.965]], 9);
  // the large sharp nose; the long thin dark beard, out over the collar and down the breast of the coat
  b.rod([0, 0.9, 0.08], [0, 0.866, 0.2], 0.036, 0.007, 5);
  b.col(DARK).surf(2, 0, 4);
  b.rod([0, 0.836, 0.08], [0, 0.782, 0.19], 0.036, 0.03, 5); b.rod([0, 0.782, 0.19], [0, 0.5, 0.205], 0.03, 0.004, 5);
  b.surf(2, 0, 0);
  // (his bare head's dark hair: down over the ears and the nape to the collar, the brow and the face left bare; no cap)
  b.lathe([[0.1, 0.85], [0.111, 0.925], [0.094, 0.972], [0, 0.99]], 9, 0, -0.036);
  b.tr(null);
  const k = stand ? 0.78 : 1, sx = 0.415 * W * k, sz = 0.31 * k, top = 1.04;
  b.col([0.3, 0.2, 0.12]).surf(6, 0, 0);
  b.rod([sx, 0, sz], [sx, top, sz], 0.02 * k, 0.017 * k, 6, true);
  return rounded(b.build());
}
const FIG_VERT = /* glsl */`
attribute vec4 aS;
// where it stands (x, y, z) and the way it faces
attribute vec4 iP;
// its height; how it sits (0 stands, 1 sits and rises to bow on a round of his own, 2 sits, 3 sits on a step with his
// knees up; a walker: the length of its
// walk; a keeper: 1 if he stands); where its head stands turned for good (the old man's, to his gate); its kind
attribute vec4 iA;
// the coat's colour; its own phase
attribute vec4 iC;
// the light of its place; how far it stoops (rad)
attribute vec4 iL;
// where its key light comes from; the hat (0 none, 1 worn, 2 held in the hands), or the side a keeper leans to
attribute vec4 iD;
uniform float uTime; uniform vec3 uRim, uRimDir;
varying vec3 vCol, vW, vO; varying float vFur;
vec3 rx(vec3 p, float py, float pz, float a){ float c = cos(a), s = sin(a), dy = p.y - py, dz = p.z - pz; return vec3(p.x, py + dy * c - dz * s, pz + dy * s + dz * c); }
vec3 ry(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
void main(){
  float part = floor(aS.x + .5), mark = floor(aS.z + .5), kind = floor(iA.w + .5), ph = iC.w, H = iA.x;
  float keeper = kind == 5. ? 1. : 0.;
  float sd = position.x < 0. ? -1. : 1.;
  vec3 p = position, n = normal, home = iP.xyz;
  vO = position;
  // NO FIGURE REGARDS THE VISITOR: nothing here reads where he is, how near he is, or the flight. Each head keeps a
  // slow habit of its own on the world's clock, its period (17.3 to 41.2 s, no two alike) and its phase out of the
  // figure's own number: it rests where it likes to rest, turns to look down the room one way, rests, turns the
  // other way; and now and then it sinks to look at the hands or the papers (hdown).
  float yaw = iP.w;
  float hper = 17.3 + 23.9 * fract(ph * 1.618), ht = 6.2832 * (uTime / hper + fract(ph * 2.39));
  float hw = sin(ht), hslow = sin(ht * .381 + ph * 5.);
  float look = .75 * (smoothstep(.35, .9, hw) - smoothstep(.35, .9, -hw)) * (.55 + .45 * hslow) + (fract(ph * 3.3) - .5) * .5;
  float hdown = .2 * smoothstep(.2, .8, sin(ht * .618 + ph * 9.));
  if (keeper > .5) {
    float waist = mix(.42, .55, clamp(iA.y, 0., 1.)), breath = sin(uTime * .9 + ph);
    // (his head a little great, as his nose and beard are.) He keeps his gate: his gaze stands on the approach to it,
    // with a slow sweep on the clock (47 to 61 s) that goes with the lean he has
    look = .2 * sin(6.2832 * uTime / (47. + 14. * fract(ph * 1.3)) + ph * 2.);
    if (part == 2.) { p.xz *= 1.26; p.y = .812 + (p.y - .8) * 1.26; p = ry(p, look); n = ry(n, look); if (mark == 4.) p.x += .012 * sin(uTime * .6 + ph) * (.84 - position.y) * 3.; }
    if (part > .5 && part < 5.5) {
      float bow = iL.w + .012 * breath;
      if (part == 1.) p.xz *= 1. + .02 * breath;
      p = rx(p, waist, 0., bow); n = rx(n, 0., 0., bow);
    }
    // a habit on the world's clock: he shifts where he stands, now square to his hall, now leaning half aside from his gate
    float aside = .5 + .5 * sin(uTime * .21 + ph * 3.);
    float roll = .025 * sin(uTime * .31 + ph) + .09 * aside * iD.w;
    float c = cos(roll), s = sin(roll);
    p.xy = vec2(p.x * c + p.y * s, -p.x * s + p.y * c); n.xy = vec2(n.x * c + n.y * s, -n.x * s + n.y * c);
    p.x += .1 * aside * iD.w * (part == 6. ? p.y / (waist + .14) : step(.5, part));
    yaw += .3 * aside * iD.w;
  } else {
    float mode = floor(iA.y + .5), walker = kind == 2. ? 1. : 0., hat = floor(iD.w + .5);
    // a habit on the world's clock: one who waits on a bench rises, bows and sits down again on a round of his own (16 to
    // 30 s, some 6 s of it on his feet), whether anyone comes by or not; in the middle of it he bows deeper
    float per = 16. + 14. * fract(ph * 1.93), tt = fract(uTime / per + fract(ph * .731)) * per;
    float wave = smoothstep(0., 1.6, tt) * (1. - smoothstep(4.6, 6.4, tt));
    float sit = walker > .5 ? 0. : (mode == 1. ? 1. - wave : (mode >= 2. ? 1. : 0.));
    // (one who sits on a step: the body is let down further and the thighs are raised, the soles on the tread below)
    float onstep = walker < .5 && mode == 3. ? 1. : 0., drop = mix(.21, .34, onstep);
    float deep = smoothstep(1.4, 2.6, tt) * (1. - smoothstep(3.6, 4.8, tt));
    bool skirt = part == 1. && mark == 1.;
    bool gone = (part == 2. && mark == 1. && hat != 1.) || (part == 2. && mark == 3. && (kind == 3. || fract(ph * 1.37) < .45))
      || (part == 5. && (hat != 2. || kind != 0.)) || (part == 4. && kind != 2.) || (part == 7. && kind != 10.);
    // each has his own build, spare or stout, his own hat (its brim, the height of its crown), his own way of standing
    float build = .84 + .4 * fract(ph * 2.71) * fract(ph * 2.71);
    if (part == 1. || part == 3.) p.x *= build;
    if (part == 1.) p.z *= mix(1., build, 1.2);
    if (part == 2. && mark == 1.) { p.xz *= .9 + .22 * fract(ph * 4.3); if (position.y > .96) p.y = .96 + (position.y - .96) * (.55 + 1.2 * fract(ph * 6.7)); }
    float pose = fract(ph * 7.31), stance = (fract(ph * 3.17) - .5) * step(.5, 1. - walker);
    if (kind == 7. && mark == 3.) gone = false;
    if (part == 2.) {
      float nod = kind == 1. ? .3 : (kind == 4. ? -.55 : (kind == 0. ? (.16 + hdown) * (1. - deep) : (kind == 12. || kind == 2. || kind == 6. ? hdown : 0.)));
      if (kind == 1.) look *= .35;
      if (kind == 3.) { if (mark == 2.) { p.xz *= 1.12; p.z -= .012; } look *= .5; }
      // one who whispers turns to his neighbour; a sleeper's head has sunk on his chest, and lifts a little now and
      // then; one who reads his petition looks down at it, and up from it now and then
      if (kind == 8.) { look = clamp(iL.w * 5., -.95, .95); nod = .1; }
      if (kind == 9.) { look = .4 * sin(ph * 9.); nod = .6 - .3 * smoothstep(.8, .97, hw) + .04 * sin(uTime * .7 + ph); }
      if (kind == 10.) { float up = smoothstep(.5, .9, hslow); look *= .3 + .7 * up; nod = .3 - .22 * up; }
      if (kind == 11.) nod = .22;
      // the old man by the first gate: his head is toward the gate and its light, always
      if (kind == 7.) look = iA.z;
      // the priest in his pulpit reads; he lifts his head to the nave (31 to 40 s), and reads again
      if (kind == 13.) { float up = smoothstep(.55, .8, sin(6.2832 * uTime / (31.3 + 8.9 * fract(ph * 1.9)) + ph)); look = 0.; nod = mix(.44, .02, up); }
      p = ry(p, look); n = ry(n, look);
      p = rx(p, .86, 0., nod); n = rx(n, 0., 0., nod);
    }
    if (part == 3.) {
      float a = -.08, eb = -.14, inw = 0.;
      if (kind == 0.) {
        float held = hat == 2. ? 1. : 0.; a = mix(-.08 - .3 * sit, -.25, held); eb = mix(-.2 - .85 * sit, -1., held); inw = mix(.07 * sit, .15, held);
        // one who stands with his hands free holds them as he will: hanging, clasped before him, folded, one at his lapel
        if (held < .5 && mode == 0.) {
          if (pose > .3 && pose <= .55) { a = -.12; eb = -.7; inw = .14; }
          else if (pose > .55 && pose <= .8) { a = -.28; eb = -1.45; inw = .17; }
          else if (pose > .8) { a = sd > 0. ? -.3 : -.06; eb = sd > 0. ? -2.05 : -.12; inw = sd > 0. ? .08 : 0.; }
        }
      }
      if (kind == 1.) { a = -.55; eb = -.95 + .05 * sin(uTime * 2.3 + ph) * step(0., sd); inw = .1; p.x += .012 * sin(uTime * 8. + ph * 3.) * step(0., sd) * aS.w; }
      if (kind == 2.) { a = -.3; eb = -1.3; inw = .1; }
      if (kind == 3.) { a = -2.45 + .22 * sin(uTime * .8 + ph + sd); eb = -.3; }
      if (kind == 4.) { a = sd > 0. ? -2.1 : -.08; eb = sd > 0. ? -1.25 : -.14; inw = sd > 0. ? .17 : 0.; }
      // (the usher and the sexton: the arm is raised to point the way and sinks again, on a round of his own, 21 to 30 s)
      if (kind == 6.) { float pt = smoothstep(.1, .55, sin(6.2832 * uTime / (21.3 + 8.8 * fract(ph * 1.7)) + ph * 4.)); a = sd > 0. ? mix(-.12, -1.55, pt) + .04 * sin(uTime * .9 + ph) : -.08; eb = sd > 0. ? mix(-.3, -.08, pt) : -.14; }
      // (the priest: both hands on the book before him)
      if (kind == 13.) { a = -.62; eb = -.8 + .02 * sin(uTime * .5 + ph); inw = .09; }
      if (kind == 7.) { a = -.35; eb = -1.2 + .07 * sin(uTime * 1.7 + ph + sd * 1.3); inw = .17 + .012 * sin(uTime * 2.6 + ph); }
      // whispering: the hand of the side he leans to is at his mouth; asleep: hands in the lap; a petition held up in both hands;
      // bowing low: the arms hang; waiting on his feet: hands behind his back
      if (kind == 8.) { float up = step(0., sd * iL.w); a = mix(-.1, -1., up); eb = mix(-.2, -1.9, up); inw = .1 * up; }
      if (kind == 9.) { a = -.22; eb = -.95; inw = .11; }
      if (kind == 10.) { a = -.32; eb = -1.28 + .03 * sin(uTime * 1.1 + ph); inw = .12; }
      if (kind == 11.) { a = -.72; eb = -.12; }
      if (kind == 12.) { a = .32; eb = -.25; inw = .16; }
      // the forearm bends at the elbow, then the whole arm swings at the shoulder
      if (aS.w > .5) { p = rx(p, .62, 0., eb); n = rx(n, 0., 0., eb); p.x -= sd * inw * clamp((.62 - position.y) / .19, 0., 1.); }
      p = rx(p, .8, 0., a); n = rx(n, 0., 0., a);
    }
    if (part == 4.) { float sl = sin(uTime * 1.3 + ph); p.x += (position.y - .57) * .5 * sl; p.z += (position.y - .57) * .12 * sin(uTime * .9 + ph * 2.); }
    if (part < .5) {
      if (walker > .5) { float sw = .42 * sin(uTime * 4.2 + ph) * sd; p = rx(p, .5, 0., sw); n = rx(n, 0., 0., sw); }
      float th = mix(1.5708, 2.077, onstep);
      if (position.y > .271) { p = rx(p, .5, 0., -th * sit); n = rx(n, 0., 0., -th * sit); p.y -= drop * sit; } else p.z += mix(.23, .2, onstep) * sit;
    } else if (skirt) {
      float t = clamp((position.y - .27) / .25, 0., 1.);
      p.z += .2 * sit * (1. - t); p.y -= sit * mix(.07, drop, t);
      // a woman's skirt falls to her shoes
      if (kind == 3.) { p.y = .52 - (1. - t) * .47; p.xz *= 1. + .32 * (1. - t); p.x += .02 * (1. - t) * sin(uTime * .8 + ph); }
    } else {
      p.y -= drop * sit;
      float bow = iL.w * (mode == 1. ? 1. - sit : 1.) + .45 * deep * (mode == 1. ? 1. : 0.) + .02 * sin(uTime * 1.3 + ph);
      if (kind == 4.) bow = -.14;
      if (kind == 2.) bow = -.1 + .03 * sin(uTime * 1.3 + ph);
      if (kind == 8.) bow = .14 + .02 * sin(uTime * 1.1 + ph);
      if (kind == 9.) bow = .3 + .035 * sin(uTime * .7 + ph);
      if (kind == 11.) bow = .78 + .03 * sin(uTime * .8 + ph);
      if (kind == 12.) bow = -.04 + .015 * sin(uTime * .9 + ph);
      float waist = .5 - drop * sit;
      p = rx(p, waist, 0., bow); n = rx(n, 0., 0., bow);
      // (the whisperer leans to his neighbour: iL.w is the side and how far)
      if (kind == 8.) { float lr = iL.w * (1. + .15 * sin(uTime * .9 + ph)), dy = p.y - waist; p.x += dy * sin(lr); p.y = waist + dy * cos(lr); }
      p.x += .012 * sin(uTime * .7 + ph);
    }
    // (he stands with his weight on one leg: the body leans a little over it, the head stays upright)
    if (part > .5 && sit < .5) p.x += (p.y - .5) * .1 * stance * (part == 2. ? .4 : 1.);
    if (gone) p = vec3(0., .7 - drop * sit, 0.);
    // the old man's beard
    if (kind == 7. && part == 2. && mark == 3.) { p.y -= (.884 - position.y) * 3.4; p.x *= .8; }
    if (walker > .5) {
      // he walks his run and back, slower at its ends, and turns about as he walks: the half turn is eased over the last
      // and the first metre of the run (some 0.8 s), never made between two frames
      float run = max(iA.y, 1.), t = fract(uTime * 2.4 / (2. * run) + ph * .159), sgo = 1. - abs(t * 2. - 1.), e = .5 / run;
      home += ry(vec3(0., 0., 1.), iP.w) * mix(sgo, .5 - .5 * cos(3.14159 * sgo), .5) * run;
      yaw += 3.14159 * (smoothstep(-e, e, t) - 1. + smoothstep(.5 - e, .5 + e, t) + smoothstep(1. - e, 1. + e, t));
      p.y += .012 * abs(sin(uTime * 4.2 + ph));
    }
  }
  p = ry(p, yaw); n = normalize(ry(n, yaw));
  vec3 w = home + p * H;
  vW = w;
  // (the eye's place is read here for the SHADING alone, as on every surface: the sheen at the rim of a rounded form;
  // no place, pose, turn or motion of a figure is worked out from it)
  vec3 v = normalize(cameraPosition - w);
  float rim = 1. - abs(dot(n, v)), back = clamp(dot(n, uRimDir) + .5, 0., 1.);
  vec3 lit = iL.rgb * (.42 + 1.05 * max(dot(n, normalize(iD.xyz)), 0.) + .22 * max(n.y, 0.) + .3 * rim * rim * rim) + uRim * back * back * (.4 + rim * rim);
  vec3 base = aS.y > .5 ? iC.rgb * color : color;
  // the old man is white-haired
  if (kind == 7. && part == 2. && mark > 1.5) base = vec3(.6, .58, .54);
  vCol = base * lit;
  vFur = keeper * step(.5, aS.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const FIG_FRAG = /* glsl */`
uniform vec4 uFog, uFogB, uFogP; uniform float uFogS;
varying vec3 vCol, vW, vO; varying float vFur;
${COURT_NOISE}
void main(){
  vec3 col = vCol;
  float fur = cNoise(vec2((vO.x + vO.z) * 46., vO.y * 7. + 2. * cNoise(vO.xy * 9.)));
  col *= mix(.88 + .24 * cNoise(vO.xy * 30. + vO.z * 30.), .45 + .95 * fur, vFur);
  float dist = length(cameraPosition - vW);
  vec4 air = uFogS > 0. ? mix(uFog, uFogB, smoothstep(0., uFogS, dot(vW, uFogP.xyz) + uFogP.w)) : uFog;
  col = mix(col, air.rgb, clamp(1. - exp(-dist * air.w), 0., 1.));
  gl_FragColor = vec4(col, 1.);
}`;
// rim: the colour of a light behind the figures, dir: the way to it
export function figureMaterial(uniforms, rim = [0, 0, 0], dir = [0, 0, -1]) {
  const u = { ...uniforms, uRim: { value: new THREE.Vector3(rim[0], rim[1], rim[2]) }, uRimDir: { value: new THREE.Vector3(dir[0], dir[1], dir[2]).normalize() } };
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: FIG_VERT, fragmentShader: FIG_FRAG, vertexColors: true });
}
// list: [{ x, y, z, yaw, h, seat, kind, col: [r,g,b], phase, light: [r,g,b], bow, ld: [x,y,z], hat }]
export function makePeople(geometry, material, list) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'color', 'aS']) g.setAttribute(k, geometry.getAttribute(k));
  const P = new Float32Array(n * 4), A = new Float32Array(n * 4), C = new Float32Array(n * 4), L = new Float32Array(n * 4), D = new Float32Array(n * 4);
  list.forEach((f, i) => {
    P.set([f.x, f.y, f.z, f.yaw], i * 4); A.set([f.h, f.kind === 2 ? (f.run ?? 4) : f.kind === 5 ? (f.stand ? 1 : 0) : (f.seat === true ? 1 : (f.seat || 0)), f.turn ?? 0, f.kind ?? 0], i * 4);
    C.set([f.col[0], f.col[1], f.col[2], f.phase ?? 0], i * 4); L.set([f.light[0], f.light[1], f.light[2], f.bow ?? 0], i * 4);
    const ld = f.ld || [0.3, 0.8, 0.3]; D.set([ld[0], ld[1], ld[2], f.hat ?? 1], i * 4);
  });
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 4)); g.setAttribute('iL', new THREE.InstancedBufferAttribute(L, 4));
  g.setAttribute('iD', new THREE.InstancedBufferAttribute(D, 4));
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { object: mesh, count: n, triangles: n * geometry.getAttribute('position').count / 3 };
}

// ------------------------------------------------------------------------------------------------ the gates of the law
// In the hero's own frame: gate 1 stands in the plane z = 0 and is seen from +z; the gates recede along -z, each on steps
// above the last, each hall its own place: the first low and solid under a beamed stone ceiling, the second taller with
// columns and galleries. A keeper stands at each gate on the side we come from, at one side of its opening, each a
// head and more taller than a man and each mightier than the last; the gates are what is vast. Behind the third
// gate lies the last court, eight-sided, an inner court of the law; the great door stands in the face of it that is
// 135 degrees round from the gate, over a flight of steps, doors within it one behind another, the innermost all
// light. The portal stands on the landing before the great door.
export const GATES = {
  // three gates in a row along -z (z: the near face, t: the wall's thickness, y: the sill)
  gate: [{ z: 0, t: 3, w: 14, h: 20, y: 0 }, { z: -105, t: 8, w: 22, h: 33, y: 5 }, { z: -221, t: 12, w: 38, h: 60, y: 14 }],
  hall: [{ z0: -3, z1: -105, hw: 52, H: 44, y: 0 }, { z0: -113, z1: -221, hw: 122, H: 98, y: 5 }],
  // the steps up to gates 2 and 3: a man's rise and tread, and a landing (land) before the sill
  // (pw: the breadth of the low wall at each end of the flight)
  steps: [null, { n: 10, rise: 0.5, dz: 1.2, W: 44, land: 4.6, pw: 4.4 }, { n: 15, rise: 0.6, dz: 1.4, W: 70, land: 6.5, pw: 6.4 }],
  // the keepers, each on the landing of his gate at one side of its opening (x from the axis; sign: the side he is on,
  // times the visit's side): the first a head taller than a man, each further one mightier
  keeper: [{ h: 6.1, x: 11.4, z: 4.4, y: 0, sign: 1 }, { h: 6.9, x: 7.4, z: -102.4, y: 5, sign: 1 }, { h: 7.8, x: 14.2, z: -217.6, y: 14, sign: -1 }],
  // where the line bows to on its way to gates 2 and 3 (x times the visit's side): to the side away from the keeper, so
  // that he is seen across his gate's opening and the line never comes near him
  way: [null, { x: -20.59, z: -91 }, { x: 37.68, z: -198 }],
  // The last court, behind gate 3: eight-sided (A: from its middle to the middle of a face), gate 3 in the middle of one
  // face, the great door in the face 135 degrees round from it (turn: to which side, times the visit's side), so that its axis lies at 45
  // degrees to the axis of the gates. The door stands over a flight of steps (n, rise, tread, W) on a landing (deep);
  // frames: how the doors within the door follow one another (each `gap` behind the last and `k` its size).
  court: { A: 125, y: 14, wall: 104, turn: 1, door: { w: 46, h: 84, n: 12, rise: 0.6, tread: 2.4, W: 60, deep: 17, gap: 24, k: 0.78 } },
  // the portal stands on the landing, `back` before the door; the line is level and straight for the last `last` metres
  // (100: the turn onto the door's axis is over a second and a half and more of flight before the last 60 m, so that
  // the eased camera has settled on the heading by then, steady and sweeping; the court has the depth for it)
  portal: { w: 16, h: 24, back: 9, last: 100 },
  // the eye: through a gate the line is 0.45 of the opening above its sill, and never more than `eye` (the middle of
  // the portal over the landing it stands on); every turn is one arc of `turn` metres' radius where its straights allow
  // (the first, the slightest, is laid on `turn0` so that it too takes its time)
  eye: 12.4, turn: 110, turn0: 145,
  frontH: 78, frontHW: 60,
};
// The way through, WORKED OUT from the gates and the keepers above (the hero's frame, for a visit's side):
//   through gate 1 on its axis; a metre inside it the line leaves the axis by an arc for the side away from the second
//   keeper, heading for the point GATES.way gives; it turns back before the steps and goes through the middle of his
//   gate's opening, heading for the like point before gate 3; turns back before its steps and goes through the middle
//   of gate 3, heading for the middle of the court's face next to the one opposite, on the side away from the great
//   door; meets the axis of the great door behind the court's middle and turns onto it by the widest arc that leaves
//   the last metres straight (portal.last), and runs straight and level to the portal.
// A change to a keeper, a gate or the court moves the line with it. Returns the walk: its points every `step` metres
// [x, y, z], the distance walked at each, and its marks (the gates' middles, the arcs, the court).
export function gateWalk(side = 1, step = 7) {
  const G = GATES, C = G.court, D = C.door, [g1, g2, g3] = G.gate;
  const aim = (w) => [side * w.x, w.z];
  const meet = (a, b, c, d) => { const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / (rx * sz - rz * sx); return [a[0] + rx * t, a[1] + rz * t]; };
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]), unit = (a, b) => { const l = dist(a, b); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const ct = C.turn * side, zc = g3.z - g3.t - C.A, dAx = [ct * Math.SQRT1_2, -Math.SQRT1_2], half = C.A * Math.tan(Math.PI / 8);
  const landing = C.y + D.n * D.rise, P1 = [0, g1.z - g1.t - 1], c2 = [0, g2.z - g2.t / 2], c3 = [0, g3.z - g3.t / 2];
  const Q2 = aim(G.way[1]), Q3 = aim(G.way[2]), Q4 = [-ct * C.A * Math.SQRT1_2, zc - C.A * Math.SQRT1_2], cen = [0, zc], end = [dAx[0] * (C.A - G.portal.back), zc + dAx[1] * (C.A - G.portal.back)];
  // the first corner lies on the axis, where an arc of the full radius that begins at P1 ends heading for Q2
  let t0 = 10;
  for (let i = 0; i < 8; i++) t0 = G.turn0 * Math.tan(Math.atan2(Math.abs(Q2[0]), P1[1] - t0 - Q2[1]) / 2);
  const V0 = [0, P1[1] - t0], X1 = meet(V0, Q2, c2, Q3), X2 = meet(c2, Q3, c3, Q4), X3 = meet(c3, Q4, cen, end);
  // the corners, each with the room its arc has before and after it (the far side of the gate it comes from, the near side of the one it goes to)
  const face = (c, q, z) => [c[0] + (q[0] - c[0]) * (z - c[1]) / (q[1] - c[1]), z];
  const corners = [
    { c: V0, a: P1, b: X1, T: t0 },
    { c: X1, a: V0, b: c2, out: dist(X1, face(X1, c2, g2.z + 1)) },
    { c: X2, a: X1, b: c3, in: dist(face(c2, X2, g2.z - g2.t - 1), X2), out: dist(X2, face(X2, c3, g3.z + 1)) },
    { c: X3, a: X2, b: end, in: dist(face(c3, X3, g3.z - g3.t - 1), X3), out: dist(X3, end) - G.portal.last },
  ];
  let prevEnd = 0;
  for (const [i, k] of corners.entries()) {
    const u = unit(k.a, k.c), v = unit(k.c, k.b), th = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1)), tt = Math.tan(th / 2);
    const room = Math.min(k.in ?? dist(k.a, k.c) - prevEnd, k.out ?? 1e9);
    k.T = k.T ?? Math.min(G.turn * tt, room); k.R = k.T / tt; k.th = th; k.u = u; k.v = v; k.sg = Math.sign(u[0] * v[1] - u[1] * v[0]);
    prevEnd = k.T; if (i === 0) prevEnd = k.T;
  }
  // lay it out: straights and arcs, a point every `step` metres
  const pts = [], sAt = [], arcs = [];
  let s = 0, cur = [0, g1.z];
  const put = (p, ds) => { s += ds; pts.push([Math.abs(p[0]) < 0.02 ? 0 : p[0], 0, p[1]]); sAt.push(s); };
  const line = (to) => { const l = dist(cur, to), n = Math.max(1, Math.round(l / step)); for (let i = 1; i <= n; i++) put([cur[0] + (to[0] - cur[0]) * i / n, cur[1] + (to[1] - cur[1]) * i / n], l / n); cur = to; };
  put(cur, 0);
  for (const k of corners) {
    const p0 = [k.c[0] - k.u[0] * k.T, k.c[1] - k.u[1] * k.T];
    if (dist(cur, p0) > 0.05) line(p0);
    // the arc's middle lies to the side it turns to; it is walked through k.th
    const nx = -k.u[1] * k.sg, nz = k.u[0] * k.sg, o = [p0[0] + nx * k.R, p0[1] + nz * k.R], n = Math.max(2, Math.round(k.R * k.th / step)), s0 = s;
    for (let i = 1; i <= n; i++) {
      const a = k.sg * k.th * i / n, c = Math.cos(a), sn = Math.sin(a), rx = p0[0] - o[0], rz = p0[1] - o[1];
      put([o[0] + rx * c - rz * sn, o[1] + rx * sn + rz * c], k.R * k.th / n);
    }
    cur = [k.c[0] + k.v[0] * k.T, k.c[1] + k.v[1] * k.T];
    arcs.push({ s0, s1: s, R: k.R, deg: k.th * 180 / Math.PI * k.sg });
  }
  line(end);
  // the height: by the distance walked, eased from gate to gate; level from the end of the last arc
  const sOfZ = (z) => { let i = 0; while (i < pts.length - 2 && pts[i + 1][2] > z) i++; const f = clamp((pts[i][2] - z) / Math.max(1e-6, pts[i][2] - pts[i + 1][2]), 0, 1); return [lerp(sAt[i], sAt[i + 1], f), lerp(pts[i][0], pts[i + 1][0], f)]; };
  const eye = (g) => g.y + Math.min(0.45 * g.h, G.eye), mid = [g1, g2, g3].map((g) => sOfZ(g.z - g.t / 2));
  const knots = [[0, eye(g1)], [mid[1][0], eye(g2)], [mid[2][0], eye(g3)], [arcs[3].s1, landing + G.eye], [s, landing + G.eye]];
  for (const [i, p] of pts.entries()) { let j = 0; while (j < knots.length - 2 && sAt[i] > knots[j + 1][0]) j++; p[1] = lerp(knots[j][1], knots[j + 1][1], smoothstep(knots[j][0], knots[j + 1][0], sAt[i])); }
  return { pts, sAt, len: s, arcs, corners, sGate: mid.map((m) => m[0]), xGate: mid.map((m) => m[1]), court: { zc, ct, dAx, half, landing, cen, end, yaw: Math.atan2(-dAx[0], -dAx[1]) } };
}
// (the walk as points only)
export function gateRoute(side = 1, step = 7) { return gateWalk(side, step).pts; }
// ------------------------------------------------------------------------------------------------ the plan of a visit
// Everything the route and the camera need, worked out from the seed alone (no scene, no renderer): the frames of the
// lofts, the bent passages, the corridor, the painter's room, the cathedral and the gates, and the points of the line.
// The world builds on it; being pure, it can be flown by arithmetic over hundreds of seeds without a picture.
export const DURATION = 50;
export const ATTIC = { HW: 13, BAY: 7.5, EYE: 3.0, ZG: 98, RP: 34, PL: 22, PDW: 7.2, PDH: 8.8, PORCH: 3, AW: 31, NW: 17, NAVE: 110, CANDLE: 10.5 };
export function courtPlan(seed) {
  const { BAY, EYE, ZG, RP, PL, PORCH, AW, NW, NAVE, CANDLE } = ATTIC, G = GATES;
  const own = (name) => makeRng(hashSeed('courts-' + name + ':' + seed));
  const rp = own('plan'), rcp = own('corridor-plan'), rnp = own('nave-plan'), rg = own('gates'), rrl = own('roof-line');
  const dirOf = (psi) => new THREE.Vector3(-Math.sin(psi), 0, -Math.cos(psi)), rightOf = (psi) => new THREE.Vector3(Math.cos(psi), 0, -Math.sin(psi));
  const frame = (psi, O, extra) => {
    const M = new THREE.Matrix4().makeRotationY(psi).setPosition(O.x, O.y, O.z), v = new THREE.Vector3();
    return { psi, O: O.clone(), M, toW: (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M), w3: (x, y, z) => { v.set(x, y, z).applyMatrix4(M); return [v.x, v.y, v.z]; }, d3: (x, y, z) => { v.set(x, y, z).transformDirection(M); return [v.x, v.y, v.z]; }, ...extra };
  };
  const nL = rp.chance(0.5) ? 4 : 3, turn0 = rp.chance(0.5) ? 1 : -1, wellAt = rp.int(1, nL - 1);
  const lofts = [], links = [];
  let psi = 0; const O = new THREE.Vector3(0, 0, -ZG);
  for (let k = 0; k < nL; k++) {
    const L = rp.range(46, 58), nb = Math.round(L / BAY), bow = rp.range(0.6, 1.2) * (rp.chance(0.5) ? 1 : -1);
    const Z = frame(psi, O, { k, L, nb, bow, winA: k === 0, well: k === wellAt ? { x: bow * 0.5, z: -L / 2 } : null });
    lofts.push(Z);
    const E = O.clone().addScaledVector(dirOf(psi), L);
    if (k < nL - 1) {
      // the bent passage to the next loft: both end walls are rays from one pivot RP to the inside of the bend
      const th = (k % 2 ? -turn0 : turn0) * rp.range(0.42, 0.73), sIn = -Math.sign(th);
      const C = E.clone().addScaledVector(rightOf(psi), sIn * RP), p0 = psi;
      links.push({ C, sIn, psi0: p0, th, at: (f, r) => C.clone().addScaledVector(rightOf(p0 + th * f), -sIn * r) });
      psi += th;
      O.copy(C).addScaledVector(rightOf(psi), -sIn * RP);
    } else O.copy(E);
  }
  const cor = frame(psi, O, { L: rcp.range(100, 112), bow: rcp.range(-0.6, 0.6) });
  O.addScaledVector(dirOf(psi), cor.L);
  const pq = []; for (let i = 0; i < 8; i++) pq.push(rcp());
  const pnt = frame(psi, O, { q: pq, easel: [rcp.chance(0.5) ? 4.6 : -4.6, -9.5] });
  // the cathedral: we come in by a low door in the wall of its crossing, at an angle, and sweep round onto the axis of
  // the nave; the piers begin only where the line is on that axis, and the nave runs NAVE metres on to the first gate
  const e = rnp.chance(0.5) ? 1 : -1, thN = rnp.range(0.9, 1.05), RN = AW / (1 - Math.cos(thN)), zE = -18, zJ = zE - RN * Math.sin(thN), LN = -zJ + NAVE;
  const psiN = psi - e * thN;
  const D = O.clone().addScaledVector(dirOf(psi), PL + PORCH);
  const nav = frame(psiN, D.clone().addScaledVector(rightOf(psiN), -e * AW).addScaledVector(dirOf(psiN), zE), { LN, e, thN, RN, zE, zJ, candle: [-e * CANDLE, zJ - 18], pulpit: [e * (NW - 3.6), zJ - 9] });
  const gat = frame(psiN, nav.toW(0, 0, -LN));
  // (beyond: how many doors stand within the great door behind its second)
  const side = rg.chance(0.5) ? 1 : -1, beyond = rg.int(1, 3);
  // ---- the line
  const pts = [];
  // Over the roofs (z from 0 to the garret window at -ZG): the heights are those of a fall that begins at 1.5 degrees,
  // steepens evenly to 4.6 at 60 m (so the first 60 m are near level, as an arrival asks), is 7 degrees between 74 and
  // 82 m, eases to 4 at the window's sill and 2.5 at the second truss inside (8 m in), and is level 20 m in at the
  // height of the lane (EYE). The line comes in a little from one side or the other (the seed's): a side step of 2 to
  // 5 m at the start that is spent by 60 m.
  const step0 = (rrl.chance(0.5) ? 1 : -1) * rrl.range(2, 5);
  for (const [z, y, kx] of [[0, 10.86, 1], [-20, 10.15, 0.8], [-40, 9.09, 0.42], [-60, 7.66, 0.1], [-74, 6.24, 0], [-82, 5.26, 0], [-90, 4.38, 0], [-ZG, 3.72, 0]]) pts.push(new THREE.Vector3(step0 * kx, y, z));
  lofts.forEach((Z, k) => {
    // (8 m inside the window, on the straight course from the sill to the loft's first bow)
    if (k === 0) pts.push(Z.toW(Z.bow * 8 / (Z.L * 0.36), 3.26, -8));
    if (Z.well) pts.push(Z.toW(Z.well.x * 0.6, EYE, -Z.L / 2 + 15), Z.toW(Z.well.x, EYE + 0.1, -Z.L / 2 + 4), Z.toW(Z.well.x, EYE + 0.1, -Z.L / 2 - 4), Z.toW(Z.well.x * 0.6, EYE, -Z.L / 2 - 15));
    else pts.push(Z.toW(Z.bow, EYE, -Z.L * 0.36), Z.toW(-Z.bow * 0.7, EYE, -Z.L * 0.68));
    pts.push(Z.toW(0, EYE, -Z.L));
    if (links[k]) { const p = links[k].at(0.5, RP); p.y = EYE; pts.push(p); const p1 = links[k].at(1, RP); p1.y = EYE; pts.push(p1); }
  });
  pts.push(cor.toW(cor.bow, 3.2, -cor.L * 0.5), cor.toW(0, 3.3, -cor.L), pnt.toW(0, 3.9, -PL * 0.5), pnt.toW(0, 4.4, -PL));
  for (let i = 0; i <= 5; i++) {
    const a = thN * (1 - i / 5);
    pts.push(nav.toW(e * RN * (1 - Math.cos(a)), 4.5 + i * 0.2, zJ + RN * Math.sin(a)));
  }
  pts.push(nav.toW(0, 6.2, zJ - 26), nav.toW(0, 7.1, zJ - 53), nav.toW(0, 8.1, zJ - 81));
  for (const p of gateRoute(side)) pts.push(gat.toW(p[0], p[1], p[2]));
  return { seed, own, rg, nL, turn0, wellAt, lofts, links, cor, pnt, nav, gat, side, beyond, step0, pts, dirOf, rightOf, frame };
}
// The film of a visit: everything that is said in metres flown. path is the kit's path through plan.pts.
export function courtFilm(plan, path) {
  const { lofts, cor, pnt, nav, gat, wellAt, side } = plan, { PL } = ATTIC, G = GATES;
  const LEN = path.length, mOf = (v) => path.nearestXZ(v.x, v.z).u * LEN;
  // a value given at places of the route (metres) and eased between them
  const table = (knots) => (m) => {
    let i = 0; while (i < knots.length - 2 && m > knots[i + 1][0]) i++;
    const a = knots[i], b = knots[i + 1], t = smoothstep(a[0], b[0], m);
    return typeof a[1] === 'number' ? lerp(a[1], b[1], t) : a[1].map((v, j) => lerp(v, b[1][j], t));
  };
  const mWin = mOf(lofts[0].toW(0, 0, 0));
  for (const Z of lofts) { Z.m0 = mOf(Z.toW(0, 0, 0)); Z.m1 = mOf(Z.toW(0, 0, -Z.L)); }
  cor.m0 = mOf(cor.toW(0, 0, 0)); cor.m1 = mOf(cor.toW(0, 0, -cor.L));
  pnt.m0 = cor.m1; pnt.m1 = mOf(pnt.toW(0, 0, -PL));
  nav.m0 = pnt.m1; nav.mJ = mOf(nav.toW(0, 0, nav.zJ));
  // the gates' middles and the last arc (the turn onto the great door's axis), in metres of the route
  const walk = gateWalk(side, 3), atS = (sv) => { let i = 0; while (i < walk.sAt.length - 1 && walk.sAt[i] < sv) i++; const p = walk.pts[i]; return mOf(gat.toW(p[0], 0, p[2])); };
  const mGate = [0, 1, 2].map((k) => mOf(gat.toW(walk.xGate[k], 0, G.gate[k].z - G.gate[k].t / 2)));
  const mArc = [atS(walk.arcs[3].s0), atS(walk.arcs[3].s1)];
  nav.m1 = mGate[0];
  // A sight line in the hero's frame from a point of the walk to a place further in: it is open when it passes through
  // the opening of every gate that lies between the two (at both faces of the gate's wall). firstShown: the metre of the
  // route from which a place first shows (worked out from the gates and the walk alone, the same on every visit).
  const sightOpen = (p, q) => G.gate.every((g) => !(p[2] > g.z && q[2] < g.z - g.t) || [g.z, g.z - g.t].every((z) => { const f = (p[2] - z) / (p[2] - q[2]), x = p[0] + (q[0] - p[0]) * f, y = p[1] + (q[1] - p[1]) * f; return Math.abs(x) < g.w / 2 && y > g.y && y < g.y + g.h; }));
  const firstShown = (q) => { for (const [i, p] of walk.pts.entries()) if (sightOpen(p, q)) return atS(walk.sAt[i]); return LEN; };
  // (the portal's place, the middle of the opening on the landing before the great door: first shown through gate 3)
  const mPortalShown = firstShown([walk.court.end[0], walk.court.landing + G.portal.h / 2, walk.court.end[1]]);
  const wellZ = lofts[wellAt], mWell = mOf(wellZ.toW(wellZ.well.x, 0, wellZ.well.z));
  // The pace, as a share of the flight's mean speed, given at places of the route and eased between them: over the
  // roofs 0.86 (21 to 24 m a second, by the length of the visit's route), in the attics 0.69 (17 to 19), slowest
  // over the stair's well 0.645 (16 to 18), the nave 0.92 rising to 1.02 at the first gate (23 to 26 at its crossing;
  // its first half gently: the candle's pull is made there), the two halls fastest at 1.24 (31 to 34), the last
  // court from before its turn onto the door's axis 0.88 (22 to 24). The engine scales these so that the flight
  // takes its duration.
  const paceAt = table([[0, 0.86], [mWin - 10, 0.86], [mWin + 18, 0.69], [mWell - 26, 0.69], [mWell, 0.645], [mWell + 26, 0.69], [cor.m1, 0.69], [nav.m0 + 25, 0.92], [nav.mJ, 0.93], [mGate[0] - 10, 1.02], [mGate[0] + 40, 1.24],
    [mGate[2] - 30, 1.24], [mArc[0], 0.88], [LEN, 0.88]]);
  // The gaze: one pull at a time. The candle from the door of the cathedral; then each keeper, from before the gate that
  // hides him until his bearing off the route's heading has passed 60 degrees (the pull goes off over a ramp of its
  // own, as much as the last half of its window where the window is short, and is nothing at its end). No pull in
  // the last court: the line itself turns to the great door.
  const DEG = Math.PI / 180, tan = new THREE.Vector3(), pos = new THREE.Vector3();
  const bearingEnd = (target, m0, deg, m1 = LEN) => {
    for (let m = m0; m < m1; m += 2) {
      path.posAtDist(m, pos); path.tangentAtDist(m, tan);
      const dx = target.x - pos.x, dz = target.z - pos.z, l = Math.hypot(dx, dz) * Math.hypot(tan.x, tan.z) || 1;
      if (Math.acos(clamp((dx * tan.x + dz * tan.z) / l, -1, 1)) > deg * DEG) return m;
    }
    return m1;
  };
  // One pull at a time: none begins before the one before it has ended. Each comes on and goes off over 2.6 s of
  // flight at the speed flown at its place (the engine scales the pace so that the flight takes its duration: paceK,
  // worked out as the engine works it out), or over half its window where the window is shorter than two such ramps
  // (the engine takes the ramp as a share of the window). All four pulls are made on EVERY visit, each decided at its
  // own place and by nothing else: the candle from where the painter's back door first shows it, until its bearing
  // off the route's heading has passed 60 degrees; the first keeper from the nave's own axis (or that end),
  // the second from 15 m before the gate that hides him, the third from where the second gate's opening first shows
  // him (or from the end of the pull before his, which comes later); each keeper until his bearing off the route's
  // heading has passed 60 degrees. Counted on seeds 1 to 300: no ramp is shorter than 1.5 s of flight (1.54 s the
  // shortest), and the pulls are light (the route itself passes each keeper): none turns the gaze as much as 8
  // degrees (the candle 3.1, the keepers 4.7, 7.7 and 7.6 at most). No pull in the last court: the third keeper is
  // let go before his gate.
  let paceK = 0; for (let i = 0; i < 64; i++) paceK += 2 / (clamp(paceAt(i / 64 * LEN), 0.35, 2.5) + clamp(paceAt((i + 1) / 64 * LEN), 0.35, 2.5)); paceK /= 64;
  const secs = (s, m) => s * (LEN / DURATION) * paceAt(m) * paceK;
  const candleW = nav.toW(nav.candle[0], 10, nav.candle[1]), pois = [];
  let last = -1e9;
  const pull = (at, from, to, weight) => {
    from = Math.max(from, last);
    const r = Math.min(Math.max(secs(2.6, from), secs(2.6, to)), (to - from) / 2);
    pois.push({ at, from: from / LEN, to: to / LEN, weight, fade: r / (to - from), m: [from, to, r] });
    last = to;
  };
  // (the candle is first shown through the painter's back door, PDW wide and PDH high at the room's far end: the first
  // metre of the route in his room whose straight line to the candle passes through that opening)
  let mCandle = nav.m0;
  {
    const inv = new THREE.Matrix4().copy(pnt.M).invert(), c = candleW.clone().applyMatrix4(inv), e = new THREE.Vector3();
    for (let m = pnt.m0; m < nav.m0; m += 2) {
      path.posAtDist(m, e); e.applyMatrix4(inv);
      const t = (e.z + PL) / (e.z - c.z);
      if (e.z > -PL && c.z < -PL && Math.abs(e.x + (c.x - e.x) * t) < ATTIC.PDW / 2 && e.y + (c.y - e.y) * t < ATTIC.PDH) { mCandle = m; break; }
    }
  }
  pull(candleW, mCandle, bearingEnd(candleW, nav.m0 + 30, 60, mOf(candleW) + 10), 0.28);
  const chestsH = G.keeper.map((q) => [q.sign * side * q.x, q.y + 0.62 * q.h, q.z]), chests = chestsH.map((c) => gat.toW(c[0], c[1], c[2]));
  chests.forEach((c, k) => { const from = k === 0 ? nav.mJ : k === 1 ? mGate[0] - 15 : firstShown(chestsH[k]); pull(c, from, bearingEnd(c, Math.max(from, last) + 30, 60), [0.3, 0.27, 0.27][k]); });
  return { LEN, mOf, table, mWin, mWell, mGate, mArc, mPortalShown, mCandle, walk, paceAt, pois, candleW, chests };
}

const RADC = [1, 0.76, 0.36];
const k3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
// the stone of the four walls, gate by gate: grey, a little paler each time
const WALLC = [[0.36, 0.37, 0.39], [0.42, 0.43, 0.45], [0.48, 0.485, 0.5], [0.45, 0.46, 0.485]];
// what a lamp of the halls and the last court gives: lamp oil's yellow
const LAMPC = [1, 0.72, 0.4];
// how near the line (the whole line of the gates, at every place of it) a hung thing of the halls may be: LAMPGAP
// (a keeper's own lamp, on its bracket beside him at his gate: KEEPLAMP)
const LAMPGAP = 11, KEEPLAMP = 9;
// and how near the dust of the halls and the court may drift to it, with its whole run: no mote is ever a pale disc
// in the picture because of WHERE it is (its place, tested in build), not by any fading near the eye
const MOTEGAP = 9;
// how far a place (x, y0..y1, z: a thing hung on its chain) is from the nearest place of the hero's own line
export function gapToWalk(line, x, y0, y1, z) {
  let d = 1e9;
  for (const p of line) { const dy = p[1] < y0 ? y0 - p[1] : p[1] > y1 ? p[1] - y1 : 0, q = Math.hypot(p[0] - x, p[2] - z, dy); if (q < d) d = q; }
  return d;
}
// Where the fittings stand (hero frame): the piers of hall 1; the lamps of the halls, all of this world's own kind (oil
// lamps of brass and glass under a tin shade, as in the lofts and the corridor): one carried on an iron bracket at
// every second pier of hall 1 and at every column of hall 2, rows of them hung on long chains over both floors, one
// on a bracket beside each keeper; in some bays of hall 1 a dark curtain hangs before the wall. A lamp whose place
// lies within LAMPGAP of the line is not hung: a matter of its place alone, the same at every moment of every visit.
// The cheek of the flight up to gate k: a kerb wall that rakes with the flight, KERB over the line of its nosings and
// level along the landing, and at its foot a newel block. x: the newel's middle out of the axis; z: its middle; zb:
// its back, where the kerb ends; yk: the kerb's top there; top: the newel's own top, a little over the kerb's end.
const KERB = 1.3;
function cheekOf(G, k) {
  const st = G.steps[k], g = G.gate[k], tot = st.land + st.n * st.dz, z = g.z + tot * 2.5 / 3, zb = z - st.pw / 2;
  const yk = G.hall[k - 1].y + st.rise * (g.z + tot - zb) / st.dz + KERB;
  return { x: st.W / 2 + st.pw / 2, z, zb, yk, top: yk + 0.9 };
}
function gateFittings(G, rs, side, ru = rs) {
  const h1 = G.hall[0], h2 = G.hall[1], pil = [], all = [], line = gateRoute(side, 2);
  let z = h1.z0 - rs.range(9, 13), i = 0;
  while (z > h1.z1 + 12) {
    pil.push({ z, w: rs.range(2.6, 3.6), hang: [rs.chance(0.45), rs.chance(0.45)], tint: rs.int(0, 2) });
    if (i % 2 === 0) for (const s of [-1, 1]) all.push({ x: s * (h1.hw - 4.6), y: h1.y + 7.6, z, s: 1.15, hall: 1, wall: [s * (h1.hw - 1.6), z], reach: 7.5 });
    z -= rs.range(11, 15); i++;
  }
  // (a chain runs to the first stone over its lamp: the under side of a beam where one crosses there, or the ceiling.
  // Hall 1: a beam across at every pier, 4.2 m deep. Hall 2: one across at every column, 5 m broad and 6 m deep.)
  const top1 = (z) => h1.y + h1.H - (pil.some((p) => Math.abs(z - p.z) < p.w * 0.4) ? 4.2 : 0);
  const top2 = (z) => { const d = (h2.z0 - h2.z1) / 5, k = (h2.z0 - z) / d - 0.5; return h2.y + h2.H - (Math.abs(k - Math.round(k)) * d < 2.5 && Math.round(k) >= 0 && Math.round(k) < 5 ? 6 : 0); };
  // (the last lamp of each row would hang over the flight to the next gate: it stands instead on a standard on the
  // newel block at the foot of the flight's cheek, as the lamps by the great door's steps stand on its cheeks.
  // cheek: [x, z, the newel's top])
  const cheek = (k) => { const c = cheekOf(G, k); return [c.x, c.z, c.top]; };
  for (const s of [-1, 1]) for (let j = 0; j < 4; j++) {
    const c = j === 3 ? cheek(1) : null, z = h1.z0 - 13 - j * 25.5;
    all.push(c ? { x: s * c[0], y: c[2] + 4.6, z: c[1], s: 1.2, hall: 1, top: top1(c[1]), foot: c[2], post: 1, reach: 11 } : { x: s * 25, y: h1.y + 7.4, z, s: 1.2, hall: 1, top: top1(z), foot: h1.y, reach: 8 });
  }
  const d2 = (h2.z0 - h2.z1) / 5, xc = h2.hw - 24;
  for (const s of [-1, 1]) {
    for (let j = 0; j < 5; j++) all.push({ x: s * (xc - 7), y: h2.y + 8.2, z: h2.z0 - (j + 0.5) * d2, s: 1.5, hall: 2, wall: [s * (xc - 3.7), h2.z0 - (j + 0.5) * d2], reach: 8.5 });
    for (const x of [33, 66]) for (let j = 0; j < 4; j++) {
      const c = j === 3 && x < 50 ? cheek(2) : null, z = Math.max(h2.z1 + 12, h2.z0 - 12 - j * 26.5 - (x > 50 ? 13 : 0));
      all.push(c ? { x: s * c[0], y: c[2] + 5.2, z: c[1], s: 1.5, hall: 2, top: top2(c[1]), foot: c[2], post: 1, reach: 12 } : { x: s * x, y: h2.y + 7.8, z, s: 1.5, hall: 2, top: top2(z), foot: h2.y, reach: 9 });
    }
  }
  // MORE OF THEM HIGHER UP, so that pier, wall and gallery read (up: no bench is set under one; far: drawn plainly, it
  // hangs high and far off): on some piers of hall 1 a second lamp well over the first; in hall 2 one on the gallery
  // side of some columns and some out of the side walls; all at heights and places of their own (ru: a stream of
  // their own, so that the draws of the other fittings do not hang on them)
  for (const p of pil) for (const s of [-1, 1]) { const there = ru.chance(0.7), y = h1.y + ru.range(17, 27); if (there) all.push({ x: s * (h1.hw - 4.2), y, z: p.z, s: 1.3, hall: 1, wall: [s * (h1.hw - 1.6), p.z], reach: 9, up: 1, far: 1 }); }
  for (const s of [-1, 1]) {
    for (let j = 0; j < 5; j++) { const there = ru.chance(0.75), y = h2.y + 45 + ru.range(5, 9); if (there) all.push({ x: s * (xc - 6.4), y, z: h2.z0 - (j + 0.5) * d2, s: 1.5, hall: 2, wall: [s * (xc - 2.4), h2.z0 - (j + 0.5) * d2], reach: 10, up: 1, far: 1 }); }
    for (let j = 0; j < 7; j++) { const z = h2.z0 - 8 - (j + ru.range(0.15, 0.85)) * (h2.z0 - h2.z1 - 16) / 7, y = h2.y + (ru.chance(0.5) ? ru.range(8, 11) : ru.range(24, 36)); all.push({ x: s * (h2.hw - 3.4), y, z, s: 1.6, hall: 2, wall: [s * h2.hw, z], reach: 11, up: 1, far: 1 }); }
  }
  // THE WALLS OF THE HALLS ARE BUILT, not blank (the court's own shelves begin out here, fewer and plainer, and grow
  // hall by hall). ends: the bays of each hall's end wall to either side of its gate, between pilasters (x0..x1 out
  // of the axis; the wall is brought forward by dep from y0 to its cornice yc over a dado D high; a round-headed
  // niche w wide stands in it from yb to its springing ys, a rack of bound files at its back). side1: hall 1's bays
  // between its piers (rack: a rack in its niche). cases: runs of shelves that stand against hall 2's side walls,
  // under its galleries and on them (z0 > z1 along the hall). wins: small barred windows high in the walls, the
  // day's cold light in them (n: the way the wall faces). Before the head of every niche that holds a rack, and here
  // and there along the cases, a lamp on a bracket rooted in the stone over the niche's crown: each at a height of
  // its own (ru), never a level row.
  const ends = [], side1 = [], cases = [], wins = [];
  const nicheLamp = (hl, x, z, wx, wz, top, s, reach) => all.push({ x, y: top + 0.35 - 1.5 * s + ru.range(0, 1.5), z, s, hall: hl, wall: [wx, wz], reach, up: 1 });
  for (const [hl, h, g, xs, D, dep, y0, yc] of [[1, h1, G.gate[1], [19.6, 35.4, 50.6], 6.2, 1.5, 0, 27], [2, h2, G.gate[2], [33.5, 54.5, 75.5, 96.5], 9, 2.2, 0, 45], [2, h2, G.gate[2], [33.5, 54.5, 75.5, 96.5], 2.2, 2.2, 46.2, 80]]) for (const s of [-1, 1]) for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1], w = x1 - x0 - (hl === 1 ? 6.4 : 7.6) - ru.range(0, 1.2), ys = h.y + yc - 4 - w / 2 - ru.range(0, 1.6), xm = s * (x0 + x1) / 2;
    ends.push({ hall: hl, s, x0, x1, w, yb: h.y + y0 + D + 0.6, ys, dep, y0: h.y + y0, yc: h.y + yc, D, z: g.z, first: i === 0 });
    nicheLamp(hl, xm, g.z + dep + 2.6, xm, g.z + dep, ys + w / 2, hl === 1 ? 1.2 : 1.5, hl === 1 ? 11 : 15);
    if (!y0 || hl === 1) wins.push({ hall: hl, x: xm, z: g.z, n: [0, 1], y: Math.round(h.y + (hl === 1 ? 31 : 85)), w: hl === 1 ? 3 : 4, h: hl === 1 ? 4 : 6 });
  }
  {
    const zs = [h1.z0, ...pil.map((p) => p.z), h1.z1];
    for (const s of [-1, 1]) for (let i = 0; i < zs.length - 1; i++) {
      if (zs[i] - zs[i + 1] <= 9) continue;
      const pier = pil[Math.min(i, pil.length - 1)], hung = pier && pier.hang[s > 0 ? 1 : 0], rack = !hung && ru.chance(0.62), zm = (zs[i] + zs[i + 1]) / 2;
      side1.push({ i, s, rack });
      if (rack) nicheLamp(1, s * (h1.hw - 3.4), zm, s * (h1.hw - 0.9), zm, h1.y + 24.4, 1.2, 10);
      wins.push({ hall: 1, x: s * h1.hw, z: zm, n: [-s, 0], y: Math.round(h1.y + 31), w: 3, h: 4 });
    }
  }
  {
    // (the cases stand from pilaster to pilaster, a pilaster behind each column; a case leaves the wall free where a
    // lamp's bracket is rooted in it)
    const d = (h2.z0 - h2.z1) / 5, galY = h2.y + 45;
    for (const s of [-1, 1]) {
      for (let i = 1; i < 5; i++) if (ru.chance(0.8)) { const z = h2.z0 - (i + ru.range(-0.3, 0.3)) * d; all.push({ x: s * (h2.hw - 3.4), y: galY + ru.range(8, 14), z, s: 1.5, hall: 2, wall: [s * h2.hw, z], reach: 12, up: 1, far: 1 }); }
      for (let i = 1; i < 5; i++) wins.push({ hall: 2, x: s * h2.hw, z: h2.z0 - i * d, n: [-s, 0], y: Math.round(h2.y + 80), w: 4, h: 6 });
      for (const gal of [0, 1]) for (let i = 0; i <= 5; i++) {
        const za = i === 0 ? h2.z0 - 1.5 : h2.z0 - (i - 0.5) * d - 2.6, zb = i === 5 ? h2.z1 + 1.5 : h2.z0 - (i + 0.5) * d + 2.6, top = gal ? galY + ru.range(12, 20) : h2.y + ru.range(17, 26);
        const cuts = all.filter((q) => q.hall === 2 && q.wall && q.wall[0] === s * h2.hw && q.wall[1] < za && q.wall[1] > zb && (gal ? q.y > galY : q.y < galY - 2 && q.y - 2 * q.s < top + 1)).map((q) => q.wall[1]).sort((a, b) => b - a);
        let z = za;
        for (const c of [...cuts, null]) { const e = c === null ? zb : c + 1.6; if (z - e > 3.2) cases.push({ s, z0: z, z1: e, yb: gal ? galY : h2.y, yt: top, gal }); if (c !== null) z = c - 1.6; }
      }
    }
  }
  // (the keeper's own: out of the cathedral's wall beside the first, out of the jamb over each of the others; the
  // stone of the way through the wall takes its light too)
  G.keeper.forEach((q, k) => {
    const g = G.gate[k], sx = q.sign * side;
    all.push(k === 0 ? { x: sx * (q.x + 2.4), y: 10.2, z: g.z + 2.7, s: 1.1, hall: 0, wall: [sx * (q.x + 2.4), g.z], reach: 9, k: 1.7 }
      : { x: sx * (g.w / 2 - 2.4), y: g.y + q.h + 3.2, z: g.z + 0.35, s: 1.25, hall: k, also: k + 1, wall: [sx * g.w / 2, g.z + 0.35], reach: 10, k: 1.7 });
  });
  const lamps = all.filter((q) => { q.gap = gapToWalk(line, q.x, q.y - q.s, q.top ?? q.y + 2 * q.s, q.z); return q.gap >= (q.k ? KEEPLAMP : LAMPGAP); });
  // (a hung lamp whose place is within STANDGAP of the line stands on a standard instead: see lampDraw)
  for (const q of lamps) if (q.top && !q.wall && q.gap < STANDGAP) q.post = 1;
  // benches for those who wait, under the lamps that are carried on brackets: against the wall of hall 1 either side of
  // the lamp's pier, before the columns of hall 2 (s: the side; n: its places)
  const benches = [];
  // (FEW, SHORT, AND NO TWO IN A LINE: by some of those lamps one bench, to one side of the lamp, each at a distance
  // from the wall or the column and of a length of its own; hb: numbers of the lamp's own place)
  const hb = (q, i) => { const v = Math.sin(q.z * 12.9898 + q.x * 78.233 + i * 37.719) * 43758.5453; return v - Math.floor(v); };
  for (const q of lamps) if (q.wall && q.hall === 1 && !q.k && !q.up && hb(q, 1) < 0.62) benches.push({ hall: 1, s: Math.sign(q.x), x: Math.sign(q.x) * (h1.hw - 2.8 - 0.6 * hb(q, 3)), y: h1.y, z: q.z + (hb(q, 2) < 0.5 ? -1 : 1) * (5.2 + 1.6 * hb(q, 4)), len: 4.2 + 2.2 * hb(q, 5) });
  for (const q of lamps) if (q.wall && q.hall === 2 && !q.k && !q.up && hb(q, 1) < 0.6) benches.push({ hall: 2, s: Math.sign(q.x), x: q.x + Math.sign(q.x) * 0.7 * hb(q, 3), y: h2.y, z: q.z + (hb(q, 2) - 0.5) * 6, len: 4.4 + 3 * hb(q, 5) });
  return { pil, lamps, line, benches, ends, side1, cases, wins };
}
// An oil lamp: the brass font, the glass chimney with the flame in it (it flickers by its own number), a shade of tin
// over it. y: the flame; s = 1: a lamp a man carries in one hand, at this world's scale.
function oilLamp(b, x, y, z, s, num) {
  b.col([0.46, 0.33, 0.13]).surf(K.METAL, 0.3).lathe([[0, y - 0.66 * s], [0.3 * s, y - 0.6 * s], [0.36 * s, y - 0.42 * s], [0.12 * s, y - 0.2 * s]], 7, x, z);
  b.col([1, 0.76, 0.44]).surf(K.GLOW, 1.9, num).lathe([[0.13 * s, y - 0.2 * s], [0.25 * s, y], [0.2 * s, y + 0.32 * s], [0.1 * s, y + 0.66 * s]], 6, x, z);
  b.col([0.3, 0.26, 0.2]).surf(K.METAL, 0.2).lathe([[0.08 * s, y + 0.8 * s], [0.5 * s, y + 0.62 * s], [0.62 * s, y + 0.5 * s]], 8, x, z);
}
// WHAT HANGS HAS ITS HOOK. A lamp is carried on an iron bracket out of the wall (q.wall: [x, z] of the face it is
// rooted in), or it hangs on a chain (q.top: the under side of the stone or the beam over it, where a bronze boss
// holds the chain), or, where its place is within STANDGAP of the line, it stands on a bronze standard on the floor
// (q.post; q.foot: the floor): no chain comes down the whole picture beside the way. A hung or a standing lamp is
// half as large again as one on a bracket, with a broad shade: it is the reason of its chain or its standard.
const BRONZE = [0.4, 0.29, 0.13], STANDGAP = 24;
function lampDraw(b, q, num) {
  const s = q.s, ya = q.y + 1.5 * s;
  if (q.post || (q.top && !q.wall)) {
    const S = s * 1.5;
    b.col(BRONZE).surf(K.METAL, 0.35);
    if (q.post) { const f = q.foot, H = q.y - 0.66 * S - f; b.lathe([[1.0 * s, f], [0.86 * s, f + 0.06 * H], [0.36 * s, f + 0.14 * H], [0.2 * s, f + 0.32 * H], [0.14 * s, f + 0.8 * H], [0.4 * s, f + 0.9 * H], [0.14 * s, f + H]], 7, q.x, q.z); }
    else {
      // (the chain: lengths of bronze rod, a collar where one joins the next, up to the boss it hangs from)
      const y0 = q.y + 0.8 * S, n = Math.max(2, Math.ceil((q.top - y0) / (5 * s))), dy = (q.top - y0) / n;
      for (let i = 0; i < n; i++) {
        b.rod([q.x, y0 + i * dy, q.z], [q.x, y0 + (i + 1) * dy, q.z], 0.085 * s, 0.085 * s, 4);
        if (i) b.rod([q.x, y0 + i * dy - 0.22 * s, q.z], [q.x, y0 + i * dy + 0.22 * s, q.z], 0.2 * s, 0.2 * s, 4);
      }
      b.lathe([[0.75 * s, q.top + 0.05], [0.6 * s, q.top - 0.3 * s], [0.2 * s, q.top - 0.8 * s]], 6, q.x, q.z);
    }
    oilLamp(b, q.x, q.y, q.z, S, num);
    b.col([0.3, 0.26, 0.2]).surf(K.METAL, 0.2).lathe([[0.62 * S, q.y + 0.5 * S], [1.25 * S, q.y + 0.3 * S], [1.3 * S, q.y + 0.2 * S]], 8, q.x, q.z);
    return;
  }
  b.col([0.11, 0.1, 0.09]).surf(K.METAL, 0);
  // (far: a lamp that hangs high and far from the way: its bracket one rod, the flame in its glass, the shade)
  if (q.far) {
    b.rod([q.wall[0], ya, q.wall[1]], [q.x, ya, q.z], 0.07 * s, 0.06 * s, 3).rod([q.x, q.y + 0.8 * s, q.z], [q.x, ya, q.z], 0.04 * s, 0.04 * s, 3);
    b.col([1, 0.76, 0.44]).surf(K.GLOW, 1.9, num).lathe([[0.13 * s, q.y - 0.2 * s], [0.25 * s, q.y], [0.1 * s, q.y + 0.66 * s]], 5, q.x, q.z);
    b.col([0.3, 0.26, 0.2]).surf(K.METAL, 0.2).lathe([[0.08 * s, q.y + 0.8 * s], [0.62 * s, q.y + 0.5 * s]], 6, q.x, q.z);
    return;
  }
  b.rod([q.wall[0], ya, q.wall[1]], [q.x, ya, q.z], 0.07 * s, 0.06 * s, 4).rod([q.wall[0], ya - 1.6 * s, q.wall[1]], [(q.wall[0] + q.x) / 2, ya, (q.wall[1] + q.z) / 2], 0.05 * s, 0.05 * s, 4).rod([q.x, q.y + 0.8 * s, q.z], [q.x, ya, q.z], 0.04 * s, 0.04 * s, 4);
  oilLamp(b, q.x, q.y, q.z, s, num);
}
// a dark plain cloth hung in folds before a wall (the batch's frame: the wall at z = 0, x along it): no device on it.
// Its rod runs from r0 to r1, and BOTH ITS ENDS ARE HELD: in the first hall they lie within the band of the niche
// the cloth hangs before (the band stands 0.45 out of the built wall, the rod at 0.4 out of it); in the court the rod spans its arch from
// jamb to jamb, the cloth drawn to one side of it.
const HANGC = [[0.2, 0.24, 0.2], [0.3, 0.215, 0.155], [0.21, 0.23, 0.285]];
function hanging(b, x0, x1, yTop, yFoot, tint, zOut = 0.4, r0 = x0 - 0.5, r1 = x1 + 0.5) {
  b.col([0.11, 0.1, 0.09]).surf(K.METAL, 0).rod([r0, yTop + 0.15, zOut], [r1, yTop + 0.15, zOut], 0.1, 0.1, 4, true);
  b.col(HANGC[tint % 3]).surf(K.CLOTH, 0).tex(0, 1, 2).grid(Math.max(4, Math.round((x1 - x0) / 1.1)), 4, (u, v, o) => {
    o[0] = x0 + (x1 - x0) * u; o[1] = yTop - (yTop - yFoot) * v; o[2] = zOut + 0.26 * Math.sin(u * (x1 - x0) * 2.9 + x0) * (0.4 + 0.6 * v); o[3] = v * 1.2;
  }, true);
}
// The carved surround of a gate, standing out of the wall it is in; each gate has its own (kind). The first, in the
// cathedral's end wall: two stepped orders, a round shaft at each side, a plain lintel. The second and the third are
// built of masses, not of lines: one order round the opening, a pylon at each side on its plinth (a round shaft set in
// its inner corner), a heavy lintel block from pylon to pylon under a cornice on blocks; the third carries an attic of
// seven small blind arches over that. s is the measure of one order.
function surround(b, g, yb, kind = 1) {
  const s = g.w * 0.075, hwO = g.w / 2, top = g.y + g.h, n = kind ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const out = (i + 1) * s * 0.42, x0 = hwO + i * s, ht = top + i * s - yb;
    b.surf(K.STONE, s * 0.9).tex(0, 1, 2);
    for (const sd of [-1, 1]) b.box(sd * (x0 + s / 2), yb + ht / 2, g.z + out / 2, s, ht, out);
    b.box(0, top + i * s + s / 2, g.z + out / 2, 2 * (x0 + s), s, out);
  }
  if (kind === 0) {
    const xs = hwO + 2.9 * s, out = s * 1.9, capY = top + 1.1 * s;
    for (const sd of [-1, 1]) {
      b.surf(K.STONE, s * 0.9).box(sd * xs, yb + s * 0.5, g.z + out * 0.5, s * 1.9, s, out);
      b.surf(K.STONE, 0).lathe([[0.62 * s, yb + s], [0.56 * s, yb + s * 1.5], [0.5 * s, capY - s * 0.8], [0.62 * s, capY - s * 0.4], [0.8 * s, capY]], 10, sd * xs, g.z + out * 0.5);
      b.surf(K.STONE, s * 0.9).box(sd * xs, capY + s * 0.4, g.z + out * 0.5, s * 1.9, s * 0.8, out);
    }
    const yl = capY + s * 0.8, wl = 2 * xs + s * 1.9;
    b.box(0, yl + s * 0.7, g.z + out * 0.42, wl, s * 1.4, out * 0.84);
    b.surf(K.STONE, 0).box(0, yl + s * 1.65, g.z + out * 0.5, wl + s, s * 0.5, out);
    return;
  }
  const pw = g.w * 0.2, pd = g.w * 0.17, px = hwO + s + pw / 2, ph = top + s - yb, lh = s * (kind === 2 ? 2.4 : 1.5);
  for (const sd of [-1, 1]) {
    b.surf(K.STONE, s * 1.1, 0, 0.28).tex(0, 1, 2);
    for (let j = 0; j < 3; j++) b.box(sd * px, yb + ph * (j + 0.5) / 3, g.z + pd / 2, pw, ph / 3, pd);
    b.surf(K.STONE, 0).box(sd * px, yb + s, g.z + pd / 2 + s * 0.2, pw + s, 2 * s, pd + s * 0.6).box(sd * px, yb + ph + s * 0.3, g.z + pd / 2 + s * 0.15, pw + s * 0.7, s * 0.6, pd + s * 0.5);
    b.lathe([[0.7 * s, yb + 2 * s], [0.56 * s, yb + 2.6 * s], [0.5 * s, yb + ph - 1.6 * s], [0.62 * s, yb + ph - 0.9 * s], [0.8 * s, yb + ph]], 10, sd * (px - pw / 2 - 0.1 * s), g.z + pd + 0.1 * s);
  }
  const yl = yb + ph + s * 0.6, wl = 2 * (px + pw / 2) + s * 0.6;
  b.surf(K.STONE, s * 1.1).tex(0, 1, 2);
  for (let j = 0; j < 4; j++) b.box(-wl / 2 + (j + 0.5) * wl / 4, yl + lh / 2, g.z + pd * 0.5, wl / 4, lh, pd);
  b.surf(K.STONE, 0).box(0, yl + lh + s * 0.55, g.z + pd * 0.56, wl + s * 1.4, s * 0.5, pd * 1.12);
  for (let i = 0, m = Math.round(wl / (s * 1.1)); i < m; i++) b.box(-wl / 2 + (i + 0.5) * wl / m, yl + lh + s * 0.15, g.z + pd * 0.5 + s * 0.2, s * 0.5, s * 0.3, pd);
  if (kind === 2) {
    const ya = yl + lh + s * 0.8, r = wl / 7 * 0.3;
    b.surf(K.STONE, s * 0.9).tex(0, 1, 2);
    for (let j = 0; j < 4; j++) b.box(-wl / 2 + (j + 0.5) * wl / 4, ya + s * 1.9, g.z + pd * 0.3, wl / 4, s * 3.8, pd * 0.6);
    b.surf(K.STONE, 0);
    for (let i = -3; i <= 3; i++) archBand(b, i * wl / 7, ya + s * 0.5, ya + s * 2.1, r, s * 0.34, g.z + pd * 0.6, s * 0.3, 8);
    b.box(0, ya + s * 4.05, g.z + pd * 0.4, wl + s, s * 0.5, pd * 0.8);
  }
}
// The frame of the batch turned about y and set at a place of the hero's own frame: what is drawn after it in the plane
// z = 0 faces the way local +z points (yaw 0: the hero's +z).
const faceM = (M, x, y, z, yaw) => new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z));
// A wall in the plane z = z0 (seen from +z) between x0 and x1, y0 and y1, with a round-headed opening `w` wide about xc:
// its jambs rise from yb to the springing ys, its head is a half circle; the wall is `dep` thick (the soffit and the
// jambs are drawn that deep, behind the face); n: the pieces of the head.
function archWall(b, x0, x1, y0, y1, z0, xc, w, yb, ys, dep, cell = 6, n = 10) {
  const r = w / 2, PZ = [0, 0, 1];
  b.tex(0, 1, 2);
  b.sheet([x0, y0, z0], [xc - r - x0, 0, 0], [0, y1 - y0, 0], cell, PZ).sheet([xc + r, y0, z0], [x1 - xc - r, 0, 0], [0, y1 - y0, 0], cell, PZ);
  if (yb > y0 + 1e-3) b.sheet([xc - r, y0, z0], [w, 0, 0], [0, yb - y0, 0], cell, PZ);
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (1 - i / n), a1 = Math.PI * (1 - (i + 1) / n), p0 = [xc + r * Math.cos(a0), ys + r * Math.sin(a0)], p1 = [xc + r * Math.cos(a1), ys + r * Math.sin(a1)];
    b.quad([p0[0], p0[1], z0], [p1[0], p1[1], z0], [p1[0], y1, z0], [p0[0], y1, z0]);
    if (dep > 0) b.quad([p0[0], p0[1], z0], [p0[0], p0[1], z0 - dep], [p1[0], p1[1], z0 - dep], [p1[0], p1[1], z0], [0, 0, a0 * r], [0, dep, a0 * r], [0, dep, a1 * r], [0, 0, a1 * r]);
  }
  if (dep > 0 && ys > yb + 1e-3) { b.tex(2, 1, 0); b.sheet([xc - r, yb, z0], [0, 0, -dep], [0, ys - yb, 0], cell, [1, 0, 0]).sheet([xc + r, yb, z0], [0, 0, -dep], [0, ys - yb, 0], cell, [-1, 0, 0]); b.tex(0, 1, 2); }
  return b;
}
// A moulding round an arch, standing `dep` out of the wall at z0: two strips up the jambs (yb to ys) and a band `wb`
// wide round the head of radius r about xc.
function archBand(b, xc, yb, ys, r, wb, z0, dep, n = 10, full = false) {
  if (ys > yb + 1e-3) for (const s of [-1, 1]) b.box(xc + s * (r + wb / 2), (yb + ys) / 2, z0 + dep / 2, wb, ys - yb, dep);
  b.piece();
  // (full: the band goes all the way round, a ring)
  for (let i = 0; i < (full ? 2 * n : n); i++) {
    const a0 = Math.PI * (1 - i / n), a1 = Math.PI * (1 - (i + 1) / n), R = r + wb;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), z = z0 + dep;
    b.quad([xc + r * c0, ys + r * s0, z], [xc + r * c1, ys + r * s1, z], [xc + R * c1, ys + R * s1, z], [xc + R * c0, ys + R * s0, z]);
    b.quad([xc + r * c0, ys + r * s0, z], [xc + r * c0, ys + r * s0, z0], [xc + r * c1, ys + r * s1, z0], [xc + r * c1, ys + r * s1, z]);
    b.quad([xc + R * c0, ys + R * s0, z0], [xc + R * c0, ys + R * s0, z], [xc + R * c1, ys + R * s1, z], [xc + R * c1, ys + R * s1, z0]);
  }
  return b;
}
// A BAY OF A BUILT WALL, in the wall's own frame (the old wall in the plane z = 0, seen from +z; xa..xb along it): the
// wall is brought forward by e.dep from the floor e.y0 to the cornice e.yc, over a darker dado; a round-headed niche
// stands in it, as deep as the wall is brought forward, a moulding round it; at the niche's back a rack of bound
// files (rack) or the old stone; a cornice on blocks over all. The pilasters at its ends are the caller's.
function nicheBay(b, xa, xb, e, stone, bh, rack = true) {
  const w = xb - xa, xm = (xa + xb) / 2, r = e.w / 2, d = e.dep, yD = e.y0 + e.D;
  b.col(stone, 0.92).surf(K.STONE, bh, 0, 0.39); archWall(b, xa, xb, yD, e.yc, d, xm, e.w, e.yb, e.ys, d, 6, 10);
  b.col(stone, 0.72).surf(K.STONE, bh * 1.5, 0, 0.22).tex(0, 1, 2).box(xm, e.y0 + e.D / 2, (d + 0.5) / 2, w, e.D, d + 0.5);
  b.col(stone, 0.95).surf(K.STONE, 0).box(xm, yD + 0.3, (d + 0.8) / 2, w, 0.6, d + 0.8);
  b.col(stone, 1.08).surf(K.STONE, 1.2); archBand(b, xm, e.yb, e.ys, r, 0.8, d, 0.4);
  if (rack) b.col(PAL.wood, 0.52).surf(K.SHELF, 2.6, 1.7, e.yb).tex(0, 1, 2).sheet([xm - r, e.yb, 0.06], [e.w, 0, 0], [0, e.ys + r - e.yb, 0], 5, [0, 0, 1]);
  b.col(stone, 1.06).surf(K.STONE, 0).box(xm, e.yc + 0.6, (d + 1.1) / 2, w, 1.2, d + 1.1);
  for (let j = 0, n = Math.round(w / 1.6); j < n; j++) b.box(xa + (j + 0.5) * w / n, e.yc - 0.45, (d + 0.7) / 2, w / n * 0.5, 0.9, d + 0.7);
}
// a pilaster against a built wall (the same frame): its shaft from y0 to yc, a base and a cap
function pilaster(b, x, y0, yc, wid, out) {
  b.col(PIERC).surf(K.STONE, 1.4, 0, 0.28).tex(0, 1, 2).box(x, (y0 + yc) / 2, out / 2, wid, yc - y0, out);
  b.col(PIERC, 0.8).surf(K.STONE, 0).box(x, y0 + 1.1, (out + 0.3) / 2, wid + 0.6, 2.2, out + 0.3).box(x, yc - 0.6, (out + 0.3) / 2, wid + 0.6, 1.2, out + 0.3);
}
// a small window high in a wall (the same frame): its stone frame and sill, and behind its bars wet glass with the
// day's cold light in it (the bars stand a metre apart: the pane begins on a whole metre)
function barred(b, xc, y0, w, h, stone, pane) {
  const x0 = Math.round(xc - w / 2), xm = x0 + w / 2;
  b.col(stone, 1.1).surf(K.STONE, 0);
  for (const e of [-1, 1]) b.box(xm + e * (w / 2 + 0.3), y0 + h / 2, 0.35, 0.6, h + 1.2, 0.7);
  b.box(xm, y0 + h + 0.3, 0.35, w, 0.6, 0.7).box(xm, y0 - 0.35, 0.5, w + 1.6, 0.7, 1.0);
  b.col(pane).surf(K.GLASS, 1, 1, 1).tex(0, 1, 2).sheet([x0, y0, 0.1], [w, 0, 0], [0, h, 0], 4, [0, 0, 1]);
}
// a run of shelves of bound files standing against a wall (the same frame), on a plinth, under a top board; lad: a
// ladder leans on it (its rails' heads on the face of the shelves)
function fileCase(b, xa, xb, yb, yt, lad) {
  const xm = (xa + xb) / 2, dep = 1.1;
  b.col(PAL.wood, 0.52).surf(K.SHELF, 2.6, 1.7, yb + 0.8).tex(0, 1, 2).sheet([xa, yb + 0.8, dep], [xb - xa, 0, 0], [0, yt - yb - 0.8, 0], 6, [0, 0, 1]);
  b.col(PAL.wood, 0.45).surf(K.WOOD, 0).box(xm, yt + 0.15, dep / 2 + 0.1, xb - xa + 0.4, 0.3, dep + 0.2).box(xm, yb + 0.4, dep / 2 + 0.1, xb - xa + 0.4, 0.8, dep + 0.2);
  for (const x of [xa, xb]) b.box(x, (yb + yt) / 2, dep / 2, 0.24, yt - yb, dep);
  if (lad !== undefined) {
    const x = xa + (xb - xa) * (0.25 + 0.5 * lad), top = yb + (yt - yb) * (0.6 + 0.3 * lad), za = dep + 0.3 * (top - yb), zb = dep + 0.09;
    for (const e of [-0.65, 0.65]) b.rod([x + e, yb, za], [x + e, top, zb], 0.09, 0.09, 4);
    for (let r = 1, n = Math.round((top - yb) / 1.5); r < n; r++) b.rod([x - 0.65, yb + (top - yb) * r / n, za + (zb - za) * r / n], [x + 0.65, yb + (top - yb) * r / n, za + (zb - za) * r / n], 0.06, 0.06, 4);
  }
}
// THE BUILT WALLS OF THE HALLS (see gateFittings): the end walls' bays between their pilasters, the cases along hall
// 2's side walls under its galleries and on them, the small barred windows high up. pane: the day's colour in glass.
function* hallWalls(b, G, lightOf, fit, M, pane) {
  const cold = pane ? [pane[0] * 1.6, pane[1] * 1.9, pane[2] * 2.5] : [0.43, 0.53, 0.75];
  for (const hl of [1, 2]) {
    const h = G.hall[hl - 1], g = G.gate[hl];
    b.light(lightOf(hl)).tr(faceM(M, 0, 0, g.z, 0));
    for (const e of fit.ends) if (e.hall === hl) {
      nicheBay(b, Math.min(e.s * e.x0, e.s * e.x1), Math.max(e.s * e.x0, e.s * e.x1), e, WALLC[hl], [1.9, 2.6][hl - 1]);
      pilaster(b, e.s * e.x1, e.y0, e.yc, hl === 1 ? 2.6 : 3.2, e.dep + 0.7);
      if (e.first) pilaster(b, e.s * e.x0, e.y0, e.yc, hl === 1 ? 2.6 : 3.2, e.dep + 0.7);
    }
    yield;
    for (const w of fit.wins) if (w.hall === hl && w.n[1]) barred(b, w.x, w.y, w.w, w.h, WALLC[hl], cold);
    for (const s of [-1, 1]) {
      b.tr(faceM(M, s * h.hw, 0, 0, -s * Math.PI / 2));
      for (const w of fit.wins) if (w.hall === hl && w.n[0] === -s) barred(b, s * w.z, w.y, w.w, w.h, WALLC[hl], cold);
      if (hl === 2) {
        fit.cases.forEach((c, i) => { if (c.s === s) fileCase(b, Math.min(s * c.z0, s * c.z1), Math.max(s * c.z0, s * c.z1), c.yb, c.yt, i % 3 === 1 ? ((i * 0.37) % 1) : undefined); });
        // (a pilaster behind each column, under the gallery and on it)
        const d = (h.z0 - h.z1) / 5;
        for (let i = 0; i < 5; i++) { pilaster(b, s * (h.z0 - (i + 0.5) * d), h.y, h.y + 43.8, 3.6, 1.6); pilaster(b, s * (h.z0 - (i + 0.5) * d), h.y + 45, h.y + 78, 3, 1.4); }
      }
      yield;
    }
    b.tr(M);
  }
}
// Hall 1, low and solid: piers of a paler, smaller-coursed stone against both walls carrying stone beams under a flat
// roof and two long girders; between the piers a dark dado with its cap, a blind arch in each bay (a dark curtain
// hung before it in some), a string course over the arches on a carved band of blocks. The floor takes the light of
// the gate ahead in one long soft pool.
const PIERC = [0.5, 0.48, 0.44];
function* hallOne(b, G, lightOf, fit, M) {
  const h = G.hall[0], top = h.y + h.H, L = h.z0 - h.z1, DADO = 6.2, SC = h.y + 27;
  b.light(lightOf(1));
  for (const p of fit.pil) {
    for (const s of [-1, 1]) {
      b.col(PIERC).surf(K.STONE, 1.25, 0, 0.28).tex(0, 1, 2);
      for (let j = 0; j < 4; j++) b.box(s * (h.hw - p.w * 0.35), h.y + h.H * (j + 0.5) / 4, p.z, p.w * 0.7, h.H / 4, p.w);
      b.col(PIERC, 0.7).surf(K.STONE, 0);
      b.box(s * (h.hw - p.w * 0.5), h.y + 1.3, p.z, p.w, 2.6, p.w * 1.3); b.box(s * (h.hw - p.w * 0.5), top - 5, p.z, p.w, 1.3, p.w * 1.3);
      b.box(s * (h.hw - p.w * 0.45), SC, p.z, p.w * 0.9, 1.1, p.w * 1.16);
    }
    b.col(WALLC[1], 0.6).surf(K.STONE, 0);
    for (let i = 0; i < 8; i++) b.box(-h.hw + (i + 0.5) * h.hw / 4, top - 2.1, p.z, h.hw / 4, 4.2, p.w * 0.8);
    yield;
  }
  // the bays: from pier to pier (and from the end walls to the first and last)
  const zs = [h.z0, ...fit.pil.map((p) => p.z), h.z1];
  for (const s of [-1, 1]) {
    // (a wall's own frame: x along the hall towards the gate ahead on one side, back on the other; z out of the wall)
    b.tr(faceM(M, s * h.hw, 0, 0, -s * Math.PI / 2));
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], xa = s * za, xb = s * zb, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), w = x1 - x0, xm = (x0 + x1) / 2;
      b.col(WALLC[1], 0.76).surf(K.STONE, 3.1, 0, 0.28).tex(0, 1, 2);
      // (sk: a bay wide enough for an arch is built forward by 0.9 m from its dado to its string course, and the
      // arch is a niche in it; in some stands a rack of bound files, a lamp on a bracket before its head)
      const sk = w > 9 ? 0.9 : 0, bayOf = fit.side1.find((e) => e.i === i && e.s === s);
      for (let j = 0; j < 2; j++) b.box(x0 + (j + 0.5) * w / 2, h.y + DADO / 2, (0.8 + sk) / 2, w / 2, DADO, 0.8 + sk);
      b.col(WALLC[1], 0.9).surf(K.STONE, 0);
      for (let j = 0; j < 2; j++) { b.box(x0 + (j + 0.5) * w / 2, h.y + DADO + 0.3, (1.1 + sk) / 2, w / 2, 0.6, 1.1 + sk); b.box(x0 + (j + 0.5) * w / 2, SC, (1 + sk) / 2, w / 2, 1.1, 1.0 + sk); }
      // (the carved band under the string course: a row of blocks, each a man's hand at this scale)
      for (let j = 0, n = Math.round(w / 1.3); j < n; j++) b.box(x0 + (j + 0.5) * w / n, SC - 0.95, (0.8 + sk) / 2, w / n * 0.5, 0.8, 0.8 + sk);
      if (w > 9) {
        const r = Math.min(4.6, (w - 5.4) / 2), ys = SC - 2.6 - r, pier = fit.pil[Math.min(i, fit.pil.length - 1)], yb = h.y + DADO + 0.6;
        b.col(WALLC[1], 0.9).surf(K.STONE, 1.9, 0, 0.39); archWall(b, x0, x1, h.y + DADO, SC - 0.5, sk, xm, 2 * r, yb, ys, sk, 6, 10);
        b.col(WALLC[1], 1.0).surf(K.STONE, 1.2); archBand(b, xm, yb, ys, r, 0.8, sk, 0.45);
        if (bayOf && bayOf.rack) b.col(PAL.wood, 0.52).surf(K.SHELF, 2.6, 1.7, yb).tex(0, 1, 2).sheet([xm - r, yb, 0.06], [2 * r, 0, 0], [0, ys + r - yb, 0], 5, [0, 0, 1]);
        else {
          // (the field of the niche: the old stone, a shade darker than the wall)
          b.col(WALLC[1], 0.8).surf(K.STONE, 1.9, 0, 0.28).tex(0, 1, 2).sheet([xm - r, yb, 0.08], [2 * r, 0, 0], [0, ys - yb, 0], 3, [0, 0, 1]);
          for (let k = 0; k < 6; k++) { const a0 = Math.PI * (1 - k / 6), a1 = Math.PI * (1 - (k + 1) / 6); b.tri([xm, ys, 0.08], [xm + r * Math.cos(a1), ys + r * Math.sin(a1), 0.08], [xm + r * Math.cos(a0), ys + r * Math.sin(a0), 0.08]); }
        }
        if (pier && pier.hang[s > 0 ? 1 : 0]) hanging(b, xm - r + 0.3, xm + r - 0.3, ys + 0.2, h.y + DADO + 1.4, pier.tint + i, sk + 0.4);
      }
    }
    b.tr(M);
    yield;
  }
  b.col(WALLC[1], 0.6).surf(K.STONE, 0);
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) b.box(s * h.hw * 0.4, top - 1.3, h.z0 - (i + 0.5) * L / 8, 2.8, 2.6, L / 8);
  yield;
}
// Hall 2, taller: a row of columns down each side, a gallery over each row behind a balustrade, slighter columns on the
// gallery, great beams across under the roof.
function* hallTwo(b, G, lightOf) {
  const h = G.hall[1], L = h.z0 - h.z1, xc = h.hw - 24, n = 5, y = h.y, colH = 40, galY = y + colH + 5, top = y + h.H, d = L / n;
  b.light(lightOf(2));
  for (let i = 0; i < n; i++) {
    const z = h.z0 - (i + 0.5) * d;
    for (const s of [-1, 1]) {
      b.col(PIERC, 0.74).surf(K.STONE, 1.5).tex(0, 1, 2).box(s * xc, y + 1.5, z, 10.4, 3, 10.4);
      b.col(PIERC).surf(K.STONE, 1.7).lathe([[4.5, y + 3], [3.9, y + 4.6], [3.7, y + 16], [3.6, y + 28], [3.5, y + colH - 4.5], [4.2, y + colH - 2.4], [5.3, y + colH]], 12, s * xc, z);
      b.col(WALLC[2], 0.9);
      b.surf(K.STONE, 2.6).box(s * xc, y + colH + 1, z, 11.4, 2, 11.4);
      b.surf(K.STONE, 0).lathe([[3, galY + 0.6], [2.6, galY + 2.4], [2.3, galY + 30], [3.3, galY + 33]], 10, s * xc, z);
      b.surf(K.STONE, 2.6).box(s * xc, galY + 34, z, 7.6, 2, 7.6);
      b.col(WALLC[2], 0.96).box(s * xc, y + colH + 3.5, z, 7, 3, d);
      b.box(s * xc, galY + 36.5, z, 5.4, 3, d);
      b.col(WALLC[2], 0.72).tex(0, 2, 1);
      for (let j = 0; j < 3; j++) b.box(s * (xc + 4 + j * 8), galY - 0.6, z, 8, 1.2, d);
      b.col(WALLC[2], 1.04).tex(0, 1, 2).box(s * (xc - 3.3), galY + 3.3, z, 1, 0.7, d);
      for (let j = 0; j < 7; j++) b.lathe([[0.42, galY], [0.2, galY + 1], [0.5, galY + 2], [0.3, galY + 3]], 5, s * (xc - 3.3), z - d / 2 + (j + 0.5) * d / 7);
    }
    b.col(WALLC[2], 0.8).surf(K.STONE, 0);
    for (let j = 0; j < 10; j++) b.box(-h.hw + (j + 0.5) * h.hw / 5, top - 3, z, h.hw / 5, 6, 5);
    yield;
  }
}
// The last court, behind gate 3: an inner court of the law, eight-sided under a vault with a lantern. Six of its faces
// are alike: an arcade of three round arches on piers with a walk behind it (lamps on brackets along its back wall), a
// gallery over the arcade behind a balustrade (two small arches on a column to each bay), three tall blind arches over
// that, a cornice on blocks, and the vault springing from it. The face we come in by and the face of the great door
// each stand open between two towers under one great arch. The measures of it (all in the frame of a face: x along
// the face, the wall at z = -A, the court's middle at 0):
export function courtMeasure(side = 1) {
  const G = GATES, C = G.court, D = C.door, g3 = G.gate[2], ct = C.turn * side, zc = g3.z - g3.t - C.A, T8 = Math.tan(Math.PI / 8);
  const A = C.A, AP = A - 14, hA = AP * T8, hB = A * T8, y0 = C.y, bay = 2 * hA / 3, yL = y0 + D.n * D.rise, zTop = -(A - D.deep), zFoot = zTop + D.n * D.tread;
  const m = { ct, zc, A, AP, hA, hB, T8, y0, bay, yL, zTop, zFoot, Y1: y0 + 40, Y2: y0 + 68, Y3: y0 + C.wall, YS: y0 + 24, YG: y0 + 57, RL: 22, VH: 44,
    phi: (j) => Math.PI + ct * j * Math.PI / 4, plain: [1, 2, 4, 5, 6, 7], open: [{ j: 0, xo: hA - 1.6, yb: y0 }, { j: 3, xo: D.w / 2 + 3, yb: yL }] };
  // What stands in it, all of a man's measure: this world's own lamps (one carried on a bracket out of the shelves of
  // the walk behind each arch, one hung in each arch, more on long chains or on standards over the floor in rings,
  // three on posts on each cheek of the great door's flight, a standard in each knot beside the way); a few short
  // benches before the arcades and by some lamps of the rings, each at a place and of a length of its own, no two
  // in a line; the clerks' lecterns, at most eight, in the walk behind the arcade against the shelves. NO DESK
  // STANDS ON THE OPEN FLOOR AND NOTHING STANDS IN RANKS. A hung lamp whose place lies within LAMPGAP of the line
  // is not hung (its place alone decides).
  m.brackets = []; m.hung = []; m.benches = []; m.lecterns = []; m.gaps = []; m.high = []; m.files = [];
  // (inDoor: is a place of face j, with `pad` about it, within the great door's flight, its cheeks or its landing?
  // No lamp of the rings is hung there (a lamp on a post lights each cheek), nothing is set down on the court's
  // floor there, and no knot is asked for there: that floor is the flight's)
  m.inDoor = (q, pad = 0) => {
    const a = m.phi(q.j), a3 = m.phi(3), X = q.x * Math.cos(a) + q.z * Math.sin(a), Z = -q.x * Math.sin(a) + q.z * Math.cos(a);
    return Math.abs(X * Math.cos(a3) - Z * Math.sin(a3)) < D.W / 2 + 5.5 + pad && X * Math.sin(a3) + Z * Math.cos(a3) < zFoot + pad;
  };
  const line = gateRoute(side, 2), gapOf = (q) => { const a = m.phi(q.j), c = Math.cos(a), s = Math.sin(a); return gapToWalk(line, q.x * c + q.z * s, q.y - q.s, q.top ?? q.y + 2 * q.s, zc - q.x * s + q.z * c); }, near = (q) => gapOf(q) < LAMPGAP;
  for (const j of m.plain) {
    for (let i = -1; i <= 1; i++) {
      // (a bracket is rooted in the face of the shelves, at z = -A; a lamp in an arch hangs from the crown of its soffit,
      // a half circle of 7.5 m over the springing)
      m.brackets.push({ j, x: i * bay, y: y0 + 7.8, z: -A + 2.6, s: 1.2, wall: [i * bay, -A], reach: 7 });
      m.hung.push({ j, x: i * bay, y: y0 + 7.6, z: -AP - 2.2, s: 1.2, top: m.YS + 7.5, arch: 1, reach: 7.5 });
    }
  }
  // (un: a number of each place's own, the same on every visit)
  const un = (a, b2, c) => { const v = Math.sin(a * 12.9898 + b2 * 78.233 + c * 37.719) * 43758.5453; return v - Math.floor(v); };
  {
    let n = 0;
    for (const j of m.plain) {
      // (a bench before some bays of the arcade: 5 to 8 m long, off the bay's middle, 3.6 to 6 m before the piers)
      for (let i = -1; i <= 1; i++) if (un(j, i, 51) < 0.6) m.benches.push({ j, x: i * bay + (un(j, i, 53) - 0.5) * 9, z: -AP + 3.6 + 2.4 * un(j, i, 54), len: 5.2 + 3 * un(j, i, 52) });
      // (a lectern in the walk, its step against the shelves, beside a pier's line on the side away from the
      // ladder that leans there)
      for (const s of [-1, 1]) if (un(j, s, 55) < 0.62 && n < 8) { m.lecterns.push({ j, x: s * bay / 2 - (j % 2 ? 1 : -1) * (3.6 + 1.6 * un(j, s, 56)), z: -A + 3.7 }); n++; }
    }
  }
  // (the vault's height over a place whose face lies a metres out: the web as it is BUILT, in six flat lengths from
  // the cornice to the lantern's ring (courtCrown), so that a chain's boss sits on the stone it hangs from)
  const vaultY = (a) => {
    const at = (f) => [m.RL + (AP - m.RL) * Math.cos(f * Math.PI / 2), m.Y3 + 2.4 + m.VH * Math.sin(f * Math.PI / 2)];
    for (let i = 0; i < 6; i++) { const [a0, h0] = at(i / 6), [a1, h1] = at((i + 1) / 6); if (a <= a0 && a >= a1) return h0 + (h1 - h0) * (a0 - a) / (a0 - a1); }
    return m.Y3 + 2.4 + m.VH;
  };
  // (the rings over the floor: 16 m apart, out to 14 m before the arcade; one ring's lamps on the faces' axes, the
  // next ring's between two faces)
  // (a lamp on a face's axis hangs from the web; one between two faces hangs from the rib that runs up there, whose
  // under side lies 1.45 m under the web's line)
  for (let j = 0; j < 8; j++) for (let k = 0, r = 44; r < AP - 14; k++, r += 16) {
    const a = k % 2 ? Math.PI / 8 : 0, q = { j, x: r * Math.sin(a), y: y0 + 8, z: -r * Math.cos(a), s: 1.5, top: vaultY(r * Math.cos(a)) - (k % 2 ? 1.45 : 0), foot: y0, reach: 9.5 };
    if (m.inDoor(q)) continue;
    // (a lamp of the rings whose place is within STANDGAP of the line stands on a standard: see lampDraw)
    if (!near(q)) { if (gapOf(q) < STANDGAP) q.post = 1; m.hung.push(q); } else m.gaps.push(q);
  }
  m.hung = m.hung.filter((q) => !near(q));
  // (gaps: the places of the rings over which no lamp hangs because the way passes there; people stand there too)
  // MORE LAMPS, so that every face is seen from its floor to its cornice: along the shelves of the walk and of the
  // gallery, up the piers, on the corner shafts under the vault. Their places are uneven (un: a number of each
  // place's own, the same on every visit): never a second regular row. Each is drawn plainly (far).
  for (const j of m.plain) {
    for (let i = -1; i <= 1; i++) {
      // (none over a lectern: the lectern has its own)
      if (un(j, i, 1) < 0.8) { const x = i * bay + (un(j, i, 2) < 0.5 ? -1 : 1) * bay * (0.24 + 0.14 * un(j, i, 3)); if (!m.lecterns.some((l) => l.j === j && Math.abs(l.x - x) < 3.4)) m.high.push({ j, x, y: y0 + 7 + 5 * un(j, i, 4), z: -A + 2.4, s: 1.2, wall: [x, -A], reach: 7.5, far: 1 }); }
      for (let k = 0; k < 2; k++) if (un(j, i, 5 + k) < 0.82) { const x = i * bay + (k - 0.5) * bay * (0.36 + 0.3 * un(j, i, 7 + k)); m.high.push({ j, x, y: m.Y1 + 6.5 + (un(j, i, 9 + k) < 0.3 ? 9 : 0) + 4 * un(j, i, 11 + k), z: -A + 2.6, s: 1.4, wall: [x, -A], reach: 9, far: 1 }); }
    }
    for (const s of [-1, 1]) {
      const x = s * bay / 2;
      if (un(j, s, 13) < 0.85) m.high.push({ j, x, y: y0 + 13 + 12 * un(j, s, 14), z: -AP + 1.9, s: 1.4, wall: [x, -AP], reach: 9, far: 1 });
      if (un(j, s, 15) < 0.6) m.high.push({ j, x, y: m.Y1 + 9 + 8 * un(j, s, 16), z: -AP + 1.7, s: 1.3, wall: [x, -AP], reach: 9, far: 1 });
    }
  }
  // (a corner is the +x end of a face; the bracket stands out of its shaft towards the court's middle, rooted 1.7 m
  // from the shaft's axis: within its eight flat sides at every height)
  for (let j = 0; j < 8; j++) for (let k = 0; k < 2; k++) if (un(j, k, 17) < 0.8) m.high.push({ j, x: hA - 1.6, y: (k ? m.Y2 + 8 : m.Y1 + 12) + 14 * un(j, k, 18), z: -AP + 3.9, s: 1.6, wall: [hA - 0.65, -AP + 1.57], reach: 11, far: 1 });
  m.high = m.high.filter((q) => !near(q));
  // under some lamps of the rings a bench for those who wait (the faces' own kind, its back to the wall), and by
  // some a few bundles of files set down on the paving: no desk stands on this floor
  for (const [i, q] of m.hung.entries()) if (q.z > -AP + 4) {
    if (un(q.j, i, 21) < 0.38 && !m.inDoor({ j: q.j, x: q.x, z: q.z - 6.2 }, 8)) m.benches.push({ j: q.j, x: q.x + (un(q.j, i, 27) - 0.5) * 5, z: q.z - 6.2, len: 5.2 + 3 * un(q.j, i, 28), ring: 1 });
    if (un(q.j, i, 22) < 0.6 && !m.inDoor(q, 6)) m.files.push({ j: q.j, x: q.x + 3.4 * (un(q.j, i, 23) - 0.5), z: q.z + 2.2 + 1.6 * un(q.j, i, 24), n: 2 + Math.floor(3 * un(q.j, i, 25)), a: un(q.j, i, 26) });
  }
  // KNOTS OF PEOPLE BESIDE THE WAY. The rings leave the middle of the floor empty, and the way crosses it:
  // more places where people stand together, uneven (each from numbers of its own sector, the same on every visit),
  // kept where a knot stands 13 to 58 m from the line, 9 m clear of every ring lamp's place and of one another. The
  // four rings stand as they are; each knot has a standard of its own (kposts, below); by some a bench, by some a
  // few bundles of files.
  // (twenty-four at most)
  m.knots = [];
  {
    const at = (q) => { const a = m.phi(q.j), c = Math.cos(a), s = Math.sin(a); return [q.x * c + q.z * s, -q.x * s + q.z * c]; };
    const taken = m.hung.filter((q) => q.z > -AP + 4).map(at);
    // (the knots that stand to either side of the way where a ring's lamp is not hung are in the same list)
    for (const q of m.gaps) for (const sd of [-1, 1]) taken.push(at({ j: q.j, x: q.x + sd * 15, z: q.z }));
    for (let k = 0; k < 9; k++) for (let j = 0; j < 8; j++) {
      const r = 10 + 78 * un(j, k, 31), a = (un(j, k, 32) - 0.5) * Math.PI / 4, q = { j, x: r * Math.sin(a), z: -r * Math.cos(a) }, [X, Z] = at(q);
      const d = gapToWalk(line, X, y0, y0 + 6, zc + Z);
      if (d < 13 || d > 58 || m.knots.length >= 24 || taken.some(([x, z]) => Math.hypot(x - X, z - Z) < 9)) continue;
      taken.push([X, Z]); m.knots.push(q);
      if (un(j, k, 33) < 0.4 && !m.inDoor({ j, x: q.x, z: q.z - 6.2 }, 8)) m.benches.push({ j, x: q.x + (un(j, k, 39) - 0.5) * 5, z: q.z - 6.2, len: 5.2 + 3 * un(j, k, 40), ring: 1 });
      if (un(j, k, 34) < 0.6 && !m.inDoor(q, 6)) m.files.push({ j, x: q.x + 3.4 * (un(j, k, 35) - 0.5), z: q.z + 2.2 + 1.6 * un(j, k, 36), n: 2 + Math.floor(3 * un(j, k, 37)), a: un(j, k, 38) });
    }
  }
  // EACH KNOT BESIDE THE WAY STANDS UNDER A LAMP OF ITS OWN: a standard in its middle, for the knots at the places
  // the rings leave empty and for the two that stand to either side of the way where a ring's lamp is not hung.
  // Those who stand there take its light. Their places are the knots' own, uneven; none within LAMPGAP of the line.
  m.kposts = [];
  for (const q of m.knots) if (!m.inDoor(q, 4)) m.kposts.push({ j: q.j, x: q.x, y: y0 + 8.4, z: q.z, s: 1.4, foot: y0, post: 1, reach: 11 });
  for (const q of m.gaps) for (const sd of [-1, 1]) { const p = { j: q.j, x: q.x + sd * 15, y: y0 + 8.4, z: q.z, s: 1.4, foot: y0, post: 1, reach: 11 }; if (!near(p) && !m.inDoor(p, 8)) m.kposts.push(p); }
  // ON THE GALLERY, against its shelves: here and there a clerk's stand, a boarded platform on brackets out of the
  // shelves with a rail before it and a ladder up to it from the gallery's floor (y: the platform's top; a man may
  // stand on it at the files). Uneven places and heights (un).
  m.stands = [];
  for (const j of m.plain) for (let i = -1; i <= 1; i++) if (un(j, i, 41) < 0.5) m.stands.push({ j, x: i * bay + (un(j, i, 42) - 0.5) * bay * 0.5, y: m.Y1 + 10 + 5 * un(j, i, 43), z: -A + 0.95, e: un(j, i, 44) < 0.5 ? 1 : -1 });
  // THE GREAT DOOR'S FLIGHT IS LIT: a lamp on a post on each of the three blocks of each cheek (the lowest by the foot
  // of the steps), so that those who stand and sit up the sides of the flight have a lamp near them; down its middle
  // falls the door's own light. (k: which block, 2 the lowest; its top is the cheek's own measure, as in courtDoor)
  m.posts = [];
  for (const s of [-1, 1]) for (const k of [2, 1, 0]) { const foot = y0 + (yL - y0) * (1.3 - 0.42 * k); m.posts.push({ j: 3, x: s * (D.W / 2 + 2.6), y: foot + 5.4, z: zTop + (zFoot - zTop) * (k + 0.5) / 3, s: 1.6, foot, reach: 12 }); }
  return m;
}
// one face's arcade, gallery, blind arches and cornice (the batch is in that face's frame; j: which face)
function courtFace(b, m, stone, j) {
  const { AP, A, hA, hB, bay, y0, Y1, Y2, Y3, YS, YG } = m, z = -AP;
  // the back wall of the walk and of the gallery is shelves of files from the floor to the ceiling (cupboards at the
  // foot), with ladders to them (a ladder's rails lean on the face of the shelves, at z = -A); and their ceilings
  b.col(PAL.wood, 0.52).surf(K.SHELF, 3.1, 1.9, y0).tex(0, 1, 2).sheet([-hB, y0, -A], [2 * hB, 0, 0], [0, Y1 - 2 - y0, 0], 6, [0, 0, 1]);
  b.col(PAL.wood, 0.5).surf(K.SHELF, 3.1, 1.9, Y1).sheet([-hB, Y1, -A], [2 * hB, 0, 0], [0, Y2 - Y1, 0], 10, [0, 0, 1]);
  b.col(PAL.wood, 0.5).surf(K.WOOD, 0);
  for (const s of [-1, 1]) {
    const x = s * bay * 0.5 + (j % 2 ? 1.9 : -1.9), top = y0 + 15 + 4 * ((j + (s > 0 ? 1 : 0)) % 3), za = -A + 4.7, zb = -A + 0.09;
    for (const e of [-0.65, 0.65]) b.rod([x + e, y0, za], [x + e, top, zb], 0.09, 0.09, 4);
    for (let r = 1, n = Math.round((top - y0) / 1.5); r < n; r++) b.rod([x - 0.65, y0 + (top - y0) * r / n, za + (zb - za) * r / n], [x + 0.65, y0 + (top - y0) * r / n, za + (zb - za) * r / n], 0.06, 0.06, 4);
  }
  for (const [y, n] of [[Y1 - 2, 6], [Y2 - 0.6, 3]]) for (let i = 0; i < n; i++) {
    const u0 = i / n * 2 - 1, u1 = (i + 1) / n * 2 - 1;
    b.col(stone, 0.62).surf(K.STONE, 4.6).quad([u0 * hA, y, z], [u0 * hB, y, -A], [u1 * hB, y, -A], [u1 * hA, y, z]);
  }
  for (let i = -1; i <= 1; i++) {
    const xc = i * bay;
    // the arcade
    b.col(stone, 1.0).surf(K.STONE, 3.6, 0, 0.39); archWall(b, xc - bay / 2, xc + bay / 2, YS, Y1, z, xc, 15, YS, YS, 4.4, 6, 10);
    b.col(stone, 1.14).surf(K.STONE, 1.6); archBand(b, xc, YS, YS, 7.5, 1.2, z, 0.5);
    // a dark plain curtain in most arches, drawn to one side as an office's are
    if ((j + i + 8) % 3) { const sg = (j + i + 8) % 2 ? 1 : -1, xa = xc + sg * 7.2; hanging(b, Math.min(xa, xa - sg * 4.4), Math.max(xa, xa - sg * 4.4), YS - 0.5, y0 + 0.4, j + i + 8, z - 3.5, xc - 7.7, xc + 7.7); }
    // the gallery: its balustrade, a column, two small arches
    b.col(stone, 1.08).surf(K.STONE, 0).box(xc, Y1 + 0.6, z + 0.5, bay, 1.2, 1.5).box(xc, Y1 + 4.6, z + 0.2, bay, 0.7, 1.1);
    for (let k = 0; k < 9; k++) b.lathe([[0.5, Y1 + 1.2], [0.24, Y1 + 2.2], [0.56, Y1 + 3.2], [0.3, Y1 + 4.25]], 5, xc - bay / 2 + (k + 0.5) * bay / 9, z + 0.2);
    b.lathe([[1.5, Y1 + 1.2], [1.1, Y1 + 2.6], [0.95, YG - 2.2], [1.15, YG - 1.2], [1.7, YG]], 8, xc, z - 1.3);
    for (const s of [-1, 1]) {
      b.col(stone, 0.96).surf(K.STONE, 3.6, 0, 0.39); archWall(b, xc + s * bay / 4 - bay / 4, xc + s * bay / 4 + bay / 4, YG, Y2, z, xc + s * bay / 4, 7.6, YG, YG, 2.6, 6, 8);
    }
    // the tall blind arch over them, its field a shade darker
    b.col(stone, 1.0).surf(K.STONE, 3.6, 0, 0.39); archWall(b, xc - bay / 2, xc + bay / 2, Y2, Y3, z, xc, 13, Y2 + 4, y0 + 90, 1.5, 7, 10);
    b.col(stone, 0.66).sheet([xc - 6.5, Y2 + 4, z - 1.5], [13, 0, 0], [0, y0 + 86 - Y2, 0], 7, [0, 0, 1]);
    for (let k = 0; k < 8; k++) { const a0 = Math.PI * (1 - k / 8), a1 = Math.PI * (1 - (k + 1) / 8); b.tri([xc, y0 + 90, z - 1.5], [xc + 6.5 * Math.cos(a1), y0 + 90 + 6.5 * Math.sin(a1), z - 1.5], [xc + 6.5 * Math.cos(a0), y0 + 90 + 6.5 * Math.sin(a0), z - 1.5]); }
    b.col(stone, 1.12).surf(K.STONE, 1.6); archBand(b, xc, Y2 + 4, y0 + 90, 6.5, 1.0, z, 0.45);
    b.surf(K.STONE, 0).box(xc, Y2 + 0.5, z + 0.45, bay, 1.0, 1.3);
  }
  // the piers of the arcade (their plinths and imposts), and the small piers of the gallery over them
  for (const s of [-1, 1]) {
    const x = s * bay / 2;
    b.col(stone, 1.04).surf(K.STONE, 2.4, 0, 0.33).box(x, (y0 + YS) / 2, z - 2.2, 6, YS - y0, 4.4);
    b.col(stone, 1.12).surf(K.STONE, 0).box(x, y0 + 1.4, z - 2.2, 7.4, 2.8, 5.8).box(x, YS - 0.7, z - 2.2, 7, 1.4, 5.4);
    b.col(stone, 1.0).surf(K.STONE, 2.4).box(x, (Y1 + 1.2 + YG) / 2, z - 1.3, 3.0, YG - Y1 - 1.2, 2.6);
  }
}
// the cornice of a face on its blocks, the web of the vault over it, the rib up the corner at its +x end, the corner's
// pier and the shaft that carries the rib, and a share of the lantern
function courtCrown(b, m, stone) {
  const { AP, hA, T8, y0, Y1, Y2, Y3, YS, RL, VH } = m, z = -AP;
  for (let i = 0; i < 3; i++) b.col(stone, 1.1).surf(K.STONE, 0).box((i - 1) * 2 * hA / 3, Y3 + 1.2, z + 1.0, 2 * hA / 3, 2.4, 3.2);
  for (let i = 0; i < 21; i++) b.box(-hA + (i + 0.5) * 2 * hA / 21, Y3 - 0.6, z + 0.8, 1.0, 1.2, 1.7);
  const at = (f) => [RL + (AP - RL) * Math.cos(f * Math.PI / 2), Y3 + 2.4 + VH * Math.sin(f * Math.PI / 2)];
  for (let i = 0; i < 6; i++) {
    const [a0, h0] = at(i / 6), [a1, h1] = at((i + 1) / 6);
    b.col(stone, 0.8).surf(K.STONE, 5.2);
    for (const s of [-1, 0]) b.quad([s * a0 * T8, h0, -a0], [(s + 1) * a0 * T8, h0, -a0], [(s + 1) * a1 * T8, h1, -a1], [s * a1 * T8, h1, -a1]);
    b.col(stone, 1.14).surf(K.STONE, 0).rod([a0 * T8, h0 - 0.5, -a0], [a1 * T8, h1 - 0.5, -a1], 1.1, 1.1, 5);
  }
  // (the lantern: a ring under it, and its light, cool and even)
  b.col(stone, 1.1).surf(K.STONE, 0).box(0, Y3 + 2.4 + VH - 1.0, -RL, 2 * RL * T8, 2.2, 1.6);
  b.col([0.62, 0.7, 0.86]).surf(K.GLOW, 0.75).tri([0, Y3 + 2.4 + VH + 0.05, 0], [-RL * T8, Y3 + 2.4 + VH + 0.05, -RL], [RL * T8, Y3 + 2.4 + VH + 0.05, -RL]);
  // the corner: an eight-sided pier to the arcade's springing, a shaft on it to the cornice, ringed at each storey
  b.col(stone, 1.06).surf(K.STONE, 2.4, 0, 0.33).lathe([[4.9, y0], [4.9, y0 + 2.8], [4.1, y0 + 3.4], [4.1, YS - 1.4], [4.7, YS - 1.2], [4.7, YS + 0.2], [2.3, YS + 1.2], [2.3, Y1], [2.9, Y1 + 0.4], [2.9, Y1 + 1.4], [2.2, Y1 + 1.8], [2.2, Y2], [2.8, Y2 + 0.4], [2.8, Y2 + 1.2], [2.1, Y2 + 1.6], [2.1, Y3 - 1.6], [3.2, Y3]], 8, hA, z);
}
// a face that stands open (the gate we come in by, the great door): the wall round its opening (wo wide, ho high over
// yb), a tower at each side from the opening to the corner, one great arch from tower to tower under the cornice
function courtOpen(b, m, stone, q, wo, ho) {
  const { AP, A, hA, hB, y0, Y1, Y2, Y3 } = m, z = -AP, xo = q.xo, ys = Y3 - 6 - xo, PZ = [0, 0, 1];
  b.col(stone, 0.9).surf(K.STONE, 4.6, 0, 0.33).tex(0, 1, 2);
  for (const s of [-1, 1]) b.sheet([s > 0 ? wo / 2 : -hB, y0, -A], [hB - wo / 2, 0, 0], [0, Y3 - y0, 0], 8, PZ);
  b.sheet([-wo / 2, q.yb + ho, -A], [wo, 0, 0], [0, Y3 - q.yb - ho, 0], 8, PZ);
  for (const s of [-1, 1]) {
    b.col(stone, 1.0).surf(K.STONE, 3.6, 0, 0.39).tex(0, 1, 2).sheet([s > 0 ? xo : -hA, y0, z], [hA - xo, 0, 0], [0, Y3 - y0, 0], 6, PZ);
    b.tex(2, 1, 0).sheet([s * xo, y0, z], [0, 0, -14], [0, ys - y0, 0], 7, [-s, 0, 0]).tex(0, 1, 2);
    b.col(stone, 1.12).surf(K.STONE, 0);
    for (const y of [Y1 + 0.6, Y2 + 0.5]) b.box(s * (xo + hA) / 2, y, z + 0.45, hA - xo, 1.1, 1.3);
    b.box(s * (xo + 0.6), ys - 0.9, z - 7, 2.2, 1.8, 14.6);
  }
  b.col(stone, 1.0).surf(K.STONE, 3.6, 0, 0.39); archWall(b, -xo, xo, ys, Y3, z, 0, 2 * xo, ys, ys, 14, 8, 16);
  b.col(stone, 1.14).surf(K.STONE, 1.8); archBand(b, 0, ys, ys, xo - 2.2, 2.2, z, 0.8, 16);
}
// the great door: the flight of steps up to its landing, the frame of the door itself, and the doors within it, each
// `gap` behind the last and `k` its size, each chamber between them brighter; rs: the steps' own stream
const LASTDEEP = 26;
function* courtDoor(b, m, stone, D, nF, lightOf, lampF, rs) {
  const { A, y0, yL, zTop, zFoot } = m, UP = [0, 1, 0], PZ = [0, 0, 1], base = lightOf(3);
  b.light((x, y, z, nx, ny, nz, o) => (ny < 0.5 && ny > -0.5 ? base(x, y, z, nx * 0.66, 0.75, nz * 0.66, o) : base(x, y, z, nx, ny, nz, o)));
  for (let i = 0; i < D.n; i++) {
    const zf = zFoot - i * D.tread, y = y0 + i * D.rise, tone = 0.92 + 0.16 * rs();
    b.col([0.42, 0.42, 0.42], tone).surf(K.STONE, D.rise * 3.1, 0.5).tex(0, 2, 1);
    b.sheet([-D.W / 2, y + D.rise, zf], [D.W, 0, 0], [0, 0, -D.tread], D.tread, UP).sheet([-D.W / 2, y, zf], [D.W, 0, 0], [0, D.rise * 0.72, 0], D.W / 10, PZ);
    b.col([0.5, 0.5, 0.5], tone).box(0, y + D.rise * 0.86, zf + 0.1, D.W, D.rise * 0.28, 0.24);
  }
  yield;
  b.light(base).col([0.42, 0.42, 0.42]).surf(K.STONE, 3.2, 0.7).tex(0, 2, 1).sheet([-D.W / 2 - 2, yL, zTop], [D.W + 4, 0, 0], [0, 0, -(zTop + A)], 4, UP);
  for (const s of [-1, 1]) {
    // the cheek of the flight in three steps, and the side of the landing
    b.col(stone, 1.08).surf(K.STONE, 1.8).tex(0, 1, 2);
    for (let j = 0; j < 3; j++) { const hh = (yL - y0) * (1.3 - 0.42 * j), zz = zTop + (zFoot - zTop) * (j + 0.5) / 3, x = s * (D.W / 2 + 2.6); b.box(x, y0 + hh / 2, zz, 5.2, hh, (zFoot - zTop) / 3).box(x, y0 + hh + 0.15, zz, 5.8, 0.3, (zFoot - zTop) / 3 + 0.3); }
    b.tex(2, 1, 0).sheet([s * (D.W / 2 + 2), y0, zTop], [0, 0, -(zTop + A)], [0, yL - y0, 0], 4, [s, 0, 0]);
  }
  yield;
  // the frame of the door (a doorcase standing out of the wall) and the doors within it
  const hwP = D.w / 2 + 6, top = yL + D.h + 6;
  // (the chamber behind door i - 1 stands in more of the gold than the one before it: the stone itself is the same)
  const lit = (i) => {
    const z = -A - i * D.gap, h = D.h * Math.pow(D.k, i), k = 0.4 + 0.22 * i, au = 0.16 + 0.17 * i;
    return makeLighter({ up: [au, au * 0.8, au * 0.46], down: [au * 0.8, au * 0.62, au * 0.34], cut: 2.6, lamps: [lampF(0, yL + h * 0.5, z - 3, k * 3.2, 26), lampF(0, yL + h * 0.42, z + D.gap - 3, k * 1.3, 30)] });
  };
  for (let i = 0; i < nF; i++) {
    const z = -A - i * D.gap, w = D.w * Math.pow(D.k, i), h = D.h * Math.pow(D.k, i);
    if (i) {
      b.light(lit(i));
      b.col([0.5, 0.5, 0.5]).surf(K.STONE, 4.6).tex(0, 1, 2);
      b.sheet([-hwP, yL, z], [hwP - w / 2, 0, 0], [0, top - yL, 0], 9, PZ).sheet([w / 2, yL, z], [hwP - w / 2, 0, 0], [0, top - yL, 0], 9, PZ).sheet([-w / 2, yL + h, z], [w, 0, 0], [0, top - yL - h, 0], 9, PZ);
      b.tex(0, 2, 1).col([0.62, 0.62, 0.62]).surf(K.STONE, 4.2, 0.7).sheet([-hwP, yL, z + D.gap], [hwP * 2, 0, 0], [0, 0, -D.gap], 8, UP);
      b.col([0.5, 0.5, 0.5]).surf(K.STONE, 4.6).sheet([-hwP, top, z + D.gap], [hwP * 2, 0, 0], [0, 0, -D.gap], 12, [0, -1, 0]);
      b.tex(2, 1, 0).sheet([-hwP, yL, z + D.gap], [0, 0, -D.gap], [0, top - yL, 0], 9, [1, 0, 0]).sheet([hwP, yL, z + D.gap], [0, 0, -D.gap], [0, top - yL, 0], 9, [-1, 0, 0]);
    } else b.light(base);
    // its doorcase: jambs, a lintel, a cap on it
    const s = w * 0.07, out = s * (i ? 0.9 : 1.5);
    b.col(i ? [0.6, 0.59, 0.57] : stone, i ? 1 : 1.16).surf(K.STONE, s * 0.8).tex(0, 1, 2);
    for (const sd of [-1, 1]) b.box(sd * (w / 2 + s / 2), yL + h / 2, z + out / 2, s, h, out).box(sd * (w / 2 + s * 0.5), yL + s * 0.5, z + out * 0.6, s * 1.3, s, out * 1.2);
    b.box(0, yL + h + s * 0.6, z + out / 2, w + 2 * s, s * 1.2, out).box(0, yL + h + s * 1.45, z + out * 0.6, w + 3 * s, s * 0.5, out * 1.2);
    // its two leaves, standing open into the chamber behind it: dark panelled wood, lit by that chamber
    // (each leaf stands square to the wall, folded back against a jamb of stone as deep as the leaf is wide)
    const lw = w / 2 - 0.3, a = Math.PI / 2, th = Math.max(0.5, w * 0.024);
    b.light(lit(i + 1));
    for (const sd of [-1, 1]) {
      { const x0 = w / 2 + th * 1.25, wj = hwP - x0; if (wj > 0.2) b.col([0.5, 0.5, 0.5]).surf(K.STONE, 4.6).tex(2, 1, 0).box(sd * (x0 + wj / 2), yL + h / 2, z - 0.3 - (lw + 0.6) / 2, wj, h, lw + 0.6); }
      const hx = sd * w / 2, hz = z - 0.3, dx = -sd * Math.cos(a), dz = -Math.sin(a), yaw = Math.atan2(-dz, dx), nx = sd * dz, nz = -sd * dx;
      b.col([0.21, 0.14, 0.085]).surf(K.WOOD, w * 0.02);
      for (let r = 0; r < 4; r++) b.box(hx + dx * lw / 2, yL + h * (r + 0.5) / 4, hz + dz * lw / 2, lw, h / 4, th, yaw);
      b.col([0.27, 0.185, 0.11]);
      for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) { const t = lw * (0.27 + 0.46 * c); b.box(hx + dx * t + nx * th * 0.62, yL + h * (0.135 + 0.243 * r), hz + dz * t + nz * th * 0.62, lw * 0.36, h * 0.19, th * 0.3, yaw); }
    }
    yield;
  }
  // THE LAST CHAMBER, behind the innermost door: its floor, its walls and its roof run on to the sheet of light that
  // closes it (LASTDEEP further in), in the gold of that chamber: nothing of the background shows under the light
  {
    const z = -A - (nF - 1) * D.gap;
    b.light(lit(nF)).tex(0, 2, 1).col([0.62, 0.62, 0.62]).surf(K.STONE, 4.2, 0.7).sheet([-hwP, yL, z], [hwP * 2, 0, 0], [0, 0, -LASTDEEP - 0.5], 8, UP);
    b.col([0.5, 0.5, 0.5]).surf(K.STONE, 4.6).sheet([-hwP, top, z], [hwP * 2, 0, 0], [0, 0, -LASTDEEP - 0.5], 12, [0, -1, 0]);
    b.tex(2, 1, 0).sheet([-hwP, yL, z], [0, 0, -LASTDEEP - 0.5], [0, top - yL, 0], 9, [1, 0, 0]).sheet([hwP, yL, z], [0, 0, -LASTDEEP - 0.5], [0, top - yL, 0], 9, [-1, 0, 0]);
  }
  yield;
}
// what stands in the court: its lamps (on brackets, on chains, on the two posts by the steps), benches, lecterns
function courtThings(b, m, j, light) {
  for (const [i, q] of m.brackets.entries()) if (q.j === j) lampDraw(b, q, 2.1 + i * 0.47);
  for (const [i, q] of m.hung.entries()) if (q.j === j) lampDraw(b, q, 3.3 + i * 0.71);
  for (const [i, q] of m.high.entries()) if (q.j === j) lampDraw(b, q, 7.7 + i * 0.37);
  for (const [i, q] of m.kposts.entries()) if (q.j === j) lampDraw(b, q, 5.9 + i * 0.61);
  // (a clerk's stand on the gallery: its boards, two brackets out of the shelves under it, a rail before it on two
  // posts, and the ladder up to it, whose rails stand on the gallery's floor and lean on the face of the shelves)
  for (const q of m.stands) if (q.j === j) {
    const zf = q.z + 0.85, xl = q.x + q.e * 2.0, zb = -m.A + 0.09, za = -m.A + 3.4, top = q.y + 2.6;
    b.col(PAL.wood, 0.56).surf(K.WOOD, 0).box(q.x, q.y - 0.1, q.z, 2.8, 0.2, 1.7);
    for (const e of [-1.1, 1.1]) b.rod([q.x + e, q.y - 2.2, -m.A + 0.05], [q.x + e, q.y - 0.2, zf - 0.1], 0.08, 0.08, 4).rod([q.x + e, q.y, zf - 0.08], [q.x + e, q.y + 2.9, zf - 0.08], 0.07, 0.07, 4);
    b.rod([q.x - 1.4, q.y + 2.9, zf - 0.08], [q.x + 1.4, q.y + 2.9, zf - 0.08], 0.08, 0.08, 4, true);
    for (const e of [-0.6, 0.6]) b.rod([xl + e, m.Y1, za], [xl + e, top, zb], 0.09, 0.09, 4);
    for (let r = 1, n = Math.round((top - m.Y1) / 1.5); r < n; r++) b.rod([xl - 0.6, m.Y1 + (top - m.Y1) * r / n, za + (zb - za) * r / n], [xl + 0.6, m.Y1 + (top - m.Y1) * r / n, za + (zb - za) * r / n], 0.06, 0.06, 4);
  }
  // (bundles of files set down by those who wait: tied stacks of a man's armful, each a little turned)
  for (const q of m.files) if (q.j === j) for (let k = 0; k < q.n; k++) {
    const hh = 0.7 + 0.9 * ((q.a * 7 + k * 0.37) % 1), x = q.x + (k - (q.n - 1) / 2) * 1.5, z = q.z + 0.5 * ((q.a * 13 + k * 0.61) % 1);
    b.col(PAL.paper, 0.62 + 0.2 * ((q.a * 3 + k * 0.29) % 1)).surf(K.PAPER, 0).box(x, m.y0 + hh / 2, z, 1.2, hh, 0.85, (q.a + k * 0.4) * 1.3);
    b.col([0.2, 0.15, 0.1]).surf(K.CLOTH, 0).box(x, m.y0 + hh / 2, z, 0.12, hh + 0.04, 0.9, (q.a + k * 0.4) * 1.3);
  }
  for (const [i, q] of m.posts.entries()) if (q.j === j) {
    b.col([0.11, 0.1, 0.09]).surf(K.METAL, 0).lathe([[0.5, q.foot], [0.22, q.foot + 0.5], [0.12, q.foot + 1.2], [0.1, q.y - 1.1], [0.2, q.y - 1.0]], 6, q.x, q.z);
    oilLamp(b, q.x, q.y, q.z, q.s, 11 + i);
  }
  // (a bench takes the light of the paving it stands on: its back, turned to the wall and away from its lamp, is
  // lit by the pale stone under it and is not a black board in the lit court)
  b.light((x, y, z, nx, ny, nz, o) => light(x, y, z, nx * 0.35, 0.94, nz * 0.35, o));
  for (const q of m.benches) if (q.j === j) {
    b.col(PAL.wood, 0.62).surf(K.WOOD, 0).box(q.x, m.y0 + SEAT - 0.09, q.z, q.len, 0.18, 1.5).box(q.x, m.y0 + SEAT + 1.3, q.z - 0.8, q.len, 1.5, 0.16);
    for (const s of [-1, -0.34, 0.34, 1]) b.box(q.x + s * (q.len / 2 - 0.3), m.y0 + (SEAT - 0.18) / 2, q.z, 0.2, SEAT - 0.18, 1.4);
    for (const s of [-1, 1]) b.box(q.x + s * (q.len / 2 - 0.3), m.y0 + (SEAT + 2.15) / 2, q.z - 0.8, 0.24, SEAT + 2.15, 0.24);
  }
  b.light(light);
  // (a lectern: a step the clerk stands on, on the wall's side of it; a sloped top with a sheet on it; a lamp at its corner)
  for (const q of m.lecterns) if (q.j === j) {
    const y = m.y0;
    b.col(PAL.wood, 0.56).surf(K.WOOD, 0).box(q.x, y + 0.3, q.z - 1.0, 3.6, 0.6, 3.6).box(q.x, y + 1.95, q.z + 0.1, 2.6, 2.7, 1.0);
    b.quad([q.x - 1.5, y + 4.1, q.z + 0.8], [q.x + 1.5, y + 4.1, q.z + 0.8], [q.x + 1.5, y + 3.3, q.z - 0.7], [q.x - 1.5, y + 3.3, q.z - 0.7]);
    b.quad([q.x - 1.5, y + 3.3, q.z + 0.6], [q.x + 1.5, y + 3.3, q.z + 0.6], [q.x + 1.5, y + 4.1, q.z + 0.8], [q.x - 1.5, y + 4.1, q.z + 0.8]);
    b.col(PAL.paper, 0.9).surf(K.PAPER, 0).quad([q.x - 1.1, y + 4.02, q.z + 0.6], [q.x + 0.8, y + 4.02, q.z + 0.6], [q.x + 0.8, y + 3.42, q.z - 0.52], [q.x - 1.1, y + 3.42, q.z - 0.52]);
    b.col([0.13, 0.115, 0.1]).surf(K.METAL, 0).rod([q.x + 1.5, y + 3.9, q.z + 0.5], [q.x + 1.5, y + 5.7, q.z + 0.5], 0.07, 0.07, 4);
    oilLamp(b, q.x + 1.5, y + 6.2, q.z + 0.5, 0.6, 5.1 + q.x * 0.13 + j);
  }
}
// The walls, floors, ceilings and fittings, each lit by the hall it faces. A generator: the page breathes between pieces.
function* gateShell(b, G, lightOf, rs, fit, M, side, nF, lampF, pane) {
  const PZ = [0, 0, 1], NX = [-1, 0, 0], PX = [1, 0, 0], UP = [0, 1, 0], DOWN = [0, -1, 0];
  for (let k = 0; k < 3; k++) {
    const g = G.gate[k], before = k === 0 ? { hw: G.frontHW, H: G.frontH, y: 0 } : G.hall[k - 1], hw = before.hw, top = before.y + before.H, hwO = g.w / 2;
    const cell = [4, 6, 9][k], bh = [1.9, 2.6, 3.6][k];
    b.light(lightOf(k)).col(WALLC[k]).surf(K.STONE, bh, 0, 0.39).tex(0, 1, 2);
    b.sheet([-hw, before.y, g.z], [hw - hwO, 0, 0], [0, top - before.y, 0], cell, PZ); yield;
    b.sheet([hwO, before.y, g.z], [hw - hwO, 0, 0], [0, top - before.y, 0], cell, PZ); yield;
    b.sheet([-hwO, g.y + g.h, g.z], [g.w, 0, 0], [0, top - g.y - g.h, 0], cell, PZ);
    b.sheet([-hwO, before.y, g.z], [g.w, 0, 0], [0, g.y - before.y, 0], cell, PZ); yield;
    b.col(WALLC[k], 1.12);
    surround(b, g, before.y, k); yield;
    // the rose in the cathedral's end wall, high over the first gate and over the roof of the hall behind it: glass in
    // leads with the day behind it, in a ring of stone
    if (k === 0 && pane) {
      const R = 9, cy = 56, z = g.z + 0.3;
      b.col(WALLC[0], 1.5).surf(K.STONE, 0); archBand(b, 0, cy, cy, R, 1.5, g.z, 0.9, 14, true);
      b.col(pane).surf(K.STAINED, 0.3, 12, -1).tex(0, 1, 2).piece();
      for (let i = 0; i < 28; i++) { const a0 = i / 28 * TAU, a1 = (i + 1) / 28 * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1); b.tri([0, cy, z], [R * c0, cy + R * s0, z], [R * c1, cy + R * s1, z], [0, 0, 0], [0, c0, s0], [0, c1, s1]); }
      yield;
    }
    // the reveal of the opening takes the light of the hall within and, the visitor passing through it an arm's length
    // off, a share of the radiance that fills the opening (the lamp the hall before keeps inside it): stone, not a black band
    const within = lightOf(k + 1), front = lightOf(k), o2 = [0, 0, 0];
    const rev = (x, y, z, nx, ny, nz, out) => {
      front(x, y, z, nx, ny, nz, o2); within(x, y, z, nx, ny, nz, out);
      out[0] += 0.16 * o2[0]; out[1] += 0.16 * o2[1]; out[2] += 0.16 * o2[2];
    };
    b.light(rev).col(WALLC[k], 0.86).surf(K.STONE, k ? bh * 0.8 : bh * 1.5, 0, k ? 0.3 : 0).tex(2, 1, 0);
    b.sheet([-hwO, g.y, g.z], [0, 0, -g.t], [0, g.h, 0], cell * 0.6, PX);
    b.sheet([hwO, g.y, g.z], [0, 0, -g.t], [0, g.h, 0], cell * 0.6, NX);
    b.tex(0, 2, 1);
    b.sheet([-hwO, g.y + g.h, g.z], [g.w, 0, 0], [0, 0, -g.t], cell * 0.6, DOWN);
    b.col([0.31, 0.31, 0.325]).surf(K.STONE, g.t, 0.6);
    b.sheet([-hwO, g.y + 0.02, g.z], [g.w, 0, 0], [0, 0, -g.t], 4, UP);
    // (the threshold lies a finger over the floor: its two edges have their risers)
    b.sheet([-hwO, g.y, g.z], [g.w, 0, 0], [0, 0.02, 0], 4, PZ).sheet([-hwO, g.y, g.z - g.t], [g.w, 0, 0], [0, 0.02, 0], 4, [0, 0, -1]); yield;
    // the jambs are carved: a plinth, a roll up each edge and round the head, sunk panels between rails, an impost
    // under the head (the stone that passes near is worth the look)
    // (the first gate, the plain gate of the law in the cathedral's end wall, is carved more shallowly than the others)
    const u = g.w * (k === 0 ? 0.018 : 0.03), nP = Math.max(1, Math.round(g.t / (u * 5))), nR = Math.max(3, Math.round(g.h / (u * 9))), yI = g.y + g.h - 2.4 * u;
    for (const sd of [-1, 1]) {
      const x = sd * hwO, xi = sd * (hwO - u * 0.25);
      b.col(WALLC[k], 1.0).surf(K.STONE, 0);
      b.box(sd * (hwO - u * 0.4), g.y + u * 1.2, g.z - g.t / 2, u * 0.8, u * 2.4, g.t - 0.04).box(sd * (hwO - u * 0.5), yI, g.z - g.t / 2, u, u * 0.9, g.t - 0.04);
      if (k === 0) {
        for (let i = 0; i <= nP; i++) b.box(xi, (g.y + u * 2.4 + yI) / 2, g.z - 0.3 * u - (g.t - 0.6 * u) * i / nP, u * 0.5, yI - g.y - u * 2.4, u * 0.6);
        for (let j = 1; j < nR; j++) b.box(xi, g.y + u * 2.4 + (yI - g.y - u * 2.4) * j / nR, g.z - g.t / 2, u * 0.5, u * 0.6, g.t - 0.6 * u);
      } else {
        // (the second and the third gate: two round shafts engaged in each jamb, ringed at a third and two thirds of
        // their height, between the plinth and the impost: a wall built of masses, not a panelled pane; they stand
        // less far out of the jamb than the rolls at its edges do)
        const ya = g.y + u * 2.4, hs = yI - u * 0.45 - ya;
        b.col(PIERC, 0.94).surf(K.STONE, 1.3, 0, 0.28).tex(0, 1, 2);
        for (const f of [0.31, 0.69]) b.lathe([[u * 0.95, ya], [u * 0.8, ya + u * 0.7], [u * 0.72, ya + hs / 3 - u * 0.3], [u * 0.86, ya + hs / 3], [u * 0.72, ya + hs / 3 + u * 0.3], [u * 0.7, ya + hs * 2 / 3 - u * 0.3], [u * 0.84, ya + hs * 2 / 3], [u * 0.7, ya + hs * 2 / 3 + u * 0.3], [u * 0.68, ya + hs - u * 0.8], [u * 0.95, ya + hs]], 10, x, g.z - g.t * f);
        b.col(WALLC[k], 1.0).surf(K.STONE, 0);
      }
      b.col(WALLC[k], 1.16);
      for (const z of [g.z + 0.02, g.z - g.t - 0.02]) b.rod([x - sd * u * 0.5, g.y, z], [x - sd * u * 0.5, g.y + g.h, z], u * 0.5, u * 0.5, 6);
    }
    for (const z of [g.z + 0.02, g.z - g.t - 0.02]) b.rod([-hwO, g.y + g.h - u * 0.5, z], [hwO, g.y + g.h - u * 0.5, z], u * 0.5, u * 0.5, 6);
    b.col(WALLC[k], 1.0);
    for (let i = 1; i < 6; i++) b.box(-hwO + g.w * i / 6, g.y + g.h - u * 0.25, g.z - g.t / 2, u * 0.6, u * 0.5, g.t - 0.6 * u);
    yield;
  }
  for (let k = 0; k < 2; k++) {
    const h = G.hall[k], L = h.z0 - h.z1, cell = [5, 7.5][k], t = G.gate[k].t - 0.02, bh = [1.9, 2.6][k];
    b.light(lightOf(k + 1)).tex(0, 2, 1);
    // The floor is laid in a pattern of its own: a runner of great pale flags, worn, down the middle; a dark line of
    // stone to either side of it; fields of smaller flags laid on the diagonal; a border along the walls (the tones
    // lie near one another: a band of the paving is never as dark as a shadow). (from, to, the stone, its flags, its sheen, how it is laid, the cells of its bake)
    const mid = [9, 14][k], ln = 1.6, edge = [7, 13][k], za = h.z0 + t, Lf = L + t + 8;
    const bands = [[-mid, mid, [0.43, 0.42, 0.4], [3.4, 4.4][k], 0.8, 0, cell]];
    for (const s of [-1, 1]) bands.push([s > 0 ? mid : -mid - ln, s > 0 ? mid + ln : -mid, [0.27, 0.27, 0.285], 1.6, 0.5, 0, cell * 2],
      [s > 0 ? mid + ln : -h.hw + edge, s > 0 ? h.hw - edge : -mid - ln, [0.35, 0.35, 0.365], [2.3, 3.1][k], 0.55, 2, cell],
      [s > 0 ? h.hw - edge : -h.hw, s > 0 ? h.hw : -h.hw + edge, [0.29, 0.29, 0.305], [2.8, 3.6][k], 0.35, 0, cell * 1.4]);
    for (const [x0, x1, c, fb, sheen, lay, cl] of bands) { b.col(c).surf(K.STONE, fb, sheen, lay); b.sheet([x0, h.y, za], [x1 - x0, 0, 0], [0, 0, -Lf], cl, UP); yield; }
    // the walls: a dark dado of great blocks, the wall in its own courses, and over that the stone the smoke of the
    // lamps has darkened and run down
    const dado = [6.4, 9][k], sootY = h.y + h.H * 0.58;
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      const o = (y) => [s * h.hw, y, za - (L + t) * i / 2], eu = [0, 0, -(L + t) / 2], want = s < 0 ? PX : NX;
      b.tex(2, 1, 0);
      b.col(WALLC[k + 1], 0.78).surf(K.STONE, [3.1, 4.2][k], 0, 0.22).sheet(o(h.y), eu, [0, dado, 0], cell * 1.4, want);
      b.col(WALLC[k + 1], 0.9).surf(K.STONE, bh, 0, 0.39).sheet(o(h.y + dado), eu, [0, sootY - h.y - dado, 0], cell, want);
      b.col(WALLC[k + 1], 0.8).surf(K.STONE, bh, 0, 0.55).sheet(o(sootY), eu, [0, h.y + h.H - sootY, 0], cell * 1.6, want); yield;
    }
    // the wall we came in by, seen if we look back, and the roof
    b.col(WALLC[k + 1], 0.8).surf(K.STONE, bh, 0, 0.44);
    b.sheet([-h.hw, h.y, h.z0 + t], [h.hw - G.gate[k].w / 2, 0, 0], [0, h.H, 0], cell * 2, [0, 0, -1]);
    b.sheet([G.gate[k].w / 2, h.y, h.z0 + t], [h.hw - G.gate[k].w / 2, 0, 0], [0, h.H, 0], cell * 2, [0, 0, -1]); yield;
    b.col(WALLC[k + 1], 0.82).surf(K.STONE, bh * 1.6).tex(0, 2, 1); b.sheet([-h.hw, h.y + h.H, h.z0 + t], [h.hw * 2, 0, 0], [0, 0, -L - t], cell * 2.4, DOWN); yield;
  }
  yield* hallOne(b, G, lightOf, fit, M);
  yield* hallTwo(b, G, lightOf);
  yield* hallWalls(b, G, lightOf, fit, M, pane);
  // the steps up to gates 2 and 3, of a man's rise: each tread with its nosing, worn pale in the middle; the landing
  // before the sill, on which the keeper stands; at each end of the flight a kerb wall that rakes with it, a roll
  // along its top, down to a newel block at the foot (nothing beside a flight is a block the size of a room)
  for (let k = 1; k < 3; k++) {
    const st = G.steps[k], g = G.gate[k], y0 = G.hall[k - 1].y, base = lightOf(k), tot = st.land + st.n * st.dz, pw = st.pw;
    // (a riser takes some of the light its tread has: no step is a black band)
    b.light((x, y, z, nx, ny, nz, o) => (nz > 0.5 ? base(x, y, z, 0, 0.75, 0.66, o) : base(x, y, z, nx, ny, nz, o)));
    for (let i = 0; i < st.n; i++) {
      const dep = st.land + (st.n - i) * st.dz, y = y0 + i * st.rise, tone = 0.92 + 0.16 * rs(), last = i === st.n - 1;
      b.col([0.36, 0.36, 0.37], tone).surf(K.STONE, st.rise * 3.1, 0.5).tex(0, 2, 1);
      b.sheet([-st.W / 2, y + st.rise, g.z + dep], [st.W, 0, 0], [0, 0, -(last ? st.dz + st.land : st.dz)], last ? 2.4 : st.dz, UP);
      b.sheet([-st.W / 2, y, g.z + dep], [st.W, 0, 0], [0, st.rise * 0.72, 0], st.W / 8, PZ);
      b.col([0.44, 0.44, 0.44], tone).box(0, y + st.rise * 0.86, g.z + dep + 0.1, st.W, st.rise * 0.28, 0.24);
    }
    yield;
    b.light(base);
    const ck = cheekOf(G, k), zl = g.z + st.land, yl = y0 + st.n * st.rise + KERB;
    for (const sd of [-1, 1]) {
      const xa = sd * st.W / 2, xb = sd * (st.W / 2 + pw * 0.6), xlo = Math.min(xa, xb), xhi = Math.max(xa, xb), xr = (xa + xb) / 2;
      b.col(WALLC[k], 0.8).surf(K.STONE, st.rise * 2.4).tex(2, 1, 0);
      for (const [x, o] of [[xa, -sd], [xb, sd]]) {
        const A = [x, y0, g.z], B = [x, y0, zl], C = [x, y0, ck.zb], At = [x, yl, g.z], Bt = [x, yl, zl], Ct = [x, ck.yk, ck.zb];
        if (o > 0) b.quad(B, A, At, Bt).quad(C, B, Bt, Ct); else b.quad(A, B, Bt, At).quad(B, C, Ct, Bt);
      }
      b.tex(0, 2, 1).quad([xlo, yl, g.z], [xlo, yl, zl], [xhi, yl, zl], [xhi, yl, g.z]).quad([xlo, yl, zl], [xlo, ck.yk, ck.zb], [xhi, ck.yk, ck.zb], [xhi, yl, zl]);
      b.col(WALLC[k], 1.0).surf(K.STONE, 0).rod([xr, yl + 0.12, g.z], [xr, yl + 0.12, zl], 0.42, 0.42, 6).rod([xr, yl + 0.12, zl], [xr, ck.yk + 0.12, ck.zb], 0.42, 0.42, 6);
      // (the newel: a block on a plinth that runs on to the foot of the flight, a coping on it)
      b.col(WALLC[k], 0.86).surf(K.STONE, st.rise * 2.4).tex(0, 1, 2).box(sd * ck.x, (y0 + ck.top - 0.24) / 2, ck.z, pw, ck.top - 0.24 - y0, pw);
      b.col(WALLC[k], 1.0).surf(K.STONE, 0).box(sd * ck.x, ck.top - 0.12, ck.z, pw + 0.5, 0.24, pw + 0.5).box(sd * ck.x, y0 + st.rise * 0.6, (ck.zb - 0.4 + g.z + tot + 0.3) / 2, pw + 0.8, st.rise * 1.2, g.z + tot + 0.3 - ck.zb + 0.4);
    }
    yield;
  }
  // the lamps of the halls (the keeper's own is hung in the light of the hall he stands in), and the benches under them
  for (const k of [0, 1, 2]) { b.light(lightOf(k)); fit.lamps.forEach((q, i) => { if (q.hall === k) lampDraw(b, q, 0.9 + i * 0.53); }); yield; }
  for (const q of fit.benches) {
    b.light(lightOf(q.hall)).col(PAL.wood, 0.6).surf(K.WOOD, 0);
    // (the seat's top stands SEAT over the floor; the back is a board carried on two uprights that stand on the floor)
    b.box(q.x, q.y + SEAT - 0.09, q.z, 1.5, 0.18, q.len).box(q.x + q.s * 0.8, q.y + SEAT + 1.3, q.z, 0.16, 1.5, q.len);
    for (const e of [-1, -0.34, 0.34, 1]) b.box(q.x, q.y + (SEAT - 0.18) / 2, q.z + e * (q.len / 2 - 0.3), 1.4, SEAT - 0.18, 0.2);
    for (const e of [-1, 1]) b.box(q.x + q.s * 0.8, q.y + (SEAT + 2.15) / 2, q.z + e * (q.len / 2 - 0.3), 0.24, SEAT + 2.15, 0.24);
  }
  yield;
  // ---- the last court, face by face (each in its own frame)
  const m = courtMeasure(side), stone = WALLC[3], D = G.court.door, g3 = G.gate[2], light = lightOf(3);
  for (let j = 0; j < 8; j++) {
    b.tr(faceM(M, 0, 0, m.zc, m.phi(j))).light(light);
    // the floor: paving laid in rings about the court's middle (great flags, a line of darker stone, fields of smaller
    // flags on the diagonal, the border before the arcades), in tones that lie near one another, and in cells fine
    // enough to hold each lamp's pool and the door's light (from, to, the stone, its flags, how it is laid)
    b.tex(0, 2, 1);
    for (const [r0, r1, c, fb, lay] of [[0, 19, 0.45, 4.2, 0], [19, 21, 0.31, 2, 0], [21, 53, 0.39, 2.8, 2], [53, 55, 0.31, 2, 0], [55, 59, 0.46, 4.2, 0], [59, 61, 0.31, 2, 0], [61, 97, 0.39, 2.8, 2], [97, 99, 0.31, 2, 0], [99, m.A, 0.43, 4.2, 0]]) {
      b.col([c, c, c * 1.02]).surf(K.STONE, fb, 0.8, lay);
      b.grid(Math.max(1, Math.ceil(2 * m.T8 * r1 / 5)), Math.max(1, Math.ceil((r1 - r0) / 5)), (u, v, p) => { const r = r0 + (r1 - r0) * v; p[0] = (2 * u - 1) * m.T8 * r; p[1] = m.y0; p[2] = -r; });
    }
    yield;
    const open = m.open.find((q) => q.j === j);
    if (open) courtOpen(b, m, stone, open, j ? D.w : g3.w, j ? D.h : g3.h); else courtFace(b, m, stone, j);
    yield;
    courtCrown(b, m, stone);
    yield;
    courtThings(b, m, j, light);
    yield;
    if (j === 3) yield* courtDoor(b, m, stone, D, nF, lightOf, lampF, rs);
  }
  b.tr(M);
}
const RAD_VERT = /* glsl */`
varying vec2 vQ; varying vec3 vW;
void main(){ vQ = uv; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// the innermost gateway: all light, and nothing drawn on it but light
const RAD_FRAG = /* glsl */`
uniform float uTime, uGain;
varying vec2 vQ; varying vec3 vW;
${COURT_NOISE}
void main(){
  vec2 q = vec2(vQ.x * 2. - 1., vQ.y);
  // gold, deepest at the edge of the sheet: never white
  float lv = .3;
  float stream = .8 + .3 * cNoise(vec2(q.x * 3. + .3 * sin(uTime * .11), q.y * 1.4 - uTime * .07)) + .12 * cNoise(vec2(q.x * 11., q.y * 5. - uTime * .13));
  float edge = smoothstep(1., .8, abs(q.x)) * smoothstep(1., .9, q.y);
  // and strongest low in the middle, where the way goes on
  float core = exp(-(q.x * q.x * 5. + (q.y - .16) * (q.y - .16) * 9.));
  float rays = .5 + .5 * cNoise(vec2(atan(q.x, q.y - .1) * 9., uTime * .15));
  lv = lv * (.55 + .6 * core) + .5 * core * rays;
  vec3 c = mix(vec3(.9, .5, .16), vec3(1., .86, .56), clamp((lv - .2) * 1.1, 0., 1.)) * lv * stream * uGain * (.4 + .6 * edge);
  gl_FragColor = vec4(c, 1.);
}`;
const BEAM_VERT = /* glsl */`
attribute vec3 aQ; attribute vec3 aC;
// (aG: how far this corner of the sheet lies from the route's LINE, in metres, worked out once at the build)
attribute float aG;
varying vec3 vQ, vK; varying float vG;
void main(){ vQ = aQ; vK = aC; vG = aG; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`;
// slow shafts: aQ = (across -1..1, along 0..1, the shaft's own number)
const BEAM_FRAG = /* glsl */`
uniform float uTime, uGain, uSoft; uniform vec3 uCol;
varying vec3 vQ, vK; varying float vG;
${COURT_NOISE}
void main(){
  float x = clamp(vQ.x, -1., 1.), t = clamp(vQ.y, 0., 1.);
  // soft at its sides and even along its length (it is spent where it falls); it breathes slowly as a whole, without grain.
  // uSoft (the shafts of the gates and the great door): no edge to it at all, and spent along its length in the air
  // uSoft 2 (the one shaft of the nave): no edge to it either, and it carries down to where it falls, a little dimmer there
  float sx = 1. - x * x, a = uSoft > 1.5 ? sx * sx * sx * smoothstep(0., .06, t) * (1. - .55 * t) : uSoft > .5 ? sx * sx * sx * smoothstep(0., .08, t) * (1. - t) * (1. - t * t) : sx * sx * smoothstep(0., .1, t) * (1. - t * t * t);
  a *= .78 + .22 * cNoise(vec2(vQ.z * 13. + x * .5, t * 1.2 - uTime * .12)) + .1 * sin(uTime * .5 + vQ.z * 31.);
  // A STANDING CLEARANCE BY PLACE: a shaft is nothing within 2.6 m of the route's line and whole from 6.5 m of it,
  // the same at every moment and for every visitor (vG: the sheet's own distance from the line, carried in its
  // corners). Nothing here reads where the visitor is.
  a *= smoothstep(2.6, 6.5, vG);
  gl_FragColor = vec4(uCol * vK * a * uGain, 1.);
}`;
const MOTE_VERT = /* glsl */`
// home (x, y, z) and its own number
attribute vec4 iP;
// the way it drifts (x, y, z) in metres a second, and the length of its run
attribute vec4 iB;
// how near its whole run comes to the route's LINE, in metres (worked out once at the build)
attribute float iG;
uniform float uTime, uSize, uFar; uniform vec3 uEye;
varying vec2 vQ; varying float vA;
void main(){
  float sd = iP.w, run = max(iB.w, 1.), g = fract(uTime * length(iB.xyz) / run + sd * 7.31);
  vec3 c = iP.xyz + normalize(iB.xyz + vec3(1e-4)) * (g - .5) * run;
  // dust wanders as it drifts; a thing that falls fast (a drip from the roof) keeps its line
  float wob = 1. / (1. + dot(iB.xyz, iB.xyz));
  c.x += .5 * wob * sin(uTime * .43 + sd * 40.); c.y += .4 * wob * sin(uTime * .31 + sd * 23.);
  vA = smoothstep(0., .12, g) * smoothstep(1., .88, g) * (.55 + .45 * sin(uTime * (1.1 + fract(sd * 3.7)) + sd * 90.));
  vQ = position.xy;
  // A STANDING CLEARANCE BY PLACE, like the shafts it turns in: a mote whose run comes within 6 m of the route's line
  // is thinner, and one within 1.5 m is nothing, the same at every moment (iG). uEye (the visitor's place on the
  // route's line, never the lens) is read for one thing only, the far cut of WHAT IS DRAWN: dust is not drawn further
  // than uFar from that place, so that far dust is never a grain of dots. Its size is the world's own at every distance.
  float dist = length(uEye - c);
  vA *= smoothstep(1.5, 6., iG) * (1. - smoothstep(uFar * .55, uFar, dist));
  vec4 mv = viewMatrix * vec4(c, 1.);
  mv.xy += position.xy * uSize * (.6 + .8 * fract(sd * 5.3));
  gl_Position = projectionMatrix * mv;
}`;
const MOTE_FRAG = /* glsl */`
uniform vec3 uCol;
varying vec2 vQ; varying float vA;
void main(){ float d = clamp(dot(vQ, vQ), 0., 1.); gl_FragColor = vec4(uCol * vA * (1. - d) * (1. - d), 1.); }`;
const QUAD6 = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
// motes: list of [x, y, z, number, vx, vy, vz, run, gap]; one draw call (gap: how near the mote's run comes to the
// line, where the caller has worked it out; far: how far from the visitor's place uEye they are drawn)
export function makeMotes(list, uTime, color, size, far, uEye) {
  const n = list.length, g = new THREE.InstancedBufferGeometry(), P = new Float32Array(n * 4), B = new Float32Array(n * 4), Gp = new Float32Array(n);
  list.forEach((m, i) => { P.set([m[0], m[1], m[2], m[3]], i * 4); B.set([m[4], m[5], m[6], m[7]], i * 4); Gp[i] = m[8] ?? 99; });
  g.setAttribute('iG', new THREE.InstancedBufferAttribute(Gp, 1));
  g.setAttribute('position', new THREE.BufferAttribute(QUAD6, 3));
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime, uCol: { value: new THREE.Vector3(color[0], color[1], color[2]) }, uSize: { value: size }, uFar: { value: far }, uEye }, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}
// shafts of light: list of { a: [x,y,z] (where it leaves the opening), d: [x,y,z] (unit, the way it goes), w: [x,y,z] (unit, across), len, w0, w1,
// col: [r,g,b] (its own colour, times the colour of them all; white if not given) }
// gapOf(x, y, z): how far a place lies from the route's line (metres; 7 and more is all one): each sheet is laid in
// 8 lengths by 4 breadths and carries that distance in every corner (aG), for its standing clearance.
export function makeBeams(list, uTime, color, gain, gapOf, soft = 0) {
  const P = [], Q = [], C = [], Gp = [];
  list.forEach((s, i) => {
    const c = (t, x) => { const hw = lerp(s.w0, s.w1, t) * x; return [s.a[0] + s.d[0] * s.len * t + s.w[0] * hw, s.a[1] + s.d[1] * s.len * t + s.w[1] * hw, s.a[2] + s.d[2] * s.len * t + s.w[2] * hw]; };
    const nseg = 8, nx = 4, num = (i * 0.618) % 1;
    // (s.cross: a second sheet at right angles on the same axis, each with half the light: a shaft and not a pane)
    const w2 = s.cross ? [s.d[1] * s.w[2] - s.d[2] * s.w[1], s.d[2] * s.w[0] - s.d[0] * s.w[2], s.d[0] * s.w[1] - s.d[1] * s.w[0]] : null;
    const c2 = (t, x) => { const hw = lerp(s.w0, s.w1, t) * x; return [s.a[0] + s.d[0] * s.len * t + w2[0] * hw, s.a[1] + s.d[1] * s.len * t + w2[1] * hw, s.a[2] + s.d[2] * s.len * t + w2[2] * hw]; };
    const col = (s.col || [1, 1, 1]).map((v) => v * (w2 ? 0.6 : 1));
    const put = (p, t, x) => { P.push(p[0], p[1], p[2]); Q.push(x, t, num); C.push(...col); Gp.push(gapOf ? gapOf(p[0], p[1], p[2]) : 99); };
    for (let k = 0; k < nseg; k++) for (let j = 0; j < nx; j++) {
      const t0 = k / nseg, t1 = (k + 1) / nseg, xa = -1 + 2 * j / nx, xb = -1 + 2 * (j + 1) / nx;
      for (const [t, x] of [[t0, xa], [t0, xb], [t1, xb], [t0, xa], [t1, xb], [t1, xa]]) put(c(t, x), t, x);
      if (w2) for (const [t, x] of [[t0, xa], [t0, xb], [t1, xb], [t0, xa], [t1, xb], [t1, xa]]) put(c2(t, x), t, x);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aG', new THREE.Float32BufferAttribute(Gp, 1));
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime, uCol: { value: new THREE.Vector3(color[0], color[1], color[2]) }, uGain: { value: gain }, uSoft: { value: soft } }, vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

export async function buildHero(ctx, opts = {}) {
  const G = GATES, core = ctx.core;
  const rs = opts.rng || core.makeRng(core.hashSeed('courts-gates:' + ctx.seed));
  const M = opts.matrix || new THREE.Matrix4(), yaw0 = Math.atan2(M.elements[8], M.elements[10]);
  const uniforms = opts.uniforms || courtUniforms(), own = !opts.uniforms;
  const detail = opts.detail ?? (ctx.quality ? ctx.quality.detail : 1), night = opts.night ? 1.25 : 1;
  const side = opts.side ?? (rs.chance(0.5) ? 1 : -1), beyond = opts.beyond ?? rs.int(1, 3);
  const v = new THREE.Vector3();
  const pt = (x, y, z) => { v.set(x, y, z).applyMatrix4(M); return [v.x, v.y, v.z]; };
  const dirW = (x, y, z) => { v.set(x, y, z).transformDirection(M); return [v.x, v.y, v.z]; };
  const object = new THREE.Group();
  const g0 = G.gate[0], g1 = G.gate[1], g2 = G.gate[2], D = G.court.door, P0 = G.portal;
  // the last court's measures, and the frames of its faces (the great door stands in face 3)
  const cm = courtMeasure(side), nF = 2 + beyond, frames = [0, 1, 2, 3, 4, 5, 6, 7].map((j) => faceM(M, 0, 0, cm.zc, cm.phi(j)));
  const ptF = (j, x, y, z) => { v.set(x, y, z).applyMatrix4(frames[j]); return [v.x, v.y, v.z]; };
  const dirF = (j, x, y, z) => { v.set(x, y, z).transformDirection(frames[j]); return [v.x, v.y, v.z]; };
  // streams of their own for unlike things: the keepers and the old man ('gate-keepers': the plan's own stream, 'gates', is drawn by
  // courtPlan alone), the fittings, the steps, the motes
  const mk = (name) => core.makeRng(core.hashSeed('courts-' + name + ':' + ctx.seed));
  const rfit = mk('gate-fittings'), rsteps = mk('gate-steps'), rmo = mk('gate-motes'), rkeep = mk('gate-keepers');
  const fit = gateFittings(G, rfit, side, mk('fittings-high'));
  await ctx.yield();
  // ---- the light of each hall, in two colours: the stone stands in a cool dark; what is warm is the radiance that
  // comes THROUGH the gate ahead (a lamp inside its opening, a soft carpet of light thrown out of it across the floor)
  // and the lamps of the place, each a pool that ends, with the dark between them
  const lampAt = (x, y, z, k, reach, c = RADC) => { const p = pt(x, y, z); return [p[0], p[1], p[2], c[0] * k, c[1] * k, c[2] * k, reach]; };
  const lampIn = (j) => (x, y, z, k, reach, c = RADC) => { const p = ptF(j, x, y, z); return [p[0], p[1], p[2], c[0] * k * (c === RADC ? night : 1), c[1] * k * (c === RADC ? night : 1), c[2] * k * (c === RADC ? night : 1), reach]; };
  const carpet = (g, k, soft, tilt, len) => {
    const d = new THREE.Vector3(0, -tilt, 1).normalize(), bb = new THREE.Vector3(0, 1, tilt).normalize();
    return { c: pt(0, g.y + g.h * 0.5, g.z - g.t * 0.5), d: dirW(d.x, d.y, d.z), a: dirW(1, 0, 0), ha: g.w * 0.5 - soft * 0.4, b: dirW(bb.x, bb.y, bb.z), hb: g.h * 0.5, col: k3(RADC, k * night), soft, len };
  };
  // (a lamp high on a wall or a pier throws its light on stone laid in cells of 5 to 8 m: it is reckoned from 3.5 m
  // further out of its wall and reaches further, so that its pool is wide and soft and no streak lies along a cell)
  const outOf = (q, d) => { const dx = q.x - q.wall[0], dz = q.z - q.wall[1], l = Math.hypot(dx, dz) || 1; return [q.x + dx / l * d, q.z + dz / l * d]; };
  const lampsOf = (k) => fit.lamps.filter((q) => q.hall === k || q.also === k).map((q) => { if (!q.far) return lampAt(q.x, q.y, q.z, q.k || 1.5, q.reach, LAMPC); const o = outOf(q, 3.5); return lampAt(o[0], q.y, o[1], 1.3, q.reach + 4, LAMPC); });
  // (the small barred windows high in the halls: each a little cold light on the stone about it, reckoned from 2.5 m
  // before its glass)
  const COLD = opts.pane ? [opts.pane[0] * 0.8, opts.pane[1] * 0.95, opts.pane[2] * 1.25] : [0.22, 0.27, 0.38];
  const winsOf = (k) => fit.wins.filter((w) => w.hall === k).map((w) => lampAt(w.x + 2.5 * w.n[0], w.y + w.h / 2, w.z + 2.5 * w.n[1], 2.4, 11, COLD));
  const frontLamps = [lampAt(0, g0.h * 0.5, g0.z - g0.t * 0.5, 2.0 * night, 15), ...lampsOf(0)], frontBeams = [carpet(g0, 2.2, 2.5, 0.3, 48)];
  // the court: the door's own light (a lamp in its opening, a carpet thrown down its steps and across the floor on its
  // axis), the lamps of the place, and a little cool light gathered under the vault (its lantern is the night's)
  const L3 = lampIn(3), tilt = 0.3, dd = new THREE.Vector3(0, -tilt, 1).normalize(), db = new THREE.Vector3(0, 1, tilt).normalize();
  const courtLamps = [L3(0, cm.yL + D.h * 0.45, -cm.A - 2, 1.5, 55),
    ...cm.brackets.map((q) => lampIn(q.j)(q.x, q.y, q.z, 1.85, q.reach + 1, LAMPC)), ...cm.hung.map((q) => lampIn(q.j)(q.x, q.y, q.z, 1.5, q.reach, LAMPC)), ...cm.high.map((q) => { const o = outOf(q, 3.5); return lampIn(q.j)(o[0], q.y, o[1], 1.55, q.reach + 4, LAMPC); }),
    ...cm.kposts.map((q) => lampIn(q.j)(q.x, q.y, q.z, 1.6, q.reach, LAMPC)),
    ...cm.posts.map((q) => lampIn(q.j)(q.x, q.y, q.z, 1.7, q.reach, LAMPC)), ...cm.lecterns.map((q) => lampIn(q.j)(q.x + 1.5, cm.y0 + 6.2, q.z + 0.5, 0.9, 5, LAMPC))];
  const courtBeam = { c: ptF(3, 0, cm.yL + D.h * 0.5, -cm.A - 1), d: dirF(3, dd.x, dd.y, dd.z), a: dirF(3, 1, 0, 0), ha: D.w * 0.5 - 5.6, b: dirF(3, db.x, db.y, db.z), hb: D.h * 0.5, col: k3(RADC, 1.5 * night), soft: 16, len: 190 };
  const yV = pt(0, cm.Y3, 0)[1];
  // THE STONE IS SEEN EVERYWHERE: each hall and the court stand in a floor of dim cool light of their own (walls, dado
  // and roof read at every metre; the farthest face is dim stone, never black); the lamps are warm pools in it, and
  // the dark between them is dim. Under the court's vault the glow of its many lamps gathers on webs and ribs (warm,
  // strongest on what looks down), with a little of the lantern's cool light.
  const courtBase = makeLighter({ up: [0.18, 0.193, 0.234], down: [0.137, 0.146, 0.174], lamps: courtLamps, beams: [courtBeam], cut: 2, high: { y0: yV - 16, y1: yV + cm.VH, col: [0.06, 0.075, 0.11] } });
  const courtLight = (x, y, z, nx, ny, nz, o) => {
    courtBase(x, y, z, nx, ny, nz, o);
    const t = smoothstep(yV - 34, yV + 8, y) * (1 - 0.55 * smoothstep(yV + 8, yV + cm.VH, y)) * (0.6 - 0.4 * ny);
    o[0] += 0.17 * t; o[1] += 0.128 * t; o[2] += 0.075 * t;
  };
  const lighters = [
    makeLighter({ up: [0.16, 0.172, 0.21], down: [0.115, 0.124, 0.148], lamps: frontLamps, beams: frontBeams }),
    makeLighter({ up: [0.18, 0.191, 0.225], down: [0.14, 0.148, 0.17], lamps: [lampAt(0, g1.y + g1.h * 0.5, g1.z - g1.t * 0.5, 1.1 * night, 20), ...lampsOf(1), ...winsOf(1)], beams: [carpet(g1, 0.9, 5, 0.17, 115)], cut: 2 }),
    makeLighter({ up: [0.18, 0.195, 0.23], down: [0.14, 0.15, 0.173], lamps: [lampAt(0, g2.y + g2.h * 0.5, g2.z - g2.t * 0.5, 1.2 * night, 30), ...lampsOf(2), ...winsOf(2)], beams: [carpet(g2, 0.9, 7, 0.24, 110)], cut: 2 }),
    courtLight,
  ];
  const lightOf = (k) => lighters[k];
  await ctx.yield();
  const b = makeBatch(1 << 18);
  b.tr(M);
  const shell = gateShell(b, G, lightOf, rsteps, fit, M, side, nF, L3, opts.pane);
  while (!shell.next().done) await ctx.yield();
  // ---- the keepers: each on his feet at one side of his gate's opening, facing those who come and turned a little
  // to the way through, in the light of his own lamp (what lights him is the lamp's place and nothing else)
  const keepers = [], kPos = [], out = [0, 0, 0];
  const coats = [[0.15, 0.11, 0.075], [0.13, 0.105, 0.085], [0.11, 0.095, 0.085]];
  for (let k = 0; k < 3; k++) {
    const q = G.keeper[k], sx = q.sign * side, x = sx * q.x, h = q.h, lamp = fit.lamps.find((l) => l.k && l.hall === k) || { x: x + sx * 2, y: q.y + h + 3, z: q.z + 1 };
    const p = pt(x, q.y, q.z), chest = pt(x, q.y + 0.62 * h, q.z), key = dirW(lamp.x - x, lamp.y - (q.y + 0.62 * h), lamp.z - q.z + 1.2);
    lighters[k](chest[0], chest[1], chest[2], key[0], key[1], key[2], out);
    keepers.push({ x: p[0], y: p[1], z: p[2], yaw: yaw0 - sx * 0.35, h, stand: true, kind: 5, col: coats[k], phase: rkeep.range(0, TAU), light: [Math.max(out[0], 0.2) * 1.2, Math.max(out[1], 0.17) * 1.2, Math.max(out[2], 0.13) * 1.2], bow: rkeep.range(0.03, 0.1), ld: key, hat: sx });
    kPos.push({ x: p[0], y: p[1], z: p[2], h, chest: new THREE.Vector3(chest[0], chest[1], chest[2]) });
  }
  await ctx.yield();
  // the low stool at the side of the first gate, beyond its keeper, and the old man who waits on it; the things of
  // his waiting on the floor by him: his bundle, his stick, a bowl, a jug
  const mx = side * (G.keeper[0].x + 5.4), mz = 5.6, mp = pt(mx, 0, mz), bx = mx + side * 1.9, bz = mz + 0.5;
  b.light(lighters[0]).col(PAL.wood, 0.7).surf(K.WOOD, 0);
  // (the stool's top is his seat: SITK of his own height over the floor his soles are on)
  const manH = MAN * 0.94, stoolY = SITK * manH;
  b.box(mx, stoolY - 0.08, mz - 0.25, 1.7, 0.16, 1.5);
  for (const [lx, lz] of [[-0.6, -0.5], [0.6, -0.5], [0, 0.45]]) b.rod([mx + lx, 0, mz - 0.25 + lz * 1.2], [mx + lx * 0.8, stoolY - 0.16, mz - 0.25 + lz], 0.09, 0.07, 5);
  b.col([0.3, 0.27, 0.22]).surf(K.CLOTH, 0).lathe([[0, 0], [0.75, 0.12], [0.9, 0.55], [0.6, 1.05], [0.16, 1.3], [0.3, 1.5], [0, 1.52]], 7, bx, bz);
  b.col(PAL.wood, 0.5).surf(K.WOOD, 0).rod([bx - 0.9, 0.08, bz + 1.5], [bx + 0.7, 1.5, bz - 0.5], 0.06, 0.05, 5);
  b.col([0.36, 0.3, 0.24]).surf(K.PLAIN, 0).lathe([[0, 0.05], [0.3, 0.02], [0.52, 0.26], [0.48, 0.28], [0.28, 0.1], [0, 0.1]], 8, mx - side * 1.5, mz + 1.5);
  b.col([0.24, 0.2, 0.17]).lathe([[0.2, 0], [0.34, 0.3], [0.3, 0.62], [0.14, 0.8], [0.18, 0.95]], 7, mx - side * 2.3, mz + 0.5);
  lighters[0](mp[0], 3, mp[2], -side * 0.5, 0.5, 0.5, out);
  // (he sits turned to the gate; his head stands turned the rest of the way to it and to its light)
  const man = { x: mp[0], y: mp[1], z: mp[2], yaw: yaw0 - side * 1.25, turn: -side * 0.64, h: manH, seat: 2, kind: 7, col: [0.12, 0.105, 0.09], phase: rkeep.range(0, TAU), light: [out[0] * 1.4, out[1] * 1.4, out[2] * 1.4], bow: 0.34, ld: dirW(-side * 0.6, 0.4, -0.7), hat: 0 };
  await ctx.yield();
  const figMat = figureMaterial(uniforms, k3(RADC, 0.85 * night), dirW(0, 0.12, -1));
  const upMesh = makePeople(keeperGeometry(true), figMat, keepers);
  await ctx.yield();
  const manMesh = makePeople(opts.personGeometry || personGeometry(), figMat, [man]);
  await ctx.yield();
  // THE STONE IS DRAWN IN THREE PIECES, each with its own place: what lies before the middle of the second gate's wall
  // (the front, the first gate, the first hall), what lies between that and the middle of the third gate's wall (the
  // second hall), and the last court. The world draws the first two only as far as 30 m past the gate that ends
  // them: from there on they lie behind the eye, beyond a gate's opening that the gaze never turns back to.
  const invM = new THREE.Matrix4().copy(M).invert(), zA = g1.z - g1.t / 2, zB = g2.z - g2.t / 2, heroMat = opts.material || courtMaterial(uniforms);
  const pieces = (await splitGeometryAsync(b.build(), 3, (x, y, z) => { v.set(x, y, z).applyMatrix4(invM); return v.z > zA ? 0 : v.z > zB ? 1 : 2; }, () => ctx.yield())).map((g) => { const me = new THREE.Mesh(g, heroMat); me.frustumCulled = false; return me; });
  const mesh = pieces[2];
  object.add(...pieces, upMesh.object, manMesh.object);
  await ctx.yield();
  // ---- the radiance: the innermost of the doors within the great door is all light; motes drift out through the halls
  const uTime = uniforms.uTime, rad = new THREE.Group(), zIn = -cm.A - (nF - 1) * D.gap, hwP = D.w / 2 + 6;
  {
    // (it closes the last chamber: nothing is drawn on it but light)
    const zs = zIn - LASTDEEP, P = [], UV = [];
    for (const [x, y] of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]]) { P.push(...ptF(3, x * hwP, cm.yL + y * (D.h + 6), zs)); UV.push(x * 0.5 + 0.5, y); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    const sheet = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime, uGain: { value: night } }, vertexShader: RAD_VERT, fragmentShader: RAD_FRAG, side: THREE.DoubleSide }));
    sheet.frustumCulled = false; rad.add(sheet);
  }
  // (No shaft is drawn out of a gate or out of the great door: the light of each opening is on the stone and the
  // floor before it, baked; a ray in the air there read as a streak on the lintel.)
  await ctx.yield();
  // dust: before the first gate, where its light falls into the nave, out through both halls, and through the court on
  // the axis of the great door (a little of it, drifting: the air of a hall is never still)
  const motes = [], dz = dirW(0, 0.06, 1), dz3 = dirF(3, 0, 0.05, 1);
  const mote = (p, dv) => { const sp = rmo.range(0.8, 2.2), m = [p[0], p[1], p[2], rmo(), dv[0] * sp, dv[1] * sp, dv[2] * sp, rmo.range(30, 60)]; if (!opts.moteOk || opts.moteOk(m, MOTEGAP)) motes.push(m); };
  for (let i = 0, n = Math.round(50 * detail); i < n; i++) mote(pt(rmo.range(-13, 13), rmo.range(1.5, 20), rmo.range(2, 58)), dz);
  await ctx.yield();
  for (let k = 0; k < 2; k++) {
    const h = G.hall[k];
    for (let i = 0, n = Math.round([70, 120][k] * detail); i < n; i++) { mote(pt(rmo.range(-0.6, 0.6) * h.hw, h.y + rmo.range(2, 0.55 * h.H), rmo.range(h.z1 + 4, h.z0 - 2)), dz); if (i % 200 === 199) await ctx.yield(); }
    await ctx.yield();
  }
  for (let i = 0, n = Math.round(140 * detail); i < n; i++) { mote(ptF(3, rmo.range(-30, 30), cm.y0 + rmo.range(2, 60), rmo.range(-cm.A, 62)), dz3); if (i % 200 === 199) await ctx.yield(); }
  await ctx.yield();
  // (dust, not a grain over the picture: few, soft and dim, and gone where it would be smaller than a dot)
  rad.add(makeMotes(motes, uTime, k3(RADC, 0.5), 0.075, 95, uniforms.uEye));
  object.add(rad);
  await ctx.yield();
  // the plinth the portal stands on, on the landing before the door: of the court's own stone, in its own light
  const dais = makeBatch(512); dais.tr(frames[3]).light(lighters[3]).col([0.5, 0.5, 0.5]).surf(K.STONE, 1.2, 0.6).tex(0, 2, 1);
  for (let i = 0; i < 2; i++) dais.box(0, cm.yL + 0.1 + i * 0.2, -(cm.A - P0.back), P0.w + 10 - i * 4, 0.2, 11 - i * 3);
  const daisMesh = new THREE.Mesh(dais.build(), mesh.material); daisMesh.frustumCulled = false; object.add(daisMesh);
  const pc = ptF(3, 0, cm.yL + 0.4 + P0.h / 2, -(cm.A - P0.back));
  // WHAT STANDS ON THE FLOORS OF THE HALLS AND THE COURT, for the dealing of the people (the world's person() asks
  // it): each a box in a frame of its own (F), x0..x1 by z0..z1, and the height of its top. One whose feet are lower
  // than its top and whose place falls in it is not dealt there. A flight is a box as high as its first tread: one
  // who stands on a tread is ON the flight, one who would stand on the hall's floor inside it is IN it.
  const solids = [];
  for (let k = 1; k < 3; k++) {
    const st = G.steps[k], g = G.gate[k], y0 = G.hall[k - 1].y, tot = st.land + st.n * st.dz;
    solids.push({ F: M, x0: -st.W / 2, x1: st.W / 2, z0: g.z, z1: g.z + tot, top: y0 + st.rise });
    for (const sd of [-1, 1]) solids.push({ F: M, x0: sd > 0 ? st.W / 2 : -st.W / 2 - st.pw - 0.25, x1: sd > 0 ? st.W / 2 + st.pw + 0.25 : -st.W / 2, z0: g.z, z1: g.z + tot + 0.15, top: y0 + 40 });
  }
  // (the walls of the halls: the side walls, and each end wall to either side of its gate's opening)
  G.hall.forEach((h, k) => {
    const sw = k ? 1.5 : 1.9;
    for (const sd of [-1, 1]) solids.push({ F: M, x0: sd > 0 ? h.hw - sw : -h.hw - 6, x1: sd > 0 ? h.hw + 6 : -h.hw + sw, z0: h.z1 - 2, z1: h.z0 + 2, top: h.y + 40 });
    for (const [g, za, zb] of [[G.gate[k], h.z0 - 0.3, h.z0 + G.gate[k].t + 0.5], [G.gate[k + 1], h.z1 - G.gate[k + 1].t, h.z1 + (k ? 3.2 : 2.5)]]) for (const sd of [-1, 1])
      solids.push({ F: M, x0: sd > 0 ? g.w / 2 : -h.hw - 6, x1: sd > 0 ? h.hw + 6 : -g.w / 2, z0: za, z1: zb, top: h.y + 40 });
  });
  for (const q of fit.lamps) if (q.post) solids.push({ F: M, x0: q.x - q.s, x1: q.x + q.s, z0: q.z - q.s, z1: q.z + q.s, top: q.y });
  for (const q of cm.hung) if (q.post) solids.push({ F: frames[q.j], x0: q.x - q.s, x1: q.x + q.s, z0: q.z - q.s, z1: q.z + q.s, top: q.y });
  for (const q of fit.benches) solids.push({ F: M, x0: q.x - 0.9, x1: q.x + 0.9, z0: q.z - q.len / 2, z1: q.z + q.len / 2, top: q.y + SEAT + 2 });
  for (const q of cm.benches) solids.push({ F: frames[q.j], x0: q.x - q.len / 2, x1: q.x + q.len / 2, z0: q.z - 0.95, z1: q.z + 0.75, top: cm.y0 + SEAT + 2 });
  for (const q of cm.lecterns) solids.push({ F: frames[q.j], x0: q.x - 1.8, x1: q.x + 1.8, z0: q.z - 2.8, z1: q.z + 0.8, top: cm.y0 + 0.6 }, { F: frames[q.j], x0: q.x - 1.5, x1: q.x + 1.5, z0: q.z - 0.7, z1: q.z + 0.8, top: cm.y0 + 4.1 });
  for (const q of cm.kposts) solids.push({ F: frames[q.j], x0: q.x - 0.9, x1: q.x + 0.9, z0: q.z - 0.9, z1: q.z + 0.9, top: q.y });
  for (const q of cm.posts) solids.push({ F: frames[q.j], x0: q.x - 0.5, x1: q.x + 0.5, z0: q.z - 0.5, z1: q.z + 0.5, top: q.y });
  for (const q of cm.files) solids.push({ F: frames[q.j], x0: q.x - q.n * 0.75 - 0.3, x1: q.x + q.n * 0.75 + 0.3, z0: q.z - 0.6, z1: q.z + 1.1, top: cm.y0 + 1.6 });
  solids.push({ F: frames[3], x0: -D.W / 2 - 2, x1: D.W / 2 + 2, z0: -cm.A, z1: cm.zFoot, top: cm.y0 + D.rise });
  for (const sd of [-1, 1]) solids.push({ F: frames[3], x0: sd > 0 ? D.W / 2 : -D.W / 2 - 5.5, x1: sd > 0 ? D.W / 2 + 5.5 : -D.W / 2, z0: -cm.A, z1: cm.zFoot + 0.15, top: cm.y0 + 40 });
  return {
    object, radius: 340, height: 190, center: new THREE.Vector3(0, 50, -250), ground: false,
    // court: the last court's measures (courtMeasure), the frame of each of its faces, its light
    // pieces: the stone in three pieces (above), cut: where they divide (z of the hero's frame); solids: what stands on the floors (above); lights: the light of each hall and of the court; lamps: the lamps of the halls and benches: the benches under them (hero frame)
    anchors: { G, side, beyond, solids, pieces, cut: [zA, zB], keepers: kPos, frontLamps, frontBeams, pt, lights: lighters, lamps: fit.lamps, benches: fit.benches, court: { m: cm, frames, light: lighters[3], ptF }, portal: { width: P0.w, height: P0.h, center: new THREE.Vector3(pc[0], pc[1], pc[2]) } },
    update(dt, time) { if (own) uniforms.uTime.value = time; },
    dispose() {},
  };
}
