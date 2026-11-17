// Hero set piece for "The Khlong Run": the river temple beyond the canal mouth.
//
// WHAT IT IS
//   A porcelain-crusted prang (corn-cob temple tower) 80 m tall on a 50 m redented base of four
//   terraces, with rows of small carved bearers under its cornices, tiers of niches and leaf
//   antefixes, a saffron sash, a gilded trident finial, four 28 m satellite spires, two tiered-roof
//   viharn halls, the river wall, the 30 m river stairs, two landing pavilions standing in the water
//   22 m apart, two giant gate guardians and rows of long temple banners. Its broken reflection is a
//   view-correct shader plane laid on the river in front of the stairs.
//
// SPACE (local): origin = centre of the prang at WATER LEVEL (y = 0 is the river surface), +Y up,
//   front = +Z = toward the river and the arriving boat (brief: N = 690 - z, X = east = +x).
//   Temple terrace at y = 3.2. River wall and stairs foot at z = 78. Pavilions at x = +-15.5, z = 79..91.
//   radius ~ 95 (everything fits in x +-66, z -50..+92), height 80.
//
// OPTS
//   palette      array of 7 hex strings (brief order: teak, olive, apricot-gold, porcelain, orange,
//                green, slate-violet)
//   sunDir       THREE.Vector3 / [x,y,z] toward the sun in WORLD space, used for the travelling glints
//                and the reflection. Default: the first DirectionalLight found in the scene, else the
//                brief's sun (bearing 255, 13 degrees up = (-0.94, 0.22, 0.25)).
//   reflection   false to leave out the reflection plane (default true)
//   prangScale   1..1.4: the central prang alone built larger (terraces, cob, finial; default 1). The satellites, halls,
//                stairs, pavilions and portalSeat stay where they are; prangTop, the reflection and the sun-catch follow.
//   column       0..1.5 strength of the spire's long broken gold column on the water (uniforms.uCol, uGold; default 0.5)
//                uniforms.uMK (x: the reflection's gain, y: the floor of its broken dashes, z: the column's base width in
//                metres; default 0.86, 0.6, 1.6) and uniforms.uLit / uShade (its lit and shaded colours) may be retuned per look.
//   banners      false to leave out banner cloth (poles stay)
//   birds        false to leave out the flock of temple pigeons wheeling round the spire
//   Per seed: number of corn-cob tiers (8-10), faience colour order, roof colour scheme, banner
//   colours and lengths, sash colour, which satellite wears a second sash, weathering.
//
// ANCHORS (local space)
//   portalSeat   { position (0,1.5,86), facing (0,0,1), radius 7 }: the 14 m portal, half sunk, in
//                the water at the foot of the stairs between the pavilions (decks 10.3 m, eaves 9.3 m
//                from the axis).
//   flyThrough   ordered points from mid-river to the portal centre: a dead straight line along
//                x = 0 at eye height 1.5; nothing of the hero is within 9 m of it.
//   viewpoints   { burst, approach, close } camera positions with a `look` target each.
//   prangTop, prangCenter, stairsFoot, stairsTop, terraceY, waterY,
//   pavilions [2], satellites [4], guardians [2], bannerTops [n], monitorSteps [2] (stair treads at
//   the waterline for the monitors), egretPosts [4] (mooring post tops), mirror (the reflection mesh), flock (the pigeon mesh).
//
// HOOKS
//   setSun(dirWorld, colorHex?, strength?)   glint and reflection sun
//   setProgress(u)   0..1; raises glint strength and banner wind as the camera bursts out
//                    (purely cosmetic, default 1)
//   uniforms         shared uniform object (uTime, uSun, uSunCol, uGlint, uWind, uTip = gain of the finial sun-catch stars)
//
// COST  about 80k triangles, 5 draw calls (1 merged opaque mesh, 1 cloth mesh, 1 reflection plane, 1 flock,
//   1 additive mesh of five sun-catch glints on the gilded finials so the tip reads from 700 m),
//   no lights, no textures. Build about 100 ms.
//
// LIGHT  expects a low warm key from -X (west, the left as you arrive) with blue sky fill; the
//   materials are MeshStandardMaterial based (scene lights + scene fog); porcelain albedo is ~0.72 so
//   a key of intensity 2.5-3.5 keeps it under clipping; glints are emissive 3-7 for bloom.
import * as THREE from 'three';

const DEF_PALETTE = ['#5A3A22', '#4F5B3C', '#FFC76B', '#F3EEDF', '#D8622A', '#2E6B4C', '#494A6E'];
const TERRACE_Y = 3.2;
const QUAY_Z = 78;

// ---------- geometry accumulator (non-indexed, flat shaded) ----------
function makeAcc(maxTris) {
  const n = maxTris * 3;
  const A = {
    pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), col: new Float32Array(n * 3),
    uv: new Float32Array(n * 2), mat: new Float32Array(n), sway: new Float32Array(n), count: 0, max: n,
    // transform state: scale, rotate about Y, translate
    tx: 0, ty: 0, tz: 0, c: 1, s: 0, sc: 1,
  };
  A.setT = (x, y, z, rot = 0, sc = 1) => { A.tx = x; A.ty = y; A.tz = z; A.c = Math.cos(rot); A.s = Math.sin(rot); A.sc = sc; };
  A.resetT = () => A.setT(0, 0, 0, 0, 1);
  return A;
}
const _a = [0, 0, 0], _b = [0, 0, 0], _c = [0, 0, 0];
function tfm(A, p, o) {
  const x = p[0] * A.sc, y = p[1] * A.sc, z = p[2] * A.sc;
  o[0] = x * A.c + z * A.s + A.tx; o[1] = y + A.ty; o[2] = -x * A.s + z * A.c + A.tz;
}
// one triangle; colours are [r,g,b] per vertex (or one shared), uvs optional
function tri(A, p0, p1, p2, c0, c1, c2, m, u0, u1, u2, sw0 = 0, sw1 = 0, sw2 = 0) {
  if (A.count + 3 > A.max) return;
  tfm(A, p0, _a); tfm(A, p1, _b); tfm(A, p2, _c);
  const ux = _b[0] - _a[0], uy = _b[1] - _a[1], uz = _b[2] - _a[2];
  const vx = _c[0] - _a[0], vy = _c[1] - _a[1], vz = _c[2] - _a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz);
  if (l < 1e-9) return;
  nx /= l; ny /= l; nz /= l;
  const i = A.count, P = A.pos, N = A.nrm, C = A.col, U = A.uv;
  P[i * 3] = _a[0]; P[i * 3 + 1] = _a[1]; P[i * 3 + 2] = _a[2];
  P[i * 3 + 3] = _b[0]; P[i * 3 + 4] = _b[1]; P[i * 3 + 5] = _b[2];
  P[i * 3 + 6] = _c[0]; P[i * 3 + 7] = _c[1]; P[i * 3 + 8] = _c[2];
  for (let k = 0; k < 3; k++) { N[(i + k) * 3] = nx; N[(i + k) * 3 + 1] = ny; N[(i + k) * 3 + 2] = nz; A.mat[i + k] = m; }
  C[i * 3] = c0[0]; C[i * 3 + 1] = c0[1]; C[i * 3 + 2] = c0[2];
  C[i * 3 + 3] = c1[0]; C[i * 3 + 4] = c1[1]; C[i * 3 + 5] = c1[2];
  C[i * 3 + 6] = c2[0]; C[i * 3 + 7] = c2[1]; C[i * 3 + 8] = c2[2];
  if (u0) { U[i * 2] = u0[0]; U[i * 2 + 1] = u0[1]; U[i * 2 + 2] = u1[0]; U[i * 2 + 3] = u1[1]; U[i * 2 + 4] = u2[0]; U[i * 2 + 5] = u2[1]; }
  A.sway[i] = sw0; A.sway[i + 1] = sw1; A.sway[i + 2] = sw2;
  A.count += 3;
}
// quad a,b,c,d counter-clockwise seen from outside
function quad(A, a, b, c, d, col, m, ca, cb, cc, cd, ua, ub, uc, ud) {
  tri(A, a, b, c, ca || col, cb || col, cc || col, m, ua, ub, uc);
  tri(A, a, c, d, ca || col, cc || col, cd || col, m, ua, uc, ud);
}
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// tapered box: centre x,z, base y, sizes at the bottom, top scale; darker toward the bottom (cheap AO)
function box(A, cx, y0, cz, sx, sy, sz, col, m, o = {}) {
  const tx = o.tx ?? o.taper ?? 1, tz = o.tz ?? o.taper ?? 1, ox = o.ox || 0, oz = o.oz || 0;
  const hx = sx / 2, hz = sz / 2, y1 = y0 + sy, hx1 = hx * tx, hz1 = hz * tz;
  const lo = mul(col, o.ao ?? 0.78), hi = col;
  const b = [[cx - hx, y0, cz + hz], [cx + hx, y0, cz + hz], [cx + hx, y0, cz - hz], [cx - hx, y0, cz - hz]];
  const t = [[cx + ox - hx1, y1, cz + oz + hz1], [cx + ox + hx1, y1, cz + oz + hz1], [cx + ox + hx1, y1, cz + oz - hz1], [cx + ox - hx1, y1, cz + oz - hz1]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(A, b[i], b[j], t[j], t[i], col, m, lo, lo, hi, hi);
  }
  if (!o.noTop) quad(A, t[0], t[1], t[2], t[3], hi, o.topMat ?? m);
  if (o.bottom) quad(A, b[3], b[2], b[1], b[0], lo, m);
}
// pointed pyramid / spike on a rectangle
function spike(A, cx, y0, cz, sx, sz, h, col, m, ox = 0, oz = 0) {
  const hx = sx / 2, hz = sz / 2, top = [cx + ox, y0 + h, cz + oz], lo = mul(col, 0.8);
  const b = [[cx - hx, y0, cz + hz], [cx + hx, y0, cz + hz], [cx + hx, y0, cz - hz], [cx - hx, y0, cz - hz]];
  for (let i = 0; i < 4; i++) tri(A, b[i], b[(i + 1) % 4], top, lo, lo, col, m);
}

// ---------- redented plan ----------
// 28 points of a square of half-width w whose corners step in three times; returns [x, z, concave]
function redentRing(w, aFrac = 0.52) {
  const a = w * aFrac, s = (w - a) / 3, q = [
    [w, a, 0], [w - s, a, 1], [w - s, a + s, 0], [w - 2 * s, a + s, 1], [w - 2 * s, a + 2 * s, 0], [a, a + 2 * s, 1], [a, w, 0],
  ];
  const out = [];
  for (let k = 0; k < 4; k++) {
    const c = Math.round(Math.cos(k * Math.PI / 2)), sn = Math.round(Math.sin(k * Math.PI / 2));
    for (const p of q) out.push([p[0] * c - p[1] * sn, p[0] * sn + p[1] * c, p[2]]);
  }
  return out; // counter-clockwise seen from above with x right, z up => clockwise in three's x,z; handled by the sweep
}
// sweep a profile [{y, w, c:[r,g,b], sh}] up the redented plan. sh = shade at that level (cornice shadow).
function sweepRedent(A, prof, m, aFrac, concaveShade = 0.6) {
  let prev = null;
  for (const p of prof) {
    const ring = redentRing(p.w, p.a ?? aFrac);
    if (prev) {
      const r0 = prev.ring, r1 = ring, n = r0.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const k0 = r0[i][2] ? concaveShade : 1, k1 = r0[j][2] ? concaveShade : 1;
        const a = [r0[i][0], prev.y, r0[i][1]], b = [r0[j][0], prev.y, r0[j][1]];
        const c = [r1[j][0], p.y, r1[j][1]], d = [r1[i][0], p.y, r1[i][1]];
        // (x,z) ring runs counter-clockwise in a z-up view, so a,d,c,b faces outward in three
        quad(A, a, d, c, b, p.c, p.m ?? m,
          mul(prev.c, prev.sh * k0), mul(p.c, p.sh * k0), mul(p.c, p.sh * k1), mul(prev.c, prev.sh * k1));
      }
    }
    prev = { ring, y: p.y, c: p.c, sh: p.sh };
  }
}

// ---------- more helpers ----------
// face oriented away from an inside point (winding fixed numerically, so builders need not care)
function quadO(A, a, b, c, d, ins, col, m, ca, cb, cc, cd, ua, ub, uc, ud) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const mx = (a[0] + c[0]) / 2 - ins[0], my = (a[1] + c[1]) / 2 - ins[1], mz = (a[2] + c[2]) / 2 - ins[2];
  if (nx * mx + ny * my + nz * mz >= 0) quad(A, a, b, c, d, col, m, ca, cb, cc, cd, ua, ub, uc, ud);
  else quad(A, a, d, c, b, col, m, ca, cd, cc, cb, ua, ud, uc, ub);
}
function triO(A, a, b, c, ins, col, m) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const mx = (a[0] + b[0] + c[0]) / 3 - ins[0], my = (a[1] + b[1] + c[1]) / 3 - ins[1], mz = (a[2] + b[2] + c[2]) / 3 - ins[2];
  if (nx * mx + ny * my + nz * mz >= 0) tri(A, a, b, c, col, col, col, m); else tri(A, a, c, b, col, col, col, m);
}
// extrude a 2D polygon [[u,v],...] (v = height). axis 'x': u runs along z, extruded x0..x1; axis 'z': u along x.
function extrude(A, poly, axis, t0, t1, col, m, o = {}) {
  const P = (u, v, t) => (axis === 'x' ? [t, v, u] : [u, v, t]);
  let cu = 0, cv = 0; for (const p of poly) { cu += p[0]; cv += p[1]; } cu /= poly.length; cv /= poly.length;
  const ins = P(cu, cv, (t0 + t1) / 2), n = poly.length, capM = o.capMat ?? m, capC = o.capCol || col;
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    const up = Math.abs(q[0] - p[0]) > Math.abs(q[1] - p[1]) * 0.6 && (p[1] + q[1]) / 2 > cv;
    quadO(A, P(p[0], p[1], t0), P(q[0], q[1], t0), P(q[0], q[1], t1), P(p[0], p[1], t1), ins, up && o.topCol ? o.topCol : col, up && o.topMat != null ? o.topMat : m);
    if (!o.noCaps) {
      triO(A, P(cu, cv, t0), P(p[0], p[1], t0), P(q[0], q[1], t0), ins, capC, capM);
      triO(A, P(cu, cv, t1), P(p[0], p[1], t1), P(q[0], q[1], t1), ins, capC, capM);
    }
  }
}
// compose a base transform {x,y,z,rot,sc} with a local placement
function place(A, B, x, y, z, rot = 0, s = 1) {
  const c = Math.cos(B.rot), sn = Math.sin(B.rot), X = x * B.sc, Z = z * B.sc;
  A.setT(B.x + X * c + Z * sn, B.y + y * B.sc, B.z - X * sn + Z * c, B.rot + rot, B.sc * s);
}
const IDENT = { x: 0, y: 0, z: 0, rot: 0, sc: 1 };

// a squat bearer (yaksha or monkey) holding up a cornice: 1.5 units tall, back to the wall at z = 0
function bearer(A, skin, trim, m) {
  const dk = mul(skin, 0.7);
  box(A, -0.27, 0, 0.3, 0.26, 0.5, 0.3, dk, m, { ox: 0.07, ao: 0.6 });
  box(A, 0.27, 0, 0.3, 0.26, 0.5, 0.3, dk, m, { ox: -0.07, ao: 0.6 });
  box(A, 0, 0.44, 0.27, 0.74, 0.56, 0.42, skin, m, { taper: 0.82, ao: 0.7 });
  box(A, 0, 0.98, 0.3, 0.34, 0.3, 0.32, trim, m, { ao: 0.75 });
  box(A, -0.5, 0.78, 0.24, 0.2, 0.72, 0.22, skin, m, { ox: -0.1, ao: 0.7 });
  box(A, 0.5, 0.78, 0.24, 0.2, 0.72, 0.22, skin, m, { ox: 0.1, ao: 0.7 });
  spike(A, 0, 1.28, 0.3, 0.3, 0.3, 0.22, trim, m);
}
// a standing guardian giant, 1 unit = 1 m at s = 1 (about 6.4 tall), facing +Z
function guardian(A, C, skin, robe) {
  box(A, 0, 0, 0, 2.6, 0.7, 2.2, C.stucco, 3, { taper: 0.9 });
  box(A, -0.55, 0.7, 0, 0.7, 1.9, 0.8, robe, 0, { taper: 0.8, ao: 0.6 });
  box(A, 0.55, 0.7, 0, 0.7, 1.9, 0.8, robe, 0, { taper: 0.8, ao: 0.6 });
  box(A, 0, 2.5, 0, 1.7, 0.7, 1.05, C.gold, 2, { taper: 0.92 });
  box(A, 0, 3.15, 0, 1.5, 1.5, 0.95, skin, 0, { tx: 1.12, tz: 1, ao: 0.7 });
  box(A, 0, 4.65, 0, 1.9, 0.3, 1.1, C.gold, 2, { taper: 0.6 });
  box(A, -1.02, 3.1, 0.1, 0.45, 1.5, 0.5, skin, 0, { ox: -0.1, ao: 0.7 });
  box(A, 1.02, 3.1, 0.25, 0.45, 1.5, 0.5, skin, 0, { ox: 0.1, oz: 0.2, ao: 0.7 });
  box(A, 0, 4.9, 0.02, 0.8, 0.8, 0.78, skin, 0, { taper: 0.92, ao: 0.75 });
  box(A, 0, 5.7, 0.02, 0.86, 0.22, 0.84, C.gold, 2, { taper: 0.8 });
  spike(A, 0, 5.92, 0.02, 0.62, 0.62, 1.25, C.gold, 2);
  // the club, planted between the feet
  box(A, 0, 0.7, 0.72, 0.3, 2.9, 0.3, C.teak, 4, { taper: 0.6, ao: 0.6 });
  box(A, 0, 0.7, 0.72, 0.5, 0.5, 0.5, C.gold, 2, { taper: 0.7 });
}
// a niche: stepped frame, dark recess, gilded figure, leaf gable. Faces +Z, origin at the foot of the wall.
function niche(A, C, w, h, band, fig = true) {
  const d = w * 0.3;
  box(A, -w * 0.5, 0, d * 0.5, w * 0.18, h, d, C.white, 0, { ao: 0.7 });
  box(A, w * 0.5, 0, d * 0.5, w * 0.18, h, d, C.white, 0, { ao: 0.7 });
  box(A, 0, h, d * 0.5, w * 1.36, h * 0.1, d * 1.2, band, 0, { ao: 0.6 });
  quad(A, [-w * 0.42, 0, 0.04], [w * 0.42, 0, 0.04], [w * 0.42, h, 0.04], [-w * 0.42, h, 0.04], C.recess, 5);
  // gable in two receding leaves
  extrude(A, [[-w * 0.72, h * 1.1], [w * 0.72, h * 1.1], [w * 0.3, h * 1.42], [0, h * 1.95], [-w * 0.3, h * 1.42]], 'z', d * 0.35, d * 0.75, C.white, 0, { capCol: band });
  extrude(A, [[-w * 0.5, h * 1.1], [w * 0.5, h * 1.1], [0, h * 1.62]], 'z', d * 0.75, d * 1.0, band, 0, { capCol: C.ochre });
  if (fig) {
    box(A, 0, 0, d * 0.42, w * 0.32, h * 0.56, w * 0.2, C.gold, 2, { taper: 0.7 });
    box(A, 0, h * 0.56, d * 0.42, w * 0.18, h * 0.13, w * 0.16, C.gold, 2);
    spike(A, 0, h * 0.69, d * 0.42, w * 0.16, w * 0.14, h * 0.2, C.gold, 2);
  }
}
// steep stair flight against a terrace: faces +Z, top edge at z = zTop, y1; foot at z = zTop + run, y0
function flight(A, C, y0, y1, zTop, run, wid) {
  const hw = wid / 2, zf = zTop + run;
  quad(A, [-hw, y0, zf], [hw, y0, zf], [hw, y1, zTop], [-hw, y1, zTop], C.stone, 6);
  for (const sx of [-1, 1]) {
    const x0 = sx * hw, x1 = sx * (hw + 0.6);
    extrude(A, [[zTop - 0.2, y0], [zf + 0.5, y0], [zf + 0.5, y0 + 0.9], [zTop + 0.3, y1 + 0.9], [zTop - 0.2, y1 + 0.9]], 'x', Math.min(x0, x1), Math.max(x0, x1), C.white, 0, { topCol: C.ochre });
    box(A, sx * (hw + 0.3), y0 + 0.9, zf + 0.15, 0.8, 0.9, 0.8, C.green, 0, { taper: 0.6 });
  }
}

// ---------- the prang ----------
// Built in "prang units" with y = 0 at its own foot; B = base transform. Returns the levels others need.
// a generator: it yields between stages so the caller can hand frames back while a 60k-triangle tower is built
function* buildPrang(A, B, C, rng, o) {
  const prof = [], rows = [], tiersOut = [];
  const push = (y, w, c, sh = 1, a) => prof.push({ y, w, c, sh, a });
  const bands = o.bands;
  let y = 0, bi = 0;
  const terraces = o.main ? [[25, 4.8], [20.5, 6], [16.5, 7], [13, 7]] : [[14, 5], [11.5, 6]];
  const tTops = [];
  terraces.forEach(([w, h], k) => {
    const band = bands[bi++ % bands.length];
    push(y, w + 0.7, C.ochreDk, 0.62);
    push(y + 0.55, w + 0.7, C.ochre, 0.95);
    push(y + 0.55, w + 0.25, C.white, 0.8);
    push(y + 1.0, w, C.white, 0.9);
    push(y + h - 2.6, w, C.white, 1.0);
    push(y + h - 1.15, w, C.white, 0.46);
    push(y + h - 1.15, w + 0.45, band, 0.5);
    push(y + h - 0.5, w + 0.75, band, 1.0);
    push(y + h - 0.5, w + 0.95, C.white, 0.85);
    push(y + h, w + 0.95, C.white, 1.0);
    if (k >= (o.main ? 1 : 9)) rows.push({ y: y + h - 1.15 - 1.5 * 0.92, w, s: 0.92, sp: 2.3 - k * 0.15 });
    tTops.push({ y0: y, y1: y + h, w });
    y += h;
  });
  // the body (ruean that)
  const wb = 9.6, hb = 12;
  const yBody = y;
  push(y, wb + 1.3, C.ochreDk, 0.6);
  push(y + 0.7, wb + 1.3, C.ochre, 0.95);
  push(y + 0.7, wb + 0.6, C.green, 0.75);
  push(y + 1.5, wb + 0.2, C.green, 1.0);
  push(y + 1.5, wb, C.white, 0.85);
  push(y + hb - 3.2, wb - 0.15, C.white, 1.0);
  push(y + hb - 1.5, wb - 0.15, C.white, 0.44);
  push(y + hb - 1.5, wb + 0.5, bands[1], 0.5);
  push(y + hb - 0.7, wb + 0.9, bands[1], 1.0);
  push(y + hb - 0.7, wb + 1.15, C.white, 0.85);
  push(y + hb, wb + 1.15, C.white, 1.0);
  rows.push({ y: y + hb - 1.5 - 1.5 * (o.main ? 1 : 1.25), w: wb - 0.15, s: o.main ? 1 : 1.25, sp: o.main ? 1.75 : 3.3 });
  y += hb;
  // the corn cob: n tiers on a bullet curve, each a wall, a shadowed neck and a coloured cornice
  const n = o.tiers, yTopCob = o.H - 8.6, span = yTopCob - y;
  let sum = 0; for (let i = 0; i < n; i++) sum += Math.pow(0.93, i);
  const wAt = (t) => 9.3 * Math.pow(Math.cos(t * 1.27), 0.82) * (1 + 0.035 * Math.sin(t * 3.1));
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const dh = span * Math.pow(0.93, i) / sum, t0 = acc / span, t1 = (acc + dh) / span;
    const w0 = wAt(t0), w1 = wAt(t0 + (t1 - t0) * 0.7), lip = 0.34 * (1 - t0 * 0.45), band = bands[(i + bi) % bands.length];
    const aF = 0.52 + 0.05 * t0;
    push(y, w0, C.white, 0.82, aF);
    push(y + dh * 0.48, (w0 + w1) / 2, i % 2 ? C.cream : C.white, 1.0, aF);
    push(y + dh * 0.72, w1, C.white, 0.42, aF);
    push(y + dh * 0.72, w1 + lip, band, 0.5, aF);
    push(y + dh * 0.92, w1 + lip * 1.9, band, 1.0, aF);
    push(y + dh, w1 + lip * 1.9, C.white, 1.0, aF);
    tiersOut.push({ y0: y, yTop: y + dh, w: w0, wLip: w1 + lip * 1.9, dh, t: t0 });
    y += dh; acc += dh;
  }
  // lotus-bud cap going to gold
  const wc = wAt(1);
  push(y, wc * 0.96, C.white, 0.7, 0.6);
  push(y + 1.2, wc * 1.04, C.white, 1, 0.6);
  push(y + 2.4, wc * 0.86, C.ochre, 1, 0.62);
  push(y + 2.4, wc * 0.62, C.gold, 0.6, 0.64);
  push(y + 3.6, wc * 0.5, C.gold, 1, 0.66);
  push(y + 4.6, wc * 0.2, C.gold, 1, 0.7);
  A.setT(B.x, B.y, B.z, B.rot, B.sc);
  // everything up to the gold is porcelain (0); the last three segments gold (2)
  prof.forEach((p, i) => { p.m = i >= prof.length - 3 ? 2 : 0; });
  sweepRedent(A, prof, 0, 0.52, 0.56);
  const yFin = y + 4.6;
  // trident finial (nopphasun): shaft, three tiers of upswept prongs, crown
  box(A, 0, yFin - 0.4, 0, 0.5, o.H - yFin + 0.4, 0.5, C.gold, 2, { taper: 0.35 });
  for (let k = 0; k < 3; k++) {
    const yy = yFin + 0.5 + k * 1.05, r = 0.85 - k * 0.18;
    for (let q = 0; q < 4; q++) {
      place(A, B, 0, yy, 0, q * Math.PI / 2);
      box(A, 0, 0, r * 0.5, 0.16, 0.16, r, C.gold, 2, { noTop: false });
      spike(A, 0, 0.1, r, 0.2, 0.2, 1.0 - k * 0.15, C.gold, 2, 0, 0.12);
    }
  }
  yield;
  // bearers under the cornices
  const skins = [C.green, C.ochre, C.white, C.blue];
  let nRow = 0;
  for (const r of rows) {
    if (nRow++ % 3 === 2) yield;
    const ring = redentRing(r.w + 0.02);
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
      const cnt = Math.max(1, Math.round(L / r.sp)), rot = Math.atan2(dz / L, -dx / L);
      for (let k = 0; k < cnt; k++) {
        const f = (k + 0.5) / cnt;
        place(A, B, p[0] + dx * f, r.y, p[1] + dz * f, rot, r.s);
        const sk = skins[(i * 3 + k) % 3 === 0 ? 1 : (k + i) % 2 ? 0 : 2];
        bearer(A, sk, (k + i) % 3 ? C.white : C.ochre, 0);
      }
    }
  }
  yield;
  // leaf antefixes on every tier's convex corners; a small niche on each cardinal face
  tiersOut.forEach((t, ti) => {
    const ring = redentRing(t.w + 0.05, 0.52 + 0.05 * t.t), sz = Math.max(0.45, t.dh * 0.36);
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i];
      if (!p[2]) {
        place(A, B, p[0] * 1.0, t.y0, p[1] * 1.0, 0, 1);
        const cc = mix3(C.white, (i + ti) % 3 === 0 ? C.ochre : (i + ti) % 3 === 1 ? C.green : C.blue, (i + ti) % 2 ? 0.75 : 0.3);
        spike(A, 0, 0, 0, sz * 0.8, sz * 0.8, sz * 2.3, cc, 0, p[0] * 0.02, p[1] * 0.02);
      }
    }
    if (t.w > 3.4) for (let q = 0; q < 4; q++) {
      const nw = Math.min(2.0, t.w * 0.26), nh = t.dh * 0.42;
      place(A, B, 0, t.y0, 0, q * Math.PI / 2);
      A.tx += Math.sin(B.rot + q * Math.PI / 2) * t.w * B.sc; A.tz += Math.cos(B.rot + q * Math.PI / 2) * t.w * B.sc;
      niche(A, C, nw, nh, o.bands[(ti + q) % 3], ti < 4);
    }
  });
  yield;
  // big porch niches on the body, each with a spirelet above
  for (let q = 0; q < 4; q++) {
    const rot = q * Math.PI / 2;
    place(A, B, Math.sin(rot) * (wb - 0.1), yBody + 1.5, Math.cos(rot) * (wb - 0.1), rot);
    box(A, 0, -1.5, 1.0, 5.4, 1.5, 2.2, C.white, 0, { taper: 0.9 });
    niche(A, C, 3.4, 5.0, C.green, true);
    spike(A, 0, 9.4, 0.5, 1.1, 1.1, 2.6, C.gold, 2);
  }
  // stairs up the cardinal faces
  tTops.forEach((t, k) => {
    const h = t.y1 - t.y0;
    for (let q = 0; q < 4; q++) {
      place(A, B, 0, 0, 0, q * Math.PI / 2);
      flight(A, C, t.y0, t.y1, t.w + 0.95, h * 0.56, o.main ? 3.6 - k * 0.3 : 4.2);
    }
  });
  A.resetT();
  return { yBody, hb, wb, tiers: tiersOut, terraces: tTops, prof };
}

// ---------- tiered Thai roofs and halls ----------
// Local frame: ridge along z, eaves line at y = 0. W = half-width of the building, L = half-length.
function thaiRoof(A, B, C, o) {
  const { W, L, tiers } = o, Wd = W + 1.9, step = Math.min(3.2, L * 0.24), dy = 0.62;
  // cross-section of one side: [x0, drop0, x1, drop1] measured down from the ridge
  const s0 = 0.46 * Wd * 1.32, s1 = s0 + 0.3 + 0.34 * Wd * 0.72, H0 = s1 + 0.3 + 0.36 * Wd * 0.46 - 0.4;
  const segs = [[0, 0, 0.46 * Wd, s0], [0.42 * Wd, s0 + 0.3, 0.78 * Wd, s1], [0.74 * Wd, s1 + 0.3, 1.12 * Wd, H0 + 0.4]];
  place(A, B, 0, 0, 0);
  const ins = [0, -5, 0];
  for (let t = 0; t < tiers; t++) {
    const Lt = L + 1.6 - t * step, yo = H0 + t * dy, top = t === tiers - 1;
    const z0 = t === tiers - 1 ? 0 : Lt - step - 1.2; // lower tiers only need their visible end pieces
    for (const sx of [-1, 1]) {
      segs.forEach((g, gi) => {
        const xa = sx * g[0], ya = yo - g[1], xb = sx * g[2], yb = yo - g[3], sl = Math.hypot(g[2] - g[0], g[3] - g[1]);
        const fb = 1 - Math.min(0.4, 0.75 / sl), xm = xa + (xb - xa) * fb, ym = ya + (yb - ya) * fb;
        const fld = gi === 0 ? C.roofA : mix3(C.roofA, C.roofA2, 0.5), brd = C.roofB;
        for (const ez of (top ? [0] : [-1, 1])) {
          const za = top ? -Lt : ez * z0, zb = top ? Lt : ez * Lt, zl = Math.min(za, zb), zh = Math.max(za, zb);
          const cuts = [zl, top || ez < 0 ? zl + 0.9 : zl, top || ez > 0 ? zh - 0.9 : zh, zh];
          for (let k = 0; k < 3; k++) {
            if (cuts[k + 1] - cuts[k] < 0.01) continue;
            const col = k === 1 ? fld : brd, u0 = cuts[k], u1 = cuts[k + 1];
            quadO(A, [xa, ya, u0], [xa, ya, u1], [xm, ym, u1], [xm, ym, u0], ins, col, 1, null, null, null, null, [u0, 0], [u1, 0], [u1, sl * fb], [u0, sl * fb]);
            quadO(A, [xm, ym, u0], [xm, ym, u1], [xb, yb, u1], [xb, yb, u0], ins, brd, 1, null, null, null, null, [u0, sl * fb], [u1, sl * fb], [u1, sl], [u0, sl]);
          }
        }
      });
    }
    // gable ends: pediment, bargeboards with upswept hooks, horn finial
    for (const ez of [-1, 1]) {
      const zg = ez * (Lt - 0.55), xe = 0.46 * Wd, ye = yo - s0;
      tri(A, ...(ez > 0 ? [[-xe, ye, zg], [xe, ye, zg], [0, yo - 0.2, zg]] : [[xe, ye, zg], [-xe, ye, zg], [0, yo - 0.2, zg]]), C.pedRed, C.pedRed, C.gold, 2);
      // wall of the pediment below, down to the eaves
      // (it wears the porcelain mosaic with its faience flowers, in a gilt frame, a red band and a gilt lozenge: no bare panel)
      const yb = yo - H0 - 0.2, zf = zg + ez * 0.035, ym = (yb + ye - 0.5) / 2, lh = (ye - 0.5 - yb) * 0.36;
      quadO(A, [-xe, yb, zg], [xe, yb, zg], [xe, ye, zg], [-xe, ye, zg], [0, 0, 0], C.white, 0);
      box(A, 0, yb - 0.14, zg + ez * 0.1, 2 * xe + 0.36, 0.3, 0.32, C.gold, 2);
      box(A, 0, ye - 0.17, zg + ez * 0.07, 2 * xe, 0.2, 0.18, C.gold, 2);
      quadO(A, [-xe, ye - 0.5, zf], [xe, ye - 0.5, zf], [xe, ye - 0.17, zf], [-xe, ye - 0.17, zf], [0, 0, 0], C.pedRed, 2);
      quadO(A, [-lh * 1.25, ym, zf], [0, ym - lh, zf], [lh * 1.25, ym, zf], [0, ym + lh, zf], [0, 0, 0], C.gold, 2);
      quadO(A, [-lh * 0.8, ym, zf + ez * 0.02], [0, ym - lh * 0.64, zf + ez * 0.02], [lh * 0.8, ym, zf + ez * 0.02], [0, ym + lh * 0.64, zf + ez * 0.02], [0, 0, 0], C.pedRed, 2);
      quadO(A, [-lh * 0.36, ym, zf + ez * 0.04], [0, ym - lh * 0.29, zf + ez * 0.04], [lh * 0.36, ym, zf + ez * 0.04], [0, ym + lh * 0.29, zf + ez * 0.04], [0, 0, 0], C.gold, 2);
      for (const sx of [-1, 1]) box(A, sx * (xe - 0.13), yb, zg + ez * 0.07, 0.26, ye - yb, 0.18, C.gold, 2, { noTop: true });
      for (const sx of [-1, 1]) {
        const zl = ez > 0 ? Lt - 0.15 : -Lt - 0.3;
        extrude(A, [[0, yo - 0.1], [sx * xe, ye - 0.1], [sx * (xe + 0.5), ye + 0.05], [sx * (xe + 0.2), ye + 0.75], [sx * xe * 0.9, ye + 0.62 + 0.1 * s0], [0, yo + 0.6]], 'z', zl, zl + 0.45, C.gold, 2);
        place(A, B, sx * (xe + 0.3), ye + 0.4, ez * Lt);
        spike(A, 0, 0, 0, 0.42, 0.42, 1.5, C.gold, 2, sx * 0.55, 0);
        place(A, B, sx * 1.12 * Wd, yo - H0 - 0.45, ez * (Lt - 0.4));
        spike(A, 0, 0, 0, 0.36, 0.36, 0.95, C.gold, 2, sx * 0.4, 0);
        place(A, B, 0, 0, 0);
      }
      // chofa: slender horn sweeping up and out from the ridge end
      const cz = ez * Lt, hs = 0.8 + 0.2 * t;
      box(A, 0, yo + 0.3, cz, 0.36, 1.1 * hs, 0.42, C.gold, 2, { taper: 0.7, oz: ez * 0.35 * hs });
      spike(A, 0, yo + 0.3 + 1.1 * hs, cz + ez * 0.35 * hs, 0.26, 0.3, 1.9 * hs, C.gold, 2, 0, ez * 0.75 * hs);
    }
    // ridge beam
    box(A, 0, yo - 0.12, 0, 0.5, 0.42, 2 * Lt - 0.4, C.roofB, 1, { taper: 0.6 });
  }
  A.resetT();
  return H0 + (tiers - 1) * dy;
}
// a hall (closed viharn) or an open landing sala; B.y = floor level of its plinth foot
function hall(A, B, C, o) {
  const { W, L, wallH } = o, pl = o.plinth ?? 1.4;
  place(A, B, 0, 0, 0);
  if (!o.noPlinth) {
    box(A, 0, 0, 0, 2 * W + 5.6, pl * 0.5, 2 * L + 4.6, C.stone, 3, { taper: 0.985, topMat: 7 });
    box(A, 0, pl * 0.5, 0, 2 * W + 4.4, pl * 0.5, 2 * L + 3.4, C.stucco, 3, { taper: 0.985, topMat: 7 });
  }
  const y0 = o.noPlinth ? 0 : pl;
  if (!o.open) {
    box(A, 0, y0, 0, 2 * W, wallH, 2 * L, C.stucco, 3, { noTop: true, ao: 0.66 });
    box(A, 0, y0, 0, 2 * W + 0.5, 1.0, 2 * L + 0.5, C.ochre, 0, { taper: 0.97 });
    const nW = Math.max(3, Math.round(L / 2.6));
    for (const sx of [-1, 1]) for (let k = 0; k < nW; k++) {
      const z = (k + 0.5) / nW * 2 * L - L, x = sx * (W + 0.03);
      quadO(A, [x, y0 + 2.2, z - 0.7], [x, y0 + 2.2, z + 0.7], [x, y0 + 5.6, z + 0.7], [x, y0 + 5.6, z - 0.7], [0, y0 + 3, z], C.pedRed, 5);
      box(A, sx * (W + 0.12), y0 + 5.6, z, 0.3, 0.3, 2.1, C.gold, 2);
      spike(A, sx * (W + 0.12), y0 + 5.9, z, 0.24, 1.7, 1.5, C.gold, 2);
      box(A, sx * (W + 0.12), y0 + 1.9, z, 0.36, 0.3, 2.0, C.gold, 2);
    }
    for (const ez of [-1, 1]) {
      const z = ez * (L + 0.03);
      quadO(A, [-1.3, y0, z], [1.3, y0, z], [1.3, y0 + 6.2, z], [-1.3, y0 + 6.2, z], [0, y0 + 3, 0], C.pedRed, 5);
      box(A, 0, y0 + 6.2, ez * (L + 0.15), 3.6, 0.4, 0.4, C.gold, 2);
      spike(A, 0, y0 + 6.6, ez * (L + 0.15), 3.0, 0.3, 2.4, C.gold, 2);
      for (const sx of [-1, 1]) box(A, sx * 1.6, y0, ez * (L + 0.15), 0.45, 6.2, 0.4, C.gold, 2);
    }
  }
  // colonnade carrying the skirt roofs
  const cx = W + (o.open ? 0 : 1.7), nC = Math.max(2, Math.round(L / (o.open ? 2.0 : 2.4)));
  for (const sx of [-1, 1]) for (let k = 0; k <= nC; k++) {
    const z = (k / nC * 2 - 1) * (L + (o.open ? 0 : 1.2));
    box(A, sx * cx, y0, z, 0.62, wallH, 0.62, C.white, 0, { taper: 0.8, ao: 0.7, noTop: true });
    box(A, sx * cx, y0, z, 0.86, 0.5, 0.86, C.ochre, 0, { taper: 0.85 });
    spike(A, sx * cx, y0 + wallH - 0.9, z, 1.0, 1.0, -0.8, C.gold, 2);
  }
  if (o.open) {
    for (const ez of [-1, 1]) for (const fx of [-0.34, 0.34]) box(A, fx * W * 2 * 0.5, y0, ez * L, 0.55, wallH, 0.55, C.white, 0, { taper: 0.8, ao: 0.7, noTop: true });
    // turned rail with saffron robes over it on the outer side
    for (const sx of [-1, 1]) box(A, sx * cx, y0 + 0.9, 0, 0.16, 0.14, 2 * L, C.teak, 4);
    for (const ez of [-1, 1]) for (const sx of [-1, 1]) box(A, sx * W * 0.67, y0 + 0.9, ez * L, W * 0.66, 0.14, 0.16, C.teak, 4);
  }
  const rh = thaiRoof(A, { x: B.x, y: B.y + (y0 + wallH) * B.sc, z: B.z, rot: B.rot, sc: B.sc }, C, o);
  A.resetT();
  return y0 + wallH + rh;
}

// cloth strip hanging from pA..pB (top edge), `len` long, n rows; cols(r) gives the row colour; forked tail
function clothStrip(A, pA, pB, len, n, cols, phase, sw0, sw1, fork = 0.12) {
  const mx = (pA[0] + pB[0]) / 2, mz = (pA[2] + pB[2]) / 2, my = (pA[1] + pB[1]) / 2;
  for (let r = 0; r < n; r++) {
    const v0 = r / n, v1 = (r + 1) / n, y0 = -len * v0, y1 = -len * v1, last = r === n - 1;
    const s0 = sw0 + (sw1 - sw0) * v0 * v0, s1 = sw0 + (sw1 - sw0) * v1 * v1, c = cols(r);
    const a = [pA[0], pA[1] + y0, pA[2]], m0 = [mx, my + y0, mz], b = [pB[0], pB[1] + y0, pB[2]];
    const d = [pA[0], pA[1] + y1, pA[2]], m1 = [mx, my + y1 + (last ? len * fork : 0), mz], e = [pB[0], pB[1] + y1, pB[2]];
    const u0 = [phase, v0], u1 = [phase, v1];
    tri(A, a, d, m1, c, c, c, 0, u0, u1, u1, s0, s1, s1); tri(A, a, m1, m0, c, c, c, 0, u0, u1, u0, s0, s1, s0);
    tri(A, m0, m1, e, c, c, c, 0, u0, u1, u1, s0, s1, s1); tri(A, m0, e, b, c, c, c, 0, u0, u1, u0, s0, s1, s0);
  }
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('khlong-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const lin = (c, k = 1) => [c.r * k, c.g * k, c.b * k];
  const hex = (h, k = 1) => lin(new THREE.Color(h), k);
  // ---- colours (linear) ----
  const C = {
    white: lin(pal[3], 0.84), cream: mix3(lin(pal[3], 0.8), lin(pal[2], 0.8), 0.22),
    ochre: mix3(lin(pal[2], 0.74), lin(pal[4], 0.74), 0.3), green: lin(pal[5], 0.95),
    blue: mix3(lin(pal[6]), hex('#2a55a8'), 0.6), gold: hex('#e2a43a'), teak: lin(pal[0]),
    stucco: mix3(lin(pal[3], 0.74), lin(pal[1], 0.7), 0.1), stone: mix3(lin(pal[3], 0.66), lin(pal[0], 0.8), 0.16),
    pedRed: hex('#7c211b'), recess: hex('#1c1310'),
  };
  C.ochreDk = mul(C.ochre, 0.62);
  const scheme = rng.int(0, 2);
  C.roofA = scheme === 1 ? lin(pal[5], 1.0) : scheme === 2 ? hex('#a5341f') : lin(pal[4], 0.95);
  C.roofA2 = scheme === 1 ? lin(pal[1]) : lin(pal[2], 0.8);
  C.roofB = scheme === 1 ? lin(pal[4], 0.95) : lin(pal[5], 0.9);
  const bands = rng.shuffle([C.green, C.ochre, C.blue]);
  const tiers = rng.int(8, 10);
  const sashCol = rng.chance(0.7) ? hex('#f08a1c') : rng.chance(0.5) ? hex('#d9402a') : hex('#f2c230');
  const bannerCols = rng.shuffle([hex('#c92f26'), hex('#ee8f1c'), hex('#efc634'), hex('#e0668c'), lin(pal[3], 0.85), hex('#ee8f1c'), lin(pal[3], 0.8), rng.chance(0.5) ? lin(pal[5], 1.1) : hex('#c92f26')]);

  const A = makeAcc(150000), K = makeAcc(9000);
  const TY = TERRACE_Y;

  // ---- 1. the prang and its four satellites ----
  const stepped = async (it) => { let st; while (!(st = it.next()).done) await ctx.yield?.(); return st.value; };
  const PS = Math.max(1, Math.min(1.4, opts.prangScale ?? 1));   // the central prang alone may stand larger (its tip at TY + 76.8 * PS)
  const main = await stepped(buildPrang(A, { x: 0, y: TY, z: 0, rot: 0, sc: PS }, C, rng, { main: true, H: 80 - TY, tiers, bands }));
  await ctx.yield?.();
  const satS = (28 - TY) / 76.8, satPos = [[-31, 31], [31, 31], [-31, -31], [31, -31]];
  const satSash = rng.int(0, 1);
  let sat = null;
  for (const [sx, sz] of satPos) {
    sat = await stepped(buildPrang(A, { x: sx, y: TY, z: sz, rot: 0, sc: satS }, C, rng, { main: false, H: 76.8, tiers: tiers - 2, bands: [bands[1], bands[2], bands[0]] }));
    await ctx.yield?.();
  }
  await ctx.yield?.();

  // ---- 2. terrace, river wall, river stairs ----
  A.resetT();
  box(A, 0, -1.6, 9, 132, TY + 1.6, 118, C.stucco, 3, { topMat: 7, ao: 0.6 });
  for (const sx of [-1, 1]) {
    box(A, sx * 40.5, -1.6, 73, 51, TY + 1.6, 10, C.stucco, 3, { topMat: 7, ao: 0.6 });
    // buttresses, coping, boundary posts along the river wall
    for (let k = 0; k < 9; k++) box(A, sx * (17.2 + k * 6), -1.6, QUAY_Z + 0.25, 1.0, TY + 1.5, 0.6, C.stucco, 3, { tx: 0.8, tz: 0.5, ao: 0.55 });
    box(A, sx * 41.5, TY, QUAY_Z - 0.45, 49, 0.85, 0.5, C.white, 0, { ao: 0.7 });
    box(A, sx * 41.5, TY + 0.85, QUAY_Z - 0.45, 49, 0.16, 0.7, C.ochre, 0);
    for (let k = 0; k < 13; k++) {
      const x = sx * (17.6 + k * 4);
      box(A, x, TY, QUAY_Z - 0.45, 0.8, 1.5, 0.8, C.white, 0, { taper: 0.85 });
      spike(A, x, TY + 1.5, QUAY_Z - 0.45, 0.9, 0.9, 1.1, k % 2 ? C.green : C.ochre, 0);
    }
    // stair cheek walls, stepped down to the water, with a naga rearing at the foot
    extrude(A, [[67.4, -1.6], [80.0, -1.6], [80.0, 0.5], [78.4, 0.5], [68.6, TY + 1.0], [67.4, TY + 1.0]], 'x', sx > 0 ? 15 : -16, sx > 0 ? 16 : -15, C.white, 0, { topCol: C.green });
    place(A, IDENT, sx * 15.5, 0.5, 79.2);
    box(A, 0, 0, 0, 0.8, 1.5, 0.9, C.green, 0, { taper: 0.75, oz: 0.5 });
    box(A, 0, 1.5, 0.5, 1.0, 0.8, 1.1, C.ochre, 0, { taper: 0.7, oz: 0.3 });
    spike(A, 0, 2.3, 0.8, 0.6, 0.6, 1.6, C.gold, 2, 0, -0.5);
    A.resetT();
  }
  const stepTint = () => mul(C.stone, rng.range(0.82, 1.12));
  for (let i = 0; i <= 16; i++) {
    const y = TY - i * 0.25, z0 = 68.4 + i * 0.6, z1 = z0 + 0.6, c = stepTint();
    quad(A, [-15, y, z1], [15, y, z1], [15, y, z0], [-15, y, z0], c, 3);
    quad(A, [-15, y - 0.25, z1], [15, y - 0.25, z1], [15, y, z1], [-15, y, z1], mul(c, 0.72), 3);
  }
  quad(A, [-15, TY, 68.4], [15, TY, 68.4], [15, TY, 67.9], [-15, TY, 67.9], C.stone, 7);
  // forecourt: a processional row of small bell stupas either side of the axis
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) {
    place(A, IDENT, sx * 12.5, TY, PS > 1.02 ? 26 * PS + 4.6 + k * (63 - 26 * PS - 4.6) / 4 : 34 + k * 7.2, 0, 0.9 + 0.2 * rng());
    box(A, 0, 0, 0, 2.2, 0.6, 2.2, C.white, 0, { taper: 0.9 });
    box(A, 0, 0.6, 0, 1.7, 0.5, 1.7, k % 2 ? C.green : C.ochre, 0, { taper: 0.85 });
    box(A, 0, 1.1, 0, 1.4, 1.3, 1.4, C.white, 0, { taper: 0.5 });
    spike(A, 0, 2.4, 0, 0.6, 0.6, 1.9, C.gold, 2);
  }
  // gate guardians at the head of the stairs
  const guardPos = [[-20.5, 72.5], [20.5, 72.5]];
  guardPos.forEach(([gx, gz], i) => {
    place(A, IDENT, gx, TY, gz, 0, 1.2);
    guardian(A, C, i ? C.white : C.green, i ? C.blue : C.ochre);
  });
  await ctx.yield?.();

  // ---- 3. viharn halls and landing pavilions ----
  const hallH = [];
  for (const sx of [-1, 1]) {
    hallH.push(hall(A, { x: sx * 47, y: TY, z: 30, rot: 0, sc: 1 }, C, { W: 7, L: 16, wallH: 8.5, tiers: rng.int(3, 4) }));
    // pavilion jetty on piles
    A.resetT();
    box(A, sx * 15.5, 0.95, 85.2, 10.4, 0.45, 13.2, C.teak, 4, { ao: 0.6, bottom: true });
    for (const px of [-4.4, 0, 4.4]) for (const pz of [-5.6, -1.9, 1.9, 5.6]) box(A, sx * 15.5 + px, -2.2, 85.2 + pz, 0.5, 3.2, 0.5, mul(C.teak, 0.7), 4, { ao: 0.5, noTop: true });
    box(A, sx * 19.2, 1.4, 79.3, 3, 0.6, 1.6, C.stone, 3); box(A, sx * 19.2, 2.0, 78.9, 3, 0.6, 0.8, C.stone, 3);
    hall(A, { x: sx * 15.5, y: 1.4, z: 85.2, rot: 0, sc: 1 }, C, { W: 3.5, L: 4.7, wallH: 4.5, tiers: 3, open: true, noPlinth: true });
    await ctx.yield?.();
  }
  await ctx.yield?.();

  // ---- 4. banner poles, banners, pennant lines, sashes, robes, mooring posts ----
  A.resetT();
  const poles = [];
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 4; k++) poles.push({ x: sx * (24 + k * 8), z: 75.4, y0: TY, h: rng.range(13, 15.5), dir: sx, quay: true });
    poles.push({ x: sx * 11.3, z: 93.6, y0: -2.2, h: rng.range(12.5, 14), dir: sx, quay: false });
    poles.push({ x: sx * 20.4, z: 94.2, y0: -2.2, h: rng.range(11, 12.5), dir: sx, quay: false });
  }
  const bannerTops = [];
  poles.forEach((p, i) => {
    const top = p.y0 + p.h;
    box(A, p.x, p.y0, p.z, 0.36, p.h, 0.36, C.pedRed, 2, { taper: 0.5, ao: 0.6 });
    box(A, p.x, Math.max(p.y0, 0) + (p.quay ? 0 : 1.2), p.z, 0.6, 0.8, 0.6, p.quay ? C.white : C.gold, p.quay ? 0 : 2, { taper: 0.8 });
    box(A, p.x, top - 3.2, p.z, 0.3, 0.25, 0.3, C.gold, 2); box(A, p.x, top - 0.25, p.z, 0.3, 0.25, 0.3, C.gold, 2);
    spike(A, p.x, top, p.z, 0.34, 0.34, 1.3, C.gold, 2);
    box(A, p.x + p.dir * 0.8, top - 0.75, p.z, 1.9, 0.14, 0.14, C.gold, 2);
    bannerTops.push(new THREE.Vector3(p.x, top, p.z));
    if (opts.banners === false) return;
    const cA = bannerCols[i % bannerCols.length], cB = bannerCols[(i + 2) % bannerCols.length], cW = bannerCols[(i + 4) % bannerCols.length];
    const len = Math.min(p.h - 3.5, rng.range(7.5, 10.5)), n = 16, ph = rng();
    const cols = (r) => (r < 2 ? cA : r > n - 3 ? cA : (Math.floor((r - 2) / 2) % 3 === 0 ? cB : Math.floor((r - 2) / 2) % 3 === 1 ? cW : cA));
    clothStrip(K, [p.x + p.dir * 0.3, top - 0.82, p.z + 0.02], [p.x + p.dir * 1.6, top - 0.82, p.z + 0.02], len, n, cols, ph, 0.03, 1.5);
  });
  // pennant lines sagging between neighbouring quay poles
  if (opts.banners !== false) for (let i = 0; i < poles.length - 1; i++) {
    const p = poles[i], q = poles[i + 1];
    if (!p.quay || !q.quay) continue;
    const ya = p.y0 + p.h - 3.1, yb = q.y0 + q.h - 3.1, np = 9;
    for (let k = 0; k < np; k++) {
      const f = (k + 0.5) / np, sag = 2.2 * 4 * f * (1 - f), x = p.x + (q.x - p.x) * f, y = ya + (yb - ya) * f - sag;
      const c = bannerCols[(k + i) % bannerCols.length], uvp = [rng(), 0.5];
      tri(K, [x - 0.38, y, p.z], [x, y - 1.0, p.z], [x + 0.38, y, p.z], c, c, c, 0, uvp, uvp, uvp, 0.02, 0.45, 0.02);
    }
  }
  // saffron sash round the waist of the prang, with a knot and two tails; one front satellite wears one too
  const sash = (bx, by, bz, sc, w, yLo, yHi, sw) => {
    const ring = redentRing(w);
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length], c = mul(sashCol, i % 2 ? 0.92 : 1.05), u = [i * 0.37 % 1, 0.5];
      const a = [bx + p[0] * sc, by + yLo * sc, bz + p[1] * sc], b = [bx + q[0] * sc, by + yLo * sc, bz + q[1] * sc];
      const d = [bx + p[0] * sc, by + yHi * sc, bz + p[1] * sc], e = [bx + q[0] * sc, by + yHi * sc, bz + q[1] * sc];
      tri(K, a, d, e, c, c, c, 0, u, u, u, sw, sw * 0.5, sw * 0.5); tri(K, a, e, b, c, c, c, 0, u, u, u, sw, sw * 0.5, sw);
    }
  };
  sash(0, TY, 0, PS, main.wb + 0.14 / PS, main.yBody + 2.1, main.yBody + 4.1, 0.16);
  for (const tx of [3.3, 4.5]) {
    clothStrip(K, [tx * PS, TY + (main.yBody + 2.6) * PS, main.wb * PS + 0.4], [tx * PS + 1.0, TY + (main.yBody + 2.6) * PS, main.wb * PS + 0.4], rng.range(5, 7.5) * PS, 8, () => sashCol, rng(), 0.05, 0.8);
  }
  box(A, 4.4 * PS, TY + (main.yBody + 2.5) * PS, main.wb * PS + 0.3, 1.3, 1.1, 0.6, sashCol, 3, { taper: 0.7 });
  {
    const [sx, sz] = satPos[satSash];
    sash(sx, TY, sz, satS, sat.wb + 0.3, sat.yBody + 2.2, sat.yBody + 5.0, 0.1);
  }
  // marigold and jasmine garlands looped under the front lintel of each landing pavilion
  for (const sx of [-1, 1]) for (const half of [-1, 1]) for (let k = 0; k < 9; k++) {
    const f = (k + 0.5) / 9, x = sx * 15.5 + half * (0.2 + 2.1 * f), y = 5.56 - 0.62 * 4 * f * (1 - f), z = 91.12, c = k % 2 ? hex('#f4f0e2') : hex('#f09a14'), u = [(k * 0.37 + (sx + half) * 0.21 + 1) % 1, 0.5];
    tri(K, [x - 0.13, y, z], [x, y - 0.42, z], [x + 0.13, y, z], c, c, c, 0, u, u, u, 0.01, 0.1, 0.01);
  }
  // robes drying over the outer rails of the pavilions
  const robeCols = [hex('#f08a1c'), hex('#e0661a'), hex('#f3a52a')];
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    const z = 81.6 + k * 2.4 + rng.range(-0.3, 0.3), x = sx * 19.12, c = robeCols[(k + (sx > 0 ? 1 : 0)) % 3];
    clothStrip(K, [x, 2.4, z], [x, 2.4, z + 1.5], rng.range(0.9, 1.25), 3, () => c, rng(), 0.01, 0.22, 0);
  }
  // mooring posts (egret perches) off the pavilions
  const egretPosts = [];
  for (const [mx, mz] of [[-23.2, 88.5], [23.2, 88.5], [-23.8, 82.6], [23.8, 82.6]]) {
    const h = rng.range(4.4, 5.4);
    box(A, mx, -2.2, mz, 0.44, h, 0.44, mul(C.teak, 0.85), 4, { taper: 0.8, ox: rng.range(-0.15, 0.15), ao: 0.45 });
    box(A, mx, -2.2 + h * 0.78, mz, 0.5, 0.5, 0.5, rng.chance(0.5) ? C.white : hex('#b8322a'), 3, { taper: 0.95, noTop: true });
    egretPosts.push(new THREE.Vector3(mx, -2.2 + h, mz));
  }
  await ctx.yield?.();

  // ---- geometries ----
  const toGeo = (acc, cloth) => {
    const g = new THREE.BufferGeometry(), n = acc.count;
    g.setAttribute('position', new THREE.BufferAttribute(acc.pos.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(acc.nrm.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(acc.col.slice(0, n * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(acc.uv.slice(0, n * 2), 2));
    if (cloth) g.setAttribute('aSway', new THREE.BufferAttribute(acc.sway.slice(0, n), 1));
    else g.setAttribute('aMat', new THREE.BufferAttribute(acc.mat.slice(0, n), 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  const group = new THREE.Group(); group.name = 'khlong-run-hero';
  const sunDef = new THREE.Vector3(-0.941, 0.225, 0.252).normalize();
  const toV3 = (v) => (Array.isArray(v) ? new THREE.Vector3(v[0], v[1], v[2]) : v.clone()).normalize();
  let sunFixed = !!opts.sunDir;
  const U = {
    uTime: { value: 0 }, uSun: { value: opts.sunDir ? toV3(opts.sunDir) : sunDef.clone() },
    uSunCol: { value: new THREE.Color('#ffd28a') }, uGlint: { value: 1 }, uWind: { value: 1 }, uTip: { value: 1 },
    uF1: { value: new THREE.Color().fromArray(bands[0]) }, uF2: { value: new THREE.Color().fromArray(bands[1]) }, uF3: { value: new THREE.Color().fromArray(bands[2]) },
    uCamL: { value: new THREE.Vector3(0, 1.5, 300) }, uSunL: { value: sunDef.clone() },
    uLit: { value: new THREE.Color().fromArray(mul(mix3(C.white, lin(pal[2]), 0.5), 0.8)) }, uShade: { value: new THREE.Color().fromArray(mul(mix3(lin(pal[6]), C.white, 0.2), 0.6)) },
    uRoof: { value: new THREE.Color().fromArray(mul(mix3(C.roofA, C.roofB, 0.3), 0.6)) },
    uGold: { value: new THREE.Color(1.25, 0.95, 0.5) }, uPS: { value: PS }, uCol: { value: opts.column ?? 0.5 },
    uMK: { value: new THREE.Vector3(0.86, 0.6, 1.6) },   // the reflection's gain, the floor of its broken dashes, the gold column's base width (the world may retune them per look)
    // built-in fill so shadow sides read slate-violet (sky) and olive-gold (water bounce) whatever the scene's ambient is
    uFillSky: { value: new THREE.Color().fromArray(mix3(lin(pal[6], 0.34), hex('#6f8fc4', 0.3), 0.5)) },
    uFillGnd: { value: new THREE.Color().fromArray(mix3(lin(pal[1], 0.3), lin(pal[2], 0.2), 0.5)) },
  };

  // ---- materials ----
  const GLSL_COMMON = /* glsl */`
    float kh21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec2 kh22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
    vec3 kh33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
    float kvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(kh21(i), kh21(i + vec2(1., 0.)), f.x), mix(kh21(i + vec2(0., 1.)), kh21(i + vec2(1., 1.)), f.x), f.y); }
  `;
  const matMain = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, side: THREE.DoubleSide });
  matMain.customProgramCacheKey = () => 'khlong-run-porcelain-1';
  matMain.onBeforeCompile = (sh) => {
    for (const k of ['uTime', 'uSun', 'uSunCol', 'uGlint', 'uF1', 'uF2', 'uF3', 'uFillSky', 'uFillGnd']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aMat; varying float vMat; varying vec3 vOP; varying vec3 vON; varying vec3 vWP; varying vec3 vWN; varying vec2 vUv2;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMat = aMat; vOP = position; vON = normal; vUv2 = uv; vWP = (modelMatrix * vec4(position, 1.)).xyz; vWN = mat3(modelMatrix) * normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vMat; varying vec3 vOP; varying vec3 vON; varying vec3 vWP; varying vec3 vWN; varying vec2 vUv2;
        uniform float uTime, uGlint; uniform vec3 uSun, uSunCol, uF1, uF2, uF3, uFillSky, uFillGnd;
        ${GLSL_COMMON}
        float kGlintL(vec2 uv, float s, float fid, vec3 wn, vec3 hv, float spread){
          vec2 c = floor(uv / s); vec3 h = kh33(vec3(c, fid + s * 7.31));
          vec3 n = normalize(wn + (h - .5) * spread + .14 * sin(uTime * 1.1 + h.yzx * 40.) + vec3(0., 1e-4, 0.));
          float sp = max(dot(n, hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp = sp * sp * sqrt(sp); // ~^160 with a soft knee
          vec2 f = fract(uv / s) - .5; float dotm = 1. - smoothstep(.2, .5, max(abs(f.x), abs(f.y)));
          return sp * dotm;
        }
        float kGlint(vec2 uv, float fw, float fid, vec3 wn, vec3 hv, float spread){
          float l2 = log2(max(fw * 1.9, .12)), lf = floor(l2), fr = l2 - lf;
          return mix(kGlintL(uv, exp2(lf), fid, wn, hv, spread), kGlintL(uv, exp2(lf + 1.), fid, wn, hv, spread), fr);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float mid = floor(vMat + .5);
        vec3 oN = normalize(vON + vec3(0., 1e-5, 0.));
        vec3 wN = normalize(vWN + vec3(0., 1e-5, 0.)) * (gl_FrontFacing ? 1. : -1.);
        vec2 fuv = abs(oN.y) > .7 ? vOP.xz : vec2(abs(oN.x) > abs(oN.z) ? vOP.z : vOP.x, vOP.y);
        float fid = floor(oN.x * 2. + .5) * 3. + floor(oN.z * 2. + .5) * 7. + floor(oN.y * 2. + .5) * 13.;
        float fw = max(length(dFdx(fuv)), length(dFdy(fuv)));
        float fwt = max(length(dFdx(vUv2)), length(dFdy(vUv2)));
        vec3 kNrm = vec3(0.), kEm = vec3(0.); float kRough = .78;
        vec3 base = diffuseColor.rgb, col = base;
        vec3 Vw = normalize(cameraPosition - vWP);
        vec3 Hv = normalize(uSun + Vw + vec3(0., 1e-4, 0.));
        float sunF = smoothstep(-.2, .25, dot(wN, uSun));
        float n1 = kvn(fuv * .33 + fid), n2 = kvn(vec2(fuv.x * 1.9, fuv.y * .21) + fid * 3.1), n3 = kvn(fuv * 2.7 + fid);
        float tide = 1. - smoothstep(.35, 1.25 + .5 * n1, vOP.y);
        if (mid < .5) {
          // porcelain crust: voronoi shards, faience flowers, grout, bare patches, runs of grime
          float sc = .34; vec2 q = fuv / sc, ip = floor(q), fp = fract(q);
          float d1 = 9., d2 = 9.; vec2 cid = vec2(0.);
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)); vec2 r = g + kh22(ip + g + fid) - fp; float d = dot(r, r);
            if (d < d1) { d2 = d1; d1 = d; cid = ip + g; } else if (d < d2) { d2 = d; }
          }
          float edge = sqrt(d2) - sqrt(d1);
          float lod = clamp(1. - fw / (sc * .7), 0., 1.);
          vec3 hh = kh33(vec3(cid, fid));
          float mx = max(base.r, max(base.g, base.b)), mn = min(base.r, min(base.g, base.b));
          float isW = 1. - smoothstep(.34, .5, (mx - mn) / max(mx, 1e-3));
          float lum = mx;
          vec3 chip = hh.y < .05 ? uF3 * 1.4 : hh.y < .09 ? uF1 * 1.3 : hh.y < .13 ? uF2 * 1.2 : vec3(.98 + hh.x * .1, 1., 1.02 - hh.x * .12) * .74;
          vec3 wcol = mix(vec3(.72, .715, .69), chip, lod) * (lum / .7);
          // flowers on a staggered grid
          vec2 fq = fuv / 1.5; fq.x += .5 * floor(fq.y); vec2 fc = floor(fq), fl = fract(fq) - .5;
          float fh = kh21(fc + fid * 1.7), r = length(fl), ang = atan(fl.y, fl.x + 1e-5);
          float pet = .2 + .1 * cos(ang * (5. + floor(fh * 3.)) + fh * 6.28), aa = fw / 1.5 + .02;
          float flower = 1. - smoothstep(pet - aa, pet + aa, r);
          vec3 pc = fh < .34 ? uF1 : fh < .67 ? uF2 : uF3;
          pc = mix(pc * 1.25, uF2 * 1.3, 1. - smoothstep(.07 - aa, .07 + aa, r));
          float loz = smoothstep(.84 - aa, .84 + aa, abs(fl.x) + abs(fl.y));
          wcol = mix(wcol, mix(uF1, uF3, step(.5, fh)) * 1.1 * (lum / .7), loz * .85);
          wcol = mix(wcol, pc * (lum / .7) * (.8 + .4 * hh.z), flower * .9 * step(.25, fh * 1.25));
          vec3 bcol = base * (.72 + .56 * mix(.5, hh.x, lod));
          col = mix(bcol, wcol, isW);
          col *= 1. - .42 * lod * (1. - smoothstep(.02, .1, edge));
          float bare = smoothstep(.69, .76, kvn(fuv * .21 + fid * 5.3)) * isW;
          col = mix(col, vec3(.4, .36, .3) * (lum / .7) * (.8 + .4 * n3), bare * .85);
          col *= 1. - .3 * smoothstep(.45, .9, n2 * .65 + n1 * .5);
          col = mix(col, vec3(.07, .09, .04), tide * .75);
          kNrm = (hh - .5) * .55 * lod;
          kRough = mix(.34, .8, bare);
          float g = kGlint(fuv, fw, fid, wN, Hv, 2.1);
          kEm = uSunCol * g * 6. * uGlint * sunF * (1. - bare) * (1. - tide) * (.35 + .65 * isW);
        } else if (mid < 1.5) {
          // glazed roof tiles in overlapping rows
          vec2 t = vec2(vUv2.x / .34, vUv2.y / .46); float row = floor(t.y); t.x += .5 * mod(row, 2.);
          vec2 tf = fract(t); float th = kh21(vec2(floor(t.x), row) + 3.7), lod = clamp(1. - fwt / .3, 0., 1.);
          col = base * mix(.92, .74 + .42 * th, lod);
          col *= 1. - lod * (.5 * smoothstep(.78, 1., tf.y) + .22 * smoothstep(.36, .5, abs(tf.x - .5)));
          col *= 1. - .35 * smoothstep(.5, .95, n2 * .6 + n1 * .5);
          kRough = .36; kNrm = vec3(th - .5, 0., kh21(vec2(row, floor(t.x))) - .5) * .25 * lod;
          kEm = uSunCol * kGlint(vUv2 + 17., fwt, fid, wN, Hv, 1.1) * 3. * uGlint * sunF;
        } else if (mid < 2.5) {
          // gilding and lacquer: glossy, a little self-lit, beaten texture
          col = base * (.8 + .35 * n3); kRough = .3; kNrm = (kh33(vec3(floor(fuv * 9.), fid)) - .5) * .3 * clamp(1. - fw * 6., 0., 1.);
          kEm = base * .16 + uSunCol * kGlint(fuv, fw, fid, wN, Hv, 1.3) * 4.5 * uGlint * sunF;
        } else if (mid < 3.5) {
          // lime stucco and stone: rain streaks, block courses, a dark tide line with algae
          float course = 1. - smoothstep(.0, .05, abs(fract(vOP.y / .85) - .5) - .46);
          col = base * (.82 + .3 * n3 * n1 + .1 * n2);
          col *= 1. - .34 * smoothstep(.4, .9, n2 * .7 + n1 * .45);
          col *= 1. - .14 * course * step(abs(oN.y), .5) * clamp(1. - fw * 3., 0., 1.);
          col = mix(col, vec3(.06, .08, .035) + vec3(.03, .06, .01) * n3, tide * .85);
          kRough = mix(.92, .3, tide);
        } else if (mid < 4.5) {
          // teak: planks and grain
          float pl = fuv.x / .24, ph = kh21(vec2(floor(pl), fid));
          col = base * (.7 + .5 * ph) * (.85 + .3 * kvn(vec2(fuv.x * 9., fuv.y * .8)));
          col *= 1. - .45 * smoothstep(.86, .98, abs(fract(pl) - .5) * 2.) * clamp(1. - fw * 5., 0., 1.);
          col = mix(col, vec3(.05, .06, .03), tide * .8);
          kRough = mix(.7, .3, tide);
        } else if (mid < 5.5) {
          col = base * (.5 + .5 * n3); kRough = .9;
        } else if (mid < 6.5) {
          // steep stair flights drawn as treads and shadowed risers
          float st = fract(vOP.y / .34);
          col = base * (.62 + .5 * smoothstep(.3, .5, st)) * (.85 + .25 * n3);
        } else {
          // paving: flagstones with mossy joints, a pale processional way and a border round the prang
          vec2 pv = vOP.xz / 1.3; pv.x += .5 * floor(pv.y); vec2 pf = abs(fract(pv) - .5);
          float ph = kh21(floor(pv)), lod = clamp(1. - fw / .5, 0., 1.);
          float n4 = kvn(vOP.xz * .09 + 7.), n5 = kvn(vOP.xz * .6);
          col = base * mix(1., .78 + .36 * ph, lod) * (.8 + .3 * n4);
          float way = (1. - smoothstep(5.5, 6.1, abs(vOP.x))) * step(26., vOP.z);
          float sq = max(abs(vOP.x), abs(vOP.z));
          float ring = (1. - smoothstep(.0, .5, abs(sq - 36.5) - 1.6)) + (1. - smoothstep(.0, .3, abs(abs(vOP.x) - 7.2) - .5)) * step(36., vOP.z);
          col = mix(col, base * 1.28, way * .6);
          col = mix(col, uF2 * .55, clamp(ring, 0., 1.) * .75);
          col = mix(col, vec3(.1, .13, .06), lod * .7 * smoothstep(.455, .49, max(pf.x, pf.y)));
          col *= 1. - .3 * smoothstep(.45, .8, n4 * .6 + n5 * .5);
        }
        kEm += col * mix(uFillGnd, uFillSky, wN.y * .5 + .5);
        diffuseColor.rgb = col;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = kRough;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + mat3(viewMatrix) * kNrm * (gl_FrontFacing ? 1. : -1.));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += kEm;');
  };
  await ctx.yield?.();
  const heroGeo = new THREE.BufferGeometry();   // the big one is copied out an attribute at a time, a frame between each
  for (const [name, arr, sz] of [['position', A.pos, 3], ['normal', A.nrm, 3], ['color', A.col, 3], ['uv', A.uv, 2], ['aMat', A.mat, 1]]) { heroGeo.setAttribute(name, new THREE.BufferAttribute(arr.slice(0, A.count * sz), sz)); await ctx.yield?.(); }
  heroGeo.computeBoundingSphere(); heroGeo.computeBoundingBox();
  const heroMesh = new THREE.Mesh(heroGeo, matMain);
  heroMesh.name = 'temple'; group.add(heroMesh);
  await ctx.yield?.();

  const matCloth = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  matCloth.customProgramCacheKey = () => 'khlong-run-cloth-1';
  matCloth.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uWind = U.uWind;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSway; uniform float uTime, uWind;')
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float kPh = uv.x * 6.2832, kW = aSway;
        float kA1 = position.y * 1.25 + position.x * .35 + uTime * 2.7 + kPh, kA2 = position.y * .52 - uTime * 1.6 + kPh * 1.7;
        float kWave = sin(kA1) * .34 + sin(kA2) * .26;
        float kSlope = cos(kA1) * .34 * 1.25 + cos(kA2) * .26 * .52;
        objectNormal = normalize(objectNormal - vec3(0., 1., 0.) * kSlope * kW * .8 * (.5 + .5 * uWind));`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normal * kW * (kWave * (.45 + .55 * uWind) + kW * .16 * uWind);
        transformed.x += kW * kW * .1 * sin(uTime * .9 + kPh * 2.3) * uWind;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .1;');
  };
  if (K.count > 0) { const clothMesh = new THREE.Mesh(toGeo(K, true), matCloth); clothMesh.name = 'cloth'; clothMesh.frustumCulled = false; group.add(clothMesh); }
  await ctx.yield?.();

  // ---- the broken reflection on the river: analytic silhouettes mirrored about the water plane ----
  let mirror = null;
  if (opts.reflection !== false) {
    const mg = new THREE.PlaneGeometry(240, 350, 1, 1); mg.rotateX(-Math.PI / 2); mg.translate(0, 0.05, 79.8 + 175);
    const mm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: /* glsl */`
        varying vec3 vP;
        #include <fog_pars_vertex>
        void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCamL, uSunL, uLit, uShade, uRoof, uGold, uMK; uniform float uTime, uPS, uCol;
        varying vec3 vP;
        #include <fog_pars_fragment>
        float wPrang(float Y, float tb, float yc){
          if (Y < tb) return 0.;
          if (Y < yc) { float t = (Y - tb) / max(yc - tb, 1e-3); return 9.5 * pow(max(cos(t * 1.27), 0.), .82); }
          if (Y < yc + 4.6) return 3.2 * (1. - (Y - yc) / 4.6 * .9);
          if (Y < yc + 8.6) return .32;
          return 0.;
        }
        float wMain0(float y){
          float Y = y - 3.2;
          if (Y < 0.) return 0.; if (Y < 4.8) return 25.9; if (Y < 10.8) return 21.4; if (Y < 17.8) return 17.4;
          if (Y < 24.8) return 13.9; if (Y < 36.8) return 10.5;
          return wPrang(Y, 36.8, 68.2);
        }
        float wMain(float y){ return uPS * wMain0(3.2 + (y - 3.2) / uPS); }
        float wSat(float y){
          float Y = (y - 3.2) / .323;
          if (Y < 0.) return 0.; if (Y < 5.) return 14.9 * .323; if (Y < 11.) return 12.4 * .323; if (Y < 23.) return 10.5 * .323;
          return wPrang(Y, 23., 68.2) * .323;
        }
        float wHall(float y){ if (y < 3.2) return 0.; if (y < 13.1) return 9.2; if (y < 24.) return 10.2 * (24. - y) / 10.9; return 0.; }
        float wSala(float y){ if (y < .9) return 0.; if (y < 1.4) return 5.2; if (y < 5.9) return 3.9; if (y < 12.8) return 6.3 * (12.8 - y) / 6.9; return 0.; }
        void acc(vec3 P, vec3 R, vec2 C, int kind, float soft, inout vec3 colr, inout float cov){
          vec2 d = C - P.xz; float rr = max(dot(R.xz, R.xz), 1e-6); float t = dot(d, R.xz) / rr;
          if (t <= 0.) return;
          float y = R.y * t; vec2 rn = R.xz / sqrt(rr); vec2 perp = -(d - rn * dot(d, rn)); float lat = length(perp);
          float w = kind == 0 ? wMain(y) : kind == 1 ? wSat(y) : kind == 2 ? wHall(y) : wSala(y);
          float s = soft + t * .004;
          float c = (1. - smoothstep(w - s, w + s, lat)) * step(.01, w);
          float lit = smoothstep(-.55, .55, dot(perp, uSunL.xz) / max(w, .5));
          vec3 k = mix(uShade, uLit, lit);
          if (kind < 2) k *= .8 + .2 * step(.42, fract(y / (kind == 0 ? 3.3 : 1.2)));
          else if (kind == 2) k = y > 13.1 ? uRoof * (.45 + .75 * lit) : k * .9;
          else { k = y > 5.9 ? uRoof * (.45 + .75 * lit) : k * .8; c *= y > 1.4 && y < 5.9 ? .4 : 1.; }
          colr = mix(colr, k, step(cov, c) * step(.001, c)); cov = max(cov, c);
        }
        void main(){
          vec3 V = vP - uCamL; float dist = length(V); V /= max(dist, 1e-4);
          vec3 R = vec3(V.x, max(-V.y, 1e-4), V.z);
          vec2 w = vP.xz; float t = uTime;
          float r1 = sin(w.y * 1.9 + t * 1.3 + sin(w.x * .31 + t * .4) * 2.);
          float r2 = sin(w.y * 4.7 - t * 2.1 + w.x * .6), r3 = sin(w.y * .63 + t * .7 + w.x * .13);
          float rip = r1 * .5 + r2 * .3 + r3 * .4;
          R.y *= 1. + rip * .15;
          R.xz += vec2(-R.z, R.x) * (r2 * .5 + r1 * .35) * .012;
          vec3 colr = vec3(0.); float cov = 0.;
          // river wall
          if (R.z < -1e-4) { float tw = (78. - vP.z) / R.z; float yw = R.y * tw, xw = vP.x + R.x * tw;
            float cw = step(yw, 4.2) * step(abs(xw), 66.) * (abs(xw) < 15. ? .55 : 1.);
            colr = mix(uShade, uLit, .35) * mix(.25, .8, smoothstep(.6, 1.6, yw)); cov = cw; }
          acc(vP, R, vec2(-47., 30.), 2, .5, colr, cov); acc(vP, R, vec2(47., 30.), 2, .5, colr, cov);
          acc(vP, R, vec2(-31., -31.), 1, .3, colr, cov); acc(vP, R, vec2(31., -31.), 1, .3, colr, cov);
          acc(vP, R, vec2(0., 0.), 0, .5, colr, cov);
          acc(vP, R, vec2(-31., 31.), 1, .3, colr, cov); acc(vP, R, vec2(31., 31.), 1, .3, colr, cov);
          acc(vP, R, vec2(-15.5, 85.2), 3, .25, colr, cov); acc(vP, R, vec2(15.5, 85.2), 3, .25, colr, cov);
          float brk = uMK.y + (1. - uMK.y) * smoothstep(-.35, .35, sin(w.y * 2.6 + t * 1.7 + sin(w.x * .4 + t * .3) * 1.5 + rip * 1.3));
          float fres = .3 + .7 * pow(1. - clamp(-V.y, 0., 1.), 4.);
          float edge = (1. - smoothstep(95., 120., abs(vP.x))) * (1. - smoothstep(380., 428., vP.z));
          float a0 = cov * brk * fres * edge * uMK.x;
          // the spire's own light on the water: ripples draw its reflection out into a long broken column of gold that
          // runs from the foot of the stairs toward the viewer, widest and brightest near the temple, in short bright dashes
          vec2 ax = -uCamL.xz; float axl = max(length(ax), 1e-3); ax /= axl;
          vec2 dp = vP.xz - uCamL.xz; float al = dot(dp, ax), lt = abs(dp.x * ax.y - dp.y * ax.x);
          float cw = uMK.z + .02 * max(axl - al, 0.) + 5. * uPS * (1. - smoothstep(0., 60., vP.z - 78.));
          float dash = smoothstep(.1, .75, sin(al * 1.25 - t * 2.3 + 2.5 * sin(lt * .9 + t * .6) + rip * 1.6) * .5 + .5) * (.55 + .45 * smoothstep(-.3, .6, r2 + r3 * .6));
          float wob = lt + (r1 * .5 + r3 * .7) * cw * .35;
          float colm = exp(-wob * wob / (cw * cw)) * dash * smoothstep(7., 30., al) * smoothstep(78., 84., vP.z) * (.35 + .65 * smoothstep(axl * .15, axl * .8, al)) * uCol * edge;
          vec3 cc = uGold * (.7 + .6 * dash);
          float aT = clamp(a0 + colm * (1. - a0 * .5), 0., 1.);
          gl_FragColor = vec4((colr * (.85 + .15 * rip) * a0 + cc * colm) / max(a0 + colm, 1e-4), aT);
          #include <fog_fragment>
        }`,
    });
    for (const k of ['uCamL', 'uSunL', 'uLit', 'uShade', 'uRoof', 'uTime', 'uGold', 'uPS', 'uCol', 'uMK']) mm.uniforms[k] = U[k];
    mirror = new THREE.Mesh(mg, mm); mirror.name = 'mirror'; mirror.renderOrder = 2; mirror.frustumCulled = false; group.add(mirror);
  }

  // ---- sun-catch on the gilded finials: five small additive stars that keep the tips readable from the canal ----
  {
    const tips = [[0, TY + (79.6 - TY) * PS, 0, 2.0 * PS], ...satPos.map(([x, z]) => [x, 27.85, z, 0.8])];
    const sp = [], sc = [], ss = [], si = [];
    tips.forEach((t, i) => {
      for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { sp.push(t[0], t[1], t[2]); sc.push(c[0], c[1]); ss.push(t[3]); }
      si.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(sc, 2));
    sg.setAttribute('aSize', new THREE.Float32BufferAttribute(ss, 1)); sg.setIndex(si);
    const sm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: /* glsl */`
        attribute float aSize; varying vec2 vC; varying float vK; varying float vDepth;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); float d = length(mv.xyz);
          float sz = max(aSize, d * .0085 * sqrt(aSize * .5)); mv.xy += uv * sz; vC = uv; vDepth = d;
          vK = clamp(d / 260., .3, 1.) * (.6 + .2 * aSize) + position.x * .0;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunCol; uniform float uGlint, uTime, uTip; varying vec2 vC; varying float vK; varying float vDepth;
        #include <fog_pars_fragment>
        void main(){ float r = length(vC), ax = abs(vC.x), ay = abs(vC.y);
          float a = exp(-r * r * 11.) + .3 * (exp(-ax * 16.) * exp(-ay * 2.6) + exp(-ay * 16.) * exp(-ax * 2.6));
          a *= 1. - smoothstep(.65, 1., r);
          float f = 0.;
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              f = 1. - exp(-fogDensity * fogDensity * vDepth * vDepth);
            #else
              f = smoothstep(fogNear, fogFar, vDepth);
            #endif
          #endif
          gl_FragColor = vec4(uSunCol * a * 3.6 * uGlint * uTip * vK * (.86 + .14 * sin(uTime * 2.1 + vDepth * .05)) * (1. - .65 * f), 1.); }`,
    });
    for (const k of ['uSunCol', 'uGlint', 'uTime', 'uTip']) sm.uniforms[k] = U[k];
    const sparks = new THREE.Mesh(sg, sm); sparks.name = 'finial-glints'; sparks.frustumCulled = false; sparks.renderOrder = 3; group.add(sparks);
  }

  // ---- temple pigeons wheeling round the corn cob (scale and life; all motion in the vertex shader) ----
  let flock = null;
  if (opts.birds !== false) {
    const nB = Math.round(72 * (ctx.quality?.detail ?? 1)), bp = [], bo = [], bh = [];
    const base = rng.range(0, 6.28), dirS = rng.sign();
    for (let i = 0; i < nB; i++) {
      const stray = rng.chance(0.2), r = stray ? rng.range(20, 40) : rng.range(15, 27);
      const o = [r * (0.4 + 0.6 * PS), (stray ? rng.range(26, 74) : rng.range(40, 64)) * PS, base + (stray ? rng.range(0, 6.28) : rng.gauss() * 0.55), dirS * rng.range(7.5, 10.5) / r];
      const ph = rng(), s = rng.range(1.1, 1.6);
      const v = [[0, 0, 0.4 * s, 0], [0, 0, -0.4 * s, 0], [-0.75 * s, 0, -0.1 * s, 1], [0, 0, 0.4 * s, 0], [0.75 * s, 0, -0.1 * s, 1], [0, 0, -0.4 * s, 0]];
      for (const q of v) { bp.push(q[0], q[1], q[2]); bo.push(o[0], o[1], o[2], o[3]); bh.push(ph, q[3]); }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    bg.setAttribute('aOrb', new THREE.Float32BufferAttribute(bo, 4)); bg.setAttribute('aPh', new THREE.Float32BufferAttribute(bh, 2));
    const bm = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBody: { value: new THREE.Color(0.07, 0.07, 0.09) }, uWing: { value: new THREE.Color(0.5, 0.46, 0.4) } }]),
      vertexShader: /* glsl */`
        attribute vec4 aOrb; attribute vec2 aPh; uniform float uTime; varying float vS;
        #include <fog_pars_vertex>
        void main(){
          float r = aOrb.x * (1. + .12 * sin(uTime * .23 + aPh.x * 6.)), ang = aOrb.z + uTime * aOrb.w;
          vec3 c = vec3(cos(ang) * r, aOrb.y + 2.5 * sin(uTime * .4 + aPh.x * 9.), sin(ang) * r);
          float sg = aOrb.w < 0. ? -1. : 1.;
          vec3 fwd = vec3(-sin(ang), 0., cos(ang)) * sg, side = vec3(fwd.z, 0., -fwd.x);
          float glide = smoothstep(-.2, .5, sin(uTime * .6 + aPh.x * 12.));
          float flap = sin(uTime * (9. + aPh.x * 3.) + aPh.x * 20.) * glide + .25 * (1. - glide);
          vec3 p = c + side * position.x * (1. - .25 * aPh.y * abs(flap)) + fwd * position.z;
          p.y += aPh.y * (flap * .55 - position.x * sg * .25);
          vS = aPh.y * (.5 + .5 * flap);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uBody, uWing; varying float vS;
        #include <fog_pars_fragment>
        void main(){ gl_FragColor = vec4(mix(uBody, uWing, clamp(vS, 0., 1.)), 1.);
          #include <fog_fragment>
        }`,
    });
    bm.uniforms.uTime = U.uTime;
    flock = new THREE.Mesh(bg, bm); flock.name = 'pigeons'; flock.frustumCulled = false; flock.position.set(0, 0, 0); group.add(flock);
  }

  // ---- anchors ----
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V(0, 1.5, 86), facing: V(0, 0, 1), radius: 7 },
    flyThrough: [V(0, 1.5, 330), V(0, 1.5, 250), V(0, 1.5, 170), V(0, 1.5, 120), V(0, 1.5, 86)],
    viewpoints: {
      burst: { position: V(0, 1.5, 300), look: V(0, 30, 0) },
      approach: { position: V(-6, 1.5, 160), look: V(0, 34, 0) },
      close: { position: V(0, 1.5, 112), look: V(0, 40, 0) },
    },
    prangTop: V(0, TY + 76.8 * PS, 0), prangCenter: V(0, 40 * PS, 0), prangScale: PS, stairsFoot: V(0, 0, 78), stairsTop: V(0, TY, 68.4),
    terraceY: TY, waterY: 0,
    pavilions: [V(-15.5, 1.4, 85.2), V(15.5, 1.4, 85.2)],
    satellites: satPos.map(([x, z]) => V(x, 28, z)),
    guardians: guardPos.map(([x, z]) => V(x, TY, z)),
    bannerTops, egretPosts,
    monitorSteps: [V(-9, 0.2, 77.6), V(11, 0.2, 77.6)],
    sunDirDefault: sunDef.clone(),
    mirror, flock,
  };

  // ---- runtime ----
  const _inv = new THREE.Matrix4(), _v = new THREE.Vector3(), _t = new THREE.Vector3();
  let frame = 0, progress = 1;
  const findSun = () => {
    let root = group; while (root.parent) root = root.parent;
    let found = null;
    root.traverse((o) => { if (!found && o.isDirectionalLight) found = o; });
    if (found) {
      found.getWorldPosition(_v); found.target.getWorldPosition(_t); _v.sub(_t);
      if (_v.lengthSq() > 1e-6) U.uSun.value.copy(_v.normalize());
    }
  };
  const hero = {
    object: group, radius: 62, height: TY + 76.8 * PS, center: V(0, 34, 18), anchors, ground: true, groundY: 0,
    uniforms: U,
    setSun(dir, color, strength) {
      sunFixed = true; U.uSun.value.copy(toV3(dir));
      if (color != null) U.uSunCol.value.set(color);
      if (strength != null) U.uGlint.value = strength;
    },
    setProgress(u) { progress = Math.min(1, Math.max(0, u)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!sunFixed && frame++ % 45 === 0) findSun();
      const k = progress * progress * (3 - 2 * progress);
      U.uWind.value = 0.75 + 0.35 * k;
      _inv.copy(group.matrixWorld).invert();
      if (camera) U.uCamL.value.copy(camera.getWorldPosition(_v)).applyMatrix4(_inv);
      U.uSunL.value.copy(U.uSun.value).transformDirection(_inv);
    },
    dispose() {},
    stats: { triangles: (A.count + K.count) / 3 + 2 },
  };
  return hero;
}

// geometry helpers shared with the world module (src/worlds/khlong-run.js)
export { makeAcc, tri, quad, quadO, triO, box, spike, extrude, place, hall, clothStrip, mul, mix3, IDENT };
