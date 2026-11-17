// The Net on the Vault: summer noon in a brick boat hall over the water. No sun enters; the only light is the net
// the water throws upward: pale-gold cord, three to a white knot, sliding over every vault, pier and hull.
// Frame: the hero (src/parts/net-on-the-vault.js) sits at identity; the hall runs from the gate at z = +120 to the eye
// at z = -120; the canal is z 120..178; we travel toward -Z; water is y 0. Flat pigments, no lights, no tone map.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, NvSheets, nvCode, nvSkiffGeometry, nvFerns, NV_PALETTE, NV_HALL, NV_UNIFORMS_GLSL } from '../parts/net-on-the-vault.js';

const PATH_PTS = [[0, 1.6, 168], [0, 1.6, 144], [0, 1.6, 120], [0, 1.6, 96], [0, 1.6, 84], [0, 1.62, 78], [-1.6, 3.0, 62], [-3.6, 5.0, 47], [-5.4, 7.4, 33], [-3.0, 8.7, 19],
  [-4, 11.3, 3], [-4, 11.3, -12], [-4, 11.3, -26], [-4, 11.3, -40], [0, 7.2, -62], [0, 7.2, -90], [0, 7.2, -120.2]];   // the opening stands a hand behind the end wall: the wall's own eye uncovers it as it is hauled open
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const HONEY = nvCode(0, 2, 1), HONEYF = nvCode(0, 0, 1), BRICK = nvCode(1, 1, 1), UMBER = nvCode(2, 0, 0), UMBERN = nvCode(2, 0, 1);

// ---------------------------------------------------------------------------------------------------------------
// The canal: 9 m between brick walls 14 m high, a blind arcade of quay piers every 5 m standing in the water,
// a low stone bridge (soffit 2.8 m over the water) and the gatehouse with its raised timber leaf.
// All of it is sheets for style.masonry(), so the wake bands run from hull to pier to soffit as one line.
// ---------------------------------------------------------------------------------------------------------------
const CANAL = { z0: 120, z1: 219, half: 4.5, back: 5.0, bay: 5, first: 126.5, nBay: 19, spring: 3.6, R: 1.9, top: 6.6, m: 1.05,
  bridge0: 138, bridge1: 154 };   // (z 14 to 30 from the entry, as the brief has it: in the entry frame the bridge stands ahead under the white strip)
async function buildCanal(ctx, S) {
  const C = CANAL, m = C.m, UMB0 = nvCode(2, 0, 0), HON0 = nvCode(0, 0, 0), HONA0 = nvCode(0, 2, 0), BRICK0 = nvCode(1, 1, 0);
  const under = (z) => z > C.bridge0 + 0.1 && z < C.bridge1 - 0.1;   // under the bridge the walls see no sunlit water: no net. They are drawn all the same: bare brick with its courses, honey rings and plinths, umber recesses
  // a point on a wall plane x = const: sheet = (z, y); the foot is the water this wall looks at
  const zy = (o, x, nx, z, y, k = 1) => { o.x = x; o.y = y; o.z = z; o.sx = z; o.sy = y; o.m = m * k; o.fx = x + nx * Math.max(y, 0) * 0.45; o.fz = z; };
  for (const sx of [-1, 1]) {
    const xf = sx * C.half, xb = sx * C.back;
    // back of the blind arches (rose brick, the net crawls over it)
    for (const [za, zb, n, code] of [[124, C.bridge0, 3, BRICK], [C.bridge0, C.bridge1, 3, BRICK0], [C.bridge1, 219, 13, BRICK]]) S.grid(n, 2, (u, v, o) => zy(o, xb, -sx, za + (zb - za) * u, -1.6 + 7.4 * v), code);
    for (let b = 0; b < C.nBay; b++) {
      const zc = C.first + C.bay * b, R = C.R, y0 = C.spring;
      const pt = (u, ring, o, x = xf) => {
        const i = Math.round(u * 14);
        if (i === 0 || i === 14) { zy(o, x, -sx, zc + (i ? 1 : -1) * (R + ring), -1.6); return; }
        const th = Math.PI * (1 - (i - 1) / 12);
        zy(o, x, -sx, zc + (R + ring) * Math.cos(th), y0 + (R + ring) * Math.sin(th));
      };
      const edge = (u, o) => {
        const i = Math.round(u * 14);
        if (i === 0 || i === 14) { zy(o, xf, -sx, zc + (i ? 2.5 : -2.5), -1.6); return; }
        const th = Math.PI * (1 - (i - 1) / 12), c = Math.cos(th), s = Math.sin(th);
        const t = Math.min(2.5 / Math.max(Math.abs(c), 1e-6), (C.top - y0) / Math.max(s, 1e-6));
        zy(o, xf, -sx, zc + t * c, y0 + t * s);
      };
      S.grid(14, 1, (u, v, o) => pt(u, v * 0.32, o), under(zc) ? HON0 : HONEYF);
      S.grid(14, 1, (u, v, o) => { if (v < 0.5) pt(u, 0.32, o); else edge(u, o); }, under(zc) ? BRICK0 : BRICK);
      S.grid(14, 1, (u, v, o) => { pt(u, 0, o, xf + (xb - xf) * v); o.sx = o.z; o.sy = v; }, UMBER);
    }
    await ctx.yield();
    // quay piers: a honey plinth standing proud of each pier, in the water
    for (let b = 0; b <= C.nBay; b++) {
      const zc = 124 + C.bay * b, xp = sx * (C.half - 0.22), h = 0.62;
      S.grid(1, 1, (u, v, o) => zy(o, xp, -sx, zc - h + 2 * h * u, -1.6 + 2.7 * v), under(zc) ? HONA0 : HONEY);
      for (const e of [-1, 1]) S.grid(1, 1, (u, v, o) => { zy(o, xp + (xf - xp) * u, -sx, zc + e * h, -1.6 + 2.7 * v); o.sx = o.x; }, UMBER);
      S.grid(1, 1, (u, v, o) => { zy(o, xp + (xf - xp) * u, -sx, zc - h + 2 * h * v, 1.1); o.sy = o.x; }, under(zc) ? HON0 : HONEYF);
    }
    // upper wall: honey string course, brick, honey coping, up to the white
    S.grid(19, 1, (u, v, o) => zy(o, xf, -sx, 124 + 95 * u, C.top + 0.5 * v), HONEY);
    S.grid(19, 3, (u, v, o) => zy(o, xf, -sx, 124 + 95 * u, C.top + 0.5 + 6.4 * v, 1.25), BRICK);
    S.grid(19, 1, (u, v, o) => zy(o, xf, -sx, 124 + 95 * u, 13.5 + 0.5 * v), HONEY);
    S.grid(1, 1, (u, v, o) => { zy(o, xf + sx * 0.03 * v, -sx, 124 + 95 * u, C.top + 0.5); }, UMBER);
    await ctx.yield();
  }
  // the bridge: a stone arch across the canal, springing from the quay walls; the net slides on its soffit 1.2 m over the eye.
  // Its face is drawn as a bridge: a ring of honey voussoirs with umber joints and a keystone, brick above, a honey string
  // course, a brick parapet under a honey coping; an umber lip under the ring and umber walls beneath are the dark of its mouth
  const soff = (x) => 2.8 - 0.8 * (x / C.half) * (x / C.half);
  S.grid(10, 9, (u, v, o) => {
    const x = -C.half + 2 * C.half * u, z = C.bridge0 + (C.bridge1 - C.bridge0) * v;
    o.x = x; o.y = soff(x); o.z = z; o.sx = z; o.sy = x + 0.225; o.m = 0.5; o.fx = x; o.fz = z;
  }, HONEY);
  // the keystone course: one line of dressed stones down the crown of the barrel, two fingers proud of the voussoir courses
  // either side of it, an umber shadow line along each of its edges
  S.grid(1, 9, (u, v, o) => { const x = -0.22 + 0.44 * u; o.x = x; o.y = 2.8 - 0.045; o.z = C.bridge0 + (C.bridge1 - C.bridge0) * v; o.sx = o.z + 0.45; o.sy = x + 0.225; o.m = 0.5; o.fx = x; o.fz = o.z; }, HONEY);
  for (const e of [-1, 1]) S.grid(1, 1, (u, v, o) => { o.x = e * 0.22; o.y = 2.8 - 0.045 * v; o.z = C.bridge0 + (C.bridge1 - C.bridge0) * u; o.sx = o.z; o.sy = v; o.m = 0.5; o.fx = o.x; o.fz = o.z; }, UMB0);
  for (const [zf, nz] of [[C.bridge1, 1], [C.bridge0, -1]]) {
    const face = (o, x, y, dz = 0) => { o.x = x; o.y = y; o.z = zf + nz * dz; o.sx = x; o.sy = y; o.m = 0.9; o.fx = x; o.fz = zf + nz * 0.45 * y; };
    const X = (u) => -C.half + 2 * C.half * u;
    S.grid(10, 1, (u, v, o) => face(o, X(u), soff(X(u)) + 0.42 * v), HONEYF);
    S.grid(10, 1, (u, v, o) => { const yb = soff(X(u)) + 0.42; face(o, X(u), yb + (3.7 - yb) * v); }, BRICK);
    S.grid(10, 1, (u, v, o) => face(o, X(u), 3.7 + 0.22 * v, 0.03), HONEYF);                // string course, a thumb proud
    S.grid(10, 1, (u, v, o) => face(o, X(u), 3.92 + 0.66 * v), BRICK);                       // parapet
    S.grid(10, 1, (u, v, o) => face(o, X(u), 4.58 + 0.2 * v, 0.04), HONEY);                  // coping
    S.grid(1, 1, (u, v, o) => { face(o, X(u), 3.7, 0.03 * v); }, UMB0);                      // the shadow line under the string course
    for (let k = -8; k <= 8; k++) {                                                          // voussoir joints, radial
      if (k === 0) continue;
      const x = k * 0.52 + (k > 0 ? 0.08 : -0.08), lean = -0.16 * k / 8;
      S.grid(1, 1, (u, v, o) => face(o, x + (u - 0.5) * 0.035 + lean * v, soff(x) + 0.42 * v, 0.006), UMB0);
    }
    S.grid(1, 1, (u, v, o) => face(o, (u - 0.5) * (0.5 + 0.16 * v), 2.8 - 0.04 + 0.66 * v, 0.05), HONEYF);   // the keystone
    for (const e of [-1, 1]) S.grid(1, 1, (u, v, o) => face(o, e * (0.25 + 0.08 * v) + (u - 0.5) * 0.035, 2.76 + 0.66 * v, 0.056), UMB0);
    S.grid(10, 1, (u, v, o) => { const x = X(u); o.x = x; o.y = soff(x) - 0.012; o.z = zf - nz * 0.4 * v; o.sx = x; o.sy = v; o.m = 0.9; o.fx = x; o.fz = o.z; }, UMB0);   // the lip
  }
  await ctx.yield();
  // the gatehouse: the canal narrows to the 7 m water gate; honey jambs and arch, a raised umber timber leaf with honey straps
  const gateTop = (x) => 4.3 + 1.1 * Math.sqrt(Math.max(1 - (x / 3.5) * (x / 3.5), 0));
  const gf = (o, x, y, z = 124) => { o.x = x; o.y = y; o.z = z; o.sx = x; o.sy = y; o.m = 1.0; o.fx = x; o.fz = z + 0.45 * Math.max(y, 0); };
  for (const sx of [-1, 1]) {
    S.grid(1, 4, (u, v, o) => gf(o, sx * (3.5 + u), -1.6 + 10.6 * v), BRICK);
    S.grid(2, 3, (u, v, o) => { const z = 120 + 4 * u; o.x = sx * 3.5; o.y = -1.6 + 5.9 * v; o.z = z; o.sx = z; o.sy = o.y; o.m = 0.9; o.fx = o.x - sx * 0.45 * Math.max(o.y, 0); o.fz = z; }, HONEY);
  }
  S.grid(10, 2, (u, v, o) => { const x = -3.5 + 7 * u; o.x = x; o.y = gateTop(x); o.z = 120 + 4 * v; o.sx = o.z; o.sy = x; o.m = 0.7; o.fx = x; o.fz = o.z; }, HONEY);
  S.grid(10, 1, (u, v, o) => { const x = -3.5 + 7 * u; gf(o, x, gateTop(x) + 0.5 * v); }, HONEYF);
  S.grid(10, 2, (u, v, o) => { const x = -3.5 + 7 * u, yb = gateTop(x) + 0.5; gf(o, x, yb + (8.4 - yb) * v); }, BRICK);
  S.grid(4, 1, (u, v, o) => gf(o, -4.5 + 9 * u, 8.4 + 0.6 * v), HONEY);
  S.grid(4, 1, (u, v, o) => { gf(o, -4.5 + 9 * u, 9.0, 124 - 4 * v); o.sy = o.z; }, HONEYF);
  // the leaf, hauled up clear of the arch: a door of upright honey planks a hand apart at their umber seams, three iron straps
  // across it with a bolt on every plank, an iron shoe along its foot, hung on two iron rods from the lintel
  const lf = (o, x, y, dz = 0) => { o.x = x; o.y = y; o.z = 124.18 + dz; o.sx = x; o.sy = y; o.m = 1.0; o.fx = x; o.fz = 124.2 + 0.45 * y; };
  const LX = 3.3, LY0 = 5.75, LY1 = 8.15, NP = 15, PW = 2 * LX / NP;
  S.grid(1, 1, (u, v, o) => lf(o, -LX + 2 * LX * u, LY0 + (LY1 - LY0) * v), HONEYF);
  for (let k = 1; k < NP; k++) S.grid(1, 1, (u, v, o) => lf(o, -LX + PW * k + (u - 0.5) * 0.05, LY0 + (LY1 - LY0) * v, 0.006), UMB0);
  for (const y of [LY0 + 0.3, 0.5 * (LY0 + LY1) - 0.08, LY1 - 0.46]) {
    S.grid(1, 1, (u, v, o) => lf(o, -LX + 2 * LX * u, y + 0.16 * v, 0.02), UMB0);
    for (let k = 0; k < NP; k++) S.grid(1, 1, (u, v, o) => lf(o, -LX + PW * (k + 0.5) + (u - 0.5) * 0.07, y + 0.045 + 0.07 * v, 0.03), HONEYF);
  }
  S.grid(1, 1, (u, v, o) => lf(o, -LX - 0.05 + (2 * LX + 0.1) * u, LY0 - 0.12 + 0.12 * v, 0.02), UMB0);
  for (const x of [-3.42, 3.3]) S.grid(1, 1, (u, v, o) => lf(o, x + 0.12 * u, 4.4 + 4 * v, 0.04), HONEYF);
  for (const x of [-1.9, 1.9]) S.grid(1, 1, (u, v, o) => lf(o, x + (u - 0.5) * 0.07, LY1 + (8.4 - LY1) * v, 0.01), UMB0);
}

// ---------------------------------------------------------------------------------------------------------------
// Our skiff: white, 7.5 m, a bluff bow with 2.2 m of foredeck. Local +X is forward, the eye stands at the local
// origin 1.6 m over the water, 1.45 m behind the stem. aRide = (sheet x, sheet y, tone, 1 net + 2 plank seams).
// ---------------------------------------------------------------------------------------------------------------
function rideGeometry() {
  const pos = [], ride = [], idx = [];
  const quad = (a, b, c, d, tone, flag) => {
    const n = pos.length / 3;
    for (const p of [a, b, c, d]) { pos.push(p[0], p[1], p[2]); ride.push(p[0], p[3] ?? p[2], tone, flag); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  const X0 = -6.05, LEN = 7.5, NS = 15, TD = (5.3) / LEN;                     // deck from x = -0.75 to the stem
  const bAt = (t) => Math.max(0.05, t > 0.45 ? 0.95 * Math.pow(Math.max(1 - Math.pow((t - 0.45) / 0.55, 3), 0), 0.6) : 0.95 - 0.3 * ((0.45 - t) / 0.45) ** 2);
  const ysAt = (t) => 0.66 + 0.5 * t * t * t, ykAt = (t) => -0.3 + 0.28 * t ** 5;
  const prof = (t) => {
    const b = bAt(t), ys = ysAt(t), yk = ykAt(t), deck = t >= TD - 1e-6, bi = Math.max(b - (deck ? 0.2 : 0.15), 0.02);
    const r = [[0, yk], [0.75 * b, yk + 0.08], [0.95 * b, 0.06], [0.97 * b, 0.2], [b, ys - 0.22], [b, ys], [bi, ys]];
    if (deck) r.push([0.5 * bi, ys + 0.04], [0, ys + 0.06]); else r.push([0.86 * bi, 0.14], [0, 0.1]);
    let g = 0; r[0].push(0);
    for (let i = 1; i < r.length; i++) { g += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); r[i].push(g); }
    return r;
  };
  const ts = []; for (let i = 0; i <= NS; i++) ts.push(i / NS); ts.push(TD); ts.sort((a, b) => a - b);
  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i], t1 = ts[i + 1], x0 = X0 + LEN * t0, x1 = X0 + LEN * t1, A = prof(t0 + 1e-5), B = prof(t1 - 1e-5), deck = t0 >= TD - 1e-6;
    for (const sg of [-1, 1]) for (let k = 0; k < 8; k++) {
      const tone = k < 2 ? 4 : k === 2 ? 5 : k === 3 ? 4 : k < 6 ? 3 : deck ? 4 : 2, flag = k < 6 ? 1 : deck ? 3 : 0;
      const ga = k >= 6 && deck ? sg * A[k][0] : A[k][2], gb = k >= 6 && deck ? sg * B[k][0] : B[k][2];
      const ga1 = k >= 6 && deck ? sg * A[k + 1][0] : A[k + 1][2], gb1 = k >= 6 && deck ? sg * B[k + 1][0] : B[k + 1][2];
      quad([x0, A[k][1], sg * A[k][0], ga], [x1, B[k][1], sg * B[k][0], gb], [x1, B[k + 1][1], sg * B[k + 1][0], gb1], [x0, A[k + 1][1], sg * A[k + 1][0], ga1], tone, flag);
    }
  }
  const xd = X0 + LEN * TD, D = prof(TD + 1e-5);                               // the deck's after bulkhead, umber
  quad([xd, 0.1, -D[6][0]], [xd, 0.1, D[6][0]], [xd, D[8][1], D[6][0]], [xd, D[8][1], -D[6][0]], 2, 0);
  const T = prof(0);                                                           // transom
  for (let k = 0; k < 5; k++) quad([X0, T[k][1], -T[k][0]], [X0, T[k][1], T[k][0]], [X0, T[k + 1][1], T[k + 1][0]], [X0, T[k + 1][1], -T[k + 1][0]], k > 3 ? 3 : 4, 0);
  for (const t of [0.2, 0.42, 0.62]) {                                         // honey thwarts
    const x = X0 + LEN * t, w = bAt(t) - 0.15, y = ysAt(t) - 0.16;
    quad([x - 0.14, y, -w], [x + 0.14, y, -w], [x + 0.14, y, w], [x - 0.14, y, w], 0, 0);
    quad([x + 0.14, y, -w], [x + 0.14, y - 0.06, -w], [x + 0.14, y - 0.06, w], [x + 0.14, y, w], 2, 0);
  }
  {                                                                            // white stern sheets
    const x1 = X0 + 0.95, w0 = bAt(0) - 0.15, w1 = bAt(0.127) - 0.15, y = 0.5;
    quad([X0, y, -w0], [x1, y, -w1], [x1, y, w1], [X0, y, w0], 3, 0);
    quad([x1, y, -w1], [x1, y - 0.07, -w1], [x1, y - 0.07, w1], [x1, y, w1], 4, 0);
  }
  for (const sg of [-1, 1]) {                                                  // shipped oars on the thwarts
    const z = sg * 0.4, y = 0.66;
    quad([-4.3, y, z - 0.035], [-1.2, y + 0.05, z - 0.035], [-1.2, y + 0.05, z + 0.035], [-4.3, y, z + 0.035], 0, 0);
    quad([-5.05, y - 0.01, z - 0.11], [-4.3, y, z - 0.05], [-4.3, y, z + 0.05], [-5.05, y - 0.01, z + 0.11], 3, 0);   // white blades
  }
  // the stem post, white, standing a hand above the deck, and a honey ring bolt on the king plank
  const xs = X0 + LEN, yd = ysAt(1) + 0.05;
  for (const sg of [-1, 1]) quad([xs - 0.16, yd - 0.3, sg * 0.05], [xs + 0.03, yd - 0.3, sg * 0.035], [xs + 0.05, yd + 0.16, sg * 0.035], [xs - 0.12, yd + 0.16, sg * 0.05], 3, 1);
  quad([xs - 0.12, yd + 0.16, -0.05], [xs + 0.05, yd + 0.16, -0.035], [xs + 0.05, yd + 0.16, 0.035], [xs - 0.12, yd + 0.16, 0.05], 3, 0);
  quad([xs - 0.16, yd - 0.3, -0.05], [xs - 0.16, yd - 0.3, 0.05], [xs - 0.12, yd + 0.16, 0.05], [xs - 0.12, yd + 0.16, -0.05], 4, 0);
  const xr = xs - 0.62, yr = ysAt(0.92) + 0.075;
  quad([xr - 0.1, yr, -0.035], [xr + 0.1, yr, -0.035], [xr + 0.1, yr, 0.035], [xr - 0.1, yr, 0.035], 0, 0);
  quad([xr - 0.1, yr, 0.035], [xr + 0.1, yr, 0.035], [xr + 0.1, yr - 0.06, 0.035], [xr - 0.1, yr - 0.06, 0.035], 2, 0);
  quad([xr - 0.1, yr, -0.035], [xr - 0.1, yr, 0.035], [xr - 0.1, yr - 0.06, 0.035], [xr - 0.1, yr - 0.06, -0.035], 2, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRide', new THREE.Float32BufferAttribute(ride, 4));
  g.setIndex(idx);
  return g;
}
const RIDE_VERT = /* glsl */`
attribute vec4 aRide; uniform vec4 uRide;
varying vec4 vRide; varying vec3 vW; varying vec4 vJ; varying float vCut; varying vec3 vL;
void main(){
  vec3 p = position; vL = position;
  float roll = .014 * sin(uTime * 1.1 + uRide.w) + .008 * sin(uTime * 2.3 + 1.7 * uRide.w), pitch = .006 * sin(uTime * .8 + 2.3 * uRide.w);
  float c = cos(roll), s = sin(roll); p.yz = vec2(c * p.y - s * p.z, s * p.y + c * p.z);
  c = cos(pitch); s = sin(pitch); p.xy = vec2(c * p.x - s * (p.y - .5), s * p.x + c * (p.y - .5) + .5);
  vec4 w = modelMatrix * vec4(p, 1.);
  // seen through the previous world's portal the eye stands behind the entry plane (z = uRide.z) and the engine clips whatever
  // lies behind that plane, which would cut our hull open: everything aft of the plane is pressed flat onto it instead, so the
  // skiff shows as a closed white prow with a plain transom. From inside the world (eye at or ahead of the plane) nothing moves.
  vCut = step(uRide.z + .02, cameraPosition.z) * step(uRide.z - .04, w.z);
  w.z = mix(w.z, uRide.z - .04, vCut);
  vW = w.xyz; vRide = aRide;
  vJ = vec4((modelMatrix * vec4(1., 0., 0., 0.)).xz, (modelMatrix * vec4(0., 0., 1., 0.)).xz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const RIDE_FRAG = /* glsl */`
uniform vec4 uRide;         // x = metres the net has slid aft, y = mesh size, z = the entry plane, w = the phase of our skiff's rock
varying vec4 vRide; varying vec3 vW; varying vec4 vJ; varying float vCut; varying vec3 vL;
void main(){
  float tone = floor(vRide.z + .5), flag = floor(vRide.w + .5);
  vec3 col = tone < .5 ? uHoney : tone < 1.5 ? uRose : tone < 2.5 ? uUmber : tone < 3.5 ? uWhite : tone < 4.5 ? uShade : uGreen;
  vec2 sh = vRide.xy; float fp = max(length(dFdx(sh)), length(dFdy(sh))) + 1e-5;
  float fx = length(vec2(dFdx(vL.x), dFdy(vL.x))) + 1e-5, fy = length(vec2(dFdx(vL.y), dFdy(vL.y))) + 1e-5;
  float fz = length(vec2(dFdx(vL.z), dFdy(vL.z))) + 1e-5, fl = max(fx, fz);
  float eyeD = length(vW - cameraPosition);
  if (flag > 1.5) {
    // the foredeck: long fore-and-aft boards in the hull's shade white with umber seams and no cross courses (nothing here can
    // be taken for brick), a milk-white king plank down the middle; the broad white covering board round it is geometry
    col = uShade;
    float sd = abs(fract(sh.y / .17 + .5) - .5) * .17;
    float seam = (1. - smoothstep(.007, .007 + 1.2 * fp, sd)) * (1. - smoothstep(.03, .07, fp));
    col = mix(col, uUmber, seam);
    col = mix(col, uWhite, 1. - smoothstep(.06 - fp, .06 + fp, abs(sh.y)));
  }
  if (flag < .5 && tone > 1.5 && tone < 2.5) {
    // the inside of a clinker skiff, seen from above once we have left it: honey ribs every half metre, a honey seat riser along
    // each side, a keelson, a coil of honey rope on the bottom boards (all flat, drawn in the boat's own coordinates)
    float rs = abs(fract(vL.x / .5 + .25) - .5) * .5;
    float rib = (1. - smoothstep(.028 - fx, .028 + fx, rs)) * (1. - smoothstep(.1, .17, fx));
    float tt = clamp((vL.x + 6.05) / 7.5, 0., 1.), ys = .66 + .5 * tt * tt * tt;
    float ris = 1. - smoothstep(.04 - fy, .04 + fy, abs(vL.y - (ys - .22)));
    float keel = (1. - smoothstep(.035 - fz, .035 + fz, abs(vL.z))) * step(vL.y, .2);
    float rr = length(vL.xz - vec2(-1.75, .34));
    float coil = (1. - smoothstep(.27 - fl, .27 + fl, rr)) * smoothstep(.05 - fl, .05 + fl, rr) * step(vL.y, .2)
      * mix(step(abs(fract(rr / .075) - .5), .3), 1., smoothstep(.02, .04, fl));
    col = mix(col, uHoney, max(max(rib, ris), max(keel, coil)));
  }
  float m = max(uRide.y, .1);
  float gain = mod(flag, 2.) * step(vCut, .5);
  if (vCut > .5) col = vW.y > .52 ? uWhite : vW.y > .17 ? uShade : uGreen;     // the transom: white top strake, shade, weed line
  // the eye is a metre off: the cord is drawn at half width here so it has the weight it has on a wall four metres away; seen
  // from above, once we have left the boat, it has its ordinary width, so the deck still carries closed meshes
  // (and the ebb's lengthwise draw is taken out again: on our own deck the meshes are regular, five or six of them in view)
  nvKs = vec2(1.15); nvRay = 0.;
  float vx = max(uVar.x, .2);
  nvG = mat2(vx, 0., 0., 1.); nvGi = mat2(1. / vx, 0., 0., 1.);
  vec2 qd = sh / m + vec2(uRide.x / m, 0.); qd.x /= vx;
  col = nvLight(col, sh, qd, m * mix(2., 1., smoothstep(2.5, 6., eyeD)), vec2(vW.x * .3, vW.z + 64.), mat2(vJ.xy * m * vx, vJ.zw * m), gain);
  nvG = mat2(1.); nvGi = mat2(1.);   // our own deck reads the still net astern of both wakes
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------------------------
// Strokes: flat ribbons that face the eye and never thin below 1.5 px (ropes, ladders, rings, weed hair, wake slivers).
// add(points, width in metres, colour index, sway) ; colours are the palette's.
// ---------------------------------------------------------------------------------------------------------------
class Strokes {
  // typed arrays that double when full (no large JS arrays grown by push: see NvSheets)
  constructor(cap = 4096) { this.cap = cap; this.n = 0; this.pos = new Float32Array(cap * 12); this.dir = new Float32Array(cap * 16); this.dat = new Float32Array(cap * 12); }
  add(pts, w, tone, sway = 0, phase = 0) {
    const ns = pts.length - 1;
    if (this.n + ns > this.cap) {
      let c = this.cap; while (this.n + ns > c) c *= 2; this.cap = c;
      for (const [k, wd] of [['pos', 12], ['dir', 16], ['dat', 12]]) { const a = new Float32Array(c * wd); a.set(this[k].subarray(0, this.n * wd)); this[k] = a; }
    }
    const pos = this.pos, dir = this.dir, dat = this.dat;
    for (let i = 0; i < ns; i++) {
      const a = pts[i], b = pts[i + 1], sa = sway * (i / ns), sb = sway * ((i + 1) / ns), n = this.n++;
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      for (let v = 0; v < 4; v++) {
        const p = v < 2 ? a : b, o3 = n * 12 + v * 3, o4 = n * 16 + v * 4;
        pos[o3] = p[0]; pos[o3 + 1] = p[1]; pos[o3 + 2] = p[2];
        dir[o4] = dx; dir[o4 + 1] = dy; dir[o4 + 2] = dz; dir[o4 + 3] = (v % 2 ? 1 : -1) * w * 0.5;
        dat[o3] = tone; dat[o3 + 1] = v < 2 ? sa : sb; dat[o3 + 2] = phase;
      }
    }
  }
  mesh(U, uRes) {
    const g = new THREE.BufferGeometry(), ns = this.n, idx = new Uint32Array(ns * 6);
    for (let i = 0; i < ns; i++) { const n = i * 4, o = i * 6; idx[o] = n; idx[o + 1] = n + 1; idx[o + 2] = n + 3; idx[o + 3] = n; idx[o + 4] = n + 3; idx[o + 5] = n + 2; }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, ns * 12), 3));
    g.setAttribute('aDir', new THREE.BufferAttribute(this.dir.slice(0, ns * 16), 4));
    g.setAttribute('aDat', new THREE.BufferAttribute(this.dat.slice(0, ns * 12), 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uHoney: U.uHoney, uRose: U.uRose, uUmber: U.uUmber, uGreen: U.uGreen, uWhite: U.uWhite, uRes },
      side: THREE.DoubleSide, fog: false, toneMapped: false,
      vertexShader: /* glsl */`attribute vec4 aDir; attribute vec3 aDat; uniform float uTime; uniform vec2 uRes;
        uniform vec3 uHoney; uniform vec3 uRose; uniform vec3 uUmber; uniform vec3 uGreen; uniform vec3 uWhite; varying vec3 vCol;
        void main(){
          vec3 p = position; float sw = aDat.y;
          p.x += sw * (.5 * sin(uTime * .9 + aDat.z + p.z * .4) + .25 * sin(uTime * 1.7 + aDat.z * 2.1));
          p.z += sw * (.4 * sin(uTime * .7 + aDat.z * 1.3 + p.x * .4));
          vec4 c0 = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          vec4 c1 = projectionMatrix * modelViewMatrix * vec4(p + aDir.xyz, 1.);
          vec2 s0 = c0.xy / max(abs(c0.w), 1e-4), s1 = c1.xy / max(abs(c1.w), 1e-4);
          vec2 d = (s1 - s0) * uRes; float dl = length(d);
          vec2 n = dl > 1e-5 ? vec2(-d.y, d.x) / dl : vec2(0., 1.);
          float px = abs(aDir.w) * projectionMatrix[1][1] * uRes.y * .5 / max(abs(c0.w), 1e-4);   // half width in pixels
          float half_ = max(px, .8) * sign(aDir.w);
          c0.xy += n * half_ * 2. / uRes * c0.w;
          float t = aDat.x;
          vCol = t < .5 ? uHoney : t < 1.5 ? uRose : t < 2.5 ? uUmber : t < 3.5 ? uWhite : uGreen;
          gl_Position = c0;
        }`,
      fragmentShader: 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }' });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; return mesh;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Flat life. Everything alive is cut from flat pieces in the palette's tones.
// FlatGeo: triangle fans / quads with a tone per piece (0 honey 1 rose 2 umber 3 white 4 hull shade 5 green).
// ---------------------------------------------------------------------------------------------------------------
class FlatGeo {
  constructor() { this.pos = []; this.tone = []; this.idx = []; }
  fan(pts, tone, w = 0) {                                    // convex polygon, first point is the hub; w = motion weight
    const n = this.pos.length / 3;
    for (const p of pts) { this.pos.push(p[0], p[1], p[2]); this.tone.push(tone, p[3] ?? w); }
    for (let i = 1; i < pts.length - 1; i++) this.idx.push(n, n + i, n + i + 1);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aTone', new THREE.Float32BufferAttribute(this.tone, 2));
    g.setIndex(this.idx);
    return g;
  }
}
const TONE_GLSL = /* glsl */`
vec3 nvT(float t){ return t < .5 ? uHoney : t < 1.5 ? uRose : t < 2.5 ? uUmber : t < 3.5 ? uWhite : t < 4.5 ? uShade : uGreen; }`;
// instanced flat pieces; aTone.y waggles the piece (tails, heads) with uTime; iFlat = (phase, waggle amount, 0, 0)
const FLAT_VERT = /* glsl */`
attribute vec2 aTone; attribute vec4 iFlat; varying float vTone;
void main(){
  vec3 p = position;
  p.z += aTone.y * iFlat.y * sin(uTime * 5. + iFlat.x + p.x * 3.);
  p.y += iFlat.z * sin(uTime * 2.1 + iFlat.x);
  vTone = aTone.x;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.);
}`;
const FLAT_FRAG = /* glsl */`
varying float vTone;` + TONE_GLSL + `
void main(){ gl_FragColor = vec4(nvT(floor(vTone + .5)), 1.); }`;

// A bird cut flat: +X forward, wings along Z, wingspan 2 (scale it). aTone.x = piece (0 body, 1 wing, 2 tail), aTone.y = flap weight.
// From above it is its back colour; from below white belly, rose throat, dark wing tips (gl_FrontFacing picks the side).
function birdGeometry() {
  const G = new FlatGeo();
  // a swallow cut flat: a slim body with a pointed head, long sickle wings swept back, a deeply forked tail of two slim blades
  G.fan([[0.1, 0, 0], [-0.5, 0, 0.045], [-0.2, 0, 0.095], [0.15, 0, 0.11], [0.38, 0, 0.09], [0.52, 0, 0.055], [0.66, 0, 0]], 0);
  G.fan([[0.1, 0, 0], [0.66, 0, 0], [0.52, 0, -0.055], [0.38, 0, -0.09], [0.15, 0, -0.11], [-0.2, 0, -0.095], [-0.5, 0, -0.045], [-0.5, 0, 0.045]], 0);
  for (const s of [-1, 1]) {
    const a = [0.27, 0, s * 0.09, 0.09], b = [0.16, 0, s * 0.5, 0.5], c = [-0.5, 0, s * 1.05, 1], d = [-0.15, 0, s * 0.5, 0.5], e = [-0.1, 0, s * 0.09, 0.09];
    G.fan(s > 0 ? [a, e, d, c, b] : [a, b, c, d, e], 1);
    const t0 = [-0.4, 0, s * 0.005, 0], t1 = [-0.5, 0, s * 0.15, 0], t2 = [-1.1, 0, s * 0.33, 0.12];
    G.fan(s > 0 ? [t0, t2, t1] : [t0, t1, t2], 2);
  }
  return G.build();
}
// iBird = (phase, flap rate, kind 0 swallow / 1 pigeon, net gain); iBird2 = (fold 0..1, flap amount, 0, 0)
const BIRD_VERT = /* glsl */`
attribute vec2 aTone; attribute vec4 iBird; attribute vec4 iBird2;
varying vec3 vLoc; varying vec2 vPart; varying vec3 vW; varying vec4 vB; varying vec4 vJ;
void main(){
  vec3 p = position; float wgt = aTone.y;
  float glide = smoothstep(-.2, .5, sin(uTime * .9 + iBird.x * 1.7));
  float ang = iBird2.y * (.25 + .75 * glide) * sin(uTime * iBird.y + iBird.x) + .12;
  if (aTone.x > .5 && aTone.x < 1.5) {
    p.z *= 1. - .8 * iBird2.x; p.x -= .5 * iBird2.x * wgt;
    float zz = abs(p.z);
    p.y += zz * sin(ang) * (1. - iBird2.x); p.z *= mix(1., cos(ang), 1. - iBird2.x);
    p.x -= .12 * wgt * cos(uTime * iBird.y + iBird.x) * iBird2.y * (1. - iBird2.x);
  }
  mat4 M = modelMatrix * instanceMatrix;
  vec4 w = M * vec4(p, 1.);
  vLoc = position; vPart = aTone; vW = w.xyz; vB = iBird;
  vJ = vec4((M * vec4(1., 0., 0., 0.)).xz, (M * vec4(0., 0., 1., 0.)).xz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BIRD_FRAG = /* glsl */`
varying vec3 vLoc; varying vec2 vPart; varying vec3 vW; varying vec4 vB; varying vec4 vJ;
void main(){
  float part = floor(vPart.x + .5), pig = step(.5, vB.z);
  vec3 back = mix(uUmber, uShade, pig);
  vec3 col = back;
  // the belly's net is worked out here, outside any branch (derivatives), and used below
  float m = .12;
  vec2 sh = vLoc.xz * length(vJ.xy);
  nvRay = 0.; nvWk = .25;
  vec3 lit = nvLight(uWhite, sh, sh / m + vec2(uTime * 2.2, 0.), m, vW.xz, mat2(vJ.xy * m, vJ.zw * m), step(.5, vB.w) * step(part, .5));
  nvWk = 1.;
  if (!gl_FrontFacing) {
    col = lit;
    // the belly side: a rose throat patch ahead of the wings, a pointed umber cap and bill beyond it, a white belly tapering back to
    // the fork; under each wing the white is a wedge that narrows outward (its point on the leading edge), the rest of the sickle umber
    if (part < .5 && vLoc.x > .1) col = vLoc.x > .4 ? mix(uUmber, uShade, pig) : mix(uRose, uWhite, pig);
    if (part > .5 && part < 1.5 && abs(vLoc.z) > mix(.1 + .2 * clamp((vLoc.x + .1) / .36, 0., 1.), .7, pig)) col = mix(uUmber, uShade, pig);
    if (part > 1.5 && vLoc.x < -.56) col = uUmber;
  } else {
    if (pig > .5 && part > .5 && part < 1.5 && abs(fract(abs(vLoc.z) * 3.2) - .5) < .12) col = uUmber;   // wing bars
    if (pig > .5 && part > 1.5 && vLoc.x > -.62) col = uWhite;
  }
  gl_FragColor = vec4(col, 1.);
}`;

// moorhen and chick, cut upright in the XY plane (+X forward) with a flat back so they read from above too
function moorhenGeometry(chick) {
  const G = new FlatGeo(), k = chick ? 0.5 : 1;
  const body = [[0, 0.12, 0], [-0.34, 0.02, 0], [-0.4, 0.2, 0], [-0.3, 0.3, 0, 1], [-0.05, 0.3, 0], [0.16, 0.26, 0], [0.24, 0.12, 0], [0.18, 0, 0], [-0.2, -0.02, 0]];
  G.fan(body.map((p) => [p[0] * k, p[1] * k, 0, p[3] ?? 0]), 2);
  G.fan([[0.14, 0.2, 0], [0.2, 0.2, 0], [0.3, 0.42, 0], [0.24, 0.5, 0], [0.15, 0.46, 0]].map((p) => [p[0] * k, p[1] * k, 0, 0.5]), 2);   // neck and head
  G.fan([[0.26, 0.5, 0], [0.3, 0.4, 0], [0.42, 0.4, 0]].map((p) => [p[0] * k, p[1] * k, 0, 0.5]), 1);                                // frontal shield and bill
  if (!chick) {
    G.fan([[-0.3, 0.14, 0.004], [0.1, 0.13, 0.004], [0.1, 0.165, 0.004], [-0.3, 0.175, 0.004]], 3);                                 // white flank line
    G.fan([[-0.3, 0.14, -0.004], [-0.3, 0.175, -0.004], [0.1, 0.165, -0.004], [0.1, 0.13, -0.004]], 3);
    G.fan([[-0.4, 0.2, 0], [-0.44, 0.34, 0, 1], [-0.3, 0.3, 0, 1]], 3);                                                              // white under-tail
  }
  G.fan([[0, 0.16 * k, 0], [-0.36 * k, 0.16 * k, 0], [-0.2 * k, 0.16 * k, 0.1 * k], [0.12 * k, 0.16 * k, 0.09 * k], [0.24 * k, 0.16 * k, 0], [0.12 * k, 0.16 * k, -0.09 * k], [-0.2 * k, 0.16 * k, -0.1 * k], [-0.36 * k, 0.16 * k, 0]], 2);
  // its little wake: two white slivers lying on the water
  for (const s of [-1, 1]) G.fan([[0.25 * k, 0.012, s * 0.04], [-1.7 * k, 0.012, s * 0.85 * k], [-1.6 * k, 0.012, s * 0.66 * k]], 3);
  return G.build();
}
// a mullet: an umber crescent that rolls up through the surface (local: arc in the XY plane, rolled about Z)
function mulletGeometry() {
  const G = new FlatGeo(), N = 7, R = 0.62;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * (0.12 + 0.76 * i / N), a1 = Math.PI * (0.12 + 0.76 * (i + 1) / N);
    const w0 = 0.16 * Math.sin(Math.PI * i / N) + 0.02, w1 = 0.16 * Math.sin(Math.PI * (i + 1) / N) + 0.02;
    G.fan([[-R * Math.cos(a0) * 1.25, (R - w0) * Math.sin(a0), 0], [-R * Math.cos(a1) * 1.25, (R - w1) * Math.sin(a1), 0], [-(R) * Math.cos(a1) * 1.25, (R + w1) * Math.sin(a1), 0], [-(R) * Math.cos(a0) * 1.25, (R + w0) * Math.sin(a0), 0]], 2);
  }
  G.fan([[0.72, 0.2, 0], [0.98, 0.42, 0, 1], [0.9, 0.16, 0, 1], [0.98, -0.02, 0, 1]], 2);     // tail
  G.fan([[0, 0.78, 0], [-0.1, 0.92, 0], [0.22, 0.74, 0]], 2);                                // dorsal fin
  return G.build();
}

// a mullet seen from above, under the green: one flat umber shape lying in the water plane (+X forward), its after half and tail weaving
function fishGeometry() {
  const G = new FlatGeo();
  G.fan([[0.1, 0, 0, 0], [0.46, 0, 0, 0], [0.3, 0, 0.075, 0], [0, 0, 0.1, 0.15], [-0.3, 0, 0.06, 0.5], [-0.43, 0, 0.022, 0.8], [-0.43, 0, -0.022, 0.8], [-0.3, 0, -0.06, 0.5], [0, 0, -0.1, 0.15], [0.3, 0, -0.075, 0], [0.46, 0, 0, 0]], 2);
  G.fan([[-0.41, 0, 0, 0.8], [-0.64, 0, 0.12, 1], [-0.56, 0, 0, 1], [-0.64, 0, -0.12, 1]], 2);
  return G.build();
}
// keyframed value: keys = [[u, v], ...] ascending, linear between, eased ends
const keyed = (keys, u) => {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); }
  return keys[keys.length - 1][1];
};

export default {
  id: 'net-on-the-vault',
  name: 'The Net on the Vault',
  category: 'interior',
  weirdness: 0.15,
  media: ['water', 'interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, H = NV_HALL;
    const scene = new THREE.Scene();
    // ---- the edition, chosen once: hour and colourway, water, season, fleet (all uniforms and baked numbers)
    // every family of things takes a stream of its own, made from the visit's seed and the family's name: what is done to one
    // family deals no other anew. The visit's own draws (hour, water, season, fleet colour, the slab's place) are the main stream's.
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const vh = vary.hour || 'any';
    let hour = vh === 'day' ? 'noon' : vh === 'dawn' || vh === 'night' ? 'morning' : vh === 'golden' ? 'afternoon' : '';
    if (!hour) { const hr = rng(); hour = hr < 0.4 ? 'noon' : hr < 0.7 ? 'morning' : 'afternoon'; }
    const waterKind = rng.pick(['breeze', 'slack', 'ebb', 'slack', 'ebb', 'breeze']);
    const winter = rng.chance(0.22);
    const roseFleet = rng.chance(0.5);
    const rare = !!vary.rare;
    const pal = NV_PALETTE.slice();
    if (hour === 'morning') { pal[4] = '#FFF3B8'; pal[1] = '#B27064'; } else if (hour === 'afternoon') pal[4] = '#FFC47A';
    if (winter) { pal[3] = '#47695F'; pal[4] = hour === 'afternoon' ? '#F1D9C0' : '#E3EAEC'; }
    const hero = await buildHero(ctx, { palette: pal, detail, hour, water: waterKind, roseFleet, gate: true, dome: true, waterZ0: -150, waterZ1: 260 });
    hero.object.position.set(0, 0, 0);
    scene.add(hero.object);
    const style = hero.style, U = style.uniforms;
    if (waterKind === 'ebb') U.uVar.value.set(0.6, -0.42, 0, 0);
    if (hour === 'afternoon') { U.uVar.value.z = 8.5; U.uVar.value.w = 0.8; U.uSlab.value.z *= 0.8; U.uSlab.value.w *= 0.8; }
    const slabX = U.uSlab.value.x, slabZ = U.uSlab.value.y;
    await ctx.yield();

    // ---- the canal
    const masonryMat = hero.object.children[0].material;
    const CS = new NvSheets();
    await buildCanal(ctx, CS);
    const canal = new THREE.Mesh(CS.build(), masonryMat); canal.frustumCulled = false; scene.add(canal);
    // the previous world's opening reaches below our water line and the engine clips everything behind the entry plane, so a
    // ray that crosses the plane under the surface would see the white dome: a skirt just inside the plane, in the water's own
    // material (which shades it as the water the ray would have met), closes it
    const skirtGeo = new THREE.PlaneGeometry(160, 16); skirtGeo.translate(0, -8, PATH_PTS[0][2] - 0.1);
    const skirt = new THREE.Mesh(skirtGeo, style.water()); skirt.frustumCulled = false; scene.add(skirt);
    await ctx.yield();

    // ---- our skiff, the pace skiff and (rare) the launch
    const rr = stream('our-skiff'), slide0 = rr.range(0, 40), uRide = { value: new THREE.Vector4(0, 0.135, PATH_PTS[0][2], rr.range(0, 6.28)) }, uRes = { value: new THREE.Vector2(800, 450) };
    const rideMat = style.shader('uniform float uTime;\n' + RIDE_VERT, RIDE_FRAG, { uniforms: { uRide } });
    const ride = new THREE.Mesh(rideGeometry(), rideMat); ride.frustumCulled = false; scene.add(ride);
    await ctx.yield();
    const skiffGeo = nvSkiffGeometry();
    const boats = new THREE.InstancedMesh(skiffGeo, style.hull(), 4);
    skiffGeo.setAttribute('iData', new THREE.InstancedBufferAttribute(new Float32Array([1.3, 0, 1, 0.5, 4.1, 0, 1, 0.5, 2.2, roseFleet ? 1 : 0, 0, 0.5, 5.3, 0, 1, 0.5]), 4));
    boats.frustumCulled = false; scene.add(boats);
    // a moored skiff either side of the eye
    for (const sx of [-1, 1]) { const m4 = new THREE.Matrix4().makeRotationY(sx * Math.PI / 2 + 0.06 * sx); m4.setPosition(sx * 5.6, 0.02, -114.6); boats.setMatrixAt(sx < 0 ? 2 : 3, m4); }
    await ctx.yield();

    // ---- strokes: ropes and rings, ladders, mooring posts, weed hair
    const ST = new Strokes(8192), sr = stream('weed-and-ropes');
    const ladder = (x, z, tz, y0, y1) => {
      for (const e of [-1, 1]) ST.add([[x, y0, z + e * 0.2 * tz], [x, y1, z + e * 0.2 * tz]], 0.05, 2);
      for (let y = y0 + 0.25; y < y1 - 0.1; y += 0.32) ST.add([[x, y, z - 0.2 * tz], [x, y, z + 0.2 * tz]], 0.035, 2);
    };
    const post = (x, z, h) => { ST.add([[x, -0.3, z], [x, h, z]], 0.2, 2); ST.add([[x, h, z], [x, h + 0.12, z]], 0.24, 0); };
    const weed = (x, z, dx, dz, n) => {
      for (let i = 0; i < n; i++) {
        const a = sr.range(-0.5, 0.5), L = sr.range(1.2, 3.2), ox = sr.range(-0.5, 0.5), c = Math.cos(a), s = Math.sin(a), ex = dx * c - dz * s, ez = dx * s + dz * c;
        const p0 = [x + ox * dz, 0.02, z + ox * dx], pts = [p0];
        for (let k = 1; k <= 4; k++) pts.push([p0[0] + ex * L * k / 4, 0.02, p0[2] + ez * L * k / 4]);
        ST.add(pts, 0.035, 2, 0.5, sr.range(0, 6.28));
      }
    };
    const ebbZ = waterKind === 'ebb' ? 1 : 0;
    for (let k = 0; k < H.nPier; k++) for (const sx of [-1, 1]) {
      const cx = sx * H.pierX, cz = H.pier0 + H.bay * k;
      ladder(cx - sx * 1.56, cz + 0.55, 1, -0.2, 3.4);
      post(cx - sx * 2.3, cz - 1.9, 1.5);
      weed(cx - sx * 1.5, cz, -sx * (1 - 0.6 * ebbZ), 0.9 * ebbZ + 0.15, Math.round(4 * detail));
      weed(cx, cz + 1.5, -sx * 0.2, 1, Math.round(2 * detail));
    }
    for (let b = 0; b <= CANAL.nBay; b++) for (const sx of [-1, 1]) {
      const zc = 124 + CANAL.bay * b, x = sx * (CANAL.half - 0.26);
      if ((b + (sx > 0 ? 1 : 0)) % 3 === 0) ladder(x - sx * 0.02, zc, 1, -0.2, 3.3);
      else ST.add([[x - sx * 0.03, 1.55, zc - 0.1], [x - sx * 0.03, 1.55, zc + 0.1]], 0.2, 2);       // an iron ring
      weed(x, zc, -sx * 0.7, 0.7, Math.round(3 * detail));
      if (b % 2 === 0) post(sx * 3.75, zc + 0.95, 1.3);   // (beside a plinth, so the umber post stands against honey stone and brick, never against a recess)
    }
    // iron rings hang from the bridge's soffit, one every 3.2 m, left and right of the keystone course by turns, 2.1 m off the crown line: there each ring as a whole (shank and loop) stands 2.09 m from the nearest point of our eye's line (x 0, y 1.6), so it is 2.0 m clear whatever the window or the gaze (at 1.5 m it stood 1.57 m off, and 1.85 m when last in a wide picture)
    for (let k = 0; k < 5; k++) {
      const x = (k % 2 ? 1 : -1) * 2.1, z = CANAL.bridge0 + 1.6 + 3.2 * k, y = 2.8 - 0.8 * (x / CANAL.half) * (x / CANAL.half), ring = [];
      ST.add([[x, y, z], [x, y - 0.15, z]], 0.05, 2);
      for (let a = 0; a <= 8; a++) ring.push([x + 0.13 * Math.sin(a * Math.PI / 4), y - 0.28 - 0.13 * Math.cos(a * Math.PI / 4), z]);
      ST.add(ring, 0.035, 2);
    }
    for (let b = 0; b < 13; b++) for (const sx of [-1, 1]) {
      const zc = H.pier0 + H.bay * b + 8, e = (b + (sx > 0 ? 1 : 0)) % 2 ? 1 : -1;
      post(sx * 23.0, zc - e * 2.7, 1.7);
      if (b % 3 !== 1) post(sx * 23.5, zc + e * 0.9, 1.25);
      for (const dx of [-0.2, 0.2]) ST.add([[sx * 23.1 + dx, -0.2, zc + e * 4.42], [sx * 23.1 + dx, 3.6, zc + e * 4.42]], 0.05, 2);
      for (let y = 0.05; y < 3.5; y += 0.32) ST.add([[sx * 23.1 - 0.2, y, zc + e * 4.42], [sx * 23.1 + 0.2, y, zc + e * 4.42]], 0.035, 2);
    }
    // the end wall: each respond has its ladder and its mooring post like every pier, and the skiff moored either side of the
    // eye lies on a honey rope from its far end to an iron ring in the plinth course
    for (const sx of [-1, 1]) {
      ladder(sx * (H.pierX - 1.56), H.z0 + 0.65, 1, -0.2, 3.4);
      post(sx * (H.pierX - 2.3), H.z0 + 1.9, 1.5);
      const a = [sx * 5.6, 0.55, -114.6 - 3.1], r = [sx * 6.15, 1.25, H.z0 + 0.2], rope = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5; rope.push([a[0] + (r[0] - a[0]) * t, a[1] + (r[1] - a[1]) * t - 0.35 * Math.sin(Math.PI * t), a[2] + (r[2] - a[2]) * t]); }
      ST.add(rope, 0.04, 0);
      ST.add([[r[0], r[1] - 0.09, r[2]], [r[0], r[1] + 0.09, r[2]]], 0.18, 2);
    }
    await ctx.yield();
    // honey ropes from every moored skiff to a ring on the nearest pier or wall
    for (const [mx, , mz] of hero.anchors.moorings) {
      const sx = mx > 0 ? 1 : -1, wall = Math.abs(mx) > 15;
      for (const e of [-1, 1]) {
        const a = [mx, 0.55, mz + e * 3.1];
        let b;
        if (wall) { const zc = H.pier0 + 8 + H.bay * Math.round((mz - H.pier0 - 8) / H.bay); b = [sx * (H.wallX - 0.03), 1.7, Math.abs(mz - zc) < 3 && Math.abs(zc) < 100 ? zc + e * 5.25 : mz + e * 4.4]; }
        else { const pz = H.pier0 + H.bay * Math.round((mz + e * 8 - H.pier0) / H.bay); b = [mx + (mx - sx * H.pierX) * 0.3, 1.45, pz - e * 1.53]; }
        if (Math.abs(b[2]) > 110) continue;
        const pts = [];
        for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.5 * Math.sin(Math.PI * t), a[2] + (b[2] - a[2]) * t]); }
        ST.add(pts, 0.04, 0);
        ST.add([[b[0], b[1] - 0.09, b[2]], [b[0], b[1] + 0.09, b[2]]], 0.18, 2);
      }
    }
    await ctx.yield();
    const strokes = ST.mesh(U, uRes); scene.add(strokes);
    await ctx.yield();
    // canal ferns, from the joints just above the waterline
    const fl = [], fr = stream('canal-ferns');
    for (let b = 0; b <= CANAL.nBay; b++) for (const sx of [-1, 1]) {
      const zc = 124 + CANAL.bay * b;
      for (let i = 0; i < Math.round(2 * detail); i++) fl.push([sx * (CANAL.half - 0.23), fr.range(0.18, 0.75), zc + fr.range(-0.5, 0.5), -sx, 0]);
      if (fr.chance(0.6)) fl.push([sx * (CANAL.back - 0.01), fr.range(0.18, 0.6), zc + 2.5 + fr.range(-1.4, 1.4), -sx, 0]);
    }
    scene.add(await nvFerns(fl, fr, U, ctx));
    // hart's-tongue in the joints of the string course from which the centre vault springs, two or three to a bay on each side
    const vd = stream('vault-dressing'), vf = [];
    for (const sx of [-1, 1]) for (let k = 0; k < H.nPier - 1; k++) {
      const n = Math.round(vd.int(2, 3) * detail);
      for (let i = 0; i < n; i++) vf.push([sx * (H.pierX - 1.21), vd.range(5.45, 5.95), H.pier0 + H.bay * k + vd.range(1.8, 14.2), -sx, 0]);
    }
    scene.add(await nvFerns(vf, vd, U, ctx));
    await ctx.yield();

    // ---- flat life: nests, swallows (or winter pigeons), a moorhen with three chicks, mullet in the slab
    const flatMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'uniform float uTime;\n' + FLAT_VERT, fragmentShader: NV_UNIFORMS_GLSL + FLAT_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false });
    const flatMesh = (geo, n, data) => {
      geo.setAttribute('iFlat', new THREE.InstancedBufferAttribute(new Float32Array(data), 4));
      const m = new THREE.InstancedMesh(geo, flatMat, n); m.frustumCulled = false; scene.add(m); return m;
    };
    const nr = stream('nests'), br = stream('swallows'), hr2 = stream('hen-and-chicks'), mr = stream('mullet');
    const NG = new FlatGeo();
    for (const sx of [-1, 1]) for (let k = 0; k < H.nPier - 1; k++) {
      const n = winter ? 1 : nr.int(2, 4);
      for (let i = 0; i < n; i++) {
        const z = H.pier0 + H.bay * k + nr.range(2.5, 13.5), x = sx * 8.2, r = nr.range(0.2, 0.3), pts = [[x, 5.4, z]];
        for (let j = 0; j <= 6; j++) { const a = Math.PI * j / 6; pts.push([x, 5.4 - r * 0.9 * Math.sin(a), z + r * Math.cos(a)]); }
        NG.fan(pts, 2);
        NG.fan([[sx * 8.35, 5.4, z - r], [x, 5.4, z - r], [x, 5.4 - r * 0.9, z], [sx * 8.35, 5.4 - r * 0.9, z]], 2);
      }
    }
    // a mud cup on a wall that faces across the hall (the wall's plane is x = xw, the cup stands out toward the axis)
    const cup = (xw, y, z, r) => {
      const sx = xw > 0 ? 1 : -1, x = xw - sx * 0.15, pts = [[x, y, z]];
      for (let j = 0; j <= 6; j++) { const a = Math.PI * j / 6; pts.push([x, y - r * 0.9 * Math.sin(a), z + r * Math.cos(a)]); }
      NG.fan(pts, 2);
      NG.fan([[xw, y, z - r], [x, y, z - r], [x, y - r * 0.9, z], [xw, y - r * 0.9, z]], 2);
      NG.fan([[xw, y, z + r], [xw, y - r * 0.9, z], [x, y - r * 0.9, z], [x, y, z + r]], 2);
    };
    // two cups under the bridge, where its soffit springs from the quay piers (never in winter's count: these are old nests)
    const bd = stream('bridge-dressing');
    // and one under the impost of each respond at the end wall
    const ed = stream('end-wall-dressing');
    for (const sx of [-1, 1]) cup(sx * (H.pierX - 1.2), 5.05, H.z0 + 0.6 + ed.range(-0.2, 0.3), ed.range(0.2, 0.28));
    for (const sx of [-1, 1]) cup(sx * CANAL.half, 1.92, 124 + CANAL.bay * (sx > 0 ? 4 : 5) + bd.range(-0.3, 0.3), bd.range(0.2, 0.27));
    flatMesh(NG.build(), 1, [0, 0, 0, 0]).setMatrixAt(0, new THREE.Matrix4());
    await ctx.yield();
    // sixty swallows and bird 0, the first of the leading flight (winter: forty pigeons and bird 0). Each draws only what its kind reads.
    //   kind 3  the leading flight: bird 0 and the four to six dealt after the last bird (below), ahead of us on our own route through the middle of the hall; each one's own beat is a figure of eight beside our line where it joins us
    //   kind 4  five that hawk together under the vault where the sink begins, and cross our bow there
    //   kind 0  the canal's; kind 5  two that keep to the hatch and cross its white
    //   kind 2  hawking along the centre aisle at every height under the vault, in the berths below; kind 1  round the piers, dipping to drink
    //   kind 7  two that hawk inside the gate, and dip to drink across our bow there
    //   kind 6  low over the water of the centre aisle between the gate and the slab, either side of the axis and never nearer
    //           it than 2.8 m, dipping to drink
    // THE BERTHS OF KINDS 2 AND 6 are a law of the place. A bird is a body, and the route is the same line through the hall on
    // every visit (PATH_PTS): on the axis at 1.6 m from the gate to z 78, left of the axis and climbing from there to the sink,
    // back on the axis (never right of x +0.35) at 7 m from z -62 to the eye. Each beat is berthed where that line never comes
    // within 2 m of a wing tip at any clock (a swallow's wing tip is at most 0.59 m from its place, a pigeon's 0.73 m). Every
    // number is drawn as it always was, in the same order; only the range it is laid into is new:
    //   kind 2 RIGHT             the whole beat between 3.2 m right of the axis (pigeons 3.4 m) and a far edge that follows
    //                            the vault: where a circle of 7.4 m about the vault's own centre line (the vault's is 8 m; the
    //                            pier faces stand at 8 m) is as high as the bird ever flies (its height + 0.8 m), so 5.9 to
    //                            7.3 m from the axis, nearer for a higher bird, and no wing is laid into the brick. Its turn
    //                            across the hall is two to three sevenths of that width, by its drawn turn; its middle is
    //                            laid by its drawn place across; along the hall as dealt
    //   kind 2 LEFT, THE GATE    across the hall as dealt; its whole length between z 64 and z 112, where the route runs under
    //                            2.8 m and the lowest bird flies at 5.8 m
    //   kind 2 LEFT, THE SINK    the right-hand beat mirrored; its whole length between z -112 and z -66, where the route is
    //                            back on the axis
    //   kind 6 RIGHT             inner turn 2.8 to 3.1 m from the axis, middle 4 to 5 m (outer turn 7.2 m at most); along the
    //                            hall as dealt
    //   kind 6 LEFT              the same mirrored; its whole length between z 81 and z 118, where the route is still on the axis
    // WHICH SIDE is the bird's own draw: one dealt to the left (kind 2: its drawn place across; kind 6: its drawn side) whose
    // drawn place along the hall is in the gate-most third of its kind's stretch goes left at the gate; a kind 2 dealt to the
    // left in the eye-most third goes left beyond the sink; every other bird goes right. Nothing here reads the lens, the
    // route as flown, a clock, the tier or the picture.
    // THE RINGS OF KINDS 5 AND 1 are a law of the place too. Their beats read the world's clock only, so the eye can be anywhere
    // on the route when the bird is anywhere on its ring: each ring lies where no point of the route's line comes within 2 m of
    // a wing tip (1.22 times the bird's size from its place: 0.67 m for the hatch pair, 0.83 m as pigeons; 0.58 and 0.72 m round
    // the piers) at any clock, dip or stroke. Every number is drawn as it always was, in the same order; only where the ring is
    // laid is new:
    //   kind 5 THE HATCH PAIR    in the hatch's own shaft. The opening is x -3 to 3, z -5 to 5; its rim is the vault, 13.4 m at
    //                            the long sides and 14 m at the crown; the shaft stands to 15.3 m and the white is over it. The
    //                            ring's middle is at 14.4 m (it was 12.25 m, under the opening and 0.8 m over our line, which
    //                            runs 4 m left of the axis at 11.3 to 11.5 m) and its rise 0.4 m as before, so the pair fly at
    //                            14 to 14.8 m with the white behind them from below; half-widths across 2.1 and 1.7 m (they
    //                            were 2.3 and 1.7), so that no wing is laid into the shaft's long sides; along the hall as
    //                            before. The beat's clip under the vault is not laid on them: in the opening there is no vault
    //   kind 1 ROUND THE PIERS   each keeps its own pier place, side, height, dip, speed and phase, and its half-width across as
    //                            dealt (4.5 to 7 m) but where the route passes its inner turn:
    //                            the two gate-most places (z 96 and 80), both sides, where the route is on the axis at 1.6 m:
    //                              laid into 4.5 to 6.35 m, the inner turn 2.85 m or more from the axis
    //                            the left place at z 64, where the route has left the axis and climbs through 2.8 m:
    //                              laid into 4.5 to 4.9 m, the inner turn 4.3 m or more from the axis
    //                            the left place at z 48, where the route climbs 3.5 m left of the axis at 4.8 m:
    //                              laid into 4.5 to 4.9 m and the ring's middle moved from the pier line (9.2 m from the axis)
    //                              toward the wall, to 5.95 m and its half-width (10.45 to 10.85 m), the inner turn at 5.95 m.
    //                              No ring is narrower than 4.5 m, the least that was ever dealt
    // Nothing here reads the lens, the route as flown, a clock, the tier or the picture.
    const nBird = 1 + (winter ? 40 : Math.round(60 * (0.7 + 0.3 * detail) * Math.min(1.2, Math.max(0.8, vary.density ?? 1)))), birdGeo = birdGeometry();
    // THE LEADING FLIGHT: four to six more swallows of bird 0's own make (winter: its winter make), dealt by a stream of
    // their own, are added after the last bird of the deal above: with bird 0 they are the five to seven that lead us through the
    // middle of the hall (the update's kind 3). Nothing of the deal above is touched: every bird keeps its number and its draws
    const lf = stream('leading-flight'), nLead = lf.int(4, 6), nAll = nBird + nLead;
    const iBird = new Float32Array(nAll * 4), iBird2 = new Float32Array(nAll * 4), birdList = [];
    const SINK_Z = PATH_PTS[13][2];                         // the last point of the level skim: the sink begins here
    for (let i = 0; i < nBird; i++) {
      const kind = i === 0 ? 3 : i < 6 ? 4 : i < 12 ? 0 : i < 14 ? 5 : i < 16 ? 7 : i % 3 === 0 ? 2 : i % 6 === 1 ? 6 : 1;
      const b = { kind, ph: br.range(0, 6.28), perched: false, dipK: 0, dip: 0 };
      if (kind === 3) { b.cx = 0; b.cz = 0; b.cy = 9; b.rx = 1.4; b.rz = 6; b.w = br.range(0.45, 0.6); b.amp = 0.5; }   // (its beat is set where it meets us, once the route is laid: below)
      else if (kind === 4) { b.cx = br.range(-1.5, 2.5); b.cz = SINK_Z + br.range(-6, 10); b.cy = br.range(9.2, 10.6); b.rx = br.range(2.5, 4); b.rz = br.range(7, 11); b.w = br.range(0.45, 0.65); b.amp = 0.7; }
      else if (kind === 0) { b.cx = br.range(-0.8, 0.8); b.cz = br.range(128, 166); b.cy = br.range(5.6, 9.5); b.rx = br.range(1.8, 2.8); b.rz = br.range(5, 9); b.w = br.range(0.7, 1.1); b.amp = 0.8; }
      else if (kind === 5) { const e = i === 12 ? 1 : -1; b.cx = 0; b.cz = 0.7 * e - 0.1; b.cy = 14.4; b.rx = 1.9 + 0.2 * e; b.rz = 1.75 - 0.25 * e; b.w = br.range(0.55, 0.9); b.amp = 0.4; }
      else if (kind === 1) {
        b.cx = (br.chance(0.5) ? 1 : -1) * H.pierX; b.cz = H.pier0 + H.bay * br.int(0, 12) + 8; b.cy = br.range(2.2, 2.9); b.rx = br.range(4.5, 7); b.rz = br.range(2.5, 4.5); b.w = br.range(0.55, 0.9); b.amp = 0.6; b.dipK = 1; b.dip = br.range(0, 6.28);
        const hi = b.cz > 72 ? 6.35 : b.cx < 0 && b.cz > 40 ? 4.9 : 7;      // the widest half-width its place and side can hold (z 96 and 80; left 64 and left 48)
        if (hi < 7) b.rx = 4.5 + (b.rx - 4.5) * (hi - 4.5) / 2.5;
        if (b.cx < 0 && b.cz === 48) b.cx = -5.95 - b.rx;
      }
      else if (kind === 7) { b.cx = br.range(-3, 3); b.cz = H.z1 - br.range(8, 18); b.cy = br.range(4, 6); b.rx = br.range(2, 3); b.rz = br.range(4, 6); b.w = br.range(0.5, 0.7); b.amp = 0.6; }
      else if (kind === 6) {
        const sx = br.chance(0.5) ? 1 : -1, x0 = br.range(2.4, 4.6), zA = slabZ + 20, zB = H.z1 - 10, z0 = br.range(zA, zB); b.cy = br.range(1.3, 2.3); const t0 = br.range(1.2, 1.6); b.rz = br.range(6, 12); b.w = br.range(0.5, 0.8); b.amp = 0.45; b.dipK = 1; b.dip = br.range(0, 6.28);
        const fz = (z0 - zA) / (zB - zA), left = sx < 0 && fz >= 2 / 3, ac = 4 + (x0 - 2.4) / 2.2;
        b.cx = left ? -ac : ac; b.rx = ac - 2.8 - 0.75 * (t0 - 1.2); b.cz = left ? 81 + b.rz + (3 * fz - 2) * (37 - 2 * b.rz) : z0;
      }
      else {
        const x0 = br.range(-4.5, 4.5), z0 = br.range(-84, 64); b.cy = br.range(6.6, 9.6); const r0 = br.range(1.6, 3.2); b.rz = br.range(10, 22); b.w = br.range(0.35, 0.6); b.amp = 0.8;
        const fz = (z0 + 84) / 148, near = winter ? 3.4 : 3.2, far = Math.sqrt(54.76 - (b.cy - 5.2) * (b.cy - 5.2)), rx = (far - near) * (2 + (r0 - 1.6) / 1.6) / 7, ac = near + rx + Math.abs(x0) / 4.5 * (far - near - 2 * rx);
        if (x0 < 0 && fz >= 2 / 3) { b.cx = x0; b.rx = r0; b.cz = 64 + b.rz + (3 * fz - 2) * (48 - 2 * b.rz); }
        else if (x0 < 0 && fz <= 1 / 3) { b.cx = -ac; b.rx = rx; b.cz = -112 + b.rz + 3 * fz * (46 - 2 * b.rz); }
        else { b.cx = ac; b.rx = rx; b.cz = z0; }
      }
      b.s = kind === 3 ? (winter ? 0.26 : 0.24) : (winter ? br.range(0.5, 0.6) : br.range(0.38, 0.48)) * (kind === 5 ? 1.15 : kind === 4 || kind === 7 ? 1.2 : 1);
      if (winter && i > 24) { b.perched = true; const k = br.int(0, 13), sx = br.chance(0.5) ? 1 : -1, f = br.int(0, 3); b.px = sx * H.pierX + [1.36, 0, -1.36, 0][f] + (f % 2 ? br.range(-1, 1) : 0); b.pz = H.pier0 + H.bay * k + [0, 1.36, 0, -1.36][f] + (f % 2 ? 0 : br.range(-1, 1)); b.yaw = br.range(0, 6.28); }
      iBird.set([b.ph, winter ? br.range(9, 11) : br.range(13, 17), winter ? 1 : 0, kind === 3 ? 1 : 0], i * 4);
      iBird2.set([b.perched ? 1 : 0, b.perched ? 0 : winter ? 0.75 : 0.85, 0, 0], i * 4);
      birdList.push(b);
    }
    // each of the flight has its slot f (bird 0 the nearest), its own weave and slip rates, and (the new ones) a beat of its own:
    // a figure of eight right of our line and over it before the hatch (laid once the route is: below), b.j0 m later than bird 0's
    for (let j = 0; j <= nLead; j++) {
      const b = j ? { kind: 3, ph: lf.range(0, 6.28), perched: false, dipK: 0, dip: 0, cx: 0, cz: 0, cy: 9, rx: lf.range(1, 1.6), rz: lf.range(4, 6), w: lf.range(0.45, 0.6), amp: 0.5 } : birdList[0];
      b.f = j; b.wv = lf.range(1.2, 2.2); b.ws = lf.range(0.6, 1);
      if (!j) continue;
      b.j0 = lf.range(0, 6); b.jr = lf.range(2.6, 5.2); b.ju = lf.range(0.4, 1.6);
      iBird.set([b.ph, winter ? lf.range(9, 11) : lf.range(13, 17), winter ? 1 : 0, 1], (nBird + j - 1) * 4);
      iBird2.set([0, winter ? 0.75 : 0.85, 0, 0], (nBird + j - 1) * 4);
      birdList.push(b);
    }
    // THE FLIGHT'S SIZE is the hall's own swallow size: every bird of the flight, bird 0 and then the new ones in slot order, is
    // dealt a size of its own from 0.38 to 0.48, summer and winter alike (in winter its make is the winter make it has; its size
    // is from this range too). These are the stream's last draws. Bird 0's typed size of the deal above is replaced here
    for (let j = 0; j <= nLead; j++) birdList[j ? nBird + j - 1 : 0].s = lf.range(0.38, 0.48);
    // THE WAITING BIRDS' ROLL: the five (kind 4) and the gate pair (kind 7) roll about their bank while they wait (the update).
    // A stream of its own, which draws from no other, deals each of them two numbers, the birds of kind 4 in the list's order
    // and then the birds of kind 7 in the list's order: b.rw, the rate of its roll (1.6 to 2.5 radians a second), and b.rp,
    // the phase of its roll (0 to 6.2832). The roll's clock has no typed number: every bird's rate and phase are dealt
    const wr = stream('waiting-roll');
    for (const kd of [4, 7]) for (const b of birdList) if (b.kind === kd) { b.rw = wr.range(1.6, 2.5); b.rp = wr.range(0, 6.2832); }
    birdGeo.setAttribute('iBird', new THREE.InstancedBufferAttribute(iBird, 4));
    birdGeo.setAttribute('iBird2', new THREE.InstancedBufferAttribute(iBird2, 4));
    const birdMat = style.shader('uniform float uTime;\n' + BIRD_VERT, BIRD_FRAG);
    const birds = new THREE.InstancedMesh(birdGeo, birdMat, nAll); birds.frustumCulled = false; scene.add(birds);
    await ctx.yield();
    const chPh = [hr2.range(0, 6.28), hr2.range(0, 6.28), hr2.range(0, 6.28)];
    const hen = flatMesh(moorhenGeometry(false), 1, [hr2.range(0, 6.28), 0.02, 0.02, 0]);
    const chicks = flatMesh(moorhenGeometry(true), 3, [chPh[0] * 1.7, 0.03, 0.02, 0, chPh[1] * 1.7, 0.03, 0.02, 0, chPh[2] * 1.7, 0.03, 0.02, 0]);
    const nMul = 7, mulData = [], mulList = [];
    for (let i = 0; i < nMul; i++) {
      mulData.push(mr.range(0, 6.28), 0.05, 0, 0);
      mulList.push({ x: slabX + mr.range(-0.75, 0.75) * U.uSlab.value.z, z: slabZ + mr.range(-0.8, 0.8) * U.uSlab.value.w, yaw: mr.range(0, 6.28), per: mr.range(3.5, 6.5), ph: mr.range(0, 1) });
    }
    const mullet = flatMesh(mulletGeometry(), nMul, mulData);
    // and up the centre aisle between the gate and the slab they are umber shapes under the green, each weaving a slow figure of
    // eight of its own (the brief: "Mullet are umber shapes under the green")
    const nFish = Math.max(6, Math.round(14 * detail)), fishData = [], fishList = [];
    for (let i = 0; i < nFish; i++) {
      fishData.push(mr.range(0, 6.28), 0.07, 0, 0);
      fishList.push({ cx: mr.range(-6, 6), cz: mr.range(slabZ + 12, H.z1 - 8), rx: mr.range(0.5, 1.5), rz: mr.range(3, 7), w: mr.range(0.12, 0.22), ph: mr.range(0, 6.28) });
    }
    const fish = flatMesh(fishGeometry(), nFish, fishData);
    await ctx.yield();

    // ---- the flight
    const path = makePath(PATH_PTS);
    const L = path.length, uOff = 90 / L, zOff = PATH_PTS[0][2] - 90;   // we leave the foredeck 90 m in, two bays into the hall; the skiff runs on beneath us
    // our skiff once we have left it: it runs on down the aisle with a short spurt at first, crosses the slab ahead of us, then eases
    // (from 40 m after we leave it) so that through the skim and the sink it is in the green below and ahead, its wake's chevron on the water and
    // the vault, and makes for the eye again as we come down behind it
    const ramp = (d, a, w) => { const t = (d - a) / w; return t <= 0 ? 0 : t >= 1 ? w * (t - 0.5) : w * (t * t * t - 0.5 * t * t * t * t); };
    const rideZ = (u) => { const d = Math.max(0, u - uOff) * L; return Math.max(-97, zOff - 1.75 * d - 5 * sstep(0, 9, d) + 1.2 * ramp(d, 40, 20) - 0.75 * ramp(d, 122, 16)); };
    const pace = (u) => 1.2 - 0.2 * sstep(0.14, 0.19, u) - 0.45 * sstep(0.33, 0.37, u) + 0.85 * sstep(0.53, 0.57, u) - 0.4 * sstep(0.7, 0.8, u);
    const zPace = [[0, 162], [uOff, zOff - 6], [0.58, slabZ + 1], [0.8, -90], [1, -94]];
    const xPace = [[0, 2.7], [0.165, 2.7], [0.24, 5], [0.47, 5], [0.56, slabX + 2.4], [0.62, slabX + 2.4], [0.72, 5], [1, 5]];
    // the pace skiff's course as a line on the water: how far right of the axis it lies where its middle is at z (its heading is
    // the chord of its own 6.5 m along that line)
    const paceXatZ = (z) => { for (let i = 1; i < zPace.length; i++) if (z >= zPace[i][1]) { const a = zPace[i - 1], b = zPace[i]; return keyed(xPace, a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])); } return xPace[xPace.length - 1][1]; };
    const P = new THREE.Vector3(), T = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), M = new THREE.Matrix4(), S1 = new THREE.Vector3(1, 1, 1);
    const cf = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
    const size = new THREE.Vector2(), PG = new THREE.Vector3();
    // a point 10 m off along the route's heading, turned right by rx and raised by ry (tangents of the angles)
    const gaze = (u, rx, ry) => { const uu = Math.min(1, Math.max(0, u)); path.pointAt(uu, PG); path.tangentAt(uu, cf); return PG.set(PG.x + 10 * (cf.x - rx * cf.z), PG.y + 10 * (cf.y + ry), PG.z + 10 * (cf.z + rx * cf.x)); };
    const place = (mesh, i, x, y, z, yaw, s, roll = 0) => { E.set(0, yaw, roll, 'YXZ'); Q.setFromEuler(E); P.set(x, y, z); S1.set(s, s, s); M.compose(P, Q, S1); mesh.setMatrixAt(i, M); };

    // metres flown at the place where the route passes a given z of the hall (the route runs down the hall, so there is one)
    const mAtZ = (z) => { let a = 0, b = L; for (let i = 0; i < 40; i++) { const c = 0.5 * (a + b); if (path.posAtDist(c, PG).z > z) a = c; else b = c; } return 0.5 * (a + b); };
    const M_HATCH = mAtZ(0), M_SINK = mAtZ(SINK_Z), M_LEVEL = mAtZ(PATH_PTS[14][2]), M_DIP = mAtZ(H.z1 - H.bay / 2);      // the hatch's middle goes over us; the level skim ends; the sink is over; half a bay inside the gate
    const LA = new THREE.Vector3(), LB = new THREE.Vector3();
    // bird 0 of the leading flight hawks its own figure of eight just right of our line and over it, seated 24 m before the
    // hatch's middle (it leaves that beat for its place ahead of us between 38.5 and 27.5 m before the hatch's middle)
    { const b0 = birdList[0]; path.posAtDist(M_HATCH - 24, PG); b0.cx = PG.x + 1.5; b0.cy = PG.y + 0.6; b0.cz = PG.z - 3; }
    const RP = new THREE.Vector3(), RT = new THREE.Vector3(), RR = new THREE.Vector3(), RU = new THREE.Vector3(0, 1, 0), OB = new THREE.Vector3();
    // the route's own frame at a distance flown: point, level heading, level right
    const routeAt = (m) => { path.posAtDist(m, RP); path.tangentAtDist(m, RT); RT.y = 0; RT.normalize(); RR.set(-RT.z, 0, RT.x); };
    // the beats of the flight's new birds: each a figure of eight along the hall, its middle b.jr m right of our line and b.ju m
    // over it, its near end 27 m before the hatch's middle less its own b.j0 (bird 0's: 27 m); b.mj: where it begins to join us
    for (let i = 0; i < nAll; i++) {
      const b = birdList[i]; if (b.kind !== 3) continue;
      b.mj = M_HATCH - 38.5 + (b.f ? b.j0 : 0); if (!b.f) continue;
      routeAt(M_HATCH - 27 + b.j0 + b.rz); b.cx = RP.x + RR.x * b.jr; b.cy = RP.y + b.ju; b.cz = RP.z + RR.z * b.jr;
    }
    // a bird's own beat: a figure of eight about its place, on the world's clock from its own phase; it keeps under the vault
    // (but the hatch pair, whose ring lies in the hatch's opening)
    const beatAt = (b, time, o) => {
      const th = time * b.w + b.ph, s = Math.sin(th), c = Math.cos(th);
      const d = b.dipK * Math.pow(Math.max(0, Math.sin(th * 0.5 + b.dip)), 10);
      const x = b.cx + b.rx * s, y = (b.cy + b.amp * Math.sin(th * 1.3 + b.ph)) * (1 - d) + 0.3 * d;
      o.set(x, b.cx * b.cx < 64 && b.kind !== 5 ? Math.min(y, 5.3 + Math.sqrt(Math.max(64 - x * x, 0))) : y, b.cz + b.rz * 2 * s * c);
      X.set(b.rx * c, 0.9 * b.amp * Math.cos(th * 1.3 + b.ph) * (1 - d), b.rz * 2 * (c * c - s * s)).normalize();
      return s;
    };
    // a bird at P that flies with us for a stretch of the route: headed psi radians left of the route's heading and a little up,
    // banked rho away from our line, so that its belly (or its back) is turned to the route and wings, head and fork are seen
    // from it (a flat bird flown dead ahead and level would be seen edge-on). Everything here is the route's, at the distance flown.
    // roll: a roll of the bird's own, right wing down, added to that bank (the flight's weave, and the five's and the pair's while they wait)
    const QB = new THREE.Quaternion();
    const bankBird = (psi, rho, roll = 0) => {
      X.copy(RT).multiplyScalar(Math.cos(psi)).addScaledVector(RR, -Math.sin(psi)).addScaledVector(RU, 0.22).normalize();
      Y.copy(RU).addScaledVector(X, -RU.dot(X)).normalize(); Z.crossVectors(X, Y);
      T.copy(RP).sub(P).normalize();
      const sg = Z.dot(T) > 0 ? -1 : 1;
      Y.multiplyScalar(Math.cos(sg * rho + roll)).addScaledVector(Z, Math.sin(sg * rho + roll)).normalize(); Z.crossVectors(X, Y).normalize(); Y.crossVectors(Z, X);
      M.makeBasis(X, Y, Z); QB.setFromRotationMatrix(M);
    };
    // the flight's lanes: metres right of our line (three lanes, by the slot's number modulo three: no two birds within two slots
    // of each other share one) and metres over it by slot: LU along the hall, LW while the five cross under them
    const LR = [1.3, 2.25, 3.2], LU = [0.5, 1.1, 0.8, 1.15, 0.6, 1.0, 1.1], LW = [1.3, 1.3, 1.1, 1.3, 1.35, 1.25, 1.3];
    function update(dt, time, camera, u) {
      ctx.renderer.getDrawingBufferSize(size); uRes.value.copy(size); U.uPx.value = Math.max(0.5, size.y / 450);
      // our skiff: under the eye for the first third, then it runs on down the aisle
      let ox, oz, yaw = Math.PI / 2;
      if (u <= uOff) { path.pointAt(u, P); path.tangentAt(u, T); ox = P.x; oz = P.z; yaw = Math.atan2(-T.z, T.x); }
      else { ox = 0; oz = rideZ(u); }
      ride.position.set(ox, 0, oz); ride.rotation.y = yaw;
      uRide.value.x = slide0 + time * 0.55 + u * L * 0.22;
      const aS = (1 - sstep(-78, -96, oz) * 0.999) * (0.001 + 0.999 * sstep(0.1, 0.15, u));   // (in the canal the water ahead of our own bow lies still: the soffit and the left wall carry the main net, the pace skiff's band is the one tight stripe)
      const px = keyed(xPace, u), pz = keyed(zPace, u), bS = 1 - sstep(0.76, 0.83, u);
      hero.setBoats(ox, oz, aS, px, pz, bS, -1);
      U.uBoatB.value.z = -(0.42 + 0.58 * sstep(0.13, 0.2, u));   // in the canal the pace skiff's wake is a narrow stripe: it crosses the soffit and climbs the quay piers one after another
      hero.setEye(sstep(0.68, 0.82, u));
      place(boats, 0, px, 0.02, pz, Math.atan2(6.5, paceXatZ(pz - 3.25) - paceXatZ(pz + 3.25)), 1);
      // the rare big wake: a white launch comes down the hall and crosses the slab as we skim over it
      const zL = -70 + (u - 0.5) / 0.12 * 110, lOn = rare ? sstep(0.4, 0.44, u) * (1 - sstep(0.78, 0.84, u)) : 0;
      place(boats, 1, slabX - 0.5, 0.06, Math.max(-112, Math.min(112, zL)), -Math.PI / 2, rare ? 2.15 * Math.max(lOn, 0.001) : 0.001);
      boats.instanceMatrix.needsUpdate = true;
      if (rare) U.uWall.value.set(zL - 10, 13, sstep(0.47, 0.51, u) * (1 - sstep(0.64, 0.76, u)), 0);
      else {
        // the whole fan tightens as the pace skiff's hull crosses the cloth's edge: a ring of worked net runs out from the slab over
        // the vaults, down the piers and along the hulls, by how far the skiff's bow is past the cloth's near edge
        const dIn = slabZ + U.uSlab.value.w + 3.25 - pz;
        U.uWall.value.set(0, 2.1, sstep(0, 2.5, dIn) * (1 - sstep(24, 36, dIn)), 5.5 + 1.5 * Math.max(dIn, 0));
      }
      // moorhen and chicks cross ahead of the prow
      const mt = Math.min(1, Math.max(0, (u - 0.17) / 0.14)), mx = -7.2 + 14.4 * mt, mzz = 88.7;
      place(hen, 0, mx, 0.0, mzz, 0, 1.5); hen.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 3; i++) place(chicks, i, mx - 0.75 - 0.62 * i - 0.1 * Math.sin(time * 1.3 + chPh[i]), 0.0, mzz + 0.28 * Math.sin(time * 1.1 + chPh[i] * 2.1 + mx), 0.25 * Math.sin(time * 1.4 + chPh[i]), 1.5);
      chicks.instanceMatrix.needsUpdate = true;
      // mullet roll in the slab; each roll knots the net above into a quick tight patch
      let best = 0, bi = 0;
      for (let i = 0; i < nMul; i++) {
        const m = mulList[i], r = (time / m.per + m.ph) % 1, a = Math.PI + 2 * Math.PI * sstep(0, 0.42, r), up = Math.sin(Math.PI * Math.min(1, r / 0.42));
        place(mullet, i, m.x, -0.52, m.z, m.yaw, 1.5, a);
        if (up > best) { best = up; bi = i; }
      }
      mullet.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < nFish; i++) {
        const f = fishList[i], th = time * f.w + f.ph, sn = Math.sin(th), cs = Math.cos(th);
        place(fish, i, f.cx + f.rx * sn, 0.02, f.cz + f.rz * 2 * sn * cs, Math.atan2(-f.rz * 2 * (cs * cs - sn * sn), f.rx * cs), 1.5);
      }
      fish.instanceMatrix.needsUpdate = true;
      if (rare && u > 0.4) { U.uBoatC.value.set(slabX - 0.5, zL, 2.2, lOn); U.uDirC.value.set(0, 1, 0, 0); }
      else if (u < 0.33) { U.uBoatC.value.set(mx, mzz, 0.42, sstep(0, 0.08, mt) * (1 - sstep(0.92, 1, mt))); U.uDirC.value.set(1, 0, 0, 0); }
      else { const m = mulList[bi]; U.uBoatC.value.set(m.x, m.z, 0.3, best * sstep(0.33, 0.37, u)); U.uDirC.value.set(Math.cos(m.yaw), -Math.sin(m.yaw), 0, 0); }
      // birds: every one has its own beat in the hall. Two families leave theirs to fly with us for a stretch, by where we are
      const mf = u * L, x5 = sstep(M_SINK - 24.5, M_SINK - 18, mf) * (1 - sstep(M_SINK + 18, M_SINK + 24.5, mf));   // (the five are crossing: 1)
      for (let i = 0; i < nAll; i++) {
        const b = birdList[i];
        if (b.perched) { E.set(0, b.yaw + 0.3 * Math.sin(time * 0.5 + b.ph), 1.0 + 0.08 * Math.sin(time * 3 + b.ph), 'YXZ'); Q.setFromEuler(E); P.set(b.px, 1.28, b.pz); S1.setScalar(b.s); M.compose(P, Q, S1); birds.setMatrixAt(i, M); continue; }
        const s = beatAt(b, time, OB);
        Z.set(-X.z, 0.45 * s, X.x).normalize(); Y.crossVectors(Z, X).normalize(); Z.crossVectors(X, Y);
        M.makeBasis(X, Y, Z); Q.setFromRotationMatrix(M); P.copy(OB);
        if (b.kind === 3) {
          // THE LEADING FLIGHT: bird 0 and the four to six dealt after the last bird, five to seven swallows of one make, each of
          // its own size as dealt (0.38 to 0.48, the hall's own swallow size: a wing reaches 0.59 m from its place at the most).
          // They leave their beats as we come up to them, lead us from 27.5 m before the hatch's middle (bird 0; the others up
          // to 6 m later, each by its own beat's place), under the hatch and on through the sink, and fall astern over the 12 m
          // past the place where the sink is over. Each is a body, kept off the lens BY ITS PLACE: its skin (its place and
          // the furthest its wings reach, 1.22 times its size) keeps 2.0 m from the eye and from the route's points within
          // 1.0 m of flying either side of the eye, at every clock and for every number its deal can give. Nothing here reads
          // the lens: the staging reads the metres flown; beat, slip, weave, yaw and roll read the world's clock from the bird's
          // own phase at its own rates.
          //   AHEAD    strung out along our own route: slot f of the flight 4.25 m and 4.5 m times f over the number of the
          //            others ahead of the eye, slipping 0.25 m either way at its own rate (4.0 to 9.0 m ahead of
          //            the eye: the string is 4.5 m long, so that wings 0.5 m long have room along it)
          //   ACROSS   right of our line in three lanes (1.3, 2.25 and 3.2 m, by the slot modulo three), drifting 0.15 m either
          //            way: two birds within two slots of each other are never in one lane, and two in one lane are three
          //            slots apart along the route (1.75 m and more). Two that are not neighbours keep their wings apart;
          //            the wing tips of two neighbours in next lanes (0.65 m apart across at the least) can cross for a moment
          //   OVER     0.5 to 1.15 m over our line by slot, against the brick and the net; while the five cross under them
          //            (from 18 m before the sink's first metre to 18 m past it, eased over 6.5 m either side) 1.1 to 1.35 m,
          //            0.9 m and more over the five's row; never higher than the beats' own clip under the vault
          //   TURNED   headed 0.45 to 0.95 left of the route's heading, banked 0.6 away from our line and rolling 0.61 either
          //            way about that by its own weave: a pale belly turned to us, now more, now edge-on
          //   JOINING  over 11 m of flying, the straight way from its beat (a figure of eight right of our line and over it)
          //   LEAVING  as bird 0 always left: it swings out to the right of our line, 2.1 m at the most (the sine of the way
          //            through), its weight falls as one less the cube of the way, and it drops back to its beat behind us
          const fl = sstep(M_LEVEL, M_LEVEL + 12, mf), on = sstep(b.mj, b.mj + 11, mf) * (1 - fl * fl * fl);
          if (on > 0.001) {
            const sl = Math.sin(time * b.ws + b.ph), th = time * b.wv + 2 * b.ph;
            routeAt(mf + 4.25 + 4.5 * b.f / nLead + 0.25 * sl);
            P.copy(RP).addScaledVector(RR, LR[b.f % 3] + 0.15 * Math.cos(th)).addScaledVector(RU, LU[b.f] + (LW[b.f] - LU[b.f]) * x5 + 0.08 * Math.sin(time * 2.3 + b.ph));
            routeAt(mf);
            bankBird(0.7 + 0.25 * Math.sin(time * 1.7 * b.ws + b.ph), 0.6, 0.61 * Math.sin(th));
            P.lerp(OB, 1 - on); Q.slerp(QB, on);
            P.addScaledVector(RR, 2.1 * Math.sin(Math.PI * fl));
            P.y = Math.min(P.y, 5.3 + Math.sqrt(Math.max(64 - P.x * P.x, 0)));
          }
        } else if (b.kind === 4) {
          // the flight of five: as the sink begins they leave their beat and cross our bow from right to left, one after another,
          // 4 to 7 m ahead of us on our own route; the middle one of the five is on our line where the sink begins, the others 2 and
          // 4 m of flying before and after it, and each crossing takes a bay and a half of flying
          // THE FIVE'S CROSSING is a law of the place. A bird is a body: its skin (its place and the furthest its wings reach,
          // 1.22 times its size) keeps 2.0 m from the eye and from the route's points within 1.0 m of flying either side of the
          // eye, at every clock and for every beat the deal can give (a beat's place is anywhere in x -5.5 to 6.5, y 8.5 to
          // 11.3, z 21 m before the sink's first metre to 17 m past it, and the route runs through that box). Nothing here
          // reads the lens: the staging reads the metres flown, the beat and the wobble read the world's clock.
          //   AHEAD    the staged place is on the route 1.0 + 2.1 m and the bird's own reach ahead of the eye, 0.65 m more for
          //            each next bird (3.66 to 6.58 m), so that dead ahead on our line it is clear of the route's 1.0 m
          //   ACROSS   2.73 to 6.11 m right of our line (1.3 times 2.1 m and 0.65 m more for each next bird) eased over to
          //            as far left, on our line at the same metre and at the same speed there as before; it waits right
          //            before its crossing and left after it, headed with us, and turns across only as it crosses
          //   JOINING  all five have left their beats for their places ahead and to the right between 35.7 and 24.5 m before
          //            the sink's first metre, the straight way: the whole of it lies ahead of the route's 1.0 m, and the
          //            vault is 0.9 m over the eye there, so nothing is lifted
          //   LEAVING  from 25.5 to 36.7 m past the sink's first metre, when the eye is past every beat: the bird pulls up
          //            3.6 m at the most (the vault's soffit is the limit) and goes back OVER our line to its beat behind
          //            us; the weight falls as one less the square of the way through, the lift is the sine of the way
          const k = i - 1, tc = 0.5 + (mf - M_SINK - 2 * (k - 2)) / H.bay, fl = sstep(M_SINK + 25.5, M_SINK + 36.7, mf), on = sstep(M_SINK - 35.7, M_SINK - 24.5, mf) * (1 - fl * fl);
          if (on > 0.001) {
            const dl = 2.1 + 0.65 * k, tk = Math.min(0.5 + Math.PI / 4, Math.max(0.5 - Math.PI / 4, tc));
            routeAt(mf + 3.1 + 1.22 * b.s + 0.65 * k);
            P.copy(RP).addScaledVector(RR, 1.3 * dl * Math.sin(1 - 2 * tk) + 0.05 * Math.sin(time * 1.9 + b.ph))
              .addScaledVector(RU, dl * (-0.05 + 0.2 * Math.sin(Math.PI * Math.min(1, Math.max(0, tk)))) - 0.12 * k + 0.05 * Math.sin(time * 2.3 + b.ph));
            routeAt(mf);
            // (the heading across is the crossing's; a waiting bird rolls about its bank, up to 0.61 either way: the sine of the
            // world's clock times the bird's dealt rate b.rw, from its dealt phase b.rp; in the middle of its crossing it has no roll)
            const cw = Math.cos(1 - 2 * tk);
            bankBird((1.0 + 0.12 * Math.sin(time * 1.1 + b.ph)) * cw, 0.7 + 0.15 * Math.sin(time * 0.8 + b.ph * 1.7), 0.61 * (1 - cw) * Math.sin(time * b.rw + b.rp));
            P.lerp(OB, 1 - on); Q.slerp(QB, on);
            P.y = Math.min(P.y + 3.6 * Math.sin(Math.PI * fl), 5.3 + Math.sqrt(Math.max(64 - P.x * P.x, 0)));
          }
        }
        else if (b.kind === 7) {
          // the pair inside the gate: as we come in they leave their beat and cross our bow from left to right, one after the other,
          // 5 and 6 m ahead of us on our own route, down to the water to drink at the middle of the crossing and up again; the
          // first is on our line half a bay inside the gate, and the crossing takes a bay and a quarter to a bay and a half of flying
          // THE PAIR'S CROSSING is a law of the place, in the five's shape. A bird is a body: its skin (its place and the furthest
          // its wings reach, 1.22 times its size) keeps 2.0 m from the eye and from the route's points within 1.0 m of flying
          // either side of the eye, at every clock and for every beat the deal can give (a beat's place is anywhere in x -6 to
          // 6, y 3.4 to 6.6, z from 6 m before the place half a bay inside the gate to 16 m past it, and the route runs 1.8 m
          // under that box). Nothing here reads the lens: the staging reads the metres flown, the beat and the wobble read
          // the world's clock.
          //   AHEAD    5 m and 6.2 m ahead of the eye on the route, as they were: on our line the bird is down at the water,
          //            1.2 m under our line, and clear of the route's 1.0 m by more than a metre
          //   ACROSS   6 m left of our line eased over to 6 m right (the sine of the way), on our line at the same metre and at
          //            the same speed there as before, the dip to the water as before; it turns across only as it crosses. It
          //            keeps to the centre aisle: it no longer comes in and goes out through the arcades
          //   JOINING  as before, between 1.4 and 0.7 of a bay of flying before its own metre, the straight way to its place on
          //            the left: its beat is still ahead of the route's 1.0 m
          //   LEAVING  from 13.3 to 24.5 m past the place half a bay inside the gate (both birds; the second has just come
          //            across), as the eye leaves the last of the beats behind: the bird pulls up 2.7 m at the most and goes
          //            back OVER our line to its beat behind us; the weight falls as one less the square of the way through,
          //            the lift is the sine of the way
          const k = i - 14, tc = 0.5 + (mf - M_DIP - 3.2 * k) / H.bay, fl = sstep(M_DIP + 13.3, M_DIP + 24.5, mf), on = sstep(-0.9, -0.2, tc) * (1 - fl * fl);
          if (on > 0.001) {
            const dist = 5 + 1.2 * k, ang = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, (tc - 0.5) * 0.4 * dist));
            routeAt(mf + dist);
            P.copy(RP).addScaledVector(RR, 6 * Math.sin(ang) + 0.05 * Math.sin(time * 1.9 + b.ph));
            P.y = 0.4 + 2.0 * (1 - Math.sin(Math.PI * Math.min(1, Math.max(0, tc)))) + 0.05 * Math.sin(time * 2.3 + b.ph);
            routeAt(mf);
            const cw = Math.cos(ang);       // (as the five: a roll about its bank while it waits, at its dealt rate b.rw from its dealt phase b.rp)
            bankBird((-1.0 - 0.12 * Math.sin(time * 1.1 + b.ph)) * cw, 0.7 + 0.15 * Math.sin(time * 0.8 + b.ph * 1.7), 0.61 * (1 - cw) * Math.sin(time * b.rw + b.rp));
            P.lerp(OB, 1 - on); Q.slerp(QB, on);
            P.y += 2.7 * Math.sin(Math.PI * fl);
          }
        }
        M.compose(P, Q, S1.setScalar(b.s)); birds.setMatrixAt(i, M);
      }
      birds.instanceMatrix.needsUpdate = true;
      hero.update(dt, time, camera);
    }

    await ctx.yield();
    return {
      scene, path, duration: 39, pace,
      camera: { fov: 62, near: 0.12, far: 2600, lookAhead: 16, sway: 0.3, bank: 0.3 },
      // the gaze travels (every one of these is a function of u alone): right to the quay piers where the pace skiff's band climbs,
      // up to the soffit, down to the moorhens, down to our own skiff as we leave it, to the slab for the image, down to the
      // right past the hatch, then one look from the sink's first metre to the last: down to our skiff, up into the eye
      pois: [
        { at: (t, u) => gaze(u, 0.12, 0.04), from: -0.03, to: 0.045, weight: 0.85, fade: 0.3 },   // the entry: the bridge ahead as a low arch, both arcaded walls, the gate under it
        { at: (t, u) => gaze(u, 0, 0.16), from: 0.046, to: 0.076, weight: 0.6, fade: 0.3 },
        { at: (t, u) => gaze(u, 0, -0.14), from: 0.078, to: 0.12, weight: 0.6, fade: 0.3 },   // coming out from under the bridge the gaze drops to the water gate under the bridge's far lip
        { at: (t, u) => gaze(u, 0, 0.3), from: 0.112, to: 0.228, weight: 0.75, fade: 0.5 },   // through the gate the gaze lifts: the hall opens whole, three vaults and the fan over everything
        // one look at the slab from the hall's second bay until the hatch goes over: far ahead at first, then the image (slab below,
        // hatch above, held)
        { at: [slabX, 0.5, slabZ], from: 0.2, to: 0.585, weight: 0.45, fade: 0.1 },
        { at: (t, u) => { path.pointAt(Math.min(1, Math.max(0, u)), PG); const za = PG.z - 9.5, k = sstep(-3, 3, za - 86.5); return PG.set(3.4 + 0.45 * (-7.2 + 14.4 * Math.min(1, Math.max(0, (u - 0.17) / 0.14))), 0.4, 86.5 * k + za * (1 - k)); }, from: 0.215, to: 0.305, weight: 0.8, fade: 0.3 },   // (the point looked at keeps 9.5 m ahead of the eye once we reach it: the gaze never swings abeam)   // down and to the right: the moorhens crossing left of centre, the pace skiff and the right-hand plinths where the wakes' bands climb
        { at: (t, u) => PG.set(0, 0.7, rideZ(u) + 1), from: 0.315, to: 0.4, weight: 0.35, fade: 0.3 },
        { at: (t, u) => gaze(u, 0.34, -0.5), from: 0.585, to: 0.66, weight: 0.7, fade: 0.3 },   // past the hatch the gaze dips to the right: the vault still streaks overhead, the green aisle, the moored pairs and the cloth's end below
        // one look for the whole way in, taken up over the first metres of the sink and held to the last metre: it goes down to
        // our own skiff leading underneath and lifts from it to the eye's centre over the length of the sink, where it stays
        { at: (t, u) => {
          const uu = Math.min(1, Math.max(0, u)), k = sstep(M_SINK, M_LEVEL, uu * L);
          path.pointAt(uu, PG);
          LA.set(-PG.x, 0.7 - PG.y, rideZ(uu) - PG.z).normalize(); LB.set(-PG.x, U.uEye.value.y - PG.y, H.z0 - PG.z).normalize();
          LA.lerp(LB, k).normalize();
          return PG.addScaledVector(LA, 10);
        }, from: M_SINK / L, to: 1, weight: 0.8, fade: 0.16 },
      ],
      // a bare opening: nothing glows here, so the engine draws no halo, no light in the rim, no shimmer; the frame of the way out
      // is the world's own drawing, the net hauled taut onto a rim of gold cord set with white knots (the hero's end wall)
      portal: { shape: 'circle', radius: 7.2, color: pal[4], veil: pal[5], glow: 0, halo: 0, frame: 0, revealDistance: 150, blendDistance: 25 },   // the eye is a cut-out of outdoors: until the next world shows in it, it is the blank milk white   // (wider than the eye, 6.6, so no gap shows beside the rim from any seat)
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
