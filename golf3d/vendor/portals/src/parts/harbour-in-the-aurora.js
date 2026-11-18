// A Harbour in the Aurora: THE CITY (hero part). One object in its own frame: origin at the middle of the harbour
// mouth at sea level (y 0), the open sea and the ice toward +Z (south), the town toward -Z, +X east. The world's sea
// surface (y 0) is the world's: no water is built here. A low harbour city on flat land round an oval basin: quays,
// two breakwaters, a market arcade, courtyard houses, palms, and many slender towers of five kinds, none the master.
// Laid out by our own plan (below); traced from no real city. Seeded: houses, paints, tower kinds and trim, palms.
import * as THREE from 'three';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';

const SURF = S.SURF, L = S.lin, TAU = Math.PI * 2;
const CORRIDOR = [[0, 18, 0], [-8, 20, -95], [18, 25, -180], [80, 32, -245], [160, 36, -235], [205, 36, -165], [210, 33, -90], [210, 30, -20]];
const RING = [210, 30, -20], BASIN = { x: 0, z: -95, a: 120, b: 85 }, QUAY_Y = 2.2;
const TOWN = { x0: -330, x1: 360, z0: -360 };
const TRI_CAP = 224000;                                                // the city's share is 230,000 triangles
// THE TOWERS, fixed for every seed: x, z, height above the sea, width of the shaft. Seen from the sea they stand in four
// clusters (x about -260, -100, +140, +285), each with tall ones close together, and lower stretches between and over the mouth.
const TOWERS = [
  [-310, -120, 62, 5.5], [-292, -235, 104, 9], [-268, -62, 90, 7.5], [-250, -170, 114, 8.5], [-232, -300, 78, 7.5], [-212, -92, 60, 6],
  [-188, -240, 68, 6], [-176, -40, 50, 6], [-160, -150, 56, 6], [-150, -320, 64, 6], [-318, -300, 48, 6], [-236, -30, 100, 8],
  [-262, -338, 92, 7], [-128, -160, 106, 9],
  [-118, -232, 118, 9], [-96, -305, 94, 7.5], [-70, -215, 100, 8.5], [-42, -270, 80, 7], [-18, -335, 56, 5.5], [-14, -204, 62, 6.5],
  [14, -228, 70, 6.5], [40, -300, 74, 6.5], [62, -262, 54, 6.5], [74, -198, 64, 6.5], [104, -292, 92, 7], [126, -200, 104, 9],
  [70, -345, 58, 6], [150, -338, 82, 6.5],
  [134, -276, 86, 8], [150, -185, 116, 9], [194, -252, 66, 6], [238, -158, 52, 6], [176, -120, 108, 8.5], [252, -104, 64, 6],
  [186, -42, 72, 7], [246, -30, 76, 7], [234, -70, 58, 5.5], [170, -62, 98, 8.5],
  [290, -130, 112, 8.5], [318, -52, 60, 5.5], [300, -230, 94, 8.5], [338, -170, 66, 6.5], [262, -292, 102, 7.5], [330, -300, 50, 6],
  [222, -318, 60, 6], [284, -8, 86, 7], [128, -150, 96, 8.5],
];
// THE DOMES, fixed: x, z, dome diameter, front (1: on the harbour front, a taller hall and a high drum)
const DOMES = [
  [31, -253, 16, 0], [100, -208, 22, 0], [248, -132, 18, 0], [172, -92, 14, 0],
  [-60, -246, 26, 0], [-222, -140, 24, 0], [-275, -270, 18, 0], [-170, -282, 20, 0], [-284, -40, 20, 1], [12, -312, 22, 0],
  [176, -300, 20, 0], [300, -90, 28, 1], [286, -262, 16, 0], [328, -232, 14, 0], [-128, -206, 16, 0], [118, -322, 14, 0],
  [-207, -46, 30, 1], [-160, -52, 14, 1], [152, -70, 14, 1], [322, -22, 18, 1],
];
const hallHalf = (d) => d * 0.5 + 3.5, hallWall = (d, f) => (f ? 12 + d * 0.15 : 8 + d * 0.2), drumH = (d, f) => (f ? 4.5 + d * 0.1 : 3 + d * 0.08), domeRise = (d) => d * 0.56;
const GARDEN = { x0: -196, x1: -138, z0: -128, z1: -66 };                          // the palm garden (west quay)
const MARKET = { x0: -78, x1: 58, z0: -209, z1: -197, h: 7.6 };                    // the market hall (north quay); arcade on its south face
const BW = { root: [150, -34], knee: [126, 14], head: [45, 0] };                    // east breakwater's middle line (the west one mirrors it)

// uniform Catmull-Rom through 2D points, at most n samples per span and about one every 6 m
function chain(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(1, Math.min(n, Math.ceil(len / 6)));
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
// THE WATERFRONT: the line where land meets water, from the far west shore round the basin to the far east shore.
// Returns { pts, i0, i1 }: the stretch i0..i1 is the harbour's own quay (root to root), the rest is the sea wall.
function waterfront() {
  const aS = 0.262, E = (a) => [BASIN.x + BASIN.a * Math.cos(a), BASIN.z + BASIN.b * Math.sin(a)];
  const west = chain([[-1600, -40], [-800, -40], [-450, -36], [-350, -28], [-305, -18], [-262, -10], [-215, -8], [-182, -18], [-163, -27], [-150, -34], [-138, -44], [-126, -56], E(Math.PI - aS)], 8);
  const arc = [], n = 150;
  for (let i = 1; i < n; i++) arc.push(E(Math.PI - aS + (Math.PI + 2 * aS) * i / n));
  const east = chain([E(aS), [126, -56], [138, -44], [150, -34], [162, -24], [176, -10], [192, 4], [210, 12], [236, 14], [264, 11], [300, 3], [340, -9], [400, -22], [520, -34], [800, -40], [1600, -40]], 8);
  const pts = [...west, ...arc, ...east];
  let i0 = 0, i1 = pts.length - 1, d0 = Infinity, d1 = Infinity;
  pts.forEach((p, i) => { const a = Math.hypot(p[0] + 150, p[1] + 34), c = Math.hypot(p[0] - 150, p[1] + 34); if (a < d0) { d0 = a; i0 = i; } if (c < d1) { d1 = c; i1 = i; } });
  return { pts, i0, i1, a0: west.length - 1, a1: west.length + arc.length };
}
const segDist = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
function polyDist(px, pz, poly) {
  let d = Infinity;
  for (let i = 0; i < poly.length - 1; i++) { const a = poly[i], b = poly[i + 1]; if (Math.min(a[0], b[0]) - d > px || Math.max(a[0], b[0]) + d < px) continue; const e = segDist(px, pz, a[0], a[1], b[0], b[1]); if (e < d) d = e; }
  return d;
}
function inPoly(px, pz, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pz) !== (b[1] > pz) && px < (b[0] - a[0]) * (pz - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
const bez = (t) => { const u = 1 - t; return [u * u * BW.root[0] + 2 * u * t * BW.knee[0] + t * t * BW.head[0], u * u * BW.root[1] + 2 * u * t * BW.knee[1] + t * t * BW.head[1]]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t];

// ---------------------------------------------------------------- paints (linear), from the brief's palette
const PAINT = {
  walls: ['#fbf7ee', '#f3e3c3', '#e9c9a0', '#e7b3a0'].map((c) => mul(L(c), 0.8)),      // white, cream, ochre, rose
  stone: mul(L('#e8dcc4'), 0.78), stoneDark: mul(L('#cdbf9f'), 0.72), rubble: mul(L('#b9ab90'), 0.74), blue: mul(L('#2f6fae'), 0.9),
  white: mul(L('#fbf7ee'), 0.86), tile: L('#3aa7b8'), brick: L('#c9773f'), wood: L('#8a6a48'), jar: L('#b8683c'), rope: L('#c9b27c'),
  roof: [mul(L('#e8dcc4'), 0.8), mul(L('#e3d2b4'), 0.78), mul(L('#d8c4a2'), 0.8)], earth: mul(L('#d9c7a2'), 0.8), sand: mul(L('#d6bf94'), 0.82), paving: mul(L('#c8ad84'), 0.74), flag: mul(L('#e6dcc6'), 0.8), terra: mul(L('#cf9a76'), 0.8),
  towerWalls: ['#f6efe0', '#f0d9ae', '#e6bd8a', '#e3a890', '#d99a6c'].map((c) => mul(L(c), 0.8)),      // white, cream, ochre, rose, terracotta
};
const pickWall = (rng) => { const r = rng(); return PAINT.walls[r < 0.36 ? 0 : r < 0.66 ? 1 : r < 0.85 ? 2 : 3]; };
const pickWarm = (rng) => { const r = rng(); return PAINT.walls[r < 0.15 ? 0 : r < 0.4 ? 1 : r < 0.74 ? 2 : 3]; };   // the harbour front: more ochre and rose, they hold against a pale sky

// ---------------------------------------------------------------- small pieces
// a low wall round a flat roof: outer faces, inner faces and the top (24 triangles)
function parapet(b, x0, z0, x1, z1, y, h, t) {
  const y1 = y + h, X0 = x0 + t, X1 = x1 - t, Z0 = z0 + t, Z1 = z1 - t;
  b.wall(x0, z1, x1, z1, y, y1); b.wall(x1, z1, x1, z0, y, y1); b.wall(x1, z0, x0, z0, y, y1); b.wall(x0, z0, x0, z1, y, y1);
  b.wall(X1, Z1, X0, Z1, y, y1); b.wall(X1, Z0, X1, Z1, y, y1); b.wall(X0, Z0, X1, Z0, y, y1); b.wall(X0, Z1, X0, Z0, y, y1);
  b.quad([x0, y1, z1], [x1, y1, z1], [X1, y1, Z1], [X0, y1, Z1]); b.quad([x1, y1, z1], [x1, y1, z0], [X1, y1, Z0], [X1, y1, Z1]);
  b.quad([x1, y1, z0], [x0, y1, z0], [X0, y1, Z0], [X1, y1, Z0]); b.quad([x0, y1, z0], [x0, y1, z1], [X0, y1, Z1], [X0, y1, Z0]);
}
// a blue door on a wall whose outward normal is (sin yaw, 0, cos yaw)
function door(b, x, y, z, yaw, w = 1.3, h = 2.3, step = false) {
  // the step is a low threshold no wider than the door's frame (a slab too low and too short to read as a seat)
  if (step) { b.surf(SURF.MASONRY, 0, 1).col(PAINT.stone, 0.9, 1); b.tr(x, y, z, yaw); b.box(-w / 2 - 0.12, 0, 0, w / 2 + 0.12, 0.17, 0.5, { m: 1 }); b.pop(); }
  const c = Math.cos(yaw), s = Math.sin(yaw), ox = s * 0.07, oz = c * 0.07, rx = c * w / 2, rz = -s * w / 2;
  b.surf(SURF.PLAIN).col(PAINT.blue, 0.62, 1);
  b.quad([x - rx + ox, y, z - rz + oz], [x + rx + ox, y, z + rz + oz], [x + rx + ox, y + h, z + rz + oz], [x - rx + ox, y + h, z - rz + oz]);
}
// a wall of round arches from A to B (outward normal (-dz, dx)), T thick: front face, soffits and jambs
function archWall(b, ax, az, bx, bz, y0, ySp, yTop, n, pier, T, m = 8) {
  const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux, bw = len / n, R = (bw - pier) / 2;
  const F = (s, y) => [ax + ux * s, y, az + uz * s], B = (s, y) => [ax + ux * s - nx * T, y, az + uz * s - nz * T];
  for (let i = 0; i < n; i++) {
    const s0 = i * bw, sa = s0 + pier / 2, sb = s0 + bw - pier / 2, cx = s0 + bw / 2;
    b.quad(F(s0, y0), F(sa, y0), F(sa, yTop), F(s0, yTop)); b.quad(F(sb, y0), F(s0 + bw, y0), F(s0 + bw, yTop), F(sb, yTop));
    for (let k = 0; k < m; k++) {
      const a0 = Math.PI * k / m, a1 = Math.PI * (k + 1) / m, x0 = cx - R * Math.cos(a0), x1 = cx - R * Math.cos(a1), y0a = ySp + R * Math.sin(a0), y1a = ySp + R * Math.sin(a1);
      b.quad(F(x0, y0a), F(x1, y1a), F(x1, yTop), F(x0, yTop));
      b.quad(F(x1, y1a), F(x0, y0a), B(x0, y0a), B(x1, y1a));
    }
    b.quad(F(sa, y0), B(sa, y0), B(sa, ySp), F(sa, ySp)); b.quad(B(sb, y0), F(sb, y0), F(sb, ySp), B(sb, ySp));
  }
}
// a plain earthen pot, about 0.75 m tall at scale 1 (24 triangles)
function pot(b, x, y, z, s) { b.surf(SURF.PLAIN).col(PAINT.jar, 0.72, 1.05); b.lathe(x, y, z, [[0.2 * s, 0], [0.42 * s, 0.4 * s], [0.3 * s, 0.75 * s]], 6); }
// a round well: a stone ring and dark water (no posts or beam over it: no frame that could read as furniture from the air)
function well(b, x, y, z) {
  b.surf(SURF.MASONRY, 0, 0.8).col(PAINT.stone, 0.8, 1); b.lathe(x, y, z, [[1.4, 0], [1.4, 0.85], [1.05, 0.85], [1.05, 0.3]], 10, { m: 1 });
  b.surf(SURF.PLAIN).col([0.03, 0.09, 0.11]); b.disc(x, y + 0.35, z, 1.05, 10, true);
}
// a low domed cistern on a square base
function cistern(b, x, y, z) {
  b.surf(SURF.MASONRY, 0, 0.9).col(PAINT.stone, 0.8, 1); b.cbox(x, y, z, 3.2, 0.9, 3.2, { m: 1 });
  b.surf(SURF.PLAIN).col(PAINT.white, 0.85, 1.05); b.lathe(x, y + 0.9, z, [[1.35, 0], [1.2, 0.5], [0.75, 0.95], [0, 1.15]], 8, { smooth: true });
}
// a water jar (terracotta), about 1.1 m tall at scale 1
function jar(b, x, y, z, s) {
  b.surf(SURF.PLAIN).col(PAINT.jar, 0.7, 1.05);
  b.lathe(x, y, z, [[0.18 * s, 0], [0.43 * s, 0.34 * s], [0.45 * s, 0.6 * s], [0.25 * s, 0.92 * s], [0.3 * s, 1.08 * s]], 6, { smooth: true });
}
// one flat-roofed house: walls with shuttered windows (the kit's shader), a parapet and a roof terrace
function house(b, rng, x0, z0, x1, z1, floors, wallC, rich, far) {
  const fh = 3.2, H = floors * fh + 0.3, ph = 0.65 + rng() * 0.45;
  if (far) {
    b.surf(rng.chance(0.62) ? SURF.ARCHED : SURF.WINDOW, rng(), 0).col(wallC, 0.78, 1); b.box(x0, 0, z0, x1, H + ph, z1, { cellW: 3.3, cellH: fh, rows: floors, top: false });
    b.surf(SURF.PLAIN).col(wallC, 1.05, 1.05); b.quad([x0, H + ph, z1], [x1, H + ph, z1], [x1, H + ph, z0], [x0, H + ph, z0]);
    b.col(rng.pick(PAINT.roof), 0.9, 0.9); b.quad([x0 + 0.3, H + ph + 0.03, z1 - 0.3], [x1 - 0.3, H + ph + 0.03, z1 - 0.3], [x1 - 0.3, H + ph + 0.03, z0 + 0.3], [x0 + 0.3, H + ph + 0.03, z0 + 0.3]);
    return H + ph;
  }
  b.surf(rng.chance(0.62) ? SURF.ARCHED : SURF.WINDOW, rng(), 0).col(wallC, 0.78, 1);
  b.box(x0, 0, z0, x1, H, z1, { cellW: 3.3, cellH: fh, top: false });
  if (floors >= 4) { b.surf(SURF.PLAIN).col(wallC, 1, 1.08); b.box(x0 - 0.14, fh + 0.16, z0 - 0.14, x1 + 0.14, fh + 0.46, z1 + 0.14, {}); b.box(x0 - 0.14, H - fh - 0.14, z0 - 0.14, x1 + 0.14, H - fh + 0.16, z1 + 0.14, {}); }
  if (rich) { b.surf(SURF.PLAIN).col(PAINT.stone, 0.95, 1.05); b.box(x0 - 0.2, H - 0.3, z0 - 0.2, x1 + 0.2, H - 0.04, z1 + 0.2, {}); }
  b.surf(SURF.PLAIN).col(wallC, 1, 1.06); parapet(b, x0, z0, x1, z1, H, ph, 0.28);
  b.col(rng.pick(PAINT.roof), 1, 1); b.quad([x0 + 0.28, H + 0.03, z1 - 0.28], [x1 - 0.28, H + 0.03, z1 - 0.28], [x1 - 0.28, H + 0.03, z0 + 0.28], [x0 + 0.28, H + 0.03, z0 + 0.28]);
  const w = x1 - x0, d = z1 - z0;
  let head = false;
  if (Math.min(w, d) > 5 && rng.chance(0.45)) {                       // the stair head on the roof, with its blue door
    const sx = rng.sign(), sz = rng.sign(), cx = (x0 + x1) / 2 + sx * (w / 2 - 1.7), cz = (z0 + z1) / 2 + sz * (d / 2 - 1.9);
    b.col(wallC, 0.9, 1.04); b.cbox(cx, H, cz, 2.5, 2.3, 2.9); door(b, cx - sx * 1.25, H, cz, -sx * Math.PI / 2, 0.9, 1.9); head = true;
  }
  if (!head && Math.min(w, d) > 5.5 && rng.chance(rich ? 0.45 : 0.12)) {   // a low whitewashed roof cupola (a cube with a little dome), only on a roof that has no stair head: its dice are drawn for such a roof alone
    const cx = (x0 + x1) / 2 + rng.range(-0.1, 0.1) * w, cz = (z0 + z1) / 2 + rng.range(-0.1, 0.1) * d, e = Math.min(2.6, Math.min(w, d) - 3.2);
    // (no frame of posts and slats stands on any roof: nothing there that could read as furniture from the air)
    b.surf(SURF.PLAIN).col(PAINT.white, 0.86, 1.05); b.cbox(cx, H, cz, e, 1.45, e); b.lathe(cx, H + 1.45, cz, [[e * 0.44, 0], [e * 0.38, 0.42], [e * 0.22, 0.74], [0, 0.86]], 8, { smooth: true });
  }
  if (rng.chance(rich ? 0.6 : 0.2)) { const n = rng.int(1, 3); for (let i = 0; i < n; i++) jar(b, x0 + 1 + rng() * (w - 2), H + 0.03, z0 + 0.9 + rng() * 0.5, rng.range(0.8, 1.15)); }
  return H + ph;
}
// a block of houses round a small court (front toward +Z in the block's frame), lo to hi floors. o.arcade: a walk of round
// arches along the front; o.solid: one warehouse instead of a court. Returns { court: [x, z, size] | null, top }
function courtBlock(b, rng, W, D, lo, hi, o = {}) {
  const hw = W / 2, hd = D / 2, fz = o.arcade ? hd - 3.3 : hd, De = fz + hd, t = Math.max(5.2, Math.min(7.6, Math.min(W, De) * 0.3)), pick = o.warm ? pickWarm : pickWall, base = pick(rng), alt = pick(rng), out = { court: null, top: 0 };
  const floors = () => lo + Math.min(hi - lo, Math.floor(rng() * rng() * (hi - lo + 1) * 1.5));
  const paint = () => mul(rng.chance(0.66) ? base : alt, 0.94 + rng() * 0.1);
  const put = (x0, z0, x1, z1, f) => { const H = house(b, rng, x0, z0, x1, z1, f ?? floors(), paint(), o.rich, o.far); if (H > out.top) out.top = H; return H; };
  const balc = (x, y, z) => {                                         // a small balcony on the front (+Z): slab, two brackets, posts and rails
    b.surf(SURF.PLAIN).col(PAINT.stone, 0.85, 1.03); b.box(x - 1.5, y, z, x + 1.5, y + 0.16, z + 0.95, { bottom: true });
    b.col(PAINT.stone, 0.7, 1); for (const sx of [-1.15, 1.15]) b.frustum(x + sx, z + 0.06, 0.28, 0.12, 0.28, 0.8, y - 0.7, y, { topZ: 0.37, top: false });
    b.col(PAINT.wood, 0.8, 1); for (const px of [-1.42, 0, 1.42]) b.box(x + px - 0.05, y + 0.16, z + 0.83, x + px + 0.05, y + 1.05, z + 0.93, { top: false });
    b.box(x - 1.5, y + 1.0, z + 0.82, x + 1.5, y + 1.1, z + 0.94, {}); b.box(x - 1.5, y + 1.0, z, x - 1.4, y + 1.1, z + 0.82, {}); b.box(x + 1.4, y + 1.0, z, x + 1.5, y + 1.1, z + 0.82, {});
  };
  const prop = (x, z, yaw, H) => {                                    // a battered buttress against an outer wall
    const s = Math.sin(yaw), c = Math.cos(yaw), a = Math.abs(s), e = Math.abs(c);
    b.surf(SURF.PLAIN).col(base, 0.8, 1); b.frustum(x + s * 0.3, z + c * 0.3, 1.3 + a * 0.3, 1.3 + e * 0.3, 0.8 - a * 0.3, 0.8 - e * 0.3, 0, Math.min(H * 0.62, 9), { topX: -s * 0.25, topZ: -c * 0.25 });
  };
  if (o.arcade) {                                                     // the arcade along the front, a terrace on its roof
    const n = Math.max(2, Math.round(W / 3.7)), yT = 4.7;
    b.surf(SURF.PLAIN).col(mul(base, 1.04), 0.82, 1.02); archWall(b, -hw, hd, hw, hd, 0, 2.95, yT, n, 0.85, 0.6);
    b.wall(-hw, fz, -hw, hd, 0, yT); b.wall(hw, hd, hw, fz, 0, yT);
    b.col(PAINT.roof[0]); b.quad([-hw, yT, hd], [hw, yT, hd], [hw, yT, fz], [-hw, yT, fz]);
    b.col(mul(base, 1.04), 1, 1.04); b.box(-hw, yT, hd - 0.3, hw, yT + 0.7, hd, {});
    b.col(mul(base, 0.5)); b.quad([-hw, yT - 0.35, hd - 0.6], [-hw, yT - 0.35, fz], [hw, yT - 0.35, fz], [hw, yT - 0.35, hd - 0.6]);
    if (yT + 0.7 > out.top) out.top = yT + 0.7;
  }
  if (o.solid || Math.min(W, De) < 15.5) {
    const cz = (fz - hd) / 2;
    if (!o.solid && W > 13) { const sx = rng.range(-0.15, 0.15) * W, hA = put(-hw, -hd, sx, fz); put(sx, -hd, hw, fz); door(b, sx - 2, 0, fz, 0, 1.3, 2.3, o.rich); door(b, sx + 2.2, 0, fz, 0, 1.3, 2.3, o.rich); if (o.rich && !o.arcade) { pot(b, sx - 0.6, 0.14, fz + 0.55, 1.1); if (hA > 7 && sx + hw > 7) balc((sx - hw) / 2, 3.45, fz); } }
    else { const H = put(-hw, -hd, hw, fz, o.solid ? Math.max(lo, hi - 1) : undefined); door(b, rng.range(-0.2, 0.2) * W, 0, fz, 0, o.solid ? 2.2 : 1.3, o.solid ? 3 : 2.3); if (o.solid) { prop(-hw, cz - De * 0.22, -Math.PI / 2, H); prop(-hw, cz + De * 0.22, -Math.PI / 2, H); prop(hw, cz - De * 0.22, Math.PI / 2, H); prop(hw, cz + De * 0.22, Math.PI / 2, H); } }
    return out;
  }
  const s1 = rng.range(-0.2, 0.2) * W, s2 = rng.range(-0.2, 0.2) * W;
  const hA = put(-hw, fz - t, s1, fz), hB = put(s1, fz - t, hw, fz);                    // front wing
  put(-hw, -hd, s2, -hd + t); put(s2, -hd, hw, -hd + t);                               // back wing
  const hL = put(-hw, -hd + t, -hw + t, fz - t), hR = put(hw - t, -hd + t, hw, fz - t); // side wings
  const cz = (fz - hd) / 2, cd = De - 2 * t;
  door(b, (s1 - hw) / 2, 0, fz, 0, 1.3, 2.3, o.rich); door(b, (s1 + hw) / 2, 0, fz, 0, 1.3, 2.3, o.rich); door(b, (s2 - hw) / 2, 0, -hd, Math.PI, 1.3, 2.3, o.rich); door(b, (s2 + hw) / 2 + 0.5, 0, -hd, Math.PI, 1.3, 2.3, o.rich);
  if (o.rich) { pot(b, (s1 - hw) / 2 + 1.5, 0.14, fz + 0.55, 1.15); pot(b, 1.4, 0.16, cz - 1.2, 1.3); if (!o.arcade && hB > 7) balc((s1 + hw) / 2, 3.45, fz); }
  door(b, -hw + t, 0, cz + rng.range(-0.2, 0.2) * cd, Math.PI / 2, 1.1, 2.1); door(b, hw - t, 0, cz + rng.range(-0.2, 0.2) * cd, -Math.PI / 2, 1.1, 2.1);
  if (!o.arcade && rng.chance(0.6)) { prop(-hw + 1.2, hd, 0, hA); prop(hw - 1.2, hd, 0, hB); }
  if (rng.chance(0.6)) { prop(-hw, cz + rng.range(-0.25, 0.25) * cd, -Math.PI / 2, hL); prop(hw, cz + rng.range(-0.25, 0.25) * cd, Math.PI / 2, hR); }
  out.court = [0, cz, Math.min(W, De) - 2 * t];
  return out;
}

// ---------------------------------------------------------------- THE TOWERS: five kinds, all slender, none the master
// kind 0 square shaft with an open loggia top; 1 round shaft with a small domed cap; 2 wind-catcher (tall upright slots under
// a flat top); 3 tapering square shaft with a pyramid cap; 4 eight-sided shaft with a balcony ring and a little cupola.
// Built in the builder's current frame (origin at the tower's foot). Returns its greatest half-width.
function pointedDome(R, Hd, n = 6) { const p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([i === n ? 0 : R * Math.pow(Math.max(0, 1 - Math.pow(t, 1.8)), 0.68), Hd * t]); } return p; }
// greatest half-width of a tower of this kind, as a share of its shaft's width (corners and balconies counted)
const TOWER_REACH = [1.05, 0.70, 1.02, 0.88, 0.93];
// the storeys of a shaft in turn: w a row of small arched windows, p plain plaster, m masonry courses, f plaster with a tile frieze
const TOWER_PATS = [['m', 'w', 'p', 'w', 'f', 'p', 'w', 'p'], ['p', 'w', 'p', 'p', 'f', 'w'], ['m', 'p', 'w', 'm', 'p', 'w', 'f']];
function tower(b, rng, kind, H, w, P) {
  const s = w / 2, r = w / 2, k = w / 8, PI = Math.PI, near = !!P.near, sd = rng(), plan = kind === 1 ? 'round' : kind === 4 ? 'oct' : 'sq', seg = 12;
  const plinth = (f, h) => { b.surf(SURF.MASONRY, 0, 1.8).col(P.trim, 0.62, 1); b.cbox(0, 0, 0, w * f, h, w * f, { m: 1, capM: 1 }); };
  const band = (y, ww, th) => { b.surf(SURF.PLAIN).col(P.trim, 0.9, 1.02); b.cbox(0, y, 0, ww, th, ww, { bottom: true }); };
  const ball = (y, rr) => { b.surf(SURF.PLAIN).col(P.trim, 0.9, 1.05); b.sphere(0, y, 0, rr, 6, 4); };
  const corbel = (y, w0, w1, h) => { b.surf(SURF.PLAIN).col(P.trim, 0.8, 1); b.frustum(0, 0, w0, w0, w1, w1, y, y + h, { top: false }); };
  // one section of the shaft from ya to yb (widths or diameters wa, wb) in the current surface and paint
  const ring = (ya, yb, wa, wb, o) => {
    if (plan === 'sq') { if (Math.abs(wa - wb) < 1e-6) b.box(-wa / 2, ya, -wa / 2, wa / 2, yb, wa / 2, { ...o, top: false }); else b.frustum(0, 0, wa, wa, wb, wb, ya, yb, { ...o, top: false }); }
    else b.lathe(0, ya, 0, [[wa / 2, 0], [wb / 2, yb - ya]], plan === 'oct' ? 8 : seg, plan === 'oct' ? { facet: true, start: PI / 8, ...o } : o);
  };
  const course = (y, wd) => {                                          // a string course standing proud of the shaft
    b.surf(SURF.PLAIN).col(P.trim, 0.9, 1.03);
    if (plan === 'sq') b.cbox(0, y - 0.26 * k, 0, wd + 0.8 * k, 0.52 * k, wd + 0.8 * k, { bottom: true });
    else b.lathe(0, y, 0, [[wd / 2, -0.32 * k], [wd / 2 + 0.42 * k, -0.05 * k], [wd / 2 + 0.42 * k, 0.3 * k], [wd / 2, 0.42 * k]], plan === 'oct' ? 8 : seg, plan === 'oct' ? { facet: true, start: PI / 8 } : {});
  };
  const cols = (wd) => (plan === 'sq' ? (wd > 9.5 ? 3 : 2) : plan === 'oct' ? 8 : wd > 9.5 ? 8 : 6);
  const cells = (wd, h) => ({ cellW: (plan === 'sq' ? wd : PI * wd) / cols(wd), cellH: h });
  const frieze = (ya, yb, wd) => {                                     // two rows of square tiles in chequer: a plain band of colour
    const th = Math.min(0.7 * k, (yb - ya) * 0.2), ym = (ya + yb) / 2, e = wd + 0.12 * k;
    for (let j = 0; j < 2; j++) {
      const y0 = ym - th + j * th; b.surf(SURF.STRIPES, 0, 1).col(P.tile, 1, 1);
      if (plan === 'sq') { const n = Math.max(3, Math.round(e / (2 * th))); b.box(-e / 2, y0, -e / 2, e / 2, y0 + th, e / 2, { uv: [j * 0.5, 0, n + j * 0.5, 1], top: false }); }
      else if (j === 0) { const n = Math.max(8, Math.round(PI * e / (2 * th) / 4) * 4); b.lathe(0, ym - th * 0.8, 0, [[e / 2, 0], [e / 2, th * 1.6]], plan === 'oct' ? 8 : seg, { uvBand: [n, 0, 1], ...(plan === 'oct' ? { facet: true, start: PI / 8 } : {}) }); }
    }
  };
  const arcade = (ya, yb, wd) => {                                     // a blind arcade of real arches standing proud of one storey, a window in every arch
    const T = 0.34 * k, e = wd / 2 + T, n = cols(wd), R = (2 * e / n - 0.6 * k) / 2; b.surf(SURF.PLAIN).col(P.trim, 0.84, 1.04);
    for (const [ax, az, bx, bz] of [[-e, e, e, e], [e, e, e, -e], [e, -e, -e, -e], [-e, -e, -e, e]]) archWall(b, ax, az, bx, bz, ya, Math.max(ya + 1.2, yb - R - 0.45), yb, n, 0.6 * k, T, 5);
  };
  const balcony = (y, wd, out) => {                                    // a balcony ring on brackets, a railing of posts and a rail
    const e = wd / 2 + out, n = wd > 9.5 ? 3 : 2;
    b.surf(SURF.PLAIN).col(P.trim, 0.82, 1.03); b.cbox(0, y, 0, 2 * e, 0.3 * k, 2 * e, { bottom: true });
    for (let f = 0; f < 4; f++) {
      b.tr(0, 0, 0, f * PI / 2);
      b.col(P.trim, 0.7, 1); for (let i = 0; i <= n; i++) b.frustum((i / n - 0.5) * wd * 0.82, wd / 2 + 0.07 * k, 0.4 * k, 0.14 * k, 0.4 * k, out * 0.9, y - 1.0 * k, y, { topZ: out * 0.45 - 0.07 * k, top: false });
      b.col(P.wall2, 0.9, 1.04); for (let i = 0; i < 4; i++) b.cbox(-e + 0.1 * k + i * (2 * e - 0.2 * k) / 4, y + 0.3 * k, e - 0.1 * k, 0.17 * k, 1.05 * k, 0.17 * k, { top: false });
      b.box(-e, y + 1.3 * k, e - 0.22 * k, e, y + 1.46 * k, e, {});
      b.pop();
    }
  };
  const brackets = (y, rr, out, n) => {                                // brackets under a round or eight-sided gallery
    b.surf(SURF.PLAIN).col(P.trim, 0.7, 1);
    for (let i = 0; i < n; i++) { const a = (i + 0.5) * TAU / n; b.tr(Math.cos(a) * (rr + 0.05 * k), y, Math.sin(a) * (rr + 0.05 * k), -a); b.frustum(0, 0, 0.14 * k, 0.4 * k, out * 0.9, 0.4 * k, -1.0 * k, 0, { topX: out * 0.45, top: false }); b.pop(); }
  };
  const foot = (hw, h) => {                                            // battered buttresses round the foot
    b.surf(SURF.MASONRY, 0, 1.8).col(P.trim, 0.58, 1);
    if (plan === 'sq') { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.frustum(sx * hw, sz * hw, 1.8 * k, 1.8 * k, 0.9 * k, 0.9 * k, 0, h, { m: 1, topX: -sx * 0.35 * k, topZ: -sz * 0.35 * k }); }
    else for (let i = 0; i < 6; i++) { const a = PI / 6 + i * TAU / 6; b.tr(Math.cos(a) * hw, 0, Math.sin(a) * hw, -a); b.frustum(0, 0, 1.5 * k, 1.3 * k, 0.7 * k, 0.9 * k, 0, h, { m: 1, topX: -0.32 * k }); b.pop(); }
  };
  // the shaft from y0 to y1 as a stack of storeys: plaster with a row of small arched windows, plain plaster, masonry courses,
  // banded courses, a tile frieze; a string course at every second storey. Near the flight the storeys are lower and one, at
  // the eye's height, stands behind a blind arcade.
  const shaft = (y0, y1, wAt, paint, upper) => {
    const sh = (near ? 4.3 : 6.4) * Math.max(0.92, Math.min(1.25, k)), n = Math.max(2, Math.round((y1 - y0) / sh)), h = (y1 - y0) / n;
    for (let i = 0; i < n; i++) {
      const ya = y0 + i * h, yb = ya + h, wa = wAt(ya), wb = wAt(yb), eye = near && plan === 'sq' && ya <= P.eye && yb > P.eye;
      let t = P.pat[(i + P.phase + (upper ? 3 : 0)) % P.pat.length]; if (eye) t = 'w'; else if (t === 'p' && upper && P.stripes) t = 's';
      if (t === 'w') { b.surf(SURF.ARCHED, sd, 0).col(paint, 0.92, 1.02); ring(ya, yb, wa, wb, cells(wa, h)); }
      else if (t === 'm') { b.surf(SURF.MASONRY, 0, 1.7).col(mix(paint, P.trim, 0.55), 0.84, 1); ring(ya, yb, wa, wb, { m: 1 }); }
      else if (t === 's') { b.surf(SURF.STRIPES, 0, 2).col(paint, 0.92, 1); if (plan === 'sq') ring(ya, yb, wa, wa, { uv: [0, 0, 1, Math.round(h / 1.3)] }); else ring(ya, yb, wa, wb, { uvBand: [1, 0, Math.round(h / 1.3)] }); }
      else { b.surf(SURF.PLAIN).col(paint, 0.84, 1.04); ring(ya, yb, wa, wb); if (t === 'f') frieze(ya, yb, (wa + wb) / 2); }
      if (eye) { arcade(ya, yb, wa); course(ya, wa); course(yb, wb); } else if (i > 0 && i % 2 === 0) course(ya, wa);
    }
  };
  const ph = 3.4 * k;
  if (kind === 0) {                                                    // SQUARE, OPEN LOGGIA wider than the shaft
    const yL = H - 13.5 * k, y1 = ph + (yL - ph) * rng.range(0.46, 0.6), e = s + 1.1 * k, yP = yL + 2.3 * k, hP = 6.2 * k;
    plinth(1.26, ph); if (near) foot(s, ph + 4.4 * k);
    shaft(ph, y1, () => w, P.wall, false);
    if (near) balcony(y1, w, 1.1 * k); else band(y1, w + 0.9 * k, 0.8 * k);
    shaft(y1 + (near ? 0.3 : 0.8) * k, yL, () => w, P.wall2, true);
    b.surf(SURF.PLAIN).col(P.trim, 0.8, 1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * s, ph, sz * s, 0.8 * k, yL - ph, 0.8 * k, { top: false });
    corbel(yL, w + 0.4 * k, 2 * e + 0.4 * k, 1.5 * k); band(yL + 1.5 * k, 2 * e + 0.8 * k, 0.8 * k);
    b.col(P.wall2, 0.9, 1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * (e - 0.6 * k), yP, sz * (e - 0.6 * k), 1.2 * k, hP, 1.2 * k, { top: false });
    for (const [px, pz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) b.cbox(px * (e - 0.4 * k), yP, pz * (e - 0.4 * k), 0.8 * k, hP, 0.8 * k, { top: false });
    for (const sg of [-1, 1]) { b.cbox(0, yP, sg * (e - 0.25 * k), 2 * e - 1.2 * k, 1.1 * k, 0.3 * k); b.cbox(sg * (e - 0.25 * k), yP, 0, 0.3 * k, 1.1 * k, 2 * e - 1.2 * k); }
    b.col(mul(P.wall, 0.3)); b.cbox(0, yP, 0, w * 0.4, hP, w * 0.4, { top: false });
    band(yP + hP, 2 * e + 1.0 * k, 1.1 * k);
    b.col(P.cap, 0.85, 1.06); b.frustum(0, 0, 2 * e + 1.6 * k, 2 * e + 1.6 * k, 0, 0, yP + hP + 1.1 * k, H - 1.0 * k, {});
    ball(H - 0.8 * k, 0.65 * k);
    return w * TOWER_REACH[0];
  }
  if (kind === 2) {                                                    // WIND-CATCHER: a head of tall upright slots under a flat top
    const yC = H - 17 * k, y1 = ph + (yC - ph) * rng.range(0.42, 0.56), e = s + 0.9 * k, yA = yC + 2.1 * k, yB = H - 1.6 * k, hh = yB - yA;
    plinth(1.26, ph); if (near) foot(s, ph + 4.4 * k);
    shaft(ph, y1, () => w, P.wall, false);
    if (near) balcony(y1, w, 1.0 * k); else band(y1, w + 0.8 * k, 0.8 * k);
    shaft(y1 + (near ? 0.3 : 0.8) * k, yC, () => w, P.wall2, true);
    corbel(yC, w + 0.3 * k, 2 * e + 0.3 * k, 1.4 * k); band(yC + 1.4 * k, 2 * e + 0.7 * k, 0.7 * k);
    b.surf(SURF.PLAIN).col(mul(P.wall, 0.24)); b.box(-e + 0.85 * k, yA, -e + 0.85 * k, e - 0.85 * k, yB, e - 0.85 * k, { top: false });
    b.col(P.wall2, 0.86, 1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * (e - 0.5 * k), yA, sz * (e - 0.5 * k), 1.0 * k, hh, 1.0 * k, { top: false });
    for (const f of [-0.5, 0, 0.5]) for (const sg of [-1, 1]) { b.cbox(f * (2 * e - 1.0 * k), yA, sg * (e - 0.42 * k), 0.46 * k, hh, 0.84 * k, { top: false }); b.cbox(sg * (e - 0.42 * k), yA, f * (2 * e - 1.0 * k), 0.84 * k, hh, 0.46 * k, { top: false }); }
    band(yB, 2 * e + 1.6 * k, 1.0 * k); b.cbox(0, yB + 1.0 * k, 0, w * 0.7, 0.6 * k, w * 0.7);
    return w * TOWER_REACH[2];
  }
  if (kind === 3) {                                                    // TAPERING, a corbelled bell stage and a PYRAMID CAP
    const wt = w * 0.7, yB = H - 21 * k, wAt = (y) => w + (wt - w) * (y / yB), y1 = yB * rng.range(0.44, 0.58), wb = wt + 2.0 * k, y2 = yB + 2.0 * k, p0 = 2.8 * k;
    plinth(1.22, p0); if (near) foot(s * 0.96, p0 + 4.4 * k);
    shaft(p0, y1, wAt, P.wall, false);
    if (near) balcony(y1, wAt(y1), 0.8 * k); else band(y1, wAt(y1) + 0.8 * k, 0.7 * k);
    shaft(y1 + (near ? 0.3 : 0.7) * k, yB, wAt, P.wall2, true);
    corbel(yB, wt + 0.3 * k, wb + 0.3 * k, 1.3 * k); band(yB + 1.3 * k, wb + 0.7 * k, 0.7 * k);
    b.surf(SURF.ARCHED, rng(), 0).col(P.wall2, 0.9, 1); b.box(-wb / 2, y2, -wb / 2, wb / 2, y2 + 8.5 * k, wb / 2, { cellW: 1, cols: 2, rows: 1, top: false });
    band(y2 + 8.5 * k, wb + 1.9 * k, 0.9 * k);
    b.col(P.cap, 0.82, 1.08); b.frustum(0, 0, wb + 1.2 * k, wb + 1.2 * k, 0, 0, y2 + 9.4 * k, H - 1.0 * k, {});
    ball(H - 0.75 * k, 0.6 * k);
    return w * TOWER_REACH[3];
  }
  if (kind === 1) {                                                    // ROUND, a gallery and a DOMED LANTERN
    const yT = H - 14 * k, y1 = 3.6 * k + (yT - 3.6 * k) * rng.range(0.44, 0.6), sg = 14, rg = r * 0.9 + 1.9 * k, rl = r * 0.86, dAt = (y) => 2 * r * (1 - 0.1 * y / yT);
    b.surf(SURF.MASONRY, 0, 1.8).col(P.trim, 0.62, 1); b.lathe(0, 0, 0, [[r * 1.34, 0], [r * 1.34, 2.8 * k], [r * 1.04, 3.6 * k]], 8, { facet: true, start: PI / 8, m: 1 });
    if (near) foot(r * 1.0, 3.6 * k + 4.4 * k);
    shaft(3.6 * k, y1, dAt, P.wall, false);
    b.surf(SURF.PLAIN).col(P.trim, 0.9, 1); b.lathe(0, y1, 0, [[dAt(y1) / 2, -0.25 * k], [dAt(y1) / 2 + 0.5 * k, 0], [dAt(y1) / 2 + 0.5 * k, 0.5 * k], [dAt(y1) / 2, 0.7 * k]], sg);
    shaft(y1 + 0.7 * k, yT - 1.8 * k, dAt, P.wall2, true);
    if (near) brackets(yT - 0.1 * k, r * 0.9, rg - r * 0.9, 10);
    b.surf(SURF.PLAIN).col(P.trim, 0.84, 1); b.lathe(0, yT, 0, [[r * 0.9, -1.8 * k], [rg, -0.1 * k], [rg, 0.5 * k], [rl, 0.5 * k]], sg);
    b.col(P.wall2, 0.9, 1); b.lathe(0, yT + 0.5 * k, 0, [[rg - 0.05 * k, 0], [rg - 0.05 * k, 1.1 * k], [rg - 0.35 * k, 1.1 * k], [rg - 0.35 * k, 0]], sg);
    b.surf(SURF.ARCHED, rng(), 0).col(P.wall2, 0.9, 1); b.lathe(0, yT + 0.5 * k, 0, [[rl, 0], [rl, 5.2 * k]], sg, { cellW: TAU * rl / 6, cellH: 5.2 * k });
    b.surf(SURF.PLAIN).col(P.trim, 0.9, 1); b.lathe(0, yT + 5.7 * k, 0, [[rl, 0], [rl + 0.6 * k, 0.3 * k], [rl + 0.6 * k, 0.7 * k], [rl + 0.2 * k, 0.7 * k]], sg);
    b.col(P.cap, 0.8, 1.1); b.lathe(0, yT + 6.4 * k, 0, pointedDome(rl + 0.25 * k, 5.0 * k), sg, { smooth: true });
    b.col(P.trim, 0.9, 1); b.lathe(0, yT + 11.3 * k, 0, [[0.32 * k, 0], [0.12 * k, 0.6 * k], [0.27 * k, 1.1 * k], [0, 2.3 * k]], 6);
    return w * TOWER_REACH[1];
  }
  // kind 4: EIGHT-SIDED, a BALCONY RING and a little CUPOLA
  const R = w * 0.54, yT = H - 11 * k, yB = ph + (yT - ph) * rng.range(0.64, 0.76), oct = { facet: true, start: PI / 8 };
  plinth(1.3, ph); if (near) foot(R * 0.98, ph + 4.4 * k);
  shaft(ph, yB - 1.8 * k, (y) => 2 * R * (1 - 0.05 * (y - ph) / (yB - ph)), P.wall, false);
  if (near) brackets(yB - 0.1 * k, R * 0.95, 2.2 * k, 8);
  b.surf(SURF.PLAIN).col(P.trim, 0.84, 1); b.lathe(0, yB, 0, [[R * 0.95, -1.8 * k], [R + 2.2 * k, -0.1 * k], [R + 2.2 * k, 0.3 * k], [R * 0.8, 0.3 * k]], 8, oct);
  b.col(P.wall2, 0.9, 1); b.lathe(0, yB + 0.3 * k, 0, [[R + 2.15 * k, 0], [R + 2.15 * k, 1.2 * k], [R + 1.8 * k, 1.2 * k], [R + 1.8 * k, 0]], 8, oct);
  shaft(yB + 0.3 * k, yT - 1.0 * k, (y) => 2 * R * (0.8 - 0.04 * (y - yB) / (yT - yB)), P.wall2, true);
  b.surf(SURF.PLAIN).col(P.trim, 0.88, 1); b.lathe(0, yT, 0, [[R * 0.76, -1.0 * k], [R * 0.76 + 1.2 * k, 0], [R * 0.76 + 1.2 * k, 0.5 * k], [R * 0.7, 0.5 * k]], 8, oct);
  b.col(P.wall2, 0.9, 1); for (let i = 0; i < 8; i++) { const a = PI / 8 + i * PI / 4; b.cbox(Math.cos(a) * R * 0.8, yT + 0.5 * k, Math.sin(a) * R * 0.8, 0.6 * k, 4 * k, 0.6 * k, { top: false }); }
  b.col(mul(P.wall, 0.3)); b.lathe(0, yT + 0.5 * k, 0, [[R * 0.34, 0], [R * 0.34, 4 * k]], 6);
  b.col(P.trim, 0.9, 1); b.lathe(0, yT + 4.5 * k, 0, [[R * 0.86, 0], [R * 0.98, 0.25 * k], [R * 0.98, 0.65 * k], [R * 0.84, 0.65 * k]], 8, oct);
  b.col(P.cap, 0.8, 1.1); b.lathe(0, yT + 5.15 * k, 0, pointedDome(R * 0.9, 4.0 * k), 8, { smooth: true });
  b.col(P.trim, 0.9, 1); b.lathe(0, yT + 9.05 * k, 0, [[0.3 * k, 0], [0.12 * k, 0.5 * k], [0.26 * k, 0.9 * k], [0, 1.9 * k]], 6);
  return w * TOWER_REACH[4];
}

// ---------------------------------------------------------------- THE DOMES: a square hall, an eight-sided shoulder, a low drum, the dome
// cap 0 whitewashed, 1 turquoise tile, 2 brick red. Built in the current frame (hall centre at ground). Returns the finial's height.
function domeHall(b, rng, d, cap, wallC, front) {
  const hw = hallHalf(d), hb = hallWall(d, front), R = d / 2, dh = drumH(d, front), PI = Math.PI, y0 = hb + 0.03, yd = y0 + 1.5 + dh, rise = domeRise(d), k = 0.8 + d / 40;
  b.surf(SURF.MASONRY, 0, 1.8).col(PAINT.stone, 0.62, 1); b.box(-hw - 0.5, 0, -hw - 0.5, hw + 0.5, 0.9, hw + 0.5, { m: 1, capM: 1 });
  b.surf(SURF.ARCHED, rng(), 0).col(wallC, 0.78, 1); b.box(-hw, 0.9, -hw, hw, hb, hw, { cellW: 4.2, cellH: (hb - 0.9) / (front ? 3 : 2), top: false });
  b.surf(SURF.PLAIN);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                // corner piers with little pyramid caps
    b.col(wallC, 0.84, 1.04); b.cbox(sx * hw, 0, sz * hw, 2.3, hb + 1.7, 2.3, { top: false });
    b.col(PAINT.stone, 0.9, 1.05); b.frustum(sx * hw, sz * hw, 2.8, 2.8, 0, 0, hb + 1.7, hb + 3.4, {});
  }
  b.col(wallC, 0.84, 1.03);                                            // wall piers between the windows: relief for the low sun
  for (const f of [-0.33, 0.33]) for (const sg of [-1, 1]) { b.cbox(f * 2 * hw, 0, sg * hw, 1.0, hb, 1.1, { top: false }); b.cbox(sg * hw, 0, f * 2 * hw, 1.1, hb, 1.0, { top: false }); }
  b.col(wallC, 1, 1.05); parapet(b, -hw, -hw, hw, hw, hb, 1.0, 0.4);
  b.col(PAINT.roof[1]); b.quad([-hw, y0, hw], [hw, y0, hw], [hw, y0, -hw], [-hw, y0, -hw]);
  b.col(PAINT.stone, 0.84, 1.03); b.box(-2.7, 0, hw, 2.7, hb * 0.82, hw + 0.9, {});                                     // the portal and its blue door
  b.surf(SURF.ARCHED, rng(), 0).col(PAINT.stone, 0.9, 1); b.wall(-2.1, hw + 0.94, 2.1, hw + 0.94, 0.15, hb * 0.76, { cellW: 1, cols: 1, rows: 1 });
  b.surf(SURF.PLAIN).col(wallC, 0.86, 1); b.lathe(0, y0, 0, [[R + 2.3, 0], [R + 0.9, 1.2], [R + 0.5, 1.2]], 8, { facet: true, start: PI / 8 });
  b.surf(SURF.ARCHED, rng(), 0).col(wallC, 0.9, 1); b.lathe(0, y0 + 1.2, 0, [[R + 0.5, 0], [R + 0.5, dh]], 16, { cellW: 2.5, cellH: dh });
  b.surf(SURF.PLAIN).col(PAINT.stone, 0.9, 1.04); b.lathe(0, y0 + 1.2 + dh, 0, [[R + 0.5, -0.3], [R + 1.0, -0.1], [R + 1.0, 0.3], [R, 0.3]], 16);
  const prof = []; for (let i = 0; i <= 8; i++) { const t = i / 8; prof.push([i === 8 ? 0 : R * Math.pow(Math.max(0, 1 - Math.pow(t, 2.1)), 0.55), rise * t]); }
  if (cap === 1) { b.surf(SURF.TILES).col(PAINT.tile, 0.8, 1.12); b.lathe(0, yd, 0, prof, 16, { smooth: true, m: 0.45 }); }
  else if (cap === 2) { b.surf(SURF.MASONRY, 0, 0.55).col(PAINT.brick, 0.84, 1.08); b.lathe(0, yd, 0, prof, 16, { smooth: true, m: 1 }); }
  else { b.surf(SURF.PLAIN).col(PAINT.white, 0.8, 1.06); b.lathe(0, yd, 0, prof, 16, { smooth: true }); }
  if (cap !== 1) {                                                    // ribs up the plain and the brick domes
    const nr = d > 20 ? 12 : 8, hr = 0.2 + d * 0.006; b.surf(SURF.PLAIN).col(PAINT.stone, 0.9, 1.06);
    for (let i = 0; i < nr; i++) {
      const a = (i + 0.5) * TAU / nr, ca = Math.cos(a), sa = Math.sin(a);
      for (let j = 0; j < 7; j++) { const r0 = prof[j][0] + 0.13, r1 = prof[j + 1][0] + 0.13, ya = yd + prof[j][1] + 0.05, yb = yd + prof[j + 1][1] + 0.05; b.quad([r0 * ca - sa * hr, ya, r0 * sa + ca * hr], [r0 * ca + sa * hr, ya, r0 * sa - ca * hr], [r1 * ca + sa * hr, yb, r1 * sa - ca * hr], [r1 * ca - sa * hr, yb, r1 * sa + ca * hr]); }
    }
  }
  b.surf(SURF.PLAIN).col(PAINT.stone, 0.88, 1.05); b.lathe(0, yd + rise - 0.25, 0, [[0.5 * k, 0], [0.2 * k, 0.5 * k], [0.45 * k, 1.0 * k], [0.12 * k, 1.5 * k], [0, 2.6 * k]], 6);
  return yd + rise - 0.25 + 2.6 * k;
}
// ---------------------------------------------------------------- THE MARKET HALL on the north quay: round arches, a flat roof, a row of small domes
function marketHall(b, rng) {
  const { x0, x1, z0, z1, h } = MARKET, y = QUAY_Y, zi = z1 - 4.6, n = 30, top = y + h, wallC = PAINT.walls[1], zc = (z0 + z1) / 2;
  b.surf(SURF.ARCHED, rng(), 0).col(wallC, 0.78, 1); b.box(x0, y, z0, x1, top, zi, { cellW: 4.53, cellH: h, top: false });
  b.surf(SURF.PLAIN).col(PAINT.walls[0], 0.82, 1.03); archWall(b, x0, z1, x1, z1, y, y + 3.9, top, n, 1.0, 0.9);
  b.wall(x0, zi, x0, z1, y, top); b.wall(x1, z1, x1, zi, y, top);
  b.col(PAINT.roof[0]); b.quad([x0, top, z1], [x1, top, z1], [x1, top, z0], [x0, top, z0]);
  b.col(wallC, 1, 1.05); parapet(b, x0, z0, x1, z1, top, 0.8, 0.35);
  b.col(mul(wallC, 0.55)); b.quad([x0, top - 0.4, z1 - 0.9], [x0, top - 0.4, zi], [x1, top - 0.4, zi], [x1, top - 0.4, z1 - 0.9]);
  for (let i = 1; i < n; i += 3) {
    const cx = x0 + (i + 0.5) * (x1 - x0) / n, p = []; for (let j = 0; j <= 5; j++) { const a = Math.PI / 2 * j / 5; p.push([j === 5 ? 0 : 2.3 * Math.cos(a), 2.3 * Math.sin(a)]); }
    b.col(wallC, 0.9, 1); b.lathe(cx, top, zc, [[2.6, 0], [2.6, 0.7], [2.3, 0.7]], 10);
    b.col(PAINT.white, 0.82, 1.08); b.lathe(cx, top + 0.7, zc, p, 10, { smooth: true });
    b.col(PAINT.stone); b.lathe(cx, top + 2.95, zc, [[0.16, 0], [0.2, 0.3], [0, 0.6]], 5);
  }
}
// ---------------------------------------------------------------- THE BREAKWATERS: mounds of great rough blocks, a round head, a squat light
function breakwater(b, rng, sx) {
  const n = 22, crest = 3.0, half = 3.3, sec = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = bez(t), q = bez(Math.min(1, t + 0.02)), q0 = bez(Math.max(0, t - 0.02)), l = Math.hypot(q[0] - q0[0], q[1] - q0[1]), ox = (q[1] - q0[1]) / l, oz = -(q[0] - q0[0]) / l;
    const fo = 9 + rng() * 2.4, fi = 7 + rng() * 1.6, P = (k, yy) => [sx * (p[0] + ox * k), yy, p[1] + oz * k];
    sec.push({ O0: P(fo, -4), O1: P(half + rng() * 0.5, crest), I1: P(-half - rng() * 0.4, crest), I0: P(-fi, -4), p, ox, oz });
  }
  const Q = (a, c, d, e) => (sx > 0 ? b.quad(c, a, e, d) : b.quad(a, c, d, e));
  for (let i = 0; i < n; i++) {
    const A = sec[i], C = sec[i + 1];
    b.surf(SURF.MASONRY, 0, 3.4).col(PAINT.rubble, 0.42, 1); Q(A.O0, C.O0, C.O1, A.O1); Q(A.I1, C.I1, C.I0, A.I0);
    b.surf(SURF.MASONRY, 0, 1.4).col(PAINT.stoneDark, 1, 1); Q(A.O1, C.O1, C.I1, A.I1);
  }
  const hx = sx * BW.head[0], hz = BW.head[1];
  b.surf(SURF.MASONRY, 0, 3.4).col(PAINT.rubble, 0.42, 1); b.lathe(hx, 0, hz, [[12.5, -4], [6.6, crest]], 14, { facet: true, m: 0.5 });
  b.surf(SURF.MASONRY, 0, 1.4).col(PAINT.stoneDark, 1, 1); b.disc(hx, crest, hz, 6.6, 14, true);
  const block = (x, y, z, s) => { b.tr(x, y, z, rng() * TAU); b.surf(SURF.PLAIN).col(mul(PAINT.rubble, 0.86 + rng() * 0.3), 0.6, 1); b.cbox(0, -s * 0.5, 0, s * (0.8 + rng() * 0.6), s * (0.9 + rng() * 0.3), s * (0.8 + rng() * 0.5)); b.pop(); };
  for (let i = 0; i < 120; i++) {                                      // great loose blocks down both faces, more to seaward
    const A = sec[Math.floor(rng() * (n + 1))], out = rng.chance(0.6), k = out ? rng.range(3.4, 9.5) : -rng.range(3.4, 7), kk = Math.abs(k);
    block(sx * (A.p[0] + A.ox * k), crest - (kk - 3.3) * 1.05 + rng.range(-0.2, 0.6), A.p[1] + A.oz * k, rng.range(1.5, 3.3));
  }
  for (let i = 0; i < 26; i++) { const a = rng() * TAU, rr = rng.range(6.5, 11.5); block(hx + Math.cos(a) * rr, crest - (rr - 6.2) * 1.1 + 0.2, hz + Math.sin(a) * rr, rng.range(1.5, 2.6)); }
  // the harbour light: small and squat (5.9 m, wider than a man is tall twice over), a stout white drum with one brick band,
  // a wide lantern under a brick-red cap: stout so that it reads from the sea, never a tall lighthouse (both lights alike)
  b.surf(SURF.PLAIN).col(PAINT.stone, 0.8, 1); b.lathe(hx, crest, hz, [[3.0, 0], [3.0, 0.5], [2.5, 0.5]], 12);
  b.col(PAINT.white, 0.86, 1.06); b.lathe(hx, crest, hz, [[2.5, 0.5], [2.3, 2.3]], 12);
  b.col(PAINT.brick, 0.9, 1.05); b.lathe(hx, crest, hz, [[2.3, 2.3], [2.25, 2.8]], 12);
  b.col(PAINT.white, 0.86, 1.06); b.lathe(hx, crest, hz, [[2.25, 2.8], [2.2, 3.3]], 12);
  b.col(PAINT.stone, 0.9, 1); b.lathe(hx, crest, hz, [[2.2, 3.2], [2.9, 3.4], [2.9, 3.6], [1.7, 3.6]], 12);
  b.surf(SURF.GLOW, 0, 2.6).col(L('#fff0b8')); b.lathe(hx, crest, hz, [[1.6, 3.6], [1.6, 4.8]], 10);
  b.surf(SURF.PLAIN).col(PAINT.brick, 0.85, 1.05); b.lathe(hx, crest, hz, [[1.6, 4.8], [2.0, 4.8], [0, 5.9]], 10);
}
// quay furniture: a mooring post with a rope coil, a low stack of crates and jars, steps down to the water
function bollard(b, x, z, coil) {
  b.surf(SURF.PLAIN).col([0.2, 0.2, 0.21], 0.8, 1.1); b.lathe(x, QUAY_Y, z, [[0.3, 0], [0.25, 0.58], [0.4, 0.68], [0, 0.84]], 6);
  if (coil) { b.col(PAINT.rope, 0.75, 1.05); b.lathe(x, QUAY_Y, z, [[0.58, 0], [0.62, 0.17], [0.42, 0.21]], 7); }
}
function goods(b, rng, x, z) {
  b.tr(x, QUAY_Y, z, rng() * TAU);
  const n = rng.int(3, 6);
  for (let i = 0; i < n; i++) {
    const s = rng.range(0.9, 1.3), px = (i % 3) * 1.45 + rng.range(-0.1, 0.1), pz = Math.floor(i / 3) * 1.5 + rng.range(-0.1, 0.1);
    b.surf(SURF.PLANKS).col(mul(PAINT.wood, 0.85 + rng() * 0.4), 0.8, 1); b.cbox(px, 0, pz, s, s * 0.85, s, { capStyle: SURF.PLANKS });
    if (rng.chance(0.35)) b.cbox(px + 0.1, s * 0.85, pz, s * 0.8, s * 0.7, s * 0.8, { capStyle: SURF.PLANKS });
  }
  const nj = rng.int(1, 3); for (let i = 0; i < nj; i++) jar(b, -1.3 - (i % 2) * 0.95, 0, i * 0.5, rng.range(0.85, 1.2));
  b.pop();
}
function steps(b, x, z, nx, nz) {                                       // (nx, nz): the unit normal out over the water
  b.tr(x, 0, z, Math.atan2(nx, nz));
  b.surf(SURF.MASONRY, 0, 1.2).col(PAINT.stone, 0.6, 1);
  for (let i = 0; i < 9; i++) b.box(i * 0.62, -3, 0, (i + 1) * 0.62 + 0.02, QUAY_Y - (i + 1) * 0.27, 2.3, { m: 1, capM: 1 });
  b.box(9 * 0.62, -3, 0, 9 * 0.62 + 2.4, QUAY_Y - 2.55, 2.3, { m: 1, capM: 1 });
  b.pop();
}

// ---------------------------------------------------------------- THE GROUND: one flat sheet at quay height, cut along the waterfront
function clipToCell(poly, x0, z0, x1, z1) {
  const pass = (pts, k, v, keepLow) => {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], c = pts[(i + 1) % n], ia = keepLow ? a[k] <= v : a[k] >= v, ic = keepLow ? c[k] <= v : c[k] >= v;
      if (ia) out.push(a);
      if (ia !== ic) { const t = (v - a[k]) / (c[k] - a[k]), q = [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]; q[k] = v; out.push(q); }
    }
    return out;
  };
  let p = pass(poly, 0, x0, false); if (p.length < 3) return p;
  p = pass(p, 0, x1, true); if (p.length < 3) return p;
  p = pass(p, 1, z0, false); if (p.length < 3) return p;
  return pass(p, 1, z1, true);
}
async function buildGround(b, ctx, land, shore, colorAt, paved) {
  const lines = (lo, hi, a, e, step) => {
    const o = []; for (let x = a; x < e + 0.01; x += step) o.push(x);
    for (let g = step, x = a; x > lo;) { g *= 1.7; x = Math.max(lo, x - g); o.unshift(x); }
    for (let g = step, x = o[o.length - 1]; x < hi;) { g *= 1.7; x = Math.min(hi, x + g); o.push(x); }
    return o;
  };
  const xs = lines(-1600, 1600, -392, 420, 14), zs = lines(-1600, 30, -420, 28, 14), nx = xs.length, nz = zs.length;
  const inside = new Uint8Array(nx * nz), hasV = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) inside[j * nx + i] = inPoly(xs[i], zs[j], land) ? 1 : 0; if (j % 8 === 7) await ctx.yield(); }
  const find = (arr, v) => { let i = 0; while (i < arr.length - 2 && arr[i + 1] <= v) i++; return i; };
  for (const p of shore) if (p[0] > xs[0] && p[0] < xs[nx - 1] && p[1] > zs[0] && p[1] < zs[nz - 1]) hasV[find(zs, p[1]) * nx + find(xs, p[0])] = 1;
  const put = (x, z) => { const c = colorAt(x, z); return b.v(x, QUAY_Y, z, 0, 1, 0, c[0], c[1], c[2], x, z); };
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1], k = inside[j * nx + i] + inside[j * nx + i + 1] + inside[(j + 1) * nx + i] + inside[(j + 1) * nx + i + 1];
      const mixed = hasV[j * nx + i] || (k > 0 && k < 4);
      if (!mixed && k === 0) continue;
      b.surf(paved((x0 + x1) / 2, (z0 + z1) / 2) ? SURF.MASONRY : SURF.PLAIN, 0, 1.4);
      if (!mixed) { b.quad4(put(x0, z1), put(x1, z1), put(x1, z0), put(x0, z0)); continue; }
      const poly = clipToCell(land, x0, z0, x1, z1); if (poly.length < 3) continue;
      const tris = THREE.ShapeUtils.triangulateShape(poly.map((p) => new THREE.Vector2(p[0], p[1])), []);
      const idx = poly.map((p) => put(p[0], p[1]));
      for (const t of tris) { const A = poly[t[0]], B = poly[t[1]], C = poly[t[2]], ccw = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) > 0; if (ccw) b.tri3(idx[t[0]], idx[t[2]], idx[t[1]]); else b.tri3(idx[t[0]], idx[t[1]], idx[t[2]]); }
    }
    if (j % 6 === 5) await ctx.yield();
  }
}

// ---------------------------------------------------------------- overlap of two turned rectangles { x, z, hw, hd, c, s } (c, s: cos and sin of the turn)
function rectsOverlap(A, B, gap) {
  const dx = B.x - A.x, dz = B.z - A.z;
  for (const R of [A, B]) {
    for (const [ax, az] of [[R.c, -R.s], [R.s, R.c]]) {               // the rectangle's two axes in the world
      const ra = Math.abs(ax * A.c - az * A.s) * A.hw + Math.abs(ax * A.s + az * A.c) * A.hd, rb = Math.abs(ax * B.c - az * B.s) * B.hw + Math.abs(ax * B.s + az * B.c) * B.hd;
      if (Math.abs(dx * ax + dz * az) > ra + rb + gap) return false;
    }
  }
  return true;
}

// ================================================================ buildHero
export async function buildHero(ctx, opts = {}) {
  const core = ctx.core, key = 'harbour-city:' + (opts.seedKey ?? ctx.seed ?? 1), R = (label) => core.makeRng(key + ':' + label);
  const sm = core.smoothstep, noise = core.makeNoise(core.hashSeed(key + ':ground'));
  const sun = (opts.sun && opts.sun.isVector3 ? opts.sun.clone() : new THREE.Vector3(-0.883, 0.469, 0)).normalize();
  const mats = S.makeMaterials({ night: 0, lit: 0, reflect: 0.25, cityReflect: 0, detail: 1, glass: '#2b68a8', lampDay: 1 });   // the "glass" of every window is a blue shutter
  mats.setSky({ top: '#3f8fd8', horizon: '#f6e2bd', sun: '#fff1d0', sunDir: sun });
  const object = new THREE.Group(); object.name = 'harbour-city';
  const wf = waterfront(), shore = wf.pts, land = [...shore, [1600, -1600], [-1600, -1600]];
  const path = core.makePath([[0, 22, 170], [0, 20, 80], ...CORRIDOR]);
  const lineDist = (x, z) => { let d = path.nearestXZ(x, z).dist; for (let i = 0; i < CORRIDOR.length - 1; i++) d = Math.min(d, segDist(x, z, CORRIDOR[i][0], CORRIDOR[i][2], CORRIDOR[i + 1][0], CORRIDOR[i + 1][2])); return d; };
  const waterDist = (x, z) => polyDist(x, z, shore);
  const townW = (x, z) => {                                             // 1 in the town, 0 outside; the edge wanders, most of all in the north
    const e = 30 * noise.n2(x * 0.012 + 3.1, 0.7) + 18 * noise.n2(x * 0.034, 5.2) - 28, f = 14 * noise.n2(z * 0.02, 9.4);
    return Math.min(sm(TOWN.x0 - 45 + f, TOWN.x0 + 10 + f, x), 1 - sm(TOWN.x1 - 10 + f, TOWN.x1 + 45 + f, x), sm(TOWN.z0 - 60 + e, TOWN.z0 + 22 + e, z));
  };
  const meshes = [], addMesh = (b, name, cast = true) => { if (!b.triangles) return; const m = new THREE.Mesh(b.toGeometry(), mats.facades); m.name = name; m.castShadow = cast; m.receiveShadow = true; object.add(m); meshes.push(m); };
  let tris = 0;
  await ctx.yield();

  // ---- the ground, the quay's edge and the sea wall
  const bG = new S.Builder(16384);
  await buildGround(bG, ctx, land, shore, (x, z) => {
    const n = noise.fbm2(x * 0.0035, z * 0.0035, 3) * 0.5 + 0.5, n2 = noise.n2(x * 0.021, z * 0.021) * 0.5 + 0.5, t = townW(x, z);
    return mix(mul(mix(PAINT.sand, PAINT.earth, n), 0.84 + 0.24 * n2), mul(PAINT.paving, 0.86 + 0.22 * n2), t);
  }, (x, z) => townW(x, z) > 0.5);
  await ctx.yield();
  const inTownX = (x) => x > TOWN.x0 - 25 && x < TOWN.x1 + 25;
  let butt = 0;
  for (let i = 0; i < shore.length - 1; i++) {
    const a = shore[i], c = shore[i + 1], quay = i >= wf.i0 && i < wf.i1, town = inTownX((a[0] + c[0]) / 2), eh = quay ? 0.22 : town ? 1.0 : 0, ew = quay ? 0.7 : 0.5;
    const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1, ix = dz / l, iz = -dx / l;                 // (ix, iz): toward the land
    bG.surf(SURF.MASONRY, 0, 2.6).col(quay ? PAINT.stone : PAINT.stoneDark, 0.45, 1); bG.wall(a[0], a[1], c[0], c[1], -4, QUAY_Y + eh, { m: 1 });
    if (eh > 0) {
      const y = QUAY_Y + eh, ai = [a[0] + ix * ew, a[1] + iz * ew], ci = [c[0] + ix * ew, c[1] + iz * ew];
      bG.surf(SURF.PLAIN).col(quay ? mul(PAINT.stone, 1.08) : PAINT.stone, 1, 1);
      bG.quad([a[0], y, a[1]], [c[0], y, c[1]], [ci[0], y, ci[1]], [ai[0], y, ai[1]]); bG.wall(ci[0], ci[1], ai[0], ai[1], QUAY_Y, y);
    }
    if (!quay && town) {                                                // buttresses down the sea wall: relief for the low sun
      butt += l;
      if (butt > 11) { butt = 0; bG.tr((a[0] + c[0]) / 2, 0, (a[1] + c[1]) / 2, Math.atan2(-ix, -iz)); bG.surf(SURF.MASONRY, 0, 2).col(PAINT.stoneDark, 0.5, 1.05); bG.frustum(0, 0.6, 2.0, 2.4, 1.3, 0.7, -4, 1.7, { m: 1, topZ: -0.5 }); bG.pop(); }
    }
  }
  // along the harbour's own quay by distance: mooring posts, steps, goods
  const cum = [0]; for (let i = wf.i0; i < wf.i1; i++) cum.push(cum[cum.length - 1] + Math.hypot(shore[i + 1][0] - shore[i][0], shore[i + 1][1] - shore[i][1]));
  const quayLen = cum[cum.length - 1];
  const quayAt = (d, inset) => {
    let k = 0; while (k < cum.length - 2 && cum[k + 1] < d) k++;
    const a = shore[wf.i0 + k], c = shore[wf.i0 + k + 1], l = cum[k + 1] - cum[k] || 1, t = (d - cum[k]) / l, dx = (c[0] - a[0]) / l, dz = (c[1] - a[1]) / l;
    return { x: a[0] + (c[0] - a[0]) * t + dz * inset, z: a[1] + (c[1] - a[1]) * t - dx * inset, ox: -dz, oz: dx };   // (ox, oz): out over the water
  };
  const rq = R('quay');
  for (let d = 6, i = 0; d < quayLen - 4; d += 12.5, i++) { const p = quayAt(d, 1.5); bollard(bG, p.x, p.z, i % 2 === 0); }
  for (const f of [0.13, 0.36, 0.64, 0.87]) { const p = quayAt(quayLen * f, 0); steps(bG, p.x, p.z, p.ox, p.oz); }
  for (let i = 0; i < 12; i++) { const p = quayAt(quayLen * (0.04 + 0.92 * (i + rq()) / 12), rq.range(4.5, 7)); goods(bG, rq, p.x, p.z); }
  await ctx.yield();
  breakwater(bG, R('bw1'), 1); breakwater(bG, R('bw2'), -1);
  await ctx.yield();

  // ---- the market hall, the domes, the towers (their places fixed; kinds, paints and trim by seed)
  const bH = new S.Builder(16384), bT = new S.Builder(16384), fixed = [], towers = [], domes = [];
  const rect = (x, z, hw, hd, ry = 0) => ({ x, z, hw, hd, c: Math.cos(ry), s: Math.sin(ry) });
  marketHall(bH, R('market'));
  fixed.push(rect((MARKET.x0 + MARKET.x1) / 2, (MARKET.z0 + MARKET.z1) / 2, (MARKET.x1 - MARKET.x0) / 2 + 1, (MARKET.z1 - MARKET.z0) / 2 + 1));
  fixed.push(rect((GARDEN.x0 + GARDEN.x1) / 2, (GARDEN.z0 + GARDEN.z1) / 2, (GARDEN.x1 - GARDEN.x0) / 2 + 0.5, (GARDEN.z1 - GARDEN.z0) / 2 + 0.5));
  const rd = R('domes'), caps = rd.shuffle(DOMES.map((_, i) => i % 3));
  for (let i = 0; i < DOMES.length; i++) {
    const [x, z, d, front] = DOMES[i], hw = hallHalf(d), ry = Math.atan2(BASIN.x - x, BASIN.z - z) > 0 ? 0 : 0;      // halls stand square to the compass, the portal toward the south
    bH.tr(x, QUAY_Y, z, ry); const top = domeHall(bH, rd, d, caps[i], pickWall(rd), !!front); bH.pop();
    domes.push({ x, z, r: d / 2, h: QUAY_Y + top, half: hw + 1.2 }); fixed.push(rect(x, z, hw + 1.4, hw + 1.9, ry));
    if (i % 5 === 4) await ctx.yield();
  }
  const rt = R('towers'), order = rt.shuffle(TOWERS.map((_, i) => i)), kinds = new Array(TOWERS.length);
  order.forEach((ti, n) => { kinds[ti] = n % 5; });
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < TOWERS.length; i++) {                                         // no two neighbours of one kind
    let nb = -1, bd = Infinity; for (let j = 0; j < TOWERS.length; j++) if (j !== i) { const d = Math.hypot(TOWERS[i][0] - TOWERS[j][0], TOWERS[i][1] - TOWERS[j][1]); if (d < bd) { bd = d; nb = j; } }
    if (kinds[nb] === kinds[i]) { const j = rt.int(0, TOWERS.length - 1); if (j !== i && j !== nb) { const t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; } }
  }
  const capPaints = [PAINT.tile, PAINT.brick, PAINT.white, mul(PAINT.stone, 1.05)];
  for (let i = 0; i < TOWERS.length; i++) {
    const [x, z, h, w0] = TOWERS[i], allow = lineDist(x, z) - 15.8;
    let kind = kinds[i], w = 7 + (w0 - 5.5) / 3.5 * 6;
    if (w * TOWER_REACH[kind] > allow) { w = allow / TOWER_REACH[kind]; if (w < 7) { kind = 1; w = Math.min(7 + (w0 - 5.5) / 3.5 * 6, allow / TOWER_REACH[1]); } }
    const tw = PAINT.towerWalls, wi = rt.int(0, tw.length - 1), wall = tw[wi], stripes = rt.chance(0.3);
    const wall2 = stripes ? tw[2 + rt.int(0, 2)] : rt.chance(0.3) ? mul(PAINT.brick, 0.86) : tw[(wi + 1 + rt.int(0, tw.length - 2)) % tw.length];
    const P = { wall, wall2, trim: PAINT.stone, cap: rt.pick(capPaints), stripes, pat: TOWER_PATS[rt.int(0, TOWER_PATS.length - 1)], phase: rt.int(0, 5), tile: rt.chance(0.6) ? PAINT.tile : mul(PAINT.blue, 1.2),
      near: lineDist(x, z) < 75 || Math.hypot(x - RING[0], z - RING[2]) < 66, eye: Math.max(12, path.nearestXZ(x, z).y - QUAY_Y - 3) };
    const ry = kind === 1 ? rt() * TAU : kind === 4 ? rt.range(0, 0.4) : rt.range(0.35, 1.2);                         // square shafts turned so that one face takes the western sun and shows to the south
    bT.tr(x, QUAY_Y, z, ry); const reach = tower(bT, rt, kind, h - QUAY_Y, w, P); bT.pop();
    towers.push({ x, z, r: reach, h, kind, w }); fixed.push(rect(x, z, reach + 0.6, reach + 0.6));
    if (i % 8 === 7) await ctx.yield();
  }
  addMesh(bG, 'ground', false); await ctx.yield(); addMesh(bH, 'halls'); await ctx.yield(); addMesh(bT, 'towers'); tris += bG.triangles + bH.triangles + bT.triangles;
  await ctx.yield();

  // ---- the houses: rows along the waterfront first (tall, arcaded), then rings of blocks between spoke lanes, then single houses in the gaps
  const bD = new S.Builder(8192), HB = [0, 1, 2, 3].map(() => new S.Builder(16384)), placed = fixed.slice(), palms = [], rb = R('blocks');
  const hbOf = (x, z) => HB[(x < 0 ? 0 : 1) + (z < -190 ? 2 : 0)];
  const fan = (x, z) => x > 160 && x < 262 && z > -62;                  // under the last leg: the view south over the roofs stays open
  const floorsFor = (x, z, wd, rad) => (lineDist(x, z) - rad < 17.5 ? [2, 2] : fan(x, z) ? [2, 3] : wd < 66 ? [5, 7] : wd < 105 ? [3, 5] : [2, 4]);
  const palmAt = (x, z, h, far) => palms.push({ x, y: QUAY_Y, z, h, far });
  let blocks = 0;
  const NINE = [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [1, 0], [0, -1], [-1, 0]];
  const tryBlock = (cx, cz, W, D, ry, minWater, o = {}) => {
    const r = rect(cx, cz, W / 2, D / 2, ry), tw = townW(cx, cz);
    if (tw < 0.03) return 0;
    for (const q of placed) if (Math.abs(q.x - cx) < 60 && Math.abs(q.z - cz) < 60 && rectsOverlap(r, q, o.gap ?? 3.4)) return 0;
    for (const [fx, fz] of NINE) {
      const px = cx + fx * r.hw * r.c + fz * r.hd * r.s, pz = cz - fx * r.hw * r.s + fz * r.hd * r.c;
      if (!inPoly(px, pz, land) || waterDist(px, pz) < minWater) return 0;
    }
    placed.push(r);
    if (rb() > Math.pow(tw, 0.8)) return 1;                           // the town thins toward its edges (the place is kept as open ground)
    const wd = waterDist(cx, cz), rad = Math.hypot(r.hw, r.hd), small = Math.min(W, D) < 14;
    let [lo, hi] = floorsFor(cx, cz, wd, rad); if (small) { lo = Math.min(lo, 3); hi = Math.min(hi, 4); }
    const tall = lo >= 5, b = hbOf(cx, cz), ld = lineDist(cx, cz);
    b.tr(cx, QUAY_Y, cz, ry);
    const res = courtBlock(b, rb, W, D, lo, hi, { arcade: !!o.front && lo >= 3, solid: tall && rb.chance(0.28), warm: wd < 70, rich: ld < 60, far: ld > 125 });
    b.pop(); blocks++;
    bD.tr(cx, QUAY_Y, cz, ry); bD.surf(SURF.MASONRY, 0, 1.3).col(PAINT.flag, 0.96, 1); bD.box(-W / 2 - 0.7, 0, -D / 2 - 0.7, W / 2 + 0.7, 0.14, D / 2 + 0.7, { m: 1, capM: 1 });
    if (res.court) { const cs = res.court[2] / 2 - 0.15, c0 = res.court[1]; bD.surf(SURF.MASONRY, 0, 0.8).col(PAINT.terra, 1, 1); bD.quad([-cs, 0.16, c0 + cs], [cs, 0.16, c0 + cs], [cs, 0.16, c0 - cs], [-cs, 0.16, c0 - cs], [0, 0, 2 * cs, 2 * cs]); }
    bD.pop();
    if (res.court && res.court[2] > 5.4 && !tall && rb.chance(ld > 125 ? 0.5 : 0.85)) { const lz = res.court[1]; palmAt(cx + lz * r.s, cz + lz * r.c, lineDist(cx, cz) < 30 ? rb.range(9, 11.5) : rb.range(11, 16), false); }
    return 2;
  };
  const sCum = [0]; for (let i = 0; i < shore.length - 1; i++) sCum.push(sCum[i] + Math.hypot(shore[i + 1][0] - shore[i][0], shore[i + 1][1] - shore[i][1]));
  const shoreAt = (d) => {
    let k = 0, hi = sCum.length - 2; while (k < hi) { const m = (k + hi + 1) >> 1; if (sCum[m] <= d) k = m; else hi = m - 1; }
    const a = shore[k], c = shore[k + 1], l = sCum[k + 1] - sCum[k] || 1, t = (d - sCum[k]) / l, dx = (c[0] - a[0]) / l, dz = (c[1] - a[1]) / l;
    return { x: a[0] + (c[0] - a[0]) * t, z: a[1] + (c[1] - a[1]) * t, ox: -dz, oz: dx, i: k };
  };
  let dStart = 0, dEnd = 0; shore.forEach((p, i) => { if (p[0] < TOWN.x0 - 22) dStart = sCum[i]; if (p[0] < TOWN.x1 + 16) dEnd = sCum[i]; });
  let rowStep = 0;
  for (const rowN of [0, 1]) {
    for (let d = dStart + rb.range(0, 6); d < dEnd;) {
      const W = rb.range(18, 27), D = rb.range(21, 25), p = shoreAt(d + W / 2), quay = p.i >= wf.i0 && p.i < wf.i1;
      if (rowN === 1 && p.i >= wf.a0 - 2 && p.i <= wf.a1 + 2) { d += 8; continue; }                                    // round the oval the rings of blocks make the second row
      const sb = (quay ? 14.5 : 8.5) + rowN * 29.5;
      d += tryBlock(p.x - p.ox * (sb + D / 2), p.z - p.oz * (sb + D / 2), W, D, Math.atan2(p.ox, p.oz), sb - 2.5, { front: rowN === 0 }) ? W + rb.range(3.6, 5.6) : 5;
      if (++rowStep % 10 === 0) await ctx.yield();
    }
    await ctx.yield();
  }
  const K0 = 26, aE = 0.5, span = Math.PI + 1.0;
  for (let j = 0; j < 11; j++) {
    for (let kk = 0; kk < K0; kk++) {
      const aA = aE - span * kk / K0, aB = aE - span * (kk + 1) / K0, am = (aA + aB) / 2, re = 1 / Math.hypot(Math.cos(am) / BASIN.a, Math.sin(am) / BASIN.b);
      const rho = re + 58 + j * 30.5, arc = rho * span / K0, m = Math.max(1, Math.round(arc / 30));
      for (let q = 0; q < m; q++) {
        const a = aA + (aB - aA) * (q + 0.5) / m + 0.035 * Math.sin(rho / 60 + kk * 1.7), W = Math.min(30, arc / m - rb.range(3.8, 5.5)), D = rb.range(22, 26);
        tryBlock(BASIN.x + Math.cos(a) * rho, BASIN.z + Math.sin(a) * rho, W, D, Math.atan2(-Math.cos(a), -Math.sin(a)), 12);
      }
      if (kk % 7 === 6) await ctx.yield();
    }
    await ctx.yield();
  }
  const squares = [];
  for (let i = 0; i < 500 && squares.length < 34; i++) {                // small squares kept open, each with a palm or three
    const x = rb.range(TOWN.x0, TOWN.x1), z = rb.range(TOWN.z0, 6), h = rb.range(5, 8), r = rect(x, z, h, h, rb.range(0, 1.5));
    if (townW(x, z) < 0.6 || !inPoly(x, z, land) || waterDist(x, z) < 20 + h || placed.some((q) => Math.abs(q.x - x) < 60 && Math.abs(q.z - z) < 60 && rectsOverlap(r, q, 2))) continue;
    placed.push(r); squares.push([x, z, h, r]);
  }
  await ctx.yield();
  for (let z = TOWN.z0 - 92, row = 0; z < 16; z += 6.5, row++) {        // the gaps that are left: a scan, at every free spot the largest house that fits
    for (let x = TOWN.x0 - 20 + (row % 2) * 3.25; x < TOWN.x1 + 20; x += 6.5) {
      const jx = x + rb.range(-2, 2), jz = z + rb.range(-2, 2), ry = Math.atan2(BASIN.x - jx, BASIN.z - jz) + rb.range(-0.1, 0.1);
      for (let k = 0; k < 3; k++) { const sz = k === 0 ? rb.range(16, 21) : k === 1 ? rb.range(11, 14) : rb.range(7.5, 10); if (tryBlock(jx, jz, sz, sz * rb.range(0.85, 1.15), ry, 14.5, { gap: k === 0 ? 3.2 : 2.6 })) break; }
    }
    if (row % 2 === 1) await ctx.yield();
  }
  for (let i = 0, n = 0; i < 500 && n < 34; i++) {                      // outlying houses beyond the edge, each with a yard wall and often a palm
    const x = rb.range(TOWN.x0 - 110, TOWN.x1 + 110), z = rb.range(TOWN.z0 - 160, -60), far = Math.hypot(Math.max(TOWN.x0 - x, 0, x - TOWN.x1), Math.max(TOWN.z0 - z, 0));
    if (townW(x, z) > 0.08 || far > 150 || rb() > Math.exp(-far / 110) + 0.15 || !inPoly(x, z, land) || waterDist(x, z) < 30) continue;
    const W = rb.range(8, 12), D = rb.range(7, 10), ry = rb.range(0, TAU), r = rect(x, z, W / 2 + 4, D / 2 + 4, ry);
    if (placed.some((q) => Math.abs(q.x - x) < 60 && Math.abs(q.z - z) < 60 && rectsOverlap(r, q, 3))) continue;
    placed.push(r); n++;
    const b = hbOf(x, z); b.tr(x, QUAY_Y, z, ry);
    house(b, rb, -W / 2, -D / 2, W / 2, D / 2, rb.int(1, 2), pickWall(rb), false, true); door(b, 0, 0, D / 2, 0);
    b.surf(SURF.PLAIN).col(mul(pickWall(rb), 0.95), 0.84, 1.03); b.box(W / 2, 0, -D / 2 - 3.5, W / 2 + 3.5, 1.3, -D / 2 - 3.1, {}); b.box(W / 2 + 3.1, 0, -D / 2 - 3.1, W / 2 + 3.5, 1.3, D / 2 + 1, {}); b.box(-W / 2, 0, -D / 2 - 3.5, W / 2, 1.3, -D / 2 - 3.1, {});
    b.pop();
    if (rb.chance(0.55)) palmAt(x + (W / 2 + 1.6) * r.c + (-D / 2 - 1.6) * r.s, z - (W / 2 + 1.6) * r.s + (-D / 2 - 1.6) * r.c, rb.range(9, 14), false);
  }
  await ctx.yield();
  for (let i = 0; i < HB.length; i++) { addMesh(HB[i], 'houses' + i); tris += HB[i].triangles; await ctx.yield(); }
  await ctx.yield();

  // ---- palms: tall date palms in rows along the quay and the sea wall, the palm garden, courts and squares, walled groves, the dry land
  const rp = R('palms'), bP = new S.Builder(4096);
  const free = (x, z, gap) => { const r = rect(x, z, gap, gap); for (const q of placed) if (Math.abs(q.x - x) < 70 && Math.abs(q.z - z) < 70 && rectsOverlap(r, q, 0)) return false; return true; };
  const lonely = (x, z, d) => { for (const p of palms) if (Math.abs(p.x - x) < d && Math.abs(p.z - z) < d) return false; return true; };
  for (let d = 5; d < quayLen - 3; d += rp.range(11, 13.5)) { const p = quayAt(d, 3.4); if (!(p.x > GARDEN.x0 && p.x < GARDEN.x1 + 12 && p.z > GARDEN.z0 && p.z < GARDEN.z1)) palmAt(p.x, p.z, rp.range(18, 25)); }
  for (let d = dStart; d < dEnd; d += rp.range(13, 17)) {
    const p = shoreAt(d); if (p.i >= wf.i0 && p.i < wf.i1) continue;
    const x = p.x - p.ox * 4, z = p.z - p.oz * 4, low = x > 166 && x < 256;
    palmAt(x, z, low ? rp.range(8.5, 11) : rp.range(18, 25));
  }
  {                                                                     // the palm garden: a low wall with two gates, palms in loose rows
    const g = GARDEN, y = QUAY_Y, zm = (g.z0 + g.z1) / 2, xm = (g.x0 + g.x1) / 2;
    bP.surf(SURF.PLAIN).col(PAINT.walls[0], 0.85, 1.04);
    bP.box(g.x0, y, g.z0, g.x1, y + 1.5, g.z0 + 0.5, {}); bP.box(g.x0, y, g.z0 + 0.5, g.x0 + 0.5, y + 1.5, g.z1 - 0.5, {});
    bP.box(g.x0, y, g.z1 - 0.5, xm - 3, y + 1.5, g.z1, {}); bP.box(xm + 3, y, g.z1 - 0.5, g.x1, y + 1.5, g.z1, {});
    bP.box(g.x1 - 0.5, y, g.z0 + 0.5, g.x1, y + 1.5, zm - 3.5, {}); bP.box(g.x1 - 0.5, y, zm + 3.5, g.x1, y + 1.5, g.z1 - 0.5, {});
    for (const [px, pz] of [[g.x1 - 0.25, zm - 3.5], [g.x1 - 0.25, zm + 3.5], [xm - 3, g.z1 - 0.25], [xm + 3, g.z1 - 0.25]]) { bP.cbox(px, y, pz, 1.1, 2.4, 1.1); bP.col(PAINT.stone); bP.sphere(px, y + 2.7, pz, 0.5, 6, 4); bP.col(PAINT.walls[0], 0.85, 1.04); }
    bP.surf(SURF.MASONRY, 0, 1).col(PAINT.stone, 0.8, 1); bP.lathe(xm, y, zm, [[4.2, 0], [4.2, 0.7], [3.6, 0.7], [3.6, 0.35], [0, 0.35]], 12, { m: 1 });
    for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 6; iz++) {
      const px = g.x0 + 6.5 + ix * (g.x1 - g.x0 - 13) / 4 + rp.range(-1.6, 1.6), pz = g.z0 + 6 + iz * (g.z1 - g.z0 - 12) / 5 + rp.range(-1.6, 1.6);
      if (Math.hypot(px - xm, pz - zm) > 6.5) palmAt(px, pz, rp.range(13, 23));
    }
    palmAt(xm, zm, 21);
  }
  for (const [x, z, h, r] of squares) {                                 // the squares: two steps up to a paved floor, a low wall, a well or a cistern, pots, a palm or two
    const ry = Math.atan2(r.s, r.c);
    bD.tr(x, QUAY_Y, z, ry);
    bD.surf(SURF.MASONRY, 0, 1.6).col(PAINT.flag, 0.92, 1); bD.box(-h, 0, -h, h, 0.1, h, { m: 1, capM: 1 });
    bD.surf(SURF.MASONRY, 0, 0.9).col(PAINT.terra, 0.95, 1); bD.box(-h + 0.9, 0.1, -h + 0.9, h - 0.9, 0.22, h - 0.9, { m: 1, capM: 1 });
    bD.surf(SURF.PLAIN).col(PAINT.walls[1], 0.85, 1.03); bD.box(-h + 0.9, 0.22, -h + 0.9, h - 2.8, 1.4, -h + 1.3, {}); bD.box(-h + 0.9, 0.22, -h + 1.3, -h + 1.3, 1.4, h - 2.8, {});   // a wall, breast high (not a seat)
    if (rp.chance(0.6)) well(bD, h * 0.32, 0.22, -h * 0.28); else cistern(bD, h * 0.32, 0.22, -h * 0.28);
    pot(bD, -h + 2.0, 0.22, -h + 2.0, 1.3); pot(bD, -h + 2.9, 0.22, -h + 1.9, 0.95);
    bD.pop();
    const at = (lx, lz) => palmAt(x + lx * r.c + lz * r.s, z - lx * r.s + lz * r.c, rp.range(11, 17));
    at(-h * 0.42, h * 0.45); if (h > 6.5) at(h * 0.45, h * 0.42);
  }
  for (let i = 0, n = 0; i < 900 && n < 20; i++) {                      // palms in the lane mouths that the blocks leave
    const x = rp.range(TOWN.x0, TOWN.x1), z = rp.range(TOWN.z0, 10);
    if (townW(x, z) < 0.5 || !inPoly(x, z, land) || waterDist(x, z) < 17 || !free(x, z, 2.8) || !lonely(x, z, 8)) continue;
    palmAt(x, z, lineDist(x, z) < 26 ? rp.range(8.5, 11) : rp.range(11, 17)); n++;
  }
  await ctx.yield();
  for (let i = 0, n = 0; i < 400 && n < 19; i++) {                      // walled palm groves where the town thins out: thirteen round it, six more along the north edge
    const north = n >= 13, x = north ? rp.range(TOWN.x0 - 20, TOWN.x1 + 20) : rp.range(-480, 510), z = north ? rp.range(TOWN.z0 - 150, TOWN.z0 - 20) : rp.range(-490, -30), far = Math.hypot(Math.max(TOWN.x0 - x, 0, x - TOWN.x1), Math.max(TOWN.z0 - z, 0));
    if (townW(x, z) > 0.3 || far > 150 || !inPoly(x, z, land) || waterDist(x, z) < 32) continue;
    const W = rp.range(28, 46), D = rp.range(26, 40), ry = rp.range(-0.3, 0.3), r = rect(x, z, W / 2, D / 2, ry);
    if (placed.some((q) => rectsOverlap(r, q, 6))) continue;
    placed.push(r); n++;
    bP.tr(x, QUAY_Y, z, ry); bP.surf(SURF.PLAIN).col(mul(pickWall(rp), 0.96), 0.82, 1.03);
    const hw = W / 2, hd = D / 2;
    bP.box(-hw, 0, -hd, hw, 1.4, -hd + 0.5, {}); bP.box(-hw, 0, -hd + 0.5, -hw + 0.5, 1.4, hd - 0.5, {}); bP.box(hw - 0.5, 0, -hd + 0.5, hw, 1.4, hd - 0.5, {});
    bP.box(-hw, 0, hd - 0.5, -2.5, 1.4, hd, {}); bP.box(2.5, 0, hd - 0.5, hw, 1.4, hd, {});
    bP.pop();
    const k = north ? rp.int(3, 5) : rp.int(4, 8);
    for (let j = 0; j < k; j++) { const lx = rp.range(-hw + 4, hw - 4), lz = rp.range(-hd + 4, hd - 4), px = x + lx * r.c + lz * r.s, pz = z - lx * r.s + lz * r.c; if (lonely(px, pz, 6)) palmAt(px, pz, rp.range(11, 18)); }
  }
  for (let i = 0, n = 0; i < 700 && n < 36; i++) {                      // scattered palms on the dry land beyond, thinning with distance
    const x = rp.range(-780, 820), z = rp.range(-720, -16), far = Math.hypot(Math.max(TOWN.x0 - x, 0, x - TOWN.x1), Math.max(TOWN.z0 - z, 0));
    if (townW(x, z) > 0.25 || rp() > Math.exp(-far / 240) || !inPoly(x, z, land) || waterDist(x, z) < 14 || !free(x, z, 3) || !lonely(x, z, 7)) continue;
    palmAt(x, z, rp.range(9, 17)); n++;
    if (rp.chance(0.4)) { const px = x + rp.range(-6, 6), pz = z + rp.range(-6, 6); if (inPoly(px, pz, land) && waterDist(px, pz) > 10) palmAt(px, pz, rp.range(8, 14)); }
  }
  addMesh(bP, 'garden'); addMesh(bD, 'paving', false); tris += bP.triangles + bD.triangles;
  await ctx.yield();
  // a sea wind: every crown leans a little and each frond bends, about half a metre at the tips of a 12 m palm, in phases by place (the kit's wind, on the world's clock)
  const wind = flora.makeWind({ direction: [0.85, 0.5], strength: 2.6, speed: 1 }), palmOpts = { wind, backlight: 1.0, ambient: 1.6, leafAmbient: 1.5 };
  await flora.prepareLeafTexture(palmOpts, ctx.yield);
  const palmMat = flora.windMaterial(palmOpts), rg = R('palm-forms');
  const leaf = { leaf: '#3d7a3a', leafLight: '#a9c95a', leafDark: '#1e4424', bark: '#8a7458', coconuts: false };
  const near = [flora.palmGeometry({ rng: rg, detail: 1, height: 12, curve: 0.2, ...leaf }), flora.palmGeometry({ rng: rg, detail: 1, height: 13, curve: 0.45, ...leaf })];
  await ctx.yield();
  const farV = [flora.palmGeometry({ rng: rg, detail: 0, height: 12, curve: 0.2, fronds: 7, ...leaf }), flora.palmGeometry({ rng: rg, detail: 0, height: 13, curve: 0.4, fronds: 7, ...leaf })];
  // a palm's crown tops out near 1.18 of its height and reaches half its height sideways: within that reach of the flight's 15 m lane it stays under 14 m
  // (and beyond the ring, where the last leg looks south over the roofs to the sea, palms stay low)
  { const T = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3, tn = T(near[0]), tf = T(farV[0]), cost = (p) => (lineDist(p.x, p.z) > 55 ? tf : tn); let sum = tris + 9000; for (const p of palms) sum += cost(p); while (sum > TRI_CAP && palms.length > 160) sum -= cost(palms.pop()); }
  const points = palms.map((p, i) => { const d = lineDist(p.x, p.z), beyond = p.x > 166 && p.x < 254 && p.z > -36, h = Math.min(p.h, beyond ? 9.6 : Math.max(9.6, (d - 16.8) / 0.56)); p.h = h; return { x: p.x, y: p.y, z: p.z, s: h / (i % 2 ? 13 : 12), rot: rp() * TAU, d, u: 0, v: i % 2 }; });
  const scatter = flora.makeScatter({ rng: R('scatter'), variants: near, farVariants: farV, farDistance: 55, points, material: palmMat, tint: 0.12, hue: 0.04, tilt: 0.045, stretch: 0.08, sink: 0.012, castShadow: true });
  scatter.object.traverse((o) => { if (o.isMesh) { o.castShadow = near.includes(o.geometry); o.name = 'palms'; } });   // only the palms beside the flight throw shadows: the shadow pass draws every caster a second time
  object.add(scatter.object); tris += scatter.triangles;
  await ctx.yield();

  // ---- small open boats at moorings in the basin, rocking on the clock
  const rw = R('boats'), bpos = [], bhead = [];
  for (let i = 0; i < 11; i++) {
    const p = quayAt(quayLen * (0.05 + 0.9 * (i + rw.range(0.2, 0.8)) / 11), -rw.range(4.5, 7.5));
    bpos.push([p.x, 0, p.z]); bhead.push(rw.chance(0.3) ? Math.atan2(-p.oz, -p.ox) : Math.atan2(-p.ox, p.oz) + (rw.chance(0.5) ? Math.PI : 0));
  }
  for (const q of [[86, -24], [-92, -30], [-66, -42], [60, -40]]) { bpos.push([q[0], 0, q[1]]); bhead.push(rw() * TAU); }
  const swell = typeof opts.seaHeight === 'function' ? opts.seaHeight : (x, z, t) => 0.09 * Math.sin(x * 0.31 + t * 1.15) + 0.07 * Math.sin(z * 0.43 - t * 0.9 + x * 0.12);
  const boats = S.makeBoats({ rng: rw, types: ['rowboat'], variants: 3, positions: bpos, headings: bhead, moving: false, lit: 0, heightAt: swell, mats, palette: { hull: ['#2f6fae', '#e6dcc4', '#b8473a', '#3aa7b8', '#f3e3c3'] } });
  object.add(boats.object); tris += boats.triangles;
  await ctx.yield();

  return {
    object, radius: 430, height: 118, center: new THREE.Vector3(0, 30, -170), ground: false,
    anchors: { mouth: [0, 0, 0], basinCentre: [BASIN.x, 0, BASIN.z], ring: RING.slice(), corridor: CORRIDOR.map((p) => p.slice()), towers, domes, quayY: QUAY_Y },
    stats: { triangles: Math.round(tris), blocks, palms: palms.length, towers: towers.length, domes: domes.length, boats: boats.count },
    update(dt, time, camera) { mats.update(dt, time); scatter.update(dt, time, camera); boats.update(dt, time); },
    dispose() {
      object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      for (const g of [...near, ...farV]) g.dispose();
      for (const m of [mats.facade, ...mats.facades, palmMat, palmMat.userData && palmMat.userData.depthMaterial]) if (m) { if (m.map) m.map.dispose(); m.dispose(); }
    },
  };
}
