// HERO SET PIECE for "island-that-shades-the-fields": the astronomers' cave with the lodestone, and the island's
// measures and flight (the world and the camera script both take them from here).
//
// WHAT THE CAVE IS
//   A closed dome of polished dark adamant, 110 m in radius at the floor and 66 m high. It stands to one side under
//   the island: the well (the chasm) comes down through its flank, and the dome is not drawn inside the well's round.
//   In its middle a hoop of blue adamant, 26 m in radius, stands 20 m up on eight feet; an axle of pale metal crosses
//   the hoop and on it a dark red polished shuttle of stone, 24 m long and 11 m thick, plays a few degrees each way.
//   Twenty lamps hang on chains from standards on a ring gallery; every facet of the dome holds their images again,
//   small and sharp (a second sky). Brass instruments stand on the floor, some of them great ones, with astronomers
//   at them; people stand along the gallery's rail; stores lie at the gallery's face; four stairs lead up to the
//   gallery, and one long stair comes down the dome's wall from the well's landing. As the stone tilts, the pendulums
//   and the flames lean with it and the images in the dome slide.
//
// LOCAL SPACE   origin = the middle of the cave's floor (under the stone), +Y up. The axle runs along X, the stone's
//   long axis along Z. The flight's last straight comes in from +Z along x = 0 to the ring's seat on the -Z side.
//
// LIGHT   self-lit ShaderMaterials: the ring of lamps (warm), the well's light (cool, a pool under its foot) and the
//   portal's ring; they ignore the scene's lights and fog. What moves runs on the world clock.
//
// ALSO HERE, for the world and for shots/island-that-shades-the-fields/camcheck.mjs: makeGeo (a geometry accumulator),
// ISLE and CAVE (measures), PACE with turnR and bendR (the declared pacing and the one radius rule), layRoute,
// routePoints and makeFlight (the route by geometry, the places in metres flown, the pacing and the gaze), and a few
// colour helpers.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { makeGlows } from '../kit/fx.js';

const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mulc = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- geometry accumulator: position, normal, colour, kind
// kind (one float a vertex): 0 matte, 1 metal (copper, brass), 2 lamp (glows), 3 adamant (dark mirror), 4 water
export function makeGeo() {
  const P = [], N = [], C = [], K = [];
  let col = [1, 1, 1], kind = 0;
  const stack = [new THREE.Matrix4()];
  const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  const G = {
    get triangles() { return P.length / 9; },
    col(c, k = 1) { col = [c[0] * k, c[1] * k, c[2] * k]; return G; },
    kind(k) { kind = k; return G; },
    push(m) { stack.push(stack[stack.length - 1].clone().multiply(m)); return G; },
    tr(x, y, z, ry = 0, s = 1) { return G.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s))); },
    pop() { stack.pop(); return G; },
    // one vertex with its own normal (local to the current transform)
    v(p, n, c = col) {
      const m = stack[stack.length - 1];
      _p.set(p[0], p[1], p[2]).applyMatrix4(m); _n.set(n[0], n[1], n[2]).transformDirection(m);
      P.push(_p.x, _p.y, _p.z); N.push(_n.x, _n.y, _n.z); C.push(c[0], c[1], c[2]); K.push(kind);
    },
    // flat triangle and quad (corners counter-clockwise seen from outside)
    tri(a, b, c, ca = col, cb = col, cc = col) {
      _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _b.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); _c.crossVectors(_a, _b);
      if (_c.lengthSq() < 1e-12) return G;
      _c.normalize(); const n = [_c.x, _c.y, _c.z];
      G.v(a, n, ca); G.v(b, n, cb); G.v(c, n, cc); return G;
    },
    quad(a, b, c, d, c0 = col, c1 = c0) { G.tri(a, b, c, c0, c0, c1); G.tri(a, c, d, c0, c1, c1); return G; },
    // a six-faced solid from its eight corners: bottom ring p[0..3] (counter-clockwise seen from above), top ring p[4..7]
    // over them; top colour may differ (roof, turf)
    hexa(p, cTop = col, cSide = col, bottom = false) {
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; G.quad(p[i], p[j], p[4 + j], p[4 + i], cSide); }
      G.quad(p[4], p[5], p[6], p[7], cTop);
      if (bottom) G.quad(p[3], p[2], p[1], p[0], cSide);
      return G;
    },
    box(x0, y0, z0, x1, y1, z1, cTop = col) {
      return G.hexa([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], cTop, col, true);
    },
    // a round bar from a to b (radii ra, rb), smooth
    bar(a, b, ra, rb = ra, seg = 8, caps = false) {
      _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _a.length(); if (L < 1e-6) return G;
      _a.divideScalar(L); _b.set(Math.abs(_a.y) < 0.9 ? 0 : 1, Math.abs(_a.y) < 0.9 ? 1 : 0, 0); _c.crossVectors(_a, _b).normalize(); _b.crossVectors(_c, _a);
      const ax = [_a.x, _a.y, _a.z], u = [_c.x, _c.y, _c.z], w = [_b.x, _b.y, _b.z], sl = (ra - rb) / L;
      const ring = (i) => { const t = i / seg * TAU, cs = Math.cos(t), sn = Math.sin(t); return [u[0] * cs + w[0] * sn, u[1] * cs + w[1] * sn, u[2] * cs + w[2] * sn]; };
      for (let i = 0; i < seg; i++) {
        const d0 = ring(i), d1 = ring(i + 1);
        const n0 = [d0[0] + ax[0] * sl, d0[1] + ax[1] * sl, d0[2] + ax[2] * sl], n1 = [d1[0] + ax[0] * sl, d1[1] + ax[1] * sl, d1[2] + ax[2] * sl];
        const a0 = [a[0] + d0[0] * ra, a[1] + d0[1] * ra, a[2] + d0[2] * ra], a1 = [a[0] + d1[0] * ra, a[1] + d1[1] * ra, a[2] + d1[2] * ra];
        const b0 = [b[0] + d0[0] * rb, b[1] + d0[1] * rb, b[2] + d0[2] * rb], b1 = [b[0] + d1[0] * rb, b[1] + d1[1] * rb, b[2] + d1[2] * rb];
        G.v(a0, n0); G.v(b0, n0); G.v(b1, n1); G.v(a0, n0); G.v(b1, n1); G.v(a1, n1);
        if (caps) { G.tri(a, a1, a0); G.tri(b, b0, b1); }
      }
      return G;
    },
    // a turned shape about the vertical through (cx, cz): profile [[r, y], ...] from bottom to top, smooth round, flat along
    lathe(cx, cz, prof, seg = 16, a0 = 0, a1 = TAU) {
      for (let k = 0; k < prof.length - 1; k++) {
        const [r0, y0] = prof[k], [r1, y1] = prof[k + 1], dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, ny = -dr / l, nr = dy / l;
        for (let i = 0; i < seg; i++) {
          const t0 = a0 + (a1 - a0) * i / seg, t1 = a0 + (a1 - a0) * (i + 1) / seg, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
          const A = [cx + c0 * r0, y0, cz + s0 * r0], B = [cx + c1 * r0, y0, cz + s1 * r0], Cc = [cx + c1 * r1, y1, cz + s1 * r1], D = [cx + c0 * r1, y1, cz + s0 * r1];
          const n0 = [c0 * nr, ny, s0 * nr], n1 = [c1 * nr, ny, s1 * nr];
          G.v(A, n0); G.v(D, n0); G.v(Cc, n1); G.v(A, n0); G.v(Cc, n1); G.v(B, n1);
        }
      }
      return G;
    },
    // a ball
    ball(c, r, seg = 10, sy = 1) {
      const prof = []; for (let i = 0; i <= seg / 2; i++) { const t = -Math.PI / 2 + Math.PI * i / (seg / 2); prof.push([Math.cos(t) * r, c[1] + Math.sin(t) * r * sy]); }
      return G.lathe(c[0], c[2], prof, seg);
    },
    // a hoop of round section about an axis through c: the hoop's plane has unit normal ax
    hoop(c, ax, R, r, segR = 32, segr = 8) {
      _a.set(ax[0], ax[1], ax[2]).normalize(); _b.set(Math.abs(_a.y) < 0.9 ? 0 : 1, Math.abs(_a.y) < 0.9 ? 1 : 0, 0); _c.crossVectors(_a, _b).normalize(); _b.crossVectors(_c, _a);
      const A = [_a.x, _a.y, _a.z], U = [_c.x, _c.y, _c.z], W = [_b.x, _b.y, _b.z];
      const pt = (i, j) => {
        const t = i / segR * TAU, s = j / segr * TAU, ct = Math.cos(t), st = Math.sin(t), cs = Math.cos(s), ss = Math.sin(s);
        const d = [U[0] * ct + W[0] * st, U[1] * ct + W[1] * st, U[2] * ct + W[2] * st];
        const n = [d[0] * cs + A[0] * ss, d[1] * cs + A[1] * ss, d[2] * cs + A[2] * ss];
        return [[c[0] + d[0] * R + n[0] * r, c[1] + d[1] * R + n[1] * r, c[2] + d[2] * R + n[2] * r], n];
      };
      for (let i = 0; i < segR; i++) for (let j = 0; j < segr; j++) {
        const a = pt(i, j), b = pt(i + 1, j), cq = pt(i + 1, j + 1), d = pt(i, j + 1);
        G.v(a[0], a[1]); G.v(b[0], b[1]); G.v(cq[0], cq[1]); G.v(a[0], a[1]); G.v(cq[0], cq[1]); G.v(d[0], d[1]);
      }
      return G;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('kind', new THREE.Float32BufferAttribute(K, 1));
      g.computeBoundingSphere();
      return g;
    },
  };
  return G;
}

// ---------------------------------------------------------------- the island's and the cave's measures (metres)
// The island's own space: y = 0 is the sea, the well (the chasm) stands on the axis x = z = 0.
export const ISLE = {
  // the drum's radius; the underside (the adamant plate); the cave's floor; where the adamant ends in the cliff;
  // the well's kerb (the bowl's lowest lawn); the rim's turf; the well's radius
  R: 220, Y0: 52, FLOOR: 62, ADAM: 126, TOP: 146, RIM: 166, SHAFT: 26,
  // the five tiers of galleries (22 m apart), their width, the anglers' rods
  TIERS: [58, 80, 102, 124, 146], GAL_W: 5, ROD: 14,
  // the terrace round the well's kerb, and the palace's forecourt before it
  TERRACE: 10, COURT: 60,
};
// the bowl's lawn at r metres from the axis
export const lawnY = (r) => ISLE.TOP + (ISLE.RIM - ISLE.TOP) * Math.pow(clamp((r - ISLE.SHAFT) / (ISLE.R - ISLE.SHAFT), 0, 1), 1.15);
// The cave's local space: y = 0 is its floor, the stone's axis stands on x = z = 0, the last straight runs along -z.
export const CAVE = {
  // floor radius and the crown's height (a closed dome: the well comes down through its flank)
  R: 110, H: 66,
  // the hoop: middle radius, height of its middle, depth and thickness
  HOOP_R: 26, HOOP_Y: 20, HOOP_T: 5,
  // the shuttle: length, greatest thickness
  STONE_L: 24, STONE_T: 11,
  // twenty lamps: twelve on the ring gallery, eight on the hoop's feet
  LAMPS: 20, LAMP_R: 104, LAMP_Y: 7.2,
  // the ring gallery: inner radius, outer radius, height
  GALLERY: [101, 109.2, 2.6],
  // the flight's height over the floor on the last straight; the ring's seat on the straight, beyond the axis
  FLY_Y: 8, SEAT_Z: -22,
};
// the dome: height over the floor at r from the stone's axis, and radius at height y
export const domeH = (r) => CAVE.H * Math.sqrt(Math.max(0, 1 - (r / CAVE.R) ** 2));
export const domeR = (y) => CAVE.R * Math.sqrt(Math.max(0, 1 - (y / CAVE.H) ** 2));
// THE DECLARED PACING: metres a second between places of the world (see layRoute for the places)
export const PACE = { out: 32, climb: 28, bowl: 24, cave: 13 };
const D2R = Math.PI / 180;
// one radius rule for every turn (20 degrees a second at the pace flown there) and for every bend of the pitch (15):
// where a turn and a bend fall together the camera turns 25, and 5 of the 30 are left for the pull of the gaze
export const turnR = (v) => v / (20 * D2R), bendR = (v) => v / (15 * D2R);
const ang = (p) => Math.atan2(p[1], p[0]);
const norm2pi = (a) => { let b = a % (2 * Math.PI); if (b < 0) b += 2 * Math.PI; return b; };
// plan pieces: a straight line and an arc (sweep > 0 turns with growing angle), each with its length and a point at s
const planLine = (a, b) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); return { len, at: (s) => [a[0] + (b[0] - a[0]) * s / len, a[1] + (b[1] - a[1]) * s / len] }; };
const planArc = (c, r, a0, sweep) => ({ len: r * Math.abs(sweep), at: (s) => { const a = a0 + Math.sign(sweep) * s / r; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; } });
// a height that leaves y0 level at h0 and arrives level at y1 at h1: a round bend of radius rv, a straight slope, a
// round bend (the slope's angle is solved so that the three pieces fit the run)
function bendLine(h0, y0, h1, y1, rv) {
  const run = h1 - h0, rise = Math.abs(y1 - y0), sg = Math.sign(y1 - y0);
  let lo = 0, hi = 1.5;
  for (let i = 0; i < 50; i++) {
    const g = (lo + hi) / 2, f = 2 * rv * (1 - Math.cos(g)) + (run - 2 * rv * Math.sin(g)) * Math.tan(g);
    if (f < rise) lo = g; else hi = g;
  }
  const g = (lo + hi) / 2, hb = rv * Math.sin(g), yb = rv * (1 - Math.cos(g));
  const f = (h) => {
    const x = clamp(h - h0, 0, run);
    const d = x < hb ? rv - Math.sqrt(Math.max(0, rv * rv - x * x)) : x > run - hb ? rise - (rv - Math.sqrt(Math.max(0, rv * rv - (run - x) ** 2))) : yb + (x - hb) * Math.tan(g);
    return y0 + sg * d;
  };
  f.slope = g; f.bend = hb;
  return f;
}
// THE ROUTE, by geometry, in the island's canonical space (a visit's hand mirrors x afterwards). o.deepK: the visit's
// draw of how deep the pass under the plate dips (0.86 to 1.14 of 30 m). The rules, with the reason of every number, are
// in shots/island-that-shades-the-fields/r2-progress.txt (R0 to R7).
export function layRoute(o = {}) {
  const { R, Y0, FLOOR, RIM, SHAFT, GAL_W, TIERS, TERRACE, COURT } = ISLE;
  const tier = TIERS[1] - TIERS[0], deepK = o.deepK ?? 1;
  // R1 the entry: 1.65 of the island's height (sea to rim) outside the rim (274 m: from there the rim's top stands 29.5
  // degrees up from the sea's level, so someone standing there has the whole island before them without lifting the
  // head; one number of the island's own measure, tuned on the entry and said so), off the mean shore's line (x 40) by
  // 30 m at the entry's own point (the shore winds: on some visits the first hundred metres pass over the beach), a
  // mast's height over the sea (the boats' masts are 9)
  const rE = R + 1.65 * RIM, PA = 70, yE = 11, yU = Y0 - tier;
  const E = [PA, -Math.sqrt(rE * rE - PA * PA)];
  // R3 under the plate: an arc to the right that dips 30 m (times the visit's draw) in from the edge, then an arc to
  // the left that touches the climb's circle (a tier's height out from the galleries' edge)
  const r1 = turnR(PACE.out), r2 = r1, dip = 30 * deepK, Rc = R + GAL_W + tier;
  const d1 = R - dip + r1, C1 = [PA + r1, -Math.sqrt(d1 * d1 - (PA + r1) ** 2)], m2 = Rc - r2;
  const a2 = ang(C1) + Math.acos(clamp((d1 * d1 + m2 * m2 - (r1 + r2) ** 2) / (2 * d1 * m2), -1, 1));
  const C2 = [m2 * Math.cos(a2), m2 * Math.sin(a2)], f1 = ang([C2[0] - C1[0], C2[1] - C1[1]]);
  const T1 = [PA, C1[1]];
  const pieces = [planLine(E, T1), planArc(C1, r1, Math.PI, f1 - Math.PI), planArc(C2, r2, f1 + Math.PI, norm2pi(a2 - f1 - Math.PI))];
  // R6 the well and the cave's one curve: radius from the cave's pace; the well's middle stands 6 m inside the curve,
  // so that the turn inside the well is 87 degrees (a quarter at most) and the line comes out 12 m under the dome's
  // surface at the well's foot; q is how far the bowl's line passes the axis
  const r4 = turnR(PACE.cave), e4 = r4 - 6, q = (r4 * r4 + SHAFT * SHAFT - e4 * e4) / (2 * r4), k4 = Math.sqrt(SHAFT * SHAFT - q * q);
  // R5 over the rim: an arc to the left that touches the climb's circle and the bowl's line
  const RF = turnR(PACE.climb), sF = Math.sqrt((Rc - RF) ** 2 - (RF - q) ** 2);
  // the rim's crossing on that arc, in metres along it (where it is R from the axis)
  const fRim = RF * Math.acos(clamp((R * R - (Rc - RF) ** 2 - RF * RF) / (2 * (Rc - RF) * RF), -1, 1));
  // where the left arc leaves the plate's edge (found on the plan itself, every half metre)
  let hOut = 0, hIn = 0, hDeep = 0, rMin = 1e9;
  const hTouch = pieces[0].len + pieces[1].len + pieces[2].len;
  {
    let h0 = 0;
    for (const pc of pieces) {
      for (let s = 0; s <= pc.len; s += 0.5) {
        const p = pc.at(s), r = Math.hypot(p[0], p[1]);
        if (r < R && !hIn) hIn = h0 + s;
        if (r < rMin) { rMin = r; hDeep = h0 + s; }
        if (r < R) hOut = h0 + s;
      }
      h0 += pc.len;
    }
  }
  // R4 the climb: 30 degrees between its two round bends, from the plate's edge (y 30) to the rim's crossing (10 m
  // over the turf); the circle's sweep is what that run leaves after the two arcs' shares
  const rvC = bendR(PACE.climb), yR = RIM + 10, g30 = 30 * D2R;
  const runC = 2 * rvC * Math.sin(g30) + (yR - yU - 2 * rvC * (1 - Math.cos(g30))) / Math.tan(g30);
  const sweepC = (runC - (hTouch - hOut) - fRim) / Rc, aF0 = a2 + sweepC;
  const lam = aF0 - Math.atan2(RF - q, -sF), dir = [Math.cos(lam), Math.sin(lam)], nl = [-dir[1], dir[0]];
  const Cf = [(Rc - RF) * Math.cos(aF0), (Rc - RF) * Math.sin(aF0)];
  const TB = [Cf[0] - RF * nl[0], Cf[1] - RF * nl[1]], K = [-q * nl[0] - k4 * dir[0], -q * nl[1] - k4 * dir[1]];
  const Cc = [K[0] + r4 * nl[0], K[1] + r4 * nl[1]], sweep4 = 160 * D2R;
  pieces.push(planArc([0, 0], Rc, a2, sweepC), planArc(Cf, RF, aF0, norm2pi(lam - Math.PI / 2 - aF0)), planLine(TB, K), planArc(Cc, r4, lam - Math.PI / 2, sweep4));
  // R7 the last straight: radial, from 4 m outside the hoop's reach to the ring's seat beyond the axis
  const aA = lam - Math.PI / 2 + sweep4, A = [Cc[0] + r4 * Math.cos(aA), Cc[1] + r4 * Math.sin(aA)], hA = [-Math.sin(aA), Math.cos(aA)];
  const zA = CAVE.HOOP_R + CAVE.HOOP_T / 2 + 4, stone = [A[0] + hA[0] * zA, A[1] + hA[1] * zA];
  const seat = [stone[0] - hA[0] * CAVE.SEAT_Z, stone[1] - hA[1] * CAVE.SEAT_Z];
  pieces.push(planLine(A, seat));
  const starts = [0];
  for (const pc of pieces) starts.push(starts[starts.length - 1] + pc.len);
  // the places of the route in metres of the plan
  const H = { edgeIn: hIn, deep: hDeep, edgeOut: hOut, touch: hTouch, top: starts[4], rim: starts[4] + fRim, bowl: starts[5], kerb: starts[6], straight: starts[7], end: starts[8] };
  H.court = H.kerb - COURT;
  // the well's far wall over the curve (80 degrees round it)
  H.foot = H.kerb + r4 * 2 * Math.acos(clamp((e4 * e4 + r4 * r4 - SHAFT * SHAFT) / (2 * e4 * r4), -1, 1));
  return { pieces, starts, H, E, C1, C2, Cf, Cc, K, A, stone, seat, hA, dir, nl, lam, a2, aF0, sweepC, q, r1, r2, r4, RF, Rc, zA, yE, yU, yR, rvC, dip, psi: Math.atan2(hA[0], -hA[1]) };
}
// the route's points (canonical): the plan of layRoute with its heights, every 8 m outside and every 4 m from the
// forecourt on; also the places as points, and the cave's own frame (to and from the island's canonical space)
export function routePoints(o = {}) {
  const P = layRoute(o), { R, FLOOR, TERRACE } = ISLE, H = P.H;
  const planAt = (h) => {
    let i = 0;
    while (i < P.pieces.length - 1 && h > P.starts[i + 1]) i++;
    return P.pieces[i].at(clamp(h - P.starts[i], 0, P.pieces[i].len));
  };
  // heights: low over the sea, rising over the last island radius of the approach to a tier under the plate; the
  // climb; a house's eaves over the bowl's lawn (7 m; 10 at the rim, over the parapet's poles); the dive from the
  // terrace's outer step to the last straight
  const eaves = (h) => { const p = planAt(h), r = Math.hypot(p[0], p[1]); return lawnY(r) + 7 + 3 * smoothstep(R - 30, R, r); };
  const climb = bendLine(H.edgeOut, P.yU, H.rim, P.yR, P.rvC);
  const hDive = H.kerb - TERRACE, dive = bendLine(hDive, eaves(hDive), H.straight, FLOOR + CAVE.FLY_Y, bendR(PACE.cave));
  const yAt = (h) => h < H.edgeIn ? P.yE + (P.yU - P.yE) * smoothstep(H.edgeIn - R, H.edgeIn, h)
    : h < H.edgeOut ? P.yU : h < H.rim ? climb(h) : h < hDive ? eaves(h) : h < H.straight ? dive(h) : FLOOR + CAVE.FLY_Y;
  const at = (h) => { const p = planAt(h); return [p[0], yAt(h), p[1]]; };
  const pts = [];
  for (let i = 0; i < P.pieces.length; i++) {
    const pc = P.pieces[i], n = Math.max(2, Math.ceil(pc.len / (P.starts[i] >= H.court - 1 ? 4 : 8)));
    for (let j = i ? 1 : 0; j <= n; j++) pts.push(at(P.starts[i] + pc.len * j / n));
  }
  const places = {};
  for (const k in H) places[k] = at(H[k]);
  // the cave's frame: local x and z axes in canonical (x, z); the stone's axis is its origin
  const ex = [-P.hA[1], P.hA[0]], ez = [-P.hA[0], -P.hA[1]];
  const toCave = (p) => { const dx = p[0] - P.stone[0], dz = p[2] - P.stone[1]; return [dx * ex[0] + dz * ex[1], p[1] - FLOOR, dx * ez[0] + dz * ez[1]]; };
  const fromCave = (p) => [P.stone[0] + p[0] * ex[0] + p[2] * ez[0], p[1] + FLOOR, P.stone[1] + p[0] * ex[1] + p[2] * ez[1]];
  // where the line comes out through the dome (the first point from the kerb on that is under the dome's surface)
  let hDome = H.kerb;
  for (let h = H.kerb; h < H.straight; h += 0.5) { const c = toCave(at(h)); if (c[1] < domeH(Math.hypot(c[0], c[2]))) { hDome = h; break; } }
  H.dome = hDome; places.dome = at(hDome); H.dive = hDive; places.dive = at(hDive);
  return { ...P, pts, at, yAt, planAt, places, toCave, fromCave, climbSlope: climb.slope, diveSlope: dive.slope, well: toCave([0, FLOOR, 0]) };
}

// THE FLIGHT: the route's path for a visit (hand mirrors x), the places in metres flown, the declared pacing and the
// gaze. Pure arithmetic: the world uses it, and so does the script that checks the camera on hundreds of seeds.
export function makeFlight(o = {}) {
  const hand = o.hand ?? 1, route = routePoints(o), { R, Y0, RIM, FLOOR, GAL_W, TIERS } = ISLE;
  const path = makePath(route.pts.map((p) => [hand * p[0], p[1], p[2]]));
  const L = path.length, nR = Math.ceil(L / 2.5), line = [];
  const tmp = new THREE.Vector3(), lookAheadM = 26;
  for (let i = 0; i <= nR; i++) line.push(path.pointAt(i / nR, new THREE.Vector3()));
  // metres flown at the route's point nearest to a canonical point, looked for between two bounds (the plan's own
  // metres are a lower bound: the route is longer than its plan)
  const metresOf = (p, lo = 0, hi = L) => {
    let best = 1e9, bi = 0;
    for (let i = Math.max(0, Math.floor(lo / L * nR)); i <= Math.min(nR, Math.ceil(hi / L * nR)); i++) {
      const c = line[i], d = (c.x - hand * p[0]) ** 2 + (c.y - p[1]) ** 2 + (c.z - p[2]) ** 2;
      if (d < best) { best = d; bi = i; }
    }
    return bi / nR * L;
  };
  const H = { ...route.H, arc1: route.starts[1], left: route.starts[2] }, M = {};
  let prev = 0;
  for (const k of Object.keys(H).sort((a, b) => H[a] - H[b])) { M[k] = k === 'end' ? L : metresOf(route.at(H[k]), prev, H[k] + 120); prev = M[k]; }
  // the pacing, in metres a second by metres flown: each change of pace is a ramp between two places
  const speedAt = (m) => m < M.touch ? lerp(PACE.out, PACE.climb, smoothstep(M.left, M.touch, m))
    : m < M.bowl ? lerp(PACE.climb, PACE.bowl, smoothstep(M.top, M.bowl, m))
      : lerp(PACE.bowl, PACE.cave, smoothstep(M.court, M.kerb, m));
  let secs = 0;
  for (let m = 0.5; m < L; m += 1) secs += 1 / speedAt(m);
  const duration = Math.ceil(secs * 10) / 10;
  const pace = (u) => speedAt(u * L) * duration / L;
  // the gaze: three pulls, each a point of the place worked from the metres flown
  const tier = TIERS[1] - TIERS[0], Rg = R + GAL_W, aFar = Math.acos(Rg / route.Rc), NEAR = 0.2, LATE = lookAheadM, ahead = 1.5 * (Y0 - route.yU);
  const plateAt = (time, u) => {
    path.posAtDist(Math.min(L, u * L + ahead), tmp);
    const r = Math.hypot(tmp.x, tmp.z), k = r > R - 10 ? (R - 10) / r : 1;
    return tmp.set(tmp.x * k, Y0, tmp.z * k);
  };
  // the cliff's pull: a point of the galleries' edge further round, a little over the eye (never over the parapet).
  // Where the pull begins (the plate's edge) the point is where the line of sight from the climb's circle touches the
  // cliff, almost on the heading; from the touch of the climb's circle to the middle of the climb it comes nearer
  // (a fifth of that angle round: the cliff's face about 50 degrees off the heading), stays there while we climb, and
  // from the climb's top it runs ahead again to the rim, where the pull has ended.
  const mid = (M.touch + M.top) / 2;
  const cliffAt = (time, u) => {
    const m = u * L;
    path.posAtDist(m, tmp);
    const k = 1 - (1 - NEAR) * smoothstep(M.touch, mid, m) * (1 - smoothstep(M.top, M.rim, m));
    const a = Math.atan2(tmp.z, hand * tmp.x) + k * aFar;
    return tmp.set(hand * Rg * Math.cos(a), Math.min(tmp.y + 8, RIM + 1.2), Rg * Math.sin(a));
  };
  const stoneW = new THREE.Vector3(hand * route.stone[0], FLOOR + CAVE.HOOP_Y, route.stone[1]);
  const uOf = (m) => m / L, ramp = M.edgeOut - M.deep, rampC = M.touch - M.edgeOut + LATE, cliffEnd = M.rim + LATE;
  const pois = [
    { at: plateAt, from: uOf(M.arc1), to: uOf(M.edgeOut), weight: 0.7, fade: ramp / (M.edgeOut - M.arc1) },
    { at: cliffAt, from: uOf(M.edgeOut), to: uOf(cliffEnd), weight: 0.75, fade: rampC / (cliffEnd - M.edgeOut) },
    // the stone's pull rises over the well (from the kerb to where the line comes out through the dome: by then the
    // stone is in sight) and falls over as many metres before the last straight begins
    { at: () => stoneW, from: uOf(M.kerb), to: uOf(M.straight), weight: 0.5, fade: Math.min(0.5, (M.dome - M.kerb) / (M.straight - M.kerb)) },
  ];
  // the cave's own view of the flight (its local space, mirrored by the hand): the line from the kerb on, the ring's
  // seat, the well's middle
  const cave = { hand, seat: [0, CAVE.FLY_Y, CAVE.SEAT_Z], well: [hand * route.well[0], route.well[2]], wellR: ISLE.SHAFT, pts: [] };
  for (let h = route.H.kerb; h <= route.H.end; h += 2.5) { const c = route.toCave(route.at(h)); cave.pts.push([hand * c[0], c[1], c[2]]); }
  return { route, cave, path, L, line, M, speedAt, duration, pace, pois, hand, stoneW, uOf, camera: { fov: 62, near: 0.4, far: 6500, lookAhead: lookAheadM, sway: 0.6, bank: 0.5, nearThrough: 0.4 } };
}

// ---------------------------------------------------------------- the cave's own light (no scene lights, no fog)
const CAVE_VERT = /* glsl */`
attribute float kind;
uniform mat4 uCaveInv; uniform float uTilt, uTime;
varying vec3 vL, vN, vCol; varying float vKind;
void main(){
  vec4 wp = vec4(position, 1.); vec3 n = normal;
  // a flame leans up the slope as the stone tilts, and wavers
  if (kind > 1.5 && kind < 2.5) { float hg = max(wp.y - ${(CAVE.LAMP_Y - 0.62).toFixed(2)}, 0.); wp.z -= uTilt * 1.6 * hg; wp.x += .1 * sin(uTime * 8. + wp.z * 1.7) * hg; }
  #ifdef USE_INSTANCING
  wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
  #endif
  wp = modelMatrix * wp; n = mat3(modelMatrix) * n;
  vL = (uCaveInv * wp).xyz; vN = mat3(uCaveInv) * n; vCol = color; vKind = kind;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CAVE_FRAG = /* glsl */`
uniform mat4 uCaveInv; uniform vec3 uWarm, uCool, uPortalCol, uWell; uniform vec4 uPortal; uniform float uTime, uTilt, uGain;
varying vec3 vL, vN, vCol; varying float vKind;
// the dome's height over the floor at r from the stone's axis
float domeH(float r){ return ${CAVE.H.toFixed(1)} * sqrt(max(1. - r * r / ${(CAVE.R * CAVE.R).toFixed(1)}, 0.)); }
const float LR = ${CAVE.LAMP_R.toFixed(1)}, LY = ${CAVE.LAMP_Y.toFixed(1)}, NL = ${CAVE.LAMPS.toFixed(1)}, TAU = 6.2831853;
// the lamps of one ring as glints along a ray from p: the three lamps nearest to where the ray leaves the ring's cylinder
float ringGlint(vec3 p, vec3 d, float R, float y, float phase, float sH, float sV){
  float a = dot(d.xz, d.xz), b = dot(p.xz, d.xz), c = dot(p.xz, p.xz) - R * R;
  float disc = b * b - a * c;
  if (a < 1e-5 || disc <= 0.) return 0.;
  float t = (-b + sqrt(max(disc, 0.))) / max(a, 1e-5);
  if (t <= 0.) return 0.;
  vec3 q = p + d * t;
  float stepA = TAU / NL, k = floor((atan(q.z, q.x) - phase) / stepA + .5), g = 0.;
  for (int i = -1; i <= 1; i++) {
    float an = (k + float(i)) * stepA + phase;
    vec3 w = vec3(R * cos(an), y, R * sin(an)) - p;
    float along = dot(w, d);
    vec3 miss = w - d * along;
    float fl = .82 + .18 * sin(uTime * (5.3 + mod(k + float(i), 5.) * .9) + an * 7.);
    g += exp(-dot(miss.xz, miss.xz) / (sH * sH) - miss.y * miss.y / (sV * sV)) * step(0., along) * fl;
  }
  return g;
}
void main(){
  vec3 p = vL, camL = (uCaveInv * vec4(cameraPosition, 1.)).xyz;
  vec3 V = normalize(camL - p), N = normalize(vN);
  if (dot(N, V) < 0.) N = -N;
  float rad = length(p.xz), NdV = clamp(dot(N, V), 0., 1.);
  // the dome's own surface (and the ribs on it) is not drawn where the well comes down through it
  float onDome = step(2.7, p.y) * step(abs(p.y - domeH(rad)), 2.5);
  vec2 toWell = p.xz - uWell.xy;
  if (onDome > .5 && dot(toWell, toWell) < uWell.z * uWell.z) discard;
  vec3 out3 = vec3(p.x, 0., p.z) / max(rad, 1e-3);
  // the three nearest lamps, then the ring as a whole (level light from all round: sides lit, tops dark, bellies a little)
  float stepA = TAU / NL, k = floor(atan(p.z, p.x + 1e-5) / stepA + .5), direct = 0.;
  for (int i = -1; i <= 1; i++) {
    float an = (k + float(i)) * stepA;
    vec3 L = vec3(LR * cos(an), LY, LR * sin(an)) - p; float d2 = dot(L, L);
    direct += max(dot(N, L * inversesqrt(max(d2, 1e-4))), 0.) * 110. / (d2 + 70.);
  }
  float side = sqrt(max(1. - N.y * N.y, 0.)), lift = clamp((LY - p.y) / 30., -1., 1.);
  float ringE = .3 * side + .28 * max(N.y * lift, 0.) + .5 * max(dot(N, out3), 0.) * smoothstep(0., LR, rad);
  vec3 warm = uWarm * (ringE + direct);
  // cool light down the well: a pool under its foot; the stone and the hoop shade the floor under them
  vec3 Lc = normalize(vec3(uWell.x, domeH(length(uWell.xy)) + 20., uWell.y) - p);
  float pool = 1. / (1. + dot(toWell, toWell) / 1100.);
  float under = 1. - .65 * (1. - smoothstep(.7, 1.25, length(p.xz / vec2(6.5, 13.5)))) * step(p.y, 13.);
  under *= 1. - .4 * (1. - smoothstep(2., 4., abs(rad - ${CAVE.HOOP_R.toFixed(1)}))) * step(p.y, 16.);
  vec3 cool = uCool * max(dot(N, Lc), 0.) * pool * under;
  vec3 Lp = uPortal.xyz - p; float lp2 = dot(Lp, Lp);
  vec3 pl = uPortalCol * uPortal.w * (.25 + .75 * max(dot(N, Lp * inversesqrt(max(lp2, 1e-4))), 0.)) / (1. + lp2 / 160.);
  vec3 light = warm * under + cool + pl + vec3(.05, .065, .11);
  vec3 col;
  vec3 Rf = reflect(-V, N);
  if (vKind < .5) {
    col = vCol * light;
  } else if (vKind < 1.5) {
    // brass and copper: the lamps themselves in it, a warm band at their level, the shaft's blue above
    float gl = ringGlint(p, Rf, LR, LY, 0., 2.6, 2.6);
    float band = exp(-Rf.y * Rf.y * 14.) * .5 + pow(max(Rf.y, 0.), 3.) * .0;
    col = vCol * light * .5 + vCol * (uWarm * (gl * 5. + band) + uCool * pow(max(Rf.y, 0.), 5.) * 1.4 * pool + pl * .6);
  } else if (vKind < 2.5) {
    col = vCol * (2.4 + .5 * sin(uTime * 6.1 + p.x * 3. + p.z * 2.));
  } else if (vKind > 3.5) {
    // the lodestone: dark red, polished. The lamps lie on it as broad soft lights, the ring's light and the well's
    // blue slide over its back, and its edge takes a sheen
    float gl = ringGlint(p, Rf, LR, LY, 0., 7., 7.) + .35 * ringGlint(p, Rf, LR, LY, 0., 2.2, 2.2);
    float fres = pow(clamp(1. - NdV, 0., 1.), 3.);
    col = vCol * (light * 1.25 + vec3(.05, .02, .02)) + uWarm * (gl * .55 + fres * .32) * vec3(1., .62, .5) + uCool * pow(max(Rf.y, 0.), 3.) * .5 * pool + pl * (.25 + fres);
  } else {
    // adamant: a dark mirror. The lamps in it by reflection (a small sharp flame in a soft halo); in the floor each
    // lamp stands on its head as a slim streak; a warm pool lies on the adamant round each lamp
    float flr = smoothstep(.6, .95, N.y) * (1. - step(2.5, p.y));
    float g = ringGlint(p, Rf, LR, LY, 0., mix(.3, .5, flr), mix(.45, 3.6, flr)) * mix(5., 1.6, flr) + .5 * ringGlint(p, Rf, LR, LY, 0., 1.5, mix(1.8, 4., flr)) * (1. - .6 * flr);
    // THE DOME: a second sky. Every facet of the crystal holds the lamps again, small and sharp: three images to a
    // facet, each at a place of its own in it, some nearer (larger), all wavering with the flames and sliding a
    // little as the stone tilts; low on the wall the true ranks of images stand behind them
    float img = 0., sky = 0.;
    if (onDome > .5) {
      float fb = asin(clamp(p.y / ${CAVE.H.toFixed(1)}, 0., 1.)) * ${(14 * 2 / Math.PI).toFixed(5)}, b = floor(fb);
      float fj = atan(p.z, p.x) * ${(60 / (2 * Math.PI)).toFixed(5)} - .5 * mod(b, 2.), j = floor(fj);
      vec2 uv = vec2(fj - j, fb - b), id = vec2(j, b);
      float wide = max(sqrt(max(1. - p.y * p.y / ${(CAVE.H * CAVE.H).toFixed(1)}, 0.)) * ${(CAVE.R * 2 * Math.PI / 60).toFixed(2)}, .3), tall = ${(CAVE.H * Math.PI / 2 / 14).toFixed(2)};
      for (int s = 0; s < 3; s++) {
        vec2 h = vec2(fract(sin(dot(id, vec2(12.9898, 78.233)) + float(s) * 3.7) * 43758.5453), fract(sin(dot(id, vec2(39.346, 11.135)) + float(s) * 5.1) * 24634.6345));
        float near = fract(h.x * 7.31 + h.y * 3.17), sz = mix(.07, .2, near * near * near);
        vec2 dd = (uv - vec2(fract(.2 + .6 * h.x + uTilt * (1.6 + 2. * near)), .2 + .6 * h.y)) * vec2(wide, tall);
        float d2 = dot(dd, dd), fl = .7 + .3 * sin(uTime * (4.7 + 3. * h.y) + h.x * 40.);
        sky += (exp(-d2 / (sz * sz)) * 2.4 + exp(-d2 / (sz * sz * 30.)) * .22) * fl * (.5 + .9 * near);
      }
      sky *= step(vCol.r, .12);
      float wall = smoothstep(${(CAVE.R - 30).toFixed(1)}, ${(CAVE.R - 12).toFixed(1)}, rad);
      for (int jj = 1; jj <= 3; jj++) {
        float fq = float(jj);
        img += pow(.66, fq) * ringGlint(p, -V, LR + 4. + 9. * fq, LY + 2.5 * fq + uTilt * 9. * fq, stepA * .5 * fq + uTilt * .5 * fq, .32, .5) * wall;
      }
    }
    float fres = pow(clamp(1. - NdV, 0., 1.), 3.);
    vec3 sheen = uWarm * (.08 + .17 * fres) * exp(-max(p.y, 0.) / 22.) + uCool * fres * .35 * pool;
    vec3 tint = .35 + .65 * vCol / max(max(vCol.r, vCol.g), max(vCol.b, .05));
    col = vCol * light * .9 + vec3(.012, .018, .04) + uWarm * direct * .1 * under + (uWarm * (g + img * 6. + sky) + sheen + pl * fres) * tint;
  }
  gl_FragColor = vec4(col * uGain, 1.);
}`;
function caveMaterial(U, side = THREE.DoubleSide) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: CAVE_VERT, fragmentShader: CAVE_FRAG, vertexColors: true, side });
}

// ---------------------------------------------------------------- the shell: floor, dome with ribs, crown lip, ring gallery, lamps
function shellInto(G, GD, rng, C) {
  const { R, H, LAMPS, LAMP_R, LAMP_Y, GALLERY } = CAVE;
  // the floor: rings of two dark tones, pale inlaid rings and spokes (so the mirror has a floor to lie on)
  const rings = [0, 6, 13, 19.5, 20.5, 25, 27, 32.5, 33.5, 41, 48, 55.5, 56.5, 66, 75, 84.5, 85.5, 93, GALLERY[0]];
  const seg = 80;
  G.kind(3);
  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = rings[i], r1 = rings[i + 1], thin = r1 - r0 < 1.5;
    for (let j = 0; j < seg; j++) {
      const a0 = j / seg * TAU, a1 = (j + 1) / seg * TAU, spoke = !thin && j % 5 === 0 && r0 > 5;
      const tone = thin || spoke ? C.pale : (i + Math.floor(j / 5)) % 2 ? C.adam : C.adam2;
      G.col(tone, thin || spoke ? 0.55 : rng.range(0.85, 1.15));
      G.quad([r0 * Math.cos(a0), 0, r0 * Math.sin(a0)], [r0 * Math.cos(a1), 0, r0 * Math.sin(a1)], [r1 * Math.cos(a1), 0, r1 * Math.sin(a1)], [r1 * Math.cos(a0), 0, r1 * Math.sin(a0)]);
    }
  }
  // the dome: bands of facets, each a shade of its own (its own mesh, drawn from inside only)
  const nB = 14, nS = 60;
  for (let b = 0; b < nB; b++) {
    const y0 = H * Math.sin(b / nB * Math.PI / 2), y1 = H * Math.sin((b + 1) / nB * Math.PI / 2), r0 = domeR(y0), r1 = domeR(y1);
    for (let j = 0; j < nS; j++) {
      const a0 = (j + (b % 2) * 0.5) / nS * TAU, a1 = (j + 1 + (b % 2) * 0.5) / nS * TAU;
      GD.kind(3).col(rng.chance(0.5) ? C.adam : C.adam2, rng.range(0.8, 1.25));
      GD.quad([r0 * Math.cos(a1), y0, r0 * Math.sin(a1)], [r0 * Math.cos(a0), y0, r0 * Math.sin(a0)], [r1 * Math.cos(a0), y1, r1 * Math.sin(a0)], [r1 * Math.cos(a1), y1, r1 * Math.sin(a1)]);
    }
  }
  // twenty ribs of pale adamant from the gallery to the crown, one between each pair of lamps
  G.col(C.pale, 0.5);
  for (let k = 0; k < LAMPS; k++) {
    const a = (k + 0.5) / LAMPS * TAU, ca = Math.cos(a), sa = Math.sin(a);
    let prev = null;
    for (let i = 0; i <= 10; i++) {
      const y = H * Math.sin(i / 10 * Math.PI / 2) * 0.995, r = domeR(y) - 0.5, q = [r * ca, y, r * sa];
      if (prev) G.bar(prev, q, 0.75 - 0.03 * i, 0.72 - 0.03 * i, 5);
      prev = q;
    }
  }
  // the ring gallery with its rail
  G.col(C.adam2, 1.5);
  G.lathe(0, 0, [[GALLERY[0], 0], [GALLERY[0], GALLERY[2]], [GALLERY[1], GALLERY[2]]], 80);
  G.kind(1).col(C.brass, 1);
  G.hoop([0, GALLERY[2] + 1.15, 0], [0, 1, 0], GALLERY[0] + 0.25, 0.1, 80, 4);
  for (let k = 0; k < 80; k++) { const a = k / 80 * TAU, r = GALLERY[0] + 0.25; G.bar([r * Math.cos(a), GALLERY[2], r * Math.sin(a)], [r * Math.cos(a), GALLERY[2] + 1.15, r * Math.sin(a)], 0.07, 0.07, 4); }
  // THE LAMPS: a brass standard on the gallery with an arm out over the cave, and from the arm a lantern on three
  // chains: a bowl, a cage of four bars under a cap, and the flame in it (the flames are sheared by the tilt in the
  // vertex shader). The flame stands where the cave's light is worked from (LAMP_R, LAMP_Y).
  const lamps = [];
  for (let k = 0; k < LAMPS; k++) {
    const a = k / LAMPS * TAU, ca = Math.cos(a), sa = Math.sin(a), x = LAMP_R * ca, z = LAMP_R * sa, xs = (LAMP_R + 2.4) * ca, zs = (LAMP_R + 2.4) * sa, y0 = GALLERY[2], yA = LAMP_Y + 2.5;
    G.kind(1).col(C.brass, 1);
    G.lathe(xs, zs, [[0.6, y0], [0.22, y0 + 0.5], [0.15, yA], [0.26, yA + 0.2], [0.02, yA + 0.7]], 6);
    G.bar([xs, yA, zs], [x - 0.3 * ca, yA, z - 0.3 * sa], 0.07, 0.05, 4);
    G.bar([xs, yA - 1.3, zs], [(xs + x) / 2, yA, (zs + z) / 2], 0.04, 0.04, 4);
    for (let j = 0; j < 3; j++) { const b = a + j / 3 * TAU; G.bar([x, yA, z], [x + 0.55 * Math.cos(b), LAMP_Y + 0.9, z + 0.55 * Math.sin(b)], 0.022, 0.022, 3); }
    G.lathe(x, z, [[0.02, LAMP_Y + 1.3], [0.62, LAMP_Y + 0.92], [0.66, LAMP_Y + 0.82]], 6);
    for (let j = 0; j < 4; j++) { const b = a + (j + 0.5) / 4 * TAU; G.bar([x + 0.55 * Math.cos(b), LAMP_Y - 0.55, z + 0.55 * Math.sin(b)], [x + 0.6 * Math.cos(b), LAMP_Y + 0.86, z + 0.6 * Math.sin(b)], 0.025, 0.025, 3); }
    G.lathe(x, z, [[0.1, LAMP_Y - 0.98], [0.5, LAMP_Y - 0.72], [0.62, LAMP_Y - 0.5], [0.3, LAMP_Y - 0.54]], 8);
    G.kind(2).col(C.lamp, 1);
    G.lathe(x, z, [[0.0, LAMP_Y - 0.54], [0.3, LAMP_Y - 0.25], [0.2, LAMP_Y + 0.25], [0.0, LAMP_Y + 0.8]], 6);
    lamps.push([x, LAMP_Y, z]);
  }
  return lamps;
}

// ---------------------------------------------------------------- the hoop on its eight feet, and the axle
function hoopInto(G, C) {
  const { HOOP_R: R, HOOP_Y: Y, HOOP_T: T } = CAVE, h = T / 2;
  G.kind(3).col(C.hoop, 1);
  // a hollow cylinder of square section with a groove round its inner side
  G.lathe(0, 0, [[R - h, Y - h], [R + h, Y - h], [R + h, Y + h], [R - h, Y + h], [R - h, Y + 0.7], [R - h + 0.6, Y + 0.5], [R - h + 0.6, Y - 0.5], [R - h, Y - 0.7], [R - h, Y - h]], 64);
  G.col(C.hoop, 0.85);
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) / 8 * TAU, x = R * Math.cos(a), z = R * Math.sin(a);
    G.lathe(x, z, [[2.5, 0], [2.3, 0.7], [1.45, 1.7], [1.1, Y - h - 2.2], [1.7, Y - h - 0.8], [2.1, Y - h]], 10);
  }
  // the axle, with two collars where it enters the hoop's groove
  G.kind(1).col(C.pale, 0.9);
  G.bar([-(R - h + 0.5), Y, 0], [R - h + 0.5, Y, 0], 0.8, 0.8, 10);
  for (const sx of [-1, 1]) G.hoop([sx * (R - h - 0.9), Y, 0], [1, 0, 0], 1.25, 0.4, 14, 6);
}

// ---------------------------------------------------------------- the stone: a shuttle along Z about the axle (its own mesh; origin on the axle)
function stoneGeometry(noise, C) {
  const G = makeGeo(), L = CAVE.STONE_L / 2, T = CAVE.STONE_T / 2, nZ = 22, nA = 20;
  const rad = (s) => T * Math.pow(Math.max(1 - Math.pow(Math.abs(s), 1.8), 0), 0.85) + 0.12;
  const pt = (i, j) => {
    const s = -1 + 2 * i / nZ, a = j / nA * TAU, r = rad(s), ds = 0.01, slope = (rad(s + ds) - rad(s - ds)) / (2 * ds * L);
    const bump = 1 + 0.035 * noise.n3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, s * 3.1);
    const p = [r * bump * Math.cos(a), r * bump * Math.sin(a), s * L];
    const nl = Math.hypot(1, slope), n = [Math.cos(a) / nl, Math.sin(a) / nl, -slope / nl];
    const v = 0.5 + 0.5 * noise.fbm3(p[0] * 0.35, p[1] * 0.35, p[2] * 0.22, 3), band = 0.5 + 0.5 * Math.sin(s * 9 + noise.n2(a * 1.3, s * 2) * 2.5);
    const c = mixc(mixc(C.stone, C.stoneDark, v), C.stoneVein, 0.35 * band * band);
    return { p, n, c };
  };
  G.kind(4);
  for (let i = 0; i < nZ; i++) for (let j = 0; j < nA; j++) {
    const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
    G.v(a.p, a.n, a.c); G.v(b.p, b.n, b.c); G.v(c.p, c.n, c.c); G.v(a.p, a.n, a.c); G.v(c.p, c.n, c.c); G.v(d.p, d.n, d.c);
  }
  // two pale collars where the axle passes through the stone's middle
  G.kind(1).col(C.pale, 1.0);
  for (const sx of [-1, 1]) G.hoop([sx * (T + 0.15), 0, 0], [1, 0, 0], 1.5, 0.5, 14, 6);
  return G.build();
}

// ---------------------------------------------------------------- the instruments (each stands on the floor at the origin of the
// current transform; returns { h: height, reach: radius it needs }). Brass on dark wood; none carries a mark or a letter.
function arcBars(G, c, r, a0, a1, n, rad, plane) {
  // an arc of round bars in a vertical plane through c: plane = unit horizontal direction of the arc's "x"
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n), q = [c[0] + plane[0] * r * Math.cos(a), c[1] + r * Math.sin(a), c[2] + plane[1] * r * Math.cos(a)];
    if (prev) G.bar(prev, q, rad, rad, 5);
    prev = q;
  }
}
function tripod(G, C, h, spread) {
  G.kind(0).col(C.wood, 1);
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.4; G.bar([spread * Math.cos(a), 0, spread * Math.sin(a)], [0, h, 0], 0.16, 0.11, 5); }
  G.kind(1).col(C.brass, 0.8); G.ball([0, h, 0], 0.32, 8);
}
function telescope(G, rng, C) {
  const h = rng.range(3.8, 4.8), el = rng.range(0.45, 0.95), L = rng.range(7, 10), ce = Math.cos(el), se = Math.sin(el);
  tripod(G, C, h, h * 0.42);
  const a = [-ce * L * 0.38, h + 0.35 - se * L * 0.38, 0], b = [ce * L * 0.62, h + 0.35 + se * L * 0.62, 0];
  const m = (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), 0];
  G.kind(1).col(C.brass, 1); G.bar(m(0.12), m(0.55), 0.3, 0.38, 10, true); G.bar(m(0.5), b, 0.46, 0.56, 10, true);
  G.col(C.copper, 1); G.bar(a, m(0.14), 0.2, 0.24, 8, true);
  for (const t of [0.12, 0.5, 0.97]) G.hoop(m(t), [ce, se, 0], lerp(0.36, 0.6, t), 0.07, 12, 4);
  return { h: Math.max(b[1], h) + 0.6, reach: L * 0.62 };
}
function standPillar(G, C, h) {
  G.kind(0).col(C.wood, 1); G.lathe(0, 0, [[1.1, 0], [1.0, 0.35], [0.35, 0.7], [0.22, h - 0.4], [0.4, h]], 8);
}
function astrolabe(G, rng, C) {
  const r = rng.range(2.0, 2.9), h = rng.range(2.4, 3.4), y = h + r + 0.3;
  standPillar(G, C, h);
  G.kind(1).col(C.brass, 1);
  G.push(new THREE.Matrix4().makeTranslation(0, y, 0).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  G.lathe(0, 0, [[0.0, -0.1], [r, -0.1], [r, 0.1], [0.0, 0.1]], 24);
  G.col(C.copper, 1); G.hoop([0, 0.12, 0], [0, 1, 0], r * 0.74, 0.07, 24, 4); G.hoop([0, -0.12, 0], [0, 1, 0], r * 0.5, 0.07, 20, 4);
  G.pop();
  const t = rng.range(-1, 1);
  G.col(C.copper, 1.1); G.bar([-r * 0.96 * Math.cos(t), y - r * 0.96 * Math.sin(t), 0.2], [r * 0.96 * Math.cos(t), y + r * 0.96 * Math.sin(t), 0.2], 0.09, 0.09, 5);
  G.col(C.brass, 1); G.hoop([0, y + r + 0.45, 0], [0, 0, 1], 0.45, 0.08, 12, 4);
  return { h: y + r + 0.9, reach: r + 0.3 };
}
function armillary(G, rng, C) {
  const r = rng.range(2.0, 2.8), h = rng.range(2.2, 3.2), y = h + r + 0.2, c = [0, y, 0];
  standPillar(G, C, h);
  G.kind(1).col(C.brass, 1);
  G.hoop(c, [0, 1, 0], r, 0.1, 28, 4); G.hoop(c, [1, 0, 0], r, 0.1, 28, 4); G.hoop(c, [0, 0, 1], r, 0.1, 28, 4);
  const tl = rng.range(0.3, 0.6);
  G.col(C.copper, 1); G.hoop(c, [Math.sin(tl), Math.cos(tl), 0], r * 0.86, 0.12, 28, 4);
  G.bar([-Math.sin(tl) * r * 1.15, y - Math.cos(tl) * r * 1.15, 0], [Math.sin(tl) * r * 1.15, y + Math.cos(tl) * r * 1.15, 0], 0.06, 0.06, 4);
  G.col(C.brass, 1.1); G.ball(c, r * 0.2, 10);
  return { h: y + r + 0.3, reach: r + 0.2 };
}
function quadrant(G, rng, C) {
  const r = rng.range(4.2, 5.6), y0 = rng.range(1.2, 1.8), pl = [1, 0];
  G.kind(0).col(C.wood, 1); G.box(-0.9, 0, -0.7, 0.9, y0, 0.7);
  G.kind(1).col(C.brass, 1);
  G.bar([0, y0, 0], [0, y0 + r, 0], 0.13, 0.13, 5); G.bar([0, y0, 0], [r, y0, 0], 0.13, 0.13, 5);
  arcBars(G, [0, y0, 0], r, 0, Math.PI / 2, 12, 0.13, pl); arcBars(G, [0, y0, 0], r * 0.86, 0, Math.PI / 2, 10, 0.07, pl);
  const t = rng.range(0.3, 1.2);
  G.col(C.copper, 1.1); G.bar([0, y0, 0.18], [r * 1.04 * Math.cos(t), y0 + r * 1.04 * Math.sin(t), 0.18], 0.1, 0.08, 5);
  G.kind(0).col(C.wood, 1); G.bar([r, y0, 0], [r, 0, 0], 0.12, 0.14, 5);
  return { h: y0 + r + 0.4, reach: r * 0.75 };
}
function sextant(G, rng, C) {
  const r = rng.range(3.2, 4.2), h = rng.range(2.6, 3.4), c = [0, h + r, 0], pl = [1, 0], a0 = -Math.PI / 2 - Math.PI / 6, a1 = -Math.PI / 2 + Math.PI / 6;
  standPillar(G, C, h * 0.55);
  G.kind(0).col(C.wood, 1); G.bar([0, h * 0.55, 0], [0, h + r * 0.14, 0], 0.14, 0.1, 5);
  G.kind(1).col(C.brass, 1);
  const e = (a, k = 1) => [r * k * Math.cos(a), c[1] + r * k * Math.sin(a), 0];
  G.bar(c, e(a0), 0.11, 0.11, 5); G.bar(c, e(a1), 0.11, 0.11, 5); arcBars(G, c, r, a0, a1, 8, 0.14, pl); arcBars(G, c, r * 0.6, a0, a1, 5, 0.07, pl);
  const t = rng.range(a0 + 0.1, a1 - 0.1);
  G.col(C.copper, 1.1); G.bar([0, c[1], 0.2], [r * 1.05 * Math.cos(t), c[1] + r * 1.05 * Math.sin(t), 0.2], 0.09, 0.08, 5);
  G.bar([-1.3, c[1] - r * 0.35, 0.3], [1.1, c[1] - r * 0.2, 0.3], 0.16, 0.2, 8, true);
  G.col(C.brass, 1); G.ball(c, 0.3, 8);
  return { h: c[1] + 0.5, reach: r * 0.62 };
}
function pendulumFrame(G, rng, C) {
  const H = rng.range(8.5, 11), w = 1.5;
  G.kind(0).col(C.wood, 1);
  for (const sx of [-1, 1]) { G.bar([sx * w * 1.5, 0, 0], [sx * w, H, 0], 0.22, 0.15, 6); G.bar([sx * w * 1.5, 0, 1.2], [sx * w * 1.2, H * 0.45, 0], 0.12, 0.1, 5); G.bar([sx * w * 1.5, 0, -1.2], [sx * w * 1.2, H * 0.45, 0], 0.12, 0.1, 5); }
  G.kind(1).col(C.brass, 1); G.bar([-w - 0.3, H, 0], [w + 0.3, H, 0], 0.16, 0.16, 6, true);
  arcBars(G, [0, H, 0], H - 1.4, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3, 6, 0.06, [1, 0]);
  return { h: H + 0.4, reach: 2.6, pivot: H };
}
function orreryBase(G, rng, C) {
  const h = rng.range(1.8, 2.4);
  G.kind(0).col(C.wood, 1); G.lathe(0, 0, [[1.9, 0], [1.8, 0.3], [0.5, 0.7], [0.4, h - 0.3], [1.5, h - 0.2], [1.5, h]], 12);
  G.kind(1).col(C.brass, 1); G.lathe(0, 0, [[0.0, h], [0.12, h], [0.12, h + 2.4]], 6); G.ball([0, h + 2.7, 0], 0.5, 10);
  return { h: h + 3.3, reach: 3.6, top: h };
}
// the turning arm of an orrery (unit: arm 3 m long; about the vertical through its origin)
function spinnerGeometry(C) {
  const G = makeGeo();
  G.kind(1).col(C.brass, 1); G.bar([-1.1, 0, 0], [3, 0, 0], 0.06, 0.05, 5); G.ball([-1.1, 0, 0], 0.2, 6);
  G.col(C.copper, 1.1); G.ball([3, 0.1, 0], 0.34, 10); G.hoop([3, 0.1, 0], [0.3, 1, 0], 0.72, 0.03, 16, 3);
  G.col(C.pale, 0.9); G.ball([3.72, 0.3, 0], 0.11, 6);
  return G.build();
}
// the swinging rod and bob of a pendulum (unit: 8 m long, hanging down from its origin)
function pendulumGeometry(C) {
  const G = makeGeo();
  G.kind(1).col(C.brass, 0.9); G.bar([0, 0, 0], [0, -8, 0], 0.06, 0.06, 5);
  G.col(C.copper, 1.1); G.ball([0, -8, 0], 0.72, 12, 0.5);
  return G.build();
}

// an astronomer: a robe to the shoulders, a head leaning to one side, a cap, two arms (pose 0 at his sides, 1 both
// hands forward to an instrument, 2 one arm pointing up, 3 hands on a rail). He faces local +z.
function figure(G, x, y, z, yaw, o) {
  G.tr(x, y, z, yaw, o.h);
  G.kind(0).col(o.c, 1);
  G.lathe(0, 0, [[0.36, 0], [0.3, 0.55], [0.2, 1.0], [0.25, 1.32], [0.1, 1.5]], 6);
  G.col([0.62, 0.45, 0.34], 1); G.ball([o.tilt, 1.66, 0.02], 0.15, 6);
  G.col(o.c, 0.6); G.lathe(o.tilt, 0.02, [[0.19, 1.74], [0.17, 1.86], [0.02, 1.9]], 6);
  const arm = (sx, to) => G.bar([sx * 0.23, 1.36, 0], to, 0.065, 0.05, 4);
  if (o.pose === 1) { arm(-1, [-0.2, 1.3, 0.5]); arm(1, [0.2, 1.42, 0.5]); }
  else if (o.pose === 2) { arm(1, [0.36, 2.04, 0.2]); arm(-1, [-0.3, 0.9, 0.05]); }
  else if (o.pose === 3) { arm(-1, [-0.26, 1.1, 0.42]); arm(1, [0.26, 1.1, 0.42]); }
  else { arm(-1, [-0.3, 0.85, 0.04]); arm(1, [0.3, 0.85, 0.04]); }
  G.pop();
}
const ROBES = ['#3a4f9a', '#8a2f3a', '#2a6f68', '#6a4a8a', '#c9a23a', '#d8d2c0'].map(lin);
const drawFigure = (rng) => ({ h: rng.range(0.92, 1.08), c: rng.pick(ROBES), tilt: rng.range(0.07, 0.14) * (rng.chance(0.5) ? 1 : -1), pose: rng.int(1, 3), a: rng.range(0, TAU), keep: rng.range(0, 1) });

// where the instruments stand: drawn on the floor's two rings (outside the feet up to the gallery, and inside the hoop),
// each keeping 6 m plus its own reach from the flight's line (tested on the line at every 2.5 m) and a clear ball round
// the portal's seat, and 2 m from its neighbours
// the flight's line through the cave in steps of 2.5 m at most (for every clearance test)
function flightSteps(plan) {
  const line = [];
  for (let i = 0; i < plan.pts.length - 1; i++) {
    const a = plan.pts[i], b = plan.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2.5));
    for (let k = 0; k < n; k++) line.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n), lerp(a[2], b[2], k / n)]);
  }
  line.push(plan.pts[plan.pts.length - 1]);
  return line;
}
function layInstruments(rng, plan, count, line) {
  const KINDS = ['telescope', 'astrolabe', 'armillary', 'quadrant', 'sextant', 'pendulum', 'orrery'];
  const REACH = { telescope: 6.2, astrolabe: 3.2, armillary: 3.0, quadrant: 4.2, sextant: 2.6, pendulum: 2.6, orrery: 3.6 };
  const TALL = { telescope: 11, astrolabe: 9.5, armillary: 9, quadrant: 7.8, sextant: 8, pendulum: 11.4, orrery: 5.8 };
  const feet = []; for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; feet.push([CAVE.HOOP_R * Math.cos(a), CAVE.HOOP_R * Math.sin(a)]); }
  const out = [];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const inner = rng.chance(0.22), kind = rng.pick(KINDS), r = inner ? rng.range(9, 19.5) : rng.range(33, CAVE.GALLERY[0] - 6), a = rng.range(0, TAU), great = rng.chance(0.3);
    const sc = !inner && great && kind !== 'pendulum' ? 1.75 : 1, x = r * Math.cos(a), z = r * Math.sin(a), yaw = rng.range(0, TAU), reach = REACH[kind] * sc, tall = TALL[kind] * sc;
    if (inner && (tall > 9.6 || kind === 'telescope')) continue;
    let ok = Math.hypot(x - plan.seat[0], z - plan.seat[2]) > 10 + reach;
    for (let i = 0; ok && i < line.length; i++) { const q = line[i]; if (q[1] < tall + 6 && Math.hypot(q[0] - x, q[2] - z) < 6 + reach) ok = false; }
    for (let i = 0; ok && i < feet.length; i++) if (Math.hypot(feet[i][0] - x, feet[i][1] - z) < 3.5 + reach) ok = false;
    for (let i = 0; ok && i < out.length; i++) if (Math.hypot(out[i].x - x, out[i].z - z) < out[i].reach + reach + 2) ok = false;
    if (ok) out.push({ kind, x, z, yaw, reach, sc });
  }
  return out;
}

// ---------------------------------------------------------------- the piece
// opts: hand (+1 | -1: which way the flight's spiral turns; the instruments keep clear of that line), plan (a cavePlan),
//       density (0.7 .. 1.3: how many instruments), rare (the stone is turned hard over and plays about that lean)
export async function buildHero(ctx, opts = {}) {
  // every stream of draws the cave uses, made here from the world's seed and a name of its own
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('island-cave/' + name + ':' + ctx.seed));
  const S = { shell: stream('shell'), lay: stream('lay'), make: stream('make'), gallery: stream('gallery'), phase: stream('phase'), stone: stream('stone'), people: stream('people'), stores: stream('stores') };
  const hand = opts.hand ?? 1, plan = opts.plan || makeFlight({ hand }).cave, detail = ctx.quality?.detail ?? 1;
  const density = clamp(((opts.density ?? 1) - 0.7) / 0.6, 0, 1), rare = !!opts.rare;
  const C = {
    adam: lin('#1a2d4a'), adam2: lin('#0f1d36'), pale: lin('#d9dde6'), hoop: lin('#7d93b4'), brass: lin('#d8a548'), copper: lin('#c9773a'), wood: lin('#3d2a1a'),
    lamp: [1.0, 0.6, 0.18], stone: lin('#8a1f1f'), stoneDark: lin('#4a1414'), stoneVein: lin('#b4583c'),
  };
  const U = {
    uCaveInv: { value: new THREE.Matrix4() }, uWarm: { value: new THREE.Vector3(1.0, 0.66, 0.3) }, uCool: { value: new THREE.Vector3(0.3, 0.46, 0.8) },
    uPortalCol: { value: new THREE.Vector3(1.0, 0.86, 0.62) }, uPortal: { value: new THREE.Vector4(plan.seat[0], plan.seat[1], plan.seat[2], 1.1) },
    uTime: { value: 0 }, uTilt: { value: 0 }, uGain: { value: 1 }, uWell: { value: new THREE.Vector3(plan.well[0], plan.well[1], plan.wellR) },
  };
  const mat = caveMaterial(U), matDome = caveMaterial(U, THREE.BackSide);
  const object = new THREE.Group();

  // the shell and the hoop: one mesh, and the dome's facets as a second drawn from inside only
  const G = makeGeo(), GD = makeGeo();
  const lamps = shellInto(G, GD, S.shell, C);
  await ctx.yield();
  hoopInto(G, C);
  object.add(new THREE.Mesh(G.build(), mat), new THREE.Mesh(GD.build(), matDome));
  await ctx.yield();
  const stone = new THREE.Mesh(stoneGeometry(ctx.noise, C), mat);
  stone.position.set(0, CAVE.HOOP_Y, 0);
  object.add(stone);
  await ctx.yield();

  // the instruments on the floor (20 to 34 by the visit's density), and smaller ones on the gallery between the lamps
  const BUILD = { telescope, astrolabe, armillary, quadrant, sextant, pendulum: pendulumFrame, orrery: orreryBase };
  const line = flightSteps(plan), off = (x, y, z) => { let m = 1e9; for (const q of line) m = Math.min(m, Math.hypot(q[0] - x, q[1] - y, q[2] - z)); return m; };
  const spots = layInstruments(S.lay, plan, Math.round(lerp(20, 34, density) * (detail < 1 ? 0.8 : 1)), line);
  const GI = makeGeo(), spins = [], pends = [];
  const addMoving = (kind, info, x, y, z, yaw, sc) => {
    if (kind === 'pendulum') pends.push({ x, y: y + info.pivot * sc, z, yaw, sc: (info.pivot - 1.3) / 8 * sc, w: Math.sqrt(9.81 / ((info.pivot - 1.3) * sc)) * 1.6, ph: S.phase.range(0, TAU) });
    if (kind === 'orrery') for (let k = 0; k < 3; k++) spins.push({ x, y: y + (info.top + 0.6 + 0.6 * k) * sc, z, sc: (1 - 0.24 * k) * sc, v: (0.5 + 0.45 * k) * (k % 2 ? -1 : 1), ph: S.phase.range(0, TAU) });
  };
  for (let i = 0; i < spots.length; i++) {
    const q = spots[i];
    GI.tr(q.x, 0, q.z, q.yaw, q.sc);
    const info = BUILD[q.kind](GI, S.make, C);
    GI.pop();
    addMoving(q.kind, info, q.x, 0, q.z, q.yaw, q.sc);
    if (i % 3 === 2) await ctx.yield();
  }
  const SMALL = ['astrolabe', 'armillary', 'sextant', 'orrery', 'pendulum'];
  for (let k = 0; k < CAVE.LAMPS; k++) {
    if (k % 2 === 1) await ctx.yield();
    if (!S.gallery.chance(0.7)) continue;
    const a = (k + 0.5) / CAVE.LAMPS * TAU, r = (CAVE.GALLERY[0] + CAVE.GALLERY[1]) / 2 + 0.5, x = r * Math.cos(a), z = r * Math.sin(a), kind = S.gallery.pick(SMALL), yaw = -a + Math.PI / 2, sc = 0.55;
    GI.tr(x, CAVE.GALLERY[2], z, yaw, sc);
    const info = BUILD[kind](GI, S.make, C);
    GI.pop();
    addMoving(kind, info, x, CAVE.GALLERY[2], z, yaw, sc);
  }
  await ctx.yield();
  object.add(new THREE.Mesh(GI.build(), mat));
  await ctx.yield();

  // THE CAVE'S PEOPLE AND THEIR THINGS (their own mesh). Astronomers at the instruments (one at three in four, two at a
  // great one), each within the instrument's own reach (so within its margin from the line); people along the
  // gallery's rail looking at the stone; stores against the gallery's face (chests, casks, crates); four stairs
  // from the floor up to the gallery; and the long stair from the well's landing down the dome's wall to the
  // gallery, with people on it. A figure's numbers are drawn before his place is tried; nothing here stands within
  // 6 m of the flight's line.
  {
    const GP = makeGeo(), Pp = S.people, Ss = S.stores, GAL = CAVE.GALLERY;
    for (const q of spots) for (let k = 0; k < (q.sc > 1 ? 2 : 1); k++) {
      const o = drawFigure(Pp), d = q.reach * 0.5 + 0.5, x = q.x + d * Math.cos(o.a), z = q.z + d * Math.sin(o.a);
      if (o.keep > 0.75 || off(x, 1, z) < 6 || Math.abs(Math.hypot(x, z) - CAVE.HOOP_R) < 3.2) continue;
      figure(GP, x, 0, z, Math.atan2(q.x - x, q.z - z), o);
    }
    await ctx.yield();
    for (let k = 0; k < Math.round(lerp(26, 40, density)); k++) {
      const o = drawFigure(Pp), r = GAL[0] + 0.95, x = r * Math.cos(o.a), z = r * Math.sin(o.a);
      if (off(x, GAL[2] + 1, z) < 6) continue;
      figure(GP, x, GAL[2], z, Math.atan2(-x, -z), { ...o, pose: o.pose === 1 ? 3 : o.pose });
    }
    await ctx.yield();
    for (let k = 0; k < 9; k++) {
      const a = (k + Ss.range(0.2, 0.8)) / 9 * TAU, n = Ss.int(3, 5), items = Array.from({ length: n }, () => [Ss.int(0, 2), Ss.range(0.8, 1.2), Ss.range(-0.3, 0.3)]), x = (GAL[0] - 1.5) * Math.cos(a), z = (GAL[0] - 1.5) * Math.sin(a);
      if (off(x, 1, z) < 8) continue;
      GP.tr(x, 0, z, Math.atan2(Math.cos(a), Math.sin(a)));
      items.forEach(([kd, s, tw], i) => {
        const px = (i - (n - 1) / 2) * 1.7;
        if (kd === 0) { GP.kind(0).col(C.wood, 1.8); GP.box(px - 0.65 * s, 0, -0.4, px + 0.65 * s, 0.75 * s, 0.4, mulc(C.wood, 2.4)); GP.kind(1).col(C.brass, 1); GP.box(px - 0.67 * s, 0.3 * s, -0.42, px + 0.67 * s, 0.38 * s, 0.42); }
        else if (kd === 1) { GP.kind(0).col(C.wood, 2.2); GP.lathe(px, tw, [[0.38 * s, 0], [0.52 * s, 0.55 * s], [0.38 * s, 1.1 * s], [0.02, 1.1 * s]], 9); GP.kind(1).col(C.brass, 0.9); GP.lathe(px, tw, [[0.5 * s, 0.3 * s], [0.53 * s, 0.36 * s]], 9); }
        else { GP.kind(0).col(C.wood, 2.6); GP.box(px - 0.5 * s, 0, -0.5, px + 0.5 * s, 0.9 * s, 0.4); GP.box(px - 0.4 * s + tw, 0.9 * s, -0.4, px + 0.4 * s + tw, 1.55 * s, 0.3, mulc(C.wood, 3.2)); }
      });
      GP.pop();
    }
    for (let j = 0; j < 4; j++) {
      const a = (5 * j + 2.75) / CAVE.LAMPS * TAU, r = GAL[0] - 1.1, x = r * Math.cos(a), z = r * Math.sin(a);
      if (off(x, 1.5, z) < 7) continue;
      GP.tr(x, 0, z, Math.atan2(Math.cos(a), Math.sin(a)));
      for (let i = 0; i < 9; i++) { GP.kind(0).col(C.pale, i % 2 ? 0.42 : 0.5); GP.box(-4.5 + i * 0.5, 0, -1.1, -4 + i * 0.5, GAL[2] * (i + 1) / 9, 1.1); }
      GP.pop();
    }
    await ctx.yield();
    if (opts.landing) {
      const L = opts.landing, aL = Math.atan2(L[2], L[0]), n = Math.ceil((L[1] - GAL[2]) / 0.3), run = n * 0.48;
      const stepAt = (i, sg) => { const y = lerp(L[1], GAL[2], i / n), r = Math.min(domeR(y) - 1.5, GAL[1] - 1.3), a = aL + sg * run / CAVE.LAMP_R * (i / n); return [r * Math.cos(a), y, r * Math.sin(a), a]; };
      const least = (sg) => { let m = 1e9; for (let i = 0; i <= n; i += 2) { const p = stepAt(i, sg); m = Math.min(m, off(p[0], p[1] + 1, p[2])); } return m; };
      const sg = least(1) >= least(-1) ? 1 : -1;
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const p = stepAt(i, sg);
        GP.tr(p[0], p[1], p[2], Math.atan2(Math.cos(p[3]), Math.sin(p[3])));
        GP.kind(0).col(C.pale, i % 2 ? 0.42 : 0.5); GP.box(-0.3, -0.3, -1.7, 0.3, 0, 0.1);
        GP.pop();
        if (i % 4 === 0) {
          const r2 = Math.hypot(p[0], p[2]) - 1.6, q = [r2 * Math.cos(p[3]), p[1] + 1.05, r2 * Math.sin(p[3])];
          GP.kind(1).col(C.brass, 1); GP.bar([q[0], p[1], q[2]], q, 0.05, 0.05, 4);
          if (prev) GP.bar(prev, q, 0.04, 0.04, 4);
          prev = q;
        }
        if (i % 17 === 9) { const o = drawFigure(Pp), r3 = Math.hypot(p[0], p[2]) - 0.8; figure(GP, r3 * Math.cos(p[3]), p[1], r3 * Math.sin(p[3]), Math.atan2(-p[0], -p[2]) + sg * 1.2, { ...o, pose: o.pose === 1 ? 0 : o.pose }); }
        if (i % 30 === 29) await ctx.yield();
      }
    }
    object.add(new THREE.Mesh(GP.build(), mat));
    await ctx.yield();
  }

  // what turns and what swings: two instanced meshes, their matrices written each frame from the clock
  const spinMesh = new THREE.InstancedMesh(spinnerGeometry(C), mat, Math.max(1, spins.length));
  const pendMesh = new THREE.InstancedMesh(pendulumGeometry(C), mat, Math.max(1, pends.length));
  spinMesh.count = spins.length; pendMesh.count = pends.length;
  spinMesh.frustumCulled = false; pendMesh.frustumCulled = false;
  object.add(spinMesh, pendMesh);
  // a soft halo on each lamp
  const tU = { value: 0 };
  const halos = makeGlows({ positions: lamps.map((l) => [l[0], l[1] + 0.2, l[2]]), color: '#ffc46a', size: 3.6, intensity: 0.8, flicker: 0.18, time: tU, rng: stream('halo') });
  object.add(halos.object);

  // the stone plays on its axle: two slow swings on the clock (phases drawn), 9 degrees at most; on the rare visit it is
  // turned hard over (13 degrees) and plays 4 degrees about that
  const p1 = S.stone.range(0, TAU), p2 = S.stone.range(0, TAU), lean = rare ? (S.stone.chance(0.5) ? 1 : -1) * 13 * Math.PI / 180 : 0;
  const amp = (rare ? 4 : 9) * Math.PI / 180;
  const tiltAt = (time) => lean + amp * (0.75 * Math.sin(time * 0.21 + p1) + 0.25 * Math.sin(time * 0.47 + p2));
  const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _s = new THREE.Matrix4();
  const place = (time) => {
    const tilt = tiltAt(time);
    stone.rotation.x = tilt; U.uTilt.value = tilt; U.uTime.value = time; tU.value = time;
    for (let i = 0; i < spins.length; i++) {
      const q = spins[i];
      _m.makeTranslation(q.x, q.y, q.z).multiply(_r.makeRotationY(q.ph + time * q.v)).multiply(_s.makeScale(q.sc, q.sc, q.sc));
      spinMesh.setMatrixAt(i, _m);
    }
    for (let i = 0; i < pends.length; i++) {
      const q = pends[i];
      _m.makeTranslation(q.x, q.y, q.z).multiply(_r.makeRotationX(-tilt * 0.8)).multiply(_s.makeRotationY(q.yaw)).multiply(_r.makeRotationZ(0.2 * Math.sin(time * q.w + q.ph)));
      _m.multiply(_s.makeScale(q.sc, q.sc, q.sc));
      pendMesh.setMatrixAt(i, _m);
    }
    spinMesh.instanceMatrix.needsUpdate = true; pendMesh.instanceMatrix.needsUpdate = true;
  };
  place(0);

  return {
    object, radius: CAVE.R, height: CAVE.H, center: new THREE.Vector3(0, CAVE.HOOP_Y, 0), ground: false, groundY: 0,
    anchors: {
      seat: new THREE.Vector3(plan.seat[0], plan.seat[1], plan.seat[2]), stone: new THREE.Vector3(0, CAVE.HOOP_Y, 0),
      crown: new THREE.Vector3(0, CAVE.H, 0), plan,
    },
    uniforms: U, info: { instruments: spots.length, spinners: spins.length, pendulums: pends.length, triangles: G.triangles + GD.triangles + GI.triangles },
    tiltAt,
    // the colour and strength of the light the portal's ring throws on what stands round it
    setPortalLight(color, k = 1.1) { const c = new THREE.Color(color); U.uPortalCol.value.set(c.r, c.g, c.b); U.uPortal.value.w = k; },
    setLight(warm, cool) { if (warm) U.uWarm.value.copy(warm); if (cool) U.uCool.value.copy(cool); },
    update(dt, time, camera) {
      object.updateWorldMatrix(true, false);
      U.uCaveInv.value.copy(object.matrixWorld).invert();
      place(time);
      halos.update(dt, time, camera);
    },
    dispose() {},
  };
}
