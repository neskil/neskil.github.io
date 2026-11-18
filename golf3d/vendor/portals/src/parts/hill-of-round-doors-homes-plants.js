// hill-of-round-doors, the homes: the garden's plants, each laid into a geo at a place on the garden's level
// (y 0). Everything is about three times life size, like the homes. Upper parts carry `sway` so that the wind stirs
// them. Colours are linear triples; r: the stream that deals the plant's own shape.
import { KIND, mul, mix } from './hill-of-round-doors-homes-geo.js';

const hex = (h) => { const n = parseInt(h.slice(1), 16), f = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)]; };
export const LEAF = hex('#3f8a2c'), LEAF_DARK = hex('#2c6a24'), STEM = hex('#5a8f34'), ROSE_LEAF = hex('#62ae3c');
export const BLOOMS = {
  hollyhock: ['#e8508a', '#c22a4a', '#f6e3c8', '#f2c8d8', '#7a2a6a', '#f0d24a'].map(hex),
  lupin: ['#6a4fd0', '#3b62d8', '#d85aa8', '#9a5fe0'].map(hex),
  rose: ['#d8213a', '#f08aa6', '#f7efe2', '#f4c430'].map(hex),
  low: ['#f28a1a', '#f4d21e', '#7f6fe0', '#f6f2e6', '#e84a6a', '#e03a2a', '#5aa0e8'].map(hex),
  nasturtium: ['#f2671a', '#f0a81c', '#e23a1e'].map(hex),
};
const SUN_PETAL = hex('#f6c21a'), SUN_EYE = hex('#4a2a12'), CABBAGE = hex('#8fc49a'), CABBAGE_OUT = hex('#4f9a5a'), CANE = hex('#b89a5a');

// a flat bloom: a fan of `n` corners round (x, y, z) facing (nx, ny, nz); rim: its outer colour; star > 0: every
// second corner drawn in by that share (petals)
function bloom(G, x, y, z, nx, ny, nz, rad, n, c, rim, sway, star = 0) {
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  let ux = -nz, uy = 0, uz = nx; const ul = Math.hypot(ux, uz); if (ul < 1e-3) { ux = 1; uz = 0; } else { ux /= ul; uz /= ul; }
  const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux;
  const c0 = G.vert(x, y, z, nx, ny, nz, c, KIND.LEAF, 0, 0, 0, sway), first = G.vertices;
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, rr = rad * (star && i % 2 ? 1 - star : 1), cs = Math.cos(t) * rr, sn = Math.sin(t) * rr; G.vert(x + ux * cs + vx * sn, y + uy * cs + vy * sn, z + uz * cs + vz * sn, nx, ny, nz, rim, KIND.LEAF, 0, 0, 0, sway); }
  for (let i = 0; i < n; i++) G.tri(c0, first + i, first + (i + 1) % n);
}
// a leaf: a kite from (x, y, z) out along (dx, dz) rising by `up`
function leaf(G, x, y, z, dx, dz, len, wid, up, c, sway) {
  const px = -dz, pz = dx, tip = [x + dx * len, y + up, z + dz * len], mid = [x + dx * len * 0.5, y + up * 0.7, z + dz * len * 0.5];
  const a = G.vert(x, y, z, 0, 1, 0, mul(c, 0.8), KIND.LEAF, 0, 0, 0, sway * 0.3), b = G.vert(mid[0] + px * wid, mid[1], mid[2] + pz * wid, 0, 1, 0, c, KIND.LEAF, 0, 0, 0, sway * 0.7);
  const d = G.vert(mid[0] - px * wid, mid[1], mid[2] - pz * wid, 0, 1, 0, c, KIND.LEAF, 0, 0, 0, sway * 0.7), e = G.vert(tip[0], tip[1], tip[2], 0, 1, 0, mul(c, 1.15), KIND.LEAF, 0, 0, 0, sway);
  G.tri(a, b, d); G.tri(b, e, d);
}
// a stem: a thin three-sided bar from the ground to height h at (x, z), leaning by (lx, lz) at its top
function stem(G, x, z, h, lx, lz, c, sway) { G.tube([x, 0, z], [x + lx, h, z + lz], 0.045, 0.03, 3, mul(c, 0.8), KIND.LEAF, 0, { cb: c, swayB: sway }); }

export function hollyhock(G, x, z, h, col, r) {
  const lx = (r() - 0.5) * 0.3, lz = (r() - 0.5) * 0.3 + 0.1, n = 5 + Math.floor(r() * 4), turn = r() * 6.28;
  stem(G, x, z, h, lx, lz, STEM, 0.22);
  for (let i = 0; i < n; i++) {
    const f = 0.42 + 0.58 * i / (n - 1), a = turn + i * 2.4, cs = Math.cos(a), sn = Math.abs(Math.sin(a)) * 0.9 + 0.1, rad = 0.3 - 0.13 * (i / n);
    bloom(G, x + lx * f + cs * 0.16, h * f, z + lz * f + sn * 0.16, cs * 0.7, 0.25, sn, rad, 6, mul(col, 0.7), col, 0.22 * f);
  }
  for (let i = 0; i < 3; i++) { const a = turn + i * 2.1; leaf(G, x, 0.25 + 0.3 * i, z, Math.cos(a), Math.sin(a), 0.7, 0.3, 0.2, i % 2 ? LEAF : LEAF_DARK, 0.06); }
}
export function sunflower(G, x, z, h, r) {
  const lx = (r() - 0.5) * 0.25, lz = 0.12 + r() * 0.15, turn = r() * 6.28, tilt = 0.25 + r() * 0.3, yaw = (r() - 0.5) * 0.9;
  stem(G, x, z, h, lx, lz, STEM, 0.18);
  const nx = Math.sin(yaw), nz = Math.cos(yaw), hx = x + lx + nx * 0.08, hz = z + lz + nz * 0.08;
  bloom(G, hx, h, hz, nx, tilt, nz, 0.62, 16, SUN_PETAL, mul(SUN_PETAL, 1.1), 0.18, 0.42);
  bloom(G, hx + nx * 0.04, h + 0.012, hz + nz * 0.04, nx, tilt, nz, 0.27, 8, mul(SUN_EYE, 0.8), SUN_EYE, 0.18);
  for (let i = 0; i < 3; i++) { const a = turn + i * 2.3, f = 0.3 + 0.2 * i; leaf(G, x + lx * f, h * f, z + lz * f, Math.cos(a), Math.sin(a), 0.75, 0.3, -0.12, i % 2 ? LEAF : LEAF_DARK, 0.1 * f); }
}
export function lupin(G, x, z, h, col, r) {
  const turn = r() * 6.28;
  for (let k = 0; k < 3; k++) {
    const a = turn + k * 2.2, ox = Math.cos(a) * 0.22 * k, oz = Math.sin(a) * 0.22 * k, hh = h * (1 - 0.18 * k);
    G.tube([x + ox, hh * 0.38, z + oz], [x + ox * 1.2, hh, z + oz * 1.2], 0.17, 0.03, 5, mul(col, 0.75), KIND.LEAF, 0, { cb: mix(col, [1, 1, 1], 0.35), swayA: 0.05, swayB: 0.16 });
    G.tube([x + ox * 0.6, 0, z + oz * 0.6], [x + ox, hh * 0.4, z + oz], 0.035, 0.03, 3, STEM, KIND.LEAF, 0, { swayB: 0.05 });
  }
  for (let i = 0; i < 4; i++) { const a = turn + i * 1.6; leaf(G, x, 0.18, z, Math.cos(a), Math.sin(a), 0.6, 0.25, 0.25, i % 2 ? LEAF : LEAF_DARK, 0.05); }
}
// a rose bush: a rounded mass of dark leaf studded with blooms
export function rose(G, x, z, h, col, r, lean = false) {
  const w = h * (0.55 + 0.2 * r());
  G.ball(x, h * 0.55, z, 1, lean ? 6 : 7, lean ? 3 : 4, ROSE_LEAF, KIND.LEAF, 0, w, h * 0.55, w, LEAF, 0.05);
  const n = 16 + Math.floor(r() * 9);                          // a bush in full bloom: roses all over its sunny dome
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, e = 0.1 + r() * 1.3, cs = Math.cos(a) * Math.cos(e), sn = Math.sin(a) * Math.cos(e), up = Math.sin(e);
    bloom(G, x + cs * w * 1.03, h * 0.55 + up * h * 0.57, z + sn * w * 1.03, cs, up + 0.25, sn, (0.17 + 0.09 * r()) * (0.8 + 0.25 * w), lean ? 5 : 6, mul(col, 0.8), col, 0.06);
  }
}
// a low drift plant: a mound of leaf with small blooms over it (marigold, lavender, daisy ...); lean: built of
// fewer faces, for one that stands far from the flown line (the same dice either way)
export function drift(G, x, z, h, col, r, lean = false) {
  const w = 0.32 + 0.2 * r(), n = 4 + Math.floor(r() * 4);
  G.ball(x, h * 0.45, z, 1, lean ? 4 : 5, lean ? 2 : 3, LEAF, KIND.LEAF, 0, w, h * 0.5, w, LEAF_DARK, 0.04);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, d = r() * w * 0.9, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d;
    bloom(G, bx, h * (0.85 + 0.3 * r()), bz, Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4 + 0.3, (0.11 + 0.06 * r()) * (lean ? 1.15 : 1), lean ? 4 : 5, mul(col, 0.8), col, 0.07);
  }
}
// a cabbage: a pale heart in a ruff of outer leaves
export function cabbage(G, x, z, s, r) {
  G.ball(x, 0.3 * s, z, 0.34 * s, 6, 4, CABBAGE, KIND.LEAF, 0, 1, 0.85, 1, mul(CABBAGE_OUT, 0.8));
  const turn = r() * 6.28;
  for (let i = 0; i < 5; i++) { const a = turn + i * 1.257; leaf(G, x, 0.06, z, Math.cos(a), Math.sin(a), 0.62 * s, 0.34 * s, 0.24 * s, i % 2 ? CABBAGE_OUT : mul(CABBAGE_OUT, 1.2), 0.02); }
}
// a row of runner beans: pairs of canes leaning together under a ridge cane, hung with leaf and scarlet flowers;
// from (x0, z0) along (dx, dz) for len metres, h high
export function beans(G, x0, z0, dx, dz, len, h, r) {
  const px = -dz, pz = dx, n = Math.max(3, Math.round(len / 0.75)), red = BLOOMS.nasturtium[2];
  G.tube([x0, h * 0.94, z0], [x0 + dx * len, h * 0.94, z0 + dz * len], 0.03, 0.03, 3, CANE, KIND.PAINT);
  for (let i = 0; i <= n; i++) {
    const t = i / n * len, cx = x0 + dx * t, cz = z0 + dz * t;
    for (const s of [-1, 1]) {
      const fx = cx + px * s * 0.42, fz = cz + pz * s * 0.42, tx = cx - px * s * 0.06, tz = cz - pz * s * 0.06;
      G.tube([fx, 0, fz], [tx, h, tz], 0.03, 0.022, 3, mul(CANE, 0.8), KIND.PAINT, 0, { cb: CANE });
      for (let k = 0; k < 4; k++) {
        const f = 0.16 + 0.2 * k + 0.1 * r(), lx = fx + (tx - fx) * f, lz = fz + (tz - fz) * f, a = r() * 6.28;
        leaf(G, lx, h * f, lz, Math.cos(a), Math.sin(a), 0.42, 0.22, 0.05, k % 2 ? LEAF : LEAF_DARK, 0.06);
        if (r() < 0.4) bloom(G, lx + px * s * 0.1, h * f + 0.1, lz + pz * s * 0.1, px * s, 0.3, pz * s, 0.09, 4, red, red, 0.06);
      }
    }
  }
}
// what fills a window box or a tub: blooms over a strip of leaf from (x0, y, z) to (x1, y, z), trailing a little
export function boxFlowers(G, x0, x1, y, z, col, r) {
  const n = Math.max(3, Math.round((x1 - x0) / 0.22));
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / n, hh = 0.16 + 0.22 * r(), zz = z + (r() - 0.5) * 0.16;
    leaf(G, x, y, zz, (r() - 0.5) * 0.8, 1, 0.34, 0.16, -0.14 - 0.2 * r(), i % 2 ? LEAF : LEAF_DARK, 0.04);
    bloom(G, x, y + hh, zz, (r() - 0.5) * 0.6, 0.6, 1, 0.1 + 0.05 * r(), 5, mul(col, 0.8), col, 0.05);
  }
}
export { bloom as flower };
