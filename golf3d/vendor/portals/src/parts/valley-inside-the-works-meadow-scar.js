// valley-inside-the-works, the meadow: THE SCAR. Where the plan's floor steps 14 m (z -38 to -43) stands a natural scar
// of pale limestone, right across the valley. Its form is dealt in the scar-form file (beds of uneven thickness that
// dip, ledges that swell and pinch out, a face that wanders, joints, clefts, the worn notch of the fall); this file
// makes that form into triangles: every bed's face from column to column, its top edge worn round (a strip whose
// shading turns from the face's to the ledge's), the ledge behind it (turf at the back of a deep one), the scar's top
// running back into the meadow, the sides of the notch, the plain rock behind the fall with the worn lip the river
// runs out over, and the fallen blocks and scree at the foot (the rubble file). It wears the ground's own material:
// aG = (12, how much is rock, and above 1 how wet); 12 tells the paint that this is the scar's own weathered stone.
// userData.spots: where a plant can root (kind 0 a ledge, 1 the rim, 2 a cleft, 3 the turf of the top), read by the far meadow.
// Streams: rng deals the form ('meadow-scar'), rubbleRng the fallen blocks, the scree and the rim's stones ('meadow-scar-rubble').
import * as P from './valley-inside-the-works-plan.js';
import { scarForm, FOOT_Z, BACK_Z, WALL_Z, NOTCH } from './valley-inside-the-works-meadow-scar-form.js';
import { scarRubble } from './valley-inside-the-works-meadow-scar-rubble.js';

// WET ROCK goes by the block: all of it behind the fall, and beside the fall each bed's blocks out to the joint its
// form names (wetTo), so that the wet's edge runs in steps along joints and bed lines. E.wet says whether what is
// being made is wet; the paint makes wet rock dark, brown-stained, glossy and bare, with glints on its worn edges.

function emitter() {
  const pos = [], nor = [], col = [], gg = [];
  const E = {
    pos, nor, col, gg, wet: 0,
    // a b c anticlockwise seen from outside; k: their shades; r: how much of each is rock; n: their normals (null: the flat one)
    tri(a, b, c, ka, kb, kc, ra = 1, rb = 1, rc = 1, na = null, nb = null, nc = null) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz);
      if (l < 1e-9) return;
      nx /= l; ny /= l; nz /= l;
      pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      for (const n of [na, nb, nc]) { if (n) nor.push(n[0], n[1], n[2]); else nor.push(nx, ny, nz); }
      col.push(ka, ka, ka * 0.98, kb, kb, kb * 0.98, kc, kc, kc * 0.98);
      gg.push(12, ra >= 1 ? 1 + E.wet : ra, 12, rb >= 1 ? 1 + E.wet : rb, 12, rc >= 1 ? 1 + E.wet : rc);
    },
    quad(a, b, c, d, ka, kb, kc, kd, ra = 1, rb = 1, rc = 1, rd = 1, na = null, nb = null, nc = null, nd = null) {
      E.tri(a, b, c, ka, kb, kc, ra, rb, rc, na, nb, nc); E.tri(a, c, d, ka, kc, kd, ra, rc, rd, na, nc, nd);
    },
    // a quad of four points p with shades k, turned whichever way makes it face along `want`
    facing(want, p, k, r = [1, 1, 1, 1]) {
      const n = E.normal(p[0], p[1], p[2]);
      if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] >= 0) E.quad(p[0], p[1], p[2], p[3], k[0], k[1], k[2], k[3], r[0], r[1], r[2], r[3]);
      else E.quad(p[0], p[3], p[2], p[1], k[0], k[3], k[2], k[1], r[0], r[3], r[2], r[1]);
    },
    normal(a, b, c) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      return [nx / l, ny / l, nz / l];
    },
  };
  return E;
}

export async function scarGeometry(ctx, THREE, rng, rubbleRng) {
  const S = scarForm(rng), E = emitter(), { cols, K, N, F, YB, YT, foot, top, rim, beds } = S, spots = [], UP = [0, 1, 0];
  await ctx.yield();
  const gap = cols.findIndex((c) => c.x > 0);       // the river runs between columns gap - 1 and gap
  const kf = new Int32Array(N);                     // the bed whose top is the rim, at each column
  for (let i = 0; i < N; i++) { let k = 0; while (k < K - 1 && YT[k][i] < rim[i] - 1e-3) k++; kf[i] = k; }
  const worn = (k, i, zn) => Math.max(0, Math.min(0.22, 0.14 * (YT[k][i] - YB[k][i]), 0.45 * (F[k][i] - zn)));
  for (let i = 0; i + 1 < N; i++) {
    if (i + 1 === gap) continue;
    const j = i + 1, x0 = cols[i].x, x1 = cols[j].x, kk = Math.max(kf[i], kf[j]), xm = (x0 + x1) / 2, clean = Math.abs(xm) < 14;
    const dk0 = cols[i].side === 2 ? 0.5 : cols[i].joint >= 0 ? 0.74 : 1, dk1 = cols[j].side === 2 ? 0.5 : cols[j].joint >= 0 ? 0.74 : 1;     // (a joint is a dark line)
    for (let k = 0; k <= kk; k++) {
      const yb0 = YB[k][i], yt0 = YT[k][i], yb1 = YB[k][j], yt1 = YT[k][j];
      if (Math.max(yt0 - yb0, yt1 - yb1) < 0.02 || (yt0 < foot[i] + 0.02 && yt1 < foot[j] + 0.02)) continue;
      const z0 = F[k][i], z1 = F[k][j], zn0 = k < kk ? F[k + 1][i] : BACK_Z, zn1 = k < kk ? F[k + 1][j] : BACK_Z;
      const c0 = worn(k, i, zn0), c1 = worn(k, j, zn1), t = beds[k].tint;
      E.wet = Math.abs(xm) < S.wetTo[xm < 0 ? 0 : 1][k] ? 1 : 0;
      // (beside the fall a joint shows in the beds its form names: there it is a line in shadow)
      const nj = cols[i].nj >= 0 && cols[i].nj === cols[j].nj && S.nlive[k][cols[i].nj], q0 = nj ? 0.5 : dk0, q1 = nj ? 0.5 : dk1;
      // the shade: darker at the foot of a face that stands on a ledge or on the ground, and in a cleft's heart
      const u0 = k === 0 || yb0 < foot[i] + 0.05 || F[k - 1][i] - z0 > 0.25, u1 = k === 0 || yb1 < foot[j] + 0.05 || F[k - 1][j] - z1 > 0.25;
      const lo0 = t * q0 * (u0 ? 0.7 : 0.88), lo1 = t * q1 * (u1 ? 0.7 : 0.88), hi0 = t * q0 * 1.02, hi1 = t * q1 * 1.02;
      const a = [x0, yb0, z0], b = [x1, yb1, z1], c = [x1, yt1 - c1, z1], d = [x0, yt0 - c0, z0], e = [x1, yt1, z1 - 1.2 * c1], f = [x0, yt0, z0 - 1.2 * c0];
      E.quad(a, b, c, d, lo0, lo1, hi1, hi0);
      if (c0 + c1 > 0.01) { const nf = E.normal(a, b, d); E.quad(d, c, e, f, hi0, hi1, hi1 * 1.04, hi0 * 1.04, 1, 1, 1, 1, nf, nf, UP, UP); }
      if (k < kk) {
        const d0 = f[2] - zn0, d1 = e[2] - zn1, dm = (d0 + d1) / 2;
        if (Math.max(d0, d1) <= 0.03) continue;
        E.quad(f, e, [x1, yt1, zn1], [x0, yt0, zn0], hi0 * 1.04, hi1 * 1.04, t * 0.8, t * 0.8, 1, 1, !clean && d1 > 0.5 ? 0.3 : 1, !clean && d0 > 0.5 ? 0.3 : 1);
        if (dm > 0.45 && yt0 > foot[i] + 0.3) spots.push({ x: xm, y: (yt0 + yt1) / 2, z: (zn0 + zn1) / 2 + 0.35 * dm, w: dm, kind: 0 });
      } else {
        // the scar's top: from the rim back to the meadow, stone at the edge and turf behind
        E.quad(f, e, [x1, top[j], BACK_Z], [x0, top[i], BACK_Z], hi0, hi1, 1, 1, 1, 1, 0, 0);
        spots.push({ x: xm, y: (yt0 + yt1) / 2, z: (f[2] + e[2]) / 2 - 0.4, w: 1, kind: 1 });
        const zf = (f[2] + e[2]) / 2, yr = (yt0 + yt1) / 2, yb = (top[i] + top[j]) / 2;
        if (zf - BACK_Z > 1.2) for (const q of [0.3, 0.62, 0.9]) spots.push({ x: xm, y: yr + (yb - yr) * q, z: zf + (BACK_Z - zf) * q, w: 1, kind: 3 });
      }
    }
    if (cols[i].side === 2) for (let y = foot[i] + 1.2; y < rim[i] - 0.6; y += 1.7) { let k = 0; while (k < K - 1 && YT[k][i] < y) k++; spots.push({ x: x0, y, z: F[k][i] + 0.1, w: 0.4, kind: 2 }); }
    if (i % 40 === 39) await ctx.yield();
  }
  // the two sides of the notch at its narrowest: each bed's flank, from its face back to the rock behind the fall
  // (THE ROCK IN THE NOTCH GOES DOWN TO THE UPPER RIVER'S BED, 1.5 m under the bank's level (the plan's groundHeight
  // in the river), across the whole notch and from the wall behind the fall back to the scar's back edge: the liquid
  // lies FREEBOARD under the bank's level and sags toward the lip's middle, and the rock stays under it everywhere.
  // Under the pool the rock goes down past the lower bed.)
  const lip = P.riverY(P.FALL_Z - 0.01) - 1.5, yPool = P.riverY(P.FALL_Z) - 2.2, M = 10;
  E.wet = 1;
  for (const i of [gap - 1, gap]) {
    const x = cols[i].x, s = Math.sign(x);
    for (let k = 0; k <= kf[i]; k++) {
      const yb = YB[k][i], yt = YT[k][i], z = F[k][i], t = beds[k].tint * 0.8;
      if (yt - yb < 0.02 || z < WALL_Z + 0.02) continue;
      E.facing([-s, 0, 0], [[x, yb, z], [x, yb, WALL_Z], [x, yt, WALL_Z], [x, yt, z]], [t * 0.85, t * 0.7, t * 0.8, t]);
    }
    // ... and the low bank of the channel above the lip
    E.facing([-s, 0, 0], [[x, lip, WALL_Z], [x, lip, BACK_Z], [x, top[i], BACK_Z], [x, rim[i], WALL_Z]], [0.7, 0.7, 0.85, 0.85]);
  }
  // behind the fall: the rock unbroken from the lip to under the pool, and the lip the river runs out over
  for (let m = 0; m < M; m++) {
    const a = -NOTCH + 2 * NOTCH * m / M, b = -NOTCH + 2 * NOTCH * (m + 1) / M;
    E.quad([a, yPool, WALL_Z], [b, yPool, WALL_Z], [b, lip, WALL_Z], [a, lip, WALL_Z], 0.7, 0.7, 0.85, 0.85);
    E.quad([a, lip, WALL_Z], [b, lip, WALL_Z], [b, lip, BACK_Z], [a, lip, BACK_Z], 0.85, 0.85, 0.85, 0.85);
  }
  await ctx.yield();
  E.wet = 0;
  const rubble = scarRubble(E, S, rubbleRng);
  // clear air: the nearest any of the rock comes to the flown line
  let minClear = 1e9;
  await ctx.yield();
  for (let v = 0, n = 0; v < E.pos.length; v += 3) {
    if (Math.abs(E.pos[v] - 4) > 16) continue;
    minClear = Math.min(minClear, P.routeDistance(E.pos[v], E.pos[v + 1], E.pos[v + 2]));
    if (++n % 600 === 0) await ctx.yield();
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(E.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(E.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(E.col, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(E.gg, 2));
  g.computeBoundingSphere();
  g.userData = { triangles: E.pos.length / 9, spots, dip: S.dip, minClear, beds: K, columns: N, rubble, footZ: FOOT_Z };
  return g;
}
