// SNOW ON TURQUOISE: winter over a Silk Road city of tiled madrasas. The flight chases white pigeons through a
// snow squall over the flat mud roofs of the old quarter (persimmons, smoking ovens, carpets on parapets), between
// two leaning minarets and up the west flank of the great ribbed dome just as the squall tears open and the sun
// rakes the ribs and a slab of snow lets go; round the north shoulder the lit city appears, and the camera dives
// across a madrasa courtyard, through its gateway passage and over the square into the star-tiled arch opposite.
// World space == brief space: X east, Z south, y above the square's paving; the hero stands at (-300, 0, -50).
// The sun stands in the south-west (a little west of the brief's SSW) so it rakes the dome's west flank from behind
// our left shoulder. The squall is a dark one: its lee side stands as slate cloud ahead of us, and a ragged break in it
// travels with the wind just ahead of the camera, so low sun lies on the near roofs (long shadows, cloud shreds dappling
// them) and the white flock, the tiled minarets and the dome glow against the storm. The pass is a wide arc (17 m off the ribs on the west flank, 22 m round the north shoulder) so the
// whole dome sits in the frame: the shadow edge crosses it at u 0.398 as we close on the lit south-west face, the slab
// lets go at 0.407 and is beside us at 0.43. In the squall a share of the sun still comes through as a soft key, and
// one ragged hole in the cloud lays a pool of warm light on the dome and its minarets from the first frame.
// Everything scripted is one function of path progress u (squall -> clear, the travelling cloud-shadow edge);
// all architecture shares the hero's tile shader and its light block, so the shadow edge crosses every surface.
// Looks by seed / ctx.vary.hour: winter midday (2 visits in 5), late afternoon (apricot snow, 2), blue dusk (moon, lamplit cells, 1);
// weather: tearing squall, freezing fog (rime, a fog sea left in the lanes), calm big flakes (a high veil stays); season: midwinter / first snow; rare: the great
// shedding (every groove of the dome lets go at once and every pigeon rises).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep as sm } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, Geo, archWall, archH, tileMaterial, worldCastGLSL, GLSL_LIGHT } from '../parts/snow-on-turquoise.js';

const PALETTE = ['#F4F8FB', '#19B3AE', '#1D4FA8', '#13235A', '#D59B2C', '#EE6A1F', '#9C8468'];
const TAU = Math.PI * 2, NBOX = 14, NCYL = 24, NPOST = 34;
const HERO_AT = [-300, 0, -50];

// ---------------------------------------------------------------- fast emitters on the hero's Geo accumulator
// quad a,b,c,d counter-clockwise seen from its lit side; uv in metres; ao at the a-b edge and the c-d edge
function Q(G, a, b, c, d, u0 = 0, v0 = 0, ao0 = 1, ao1 = 1, g = 0, bb = 0.5, b1 = bb) {
  if (G.m) { const e = G.m.elements, t = (p) => [e[0] * p[0] + e[4] * p[1] + e[8] * p[2] + e[12], e[1] * p[0] + e[5] * p[1] + e[9] * p[2] + e[13], e[2] * p[0] + e[6] * p[1] + e[10] * p[2] + e[14]]; a = t(a); b = t(b); c = t(c); d = t(d); }
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  const w = Math.hypot(ux, uy, uz) * (G.uvS || 1), h = Math.hypot(vx, vy, vz) * (G.uvS || 1), k = G.count, pa = G.pat, ax = G.aux;
  G.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
  G.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
  G.uv.push(u0, v0, u0 + w, v0, u0 + w, v0 + h, u0, v0 + h);
  G.ap.push(pa, ax, pa, ax, pa, ax, pa, ax);
  G.c.push(ao0, g, bb, ao0, g, bb, ao1, g, b1, ao1, g, b1);
  G.i.push(k, k + 1, k + 2, k, k + 2, k + 3); G.count += 4;
}
// box centred at (cx, cy, cz), yaw ry; faces: bit 1 sides, 2 top; ao runs bottom to top on the sides
function BX(G, cx, cy, cz, sx, sy, sz, ry = 0, faces = 3, ao0 = 1, ao1 = 1, g = 0, bb = 0.5, u0 = 0) {
  const c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const P = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
  if (faces & 1) {
    Q(G, P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), u0, 0, ao0, ao1, g, bb);
    Q(G, P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), u0 + sx, 0, ao0, ao1, g, bb);
    Q(G, P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz), u0 + sx + sz, 0, ao0, ao1, g, bb);
    Q(G, P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), u0 + 2 * sx + sz, 0, ao0, ao1, g, bb);
  }
  if (faces & 2) Q(G, P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz), cx, cz, ao1, ao1, g, bb);
}
// tapered limb between two points (pattern 9 bark), three-sided or G.limbN-sided near the camera; sw0 / sw1 are wind sway weights
function limb(G, p0, p1, r0, r1, sw0, sw1) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz) || 1, ns = G.limbN || 3;
  let ax = -dz, az = dx; const al = Math.hypot(ax, az); if (al < 1e-4) { ax = 1; az = 0; } else { ax /= al; az /= al; }
  const bx = (dy * az) / L, by = (dz * ax - dx * az) / L, bz = (-dy * ax) / L, k = G.count;
  for (let e = 0; e < 2; e++) {
    const p = e ? p1 : p0, r = e ? r1 : r0, sw = e ? sw1 : sw0;
    for (let i = 0; i < ns; i++) {
      const a = i * TAU / ns + 0.5, ca = Math.cos(a), sa = Math.sin(a), nx = ax * ca + bx * sa, ny = by * sa, nz = az * ca + bz * sa;
      G.p.push(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r); G.n.push(nx, ny, nz);
      G.uv.push(i * 0.4, e * L); G.ap.push(9, G.aux); G.c.push(e ? 1 : 0.8, 0, sw);
    }
  }
  for (let i = 0; i < ns; i++) { const j = (i + 1) % ns; G.i.push(k + i, k + j, k + ns + i, k + j, k + ns + j, k + ns + i); }
  G.count += 2 * ns;
}
// a bare tree: trunk, limbs splitting `levels` times. tips collects fruit / leaf points [x, y, z, swayWeight]
function bareTree(G, rng, x, y, z, H, o = {}) {
  const levels = o.levels ?? 2, spread = o.spread ?? 0.75, tr = o.trunk ?? H * 0.035, tips = o.tips, up = o.up ?? 0.55;
  const top = [x + rng.range(-0.3, 0.3), y + H * (o.bole ?? 0.34), z + rng.range(-0.3, 0.3)];
  limb(G, [x, y, z], top, tr * 1.25, tr, 0, 0.04);
  const grow = (p, dir, len, r, lv, sw) => {
    const q = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len], sw1 = sw + len / H;
    limb(G, p, q, r, r * 0.62, sw * sw, sw1 * sw1);
    if (lv >= levels) {
      if (tips) { const n = o.perTip ?? 3; for (let i = 0; i < n; i++) { const t = rng.range(0.25, 1); tips.push([p[0] + dir[0] * len * t + rng.range(-0.25, 0.25), p[1] + dir[1] * len * t - rng.range(0.1, 0.45), p[2] + dir[2] * len * t + rng.range(-0.25, 0.25), sw1 * sw1]); } }
      return;
    }
    const n = lv === 0 ? 2 : rng.chance(0.3) ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, TAU), k = spread * rng.range(0.6, 1.2);
      let d = [dir[0] + Math.cos(a) * k, dir[1] * (1 - 0.3 * k) + up * rng.range(0.3, 1), dir[2] + Math.sin(a) * k];
      const dl = Math.hypot(d[0], d[1], d[2]); d = [d[0] / dl, d[1] / dl, d[2] / dl];
      grow(q, d, len * rng.range(0.62, 0.8), r * 0.62, lv + 1, sw1);
    }
  };
  const nl = o.limbs ?? 3, a0 = rng.range(0, TAU);
  for (let i = 0; i < nl; i++) {
    const a = a0 + i * TAU / nl + rng.range(-0.4, 0.4), k = spread * rng.range(0.7, 1.1), dl = Math.hypot(k, 1);
    grow(top, [Math.cos(a) * k / dl, 1 / dl, Math.sin(a) * k / dl], H * rng.range(0.24, 0.3), tr * 0.72, 0, 0.12);
  }
}
// a bare poplar: tall bole with upswept whips
function poplar(G, rng, x, z, H, tips) {
  const lean = [rng.range(-0.02, 0.02), 1, rng.range(-0.02, 0.02)], n = 9;
  limb(G, [x, 0, z], [x + lean[0] * H, H, z + lean[2] * H], H * 0.022, 0.03, 0, 1);
  for (let i = 0; i < n; i++) {
    const t = 0.22 + 0.7 * (i + rng()) / n, a = rng.range(0, TAU), L = H * (0.34 - 0.2 * t), k = 0.3;
    const p = [x + lean[0] * H * t, H * t, z + lean[2] * H * t], q = [p[0] + Math.cos(a) * L * k, p[1] + L, p[2] + Math.sin(a) * L * k];
    limb(G, p, q, H * 0.009, 0.02, t * t, (t + L / H) * (t + L / H));
    if (tips) for (let j = 0; j < 3; j++) { const s = rng.range(0.2, 1); tips.push([p[0] + (q[0] - p[0]) * s, p[1] + L * s, p[2] + (q[2] - p[2]) * s, t]); }
  }
}

// ---------------------------------------------------------------- old-quarter house on its lot
// L: { x, z, w, d, yaw, tier } tier 0 = beside the path (all props) .. 3 = far roofscape. out collects smoke points,
// tree sites, ground-map rectangles and the loft position.
function house(G, L, rng, out) {
  const { x, z, w, d, yaw, tier } = L, c = Math.cos(yaw), s = Math.sin(yaw);
  const P = (lx, y, lz) => [x + lx * c + lz * s, y, z - lx * s + lz * c];
  const two = rng.chance(0.15), h = Math.min(two ? rng.range(6.6, 9) : rng.range(3.5, 5.6), L.maxH ?? 99), tint = rng(), white = rng.chance(0.16) ? 1 : 0;
  const bd = d * (tier < 2 ? rng.range(0.5, 0.74) : rng.range(0.6, 0.85)), bz = -d / 2 + bd / 2;          // house body at the back of the lot
  out.casters.push([x + (bz) * s, z + (bz) * c, w, bd, yaw, h]);
  const par = 0.45, hw = w / 2, z0 = -d / 2, z1 = z0 + bd;
  G.set(10, white);
  // merged lots are compounds: a wing (or two) down the side of the court makes an L or a U
  L.wing = 0;
  if (L.big) for (const sx of rng.chance(0.3) ? [-1, 1] : [rng.pick([-1, 1])]) {
    const ww = w * rng.range(0.2, 0.3), wd = (d - bd) * rng.range(0.75, 1), wh = Math.min(h, rng.range(3.3, 4.6)), q = P(sx * (hw - ww / 2), 0, z1 + wd / 2);
    BX(G, q[0], wh / 2, q[2], ww, wh, wd, yaw, 3, 0.65, 1, tint); out.casters.push([q[0], q[2], ww, wd, yaw, wh]); L.wing += sx;
  }
  if (L.deep && tier < 3) { const hh = rng.range(0.8, 1.5), rn = rng.range(1.4, 2.2); G.set(13, 0); Q(G, P(-hw, hh, z0 - 0.03), P(hw, hh, z0 - 0.03), P(hw + 0.3, 0, z0 - rn), P(-hw - 0.3, 0, z0 - rn)); G.set(10, white); }      // drift banked against the back wall
  if (tier >= 3) {
    BX(G, x + bz * s, h / 2, z + bz * c, w, h, bd, yaw, 3, 0.7, 1, tint);
    if (L.pd < 430) { const cw = 2.3, zf = d / 2; Q(G, P(-hw, 0, zf), P(hw, 0, zf), P(hw, cw, zf), P(-hw, cw, zf), 0, 0, 0.62, 1, tint); if (L.pd < 300) { Q(G, P(hw, 0, zf), P(hw, 0, z1), P(hw, cw, z1), P(hw, cw, zf), 0, 0, 0.62, 1, tint); Q(G, P(-hw, 0, z1), P(-hw, 0, zf), P(-hw, cw, zf), P(-hw, cw, z1), 0, 0, 0.62, 1, tint); } }
    return;
  }
  BX(G, x + bz * s, h / 2, z + bz * c, w, h, bd, yaw, tier < 2 ? 1 : 3, 0.62, 1, tint);      // beyond 95 m the roof is the box's flat top
  if (tier < 2) Q(G, P(-hw + 0.35, h - par, z1 - 0.35), P(hw - 0.35, h - par, z1 - 0.35), P(hw - 0.35, h - par, z0 + 0.35), P(-hw + 0.35, h - par, z0 + 0.35), x, z, 0.85, 0.85, tint);
  // the sun-side parapets lay a band of shadow across the roof's snow (baked quads: color.r 0.25 cuts the sun)
  const lsx = out.sh[0] * c - out.sh[1] * s, lsz = out.sh[0] * s + out.sh[1] * c;      // shadow vector per metre of height, in the lot's frame
  {      // (beyond 95 m the parapet is only this band along the roof's sun-side edges, a little wider so it still reads)
    const near = tier < 2, ins = near ? 0.35 : 0.02, pk = near ? par : 0.62;
    const ys = near ? h - par + 0.025 : h + 0.08, xa = -hw + ins, xb = hw - ins, za = z0 + ins, zb = z1 - ins, wx = Math.min(Math.abs(lsx) * pk, (xb - xa) * 0.45), wz = Math.min(Math.abs(lsz) * pk, (zb - za) * 0.45);
    G.set(13, 0);
    if (wx > 0.08) { const xq = lsx > 0 ? xa : xb - wx; Q(G, P(xq, ys, zb), P(xq + wx, ys, zb), P(xq + wx, ys, za), P(xq, ys, za), 0, 0, 0.25, 0.25, 0.85); }
    if (wz > 0.08) { const zq = lsz > 0 ? za : zb - wz; Q(G, P(xa, ys, zq + wz), P(xb, ys, zq + wz), P(xb, ys, zq), P(xa, ys, zq), 0, 0, 0.25, 0.25, 0.85); }
    G.set(10, white);
  }
  // long shadows across the roof's snow: the edge a-b swept down the sun's line by `len` metres of height, kept on the roof
  const ysh = h - par + 0.03, onRoof = (px, pz) => [Math.max(-hw + 0.36, Math.min(hw - 0.36, px)), Math.max(z0 + 0.36, Math.min(z1 - 0.36, pz))];
  const roofShadow = (ax, az, bx, bz2, len) => {
    const a = onRoof(ax, az), b = onRoof(bx, bz2), c2 = onRoof(bx + lsx * len, bz2 + lsz * len), d2 = onRoof(ax + lsx * len, az + lsz * len);
    const turn = (b[0] - a[0]) * (d2[1] - a[1]) - (b[1] - a[1]) * (d2[0] - a[0]);
    if (Math.abs(turn) < 0.02) return;
    G.set(13, 0);
    if (turn < 0) Q(G, P(a[0], ysh, a[1]), P(b[0], ysh, b[1]), P(c2[0], ysh, c2[1]), P(d2[0], ysh, d2[1]), 0, 0, 0.25, 0.25, 0.85);
    else Q(G, P(b[0], ysh, b[1]), P(a[0], ysh, a[1]), P(d2[0], ysh, d2[1]), P(c2[0], ysh, c2[1]), 0, 0, 0.25, 0.25, 0.85);
  };
  // parapet: flat top and inner faces
  const ring = [[-hw, z1], [hw, z1], [hw, z0], [-hw, z0]];
  for (let i = 0; i < 4 && tier < 2; i++) {
    const a = ring[i], b = ring[(i + 1) % 4], ia = [a[0] - Math.sign(a[0]) * 0.35, a[1] - Math.sign(a[1] - bz) * 0.35], ib = [b[0] - Math.sign(b[0]) * 0.35, b[1] - Math.sign(b[1] - bz) * 0.35];
    Q(G, P(a[0], h, a[1]), P(b[0], h, b[1]), P(ib[0], h, ib[1]), P(ia[0], h, ia[1]), 0, 0, 1, 1, tint);
    if (tier < 2) Q(G, P(ib[0], h - par, ib[1]), P(ia[0], h - par, ia[1]), P(ia[0], h, ia[1]), P(ib[0], h, ib[1]), 0, h - par, 0.7, 0.95, tint);
  }
  // courtyard walls round the front of the lot
  const cw = 2.3, t = 0.4, zf = d / 2;
  if (tier < 2) {
    BX(G, ...P(-hw + t / 2, cw / 2, (z1 + zf) / 2), t, cw, zf - z1, yaw, 3, 0.62, 1, tint);
    BX(G, ...P(hw - t / 2, cw / 2, (z1 + zf) / 2), t, cw, zf - z1, yaw, 3, 0.62, 1, tint);
    BX(G, ...P(0, cw / 2, zf - t / 2), w, cw, t, yaw, 3, 0.62, 1, tint);
  } else {
    G.set(10, white);
    Q(G, P(-hw, 0, zf), P(hw, 0, zf), P(hw, cw, zf), P(-hw, cw, zf), 0, 0, 0.62, 1, tint);
    Q(G, P(hw, 0, zf), P(hw, 0, z1), P(hw, cw, z1), P(hw, cw, zf), 0, 0, 0.62, 1, tint);
    Q(G, P(-hw, 0, z1), P(-hw, 0, zf), P(-hw, cw, zf), P(-hw, cw, z1), 0, 0, 0.62, 1, tint);
    return;
  }
  const lit = rng(), dg = rng.chance(0.5) ? 1 : 0;
  // doors (street gate, house door) and small windows on the court side and the back
  const gx = rng.range(-hw + 1.5, hw - 1.5);
  G.set(12, 1); Q(G, P(gx - 0.7, 0, zf + 0.04), P(gx + 0.7, 0, zf + 0.04), P(gx + 0.7, 1.95, zf + 0.04), P(gx - 0.7, 1.95, zf + 0.04), 0, 0, 0.8, 1, dg);
  const dx = rng.range(-hw + 1.4, hw - 1.4);
  Q(G, P(dx - 0.55, 0, z1 + 0.04), P(dx + 0.55, 0, z1 + 0.04), P(dx + 0.55, 1.9, z1 + 0.04), P(dx - 0.55, 1.9, z1 + 0.04), 0, 0, 0.8, 1, 1 - dg);
  G.set(12, 2);
  const nw = 1 + rng.int(0, 2);
  for (let i = 0; i < nw; i++) {
    const wx = -hw + (i + 0.5 + rng.range(-0.2, 0.2)) * w / nw; if (Math.abs(wx - dx) < 1.3) continue;
    const wy = h > 5 ? rng.pick([1.5, h - 2.1]) : 1.5;
    Q(G, P(wx - 0.4, wy, z1 + 0.04), P(wx + 0.4, wy, z1 + 0.04), P(wx + 0.4, wy + 1.0, z1 + 0.04), P(wx - 0.4, wy + 1.0, z1 + 0.04), 0, 0, 0.9, 0.9, lit * rng.range(0.6, 1.5), rng());
  }
  if (rng.chance(0.6)) { const wx = rng.range(-hw + 1, hw - 1), wy = h * 0.5; Q(G, P(wx + 0.4, wy, z0 - 0.04), P(wx - 0.4, wy, z0 - 0.04), P(wx - 0.4, wy + 0.9, z0 - 0.04), P(wx + 0.4, wy + 0.9, z0 - 0.04), 0, 0, 0.9, 0.9, lit * rng.range(0.6, 1.5), rng()); }
  // roof beam ends under the parapet on the court side
  G.set(7, 0);
  for (let vx = -hw + 0.8; vx < hw - 0.5 && tier === 0; vx += 1.3) BX(G, ...P(vx, h - 0.85, z1 + 0.22), 0.16, 0.16, 0.45, yaw, 3, 0.7, 0.7);
  // upper room on some roofs
  if (rng.chance(0.3) && L.pd > 18) {
    const uw = w * rng.range(0.35, 0.5), ud = bd * rng.range(0.5, 0.7), ux = rng.pick([-1, 1]) * (hw - uw / 2 - 0.5), uh = rng.range(2.2, 2.8);
    G.set(10, white); BX(G, ...P(ux, h - par + uh / 2, bz), uw, uh, ud, yaw, 3, 0.75, 1, tint * 0.8);
    G.set(12, 2); Q(G, P(ux - 0.35, h + 0.5, bz + ud / 2 + 0.04), P(ux + 0.35, h + 0.5, bz + ud / 2 + 0.04), P(ux + 0.35, h + 1.4, bz + ud / 2 + 0.04), P(ux - 0.35, h + 1.4, bz + ud / 2 + 0.04), 0, 0, 0.9, 0.9, lit * 1.4, rng());
    { const ex = ux + Math.sign(lsx || 1) * uw / 2, ez = bz + Math.sign(lsz || 1) * ud / 2; roofShadow(ex, bz - ud / 2, ex, bz + ud / 2, uh); roofShadow(ux - uw / 2, ez, ux + uw / 2, ez, uh); }
  }
  // chimney (smoke) and a ladder to the roof
  if (rng.chance(L.entry ? 1 : 0.55)) {
    const kx = rng.range(-hw + 1, hw - 1), kz = bz + rng.range(-0.3, 0.3) * bd;
    G.set(10, 0); BX(G, ...P(kx, h + 0.35, kz), 0.6, 1.5, 0.6, yaw, 3, 0.8, 0.9, tint * 0.6);
    G.set(12, 0); Q(G, P(kx - 0.18, h + 1.11, kz + 0.18), P(kx + 0.18, h + 1.11, kz + 0.18), P(kx + 0.18, h + 1.11, kz - 0.18), P(kx - 0.18, h + 1.11, kz - 0.18));
    out.smoke.push([...P(kx, h + 1.2, kz), L.pd]);
    { const ll = Math.hypot(lsx, lsz) || 1, qx = -lsz / ll * 0.3, qz = lsx / ll * 0.3; roofShadow(kx - qx, kz - qz, kx + qx, kz + qz, 1.55); }
  }
  if (rng.chance(0.5)) {
    const lx = rng.range(-hw + 1.2, hw - 1.2), lean = 1.3, rw = tier === 0 ? 0.06 : 0.11; G.set(7, 0);      // thin members are widened with distance
    for (const o of [-0.27, 0.27]) Q(G, P(lx + o - rw, 0, z1 + lean), P(lx + o + rw, 0, z1 + lean), P(lx + o + rw, h + 0.7, z1 + 0.02), P(lx + o - rw, h + 0.7, z1 + 0.02));
    for (let r = 0.5; r < h + 0.4 && tier === 0; r += 0.6) { const k = r / (h + 0.7), zz = z1 + lean * (1 - k) + 0.01; Q(G, P(lx - 0.25, r - 0.05, zz), P(lx + 0.25, r - 0.05, zz), P(lx + 0.25, r + 0.05, zz - 0.015), P(lx - 0.25, r + 0.05, zz - 0.015)); }
  }
  // firewood rick against the court wall
  if (rng.chance(0.6)) { const fl = rng.range(1.6, 3.2), fh = rng.range(0.9, 1.5), side = rng.pick([-1, 1]); G.set(7, 0); BX(G, ...P(side * (hw - t - 0.35), fh / 2, rng.range(z1 + 1.2, zf - 1.6)), 0.6, fh, fl, yaw, 3, 0.6, 1); }
  // carpets: draped over the roof parapet, hung on a court rail
  if (rng.chance(0.55)) {
    const cwid = rng.range(1.4, 2.6), cx = rng.range(-hw + 1.6, hw - 1.6), len = rng.range(1.6, 2.6), sg = rng(), front = rng.chance(0.75);
    const zw = front ? z1 : z0, o = front ? 1 : -1; G.set(11, rng.chance(0.5) ? 1 : 0);
    const A = (xx, yy, zz) => P(cx + xx * o, yy, zw + zz * o);
    Q(G, A(-cwid / 2, h + 0.03, -0.4), A(cwid / 2, h + 0.03, -0.4), A(cwid / 2, h + 0.03, 0.07), A(-cwid / 2, h + 0.03, 0.07), 0, 0, 1, 1, sg, 0);
    for (let k = 0; k < 2; k++) Q(G, A(-cwid / 2, h - len * (k + 1) / 2, 0.08), A(cwid / 2, h - len * (k + 1) / 2, 0.08), A(cwid / 2, h - len * k / 2, 0.08), A(-cwid / 2, h - len * k / 2, 0.08), 0, 0.5 + len * (1 - k) / 2, 0.92, 1, sg, 0.25 * (k + 1), 0.25 * k);
  }
  if (tier === 0 && rng.chance(0.6)) {
    const rz = rng.range(z1 + 1.6, zf - 1.2), rw = rng.range(2, Math.min(4, w - 3)), rx = rng.range(-hw + 1 + rw / 2, hw - 1 - rw / 2), sg = rng();
    G.set(7, 0); for (const e of [-1, 1]) BX(G, ...P(rx + e * rw / 2, 0.95, rz), 0.16, 1.9, 0.16, yaw, 1, 0.7, 1);
    BX(G, ...P(rx, 1.9, rz), rw + 0.3, 0.12, 0.12, yaw, 3, 1, 1);
    G.set(11, rng.chance(0.5) ? 1 : 0);
    for (let k = 0; k < 2; k++) Q(G, P(rx - rw / 2 + 0.2, 1.9 - 0.75 * (k + 1), rz + 0.06), P(rx + rw / 2 - 0.2, 1.9 - 0.75 * (k + 1), rz + 0.06), P(rx + rw / 2 - 0.2, 1.9 - 0.75 * k, rz + 0.06), P(rx - rw / 2 + 0.2, 1.9 - 0.75 * k, rz + 0.06), 0, 0.75 * (1 - k), 0.9, 1, sg, 0.5 * (k + 1), 0.5 * k);
  }
  // clay bread oven with a glowing mouth, water jars wearing snow
  const m0 = G.m, M = new THREE.Matrix4();
  if (rng.chance(L.entry ? 1 : 0.45)) {
    const ox = rng.range(-hw + 1.5, hw - 1.5), oz = rng.range(z1 + 1.6, zf - 1.4), p = P(ox, 0, oz), os = L.entry ? 1.5 : 1;
    G.m = M.makeRotationY(yaw + rng.range(-0.4, 0.4)).scale(new THREE.Vector3(os, os, os)).setPosition(p[0], 0, p[2]);
    G.set(10, 0);
    G.ring(0.85, 0, 0.85, 0.7, { nu: 7, cf: (ph, tt, q) => { q.g = 0.2; } }); G.ring(0.85, 0.7, 0.55, 1.25, { nu: 7, cf: (ph, tt, q) => { q.g = 0.2; } }); G.ring(0.55, 1.25, 0.12, 1.5, { nu: 7, cf: (ph, tt, q) => { q.g = 0.2; } });
    G.set(12, 3); Q(G, [-0.3, 0.2, 0.86], [0.3, 0.2, 0.86], [0.3, 0.7, 0.86], [-0.3, 0.7, 0.86], 0, 0, 1, 1, 0, rng());
    G.m = m0; out.smoke.push([p[0], 1.6, p[2], L.pd + 6]);
  }
  if (tier === 0) for (let j = rng.int(1, 3); j > 0; j--) {
    const p = P(rng.range(-hw + 0.9, hw - 0.9), 0, rng.range(z1 + 0.6, zf - 0.8)), k = rng.range(0.7, 1.15), gl = rng.chance(0.4);
    G.m = M.makeScale(k, k, k).setPosition(p[0], 0, p[2]);
    G.set(gl ? 8 : 10, 0); const cf = (ph, tt, q) => { q.g = gl ? 0.1 : 0.9; q.b = 0.5; };
    G.ring(0.22, 0, 0.42, 0.45, { nu: 6, cf }); G.ring(0.42, 0.45, 0.3, 0.95, { nu: 6, cf }); G.ring(0.3, 0.95, 0.16, 1.05, { nu: 6, cf });
    G.set(13, 0); G.ring(0.22, 1.05, 0.02, 1.22, { nu: 6 });
    G.m = m0;
  }
  // roof clutter beside the path: a hatch, snow-covered heaps, a rack of persimmons strung up to dry. Roofs the
  // descent passes over (L.under: its own rng, so no other draw moves) get all of it, plus wind-packed drift ridges,
  // a carpet airing on a rail and a firewood stack, so no roof under the camera is a bare plane.
  if (tier === 0) {
    const ry = h - par, ur = L.under || null, rp = (r = rng) => P(r.range(-hw + 1.4, hw - 1.4), ry, bz + r.range(-0.3, 0.3) * bd);
    const hatch = rng.chance(0.5);
    if (hatch || ur) { const p = rp(hatch ? rng : ur); G.set(10, white); BX(G, p[0], ry + 0.3, p[2], 1.1, 0.6, 1.1, yaw, 3, 0.8, 1, tint); G.set(7, 0); BX(G, p[0], ry + 0.63, p[2], 0.9, 0.06, 0.9, yaw + 0.1, 3); }
    for (let j = rng.int(0, 2); j > 0; j--) { const p = rp(); G.m = M.makeTranslation(p[0], ry, p[2]); G.set(13, 0); G.ring(rng.range(0.5, 0.95), 0, 0.06, rng.range(0.3, 0.55), { nu: 6 }); G.m = m0; }
    const rack = rng.chance(0.45);
    if (rack || ur) {
      const r = rack ? rng : ur, rx = r.range(-hw + 2, hw - 2), rz = bz + r.range(-0.2, 0.2) * bd, len = 2.6; G.set(7, 0);
      for (const e of [-1, 1]) BX(G, ...P(rx + e * len / 2, ry + 0.75, rz), 0.14, 1.5, 0.14, yaw, 1, 0.8, 1);
      BX(G, ...P(rx, ry + 1.5, rz), len + 0.2, 0.1, 0.1, yaw, 3);
      for (let k = 0; k < 14; k++) out.fruit.push([...P(rx + (k / 13 - 0.5) * len, ry + 1.36 - (k % 3) * 0.2, rz), 0.25, 0.085]);
    }
    if (ur) {
      for (let j = 3; j > 0; j--) { const p = rp(ur); G.m = M.makeTranslation(p[0], ry, p[2]); G.set(13, 0); G.ring(ur.range(0.55, 1.1), 0, 0.06, ur.range(0.3, 0.6), { nu: 6 }); G.m = m0; }
      // drift ridges packed along the wind: low whalebacks that catch the sun on one flank
      const cwa = out.wind[0] * c - out.wind[1] * s, swa = out.wind[0] * s + out.wind[1] * c;
      for (let j = 0; j < 3; j++) {
        const len = ur.range(2.6, Math.max(3, Math.min(6.5, Math.min(w, bd) - 2.4))), wd = ur.range(0.45, 0.75), hh = ur.range(0.38, 0.6);
        const cx = ur.range(-hw + 1.6, hw - 1.6) * 0.8, cz = bz + ur.range(-0.34, 0.34) * bd, lim = (v, m) => Math.max(-m, Math.min(m, v));
        const at = (al, ac) => [lim(cx + al * cwa - ac * swa, hw - 0.5), bz + lim(cz - bz + al * swa + ac * cwa, bd / 2 - 0.5)];
        G.set(13, 0);
        G.grid(5, 2, (a, t, q) => {
          const l = at((a - 0.5) * len, (t - 0.5) * 2 * wd * (0.35 + 0.65 * Math.sin(a * Math.PI))), p = P(l[0], 0, l[1]);
          q.x = p[0]; q.z = p[2]; q.y = ry + 0.03 + (t === 0.5 ? hh * Math.pow(Math.sin(a * Math.PI), 0.7) * (0.75 + 0.25 * Math.sin(a * 9 + j)) : 0); q.u = p[0]; q.v = p[2];
        }, false, false);
        // its shadow: the crest pushed out along the sun's line, showing beyond the lee flank
        const a0 = at(-0.3 * len, 0), a1 = at(0.3 * len, 0), k = hh * 0.9, b0 = [lim(a0[0] + lsx * k, hw - 0.4), bz + lim(a0[1] - bz + lsz * k, bd / 2 - 0.4)], b1 = [lim(a1[0] + lsx * k, hw - 0.4), bz + lim(a1[1] - bz + lsz * k, bd / 2 - 0.4)];
        const up = (a1[1] - a0[1]) * (b0[0] - a0[0]) - (a1[0] - a0[0]) * (b0[1] - a0[1]) > 0, ys = ry + 0.027;
        if (up) Q(G, P(a0[0], ys, a0[1]), P(a1[0], ys, a1[1]), P(b1[0], ys, b1[1]), P(b0[0], ys, b0[1]), 0, 0, 0.25, 0.25, 0.85);
        else Q(G, P(a1[0], ys, a1[1]), P(a0[0], ys, a0[1]), P(b0[0], ys, b0[1]), P(b1[0], ys, b1[1]), 0, 0, 0.25, 0.25, 0.85);
      }
      // a carpet airing on a rail, a firewood stack under snow
      if (w > 7) {
        const rw = ur.range(1.8, 2.6), rx = ur.range(-hw + 1.4 + rw / 2, hw - 1.4 - rw / 2), rz = bz + ur.range(-0.25, 0.25) * bd, sg = ur();
        G.set(7, 0); for (const e of [-1, 1]) BX(G, ...P(rx + e * rw / 2, ry + 0.7, rz), 0.14, 1.4, 0.14, yaw, 1, 0.75, 1);
        BX(G, ...P(rx, ry + 1.4, rz), rw + 0.3, 0.1, 0.1, yaw, 3);
        G.set(11, ur.chance(0.5) ? 1 : 0);
        for (let k = 0; k < 2; k++) Q(G, P(rx - rw / 2 + 0.15, ry + 1.4 - 0.55 * (k + 1), rz + 0.06), P(rx + rw / 2 - 0.15, ry + 1.4 - 0.55 * (k + 1), rz + 0.06), P(rx + rw / 2 - 0.15, ry + 1.4 - 0.55 * k, rz + 0.06), P(rx - rw / 2 + 0.15, ry + 1.4 - 0.55 * k, rz + 0.06), 0, 0.55 * (1 - k), 0.9, 1, sg, 0.5 * (k + 1), 0.5 * k);
      }
      { const p = P(ur.pick([-1, 1]) * (hw - 1.1), ry + 0.3, bz + ur.range(-0.25, 0.25) * bd); G.set(7, 0); BX(G, p[0], p[1], p[2], 0.6, 0.6, ur.range(1.4, 2.4), yaw, 3, 0.6, 1); }
    }
  }
  // vine trellis over the court, or a tree in it
  const cz = (z1 + zf) / 2, clear = zf - z1;
  if (clear > 3.6 && !L.wing && rng.chance(0.28)) {
    const ty = 2.75, tw = w - 2 * t - 0.6, td = clear - t - 0.6, bw = tier === 0 ? 0.09 : 0.14, nx = tier === 0 ? 5 : 3, nz = tier === 0 ? 4 : 2; G.set(9, 1);
    for (let i = 0; i <= nx; i++) { const xx = -tw / 2 + tw * i / nx; Q(G, P(xx - bw, ty, cz + td / 2), P(xx + bw, ty, cz + td / 2), P(xx + bw, ty, cz - td / 2), P(xx - bw, ty, cz - td / 2), 0, 0, 1, 1, 0, 0); }
    for (let i = 0; i <= nz; i++) { const zz = cz - td / 2 + td * i / nz; Q(G, P(-tw / 2, ty + 0.02, zz + bw), P(tw / 2, ty + 0.02, zz + bw), P(tw / 2, ty + 0.02, zz - bw), P(-tw / 2, ty + 0.02, zz - bw), 0, 0, 1, 1, 0, 0); }
    for (const [ex, ez] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) BX(G, ...P(ex * tw / 2, ty / 2, cz + ez * td / 2), 0.2, ty, 0.2, yaw, 1, 0.7, 1, 0, 0);
  } else if (clear > 3.4 && rng.chance(0.55)) out.trees.push([...P(L.wing ? -Math.sign(L.wing) * rng.range(1.2, hw - 2.4) : rng.range(-hw + 2.4, hw - 2.4), 0, cz + rng.range(-0.3, 0.3)), L.pd, tier]);
}

// ---------------------------------------------------------------- madrasa architecture (hero tile patterns)
const lathe = (G, pts, o = {}) => { for (let i = 0; i < pts.length - 1; i++) G.ring(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); };
// leaning minaret, 40 m: octagonal foot, spiral-banded shaft, ochre collars, scalloped balcony, ribbed cap with snow
function minaret(G, base, x, z, rng, Hs = 1, lod = 0) {
  const n20 = lod ? 12 : 20;
  const dir = rng.range(0, TAU), deg = rng.range(2, 3) * Math.PI / 180;
  G.m = base.clone().multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.sin(dir), 0, -Math.cos(dir)), deg).setPosition(x, 0, z));
  const Y = (y) => y * Hs, tint = (g, b) => (ph, t, q) => { q.g = g; q.b = b; };
  G.uvS = 1;
  G.set(0, 0); G.ring(3.0, 0, 2.9, Y(5), { nu: 8, nv: 1, ao: (t) => 0.72 + 0.28 * t }); G.ring(2.9, Y(5), 2.5, Y(5), { nu: 8 });
  G.set(5, 0); lathe(G, [[2.5, Y(5)], [2.62, Y(5.4)], [2.4, Y(5.8)]], { nu: n20 });
  G.set(4, 0); G.ring(2.4, Y(5.8), 1.85, Y(31), { nu: n20, nv: lod ? 2 : 4, girth: 14.4513, v0: rng.range(0, 6), vLen: Y(25.2) });
  G.set(5, 0); for (const yc of [17, 30.4]) { const r = 2.4 - 0.55 * (yc - 5.8) / 25.2 + 0.1; lathe(G, [[r - 0.1, Y(yc - 0.4)], [r, Y(yc - 0.3)], [r, Y(yc + 0.3)], [r - 0.1, Y(yc + 0.4)]], { nu: n20 }); }
  G.set(8, 0); G.ring(1.85, Y(31), 3.0, Y(33.2), { nu: lod ? 24 : 48, nv: lod ? 2 : 3, rf: (ph, t) => 0.18 * Math.abs(Math.sin(ph * 8)) * t, cf: (ph, t, q) => { q.g = (Math.floor(ph * 16 / TAU) + Math.floor(t * 2.99)) % 2 ? 0.9 : 0.06; q.b = 0.6; }, ao: (t) => 0.6 + 0.4 * t });
  G.set(5, 0); lathe(G, [[3.15, Y(33.2)], [3.2, Y(33.5)], [1.5, Y(33.5)]], { nu: n20 });
  G.set(6, 0); G.ring(3.05, Y(33.5), 3.05, Y(34.3), { nu: n20, girth: 19, vLen: 0.84 });
  G.set(1, 1); G.ring(1.5, Y(33.5), 1.42, Y(36.6), { nu: lod ? 10 : 16, girth: 9.6, vLen: 3.1 });
  G.set(5, 0); lathe(G, [[1.75, Y(36.6)], [1.8, Y(36.9)], [1.4, Y(36.9)]], { nu: lod ? 10 : 16 });
  G.set(8, 0);
  G.grid(lod ? 16 : 32, lod ? 4 : 5, (s, t, q) => {
    const ph = s * TAU, tt = Math.max(0, (t - 0.25) / 0.75), r0 = t < 0.25 ? 1.4 + 0.3 * Math.sin(t / 0.25 * Math.PI / 2) : 1.7 * Math.pow(Math.max(0, 1 - Math.pow(tt, 1.9)), 0.62);
    const r = r0 * (1 + 0.07 * Math.abs(Math.cos(ph * 4))) + 0.06;
    q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = Y(36.9) + 2.9 * t; q.u = s * 10; q.v = t * 3; q.g = 0.04; q.b = 0.6 + 0.25 * Math.abs(Math.cos(ph * 4));
  }, true, false);
  G.set(13, 0); G.ring(1.25, Y(36.9) + 2.0, 0.1, Y(36.9) + 3.0, { nu: 12 }); G.ring(3.1, Y(33.52), 1.5, Y(33.75), { nu: n20 });
  G.set(5, 1); lathe(G, [[0.14, Y(36.9) + 2.9], [0.3, Y(36.9) + 3.3], [0.1, Y(36.9) + 3.7], [0.02, Y(36.9) + 4.8]], { nu: 6 });
  const top = new THREE.Vector3(0, Y(36.9) + 4.8, 0).applyMatrix4(G.m), foot = new THREE.Vector3(0, Y(20), 0).applyMatrix4(G.m);
  G.m = base;
  return { top, x: foot.x, z: foot.z };
}
// lesser dome: tiled drum with an interlace band and a 24-rib turquoise dome whose grooves hold snow (pattern 15)
function lesserDome(G, x, z, y0, R, rng, lod = 0) {
  const n40 = lod ? 20 : 40;
  const m0 = G.m; G.m = m0.clone().multiply(new THREE.Matrix4().makeTranslation(x, 0, z));
  const rd = R * 0.84, yd = y0 + R * 0.68, NR = 24, H = R * 1.82, uo = rng.range(0, 20);
  G.uvS = 1;
  G.set(0, 0); G.ring(rd + 1.2, y0 - 0.3, rd + 1.2, y0 + 0.6, { nu: 8 }); G.ring(rd + 1.2, y0 + 0.6, rd, y0 + 0.6, { nu: 8 });
  G.set(1, 0); G.ring(rd, y0 + 0.6, rd, yd - 3, { nu: n40, girth: 52.8, v0: uo, ao: (t) => 0.8 + 0.2 * t });
  G.set(5, 0); lathe(G, [[rd, yd - 3], [rd + 0.12, yd - 2.9], [rd + 0.12, yd - 2.7], [rd, yd - 2.6]], { nu: n40 });
  G.set(2, 0); G.ring(rd, yd - 2.6, rd, yd - 0.6, { nu: n40, girth: 48, v0: 0, vLen: 4 });
  G.set(5, 0); lathe(G, [[rd, yd - 0.6], [rd + 0.9, yd], [rd + 0.95, yd + 0.3], [rd - 0.4, yd + 0.3]], { nu: n40 });
  G.set(13, 0); G.ring(rd + 1.0, yd + 0.28, rd - 0.2, yd + 0.62, { nu: n40 });
  G.set(15, 0);
  G.grid(NR * (lod ? 3 : 4), lod ? 8 : 12, (s, t, q) => {
    const y = t * H, yb = H * 0.33;
    let r = y >= yb ? R * Math.pow(Math.max(0, 1 - Math.pow((y - yb) / (H - yb), 1.9)), 0.62) : R - R * 0.12 * Math.pow((yb - y) / yb, 2);
    const amp = 0.05 * Math.min(1, r / (R * 0.5)); r = Math.max(0.05, r * (1 + amp * Math.cos((s * NR - 0.5) * TAU)));
    const ph = s * TAU; q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = yd + 0.3 + y; q.u = s * NR; q.v = t * H * 1.25 + uo; q.ao = 0.75 + 0.25 * Math.min(1, t * 5);
  }, true, false);
  G.set(5, 1); lathe(G, [[0.5, yd + H], [0.2, yd + H + 0.6], [0.55, yd + H + 1.2], [0.2, yd + H + 1.8], [0.03, yd + H + 3.6]], { nu: 8 });
  const c = new THREE.Vector3(0, 0, 0).applyMatrix4(G.m); G.m = m0;
  return { x: c.x, z: c.z, r: R * 0.95, h: yd + H * 0.8, crown: yd + H };
}
// a row of two-storey pointed-arch cells along local x from x0 to x1 on the wall whose frame is `wall`
function cells(G, wall, x0, x1, storeys, rng, o = {}) {
  const sh = o.sh ?? 8.5, n = Math.max(1, Math.round((x1 - x0) / (o.bay ?? 8.6))), bw = (x1 - x0) / n, T = new THREE.Matrix4();
  for (let i = 0; i < n; i++) for (let st = 0; st < storeys; st++) {
    G.m = wall.clone().multiply(T.makeTranslation(x0 + (i + 0.5) * bw, 0, 0));
    const win = rng.chance(0.6); rng.chance(0.45);
    archWall(G, Math.PI / 2, 0, bw, sh, { y0: st * sh, aw: bw * 0.56, spring: sh * 0.4, depth: o.depth ?? (st ? 1.6 : 1.3), frame: 0.45, framePat: 0, frameLine: 0.12, starS: 1.25, wallPat: 1, wallAux: (i + st) % 2 && !o.plain ? 1 : 0, u0: i * 2.4 + st * 1.2,
      backPat: 3, backShade: 1, revealPat: 0, revealAux: 0, revealAo: 0.72, doorPat: win ? 12 : 6, doorAux: win ? 2 : 0, doorG: rng.range(0.2, 1.4), doorB: rng(), doorW: bw * 0.13, doorH: sh * 0.3 });
  }
  // ochre string course between storeys and under the roof
  G.m = wall; G.set(5, 0);
  for (let st = 1; st <= storeys; st++) Q(G, [x0, st * sh - 0.42, 0.14], [x1, st * sh - 0.42, 0.14], [x1, st * sh - 0.05, 0.14], [x0, st * sh - 0.05, 0.14]);
}
// a perched rook at (x, y, z) facing yaw: plain black wool (pattern 16, color.g = 1), a pale bill, a wedge tail
function rook(G, x, y, z, yaw, k) {
  const m0 = G.m, B = (m0 ? m0.clone() : new THREE.Matrix4()).multiply(new THREE.Matrix4().makeRotationY(yaw).scale(new THREE.Vector3(k, k, k)).setPosition(x, y, z));
  const cf = (ph, t, q) => { q.g = 1; q.b = 0.3; };
  G.set(16, 0);
  G.m = B.clone().multiply(new THREE.Matrix4().makeRotationX(1.05).setPosition(0, 0.12, -0.16));
  lathe(G, [[0.015, 0], [0.085, 0.1], [0.115, 0.24], [0.085, 0.36], [0.03, 0.42]], { nu: 5, cf });
  G.m = B.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.3, 0.17));
  lathe(G, [[0.03, -0.03], [0.07, 0.03], [0.062, 0.09], [0.015, 0.13]], { nu: 5, cf });
  G.m = B;
  Q(G, [-0.02, 0.37, 0.22], [0.02, 0.37, 0.22], [0.005, 0.345, 0.35], [-0.005, 0.345, 0.35], 0, 0, 1, 1, 0.95, 0.9);
  Q(G, [-0.05, 0.2, -0.12], [0.05, 0.2, -0.12], [0.075, 0.1, -0.38], [-0.075, 0.1, -0.38], 0, 0, 1, 1, 1, 0.3);
  G.m = m0;
}
// the roof of the west madrasa's low rear range, which the descent crosses 7 m up: a snow-capped mud cell vault over
// every bay, a parapet lip with an ochre cap along the back and a lower one on the court side, drifts banked against
// them and rooks perched along the lip. Sun shadows of the vaults and the lip are baked as flat quads (ao 0.25).
function rearRoof(G, base, HW, CX, D, zr, h, xr, sh) {
  const nb = Math.round(2 * HW / 6.2), bw = 2 * HW / nb, zc = (zr - D) / 2, T = new THREE.Matrix4(), R = 2.4, ys = h + 0.37;
  const e = base.elements, lsx = e[0] * sh[0] + e[2] * sh[1], lsz = e[8] * sh[0] + e[10] * sh[1], sl = Math.hypot(lsx, lsz) || 1, a0 = Math.atan2(lsz, lsx);      // shadow vector per metre of height, in the madrasa's frame
  for (let i = 0; i < nb; i++) {
    const cx = -HW + (i + 0.5) * bw, k = Math.abs(cx) < 5 ? 0.7 : xr.range(0.9, 1.12), H = 1.0 * k, g = xr();
    const cf = (ph, t, q) => { q.g = g; };
    G.m = base.clone().multiply(T.makeTranslation(cx, h, zc)); G.set(10, 0);
    G.ring(R + 0.12, 0, R, 0.28, { nu: 12, cf, ao: (t) => 0.7 + 0.3 * t }); G.ring(R, 0.28, R * 0.86, 0.28 + H * 0.5, { nu: 12, cf });
    G.set(13, 0); G.ring(R * 0.9, 0.26 + H * 0.46, R * 0.52, 0.28 + H * 0.88, { nu: 12 }); G.ring(R * 0.52, 0.28 + H * 0.88, 0.02, 0.28 + H * 1.04, { nu: 12 });
    // lee drift curled round the vault's foot
    const da = xr.range(-0.5, 0.5) - 0.9;
    G.grid(5, 1, (a, t, q) => { const an = da + (a - 0.5) * 1.9, r = R + 0.1 + t * (0.9 + 0.7 * Math.sin(a * Math.PI)); q.x = Math.cos(an) * r; q.z = Math.sin(an) * r; q.y = 0.3 + (1 - t) * 0.45 * Math.sin(a * Math.PI); q.u = q.x; q.v = q.z; }, false, true);
    // baked shadow: the far half of the vault's foot pushed out along the sun's line
    G.m = base; const L = (0.28 + H) * sl;
    for (let j = 0; j < 8; j++) {
      const a = a0 - Math.PI / 2 + j * Math.PI / 8, b = a + Math.PI / 8, la = L * Math.max(0, Math.cos(a - a0)) ** 0.6, lb = L * Math.max(0, Math.cos(b - a0)) ** 0.6, ca = Math.cos(a0), sa = Math.sin(a0);
      const pa = [cx + Math.cos(a) * R * 0.98, zc + Math.sin(a) * R * 0.98], pb = [cx + Math.cos(b) * R * 0.98, zc + Math.sin(b) * R * 0.98];
      Q(G, [pa[0], ys, pa[1]], [pb[0], ys, pb[1]], [pb[0] + ca * lb, ys, Math.min(zr - 0.6, pb[1] + sa * lb)], [pa[0] + ca * la, ys, Math.min(zr - 0.6, pa[1] + sa * la)], 0, 0, 0.25, 0.25, 1);
    }
  }
  // parapet lip with an ochre cap along the back (0.6 m), a low lip on the court side, and their shadows
  G.m = base; G.set(0, 0); BX(G, 0, h + 0.3, -D + 0.28, 2 * HW, 0.6, 0.56, 0, 1, 0.8, 1);
  G.set(5, 0); BX(G, 0, h + 0.7, -D + 0.28, 2 * HW + 0.2, 0.2, 0.8, 0, 3);
  G.set(0, 0); BX(G, 0, h + 0.2, zr - 0.25, 2 * CX, 0.4, 0.5, 0, 3, 0.8, 1);
  G.set(13, 0);
  if (lsz > 0.05) Q(G, [-HW + 0.5, ys, -D + 0.6 + 0.8 * lsz], [HW - 0.5, ys, -D + 0.6 + 0.8 * lsz], [HW - 0.5, ys, -D + 0.56], [-HW + 0.5, ys, -D + 0.56], 0, 0, 0.25, 0.25, 1);
  // drifts banked against the lip, and wind ripples across the open roof
  for (let i = 0; i < 5; i++) {
    const x0 = -HW + 3 + (i + xr()) * (2 * HW - 12) / 5, len = xr.range(5, 9), run = xr.range(1.3, 2.2), hh = xr.range(0.35, 0.55);
    G.grid(6, 1, (a, t, q) => { const b = Math.sin(a * Math.PI) ** 0.6; q.x = x0 + a * len; q.z = -D + 0.56 + t * (0.25 + run * b); q.y = h + 0.3 + (1 - t) * hh * b; q.u = q.x; q.v = q.z; }, false, false);
  }
  // rooks along the lip, in twos and threes, thickest where the flight crosses, most looking out over the lane;
  // a few more on the vaults either side of the flight line
  const perch = (rx) => rook(G, rx, h + 0.8, -D + 0.28 + xr.range(-0.12, 0.12), (xr.chance(0.7) ? Math.PI : 0) + xr.range(-0.8, 0.8), xr.range(1.25, 1.6));
  for (let rx = -15 + xr.range(0, 1.5); rx < 15;) { perch(rx); rx += xr.chance(0.55) ? xr.range(0.6, 1.2) : xr.range(2.5, 5.5); }
  for (const sx of [-1, 1]) for (let rx = 17 + xr.range(0, 4); rx < HW - 2;) { perch(sx * rx); rx += xr.chance(0.5) ? xr.range(0.7, 1.4) : xr.range(5, 10); }
  for (let i = 0; i < nb; i++) { const cx = -HW + (i + 0.5) * bw; if (Math.abs(cx) < 22 && Math.abs(cx) > 5 && xr.chance(0.6)) rook(G, cx + xr.range(-0.3, 0.3), h + 0.28 + 1.0, zc + xr.range(-0.3, 0.3), xr.range(0, TAU), xr.range(1.25, 1.6)); }
  G.m = base;
}
// lining of the flown-through gateway passage, in the frame of its archWall (x across, y up, z from 0 at the face to
// -dp): a buff brick dado under an ochre course, tall star panels in thin ochre frames between engaged glazed ribs, a
// banna'i band at the springing and a star-tiled vault, all at the scale of tile seen from 8 m (stars about 1 m)
function passageLining(G, hw, sp, dp) {
  const N = 14, K = N + 4, ribs = [], RW = 0.26, RH = 0.3;
  for (let z = -1.0; z > -dp + 0.5; z -= 3.5) ribs.push(z);
  const out = (a) => { const k = a * K; if (k <= 2) return [-hw, sp * k / 2]; if (k >= N + 2) return [hw, sp * (K - k) / 2]; const x = -hw + (k - 2) / N * 2 * hw; return [x, sp + archH(x, hw)]; };
  const ao = (z) => 0.95 - 0.3 * Math.min(1, Math.min(-z, dp + z) / 5);      // open at both ends: darkest in the middle, never under two thirds
  const arc = [0]; for (let k = 1; k <= K; k++) { const e0 = out((k - 1) / K), e1 = out(k / K); arc.push(arc[k - 1] + Math.hypot(e1[0] - e0[0], e1[1] - e0[1])); }
  const cuts = [0, ...ribs, -dp];
  for (const sx of [-1, 1]) {
    // a panel on the jamb from z0 (nearer the face) to z1, standing `off` proud of it
    const J = (z0, z1, y0, y1, off, k0 = 1) => {
      const x = sx * (hw - off), a = ao((z0 + z1) / 2);
      if (sx < 0) Q(G, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], -z0, y0, a * k0, a);
      else Q(G, [x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], -z1, y0, a * k0, a);
    };
    for (let i = 0; i < cuts.length - 1; i++) {
      const z0 = cuts[i], z1 = cuts[i + 1];
      G.uvS = 1; G.set(0, 0); J(z0, z1, 0, 2.2, 0, 0.78); J(z0, z1, 2.5, 13.1, 0);
      G.set(5, 0); J(z0, z1, 2.2, 2.5, 0.06); J(z0, z1, 13.0, 13.14, 0.05);
      G.set(1, 1); J(z0, z1, 13.14, sp, 0.02);
      if (z0 - z1 < 2) continue;
      G.set(5, 0); J(z0 - 0.48, z1 + 0.48, 3.0, 12.6, 0.04);
      G.uvS = 1.6; G.set(3, 0); J(z0 - 0.6, z1 + 0.6, 3.12, 12.48, 0.08);
    }
  }
  // the vault: star lattice, metres along the curve by metres into the passage
  G.uvS = 1.6; G.set(3, 0);
  G.grid(N, 6, (a, t, q) => { const k = 2 + a * N, e = out(k / K), z = -dp * t; q.x = e[0]; q.y = e[1]; q.z = z; q.u = arc[Math.round(k)]; q.v = dp * t; q.ao = ao(z); }, false, false);
  // engaged ribs up each jamb and over the vault: a turquoise face between cobalt cheeks
  G.uvS = 1; G.set(8, 0);
  const nrm = (a) => { const e0 = out(Math.max(0, a - 0.5 / K)), e1 = out(Math.min(1, a + 0.5 / K)), tx = e1[0] - e0[0], ty = e1[1] - e0[1], l = Math.hypot(tx, ty) || 1; return [ty / l, -tx / l]; };
  for (const zc of ribs) {
    const A = ao(zc);
    const strip = (za, ha, zb, hb, g, b) => G.grid(K, 1, (a, t, q) => { const e = out(a), n = nrm(a), h = t ? hb : ha; q.x = e[0] + n[0] * h; q.y = e[1] + n[1] * h; q.z = t ? zb : za; q.u = arc[Math.round(a * K)]; q.v = t; q.ao = A * (h > 0 ? 1 : 0.8); q.g = g; q.b = b; }, false, false);
    strip(zc + RW, 0, zc + RW * 0.62, RH, 0.92, 0.35); strip(zc + RW * 0.62, RH, zc - RW * 0.62, RH, 0.06, 0.62); strip(zc - RW * 0.62, RH, zc - RW, 0, 0.92, 0.35);
  }
  G.uvS = 1;
}
// one madrasa. o: { at: [x, z], rot (multiple of 90 deg), WT, D, mode: 'through' | 'portal' | 'niche', rearH, domes, rng }
// local frame: facade on z = 0 facing +Z, building behind it. Returns shadow casters and landmarks in world space.
// o.pause (ctx.yield) hands the page back between its parts.
async function madrasa(G, o) {
  const rng = o.rng, base = new THREE.Matrix4().makeRotationY(o.rot).setPosition(o.at[0], 0, o.at[1]);
  const WT = o.WT, D = o.D, HW = WT / 2, PW = 36, PH = 44, WH = 17, RD = 14, CX = HW - RD, T = new THREE.Matrix4();
  const res = { boxes: [], cyls: [], tops: [], domes: [], base };
  const frame = (ang, tx, tz) => base.clone().multiply(T.makeRotationY(ang).setPosition(tx, 0, tz));     // wall frame: its +Z faces outward
  const box = (x0, x1, z0, z1, h, inset = 1.5) => {
    const a = new THREE.Vector3(x0 + inset, 0, z0 + inset).applyMatrix4(base), b = new THREE.Vector3(x1 - inset, 0, z1 - inset).applyMatrix4(base);
    res.boxes.push([Math.min(a.x, b.x), -1, Math.min(a.z, b.z), Math.max(a.x, b.x), h, Math.max(a.z, b.z)]);
  };
  // ---- gateway slab (pishtaq), patterns at twice the scale
  const nd = o.mode === 'through' ? 16 : o.mode === 'portal' ? 12 : 8, pz = -14;
  G.m = frame(0, 0, 2); G.uvS = 0.5;
  archWall(G, Math.PI / 2, 0, PW, PH - 8, { aw: 16, spring: 14, depth: nd, frame: 1.6, wallPat: 1, wallAux: 0, revealPat: 3, backPat: 3, doorPat: 3, doorW: 0.4, doorH: 0.4, open: o.mode === 'through', noSill: true, u0: rng.range(0, 9), starS: 0.9, jamb: [1, 1, 1], reveal: o.mode !== 'through' });
  if (o.mode === 'through') passageLining(G, 8, 14, nd);
  G.uvS = 1;
  const head = () => {
    G.uvS = 1.1; G.set(3, 0); Q(G, [-PW / 2 + 1.2, PH - 7.6, 0.04], [PW / 2 - 1.2, PH - 7.6, 0.04], [PW / 2 - 1.2, PH - 1.8, 0.04], [-PW / 2 + 1.2, PH - 1.8, 0.04], rng.range(0, 4), 0);
    G.uvS = 0.5; G.set(1, 0); Q(G, [-PW / 2, PH - 8, 0], [PW / 2, PH - 8, 0], [PW / 2, PH, 0], [-PW / 2, PH, 0], 0, (PH - 8) * 0.5); G.uvS = 1;
    G.set(5, 0); for (const y of [PH - 8, PH - 1.6]) Q(G, [-PW / 2, y, 0.1], [PW / 2, y, 0.1], [PW / 2, y + 0.5, 0.1], [-PW / 2, y + 0.5, 0.1]);
  };
  head();
  const panels = () => {     // star panels in ochre borders on the piers, a chevron band over the arch frame
    G.uvS = 1.1;
    for (const sx of [-1, 1]) {
      const xa = sx * 11.6, xb = sx * 16.2, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
      G.set(5, 0); Q(G, [x0 - 0.22, 3.78, 0.06], [x1 + 0.22, 3.78, 0.06], [x1 + 0.22, 25.22, 0.06], [x0 - 0.22, 25.22, 0.06]);
      G.set(3, 0); Q(G, [x0, 4, 0.12], [x1, 4, 0.12], [x1, 25, 0.12], [x0, 25, 0.12], rng.range(0, 5), 0, 0.85, 1);
    }
    G.set(5, 0); Q(G, [-16.6, 28.2, 0.06], [16.6, 28.2, 0.06], [16.6, 34.6, 0.06], [-16.6, 34.6, 0.06]);
    G.uvS = 0.5; G.set(1, 1); Q(G, [-16.2, 28.6, 0.12], [16.2, 28.6, 0.12], [16.2, 34.2, 0.12], [-16.2, 34.2, 0.12], rng.range(0, 5), 0);
  };
  panels();
  G.uvS = 0.5; G.set(1, 0);
  Q(G, [PW / 2, 0, 0], [PW / 2, 0, pz - 2], [PW / 2, PH, pz - 2], [PW / 2, PH, 0], 0, 0, 0.75, 1);
  Q(G, [-PW / 2, 0, pz - 2], [-PW / 2, 0, 0], [-PW / 2, PH, 0], [-PW / 2, PH, pz - 2], 0, 0, 0.75, 1);
  G.uvS = 1; G.set(0, 0); Q(G, [-PW / 2, PH, 0], [PW / 2, PH, 0], [PW / 2, PH, pz - 2], [-PW / 2, PH, pz - 2]);
  G.uvS = 1;
  for (const sx of [-1, 1]) {     // engaged corner shafts
    G.m = frame(0, sx * PW / 2, 2);
    G.set(4, 0); G.ring(1.5, 0, 1.3, PH + 1, { nu: 12, nv: 3, girth: 14.4513, vLen: PH });
    G.set(5, 0); lathe(G, [[1.4, PH + 1], [1.7, PH + 1.6], [1.7, PH + 2], [1.1, PH + 2]], { nu: 12 });
    G.set(8, 0); lathe(G, [[1.1, PH + 2], [1.4, PH + 3], [1.1, PH + 4.2], [0.15, PH + 5]], { nu: 12, cf: (ph, t, q) => { q.g = 0.04; q.b = 0.6; } });
    G.set(13, 0); G.ring(0.95, PH + 4.3, 0.05, PH + 5.1, { nu: 8 });
  }
  if (o.mode === 'through') { G.m = frame(Math.PI, 0, pz); G.uvS = 0.9; archWall(G, Math.PI / 2, 0, PW, PH - 8, { aw: 16, spring: 14, depth: 0.3, frame: 1.6, wallPat: 1, wallAux: 0, open: true, noSill: true, starS: 1.1, jamb: [1, 1, 1], revealPat: 0, revealAux: 0 }); head(); panels(); G.uvS = 1; }
  else { G.m = frame(0, 0, 2); G.uvS = 0.5; G.set(1, 0); Q(G, [PW / 2, 0, pz - 2], [-PW / 2, 0, pz - 2], [-PW / 2, PH, pz - 2], [PW / 2, PH, pz - 2], 0, 0, 0.75, 1); G.uvS = 1; }
  box(-PW / 2, PW / 2, pz, 2, PH);
  await o.pause();
  // ---- front wings with two storeys of cells, corner minarets, lesser domes behind the wings
  const front = frame(0, 0, 0);
  for (const sx of [-1, 1]) cells(G, front, sx > 0 ? PW / 2 : -HW, sx > 0 ? HW : -PW / 2, 2, rng);
  G.m = base; G.set(0, 0);
  const roof = (x0, x1, z0, z1, h) => { Q(G, [x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], x0, z0); G.set(13, 0); Q(G, [x0 + 0.5, h + 0.22, z1 - 0.5], [x1 - 0.5, h + 0.22, z1 - 0.5], [x1 - 0.5, h + 0.3, z0 + 0.5], [x0 + 0.5, h + 0.3, z0 + 0.5]); G.set(0, 0); };
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? PW / 2 : -HW, x1 = sx > 0 ? HW : -PW / 2; roof(x0, x1, -RD, 0, WH); box(x0, x1, -RD, 0, WH);
    if (o.deep) { G.set(17, 0); Q(G, [x0 + 1.6, WH - 1.5, 0.3], [x1 - 2.4, WH - 1.5, 0.3], [x1 - 2.4, WH - 0.45, 0.3], [x0 + 1.6, WH - 0.45, 0.3], 0, 0, 1, 1, 0, 1.05); G.set(0, 0); }
  }
  for (const sx of [-1, 1]) { const m = minaret(G, base, sx * (HW + 0.6), 0.6, rng, rng.range(0.96, 1.03)); res.cyls.push([m.x, m.z, 2.3, m.top.y - 4]); res.tops.push(m.top); await o.pause(); }
  const nDome = o.domes ?? 2;
  for (let i = 0; i < nDome; i++) { const sx = i === 0 ? (o.domeSide ?? -1) : -(o.domeSide ?? -1); G.m = base; const dm = lesserDome(G, sx * (PW / 2 + (HW - PW / 2) * 0.5), -RD / 2, WH, 9.5, rng); res.cyls.push([dm.x, dm.z, dm.r, dm.h]); res.domes.push(dm); await o.pause(); }
  // ---- ranges round the courtyard
  const rearH = o.rearH ?? WH, zr = -(D - RD);
  G.m = base; G.set(0, 0);
  if (o.arcades) {
    const La = rearH < WH ? D - RD : D;
    cells(G, frame(Math.PI / 2, HW, -La / 2), -La / 2, La / 2, 2, rng, { depth: 0.7 }); cells(G, frame(-Math.PI / 2, -HW, -La / 2), -La / 2, La / 2, 2, rng, { depth: 0.7 }); G.m = base; G.set(0, 0);
    if (La < D) { Q(G, [HW, 0, -La], [HW, 0, -D], [HW, rearH, -D], [HW, rearH, -La], 0, 0, 0.75, 1); Q(G, [-HW, 0, -D], [-HW, 0, -La], [-HW, rearH, -La], [-HW, rearH, -D], 0, 0, 0.75, 1); }
  }
  else { Q(G, [HW, 0, 0], [HW, 0, -D], [HW, WH, -D], [HW, WH, 0], 0, 0, 0.75, 1); Q(G, [-HW, 0, -D], [-HW, 0, 0], [-HW, WH, 0], [-HW, WH, -D], 0, 0, 0.75, 1); }
  if (o.mode === 'through') cells(G, frame(Math.PI, 0, -D), -HW, HW, 1, rng, { sh: rearH, depth: 0.7, bay: 6.2 });
  else Q(G, [HW, 0, -D], [-HW, 0, -D], [-HW, rearH, -D], [HW, rearH, -D], 0, 0, 0.75, 1);
  G.m = base;
  G.set(5, 0);
  for (const sx of [-1, 1]) Q(G, [sx * (HW + 0.1), WH - 0.6, sx > 0 ? 0 : -D], [sx * (HW + 0.1), WH - 0.6, sx > 0 ? -D : 0], [sx * (HW + 0.1), WH - 0.1, sx > 0 ? -D : 0], [sx * (HW + 0.1), WH - 0.1, sx > 0 ? 0 : -D]);
  G.set(0, 0);
  for (const sx of [-1, 1]) { const x0 = sx > 0 ? CX : -HW, x1 = sx > 0 ? HW : -CX; roof(x0, x1, zr, -RD, WH); box(x0, x1, zr, -RD, WH); }
  roof(-HW, HW, -D, zr, rearH); box(-HW, HW, -D, zr, rearH);
  await o.pause();
  if (o.mode === 'through' && rearH < WH && o.xr) { rearRoof(G, base, HW, CX, D, zr, rearH, o.xr, o.shadow || [1.3, -1.7]); await o.pause(); }
  G.m = base; G.set(0, 0);
  if (rearH < WH) for (const sx of [-1, 1]) {
    const xa = sx > 0 ? HW : -CX, xb = sx > 0 ? CX : -HW;
    G.set(5, 0); Q(G, [xa, rearH, zr], [xb, rearH, zr], [xb, WH, zr], [xa, WH, zr], 0, rearH);
    G.uvS = 1.1; G.set(3, 0); Q(G, [xa - 0.6, rearH + 0.6, zr - 0.06], [xb + 0.6, rearH + 0.6, zr - 0.06], [xb + 0.6, WH - 0.6, zr - 0.06], [xa - 0.6, WH - 0.6, zr - 0.06], rng.range(0, 4), 0); G.uvS = 1;
  }
  if (o.mode === 'through') {
    cells(G, frame(Math.PI, 0, -RD), -CX, -PW / 2, 2, rng); cells(G, frame(Math.PI, 0, -RD), PW / 2, CX, 2, rng);
    await o.pause();
    cells(G, frame(Math.PI / 2, -CX, (zr - RD) / 2), zr / 2 + RD / 2, -(zr / 2 + RD / 2), 2, rng); cells(G, frame(-Math.PI / 2, CX, (zr - RD) / 2), zr / 2 + RD / 2, -(zr / 2 + RD / 2), 2, rng);
    await o.pause();
    cells(G, frame(0, 0, zr), -CX, CX, rearH > 9 ? 2 : 1, rng, rearH > 9 ? {} : { sh: rearH, bay: 6.2 });
  } else {
    G.m = base; G.set(0, 0);
    Q(G, [CX, 0, -RD], [-CX, 0, -RD], [-CX, WH, -RD], [CX, WH, -RD], 0, 0, 0.6, 1); Q(G, [-CX, 0, zr], [CX, 0, zr], [CX, WH, zr], [-CX, WH, zr], 0, 0, 0.6, 1);
    Q(G, [-CX, 0, -RD], [-CX, 0, zr], [-CX, WH, zr], [-CX, WH, -RD], 0, 0, 0.6, 1); Q(G, [CX, 0, zr], [CX, 0, -RD], [CX, WH, -RD], [CX, WH, zr], 0, 0, 0.6, 1);
  }
  G.m = null; G.uvS = 1;
  return res;
}
// tea stall: posts, a striped ochre awning that flaps, counter, samovar, stools and crates
function teaStall(G, x, z, yaw, rng) {
  const c = Math.cos(yaw), s = Math.sin(yaw), P = (lx, y, lz) => [x + lx * c + lz * s, y, z - lx * s + lz * c];
  G.set(7, 0);
  for (const [px, pz, ph] of [[-2.2, -1.4, 2.6], [2.2, -1.4, 2.6], [-2.2, 1.6, 3.2], [2.2, 1.6, 3.2]]) BX(G, ...P(px, ph / 2, pz), 0.14, ph, 0.14, yaw, 1, 0.7, 1);
  BX(G, ...P(0, 0.5, 0.9), 3.6, 1.0, 0.8, yaw, 3, 0.6, 1); BX(G, ...P(-1.6, 0.35, -0.6), 0.9, 0.7, 0.9, yaw, 3, 0.6, 1);
  for (let i = 0; i < 3; i++) BX(G, ...P(rng.range(-2, 2), 0.22, rng.range(2.4, 3.6)), 0.45, 0.45, 0.45, yaw + rng(), 3, 0.6, 1);
  G.set(14, 0);
  for (let i = 0; i < 4; i++) { const z0 = -1.6 + i * 0.95, z1 = z0 + 0.95, y0 = 2.62 + i * 0.16, y1 = y0 + 0.16, w0 = i / 4, w1 = (i + 1) / 4; Q(G, P(-2.5, y1, z1), P(2.5, y1, z1), P(2.5, y0, z0), P(-2.5, y0, z0), 0, z0, 1, 1, 0, Math.sin(w1 * Math.PI) * 0.6, Math.sin(w0 * Math.PI) * 0.6); }
  Q(G, P(-2.5, 2.75, 2.22), P(2.5, 2.75, 2.22), P(2.5, 3.26, 2.2), P(-2.5, 3.26, 2.2), 0, 0, 1, 1, 0, 0.9, 0);
  const m0 = G.m, sp = P(0.9, 1.0, 0.9); G.m = (m0 ? m0.clone() : new THREE.Matrix4()).multiply(new THREE.Matrix4().makeTranslation(sp[0], sp[1], sp[2]));
  G.set(5, 1); lathe(G, [[0.2, 0], [0.34, 0.15], [0.36, 0.6], [0.2, 0.8], [0.12, 1.0], [0.2, 1.1], [0.04, 1.25]], { nu: 8 });
  const top = new THREE.Vector3(0, 1.35, 0).applyMatrix4(G.m);
  G.m = m0;
  return [top.x, top.y, top.z];
}
// a standing figure at G.m: a robe cone, shoulders, head and turban in plain muted wool (pattern 16), two sleeves
const ROBES = [0.1, 0.1, 0.42, 0.42, 0.68, 0.87];
function person(G, rng, o = {}) {
  const m0 = G.m, M = m0 ? m0.clone() : new THREE.Matrix4(), hue = rng.pick(ROBES), tone = rng.range(0.25, 0.75), k = rng.range(0.94, 1.08);
  if (o.lean) M.multiply(new THREE.Matrix4().makeRotationX(o.lean));
  G.m = M.scale(new THREE.Vector3(k, k, k));
  const cf = (g, b) => (ph, t, q) => { q.g = g; q.b = b; };
  G.set(16, 0);
  G.ring(0.37, 0, 0.3, 0.78, { nu: 6, cf: cf(hue, tone), ao: (t) => 0.6 + 0.4 * t }); G.ring(0.3, 0.78, 0.215, 1.38, { nu: 6, cf: cf(hue, tone) });
  G.ring(0.215, 1.38, 0.085, 1.5, { nu: 6, cf: cf(hue, tone * 0.85) });
  G.ring(0.315, 0.84, 0.3, 0.97, { nu: 6, cf: cf(0.87, 0.5) });                                       // sash
  G.ring(0.085, 1.48, 0.12, 1.6, { nu: 6, cf: cf(0.7, 0.95) }); G.ring(0.12, 1.6, 0.105, 1.7, { nu: 6, cf: cf(0.7, 0.95) });
  G.ring(0.16, 1.66, 0.185, 1.75, { nu: 6, cf: cf(0.97, 0.55) }); G.ring(0.185, 1.75, 0.14, 1.85, { nu: 6, cf: cf(0.97, 0.6) }); G.ring(0.14, 1.85, 0.02, 1.9, { nu: 6, cf: cf(0.97, 0.6) });
  const fz = o.reach ?? 0.1;
  for (const sx of [-1, 1]) {
    const a = [sx * 0.2, 1.43, 0.0], b = [sx * 0.33, 1.4, 0.0], c = [sx * 0.34, 0.9, fz], d = [sx * 0.22, 0.9, fz + 0.05];
    if (sx > 0) Q(G, a, b, c, d, 0, 0, 1, 0.8, hue, tone * 0.9); else Q(G, b, a, d, c, 0, 0, 1, 0.8, hue, tone * 0.9);
    const e = [sx * 0.28, 1.42, -0.09], f = [sx * 0.28, 0.9, fz - 0.07];
    if (sx > 0) Q(G, b, e, f, c, 0, 0, 1, 0.8, hue, tone * 0.8); else Q(G, e, b, c, f, 0, 0, 1, 0.8, hue, tone * 0.8);
  }
  G.m = m0;
}

// ---------------------------------------------------------------- ground: snow over paving, lanes, swept stripes, footprints, shadows
function groundMaterial(U, C, W, X) {
  const m = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      varying vec3 vWP;
      #include <fog_pars_vertex>
      void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      ${worldCastGLSL(NBOX, NCYL)}
      uniform vec3 cSnow, cBuff, cTurq, cCob;
      uniform sampler2D uMap; uniform vec4 uMapRect, uSquare; uniform vec4 uSweep[9]; uniform vec4 uTrail[8]; uniform vec4 uPost[${NPOST}]; uniform vec2 uWindXZ;
      varying vec3 vWP;
      #include <fog_pars_fragment>
      void main() {
        vec2 p = vWP.xz; float dist = length(cameraPosition - vWP);
        float pix = max(fwidth(p.x), fwidth(p.y)) + 1e-4;
        vec2 muv = (p - uMapRect.xy) * uMapRect.zw;
        vec4 mp = texture2D(uMap, muv);
        float inMap = step(0.0, muv.x) * step(muv.x, 1.0) * step(0.0, muv.y) * step(muv.y, 1.0);
        float hsh = mp.r * inMap, trod = mp.g * inMap;
        float n1 = fbm(p * 0.06), n2 = fbm(p * 0.8 + 3.0), n3 = vnoise(p * 5.0);
        // wind-packed sastrugi: fine ridges running down the wind, 2 to 3 m apart, faded with pixel size
        vec2 wd = uWindXZ, wc = vec2(-wd.y, wd.x);
        float sfade = (1.0 - smoothstep(0.25, 1.1, pix)) * (1.0 - smoothstep(60.0, 190.0, dist));
        float sarg = dot(p, wc) * 2.4 + fbm(vec2(dot(p, wd) * 0.07, dot(p, wc) * 0.35)) * 3.0 + n1 * 2.0;
        float sas = sin(sarg), sgain = 0.18 * sfade * (0.4 + 0.6 * vnoise(vec2(dot(p, wd) * 0.05, dot(p, wc) * 0.5 + 9.0)));
        float r0 = 0.5 + 0.5 * sas, rel = sfade;
        float dx = -cos(sarg) * sgain, dy = (vnoise(vec2(dot(p, wd) * 0.6 + 4.0, dot(p, wc) * 2.0)) - 0.5) * 0.12 * sfade;
        vec3 N = normalize(vec3(wc.x * dx + wd.x * dy, 1.0, wc.y * dx + wd.y * dy));
        vec3 alb = cSnow * (0.76 + 0.06 * n1 + 0.03 * (r0 - 0.5) * rel);
        // trodden lanes: packed blue-grey snow, footprints, mud showing through
        float tr = trod * (0.55 + 0.45 * n2);
        alb = mix(alb, cSnow * vec3(0.60, 0.64, 0.72) * (0.8 + 0.3 * n3), tr * 0.8);
        alb = mix(alb, cBuff * 0.45, tr * smoothstep(0.55, 0.8, n2) * 0.6);
        // dotted footprint trails
        float foot = 0.0;
        for (int i = 0; i < 8; i++) {
          vec2 a = uTrail[i].xy, ba = uTrail[i].zw - a, pa = p - a; float bl = max(dot(ba, ba), 1e-3);
          float h = clamp(dot(pa, ba) / bl, 0.0, 1.0), al = h * sqrt(bl);
          float side = (fract(al * 0.7) < 0.5 ? 0.16 : -0.16), dd = abs(dot(pa, vec2(-ba.y, ba.x)) / sqrt(bl) - side);
          foot = max(foot, (1.0 - smoothstep(0.07, 0.16, dd)) * smoothstep(0.25, 0.4, abs(fract(al * 1.4) - 0.5)) * step(0.001, h) * step(h, 0.999));
        }
        foot *= 1.0 - smoothstep(0.06, 0.25, pix);
        alb *= 1.0 - 0.34 * foot;
        // the square: brick paving in a star pattern, bared in stripes by the sweepers
        float swept = 0.0;
        for (int i = 0; i < 9; i++) {
          vec4 s = uSweep[i];
          float dz = abs(p.y - s.x) + (n2 - 0.5) * 0.7;
          swept = max(swept, (1.0 - smoothstep(s.w - 0.3, s.w, dz)) * smoothstep(min(s.y, s.z) - 0.5, min(s.y, s.z), p.x) * (1.0 - smoothstep(max(s.y, s.z), max(s.y, s.z) + 0.5, p.x)));
        }
        vec2 sq = abs(fract(p / 4.8) - 0.5); float d1 = max(sq.x, sq.y), d2 = (sq.x + sq.y) * 0.7071, star = min(d1, d2);
        vec2 bc = p / vec2(0.62, 0.3); bc.x += 0.5 * floor(bc.y); float bh = h21(floor(bc));
        float lw = 0.012 + pix * 0.25;
        vec3 pave = cBuff * (0.6 + 0.12 * bh * (1.0 - smoothstep(0.05, 0.2, pix)));
        pave = mix(pave, cBuff * 0.32, 1.0 - smoothstep(lw, lw * 2.2, abs(star - 0.25)));
        pave = mix(pave, cTurq * 0.6, 1.0 - smoothstep(0.07, 0.07 + lw, star));
        pave = mix(pave, cSnow * 0.7, smoothstep(0.55, 0.9, n2 + n3 * 0.3) * 0.25);
        float inSq = step(uSquare.x, p.x) * step(p.x, uSquare.z) * step(uSquare.y, p.y) * step(p.y, uSquare.w);
        alb = mix(alb, pave, swept * (0.85 + 0.15 * n2));
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), max(swept, tr)));
        // light: sun under the cloud edge, shadows from the baked house map and the big casters; cobalt skylight
        float sh = (1.0 - hsh) * worldShadow(vWP + vec3(0.0, 0.06, 0.0), uSunDir, 1.0);
        // thin and moving casters (poplars on the south side, stalls, the cart, the sweepers): x, z, radius, height
        vec2 sdn = uSunDir.xz; float sdl = max(length(sdn), 1e-3); sdn /= sdl;
        for (int i = 0; i < ${NPOST}; i++) {
          vec2 o = uPost[i].xy - p; float al = dot(o, sdn), pe = abs(o.x * sdn.y - o.y * sdn.x), yy = uSunDir.y * (al / sdl);
          sh *= 1.0 - 0.92 * (1.0 - smoothstep(uPost[i].z * 0.7, uPost[i].z * 1.15 + 0.006 * al + pix * 0.7, pe)) * step(0.0, al) * (1.0 - smoothstep(uPost[i].w - 1.5, uPost[i].w + 0.5, yy));
        }
        float mask = sunMask(vWP) * sh;
        float ndl = max(dot(N, uSunDir), 0.0);
        float ao = 1.0 - 0.22 * tr - 0.25 * hsh * inMap;
        vec3 col = alb * (uSunCol * ndl * mask * 0.37 + hemi(N) * 0.86 * ao);
        vec3 V = normalize(cameraPosition - vWP);
        vec3 sc = floor(vWP * 24.0);
        float sp = step(0.991, h21(sc.xz)) * pow(max(dot(normalize(N + (h22(sc.xz).xyx - 0.5) * 0.8), normalize(uSunDir + V)), 0.0), 24.0) * (1.0 - smoothstep(30.0, 90.0, dist));
        col += uSunCol * sp * 2.4 * mask * (1.0 - swept) * (0.6 + 0.4 * inSq);
        // snow blowing along the surface in streamers
        float blow = fbm(vec2(dot(p, wd) * 0.05 - uTime * 0.85, dot(p, wc) * 0.9 + sin(dot(p, wd) * 0.05) * 1.5)) * fbm(vec2(dot(p, wd) * 0.3 - uTime * 4.0, dot(p, wc) * 3.2));
        col += cSnow * (uSunCol * mask * 0.1 + hemi(vec3(0.0, 1.0, 0.0)) * 0.12) * smoothstep(0.24, 0.6, blow) * (1.0 - smoothstep(60.0, 220.0, dist)) * (1.0 - 0.6 * tr) * (0.35 + 0.65 * smoothstep(8.0, 34.0, dist)) * (1.0 - swept);
        gl_FragColor = vec4(col, 1.0);
        #ifdef USE_FOG
          float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * fogShade(vWP, vFogDepth) + uSunCol * 0.1 * shaftAt(vWP.xz), fogF);      // the lit air under the hole in the squall
        #endif
      }`,
  });
  for (const k in U) m.uniforms[k] = U[k];
  for (const k of ['cSnow', 'cBuff', 'cTurq', 'cCob']) m.uniforms[k] = C[k];
  Object.assign(m.uniforms, W, X);
  return m;
}

// ---------------------------------------------------------------- the squall overhead: whiteout, torn cloud deck, slate wall
function squallDome(X) {
  const g = new THREE.SphereGeometry(1400, 40, 20);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, uniforms: X,
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uWhite, uSlate, uSilver, uFogC, uSunTint; uniform vec4 uEdge, uHole; uniform vec2 uCam, uSunAz; uniform float uWhiteout, uTime, uDeckH, uCurtain, uLining, uVeil, uLee;
      varying vec3 vDir;
      float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
      float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.28 * vnoise(p * 2.13 + 7.1) + 0.14 * vnoise(p * 4.31 + 3.7) + 0.08 * vnoise(p * 8.7 + 1.3); }
      void main() {
        vec3 d = normalize(vDir);
        float el = max(d.y, 0.02);
        vec2 P = uCam + d.xz * (uDeckH / el);
        vec2 Pn = P * 0.0026 + uEdge.xy * uTime * 0.012;
        float big = fbm(Pn), fine = fbm(Pn * 4.3 + 11.0);
        float dd = dot(P, uEdge.xy) - uEdge.z + (big - 0.5) * 420.0 + (fine - 0.5) * 130.0;
        float cloud = smoothstep(-110.0, 110.0, dd);
        float body = fbm(Pn * 2.1 + 31.0);
        vec3 col = uSlate * (0.58 + 0.6 * body) * mix(1.0, 0.72, smoothstep(0.4, 0.03, d.y));
        // snow curtains trailing under the wall
        vec2 hz = d.xz / max(length(d.xz), 1e-4);      // direction round the horizon: noise on it has no seam
        float cur = fbm(hz * 13.0 + vec2(0.0, d.y * 3.0 - uTime * 0.02)) * 1.3 * vnoise(hz * 3.5 + 3.0);
        col = mix(col, uSlate * 1.4 + uWhite * 0.1, min(cur * uCurtain * mix(1.6, 1.0, smoothstep(0.03, 0.12, d.y)), 1.0) * smoothstep(0.26, 0.0, d.y));
        // the wall's foot dissolves into the shaded air over the plain: no ruled line where the storm meets the horizon
        col = mix(col, uFogC * 0.8, 0.75 * smoothstep(0.09, 0.0, d.y) * cloud);
        // torn edges lit silver
        float lining = exp(-max(dd, 0.0) / uLining) * cloud;
        col = mix(col, uSilver, clamp(lining * (0.4 + 0.75 * fine), 0.0, 0.92));
        float a = cloud;
        float veil = fbm(hz * 4.5 + vec2(d.y * 5.0 + uTime * 0.55, d.y * 7.0 + uTime * 1.3)) * vnoise(hz * 11.0 + vec2(uTime * 1.6, d.y * 15.0 + uTime * 3.4));
        // the whiteout: the fog's own cobalt along the horizon (so ghosts and far roofs sink into it without a seam),
        // lighter and whiter overhead, with snow veils dragging across it
        vec3 wh = mix(uFogC * 0.97, uWhite * 1.05, smoothstep(0.0, 0.5, d.y)) * (0.95 + 0.22 * veil * uCurtain);
        // the squall has a bright side: warm and lighter toward the hidden sun, cobalt and darker on the lee side
        float sa = dot(hz, uSunAz), sunward = max(sa, 0.0);
        wh *= 0.9 + 0.1 * smoothstep(-1.0, 0.2, sa) + 0.4 * sunward * sunward * sunward;
        wh = mix(wh, wh * (0.6 + 0.6 * uSunTint), 0.5 * sunward * sunward * (1.0 - 0.6 * smoothstep(0.3, 0.9, d.y)));
        // down-sun stands the storm's own body: slate cloud with structure, darkest a little above the horizon, so
        // tile lit through a break in the cloud glows against it
        float lee = smoothstep(0.4, -0.7, sa) * smoothstep(0.0, 0.13, d.y) * (1.0 - 0.4 * smoothstep(0.35, 0.95, d.y));
        wh = mix(wh, uSlate * (1.0 + 1.0 * body) * (1.0 + 0.5 * veil * uCurtain), 0.92 * lee * uLee);
        // and it glows where the hole in it lets the sun down onto the city (uHole: direction to the hole, strength)
        float hg = max(dot(d, uHole.xyz), 0.0); hg *= hg; hg *= hg;
        // (a ragged rent about ten degrees across, bright against the slate, with only a faint halo: not a wash over the sky)
        float tear = hg * hg * hg; tear *= tear; tear *= tear;
        wh += uSunTint * uHole.w * (0.55 * tear * (0.45 + 1.1 * fine) + 0.03 * hg) * (0.7 + 0.6 * veil);
        // a thin high veil that stays after a calm fall: streaks of cirrus rather than a flat wash
        float ci = fbm(d.xz / max(d.y + 0.25, 0.25) * vec2(1.6, 4.2) + uTime * 0.004);
        float wo = max(uWhiteout, uVeil * smoothstep(0.2, 0.75, ci) * (1.0 - 0.6 * cloud));
        col = mix(col, wh, wo); a = max(a, wo);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -0.6; mesh.name = 'squall-dome';
  return mesh;
}

// ---------------------------------------------------------------- smoke and steam: instanced puffs lit by the shared light block
// emitters: [x, y, z, scale, kind] kind 0 chimney smoke, 1 steam; shed: one-shot puffs [x, y, z, delay, ox, oz] driven by uShed seconds
function makeSmoke(emitters, shed, rng, U, uShed) {
  const K = 7, n = emitters.length * K + shed.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const B = new Float32Array(n * 4), D = new Float32Array(n * 4), E = new Float32Array(n * 3);
  emitters.forEach((e, i) => {
    const seed = rng();
    for (let k = 0; k < K; k++) { const o = (i * K + k) * 4; B[o] = e[0]; B[o + 1] = e[1]; B[o + 2] = e[2]; B[o + 3] = e[3]; D[o] = (k + rng() * 0.6) / K + seed; D[o + 1] = rng(); D[o + 2] = rng.range(0.75, 1.3); D[o + 3] = rng.range(0.06, 0.1) * (e[4] ? 2.2 : 1); E[(i * K + k) * 3] = e[4]; }
  });
  shed.forEach((e, i) => { const j = emitters.length * K + i, o = j * 4; B[o] = e[0]; B[o + 1] = e[1]; B[o + 2] = e[2]; B[o + 3] = e[6] ? rng.range(1.5, 2.6) : rng.range(3.4, 5.6); D[o] = e[3]; D[o + 1] = rng(); D[o + 2] = rng.range(0.7, 1.3); D[o + 3] = -rng.range(0.16, 0.26); E[j * 3] = e[6] ? 3 : 2; E[j * 3 + 1] = e[4]; E[j * 3 + 2] = e[5]; });
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aData', new THREE.InstancedBufferAttribute(D, 4)); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(E, 3));
  g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aBase, aData; attribute vec3 aKind; uniform float uTime, uShed; uniform vec4 uWind;
      varying vec2 vQ; varying vec4 vK; varying vec3 vWP; varying float vSz;
      #include <fog_pars_vertex>
      void main() {
        float s = aBase.w, one = step(aData.w, 0.0);
        float age = one > 0.5 ? clamp((uShed - aData.x) * -aData.w, 0.0, 1.0) : fract(uTime * aData.w + aData.x);
        vec3 p = aBase.xyz;
        float lift = (1.0 - exp(-age * 2.2)) * 9.0 * aData.z * s * (1.0 - 0.72 * step(0.5, aKind.x) * (1.0 - one));
        float hang = step(2.5, aKind.x);
        p.y += mix(lift, mix(sin(age * 3.0) * 7.0 * aData.z - age * age * 26.0, sin(age * 2.2) * 3.0 * aData.z - age * 5.0, hang), one);
        p.xz += uWind.xz * (age * age * 10.0 + age * 2.5) * s * (1.0 - one) + aKind.yz * age * (10.0 + 14.0 * aData.y) * one * (1.0 - 0.75 * hang);
        p.x += sin(age * 9.0 + aData.y * 30.0 + uTime * 0.4) * age * 1.2 * s; p.z += cos(age * 7.0 + aData.y * 50.0) * age * 1.0 * s;
        float size = (0.4 + 4.6 * pow(max(age, 0.0), 0.75)) * s * (0.8 + 0.5 * aData.y) * mix(1.0, 0.55, step(0.5, aKind.x) * (1.0 - one));
        vec4 mvPosition = viewMatrix * vec4(p, 1.0); mvPosition.xy += position.xy * size;
        vWP = p; vQ = position.xy; vSz = size;
        float nearF = mix(1.0, smoothstep(4.0, 22.0, length(cameraPosition - p)) * mix(1.0, 0.55, hang), one);      // the shed cloud thins round the lens: we fly through glitter, not a white wall
        vK = vec4(age, smoothstep(0.0, 0.08, age) * pow(1.0 - age, 1.5) * step(0.0005, age) * nearF, aData.y, aKind.x);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 cSnow;
      varying vec2 vQ; varying vec4 vK; varying vec3 vWP; varying float vSz;
      #include <fog_pars_fragment>
      void main() {
        float r = length(vQ); if (r > 1.0) discard;
        float n = fbm(vQ * 1.6 + vK.z * 20.0 + vec2(0.0, -uTime * 0.25));
        float a = (1.0 - r * r) * smoothstep(0.15, 0.75, n + 0.45 * (1.0 - r)) * vK.y;
        float white = step(0.5, vK.w);
        a *= mix(0.5, 0.42 + 0.14 * step(1.5, vK.w), white);
        vec2 gp = vQ * vSz * 5.0 + vK.z * 50.0, gc = floor(gp);
        float glit = step(1.5, vK.w) * step(0.9, h21(gc)) * (1.0 - smoothstep(0.1, 0.3, length(fract(gp) - 0.5))) * pow(max(sin(uTime * (4.0 + 7.0 * h21(gc + 3.0)) + h21(gc + 9.0) * 40.0), 0.0), 6.0);
        if (a < 0.004) discard;
        float mask = sunMask(vWP);
        vec3 tint = mix(vec3(0.42, 0.44, 0.5), cSnow * 0.95, white);
        // (chimney smoke takes little of the sun: under a break in the cloud it stays a grey column, not a bright haze over the roofs)
        vec3 col = tint * (uSky * 0.55 + uBounce * 0.6 + uSunCol * mask * (0.22 + 0.2 * vQ.y) * (1.0 + step(1.5, vK.w)) * mix(0.35, 1.0, white));
        col = min(col, vec3(0.86));      // sunlit powder and steam stay under white: a midday shedding is a bright cloud, not a blown frame
        gl_FragColor = vec4(col * a + uSunCol * glit * 3.0 * mask * smoothstep(0.0, 0.12, a), a);
        #ifdef USE_FOG
          float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * a, ff * 0.8);
        #endif
      }`,
  });
  for (const k in U) m.uniforms[k] = U[k];
  m.uniforms.uShed = uShed; m.uniforms.cSnow = { value: new THREE.Color(PALETTE[0]) };
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2.5; mesh.name = 'smoke';
  return mesh;
}

// ---------------------------------------------------------------- persimmons (and autumn poplar leaves): instanced, with an unlit floor
// kind 0: the fruit of the tree that opens the flight (an icosahedron shaded round), 3: other near fruit (a smooth-shaded octahedron), 1: far fruit
// (a tetrahedron), 2: a leaf (two crossed blades cut to a pointed oval)
function makeFruit(list, U, color, kind) {
  const leaf = kind === 2, g = new THREE.InstancedBufferGeometry();
  if (leaf) {
    const P = [], N = [], L = [];
    for (const [cx, cz] of [[1, 0], [0, 1]]) for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { P.push(a * 0.5 * cx, b, a * 0.5 * cz); N.push(cz, 0, cx); L.push(a, b); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 2));
  } else {
    const o = kind === 1 ? new THREE.TetrahedronGeometry(1.3, 0).toNonIndexed() : kind === 3 ? new THREE.OctahedronGeometry(1, 0).toNonIndexed() : new THREE.IcosahedronGeometry(1, 0), pa = o.getAttribute('position');
    g.setAttribute('position', pa); g.setAttribute('aL', new THREE.BufferAttribute(new Float32Array(pa.count * 2), 2));
    // near fruit are shaded round: the normal is the direction from the centre
    if (kind === 1) g.setAttribute('normal', o.getAttribute('normal'));
    else { const nn = new Float32Array(pa.array.length); for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), l = Math.hypot(x, y, z) || 1; nn[i * 3] = x / l; nn[i * 3 + 1] = y / l; nn[i * 3 + 2] = z / l; } g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); }
  }
  const A = new Float32Array(list.length * 4), S = new Float32Array(list.length * 2);
  list.forEach((f, i) => { A[i * 4] = f[0]; A[i * 4 + 1] = f[1]; A[i * 4 + 2] = f[2]; A[i * 4 + 3] = f[4]; S[i * 2] = f[3]; S[i * 2 + 1] = (i * 0.618) % 1; });
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 2)); g.instanceCount = list.length;
  const m = new THREE.ShaderMaterial({
    side: leaf ? THREE.DoubleSide : THREE.FrontSide,
    fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(color) }, uLeaf: { value: leaf ? 1 : 0 } }]),
    vertexShader: /* glsl */`
      attribute vec4 aI; attribute vec2 aS, aL; uniform vec4 uWind; uniform float uTime, uLeaf;
      varying vec3 vN, vWP; varying float vH, vTop; varying vec2 vL;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position * aI.w * mix(vec3(1.0, 0.9, 1.0), vec3(0.7), uLeaf);
        // a leaf hangs at its own heading and tilt, and flutters
        float hd = uLeaf * (aS.y * 43.0 + 0.5 * sin(uTime * (3.0 + 4.0 * aS.y) + aS.y * 40.0)), tl = uLeaf * (1.0 + 0.6 * sin(aS.y * 91.0) + 0.35 * sin(uTime * (2.2 + 3.0 * aS.y) + aS.y * 17.0));
        p.xy = vec2(p.x * cos(tl) - p.y * sin(tl), p.x * sin(tl) + p.y * cos(tl));
        p.xz = vec2(p.x * cos(hd) - p.z * sin(hd), p.x * sin(hd) + p.z * cos(hd));
        vL = aL;
        vec3 c = aI.xyz;
        float g = sin(uTime * 1.7 + c.x * 0.31 + c.z * 0.23) + 0.5 * sin(uTime * 3.1 + c.x * 0.9);
        c.xz += uWind.xz * g * (0.11 * aS.x + 0.05);
        vec4 wp = vec4(c + p, 1.0); vWP = wp.xyz; vN = normal; vH = aS.y; vTop = position.y;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 uCol; uniform float uLeaf;
      varying vec3 vN, vWP; varying float vH, vTop; varying vec2 vL;
      #include <fog_pars_fragment>
      void main() {
        if (uLeaf > 0.5 && abs(vL.x) > pow(max(1.0 - abs(vL.y), 0.0), 0.6)) discard;
        vec3 N = normalize(vN);
        float ndl = mix(max(dot(N, uSunDir), 0.0), 0.45 + 0.4 * abs(dot(N, uSunDir)), uLeaf);
        vec3 alb = uCol * (0.75 + 0.5 * vH);
        float cap = smoothstep(0.42, 0.62, vTop) * (1.0 - uLeaf);
        alb = mix(alb, vec3(0.8, 0.84, 0.88), cap);
        alb *= mix(1.0, 0.8 + 0.25 * (1.0 - abs(vL.x)), uLeaf);      // a paler midrib
        vec3 col = alb * (uSunCol * ndl * sunMask(vWP) * 0.7 + hemi(N) * 0.9) + uCol * mix(0.2 + 0.25 * clamp(N.y * 0.5 + 0.8, 0.0, 1.0), 0.4, uLeaf) * (1.0 - cap);
        gl_FragColor = vec4(col, 1.0);
        #ifdef USE_FOG
          float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, min(ff, 0.8));
        #endif
      }`,
  });
  for (const k in U) m.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = leaf ? 'leaves' : 'persimmons';
  return mesh;
}

// ---------------------------------------------------------------- looks
const LOOKS = {
  midday: { sun: [-0.56, 0.42, 0.72], sunCol: '#FFF1D6', sunK: 3.0, sky: '#7AA2EA', skyK: 0.72, bounce: '#DCE6F2', bounceK: 0.5, zenith: '#1D4FA8', horizon: '#BFD6EA', white: '#DDE4EC', whiteK: 0.82,
    slate: '#56668A', silver: '#F4F8FB', exposure: 1.0, lamp: 0, stars: 0, portal: '#fff2d6' },
  late: { sun: [-0.6, 0.27, 0.76], sunCol: '#FFD9B4', sunK: 3.0, sky: '#6E92E0', skyK: 0.66, bounce: '#EADCCB', bounceK: 0.5, zenith: '#1F4EAA', horizon: '#D9DDE8', white: '#DEDEE6', whiteK: 0.8,
    slate: '#4E5878', silver: '#FFE9CC', exposure: 1.0, lamp: 0.25, stars: 0, portal: '#ffe2b8' },
  dusk: { sun: [-0.56, 0.5, 0.66], sunCol: '#C4D4FF', sunK: 1.3, sky: '#5F74B8', skyK: 0.6, bounce: '#8C9ED4', bounceK: 0.4, zenith: '#0A1A4C', horizon: '#46639E', white: '#8695BC', whiteK: 0.62,
    slate: '#4A5A86', silver: '#B9C8F2', exposure: 1.05, lamp: 1.6, stars: 0.8, portal: '#ffd9a0' },
};

export default {
  id: 'snow-on-turquoise',
  name: 'Snow on Turquoise',
  category: 'city',
  weirdness: 0.05,
  media: ['air', 'open', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('sot-variant'), detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const hour = vary.hour || 'any', duration = 41;
    const lookId = hour === 'night' ? 'dusk' : hour === 'golden' || hour === 'dawn' ? 'late' : hour === 'day' ? 'midday' : vr.pick(['midday', 'midday', 'late', 'late', 'dusk']);
    const look = LOOKS[lookId], rare = !!vary.rare;
    const weather = vr.pick(['squall', 'squall', 'rime', 'calm', 'calm']), season = vr.pick(['winter', 'winter', 'deep', 'first']);
    const mixedLoft = vr.chance(0.4), kites = vr.chance(0.3), xr = vr.fork('extras');      // xr: the rng of everything added later, so earlier draws stay put
    const zr = ctx.core.makeRng(ctx.core.hashSeed('sot-entry:' + ctx.seed));      // the rng of the entry mosques and the figures by the east arch: nothing else draws from it
    const scene = new THREE.Scene();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---- the hero and its light block
    const sunDir = V3(...look.sun).normalize();
    // the slab lets go on the west flank just ahead of the camera (it is beside us at u 0.43) as the shadow edge passes
    const RELEASE_U = 0.407, LIGHT_U = 0.398;
    const hero = await buildHero(ctx, { palette: PALETTE, duration, sunDir, releaseU: RELEASE_U, lightU: LIGHT_U, slabAngle: 3.1 });
    hero.object.position.set(...HERO_AT); scene.add(hero.object);
    const U = hero.uniforms, C = hero.colors, HA = hero.anchors;
    const W = (p) => V3(p.x + HERO_AT[0], p.y, p.z + HERO_AT[2]);
    const windXZ = new THREE.Vector2(U.uWind.value.x, U.uWind.value.z).normalize();
    await ctx.yield();

    // ---- path: the brief's line through the hero's own fly-through anchors
    const ft = HA.flyThrough.map(W);
    const path = makePath([[-390, 13, 300], [-382, 13, 240], [-364, 14, 172], ...ft.map((p) => [p.x, p.y, p.z]), [-190, 14.6, 0], [-150, 12.8, 0], [-110, 10, 0], [-70, 10, 0], [0, 10, 0], [76, 10, 0]]);

    // ---- u-driven weather
    const fog0 = weather === 'rime' ? 0.0066 : weather === 'calm' ? 0.0044 : 0.0047, fog1 = weather === 'calm' ? 0.002 : lookId === 'dusk' ? 0.0011 : 0.0007;
    // the squall is tinted cobalt so landmarks read as blue ghosts; the sky dome stays whiter than the fog so they separate
    const cWhite = col(look.white, look.whiteK * 0.9).lerp(col('#7F9BD8', look.whiteK * 0.9), lookId === 'dusk' ? 0.15 : 0.62), cDomeWhite = col(look.white, look.whiteK * (lookId === 'dusk' ? 1.1 : 1.04)), cFogClear = col(look.horizon, lookId === 'dusk' ? 0.8 : 0.92);
    const fogIn = Math.min(fog0, 0.0037);
    scene.fog = new THREE.FogExp2(cWhite.clone(), fogIn);
    const cSunCol = col(look.sunCol, look.sunK), cSkyClear = col(look.sky, look.skyK), cBounceClear = col(look.bounce, look.bounceK);
    // (the storm's own fill is kept low and a little blue, so what the sun reaches through a break stands out and shade stays cobalt)
    const stormK = lookId === 'dusk' ? 0.9 : 0.7, stormB = lookId === 'dusk' ? 0.3 : 0.42, cSkySquall = col(look.white, 0.74 * stormK * look.whiteK / 0.82).lerp(col('#7F9BD8', 0.6 * stormK), stormB), cBounceSquall = col(look.white, 0.52 * stormK * look.whiteK / 0.82).lerp(col('#7F9BD8', 0.42 * stormK), stormB);
    const EN = [Math.SQRT1_2, -Math.SQRT1_2];
    const EK = [[LIGHT_U, -177], [0.56, -78], [0.62, 0], [0.66, 86], [1, 640]];
    const edgeAt = (u) => { if (u <= EK[0][0]) return EK[0][1] - (EK[0][0] - u) * 1500; for (let i = 1; i < EK.length; i++) if (u <= EK[i][0]) return lerp(EK[i - 1][1], EK[i][1], (u - EK[i - 1][0]) / (EK[i][0] - EK[i - 1][0])); return EK[EK.length - 1][1]; };
    const uFogCapQ = { value: 1 }, uLamp = { value: look.lamp }, uRime = { value: weather === 'rime' ? 0.85 : season === 'deep' ? 0.3 : 0 }, uShed = { value: -1 };
    uShed.value = -1; U.uFogCap.value = 0.42; uFogCapQ.value = 0.82;
    // the hole in the squall: a pool of sun that drifts from the minarets onto the dome while the storm lasts
    const SHAFT0 = [-314, 14], SHAFT1 = [HERO_AT[0] - 6, HERO_AT[2] + 8], shaftK = lookId === 'dusk' ? 0.55 : weather === 'rime' ? 0.5 : 0.75, keyK = weather === 'calm' ? 0.3 : weather === 'rime' ? 0.2 : 0.25;
    U.uShaft.value.set(SHAFT0[0], SHAFT0[1], 1 / 125, shaftK); U.uKey.value = keyK; U.uGhost.value = 0.35;
    // a second, wider break travels with the wind just ahead of the camera until the squall tears open: low sun on the
    // near roofs, long shadows across their snow, cloud shreds dappling it, under the storm's slate lee side
    const shaft2K = lookId === 'dusk' ? 0.6 : weather === 'rime' ? 0.7 : 1, shV = new THREE.Vector3();
    U.uShaft2.value.set(-384, 240, 1 / 240, shaft2K);
    const camPos = new THREE.Vector3();
    const uBoxA = { value: [] }, uBoxB = { value: [] }, uCyl = { value: [] };
    for (let i = 0; i < NBOX; i++) { uBoxA.value.push(new THREE.Vector4(0, -200, 0, 0)); uBoxB.value.push(new THREE.Vector4(0, -200, 0, 0)); }
    for (let i = 0; i < NCYL; i++) uCyl.value.push(new THREE.Vector4(0, 0, 0.01, -100));
    const cast = { n: [NBOX, NCYL], uBoxA, uBoxB, uCyl };
    let nBox = 0, nCyl = 0;
    const addBox = (b) => { if (nBox < NBOX) { uBoxA.value[nBox].set(b[0], b[1], b[2], 0); uBoxB.value[nBox].set(b[3], b[4], b[5], 0); nBox++; } };
    const addCyl = (c) => { if (nCyl < NCYL) uCyl.value[nCyl++].set(c[0], c[1], c[2], c[3]); };
    const tileBig = tileMaterial(U, C, { cast: false, world: cast, lamp: uLamp, rime: uRime }); tileBig.side = THREE.DoubleSide;       // madrasas: ghosts in the fog
    const tileTown = tileMaterial(U, C, { cast: false, world: cast, lamp: uLamp, rime: uRime, fogCap: uFogCapQ }); tileTown.side = THREE.DoubleSide;
    await ctx.yield();

    // ---- sky: a clear cold dome, under the squall dome that tears open along the shadow edge
    const az = Math.atan2(sunDir.x, -sunDir.z) * 180 / Math.PI, elv = Math.asin(sunDir.y) * 180 / Math.PI;
    const sky = makeSky({ rng, preset: lookId === 'dusk' ? 'blueHour' : 'day', zenith: look.zenith, horizon: look.horizon, mid: new THREE.Color(look.zenith).lerp(new THREE.Color(look.horizon), 0.42),
      ground: col(look.horizon, 0.8), sunElevation: elv, sunAzimuth: az, sunColor: look.sunCol, sunSize: lookId === 'dusk' ? 0 : weather === 'calm' ? 2.2 : 1.1, sunIntensity: lookId === 'dusk' ? 0 : 11, sunGlow: weather === 'calm' ? 1.2 : lookId === 'late' ? 1.0 : 0.6,
      scatterColor: lookId === 'late' ? '#ffb070' : '#e8f0ff', scatter: lookId === 'late' ? 0.2 : 0.22, scatterPow: lookId === 'late' ? 16 : 5, clouds: false, clouds2: lookId === 'dusk' ? false : { coverage: 0.3, opacity: lookId === 'late' ? 0.15 : 0.35, stretch: 1 }, stars: look.stars,
      bodies: lookId === 'dusk' ? [{ elevation: elv, azimuth: az, size: 2.4, phase: 0.5, phaseAngle: 110, glow: 0.5, color: '#eef2ff', intensity: 2.2 }] : [], bake: lookId === 'dusk', renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    const SQ = { uWhite: { value: cWhite.clone() }, uSlate: { value: col(look.slate) }, uSilver: { value: col(look.silver, lookId === 'dusk' ? 0.4 : 0.95) }, uEdge: U.uEdge, uFogC: { value: scene.fog.color }, uLining: { value: lookId === 'dusk' ? 420 : 250 }, uVeil: { value: 0 }, uCam: { value: new THREE.Vector2() },
      uWhiteout: { value: 1 }, uTime: U.uTime, uDeckH: { value: 330 }, uCurtain: { value: weather === 'rime' ? 0.2 : 0.5 }, uLee: { value: weather === 'rime' ? 0.55 : lookId === 'dusk' ? 0.7 : 1 }, uSunAz: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() }, uHole: { value: new THREE.Vector4(0, 1, 0, 0) }, uSunTint: { value: col(look.sunCol, lookId === 'dusk' ? 0.5 : 0.95) } };
    const dome = squallDome(SQ); scene.add(dome);
    const hemiL = new THREE.HemisphereLight(col(look.sky), col(look.bounce), 1.2), sunL = new THREE.DirectionalLight(col(look.sunCol), 0.3);
    sunL.position.copy(sunDir).multiplyScalar(300); scene.add(hemiL, sunL);
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), fog: scene.fog, sunDir, sunColor: look.sunCol, snow: lookId === 'dusk' ? '#9AA9DC' : true, ambient: lookId === 'dusk' ? '#2E3C72' : undefined, sunIntensity: lookId === 'dusk' ? 0.3 : 1, haze: lookId === 'dusk' ? '#3F5890' : undefined, colorNear: lookId === 'dusk' ? '#1C2648' : undefined, snowLine: 0.3, height: [120, 420], radius: [1700, 3200], layers: 3, rim: 0.15,
      hazeNear: lookId === 'dusk' ? 0.8 : 0.75, hazeFar: 0.94, jagged: 0.2, segments: 420 });      // faceted by design, so they are pushed back into the air
    scene.add(ridges.object);
    await ctx.yield();

    // ---- the three madrasas round the square (west one is flown through; the east arch holds the portal)
    const GM = new Geo(), mr = rng.fork('madrasas');
    const mW = await madrasa(GM, { at: [-70, 0], rot: Math.PI / 2, WT: 88, D: 80, mode: 'through', rearH: 5.6, domes: 2, arcades: true, rng: mr, deep: season === 'deep', xr, shadow: [-sunDir.x / sunDir.y, -sunDir.z / sunDir.y], pause: ctx.yield });
    await ctx.yield();
    const mN = await madrasa(GM, { at: [0, -60], rot: 0, WT: 112, D: 62, mode: 'niche', domes: 2, arcades: true, rng: mr, deep: season === 'deep', pause: ctx.yield });
    await ctx.yield();
    const mE = await madrasa(GM, { at: [70, 0], rot: -Math.PI / 2, WT: 88, D: 62, mode: 'portal', domes: 1, domeSide: mr.pick([-1, 1]), rng: mr, deep: season === 'deep', pause: ctx.yield });
    for (const m of [mW, mN, mE]) m.boxes.forEach(addBox);
    addBox([HERO_AT[0] - 17, -1, HERO_AT[2] - 17, HERO_AT[0] + 17, 13.5, HERO_AT[2] + 17]);
    addCyl([HERO_AT[0], HERO_AT[2], 13.4, 30.5]); addCyl([HERO_AT[0], HERO_AT[2], 14.2, 53]);
    for (const mi of HA.minarets) addCyl([mi.base.x + HERO_AT[0], mi.base.z + HERO_AT[2], 2.6, mi.top.y - 4]);
    for (const m of [mW, mN, mE]) m.cyls.forEach(addCyl);
    await ctx.yield();
    // the square: low steps on the open south side, four old plane trees (two of them south of the flight line so
    // their shadows fall across it), a row of bare poplars along the south edge striping the snow, two tea stalls
    GM.m = null; GM.set(0, 0);
    for (let i = 0; i < 3; i++) BX(GM, 0, 0.2 * (3 - i) / 2, 78 + i * 1.6, 150, 0.2 * (3 - i), 1.6, 0, 3, 0.8, 1);
    const planeAt = [[-42, -34], [30, -36], [-30, 29], [29, 25]].map(([x, z]) => [x + mr.range(-2, 2), z + mr.range(-2, 2)]);
    const POST = []; for (let i = 0; i < NPOST; i++) POST.push(new THREE.Vector4(0, 0, 0.001, -100));
    const squareTips = [], courtTips = [];
    GM.aux = 1; GM.limbN = 5;
    for (const [x, z] of planeAt) { const H = mr.range(14.5, 17); bareTree(GM, mr, x, 0, z, H, { levels: 4, limbs: 5, spread: 1.0, trunk: 0.6, bole: 0.3, up: 0.35, tips: squareTips, perTip: 1 }); addCyl([x, z, 1.0, H * 0.5]); addCyl([x, z, -H * 0.42, H * 0.95]); }
    GM.limbN = 3;
    for (let i = 0; i < 8; i++) { const x = -56 + i * 16 + mr.range(-1.5, 1.5), z = 70 + mr.range(-1, 1), H = mr.range(15, 18); poplar(GM, mr, x, z, H, squareTips); POST[9 + i].set(x, z, 0.55, H); }
    await ctx.yield();
    // four persimmons in the west madrasa's courtyard, either side of the swept path
    GM.aux = 0;
    GM.limbN = 5;
    for (const [x, z] of [[-128, -14], [-128, 14], [-100, -14], [-100, 14]]) bareTree(GM, mr, x + mr.range(-1, 1), 0, z + mr.range(-1, 1), mr.range(5.6, 6.6), { levels: 3, limbs: 4, tips: courtTips, perTip: 4, spread: 0.85 });
    GM.limbN = 3;
    const stalls = [[-20, 37, 0.5], [42, -36, 3.5]].map(([x, z, yaw], k) => {
      GM.m = new THREE.Matrix4().makeRotationY(yaw).scale(new THREE.Vector3(1.45, 1.3, 1.45)).setPosition(x, 0, z);
      const top = teaStall(GM, 0, 0, 0, mr);
      for (let i = 0; i < 6; i++) { const a = yaw + mr.range(-1.2, 1.2) - Math.PI / 2 * 0 + (i % 2 ? 0.4 : -0.4), r = mr.range(5.6, 7.6), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; GM.m = new THREE.Matrix4().makeRotationY(Math.atan2(x - px, z - pz) + mr.range(-0.5, 0.5)).setPosition(px, 0, pz); person(GM, mr); }
      GM.m = null; POST[7 + k].set(x, z, 3.2, 3.6); return top;
    });
    // the open strip behind the west madrasa, which the descent looks down on: a row of bare poplars whose shadows
    // stripe the snow up to the rear wall, and a few people on the trodden lane along it
    const laneFolk = [];
    GM.m = null; GM.aux = 0;
    for (let i = 0, k = 18; i < 12 && k < NPOST; i++) {
      const z = -57 + i * 10.4 + xr.range(-1.6, 1.6), x = -163.5 + xr.range(-1.2, 1.2), H = xr.range(9.5, 12.5);
      if (Math.abs(z) < 13.5) continue;
      poplar(GM, xr, x, z, H, squareTips); POST[k++].set(x, z, 0.5, H);
    }
    for (const [x, z, n] of [[-156.5, -19, 2], [-157.5, 24, 3], [-156, 43, 1]]) for (let i = 0; i < n; i++) {
      const px = x + xr.range(-0.9, 0.9), pz = z + xr.range(-1.3, 1.3);
      GM.m = new THREE.Matrix4().makeRotationY(xr.range(0, TAU)).setPosition(px, 0, pz); person(GM, xr); laneFolk.push([px, pz]);
    }
    GM.m = null;
    // three figures beside the swept approach to the east arch (their own rng); a pair and one alone, each with a shadow
    for (const [px, pz, yw] of [[46.6, 3.9, -1.9], [47.7, 4.5, 1.3], [57.5, -3.7, 0.5]]) { GM.m = new THREE.Matrix4().makeRotationY(yw + zr.range(-0.3, 0.3)).setPosition(px, 0, pz); person(GM, zr); }
    GM.m = null; addCyl([47.1, 4.2, 0.62, 1.8]); POST[17].set(57.5, -3.7, 0.4, 1.85);
    await ctx.yield();
    const madMesh = new THREE.Mesh(GM.toGeometry(), tileBig); madMesh.name = 'madrasas'; scene.add(madMesh);
    await ctx.yield();

    // ---- sweepers and a handcart working across the square
    const figure = (broom) => {
      const g = new Geo();
      if (broom) {
        person(g, mr, { lean: 0.26, reach: 0.36 });
        g.aux = 0; limb(g, [0.27, 1.22, 0.48], [0.3, 0.14, 2.2], 0.05, 0.05, 0, 0);                    // a 2.2 m broom with a wide fan of twigs
        g.set(14, 0); Q(g, [-0.2, 0.03, 2.75], [0.8, 0.03, 2.75], [0.42, 0.3, 2.05], [0.18, 0.3, 2.05], 0, 0, 1, 1, 0, 0, 0); Q(g, [-0.1, 0.16, 2.7], [0.7, 0.16, 2.7], [0.4, 0.36, 2.0], [0.2, 0.36, 2.0], 0.3, 0, 0.8, 1, 0, 0, 0);
      } else {
        person(g, mr, { lean: 0.14, reach: 0.4 });
        g.set(7, 0); BX(g, 0, 0.75, 1.6, 1.1, 0.5, 1.7, 0, 3, 0.7, 1); for (const sx of [-1, 1]) Q(g, [sx * 0.5, 0.98, 0.3], [sx * 0.5 + 0.09, 0.98, 0.3], [sx * 0.5 + 0.09, 0.85, 0.8], [sx * 0.5, 0.85, 0.8]);
        g.set(16, 0); BX(g, 0, 1.2, 1.6, 0.9, 0.4, 1.4, 0, 3, 0.8, 1, 0.12, 0.5); BX(g, 0.1, 1.55, 1.4, 0.6, 0.3, 0.8, 0.3, 3, 0.8, 1, 0.45, 0.6);
        g.set(7, 0); for (const sx of [-1, 1]) { g.m = new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(sx * 0.62, 0.45, 1.6); g.ring(0.45, -0.04, 0.45, 0.04, { nu: 8 }); g.ring(0.45, 0.04, 0.05, 0.04, { nu: 8 }); g.m = null; }
      }
      const m = new THREE.Mesh(g.toGeometry(), tileBig); scene.add(m); return m;
    };
    const sweepers = [], SW = [];
    for (let i = 0; i < 6; i++) {
      const z = [-46, -26, -13, 14, 24, 44][i] + mr.range(-1.5, 1.5), dir = mr.chance(0.5) ? 1 : -1, x0 = dir * mr.range(-60, -30), len = mr.range(50, 85);
      sweepers.push({ mesh: figure(true), z, x0, dir, len, speed: mr.range(0.9, 1.4), ph: mr.range(0, 60) });
      SW.push(new THREE.Vector4(z, x0, x0, 1.35));
    }
    SW.push(new THREE.Vector4(0, -136, -66.5, 1.6));       // the swept path across the west courtyard and on through the gateway passage
    SW.push(new THREE.Vector4(-3.14, -207, -150.6, 1.25));      // and the one that leads to the rear door, under the descent
    SW.push(new THREE.Vector4(0, -62, 70.5, 2.5));      // and the one that runs on down the middle of the square into the east arch
    const cart = { mesh: figure(false), ph: mr.range(0, 40) };
    const trails = [];
    for (let i = 0; i < 6; i++) { const a = mr.pick([[-70, mr.range(-20, 20)], [mr.range(-50, 50), 76], [mr.range(-30, 30), -58], stalls[0], stalls[1]]), b = [mr.range(-60, 60), mr.range(-50, 66)]; trails.push(new THREE.Vector4(a[0], a.length > 2 ? a[2] : a[1], b[0], b[1])); }
    trails.push(new THREE.Vector4(-20, 37, 30.5, 1.2), new THREE.Vector4(42, -36, 33, -1.3));      // two more converge on the swept approach from the tea stalls
    await ctx.yield();

    // ---- the old quarter: a lattice of lots turned off the world axes and bent by noise, so lanes wind; lots are
    // dropped along two noise iso-lines (winding streets lined with poplars) and round two small squares, a quarter
    // of them merge into L- and U-shaped compounds, and neighbourhood mosques stand up out of the roofs.
    const qr = rng.fork('quarter'), NZ = ctx.noise, HALF = Math.PI / 2, QC = [-170, 40];
    const p0 = path.pointAt(0), t0 = path.tangentAt(0), heroTree = [p0.x + t0.x * 38 - t0.z * 7, p0.z + t0.z * 38 + t0.x * 7];
    const bakery = [p0.x + t0.x * 47 + t0.z * 10.5, p0.z + t0.z * 47 - t0.x * 10.5];
    const pl = path.pointAt(0.078), tl = path.tangentAt(0.078), loftAt = [pl.x - tl.z * 10, pl.z + tl.x * 10];
    const zones = [[-164, -58, -56, 58], [-84, -74, 84, 94], [-70, -136, 70, -58], [56, -58, 146, 58]];
    const mosques = [[-205, 64], [-118, 152], [-262, 174], [-432, 64], [-228, -152], [-60, 176]].map(([x, z]) => [x + qr.range(-8, 8), z + qr.range(-8, 8), qr.range(4, 5)]).filter((m) => path.nearestXZ(m[0], m[1]).dist > 36);
    // two more stand close to the entry axis, so glazed turquoise shows in the first view: their own rng, so no other draw moves
    for (const [x, z] of [[-352, 236], [-408, 196]]) { const m = [x + zr.range(-3, 3), z + zr.range(-3, 3), zr.range(5.2, 5.9), zr]; if (path.nearestXZ(m[0], m[1]).dist > 22) mosques.push(m); }
    const plazas = [[-236, 120, 15], [-178, -114, 14]].map(([x, z, r]) => [x + qr.range(-10, 10), z + qr.range(-10, 10), r]);
    const rounds = [[HERO_AT[0], HERO_AT[2], 45], [heroTree[0], heroTree[1], 4.5], [loftAt[0], loftAt[1], 5], [bakery[0], bakery[1], 8.5], ...HA.minarets.map((m) => [m.base.x + HERO_AT[0], m.base.z + HERO_AT[2], 8]), ...mosques.map((m) => [m[0], m[1], m[2] + 3.5]), ...plazas];
    const blocked = (x, z, r) => {
      for (const c of rounds) if (Math.hypot(x - c[0], z - c[1]) < c[2] + r) return true;
      for (const q of zones) if (x > q[0] - r && x < q[2] + r && z > q[1] - r && z < q[3] + r) return true;
      return false;
    };
    const GA = qr.range(14, 20) * Math.PI / 180 * (qr.chance(0.5) ? 1 : -1), cg = Math.cos(GA), sg = Math.sin(GA), PIT = 15.2, NG = 38, NW = 2 * NG + 3, WA = qr.range(10, 14), wf = 1 / 230;
    const nodes = new Float32Array(NW * NW * 2);
    for (let j = 0; j < NW; j++) for (let i = 0; i < NW; i++) {
      const gx = (i - NG - 1) * PIT, gz = (j - NG - 1) * PIT, x = QC[0] + gx * cg - gz * sg, z = QC[1] + gx * sg + gz * cg, k = (j * NW + i) * 2;
      nodes[k] = x + WA * NZ.fbm2(x * wf + 11.3, z * wf + 4.1, 2); nodes[k + 1] = z + WA * NZ.fbm2(x * wf - 7.7, z * wf + 19.4, 2);
    }
    await ctx.yield();
    const street = (x, z) => Math.abs(NZ.fbm2(x / 250 + 31, z / 250 + 7, 2)) < 0.042 || Math.abs(NZ.fbm2(x / 310 - 13, z / 310 + 41, 2) - 0.12) < 0.036;
    const chunks = new Map(), lots = [], used = new Uint8Array(NW * NW);
    const toChunk = (L) => { const key = Math.floor((L.x + 800) / 190) + ':' + Math.floor((L.z + 600) / 190); if (!chunks.has(key)) chunks.set(key, []); chunks.get(key).push(L); };
    for (let j = 0; j < NW - 2; j++) for (let i = 0; i < NW - 2; i++) {
      if (i === 0 && j % 4 === 0) await ctx.yield();      // a few rows of lots at a time
      if (used[j * NW + i]) continue;
      const mrg = qr.chance(0.15) ? (qr.chance(0.5) ? 1 : 2) : 0, di = mrg === 1 ? 2 : 1, dj = mrg === 2 ? 2 : 1;
      const lane = qr.range(2.3, 3.4), turn = qr.int(0, 3), jit = qr.range(-0.11, 0.11), skip = qr.chance(0.05 / density), pop = qr.chance(0.5);
      if (i + di >= NW - 1 || j + dj >= NW - 1 || (mrg === 1 && used[j * NW + i + 1])) continue;
      const a = (j * NW + i) * 2, b = (j * NW + i + di) * 2, c = ((j + dj) * NW + i) * 2, d = ((j + dj) * NW + i + di) * 2;
      const x = (nodes[a] + nodes[b] + nodes[c] + nodes[d]) / 4, z = (nodes[a + 1] + nodes[b + 1] + nodes[c + 1] + nodes[d + 1]) / 4;
      if (Math.hypot(x - QC[0], z - QC[1]) > 560) continue;
      const exx = (nodes[b] - nodes[a] + nodes[d] - nodes[c]) / 2, exz = (nodes[b + 1] - nodes[a + 1] + nodes[d + 1] - nodes[c + 1]) / 2;
      const ezx = (nodes[c] - nodes[a] + nodes[d] - nodes[b]) / 2, ezz = (nodes[c + 1] - nodes[a + 1] + nodes[d + 1] - nodes[b + 1]) / 2;
      const lx = Math.hypot(exx, exz), lz = Math.abs(exx * ezz - exz * ezx) / Math.max(lx, 1);
      const near = path.nearestXZ(x, z), tier = near.dist < 40 ? 0 : near.dist < 95 ? 1 : near.dist < 250 ? 2 : 3;
      if (street(x, z) && !mrg) {
        if (pop && tier <= 2 && !blocked(x, z, 2) && near.dist > 9) toChunk({ x: x + lane * 2 - 5.6, z: z + jit * 30, pop: true, tier, pd: near.dist, maxH: near.dist < 15 ? near.y - 8 : 99 });
        continue;
      }
      let w = (turn % 2 ? lz : lx) - lane, dd = (turn % 2 ? lx : lz) - lane, yaw = Math.atan2(-exz, exx) + turn * HALF;
      if (skip || w < 7 || dd < 7 || blocked(x, z, 0.45 * Math.hypot(w, dd))) continue;
      const ahead = (x - p0.x) * t0.x + (z - p0.z) * t0.z, entry = near.u < 0.1 && near.dist < 27 && ahead > 16 && ahead < 70;
      if (entry) { let best = -2; for (let k = 0; k < 4; k++) { const y2 = Math.atan2(-exz, exx) + k * HALF, f = -(Math.sin(y2) * t0.x + Math.cos(y2) * t0.z); if (f > best) { best = f; yaw = y2; w = (k % 2 ? lz : lx) - lane; dd = (k % 2 ? lx : lz) - lane; } } }
      if (mrg === 1) used[j * NW + i + 1] = 1; else if (mrg === 2) used[(j + 1) * NW + i] = 1;
      const L = { x, z, w, d: dd, yaw: yaw + jit, tier, pd: near.dist, maxH: near.dist < 0.5 * Math.hypot(w, dd) + 8 ? near.y - 7.2 : 99, big: !!mrg, entry, deep: season === 'deep', far: tier === 3 && Math.hypot(x - QC[0], z - QC[1]) > 505 };
      if (tier === 0 && near.dist < 27 && near.u > 0.53 && near.u < 0.71) L.under = xr;
      lots.push(L); toChunk(L);
    }
    const fruit = [], fruitFar = [], leaves = [], out = { smoke: [], trees: [], casters: [], fruit, wind: [windXZ.x, windXZ.y], sh: [-sunDir.x / sunDir.y, -sunDir.z / sunDir.y] };
    const fruitful = season === 'deep' ? 0.12 : 1, autumn = season === 'first';
    const leafOn = (tips, every) => { for (let k = 0; k < tips.length; k++) { if (k % every) continue; const f = tips[k]; for (let n = every > 1 ? 1 : 2; n > 0; n--) leaves.push([f[0] + qr.range(-0.4, 0.4), f[1] + qr.range(-0.3, 0.3), f[2] + qr.range(-0.4, 0.4), f[3], qr.range(0.3, 0.45)]); } };
    let built = 0;
    const GZ = new Geo();      // scratch: the outermost lots are drawn into it and thrown away, so every random draw stays where it was
    for (const list of chunks.values()) {
      const G = new Geo();
      for (const L of list) {
        if (++built % 4 === 0) await ctx.yield();      // a few lots at a time
        if (L.pop) {       // a poplar on a winding street
          const H = Math.min(qr.range(10, 15), L.maxH), tips = autumn ? [] : null;
          if (H > 5) { G.aux = 0; poplar(G, qr, L.x, L.z, H, tips); if (tips) leafOn(tips, L.tier <= 1 ? 1 : 3); }
          continue;
        }
        out.trees.length = 0;
        if (L.far) { const nc = out.casters.length; house(GZ, L, qr, out); out.casters.length = nc; continue; }
        house(G, L, qr, out);
        for (const t of out.trees) {
          const tips = []; G.aux = 0; G.limbN = t[4] === 0 && t[3] <= 20 ? 5 : 3;
          bareTree(G, qr, t[0], 0, t[2], qr.range(5.2, 6.6), { levels: t[4] === 0 ? 3 : 2, tips, perTip: t[4] === 0 ? 3 : 2, spread: 0.8 }); G.limbN = 3;
          const far = t[4] > 0 || t[3] > 20 ? fruitFar : fruit;      // beyond about 20 m of the flight line a fruit is a tetrahedron
          for (const f of tips) if (qr.chance(fruitful)) far.push([f[0], f[1], f[2], f[3], far === fruit ? qr.range(0.12, 0.17) : qr.range(0.15, 0.22)]);
        }
        if (L.tier <= 2 && qr.chance(0.11)) {
          const c = Math.cos(L.yaw), sn = Math.sin(L.yaw), ax = L.w / 2 + 1.2, az = L.d / 2 + 1.2, px = L.x + ax * c + az * sn, pz = L.z - ax * sn + az * c, pn = path.nearestXZ(px, pz);
          const H = Math.min(qr.range(9, 13.5), pn.dist < 15 ? pn.y - 8 : 99), tips = autumn ? [] : null;
          if (H > 5 && !blocked(px, pz, 1)) { G.aux = 0; poplar(G, qr, px, pz, H, tips); if (tips) leafOn(tips, L.tier <= 1 ? 1 : 3); }
        }
      }
      await ctx.yield();
      if (G.count) { const mesh = new THREE.Mesh(G.toGeometry(), tileTown); mesh.name = 'quarter'; scene.add(mesh); }
      await ctx.yield();
    }
    // landmarks: neighbourhood mosques (a whitewashed hall, a small striped dome, a short leaning minaret)
    const GX = new Geo(), heroTips = [], rng0q = qr;
    for (const [mx, mz, R, own] of mosques) {
      const qr = own || rng0q;
      const yaw = qr.range(0, TAU), hh = qr.range(5.6, 7.2), hs = R + 1.8, k = R / 9.5, c = Math.cos(yaw), sn = Math.sin(yaw);
      GX.m = null; GX.set(10, 1); BX(GX, mx, hh / 2, mz, hs * 2, hh, hs * 2, yaw, 3, 0.62, 1, qr(), 0.6);
      GX.set(12, 1); for (const e of [-1, 1]) Q(GX, [mx + sn * (hs + 0.05) * e + c * 0.8 * e, 0, mz + c * (hs + 0.05) * e - sn * 0.8 * e], [mx + sn * (hs + 0.05) * e - c * 0.8 * e, 0, mz + c * (hs + 0.05) * e + sn * 0.8 * e], [mx + sn * (hs + 0.05) * e - c * 0.8 * e, 2.6, mz + c * (hs + 0.05) * e + sn * 0.8 * e], [mx + sn * (hs + 0.05) * e + c * 0.8 * e, 2.6, mz + c * (hs + 0.05) * e - sn * 0.8 * e], 0, 0, 0.8, 1, 0.7);
      GX.m = new THREE.Matrix4().makeScale(k, k, k).setPosition(mx, 0, mz); lesserDome(GX, 0, 0, hh / k - 0.4, 9.5, qr, 1);
      const ca = yaw + Math.PI / 4 + HALF * qr.int(0, 3), mxx = mx + Math.cos(ca) * (hs * 1.41 + 1.2), mzz = mz + Math.sin(ca) * (hs * 1.41 + 1.2);
      minaret(GX, new THREE.Matrix4().makeScale(0.5, 0.5, 0.5).setPosition(mxx, 0, mzz), 0, 0, qr, qr.range(0.85, 1.05), 1);
      out.casters.push([mx, mz, hs * 2, hs * 2, yaw, hh + R * 0.9], [mxx, mzz, 2.4, 2.4, 0, 19]);
      await ctx.yield();
    }
    // the bakery by the entry: a row of mud vaults with glowing oven mouths facing the arriving camera, chimneys smoking
    {
      const yawB = Math.atan2(-t0.x, -t0.z), M = new THREE.Matrix4().makeRotationY(yawB).setPosition(bakery[0], 0, bakery[1]), NV = 4, VW = 3.5, VD = 7.2, WH = 2.5, R = VW / 2, v = new THREE.Vector3();
      GX.m = M; GX.set(10, 0); BX(GX, 0, WH / 2, 0, NV * VW + 0.5, WH, VD, 0, 1, 0.6, 1, 0.75);
      for (let i = 0; i < NV; i++) {
        const cx = (i - (NV - 1) / 2) * VW, g = 0.55 + 0.3 * qr();
        GX.set(10, 0);
        GX.grid(8, 1, (a, t, q) => { const an = a * Math.PI; q.x = cx + Math.cos(an) * R; q.y = WH + Math.sin(an) * R * 0.95; q.z = -VD / 2 + VD * t; q.u = a * 5.4; q.v = t * VD; q.g = g; }, false, true);
        for (const e of [1, -1]) GX.grid(8, 1, (a, t, q) => { const an = a * Math.PI; q.x = cx + Math.cos(an) * R; q.y = WH + Math.sin(an) * R * 0.95 * (1 - t); q.z = e * VD / 2; q.u = q.x; q.v = q.y; q.g = g; q.ao = 0.85; }, false, e > 0);
        GX.set(12, 0); Q(GX, [cx - 0.75, 0.25, VD / 2 + 0.04], [cx + 0.75, 0.25, VD / 2 + 0.04], [cx + 0.75, 1.75, VD / 2 + 0.04], [cx - 0.75, 1.75, VD / 2 + 0.04]);
        GX.set(12, 3); Q(GX, [cx - 0.55, 0.45, VD / 2 + 0.08], [cx + 0.55, 0.45, VD / 2 + 0.08], [cx + 0.55, 1.5, VD / 2 + 0.08], [cx - 0.55, 1.5, VD / 2 + 0.08], 0, 0, 1, 1, 0, qr());
        GX.set(10, 0); BX(GX, cx + 0.3, WH + R + 0.5, -VD / 2 + 1.3, 0.7, 1.9, 0.7, 0, 3, 0.8, 0.9, 0.4);
        v.set(cx + 0.3, WH + R + 1.5, -VD / 2 + 1.3).applyMatrix4(M); out.smoke.push([v.x, v.y, v.z, -1 + i * 0.1]);
      }
      GX.set(7, 0); BX(GX, -NV * VW / 2 - 1.2, 0.7, 1.5, 0.8, 1.4, 3.2, 0, 3, 0.6, 1);      // firewood
      GX.m = null; out.casters.push([bakery[0], bakery[1], NV * VW, VD, yawB, WH + R * 0.7]);
    }
    // under the descent: poplars on the sunward side of the flight's ground line wherever no house stands (their
    // shadows stripe the open snow the camera looks down on), and walkers on the trodden track that follows it
    {
      const inLot = (x, z, m) => { for (const L of lots) { if (L.pd > 70) continue; const dx = x - L.x, dz = z - L.z, c = Math.cos(L.yaw), sn = Math.sin(L.yaw); if (Math.abs(dx * c - dz * sn) < L.w / 2 + m && Math.abs(dx * sn + dz * c) < L.d / 2 + m) return true; } return false; };
      const pv = new THREE.Vector3(), tv = new THREE.Vector3(), ptips = autumn ? [] : null; let pk = 28;
      GX.m = null; GX.aux = 0;
      for (let i = 0; i < 10; i++) {
        const uu = 0.58 + i * 0.0115 + xr.range(-0.003, 0.003); path.pointAt(uu, pv); path.tangentAt(uu, tv); tv.y = 0; tv.normalize();
        const o0 = xr.range(10.5, 13.5), H = Math.min(xr.range(8.5, 11.5), pv.y - 4);
        for (let k = 0; k < 3; k++) {      // the nearest free spot 10 to 23 m to the right of the flight line
          const off = o0 + k * 4.6, x = pv.x - tv.z * off, z = pv.z + tv.x * off;
          if (pk < NPOST && x < -169 && H > 6 && !inLot(x, z, 1.6) && !blocked(x, z, 1)) { poplar(GX, xr, x, z, H, ptips); POST[pk++].set(x, z, 0.5, H); break; }
        }
      }
      if (ptips) leafOn(ptips, 1);
      for (let i = 0; i < 7; i++) {
        const uu = 0.612 + i * 0.012 + xr.range(-0.004, 0.004); path.pointAt(uu, pv); path.tangentAt(uu, tv); tv.y = 0; tv.normalize();
        const yaw = Math.atan2(tv.x, tv.z) + (xr.chance(0.5) ? Math.PI : 0);
        for (let j = xr.int(1, 2); j > 0; j--) {
          const sd = xr.range(-1.1, 1.1), al = xr.range(-1.2, 1.2), x = pv.x - tv.z * sd + tv.x * al, z = pv.z + tv.x * sd + tv.z * al;
          if (x < -158 && !inLot(x, z, 0.9)) { GX.m = new THREE.Matrix4().makeRotationY(yaw + xr.range(-0.3, 0.3)).setPosition(x, 0, z); person(GX, xr); out.casters.push([x, z, 0.6, 0.6, 0, 1.8]); }
        }
      }
      GX.m = null;
    }
    await ctx.yield();
    // the persimmon that opens the flight, and the pigeon loft whose flock leads the way
    GX.aux = 0; GX.limbN = 5; bareTree(GX, qr, heroTree[0], 0, heroTree[1], 10.6, { levels: 4, limbs: 5, tips: heroTips, perTip: 2, spread: 0.85, trunk: 0.36, up: 0.34, bole: 0.4 }); GX.limbN = 3;
    const fruitBest = [];
    for (const f of heroTips) fruitBest.push([f[0], f[1], f[2], f[3], qr.range(0.14, 0.19)]);
    for (const f of courtTips) if (qr.chance(Math.max(fruitful, 0.4))) fruit.push([f[0], f[1], f[2], f[3], qr.range(0.13, 0.18)]);
    if (autumn) leafOn(squareTips, 1);
    GX.set(10, 0); BX(GX, loftAt[0], 2.6, loftAt[1], 4.6, 5.2, 4.6, 0.2, 3, 0.62, 1, 0.3);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const bx = loftAt[0] + (i - 1) * 1.25, by = 5.2 + 0.6 + j * 1.15;
      GX.set(10, 1); BX(GX, bx, by, loftAt[1], 1.15, 1.1, 1.5, 0.2, 3, 0.85, 1, 0.2, 0);
      GX.set(12, 0); for (const s of [-1, 1]) Q(GX, [bx - 0.2 * s, by - 0.1, loftAt[1] + 0.77 * s], [bx + 0.2 * s, by - 0.1, loftAt[1] + 0.77 * s], [bx + 0.2 * s, by + 0.3, loftAt[1] + 0.77 * s], [bx - 0.2 * s, by + 0.3, loftAt[1] + 0.77 * s]);
    }
    GX.set(7, 0); BX(GX, loftAt[0], 5.3, loftAt[1], 4.4, 0.12, 2.2, 0.2, 3);
    await ctx.yield();
    scene.add(new THREE.Mesh(GX.toGeometry(), tileTown));
    await ctx.yield();
    if (fruit.length) scene.add(makeFruit(fruit, U, '#F0600C', 3));
    await ctx.yield();
    scene.add(makeFruit(fruitBest, U, '#F0600C', 0));
    await ctx.yield();
    if (fruitFar.length) scene.add(makeFruit(fruitFar, U, '#F0600C', 1));
    await ctx.yield();
    if (leaves.length) scene.add(makeFruit(leaves, U, '#E2B21E', 2));
    await ctx.yield();

    // ---- ground map: R = shadows of houses, wings and court walls for this sun, G = trodden lanes round every lot
    const MS = 1024, MAP = [-760, -520, 1120], data = new Uint8Array(MS * MS * 4), mk = MS / MAP[2];
    const texel = (v, o) => Math.max(0, Math.min(MS - 1, Math.round((v - o) * mk)));
    // rotated rectangle swept along (sx, sz): calls fn(index) for every texel inside
    const sweep = (cx, cz, hw, hd, yaw, sx, sz, fn) => {
      const c = Math.cos(yaw), sn = Math.sin(yaw), ex = Math.abs(hw * c) + Math.abs(hd * sn), ez = Math.abs(hw * sn) + Math.abs(hd * c);
      const i0 = texel(cx - ex + Math.min(0, sx), MAP[0]), i1 = texel(cx + ex + Math.max(0, sx), MAP[0]), j0 = texel(cz - ez + Math.min(0, sz), MAP[1]), j1 = texel(cz + ez + Math.max(0, sz), MAP[1]);
      const slx = sx * c - sz * sn, slz = sx * sn + sz * c;      // sweep in the rectangle's own frame
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = MAP[0] + i / mk - cx, pz = MAP[1] + j / mk - cz, lx = px * c - pz * sn, lz = px * sn + pz * c;
        let lo = 0, hi = 1;
        if (Math.abs(slx) > 1e-3) { const a = (lx - hw) / slx, b = (lx + hw) / slx; lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); } else if (lx < -hw || lx > hw) continue;
        if (Math.abs(slz) > 1e-3) { const a = (lz - hd) / slz, b = (lz + hd) / slz; lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); } else if (lz < -hd || lz > hd) continue;
        if (lo <= hi) fn((j * MS + i) * 4);
      }
    };
    let swept = 0;      // lots and casters are swept a batch at a time
    for (const L of lots) { if (!L.far) sweep(L.x, L.z, L.w / 2 + 2.6, L.d / 2 + 2.6, L.yaw, 0, 0, (k) => { data[k + 1] = 150 + ((k * 7) % 100); }); if (++swept % 128 === 0) await ctx.yield(); }
    for (const m of [...mosques, ...plazas]) sweep(m[0], m[1], m[2] + 7, m[2] + 7, 0.6, 0, 0, (k) => { data[k + 1] = 120 + ((k * 7) % 110); });
    sweep(-156.8, 0, 2.6, 60, 0.02, 0, 0, (k) => { data[k + 1] = 140 + ((k * 7) % 100); });      // the lane along the west madrasa's rear wall
    { const pv = new THREE.Vector3(), tv = new THREE.Vector3(); for (let uu = 0.596; uu < 0.712; uu += 0.004) { path.pointAt(uu, pv); path.tangentAt(uu, tv); sweep(pv.x, pv.z, 1.7, 2.4, Math.atan2(-tv.z, tv.x) + Math.PI / 2, 0, 0, (k) => { data[k + 1] = 150 + ((k * 7) % 100); }); } }      // the track under the descent
    for (const f of laneFolk) out.casters.push([f[0], f[1], 0.6, 0.6, 0, 1.8]);
    await ctx.yield();
    for (const L of lots) {
      if (!L.far) sweep(L.x, L.z, L.w / 2 - 0.2, L.d / 2 - 0.2, L.yaw, 0, 0, (k) => { data[k + 1] = 0; });
      if (L.tier < 3 || L.pd < 430) out.casters.push([L.x, L.z, L.w, L.d, L.yaw, 2.3]);
      if (++swept % 128 === 0) await ctx.yield();
    }
    await ctx.yield();
    const shx = -sunDir.x / sunDir.y, shz = -sunDir.z / sunDir.y;
    for (const c of out.casters) { sweep(c[0], c[1], c[2] / 2, c[3] / 2, c[4], shx * c[5], shz * c[5], (k) => { data[k] = 255; }); if (++swept % 64 === 0) await ctx.yield(); }
    await ctx.yield();
    const map = new THREE.DataTexture(data, MS, MS, THREE.RGBAFormat);
    map.minFilter = THREE.LinearMipmapLinearFilter; map.magFilter = THREE.LinearFilter; map.generateMipmaps = true; map.needsUpdate = true;
    await ctx.yield();
    const groundMat = groundMaterial(U, C, { uBoxA, uBoxB, uCyl }, { uMap: { value: map }, uMapRect: { value: new THREE.Vector4(MAP[0], MAP[1], 1 / MAP[2], 1 / MAP[2]) }, uSquare: { value: new THREE.Vector4(-70, -60, 70, 76) },
      uSweep: { value: SW }, uTrail: { value: trails }, uPost: { value: POST }, uWindXZ: { value: windXZ } });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000).rotateX(-Math.PI / 2), groundMat); ground.position.set(-150, 0, 0); ground.name = 'ground'; scene.add(ground);
    await ctx.yield();

    // ---- smoke from the nearest chimneys and ovens, steam from the samovars and a cell doorway; the rare shedding's
    // powder skirt: a ring off the cornice that has all let go by u 0.50, and a cloud hanging on the camera's line
    out.smoke.sort((a, b) => a[3] - b[3]);
    const emitters = out.smoke.slice(0, Math.round(28 * Math.min(1.2, density))).map((e) => [e[0], e[1], e[2], qr.range(0.8, 1.25) * (e[3] < 0 ? 1.5 : 1), 0]);
    for (const s of stalls) emitters.push([s[0], s[1], s[2], 0.55, 1], [s[0] + 0.2, s[1], s[2] - 0.1, 0.4, 1]);
    emitters.push([-112, 1.6, -28.4, 0.5, 1], [-112.4, 1.2, -28.2, 0.4, 1]);
    const shedPuffs = [], shedA0 = Math.atan2(HA.slab.outward.z, HA.slab.outward.x), SHED_U = RELEASE_U;
    if (rare) {
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * TAU + qr.range(-0.03, 0.03), da = Math.abs(((a - shedA0 + Math.PI * 3) % TAU) - Math.PI);
        shedPuffs.push([HERO_AT[0] + Math.cos(a) * 15.8, 30.4 + qr.range(-0.5, 1), HERO_AT[2] + Math.sin(a) * 15.8, da * 0.25 + qr.range(0.4, 1.2), Math.cos(a), Math.sin(a), 0]);
      }
      const pp = new THREE.Vector3();
      for (let i = 0; i < 60; i++) {
        const uu = 0.47 + 0.09 * (i + qr()) / 60; path.pointAt(uu, pp);
        const ox = pp.x - HERO_AT[0], oz = pp.z - HERO_AT[2], ol = Math.hypot(ox, oz) || 1, off = qr.range(-7, 4);
        shedPuffs.push([pp.x - ox / ol * off + qr.range(-3, 3), pp.y + qr.range(-7, 1.5), pp.z - oz / ol * off + qr.range(-3, 3), Math.max(0.2, (uu - SHED_U) * duration - qr.range(0.9, 1.7)), ox / ol * 0.3, oz / ol * 0.3, 1]);
      }
    }
    const smoke = makeSmoke(emitters, shedPuffs, qr, U, uShed); scene.add(smoke);
    await ctx.yield();

    // ---- birds: the white flock that leads the way, rooks round the minarets, sparrows, cornice pigeons that lift
    const fr = rng.fork('fauna'), white = { body: '#f4f6fa', belly: '#ffffff', wingC: '#eef1f7', tip: '#dfe5ee', head: '#f6f7fa', tailC: '#eceff5', beak: '#d8a070' };
    const slate = { body: '#5c6880', belly: '#8a94a8', wingC: '#4a556c', tip: '#232a3a', head: '#3c465c', tailC: '#39435a', beak: '#c8a080' };
    const fauna = F.makeFauna(scene, { light: { sunDir, sunColor: cSunCol.clone().multiplyScalar(0.3), sky: cSkyClear, ground: cBounceClear } });
    const pigeon = { species: 'crows', fingers: 0, span: 0.43, chord: 0.27, girth: 0.1, size: 0.8, flap: 7, glide: 0.05, amp: 0.8 };      // the kit's broad-winged bird: compact, quick-beating, no sickle wings
    // the lead flock rides its own line: the camera path plus, on the last stretch, a climb and one wheel round the
    // flight axis that closes onto the portal centre (a path-shaped object the kit's `along` route can sample)
    const PL = path.length, _ft = new THREE.Vector3();
    const flockLine = (side0, up0, ph) => ({
      length: PL,
      tangentAtDist(d, o) { return path.tangentAtDist(Math.min(d, PL), o); },
      posAtDist(d, o) {
        const u = d / PL, dd = Math.min(d, PL); path.posAtDist(dd, o); path.tangentAtDist(dd, _ft); _ft.y = 0; _ft.normalize();
        if (d > PL) o.addScaledVector(_ft, d - PL);
        const k = sm(0.845, 0.88, u) * (1 - sm(0.955, 0.995, u)), a = clamp((u - 0.845) / 0.15, 0, 1) * TAU + ph, cl = 1 - sm(0.9, 1.0, u);
        const side = side0 * cl + Math.sin(a) * 8.5 * k, up = up0 * cl + (0.5 - 0.5 * Math.cos(a)) * 5 * k;
        o.x -= _ft.z * side; o.z += _ft.x * side; o.y += up; return o;
      },
    });
    const whites = [];
    // CLEAR AIR BY PLACE (flock cure 1): every flock keeps its own course, height and spread. The kit moves each bird aside or upward, never downward,
    // by what it alone lacks of 2 m from the flown line (keepClear with each, kit texts O and P); every scatter is held at three sigma; the weave of
    // the birds that fly near the line is small, so that a bird is moved no further than it must be. The lofts fly on our own line, the rooks' course
    // runs 1.5 m under it and the gateway lift's 1.5 m over it: nine in ten of those birds and more are moved (the white loft by 4 m at the median,
    // the rooks by 9 m, upward). The swifts cross 5.5 m under it: those that lack air, 28 to 46 in a hundred by the crossing over forty-eight seeds,
    // are lifted 6 to 10 m and pass over it. The flocks that are with us the whole way are cleared against the whole line; a crossing against the
    // stretch of the flight about its own moment (a quarter of the flight either side). All of them draw from the one stream `fr`: each flock is
    // made by the stepped maker and awaited before the next draw.
    const clearOf = { path, dist: 2, each: true, up: true, from: 0, to: 1, step: 2 }, clearAt = (u) => ({ ...clearOf, from: Math.max(0, u - 0.25), to: Math.min(1, u + 0.25) });
    await ctx.yield();
    const lead = fauna.add(await F.makeFlockAsync({ rng: fr, ...pigeon, ...white, size: 1.3, amp: 0.95, count: mixedLoft ? 28 : 40, spread: [8, 3, 5], wander: [0.8, 0.5, 0.8, 0.5], maxSigma: 3, keepClear: clearOf, along: { path: flockLine(1.2, 2.7, 0), side: 0, up: 0, lead: 14, from: 0.066, to: 1.1, drift: 0, points: 150 } }, ctx.yield), { always: true });
    whites.push(lead);
    await ctx.yield();
    if (mixedLoft) fauna.add(await F.makeFlockAsync({ rng: fr, ...pigeon, ...slate, size: 1.05, count: 14, spread: [9, 3, 6], wander: [0.8, 0.5, 0.8, 0.8], maxSigma: 3, keepClear: clearOf, along: { path: flockLine(-3.5, 4.6, 0.5), side: 0, up: 0, lead: 16, from: 0.07, to: 1.1, drift: 0, points: 150 } }, ctx.yield), { always: true });
    await ctx.yield();
    const mTop = HA.minarets[0] ? W(HA.minarets[0].top) : V3(-322, 44, 80);
    if (kites) fauna.add(await F.makeFlockAsync({ rng: fr, species: 'eagles', count: 2, center: [10, 58, -6], radius: 46, spread: [70, 22, 70], maxSigma: 3, keepClear: clearOf, body: '#5a3a22', wingC: '#6e4a2c', tip: '#1c140e' }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: fr, species: 'crows', size: 1.1, count: kites ? 10 : 18, center: [mTop.x + 38, mTop.y + 2, mTop.z - 12], radius: 24, spread: [18, 8, 18], wander: [4, 2, 4, 0.4], maxSigma: 3, keepClear: clearOf, body: '#0c0c12', wingC: '#101018', tip: '#050508' }, ctx.yield), { always: true });
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: fr, species: 'crows', size: 0.95, count: 12, spread: [5, 1.6, 9], wander: [0.8, 0.5, 0.8, 0.4], maxSigma: 3, keepClear: clearAt(0.75), body: '#0c0c12', wingC: '#101018', tip: '#050508',
      cross: { path, u: 0.75, lead: 2, span: 60, angle: 20, side: 1, height: -1.5, rise: 5, offset: 3, bow: 1, duration } }, ctx.yield));      // rooks flushed off the rear parapet as we arrive: they lift ahead over the vaults and the camera overtakes them in the courtyard (flock cure 1: their course runs 1.5 m under our line, so nine in ten are lifted, 8.5 m at the median, and pass about 7 m over it)
    await ctx.yield();
    for (const [uu, sd] of [[0.045, 1], [0.13, -1], [0.215, 1]]) { fauna.add(await F.makeFlockAsync({ rng: fr, species: 'swifts', lod: 'low', count: Math.round(40 * density), size: 0.95, flap: 11, glide: 0.1, body: '#6e5338', belly: '#b8a288', wingC: '#59422c', tip: '#2e2218',
      spread: [9, 3, 9], wander: [1.2, 0.8, 1.2, 0.7], maxSigma: 3, keepClear: clearAt(uu), cross: { path, u: uu, lead: 15, span: 80, angle: 50, side: sd, height: -5.5, rise: 7, duration } }, ctx.yield)); await ctx.yield(); }
    await ctx.yield();
    const lifts = [[0.64, -1, 20, 30, 38], [0.78, 1, 22, 20, 38], [0.9, -1, 20, 34, 38], [0.705, 1, 26, 26, 7]];      // the last flies down the gateway passage (flock cure 1: parted about our line there, nine in ten of it moved aside or upward)
    if (rare) lifts.push([0.62, 1, 100, 58, 30], [0.66, -1, 90, 48, 34], [0.70, 1, 110, 44, 26]);
    for (const [uu, sd, n, ld, ang] of lifts) {
      const isW = ang < 10 || fr.chance(0.7), big = n > 60;
      const f = fauna.add(await F.makeFlockAsync({ rng: fr, ...pigeon, lod: big ? 'low' : 'high', size: big ? 0.95 : 0.88, ...(isW ? white : slate), count: n, spread: ang < 10 ? [7, 3, 22] : big ? [34, 10, 30] : [16, 5, 16], wander: [0.8, 0.5, 0.8, 0.4], maxSigma: 3, keepClear: clearAt(uu), cross: { path, u: uu, lead: ld, span: ang < 10 ? 150 : 170, angle: ang, side: sd, height: ang < 10 ? 1.5 : big ? 12 : 9, rise: ang < 10 ? 1 : big ? 26 : 16, duration } }, ctx.yield));
      if (isW) whites.push(f);
      await ctx.yield();
    }

    // ---- air: driven snow that thins to nothing, ice dust that lights in the sun
    const time = { value: 0 };
    const snowOpt = weather === 'calm' ? { count: Math.round(3200 * detail), velocity: [0.7, -1.25, 0.3], velocityRandom: [0.4, 0.3, 0.4], size: [0.1, 0.24], turbulence: [0.7, 0.15, 0.5] }
      : weather === 'rime' ? { count: Math.round(3000 * detail), velocity: [2.6, -0.2, -1.9], velocityRandom: [0.9, 0.3, 0.9], size: [0.035, 0.085], turbulence: [0.9, 0.4, 0.9] }
        : { count: Math.round(5200 * detail), velocity: [U.uWind.value.x * 8.5, -3.6, U.uWind.value.z * 8.5], velocityRandom: [1.6, 0.9, 1.6], size: [0.07, 0.2], turbulence: [0.9, 0.25, 0.8], mode: 'streak', stretch: 0.045 };
    const snow = fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', box: [54, 36, 54], time, colors: lookId === 'dusk' ? ['#c8d4f2', '#9fb0dc', '#e6ecff'] : ['#ffffff', '#b9c8e2', '#93a6c8'], additive: 0, opacity: 0.95, ...snowOpt });
    await ctx.yield();
    const glint = fx.makeParticles({ rng: rng.fork('glint'), preset: 'dust', count: Math.round(2400 * detail), box: [64, 38, 64], velocity: [U.uWind.value.x * 0.9, -0.2, U.uWind.value.z * 0.9], size: [0.03, 0.075],
      colors: lookId === 'late' ? ['#fff0d0', '#ffffff', '#ffd9a8'] : ['#ffffff', '#eaf4ff', '#d8ecff'], intensity: 2.4, twinkle: 1, time });
    await ctx.yield();
    const rush = fx.makeParticles({ rng: rng.fork('rush'), preset: 'snow', count: Math.round((weather === 'rime' ? 300 : 900) * detail), box: [20, 13, 20], time, colors: ['#ffffff', '#dfe8f6', '#c4d2ea'], additive: 0, opacity: 0.9,
      velocity: weather === 'calm' ? [1.2, -1.6, 0.5] : [U.uWind.value.x * 9, -3.2, U.uWind.value.z * 9], velocityRandom: [2, 1, 2], size: weather === 'calm' ? [0.05, 0.11] : [0.025, 0.06], turbulence: [0.6, 0.3, 0.6], mode: 'streak', stretch: weather === 'calm' ? 0.02 : 0.05, near: [0.6, 2.2] });
    glint.setOpacity(0); scene.add(snow.object, glint.object, rush.object);
    await ctx.yield();
    // freezing fog: banks of it drift across the roofs and the path until the air clears
    const banks = weather === 'rime' ? fx.makeMist({ rng: rng.fork('banks'), count: Math.round(44 * detail), area: [240, 24, 240], center: [0, -2, 0], size: [28, 56], color: cDomeWhite.clone().lerp(cWhite, 0.4), opacity: 0.36, drift: [4.4, 0, -3.2], follow: true, time }) : null;
    if (banks) scene.add(banks.object);
    await ctx.yield();
    // depth in the snowfall: tall curtains of it drifting down the wind between the camera and the landmarks, and a
    // far layer of big soft flakes out to 75 m, so the storm recedes instead of ending 27 m from the lens
    const veilK = weather === 'calm' ? 0.12 : 0.15;
    const veils = weather === 'rime' ? null : fx.makeMist({ rng: rng.fork('veils'), count: Math.round(14 * detail), area: [320, 40, 320], center: [0, 24, 0], size: [50, 110], color: cWhite.clone().multiplyScalar(0.85).lerp(col(look.sunCol, look.whiteK), 0.12), opacity: veilK,      // the fog's own colour, a little darker: curtains of snow against the slate, not a white wash over it
      drift: [U.uWind.value.x * 7.5, 0, U.uWind.value.z * 7.5], follow: true, time });
    if (veils) scene.add(veils.object);
    await ctx.yield();
    const farSnow = fx.makeParticles({ rng: rng.fork('far-snow'), preset: 'snow', count: Math.round((weather === 'rime' ? 600 : 1800) * detail), box: [150, 60, 150], time, colors: lookId === 'dusk' ? ['#c8d4f2', '#aebde4', '#e6ecff'] : ['#ffffff', '#fff3e0', '#cfdcf2'], additive: 0, opacity: 0.5,
      velocity: weather === 'calm' ? [0.7, -1.25, 0.3] : weather === 'rime' ? [2.6, -0.2, -1.9] : [U.uWind.value.x * 8.5, -3.6, U.uWind.value.z * 8.5], velocityRandom: [1.6, 0.9, 1.6], size: [0.25, 0.6], turbulence: [0.9, 0.25, 0.8], near: [10, 30] });
    scene.add(farSnow.object);
    await ctx.yield();

    // ---- frame state (no allocation in update)
    const skyC = new THREE.Color(), bncC = new THREE.Color(), sunC = new THREE.Color(), fogC = scene.fog.color, EDGE = [EN[0], EN[1], 0, 15];
    const domeC = cDomeWhite.clone(); SQ.uWhite.value = domeC;
    const lightArg = { sun: sunDir, sunColor: cSunCol, sunAmount: 0.1, sky: skyC, bounce: bncC, edge: EDGE };
    const calm = weather === 'calm', rime = weather === 'rime';
    // the gaze follows the slab: dome, then the groove's top as it cracks, the bulge as it slides, the cornice as it bursts
    const domeMid = V3(HERO_AT[0], 46.5, HERO_AT[2]), slabTop = W(HA.slab.top), slabBulge = W(HA.slab.bulge), slabCor = W(HA.slab.cornice).add(V3(0, 2.5, 0)), poiV = new THREE.Vector3();
    const camAng = (u) => { path.pointAt(u, poiV); return Math.atan2(poiV.z - HERO_AT[2], poiV.x - HERO_AT[0]); };
    const slabAng = Math.atan2(HA.slab.outward.z, HA.slab.outward.x) + TAU;
    const U_BULGE = RELEASE_U + 0.03, U_COR = RELEASE_U + 0.048, U_ON = RELEASE_U + 0.08;
    const domePoi = (tt, u) => {
      // the whole dome stays in frame: the gaze leans from its middle toward the slab, never all the way onto it
      if (u < U_COR) {
        if (u < RELEASE_U) poiV.copy(slabTop); else if (u < U_BULGE) poiV.copy(slabTop).lerp(slabBulge, sm(RELEASE_U, U_BULGE, u)); else poiV.copy(slabBulge).lerp(slabCor, sm(U_BULGE, U_COR, u));
        return poiV.lerp(domeMid, 1 - 0.4 * sm(RELEASE_U - 0.04, RELEASE_U, u));
      }
      // then forward along the lit ribs to the flank ahead (in the rare shedding: the skirt pouring off the north shoulder)
      let ca = camAng(u); if (ca < 0) ca += TAU; if (ca < slabAng - 1) ca += TAU;
      const k = sm(U_COR, U_ON, u), a = lerp(slabAng, ca + 0.2, k), r = lerp(15.6, 9, k);
      poiV.set(HERO_AT[0] + Math.cos(a) * r, lerp(33.4, rare ? 40 : 45, k), HERO_AT[2] + Math.sin(a) * r);
      return poiV.lerp(domeMid, 0.6 * (1 - k));
    };
    const wSky = new THREE.Color(), wGround = new THREE.Color(), wSun = new THREE.Color(), cCobalt = col(PALETTE[2], 2.0), wFloor = lookId === 'dusk' ? 0.45 : 1;
    for (const f of whites) { const fu = f.uniforms; if (fu.uFill) fu.uFill.value = 0.6; if (fu.uRim) fu.uRim.value = 0.8; }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      // hurry through the whiteout, linger round the dome and over the reveal, then an even approach
      pace: (u) => 1 + 0.3 * sm(0.05, 0.11, u) * (1 - sm(0.3, 0.37, u)) - 0.26 * sm(0.37, 0.42, u) * (1 - sm(0.55, 0.6, u)) - 0.2 * sm(0.6, 0.63, u) * (1 - sm(0.7, 0.75, u)),
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 28, sway: 0.8, bank: 0.6 },
      pois: [
        { at: [HERO_AT[0], 46, HERO_AT[2]], from: 0.12, to: 0.4, weight: 0.55 },
        { at: domePoi, from: 0.33, to: rare ? 0.6 : 0.555, weight: 0.9, fade: 0.2 },      // holds the whole dome in the middle of the frame all the way round
        { at: [20, 16, -6], from: rare ? 0.56 : 0.49, to: 0.68, weight: 0.7, fade: 0.3 },      // the three gateways, as soon as the dome lets the gaze go
        { at: [76, 13, 0], from: rare ? 0.63 : 0.6, to: 0.75, weight: 0.4 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.1, revealDistance: 320 },
      post: {
        exposure: look.exposure, bloom: { strength: 0.42, radius: 0.5, threshold: 0.94 },
        grade: { saturation: lookId === 'dusk' ? 0.95 : 1.06, contrast: 1.05, tint: lookId === 'late' ? '#fff6ea' : '#f3f7ff', shadowTint: '#050b2c', vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      ride: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        camPos.setFromMatrixPosition(camera.matrixWorld);      // the camera behind a portal has its matrix set directly
        const clear = sm(0.38, 0.66, u), clearL = sm(0.37, 0.47, u), amt = 0.1 + 0.9 * sm(LIGHT_U - 0.038, LIGHT_U + 0.017, u), edge = edgeAt(u), cp = camPos;
        const lit = 1 - sm(-15, 15, cp.x * EN[0] + cp.z * EN[1] - edge);
        // one function of u: fog, sky, light, the travelling shadow edge (the fog is thinner at the door so the entry reads)
        scene.fog.density = lerp(fogIn, fog0, sm(0.08, 0.15, u)) * Math.pow((rime ? lerp(0.0042, fog1, sm(0.74, 0.86, u)) : fog1) / fog0, clear);
        fogC.copy(cWhite).lerp(cFogClear, clear); domeC.copy(cDomeWhite).lerp(cFogClear, clear);
        skyC.copy(cSkySquall).lerp(cSkyClear, clearL); bncC.copy(cBounceSquall).lerp(cBounceClear, clearL);      // the fill turns blue as the hole opens overhead, ahead of the fog
        EDGE[2] = edge; lightArg.sunAmount = amt;
        hero.setProgress(u); hero.setLight(lightArg);
        if (rare) { const s = (u - SHED_U) * duration; hero.setShed(s); uShed.value = s; }
        hero.update(dt, t, camera);
        U.uFogCap.value = lerp(0.42, 1, sm(0.3, 0.6, u)); uFogCapQ.value = lerp(0.82, 1, sm(0.3, 0.6, u));      // landmarks and far roofs stay as cobalt silhouettes
        // the squall's own light: a soft key through the cloud, the pool of sun under the hole, glaze that keeps its colour
        const sk = sm(0, 0.36, u), sv = U.uShaft.value;
        sv.x = lerp(SHAFT0[0], SHAFT1[0], sk); sv.y = lerp(SHAFT0[1], SHAFT1[1], sk); sv.w = shaftK * (1 - sm(0.35, 0.45, u));
        U.uKey.value = keyK * (1 - 0.6 * sm(0.37, 0.5, u)); U.uGhost.value = 0.35 * (1 - clear);
        const s2 = U.uShaft2.value, b2 = shaft2K * (1 - sm(0.3, 0.41, u));      // it sails ahead of us and is lost in the clearing itself
        path.pointAt(Math.min(u + 0.07, 0.45), shV); s2.x = shV.x - 6; s2.y = shV.z; s2.w = b2;
        { const hv = SQ.uHole.value, hx = sv.x + sunDir.x * 150 - cp.x, hy = 150 * sunDir.y + 40 - cp.y, hz = sv.y + sunDir.z * 150 - cp.z, hl = Math.hypot(hx, hy, hz) || 1; hv.set(hx / hl, hy / hl, hz / hl, sv.w * sm(60, 160, hl)); }
        if (rime) U.uFogTop.value = lerp(45, 5, sm(0.3, 0.6, u));      // the freezing fog burns off from the top and stays as a sea in the lanes
        SQ.uWhiteout.value = lerp(1 - sm(0.38, 0.57, u), 1, calm ? 0.12 : 0); SQ.uVeil.value = calm ? 0.55 * clear : 0;
        SQ.uCam.value.set(cp.x, cp.z); dome.position.copy(cp);
        hemiL.color.copy(skyC); hemiL.groundColor.copy(bncC); sunL.intensity = 2.6 * amt * lit;
        sky.update(dt, t, camera); ridges.update(dt, t, camera);
        // birds take the same light; the white flocks are lit apart so they stay white against fog, tile and snow
        sunC.copy(cSunCol).multiplyScalar(0.3 * amt * lit);
        for (const it of fauna.items) { const fu = it.f.uniforms; if (fu && fu.uSunColor) { fu.uSunColor.value.copy(sunC); fu.uSkyColor.value.copy(skyC).multiplyScalar(0.92); fu.uGroundColor.value.copy(bncC); } }
        // the white flocks: sky floors keep them white in the whiteout and ease off once the sun carries them
        const wf = wFloor * lerp(1, 0.74, sm(0.5, 0.64, u) * amt * lit);
        wSky.copy(fogC).multiplyScalar(lerp(3.9, 2.0, clear)); wSky.r = Math.max(wSky.r, 2.0 * wf); wSky.g = Math.max(wSky.g, 2.2 * wf); wSky.b = Math.max(wSky.b, 2.5 * wf);
        // undersides go blue-grey so the flock separates from the white sky
        wGround.copy(bncC).multiplyScalar(1.1).lerp(cCobalt, lerp(0.6, 1, sm(0.55, 0.65, u)));
        wSun.copy(cSunCol).multiplyScalar(0.3 * Math.max(amt * lit, U.uKey.value, 0.85 * b2));
        for (let i = 0; i < whites.length; i++) { const fu = whites[i].uniforms; fu.uSunColor.value.copy(wSun); fu.uSkyColor.value.copy(wSky); fu.uGroundColor.value.copy(wGround); }
        fauna.update(dt, t, camera, u);
        snow.setOpacity(calm ? lerp(1, 0.32, clear) : rime ? 0.85 * (1 - clear) : 1 - sm(0.36, 0.62, u));
        glint.setOpacity(sm(0.41, 0.46, u) * lit * (lookId === 'dusk' ? 0.45 : 1));
        // (a draught carries loose snow through the gateway passage)
        rush.setOpacity(Math.max(calm ? lerp(1, 0.4, clear) : 1 - sm(0.42, 0.6, u), 0.5 * sm(0.74, 0.79, u) * (1 - sm(0.84, 0.9, u))));
        snow.update(dt, t, camera); glint.update(dt, t, camera); rush.update(dt, t, camera);
        if (banks) { banks.uniforms.uOpacity.value = 0.36 * (1 - 0.5 * sm(0.36, 0.56, u)) * (1 - sm(0.74, 0.86, u)); banks.update(dt, t, camera); }
        if (veils) { veils.uniforms.uOpacity.value = veilK * (calm ? lerp(1, 0.3, clear) : 1 - sm(0.36, 0.6, u)); veils.update(dt, t, camera); }
        farSnow.setOpacity(calm ? lerp(0.5, 0.2, clear) : rime ? 0.4 * (1 - clear) : 0.5 * (1 - sm(0.38, 0.62, u))); farSnow.update(dt, t, camera);
        // sweepers work their stripes as the flight advances; the handcart crosses the square; both cast shadows
        for (let i = 0; i < sweepers.length; i++) {
          const s = sweepers[i], x = s.x0 + s.dir * s.len * (0.2 + 0.8 * u), stroke = Math.sin(t * 2.6 + s.ph);
          s.mesh.position.set(x + s.dir * 0.25 * stroke, 0, s.z); s.mesh.rotation.y = s.dir * Math.PI / 2 + 0.3 * stroke;
          SW[i].z = x + s.dir * 2.2; POST[i].set(x, s.z, 0.4, 1.9);
        }
        const ck = 0.15 + 0.75 * u, cx = lerp(-58, 50, ck), cz = lerp(64, 16, ck);
        cart.mesh.position.set(cx, 0.03 * Math.sin(t * 7 + cart.ph), cz); cart.mesh.rotation.y = 1.99 + 0.03 * Math.sin(t * 3); POST[6].set(cx + 0.7, cz - 0.3, 0.95, 1.7);
      },
      dispose() { hero.dispose(); sky.dispose(); map.dispose(); },
    };
  },
};
