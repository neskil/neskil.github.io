// hill-of-round-doors, the field builder's part: HOW A GREAT TREE IS GROWN. One trunk with root buttresses and roots,
// tiers of great boughs whose tips lie on the crown's dome, side branches and risers on each bough, twigs on those, and
// a mass of leaves on every tip: a dark core wrapped in cut-out sprays of small leaves (hill-of-round-doors-field-leaf.js). The wood is
// a Solid (bark), the leaves a Leafy (drawn by the kit's wind material). Nothing is lower than `clear` over the foot
// except the trunk and its roots. All draws come from the one stream handed in, in a fixed order.
import { TAU, sat, lerp, sstep, vadd, vsub, vscale, vmad, vdot, vcross, vlen, vnorm, mix3, mul3, perp, vrot, KIND, Solid, Leafy, limb } from './hill-of-round-doors-field-geo.js';
import { SPRAY_CELL, SPRAY_SOLID } from './hill-of-round-doors-field-leaf.js';

const IT = (1 + Math.sqrt(5)) / 2;
const ICO_V = [[-1, IT, 0], [1, IT, 0], [-1, -IT, 0], [1, -IT, 0], [0, -1, IT], [0, 1, IT], [0, -1, -IT], [0, 1, -IT], [IT, 0, -1], [IT, 0, 1], [-IT, 0, -1], [-IT, 0, 1]].map(vnorm);
const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];

// One mass of leaves about c: a lumpy dark core and `cards` sprays lying over it like shingles.
// o: { squash, cards, lo, mid, hi (colours from the shade to the light), crownC, crownS: [rx, ry, rz] of the whole crown, sway }
function clump(L, rng, c, r, o) {
  const rx = r, ry = r * o.squash, rz = r, base = L.count, cell = SPRAY_CELL, su = SPRAY_SOLID[0], sv = SPRAY_SOLID[1];
  const w = []; for (let k = 0; k < 3; k++) w.push([rng.range(-1, 1) * 3.1, rng.range(-1, 1) * 3.1, rng.range(-1, 1) * 3.1, rng() * TAU]);
  const tint = 1 + (rng() - 0.5) * 0.26, cc = o.crownC, cs = o.crownS;
  const out = (p) => vnorm([(p[0] - cc[0]) / cs[0], (p[1] - cc[1]) / cs[1] + 0.25, (p[2] - cc[2]) / cs[2]]);
  const shade = (d, p) => {
    const q = [(p[0] - cc[0]) / cs[0], (p[1] - cc[1]) / cs[1], (p[2] - cc[2]) / cs[2]], ao = sat(0.38 + 0.72 * vlen(q));
    const s = lerp(d[1] * 0.5 + 0.5, sat(0.45 + 0.6 * q[1]), 0.45);
    const col = s < 0.55 ? mix3(o.lo, o.mid, sstep(0, 0.55, s)) : mix3(o.mid, o.hi, sstep(0.55, 1, s));
    return mul3(col, ao * tint);
  };
  for (const d of ICO_V) {
    let l = 0; for (const q of w) l += Math.sin(d[0] * q[0] + d[1] * q[1] + d[2] * q[2] + q[3]);
    const s = (1 + 0.3 * (l / 3) + 0.1 * (rng() - 0.5)) * 0.64;
    const p = [c[0] + d[0] * rx * s, c[1] + d[1] * ry * s * (d[1] < 0 ? 0.8 : 1), c[2] + d[2] * rz * s];
    const nrm = vnorm(vadd(vscale(d, 0.55), vscale(out(p), 0.45)));
    L.v(p, nrm, mul3(mix3(o.lo, o.mid, (d[1] * 0.5 + 0.5) * 0.6), 0.6 * tint), o.sway, 1, 1, su, sv);
  }
  for (const f of ICO_F) L.tri(base + f[0], base + f[1], base + f[2]);
  const nl = o.cards, rmin = Math.min(rx, ry, rz), off = rng() * TAU;
  for (let k = 0; k < nl; k++) {
    const yy = 1 - (k + 0.5) / nl * 1.86, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = off + k * 2.39996 + rng.range(-0.3, 0.3);
    const d = vnorm([Math.cos(th) * rr + rng.range(-0.15, 0.15), yy + rng.range(-0.15, 0.15), Math.sin(th) * rr + rng.range(-0.15, 0.15)]);
    const sz = o.leaf * rmin * rng.range(0.8, 1.3) * 0.5 * (o.fine ? 0.86 : 1), rs = (o.fine ? 0.93 : 0.84) + rng.range(-0.1, 0.12);
    const p = [c[0] + d[0] * rx * rs, c[1] + d[1] * ry * rs, c[2] + d[2] * rz * rs];
    const tng = vnorm(vcross(d, [rng() - 0.5, rng() - 0.5, rng() - 0.5]));
    const ax = vnorm([d[0] * 0.6 + tng[0] * 0.7, d[1] * 0.6 + tng[1] * 0.7 - 0.25, d[2] * 0.6 + tng[2] * 0.7]);
    const sd = vnorm(vcross(ax, d)), U = vscale(ax, sz), V = vscale(sd, sz);
    let nr = vnorm(vadd(vscale(d, 0.5), vscale(out(p), 0.5)));
    nr = vnorm([nr[0] + rng.range(-0.25, 0.25), nr[1] + rng.range(-0.1, 0.3), nr[2] + rng.range(-0.25, 0.25)]);
    const col = mul3(shade(d, p), rng.range(0.85, 1.15)), tipc = mix3(col, o.hi, 0.3), basec = mul3(col, 0.85);
    const fl = rng() < 0.5, ua = fl ? cell[2] : cell[0], ub = fl ? cell[0] : cell[2], F = o.flutter;
    const i0 = L.v([p[0] - U[0] - V[0], p[1] - U[1] - V[1], p[2] - U[2] - V[2]], nr, basec, o.sway, F * 0.5, 1, ua, cell[3]);
    const i1 = L.v([p[0] - U[0] + V[0], p[1] - U[1] + V[1], p[2] - U[2] + V[2]], nr, basec, o.sway, F * 0.5, 1, ub, cell[3]);
    const i2 = L.v([p[0] + U[0] + V[0], p[1] + U[1] + V[1], p[2] + U[2] + V[2]], nr, tipc, o.sway, F * 1.4, 1, ub, cell[1]);
    const i3 = L.v([p[0] + U[0] - V[0], p[1] + U[1] - V[1], p[2] + U[2] - V[2]], nr, tipc, o.sway, F * 1.4, 1, ua, cell[1]);
    L.quad(i0, i1, i2, i3);
  }
}

// A shoot from q heading dir for len metres in n steps: it lifts by `lift`, wanders, tapers from r0 to r1, and never
// dips under floor(x, z, r): the lowest height its middle may have there, its own radius r counted.
function shoot(rng, q, dir, len, n, r0, r1, lift, wander, floor) {
  const pts = [q], rad = [r0]; let d = vnorm(dir), p = q;
  for (let i = 1; i <= n; i++) {
    const t = i / n, r = lerp(r0, r1, Math.pow(t, 0.8));
    d = vnorm([d[0] + (rng() - 0.5) * wander, d[1] + lift / n + (rng() - 0.5) * wander * 0.6, d[2] + (rng() - 0.5) * wander]);
    p = vmad(p, d, len / n);
    const fl = floor(p[0], p[2], r);
    if (p[1] < fl) { p = [p[0], fl, p[2]]; d = vnorm([d[0], Math.max(d[1], 0.12), d[2]]); }
    pts.push(p); rad.push(r);
  }
  return { pts, rad, dir: d };
}

// growTree(rng, S, pause) -> { wood, leaves, hangs, ties, sticks, top, reach, lowest, clumps }
// S: { height, crown, trunkR, trunkTop, clear, sink, lean, flare, buttresses, trunkSides, seam, ground(x, z),
//      tiers: [{ n, phi: [a, b] degrees up the dome, y0: [a, b], r0, r1, bow, wave, sides, segs, sub (metres between side
//      branches), subR, risers (share), rise, twigs: [a, b] }], clumpR, squash, cards, leaf, flutter, sway,
//      bark, barkDark, barkLight, moss, turf, lo, mid, hi, floorAt(x, z, r) -> the lowest height a ball of radius r
//      may have at a place (the flown line's clear air; optional) }   (places are measured from the foot; pause: ctx.yield)
// hangs: places on the underside of the wood where a cord may be tied; ties: [x, y, z, which bough] on the great
// boughs, for strings;
// sticks: [x, y, z, radius] along every bough, branch and twig (what a hung thing must keep off).
export async function growTree(rng, S, pause) {
  const wood = new Solid(), leaves = new Leafy(), hangs = [], ties = [], tips = [], sticks = [];
  const stick = (pts, rad) => { for (let i = 0; i < pts.length; i++) sticks.push([pts[i][0], pts[i][1], pts[i][2], rad[i]]); };
  const H = S.height, R = S.crown, clear = S.clear, tr = S.trunkR, top = S.trunkTop, sink = S.sink ?? 1.5, ground = S.ground || (() => 0);
  const crownC = [0, clear + 0.2 * (H - clear), 0], crownS = [R, (H - clear) * 0.8, R];
  const ph = rng() * TAU, lx = rng.range(-1, 1) * S.lean, lz = rng.range(-1, 1) * S.lean, nb = S.buttresses;
  const floorY = (x, z, r) => Math.max(clear + 0.3 + r, S.floorAt ? S.floorAt(x, z, r) : -1e9);
  const axis = (y) => [lx * y * y / top + 0.3 * Math.sin(y * 0.33 + ph), y, lz * y * y / top + 0.3 * Math.cos(y * 0.29 + ph)];
  // bark: moss on a limb's upper side, a little lighter out along the boughs
  const woodCol = (depth) => (t, k, ang) => {
    const up = Math.max(0, Math.cos(ang)), c = mix3(S.bark, S.barkLight, 0.22 * depth + 0.2 * t);
    return mul3(mix3(c, S.moss, up * up * 0.5), 0.8 + 0.2 * up);
  };
  // THE TRUNK, with buttresses at its foot
  const NT = 12, yAt = (t) => -sink + (top + sink) * Math.pow(t, 1.3), tpts = [], trad = [];
  for (let i = 0; i <= NT; i++) { const t = i / NT, y = yAt(t); tpts.push(axis(y)); trad.push(tr * (1 + 0.42 * Math.exp(-Math.max(0, y) / 2.6) + 0.12 * sstep(0.75, 1, t))); }
  const seam = vnorm(S.seam), bin = vcross([0, 1, 0], seam);
  limb(wood, tpts, trad, { sides: S.trunkSides, seam, kind: KIND.bark,
    flute: (ang, t) => { const y = yAt(t), k = Math.exp(-Math.max(0, y) / 3.4), c = 0.5 + 0.5 * Math.cos(nb * ang + ph); return 1 + S.flare * k * c * c * c + 0.06 * Math.sin(ang * 5 + y * 0.6 + ph); },
    col: (t, k, ang, p) => {
      const h = p[1] - ground(p[0], p[2]);
      let c = mix3(S.barkDark, S.bark, sstep(0.5, 7, h) * (0.75 + 0.25 * Math.sin(ang * 4 + ph)));
      c = mix3(c, S.moss, 0.5 * sstep(4, 0.5, h) + 0.25 * sat(Math.cos(ang - 1.2)));
      return mix3(S.turf, c, sstep(-0.4, 1.3, h));
    } });
  // THE ROOTS: one out of each buttress, running off over the ground and under it
  for (let i = 0; i < nb; i++) {
    const ang = (TAU * i - ph) / nb, d = vadd(vscale(seam, Math.cos(ang)), vscale(bin, Math.sin(ang))), side = vcross([0, 1, 0], d);
    const len = tr * rng.range(1.5, 2.6), wig = rng.range(-0.5, 0.5), r0 = tr * rng.range(0.24, 0.34), pts = [], rad = [];
    for (let j = 0; j <= 5; j++) {
      const t = j / 5, rho = tr * 0.95 + len * t, off = wig * tr * Math.sin(t * 2.6), x = d[0] * rho + side[0] * off, z = d[2] * rho + side[2] * off;
      const r = r0 * (1 - 0.8 * t);
      pts.push([x, ground(x, z) + lerp(1.9 * tr / 3.2, 0, sstep(0, 0.45, t)) + r * 0.3 - 0.9 * sstep(0.6, 1, t), z]); rad.push(r);
    }
    limb(wood, pts, rad, { sides: 6, kind: KIND.bark, col: (t, k, a, p) => mix3(S.turf, mix3(S.barkDark, S.moss, 0.35), sstep(-0.1, 0.7, p[1] - ground(p[0], p[2]))) });
  }
  if (pause) await pause();
  // THE BOUGHS, tier over tier: each tip lies on the crown's dome
  const yb = clear + S.clumpR * S.squash + 1.2, yTop = H - S.clumpR * S.squash * 0.9;
  let a0 = rng() * TAU, boughs = 0;
  for (const T of S.tiers) {
    for (let i = 0; i < T.n; i++) {
      const az = a0 + TAU * (i + rng.range(-0.28, 0.28)) / T.n, phi = rng.range(T.phi[0], T.phi[1]) * Math.PI / 180;
      const h = [Math.cos(az), 0, Math.sin(az)], s = [-h[2], 0, h[0]];
      const y0 = rng.range(T.y0[0], T.y0[1]), o0 = axis(y0), rhoT = (R - S.clumpR * 0.85) * Math.cos(phi) * rng.range(0.9, 1), yT = yb + (yTop - yb) * Math.sin(phi);
      const n = T.segs, wave = rng.range(-1, 1) * T.wave, wf = rng.range(0.6, 1.2), wp = rng() * TAU, up = rng.range(0.5, 2.2), pts = [], rad = [];
      for (let j = 0; j <= n; j++) {
        const t = j / n, rho = tr * 0.3 + (rhoT - tr * 0.3) * Math.pow(t, 0.92), lat = wave * Math.sin(TAU * wf * t + wp) * sstep(0.05, 0.5, t);
        const r = lerp(T.r0, T.r1, Math.pow(t, 0.75)) * (1 + 0.3 * Math.exp(-t * 9));
        let y = y0 + (yT - y0) * (1 - Math.pow(1 - t, T.bow)) + up * Math.pow(t, 5) + 0.35 * Math.sin(t * 9 + wp);
        const bx = o0[0] + h[0] * rho + s[0] * lat, bz = o0[2] + h[2] * rho + s[2] * lat;
        pts.push([bx, Math.max(y, floorY(bx, bz, r)), bz]); rad.push(r);
      }
      limb(wood, pts, rad, { sides: T.sides, kind: KIND.bark, col: woodCol(0) }); stick(pts, rad);
      let Lb = 0; for (let j = 1; j <= n; j++) Lb += vlen(vsub(pts[j], pts[j - 1]));
      for (let j = 2; j <= n; j++) { hangs.push({ p: [pts[j][0], pts[j][1] - rad[j], pts[j][2]], depth: 0 }); if (j >= n * 0.4 && j <= n * 0.85) ties.push([pts[j][0], pts[j][1] - rad[j] - 0.1, pts[j][2], boughs]); }
      boughs++;
      // side branches and risers along the bough, twigs on those
      const ns = Math.max(2, Math.round(Lb / T.sub)); let sgn = rng() < 0.5 ? 1 : -1;
      for (let j = 0; j < ns; j++) {
        const t = lerp(0.24, 0.97, (j + rng() * 0.8) / ns), f = Math.min(n - 0.001, t * n), i0 = Math.floor(f), q = mix3(pts[i0], pts[i0 + 1], f - i0);
        const tan = vnorm(vsub(pts[i0 + 1], pts[i0])), rr = lerp(rad[i0], rad[i0 + 1], f - i0), riser = rng() < T.risers; sgn = -sgn;
        const turn = rng.range(0.75, 1.35) * sgn, pitch = riser ? rng.range(0.95, 1.3) : rng.range(0.08, 0.5), flat = vnorm(vrot([tan[0], 0, tan[2]], [0, 1, 0], turn));
        const d = [flat[0] * Math.cos(pitch), Math.sin(pitch), flat[2] * Math.cos(pitch)];
        const len = riser ? rng.range(0.55, 1) * T.rise : lerp(0.42, 0.26, t) * Lb * rng.range(0.8, 1.15), r0 = Math.min(rr * 0.6, T.subR);
        const sh = shoot(rng, q, d, len, 4, r0, r0 * 0.3, riser ? -0.5 : 0.25, 0.3, floorY);
        limb(wood, sh.pts, sh.rad, { sides: 5, kind: KIND.bark, col: woodCol(1) }); stick(sh.pts, sh.rad);
        for (let k = 2; k <= 4; k++) hangs.push({ p: [sh.pts[k][0], sh.pts[k][1] - sh.rad[k], sh.pts[k][2]], depth: 1 });
        const nt = rng.int(T.twigs[0], T.twigs[1]);
        for (let k = 0; k < nt; k++) {
          const tt = lerp(0.35, 0.92, (k + rng()) / nt), ff = Math.min(3.999, tt * 4), i1 = Math.floor(ff), qq = mix3(sh.pts[i1], sh.pts[i1 + 1], ff - i1);
          const tn = vnorm(vsub(sh.pts[i1 + 1], sh.pts[i1]));
          let td = vrot(tn, perp(tn), rng.range(0.6, 1.2)); td = vrot(td, tn, rng() * TAU); td = vnorm([td[0], td[1] * 0.6 + 0.15, td[2]]);
          const tw = shoot(rng, qq, td, len * rng.range(0.32, 0.5) + 1.2, 2, r0 * 0.4, r0 * 0.14, 0.3, 0.35, floorY);
          limb(wood, tw.pts, tw.rad, { sides: 3, kind: KIND.bark, col: woodCol(2) }); stick(tw.pts, tw.rad);
          tips.push({ p: tw.pts[2], dir: tw.dir, k: 0.85 }); hangs.push({ p: [tw.pts[2][0], tw.pts[2][1] - 0.1, tw.pts[2][2]], depth: 2 });
        }
        tips.push({ p: sh.pts[4], dir: sh.dir, k: 1.05 });
      }
      tips.push({ p: pts[n], dir: vnorm(vsub(pts[n], pts[n - 1])), k: 1.25 });
    }
    a0 += 0.7 + rng() * 0.6;
    if (pause) await pause();
  }
  // THE LEAVES: a mass on every tip, kept inside the dome and over the clear height (its sprays' reach and the wind's
  // push counted)
  let topY = 0, reach = 0, lowest = Infinity;
  for (let i = 0; i < tips.length; i++) {
    const tip = tips[i], r = S.clumpR * tip.k * rng.range(0.82, 1.2), ry = r * S.squash, spray = S.leaf * ry * 1.3 * 0.5 * 1.4143;
    const c = vadd(vmad(tip.p, tip.dir, r * 0.25), [0, r * 0.12, 0]), rho = Math.hypot(c[0], c[2]);
    if (rho + r * 0.8 > R) { const k = (R - r * 0.8) / rho; c[0] *= k; c[2] *= k; }
    if (c[1] + ry > H) c[1] = H - ry;
    const floor = Math.max(clear + ry * 0.96 + spray + 0.6, S.floorAt ? S.floorAt(c[0], c[2], r + spray * 0.7) : -1e9); if (c[1] < floor) c[1] = floor;
    const deep = c[1] > clear + 0.3 * (H - clear) && vlen([(c[0] - crownC[0]) / crownS[0], (c[1] - crownC[1]) / crownS[1], (c[2] - crownC[2]) / crownS[2]]) < 0.7;      // a mass well inside the crown and over its lowest third is hidden by those about it: half the sprays; one at the crown's edge or its underside: finer sprays standing further out
    clump(leaves, rng, c, r, { squash: S.squash, cards: deep ? Math.round(S.cards * 0.5) : S.cards, fine: !deep, leaf: S.leaf, lo: S.lo, mid: S.mid, hi: S.hi, crownC, crownS,
      sway: S.sway * (0.5 + sat((c[1] - clear) / (H - clear))), flutter: S.flutter });
    topY = Math.max(topY, c[1] + ry); reach = Math.max(reach, Math.hypot(c[0], c[2]) + r); lowest = Math.min(lowest, c[1] - ry * 0.96 - spray);
    if (pause && i % 40 === 39) await pause();
  }
  return { wood, leaves, hangs, ties, sticks, top: topY, reach, lowest, clumps: tips.length };
}
