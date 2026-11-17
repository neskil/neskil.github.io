// BROUGHT IN: the hash h11 follows "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License, published on Shadertoy; the same form as the kit's fx.js (its hash11, written out in JS so that the proud stones stand on the stones the material draws).
// hill-of-round-doors, the field builder's part: THE BRIDGE. A stone bridge of two round arches over the stream along
// the plan's BRIDGE line, its deck on the plan's bridgeDeck: coursed side walls with the arches cut through, a ring of
// arch stones round each opening on both faces, the barrels under the arches, a cutwater on either side of the middle
// pier, low parapets with coping stones, end pillars where the walls splay, and a deck of worn setts. All of it stone
// that takes the scene's light; damp and moss low by the water. Small flowering plants grow from its joints (the
// caller's leaves). Nothing here moves. The flight crosses 6 m over the deck: the parapets' tops stay at the plan's
// BRIDGE.parapet over it.
import { BRIDGE, bridgeDeck } from './hill-of-round-doors-plan.js';
import { KIND, sstep, mix3, mul3 } from './hill-of-round-doors-field-geo.js';

const COPE = 0.2, RW = 2;                                       // the coping's thickness; half the width of a refuge along the bridge                                               // the coping stones' thickness: their tops stand at the plan's parapet height

// buildBridge(G, C, rng) -> { plants: [[x, y, z, nx, ny, nz]] places on its stone where a small plant may grow, and the
// way the stone faces there }
// G: the Solid it is laid into; C: colour to linear; rng: the stream 'bridge' (which stones are pale, where plants grow)
export function buildBridge(G, C, rng) {
  const X = BRIDGE.x, hw = BRIDGE.width / 2, zS = BRIDGE.z0 + 4, zN = BRIDGE.z1 - 4, zm = (BRIDGE.z0 + BRIDGE.z1) / 2, par = BRIDGE.parapet;
  const R = 6.5, yc = -1.6, arches = [zm + 8.2, zm - 8.2], deep = -3.4, plants = [];
  const stone = C('#a69a82'), pale = C('#b9ae96'), damp = C('#56603c'), dark = C('#6f6a5a'), sett = C('#958b76');
  const soffit = (z) => { let y = deep; for (const zc of arches) { const d = z - zc; if (Math.abs(d) < R) y = Math.max(y, yc + Math.sqrt(R * R - d * d)); } return y; };
  const half = (z) => hw + 1.7 * (sstep(BRIDGE.z0 - 2, zS, z) + sstep(BRIDGE.z1 + 2, zN, z));          // the walls splay at the two ends
  const ref = (z) => Math.abs(z - zm) < RW + 1e-6;               // over the middle pier the parapets stand out round the refuges
  const wallCol = (p) => mul3(mix3(damp, stone, sstep(0.1, 2.4, p[1])), 0.9 + 0.2 * Math.sin(p[2] * 0.37 + p[1] * 0.9));
  // the places along the bridge where a wall is cut: every metre, and finely round each arch
  let zs = []; for (let z = zS; z >= zN - 1e-6; z -= 1) zs.push(z);
  for (const zc of arches) for (let i = 0; i <= 20; i++) zs.push(zc + R * Math.cos(Math.PI * i / 20));
  zs = [...new Set(zs.map((z) => Math.round(z * 1000) / 1000))].sort((a, b) => b - a);
  // THE SIDE WALLS, from under the water to the parapet's top, the arches left open
  for (const sx of [1, -1]) {
    const uv = (p) => [p[2] * sx, p[1]];
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], xa = X + sx * half(za), xb = X + sx * half(zb), open = ref(za) && ref(zb), ta = bridgeDeck(za) + (open ? -0.1 : par - COPE), tb = bridgeDeck(zb) + (open ? -0.1 : par - COPE), ba = soffit(za), bb = soffit(zb);
      const A = [xa, ba, za], B = [xb, bb, zb], Cc = [xb, tb, zb], D = [xa, ta, za];
      if (sx > 0) G.faceW(A, B, Cc, D, wallCol, KIND.stone, uv); else G.faceW(B, A, D, Cc, wallCol, KIND.stone, uv);
    }
    // the ring of arch stones: each its own block, proud of the wall by its own measure, with its upper edge and one
    // side edge; a taller keystone
    for (const zc of arches) for (let i = 0; i < 20; i++) {
      const key = i === 9 || i === 10, a0 = Math.PI * (i + 0.04) / 20, a1 = Math.PI * (i + 0.96) / 20, x = X + sx * (hw + (key ? 0.2 : 0.1 + 0.07 * rng())), xw = X + sx * hw, ro = R + (key ? 1.05 : 0.72 + 0.16 * rng());
      const tone = mul3(mix3(stone, pale, rng()), 0.92 + 0.2 * rng()), pt = (a, r, xx = x) => [xx, yc + r * Math.sin(a), zc + r * Math.cos(a)], col = (p) => mix3(damp, tone, sstep(0.0, 2.0, p[1]));
      G.face(pt(a0, R - 0.02), pt(a1, R - 0.02), pt(a1, ro), pt(a0, ro), col, KIND.plain);
      G.face(pt(a0, ro), pt(a1, ro), pt(a1, ro, xw), pt(a0, ro, xw), (p) => mul3(col(p), 1.12), KIND.plain);
      G.face(pt(a1, ro), pt(a1, R - 0.02), pt(a1, R - 0.02, xw), pt(a1, ro, xw), (p) => mul3(col(p), 0.7), KIND.plain);
    }
    // the cutwater on the middle pier: a prow in the stream that rises to the deck as a refuge, its own parapet and
    // coping round it, a stone bench inside
    const tipX = X + sx * (hw + 2.5), dk = bridgeDeck(zm), pt = dk + par - COPE, f = (p, y) => [p[0], y, p[2]];
    for (const sz of [1, -1]) {
      const b0 = [X + sx * hw, 0, zm + sz * RW], t0 = [tipX, 0, zm], bi = [X + sx * (hw - 0.5), 0, zm + sz * RW], ti = [tipX - sx * 0.75, 0, zm], bo = [b0[0] + sx * 0.1, 0, b0[2]], to = [tipX + sx * 0.12, 0, zm];
      const uvc = (p) => [Math.hypot(p[0] - b0[0], p[2] - b0[2]) + 0.3, p[1]];
      G.faceW(f(b0, deep), f(t0, deep), f(t0, pt), f(b0, pt), wallCol, KIND.stone, uvc);
      G.faceW(f(ti, dk - 0.1), f(bi, dk - 0.1), f(bi, pt), f(ti, pt), wallCol, KIND.stone, uvc);
      G.face(f(bi, pt + COPE), f(ti, pt + COPE), f(to, pt + COPE), f(bo, pt + COPE), pale, KIND.plain);
      G.face(f(bo, pt), f(to, pt), f(to, pt + COPE), f(bo, pt + COPE), mul3(pale, 0.9), KIND.plain); G.face(f(ti, pt), f(bi, pt), f(bi, pt + COPE), f(ti, pt + COPE), mul3(pale, 0.9), KIND.plain);
      G.tface(f(bi, dk), f(ti, dk), [bi[0], dk, zm], sett, KIND.stone);
      for (const t of [0.3, 0.62]) plants.push([b0[0] + (t0[0] - b0[0]) * t + sx * 0.03, 0.15 + 0.6 * rng(), b0[2] + (t0[2] - b0[2]) * t, sx * 0.28, 1, sz * 0.35]);   // at the prow's foot by the water, growing up
    }
    const bx = X + sx * (hw + 0.55);
    G.box([bx - 0.22, dk + 0.42, zm - 0.62], [bx + 0.22, dk + 0.52, zm + 0.62], pale, KIND.plain);
    for (const k of [-1, 1]) G.box([bx - 0.17, dk, zm + k * 0.45 - 0.09], [bx + 0.17, dk + 0.42, zm + k * 0.45 + 0.09], stone, KIND.stone, 'xXzZ');
  }
  // THE BARRELS under the arches
  for (const zc of arches) for (let i = 0; i < 20; i++) {
    const a0 = Math.PI * i / 20, a1 = Math.PI * (i + 1) / 20, pt = (a, x) => [x, yc + R * Math.sin(a), zc + R * Math.cos(a)];
    const col = (p) => mul3(mix3(damp, dark, sstep(0.2, 3.5, p[1])), 0.9);
    G.faceW(pt(a0, X - hw), pt(a0, X + hw), pt(a1, X + hw), pt(a1, X - hw), col, KIND.stone, (p) => [p[0], R * Math.atan2(p[1] - yc, p[2] - zc)]);
  }
  // THE PARAPETS' inner faces, their coping stones (each its own tone, a finger's gap between), and THE DECK of setts
  const STEP = 2;
  for (let z = zS; z > zN + 1e-6; z -= STEP) {
    const za = z, zb = Math.max(zN, z - STEP), da = bridgeDeck(za), db = bridgeDeck(zb);
    for (const sx of ref(za) && ref(zb) ? [] : [1, -1]) {
      const ia = X + sx * (half(za) - 0.5), ib = X + sx * (half(zb) - 0.5), oa = X + sx * (half(za) + 0.09), ob = X + sx * (half(zb) + 0.09);
      const A = [ia, da - 0.1, za], B = [ib, db - 0.1, zb], Cc = [ib, db + par - COPE, zb], D = [ia, da + par - COPE, za], uv = (p) => [p[2] * sx + 0.4, p[1]];
      if (sx > 0) G.faceW(B, A, D, Cc, wallCol, KIND.stone, uv); else G.faceW(A, B, Cc, D, wallCol, KIND.stone, uv);
      const ya = da + par, lift = 0;                              // two coping stones to the step, each its own tone and set, a gap between
      for (let h = 0; h < 2; h++) {
        const t0 = h / 2, t1 = (h + 1) / 2, tone = mul3(mix3(stone, pale, rng()), 0.93 + 0.16 * rng()), g = 0.03, up = 0.04 * rng(), dn = (q) => [q[0], q[1] - COPE - up, q[2]];
        const I0 = [lerpn(ia, ib, t0) - sx * 0.09, lerpn(da, db, t0) + par + up, lerpn(za, zb, t0) - g], I1 = [lerpn(ia, ib, t1) - sx * 0.09, lerpn(da, db, t1) + par + up, lerpn(za, zb, t1) + g];
        const O0 = [lerpn(oa, ob, t0), I0[1], I0[2]], O1 = [lerpn(oa, ob, t1), I1[1], I1[2]];
        G.face(I0, O0, O1, I1, tone, KIND.plain); G.face(dn(I1), dn(I0), I0, I1, mul3(tone, 0.9), KIND.plain); G.face(dn(O0), dn(O1), O1, O0, mul3(tone, 0.9), KIND.plain);
        G.face(dn(I0), dn(O0), O0, I0, mul3(tone, 0.7), KIND.plain);
      }
      // the string course at the deck's level, a hand proud of the wall: its face, its top in the light, its underside
      const s0 = X + sx * half(za), s1 = X + sx * half(zb), so = sx * 0.17;
      G.face([s0 + so, da - 0.2, za], [s1 + so, db - 0.2, zb], [s1 + so, db + 0.04, zb], [s0 + so, da + 0.04, za], pale, KIND.plain);
      G.face([s0, da + 0.04, za], [s0 + so, da + 0.04, za], [s1 + so, db + 0.04, zb], [s1, db + 0.04, zb], mul3(pale, 1.1), KIND.plain);
      G.face([s0, da - 0.2, za], [s0 + so, da - 0.2, za], [s1 + so, db - 0.2, zb], [s1, db - 0.2, zb], mul3(pale, 0.55), KIND.plain);
      // the plants root only on a wall's top or at its foot, each at the height the stone has at its own place, and
      // grow up from there: none grows out through a wall's face
      if (rng() < 0.75) { const w = 0.3 + 0.4 * rng(), t = rng(); plants.push([lerpn(lerpn(ia, ib, t), lerpn(oa, ob, t), w), lerpn(da, db, t) + par + 0.02, lerpn(za, zb, t), 0, 1, 0]); }
      if (rng() < 0.4) { const t = rng(); plants.push([lerpn(ia, ib, t) - sx * 0.08, lerpn(da, db, t) + 0.03, lerpn(za, zb, t), -sx * 0.3, 1, 0]); }
      if (rng() < 0.5 && za < BRIDGE.z0 - 3 && zb > BRIDGE.z1 + 3) rng();                 // (once a plant in the wall's face: its dice are still drawn, so the stream deals the rest as before)
    }
    const wa = half(za) - 0.5, wb = half(zb) - 0.5, xs = [-1, -0.38, 0.38, 1], camber = [0, 0.07, 0.07, 0];
    for (let k = 0; k < 3; k++) {
      const col = (p) => mul3(k === 1 ? sett : mix3(sett, damp, 0.35), 0.92 + 0.16 * Math.sin(p[2] * 1.3 + p[0]));
      G.faceW([X + xs[k] * wa, da + camber[k], za], [X + xs[k + 1] * wa, da + camber[k + 1], za], [X + xs[k + 1] * wb, db + camber[k + 1], zb], [X + xs[k] * wb, db + camber[k], zb], col, KIND.stone, (p) => [p[2], p[0] * 0.9]);
    }
  }
  // SOME STONES STAND PROUD of the walls and of the parapets' inner faces, each one exactly over a stone that the
  // wall's own courses draw there (the pattern's rows and joints, worked out here as the material works them out)
  const fr = (v) => v - Math.floor(v), h11 = (q) => { q = fr(q * 0.1031); q *= q + 33.33; q *= q + q; return fr(q); };   // (h11: brought in, see the head of this file)
  const proud = (sx, xw, ox, uo, z, y, lo, hi) => {
    const row = Math.floor(y / 0.46), off = 0.5 * (((row % 2) + 2) % 2) + 0.31 * h11(row * 1.7 + 3), k = Math.floor((z * sx + uo) / 1.05 + off), u0 = (k - off) * 1.05, j = 0.035;
    const za = (u0 - uo) / sx, zb = (u0 + 1.05 - uo) / sx, z0 = Math.min(za, zb) + j, z1 = Math.max(za, zb) - j, y0 = row * 0.46 + j, y1 = y0 + 0.46 - 2 * j, x1 = xw + ox * out;
    if (y0 < Math.max(lo(z0), lo(z1)) || y1 > Math.min(hi(z0), hi(z1)) || ref(z0 - 0.7) || ref(z1 + 0.7)) return;
    const uv = (q) => [q[2] * sx + uo, q[1]], c = (q) => mul3(wallCol(q), 1.06);
    G.faceW([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], c, KIND.stone, uv);
    G.face([xw, y1, z0], [xw, y1, z1], [x1, y1, z1], [x1, y1, z0], (q) => mul3(wallCol(q), 1.2), KIND.plain); G.face([xw, y0, z0], [xw, y0, z1], [x1, y0, z1], [x1, y0, z0], (q) => mul3(wallCol(q), 0.5), KIND.plain);
    G.face([xw, y0, z0], [x1, y0, z0], [x1, y1, z0], [xw, y1, z0], (q) => mul3(wallCol(q), 0.8), KIND.plain); G.face([xw, y0, z1], [x1, y0, z1], [x1, y1, z1], [xw, y1, z1], (q) => mul3(wallCol(q), 0.8), KIND.plain);
  };
  let out = 0.06;
  const ring = (z) => { let y = 0.3; for (const zc of arches) { const d = Math.abs(z - zc); if (d < R + 1.2) y = Math.max(y, yc + Math.sqrt((R + 1.2) * (R + 1.2) - d * d)); } return y; };
  for (const sx of [1, -1]) {
    for (let k = 0; k < 90; k++) { const z = BRIDGE.z1 + 3 + (BRIDGE.z0 - BRIDGE.z1 - 6) * rng(), y = 0.3 + 5.4 * rng(); out = 0.04 + 0.06 * rng(); proud(sx, X + sx * hw, sx, 0, z, y, ring, (q) => bridgeDeck(q) - 0.24); }
    for (let k = 0; k < 40; k++) { const z = BRIDGE.z1 + 3 + (BRIDGE.z0 - BRIDGE.z1 - 6) * rng(), y = 4.2 + 3 * rng(); out = 0.03 + 0.04 * rng(); proud(sx, X + sx * (hw - 0.5), -sx, 0.4, z, y, (q) => bridgeDeck(q) + 0.03, (q) => bridgeDeck(q) + par - COPE - 0.02); }
    // at the walls' feet by the water, growing up; none in the mouth of an arch
    for (let k = 0; k < 9; k++) { const y = 0.15 + 0.6 * rng(), z = BRIDGE.z1 + 3 + (BRIDGE.z0 - BRIDGE.z1 - 6) * rng(); if (arches.every((zc) => Math.abs(z - zc) > R + 1.3)) plants.push([X + sx * (hw + 0.03), y, z, sx * 0.4, 1, 0]); }
  }
  // THE END PILLARS where the walls splay, each with a pointed cap
  for (const z of [zS, zN]) for (const sx of [1, -1]) {
    const x = X + sx * (half(z) + 0.1), y0 = bridgeDeck(z) - 2.2, y1 = bridgeDeck(z) + par + 0.45, r = 0.62;
    G.box([x - r, y0, z - r], [x + r, y1, z + r], wallCol, KIND.stone, 'xXzZ');
    const c = [[x - r - 0.08, y1, z - r - 0.08], [x + r + 0.08, y1, z - r - 0.08], [x + r + 0.08, y1, z + r + 0.08], [x - r - 0.08, y1, z + r + 0.08]], top = [x, y1 + 0.75, z];
    for (let k = 0; k < 4; k++) G.tface(c[(k + 1) % 4], c[k], top, pale, KIND.plain);
  }
  return { plants };
}
const lerpn = (a, b, t) => a + (b - a) * t;
