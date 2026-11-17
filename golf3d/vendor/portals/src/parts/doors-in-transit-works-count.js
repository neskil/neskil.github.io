// doors-in-transit: THE TOWER'S COUNT (the works builder's part), made on every build and kept by the works
// (works.towerAir), so that what the remarks say of the winding tower is counted and not only said:
//   threads  the least distance between anything that moves with one door (its leaf in its frame, its straps, its
//            carrier, its step) and anything that moves with ANOTHER door, anywhere on the course; and between what
//            moves on one thread or on a bend and the fixed arms, rods and shoes that carry the OTHER thread;
//   fixed    the least distance between anything that moves and anything fixed on the tower.
// How: everything on the tower is level and plumb, so each thing is a true box turned only about the plumb line: a
// rectangle in plan and a stretch of height. The distance between two such boxes is exact (the plan distance of two
// rectangles, 0 where they cross, with the gap in height). `threads` takes every door of the chain in its place and
// moves the chain through one whole pitch, after which the picture repeats, every 5 cm; `fixed` takes one door with
// its gear round the whole course every 5 cm: both good to two or three centimetres. Not counted, being contact by
// nature: a carrier and its step against the bend's beam that carries it (the wheels run inside it; the step slides
// into its end).
import { DOOR } from './doors-in-transit-plan.js';

// the least distance in plan between two rectangles, each given in its own frame as [x0, x1, , , z0, z1] from index
// i (j) of a flat list (a frame: [x, , z, tx, tz], the level unit heading); 0 where they cross
function planGap(A, i, a, B, j, b) {
  const dx = b[0] - a[0], dz = b[2] - a[2], c = a[3] * b[3] + a[4] * b[4], s = a[3] * b[4] - a[4] * b[3];
  const ox = dx * a[3] + dz * a[4], oz = -dx * a[4] + dz * a[3], px = -(dx * b[3] + dz * b[4]), pz = dx * b[4] - dz * b[3];
  const A0 = A[i], A1 = A[i + 1], A4 = A[i + 4], A5 = A[i + 5], B0 = B[j], B1 = B[j + 1], B4 = B[j + 4], B5 = B[j + 5];
  let best = Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, u0 = Infinity, u1 = -Infinity, w0 = Infinity, w1 = -Infinity;
  for (let k = 0; k < 4; k++) {
    const bx = k & 1 ? B1 : B0, bz = k & 2 ? B5 : B4, x = ox + c * bx - s * bz, z = oz + s * bx + c * bz;      // a corner of B in A's frame
    const ex = Math.max(0, A0 - x, x - A1), ez = Math.max(0, A4 - z, z - A5), e = ex * ex + ez * ez; if (e < best) best = e;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z;
    const ax = k & 1 ? A1 : A0, az = k & 2 ? A5 : A4, u = px + c * ax + s * az, w = pz - s * ax + c * az;      // a corner of A in B's frame
    const fx = Math.max(0, B0 - u, u - B1), fz = Math.max(0, B4 - w, w - B5), f = fx * fx + fz * fz; if (f < best) best = f;
    if (u < u0) u0 = u; if (u > u1) u1 = u; if (w < w0) w0 = w; if (w > w1) w1 = w;
  }
  return x0 <= A1 && x1 >= A0 && z0 <= A5 && z1 >= A4 && u0 <= B1 && u1 >= B0 && w0 <= B5 && w1 >= B4 ? 0 : Math.sqrt(best);
}

// a standing bar of the iron ([px, py, pz, qx, qy, qz, reach, w, h, upx, upy, upz], level or plumb) as such a box
function barBox(a) {
  const dx = a[3] - a[0], dy = a[4] - a[1], dz = a[5] - a[2], len = Math.hypot(dx, dz);
  if (len < 1e-6) { const ul = Math.hypot(a[9], a[11]), tx = ul > 1e-6 ? a[11] / ul : 1, tz = ul > 1e-6 ? -a[9] / ul : 0;      // plumb: w across its `up`, h along it
    return { f: [a[0], 0, a[2], tx, tz], b: [-a[7] / 2, a[7] / 2, Math.min(a[1], a[4]), Math.max(a[1], a[4]), -a[8] / 2, a[8] / 2], r: Math.hypot(a[7], a[8]) / 2 }; }
  if (Math.abs(dy) > 1e-6) return null;                                                          // (nothing on the tower slopes)
  return { f: [(a[0] + a[3]) / 2, 0, (a[2] + a[5]) / 2, dx / len, dz / len], b: [-len / 2, len / 2, a[1] - a[8] / 2, a[1] + a[8] / 2, -a[7] / 2, a[7] / 2], r: Math.hypot(len, a[7]) / 2 };
}

// TW: the tower's rail and gear (…-works-tower.js); marks: [[what, thread or -1, bend or -1, axes, from, to], ...],
// the stretches of the iron's own lists of bars that stand on the tower (towerIron tells them)
export async function countTower(ctx, { TW, marks }) {
  const G = TW.gearBoxes(), L = TW.TOWER_LENGTH, n = Math.floor(L / DOOR.pitch), pitch = L / n;
  const list = [[...G.door, 0], ...G.straps.map((b) => [...b, 0]), ...G.hang.map((b) => [...b, 1]), [...G.step, 2]];      // [what, box, kind]: 1 the carrier, 2 the step
  const N = list.length, M = new Float64Array(N * 6), kind = list.map((b) => b[2]), name = list.map((b) => b[0]);
  let reach = 0, low = Infinity, high = -Infinity;
  list.forEach((b, i) => { M.set(b[1], i * 6); reach = Math.max(reach, Math.hypot(Math.max(-b[1][0], b[1][1]), Math.max(-b[1][4], b[1][5]))); low = Math.min(low, b[1][2]); high = Math.max(high, b[1][3]); });
  const out = { threads: { dist: Infinity, what: '' }, fixed: { dist: Infinity, what: '' } };
  const pose = (s) => { const q = TW.towerPoint(s); q.part = TW.towerPart(s); q.stepped = !TW.onBeam(s - G.stepOn) || !TW.onBeam(s + G.stepOn); return q; };
  const hung = (q) => ' of a door hung at ' + q[1].toFixed(1) + ' m';
  // 1 moving against moving: every pair of doors, the chain moved through one pitch
  const D = new Array(n);
  for (let s0 = 0, pass = 0; s0 < pitch; s0 += 0.05, pass++) {
    for (let i = 0; i < n; i++) D[i] = pose(s0 + i * pitch);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = D[i], b = D[j], lim = out.threads.dist, dy = b[1] - a[1], far = 2 * reach + lim, ex = a[0] - b[0], ez = a[2] - b[2];
      if (Math.abs(dy) - (high - low) >= lim || ex * ex + ez * ez >= far * far) continue;
      for (let p = 0; p < N; p++) { if (kind[p] === 2 && !a.stepped) continue;
        const ay0 = M[p * 6 + 2] - dy, ay1 = M[p * 6 + 3] - dy;
        for (let q = 0; q < N; q++) {
          const gap = Math.max(0, ay0 - M[q * 6 + 3], M[q * 6 + 2] - ay1); if (gap >= out.threads.dist || (kind[q] === 2 && !b.stepped)) continue;
          const d = Math.hypot(gap, planGap(M, p * 6, a, M, q * 6, b));
          if (d < out.threads.dist) { out.threads.dist = d; out.threads.what = 'the ' + name[p] + hung(a) + ' against the ' + name[q] + hung(b); }
        } }
    }
    if (pass % 8 === 7) await ctx.yield();
  }
  // 2 moving against fixed: the standing bars in slabs of height, one door with its gear round the whole course
  const SLAB = 4, slabs = [];
  for (const [what, thread, bend, axes, from, to] of marks) for (let i = from; i < to; i++) {
    const bb = barBox(axes[i]); if (!bb) continue; bb.what = what; bb.thread = thread; bb.bend = bend; bb.seen = -1;
    for (let k = Math.max(0, Math.floor(bb.b[2] / SLAB)); k <= Math.floor(bb.b[3] / SLAB); k++) (slabs[k] || (slabs[k] = [])).push(bb);
  }
  await ctx.yield();
  for (let s = 0, pass = 0; s < L; s += 0.05, pass++) {
    const a = pose(s), own = a.part === 1 ? 0 : a.part === 3 ? 1 : -1, thread = a.part === 0 ? 0 : a.part === 2 ? 1 : -1;
    for (let k = Math.max(0, Math.floor((a[1] + low - 0.6) / SLAB)); k <= Math.floor((a[1] + high + 0.6) / SLAB); k++) {
      const row = slabs[k]; if (!row) continue;
      for (let e = 0; e < row.length; e++) {
        const F = row[e]; if (F.seen === pass) continue; F.seen = pass;
        const other = F.thread >= 0 && F.thread !== thread, lim = other ? Math.max(out.fixed.dist, out.threads.dist) : out.fixed.dist;
        const far = reach + F.r + lim, ex = F.f[0] - a[0], ez = F.f[2] - a[2]; if (ex * ex + ez * ez >= far * far) continue;
        for (let p = 0; p < N; p++) {
          if ((kind[p] === 2 && !a.stepped) || (kind[p] > 0 && own >= 0 && F.bend === own)) continue;
          const gap = Math.max(0, a[1] + M[p * 6 + 2] - F.b[3], F.b[2] - a[1] - M[p * 6 + 3]); if (gap >= lim) continue;
          const d = Math.hypot(gap, planGap(M, p * 6, a, F.b, 0, F.f));
          if (d < out.fixed.dist) { out.fixed.dist = d; out.fixed.what = 'the ' + name[p] + hung(a) + ' against ' + F.what; }
          if (other && d < out.threads.dist) { out.threads.dist = d; out.threads.what = 'the ' + name[p] + hung(a) + ' against ' + F.what; }
        }
      }
    }
    if (pass % 400 === 399) await ctx.yield();
  }
  return out;
}
