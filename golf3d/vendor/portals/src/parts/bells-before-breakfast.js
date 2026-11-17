// Bells Before Breakfast, THE OUTSIDE: a dawn park and a great house of pale honey stone being woken from the bottom up.
// Everything south of the front door's inner face (z -12.5) and the sky: the park, the lake, the cedar, the forecourt
// and its knot gardens, the whole house (its block, corner turrets, great tower, pierced parapets and pinnacles), the
// standing order of lit windows and smoking stacks, the entrance arch and its passage.
// World axes: x east, y up, z south; the south front's wall plane is z 0; lawn y 0; state floor y 3.
// Clear air is kept by place: every rule below reads the route's line (the brief's points), never the lens.
import * as THREE from 'three';
import { makeSky } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';

// the route's line through this part (the brief's places); the first point is 60 m behind the entry on its level axis
const ROUTE = [[-83.3, 26, 164.2], [-48.9, 26, 115.0], [-31.7, 26, 90.5], [-14.5, 26, 65.9], [-8.3, 21.9, 55.4], [-3.7, 17.7, 44.1],
  [-0.9, 13.6, 32.2], [0, 9.4, 20], [0, 9.3, 2], [0, 9.6, -11], [0, 10, -30]];
const ENTRY = [-48.9, 26, 115.0];
const WALL_H = 33, PARAPET = 2.4, LAKE_Y = -0.9;
// THE HOUSE'S PLAN, in metres: one block, its walls x -48 to 48 and z 0 (the south front) to -88; at each corner a square
// turret 14 m a side standing 2.5 m proud of both its walls; the middle bay of the front (x -11 to 11) and of each flank
// (22 m about z -44) 2 m proud; the great tower 26 m square over the middle, its south face at z -6
const HX = 48, HN = -88, TUR = 14, PROUD = 2.5, BAY = 2, BAYW = 11, FLANK_MID = -44;
// a turret's inner and outer faces (36.5 and 50.5 from the axis)
const TXI = HX + PROUD - TUR, TXO = HX + PROUD;
const TOWER = { hx: 13, z0: -6, z1: -32, y1: 46, y2: 58 };
// heights: the two string courses, a turret's wall head and its pinnacles' tips, how far a pinnacle stands over its
// parapet, the crown and the tip of the tower's corner turrets, the flagstaff's head
const STRING = [14.3, 23.9], TUR_H = 43, TUR_PIN = 50, PIN = 5, CROWN_Y = 62, TOP_PIN = 66, STAFF_Y = 74;
// the entrance arch in the middle bay's face: its clear half width, its outer order's, its springing (crown at y 16)
const ARCH = { a: 4.5, a0: 5.2, ys: 11.5 };
// the cedar's place on the east lawn (the plan's x; its z is found on firm ground, at or north of the plan's z)
const CEDAR_X = 96, CEDAR_Z = 2;
const LAKE = { x: 150, z: 115, rx: 82, rz: 106 };
// where the deer graze: by the lake's west shore, 50 m and more from the route's line
const HERD = [45, 64];
// the park's wind, the same on every seed: it goes west and a little south (the leaves, the flag; the smoke and the
// mists carry the same bearing in their own figures)
const WIND = [-1, 0.25];
// storeys: [sill, head] of each rank of windows, basement first
const STOREY = [[0.55, 2.45], [5.2, 13.2], [15.6, 22.6], [25.2, 31.0]];

const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const hexOf = (c) => '#' + c.getHexString();

// ---------------------------------------------------------------- a small mesh builder: position, normal, colour, material id, wall coordinate
function makeBuilder() {
  const P = [], N = [], C = [], M = [], U = [];
  let col = [1, 1, 1], mat = 0, ua = 50, ub = 50, ul = 100;
  const b = {
    count: 0,
    set(m, hex = '#ffffff', k = 1) { mat = m; col = lin(hex, k); return b; },
    tint(k) { col = [col[0] * k, col[1] * k, col[2] * k]; return b; },
    // wall metres of the next faces: the first corner of a triangle, its other corners, the wall's length
    uv(a, c, l) { ua = a; ub = c; ul = l; return b; },
    // triangle whose face normal is made to agree with (nx, ny, nz)
    tri(a, c, d, nx, ny, nz) {
      const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
      const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
      let q = c, r = d;
      if (nx !== undefined && x * nx + y * ny + z * nz < 0) { q = d; r = c; x = -x; y = -y; z = -z; }
      P.push(a[0], a[1], a[2], q[0], q[1], q[2], r[0], r[1], r[2]);
      for (let i = 0; i < 3; i++) { N.push(x, y, z); C.push(col[0], col[1], col[2]); M.push(mat); }
      U.push(ua, ul, ub, ul, ub, ul);
      b.count++;
    },
    quad(a, c, d, e, nx, ny, nz) { b.tri(a, c, d, nx, ny, nz); b.tri(a, d, e, nx, ny, nz); },
    // an upright wall from A to B (left to right as seen from outside), with its along-wall metres for quoins
    wall(ax, az, bx, bz, y0, y1, quoin = true) {
      const L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L, nx = -tz, nz = tx;
      const p = P.length / 3;
      P.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
      for (let i = 0; i < 6; i++) { N.push(nx, 0, nz); C.push(col[0], col[1], col[2]); M.push(mat); }
      if (quoin) U.push(0, L, L, L, L, L, 0, L, L, L, 0, L); else for (let i = 0; i < 6; i++) U.push(mat === 7 ? y0 : 50, mat === 7 ? y1 : 100);
      b.count += 2; return p;
    },
    box(x0, y0, z0, x1, y1, z1, faces = 'xXyYzZ') {
      if (faces.includes('X')) b.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1, 0, 0);
      if (faces.includes('x')) b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], -1, 0, 0);
      if (faces.includes('Y')) b.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 0, 1, 0);
      if (faces.includes('y')) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0, -1, 0);
      if (faces.includes('Z')) b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1);
      if (faces.includes('z')) b.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1);
    },
    // an upright prism of n sides about (cx, cz) from y0 to y1, radius r0 at the foot and r1 at the head, turned by a0..a1
    shaft(cx, cz, y0, y1, r0, r1, n = 8, a0 = 0, a1 = 0, cap = true) {
      for (let i = 0; i < n; i++) {
        const p0 = (i / n) * 6.2832, p1 = ((i + 1) / n) * 6.2832, pm = (p0 + p1) / 2;
        const A = [cx + Math.cos(p0 + a0) * r0, y0, cz + Math.sin(p0 + a0) * r0], B = [cx + Math.cos(p1 + a0) * r0, y0, cz + Math.sin(p1 + a0) * r0];
        const D = [cx + Math.cos(p0 + a1) * r1, y1, cz + Math.sin(p0 + a1) * r1], E = [cx + Math.cos(p1 + a1) * r1, y1, cz + Math.sin(p1 + a1) * r1];
        b.quad(A, B, E, D, Math.cos(pm + (a0 + a1) / 2), 0, Math.sin(pm + (a0 + a1) / 2));
        if (cap) b.tri([cx, y1, cz], D, E, 0, 1, 0);
      }
    },
    // n triangles from a ring of radius r at y0 to a point at y1
    cone(cx, cz, y0, y1, r, n = 4, a = 0) {
      for (let i = 0; i < n; i++) {
        const p0 = (i / n) * 6.2832 + a, p1 = ((i + 1) / n) * 6.2832 + a, pm = (p0 + p1) / 2;
        b.tri([cx + Math.cos(p0) * r, y0, cz + Math.sin(p0) * r], [cx + Math.cos(p1) * r, y0, cz + Math.sin(p1) * r], [cx, y1, cz], Math.cos(pm), y1 > y0 ? 0.3 : -0.3, Math.sin(pm));
      }
    },
    // the outward five faces of an eight-sided shaft that stands half in a wall whose outward normal is (nx, nz)
    halfShaft(cx, cz, y0, y1, r, nx, nz) {
      const a0 = Math.atan2(nz, nx), keep = col;
      for (let i = -2; i <= 2; i++) {
        const p0 = a0 + (i - 0.5) * 0.7854, p1 = a0 + (i + 0.5) * 0.7854, pm = a0 + i * 0.7854;
        const A = [cx + Math.cos(p0) * r, y0, cz + Math.sin(p0) * r], B = [cx + Math.cos(p1) * r, y0, cz + Math.sin(p1) * r];
        // the face that looks straight out is the lightest; the two that turn back to the wall sit in its shade
        const k = i === 0 ? 1.08 : Math.abs(i) === 1 ? 0.96 : 0.82;
        col = [keep[0] * k, keep[1] * k, keep[2] * k];
        b.quad(A, B, [B[0], y1, B[2]], [A[0], y1, A[2]], Math.cos(pm), 0, Math.sin(pm));
      }
      col = keep;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 1));
      g.setAttribute('aUL', new THREE.Float32BufferAttribute(U, 2));
      return g;
    },
  };
  return b;
}

// the house's one building stone (pale honey-cream in plain light); the forecourt's older, greyer stone; lead, oak, iron
const HONEY = '#d8c49c', STONE = '#b8ac94', LEAD = '#9aa6b4', OAK = '#8a5a34', IRON = '#2a2a2e';
// material ids of the house shader
const M_ASHLAR = 0, M_STONE = 1, M_CARVE = 2, M_LEAD = 3, M_OAK = 4, M_IRON = 5, M_HEDGE = 6, M_BALUS = 7, M_LAMP = 8;

// THE ENTRANCE ARCH in the middle bay's face (the plane z zf, facing south): a round arch of two plain orders, each with
// its own soffit and jambs, a plain hood mould round it on the face, and the wall about it up to y1
function archFront(b, x0, x1, zf, y1) {
  const A0 = ARCH.a0, A1 = ARCH.a, YS = ARCH.ys, zs = zf - 0.6, n = 14, top = YS + A0;
  b.set(M_ASHLAR, HONEY);
  b.wall(x0, zf, -A0, zf, 0, y1, false); b.wall(A0, zf, x1, zf, 0, y1, false); b.wall(-A0, zf, A0, zf, top, y1, false);
  const arc = (a, t) => [a * Math.cos(t), YS + a * Math.sin(t)];
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * (1 - i / n), t1 = Math.PI * (1 - (i + 1) / n), tm = (t0 + t1) / 2, rx = -Math.cos(tm), ry = -Math.sin(tm);
    const p0 = arc(A0, t0), p1 = arc(A0, t1), q0 = arc(A1, t0), q1 = arc(A1, t1), h0 = arc(A0 + 0.55, t0), h1 = arc(A0 + 0.55, t1);
    // the spandrel over the outer order, the outer order's soffit, the step between the orders, the inner order's soffit
    b.set(M_ASHLAR, HONEY).quad([p0[0], p0[1], zf], [p1[0], p1[1], zf], [p1[0], top, zf], [p0[0], top, zf], 0, 0, 1);
    b.set(M_ASHLAR, HONEY, 0.94).quad([p0[0], p0[1], zf], [p1[0], p1[1], zf], [p1[0], p1[1], zs], [p0[0], p0[1], zs], rx, ry, 0);
    b.set(M_ASHLAR, HONEY, 1.02).quad([q0[0], q0[1], zs], [q1[0], q1[1], zs], [p1[0], p1[1], zs], [p0[0], p0[1], zs], 0, 0, 1);
    b.set(M_ASHLAR, HONEY, 0.92).quad([q0[0], q0[1], zs], [q1[0], q1[1], zs], [q1[0], q1[1], 0], [q0[0], q0[1], 0], rx, ry, 0);
    // the hood mould: its face, its outer edge, its inner edge
    b.set(M_ASHLAR, HONEY, 1.1).quad([p0[0], p0[1], zf + 0.22], [p1[0], p1[1], zf + 0.22], [h1[0], h1[1], zf + 0.22], [h0[0], h0[1], zf + 0.22], 0, 0, 1);
    b.quad([h0[0], h0[1], zf + 0.22], [h1[0], h1[1], zf + 0.22], [h1[0], h1[1], zf], [h0[0], h0[1], zf], -rx, -ry, 0);
    b.set(M_ASHLAR, HONEY, 0.9).quad([p0[0], p0[1], zf + 0.22], [p1[0], p1[1], zf + 0.22], [p1[0], p1[1], zf], [p0[0], p0[1], zf], rx, ry, 0);
  }
  for (const sg of [-1, 1]) {
    // the jambs of both orders and the step between them; the hood's impost block at the springing
    b.set(M_ASHLAR, HONEY, 0.94).quad([sg * A0, 0, zf], [sg * A0, YS, zf], [sg * A0, YS, zs], [sg * A0, 0, zs], -sg, 0, 0);
    b.set(M_ASHLAR, HONEY, 1.02).quad([sg * A1, 0, zs], [sg * A0, 0, zs], [sg * A0, YS, zs], [sg * A1, YS, zs], 0, 0, 1);
    b.set(M_ASHLAR, HONEY, 0.92).quad([sg * A1, 0, zs], [sg * A1, YS, zs], [sg * A1, YS, 0], [sg * A1, 0, 0], -sg, 0, 0);
    b.set(M_ASHLAR, HONEY, 1.1).box(sg > 0 ? A0 : -A0 - 0.8, YS - 0.6, zf, sg > 0 ? A0 + 0.8 : -A0, YS, zf + 0.3, 'xXZyY');
  }
}

// a pinnacle on its foot at y, its tip at top: a square base block, a slender six-sided shaft, a small obelisk cap, a ball
function pinnacle(b, x, z, y, top) {
  const h = top - y;
  b.set(M_ASHLAR, HONEY, 1.05).shaft(x, z, y, y + 0.4, 0.7, 0.7, 4, 0.785, 0.785);
  b.set(M_ASHLAR, HONEY, 1.0).shaft(x, z, y + 0.4, y + h * 0.54, 0.4, 0.35, 6, 0, 0, false);
  b.set(M_ASHLAR, HONEY, 1.03).cone(x, z, y + h * 0.54, top - 0.66, 0.52, 4, 0.785);
  b.set(M_ASHLAR, HONEY, 1.08).cone(x, z, top - 0.4, top - 0.82, 0.4, 4, 0); b.cone(x, z, top - 0.4, top, 0.4, 4, 0);
}

// ---------------------------------------------------------------- the house: one block of pale honey stone, a turret at each corner, the great tower over the middle
function buildHouse(b, W) {
  // ranks: the straight walls a lamp may travel behind; shafts: [x, z, the wall's outward normal, kind]; par: the parapets' runs
  const ranks = [], shafts = [], par = []; let sRun = 0;
  const ash = (k = 1) => b.set(M_ASHLAR, HONEY, k);
  // every piece of the house's walls is laid here and kept, with its foot and head, for the courses
  const walls = [], wl = (ax, az, bx, bz, y0, y1) => { b.wall(ax, az, bx, bz, y0, y1, false); walls.push([ax, az, bx, bz, y0, y1]); };
  // a window's make: lights across times ten and rows up (two transoms make three rows); 0 is the basement's own
  const make = (st, lights = 3) => (st === 0 ? 0 : lights * 10 + (st === 3 ? 2 : 3));
  // ONE STRAIGHT STRETCH OF WALL in n bays: a window to a bay in each rank, a slim shaft between bays, the parapet over it
  const face = (ax, az, bx, bz, n, o = {}) => {
    const L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L, s0 = sRun, pitch = L / n;
    ash(); wl(ax, az, bx, bz, 0, WALL_H);
    sRun += L; par.push([ax, az, bx, bz, WALL_H, n]);
    for (let i = 0; i < n; i++) {
      const c = (i + 0.5) * pitch, ww = Math.min(pitch * 0.68, 4.6);
      if (!o.plain) for (let st = 0; st < 4; st++) {
        const w = st === 0 ? ww * 1.1 : ww;
        W.push({ x: ax + tx * (c - w / 2), z: az + tz * (c - w / 2), tx, tz, w, y0: STOREY[st][0], y1: STOREY[st][1], st, s: s0 + c, make: make(st) });
      }
      if (i < n - 1) shafts.push([ax + tx * (i + 1) * pitch, az + tz * (i + 1) * pitch, -tz, tx, o.plain ? 0 : 1]);
    }
    if (!o.plain) ranks.push({ s0: s0 + pitch * 0.5, s1: s0 + L - pitch * 0.5, walked: o.walked ?? 1 });
  };
  // A FLANK: three bays, its middle bay of three 2 m proud, three bays; laid left to right as one stands outside it
  const flank = (sx, walked) => {
    const x = sx * HX, xb = sx * (HX + BAY), za = PROUD - TUR, zb = FLANK_MID + BAYW, zc = FLANK_MID - BAYW, zd = HN + TUR - PROUD;
    const run = sx > 0 ? [[za, zb], [zb, zc], [zc, zd]] : [[zd, zc], [zc, zb], [zb, za]];
    face(x, run[0][0], x, run[0][1], 3, { walked });
    ash(0.97); wl(x, run[1][0], xb, run[1][0], 0, WALL_H); par.push([x, run[1][0], xb, run[1][0], WALL_H]);
    shafts.push([xb, run[1][0], 0, 0, 2]);
    face(xb, run[1][0], xb, run[1][1], 3, { walked });
    shafts.push([xb, run[1][1], 0, 0, 2]);
    ash(0.97); wl(xb, run[1][1], x, run[1][1], 0, WALL_H); par.push([xb, run[1][1], x, run[1][1], WALL_H]);
    face(x, run[2][0], x, run[2][1], 3, { walked });
  };
  // THE WEST FLANK, then THE SOUTH FRONT west to east (four bays, the middle bay with the arch, four bays), THE EAST FLANK
  // (its windows keep the standing order; the travelling lamps walk the west flank and the front only), the plain NORTH
  // SIDE (no window, no shaft: its pinnacles alone)
  flank(-1, 1);
  face(-TXI, 0, -BAYW, 0, 4);
  const sMid = sRun; sRun += 2 * BAYW;
  ash(0.97); wl(-BAYW, 0, -BAYW, BAY, 0, WALL_H); wl(BAYW, BAY, BAYW, 0, 0, WALL_H);
  archFront(b, -BAYW, BAYW, BAY, WALL_H);
  par.push([-BAYW, 0, -BAYW, BAY, WALL_H], [-BAYW, BAY, BAYW, BAY, WALL_H], [BAYW, BAY, BAYW, 0, WALL_H]);
  for (const sx of [-1, 1]) {
    // a shaft at the bay's corner and one beside the arch's hood; between them a window of two lights in each rank
    shafts.push([sx * BAYW, BAY, 0, 0, 2], [sx * 6.4, BAY, 0, 1, 1]);
    for (let st = 0; st < 4; st++) W.push({ x: sx * 8.7 - 1.45, z: BAY, tx: 1, tz: 0, w: 2.9, y0: STOREY[st][0], y1: STOREY[st][1], st, s: sMid + BAYW + sx * 8.7, make: make(st, 2) });
  }
  // over the arch one great window of five lights on the first floor (over the carved panel) and on the top floor
  W.push({ x: -4.5, z: BAY, tx: 1, tz: 0, w: 9, y0: 19.1, y1: STOREY[2][1], st: 2, s: sMid + BAYW, make: 51, over: 1 });
  W.push({ x: -4.5, z: BAY, tx: 1, tz: 0, w: 9, y0: STOREY[3][0], y1: STOREY[3][1], st: 3, s: sMid + BAYW, make: 52 });
  ranks.push({ s0: sMid + 2.3, s1: sMid + 2 * BAYW - 2.3, walked: 1 });
  // a small panel of carved strapwork between the arch's hood and the great window (rings and a lozenge: no arms, no
  // letter, no figure), in a plain raised surround
  ash(1.08); b.box(-2.7, 17.4, BAY, 2.7, 18.8, BAY + 0.1, 'xXZyY');
  b.set(M_CARVE, HONEY, 1.04).quad([-2.5, 17.55, BAY + 0.13], [2.5, 17.55, BAY + 0.13], [2.5, 18.65, BAY + 0.13], [-2.5, 18.65, BAY + 0.13], 0, 0, 1);
  face(BAYW, 0, TXI, 0, 4);
  flank(1, 0);
  face(TXI, HN, -TXI, HN, 10, { plain: 1 });

  // THE CORNER TURRETS: 14 m square, one storey taller than the block. A window in each rank on the two outer faces; in
  // the upper storey a pair of round-headed lights to every face. A shaft at each corner ends in a taller pinnacle.
  for (const sx of [-1, 1]) for (const sz of [1, -1]) {
    const x1 = sx * TXO, x0 = sx * TXI, z1 = sz > 0 ? PROUD : HN - PROUD, z0 = sz > 0 ? PROUD - TUR : HN - PROUD + TUR;
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1);
    // its four faces as seen from outside, left to right: south, east, north, west; the outer two stand full height
    for (const [ax, az, bx, bz, outer] of [[xa, zb, xb, zb, sz > 0], [xb, zb, xb, za, sx > 0], [xb, za, xa, za, sz < 0], [xa, za, xa, zb, sx < 0]]) {
      const tx = (bx - ax) / TUR, tz = (bz - az) / TUR, c = TUR / 2;
      ash();
      if (outer) wl(ax, az, bx, bz, 0, TUR_H);
      else {
        // an inner face shows whole above the block's roof; below it only the 2.5 m that stand proud of the block's wall
        wl(ax, az, bx, bz, WALL_H, TUR_H);
        if (tx !== 0 ? ax === x1 : az === z1) wl(ax, az, ax + tx * PROUD, az + tz * PROUD, 0, WALL_H);
        else wl(bx - tx * PROUD, bz - tz * PROUD, bx, bz, 0, WALL_H);
      }
      if (outer) for (let st = 0; st < 4; st++) { const w = st === 0 ? 5.0 : 4.6; W.push({ x: ax + tx * (c - w / 2), z: az + tz * (c - w / 2), tx, tz, w, y0: STOREY[st][0], y1: STOREY[st][1], st, s: -1, make: make(st) }); }
      W.push({ x: ax + tx * (c - 2.2), z: az + tz * (c - 2.2), tx, tz, w: 4.4, y0: 36.6, y1: 41.6, st: 3, s: -1, make: 121, dark: 1 });
      par.push([ax, az, bx, bz, TUR_H]);
    }
    b.set(M_LEAD, LEAD).quad([xa, TUR_H, zb], [xb, TUR_H, zb], [xb, TUR_H, za], [xa, TUR_H, za], 0, 1, 0);
    // the corner shafts: full height where the corner stands clear of the block, from the roof up at the corner within it
    for (const cx of [x0, x1]) for (const cz of [z0, z1]) shafts.push([cx, cz, 0, 0, cx === x0 && cz === z0 ? 4 : 3]);
  }

  // THE GREAT TOWER over the middle of the house: two stages clear of the roofs, a string course between; three tall
  // narrow windows to a face in each stage (mullioned below, round-headed above), between the corner turrets
  const T = TOWER, crowns = [];
  for (const [ax, az, bx, bz] of [[-T.hx, T.z0, T.hx, T.z0], [T.hx, T.z0, T.hx, T.z1], [T.hx, T.z1, -T.hx, T.z1], [-T.hx, T.z1, -T.hx, T.z0]]) {
    const tx = (bx - ax) / (2 * T.hx), tz = (bz - az) / (2 * T.hx);
    ash(); wl(ax, az, bx, bz, WALL_H, T.y1); wl(ax, az, bx, bz, T.y1, T.y2);
    for (const [y0, y1, mk] of [[36.4, 44.2, 23], [48.4, 56.4, 223]]) for (const c of [6.2, 13, 19.8]) W.push({ x: ax + tx * (c - 1.4), z: az + tz * (c - 1.4), tx, tz, w: 2.8, y0, y1, st: 3, s: -1, make: mk, dark: 1 });
    par.push([ax + tx * 2.3, az + tz * 2.3, bx - tx * 2.3, bz - tz * 2.3, T.y2]);
  }
  b.set(M_LEAD, LEAD).quad([-T.hx, T.y2, T.z0], [T.hx, T.y2, T.z0], [T.hx, T.y2, T.z1], [-T.hx, T.y2, T.z1], 0, 1, 0);
  // an eight-sided turret clasps each corner from the roof up and rises past the tower's parapet to a small pierced
  // crown (y 62) with a spirelet and a ball within it (tip y 66); a band on it at each of the tower's two heads
  for (const cx of [-T.hx, T.hx]) for (const cz of [T.z0, T.z1]) {
    ash(1.02); b.shaft(cx, cz, WALL_H, CROWN_Y, 2.3, 2.3, 8, 0.3927, 0.3927, true);
    ash(1.08); for (const y of [T.y1, T.y2]) b.shaft(cx, cz, y - 0.3, y + 0.3, 2.55, 2.55, 8, 0.3927, 0.3927, true);
    ash(); b.cone(cx, cz, CROWN_Y, TOP_PIN - 0.7, 1.5, 8, 0.3927);
    ash(1.08); b.cone(cx, cz, TOP_PIN - 0.45, TOP_PIN - 0.9, 0.45, 4, 0); b.cone(cx, cz, TOP_PIN - 0.45, TOP_PIN, 0.45, 4, 0);
    crowns.push([cx, cz]);
  }
  // LOW LEAD FLATS behind the parapets: the block's and the three middle bays'
  b.set(M_LEAD, LEAD).quad([-HX, WALL_H, 0], [HX, WALL_H, 0], [HX, WALL_H, HN], [-HX, WALL_H, HN], 0, 1, 0);
  b.quad([-BAYW, WALL_H, BAY], [BAYW, WALL_H, BAY], [BAYW, WALL_H, 0], [-BAYW, WALL_H, 0], 0, 1, 0);
  for (const sx of [-1, 1]) b.quad([sx * HX, WALL_H, FLANK_MID + BAYW], [sx * (HX + BAY), WALL_H, FLANK_MID + BAYW], [sx * (HX + BAY), WALL_H, FLANK_MID - BAYW], [sx * HX, WALL_H, FLANK_MID - BAYW], 0, 1, 0);

  // THE SHAFTS AND THE FRINGE OF PINNACLES: every shaft runs from the plinth through the parapet and carries a pinnacle
  // 5 m over it; a turret's corner shafts carry theirs to 50 m. Kinds: 0 a pinnacle on its pier alone (the north side),
  // 1 half a shaft on a wall, 2 a whole shaft at a bay's corner, 3 a turret's corner shaft, 4 the same from the roof up.
  for (const [x, z, nx, nz, kind] of shafts) {
    const head = (kind >= 3 ? TUR_H : WALL_H) + PARAPET;
    ash(1.03);
    if (kind === 0) b.halfShaft(x, z, WALL_H, head, 0.45, nx, nz);
    else if (kind === 1) b.halfShaft(x, z, 0, head, 0.45, nx, nz);
    else b.shaft(x, z, kind === 4 ? WALL_H : 0, head, kind === 2 ? 0.5 : 0.55, kind === 2 ? 0.5 : 0.55, 8, 0.3927, 0.3927, false);
    pinnacle(b, x, z, head, kind >= 3 ? TUR_PIN : head + PIN);
  }

  // SIX PLAIN STONE STACKS, set back from every front, their heads 5 m over the parapet line: two over the kitchens to
  // the west, two behind the tower's back, two to the east
  const stacks = [], stackTop = WALL_H + PARAPET + 5;
  for (const [cx, cz] of [[-34, -26], [-34, -50], [-12, -58], [12, -58], [34, -26], [34, -50]]) {
    ash(0.98); b.box(cx - 1.5, WALL_H, cz - 1.0, cx + 1.5, stackTop - 0.5, cz + 1.0, 'xXzZ');
    ash(1.07); b.box(cx - 1.75, stackTop - 0.5, cz - 1.25, cx + 1.75, stackTop, cz + 1.25, 'xXzZYy');
    stacks.push({ x: cx, z: cz, top: [cx, stackTop, cz] });
  }
  // the flagstaff on the tower's middle, pale painted wood, a ball at its head
  const staff = [0, (T.z0 + T.z1) / 2];
  b.set(M_IRON, '#cfc8b8').shaft(staff[0], staff[1], T.y2, STAFF_Y, 0.26, 0.18, 6, 0, 0, false);
  b.cone(staff[0], staff[1], STAFF_Y + 0.05, STAFF_Y - 0.3, 0.3, 4); b.cone(staff[0], staff[1], STAFF_Y + 0.05, STAFF_Y + 0.4, 0.3, 4);
  // THE COURSES, on every piece of wall: the two moulded string courses, a cornice under the wall's own head; on a
  // turret the block's cornice and its parapet's head carried round as bands. Each stands proud: a face, a top, a soffit.
  const band = (ax, az, bx, bz, y0, y1, pj) => {
    const L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L, nz = (bx - ax) / L, ox = nx * pj, oz = nz * pj;
    ash(1.06); b.quad([ax + ox, y0, az + oz], [bx + ox, y0, bz + oz], [bx + ox, y1, bz + oz], [ax + ox, y1, az + oz], nx, 0, nz);
    ash(1.12); b.quad([ax, y1, az], [bx, y1, bz], [bx + ox, y1, bz + oz], [ax + ox, y1, az + oz], 0, 1, 0);
    ash(0.86); b.quad([ax, y0, az], [bx, y0, bz], [bx + ox, y0, bz + oz], [ax + ox, y0, az + oz], 0, -1, 0);
  };
  walls.push([-BAYW, BAY, -6.4, BAY, 0, WALL_H], [6.4, BAY, BAYW, BAY, 0, WALL_H], [-6.4, BAY, 6.4, BAY, 17.4, WALL_H]);
  for (const [ax, az, bx, bz, y0, y1] of walls) {
    band(ax, az, bx, bz, y1 - 0.6, y1, 0.35);
    for (const ys of STRING) if (y0 < ys - 0.3 && y1 > ys + 0.3) band(ax, az, bx, bz, ys - 0.3, ys + 0.3, 0.3);
    if (y0 < WALL_H && y1 > WALL_H + 1) band(ax, az, bx, bz, WALL_H - 0.6, WALL_H, 0.35);
    if (y1 === TUR_H) band(ax, az, bx, bz, WALL_H + PARAPET - 0.4, WALL_H + PARAPET + 0.1, 0.25);
  }
  // modelled depth on every south-facing window of the three upper ranks: a sill and a thin label mould over its flat head
  for (const w of W) {
    if (w.tx !== 1 || w.st < 1 || w.dark) continue;
    ash(1.08); b.box(w.x - 0.16, w.y0 - 0.28, w.z, w.x + w.w + 0.16, w.y0 + 0.02, w.z + 0.36, 'xXZyY');
    ash(1.04); b.box(w.x - 0.24, w.y1 + 0.02, w.z, w.x + w.w + 0.24, w.y1 + 0.2, w.z + 0.26, 'xXZyY');
  }

  // THE ENTRANCE PASSAGE, from the arch (its inner order ends in the plane z 0) to the front door's wall (z -10): 10 m
  // wide, its walls 12 m to the springing (y 15, the door's own head), a low stone vault of 1 m rise over them, the
  // crown at y 16; two ribs across it; an impost band along each wall
  const VAULT_Y = 15, vaultAt = (x) => VAULT_Y + Math.sqrt(Math.max(1 - x * x / 25, 0));
  const vault = (t, d = 0) => [(5 - 2 * d) * Math.cos(t), VAULT_Y + (1 - d) * Math.sin(t)];
  for (const sx of [-1, 1]) {
    ash(0.95); b.quad([sx * 5, 3, 0], [sx * 5, VAULT_Y, 0], [sx * 5, VAULT_Y, -10], [sx * 5, 3, -10], -sx, 0, 0);
    ash(1.04); b.box(sx > 0 ? 4.8 : -5, VAULT_Y - 0.4, -10, sx > 0 ? 5 : -4.8, VAULT_Y, 0, sx > 0 ? 'xy' : 'Xy');
    // the door wall either side of the opening, up to the springing
    ash(0.95); b.quad([sx * 4.2, 3, -10], [sx * 5, 3, -10], [sx * 5, VAULT_Y, -10], [sx * 4.2, VAULT_Y, -10], 0, 0, 1);
    // and over that, up to the vault's own curve (three chords of it)
    for (const [xa, xc] of [[5, 4.8], [4.8, 4.5], [4.5, 4.2]]) b.tri([sx * 4.2, VAULT_Y, -10], [sx * xa, vaultAt(xa), -10], [sx * xc, vaultAt(xc), -10], 0, 0, 1);
  }
  for (let i = 0, nv = 12; i < nv; i++) {
    const t0 = Math.PI * (i / nv), t1 = Math.PI * ((i + 1) / nv), tm = (t0 + t1) / 2, p0 = vault(t0), p1 = vault(t1), q0 = vault(t0, 0.15), q1 = vault(t1, 0.15);
    ash(0.9 + 0.04 * (i % 2)); b.quad([p0[0], p0[1], 0], [p1[0], p1[1], 0], [p1[0], p1[1], -10], [p0[0], p0[1], -10], -Math.cos(tm), -Math.sin(tm), 0);
    for (const zr of [-3.4, -6.8]) {
      ash(1.04); b.quad([q0[0], q0[1], zr + 0.3], [q1[0], q1[1], zr + 0.3], [q1[0], q1[1], zr - 0.3], [q0[0], q0[1], zr - 0.3], -Math.cos(tm), -Math.sin(tm), 0);
      ash(0.86); b.quad([q0[0], q0[1], zr + 0.3], [q1[0], q1[1], zr + 0.3], [p1[0], p1[1], zr + 0.3], [p0[0], p0[1], zr + 0.3], 0, 0, 1);
    }
    // the door wall over the door's head (y 15), under the vault
    const xa = 4.2 * Math.cos(t0), xb = 4.2 * Math.cos(t1);
    ash(0.95); b.tri([0, 15, -10], [xa, vaultAt(xa), -10], [xb, vaultAt(xb), -10], 0, 0, 1);
  }
  for (const sx of [-1, 1]) b.tri([0, 15, -10], [sx * 4.2, 15, -10], [sx * 4.2, vaultAt(4.2), -10], 0, 0, 1);
  // the door's reveal to its inner face at z -12.5, three raised panels across its head; the state floor from the top
  // step to that face
  for (const [xa, xb] of [[-3.8, -1.4], [-1.2, 1.2], [1.4, 3.8]]) { ash(1.05); b.box(xa, 14.95, -12.1, xb, 15, -10.4, 'yxXzZ'); }
  ash(0.95);
  b.quad([-4.2, 3, -10], [-4.2, 3, -12.5], [-4.2, 15, -12.5], [-4.2, 15, -10], 1, 0, 0);
  b.quad([4.2, 3, -10], [4.2, 3, -12.5], [4.2, 15, -12.5], [4.2, 15, -10], -1, 0, 0);
  b.quad([-4.2, 15, -10], [4.2, 15, -10], [4.2, 15, -12.5], [-4.2, 15, -12.5], 0, -1, 0);
  b.quad([-ARCH.a0, 3, 1], [ARCH.a0, 3, 1], [ARCH.a0, 3, -12.5], [-ARCH.a0, 3, -12.5], 0, 1, 0);
  // SIX BROAD STEPS in the open before the arch, from the gravel at z 8 to the state floor at z 1, as wide as the arch's
  // outer order; a low stone cheek each side, stepping down from the bay's face to the steps' foot
  for (let i = 0; i < 6; i++) { const zA = 8 - i * (7 / 6), zB = 8 - (i + 1) * (7 / 6); ash(0.9 + 0.03 * (i % 2)); b.box(-ARCH.a0, 0, zB, ARCH.a0, 0.5 * (i + 1), zA, 'YZ'); }
  for (const sx of [-1, 1]) {
    const xa = sx > 0 ? ARCH.a0 : -ARCH.a0 - 1.1, xb = xa + 1.1;
    ash(0.98); b.box(xa, 0, BAY, xb, 3.5, 5.3, 'xXZY'); b.box(xa, 0, 5.3, xb, 1.9, 8.6, 'xXZY');
    // THE DOORWAY HAS NO LEAVES: a leaf folded a half turn back onto the door wall's outer face would need 4.2 m of
    // that face and has 0.8 m before the passage's own wall. It stands an open doorway; its reveal is panelled:
    // three raised stone panels up each jamb
    for (const [y0, y1] of [[3.5, 6.9], [7.3, 10.7], [11.1, 14.5]]) { ash(1.05); b.box(sx > 0 ? 4.15 : -4.2, y0, -12.1, sx > 0 ? 4.2 : -4.15, y1, -10.4, sx > 0 ? 'xzZyY' : 'XzZyY'); }
    // an iron lamp standard with a lit lantern at the steps' foot
    const lx = sx * 7.5, lz = 10;
    ash(0.95); b.box(lx - 0.55, 0, lz - 0.55, lx + 0.55, 1.0, lz + 0.55, 'xXzZY');
    b.set(M_IRON, IRON).shaft(lx, lz, 1.0, 5.3, 0.24, 0.15, 6);
    b.box(lx - 0.5, 5.2, lz - 0.5, lx + 0.5, 5.32, lz + 0.5);
    b.shaft(lx, lz, 6.5, 7.3, 0.7, 0.05, 4, 0.785, 0.785); b.shaft(lx, lz, 7.3, 7.7, 0.1, 0.1, 4);
    // a lantern's panes carry their own middle (along the pane) and their flame's height
    b.set(M_LAMP, '#ffab58').uv(lx, lx, 5.75).box(lx - 0.42, 5.3, lz - 0.42, lx + 0.42, 6.5, lz + 0.42, 'zZ');
    b.uv(lz, lz, 5.75).box(lx - 0.42, 5.3, lz - 0.42, lx + 0.42, 6.5, lz + 0.42, 'xX');
    // a lit lantern on an iron bracket on each wall of the passage, 3 m within the arch
    const px = sx * 4.55, pz = -3;
    b.set(M_IRON, IRON).uv(50, 50, 100).box(Math.min(px, sx * 5), 12.5, pz - 0.07, Math.max(px, sx * 5), 12.64, pz + 0.07);
    b.box(px - 0.05, 12.0, pz - 0.05, px + 0.05, 12.5, pz + 0.05, 'xXzZ');
    b.cone(px, pz, 11.6, 12.05, 0.36, 4, 0.785); b.box(px - 0.27, 10.55, pz - 0.27, px + 0.27, 10.62, pz + 0.27);
    b.set(M_LAMP, '#ffab58').uv(px, px, 11.05).box(px - 0.25, 10.62, pz - 0.25, px + 0.25, 11.6, pz + 0.25, 'zZ');
    b.uv(pz, pz, 11.05).box(px - 0.25, 10.62, pz - 0.25, px + 0.25, 11.6, pz + 0.25, 'xX');
    b.uv(50, 50, 100);
  }
  return { ranks, stacks, par, crowns, staff };
}


// ---------------------------------------------------------------- the forecourt: a low balustrade with ball finials, two knot gardens of clipped box
function buildForecourt(b, rk) {
  const ball = (x, z, y, rad) => { b.shaft(x, z, y, y + rad * 0.6, rad * 0.5, rad, 6, 0, 0, false); b.shaft(x, z, y + rad * 0.6, y + rad * 1.4, rad, rad, 6, 0, 0, false); b.shaft(x, z, y + rad * 1.4, y + rad * 2, rad, rad * 0.45, 6, 0, 0, true); };
  // the balustrade: along z 46 with a gap 24 m wide on the axis, and down both sides to the corner turrets' south faces
  const runs = [[-48, 46, -12, 46], [12, 46, 48, 46], [-48, 3.1, -48, 46], [48, 46, 48, 3.1]];
  for (const [ax, az, bx, bz] of runs) {
    const x0 = Math.min(ax, bx) - 0.28, x1 = Math.max(ax, bx) + 0.28, z0 = Math.min(az, bz) - 0.28, z1 = Math.max(az, bz) + 0.28;
    b.set(M_BALUS, STONE, 0.95).uv(0, 0, 1.25).box(x0, 0, z0, x1, 1.25, z1, 'xXzZY'); b.uv(50, 50, 100);
    const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 8);
    for (let i = 0; i <= n; i++) {
      const x = ax + (bx - ax) * (i / n), z = az + (bz - az) * (i / n);
      b.set(M_STONE, STONE).box(x - 0.5, 0, z - 0.5, x + 0.5, 1.6, z + 0.5, 'xXzZY'); ball(x, z, 1.6, 0.55);
    }
  }
  // hedges 0.8 m high laid in interlaced knots; small box balls at the knots
  const strip = (px, pz, qx, qz, w = 0.85, h = 0.8) => {
    const dx = qx - px, dz = qz - pz, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * w / 2, nz = (dx / l) * w / 2;
    b.quad([px - nx, h, pz - nz], [qx - nx, h, qz - nz], [qx + nx, h, qz + nz], [px + nx, h, pz + nz], 0, 1, 0);
    b.quad([px + nx, 0, pz + nz], [qx + nx, 0, qz + nz], [qx + nx, h, qz + nz], [px + nx, h, pz + nz], nx, 0, nz);
    b.quad([px - nx, 0, pz - nz], [qx - nx, 0, qz - nz], [qx - nx, h, qz - nz], [px - nx, h, pz - nz], -nx, 0, -nz);
  };
  const ring = (cx, cz, rad, n = 20, h = 0.8) => { for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, c = ((i + 1) / n) * 6.2832; strip(cx + Math.cos(a) * rad, cz + Math.sin(a) * rad, cx + Math.cos(c) * rad, cz + Math.sin(c) * rad, 0.85, h); } };
  const poly = (cx, cz, pts, h = 0.8) => { for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; strip(cx + p[0], cz + p[1], cx + q[0], cz + q[1], 0.85, h); } };
  for (const sx of [-1, 1]) for (const kx of [18, 36]) for (const kz of [15, 33]) {
    const cx = sx * kx, cz = kz, kind = rk.int(0, 2), tone = rk.range(0.85, 1.1);
    b.set(M_HEDGE, '#3f6048', tone * 2.4);
    poly(cx, cz, [[-7.4, -7.4], [7.4, -7.4], [7.4, 7.4], [-7.4, 7.4]]);
    if (kind === 0) { ring(cx, cz, 5.0); poly(cx, cz, [[0, -6.9], [6.9, 0], [0, 6.9], [-6.9, 0]], 0.9); ring(cx, cz, 1.9, 12); }
    else if (kind === 1) { for (const [ox, oz] of [[-2.9, -2.9], [2.9, -2.9], [2.9, 2.9], [-2.9, 2.9]]) ring(cx + ox, cz + oz, 3.6, 16, 0.8 + 0.1 * ((ox * oz > 0) ? 1 : 0)); ring(cx, cz, 1.6, 10); }
    else { poly(cx, cz, [[-5, -5], [5, -5], [5, 5], [-5, 5]], 0.9); poly(cx, cz, [[0, -7], [3, -3], [7, 0], [3, 3], [0, 7], [-3, 3], [-7, 0], [-3, -3]]); ring(cx, cz, 2.2, 12); }
    b.set(M_HEDGE, '#3f6048', tone * 2.8);
    for (const [ox, oz] of [[-7.4, -7.4], [7.4, -7.4], [7.4, 7.4], [-7.4, 7.4], [0, 0]]) ball(cx + ox, cz + oz, 0, ox === 0 ? 0.95 : 0.8);
  }
}

// ---------------------------------------------------------------- THE CEDAR: one great cedar of Lebanon, 34 m tall and 44 m across, in the kit's own leaf layout
// A massive short trunk that divides low into four great limbs about a leader; the foliage in broad thin flat plates
// laid in seven tiers and a table of a top, each plate on a bough of its own. TIERS: [height, how far its plates reach
// from the trunk, a plate's half length, its half width, how many, how far its tips hang].
const CEDAR_TIERS = [[5.4, 21.5, 7.5, 5.6, 6, 1.4], [9.6, 22, 7.5, 6, 7, 0.9], [13.8, 20, 7, 5.8, 7, 0.6], [18, 17.5, 6.5, 5.4, 6, 0.4], [22.2, 14.5, 5.8, 5, 6, 0.3],
  [26.2, 11.5, 5, 4.6, 5, 0.2], [29.8, 8.5, 4.2, 4.2, 4, 0.1], [32.5, 6.5, 6.5, 6, 1, 0]];
// how far its widest plate's tip stands from the trunk (44 m across), on every seed
const CEDAR_REACH = 22;
function cedarGeometry(rng) {
  const P = [], N = [], C = [], Wd = [], T = [], I = [];
  const v = (p, n, c, sway, fl, leaf, tu = 0.875, tv = 0.75) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); Wd.push(sway, fl, leaf, 0); T.push(tu, tv); return P.length / 3 - 1; };
  const mix = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  // grey-brown bark; the needles' darkest blue-green: the plates' undersides, their tops, their lit tips
  const bark0 = lin('#4a4038'), bark1 = lin('#5e5448'), lo = lin('#12261f'), mid = lin('#1d3b33'), hi = lin('#2e5849');
  // a limb: a tube round a line of points with a radius at each; it sways more toward its end
  const tube = (pts, rad, sides, sway0, sway1) => {
    const base = P.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
      let tx = c[0] - a[0], ty = c[1] - a[1], tz = c[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      // two axes square to the limb (a limb that stands upright takes the east for its first)
      let ux = -tz, uz = tx; const ul = Math.hypot(ux, uz); if (ul < 0.2) { ux = 1; uz = 0; } else { ux /= ul; uz /= ul; }
      const wx = ty * uz, wy = tz * ux - tx * uz, wz = -ty * ux, t = i / (n - 1), col = mix(bark0, bark1, t);
      for (let k = 0; k < sides; k++) {
        const ang = (k / sides) * 6.2832, ca = Math.cos(ang), sa = Math.sin(ang), d = [ux * ca + wx * sa, wy * sa, uz * ca + wz * sa];
        v([pts[i][0] + d[0] * rad[i], pts[i][1] + d[1] * rad[i], pts[i][2] + d[2] * rad[i]], d, col, sway0 + (sway1 - sway0) * t, 0, 0);
      }
      if (i > 0) for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides, p0 = base + (i - 1) * sides, p1 = base + i * sides; I.push(p0 + k, p0 + k1, p1 + k1, p0 + k, p1 + k1, p1 + k); }
    }
  };
  // the trunk (flared at the lawn, 3 m through) and the leader over it
  const leader = [[0, -0.8, 0], [0, 0.5, 0], [0, 2.4, 0], [0, 5, 0], [0.2, 7.6, 0.1], [0.5, 13, -0.3], [-0.3, 20, 0.3], [0.2, 27, 0], [0, 32.3, 0]];
  tube(leader.slice(0, 5), [2.7, 2.2, 1.75, 1.6, 1.45], 8, 0, 0.01);
  tube(leader.slice(4), [1.3, 1.0, 0.68, 0.4, 0.16], 6, 0.01, 0.1);
  // four great limbs leave the trunk between 3.4 and 6.4 m and rise like trunks of their own, out and up
  const limbs = [leader];
  for (let j = 0, a0 = rng() * 6.2832; j < 4; j++) {
    const th = a0 + (j + rng.range(-0.22, 0.22)) * 1.5708, cx = Math.cos(th), cz = Math.sin(th), h0 = rng.range(3.4, 6.4), out = rng.range(6.5, 10), top = rng.range(23, 29.5);
    const pts = [[cx * 0.9, h0, cz * 0.9], [cx * out * 0.42, h0 + (top - h0) * 0.2, cz * out * 0.42], [cx * out * 0.74, h0 + (top - h0) * 0.5, cz * out * 0.74], [cx * out * 0.94, h0 + (top - h0) * 0.8, cz * out * 0.94], [cx * out, top, cz * out]];
    tube(pts, [1.05, 0.8, 0.55, 0.34, 0.14], 5, 0.01, 0.12); limbs.push(pts);
  }
  // where a limb crosses a height (null where it does not)
  const limbAt = (pts, y) => { for (let i = 1; i < pts.length; i++) if (y >= pts[i - 1][1] && y <= pts[i][1]) { const t = (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1] || 1); return mix(pts[i - 1], pts[i], t); } return null; };
  const needle = flora.LEAF_CELLS.needle;
  // a spray of needles: a flat card about a place, its long axis along (ax, az), tipped by `tip` out of the level
  const spray = (c, ax, az, len, wid, tip, col, sway) => {
    const sx = -az, sz = ax, n = [-ax * tip, 1, -az * tip], h = len * tip * 0.5, c0 = mul(col, 0.8), c1 = mix(col, hi, 0.45);
    const i0 = v([c[0] - ax * len * 0.5 - sx * wid * 0.5, c[1] - h, c[2] - az * len * 0.5 - sz * wid * 0.5], n, c0, sway, 0.5, 1, needle[0], needle[3]);
    const i1 = v([c[0] - ax * len * 0.5 + sx * wid * 0.5, c[1] - h, c[2] - az * len * 0.5 + sz * wid * 0.5], n, c0, sway, 0.5, 1, needle[2], needle[3]);
    const i2 = v([c[0] + ax * len * 0.5 + sx * wid * 0.5, c[1] + h, c[2] + az * len * 0.5 + sz * wid * 0.5], n, c1, sway, 1.2, 1, needle[2], needle[1]);
    const i3 = v([c[0] + ax * len * 0.5 - sx * wid * 0.5, c[1] + h, c[2] + az * len * 0.5 - sz * wid * 0.5], n, c1, sway, 1.2, 1, needle[0], needle[1]);
    I.push(i0, i1, i2, i0, i2, i3);
  };
  // THE PLATES, tier by tier: each a thin lens of foliage, long toward its tip, on a bough from the nearest limb at its
  // height; a fringe of needle sprays lies out over its rim and a few lie on its top
  for (let ti = 0; ti < CEDAR_TIERS.length; ti++) {
    const [y, reach, a, bw, count, hang] = CEDAR_TIERS[ti], th0 = rng() * 6.2832;
    for (let j = 0; j < count; j++) {
      const th = th0 + (j + rng.range(-0.22, 0.22)) * (6.2832 / count), er = [Math.cos(th), Math.sin(th)], et = [-er[1], er[0]];
      // every plate draws the same dice in the same order; the table alone uses the third (how far off the leader it sits)
      const k = rng.range(0.9, 1.06), al = a * k, bl = bw * rng.range(0.88, 1.1), off = rng.range(0, 1.2), rc = count > 1 ? reach * k - al : off, yy = y + rng.range(-0.5, 0.5);
      const tone = rng.range(0.88, 1.12), cx = er[0] * rc, cz = er[1] * rc;
      let from = null, best = 1e9;
      for (const lp of limbs) { const q = limbAt(lp, yy - 0.5); if (q) { const d = Math.hypot(q[0] - cx, q[2] - cz); if (d < best) { best = d; from = q; } } }
      if (!from) { from = [0, yy - 0.5, 0]; best = rc; }
      if (best > 1.5) tube([from, [(from[0] + cx) / 2, yy - 0.1, (from[2] + cz) / 2], [cx + er[0] * al * 0.35, yy - 0.25, cz + er[1] * al * 0.35]], [0.36, 0.24, 0.1], 4, 0.04, 0.12 + 0.012 * rc);
      // a place of the plate: f along its length (-1 at its inner end, 1 at its tip), g across; it hangs toward its tip
      const at = (f, g, up) => { const r = rc + f * al, fo = Math.max(0, f); return [er[0] * r + et[0] * g * bl, yy + up - hang * fo * fo, er[1] * r + et[1] * g * bl]; };
      const sw = (f) => 0.1 + 0.018 * Math.abs(rc + f * al);
      const K = 10, top = v(at(0, 0, 0.85), [0, 1, 0], mul(mix(mid, hi, 0.35), tone), sw(0), 0.5, 1), under = v(at(0, 0, -0.5), [0, -1, 0], mul(lo, tone), sw(0), 0.3, 1);
      const ring = [], rimT = [], rimB = [];
      for (let q = 0; q < K; q++) {
        const ph = (q / K) * 6.2832, lump = rng.range(0.84, 1.12), f = Math.cos(ph) * lump, g = Math.sin(ph) * lump * (1 - 0.18 * Math.cos(ph));
        const ox = er[0] * f + et[0] * g, oz = er[1] * f + et[1] * g, ol = Math.hypot(ox, oz) || 1, nx = ox / ol, nz = oz / ol;
        ring.push(v(at(f * 0.58, g * 0.58, 0.6), [nx * 0.3, 0.95, nz * 0.3], mul(mid, tone * rng.range(0.9, 1.1)), sw(f * 0.58), 0.6, 1));
        rimT.push(v(at(f, g, 0), [nx * 0.6, 0.8, nz * 0.6], mul(mix(mid, hi, 0.6), tone * rng.range(0.9, 1.1)), sw(f), 1, 1));
        rimB.push(v(at(f, g, -0.02), [nx * 0.5, -0.86, nz * 0.5], mul(lo, tone), sw(f), 1, 1));
        const len = rng.range(2.0, 3.0);
        spray(at(f * 1.02, g * 1.02, 0.05), nx, nz, len, len * 0.8, (q % 2 ? 1 : -1) * rng.range(0.12, 0.3), mul(mid, tone), sw(f));
      }
      for (let q = 0; q < K; q++) { const q1 = (q + 1) % K; I.push(top, ring[q1], ring[q], ring[q], ring[q1], rimT[q1], ring[q], rimT[q1], rimT[q], under, rimB[q], rimB[q1]); }
      for (let q = 0; q < 5; q++) {
        const ph = rng() * 6.2832, rr = rng.range(0.15, 0.7), f = Math.cos(ph) * rr, g = Math.sin(ph) * rr, tb = rng() * 6.2832, len = rng.range(2.4, 3.4);
        spray(at(f, g, 0.9 - 0.3 * rr), Math.cos(tb), Math.sin(tb), len, len * 0.8, rng.range(-0.2, 0.2), mul(mix(mid, hi, 0.3), tone), sw(f));
      }
    }
  }
  // whatever the seed dealt, the whole crown is drawn in or out about the trunk until its farthest tip stands at that reach
  let far = 0; for (let i = 0; i < P.length; i += 3) far = Math.max(far, Math.hypot(P[i], P[i + 2]));
  const fit = CEDAR_REACH / far; for (let i = 0; i < P.length; i += 3) { P[i] *= fit; P[i + 2] *= fit; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2)); g.setIndex(I);
  g.computeBoundingSphere(); g.computeBoundingBox();
  const bb = g.boundingBox;
  g.userData = { triangles: I.length / 3, height: bb.max.y, radius: CEDAR_REACH, glowColor: null };
  return g;
}

// ---------------------------------------------------------------- shaders of the house, its windows and the ground (linear HDR, fog by the scene)
const V3 = (hex, k = 1) => 'vec3(' + lin(hex, k).map((v) => v.toFixed(4)).join(',') + ')';
const GL_COMMON = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uWarm;
// the low sky a wall is turned to, to the south, east, north and west: the sky's own colour there, laid at build
uniform vec3 uLowS, uLowE, uLowN, uLowW;
uniform float uTime;
// where in their own unsteady burning the west lantern, the east lantern and the hall fire stand: dealt by the seed
uniform vec4 uFlick;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h12(i), h12(i + vec2(1., 0.)), f.x), mix(h12(i + vec2(0., 1.)), h12(i + vec2(1., 1.)), f.x), f.y); }
float fb(vec2 p){ return .5 * vn(p) + .3 * vn(p * 2.1 + 7.3) + .2 * vn(p * 4.3 + 3.1); }
vec3 shadeLit(vec3 alb, vec3 n, float sun){
  vec3 amb = mix(uGndCol, uSkyCol, n.y * .5 + .5);
  return alb * (amb + uSunCol * max(dot(n, uSunDir), 0.) * sun);
}
// THE HOUSE'S OWN SHADOW on its stone: 1 where the line from a place toward the sun enters the block's plan (x -48 to
// 48, z -88 to 0) under its wall head (y 33), or the great tower's plan under the tower's head. A face that looks
// into the house's body never takes the sun.
float boxShade(vec3 w, vec2 a, vec2 b, float head){
  vec2 d = uSunDir.xz;
  vec2 dd = vec2(abs(d.x) < 1e-4 ? 1e-4 : d.x, abs(d.y) < 1e-4 ? 1e-4 : d.y);
  vec2 t0 = (a - w.xz) / dd, t1 = (b - w.xz) / dd;
  vec2 lo = min(t0, t1), hi = max(t0, t1);
  float te = max(max(lo.x, lo.y), 0.), tx = min(hi.x, hi.y);
  return step(te + .05, tx) * step(w.y + te * uSunDir.y, head);
}
float blockShade(vec3 w){
  return max(boxShade(w, vec2(-48., -88.), vec2(48., 0.), ${WALL_H.toFixed(1)}),
    boxShade(w, vec2(${(-TOWER.hx).toFixed(1)}, ${TOWER.z1.toFixed(1)}), vec2(${TOWER.hx.toFixed(1)}, ${TOWER.z0.toFixed(1)}), ${TOWER.y2.toFixed(1)}));
}
// THE STONE'S LIGHT: the sky's two halves as on everything; the low sky that a wall is turned to; under a moulding,
// a share of that light thrown back up by the pale wall it stands on; the sun by its own direction, which also rims a
// face turned a little past it; none of the sun in the house's own shadow
vec3 stoneLight(vec3 n, vec3 w, float open){
  float h = 1. - n.y * n.y, sl = dot(n, uSunDir);
  vec3 amb = mix(uGndCol, uSkyCol, n.y * .5 + .5) * .7;
  vec3 low = uLowS * max(n.z, 0.) * n.z + uLowN * max(-n.z, 0.) * -n.z + uLowE * max(n.x, 0.) * n.x + uLowW * max(-n.x, 0.) * -n.x;
  low += (uLowS + uLowN + uLowE + uLowW) * (.15 * max(-n.y, 0.));
  float sun = (max(sl, 0.) + .5 * smoothstep(-.2, .35, sl) * h) * (1. - blockShade(w));
  return (amb + low) * open + uSunCol * sun * step(.99, open);
}
// metres from a place on the ground to the nearest wall that carries basement windows: the front between the middle
// bay and the turrets, the middle bay beside the arch, the turrets' south faces, their outer faces, the flanks
float wallDist(vec2 p){
  float ax = abs(p.x), z = p.y;
  float d = length(vec2(max(max(11. - ax, ax - 36.5), 0.), z));
  d = min(d, length(vec2(max(max(6.4 - ax, ax - 11.), 0.), z - 2.)));
  d = min(d, length(vec2(max(max(36.5 - ax, ax - 50.5), 0.), z - 2.5)));
  d = min(d, length(vec2(ax - 50.5, max(max(-11.5 - z, z - 2.5), 0.))));
  d = min(d, length(vec2(ax - 48., max(max(-76.5 - z, z + 11.5), 0.))));
  return d;
}
// the two standards' lanterns at the steps' foot (7.5 m either side of the way, z 10, 5.9 m up): their unsteady light
// on a face that looks toward them, each lantern in its own time
float lampFall(float d){ float f = 1. - smoothstep(.3, 2.5, d); return f * f; }
vec3 standLight(vec3 w, vec3 n){
  vec3 lv = vec3(abs(w.x) - 7.5, w.y - 5.9, w.z - 10.);
  float ll = length(lv), lt = mix(uFlick.x, uFlick.y, step(0., w.x));
  float fl = .3 + .55 * vn(vec2(uTime * 3.4 + lt, 1.5)) + .4 * vn(vec2(uTime * 1.3 + lt, 8.5));
  float turn = .3 + .7 * max(dot(vec3(n.x * sign(w.x), n.y, n.z), -lv / max(ll, .01)), 0.);
  // a lantern lights the stone within two and a half metres of itself and no further
  return uWarm * 2.3 * fl * turn * lampFall(ll);
}
// the basement's firelight on what stands before those walls: paint read from the walls' own places
vec3 spill(vec3 w){
  float d = wallDist(w.xz);
  float fl = .45 + .55 * vn(vec2(w.x * .16 + w.z * .11, uTime * 3.2));
  // the low windows' warm light: it lies on the gravel by the wall and comes back on the wall's own foot, 3.6 m at most
  return uWarm * .35 * fl * (exp(-d / 5.) + .35 * exp(-d / 16.)) * smoothstep(3.6, .4, w.y);
}
`;
const HOUSE_VERT = /* glsl */`
attribute float aMat; attribute vec2 aUL; attribute vec3 aCol;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vM; varying vec2 vUL;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = aCol; vM = aMat; vUL = aUL;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const HOUSE_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vM; varying vec2 vUL;
uniform float uLampGain;
// where in their own unsteady burning the passage's west and east lanterns stand: dealt by the seed
uniform vec2 uFlick2;
${GL_COMMON}${fx.GLSL_FOG_PARS_FRAG}
// the weathering that gathers under a course whose foot is at c
float under(float y, float c){ return smoothstep(c - 1.7, c - .05, y) * (1. - step(c, y)); }
float courseShade(float y, float c, float drop){ float d = c - y; return step(0., d) * (1. - smoothstep(.14 + drop, .6 + drop, d)); }
// the carved panel's straps: metres from a place on it to the nearest strap's middle (a lozenge between two ovals, one
// level strap through all three)
float strapD(vec2 q){
  float d = abs(abs(q.x) / .95 + abs(q.y) / .46 - 1.) * .4;
  d = min(d, abs(length(vec2((abs(q.x) - 1.55) / .62, q.y / .42)) - 1.) * .42);
  return min(d, max(abs(q.y), abs(q.x) - 2.3));
}
void main(){
  vec3 n = normalize(vN);
  float m = floor(vM + .5);
  vec3 alb = vC; vec3 emis = vec3(0.);
  float px = max(fwidth(vW.y), fwidth(vW.x) + fwidth(vW.z));
  float fine = 1. - smoothstep(.1, .5, px);
  vec2 wc = abs(n.z) > abs(n.x) ? vW.xy : vW.zy;
  float isStone = 0.;
  // the forecourt's older, greyer stone (piers, balls, balustrade): every block its own tone, dark joints, a lit arris
  // under each bed joint, damp and dark toward the ground
  vec3 stone = ${V3(STONE)} * (.86 + .28 * fb(wc * .45));
  float srow = floor(wc.y / .6);
  vec2 sb = vec2(wc.x / 1.25 + mod(srow, 2.) * .5, wc.y / .6);
  vec2 sj = fract(sb);
  stone *= (.9 + .2 * mix(.5, h12(floor(sb) + 31.), fine)) * (.9 + .2 * vn(vec2(wc.x * .9, wc.y * .12)));
  stone *= 1. - .3 * fine * (1. - smoothstep(.0, .05, min(min(sj.x, 1. - sj.x) * 2., min(sj.y, 1. - sj.y))));
  stone *= 1. + .12 * fine * smoothstep(.86, .93, sj.y) * (1. - smoothstep(.93, .96, sj.y));
  stone *= mix(.84, 1., smoothstep(0., 2.6, vW.y));
  if (m < .5) {
    // THE HOUSE'S STONE: fine ashlar, its courses (0.55 m) and blocks (1.3 m) only just seen, every block a little its own
    float row = floor(wc.y / .55);
    vec2 ab = vec2(wc.x / 1.3 + mod(row, 2.) * .5, wc.y / .55), aj = fract(ab);
    float fineA = 1. - smoothstep(.06, .3, px);
    alb = vC * (.93 + .14 * fb(wc * .21)) * (.935 + .13 * mix(.5, h12(floor(ab) + 17.), fineA));
    // the ashlar's courses read from forty metres: the bed joints are the stronger and wider line, the upright joints the fainter
    float bed = 1. - smoothstep(0., .1, min(aj.y, 1. - aj.y)), perp = 1. - smoothstep(0., .07, min(aj.x, 1. - aj.x) * 2.36);
    alb *= 1. - fineA * max(.24 * bed, .14 * perp);
    // the rain's long stains down the face; a darker weathered band at the plinth (to 3 m) and under every course: the
    // two strings and the wall head; a turret's own head; on the tower its two stages' heads
    alb *= .93 + .14 * vn(vec2(wc.x * .7, wc.y * .06));
    float y = vW.y, onTower = step(abs(vW.x), 20.);
    float wth = max(1. - smoothstep(1.2, 3.1, y), max(under(y, 14.), max(under(y, 23.6), under(y, 32.4))));
    wth = max(wth, mix(under(y, 42.4), max(under(y, 45.7), under(y, 57.4)), onTower));
    alb *= mix(vec3(1.), vec3(.78, .765, .75), wth * (.75 + .5 * vn(vec2(wc.x * .35, 3.7))));
    // every string course and the cornice throws a band of shade on the wall under it: the sky's light is cut off close
    // under the projecting member, and the sun's own shadow falls below it as far as the sun's height carries it
    float drop = min(.3 * max(uSunDir.y, 0.) / max(dot(uSunDir, vec3(n.x, 0., n.z)), .25), .6);
    float cs = max(courseShade(y, 14., drop), max(courseShade(y, 23.6, drop), courseShade(y, 32.4, drop)));
    cs = max(cs, mix(courseShade(y, 42.4, drop), max(courseShade(y, 45.7, drop), courseShade(y, 57.4, drop)), onTower));
    alb *= 1. - .36 * cs * (1. - n.y * n.y);
    // the plinth's moulded head, a light line on the walls at 2.9 m
    alb *= 1. + .1 * fineA * (1. - n.y * n.y) * (smoothstep(2.8, 2.86, y) - smoothstep(2.98, 3.04, y));
    isStone = 1.;
  } else if (m < 1.5) {
    alb = stone * vC / ${V3(STONE)};
  } else if (m < 2.5) {
    // the carved panel over the arch: raised straps, light on their upper side, the sunk field between them in their shade
    vec2 q = vec2(vW.x, vW.y - 18.1);
    float d = strapD(q), up = strapD(q + vec2(0., .03));
    float strap = 1. - smoothstep(.05, .085, d);
    float k = mix(.8, 1.06 + .2 * clamp((up - d) / .03, -1., 1.), strap);
    alb = vC * (.95 + .1 * fb(wc * .6)) * mix(.88, k, fine);
    isStone = 1.;
  } else if (m < 3.5) {
    float seam = 1. - smoothstep(.0, .08, abs(fract(vW.x / 1.5) - .5) * 2. - .9);
    float roll = smoothstep(.86, .93, abs(fract(vW.x / 1.5) - .5) * 2.) * seam;
    alb = vC * (.9 + .16 * fb(vW.xz * .3)) * (1. + .4 * roll * (1. - smoothstep(.2, .9, px)));
  } else if (m < 4.5) {
    float plank = floor(wc.x / .7);
    alb = vC * (.75 + .4 * h12(vec2(plank, 3.))) * (.85 + .3 * vn(vec2(wc.x * 9., wc.y * .6)));
    float strap = 1. - step(.045, abs(fract((wc.y - 3.) / 4.) - .5));
    alb = mix(alb, vec3(.03, .03, .035), clamp(strap, 0., 1.) * .9);
  } else if (m < 5.5) {
    alb = vC;
  } else if (m < 6.5) {
    alb = vC * (.6 + .8 * fb(vW.xz * 1.9 + vW.y * 1.3)) * (.7 + .3 * smoothstep(0., .8, vW.y));
  } else if (m < 7.5) {
    float t = (vW.y - vUL.x) / max(vUL.y - vUL.x, .01);
    float slot = step(.2, t) * step(t, .78) * step(.45, fract(wc.x / .62));
    alb = stone * vC / ${V3(STONE)} * mix(1., mix(.75, .3, fine), slot);
  } else {
    // a lantern's panes: a flame's heart behind glass, iron bars at the corners and across the middle. Every pane carries
    // its own middle along itself and its flame's height; the passage's two hang high (y 11) and are the smaller.
    float high = step(8., vUL.y), hw = mix(.42, .25, high), sc = mix(1., .62, high);
    float al = (abs(n.z) > abs(n.x) ? vW.x : vW.z) - vUL.x;
    // the flame leans and stretches in the draught, each lantern in its own time
    float lt = mix(mix(uFlick.x, uFlick.y, step(0., vW.x)), mix(uFlick2.x, uFlick2.y, step(0., vW.x)), high);
    float sway = vn(vec2(uTime * 4.2 + lt, 2.5)) - .5, tall = .7 + .7 * vn(vec2(uTime * 3.1 + lt, 6.5));
    vec2 lp = vec2(al - sway * .22 * sc, (vW.y - vUL.y) / tall) / sc;
    float flame = exp(-dot(lp, lp) / .06) * 1.8 + .14;
    float bars = step(hw - .08, abs(al)) + step(abs(vW.y - vUL.y - .1 * sc), .03 * sc);
    emis = vC * uLampGain * flame * (.82 + .18 * vn(vec2(vW.x, uTime * 5.))) * (1. - clamp(bars, 0., 1.));
    alb = vec3(.02);
  }
  // UNDER COVER: within the entrance passage (north of the front's plane, between its walls, under its vault) no sun
  // comes and the sky's light thins toward the door
  float cover = step(abs(vW.x), 5.25) * step(vW.z, .02) * step(vW.y, 16.2);
  float open = 1. - cover * (.35 + .4 * smoothstep(0., -9., vW.z));
  vec3 lit = isStone > .5 ? stoneLight(n, vW, open) : mix(uGndCol, uSkyCol, n.y * .5 + .5) * open + uSunCol * max(dot(n, uSunDir), 0.) * (1. - cover);
  vec3 col = alb * (lit + spill(vW) * (1. - cover)) + emis;
  // firelight from the open door on the passage's own faces, on the arch and on the steps before it
  vec3 toDoor = vec3(0., 8.5, -11.) - vW;
  // (its reach: within the passage, the walls and the vault; before the front's plane, the arch's own round out to its
  // hood's outer edge, 5.75 m about the springing at y 11.5, and the steps between the cheeks)
  // the hall's fire lights only what it can reach through the open doorway: the passage, the arch's inner order
  // (the first 1.4 m of its depth, inside its inner round) and the upper three steps; the front outside takes none
  float inPass = step(abs(vW.x), 5.25) * step(vW.z, .02) * step(vW.y, 16.2);
  float inOrder = step(.02, vW.z) * step(vW.z, 1.42) * step(length(vec2(vW.x, max(vW.y - 11.5, 0.))), 5.21);
  float onSteps = step(.02, vW.z) * step(abs(vW.x), 5.25) * step(vW.y, 3.05) * (1. - smoothstep(3.33, 5.67, vW.z));
  float inWay = step(-12.6, vW.z) * max(inPass, max(inOrder, onSteps));
  float dl = length(toDoor);
  // the hall fire's light is never steady
  float dfl = .3 + .5 * vn(vec2(uTime * 2.8 + uFlick.z, vW.y * .22 + vW.z * .13 + vW.x * .09)) + .4 * vn(vec2(uTime * 1.1 + uFlick.z, 4.5));
  col += alb * uWarm * 1.5 * dfl * inWay * exp(-dl / 13.) * (.35 + .65 * max(dot(n, toDoor / max(dl, .01)), 0.));
  // the lanterns' own unsteady light on the stone beside them: the two standards' at the steps' foot (x 7.5 either side,
  // z 10, 5.9 m up) and the passage's two on their brackets (4.55 m either side of the way, z -3, 11.1 m up)
  vec3 nm = vec3(n.x * sign(vW.x), n.y, n.z);
  col += alb * standLight(vW, n) * (1. - step(7.5, m)) * (1. - cover);
  vec3 pv = vec3(abs(vW.x) - 4.55, vW.y - 11.1, vW.z + 3.);
  float pt = mix(uFlick2.x, uFlick2.y, step(0., vW.x));
  float pfl = .3 + .55 * vn(vec2(uTime * 3.4 + pt, 1.5)) + .4 * vn(vec2(uTime * 1.3 + pt, 8.5));
  float pturn = .3 + .7 * max(dot(nm, -pv / max(length(pv), .01)), 0.);
  col += alb * uWarm * 2. * pfl * pturn * lampFall(length(pv)) * (1. - step(7.5, m)) * inPass;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;
const WIN_VERT = /* glsl */`
attribute vec4 aA; attribute vec4 aB;
varying vec2 vUv; varying vec4 vA; varying vec4 vB; varying vec3 vW; varying vec3 vN;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv; vA = aA; vB = aB;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
// aA: storey, seed, rank metres at the window's middle (-1: on no rank), width; aB: height, lit, shut, the window's make
// (0 the basement's own; else lights across times ten and rows up; plus 100 where each light has a round head, plus
// 200 where one round head spans the window)
const WIN_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vA; varying vec4 vB; varying vec3 vW; varying vec3 vN;
uniform vec4 uLamp[6];
uniform vec3 uGlassLo, uGlassHi, uShutter, uLampCol, uFireCol;
uniform float uHdr;
${GL_COMMON}${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec3 n = normalize(vN);
  vec2 size = vec2(vA.w, vB.x); vec2 p = vUv * size;
  float storey = vA.x, seed = vA.y;
  float px = max(fwidth(p.x), fwidth(p.y));
  float fr = storey < .5 ? .22 : .3;
  vec2 inner = max(size - 2. * fr, vec2(.2));
  vec2 q = (p - fr) / inner;
  float inside = step(0., q.x) * step(q.x, 1.) * step(0., q.y) * step(q.y, 1.);
  // the window's make: its stone mullions and transoms divide it into lights across and rows up
  float kind = floor(vB.w + .5), roundK = floor(kind / 100. + .01);
  vec2 nc = kind < .5 ? max(floor(inner / vec2(1.3, 2.4) + .5), vec2(1.)) : vec2(floor(mod(kind, 100.) / 10. + .01), mod(kind, 10.));
  vec2 g = clamp(q, 0., 1.) * nc; vec2 cell = floor(g); vec2 gf = fract(g);
  vec2 dm = min(gf, 1. - gf) * inner / nc;
  float bw = kind < .5 ? .1 : .13;
  float bar = 1. - smoothstep(bw - px * .5, bw + px * .5 + .002, min(dm.x, dm.y));
  // a round head: each light's own, or one over the whole window; stone fills the corners over it
  float cw = roundK > 1.5 ? inner.x : inner.x / nc.x;
  vec2 hq = q * inner - vec2(roundK > 1.5 ? inner.x * .5 : (cell.x + .5) * cw, inner.y - cw * .5);
  float head = step(.5, roundK) * step(0., hq.y) * smoothstep(-px * .5, px * .5 + .002, length(hq) - cw * .5 + (roundK > 1.5 ? 0. : bw));
  float stoneK = max(max(1. - inside, head * inside), bar * (1. - .55 * smoothstep(.25, .9, px)));
  float paneR = h12(cell + seed * 97.);
  float lit = vB.y, shut = vB.z;
  // the lamps that travel behind the ranks: a glow about two windows wide
  float sHere = vA.z + (vUv.x - .5) * size.x; float lamp = 0.;
  float hy = (q.y - .4) * size.y;
  for (int i = 0; i < 6; i++) {
    vec4 L = uLamp[i]; float d = sHere - L.y;
    lamp += L.z * (.45 * exp(-d * d / 11.6) + 1.1 * exp(-(d * d + hy * hy) / 1.7)) * (1. - step(.5, abs(L.x - storey)));
  }
  lamp *= step(0., vA.z);
  // glass that mirrors the sky, every old pane leaning its own way
  vec3 sky = mix(uGlassLo, uGlassHi, clamp(q.y * .55 + .2 + (paneR - .5) * .6, 0., 1.)) * (.7 + .6 * paneR);
  // pale shut shutters behind the glass: leaves with a seam
  float seam = smoothstep(0., .07, abs(fract(g.x) - .5));
  float rail = smoothstep(0., .05, abs(fract(q.y * 3.) - .5));
  vec3 shutC = shadeLit(uShutter * (.8 + .2 * seam * rail) * (.92 + .16 * paneR), n, 0.) * 1.35 + sky * .12;
  vec3 base = mix(sky, shutC, shut);
  // below stairs every fire flickers; above, the rooms with a fire just lit flicker and the lamp-lit ones burn steady
  float fireK = step(.55, fract(seed * 13.7));
  float fl = storey < .5 ? .6 + .4 * vn(vec2(seed * 40. + q.x * 1.5, uTime * 3.1)) : mix(.95, .66, fireK) + mix(.05, .34, fireK) * vn(vec2(seed * 40., uTime * 2.4));
  float low = mix(1.18, .78, q.y);
  vec3 warm = mix(uLampCol, uFireCol, storey < .5 ? .6 : .1);
  float crack = (1. - seam) * .8 + .04;
  // a lamp or a fire low in the room: a hot heart in an amber field
  vec2 hp = vec2((q.x - (fract(seed * 7.31) * .7 + .15)) * size.x, (q.y - .28) * size.y);
  float hot = exp(-dot(hp, hp) / 2.4);
  float room = storey < .5 ? 1.2 : .5 * low + .7 * hot;
  float amt = lit * fl * room * (.85 + .15 * paneR) * (1. - shut) + lamp * mix(1., crack, shut);
  vec3 glow = warm * uHdr * amt;
  vec3 stone = ${V3(HONEY)} * (.92 + .16 * fb(vW.xy * .5 + vW.z * .5));
  // a thin label mould over the flat head, in the surround's own stone: a light member and the shade line under it
  float lab = step(.5, storey) * step(roundK, .5) * step(size.y - fr, p.y);
  stone *= 1. + lab * (.1 - .34 * (1. - smoothstep(.0, .07, p.y - (size.y - fr))));
  // a hint of the room: drawn curtains at the sides and a pelmet, a shutter leaf folded back; never a figure
  float cur = step(.4, fract(seed * 5.13)) * step(.5, storey);
  float cxw = min(q.x, 1. - q.x);
  float drape = cur * max(1. - smoothstep(.12, .17, cxw + .02 * sin(q.y * 11. + seed * 20.)), smoothstep(.88, .91, q.y));
  glow *= mix(vec3(1.), vec3(.36, .1, .045) * (.7 + .3 * sin(cxw * 150.)), drape);
  float leaf = step(.72, fract(seed * 3.7)) * step(.5, storey) * (1. - shut) * step(.86, q.x);
  base = mix(base, shutC, leaf); glow *= 1. - .8 * leaf;
  // the lowest rank keeps its shallow reveal: a shade under the lintel and by the west jamb
  float deepK = step(.5, storey);
  float rev = max(smoothstep(.94, 1., q.y), 1. - smoothstep(0., .05, q.x)) * (1. - deepK);
  base *= 1. - .45 * rev; glow *= 1. - .3 * rev;
  // THE GLASS OF THE THREE UPPER RANKS SITS 0.4 m BACK IN ITS OPENING, one law for every window on every face: the
  // head and the jamb on the sun's side throw their shade on the glass and its bars as far as 0.4 m of depth carries
  // it by the sun's own bearing, the sky's light is cut off close under the head and in the corners, and the reveal's
  // four faces show as a band inside the opening, each lit by the way it is turned (sill up, head down, a jamb each way)
  vec3 tw = vec3(n.z, 0., -n.x);
  float us = sign(dot(dFdx(vW), tw) * dFdx(p.x) + dot(dFdy(vW), tw) * dFdy(p.x));
  float sn = dot(uSunDir, n), sx = dot(uSunDir, tw) * us;
  vec2 em = min(q, 1. - q) * inner;
  float fromJamb = (sx > 0. ? 1. - q.x : q.x) * inner.x, fromHead = (1. - q.y) * inner.y;
  float reach = .4 / max(sn, .1), soft = .02 + px * .5;
  float shd = step(.02, sn) * max(1. - smoothstep(-soft, soft, fromJamb - min(abs(sx) * reach, inner.x * .8)), 1. - smoothstep(-soft, soft, fromHead - min(max(uSunDir.y, 0.) * reach, inner.y * .8)));
  float occ = .36 * exp(-min(em.x, em.y) / .26) + .3 * exp(-fromHead / .5);
  float dim = 1. - deepK * (1. - (1. - .5 * shd) * (1. - occ));
  base *= dim;
  float bandK = inside * deepK * (1. - head) * (1. - smoothstep(.16 - px * .5, .16 + px * .5, min(em.x, em.y)));
  vec3 nf = em.x < em.y ? tw * (us * (q.x < .5 ? 1. : -1.)) : vec3(0., q.y < .5 ? 1. : -1., 0.);
  // the reveal's shade lies along the head and along the jamb turned from the sun; the sill and the other jamb take the light
  float turned = em.x < em.y ? step(dot(nf, uSunDir), 0.) : step(.5, q.y);
  vec3 revC = stone * (stoneLight(nf, vW, 1.) + spill(vW)) * mix(1.04, .56, turned);
  vec3 sc = stone * (stoneLight(n, vW, 1.) + spill(vW) + standLight(vW, n)) * mix(1., dim, inside) + glow * .09 * inside;
  // mullions and transoms stand proud: their upper and east arrises are the lighter, the others sit in shade
  float vbar = step(dm.x, dm.y);
  float arris = mix(step(gf.y, .5), step(gf.x, .5), vbar);
  sc *= mix(1., mix(.78, 1.16, arris), bar * inside);
  vec3 col = mix(mix(base + glow, sc, stoneK), revC, bandK);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;
const GROUND_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const GROUND_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN;
uniform vec3 uLawn, uLawnDry, uGravel, uLavender, uSoil, uFrost, uLampCol;
uniform vec2 uSunXZ; uniform vec3 uShadow, uMistCol; uniform float uGraze, uLampGain, uLakeY, uFrostK, uMistK;
${GL_COMMON}${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec3 n = normalize(vN); vec2 p = vW.xz; float ax = abs(p.x);
  float px = fwidth(p.x) + fwidth(p.y);
  float fine = 1. - smoothstep(.15, .9, px);
  // gravel round the house and over the forecourt, lawn beyond the balustrade
  float gr = (1. - smoothstep(47.4, 48.6, ax)) * (1. - smoothstep(45.4, 46.6, p.y));
  gr = max(gr, (1. - smoothstep(56., 60., ax)) * (1. - smoothstep(4., 8., p.y)) * smoothstep(-100., -95., p.y));
  vec3 lawn = mix(uLawn, uLawnDry, smoothstep(.45, .8, fb(p * .011))) * (.8 + .4 * fb(p * .07)) * (.93 + .14 * mix(.5, vn(p * 2.3), fine));
  lawn = mix(lawn, uFrost, uFrostK * (.55 + .3 * fb(p * .05)));
  // the lawn near the house is mown in stripes
  lawn *= 1. + .12 * (step(.5, fract(p.x / 11.)) - .5) * (1. - smoothstep(150., 260., length(p))) * (1. - smoothstep(.5, 2.5, px));
  vec3 gravel = uGravel * (.86 + .28 * fb(p * .35)) * (.9 + .2 * mix(.5, h12(floor(p * 5.)), fine));
  // the whole forecourt is raked east to west; two wheel ruts run from the balustrade's gap (z 46) to the steps' foot (z 8);
  // moss greens the gravel's edge along the balustrade and at the walls' feet
  gravel *= 1. + .05 * fine * sin(p.y * 19.6 + .6 * vn(p * .4));
  float rut = (1. - smoothstep(.1, .24, abs(abs(p.x + .3 * sin(p.y * .21)) - .75))) * step(8.6, p.y) * (1. - step(46., p.y));
  gravel *= 1. - .16 * rut;
  float edge = min(min(48. - ax, 46. - p.y), wallDist(p) + .2);
  gravel = mix(gravel, vec3(.13, .19, .09) * (.7 + .6 * fb(p * .9)), (1. - smoothstep(.15, 1.5, edge)) * .5 * step(0., edge));
  // the knot gardens' beds: lavender and bare earth between the clipped hedges
  vec2 kq = abs(vec2(ax - 27., p.y - 24.)) - 9.;
  float inK = step(max(abs(kq.x), abs(kq.y)), 7.4);
  float lav = smoothstep(.35, .6, vn(p * .9 + 11.) * .6 + vn(p * 2.7) * .4);
  // the lavender moves in waves under the west-going wind
  float lw = .68 + .64 * vn(vec2(p.x * .32 + uTime * .9, p.y * .32 - uTime * .22));
  gravel = mix(gravel, mix(uSoil, uLavender * (.8 + .4 * vn(p * 4.)) * lw, lav), inK * .92);
  vec3 alb = mix(lawn, gravel, gr);
  // the lake's margin: wet earth just above the water
  alb = mix(alb, uSoil * .8, (1. - smoothstep(uLakeY + .1, uLakeY + .75, vW.y)) * (1. - gr));
  // first light across the park: the house's long shadow, and soft bars of light and shade drawn out down the light
  vec2 sp = vec2(-uSunXZ.y, uSunXZ.x);
  float c = dot(p, sp), a = dot(p, uSunXZ);
  float inSh = smoothstep(uShadow.x - 14., uShadow.x + 8., c) * (1. - smoothstep(uShadow.y - 8., uShadow.y + 14., c)) * (1. - smoothstep(uShadow.z - 10., uShadow.z + 10., a));
  float bars = smoothstep(.4, .62, vn(vec2(c * .026, a * .0022)) * .62 + vn(vec2(c * .085, a * .004 + 9.)) * .38 + .06);
  float sunOn = bars * (1. - inSh);
  vec3 amb = mix(uGndCol, uSkyCol, n.y * .5 + .5);
  vec3 col = alb * (amb + uSunCol * (max(dot(n, uSunDir), 0.) * .6 + uGraze) * sunOn);
  // the windows' warm spill lies on the gravel no brighter than the stone beside it
  col += alb * spill(vW);
  // mist lies on the lawns in soft round banks with feathered edges, carried west by south on the park's wind
  vec2 mp = p + vec2(uTime * 2.4, -uTime * .6);
  float mb = smoothstep(.3, .82, vn(mp * .019) * .56 + vn(mp * .043 + 7.3) * .3 + vn(mp * .1 + 3.1) * .14);
  // it gathers in the ground's hollows and by the lake and thins away on every rise
  mb *= 1.15 - smoothstep(-.5, 1.7, vW.y);
  // none of it within forty metres of the house, and none on the forecourt's gravel: the forecourt's air is clear
  float hd = length(max(vec2(abs(p.x) - 50.5, max(p.y - 2.5, -88. - p.y)), 0.));
  mb *= smoothstep(40., 66., hd);
  // a bank is lit softly through its whole depth: the sun's bars on the grass never show in it as streaks
  col = mix(col, uMistCol * (1. + .5 * (1. - inSh)), mb * uMistK * (1. - gr));
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

// two small birds under the arch: each a dart of three triangles carried round a closed course by the clock alone
const BIRD_VERT = /* glsl */`
attribute vec4 aBird;
uniform float uTime;
varying float vWing;
${fx.GLSL_FOG_PARS_VERT}
vec3 course(float th, float sx){ return vec3(sx * (2.6 + .8 * cos(th)), 5.5 + 1.3 * sin(th), 2. + 9. * sin(th)); }
void main(){
  float th = uTime * aBird.y + aBird.z;
  // the course is never upright and never at rest; both lengths have a floor all the same
  vec3 c = course(th, aBird.x), f = normalize(course(th + .03, aBird.x) - c + vec3(0., 0., 1e-5));
  vec3 r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), u = cross(r, f);
  float flap = sin(uTime * 31. + aBird.z * 9.) * aBird.w;
  vec3 p = c + r * position.x * (1. - .25 * abs(flap)) + u * (position.y + flap * .16) + f * position.z;
  vWing = aBird.w;
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uSkyCol, uGndCol, uWarm;
varying float vWing;
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec3 col = mix(vec3(.16, .12, .1), vec3(.07, .06, .06), vWing) * (uSkyCol * 1.4 + uGndCol + uWarm * .5);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

// THE PARAPET'S OPENWORK as a coverage map: one module of strapwork 6.4 m long and 2.4 m tall, which repeats along a
// parapet. A rail at head and foot; a post at each end and in the middle; between the posts an oval ring and a lozenge,
// each with a small ring at its heart; a level strap and an upright strap through every heart. Red: how much stone
// covers a place (four readings to a texel); green: the straps' relief (their upper arrises the lighter). Rows y0 to y1.
const STRAP = { w: 512, h: 128, len: 6.4, tall: PARAPET };
function strapField(x, y) {
  const yc = 1.19, ox = x - 1.6, oy = y - yc, lx = Math.abs(x - 4.8), ly = Math.abs(y - yc);
  // the rails, the posts
  let d = Math.min(y - 0.26, 2.12 - y, Math.min(x, STRAP.len - x, Math.abs(x - 3.2)) - 0.13);
  // the oval ring (1.22 by 0.8 m) and the lozenge (1.3 by 0.84 m), straps 0.2 m wide
  const oe = Math.hypot(ox / 1.22, oy / 0.8) || 1e-6;
  d = Math.min(d, Math.abs(oe - 1) / (Math.hypot(ox / 1.4884, oy / 0.64) / oe) - 0.1, Math.abs(lx / 1.3 + ly / 0.84 - 1) * 0.7055 - 0.1);
  // the hearts' small rings; the level and the upright straps, which stop at a heart's ring
  const heart = Math.min(Math.hypot(ox, oy), Math.hypot(lx, ly));
  d = Math.min(d, Math.abs(heart - 0.3) - 0.075);
  if (heart > 0.3) d = Math.min(d, Math.abs(oy) - 0.075, Math.min(Math.abs(ox), lx) - 0.075);
  return d;
}
function strapRows(data, y0, y1) {
  const { w, h, len, tall } = STRAP, sx = len / w, sy = tall / h;
  for (let j = y0; j < y1; j++) for (let i = 0; i < w; i++) {
    let cov = 0, rel = 0;
    for (let k = 0; k < 4; k++) {
      const x = (i + 0.25 + 0.5 * (k & 1)) * sx, y = (j + 0.25 + 0.5 * (k >> 1)) * sy, d = strapField(x, y);
      if (d < 0) { cov++; rel += Math.max(-1, Math.min(1, (strapField(x, y + 0.02) - d) / 0.02)) * Math.max(0, 1 + d / 0.07); }
    }
    const o = (j * w + i) * 4;
    data[o] = Math.round(cov * 63.75); data[o + 1] = Math.round(127.5 + 127.5 * (cov ? rel / cov : 0)); data[o + 2] = 0; data[o + 3] = 255;
  }
}
const PAR_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
// the parapets: the walls' own stone in the walls' own light, as much of it as the map says covers the place
const PAR_FRAG = /* glsl */`
uniform sampler2D uMap;
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
${GL_COMMON}${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec4 t = texture2D(uMap, vUv);
  vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
  vec3 alb = ${V3(HONEY)} * (.88 + .3 * (t.g - .5)) * (.93 + .12 * vn(vW.xz * .4 + vW.y * .7));
  gl_FragColor = vec4(fxApplyFog(alb * stoneLight(n, vW, 1.)), t.r);
}`;

// THE FLAG'S LAW, on the world's clock alone. A place of the cloth is named by how far it lies along the fly (u, 0 at
// the hoist and 1 at the fly's end) and how far up the hoist (v). It lies 0.25 + 7 u metres down the park's wind from
// the staff's axis; across the wind it is thrown u (0.3 + 0.7 u) times [0.48 sin(7.5 u - w1 t + p1) + 0.2 sin(16 u +
// 2.2 v - w2 t + p2)] metres, a ripple that travels from the hoist to the fly; it hangs 0.4 u u lower at the fly, with a
// tremble of 0.08 u of the second ripple. The hoist (u 0) never moves, so the cloth never crosses its staff. The two
// speeds and the two phases are dealt by the flag's own stream.
const FLAG_VERT = /* glsl */`
attribute vec2 aFlag;
uniform float uTime; uniform vec4 uFlagA; uniform vec3 uFlagAt; uniform vec2 uFlagWind;
varying vec3 vW; varying vec3 vN;
${fx.GLSL_FOG_PARS_VERT}
vec3 flagAt(vec2 f){
  float u = f.x, r1 = sin(u * 7.5 - uTime * uFlagA.x + uFlagA.z), r2 = sin(u * 16. + f.y * 2.2 - uTime * uFlagA.y + uFlagA.w);
  float side = u * (.3 + .7 * u) * (.48 * r1 + .2 * r2);
  vec2 xz = uFlagAt.xz + uFlagWind * (.25 + 7. * u) + vec2(-uFlagWind.y, uFlagWind.x) * side;
  return vec3(xz.x, uFlagAt.y + 4.5 * f.y - .4 * u * u + .08 * u * r2, xz.y);
}
void main(){
  vec3 p = flagAt(aFlag);
  // the cloth's own normal from its two neighbours along the fly and up the hoist (neither is ever at the place itself)
  vN = normalize(cross(flagAt(aFlag + vec2(.02, 0.)) - p, flagAt(aFlag + vec2(0., .02)) - p));
  vW = p;
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
// plain cloth of one deep red: the sky's light on either side, the sun on a side turned to it and, thinner, through
// the cloth from behind
const FLAG_FRAG = /* glsl */`
uniform vec3 uFlagCol;
varying vec3 vW; varying vec3 vN;
${GL_COMMON}${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
  float sl = dot(n, uSunDir);
  vec3 amb = mix(uGndCol, uSkyCol, n.y * .5 + .5) + uLowS * max(n.z, 0.) + uLowN * max(-n.z, 0.) + uLowE * max(n.x, 0.) + uLowW * max(-n.x, 0.);
  vec3 col = uFlagCol * (amb * 1.3 + uSunCol * (max(sl, 0.) + .7 * max(-sl, 0.)));
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

// the look of each hour: sky preset and its changes, light, how many windows glow and how hard
const HOURS = {
  dawn: { preset: 'dawn', az: 52, el: 0.9, sky: { zenith: '#0c2666', mid: '#3c64ba', horizon: '#9aa6d2', ground: '#7c88a8', horizonPow: 4.0, midPow: 1.2, scatterColor: '#ff9a5a', scatter: 1.15, scatterPow: 6.5, scatterHigh: 0.02, scatterFall: 6, sunColor: '#ffd9a0', sunSize: 1.7, sunIntensity: 12, sunGlow: 1.0, stars: 0.05,
      clouds: false, clouds2: { lit: '#f29a8c', shade: '#6f78b4', opacity: 0.42, coverage: 0.22 } },
    sun: '#ffc58a', sunK: 1.6, skyL: [0.2, 0.288, 0.555], gndL: [0.118, 0.166, 0.297], hdr: 3.4, lit: 1, fog: [30, 900], graze: 0.5, mist: '#b4c0d4' },
  day: { preset: 'day', az: 96, el: 26, sky: { clouds2: { opacity: 0.3 } },
    sun: '#fff0dc', sunK: 3.0, skyL: [0.23, 0.29, 0.38], gndL: [0.14, 0.15, 0.14], hdr: 1.6, lit: 0.45, fog: [140, 2800], graze: 0.2, mist: '#dfe6ee' },
  golden: { preset: 'goldenHour', az: -48, el: 7, sky: {},
    sun: '#ffc27a', sunK: 2.8, skyL: [0.18, 0.23, 0.38], gndL: [0.13, 0.13, 0.15], hdr: 2.6, lit: 0.8, fog: [80, 1900], graze: 0.4, mist: '#e6d6c4' },
  night: { preset: 'night', az: 140, el: 34, sky: {},
    sun: '#9fb6ff', sunK: 1.0, skyL: [0.08, 0.12, 0.26], gndL: [0.045, 0.06, 0.12], hdr: 3.6, lit: 1, fog: [60, 1500], graze: 0.12, mist: '#5a6c96' },
};

export async function buildHero(ctx, opts = {}) {
  const { core } = ctx, { clamp, lerp, smoothstep } = core;
  // every random stream of this part, by names of its own, taken here in one list
  const stream = (name) => core.makeRng(core.hashSeed('bbb-outside-' + name + ':' + ctx.seed));
  const R = { look: stream('look'), sky: stream('sky'), win: stream('win'), lamp: stream('lamp'), knot: stream('knot'),
    tree: stream('tree'), elm: stream('elm'), deer: stream('deer'), rook: stream('rook'), rook2: stream('rook2'), heron: stream('heron'), mist: stream('mist'), smoke: stream('smoke'),
    lake: stream('lake'), reed: stream('reed'), ray: stream('ray'), birds: stream('birds'), flank: stream('flank'), flame: stream('flame'), far: stream('far'),
    pass: stream('pass'), flag: stream('flag'), cedar: stream('cedar') };
  const noise = core.makeNoise(core.hashSeed('bbb-outside-ground:' + ctx.seed));
  const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
  const hourIn = opts.hour ?? vary.hour;
  const hour = HOURS[hourIn] ? hourIn : 'dawn', H = HOURS[hour];
  // what the seed deals of the look: the sun's bearing, how thick the mist lies, the season, a rose or a gold morning
  const sunAz = H.az + R.look.range(-10, 10), mistK = R.look.range(0, 1), autumn = R.look.chance(0.25), rosy = R.look.range(0, 1);
  const rare = !!vary.rare && hour !== 'night';
  const group = new THREE.Group(); group.name = 'bells-outside';
  const route = core.makePath(ROUTE);

  // ---------------------------------------------------------------- sky and light
  const skyO = { rng: R.sky, preset: H.preset, sunElevation: H.el, sunAzimuth: sunAz, lightElevationMin: 7, ...H.sky };
  if (hour === 'dawn') {
    skyO.scatterColor = rare ? '#ff6a48' : hexOf(new THREE.Color('#ffae62').lerp(new THREE.Color('#ff8a6a'), rosy));
    if (rare) { skyO.sunColor = '#ff5a3a'; skyO.horizon = '#f0a090'; }
  }
  if (hour === 'night') { skyO.bake = true; skyO.renderer = ctx.renderer; }
  const sky = makeSky(skyO);
  group.add(sky.object);
  await ctx.yield();
  const sunDir = sky.lightDirection.clone().normalize();
  const sunFlat = new THREE.Vector2(sky.keyDirection.x, sky.keyDirection.z).normalize();
  const sunCol = new THREE.Color(rare && hour === 'dawn' ? '#ff9a6a' : H.sun);
  const hemiK = 3.6, hemiSky = new THREE.Color().setRGB(H.skyL[0] * Math.PI / hemiK, H.skyL[1] * Math.PI / hemiK, H.skyL[2] * Math.PI / hemiK);
  const hemiGnd = new THREE.Color().setRGB(H.gndL[0] * Math.PI / hemiK, H.gndL[1] * Math.PI / hemiK, H.gndL[2] * Math.PI / hemiK);
  const hemi = new THREE.HemisphereLight(hemiSky, hemiGnd, hemiK);
  const sun = new THREE.DirectionalLight(sunCol, H.sunK);
  sun.position.copy(sunDir).multiplyScalar(600); sun.target.position.set(0, 0, 0);
  group.add(hemi, sun, sun.target);
  const fogNear = H.fog[0], fogFar = lerp(H.fog[1], H.fog[1] * 0.62, mistK);
  const fogColor = sky.fogColor.clone().lerp(new THREE.Color(H.mist), 0.35);
  const env = { sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: hexOf(sunCol), horizon: hexOf(sky.horizonColor), zenith: hexOf(sky.zenithColor), fogColor: hexOf(fogColor), fogNear, fogFar };
  // light uniforms shared by this part's own shaders: the same sun and sky the two lights carry
  const tU = { value: 0 };
  // THE LOW SKY A WALL IS TURNED TO, to the south, east, north and west: the sky's own colour there at two heights low
  // down (3.4 and 11.3 degrees up), mixed with the haze that lies low all round (six parts in ten), and the share of
  // it a wall takes (about a quarter)
  const LOW_SHARE = 0.26, LOW_HAZE = 0.6;
  const lowSky = (dx, dz) => {
    const c = sky.colorAt(new THREE.Vector3(dx, 0.06, dz).normalize(), new THREE.Color()).add(sky.colorAt(new THREE.Vector3(dx, 0.2, dz).normalize(), new THREE.Color()));
    c.multiplyScalar(0.5).lerp(fogColor, LOW_HAZE).multiplyScalar(LOW_SHARE);
    return { value: new THREE.Vector3(c.r, c.g, c.b) };
  };
  const LU = {
    uLowS: lowSky(0, 1), uLowE: lowSky(1, 0), uLowN: lowSky(0, -1), uLowW: lowSky(-1, 0),
    uSunDir: { value: sunDir }, uSunCol: { value: new THREE.Vector3(sunCol.r, sunCol.g, sunCol.b).multiplyScalar(H.sunK / Math.PI) },
    uSkyCol: { value: new THREE.Vector3(...H.skyL) }, uGndCol: { value: new THREE.Vector3(...H.gndL) },
    uWarm: { value: new THREE.Vector3(...lin('#ff9a4a', 0.8 * H.lit + 0.12)) }, uTime: tU, uFlick: { value: new THREE.Vector4(R.flame() * 60, R.flame() * 60, R.flame() * 60, R.flame() * 60) },
  };
  const lampGain = hour === 'day' ? 1.0 : 2.6;

  // ---------------------------------------------------------------- the house, its forecourt and gardens: one mesh; its windows: another
  const b = makeBuilder(), W = [];
  const { ranks, stacks, par, crowns, staff } = buildHouse(b, W);
  const houseTris = b.count;
  await ctx.yield();
  buildForecourt(b, R.knot);
  await ctx.yield();
  const houseGeo = b.build();
  const houseMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), ...LU, uLampGain: { value: lampGain }, uFlick2: { value: new THREE.Vector2(R.pass() * 60, R.pass() * 60) } }, vertexShader: HOUSE_VERT, fragmentShader: HOUSE_FRAG, fog: true });
  const house = new THREE.Mesh(houseGeo, houseMat); house.name = 'house'; house.frustumCulled = false;
  group.add(house);
  let triangles = b.count;
  await ctx.yield();

  // THE STANDING ORDER: the basement ablaze, the state floor mostly lit and unshuttered, the first floor half shuttered,
  // the top floor nearly all shuttered and dark; the turrets' upper storey and the tower dark. Every window draws its
  // four dice, in the order the walls were laid.
  const nW = W.length, wP = new Float32Array(nW * 12), wN = new Float32Array(nW * 12), wUV = new Float32Array(nW * 8), wA = new Float32Array(nW * 16), wB = new Float32Array(nW * 16), wI = [];
  let topLit = 0;
  for (let i = 0; i < nW; i++) {
    const w = W[i], d1 = R.win(), d2 = R.win(), d3 = R.win(), d4r = R.win(), d4 = w.over ? 0.12 : d4r;
    let lit = 0, shut = 0;
    if (w.st === 0) lit = 0.85 + 0.3 * d3;
    else if (w.st === 1) { shut = d1 < 0.04 ? 1 : 0; lit = !shut && d2 < 0.94 * H.lit ? 0.55 + 0.45 * d3 : 0; }
    else if (w.st === 2) { shut = d1 < 0.5 ? 1 : 0; lit = !shut && d2 < 0.64 * H.lit ? 0.45 + 0.45 * d3 : 0; }
    else { shut = d1 < (w.dark ? 0.3 : 0.9) ? 1 : 0; lit = !shut && !w.dark && topLit < 2 && d2 < 0.3 * H.lit ? 0.5 + 0.3 * d3 : 0; if (lit) topLit++; }
    // the room over the arch is always lit: curtains drawn back, a fire just made
    if (w.over) { shut = 0; lit = 1; }
    const nx = -w.tz, nz = w.tx, off = 0.07;
    const c = [[0, w.y0], [w.w, w.y0], [w.w, w.y1], [0, w.y1]], uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    for (let k = 0; k < 4; k++) {
      wP.set([w.x + w.tx * c[k][0] + nx * off, c[k][1], w.z + w.tz * c[k][0] + nz * off], i * 12 + k * 3);
      wN.set([nx, 0, nz], i * 12 + k * 3); wUV.set([uvs[k * 2], uvs[k * 2 + 1]], i * 8 + k * 2);
      wA.set([w.st, d4, w.s, w.w], i * 16 + k * 4); wB.set([w.y1 - w.y0, lit, shut, w.make], i * 16 + k * 4);
    }
    wI.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const winGeo = new THREE.BufferGeometry();
  winGeo.setAttribute('position', new THREE.BufferAttribute(wP, 3)); winGeo.setAttribute('normal', new THREE.BufferAttribute(wN, 3));
  winGeo.setAttribute('uv', new THREE.BufferAttribute(wUV, 2)); winGeo.setAttribute('aA', new THREE.BufferAttribute(wA, 4)); winGeo.setAttribute('aB', new THREE.BufferAttribute(wB, 4));
  winGeo.setIndex(wI);
  const lampU = []; for (let i = 0; i < 6; i++) lampU.push(new THREE.Vector4(-9, 0, 0, 0));
  const glassLo = sky.colorAt(new THREE.Vector3(0, 0.12, 1).normalize()).clone().multiplyScalar(0.32), glassHi = sky.colorAt(new THREE.Vector3(0, 0.75, 0.66).normalize()).clone().multiplyScalar(0.36);
  const winMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), ...LU, uLamp: { value: lampU },
    uGlassLo: { value: new THREE.Vector3(glassLo.r, glassLo.g, glassLo.b) }, uGlassHi: { value: new THREE.Vector3(glassHi.r, glassHi.g, glassHi.b) },
    uShutter: { value: new THREE.Vector3(...lin('#e6dcc4', 0.72)) }, uLampCol: { value: new THREE.Vector3(...lin('#ffab58')) }, uFireCol: { value: new THREE.Vector3(...lin('#ff8a3c')) }, uHdr: { value: H.hdr } },
    vertexShader: WIN_VERT, fragmentShader: WIN_FRAG, fog: true });
  const windows = new THREE.Mesh(winGeo, winMat); windows.name = 'windows'; windows.frustumCulled = false;
  group.add(windows); triangles += nW * 2;
  await ctx.yield();

  // ---------------------------------------------------------------- the pierced parapets: flat panels on every wall head, their openwork in one coverage map
  // The map is filtered through all its smaller copies and blended, never cut at a threshold: far off the openwork
  // thins to an even veil of stone and sky, so it has no edge to flicker. The panels write no depth and are drawn
  // before the smoke and the mists.
  const strapData = new Uint8Array(STRAP.w * STRAP.h * 4);
  for (let j = 0; j < STRAP.h; j += 32) { strapRows(strapData, j, j + 32); await ctx.yield(); }
  const strapTex = new THREE.DataTexture(strapData, STRAP.w, STRAP.h, THREE.RGBAFormat, THREE.UnsignedByteType);
  strapTex.wrapS = THREE.RepeatWrapping; strapTex.wrapT = THREE.ClampToEdgeWrapping; strapTex.magFilter = THREE.LinearFilter; strapTex.minFilter = THREE.LinearMipmapLinearFilter;
  strapTex.generateMipmaps = true; strapTex.anisotropy = 4; strapTex.needsUpdate = true;
  const pP = [], pN = [], pU = [], pI = [];
  const panel = (ax, az, bx, bz, y0, y1, u0, u1) => {
    const L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L, nz = (bx - ax) / L, k = pP.length / 3;
    pP.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y1, az); for (let i = 0; i < 4; i++) pN.push(nx, 0, nz);
    pU.push(u0, 0, u1, 0, u1, 1, u0, 1); pI.push(k, k + 1, k + 2, k, k + 2, k + 3);
  };
  // a run carries whole modules: one to a bay where its wall has bays, else one to about 6.4 m; a short return carries
  // the lozenge's half alone
  for (const [ax, az, bx, bz, top, bays] of par) {
    const n = bays || Math.round(Math.hypot(bx - ax, bz - az) / STRAP.len);
    panel(ax, az, bx, bz, top, top + PARAPET, n >= 1 ? 0 : 0.5, n >= 1 ? n : 1);
  }
  // the small pierced crown round the head of each of the tower's corner turrets: the lozenge's half on each of its
  // eight faces, 1.5 m tall
  for (const [cx, cz] of crowns) for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * 6.2832 + 0.3927, a1 = ((i + 1) / 8) * 6.2832 + 0.3927;
    panel(cx + Math.cos(a1) * 2.3, cz + Math.sin(a1) * 2.3, cx + Math.cos(a0) * 2.3, cz + Math.sin(a0) * 2.3, CROWN_Y, CROWN_Y + 1.5, 0.5, 1);
  }
  const parGeo = new THREE.BufferGeometry();
  parGeo.setAttribute('position', new THREE.Float32BufferAttribute(pP, 3)); parGeo.setAttribute('normal', new THREE.Float32BufferAttribute(pN, 3));
  parGeo.setAttribute('uv', new THREE.Float32BufferAttribute(pU, 2)); parGeo.setIndex(pI);
  const parMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), ...LU, uMap: { value: strapTex } }, vertexShader: PAR_VERT, fragmentShader: PAR_FRAG, fog: true,
    transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const parapet = new THREE.Mesh(parGeo, parMat); parapet.name = 'parapet'; parapet.frustumCulled = false; parapet.renderOrder = 1;
  group.add(parapet); triangles += pI.length / 3;
  await ctx.yield();

  // ---------------------------------------------------------------- the flag on the tower's staff: one plain deep red, 7 m by 4.5 m, flying down the park's wind
  const FLAG_NU = 14, FLAG_NV = 6, fA = [], fPos = [], fI = [], windL = Math.hypot(WIND[0], WIND[1]), hoistY = STAFF_Y - 0.5 - 4.5;
  for (let j = 0; j <= FLAG_NV; j++) for (let i = 0; i <= FLAG_NU; i++) { fA.push(i / FLAG_NU, j / FLAG_NV); fPos.push(staff[0] + (WIND[0] / windL) * 7 * (i / FLAG_NU), hoistY + 4.5 * (j / FLAG_NV), staff[1] + (WIND[1] / windL) * 7 * (i / FLAG_NU)); }
  for (let j = 0; j < FLAG_NV; j++) for (let i = 0; i < FLAG_NU; i++) { const a = j * (FLAG_NU + 1) + i, c = a + FLAG_NU + 1; fI.push(a, a + 1, c + 1, a, c + 1, c); }
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute(fPos, 3)); flagGeo.setAttribute('aFlag', new THREE.Float32BufferAttribute(fA, 2)); flagGeo.setIndex(fI);
  const flagMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), ...LU, uFlagCol: { value: new THREE.Vector3(...lin('#a01624')) },
    uFlagA: { value: new THREE.Vector4(R.flag.range(4.6, 6.0), R.flag.range(8.5, 11), R.flag() * 6.2832, R.flag() * 6.2832) },
    uFlagAt: { value: new THREE.Vector3(staff[0], hoistY, staff[1]) }, uFlagWind: { value: new THREE.Vector2(WIND[0] / windL, WIND[1] / windL) } },
    vertexShader: FLAG_VERT, fragmentShader: FLAG_FRAG, fog: true, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(flagGeo, flagMat); flag.name = 'flag'; flag.frustumCulled = false;
  group.add(flag); triangles += fI.length / 3;
  await ctx.yield();

  // the lamps that travel behind the ranks at walking pace: three on the state floor, two above, one on the top floor.
  // Each keeps to one straight wall, pauses at windows of its own, turns at the wall's ends: a pure course of the world's clock.
  const walls = ranks.filter((q) => q.walked && q.s1 - q.s0 > 12);
  const lamps = [];
  for (const st of [1, 1, 1, 2, 2, 3]) {
    const q = walls[R.lamp.int(0, walls.length - 1)];
    const L = q.s1 - q.s0, seg = []; let t = 0, s = q.s0;
    const go = (to) => { const d = Math.abs(to - s) / 4; if (d > 1e-3) { seg.push([t, t + d, s, to]); t += d; s = to; } };
    const wait = (w) => { seg.push([t, t + w, s, s]); t += w; };
    const stops = []; for (let i = 0, k = R.lamp.int(1, 3); i < k; i++) stops.push([q.s0 + L * R.lamp.range(0.08, 0.92), R.lamp.range(2, 5)]);
    stops.sort((a, c) => a[0] - c[0]);
    for (const [at, w] of stops) { go(at); wait(w); }
    go(q.s1); wait(R.lamp.range(1, 2.5));
    for (const [at, w] of stops.slice().reverse()) { go(at); wait(w * 0.7); }
    go(q.s0); wait(R.lamp.range(1, 2.5));
    lamps.push({ st, seg, period: t, phase: R.lamp() * t });
  }
  const lampAt = (lp, time) => {
    const tt = (time + lp.phase) % lp.period;
    for (const g of lp.seg) if (tt <= g[1]) return g[2] + (g[3] - g[2]) * smoothstep(0, 1, (tt - g[0]) / Math.max(1e-3, g[1] - g[0]));
    return lp.seg[0][2];
  };

  // ---------------------------------------------------------------- the ground: level at the house, rolling gently beyond the balustrade, a basin for the lake
  const lakeE = (x, z) => Math.cbrt(Math.abs((x - LAKE.x) / LAKE.rx) ** 3 + Math.abs((z - LAKE.z) / LAKE.rz) ** 3) + 0.12 * noise.n2(x * 0.017, z * 0.017) + 0.05 * noise.n2(x * 0.06 + 9, z * 0.06);
  // THE CEDAR'S PLACE: the plan's x; from the plan's z north in steps of 1.5 m (thirty at the most) to the first firm
  // ground, where the lake's rim figure is 1.3 and more (at the plan's own z the lake's wet margin lies on every seed).
  // The old tree stands on a low knoll of its own: the lawn is no lower than 0.45 m within 9 m of the trunk, dying
  // away to nothing 26 m out.
  let cedarZ = CEDAR_Z;
  for (let i = 0; i < 30 && lakeE(CEDAR_X, cedarZ) < 1.3; i++) cedarZ -= 1.5;
  const CEDAR = [CEDAR_X, cedarZ];
  const groundY = (x, z) => {
    const dOut = Math.max(Math.abs(x) - 52, z - 50, HN - 8 - z, 0);
    let y = (1.7 * noise.fbm2(x * 0.0058 + 3.1, z * 0.0058 - 7.7, 3) - 0.5 * smoothstep(40, 200, dOut)) * smoothstep(0, 70, dOut);
    // behind the entry and under the high first stretch the lawn never rises: the lens is 28 m up there
    const e = lakeE(x, z);
    y = lerp(y, LAKE_Y + 0.35, smoothstep(1.5, 1.08, e));
    y = lerp(y, LAKE_Y - 3.4, smoothstep(1.06, 0.62, e));
    return lerp(y, Math.max(y, 0.45), smoothstep(26, 9, Math.hypot(x - CEDAR[0], z - CEDAR[1])));
  };
  const lines = (lo, hi, fineLo, fineHi, step) => {
    const out = []; for (let v = fineLo; v <= fineHi + 1e-6; v += step) out.push(v);
    let st = step; for (let v = fineLo - st * 1.3; v > lo; ) { out.unshift(v); st *= 1.3; v -= st; } out.unshift(lo);
    st = step; for (let v = fineHi + st * 1.3; v < hi; ) { out.push(v); st *= 1.3; v += st; } out.push(hi);
    return out;
  };
  const gx = lines(-1500, 1500, -150, 270, 7), gz = lines(-1500, 1500, -90, 270, 7);
  const gP = new Float32Array(gx.length * gz.length * 3), gI = [];
  for (let j = 0, k = 0; j < gz.length; j++) for (let i = 0; i < gx.length; i++, k++) { gP[k * 3] = gx[i]; gP[k * 3 + 1] = groundY(gx[i], gz[j]); gP[k * 3 + 2] = gz[j]; }
  await ctx.yield();
  for (let j = 0; j < gz.length - 1; j++) for (let i = 0; i < gx.length - 1; i++) { const a = j * gx.length + i, c = a + gx.length; gI.push(a, c, a + 1, a + 1, c, c + 1); }
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute('position', new THREE.BufferAttribute(gP, 3)); groundGeo.setIndex(gI); groundGeo.computeVertexNormals();
  // the house's own shadow down the light: its footprint's reach across the light and toward the sun
  let c0 = 1e9, c1 = -1e9, a1 = -1e9;
  for (const [x, z] of [[-TXO, HN - PROUD], [TXO, HN - PROUD], [-TXO, PROUD], [TXO, PROUD]]) { const c = -x * sunFlat.y + z * sunFlat.x, a = x * sunFlat.x + z * sunFlat.y; c0 = Math.min(c0, c); c1 = Math.max(c1, c); a1 = Math.max(a1, a); }
  const lawnHex = autumn ? '#94906a' : '#7c9a76';
  const groundMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), ...LU,
    uLawn: { value: new THREE.Vector3(...lin(lawnHex, 1.2)) }, uLawnDry: { value: new THREE.Vector3(...lin(autumn ? '#a89a6a' : '#98a680', 1.2)) },
    uGravel: { value: new THREE.Vector3(...lin('#cdbf9f', 1.16)) }, uLavender: { value: new THREE.Vector3(...lin('#8a80b4', 0.7)) }, uSoil: { value: new THREE.Vector3(...lin('#5a4a3c', 0.8)) },
    uFrost: { value: new THREE.Vector3(...lin('#dfe8f2', 0.8)) }, uFrostK: { value: rare ? 0.62 : 0 }, uLampCol: { value: new THREE.Vector3(...lin('#ffb866')) },
    uMistCol: { value: new THREE.Vector3(...lin(H.mist, 0.5)) }, uMistK: { value: 0.62 + 0.3 * mistK }, uSunXZ: { value: sunFlat }, uShadow: { value: new THREE.Vector3(c0, c1, a1) }, uGraze: { value: H.graze }, uLampGain: { value: lampGain }, uLakeY: { value: LAKE_Y } },
    vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, fog: true });
  const ground = new THREE.Mesh(groundGeo, groundMat); ground.name = 'ground'; ground.frustumCulled = false;
  group.add(ground); triangles += gI.length / 3;
  await ctx.yield();

  // a wooded ridge closing the south and west at 400 to 700 m; low to the north-east, where the dawn stands
  const rP = [], rC = [], rI = [], ridgeLo = fogColor.clone().lerp(new THREE.Color('#8fa3b4'), 0.5), ridgeHi = new THREE.Color(autumn ? '#6f6a62' : '#4f6a70').lerp(fogColor, 0.25);
  const sunAzR = Math.atan2(sunFlat.x, -sunFlat.y);
  const woodHi = new THREE.Color(autumn ? '#5a4c40' : '#34504c').lerp(fogColor, 0.15);
  for (const [rad, hgt, seedK, wood] of [[640, 62, 1.7, 0], [470, 38, 5.3, 0], [410, 27, 9.1, 1], [345, 21, 13.7, 1]]) {
    const n = wood ? 360 : 180, base = rP.length / 3, top = wood ? woodHi : ridgeHi;
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * 6.2832, x = Math.sin(th) * rad, z = -Math.cos(th) * rad;
      let dAz = Math.abs(th - sunAzR); if (dAz > Math.PI) dAz = 6.2832 - dAz;
      const open = 0.3 + 0.7 * smoothstep(0.35, 1.5, dAz);
      let h = hgt * open * (0.55 + 0.5 * noise.fbm2(Math.sin(th) * 2.2 + seedK, Math.cos(th) * 2.2, 3) + 0.1 * noise.n2(th * 40, seedK));
      // a wood is a row of round crowns with gaps in it, and stands open where the sun's edge is
      if (wood) h = (h * 0.6 + 7 * Math.abs(Math.sin(th * 60 + seedK * 3))) * smoothstep(-0.12, 0.1, noise.fbm2(Math.sin(th) * 5 + seedK, Math.cos(th) * 5, 2)) * smoothstep(0.2, 0.8, dAz);
      rP.push(x, -6, z, x, wood ? Math.max(-6, h) : Math.max(4, h), z);
      rC.push(ridgeLo.r, ridgeLo.g, ridgeLo.b, top.r, top.g, top.b);
      if (i < n) { const a = base + i * 2; rI.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    }
  }
  const ridgeGeo = new THREE.BufferGeometry();
  ridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(rP, 3)); ridgeGeo.setAttribute('color', new THREE.Float32BufferAttribute(rC, 3)); ridgeGeo.setIndex(rI);
  const ridge = new THREE.Mesh(ridgeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, side: THREE.DoubleSide }));
  ridge.name = 'ridge'; ridge.frustumCulled = false; group.add(ridge); triangles += rI.length / 3;
  await ctx.yield();

  // ---------------------------------------------------------------- the lake to the east: wind-rippled (no clean mirror), the first sun's glitter across it
  const lake = Water.makeLake({ rng: R.lake, light: sky, sky, level: LAKE_Y, center: [LAKE.x, LAKE.z], width: LAKE.rx * 2.9, depth: LAKE.rz * 2.9, depthAt: (x, z) => LAKE_Y - groundY(x, z),
    segments: 64, ripple: 2.0, rippleScale: 0.8, glitter: 3.0, shoreFoam: 0.25, foamWidth: 1.5, deep: '#31506e', shallow: '#7f9aa6', band: { color: '#3a4c50', top: '#8a94a0', height: 0.06, amount: 0.6 } });
  lake.object.name = 'lake'; group.add(lake.object); triangles += 64 * 64 * 2;
  await ctx.yield();

  // ---------------------------------------------------------------- trees: one wind, one leaf material
  const wind = flora.makeWind({ direction: WIND, strength: 0.8, speed: 0.8 });
  const leafOpts = { wind, backlight: 1.1, backlightTint: autumn ? '#ffc070' : '#ffe7a0', ambient: 2.4, leafAmbient: 2.6 };
  await flora.prepareLeafTexture(leafOpts, ctx.yield);
  const leafMat = flora.windMaterial(leafOpts);
  await ctx.yield();
  const pal = autumn
    ? [{ leaf: '#b8742c', leafLight: '#e0a040', leafDark: '#6a3c1c' }, { leaf: '#c98a2e', leafLight: '#f0c050', leafDark: '#7a4a1c' }, { leaf: '#a85a26', leafLight: '#d88a3a', leafDark: '#5a2c16' }]
    : [{ leaf: '#3f6f3c', leafLight: '#6f9a52', leafDark: '#1f3a2a' }, { leaf: '#4c7c40', leafLight: '#86ad5c', leafDark: '#24402c' }, { leaf: '#35603a', leafLight: '#5f8a4c', leafDark: '#1b3428' }];
  // THE FORM FOLLOWS THE PLACE, once, at build: a tree or a reed tuft that stands within 60 m of the route's line in plan
  // keeps its full form; one that stands farther off takes the lighter form of its own kind, for good. The elms' belt
  // stands 250 m and more from the line by its place, so the elm has the lighter form only.
  const FULL_WITHIN = 60, lineDist = (x, z) => route.nearestXZ(x, z).dist;
  const tg = [], tgFar = [], willowLeaf = autumn ? '#b8a040' : '#7f9f58', reedLeaf = autumn ? '#9a8a4a' : '#6a8a4a';
  tg.push(flora.oakGeometry({ rng: R.tree, height: 21, detail: 1, ...pal[0] })); await ctx.yield();
  tg.push(flora.oakGeometry({ rng: R.tree, height: 24, detail: 1, fullness: 1.2, ...pal[1] })); await ctx.yield();
  tg.push(flora.oakGeometry({ rng: R.tree, height: 18, detail: 1, fullness: 0.9, ...pal[2] })); await ctx.yield();
  tg.push(flora.oakGeometry({ rng: R.elm, height: 34, detail: 0, fullness: 0.8, ...pal[2] })); await ctx.yield();
  tg.push(flora.willowGeometry({ rng: R.reed, height: 15, detail: 1, leaf: willowLeaf })); await ctx.yield();
  // the lighter forms, from a stream of their own: the three oaks, the willow, the reed tuft (the elm's is its only one)
  tgFar.push(flora.oakGeometry({ rng: R.far, height: 21, detail: 0, ...pal[0] }));
  tgFar.push(flora.oakGeometry({ rng: R.far, height: 24, detail: 0, fullness: 1.2, ...pal[1] }));
  tgFar.push(flora.oakGeometry({ rng: R.far, height: 18, detail: 0, fullness: 0.9, ...pal[2] })); await ctx.yield();
  tgFar.push(tg[3], flora.willowGeometry({ rng: R.far, height: 15, detail: 0, leaf: willowLeaf }));
  const reedFar = flora.reedGeometry({ rng: R.far, blades: 6, cattails: 1, leaf: reedLeaf });
  await ctx.yield();
  // a form's full reach in plan: its farthest branch from its own trunk's foot, whichever way the tree is turned
  const reachOf = (g) => { const p = g.attributes.position; let m = 0; for (let i = 0; i < p.count; i++) m = Math.max(m, Math.hypot(p.getX(i), p.getZ(i))); return m; };
  const treeR = tg.map(reachOf), treeRFar = tgFar.map(reachOf);
  // THE RULES EVERY CLUMP TREE KEEPS, in metres: 17.5 m and its crown's reach from the route's line in plan; out of the
  // lake; clear of the house and forecourt (their box is the turrets' outer faces, x 50.5 either side and z -90.5, with
  // 8 m, and the balustrade z 46 with 6 m); 24 m and its crown from the herd's ground; 30 m and its crown from the
  // cedar's trunk; and, from EVERY eye along the approach (the route every 2.5 m from the design's entry to the steps'
  // foot, z 8), not between that eye and the house's front, and not across the sun's disc. One rule for all, tested at
  // every eye alike.
  // THE DISC is asked about as the sky draws it: along the sky's own direction to the sun, which keeps the hour's own
  // height (the light's direction and the key's are both lifted off the horizon and are not asked), with the sky's own
  // radius. A CROWN is counted at its full reach: its farthest branch, the lean the scatter may give the tree (its tilt
  // about two axes) and half the eyes' step; its top at the scatter's tallest stretch.
  const treeH = [21, 24, 18, 34, 15], eyes = [], EYE_STEP = 2.5, LEAN = 0.05, STRETCH = 0.15, STEPS_Z = 8, HOUSE_BOX = TXO + 8;
  for (let d = 60; d < route.length; d += EYE_STEP) { const q = route.pointAt(d / route.length); if (q.z < STEPS_Z) break; eyes.push([q.x, q.y, q.z]); }
  const fanSide = (x, z, ax, az, bx, bz) => (bx - ax) * (z - az) - (bz - az) * (x - ax);
  const discD = sky.sunDirection, discFlat = new THREE.Vector2(discD.x, discD.z).normalize();
  const discEl = Math.asin(clamp(discD.y / Math.max(discD.length(), 1e-6), -1, 1)), discR = (sky.options.sunSize * Math.PI) / 180;
  const beforeFront = (x, z, m) => {
    for (const e of eyes) if (z > -5 && z < e[2] && fanSide(x, z, e[0], e[2], -HOUSE_BOX - m, 0) > 0 && fanSide(x, z, HOUSE_BOX + m, 0, e[0], e[2]) > 0) return true;
    return false;
  };
  const acrossSun = (x, z, rad, top) => {
    const topMax = top * (1 + STRETCH / 2), reach = rad + Math.SQRT2 * LEAN * topMax + EYE_STEP / 2;
    for (const e of eyes) {
      const dx = x - e[0], dz = z - e[2], d = Math.hypot(dx, dz);
      if (d <= reach) return true;
      const off = Math.acos(clamp((dx * discFlat.x + dz * discFlat.y) / d, -1, 1)), h = topMax - e[1];
      // the crown's top rises highest over an eye below it from its near edge, and sinks least under an eye above it from its far edge
      if (off < Math.asin(reach / d) + discR && Math.atan2(h, h > 0 ? d - reach : d + reach) > discEl - discR) return true;
    }
    return false;
  };
  const treeClear = (x, z, v, s) => {
    const dl = lineDist(x, z), rad = (dl > FULL_WITHIN ? treeRFar : treeR)[v] * s;
    if (dl < 17.5 + rad) return false;
    if (lakeE(x, z) < 1.2) return false;
    if (Math.abs(x) < HOUSE_BOX + rad && z < 52 + rad && z > HN - PROUD - 8 - rad) return false;
    if (Math.hypot(x - HERD[0], z - HERD[1]) < 24 + rad) return false;
    if (Math.hypot(x - CEDAR[0], z - CEDAR[1]) < 30 + rad) return false;
    return !beforeFront(x, z, rad + 6) && !acrossSun(x, z, rad, treeH[v] * s);
  };
  // THE PARK'S COUNT, rules of the planting that cap the seed's densest deals: beside the approach eleven places for a
  // clump (times the seed's density and the device's detail) of three to seven trees, at most 36 trees standing in
  // them; in the park beyond them thirty places (times the same) of three to five trees, at most 40 standing; and of
  // all the clumps' trees at most 24 within 60 m of the route's line, where a tree keeps its full form. A tree past a
  // cap does not stand.
  const pts = [], mids = [], CAP = { approach: 36, park: 40, full: 24 }, lush = density * (0.8 + 0.2 * detail);
  let nApproach = 0, nPark = 0, nFull = 0, nElm = 0;
  // every tree is planted here: it carries its own distance from the route's line, by which the scatter picks its form
  const plant = (x, z, v, s, rot) => { const d = lineDist(x, z); pts.push({ x, y: groundY(x, z), z, s, rot, v, d, u: 0 }); if (d <= FULL_WITHIN) nFull++; };
  const fullCapped = (x, z) => nFull >= CAP.full && lineDist(x, z) <= FULL_WITHIN;
  // THE CLUMPS BESIDE THE APPROACH: loose clumps beside the route's first straight and its line behind the entry, from
  // 24 m south of the forecourt's balustrade (z 70) out, never in a line
  for (let i = 0, nClump = Math.round(11 * lush); i < nClump; i++) {
    // every clump draws all its dice, admitted or not
    const side = R.tree() < 0.5 ? -1 : 1, czr = R.tree(), cxr = R.tree(), n = R.tree.int(3, 7), dice = [];
    for (let k = 0; k < 7; k++) dice.push([R.tree(), R.tree(), R.tree(), R.tree(), R.tree()]);
    // a clump stands to one side of the route's line: 34 m off it and more, nearer ones likelier
    const cz = 74 + 190 * czr * czr, lineX = ENTRY[0] - (cz - ENTRY[2]) * 0.7002;
    const cx = lineX + side * (34 + 150 * cxr * cxr);
    let stood = 0;
    for (let k = 0; k < n; k++) {
      const d = dice[k], ang = d[0] * 6.2832, rr = 6 + 20 * Math.sqrt(d[1]), v = Math.floor(d[2] * 3), s = 0.82 + 0.4 * d[3];
      const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr * 0.8;
      if (nApproach >= CAP.approach || z < 70 || fullCapped(x, z) || !treeClear(x, z, v, s)) continue;
      plant(x, z, v, s, d[4] * 6.2832); nApproach++; stood++;
    }
    if (stood) mids.push([cx, cz]);
  }
  const clumpsApproach = mids.length;
  // THE PARK'S FURTHER CLUMPS: one scatter over the whole park, with no ground marked out for it. Every place draws a
  // bearing, a reach, a count and its trees' dice, whether a clump stands there or not. Of every five places three are
  // laid ROUND THE HOUSE: the bearing all round the great tower's middle (x 0, z -19), the reach even over the ground out to
  // 35 m short of the elms' belt (the belt's own depth of 15 m and a clump's spread of 20 m). Two of every five are laid
  // BY THE WATER: the bearing all round the lake's middle, out to the water's edge (found from the ground's own height,
  // as the willows find it) and beyond it by a clump's spread and up to 25 m more. A place nearer than 52 m (twice the
  // widest clump's spread of 26 m) to the middle of a clump that stands already stays empty; every tree keeps the one
  // rule above, which alone says what ground is closed to it.
  const TOWER_MID = [0, (TOWER.z0 + TOWER.z1) / 2], BELT_R = 270, PARK_R = BELT_R - 35, CLUMP_APART = 52, PARK_PLACES = 30;
  const edgeFrom = (bear) => { let r = 0; while (r < 300 && groundY(LAKE.x + Math.sin(bear) * r, LAKE.z - Math.cos(bear) * r) < LAKE_Y + 0.25) r += 1.5; return r; };
  for (let i = 0, nPlace = Math.round(PARK_PLACES * lush); i < nPlace; i++) {
    const bear = R.flank() * 6.2832, reach = R.flank(), n = 3 + Math.floor(R.flank() * 3), dice = [];
    for (let k = 0; k < 5; k++) dice.push([R.flank(), R.flank(), R.flank(), R.flank(), R.flank()]);
    const byWater = i % 5 >= 3, from = byWater ? [LAKE.x, LAKE.z] : TOWER_MID, dist = byWater ? edgeFrom(bear) + 20 + 25 * reach : PARK_R * Math.sqrt(reach);
    const cx = from[0] + Math.sin(bear) * dist, cz = from[1] - Math.cos(bear) * dist;
    let crowded = false, stood = 0;
    for (const m of mids) if (Math.hypot(cx - m[0], cz - m[1]) < CLUMP_APART) crowded = true;
    for (let k = 0; k < n; k++) {
      const d = dice[k], ang = d[0] * 6.2832, rr = 5 + 15 * Math.sqrt(d[1]), v = Math.floor(d[2] * 3), s = 0.9 + 0.4 * d[3];
      const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr * 0.8;
      if (crowded || nPark >= CAP.park || fullCapped(x, z) || !treeClear(x, z, v, s)) continue;
      plant(x, z, v, s, d[4] * 6.2832); nPark++; stood++;
    }
    if (stood) mids.push([cx, cz]);
  }
  const clumpsPark = mids.length - clumpsApproach;
  // THE ELMS: the park's north-east belt, a loose line 330 m long lying square to the dawn's bearing of the design (52
  // degrees east of north) 270 m from the great tower's middle. Twenty-two places 15 m apart, each drawing all its dice; after
  // every run of two to four elms one or two places stand empty, along the whole line. Such a gap thins the line more
  // than it opens it: the trunks either side stand 30 or 45 m apart, give or take the places' own 7 m, and an elm's
  // crown reaches 14 to 33 m from its trunk by seed and size (counted on seeds 1 to 40). The line's one sure opening
  // is the sun's: every elm keeps the clumps' rule of the sun, so none stands across the disc from any eye of the
  // approach, its crown counted at its full reach.
  const eAz = (52 * Math.PI) / 180, eB = [Math.sin(eAz), -Math.cos(eAz)], eC = [TOWER_MID[0] + eB[0] * BELT_R, TOWER_MID[1] + eB[1] * BELT_R], eP = [-eB[1], eB[0]];
  for (let i = 0, run = 0, gap = 0; i < 22; i++) {
    const d = [R.elm(), R.elm(), R.elm(), R.elm(), R.elm()];
    if (gap > 0) { gap--; continue; }
    if (run >= 4 || (run >= 2 && d[4] < 0.45)) { run = 0; gap = d[0] < 0.5 ? 0 : 1; continue; }
    run++;
    const t = (i - 10.5) * 15 + (d[0] - 0.5) * 7, back = (d[1] - 0.5) * 30, x = eC[0] + eP[0] * t + eB[0] * back, z = eC[1] + eP[1] * t + eB[1] * back, s = 0.9 + 0.35 * d[2];
    if (acrossSun(x, z, treeR[3] * s, treeH[3] * s)) continue;
    plant(x, z, 3, s, d[3] * 6.2832); nElm++;
  }
  // two willows on the lake's near shore
  const shoreAt = (z) => { let x = LAKE.x; while (x > -40 && groundY(x, z) < LAKE_Y + 0.25) x -= 1.5; return x; };
  for (const z of [LAKE.z - 34 + R.reed.range(-8, 8), LAKE.z + 30 + R.reed.range(-8, 8)]) { const x = shoreAt(z) - 4; plant(x, z, 4, R.reed.range(1.25, 1.6), R.reed() * 6.2832); }
  await ctx.yield();
  const shadowSun = new THREE.Vector3(sunFlat.x, 0.9, sunFlat.y).normalize();
  const trees = flora.makeScatter({ rng: R.tree, points: pts, variants: tg, farVariants: tgFar, farDistance: FULL_WITHIN, material: leafMat, heightAt: groundY, tint: 0.2, hue: 0.05, stretch: STRETCH, tilt: LEAN, sink: 0.01,
    groundShadow: { sunDir: [shadowSun.x, shadowSun.y, shadowSun.z], strength: 0.42, color: '#22304a', size: 1.25 } });
  trees.object.name = 'trees'; group.add(trees.object); triangles += trees.triangles;
  await ctx.yield();
  // THE CEDAR stands alone on the east lawn: a scatter of one on the cedar's own stream, upright, of its full size,
  // untinted; its plates stir on the park's wind like every leaf
  const cedarGeo = cedarGeometry(R.cedar);
  await ctx.yield();
  const cedar = flora.makeScatter({ rng: R.cedar, points: [{ x: CEDAR[0], y: groundY(CEDAR[0], CEDAR[1]), z: CEDAR[1], s: 1, rot: 0, v: 0, d: lineDist(CEDAR[0], CEDAR[1]), u: 0 }], variants: [cedarGeo],
    material: leafMat, heightAt: groundY, tint: 0, hue: 0, stretch: 0, tilt: 0, sink: 0, groundShadow: { sunDir: [shadowSun.x, shadowSun.y, shadowSun.z], strength: 0.42, color: '#22304a', size: 1.25 } });
  cedar.object.name = 'cedar'; group.add(cedar.object); triangles += cedar.triangles;
  await ctx.yield();
  // reeds along the near shore, in tufts; each tuft's form by its own distance from the route's line, like a tree's
  const reedPts = [];
  for (let i = 0, n = Math.round(16 * density); i < n; i++) {
    const z0 = LAKE.z - 85 + (170 * (i + R.reed())) / n, x0 = shoreAt(z0) + 1.2, k = R.reed.int(4, 8);
    for (let j = 0; j < 8; j++) {
      const dx = R.reed.range(-0.5, 3.2), dz = R.reed.range(-3.5, 3.5), sc = R.reed.range(1.5, 2.3), rot = R.reed() * 6.2832;
      if (j < k) reedPts.push({ x: x0 + dx, y: Math.max(groundY(x0 + dx, z0 + dz), LAKE_Y - 0.35), z: z0 + dz, s: sc, rot, v: 0, d: lineDist(x0 + dx, z0 + dz), u: 0 });
    }
  }
  const reeds = flora.makeScatter({ rng: R.reed, points: reedPts, variants: [flora.reedGeometry({ rng: R.reed, leaf: reedLeaf })], farVariants: [reedFar], farDistance: FULL_WITHIN, material: leafMat, tint: 0.15, sink: 0 });
  reeds.object.name = 'reeds'; group.add(reeds.object); triangles += reeds.triangles;
  await ctx.yield();

  // ---------------------------------------------------------------- life: deer by the lake's west shore, a heron in the shallows, rooks over the roofs
  const fl = { sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: hexOf(sunCol), sunIntensity: H.sunK, sky: hexOf(hemiSky), skyIntensity: hemiK, ground: hexOf(hemiGnd), groundIntensity: hemiK };
  const herd = F.makeHerd({ rng: R.deer, species: 'deer', count: Math.max(7, Math.round(11 * density)), size: 2.1, center: [HERD[0], 0, HERD[1]], radius: 15, heightAt: groundY, light: fl, path: route, clear: 25, maxSigma: 3 });
  herd.object.name = 'deer'; group.add(herd.object); triangles += herd.triangles || 0;
  await ctx.yield();
  const hz = LAKE.z - 6 + R.heron.range(-14, 14), hx = shoreAt(hz) + 3.2;
  const heron = F.makeWaders({ rng: R.heron, species: 'heron', count: 1, positions: [[hx, LAKE_Y, hz]], level: LAKE_Y, size: 2.3, light: fl, heightAt: groundY });
  heron.object.name = 'heron'; group.add(heron.object); triangles += heron.triangles || 0;
  await ctx.yield();
  // THE TOWER'S ROOKS wheel about the great tower's top: their course is centred on the tower's middle, 30 to 50 m out
  // (a loop of 48.5 m give or take three in a hundred, which the kit may flatten to 0.65 one way) and 50 to 75 m up
  // (62.5 give or take 10 and a fifth more). They fly strung out along the course and close to it (4 m either side
  // at the bell curve's three scatters, a wander of 1.5 m), so that no rook comes within the tower's corner turrets
  // (21 m from its middle).
  const rooks = await F.makeFlockAsync({ rng: R.rook, species: 'crows', count: Math.max(30, Math.round(34 * density)), size: 2.2, center: [0, 62.5, (TOWER.z0 + TOWER.z1) / 2], radius: 62, wobble: 0.03, height: 10,
    spread: [3, 6, 70], light: fl, maxSigma: 3, wander: [1, 1.5, 1, 0.5], keepClear: { path: route, dist: 2.6, each: true } }, ctx.yield);
  rooks.object.name = 'rooks'; group.add(rooks.object); triangles += rooks.triangles || 0;
  await ctx.yield();
  const rooks2 = await F.makeFlockAsync({ rng: R.rook2, species: 'crows', count: Math.round(9 * density), size: 1.9, center: [-150, 46, 30], radius: 50, light: fl, maxSigma: 3, wander: [5, 2, 4, 0.5],
    keepClear: { path: route, dist: 2.6, each: true } }, ctx.yield);
  rooks2.object.name = 'rooks2'; group.add(rooks2.object); triangles += rooks2.triangles || 0;
  await ctx.yield();

  // ---------------------------------------------------------------- air: mist in the hollows and on the lake, smoke in its order, the first shafts, the lanterns
  const fogGround = (x, z) => groundY(x, z) + 16 * (1 - smoothstep(0, 70, Math.max(Math.abs(x) - 62, z - 58, -95 - z, 0)));
  const mistCol = new THREE.Color(H.mist).lerp(fogColor, 0.3);
  const gfog = fx.makeGroundFog({ time: tU, heightAt: fogGround, mode: 'pool', center: [40, 0, 130], size: 940, segments: 36, layers: 6, y: -2.6, height: 6.5 + 4 * mistK, color: mistCol,
    opacity: 0.07 + 0.05 * mistK, coverage: 0.42, scale: 0.007, wind: [-1.2, 0.5], sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: hexOf(sunCol), scatter: 0.7 });
  gfog.object.name = 'groundfog'; group.add(gfog.object); triangles += gfog.triangles;
  await ctx.yield();
  const mist = fx.makeMist({ rng: R.mist, time: tU, count: Math.round((64 + 40 * mistK) * detail), area: [600, 2, 278], center: [70, 1.2, 211], size: [14, 28], color: mistCol, opacity: 0.11 + 0.06 * mistK, drift: [-2.2, 0, 0.55],
    softness: 1.0, ragged: 0.7 });
  mist.object.name = 'mist'; group.add(mist.object); triangles += 140;
  await ctx.yield();
  // THE STACKS SAY THE SAME, west to east: the two over the kitchens pour thick lit smoke, the two behind the tower's
  // back send thin new threads, the two to the east stand cold. THE WIND'S BEARING is the park's own on every seed
  // (west by south: one west, 0.22 south): smoke leaves a western stack away from the tower, and a thread behind the
  // tower's back drifts on behind it; the eastern stacks, whose smoke alone would cross the tower, are the cold ones.
  const smokes = [], order = stacks.slice().sort((a, c) => a.x - c.x);
  for (let i = 0; i < 4; i++) {
    const st = order[i], thick = i < 2, top = st.top;
    const sm = fx.makeSmokeColumn({ rng: R.smoke, time: tU, position: [top[0], top[1] + 0.3, top[2]], height: thick ? R.smoke.range(30, 38) : R.smoke.range(18, 24),
      radius: thick ? [0.7, 5.5] : [0.2, 1.6], size: thick ? [2.6, 12] : [0.8, 3.6], count: Math.round((thick ? 110 : 30) * (0.7 + 0.3 * detail)),
      color: thick ? '#807c9c' : '#908cac', colorTop: '#dcae9e', shadowColor: '#454a74', ambient: '#363c62', opacity: thick ? 0.52 : 0.32, softness: 1.0, ragged: thick ? 0.8 : 0.55, billow: thick ? 0.1 : 0.06, frequency: 1.2, rotSpeed: thick ? 0.45 : 0.2, rate: thick ? 0.058 : 0.05,
      wind: [-1, 0, 0.22], bend: thick ? 2.8 : 2.1, rim: 1.5, scatter: 1.1, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: hexOf(sunCol) });
    sm.object.name = 'smoke' + i; group.add(sm.object); smokes.push(sm); triangles += 2 * (thick ? 110 : 30);
  }
  await ctx.yield();
  // the first shafts lie across the lawns' mist south of the forecourt: the bundle is 14 m in radius and its widest
  // shaft reaches 19.2 m from its own middle, so the bundle's axis passes 73.2 m from the front's corner on its own
  // side: no shaft's edge comes within forty metres of any stone of the south front, at any hour
  const tr = [-sunFlat.x, -sunFlat.y], pe = [-tr[1], tr[0]], peS = pe[1] > 0 ? 1 : -1, RAY_R = 14, RAY_W = 12, RAY_OFF = 40 + RAY_R + RAY_W * 1.6;
  const rayX = (pe[0] * peS > 0 ? 1 : -1) * TXO;
  const rays = fx.makeGodRays({ rng: R.ray, time: tU, position: [rayX + sunFlat.x * 80 + pe[0] * peS * RAY_OFF, 21, PROUD + sunFlat.y * 80 + pe[1] * peS * RAY_OFF], direction: [tr[0], -0.05, tr[1]], radius: RAY_R,
    count: Math.round(11 * detail), length: 330, width: [4, RAY_W], color: rare ? '#ff9a70' : '#ffd9a0', intensity: hour === 'night' ? 0.05 : 0.2, falloff: 1.0, fogAmount: 0.4 });
  rays.object.name = 'shafts'; group.add(rays.object); triangles += 22;
  await ctx.yield();

  // two small birds dart in and out under the entrance arch, one on each side of the way, each round a closed course of
  // its own: through the arch's mouth (z 2) 9 m each way, 2.6 m off the way's middle give or take 0.8, 5.5 m up give or
  // take 1.3 (1.2 m and more over the state floor within), its tangent never upright. Each takes its speed and its
  // phase from the birds' own stream.
  const birdCourse = (th, sx) => [sx * (2.6 + 0.8 * Math.cos(th)), 5.5 + 1.3 * Math.sin(th), 2 + 9 * Math.sin(th)];
  const bP = [], bA = [], birdPlaces = [];
  const birdKinds = [[1, R.birds.range(0.95, 1.35), R.birds() * 6.2832], [-1, R.birds.range(0.95, 1.35), R.birds() * 6.2832]];
  const birdTri = [[0, 0, 0.21, 0], [-0.045, 0, -0.21, 0], [0.045, 0, -0.21, 0], [-0.03, 0.01, 0.1, 0], [-0.03, 0.01, -0.07, 0], [-0.31, 0.01, -0.04, 1], [0.03, 0.01, 0.1, 0], [0.03, 0.01, -0.07, 0], [0.31, 0.01, -0.04, 1]];
  for (const [sx, speed, phase] of birdKinds) {
    for (const v of birdTri) { bP.push(v[0], v[1], v[2]); bA.push(sx, speed, phase, v[3]); }
    for (let th = 0; th < 6.2832; th += 0.07) birdPlaces.push(birdCourse(th, sx));
  }
  const birdGeo = new THREE.BufferGeometry();
  birdGeo.setAttribute('position', new THREE.Float32BufferAttribute(bP, 3)); birdGeo.setAttribute('aBird', new THREE.Float32BufferAttribute(bA, 4));
  const birdMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), ...LU }, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide });
  const birds = new THREE.Mesh(birdGeo, birdMat); birds.name = 'archbirds'; birds.frustumCulled = false; group.add(birds); triangles += 6;
  const movers = [lake, trees, cedar, reeds, herd, heron, rooks, rooks2, gfog, mist, rays, ...smokes];
  // THE PART AS DRAWN: every mesh of the group once (a draw call each), its triangles by its own count and the number
  // of its instances. This reckoning stands for the running one above (which misses the kit's shadows under the trees).
  let drawCalls = 0; triangles = 0;
  group.traverse((m) => {
    if (!m.geometry) return;
    const g = m.geometry, inst = m.isInstancedMesh ? m.count : (g.isInstancedBufferGeometry ? g.instanceCount : 1);
    drawCalls++; triangles += Math.floor((g.index ? g.index.count : g.attributes.position.count) / 3) * (Number.isFinite(inst) ? inst : 1);
  });
  // plain facts that the builder's count reads (the laid trees with the crown each was reckoned by, how many clumps and
  // trees stand, the flocks' own reports, the birds' courses); nothing in flight reads them
  group.userData.count = { trees: pts.map((q) => [q.x, q.z, (q.d > FULL_WITHIN ? treeRFar : treeR)[q.v] * q.s]), clumps: [clumpsApproach, clumpsPark], stand: [nApproach, nPark, nElm, nFull],
    kept: [rooks.kept, rooks2.kept], birds: birdPlaces, triangles,
    house: [houseTris, b.count - houseTris, nW * 2, pI.length / 3, fI.length / 3], cedar: [CEDAR[0], CEDAR[1], cedarGeo.userData.radius, cedarGeo.userData.height, cedarGeo.userData.triangles], disc: [discFlat.x, discFlat.y, discEl, discR], eyes };
  return {
    object: group,
    lights: [hemi, sun],
    lightBase: [hemiK, H.sunK],
    env,
    anchors: { front: [0, 30, TOWER.z0], door: [0, 9.6, -11] },
    update(dt, time, camera) {
      tU.value = time;
      sky.update(dt, time, camera);
      for (let i = 0; i < lamps.length; i++) lampU[i].set(lamps[i].st, lampAt(lamps[i], time), 1, 0);
      for (const m of movers) m.update(dt, time, camera);
    },
    dispose() { sky.dispose?.(); },
    triangles, drawCalls,
  };
}
