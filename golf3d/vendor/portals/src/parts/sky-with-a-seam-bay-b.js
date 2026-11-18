// SKY WITH A SEAM: THE LIFE OF THE BAY, continued: the makers of the bay's things (called by
// src/parts/sky-with-a-seam-bay.js, which holds the typed places, the paint and the build). Every thing is laid
// with the town's own paint builder (Paint, from sky-with-a-seam-town-b.js; the build hands the makers the bay's
// builder of it, BayPaint, below: the same calls, the same numbers) in a frame of its own: a = metres to
// its right, y up, b = metres ahead of it; the caller sets the frame (frameAt) before it calls a maker. A maker
// also tells what shade it throws (cast: upright blades, by the foot's place, the half width and the height).
// THE MAKERS: the skerry's rock, cabin, boathouse on stilts, rack, cairn, pennant and flagpole, the light, the
// landing stage, the gull, the open boat and the decked boat and what a boat carries (boatDress), the lane mark,
// the spar and the net floats, the lightship, THE GREAT SHIP (greatShip: BARK), THE JETTY and its light (jetty:
// JETTY) and a RAFT of gulls on the water (raft). The big hulls are made in steps (generators: the build rests
// between them). A maker only lays geometry and marks how the paint is to move it (B.move: the kinds are told in
// the paint of sky-with-a-seam-bay.js); nothing here reads the view, a clock or a seed's number, and the only
// draws are for a tone of paint. A maker handed few(n) thins a small count by it: the gulls on a boat, the floats
// along the ochre boat's rail, the gulls on the great ship's yards; nothing else is thinned here.
// Nothing lettered, nobody; the only animal is the gull: it sits, and a raft's gulls lift by the paint's own move.
import { Paint } from './sky-with-a-seam-town-b.js';

export { Paint };
// THE BAY'S BUILDER: the town's paint builder (every maker's call, the bodies, the chunks' names) with the one
// thing a build of the bay's size needs: every vertex is written straight into plain rows of numbers (store: one
// row for each of the mesh's six attributes, all the bay's chunks after one another), not onto lists that grow and
// are copied out afterwards. vert writes the very numbers the town's vert writes (the proof builds with both and
// holds them alike); a chunk is a stretch of the store (start: its first vertex; P.length: three for each of its
// vertices, which is what the town's body, end and triangles count by). rows(c): the chunk's own stretch of each
// row (P: the places as they were worked, in whole precision, for the image's order and the shades' map).
export class BayPaint extends Paint {
  constructor(axes, verts = 1 << 17) { super(axes); this.count = 0; this.store = null; this.hues = new Map(); this.kinds = new Map(); this.tape = null; this.room(verts); }
  // room for so many vertices (the rows are made anew, twice as long, if a build ever outgrows them)
  room(verts) { const old = this.store, s = { verts, P: new Float64Array(verts * 3), N: new Float32Array(verts * 3), C: new Float32Array(verts * 3), M: new Float32Array(verts * 4), A: new Float32Array(verts * 4), V: new Float32Array(verts * 4) };
    if (old) for (const k of ['P', 'N', 'C', 'M', 'A', 'V']) s[k].set(old[k]);
    this.store = s; }
  // (a colour's three numbers are worked out once, by the town's own line, and kept: the makers ask for the same few colours thousands of times)
  color(hex, m = 1) { let c = this.hues.get(hex); if (!c) { super.color(hex); c = this.col; this.hues.set(hex, c); } this.col = [c[0] * m, c[1] * m, c[2] * m]; return this; }
  chunk(name, mirror = true) { this.end(); this.cur = { name, mirror, start: this.count, P: { length: 0 } }; this.chunks.push(this.cur); return this; }
  vert(p, n, u, v, ax, s) {
    if (this.count === this.store.verts) this.room(this.count * 2);
    const f = this.f, S = this.store, i3 = this.count * 3, i4 = this.count * 4, col = this.col, mv = this.mv; this.count++; this.cur.P.length += 3;
    if (this.tape) this.note(p, n, ax, s);
    S.P[i3] = f.ox + p[0] * f.sx + p[2] * f.fx; S.P[i3 + 1] = p[1]; S.P[i3 + 2] = f.oz + p[0] * f.sz + p[2] * f.fz;
    S.N[i3] = n[0] * f.sx + n[2] * f.fx; S.N[i3 + 1] = n[1]; S.N[i3 + 2] = n[0] * f.sz + n[2] * f.fz;
    S.C[i3] = col[0]; S.C[i3 + 1] = col[1]; S.C[i3 + 2] = col[2];
    S.M[i4] = this.kind + 16 * this.lay; S.M[i4 + 1] = u; S.M[i4 + 2] = v; S.M[i4 + 3] = this.par;
    if (ax) { S.A[i4] = f.ox + ax[0] * f.sx + ax[2] * f.fx; S.A[i4 + 1] = ax[1]; S.A[i4 + 2] = f.oz + ax[0] * f.sz + ax[2] * f.fz; S.A[i4 + 3] = ax[3]; }
    S.V[i4] = mv[0]; S.V[i4 + 1] = mv[1]; S.V[i4 + 2] = s === undefined ? mv[2] : s; S.V[i4 + 3] = mv[3];
  }
  // A THING THAT REPEATS (every open boat, every lane mark of one shape) is made once, vertex by vertex as ever,
  // while the builder KEEPS what vert was handed for it, in the thing's own frame (keep(key) before the making,
  // kept() after it); every later one is LAID AGAIN from that (again(key): done if the thing is kept, and says so):
  // vert's own lines on the same numbers, in the frame and with the move that are set then, so the rows hold what
  // the making would have written. A thing is kept only if ONE move held through its making (a later one has its
  // own); the colour and the paint the making left set are set again after it.
  // (the tape, eleven numbers a vertex: the place, the normal, the axis' place, whether it has an axis, whether it was handed its own metres)
  keep(key) { this.tape = { key, from: this.count, mv: this.mv, L: [], one: true }; }
  note(p, n, ax, s) { const t = this.tape; if (this.mv !== t.mv) t.one = false;
    t.L.push(p[0], p[1], p[2], n[0], n[1], n[2], ax ? ax[0] : 0, ax ? ax[1] : 0, ax ? ax[2] : 0, ax ? 1 : 0, s === undefined ? 0 : 1); }
  kept() { const t = this.tape; this.tape = null;
    if (t.one) this.kinds.set(t.key, { from: t.from, n: this.count - t.from, L: new Float64Array(t.L), col: this.col, kind: this.kind, lay: this.lay, par: this.par }); }
  again(key) { const k = this.kinds.get(key); if (!k) return false;
    if (this.count + k.n > this.store.verts) this.room(Math.max(this.count + k.n, this.store.verts * 2));
    for (let j = 0; j < k.n; j += 256) laidAgain(this.store, k.L, this.f, this.mv, k.from, this.count, j, Math.min(j + 256, k.n));
    this.count += k.n; this.cur.P.length += 3 * k.n; this.col = k.col; this.kind = k.kind; this.lay = k.lay; this.par = k.par; return true; }
  rows(c) { const S = this.store, a = c.start, b = a + c.P.length / 3;
    return { P: S.P.subarray(a * 3, b * 3), N: S.N.subarray(a * 3, b * 3), C: S.C.subarray(a * 3, b * 3), M: S.M.subarray(a * 4, b * 4), A: S.A.subarray(a * 4, b * 4), V: S.V.subarray(a * 4, b * 4) }; }
}
// vertices j0 to j1 of a kept thing (its tape L; its own rows from vertex src) laid again from vertex dst on, in
// the frame f and with the move mv: vert's lines. (Asked a short stretch at a time: THE BUILD'S PACE of sky-with-a-seam-bay.js.)
function laidAgain(S, L, f, mv, src, dst, j0, j1) {
  const P = S.P, N = S.N, C = S.C, M = S.M, A = S.A, V = S.V;
  for (let j = j0, l = j0 * 11; j < j1; j++, l += 11) { const s3 = (src + j) * 3, d3 = (dst + j) * 3, s4 = (src + j) * 4, d4 = (dst + j) * 4;
    P[d3] = f.ox + L[l] * f.sx + L[l + 2] * f.fx; P[d3 + 1] = L[l + 1]; P[d3 + 2] = f.oz + L[l] * f.sz + L[l + 2] * f.fz;
    N[d3] = L[l + 3] * f.sx + L[l + 5] * f.fx; N[d3 + 1] = L[l + 4]; N[d3 + 2] = L[l + 3] * f.sz + L[l + 5] * f.fz;
    C[d3] = C[s3]; C[d3 + 1] = C[s3 + 1]; C[d3 + 2] = C[s3 + 2];
    M[d4] = M[s4]; M[d4 + 1] = M[s4 + 1]; M[d4 + 2] = M[s4 + 2]; M[d4 + 3] = M[s4 + 3];
    if (L[l + 9]) { A[d4] = f.ox + L[l + 6] * f.sx + L[l + 8] * f.fx; A[d4 + 1] = L[l + 7]; A[d4 + 2] = f.oz + L[l + 6] * f.sz + L[l + 8] * f.fz; A[d4 + 3] = A[s4 + 3]; }
    V[d4] = mv[0]; V[d4 + 1] = mv[1]; V[d4 + 2] = L[l + 10] ? V[s4 + 2] : mv[2]; V[d4 + 3] = mv[3]; }
}
const TRIM = '#f4f0e6', RED = '#9d2f24', STONE = '#8f8c86', SLATE = '#353b44', TAR = '#3b2f26';
// a frame at a place of the world, its b axis along a bearing (degrees clockwise from north)
export function frameAt(x, z, bearing) {
  const t = bearing * Math.PI / 180, fx = Math.sin(t), fz = -Math.cos(t);
  return { ox: x, oz: z, fx, fz, sx: -fz, sz: fx };
}
// a place of the frame in the world: [x, z]
export const toWorld = (f, a, b) => [f.ox + a * f.sx + b * f.fx, f.oz + a * f.sz + b * f.fz];
// one blade of a thing, for its shade on the water (the bay's law of shades: a thing's outline as the lamp sees
// it): an upright slab at the frame's (a, b), half width w, standing from the water to height h. Every blade is
// the body's OWN HALF WIDTH and no wider (a round member's radius, the mean of its two where it tapers). A member
// whose HALF WIDTH is under a quarter of a metre (one under half a metre through) is THIN: it is kept by itself.
// It throws only its share of shade, as every slab does: the share of the lamp's round it hides, and close under
// it the share of the map's own grain it covers (the bake asks the law softened by half a texel: shadeRingAt).
// A SEE-THROUGH thing (a rack: poles and rails) is a slab that hides only the share its members fill (fill < 1),
// from its own foot (base, metres over the water) up; it is kept by itself too.
export function cast(env, B, a, b, w, h, fill = 1, base = 0) {
  const p = toWorld(B.f, a, b); env.casts.push([p[0], p[1], w, h, w < 0.25 || fill < 1 ? 1 : 0, fill, base]);
}

// ---- A SKERRY'S ROCK: a low rounded islet of pale granite. K: { ra, rb (half sizes along a and b), h (the
// summit), key (its own figure: the lobes of its outline and its knolls), n (sides) }. skerryY is the one law of
// its skin (the makers that stand things on it read the same law).
export function skerryY(K, a, b) {
  const th = Math.atan2(b / K.rb, a / K.ra), w = 1 + 0.1 * Math.sin(3 * th + K.key) + 0.06 * Math.sin(5 * th + 2.3 * K.key);
  const rho = Math.hypot(a / K.ra, b / K.rb) / w;
  if (rho >= 1) return -1.5 * Math.min((rho - 1) / 0.1, 1);
  const knoll = 1 + 0.15 * Math.sin(K.key + a * 0.23) * Math.cos(1.7 * K.key + b * 0.19);
  return K.h * Math.pow(1 - rho * rho, 0.6) * knoll;
}
const RINGS = [1.1, 1.0, 0.95, 0.86, 0.72, 0.54, 0.34, 0.16];
// (The rock in plain rows of numbers: P, its corners, three numbers each, ring after ring and the summit last;
// Nn, their normals; T, its triangles, three corners each. Worked a ring, a stretch of triangles at a time: THE
// BUILD'S PACE of sky-with-a-seam-bay.js.)
export function skerryRock(B, K, env, name) {
  const n = K.n || 28, nr = RINGS.length, top = nr * n, P = new Float64Array((top + 1) * 3), Nn = new Float64Array((top + 1) * 3), T = new Uint16Array(((nr - 1) * 2 + 1) * n * 3);
  for (let j = 0; j < nr; j++) rockRing(K, P, j * n * 3, n, RINGS[j]);
  P[top * 3 + 1] = skerryY(K, 0, 0);
  for (let j = 0; j < nr; j++) rockFaces(T, j, n, nr);
  // smooth normals: every corner takes the sum of the faces round it (all turned upward and outward)
  for (let t = 0; t < T.length; t += 192) rockSums(P, Nn, T, t, Math.min(t + 192, T.length));
  for (let k = 0; k < Nn.length; k += 3) { const l = Math.hypot(Nn[k], Nn[k + 1], Nn[k + 2]) || 1; Nn[k] /= l; Nn[k + 1] /= l; Nn[k + 2] /= l; }
  B.body(name, 'skerry').tone([0.62, 0.61, 0.59], 0.94 + 0.12 * env.rng());
  for (let t = 0; t < T.length; t += 192) rockLaid(B, K.h, P, Nn, T, t, Math.min(t + 192, T.length));
  B.end();
  // its shade: the build lays blades across the lamp's light from this mound (it knows where the lamp stands)
  env.mounds.push({ f: B.f, ra: K.ra, rb: K.rb, h: K.h });
}
// one ring of the rock's corners (rho: how far out of its outline), into P from number o on
function rockRing(K, P, o, n, rho) {
  for (let i = 0; i < n; i++, o += 3) { const th = (i / n) * 2 * Math.PI, w = 1 + 0.1 * Math.sin(3 * th + K.key) + 0.06 * Math.sin(5 * th + 2.3 * K.key);
    const a = Math.cos(th) * K.ra * rho * w, b = Math.sin(th) * K.rb * rho * w; P[o] = a; P[o + 1] = skerryY(K, a, b); P[o + 2] = b; }
}
// the triangles between ring j and the next (two a side), or, from the last ring, to the summit (one a side)
function rockFaces(T, j, n, nr) {
  let t = j * n * 6;
  if (j < nr - 1) for (let i = 0; i < n; i++) { const p = j * n + i, q = j * n + (i + 1) % n, p1 = p + n, q1 = q + n; T[t++] = p; T[t++] = q; T[t++] = q1; T[t++] = p; T[t++] = q1; T[t++] = p1; }
  else for (let i = 0; i < n; i++) { T[t++] = j * n + i; T[t++] = j * n + (i + 1) % n; T[t++] = nr * n; }
}
// the faces of a stretch of triangles, each added to its three corners' sums
function rockSums(P, Nn, T, t0, t1) {
  for (let t = t0; t < t1; t += 3) { const p = T[t] * 3, q = T[t + 1] * 3, r = T[t + 2] * 3;
    const ux = P[q] - P[p], uy = P[q + 1] - P[p + 1], uz = P[q + 2] - P[p + 2], vx = P[r] - P[p], vy = P[r + 1] - P[p + 1], vz = P[r + 2] - P[p + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    Nn[p] += nx; Nn[p + 1] += ny; Nn[p + 2] += nz; Nn[q] += nx; Nn[q + 1] += ny; Nn[q + 2] += nz; Nn[r] += nx; Nn[r + 1] += ny; Nn[r + 2] += nz; }
}
// a stretch of the rock's triangles handed to the builder, corner by corner (its granite paler toward the summit)
function rockLaid(B, h, P, Nn, T, t0, t1) {
  const p = [0.5, 0.5, 0.5], q = [0.5, 0.5, 0.5];
  for (let t = t0; t < t1; t++) { const k = T[t] * 3; p[0] = P[k]; p[1] = P[k + 1]; p[2] = P[k + 2]; q[0] = Nn[k]; q[1] = Nn[k + 1]; q[2] = Nn[k + 2];
    B.mat(10, Math.min(Math.max((p[1] / h - 0.5) * 2.6, 0), 1)); B.vert(p, q, p[0], p[2]); }
}
// END-OF-ROCK

// ---- A RED CABIN with white corner boards: clapboard on a stone footing let into the rock, dark slate, a door in
// the gable toward -a, a white-barred window in each other wall. All alike. yg = the rock's height where it stands.
export function cabin(B, env, ac, bc, yg, name, o = {}) {
  const len = o.len || 5.6, hw = (o.w || 4.4) / 2, a0 = ac - len / 2, a1 = ac + len / 2, b0 = bc - hw, b1 = bc + hw;
  const y0 = yg + 0.35, eav = y0 + (o.eav || 2.3), ridge = eav + hw * 0.8;
  B.body(name, 'cabin');
  B.color(STONE, 1.05).mat(4).box(a0 - 0.08, a1 + 0.08, yg - 1.6, y0, b0 - 0.08, b1 + 0.08, 'wesn');
  B.color(o.wall || RED, 0.97 + 0.06 * env.rng()).mat(1).box(a0, a1, y0, eav, b0, b1, 'wesn');
  for (const [ag, sg] of [[a0, -1], [a1, 1]]) B.tri([ag, eav, b0], [ag, eav, b1], [ag, ridge, bc], [sg, 0, 0], [b0, eav, b1, eav, bc, ridge]);
  const ov = 0.3, og = 0.34, th = 0.12, ye = eav - ov * 0.8 + th, yr = ridge + th, sl = Math.hypot(hw + ov, yr - ye);
  B.color(SLATE, 0.95 + 0.1 * env.rng()).mat(2);
  B.quad([a0 - og, ye, b0 - ov], [a1 + og, ye, b0 - ov], [a1 + og, yr, bc], [a0 - og, yr, bc], [0, 1, -1], [a0 - og, 0, a1 + og, sl]);
  B.quad([a0 - og, ye, b1 + ov], [a1 + og, ye, b1 + ov], [a1 + og, yr, bc], [a0 - og, yr, bc], [0, 1, 1], [a0 - og, 0, a1 + og, sl]);
  B.color(TRIM).mat(0, 0, 1);
  for (const [ag, sg] of [[a0 - og, -1], [a1 + og, 1]]) for (const be of [b0 - ov, b1 + ov]) B.quad([ag, ye - 0.2, be], [ag, yr - 0.2, bc], [ag, yr, bc], [ag, ye, be], [sg, 0, 0]);   // verge boards
  for (const [ag, fa] of [[a0, 'w'], [a1, 'e']]) for (const [bg, fb] of [[b0, 's'], [b1, 'n']]) {                                                     // the four white corner boards
    const p = fa === 'w' ? ag - 0.04 : ag - 0.14, q = fb === 's' ? bg - 0.04 : bg - 0.14; B.box(p, p + 0.18, y0, eav, q, q + 0.18, fa + fb); }
  B.box(a0 - 0.04, a0, y0, y0 + 2.05, bc - 0.58, bc + 0.58, 'w');
  B.color('#2c463a').mat(8, 0, 2).box(a0 - 0.07, a0, y0, y0 + 1.9, bc - 0.45, bc + 0.45, 'w');
  B.mat(0, 0, 0).window([ac, y0 + 1.35, b0], [0, 0, -1], 0.95, 1.0, 22).window([ac, y0 + 1.35, b1], [0, 0, 1], 0.95, 1.0, 22).window([a1, y0 + 1.35, bc], [1, 0, 0], 0.95, 1.0, 22);
  B.color('#2c2f33').mat(0).tube([ac + 1.2, ridge - 0.5, bc + 0.7], [ac + 1.2, ridge + 0.75, bc + 0.7], 0.09, 0.09, 5, true);                          // the stove's pipe
  B.end();
  cast(env, B, ac, bc, env.across(B.f, len / 2, hw), eav + 0.25); cast(env, B, ac, bc, env.across(B.f, len / 2, hw) * 0.45, ridge);
}
// ---- A BOATHOUSE ON STILTS at a skerry's edge: red upright boards, white trim, slate; its gable and boat door
// toward -a, over the water; the stilts go down under the water (and into the rock behind).
export function stiltHouse(B, env, ac, bc, name, o = {}) {
  const len = o.len || 7.0, hw = (o.w || 5.0) / 2, fl0 = o.floor || 1.7, a0 = ac - len / 2, a1 = ac + len / 2, b0 = bc - hw, b1 = bc + hw, eav = fl0 + 2.3, ridge = eav + hw * 0.72;
  B.body(name, 'boathouse');
  B.color('#8f2a21').mat(8).box(a0, a1, fl0, eav, b0, b1, 'wesn');
  for (const [ag, sg] of [[a0, -1], [a1, 1]]) B.tri([ag, eav, b0], [ag, eav, b1], [ag, ridge, bc], [sg, 0, 0], [b0, eav, b1, eav, bc, ridge]);
  B.color('#4a3a2e').mat(0).box(a0 - 1.1, a1 + 0.3, fl0 - 0.2, fl0, b0 - 0.3, b1 + 0.3, 'wesnut');                                                   // the floor's deck, an apron toward the water
  const ov = 0.32, th = 0.12, ye = eav - ov * 0.72 + th, yr = ridge + th, sl = Math.hypot(hw + ov, yr - ye), r0 = a0 - 0.36, r1 = a1 + 0.36;
  B.color('#3a3f47').mat(2);
  B.quad([r0, ye, b0 - ov], [r1, ye, b0 - ov], [r1, yr, bc], [r0, yr, bc], [0, 1, -1], [r0, 0, r1, sl]).quad([r0, ye, b1 + ov], [r1, ye, b1 + ov], [r1, yr, bc], [r0, yr, bc], [0, 1, 1], [r0, 0, r1, sl]);
  B.color(TRIM).mat(0, 0, 1);
  for (const [ag, sg] of [[r0, -1], [r1, 1]]) for (const be of [b0 - ov, b1 + ov]) B.quad([ag, ye - 0.2, be], [ag, yr - 0.2, bc], [ag, yr, bc], [ag, ye, be], [sg, 0, 0]);
  B.box(a0 - 0.04, a0, fl0, eav, b0 - 0.03, b0 + 0.15, 'w').box(a0 - 0.04, a0, fl0, eav, b1 - 0.15, b1 + 0.03, 'w');
  B.box(a0 - 0.05, a0, fl0, fl0 + 2.15, bc - 1.5, bc + 1.5, 'w');
  B.color('#5e1b16').mat(8, 0, 2).box(a0 - 0.08, a0, fl0, fl0 + 2.0, bc - 1.35, bc + 1.35, 'w');
  B.mat(0, 0, 0).window([a0, eav + 0.8, bc], [-1, 0, 0], 0.7, 0.7, 22);
  B.color(TAR);
  for (const sa of [a0 - 0.8, a0 + 0.3, ac, a1 - 0.3]) for (const sb of [b0 + 0.3, b1 - 0.3]) B.tube([sa, fl0 - 0.2, sb], [sa, -1.4, sb], 0.11, 0.11, 5, true);
  B.end();
  cast(env, B, ac, bc, env.across(B.f, len / 2, hw), eav + 0.2); cast(env, B, ac, bc, env.across(B.f, len / 2, hw) * 0.45, ridge);
}
// ---- AN EMPTY DRYING RACK (the town's own kind, smaller): a ridge pole on trestles from p to q ([a, b]), rails
// down both slopes; its feet go down into the rock from yg. ITS TIMBER'S OWN SIZE (RACK, metres of radius): the
// poles (a trestle's two legs and the ridge) are logs 0.18 m through, the rails and a trestle's tie 0.12 m through,
// as the racks on the town's west mole.
export const RACK = { pole: 0.09, rail: 0.06 };
export function rack(B, env, p, q, yg, name, H = 3.5, half = 1.5, rails = 4) {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, n = Math.max(2, Math.round(L / 2.6));
  const at = (t, s, y) => [p[0] + ux * t + nx * s, y, p[1] + uz * t + nz * s], rp = RACK.pole, rr = RACK.rail;
  B.body(name, 'rack').color('#8a7a66').mat(0);
  for (let i = 0; i <= n; i++) { const t = (i / n) * L;
    for (const sd of [-1, 1]) B.tube(at(t, sd * half * 1.25, yg - 0.9), at(t, 0, yg + H), rp, rp, 4, true);
    B.tube(at(t, -half * 0.52, yg + H * 0.48), at(t, half * 0.52, yg + H * 0.48), rr, rr, 4, true); }
  B.color('#9a8b76').tube(at(-0.4, 0, yg + H), at(L + 0.4, 0, yg + H), rp, rp, 4, true);
  for (let j = 1; j <= rails; j++) { const f = j / (rails + 1.2), s = half * (1 - f), y = yg + H * f;
    for (const sd of [-1, 1]) B.tube(at(-0.3, sd * s, y), at(L + 0.3, sd * s, y), rr, rr, 4, true); }
  B.end();
  cast(env, B, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, env.across(B.f, Math.abs(dx) / 2 + half * Math.abs(nx), Math.abs(dz) / 2 + half * Math.abs(nz)), yg + H,
    Math.min(1, 2 * 2 * rp * (n + 1) / L + (2 * rp + 2 * rails * 2 * rr) / H), yg);   // (what its legs, its ridge and its rails, each as wide as it is through, fill of its own outline)
}
// END-OF-HOUSES

// ---- A CAIRN: a neat cone of laid stone with a white cap stone, on the rock at yg.
export function cairn(B, env, a, b, yg, name, h = 2.4) {
  B.body(name, 'cairn').color(STONE, 1.12).mat(4).lathe(a, b, [[1.05, yg - 0.7], [0.95, yg + 0.25 * h], [0.7, yg + 0.6 * h], [0.4, yg + 0.9 * h]], 8);
  B.color('#f1eee6').mat(0).lathe(a, b, [[0.4, yg + 0.9 * h], [0.3, yg + h], [0.0, yg + h + 0.12]], 8).end();
  cast(env, B, a, b, 0.7, yg + h * 0.8);
}
// ---- A POLE WITH A PLAIN PENNANT (the town's own: a long red triangle, flying down the town's wind; the paint's
// move: the cloth flies by the clock about its hoist). what = 2 on a rock, 5 on a spar that bobs (see spar).
export function pennant(B, env, a, b, y, L, what, half = 0.42, hex = '#c8281f') {
  const f = B.f, wa = env.wind[0] * f.sx + env.wind[1] * f.sz, wb = env.wind[0] * f.fx + env.wind[1] * f.fz, N = Math.max(6, Math.round(L * 4)), nr = [-wb, 0, wa];
  B.color(hex).mat(7).move(what, a, b, 0);
  const p = (s, h) => [a + wa * (s + 0.08), y + h, b + wb * (s + 0.08)];
  for (let i = 0; i < N; i++) { const s0 = (i / N) * L, s1 = ((i + 1) / N) * L, h0 = half * (1 - s0 / L), h1 = half * (1 - s1 / L);
    B.vert(p(s0, -h0), nr, 0, 0, null, s0); B.vert(p(s1, -h1), nr, 0, 0, null, s1); B.vert(p(s1, h1), nr, 0, 0, null, s1);
    B.vert(p(s0, -h0), nr, 0, 0, null, s0); B.vert(p(s1, h1), nr, 0, 0, null, s1); B.vert(p(s0, h0), nr, 0, 0, null, s0); }
  B.move(0).mat(0);
}
export function flagpole(B, env, a, b, yg, name, h = 8.2) {
  const top = yg + h, r = 0.075;
  B.body(name, 'pole', 0.6).color('#f1eee6').mat(0).lathe(a, b, [[0.2, yg - 0.5], [0.15, yg + 0.5], [r, yg + 0.7]], 6).tube([a, yg + 0.6, b], [a, top, b], r, r * 0.6, 6, true);
  B.color('#c9a23a').lathe(a, b, [[0.0, top - 0.02], [0.1, top + 0.08], [0.0, top + 0.2]], 6);
  pennant(B, env, a, b, top - 0.55, 3.0, 2); B.end();
  cast(env, B, a, b, r * 0.8, top);   // (the pole's own mean radius: r at its foot, .6 r at its head)
}
// ---- THE SECOND LIGHT: a small white tower with one red band, a railed gallery, a lantern whose lamp turns by the
// clock (the paint's kind 5: emissive about this tower's own axis, no light), a dark red cap. yg = the rock there.
export function light(B, env, a, b, yg, name, o = {}) {
  const h = o.h || 8.0, r0 = o.r0 || 1.75, r1 = o.r1 || 1.2, m = yg, rAt = (t) => r0 + (r1 - r0) * t / h, y0 = m + h + 0.22, lt = y0 + 1.5;
  B.body(name, 'light');
  B.color(STONE, 1.08).mat(4).lathe(a, b, [[r0 + 0.4, m - 1.2], [r0 + 0.35, m + 0.4]], 16).disc(a, m + 0.4, b, r0 + 0.35, 16);
  B.color('#f1eee6').mat(0).lathe(a, b, [[rAt(0), m + 0.4], [rAt(3.1), m + 3.1]], 16);
  B.color('#b3261e').lathe(a, b, [[rAt(3.1), m + 3.1], [rAt(5.0), m + 5.0]], 16);                              // the one red band
  B.color('#f1eee6').lathe(a, b, [[rAt(5.0), m + 5.0], [r1, m + h], [r1 + 0.6, y0]], 16);
  B.color('#3a3d40').disc(a, y0, b, r1 + 0.6, 16).lathe(a, b, [[r1 + 0.6, y0], [r1 + 0.6, y0 - 0.14]], 16);
  const rg = r1 + 0.52; B.color('#e9e6de');
  for (let i = 0; i < 10; i++) { const t = (i / 10) * 2 * Math.PI, t1 = ((i + 1) / 10) * 2 * Math.PI, p = [a + Math.cos(t) * rg, y0, b + Math.sin(t) * rg], q = [a + Math.cos(t1) * rg, y0, b + Math.sin(t1) * rg];
    B.tube(p, [p[0], y0 + 0.95, p[2]], 0.032, 0.032, 4, true); for (const hh of [0.5, 0.95]) B.tube([p[0], y0 + hh, p[2]], [q[0], y0 + hh, q[2]], 0.028, 0.028, 4, true); }
  B.color('#22262a').lathe(a, b, [[0.86, y0], [0.86, y0 + 0.38]], 12);
  B.color('#111111').mat(5).move(4, a, b, o.phase || 0).lathe(a, b, [[0.8, y0 + 0.38], [0.8, lt]], 12).move(0);  // the lantern's glass: the lamp's glow
  B.color('#22262a').mat(0);
  for (let i = 0; i < 6; i++) { const t = (i / 6) * 2 * Math.PI; B.tube([a + Math.cos(t) * 0.83, y0 + 0.38, b + Math.sin(t) * 0.83], [a + Math.cos(t) * 0.83, lt, b + Math.sin(t) * 0.83], 0.035, 0.035, 4, true); }
  B.color('#7a1d18').lathe(a, b, [[1.08, lt - 0.04], [1.0, lt + 0.12], [0.1, lt + 0.95]], 12);
  B.color('#2a2c2e').lathe(a, b, [[0.0, lt + 0.8], [0.14, lt + 1.0], [0.0, lt + 1.2]], 6).tube([a, lt + 1.15, b], [a, lt + 1.9, b], 0.022, 0.022, 4, true);
  B.color('#2c463a').mat(8, 0, 1).box(a - rAt(1) - 0.03, a - rAt(1) + 0.3, m + 0.4, m + 2.2, b - 0.42, b + 0.42, 'w');   // its door toward -a
  // its two small windows, ONE PANE EACH (the town's rule for windows: never one column of two panes)
  B.mat(0, 0, 0).window([a, m + 3.9, b - rAt(3.9) + 0.02], [0, 0, -1], 0.45, 0.7, 11).window([a, m + 6.4, b - rAt(6.4) + 0.02], [0, 0, -1], 0.45, 0.7, 11);
  B.end();
  cast(env, B, a, b, (r0 + r1) / 2, m + h); cast(env, B, a, b, 0.8, lt + 0.9);
}
// ---- A LANDING STAGE: a short timber jetty from a0 out to a1 (a1 < a0: toward -a, over the water) at b, on piles.
export function stage(B, env, a0, a1, b, name, top = 1.05, w = 1.5) {
  B.body(name, 'stage').color('#6a5a48').mat(8).box(a1, a0, top - 0.14, top, b - w / 2, b + w / 2, 'wsnut');
  B.color(TAR).mat(0);
  const n = Math.max(2, Math.round((a0 - a1) / 2.4));
  for (let i = 0; i <= n; i++) { const a = a1 + 0.2 + (a0 - a1 - 0.4) * i / n; for (const sb of [-1, 1]) B.tube([a, top + (i === 0 ? 0.55 : -0.14), b + sb * (w / 2 - 0.08)], [a, -1.4, b + sb * (w / 2 - 0.08)], 0.09, 0.09, 5, true); }
  B.end();
  cast(env, B, (a0 + a1) / 2, b, env.across(B.f, (a0 - a1) / 2, w / 2), top);
}
// ---- A GULL THAT SITS (the town's own, all alike): white, grey-backed, yellow-billed, facing along (fa, fb)
export function gull(B, a, y, b, fa, fb) {
  const P = (f, h, s) => [a + fa * f - fb * s, y + h, b + fb * f + fa * s];
  B.color('#f4f3ee').mat(0).tube(P(-0.2, 0.17, 0), P(0.12, 0.2, 0), 0.07, 0.085, 5).tube(P(0.12, 0.2, 0), P(0.19, 0.3, 0), 0.085, 0.05, 5);
  B.lathe(P(0.2, 0, 0)[0], P(0.2, 0, 0)[2], [[0.0, y + 0.27], [0.055, y + 0.33], [0.0, y + 0.385]], 5);
  B.color('#9aa3ab').tube(P(-0.26, 0.2, 0), P(0.08, 0.24, 0), 0.03, 0.078, 4).color('#2c2e30').tube(P(-0.36, 0.2, 0), P(-0.24, 0.21, 0), 0.012, 0.035, 4);
  B.color('#e2b21f').tube(P(0.24, 0.335, 0), P(0.315, 0.325, 0), 0.016, 0.004, 4);
  B.color('#d99a2b'); for (const s of [-0.03, 0.03]) B.tube(P(0, 0.12, s), P(0.01, 0, s), 0.008, 0.008, 4, true);
}
// END-OF-DRESS

// ---- AN ANCHORED OPEN BOAT (the town's own moored boat, lighter): a clinker double-ender, white with a red top
// strake, a short bare mast, the sail furled on its yard along the thwarts, two oars shipped, its anchor's line
// from the stem down into the water. Laid in its own frame (b = ahead along the keel, the frame's origin at its
// middle); it rides the swell and rocks about its middle (the paint's move 1). No name on it.
// (spar: its mast's own radius at the foot and at the head, a pole 0.12 m through tapering to 0.08 m)
export const OPEN = { len: 5.6, hb: 0.92, mast: 5.2, rock: 0.9, spar: [0.06, 0.04] };
export function openBoat(B, env, phase, name, strake = RED) {
  const len = OPEN.len, hb = OPEN.hb, P = (s, y, f) => [s, y, f];
  const half = (t) => hb * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.7), sheer = (t) => 0.5 + 0.42 * Math.pow(Math.abs(2 * t - 1), 2.3), keel = (t) => -0.28 + 0.9 * Math.pow(Math.abs(2 * t - 1), 5);
  const NS = 10, NK = 3, ring = (t, inset) => { const f = (t - 0.5) * len, h = Math.max(half(t) - inset, 0), ys = sheer(t), yk = keel(t) + inset * 0.6, out = [];
    for (let k = 0; k <= NK; k++) { const an = (k / NK) * Math.PI / 2; out.push([h * Math.pow(Math.cos(an), 0.6) + (inset ? 0 : 0.02 * (k % 2)), ys + (yk - ys) * Math.pow(Math.sin(an), 1.25), f]); }
    return out; };
  B.body(name, 'boat', OPEN.rock).move(1, 0, 0, phase).mat(0);
  if (B.again && B.again('open boat ' + strake)) return openEnd(B, env);       // (every open boat of one strake is the first of them laid again: the builder's own remark)
  if (B.keep) B.keep('open boat ' + strake);
  for (let i = 0; i < NS; i++) { const o0 = ring(i / NS, 0), o1 = ring((i + 1) / NS, 0), n0 = ring(i / NS, 0.04), n1 = ring((i + 1) / NS, 0.04);
    for (const sd of [-1, 1]) { const F = (p) => P(p[0] * sd, p[1], p[2]), out = [sd, 0.25, 0];
      for (let k = 0; k < NK; k++) {
        B.color(k === 0 ? strake : '#efece3', k === 0 ? 1 : 1 - 0.05 * (k % 2)).quad(F(o0[k]), F(o1[k]), F(o1[k + 1]), F(o0[k + 1]), k === NK - 1 ? [sd * 0.3, -1, 0] : out);
        B.color('#c9a56a', 1 - 0.1 * k).quad(F(n0[k]), F(n1[k]), F(n1[k + 1]), F(n0[k + 1]), k === NK - 1 ? [0, 1, 0] : [-sd, 0.4, 0]); }
      B.color('#b98a4e').quad(F([o0[0][0] + 0.03, o0[0][1] + 0.03, o0[0][2]]), F([o1[0][0] + 0.03, o1[0][1] + 0.03, o1[0][2]]), F([n1[0][0] - 0.03, n1[0][1] + 0.03, n1[0][2]]), F([n0[0][0] - 0.03, n0[0][1] + 0.03, n0[0][2]]), [0, 1, 0]); } }
  B.color('#7a5632');
  for (const e of [-1, 1]) B.tube(P(0, sheer(0.5 + e * 0.5) + 0.14, e * (len / 2 + 0.02)), P(0, 0.1, e * (len / 2 - 0.34)), 0.05, 0.06, 5);
  const bx = (s0, s1, y0, y1, f0, f1) => { const c = [P(s0, y1, f0), P(s1, y1, f0), P(s1, y1, f1), P(s0, y1, f1)], d = [P(s0, y0, f0), P(s1, y0, f0), P(s1, y0, f1), P(s0, y0, f1)];
    B.quad(c[0], c[1], c[2], c[3], [0, 1, 0]).quad(d[0], d[1], c[1], c[0], [0, 0, -1]).quad(d[3], d[2], c[2], c[3], [0, 0, 1]); };
  B.color('#b98a4e'); for (const f of [-1.5, 0.1, 1.5]) { const h = half(f / len + 0.5) - 0.05; bx(-h, h, 0.3, 0.34, f - 0.12, f + 0.12); }
  B.color('#a8834f', 0.85); bx(-0.5, 0.5, -0.02, 0.0, -1.9, 1.9);
  B.color('#b08a55').tube(P(0, 0.05, 0.1), P(0, 0.3 + OPEN.mast, 0.1), OPEN.spar[0], OPEN.spar[1], 6, true);
  B.color('#9a7a4a').tube(P(0.22, 0.4, -2.0), P(0.16, 0.62, 2.1), 0.035, 0.035, 5, true);
  B.color('#c5a876'); for (let i = 0; i < 4; i++) { const f0 = -1.7 + i * 0.9, r0 = i === 0 ? 0.07 : 0.12, r1 = i === 3 ? 0.07 : 0.12; B.tube(P(0.22 - 0.015 * i, 0.4 + 0.052 * (f0 + 2) - 0.04, f0), P(0.22 - 0.015 * (i + 1), 0.4 + 0.052 * (f0 + 2.9) - 0.04, f0 + 0.9), r0, r1, 5); }
  B.color('#8f7046'); for (const sd of [-1, 1]) B.tube(P(sd * 0.3 - 0.5, 0.38, -1.9), P(sd * 0.36 - 0.5, 0.4, 1.3), 0.022, 0.022, 4, true);
  B.color('#4a4338').tube(P(0, sheer(1) + 0.05, len / 2), P(0, -0.4, len / 2 + 0.8), 0.014, 0.014, 4);                      // the anchor's line, up and down in the calm
  if (B.keep) B.kept();
  openEnd(B, env);
}
// (the open boat's end: its body closed, and the shade it throws)
function openEnd(B, env) {
  B.end().move(0);
  cast(env, B, 0, 0, env.across(B.f, OPEN.hb, OPEN.len / 2) * 0.9, 0.62); cast(env, B, 0, 0.1, (OPEN.spar[0] + OPEN.spar[1]) / 2, 0.3 + OPEN.mast);
}
// END-OF-OPEN-BOAT

// ---- A SMALL DECKED FISHING BOAT: a double-ended wooden hull 9.6 m long, white with a coloured bulwark, a flush
// deck, a white wheelhouse with dark windows abaft the middle, a short mast and boom before it, a hatch, a stove
// pipe. No name, nothing lettered. It rides the swell and rocks about its middle as the open boats do (move 1).
// (spar: its mast's own radius at the deck and at the head, a pole 0.22 m through tapering to 0.16 m)
export const DECKED = { len: 9.6, hb: 1.55, house: 3.45, mast: 5.9, rock: 0.9, spar: [0.11, 0.08] };
export function deckedBoat(B, env, phase, name, strake = '#2f5a4a') {
  const len = DECKED.len, hb = DECKED.hb, NS = 12, NK = 3;
  const half = (t) => hb * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.55), sheer = (t) => 1.0 + 0.5 * Math.pow(Math.abs(2 * t - 1), 2.2) + 0.28 * t, keel = (t) => -0.45 + 1.3 * Math.pow(Math.abs(2 * t - 1), 6);
  const ring = (t) => { const f = (t - 0.5) * len, h = half(t), ys = sheer(t), yk = keel(t), out = [];
    for (let k = 0; k <= NK; k++) { const an = (k / NK) * Math.PI / 2; out.push([h * Math.pow(Math.cos(an), 0.45), ys + (yk - ys) * Math.pow(Math.sin(an), 1.4), f]); }
    return out; };
  const deckY = (t) => sheer(t) - 0.34;
  B.body(name, 'decked', DECKED.rock).move(1, 0, 0, phase).mat(0);
  for (let i = 0; i < NS; i++) { const t0 = i / NS, t1 = (i + 1) / NS, o0 = ring(t0), o1 = ring(t1);
    for (const sd of [-1, 1]) { const F = (p) => [p[0] * sd, p[1], p[2]];
      for (let k = 0; k < NK; k++) B.color(k === 0 ? strake : k === NK - 1 ? '#5a2a22' : '#efece3').quad(F(o0[k]), F(o1[k]), F(o1[k + 1]), F(o0[k + 1]), k === NK - 1 ? [sd * 0.3, -1, 0] : [sd, 0.25, 0]);
      // the bulwark's inner face and its cap rail, the deck's half
      const i0 = [Math.max(o0[0][0] - 0.07, 0), o0[0][1], o0[0][2]], i1 = [Math.max(o1[0][0] - 0.07, 0), o1[0][1], o1[0][2]];
      B.color('#d9d2c2').quad(F(i0), F(i1), F([i1[0], deckY(t1), i1[2]]), F([i0[0], deckY(t0), i0[2]]), [-sd, 0.2, 0]);
      B.color('#b98a4e').quad(F([o0[0][0] + 0.03, o0[0][1] + 0.03, o0[0][2]]), F([o1[0][0] + 0.03, o1[0][1] + 0.03, o1[0][2]]), F([i1[0], i1[1] + 0.03, i1[2]]), F([i0[0], i0[1] + 0.03, i0[2]]), [0, 1, 0]);
      B.color('#a59576').quad(F([0, deckY(t0), i0[2]]), F([0, deckY(t1), i1[2]]), F([i1[0], deckY(t1), i1[2]]), F([i0[0], deckY(t0), i0[2]]), [0, 1, 0]); } }
  B.color('#7a5632');
  for (const e of [-1, 1]) B.tube([0, sheer(0.5 + e * 0.5) + 0.2, e * (len / 2 + 0.02)], [0, 0.2, e * (len / 2 - 0.5)], 0.07, 0.08, 5);
  // the wheelhouse: white, a dark window in each face (two ahead), an ochre roof with a little overhang
  const hy = deckY(0.35), h0 = -2.6, h1 = -0.5, hw = 0.9, top = hy + 2.05;
  B.color('#efece3').mat(1).box(-hw, hw, hy, top, h0, h1, 'wesn');
  B.color('#d39a33').mat(0).box(-hw - 0.14, hw + 0.14, top, top + 0.09, h0 - 0.12, h1 + 0.22, 'wesntu');
  B.mat(0, 0, 0);
  for (const s of [-0.42, 0.42]) B.window([s, top - 0.62, h1], [0, 0, 1], 0.62, 0.6, 11, '#efece3');
  B.window([-hw, top - 0.62, (h0 + h1) / 2 + 0.3], [-1, 0, 0], 0.9, 0.6, 21, '#efece3').window([hw, top - 0.62, (h0 + h1) / 2 + 0.3], [1, 0, 0], 0.9, 0.6, 21, '#efece3');
  B.color('#2c463a').mat(8, 0, 1).box(-0.32, 0.32, hy, hy + 1.7, h0 - 0.03, h0, 's');
  B.color('#2c2f33').mat(0).tube([0.55, top, h0 + 0.4], [0.55, top + 0.85, h0 + 0.4], 0.07, 0.07, 5, true);                          // the stove's pipe
  // the mast and its boom before the house, a hatch, the anchor's line from the stem
  const my = deckY(0.6), mf = 0.75;
  B.color('#b08a55').tube([0, my, mf], [0, DECKED.mast, mf], DECKED.spar[0], DECKED.spar[1], 6, true).tube([0, my + 1.5, mf + 0.1], [0, my + 2.6, mf + 3.0], 0.05, 0.04, 5, true);
  B.color('#7d6a4c').box(-0.55, 0.55, deckY(0.72), deckY(0.72) + 0.34, 1.7, 2.8, 'wesnt');
  B.color('#4a4338').tube([0, sheer(1) + 0.1, len / 2], [0, -0.4, len / 2 + 1.1], 0.016, 0.016, 4);                                   // the anchor's line, up and down in the calm
  B.end().move(0);
  cast(env, B, 0, 0, env.across(B.f, hb, len / 2) * 0.9, 1.25); cast(env, B, 0, -1.55, env.across(B.f, hw, 1.05), DECKED.house); cast(env, B, 0, mf, (DECKED.spar[0] + DECKED.spar[1]) / 2, DECKED.mast);
}
// END-OF-DECKED

// ---- THE LANE'S MARKS, at the frame's origin: a RED CONE (to port of our course) or a GREEN CAN (to starboard), on
// a dark float, each with a top mark of its own shape on a short staff. Nothing lettered. They bob by the swell's
// law at their own place (the paint's move 3).
export const MARK = { r: 0.95, top: 3.9, bob: 0.4 };
export function laneBuoy(B, env, shape, name) {
  const n = 8;
  B.body(name, 'buoy', MARK.bob).move(3, 0, 0, 0).mat(0);
  if (!(B.again && B.again('lane mark ' + shape))) { if (B.keep) B.keep('lane mark ' + shape);   // (every mark of one shape is the first of them laid again)
  B.color('#26292b').lathe(0, 0, [[0.0, -0.5], [0.8, -0.34], [MARK.r, 0.0], [0.9, 0.26], [0.72, 0.36]], n);
  if (shape === 'cone') {
    B.color('#c8281f').lathe(0, 0, [[0.76, 0.34], [0.7, 0.55], [0.13, 2.7], [0.0, 2.76]], n);
    B.color('#2a2c2e').tube([0, 2.7, 0], [0, 3.3, 0], 0.04, 0.04, 4, true);
    B.color('#c8281f').lathe(0, 0, [[0.0, 3.28], [0.3, 3.3], [0.0, MARK.top]], 6);
  } else {
    B.color('#2f6e4a').lathe(0, 0, [[0.72, 0.34], [0.64, 0.5], [0.64, 2.15]], n).disc(0, 2.15, 0, 0.64, n);
    B.color('#2a2c2e').tube([0, 2.15, 0], [0, 3.3, 0], 0.04, 0.04, 4, true);
    B.color('#2f6e4a').lathe(0, 0, [[0.0, 3.28], [0.27, 3.3], [0.27, MARK.top - 0.08], [0.0, MARK.top - 0.06]], 6);
  }
  if (B.keep) B.kept(); }
  B.end().move(0);
  cast(env, B, 0, 0, shape === 'cone' ? 0.5 : 0.62, 2.3);
}
// ---- A SPAR BUOY WITH A PENNANT, at the frame's origin: a slender pole through a small float, a little plain
// pennant at its head (move 5: the cloth flies and the whole bobs).
export function spar(B, env, name, hex = '#d39a33') {
  const r0 = 0.06, r1 = 0.045;                      // (the pole's own radius at its foot and at its head)
  B.body(name, 'spar', MARK.bob + 0.3).move(3, 0, 0, 0).mat(0);
  B.color('#e8e4d8').tube([0, -1.0, 0], [0.12, 3.5, 0.05], r0, r1, 5, true);
  B.color(hex).lathe(0.03, 0.01, [[0.0, -0.3], [0.3, -0.05], [0.3, 0.12], [0.0, 0.4]], 6);
  pennant(B, env, 0.12, 0.05, 3.2, 1.15, 5, 0.24, hex); B.end();
  cast(env, B, 0, 0, (r0 + r1) / 2, 3.4);
}
// ---- NET FLOATS in a neat line from p to q ([a, b]): n floats evenly spaced, orange, every fourth one white;
// each bobs at its own place.
export function floats(B, env, p, q, n, name) {
  B.body(name, 'float', MARK.bob).mat(0);
  for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0, a = p[0] + (q[0] - p[0]) * t, b = p[1] + (q[1] - p[1]) * t;
    B.move(3, a, b, 0).color(i % 4 === 0 ? '#f1eee6' : '#e07a2a').lathe(a, b, [[0.0, -0.17], [0.25, 0.0], [0.0, 0.27]], 6); }
  B.end().move(0);
}
// gulls sitting evenly along a line from p to q ([a, b]) at heights yAt(a, b) + lift, all facing one way
export function sitGulls(B, p, q, n, yAt, name, lift = 0, face = [-0.6, -0.8]) {
  B.body(name, 'gull').mat(0);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, a = p[0] + (q[0] - p[0]) * t, b = p[1] + (q[1] - p[1]) * t; gull(B, a, yAt(a, b) + lift, b, face[0], face[1]); }
  B.end();
}
// END-OF-MARKS

// ---- THE LIGHTSHIP at anchor: a red hull 35 m long with one white band (nothing lettered), a white deckhouse with
// dark windows and a buff funnel, a small house forward, a lantern tower amidships (a plain white tube 0.6 m
// through, SHIP.tower its radius) carrying the lantern (the paint's kind 5: its lamp turns by the clock about the
// tower's own axis), a ball day-mark over it and a plain red pennant at the head, a boat under its cover in
// davits to port, the anchor's chain from the bow down into the water.
// Laid in its own frame (b ahead along the keel, the origin amidships at the tower's foot); it rides the swell a
// little (the paint's move 6: a long hull over several waves; 7 its pennant). Made in steps (the build rests).
export const SHIP = { len: 35, hb: 3.7, mast: 10.2, top: 14.5, reach: 0.5, tower: 0.3 };
const shipLines = () => { const len = SHIP.len, hb = SHIP.hb;
  const half = (t) => hb * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.5), sheer = (t) => 2.75 + 1.0 * Math.pow(Math.abs(2 * t - 1), 2.2) + 0.5 * t;
  const keel = (t) => -1.2 + 2.0 * Math.pow(Math.abs(2 * t - 1), 6), deckY = (t) => sheer(t) - 0.9;
  // a section from the rail down to the keel: [half breadth, height] (the white band lies between the 2nd and the 3rd)
  const ring = (t) => { const h = half(t), ys = sheer(t), yk = keel(t), f = (t - 0.5) * len;
    return [[h, ys], [h, ys - 0.45], [h * 0.985, ys - 1.3], [h * 0.95, 0.3], [h * 0.74, -0.7], [0, yk]].map(([x, y]) => [x, Math.max(y, yk), f]); };
  return { len, hb, half, sheer, keel, deckY, ring }; };
export function* lightship(B, env, phase, name) {
  const { len, half, sheer, deckY, ring } = shipLines(), NS = 14, RED2 = '#b3261e', WHITE = '#efece3';
  const paint = ['#a82219', WHITE, RED2, RED2, '#7c1c15'];
  B.body(name, 'lightship', SHIP.reach).move(6, 0, 0, phase).mat(0);
  for (let i = 0; i < NS; i++) { const t0 = i / NS, t1 = (i + 1) / NS, o0 = ring(t0), o1 = ring(t1);
    for (const sd of [-1, 1]) { const F = (p) => [p[0] * sd, p[1], p[2]];
      for (let k = 0; k < 5; k++) B.color(paint[k]).quad(F(o0[k]), F(o1[k]), F(o1[k + 1]), F(o0[k + 1]), k === 4 ? [sd * 0.3, -1, 0] : [sd, 0.2, 0]);
      // the bulwark's inner face, its cap rail, the deck's half
      const i0 = [Math.max(o0[0][0] - 0.12, 0), o0[0][1], o0[0][2]], i1 = [Math.max(o1[0][0] - 0.12, 0), o1[0][1], o1[0][2]];
      B.color('#d9d2c2').quad(F(i0), F(i1), F([i1[0], deckY(t1), i1[2]]), F([i0[0], deckY(t0), i0[2]]), [-sd, 0.2, 0]);
      B.color('#e9e6de').quad(F([o0[0][0] + 0.04, o0[0][1] + 0.04, o0[0][2]]), F([o1[0][0] + 0.04, o1[0][1] + 0.04, o1[0][2]]), F([i1[0], i1[1] + 0.04, i1[2]]), F([i0[0], i0[1] + 0.04, i0[2]]), [0, 1, 0]);
      B.color('#9c8f74').quad(F([0, deckY(t0), i0[2]]), F([0, deckY(t1), i1[2]]), F([i1[0], deckY(t1), i1[2]]), F([i0[0], deckY(t0), i0[2]]), [0, 1, 0]); }
    if (i === 6) yield; }
  // the stem and the stern post, the anchor's chain from the bow down into the water (link by link a tone)
  B.color('#7c1c15');
  for (const e of [-1, 1]) B.tube([0, sheer(0.5 + e * 0.5) + 0.25, e * (len / 2 + 0.03)], [0, 0.7, e * (len / 2 - 0.5)], 0.13, 0.15, 5);
  for (let i = 0; i < 8; i++) { const u0 = i / 8, u1 = (i + 1) / 8, at = (u) => [0.5, sheer(1) - 0.9 - (sheer(1) - 0.5) * u, len / 2 - 0.9 + 3.6 * u];
    B.color(i % 2 ? '#4a4d50' : '#2f3134').tube(at(u0), at(u1), 0.075, 0.075, 4); }
  yield;
// END-OF-SHIP-A
  // the deckhouse abaft the mast: white, dark windows in a neat row each side and two ahead, a door astern, a flat
  // roof with a little overhang, a buff funnel with a black top; the small house forward
  const WHITE2 = '#efece3', dk = deckY(0.32), h0 = -10.2, h1 = -3.0, hw = 2.15, top = dk + 2.35;
  B.color(WHITE2).mat(0).box(-hw, hw, dk, top, h0, h1, 'wesn');
  B.color('#cfc8b6').box(-hw - 0.2, hw + 0.2, top, top + 0.12, h0 - 0.2, h1 + 0.3, 'wesntu');
  B.mat(0, 0, 0);
  for (const sd of [-1, 1]) for (const f of [-8.6, -6.6, -4.6]) B.window([sd * hw, top - 0.85, f], [sd, 0, 0], 0.8, 0.62, 11, WHITE2);
  for (const s of [-1.0, 1.0]) B.window([s, top - 0.85, h1], [0, 0, 1], 0.8, 0.62, 11, WHITE2);
  B.color('#2c463a').mat(8, 0, 1).box(-0.4, 0.4, dk, dk + 1.85, h0 - 0.04, h0, 's');
  B.color('#d9a441').mat(0).lathe(0, -7.4, [[0.72, top + 0.12], [0.68, top + 2.1]], 10).color('#22262a').lathe(0, -7.4, [[0.68, top + 2.1], [0.7, top + 2.75]], 10).disc(0, top + 2.75, -7.4, 0.7, 10);
  const fk = deckY(0.72), f0 = 5.6, f1 = 9.4, fw = 1.5, ft = fk + 1.8;
  B.color(WHITE2).box(-fw, fw, fk, ft, f0, f1, 'wesn').color('#cfc8b6').box(-fw - 0.15, fw + 0.15, ft, ft + 0.1, f0 - 0.15, f1 + 0.15, 'wesntu');
  B.mat(0, 0, 0); for (const sd of [-1, 1]) for (const f of [6.6, 8.4]) B.window([sd * fw, ft - 0.7, f], [sd, 0, 0], 0.6, 0.5, 11, WHITE2);
  yield;
  // the boat in davits to port, under its grey cover: two davits, their falls, a small white hull hung outboard
  const ba = -(half(0.33) + 0.95), bb = -6.6, by = dk + 2.0, bl = 4.8, bh = 0.78, bs = (u) => bh * Math.pow(Math.sin(Math.PI * u), 0.7);
  for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6, g0 = bb + (u0 - 0.5) * bl, g1 = bb + (u1 - 0.5) * bl, w0 = bs(u0), w1 = bs(u1);
    for (const sd of [-1, 1]) { B.color(WHITE2).quad([ba + sd * w0, by + 0.62, g0], [ba + sd * w1, by + 0.62, g1], [ba + sd * w1 * 0.7, by + 0.2, g1], [ba + sd * w0 * 0.7, by + 0.2, g0], [sd, 0.2, 0]);
      B.quad([ba + sd * w0 * 0.7, by + 0.2, g0], [ba + sd * w1 * 0.7, by + 0.2, g1], [ba, by, g1], [ba, by, g0], [sd * 0.4, -1, 0]);
      B.color('#8d9497').quad([ba, by + 0.78, g0], [ba, by + 0.78, g1], [ba + sd * w1, by + 0.62, g1], [ba + sd * w0, by + 0.62, g0], [sd * 0.2, 1, 0]); } }
  B.color('#e9e6de');
  for (const f of [bb - 1.7, bb + 1.7]) { const a0 = -(half(0.33) - 0.25);
    B.tube([a0, dk, f], [a0, by + 1.5, f], 0.08, 0.07, 5, true).tube([a0, by + 1.5, f], [ba, by + 1.85, f], 0.07, 0.06, 5, true);
    B.color('#4a4338').tube([ba, by + 1.85, f], [ba, by + 0.75, f], 0.02, 0.02, 4).color('#e9e6de'); }
  yield;
// END-OF-SHIP-B
  // THE LANTERN TOWER amidships: a plain round tube, SHIP.tower m of radius (a lantern mast one climbs inside),
  // from the deck to under the gallery, white as the houses; a low collar where it stands on the deck and a short
  // flare where it meets the gallery's underside
  const m0 = deckY(0.5), mh = SHIP.mast, tr = SHIP.tower;
  B.color('#e9e6de').mat(0).tube([0, m0, 0], [0, mh - 0.3, 0], tr, tr, 10, true);
  B.color('#cfc8b6').lathe(0, 0, [[tr + 0.16, m0], [tr + 0.16, m0 + 0.22], [tr, m0 + 0.4]], 10).color('#3a3d40').lathe(0, 0, [[tr, mh - 0.55], [0.5, mh - 0.3]], 10);
  yield;
  // its gallery and the lantern: the lamp's glow turns by the clock; a red cap, the ball day-mark, the head staff
  B.color('#3a3d40').disc(0, mh, 0, 1.05, 10).lathe(0, 0, [[1.05, mh], [1.05, mh - 0.14], [0.5, mh - 0.3]], 10);
  B.color('#e9e6de');
  for (let i = 0; i < 6; i++) { const t = (i / 6) * 2 * Math.PI, t1 = ((i + 1) / 6) * 2 * Math.PI, p = [Math.cos(t) * 1.0, mh, Math.sin(t) * 1.0], q = [Math.cos(t1) * 1.0, mh, Math.sin(t1) * 1.0];
    B.tube(p, [p[0], mh + 0.85, p[2]], 0.03, 0.03, 4, true).tube([p[0], mh + 0.85, p[2]], [q[0], mh + 0.85, q[2]], 0.028, 0.028, 4, true); }
  B.color('#22262a').lathe(0, 0, [[0.66, mh], [0.66, mh + 0.3]], 10);
  B.color('#111111').mat(5).lathe(0, 0, [[0.62, mh + 0.3], [0.62, mh + 1.4]], 10);
  B.color('#22262a').mat(0);
  for (let i = 0; i < 5; i++) { const t = (i / 5) * 2 * Math.PI; B.tube([Math.cos(t) * 0.64, mh + 0.3, Math.sin(t) * 0.64], [Math.cos(t) * 0.64, mh + 1.4, Math.sin(t) * 0.64], 0.03, 0.03, 4, true); }
  B.color('#a82219').lathe(0, 0, [[0.84, mh + 1.36], [0.76, mh + 1.52], [0.08, mh + 2.15]], 10);
  B.color('#1d1f21').lathe(0, 0, [[0.0, mh + 2.3], [0.36, mh + 2.45], [0.5, mh + 2.8], [0.36, mh + 3.15], [0.0, mh + 3.3]], 8);
  B.color('#e9e6de').tube([0, mh + 2.1, 0], [0, SHIP.top, 0], 0.035, 0.03, 4, true);
  pennant(B, env, 0, 0, SHIP.top - 0.5, 3.0, 7); B.end();
  // its shade: the hull's length in blades, the houses, the funnel, the tower, and on it (each a slab on its own
  // foot) the gallery with the lantern, and the ball
  for (const f of [-13, -6.5, 0, 6.5, 13]) { const t = f / len + 0.5; cast(env, B, 0, f, env.across(B.f, half(t) * 0.92, 3.4), sheer(t) - 0.15); }
  cast(env, B, 0, (h0 + h1) / 2, env.across(B.f, hw, (h1 - h0) / 2), top + 0.1); cast(env, B, 0, -7.4, 0.7, top + 2.7);
  cast(env, B, 0, (f0 + f1) / 2, env.across(B.f, fw, (f1 - f0) / 2), ft + 0.1);
  cast(env, B, 0, 0, SHIP.tower, mh - 0.3); cast(env, B, 0, 0, 0.75, mh + 2.1, 1, mh - 0.3); cast(env, B, 0, 0, 0.4, mh + 3.3, 1, mh + 2.1);
}
// END-OF-SHIP

// ---- WHAT A BOAT CLOSE BY THE LINE CARRIES, in the boat's own frame and riding with it (the paint's move 1 about
// the same middle, the same phase): gulls sitting in a row; a lit lantern hung under the boom (the paint's kind 6:
// a steady glow, no light), swung by the boat's own rocking; a neat stack of creels and three floats; white fish
// boxes on the hatch and a row of floats along the rail; a tan sail hoisted to dry; a canvas cover tented over a
// ridge pole. Nobody aboard. few(n): the count thinned by the quality's detail.
export function boatDress(B, env, kind, dress, phase, name, few = (n) => n) {
  B.move(1, 0, 0, phase).mat(0);
  if (dress === 'gulls') { B.body(name + ': its gulls', 'gull', 0.9);
    if (kind === 'decked') for (const f of [-2.3, -1.5, -0.7].slice(0, few(3))) gull(B, 0.2, 2.93, f, 0.3, 0.954);
    else { gull(B, -0.78, 0.58, -1.15, -0.2, 0.98); if (few(3) > 2) gull(B, 0.8, 0.58, -0.75, -0.2, 0.98); gull(B, 0, 1.08, 2.8, 0.1, 0.995); }
    B.end();
  } else if (dress === 'lamp') { B.body(name + ': its lamp', 'lamp', 0.9);
    B.color('#4a4338').tube([0, 3.31, 3.4], [0, 3.02, 3.4], 0.012, 0.012, 4);
    B.color('#22262a').lathe(0, 3.4, [[0.0, 3.06], [0.16, 2.98], [0.16, 2.94]], 6);
    B.color('#111111').mat(6).lathe(0, 3.4, [[0.13, 2.94], [0.13, 2.6]], 6).mat(0);
    B.color('#22262a').lathe(0, 3.4, [[0.16, 2.6], [0.16, 2.56], [0.0, 2.5]], 6).end();
  } else if (dress === 'creels') { B.body(name + ': its creels', 'gear', 0.9);
    B.color('#6f5a3c').mat(8);
    for (const [a0, y0] of [[-0.66, 0.02], [0.02, 0.02], [-0.32, 0.42]]) B.box(a0, a0 + 0.64, y0, y0 + 0.38, 0.4, 1.25, 'wesnt');
    B.mat(0); for (const [i, a] of [-0.4, 0, 0.4].entries()) B.color(i === 1 ? '#f1eee6' : '#e07a2a').lathe(a, -1.5, [[0.0, 0.34], [0.17, 0.5], [0.0, 0.66]], 6);
    gull(B, 0, 0.8, 0.85, 0.1, 0.995); B.end();
  } else if (dress === 'boxes') { B.body(name + ': its boxes', 'gear', 0.9);
    for (let i = 0; i < 3; i++) B.color(i === 1 ? '#9db4c4' : '#efece3').box(-0.42, 0.42, 1.284 + 0.3 * i, 1.57 + 0.3 * i, 1.9, 2.6, 'wesnt');
    const rail = [[-0.6, 1.534, 1.128], [0.0, 1.55, 1.14], [0.6, 1.534, 1.163], [1.2, 1.484, 1.199]];
    for (const [i, [f, h, ys]] of rail.slice(0, few(4)).entries()) B.color(i % 2 ? '#f1eee6' : '#e07a2a').lathe(h + 0.12, f, [[0.0, ys - 0.28], [0.15, ys - 0.12], [0.0, ys + 0.04]], 6);
    B.end();
  } else if (dress === 'sail') { B.body(name + ': its sail', 'gear', 0.9);                  // an open boat's tan sail hoisted to dry, fore and aft
    const yd = [[0.07, 4.7, -1.3], [0.07, 5.15, 1.9]], ft = [[0.07, 1.25, -1.7], [0.07, 1.05, 1.75]], at = (q, u) => [q[0][0], q[0][1] + (q[1][1] - q[0][1]) * u, q[0][2] + (q[1][2] - q[0][2]) * u];
    B.color('#9a7a4a').tube([0.07, 4.66, -1.45], [0.07, 5.19, 2.05], 0.04, 0.035, 5, true);
    B.mat(7); for (let i = 0; i < 4; i++) B.color('#b5673a', i % 2 ? 0.93 : 1).quad(at(ft, i / 4), at(ft, (i + 1) / 4), at(yd, (i + 1) / 4), at(yd, i / 4), [1, 0, 0]);
    B.mat(0).end();
  } else if (dress === 'cover') { B.body(name + ': its cover', 'gear', 0.9);                // an open boat under its canvas, tented over a ridge pole
    const half = (t) => OPEN.hb * Math.pow(Math.sin(Math.PI * t), 0.7), sheer = (t) => 0.5 + 0.42 * Math.pow(Math.abs(2 * t - 1), 2.3), N = 6, rd = (t) => 1.02 + 0.2 * Math.sin(Math.PI * t);
    for (let i = 0; i < N; i++) { const t0 = 0.05 + 0.9 * i / N, t1 = 0.05 + 0.9 * (i + 1) / N, f0 = (t0 - 0.5) * OPEN.len, f1 = (t1 - 0.5) * OPEN.len;
      for (const sd of [-1, 1]) B.color('#7d8a7a', i % 2 ? 0.94 : 1).quad([sd * (half(t0) + 0.04), sheer(t0) + 0.03, f0], [sd * (half(t1) + 0.04), sheer(t1) + 0.03, f1], [0, rd(t1), f1], [0, rd(t0), f0], [sd, 1, 0]); }
    B.end(); }
  B.move(0).mat(0);
}
// END-OF-BOAT-DRESS

// ---- THE GREAT VESSEL at anchor: a three-masted sailing ship of the bay's own, a dark hull 44 m long with one white
// band (nothing lettered), a bowsprit, three masts (BARK.masts: [b along the keel, height over the water]) with
// four yards each, all braced alike, their sails furled but two hung out to dry; a long white deckhouse with dark
// windows, the anchor's chain from the bow, an open boat lying at a boom rigged out to starboard (the side she
// turns to the lane, which passes her to starboard), gulls sitting on the lower yards. In its own frame (b ahead, origin amidships); it rides the swell a little (the paint's move 6).
// Made in steps (the build rests between them). few(n): a count thinned by the quality's detail.
// HER STANDING RIGGING'S OWN SIZE (metres): each mast's SHROUDS, BARK.shroud.n a side, ropes 0.09 m through (r their
// radius), their feet along the rail, the first BARK.shroud.first m abaft the mast and one every BARK.shroud.step m
// aft of it, all meeting on the mast at BARK.shroud.head of its height (where its top would lie, just over the
// lower yard): each side's set a fan. The STAYS are ropes 0.10 m through (BARK.stay their radius). No ratlines.
// (spar: a mast's own radius at the deck and at the truck, a pole 0.68 m through tapering to 0.26 m)
export const BARK = { len: 44, hb: 4.6, masts: [[11, 30], [-1, 32.5], [-13, 28]], sprit: 6, top: 32.5, reach: 0.6, brace: 55,
  shroud: { n: 5, r: 0.045, head: 0.4, first: 0.2, step: 0.85 }, stay: 0.05, spar: [0.34, 0.13] };
const barkLines = () => { const len = BARK.len, hb = BARK.hb;
  const half = (t) => hb * Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.5), sheer = (t) => 3.5 + 1.3 * Math.pow(Math.abs(2 * t - 1), 2.2) + 0.7 * t;
  const keel = (t) => -1.5 + 2.4 * Math.pow(Math.abs(2 * t - 1), 6), deckY = (t) => sheer(t) - 1.0;
  const ring = (t) => { const h = half(t), ys = sheer(t), yk = keel(t), f = (t - 0.5) * len;
    return [[h, ys], [h, ys - 0.6], [h * 0.985, ys - 1.5], [h * 0.95, 0.35], [h * 0.74, -0.9], [0, yk]].map(([x, y]) => [x, Math.max(y, yk), f]); };
  return { len, half, sheer, deckY, ring }; };
export function* greatShip(B, env, phase, name, few = (n) => n) {
  const { len, half, sheer, deckY, ring } = barkLines(), NS = 14, DARK = '#1f2a33', WHITE = '#efece3', paint = [DARK, WHITE, DARK, DARK, '#6a2a22'];
  B.body(name, 'ship', BARK.reach).move(6, 0, 0, phase).mat(0);
  for (let i = 0; i < NS; i++) { const t0 = i / NS, t1 = (i + 1) / NS, o0 = ring(t0), o1 = ring(t1);
    for (const sd of [-1, 1]) { const F = (p) => [p[0] * sd, p[1], p[2]];
      for (let k = 0; k < 5; k++) B.color(paint[k]).quad(F(o0[k]), F(o1[k]), F(o1[k + 1]), F(o0[k + 1]), k === 4 ? [sd * 0.3, -1, 0] : [sd, 0.2, 0]);
      const i0 = [Math.max(o0[0][0] - 0.14, 0), o0[0][1], o0[0][2]], i1 = [Math.max(o1[0][0] - 0.14, 0), o1[0][1], o1[0][2]];
      B.color('#d9d2c2').quad(F(i0), F(i1), F([i1[0], deckY(t1), i1[2]]), F([i0[0], deckY(t0), i0[2]]), [-sd, 0.2, 0]);
      B.color('#c9a56a').quad(F([o0[0][0] + 0.05, o0[0][1] + 0.05, o0[0][2]]), F([o1[0][0] + 0.05, o1[0][1] + 0.05, o1[0][2]]), F([i1[0], i1[1] + 0.05, i1[2]]), F([i0[0], i0[1] + 0.05, i0[2]]), [0, 1, 0]);
      B.color('#a59576').quad(F([0, deckY(t0), i0[2]]), F([0, deckY(t1), i1[2]]), F([i1[0], deckY(t1), i1[2]]), F([i0[0], deckY(t0), i0[2]]), [0, 1, 0]); }
    if (i === 6) yield; }
  // the stem and stern post, the bowsprit, the anchor's chain; the long deckhouse and the little house aft
  B.color(DARK); for (const e of [-1, 1]) B.tube([0, sheer(0.5 + e * 0.5) + 0.3, e * (len / 2 + 0.03)], [0, 0.8, e * (len / 2 - 0.6)], 0.15, 0.18, 5);
  const bs0 = [0, sheer(1) + 0.2, len / 2 - 1.5], bs1 = [0, sheer(1) + 2.6, len / 2 + BARK.sprit];
  B.color('#b08a55').tube(bs0, bs1, 0.2, 0.1, 5, true);
  for (let i = 0; i < 8; i++) { const at = (u) => [0.6, sheer(1) - 1.0 - (sheer(1) - 0.6) * u, len / 2 - 1.0 + 3.6 * u]; B.color(i % 2 ? '#4a4d50' : '#2f3134').tube(at(i / 8), at((i + 1) / 8), 0.085, 0.085, 4); }
  for (const [g0, g1, hw, hh] of [[1.5, 8.5, 2.3, 2.2], [-20, -17, 1.8, 2.0]]) { const dk = deckY((g0 + g1) / 2 / len + 0.5);
    B.color(WHITE).mat(0).box(-hw, hw, dk, dk + hh, g0, g1, 'wesn').color('#cfc8b6').box(-hw - 0.2, hw + 0.2, dk + hh, dk + hh + 0.12, g0 - 0.2, g1 + 0.2, 'wesntu');
    B.mat(0, 0, 0); for (const sd of [-1, 1]) for (let f = g0 + 1; f < g1 - 0.4; f += 2) B.window([sd * hw, dk + hh - 0.8, f], [sd, 0, 0], 0.8, 0.6, 11, WHITE); }
  yield;
// END-OF-BARK-A
  // the three masts, each with four yards braced alike; the sails furled along their yards, two hung out to dry
  const ph = BARK.brace * Math.PI / 180, ya = Math.cos(ph), yb = Math.sin(ph), FR = [0.36, 0.55, 0.71, 0.85], HL = [9.5, 8, 6.4, 4.8], hung = [[0, 0], [1, 1]];
  for (const [mi, [mb, H]] of BARK.masts.entries()) { const t = mb / len + 0.5, dk = deckY(t), k = H / 32.5;
    B.color('#b08a55').mat(0).tube([0, dk, mb], [0, H, mb], BARK.spar[0], BARK.spar[1], 6, true);
    B.color('#c9a23a').lathe(0, mb, [[0.0, H - 0.05], [0.2, H + 0.12], [0.0, H + 0.3]], 6);
    for (let j = 0; j < 4; j++) { const y = FR[j] * H, hl = HL[j] * k, c = [0.3 * yb, y, mb + 0.3], P = (u, dy = 0) => [c[0] + ya * hl * u, y + dy, c[2] + yb * hl * u];
      B.color('#8a6a40').mat(0).tube(P(-1), P(1), 0.13, 0.13, 5, true);
      if (hung.some(([m, q]) => m === mi && q === j)) { const foot = j === 0 ? dk + 2.6 : FR[j - 1] * H + 0.5;
        B.mat(7); for (let i = 0; i < 4; i++) { const u0 = -0.96 + 1.92 * i / 4, u1 = -0.96 + 1.92 * (i + 1) / 4, f0 = P(u0 * 0.9), f1 = P(u1 * 0.9);
          B.color('#e6dcc6', i % 2 ? 0.94 : 1).quad([f0[0], foot, f0[2]], [f1[0], foot, f1[2]], P(u1, -0.1), P(u0, -0.1), [-yb, 0, ya]); }
        B.mat(0); cast(env, B, 0, mb, env.across(B.f, hl * ya * 0.9, hl * yb * 0.9), y); }
      else B.color('#e6dcc6').tube(P(-0.92, 0.24), P(0.92, 0.24), 0.23, 0.23, 5); }
    // its shrouds: a fan each side, from the rail up to the mast under where its top would lie
    B.color('#3b2f26'); const SH = BARK.shroud;
    for (const sd of [-1, 1]) for (let i = 0; i < SH.n; i++) { const g = -SH.first - SH.step * i, tt = (mb + g) / len + 0.5;
      B.tube([0, SH.head * H, mb], [sd * half(tt), sheer(tt), mb + g], SH.r, SH.r, 4, true); }
    // its shade: the mast's own blade, its mean radius and no wider. A furled yard has no blade: a spar 0.46 m
    // through with its sail, ten to thirty metres up, whose shade the lamp's round has washed out long before it
    // comes down to the water (a hung sail has its own blade, above)
    cast(env, B, 0, mb, (BARK.spar[0] + BARK.spar[1]) / 2, H * 0.98);
    yield; }
  // the stays: bowsprit to the fore head, head to mast, the mizzen's backstay
  const M = BARK.masts, rs = BARK.stay; B.color('#3b2f26');
  B.tube(bs1, [0, M[0][1], M[0][0]], rs, rs, 4, true).tube([0, M[1][1], M[1][0]], [0, 0.6 * M[0][1], M[0][0]], rs, rs, 4, true);
  B.tube([0, M[2][1], M[2][0]], [0, 0.6 * M[1][1], M[1][0]], rs, rs, 4, true).tube([0, M[2][1], M[2][0]], [0, sheer(0) + 0.3, -len / 2], rs, rs, 4, true);
  // the boat lying at the boom rigged out to starboard, and the gulls sitting on the lower yards
  const ha = half(0.57), bx = ha + 7, bz = 3;
  B.color('#b08a55').tube([ha, sheer(0.57) + 0.1, bz], [bx, 2.0, bz], 0.09, 0.07, 5, true).color('#4a4338').tube([bx, 2.0, bz], [bx, 0.6, bz + 0.4], 0.02, 0.02, 4);
  for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6, g0 = bz - 2.3 + (u0 - 0.5) * 5, g1 = bz - 2.3 + (u1 - 0.5) * 5, w0 = 0.85 * Math.pow(Math.sin(Math.PI * u0), 0.7), w1 = 0.85 * Math.pow(Math.sin(Math.PI * u1), 0.7);
    for (const sd of [-1, 1]) B.color('#efece3').quad([bx + sd * w0, 0.6, g0], [bx + sd * w1, 0.6, g1], [bx + sd * w1 * 0.6, 0.0, g1], [bx + sd * w0 * 0.6, 0.0, g0], [sd, 0.2, 0])
      .color('#c9a56a').quad([bx, 0.3, g0], [bx, 0.3, g1], [bx + sd * w1, 0.6, g1], [bx + sd * w0, 0.6, g0], [0, 1, 0]); }
  const perch = [[0, 0, 0.45], [0, 0, -0.5], [1, 0, 0.6], [1, 0, -0.3], [2, 0, 0.5], [0, 0, 0.8]].slice(0, few(6));
  for (const [mi, j, u] of perch) { const [mb, H] = M[mi], hl = HL[j] * H / 32.5, up = hung.some(([m, q]) => m === mi && q === j) ? 0.13 : 0.48;
    gull(B, 0.3 * yb + ya * hl * u, FR[j] * H + up, mb + 0.3 + yb * hl * u, -yb, ya); }
  B.end().move(0);
  for (const f of [-16, -8, 0, 8, 16]) { const t = f / len + 0.5; cast(env, B, 0, f, env.across(B.f, half(t) * 0.92, 4.2), sheer(t) - 0.15); }
}
// END-OF-BARK

// ---- THE JETTY outside the harbour mouth (the caller sets it BAY.jetty.s m past the mouth): it reaches from the harbour's side (a1, to starboard) toward the line (its
// head at a0), along the frame's a axis: a root of laid stone, then a timber deck on piles, and at its head a small
// white light with one red band (its lantern the paint's kind 6: a steady glow, no light).
export const JETTY = { top: 1.5, wide: 3.0, stone: 14, light: 5.2 };
export function jetty(B, env, a0, a1, name) {
  const w = JETTY.wide / 2, as = a1 - JETTY.stone, top = JETTY.top;
  B.body(name, 'jetty').color(STONE, 1.06).mat(4).box(as, a1 + 2, -1.4, top, -w - 0.4, w + 0.4, 'wsnt');
  B.color('#6a5a48').mat(8).box(a0, as, top - 0.2, top, -w, w, 'wsnut');
  B.color(TAR).mat(0); const n = Math.max(2, Math.round((as - a0) / 3.2));
  for (let i = 0; i <= n; i++) { const a = a0 + 0.3 + (as - a0 - 0.6) * i / n; for (const sb of [-1, 1]) B.tube([a, top + (i % 2 ? -0.2 : 0.6), sb * (w - 0.12)], [a, -1.4, sb * (w - 0.12)], 0.11, 0.11, 5, true); }
  B.end();
  const la = a0 + 1.2, y0 = top, yl = y0 + 3.3;
  B.body(name + ': its light', 'light').color('#f1eee6').mat(0).lathe(la, 0, [[0.42, y0], [0.36, y0 + 1.2]], 8).color('#b3261e').lathe(la, 0, [[0.36, y0 + 1.2], [0.32, y0 + 2.1]], 8);
  B.color('#f1eee6').lathe(la, 0, [[0.32, y0 + 2.1], [0.28, yl - 0.25], [0.5, yl - 0.1]], 8).color('#3a3d40').disc(la, yl - 0.1, 0, 0.5, 8);
  B.color('#111111').mat(6).lathe(la, 0, [[0.26, yl - 0.1], [0.26, yl + 0.5]], 8).mat(0).color('#7a1d18').lathe(la, 0, [[0.38, yl + 0.48], [0.3, yl + 0.6], [0.0, yl + 0.95]], 8).end();
  cast(env, B, (a0 + a1) / 2, 0, env.across(B.f, (a1 - a0) / 2, w), top); cast(env, B, la, 0, 0.38, yl + 0.6);
}
// ---- A RAFT OF GULLS on the water: n gulls in two even rows about the frame's origin, each riding the swell at its
// own seat like any sitting gull; as our boat's place on the route comes near they lift, wings open, and settle
// again behind it (the paint's move 8: a declared answer to the boat's place, the hero's uBoat; never the eye's).
// A wing's tip carries which side it opens to. The raft's frame is set by the caller: b away from the line.
// the seats of a raft's n gulls in the raft's own frame ([a, b]: two rows 1.8 m apart, 1.5 m from gull to gull)
export const raftSeats = (n) => Array.from({ length: n }, (_, i) => [(Math.floor(i / 2) - (Math.ceil(n / 2) - 1) / 2) * 1.5, (i % 2 ? 0.9 : -0.9) + 0.3 * (Math.floor(i / 2) % 2)]);
// reach: how far a lifted gull is carried from its seat, level (the body is marked off with it)
export function raft(B, env, n, name, reach = 0.5) {
  B.body(name, 'gull', reach).mat(0);
  for (const [a, b] of raftSeats(n)) { const fa = -0.26, fb = 0.966;
    B.move(8, a, b, 0); gull(B, a, -0.1, b, fa, fb);
    const P = (f, h) => [a + fa * f, -0.1 + h, b + fb * f];
    for (const sd of [-1, 1]) { const sn = [-fb * sd, 0, fa * sd]; B.color(sd < 0 ? '#9aa3ab' : '#aab2b9');
      B.vert(P(-0.12, 0.25), [0, 1, 0], 0, 0, null, 0); B.vert(P(0.1, 0.25), [0, 1, 0], 0, 0, null, 0); B.vert(P(-0.2, 0.24), sn, 0, 0, null, sd); } }
  B.end().move(0);
}
// END-OF-JETTY
