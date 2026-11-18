// valley-inside-the-works, the chocolate: THE CREAM SPRING (plan: CREAM). A round basin of pale worn limestone
// (inner radius 2.6, rim 0.6 wide, 1 m high) brims with thick ivory cream that barely moves; the cream pours over a
// worn notch on the river side in one soft round rope that arcs out, thickens where it lands and folds there into a
// low heap, round which a pale patch spreads; the shader draws that out downstream, marbled.
import * as P from './valley-inside-the-works-plan.js';
import { streamV, smooth, LIFT } from './valley-inside-the-works-chocolate-river.js';

const C = P.CREAM, R_IN = C.r, R_OUT = C.r + 0.6;
const GROUND = P.groundHeight(C.x, C.z), RIM_Y = GROUND + 1.0, CREAM_Y = RIM_Y - 0.07;
const notch = (a) => smooth(0.36, 0.13, Math.abs(a));          // 1 in the worn notch (a: angle from +x, the river side)
export const LAND = { x: C.x + R_OUT + 1.1, z: C.z };           // where the rope meets the river: nearly a metre out from the shore

// The stone basin: one small mesh for a lit stone material (position, normal, color). rng: a stream of the seed.
export function basinGeometry(THREE, rng) {
  const SEG = 44, pos = [], col = [], idx = [];
  // rings from the buried foot, up the outer wall, over the worn top, down the inner wall to under the cream
  const rings = [[R_OUT + 0.05, -1.2, 0.8], [R_OUT + 0.03, 0.45, 0.92], [R_OUT, 0.93, 1], [R_OUT - 0.09, 1.0, 1.04], [R_IN + 0.1, 1.0, 1.04], [R_IN, 0.95, 0.98], [R_IN - 0.02, 0.6, 0.8]];
  for (const [r, h, tone] of rings) {
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * 2 * Math.PI, n = notch(a > Math.PI ? a - 2 * Math.PI : a);
      const wear = (rng() - 0.5) * 0.05, rr = r + wear, top = h > 0.9 ? h - 0.25 * n - Math.abs(wear) * 0.6 : h;
      pos.push(C.x + rr * Math.cos(a), GROUND + top, C.z + rr * Math.sin(a));
      const t = tone * (0.93 + 0.14 * rng()) * (1 - 0.3 * n * (h > 0.4 ? 1 : 0.6));   // darker, damp stone where the cream runs
      col.push(0.74 * t, 0.7 * t, 0.6 * t);
    }
  }
  for (let k = 0; k + 1 < rings.length; k++) for (let i = 0; i < SEG; i++) {
    const a = k * SEG + i, b = k * SEG + (i + 1) % SEG, c = a + SEG, d = b + SEG;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// The cream in the basin (a brimming, faintly domed disc) and the fat rope over the notch, in the family's layout.
export function addCream(acc) {
  const v0 = streamV(C.z) - 40, pure = { cream: 1, half: -R_IN };
  const SEG = 36, RINGS = [0, 0.9, 1.8, R_IN + 0.04];
  let prev = null;
  for (const r of RINGS) {
    const row = [];
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * 2 * Math.PI, x = C.x + r * Math.cos(a), z = C.z + r * Math.sin(a);
      row.push(acc.vertex(x, CREAM_Y + 0.05 * (1 - (r / R_IN) ** 2), z, x - C.x, v0 + (x - C.x), 1, 0, 0, 0.06, 0.3, pure));
    }
    if (prev) acc.strip(prev, row);
    prev = row;
  }
  // THE ROPE: from inside the notch, over its lip, and out in an arc to the river: a soft round rope, thinner as it
  // speeds up and thick again where it slows and lands; slow bulges travel down it and it sways a little (the
  // family's vertex shader: aMove). path: x, y, half width, how round it stands (0.55 flat on the stone .. 0.85)
  const yRiver = P.riverY(C.z) + LIFT - 0.12, lipY = RIM_Y - 0.25 + 0.14, path = [], xL = C.x + R_OUT - 0.25;
  for (let i = 0; i <= 3; i++) path.push([C.x + R_IN - 0.5 + (0.5 + 0.6 - 0.25) * (i / 3), CREAM_Y + (lipY - CREAM_Y) * (i / 3), 0.62 - 0.1 * (i / 3), 0.55]);
  for (let i = 1; i <= 10; i++) {
    const u = i / 10;
    path.push([xL + (LAND.x - xL) * u, lipY - 0.06 * u - (lipY - 0.06 - yRiver) * Math.pow(u, 1.6), 0.5 - 0.24 * smooth(0, 0.6, u) + 0.17 * smooth(0.68, 1, u), 0.55 + 0.3 * smooth(0, 0.4, u)]);
  }
  prev = null;
  let s = 0;
  const K = 2 * Math.PI / 0.8;                          // (a bulge every 0.8 m)
  for (let i = 0; i < path.length; i++) {
    const [x, y, hw, round] = path[i], a = path[Math.min(i + 1, path.length - 1)], b = path[Math.max(i - 1, 0)];
    let tx = a[0] - b[0], ty = a[1] - b[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    if (i > 0) s += Math.hypot(x - path[i - 1][0], y - path[i - 1][1]);
    const free = smooth(3.5, 6, i), row = [];
    for (let j = 0; j <= 12; j++) {                     // a round across (flatter where it lies on the stone)
      const q = (j / 12) * 2 * Math.PI, w = -Math.cos(q) * hw, out = Math.sin(q) * hw * (Math.sin(q) > 0 ? round : 0.35 + 0.5 * free);
      row.push(acc.vertex(x - ty * out, y + tx * out, C.z + w, w, v0 + 8 + s, tx * K, ty * K, 0, 0.5 + 1.2 * (i / path.length), Math.abs(w) / hw,
        { cream: 1, half: -R_IN, move: [0.035 * free, 0.045 * free * smooth(4, 13, i), K * s, 0.7] }));
    }
    if (prev) acc.strip(prev, row);
    prev = row;
  }
  // WHERE IT LANDS IT FOLDS: a low round heap of cream on the river's face, over which a fold or two travel outward
  // (laid by the rope, pushed out, sinking), and round it the river's own patch of cream (creamDress, below)
  const yFace = P.riverY(C.z) + LIFT, RM = 1.15, KF = 2 * Math.PI / 0.42;
  prev = null;
  for (let k = 0; k <= 13; k++) {
    const r = Math.max(RM * k / 13, 0.03), h = 0.24 * Math.pow(Math.max(1 - (r / RM) * (r / RM), 0), 1.4) - 0.03 * smooth(0.8, 1, r / RM), row = [];
    const amp = 0.065 * smooth(0.05, 0.3, r) * (1 - smooth(0.7, 1.1, r));
    for (let j = 0; j <= 14; j++) {
      const a = (j / 14) * 2 * Math.PI, dx = Math.cos(a), dz = Math.sin(a);
      row.push(acc.vertex(LAND.x + r * dx * 1.15, yFace + h, LAND.z + r * dz, LAND.x - C.x + r * dx, v0 + 12 + r * dz, dx * KF, 0, dz * KF, 0.3, 0.3, { cream: 1, half: -R_IN, move: [amp, 0, KF * r, 0] }));
    }
    if (prev) acc.strip(prev, row);
    prev = row;
  }
}

// What the river carries where the rope lands: a small pool of pure cream and the slow rings of its folding.
export function creamDress(u, v, z, x) {
  const dx = x - LAND.x, dz = z - LAND.z, r = Math.hypot(dx, dz), re = Math.hypot(dx, dz * (dz > 0 ? 0.5 : 1.25));   // (the patch is drawn out downstream)
  if (re > 3.4) return null;
  const rr = Math.max(r, 0.05);
  return { cream: 0.97 * (1 - smooth(0.7, 2.9, re)), pleat: [r, 0.085 * Math.exp(-r / 0.8) * smooth(0.1, 0.4, r), dx / rr, dz / rr], kind: 0 };
}
