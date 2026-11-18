// The Wind Pagoda: a white lime base pierced by a moon gate, an octagonal timber core with nine lit galleries, nine
// still tiled eaves and between them nine counter-rotating carousel rings of battened mat sails. The same carousel
// shader drives the seven hundred mills of the town and the lugsails of its barges (the world imports
// carouselGeometry / boatGeometry / makeSailMaterial / instanceCarousels).
//
// One shader, eight kinds of vertex (attribute aK = [kind, value]):
//   0 a sail on a carousel rim (value = its angle on the ring)      1 the turning frame (value = surface id)
//   2 fixed parts in metres at R 7 (value = surface id)             3 a pennant (value = metres downwind of its staff)
//   4 a swinging bell (value = phase)                               5 a boat's lugsail at the instance origin
//   6 a chain-pump paddle (value = phase)                           7 brine spilling at the pump head (value = phase)
//   8 a thing hung from a rail and swung by the wind (value = metres below the rail + 16 x its string's number)
//   9 a wake: foam lying flat on the water behind a boat under way on the canal (colour = [across 0..1, age 0..1])
// A kind with a fraction is the same kind on a rig that folds (boatGeometry({ fold: true })): 2.03 the hull and all that is fixed to it, 2.125 the figure at the oar, 2.25 the mast and its stays,
// 2.4 the yard, 2.45 the sheets, 3.25 the masthead pennant, 5.25 the sail. Wherever such a boat is on the canal (uBridge: the bridge's x, the
// canal's z and half width) it folds its rig for the arch (and, beyond it, for as far as the world says: uRigE), the same way on both sides: coming to
// the bridge the sail comes down the mast and then the mast is laid forward over the bow, and both are down before the
// mast's head would reach the parapet (uRigW metres short of the bridge); beyond the arch the mast is raised
// uRigE metres past the bridge (the world's figure: its heel clear of the parapet, and the barge clear of the line the
// flight crosses the canal on) and then the sail. Mast 9 m of water, sail 10.5 m,
// on either side. Anywhere else these kinds are drawn exactly as kinds 2, 3 and 5, and no figure and no wake is drawn.
// On the canal such a boat also heads the way its lane runs: its instance's iSpin.x is pi plus its heading (0 = due east
// along the canal), and every part of it turns about its own middle by that much. And its sail is the one seen from
// close by and from above: set along its own hull under the yard (the head follows the yard's slope), laced to yard and
// boom, bellied square off the hull; shaded as three cloths by six panels of mat in three tones on bamboo battens.
// Surface ids: 0 plain, 1 lime wash, 2 tiles laid round the axis, 3 lit lattice, 4 stone blocks, 5 straight tiles,
//   6 planks, 7 horn lantern, 8 cloth, 9 bright water (9.5 tinted brine in a small pan), 10 lantern pane, 11 a house's lime wash, 12 raked salt,
//   13 a woven reed mat, 14 foam on the water (a wake).
// makeSailMaterial(shared, { mirror }) draws the same geometry as its image in the brine: mirrored in y = 0 and slid along
// the line of sight onto the water (see SAIL_VS), alpha-blended, masked to open brine in the fragment shader.
// carouselGeometry({ lite: true }) is the far level: masts and rings as ribbons.
// Everything answers one wind (uniform uWind, the direction it blows toward) and the gust that the world keys to u.
import * as THREE from 'three';

const C = (h) => new THREE.Color(h);

// ---- a tiny flat-shaded geometry writer ---------------------------------------------------------------------------
export class GB {
  constructor() { this.p = []; this.n = []; this.c = []; this.k = []; this.kind = 2; this.th = 0; }
  tri(a, b, c, col) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) { this.n.push(nx, ny, nz); this.c.push(col.r, col.g, col.b); this.k.push(this.kind, this.th); }
  }
  quad(a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); }
  box(cx, cy, cz, sx, sy, sz, col, ry = 0) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, cs = Math.cos(ry), sn = Math.sin(ry);
    const P = (x, y, z) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
    this.quad(v[4], v[5], v[6], v[7], col); this.quad(v[1], v[0], v[3], v[2], col);
    this.quad(v[5], v[1], v[2], v[6], col); this.quad(v[0], v[4], v[7], v[3], col);
    this.quad(v[7], v[6], v[2], v[3], col); this.quad(v[0], v[1], v[5], v[4], col);
  }
  // a bar from a to b, half-width w and half-height h
  beam(a, b, w, col, h = w) {
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    let sx, sy, sz; if (Math.abs(dy) > 0.9) { sx = 0; sy = dz; sz = -dy; } else { sx = -dz; sy = 0; sz = dx; }
    const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const ux = sy * dz - sz * dy, uy = sz * dx - sx * dz, uz = sx * dy - sy * dx;
    const c = (p, i, j) => [p[0] + sx * w * i + ux * h * j, p[1] + sy * w * i + uy * h * j, p[2] + sz * w * i + uz * h * j];
    for (const [i0, j0, i1, j1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) this.quad(c(a, i0, j0), c(a, i1, j1), c(b, i1, j1), c(b, i0, j0), col);
    this.quad(c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1), col); this.quad(c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1), col);
  }
  // upright n-gon frustum
  prism(n, r0, r1, y0, y1, col, cx = 0, cz = 0, cap = true, ph = 0) {
    for (let i = 0; i < n; i++) {
      const a0 = ph + i / n * Math.PI * 2, a1 = ph + (i + 1) / n * Math.PI * 2;
      const b0 = [cx + r0 * Math.cos(a0), y0, cz + r0 * Math.sin(a0)], b1 = [cx + r0 * Math.cos(a1), y0, cz + r0 * Math.sin(a1)];
      const t0 = [cx + r1 * Math.cos(a0), y1, cz + r1 * Math.sin(a0)], t1 = [cx + r1 * Math.cos(a1), y1, cz + r1 * Math.sin(a1)];
      this.quad(b0, t0, t1, b1, col);
      if (cap) { this.tri([cx, y1, cz], t1, t0, col); this.tri([cx, y0, cz], b0, b1, col); }
    }
  }
  // a pennant or a piece of washing: a strip that the vertex shader streams downwind of (x, y, z)
  pen(x, y, z, len, hh, col, taper = 0.45, seg = 4, s0 = 0) {
    for (let i = 0; i < seg; i++) {
      const a = i / seg, b = (i + 1) / seg, ha = hh * (1 - taper * a), hb = hh * (1 - taper * b);
      const v = [[y - ha, s0 + a * len], [y - hb, s0 + b * len], [y + hb, s0 + b * len], [y + ha, s0 + a * len]];
      for (const j of [0, 1, 2, 0, 2, 3]) { this.p.push(x, v[j][0], z); this.n.push(1, 0, 0); this.c.push(col.r, col.g, col.b); this.k.push(3, v[j][1]); }
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    const col = new THREE.Float32BufferAttribute(this.c, 3);
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', col); g.setAttribute('aCol', col);
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 2));
    return g;
  }
  // the same geometry as build(), with the page handed back (y = ctx.yield) between its big arrays
  async buildAsync(y) {
    const g = new THREE.BufferGeometry();
    const col = new THREE.Float32BufferAttribute(this.c, 3); await y();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await y();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await y();
    g.setAttribute('color', col); g.setAttribute('aCol', col);
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 2)); await y();
    return g;
  }
}

// ---- carousel: 8 sails (kind 0), the turning timber frame (kind 1, unit radius, y 0..1) and a fixed post (kind 2, metres at R 7)
const TIMBER = C('#5e4c3a'), STONE = C('#8d8a84'), RED = C('#d0481a'), WHITE = C('#ffffff'), ROPE = C('#3d3226'), HORN = C('#c9a05a');
// (lite levels can be thinned for what is far or flattened: lampCap false leaves the far lantern its four sides only, rings
// names which of the two rings are drawn, masts false and foot false leave the sails on their post: the mill beyond the haze)
export function carouselGeometry({ post = true, sx = 2, sy = 6, spokes = true, frame = TIMBER, lamps = 0, rich = false, lite = false, lampCap = true, rings = [0.0, 1.0], masts = true, foot = true } = {}) {
  const g = new GB();
  g.kind = 0;
  for (let k = 0; k < 8; k++) {
    g.th = k * Math.PI / 4;
    for (let i = 0; i < sx; i++) for (let j = 0; j < sy; j++) {
      const s0 = i / sx - 0.5, s1 = (i + 1) / sx - 0.5, t0 = j / sy, t1 = (j + 1) / sy;
      g.quad([s0, t0, 0], [s1, t0, 0], [s1, t1, 0], [s0, t1, 0], WHITE);
    }
  }
  g.kind = 1; g.th = 0;
  const len = 2 * Math.sin(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, am = a + Math.PI / 8, c = Math.cos(a), s = Math.sin(a);
    if (lite) {                                                    // the far level: each mast two crossed ribbons, each ring eight upright ribbons
      const a2 = a + Math.PI / 4, c2 = Math.cos(a2), s2 = Math.sin(a2), w = 0.022;
      if (masts) g.quad([c * (1 - w), -0.01, s * (1 - w)], [c * (1 + w), -0.01, s * (1 + w)], [c * (1 + w), 1.01, s * (1 + w)], [c * (1 - w), 1.01, s * (1 - w)], frame);
      if (masts) g.quad([c + s * w, -0.01, s - c * w], [c - s * w, -0.01, s + c * w], [c - s * w, 1.01, s + c * w], [c + s * w, 1.01, s - c * w], frame);
      for (const y of rings) g.quad([c, y - 0.022, s], [c2, y - 0.022, s2], [c2, y + 0.022, s2], [c, y + 0.022, s], frame);
    } else g.box(c, 0.5, s, 0.03, 1.02, 0.03, frame);
    for (const y of [0.0, 1.0]) {
      if (spokes) g.box(Math.cos(am) * Math.cos(Math.PI / 8), y, Math.sin(am) * Math.cos(Math.PI / 8), len, 0.022, 0.028, frame, -(am + Math.PI / 2));
      if (spokes) g.box(c / 2, y, s / 2, 1.0, 0.018, 0.022, frame, -a);
    }
    if (rich) {                                                    // a sheet to the next mast and a stay to the post head
      const a2 = a + Math.PI / 4;
      g.beam([c, 0.1, s], [Math.cos(a2), 0.52, Math.sin(a2)], 0.006, ROPE);
      g.beam([c, 1.0, s], [0, 1.2, 0], 0.006, ROPE);
    }
  }
  if (rich) {                                                      // the lantern gear under the carousel: two discs and eight rungs
    g.prism(8, 0.17, 0.17, -0.25, -0.22, frame); g.prism(8, 0.17, 0.17, -0.07, -0.04, frame);
    for (let k = 0; k < 8; k++) g.box(Math.cos(k * Math.PI / 4) * 0.14, -0.145, Math.sin(k * Math.PI / 4) * 0.14, 0.022, 0.17, 0.022, HORN);
    for (let k = 0; k < 4; k++) g.box(Math.cos(k * Math.PI / 2) * 0.3, -0.03, Math.sin(k * Math.PI / 2) * 0.3, 0.6, 0.02, 0.03, frame, -k * Math.PI / 2);
  }
  g.th = 7;                                                        // horn lanterns on the rim: dull by day, the only light at night
  for (let k = 0; k < lamps; k++) {
    const a = (k + 0.5) * Math.PI * 2 / lamps;
    if (lamps > 2) { g.prism(6, 0.02, 0.026, 0.012, 0.05, HORN, Math.cos(a), Math.sin(a), true); g.prism(6, 0.032, 0.006, 0.05, 0.062, frame, Math.cos(a), Math.sin(a), false); }
    else g.prism(4, 0.045, 0.045, 0.0, 0.085, HORN, Math.cos(a), Math.sin(a), lampCap);
  }
  if (post) {
    g.kind = 2; g.th = 4;
    if (foot) g.prism(spokes ? 8 : 4, 2.6, 2.1, 0, 1.3, STONE, 0, 0, spokes);
    g.th = 0;
    g.prism(spokes ? 6 : 4, 0.3, 0.24, 1.3, 16.2, TIMBER, 0, 0, false);
    g.pen(0, 16.0, 0, 3.2, 0.34, RED, 0.5, spokes ? 4 : 1);       // the pennant
    if (rich) {
      for (const y of [4.2, 9.5, 13.6]) g.prism(6, 0.36, 0.36, y, y + 0.22, C('#2c2c30'), 0, 0, false);   // iron bands
      // the dragon-bone chain pump: an inclined plank trough from the pan up to a head race, on two trestles
      const A = [-6.6, 0.15, 3.6], B = [-1.3, 2.5, 0.8];
      g.th = 6; g.beam(A, B, 0.42, C('#6b543a'), 0.07);
      const dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz), px = -dz / l * 0.42, pz = dx / l * 0.42;
      g.beam([A[0] + px, A[1] + 0.2, A[2] + pz], [B[0] + px, B[1] + 0.2, B[2] + pz], 0.04, TIMBER, 0.2);
      g.beam([A[0] - px, A[1] + 0.2, A[2] - pz], [B[0] - px, B[1] + 0.2, B[2] - pz], 0.04, TIMBER, 0.2);
      for (const t of [0.45, 0.92]) {
        const x = A[0] + dx * t, y = A[1] + (B[1] - A[1]) * t, z = A[2] + dz * t;
        g.beam([x + px * 1.3, 0, z + pz * 1.3], [x + px * 0.9, y + 0.5, z + pz * 0.9], 0.07, TIMBER); g.beam([x - px * 1.3, 0, z - pz * 1.3], [x - px * 0.9, y + 0.5, z - pz * 0.9], 0.07, TIMBER);
      }
      g.box(-0.4, 2.05, 0.3, 2.4, 0.5, 1.0, C('#6b543a'), 0.5);    // the head race
      g.th = 9; g.box(-0.4, 2.27, 0.3, 2.1, 0.08, 0.7, C('#cfe0e6'), 0.5);
      g.beam([-0.3, 2.3, 0.2], [0, 4.6, 0], 0.05, TIMBER);          // the shaft down from the lantern gear
      g.kind = 6;                                                  // paddles climbing the trough
      for (let i = 0; i < 9; i++) { g.th = i / 9; g.box(0, 0.26, 0, 0.12, 0.44, 0.74, C('#3f3122'), Math.atan2(-dz, dx)); }
      g.kind = 7;                                                  // brine falling from the head of the trough
      for (let i = 0; i < 4; i++) { g.th = i / 4; g.box((i % 2) * 0.24 - 0.12, 0, (i > 1 ? 0.2 : -0.2), 0.16, 0.5, 0.16, WHITE); }
      g.kind = 2; g.th = 0;                                        // (the straw hat and the blue jacket on a peg hang on one mill only: the world builds them)
    }
  }
  return g.build();
}

// ---- a flat-bottomed salt barge: a lofted hull (kind 2, metres at R 7), heap, cabin and mast, and one battened lugsail (kind 5)
// fold: the rig is written in the folding kinds (see the header), a figure sits at the sculling oar, the sail has its
// sheets and the boat trails a wake on the canal; image: the same boat without figure, sheets and wake, for the passes
// that draw its shadow and its image in the water (same instances)
export function boatGeometry({ sx = 2, sy = 6, cargo = true, mast = 13.6, boom = 2.75, fold = false, image = false } = {}) {
  const g = new GB(), hull = C('#4f3d2b'), hull2 = C('#6e563a'), tar = C('#2b241e'), deck = C('#8a6f4c'), mat = C('#b8965c'), salt = C('#F3EFE6').multiplyScalar(0.8);
  const ST = [[-11, 0.55, 0.95, 2.45], [-8.2, 1.85, 0.05, 1.6], [-3, 2.3, -0.15, 1.25], [3, 2.3, -0.15, 1.25], [8.2, 1.85, 0.05, 1.6], [11, 0.6, 1.05, 2.6]];   // x, half beam, keel y, sheer y
  g.kind = 2;
  for (let i = 0; i < 5; i++) {
    const [x0, b0, k0, s0] = ST[i], [x1, b1, k1, s1] = ST[i + 1];
    for (const sd of [-1, 1]) {
      const m0 = k0 + (s0 - k0) * 0.45, m1 = k1 + (s1 - k1) * 0.45;
      g.th = 0; g.quad([x0, k0, sd * b0 * 0.72], [x1, k1, sd * b1 * 0.72], [x1, m1, sd * b1], [x0, m0, sd * b0], tar);
      g.th = 6; g.quad([x0, m0, sd * b0], [x1, m1, sd * b1], [x1, s1, sd * b1 * 1.04], [x0, s0, sd * b0 * 1.04], hull);
      g.th = 0; g.quad([x0, s0, sd * b0 * 1.04], [x1, s1, sd * b1 * 1.04], [x1, s1, sd * b1 * 0.86], [x0, s0, sd * b0 * 0.86], hull2);   // gunwale
    }
    g.th = 6; g.quad([x0, s0 - 0.28, -b0 * 0.9], [x1, s1 - 0.28, -b1 * 0.9], [x1, s1 - 0.28, b1 * 0.9], [x0, s0 - 0.28, b0 * 0.9], deck);
    g.th = 0; g.quad([x0, k0, -b0 * 0.72], [x1, k1, -b1 * 0.72], [x1, k1, b1 * 0.72], [x0, k0, b0 * 0.72], tar);
  }
  for (const e of [0, 5]) { const [x, b, k, s] = ST[e]; g.quad([x, k, -b * 0.72], [x, k, b * 0.72], [x, s, b * 1.04], [x, s, -b * 1.04], hull2); }
  if (cargo) {                                                     // salt heaped amidships under reed matting, one end open
    g.th = 8;
    g.quad([-6.4, 1.0, -1.7], [1.2, 1.0, -1.7], [0.6, 2.25, 0], [-5.8, 2.25, 0], mat); g.quad([-6.4, 1.0, 1.7], [1.2, 1.0, 1.7], [0.6, 2.25, 0], [-5.8, 2.25, 0], mat);
    g.tri([-6.4, 1.0, -1.7], [-6.4, 1.0, 1.7], [-5.8, 2.25, 0], mat);
    g.th = 0;
    g.quad([1.2, 1.0, -1.7], [3.4, 1.0, -1.5], [2.6, 1.95, 0], [0.6, 2.25, 0], salt); g.quad([1.2, 1.0, 1.7], [3.4, 1.0, 1.5], [2.6, 1.95, 0], [0.6, 2.25, 0], salt);
    g.tri([3.4, 1.0, -1.5], [3.4, 1.0, 1.5], [2.6, 1.95, 0], salt);
  }
  g.th = 6; g.box(7.3, 1.95, 0, 2.6, 1.3, 2.9, hull2);             // the stern cabin under an arched mat roof
  g.th = 8;
  for (let i = 0; i < 4; i++) { const a0 = -1 + i * 0.5, a1 = a0 + 0.5, y = (a) => 2.6 + 0.55 * (1 - a * a), z = (a) => a * 1.65; g.quad([5.8, y(a0), z(a0)], [8.8, y(a0), z(a0)], [8.8, y(a1), z(a1)], [5.8, y(a1), z(a1)], mat); }
  g.th = 0;
  const tall = mast > 8;
  if (fold && !image) {                                            // someone at the oar: seated on the stern thwart in a blue jacket and a straw hat
    g.kind = 2.125;
    g.prism(4, 0.34, 0.3, 1.95, 2.5, C('#50556a'), 9.7, 0.3, false, 0.6); g.prism(4, 0.3, 0.24, 2.5, 3.2, C('#4668a4'), 9.7, 0.3, false, 0.6);
    g.prism(6, 0.62, 0.07, 3.22, 3.56, C('#d8b872'), 9.7, 0.3, false);
    g.kind = 2;
  }
  if (fold) g.kind = 2.25;
  g.beam([-1.6, 1.0, 0], [-1.6, mast, 0], tall ? 0.16 : 0.12, hull);            // mast
  if (fold) g.kind = 2.4;
  g.beam([tall ? -5.4 : -3.6, mast - (tall ? 1.3 : 0.75), 0.12], [tall ? 5.6 : 3.7, mast - 0.1 - (tall ? 0 : 0.3), 0.12], 0.09, hull2);     // yard
  g.kind = 2;
  g.beam([tall ? -5.2 : -3.5, boom, 0.12], [tall ? 5.4 : 3.6, boom, 0.12], 0.08, hull2);     // boom
  g.beam([9.6, 2.5, 0.5], [14.2, 0.1, 1.6], 0.07, hull2);         // the sculling oar, lashed
  if (fold) g.kind = 2.25;
  g.beam([-1.6, mast - 0.2, 0], [-10.6, 2.5, 0], 0.035, ROPE); g.beam([-1.6, mast - 0.2, 0], [10.6, 2.6, 0], 0.035, ROPE);   // stays
  g.kind = 2;
  if (fold && !image) {
    // the sheets: three lines from the leech (the boom's end and two battens above it) down to the stern, as ribbons
    g.kind = 2.45;
    for (const [x, y] of [[5.4, boom], [5.45, boom + 3.4], [5.5, boom + 6.8]]) g.quad([x, y - 0.045, 0.12], [x, y + 0.045, 0.12], [10.4, 2.75, 0.2], [10.4, 2.66, 0.2], ROPE);
    // the wake (kind 9): the bow wave's two arms spreading astern and the wash behind the stern, flat on the water; the
    // colour carries [across the ribbon 0..1, age 0..1] for the foam drawn in the fragment shader
    g.kind = 9; g.th = 14;
    const wk = (a, b, wa, wb, n, t0, t1) => {
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n, P = (f, s) => { const w = wa + (wb - wa) * f, dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [a[0] + dx * f - dz / l * w * s, 0, a[1] + dz * f + dx / l * w * s]; };
        const A0 = P(f0, -1), A1 = P(f0, 1), B0 = P(f1, -1), B1 = P(f1, 1), g0 = t0 + (t1 - t0) * f0, g1 = t0 + (t1 - t0) * f1;
        for (const [v, ac, ag] of [[A0, 0, g0], [A1, 1, g0], [B1, 1, g1], [A0, 0, g0], [B1, 1, g1], [B0, 0, g1]]) { g.p.push(v[0], v[1], v[2]); g.n.push(0, 1, 0); g.c.push(ac, ag, 0); g.k.push(9, 14); }
      }
    };
    for (const sd of [-1, 1]) wk([-9.8, sd * 1.5], [15.5, sd * 3.6], 0.45, 1.25, 3, 0, 1);
    wk([10.2, 0], [31, 0], 1.5, 2.5, 3, 0.1, 1);
    g.kind = 2; g.th = 0;
  }
  { const n0 = g.k.length; g.pen(-1.6, mast + 0.3, 0, 2.2, 0.26, RED, 0.5, 3); if (fold) for (let i = n0; i < g.k.length; i += 2) g.k[i] = 3.25; }
  if (fold) for (let i = 0; i < g.k.length; i += 2) if (g.k[i] === 2) g.k[i] = 2.03;   // (all that is fixed to a folding build's hull turns with it along the canal's lane)
  g.kind = fold ? 5.25 : 5; g.th = 0;
  for (let i = 0; i < sx; i++) for (let j = 0; j < sy; j++) {
    const s0 = i / sx - 0.5, s1 = (i + 1) / sx - 0.5, t0 = j / sy, t1 = (j + 1) / sy;
    g.quad([s0, t0, 0], [s1, t0, 0], [s1, t1, 0], [s0, t1, 0], WHITE);
  }
  return g.build();
}

export function makeSailUniforms() {
  return {
    uTime: { value: 0 }, uU: { value: 0 }, uDur: { value: 46 }, uGale: { value: 1 }, uWind: { value: new THREE.Vector2(0, -1) },
    uSun: { value: new THREE.Vector3(0.86, 0.26, -0.44).normalize() }, uSunCol: { value: C('#FFC88A').multiplyScalar(1.1) },
    uSky: { value: C('#9DB9E0').multiplyScalar(0.45) }, uGround: { value: C('#B8906A').multiplyScalar(0.4) },
    uFogCol: { value: C('#EDC690') }, uFogDens: { value: 0.0011 }, uShadowCol: { value: C('#3D4468') },
    uStraw: { value: C('#E8C078').multiplyScalar(1.6) }, uTan: { value: C('#C9A468') }, uLamp: { value: 0 },
    uCloudK: { value: 0.34 }, uSeed: { value: 0 }, uHarvest: { value: 0 }, uGust0: { value: 0.46 },   // uGust0: the u at which the gust passes z 26
    // uHard: how hard the key is (0 a low soft sun, 1 noon: less fill, no wrap, blue shade); uSide: how much the sails on a
    // carousel's far side from the sun lose; uCloudE: the cloud shadows' edge (from, to), how much fine detail breaks it, and their scale
    uHard: { value: 0 }, uSide: { value: 0.3 }, uCloudE: { value: new THREE.Vector4(0.43, 0.62, 0, 1) },
    uBridge: { value: new THREE.Vector3(-14, 36, 12) },             // the canal's bridge: its x on the canal, the canal's z and half width
    // the fold for the arch, in metres of canal from the bridge's middle: uRigE past it the mast begins to rise again;
    // uRigW short of it the mast is down (both are the world's figures: see the fold in the world file)
    uRigE: { value: 3 }, uRigW: { value: 19 },
  };
}

const SAIL_VS = /* glsl */`
attribute vec2 aK; attribute vec3 aCol; attribute vec3 iPos; attribute vec4 iDim; attribute vec4 iSpin;
uniform float uTime, uU, uDur, uGale, uShadow, uPlaneY, uMirror; uniform vec3 uSun, uBridge; uniform float uRigE, uRigW; uniform vec2 uWind;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec4 vS; varying float vG; varying vec3 vL; varying float vM; varying float vDm; varying float vO; varying float vH;
void main() {
  float d = max(uU - iSpin.z, 0.0);
  vO = 1.0; vH = 0.0;
  float q = d * d / (d + 0.012);
  float e = exp(-q / 0.07);
  float G = uDur * (0.3 * q + 0.035 * (1.0 - e));
  float gust = e * smoothstep(0.0, 0.012, d);
  float ang = iSpin.x + iSpin.y * uGale * (uTime + G);
  float dir = iSpin.y < 0.0 ? -1.0 : 1.0;
  float R = iDim.x, k = aK.x, sc = R / 7.0;
  vec3 wd = vec3(uWind.x, 0.0, uWind.y), we = vec3(-uWind.y, 0.0, uWind.x);
  vec3 p; vec3 n; float mat = aK.y; float isSail = 0.0;
  // a rig that folds for the canal's bridge (the kinds with a fraction): how far the mast stands (rigM) and the sail is
  // hoisted (rigS), from where the boat is along the canal. It sails toward -x: sail down, then mast down, before the
  // arch; mast up, then sail up, beyond it
  float rigM = 1.0, rigS = 1.0, onC = step(abs(iPos.z - uBridge.y), uBridge.z);
  if (fract(k) > 0.2) {
    float cx = iPos.x - uBridge.x;
    float cf = cx > 0.0 ? cx - uRigW : -cx - uRigE;                    // metres of water between the boat and its end of the fold
    rigM = mix(1.0, smoothstep(0.0, 9.0, cf), onC);
    rigS = mix(1.0, smoothstep(6.5, 17.0, cf), onC);
  }
  float rth = (1.0 - rigM) * 1.466, rc = cos(rth), rs = sin(rth);     // the mast lies forward at 84 degrees
  // a folding build on the canal heads the way its lane runs: yw is its heading (0 along the canal), carried in iSpin.x
  // beyond pi; every part of such a boat has a fraction in its kind, or is its wake
  float yw = (fract(k) > 0.01 || k > 8.5) ? (iSpin.x - 3.14159265) * onC : 0.0;
  float yc = cos(yw), ys = sin(yw);
  if (k < 0.5 || (k > 4.5 && k < 5.5)) {
    float rr = k < 0.5 ? R : 0.0;
    float th = ang + (k < 0.5 ? aK.y : 0.0); float c = cos(th), s = sin(th);
    float b = smoothstep(-0.28, 0.28, -dir * (c * we.x + s * we.z));
    float sv = (1.0 - b) * sin(uTime * 21.0 + iSpin.w * 40.0 + position.y * 7.0 + aK.y * 3.0) * 0.11 * (1.0 + gust);
    float psi = (1.0 - b) * 1.5708 + sv;
    vec3 sp = we * cos(psi) - wd * sin(psi);
    n = vec3(-sp.z, 0.0, sp.x);
    float sw = iDim.z, sh = iDim.w * 0.86 * mix(0.045, 1.0, rigS);    // (a lowered sail lies folded on its boom, batten on batten)
    float arc = sin(3.14159 * (position.x + 0.5));
    // a canal barge's sail (cs5) is set along its own hull, as its yard and boom are: it lies under the yard in a quartering
    // wind and while the barge turns; it bellies square off that line to leeward, and is laced to the yard and the boom
    // (hardly any belly at its head and foot, the most at half height)
    float cs5 = k > 5.1 ? onC : 0.0, lee = 1.0;
    vec3 bdir = wd;
    if (cs5 > 0.5) { sp = vec3(yc, 0.0, ys); n = vec3(-ys, 0.0, yc); lee = clamp(-dot(n, wd), -1.0, 1.0); bdir = -n * lee; }
    float prof = mix(0.55 + 0.45 * sin(3.14159 * position.y), 0.05 + 0.95 * sin(3.14159 * position.y), cs5);
    // (a boat's sail anywhere else keeps the two flat cloths it always had, hinged at the mast: the rows between are laid
    // on those two planes, and the normal runs evenly from the mast to each edge)
    float two5 = k > 5.1 ? 1.0 - cs5 : 0.0;
    float bel = b * (0.17 + 0.13 * gust) * sw * mix(arc, 1.0 - 2.0 * abs(position.x), two5) * prof * rigS;
    bel *= 1.0 + 0.12 * sin(uTime * 5.0 + iSpin.w * 30.0 + aK.y * 2.0);
    p = iPos + vec3(rr * c, iDim.y + iDim.w * 0.07 + position.y * sh, rr * s) + sp * (position.x * sw) + bdir * bel;
    // its head follows the yard, which slopes up toward the stern (the yard's line in the boat's own metres, see
    // boatGeometry): each batten row is sheared in proportion to its height, so the cloth meets the yard all along it
    p.y += cs5 * position.y * (0.473 + 1.1345 * position.x - 0.2 * (1.0 - rigS)) * sc;
    if (two5 > 0.5) n = mix(n, normalize(n - sp * (sign(position.x) * b * 0.55)), 2.0 * abs(position.x));
    else n = normalize(n + sp * (cos(3.14159 * (position.x + 0.5)) * b * 0.55 * mix(1.0, prof * lee, cs5)) + vec3(0.0, cs5 * 0.55 * cos(3.14159 * position.y) * arc * lee * b, 0.0));
    // where this sail stands on its ring, seen from the sun: 1 on the sunward side, -1 behind the other sails
    if (k < 0.5) vO = (c * uSun.x + s * uSun.z) / max(length(uSun.xz), 0.05);
    isSail = 1.0; mat = k > 5.1 ? -onC : 0.0;                           // (-1: the sail of a barge on the canal, which is seen close)
  } else if (k < 1.5) {
    float c = cos(ang), s = sin(ang);
    p = iPos + vec3(R * (position.x * c - position.z * s), iDim.y + position.y * iDim.w, R * (position.x * s + position.z * c));
    n = vec3(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);
  } else if (k < 2.5) {
    // (a mill's image in its pan: the post is drawn three times as stout, so the image of the sails hangs from the foot)
    vec3 q2 = position; if (uMirror > 0.5 && uMirror < 1.1 && aK.y < 0.5) q2.xz *= 3.0;   // (1 = a mill; a boat's image is drawn with 1.2)
    if (k > 2.05 && k < 2.2) q2 = mix(vec3(9.7, 1.95, 0.3), q2, onC);   // (only the canal's barges are manned)
    else if (k > 2.425) q2 = mix(vec3(10.4, 2.7, 0.2), q2, rigS * rigM);    // the sheets are gathered in at the stern while the rig is folded
    else if (k > 2.3) q2.y -= (1.0 - rigS) * 9.4;                         // the yard comes down the mast with its sail
    else if (k > 2.2 && q2.y > 4.0) { vec2 hd = q2.xy - vec2(-1.6, 1.6); q2.xy = vec2(-1.6, 1.6) + vec2(hd.x * rc - hd.y * rs, hd.x * rs + hd.y * rc); }   // the mast's head and the stays' upper ends go over with it
    p = iPos + vec3(q2.x * yc - q2.z * ys, q2.y, q2.x * ys + q2.z * yc) * sc; n = vec3(normal.x * yc - normal.z * ys, normal.y, normal.x * ys + normal.z * yc);
  } else if (k < 3.5) {
    vec3 q3 = position;
    if (k > 3.2) { vec2 hd = q3.xy - vec2(-1.6, 1.6); q3.xy = vec2(-1.6, 1.6) + vec2(hd.x * rc - hd.y * rs, hd.x * rs + hd.y * rc); q3.xz = vec2(q3.x * yc - q3.z * ys, q3.x * ys + q3.z * yc); }
    float s = aK.y, ph = position.x * 1.7 + position.z * 2.3 + iSpin.w * 20.0;
    float calm = 1.0 - 0.65 * gust;
    float fl = sin(uTime * 14.0 - s * 3.0 + ph) * s * 0.12 * calm + sin(uTime * 23.0 - s * 6.5 + ph * 1.7) * s * 0.04;
    float dr = -0.035 * s * s * calm + sin(uTime * 9.0 - s * 2.2 + ph) * 0.05 * s;
    p = iPos + (q3 + wd * s + we * fl + vec3(0.0, dr, 0.0)) * sc;
    n = normalize(we + wd * (cos(uTime * 14.0 - s * 3.0 + ph) * 0.45) + vec3(0.0, 0.15, 0.0));
    mat = 8.0;
  } else if (k < 4.5) {
    float rl = max(length(position.xz), 1e-3); vec3 tg = vec3(-position.z, 0.0, position.x) / rl;
    float sw = sin(uTime * 3.0 + aK.y) + 0.4 * sin(uTime * 7.3 + aK.y * 2.0);
    p = iPos + (position + tg * sw * 0.38 + wd * 0.25) * sc; n = normal; mat = 0.0;
  } else if (k < 6.5) {
    float t = fract(aK.y + uTime * 0.42 * (1.0 + 0.8 * gust));
    p = iPos + (mix(vec3(-6.6, 0.15, 3.6), vec3(-1.3, 2.5, 0.8), t) + position) * sc; n = normal; mat = 6.0;
  } else if (k < 7.5) {
    float t = fract(aK.y + uTime * 1.3);
    p = iPos + (vec3(-1.25, 2.55, 0.75) + position + vec3(0.5 * t, -2.4 * t * t, -0.5 * t)) * sc; n = normal; mat = 9.0;
  } else if (k > 8.5) {
    // a wake lies on the canal's water behind a boat under way there; it has no shadow and no image, and no boat
    // anywhere else trails one (there its corners are all drawn at one point)
    p = iPos + vec3(position.x * yc - position.z * ys, position.y, position.x * ys + position.z * yc) * sc * onC * (1.0 - step(0.5, uShadow)) * (1.0 - step(0.5, uMirror)); p.y = mix(iPos.y, 0.06, onC); n = vec3(0.0, 1.0, 0.0);
  } else {
    // hung from a rail in the gale: it leans downwind in proportion to how far below the rail it hangs, swings there and
    // jostles sideways, each string in its own time
    float hs = mod(aK.y, 16.0), ph = floor(aK.y / 16.0) * 1.31 + iSpin.w * 20.0;
    float lean = 0.30 + 0.12 * gust + 0.11 * sin(uTime * 2.3 + ph) + 0.05 * sin(uTime * 5.3 + ph * 1.7);
    float side = 0.08 * sin(uTime * 3.4 + ph * 2.3);
    p = iPos + (position + wd * (hs * lean) + we * (hs * side) + vec3(0.0, hs * 0.5 * lean * lean, 0.0)) * sc; n = normal; mat = 8.0;
  }
  vec4 wp = modelMatrix * vec4(p, 1.0);
  if (uShadow > 0.5) { float h = max(wp.y - uPlaneY, 0.0); vH = h; wp.xz -= uSun.xz * (h / max(uSun.y, 0.05)); wp.y = uPlaneY; }
  vDm = 1.0;
  if (uMirror > 0.5) {
    // an image in the brine: the point is mirrored in y = 0 (rippling more the deeper it hangs) and then slid along the
    // line of sight up onto the water, so it is drawn on the surface exactly where the eye would see it and is hidden by
    // whatever stands in front
    float hy = max(wp.y, 0.0);
    wp.x += sin(hy * 1.7 + uTime * 2.6 + wp.z * 0.31) * (uMirror > 1.5 ? 0.09 : 0.03) * hy * (1.0 + 2.0 * gust);
    wp.z += sin(hy * 2.3 - uTime * 2.1 + wp.x * 0.27) * 0.02 * hy;
    wp.y = -hy;
    float kq = max(cameraPosition.y - 0.05, 0.0) / max(cameraPosition.y - wp.y, 0.5);
    vDm = 1.0 / max(kq, 0.02);
    wp.xyz = cameraPosition + (wp.xyz - cameraPosition) * kq;
  }
  vN = mat3(modelMatrix) * n;
  vW = wp.xyz; vL = p - iPos; vC = aCol; vM = mat;
  vS = vec4(1.0 - isSail, position.x + 0.5, position.y, iSpin.w); vG = gust;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SAIL_FS = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uGround, uFogCol, uShadowCol, uStraw, uTan; uniform float uFogDens, uShadow, uShadowK, uLamp, uHaze, uFogK; uniform vec4 uClip;
uniform float uTime, uU, uMirror, uCloudK, uCloudM, uSeed, uHarvest, uHard, uSide, uEave, uGust0; uniform vec2 uWind; uniform vec4 uCloudE;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec4 vS; varying float vG; varying vec3 vL; varying float vM; varying float vDm; varying float vO; varying float vH;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  vec3 dv = cameraPosition - vW; float distS = length(dv); vec3 V = dv / max(distS, 1e-4);
  float dist = distS * vDm;                                          // an image in the brine lies further off than the water it is drawn on
  float fwB = fwidth(vS.z * 6.0);                                    // how many battens one pixel spans (taken here, outside every branch)
  float fwW = max(fwidth(vW.x), fwidth(vW.z));                       // metres of water under one pixel (for the wake's foam)
  float fwC = fwidth(vS.y * 3.0);                                    // how many of a sail's three cloths one pixel spans
  if (uMirror > 0.5) V.y = -V.y;
  float fog = 1.0 - exp(-uFogDens * uFogDens * dist * dist * uFogK);
  if (uShadow > 0.5) { if (vW.x < uClip.x || vW.x > uClip.y || vW.z < uClip.z || vW.z > uClip.w) discard;
    // under a very low sun only the foot of each mill throws a firm shadow; higher up it thins out (no rails across the pans)
    float thin = 1.0 - (1.0 - smoothstep(0.16, 0.24, uSun.y)) * smoothstep(5.0, 16.0, vH) * 0.85;
    // a thin member high above the ground throws no firm shadow (the sun is a disc): masts, rings and posts fade out with
    // their height, so the long shadows on the pans and the moat are the sails', never a fan of ruled lines
    float lineK = vS.x < 0.5 ? 1.0 : 0.8 * (1.0 - 0.9 * smoothstep(2.5, 11.0, vH));
    gl_FragColor = vec4(mix(vec3(1.0), uShadowCol, uShadowK * thin * (1.0 - fog) * lineK), 1.0); return; }
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 col;
  if (vS.x < 0.5) {
    float fs = dot(N, V) < 0.0 ? -1.0 : 1.0;
    float ndl = dot(N * fs, uSun);
    // (under a high sun a mat seen edge-on to the light still glows a little: the light scatters through the weave)
    float lit = max(ndl, 0.0), back = max(-ndl + 0.3 * uHard, 0.0) / (1.0 + 0.3 * uHard);
    vec2 uv = vS.yz;
    float near = 1.0 - smoothstep(50.0, 220.0, dist);
    float pt = h21(floor(uv * vec2(2.0, 4.0)) + floor(vS.w * 97.0));
    vec3 alb = uTan * (0.74 + 0.36 * pt) * (pt > 0.88 ? 0.62 : 1.0);
    // battens: drawn out to 420 m, each line widening and paling as it nears a pixel's width so far sails keep their bars
    float bt = abs(fract(uv.y * 6.0 + 0.5) - 0.5);
    float bw = max(0.055, 0.6 * fwB);                                 // never thinner than a pixel and a bit
    float bk = (1.0 - smoothstep(120.0, 420.0, dist)) * (1.0 - smoothstep(0.55, 1.15, fwB));
    float bd = mix(1.0, 0.5, smoothstep(0.1, 0.5, fwB)) * bk;
    float bl = (1.0 - clamp((bw - bt) / max(fwB, 0.02) + 0.5, 0.0, 1.0) * bd) / (1.0 - min(2.0 * bw, 1.0) * bd) * (1.0 - 0.11 * bk);   // wide pale bars take as much light as thin dark ones
    bl *= mix(1.0, 0.93 + 0.07 * sin(uv.x * 80.0), near * near);
    float le = min(uv.x, 1.0 - uv.x);
    bl *= smoothstep(0.0, 0.03, le) * 0.25 + 0.75;
    bl *= 0.85 + 0.15 * smoothstep(0.0, 0.16, le);                    // luff and leech darker at any distance: every sail keeps an outline
    bl = mix(bl, 1.0, step(1.5, uMirror));                           // the tower's image in the moat carries no bars
    // a canal barge's sail is seen from close by and from above: each panel of mat sags from the batten over it (shaded
    // under the batten, catching the light where it bellies), and the three cloths it is sewn from meet in two dark
    // seams; both melt away as they near a pixel's width
    float cb = step(vM, -0.5), pf = fract(uv.y * 6.0);
    bl *= mix(1.0, 0.84 + 0.26 * (1.0 - pf) * (1.0 - pf), cb * (1.0 - smoothstep(0.25, 0.8, fwB)));
    float sm3 = abs(fract(uv.x * 3.0 + 0.5) - 0.5);
    bl *= 1.0 - 0.3 * cb * (1.0 - smoothstep(0.012, 0.03 + fwC, sm3)) * (1.0 - smoothstep(0.15, 0.5, fwC));
    float shade = (0.82 + 0.18 * sin(3.14159 * uv.x)) * (0.88 + 0.16 * uv.y);   // the belly catches the light across its curve; the foot stands in the frame's shade
    // the far side of a carousel stands in the shade of the near one, and on the tower each eave shades the heads of the sails under it
    float occ = mix(1.0, smoothstep(-0.9, 0.45, vO), uSide);
    float drop = 2.3 * uSun.y / max(length(uSun.xz), 0.2);
    occ *= 1.0 - 0.65 * uEave * smoothstep(0.88 - drop / 7.6, 0.93 - drop / 7.6, uv.y) * smoothstep(-0.35, 0.25, vO);
    col = alb * bl * (mix(uGround, uSky, 0.55) * (1.0 + 0.9 * uHard) + uSunCol * lit * mix(0.95, 1.2, uHard) * shade * occ)
        + uStraw * back * (0.3 + 0.7 * bl) * (0.6 + 0.6 * pt) * (1.0 + 0.25 * vG) * (0.35 + 0.65 * occ);
    if (cb > 0.5) {
      // THE CANAL BARGE'S SAIL IS SEEN FROM FIFTEEN METRES AND FROM ABOVE: the same mat sail as the mills' and the junks',
      // drawn for that range. Three cloths by six panels, each a patch in one of the mat's three tones (weathered brown,
      // tan, bleached straw; here and there a newer, darker panel), on both faces and in every hour; the twill of the mat;
      // every bamboo batten a dark pole with a lit lip along its upper edge. Each of these melts away by how much of it one
      // pixel spans (fwB panels, fwC cloths); the battens' bars also take the fade with distance from the eye of every sail's bars above (bk and bd: 120 to 420 m). The mat is translucent: lit from in front it is
      // brown gold, against the light it glows straw through its patches, and across the belly the one passes into the
      // other without a dark crease where the sun grazes the cloth.
      vec2 pcl = min(floor(vec2(uv.x * 3.0, uv.y * 6.0)), vec2(2.0, 5.0));
      float sdl = floor(vS.w * 97.0), t1 = h21(pcl + sdl + 3.0), t2 = h21(pcl.yx * 1.7 + sdl + 11.0);
      vec3 tone = t1 < 0.36 ? vec3(0.76, 0.70, 0.62) : t1 < 0.72 ? vec3(0.97, 0.95, 0.90) : vec3(1.16, 1.13, 1.0);
      tone *= mix(vec3(1.0), vec3(0.66, 0.60, 0.52), step(0.87, t2));
      // (sun-bleached and damp places wander over the patches; the mat's twill is a fine diagonal grain, two strands to the hand)
      float coarse = 1.0 - smoothstep(0.3, 0.9, max(fwB, fwC));
      tone *= 0.9 + 0.2 * (vn(uv * vec2(7.0, 9.0) + sdl) * 0.6 + vn(uv * vec2(23.0, 5.0) + sdl) * 0.4);
      tone = mix(vec3(0.95, 0.91, 0.83), tone, coarse);
      vec2 wc = uv * vec2(88.0, 80.0); float twl = abs(fract((wc.x + floor(wc.y)) * 0.25) - 0.5) * 2.0;
      float wk = 1.0 - smoothstep(0.3, 0.9, max(fwC * 30.0, fwB * 13.5));
      float weave = mix(1.0, (0.93 + 0.14 * twl) * (0.97 + 0.06 * mod(floor(wc.y), 2.0)), wk);
      float wrap = smoothstep(-0.3, 0.3, ndl);
      vec3 ambL = mix(uGround, uSky, 0.55) * (1.0 + 0.9 * uHard);
      vec3 front = uTan * tone * (ambL + uSunCol * (0.16 + 0.84 * max(ndl, 0.0)) * wrap * mix(0.95, 1.2, uHard) * shade);
      vec3 thru = uStraw * tone * tone * ((1.0 - wrap) * (0.42 + 0.58 * max(-ndl, 0.0)) * 0.56 * (1.0 + 0.25 * vG));
      col = (front + thru) * (weave * bl);
      float bar = clamp((bw - bt) / max(fwB, 0.02) + 0.5, 0.0, 1.0) * bd, sy = fract(uv.y * 6.0 + 0.5) - 0.5;
      float lip = clamp((sy - bw * 0.55) / max(fwB, 0.02) + 0.5, 0.0, 1.0) * clamp((bw - sy) / max(fwB, 0.02) + 0.5, 0.0, 1.0) * (1.0 - smoothstep(0.03, 0.09, fwB));
      col += bar * mix(vec3(0.30, 0.22, 0.13) * (ambL + uSunCol * (0.15 + 0.35 * wrap)), vec3(0.80, 0.66, 0.42) * (ambL * 1.3 + uSunCol * (0.25 + 0.6 * wrap)), lip);
    }
    float ly = 1.0 - uv.y;
    col += vec3(1.0, 0.56, 0.2) * uLamp * (0.10 + 1.2 * ly * ly * ly) * (0.4 + 0.6 * bl);
  } else {
    float m = vM, nr = 1.0 - smoothstep(70.0, 360.0, dist);
    vec3 alb = vC; vec3 emis = vec3(0.0); float gloss = 0.0; float sunK = 1.0;
    vec2 q = vec2(vL.x + vL.z * 0.73, vL.y);
    if (m > 0.5 && m < 1.5) {                                       // lime wash: mottle, damp foot, rain streaks, faint courses
      float mo = vn(q * 0.3) * 0.6 + vn(q * 2.0) * 0.4;
      alb *= 0.88 + 0.22 * mo;
      float damp = 1.0 - smoothstep(1.0, 4.6 + 2.2 * vn(vec2(q.x * 0.45, 2.0)), vL.y);
      alb = mix(alb, alb * vec3(0.60, 0.62, 0.60), damp * 0.75);
      float st = smoothstep(0.5, 0.85, vn(vec2(q.x * 1.6, 0.5))) * (1.0 - smoothstep(0.0, 2.0 + 7.0 * vn(vec2(q.x * 0.8, 3.0)), 21.8 - vL.y));
      alb *= 1.0 - 0.32 * st;
      float st2 = smoothstep(0.42, 0.8, vn(vec2(q.x * 1.1, 7.5))) * (1.0 - smoothstep(0.0, 1.5 + 6.5 * vn(vec2(q.x * 0.6, 9.0)), 17.3 - vL.y)) * step(vL.y, 17.3);
      alb *= 1.0 - 0.24 * st2;
      alb *= 1.0 - 0.07 * nr * smoothstep(0.42, 0.5, abs(fract(vL.y / 0.6) - 0.5));
      alb *= 0.80 + 0.20 * smoothstep(0.0, 3.0, 21.9 - vL.y);          // shade gathered under the eave
      // and the eave's own shadow (it overhangs 1.6 m), as deep as the sun is high on this face
      float ed = 1.6 * uSun.y / max(dot(N, uSun), 0.12);
      sunK = 1.0 - 0.85 * smoothstep(21.75 - ed, 22.05 - ed, vL.y) * step(vL.y, 22.4);
    } else if (m < 2.5) {                                           // tiles laid round the axis
      float ax = abs(vL.x) < 1e-4 ? 1e-4 : vL.x;
      float rb = sin(atan(vL.z, ax) * 88.0);
      alb *= 1.0 + nr * (0.45 * rb - 0.1); gloss = 0.5 + 0.5 * rb * nr;
    } else if (m < 3.5) {                                           // a lit lattice: paper panes behind dark bars
      float t = vL.x * N.z - vL.z * N.x;
      vec2 lf = abs(fract(vec2(t, vL.y) / 0.62) - 0.5);
      float pane = 1.0 - smoothstep(0.30, 0.40, max(lf.x, lf.y));
      pane = mix(0.5, pane, nr);
      alb *= 0.5 + 0.5 * pane;
      emis = vec3(1.0, 0.60, 0.26) * (1.2 + 2.6 * uLamp) * pane;
    } else if (m < 4.5) {                                           // stone: blocks in running bond, or paving seen from above
      vec2 sp = N.y > 0.6 ? vL.xz / vec2(1.3, 0.8) : q / vec2(1.3, 0.55);
      sp.x += 0.5 * floor(sp.y);
      vec2 f = abs(fract(sp) - 0.5);
      float joint = smoothstep(0.44, 0.5, max(f.x, f.y));
      alb *= (0.84 + 0.3 * h21(floor(sp))) * (0.9 + 0.2 * vn(q * 1.7));
      alb *= 1.0 - 0.38 * joint * nr;
      alb = mix(alb, alb * vec3(0.66, 0.70, 0.64), (1.0 - smoothstep(0.2, 1.6, vL.y)) * step(N.y, 0.6));   // weed line at the water
      // a paved top is never one tone: salt swept into pale drifts, darker damp where the brine was carried, worn lanes
      float top = step(0.6, N.y);
      float drift = smoothstep(0.5, 0.74, vn(vW.xz * 0.21 + 3.0) * 0.6 + vn(vW.xz * 1.3) * 0.4);
      alb = mix(alb, vec3(0.72, 0.70, 0.66) * (0.9 + 0.1 * vn(vW.xz * vec2(3.0, 14.0))), 0.6 * drift * top);
      alb *= 1.0 - 0.3 * top * smoothstep(0.55, 0.8, vn(vW.xz * 0.33 + 17.0)) * (1.0 - drift);
      alb *= 1.0 - 0.2 * top * joint * nr;
    } else if (m < 5.5) {                                           // straight tile rows running down a slope
      float co = abs(N.x) > abs(N.z) ? vL.z : vL.x;
      float rb = sin(co * 12.566);
      alb *= 1.0 + nr * (0.45 * rb - 0.1); gloss = 0.5 + 0.5 * rb * nr;
    } else if (m < 6.5) {                                           // planks
      float gr = vn(vec2(q.x * 7.0 + vL.z * 5.0, q.y * 0.5));
      alb *= 0.78 + 0.4 * gr;
      alb *= 1.0 - 0.25 * nr * smoothstep(0.4, 0.5, abs(fract((vL.x + vL.z) / 0.45) - 0.5));
    } else if (m < 7.5) {                                           // horn lantern
      emis = vec3(1.0, 0.56, 0.18) * (0.25 + 3.5 * uLamp);
    } else if (m < 8.5) {                                           // cloth: lit from either side
      float nl = dot(N, uSun);
      alb *= 0.75 + 0.25 * vn(vL.xz * 3.0 + vL.y * 5.0);
      emis = alb * uSunCol * (0.45 * abs(nl) + 0.25 * max(-nl * sign(dot(N, V)), 0.0));
    } else if (m < 9.25) {
      emis = vec3(0.55, 0.60, 0.62) * (uSky + uSunCol);
    } else if (m < 9.75) {                                          // brine in a small pan: its own tint under a sheet of sky, rippling
      float rpl = vn(vW.xz * 1.7 + vec2(0.0, uTime * 1.6)) * 0.6 + vn(vW.xz * 4.3 - vec2(uTime * 0.9, 0.0)) * 0.4;
      emis = alb * (uSky * 1.5 + uSunCol * 0.9) * (0.75 + 0.5 * rpl) + uSky * 0.55 * pow(clamp(1.0 - V.y, 0.0, 1.0), 3.0); alb = vec3(0.0);
    } else if (m < 10.5) {
      emis = vec3(1.0, 0.62, 0.28) * (0.9 + 3.0 * uLamp);
    } else if (m < 11.5) {                                          // a house's lime wash: mottle, a grey damp foot, rain streaks from the eaves, patches
      float mo = vn(q * 0.45) * 0.55 + vn(q * 2.6) * 0.45;
      alb *= 0.70 + 0.50 * mo;
      float damp = 1.0 - smoothstep(2.2, 3.3 + 1.4 * vn(vec2(q.x * 0.7, 2.0)), vL.y);
      alb = mix(alb, alb * vec3(0.56, 0.58, 0.56), damp * 0.8);
      float st = smoothstep(0.45, 0.8, vn(vec2(q.x * 2.3, 0.5))) * smoothstep(2.6, 5.6, vL.y) * step(abs(N.y), 0.5);
      alb *= 1.0 - 0.26 * st;
      alb = mix(alb, alb * vec3(0.86, 0.78, 0.66), smoothstep(0.62, 0.78, vn(q * 0.23 + 11.0)) * 0.6);      // ochre where the wash has gone
      alb *= 1.0 - 0.06 * nr * smoothstep(0.42, 0.5, abs(fract(vL.y / 0.5) - 0.5));
      // weather on every wall: long grey rain stains under the eaves and copings, green-grey lichen creeping up from the
      // foot, and here and there a patch where the plaster has fallen and the grey brick shows in courses
      float wall = step(abs(N.y), 0.5);
      float run = smoothstep(0.38, 0.75, vn(vec2(q.x * 3.1, 4.0)) * 0.6 + vn(vec2(q.x * 9.0, vL.y * 0.35)) * 0.4) * smoothstep(1.6, 4.4, vL.y);
      alb = mix(alb, alb * vec3(0.62, 0.64, 0.68), 0.42 * run * wall);
      float lich = (1.0 - smoothstep(2.0, 4.6 + 1.6 * vn(vec2(q.x * 1.3, 6.0)), vL.y)) * smoothstep(0.35, 0.7, vn(q * vec2(1.7, 0.9) + 5.0));
      alb = mix(alb, alb * vec3(0.52, 0.58, 0.46), 0.5 * lich * wall);
      float fallen = smoothstep(0.69, 0.74, vn(q * 0.42 + 23.0) * 0.8 + vn(q * 1.9) * 0.2) * wall * step(vL.y, 6.2);
      vec2 bk2 = vec2(q.x / 0.62 + 0.5 * floor(vL.y / 0.24), vL.y / 0.24), bf2 = abs(fract(bk2) - 0.5);
      vec3 brick = vec3(0.34, 0.33, 0.33) * (0.8 + 0.4 * h21(floor(bk2))) * (1.0 - 0.4 * nr * smoothstep(0.38, 0.5, max(bf2.x, bf2.y)));
      alb = mix(alb, brick, fallen * 0.9);
    } else if (m > 13.5) {                                          // a wake: foam left on the water, torn by the ripples, thinning with age and toward its edges
      float lat = abs(vC.r * 2.0 - 1.0), age = clamp(vC.g, 0.0, 1.0);
      float fz = vn(vW.xz * vec2(0.8, 1.9) + vec2(0.0, uTime * 0.7)) * 0.6 + vn(vW.xz * vec2(2.4, 4.6) - vec2(uTime * 0.9, 0.0)) * 0.4;
      fz = mix(0.42, fz, 1.0 - smoothstep(0.25, 0.9, fwW));               // (grain finer than a pixel melts into an even foam)
      if (fz > (1.0 - age * age) * (1.0 - lat * lat) * 0.92) discard;
      alb = vec3(0.0); emis = vec3(0.78, 0.77, 0.74) * (uSky + uSunCol * (uSun.y * 1.7 / (0.75 + uSun.y))) * (0.82 + 0.3 * fz);
    } else if (m > 12.5) {                                          // a woven reed mat: a twill of two tones bound on bamboo battens
      vec2 mq = abs(N.y) > 0.75 ? vL.xz : vec2((vL.x * N.z - vL.z * N.x) / max(length(N.xz), 0.2), vL.y / max(length(N.xz), 0.2));
      float wk = 1.0 - smoothstep(16.0, 70.0, dist);
      vec2 wc = mq / 0.26; float chk = mod(floor(wc.x) + floor(wc.y), 2.0);
      float strand = chk > 0.5 ? abs(fract(wc.x * 3.0) - 0.5) : abs(fract(wc.y * 3.0) - 0.5);
      alb *= mix(1.0, (0.86 + 0.26 * chk) * (0.88 + 0.24 * strand), wk);
      alb *= 0.84 + 0.3 * vn(mq * 0.7 + 3.0);                                                                   // sun-bleached and damp patches
      float bat = abs(fract(mq.y / 0.95 + 0.5) - 0.5) * 0.95;
      alb = mix(alb, vec3(0.30, 0.22, 0.13), (1.0 - smoothstep(0.035, 0.07, bat)) * nr * 0.85);
      alb *= 0.9 + 0.1 * smoothstep(0.07, 0.16, bat);
    } else {                                                        // raked salt: fine grooves round the heap, grey in the hollows, a glint on the crests
      float gr = sin(vL.y * 21.0 + vn(vec2(q.x * 0.8, vL.y * 0.6)) * 5.0);
      float gn = vn(q * 3.1) * 0.6 + vn(q * 0.6 + 4.0) * 0.4;
      alb *= (0.93 + 0.07 * gr * nr) * (0.88 + 0.2 * gn);
      alb = mix(alb, alb * vec3(0.80, 0.82, 0.92), (1.0 - smoothstep(0.0, 1.6, vL.y - 1.5)) * 0.5);
      gloss = 0.25 * nr * smoothstep(0.6, 0.9, vn(q * 9.0));
    }
    float l = max(dot(N, uSun), 0.0) * sunK;
    // a low sun wraps round and the fill is strong; at noon (uHard) the fill drops, the wrap goes and the shade turns blue
    vec3 amb = mix(uGround, uSky, N.y * 0.5 + 0.5) * mix(2.1, 1.7, uHard);
    amb = mix(amb, amb * vec3(0.74, 0.90, 1.24), uHard * (1.0 - smoothstep(0.0, 0.25, l)));
    vec3 light = amb + uSunCol * (l + mix(0.17, 0.03, uHard) * (1.0 - N.y * N.y));
    light += uGround * 1.1 * (1.0 - smoothstep(0.0, 16.0, abs(vL.y))) * (1.0 - l);        // light thrown up off the salt and the water
    light = max(light, vec3(0.12));
    vec3 Rf = reflect(-V, N);
    col = alb * light + emis + uSunCol * gloss * 0.35 * pow(max(dot(Rf, uSun), 0.0), 14.0) + (uSky + uSunCol * 0.2) * gloss * 0.22 * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
  }
  float hz = uHaze * smoothstep(130.0, 1100.0, dist);
  col = mix(col, dot(col, vec3(0.3, 0.5, 0.2)) * vec3(0.74, 0.72, 0.90), min(1.0, 1.5 * hz)) * (1.0 - 0.25 * min(1.0, 2.0 * hz));
  fog = mix(fog, 1.0, hz * hz);
  // cloud shadows racing down the wind, the same field the pans and the dyke use
  vec2 cq = vW.xz - uSun.xz * (max(vW.y, 0.0) / max(uSun.y, 0.2));
  vec2 cw = vec2(-cq.x * uWind.y + cq.y * uWind.x, -cq.x * uWind.x - cq.y * uWind.y + uTime * 18.0) * uCloudE.w;
  float cs = smoothstep(uCloudE.x, uCloudE.y, vn(cw * 0.0042) * 0.7 + vn(cw * 0.011) * 0.3 + (vn(cw * 0.034) - 0.5) * uCloudE.z);
  col *= mix(vec3(1.0), uShadowCol * 2.4, uCloudK * uCloudM * cs);
  col = mix(col, uFogCol, fog);
  float alpha = 1.0;
  if (uMirror > 0.5) {
    // where the image may lie: on open brine only, not on a bank, a crust rim or a dry harvest pan; broken into bars by
    // the ripples, wiped out by the gust, lost with distance and when looked straight down on
    vec2 p = vW.xz;
    vec2 gq = vec2(p.x / 64.0, (p.y - 26.0) / 44.0); vec2 id = floor(gq), f = fract(gq);
    float e = min(min(f.x, 1.0 - f.x) * 64.0, min(f.y, 1.0 - f.y) * 44.0);
    float dO = min(abs(p.y - 36.0) - 12.0, max(abs(p.x) - 130.0, max(p.y + 100.0, -330.0 - p.y)));
    float open = step(dO, 0.0);
    e = mix(min(e, dO), 1.7 - dO, open);
    vec2 gid = floor(id * 0.5 + (vn(id * 0.37 + uSeed) - 0.5) * 1.6);
    float along = (p.y > 100.0 && abs(p.x) < 64.0) || (p.y < 24.0 && p.y > -106.0 && p.x > -64.0 && p.x < 128.0) ? 1.0 : 0.0;   // as in the pan shader
    float hv = uHarvest * step(h21(gid + 17.3), 0.33) * (1.0 - along) * (1.0 - open);
    vec2 pw = vec2(-p.x * uWind.y + p.y * uWind.x, -p.x * uWind.x - p.y * uWind.y);
    float d = p.y - (26.0 - 2070.0 * (uU - uGust0));
    float band = smoothstep(0.0, 6.0, d) * (1.0 - smoothstep(34.0, 120.0, d));
    float brk = vn(vec2(pw.x * 0.5, pw.y * 2.2 + uTime * 3.2)) * 0.65 + vn(vec2(pw.x * 1.7, pw.y * 6.0 + uTime * 5.0)) * 0.35;
    // close under the eye an image is all ripple: cut into dashes and melting out at each sail's own edges, never a flat pane
    float nearM = (1.0 - smoothstep(12.0, 50.0, distS)) * step(uMirror, 1.5);
    float dash = mix(0.42 + 0.58 * smoothstep(0.25, 0.6, brk), smoothstep(0.36, 0.64, brk) * 0.9, nearM);
    // the post, the masts and the rings carry steadily (a dark stem from the mill's foot down to the image of its sails)
    float stem = step(0.5, vS.x) * step(uMirror, 1.5);
    dash = mix(dash, 0.86 + 0.14 * brk, 0.8 * stem);
    alpha = mix(smoothstep(1.9, 4.4, e), smoothstep(1.3, 2.4, e), stem) * (1.0 - hv) * dash * (1.0 - 0.8 * band);
    if (vS.x < 0.5) alpha *= mix(1.0, smoothstep(0.0, 0.2, min(vS.y, 1.0 - vS.y)) * smoothstep(0.0, 0.12, min(vS.z, 1.0 - vS.z)), nearM);
    alpha *= (1.0 - smoothstep(190.0, 360.0, distS)) * (0.55 + 0.45 * (1.0 - V.y * V.y)) * mix(0.72, 0.42, smoothstep(50.0, 200.0, distS)) * (1.0 - 0.2 * open) * uMirror * (1.0 + 0.3 * stem);
    if (uMirror > 1.5) {
      // the tower's image keeps to its moat, and only its sails and lanterns carry: gold bars the ripples cut into dashes
      alpha *= 1.0 - smoothstep(-14.0, -3.0, max(abs(p.x) - 130.0, max(p.y + 100.0, -330.0 - p.y)));
      alpha *= (vS.x < 0.5 || (vM > 6.5 && vM < 7.5)) ? 0.2 + 0.8 * smoothstep(0.38, 0.62, brk) : 0.0;
      // each sail's image melts out toward its own edges and half into the moat's own tone: soft gold dashes, never patches
      if (vS.x < 0.5) {
        alpha *= smoothstep(0.0, 0.22, min(vS.y, 1.0 - vS.y)) * smoothstep(0.0, 0.15, min(vS.z, 1.0 - vS.z));
        col = mix(col, uSky + uSunCol * 0.5, 0.5 * (1.0 - 0.6 * min(uLamp, 1.0)));
      }
      alpha = min(alpha, uSun.y > 0.5 ? 0.3 : 0.5);
    }
    alpha = clamp(alpha, 0.0, 0.9);
    col *= vec3(0.80, 0.84, 0.92);
  }
  gl_FragColor = vec4(col, alpha);
}`;

export function makeSailMaterial(shared, { shadow = false, planeY = 0.06, clip = [-1e5, 1e5, -1e5, 1e5], haze = 0, strength = 0.5, tan = null, fogK = 1, mirror = false, eave = 0, cloud = 1 } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...(tan ? { uTan: { value: C(tan) } } : {}), uShadow: { value: shadow ? 1 : 0 }, uMirror: { value: mirror === true ? 1 : +mirror || 0 }, uShadowK: { value: strength }, uFogK: { value: fogK }, uHaze: { value: haze }, uEave: { value: eave }, uCloudM: { value: cloud }, uPlaneY: { value: planeY }, uClip: { value: new THREE.Vector4(...clip) } },
    vertexShader: SAIL_VS, fragmentShader: SAIL_FS, side: THREE.DoubleSide,
  });
  if (shadow) {
    m.transparent = true; m.depthWrite = false; m.blending = THREE.MultiplyBlending;
    m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -6;
  }
  if (mirror) { m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -6; }
  return m;
}

// items: [{ x, y, z, R, y0, w, h, phase, omega, arrive, seed }]
export function instanceCarousels(base, items) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  const n = items.length, P = new Float32Array(n * 3), D = new Float32Array(n * 4), S = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const m = items[i];
    P.set([m.x, m.y, m.z], i * 3); D.set([m.R, m.y0, m.w, m.h], i * 4); S.set([m.phase, m.omega, m.arrive, m.seed], i * 4);
  }
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(P, 3));
  g.setAttribute('iDim', new THREE.InstancedBufferAttribute(D, 4));
  g.setAttribute('iSpin', new THREE.InstancedBufferAttribute(S, 4));
  g.instanceCount = n;
  return g;
}
export const ONE = [{ x: 0, y: 0, z: 0, R: 7, y0: 0, w: 1, h: 1, phase: 0, omega: 1, arrive: 9, seed: 0 }];

const PENNANT_VS = /* glsl */`
uniform float uTime, uGale; uniform vec2 uWind; varying vec3 vW; varying float vA; varying float vV;
void main() {
  float a = position.z;                                   // 0 at the staff .. 1 at the tail
  vec3 wd = vec3(uWind.x, 0.0, uWind.y), we = vec3(-uWind.y, 0.0, uWind.x);
  float w = sin(a * 9.0 - uTime * 11.0) * 0.9 + sin(a * 21.0 - uTime * 17.0) * 0.35;
  vec3 p = wd * (a * 14.0) + we * (w * a * (1.3 - 0.25 * uGale));
  p.y = position.y + sin(a * 6.0 - uTime * 7.0) * a * 0.8 - a * a * 2.0;
  vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vA = a; vV = cos(a * 9.0 - uTime * 11.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PENNANT_FS = /* glsl */`
uniform vec3 uFogCol, uSunCol, uSky; uniform float uFogDens; varying vec3 vW; varying float vA; varying float vV;
void main() {
  float dist = length(cameraPosition - vW);
  vec3 col = vec3(0.85, 0.16, 0.02) * (uSky * 1.2 + uSunCol * (0.75 + 0.35 * vV));
  float fog = 1.0 - exp(-uFogDens * uFogDens * dist * dist);
  gl_FragColor = vec4(mix(col, uFogCol, fog * 0.8), 1.0);
}`;

export async function buildHero(ctx, opts = {}) {
  const shared = opts.uniforms || makeSailUniforms();
  const object = new THREE.Group(); object.name = 'wind-pagoda';
  const lime = C('#F3EFE6').multiplyScalar(0.8), tile = C('#33373c'), fascia = C('#202326'), stone = C('#8d8a84'), stoneLt = C('#a39f97');
  const timber = C('#5a4230'), lacquer = C('#8a3a24'), bronze = C('#b08a3c'), dark = C('#30261f'), pane = C('#e6c890'), sill = C('#6f6c66');
  const g = new GB();
  const S = (id) => { g.th = id; };
  // island: a stepped stone revetment, paved on top, with a balustrade and two flights of steps down to the water
  S(4);
  g.box(0, 0.56, -2, 64, 1.1, 50, stone); g.box(0, 0.22, -2, 67, 0.44, 53, stone.clone().multiplyScalar(0.8));
  const post = (x, z) => { g.box(x, 1.75, z, 0.36, 1.3, 0.36, stoneLt); g.box(x, 2.47, z, 0.52, 0.14, 0.52, stone); g.prism(4, 0.3, 0.05, 2.54, 2.86, stoneLt, x, z, false, Math.PI / 4); };
  const rail = (a, b) => { g.beam([a[0], 2.2, a[1]], [b[0], 2.2, b[1]], 0.11, stoneLt, 0.09); g.beam([a[0], 1.55, a[1]], [b[0], 1.55, b[1]], 0.07, stone, 0.07); };
  for (const sx of [-1, 1]) {
    const xs = [2.6, 5.8, 9.0, 12.2, 16.0, 19.2, 22.4, 25.6, 28.6, 31.4];      // a gap at 12.2 .. 16 for the steps
    for (let i = 0; i < xs.length; i++) { post(sx * xs[i], 22.4); if (i < xs.length - 1 && i !== 3) rail([sx * xs[i], 22.4], [sx * xs[i + 1], 22.4]); }
    for (let i = 1; i <= 8; i++) { post(sx * 31.4, 22.4 - i * 3.3); rail([sx * 31.4, 22.4 - (i - 1) * 3.3], [sx * 31.4, 22.4 - i * 3.3]); }
    for (let s = 0; s < 4; s++) g.box(sx * 14.1, 0.85 - s * 0.26, 23.3 + s * 0.62, 3.2, 0.3, 0.62, stoneLt);
  }
  await ctx.yield();
  // base wall 44 x 22 x 30: front face (z = 15) is a polar fan round the moon gate
  const W = 22, H = 22, ZF = 15, GC = 7.0, GR = 7.5;
  const angs = [];
  for (let i = 0; i < 64; i++) angs.push(i / 64 * Math.PI * 2);
  for (const [x, y] of [[W, H - GC], [-W, H - GC], [-W, -GC], [W, -GC]]) angs.push((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2));
  angs.sort((a, b) => a - b); angs.push(angs[0] + Math.PI * 2);
  const outer = (a) => { const c = Math.cos(a), s = Math.sin(a); const t = Math.min(W / Math.max(Math.abs(c), 1e-6), (s > 0 ? H - GC : GC) / Math.max(Math.abs(s), 1e-6)); return [c * t, GC + s * t]; };
  for (let i = 0; i < angs.length - 1; i++) {
    const a0 = angs[i], a1 = angs[i + 1], c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const o0 = outer(a0), o1 = outer(a1), R1 = GR + 1.2, R2 = GR + 1.9;
    const m0 = [c0 * R1, GC + s0 * R1], m1 = [c1 * R1, GC + s1 * R1], n0 = [c0 * R2, GC + s0 * R2], n1 = [c1 * R2, GC + s1 * R2];
    S(1); g.quad([m0[0], m0[1], ZF], [o0[0], o0[1], ZF], [o1[0], o1[1], ZF], [m1[0], m1[1], ZF], lime);
    // voussoir band, standing 0.3 m proud, inside a raised carved moulding
    S(0); const vs = i % 2 ? stone : stone.clone().multiplyScalar(0.84);
    g.quad([c0 * GR, GC + s0 * GR, ZF + 0.3], [m0[0], m0[1], ZF + 0.3], [m1[0], m1[1], ZF + 0.3], [c1 * GR, GC + s1 * GR, ZF + 0.3], vs);
    g.quad([m0[0], m0[1], ZF + 0.5], [n0[0], n0[1], ZF + 0.5], [n1[0], n1[1], ZF + 0.5], [m1[0], m1[1], ZF + 0.5], stoneLt);
    g.quad([m0[0], m0[1], ZF + 0.5], [m0[0], m0[1], ZF + 0.3], [m1[0], m1[1], ZF + 0.3], [m1[0], m1[1], ZF + 0.5], sill);
    g.quad([n0[0], n0[1], ZF + 0.5], [n0[0], n0[1], ZF], [n1[0], n1[1], ZF], [n1[0], n1[1], ZF + 0.5], sill);
    // the tunnel behind it, darkening inward
    g.quad([c1 * GR, GC + s1 * GR, ZF + 0.3], [c1 * GR, GC + s1 * GR, 2], [c0 * GR, GC + s0 * GR, 2], [c0 * GR, GC + s0 * GR, ZF + 0.3], dark);
    g.tri([0, GC, 2], [c0 * GR, GC + s0 * GR, 2], [c1 * GR, GC + s1 * GR, 2], dark);
    if (i % 16 === 15) await ctx.yield();
  }
  await ctx.yield();
  S(0);
  for (let b = 0; b < 16; b++) {                                    // bronze bosses on the moulding, a keystone at the crown
    const a = (b + 0.5) / 16 * Math.PI * 2, r = GR + 1.55, y = GC + Math.sin(a) * r;
    if (y > 5.2) g.box(Math.cos(a) * r, y, ZF + 0.62, 0.42, 0.42, 0.24, bronze, 0);
  }
  g.box(0, GC + GR + 1.0, ZF + 0.5, 1.5, 2.3, 0.7, stoneLt);
  S(1);
  g.box(-W - 0.01, 10.5, 0, 0.5, 23, 30, lime); g.box(W + 0.01, 10.5, 0, 0.5, 23, 30, lime); g.box(0, 10.5, -15, 44, 23, 0.5, lime);
  g.box(0, 22.0, 0, 44, 0.4, 30, lime);
  // a tiled eave with a 1.6 m overhang, a lacquered beam and bracket blocks under it
  const EX = W + 1.6, EZ = ZF + 1.6, IX = W - 4, IZ = ZF - 4, EY = 22.5, RY = 24.5;
  S(5);
  g.quad([-EX, EY, EZ], [EX, EY, EZ], [IX, RY, IZ], [-IX, RY, IZ], tile); g.quad([EX, EY, -EZ], [-EX, EY, -EZ], [-IX, RY, -IZ], [IX, RY, -IZ], tile);
  g.quad([EX, EY, EZ], [EX, EY, -EZ], [IX, RY, -IZ], [IX, RY, IZ], tile); g.quad([-EX, EY, -EZ], [-EX, EY, EZ], [-IX, RY, IZ], [-IX, RY, -IZ], tile);
  S(0);
  g.quad([-IX, RY, IZ], [IX, RY, IZ], [IX, RY, -IZ], [-IX, RY, -IZ], fascia);
  g.quad([-EX, EY, EZ], [EX, EY, EZ], [EX, EY - 0.45, EZ], [-EX, EY - 0.45, EZ], fascia); g.quad([-EX, EY, -EZ], [EX, EY, -EZ], [EX, EY - 0.45, -EZ], [-EX, EY - 0.45, -EZ], fascia);
  g.quad([EX, EY, EZ], [EX, EY, -EZ], [EX, EY - 0.45, -EZ], [EX, EY - 0.45, EZ], fascia); g.quad([-EX, EY, EZ], [-EX, EY, -EZ], [-EX, EY - 0.45, -EZ], [-EX, EY - 0.45, EZ], fascia);
  S(6);
  g.quad([-EX, EY - 0.45, EZ], [EX, EY - 0.45, EZ], [W, 22.0, ZF], [-W, 22.0, ZF], timber); g.quad([EX, EY - 0.45, EZ], [EX, EY - 0.45, -EZ], [W, 22.0, -ZF], [W, 22.0, ZF], timber);
  g.quad([-EX, EY - 0.45, EZ], [-EX, EY - 0.45, -EZ], [-W, 22.0, -ZF], [-W, 22.0, ZF], timber);
  S(0);
  g.box(0, 21.2, ZF + 0.2, 44.6, 0.6, 0.45, lacquer); g.box(0, 20.82, ZF + 0.16, 44.4, 0.14, 0.4, bronze);
  for (let b = -10; b <= 10; b++) { g.box(b * 2.1, 21.72, ZF + 0.7, 0.55, 0.42, 1.3, lacquer); g.box(b * 2.1, 21.72, ZF + 1.2, 0.9, 0.3, 0.4, timber); }
  for (const sx of [-1, 1]) {
    g.box(sx * (W + 0.2), 21.2, 0, 0.45, 0.6, 30.4, lacquer);
    for (let b = -6; b <= 6; b++) g.box(sx * (W + 0.7), 21.72, b * 2.2, 1.3, 0.42, 0.55, lacquer);
    for (const sz of [-1, 1]) {                                     // upturned corners: a curved hip rafter
      let p0 = [sx * EX, EY - 0.1, sz * EZ];
      for (let s = 1; s <= 5; s++) { const t = s / 5, p1 = [sx * (EX + 2.6 * t), EY - 0.1 + 1.9 * t * t, sz * (EZ + 2.6 * t)]; g.beam(p0, p1, 0.34 - 0.04 * s, fascia, 0.2); p0 = p1; }
      g.kind = 4; g.th = sx * 2 + sz; g.prism(6, 0.34, 0.2, EY + 0.5, EY + 1.3, bronze, sx * (EX + 2.5), sz * (EZ + 2.5), true); g.kind = 2; g.th = 0;
    }
  }
  await ctx.yield();
  // the north face: stone pilasters either side of the gate bay, a round lattice window and a carved stone panel in each
  // side bay, a frieze of bronze studs under the string course
  for (const sx of [-1, 1]) {
    S(4); g.box(sx * 11.4, 10.8, ZF + 0.22, 1.1, 13.2, 0.44, stoneLt); S(0); g.box(sx * 11.4, 17.0, ZF + 0.3, 1.7, 0.5, 0.6, stone); g.box(sx * 11.4, 4.5, ZF + 0.3, 1.6, 0.6, 0.6, stone);
    const mx = sx * 16.3, my = 11.6, mr = 2.3;
    for (let i = 0; i < 20; i++) {
      const a0 = i / 20 * Math.PI * 2, a1 = (i + 1) / 20 * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      S(3); g.tri([mx, my, ZF + 0.06], [mx + c0 * mr, my + s0 * mr, ZF + 0.06], [mx + c1 * mr, my + s1 * mr, ZF + 0.06], pane);
      S(0); g.quad([mx + c0 * mr, my + s0 * mr, ZF + 0.34], [mx + c0 * (mr + 0.6), my + s0 * (mr + 0.6), ZF + 0.34], [mx + c1 * (mr + 0.6), my + s1 * (mr + 0.6), ZF + 0.34], [mx + c1 * mr, my + s1 * mr, ZF + 0.34], i % 2 ? stoneLt : stone);
      g.quad([mx + c0 * mr, my + s0 * mr, ZF + 0.34], [mx + c1 * mr, my + s1 * mr, ZF + 0.34], [mx + c1 * mr, my + s1 * mr, ZF + 0.06], [mx + c0 * mr, my + s0 * mr, ZF + 0.06], sill);
    }
    g.box(mx, my, ZF + 0.14, 0.14, mr * 2, 0.12, timber); g.box(mx, my, ZF + 0.14, mr * 2, 0.14, 0.12, timber);
    S(5); g.quad([mx - 3.3, my + 3.2, ZF + 1.1], [mx + 3.3, my + 3.2, ZF + 1.1], [mx + 3.0, my + 3.75, ZF], [mx - 3.0, my + 3.75, ZF], tile);
    S(0); g.box(mx, my + 3.1, ZF + 0.5, 6.4, 0.2, 1.0, fascia);
    S(4); g.box(mx, 6.6, ZF + 0.12, 7.4, 2.5, 0.24, stoneLt); S(0); g.box(mx, 6.6, ZF + 0.2, 6.6, 1.8, 0.2, stone.clone().multiplyScalar(0.86));
    for (let b = -2; b <= 2; b++) g.prism(4, 0.5, 0.5, 6.25, 6.95, stoneLt, mx + b * 1.25, ZF + 0.2, false, 0);
    for (let b = 0; b < 7; b++) g.box(sx * (13.2 + b * 1.15), 16.5, ZF + 0.12, 0.4, 0.4, 0.2, bronze);
  }
  for (let b = -7; b <= 7; b++) if (Math.abs(b) > 1) g.box(b * 1.3, 16.9, ZF + 0.12, 0.34, 0.34, 0.2, bronze);
  // a string course, six lattice windows under little tiled hoods, stone quoins, a stone plinth
  g.box(0, 17.6, ZF + 0.2, 44.8, 0.5, 0.7, fascia); g.box(0, 17.2, ZF + 0.12, 44.4, 0.26, 0.4, bronze);
  for (const sx of [-1, 1]) {
    for (let w = 0; w < 3; w++) {
      const x = sx * (5 + w * 5.6);
      S(3); g.box(x, 19.55, ZF + 0.08, 1.7, 2.1, 0.2, pane);
      S(0); g.box(x, 18.42, ZF + 0.16, 2.3, 0.2, 0.45, stoneLt); g.box(x, 19.55, ZF + 0.12, 0.1, 2.1, 0.3, timber);
      S(5); g.quad([x - 1.4, 20.75, ZF + 1.0], [x + 1.4, 20.75, ZF + 1.0], [x + 1.2, 21.0, ZF], [x - 1.2, 21.0, ZF], tile);
    }
    S(4); g.box(sx * 21.1, 11.5, ZF + 0.2, 1.8, 20.4, 0.5, stoneLt);
    g.box(sx * 15.6, 2.5, ZF + 0.35, 12.6, 2.8, 0.7, stone.clone().multiplyScalar(0.8)); g.box(sx * 15.6, 4.05, ZF + 0.4, 12.9, 0.34, 0.9, stoneLt);
    // a stone lantern and a pennant pole either side of the gate
    const lx = sx * 10.6, lz = ZF + 5.2;
    g.box(lx, 1.35, lz, 1.5, 0.5, 1.5, stone); g.prism(6, 0.42, 0.34, 1.6, 3.5, stoneLt, lx, lz, false); g.box(lx, 3.62, lz, 1.4, 0.26, 1.4, stone);
    S(10); g.prism(6, 0.58, 0.58, 3.75, 4.6, pane, lx, lz, false);
    S(2); g.prism(6, 1.2, 0.16, 4.6, 5.35, tile, lx, lz, true);
    S(0); g.prism(6, 0.16, 0.05, 5.35, 5.8, stoneLt, lx, lz, true);
    for (let c = 0; c < 6; c++) g.box(lx + Math.cos(c * Math.PI / 3) * 0.58, 4.17, lz + Math.sin(c * Math.PI / 3) * 0.58, 0.1, 0.86, 0.1, stone);
    const px = sx * 17.4, pz = ZF + 6.0;
    S(4); g.box(px, 1.5, pz, 1.1, 0.8, 1.1, stone);
    S(0); g.prism(6, 0.16, 0.1, 1.9, 11.2, timber, px, pz, false); g.prism(6, 0.22, 0.22, 11.2, 11.55, bronze, px, pz, true);
    g.pen(px, 10.4, pz, 5.0, 0.62, RED, 0.55, 6); g.pen(px, 9.2, pz, 2.6, 0.2, C('#f0e2c0'), 0.3, 4);
    g.kind = 2; g.th = 0;
  }
  await ctx.yield();
  // core, galleries, eaves and finial
  const Y0 = 24, PITCH = 10, rcAt = (y) => 8.2 - 4.0 * (y - (Y0 - 1)) / 92;
  S(6); g.prism(8, 8.2, 4.2, Y0 - 1, Y0 + 9 * PITCH + 1, timber, 0, 0, true, Math.PI / 8);
  const rings = [];
  for (let k = 0; k < 9; k++) {
    const f = k / 8, R = 17 - 8 * f, yb = Y0 + k * PITCH, ye = yb + PITCH - 1.4, re = R + 2.3, rg = rcAt(yb) + 2.3;
    S(6); g.prism(8, rg + 0.25, rg + 0.25, yb + 0.5, yb + 0.8, timber, 0, 0, true, Math.PI / 8);          // gallery floor
    g.prism(8, rg, rg, yb + 0.8, yb + 1.75, lacquer, 0, 0, false, Math.PI / 8);                         // balustrade
    S(0); g.prism(8, rg + 0.1, rg + 0.1, yb + 1.75, yb + 1.95, C('#a07850'), 0, 0, false, Math.PI / 8);
    for (let j = 0; j < 8; j++) {
      const a = j * Math.PI / 4, ac = a + Math.PI / 8, ym = yb + 4.6, apo = rcAt(ym) * Math.cos(Math.PI / 8), fw = 2 * rcAt(ym) * Math.sin(Math.PI / 8);
      S(3); g.box(Math.cos(a) * (apo + 0.1), ym, Math.sin(a) * (apo + 0.1), fw * 0.62, 4.4, 0.3, pane, Math.PI / 2 - a);       // lattice window
      S(0); g.box(Math.cos(a) * (apo + 0.16), ym + 2.35, Math.sin(a) * (apo + 0.16), fw * 0.72, 0.3, 0.4, lacquer, Math.PI / 2 - a);
      g.box(Math.cos(ac) * (rg - 0.05), (yb + 0.8 + ye) / 2, Math.sin(ac) * (rg - 0.05), 0.42, ye - yb - 0.8, 0.42, lacquer, -ac);   // column
    }
    S(0);
    g.prism(8, re + 0.3, re, ye - 0.7, ye + 1.5, fascia, 0, 0, false, Math.PI / 8);          // the still dark eave: a deep fascia wider than the ring
    S(2); g.prism(8, re, 5.4 - 2.2 * f, ye + 1.5, ye + 2.1, tile, 0, 0, true, Math.PI / 8);    // the tiled roof skirt above it
    S(6); g.prism(8, re + 0.25, rcAt(ye) + 0.2, ye, ye - 0.35, C('#6a3a28'), 0, 0, false, Math.PI / 8);   // soffit
    S(0); g.prism(8, re + 0.32, re + 0.32, ye + 1.5, ye + 1.72, bronze, 0, 0, false, Math.PI / 8);   // sunlit bronze edge line
    for (let j = 0; j < 8; j++) {                                                   // curved hip rafters and bronze wind bells
      const a = Math.PI / 8 + j * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
      let p0 = [ca * (re - 1.0), ye + 1.1, sa * (re - 1.0)];
      for (let s = 1; s <= 5; s++) { const t = s / 5, r = re - 1.0 + 4.0 * t, p1 = [ca * r, ye + 1.1 + 2.3 * t * t, sa * r]; g.beam(p0, p1, 0.36 - 0.045 * s, fascia, 0.24 - 0.02 * s); p0 = p1; }
      g.kind = 4; g.th = j * 1.9 + k * 0.7;
      g.prism(6, 0.34, 0.18, ye + 1.5, ye + 2.4, bronze, ca * (re + 2.7), sa * (re + 2.7), true);
      g.kind = 2; g.th = 0;
    }
    // a staff on every upturned corner of every storey: a lit horn lantern on it and, wherever the cloth streams clear of
    // the sails of the storey above (so not from the corners that face the wind), a long banner in persimmon red or gold
    {
      const wv = shared.uWind.value, len = 7.6 - 3.0 * f;
      for (let j = 0; j < 8; j++) {
        const a = Math.PI / 8 + j * Math.PI / 4, r = re + 4.1, x = Math.cos(a) * r, z = Math.sin(a) * r, y = ye + 3.2;
        S(0); g.prism(4, 0.09, 0.06, y, y + 3.4, timber, x, z, false);
        S(10); g.prism(5, 0.5, 0.56, y + 0.5, y + 1.5, pane, x, z, false);
        S(0); g.prism(5, 0.72, 0.1, y + 1.5, y + 1.85, fascia, x, z, false);
        if (Math.hypot(x + wv.x * len, z + wv.y * len) > R + 4.2 && Math.hypot(x + wv.x * len * 0.5, z + wv.y * len * 0.5) > R + 4.2)
          g.pen(x, y + 2.9, z, len, 0.62 - 0.2 * f, (j + k) % 2 ? RED : C('#e2b23c'), 0.5, 4);
        g.kind = 2; g.th = 0;
      }
    }
    const period = 16 - 7 * f, dir = k % 2 ? -1 : 1;
    rings.push({ x: 0, y: 0, z: 0, R, y0: yb + 0.4, w: 9.6 - 4.4 * f, h: 7.9 - 1.2 * f,   // the sail heads stop under the eave's soffit
      phase: k * 1.37, omega: dir * Math.PI * 2 / period,
      arrive: (opts.gustU0 ?? 0.46) + 0.16 + 0.06 * f, seed: 0.13 + k * 0.091 });
    await ctx.yield();
  }
  const yt = Y0 + 9 * PITCH + 1;
  for (let j = 0; j < 5; j++) g.prism(8, 1.5 - j * 0.24, 1.3 - j * 0.24, yt + j * 1.6, yt + j * 1.6 + 1.1, bronze);
  g.prism(6, 0.16, 0.1, yt, yt + 11, bronze, 0, 0, false);
  // (a cloud's shadow crosses the tower at under half strength: the hero dims as it passes and is never put out)
  await ctx.yield();
  const sailMat = makeSailMaterial(shared, { tan: '#C39248', fogK: 0.3, eave: 1, cloud: 0.45 });
  const staticBase = await g.buildAsync(() => ctx.yield());
  await ctx.yield();
  const staticGeo = instanceCarousels(staticBase, ONE);
  await ctx.yield();
  // what casts the tower's shadow: only faces the light meets first, so the flattened image is one layer deep and never crushes to black
  const sg = new GB(), sun = shared.uSun.value, hl = Math.hypot(sun.x, sun.z) || 1, qx = -sun.z / hl, qz = sun.x / hl, wx = sun.x >= 0 ? W : -W, wz = sun.z >= 0 ? ZF : -ZF;
  sg.quad([wx, 1.1, -ZF], [wx, 1.1, ZF], [wx, 23, ZF], [wx, 23, -ZF], WHITE); sg.quad([-W, 1.1, wz], [W, 1.1, wz], [W, 23, wz], [-W, 23, wz], WHITE);
  sg.quad([-EX, 23, -EZ], [EX, 23, -EZ], [EX, 23, EZ], [-EX, 23, EZ], WHITE);
  sg.quad([-qx * 7.6, 23.1, -qz * 7.6], [qx * 7.6, 23.1, qz * 7.6], [qx * 4.0, yt, qz * 4.0], [-qx * 4.0, yt, -qz * 4.0], WHITE);
  sg.quad([-qx * 1.2, yt, -qz * 1.2], [qx * 1.2, yt, qz * 1.2], [qx * 0.4, yt + 8, qz * 0.4], [-qx * 0.4, yt + 8, -qz * 0.4], WHITE);
  for (let k = 0; k < 9; k++) {
    const ye = Y0 + (k + 1) * PITCH - 0.6, re = 17 - k + 2.6, ri = rcAt(ye) + 0.3;
    for (let j = 0; j < 8; j++) {
      const a0 = Math.PI / 8 + j * Math.PI / 4, a1 = a0 + Math.PI / 4;
      sg.quad([Math.cos(a0) * ri, ye, Math.sin(a0) * ri], [Math.cos(a0) * re, ye, Math.sin(a0) * re], [Math.cos(a1) * re, ye, Math.sin(a1) * re], [Math.cos(a1) * ri, ye, Math.sin(a1) * ri], WHITE);
    }
  }
  const shadowGeo = instanceCarousels(sg.build(), ONE);
  const staticMesh = new THREE.Mesh(staticGeo, sailMat); staticMesh.name = 'pagoda-static'; staticMesh.frustumCulled = false;
  object.add(staticMesh);
  await ctx.yield();

  // the nine rings, their frames in pale weathered timber so the carousels read against the core, eight horn lanterns on each
  const ringGeo = instanceCarousels(carouselGeometry({ post: false, sx: 3, sy: 6, spokes: true, frame: C('#8a6a48'), lamps: 8 }), rings);
  const ringMesh = new THREE.Mesh(ringGeo, sailMat); ringMesh.frustumCulled = false; ringMesh.name = 'pagoda-rings';
  object.add(ringMesh);
  await ctx.yield();

  // the long swallow-tailed pennant
  const pg = new GB(); const N = 28;
  for (let i = 0; i < N; i++) {
    const a0 = i / N, a1 = (i + 1) / N; const h0 = 1.3 - 0.5 * a0, h1 = 1.3 - 0.5 * a1;
    const n0 = a0 > 0.75 ? (a0 - 0.75) * 2.6 : 0, n1 = a1 > 0.75 ? (a1 - 0.75) * 2.6 : 0;   // the swallow-tail notch
    pg.quad([0, n0, a0], [0, n1, a1], [0, h1, a1], [0, h0, a0], WHITE);
    pg.quad([0, -h0, a0], [0, -h1, a1], [0, -n1, a1], [0, -n0, a0], WHITE);
  }
  const pennMat = new THREE.ShaderMaterial({ uniforms: shared, vertexShader: PENNANT_VS, fragmentShader: PENNANT_FS, side: THREE.DoubleSide });
  const pennant = new THREE.Mesh(pg.build(), pennMat); pennant.position.set(0, yt + 9.5, 0); pennant.frustumCulled = false; pennant.name = 'pagoda-pennant';
  object.add(pennant);

  return {
    object, radius: 34, height: yt + 11, center: new THREE.Vector3(0, 60, 0),
    anchors: { gate: new THREE.Vector3(0, GC, ZF), portal: new THREE.Vector3(0, GC, ZF - 2), deckY: GC - 2.4, top: new THREE.Vector3(0, yt, 0) },
    uniforms: shared, rings, ringGeometry: ringGeo, staticGeometry: staticGeo, shadowGeometry: shadowGeo, staticMesh, ringMesh, pennant,
    update(dt, time) { if (!opts.uniforms) shared.uTime.value = time; },
    dispose() {}, ground: true, groundY: 0,
  };
}
