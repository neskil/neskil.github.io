// The Colossus of Rhodes: the bronze Helios (32.5 m from sole to crown) on its white marble base, as one object.
// ORIGIN: the centre of the base's footprint on the court floor. +X is the statue's front, +Y up, metres, no scale.
// How it is made: the figure is ONE signed distance field of rounded primitives (round cones, ellipsoids, rounded
// boxes) joined by smooth unions; surface nets written here turn it into triangles, the body in cells of 0.2 m and
// the shoulders, belly, head, face, the face's features, hands and feet in finer grids of their own, nested, that overlap
// the coarser one round them and read the same field. Normals are the field's gradient. The rays are separate thin blades rooted inside the curls. Nothing here moves or gives light.
// The body's masses and its outline are in the field. The lines that bound the masses (the FURROWS table) are cut into
// the field as soft grooves where the triangles can carry them, and their sharp bottoms are drawn by the bronze's shader
// from the same lines found again on the finished skin (a lean of the normal and a deeper tone, thinned by the picture's
// own grain), so that a crease costs no triangles.
// Interface: design/sw/notes/colossus-interface.md. Measures: design/sw/briefs/colossus-of-rhodes.json, "hero".
// THE POSE'S ONE NUMBER THAT CHANGED against the version that was live before (VERSION 30): the back of each hand is turned
// 28 degrees from the thigh's side toward its front (HAND_TURN 0.49); with it the wrist stands 1.0 m further forward and the
// forearm leans 16 degrees off the upright. This form is OURS, BY NEED: hands that lie edge on to every view cannot be read
// as hands. Trunk, head, face, rays, base and measures are as they were. The part writes no caption and no text of any
// kind: nothing shown to a visitor speaks of his hands.
// (What round r7 adds to the TOWN round him, ours and invented, is named at the world file's head: shop mouths, cloth, a wall
// fountain, the quay's lots, a rack of jars, baulks of timber, two hand carts, two mooring posts. None is of this part.)
// BROUGHT IN: the distances to a round cone between two points, to an ellipsoid (k0 (k0 - 1) / k1) and to a box with
// rounded edges, as Inigo Quilez publishes them (iquilezles.org, article distfunctions); MIT as the site's notices
// file gives this author's articles; the licence of this article was not verified by this crew. At F.rc and dist.
// BROUGHT IN: mbHash and coHash, a variant on the constants of Hash without Sine (David Hoskins, 2014, MIT): the
// opening of its hash33 with the return of its hash13. At marbleMaterial and bronzeMaterial.
// (The two lines were set at round r9's freeze, in comments only, under the owner's section 181: the passages stand
// in r7t to the letter. ROUNDS r8 AND r9: round r8's step H changed two places of this part and moved no pixel: the
// mesh 'shade' is no longer sent to the picture's pass, and info.looks hands out his middle and the line of his jaw.
// Round r9 changes nothing of this part but comments; the rack of jars named above is a stand of two floors since
// round r9. The rounds are told at the world file's head.)
import * as THREE from 'three';

// ---- the fixed measures of the design (metres; y is above the court floor) ----
const BASE_X = 15.0, BASE_Z = 17.0;
const STEP_H = 0.4, STEP_TREAD = 0.8, STEPS = 3, BLOCK_H = 2.8;
const SOLE = STEPS * STEP_H + BLOCK_H;
const FIGURE = 32.5;
const CROWN = SOLE + FIGURE;
const RAY_TOP = 38.0;
const HEAD = 4.0;
const CHIN = FIGURE - HEAD;
const FOOT = 4.7;
const KNEE = 9.0;
const SHOULDERS = 9.0;
const RAYS = 12, RAY_MIN = 1.3, RAY_MAX = 1.9;

// ---- the field: a store of primitives and the function that reads the distance at a point ----
const BIG = 1e3;
function smin(a, b, k) {
  if (k <= 0) return a < b ? a : b;
  let h = a - b; if (h < 0) h = -h;
  h = k - h; if (h <= 0) return a < b ? a : b;
  return (a < b ? a : b) - h * h / (4 * k);
}

function makeField() {
  const MAX = 1400;
  const T = new Uint8Array(MAX), OP = new Uint8Array(MAX), G = new Uint8Array(MAX);
  const K = new Float64Array(MAX), D = new Float64Array(MAX * 16), BB = new Float64Array(MAX * 6);
  // a ball round each plain round cone (middle and radius): a point farther from the ball than the cone could
  // reach to change the field need not ask the cone itself. Every other primitive has none (radius without end).
  const SP = new Float64Array(MAX * 4).fill(Infinity);
  let n = 0, nGroup = -1;
  const F = { T, OP, G, K, D, BB, SP, count: () => n };

  function slot(type, g, k, op) {
    if (op === 0 && nGroup >= 0) throw new Error('colossus: a group primitive after a late one');
    if (op === 3 && n > 0 && OP[n - 1] !== 0 && OP[n - 1] !== 3) throw new Error('colossus: a cut of the legs alone after another late primitive');
    if (op !== 0 && nGroup < 0) nGroup = n;
    if (n >= MAX) throw new Error('colossus: too many primitives');
    T[n] = type; G[n] = g; K[n] = k; OP[n] = op;
    return n++;
  }
  function box(i, x0, y0, z0, x1, y1, z1, pad) {
    const o = i * 6;
    BB[o] = x0 - pad; BB[o + 1] = y0 - pad; BB[o + 2] = z0 - pad; BB[o + 3] = x1 + pad; BB[o + 4] = y1 + pad; BB[o + 5] = z1 + pad;
  }
  // a round cone from a to b (points as [x, height above the soles, z]) with radii ra and rb; sx and sz squash its
  // section along x and z about a (1 = round). op: 0 joins its group, 1 is laid on afterwards, 2 is cut away, 3 is cut
  // away from the trunk and the legs alone, before the arms are joined (every such one before any other late one).
  // (BROUGHT IN, see the head: l2, rr, l2 - rr * rr and 1 / l2 are kept here once for the round cone's distance in
  // dist)
  F.rc = (g, k, a, b, ra, rb, sx = 1, sz = 1, op = 0) => {
    const i = slot(0, g, k, op), o = i * 16;
    const ax = a[0], ay = a[1] + SOLE, az = a[2], bx = (b[0] - a[0]) / sx, by = b[1] - a[1], bz = (b[2] - a[2]) / sz;
    const l2 = Math.max(1e-9, bx * bx + by * by + bz * bz), rr = ra - rb;
    D[o] = ax; D[o + 1] = ay; D[o + 2] = az; D[o + 3] = bx; D[o + 4] = by; D[o + 5] = bz;
    D[o + 6] = ra; D[o + 7] = rb; D[o + 8] = 1 / sx; D[o + 9] = 1 / sz; D[o + 10] = l2; D[o + 11] = rr;
    D[o + 12] = l2 - rr * rr; D[o + 13] = 1 / l2; D[o + 14] = Math.min(1, sx, sz);
    const ex = Math.max(sx, 1), ez = Math.max(sz, 1), cx = b[0], cy = b[1] + SOLE, cz = b[2];
    if (sx === 1 && sz === 1) { const s = i * 4; SP[s] = (ax + cx) / 2; SP[s + 1] = (ay + cy) / 2; SP[s + 2] = (az + cz) / 2; SP[s + 3] = Math.sqrt(l2) / 2 + Math.max(ra, rb); }
    box(i, Math.min(ax - ra * ex, cx - rb * ex), Math.min(ay - ra, cy - rb), Math.min(az - ra * ez, cz - rb * ez),
      Math.max(ax + ra * ex, cx + rb * ex), Math.max(ay + ra, cy + rb), Math.max(az + ra * ez, cz + rb * ez), k + 0.02);
    return i;
  };
  const E = new THREE.Euler(), M = new THREE.Matrix4();
  function frame(i, c, rot) {
    const o = i * 16, m = M.elements;
    if (rot) { E.set(rot[0], rot[1], rot[2], 'YXZ'); M.makeRotationFromEuler(E); } else M.identity();
    D[o] = c[0]; D[o + 1] = c[1] + SOLE; D[o + 2] = c[2];
    // rows of the inverse rotation: the local axes written in the part's axes
    D[o + 3] = m[0]; D[o + 4] = m[1]; D[o + 5] = m[2]; D[o + 6] = m[4]; D[o + 7] = m[5]; D[o + 8] = m[6]; D[o + 9] = m[8]; D[o + 10] = m[9]; D[o + 11] = m[10];
    return o;
  }
  function frameBox(i, hx, hy, hz, pad) {
    const o = i * 16;
    const ex = Math.abs(D[o + 3]) * hx + Math.abs(D[o + 6]) * hy + Math.abs(D[o + 9]) * hz;
    const ey = Math.abs(D[o + 4]) * hx + Math.abs(D[o + 7]) * hy + Math.abs(D[o + 10]) * hz;
    const ez = Math.abs(D[o + 5]) * hx + Math.abs(D[o + 8]) * hy + Math.abs(D[o + 11]) * hz;
    box(i, D[o] - ex, D[o + 1] - ey, D[o + 2] - ez, D[o] + ex, D[o + 1] + ey, D[o + 2] + ez, pad);
  }
  // an ellipsoid at c with radii r, turned by rot (Euler angles about x, y, z, applied in the order Y, X, Z)
  F.el = (g, k, c, r, rot = null, op = 0) => {
    const i = slot(1, g, k, op), o = frame(i, c, rot);
    D[o + 12] = 1 / r[0]; D[o + 13] = 1 / r[1]; D[o + 14] = 1 / r[2]; D[o + 15] = Math.min(r[0], r[1], r[2]);
    frameBox(i, r[0], r[1], r[2], k + 0.02);
    return i;
  };
  // a box at c with half sizes h, its edges rounded by rd, turned by rot
  F.bx = (g, k, c, h, rd, rot = null, op = 0) => {
    const i = slot(2, g, k, op), o = frame(i, c, rot);
    D[o + 12] = h[0] - rd; D[o + 13] = h[1] - rd; D[o + 14] = h[2] - rd; D[o + 15] = rd;
    frameBox(i, h[0], h[1], h[2], k + 0.02);
    return i;
  };
  // a shell: the part of the ellipsoid (centre ec, radii er) that lies in front of the plane x = x0, on the side sd of
  // the plane z = sd * z0, and inside the circle (centre at height cy and at cz, radius cr) drawn in the y-z plane;
  // kb rounds the corner between that plane and the circle, ks is the width of the edge between the ellipsoid and
  // its bounds. Not turned.
  F.sh = (g, k, x0, sd, z0, cy, cz, cr, kb, ec, er, ks, op = 0) => {
    const i = slot(3, g, k, op), o = i * 16;
    D[o] = x0; D[o + 1] = sd; D[o + 2] = z0; D[o + 3] = cy + SOLE; D[o + 4] = cz; D[o + 5] = cr; D[o + 6] = kb;
    D[o + 7] = ec[0]; D[o + 8] = ec[1] + SOLE; D[o + 9] = ec[2]; D[o + 10] = 1 / er[0]; D[o + 11] = 1 / er[1]; D[o + 12] = 1 / er[2];
    D[o + 13] = Math.min(er[0], er[1], er[2]); D[o + 14] = ks;
    const za = sd * z0, zb = ec[2] + sd * er[2];
    box(i, x0, Math.max(cy - cr, ec[1] - er[1]) + SOLE, Math.min(za, zb), ec[0] + er[0], ec[1] + er[1] + SOLE, Math.max(za, zb), k + 0.02);
    return i;
  };
  F.nGroup = () => (nGroup < 0 ? n : nGroup);
  return F;
}

// how wide each join is (metres): the two legs to each other, the legs to the trunk, the head and the hair
const K_LEGS = 0.10, K_HIP = 0.55, K_NECK = 0.30, K_HAIR = 0.10;
// groups: 0 trunk, 1 and 2 the legs, 3 and 4 the arms, 5 the head, 6 the hair
const G_TRUNK = 0, G_LEG = 1, G_ARM = 3, G_HEAD = 5, G_HAIR = 6;

// the readers of a field: dist(i, x, y, z) of one primitive, and at(x, y, z, list, off, cnt) of the whole figure
function makeReader(F) {
  const { T, OP, G, K, D, SP } = F, nGroup = F.nGroup();
  function dist(i, x, y, z) {
    const o = i * 16;
    if (T[i] === 0) {
      // (BROUGHT IN, see the head: the exact distance to a round cone between two points; the squash along x and z
      // and the last factor are this part's own)
      const px = (x - D[o]) * D[o + 8], py = y - D[o + 1], pz = (z - D[o + 2]) * D[o + 9];
      const bx = D[o + 3], by = D[o + 4], bz = D[o + 5], l2 = D[o + 10], rr = D[o + 11], a2 = D[o + 12], il2 = D[o + 13];
      const yy = px * bx + py * by + pz * bz, zz = yy - l2;
      const qx = px * l2 - bx * yy, qy = py * l2 - by * yy, qz = pz * l2 - bz * yy;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2;
      const k = (rr < 0 ? -1 : 1) * rr * rr * x2;
      let d;
      if ((zz < 0 ? -1 : 1) * a2 * z2 > k) d = Math.sqrt(x2 + z2) * il2 - D[o + 7];
      else if ((yy < 0 ? -1 : 1) * a2 * y2 < k) d = Math.sqrt(x2 + y2) * il2 - D[o + 6];
      else d = (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - D[o + 6];
      return d * D[o + 14];
    }
    if (T[i] === 3) {
      const yy = y - D[o + 3], zz = z - D[o + 4];
      const dc = -smin(D[o + 1] * z - D[o + 2], D[o + 5] - Math.sqrt(yy * yy + zz * zz), D[o + 6]);
      const db = -smin(x - D[o], -dc, 0.5);
      const ax = (x - D[o + 7]) * D[o + 10], ay = (y - D[o + 8]) * D[o + 11], az = (z - D[o + 9]) * D[o + 12];
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      const bx = ax * D[o + 10], by = ay * D[o + 11], bz = az * D[o + 12], k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      const de = k1 < 1e-9 ? -D[o + 13] : k0 * (k0 - 1) / k1;
      return -smin(-de, -db, D[o + 14]);
    }
    const dx = x - D[o], dy = y - D[o + 1], dz = z - D[o + 2];
    const qx = dx * D[o + 3] + dy * D[o + 4] + dz * D[o + 5], qy = dx * D[o + 6] + dy * D[o + 7] + dz * D[o + 8], qz = dx * D[o + 9] + dy * D[o + 10] + dz * D[o + 11];
    // (BROUGHT IN, see the head: the ellipsoid's distance k0 (k0 - 1) / k1, here and in the shell above, kind 3; the
    // guard for k1 near nought is this part's own)
    if (T[i] === 1) {
      const ax = qx * D[o + 12], ay = qy * D[o + 13], az = qz * D[o + 14];
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      const bx = ax * D[o + 12], by = ay * D[o + 13], bz = az * D[o + 14];
      const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      return k1 < 1e-9 ? -D[o + 15] : k0 * (k0 - 1) / k1;
    }
    // (BROUGHT IN, see the head: the distance to a box with rounded edges)
    const ex = Math.abs(qx) - D[o + 12], ey = Math.abs(qy) - D[o + 13], ez = Math.abs(qz) - D[o + 14];
    const mx = ex > 0 ? ex : 0, my = ey > 0 ? ey : 0, mz = ez > 0 ? ez : 0;
    const inner = Math.max(ex, ey, ez);
    return Math.sqrt(mx * mx + my * my + mz * mz) + (inner < 0 ? inner : 0) - D[o + 15];
  }
  const gd = new Float64Array(8);
  function at(x, y, z, list, off, cnt) {
    gd[0] = gd[1] = gd[2] = gd[3] = gd[4] = gd[5] = gd[6] = BIG;
    let q = 0;
    for (; q < cnt; q++) {
      const i = list[off + q];
      if (i >= nGroup) break;
      const g = G[i], s = i * 4, t = gd[g] + K[i] + SP[s + 3];
      if (t < 500) { const dx = x - SP[s], dy = y - SP[s + 1], dz = z - SP[s + 2]; if (t <= 0 || dx * dx + dy * dy + dz * dz >= t * t) continue; }
      gd[g] = smin(gd[g], dist(i, x, y, z), K[i]);
    }
    let d = smin(gd[0], smin(gd[1], gd[2], K_LEGS), K_HIP);
    // the valleys that are the legs' own (op 3; they stand first among the late primitives) are cut before the arms are
    // joined, so that a hand lying on a thigh keeps its fingers whole over a valley that runs under it
    for (; q < cnt; q++) {
      const i = list[off + q];
      if (OP[i] !== 3) break;
      const s = i * 4, t = K[i] + SP[s + 3] - d;
      if (t < 500) { const dx = x - SP[s], dy = y - SP[s + 1], dz = z - SP[s + 2]; if (t <= 0 || dx * dx + dy * dy + dz * dz >= t * t) continue; }
      d = -smin(-d, dist(i, x, y, z), K[i]);
    }
    // the arms join the trunk broadly at the shoulder and hardly at all below the armpit, so that they stay arms
    let t = (y - SOLE - 22.1) / 1.5; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ka = 0.09 + 0.4 * t * t * (3 - 2 * t);
    d = smin(d, gd[3], ka); d = smin(d, gd[4], ka);
    d = smin(d, gd[5], K_NECK); d = smin(d, gd[6], K_HAIR);
    for (; q < cnt; q++) {
      const i = list[off + q], s = i * 4, t = (OP[i] === 1 ? d : -d) + K[i] + SP[s + 3];
      if (t < 500) { const dx = x - SP[s], dy = y - SP[s + 1], dz = z - SP[s + 2]; if (t <= 0 || dx * dx + dy * dy + dz * dz >= t * t) continue; }
      const dp = dist(i, x, y, z);
      d = OP[i] === 1 ? smin(d, dp, K[i]) : -smin(-d, dp, K[i]);
    }
    return d;
  }
  return { dist, at, gd };
}

// for a lattice of blocks (bs metres on a side, from x0, y0, z0), the primitives that can matter in each block:
// those whose own box reaches the block and whose surface lies within the block's half diagonal plus the width of
// their join of the block's middle (R.dist never says more than the true distance; an ellipsoid is bounded by hand)
function listPairs(S, F, R, from, to) {
  const BB = F.BB, D = F.D, T = F.T, K = F.K, G = F.G, OP = F.OP, less = S.less, x0 = S.x0, y0 = S.y0, z0 = S.z0, bs = S.bs, nbx = S.nbx, nby = S.nby, nbz = S.nbz, pad = S.pad, off = S.off;
  const X1 = x0 + nbx * bs, Y1 = y0 + nby * bs, Z1 = z0 + nbz * bs, rb = bs * 0.866 + pad + 0.02;
  let pairs = S.pairs, np = S.np;
  for (let i = from; i < to; i++) {
    const o = i * 6, o16 = i * 16;
    if (G[i] === less && OP[i] === 0) continue;
    if (!(BB[o] - pad < X1 && BB[o + 3] + pad > x0 && BB[o + 1] - pad < Y1 && BB[o + 4] + pad > y0 && BB[o + 2] - pad < Z1 && BB[o + 5] + pad > z0)) continue;
    const i0 = Math.max(0, Math.floor((BB[o] - pad - x0) / bs)), i1 = Math.min(nbx - 1, Math.floor((BB[o + 3] + pad - x0) / bs));
    const j0 = Math.max(0, Math.floor((BB[o + 1] - pad - y0) / bs)), j1 = Math.min(nby - 1, Math.floor((BB[o + 4] + pad - y0) / bs));
    const k0 = Math.max(0, Math.floor((BB[o + 2] - pad - z0) / bs)), k1 = Math.min(nbz - 1, Math.floor((BB[o + 5] + pad - z0) / bs));
    const lim = rb + K[i], el = T[i] === 1;
    // an ellipsoid: the smallest of its radii, to turn its own measure into a true lower bound of the distance
    const rmin = el ? 1 / Math.max(D[o16 + 12], D[o16 + 13], D[o16 + 14]) : 0;
    const need = np + 2 * (i1 - i0 + 1) * (j1 - j0 + 1) * (k1 - k0 + 1);
    if (need > pairs.length) { const a = new Int32Array(Math.max(pairs.length * 2, need)); a.set(pairs); pairs = a; }
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
      const cx = x0 + (ii + 0.5) * bs, cy = y0 + (j + 0.5) * bs, cz = z0 + (k + 0.5) * bs;
      if (el) {
        const dx = cx - D[o16], dy = cy - D[o16 + 1], dz = cz - D[o16 + 2];
        const ax = (dx * D[o16 + 3] + dy * D[o16 + 4] + dz * D[o16 + 5]) * D[o16 + 12], ay = (dx * D[o16 + 6] + dy * D[o16 + 7] + dz * D[o16 + 8]) * D[o16 + 13], az = (dx * D[o16 + 9] + dy * D[o16 + 10] + dz * D[o16 + 11]) * D[o16 + 14];
        if ((Math.sqrt(ax * ax + ay * ay + az * az) - 1) * rmin > lim) continue;
      } else if (T[i] !== 3 && R.dist(i, cx, cy, cz) > lim) continue;
      const b = ii + nbx * (j + nby * k);
      pairs[np++] = b; pairs[np++] = i; off[b + 1]++;
    }
  }
  S.pairs = pairs; S.np = np;
}
function listsDone(S) {
  const nb = S.nbx * S.nby * S.nbz, off = S.off, pairs = S.pairs, np = S.np;
  for (let b = 0; b < nb; b++) off[b + 1] += off[b];
  // filled in the order the pairs were found, so each list stays in the primitives' own order
  const list = new Int16Array(np >> 1), fill = new Int32Array(nb);
  for (let q = 0; q < np; q += 2) { const b = pairs[q]; list[off[b] + fill[b]++] = pairs[q + 1]; }
  S.list = list; S.pairs = null;
  return S;
}
// (less: a group to leave out of the lists, or -1)
async function makeLists(F, R, x0, y0, z0, bs, nbx, nby, nbz, pad, ctx, less = -1) {
  const S = { x0, y0, z0, bs, nbx, nby, nbz, pad, less, off: new Int32Array(nbx * nby * nbz + 1), pairs: new Int32Array(1 << 15), np: 0, list: null };
  const n = F.count(), step = pad > 0.3 ? 12 : 60;
  for (let i = 0; i < n; i += step) { listPairs(S, F, R, i, Math.min(n, i + step)); await ctx.yield(); }
  return listsDone(S);
}

// ---- surface nets: one grid of the field into triangles ----
// g: { x0, y0, z0, c (cell), nx, ny, nz, B (cells per block), skip: boxes whose inside this grid leaves to a finer
// one, sink: boxes in which this grid's skin is drawn 3 cm in, exact: normals from the field itself }
// out: the buffers every grid appends to. wide: the lists used for the wide hollows.
// Every loop that runs long is in a plain function of its own (not in the async one that yields between them): a
// browser brings such loops up to speed while they run, which it does not do inside a function that awaits.
const EDGE_A = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3], EDGE_B = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7], REACH = 0.75;
function makeOut(nv, nt) {
  return { pos: new Float32Array(nv * 3), nor: new Float32Array(nv * 3), occ: new Float32Array(nv * 2), idx: new Uint32Array(nt * 3), nv: 0, ni: 0, capV: nv, capI: nt * 3, stats: [] };
}
function growOut(out, moreV, moreI) {
  if (out.nv + moreV > out.capV) {
    const n = Math.max(out.capV * 2, out.nv + moreV);
    let a = new Float32Array(n * 3); a.set(out.pos); out.pos = a;
    a = new Float32Array(n * 3); a.set(out.nor); out.nor = a;
    a = new Float32Array(n * 2); a.set(out.occ); out.occ = a;
    out.capV = n;
  }
  if (out.ni + moreI > out.capI) { const n = Math.max(out.capI * 2, out.ni + moreI), a = new Uint32Array(n); a.set(out.idx); out.idx = a; out.capI = n; }
}
// boxes as one flat list of numbers (six a box)
const flat = (boxes) => { const a = new Float64Array(boxes.length * 6); boxes.forEach((b, i) => a.set(b, i * 6)); return a; };
function inBoxes(a, x, y, z, m) {
  for (let o = 0; o < a.length; o += 6) if (x > a[o] + m && x < a[o + 3] - m && y > a[o + 1] + m && y < a[o + 4] - m && z > a[o + 2] + m && z < a[o + 5] - m) return true;
  return false;
}
// how deep a point lies inside the boxes (its distance to the nearest face of the box it is in; 0 or less outside)
function depthIn(a, x, y, z) {
  let best = 0;
  for (let o = 0; o < a.length; o += 6) {
    const d = Math.min(x - a[o], a[o + 3] - x, y - a[o + 1], a[o + 4] - y, z - a[o + 2], a[o + 5] - z);
    if (d > best) best = d;
  }
  return best;
}

function makeMesher(R, g, out, W, L) {
  const x0 = g.x0, y0 = g.y0, z0 = g.z0, c = g.c, nx = g.nx, ny = g.ny, nz = g.nz, B = g.B, exact = g.exact;
  const skip = flat(g.skip), sink = flat(g.sink), hol = g.hol, probe = g.probe, holAt = g.holAt || null;
  // seam: within this far of a finer grid's box, or of this grid's own faces, the normal is read from the field
  // itself, so that two skins of different fineness shade alike where they meet; sink0: how far in at the face
  const seam = g.seam || 0, fix = g.fix === true, FIX2 = 0.64, sink0 = g.sink0 || 0.004, xe = x0 + nx * c, ye = y0 + ny * c, ze = z0 + nz * c;
  const nbx = L.nbx, nby = L.nby, nbz = L.nbz, nb = nbx * nby * nbz, list = L.list, loff = L.off;
  const sx = nx + 1, sxy = sx * (ny + 1), nxy = nx * ny;
  const V = new Float32Array(sxy * (nz + 1)).fill(NaN), CV = new Int32Array(nxy * nz).fill(-1), seen = new Uint8Array(nb);
  const rad = B * c * 0.866 * 1.3 + c, h = c * 0.3, v = new Float64Array(8), base = out.nv;
  let cells = new Int32Array(4096), stack = new Int32Array(4096), sp = 0, work = 0, count = 0, sb = 0;
  // the field read through the wide lists, anywhere near the figure
  function wideAt(x, y, z) {
    const bi = Math.floor((x - W.x0) / W.bs), bj = Math.floor((y - W.y0) / W.bs), bk = Math.floor((z - W.z0) / W.bs);
    if (bi < 0 || bj < 0 || bk < 0 || bi >= W.nbx || bj >= W.nby || bk >= W.nbz) return BIG;
    const b = bi + W.nbx * (bj + W.nby * bk), o = W.off[b], n = W.off[b + 1] - o;
    return n ? R.at(x, y, z, W.list, o, n) : BIG;
  }
  // a corner's value, read once (through the list of the block it lies in) and kept
  function corner(q, i, j, k) {
    const bi = Math.min(nbx - 1, (i / B) | 0), bj = Math.min(nby - 1, (j / B) | 0), bk = Math.min(nbz - 1, (k / B) | 0);
    const b = bi + nbx * (bj + nby * bk), off = loff[b], cnt = loff[b + 1] - off;
    work += cnt + 2;
    return (V[q] = cnt ? R.at(x0 + i * c, y0 + j * c, z0 + k * c, list, off, cnt) : BIG);
  }
  function val(i, j, k) { const q = i + sx * j + sxy * k, w = V[q]; return w === w ? w : corner(q, i, j, k); }
  function push(i, j, k) {
    if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) return;
    const ci = i + nx * j + nxy * k;
    if (CV[ci] !== -1) return;
    if (sp === stack.length) { const a = new Int32Array(sp * 2); a.set(stack); stack = a; }
    stack[sp++] = ci;
  }
  // one cell of the surface: its vertex, and its neighbours through every face the surface crosses
  function cell(ci) {
    if (CV[ci] !== -1) return;
    const i = ci % nx, j = ((ci / nx) | 0) % ny, k = (ci / nxy) | 0;
    CV[ci] = -2;
    if (skip.length && inBoxes(skip, x0 + (i + 0.5) * c, y0 + (j + 0.5) * c, z0 + (k + 0.5) * c, 0)) return;
    const q = i + sx * j + sxy * k;
    let w;
    w = V[q]; v[0] = w === w ? w : corner(q, i, j, k);
    w = V[q + 1]; v[1] = w === w ? w : corner(q + 1, i + 1, j, k);
    w = V[q + sx]; v[2] = w === w ? w : corner(q + sx, i, j + 1, k);
    w = V[q + sx + 1]; v[3] = w === w ? w : corner(q + sx + 1, i + 1, j + 1, k);
    w = V[q + sxy]; v[4] = w === w ? w : corner(q + sxy, i, j, k + 1);
    w = V[q + sxy + 1]; v[5] = w === w ? w : corner(q + sxy + 1, i + 1, j, k + 1);
    w = V[q + sxy + sx]; v[6] = w === w ? w : corner(q + sxy + sx, i, j + 1, k + 1);
    w = V[q + sxy + sx + 1]; v[7] = w === w ? w : corner(q + sxy + sx + 1, i + 1, j + 1, k + 1);
    let mask = 0;
    for (let e = 0; e < 8; e++) if (v[e] < 0) mask |= 1 << e;
    if (mask === 0 || mask === 255) return;
    let fx = 0, fy = 0, fz = 0, m = 0;
    for (let e = 0; e < 12; e++) {
      const a = EDGE_A[e], bb = EDGE_B[e], va = v[a], vb = v[bb];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      fx += (a & 1) + ((bb & 1) - (a & 1)) * t; fy += ((a >> 1) & 1) + (((bb >> 1) & 1) - ((a >> 1) & 1)) * t; fz += ((a >> 2) & 1) + (((bb >> 2) & 1) - ((a >> 2) & 1)) * t;
      m++;
    }
    fx /= m; fy /= m; fz /= m;
    let px = x0 + (i + fx) * c, py = y0 + (j + fy) * c, pz = z0 + (k + fz) * c;
    const bi = (i / B) | 0, bj = (j / B) | 0, bk = (k / B) | 0, b = bi + nbx * (bj + nby * bk), off = loff[b], cnt = loff[b + 1] - off;
    seen[b] = 1;
    // the field and its gradient at the vertex: from the cell's own corners, or (exact grids) from the field itself
    let f, gx, gy, gz, kept = false;
    if (exact || (seam > 0 && (px - x0 < seam || xe - px < seam || py - y0 < seam || ye - py < seam || pz - z0 < seam || ze - pz < seam || (sink.length && inBoxes(sink, px, py, pz, -seam))))) {
      f = R.at(px, py, pz, list, off, cnt);
      const gd = R.gd, h0 = gd[0], h5 = gd[5], h6 = gd[6];
      gx = (R.at(px + h, py, pz, list, off, cnt) - f) / h; gy = (R.at(px, py + h, pz, list, off, cnt) - f) / h; gz = (R.at(px, py, pz + h, list, off, cnt) - f) / h;
      gd[0] = h0; gd[5] = h5; gd[6] = h6; kept = true;
      work += cnt * 4;
    } else {
      const a0 = v[0] + (v[1] - v[0]) * fx, a1 = v[2] + (v[3] - v[2]) * fx, a2 = v[4] + (v[5] - v[4]) * fx, a3 = v[6] + (v[7] - v[6]) * fx;
      f = (a0 + (a1 - a0) * fy) * (1 - fz) + (a2 + (a3 - a2) * fy) * fz;
      gx = (((v[1] - v[0]) * (1 - fy) + (v[3] - v[2]) * fy) * (1 - fz) + ((v[5] - v[4]) * (1 - fy) + (v[7] - v[6]) * fy) * fz) / c;
      gy = ((a1 - a0) * (1 - fz) + (a3 - a2) * fz) / c;
      gz = ((a2 + (a3 - a2) * fy) - (a0 + (a1 - a0) * fy)) / c;
    }
    let g2 = gx * gx + gy * gy + gz * gz;
    // where the corners' own slope is far from a true field's (two skins in one cell, a narrow groove, a crease
    // between two forms), the corners cannot tell the place: after the first step the field itself is asked
    if (fix && !exact && g2 < FIX2) {
      if (g2 > 1e-12) { let s = f / g2; const lim = c / Math.sqrt(g2); const nl = 0 - lim; s = s > lim ? lim : s < nl ? nl : s; px -= gx * s; py -= gy * s; pz -= gz * s; }
      f = R.at(px, py, pz, list, off, cnt);
      gx = (R.at(px + h, py, pz, list, off, cnt) - f) / h; gy = (R.at(px, py + h, pz, list, off, cnt) - f) / h; gz = (R.at(px, py, pz + h, list, off, cnt) - f) / h;
      g2 = gx * gx + gy * gy + gz * gz; work += cnt * 4;
    }
    // one step onto the surface along the gradient
    if (g2 > 1e-12) { let s = f / g2; const lim = c / Math.sqrt(g2); const nl = 0 - lim; s = s > lim ? lim : s < nl ? nl : s; px -= gx * s; py -= gy * s; pz -= gz * s; }
    g2 = Math.sqrt(g2);
    if (g2 < 1e-9) { gx = 0; gy = 1; gz = 0; g2 = 1; }
    gx /= g2; gy /= g2; gz /= g2;
    // inside a finer grid's box this skin is drawn in under the finer one: by nothing at the box's face (the two
    // skins meet there without a step), by 3 cm from a little way in
    if (sink.length) {
      const dIn = depthIn(sink, px, py, pz);
      if (dIn > 0) { let t = dIn / (c * 0.6); t = t > 1 ? 1 : t; const sk = sink0 + (0.03 - sink0) * t * t * (3 - 2 * t); px -= gx * sk; py -= gy * sk; pz -= gz * sk; }
    }
    // wide hollows, probed at every third vertex (the rest take it from their neighbours afterwards): how near the
    // figure stands along the normal; the field's own slope here stands for a metre
    let o2 = -1;
    if (probe && count % 3 === 0) { o2 = 1 - wideAt(px + gx * REACH, py + gy * REACH, pz + gz * REACH) / (REACH * Math.max(0.5, g2)); o2 = o2 < 0 ? 0 : o2 > 1 ? 1 : o2; work += 60; }
    if (count === cells.length) { const a = new Int32Array(count * 2); a.set(cells); cells = a; }
    cells[count] = ci;
    growOut(out, 1, 0);
    const P = out.nv * 3, O = out.nv * 2, pos = out.pos, nor = out.nor;
    pos[P] = px; pos[P + 1] = py; pos[P + 2] = pz; nor[P] = gx; nor[P + 1] = gy; nor[P + 2] = gz; out.occ[O] = 0; out.occ[O + 1] = o2;
    if (holAt) { if (!kept) { R.at(px, py, pz, list, off, cnt); work += cnt; } out.occ[O] = holAt(px, py, pz, R.gd); }
    CV[ci] = out.nv++; count++;
    work += 30;
    // onward through the faces the surface crosses
    const x0m = mask & 0x55, x1m = mask & 0xAA, y0m = mask & 0x33, y1m = mask & 0xCC, z0m = mask & 0x0F, z1m = mask & 0xF0;
    if (x0m !== 0 && x0m !== 0x55) push(i - 1, j, k);
    if (x1m !== 0 && x1m !== 0xAA) push(i + 1, j, k);
    if (y0m !== 0 && y0m !== 0x33) push(i, j - 1, k);
    if (y1m !== 0 && y1m !== 0xCC) push(i, j + 1, k);
    if (z0m !== 0 && z0m !== 0x0F) push(i, j, k - 1);
    if (z1m !== 0 && z1m !== 0xF0) push(i, j, k + 1);
  }
  // seeds: in a block the surface may pass and no walk has reached yet, the block's own corners; where two of them
  // differ in sign, the cells round the first grid edge between them that changes sign start a walk along the surface
  function seedAxis(i, j, k, di, dj, dk, n) {
    let va = val(i, j, k);
    for (let s = 0; s < n; s++) {
      const vb = val(i + di, j + dj, k + dk);
      if ((va < 0) !== (vb < 0)) {
        if (di) { push(i, j, k); push(i, j - 1, k); push(i, j, k - 1); push(i, j - 1, k - 1); }
        else if (dj) { push(i, j, k); push(i - 1, j, k); push(i, j, k - 1); push(i - 1, j, k - 1); }
        else { push(i, j, k); push(i - 1, j, k); push(i, j - 1, k); push(i - 1, j - 1, k); }
        return;
      }
      i += di; j += dj; k += dk; va = vb;
    }
  }
  function seedBlock(b) {
    const off = loff[b], cnt = loff[b + 1] - off;
    if (!cnt || seen[b]) return;
    const bi = b % nbx, bj = ((b / nbx) | 0) % nby, bk = (b / (nbx * nby)) | 0;
    const cx = x0 + (bi + 0.5) * B * c, cy = y0 + (bj + 0.5) * B * c, cz = z0 + (bk + 0.5) * B * c;
    if (skip.length && inBoxes(skip, cx, cy, cz, B * c)) return;
    work += cnt;
    if (Math.abs(R.at(cx, cy, cz, list, off, cnt)) > rad) return;
    const i0 = bi * B, i1 = Math.min(nx, i0 + B), j0 = bj * B, j1 = Math.min(ny, j0 + B), k0 = bk * B, k1 = Math.min(nz, k0 + B);
    for (let k = k0; k <= k1; k += k1 - k0) for (let j = j0; j <= j1; j += j1 - j0) for (let i = i0; i <= i1; i += i1 - i0) {
      const va = val(i, j, k);
      if (i === i0 && (va < 0) !== (val(i1, j, k) < 0)) seedAxis(i, j, k, 1, 0, 0, i1 - i0);
      if (j === j0 && (va < 0) !== (val(i, j1, k) < 0)) seedAxis(i, j, k, 0, 1, 0, j1 - j0);
      if (k === k0 && (va < 0) !== (val(i, j, k1) < 0)) seedAxis(i, j, k, 0, 0, 1, k1 - k0);
    }
  }
  // walks the surface until about `limit` of work is done; true when the whole grid has been walked
  function fill(limit) {
    work = 0;
    for (;;) {
      while (sp) { cell(stack[--sp]); if (work > limit) return false; }
      if (sb >= nb) return true;
      seedBlock(sb++);
      if (work > limit) return false;
    }
  }
  // a quad round every grid edge the surface crosses, between the four cells that share the edge
  let i0 = 0;
  function quad(a, b, cc, d) {
    if (a < 0 || b < 0 || cc < 0 || d < 0) return;
    const pos = out.pos, nor = out.nor, idx = out.idx, A = a * 3, Bq = b * 3, C = cc * 3, n = out.ni;
    const ux = pos[Bq] - pos[A], uy = pos[Bq + 1] - pos[A + 1], uz = pos[Bq + 2] - pos[A + 2], wx = pos[C] - pos[A], wy = pos[C + 1] - pos[A + 1], wz = pos[C + 2] - pos[A + 2];
    const fn = (uy * wz - uz * wy) * nor[A] + (uz * wx - ux * wz) * nor[A + 1] + (ux * wy - uy * wx) * nor[A + 2];
    idx[n] = a; idx[n + 3] = a;
    if (fn >= 0) { idx[n + 1] = b; idx[n + 2] = cc; idx[n + 4] = cc; idx[n + 5] = d; } else { idx[n + 1] = cc; idx[n + 2] = b; idx[n + 4] = d; idx[n + 5] = cc; }
    out.ni = n + 6;
  }
  function quads(from, to) {
    if (from === 0) { i0 = out.ni; growOut(out, 0, count * 18); }
    for (let t = from; t < to; t++) {
      const ci = cells[t], i = ci % nx, j = ((ci / nx) | 0) % ny, k = (ci / nxy) | 0, cv = base + t;
      const q = i + sx * j + sxy * k, s0 = V[q] < 0;
      if (j > 0 && k > 0 && s0 !== (V[q + 1] < 0)) quad(cv, CV[ci - nx], CV[ci - nx - nxy], CV[ci - nxy]);
      if (i > 0 && k > 0 && s0 !== (V[q + sx] < 0)) quad(cv, CV[ci - 1], CV[ci - 1 - nxy], CV[ci - nxy]);
      if (i > 0 && j > 0 && s0 !== (V[q + sxy] < 0)) quad(cv, CV[ci - 1], CV[ci - 1 - nx], CV[ci - nx]);
    }
  }
  // small hollows: how far each vertex lies under the mean of its neighbours (a curvature, 1/m), smoothed four times (or g.even times);
  // in the same passes the wide hollows spread from the probed vertices to the rest
  let acc, cur, nxt, wsum, wcnt;
  // the curvature in three kinds of step, so that no one of them holds the page long: the stores; the triangles from
  // index a to b of this grid's own (multiples of three); the corners
  function curvStart() {
    acc = new Float32Array(count * 4); cur = new Float32Array(count); nxt = new Float32Array(count); wsum = new Float32Array(count); wcnt = new Float32Array(count);
    return out.ni - i0;
  }
  function curvTris(a, b) {
    const pos = out.pos, idx = out.idx, ni = Math.min(out.ni, i0 + b);
    for (let t = i0 + a; t < ni; t += 3) {
      const a = idx[t], b = idx[t + 1], d = idx[t + 2];
      const A = (a - base) * 4, Bq = (b - base) * 4, C = (d - base) * 4, pa = a * 3, pb = b * 3, pc = d * 3;
      acc[A] += pos[pb] + pos[pc]; acc[A + 1] += pos[pb + 1] + pos[pc + 1]; acc[A + 2] += pos[pb + 2] + pos[pc + 2]; acc[A + 3] += 2;
      acc[Bq] += pos[pa] + pos[pc]; acc[Bq + 1] += pos[pa + 1] + pos[pc + 1]; acc[Bq + 2] += pos[pa + 2] + pos[pc + 2]; acc[Bq + 3] += 2;
      acc[C] += pos[pa] + pos[pb]; acc[C + 1] += pos[pa + 1] + pos[pb + 1]; acc[C + 2] += pos[pa + 2] + pos[pb + 2]; acc[C + 3] += 2;
    }
  }
  function curvVerts() {
    const pos = out.pos, nor = out.nor;
    const e = 2.5 * c, xa = x0 + e, ya = y0 + e, za = z0 + e, xb = x0 + nx * c - e, yb = y0 + ny * c - e, zb = z0 + nz * c - e;
    for (let q = 0; q < count; q++) {
      const A = q * 4, P = (base + q) * 3, m = acc[A + 3], x = pos[P], y = pos[P + 1], z = pos[P + 2];
      // none where this grid's skin ends (its own box, or the edge of a finer one): an open edge has no true mean
      if (!m || x < xa || y < ya || z < za || x > xb || y > yb || z > zb || (skip.length && inBoxes(skip, x, y, z, -e))) cur[q] = 0;
      else cur[q] = 4 * ((acc[A] / m - x) * nor[P] + (acc[A + 1] / m - y) * nor[P + 1] + (acc[A + 2] / m - z) * nor[P + 2]) / (c * c);
    }
  }
  // one pass of smoothing in steps: the triangles from index a to b of this grid's own, then the corners
  function smoothTris(pass, a, b) {
    const from = pass ? nxt : cur, to = pass ? cur : nxt, idx = out.idx, occ = out.occ, ni = Math.min(out.ni, i0 + b), cnt = acc;
    if (a === 0) { to.fill(0); wsum.fill(0); wcnt.fill(0); cnt.fill(0, 0, count); }
    for (let t = i0 + a; t < ni; t += 3) {
      const a = idx[t] - base, b = idx[t + 1] - base, d = idx[t + 2] - base;
      const oa = occ[(base + a) * 2 + 1], ob = occ[(base + b) * 2 + 1], od = occ[(base + d) * 2 + 1];
      to[a] += from[b]; cnt[a]++; to[b] += from[d]; cnt[b]++; to[d] += from[a]; cnt[d]++;
      if (ob >= 0) { wsum[a] += ob; wcnt[a]++; }
      if (od >= 0) { wsum[b] += od; wcnt[b]++; }
      if (oa >= 0) { wsum[d] += oa; wcnt[d]++; }
    }
  }
  function smoothVerts(pass) {
    const from = pass ? nxt : cur, to = pass ? cur : nxt, occ = out.occ, cnt = acc;
    for (let q = 0; q < count; q++) {
      to[q] = cnt[q] ? 0.4 * from[q] + 0.6 * to[q] / cnt[q] : from[q];
      const O = (base + q) * 2 + 1;
      if (wcnt[q]) occ[O] = occ[O] < 0 ? wsum[q] / wcnt[q] : 0.5 * occ[O] + 0.5 * wsum[q] / wcnt[q];
    }
  }
  // calmer shading where a low sun grazes forms no wider than a few cells: each corner's normal is drawn toward the
  // mean of its neighbours' (the triangles from index a to b, then the corners); not near this grid's own edges, so
  // that two skins still shade alike where they meet
  let cn;
  function calmTris(a, b) {
    const nor = out.nor, idx = out.idx, ni = Math.min(out.ni, i0 + b);
    if (a === 0) { cn = acc; cn.fill(0); }
    for (let t = i0 + a; t < ni; t += 3) {
      const a = idx[t], b = idx[t + 1], d = idx[t + 2];
      const A = (a - base) * 4, Bq = (b - base) * 4, C = (d - base) * 4, pa = a * 3, pb = b * 3, pc = d * 3;
      cn[A] += nor[pb] + nor[pc]; cn[A + 1] += nor[pb + 1] + nor[pc + 1]; cn[A + 2] += nor[pb + 2] + nor[pc + 2]; cn[A + 3] += 2;
      cn[Bq] += nor[pa] + nor[pc]; cn[Bq + 1] += nor[pa + 1] + nor[pc + 1]; cn[Bq + 2] += nor[pa + 2] + nor[pc + 2]; cn[Bq + 3] += 2;
      cn[C] += nor[pa] + nor[pb]; cn[C + 1] += nor[pa + 1] + nor[pb + 1]; cn[C + 2] += nor[pa + 2] + nor[pb + 2]; cn[C + 3] += 2;
    }
  }
  function calmVerts(wt) {
    const pos = out.pos, nor = out.nor;
    const e = 2.5 * c, e2 = 4.5 * c, xa = x0 + e, ya = y0 + e, za = z0 + e, xb = x0 + nx * c - e, yb = y0 + ny * c - e, zb = z0 + nz * c - e;
    for (let q = 0; q < count; q++) {
      const A = q * 4, P = (base + q) * 3, m = cn[A + 3], x = pos[P], y = pos[P + 1], z = pos[P + 2];
      if (!m || x < xa || y < ya || z < za || x > xb || y > yb || z > zb || (skip.length && inBoxes(skip, x, y, z, -e))) continue;
      // (half strength in a band next to the edges)
      const w = (x < x0 + e2 || y < y0 + e2 || z < z0 + e2 || x > xb - 2 * c || y > yb - 2 * c || z > zb - 2 * c || (skip.length && inBoxes(skip, x, y, z, -e2))) ? wt * 0.5 : wt;
      let gx = nor[P] * (1 - w) + w * cn[A] / m, gy = nor[P + 1] * (1 - w) + w * cn[A + 1] / m, gz = nor[P + 2] * (1 - w) + w * cn[A + 2] / m;
      const l = Math.sqrt(gx * gx + gy * gy + gz * gz);
      if (l > 1e-6) { nor[P] = gx / l; nor[P + 1] = gy / l; nor[P + 2] = gz / l; }
    }
  }
  function finish() {
    const occ = out.occ;
    for (let q = 0; q < count; q++) { const O = (base + q) * 2; occ[O] = cur[q] * (holAt ? occ[O] : hol); if (occ[O + 1] < 0) occ[O + 1] = 0; }
    out.stats.push([count, (out.ni - i0) / 3]);
  }
  return { fill, quads, curvStart, curvTris, curvVerts, smoothTris, smoothVerts, calmTris, calmVerts, finish, count: () => count };
}

async function meshGrid(F, R, g, out, wide, ctx) {
  const B = g.B, L = await makeLists(F, R, g.x0, g.y0, g.z0, B * g.c, Math.ceil(g.nx / B), Math.ceil(g.ny / B), Math.ceil(g.nz / B), 0, ctx);
  const M = makeMesher(R, g, out, wide, L);
  await ctx.yield();
  // (the first steps are short: the loops are not yet up to speed)
  for (let s = 0; !M.fill(s < 6 ? 2500 : 6000); s++) await ctx.yield();
  await ctx.yield();
  for (let t = 0, n = M.count(); t < n; t += 6000) { M.quads(t, Math.min(n, t + 6000)); await ctx.yield(); }
  const nt = M.curvStart();
  for (let t = 0; t < nt; t += 30000) { M.curvTris(t, t + 30000); await ctx.yield(); }
  M.curvVerts(); await ctx.yield();
  for (let pass = 0; pass < (g.even || 4); pass++) {
    for (let t = 0; t < nt; t += 30000) { M.smoothTris(pass & 1, t, t + 30000); await ctx.yield(); }
    M.smoothVerts(pass & 1); await ctx.yield();
  }
  for (let pass = 0; pass < (g.calm || 0); pass++) {
    for (let t = 0; t < nt; t += 30000) { M.calmTris(t, t + 30000); await ctx.yield(); }
    M.calmVerts(0.65); await ctx.yield();
  }
  M.finish();
}

// ---- the figure, written into a field. Points are [x, height above the soles, z]; s is +1 for the right side (+z). ----
// where a ray from o along the unit direction d first meets the field as it stands (all its primitives so far)
// (only the primitives of the groups named in the list groups are read: a ray toward the trunk need not ask the hair)
function makeTracer(F, groups, late = false) {
  const R = makeReader(F), m = F.count(), all = new Int16Array(m), first = F.nGroup();
  let n = 0;
  // (late: with everything laid on or cut after the groups, whatever it is numbered with: the arms as they are cut)
  for (let i = 0; i < m; i++) if (groups.includes(F.G[i]) || (late && i >= first)) all[n++] = i;
  return (ox, oy, oz, dx, dy, dz) => {
    let t = 0;
    for (let i = 0; i < 40; i++) {
      const d = R.at(ox + dx * t, oy + SOLE + dy * t, oz + dz * t, all, 0, n);
      if (d < 0.004) break;
      t += d * 0.9;
      if (t > 14) break;
    }
    return t > 14 ? null : [ox + dx * t, oy + dy * t, oz + dz * t];
  };
}
// THE FURROWS THAT BOUND THE FORMS. Each is a line on the skin: seen from the front ('f') or the back ('b') its points are
// [height above the soles, z, depth]; seen from his own right side ('o') they are [height, x, depth]; on the feet, seen
// from above ('t'), [x, z, depth]. w is half its width,
// a how much wider it is on its upper side (a form that hangs over it), g which forms it lies on ('body': trunk and legs,
// 'arm', 'all'). Only the right half is written (z from 0 up): the left is its mirror. A furrow does two things:
// - with cut [radius, width of the join, share of the depth] it is cut into the figure as a soft groove that the skin's
//   triangles can carry (a chain of round cones laid on the skin and taken away);
// - its line, found again on the finished skin, is written into the skin's corners (bakeFurrows), from which the bronze's
//   shader draws its sharp bottom: the normal leans toward the line from both sides and the metal is deeper in tone there.
// A line either lies in the figure's middle plane (z 0) or keeps clear of it by its width and two cells: the left half is
// the right half's mirror image, and a line that stopped just short of the middle would meet its own image badly.
const FURROWS = [
  // THE TRUNK'S FRONT. The groove between the chest's two plates; the belly's middle furrow from the breastbone's foot to the navel
  { s: 'f', g: 'body', w: 0.36, a: 0, cut: [0.45, 0.3, 1], p: [[26.05, 0, 0.03], [25.2, 0, 0.07], [24.4, 0, 0.1], [23.6, 0, 0.08], [22.6, 0, 0.15], [21.5, 0, 0.15], [20.5, 0, 0.13], [20.05, 0, 0.06]] },
  // the lower edge of each plate of the chest: from the breastbone's foot outward and up into the armpit
  { s: 'f', g: 'body', w: 0.34, a: 0.7, cut: [0.6, 0.35, 1], p: [[23.7, 0, 0.04], [23.66, 0.28, 0.06], [23.5, 0.8, 0.14], [23.44, 1.3, 0.17], [23.58, 1.9, 0.17], [23.95, 2.5, 0.13], [24.45, 2.92, 0.05]] },
  // the arch of the ribs, open at its top, falling to the flank
  { s: 'f', g: 'body', w: 0.36, a: 0, cut: [0.5, 0.3, 1], p: [[22.85, 0.72, 0.03], [22.45, 0.95, 0.09], [21.8, 1.45, 0.1], [21.05, 1.85, 0.09], [20.45, 2.02, 0.04]] },
  // the three cross furrows of the belly (the lowest at the navel's height), and the belly's outer border
  { s: 'f', g: 'body', w: 0.28, a: 0, cut: [0.36, 0.25, 0.8], p: [[22.28, 0, 0.07], [22.26, 0.6, 0.09], [22.34, 1.02, 0.03]] },
  { s: 'f', g: 'body', w: 0.28, a: 0, cut: [0.36, 0.25, 0.8], p: [[21.04, 0, 0.07], [21.0, 0.7, 0.09], [21.08, 1.3, 0.04]] },
  { s: 'f', g: 'body', w: 0.28, a: 0, p: [[19.8, 0, 0.02], [19.78, 0.5, 0.035], [19.78, 0.95, 0.04], [19.88, 1.5, 0.02]] },
  { s: 'f', g: 'body', w: 0.4, a: 0, p: [[21.2, 1.66, 0.03], [20.3, 1.62, 0.07], [19.2, 1.52, 0.07], [18.35, 1.32, 0.03]] },
  // the furrow under the flank's roll, over the hip bone and down the groin to the fork
  { s: 'f', g: 'body', w: 0.4, a: 0.3, cut: [0.5, 0.3, 0.8], p: [[19.05, 2.5, 0.05], [18.6, 2.25, 0.12], [18.1, 1.88, 0.14], [17.4, 1.4, 0.12], [16.95, 1.05, 0.04]] },
  // the lines under and over each collar bone; the furrow between the shoulder's cap and the chest
  { s: 'f', g: 'body', w: 0.24, a: 0, p: [[26.1, 0.72, 0.03], [26.2, 1.4, 0.07], [26.38, 2.2, 0.07], [26.58, 2.9, 0.03]] },
  { s: 'f', g: 'body', w: 0.24, a: 0, p: [[26.62, 0.78, 0.03], [26.76, 1.4, 0.06], [26.96, 2.2, 0.05], [27.1, 2.8, 0.02]] },
  { s: 'f', g: 'all', w: 0.32, a: 0, p: [[26.45, 2.72, 0.04], [25.6, 2.98, 0.1], [24.85, 3.14, 0.1], [24.3, 3.22, 0.04]] },
  // THE ARM, from his own side: the cap's lower edge (a V whose point lies between the upper arm's front and back masses)
  // and the furrow between those two masses below it; from the front: the elbow's fold, and the valley between the
  // forearm's two masses. (The lines between the fingers are the hand's own: buildHand.)
  { s: 'o', g: 'arm', w: 0.32, a: 0.5, cut: [0.5, 0.3, 1.2], p: [[25.0, 0.95, 0.03], [23.9, 0.42, 0.07], [22.95, -0.2, 0.08], [23.9, -0.86, 0.06], [24.9, -1.4, 0.03]] },
  { s: 'o', g: 'arm', w: 0.3, a: 0, cut: [0.5, 0.25, 2], p: [[22.75, -0.22, 0.03], [21.9, -0.26, 0.06], [21.1, -0.3, 0.055], [20.7, -0.32, 0.02]] },
  { s: 'f', g: 'arm', w: 0.24, a: 0, p: [[20.75, 3.5, 0.02], [20.45, 3.78, 0.05], [20.7, 4.08, 0.02]] },
  { s: 'f', g: 'arm', w: 0.28, a: 0, p: [[20.3, 3.8, 0.03], [19.2, 3.75, 0.06], [18.0, 3.68, 0.06], [16.9, 3.62, 0.02]] },
  // THE LEG, from the front: the inner line of the thigh's long front mass, the line between it and the outer mass, the
  // fuller mass's edge over the kneecap, the kneecap's lower edge, the two lines beside the shin's edge
  // (each is a soft valley of 0.1 m and more in the figure itself, wide enough to read as the meeting of two masses and
  // not as a line engraved; the bronze's shader draws only a gentle bottom in it)
  { s: 'f', g: 'body', w: 0.4, a: 0, cut: [0.6, 0.3, 2.6, 1], p: [[16.6, 2.35, 0.02], [15.2, 1.85, 0.045], [13.6, 1.3, 0.05], [12.0, 0.85, 0.045], [10.8, 0.62, 0.02]] },
  { s: 'f', g: 'body', w: 0.36, a: 0, cut: [0.55, 0.3, 2.2, 1], p: [[15.6, 2.4, 0.03], [14.0, 2.34, 0.06], [12.2, 2.14, 0.065], [10.7, 1.9, 0.03]] },
  { s: 'f', g: 'body', w: 0.26, a: 0.6, cut: [0.34, 0.2, 1.6], p: [[9.95, 0.72, 0.03], [10.07, 1.27, 0.07], [9.95, 1.82, 0.03]] },
  { s: 'f', g: 'body', w: 0.22, a: 0, cut: [0.3, 0.18, 1.6], p: [[8.42, 0.85, 0.03], [8.28, 1.27, 0.06], [8.42, 1.69, 0.03]] },
  { s: 'f', g: 'body', w: 0.26, a: 0, cut: [0.32, 0.2, 2.4], p: [[7.6, 0.72, 0.02], [6.4, 0.68, 0.045], [5.2, 0.72, 0.04], [4.3, 0.8, 0.012]] },
  { s: 'f', g: 'body', w: 0.26, a: 0, cut: [0.32, 0.2, 2.4], p: [[7.6, 1.6, 0.02], [6.4, 1.6, 0.045], [5.2, 1.56, 0.04], [4.3, 1.5, 0.012]] },
  // from his own side: the furrow down the thigh's outer side (behind the hand), the line between the calf and the shin's muscle
  { s: 'o', g: 'body', w: 0.32, a: 0, cut: [0.55, 0.3, 1.5, 1], p: [[15.4, -0.85, 0.03], [14.0, -0.85, 0.08], [12.4, -0.8, 0.09], [11.0, -0.6, 0.06], [10.2, -0.4, 0.02]] },
  { s: 'o', g: 'body', w: 0.26, a: 0, cut: [0.4, 0.22, 2.0], p: [[7.8, -0.1, 0.03], [6.4, -0.15, 0.06], [4.8, -0.3, 0.05], [3.2, -0.5, 0.02]] },
  // THE FOOT, from above: the four lines between the toes
  { s: 't', g: 'body', w: 0.14, a: 0, p: [[2.05, 0.86, 0.03], [2.5, 0.81, 0.08], [2.95, 0.8, 0.08]] },
  { s: 't', g: 'body', w: 0.14, a: 0, p: [[2.05, 1.3, 0.03], [2.45, 1.26, 0.08], [2.85, 1.25, 0.08]] },
  { s: 't', g: 'body', w: 0.13, a: 0, p: [[2.0, 1.68, 0.03], [2.3, 1.64, 0.08], [2.62, 1.63, 0.08]] },
  { s: 't', g: 'body', w: 0.12, a: 0, p: [[1.95, 2.02, 0.03], [2.15, 1.98, 0.07], [2.36, 1.97, 0.07]] },
  // from the back: the line between the calf's two heads, the line down the back of the thigh
  { s: 'b', g: 'body', w: 0.24, a: 0, p: [[7.6, 1.36, 0.03], [6.6, 1.36, 0.07], [5.4, 1.33, 0.06], [4.4, 1.28, 0.02]] },
  { s: 'b', g: 'body', w: 0.3, a: 0, p: [[14.4, 1.4, 0.03], [12.8, 1.4, 0.06], [11.2, 1.35, 0.05], [10.2, 1.3, 0.02]] },
  // THE BACK, plainer. The spine; the cleft; the crease under each buttock; the inner edge of each shoulder blade
  { s: 'b', g: 'body', w: 0.42, a: 0, cut: [0.45, 0.3, 1], p: [[26.4, 0, 0.08], [24.5, 0, 0.15], [22.0, 0, 0.17], [19.6, 0, 0.15], [18.3, 0, 0.06]] },
  { s: 'b', g: 'body', w: 0.3, a: 0, cut: [0.35, 0.25, 1], p: [[17.9, 0, 0.08], [16.6, 0, 0.2], [15.4, 0, 0.14]] },
  { s: 'b', g: 'body', w: 0.32, a: 0.7, cut: [0.4, 0.25, 1], p: [[15.12, 1.0, 0.06], [15.05, 1.5, 0.14], [15.3, 2.2, 0.1], [15.85, 2.7, 0.03]] },
  { s: 'b', g: 'body', w: 0.34, a: 0, p: [[25.9, 0.9, 0.03], [24.9, 0.86, 0.07], [23.9, 1.1, 0.06], [23.3, 1.6, 0.03]] },
];
// where a furrow's point lies on the figure as it stands: the line of sight from the front, the back or the side (sg: which
// half) is followed to the skin
function onSkin(tr, side, p, sg) {
  return side === 'o' ? tr(p[1], p[0], sg * 8, 0, 0, -sg) : side === 't' ? tr(p[0], 3, sg * p[1], 0, -1, 0) : side === 'f' ? tr(6, p[0], sg * p[1], -1, 0, 0) : tr(-6, p[0], sg * p[1], 1, 0, 0);
}
// the soft groove of one furrow, on one half (sg) of the figure
function cutFurrow(F, tr, f, sg) {
  const [r, k, m, own] = f.cut;
  let prev = null;
  for (const p of f.p) {
    // (the arms' tracer holds the right arm alone: a line on an arm is found there and the left arm's is its mirror)
    const mir = f.g === 'arm' && sg < 0, hit = onSkin(tr, f.s, p, mir ? 1 : sg);
    if (!hit) { prev = null; continue; }
    if (mir) hit[2] = -hit[2];
    const o = r - p[2] * m, q = f.s === 'o' ? [hit[0], hit[1], hit[2] + sg * o] : [hit[0] + (f.s === 'f' ? o : -o), hit[1], hit[2]];
    if (prev) F.rc(0, k, prev, q, r, r, 1, 1, own ? 3 : 2);
    prev = q;
  }
}
// the furrows' lines on the finished skin, for the shader: [a, b, w, depth at a, depth at b, a, 1 where a furrow begins] with
// a and b in the part's axes
function traceFurrows(tr, from, to, furs) {
  for (let i = from; i < to; i++) {
    const f = FURROWS[i];
    let prev = null, pd = 0, first = 1;
    for (const p of f.p) {
      const hit = onSkin(tr[f.g], f.s, p, 1);
      if (!hit) { prev = null; continue; }
      const b = [hit[0], hit[1] + SOLE, hit[2]];
      if (prev) { furs.push([prev, b, f.w, pd, p[2], f.a, first]); first = 0; }
      prev = b; pd = p[2];
    }
  }
  return furs;
}

// THE FURROWS AT THE SKIN'S CORNERS. To try every line at every pixel is dear, so each corner of the skin carries, for the
// furrow nearest to it, the way from the furrow's line to the corner in units of the furrow's half width (xyz) and the
// furrow's depth there over its half width (w). Across a triangle that way runs straight, so each pixel finds its own
// distance from the line exactly and the crease is sharp though the triangles are coarse. Furrows that come near one
// another must not share a place in a corner's store: they are dealt into as few sets as keep near ones apart, and a
// corner keeps one furrow of each set. (lines: each furrow's pieces from..to in furs, its widest half width, the cell of
// the grid it lies in, its set, a ball that holds everything it can reach.)
function cellAt(p) {
  // (the cell of the finest grid whose box holds the place; p on the right half)
  const inBox = (b, m) => p[0] > b[0] + m && p[0] < b[3] - m && p[1] > b[1] + m && p[1] < b[4] - m && p[2] > b[2] + m && p[2] < b[5] - m;
  return inBox(BOX_HAND(1), 0) ? CELL_HAND : inBox(BOX_YOKE, 0) || inBox(BOX_BELLY, 0) ? CELL_YOKE : inBox(BOX_FEET, 0) ? CELL_FEET : CELL_BODY;
}
function segWay(a, b, x, y, z, o) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = x - a[0], py = y - a[1], pz = z - a[2];
  let h = (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz); h = h < 0 ? 0 : h > 1 ? 1 : h;
  o[0] = px - bx * h; o[1] = py - by * h; o[2] = pz - bz * h; o[3] = h;
  return Math.sqrt(o[0] * o[0] + o[1] * o[1] + o[2] * o[2]);
}
function* furrowLines(furs) {
  const lines = [], o = [0, 0, 0, 0];
  for (let i = 0; i < furs.length; i++) {
    const f = furs[i];
    if (f[6]) lines.push({ from: i, to: i, w: 0, c: 0, set: -1, mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9] });
    const L = lines[lines.length - 1];
    L.to = i + 1; L.w = Math.max(L.w, f[2] * (1 + f[5])); L.c = Math.max(L.c, cellAt(f[0]), cellAt(f[1]));
    for (const q of [f[0], f[1]]) for (let k = 0; k < 3; k++) { L.mn[k] = Math.min(L.mn[k], q[k]); L.mx[k] = Math.max(L.mx[k], q[k]); }
  }
  for (const L of lines) {
    const r = Math.hypot(L.mx[0] - L.mn[0], L.mx[1] - L.mn[1], L.mx[2] - L.mn[2]) / 2 + L.w + 3 * L.c;
    L.ball = [(L.mn[0] + L.mx[0]) / 2, (L.mn[1] + L.mx[1]) / 2, (L.mn[2] + L.mx[2]) / 2, r * r]; L.r = r;
  }
  // which furrows come too near one another (the other half's mirror image counted): nearer than both half widths and
  // four cells
  const near = lines.map(() => []);
  for (let a = 0; a < lines.length; a++) for (let b = a + 1; b < lines.length; b++) {
    const A = lines[a], B = lines[b], T = A.w + B.w + 4 * Math.max(A.c, B.c);
    let hit = false;
    for (let i = A.from; i < A.to && !hit; i++) {
      const f = furs[i], n = Math.ceil(Math.hypot(f[1][0] - f[0][0], f[1][1] - f[0][1], f[1][2] - f[0][2]) / 0.12);
      for (let k = 0; k <= n && !hit; k++) {
        const x = f[0][0] + (f[1][0] - f[0][0]) * k / n, y = f[0][1] + (f[1][1] - f[0][1]) * k / n, z = f[0][2] + (f[1][2] - f[0][2]) * k / n;
        for (let j = B.from; j < B.to && !hit; j++) if (segWay(furs[j][0], furs[j][1], x, y, z, o) < T || segWay(furs[j][0], furs[j][1], x, y, -z, o) < T) hit = true;
      }
    }
    if (hit) { near[a].push(b); near[b].push(a); }
    if (b === lines.length - 1 && a % 6 === 5) yield;
  }
  yield;
  // dealt into the fewest sets, those with the most neighbours first
  const order = lines.map((_, i) => i).sort((a, b) => near[b].length - near[a].length || a - b);
  let K = 1, tries = 0;
  const deal = (n) => {
    if (n === order.length) return true;
    const l = order[n];
    for (let k = 0; k < K; k++) {
      if (near[l].some((m) => lines[m].set === k)) continue;
      lines[l].set = k;
      if (deal(n + 1)) return true;
      if (++tries > 1500) break;
    }
    lines[l].set = -1;
    return false;
  };
  while (!deal(0)) { K++; tries = 0; for (const L of lines) L.set = -1; yield; }
  // (the heights between which there are furrows at all)
  let y0 = 1e9, y1 = -1e9;
  for (const L of lines) { y0 = Math.min(y0, L.ball[1] - L.r); y1 = Math.max(y1, L.ball[1] + L.r); }
  return { lines, K, near, y0, y1 };
}
// (corners i0 up to i1 into A, K places of four numbers each for every corner, as 16 bit numbers: the way over 4, the depth)
function bakeFurrows(pos, furs, FL, A, i0, i1) {
  const lines = FL.lines, K = FL.K, o = [0, 0, 0, 0], score = new Float64Array(K), val = new Float64Array(K * 4);
  for (let i = i0; i < i1; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], zs = pos[i * 3 + 2], z = zs < 0 ? -zs : zs;
    for (let k = 0; k < K; k++) score[k] = 1e9;
    for (let l = y > FL.y0 && y < FL.y1 ? 0 : lines.length; l < lines.length; l++) {
      const L = lines[l], B = L.ball, ex = x - B[0], ey = y - B[1], ez = z - B[2];
      if (ex * ex + ey * ey + ez * ez > B[3]) continue;
      // its nearest piece, by distance over half width (the upper side of a furrow under an overhang is wider)
      let best = 1e9, vx = 0, vy = 0, vz = 0, dep = 0, dist = 0, wide = 1;
      for (let j = L.from; j < L.to; j++) {
        const f = furs[j], d = segWay(f[0], f[1], x, y, z, o), w = f[2] * (o[1] >= 0 ? 1 + f[5] : 1), t = d / w;
        if (t < best) { best = t; vx = o[0] / w; vy = o[1] / w; vz = o[2] / w; dep = (f[3] + (f[4] - f[3]) * o[3]) / w; dist = d; wide = w; }
      }
      const k = L.set;
      if (dist - wide >= score[k]) continue;
      score[k] = dist - wide;
      // beyond its edge a furrow counts for nothing: its depth is let go between a third of a cell and a cell outside
      let u = (dist - wide - 0.3 * L.c) / (0.7 * L.c); u = u < 0 ? 0 : u > 1 ? 1 : u;
      val[k * 4] = vx; val[k * 4 + 1] = vy; val[k * 4 + 2] = zs < 0 ? -vz : vz; val[k * 4 + 3] = dep * (1 - u * u * (3 - 2 * u));
    }
    for (let k = 0; k < K; k++) {
      const a = A[k], q = i * 4;
      if (score[k] > 1e8) { a[q] = 32000; a[q + 1] = 0; a[q + 2] = 0; a[q + 3] = 0; continue; }
      let vx = val[k * 4], vy = val[k * 4 + 1], vz = val[k * 4 + 2];
      const m = Math.sqrt(vx * vx + vy * vy + vz * vz), sc = (m > 3.9 ? 3.9 / m : 1) * 32767 / 4;
      a[q] = Math.round(vx * sc); a[q + 1] = Math.round(vy * sc); a[q + 2] = Math.round(vz * sc); a[q + 3] = Math.round(Math.min(1, val[k * 4 + 3]) * 32767);
    }
  }
}

// the waist: the middle of the trunk's waist form (the mass between the pelvis and the cage of the ribs), above the soles;
// the trunk's outline is drawn in most at this height
const WAIST = 20.6;
function buildTrunk(F) {
  const g = G_TRUNK;
  // pelvis (narrow), waist and belly, the cage of the ribs (broad and deep), the shoulder girdle
  F.el(g, 0.6, [-0.1, 17.5, 0], [1.84, 2.6, 2.86]);
  F.el(g, 0.7, [0.0, WAIST, 0], [1.8, 2.8, 2.12]);
  F.el(g, 0.7, [0.02, 23.8, 0], [2.42, 3.3, 3.02]);
  F.rc(g, 0.7, [-0.3, 26.3, -3.0], [-0.3, 26.3, 3.0], 1.08, 1.08, 1.3, 1);
  // the breastbone: a plate between the chest's two masses, a little under their fullest, so that the middle of
  // the chest is a groove and not a trench
  F.rc(g, 0.2, [1.78, 24.5, 0], [1.3, 26.25, 0], 0.8, 0.7);
  // neck (thick: as wide as the jaw) and the slopes from it to the shoulders
  F.rc(g, 0.5, [-0.45, 26.3, 0], [-0.42, 28.9, 0], 1.46, 1.08);
  for (const s of [1, -1]) {
    F.rc(g, 0.5, [-0.5, 27.5, s * 0.85], [-0.4, 27.1, s * 3.3], 0.9, 0.62);
    // the broad muscles of the back under the arms: they end above the waist, so that sky shows between arm and flank
    F.el(g, 0.4, [-0.55, 23.9, s * 2.62], [1.2, 2.3, 0.62], [s * 0.18, 0, 0]);
    // the chest's two masses: each a shell 0.3 m proud of the ribs; its lower edge is one curve that rises from the
    // breastbone's foot outward and up into the armpit (the fold of the great chest muscle running into the arm);
    // above it runs out under the collar bones, outward into the shoulder
    F.sh(g, 0.22, 0.5, s, 0.1, 26.1, s * 1.1, 2.6, 0.3, [0.12, 23.8, 0], [2.64, 3.68, 3.52], 0.28);
    // the cords of the neck, from the pit between the collar bones up and back to behind the ear
    F.rc(g, 0.26, [1.06, 26.4, s * 0.34], [0.68, 27.5, s * 0.78], 0.28, 0.28);
    F.rc(g, 0.3, [0.68, 27.5, s * 0.78], [0.07, 28.6, s * 1.1], 0.28, 0.26);
    F.rc(g, 0.42, [0.06, 28.6, s * 1.1], [-0.42, 29.15, s * 1.18], 0.26, 0.18);
    // the roll of muscle over each hip
    F.el(g, 0.5, [-0.1, 19.1, s * 2.02], [1.25, 0.95, 0.46]);
    // shoulder blades, the long muscles beside the spine, buttocks
    F.el(g, 0.45, [-1.76, 24.9, s * 1.6], [0.52, 1.7, 1.35], [0, s * -0.25, 0]);
    F.el(g, 0.35, [-1.46, 20.8, s * 0.72], [0.58, 3.0, 0.66]);
    F.el(g, 0.45, [-1.1, 17.0, s * 1.38], [1.35, 1.95, 1.42]);
  }
}

// the lines cut into the figure once it stands, firm enough to hold shade under a low sun (the furrows above), and
// the small forms laid on or taken away with them: the hollows beside the kneecaps, the collar bones, the pit of the
// throat, the navel
// (returned as a list of steps to be taken in this order, so that the tracing never holds the page for long)
function cutTrunk(F, tr) {
  const steps = [];
  const cutBoth = (f) => () => { cutFurrow(F, tr[f.g], f, 1); if (f.s === 'o' || f.p.some((p) => p[1] !== 0)) cutFurrow(F, tr[f.g], f, -1); };
  // (first the valleys that are the legs' own)
  for (const f of FURROWS) if (f.cut && f.cut[3]) steps.push(cutBoth(f));
  // the belly's long muscle: three low pads a side between the breastbone's foot and the navel (0.2 m proud)
  for (const s of [1, -1]) steps.push(() => {
    for (const [h, rx, ry] of [[22.85, 0.34, 0.6], [21.65, 0.34, 0.6], [20.36, 0.26, 0.72]]) { const pt = tr.body(6, h, s * 0.74, -1, 0, 0); if (pt) F.el(0, 0.25, [pt[0] - 0.14, h, s * 0.74], [rx, ry, 0.64], null, 1); }
  });
  for (const f of FURROWS) if (f.cut && !f.cut[3]) steps.push(cutBoth(f));
  for (const s of [1, -1]) steps.push(() => { for (const d of [-0.72, 0.72]) F.el(0, 0.2, [1.14, KNEE, s * (KNEE_Z + d)], [0.34, 0.7, 0.25], null, 2); });
  // the foot's arch: a hollow under its inner side between the heel and the ball
  steps.push(() => { for (const s of [1, -1]) F.el(0, 0.22, [0.3, 0.0, s * 0.44], [0.95, 0.5, 0.34], null, 2); });
  // the collar bones (0.15 m proud): from the pit of the throat out and a little up to the shoulders
  for (const s of [1, -1]) steps.push(() => {
    let prev = null;
    for (const [h, z] of [[26.3, 0.62], [26.42, 1.3], [26.6, 2.15], [26.82, 2.95]]) {
      const hit = tr.body(6, h, s * z, -1, 0, 0);
      if (!hit) { prev = null; continue; }
      const q = [hit[0] - 0.05, hit[1], hit[2]];
      if (prev) F.rc(0, 0.16, prev, q, 0.2, 0.17, 1, 1, 1);
      prev = q;
    }
  });
  // the pit of the throat between them, the navel
  steps.push(() => { const pt = tr.body(6, 26.5, 0, -1, 0, 0); if (pt) F.el(0, 0.25, [pt[0] + 0.1, pt[1], 0], [0.27, 0.3, 0.34], null, 2); });
  steps.push(() => { const nv = tr.body(6, 19.75, 0, -1, 0, 0); F.el(0, 0.1, [nv[0] + 0.02, nv[1], 0], [0.3, 0.25, 0.3], null, 2); });
  return steps;
}

// (the knee's middle stands this far from the figure's middle plane)
const KNEE_Z = 1.27;
function buildLeg(F, s) {
  const g = G_LEG + (s > 0 ? 0 : 1);
  // thigh (heavy; the two meet from the fork to half way down, then part): a core that narrows to the knee, the long
  // front mass, the outer mass, the drop of muscle over the knee's inner side, the back, the inner mass high up
  F.rc(g, 0.5, [-0.1, 16.5, s * 1.5], [0.08, 9.7, s * 1.27], 1.5, 1.0, 1.2, 1);
  F.el(g, 0.4, [1.02, 13.3, s * 1.5], [1.1, 3.0, 1.15]);
  F.el(g, 0.35, [0.36, 14.3, s * 2.3], [0.95, 3.5, 0.64]);
  F.el(g, 0.25, [0.74, 10.4, s * 0.72], [0.66, 1.1, 0.56]);
  F.el(g, 0.5, [-1.0, 12.6, s * 1.42], [0.9, 3.0, 1.15]);
  F.el(g, 0.5, [-0.1, 14.2, s * 0.8], [1.3, 2.2, 0.8]);
  // knee (narrow beside the thigh and the calf): the joint, the kneecap standing proud as a shield, the knob under it
  F.el(g, 0.35, [0.12, KNEE, s * KNEE_Z], [1.1, 1.2, 1.04]);
  F.el(g, 0.14, [1.04, KNEE + 0.02, s * KNEE_Z], [0.36, 0.64, 0.54]);
  F.el(g, 0.2, [0.98, KNEE - 1.08, s * KNEE_Z], [0.26, 0.42, 0.32]);
  // shank: a slim core down to a narrow ankle, the two heads of the calf (the inner lower and fuller), the shin's edge,
  // the muscle beside it, the heel cord
  F.rc(g, 0.4, [0.05, 8.7, s * KNEE_Z], [-0.5, 1.9, s * 1.2], 1.0, 0.6);
  F.el(g, 0.35, [-0.82, 6.5, s * 0.98], [1.0, 2.5, 0.72]);
  F.el(g, 0.35, [-0.84, 6.9, s * 1.76], [0.98, 2.4, 0.8]);
  F.rc(g, 0.14, [1.14, 8.0, s * 1.14], [-0.05, 2.0, s * 1.14], 0.3, 0.4);
  F.el(g, 0.3, [0.5, 6.2, s * 1.72], [0.6, 1.9, 0.5]);
  F.rc(g, 0.3, [-1.0, 4.2, s * 1.2], [-1.15, 1.1, s * 1.2], 0.3, 0.34);
  buildFoot(F, s, g);
}

// the foot: FOOT long from the back of the heel to the tip of the great toe, broad, flat on the marble
const HEEL_X = -1.62;
// the five toes: where each lies (z), how far its tip stands behind the great toe's, its radius
const TOE_Z = [0.55, 1.04, 1.44, 1.81, 2.13], TOE_BACK = [0, 0, 0.2, 0.46, 0.76], TOE_R = [0.31, 0.23, 0.22, 0.2, 0.18];
function buildFoot(F, s, g) {
  const tip = HEEL_X + FOOT + 0.032;
  // ankle bones: the inner one higher than the outer
  F.el(g, 0.12, [-0.5, 1.66, s * 0.6], [0.3, 0.4, 0.24]);
  F.el(g, 0.12, [-0.64, 1.44, s * 1.84], [0.3, 0.4, 0.24]);
  // heel, the outer edge of the sole, the instep falling to the toes, the ball
  F.el(g, 0.3, [HEEL_X + 0.75, 0.62, s * 1.2], [0.75, 0.7, 0.68]);
  F.rc(g, 0.3, [-0.7, 0.3, s * 1.5], [1.8, 0.27, s * 1.9], 0.34, 0.3);
  F.rc(g, 0.3, [-0.7, 0.3, s * 0.95], [1.7, 0.3, s * 0.72], 0.3, 0.34);
  F.rc(g, 0.4, [-0.4, 1.5, s * 1.2], [1.6, 0.62, s * 1.22], 0.58, 0.46, 1, 1.3);
  F.el(g, 0.3, [1.72, 0.44, s * 1.25], [0.8, 0.46, 1.02]);
  // five plain toes lying close, the great toe and the second the longest
  const tz = TOE_Z, tx = TOE_BACK.map((b) => tip - b), tr = TOE_R;
  for (let t = 0; t < 5; t++) {
    const r = tr[t], x1 = tx[t] - r;
    F.rc(g, 0.07, [1.8, r + 0.14, s * (tz[t] * 0.92 + 0.1)], [x1 - 0.32, r + 0.06, s * tz[t]], r * 1.05, r, 1, 1.1);
    F.rc(g, 0.05, [x1 - 0.32, r + 0.06, s * tz[t]], [x1, r * 0.9, s * tz[t]], r, r, 1, 1.1);
  }
}

// the arm hangs down the side; the elbow stands a little out from the flank (sky between) and a hand's breadth forward of
// the shoulder, so that the forearm can fall to a hand that lies on the thigh
const ELBOW_X = -0.2, ELBOW_Z = 3.82, ELBOW_H = 20.4;
function buildArm(F, s, thigh, lines) {
  const g = G_ARM + (s > 0 ? 0 : 1);
  const W = handPlace(thigh, s, 0, WRIST_H, WRIST_OFF);
  // shoulder cap (a big round): its outer face is at half the width across the shoulders; its lower end runs down the
  // arm's outer side to a point between the front and the back mass
  F.el(g, 0.3, [-0.15, 25.75, s * (SHOULDERS / 2 - 1.1)], [1.35, 1.6, 1.08]);
  F.el(g, 0.3, [-0.2, 24.05, s * 3.96], [0.74, 1.3, 0.46]);
  // upper arm: a core slimmer than the cap above it, the front mass (full, ending above the elbow's fold), the back mass
  // (standing out to the side behind it), the elbow's point
  F.rc(g, 0.4, [-0.25, 24.8, s * 3.6], [ELBOW_X, ELBOW_H, s * ELBOW_Z], 0.66, 0.55, 1.18, 1);
  F.el(g, 0.3, [0.48, 22.7, s * 3.62], [0.74, 1.78, 0.66]);
  F.el(g, 0.3, [-1.0, 23.05, s * 3.8], [0.63, 1.92, 0.6]);
  F.el(g, 0.22, [ELBOW_X - 0.76, ELBOW_H + 0.05, s * (ELBOW_Z + 0.02)], [0.32, 0.48, 0.34]);
  // forearm: from the elbow down and a little forward to the wrist; two masses full below the elbow, the outer one
  // toward the front and the inner one toward the back, a valley between them down its front; they run out two thirds
  // of the way down, where the forearm is all cord and bone, to a flat wrist that is turned as the hand is turned
  const at = (t, dx, dz) => [ELBOW_X + (W[0] - ELBOW_X) * t + dx, ELBOW_H + (W[1] - ELBOW_H) * t, s * (ELBOW_Z + (s * W[2] - ELBOW_Z) * t + dz)];
  const lean = [s * Math.atan2(ELBOW_Z - s * W[2], ELBOW_H - W[1]), 0, Math.atan2(W[0] - ELBOW_X, ELBOW_H - W[1])];
  F.rc(g, 0.3, [ELBOW_X, ELBOW_H, s * ELBOW_Z], W, 0.54, 0.38);
  F.el(g, 0.34, at(0.2, 0.24, 0.27), [0.56, 1.9, 0.41], lean);
  F.el(g, 0.34, at(0.2, 0.08, -0.25), [0.6, 1.7, 0.4], lean);
  F.el(g, 0.2, [W[0], W[1] - 0.05, W[2]], [0.52, 0.5, 0.33], [0, s * HAND_TURN, 0]);
  // the wrist's knob: on the little finger's side, toward the back of the hand
  F.el(g, 0.12, handPlace(thigh, s, 0.42, WRIST_H + 0.24, WRIST_OFF + 0.06), [0.23, 0.28, 0.23]);
  buildHand(F, s, g, thigh, lines);
}

// THE HAND lies open on the thigh, its back turned HAND_TURN from the side toward the front (the thumb toward the thigh's
// front, the little finger at its outer side), so that from before him the back of the hand and its fingers are seen and
// not its edge. It is laid out on the thigh's own skin: a place of the hand is an arc round the thigh from the hand's
// middle line (metres; toward the front negative), a height over the soles and a distance off the skin.
const HAND_TURN = 0.49, THIGH_AXIS = [0.2, 1.5], HAND_R = 1.75, WRIST_H = 15.4, WRIST_OFF = 0.8, KNUCKLE_H = 13.75, PALM_TILT = 0.2;
function handPlace(thigh, s, a, h, off) {
  const b = Math.PI / 2 - HAND_TURN + a / HAND_R, c = Math.cos(b), sn = Math.sin(b);
  const hit = thigh(THIGH_AXIS[0] + c * 6, h, THIGH_AXIS[1] + sn * 6, -c, 0, -sn) || [THIGH_AXIS[0] + c * 1.5, h, THIGH_AXIS[1] + sn * 1.5];
  return [hit[0] + c * off, h, s * (hit[2] + sn * off)];
}
// the four fingers from the first to the little one: where each is rooted across the knuckles, its length, its radius
const FINGER_A = [-0.63, -0.21, 0.21, 0.63], FINGER_L = [1.5, 1.68, 1.55, 1.22], FINGER_R = [0.2, 0.21, 0.2, 0.17];
// along a finger: its three joints and its tip as shares of its length, how much thinner it is there, how far its middle
// stands off the thigh (the knuckles high, the tips on the skin: a little curled), how much the fingers have spread
const FINGER_T = [0, 0.5, 0.82, 1], FINGER_THIN = [1, 0.92, 0.84, 0.72], FINGER_OFF = [0.36, 0.25, 0.2, 0.165], FINGER_FAN = [1, 1.1, 1.17, 1.22];
function buildHand(F, s, g, thigh, lines) {
  const turn = [s * PALM_TILT, s * HAND_TURN, 0];
  // the back of the hand and the palm: one flat mass from the wrist to the knuckles, leaning in toward the thigh
  F.bx(g, 0.3, handPlace(thigh, s, 0, 14.55, 0.5), [0.78, 0.86, 0.24], 0.22, turn);
  // (under the palm the hand is one with the thigh: no thin air is left there for the skin's triangles to stumble on)
  F.bx(g, 0.2, handPlace(thigh, s, 0, 14.5, 0.16), [0.62, 0.8, 0.3], 0.2, turn);
  // the ball of the thumb, and the thumb lying apart toward the thigh's front, shade between it and the first finger
  F.el(g, 0.2, handPlace(thigh, s, -0.62, 14.75, 0.4), [0.42, 0.62, 0.3], [s * PALM_TILT, s * (HAND_TURN + 0.3), 0]);
  const t0 = handPlace(thigh, s, -0.88, 14.85, 0.42), t1 = handPlace(thigh, s, -1.36, 14.02, 0.27), t2 = handPlace(thigh, s, -1.56, 13.34, 0.2);
  F.rc(g, 0.08, t0, t1, 0.28, 0.215);
  F.rc(g, 0.05, t1, t2, 0.215, 0.16);
  F.el(g, 0.05, [t1[0], t1[1], t1[2]], [0.245, 0.25, 0.245]);
  const mids = [];
  for (let f = 0; f < 4; f++) {
    const r = FINGER_R[f], l = FINGER_L[f], pts = [];
    for (let j = 0; j < 4; j++) pts.push(handPlace(thigh, s, FINGER_A[f] * FINGER_FAN[j], KNUCKLE_H - l * FINGER_T[j], FINGER_OFF[j] * (0.85 + 0.15 * r / 0.2)));
    for (let j = 0; j < 3; j++) F.rc(g, j ? 0.04 : 0.05, pts[j], pts[j + 1], r * FINGER_THIN[j], r * FINGER_THIN[j + 1]);
    // (under its first two joints each finger stands on the thigh by a web of its own width: no thin air under it)
    const low = [0, 1, 2].map((j) => handPlace(thigh, s, FINGER_A[f] * FINGER_FAN[j], KNUCKLE_H - l * FINGER_T[j], 0.1));
    for (let j = 0; j < 2; j++) F.rc(g, 0.04, low[j], low[j + 1], r * 0.85, r * 0.8);
    // the knuckle (0.12 m proud of the finger's back) and the finger's first joint
    const k = handPlace(thigh, s, FINGER_A[f], KNUCKLE_H + 0.04, FINGER_OFF[0] + 0.13), q = handPlace(thigh, s, FINGER_A[f] * FINGER_FAN[1], KNUCKLE_H - l * FINGER_T[1], FINGER_OFF[1] + 0.045);
    F.el(g, 0.06, k, [0.2, 0.23, 0.2]);
    F.el(g, 0.04, q, [r * 0.95, r * 1.05, r * 0.95]);
    mids.push(pts);
  }
  // the lines between finger and finger, for the bronze's shader (the right hand's; the left is its mirror): each runs
  // down the middle of the gap at the height of the fingers' own middles: [place, place, half width, depth, depth]
  if (s > 0 && lines) for (let f = 0; f < 3; f++) for (let j = 0; j < 3; j++) {
    const m = (j2) => [(mids[f][j2][0] + mids[f + 1][j2][0]) / 2, (mids[f][j2][1] + mids[f + 1][j2][1]) / 2 + SOLE, (mids[f][j2][2] + mids[f + 1][j2][2]) / 2];
    lines.push([m(j), m(j + 1), 0.16, j ? 0.08 : 0.05, j === 2 ? 0.05 : 0.08, 0, j === 0 ? 1 : 0]);
  }
}

// a small fixed stream: the statue is the same on every visit, so nothing here reads the world's seed
function fixedRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// the head: a beardless young man's head by proportion: the eyes at half its height, cheekbones with the cheek falling
// in under them toward the mouth, a jaw that turns up toward the ear at an angle, a straight nose narrower at the
// bridge than at the tip, full closed lips, a round chin
const SKULL = [-0.2, 30.75, 0], SKULL_R = [1.7, 1.25, 1.4];
function buildHead(F) {
  const g = G_HEAD;
  F.el(g, 0.4, SKULL, SKULL_R);
  // the face's own mass (narrower than the skull), the chin, the mound of the mouth on which the lips are laid
  F.el(g, 0.5, [0.42, 29.9, 0], [1.14, 1.15, 0.84]);
  F.el(g, 0.3, [1.27, 28.94, 0], [0.5, 0.46, 0.44]);
  F.el(g, 0.3, [1.47, 29.44, 0], [0.33, 0.34, 0.44]);
  for (const s of [1, -1]) {
    // the brow: a soft arched ridge from the root of the nose over the eye, turning back at the temple
    F.rc(g, 0.25, [1.46, 30.88, s * 0.17], [1.44, 30.95, s * 0.6], 0.14, 0.155);
    F.rc(g, 0.25, [1.44, 30.95, s * 0.6], [0.98, 30.78, s * 1.0], 0.155, 0.12);
    // the cheekbone under the eye's outer corner and its arch running back to the ear; the cheek beside nose and mouth
    F.el(g, 0.3, [1.0, 30.06, s * 0.7], [0.44, 0.3, 0.28]);
    F.el(g, 0.35, [0.3, 30.1, s * 0.88], [0.72, 0.3, 0.2]);
    // the chewing muscle: the side of the face between cheekbone and jaw's angle is one plane, not a shelf
    F.el(g, 0.4, [0.25, 29.62, s * 0.8], [0.6, 0.55, 0.2]);
    F.el(g, 0.4, [1.12, 29.8, s * 0.44], [0.42, 0.5, 0.34]);
    // the jaw: from the chin back to its angle, then the upright branch to under the ear
    F.rc(g, 0.3, [1.05, 28.9, s * 0.3], [-0.05, 29.15, s * 0.86], 0.27, 0.26);
    F.rc(g, 0.3, [-0.05, 29.15, s * 0.86], [-0.3, 30.05, s * 0.98], 0.26, 0.28);
    // the ear: a plate lying against the head, its back edge a little out; the bowl cut into it leaves the rim
    // round its top and back; the lobe under it
    F.el(g, 0.16, [-0.3, 30.22, s * 1.27], [0.32, 0.52, 0.24], [s * 0.08, s * 0.16, -0.22]);
    F.el(g, 0.14, [-0.2, 29.78, s * 1.22], [0.18, 0.2, 0.16]);
    // the nose's sides, narrow at the bridge and widening downward, and its wings
    F.rc(g, 0.18, [1.44, 30.7, s * 0.05], [1.64, 29.95, s * 0.15], 0.085, 0.15);
    F.el(g, 0.14, [1.63, 29.86, s * 0.19], [0.17, 0.13, 0.11]);
  }
  // the nose: a narrow straight ridge down from between the brows, a round tip, the foot under it
  F.rc(g, 0.25, [1.5, 30.95, 0], [1.9, 30.0, 0], 0.1, 0.15);
  F.el(g, 0.18, [1.893, 29.92, 0], [0.17, 0.15, 0.165]);
  F.rc(g, 0.1, [1.86, 29.8, 0], [1.6, 29.7, 0], 0.1, 0.09);
}
// cut and laid on after the head stands: the eyes (a hollow under the brow, the lids as one soft dome, a long open
// almond, the ball in it), the ear's hollow, a faint nostril, the two
// full lips (the line of the mouth is the soft valley where they meet)
function cutHead(F) {
  for (const s of [1, -1]) {
    // the socket: a hollow under the brow, deepest at the fold over the upper lid
    F.el(0, 0.25, [1.93, 30.58, s * 0.56], [0.52, 0.29, 0.46], null, 2);
    // the lids: one soft dome a little larger than the ball; the opening cut through it; in the opening the ball,
    // 3 cm behind the lids' edges
    const bc = [1.13, 30.5, s * 0.5], br = [0.3, 0.25, 0.38];
    F.el(0, 0.1, [bc[0], bc[1] + 0.02, bc[2]], [br[0] + 0.045, br[1] + 0.05, br[2] + 0.05], null, 1);
    F.el(0, 0.02, [bc[0] + br[0] + 0.1, bc[1], bc[2]], [0.13, 0.13, 0.29], null, 2);
    F.el(0, 0.02, [bc[0] + 0.01, bc[1], bc[2]], br, null, 1);
    F.el(0, 0.12, [-0.2, 30.27, s * 1.6], [0.18, 0.3, 0.1], [s * 0.08, s * 0.16, -0.22], 2);
    // the nostril: a soft shallow dent under the wing
    F.el(0, 0.1, [1.69, 29.71, s * 0.14], [0.055, 0.028, 0.04], null, 2);
  }
  // two full lips, each its own round form; the line of the mouth is the soft valley where they meet
  F.el(0, 0.1, [1.65, 29.535, 0], [0.2, 0.115, 0.35], null, 1);
  F.el(0, 0.1, [1.6, 29.28, 0], [0.22, 0.14, 0.28], null, 1);
  F.el(0, 0.25, [1.95, 29.06, 0], [0.13, 0.1, 0.26], null, 2);
  // sole to crown is a measure of the figure, whatever way the locks fall: the hair is levelled at that height
  F.bx(0, 0.03, [HAIR[0], FIGURE + 0.5, 0], [2.6, 0.5, 2.2], 0.05, null, 2);
}

// the hair: an under mass, then long tapered locks laid over one another like tiles from the brow to the nape. Each
// lock is a chain of round cones, full near its root and running out to a point, that sets off along the flow of
// the hair (away from the face, then down the back) and swings across it once to each side: a comma or an S.
// The rule is of the head: the locks stand in rows by height (degrees down from the crown). Along the hairline a
// crest of nine small locks and, a little above it, a tier of eight, evenly spaced across the brow and temples; one
// lock at each temple over the ear; then five rows round the head down to the nape, 4, 8, 10, 12 and 12 to a row,
// evenly spaced from a dealt start, a lock left out where its root would fall in the hairline's own band. A lock's
// size, length, lift and toss are its row's, each with a small dealt play, and neighbours in a row swing opposite
// ways. Every draw of the stream is one of these numbers: of a lock, or of a row's start.
const HAIR = [-0.5, 30.43, 0], HAIR_R = [1.96, 1.61, 1.68];
function buildHair(F) {
  const g = G_HAIR, rnd = fixedRng(2750), rad = Math.PI / 180;
  // the under mass: a cap over the crown and a mass down the back to the nape; the cheeks, the jaw and the lower
  // half of each ear stay bare
  F.el(g, 0.3, [HAIR[0], HAIR[1] + 0.56, 0], [1.72, 1.12, 1.56]);
  F.el(g, 0.3, [HAIR[0] - 0.75, HAIR[1] - 0.36, 0], [1.08, 1.42, 1.3]);
  F.el(g, 0.2, [0.4, HAIR[1] + 1.6, 0], [0.55, 0.3, 0.4]);
  // the whorl at the crown, where the locks part: its top is the figure's own height (no lock stands above it: the
  // hair is levelled there, among the cuts made when the head stands)
  F.el(g, 0.3, [HAIR[0], FIGURE - 0.3, 0], [0.5, 0.33, 0.45]);
  // behind and under each ear the locks lie on a mass of their own (the neck is slimmer than the head there)
  for (const s of [1, -1]) { F.el(g, 0.3, [-0.82, 30.35, s * 1.1], [0.5, 0.8, 0.42]); F.el(g, 0.3, [-1.0, 29.55, s * 0.95], [0.62, 0.75, 0.5]); }
  const j = (v) => (rnd() - 0.5) * 2 * v;
  // a lock's thickness along its length: full soon after the root, running out to a point
  const PROF = [0.5, 0.9, 1, 0.98, 0.88, 0.74, 0.58, 0.42, 0.26];
  // how far a lock stands off the head along its length: laid like a tile with its tip lifting, or (at the brow)
  // rising in a crest and turning back in
  const TILE = [-0.04, 0.08, 0.17, 0.22, 0.22, 0.14], CREST = [-0.02, 0.13, 0.21, 0.23, 0.2, 0.14];
  const along = (A, t) => { const f = t * (A.length - 1), i = Math.min(A.length - 2, Math.floor(f)); return A[i] + (A[i + 1] - A[i]) * (f - i); };
  // one lock rooted at th (degrees down from the top) and ph (degrees round from the front, toward +z)
  const lock = (th, ph, len, r0, lift, toss, curl, RISE) => {
    const st = Math.sin(th * rad);
    let dx = st * Math.cos(ph * rad), dy = Math.cos(th * rad), dz = st * Math.sin(ph * rad), prev = null, web = null;
    const n = PROF.length, ds = len / (n - 1);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // the point on the hair's own ellipsoid along (dx, dy, dz), and the outward normal there
      const x = HAIR_R[0] * dx, y = HAIR_R[1] * dy, z = HAIR_R[2] * dz;
      let nx = dx / HAIR_R[0], ny = dy / HAIR_R[1], nz = dz / HAIR_R[2];
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const o = along(RISE, t) * lift + 0.05;
      const q = [HAIR[0] + x + nx * o, HAIR[1] + y + ny * o, HAIR[2] + z + nz * o];
      if (prev) F.rc(g, 0.04, prev, q, r0 * PROF[i - 1], r0 * PROF[i]);
      prev = q;
      // a crest lock stands off the head: a web under it ties it to the mass, so that no sky shows through the curls
      if (RISE === CREST) {
        const w = [HAIR[0] + x, HAIR[1] + y, HAIR[2] + z, Math.max(0.1, o - r0 * PROF[i] + 0.08)];
        if (web && i < n - 1) F.rc(g, 0.1, web, w, web[3], w[3]);
        web = w;
      }
      // the flow: away from the face, more and more straight down toward the back
      let wx = HAIR[0] + x - 1.6, wy = HAIR[1] + y - 30.2, wz = z;
      const wl = Math.hypot(wx, wy, wz); wx /= wl; wy /= wl; wz /= wl;
      let gdn = (0.4 - (HAIR[0] + x)) / 1.6; gdn = gdn < 0 ? 0 : gdn > 1 ? 1 : gdn;
      wy -= 1.6 * gdn * gdn;
      let d = wx * nx + wy * ny + wz * nz;
      let tx = wx - d * nx, ty = wy - d * ny, tz = wz - d * nz;
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      // tossed: the lock swings across the flow once to each side, a comma or an S
      const a = (toss + curl * Math.sin(t * 5.2 - 0.6)) * rad, ca = Math.cos(a), sa = Math.sin(a);
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
      const fx = tx * ca + bx * sa, fy = ty * ca + by * sa, fz = tz * ca + bz * sa;
      // step along the surface and bring the direction back onto the unit sphere of the ellipsoid
      const px = x + fx * ds, py = y + fy * ds, pz = z + fz * ds;
      dx = px / HAIR_R[0]; dy = py / HAIR_R[1]; dz = pz / HAIR_R[2];
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    }
  };
  // where the hair ends (degrees down from the top) at each bearing: across the brow, down past the temple and
  // over the top of the ear, then low round the nape
  const edge = (ph) => { const a = Math.abs(ph); return a > 112 ? 132 : 54 + 0.32 * Math.min(a, 95) + (a > 98 ? Math.min(30, (a - 98) * 4) : 0); };
  // the hairline: smaller locks set close, in two tiers: the first rises from the brow and the temples in a crest and
  // is thrown back over the top, the second lies behind it over its gaps
  for (let i = 0; i < 9; i++) {
    const ph = (i - 4) * 17 + j(2.5), sg = i % 2 ? 1 : -1;
    lock(edge(ph) - 2, ph, 1.7 + j(0.2), 0.25 + j(0.02), 0.85 + j(0.1), j(8), sg * (44 + j(8)), CREST);
  }
  for (let i = 0; i < 8; i++) {
    const ph = (i - 3.5) * 19 + j(3), sg = i % 2 ? -1 : 1;
    lock(edge(ph) - 16, ph, 2.0 + j(0.2), 0.27 + j(0.02), 0.8 + j(0.1), j(10), sg * (40 + j(8)), TILE);
  }
  // one lock on each side that falls from the temple over the top of the ear
  for (const s of [1, -1]) lock(72, s * 80, 0.95, 0.24, 0.7, s * -6, s * 20, TILE);
  // rows behind, each lock's root under the tips of the row before, neighbours swinging against each other
  const rows = [[14, 4], [36, 8], [60, 10], [86, 12], [112, 12]];
  for (const [th, n] of rows) {
    const off = rnd();
    for (let i = 0; i < n; i++) {
      let ph = (i + off + j(0.15)) * 360 / n;
      if (ph > 180) ph -= 360;
      const tt = th + j(4);
      if (tt > edge(ph) - (Math.abs(ph) < 80 ? 26 : 9)) continue;
      lock(tt, ph, 2.3 + j(0.3), 0.29 + j(0.025), (th > 95 ? 0.9 : 0.8) + j(0.15), j(20), (i % 2 ? 1 : -1) * (38 + j(12)), TILE);
    }
  }
}

// the rays: twelve slender blades in the plane of the face, evenly spread round the top and sides of the head, rooted
// deep in the curls, leaning a little back, each turned a little differently about its own line so that each answers
// the light in its own way; each shows a dealt length of RAY_MIN to RAY_MAX beyond the curls, no ray like its
// neighbour, and none stands above the ceiling. Plain flat-faced geometry appended to the statue's own buffers.
async function buildRays(tr, out, ctx) {
  let highest = 0;
  const rnd = fixedRng(912), rad = Math.PI / 180, C = [0, 30.75, 0], top = RAY_TOP - SOLE - 0.02;
  let last = 0;
  for (let i = 0; i < RAYS; i++) {
    if (i % 3 === 0) await ctx.yield();
    const beta = ((i - (RAYS - 1) / 2) * 17.6 + (rnd() - 0.5) * 5) * rad, lean = (4 + rnd() * 5) * rad, twist = (rnd() - 0.5) * 50 * rad;
    // the sunburst's own plane: over the brow at the top, back among the curls over the ears
    C[0] = 0.3 - 0.6 * Math.sin(beta) * Math.sin(beta);
    const d = [-Math.sin(lean), Math.cos(beta) * Math.cos(lean), Math.sin(beta) * Math.cos(lean)];
    const hit = tr(C[0] + d[0] * 2.9, C[1] + d[1] * 2.9, C[2] + d[2] * 2.9, -d[0], -d[1], -d[2]);
    const exit = hit ? Math.hypot(hit[0] - C[0], hit[1] - C[1], hit[2] - C[2]) : 1.9;
    // one rule for every ray: it shows a dealt length between RAY_MIN and RAY_MAX beyond the curls it stands in, never
    // within 0.22 m of its neighbour's, and no tip stands above the ceiling
    let len = RAY_MIN + rnd() * (RAY_MAX - RAY_MIN);
    if (Math.abs(len - last) < 0.22) len = len > (RAY_MIN + RAY_MAX) / 2 ? len - 0.3 : len + 0.3;
    len = Math.max(RAY_MIN, Math.min(RAY_MAX, len));
    if (d[1] > 0) len = Math.min(len, (top - C[1]) / d[1] - exit);
    last = len;
    highest = Math.max(highest, SOLE + C[1] + d[1] * (exit + len));
    // across the blade (in the sunburst's plane, then twisted about the ray) and through it
    let wx = 0, wy = -Math.sin(beta), wz = Math.cos(beta);
    let tx = d[1] * wz - d[2] * wy, ty = d[2] * wx - d[0] * wz, tz = d[0] * wy - d[1] * wx;
    const ct = Math.cos(twist), sn = Math.sin(twist), ax = wx * ct + tx * sn, ay = wy * ct + ty * sn, az = wz * ct + tz * sn;
    tx = d[1] * az - d[2] * ay; ty = d[2] * ax - d[0] * az; tz = d[0] * ay - d[1] * ax;
    const w0 = 0.15 + rnd() * 0.03, rings = [[exit - 0.75, w0], [exit + len * 0.45, w0 * 0.6], [exit + len, 0.012]];
    for (let r = 0; r + 1 < rings.length; r++) {
      const [ra, wa] = rings[r], [rb, wb] = rings[r + 1];
      // four faces between two rhombic sections: corners at +across, +through, -across, -through
      const corner = (rr, w, q) => { const a = q === 0 ? w : q === 2 ? -w : 0, t = (q === 1 ? w : q === 3 ? -w : 0) * 0.42; return [C[0] + d[0] * rr + ax * a + tx * t, C[1] + SOLE + d[1] * rr + ay * a + ty * t, C[2] + d[2] * rr + az * a + tz * t]; };
      for (let q = 0; q < 4; q++) {
        const p0 = corner(ra, wa, q), p1 = corner(ra, wa, (q + 1) % 4), p2 = corner(rb, wb, (q + 1) % 4), p3 = corner(rb, wb, q);
        let nx = (p1[1] - p0[1]) * (p3[2] - p0[2]) - (p1[2] - p0[2]) * (p3[1] - p0[1]), ny = (p1[2] - p0[2]) * (p3[0] - p0[0]) - (p1[0] - p0[0]) * (p3[2] - p0[2]), nz = (p1[0] - p0[0]) * (p3[1] - p0[1]) - (p1[1] - p0[1]) * (p3[0] - p0[0]);
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        // outward: away from the ray's own line
        const mx = (p0[0] + p1[0]) / 2 - (C[0] + d[0] * ra), my = (p0[1] + p1[1]) / 2 - (C[1] + SOLE + d[1] * ra), mz = (p0[2] + p1[2]) / 2 - (C[2] + d[2] * ra);
        const flip = nx * mx + ny * my + nz * mz < 0;
        if (flip) { nx = -nx; ny = -ny; nz = -nz; }
        growOut(out, 4, 6);
        const b = out.nv, I = out.ni, idx = out.idx;
        for (const p of [p0, p1, p2, p3]) { const P = out.nv * 3, O = out.nv * 2; out.pos[P] = p[0]; out.pos[P + 1] = p[1]; out.pos[P + 2] = p[2]; out.nor[P] = nx; out.nor[P + 1] = ny; out.nor[P + 2] = nz; out.occ[O] = 0; out.occ[O + 1] = r === 0 ? 0.5 : 0; out.nv++; }
        idx[I] = b; idx[I + 3] = b;
        if (flip) { idx[I + 1] = b + 2; idx[I + 2] = b + 1; idx[I + 4] = b + 3; idx[I + 5] = b + 2; } else { idx[I + 1] = b + 1; idx[I + 2] = b + 2; idx[I + 4] = b + 2; idx[I + 5] = b + 3; }
        out.ni += 6;
      }
    }
  }
  return Math.round(highest * 1000) / 1000;
}

// ---- the base: three steps and a plain block with a foot and a crown moulding, as boxes in one geometry ----
const BLOCK_X = BASE_X - STEPS * 2 * STEP_TREAD, BLOCK_Z = BASE_Z - STEPS * 2 * STEP_TREAD;
// The block's foot and crown are mouldings swept round it (a profile of offsets from the block's face and heights:
// a plinth band, a torus and a hollow below; a hollow, a fascia and a small crowning roll above); between them the
// die's faces are plain laid marble. Nothing is cut or lettered on it.
const DIE_Y0 = STEPS * STEP_H + 0.68, DIE_Y1 = SOLE - 0.5;
function buildBase() {
  const pos = [], nor = [];
  // a quad given its four corners and their normals, wound to face along its first normal
  const quad = (a, b, c, d, na, nb = na, nc = na, nd = na) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const out = (uy * vz - uz * vy) * na[0] + (uz * vx - ux * vz) * na[1] + (ux * vy - uy * vx) * na[2] > 0;
    const P = out ? [a, b, c, a, c, d] : [a, c, b, a, d, c], N = out ? [na, nb, nc, na, nc, nd] : [na, nc, nb, na, nd, nc];
    for (let i = 0; i < 6; i++) { pos.push(P[i][0], P[i][1], P[i][2]); nor.push(N[i][0], N[i][1], N[i][2]); }
  };
  // the four sides of a band round the rectangle (half sizes hx, hz): from offset d0 at height y0 to d1 at y1, with
  // the normal's outward and upward parts at each edge (mitred at the corners)
  const band = (hx, hz, d0, y0, d1, y1, n0, n1) => {
    for (const [ax, sg] of [[0, 1], [0, -1], [2, 1], [2, -1]]) {
      const at = (d, y, t) => (ax === 0 ? [sg * (hx + d), y, t * (hz + d)] : [t * (hx + d), y, sg * (hz + d)]);
      const nn = (n) => (ax === 0 ? [sg * n[0], n[1], 0] : [0, n[1], sg * n[0]]);
      quad(at(d0, y0, -1), at(d0, y0, 1), at(d1, y1, 1), at(d1, y1, -1), nn(n0), nn(n0), nn(n1), nn(n1));
    }
  };
  const top = (hx, hz, y) => quad([-hx, y, hz], [hx, y, hz], [hx, y, -hz], [-hx, y, -hz], [0, 1, 0]);
  for (let i = 0; i < STEPS; i++) {
    const hx = BASE_X / 2 - i * STEP_TREAD, hz = BASE_Z / 2 - i * STEP_TREAD;
    band(hx, hz, 0, i * STEP_H, 0, (i + 1) * STEP_H, [1, 0], [1, 0]);
    top(hx, hz, (i + 1) * STEP_H);
  }
  const y0 = STEPS * STEP_H, hx = BLOCK_X / 2, hz = BLOCK_Z / 2;
  // a profile: points [offset, height, round]; a round point shares one normal between the two faces that meet there
  const sweep = (pr) => {
    const seg = [];
    for (let i = 0; i + 1 < pr.length; i++) { const dd = pr[i + 1][0] - pr[i][0], dy = pr[i + 1][1] - pr[i][1], l = Math.hypot(dd, dy) || 1; seg.push([dy / l, -dd / l]); }
    const at = (i, k) => { const m = seg[k], o = pr[i][2] ? seg[i === k ? k - 1 : k + 1] : null; if (!o) return m; const x = m[0] + o[0], y = m[1] + o[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let i = 0; i + 1 < pr.length; i++) band(hx, hz, pr[i][0], pr[i][1], pr[i + 1][0], pr[i + 1][1], at(i, i), at(i + 1, i));
  };
  sweep([[0.17, y0], [0.17, y0 + 0.27], [0.14, y0 + 0.3], [0.165, y0 + 0.36, 1], [0.15, y0 + 0.43, 1], [0.1, y0 + 0.47], [0.07, y0 + 0.49], [0.045, y0 + 0.54, 1], [0.015, y0 + 0.6, 1], [0, DIE_Y0]]);
  sweep([[0, DIE_Y1], [0.015, DIE_Y1 + 0.07, 1], [0.05, DIE_Y1 + 0.13, 1], [0.1, DIE_Y1 + 0.17], [0.13, DIE_Y1 + 0.19], [0.16, DIE_Y1 + 0.21], [0.16, SOLE - 0.1], [0.185, SOLE - 0.08], [0.19, SOLE - 0.04, 1], [0.165, SOLE]]);
  top(hx + 0.165, hz + 0.165, SOLE);
  // the die's four faces: plain laid marble (its upright joints are drawn by the material)
  band(hx, hz, 0, DIE_Y0, 0, DIE_Y1, [1, 0], [1, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
  geo.computeBoundingSphere(); geo.computeBoundingBox();
  return geo;
}

// white marble: courses and block joints, faint veining, a little shade where a step meets the next and under the feet
function marbleMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: '#e7e3d9', roughness: 0.62, metalness: 0 });
  // (BROUGHT IN, see the head: mbHash, in the fragment program's text below. This comment stands outside that text
  // and outside onBeforeCompile, whose own text is the key the program is kept by.)
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMbP; varying vec3 vMbN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMbP = position; vMbN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vMbP; varying vec3 vMbN;
float mbHash(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float mbNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(mbHash(i), mbHash(i + vec3(1., 0., 0.)), f.x), mix(mbHash(i + vec3(0., 1., 0.)), mbHash(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(mbHash(i + vec3(0., 0., 1.)), mbHash(i + vec3(1., 0., 1.)), f.x), mix(mbHash(i + vec3(0., 1., 1.)), mbHash(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float mbLine(float d, float w, float fw){ fw = max(fw, 1e-4); return (1. - smoothstep(w, w + fw, abs(d))) * clamp(w * 2.5 / fw, 0., 1.); }
float mbSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); return length(pa - ba * h); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 q = vMbP; vec3 an = abs(vMbN);
  float topF = step(0.5, an.y);
  // along the face: z on the fronts, x on the flanks. The steps and the mouldings are courses of ${STEP_H.toFixed(1)} m in blocks
  // of 1.9 m; the block between its mouldings is one course of tall slabs (six on the fronts, five on the flanks)
  float flank = step(0.5, an.z);
  float along = mix(q.z, q.x, flank);
  float onBlock = step(${DIE_Y0.toFixed(2)}, q.y) * (1. - step(${DIE_Y1.toFixed(2)}, q.y));
  float row = mix(floor(q.y / ${STEP_H.toFixed(2)} + 0.001), 20., onBlock);
  float len = mix(1.9, mix(${(BLOCK_Z / 6).toFixed(4)}, ${(BLOCK_X / 5).toFixed(4)}, flank), onBlock);
  float u = along / len + mix(0.5 * mod(row, 2.) + 0.25, 0.5 * flank, onBlock);
  float fwU = fwidth(u) * len, fwY = fwidth(q.y), fwT = max(fwidth(q.x), fwidth(q.z));
  float jv = mbLine((fract(u) - 0.5) * len, 0.006, fwU) * (1. - topF);
  float jh = 0.;
  // the treads and the top are slabs
  vec2 sl = q.xz / vec2(1.7, 1.525) + 0.5;
  float jt = max(mbLine((fract(sl.x) - 0.5) * 1.7, 0.006, fwT), mbLine((fract(sl.y) - 0.5) * 1.525, 0.006, fwT)) * topF;
  float joint = max(max(jv, jh), jt);
  // veining: a few soft grey streaks, and a faint tone from slab to slab
  vec3 vp = q * vec3(0.55, 1.3, 0.55) + vec3(0., 0., 2.7 * mbNoise(q * 0.35));
  float vein = smoothstep(0.46, 0.5, mbNoise(vp)) * (1. - smoothstep(0.5, 0.56, mbNoise(vp)));
  float tone = mbHash(vec3(floor(u), row, floor(an.z * 2. + an.y * 4.)) + floor(vec3(sl.x, 7., sl.y)) * topF);
  diffuseColor.rgb *= (1. - 0.3 * joint) * (1. - 0.09 * vein) * (0.955 + 0.06 * tone);
  // shade: at the foot of each riser, on a tread beside the next riser, and under and round the feet
  float lvl = floor(q.y / ${STEP_H.toFixed(2)} + 0.5);
  vec2 inner = vec2(${(BASE_X / 2).toFixed(2)}, ${(BASE_Z / 2).toFixed(2)}) - ${STEP_TREAD.toFixed(2)} * lvl;
  float dIn = max(abs(q.x) - inner.x, abs(q.z) - inner.y);
  float tread = topF * (1. - step(${(STEPS * STEP_H + 0.1).toFixed(2)}, q.y));
  float sh = tread * (1. - smoothstep(0.0, 0.3, dIn)) * 0.22;
  float fy = q.y - ${STEP_H.toFixed(2)} * floor(q.y / ${STEP_H.toFixed(2)} + 0.001);
  sh += (1. - topF) * (1. - step(${(STEPS * STEP_H + 0.01).toFixed(2)}, q.y)) * (1. - smoothstep(0.0, 0.14, fy)) * 0.14;
  // under the crown moulding, and where the block's face meets its foot
  sh += (1. - topF) * onBlock * ((1. - smoothstep(0., 0.28, ${DIE_Y1.toFixed(2)} - q.y)) * 0.17 + (1. - smoothstep(0., 0.16, q.y - ${DIE_Y0.toFixed(2)})) * 0.08);
  float feet = topF * step(${(SOLE - 0.01).toFixed(2)}, q.y);
  float dF = min(mbSeg(vec2(q.x, abs(q.z)), vec2(-0.85, 1.13), vec2(1.9, 1.16)) - 0.9, mbSeg(vec2(q.x, abs(q.z)), vec2(1.9, 1.16), vec2(2.75, 1.0)) - 0.75);
  sh += feet * 0.5 * (1. - smoothstep(-0.1, 0.85, dF));
  diffuseColor.rgb *= 1. - sh;
}`);
  };
  return m;
}

// tended bronze: a metal that answers the sun (the world's own light) and the sky. Where the world gives no
// environment map, the sky is written here as a term of the shader: zenith, horizon haze, the brighter sky round
// the sun, and the pale court below, read along the reflected ray. It is a reflection only: nothing is emitted.
// It is drawn two sided: where a lock is thinner than the grid's cell, or two lids meet in a sharp corner, the skin has
// pin holes; through a one sided skin the sky would show in them as bright dots, so the skin's inner side is drawn
// too, as a plain deep bronze.
const FUR_LEAN = 0.5;   // how much of a furrow's slope the shader's normal takes (the mesh carries the rest)
// THE BRONZE'S LIGHT, its numbers in one place. It is one law for every view: each term reads the skin's normal, the sun's
// direction, the eye's direction and the form's own closure, and nothing else (no place, no distance, no clock).
//  lit0, lit1  between which cosines of the angle to the sun a plane goes from turned-from-the-sun to facing-it
//  spec     how much of the renderer's own narrow highlight is kept (a soft sheen, never a glint)
//  dif      how much of the sun's light the skin scatters evenly (a metal scatters little)
//  wb, wbShade  how much of the sun's colour the bronze takes out of what it gives back (1: all of it, a grey light):
//           on a plane that faces the sun (it keeps more of the sun's gold than the old law's 0.82 let it) and on one turned from it
//  sunB, sunP  the sun's broad light on a rubbed metal: its strength, and how fast it falls as a plane turns from the sun
//           (this is what models him: chest, belly, the limbs' masses read by tone)
//  a6, p6, tight  the sheen that travels with the eye: the sun's soft band where the mirrored ray comes near the sun
//           (strength, tightness; tight: how much tighter it is on the worn standing forms: knuckles, kneecaps, toes, locks)
//  sky      how much of its surroundings the metal mirrors; cool, tintShade: how far a plane turned from the sun, or in a
//           cast shade, goes to the open sky's own colour, and how much less of the metal's colour that sky light takes
//  occ, cav how much of the sky a hollow shuts out by its own closure (the corners' measure of the form; a furrow's depth)
//  pol      how much smoother the worn standing forms are
//  rim      the light along a form's edge where it turns toward the sun and away from the eye (as it was)
//  knee, ceil  the soft ceiling, as it was: from knee upward the light is eased toward ceil and never reaches it
//           (ceil 0.70 is under the world's glow threshold of 0.92 by the law itself, whatever the sun)
const LIGHT = { lit0: 0.1, lit1: 0.8, spec: 0.35, dif: 0.5, wb: 0.5, wbShade: 0.9, sunB: 0.9, sunP: 4, a6: 1.6, p6: 6, tight: 2, sky: 0.36, cool: 0.9, tintShade: 0.85, occ: 0.6, cav: 0.5, pol: 0.14, rim: 0.5, knee: 0.34, ceil: 0.7 };
// (a milder strength of the same law, kept beside the part as a whole file: the same terms, each number nearer to the old law's)
// LIGHT_MILD = { lit0: 0, lit1: 0.7, spec: 0.6, dif: 0.75, wb: 0.66, wbShade: 0.86, sunB: 0.5, sunP: 3, a6: 1.0, p6: 6, tight: 2, sky: 0.45, cool: 0.6, tintShade: 0.6, occ: 0.4, cav: 0.35, pol: 0.1, rim: 0.5, knee: 0.34, ceil: 0.7 };
function bronzeMaterial(opts, K) {
  const L = { ...LIGHT };
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.45, metalness: 0.8, side: THREE.DoubleSide });
  const col = (v, d) => (v && v.isColor ? v.clone() : new THREE.Color(v || d));
  const sun = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(0.927 * Math.cos(0.3), Math.sin(0.3), -0.375 * Math.cos(0.3))).normalize();
  const U = {
    uCoSun: { value: sun }, uCoSunCol: { value: col(opts.sunColor, '#fff0d8') },
    uCoZen: { value: col(opts.skyZenith, '#2f66b8') }, uCoHor: { value: col(opts.skyHorizon, '#cfdcea') }, uCoGnd: { value: col(opts.groundColor, '#b9ae9a') },
    uCoEnv: { value: opts.envMap ? 0 : 1 },
  };
  if (opts.envMap) { m.envMap = opts.envMap; m.envMapIntensity = 1; }
  const f3 = (v) => v.toFixed(3), slots = Array.from({ length: K }, (_, k) => k);
  const HOL = new THREE.Color(TAN).sub(new THREE.Color(HOLLOW)).toArray();
  const TAN_G = new THREE.Color(TAN).g, WORN_G = new THREE.Color(WORN).g, g = (v) => v.toFixed(3);
  // the toes' nails: each a small plate on the toe's end (its middle in x and z, its half length and half width)
  const NAIL = TOE_Z.map((z, t) => { const r = TOE_R[t], x1 = HEEL_X + FOOT + 0.032 - TOE_BACK[t] - r; return `vec4(${f3(x1 + (0.5 * r - 0.16) / 2)}, ${f3(z)}, ${f3((0.5 * r + 0.16) / 2)}, ${f3(0.58 * r)})`; });
  // (BROUGHT IN, see the head: coHash, in the fragment program's text below. This comment stands outside that text
  // and outside onBeforeCompile, whose own text is the key the program is kept by.)
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCoP, vCoN; varying float vCoUp;' + slots.map((k) => `\nattribute vec4 coF${k}; varying vec4 vCoF${k};`).join(''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoP = position; vCoN = normal; vCoUp = normal.y;' + slots.map((k) => `\nvCoF${k} = coF${k} * vec4(4., 4., 4., 1.);`).join(''));
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vCoP, vCoN; varying float vCoUp;
uniform vec3 uCoSun, uCoSunCol, uCoZen, uCoHor, uCoGnd; uniform float uCoEnv;
uniform mat3 normalMatrix;
const float FUR_LEAN = ${FUR_LEAN.toFixed(2)};
${slots.map((k) => `varying vec4 vCoF${k};`).join(' ')}
// one furrow at a place: f is the way from its line to here in half widths (xyz) and its depth over its half width (w),
// as the skin's corners carry them. A furrow is a valley with a sharp bottom, its sides falling as a parabola from its
// edge to its line; one narrower than the picture's own grain flattens out. To g goes its slope across the skin (pointing
// away from the line), to cav its depth here.
void coFurrow(vec4 f, inout vec3 g, inout float cav) {
  float t = length(f.xyz), a = f.w * (1. - smoothstep(0.35, 1., max(length(dFdx(f.xyz)), length(dFdy(f.xyz)))));
  if (t >= 1. || a <= 0.) return;
  float q = 1. - t;
  g += f.xyz * (FUR_LEAN * a * 2. * q * smoothstep(0., 0.35, t) / max(t, 1e-4));
  cav += a * q * q;
}
// a toe's nail (its middle in x and z, half length, half width) at a place q of the foot's top
void coNailAt(vec4 n, vec2 q, float px, inout float nail, inout float rim) {
  vec2 e = abs(q - n.xy) - n.zw + 0.06;
  float d = length(max(e, 0.)) + min(max(e.x, e.y), 0.) - 0.06;
  // (the pixel's footprint is nought where the place does not change from one pixel to the next: held off nought here)
  float pg = max(px, 1e-4);
  nail = max(nail, clamp(0.5 - d / pg, 0., 1.));
  rim = max(rim, clamp((0.02 + 0.5 * px - abs(d)) / pg, 0., 1.) * min(1., 0.04 / pg));
}
float coHash(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float coNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(coHash(i), coHash(i + vec3(1., 0., 0.)), f.x), mix(coHash(i + vec3(0., 1., 0.)), coHash(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(coHash(i + vec3(0., 0., 1.)), coHash(i + vec3(1., 0., 1.)), f.x), mix(coHash(i + vec3(0., 1., 1.)), coHash(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float coPx = max(length(dFdx(vCoP)), length(dFdy(vCoP)));
vec3 coFg = vec3(0.); float coFc = 0.;
${slots.map((k) => `coFurrow(vCoF${k}, coFg, coFc);`).join(' ')}
float coCav = clamp(coFc * 1.76, 0., 1.);
// how worn the place is (the corners' colour is yellower and lighter there)
float coWear = clamp((vColor.g - ${TAN_G.toFixed(3)}) / ${(WORN_G - TAN_G).toFixed(3)}, 0., 1.);
// within a course the faint flow of the metal (level streaks a hand apart) and the chaser's fine work, each thinned as the
// picture's own grain outgrows it
// (the head is one piece and keeps its own plain finish: none of this above the neck)
float coBody = 1. - smoothstep(${(SOLE + 27.7).toFixed(2)}, ${(SOLE + 28.3).toFixed(2)}, vCoP.y);
float coFlow = (coNoise(vCoP * vec3(0.9, 7., 0.9) + 5.) - 0.5) * (1. - smoothstep(0.04, 0.09, coPx)) * coBody;
float coChase = (coNoise(vCoP * 16.) - 0.5) * (1. - smoothstep(0.018, 0.04, coPx)) * coBody;
// from far, where a pixel is wider than a hollow, the hollows' deep tone is eased (it would only speckle the figure)
diffuseColor.rgb += vec3(${HOL.map((v) => v.toFixed(4)).join(', ')}) * (vColor.a * 0.7 * smoothstep(0.12, 0.3, coPx) * coBody);
// the hand that tends it leaves no two plates quite alike: a broad slow change of tone and of polish
float coTone = 0.6 * coNoise(vCoP * 0.42 + 3.1) + 0.4 * coNoise(vCoP * 1.7 + 11.);
// cast in courses: a faint level joint about every 2.4 m from the neck down (the head is one piece), a hair's width
// of darker metal that thins only as the picture's own grain outgrows it, and a slight change of tone from course
// to course (a patched, tended bronze)
float coCourse = 0.5, coPol = 0.5, coJoint = 0.;
{
  float h = vCoP.y - 4.0 + 0.03 * (coNoise(vCoP * vec3(0.7, 0.2, 0.7)) - 0.5);
  float cy = (h - 27.3) / 2.4 + 12.;
  coCourse = coHash(vec3(floor(cy), 3.7, 9.1)); coPol = coHash(vec3(floor(cy), 1.3, 5.7));
  float sl = sqrt(max(0.06, 1. - vCoUp * vCoUp));
  float d = (0.5 - abs(fract(cy) - 0.5)) * 2.4 / sl, fw = max(fwidth(vCoP.y) / sl, 1e-4), w = 0.03;
  coJoint = clamp((min(d + 0.5 * fw, w) - max(d - 0.5 * fw, -w)) / fw, 0., 1.) * step(h, 27.6);
  // faces that look down are darker and redder (the polisher's hand and the rain reach them least)
  float under = 1. - smoothstep(-0.95, -0.15, vCoUp);
  diffuseColor.rgb *= (vec3(0.9, 0.88, 0.86) + vec3(0.2, 0.24, 0.28) * coTone) * mix(vec3(1.), vec3(0.9, 0.85, 0.82), under);
  // from course to course a slight change of tone and of hue (no two pourings alike)
  diffuseColor.rgb *= mix(vec3(0.955 + 0.09 * coCourse), (0.93 + 0.14 * coCourse) * mix(vec3(1.03, 1., 0.95), vec3(0.98, 1., 1.04), coPol), coBody) * (1. - 0.32 * coJoint);
  // a furrow's bottom is deeper and redder (the cloth and the rain reach it least)
  diffuseColor.rgb *= mix(vec3(1.), vec3(0.66, 0.52, 0.44), coCav) * (1. + 0.07 * coFlow);
}
// the toes' nails: on each toe's end a small plate, a little more polished than the skin, with a fine dark line round it
float coNail = 0.;
if (vCoP.y < ${(SOLE + 0.8).toFixed(2)} && vCoP.x > 2.) {
  float rim = 0.;
  ${NAIL.map((n) => `coNailAt(${n}, vec2(vCoP.x, abs(vCoP.z)), coPx, coNail, rim);`).join(' ')}
  float up = smoothstep(0.3, 0.55, vCoUp);
  coNail *= up;
  diffuseColor.rgb *= mix(vec3(1.), vec3(1.1, 1.08, 1.0), coNail) * (1. - 0.4 * rim * up);
}
// the hair's strands: along each lock fine grooves between strand and strand. A lock is a round back lying on the
// head: across it the skin's normal turns away from the head's own outward line, along it it does not; so the angle
// between the two, counted in strands, runs round each lock and is the same all along it. Only above the hairline
// (the hair's own rule: degrees down from the top at each bearing; not on the rays), not round under a lock, and thinned as the
// picture's own grain outgrows it (by the pixel's footprint, not by distance)
vec3 coHq = (vCoP - vec3(${HAIR[0].toFixed(3)}, ${(HAIR[1] + SOLE).toFixed(3)}, ${HAIR[2].toFixed(3)})) / vec3(${HAIR_R.map((v) => v.toFixed(3)).join(', ')});
vec3 coHd = normalize(coHq);
// (on the hair's own upright line both parts of the bearing are nought: there it is read as straight ahead)
float coHt = degrees(acos(clamp(coHd.y, -1., 1.))), coHp = abs(degrees(atan(coHd.z, coHd.x + step(abs(coHd.x) + abs(coHd.z), 0.))));
float coHe = coHp > 112. ? 132. : 54. + 0.32 * min(coHp, 95.) + (coHp > 98. ? min(30., (coHp - 98.) * 4.) : 0.);
float coHa = acos(clamp(dot(normalize(vCoN), normalize(coHd / vec3(${HAIR_R.map((v) => v.toFixed(3)).join(', ')}))), -1., 1.));
float coSu = coHa * 1.75 + 0.5 * (coNoise(vCoP * 2.5) - 0.5);
float coSw = (1. - smoothstep(coHe - 2., coHe + 5., coHt)) * smoothstep(0.9, 0.98, length(coHq)) * (1. - smoothstep(1.3, 1.4, length(coHq))) * (1. - smoothstep(1.45, 2.0, coHa)) * (1. - smoothstep(0.3, 0.62, fwidth(coSu)));
float coSg = 0.5 + 0.5 * cos(6.2832 * coSu);
diffuseColor.rgb *= 1. - 0.4 * coSw * (1. - coSg) * (1. - coSg);
// the hair a touch darker than the skin, the rays half as much, so that the head is found from far
diffuseColor.rgb *= mix(vec3(1.), vec3(0.85, 0.81, 0.77), (1. - smoothstep(coHe - 2., coHe + 5., coHt)) * smoothstep(0.9, 0.98, length(coHq)) * (1. - 0.5 * smoothstep(1.3, 1.45, length(coHq))));`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  // a furrow's sides lean toward its line
  vec3 coNo = normalize(vCoN);
  normal = normalize(normal - normalMatrix * (coFg - coNo * dot(coFg, coNo)));
}
{
  // each strand a low round back: the normal leans by the slope of that small height
  float coH = 0.021 * coSw * coSg;
  vec3 coDx = dFdx(-vViewPosition), coDy = dFdy(-vViewPosition);
  vec3 coR1 = cross(coDy, normal), coR2 = cross(normal, coDx);
  float coDet = dot(coDx, coR1);
  vec3 coGr = sign(coDet) * (dFdx(coH) * coR1 + dFdy(coH) * coR2);
  // (edge on, the face has no breadth in the picture and this vector is nought: the normal then stays as it is)
  vec3 coNb = abs(coDet) * normal - coGr;
  if (dot(coNb, coNb) > 1e-24) normal = normalize(coNb);
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (coTone - 0.5) * 0.22 + mix((coCourse - 0.5) * 0.05, (coPol - 0.5) * 0.12, coBody) + 0.2 * coJoint + 0.25 * coCav + 0.09 * coFlow + 0.1 * coChase - 0.12 * coNail - ${g(L.pol)} * coWear, 0.08, 1.);`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
{
  vec3 coN = inverseTransformDirection(geometryNormal, viewMatrix);
  vec3 coV = inverseTransformDirection(geometryViewDir, viewMatrix);
  vec3 coR = reflect(-coV, coN);
  float coUp = coR.y, coRo = material.roughness;
  vec3 coW = vec3(0.3, 0.6, 0.1);
  float coDD = dot(reflectedLight.directDiffuse, coW);
  float coNL = dot(coN, uCoSun);
  // is this place in the sun? What the world's own sun left here as direct light tells it, cast shadows and all
  float coSh = smoothstep(0.15, 0.7, coDD / max(1e-5, dot(material.diffuseColor * uCoSunCol, vec3(0.3, 0.6, 0.1)) * max(coNL, 0.03)));
  float coShR = mix(1., coSh, smoothstep(0.02, 0.12, coNL));
  // how far the place is turned to the sun and stands in its light (nought: turned from it, or in a cast shade)
  float coLit = smoothstep(${g(L.lit0)}, ${g(L.lit1)}, coNL) * coShR;
  // a low gold sun on a red metal goes to orange, which reads as gilding: the bronze takes a good part of the
  // sun's colour out of what it gives back, and mirrors the warm haze low in the sky a little cooler than it is
  vec3 coWB = mix(vec3(1.), vec3(dot(uCoSunCol, coW)) / max(uCoSunCol, vec3(1e-3)), mix(${g(L.wbShade)}, ${g(L.wb)}, coLit));
  vec3 coSunC = uCoSunCol * coWB;
  reflectedLight.directDiffuse *= coWB * ${g(L.dif)}; reflectedLight.directSpecular *= coWB * ${g(L.spec)};
  vec3 coHor = mix(uCoHor, dot(uCoHor, coW) * vec3(0.93, 0.98, 1.07), 0.4);
  vec3 coSky = mix(coHor, uCoZen, 0.62 * sqrt(clamp(coUp, 0., 1.)));
  // below the horizon: haze, then the pale court and the marble under it, with the sea's and the sky's blue in them
  vec3 coPale = 0.55 * mix(uCoGnd, vec3(dot(uCoGnd, vec3(0.3, 0.6, 0.1))), 0.85) * 1.15 + 0.45 * 0.75 * mix(coHor, uCoZen, 0.3);
  vec3 coLow = mix(coHor * 0.8, coPale, smoothstep(0., 0.9, -coUp));
  vec3 coEnv = mix(coLow, coSky, smoothstep(-0.25 - 0.7 * coRo, 0.15 + 0.5 * coRo, coUp));
  // a rubbed metal sees its whole surroundings at once: half of what it shows is their mean
  coEnv = mix(0.5 * (uCoGnd * 0.55 + mix(coHor, uCoZen, 0.6)), coEnv, 0.55);
  // a plane turned from the sun, or in a cast shade, is lit by the open sky alone: what it mirrors goes toward
  // the sky's own blue (a bronze in morning shade takes the sky's colour), as bright as it was
  vec3 coBlue = mix(uCoZen, coHor, 0.35);
  coEnv = mix(coEnv, coBlue * (dot(coEnv, coW) / max(dot(coBlue, coW), 1e-3)), ${g(L.cool)} * (1. - coLit));
  // the sheen that travels with the eye: the sun's soft band where the mirrored ray comes near it (broad on a large
  // form, small on a small one by the form's own turning; tighter on the worn standing forms); not in a cast shade
  // and not on a plane the sun does not reach
  float coS = clamp(dot(coR, uCoSun), 0., 1.);
  vec3 coSheen = coSunC * (${g(L.a6)} * pow(coS, ${g(L.p6)} * (1. + ${g(L.tight)} * coWear)) * coShR * smoothstep(0., 0.2, coNL));
  float coNV = clamp(dot(coN, coV), 0., 1.);
  float coF = 1. - coNV; coF = coF * coF * coF * coF * coF;
  // what the metal gives back of its surroundings is a little less coloured than what it gives back of the sun,
  // and less again where the sky alone lights it
  float coGrey = dot(material.specularColor, vec3(0.3, 0.6, 0.1));
  vec3 coTint = mix(material.specularColor, vec3(coGrey), mix(${g(L.tintShade)}, 0.12, coLit));
  vec3 coTintS = mix(material.specularColor, vec3(coGrey), 0.12);
  float coFr = coF * (1. - 0.7 * coRo);
  // the hollows hold shade: a hollow shuts out a part of the sky by its own closure (the corners' measure of how
  // closed the form is there, eased where the picture's grain is too coarse to draw it; a furrow's own depth)
  float coOcc = (1. - ${g(L.occ)} * vColor.a * (1. - 0.6 * smoothstep(0.12, 0.3, coPx))) * (1. - ${g(L.cav)} * coCav);
  // (the side turned from the sun is deep: the sun's light is gone from it, and what it mirrors is the sky alone)
  reflectedLight.indirectSpecular += uCoEnv * (${g(L.sky)} * coEnv * (coTint + (vec3(1.) - coTint) * coFr) * coOcc + coSheen * (coTintS + (vec3(1.) - coTintS) * coFr));
  reflectedLight.indirectDiffuse *= coOcc;
  // the sun's broad light on a rubbed metal: strongest on the planes that face it, falling as they turn from it
  reflectedLight.directSpecular += coSunC * material.specularColor * (${g(L.sunB)} * pow(max(coNL, 0.), ${g(L.sunP)}) * coShR);
  // the rim: where a form turns toward the sun and away from the eye the metal lights up a little along its edge,
  // in its own colour
  float coRim = coF / max(1e-3, 1. - coNV) / max(1e-3, 1. - coNV);
  reflectedLight.directSpecular += coSunC * material.specularColor * (${g(L.rim)} * coRim) * smoothstep(-0.05, 0.4, coNL) * coShR;
  // a soft sheen, never a glint: what the bronze gives back is eased under a ceiling well below white (the world's
  // glow begins at 0.92), in its own hue
  vec3 coTot = reflectedLight.directDiffuse + reflectedLight.directSpecular + reflectedLight.indirectDiffuse + reflectedLight.indirectSpecular;
  float coL = max(dot(coTot, coW), 1e-4);
  float coK = coL < ${g(L.knee)} ? 1. : (${g(L.knee)} + ${g(L.ceil - L.knee)} * (1. - exp(-(coL - ${g(L.knee)}) / ${g(L.ceil - L.knee)}))) / coL;
  reflectedLight.directDiffuse *= coK; reflectedLight.directSpecular *= coK; reflectedLight.indirectDiffuse *= coK; reflectedLight.indirectSpecular *= coK;
  // the skin's inner side (seen only through a pin hole, or under a skin's free edge): a plain deep bronze
  if (!gl_FrontFacing) { reflectedLight.directDiffuse = vec3(0.26, 0.16, 0.085); reflectedLight.directSpecular = vec3(0.); reflectedLight.indirectDiffuse = vec3(0.); reflectedLight.indirectSpecular = vec3(0.); }
}`);
  };
  return m;
}

// colours: golden tan on the open forms, deeper and redder in the hollows, brighter and yellower where the metal is
// worn: on small standing forms (toes, knuckles, kneecaps, the nose, the ridges of the locks) and on the high
// places a hand or the weather reaches first (WEAR: kneecaps, toes, the chest's fullest part, the shoulders' caps, the
// brow, the nose; each [x, y, z of the right half, reach])
const TAN = '#b79a79', HOLLOW = '#74492f', WORN = '#d9bd8a', HEAD_HOLLOW = '#79533b', HEAD_WORN = '#d2b78e';
const WEAR = [[1.42, SOLE + KNEE, KNEE_Z, 0.85], [2.75, SOLE + 0.35, 1.25, 1.0], [2.7, SOLE + 24.7, 1.5, 1.4], [0.2, SOLE + 26.6, 3.9, 1.3], [1.6, SOLE + 30.95, 0.4, 0.45], [1.95, SOLE + 30.3, 0, 0.55]];
// (from corner i0 up to i1, into col)
function colours(out, col, i0, i1) {
  const occ = out.occ, pos = out.pos;
  const hi = new THREE.Color(TAN), lo = new THREE.Color(HOLLOW), wo = new THREE.Color(WORN), lh = new THREE.Color(HEAD_HOLLOW), wh = new THREE.Color(HEAD_WORN);
  const r0 = 255 * hi.r, g0 = 255 * hi.g, b0 = 255 * hi.b;
  for (let i = i0; i < i1; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2] < 0 ? -pos[i * 3 + 2] : pos[i * 3 + 2];
    // (the head from the chin up keeps its own lighter hollows: a face is not drawn with lines)
    let hd = (y - SOLE - 27.9) / 0.6; hd = hd < 0 ? 0 : hd > 1 ? 1 : hd;
    // small hollows from 0.7 to 4 (1/m) strongly, wide ones from 0.3 to 1 lightly, each a smooth step
    const o = occ[i * 2];
    let t = (o - 0.7) / 3.3, u = (occ[i * 2 + 1] - 0.3) / 0.7;
    t = t < 0 ? 0 : t > 1 ? 1 : t; u = u < 0 ? 0 : u > 1 ? 1 : u;
    let a = (0.7 - 0.08 * hd) * t * t * (3 - 2 * t) + (0.42 - 0.12 * hd) * u * u * (3 - 2 * u);
    if (a > 1) a = 1;
    // wear: standing forms from 0.9 to 3 (1/m), and the high places a hand or the weather reaches first
    let w = (-o - 0.9) / 2.1; w = w < 0 ? 0 : w > 1 ? 1 : w; w *= 0.7;
    for (let k = 0; k < WEAR.length; k++) {
      const s = WEAR[k], dx = x - s[0], dy = y - s[1], dz = z - s[2], d = 1 - (dx * dx + dy * dy + dz * dz) / (s[3] * s[3]);
      if (d > 0 && 0.75 * d > w) w = 0.75 * d;
    }
    w *= 1 - a;
    const lr = lo.r + (lh.r - lo.r) * hd, lg = lo.g + (lh.g - lo.g) * hd, lb = lo.b + (lh.b - lo.b) * hd;
    const wr = wo.r + (wh.r - wo.r) * hd, wg = wo.g + (wh.g - wo.g) * hd, wb = wo.b + (wh.b - wo.b) * hd;
    col[i * 4] = r0 + 255 * ((lr - hi.r) * a + (wr - hi.r) * w) + 0.5; col[i * 4 + 1] = g0 + 255 * ((lg - hi.g) * a + (wg - hi.g) * w) + 0.5; col[i * 4 + 2] = b0 + 255 * ((lb - hi.b) * a + (wb - hi.b) * w) + 0.5;
    // (the fourth number: how much of a hollow the place is, for the shader, which eases the hollows' tone where the
    // picture's grain is too coarse to draw them)
    col[i * 4 + 3] = 255 * a + 0.5;
  }
  return col;
}

// the fine grids (boxes in the part's axes, y above the court floor) and their cells
const CELL_BODY = 0.2, CELL_HEAD = 0.1, CELL_FACE = 0.06, CELL_YOKE = 0.14, CELL_HAND = 0.125, CELL_FEET = 0.15, LAP = 0.3;
// the form that casts the statue's shadow (the world draws every caster twice, so it is a lighter one): the
// statue's own skin with its corners gathered into lumps of this size, finer on the head
const LUMP = 0.5, LUMP_HEAD = 0.3;
// (in two steps: the lumps, then the triangles between them)
function skinLumps(out, nv, S, i0, i1) {
  const hx0 = BOX_HEAD[0], hy0 = BOX_HEAD[1], hz0 = BOX_HEAD[2], hx1 = BOX_HEAD[3], hy1 = BOX_HEAD[4], hz1 = BOX_HEAD[5];
  const bx0 = BOX_BODY[0], by0 = BOX_BODY[1], bz0 = BOX_BODY[2];
  const ia = 1 / LUMP, ib = 1 / LUMP_HEAD;
  const ax = Math.ceil((BOX_BODY[3] - bx0) * ia) + 1, ay = Math.ceil((BOX_BODY[4] - by0) * ia) + 1, az = Math.ceil((BOX_BODY[5] - bz0) * ia) + 1;
  const hx = Math.ceil((hx1 - hx0) * ib) + 1, hy = Math.ceil((hy1 - hy0) * ib) + 1, hz = Math.ceil((hz1 - hz0) * ib) + 1;
  // one lattice of lumps for the body and, after it, a finer one for the head
  const na = ax * ay * az;
  if (!S) S = { g: new Int32Array(na + hx * hy * hz).fill(-1), lump: new Int32Array(nv), acc: new Float32Array(nv * 4), n: 0 };
  const pos = out.pos, g = S.g, lump = S.lump, acc = S.acc;
  let n = S.n;
  for (let i = i0; i < i1; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    let q;
    if (y > hy0 && y < hy1 && x > hx0 && x < hx1 && z > hz0 && z < hz1) q = na + ((x - hx0) * ib | 0) + hx * (((y - hy0) * ib | 0) + hy * ((z - hz0) * ib | 0));
    else {
      let qx = (x - bx0) * ia | 0, qy = (y - by0) * ia | 0, qz = (z - bz0) * ia | 0;
      if (qx < 0) qx = 0; else if (qx >= ax) qx = ax - 1;
      if (qy < 0) qy = 0; else if (qy >= ay) qy = ay - 1;
      if (qz < 0) qz = 0; else if (qz >= az) qz = az - 1;
      q = qx + ax * (qy + ay * qz);
    }
    let l = g[q];
    if (l < 0) l = g[q] = n++;
    lump[i] = l;
    const o = l * 4;
    acc[o] += x; acc[o + 1] += y; acc[o + 2] += z; acc[o + 3] += 1;
  }
  S.n = n;
  return S;
}
function skinTris(out, nv, ni, S, T, t0, t1) {
  const pos = out.pos, idx = out.idx, lump = S.lump, acc = S.acc, n = S.n;
  if (!T) {
    // the rays join as they are, after the lumps
    const extra = out.nv - nv, P = new Float32Array((n + extra) * 3);
    for (let l = 0; l < n; l++) { const m = acc[l * 4 + 3]; P[l * 3] = acc[l * 4] / m; P[l * 3 + 1] = acc[l * 4 + 1] / m; P[l * 3 + 2] = acc[l * 4 + 2] / m; }
    P.set(pos.subarray(nv * 3, out.nv * 3), n * 3);
    return { P, I: new Uint32Array(out.ni), m: 0 };
  }
  // every triangle (from index t0 up to t1) whose three corners fell into three lumps
  const I = T.I;
  let m = T.m;
  for (let t = t0; t < t1; t += 3) {
    const a = lump[idx[t]], b = lump[idx[t + 1]], c = lump[idx[t + 2]];
    if (a === b || b === c || a === c) continue;
    I[m] = a; I[m + 1] = b; I[m + 2] = c; m += 3;
  }
  T.m = m;
  if (t1 < ni) return T;
  for (let t = ni; t < out.ni; t++) I[m++] = idx[t] - nv + n;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(T.P, 3));
  geo.setIndex(new THREE.BufferAttribute(I.slice(0, m), 1));
  return geo;
}
const BOX_BODY = [-3.6, SOLE - 0.04, -4.85, 3.6, CROWN + 0.4, 4.85];
const BOX_HEAD = [-3.0, SOLE + 27.3, -2.5, 2.7, SOLE + 33.0, 2.5];
const BOX_HAND = (s) => (s > 0 ? [-0.2, SOLE + 11.7, 1.75, 2.7, SOLE + 16.1, 4.15] : [-0.2, SOLE + 11.7, -4.15, 2.7, SOLE + 16.1, -1.75]);

const BOX_FACE = [0.7, SOLE + 28.35, -1.42, 2.3, SOLE + 31.3, 1.42];
const BOX_FEET = [-2.1, SOLE - 0.04, -2.7, 3.6, SOLE + 2.7, 2.7];
// the yoke: shoulders, collar bones, the pit of the throat and the chest down to under its lower edge: broad forms
// with low ridges that carry long lights, so they have a finer grid than the body; its lower face lies in a casting joint
const BOX_YOKE = [-1.7, SOLE + 22.5, -4.75, 3.0, SOLE + 27.6, 4.75];
// the belly: the trunk between two casting joints, from under the chest down to the hips: the pads of the belly's long
// muscle, the ribs' arch, the navel and the flank's roll are forms of half a metre, so they have the yoke's finer grid
const BOX_BELLY = [-2.9, SOLE + 17.7, -2.95, 3.0, SOLE + 22.5, 2.95];
// the features (the eyes with their lids, the nose, the mouth) have a finer grid of their own within the face's
const CELL_FEAT = 0.045;
const BOX_FEAT = [0.85, SOLE + 28.9, -1.0, 2.15, SOLE + 31.1, 1.0];
const gridOf = (b, c, B) => ({ x0: b[0], y0: b[1], z0: b[2], c, B, nx: Math.ceil((b[3] - b[0]) / c), ny: Math.ceil((b[4] - b[1]) / c), nz: Math.ceil((b[5] - b[2]) / c), skip: [], sink: [], exact: false, hol: 1, probe: true });
const shrunk = (b, m) => [b[0] + m, b[1] + m, b[2] + m, b[3] - m, b[4] - m, b[5] - m];

export async function buildHero(ctx, opts = {}) {
  const object = new THREE.Group();
  object.name = 'colossus-of-rhodes';
  const F = makeField();
  buildTrunk(F);
  for (const s of [1, -1]) buildLeg(F, s);
  await ctx.yield();
  // (the hands are laid on the thighs as they stand now: the trunk and the legs, before any line is cut)
  const handLines = [];
  { const thigh = makeTracer(F, [G_TRUNK, G_LEG, G_LEG + 1]); for (const s of [1, -1]) { buildArm(F, s, thigh, handLines); await ctx.yield(); } }
  // at the fork a small plain form, as on any statue of a youth: stylised, not dwelt on
  F.el(G_TRUNK, 0.3, [1.3, 15.75, 0], [0.4, 0.5, 0.42]);
  F.el(G_TRUNK, 0.25, [1.25, 15.25, 0], [0.34, 0.4, 0.5]);
  buildHead(F);
  buildHair(F);
  await ctx.yield();
  const tracers = (late) => ({ body: makeTracer(F, [G_TRUNK, G_LEG, G_LEG + 1]), arm: makeTracer(F, [G_ARM], late), all: makeTracer(F, [G_TRUNK, G_LEG, G_LEG + 1, G_ARM]) });
  const tr = tracers(false);
  for (const step of cutTrunk(F, tr)) { step(); await ctx.yield(); }
  // the furrows' lines on the skin as it now stands (the tracers are made anew: the cuts are part of the figure now)
  const furs = [];
  { const tr2 = tracers(true);
    for (let i = 0; i < FURROWS.length; i += 4) { traceFurrows(tr2, i, Math.min(FURROWS.length, i + 4), furs); await ctx.yield(); } }
  for (const l of handLines) furs.push(l);
  const tracer = makeTracer(F, [G_HEAD, G_HAIR]);
  cutHead(F);
  const R = makeReader(F);
  await ctx.yield();

  const out = makeOut(72000, 144000);
  const body = gridOf(BOX_BODY, CELL_BODY, 3);
  body.fix = true; body.calm = 2;
  body.skip = [shrunk(BOX_HEAD, LAP), shrunk(BOX_HAND(1), LAP), shrunk(BOX_HAND(-1), LAP), shrunk(BOX_FEET, LAP)];
  // the bottom of the feet's box is the soles' own plane: the body's grid must not stop short of it
  body.skip[3][1] = BOX_FEET[1] - 1;
  body.skip.push(shrunk(BOX_YOKE, LAP), shrunk(BOX_BELLY, LAP));
  // inside the finer boxes the body's own skin is drawn 3 cm in, so that the finer skin lies clear over it
  body.sink = [BOX_HEAD, BOX_HAND(1), BOX_HAND(-1), BOX_FEET, BOX_YOKE, BOX_BELLY];
  // the wide lists: every primitive within the reach of the hollows' probes, in blocks of 0.6 m
  const wide = await makeLists(F, R, -4.8, SOLE - 0.8, -5.6, 0.8, 12, 44, 14, 0.8, ctx, G_HAIR);
  await ctx.yield();
  await meshGrid(F, R, body, out, wide, ctx);
  { const yoke = gridOf(BOX_YOKE, CELL_YOKE, 4); yoke.fix = true; yoke.calm = 3; yoke.even = 8; yoke.hol = 0.8; yoke.sink = [BOX_HEAD]; await meshGrid(F, R, yoke, out, wide, ctx); }
  { const belly = gridOf(BOX_BELLY, CELL_YOKE, 4); belly.fix = true; belly.calm = 2; belly.hol = 0.8; await meshGrid(F, R, belly, out, wide, ctx); }
  const head = gridOf(BOX_HEAD, CELL_HEAD, 4);
  // how strongly a hollow darkens: on the body as it is, on the face much less (a face is not drawn with lines),
  // among the curls more; by what stands nearest at the place, so that no line shows where one grid ends
  const headHol = (x, y, z, gd) => {
    let t = (Math.min(gd[0], gd[5]) - gd[6] + 0.04) / 0.1; t = t < 0 ? 0 : t > 1 ? 1 : t;
    let u = (y - SOLE - 28.0) / 0.7; u = u < 0 ? 0 : u > 1 ? 1 : u;
    let base = 1 - 0.7 * u * u * (3 - 2 * u);
    // round each eye the lines between lid and ball hold a little more shade, so that the eye is found
    if (x > 1.0) { let e = (0.5 - Math.hypot((y - SOLE - 30.5) * 1.5, Math.abs(z) - 0.5)) / 0.14; e = e < 0 ? 0 : e > 1 ? 1 : e; base += 0.4 * e * e * (3 - 2 * e); }
    return base + (1.4 - base) * t * t * (3 - 2 * t);
  };
  head.skip = [shrunk(BOX_FACE, 0.15)]; head.sink = [BOX_FACE]; head.holAt = headHol; head.probe = false; head.fix = true;
  await meshGrid(F, R, head, out, wide, ctx);
  const face = gridOf(BOX_FACE, CELL_FACE, 4);
  face.holAt = headHol; face.probe = false;
  face.skip = [shrunk(BOX_FEAT, 0.12)]; face.sink = [BOX_FEAT]; face.exact = true; face.sink0 = 0.008;
  await meshGrid(F, R, face, out, wide, ctx);
  { const feat = gridOf(BOX_FEAT, CELL_FEAT, 4); feat.holAt = headHol; feat.probe = false; feat.exact = true; await meshGrid(F, R, feat, out, wide, ctx); }
  await meshGrid(F, R, gridOf(BOX_HAND(1), CELL_HAND, 4), out, wide, ctx);
  await meshGrid(F, R, gridOf(BOX_HAND(-1), CELL_HAND, 4), out, wide, ctx);
  await meshGrid(F, R, gridOf(BOX_FEET, CELL_FEET, 4), out, wide, ctx);

  const nvFig = out.nv, niFig = out.ni;
  const rayTip = await buildRays(tracer, out, ctx);
  await ctx.yield();
  const nv = out.nv, col = new Uint8Array(nv * 4);
  for (let i = 0; i < nv; i += 16000) { colours(out, col, i, Math.min(nv, i + 16000)); await ctx.yield(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(out.pos.slice(0, nv * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(out.nor.slice(0, nv * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4, true));
  geo.setIndex(new THREE.BufferAttribute(out.idx.slice(0, out.ni), 1));
  // its bounds are known: the box every grid lies in, up to the rays' ceiling
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(BOX_BODY[0], SOLE - 0.05, BOX_BODY[2]), new THREE.Vector3(BOX_BODY[3], RAY_TOP, BOX_BODY[5]));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, (SOLE + RAY_TOP) / 2, 0), Math.hypot(BOX_BODY[3], (RAY_TOP - SOLE) / 2 + 0.05, BOX_BODY[5]));
  await ctx.yield();
  // the furrows into the skin's corners
  let FL = null;
  { const it = furrowLines(furs); for (let st = it.next(); ; st = it.next()) { if (st.done) { FL = st.value; break; } await ctx.yield(); } }
  await ctx.yield();
  const FA = Array.from({ length: FL.K }, () => new Int16Array(nv * 4));
  for (let i = 0; i < nv; i += 1000) { bakeFurrows(out.pos, furs, FL, FA, i, Math.min(nv, i + 1000)); await ctx.yield(); }
  FA.forEach((a, k) => geo.setAttribute('coF' + k, new THREE.BufferAttribute(a, 4, true)));
  const statue = new THREE.Mesh(geo, bronzeMaterial(opts, FL.K));
  statue.name = 'statue'; statue.castShadow = false; statue.receiveShadow = true;
  object.add(statue);

  // the shadow is cast by a second, lighter skin of the same form (and the rays as they are): it writes neither
  // colour nor depth, so only the sun's shadow pass sees it
  let lumps = null;
  for (let i = 0; i < nvFig; i += 14000) { lumps = skinLumps(out, nvFig, lumps, i, Math.min(nvFig, i + 14000)); await ctx.yield(); }
  const skin = skinTris(out, nvFig, niFig, lumps, null, 0, 0);
  let sgeo = null;
  for (let t = 0; t < niFig; t += 90000) { sgeo = skinTris(out, nvFig, niFig, lumps, skin, t, Math.min(niFig, t + 90000)); await ctx.yield(); }
  sgeo.boundingSphere = geo.boundingSphere.clone(); sgeo.boundingBox = geo.boundingBox.clone();
  const shade = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  shade.name = 'shade'; shade.castShadow = true; shade.receiveShadow = false;
  // (r8: for the sun's depth map only. It wrote nothing into the picture, and yet all its triangles, some 9,700, were
  // sent there wherever the figure stood before the lens. Now none is sent: before the picture's pass its draw range
  // is nought, before the shadow's pass it is whole again. That is the way of the world's harbour front, where it is
  // not in the picture; the shades of the world's people are kept out otherwise, by their count of instances)
  shade.onBeforeRender = () => { shade.geometry.setDrawRange(0, 0); }; shade.onBeforeShadow = () => { shade.geometry.setDrawRange(0, Infinity); };
  object.add(shade);
  await ctx.yield();

  const base = new THREE.Mesh(buildBase(), marbleMaterial());
  base.name = 'base'; base.castShadow = true; base.receiveShadow = true;
  object.add(base);

  return {
    object, radius: 13, height: 38, center: new THREE.Vector3(0, 19, 0),
    info: { baseTop: SOLE, crown: CROWN, rayTip, baseHalfX: BASE_X / 2, baseHalfZ: BASE_Z / 2,
      // (r8: two more places for the gaze, which the world held typed till now, each over the base's foot as the others
      // are: his middle, half the height of his crown (14.25 m over his soles, where his hands lie on his thighs), and
      // the line of his jaw, 29 m over his soles: half a metre over the underside of his chin. It is not the pit of his
      // throat, which lies 2.5 m lower, at 26.5 m over his soles.)
      looks: { chest: [0.5, SOLE + 24, 0], head: [0.3, SOLE + 30.6, 0], feet: [0.8, SOLE + 1, 0], middle: [0.3, CROWN / 2, 0], jaw: [0.3, SOLE + 29, 0] },
      // the heights of two of the figure's own forms, each over his soles and over the base's foot (the court's paving):
      // the middle of the knees (the knee's joint, on which the kneecap's shield lies) and the middle of the waist's form
      // (where the trunk is narrowest between the ribs and the hips)
      heights: { kneesMiddle: { overSoles: KNEE, overBaseFoot: SOLE + KNEE }, waistMiddle: { overSoles: WAIST, overBaseFoot: SOLE + WAIST } } },
    update() {}, dispose() {},
  };
}
