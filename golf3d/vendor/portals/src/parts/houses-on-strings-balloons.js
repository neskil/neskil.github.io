// HOUSES ON STRINGS, part: the balloons and their lines.
// A balloon is an OPAQUE sphere shaded on a camera-facing quad (2 triangles, instanced, no blending): lit side with
// a wrap, the light that comes through from the far side, the skin deeper where it is seen slantwise, one broad
// highlight, a knot, its own tint and size; the corner is cut by an edge as wide as the pixel's footprint and depth
// is the quad's. A ball of a pixel or two is drawn no smaller than that and in one flat shade, so a far bunch is a
// lumpy crowd and never sparkles. Every balloon, line and building vertex carries its hung thing's pivot and motion,
// and ONE function (hsSway) gives all three the same rise, turn and swing, so a line stays made fast at both ends.
// The dealing here is plain data (no three.js): the plan part fills a store, the world makes the meshes from it.
import * as THREE from 'three';

// mv = (phase, rise in metres, period in seconds, swing in radians); the turn is 1.2 times the swing
export const SWAY_GLSL = /* glsl */`
uniform float uTime;
vec3 hsSway(vec3 p, vec3 pv, vec4 mv){
  float t = uTime*6.2831853/max(mv.z, 1.) + mv.x;
  float yaw = 1.2*mv.w*sin(t*.37 + mv.x*1.7), sx = mv.w*sin(t*.61 + mv.x*2.3), sz = mv.w*sin(t*.53 + mv.x*.9);
  vec3 d = p - pv;
  float c = cos(yaw), s = sin(yaw);
  d = vec3(c*d.x + s*d.z, d.y, c*d.z - s*d.x);
  c = cos(sx); s = sin(sx); d = vec3(d.x, c*d.y - s*d.z, s*d.y + c*d.z);
  c = cos(sz); s = sin(sz); d = vec3(c*d.x - s*d.y, s*d.x + c*d.y, d.z);
  return pv + d + vec3(0., mv.y*sin(t), 0.);
}`;
// the farthest a point r metres from its pivot can be carried by that motion (for the count of clear air, by place)
export const swayReach = (r, mv) => mv[1] + r * mv[3] * (1.2 + 1.4143) + 0.12;

// hue families: two neighbouring hues to a building, one balloon in fifteen pearl white (linear rgb, under 0.8)
const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
export const FAMILIES = [
  ['#d3241b', '#ee6a50'], ['#eb9a1c', '#f0cc2c'], ['#93c92a', '#3c9434'], ['#128c86', '#2cc2ba'], ['#4fa6e4', '#1f4cbc'],
  ['#7436c4', '#b48ae4'], ['#dc3a74', '#f394b4'], ['#ece6d8', '#f0deb0'], ['#ec741c', '#f6ae82'],
].map((f) => f.map(hex));
const PEARL = hex('#f0ede4');

// a store of one zone's balloons and lines; a hung thing H = { x, y, z, yaw, pivot: [x,y,z], mv: [4], zone, guard }
export function makeStore(zones) { const S = { z: [] }; for (let i = 0; i < zones; i++) S.z.push({ b: [], l: [], nb: 0, nl: 0 }); return S; }
export function toWorld(H, lx, ly, lz, out) {
  const c = H.cs, s = H.sn, k = H.sc || 1; out[0] = H.x + lx * c * k + lz * s * k; out[1] = H.y + ly * k; out[2] = H.z - lx * s * k + lz * c * k; return out;   // k: a thing drawn larger than its measures (the house alone, 1.25)
}
const W = [0, 0, 0], W2 = [0, 0, 0];
// one balloon at a local place; dice (size, tint, seed) are handed in already drawn; false if it would stand in the way
export function ball(S, H, lx, ly, lz, fam, d0, d1, d2, occ, nx, ny, nz, rise = 0, span = 0) {
  toWorld(H, lx, ly, lz, W);
  const size = 1.0 + 0.3 * d0;                                     // every balloon reads as a balloon: fewer, larger
  if (H.guard && !H.guard(W[0], W[1], W[2], size * 0.6)) return false;
  const f = FAMILIES[fam], patch = Math.sin(lx * 0.43 + ly * 0.29 + fam) * Math.sin(lz * 0.47 - ly * 0.21) + (d1 - 0.5) * 1.0;
  const c = (d1 * 613) % 1 < 1 / 15 ? PEARL : f[patch > 0 ? 0 : 1], g = 0.76 + 0.36 * ((d1 * 977) % 1);
  const l = Math.hypot(nx, ny, nz) || 1, wnx = (nx * H.cs + nz * H.sn) / l, wnz = (-nx * H.sn + nz * H.cs) / l;
  const Z = S.z[H.zone];
  Z.b.push(W[0], W[1], W[2], size, Math.min(c[0] * g, 0.8), Math.min(c[1] * g, 0.8), Math.min(c[2] * g, 0.8), d2, wnx, ny / l, wnz, occ,
    H.pivot[0], H.pivot[1], H.pivot[2], H.mv[0], H.mv[1], H.mv[2], H.mv[3], rise, span, (f[0][0] + f[1][0]) * 0.46, (f[0][1] + f[1][1]) * 0.46, (f[0][2] + f[1][2]) * 0.46);
  Z.nb++; return true;
}
export const BSTRIDE = 24, LSTRIDE = 14;
// one line between two LOCAL places, w metres thick
export function line(S, H, ax, ay, az, bx, by, bz, w = 0.03) {
  toWorld(H, ax, ay, az, W); toWorld(H, bx, by, bz, W2);
  const Z = S.z[H.zone];
  Z.l.push(W[0], W[1], W[2], W2[0], W2[1], W2[2], w, H.pivot[0], H.pivot[1], H.pivot[2], H.mv[0], H.mv[1], H.mv[2], H.mv[3]);
  Z.nl++;
}
// where a line is made fast: on the nearer of the two long cradle beams (they stick out past the walls at both ends),
// at the place along it that answers the line's own place along the bunch: two near-parallel curtains, never a cone
const cradle = (ends) => { let bx = 0, z0 = 1e9, z1 = -1e9, y = 0; for (const e of ends) { bx = Math.max(bx, Math.abs(e[0])); z0 = Math.min(z0, e[2]); z1 = Math.max(z1, e[2]); y = Math.max(y, e[1]); } return { bx, z0, z1, y }; };
const fastAt = (c, x, z, half) => [Math.max(-c.bx, Math.min(c.bx, x * c.bx / half)), c.y, z >= (c.z0 + c.z1) / 2 ? c.z1 : c.z0];
const nearestOf = (pts, x, z) => { let b = pts[0], bd = 1e9; for (const p of pts) { const d = (p[0] - x) ** 2 + (p[2] - z) ** 2; if (d < bd) { bd = d; b = p; } } return b; };

// ---- a. THE RAFT: a flat quilt two or three deep under a rope net; lines drop from its edge to the beam ends
export function bunchRaft(S, H, rng, o) {
  const { len, wid, y, fam } = o, sp = o.sp || 0.95, layers = o.layers || 3, top = y + (layers - 1) * 0.8;
  const cx = Math.max(2, Math.round(len / 6.5)), cz = Math.max(2, Math.round(wid / 6.5)), px = len / cx, pz = wid / cz;
  const nx = Math.floor(len / sp), nz = Math.floor(wid / (sp * 0.87));
  const inside = (x, z) => (Math.abs(x) / (len / 2)) ** 4.6 + (Math.abs(z) / (wid / 2)) ** 4.6 <= 1 + 0.13 * Math.sin(x * 0.9 + 1.3) * Math.sin(z * 1.1 + 0.4);
  const reachX = (z) => (len / 2) * Math.max(0, 1 - (Math.abs(z) / (wid / 2)) ** 3.2) ** 0.3125 * 0.93, reachZ = (x) => (wid / 2) * Math.max(0, 1 - (Math.abs(x) / (len / 2)) ** 3.2) ** 0.3125 * 0.93;
  for (let k = 0; k < layers; k++) for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const jx = rng(), jz = rng(), jy = rng(), d0 = rng(), d1 = rng(), d2 = rng();
    const x = (ix + 0.5 + (iz % 2) * 0.5 + (jx - 0.5) * 0.45 + k * 0.33) * sp - len / 2, z = (iz + 0.5 + (jz - 0.5) * 0.45 + k * 0.29) * sp * 0.87 - wid / 2;
    if (!inside(x, z)) continue;
    const pil = Math.abs(Math.sin(Math.PI * (x + len / 2) / px) * Math.sin(Math.PI * (z + wid / 2) / pz)) ** 0.6;   // pillows between the net's ropes
    const rim = Math.max(Math.abs(x) / (len / 2), Math.abs(z) / (wid / 2)), edge = rim > 0.9 ? 1 : 0;
    const yy = y + k * 0.8 + pil * (0.35 + 0.3 * k) + (jy - 0.5) * 0.25;
    const mid = layers > 2 && k > 0 && k < layers - 1 && !edge;
    if (mid && d2 < 0.5) continue;                                 // the hidden middle layer is dealt thinner
    const ny = k === layers - 1 ? 1 : k === 0 ? -1 : 0, ox = edge ? Math.sign(x) * (Math.abs(x) / (len / 2) > Math.abs(z) / (wid / 2) ? 1 : 0) : 0, oz = edge && !ox ? Math.sign(z) : 0;
    ball(S, H, x, yy, z, fam, d0, d1, d2, mid ? 0.8 : 0.12 * (1 - pil), ox * 1.2, ny, oz * 1.2);
  }
  for (let i = 1; i < cx; i++) { const x = -len / 2 + i * px, z = reachZ(x); line(S, H, x, top + 0.42, -z, x, top + 0.42, z, 0.05); }   // the net's main ropes
  for (let i = 1; i < cz; i++) { const z = -wid / 2 + i * pz, x = reachX(z); line(S, H, -x, top + 0.42, z, x, top + 0.42, z, 0.05); }
  const cr = cradle(o.ends), n = Math.round(2 * (len + wid) / 2.5), se = (v) => Math.sign(v) * Math.abs(v) ** 0.625;   // the cage of lines, about one every 2.5 m of the edge
  // no line crosses a turning thing's swept disc (o.disc: its hub's x, y, z and its radius, facing along z; 1 m of air about it)
  const dk = o.disc, hits = (ax, ay, az, bx, by, bz) => { if (!dk) return false; for (let k = 0; k <= 32; k++) { const t = k / 32; if (Math.abs(az + (bz - az) * t - dk[2]) < 1.05 && Math.hypot(ax + (bx - ax) * t - dk[0], ay + (by - ay) * t - dk[1]) < dk[3] + 1) return true; } return false; };
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) / n * 6.2832, x = se(Math.cos(th)) * len / 2 * 0.9, z = se(Math.sin(th)) * wid / 2 * 0.9, a = fastAt(cr, x, z, len / 2);
    if (hits(x, y - 0.3, z, a[0], a[1], a[2])) { a[2] = a[2] === cr.z1 ? cr.z0 : cr.z1; if (hits(x, y - 0.3, z, a[0], a[1], a[2])) continue; }   // such a line goes to the other beam, or is not strung
    line(S, H, x, y - 0.3, z, a[0], a[1], a[2], i % 4 === 0 ? 0.05 : 0.022);
  }
}

// ---- b. THE BOLSTER: a long roll bound every 4 m by a rope hoop, a row of fat segments; lines from every hoop
export function bunchBolster(S, H, rng, o) {
  const cr = cradle(o.ends), { len, rad, y, fam } = o, zc = o.z || 0, xc = o.x || 0, sp = (o.sp || 0.95) * 0.97, segs = Math.max(4, Math.round(len / 4)), sl = len / segs;
  const R = (x) => { const t = (x + len / 2) / sl, cap = Math.max(0, Math.abs(x) - (len / 2 - rad * 0.9)) / (rad * 0.9);
    return rad * (0.8 + 0.2 * Math.abs(Math.sin(Math.PI * t)) ** 0.55) * Math.sqrt(Math.max(0.02, 1 - cap * cap)); };
  for (let x = -len / 2 + 0.3; x < len / 2 - 0.2; x += sp * 0.86) for (let sh = 0; sh < 2; sh++) {
    const r = R(x) - 0.42 - sh * 0.8; if (r < 0.5) continue;
    const m = Math.max(3, Math.floor(6.2832 * r / sp)), a0 = rng() * 6.2832;
    for (let i = 0; i < m; i++) {
      const ja = rng(), jx = rng(), d0 = rng(), d1 = rng(), d2 = rng();
      if (sh && d2 < 0.45) continue;                               // the inner shell is dealt thinner
      const a = a0 + (i + (ja - 0.5) * 0.5) / m * 6.2832, xx = x + (jx - 0.5) * 0.4;
      ball(S, H, xc + xx, y + Math.sin(a) * r * 0.62, zc + Math.cos(a) * r * 1.6, fam, d0, d1, d2, sh ? 0.78 : 0.1, 0.5 * xx / (len / 2), Math.sin(a), Math.cos(a));   // a flat roll: 2.6 times wider than tall
    }
  }
  for (let k = 0; k <= segs; k++) {                                // hoops, and the lines from each
    const x = -len / 2 + k * sl, r = (k === 0 || k === segs ? R(x * 0.985) : rad * 0.8) + 0.06;
    if (k > 0 && k < segs) for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832, b = (i + 1) / 10 * 6.2832; line(S, H, xc + x, y + Math.sin(a) * r * 0.62, zc + Math.cos(a) * r * 1.6, xc + x, y + Math.sin(b) * r * 0.62, zc + Math.cos(b) * r * 1.6, 0.045); }
    const rr = k === 0 || k === segs ? rad * 0.5 : r, sd = zc > 0.1 ? 1 : zc < -0.1 ? -1 : (k % 2 ? 1 : -1), f = fastAt(cr, xc + x, sd, len / 2);
    line(S, H, xc + x, y - rr * 0.45, zc + sd * rr * 1.1, f[0], f[1], f[2], k % 2 ? 0.024 : 0.045);   // down to the cradle beam on its own side
  }
}

const segDist = (px, py, pz, s) => { const dx = s[3] - s[0], dy = s[4] - s[1], dz = s[5] - s[2], t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy + (pz - s[2]) * dz) / (dx * dx + dy * dy + dz * dz)));
  return Math.hypot(px - s[0] - dx * t, py - s[1] - dy * t, pz - s[2] - dz * t); };
// ---- c. THE TIERS: one broad flat deck and two smaller ones a step higher, set off to either end (never a stack on one axis); the upper decks' lines pass
// down through slots in the lower ones (a balloon within half a metre of a line above it is not dealt a place)
export function bunchTiers(S, H, rng, o) {
  const cr = cradle(o.ends), { radii, y, fam } = o, gap = o.gap || 4.5, sp = o.sp || 0.95, segs = [];
  for (let t = radii.length - 1; t >= 0; t--) {
    const Rd = radii[t], ox = t ? (t & 1 ? 0.62 : -0.62) * radii[0] : 0, yy = y + (t ? gap : 0), ph = rng() * 6.2832, n = Math.floor(Rd / sp) + 1;
    for (let k = 0; k < 2; k++) for (let iz = -n; iz <= n; iz++) for (let ix = -n; ix <= n; ix++) {
      const jx = rng(), jz = rng(), jy = rng(), d0 = rng(), d1 = rng(), d2 = rng();
      const x = (ix + (iz & 1) * 0.5 + (jx - 0.5) * 0.45 + k * 0.4) * sp, z = (iz + (jz - 0.5) * 0.45 + k * 0.3) * sp * 0.87, r = Math.hypot(x, z), a = Math.atan2(z, x);
      const lim = Rd * (1 + 0.05 * Math.sin(3 * a + ph) + 0.03 * Math.sin(7 * a + ph * 2));
      if (r > lim) continue;
      const py = yy + k * 0.8 + (jy - 0.5) * 0.25 + 0.5 * Math.cos(r / lim * 1.5708);      // a deck is a little domed
      let slot = false; for (const s of segs) if (segDist(x + ox, py, z, s) < 0.55) { slot = true; break; }
      if (slot || (o.thin2 && k && d2 < 0.5)) continue;               // a far deck's upper layer is dealt thinner
      const e = r > lim - 1.1 ? 1 : 0;
      ball(S, H, x + ox, py, z, fam, d0, d1, d2, e ? 0.05 : 0.15, e ? Math.cos(a) * 1.3 : 0, k ? 1 : -1, e ? Math.sin(a) * 1.3 : 0);
    }
    const m = Math.max(8, Math.round(6.2832 * Rd / 3));
    for (let i = 0; i < m; i++) {
      const a = (i + 0.5 * (t & 1)) / m * 6.2832, x = Math.cos(a) * Rd * 0.94, z = Math.sin(a) * Rd * 0.94, e = fastAt(cr, x, z, Rd);
      line(S, H, x + ox, yy - 0.3, z, e[0], e[1], e[2], i % 4 === 0 ? 0.045 : 0.022); segs.push([x + ox, yy - 0.3, z, e[0], e[1], e[2]]);
    }
    for (let i = 0; i < 6; i++) { const a = i / 6 * 3.1416; line(S, H, ox + Math.cos(a) * Rd, yy + 1.5, Math.sin(a) * Rd, ox - Math.cos(a) * Rd, yy + 1.5, -Math.sin(a) * Rd, 0.04); }   // the deck's net
  }
}

// ---- d. THE NETTED CLUSTERS: separate net bags of three to five lobes at different heights, each on its own rope
export function bunchClusters(S, H, rng, o) {
  const bags = [], want = o.count, { fam } = o, cr = cradle(o.ends), cols = Math.ceil(want / 3), Rm = 3.55 * (o.bag || 1), half = cols * Rm * 0.78 + Rm;
  for (let i = 0; i < want; i++) {                                  // a flat quilt of bags, three rows side by side along the building, their feet level
    const jx = rng(), hh = rng(), sz = rng(), row = i % 3 - 1, col = Math.floor(i / 3);
    const R = (2.9 + 1.3 * sz) * (o.bag || 1), bx = (col - (cols - 1) / 2) * Rm * 1.55 + (jx - 0.5) * 0.8 + (row ? 0 : Rm * 0.45), bz = row * Rm * 1.4, by = o.y0 + R * 0.72 + hh * 1.2;   // the bags touch and are flattened: one low lumpy quilt, wide from every side
    toWorld(H, bx, by, bz, W);
    if (H.guard && !H.guard(W[0], W[1], W[2], R + 2.5)) continue;
    bags.push({ x: bx, y: by, z: bz, R, e: fastAt(cr, bx, row || (col % 2 ? 1 : -1), half) });
  }
  if (bags.length < 5) return 0;                                    // never two or three lumps over one roof: the caller gives the building a quilt instead
  for (const b of bags) {
    const nl = 3 + Math.floor(rng() * 3), lobes = [];
    for (let i = 0; i < nl; i++) { const a = rng() * 6.2832, e = rng() * 1.0 - 0.5, d = b.R * (0.42 + 0.3 * rng()), r = b.R * (0.44 + 0.16 * rng()); lobes.push([b.x + Math.cos(a) * Math.cos(e) * d, b.y + Math.sin(e) * d * 0.6, b.z + Math.sin(a) * Math.cos(e) * d * 0.8, r]); }
    for (let li = 0; li < nl; li++) {
      const L = lobes[li], n = Math.round(12.566 * L[3] * L[3] / (0.66 * (o.sp || 0.95) ** 2));
      for (let i = 0; i < n; i++) {
        const u = rng() * 2 - 1, a = rng() * 6.2832, sh = rng(), d0 = rng(), d1 = rng(), d2 = rng();
        const q = Math.sqrt(1 - u * u), r = L[3] - 0.4 - (sh < 0.25 ? 0.8 : 0), x = L[0] + q * Math.cos(a) * r, yv = L[1] + u * r * 0.72, z = L[2] + q * Math.sin(a) * r;
        let inner = false; for (let lj = 0; lj < nl; lj++) if (lj !== li && Math.hypot(x - lobes[lj][0], (yv - lobes[lj][1]) / 0.72, z - lobes[lj][2]) < lobes[lj][3] - 0.75) { inner = true; break; }
        if (inner) continue;
        ball(S, H, x, yv, z, fam, d0, d1, d2, sh < 0.25 ? 0.75 : 0.1, x - b.x, yv - b.y, z - b.z);
      }
    }
    const sd = b.e[2] >= (cr.z0 + cr.z1) / 2 ? 1 : -1;                // a short curtain: straight near-parallel lines from the bag's hem down to the beam on its own side, no cone and no ring
    for (let i = 0; i < 5; i++) { const hx = b.x + (i - 2) * b.R * 0.36, f = fastAt(cr, hx, sd, half); line(S, H, hx, b.y - b.R * 0.5, b.z + sd * b.R * 0.45, f[0], f[1], f[2], i % 2 ? 0.02 : 0.04); }
  }
  return bags.length;
}

// ---- e. THE GREAT BALL: one round bunch in EVERY colour, mixed (the house's own; no other bunch is like it), its strings gathered to one
// place. Two shells of balloons laid on even spirals (the inner one thinner: it shows only through the gaps), a little lumpy, and strings
// from the ball's underside down to the place where they are gathered (o.to)
export async function bunchBall(S, H, rng, o, pause) {
  const { r, cy, to } = o, sp = o.sp || 1.7;
  for (let k = 0; k < 2; k++) {
    const rr = r - k * 1.5, s = sp * (k ? 1.45 : 1), n = Math.round(4 * Math.PI * rr * rr / (s * s * 0.87));
    for (let i = 0; i < n; i++) {                                    // every die before the one test (the guard, inside ball)
      const j0 = rng(), j1 = rng(), d0 = rng(), d1 = rng(), d2 = rng(), fa = rng(); if (pause && i % 100 === 99) await pause();
      const phi = Math.acos(1 - 2 * (i + 0.5) / n), th = i * 2.39996 + (j0 - 0.5) * 0.03, R = rr * (1 + 0.035 * Math.sin(th * 3 + phi * 5) + 0.03 * (j1 - 0.5));
      const nx = Math.sin(phi) * Math.cos(th), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(th);
      ball(S, H, nx * R, cy + ny * R, nz * R, Math.floor(fa * FAMILIES.length) % FAMILIES.length, d0, d1, d2, k ? 0.7 : 0.1, nx, ny, nz);
    }
  }
  for (let i = 0, nl = o.lines || 110; i < nl; i++) {
    const a = rng() * 6.2832, ph = Math.PI * (0.62 + 0.36 * rng()), R = r * 0.985;
    line(S, H, Math.sin(ph) * Math.cos(a) * R, cy + Math.cos(ph) * R, Math.sin(ph) * Math.sin(a) * R, to[0], to[1], to[2], i % 5 === 0 ? 0.05 : 0.025);
  }
}

// balloons let go: a thin loose thread that rises from a local place, wraps over `span` metres, scaled in and out
export function looseThread(S, H, rng, lx, ly, lz, fam, n, span) {
  for (let i = 0; i < n; i++) {                                     // few, large, each at its own pace and place: a loose scatter of the building's own hues, not a line
    const jx = rng(), jz = rng(), d0 = rng(), d1 = rng(), jp = rng(), sp = rng();
    ball(S, H, lx + (jx - 0.5) * 9, ly, lz + (jz - 0.5) * 9, fam, 2.2 + 2.2 * d0, d1, (i + 0.9 * jp) / n, 0, 0, 1, 0, 1.3 + 1.5 * sp, span);
  }
}

// ------------------------------------------------------------------ the meshes
const BALL_VERT = /* glsl */`
attribute vec4 aPS, aTint, aBN, aMove; attribute vec3 aPivot, aMean; attribute vec2 aRise;
uniform float uViewH; uniform vec3 uSun;
varying vec2 vUv; varying vec4 vTint; varying vec3 vSunV, vUpV; varying float vPx, vBL, vOcc, vBh;
#include <fog_pars_vertex>
${SWAY_GLSL}
void main(){
  vec3 c = hsSway(aPS.xyz, aPivot, aMove);
  float s = aTint.w*6.2831853, grow = 1.;
  c += .05*vec3(sin(uTime*1.3 + s*7.), sin(uTime*1.1 + s*13.), sin(uTime*.9 + s*29.));
  c.y += .1*sin(uTime*.55 + dot(aPS.xz, vec2(.23, .17)));
  if(aRise.x > 0.){
    float h = mod(uTime*aRise.x + aTint.w*aRise.y, aRise.y), ph = dot(aPivot.xz, vec2(.37, .23)) + aTint.w*40.;   // each on its own wandering way up
    c += vec3(4.*sin(h*.05 + ph) + h*.18, h, 4.*sin(h*.041 + ph*1.7));
    grow = smoothstep(0., 5., h)*(1. - smoothstep(aRise.y - 14., aRise.y, h));
  }
  vec4 mvPosition = viewMatrix*vec4(c, 1.);
  float r = .5*aPS.w*grow;
  float px = r*projectionMatrix[1][1]*uViewH*.5/max(-mvPosition.z, .1);
  float k = min(max(1., 1.25/max(px, .01)), 14.)*step(.001, grow);
  vBh = clamp(dot(mvPosition.xyz/max(length(mvPosition.xyz), .001), normalize((viewMatrix*vec4(uSun, 0.)).xyz)), 0., 1.);   // the sun beyond THIS balloon, by the ray from the eye to it (not by where the lens points)
  mvPosition.xy += position.xy*r*k;
  gl_Position = projectionMatrix*mvPosition;
  vUv = position.xy; vTint = vec4(mix(aTint.rgb, aMean, .3*(1. - smoothstep(.7, 2.4, px))), aTint.w); vPx = px; vOcc = aBN.w; vBL = dot(aBN.xyz, uSun);
  vSunV = normalize((viewMatrix*vec4(uSun, 0.)).xyz); vUpV = (viewMatrix*vec4(0., 1., 0., 0.)).xyz;
  #include <fog_vertex>
}`;
const BALL_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uGroundCol; uniform float uDeep, uThru;
varying vec2 vUv; varying vec4 vTint; varying vec3 vSunV, vUpV; varying float vPx, vBL, vOcc, vBh;
#include <fog_pars_fragment>
void main(){
  vec2 e = vec2(vUv.x, (vUv.y - .05)/1.1);
  e.x *= 1. + .25*max(-e.y, 0.);                                  // a little taller than wide, narrower to the knot
  float r2 = dot(e, e), fw = max(fwidth(r2), 1e-4);
  float cov = 1. - smoothstep(1. - fw*1.2, 1., r2);               // the edge, as wide as the pixel's footprint
  float small = 1. - smoothstep(.9, 2.6, vPx);                   // a ball of a pixel or two: one flat shade
  float nz = sqrt(clamp(1. - r2, .0004, 1.));
  vec3 n = normalize(mix(vec3(e, nz), vec3(0., 0., 1.), small*.7));
  float ndl = dot(n, vSunV), slant = 1. - n.z, occ = clamp(vOcc, 0., 1.);
  vec3 tint = mix(vTint.rgb, vTint.rgb*vTint.rgb*1.3, uDeep), deep = tint*tint*1.3;   // more skin in the way: deeper (uDeep: a hard white sun pales them)
  vec3 skin = mix(tint, deep, clamp(slant*slant*1.25 + occ*.6, 0., 1.));
  float sunSide = smoothstep(-.6, .4, vBL);                       // a bunch shades its own far side
  float front = clamp(ndl*.62 + .38, 0., 1.)*sunSide;
  float behind = vBh;                                             // the sun beyond the ball, by the ray to it
  float thru = (.2 + .55*clamp(-ndl, 0., 1.) + .8*behind*behind)*(1. - .5*occ)*mix(.7, 1., sunSide);
  vec3 amb = mix(uGroundCol, uSkyCol, dot(n, vUpV)*.5 + .5)*(1. - .45*occ);
  vec3 col = skin*(uSunCol*front + amb)*.3183;
  col += mix(skin, deep, .45)*uSunCol*(thru*uThru);                // lit from within
  vec3 hv = normalize(vSunV + vec3(0., 0., 1.0001));
  float nh = clamp(dot(n, hv), 1e-4, 1.);
  col += uSunCol*(.12*pow(nh, 14.) + .55*pow(nh, 110.))*sunSide*(1. - small)*(1. - occ);
  float ky = vUv.y + 1.03;
  float knot = (1. - smoothstep(0., .05, abs(vUv.x) - .03 + ky*.4))*step(ky, .03)*step(-.24, ky)*(1. - small);
  col = mix(col, deep*.25*(uSkyCol + uSunCol*.3)*.3183, knot*(1. - cov));
  cov = max(cov, knot);
  gl_FragColor = vec4(col, cov);
  #include <fog_fragment>
  if(cov <= 0.) discard;
}`;
const LINE_VERT = /* glsl */`
attribute vec3 aOther, aPivot, aLW; attribute vec4 aMove;
uniform float uViewH; uniform vec3 uSun;
varying float vSide, vA, vLit;
#include <fog_pars_vertex>
${SWAY_GLSL}
void main(){
  vec3 a = hsSway(position, aPivot, aMove), b = hsSway(aOther, aPivot, aMove);
  vec4 mvPosition = viewMatrix*vec4(a, 1.), mb = viewMatrix*vec4(b, 1.);
  vec2 d = (mb.xy/max(-mb.z, .1) - mvPosition.xy/max(-mvPosition.z, .1))*aLW.y;
  float l = length(d); d = l > 1e-7 ? d/l : vec2(1., 0.);
  float sc = projectionMatrix[1][1]*uViewH*.5/max(-mvPosition.z, .1);       // pixels to a metre here
  float pxw = aLW.z*sc, w = max(pxw, 1. + 6.*aLW.z);                        // a ribbon never under a pixel wide; a rope a little wider
  mvPosition.xy += vec2(-d.y, d.x)*aLW.x*w/sc*.5;
  vec3 ab = b - a; float ds = dot(ab/max(length(ab), 1e-4), uSun);
  vSide = aLW.x; vA = clamp(1.6*pxw/w, .2, 1.); vLit = sqrt(clamp(1. - ds*ds, .0004, 1.));        // a cord across the sun's light is lit most
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LINE_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uGroundCol, uHemp;
varying float vSide, vA, vLit;
#include <fog_pars_fragment>
void main(){
  float a = vA*(1. - smoothstep(.6, 1., abs(vSide)));
  gl_FragColor = vec4(uHemp*(uSunCol*(.3 + .7*vLit)*(.85 + .15*vSide) + .6*(uSkyCol + uGroundCol))*.3183, a);
  #include <fog_fragment>
}`;

// meshes from a store: one instanced draw of balloons and one of lines per zone. light = { sun, sunCol, sky, ground }
export async function makeBalloonMeshes(S, light, yieldFn = async () => {}) {   // a yield after each zone's balloons and after each zone's lines
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, { uTime: { value: 0 }, uDeep: { value: 0 }, uThru: { value: 0.52 }, uViewH: { value: 450 }, uSun: { value: light.sun }, uSunCol: { value: light.sunCol }, uSkyCol: { value: light.sky },
    uGroundCol: { value: light.ground }, uHemp: { value: new THREE.Color('#e4d8b8') } });
  const ballMat = new THREE.ShaderMaterial({ name: 'hosBalloons', uniforms, vertexShader: BALL_VERT, fragmentShader: BALL_FRAG, fog: true, alphaToCoverage: true });
  const lineMat = new THREE.ShaderMaterial({ name: 'hosLines', uniforms, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, fog: true, transparent: true, depthWrite: true, side: THREE.DoubleSide });
  const group = new THREE.Group(); group.name = 'bunches';
  let balloons = 0, lines = 0;
  for (const Z of S.z) {
    if (Z.nb) {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1.06, -1.3, 0, 1.06, -1.3, 0, 1.06, 1.2, 0, -1.06, 1.2, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(Z.b), BSTRIDE);
      const at = (name, n, off) => g.setAttribute(name, new THREE.InterleavedBufferAttribute(ib, n, off));
      at('aPS', 4, 0); at('aTint', 4, 4); at('aBN', 4, 8); at('aPivot', 3, 12); at('aMove', 4, 15); at('aRise', 2, 19); at('aMean', 3, 21);
      g.instanceCount = Z.nb;
      const box = new THREE.Box3(), v = new THREE.Vector3();
      for (let i = 0; i < Z.nb; i++) { const o = i * BSTRIDE; box.expandByPoint(v.set(Z.b[o], Z.b[o + 1], Z.b[o + 2])); if (Z.b[o + 20] > 0) box.expandByPoint(v.set(Z.b[o] + 12, Z.b[o + 1] + Z.b[o + 20], Z.b[o + 2])); }
      g.boundingSphere = box.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 8;
      const m = new THREE.Mesh(g, ballMat); m.name = 'balloons'; group.add(m); balloons += Z.nb; await yieldFn();
    }
    if (Z.nl) {
      const n = Z.nl, P = new Float32Array(n * 12), O = new Float32Array(n * 12), V = new Float32Array(n * 12), LW = new Float32Array(n * 12), M = new Float32Array(n * 16), I = new Uint32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const o = i * LSTRIDE, L = Z.l;
        for (let k = 0; k < 4; k++) {
          const far = k > 1, q = (i * 4 + k) * 3, a = far ? 3 : 0, b = far ? 0 : 3;
          P[q] = L[o + a]; P[q + 1] = L[o + a + 1]; P[q + 2] = L[o + a + 2]; O[q] = L[o + b]; O[q + 1] = L[o + b + 1]; O[q + 2] = L[o + b + 2];
          V[q] = L[o + 7]; V[q + 1] = L[o + 8]; V[q + 2] = L[o + 9]; LW[q] = k & 1 ? 1 : -1; LW[q + 1] = far ? -1 : 1; LW[q + 2] = L[o + 6];
          M.set([L[o + 10], L[o + 11], L[o + 12], L[o + 13]], (i * 4 + k) * 4);
        }
        I.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2], i * 6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aOther', new THREE.BufferAttribute(O, 3)); g.setAttribute('aPivot', new THREE.BufferAttribute(V, 3));
      g.setAttribute('aLW', new THREE.BufferAttribute(LW, 3)); g.setAttribute('aMove', new THREE.BufferAttribute(M, 4)); g.setIndex(new THREE.BufferAttribute(I, 1));
      g.computeBoundingSphere(); g.boundingSphere.radius += 8;
      const m = new THREE.Mesh(g, lineMat); m.name = 'lines'; m.renderOrder = 0.5; group.add(m); lines += n; await yieldFn();
    }
  }
  return { object: group, uniforms, balloons, lines };
}
