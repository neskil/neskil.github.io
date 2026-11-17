// SKY WITH A SEAM: THE TOWN, continued: the paint's builder and the makers of the town's things (called by
// src/parts/sky-with-a-seam-town.js, which holds the measures, the material and the build). Everything here is laid
// in the town's axes (a = metres to starboard of the flown line, y up, b = metres along the line from the entry)
// and written to the world through the axes handed in. Nothing here reads where the eye is or looks, a clock or a seed's number;
// the only dice read here are a tone of paint and where a boat's rocking begins, both handed in. Nothing lettered, nobody.
import * as THREE from 'three';

const _c = new THREE.Color();
// THE PAINT'S BUILDER: flat triangles with a colour, a surface kind and place (see the material's head), gathered
// in chunks (the town's pieces: the build joins them into its four draws and lays the image piece by piece) and marked off
// in BODIES (name, kind, the vertices' range, the reach of what the clock moves) for the proof to count.
export class Paint {
  constructor(axes) {
    this.f = axes; this.chunks = []; this.bodies = []; this.cur = null; this.open = null;
    this.col = [1, 1, 1]; this.kind = 0; this.lay = 0; this.par = 0; this.mv = [0, 0, 0, 0]; this.thin = false;
  }
  chunk(name, mirror = true) { this.end(); this.cur = { name, mirror, P: [], N: [], C: [], M: [], A: [], V: [] }; this.chunks.push(this.cur); return this; }
  body(name, kind, pad = 0) { this.end(); this.open = { name, kind, pad, chunk: this.chunks.length - 1, start: this.cur.P.length / 3, end: 0 }; return this; }
  end() { if (this.open) { this.open.end = this.cur.P.length / 3; if (this.open.end > this.open.start) this.bodies.push(this.open); this.open = null; } return this; }
  color(hex, m = 1) { _c.set(hex); this.col = [_c.r * m, _c.g * m, _c.b * m]; return this; }
  tone(rgb, m = 1) { this.col = [rgb[0] * m, rgb[1] * m, rgb[2] * m]; return this; }
  mat(kind, par = 0, layer = 0) { this.kind = kind; this.par = par; this.lay = layer; return this; }
  move(what = 0, a = 0, b = 0, c = 0) { if (!what) this.mv = [0, 0, 0, 0]; else { const f = this.f; this.mv = [f.ox + a * f.sx + b * f.fx, f.oz + a * f.sz + b * f.fz, c, what]; } return this; }
  get triangles() { let n = 0; for (const c of this.chunks) n += c.P.length / 9; return n; }
  // one vertex: p and n in the town's axes; u, v on its surface; ax = [a, y, b, r] the axis of a thin member; s = the pennant's metres from the hoist
  vert(p, n, u, v, ax, s) {
    const f = this.f, c = this.cur;
    c.P.push(f.ox + p[0] * f.sx + p[2] * f.fx, p[1], f.oz + p[0] * f.sz + p[2] * f.fz);
    c.N.push(n[0] * f.sx + n[2] * f.fx, n[1], n[0] * f.sz + n[2] * f.fz);
    c.C.push(this.col[0], this.col[1], this.col[2]); c.M.push(this.kind + 16 * this.lay, u, v, this.par);
    if (ax) c.A.push(f.ox + ax[0] * f.sx + ax[2] * f.fx, ax[1], f.oz + ax[0] * f.sz + ax[2] * f.fz, ax[3]); else c.A.push(0, 0, 0, 0);
    c.V.push(this.mv[0], this.mv[1], s === undefined ? this.mv[2] : s, this.mv[3]);
  }
  // a flat triangle; n = its normal, or a hint the worked-out normal must lie along
  tri(p0, p1, p2, n, uv) {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (n && nx * n[0] + ny * n[1] + nz * n[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const q = [nx, ny, nz], t = uv || [0, 0, 0, 0, 0, 0];
    this.vert(p0, q, t[0], t[1]); this.vert(p1, q, t[2], t[3]); this.vert(p2, q, t[4], t[5]); return this;
  }
  // a flat quad p0..p3 round its edge; uv = [u0, v0, u1, v1]: p0 (u0, v0), p1 (u1, v0), p2 (u1, v1), p3 (u0, v1)
  quad(p0, p1, p2, p3, n, uv) {
    const t = uv || [0, 0, 0, 0];
    this.tri(p0, p1, p2, n, [t[0], t[1], t[2], t[1], t[2], t[3]]); this.tri(p0, p2, p3, n, [t[0], t[1], t[2], t[3], t[0], t[3]]); return this;
  }
  // a box of the axes; faces: which of its six to make (w toward the line, e away, s astern, n ahead, t top, u under)
  box(a0, a1, y0, y1, b0, b1, faces = 'wesntu') {
    for (const k of faces) {
      if (k === 'w') this.quad([a0, y0, b0], [a0, y0, b1], [a0, y1, b1], [a0, y1, b0], [-1, 0, 0], [b0, y0, b1, y1]);
      else if (k === 'e') this.quad([a1, y0, b0], [a1, y0, b1], [a1, y1, b1], [a1, y1, b0], [1, 0, 0], [b0, y0, b1, y1]);
      else if (k === 's') this.quad([a0, y0, b0], [a1, y0, b0], [a1, y1, b0], [a0, y1, b0], [0, 0, -1], [a0, y0, a1, y1]);
      else if (k === 'n') this.quad([a0, y0, b1], [a1, y0, b1], [a1, y1, b1], [a0, y1, b1], [0, 0, 1], [a0, y0, a1, y1]);
      else if (k === 't') this.quad([a0, y1, b0], [a1, y1, b0], [a1, y1, b1], [a0, y1, b1], [0, 1, 0], [a0, b0, a1, b1]);
      else if (k === 'u') this.quad([a0, y0, b0], [a1, y0, b0], [a1, y0, b1], [a0, y0, b1], [0, -1, 0], [a0, b0, a1, b1]);
    }
    return this;
  }
}
// END-OF-PAINT

// a round member from p0 to p1 (radii r0, r1; n sides), smooth round its axis; thin = true: it carries its axis and
// its true radius for the paint's thin-member law (drawn a pixel and a half wide at the least, with only the cover it truly has).
// ITS WINDING: every triangle is wound away from the axis in these axes, and so TOWARD it in the world (vert lays
// these axes in the world by a mirror); the paint's facing tests for a thin member rest on that, and the proof counts it.
Paint.prototype.tube = function (p0, p1, r0, r1 = r0, n = 6, thin = false) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], dl = Math.hypot(dx, dy, dz) || 1;
  const up = Math.abs(dy) > 0.9 * dl ? [1, 0, 0] : [0, 1, 0];
  let e1 = [up[1] * dz - up[2] * dy, up[2] * dx - up[0] * dz, up[0] * dy - up[1] * dx]; const l1 = Math.hypot(e1[0], e1[1], e1[2]) || 1; e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
  const e2 = [(dy * e1[2] - dz * e1[1]) / dl, (dz * e1[0] - dx * e1[2]) / dl, (dx * e1[1] - dy * e1[0]) / dl];
  const ring = [];
  for (let i = 0; i <= n; i++) { const an = (i / n) * 2 * Math.PI, c = Math.cos(an), s = Math.sin(an), q = [e1[0] * c + e2[0] * s, e1[1] * c + e2[1] * s, e1[2] * c + e2[2] * s];
    ring.push([q, [p0[0] + q[0] * r0, p0[1] + q[1] * r0, p0[2] + q[2] * r0], [p1[0] + q[0] * r1, p1[1] + q[1] * r1, p1[2] + q[2] * r1]]); }
  const a0 = thin ? [p0[0], p0[1], p0[2], r0] : null, a1 = thin ? [p1[0], p1[1], p1[2], r1] : null;
  for (let i = 0; i < n; i++) { const A = ring[i], Bq = ring[i + 1], u0 = (i / n) * 6.283 * r0, u1 = ((i + 1) / n) * 6.283 * r0;
    this.vert(A[1], A[0], u0, 0, a0); this.vert(Bq[1], Bq[0], u1, 0, a0); this.vert(Bq[2], Bq[0], u1, dl, a1);
    this.vert(A[1], A[0], u0, 0, a0); this.vert(Bq[2], Bq[0], u1, dl, a1); this.vert(A[2], A[0], u0, dl, a1); }
  return this;
};
// a turned body about the upright axis at (a, b): prof = [[radius, y], ...] from foot to head; n sides; from..to = the arc made (turns)
Paint.prototype.lathe = function (a, b, prof, n = 16, from = 0, to = 1) {
  for (let j = 0; j < prof.length - 1; j++) {
    const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], sl = Math.hypot(r1 - r0, y1 - y0) || 1, nr = (y1 - y0) / sl, ny = -(r1 - r0) / sl;
    for (let i = 0; i < n; i++) {
      const t0 = (from + (to - from) * i / n) * 2 * Math.PI, t1 = (from + (to - from) * (i + 1) / n) * 2 * Math.PI;
      const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1), rm = Math.max(r0, r1);
      const n0 = [c0 * nr, ny, s0 * nr], n1 = [c1 * nr, ny, s1 * nr], u0 = t0 * rm, u1 = t1 * rm;
      const A0 = [a + c0 * r0, y0, b + s0 * r0], B0 = [a + c1 * r0, y0, b + s1 * r0], A1 = [a + c0 * r1, y1, b + s0 * r1], B1 = [a + c1 * r1, y1, b + s1 * r1];
      if (r0 > 1e-6) { this.vert(A0, n0, u0, y0); this.vert(B0, n1, u1, y0); this.vert(B1, n1, u1, y1); }
      if (r1 > 1e-6) { this.vert(A0, n0, u0, y0); this.vert(B1, n1, u1, y1); this.vert(A1, n0, u0, y1); }
    }
  }
  return this;
};
// a level disc at height y about (a, b), facing up (dir 1) or down (-1)
Paint.prototype.disc = function (a, y, b, r, n = 16, dir = 1) {
  for (let i = 0; i < n; i++) { const t0 = (i / n) * 2 * Math.PI, t1 = ((i + 1) / n) * 2 * Math.PI;
    this.tri([a, y, b], [a + Math.cos(t0) * r, y, b + Math.sin(t0) * r], [a + Math.cos(t1) * r, y, b + Math.sin(t1) * r], [0, dir, 0],
      [a, b, a + Math.cos(t0) * r, b + Math.sin(t0) * r, a + Math.cos(t1) * r, b + Math.sin(t1) * r]); }
  return this;
};
// a window: one quad proud of its wall, drawn by the paint (axes, bars, glass). at = its middle; nrm = the wall's
// outward normal (level, along an axis of the axes); w, h its size; panes = columns x 10 + rows (never one column
// of two: no window is a shape that could be read as a sign); lamp = a room's lamp burns behind it in the LOW SUN look
Paint.prototype.window = function (at, nrm, w, h, panes = 23, trim = '#f3efe4', lamp = false) {
  const k = this.kind, pr = this.par, ly = this.lay, col = this.col, o = 0.045;
  const ta = nrm[2] !== 0 ? 1 : 0, tb = nrm[0] !== 0 ? 1 : 0, c = [at[0] + nrm[0] * o, at[1], at[2] + nrm[2] * o];
  this.color(trim).mat(3, panes + (lamp ? 100 : 0), 1);
  this.quad([c[0] - ta * w / 2, c[1] - h / 2, c[2] - tb * w / 2], [c[0] + ta * w / 2, c[1] - h / 2, c[2] + tb * w / 2], [c[0] + ta * w / 2, c[1] + h / 2, c[2] + tb * w / 2], [c[0] - ta * w / 2, c[1] + h / 2, c[2] - tb * w / 2], nrm, [0, 0, 1, 1]);
  this.kind = k; this.par = pr; this.lay = ly; this.col = col; return this;
};
// END-OF-HELPERS

// ---- THE MAKERS. Each piece is one build step: (B the paint, T the town's measures, env { rng, detail, clock }).
export const PIECES = [];
const STONE = '#8f8c86', PAVE = '#a39d90', GRASS = '#5d8738', TRIM = '#f4f0e6';
const slotB = (T, k) => T.slot0 + T.pitch * k;

// THE STONE: the land's platform with the quay's face, the basin's inner end, the two breakwaters and their
// round heads, the west mole. Dressed stone to under the water; the tops are paving and, behind the houses, grass.
PIECES.push((B, T) => {
  const g = T.quayTop, m = T.moleTop, d = -1.6, hw = T.moleW / 2, bq = T.mouth - hw;
  B.chunk('stone-east').body('the quay and the land', 'quay').color(STONE).mat(4);
  B.box(T.quayA, T.landA, d, g, T.south - 10, bq, 'wes');                                   // the quay's face (and the land's back and south faces)
  B.box(T.rootA, T.landA, d, g, bq, T.northB, 'wne');                                       // the land north of the breakwater's root
  B.box(T.quayA - 0.12, T.quayA + 0.5, g - 0.32, g + 0.04, T.south, bq, 'wt');              // the coping
  const be = slotB(T, T.slots - 1) + T.houseW / 2 + 0.8;                                    // (north of the last house the quay's end is paved to the breakwater's root)
  B.color(PAVE).box(T.quayA + 0.5, T.frontA + 0.5, d, g, T.south - 10, be, 't').box(T.quayA + 0.5, T.rootA, d, g, be, bq, 't');
  B.color(GRASS).mat(0).box(T.frontA + 0.5, T.landA, d, g, T.south - 10, be, 't').box(T.rootA, T.landA, d, g, be, T.northB, 't');
  B.body('the east breakwater', 'mole').color(STONE, 0.94).mat(4);
  B.box(T.eastHeadA, T.rootA, d, m, bq, T.mouth + hw, 'sn').color(PAVE, 0.92).box(T.eastHeadA, T.rootA, d, m, bq, T.mouth + hw, 't');
  B.body('the east head', 'head').color(STONE, 0.94).lathe(T.eastHeadA, T.mouth, [[T.headR + 0.45, d], [T.headR, m]], 22).color(PAVE, 0.92).mat(4).disc(T.eastHeadA, m, T.mouth, T.headR, 22);
  B.chunk('stone-west').body('the west breakwater and mole', 'mole').color(STONE, 0.9).mat(4);
  B.box(T.westA - 3, T.westHeadA, d, m, bq, T.mouth + hw, 'sn').box(T.westA - 3, T.westA + 3, d, m, T.south - 10, bq, 'we');
  B.box(T.westA + 3, T.quayA, d, g, T.south - 10, T.south, 'n');                             // the basin's inner end
  B.color(PAVE, 0.9).box(T.westA - 3, T.westHeadA, d, m, bq, T.mouth + hw, 't').box(T.westA - 3, T.westA + 3, d, m, T.south - 10, bq, 't').box(T.westA + 3, T.quayA, d, g, T.south - 10, T.south, 't');
  B.body('the west head', 'head').color(STONE, 0.9).lathe(T.westHeadA, T.mouth, [[T.headR + 0.45, d], [T.headR, m]], 22).color(PAVE, 0.9).disc(T.westHeadA, m, T.mouth, T.headR, 22);
  B.end();
});
// END-OF-STONE

// THE HOUSES: gable to the water, clapboard on a stone plinth, two storeys and three by turns, red, ochre and
// white in strict rotation, every one with the same bays, the same door, the same chimney, the same flower boxes.
const WALLS = [['#9d2f24', TRIM, '#2c463a'], ['#d39a33', TRIM, '#6b2721'], ['#ece7da', '#c3cbcd', '#34526d']];
export const houseShape = (T, k) => { const st = 2 + (k % 2), g = T.quayTop, eav = g + 0.45 + st * 2.85 + 0.25, hw = T.houseW / 2;
  return { st, g, eav, ridge: eav + hw * 0.9, hw, bc: slotB(T, k), a0: T.frontA, a1: T.frontA + T.depth, isSquare: T.square.includes(k) }; };
function house(B, T, k, rng, detail) {
  const H = houseShape(T, k), [wall, trim, door] = WALLS[k % 3], { g, eav, ridge, hw, bc, a0, a1 } = H, b0 = bc - hw, b1 = bc + hw, y0 = g + 0.45, tone = 0.97 + 0.06 * rng();
  B.body('house ' + k, 'house');
  B.color(STONE, 1.05).mat(4).box(a0 - 0.06, a1, g, y0, b0 - 0.06, b1 + 0.06, 'wsn');
  B.color(wall, tone).mat(1).box(a0, a1, y0, eav, b0, b1, 'wsn');
  B.tri([a0, eav, b0], [a0, eav, b1], [a0, ridge, bc], [-1, 0, 0], [b0, eav, b1, eav, bc, ridge]);
  // the roof: two pitches of slate with their overhangs, the verge boards, the eaves boards, the ridge
  const ov = 0.38, og = 0.42, th = 0.14, ye = eav - ov * 0.9 + th, yr = ridge + th, sl = Math.hypot(hw + ov, yr - ye);
  B.color('#3b414b', 0.95 + 0.1 * rng()).mat(2);
  B.quad([a0 - og, ye, b0 - ov], [a1, ye, b0 - ov], [a1, yr, bc], [a0 - og, yr, bc], [0, 1, -1], [a0 - og, 0, a1, sl]);
  B.quad([a0 - og, ye, b1 + ov], [a1, ye, b1 + ov], [a1, yr, bc], [a0 - og, yr, bc], [0, 1, 1], [a0 - og, 0, a1, sl]);
  B.color(trim).mat(0, 0, 1);
  for (const [be, sg] of [[b0 - ov, -1], [b1 + ov, 1]]) {
    B.quad([a0 - og, ye - 0.24, be], [a0 - og, yr - 0.24, bc], [a0 - og, yr, bc], [a0 - og, ye, be], [-1, 0, 0]);                 // the verge board
    B.quad([a0 - og, ye - 0.2, be], [a1, ye - 0.2, be], [a1, ye, be], [a0 - og, ye, be], [0, 0, sg]);                            // the eaves board
    B.color('#aeb4b6').tube([a0 - og, ye - 0.04, be + sg * 0.09], [a1, ye - 0.04, be + sg * 0.09], 0.075, 0.075, 5, true);      // the gutter
    B.tube([a0 - 0.1, ye - 0.12, be + sg * 0.09], [a0 - 0.1, g + 0.2, be + sg * 0.09 - sg * (ov - 0.02)], 0.05, 0.05, 4, true).color(trim);   // its downpipe
  }
  B.box(a0 - 0.05, a0 + 0.02, eav - 0.11, eav + 0.11, b0, b1, 'w');                                                             // the band under the gable
  B.box(a0 - 0.04, a0 + 0.15, y0, eav, b0 - 0.04, b0 + 0.16, 'ws').box(a0 - 0.04, a0 + 0.15, y0, eav, b1 - 0.16, b1 + 0.04, 'wn');   // corner boards
  // the bays: door in the middle, a window either side; three windows to every storey over it; one in the gable
  B.mat(0, 0, 0);
  for (let s = 0; s < H.st; s++) { const yc = y0 + 1.6 + s * 2.85;
    for (const o of [-3.1, 0, 3.1]) { if (s === 0 && o === 0) continue; B.window([a0, yc, bc + o], [-1, 0, 0], 1.08, 1.5, 23, trim, s === 1 && o > 0 && k % 4 === 2); }   // (every fourth house: its lamp)
    for (const o of [3.1, 8.6]) B.window([a0 + o, yc, b0], [0, 0, -1], 1.08, 1.5, 23, trim); }
  B.window([a0, eav + 1.55, bc], [-1, 0, 0], 0.9, 0.9, 22, trim, k % 4 === 2);                                                  // (and its attic's)
  B.color(trim).mat(0, 0, 1).box(a0 - 0.05, a0, y0 - 0.02, y0 + 2.52, bc - 0.74, bc + 0.74, 'w');
  B.color(door).mat(8, 0, 2).box(a0 - 0.08, a0, y0, y0 + 2.02, bc - 0.56, bc + 0.56, 'w');
  B.mat(0).window([a0 - 0.04, y0 + 2.26, bc], [-1, 0, 0], 1.12, 0.36, 11, trim);
  B.color(STONE, 1.12).mat(4).box(a0 - 0.55, a0, g, g + 0.22, bc - 0.9, bc + 0.9, 'wsnt');
  // the chimney on the ridge, and the two flower boxes: all alike
  B.color('#7d4b3d').mat(0).box(a0 + 3.6, a0 + 4.4, ridge - 0.4, ridge + 1.45, bc - 0.4, bc + 0.4, 'wsne').color('#2c2f33').box(a0 + 3.52, a0 + 4.48, ridge + 1.45, ridge + 1.62, bc - 0.48, bc + 0.48, 'wsnet');
  if (detail >= 0.8) for (const o of [-3.1, 3.1]) { const ys = y0 + 0.68;
    B.color('#2f5a33').box(a0 - 0.3, a0 - 0.04, ys - 0.2, ys, bc + o - 0.62, bc + o + 0.62, 'wsnu').color('#3f7a35').box(a0 - 0.33, a0 - 0.04, ys, ys + 0.1, bc + o - 0.66, bc + o + 0.66, 'wsn');
    B.color('#d8362c').box(a0 - 0.34, a0 - 0.04, ys + 0.1, ys + 0.26, bc + o - 0.6, bc + o + 0.6, 'wsnt'); }
  B.end();
}
// (the row is made from its north end southward, a few houses to a step)
for (let s = 0; s < 4; s++) PIECES.push((B, T, env) => {
  if (s === 0) B.chunk('houses-north'); else if (s === 2) B.chunk('houses-south');
  for (let k = T.slots - 1 - s * 5; k > T.slots - 6 - s * 5; k--) if (!T.square.includes(k)) house(B, T, k, env.rng, env.detail);
});
// END-OF-HOUSES

// THE LIGHTHOUSE on the east head: a small white tower with one red band, a railed gallery, a lantern whose lamp
// turns by the clock (the paint's kind 5: emissive, no light), a dark cap. And a squat beacon on the west head.
PIECES.push((B, T) => {
  const L = T.light, m = T.moleTop, a = T.eastHeadA, b = T.mouth, rAt = (h) => L.r0 + (L.r1 - L.r0) * h / L.h;
  B.chunk('lighthouse').body('the lighthouse', 'lighthouse');
  B.color(STONE, 1.08).mat(4).lathe(a, b, [[2.45, m], [2.4, m + 0.55]], 20).disc(a, m + 0.55, b, 2.4, 20);
  B.color('#f1eee6').mat(0).lathe(a, b, [[rAt(0), m + 0.55], [rAt(3.3), m + 3.3]], 20);
  B.color('#b3261e').lathe(a, b, [[rAt(3.3), m + 3.3], [rAt(5.2), m + 5.2]], 20);                       // the one red band
  B.color('#f1eee6').lathe(a, b, [[rAt(5.2), m + 5.2], [L.r1, m + L.h], [L.r1 + 0.75, m + L.h + 0.25]], 20);
  B.color('#3a3d40').disc(a, m + L.h + 0.25, b, L.r1 + 0.75, 20).lathe(a, b, [[L.r1 + 0.75, m + L.h + 0.25], [L.r1 + 0.75, m + L.h + 0.1]], 20);
  // the gallery's rail: twelve posts and two rings
  const rg = L.r1 + 0.65, y0 = m + L.h + 0.25;
  B.color('#e9e6de');
  for (let i = 0; i < 12; i++) { const t = (i / 12) * 2 * Math.PI, t1 = ((i + 1) / 12) * 2 * Math.PI, p = [a + Math.cos(t) * rg, y0, b + Math.sin(t) * rg], q = [a + Math.cos(t1) * rg, y0, b + Math.sin(t1) * rg];
    B.tube(p, [p[0], y0 + 1.0, p[2]], 0.035, 0.035, 4, true);
    for (const h of [0.55, 1.0]) B.tube([p[0], y0 + h, p[2]], [q[0], y0 + h, q[2]], 0.03, 0.03, 4, true); }
  // the lantern: its glass (the lamp's glow), eight glazing bars, the cap and its ball
  B.color('#22262a').lathe(a, b, [[1.12, y0], [1.12, y0 + 0.45]], 16);
  B.color('#111111').mat(5).lathe(a, b, [[1.05, y0 + 0.45], [1.05, m + L.lamp + 1.25]], 16);
  B.color('#22262a').mat(0);
  for (let i = 0; i < 8; i++) { const t = (i / 8) * 2 * Math.PI; B.tube([a + Math.cos(t) * 1.08, y0 + 0.45, b + Math.sin(t) * 1.08], [a + Math.cos(t) * 1.08, m + L.lamp + 1.25, b + Math.sin(t) * 1.08], 0.04, 0.04, 4, true); }
  B.color('#7a1d18').lathe(a, b, [[1.38, m + L.lamp + 1.2], [1.3, m + L.lamp + 1.35], [0.12, m + L.top - 0.35]], 16);
  B.color('#2a2c2e').lathe(a, b, [[0.0, m + L.top - 0.55], [0.17, m + L.top - 0.3], [0.0, m + L.top - 0.05]], 8).tube([a, m + L.top - 0.1, b], [a, m + L.top + 0.9, b], 0.025, 0.025, 4, true);
  // its door toward the quay, and two small windows up the side that faces the line
  B.color('#2c463a').mat(8, 0, 1).box(a - 0.5, a + 0.5, m + 0.55, m + 2.5, b - rAt(1) - 0.02, b - rAt(1) + 0.3, 's');
  B.mat(0).window([a - rAt(3.9) + 0.02, m + 4.3, b], [-1, 0, 0], 0.5, 0.8, 22).window([a - rAt(6.6) + 0.02, m + 7.0, b], [-1, 0, 0], 0.5, 0.8, 22);
  // the west head's beacon: a squat white post with a green band and a dark top mark
  const wa = T.westHeadA;
  B.body('the west beacon', 'beacon').color('#f1eee6').mat(0).lathe(wa, b, [[0.85, m], [0.7, m + 1.3]], 12).color('#2f6e4a').lathe(wa, b, [[0.7, m + 1.3], [0.6, m + 2.2]], 12);
  B.color('#f1eee6').lathe(wa, b, [[0.6, m + 2.2], [0.5, m + 3.1]], 12).disc(wa, m + 3.1, b, 0.5, 12).color('#2a2c2e').lathe(wa, b, [[0.0, m + 3.1], [0.34, m + 3.5], [0.34, m + 4.0], [0.0, m + 4.4]], 10);
  B.end();
});
// END-OF-LIGHTHOUSE

// THE CHURCH on the point beyond the breakwater's root: white clapboard, dark slate, a square west tower with
// louvred belfry and a slender spire (a ball and a plain rod at its head: no emblem), tall white-barred windows.
PIECES.push((B, T) => {
  const C = T.church, g = T.quayTop, y0 = g + 0.6, eav = y0 + C.eaves, hw = C.w / 2, ridge = eav + hw, a0 = C.a, a1 = C.a + C.len, bc = C.b, b0 = bc - hw, b1 = bc + hw;
  const ta0 = C.a - C.tower, ht = C.tower / 2, tTop = g + C.towerH, sTop = g + C.spire, white = '#f2efe7';
  B.chunk('church').body('the church', 'church');
  B.color(STONE, 1.05).mat(4).box(a0, a1, g, y0, b0 - 0.08, b1 + 0.08, 'wsn').box(ta0 - 0.08, a0, g, y0, bc - ht - 0.08, bc + ht + 0.08, 'wsn');
  // the nave: walls, its west and east gables, the roof with its ridge along the nave
  B.color(white).mat(1).box(a0, a1, y0, eav, b0, b1, 'wsne');
  B.tri([a0, eav, b0], [a0, eav, b1], [a0, ridge, bc], [-1, 0, 0], [b0, eav, b1, eav, bc, ridge]).tri([a1, eav, b0], [a1, eav, b1], [a1, ridge, bc], [1, 0, 0], [b0, eav, b1, eav, bc, ridge]);
  const ov = 0.4, th = 0.14, ye = eav - ov + th, yr = ridge + th, sl = Math.hypot(hw + ov, yr - ye);
  B.color('#333942').mat(2);
  B.quad([a0 - 0.3, ye, b0 - ov], [a1 + 0.4, ye, b0 - ov], [a1 + 0.4, yr, bc], [a0 - 0.3, yr, bc], [0, 1, -1], [a0, 0, a1, sl]);
  B.quad([a0 - 0.3, ye, b1 + ov], [a1 + 0.4, ye, b1 + ov], [a1 + 0.4, yr, bc], [a0 - 0.3, yr, bc], [0, 1, 1], [a0, 0, a1, sl]);
  B.color(TRIM).mat(0, 0, 1);
  for (const [be, sg] of [[b0 - ov, -1], [b1 + ov, 1]]) { B.quad([a0 - 0.3, ye - 0.22, be], [a1 + 0.4, ye - 0.22, be], [a1 + 0.4, ye, be], [a0 - 0.3, ye, be], [0, 0, sg]);
    B.quad([a0 - 0.3, ye - 0.24, be], [a0 - 0.3, yr - 0.24, bc], [a0 - 0.3, yr, bc], [a0 - 0.3, ye, be], [-1, 0, 0]); }
  B.box(a0 - 0.04, a0 + 0.16, y0, eav, b0 - 0.04, b0 + 0.16, 'ws').box(a1 - 0.16, a1 + 0.04, y0, eav, b0 - 0.04, b0 + 0.16, 'es').box(a0 - 0.04, a0 + 0.16, y0, eav, b1 - 0.16, b1 + 0.04, 'wn');
  B.mat(0);
  for (let i = 0; i < 4; i++) B.window([a0 + 2.6 + i * 4.25, y0 + 3.2, b0], [0, 0, -1], 1.15, 3.3, 25);
  for (const o of [-3.3, 3.3]) B.window([a0, y0 + 3.0, bc + o], [-1, 0, 0], 0.9, 2.6, 24);
  // the tower: four white faces, corner boards, a door, a small window, the louvred belfry
  B.color(white).mat(1).box(ta0, a0 + 0.3, y0, tTop, bc - ht, bc + ht, 'wsne');
  B.color(TRIM).mat(0, 0, 1);
  for (const sb of [-1, 1]) B.box(ta0 - 0.04, ta0 + 0.17, y0, tTop, bc + sb * ht - 0.17 * (sb > 0 ? 1 : 0) - 0.04 * (sb < 0 ? 1 : 0), bc + sb * ht + 0.04 * (sb > 0 ? 1 : 0) + 0.17 * (sb < 0 ? 1 : 0), sb < 0 ? 'ws' : 'wn');
  B.box(ta0 - 0.06, a0 + 0.36, tTop - 0.3, tTop + 0.05, bc - ht - 0.06, bc + ht + 0.06, 'wsnet').box(ta0 - 0.05, a0 + 0.3, tTop - 4.3, tTop - 4.1, bc - ht - 0.05, bc + ht + 0.05, 'wsn');
  B.color('#2c463a').mat(8, 0, 2).box(ta0 - 0.07, ta0, y0, y0 + 2.6, bc - 0.85, bc + 0.85, 'w').color(TRIM).mat(0, 0, 1).box(ta0 - 0.04, ta0, y0, y0 + 2.85, bc - 1.05, bc + 1.05, 'w');
  B.mat(0).window([ta0, y0 + 5.2, bc], [-1, 0, 0], 0.95, 1.5, 23).window([ta0 + ht, y0 + 5.2, bc - ht], [0, 0, -1], 0.95, 1.5, 23);
  B.color('#4c5a55').mat(1, 0, 1).box(ta0 - 0.03, ta0, tTop - 3.4, tTop - 1.0, bc - 0.8, bc + 0.8, 'w').box(ta0 + ht - 0.8, ta0 + ht + 0.8, tTop - 3.4, tTop - 1.0, bc - ht - 0.03, bc - ht, 's');
  // the spire: eight slate faces from the tower's head to a point, a gilt ball, a rod
  const ca = ta0 + (a0 + 0.3 - ta0) / 2, rs = ht + 0.22, ring = (r, y, i) => [ca + Math.cos((i + 0.5) / 8 * 2 * Math.PI) * r, y, bc + Math.sin((i + 0.5) / 8 * 2 * Math.PI) * r];
  B.color('#30363f').mat(2, 0, 0);
  for (let i = 0; i < 8; i++) { const p = ring(rs * 1.12, tTop + 0.05, i), q = ring(rs * 1.12, tTop + 0.05, i + 1), p1 = ring(rs * 0.62, tTop + 2.2, i), q1 = ring(rs * 0.62, tTop + 2.2, i + 1), mid = [(p[0] + q[0]) / 2 - ca, 0.4, (p[2] + q[2]) / 2 - bc];
    B.quad(p, q, q1, p1, mid, [i * 2, 0, i * 2 + 2, 2.6]).tri(p1, q1, [ca, sTop, bc], mid, [i * 2, 0, i * 2 + 1.2, 0, i * 2 + 0.6, sTop - tTop - 2.2]); }
  B.color('#c9a23a').mat(0).lathe(ca, bc, [[0.0, sTop - 0.25], [0.22, sTop], [0.0, sTop + 0.25]], 8).color('#2a2c2e').tube([ca, sTop + 0.2, bc], [ca, sTop + 1.5, bc], 0.03, 0.03, 4, true);
  B.end();
});
// END-OF-CHURCH

// A BOATHOUSE on stilts over the water: red upright boards, white trim, slate, its gable and its wide boat door
// toward the basin (face -1: the gable at a0 looks toward lesser a; +1: the gable at a1 looks toward greater a).
function boathouse(B, T, a0, a1, bc, face, name, tone = 1) {
  const H = T.boathouses, fl0 = H.floor, eav = fl0 + 2.5, hw = H.w / 2, ridge = eav + hw * 0.72, b0 = bc - hw, b1 = bc + hw, af = face < 0 ? a0 : a1, ab = face < 0 ? a1 : a0, fk = face < 0 ? 'w' : 'e';
  B.body(name, 'boathouse');
  B.color('#8f2a21', tone).mat(8).box(a0, a1, fl0, eav, b0, b1, 'wesn');
  B.tri([af, eav, b0], [af, eav, b1], [af, ridge, bc], [face, 0, 0], [b0, eav, b1, eav, bc, ridge]).tri([ab, eav, b0], [ab, eav, b1], [ab, ridge, bc], [-face, 0, 0], [b0, eav, b1, eav, bc, ridge]);
  B.color('#4a3a2e').mat(0).box(a0 - 0.5, a1 + 0.5, fl0 - 0.22, fl0, b0 - 0.3, b1 + 0.3, 'wesnu');                        // the floor's deck and its edge
  const ov = 0.35, th = 0.12, ye = eav - ov * 0.72 + th, yr = ridge + th, sl = Math.hypot(hw + ov, yr - ye), r0 = a0 - 0.4, r1 = a1 + 0.4;
  B.color('#3a3f47').mat(2);
  B.quad([r0, ye, b0 - ov], [r1, ye, b0 - ov], [r1, yr, bc], [r0, yr, bc], [0, 1, -1], [r0, 0, r1, sl]).quad([r0, ye, b1 + ov], [r1, ye, b1 + ov], [r1, yr, bc], [r0, yr, bc], [0, 1, 1], [r0, 0, r1, sl]);
  B.color(TRIM).mat(0, 0, 1);
  const rf = face < 0 ? r0 : r1;
  for (const be of [b0 - ov, b1 + ov]) B.quad([rf, ye - 0.2, be], [rf, yr - 0.2, bc], [rf, yr, bc], [rf, ye, be], [face, 0, 0]);
  B.box(af + face * 0.04 - 0.02, af + face * 0.04 + 0.02, fl0, eav, b0 - 0.03, b0 + 0.15, fk).box(af + face * 0.04 - 0.02, af + face * 0.04 + 0.02, fl0, eav, b1 - 0.15, b1 + 0.03, fk);
  // the boat door (two leaves, white axes) and the small window over it
  B.box(af + face * 0.05 - 0.02, af + face * 0.05 + 0.02, fl0, fl0 + 2.3, bc - 1.6, bc + 1.6, fk);
  B.color('#5e1b16', tone).mat(8, 0, 2).box(af + face * 0.08 - 0.02, af + face * 0.08 + 0.02, fl0, fl0 + 2.15, bc - 1.45, bc + 1.45, fk);
  B.mat(0).window([af, eav + 0.95, bc], [face, 0, 0], 0.8, 0.8, 22);
  // the stilts: three rows of three, down under the water
  B.color('#3b2f26');
  for (const sa of [a0 + 0.3, (a0 + a1) / 2, a1 - 0.3]) for (const sb of [b0 + 0.3, bc, b1 - 0.3]) B.tube([sa, fl0 - 0.2, sb], [sa, -1.4, sb], 0.11, 0.11, 5, true);
  B.end();
}
PIECES.push((B, T) => {
  const H = T.boathouses;
  B.chunk('boathouses-east');
  for (const k of H.slots) boathouse(B, T, H.a0, H.a1, slotB(T, k), -1, 'boathouse ' + k);
  B.chunk('boathouses-west');
  for (let i = 0; i < H.westN; i++) boathouse(B, T, H.westA0, H.westA1, H.westB0 + i * T.pitch, 1, 'west boathouse ' + i, 1.45);   // (a fresher red: they are seen against the lamp)
});
// END-OF-BOATHOUSES

// AN EMPTY DRYING RACK: an A-axes of poles (a ridge on trestles, long rails down both slopes), nothing hung on it.
// ITS LOGS ARE A REAL RACK'S (the world's own sizes, typed here): the trestles' legs 20 cm across at the foot and
// 18 at the head, the ridge log 18, the ties across the trestles and the long rails 12. (They were 14, 12, 14, 10
// and 9: under the thin-member law, which gives a member only the cover it truly has, the racks across the basin
// read as a faint lattice; the mend is in the body, as a rack is built, never in the pixel's law.)
// p, q = the ridge's two ends as [a, b]; y0 = the ground it stands on.
function rack(B, p, q, y0, name, H = 5.2, half = 2.4, rails = 6) {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, n = Math.max(2, Math.round(L / 2.8));
  const at = (t, s, y) => [p[0] + ux * t + nx * s, y, p[1] + uz * t + nz * s];
  B.body(name, 'rack').color('#8a7a66').mat(0);
  for (let i = 0; i <= n; i++) { const t = (i / n) * L;
    for (const sd of [-1, 1]) B.tube(at(t, sd * half, y0), at(t, 0, y0 + H), 0.10, 0.09, 4, true);
    B.tube(at(t, -half * 0.52, y0 + H * 0.48), at(t, half * 0.52, y0 + H * 0.48), 0.06, 0.06, 4, true); }
  B.color('#9a8b76').tube(at(-0.4, 0, y0 + H), at(L + 0.4, 0, y0 + H), 0.09, 0.09, 4, true);
  for (let j = 1; j <= rails; j++) { const f = j / (rails + 1.2), s = half * (1 - f), y = y0 + H * f;
    for (const sd of [-1, 1]) B.tube(at(-0.3, sd * s, y), at(L + 0.3, sd * s, y), 0.06, 0.06, 4, true); }
  B.end();
}
// A GULL THAT SITS (a body of the town, all alike): white, grey-backed, yellow-billed, facing along (fa, fb)
function gull(B, a, y, b, fa, fb) {
  const P = (f, h, s) => [a + fa * f - fb * s, y + h, b + fb * f + fa * s];
  B.color('#f4f3ee').mat(0).tube(P(-0.2, 0.17, 0), P(0.12, 0.2, 0), 0.07, 0.085, 5).tube(P(0.12, 0.2, 0), P(0.19, 0.3, 0), 0.085, 0.05, 5);
  B.lathe(P(0.2, 0, 0)[0], P(0.2, 0, 0)[2], [[0.0, y + 0.27], [0.055, y + 0.33], [0.0, y + 0.385]], 5);
  B.color('#9aa3ab').tube(P(-0.26, 0.2, 0), P(0.08, 0.24, 0), 0.03, 0.078, 4).color('#2c2e30').tube(P(-0.36, 0.2, 0), P(-0.24, 0.21, 0), 0.012, 0.035, 4);
  B.color('#e2b21f').tube(P(0.24, 0.335, 0), P(0.315, 0.325, 0), 0.016, 0.004, 4);
  B.color('#d99a2b'); for (const s of [-0.03, 0.03]) B.tube(P(0, 0.12, s), P(0.01, 0, s), 0.008, 0.008, 4, true);
}
// a rail of white posts and two bars from p to q ([a, b]) on a top at y0, with gulls sitting evenly along it
function railWithGulls(B, p, q, y0, every, name, env) {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, n = Math.round(L / 2.4);
  B.body(name, 'rail').color('#ecebe4').mat(0);
  for (let i = 0; i <= n; i++) { const t = (i / n) * L; B.tube([p[0] + ux * t, y0, p[1] + uz * t], [p[0] + ux * t, y0 + 1.05, p[1] + uz * t], 0.04, 0.04, 4, true); }
  for (const h of [0.55, 1.05]) B.tube([p[0], y0 + h, p[1]], [q[0], y0 + h, q[1]], 0.035, 0.035, 4, true);
  B.body(name + ': its gulls', 'gull');
  const step = env.detail >= 0.8 ? every : every * 2;
  for (let t = step / 2; t < L; t += step) gull(B, p[0] + ux * t, y0 + 1.085, p[1] + uz * t, -0.6, -0.8);
  B.end();
}
const railB = (T) => T.mouth - T.moleW / 2 + 0.35;
PIECES.push((B, T) => { const R = T.racks; B.chunk('racks-east'); R.rows.forEach((a, i) => rack(B, [a, R.b0], [a, R.b1], T.quayTop, 'rack ' + i)); });
PIECES.push((B, T, env) => railWithGulls(B, [T.eastHeadA + T.headR + 0.4, railB(T)], [T.rootA - 0.6, railB(T)], T.moleTop, 1.75, 'the east breakwater rail', env));
PIECES.push((B, T) => { B.chunk('racks-west'); T.racks.west.forEach(([a0, a1], i) => rack(B, [a0, T.mouth + 0.4], [a1, T.mouth + 0.4], T.moleTop, 'west rack ' + i)); });
PIECES.push((B, T, env) => railWithGulls(B, [T.westHeadA - T.headR - 0.4, railB(T)], [T.westA - 2.4, railB(T)], T.moleTop, 2.5, 'the west breakwater rail', env));
// END-OF-RACKS

// A MOORED BOAT: an open clinker double-ender, white with a red top strake, a short bare unstayed mast, its sail furled on
// the yard laid along the thwarts, two oars shipped, a line to its buoy. All alike, all at one angle; each rides
// the swell and rocks at its own mooring (the paint's move 1 about its middle; the buoy move 3). No name on it.
function mooredBoat(B, T, ac, bc, phase, name) {
  const Q = T.boats, hd = Q.heading * Math.PI / 180, ch = Math.cos(hd), sh = Math.sin(hd), len = Q.len, hb = 0.92;
  const P = (s, y, f) => [ac + s * ch + f * sh, y, bc - s * sh + f * ch];
  const half = (t) => hb * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.7), sheer = (t) => 0.5 + 0.42 * Math.pow(Math.abs(2 * t - 1), 2.3), keel = (t) => -0.28 + 0.9 * Math.pow(Math.abs(2 * t - 1), 5);
  const NS = 12, NK = 4, ring = (t, inset) => { const f = (t - 0.5) * len, h = Math.max(half(t) - inset, 0), ys = sheer(t), yk = keel(t) + inset * 0.6, out = [];
    for (let k = 0; k <= NK; k++) { const an = (k / NK) * Math.PI / 2; out.push([h * Math.pow(Math.cos(an), 0.6) + (inset ? 0 : 0.02 * (k % 2)), ys + (yk - ys) * Math.pow(Math.sin(an), 1.25), f]); }
    return out; };
  B.body(name, 'boat', T.rock).move(1, ac, bc, phase).mat(0);
  for (let i = 0; i < NS; i++) { const o0 = ring(i / NS, 0), o1 = ring((i + 1) / NS, 0), n0 = ring(i / NS, 0.04), n1 = ring((i + 1) / NS, 0.04);
    for (const sd of [-1, 1]) { const F = (p) => P(p[0] * sd, p[1], p[2]), out = [sd * ch, 0.25, -sd * sh];
      for (let k = 0; k < NK; k++) {
        B.color(k === 0 ? '#9d2f24' : '#efece3', k === 0 ? 1 : 1 - 0.05 * (k % 2)).quad(F(o0[k]), F(o1[k]), F(o1[k + 1]), F(o0[k + 1]), k === NK - 1 ? [sd * ch * 0.3, -1, -sd * sh * 0.3] : out);
        B.color('#c9a56a', 1 - 0.1 * k).quad(F(n0[k]), F(n1[k]), F(n1[k + 1]), F(n0[k + 1]), k === NK - 1 ? [0, 1, 0] : [-sd * ch, 0.4, sd * sh]); }
      B.color('#b98a4e').quad(F([o0[0][0] + 0.03, o0[0][1] + 0.03, o0[0][2]]), F([o1[0][0] + 0.03, o1[0][1] + 0.03, o1[0][2]]), F([n1[0][0] - 0.03, n1[0][1] + 0.03, n1[0][2]]), F([n0[0][0] - 0.03, n0[0][1] + 0.03, n0[0][2]]), [0, 1, 0]); } }
  // stem and stern posts, three thwarts, the bottom boards
  B.color('#7a5632');
  for (const e of [-1, 1]) B.tube(P(0, sheer(0.5 + e * 0.5) + 0.14, e * (len / 2 + 0.02)), P(0, 0.1, e * (len / 2 - 0.34)), 0.05, 0.06, 5);
  const bx = (s0, s1, y0, y1, f0, f1) => { const c = [P(s0, y1, f0), P(s1, y1, f0), P(s1, y1, f1), P(s0, y1, f1)], d = [P(s0, y0, f0), P(s1, y0, f0), P(s1, y0, f1), P(s0, y0, f1)];
    B.quad(c[0], c[1], c[2], c[3], [0, 1, 0]).quad(d[0], d[1], c[1], c[0], [-sh, 0, -ch]).quad(d[3], d[2], c[2], c[3], [sh, 0, ch]); };
  B.color('#b98a4e'); for (const f of [-1.5, 0.1, 1.5]) { const h = half(f / len + 0.5) - 0.05; bx(-h, h, 0.3, 0.34, f - 0.12, f + 0.12); }
  B.color('#a8834f', 0.85); bx(-0.5, 0.5, -0.02, 0.0, -1.9, 1.9);
  // the mast, the furled sail on its yard along the thwarts, the oars
  B.color('#b08a55').tube(P(0, 0.05, 0.1), P(0, 0.3 + Q.mast, 0.1), 0.06, 0.04, 6, true);
  B.color('#9a7a4a').tube(P(0.22, 0.4, -2.0), P(0.16, 0.62, 2.1), 0.035, 0.035, 5, true);
  B.color('#c5a876'); for (let i = 0; i < 4; i++) { const f0 = -1.7 + i * 0.9, r0 = i === 0 ? 0.07 : 0.12, r1 = i === 3 ? 0.07 : 0.12; B.tube(P(0.22 - 0.015 * i, 0.4 + 0.052 * (f0 + 2) - 0.04, f0), P(0.22 - 0.015 * (i + 1), 0.4 + 0.052 * (f0 + 2.9) - 0.04, f0 + 0.9), r0, r1, 6); }
  B.color('#8f7046'); for (const sd of [-1, 1]) { B.tube(P(sd * 0.3 - 0.5, 0.38, -1.9), P(sd * 0.36 - 0.5, 0.4, 1.3), 0.022, 0.022, 4, true); }
  // the mooring: a line from the stem to a red buoy that rides the swell ahead of the bow
  B.color('#4a4338').tube(P(0, sheer(1) + 0.05, len / 2), P(0, 0.12, len / 2 + 2.3), 0.012, 0.012, 4, true);
  B.end().move(3, P(0, 0, len / 2 + 2.5)[0], P(0, 0, len / 2 + 2.5)[2], phase).body(name + ': its buoy', 'buoy', 0.4);
  const bu = P(0, 0, len / 2 + 2.5);
  B.color('#d8482a').lathe(bu[0], bu[2], [[0.0, -0.2], [0.2, -0.08], [0.2, 0.08], [0.0, 0.24]], 8).end().move(0);
}
// (where in its rocking a boat begins is a die of the town's clock stream, drawn before anything is built: env.clock.boats)
for (let s0 = 0; s0 < 4; s0++) PIECES.push((B, T, env) => { const Q = T.boats; if (s0 === 0) B.chunk('boats-starboard');
  for (let i = Q.n - 1 - s0 * 2; i > Q.n - 3 - s0 * 2 && i >= 0; i--) mooredBoat(B, T, Q.a, Q.b0 + i * T.pitch, env.clock.boats[i], 'boat s' + i); });
for (let s0 = 0; s0 < 5; s0++) PIECES.push((B, T, env) => { const Q = T.boats; if (s0 === 0) B.chunk('boats-port');
  for (let i = Q.portN - 1 - s0 * 2; i > Q.portN - 3 - s0 * 2 && i >= 0; i--) mooredBoat(B, T, Q.portA, Q.portB0 + i * T.pitch, env.clock.boats[Q.n + i], 'boat p' + i); });
// END-OF-BOATS

// THE QUAY'S DRESS, all alike and evenly spaced: a lamp post at every gap between two houses, a bollard every half
// pitch, barrels in threes and a net heap with its floats by turns at the posts, and on the breakwater the pole
// with its plain red pennant (the paint's move 2: it flies by the clock). Nothing lettered on any of it.
for (let s0 = 0; s0 < 3; s0++) PIECES.push((B, T, env) => {
  const g = T.quayTop, Pp = T.posts, n = T.slots + 1, b0 = T.slot0 + T.pitch / 2;
  if (s0 === 0) B.chunk('dress');
  for (let j = n - 1 - s0 * 7; j > n - 8 - s0 * 7 && j >= 0; j--) { const a = Pp.a, b = b0 + j * T.pitch, top = g + Pp.h;
    B.body('lamp post ' + j, 'post').color('#23302b').mat(0).lathe(a, b, [[0.16, g], [0.13, g + 0.5], [0.075, g + 0.7]], 6).tube([a, g + 0.6, b], [a, top - 0.55, b], Pp.r, Pp.r * 0.8, 5, true);
    B.lathe(a, b, [[0.06, top - 0.6], [0.2, top - 0.5], [0.24, top], [0.0, top + 0.22]], 6);                                   // the lantern's axes and cap
    B.color('#d8dccf').mat(0, 0, 1).lathe(a, b, [[0.19, top - 0.47], [0.225, top - 0.04]], 6);                                 // its glass (unlit by day)
    if (j % 2 === 0 && env.detail >= 0.8) {                                                                                    // barrels in threes
      B.body('barrels ' + j, 'dress');
      for (const [da, db] of [[1.5, -0.42], [1.5, 0.42], [2.24, 0]]) { const x = a + da, z = b + db;
        B.color('#8a6238').mat(0).lathe(x, z, [[0.27, g], [0.34, g + 0.28], [0.34, g + 0.62], [0.27, g + 0.9]], 10).disc(x, g + 0.9, z, 0.27, 10);
        B.color('#2e2a26').mat(0, 0, 1).lathe(x, z, [[0.325, g + 0.16], [0.345, g + 0.23]], 10).lathe(x, z, [[0.345, g + 0.67], [0.325, g + 0.74]], 10); }
    } else if (j % 2 === 1 && env.detail >= 0.8) {                                                                             // a net heap and its floats
      B.body('nets ' + j, 'dress').color('#2f6b62').mat(0).lathe(a + 1.9, b, [[0.95, g], [0.8, g + 0.22], [0.42, g + 0.42], [0.0, g + 0.5]], 10);
      B.color('#e07a2a'); for (let i = 0; i < 5; i++) { const t = i * 1.257; B.lathe(a + 1.9 + Math.cos(t) * 0.55, b + Math.sin(t) * 0.55, [[0.0, g + 0.22], [0.11, g + 0.33], [0.0, g + 0.44]], 6); }
    }
  }
  B.end();
});
PIECES.push((B, T, env) => {
  const g = T.quayTop;
  B.body('the bollards', 'dress').color('#262a2c').mat(0);
  const nb = Math.floor((T.mouth - T.moleW / 2 - T.south) / (T.pitch / 2)), st = env.detail >= 0.8 ? 1 : 2;
  for (let i = 1; i < nb; i += st) B.lathe(T.quayA + 0.5, T.south + i * T.pitch / 2, [[0.15, g], [0.13, g + 0.42], [0.23, g + 0.5], [0.2, g + 0.62], [0.0, g + 0.66]], 8);
  // the pole on the breakwater and its pennant: a long plain red triangle, flying toward the lighthouse
  const Q = T.pole, m = T.moleTop, top = m + Q.h, L = 3.4, N = 14, wa = T.wind[0], wb = T.wind[1];
  B.body('the pennant pole', 'pole', 0.6).color('#f1eee6').mat(0).lathe(Q.a, Q.b, [[0.2, m], [0.16, m + 0.5], [Q.r, m + 0.7]], 6).tube([Q.a, m + 0.6, Q.b], [Q.a, top, Q.b], Q.r, Q.r * 0.6, 6, true);
  B.color('#c9a23a').lathe(Q.a, Q.b, [[0.0, top - 0.02], [0.1, top + 0.08], [0.0, top + 0.2]], 6);
  B.color('#c8281f').mat(7).move(2, Q.a, Q.b, 0);
  for (let i = 0; i < N; i++) { const s0 = (i / N) * L, s1 = ((i + 1) / N) * L, h0 = 0.42 * (1 - s0 / L), h1 = 0.42 * (1 - s1 / L), y = top - 0.55, nr = [-wb, 0, wa];
    const p = (s, h) => [Q.a + wa * (s + 0.08), y + h, Q.b + wb * (s + 0.08)];
    B.vert(p(s0, -h0), nr, 0, 0, null, s0); B.vert(p(s1, -h1), nr, 0, 0, null, s1); B.vert(p(s1, h1), nr, 0, 0, null, s1);
    B.vert(p(s0, -h0), nr, 0, 0, null, s0); B.vert(p(s1, h1), nr, 0, 0, null, s1); B.vert(p(s0, h0), nr, 0, 0, null, s0); }
  B.move(0).end();
});
// THE WASHING LINES: before every fifth house a line between two white poles on the quay, along the front; three
// plain white sheets on each, all alike, broadside to the basin and the lamp, stirring a little by the clock (the
// paint's move 4: a hung cloth swings from its line, the more the lower it hangs). Nothing lettered, only sheets.
PIECES.push((B, T) => {
  const g = T.quayTop, yl = g + 2.15, a = T.frontA - 3.4, half = 2.75, drop = 1.45, rows = 3, nr = [-1, 0, 0];
  for (const k of T.washing) { const bc = slotB(T, k);
    B.body('washing line ' + k, 'dress', 0.35).color('#f1eee6').mat(0);
    for (const sg of [-1, 1]) { const b = bc + sg * half; B.lathe(a, b, [[0.13, g], [0.1, g + 0.4], [0.05, g + 0.55]], 6).tube([a, g + 0.5, b], [a, yl + 0.12, b], 0.05, 0.04, 5, true); }
    B.color('#c9c4b6').tube([a, yl, bc - half], [a, yl, bc + half], 0.012, 0.012, 3, true);
    B.color('#f4f2ea').mat(7);
    for (let i = 0; i < 3; i++) { const b0 = bc - 2.45 + i * 1.7, b1 = b0 + 1.5, P = (b, h) => [a, yl - 0.02 - h, b];
      B.move(4, a, b0, 0);
      for (let r = 0; r < rows; r++) { const h0 = (r / rows) * drop, h1 = ((r + 1) / rows) * drop;
        B.vert(P(b0, h0), nr, 0, 0, null, h0); B.vert(P(b1, h0), nr, 0, 0, null, h0); B.vert(P(b1, h1), nr, 0, 0, null, h1);
        B.vert(P(b0, h0), nr, 0, 0, null, h0); B.vert(P(b1, h1), nr, 0, 0, null, h1); B.vert(P(b0, h1), nr, 0, 0, null, h1); } }
    B.move(0);
  }
  B.end();
});
// END-OF-DRESS

// THE HILL: a hill in the round behind the town's north half, never a board: three rounded tops (the highest to
// the north) joined by saddles, its west foot on the land behind the houses, its east foot in the water. Its skin
// is painted by its place on the ground (the paint's kind 6: fields, heath above the heath line, rock where it is
// steepest, the path) and lit by its true normals, darker in its hollows. What stands on it is BUILT, all round:
// dry-stone walls on the fields' own lines up to the heath line, a tree by every second field corner, wind-bent
// trees and rock tors on the crest, a stone hut on the middle top's west shoulder, a cairn on the highest.
// hillAt is the one law of its shape: metres over still water at a place of the town's axes.
export const hillAt = (T, a, b) => {
  const H = T.hill, g = T.quayTop, t = Math.min(Math.max((a - H.edge + 2) / 12, 0), 1), base = (g - 0.3) + (-1.9 - (g - 0.3)) * t * t * (3 - 2 * t);
  let s = 0; for (const [ca, cb, r, h] of H.tops) { const d = ((a - ca) * (a - ca) + (b - cb) * (b - cb)) / (r * r); if (d < 1) { const e = h * (1 - d) * (1 - d); s += e * e * e; } }
  return base + Math.cbrt(s) * (1 + 0.1 * Math.sin(a * 0.19 + b * 0.07) + 0.07 * Math.sin(b * 0.23 - a * 0.11 + 1.3));
};
const hillRise = (T, a, b) => hillAt(T, a, b) - hillAt(T, a, -1e4);          // (how far the hill stands over its own foot there)
// the heath line and the path (the paint's kind 6 holds the same laws from the same measures)
const heathAt = (T, a, b) => { const q = T.hill.heath; return q[0] + q[1] * Math.sin(a * q[2] + q[3]) + q[4] * Math.sin(b * q[5] + a * q[6]); };
const pathB = (T, a) => { const q = T.hill.path, ps = Math.min(Math.max((a - q.a0) / (q.a1 - q.a0), 0), 1); return q.b - q.fall * ps + q.sway * Math.sin(ps * q.turns); };
// (a field's ground: on the hill, over the water, under the heath line, and not on the path)
const onField = (T, a, b) => { const P = T.hill.path, y = hillAt(T, a, b);
  return hillRise(T, a, b) > 0.8 && y > 0.7 && y < heathAt(T, a, b) - 0.6 && !(a > P.a0 - 1 && a < P.a1 + 1 && Math.abs(b - pathB(T, a)) < 1.8); };
// a wind-bent tree: a leaning stem and a round crown drawn out a little to leeward (six sides, four bands)
function bentTree(B, T, a, b, k, size = 1) {
  const y = hillAt(T, a, b), wa = T.wind[0], wb = T.wind[1], sc = size * (0.85 + 0.3 * ((k * 5) % 4) / 3), top = [a + wa * 0.5 * sc, y + 2.0 * sc, b + wb * 0.5 * sc];
  B.color('#3a2c20').mat(0).tube([a, y - 0.3, b], top, 0.13 * sc, 0.09 * sc, 4, true);
  const c = [a + wa * 1.0 * sc, y + 3.2 * sc, b + wb * 1.0 * sc], N = 6, rings = [[0.0, -1.0], [0.8, -0.55], [1.0, 0.1], [0.6, 0.72], [0.0, 1.0]];
  const P = (j, i) => { const an = (i / N) * 2 * Math.PI, cx = Math.cos(an), sx = Math.sin(an), rr = rings[j][0], along = cx * (cx > 0 ? 2.0 : 1.3) * rr * sc, across = sx * 1.6 * rr * sc;
    return [c[0] + wa * along - wb * across, c[1] + rings[j][1] * 1.6 * sc, c[2] + wb * along + wa * across]; };
  for (let j = 0; j < 4; j++) for (let i = 0; i < N; i++) { const p0 = P(j, i), p1 = P(j, i + 1), p2 = P(j + 1, i + 1), p3 = P(j + 1, i), out = [(p0[0] + p2[0]) / 2 - c[0], (p0[1] + p2[1]) / 2 - c[1] + 0.3, (p0[2] + p2[2]) / 2 - c[2]];
    B.color(i % 2 ? '#24542a' : '#2f642c', 0.85 + 0.12 * j);
    if (j > 0) B.tri(p0, p1, p2, out); if (j < 3) B.tri(p0, p2, p3, out); }
}
// a run of dry-stone wall over the ground from p to q (a, b): 0.7 m thick, 1.05 m high, its foot let into the turf
function wallRun(B, T, p, q, k) {
  const da = q[0] - p[0], db = q[1] - p[1], l = Math.hypot(da, db) || 1, sa = -db / l * 0.35, sb = da / l * 0.35, d = 0.35, h = 1.05 + d;
  const y0 = hillAt(T, p[0], p[1]) - d, y1 = hillAt(T, q[0], q[1]) - d;
  const L0 = [p[0] - sa, y0, p[1] - sb], L1 = [q[0] - sa, y1, q[1] - sb], R0 = [p[0] + sa, y0, p[1] + sb], R1 = [q[0] + sa, y1, q[1] + sb], up = (v) => [v[0], v[1] + h, v[2]];
  B.color('#8f8b83', 0.86 + 0.07 * ((k * 3) % 5));
  B.quad(L0, L1, up(L1), up(L0), [-sa, 0, -sb], [0, 0, l, h]).quad(R0, R1, up(R1), up(R0), [sa, 0, sb], [0, 0, l, h]).quad(up(L0), up(L1), up(R1), up(R0), [0, 1, 0], [0, 0, l, 0.7]);
}
// a rough lump of rock about (a, b), its foot at y: five uneven sides, a shoulder and a head, every face flat
function torRock(B, a, y, b, r, h, i) {
  const N = 5, foot = [], sh = [], head = [a + r * 0.15, y + h, b - r * 0.1], mid = [a, y + h * 0.4, b];
  for (let j = 0; j <= N; j++) { const an = ((j % N) / N + 0.07 * i) * 2 * Math.PI, c = Math.cos(an), s = Math.sin(an), r0 = r * (1 + 0.25 * Math.sin(i * 1.7 + (j % N) * 2.1)), r1 = r * 0.66 * (1 + 0.3 * Math.sin(i * 2.3 + (j % N) * 1.3));
    foot.push([a + c * r0, y, b + s * r0]); sh.push([a + c * r1, y + h * (0.62 + 0.2 * Math.sin((j % N) * 1.9 + i)), b + s * r1]); }
  for (let j = 0; j < N; j++) { const out = [(foot[j][0] + foot[j + 1][0]) / 2 - mid[0], 0.3, (foot[j][2] + foot[j + 1][2]) / 2 - mid[2]];
    B.tri(foot[j], foot[j + 1], sh[j + 1], out).tri(foot[j], sh[j + 1], sh[j], out).tri(sh[j], sh[j + 1], head, [out[0], 2, out[2]]); }
}
// the skin, in four build steps (strips from the south to the north): a grid of H.cell metres, every node worked out once
for (let strip = 0; strip < 4; strip++) PIECES.push((B, T) => {
  const H = T.hill, st = H.cell, na = Math.round((H.a1 - H.a0) / st), nb = Math.round((H.b1 - H.b0) / st), e = 2, j0 = Math.round(nb * strip / 4), j1 = Math.round(nb * (strip + 1) / 4), node = new Map();
  if (!strip) B.chunk('hills');
  B.body(strip ? 'the hill: strip ' + (strip + 1) : 'the hill', 'hill').mat(6, 0);
  const V = (i, j) => { const key = i * 1000 + j; let v = node.get(key); if (v) return v;
    const a = H.a0 + i * st, b = H.b0 + j * st, h = hillAt(T, a, b), ha = hillAt(T, a + e, b) - hillAt(T, a - e, b), hb = hillAt(T, a, b + e) - hillAt(T, a, b - e), l = Math.hypot(ha, 2 * e, hb);
    const lap = (hillAt(T, a + st, b) + hillAt(T, a - st, b) + hillAt(T, a, b + st) + hillAt(T, a, b - st) - 4 * h) / (st * st), rise = hillRise(T, a, b), up = Math.min(Math.max(rise / 30, 0), 1);
    v = { p: [a, h, b], n: [-ha / l, 2 * e / l, -hb / l], rise, sh: 0.8 + 0.28 * up - Math.min(Math.max(lap * 2.2, 0), 0.26) }; node.set(key, v); return v; };
  const put = (v) => { B.tone([v.sh, v.sh, v.sh]); B.vert(v.p, v.n, v.p[0], v.p[2]); };
  for (let i = 0; i < na; i++) for (let j = j0; j < j1; j++) {
    const v00 = V(i, j), v10 = V(i + 1, j), v11 = V(i + 1, j + 1), v01 = V(i, j + 1);
    if (Math.max(v00.rise, v10.rise, v11.rise, v01.rise) < 0.12) continue;                                                   // (where there is no hill the land is the land)
    put(v00); put(v11); put(v10); put(v00); put(v01); put(v11);
  }
  B.end();
});
// END-OF-HILL-SKIN
// the built walls: on the fields' own lines (the paint's: a ladder runs along the bay, a rung across it), in runs of
// 3 m (6 m when thinned), wherever the ground is a field's; a gap where the path goes through
for (let rungs = 0; rungs < 2; rungs++) PIECES.push((B, T, env) => {
  const H = T.hill, F = H.field, st = env.detail < 0.8 ? 6 : 3, half = 0.35;
  B.body(rungs ? "the hill's walls across" : "the hill's walls along", 'hill').mat(4);
  const line = rungs ? (m, a) => [a, F[1] * (m + half / F[1] - F[4] * Math.sin(a * F[5]))] : (n, b) => [F[0] * (n + half / F[0] - F[2] * Math.sin(b * F[3])), b];
  const [n0, n1, t0, t1] = rungs ? [Math.floor(H.b0 / F[1]), Math.ceil(H.b1 / F[1]), H.a0, H.a1] : [Math.floor(H.a0 / F[0]), Math.ceil(H.a1 / F[0]), H.b0, H.b1];
  for (let n = n0; n <= n1; n++) for (let t = t0, k = 0; t < t1; t += st, k++) {
    const p = line(n, t), q = line(n, t + st);
    if (onField(T, p[0], p[1]) && onField(T, q[0], q[1]) && onField(T, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2)) wallRun(B, T, p, q, n * 7 + k);
  }
  B.end();
});
// the trees, the hut, the cairn, the tors (typed places on the crest and the shoulders; a tree's is its field's corner)
const CREST_TREES = [[84, 106], [88, 154], [95, 139], [107, 178], [113, 189], [117, 209], [128, 196], [106, 146], [96, 104], [132, 214]];
const TORS = [[88, 100, 2.2, 2.6], [84, 114, 1.6, 1.8], [94, 136, 2.4, 3.0], [100, 162, 1.8, 2.2], [112, 184, 2.6, 3.2], [116, 212, 2.0, 2.4], [126, 190, 1.7, 2.0]];
PIECES.push((B, T, env) => {
  const H = T.hill, F = H.field; let k = 0;
  B.body("the hill's trees", 'hill');
  for (let n = Math.floor(H.a0 / F[0]); n <= Math.ceil(H.a1 / F[0]); n++) for (let m = Math.floor(H.b0 / F[1]); m <= Math.ceil(H.b1 / F[1]); m++) {
    if ((n + m) % 2) continue;                                             // every second corner
    let a = F[0] * n, b = F[1] * m; for (let it = 0; it < 6; it++) { a = F[0] * (n - F[2] * Math.sin(b * F[3])); b = F[1] * (m - F[4] * Math.sin(a * F[5])); }
    a += 2.4; b += 2.4;                                                    // (stood into its field, clear of the walls)
    if (!onField(T, a, b) || hillRise(T, a, b) < 5) continue;
    if (env.detail >= 0.8 || k % 2 === 0) bentTree(B, T, a, b, k, 1.35); k++;
  }
  CREST_TREES.forEach(([a, b], i) => { if (env.detail >= 0.8 || i % 2 === 0) bentTree(B, T, a, b, i + 3, 1.1); });
  B.end().body("the hill's hut, cairn and tors", 'hill');
  // the stone hut on the middle top's west shoulder: its long side to the basin, gables north and south, a turf roof, a plank door
  const [ha, hb] = H.tops[0], x0 = ha - 8.6, x1 = ha - 5.0, xm = (x0 + x1) / 2, z0 = hb - 2.6, z1 = hb + 2.6, y0 = hillAt(T, x0, hb) - 0.4, ye = y0 + 2.7, yr = ye + 1.3;
  B.color('#8d8a84').mat(4).box(x0, x1, y0, ye, z0, z1, 'wesn').tri([x0, ye, z0], [x1, ye, z0], [xm, yr, z0], [0, 0, -1]).tri([x0, ye, z1], [x1, ye, z1], [xm, yr, z1], [0, 0, 1]);
  B.color('#4a5a30').mat(0).quad([x0 - 0.25, ye - 0.15, z0 - 0.3], [x0 - 0.25, ye - 0.15, z1 + 0.3], [xm, yr + 0.12, z1 + 0.3], [xm, yr + 0.12, z0 - 0.3], [-1, 1, 0]);
  B.quad([x1 + 0.25, ye - 0.15, z0 - 0.3], [x1 + 0.25, ye - 0.15, z1 + 0.3], [xm, yr + 0.12, z1 + 0.3], [xm, yr + 0.12, z0 - 0.3], [1, 1, 0]);
  B.color('#4a3423').mat(8, 0, 1).quad([x0 - 0.03, y0 + 0.5, hb - 0.5], [x0 - 0.03, y0 + 0.5, hb + 0.5], [x0 - 0.03, y0 + 2.3, hb + 0.5], [x0 - 0.03, y0 + 2.3, hb - 0.5], [-1, 0, 0], [0, 0, 1, 1.8]);
  // the cairn on the highest top; the tors: two rough lumps of rock each, let into the ground
  const [ca, cb] = H.tops[1], cy = hillAt(T, ca, cb) - 0.2;
  B.color('#8f8c86').mat(9).lathe(ca, cb, [[1.5, cy], [1.0, cy + 1.6], [0.45, cy + 2.7], [0.0, cy + 3.2]], 6);
  TORS.forEach(([a, b, r, h], i) => { const a2 = a + r * 1.1, b2 = b - r * 0.8;
    B.color('#7d7a74', 0.9 + 0.06 * (i % 3)); torRock(B, a, hillAt(T, a, b) - 0.5, b, r, h + 0.5, i); torRock(B, a2, hillAt(T, a2, b2) - 0.4, b2, r * 0.62, h * 0.55 + 0.4, i + 4); });
  B.end();
});
// END-OF-HILLS

// THE SHORE'S ROCK: smooth grey slabs lying along the point's two sea faces and at the feet of the two heads on
// their sea side (the paint's kind 9). Placed and shaped by a typed law of their number, never by a draw.
function rock(B, a, b, ra, rb, h, key) {
  const N = 9, ring = (j, i) => { const t = (i / N) * 2 * Math.PI + key, w = 1 + 0.2 * Math.sin(key * 7.1 + i * 2.3 + j * 1.9), e = [1.12, 1.0, 0.72, 0.36][j], y = [-1.6, 0.18 * h, 0.72 * h, 0.96 * h][j];
    return [a + Math.cos(t) * ra * e * w, y, b + Math.sin(t) * rb * e * w]; };
  for (let j = 0; j < 3; j++) for (let i = 0; i < N; i++) { const p = ring(j, i), q = ring(j, i + 1), p1 = ring(j + 1, i), q1 = ring(j + 1, i + 1), out = [(p[0] + q[0]) / 2 - a, 0.5 * ra, (p[2] + q[2]) / 2 - b];
    B.tri(p, q, q1, out).tri(p, q1, p1, out); }
  for (let i = 0; i < N; i++) B.tri(ring(3, i), ring(3, i + 1), [a, h, b], [0, 1, 0]);
}
PIECES.push((B, T) => {
  const g = T.quayTop, m = T.moleTop, hw = T.moleW / 2;
  B.chunk('shore').body('the point\'s rocks', 'rock').mat(9);
  for (let i = 0; i < 9; i++) { const b = T.mouth + hw + 4 + i * 6.2, k = 1.3 + i * 2.7; B.color('#8b8782', 0.9 + 0.2 * Math.abs(Math.sin(k))); rock(B, T.rootA - 1.5 - 2.5 * Math.abs(Math.sin(k * 1.9)), b, 5.5 + 2 * Math.sin(k), 4.6 + 1.5 * Math.cos(k * 1.3), g + 0.5 + 1.1 * Math.abs(Math.sin(k * 0.7)), k); }
  for (let i = 0; i < 12; i++) { const a = T.rootA + 3 + i * 7.2, k = 4.1 + i * 3.3; B.color('#8b8782', 0.9 + 0.2 * Math.abs(Math.sin(k))); rock(B, a, T.northB + 1.5 + 2.5 * Math.abs(Math.sin(k * 1.9)), 5.2 + 1.6 * Math.cos(k), 5.4 + 2 * Math.sin(k * 0.8), g + 0.4 + 1.2 * Math.abs(Math.sin(k * 0.7)), k); }
  B.body('the east head\'s rocks', 'rock');
  for (let i = 0; i < 5; i++) { const t = 0.15 + i * 0.55, k = 2.2 + i * 1.9; B.color('#85817c', 0.9 + 0.2 * Math.abs(Math.sin(k))); rock(B, T.eastHeadA + Math.cos(t) * (T.headR + 1.1), T.mouth + Math.sin(t) * (T.headR + 1.1) + 0.6, 2.6 + 0.6 * Math.sin(k), 2.2 + 0.5 * Math.cos(k), 0.9 + 0.7 * Math.abs(Math.sin(k * 0.7)), k); }
  B.chunk('shore-west').body('the west head\'s rocks', 'rock');
  for (let i = 0; i < 5; i++) { const t = 0.4 + i * 0.55, k = 5.2 + i * 1.9; B.color('#85817c', 0.9 + 0.2 * Math.abs(Math.sin(k))); rock(B, T.westHeadA + Math.cos(t) * (T.headR + 1.1), T.mouth + Math.sin(t) * (T.headR + 1.1) + 0.6, 2.6 + 0.6 * Math.sin(k), 2.2 + 0.5 * Math.cos(k), 0.9 + 0.7 * Math.abs(Math.sin(k * 0.7)), k); }
  B.end();
});
// END-OF-SHORE
