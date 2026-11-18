// hill-of-round-doors, the field builder's part: the small helpers every piece of the field shares (plain vectors, two
// geometry accumulators and a few shapes). Nothing here draws from the seed: a caller hands its own stream in.
export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const sat = (x) => clamp(x, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vscale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const vmad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
export const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const vlen = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
export const vnorm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mix3 = vlerp;
export const mul3 = vscale;
export function perp(t) { const a = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; return vnorm(vcross(a, t)); }
// v turned about the unit axis k by the angle a
export function vrot(v, k, a) {
  const c = Math.cos(a), s = Math.sin(a), d = vdot(k, v) * (1 - c), x = vcross(k, v);
  return [v[0] * c + x[0] * s + k[0] * d, v[1] * c + x[1] * s + k[1] * d, v[2] * c + x[2] * s + k[2] * d];
}
// a colour in any form THREE.Color takes, as linear [r, g, b]
export function lin(THREE, c) { if (Array.isArray(c)) return c; const k = c && c.isColor ? c : new THREE.Color(c); return [k.r, k.g, k.b]; }

// The kinds of surface the field's one solid material draws (the fourth number of a vertex's `surf`).
export const KIND = { plain: 0, stone: 1, planks: 2, tiles: 3, bark: 4, cloth: 5, crust: 6, thatch: 7 };

// SOLID: things made of stone, wood, cloth and bark. Each vertex: place, normal, colour and `surf` = (u, v in metres
// across the surface for the pattern, the kind of surface, the lantern light that falls there: filled in at build()).
export class Solid {
  constructor() { this.p = []; this.n = []; this.c = []; this.s = []; this.i = []; this.count = 0; this.f = null; }
  // a frame for what follows: a place and a turn about y (null: none)
  frame(x, y, z, yaw = 0) { this.f = x === null ? null : [x, y, z, Math.cos(yaw), Math.sin(yaw)]; return this; }
  v(p, n, c, u = 0, w = 0, kind = 0) {
    const f = this.f;
    if (f) { this.p.push(f[0] + p[0] * f[3] + p[2] * f[4], f[1] + p[1], f[2] - p[0] * f[4] + p[2] * f[3]); this.n.push(n[0] * f[3] + n[2] * f[4], n[1], -n[0] * f[4] + n[2] * f[3]); }
    else { this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); }
    this.c.push(c[0], c[1], c[2]); this.s.push(u, w, kind, 0);
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  get triangles() { return this.i.length / 3; }
  // a flat face a, b, c, d (counter-clockwise seen from outside); the pattern runs in metres along a->b (u) and a->d (v).
  // col: one colour, or a function of a corner's place.
  face(a, b, c, d, col, kind = 0, u0 = 0, v0 = 0) {
    const n = vnorm(vcross(vsub(b, a), vsub(d, a))), lu = vlen(vsub(b, a)), lv = vlen(vsub(d, a)), k = typeof col === 'function' ? col : () => col;
    const i0 = this.v(a, n, k(a), u0, v0, kind), i1 = this.v(b, n, k(b), u0 + lu, v0, kind), i2 = this.v(c, n, k(c), u0 + lu, v0 + lv, kind), i3 = this.v(d, n, k(d), u0, v0 + lv, kind);
    this.quad(i0, i1, i2, i3);
  }
  // a flat face whose pattern coordinates come from each corner's place (uvOf(p) -> [u, v]), so that courses run on
  // unbroken from face to face
  faceW(a, b, c, d, col, kind, uvOf) {
    const n = vnorm(vcross(vsub(b, a), vsub(d, a))), k = typeof col === 'function' ? col : () => col, q = [a, b, c, d].map((p) => { const t = uvOf(p); return this.v(p, n, k(p), t[0], t[1], kind); });
    this.quad(q[0], q[1], q[2], q[3]);
  }
  // a triangle face with its own pattern coordinates
  tface(a, b, c, col, kind = 0, uv = null) {
    const n = vnorm(vcross(vsub(b, a), vsub(c, a))), k = typeof col === 'function' ? col : () => col, lu = vlen(vsub(b, a));
    const e = vnorm(vsub(b, a)), q = vsub(c, a), cu = vdot(q, e), cv = vlen(vsub(q, vscale(e, cu)));
    const t = uv || [[0, 0], [lu, 0], [cu, cv]];
    this.tri(this.v(a, n, k(a), t[0][0], t[0][1], kind), this.v(b, n, k(b), t[1][0], t[1][1], kind), this.v(c, n, k(c), t[2][0], t[2][1], kind));
  }
  // a box between two corners (lo, hi); faces: which of the six to draw ('xXyYzZ': low x, high x, ...)
  box(lo, hi, col, kind = 0, faces = 'xXyYzZ') {
    const [x0, y0, z0] = lo, [x1, y1, z1] = hi;
    if (faces.includes('Z')) this.face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, kind);
    if (faces.includes('z')) this.face([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, kind);
    if (faces.includes('X')) this.face([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, kind);
    if (faces.includes('x')) this.face([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, kind);
    if (faces.includes('Y')) this.face([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, kind);
    if (faces.includes('y')) this.face([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, kind);
  }
  // a beam of square section w x h from a to b (any direction), its pattern along its length
  beam(a, b, w, h, col, kind = 0, up = [0, 1, 0]) {
    const t = vnorm(vsub(b, a)); let s = vcross(t, up); if (vlen(s) < 1e-4) s = perp(t); s = vnorm(s); const u = vnorm(vcross(s, t));
    const c = (p, i, j) => vadd(p, vadd(vscale(s, i * w / 2), vscale(u, j * h / 2)));
    this.face(c(a, -1, 1), c(a, 1, 1), c(b, 1, 1), c(b, -1, 1), col, kind); this.face(c(a, 1, -1), c(a, -1, -1), c(b, -1, -1), c(b, 1, -1), col, kind);
    this.face(c(a, 1, 1), c(a, 1, -1), c(b, 1, -1), c(b, 1, 1), col, kind); this.face(c(a, -1, -1), c(a, -1, 1), c(b, -1, 1), c(b, -1, -1), col, kind);
    this.face(c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1), col, kind); this.face(c(b, 1, -1), c(b, -1, -1), c(b, -1, 1), c(b, 1, 1), col, kind);
  }
}

// A round limb through pts with a radius at each: the pattern's u runs round it (metres), its v along it (metres).
// o: { sides, col(t, k, ang, p) | c0, c1, kind, seam: a hint for where the pattern's seam lies (a direction), cap,
//      flute(ang, t) -> radius multiplier, v0: the pattern's start along the limb }
export function limb(G, pts, rad, o = {}) {
  const sides = o.sides || 6, n = pts.length, kind = o.kind ?? KIND.bark, c0 = o.c0 || [0.3, 0.2, 0.1], c1 = o.c1 || c0;
  let nrm = null, along = o.v0 || 0, prev = null; const rmean = rad.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tan = vnorm(vsub(b, a));
    if (!nrm) { const h = o.seam || [0, 1, 0]; nrm = vsub(h, vscale(tan, vdot(h, tan))); nrm = vlen(nrm) < 1e-3 ? perp(tan) : vnorm(nrm); }
    else { nrm = vsub(nrm, vscale(tan, vdot(nrm, tan))); nrm = vlen(nrm) < 1e-4 ? perp(tan) : vnorm(nrm); }
    const bin = vcross(tan, nrm), t = n > 1 ? i / (n - 1) : 0, r = rad[i];
    if (i > 0) along += vlen(vsub(pts[i], pts[i - 1]));
    const ring = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
      const d = [nrm[0] * ca + bin[0] * sa, nrm[1] * ca + bin[1] * sa, nrm[2] * ca + bin[2] * sa];
      const rr = r * (o.flute ? o.flute(ang, t) : 1), p = vmad(pts[i], d, rr);
      ring.push(G.v(p, d, o.col ? o.col(t, k, ang, p) : mix3(c0, c1, t), (k / sides) * TAU * Math.max(rmean, r * 0.6), along, kind));
    }
    if (prev) for (let k = 0; k < sides; k++) G.quad(prev[k], prev[k + 1], ring[k + 1], ring[k]);
    prev = ring;
  }
  if (o.cap !== false && n > 1) {
    const tan = vnorm(vsub(pts[n - 1], pts[n - 2])), p = vmad(pts[n - 1], tan, rad[n - 1] * 0.6);
    const tip = G.v(p, tan, o.col ? o.col(1, 0, 0, p) : c1, 0, along + rad[n - 1], kind);
    for (let k = 0; k < sides; k++) G.tri(prev[k], prev[k + 1], tip);
  }
}

// A turned form about a vertical axis at `at`: prof is a list of [radius, height]; the pattern's u runs round, v up the
// profile. o: { sides, col(i, k, p) | c, kind, uref: the radius the pattern's u is measured at, squash: [sx, sz] }
export function turned(G, at, prof, o = {}) {
  const sides = o.sides || 10, kind = o.kind ?? KIND.plain, n = prof.length, sq = o.squash || [1, 1];
  let v = 0, prev = null; const uref = o.uref || Math.max(...prof.map((q) => q[0]));
  for (let i = 0; i < n; i++) {
    const [r, y] = prof[i], a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)];
    let ny = -(b[0] - a[0]), nr = b[1] - a[1]; const nl = Math.hypot(ny, nr) || 1; ny /= nl; nr /= nl;
    if (i > 0) v += Math.hypot(r - prof[i - 1][0], y - prof[i - 1][1]);
    const ring = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * TAU, ca = Math.cos(ang), sa = Math.sin(ang), p = [at[0] + ca * r * sq[0], at[1] + y, at[2] + sa * r * sq[1]];
      ring.push(G.v(p, vnorm([ca * nr, ny, sa * nr]), o.col ? o.col(i, k, p) : o.c, (k / sides) * TAU * uref, v, kind));
    }
    if (prev) for (let k = 0; k < sides; k++) G.quad(prev[k + 1], prev[k], ring[k], ring[k + 1]);
    prev = ring;
  }
}

// LEAFY: leaves in the flora kit's own form (place, normal, colour, the leaf atlas's cell, and `wind` = sway in
// metres, flutter, leaf mask, glow), so that the kit's wind material draws them.
export const LEAF_SOLID = [0.875, 0.75];
export class Leafy {
  constructor() { this.p = []; this.n = []; this.c = []; this.w = []; this.t = []; this.i = []; this.count = 0; }
  v(p, n, c, sway = 0, flutter = 0, leaf = 0, tu = LEAF_SOLID[0], tv = LEAF_SOLID[1]) {
    this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0], c[1], c[2]); this.w.push(sway, flutter, leaf, 0); this.t.push(tu, tv);
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  get triangles() { return this.i.length / 3; }
}

// The finished geometry of an accumulator. lampAt(x, y, z) -> the lantern light at a world place (0 and up), read at
// every vertex; at: where the mesh will stand (the accumulator's places are measured from there); gain: leaves only.
export function finish(THREE, G, lampAt = null, at = [0, 0, 0], gain = 1) {
  const g = new THREE.BufferGeometry(), leafy = G instanceof Leafy, four = leafy ? G.w : G.s;
  if (lampAt) for (let i = 0; i < G.count; i++) four[i * 4 + 3] = gain * lampAt(G.p[i * 3] + at[0], G.p[i * 3 + 1] + at[1], G.p[i * 3 + 2] + at[2]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.c, 3));
  if (leafy) { g.setAttribute('wind', new THREE.Float32BufferAttribute(G.w, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(G.t, 2)); }
  else g.setAttribute('surf', new THREE.Float32BufferAttribute(G.s, 4));
  g.setIndex(G.count > 65535 ? new THREE.Uint32BufferAttribute(G.i, 1) : new THREE.Uint16BufferAttribute(G.i, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData = { triangles: G.i.length / 3 };
  return g;
}
