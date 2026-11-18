// CUT FROM THE SKY (world id: cut-from-the-sky), after Rene Magritte.
// A Belgian seaside street at night under a noon sky. We fly down it with doves cut from that sky, climb among
// weightless metal bells, pass through a 220 m canvas standing in the bay into the other hour, drop among falling
// glass that keeps its picture to a sunlit sea under the stars, and leave by a round hole in a stone wall.
//
// Painted, not lit: no lights, no fog, no textures, no pass of its own. Every surface is shaded by the style of the hero
// part (src/parts/cut-from-the-sky.js): the two skies by view ray, the rectangle test that decides which hour a region
// shows, the five-value ramp against one key, and his few marks (speckle, setts, slats, tiles, ashlar) by pixel footprint.
// post.flat: the pigments reach the screen as written. Motion runs on the clock (drift, sway, swell, doves, falling glass); the two shards that turn beside us are keyed to u.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { buildHero, STYLE_GLSL, CFS_PALETTE, CFS_MIX, makeMesher, addBeam, addLathe, curtainGeometry, addBilboquet } from '../parts/cut-from-the-sky.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (h) => new THREE.Color(h);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// the street's fall: setts level at y 27 to z 60, then down to the quay at y 3 (z 200 to 215)
const streetY = (z) => (z <= 60 ? 27 : z >= 200 ? 3 : 27 - (z - 60) * (24 / 140));

// a flat silhouette (cut) from a closed outline of [x, y] pairs: position, normal and aSway (0), in the xy plane
function outlineGeometry(pts, scale = 1) {
  const v2 = pts.map(([x, y]) => new THREE.Vector2(x * scale, y * scale));
  const tris = THREE.ShapeUtils.triangulateShape(v2, []), pos = [], nor = [], sway = [], idx = [];
  for (const p of v2) { pos.push(p.x, p.y, 0); nor.push(0, 0, 1); sway.push(0); }
  for (const t of tris) idx.push(t[0], t[1], t[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
  g.setIndex(idx);
  return g;
}
// merge indexed cut geometries (position, normal, aSway) after giving each its matrix
function mergeCuts(list) {
  const P = [], N = [], S = [], I = []; let base = 0;
  for (const g of list) {
    const p = g.attributes.position.array, n = g.attributes.normal.array, s = g.attributes.aSway.array;
    for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); }
    for (let i = 0; i < s.length; i++) S.push(s[i]);
    for (const i of g.index.array) I.push(i + base);
    base += g.attributes.position.count; g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aSway', new THREE.Float32BufferAttribute(S, 1));
  g.setIndex(I); g.computeBoundingSphere();
  return g;
}

// the bowler-hatted, overcoated back: half outline (x >= 0), feet at y 0, crown at y 1; mirrored to a closed shape
const MAN_HALF = [[0, 1.0], [0.045, 0.995], [0.075, 0.975], [0.088, 0.945], [0.092, 0.915], [0.135, 0.905], [0.14, 0.89], [0.085, 0.885],
  [0.078, 0.86], [0.07, 0.825], [0.06, 0.805], [0.075, 0.79], [0.15, 0.77], [0.185, 0.745], [0.2, 0.7], [0.21, 0.6], [0.215, 0.48], [0.21, 0.4],
  [0.2, 0.39], [0.2, 0.3], [0.195, 0.16], [0.19, 0.15], [0.13, 0.15], [0.125, 0.035], [0.15, 0.02], [0.15, 0], [0.02, 0], [0.02, 0.14], [0, 0.145]];
function manOutline() {
  const pts = MAN_HALF.map((p) => [p[0], p[1]]);
  for (let i = MAN_HALF.length - 2; i >= 1; i--) pts.push([-MAN_HALF[i][0], MAN_HALF[i][1]]);
  return pts;
}

// a house front on the street. sx: -1 port, +1 starboard. Painted solids into M; panes are flat yellow decals (kind 6)
function addHouse(M, rng, sx, z0, w, h, C, lit) {
  const zm = z0 + w / 2, yb = streetY(z0 + w) - 0.5, yt = streetY(zm) + h, xf = sx * 9, xb = sx * 19, xr = sx * 14;
  const ins = V(xr, yb + 2, zm), wallC = C.stucco[rng.int(0, C.stucco.length - 1)];
  // walls
  const yg = streetY(zm) + 3.5;                                   // the ground floor: stucco ruled in level bands (kind 10), a string course over it
  M.quad(V(xf, yb, z0), V(xf, yb, z0 + w), V(xf, yg, z0 + w), V(xf, yg, z0), ins, wallC, 0, 10);
  M.quad(V(xf, yg, z0), V(xf, yg, z0 + w), V(xf, yt, z0 + w), V(xf, yt, z0), ins, wallC);
  M.quad(V(xf - sx * 0.1, yg, z0), V(xf - sx * 0.1, yg, z0 + w), V(xf - sx * 0.1, yg + 0.24, z0 + w), V(xf - sx * 0.1, yg + 0.24, z0), ins, C.trim);
  M.quad(V(xb, yb, z0), V(xb, yb, z0 + w), V(xb, yt, z0 + w), V(xb, yt, z0), ins, wallC);
  for (const z of [z0, z0 + w]) {
    M.quad(V(xf, yb, z), V(xb, yb, z), V(xb, yt, z), V(xf, yt, z), ins, wallC);
    M.tri(V(xf, yt, z), V(xb, yt, z), V(xr, yt + 3.2, z), ins, wallC);
  }
  // roof: two tiled slopes with a small overhang, ridge along the street
  const ov = 0.45, roofC = C.roof;
  M.kind = 5;
  M.quad(V(xf - sx * ov, yt - 0.25, z0 - 0.2), V(xf - sx * ov, yt - 0.25, z0 + w + 0.2), V(xr, yt + 3.3, z0 + w + 0.2), V(xr, yt + 3.3, z0 - 0.2), ins, roofC);
  M.quad(V(xb + sx * ov, yt - 0.25, z0 - 0.2), V(xb + sx * ov, yt - 0.25, z0 + w + 0.2), V(xr, yt + 3.3, z0 + w + 0.2), V(xr, yt + 3.3, z0 - 0.2), ins, roofC);
  M.kind = 0;
  // chimney
  const cz = z0 + rng.range(0.8, w - 1.6), cx = xr - sx * rng.range(0.5, 3), cb = yt + 1.2, ct = yt + 5.2;
  addBeam(M, V(cx, cb, cz), V(cx, ct, cz), V(1, 0, 0), 1.1, 0.8, 1.1, 0.8, wallC, { ch: 0.02 });
  addBeam(M, V(cx, ct, cz), V(cx, ct + 0.25, cz), V(1, 0, 0), 1.4, 1.1, 1.4, 1.1, C.roof, { ch: 0.02 });
  // cornice and plinth, a value lighter and darker
  const xo = xf - sx * 0.12;
  M.quad(V(xo, yt - 0.55, z0), V(xo, yt - 0.55, z0 + w), V(xo, yt - 0.2, z0 + w), V(xo, yt - 0.2, z0), ins, C.trim);
  M.quad(V(xo, yb, z0), V(xo, yb, z0 + w), V(xo, streetY(z0) + 0.9, z0 + w), V(xo, streetY(z0) + 0.9, z0), ins, C.plinth);
  // windows: rows of oblongs with shutters; one cross bar is the wall showing between four panes
  const floors = Math.max(2, Math.round((h - 1.5) / 3.3)), cols = Math.max(2, Math.round(w / 3.1)), shC = C.shutter[rng.int(0, C.shutter.length - 1)];
  const door = rng.int(0, cols - 1), xw = xf - sx * 0.07, xs = xf - sx * 0.14, base = streetY(zm);
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const wz = z0 + (c + 0.5) * (w / cols), wy = base + 1.25 + f * ((h - 1.9) / floors), ww = 1.15, wh = f === 0 ? 1.9 : 1.75;
    if (f === 0 && c === door) {                                  // the door: dark panels, a pale step
      M.quad(V(xw, base - 0.4, wz - 0.65), V(xw, base - 0.4, wz + 0.65), V(xw, base + 2.5, wz + 0.65), V(xw, base + 2.5, wz - 0.65), ins, C.door, 0, 1);
      M.quad(V(xs, base + 2.6, wz - 0.8), V(xs, base + 2.6, wz + 0.8), V(xs, base + 2.85, wz + 0.8), V(xs, base + 2.85, wz - 0.8), ins, C.trim);
      continue;
    }
    const on = lit(), ph = rng(), paneC = on ? C.yellow : C.pane, kind = on ? 6 : 1, g = 0.045;
    for (const [a0, a1] of [[-ww / 2, -g], [g, ww / 2]]) for (const [b0, b1] of [[0, wh * 0.55 - g], [wh * 0.55 + g, wh]]) {
      M.quad(V(xw, wy + b0, wz + a0), V(xw, wy + b0, wz + a1), V(xw, wy + b1, wz + a1), V(xw, wy + b1, wz + a0), ins, paneC, ph, kind);
    }
    M.quad(V(xs, wy - 0.16, wz - ww / 2 - 0.1), V(xs, wy - 0.16, wz + ww / 2 + 0.1), V(xs, wy, wz + ww / 2 + 0.1), V(xs, wy, wz - ww / 2 - 0.1), ins, C.trim);
    M.kind = 4;
    for (const sd of [-1, 1]) {
      const s0 = wz + sd * (ww / 2 + 0.04), s1 = s0 + sd * 0.56;
      M.quad(V(xs, wy, s0), V(xs, wy, s1), V(xs, wy + wh, s1), V(xs, wy + wh, s0), ins, shC);
    }
    M.kind = 0;
  }
}

// the leaf that is a tree: one veined leaf standing on its stalk. Returns the range of triangles it added (for aSway).
function addLeaf(M, base, H, yaw, C, winter) {
  const t0 = M.count(), R = V(Math.cos(yaw), 0, -Math.sin(yaw)), F = V(Math.sin(yaw), 0, Math.cos(yaw)), U = V(0, 1, 0);
  const y0 = H * 0.17, BH = H - y0, W = H * 0.235;
  const hw = (t) => W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.8) * (1 - 0.1 * t) + 0.02;
  const P = (t, s, off = 0) => {                                  // a point of the blade: t up the midrib, s across (-1..1)
    const w = hw(t), z = 0.22 * w * Math.pow(Math.abs(s), 1.6) + H * 0.07 * t * t + off;
    return V().copy(base).addScaledVector(U, y0 + t * BH).addScaledVector(R, s * w).addScaledVector(F, z);
  };
  const Nn = (t, s) => { const a = P(Math.min(t + 0.01, 1), s).sub(P(Math.max(t - 0.01, 0), s)), b = P(t, s + 0.02).sub(P(t, s - 0.02)); return b.cross(a).normalize(); };
  // the stalk
  addBeam(M, V().copy(base).addScaledVector(U, -0.3), P(0.02, 0), R, H * 0.028, H * 0.028, H * 0.016, H * 0.016, C.leafVein, { ch: 0.3 });
  if (!winter) {
    const nt = 16, ns = 8;
    for (let i = 0; i < nt; i++) for (let j = 0; j < ns; j++) {
      const ta = i / nt, tb = (i + 1) / nt, sa = j / ns * 2 - 1, sb = (j + 1) / ns * 2 - 1;
      const a = P(ta, sa), b = P(ta, sb), c = P(tb, sb), d = P(tb, sa), na = Nn(ta, sa), nb = Nn(ta, sb), nc = Nn(tb, sb), nd = Nn(tb, sa);
      M.triN(a, b, c, na, nb, nc, C.leaf); M.triN(a, c, d, na, nc, nd, C.leaf);
    }
  }
  // midrib and ruled side veins: ribbons a value lighter, on both faces (bare branches in winter)
  const rib = (ta, sa, tb, sb, wa, wb) => {
    const n = 5;
    for (const off of winter ? [0] : [0.05, -0.05]) for (let k = 0; k < n; k++) {
      const f0 = k / n, f1 = (k + 1) / n, A = P(lerp(ta, tb, f0), lerp(sa, sb, f0), off), B = P(lerp(ta, tb, f1), lerp(sa, sb, f1), off);
      const dir = V().subVectors(B, A).normalize(), nrm = Nn(lerp(ta, tb, f0), lerp(sa, sb, f0)), side = V().crossVectors(dir, nrm).normalize();
      const w0 = lerp(wa, wb, f0) / 2, w1 = lerp(wa, wb, f1) / 2;
      const a = V().copy(A).addScaledVector(side, -w0), b = V().copy(A).addScaledVector(side, w0), c = V().copy(B).addScaledVector(side, w1), d = V().copy(B).addScaledVector(side, -w1);
      M.triN(a, b, c, nrm, nrm, nrm, C.leafVein); M.triN(a, c, d, nrm, nrm, nrm, C.leafVein);
    }
  };
  const vw = H * (winter ? 0.022 : 0.012);
  rib(0, 0, 1, 0, vw * 1.7, vw * 0.5);
  for (let k = 0; k < 7; k++) {
    const t = 0.1 + k * 0.105;
    for (const sd of [-1, 1]) rib(t, 0, Math.min(t + 0.2, 0.99), sd * 0.93, vw, vw * 0.4);
  }
  return { t0, t1: M.count(), y: base.y + y0, H: BH, amp: H * 0.045 };
}

// a sleigh bell: a smooth metal ball with one slit (two round eyes joined by a slot), facing "slit", and its lug
function addBell(M, O, R, slit, C) {
  const D = V().copy(slit).normalize(), prof = [], n = 20;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; prof.push([Math.max(R * Math.sin(a), 0), R * (1 - Math.cos(a))]); }
  prof[0][0] = 0; prof[n][0] = 0;
  addLathe(M, V().copy(O).addScaledVector(D, -R), D, prof, 32, C.metal, 1);
  // the slit: a dark strip on the great circle through the facing pole, and its two eyes
  const side = V().crossVectors(D, Math.abs(D.y) > 0.85 ? V(1, 0, 0) : V(0, 1, 0)).normalize(), across = V().crossVectors(D, side).normalize();
  const rr = R * 1.012, hw = R * 0.05, span = 1.02, m = 14;
  const at = (a, w) => V().copy(O).addScaledVector(D, Math.cos(a) * rr).addScaledVector(side, Math.sin(a) * rr).addScaledVector(across, w);
  for (let i = 0; i < m; i++) {
    const a0 = -span + (i / m) * 2 * span, a1 = -span + ((i + 1) / m) * 2 * span;
    M.quad(at(a0, -hw), at(a0, hw), at(a1, hw), at(a1, -hw), O, C.slit, 0, 1);
  }
  for (const sg of [-1, 1]) {
    const c = at(sg * span, 0), tn = V().copy(D).multiplyScalar(-Math.sin(sg * span)).addScaledVector(side, Math.cos(sg * span)), pts = [];
    for (let k = 0; k < 14; k++) { const an = k / 14 * Math.PI * 2; pts.push(V().copy(c).addScaledVector(tn, Math.cos(an) * hw * 2.3).addScaledVector(across, Math.sin(an) * hw * 2.3)); }
    for (let k = 0; k < 14; k++) M.tri(c, pts[k], pts[(k + 1) % 14], O, C.slit, 0, 1);
  }
  const up = V().copy(D).negate();
  addLathe(M, V().copy(O).addScaledVector(up, R * 0.985), up, [[0, 0], [R * 0.15, 0], [R * 0.15, R * 0.07], [R * 0.08, R * 0.1], [R * 0.08, R * 0.2], [R * 0.05, R * 0.24], [0, R * 0.25]], 12, C.metal, 1);
}

// a bare boulder: a rough stone egg, speckled
function addBoulder(M, noise, O, R, seed, C) {
  const g = new THREE.IcosahedronGeometry(1, R > 25 ? 4 : 3), p = g.attributes.position.array, d = V(), e1 = V(), e2 = V();
  const rad = (v) => 1 + 0.2 * noise.fbm3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3, 3) + 0.07 * noise.n3(v.x * 5 + seed, v.y * 5, v.z * 5);
  const sc = V(1, 0.78, 0.86), at = (v) => V().copy(v).multiplyScalar(rad(v)).multiply(sc).multiplyScalar(R).add(O);
  const nrm = (v) => {
    e1.crossVectors(v, Math.abs(v.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize(); e2.crossVectors(v, e1);
    const a = at(V().copy(v).addScaledVector(e1, 0.03).normalize()).sub(at(V().copy(v).addScaledVector(e1, -0.03).normalize()));
    const b = at(V().copy(v).addScaledVector(e2, 0.03).normalize()).sub(at(V().copy(v).addScaledVector(e2, -0.03).normalize()));
    const n = a.cross(b).normalize(); if (n.dot(v) < 0) n.negate(); return n;
  };
  const vs = [V(), V(), V()];
  for (let i = 0; i < p.length; i += 9) {
    for (let k = 0; k < 3; k++) vs[k].set(p[i + k * 3], p[i + k * 3 + 1], p[i + k * 3 + 2]).normalize();
    M.triN(at(vs[0]), at(vs[1]), at(vs[2]), nrm(vs[0]), nrm(vs[1]), nrm(vs[2]), C.metal, 0, 2);
  }
  g.dispose();
}

// a real cumulus: 5 to 9 fused puffs, flat-bottomed (kind 7: lead white top, grey underside). W: its width
function addCumulus(M, rng, O, W, ico, C) {
  const n = rng.int(5, 9), down = V(0, -1, 0), y0 = O.y, vs = [V(), V(), V()], ns = [V(), V(), V()], puffs = [];
  let top = y0 + 1;
  for (let i = 0; i < n; i++) {
    // alike to the cumulus of the dome: a row of small puffs along the whole width (each about an eighth of it across),
    // a little taller in the middle, so the top is scalloped and the foot one flat line
    const t = (i + 0.5) / n * 2 - 1, r = W * (0.075 + 0.07 * (1 - t * t) + 0.05 * rng());
    const c = V(O.x + t * W * 0.42 + rng.range(-0.03, 0.03) * W, y0 + r * (0.35 + 0.5 * rng() * (1 - Math.abs(t))), O.z + rng.range(-0.08, 0.08) * W);
    puffs.push({ c, r }); top = Math.max(top, c.y + r);
  }
  // the colour attribute of a cumulus carries its foot and its height (g, b): the paint turns grey towards the foot
  const tag = new THREE.Color().setRGB(1, y0, top - y0);
  for (let i = 0; i < n; i++) {
    const { c, r } = puffs[i];
    for (let j = 0; j < ico.length; j += 9) {
      let below = 0;
      for (let k = 0; k < 3; k++) {
        ns[k].set(ico[j + k * 3], ico[j + k * 3 + 1], ico[j + k * 3 + 2]); vs[k].copy(ns[k]).multiplyScalar(r).add(c);
        if (vs[k].y < y0) { vs[k].y = y0; ns[k].copy(down); below++; }
        // the crease where two puffs meet: how near this point is to another puff's surface rides in the LENGTH of the
        // normal (1 clear, 0.5 in the crease), and the paint turns it grey there, so the puffs are drawn apart on any side
        let gap = 1e9;
        for (let q = 0; q < n; q++) if (q !== i) gap = Math.min(gap, vs[k].distanceTo(puffs[q].c) - puffs[q].r);
        ns[k].multiplyScalar(1 - 0.5 * (1 - sstep(0, 0.36 * r, gap)));
      }
      if (below === 3 && (i % 2)) continue;
      M.triN(vs[0].clone(), vs[1].clone(), vs[2].clone(), ns[0].clone(), ns[1].clone(), ns[2].clone(), tag, 0, 7);
    }
  }
}

// a four-pane street lamp, 5.5 m tall, standing at (x, z) on the setts; flat yellow panes with one cross bar, no halo
function addLamp(M, x, z, C) {
  const y = streetY(z), X = V(1, 0, 0), top = y + 5.5;
  addLathe(M, V(x, y - 0.3, z), V(0, 1, 0), [[0.26, 0], [0.26, 0.55], [0.17, 0.75], [0.11, 0.95], [0.085, 1.4], [0.07, 4.25], [0.1, 4.35], [0.2, 4.42], [0.2, 4.5], [0, 4.5]], 12, C.iron, 0.5);
  const yb = y + 4.2, yt = top - 0.42, rb = 0.2, rt = 0.36, ins = V(x, (yb + yt) / 2, z);
  const corner = (r, yy, k) => V(x + r * (k === 0 || k === 3 ? -1 : 1), yy, z + r * (k < 2 ? -1 : 1));
  for (let k = 0; k < 4; k++) {
    const a = corner(rb, yb, k), b = corner(rb, yb, (k + 1) % 4), c = corner(rt, yt, (k + 1) % 4), d = corner(rt, yt, k);
    M.quad(a, b, c, d, ins, C.yellow, 0, 1);
    addBeam(M, a, d, X, 0.05, 0.05, 0.05, 0.05, C.iron, { ch: 0.2 });
    const m0 = V().lerpVectors(a, d, 0.5), m1 = V().lerpVectors(b, c, 0.5), o = V().subVectors(m0, ins).setY(0).add(V().subVectors(m1, ins).setY(0)).normalize().multiplyScalar(0.02);
    addBeam(M, m0.add(o), m1.add(o), V(0, 1, 0), 0.035, 0.035, 0.035, 0.035, C.iron, { ch: 0.2 });
    addBeam(M, corner(rt, yt, k), corner(rt, yt, (k + 1) % 4), V(0, 1, 0), 0.06, 0.06, 0.06, 0.06, C.iron, { ch: 0.2 });
    M.tri(corner(rt + 0.08, yt + 0.03, k), corner(rt + 0.08, yt + 0.03, (k + 1) % 4), V(x, top - 0.12, z), ins, C.iron, 0.5);
  }
  addLathe(M, V(x, top - 0.14, z), V(0, 1, 0), [[0.05, 0], [0.07, 0.05], [0.03, 0.1], [0, 0.14]], 8, C.iron, 0.5);
}

// ---------------------------------------------------------------------------------------------------------
// Glass that keeps its picture: a slab with a pale edge; one face holds a frozen night, the other a frozen noon,
// stored as a ray per vertex, so the picture turns with the shard. Every piece carries its own placement in its
// vertices (origin, axis, spin, fall), so all the glass of the world is one draw and one more for its image in the sea.
// ---------------------------------------------------------------------------------------------------------
const GLASS_VERT = /* glsl */`
  attribute vec3 aPic; attribute float aFace; attribute vec4 aA; attribute vec4 aB; attribute vec4 aC;
  uniform float uT; uniform float uTu; uniform float uSeaY; uniform float uMirror;
  varying vec3 vW; varying vec3 vPic; varying float vFace; varying vec3 vN;
  vec3 rot(vec3 p, vec3 k, float a){ float c=cos(a), s=sin(a); return p*c+cross(k,p)*s+k*dot(k,p)*(1.-c); }
  void main(){
    float fall=aC.y;
    float T=sqrt(max(aA.y+aA.w*1.3,1.)/.49);                  // seconds from its height to under the sea, at a tenth of gravity
    float t=mod(mix(uT,uTu,aC.z)+aB.w,T), ang=aC.w+aC.x*t;
    vec3 p=rot(position,aB.xyz,ang);
    vec3 w=aA.xyz+p*mix(1.,smoothstep(0.,.9,t),fall); w.y-=fall*.49*t*t;
    vN=rot(normal,aB.xyz,ang); vPic=aPic; vFace=aFace;
    if(uMirror>.5) w.y=2.*uSeaY-w.y;
    vW=w; gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
  }`;
const GLASS_FRAG = STYLE_GLSL + /* glsl */`
  uniform float uMirror;
  varying vec3 vW; varying vec3 vPic; varying float vFace; varying vec3 vN;
  void main(){
    vec3 eye=cameraPosition, ea=eye, pb=vW;
    if(uMirror>.5){ ea.y=2.*uSeaY-ea.y; pb.y=2.*uSeaY-pb.y; if(vW.y>uSeaY) discard; }
    else if(vW.y<uSeaY) discard;
    if(cfsCross(ea,pb)<-.5) discard;
    vec3 c;
    if(abs(vFace)<.5){
      vec3 n=normalize(vN+vec3(0.,1e-6,0.));
      c=uP[3]*(.84+.16*cfsRamp(dot(n,uKey)));
    } else {
      vec3 d=normalize(vPic+vec3(0.,1e-6,0.));
      float px=max(length(fwidth(d))*.7,1e-5);
      if(vFace>0.) c=cfsNight(d,0.,px); else c=cfsNoon(d,0.,px);
    }
    if(uMirror>.5) c=mix(c,mix(uP[6],uP[7],cfsWhich(eye,vW)),.58);
    gl_FragColor=vec4(c,1.);
  }`;
function makeGlassCollector() {
  const pos = [], nor = [], pic = [], face = [], A = [], B = [], Cc = [], idx = [];
  const G = {
    // poly: [x, y] outline (local); o: { origin, size, axis, angle, spin, fall, phase, az, thick, flip }
    add(poly, o) {
      const th = (o.thick ?? 1.2) / 2, n = poly.length, v2 = poly.map(([x, y]) => new THREE.Vector2(x, y));
      const tris = THREE.ShapeUtils.triangulateShape(v2, []);
      const put = (x, y, z, nx, ny, nz, f) => {
        // the frozen picture: a ray per vertex. A shard holds its own scrap of sky; the lights of the window (o.pic) hold ONE
        // sky between them, 1 m of glass to 1/130 radian, its horizon at the sill, so each light carries whole cumulus
        const az = o.pic ? o.pic.az0 + x * o.pic.perM : o.az + (x / o.size) * 0.55;
        const el = Math.min(1.2, Math.max(0.04, o.pic ? o.pic.el0 + y * o.pic.perM : (f > 0 ? 0.5 : 0.36) + (y / o.size) * 0.5));
        pos.push(x, y, z); nor.push(nx, ny, nz); face.push(f);
        pic.push(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        A.push(o.origin.x, o.origin.y, o.origin.z, o.size); B.push(o.axis.x, o.axis.y, o.axis.z, o.phase || 0); Cc.push(o.spin || 0, o.fall ? 1 : 0, o.keyed ? 1 : 0, o.angle || 0);
        return pos.length / 3 - 1;
      };
      for (const sg of [1, -1]) {
        const b = pos.length / 3;
        for (const p of poly) put(p[0], p[1], sg * th, 0, 0, sg, sg * (o.flip ? -1 : 1));
        for (const t of tris) idx.push(b + t[0], b + t[1], b + t[2]);
      }
      let area = 0; for (let i = 0; i < n; i++) { const a = poly[i], c = poly[(i + 1) % n]; area += a[0] * c[1] - c[0] * a[1]; }
      const sgn = area > 0 ? 1 : -1, rim = o.rim || 0.25, ins = [];
      for (let i = 0; i < n; i++) {                              // inset outline: the ground edge of the glass, seen on its face
        const a = poly[(i + n - 1) % n], b = poly[i], c = poly[(i + 1) % n];
        let n1x = -(b[1] - a[1]), n1y = b[0] - a[0], n2x = -(c[1] - b[1]), n2y = c[0] - b[0];
        const l1 = Math.hypot(n1x, n1y) || 1, l2 = Math.hypot(n2x, n2y) || 1; n1x *= sgn / l1; n1y *= sgn / l1; n2x *= sgn / l2; n2y *= sgn / l2;
        const k = rim / Math.max(0.35, 1 + n1x * n2x + n1y * n2y);
        ins.push([b[0] + (n1x + n2x) * k, b[1] + (n1y + n2y) * k]);
      }
      for (const sg of [1, -1]) for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, z = sg * (th + 0.03);
        const i0 = put(poly[i][0], poly[i][1], z, 0, 0, sg, 0), i1 = put(poly[j][0], poly[j][1], z, 0, 0, sg, 0), i2 = put(ins[j][0], ins[j][1], z, 0, 0, sg, 0), i3 = put(ins[i][0], ins[i][1], z, 0, 0, sg, 0);
        idx.push(i0, i1, i2, i0, i2, i3);
      }
      for (let i = 0; i < n; i++) {
        const a = poly[i], c = poly[(i + 1) % n], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1;
        const i0 = put(a[0], a[1], th, dy / l, -dx / l, 0, 0), i1 = put(c[0], c[1], th, dy / l, -dx / l, 0, 0);
        const i2 = put(c[0], c[1], -th, dy / l, -dx / l, 0, 0), i3 = put(a[0], a[1], -th, dy / l, -dx / l, 0, 0);
        idx.push(i0, i1, i2, i0, i2, i3);
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry(), f = (a, k) => new THREE.Float32BufferAttribute(a, k);
      g.setAttribute('position', f(pos, 3)); g.setAttribute('normal', f(nor, 3)); g.setAttribute('aPic', f(pic, 3)); g.setAttribute('aFace', f(face, 1));
      g.setAttribute('aA', f(A, 4)); g.setAttribute('aB', f(B, 4)); g.setAttribute('aC', f(Cc, 4)); g.setIndex(idx);
      return g;
    },
  };
  return G;
}
// a jagged shard outline about its centre (falling) or standing on its base (tall, pointed)
function shardPoly(rng, s, standing) {
  if (standing) {
    const w = s * rng.range(0.2, 0.3);
    return [[-0.5 * w, -0.06 * s], [0.5 * w, -0.06 * s], [w * rng.range(0.55, 0.75), s * rng.range(0.25, 0.38)], [w * rng.range(0.15, 0.35), s * rng.range(0.62, 0.78)],
      [w * rng.range(-0.05, 0.12), s], [w * rng.range(-0.3, -0.15), s * rng.range(0.7, 0.84)], [-w * rng.range(0.5, 0.7), s * rng.range(0.36, 0.5)]];
  }
  const n = rng.int(5, 7), pts = [], a0 = rng.range(0, 6.28);
  for (let i = 0; i < n; i++) { const a = a0 - (i + rng.range(-0.3, 0.3)) / n * Math.PI * 2, r = s * rng.range(0.28, 0.62); pts.push([Math.cos(a) * r * 0.8, Math.sin(a) * r]); }
  return pts;
}

// the exit: a plain wall of grey ashlar with a round opening. O: the opening's centre at sea level; T: along the wall;
// dir: the way we travel. 30 m wide, 26 m high, 3 m thick, opening 14.6 m across centred 8 m up
function addWall(M, O, T, dir, C) {
  const HW = 15, HT = 26, CY = 8, R = 7.3, U = V(0, 1, 0);
  const P = (a, y, d) => V().copy(O).addScaledVector(T, a).addScaledVector(U, y).addScaledVector(dir, d);
  const angs = [];
  for (let i = 0; i < 64; i++) angs.push(i / 64 * Math.PI * 2);
  for (const [cx, cy] of [[HW, 0], [-HW, 0], [HW, HT], [-HW, HT]]) angs.push((Math.atan2(cy - CY, cx) + Math.PI * 2) % (Math.PI * 2));
  angs.sort((a, b) => a - b);
  const outer = (a) => {
    const c = Math.cos(a), s = Math.sin(a);
    const tx = Math.abs(c) > 1e-6 ? HW / Math.abs(c) : 1e9, ty = s > 1e-6 ? (HT - CY) / s : s < -1e-6 ? CY / -s : 1e9, t = Math.min(tx, ty);
    return [c * t, CY + s * t];
  };
  M.kind = 8;
  for (const d of [0.3, 3.3]) {
    const ins = P(0, CY, 1.8);
    for (let i = 0; i < angs.length; i++) {
      const a0 = angs[i], a1 = angs[(i + 1) % angs.length], o0 = outer(a0), o1 = outer(a1);
      M.quad(P(Math.cos(a0) * R, CY + Math.sin(a0) * R, d), P(Math.cos(a1) * R, CY + Math.sin(a1) * R, d), P(o1[0], o1[1], d), P(o0[0], o0[1], d), ins, C.metal);
    }
  }
  for (let i = 0; i < 64; i++) {                                 // the reveal of the opening
    const a0 = i / 64 * Math.PI * 2, a1 = (i + 1) / 64 * Math.PI * 2, far = P(Math.cos((a0 + a1) / 2) * 30, CY + Math.sin((a0 + a1) / 2) * 30, 1.8);
    M.quad(P(Math.cos(a0) * R, CY + Math.sin(a0) * R, 0.3), P(Math.cos(a1) * R, CY + Math.sin(a1) * R, 0.3), P(Math.cos(a1) * R, CY + Math.sin(a1) * R, 3.3), P(Math.cos(a0) * R, CY + Math.sin(a0) * R, 3.3), far, C.metal);
  }
  // the opening's dressed ring: a band of paler stone 2.6 m wide round it, standing 0.35 m proud of the face (speckled, kind 2)
  { const R1 = R + 2.6, pale = new THREE.Color('#B4B9BE');
    for (let i = 0; i < 64; i++) {
      const a0 = i / 64 * Math.PI * 2, a1 = (i + 1) / 64 * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), back = P((c0 + c1) * 0.5 * (R + 1.3), CY + (s0 + s1) * 0.5 * (R + 1.3), 2);
      M.quad(P(c0 * R, CY + s0 * R, -0.05), P(c1 * R, CY + s1 * R, -0.05), P(c1 * R1, CY + s1 * R1, -0.05), P(c0 * R1, CY + s0 * R1, -0.05), back, pale, 0, 2);
      M.quad(P(c0 * R1, CY + s0 * R1, -0.05), P(c1 * R1, CY + s1 * R1, -0.05), P(c1 * R1, CY + s1 * R1, 0.3), P(c0 * R1, CY + s0 * R1, 0.3), P(0, CY, 0.12), pale, 0, 2);
      M.quad(P(c0 * R, CY + s0 * R, -0.05), P(c1 * R, CY + s1 * R, -0.05), P(c1 * R, CY + s1 * R, 0.3), P(c0 * R, CY + s0 * R, 0.3), P((c0 + c1) * 15, CY + (s0 + s1) * 15, 0.12), pale, 0, 2);
    } }
  const mid = P(0, 13, 1.8);
  M.quad(P(-HW, HT, 0.3), P(HW, HT, 0.3), P(HW, HT, 3.3), P(-HW, HT, 3.3), mid, C.metal);
  for (const sg of [-1, 1]) M.quad(P(sg * HW, 0, 0.3), P(sg * HW, HT, 0.3), P(sg * HW, HT, 3.3), P(sg * HW, 0, 3.3), mid, C.metal);
  // a plain coping, a value lighter
  M.kind = 2;
  addBeam(M, P(-HW - 0.5, HT + 0.45, 1.8), P(HW + 0.5, HT + 0.45, 1.8), U, 0.9, 4.2, 0.9, 4.2, C.metal, { ch: 0.08 });
  M.kind = 0;
}

const MASK_VERT = /* glsl */`
  varying vec3 vW;
  void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const MASK_FRAG = STYLE_GLSL + /* glsl */`
  varying vec3 vW;
  void main(){
    vec3 eye=cameraPosition;
    if(cfsSide(eye)>.5||cfsCross(eye,vW)>-.5) discard;             // only from the noon side, past the canvas
    vec3 d=normalize(vW-eye+vec3(0.,1e-7,0.));
    float px=max(length(fwidth(d))*.7,1e-5), py=max(fwidth(d.y),1e-5);
    vec3 c=vec3(0.);
    float hz=smoothstep(-py,py,d.y);
    if(hz>0.) c+=hz*cfsHour(vec3(d.x,max(d.y,0.),d.z),0.,1.,px);
    if(hz<1.){ float t=(eye.y-uSeaY)/max(-d.y,py*.5); vec3 P=eye+d*t; c+=(1.-hz)*cfsSea(P,eye,cfsWhich(eye,P),px); }
    gl_FragColor=vec4(c,1.);
  }`;

export default {
  id: 'cut-from-the-sky',
  name: 'Cut from the Sky',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'René Magritte, 1898 to 1967',
  weirdness: 0.8,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, tick = () => ctx.yield();
    const detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const vary = ctx.vary || {};
    const scene = new THREE.Scene();
    // things added after the first hand-in take their numbers from streams of their own, so that no earlier draw moves
    const own = (label) => makeRng(hashSeed((ctx.seed ?? 0) + ':cfs:' + label));

    // ---- the edition (seeded once): weather, season, cast, lit windows; the rare stone edition
    const vr = rng.fork ? rng.fork('edition') : rng;
    const packed = vr.chance(0.35), winter = vr.chance(0.3);
    const castPick = vr(), cast = castPick < 0.5 ? 'bells' : castPick < 0.72 ? 'boulders' : 'both';
    const menCount = vr.chance(0.3) ? 1 : 3;
    const stone = !!vary.rare;
    const hour = vary.hour || 'any';
    const litTarget = Math.round((hour === 'night' ? 60 : hour === 'day' ? 20 : hour === 'golden' || hour === 'dawn' ? 44 : lerp(50, 60, (vr.range(30, 56) - 30) / 26)));

    const C = {
      stucco: [col('#2B3037'), col('#2D3239'), col('#292E36'), col('#30353B')], roof: col('#252A32'), trim: col('#4A525C'), plinth: col('#23282F'),
      door: col('#1E242B'), pane: col('#1E242B'), yellow: col(CFS_PALETTE[5]), shutter: [col('#3E5548'), col('#44566A'), col('#55503F'), col('#39506A')],
      setts: col('#363C45'), pave: col('#434A54'), stone: col(CFS_MIX.metal), metal: col(CFS_MIX.metal), slit: col('#2B3037'), iron: col('#1E242B'),
      leaf: col(CFS_MIX.leaf), leafVein: col('#3A5246'), white: col(CFS_PALETTE[1]), wood: col(CFS_MIX.wood), land: col(CFS_MIX.leaf), shadow: col('#1E242B'),
    };

    // ---- the hero: the canvas of the other hour, seated as the brief says
    const hero = await buildHero(ctx, { palette: CFS_PALETTE, detail, beyond: false, stone, mirror: true, sky: true });
    const seat = hero.anchors.placement;
    hero.object.position.copy(seat.position); hero.object.rotation.y = seat.rotationY;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const S = hero.style, U = S.uniforms;
    U.uSky.value.x = packed ? 1 : 0;
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const cross = toWorld(hero.anchors.crossing.position);                 // (-20, 110, 418)
    const head = hero.anchors.crossing.heading.clone().transformDirection(hero.object.matrixWorld).normalize();   // 18 degrees to port of +Z
    const along = (t, y) => V(cross.x + head.x * t, y, cross.z + head.z * t);
    await tick();

    // ---- the flight: street, bells, the swing, through the canvas square, the frame, the drop, the sea, the wall
    const exit = V(-150, 8, 900), fromSea = along(285, 8);
    const edir = V().subVectors(exit, fromSea).setY(0).normalize();
    const path = makePath([
      [0, 35, 0], [0, 35, 30], [0, 34.6, 60], [0.3, 27, 105], [0, 19.5, 150], [-1, 24, 186], [-1, 42, 232],
      [14, 54, 258], along(-150, 64), along(-100, 83), along(-50, 100), along(-15, 108.6), cross.clone(), along(45, 110),
      along(86, 106), along(123, 97), along(172, 68), along(220, 31), along(255, 13), fromSea,
      V().copy(exit).addScaledVector(edir, -160), V().copy(exit).addScaledVector(edir, -120), V().copy(exit).addScaledVector(edir, -60), exit.clone(),
    ]);
    const L = path.length;
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const uBell = uAt(-1, 236), uCross = uAt(cross.x, cross.z), uFrame = uAt(along(123, 0).x, along(123, 0).z);
    // a table of the route every 2 m: position and the level "port" direction (screen right), for the dove lane
    const TN = Math.ceil(L / 2) + 1, tabP = new Float32Array(TN * 3), tabR = new Float32Array(TN * 3);
    { const p = V(), t = V();
      for (let i = 0; i < TN; i++) {
        const d = Math.min(L, i * 2); path.posAtDist(d, p); path.tangentAtDist(d, t);
        const l = Math.hypot(t.x, t.z) || 1;
        tabP[i * 3] = p.x; tabP[i * 3 + 1] = p.y; tabP[i * 3 + 2] = p.z; tabR[i * 3] = -t.z / l; tabR[i * 3 + 1] = 0; tabR[i * 3 + 2] = t.x / l;
      } }
    await tick();

    const add = (geo, mat, order = 0, name = '') => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.name = name; scene.add(m); return m; };

    // ---- the town: land, setts, pavements, quay and parapet
    const MT = makeMesher();
    { const under = V(0, -50, 80), zs = [-60, -20, 20, 60, 95, 130, 165, 200];
      for (let i = 0; i < zs.length - 1; i++) {
        const z0 = zs[i], z1 = zs[i + 1], y0 = streetY(z0), y1 = streetY(z1);
        MT.kind = 3; MT.quad(V(-6.2, y0, z0), V(6.2, y0, z0), V(6.2, y1, z1), V(-6.2, y1, z1), under, C.setts);
        MT.kind = 2;
        for (const sx of [-1, 1]) {
          MT.quad(V(sx * 6.2, y0 + 0.16, z0), V(sx * 9.2, y0 + 0.16, z0), V(sx * 9.2, y1 + 0.16, z1), V(sx * 6.2, y1 + 0.16, z1), under, C.pave);
          MT.quad(V(sx * 6.2, y0, z0), V(sx * 6.2, y0 + 0.16, z0), V(sx * 6.2, y1 + 0.16, z1), V(sx * 6.2, y1, z1), V(sx * 20, y0 - 5, z0), C.pave);
          MT.kind = 0;
          MT.quad(V(sx * 9, y0 + 0.1, z0), V(sx * 150, y0 + 0.1, z0), V(sx * 150, y1 + 0.1, z1), V(sx * 9, y1 + 0.1, z1), under, C.land);
          MT.quad(V(sx * 150, 0, z0), V(sx * 150, y0 + 0.1, z0), V(sx * 150, y1 + 0.1, z1), V(sx * 150, 0, z1), V(0, 10, z0), C.land);
          MT.kind = 2;
        }
      }
      // the quay, its wall and the parapet on the seaward edge, speckled stone
      MT.quad(V(-150, 3, 200), V(150, 3, 200), V(150, 3, 215), V(-150, 3, 215), under, C.stone);
      MT.quad(V(-150, 0, 215), V(150, 0, 215), V(150, 3, 215), V(-150, 3, 215), V(0, 1, 100), C.stone);
      for (const sx of [-1, 1]) MT.quad(V(sx * 150, 0, 200), V(sx * 150, 3, 200), V(sx * 150, 3, 215), V(sx * 150, 0, 215), V(0, 1, 207), C.stone);
      for (let x = -150; x < 150; x += 30) {
        addBeam(MT, V(x, 3.55, 214.4), V(x + 30, 3.55, 214.4), V(0, 1, 0), 1.1, 0.9, 1.1, 0.9, C.stone, { ch: 0.04, capA: x === -150, capB: x === 120 });
        addBeam(MT, V(x, 4.2, 214.4), V(x + 30, 4.2, 214.4), V(0, 1, 0), 0.22, 1.15, 0.22, 1.15, C.stone, { ch: 0.2, capA: x === -150, capB: x === 120 });
      }
      MT.kind = 0;
    }
    await tick();
    // the fronts: both sides of the street, stepping down with it; lit windows by the hour
    { let made = 0;
      // the brief's sixty lit windows are for its 26 fronts (2.3 to a front); the street has about twice the fronts, at
      // about 8.8 windows each, so the same share of every front is lit
      const pLit = Math.min(0.5, litTarget / 230);
      const lit = () => rng() < pLit;
      for (const sx of [-1, 1]) {
        let z = -42 + (sx > 0 ? 3 : 0);
        while (z < 190) {
          const w = Math.min(rng.range(6, 13), 197 - z), near = z < 70 && sx > 0;
          const h = near ? rng.range(9, 10.8) : rng.range(9, 14);
          addHouse(MT, rng, sx, z, w, h, C, lit);
          z += w + (rng.chance(0.12) ? rng.range(2.5, 4) : 0.02);
          if (++made % 3 === 0) await tick();
        }
      }
    }
    await tick();
    // three lamps, never in a receding row; each with its small contact shadow
    const lamps = [[-5.3, 49], [6.4, 131], [-11, 207.5]];
    for (const [x, z] of lamps) {
      addLamp(MT, x, z, C);
      const y = streetY(z) + (Math.abs(x) > 6.2 ? 0.19 : 0.03), c = V(x + 0.22, y, z + 0.15), sl = z > 60 && z < 200 ? -24 / 140 : 0;
      for (let k = 0; k < 12; k++) {
        const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2;
        MT.tri(c, V(c.x + Math.cos(a0) * 0.42, y + Math.sin(a0) * 0.3 * sl, c.z + Math.sin(a0) * 0.3), V(c.x + Math.cos(a1) * 0.42, y + Math.sin(a1) * 0.3 * sl, c.z + Math.sin(a1) * 0.3), V(x, y - 5, z), C.shadow, 0, 1);
      }
      await tick();
    }
    const townGeo = await MT.geometryAsync(tick);
    add(townGeo, S.paint({ mode: 1 }), 0, 'cfs-town');
    await tick();

    // ---- the leaf-trees: port pavement and behind the port roofs (none to starboard: no leaf crosses the crescent)
    const leafSway = (M, ranges) => {
      const g = M.geometry(), p = g.attributes.position.array, sw = new Float32Array(p.length / 3);
      for (const r of ranges) for (let v = r.t0 * 3; v < r.t1 * 3; v++) { const t = Math.min(1, Math.max(0, (p[v * 3 + 1] - r.y) / r.H)); sw[v] = r.amp * t * t; }
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(sw, 1));
      return g;
    };
    { const ML = makeMesher(), ranges = [];
      const spots = [[-7.7, 79, 0], [-7.7, 121, 0], [-7.7, 158, 0], [-7.8, 189, 0]];
      for (let i = 0; i < 18; i++) spots.push([-rng.range(25, 64), -30 + i * 13.5 + rng.range(-4, 4), rng.range(3, 6)]);
      for (const [x, z, lift] of spots) {
        ranges.push(addLeaf(ML, V(x, streetY(z) + 0.1 + lift, z), 15 * (lift ? rng.range(0.95, 1.25) : 1), rng.range(-0.35, 0.35), C, winter));
        await tick();
      }
      add(leafSway(ML, ranges), S.paint({ mode: 1, sway: true }), 0, 'cfs-leaves');
    }
    await tick();

    // ---- the weather aloft: sleigh bells, or bare boulders, or both; one passes 4 m to port of the climb
    { const MB = makeMesher(), placed = [], pb = path.pointAt(uBell);
      const first = { O: V(pb.x - 10.6, pb.y + 1.5, pb.z + 3), R: 6 };
      placed.push(first);
      for (let tries = 0; tries < 400 && placed.length < 14; tries++) {
        const R = cast === 'boulders' ? rng.range(5, 20) : rng.range(3, 15) * (rng.chance(0.25) ? 1 : 0.7);
        const O = V(rng.range(-110, 120), rng.range(42 + R, 128), rng.range(105, 330));
        if (!path.isClear(O.x, O.y, O.z, R, 16)) continue;
        if (O.y - R < streetY(O.z) + 22) continue;
        if (O.z > 250 && O.x > -45 && O.x < 150 && O.y < 190) continue;      // nothing hangs between the climb and the canvas
        if ((O.x - 80) * 0.308 + (O.z - 450) * -0.951 < R + 25) continue;      // all of it on the noon side
        { const dist = Math.hypot(O.x, O.y - 35, O.z), az = Math.atan2(O.x, O.z), el = Math.asin((O.y - 35) / dist), ar = R / dist;
          if (az > -0.09 - ar && az < 0.4 + ar && el < 0.31 + ar) continue; }     // nor before it, seen from the head of the street
        if (placed.some((q) => q.O.distanceTo(O) < q.R + R + 12)) continue;
        placed.push({ O, R });
      }
      for (let i = 0; i < placed.length; i++) {
        const { O, R } = placed[i], asBell = cast === 'bells' || (cast === 'both' && i % 2 === 0);
        if (asBell) {
          const slit = i === 0 ? V(0.8, -0.42, -0.42) : V(rng.range(-0.3, 0.3) + (O.x > 0 ? -0.35 : 0.35), -0.75, -0.55);
          addBell(MB, O, R, slit, C);
        } else addBoulder(MB, ctx.noise, O, R * (i === 0 ? 1 : 1), i * 7.3 + 1, C);
        await tick();
      }
      add(await MB.geometryAsync(tick), S.paint({ mode: 1 }), 0, 'cfs-aloft');
    }
    await tick();

    // ---- the dark wooded headland 500 m to port, and the one bare boulder over it: never hidden, crisp at any distance
    { const MH = makeMesher(), nx = 22, nz = 52, hgt = (i, j) => {
        const a = i / nx * 2 - 1, b = j / nz * 2 - 1, m = 1 - a * a * 1.15 - b * b * b * b * 1.1 + 0.42 * ctx.noise.fbm2(i * 0.3 + 4, j * 0.22, 3);
        if (m <= 0 || i === 0 || j === 0 || i === nx || j === nz) return 0;
        return Math.pow(Math.min(1, m * 1.6), 0.7) * (34 + 16 * ctx.noise.fbm2(i * 0.35, j * 0.3, 3) + 11 * Math.abs(ctx.noise.n2(i * 1.9 + 9, j * 1.7)));
      };
      const at = (i, j) => V(-760 + (i / nx) * 400, hgt(i, j), 330 + (j / nz) * 520), up = V(0, -400, 300);
      const nrm = (i, j) => { const a = at(Math.min(i + 1, nx), j).sub(at(Math.max(i - 1, 0), j)), b = at(i, Math.min(j + 1, nz)).sub(at(i, Math.max(j - 1, 0))); const n = b.cross(a).normalize(); if (n.y < 0) n.negate(); return n; };
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        if (a.y + b.y + c.y + d.y <= 0) continue;                        // open water: the shore is the hill's own edge
        MH.triN(a, b, c, nrm(i, j), nrm(i + 1, j), nrm(i + 1, j + 1), C.land); MH.triN(a, c, d, nrm(i, j), nrm(i + 1, j + 1), nrm(i, j + 1), C.land);
        if (j === nz - 1 && i % 5 === 4) await tick();
      }
      await tick();
      addBoulder(MH, ctx.noise, V(-500, 150, 760), 30, 3.7, C);
      await tick();
      add(await MH.geometryAsync(tick), S.paint({ mode: 0 }), 0, 'cfs-headland');
    }
    await tick();

    // ---- real cumulus over town and bay (all on the noon side), the stray one on the setts, five on the quay in packed weather
    { const MC = makeMesher(), ig = new THREE.IcosahedronGeometry(1, 2), ico = ig.attributes.position.array, list = [];
      const want = Math.round(21 * Math.max(0.75, detail));
      for (let tries = 0; tries < 500 && list.length < want; tries++) {
        const W = rng.range(30, 60), O = V(rng.range(-330, 330), rng.range(90, 160), rng.range(-40, 540));
        if ((O.x - 80) * 0.308 + (O.z - 450) * -0.951 < W + 30) continue;
        if (O.z > 140 && O.x > -70 && O.x < 230) continue;                    // the canvas stands clear of them
        if (!path.isClear(O.x, O.y, O.z, W * 0.6, 20)) continue;
        if (list.some((q) => Math.hypot(q.O.x - O.x, q.O.z - O.z) < (q.W + W) * 0.75)) continue;
        list.push({ O, W });
      }
      list.push({ O: V(7.4, streetY(95) + 0.05, 95), W: 9 });
      if (packed) for (const x of [-118, -74, -36, 44, 92]) list.push({ O: V(x + rng.range(-6, 6), 3.05, 207), W: rng.range(9, 13) });
      // a cumulus that is met near (lying on the setts or the quay: its foot under y 30) is turned finer than those aloft
      const ig3 = new THREE.IcosahedronGeometry(1, 3), ico3 = ig3.attributes.position.array;
      for (let i = 0; i < list.length; i++) { addCumulus(MC, rng, list[i].O, list[i].W, list[i].O.y < 30 ? ico3 : ico, C); await tick(); }
      ig3.dispose();
      // the stray cloud lies on the setts: its small grey contact shadow, a rim round its foot, a little wider down the street
      { const cx = 7.9, cz = 95.5, under = V(cx, -20, cz), pt = (a) => { const z = cz + Math.sin(a) * 2.9; return V(cx + Math.cos(a) * 5.0, streetY(z) + 0.04, z); };
        for (let k = 0; k < 20; k++) MC.tri(V(cx, streetY(cz) + 0.04, cz), pt(k / 20 * Math.PI * 2), pt((k + 1) / 20 * Math.PI * 2), under, C.shadow, 0, 1); }
      ig.dispose();
      await tick();
      add(await MC.geometryAsync(tick), S.paint({ mode: 1 }), 0, 'cfs-cumulus');
    }
    await tick();

    // ---- cuts of noon sky: the two entry curtains, eave-high, and the bowler-hatted backs at the parapet
    const curtain = (o, k, hemTo, r = rng) => {
      const g = curtainGeometry(r, o), p = g.attributes.position, s = g.attributes.aSway;
      let hx = 0; for (let i = 0; i <= o.nx; i++) hx += p.getX(i);
      g.scale(hemTo && Math.sign(hx) !== Math.sign(hemTo) ? -k : k, k, k);
      for (let i = 0; i < s.count; i++) s.setX(i, s.getX(i) * k);
      g.computeVertexNormals();
      return g;
    };
    { const parts = [];
      for (const sx of [-1, 1]) {
        const g = curtain({ width: 44, height: 78, folds: 4, lean: 0.12, nx: Math.round(56 * detail), ny: Math.round(18 * detail) }, 0.128, sx);
        g.rotateY(sx * 0.12); g.translate(sx * 7.6, 29, sx > 0 ? 13.5 : 24); parts.push(g); await tick();   // the starboard one stands clear of the canvas
      }
      // more of them down the street, by address, all on the port pavement (the starboard side is the doves' lane, where
      // a curtain and a dove would run into one ragged shape): one between the lamp and the first leaf (z 64) and one
      // midway between each pair of pavement leaves (z 100, 140, 173.5), so leaf and curtain alternate down the street;
      // each eave-high, its hem 2 m off the setts, facing up the street
      const sr = own('street-curtains');
      for (const [sx, z] of [[-1, 64], [-1, 100], [-1, 140], [-1, 173.5]]) {
        const g = curtain({ width: 44, height: 78, folds: 4, lean: 0.12, nx: Math.round(56 * detail), ny: Math.round(18 * detail) }, 0.128, sx, sr);
        g.rotateY(sx * 0.12); g.translate(sx * 7.6, streetY(z) + 2, z); parts.push(g); await tick();
      }
      add(mergeCuts(parts), S.cut({ mode: 1, fold: 0.13 }), 0, 'cfs-entry-curtains');   // folds modelled 13 percent, so the cut reads as hanging cloth
    }
    const menX = menCount === 3 ? [-5, 0.6, 6] : [0.6];
    if (!stone) {
      const parts = [];
      for (const x of menX) { const g = outlineGeometry(manOutline(), 7.6); g.translate(x, 3, 213.2); parts.push(g); }
      add(mergeCuts(parts), S.cut({ mode: 1, fold: 0 }), 0, 'cfs-backs');
    }
    await tick();

    // small things of the quay: the backs' contact shadows (too small, as his are), and the backs themselves in the stone edition
    { const MQ = makeMesher(), under = V(0, -20, 213);
      for (const x of menX) for (let k = 0; k < 12; k++) {
        const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2, c = V(x + 0.3, 3.03, 213.0);
        MQ.tri(c, V(c.x + Math.cos(a0) * 1.25, 3.03, c.z + Math.sin(a0) * 0.42), V(c.x + Math.cos(a1) * 1.25, 3.03, c.z + Math.sin(a1) * 0.42), under, col('#62676D'), 0, 1);
      }
      if (stone) {
        const pts = manOutline().map(([x, y]) => new THREE.Vector2(x * 7.6, y * 7.6)), tris = THREE.ShapeUtils.triangulateShape(pts, []);
        MQ.kind = 2;
        for (const x of menX) for (const dz of [-0.35, 0.35]) for (const t of tris) {
          MQ.tri(V(x + pts[t[0]].x, 3 + pts[t[0]].y, 213.2 + dz), V(x + pts[t[1]].x, 3 + pts[t[1]].y, 213.2 + dz), V(x + pts[t[2]].x, 3 + pts[t[2]].y, 213.2 + dz), V(x, 6, 213.2), C.stone);
        }
        for (const x of menX) for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          MQ.quad(V(x + a.x, 3 + a.y, 212.85), V(x + b.x, 3 + b.y, 212.85), V(x + b.x, 3 + b.y, 213.55), V(x + a.x, 3 + a.y, 213.55), V(x, 3 + (a.y + b.y) / 2, 213.2), C.stone);
        }
        MQ.kind = 0;
      }
      add(MQ.geometry(), S.paint({ mode: 1 }), 0, 'cfs-quay-things');
    }
    await tick();

    // ---- the other hour, beyond the canvas: the glazed frame, glass, bilboquets, the lone leaf, curtains of day, the wall
    const Rt = V(head.z, 0, -head.x), UP = V(0, 1, 0);                       // level, to starboard of the course
    const lineP = (t, a, y) => V(cross.x + head.x * t + Rt.x * a, y, cross.z + head.z * t + Rt.z * a);
    const Tw = V(edir.z, 0, -edir.x);
    const seaP = (t, a, y) => (t <= 285 ? lineP(t, a, y) : V(fromSea.x + edir.x * (t - 285) + Tw.x * a, y, fromSea.z + edir.z * (t - 285) + Tw.z * a));
    const MN = makeMesher(), frameC = stone ? C.stone : C.white, woodC = stone ? C.stone : C.wood, FT = 123;
    MN.kind = stone ? 2 : 0;
    { const fp = (a, y) => lineP(FT, a, y);
      for (const a of [-53.5, 53.5]) addBeam(MN, fp(a, -2), fp(a, 150), Rt, 3, 3, 3, 3, frameC, { ch: 0.06 });
      for (const y of [1.5, 148.5]) addBeam(MN, fp(-55, y), fp(55, y), UP, 3, 3, 3, 3, frameC, { ch: 0.06 });
      for (const a of [-18, 18]) addBeam(MN, fp(a, 3), fp(a, 147), Rt, 2, 2.2, 2, 2.2, frameC, { ch: 0.08, capA: false, capB: false });
      addBeam(MN, fp(-52, 72), fp(52, 72), UP, 2, 2.2, 2, 2.2, frameC, { ch: 0.08, capA: false, capB: false });
    }
    await tick();
    const bilbo = [[250, 40, rng.range(40, 60)], [338, -46, rng.range(40, 60)], [404, 31, rng.range(40, 60)]];
    // on the level run to the exit (t over 285) a bilboquet stands off the course by at least its own height, so that the whole
    // turned form, head and all, is in the frame until we pass it; where the course drops among them they stand as placed
    for (const [t, a, h] of bilbo) { addBilboquet(MN, seaP(t, t > 285 ? Math.sign(a) * Math.max(Math.abs(a), h) : a, -1), h, woodC, Math.round(24 * detail)); await tick(); }
    // (p1) the second bilboquet, the first one past the turn, stands as a pair across the course: a twin, alike, at its own station and
    // its own stand-off on the other side, so wood stands to both sides of the way to the stone gate (no draw: the twin has its partner's
    // height). The third gets none: across from it a standing shard is dealt on every seed (405.75 to 416.25 m down the course, to port).
    { const [t, a, h] = bilbo[1]; addBilboquet(MN, seaP(t, -Math.sign(a) * Math.max(Math.abs(a), h), -1), h, woodC, Math.round(24 * detail)); await tick(); }
    // The gate's towers: one more bilboquet at each shoulder of the gate, alike and frontal, so the last stretch has one tall
    // subject (stone gate between two turned wooden towers, doubled in the water). Rule, in the wall's own frame: axis 9.5 m
    // outside each end of the 30 m wall (a = +-24.5, so the 7.7 m foot stands clear of the wall's end), 6 m before its
    // face, 44 m tall (in the brief's 40 to 60).
    for (const sg of [-1, 1]) { addBilboquet(MN, V(exit.x, -1, exit.z).addScaledVector(Tw, sg * 24.5).addScaledVector(edir, -6), 44, woodC, Math.round(24 * detail)); await tick(); }
    U.uAsh.value.set(Tw.x, Tw.z, 0, 0);
    MN.kind = 0;
    addWall(MN, V(exit.x, 0, exit.z), Tw, edir, C);
    await tick();
    // The exit's own setting: the wall with the opening is the gate of a long sea wall of the same ashlar, 10 m high, running
    // 147 m to either side behind the hems' line, with a plain pier every 29.4 m and one metal sleigh bell 8.4 m across at rest on each
    // pier, its slit to the sea we come by; and one cumulus lies along the top of the gate, as the stray one lies on the
    // setts. All of it doubled in the water. (Evenly spaced, alike, frontal: his order.)
    { const wr = own('sea-wall'), O = V(exit.x, 0, exit.z), Pw = (a, y, d) => V().copy(O).addScaledVector(Tw, a).addScaledVector(UP, y).addScaledVector(edir, d);
      const slit = V().copy(edir).multiplyScalar(-1).addScaledVector(UP, -0.12);
      for (const sg of [-1, 1]) {
        const a0 = sg * 15, a1 = sg * 162, mid = Pw(sg * 90, 5, 1.8);
        MN.kind = 8;
        for (const d of [0.6, 3.0]) MN.quad(Pw(a0, -1, d), Pw(a1, -1, d), Pw(a1, 10, d), Pw(a0, 10, d), mid, C.metal);
        MN.kind = 2;
        addBeam(MN, Pw(a0, 10.3, 1.8), Pw(a1 + sg * 0.4, 10.3, 1.8), UP, 0.6, 3.3, 0.6, 3.3, C.metal, { ch: 0.08 });
        for (let k = 1; k <= 5; k++) {
          const a = sg * (15 + 29.4 * k);
          MN.kind = 8; addBeam(MN, Pw(a, -1, 1.8), Pw(a, 12.6, 1.8), Tw, 5.4, 5.4, 5.4, 5.4, C.metal, { ch: 0.04 });
          MN.kind = 2; addBeam(MN, Pw(a, 12.6, 1.8), Pw(a, 13.2, 1.8), Tw, 6.2, 6.2, 6.2, 6.2, C.metal, { ch: 0.08 });
          MN.kind = 0; addBell(MN, Pw(a, 13.2 + 4.2, 1.8), 4.2, slit, C);
          await tick();
        }
      }
      MN.kind = 0;
      await tick();
      const ig = new THREE.IcosahedronGeometry(1, 3);
      addCumulus(MN, wr, Pw(wr.range(-2, 2), 26.95, 1.8), 30, ig.attributes.position.array, C);
      ig.dispose();
    }
    await tick();
    // The exit's opening is a thing of the other hour, like the wall it is in: seen from the noon side past the canvas
    // (the sight line crossing its plane beside the rectangle) it is hidden, as every solid there is. The engine draws
    // its opening regardless, so a disc stands 2 m before it and paints what the dome paints there (noon sky, slate
    // bay) exactly where the rectangle test hides the wall; from anywhere else it is discarded.
    { const m = new THREE.ShaderMaterial({ uniforms: Object.assign({}, U), vertexShader: MASK_VERT, fragmentShader: MASK_FRAG, side: THREE.DoubleSide, fog: false });
      const mesh = add(new THREE.CircleGeometry(11, 40), m, 0, 'cfs-exit-hidden-from-noon');
      mesh.position.copy(exit).addScaledVector(edir, -2); mesh.lookAt(V().copy(exit).addScaledVector(edir, -40));
    }
    const nightGeo = await MN.geometryAsync(tick);
    add(nightGeo, S.paint({ mode: 1, clip: true }), 0, 'cfs-night-solids');
    add(nightGeo, S.paint({ mode: 1, mirror: true }), -0.4, 'cfs-night-solids-mirror');
    await tick();
    { const ML = makeMesher(); ML.kind = stone ? 2 : 0;
      const LC = stone ? Object.assign({}, C, { leaf: C.stone, leafVein: col('#A9AEB2') }) : C;
      const r = addLeaf(ML, seaP(300, 62, -0.5), 40, 0.5, LC, winter && !stone);
      if (stone) r.amp = 0;
      const g = leafSway(ML, [r]);
      add(g, S.paint({ mode: 1, sway: true, clip: true }), 0, 'cfs-lone-leaf');
      add(g, S.paint({ mode: 1, sway: true, mirror: true }), -0.4, 'cfs-lone-leaf-mirror');
    }
    await tick();
    // four curtains of noon sky 320 m tall, hems in the water: two flanking the sea course, two beside the exit wall
    { const parts = [], o = () => ({ width: rng.range(43, 49), height: 170, folds: rng.int(4, 6), lean: 0.16, nx: Math.round(80 * detail), ny: Math.round(24 * detail) });
      const yaw = Math.atan2(-Rt.z, Rt.x), wyaw = Math.atan2(-Tw.z, Tw.x);
      for (const sg of [-1, 1]) {
        const g = curtain(o(), 1.9, sg), p = seaP(317 + sg * 14, sg * 130, 0.4);
        g.rotateY(yaw); g.translate(p.x, p.y, p.z); parts.push(g);
        await tick();
      }
      for (const sg of [-1, 1]) {
        const g = curtain(o(), 1.9, sg), p = V(exit.x, 0.4, exit.z).addScaledVector(Tw, sg * 68).addScaledVector(edir, -14);   // hems in the water 14 m before the sea wall (their folds, 9 m deep, clear of its bells), 68 m to either side: the slot of stars holds gate and towers
        g.rotateY(wyaw); g.translate(p.x, p.y, p.z); parts.push(g);
        await tick();
      }
      const cg = mergeCuts(parts);
      add(cg, S.cut({ mode: 1, fold: 0.22, clip: true }), 0, 'cfs-curtains');             // folds modelled 22 percent: 320 m of hanging cloth, not a band
      const mir = add(cg, S.cut({ mode: 1, fold: 0.22, mirror: true }), -0.4, 'cfs-curtains-mirror');
      mir.scale.y = -1;
    }
    await tick();

    // ---- glass: the remnants in the glazed frame, 12 standing shards leaning over the course, 28 falling on a loop
    const uShard = uAt(lineP(205, 0, 0).x, lineP(205, 0, 0).z);
    { const G = makeGlassCollector(), fyaw = Math.atan2(-Rt.z, Rt.x), fo = lineP(FT, 0, 0);
      const pane = (poly, az, rim = 0.9) => G.add(poly, { origin: fo, size: 70, axis: UP, angle: fyaw, az, thick: 0.9, rim, pic: { az0: 2.9, perM: 1 / 130, el0: 0.05 } });
      // The frame is a WINDOW: six lights glazed with the other hour, five of them whole panes of noon, and the one the
      // course passes through (upper middle: a -17 to 17, y 73 to 147, the course at a 0, y 97) BROKEN: nothing is left of
      // its pane but teeth standing in from the bars all round, long ones hanging from the top bar (to 40 m), shorter
      // ones from the sill and the sides, each cracked from its neighbour by a crack running to the bar. The break is the
      // light itself, about 40 m across between the teeth, and through it the other hour shows large: stars, the sunlit
      // sea, and on the line of the course the exit wall. Kept clear by rule: no glass within 9 m of the eye's crossing
      // (a 0, y 97), and none in the doves' lane (a 3.5 to the starboard bar, y 90 to 108: that stretch of the bar is
      // bare). The teeth take their numbers from a stream of their own. Its fallen pieces are the falling shards below.
      const br = own('break'); await tick();
      { const X = 17, Y0 = 73, Y1 = 147, W2 = 2 * X, H2 = Y1 - Y0, PER = 2 * (W2 + H2);
        // a point of the light's border by distance s round it (from the lower port corner, along the sill first) and the inward normal there
        const at = (s) => { s = ((s % PER) + PER) % PER;
          if (s < W2) return [-X + s, Y0, 0, 1, 0];
          if (s < W2 + H2) return [X, Y0 + (s - W2), -1, 0, 1];
          if (s < 2 * W2 + H2) return [X - (s - W2 - H2), Y1, 0, -1, 2];
          return [-X, Y1 - (s - 2 * W2 - H2), 1, 0, 3]; };
        const corners = [W2 + H2, 2 * W2 + H2, PER, PER + W2];                 // upper starboard, upper port, lower port, lower starboard
        const sA = W2 + (108 - Y0), sB = PER + W2 + (90 - Y0);                 // the run of glass: from the lane's upper end round to its lower end
        const div = [sA]; let prev = sA;
        for (const c of corners) {
          const c0 = c - br.range(3.5, 6), c1 = c + br.range(3.5, 6), n = Math.max(1, Math.round((c0 - prev) / 7.6));
          for (let k = 1; k < n; k++) div.push(prev + (c0 - prev) * (k + br.range(-0.28, 0.28)) / n);
          div.push(c0, c1); prev = c1;
        }
        { const n = Math.max(1, Math.round((sB - prev) / 7.6)); for (let k = 1; k < n; k++) div.push(prev + (sB - prev) * (k + br.range(-0.28, 0.28)) / n); div.push(sB); }
        const depth = div.map((_, k) => (k === 0 || k === div.length - 1 ? 0 : br.range(1.2, 4.2)));
        const clear = (a, y) => !(Math.hypot(a, y - 97) < 9 || (a > 3.5 && y > 90 && y < 108));
        for (let k = 0; k + 1 < div.length; k++) {
          const s0 = div[k], s1 = div[k + 1], b0 = at(s0), b1 = at(s1), corner = corners.find((c) => c > s0 && c < s1), w = s1 - s0;
          const sc = corner ?? (s0 + s1) / 2 + br.range(-0.2, 0.2) * w, m = at(sc);
          let nx = m[2], ny = m[3];
          if (corner !== undefined) { nx = (b0[2] + b1[2]) * 0.7071; ny = (b0[3] + b1[3]) * 0.7071; }
          const side = m[4], long = k % 2 === 1, short = br.range(0.3, 0.62);
          let len = (corner !== undefined ? br.range(9, 17) : side === 2 ? br.range(22, 40) : side === 0 ? br.range(9, 17) : br.range(7, 13)) * (long ? 1 : short);
          const slant = br.range(-0.3, 0.3) * w, tx = -ny, ty = nx;
          let tip = [0, 0];
          for (let it = 0; it < 12; it++) {
            tip = [Math.min(X - 2, Math.max(-X + 2, m[0] + nx * len + tx * slant)), Math.min(Y1 - 2, Math.max(Y0 + 2, m[1] + ny * len + ty * slant))];
            let ok = true;
            for (const f of [0.4, 0.6, 0.8, 1]) if (!clear(m[0] + (tip[0] - m[0]) * f, m[1] + (tip[1] - m[1]) * f)) ok = false;
            if (ok) break; len *= 0.8;
          }
          const poly = [[b0[0], b0[1]]];
          if (corner !== undefined) { const c = at(corner); poly.push([c[0], c[1]]); }
          poly.push([b1[0], b1[1]]);
          if (depth[k + 1] > 0) poly.push([b1[0] + b1[2] * depth[k + 1], b1[1] + b1[3] * depth[k + 1]]);
          poly.push(tip);
          if (depth[k] > 0) poly.push([b0[0] + b0[2] * depth[k], b0[1] + b0[3] * depth[k]]);
          pane(poly, 3.0, 0.45);                                           // a crack is two ground edges side by side: half the pane's rim each
        }
        pane([[-17, 3], [17, 3], [17, 71], [-17, 71]], 2.5);
      }
      await tick();
      pane([[-52, 3], [-19, 3], [-19, 71], [-52, 71]], 2.3);
      pane([[19, 3], [52, 3], [52, 71], [19, 71]], 3.2);
      pane([[-52, 73], [-19, 73], [-19, 147], [-52, 147]], 2.8);
      pane([[19, 73], [52, 73], [52, 147], [19, 147]], 3.6);
      await tick();
      const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), ax = V();
      for (let i = 0; i < 12; i++) {                                          // standing, 10 to 70 m, leaning over the course
        const sg = i % 2 ? 1 : -1, near = i < 4, s = near ? rng.range(11, 20) : rng.range(26, 70), a = sg * (near ? rng.range(15, 24) : rng.range(34, 90));
        const t = 236 + (i + rng.range(-0.3, 0.3)) * 17.5, lean = sg * rng.range(0.14, 0.38);
        q.setFromAxisAngle(head, lean).multiply(q2.setFromAxisAngle(UP, fyaw + Math.PI + rng.range(-0.5, 0.5)));
        const ang = 2 * Math.acos(Math.min(1, Math.max(-1, q.w))), sn = Math.sin(ang / 2);
        if (sn > 1e-4) ax.set(q.x / sn, q.y / sn, q.z / sn); else ax.set(0, 1, 0);
        G.add(shardPoly(rng, s, true), { origin: seaP(t, a, -1), size: s, axis: ax.clone(), angle: ang, az: rng.range(1.9, 4.3), thick: Math.max(1.2, s * 0.03), flip: i % 2 === 0, rim: Math.max(0.3, s * 0.016) });
      }
      await tick();
      const nFall = 28;
      for (let i = 0; i < nFall; i++) {                                        // falling at a tenth of gravity, on a loop
        const hero1 = i === 0, s = hero1 ? 8 : rng.range(4, 12), t = hero1 ? 205 : rng.range(132, 300), a = hero1 ? 9.2 : rng.sign() * rng.range(9, 60), y0 = hero1 ? 112 : rng.range(70, 135);
        const o = lineP(t, a, y0), Tfall = Math.sqrt(Math.max(y0 + s * 1.3, 1) / 0.49);
        ax.set(rng.range(-1, 1), rng.range(-0.4, 0.4), rng.range(-1, 1)).normalize();
        let phase = rng.range(0, Tfall), angle = rng.range(0, 6.28), spin = rng.range(0.12, 0.4) * rng.sign();
        if (hero1) { const py = path.pointAt(uShard).y, ts = Math.sqrt(Math.max(y0 - py - 1, 0) / 0.49); phase = ts - uShard * 45; ax.copy(Rt); spin = 0.2; angle = -Math.PI / 2 - 0.45 - spin * ts; }
        else if (path.nearestXZ(o.x, o.z).dist < s * 0.62 + 7) { o.addScaledVector(Rt, Math.sign(a) * 9); }
        G.add(shardPoly(rng, s, false), { origin: o, size: s, axis: ax.clone(), angle, spin, fall: true, keyed: hero1, phase, az: rng.range(1.9, 4.3), thick: 1.2, rim: 0.2 });
      }
      // The piece that fell from the holed light: one great shard, 26 m, falling on the same loop as the rest and keyed to
      // u like the one that turns beside us, so the drop has one large subject. Rule: 22 m to port of the course (its
      // widest reach 16 m, so 6 m clear of us; the doves keep the starboard side), 105 m down the course from the window,
      // level with the eye as we pass it, turning about the level axis across the course at 0.4 rad/s, so that from above we
      // meet its night face over the sea and, coming level, its noon face against the stars. Numbers from its own stream.
      { const gr = own('great-shard'), s = 26, tG = FT + 105, o = lineP(tG, -22, 112), uG = uAt(lineP(tG, 0, 0).x, lineP(tG, 0, 0).z);
        const py = path.pointAt(uG).y, ts = Math.sqrt(Math.max(112 - py - 1, 0) / 0.49), spin = 0.4;
        G.add(shardPoly(gr, s, false), { origin: o, size: s, axis: Rt.clone(), angle: -Math.PI / 2 + 1.0 - spin * ts, spin, fall: true, keyed: true, phase: ts - uG * 45, az: gr.range(1.9, 4.3), thick: 1.2, rim: 0.5 });
      }
      const gg = G.geometry(), gmat = (mirror) => new THREE.ShaderMaterial({ uniforms: Object.assign({}, U, { uMirror: { value: mirror ? 1 : 0 }, uTu: { value: 0 } }), vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, side: THREE.DoubleSide, fog: false });
      add(gg, gmat(false), 0, 'cfs-glass');
      add(gg, gmat(true), -0.4, 'cfs-glass-mirror');
    }
    await tick();

    // ---- the sky-doves: one endless stream in a lane 4 m to starboard of the path and a little above the eye, at about
    // twice our speed, so one is always pulling ahead through the frame (the port side belongs to lamp, leaf, bell and edge)
    const nDoves = Math.max(150, Math.round(220 * detail * Math.min(1.2, Math.max(0.85, vary.density ?? 1))));
    const doves = S.doves(nDoves), WRAP = L + 220, dv = [];
    scene.add(doves.mesh);
    for (let i = 0; i < nDoves; i++) dv.push({ b: (i + rng.range(-0.35, 0.35)) / nDoves * WRAP, span: rng.range(2.6, 4.8), ph: rng.range(0, 6.28), rate: rng.range(3.4, 4.6) });
    // Each dove keeps a place of its own in the cross-section of the lane, dealt from an even sequence that never repeats, so
    // that neighbours in the stream stand clear of one another and each is a whole clean outline at any distance. The lane
    // begins 5.6 m to starboard of the eye, is 2 m wide and 8 m high between the fronts (world z under 195) and opens to 9 m wide
    // over the water.
    for (let i = 0; i < nDoves; i++) { dv[i].cx = (0.5 + i * 0.7548776662) % 1; dv[i].cy = (0.5 + i * 0.569840291) % 1; }
    await tick();

    const glassU = scene.getObjectByName('cfs-glass').material.uniforms, glassMU = scene.getObjectByName('cfs-glass-mirror').material.uniforms;
    
    const edgeNear = toWorld(hero.anchors.edgeNear), canvasC = toWorld(hero.anchors.canvas.center), frameLook = lineP(FT + 150, 0, 100);  // on the course's axis, through the broken light and 150 m beyond it, at the height we cross it
    const P0 = V(tabP[0], tabP[1], tabP[2]), last = (TN - 1) * 3;

    function update(dt, time, camera, u) {
      hero.update(dt, time, camera);                                  // places the canvas uniforms; style seconds follow the clock
      U.uT.value = time;
      glassU.uTu.value = u * 45; glassMU.uTu.value = u * 45;                                      // the one shard that must turn beside us is keyed to u
      const adv = 1.55 * u * L + 10 * time;
      for (let i = 0; i < nDoves; i++) {
        const d = dv[i], s = ((d.b + adv) % WRAP) - 70, k = i * 4;
        let x, y, z, rx, rz;
        if (s <= 0) { rx = tabR[0]; rz = tabR[2]; x = P0.x + rz * s; y = P0.y; z = P0.z - rx * s; }
        else if (s >= L) { rx = tabR[last]; rz = tabR[last + 2]; const e = s - L; x = tabP[last] + rz * e; y = tabP[last + 1]; z = tabP[last + 2] - rx * e; }
        else {
          const f = s / 2, i0 = Math.floor(f), fr = f - i0, a = i0 * 3, b = Math.min(i0 + 1, TN - 1) * 3;
          x = tabP[a] + (tabP[b] - tabP[a]) * fr; y = tabP[a + 1] + (tabP[b + 1] - tabP[a + 1]) * fr; z = tabP[a + 2] + (tabP[b + 2] - tabP[a + 2]) * fr;
          rx = tabR[a] + (tabR[b] - tabR[a]) * fr; rz = tabR[a + 2] + (tabR[b + 2] - tabR[a + 2]) * fr;
        }
        const lift = sstep(L - 130, L - 10, s), veer = sstep(L - 90, L + 50, s);
        const wl = 2 + 7 * sstep(195, 250, z), lat = -(5.6 + d.cx * wl + 0.5 * Math.sin(s * 0.021 + d.ph)) - 46 * veer;
        doves.pos[k] = x + rx * lat; doves.pos[k + 1] = y - 2.5 + d.cy * 8 + 0.5 * Math.sin(s * 0.017 + d.ph * 2) + 30 * lift; doves.pos[k + 2] = z + rz * lat;
        doves.pos[k + 3] = d.span * sstep(-70, -55, s) * (1 - sstep(L + 100, L + 150, s));
        doves.fly[k] = 0.22 * Math.sin(s * 0.013 + d.ph); doves.fly[k + 1] = d.ph + time * d.rate;
      }
      doves.commit();
    }
    update(0, 0, null, 0);


    const pace = (u) => 0.7 + 0.3 * sstep(0.12, 0.18, u) - 0.15 * sstep(0.26, 0.32, u) + 0.25 * sstep(uCross - 0.01, uCross + 0.05, u)
      + 0.2 * sstep(0.68, 0.76, u) - 0.3 * sstep(0.84, 0.9, u);

    return {
      scene, path, duration: 45, pace,
      camera: { fov: 62, near: 0.3, far: 4000, sway: 0, bank: 0 },
      pois: [
        { at: canvasC, from: 0.12, to: 0.41, weight: 0.8 },
        { at: edgeNear, from: uCross - 0.045, to: uCross - 0.004, weight: 0.55 },
        // from the canvas to the window the gaze goes level through the hole in it, so the window stands frontal, its bars upright
        { at: frameLook, from: uCross + 0.01, to: uFrame - 0.005, weight: 0.85 },
        { at: V(exit.x, 46, exit.z), from: uFrame - 0.03, to: 0.76, weight: 0.8 },
      ],
      portal: { shape: 'circle', radius: 7, style: 'ring', color: '#BCD3E3', glow: 0, halo: false, veil: '#BCD3E3', blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
