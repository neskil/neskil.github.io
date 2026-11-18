// The Statue of Zeus at Olympia: the seated god of ivory and gold (crown of the head 13.4 m above the room floor) on
// his throne, with the footstool, the dark stone base, the Victory in his right hand, the sceptre and its eagle, and
// the Graces and Seasons on the throne's back, as one object.
// ORIGIN: the middle of the base's FRONT edge on the room floor. +X is the god's front (east), +Z his right hand
// side (south), +Y up, metres, no scale. The base runs from x 0 back to x -9.93.
// How it is made: the god is ONE signed distance field of rounded forms joined by smooth unions (flesh and gold told
// apart in the field itself), turned into triangles by surface nets written here; the mantle's folds are part of the
// field. Throne, base and footstool are plain built geometry; the small figures are drawn many times from one form.
// Nothing here moves or gives light. Interface: design/sw/notes/zeus-interface.md. Measures: the design's "hero".
import * as THREE from 'three';

// ---- the fixed measures of the design (metres; y is above the room floor) ----
const BASE_W = 6.65, BASE_D = 9.93, BASE_H = 1.09;
const THRONE_W = 6.54, THRONE_TOP = 10.9;
const STOOL_H = 0.9, STOOL_TOP = BASE_H + STOOL_H;
const CROWN = 13.4, CHIN = 11.5, EYES = 12.4, HEAD = 1.9;
const SEAT = 5.9, KNEE_TOP = 6.3, KNEE_FRONT = -2.0;
const SHOULDER_Y = 10.8, SHOULDERS = 3.8;
const HAND_Y = 7.0;
const VICTORY_H = 1.9;
const SCEPTRE_TOP = 12.6;
const WOMEN_H = 1.9;

// ---- the field: a store of rounded forms and the reading of the distance at a point ----
const FAR = 1e3;
// a smooth joining of two distances over a width k (a cubic blend)
function blend(a, b, k) {
  const m = a < b ? a : b;
  if (k <= 0) return m;
  let h = a - b; if (h < 0) h = -h;
  h = 1 - h / k;
  return h <= 0 ? m : m - h * h * h * k * (1 / 6);
}

// kinds of form: 0 a round cone between two balls, 1 an ellipsoid, 2 a rounded box, 3 an eye's lids, 4 an eye's socket (a cut)
// what a form does: 0 it joins its group, 1 it is cut away from the whole afterwards
function makeField(nGroups) {
  const CAP = 1600, W = 20;
  const kind = new Uint8Array(CAP), grp = new Uint8Array(CAP), cut = new Uint8Array(CAP);
  const soft = new Float64Array(CAP), P = new Float64Array(CAP * W), box = new Float64Array(CAP * 6);
  let n = 0, firstCut = -1;
  const E = new THREE.Euler(), M = new THREE.Matrix4();
  // each group: mat 0 flesh (ivory) or 1 gold; join: how broadly it joins the groups of its own stuff before it
  const groups = [];
  for (let g = 0; g < nGroups; g++) groups.push({ mat: 0, join: 0.1 });
  const F = { kind, grp, cut, soft, P, box, W, groups, seam: 0.03, fold: null, m: 0, count: () => n, firstCut: () => (firstCut < 0 ? n : firstCut) };

  function take(t, g, k, isCut) {
    if (n >= CAP) throw new Error('zeus: too many forms');
    if (isCut && firstCut < 0) firstCut = n;
    if (!isCut && firstCut >= 0) throw new Error('zeus: a joined form after a cut');
    kind[n] = t; grp[n] = g; soft[n] = k; cut[n] = isCut ? 1 : 0;
    return n++;
  }
  function bound(i, x0, y0, z0, x1, y1, z1, pad) {
    const o = i * 6;
    box[o] = x0 - pad; box[o + 1] = y0 - pad; box[o + 2] = z0 - pad; box[o + 3] = x1 + pad; box[o + 4] = y1 + pad; box[o + 5] = z1 + pad;
  }
  // a round cone from a (radius ra) to b (radius rb); flat = [fx, fy, fz] squashes it about a along the axes (1 = round)
  F.cone = (g, k, a, b, ra, rb, flat = null, isCut = false) => {
    const i = take(0, g, k, isCut), o = i * W;
    const fx = flat ? flat[0] : 1, fy = flat ? flat[1] : 1, fz = flat ? flat[2] : 1;
    const bx = (b[0] - a[0]) / fx, by = (b[1] - a[1]) / fy, bz = (b[2] - a[2]) / fz;
    const l2 = Math.max(1e-9, bx * bx + by * by + bz * bz), rr = ra - rb;
    P[o] = a[0]; P[o + 1] = a[1]; P[o + 2] = a[2]; P[o + 3] = bx; P[o + 4] = by; P[o + 5] = bz;
    P[o + 6] = ra; P[o + 7] = rb; P[o + 8] = 1 / fx; P[o + 9] = 1 / fy; P[o + 10] = 1 / fz;
    P[o + 11] = l2; P[o + 12] = rr; P[o + 13] = l2 - rr * rr; P[o + 14] = 1 / l2; P[o + 15] = Math.min(1, fx, fy, fz);
    const ex = Math.max(fx, 1), ey = Math.max(fy, 1), ez = Math.max(fz, 1);
    bound(i, Math.min(a[0] - ra * ex, b[0] - rb * ex), Math.min(a[1] - ra * ey, b[1] - rb * ey), Math.min(a[2] - ra * ez, b[2] - rb * ez),
      Math.max(a[0] + ra * ex, b[0] + rb * ex), Math.max(a[1] + ra * ey, b[1] + rb * ey), Math.max(a[2] + ra * ez, b[2] + rb * ez), k + 0.02);
    return i;
  };
  function turned(i, c, rot) {
    const o = i * W, e = M.elements;
    if (rot) { E.set(rot[0], rot[1], rot[2], 'YXZ'); M.makeRotationFromEuler(E); } else M.identity();
    P[o] = c[0]; P[o + 1] = c[1]; P[o + 2] = c[2];
    // the form's own three axes written in the part's axes
    P[o + 3] = e[0]; P[o + 4] = e[1]; P[o + 5] = e[2]; P[o + 6] = e[4]; P[o + 7] = e[5]; P[o + 8] = e[6]; P[o + 9] = e[8]; P[o + 10] = e[9]; P[o + 11] = e[10];
    return o;
  }
  function turnedBound(i, hx, hy, hz, pad) {
    const o = i * W;
    const ex = Math.abs(P[o + 3]) * hx + Math.abs(P[o + 6]) * hy + Math.abs(P[o + 9]) * hz;
    const ey = Math.abs(P[o + 4]) * hx + Math.abs(P[o + 7]) * hy + Math.abs(P[o + 10]) * hz;
    const ez = Math.abs(P[o + 5]) * hx + Math.abs(P[o + 8]) * hy + Math.abs(P[o + 11]) * hz;
    bound(i, P[o] - ex, P[o + 1] - ey, P[o + 2] - ez, P[o] + ex, P[o + 1] + ey, P[o + 2] + ez, pad);
  }
  // an ellipsoid at c with radii r, turned by rot (Euler angles x, y, z applied in the order Y, X, Z)
  F.egg = (g, k, c, r, rot = null, isCut = false) => {
    const i = take(1, g, k, isCut), o = turned(i, c, rot);
    P[o + 12] = 1 / r[0]; P[o + 13] = 1 / r[1]; P[o + 14] = 1 / r[2]; P[o + 15] = Math.min(r[0], r[1], r[2]);
    turnedBound(i, r[0], r[1], r[2], k + 0.02);
    return i;
  };
  // a box at c with half sizes h, its edges rounded by rd, turned by rot
  F.slab = (g, k, c, h, rd, rot = null, isCut = false) => {
    const i = take(2, g, k, isCut), o = turned(i, c, rot);
    P[o + 12] = h[0] - rd; P[o + 13] = h[1] - rd; P[o + 14] = h[2] - rd; P[o + 15] = rd;
    turnedBound(i, h[0], h[1], h[2], k + 0.02);
    return i;
  };
  // an eye's two lids as one form: a ball at c (radius R) with an almond opening through its front (+x) face, bounded
  // by an upper arc (hu above the middle) and a lower arc (hl below) that meet in two corners `half` to each side;
  // tilt lifts the corner on the +z side (metres a metre). The eyeball is a smaller ball set inside it.
  F.lid = (g, k, c, R, hu, hl, half, tilt) => {
    const i = take(3, g, k, false), o = i * W, RA = (half * half + hu * hu) / (2 * hu), RB = (half * half + hl * hl) / (2 * hl);
    P[o] = c[0]; P[o + 1] = c[1]; P[o + 2] = c[2]; P[o + 3] = R; P[o + 4] = RA; P[o + 5] = hu - RA; P[o + 6] = RB; P[o + 7] = RB - hl; P[o + 8] = tilt;
    bound(i, c[0] - R, c[1] - R, c[2] - R, c[0] + R, c[1] + R, c[2] + R, k + 0.02);
    return i;
  };
  // an eye's socket, cut after all is joined: an ellipsoid at c with radii r is taken away from the whole, all but the
  // eye that lies in it (the lids' form `lid` and the ball's form `ball`, by their numbers)
  F.socket = (g, k, c, r, lid, ball) => {
    const i = take(4, g, k, true), o = turned(i, c, null);
    P[o + 12] = 1 / r[0]; P[o + 13] = 1 / r[1]; P[o + 14] = 1 / r[2]; P[o + 15] = Math.min(r[0], r[1], r[2]); P[o + 16] = lid; P[o + 17] = ball;
    turnedBound(i, r[0], r[1], r[2], k + 0.02);
    return i;
  };
  return F;
}

// the readers of a field: one(i, x, y, z) is one form's distance; at(x, y, z, list, off, cnt) is the whole figure's,
// read through a list of the forms that can matter there (joined forms first, then the cuts). After at(), F.m says
// which stuff the nearest skin is: above 0 gold, below 0 flesh.
function makeReader(F) {
  const { kind, grp, soft, P, W, groups } = F, nG = groups.length, first = F.firstCut();
  const acc = new Float64Array(nG);
  function one(i, x, y, z) {
    const o = i * W, t = kind[i];
    if (t === 0) {
      const px = (x - P[o]) * P[o + 8], py = (y - P[o + 1]) * P[o + 9], pz = (z - P[o + 2]) * P[o + 10];
      const bx = P[o + 3], by = P[o + 4], bz = P[o + 5], l2 = P[o + 11], rr = P[o + 12], a2 = P[o + 13], il2 = P[o + 14];
      const along = px * bx + py * by + pz * bz, past = along - l2;
      const qx = px * l2 - bx * along, qy = py * l2 - by * along, qz = pz * l2 - bz * along;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = along * along * l2, z2 = past * past * l2;
      const lim = (rr < 0 ? -rr : rr) * rr * x2;
      let d;
      if ((past < 0 ? -1 : 1) * a2 * z2 > lim) d = Math.sqrt(x2 + z2) * il2 - P[o + 7];
      else if ((along < 0 ? -1 : 1) * a2 * y2 < lim) d = Math.sqrt(x2 + y2) * il2 - P[o + 6];
      else d = (Math.sqrt(x2 * a2 * il2) + along * rr) * il2 - P[o + 6];
      return d * P[o + 15];
    }
    const dx = x - P[o], dy = y - P[o + 1], dz = z - P[o + 2];
    if (t === 3) {
      const ball = Math.sqrt(dx * dx + dy * dy + dz * dz) - P[o + 3], ty = dy - P[o + 8] * dz, ya = ty - P[o + 5], yb = ty - P[o + 7];
      const la = Math.sqrt(ya * ya + dz * dz) - P[o + 4], lb = Math.sqrt(yb * yb + dz * dz) - P[o + 6], lens = la > lb ? la : lb;
      const open = -lens < dx ? -lens : dx;
      return ball > open ? ball : open;
    }
    const qx = dx * P[o + 3] + dy * P[o + 4] + dz * P[o + 5], qy = dx * P[o + 6] + dy * P[o + 7] + dz * P[o + 8], qz = dx * P[o + 9] + dy * P[o + 10] + dz * P[o + 11];
    if (t === 1 || t === 4) {
      const ax = qx * P[o + 12], ay = qy * P[o + 13], az = qz * P[o + 14];
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      const cx = ax * P[o + 12], cy = ay * P[o + 13], cz = az * P[o + 14];
      const k1 = Math.sqrt(cx * cx + cy * cy + cz * cz);
      const d = k1 < 1e-9 ? -P[o + 15] : k0 * (k0 - 1) / k1;
      if (t === 1) return d;
      // (a socket: the ellipsoid less the eye)
      const e1 = one(P[o + 16], x, y, z), e2 = one(P[o + 17], x, y, z), e = e1 < e2 ? e1 : e2;
      return d > -e ? d : -e;
    }
    const ex = (qx < 0 ? -qx : qx) - P[o + 12], ey = (qy < 0 ? -qy : qy) - P[o + 13], ez = (qz < 0 ? -qz : qz) - P[o + 14];
    const mx = ex > 0 ? ex : 0, my = ey > 0 ? ey : 0, mz = ez > 0 ? ez : 0;
    const inner = ex > ey ? (ex > ez ? ex : ez) : (ey > ez ? ey : ez);
    return Math.sqrt(mx * mx + my * my + mz * mz) + (inner < 0 ? inner : 0) - P[o + 15];
  }
  function at(x, y, z, list, off, cnt) {
    for (let g = 0; g < nG; g++) acc[g] = FAR;
    let q = 0;
    for (; q < cnt; q++) {
      const i = list[off + q];
      if (i >= first) break;
      const g = grp[i];
      acc[g] = blend(acc[g], one(i, x, y, z), soft[i]);
    }
    let dI = FAR, dG = FAR;
    for (let g = 0; g < nG; g++) {
      let a = acc[g];
      if (a > 100) continue;
      const G = groups[g];
      // cloth and hair carry their folds and strands as a swelling of their own skin
      if (G.fold !== undefined && a < 0.6) a -= G.fold(x, y, z);
      if (G.mat) dG = blend(dG, a, G.join); else dI = blend(dI, a, G.join);
    }
    let d = blend(dI, dG, F.seam);
    F.m = dI - dG;
    for (; q < cnt; q++) { const i = list[off + q]; d = -blend(-d, one(i, x, y, z), soft[i]); }
    return d;
  }
  return { one, at };
}

// for a lattice of blocks (bs metres on a side from x0, y0, z0): the forms that can matter in each block. A form is
// listed where its own box reaches the block and its skin lies within the block's half diagonal, plus its joining
// width, its group's swelling and `reach`, of the block's middle.
function startLists(x0, y0, z0, bs, nbx, nby, nbz, reach) {
  return { x0, y0, z0, bs, nbx, nby, nbz, reach, off: new Int32Array(nbx * nby * nbz + 1), pairs: new Int32Array(1 << 15), np: 0, list: null };
}
function listSome(S, F, R, from, to) {
  const { box, kind, soft, grp, groups, P, W } = F, { x0, y0, z0, bs, nbx, nby, nbz, reach, off } = S;
  const X1 = x0 + nbx * bs, Y1 = y0 + nby * bs, Z1 = z0 + nbz * bs;
  let pairs = S.pairs, np = S.np;
  for (let i = from; i < to; i++) {
    const o = i * 6, w = i * W, pad = reach + (groups[grp[i]].swell || 0);
    if (!(box[o] - pad < X1 && box[o + 3] + pad > x0 && box[o + 1] - pad < Y1 && box[o + 4] + pad > y0 && box[o + 2] - pad < Z1 && box[o + 5] + pad > z0)) continue;
    const i0 = Math.max(0, Math.floor((box[o] - pad - x0) / bs)), i1 = Math.min(nbx - 1, Math.floor((box[o + 3] + pad - x0) / bs));
    const j0 = Math.max(0, Math.floor((box[o + 1] - pad - y0) / bs)), j1 = Math.min(nby - 1, Math.floor((box[o + 4] + pad - y0) / bs));
    const k0 = Math.max(0, Math.floor((box[o + 2] - pad - z0) / bs)), k1 = Math.min(nbz - 1, Math.floor((box[o + 5] + pad - z0) / bs));
    // (lists for the hollows, which have a reach, take a form's joining width by half: a shade need not be exact)
    const lim = bs * 0.867 + pad + (reach > 0 ? 0.5 : 1) * soft[i] + 0.02, egg = kind[i] === 1 || kind[i] === 4;
    const rmin = egg ? 1 / Math.max(P[w + 12], P[w + 13], P[w + 14]) : 0;
    const need = np + 2 * (i1 - i0 + 1) * (j1 - j0 + 1) * (k1 - k0 + 1);
    if (need > pairs.length) { const a = new Int32Array(Math.max(pairs.length * 2, need)); a.set(pairs); pairs = a; }
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
      const cx = x0 + (ii + 0.5) * bs, cy = y0 + (j + 0.5) * bs, cz = z0 + (k + 0.5) * bs;
      if (egg) {
        // an ellipsoid's own measure is no true distance: a sure lower bound instead
        const dx = cx - P[w], dy = cy - P[w + 1], dz = cz - P[w + 2];
        const ax = (dx * P[w + 3] + dy * P[w + 4] + dz * P[w + 5]) * P[w + 12], ay = (dx * P[w + 6] + dy * P[w + 7] + dz * P[w + 8]) * P[w + 13], az = (dx * P[w + 9] + dy * P[w + 10] + dz * P[w + 11]) * P[w + 14];
        if ((Math.sqrt(ax * ax + ay * ay + az * az) - 1) * rmin > lim) continue;
      } else if (R.one(i, cx, cy, cz) > lim) continue;
      const b = ii + nbx * (j + nby * k);
      pairs[np++] = b; pairs[np++] = i; off[b + 1]++;
    }
  }
  S.pairs = pairs; S.np = np;
}
function endLists(S) {
  const nb = S.nbx * S.nby * S.nbz, off = S.off, pairs = S.pairs, np = S.np;
  for (let b = 0; b < nb; b++) off[b + 1] += off[b];
  const list = new Int16Array(np >> 1), fill = new Int32Array(nb);
  for (let q = 0; q < np; q += 2) { const b = pairs[q]; list[off[b] + fill[b]++] = pairs[q + 1]; }
  S.list = list; S.pairs = null;
  return S;
}

// ---- surface nets: a grid of the field turned into a skin of triangles ----
// The skin every grid adds to: places, normals, and three numbers a corner: which stuff (above 0 gold, below 0
// flesh), how deep in a wide hollow it lies (0 open, 1 shut in) and how sharply it is creased (1/m, hollows above 0).
function makeSkin(nv, nt) {
  return { pos: new Float32Array(nv * 3), nor: new Float32Array(nv * 3), aux: new Float32Array(nv * 3), idx: new Uint32Array(nt * 3), nv: 0, ni: 0, capV: nv, capI: nt * 3 };
}
function roomFor(out, moreV, moreI) {
  if (out.nv + moreV > out.capV) {
    const n = Math.max(out.capV * 2, out.nv + moreV);
    for (const key of ['pos', 'nor', 'aux']) { const a = new Float32Array(n * 3); a.set(out[key]); out[key] = a; }
    out.capV = n;
  }
  if (out.ni + moreI > out.capI) { const n = Math.max(out.capI * 2, out.ni + moreI), a = new Uint32Array(n); a.set(out.idx); out.idx = a; out.capI = n; }
}
const flatBoxes = (boxes) => { const a = new Float64Array(boxes.length * 6); boxes.forEach((b, i) => a.set(b, i * 6)); return a; };
// how deep (metres) a point lies inside the boxes: 0 outside
function depthIn(a, x, y, z) {
  let best = 0;
  for (let o = 0; o < a.length; o += 6) {
    let d = x - a[o]; let e = a[o + 3] - x; if (e < d) d = e;
    e = y - a[o + 1]; if (e < d) d = e; e = a[o + 4] - y; if (e < d) d = e;
    e = z - a[o + 2]; if (e < d) d = e; e = a[o + 5] - z; if (e < d) d = e;
    if (d > best) best = d;
  }
  return best;
}
function within(a, x, y, z, m) {
  for (let o = 0; o < a.length; o += 6) if (x > a[o] + m && x < a[o + 3] - m && y > a[o + 1] + m && y < a[o + 4] - m && z > a[o + 2] + m && z < a[o + 5] - m) return true;
  return false;
}
const CA = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3], CB = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7];
// behind this plane (his back and the back of his hair) the skin's hollows are not measured
const BACK_X = -7.0;

// g: { x0, y0, z0, c (cell), nx, ny, nz, B (cells a block), leave: boxes whose inside a finer grid draws, sink: boxes
// in which this grid's skin is drawn sinkBy metres in (under the finer skin), reach: how far the hollows are felt }
// L: this grid's own lists (blocks of B cells); Wd: wide lists over the whole figure for the hollows
function makeNet(F, R, g, out, L, Wd) {
  const { x0, y0, z0, c, nx, ny, nz, B } = g, leave = flatBoxes(g.leave || []), sink = flatBoxes(g.sink || []), sinkBy = g.sinkBy || 0.025, reach = g.reach || 0.4;
  const nbx = L.nbx, nby = L.nby, nbz = L.nbz, nb = nbx * nby * nbz, list = L.list, loff = L.off;
  const sx = nx + 1, sxy = sx * (ny + 1), nxy = nx * ny;
  const V = new Float32Array(sxy * (nz + 1)).fill(NaN), Mt = new Float32Array(sxy * (nz + 1)), cellV = new Int32Array(nxy * nz).fill(-1), seen = new Uint8Array(nb);
  const v = new Float64Array(8), base = out.nv, blockR = B * c * 0.867 * 1.25 + c, mLim = 3 * c;
  let cells = new Int32Array(4096), stack = new Int32Array(4096), sp = 0, work = 0, count = 0, nextBlock = 0, i0 = 0;
  function corner(q, i, j, k) {
    const bi = Math.min(nbx - 1, (i / B) | 0), bj = Math.min(nby - 1, (j / B) | 0), bk = Math.min(nbz - 1, (k / B) | 0);
    const b = bi + nbx * (bj + nby * bk), off = loff[b], cnt = loff[b + 1] - off;
    work += cnt + 2;
    if (!cnt) return (V[q] = FAR);
    const d = R.at(x0 + i * c, y0 + j * c, z0 + k * c, list, off, cnt);
    // (how much nearer the gold lies than the flesh, kept within three cells: a far stuff has no say in a cell's corner)
    // (gold that stands less than 8 mm proud of the flesh under it is no gold: a film in the skin's own plane)
    const m = F.m - 0.008; Mt[q] = m > mLim ? mLim : m < -mLim ? -mLim : m;
    return (V[q] = d);
  }
  function val(i, j, k) { const q = i + sx * j + sxy * k, w = V[q]; return w === w ? w : corner(q, i, j, k); }
  function push(i, j, k) {
    if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) return;
    const ci = i + nx * j + nxy * k;
    if (cellV[ci] !== -1) return;
    if (sp === stack.length) { const a = new Int32Array(sp * 2); a.set(stack); stack = a; }
    stack[sp++] = ci;
  }
  function wideAt(x, y, z) {
    const bi = Math.floor((x - Wd.x0) / Wd.bs), bj = Math.floor((y - Wd.y0) / Wd.bs), bk = Math.floor((z - Wd.z0) / Wd.bs);
    if (bi < 0 || bj < 0 || bk < 0 || bi >= Wd.nbx || bj >= Wd.nby || bk >= Wd.nbz) return FAR;
    const b = bi + Wd.nbx * (bj + Wd.nby * bk), o = Wd.off[b], n = Wd.off[b + 1] - o;
    work += n;
    return n ? R.at(x, y, z, Wd.list, o, n) : FAR;
  }
  function farAt(x, y, z) {
    const Wf = g.far, bi = Math.floor((x - Wf.x0) / Wf.bs), bj = Math.floor((y - Wf.y0) / Wf.bs), bk = Math.floor((z - Wf.z0) / Wf.bs);
    if (bi < 0 || bj < 0 || bk < 0 || bi >= Wf.nbx || bj >= Wf.nby || bk >= Wf.nbz) return FAR;
    const b = bi + Wf.nbx * (bj + Wf.nby * bk), o = Wf.off[b], n = Wf.off[b + 1] - o;
    work += n;
    return n ? R.at(x, y, z, Wf.list, o, n) : FAR;
  }
  // one cell the skin passes through: its corner of the skin, and onward through each face the skin crosses
  function cell(ci) {
    if (cellV[ci] !== -1) return;
    const i = ci % nx, j = ((ci / nx) | 0) % ny, k = (ci / nxy) | 0;
    cellV[ci] = -2;
    if (leave.length && within(leave, x0 + (i + 0.5) * c, y0 + (j + 0.5) * c, z0 + (k + 0.5) * c, 0)) return;
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
      const a = CA[e], b = CB[e], va = v[a], vb = v[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), ax = a & 1, ay = (a >> 1) & 1, az = (a >> 2) & 1;
      fx += ax + ((b & 1) - ax) * t; fy += ay + (((b >> 1) & 1) - ay) * t; fz += az + (((b >> 2) & 1) - az) * t;
      m++;
    }
    fx /= m; fy /= m; fz /= m;
    let px = x0 + (i + fx) * c, py = y0 + (j + fy) * c, pz = z0 + (k + fz) * c;
    // the field's slope here, from the cell's own corners
    const a0 = v[0] + (v[1] - v[0]) * fx, a1 = v[2] + (v[3] - v[2]) * fx, a2 = v[4] + (v[5] - v[4]) * fx, a3 = v[6] + (v[7] - v[6]) * fx;
    const f = (a0 + (a1 - a0) * fy) * (1 - fz) + (a2 + (a3 - a2) * fy) * fz;
    let gx = (((v[1] - v[0]) * (1 - fy) + (v[3] - v[2]) * fy) * (1 - fz) + ((v[5] - v[4]) * (1 - fy) + (v[7] - v[6]) * fy) * fz) / c;
    let gy = ((a1 - a0) * (1 - fz) + (a3 - a2) * fz) / c;
    let gz = ((a2 + (a3 - a2) * fy) - (a0 + (a1 - a0) * fy)) / c;
    let g2 = gx * gx + gy * gy + gz * gz;
    if (g2 > 1e-12) { let s = f / g2; const lim = 0.5 * c / Math.sqrt(g2); if (s > lim) s = lim; else if (s < -lim) s = -lim; px -= gx * s; py -= gy * s; pz -= gz * s; }
    g2 = Math.sqrt(g2);
    if (g2 < 1e-9) { gx = 0; gy = 1; gz = 0; g2 = 1; }
    gx /= g2; gy /= g2; gz /= g2;
    const bi = (i / B) | 0, bj = (j / B) | 0, bk = (k / B) | 0, b = bi + nbx * (bj + nby * bk), off = loff[b], cnt = loff[b + 1] - off;
    seen[b] = 1;
    // which stuff this corner is: from the cell's own corners
    const m0 = Mt[q] + (Mt[q + 1] - Mt[q]) * fx, m1 = Mt[q + sx] + (Mt[q + sx + 1] - Mt[q + sx]) * fx, m2 = Mt[q + sxy] + (Mt[q + sxy + 1] - Mt[q + sxy]) * fx, m3 = Mt[q + sxy + sx] + (Mt[q + sxy + sx + 1] - Mt[q + sxy + sx]) * fx;
    // (a measure from -1 to 1 over three cells, so that between two corners the line where ivory meets gold falls where the
    // field has it and runs smooth; cut off within a cell it ran in steps)
    const stuff = ((m0 + (m1 - m0) * fy) * (1 - fz) + (m2 + (m3 - m2) * fy) * fz) / mLim;
    // (his back, which no way through the room looks at, is not asked how shut in it lies)
    // (and it is measured in every other cell only: the corners between take the mean of their neighbours afterwards)
    let hollow = -1;
    if (px < BACK_X && gx < -0.2) hollow = 0;
    else if (((i + j + k) & 1) === 0) {
      // (FLESH near where a finer grid ends: its hollow is measured as the grid beyond measures it, so that no line of
      // shade shows where two grids meet on the bare neck and breast)
      const w = g.far && stuff < 0 ? (g.farTop - py) / 0.3 : 0;
      if (w < 1) { hollow = 1 - wideAt(px + gx * reach, py + gy * reach, pz + gz * reach) / reach; hollow = hollow < 0 ? 0 : hollow > 1 ? 1 : hollow; }
      if (w > 0) {
        let h2 = 1 - farAt(px + gx * g.farReach, py + gy * g.farReach, pz + gz * g.farReach) / g.farReach; h2 = h2 < 0 ? 0 : h2 > 1 ? 1 : h2;
        hollow = w >= 1 ? h2 : hollow + (h2 - hollow) * w;
      }
    }
    // (the eye's ball, seen through its lids' opening, lies in their shade: an eye of one stuff with its lids, lit from below
    // like them, reads as a shut lid; nothing is coloured or laid in, the ivory is only darker there, softly)
    if (g.eyes && px > EYE_X && py > EY - 0.2 && py < EY + 0.2) {
      const dx = px - EYE_X, dy = py - EY + 0.003, dz = (pz < 0 ? -pz : pz) - EYE_Z, dd = Math.sqrt(dx * dx + dy * dy + dz * dz) - EYE_BALL;
      if (dd < 0.014 && dd > -0.014 && hollow < g.eyes) hollow = g.eyes;
    }
    // under a finer grid's skin this one sinks, from nothing at the finer box's face to sinkBy a cell and a half in,
    // so the two skins meet without a step where the finer one ends
    if (sink.length) { let dp = depthIn(sink, px, py, pz) / (1.5 * c); if (dp > 0) { if (dp > 1) dp = 1; dp *= sinkBy; px -= gx * dp; py -= gy * dp; pz -= gz * dp; } }
    if (count === cells.length) { const a = new Int32Array(count * 2); a.set(cells); cells = a; }
    cells[count] = ci;
    roomFor(out, 1, 0);
    const o = out.nv * 3, pos = out.pos, nor = out.nor, aux = out.aux;
    pos[o] = px; pos[o + 1] = py; pos[o + 2] = pz; nor[o] = gx; nor[o + 1] = gy; nor[o + 2] = gz; aux[o] = stuff; aux[o + 1] = hollow; aux[o + 2] = 0;
    cellV[ci] = out.nv++; count++;
    work += 30;
    const xa = mask & 0x55, xb = mask & 0xAA, ya = mask & 0x33, yb = mask & 0xCC, za = mask & 0x0F, zb = mask & 0xF0;
    if (xa !== 0 && xa !== 0x55) push(i - 1, j, k);
    if (xb !== 0 && xb !== 0xAA) push(i + 1, j, k);
    if (ya !== 0 && ya !== 0x33) push(i, j - 1, k);
    if (yb !== 0 && yb !== 0xCC) push(i, j + 1, k);
    if (za !== 0 && za !== 0x0F) push(i, j, k - 1);
    if (zb !== 0 && zb !== 0xF0) push(i, j, k + 1);
  }
  // where to begin: in a block the skin may pass and no walk has reached, the block's own corners; where two of
  // them differ in sign, the cells round the first grid edge between them that changes sign begin a walk
  function alongEdge(i, j, k, di, dj, dk, n) {
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
  function beginIn(b) {
    const off = loff[b], cnt = loff[b + 1] - off;
    if (!cnt || seen[b]) return;
    const bi = b % nbx, bj = ((b / nbx) | 0) % nby, bk = (b / (nbx * nby)) | 0;
    const cx = x0 + (bi + 0.5) * B * c, cy = y0 + (bj + 0.5) * B * c, cz = z0 + (bk + 0.5) * B * c;
    if (leave.length && within(leave, cx, cy, cz, B * c)) return;
    work += cnt;
    const d = R.at(cx, cy, cz, list, off, cnt);
    if (d > blockR || d < -blockR) return;
    const ia = bi * B, ib = Math.min(nx, ia + B), ja = bj * B, jb = Math.min(ny, ja + B), ka = bk * B, kb = Math.min(nz, ka + B);
    for (let k = ka; k <= kb; k += kb - ka) for (let j = ja; j <= jb; j += jb - ja) for (let i = ia; i <= ib; i += ib - ia) {
      const va = val(i, j, k);
      if (i === ia && (va < 0) !== (val(ib, j, k) < 0)) alongEdge(i, j, k, 1, 0, 0, ib - ia);
      if (j === ja && (va < 0) !== (val(i, jb, k) < 0)) alongEdge(i, j, k, 0, 1, 0, jb - ja);
      if (k === ka && (va < 0) !== (val(i, j, kb) < 0)) alongEdge(i, j, k, 0, 0, 1, kb - ka);
    }
  }
  // walks the skin until about `limit` of work is done; true when the whole grid is walked
  function walk(limit) {
    work = 0;
    for (;;) {
      while (sp) { cell(stack[--sp]); if (work > limit) return false; }
      if (nextBlock >= nb) return true;
      beginIn(nextBlock++);
      if (work > limit) return false;
    }
  }
  // a pair of triangles round every grid edge the skin crosses, between the four cells that share the edge
  // (a, b, d, e go round the edge; `as` says whether that round faces outward, which the field's sign along the edge
  // tells: no guess from a corner's facing, so the thinnest lock is closed too)
  function four(a, b, d, e, as) {
    if (a < 0 || b < 0 || d < 0 || e < 0) return;
    const idx = out.idx, n = out.ni;
    idx[n] = a; idx[n + 3] = a;
    if (as) { idx[n + 1] = b; idx[n + 2] = d; idx[n + 4] = d; idx[n + 5] = e; } else { idx[n + 1] = d; idx[n + 2] = b; idx[n + 4] = e; idx[n + 5] = d; }
    out.ni = n + 6;
  }
  function faces(from, to) {
    if (from === 0) { i0 = out.ni; roomFor(out, 0, count * 18); }
    for (let t = from; t < to; t++) {
      const ci = cells[t], i = ci % nx, j = ((ci / nx) | 0) % ny, k = (ci / nxy) | 0, cv = base + t;
      const q = i + sx * j + sxy * k, s0 = V[q] < 0;
      if (j > 0 && k > 0 && s0 !== (V[q + 1] < 0)) four(cv, cellV[ci - nx], cellV[ci - nx - nxy], cellV[ci - nxy], s0);
      if (i > 0 && k > 0 && s0 !== (V[q + sx] < 0)) four(cv, cellV[ci - 1], cellV[ci - 1 - nxy], cellV[ci - nxy], !s0);
      if (i > 0 && j > 0 && s0 !== (V[q + sxy] < 0)) four(cv, cellV[ci - 1], cellV[ci - 1 - nx], cellV[ci - nx], s0);
    }
  }
  // creases: how far each corner lies under the mean of its neighbours (1/m), smoothed twice over the neighbours (as
  // measured it carries the grid's own ripple, which shows on a smooth cheek as rings)
  // (a generator: every yield of it is a place where the build may let the page draw, and nothing else; the same sums in the same order)
  function* creases() {
    const pos = out.pos, nor = out.nor, idx = out.idx, ni = out.ni, aux = out.aux;
    const sum = new Float32Array(count * 4), deg = new Float32Array(count);
    let cur = new Float32Array(count), nxt = new Float32Array(count);
    // one walk over the triangles: the hollows that were not measured take the mean of the measured corners each
    // shares a triangle with; and every corner gathers its neighbours' places
    for (let t = i0; t < ni; t += 3) {
      const a = idx[t], b = idx[t + 1], d = idx[t + 2];
      const A = (a - base) * 4, Bq = (b - base) * 4, D = (d - base) * 4, pa = a * 3, pb = b * 3, pd = d * 3;
      const ha = aux[pa + 1], hb = aux[pb + 1], hd = aux[pd + 1];
      if (ha < 0) { if (hb >= 0) { nxt[a - base] += hb; deg[a - base]++; } if (hd >= 0) { nxt[a - base] += hd; deg[a - base]++; } }
      if (hb < 0) { if (ha >= 0) { nxt[b - base] += ha; deg[b - base]++; } if (hd >= 0) { nxt[b - base] += hd; deg[b - base]++; } }
      if (hd < 0) { if (ha >= 0) { nxt[d - base] += ha; deg[d - base]++; } if (hb >= 0) { nxt[d - base] += hb; deg[d - base]++; } }
      sum[A] += pos[pb] + pos[pd]; sum[A + 1] += pos[pb + 1] + pos[pd + 1]; sum[A + 2] += pos[pb + 2] + pos[pd + 2]; sum[A + 3] += 2;
      sum[Bq] += pos[pa] + pos[pd]; sum[Bq + 1] += pos[pa + 1] + pos[pd + 1]; sum[Bq + 2] += pos[pa + 2] + pos[pd + 2]; sum[Bq + 3] += 2;
      sum[D] += pos[pa] + pos[pb]; sum[D + 1] += pos[pa + 1] + pos[pb + 1]; sum[D + 2] += pos[pa + 2] + pos[pb + 2]; sum[D + 3] += 2;
    }
    yield;
    for (let q = 0; q < count; q++) {
      const A = q * 4, o = (base + q) * 3, m = sum[A + 3];
      if (aux[o + 1] < 0) aux[o + 1] = deg[q] ? nxt[q] / deg[q] : 0;
      cur[q] = m < 8 ? 0 : 4 * ((sum[A] / m - pos[o]) * nor[o] + (sum[A + 1] / m - pos[o + 1]) * nor[o + 1] + (sum[A + 2] / m - pos[o + 2]) * nor[o + 2]) / (c * c);
    }
    // (in the same walks the hollows of the FLESH are smoothed over the neighbours: ivory's shade is soft, and as
    // measured, in every other cell, it lay on the skin in patches; gold keeps the depth between its locks and folds)
    const hol = new Float32Array(count), hs = new Float32Array(count), hd = new Float32Array(count);
    for (let q = 0; q < count; q++) hol[q] = aux[(base + q) * 3 + 1];
    // (FLESH in a fine grid: a measure of 1/m calls every small form of a face a crease and its fine grid's own
    // unevenness too, and the shade then lies on the cheek in patches with ragged edges: there the measure is taken down
    // by the cell's size against the body's, and smoothed over more neighbours)
    // (the upper body's grid: its gold is the mantle's end on the shoulder and the roll at the hips, broad cloth beside
    // the bare skin, whose shade is smoothed with the skin's; the beard's and the hair's grids keep theirs as measured)
    const fine = c < CELL_BODY ? c / CELL_BODY : 1, passes = c < 0.04 ? 4 : c < 0.09 ? 3 : 2, soft = c > 0.07 && c < CELL_BODY - 0.001;
    // (and near where a finer grid ends on the bare neck and breast it is taken down as the grid beyond takes it)
    if (fine < 1) for (let q = 0; q < count; q++) {
      const o = (base + q) * 3;
      if (aux[o] >= 0) continue;
      let w = g.far ? (g.farTop - pos[o + 1]) / 0.3 : 0; w = w < 0 ? 0 : w > 1 ? 1 : w;
      cur[q] *= fine + (CELL_NEAR / CELL_BODY - fine) * w;
    }
    for (let pass = 0; pass < passes; pass++) {
      yield;
      nxt.fill(0); deg.fill(0); hs.fill(0); hd.fill(0);
      for (let t = i0; t < ni; t += 3) {
        const a = idx[t] - base, b = idx[t + 1] - base, d = idx[t + 2] - base;
        nxt[a] += cur[b]; deg[a]++; nxt[b] += cur[d]; deg[b]++; nxt[d] += cur[a]; deg[d]++;
        // (flesh beside the gold of a grid that keeps its gold's shade takes the mean of its flesh neighbours alone:
        // the gap between two locks is no measure of the skin beside the beard)
        if (soft || aux[(base + b) * 3] < 0) { hs[a] += hol[b]; hd[a]++; }
        if (soft || aux[(base + d) * 3] < 0) { hs[b] += hol[d]; hd[b]++; }
        if (soft || aux[(base + a) * 3] < 0) { hs[d] += hol[a]; hd[d]++; }
      }
      for (let q = 0; q < count; q++) {
        if (!deg[q]) { nxt[q] = cur[q]; continue; }
        nxt[q] = 0.5 * cur[q] + 0.5 * nxt[q] / deg[q];
        if ((soft || aux[(base + q) * 3] < 0) && hd[q]) hol[q] = 0.35 * hol[q] + 0.65 * hs[q] / hd[q];
      }
      const sw = cur; cur = nxt; nxt = sw;
    }
    for (let q = 0; q < count; q++) { const o = (base + q) * 3; aux[o + 1] = hol[q]; aux[o + 2] = cur[q]; }
  }
  return { walk, faces, creases, count: () => count };
}

const gridOver = (b, c, B) => ({ x0: b[0], y0: b[1], z0: b[2], c, B, nx: Math.ceil((b[3] - b[0]) / c), ny: Math.ceil((b[4] - b[1]) / c), nz: Math.ceil((b[5] - b[2]) / c), leave: [], sink: [] });
const inset = (b, m) => [b[0] + m, b[1] + m, b[2] + m, b[3] - m, b[4] - m, b[5] - m];
async function listsFor(F, R, x0, y0, z0, bs, nbx, nby, nbz, reach, ctx) {
  const S = startLists(x0, y0, z0, bs, nbx, nby, nbz, reach), n = F.count(), step = reach > 0.2 ? 80 : 240;
  for (let i = 0; i < n; i += step) { listSome(S, F, R, i, Math.min(n, i + step)); await ctx.yield(); }
  return endLists(S);
}
async function netOver(F, R, g, out, Wd, ctx) {
  const B = g.B, L = await listsFor(F, R, g.x0, g.y0, g.z0, B * g.c, Math.ceil(g.nx / B), Math.ceil(g.ny / B), Math.ceil(g.nz / B), 0, ctx);
  const N = makeNet(F, R, g, out, L, Wd);
  await ctx.yield();
  while (!N.walk(20000)) await ctx.yield();
  await ctx.yield();
  for (let t = 0, n = N.count(); t < n; t += 6000) { N.faces(t, Math.min(n, t + 6000)); await ctx.yield(); }
  for (const part of N.creases()) await ctx.yield();
  await ctx.yield();
  return N.count();
}

// ---- the god, written into a field. Points are [x, y above the room floor, z]; s is +1 for his right side (+z). ----
// groups of forms; flesh ones are ivory, the others gold
const G_TRUNK = 0, G_ARM_R = 1, G_ARM_L = 2, G_HEAD = 3, G_FEET = 4, G_CLOTH = 5, G_HAIR = 6, G_SANDAL = 7, G_DRAPE = 8, N_GROUPS = 9;
// the places the body is hung on (chosen: a seated man who would stand about 14.4 m)
const TX = -6.55;
const HIP = (s) => [-6.45, 6.72, 0.95 * s], KNEE = (s) => [-2.6, 5.72, 1.28 * s], ANKLE = (s) => [-2.02, 2.72, 1.04 * s];
const SHO = (s) => [-6.6, 10.22, 1.86 * s];
const ELBOW_R = [-6.3, 7.62, 2.66], WRIST_R = [-4.3, 7.04, 2.74], PALM_R = [-3.62, 7.0, 2.74];
const SCEPTRE_X = -2.45, SCEPTRE_Z = -3.05, GRIP_Y = 11.95;
const ELBOW_L = [-4.3, 9.9, -3.12], WRIST_L = [-2.98, 11.62, -3.04];
const SKULL = [-6.5, 12.52, 0];

function buildTrunk(F) {
  const g = G_TRUNK, k = 0.4;
  // the hips; the belly, full and soft (a mature man's); the rib cage as one deep egg, broadest under the armpits; the
  // girdle of the shoulders. No box anywhere: every mass is an egg, and they flow into one another
  F.egg(g, k, [-6.7, 6.95, 0], [1.0, 1.05, 1.55]);
  F.egg(g, k, [-6.56, 8.02, 0], [0.95, 1.25, 1.32]);
  F.egg(g, k, [-6.64, 9.42, 0], [1.02, 1.5, 1.44]);
  F.egg(g, k, [-6.7, 10.3, 0], [0.8, 0.5, 1.86]);
  for (const s of [1, -1]) {
    // the breast: one broad shallow mass a side, full and quiet (no cut muscle), its lower edge a soft turn over the ribs; its
    // outer upper corner runs up into the shoulder as the front wall of the armpit
    F.egg(g, 0.24, [-5.98, 9.94, 0.72 * s], [0.38, 0.62, 0.84]);
    F.egg(g, 0.26, [-6.08, 10.14, 1.42 * s], [0.34, 0.36, 0.62], [-0.6 * s, 0, 0]);
    // the shoulder: on his right the round muscle lies over the arm's top and runs down its outside to a point, one
    // skin with the breast and the neck's slope (no ball); on his left it lies forward along the lifted arm, under the mantle
    if (s > 0) F.egg(g, 0.3, [-6.62, 10.04, 1.98], [0.6, 0.8, 0.5], [-0.3, 0, 0]);
    else F.egg(g, 0.3, [-6.3, 10.18, -2.02], [0.86, 0.64, 0.6], [0, 0.5, -0.12]);
    // the back's broad muscle (it makes the trunk taper from the armpits to the waist) and the shoulder blade
    F.egg(g, 0.3, [-6.95, 9.5, 1.16 * s], [0.6, 1.05, 0.46]);
    F.egg(g, 0.4, [-7.25, 9.6, 0.8 * s], [0.42, 1.0, 0.7]);
    // the slope from the neck out to the shoulder's point; the collar bone, a low ridge bowed forward then back
    F.cone(g, 0.3, [-6.85, 11.12, 0.32 * s], [-6.7, 10.62, 1.52 * s], 0.4, 0.28);
    F.cone(g, 0.3, [-6.05, 10.58, 0.17 * s], [-6.08, 10.66, 0.78 * s], 0.12, 0.11);
    F.cone(g, 0.3, [-6.08, 10.66, 0.78 * s], [-6.42, 10.76, 1.5 * s], 0.11, 0.12);
    // the edge of the ribs: a low soft arch from the breast bone's foot down and out to the flank
    F.cone(g, 0.28, [-5.88, 9.2, 0.16 * s], [-5.96, 8.8, 0.78 * s], 0.12, 0.13);
    F.cone(g, 0.28, [-5.96, 8.8, 0.78 * s], [-6.24, 8.46, 1.18 * s], 0.13, 0.13);
    // the belly's long muscle: one soft column a side, parted from the other by a shallow furrow
    F.egg(g, 0.3, [-5.82, 8.4, 0.38 * s], [0.2, 0.8, 0.38]);
    // the flank over the hip, with the fold under it
    F.egg(g, 0.25, [-6.3, 7.78, 1.08 * s], [0.6, 0.46, 0.36]);
  }
  // the neck, strong and round; the two cords that run from behind the ears down to the pit of the throat; the throat's knot
  F.cone(g, 0.3, [-6.72, 10.6, 0], [-6.62, 11.75, 0], 0.6, 0.53);
  for (const s of [1, -1]) F.cone(g, 0.2, [-6.5, 11.62, 0.5 * s], [-6.03, 10.72, 0.15 * s], 0.15, 0.11);
  F.egg(g, 0.14, [-6.08, 11.18, 0], [0.12, 0.2, 0.15]);
}
// hollows cut into the flesh, after everything is joined: the navel
function cutTrunk(F) {
  const g = G_TRUNK;
  F.egg(g, 0.12, [-5.62, 7.92, 0], [0.1, 0.1, 0.085], null, true);
  // the furrow between the breasts and down the belly, shallow; the pit of the throat
  F.egg(g, 0.2, [-5.5, 9.86, 0], [0.1, 0.56, 0.13], null, true);
  F.egg(g, 0.2, [-5.5, 8.62, 0], [0.08, 0.6, 0.08], null, true);
  F.egg(g, 0.1, [-5.93, 10.72, 0], [0.1, 0.1, 0.13], null, true);
}

function buildArmR(F) {
  const g = G_ARM_R, S = SHO(1), E = ELBOW_R, Wr = WRIST_R;
  F.cone(g, 0.2, S, E, 0.5, 0.4);
  // the upper arm's two swells: before (the bending muscle, fullest above the middle) and behind (the straightening
  // one, fullest higher up); between them, outside, the shoulder muscle's point comes down
  // (both low and long, one skin with the arm: a mature man's full arm, no athlete's cut)
  F.egg(g, 0.26, [-6.14, 8.88, 2.28], [0.36, 0.86, 0.4], [-0.3, 0, 0.1]);
  F.egg(g, 0.24, [-6.8, 9.05, 2.32], [0.34, 0.9, 0.42], [-0.3, 0, 0.06]);
  F.cone(g, 0.2, [-6.54, 9.56, 2.36], [-6.44, 8.8, 2.6], 0.3, 0.12);
  // the elbow: its point behind and below, a low knob at each side
  F.egg(g, 0.12, [-6.82, 7.5, 2.66], [0.19, 0.22, 0.19]);
  for (const sd of [1, -1]) F.egg(g, 0.12, [-6.36, 7.52, 2.66 + 0.44 * sd], [0.16, 0.16, 0.12]);
  // the forearm, fullest a hand below the elbow (one mass above and outside, one below and inside), turning and
  // drawn in to a flat wrist with the small bone standing out at its outer side
  F.cone(g, 0.2, E, [-4.9, 7.2, 2.72], 0.46, 0.31, [1, 0.86, 1]);
  F.cone(g, 0.16, [-4.9, 7.2, 2.72], Wr, 0.31, 0.27, [1, 0.72, 1]);
  F.egg(g, 0.16, [-5.52, 7.62, 2.88], [0.72, 0.33, 0.35], [0, 0, -0.27]);
  F.egg(g, 0.16, [-5.56, 7.3, 2.5], [0.64, 0.35, 0.33], [0, 0, -0.27]);
  F.egg(g, 0.06, [-4.46, 7.12, 2.98], [0.11, 0.09, 0.09]);
  // the open hand, palm up: the palm hollowed, the ball of the thumb and the heel of the hand, four fingers a little
  // apart and a little curled, each of three joints with its knuckle, the thumb out to the side
  const P = PALM_R;
  F.slab(g, 0.12, [P[0], P[1] - 0.06, P[2]], [0.46, 0.12, 0.4], 0.11);
  F.egg(g, 0.12, [P[0] - 0.25, P[1] + 0.02, P[2] + 0.26], [0.26, 0.12, 0.17]);
  F.egg(g, 0.12, [P[0] - 0.2, P[1] + 0.02, P[2] - 0.24], [0.3, 0.1, 0.14]);
  for (let f = 0; f < 4; f++) {
    const z0 = P[2] - 0.3 + f * 0.2, fan = (f - 1.5) * 0.075, len = [0.6, 0.7, 0.66, 0.5][f], x0 = P[0] + 0.4, r = [0.088, 0.092, 0.088, 0.078][f];
    const at = (t, up) => [x0 + len * t, P[1] - 0.03 + up, z0 + fan * t];
    const a = at(0, 0), b = at(0.42, 0.02), c = at(0.74, 0.07), d = at(1, 0.15 + 0.02 * f);
    F.cone(g, 0.03, a, b, r, r * 0.94); F.cone(g, 0.03, b, c, r * 0.94, r * 0.86); F.cone(g, 0.03, c, d, r * 0.86, r * 0.74);
    // the knuckle at the finger's root (it shows from below)
    F.egg(g, 0.05, [x0 - 0.02, P[1] - 0.1, z0], [0.1, 0.07, 0.09]);
  }
  F.cone(g, 0.06, [P[0] - 0.2, P[1] - 0.02, P[2] + 0.36], [P[0] + 0.2, P[1] + 0.05, P[2] + 0.64], 0.13, 0.105);
  F.cone(g, 0.04, [P[0] + 0.2, P[1] + 0.05, P[2] + 0.64], [P[0] + 0.5, P[1] + 0.12, P[2] + 0.7], 0.1, 0.08);
}

function buildArmL(F) {
  const g = G_ARM_L, S = SHO(-1), E = ELBOW_L, Wr = WRIST_L;
  // the upper arm reaches forward and out, a little below level: the bending muscle lies on top of it, the
  // straightening one hangs under it (that is the side a visitor below sees), the armpit's fold runs back to the ribs
  F.cone(g, 0.2, S, E, 0.56, 0.44);
  F.egg(g, 0.2, [-5.42, 10.36, -2.5], [0.8, 0.44, 0.42], [0, 0.5, -0.12]);
  F.egg(g, 0.2, [-5.5, 9.74, -2.46], [0.86, 0.4, 0.42], [0, 0.5, -0.12]);
  F.cone(g, 0.25, [-6.5, 9.5, -1.5], [-5.9, 9.7, -2.2], 0.4, 0.3);
  // the forearm rises to the staff: fullest a hand above the elbow, flat at the wrist
  F.cone(g, 0.2, E, [-3.3, 11.2, -3.06], 0.5, 0.33);
  F.cone(g, 0.16, [-3.3, 11.2, -3.06], Wr, 0.33, 0.28, [0.8, 1, 1]);
  F.egg(g, 0.2, [-3.95, 10.5, -3.1], [0.43, 0.65, 0.45], [0, 0, -0.6]);
  // the elbow: its point outside the bend, a low knob at each side
  F.egg(g, 0.12, [-4.2, 9.54, -3.3], [0.19, 0.21, 0.19]);
  F.egg(g, 0.12, [-4.12, 9.74, -2.76], [0.14, 0.14, 0.12]);
  F.egg(g, 0.12, [-4.48, 10.06, -3.48], [0.14, 0.14, 0.12]);
  // the hand closed round the staff: the palm behind it, four fingers round its outer side (each of three joints, a
  // little apart, the knuckles in a row), the thumb round the inner side and laid over the first finger
  const x = SCEPTRE_X, z = SCEPTRE_Z, y = GRIP_Y;
  F.egg(g, 0.12, [x - 0.26, y - 0.02, z - 0.03], [0.2, 0.4, 0.33]);
  for (let f = 0; f < 4; f++) {
    const fy = y + 0.3 - f * 0.2, r = 0.09 - 0.005 * f;
    F.cone(g, 0.035, [x - 0.2, fy, z - 0.3], [x + 0.08, fy - 0.02, z - 0.31], r, r);
    F.cone(g, 0.035, [x + 0.08, fy - 0.02, z - 0.31], [x + 0.26, fy - 0.03, z - 0.06], r, r * 0.92);
    F.cone(g, 0.035, [x + 0.26, fy - 0.03, z - 0.06], [x + 0.14, fy - 0.03, z + 0.17], r * 0.92, r * 0.8);
    F.egg(g, 0.05, [x - 0.2, fy, z - 0.33], [0.1, 0.085, 0.08]);
  }
  F.cone(g, 0.06, [x - 0.24, y + 0.2, z + 0.24], [x + 0.06, y + 0.3, z + 0.27], 0.12, 0.1);
  F.cone(g, 0.05, [x + 0.06, y + 0.3, z + 0.27], [x + 0.25, y + 0.22, z + 0.1], 0.1, 0.085);
}

// steady streams of chance (the statue is the same on every visit: it takes nothing from the world's seed). Each
// thing that wants chance has a stream of its own, named: what one row of ornament draws never moves another
function steadyStream(name) {
  let a = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) a = Math.imul(a ^ name.charCodeAt(i), 0x01000193);
  a >>>= 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  return r;
}

// the head: broad, calm, level brows, eyes modelled only, closed lips. FX is the face's front, EY the eyes' height.
const FX = SKULL[0] + 0.86, EY = EYES;
const EYE_FORMS = [], EYE_X = FX - 0.345, EYE_Z = 0.31, EYE_BALL = 0.172;
function buildHead(F) {
  EYE_FORMS.length = 0;
  const g = G_HEAD, X = SKULL[0];
  F.egg(g, 0.3, [X - 0.02, 12.6, 0], [0.82, 0.62, 0.74]);
  // the face's mass (the eyes lie in what the brow, the nose and the cheekbones leave hollow), the jaw, the brow's dome
  F.egg(g, 0.3, [X + 0.25, 12.2, 0], [0.5, 0.64, 0.62]);
  F.egg(g, 0.3, [X + 0.3, 11.9, 0], [0.5, 0.42, 0.52]);
  F.egg(g, 0.25, [X + 0.3, 12.03, 0], [0.53, 0.3, 0.6]);
  F.egg(g, 0.25, [X + 0.5, 12.8, 0], [0.34, 0.27, 0.58]);
  for (const s of [1, -1]) {
    // the brow: level, a soft ridge that is highest over the eye's middle and dies away at the temple
    F.cone(g, 0.2, [FX - 0.1, EY + 0.2, 0.1 * s], [FX - 0.14, EY + 0.22, 0.33 * s], 0.08, 0.075);
    F.cone(g, 0.2, [FX - 0.14, EY + 0.22, 0.33 * s], [FX - 0.29, EY + 0.175, 0.58 * s], 0.075, 0.055);
    // the cheekbone, broad and high, well behind the brow's front; the cheek's fullness beside the nose and the mouth
    // (both lie back from the nose and the brow: seen from below the face has planes, it is no flat shield)
    F.egg(g, 0.3, [FX - 0.35, EY - 0.27, 0.39 * s], [0.23, 0.15, 0.24]);
    F.egg(g, 0.25, [FX - 0.3, 12.02, 0.29 * s], [0.19, 0.2, 0.2]);
    // the eye, modelled only: the two lids as one shell with an almond opening (the outer corner a little the
    // higher), set deep under the brow, and the ball inside it: open, level, at rest
    // (the eye lies inside the face's mass; its socket is cut round it afterwards: see cutHead)
    const ex = EYE_X, ez = EYE_Z * s;
    EYE_FORMS.push(F.lid(g, 0.02, [ex, EY, ez], 0.22, 0.08, 0.072, 0.13, 0.05 * s), F.egg(g, 0.008, [ex, EY - 0.003, ez], [EYE_BALL, EYE_BALL, EYE_BALL]));
    // the nostril's wing
    F.egg(g, 0.09, [FX + 0.0, 12.02, 0.108 * s], [0.085, 0.062, 0.066]);
    // the ear: only its lower half and the lobe show under the hair
    F.egg(g, 0.05, [X + 0.0, 12.2, 0.67 * s], [0.1, 0.17, 0.06], [0, 0.25 * s, -0.2]);
    F.egg(g, 0.04, [X + 0.03, 12.06, 0.665 * s], [0.06, 0.07, 0.045]);
  }
  // the nose: straight from the brow, its ridge, its side walls going down into the cheeks, its end one form with the
  // wings (no ball), and under it a soft flat base from the tip back to the lip
  F.egg(g, 0.15, [FX - 0.15, EY + 0.2, 0], [0.1, 0.1, 0.15]);
  F.cone(g, 0.1, [FX - 0.06, EY + 0.13, 0], [FX + 0.15, 12.08, 0], 0.065, 0.08);
  F.cone(g, 0.1, [FX - 0.12, EY + 0.06, 0], [FX - 0.01, 12.05, 0], 0.075, 0.13);
  F.egg(g, 0.1, [FX + 0.145, 12.055, 0], [0.09, 0.075, 0.085]);
  F.egg(g, 0.07, [FX + 0.06, 12.0, 0], [0.12, 0.045, 0.115]);
  // the mouth's swell and the lips, closed and at rest (the upper one lies under the moustache)
  F.egg(g, 0.2, [FX - 0.18, 11.82, 0], [0.22, 0.24, 0.34]);
  F.egg(g, 0.04, [FX - 0.04, 11.79, 0], [0.06, 0.04, 0.17]);
  F.egg(g, 0.04, [FX - 0.05, 11.705, 0], [0.068, 0.052, 0.15]);
}
function cutHead(F) {
  const g = G_HEAD;
  for (const s of [1, -1]) {
    // the nostril, a small shallow oval under the wing; the eye's socket, between the brow, the nose and the cheekbone
    F.egg(g, 0.03, [FX + 0.055, 11.962, 0.062 * s], [0.045, 0.022, 0.03], null, true);
    F.socket(g, 0.05, [FX - 0.03, EY, EYE_Z * s], [0.175, 0.11, 0.21], EYE_FORMS[s > 0 ? 0 : 2], EYE_FORMS[s > 0 ? 1 : 3]);
    // the hollow of the ear
    F.egg(g, 0.03, [SKULL[0] + 0.02, 12.17, 0.74 * s], [0.045, 0.07, 0.04], null, true);
  }
  F.egg(g, 0.02, [FX + 0.02, 11.752, 0], [0.07, 0.012, 0.19], null, true);
}

// hair: a cap, and over it long locks swept from a parting out and back over the ears, hanging as wavy tresses on the
// neck; under the wreath a fringe of waves that comes down each temple before the ear to the beard, so the face is
// framed by locks; the beard: a deep mass from the cheeks down, set with rows of thick locks, each a wave that ends in
// a curl; the full moustache
const CAP = [SKULL[0] - 0.08, 12.66, 0], CAP_R = [0.86, 0.628, 0.8];
const capAt = (lon, lat, out) => [CAP[0] + (CAP_R[0] + out) * Math.cos(lat) * Math.cos(lon), CAP[1] + (CAP_R[1] + out) * Math.sin(lat), CAP[2] + (CAP_R[2] + out) * Math.cos(lat) * Math.sin(lon)];
function buildHair(F, rnd) {
  const g = G_HAIR, D = Math.PI / 180;
  F.egg(g, 0.08, CAP, CAP_R);
  // the mass of hair behind and beside the neck that the tresses lie on
  F.cone(g, 0.15, [-6.86, 12.2, 0], [-6.98, 11.3, 0], 0.62, 0.68, [1, 1, 1.15]);
  const N = 19;
  for (const s of [1, -1]) {
    for (let j = 0; j < N; j++) {
      const t = j / (N - 1), lon0 = (10 + 160 * t) * D, lon1 = (62 + 108 * t) * D, ph = rnd() * 6.28, wav = rnd.range(0.07, 0.12), r0 = rnd.range(0.105, 0.13);
      let prev = null;
      const steps = t < 0.55 ? 6 : 4;
      for (let q = 0; q <= steps; q++) {
        const a = q / steps, e = a * a * (3 - 2 * a);
        const lat = (70 - 104 * a) * D, lon = (lon0 + (lon1 - lon0) * e + wav * Math.sin(ph + a * 7)) * s;
        const p = capAt(lon, lat, 0.035);
        if (prev) F.cone(g, 0.04, prev, p, r0 * (1 - 0.1 * a), r0 * (1 - 0.1 * (a + 1 / steps)));
        prev = p;
      }
      // the tress: from under the ear down on to the neck and the shoulder, in waves (those behind, which no one
      // sees, are plainer), thinning to its end
      const ang = lon1 * s, len = rnd.range(1.05, 1.5), nSeg = t < 0.5 ? 5 : 2;
      for (let q = 1; q <= nSeg; q++) {
        const a = q / nSeg, rad = 0.8 + 0.15 * a + 0.045 * Math.cos(ph * 1.7 + a * 5.5), an = ang + 0.13 * s * Math.sin(ph + a * 6.5);
        const p = [-6.66 + rad * Math.cos(an) * 0.95, prev[1] - len / nSeg, rad * Math.sin(an)];
        if (p[1] < 10.98) p[1] = 10.98 + 0.02 * q;
        F.cone(g, 0.04, prev, p, r0 * (0.95 - 0.34 * (a - 1 / nSeg)), r0 * (0.95 - 0.34 * a));
        prev = p;
      }
    }
    // the fringe: five waves that lie along the hairline, each over the root of the next, from the parting under the
    // wreath out over the temple and down before the ear
    const line = (u, out) => capAt(s * (8 + 70 * u) * D, (24 - 48 * Math.pow(Math.max(0, u), 1.5)) * D, out);
    for (let q = 0; q < 5; q++) {
      const u0 = q * 0.19 - 0.04, ph = rnd() * 6.28, r0 = rnd.range(0.08, 0.092);
      let prev = null;
      for (let i = 0; i <= 4; i++) {
        const a = i / 4, p = line(u0 + 0.3 * a, 0.06 + 0.02 * Math.sin(ph + a * 4)), w = 0.035 * Math.sin(a * 6.283 + ph);
        p[1] += w;
        if (prev) F.cone(g, 0.035, prev, p, r0 * (1 - 0.3 * (a - 0.25)), r0 * (1 - 0.3 * a));
        prev = p;
      }
    }
    // the lock that comes down before the ear into the beard
    const e = line(1, 0.06);
    F.cone(g, 0.04, e, [e[0] + 0.07, e[1] - 0.17, e[2] - 0.03 * s], 0.075, 0.07);
    F.cone(g, 0.04, [e[0] + 0.07, e[1] - 0.17, e[2] - 0.03 * s], [e[0] + 0.1, e[1] - 0.33, e[2] - 0.08 * s], 0.07, 0.06);
  }
}
function buildBeard(F, rnd) {
  const g = G_HAIR;
  // the mass the locks lie on, a hand behind their fronts, so that there is depth between them and no dark pocket
  F.egg(g, 0.12, [FX - 0.35, 11.38, 0], [0.34, 0.55, 0.46]);
  // (its lower end lies behind the breast's own skin: where gold and ivory lay in one plane neither was drawn clean)
  F.egg(g, 0.1, [FX - 0.5, 10.9, 0], [0.17, 0.3, 0.27]);
  for (const s of [1, -1]) {
    F.egg(g, 0.12, [FX - 0.49, 11.72, 0.46 * s], [0.23, 0.42, 0.19]);
    // the moustache: full, from under the nose out over the lip and down past the mouth's corner into the beard,
    // its end turned in
    const m = [[FX + 0.035, 11.9, 0.035 * s], [FX + 0.03, 11.848, 0.2 * s], [FX - 0.05, 11.745, 0.34 * s], [FX - 0.15, 11.61, 0.4 * s], [FX - 0.17, 11.52, 0.355 * s]], mr = [0.068, 0.082, 0.07, 0.052, 0.036];
    for (let i = 0; i + 1 < m.length; i++) F.cone(g, 0.03, m[i], m[i + 1], mr[i], mr[i + 1]);
  }
  // one lock: at the angle a round the beard (wz its half breadth there), its head at y: a thick wave down the
  // beard's skin that ends in a curl turned to the side `turn`
  const lock = (a, y, back, wz, turn, len, r) => {
    const sa = Math.sin(a), ca = Math.cos(a), tl = Math.hypot(0.36 * sa, wz * ca), tx = -0.36 * sa / tl * turn, tz = wz * ca / tl * turn;
    const at = (yy, out, side) => [FX - 0.345 - back + (0.36 + out) * ca + tx * side, yy, (wz - 0.015 + out) * sa + tz * side];
    const p0 = at(y + 0.1, -0.03, 0), p1 = at(y + 0.1 - len * 0.3, 0.0, 0.045), p2 = at(y + 0.1 - len * 0.62, 0.0, -0.03), p3 = at(y + 0.1 - len * 0.9, 0.015, 0.0);
    F.cone(g, 0.03, p0, p1, r * 0.85, r); F.cone(g, 0.03, p1, p2, r, r * 0.92); F.cone(g, 0.03, p2, p3, r * 0.92, r * 0.72);
    // the curl: three quarters of a turn, standing a little proud
    const rc = 0.6 * r, yc = y + 0.1 - len * 0.9;
    let prev = p3;
    for (let i = 1; i <= 3; i++) {
      const f = Math.PI * (1 + 0.5 * i), q = at(yc + rc * Math.sin(f), 0.015 + 0.016 * i, rc + rc * Math.cos(f));
      F.cone(g, 0.02, prev, q, r * (0.72 - 0.09 * (i - 1)), r * (0.72 - 0.09 * i));
      prev = q;
    }
  };
  // rows of locks down the beard, each row over the heads of the next and set between its locks
  const rows = [[11.42, 5, 0.86, 0.04], [11.19, 6, 0.9, 0.03], [10.97, 5, 0.72, 0.07], [10.77, 3, 0.4, 0.17]];
  rows.forEach(([y, n, half, back], ri) => {
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) * 2 - 1) * half + rnd.range(-0.03, 0.03);
      lock(a, y + rnd.range(-0.02, 0.02), back, 0.5, (a < -0.05 ? -1 : a > 0.05 ? 1 : (ri & 1 ? 1 : -1)), rnd.range(0.3, 0.36), rnd.range(0.082, 0.092));
    }
  });
  // on each cheek, from the ear down to the jaw, and beside the mouth under the moustache's end
  for (const s of [1, -1]) {
    for (let ri = 0; ri < 3; ri++) for (let i = 0; i < 2; i++) lock(s * (0.98 + 0.34 * i + rnd.range(-0.03, 0.03)), 12.0 - 0.22 * ri - 0.08 * i, 0.15, 0.66, s, rnd.range(0.28, 0.33), rnd.range(0.075, 0.085));
    lock(s * 0.5, 11.6, 0.2, 0.5, s, 0.27, 0.075);
  }
}

function buildFeet(F) {
  TOE_NAILS.length = 0;
  for (const s of [1, -1]) {
    const A = ANKLE(s), z = A[2];
    F.cone(G_FEET, 0.15, A, [A[0] - 0.1, 2.42, z], 0.34, 0.3);
    F.cone(G_FEET, 0.15, [-2.32, 2.36, z], [-1.2, 2.3, z + 0.02 * s], 0.3, 0.24, [1, 1, 1.25]);
    F.cone(G_FEET, 0.15, [-1.6, 2.5, z], [-0.95, 2.24, z + 0.03 * s], 0.3, 0.17, [1, 1, 1.6]);
    // five toes, the great one inmost and a little apart from the rest; each ends in a small flat for its nail
    for (let t = 0; t < 5; t++) {
      const tz = z + s * [-0.315, -0.08, 0.08, 0.228, 0.362][t], len = [0.5, 0.47, 0.41, 0.34, 0.26][t], r = [0.118, 0.084, 0.079, 0.073, 0.066][t], x0 = -0.98 - 0.05 * t;
      F.cone(G_FEET, 0.05, [x0, 2.21, tz], [x0 + len * 0.6, 2.17, tz], r, r * 0.92);
      F.cone(G_FEET, 0.04, [x0 + len * 0.6, 2.17, tz], [x0 + len, 2.115, tz], r * 0.92, r * 0.86);
      TOE_NAILS.push([x0 + len - 0.02, 2.115 + r * 0.86 + 0.012, tz, r]);
    }
    // the sandal: a thick sole; a strap across the instep; a thong from between the great toe and the next up the
    // foot's ridge to that strap; a strap from each end of it back round the heel
    F.slab(G_SANDAL, 0.02, [-1.42, STOOL_TOP + 0.06, z], [1.24, 0.065, 0.48], 0.04);
    const arch = [[-0.48, 2.16], [-0.475, 2.46], [-0.325, 2.67], [0, 2.715], [0.325, 2.67], [0.475, 2.46], [0.48, 2.16]];
    for (let q = 0; q + 1 < arch.length; q++) F.cone(G_SANDAL, 0.03, [-1.52, arch[q][1], z + arch[q][0]], [-1.52, arch[q + 1][1], z + arch[q + 1][0]], 0.062, 0.062, [1.7, 1, 1]);
    F.cone(G_SANDAL, 0.03, [-0.94, 2.27, z - 0.19 * s], [-1.14, 2.58, z - 0.14 * s], 0.045, 0.05);
    F.cone(G_SANDAL, 0.03, [-1.14, 2.58, z - 0.14 * s], [-1.5, 2.71, z - 0.04 * s], 0.05, 0.06);
    for (const sd of [1, -1]) F.cone(G_SANDAL, 0.03, [-1.56, 2.3, z + 0.475 * sd], [-2.32, 2.27, z + 0.4 * sd], 0.06, 0.06, [1, 1.4, 1]);
  }
}
// the flat of each toe's nail, cut after everything is joined
const TOE_NAILS = [];
function cutFeet(F) {
  for (const [x, y, z, r] of TOE_NAILS) F.slab(G_FEET, 0.012, [x, y + 0.04, z], [0.085 + r * 0.3, 0.04, r * 0.72], 0.01, [0, 0, -0.1], true);
}

const ROLL = [[-6.5, 7.5, 1.72], [-5.72, 7.44, 1.1], [-5.38, 7.42, 0.2], [-5.46, 7.56, -0.7], [-5.93, 7.86, -1.4], [-6.6, 8.3, -1.55]];
// the mantle: round the hips and the legs to the ankles, a roll across the lap, and (its own group) the end that
// comes up the back and over the left shoulder
function buildMantle(F) {
  const g = G_CLOTH, k = 0.3;
  F.egg(g, k, [-6.62, 6.9, 0], [1.2, 1.02, 1.82]);
  for (const s of [1, -1]) {
    const H = HIP(s), K = KNEE(s), A = ANKLE(s);
    F.cone(g, k, [H[0], H[1] + 0.03, H[2]], K, 0.88, 0.6);
    F.cone(g, 0.25, K, [A[0] - 0.04, 2.86, A[2]], 0.6, 0.46, [1, 1, 1.2]);
    // the fall of cloth outside each leg: a thin sheet, and on it four heavy pipes that widen as they fall
    F.slab(g, 0.3, [-2.9, 4.25, 1.76 * s], [0.7, 1.7, 0.14], 0.13);
    for (let j = 0; j < 4; j++) {
      const x = -2.22 - 0.43 * j, zt = 1.74 + 0.05 * (j & 1), zb = j < 2 ? 1.97 - 0.05 * j : 1.86;
      F.cone(g, 0.12, [x + 0.12, 5.75 - 0.12 * j, zt * s], [x, 2.52 + 0.07 * ((j * 3) & 3), zb * s], 0.13, 0.24 - 0.012 * j);
    }
    // where the cloth breaks over the foot
    F.egg(g, 0.2, [A[0] - 0.06, 2.78, A[2]], [0.55, 0.2, 0.6]);
  }
  // the cloth slung between the thighs
  F.slab(g, 0.3, [-4.7, 5.9, 0], [1.75, 0.36, 1.2], 0.3);
  // between the shins it hangs back from them as a sheet, and across it heavy swags are slung from shin to shin,
  // each lower one sagging deeper; the lowest is the hem between the feet
  F.cone(g, 0.3, [-2.92, 5.7, 0], [-2.4, 2.72, 0], 0.3, 0.3, [1, 1, 3.6]);
  // each swag is one long ridge: slung between the shins, drawn up over each shin's front, falling away outside
  const SW_Y = [5.5, 5.02, 4.4, 3.86, 3.24], SW_SAG = [0.3, 0.44, 0.5, 0.64, 0.7], SW_R = [0.115, 0.15, 0.125, 0.16, 0.145];
  for (let i = 0; i < 5; i++) {
    const y0 = SW_Y[i], sag = SW_SAG[i], r = SW_R[i], lean = (i & 1 ? 0.07 : -0.05);
    for (const s of [1, -1]) {
      let prev = null;
      // from the middle out to the shin's inner face
      for (let j = 0; j <= 4; j++) {
        const u = j / 4, m = 1 - Math.pow(u, 1.7), zin = 0.9 - 0.02 * i;
        const pt = [-2.6 + (5.72 - y0) * 0.19 + 0.26 - 0.24 * m, y0 - sag * m, s * u * zin + lean * m];
        if (prev) F.cone(g, 0.16, prev, pt, r, r * (j === 4 ? 0.8 : 1));
        prev = pt;
      }
      // up onto the shin's inner front, where it dies away: the cloth lies taut over the shin itself
      const t = (5.72 - y0 - 0.1) / 2.86, rs = 0.6 - 0.14 * t - 0.05;
      F.cone(g, 0.16, prev, [-2.6 + 0.54 * t + rs * 0.82, y0 + 0.14, s * (1.28 - 0.24 * t - 1.2 * rs * 0.57)], r * 0.8, r * 0.3);
    }
  }
  // the roll across the lap, from the right hip round to the left flank
  for (let i = 0; i + 1 < ROLL.length; i++) F.cone(g, 0.16, ROLL[i], ROLL[i + 1], 0.33, 0.33, [1, 0.9, 1]);
  const d = G_DRAPE;
  // the end of the mantle: up the back and over the shoulder's top to the breast; from the breast it hangs free and
  // straight, in two lengths (the inner the longer: a stepped hem), each a plain sheet that the folds are raised on
  const over = [[-7.55, 9.6, -1.1], [-7.34, 10.62, -1.42], [-6.66, 11.0, -1.5], [-5.98, 10.64, -1.42], [-5.62, 10.02, -1.38]];
  const wide = [3.4, 3.4, 3.2, 3.2];
  for (let i = 0; i + 1 < over.length; i++) F.cone(d, 0.2, over[i], over[i + 1], 0.16, i > 2 ? 0.13 : 0.16, [1, 1, wide[i]]);
  F.slab(d, 0.12, [-5.57, 9.37, -1.12], [0.075, 0.68, 0.27], 0.07);
  F.slab(d, 0.12, [-5.6, 9.57, -1.63], [0.075, 0.5, 0.27], 0.07);
  // over the left shoulder and the lifted arm's first third: the cloth lies on them as one skin
  F.egg(d, 0.2, [-6.3, 10.2, -2.04], [0.93, 0.73, 0.69], [0, 0.5, -0.12]);
  // down the back
  F.slab(d, 0.3, [-7.55, 8.6, -0.5], [0.22, 1.9, 1.5], 0.2);
}

// the mantle's folds, as a swelling of the cloth's own skin (metres, + outward). Each kind of fold lives where the
// cloth does that thing: slung in deepening bows between the shins, falling in pipes outside the legs, drawn in rays
// from the lap out over the thighs, bowed across between the thighs, twisted in the roll; the knees stay smooth.
const sstep = (a, b, v) => { let t = (v - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
// a fold's section: broad round crests, narrow valleys; t in turns, result -0.5 to 0.5
const pipe = (t) => { const c = Math.cos(Math.PI * t); return Math.sqrt(c * c + 0.035) - 0.56; };
const FOLD_SWELL = 0.09;
function clothFold(x, y, z) {
  const az = z < 0 ? -z : z, s = z < 0 ? -1 : 1;
  const wob = 0.09 * Math.sin(1.9 * y + 2.6 * z + 0.7 * x) + 0.05 * Math.sin(3.1 * x - 1.3 * y + 1.7 * z);
  let f = 0;
  if (y < 6.25) {
    // below the knees
    const low = sstep(2.25, 2.7, y), top = 1 - sstep(5.3, 5.95, y);
    // (a) between the shins: bows slung from knee to knee, each lower one sagging more
    let u = z / 1.12; u = u < -1 ? -1 : u > 1 ? 1 : u;
    const mid = 1 - u * u, sag = 0.55 + 0.16 * (5.9 - y);
    const front = sstep(-3.3, -2.9, x);
    f += 0.02 * mid * front * low * (1 - sstep(5.6, 6.2, y)) * Math.sin(Math.PI * 2 * ((y + sag * mid) / 0.285 + wob));
    // (b) on each shin: the cloth lies close; a few drawn folds slant from the knee to the outer hem
    const on = sstep(0.75, 1.0, az) * (1 - sstep(1.45, 1.7, az)) * front;
    f += 0.022 * on * low * top * pipe((y * 0.5 + (az - 1.1) * 1.9) / 0.62 + wob);
    // (c) outside each leg and round to the back: pipes hanging straight
    const out = sstep(1.5, 1.75, az) + (1 - front);
    f += 0.045 * (out > 1 ? 1 : out) * low * (1 - sstep(5.4, 6.1, y)) * pipe((x * 0.9 + az * 0.5) / 0.43 + 0.06 * Math.sin(2.2 * y + 3 * s) + wob * 0.5);
  }
  if (y > 5.45 && y < 7.45) {
    // the lap and the thighs, out to the knees; none on the kneecap, none under the roll
    const kx = x + 2.6, kz = az - 1.28, ky = y - 5.72, knee = sstep(0.55, 1.15, Math.sqrt(kx * kx + kz * kz + ky * ky));
    const lap = sstep(5.45, 5.95, y) * knee * (1 - sstep(-6.5, -5.9, -x - 12.4)) * sstep(-6.6, -6.0, x);
    // (d) rays from the lap out over each thigh
    const th = Math.atan2(az, x + 7.2), dist = Math.sqrt((x + 7.2) * (x + 7.2) + z * z);
    f += 0.1 * lap * sstep(0.45, 0.8, az) * sstep(1.6, 2.6, dist) * pipe(th * 6.4 + wob + 0.3 * s);
    // bows across between the thighs
    let v = z / 0.95; v = v < -1 ? -1 : v > 1 ? 1 : v;
    f += 0.1 * lap * (1 - v * v) * pipe((x - 0.55 * (1 - v * v)) / 0.6 + wob);
  }
  if (y > 7.1 && y < 8.75) {
    // (f) the roll across the lap: rolled cloth, a few broad folds wound round it like the strands of a rope
    let i = 0;
    while (i < ROLL.length - 2 && z < ROLL[i + 1][2]) i++;
    const A = ROLL[i], Bq = ROLL[i + 1];
    let t = (z - A[2]) / (Bq[2] - A[2]); t = t < -0.3 ? -0.3 : t > 1.3 ? 1.3 : t;
    const dx = x - (A[0] + (Bq[0] - A[0]) * t), dy = y - (A[1] + (Bq[1] - A[1]) * t), rr = Math.sqrt(dx * dx + dy * dy);
    if (rr < 0.7) f += 0.06 * (1 - sstep(0.44, 0.66, rr)) * Math.sin(Math.atan2(dy, dx) * 2 + z * 4.6 + 0.6 * Math.sin(z * 2.3));
  }
  return f;
}
function drapeFold(x, y, z) {
  const wob = 0.1 * Math.sin(2.3 * y + 1.9 * z) + 0.06 * Math.sin(3.3 * x + 1.1 * y);
  // the end hanging before the breast falls in pipes; over the shoulder and the arm the folds run along the cloth
  const hang = sstep(-6.3, -5.9, x) * (1 - sstep(10.2, 10.7, y));
  // (the hanging folds die out into each length's hem; the folds on the shoulder lie round the arm)
  const hem = z > -1.37 ? 8.7 : 9.08, fade = sstep(hem, hem + 0.32, y);
  return 0.055 * hang * fade * pipe(z / 0.26 + wob) + 0.05 * (1 - hang) * pipe((x * 0.877 - z * 0.48 - y * 0.12) / 0.3 + wob);
}

function buildGod() {
  const F = makeField(N_GROUPS), gr = F.groups;
  gr[G_TRUNK].join = 0.1; gr[G_ARM_R].join = 0.3; gr[G_ARM_L].join = 0.3; gr[G_HEAD].join = 0.22; gr[G_FEET].join = 0.05;
  for (const g of [G_CLOTH, G_HAIR, G_SANDAL, G_DRAPE]) gr[g].mat = 1;
  gr[G_CLOTH].join = 0.1; gr[G_HAIR].join = 0.04; gr[G_SANDAL].join = 0.02; gr[G_DRAPE].join = 0.12;
  gr[G_CLOTH].fold = clothFold; gr[G_CLOTH].swell = FOLD_SWELL; gr[G_DRAPE].fold = drapeFold; gr[G_DRAPE].swell = 0.05;
  buildTrunk(F); buildArmR(F); buildArmL(F); buildHead(F); buildFeet(F); buildMantle(F); buildHair(F, steadyStream('the hair')); buildBeard(F, steadyStream('the beard')); cutHead(F); cutTrunk(F); cutFeet(F);
  return F;
}

// ---- built work: plain blocks, drums and turned forms gathered into one geometry ----
// kinds of stuff a built corner can be (the shader reads it): ivory, gold, ebony, the base's blue black stone, a stone
// or a paint of its own colour
const IVORY = 0, GOLD = 1, EBONY = 2, STONE = 3, GEM = 4;
function makeBuilt() {
  // corners gathered into typed stores that grow by doubling (plain arrays cost the build a tenth of a second)
  let cap = 4096, n = 0, pos = new Float32Array(cap * 3), nor = new Float32Array(cap * 3), aux = new Float32Array(cap * 3), col = new Float32Array(cap * 3);
  const B = { tris: () => n / 3 };
  const tint = [1, 1, 1];
  B.tint = (r, g, b) => { tint[0] = r; tint[1] = g; tint[2] = b; };
  function corner(x, y, z, nx, ny, nz, kind, shade) {
    if (n === cap) {
      cap *= 2;
      let a = new Float32Array(cap * 3); a.set(pos); pos = a;
      a = new Float32Array(cap * 3); a.set(nor); nor = a;
      a = new Float32Array(cap * 3); a.set(aux); aux = a;
      a = new Float32Array(cap * 3); a.set(col); col = a;
    }
    const o = n * 3;
    pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz;
    aux[o] = kind; aux[o + 1] = shade; aux[o + 2] = 0; col[o] = tint[0]; col[o + 1] = tint[1]; col[o + 2] = tint[2];
    n++;
  }
  // a flat four sided face a, b, c, d (counter clockwise seen from outside) with one normal
  B.quad = (a, b, c, d, kind, shade = 0) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const p of [a, b, c, a, c, d]) corner(p[0], p[1], p[2], nx, ny, nz, kind, shade);
  };
  // a block from (x0, y0, z0) to (x1, y1, z1); skip: a string of faces to leave out ('b' bottom, 't' top)
  B.block = (x0, y0, z0, x1, y1, z1, kind, skip = 'b', shade = 0) => {
    B.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], kind, shade);
    B.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], kind, shade);
    B.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], kind, shade);
    B.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], kind, shade);
    if (!skip.includes('t')) B.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], kind, shade);
    if (!skip.includes('b')) B.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], kind, shade);
  };
  // a turned form about a vertical axis at (cx, cz): prof is a list of [radius, y]; smooth sides, n sides round
  B.turned = (cx, cz, prof, n, kind, shade = 0, squash = 1) => {
    for (let r = 0; r + 1 < prof.length; r++) {
      const [ra, ya] = prof[r], [rb, yb] = prof[r + 1];
      const sl = Math.atan2(ra - rb, yb - ya), cs = Math.cos(sl), sn = Math.sin(sl);
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const P = (c, s2, rr, y) => [cx + c * rr, y, cz + s2 * rr * squash];
        const q = [[c0, s0, ra, ya], [c0, s0, rb, yb], [c1, s1, rb, yb], [c0, s0, ra, ya], [c1, s1, rb, yb], [c1, s1, ra, ya]];
        for (const [c, s2, rr, y] of q) { const p = P(c, s2, rr, y); corner(p[0], p[1], p[2], c * cs, sn, s2 * cs, kind, shade); }
      }
    }
  };
  // another geometry's corners (places, normals) set in by a matrix, as one kind
  B.take = (g, m, kind, shade = 0) => {
    const p = g.pos, nn = g.nor, e = m.elements, n = p.length / 3;
    if (g.shade && g.shade.length !== n) throw new Error('zeus: a figure whose shades and corners differ');
    for (let i = 0; i < n; i++) {
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], a = nn[i * 3], b = nn[i * 3 + 1], c = nn[i * 3 + 2];
      const nx = e[0] * a + e[4] * b + e[8] * c, ny = e[1] * a + e[5] * b + e[9] * c, nz = e[2] * a + e[6] * b + e[10] * c, l = Math.hypot(nx, ny, nz) || 1;
      corner(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14], nx / l, ny / l, nz / l, g.kind ? g.kind[i] : kind, g.shade ? g.shade[i] : shade);
    }
  };
  B.geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor.slice(0, n * 3), 3));
    g.setAttribute('aux', new THREE.BufferAttribute(aux.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(col.slice(0, n * 3), 3));
    return g;
  };
  return B;
}

// ---- small figures as lofted skins: a standing draped woman (the Graces, the Seasons, the Victory, and coarser the
// figures of the ornament). Her own axes: the feet's middle at the origin, +X her front, +Y up. No face is worked.
// o: { h height, seg sides round, fine: more rings, sway, knee (+1/-1: which knee is forward), flutes, phase,
//      arms: [right, left] each a list of points [x, y, z] in units of h (shoulder, elbow, wrist), dress, skin: kinds }
// (a ring's point may carry a fourth number: how shut in that corner lies, 0 open to 1, for the shade in a fold or at a foot)
function soup() { return { pos: [], nor: [], kind: [], shade: [] }; }
const ringMid = (ring) => { let x = 0, y = 0, z = 0; for (const p of ring) { x += p[0]; y += p[1]; z += p[2]; } return [x / ring.length, y / ring.length, z / ring.length]; };
// which way the end of a lofted skin faces at ring r: from the middle of the nearest ring that lies elsewhere to its own
function endFacing(rings, r) {
  const m = ringMid(rings[r]), step = r + 1 < rings.length && r < rings.length / 2 ? 1 : -1;
  for (let q = r + step; q >= 0 && q < rings.length; q += step) {
    const o = ringMid(rings[q]), d = [m[0] - o[0], m[1] - o[1], m[2] - o[2]];
    if (Math.hypot(d[0], d[1], d[2]) > 1e-7) return d;
  }
  return [0, 1, 0];
}
function loftInto(S, rings, seg, kind, closed = true) {
  // rings: lists of seg points; normals from the neighbours on the grid
  const nr = rings.length, N = [];
  for (let r = 0; r < nr; r++) {
    const row = [];
    for (let i = 0; i < seg; i++) {
      const a = rings[Math.min(nr - 1, r + 1)][i], b = rings[Math.max(0, r - 1)][i], c = rings[r][(i + 1) % seg], d = rings[r][(i + seg - 1) % seg];
      const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      // (a ring drawn into one point, a ball's pole or a limb's end, has no facing of its own: it takes the axis's)
      if (vx === 0 && vy === 0 && vz === 0) { const e = endFacing(rings, r); nx = e[0]; ny = e[1]; nz = e[2]; }
      const l = Math.hypot(nx, ny, nz) || 1;
      row.push([nx / l, ny / l, nz / l]);
    }
    N.push(row);
  }
  const put = (r, i) => { const p = rings[r][i % seg], n = N[r][i % seg]; S.pos.push(p[0], p[1], p[2]); S.nor.push(n[0], n[1], n[2]); S.kind.push(kind); S.shade.push(p[3] || 0); };
  for (let r = 0; r + 1 < nr; r++) for (let i = 0; i < (closed ? seg : seg - 1); i++) { put(r, i); put(r + 1, i); put(r + 1, i + 1); put(r, i); put(r + 1, i + 1); put(r, i + 1); }
}
// a limb or a staff: a tube through points with radii, n sides
function tubeInto(S, pts, radii, n, kind) {
  const rings = [];
  let ux = 0, uy = 0, uz = 0;
  for (let q = 0; q < pts.length; q++) {
    const a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    // two axes across the tube: the first ring's is chosen, every later ring carries the one before it along, so the
    // skin goes round a bend without a twist
    const d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz;
    if (Math.hypot(ux, uy, uz) < 1e-4) { if (Math.abs(ty) > 0.9) { ux = 0; uy = -tz; uz = ty; } else { ux = -tz; uy = 0; uz = tx; } }
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
    const ring = [];
    for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2, c = Math.cos(an) * radii[q], sn = -Math.sin(an) * radii[q]; ring.push([pts[q][0] + ux * c + vx * sn, pts[q][1] + uy * c + vy * sn, pts[q][2] + uz * c + vz * sn]); }
    rings.push(ring);
  }
  // closed at both ends by a point
  rings.unshift(rings[0].map(() => pts[0].slice()));
  rings.push(rings[rings.length - 1].map(() => pts[pts.length - 1].slice()));
  loftInto(S, rings, n, kind);
}
function ballInto(S, c, r, n, kind) {
  const rings = [], m = Math.max(3, n >> 1);
  for (let j = 0; j <= m; j++) {
    const la = -Math.PI / 2 + (j / m) * Math.PI, ring = [];
    for (let i = 0; i < n; i++) { const lo = (i / n) * Math.PI * 2; ring.push([c[0] + r[0] * Math.cos(la) * Math.cos(lo), c[1] + r[1] * Math.sin(la), c[2] + r[2] * Math.cos(la) * Math.sin(lo)]); }
    rings.push(ring);
  }
  loftInto(S, rings, n, kind);
}
// the body's section up the height: [y, half depth (x), half width (z)] in units of h
const WOMAN = [[0, 0.1, 0.125], [0.03, 0.098, 0.122], [0.16, 0.085, 0.108], [0.3, 0.082, 0.104], [0.42, 0.088, 0.112], [0.5, 0.094, 0.122],
  [0.545, 0.092, 0.118], [0.55, 0.078, 0.1], [0.6, 0.068, 0.09], [0.66, 0.08, 0.098], [0.71, 0.086, 0.104], [0.76, 0.072, 0.112],
  [0.805, 0.05, 0.118], [0.83, 0.034, 0.07], [0.85, 0.027, 0.03], [0.875, 0.026, 0.028]];
// the same for the six women on the top rail, who are seen from near: squarer shoulders, a neck that carries the head
// the hem a little spread where the cloth breaks over the feet
const LADY = [[0, 0.112, 0.146], [0.025, 0.11, 0.142], [0.09, 0.094, 0.122]].concat(WOMAN.slice(2, 11), [[0.76, 0.074, 0.114], [0.795, 0.06, 0.126], [0.818, 0.047, 0.118], [0.836, 0.037, 0.074], [0.853, 0.032, 0.041], [0.885, 0.031, 0.034]]);
function drapedFigure(o) {
  const S = soup(), h = o.h, seg = o.seg, sway = (o.sway || 0) * 0.035 * h, knee = o.knee || 0, fl = o.flutes || 9, ph = o.phase || 0;
  const dress = o.dress === undefined ? GOLD : o.dress, skin = o.skin === undefined ? IVORY : o.skin;
  const W0 = o.lady ? LADY : WOMAN, cross = o.cross || 0, hd = o.head || [0, 0];
  const rows = o.coarse ? [0, 2, 4, 5, 8, 10, 12, 14, 15].map((q) => WOMAN[q]) : o.fine ? W0.flatMap((r, i) => (i + 1 < W0.length && W0[i + 1][0] - r[0] > 0.07 ? [r, r.map((v, k) => (v + W0[i + 1][k]) / 2)] : [r])) : W0;
  const rings = [];
  for (const [y, rx, rz] of rows) {
    const ring = [], low = 1 - Math.min(1, y / 0.55), cz = sway * Math.sin(Math.min(1, y / 0.8) * Math.PI);
    // the skirt's flutes deepen toward the hem; the overfold above the girdle has shallow ones
    const deep = o.lady ? (y < 0.547 ? 0.055 + 0.085 * low * low : y < 0.74 ? 0.03 : 0) : y < 0.547 ? 0.03 + 0.1 * low * low : y < 0.72 ? 0.02 : 0;
    for (let i = 0; i < seg; i++) {
      // (the women of the rail are seen from before: their sides stand closer together there than behind)
      const u = (i / seg) * Math.PI * 2, a = o.lady ? u - 0.5 * Math.sin(u) : u, c = Math.cos(a), sn = Math.sin(a);
      const fold = o.lady ? 2.2 * pipe((fl * a + ph + 1.3 * y) / (2 * Math.PI)) : Math.cos(fl * a + ph + 1.3 * y);
      let m = 1 + deep * fold;
      // one knee forward under the cloth
      if (knee) { const d = a - knee * 0.55; m += 0.2 * Math.exp(-d * d * 5) * Math.exp(-(y - 0.3) * (y - 0.3) * 60); }
      // (the women of the rail: the overfold's edge lies aslant, one fold across; the shoulders tip against the hips)
      const yy = y + (cross ? cross * 0.028 * Math.sin(a + 0.6) * Math.exp(-(y - 0.56) * (y - 0.56) * 260) - Math.sign(sway) * 0.012 * sn * sstep(0.68, 0.8, y) : 0);
      // shade: in the valleys of the folds, and where the hem meets what she stands on
      const sh = o.fine ? Math.min(0.85, Math.max(0, -fold) * deep * 9 + 0.7 * (1 - sstep(0, 0.035, y))) : 0;
      ring.push([rx * h * m * c, yy * h, cz + rz * h * m * sn, sh]);
    }
    rings.push(ring);
  }
  rings.unshift(rings[0].map((p) => [p[0] * 0.2, p[1], p[2] * 0.2, 0.8]));
  loftInto(S, rings, seg, dress);
  // the head: an oval of a face, the hair over its top, sides and back with a knot behind (no face is worked)
  const hn = Math.max(6, seg >> 1), tip = o.nod || 0;
  const hz = hd[1] * h, hx = hd[0] * h;
  if (o.lady) {
    // (seen from near: the face a narrower oval, the hair a fuller mass that comes down each side of it to the neck)
    ballInto(S, [(0.01 + tip) * h + hx, 0.932 * h, hz], [0.05 * h, 0.064 * h, 0.044 * h], hn, skin);
    ballInto(S, [(-0.02 + tip) * h + hx * 0.8, 0.953 * h, hz * 0.8], [0.068 * h, 0.06 * h, 0.066 * h], hn, dress);
    for (const sd of [1, -1]) ballInto(S, [(-0.016 + tip) * h + hx * 0.8, 0.912 * h, hz * 0.8 + sd * 0.047 * h], [0.04 * h, 0.046 * h, 0.024 * h], 6, dress);
    ballInto(S, [(-0.082 + tip) * h + hx * 0.4, 0.93 * h, hz * 0.3], [0.034 * h, 0.032 * h, 0.034 * h], 6, dress);
    // her feet: the toes show under the hem
    for (const sd of [1, -1]) ballInto(S, [0.108 * h, 0.012 * h, (sd * 0.05 + (knee > 0 ? 0.01 : -0.01)) * h], [0.034 * h, 0.013 * h, 0.021 * h], 6, skin);
  } else {
    ballInto(S, [(0.008 + tip) * h + hx, 0.933 * h, hz], [0.054 * h, 0.066 * h, 0.05 * h], o.coarse ? 5 : hn, skin);
    if (!o.coarse) {
      ballInto(S, [(-0.016 + tip) * h + hx * 0.8, 0.946 * h, hz * 0.8], [0.062 * h, 0.058 * h, 0.06 * h], hn, dress);
      ballInto(S, [(-0.078 + tip) * h + hx * 0.4, 0.93 * h, hz * 0.3], [0.032 * h, 0.03 * h, 0.032 * h], Math.max(5, hn - 2), dress);
    }
  }
  // the arms: bare, plain; the upper arm full, the hand a small closed shape
  const an = o.coarse ? 3 : Math.max(6, seg >> 2);
  for (const arm of o.arms || []) {
    const pts = arm.map((p) => [p[0] * h, p[1] * h, p[2] * h]), last = pts.length - 1;
    // the shoulder's point lies inside the body, so no gap shows
    pts[0][2] *= 0.82;
    tubeInto(S, pts, pts.map((p, q) => h * (o.lady ? (q === 0 ? 0.046 : 0.043 - 0.014 * q / last) : (q === 0 ? 0.04 : 0.036 - 0.012 * q / last))), an, skin);
    if (!o.coarse) ballInto(S, pts[last], o.lady ? [0.027 * h, 0.033 * h, 0.023 * h] : [0.024 * h, 0.03 * h, 0.02 * h], an, skin);
  }
  return S;
}

// a wing of flat feathers in three rows, for the side s (+1 her right), in her own axes: the root behind the shoulder,
// the bone going out and up, the long feathers standing up at the tip ("half raised"). size is the wing's reach.
function wingInto(S, s, root, size, kind, lift = 1, plain = false) {
  const feather = (b, d, len, wid, lay) => {
    // a flat blade from b along d; its face looks along x; both faces are drawn
    const dl = Math.hypot(d[1], d[2]) || 1, ay = d[1] / dl, az = d[2] / dl, px = -az, pz = ay;
    const x = b[0] + lay, m = [x, b[1] + ay * len * 0.45, b[2] + az * len * 0.45], t = [x - 0.2 * lay, b[1] + ay * len, b[2] + az * len];
    const l = [m[0], m[1] + px * wid, m[2] + pz * wid], r = [m[0], m[1] - px * wid, m[2] - pz * wid], o = [x, b[1], b[2]];
    // (each blade is ridged: its two halves face a little apart, so a row of feathers reads as a row; the root lies
    // in the shade of the row above. The outline is as it was.)
    for (const [A, Bq, C, nx, half] of [[o, t, l, 1, 1], [o, r, t, 1, -1], [o, l, t, -1, 1], [o, t, r, -1, -1]]) {
      const ny = 0.2 + 0.42 * half * px, nz = 0.33 * s + 0.42 * half * pz, nl = Math.hypot(0.92, ny, nz);
      for (const q of [A, Bq, C]) { S.pos.push(q[0], q[1], q[2]); S.nor.push(nx * 0.92 / nl, ny / nl, nz / nl); S.kind.push(kind); S.shade.push(q === o ? 0.6 : 0); }
    }
  };
  // the bone: from the root out to the wrist, then up to the tip
  const wr = [root[0] + 0.1 * size, root[1] + 0.3 * size * lift, root[2] + s * 0.42 * size], tip = [root[0] + 0.14 * size, root[1] + 0.86 * size * lift, root[2] + s * 0.62 * size];
  if (!plain) tubeInto(S, [root, wr, tip], [0.04 * size, 0.032 * size, 0.012 * size], 5, kind);
  const at = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // the long feathers of the hand, fanned from straight up at the tip to outward and down
  if (plain) {
    // three broad blades stand for the whole wing
    for (let i = 0; i < 3; i++) { const an = (75 - 55 * i) * Math.PI / 180; feather(at(tip, root, i * 0.4), [0, Math.sin(an), s * Math.cos(an)], size * (0.5 + 0.1 * i), size * 0.16, 0.012 + 0.01 * i); }
    return;
  }
  for (let i = 0; i < 8; i++) { const t = i / 7, an = (80 - 100 * t) * Math.PI / 180; feather(at(tip, wr, t * 0.95), [0, Math.sin(an), s * Math.cos(an) * 1.0], size * (0.32 + 0.14 * (1 - t)), size * 0.085, 0.012 + 0.004 * i); }
  // the arm's feathers hang out and down; small ones cover their roots
  for (let i = 0; i < 7; i++) { const t = i / 6, an = (-25 - 50 * t) * Math.PI / 180; feather(at(wr, root, t * 0.85), [0, Math.sin(an), s * Math.cos(an)], size * (0.56 - 0.12 * t), size * 0.1, 0.03 + 0.004 * i); }
  for (let i = 0; i < 9; i++) { const t = i / 8, an = (40 - 95 * t) * Math.PI / 180, b = t < 0.5 ? at(tip, wr, t * 2) : at(wr, root, (t - 0.5) * 1.7); feather(b, [0, Math.sin(an), s * Math.cos(an)], size * 0.26, size * 0.08, -0.02); }
}

// the Victory on his right hand: a winged woman 1.9 m high turned toward him, holding a ribbon out in both hands, a
// wreath on her head. Her wings are half raised: their tips reach about 9.4 m.
const VIC_FOOT = [PALM_R[0] + 0.02, PALM_R[1] + 0.085, PALM_R[2]];
function buildVictory(B) {
  const h = VICTORY_H, S = drapedFigure({ h, seg: 36, fine: true, sway: 0.5, knee: 1, flutes: 9, phase: 0.6,
    arms: [[[0.0, 0.79, 0.12], [0.08, 0.66, 0.15], [0.2, 0.69, 0.1]], [[0.0, 0.79, -0.12], [0.07, 0.66, -0.16], [0.19, 0.64, -0.11]]] });
  wingInto(S, 1, [-0.07 * h, 0.76 * h, 0.035 * h], 0.52 * h, GOLD, 0.46);
  wingInto(S, -1, [-0.07 * h, 0.76 * h, -0.035 * h], 0.52 * h, GOLD, 0.46);
  // the ribbon held out between her hands, its ends hanging; the wreath on her head
  const rb = (pts) => { for (let q = 0; q + 1 < pts.length; q++) {
    const a = pts[q], b = pts[q + 1], w = 0.02 * h;
    for (const [P1, P2, P3, n] of [[[a[0], a[1] + w, a[2]], [a[0], a[1] - w, a[2]], [b[0], b[1] - w, b[2]], 1], [[a[0], a[1] + w, a[2]], [b[0], b[1] - w, b[2]], [b[0], b[1] + w, b[2]], 1]]) {
      for (const dir of [1, -1]) for (const q2 of dir > 0 ? [P1, P2, P3] : [P1, P3, P2]) { S.pos.push(q2[0] + 0.004 * dir, q2[1], q2[2]); S.nor.push(dir * n, 0, 0); S.kind.push(GEM); S.shade.push(0); }
    }
  } };
  rb([[0.2 * h, 0.52 * h, 0.13 * h], [0.205 * h, 0.69 * h, 0.105 * h], [0.215 * h, 0.645 * h, 0.0], [0.195 * h, 0.64 * h, -0.115 * h], [0.19 * h, 0.5 * h, -0.14 * h]]);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ballInto(S, [(-0.01 + 0.062 * Math.cos(a)) * h, 0.972 * h, 0.058 * Math.sin(a) * h], [0.016 * h, 0.011 * h, 0.016 * h], 5, GOLD); }
  B.tint(0.5, 0.07, 0.07);
  B.take(S, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(VIC_FOOT[0], VIC_FOOT[1], VIC_FOOT[2]), GOLD);
  B.tint(1, 1, 1);
  let top = 0;
  for (let q = 1; q < S.pos.length; q += 3) top = Math.max(top, S.pos[q]);
  return VIC_FOOT[1] + top;
}

// the olive wreath: two shoots laid round the head from the nape, their tips meeting over the brow; on each, pairs of
// narrow leaves that point forward along the shoot. Gold, in the part's own axes.
function leafInto(S, P, D, N, len, wid) {
  // a leaf from P along D lying on a surface whose outward way is N: a lozenge with a raised rib, a flat underside
  let wx = N[1] * D[2] - N[2] * D[1], wy = N[2] * D[0] - N[0] * D[2], wz = N[0] * D[1] - N[1] * D[0];
  const wl = Math.hypot(wx, wy, wz) || 1; wx /= wl; wy /= wl; wz /= wl;
  const ux = D[1] * wz - D[2] * wy, uy = D[2] * wx - D[0] * wz, uz = D[0] * wy - D[1] * wx;   // the leaf's own up
  const T = [P[0] + D[0] * len, P[1] + D[1] * len, P[2] + D[2] * len], q = 0.45 * len, r = 0.3 * wid;
  const M = [P[0] + D[0] * q + ux * r, P[1] + D[1] * q + uy * r, P[2] + D[2] * q + uz * r];
  const L = [P[0] + D[0] * q + wx * wid, P[1] + D[1] * q + wy * wid, P[2] + D[2] * q + wz * wid], R = [P[0] + D[0] * q - wx * wid, P[1] + D[1] * q - wy * wid, P[2] + D[2] * q - wz * wid];
  const face = (a, b, c, up) => {
    let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const flip = (nx * ux + ny * uy + nz * uz) * up < 0;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    for (const v of flip ? [a, c, b] : [a, b, c]) { S.pos.push(v[0], v[1], v[2]); S.nor.push(nx, ny, nz); S.kind.push(GOLD); S.shade.push(-0.6); }
  };
  // (the leaves are of a paler, brighter gold than the hair they lie on: a shade under nought is a leaf that gives more light back)
  face(P, R, M, 1); face(R, T, M, 1); face(T, L, M, 1); face(L, P, M, 1); face(P, L, R, -1); face(L, T, R, -1);
}
function buildWreath(B) {
  const S = soup(), NODES = 15;
  for (const s of [1, -1]) {
    const at = (t) => { const e = t * t * (3 - 2 * t); return capAt(s * (2.85 - 2.72 * t), 0.02 + 0.5 * e, 0.11); };
    const stem = [], rad = [];
    for (let i = 0; i <= NODES; i++) {
      const t = i / NODES, P = at(t), Q = at(Math.min(1, t + 0.02)), O = at(Math.max(0, t - 0.02));
      stem.push(P); rad.push(0.032 - 0.014 * t);
      let tx = Q[0] - O[0], ty = Q[1] - O[1], tz = Q[2] - O[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx = (P[0] - CAP[0]) / (CAP_R[0] * CAP_R[0]), ny = (P[1] - CAP[1]) / (CAP_R[1] * CAP_R[1]), nz = (P[2] - CAP[2]) / (CAP_R[2] * CAP_R[2]);
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;   // across the shoot, on the head
      if (i === 0) continue;
      for (const side of [1, -1]) {
        const sp = 0.56 * side + 0.12 * Math.sin(i * 2.3 + side), lift = 0.1 + 0.08 * Math.sin(i * 1.7 + 2 * side);
        const D = [tx * Math.cos(sp) + bx * Math.sin(sp) + nx * lift, ty * Math.cos(sp) + by * Math.sin(sp) + ny * lift, tz * Math.cos(sp) + bz * Math.sin(sp) + nz * lift];
        const dl = Math.hypot(D[0], D[1], D[2]); D[0] /= dl; D[1] /= dl; D[2] /= dl;
        leafInto(S, [P[0] + nx * 0.02, P[1] + ny * 0.02, P[2] + nz * 0.02], D, [nx, ny, nz], 0.34 - 0.06 * t + 0.03 * Math.sin(i * 3.1 + side), 0.085);
      }
    }
    tubeInto(S, stem, rad, 5, GOLD);
  }
  B.take(S, new THREE.Matrix4(), GOLD);
}

// the three Graces on his right and the three Seasons on his left, standing on the back's top rail beside his head:
// each three stand close as a group, every woman in her own stance (the weight on one leg, a hip out, the head turned
// or bent), an arm round her neighbour, a hand at her hair, a hand holding a fold; long dresses in upright pleats
function buildWomen(B, s) {
  const D = 0.5 / WOMEN_H;   // how far apart two of them stand, in units of their height
  // arms in her own axes (z = +1: toward the side given): round the neighbour's back to her far shoulder, lifted to
  // the hair, holding a fold of the skirt, on the hip
  const round = (z) => [[0, 0.795, 0.125 * z], [-0.05, 0.765, 0.25 * z], [-0.058, 0.812, (D + 0.085) * z]];
  const hair = (z) => [[0, 0.795, 0.125 * z], [0.035, 0.85, 0.215 * z], [0.012, 0.955, 0.075 * z]];
  const fold = (z) => [[0, 0.795, 0.125 * z], [0.02, 0.645, 0.165 * z], [0.085, 0.545, 0.105 * z]];
  const hip = (z) => [[0, 0.795, 0.125 * z], [-0.03, 0.665, 0.215 * z], [0.03, 0.575, 0.128 * z]];
  let n = s > 0 ? 0 : 3;
  for (let i = 0; i < 3; i++) {
    // i = 0 stands nearest his head. In her own axes +z is her right hand, which is the part's +z when she looks east
    const inner = -s, outer = s;
    const arms = i === 0 ? [round(outer), s > 0 ? fold(inner) : hip(inner)] : i === 1 ? [s > 0 ? hair(outer) : fold(outer), s > 0 ? hip(inner) : hair(inner)] : [round(inner), s > 0 ? fold(outer) : hip(outer)];
    const lean = i === 0 ? outer : i === 1 ? -s : inner;   // which way her hip goes out
    const S = drapedFigure({ h: WOMEN_H, seg: 28, fine: true, lady: true, sway: 1.15 * lean, knee: -lean, flutes: 7, phase: 1.7 * n, cross: (n & 1) ? 1 : -1,
      arms, nod: i === 1 ? 0.012 : 0.004, head: [0, (i === 1 ? 0.012 * s : i === 0 ? 0.016 * outer : 0.016 * inner)] });
    n++;
    const z = s * (1.56 + i * 0.5), turn = (i === 0 ? 0.3 * s : i === 2 ? -0.32 * s : 0.04 * s) - s * 0.08;
    // (a hand's breadth further back than before: the spread hem comes no nearer to anything than the old one did)
    B.take(S, new THREE.Matrix4().makeRotationY(turn).setPosition(LEG_XB - 0.03 + (i === 1 ? 0.07 : 0), THRONE_TOP, z), GOLD);
  }
  // what they stand on, made plain: a gold plate let into the rail's top under each three
  B.block(LEG_XB - 0.4, THRONE_TOP, s > 0 ? 1.2 : -2.95, LEG_XB + 0.4, THRONE_TOP + 0.012, s > 0 ? 2.95 : -1.2, GOLD, 'b');
  return THRONE_TOP + WOMEN_H * 1.0;
}

// the sceptre: upright from the base before the throne's left front leg, banded in several metals, a small capital
// and on it the eagle with closed wings
const METALS = [[0.3, 0.15, 0.07], null, [0.5, 0.5, 0.48], null];
function buildSceptre(B) {
  const x = SCEPTRE_X, z = SCEPTRE_Z, r = 0.105;
  let y = BASE_H, n = 0;
  B.turned(x, z, [[0.2, y], [0.2, y + 0.06], [0.13, y + 0.16], [r, y + 0.22]], 12, GOLD);
  y += 0.22;
  while (y < SCEPTRE_TOP - 0.3) {
    const len = Math.min([0.5, 0.8, 0.3, 0.8][n % 4], SCEPTRE_TOP - 0.3 - y), m = METALS[n % 4];
    if (m) B.tint(m[0], m[1], m[2]);
    B.turned(x, z, [[r, y], [r, y + len]], 12, m ? GEM : GOLD);
    B.tint(1, 1, 1);
    y += len; n++;
    // a ring between two bands
    B.turned(x, z, [[r, y - 0.03], [r + 0.03, y - 0.015], [r + 0.03, y + 0.015], [r, y + 0.03]], 12, GOLD);
  }
  B.turned(x, z, [[r, y], [r + 0.05, y + 0.08], [r + 0.02, y + 0.16], [0.24, SCEPTRE_TOP - 0.03], [0.24, SCEPTRE_TOP], [0, SCEPTRE_TOP]], 12, GOLD);
  // the eagle, sitting, its wings closed, looking forward and a little toward the god
  const S = soup(), k = GOLD;
  ballInto(S, [0, 0.36, 0], [0.19, 0.33, 0.18], 12, k);
  ballInto(S, [0.07, 0.5, 0], [0.16, 0.2, 0.16], 10, k);
  ballInto(S, [0.07, 0.73, 0], [0.115, 0.105, 0.1], 10, k);
  tubeInto(S, [[0.14, 0.74, 0], [0.24, 0.72, 0], [0.275, 0.66, 0]], [0.05, 0.035, 0.006], 6, k);
  for (const sd of [1, -1]) {
    ballInto(S, [-0.06, 0.36, 0.165 * sd], [0.2, 0.31, 0.06], 10, k);
    tubeInto(S, [[0.05, 0.1, 0.08 * sd], [0.09, 0.0, 0.08 * sd]], [0.045, 0.05], 5, k);
  }
  ballInto(S, [-0.2, 0.1, 0], [0.11, 0.2, 0.1], 8, k);
  const m = new THREE.Matrix4().makeRotationY(-0.35).scale(new THREE.Vector3(0.86, 0.86, 0.86)).setPosition(x, SCEPTRE_TOP, z);
  B.take(S, m, k);
  return SCEPTRE_TOP + 0.835 * 0.86;
}

// a crouching beast, its own axes: lying along +X, the belly on y 0. A lion (a mane) or a sphinx (a woman's head, wings)
function beast(sphinx, kind) {
  const S = soup();
  ballInto(S, [0, 0.21, 0], [0.42, 0.19, 0.16], 12, kind);
  ballInto(S, [0.28, 0.3, 0], [0.2, 0.23, 0.18], 10, kind);
  for (const sd of [1, -1]) {
    ballInto(S, [-0.27, 0.19, 0.13 * sd], [0.19, 0.2, 0.09], 8, kind);
    tubeInto(S, [[0.3, 0.1, 0.12 * sd], [0.5, 0.06, 0.12 * sd], [0.66, 0.05, 0.12 * sd]], [0.07, 0.055, 0.06], 6, kind);
    tubeInto(S, [[-0.3, 0.07, 0.17 * sd], [-0.05, 0.05, 0.19 * sd]], [0.06, 0.05], 5, kind);
  }
  tubeInto(S, [[-0.4, 0.2, 0], [-0.52, 0.12, 0.06], [-0.4, 0.05, 0.2], [-0.2, 0.04, 0.24]], [0.035, 0.03, 0.028, 0.035], 5, kind);
  if (sphinx) {
    tubeInto(S, [[0.32, 0.42, 0], [0.36, 0.56, 0]], [0.075, 0.065], 6, kind);
    ballInto(S, [0.38, 0.66, 0], [0.1, 0.115, 0.095], 10, kind);
    ballInto(S, [0.33, 0.68, 0], [0.105, 0.11, 0.11], 8, kind);
    wingInto(S, 1, [0.12, 0.36, 0.1], 0.5, kind, 0.7, true);
    wingInto(S, -1, [0.12, 0.36, -0.1], 0.5, kind, 0.7, true);
  } else {
    // the lion: the mane as a collar of locks round the neck and down the chest, a broad head with a square muzzle
    // and a brow, small round ears, long forelegs ending in broad paws with their toes, a tuft on the tail
    ballInto(S, [0.3, 0.33, 0], [0.17, 0.24, 0.21], 10, kind);
    for (let q = 0; q < 9; q++) {
      const a = ((q + 0.5) / 9) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), low = c < -0.3 ? 1.3 : 1;
      ballInto(S, [0.34, 0.37 + 0.19 * c * low, 0.2 * sn], [0.1, 0.105 * low, 0.085], 8, kind);
      if (q < 7) { const b = ((q + 1) / 7) * Math.PI * 2; ballInto(S, [0.2, 0.36 + 0.22 * Math.cos(b), 0.23 * Math.sin(b)], [0.12, 0.1, 0.085], 8, kind); }
    }
    ballInto(S, [0.49, 0.41, 0], [0.13, 0.125, 0.125], 10, kind);
    ballInto(S, [0.6, 0.365, 0], [0.09, 0.07, 0.09], 8, kind);
    ballInto(S, [0.66, 0.385, 0], [0.035, 0.03, 0.045], 5, kind);
    ballInto(S, [0.55, 0.47, 0], [0.065, 0.035, 0.11], 6, kind);
    for (const sd of [1, -1]) {
      ballInto(S, [0.44, 0.535, 0.1 * sd], [0.035, 0.045, 0.04], 6, kind);
      ballInto(S, [0.74, 0.05, 0.12 * sd], [0.1, 0.05, 0.08], 6, kind);
      for (let t = -1; t <= 1; t++) ballInto(S, [0.82, 0.035, 0.12 * sd + 0.05 * t], [0.04, 0.035, 0.028], 5, kind);
      ballInto(S, [0.0, 0.045, 0.2 * sd], [0.09, 0.045, 0.06], 6, kind);
    }
    ballInto(S, [-0.16, 0.05, 0.25], [0.06, 0.04, 0.04], 6, kind);
  }
  return S;
}
// a small horse in its own axes (+X forward, the hooves on y 0, about one unit high at the ears), one foreleg lifted
function horseInto(S, z, kind) {
  ballInto(S, [0, 0.62, z], [0.42, 0.17, 0.12], 8, kind);
  tubeInto(S, [[0.28, 0.66, z], [0.4, 0.86, z], [0.47, 0.98, z]], [0.13, 0.09, 0.07], 6, kind);
  ballInto(S, [0.57, 0.97, z], [0.15, 0.065, 0.055], 6, kind);
  tubeInto(S, [[-0.4, 0.7, z], [-0.55, 0.52, z], [-0.57, 0.26, z]], [0.04, 0.045, 0.02], 4, kind);
  for (const sd of [1, -1]) {
    tubeInto(S, [[-0.3, 0.58, z + 0.06 * sd], [-0.36, 0.3, z + 0.06 * sd], [-0.3, 0, z + 0.06 * sd]], [0.075, 0.04, 0.03], 4, kind);
    if (sd > 0) tubeInto(S, [[0.3, 0.56, z + 0.06], [0.48, 0.42, z + 0.06], [0.44, 0.2, z + 0.06]], [0.06, 0.04, 0.03], 4, kind);
    else tubeInto(S, [[0.28, 0.56, z - 0.06], [0.3, 0.28, z - 0.06], [0.28, 0, z - 0.06]], [0.06, 0.035, 0.03], 4, kind);
  }
}
// the two ends of the row on the base's front: a chariot team at his right hand end, a rider at his left, both
// moving toward the middle; small, soft, gold, no more than ornament
function buildBaseEnds(B) {
  const k = GOLD, team = soup(), rider = soup();
  horseInto(team, 0.1, k); horseInto(team, -0.1, k);
  // the car, its wheel, the pole, the driver standing in it
  ballInto(team, [-0.86, 0.5, 0], [0.2, 0.2, 0.2], 6, k);
  for (const sd of [1, -1]) ballInto(team, [-0.86, 0.3, 0.23 * sd], [0.3, 0.3, 0.025], 10, k);
  tubeInto(team, [[-0.7, 0.45, 0], [0.1, 0.52, 0]], [0.03, 0.03], 4, k);
  tubeInto(team, [[-0.86, 0.6, 0], [-0.84, 0.98, 0], [-0.82, 1.1, 0]], [0.1, 0.09, 0.05], 5, k);
  ballInto(team, [-0.8, 1.2, 0], [0.075, 0.085, 0.07], 5, k);
  tubeInto(team, [[-0.82, 1.0, 0.05], [-0.6, 0.86, 0.05], [-0.42, 0.84, 0.03]], [0.04, 0.03, 0.025], 4, k);
  horseInto(rider, 0, k);
  tubeInto(rider, [[-0.04, 0.74, 0], [0, 1.02, 0], [0.02, 1.14, 0]], [0.1, 0.09, 0.05], 5, k);
  ballInto(rider, [0.04, 1.24, 0], [0.075, 0.085, 0.07], 5, k);
  for (const sd of [1, -1]) tubeInto(rider, [[0, 0.78, 0.1 * sd], [0.12, 0.56, 0.15 * sd], [0.08, 0.36, 0.15 * sd]], [0.05, 0.04, 0.03], 4, k);
  tubeInto(rider, [[0, 1.04, 0.06], [0.16, 0.9, 0.06], [0.3, 0.88, 0.03]], [0.04, 0.03, 0.025], 4, k);
  const sc = 0.52, H = Math.PI / 2;
  B.take(team, new THREE.Matrix4().makeRotationY(H).scale(new THREE.Vector3(sc, sc, sc)).setPosition(0.03, 0.26, 2.62), k);
  B.take(rider, new THREE.Matrix4().makeRotationY(-H).scale(new THREE.Vector3(sc, sc, sc)).setPosition(0.03, 0.26, -2.72), k);
}
function buildBeasts(B) {
  // four golden lions carry the footstool, one under each corner, looking outward
  const lion = beast(false, GOLD), sc = (STOOL_UNDER - BASE_H) / 0.42;
  for (const [x, z, turn] of [[STOOL_X1 - 0.32, STOOL_Z - 0.3, -0.5], [STOOL_X1 - 0.32, -STOOL_Z + 0.3, 0.5], [STOOL_X0 + 0.5, STOOL_Z - 0.2, -1.57], [STOOL_X0 + 0.5, -STOOL_Z + 0.2, 1.57]]) {
    B.take(lion, new THREE.Matrix4().makeRotationY(turn).scale(new THREE.Vector3(sc, sc, sc)).setPosition(x, BASE_H, z), GOLD);
  }
  // a small sphinx crouches on the seat over each front leg, under the end of the arm rail, dark as ebony
  const sph = beast(true, EBONY);
  for (const s of [1, -1]) B.take(sph, new THREE.Matrix4().makeScale(0.92, 0.92, 0.92).setPosition(LEG_XF - 0.3, SEAT, s * (THRONE_W / 2 - ARM_W / 2)), EBONY);
}

// ---- the base, the footstool and the throne (the throne's form is the crew's own: see the report) ----
const LEG = 0.8, LEG_Z = 2.55, LEG_XF = -3.35, LEG_XB = -8.25, SEAT_UNDER = 5.58, SHELF_Y = 2.3;
const RAIL_Y = 3.3, RAIL_H = 0.26, ARM_TOP = 6.62, ARM_UNDER = 6.3, ARM_W = 0.7;
const STOOL_X0 = -2.85, STOOL_X1 = -0.25, STOOL_Z = 1.8, STOOL_UNDER = 1.52;
const GEMS = [[0.42, 0.05, 0.06], [0.05, 0.3, 0.27], [0.75, 0.72, 0.62]];

function buildBase(B) {
  const hw = BASE_W / 2;
  // a foot band and a crown band at the full dug measure, the die between them set 4 cm in
  B.block(-BASE_D, 0, -hw, 0, 0.2, hw, STONE, 'b');
  B.block(-BASE_D + 0.04, 0.2, -hw + 0.04, -0.04, 0.93, hw - 0.04, STONE, 'tb');
  B.block(-BASE_D, 0.93, -hw, 0, BASE_H, hw, STONE, '');
}

function buildStool(B) {
  B.block(STOOL_X0, STOOL_UNDER, -STOOL_Z, STOOL_X1, STOOL_TOP, STOOL_Z, IVORY, '');
  // gold bands along the upper and lower edge, an ebony field between them on the front and the sides
  for (const [y0, y1, k] of [[STOOL_UNDER, STOOL_UNDER + 0.07, GOLD], [STOOL_TOP - 0.07, STOOL_TOP + 0.004, GOLD], [STOOL_UNDER + 0.1, STOOL_TOP - 0.1, EBONY]]) {
    const e = k === GOLD ? 0.03 : 0.012;
    B.block(STOOL_X0 - e, y0, -STOOL_Z - e, STOOL_X1 + e, y1, STOOL_Z + e, k, k === GOLD ? '' : 'tb');
  }
}

function buildLeg(B, xc, zc, top) {
  const h = LEG / 2, sz = Math.sign(zc), sxo = xc > -5 ? 1 : -1;
  B.block(xc - h - 0.09, BASE_H, zc - h - 0.09, xc + h + 0.09, BASE_H + 0.16, zc + h + 0.09, GOLD, 'b');
  // a shelf on the two free faces for the dancers that stand round the leg
  B.block(xc + (sxo > 0 ? h : -h - 0.3), SHELF_Y - 0.1, zc - h - 0.02, xc + (sxo > 0 ? h + 0.3 : -h), SHELF_Y, zc + h + 0.02, GOLD, '');
  B.block(xc - h - 0.02, SHELF_Y - 0.1, zc + (sz > 0 ? h : -h - 0.28), xc + h + 0.02, SHELF_Y, zc + (sz > 0 ? h + 0.28 : -h), GOLD, '');
  B.block(xc - h - 0.04, BASE_H + 0.16, zc - h - 0.04, xc + h + 0.04, BASE_H + 0.3, zc + h + 0.04, IVORY, 'b');
  B.block(xc - h, BASE_H + 0.3, zc - h, xc + h, top, zc + h, IVORY, 'tb');
  // ebony let into the two faces that are seen, between the bands
  const bands = top > 6 ? [2.2, RAIL_Y + RAIL_H / 2, 4.85, SEAT_UNDER + 0.16, ARM_TOP + 0.2, 8.6, 10.2] : [2.2, RAIL_Y + RAIL_H / 2, 4.85];
  let y = BASE_H + 0.5;
  for (const by of [...bands, top + 0.2]) {
    const y1 = Math.min(by - 0.2, top - 0.08);
    if (y1 - y > 0.3) {
      B.block(xc - 0.24, y, zc + sz * h - 0.012 * sz, xc + 0.24, y1, zc + sz * (h + 0.012), EBONY, 'tb');
      B.block(xc + sxo * h - 0.012 * sxo, y, zc - 0.24, xc + sxo * (h + 0.012), y1, zc + 0.24, EBONY, 'tb');
    }
    y = by + 0.2;
  }
  let n = 0;
  for (const by of bands) {
    B.block(xc - h - 0.035, by - 0.09, zc - h - 0.035, xc + h + 0.035, by + 0.09, zc + h + 0.035, GOLD, '');
    // a stone on each band's two seen faces
    const c = GEMS[(n++ + (xc > -5 ? 0 : 1) + (sz > 0 ? 0 : 1)) % 3];
    B.tint(c[0], c[1], c[2]);
    B.block(xc - 0.06, by - 0.05, zc + sz * (h + 0.03), xc + 0.06, by + 0.05, zc + sz * (h + 0.065), GEM, '');
    B.block(xc + sxo * (h + 0.03), by - 0.05, zc - 0.06, xc + sxo * (h + 0.065), by + 0.05, zc + 0.06, GEM, '');
    B.tint(1, 1, 1);
  }
}

function buildThrone(B) {
  const hw = THRONE_W / 2;
  for (const s of [1, -1]) { buildLeg(B, LEG_XF, LEG_Z * s, SEAT_UNDER); buildLeg(B, LEG_XB, LEG_Z * s, THRONE_TOP - 0.4); }
  // the dark panels that close the space under the seat, set in behind the rails
  B.block(LEG_XB + 0.14, BASE_H, -LEG_Z - 0.14, LEG_XF - 0.14, SEAT_UNDER, LEG_Z + 0.14, EBONY, 'tb');
  // each side between the legs: three panels in ivory frames above the rail and three below it, a gold boss with
  // a stone at the middle of each
  for (const s of [1, -1]) {
    const zf = s * (LEG_Z + 0.14), z0 = Math.min(zf, zf + 0.035 * s), z1 = Math.max(zf, zf + 0.035 * s), xa = LEG_XB + LEG / 2 + 0.06, xb = LEG_XF - LEG / 2 - 0.06;
    let n = 0;
    for (const [ya, yb] of [[BASE_H + 0.34, RAIL_Y - 0.2], [RAIL_Y + RAIL_H + 0.72, SEAT_UNDER - 0.16]]) {
      B.block(xa, ya, z0, xb, ya + 0.1, z1, IVORY, ''); B.block(xa, yb - 0.1, z0, xb, yb, z1, IVORY, '');
      for (let q = 0; q <= 3; q++) { const x = xa + (xb - xa - 0.1) * q / 3; B.block(x, ya + 0.1, z0, x + 0.1, yb - 0.1, z1, IVORY, 'tb'); }
      for (let q = 0; q < 3; q++) {
        const xm = xa + 0.05 + (xb - xa - 0.1) * (q + 0.5) / 3, ym = (ya + yb) / 2, c = GEMS[(n++ + (s > 0 ? 0 : 1)) % 3];
        if (q === 1) continue;   // (the pillar stands before the middle panel)
        B.block(xm - 0.13, ym - 0.13, s > 0 ? z0 : z0 - 0.01, xm + 0.13, ym + 0.13, s > 0 ? z1 + 0.01 : z1, GOLD, '');
        B.tint(c[0], c[1], c[2]);
        B.block(xm - 0.06, ym - 0.06, s > 0 ? z1 : z0 - 0.03, xm + 0.06, ym + 0.06, s > 0 ? z1 + 0.03 : z0, GEM, '');
        B.tint(1, 1, 1);
      }
    }
  }
  // the four rails between the legs
  const r0 = RAIL_Y, r1 = RAIL_Y + RAIL_H, i = LEG / 2;
  B.block(LEG_XF - 0.13, r0, -LEG_Z + i, LEG_XF + 0.17, r1, LEG_Z - i, IVORY, '');
  B.block(LEG_XB - 0.17, r0, -LEG_Z + i, LEG_XB + 0.13, r1, LEG_Z - i, IVORY, '');
  for (const s of [1, -1]) B.block(LEG_XB + i, r0, s * LEG_Z - 0.15 + 0.02 * s, LEG_XF - i, r1, s * LEG_Z + 0.15 + 0.02 * s, IVORY, '');
  // the four pillars between the legs that hold the seat
  const prof = [[0.36, BASE_H], [0.36, BASE_H + 0.12], [0.3, BASE_H + 0.2], [0.27, RAIL_Y], [0.25, SEAT_UNDER - 0.3], [0.33, SEAT_UNDER - 0.2], [0.38, SEAT_UNDER - 0.12], [0.38, SEAT_UNDER]];
  for (const [x, z] of [[LEG_XF, 0], [LEG_XB, 0], [(LEG_XF + LEG_XB) / 2, LEG_Z], [(LEG_XF + LEG_XB) / 2, -LEG_Z]]) {
    B.turned(x, z, prof.slice(0, 3), 14, GOLD); B.turned(x, z, prof.slice(2, 5), 14, IVORY); B.turned(x, z, prof.slice(4), 14, GOLD);
  }
  // the seat, a gold band along its edge
  B.block(LEG_XB - 0.5, SEAT_UNDER, -hw, LEG_XF + 0.5, SEAT, hw, IVORY, '');
  B.block(LEG_XB - 0.52, SEAT_UNDER + 0.08, -hw - 0.02, LEG_XF + 0.52, SEAT - 0.08, hw + 0.02, GOLD, 'tb');
  // the flat arm rails: ivory, a gold edge, ebony let into the top
  for (const s of [1, -1]) {
    const za = s * (hw - ARM_W), zb = s * hw, z0 = Math.min(za, zb), z1 = Math.max(za, zb);
    B.block(LEG_XB + 0.3, ARM_UNDER, z0, LEG_XF - 0.7, ARM_TOP, z1, IVORY, '');
    B.block(LEG_XB + 0.3, ARM_UNDER + 0.1, z0 - 0.015, LEG_XF - 0.68, ARM_TOP - 0.1, z1 + 0.015, GOLD, 'tb');
    B.block(LEG_XB + 0.5, ARM_TOP, z0 + 0.16, LEG_XF - 1.0, ARM_TOP + 0.012, z1 - 0.16, EBONY, 'b');
    // two small posts under each rail, behind the sphinx
    for (const x of [-4.3, -5.6, -6.9]) B.turned(x, s * (hw - ARM_W / 2), [[0.17, SEAT], [0.12, SEAT + 0.1], [0.12, ARM_UNDER - 0.08], [0.18, ARM_UNDER]], 10, GOLD);
  }
  // the high straight back: the two posts are the back legs; a top rail; a panelled field between
  B.block(LEG_XB - 0.45, THRONE_TOP - 0.4, -hw, LEG_XB + 0.45, THRONE_TOP, hw, IVORY, '');
  B.block(LEG_XB - 0.47, THRONE_TOP - 0.3, -hw - 0.02, LEG_XB + 0.47, THRONE_TOP - 0.1, hw + 0.02, GOLD, 'tb');
  B.block(LEG_XB - 0.12, SEAT, -LEG_Z + i, LEG_XB + 0.12, THRONE_TOP - 0.4, LEG_Z - i, IVORY, 'tb');
  for (const [ya, yb] of [[6.25, 7.55], [7.9, 9.0], [9.35, 10.2]]) for (const [za, zb] of [[-2.3, -0.85], [-0.6, 0.6], [0.85, 2.3]]) {
    B.block(LEG_XB - 0.135, ya, za, LEG_XB + 0.135, yb, zb, EBONY, 'tb');
  }
  for (const yb of [7.72, 9.17]) B.block(LEG_XB - 0.14, yb - 0.05, -LEG_Z + i, LEG_XB + 0.14, yb + 0.05, LEG_Z - i, GOLD, 'tb');
}

// ---- the ornament's small figures: one coarse form drawn many times ----
function soupGeometry(S, kind) {
  const n = S.pos.length / 3, aux = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1);
  for (let i = 0; i < n; i++) aux[i * 3] = kind === undefined ? S.kind[i] : kind;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(S.pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(S.nor), 3));
  g.setAttribute('aux', new THREE.BufferAttribute(aux, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
// places: lists of [x, y, z, turn about y, height, depth scale]
function drawnMany(geo, mat, places) {
  const mesh = new THREE.InstancedMesh(geo, mat, places.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  places.forEach((p, i) => { q.setFromAxisAngle(up, p[3]); m.compose(v.set(p[0], p[1], p[2]), q, sc.set(p[4] * (p[5] || 1), p[4], p[4])); mesh.setMatrixAt(i, m); });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true; mesh.receiveShadow = true;
  // drawn wherever the statue is: its box is the whole part's
  mesh.frustumCulled = false;
  return mesh;
}
function buildSmallFigures(object, mat) {
  const H = Math.PI / 2;
  // a plain standing figure one unit high: one arm a little out, the other bent
  const stand = drapedFigure({ h: 1, seg: 6, coarse: true, flutes: 0, knee: 1, dress: GOLD, skin: GOLD, arms: [[[0, 0.79, 0.125], [0.03, 0.65, 0.17], [0.1, 0.56, 0.16]], [[0, 0.79, -0.125], [0.02, 0.64, -0.16], [0.04, 0.5, -0.14]]] });
  // the base's front: FIFTEEN standing figures in gold between a chariot team and a rider (seventeen in all; those
  // two are built with the base); the footstool's band; all turned a little this way and that, in loose pairs
  const gold = [], ivory = [];
  let rnd = steadyStream('the base row');
  for (let i = 0; i < 15; i++) gold.push([0.0, 0.26, -2.02 + i * 0.2886 + ((i & 1) ? -0.04 : 0.04), H + rnd.range(-0.7, 0.7), rnd.range(0.56, 0.63), 0.55]);
  rnd = steadyStream('the footstool band');
  for (let i = 0; i < 13; i++) gold.push([STOOL_X1 + 0.03, STOOL_UNDER + 0.105, -1.5 + i * 0.25, H + (i & 1 ? 0.9 : -0.9), rnd.range(0.24, 0.265), 0.5]);
  for (const s of [1, -1]) for (let i = 0; i < 9; i++) gold.push([STOOL_X0 + 0.3 + i * 0.25, STOOL_UNDER + 0.105, s * (STOOL_Z + 0.03), (s > 0 ? 0 : Math.PI) + (i & 1 ? 0.9 : -0.9) * s, rnd.range(0.24, 0.265), 0.5]);
  // the rails: seven on the front one and eleven on his right-hand one. (The rail of his left side and the back rail
  // carried eighteen more; no way through the room looks at those two faces, and their triangles are spent on the
  // god's hands and the women instead: round h5.)
  const ry = RAIL_Y + RAIL_H;
  rnd = steadyStream('the front rail');
  for (let i = 0; i < 7; i++) ivory.push([LEG_XF + 0.02, ry, -1.5 + i * 0.5, H + rnd.range(-0.6, 0.6), rnd.range(0.56, 0.64), 0.8]);
  rnd = steadyStream('the right rail');
  for (let i = 0; i < 11; i++) ivory.push([LEG_XF - 0.75 + i * -0.34, ry, LEG_Z + 0.02, rnd.range(-0.6, 0.6), rnd.range(0.56, 0.64), 0.8]);
  object.add(drawnMany(soupGeometry(stand, GOLD), mat, gold));
  object.add(drawnMany(soupGeometry(stand, IVORY), mat, ivory));
  // the Victories as dancers: at each leg four on its shelf and two at its foot, in two stances (twenty four in the
  // round; the ten on faces no way through the room looks at, the back legs' backs and the left back leg's side, are
  // not built: round h5)
  const dancer = (flip) => {
    const a = flip ? -1 : 1;
    const S = drapedFigure({ h: 1, seg: 8, coarse: true, flutes: 0, knee: a, sway: 1.2 * a, dress: GOLD, skin: GOLD, arms: [[[0, 0.79, 0.125], [0.04, 0.84, 0.25], [0.02, flip ? 0.7 : 1.0, 0.31]], [[0, 0.79, -0.125], [0.04, 0.84, -0.25], [0.02, flip ? 1.0 : 0.7, -0.31]]] });
    wingInto(S, 1, [-0.07, 0.76, 0.04], 0.42, GOLD, 0.6, true); wingInto(S, -1, [-0.07, 0.76, -0.04], 0.42, GOLD, 0.6, true);
    return S;
  };
  const dA = [], dB = [];
  let n = 0;
  for (const xc of [LEG_XF, LEG_XB]) for (const s of [1, -1]) {
    const zc = LEG_Z * s, sxo = xc > -5 ? 1 : -1, face = sxo > 0 ? H : -H, side = s > 0 ? 0 : Math.PI, h2 = LEG / 2;
    const six = [[xc + sxo * (h2 + 0.15), SHELF_Y, zc - 0.21, face - 0.25 * sxo, 0.84], [xc + sxo * (h2 + 0.15), SHELF_Y, zc + 0.21, face + 0.25 * sxo, 0.84],
      [xc - 0.21, SHELF_Y, zc + s * (h2 + 0.14), side + 0.25 * s, 0.84], [xc + 0.21, SHELF_Y, zc + s * (h2 + 0.14), side - 0.25 * s, 0.84],
      [xc + sxo * (h2 + 0.26), BASE_H + 0.16, zc - 0.24, face - 0.4 * sxo, 0.74], [xc + sxo * (h2 + 0.26), BASE_H + 0.16, zc + 0.24, face + 0.4 * sxo, 0.74]];
    six.forEach((p, q) => { if (sxo > 0 || (s > 0 && (q === 2 || q === 3))) ((n & 1) ? dA : dB).push(p); n++; });
  }
  object.add(drawnMany(soupGeometry(dancer(false), GOLD), mat, dA));
  object.add(drawnMany(soupGeometry(dancer(true), GOLD), mat, dB));
}

// ---- the stuffs: ivory in plates, gold in sheets, ebony, the base's stone; and the room's soft light ----
// One material, two programs (the god's skin tells flesh from gold by the field; built work carries a kind a corner).
// The light the world gives (its sun, its lamps if they are lights) is taken as it comes. Added here, as REFLECTED
// light only (nothing is emitted): what the sunlit floor and the door throw on the statue from the front and below,
// strongest at the knees and lap and fading up; the same seen in the gold along the mirrored ray; a faint warm term
// near the lamps. All of it reads the statue's own place and the room's measures, never the lens's place.
const SHADER_HEAD = `
varying vec3 vZP; varying vec3 vZA;
uniform vec3 uZBounce; uniform vec3 uZDoor; uniform vec3 uZLamp[6]; uniform vec3 uZLampCol; uniform float uZLampLevel[6];
float zHash(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float zNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(zHash(i), zHash(i + vec3(1., 0., 0.)), f.x), mix(zHash(i + vec3(0., 1., 0.)), zHash(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(zHash(i + vec3(0., 0., 1.)), zHash(i + vec3(1., 0., 1.)), f.x), mix(zHash(i + vec3(0., 1., 1.)), zHash(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
// plates laid like coursed work: x = metres to the nearest joint, y = a number of the plate's own
vec3 zPlates(vec3 p, vec3 n, vec3 cell){
  float row = floor(p.y / cell.y), odd = mod(row, 2.) * 0.5;
  float ey = (0.5 - abs(fract(p.y / cell.y) - 0.5)) * cell.y + 9. * smoothstep(0.8, 0.95, abs(n.y));
  float cx = p.x / cell.x + odd, cz = p.z / cell.z + odd * 0.6;
  float ex = (0.5 - abs(fract(cx) - 0.5)) * cell.x + 9. * smoothstep(0.6, 0.85, abs(n.x));
  float ez = (0.5 - abs(fract(cz) - 0.5)) * cell.z + 9. * smoothstep(0.6, 0.85, abs(n.z));
  float id = zHash(vec3(floor(cx + 0.5 * step(0.6, abs(n.x))), row, floor(cz + 0.5 * step(0.6, abs(n.z)))));
  float along = ey < min(ex, ez) ? p.x + p.z : (ex < ez ? p.y + 0.4 * p.z : p.y + 0.4 * p.x);
  return vec3(min(ey, min(ex, ez)), id, along);
}
// the mantle's sparse ornament: q is a place on the cloth in a flat frame (metres); x = how much of a mark is here,
// y = which paint (0 cream lily, 1 dark red beast, 2 blue green beast). Rows of lilies and rows of small beasts.
vec2 zMotif(vec2 q, float aa){
  vec2 g = q / 0.74; float row = floor(g.y); g.x += 0.5 * mod(row, 2.);
  vec2 c = floor(g), f = (fract(g) - 0.5) * 0.74 * 1.2;
  float h = zHash(vec3(c, 3.7)), beast = mod(row, 2.), d;
  if (beast < 0.5) {
    // a lily: three petals on a short bar
    f.y += 0.02;
    d = length(vec2(f.x / 0.036, (f.y - 0.045) / 0.105)) - 1.;
    vec2 a = vec2(abs(f.x) - 0.06, f.y - 0.02); a = vec2(a.x * 0.77 - a.y * 0.64, a.x * 0.64 + a.y * 0.77);
    d = min(d, length(vec2(a.x / 0.03, a.y / 0.085)) - 1.);
    d = min(d, max(abs(f.x) - 0.07, abs(f.y + 0.075) - 0.014) / 0.03);
    d *= 0.03;
  } else {
    // a small beast walking: body, neck and head, four legs, a tail
    f.x *= h < 0.5 ? 1. : -1.;
    d = (length(vec2(f.x / 0.105, f.y / 0.048)) - 1.) * 0.048;
    d = min(d, length(f - vec2(0.125, 0.05)) - 0.036);
    d = min(d, max(abs(abs(f.x) - 0.065) - 0.019, abs(f.y + 0.065) - 0.045));
    d = min(d, (length(vec2((f.x + 0.13) / 0.05, (f.y - 0.035) / 0.014)) - 1.) * 0.014);
  }
  return vec2(1. - smoothstep(-aa, aa, d), beast < 0.5 ? 0. : (h < 0.5 ? 1. : 2.));
}
#ifndef ZEUS_BUILT
// the god's ivory is laid in FEW LARGE pieces, their joints where a carver would hide them. Five pieces (the trunk,
// each upper arm, each forearm), each a round cone from A to B (radii R.x, R.y); where two pieces meet (in the groove
// between breast and shoulder, at the elbow) there is a joint. An arm is clad in R.w long staves that run down the
// limb; a ring at the wrist. The trunk: one line down the furrow of the breast bone and the belly, one down each
// flank under the arm, a ring at the neck's base (under the beard); behind, the spine's line and one cross joint a
// side at different heights. Nothing crosses the breast. The neck with the head, each hand, each foot are one piece.
// x = metres to the nearest joint, y = the piece's own number, z = metres along, w = metres round; pin = metres to
// the nearest pin (a pair every 0.6 m beside a joint).
const vec3 ZLA[5] = vec3[5](vec3(-6.6, 6.27, 0.), vec3(-6.6, 10.22, 1.86), vec3(-6.3, 7.62, 2.66), vec3(-6.6, 10.22, -1.86), vec3(-4.3, 9.9, -3.12));
const vec3 ZLB[5] = vec3[5](vec3(-6.6, 11.37, 0.), vec3(-6.3, 7.62, 2.66), vec3(-4.3, 7.04, 2.74), vec3(-4.3, 9.9, -3.12), vec3(-2.98, 11.62, -3.04));
const vec4 ZLR[5] = vec4[5](vec4(1.04, 1.04, 0., 0.), vec4(0.6, 0.5, 0., 2.), vec4(0.54, 0.34, 0., 2.), vec4(0.64, 0.5, 0., 2.), vec4(0.54, 0.34, 0., 2.));   // (x, y: radii; w: staves)
vec4 zLimbs(vec3 p, vec3 n, out float pin){
  pin = 9.;
  // the feet are one piece each
  if (p.y < 3.4) return vec4(9., 0.3 + 0.2 * step(0., p.z), p.x, p.z);
  float s1 = 1e3, s2 = 1e3; int k = 0;
  for (int i = 0; i < 5; i++) {
    vec3 a = ZLA[i], ab = ZLB[i] - a, q = p - a;
    if (i == 0) q.z *= 0.64;
    float t = clamp(dot(q, ab) / dot(ab, ab), 0., 1.);
    float s = length(q - ab * t) - mix(ZLR[i].x, ZLR[i].y, t);
    if (s < s1) { s2 = s1; s1 = s; k = i; } else if (s < s2) { s2 = s; }
  }
  vec3 a = ZLA[k], ab = ZLB[k] - a, q = p - a; vec4 R = ZLR[k];
  float len = length(ab); vec3 w = ab / len;
  float along = dot(q, w); vec3 rv = q - w * along; float rho = length(rv) + 1e-4; vec3 rd = rv / rho;
  vec3 u = normalize(cross(w, abs(w.x) > 0.7 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), v = cross(w, u);
  float ang = atan(dot(rd, u), dot(rd, v)) / 6.2831853;
  float d = 9., id = 0.4, run = along, across = ang * 6.2831853 * rho;
  // (a joint is a plane: where the skin lies nearly along that plane it would smear, so it is thinned away there)
  if (k == 0) {
    float az = abs(p.z), sz = step(0., p.z), front = step(-6.75, p.x);
    float ky = inversesqrt(max(1. - n.y * n.y, 0.03));
    if (p.y > 10.98) { d = (p.y - 10.98) * ky; id = 0.37; }
    else {
      float dC = az * inversesqrt(max(1. - n.z * n.z, 0.03));
      if (front > 0.5 && p.y > 10.62) dC = 9.;
      float dF = abs(p.x + 6.75) * inversesqrt(max(1. - n.x * n.x, 0.03));
      float yb = mix(9.4, 8.85, sz) + 0.1 * sin(az * 3.);
      float dB = front > 0.5 ? 9. : abs(p.y - yb) * 0.9 * ky;
      d = min(min(dC, dF), min(dB, (10.98 - p.y) * ky));
      run = dB <= d ? p.z : p.y;
      id = zHash(vec3(sz + 2., front * 3. + (1. - front) * step(yb, p.y) + 5., 1.));
    }
  } else {
    float ca = ang * R.w + 0.25 + 0.2 * sin(ang * 6.2831853 + float(k) * 1.7);
    float st = mod(floor(ca) + 30., max(R.w, 1.)), fs = fract(ca), wide = 6.2831853 * rho / R.w;
    float nw = dot(n, w), nt = dot(n, cross(w, rd));
    float kr = inversesqrt(max(1. - nw * nw, 0.03)), ks = inversesqrt(max(1. - nt * nt, 0.03));
    float es = (R.w < 1.5 || along > len) ? 9. : (0.5 - abs(fs - 0.5)) * wide * ks, er = 9.;
    if (k == 2 || k == 4) er = min(er, abs(along - len) * kr);
    if (along > len) st = 7.;
    d = min(er, es);
    across = fs * wide;
    id = zHash(vec3(st + 3., 2., float(k) * 5. + 1.));
  }
  float db = 0.6 * (s2 - s1);
  if (db < d) { d = db; run = p.x + p.y + p.z; }
  if (d < 8.) pin = length(vec2(d - 0.035, (fract(run / 0.6) - 0.5) * 0.6));
  return vec4(d, id, along, across);
}
#endif`;
const SHADER_STUFF = `
#define ZVIC ${VIC_FOOT[0].toFixed(3)}, ${VIC_FOOT[1].toFixed(3)}, ${VIC_FOOT[2].toFixed(3)}
vec3 zN = normalize(inverseTransformDirection(normal, viewMatrix));
float zPix = length(fwidth(vZP)) + 1e-5;
#ifdef ZEUS_BUILT
float zGold = step(0.5, vZA.x) * step(vZA.x, 1.5), zEbony = step(1.5, vZA.x) * step(vZA.x, 2.5), zStone = step(2.5, vZA.x) * step(vZA.x, 3.5), zGem = step(3.5, vZA.x);
float zHollow = vZA.y, zCrease = 0.;
vec3 zTint = vColor.rgb;
#else
float zEdge = fwidth(vZA.x) * 0.75 + 1e-4;
float zGold = smoothstep(-zEdge, zEdge, vZA.x), zEbony = 0., zStone = 0., zGem = 0.;
float zHollow = clamp(vZA.y, 0., 1.), zCrease = clamp(vZA.z, -8., 8.);
vec3 zTint = vec3(1.);
#endif
float zIvory = clamp(1. - zGold - zEbony - zStone - zGem, 0., 1.);
// ivory in a few large plates laid to the body's forms (the god) or in courses (the throne), gold in sheets about 1.3 by 1.0 m;
// a joint is a fine dark line, never thinner than a pixel and fainter as it thins, so it cannot shimmer from afar
#ifdef ZEUS_BUILT
vec3 zPl = zPlates(vZP, zN, mix(vec3(2.3, 0.98, 2.3), vec3(1.35, 1.7, 1.35), zGold));
float zPin = 9., zGrain = 0., zHair = 0., zLocks = 0.;
#else
// (the god's own ivory: its joints are hair lines)
float zHair = zIvory;
float zPin = 9.;
vec4 zLp = zLimbs(vZP, zN, zPin);
vec3 zPl = zGold > 0.5 ? zPlates(vZP, zN, vec3(1.35, 1.7, 1.35)) : zLp.xyz;
float zNear = 1. - smoothstep(0.004, 0.013, zPix);
// a faint long grain along each plate
float zGrain = (zNoise(vec3(zLp.w * 75., zLp.z * 2.6, zLp.y * 40.)) + 0.5 * zNoise(vec3(zLp.w * 210., zLp.z * 5., zLp.y * 90.)) - 0.75) * zNear * zIvory * smoothstep(0.7, 0.85, length(vZP - vec3(-5.75, 12.2, 0.)));
#endif
// (a joint is 12 mm wide and is THERE at one strength wherever the eye is; only where it is narrower than a pixel is
// it drawn a pixel wide and fainter, by the square root of its share of the pixel, so that it goes soft and cannot
// shimmer: this reads the pixel's footprint on the skin, never the eye's place)
float zW = max(0.004, 0.6 * zPix), zThin = sqrt(min(1., 0.008 / (2. * zW)));
float zFaceM = smoothstep(0.7, 0.85, length(vZP - vec3(-5.75, 12.2, 0.))) * (1. - zStone) * (1. - zGem) * (1. - zEbony);
#ifdef ZEUS_BUILT
// (the women of the rail and the Victory are each of one piece: no course's joint of the throne runs through an arm)
zFaceM *= 1. - max(step(10.93, vZP.y) * step(vZP.x, -7.4), 1. - step(1.5, length(vZP - vec3(ZVIC) - vec3(0., 1.1, 0.))));
#else
// (his hair and beard are cast and chased, not sheet: no sheet's seam runs across them)
float zLocks = zGold * (1. - smoothstep(0.92, 1., length((vZP - vec3(-6.5, 12.05, 0.)) * vec3(0.77, 0.6, 0.77))));
zFaceM *= 1. - max(zLocks, zGold * step(10.5, vZP.y) * step(abs(vZP.z), 1.32));
#endif
float zJoint = zFaceM * (1. - smoothstep(zW, 2. * zW, zPl.x)) * zThin;
float zTone = zNoise(vZP * 0.9 + 7.3);
float zWarm = fract(zPl.y * 13.7) - 0.5;
// (ivory: old and oiled, a warm cream a little yellowed; no plate is cooler than cream)
vec3 zCol = (vec3(0.87, 0.78, 0.565) * (0.96 + mix(0.12, 0.1, zHair) * (zPl.y - 0.5) + 0.07 * zTone + 0.12 * zGrain) + zWarm * vec3(0.05, 0.0, -0.07)) * zIvory
  + vec3(0.84, 0.55, 0.16) * (0.88 + 0.16 * zPl.y + 0.1 * zTone) * zGold
  + vec3(0.045, 0.03, 0.022) * zEbony + vec3(0.017, 0.021, 0.032) * (0.8 + 0.5 * zTone) * zStone + zTint * zGem;
#ifndef ZEUS_BUILT
// (the gold of his hair and beard: a little deeper and quieter than the mantle's, so that the ivory face stands out between them)
zCol *= mix(vec3(1.), vec3(0.9, 0.84, 0.74), zLocks);
#endif
// the mantle's paint: sparse lilies and small beasts in rows, cream, dark red, blue green; only where the cloth
// lies flat enough to carry a mark, and only from near enough to be marks and not specks
float zPaint = 0.;
#ifdef ZEUS_BUILT
float zSheet = zGold * step(vZP.y, 6.7);
#else
float zSheet = zGold * step(2.5, vZP.y) * step(vZP.y, 7.25);
if (zSheet > 0.5) {
  vec3 zAn = abs(zN); float zAa = zPix + 0.002, zTop = max(zAn.x, max(zAn.y, zAn.z));
  vec2 zMo = zAn.x >= zTop ? zMotif(vZP.zy, zAa) : (zAn.y >= zTop ? zMotif(vZP.zx + 0.37, zAa) : zMotif(vZP.xy + 0.19, zAa));
  zPaint = zMo.x * smoothstep(0.62, 0.8, zTop) * (1. - smoothstep(0.03, 0.07, zPix));
  vec3 zPc = zMo.y < 0.5 ? vec3(0.6, 0.53, 0.38) : (zMo.y < 1.5 ? vec3(0.2, 0.035, 0.03) : vec3(0.035, 0.15, 0.14));
  zPaint *= 0.85;
  zCol = mix(zCol, zPc, zPaint);
}
#endif
// nail rows beside the seams of the sheet gold (the mantle, the bands of the throne and the footstool): heads 4 cm
// across, 16 cm apart; they go soft where a head is under a pixel
vec2 zNd = vec2((fract(zPl.z / 0.16) - 0.5) * 0.16, zPl.x - 0.05);
float zNr = max(0.02, 0.7 * zPix);
float zNail = zSheet * (1. - zPaint) * (1. - smoothstep(0.8 * zNr, 1.1 * zNr, length(zNd))) * min(1., 0.02 / zNr) * (1. - smoothstep(0.05, 0.09, zPix));
zCol *= 1. - 0.5 * zNail;
// old oil and dust lie in the joints and the creases; the ivory is a little darker for a finger's breadth beside
// each joint; a small gold pin near each corner of an ivory plate
// a joint in ivory is a warm amber brown, about a third darker than the plate in the room's warm light (old oil in
// the seam, never grey); in gold a dark seam, half as bright as the sheet. Beside it, on the side whose eased edge faces the light from below and before, a narrow light: so it
// reads as the meeting of two pieces and not as a drawn line
zCol = mix(zCol, zCol * vec3(0.74, 0.58, 0.4), zJoint * zIvory);
zCol *= 1. - 0.5 * zJoint * zGold;
vec3 zSx = dFdx(-vViewPosition), zSy = dFdy(-vViewPosition);
vec3 zR1 = cross(zSy, normal), zR2 = cross(normal, zSx);
float zDet = dot(zSx, zR1);
vec3 zGj = sign(zDet) * (dFdx(zPl.x) * zR1 + dFdy(zPl.x) * zR2) / max(abs(zDet), 1e-9);
zGj *= min(1., 1.5 / (length(zGj) + 1e-6));
float zBev = clamp(-dot(zGj, normalize((viewMatrix * vec4(0.72, -0.69, 0., 0.)).xyz)), 0., 1.);
zCol *= 1. + 0.16 * zBev * zThin * zFaceM * (zIvory + zGold) * smoothstep(zW, 1.6 * zW, zPl.x) * (1. - smoothstep(2.2 * zW, 3.6 * zW, zPl.x));
// (old oil lies amber in the ivory's creases; the other stuffs only darken there)
zCol *= mix(vec3(1.), zIvory * vec3(0.84, 0.70, 0.52) + zGold * vec3(0.79) + (1. - zIvory - zGold) * vec3(0.76), smoothstep(0.5, 5., zCrease));
#ifndef ZEUS_BUILT
// where the Victory stands on the palm: the shade of her hem on the ivory
zCol *= 1. - 0.45 * zIvory * (1. - smoothstep(0.14, 0.4, length((vZP - vec3(ZVIC)) * vec3(1., 2.4, 1.))));
#endif
float zPinM = zIvory * zFaceM * (1. - smoothstep(0.0065, 0.009, zPin)) * (1. - smoothstep(0.005, 0.012, zPix));
zCol = mix(zCol, vec3(0.84, 0.55, 0.16), zPinM);
diffuseColor.rgb = zCol;
// each plate's edge is eased down into its joint: the skin's facing is turned a little there (seen from near only:
// by the pixel's footprint)
{
  float zBf = (1. - smoothstep(0.005, 0.016, zPix)) * zFaceM;
  float zH = -((0.003 * (1. - smoothstep(0., 0.02, zPl.x)) + 0.0035 * zIvory * (1. - smoothstep(0., 0.14, zPl.x))) * (1. - zHair) + 0.002 * zHair * (1. - smoothstep(0., 0.013, zPl.x))) * zBf + 0.003 * zPinM;
  vec3 zGd = sign(zDet) * (dFdx(zH) * zR1 + dFdy(zH) * zR2);
  float zGl = length(zGd), zGm = 0.6 * abs(zDet);
  if (zGl > zGm) zGd *= zGm / zGl;
  vec3 zNn = abs(zDet) * normal - zGd;
  float zNl = dot(zNn, zNn);
  if (zNl > 1e-20) normal = zNn * inversesqrt(zNl);
  zN = normalize(inverseTransformDirection(normal, viewMatrix));
}
`;
const SHADER_LIGHT = `
{
  vec3 zV = normalize(inverseTransformDirection(geometryViewDir, viewMatrix));
  vec3 zR = reflect(-zV, zN);
  float zOpen = (1. - 0.8 * zHollow) * (1. - 0.3 * smoothstep(0.5, 5., zCrease));
  // the soft light from the sunlit floor and the door: it comes from the front and from below
  vec3 zS = vec3(max(vZP.x + 0.85 * vZP.y + 2.5, 1.5), 0., 0.3 * vZP.z);
  vec3 zL = normalize(zS - vZP);
  float zWrap = clamp((dot(zN, zL) + 0.4) / 1.4, 0., 1.); zWrap *= zWrap;
  float zFade = mix(1., 0.42, smoothstep(5.5, 12.6, vZP.y));
  // (the light keeps less of the floor's orange than the room's stone does: ivory must stay cream, gold stay gold)
  vec3 zPale = mix(uZBounce, vec3(dot(uZBounce, vec3(0.3, 0.55, 0.15))) * vec3(1.05, 1., 0.88), 0.55);
  float zFront = clamp(zN.x * 0.6 + 0.4, 0., 1.);
  // IVORY lets the light a little way in and gives it back warmer: its shade is soft, it has no hard edge of light,
  // and where it turns from the light or lies in a hollow it goes a deep warm cream, never grey. (No light is added
  // where the skin faces the light: this is the same light, reaching further round the form.)
  float zIv = zIvory;
  float zRound = clamp((dot(zN, zL) + 0.75) / 1.75, 0., 1.); zRound *= sqrt(zRound);
  vec3 zIn = vec3(1., 0.78, 0.55);
  vec3 zWr = (vec3(zWrap) + zIv * max(zRound - zWrap, 0.) * zIn) * mix(vec3(1.), vec3(1.1, 1.17, 1.2), zIv);
  // (what faces up, away from the floor's light, has the dim warm return of the roof over him, and ivory passes a little
  // light on within itself: its deepest shade is a deep brown cream, never black)
  vec3 zUp = zIv * zPale * vec3(1., 0.86, 0.7) * 0.4 * smoothstep(-0.3, 0.8, zN.y) * (1. - zRound) * (0.4 + 0.6 * zOpen);
  vec3 zOp = mix(vec3(zOpen), pow(vec3(zOpen), vec3(0.8, 1.0, 1.25)), zIv);
  // (what three.js has added so far is the room's dark fill, cool from above: in ivory it comes back out as ivory's
  // own hue, and it does not reach into the hollows)
  {
    vec3 zF = reflectedLight.indirectDiffuse; float zFl = dot(zF, vec3(0.3, 0.55, 0.15));
    reflectedLight.indirectDiffuse = mix(zF, mix(zF, zFl * vec3(1.22, 0.96, 0.66), 0.75) * mix(vec3(1.), zOp, 0.7), zIv);
  }
  // (ivory gives back what light reaches it up there more freely than gold does: the face must not be the dimmest thing
  // on him; the gold's own fall with height is not touched)
  float zFadeI = mix(zFade, mix(1., 0.53, smoothstep(5.5, 12.6, vZP.y)), zIv);
  vec3 zE = (zPale * zWr * zFadeI + uZDoor * 0.3 * zFront * sqrt(zFront)) * zOp + zUp;
  // the lamps: small and near
  vec3 zLampD = vec3(0.), zLampS = vec3(0.);
  for (int i = 0; i < 6; i++) {
    vec3 d = uZLamp[i] - vZP; float d2 = dot(d, d) + 0.05; vec3 l = d * inversesqrt(d2);
    float a = uZLampLevel[i] / (1. + d2 * 0.35);
    zLampD += a * clamp(dot(zN, l), 0., 1.);
    float sp = clamp(dot(zR, l), 0., 1.); sp *= sp; sp *= sp; sp *= sp;
    zLampS += a * sp * sp;
  }
  reflectedLight.indirectDiffuse += material.diffuseColor * (zE + uZLampCol * zLampD * zOp) * RECIPROCAL_PI;
  // what the gold (and the polish of the other stuffs) shows of the room along the mirrored ray: the blade of sun
  // on the floor before the pool, the bright door, and the dim room
  float zRo = material.roughness;
  float tF = vZP.y / max(-zR.y, 0.04); vec3 hF = vZP + zR * tF;
  float zBlade = step(zR.y, 0.) * (1. - smoothstep(1.2, 2.2 + 0.25 * tF * zRo, abs(hF.z))) * smoothstep(5.5 - 0.3 * tF * zRo, 7.5, hF.x) * (1. - smoothstep(16., 19., hF.x));
  float tD = (17. - vZP.x) / max(zR.x, 0.04); vec3 hD = vZP + zR * tD;
  float zSoft = 0.6 + 0.25 * tD * zRo;
  float zDoorM = step(0., zR.x) * (1. - smoothstep(2.5 - zSoft, 2.5 + zSoft, abs(hD.z))) * (1. - smoothstep(9.5 - zSoft, 9.5 + zSoft, hD.y)) * smoothstep(-zSoft, zSoft, hD.y);
  vec3 zEnv = zPale * (0.9 * zBlade * zFade + 0.55 * zWrap * zFade + 0.012) + uZDoor * (zDoorM + 0.12 * zFront);
  // (a mirrored ray that goes up meets the roof's timber, dim and warm in the light the statue itself sends up: not black)
  zEnv += zPale * vec3(1., 0.75, 0.5) * 0.07 * smoothstep(0.1, 0.8, zR.y);
  float zNV = clamp(dot(zN, zV), 0., 1.), zFr = 1. - zNV; zFr = zFr * zFr * zFr * zFr * zFr;
  vec3 zSpec = material.specularColor + (vec3(1.) - material.specularColor) * zFr * (1. - zRo);
  // the oiled ivory's low sheen: the light from below seen softly in the polish where it grazes the form
  vec3 zHv = normalize(zL + zV); float zSh = clamp(dot(zN, zHv), 0., 1.); zSh *= zSh; zSh *= zSh; zSh *= zSh * zSh;
  reflectedLight.indirectSpecular += zSpec * (zEnv * zOpen + uZLampCol * zLampS * 6.) + zIv * zPale * zFadeI * zOpen * 0.16 * zSh;
}
`;
function statueMaterial(U, built) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0, vertexColors: built });
  if (built) m.defines = { ZEUS_BUILT: '' };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aux; varying vec3 vZP; varying vec3 vZA;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 zP4 = vec4(transformed, 1.);\n#ifdef USE_INSTANCING\nzP4 = instanceMatrix * zP4;\n#endif\nvZP = zP4.xyz; vZA = aux;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + SHADER_HEAD)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + SHADER_STUFF
        + 'roughnessFactor = clamp((0.36 + 0.06 * zPl.y - 0.1 * zGrain) * zIvory + (0.6 + 0.1 * zTone + 0.06 * zPl.y + 0.06 * zLocks) * zGold + 0.38 * zEbony + 0.52 * zStone + 0.2 * zGem + 0.25 * zJoint - 0.1 * zPaint, 0.1, 1.);\n'
        + 'metalnessFactor = max(0.9 * zGold * (1. - 0.5 * zJoint) * (1. - zPaint), 0.9 * zPinM);\n')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + SHADER_LIGHT);
  };
  return m;
}
function statueUniforms(opts) {
  const col = (v, d) => (v && v.isColor ? v.clone() : new THREE.Color(v || d));
  const b = opts.bounce || {}, strength = b.strength === undefined ? 1 : b.strength;
  const lamps = [];
  for (let i = 0; i < 6; i++) { const l = opts.lamps && opts.lamps[i]; lamps.push(l ? new THREE.Vector3(l[0], l[1], l[2]) : new THREE.Vector3(0, -500, 0)); }
  return {
    uZBounce: { value: col(b.color, '#ffd9a8').multiplyScalar(1.3 * strength) },
    uZDoor: { value: col(opts.doorColor, '#fff0dc').multiplyScalar(0.55 * strength) },
    uZLamp: { value: lamps }, uZLampCol: { value: new THREE.Color(1.0, 0.5, 0.18).multiplyScalar(opts.lamps ? 0.3 : 0) },
    // (opts.lampLevel = { value: [six numbers about 1] }, the world's own object, read as it stands each frame: lamp i's
    // light on the statue is multiplied by value[i]; without it every lamp is steady at 1)
    uZLampLevel: opts.lampLevel && opts.lampLevel.value && opts.lampLevel.value.length >= 6 ? opts.lampLevel : { value: [1, 1, 1, 1, 1, 1] },
  };
}

// ---- the grids: boxes in the part's axes and their cells ----
const BOX_GOD = [-8.4, 1.9, -3.9, 0.0, 13.7, 3.6];
// (the head's fine grid ends behind the ears: the back of the hair, which no way through the room looks at, is drawn
// with the body's cells)
const BOX_HEAD = [-7.1, 10.92, -1.36, -5.16, 13.64, 1.36];
const BOX_FACE = [-6.0, 11.56, -0.74, -5.36, 13.04, 0.74];
// the beard below the face's grid has one of its own, fine enough for the gaps between its locks
// (down past the tips of its lowest locks: the upper body's cells are too large for a lock; seven whole cells lower than it
// was, so that the grid's own lattice, and with it every corner of the beard that was there before, stands where it stood)
const BOX_BEARD = [-6.12, 10.58 - 7 * 0.034, -0.68, -5.36, 11.56, 0.68];
const CELL_BODY = 0.116, CELL_HEAD = 0.055, CELL_FACE = 0.025, CELL_BEARD = 0.034, CELL_HAND_R = 0.042, CELL_HAND_L = 0.05, CELL_FOOT = 0.0605, LAP = 0.2;
// the hands and the feet have fine grids of their own
const BOX_FOOT_R = [-2.24, 1.9, 0.46, -0.34, 2.9, 1.66], BOX_FOOT_L = [-2.24, 1.9, -1.66, -0.34, 2.9, -0.46];
const BOX_HAND_R = [-4.02, 6.6, 2.16, -2.32, 7.5, 3.56], BOX_HAND_L = [-3.08, 11.38, -3.62, -1.98, 12.58, -2.48];
const SMALL_BOXES = [BOX_FOOT_R, BOX_FOOT_L, BOX_HAND_R, BOX_HAND_L];
// the front of the bare trunk with both shoulders, the right arm down to the wrist, the left upper arm, the mantle's
// end over the left shoulder and the roll at the hips have a finer grid too: these are the large bare forms, and the
// one piece of cloth whose folds are narrow
const BOX_NEAR = [-7.05, 7.0, -3.3, -5.1, 11.3, 3.45], CELL_NEAR = 0.078;

// ---- the statue's own outermost places, measured on its meshes, for whoever must keep a line clear of it ----
// For each named part: the true corner of the skin that lies farthest in each of nine ways (up, toward his right,
// forward, and between them). Nothing here knows any route: the world counts its own line against these points.
const WAYS = [[0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0.71, 0.71], [0.71, 0.71, 0], [0.71, 0, 0.71], [0.58, 0.58, 0.58], [-0.71, 0, 0.71], [-0.58, 0.58, 0.58]];
// each part: its mesh, a box [x0, y0, z0, x1, y1, z1] its corners lie in, and whether only flesh counts
// (spans: where the Victory's and the south women's own corners lie in the built mesh, [first, past the last])
async function outerPoints(god, built, spans, ctx) {
  const parts = {
    rightArm: [god, [-1e3, 7.05, 1.3, -4.1, 11.2, 1e3], true],
    rightHand: [god, [-4.1, 6.6, 2.1, 1e3, 7.7, 1e3], true],
    victory: [built, [-4.8, 7.05, 1.6, -2.4, 9.7, 1e3], false, spans.victory],
    head: [god, [-1e3, 11.2, -1.4, 1e3, 1e3, 1.4], false],
    knees: [god, [-3.3, 5.0, 0, 1e3, 6.8, 1e3], false],
    women: [built, [-1e3, 10.95, 1.2, -7.4, 1e3, 1e3], false, spans.women],
  };
  const out = {};
  for (const name in parts) {
    const [mesh, bx, flesh, span] = parts[name], p = mesh.geometry.attributes.position.array, a = mesh.geometry.attributes.aux.array;
    const x0 = bx[0], y0 = bx[1], z0 = bx[2], x1 = bx[3], y1 = bx[4], z1 = bx[5];
    const best = WAYS.map(() => -1e9), at = WAYS.map(() => -1);
    for (let i = span ? span[0] * 3 : 0, n = span ? span[1] * 3 : p.length; i < n; i += 3) {
      const y = p[i + 1];
      if (y <= y0 || y >= y1) continue;
      const x = p[i], z = p[i + 2];
      if (x <= x0 || x >= x1 || z <= z0 || z >= z1 || (flesh && a[i] >= 0)) continue;
      for (let q = 0; q < WAYS.length; q++) { const w = WAYS[q], d = x * w[0] + y * w[1] + z * w[2]; if (d > best[q]) { best[q] = d; at[q] = i; } }
    }
    out[name] = [...new Set(at)].filter((i) => i >= 0).map((i) => [p[i], p[i + 1], p[i + 2]]);
    await ctx.yield();
  }
  // the head's own measures, true corners of the meshes: the crown (the highest corner of hair or wreath), the beard's tip
  // (its lowest corner) and half the head's breadth (hair and wreath, above the shoulders)
  const hp = god.geometry.attributes.position.array, ha = god.geometry.attributes.aux.array, bp = built.geometry.attributes.position.array;
  let crown = [0, -1e9, 0], tip = [0, 1e9, 0], half = 0;
  for (let i = 0; i < hp.length; i += 3) {
    const y = hp[i + 1];
    if (y < 10.3) continue;
    const x = hp[i], z = hp[i + 2], az = z < 0 ? -z : z;
    if (az > 1.4 || x < -7.9) continue;
    if (y > crown[1]) crown = [x, y, z];
    if (y > 11.45) { if (az > half) half = az; } else if (y < tip[1] && y < 11.2 && ha[i] >= 0 && az < 0.7 && x > -6.2) tip = [x, y, z];
  }
  for (let i = spans.wreath[0] * 3, n = spans.wreath[1] * 3; i < n; i += 3) {
    const y = bp[i + 1], z = bp[i + 2], az = z < 0 ? -z : z;
    if (y > crown[1]) crown = [bp[i], y, z];
    if (az > half) half = az;
  }
  out.headMeasures = { crown, beardTip: tip, halfWidth: half };
  return out;
}

export async function buildHero(ctx, opts = {}) {
  const object = new THREE.Group();
  object.name = 'zeus-at-olympia';
  // on a weaker machine the skin's cells are a little larger (never the face's); nothing is left out
  const detail = opts.detail === undefined ? ((ctx.quality && ctx.quality.detail) || 1) : opts.detail;
  const coarser = detail >= 0.95 ? 1 : detail >= 0.75 ? 1.1 : 1.22;
  const F = buildGod(), R = makeReader(F);
  await ctx.yield();
  const out = makeSkin(60000, 120000);
  const wide = await listsFor(F, R, BOX_GOD[0] - 0.5, BOX_GOD[1] - 0.5, BOX_GOD[2] - 0.5, 0.5, 19, 26, 17, 0.45, ctx);
  const body = gridOver(BOX_GOD, CELL_BODY * coarser, 4);
  body.leave = [inset(BOX_HEAD, LAP), inset(BOX_NEAR, 0.16)].concat(SMALL_BOXES.map((b) => inset(b, 0.16))); body.sink = [BOX_HEAD, BOX_NEAR].concat(SMALL_BOXES); body.sinkBy = 0.035;
  const underBeard = inset(BOX_BEARD, 0.08);
  await netOver(F, R, body, out, wide, ctx);
  const nearG = gridOver(BOX_NEAR, CELL_NEAR * coarser, 3);
  nearG.leave = [inset(BOX_HEAD, LAP), underBeard]; nearG.sink = [BOX_HEAD, BOX_BEARD]; nearG.sinkBy = 0.02; nearG.reach = 0.3;
  await netOver(F, R, nearG, out, wide, ctx);
  const head = gridOver(BOX_HEAD, CELL_HEAD * coarser, 3);
  head.leave = [inset(BOX_FACE, 0.08), underBeard]; head.sink = [BOX_FACE, BOX_BEARD]; head.sinkBy = 0.015; head.reach = 0.1;
  head.far = wide; head.farReach = 0.3; head.farTop = 11.6;
  // the head's own lists for its hollows: the locks are many and small
  const near = await listsFor(F, R, BOX_HEAD[0] - 0.16, BOX_BEARD[1] - 0.16, BOX_HEAD[2] - 0.16, 0.14, 17, Math.ceil((BOX_HEAD[4] - BOX_BEARD[1] + 0.32) / 0.14), 22, 0.11, ctx);
  await netOver(F, R, head, out, near, ctx);
  const face = gridOver(BOX_FACE, CELL_FACE, 4);
  face.reach = 0.1; face.eyes = 0.75;
  await netOver(F, R, face, out, near, ctx);
  const beard = gridOver(BOX_BEARD, CELL_BEARD * coarser, 3);
  beard.reach = 0.09; beard.far = wide; beard.farReach = 0.3; beard.farTop = 99;
  await netOver(F, R, beard, out, near, ctx);
  for (const b of SMALL_BOXES) {
    const fine = gridOver(b, (b === BOX_HAND_R ? CELL_HAND_R : b === BOX_HAND_L ? CELL_HAND_L : CELL_FOOT) * coarser, 4);
    fine.reach = 0.2;
    await netOver(F, R, fine, out, wide, ctx);
  }
  const nv = out.nv, U = statueUniforms(opts);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(out.pos.slice(0, nv * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(out.nor.slice(0, nv * 3), 3));
  geo.setAttribute('aux', new THREE.BufferAttribute(out.aux.slice(0, nv * 3), 3));
  geo.setIndex(new THREE.BufferAttribute(out.idx.slice(0, out.ni), 1));
  const god = new THREE.Mesh(geo, statueMaterial(U, false));
  god.castShadow = true; god.receiveShadow = true;
  object.add(god);
  const B = makeBuilt();
  buildBase(B); buildStool(B);
  await ctx.yield();
  buildThrone(B);
  await ctx.yield();
  const spans = { victory: [B.tris() * 3, 0], women: [0, 0] };
  const wingTop = buildVictory(B);
  spans.victory[1] = spans.women[0] = B.tris() * 3;
  await ctx.yield();
  const womenTop = buildWomen(B, 1);
  spans.women[1] = B.tris() * 3;
  await ctx.yield();
  buildWomen(B, -1);
  await ctx.yield();
  const eagleTop = buildSceptre(B);
  spans.wreath = [B.tris() * 3, 0];
  buildWreath(B);
  spans.wreath[1] = B.tris() * 3;
  await ctx.yield();
  const built = new THREE.Mesh(B.geometry(), statueMaterial(U, true));
  built.castShadow = true; built.receiveShadow = true;
  object.add(built);
  await ctx.yield();
  const small = new THREE.Group();
  small.name = 'small';
  object.add(small);
  buildSmallFigures(small, built.material);
  await ctx.yield();
  const B2 = makeBuilt();
  buildBeasts(B2);
  await ctx.yield();
  buildBaseEnds(B2);
  const beasts = new THREE.Mesh(B2.geometry(), built.material);
  beasts.castShadow = true; beasts.receiveShadow = true;
  small.add(beasts);
  await ctx.yield();
  const outer = await outerPoints(god, built, spans, ctx), headMeasures = outer.headMeasures;
  delete outer.headMeasures;
  return {
    object, radius: 8, height: CROWN, center: new THREE.Vector3(-5, 6.7, 0),
    info: {
      crown: CROWN, baseTop: BASE_H, throneTop: THRONE_TOP,
      face: [FX, 12.1, 0], eyes: [FX - 0.08, EY, 0], knees: [KNEE_FRONT, KNEE_TOP, 0], lap: [-4.4, 7.0, 0], chest: [-5.5, 9.6, 0],
      victory: { foot: [VIC_FOOT[0], VIC_FOOT[1], VIC_FOOT[2]], top: [VIC_FOOT[0], wingTop, VIC_FOOT[2]], halfWidth: 1.0 },
      rightShoulder: [SHO(1)[0], SHO(1)[1] + 0.55, SHO(1)[2] + 0.45], sceptreTop: [SCEPTRE_X, eagleTop, SCEPTRE_Z],
      gracesTop: womenTop, nearest: outer,
      // head: { crown: [x, y, z], beardTip: [x, y, z], halfWidth }: true corners of the meshes, the wreath counted
      head: headMeasures,
      tris: out.ni / 3, verts: nv, wingTop, womenTop, eagleTop,
    },
    update() {}, dispose() {},
  };
}
