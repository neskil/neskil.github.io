// THE CLEANER: the animal of "The Shoal over the High Street" (a banded caridean cleaner shrimp as long as an airship).
//
// OWN FRAME  nose toward +Z, back toward +Y, origin at mid body; 46 m from the tip of the beak (+23) to the end of the tail (-23)
//   at scale 1. Every figure below is in that frame, in metres at scale 1 (multiply by length / 46).
//
// INTERFACE (fixed by the brief)
//   buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time), dispose(), ground: false }
//   makeShrimps(ctx, opts { count, length 46, detail 'near' | 'far' | 'shadow', seedKey, sun, sunColor, skyColor, groundColor, castShadow })
//     -> { object, count, length, triangles, drawCalls, bounds, setPose(i, position, quaternion, scale, phase, hover), commit(),
//          update(dt, time), dispose(), setLight({ sun, sunColor, skyColor, groundColor }), mesh, material,
//          variety(i), setVariety(i, four numbers) }
//   phase 0..1 offsets the animal's clocks; hover 0 = swimming forward, 1 = hovering to groom. All limb motion is in the
//   vertex shader on the world's clock.
import * as THREE from 'three';

const BODY_L = 46;
const PAL = { red: '#c8261d', white: '#fbf6ee', dark: '#7c1411', lip: '#ffe2c4', belly: '#f3dcc8', feeler: '#f4e7cd', eye: '#07070a', stalk: '#f1dcc8', amber: '#f2a53a' };

// ---------- the whips (feelers): one table read by the shader and by the CPU (bounds, sampling) ----------
// id 0: the long feeler (one pair). id 1, 2: the two short feelers of each side. Angles in radians: az from +Z toward the
// animal's own side, el above level. [length, root radius, tip radius, root x, y, z]
const WHIPS = [
  { len: 30, r0: 0.15, r1: 0.03, root: [1.95, -0.32, 19.3] },
  { len: 15, r0: 0.13, r1: 0.03, root: [0.80, 0.90, 20.1] },
  { len: 13, r0: 0.13, r1: 0.03, root: [0.56, 0.68, 20.2] },
];
// radius of whip `id` at arc length s: 0.3 m thick at the root of the long ones, a hair (6 cm) near the tip, to nothing over the last tenth
const whipRadius = (id, s) => { const W = WHIPS[id], u = Math.max(0, 1 - s / W.len); return (W.r1 + (W.r0 - W.r1) * Math.pow(u, 1.2)) * Math.min(1, u * 10); };
// the least radius of any feeler in metres of the world (0.2 m thick), at every size of animal; only the pointed end is finer
const WHIP_FLOOR = 0.1;
const WHIP_STEPS = 16, WHIP_SWIM = 1.9, BEAT_WHIP_SWIM = WHIP_SWIM.toFixed(4);   // the feelers' waves run this many times as fast when the animal swims
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t, clamp01 = (x) => Math.min(1, Math.max(0, x));
// THE LONG FEELER'S TWO POSES (own frame; az is measured toward the animal's own side, el above level):
//   swimming: out and forward from the root, round a bend of about 3 m and back along the flank in a bow: it sinks and spreads
//   toward its tip, and a slow wave runs down it on the animal's own clock, so that it is never a straight line
//   hovering: out to the side round a quarter circle of HANG.rho, then plumb down the animal's own -Y. With a drape (depth D below the
//   origin, heading A) the plumb line turns level round a quarter circle of HANG.rho2 so that it lies AT depth D, and trails along A.
const HANG = { rho: 4.4, rho2: 3.0, e0: 0.06, az: 1.15 }, HALF_PI = Math.PI / 2;
// direction of whip `id` at arc length s (metres), hover h, clock t (the animal's own seconds), side +1 / -1, drape depth D and heading A
function whipDir(id, s, h, t, side, D, A, out) {
  let az, el, k, lie = 0;
  if (id === 0) {
    k = s / WHIPS[0].len;
    const sa = HANG.rho * HALF_PI, s1 = Math.max(sa * 0.6, sa + (D + WHIPS[0].root[1] - HANG.rho) - HANG.rho2);
    lie = clamp01((s - s1) / (HANG.rho2 * HALF_PI)) * h;
    const azS = mix(1.30, 3.13, sstep(0, 4.4, s)) - 0.10 * k * k, elS = mix(0.22, -0.075, sstep(0, 9, s)) - 0.26 * k * k;
    const azH = mix(HANG.az, side * A, sstep(s1 - 2.5, s1 - 0.2, s)), elH = -HANG.e0 - (HALF_PI - HANG.e0) * clamp01(s / sa) + HALF_PI * clamp01((s - s1) / (HANG.rho2 * HALF_PI));
    az = mix(azS, azH, h); el = mix(elS, elH, h);
  } else if (id === 1) {
    k = s / WHIPS[1].len;
    az = 0.17 + 0.05 * k; el = mix(mix(0.52, 0.26, k), mix(0.36, 0.02, k), h);
  } else {
    k = s / WHIPS[2].len;
    az = 0.07 + 0.06 * k; el = mix(mix(0.20, 0.02, k), mix(0.06, -0.26, k), h);
  }
  const ce = Math.cos(el);
  let x = Math.sin(az) * ce, y = Math.sin(el), z = Math.cos(az) * ce;
  const draped = id === 0 && D < 500 ? h : 0;   // a draped feeler sways little: its level run must lie still enough to fly beside
  const a = (id === 0 ? mix(0.05 + 0.13 * k, 0.05 + 0.15 * k, h) : 0.03 + 0.10 * k) * (1 - 0.5 * draped) * (1 - 0.5 * lie), kk = id === 0 ? 0.24 : 0.3, ph = id * 1.7 + (side > 0 ? 0 : 2.4);
  const rt = t * mix(BEAT.whipSwim, 1, h);
  x += a * Math.sin(kk * s - 0.80 * rt + ph);
  y += a * 0.7 * (1 - lie) * Math.sin(kk * 0.8 * s - 0.62 * rt + ph * 1.3 + 1.0);
  z += a * 0.6 * Math.sin(kk * 0.9 * s - 0.71 * rt + ph * 0.7 + 2.0);
  const l = 1 / Math.hypot(x, y, z);
  out[0] = x * l * side; out[1] = y * l; out[2] = z * l;
  return out;
}
// centre of whip `id` at arc length s: the same sum the shader makes (a draped feeler is never under its floor)
const _d = [0, 0, 0];
function whipPoint(id, s, h, t, side, D, A, out) {
  const W = WHIPS[id]; let x = W.root[0] * side, y = W.root[1], z = W.root[2];
  for (let i = 0; i < WHIP_STEPS; i++) {
    const u0 = i / WHIP_STEPS, u1 = (i + 1) / WHIP_STEPS, um = (u0 + u1) * 0.5;
    whipDir(id, s * um * um, h, t, side, D, A, _d); const ds = s * (u1 * u1 - u0 * u0); x += _d[0] * ds; y += _d[1] * ds; z += _d[2] * ds;
  }
  if (id === 0) y = Math.max(y, -D);
  out[0] = x; out[1] = y; out[2] = z; return out;
}
const GLSL_WHIP = /* glsl */`
vec3 whipDir(float id, float s, float h, float t, float side, vec2 drape) {
  float az, el, k, lie = 0.0;
  if (id < 0.5) {
    k = s / ${WHIPS[0].len.toFixed(1)};
    float sa = ${(HANG.rho * HALF_PI).toFixed(5)}, sb = ${(HANG.rho2 * HALF_PI).toFixed(5)};
    float s1 = max(sa * 0.6, sa + (drape.x + ${WHIPS[0].root[1].toFixed(4)} - ${HANG.rho.toFixed(4)}) - ${HANG.rho2.toFixed(4)});
    float turn = clamp((s - s1) / sb, 0.0, 1.0);
    lie = turn * h;
    float azS = mix(1.30, 3.13, smoothstep(0.0, 4.4, s)) - 0.10 * k * k, elS = mix(0.22, -0.075, smoothstep(0.0, 9.0, s)) - 0.26 * k * k;
    float azH = mix(${HANG.az.toFixed(4)}, side * drape.y, smoothstep(s1 - 2.5, s1 - 0.2, s));
    float elH = -${HANG.e0.toFixed(4)} - ${(HALF_PI - HANG.e0).toFixed(5)} * clamp(s / sa, 0.0, 1.0) + 1.570796 * turn;
    az = mix(azS, azH, h); el = mix(elS, elH, h);
  } else if (id < 1.5) {
    k = s / ${WHIPS[1].len.toFixed(1)};
    az = 0.17 + 0.05 * k; el = mix(mix(0.52, 0.26, k), mix(0.36, 0.02, k), h);
  } else {
    k = s / ${WHIPS[2].len.toFixed(1)};
    az = 0.07 + 0.06 * k; el = mix(mix(0.20, 0.02, k), mix(0.06, -0.26, k), h);
  }
  float ce = cos(el);
  vec3 d = vec3(sin(az) * ce, sin(el), cos(az) * ce);
  float draped = id < 0.5 && drape.x < 500.0 ? h : 0.0;
  float a = (id < 0.5 ? mix(0.05 + 0.13 * k, 0.05 + 0.15 * k, h) : 0.03 + 0.10 * k) * (1.0 - 0.5 * draped) * (1.0 - 0.5 * lie), kk = id < 0.5 ? 0.24 : 0.3, ph = id * 1.7 + (side > 0.0 ? 0.0 : 2.4);
  float rt = t * mix(${BEAT_WHIP_SWIM}, 1.0, h);
  d.x += a * sin(kk * s - 0.80 * rt + ph);
  d.y += a * 0.7 * (1.0 - lie) * sin(kk * 0.8 * s - 0.62 * rt + ph * 1.3 + 1.0);
  d.z += a * 0.6 * sin(kk * 0.9 * s - 0.71 * rt + ph * 0.7 + 2.0);
  d = normalize(d); d.x *= side;
  return d;
}
vec3 whipPoint(vec3 root, float id, float s, float h, float t, float side, vec2 drape) {
  vec3 p = root;
  for (int i = 0; i < ${WHIP_STEPS}; i++) {
    float u0 = float(i) / ${WHIP_STEPS}.0, u1 = float(i + 1) / ${WHIP_STEPS}.0, um = (u0 + u1) * 0.5;
    p += whipDir(id, s * um * um, h, t, side, drape) * (s * (u1 * u1 - u0 * u0));
  }
  if (id < 0.5) p.y = max(p.y, -drape.x);
  return p;
}`;

// ---------- geometry builder ----------
// attributes: position, normal, aColor (linear), aPivot (first hinge), aPivot2 (second hinge), aAnim (kind, index, param, side)
// aFx (sheet: a single flat skin lit from both sides, shine: strength of the highlight)
// kinds: 0 body, 2 swimming leg, 3 walking leg, 4 whip
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.pv = []; this.pv2 = []; this.a = []; this.fx = []; this.sg = []; this.idx = []; this.keys = []; this.cur = { pv: [0, 0, 0], pv2: [0, 0, 0], a: [0, 0, 0, 0], fx: [0, 0] }; }
  get count() { return this.p.length / 3; }
  get triangles() { return this.idx.length / 3; }
  set(pv, pv2, a, fx) { this.cur = { pv, pv2: pv2 || pv, a, fx: fx || [0, 0] }; return this; }
  v(x, y, z, nx, ny, nz, col) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(col.r, col.g, col.b);
    const k = this.cur; this.pv.push(k.pv[0], k.pv[1], k.pv[2]); this.pv2.push(k.pv2[0], k.pv2[1], k.pv2[2]); this.a.push(k.a[0], k.a[1], k.a[2], k.a[3]); this.fx.push(k.fx[0], k.fx[1]);
    return this.p.length / 3 - 1;
  }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  // round tube along a polyline, radial normals; cols: one colour or one per point; closed ends by a fan
  tube(pts, radii, sides, cols, capStart = true, capEnd = true) {
    const N = pts.length, rows = []; let ax = null;
    const T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(N - 1, i + 1)];
      T.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      if (!ax) { ax = new THREE.Vector3(1, 0, 0); if (Math.abs(T.x) > 0.9) ax.set(0, 0, 1); }
      A.copy(ax).addScaledVector(T, -ax.dot(T)).normalize(); ax.copy(A); B.crossVectors(T, A);
      const r = Array.isArray(radii) ? radii[i] : radii, col = Array.isArray(cols) ? cols[i] : cols, row = [];
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), nx = A.x * cs + B.x * sn, ny = A.y * cs + B.y * sn, nz = A.z * cs + B.z * sn;
        row.push(this.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, col));
      }
      rows.push(row);
      if ((i === 0 && capStart) || (i === N - 1 && capEnd)) {
        const s = i === 0 ? -1 : 1, c = this.v(p[0], p[1], p[2], T.x * s, T.y * s, T.z * s, col);
        for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; if (i === 0) this.tri(c, row[j1], row[j]); else this.tri(c, row[j], row[j1]); }
      }
    }
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; this.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.pv, 3));
    g.setAttribute('aPivot2', new THREE.Float32BufferAttribute(this.pv2, 3));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.fx, 2));
    g.setIndex(this.idx);
    return g;
  }
}

// ---------- the real animal: body ----------
// smooth table through [x, y] rows (x rising): Catmull-Rom
const table = (rows) => (x) => {
  const n = rows.length; if (x <= rows[0][0]) return rows[0][1]; if (x >= rows[n - 1][0]) return rows[n - 1][1];
  let i = 0; while (x > rows[i + 1][0]) i++;
  const p0 = rows[Math.max(0, i - 1)][1], p1 = rows[i][1], p2 = rows[i + 1][1], p3 = rows[Math.min(n - 1, i + 2)][1], t = (x - rows[i][0]) / (rows[i + 1][0] - rows[i][0]);
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
};
// THE HUMP: the tail part's own line bends down from zs = HUMP0 over HUMP_L metres by HUMP_A (the back's line, which also tapers, by about 27 degrees).
// zs is the place along the animal as if it lay straight; bend(x, y, zs) gives the true place.
const HUMP0 = -1.4, HUMP_L = 5.2, HUMP_A = 17.5 * Math.PI / 180;
function axis(zs) {
  const u = HUMP0 - zs; if (u <= 0) return { y: 0, z: zs, a: 0 };
  const k = HUMP_A / HUMP_L;
  if (u < HUMP_L) return { y: -(1 - Math.cos(k * u)) / k, z: HUMP0 - Math.sin(k * u) / k, a: k * u };
  const y1 = -(1 - Math.cos(HUMP_A)) / k, z1 = HUMP0 - Math.sin(HUMP_A) / k;
  return { y: y1 - (u - HUMP_L) * Math.sin(HUMP_A), z: z1 - (u - HUMP_L) * Math.cos(HUMP_A), a: HUMP_A };
}
function bend(x, y, zs, out) { const A = axis(zs), c = Math.cos(A.a), s = Math.sin(A.a); out[0] = x; out[1] = A.y + y * c; out[2] = A.z - y * s; return out; }
// a rigid frame at zs: maps a point given in straight coordinates near zs (limbs keep their shape)
function frameAt(zs) { const A = axis(zs), c = Math.cos(A.a), s = Math.sin(A.a); return (x, y, z) => { const dz = z - zs; return [x, A.y + y * c + dz * s, A.z - y * s + dz * c]; }; }
const ZS_TAIL = -24.0;   // the tail's end in straight coordinates: lands at z = -23 once bent

// nominal outline of the body by zs: back line, belly line, half width
const SHIELD = { top: table([[4.6, 3.1], [8, 2.98], [11, 3.0], [14, 3.08], [16, 2.6], [17.25, 1.95]]), bot: table([[4.6, -3.1], [8, -3.3], [11, -3.3], [14, -3.15], [16, -2.7], [17.25, -2.1]]), hw: table([[4.6, 2.4], [8, 2.5], [11, 2.5], [14, 2.3], [16, 1.9], [17.25, 1.4]]) };
const TAILP = { top: table([[-17.3, 1.0], [-12.6, 1.65], [-9.3, 2.2], [-5.9, 2.75], [-2.2, 3.12], [1.3, 3.0], [4.9, 2.85]]), bot: table([[-17.3, -0.75], [-12.6, -1.15], [-9.3, -1.5], [-5.9, -1.9], [-2.2, -2.3], [1.3, -2.55], [4.9, -2.75]]), hw: table([[-17.3, 1.05], [-12.6, 1.45], [-9.3, 1.7], [-5.9, 1.95], [-2.2, 2.15], [1.3, 2.25], [4.9, 2.3]]) };
// the six plates of the tail part: [front zs, rear zs, depth of the side lobe below the belly line, band colour]
const PLATES = [[4.9, 1.3, 0.9, 'white'], [1.3, -2.2, 1.15, 'red'], [-2.2, -5.9, 1.0, 'red'], [-5.9, -9.3, 0.9, 'white'], [-9.3, -12.6, 0.8, 'red'], [-12.6, -17.3, 0.4, 'white']];
const HEAD_BAND = 13.0;   // forward of this the shield is white, behind it red

// half outline of one cross-section, from the top's middle down the flank to the flap's edge, then the underside: [x, y, smoothing group]
function section(S, nu, nl) {
  const pts = [], e = S.e ?? 0.8;
  for (let j = 0; j <= nu; j++) { const a = (j / nu) * Math.PI / 2; pts.push([S.hw * Math.pow(Math.sin(a), e), S.mid + (S.top - S.mid) * Math.pow(Math.cos(a), e), 0]); }
  for (let j = 1; j <= nl; j++) { const a = (j / nl) * Math.PI / 2; pts.push([S.fx + (S.hw - S.fx) * Math.pow(Math.cos(a), e), S.mid - (S.mid - S.flap) * Math.pow(Math.sin(a), e), 0]); }
  pts.push([S.fx, S.flap, 1], [S.bw, S.bot, 1], [S.bw * 0.5, S.bot - 0.3 * (S.bulge ?? 1), 1], [0, S.bot - 0.4 * (S.bulge ?? 1), 1]);
  return pts;
}
// one ring of vertices from a half outline; col: (x, y, group, j) -> colour. Order: top, +X side, bottom, -X side.
Builder.prototype.ring = function (half, zs, col, sg = -1, bent = true) {
  const m = half.length, ids = [], o = [0, 0, 0];
  for (let k = 0; k < 2 * m - 2; k++) {
    const j = k < m ? k : 2 * m - 2 - k, h = half[j], x = k < m ? h[0] : -h[0];
    if (bent) bend(x, h[1], zs, o); else { o[0] = x; o[1] = h[1]; o[2] = zs; }
    const id = this.v(o[0], o[1], o[2], 0, 1, 0, col(x, h[1], h[2], j)); this.sg[id] = sg < 0 ? h[2] : sg; ids.push(id);
  }
  return ids;
};
Builder.prototype.bridge = function (A, B) { const n = A.length; for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; this.quad(A[j], A[j1], B[j1], B[j]); } };
Builder.prototype.cap = function (R, x, y, z, col, front) { const c = this.v(x, y, z, 0, 0, front ? 1 : -1, col), n = R.length; this.sg[c] = this.sg[R[0]] || 0; for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; if (front) this.tri(c, R[j1], R[j]); else this.tri(c, R[j], R[j1]); } return c; };
// normals of the vertices [v0, v1) from the triangles [i0, i1), welded across vertices that share a place and a smoothing group
Builder.prototype.smooth = function (v0, i0, v1 = this.count, i1 = this.idx.length) {
  const p = this.p, n = this.n, idx = this.idx;
  for (let i = v0 * 3; i < v1 * 3; i++) n[i] = 0;
  for (let i = i0; i < i1; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) { n[q] += nx; n[q + 1] += ny; n[q + 2] += nz; }
  }
  const map = new Map();
  for (let i = v0; i < v1; i++) {
    const key = ((Math.round(p[i * 3] * 200) + 8192) * 16384 + Math.round(p[i * 3 + 1] * 200) + 8192) * 65536 + (Math.round(p[i * 3 + 2] * 200) + 8192) * 4 + (this.sg[i] || 0);
    let e = map.get(key); if (!e) { e = [0, 0, 0, []]; map.set(key, e); }
    e[0] += n[i * 3]; e[1] += n[i * 3 + 1]; e[2] += n[i * 3 + 2]; e[3].push(i);
  }
  for (const e of map.values()) { const l = Math.hypot(e[0], e[1], e[2]) || 1; for (const i of e[3]) { n[i * 3] = e[0] / l; n[i * 3 + 1] = e[1] / l; n[i * 3 + 2] = e[2] / l; } }
};

// detail: counts for the two skins of one family
const DETAIL = {
  near: { nu: 10, nl: 6, shield: [17.25, 16.6, 15.9, 15.0, 14.0], shieldRed: [11.8, 10.6, 9.4, 8.2, 7.0, 5.8], plate: [0, 0.14, 0.32, 0.5, 0.68, 0.84], whip: [72, 9, 28, 7], leg: 7, eye: [10, 7], rim: true },
  far: { nu: 3, nl: 2, shield: [17.25, 15.6], shieldRed: [10.4, 7.6], plate: [0, 0.5], whip: [26, 3, 9, 3], leg: 3, eye: [5, 3], rim: false },
  // the lightest: the same animal in the fewest faces, for a skin that is only ever drawn as a shadow
  shadow: { nu: 1, nl: 1, shield: [17.25], shieldRed: [9], plate: [0], whip: [9, 3, 4, 3], leg: 3, eye: [3, 2], rim: false },
};
const skinOf = (d) => (d === 'far' || d === 'shadow' ? d : 'near');
const RIM = 0.3, LIP = 0.1;   // each plate ends in a dark edge RIM wide, its last LIP a thin pale lip

function buildBody(b, Q, C, later = false) {
  const v0 = b.count, i0 = b.idx.length;
  b.set([0, 0, 0], null, [0, 0, 0, 0], [0, 0.6]);
  // colours of one ring: the band's own all the way round (the bands must read from below), with a dark lower border on the flaps
  const edge = Q.nu + Q.nl, one = (c) => (x, y, g, j) => (Q.rim && j === edge ? C.dark : c);
  // where the shell is thin and light passes (aFx.x = 0.5): the flaps' lower edge all along, and each plate's rear rim
  const m2 = 2 * (edge + 5) - 2, thinEdge = (R) => { b.fx[R[edge] * 2] = 0.5; b.fx[R[m2 - edge] * 2] = 0.5; return R; }, thinAll = (R) => { for (const id of R) b.fx[id * 2] = 0.5; return R; };
  // ----- the shield: a tall saddle, closed in front by a blunt face -----
  const sh = (zs, k = 1, grow = 0) => { const top = SHIELD.top(zs) * k + grow, bot = SHIELD.bot(zs) * k, hw = SHIELD.hw(zs) * k + grow * 0.6; return { top, bot, hw, mid: bot + 0.44 * (top - bot), flap: bot - 0.38 * k, fx: 0.82 * hw, bw: 0.5 * hw, e: 0.78 }; };
  const ringSh = (zs, c, k, grow, sg) => thinEdge(b.ring(section(sh(zs, k, grow), Q.nu, Q.nl), zs, one(c), sg));
  let R = ringSh(17.25, C.white, 0.45, 0); b.cap(R, 0, -0.1, 18.55, C.white, true);
  // (the face ring sits at zs 18.2: move it there)
  for (const id of R) b.p[id * 3 + 2] += 0.95;
  let P = R; R = ringSh(17.25, C.white, 0.8, 0); for (const id of R) b.p[id * 3 + 2] += 0.5; b.bridge(P, R); P = R;
  for (const zs of Q.shield) { R = ringSh(zs, C.white); b.bridge(P, R); P = R; }
  R = ringSh(HEAD_BAND, C.white); b.bridge(P, R); P = ringSh(HEAD_BAND, C.red);
  for (const zs of Q.shieldRed) { R = ringSh(zs, C.red, 1, zs < 6 ? 0.05 : 0); b.bridge(P, R); P = R; }
  if (Q.rim) { R = ringSh(4.6 + RIM, C.red, 1, 0.1); b.bridge(P, R); P = ringSh(4.6 + RIM, C.dark, 1, 0.1); R = thinAll(ringSh(4.6 + LIP, C.dark, 1, 0.13)); b.bridge(P, R); P = thinAll(ringSh(4.6 + LIP, C.lip, 1, 0.13)); R = thinAll(ringSh(4.6, C.lip, 1, 0.14)); b.bridge(P, R); }
  else { R = thinAll(ringSh(4.6, C.red, 1, 0.14)); b.bridge(P, R); }
  // ----- the six plates of the tail part, each lapping over the next, with side lobes -----
  const pl = (k, zs, u, stepIn = 0) => {
    const lobe = PLATES[k][2], off = 0.24 * u + 0.11 * Math.sin(Math.PI * u) - stepIn;
    const top = TAILP.top(zs) + off, bot = TAILP.bot(zs), hw = TAILP.hw(zs) + off * 0.8;
    return { top, bot, hw, mid: bot + 0.5 * (top - bot), flap: bot - lobe * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.6), fx: 0.9 * hw, bw: 0.5 * hw, e: 0.86 };
  };
  let rim = ringSh(4.6, C.dark, 1, 0.14, 2);   // the shield's rear rim again, as a hard edge for the step down onto the first plate
  for (let k = 0; k < 6; k++) {
    const zf = PLATES[k][0] + (k ? 0.3 : 0), zr = PLATES[k][1], c = C[PLATES[k][3]], zAt = (u) => zf + (zr - zf) * u;
    // the step from the rim before down onto this plate's skin at the same place, then the plate itself
    const zrim = k ? PLATES[k - 1][1] : 4.6, urim = (zrim - zf) / (zr - zf), ring = (u, cc, sg) => thinEdge(b.ring(section(pl(k, zAt(u), u), Q.nu, Q.nl), zAt(u), one(cc), sg));
    const shade = (cc, f) => (f >= 1 ? cc : cc.clone().multiplyScalar(f));
    b.bridge(rim, ring(urim, C.dark, 2));
    P = ring(urim, shade(c, Q.rim ? 0.55 : 0.72));   // each plate comes out of the shadow of the one before: it rounds over
    for (const u of Q.plate) { if (u <= urim + 0.03) continue; R = ring(u, shade(c, u < 0.2 ? 0.86 : 1)); b.bridge(P, R); P = R; }
    if (Q.rim) {
      const ue = 1 - RIM / (zf - zr), ul = 1 - LIP / (zf - zr);
      R = ring(ue, c); b.bridge(P, R); P = ring(ue, C.dark); R = thinAll(ring(ul, C.dark)); b.bridge(P, R); P = thinAll(ring(ul, C.lip)); R = thinAll(ring(1, C.lip)); b.bridge(P, R);
    } else { R = thinAll(ring(1, c)); b.bridge(P, R); }
    rim = ring(1, C.dark, 2);
  }
  // the last rim closes onto the root of the tail fan
  const zr = PLATES[5][1], S = pl(5, zr, 1); S.top *= 0.55; S.bot *= 0.5; S.hw *= 0.6; S.flap = S.bot; S.fx = 0.9 * S.hw; S.bw = 0.5 * S.hw;
  R = b.ring(section(S, Q.nu, Q.nl), zr, one(C.dark), 2); b.bridge(rim, R);
  const o = bend(0, 0.1, zr - 0.5, [0, 0, 0]); b.cap(R, o[0], o[1], o[2], C.dark, false);
  const v1 = b.count, i1 = b.idx.length;
  if (later) return () => b.smooth(v0, i0, v1, i1);   // the normals as a step of their own
  b.smooth(v0, i0);
}

// rows [[x, y, z, radius, colour], ...] -> a round tube; repeat a point with another colour for a hard band edge
Builder.prototype.pipe = function (rows, sides, capS = true, capE = true) { this.tube(rows.map((r) => [r[0], r[1], r[2]]), rows.map((r) => r[3]), sides, rows.map((r) => r[4]), capS, capE); };
// a ball with true normals
Builder.prototype.ball = function (cx, cy, cz, r, seg, rings, col) {
  const rows = [];
  for (let i = 0; i <= rings; i++) {
    const a = (i / rings) * Math.PI, sy = Math.cos(a), sr = Math.sin(a), row = [];
    if (i === 0 || i === rings) { rows.push([this.v(cx, cy + sy * r, cz, 0, sy, 0, col)]); continue; }
    for (let j = 0; j < seg; j++) { const t = (j / seg) * Math.PI * 2, nx = Math.cos(t) * sr, nz = Math.sin(t) * sr; row.push(this.v(cx + nx * r, cy + sy * r, cz + nz * r, nx, sy, nz, col)); }
    rows.push(row);
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg, A = rows[i], B = rows[i + 1];
    if (A.length === 1) this.tri(A[0], B[j1], B[j]); else if (B.length === 1) this.tri(A[j], A[j1], B[0]); else this.quad(A[j], A[j1], B[j1], B[j]);
  }
};
// a flat leaf between two edge lines of equal count (a single skin, lit from both sides); cols per station
Builder.prototype.leaf = function (ea, eb, cols, mid) {
  const v0 = this.count, i0 = this.idx.length, A = [], M = [], B = [];
  for (let i = 0; i < ea.length; i++) {
    const c = Array.isArray(cols) ? cols[i] : cols;
    A.push(this.v(ea[i][0], ea[i][1], ea[i][2], 0, 1, 0, c)); B.push(this.v(eb[i][0], eb[i][1], eb[i][2], 0, 1, 0, c));
    if (mid) M.push(this.v(mid[i][0], mid[i][1], mid[i][2], 0, 1, 0, c));
  }
  for (let i = 0; i < ea.length - 1; i++) { if (mid) { this.quad(A[i], M[i], M[i + 1], A[i + 1]); this.quad(M[i], B[i], B[i + 1], M[i + 1]); } else this.quad(A[i], B[i], B[i + 1], A[i + 1]); }
  this.smooth(v0, i0);
};

function buildHead(b, Q, C) {
  const near = Q.rim, RIGID = [0, 0, 0, 0];
  // ----- the beak: a thin pale blade from the shield's back line, upcurved, its top edge red and toothed -----
  const top = (z) => 3.05 + 0.0115 * (z - 14.6) * (z - 14.6), bot = (z) => (z <= 17.3 ? SHIELD.top(z) - 0.45 : 1.5 + (top(23) - 1.5) * Math.pow((z - 17.3) / 5.7, 1.3));
  const zs = near ? [14.6, 15.4, 16.2] : [14.6, 17.3, 20.4];
  if (near) for (let i = 0; i < 8; i++) { const z0 = 16.6 + i * 0.7; zs.push(z0, z0 + 0.56, z0 + 0.63); }
  zs.push(near ? 22.5 : 22.0, 23.0);
  b.set([0, 0, 0], null, RIGID, [0, 0.5]);
  const v0 = b.count, i0 = b.idx.length; let P = null;
  for (let i = 0; i < zs.length; i++) {
    const z = zs[i], tooth = near && i >= 3 && i < 27 && (i - 3) % 3 === 1, t = top(z) + (tooth ? 0.55 : 0), bo = Math.min(bot(z), t - 0.02), w = 0.34 * (1 - (z - 14.6) / 8.6) + 0.05, m = (t + bo) / 2;
    const band = C.white, lip = Math.min(0.5, (t - bo) * 0.36);
    const R = near ? [b.v(0, t, z, 0, 1, 0, C.red), b.v(w * 0.6, t - lip, z, 1, 0, 0, C.red), b.v(w, m, z, 1, 0, 0, band), b.v(0, bo, z, 0, -1, 0, band), b.v(-w, m, z, -1, 0, 0, band), b.v(-w * 0.6, t - lip, z, -1, 0, 0, C.red)]
      : [b.v(0, t, z, 0, 1, 0, C.red), b.v(w, m, z, 1, 0, 0, band), b.v(0, bo, z, 0, -1, 0, band), b.v(-w, m, z, -1, 0, 0, band)];
    if (P) b.bridge(R, P); P = R;
  }
  b.smooth(v0, i0);
  // ----- eyes: black balls on short pale stalks, out to the side and a little forward -----
  for (const s of [-1, 1]) {
    b.set([0, 0, 0], null, RIGID, [0, 0.3]);
    b.pipe([[s * 0.9, 1.2, 16.9, 0.4, C.stalk], [s * 1.7, 1.5, 17.4, 0.36, C.stalk], [s * 2.25, 1.68, 17.72, 0.33, C.stalk]], Q.leg, false, false);
    b.set([0, 0, 0], null, RIGID, [0, 1]);
    b.ball(s * 2.62, 1.76, 17.95, 0.58, Q.eye[0], Q.eye[1], C.eye);
  }
  // ----- the roots of the feelers and the leaf-shaped scale beside each long one -----
  for (const s of [-1, 1]) {
    b.set([0, 0, 0], null, RIGID, [0, 0.4]);
    const W0 = WHIPS[0].root, W1 = WHIPS[1].root;
    b.pipe([[s * 1.2, -0.6, 17.1, 0.58, C.red], [s * 1.55, -0.48, 18.3, 0.52, C.red], [s * 1.55, -0.48, 18.3, 0.52, C.white], [s * W0[0], W0[1], W0[2], 0.4, C.white]], Q.leg, false, true);
    b.pipe([[s * 0.5, 0.4, 17.7, 0.36, C.white], [s * 0.6, 0.62, 19.1, 0.32, C.white], [s * 0.6, 0.62, 19.1, 0.32, C.red], [s * 0.68, 0.78, 20.15, 0.27, C.red]], Q.leg, false, true);
    // the scale: a pointed leaf lying forward over the long feeler's root, its outer edge dipped
    b.set([0, 0, 0], null, RIGID, [1, 0.3]);
    const n = near ? 9 : 4, ea = [], eb = [], mid = [], cols = [], ts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; ts.push([t, t > 0.62 ? C.red : C.white]); if (t < 0.62 && (i + 1) / n > 0.62) ts.push([0.62, C.white], [0.62, C.red]); }
    for (const [t, c] of ts) {
      const w = 0.85 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.8) * (1 - 0.25 * t) + 0.02, z = 17.0 + 5.0 * t, x = 1.55 + 0.75 * t, y = 0.2 + 0.4 * t;
      ea.push([s * (x - w * 0.92), y + w * 0.38, z]); eb.push([s * (x + w * 0.92), y - w * 0.38, z]); mid.push([s * x, y + 0.16 * Math.sin(Math.PI * Math.pow(t, 0.6)), z]); cols.push(c);
    }
    b.leaf(ea, eb, cols, near ? mid : null);
    // the mouth legs: a pair of short banded limbs carried forward under the head
    b.set([0, 0, 0], null, RIGID, [0, 0.3]);
    if (near) b.pipe([[s * 0.7, -2.2, 16.6, 0.34, C.red], [s * 0.95, -2.75, 18.4, 0.3, C.red], [s * 0.95, -2.75, 18.4, 0.3, C.white], [s * 0.9, -2.55, 20.2, 0.25, C.white], [s * 0.9, -2.55, 20.2, 0.25, C.red], [s * 0.8, -2.2, 21.6, 0.14, C.red]], Q.leg, false, true);
  }
}

// walking legs: [root z, kind (0 short with a pincer, 1 long), size]; own shape in metres from the root: knee 1, knee 2, end
const WALK = [[14.6, 0, 1.0], [12.7, 0, 1.18], [10.7, 1, 0.94], [8.7, 1, 1.0], [6.7, 1, 1.04]];
const WALK_SHAPE = [
  { k1: [1.1, -1.3, 0.9], k2: [0.2, -0.9, 1.5], end: [-0.1, 0.15, 1.3] },          // short: carried forward and down, folded, ready to pick
  { k1: [1.7, -1.3, -1.7], k2: [0.55, -1.0, -2.5], end: [0.05, -0.7, -2.5] },      // long: trailing back and down
];
// swimming legs under plates 1 to 5 (index 0 front .. 4 hindmost): zs of each root
const SWIM_Z = [3.1, -0.45, -4.05, -7.6, -10.95];
const SWIM_LEN = 3.8, SWIM_STALK = 1.3;

function buildLegs(b, Q, C) {
  const near = Q.rim, n = Q.leg, add = (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k], lerp3 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const row = (p, r, c) => [p[0], p[1], p[2], r, c];
  // ----- five pairs of walking legs: three clear lengths, banded, knuckles at the knees -----
  WALK.forEach(([z, kind, size], k) => {
    for (const s of [-1, 1]) {
      const sh = WALK_SHAPE[kind], m = (d) => [d[0] * s * size, d[1] * size, d[2] * size];
      const R = [s * 1.25, -3.2, z], K1 = add(R, m(sh.k1)), K2 = add(K1, m(sh.k2)), E = add(K2, m(sh.end)), h = lerp3(R, K1, 0.55);
      if (near) { b.set([0, 0, 0], null, [0, 0, 0, 0], [0, 0.35]); b.ball(R[0], R[1] - 0.05, R[2], 0.66, 7, 4, C.red); }   // the hip knob on the belly
      b.set(R, K1, [3, k, 0, s], [0, 0.35]);
      if (near) b.pipe([row(R, 0.4, C.red), row(h, 0.36, C.red), row(h, 0.36, C.white), row(lerp3(R, K1, 0.9), 0.32, C.white), row(K1, 0.39, C.white)], n, false, true);
      else b.pipe([row(R, 0.42, C.red), row(K1, 0.38, C.white)], n, false, false);
      b.set(R, K1, [3, k, 1, s], [0, 0.35]);
      if (!near) { b.pipe([row(K1, 0.36, C.red), row(K2, 0.32, C.red), row(E, kind ? 0.1 : 0.3, C.white)], n, false, false); continue; }
      b.ball(K1[0], K1[1], K1[2], 0.43, 6, 4, C.white); b.ball(K2[0], K2[1], K2[2], 0.39, 6, 4, C.red);
      const q = lerp3(K1, K2, 0.12), h2 = lerp3(K1, K2, 0.9);
      b.pipe([row(K1, 0.35, C.red), row(q, 0.3, C.red), row(h2, 0.28, C.red), row(K2, 0.35, C.red), row(K2, 0.35, C.white), row(lerp3(K2, E, 0.14), 0.26, C.white)].concat(
        kind === 1 ? [row(lerp3(K2, E, 0.66), 0.2, C.white), row(lerp3(K2, E, 0.66), 0.2, C.red), row(E, 0.05, C.red)] : [row(lerp3(K2, E, 0.55), 0.3, C.white), row(lerp3(K2, E, 0.55), 0.3, C.red), row(E, 0.29, C.red)]), n, true, true);
      if (kind === 0) {   // the small pincer: two fingers, a little open
        const d = m([-0.05, 0.1, 0.9]), up = m([0, 0.34, 0.05]);
        b.pipe([row(E, 0.23, C.red), row(add(add(E, d), up, -0.25), 0.04, C.white)], 5, false, false);
        b.pipe([row(add(E, up, 0.3), 0.18, C.red), row(add(add(E, d, 0.95), up, 1.0), 0.04, C.white)], 5, false, false);
      }
    }
  });
  // ----- five pairs of swimming legs: a stalk and two flat fringed paddles -----
  SWIM_Z.forEach((zs, k) => {
    const F = frameAt(zs), yb = TAILP.bot(zs), hw = TAILP.hw(zs);
    for (const s of [-1, 1]) {
      const px = s * 0.5 * hw, L = (x, l, z) => F(px + x * s, yb - l, zs + z), R = L(0, 0, 0), J = L(0, SWIM_STALK, 0);
      b.set(R, J, [2, k, 0, s], [0, 0.3]);
      if (near) b.pipe([row(L(0, -0.3, 0), 0.42, C.red), row(L(0, 0.55, 0), 0.4, C.red), row(L(0, 0.55, 0), 0.4, C.white), row(J, 0.34, C.white)], n, false, true);
      else b.pipe([row(L(0, -0.3, 0), 0.42, C.red), row(J, 0.36, C.white)], n, false, false);
      // the two paddles: outer and inner, a V seen from below, each a red blade with a pale toothed fringe on a rib
      for (const [dx, yaw] of [[0.85, 0.62], [-0.66, -0.62]]) {
        const len = SWIM_LEN - SWIM_STALK + 0.05, st = near ? 10 : 2, E = [[], [], [], [], []], MF = [], MB = [], cy = Math.cos(yaw), sy = Math.sin(yaw);
        for (let i = 0; i <= st; i++) {
          const t = i / st, l = SWIM_STALK - 0.05 + len * t, x = dx * Math.pow(t, 0.8), w0 = 0.74 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.55)), 0.7) + 0.03, w = w0 * (near && i % 2 ? 1.24 : 0.9), th = 0.13 * Math.sin(Math.PI * Math.pow(t, 0.5));
          [-w, -w0 * 0.6, 0, w0 * 0.6, w].forEach((o, j) => E[j].push(L(x + o * cy, l, o * sy)));
          MF.push(L(x - th * sy, l, th * cy)); MB.push(L(x + th * sy, l, -th * cy));
        }
        b.set(R, J, [2, k, 1, s], [1, 0.25]);
        if (!near) { b.leaf(E[0], E[4], C.red); continue; }
        const paint = (v0, v1, off) => { for (let i = v0 + off; i < v1; i += 2) { b.c[i * 3] = C.red.r; b.c[i * 3 + 1] = C.red.g; b.c[i * 3 + 2] = C.red.b; } };
        let v0 = b.count; b.leaf(E[0], E[1], C.white); paint(v0, b.count, 1);            // the fringe: pale teeth, red where they join the blade
        v0 = b.count; b.leaf(E[3], E[4], C.white); paint(v0, b.count, 0);
        b.leaf(E[1], E[3], C.red, MF); b.leaf(E[1], E[3], C.red, MB);                    // the blade: two skins over a rib, so it has thickness
        b.set(R, J, [2, k, 1, s], [0, 0.2]);
        b.pipe([row(MF[0], 0.2, C.red), row(E[2][st >> 1], 0.16, C.red), row(E[2][st], 0.06, C.red)], 4, false, false);
      }
    }
  });
}

function buildTail(b, Q, C) {
  const near = Q.rim, o = [0, 0, 0], B = (x, y, zs) => { bend(x, y, zs, o); return [o[0], o[1], o[2]]; };
  // ----- the tail fan: a narrow pointed middle plate with two blades each side, held narrow and straight behind -----
  b.set([0, 0, 0], null, [0, 0, 0, 0], [0, 0.6]);
  const v0 = b.count, i0 = b.idx.length, z0 = -16.7, z1 = ZS_TAIL + 0.55, st = near ? [0, 0.2, 0.45, 0.7, 0.78, 0.78, 0.92, 1] : [0, 0.45, 0.78, 0.78, 1]; let P = null, white = false;
  st.forEach((t, i) => {
    if (i && st[i - 1] === t) white = true;
    const z = z0 + (z1 - z0) * t, w = 0.66 * (1 - Math.pow(t, 1.6)) + 0.03, c = white ? C.white : C.red, y = 0.32 - 0.1 * t, th = 0.3 * (1 - 0.8 * t);
    const R = [b.v(...B(0, y + th, z), 0, 1, 0, c), b.v(...B(w, y, z), 1, 0, 0, c), b.v(...B(0, y - th * 0.6, z), 0, -1, 0, c), b.v(...B(-w, y, z), -1, 0, 0, c)];
    if (P) b.bridge(P, R); P = R;
  });
  b.smooth(v0, i0);
  b.set([0, 0, 0], null, [0, 0, 0, 0], [1, 0.6]);
  for (const s of [-1, 1]) for (const [x0, y0, ang, len, wmax, roll] of [[0.62, 0.2, 0.035, 6.75, 0.6, 0.1], [0.95, 0.06, 0.085, 7.25, 0.62, 0.22]]) {
    const n = near ? 10 : 4, ea = [], eb = [], mid = [], low = [], cols = [], ts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; ts.push([t, t > 0.76 ? C.white : C.red]); if (t < 0.76 && (i + 1) / n > 0.76) ts.push([0.76, C.red], [0.76, C.white]); }
    for (const [t, c] of ts) {
      const l = len * t, w = wmax * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + 0.92 * Math.pow(t, 0.62))), 0.55) + 0.02, x = x0 + Math.sin(ang) * l, z = -16.95 - Math.cos(ang) * l, cr = Math.cos(roll), sr = Math.sin(roll);
      ea.push(B(s * (x - w * cr), y0 + w * sr, z)); eb.push(B(s * (x + w * cr), y0 - w * sr, z)); mid.push(B(s * x, y0 + 0.13 * Math.sin(Math.PI * Math.pow(t, 0.5)), z)); low.push(B(s * x, y0 - 0.11 * Math.sin(Math.PI * Math.pow(t, 0.5)), z)); cols.push(c);
    }
    b.leaf(ea, eb, cols, mid); if (near) b.leaf(ea, eb, cols, low);
  }
}

// the whips: position.xy = a unit circle, position.z = the radius there, aAnim = (4, id, arc length, side); the shader lays them along their curve
function buildWhips(b, Q, C) {
  for (let id = 0; id < 3; id++) for (const s of [-1, 1]) {
    const W = WHIPS[id], rings = id === 0 ? Q.whip[0] : Q.whip[2], sides = id === 0 ? Q.whip[1] : Q.whip[3], rows = [];
    for (let i = 0; i <= rings; i++) {
      const u = i / rings, sl = W.len * Math.pow(u, 1.25), r = whipRadius(id, sl), row = [];
      b.set([W.root[0] * s, W.root[1], W.root[2]], null, [4, id, sl, s], [0, 0.1]);
      for (let j = 0; j < sides; j++) { const th = (j / sides) * Math.PI * 2; row.push(b.v(Math.cos(th), Math.sin(th), r, 0, 1, 0, C.feeler)); }
      rows.push(row);
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; b.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  }
}

// ---------- the whole animal ----------
function buildGeometry(detail) {
  const Q = DETAIL[skinOf(detail)], b = new Builder(), C = {}; for (const k in PAL) C[k] = new THREE.Color(PAL[k]);
  buildBody(b, Q, C);
  if (typeof buildHead === 'function') buildHead(b, Q, C);
  if (typeof buildLegs === 'function') buildLegs(b, Q, C);
  if (typeof buildTail === 'function') buildTail(b, Q, C);
  if (typeof buildWhips === 'function') buildWhips(b, Q, C);
  return b;
}

// ---------- shaders ----------
// The limbs' clocks (mirrored on the CPU by limbPose() for the bounds): 
//   swimming legs: 0.72 beats a second swimming, 0.34 hovering; each pair a fifth of a beat after the pair behind it
//   walking legs: a slow paddle; the two front pairs reach down and pick when hovering
//   the body (swimming only; a hoverer holds still to tend): a wave runs back along the tail part, `wave` metres at
//     the tail's end, at waveRate (each animal's own, a fifth either way), waveLen radians behind at the end; the fan beats
//     `fan` metres more at its tips, fanLag behind the wave; the tail part also hangs to each animal's own height (`set`
//     metres from the lowest to the highest) and side (`side`), and sways `sway` metres slowly
//   the walking legs paddle walkSwim times as wide when swimming; the feelers' waves run whipSwim times as fast
const BEAT = { swim: 0.72, hover: 0.34, power: 0.36, fwd: -0.50, back: 0.85, hoverAmp: 0.75, fold: 0.8, flex: 1.1, flexRate: 0.45,
  wave: 1.5, waveRate: 2.1, waveLen: 3.2, fan: 1.6, fanLag: 0.9, set: 2.4, side: 3.0, sway: 1.3, swayRate: 0.31, walkSwim: 2.2, whipSwim: 1.9 };
const FAN_Z = -16.95, FAN_LEN = 7.3;
// the lowest reach is given for the fore part (the legs) and for the part aft of AFT_Z (the tail part as it beats) apart
const AFT_Z = -8;
const f1 = (x) => x.toFixed(4);
// per-animal variety: the body's slide along its length is at most a1 + a2 metres either way
const VARY = { a1: 0.55, a2: 0.28 };
const VERT_HEAD = /* glsl */`
attribute vec3 aColor; attribute vec3 aPivot; attribute vec3 aPivot2; attribute vec4 aAnim; attribute vec2 aFx;
attribute vec3 iPos; attribute vec4 iQuat; attribute vec3 iMisc; attribute vec2 iDrape; attribute vec4 iVar;
uniform float uTime;
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
vec3 rotX(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z); }
float ease(float x) { x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }
${GLSL_WHIP}
// a swimming leg at beat fraction c: the quick spread stroke backward, then the slower folded return. x: angle, y: how far folded
vec2 stroke(float c) {
  float pw = ${f1(BEAT.power)};
  return c < pw ? vec2(mix(${f1(BEAT.fwd)}, ${f1(BEAT.back)}, ease(c / pw)), 0.0) : vec2(mix(${f1(BEAT.back)}, ${f1(BEAT.fwd)}, ease((c - pw) / (1.0 - pw))), sin(3.14159 * (c - pw) / (1.0 - pw)));
}
// walking leg k: angles about the root and about the first knee
vec2 walk(float k, float side, float hov, float t) {
  float w = 6.2832 * (t * 0.30 + k * 0.21) + side * 0.9, m = mix(${f1(BEAT.walkSwim)}, 1.0, hov);
  vec2 a = vec2(0.07 * m * sin(w), 0.11 * m * sin(w + 1.1));
  if (k < 1.5) { float pk = 6.2832 * (t * 0.55 + k * 0.5) + side * 1.3; a = mix(a, vec2(0.30 + 0.08 * sin(pk * 0.5), 0.12 + 0.24 * sin(pk)), hov); }
  return a;
}
void animate(out vec3 P, out vec3 Nn) {
  float kind = aAnim.x, side = aAnim.w, hov = iMisc.z, t = uTime + iMisc.y * 37.0;
  vec3 p = position, n = normal; float zref = p.z;
  if (kind > 3.5) {
    float id = aAnim.y, s = aAnim.z;
    vec3 c = whipPoint(aPivot, id, s, hov, t, side, iDrape), T = whipDir(id, s, hov, t, side, iDrape);
    vec3 ref = normalize(mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), smoothstep(0.5, 0.9, abs(T.x))));
    vec3 cr = cross(T, ref); float cl = dot(cr, cr);
    vec3 N1 = cl > 1e-8 ? cr * inversesqrt(cl) : vec3(0.0, 0.0, 1.0), B1 = cross(T, N1);
    n = N1 * position.x + B1 * position.y;
    // a feeler is never thinner than WHIP_FLOOR metres of the world (its radius, whatever the animal's size), near or far, in light and in shadow
    float rmin = ${WHIP_FLOOR.toFixed(3)} / max(iMisc.x, 0.0001);
    float tip = clamp((1.0 - s / (id < 0.5 ? ${WHIPS[0].len.toFixed(1)} : id < 1.5 ? ${WHIPS[1].len.toFixed(1)} : ${WHIPS[2].len.toFixed(1)})) * 10.0, 0.0, 1.0);   // and it ends in a point
    p = c + n * max(position.z, rmin * tip); zref = 20.0;
  } else if (kind > 2.5) {
    vec2 a = walk(aAnim.y, side, hov, t); float lower = aAnim.z;
    p = mix(p, aPivot2 + rotX(p - aPivot2, a.y), lower); n = mix(n, rotX(n, a.y), lower);
    p = aPivot + rotX(p - aPivot, a.x); n = rotX(n, a.x); zref = aPivot.z;
  } else if (kind > 1.5) {
    float k = aAnim.y, dist = aAnim.z, lag = (4.0 - k) * 0.2;
    vec2 sw = stroke(fract(t * ${f1(BEAT.swim)} - lag)), sh = stroke(fract(t * ${f1(BEAT.hover)} - lag)) * vec2(${f1(BEAT.hoverAmp)}, 1.0);
    vec2 st = mix(sw, sh, hov);
    p.x = mix(p.x, aPivot.x + (p.x - aPivot.x) * (1.0 - 0.62 * st.y), dist);
    float fold = ${f1(BEAT.fold)} * st.y;
    p = mix(p, aPivot2 + rotX(p - aPivot2, fold), dist); n = mix(n, rotX(n, fold), dist);
    p = aPivot + rotX(p - aPivot, st.x); n = rotX(n, st.x); zref = aPivot.z;
  }
  float q = clamp((4.6 - zref) / 27.6, 0.0, 1.0), sw = 1.0 - hov;
  // THE BODY SWIMS: the wave down the tail part, the fan's beat at its end, the tail part's own set and its slow sway
  float wph = t * ${f1(BEAT.waveRate)} * (0.8 + 0.4 * iVar.x) - ${f1(BEAT.waveLen)} * q + 6.2832 * iVar.y;
  p.y += q * q * (${f1(BEAT.flex)} * sin(t * ${f1(BEAT.flexRate)} + 0.6) + sw * (${f1(BEAT.wave)} * sin(wph) + ${f1(BEAT.set)} * (iVar.z - 0.5)));
  p.y += clamp((${f1(FAN_Z)} - zref) / ${f1(FAN_LEN)}, 0.0, 1.0) * sw * ${f1(BEAT.fan)} * sin(wph - ${f1(BEAT.fanLag)});
  p.x += q * q * sw * (${f1(BEAT.sway)} * sin(t * ${f1(BEAT.swayRate)} + 6.2832 * iVar.w) + ${f1(BEAT.side)} * (iVar.w - 0.5));
  // NO TWO ALIKE: each animal's body slides a little along its own length, its bands, plates and legs with it (so band widths and
  // spacing differ); nothing ahead of z = 15.5 moves (the feelers' roots), nor the tail's end
  float env = smoothstep(-22.5, -17.0, zref) * (1.0 - smoothstep(11.5, 15.5, zref));
  p.z += env * ((iVar.x - 0.5) * ${f1(2 * VARY.a1)} * sin(0.37 * zref + iVar.y * 6.2832) + (iVar.z - 0.5) * ${f1(2 * VARY.a2)} * sin(0.71 * zref + iVar.w * 6.2832));
  P = p; Nn = n;
}`;
const VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vN; varying vec3 vCol; varying vec3 vWorld; varying vec3 vRest; varying vec4 vFx; varying vec4 vVar; varying vec3 vAxis;
${VERT_HEAD}
void main() {
  vec3 p, n; animate(p, n);
  vec3 w = (modelMatrix * vec4(iPos + qrot(iQuat, p * iMisc.x), 1.0)).xyz;
  vN = normalize(mat3(modelMatrix) * qrot(iQuat, n)); vCol = aColor; vWorld = w; vRest = position; vVar = iVar; vAxis = mat3(modelMatrix) * qrot(iQuat, vec3(0.0, 0.0, 1.0));
  vFx = vec4(aFx, aAnim.x < 0.5 ? n.y : 0.0, aAnim.x > 3.5 ? 1.0 : 0.0);
  vec4 mvPosition = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSunColor, uSkyColor, uGroundColor, uAmber;
varying vec3 vN; varying vec3 vCol; varying vec3 vWorld; varying vec3 vRest; varying vec4 vFx; varying vec4 vVar; varying vec3 vAxis;
float hash1(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash1(i), hash1(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash1(i + vec3(0.0, 1.0, 0.0)), hash1(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(hash1(i + vec3(0.0, 0.0, 1.0)), hash1(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash1(i + vec3(0.0, 1.0, 1.0)), hash1(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
void main() {
  float nl = dot(vN, vN);
  vec3 n = nl > 1e-8 ? vN * inversesqrt(nl) : vec3(0.0, 1.0, 0.0), V = normalize(cameraPosition - vWorld);
  // vFx.x: 1 a single flat skin (fin, paddle, scale), 0.5 a plate's thin edge; vFx.y: 1 eye, 0.55 and over the shell, less the limbs
  float sheet = step(0.75, vFx.x), thin = clamp(vFx.x * 2.0, 0.0, 1.0) * (1.0 - sheet), shine = clamp(vFx.y, 0.0, 1.0), ny = vFx.z, whip = vFx.w;
  float eye = step(0.9, shine), skin = step(0.55, shine) * (1.0 - eye), limb = (1.0 - skin) * (1.0 - eye) * (1.0 - whip) * (1.0 - sheet);
  if (sheet > 0.5 && dot(n, V) < 0.0) n = -n;
  vec3 alb = vCol;
  // NO TWO ALIKE: this animal's own tone, hue of red, and spots (three numbers from its four)
  float tone = fract(vVar.x * 7.31 + vVar.z * 3.17) - 0.5, hue = fract(vVar.y * 5.71 + vVar.w * 9.13) - 0.5, spotty = fract(vVar.z * 11.3 + vVar.x * 5.9);
  // the shell's own paint inside the red bands: a soft marbling and fine pale spots (fixed to the skin; faded where too small to draw)
  float redAny = clamp((alb.r - alb.g) * 2.4 - 0.45, 0.0, 1.0), red = redAny * skin;
  vec3 q = vRest * (1.2 + 0.5 * spotty) + vVar.xyz * 31.0, ci = floor(q), cf = fract(q);
  float rad = 0.17 + 0.12 * hash1(ci), d = length(cf - (0.3 + 0.4 * vec3(hash1(ci + 7.3), hash1(ci + 13.7), hash1(ci + 21.1))));
  float fw = max(fwidth(q.x), max(fwidth(q.y), fwidth(q.z)));
  float many = 0.45 + 0.55 * fract(vVar.w * 13.7);                                             // how many of the cells hold a spot, on this animal
  float spot = mix((1.0 - smoothstep(rad * 0.7, rad, d)) * step(hash1(ci + 3.1), many), 0.06 * many, smoothstep(0.35, 1.3, fw / rad));
  float marb = vnoise(vRest * 0.55 + vVar.yzx * 23.0) * 0.6 + vnoise(vRest * 1.7 + vVar.zxy * 11.0) * 0.4;
  alb = mix(alb, alb * (0.76 + 0.48 * marb), red * 0.85);
  alb = mix(alb, alb * vec3(1.0, 1.0 + 0.9 * hue, 1.0 - 0.3 * hue), redAny) * (1.0 + 0.10 * tone);
  alb = mix(alb, vec3(0.98, 0.90, 0.80), spot * red * 0.9);
  // a paler, warmer underside; the thin amber glaze of the back
  float under = smoothstep(0.1, 0.8, -ny) * skin, back = clamp(ny, 0.0, 1.0);
  alb = mix(alb, alb * 1.18 + vec3(0.03, 0.006, 0.004), under * 0.7);
  alb = mix(alb, alb * vec3(1.0, 0.86, 0.60), 0.30 * back * back * skin);
  float ndl = dot(n, uSunDir), dif = max(ndl, 0.0), ndv = clamp(dot(n, V), 0.0, 1.0);
  dif = mix(dif, 0.55 + 0.45 * (ndl * 0.5 + 0.5), whip);                                     // a feeler stays white, with a faint grey shade side
  vec3 hemi = mix(uGroundColor, uSkyColor, n.y * 0.5 + 0.5);
  vec3 col = alb * (uSunColor * dif + hemi) * RECIPROCAL_PI;
  // HALF CLEAR: light passes through the fins and paddles, the legs, the plates' thin edges and the shell where it turns away:
  // what lies beyond the animal along the eye's line, and the sun when it stands behind, tinted by the shell (ivory through the clear
  // parts, a deep glowing orange red through the paint: never pink)
  float rim = pow(1.0 - ndv, 3.0);
  float clear = (sheet * 0.36 + thin * 0.5 + limb * (0.08 + 0.30 * rim) + skin * rim * 0.30) * (1.0 - eye) * mix(0.7, 1.0, redAny);
  vec3 beyond = mix(uGroundColor, uSkyColor, clamp(0.5 - 0.5 * V.y, 0.0, 1.0)) * RECIPROCAL_PI * 1.1;
  float toSun = pow(max(dot(V, -uSunDir), 0.0), 4.0);
  vec3 glass = mix(vec3(1.0, 0.94, 0.84), vec3(1.0, 0.15, 0.045), redAny);
  col = mix(col, (beyond + uSunColor * RECIPROCAL_PI * (0.6 * max(-ndl, 0.0) + 0.9 * toSun)) * glass, clear);
  // the sky's sheen on the wet shell where it turns away (a thin glassy line), and the warm amber edge light
  float wet = (skin + limb * 0.7 + sheet * 0.5) * (1.0 - eye), lit = smoothstep(-0.05, 0.15, ndl);
  col += uSkyColor * RECIPROCAL_PI * pow(1.0 - ndv, 5.0) * 0.45 * wet * mix(1.0, 0.35, redAny);
  col += uAmber * uSunColor * rim * (0.35 + 0.65 * lit) * 0.06 * (0.4 + 0.6 * skin) * (1.0 - whip) * (1.0 - eye);
  // a soft knee: sunlit white stays well under the glow of the post chain (its threshold is 0.9), so the wet highlights can sit over it
  float top = max(col.r, max(col.g, col.b)), k0 = mix(0.74, 0.60, redAny), knee = top > k0 ? (k0 + (top - k0) * 0.14) / top : 1.0;   // (the red paint is held deeper: never boiled)
  col *= mix(knee, min(1.0, 0.86 / max(top, 0.001)), whip);
  // WET: the sun's own highlight, a small hard glint inside a soft sheen, laid over (never above 0.88)
  // (taken round the body's own axis more than along it, so it runs as a streak down the wet shell, broken at each plate)
  vec3 hs = V + uSunDir; float hl = dot(hs, hs);
  vec3 H = hl > 1e-8 ? hs * inversesqrt(hl) : n, ax = normalize(vAxis);
  vec3 Hc = normalize(H - ax * dot(H, ax) * 0.8), nc = normalize(n - ax * dot(n, ax) * 0.8);
  float ndh = max(dot(nc, Hc), 0.0), hiK = lit * wet * (1.0 - 0.7 * abs(dot(H, ax)));
  // the glint is all there or not at all (a hard edge; it narrows where the light glances): a half-strength white over red would be pink
  float core = smoothstep(0.46, 0.54, pow(ndh, 60.0) * mix(0.55, 1.0, hiK) * (0.8 + 0.45 * marb)) * step(0.2, hiK), halo = pow(ndh, 22.0) * 0.30;
  vec3 sunTint = uSunColor / max(max(uSunColor.r, uSunColor.g), max(uSunColor.b, 0.001));
  col = mix(col, mix(vec3(0.88), vec3(0.88, 0.10, 0.035), redAny) * sunTint, halo * hiK);     // the sheen keeps the paint's own hue: red stays red
  col = mix(col, sunTint * 0.88, core * 0.95);
  float glint = pow(max(dot(n, normalize(V + vec3(0.0, 0.9, 0.0) + 0.4 * uSunDir)), 0.0), 150.0);
  col = mix(col, vec3(0.88), clamp(glint * 3.0, 0.0, 1.0) * eye);                              // the eye's small highlight
  gl_FragColor = vec4(min(col, vec3(0.89)), 1.0);
  #include <fog_fragment>
}`;
const DEPTH_VERT = /* glsl */`
${VERT_HEAD}
void main() { vec3 p, n; animate(p, n); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(iPos + qrot(iQuat, p * iMisc.x), 1.0); }`;
const DEPTH_FRAG = /* glsl */`
#include <packing>
void main() { gl_FragColor = packDepthToRGBA(gl_FragCoord.z); }`;

// ---------- bounds: one animal at scale 1 in its own frame, both poses, counted from the same sums the shader makes ----------
const TAU = Math.PI * 2, BELLY_LINE = -3.25;
function strokeJS(c) {
  const pw = BEAT.power, e = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  return c < pw ? [mix(BEAT.fwd, BEAT.back, e(c / pw)), 0] : [mix(BEAT.back, BEAT.fwd, e((c - pw) / (1 - pw))), Math.sin(Math.PI * (c - pw) / (1 - pw))];
}
function walkJS(k, side, hov, t) {
  const w = TAU * (t * 0.30 + k * 0.21) + side * 0.9, m = mix(BEAT.walkSwim, 1, hov); let a1 = 0.07 * m * Math.sin(w), a2 = 0.11 * m * Math.sin(w + 1.1);
  if (k < 1.5) { const pk = TAU * (t * 0.55 + k * 0.5) + side * 1.3; a1 = mix(a1, 0.30 + 0.08 * Math.sin(pk * 0.5), hov); a2 = mix(a2, 0.12 + 0.24 * Math.sin(pk), hov); }
  return [a1, a2];
}
const fract = (x) => x - Math.floor(x);
// the drawn skin of body and legs (no feelers) over the whole beat, for hover h: { up, down, halfWidth, front, back }
// (vertices [from, to) into the running measure o: prepareShrimps counts it in slices)
function measureSkin(b, h, from = 0, to = b.count, o = null) {
  o = o || { up: -1e9, down: -1e9, downFore: -1e9, downAft: -1e9, halfWidth: 0, front: -1e9, back: -1e9, downRest: -1e9, pick: { down: -1e9, front: -1e9, back: 1e9, halfWidth: 0 } };
  const P = b.p, A = b.a, PV = b.pv, PW = b.pv2, NT = 25;
  // the most the body's own motion lifts or drops a point at z (the slow flex; swimming, the wave, the tail part's set and the
  // fan's beat as well), and the most it carries it aside (swimming: the sway and the tail part's set to one side)
  const sw = 1 - h;
  const flexAmp = (z) => { const q = clamp01((4.6 - z) / 27.6); return q * q * (BEAT.flex + sw * (BEAT.wave + BEAT.set / 2)) + clamp01((FAN_Z - z) / FAN_LEN) * sw * BEAT.fan; };
  const sideAmp = (z) => { const q = clamp01((4.6 - z) / 27.6); return q * q * sw * (BEAT.sway + BEAT.side / 2); };
  const take = (x, y, z, amp, zr = z) => { if (y + amp > o.up) o.up = y + amp; if (amp - y > o.down) o.down = amp - y; if (zr > AFT_Z) { if (amp - y > o.downFore) o.downFore = amp - y; } else if (amp - y > o.downAft) o.downAft = amp - y; const ax = (x < 0 ? -x : x) + sideAmp(zr); if (ax > o.halfWidth) o.halfWidth = ax; if (z > o.front) o.front = z; if (-z > o.back) o.back = -z; };
  // each limb over one whole turn of ITS OWN clock, in NT even steps (so the stroke's two ends and the fold's top are steps):
  // row 0 a swimming leg, row 1 a walking leg, row 2 a picking leg; sines and cosines of the two hinge angles, and the paddles' spread
  const tab = new Float32Array(NT * 3 * 5);
  for (let i = 0; i < NT; i++) for (let row = 0; row < 3; row++) {
    const c = i / NT, q = (i * 3 + row) * 5; let a1, a2, sp = 1;
    if (row === 0) { const st = strokeJS(c); a1 = st[0] * mix(1, BEAT.hoverAmp, h); a2 = BEAT.fold * st[1]; sp = 1 - 0.62 * st[1]; }
    else { const a = row === 1 ? walkJS(2, 0, h, c / 0.30) : walkJS(0, 0, h, mix(1.3, 2, h) * c / mix(0.30, 0.55, h)); a1 = a[0]; a2 = a[1]; }
    tab[q] = Math.cos(a1); tab[q + 1] = Math.sin(a1); tab[q + 2] = Math.cos(a2); tab[q + 3] = Math.sin(a2); tab[q + 4] = sp;
  }
  for (let v = from; v < to; v++) {
    const kind = A[v * 4], x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    if (kind > 3.5) continue;
    if (kind < 1.5) { const amp = flexAmp(z); take(x, y, z, amp); if (amp - y > o.downRest) o.downRest = amp - y; continue; }
    const k = A[v * 4 + 1], far = A[v * 4 + 2], px = PV[v * 3], py = PV[v * 3 + 1], pz = PV[v * 3 + 2], qx = PW[v * 3], qy = PW[v * 3 + 1], qz = PW[v * 3 + 2], amp = flexAmp(pz);
    const base = (kind < 2.5 ? 0 : k < 1.5 ? 2 : 1) * 5;
    for (let i = 0; i < NT; i++) {
      const q = i * 15 + base, c1 = tab[q], s1 = tab[q + 1], c2 = tab[q + 2], s2 = tab[q + 3];
      let X = x, Y = y, Z = z;
      if (far > 0.5) { if (kind < 2.5) X = px + (x - px) * tab[q + 4]; const dy = Y - qy, dz = Z - qz; Y = qy + c2 * dy - s2 * dz; Z = qz + s2 * dy + c2 * dz; }
      const dy = Y - py, dz = Z - pz; Y = py + c1 * dy - s1 * dz; Z = pz + s1 * dy + c1 * dz;
      take(X, Y, Z, amp, pz);
      if (kind > 2.5 && k < 1.5) { const pk = o.pick; if (amp - Y > pk.down) pk.down = amp - Y; if (Z > pk.front) pk.front = Z; if (Z < pk.back) pk.back = Z; if (Math.abs(X) > pk.halfWidth) pk.halfWidth = Math.abs(X); }
      else if (amp - Y > o.downRest) o.downRest = amp - Y;
    }
  }
  return o;
}
// the long feeler of one side over the clock: its mean line with a clear radius at each point ([x, y, z, r]), and every sampled point
function longLine(h, D, A, side, grow) {
  const p = [0, 0, 0], NS = 22, NT = 48, W = WHIPS[0], line = [], all = [];
  for (let j = 0; j <= NS; j++) {
    const s = W.len * Math.pow(j / NS, 1.15), rad = whipRadius(0, s), pts = []; let mx = 0, my = 0, mz = 0;
    for (let i = 0; i < NT; i++) { whipPoint(0, s, h, i * 1.731, side, D, A, p); pts.push([p[0], p[1], p[2]]); mx += p[0]; my += p[1]; mz += p[2]; if (grow) grow(p, rad); }
    mx /= NT; my /= NT; mz /= NT; let r = 0; for (const q of pts) r = Math.max(r, Math.hypot(q[0] - mx, q[1] - my, q[2] - mz));
    line.push([mx, my, mz, r * 1.1 + rad + 0.15]); for (const q of pts) all.push([q[0], q[1], q[2], rad]);
  }
  return { line, all };
}
// one pose's feelers over the clock: the +X long feeler's line, and the drums that hold them
function measureFeelers(h, D = 1e3, A = 0) {
  const p = [0, 0, 0], NT = 48, W = WHIPS[0];
  const box = { xMax: 0, yMin: 1e9, yMax: -1e9, zMin: 1e9, zMax: -1e9, reach: 0 };
  const grow = (q, r) => { box.xMax = Math.max(box.xMax, Math.abs(q[0]) + r); box.yMin = Math.min(box.yMin, q[1] - r); box.yMax = Math.max(box.yMax, q[1] + r); box.zMin = Math.min(box.zMin, q[2] - r); box.zMax = Math.max(box.zMax, q[2] + r); box.reach = Math.max(box.reach, Math.hypot(q[0], q[1], q[2]) + r); };
  const { line, all } = longLine(h, D, A, 1, grow), NS = line.length - 1;
  // a drum: the axis from `root` along the unit `dir` for `length`, every point within `spread` of it
  const drum = (root, tip, pts) => {
    let dx = tip[0] - root[0], dy = tip[1] - root[1], dz = tip[2] - root[2]; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
    let length = 0, spread = 0;
    for (const q of pts) { const t = (q[0] - root[0]) * dx + (q[1] - root[1]) * dy + (q[2] - root[2]) * dz; if (t + q[3] > length) length = t + q[3]; }
    for (const q of pts) { const t = Math.min(length, Math.max(0, (q[0] - root[0]) * dx + (q[1] - root[1]) * dy + (q[2] - root[2]) * dz)); spread = Math.max(spread, Math.hypot(q[0] - root[0] - dx * t, q[1] - root[1] - dy * t, q[2] - root[2] - dz * t) + q[3]); }
    return { dir: [dx, dy, dz], length: length + 0.3, spread: spread * 1.05 + 0.3 };
  };
  const tip = line[NS], each = drum(W.root, tip, all), mid = drum([0, W.root[1], W.root[2]], [0, tip[1], tip[2]], all);
  each.line = line;
  const sh = []; let sx = 0, sy = 0, sz = 0, sn = 0;
  for (let id = 1; id <= 2; id++) for (let j = 1; j <= 6; j++) for (let i = 0; i < NT; i += 2) {
    const s = WHIPS[id].len * j / 6; whipPoint(id, s, h, i * 1.731, 1, D, A, p); sh.push([p[0], p[1], p[2], WHIPS[id].r0]); grow(p, WHIPS[id].r0);
    if (j === 6) { sy += p[1]; sz += p[2]; sn++; }
  }
  const sroot = [0, 0.8, 20.1], short = drum(sroot, [0, sy / sn, sz / sn], sh);
  return { box, each, mid, short, shortRoot: sroot };
}
const r2 = (x) => Math.round(x * 100) / 100, r4 = (x) => Math.round(x * 10000) / 10000;
// the bounds object from the four measures (skin and feelers, swimming and hovering)
function packBounds(s0, s1, f0, f1) {
  const pose = (s, f) => ({ downNoPick: r2(s.downRest + 0.1), pick: { down: r2(s.pick.down + 0.1), front: r2(s.pick.front + 0.1 + VARY.a1 + VARY.a2), back: r2(s.pick.back - 0.1 - VARY.a1 - VARY.a2), halfWidth: r2(s.pick.halfWidth + 0.1) }, halfLength: r2(Math.max(s.front, s.back) + 0.05), up: r2(s.up + 0.1), down: r2(s.down + 0.1), downFore: r2(s.downFore + 0.1), downAft: r2(s.downAft + 0.1), aftZ: AFT_Z, halfWidth: r2(s.halfWidth + 0.1), front: r2(s.front + 0.05), back: r2(s.back + 0.05),
    feelerUp: r2(f.box.yMax + 0.4), feelerDown: r2(-f.box.yMin + 0.4), feelerFront: r2(f.box.zMax + 0.4), feelerBack: r2(-f.box.zMin + 0.4), feelerHalfWidth: r2(f.box.xMax + 0.4), feelerReach: r2(f.box.reach + 0.4) });
  const S = pose(s0, f0), H = pose(s1, f1), drum = (d) => ({ dir: d.dir.map(r4), length: r2(d.length), spread: r2(d.spread) });
  const one = (f) => ({ ...drum(f.each), line: f.each.line.map((q) => q.map(r2)) }), W = WHIPS[0];
  return {
    // body and legs at the widest of their motion, NO feelers (the larger of the two poses; each pose apart below)
    halfLength: Math.max(S.halfLength, H.halfLength), up: Math.max(S.up, H.up), down: Math.max(S.down, H.down), halfWidth: Math.max(S.halfWidth, H.halfWidth),
    upSwim: S.up, upHover: H.up, downSwim: S.down, downHover: H.down, halfWidthSwim: S.halfWidth, halfWidthHover: H.halfWidth, bellyLine: BELLY_LINE,
    feelerReach: Math.max(S.feelerReach, H.feelerReach),   // the furthest any feeler gets from the origin
    swim: S, hover: H,
    feeler: {
      root: [0, W.root[1], W.root[2]], length: W.len, swim: drum(f0.mid), hover: drum(f1.mid),            // both long feelers in one drum about the middle line
      each: { root: W.root.slice(), swim: one(f0), hover: one(f1) },                                         // the +X one alone (negate x for the other)
      short: { root: f0.shortRoot.slice(), length: WHIPS[1].len, swim: drum(f0.short), hover: drum(f1.short) },   // the four short ones in one drum
    },
  };
}
// the same bounds for an animal of another length: every length times k, the unit directions left alone
function scaleBounds(o, k) {
  if (k === 1) return o;
  const walk = (v, key) => (typeof v === 'number' ? r2(v * k) : Array.isArray(v) ? (key === 'dir' ? v.slice() : v.map((x) => walk(x, ''))) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([q, x]) => [q, walk(x, q)])) : v);
  return walk(o, '');
}
function measureAll(b) { return packBounds(measureSkin(b, 0), measureSkin(b, 1), measureFeelers(0), measureFeelers(1)); }
const colours = () => { const C = {}; for (const k in PAL) C[k] = new THREE.Color(PAL[k]); return C; };

// Builds the skins and counts the bounds in slices, a hand-back between each: `const kit = await prepareShrimps(ctx)`, then
// makeShrimps(ctx, { ..., prepared: kit }). Without it makeShrimps does the same work in one step.
export async function prepareShrimps(ctx, details = ['near', 'far']) {
  const kit = {}, rest = async () => { if (ctx && ctx.yield) await ctx.yield(); }; let bounds = null;
  for (const d of details) {
    const Q = DETAIL[skinOf(d)], b = new Builder(), C = colours();
    const smooth = buildBody(b, Q, C, true); await rest(); smooth(); await rest(); buildHead(b, Q, C); await rest(); buildLegs(b, Q, C); await rest(); buildTail(b, Q, C); buildWhips(b, Q, C); await rest();
    if (!bounds) {
      // the limbs are the work: cut the vertex list so that each slice holds a fifth of the limb vertices
      const limb = (v) => b.a[v * 4] > 1.5 && b.a[v * 4] < 3.5, cuts = [0]; let nl = 0, m = 0, s0 = null, s1 = null;
      for (let v = 0; v < b.count; v++) if (limb(v)) nl++;
      const per = Math.max(1, Math.ceil(nl / 5));
      for (let v = 0; v < b.count; v++) if (limb(v) && ++m % per === 0) cuts.push(v + 1);
      if (cuts[cuts.length - 1] !== b.count) cuts.push(b.count);
      for (let j = 1; j < cuts.length; j++) { s0 = measureSkin(b, 0, cuts[j - 1], cuts[j], s0); await rest(); }
      for (let j = 1; j < cuts.length; j++) { s1 = measureSkin(b, 1, cuts[j - 1], cuts[j], s1); await rest(); }
      const f0 = measureFeelers(0); await rest(); const f1 = measureFeelers(1); await rest();
      bounds = packBounds(s0, s1, f0, f1);
    }
    kit[skinOf(d)] = { builder: b, bounds };
  }
  return kit;
}

// four numbers 0..1 for animal i of a shoal, from the world's seed and the shoal's seedKey (a hash: no draw from the world's stream)
function varietyOf(seed, key, i, out, o) {
  const s = seed + '|' + key + '|' + i; let h = 2166136261;
  for (let j = 0; j < s.length; j++) h = Math.imul(h ^ s.charCodeAt(j), 16777619);
  for (let j = 0; j < 4; j++) { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; out[o + j] = ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
}

// ---------- the instanced shoal ----------
export function makeShrimps(ctx, opts = {}) {
  const count = Math.max(1, opts.count | 0 || 1), length = opts.length ?? BODY_L, detail = skinOf(opts.detail), unit = length / BODY_L;
  const kit = opts.prepared && opts.prepared[detail], base = kit ? kit.builder : buildGeometry(detail), triangles = base.triangles, src = base.build();
  const bounds = scaleBounds(kit ? kit.bounds : measureAll(base), unit);   // metres at scale 1 for this `length`
  const geo = new THREE.InstancedBufferGeometry(); geo.index = src.index; for (const k in src.attributes) geo.setAttribute(k, src.attributes[k]);
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3), iQuat = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), iMisc = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3), iDrape = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2), iVar = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  // NO TWO ALIKE: each animal's own four numbers (proportions and so band widths, tone, hue, spots), from the seed, seedKey and its index
  const seed = String(ctx && ctx.seed != null ? ctx.seed : 0), key = String(opts.seedKey ?? detail);
  for (let i = 0; i < count; i++) { iQuat.array[i * 4 + 3] = 1; iDrape.array[i * 2] = 1e3; if (opts.variety !== false) varietyOf(seed, key, i, iVar.array, i * 4); else iVar.array.fill(0.5, i * 4, i * 4 + 4); }   // unposed animals have scale 0: nothing is drawn of them
  geo.setAttribute('iPos', iPos); geo.setAttribute('iQuat', iQuat); geo.setAttribute('iMisc', iMisc); geo.setAttribute('iDrape', iDrape); geo.setAttribute('iVar', iVar); geo.instanceCount = count;
  // LIGHT: the sun, the sky's fill, and the bounce of the sunlit town below, worked out from the sun and the sky (opts.bounce 0.8 scales it,
  // opts.townColor tints it); opts.groundColor can only brighten it: a hemisphere light's dim ground colour would leave the undersides,
  // which most views show, in the dark
  const sun = (opts.sun ? opts.sun.clone() : new THREE.Vector3(-0.5, 0.78, 0.38)).normalize(), bounce = opts.bounce ?? 0.8, town = new THREE.Color(opts.townColor ?? '#d8cfbf');
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uSunDir: { value: sun }, uAmber: { value: new THREE.Color(PAL.amber) },
    uSunColor: { value: opts.sunColor ? new THREE.Color(opts.sunColor) : new THREE.Color('#fff1dc').multiplyScalar(3.0) },
    uSkyColor: { value: opts.skyColor ? new THREE.Color(opts.skyColor) : new THREE.Color('#bcd6f5').multiplyScalar(1.4) },
    uGroundColor: { value: new THREE.Color() } }]);
  let groundGiven = opts.groundColor ? new THREE.Color(opts.groundColor) : null;
  const relight = () => {
    const g = uniforms.uGroundColor.value;
    g.copy(uniforms.uSunColor.value).multiplyScalar(Math.max(0.15, uniforms.uSunDir.value.y)).add(uniforms.uSkyColor.value).multiply(town).multiplyScalar(bounce);
    if (groundGiven) { g.r = Math.max(g.r, groundGiven.r); g.g = Math.max(g.g, groundGiven.g); g.b = Math.max(g.b, groundGiven.b); }   // never darker than the town's own bounce
  };
  relight();
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, fog: true, side: THREE.DoubleSide });
  const depthMaterial = new THREE.ShaderMaterial({ uniforms: { uTime: uniforms.uTime }, vertexShader: DEPTH_VERT, fragmentShader: DEPTH_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.customDepthMaterial = depthMaterial;
  mesh.castShadow = opts.castShadow !== false; mesh.receiveShadow = false; mesh.name = 'shrimps-' + detail;
  const object = new THREE.Group(); object.add(mesh);
  const api = {
    object, mesh, material, depthMaterial, count, length, triangles, drawCalls: 1, bounds, detail,
    // position: Vector3 (world, or the parent's frame), quaternion: Quaternion (nose +Z, back +Y), scale: times `length`, phase 0..1, hover 0..1
    setPose(i, position, quaternion, scale = 1, phase = 0, hover = 0) {
      if (i < 0 || i >= count) return;
      iPos.array[i * 3] = position.x; iPos.array[i * 3 + 1] = position.y; iPos.array[i * 3 + 2] = position.z;
      iQuat.array[i * 4] = quaternion.x; iQuat.array[i * 4 + 1] = quaternion.y; iQuat.array[i * 4 + 2] = quaternion.z; iQuat.array[i * 4 + 3] = quaternion.w;
      iMisc.array[i * 3] = scale * unit; iMisc.array[i * 3 + 1] = phase; iMisc.array[i * 3 + 2] = Math.min(1, Math.max(0, hover));
    },
    commit() { iPos.needsUpdate = true; iQuat.needsUpdate = true; iMisc.needsUpdate = true; iDrape.needsUpdate = true; },
    // An animal's own four numbers (its bands, its tone, and the set, rate and sway of its swimming body). A world that
    // shows one animal in two skins hands them across: fine.setVariety(slot, plain.variety(i)), so that it is the same animal.
    variety(i) { return iVar.array.subarray(i * 4, i * 4 + 4); },
    setVariety(i, v) { if (i < 0 || i >= count) return; const a = iVar.array, o = i * 4; if (a[o] === v[0] && a[o + 1] === v[1] && a[o + 2] === v[2] && a[o + 3] === v[3]) return; a[o] = v[0]; a[o + 1] = v[1]; a[o + 2] = v[2]; a[o + 3] = v[3]; iVar.needsUpdate = true; },
    // OPTIONAL, for a hovering animal over a street: its hanging long feelers turn level `depth` metres below its origin (its own frame,
    // metres at scale 1; the centre line is never lower) and trail along `azimuth` (radians in its own frame: 0 toward its nose, + toward
    // its +X side), both feelers parallel. depth null or 0 takes the floor away. Call commit() after.
    setDrape(i, depth, azimuth = 0) { if (i < 0 || i >= count) return; iDrape.array[i * 2] = depth > 0 ? Math.max(depth / unit, HANG.rho + HANG.rho2 + 0.5) : 1e3; iDrape.array[i * 2 + 1] = azimuth; },
    // The long feelers of animal i as posed (its hover, its drape), over the whole clock, in the frame of `object`: two lines (+X side,
    // -X side) of [x, y, z, r]: the feeler's mean line and the radius about each point that holds its sway and its thickness.
    feelerLines(i) {
      const s = iMisc.array[i * 3], h = iMisc.array[i * 3 + 2], D = iDrape.array[i * 2], A = iDrape.array[i * 2 + 1], out = [];
      const q = new THREE.Quaternion(iQuat.array[i * 4], iQuat.array[i * 4 + 1], iQuat.array[i * 4 + 2], iQuat.array[i * 4 + 3]), v = new THREE.Vector3();
      for (const side of [1, -1]) out.push(longLine(h, D, A, side).line.map((p) => { v.set(p[0], p[1], p[2]).multiplyScalar(s).applyQuaternion(q); return [v.x + iPos.array[i * 3], v.y + iPos.array[i * 3 + 1], v.z + iPos.array[i * 3 + 2], p[3] * s]; }));
      return out;
    },
    update(dt, time) { uniforms.uTime.value = time; },
    // relight live: { sun: Vector3 toward the sun, sunColor, skyColor, groundColor: Colors times their intensities }
    setLight(l = {}) {
      if (l.sun) uniforms.uSunDir.value.copy(l.sun).normalize();
      if (l.sunColor) uniforms.uSunColor.value.copy(l.sunColor); if (l.skyColor) uniforms.uSkyColor.value.copy(l.skyColor); if (l.groundColor) groundGiven = new THREE.Color(l.groundColor);
      relight();
    },
    // reads the scene's first DirectionalLight (the sun) and HemisphereLight (its sky colour; plus any AmbientLight)
    setLightFromScene(scene) {
      let gotSun = false, gotSky = false; const sky = new THREE.Color(0, 0, 0), amb = new THREE.Color(0, 0, 0);
      scene.traverse((o) => {
        if (o.isDirectionalLight && !gotSun) { gotSun = true; uniforms.uSunDir.value.copy(o.position).sub(o.target.position).normalize(); uniforms.uSunColor.value.copy(o.color).multiplyScalar(o.intensity); }
        else if (o.isHemisphereLight && !gotSky) { gotSky = true; sky.copy(o.color).multiplyScalar(o.intensity); }
        else if (o.isAmbientLight) amb.add(o.color.clone().multiplyScalar(o.intensity));
      });
      if (gotSky || amb.r + amb.g + amb.b > 0) uniforms.uSkyColor.value.copy(sky).add(amb);
      relight();
    },
    dispose() { geo.dispose(); src.dispose(); material.dispose(); depthMaterial.dispose(); object.remove(mesh); },
  };
  return api;
}

// ---------- one animal at the origin, for the part viewer ----------
export async function buildHero(ctx, opts = {}) {
  const detail = skinOf(opts.detail), prepared = await prepareShrimps(ctx, [detail]);
  const shoal = makeShrimps(ctx, { count: 1, length: opts.length ?? BODY_L, seedKey: 'hero', ...opts, detail, prepared });
  if (ctx && ctx.yield) await ctx.yield();
  const hover = opts.hover ?? 0, k = shoal.length / BODY_L;
  shoal.setPose(0, new THREE.Vector3(0, 0, 0), new THREE.Quaternion(), 1, opts.phase ?? 0, hover); shoal.commit();
  return {
    object: shoal.object, radius: 30 * k, height: 24 * k, center: new THREE.Vector3(0, 0, -6 * k), ground: false,
    anchors: { bounds: shoal.bounds, nose: new THREE.Vector3(0, 0.6 * k, 23 * k), tail: new THREE.Vector3(0, -4 * k, -23 * k), belly: new THREE.Vector3(0, -3 * k, 8 * k) },
    shoal, update(dt, time) { shoal.update(dt, time); }, dispose() { shoal.dispose(); },
  };
}

// =====================================================================================================================
// THE BEASTS OF THE MORNING OF CHAOS: the giraffe and the ladybird, the second builder's part moved into this file
// whole (the world's one part file). It keeps a scope of its own: nothing of it reads or writes a name of the
// shrimp's part above. The world takes prepareBeasts, makeGiraffes and makeLadybirds from the last line.
// =====================================================================================================================
const BEASTS = (() => {
// THE BEASTS of "The Shoal over the High Street": GIRAFFES that canter down the streets and great LADYBIRDS that walk on the
// walls and roofs. Each kind is one instanced mesh a skin; every motion is in the vertex shader; an animal's look is a pure
// function of its pose, its phase and the clock given. Nothing is made in update(): it sets one uniform.
//
// INTERFACE
//   prepareBeasts(ctx) async: builds the skins and counts the bounds in slices, a ctx.yield() between each (the makers do
//     the same work in one step if it was not called).
//   makeGiraffes(ctx, { count, seedKey, castShadow })  -> { object, count, bounds, setPose, commit(), update(dt, time), dispose() }
//     GIRAFFE  5 m to the horns at size 1 (standing; a little over at the top of the stride), origin on the ground under its
//     middle, facing its own -z.
//     setPose(i, x, y, z, yaw, phase, size): yaw turns about +y as Object3D.rotation.y does (the animal faces
//     (-sin yaw, 0, -cos yaw)); phase is the count of strides run: metres run over (bounds.stride * size). A foot on the
//     ground stays where it is put, whatever is added to the phase.
//     bounds { height, length, halfWidth, stride, headFront, tailBack, shoulder } in metres at size 1, over the whole stride.
//   makeLadybirds(ctx, { count, seedKey, castShadow }) -> the same shape
//     LADYBIRD  3.2 m long at size 1, origin on the surface under its middle, facing its own -z, its back along the normal.
//     setPose(i, point [x, y, z], normal [x, y, z], heading, phase, size): heading is the angle in the surface's plane,
//     measured from straight up the surface (on a level surface from -z, as a giraffe's yaw is) and turning anticlockwise as
//     seen from outside, looking at the surface; or the direction to face, as [x, y, z]. phase is the count of strides
//     walked: metres walked over (bounds.stride * size).
//     bounds { length, halfWidth, height, stride, bodyHalfWidth, front, back } in metres at size 1.
//   Both take, besides, the light the world's own animals take: { sun, sunColor, skyColor, groundColor } (all optional), and
//   give setLight(), setLightFromScene(scene), variety(i), mesh, material, triangles, shadowTriangles.
//   castShadow (default true): the animals' shadows are thrown by a second, far lighter skin inside `object`, in the same
//   pose (the same instance arrays), drawn only into the shadow light's own pass.
//   receiveShadow (default true): the animals take the shadows of the houses, of each other and of themselves from the
//   engine's own shadow light.
//   An animal never posed is drawn at no size.

const TAU = Math.PI * 2;
const f = (x) => x.toFixed(5);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// four numbers 0..1 for animal i of a herd, from the world's seed and the herd's seedKey (a hash: no draw from the world's streams)
function varietyOf(seed, key, i, out, o) {
  const s = seed + '|' + key + '|' + i; let h = 2166136261;
  for (let j = 0; j < s.length; j++) h = Math.imul(h ^ s.charCodeAt(j), 16777619);
  for (let j = 0; j < 4; j++) { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; out[o + j] = ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
}

// ---------- geometry builder ----------
// attributes: position, normal, aColor (linear ground colour), aCoat (xyz: where in the coat's pattern, w: how much of it),
// aAnim (kind, index, weight, side), aFx (shine, spare)
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.ct = []; this.a = []; this.fx = []; this.idx = []; this.sg = []; this.cur = { col: [1, 1, 1], coat: null, amount: 0, a: [0, 0, 0, 0], fx: [0, 0], sg: 0 }; }
  get count() { return this.p.length / 3; }
  get triangles() { return this.idx.length / 3; }
  // col: ground colour; coat: [scale, ox, oy, oz] (pattern place = position * scale + offset) or null; amount: how much pattern
  set(o) { Object.assign(this.cur, o); return this; }
  v(x, y, z, o) {
    const k = this.cur, col = (o && o.col) || k.col, am = o && o.amount != null ? o.amount : k.amount, a = (o && o.a) || k.a, fx = (o && o.fx) || k.fx, coat = k.coat;
    this.p.push(x, y, z); this.n.push(0, 1, 0); this.c.push(col[0], col[1], col[2]);
    if (coat) this.ct.push(x * coat[0] + coat[1], y * coat[0] + coat[2], z * coat[0] + coat[3], am); else this.ct.push(0, 0, 0, 0);
    this.a.push(a[0], a[1], a[2], a[3]); this.fx.push(fx[0], fx[1]); this.sg.push(k.sg);
    return this.p.length / 3 - 1;
  }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  bridge(A, B) { const n = A.length; for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; this.quad(A[j], A[j1], B[j1], B[j]); } }
  fan(R, c, flip) { const n = R.length; for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; if (flip) this.tri(c, R[j1], R[j]); else this.tri(c, R[j], R[j1]); } }
  // normals of the vertices [v0, count) from the triangles [i0, end), welded across vertices that share a place and a smoothing group
  smooth(v0, i0) {
    const p = this.p, n = this.n, idx = this.idx, v1 = this.count;
    for (let i = v0 * 3; i < v1 * 3; i++) n[i] = 0;
    for (let i = i0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { n[q] += nx; n[q + 1] += ny; n[q + 2] += nz; }
    }
    const map = new Map();
    for (let i = v0; i < v1; i++) {
      const key = Math.round(p[i * 3] * 2000) + ',' + Math.round(p[i * 3 + 1] * 2000) + ',' + Math.round(p[i * 3 + 2] * 2000) + ',' + this.sg[i];
      let e = map.get(key); if (!e) { e = [0, 0, 0, []]; map.set(key, e); }
      e[0] += n[i * 3]; e[1] += n[i * 3 + 1]; e[2] += n[i * 3 + 2]; e[3].push(i);
    }
    for (const e of map.values()) { const l = Math.hypot(e[0], e[1], e[2]) || 1; for (const i of e[3]) { n[i * 3] = e[0] / l; n[i * 3 + 1] = e[1] / l; n[i * 3 + 2] = e[2] / l; } }
  }
  // a ball with true normals (set after: call smooth over it)
  ball(cx, cy, cz, rx, ry, rz, seg, rings, o) {
    const rows = [];
    for (let i = 0; i <= rings; i++) {
      const a = (i / rings) * Math.PI, sy = Math.cos(a), sr = Math.sin(a), row = [];
      if (i === 0 || i === rings) { rows.push([this.v(cx, cy + sy * ry, cz, o)]); continue; }
      for (let j = 0; j < seg; j++) { const t = (j / seg) * TAU; row.push(this.v(cx + Math.cos(t) * sr * rx, cy + sy * ry, cz + Math.sin(t) * sr * rz, o)); }
      rows.push(row);
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
      const j1 = (j + 1) % seg, A = rows[i], B = rows[i + 1];
      if (A.length === 1) this.tri(A[0], B[j1], B[j]); else if (B.length === 1) this.tri(A[j], A[j1], B[0]); else this.quad(A[j], A[j1], B[j1], B[j]);
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aCoat', new THREE.Float32BufferAttribute(this.ct, 4));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.fx, 2));
    g.setIndex(this.idx);
    return g;
  }
}
// one ring of a lofted skin, in the animal's middle plane: centre (cy, cz), the ring's own up axis leaning phi (radians: 0 = a
// ring standing square across a body that lies level; + leans the top back as the body climbs toward -z), half width hw, reach
// above (hu) and below (hd) the centre, n vertices from the top round by +x. each(j, sin, cos) -> overrides for that vertex.
function ring(b, cy, cz, phi, hw, hu, hd, n, e, each) {
  const ids = [], cp = Math.cos(phi), sp = Math.sin(phi), pw = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let j = 0; j < n; j++) {
    const th = (j / n) * TAU, s = Math.cos(th), c = Math.sin(th), lx = hw * pw(c), lb = (s >= 0 ? hu : hd) * pw(s);
    ids.push(b.v(lx, cy + lb * cp, cz + lb * sp, each ? each(j, s, c) : null));
  }
  return ids;
}

// =====================================================================================================================
// THE GIRAFFE
// OWN FRAME  facing -z, back toward +y, origin on the ground under its middle; metres at size 1; 5 m to the horn tips.
// Every place below is given in the middle plane as [y, z] unless it says otherwise.
// =====================================================================================================================
const GP = { cream: lin('#ead6a6'), pale: lin('#f1e4c4'), mane: lin('#70401f'), hoof: lin('#2b2521'), tuft: lin('#1f1915'), horn: lin('#33271f'), muzzle: lin('#5f4b3c'), eye: lin('#0b0908'), ear: lin('#e3c79f') };
// THE CANTER. One stride is G.stride metres; `phase` counts strides. Each foot is on the ground for `duty` of the stride and
// goes back under the body at the ground's own speed while it is; the hind pair come down a little apart, then the fore pair.
// The body rocks (nose up as the hind feet push, down as the fore feet take the weight) and rises and falls; the neck swings
// back as the forehand rises and forward as it comes down; the tail streams.
const G = {
  stride: 5.2, hf: 0.20, girth: 0.14,                                 // hf: the fetlock's height over the ground when the hoof stands
  C0: [2.35, 0.05], pitch: 0.075, phPitch: 0.02, bob: 0.06, phBob: 0.93,
  Nb: [2.55, -0.85], neck: 0.15, phNeck: 0.06, headK: 0.62, Pp: [4.60, -2.15], carry: 0.16, reach: 0.10,
  Tr: [2.52, 1.09], tail0: 0.38, tail1: 1.30, tailW: 0.32, phTail: 0.15, flick: 0.75,
  // H: where the leg hangs from, J: its middle joint (the knee of a fore leg, the hock of a hind), K: the fetlock; x: how far
  // from the middle plane; bend: +1 the joint goes forward of the leg's line (knee), -1 back (hock); give: the root slides
  // this far along the leg's line, away from the foot [0] or toward it [1], before the joint bends or the leg falls short
  fore: { H: [2.42, -0.62], J: [1.06, -0.62], K: [0.20, -0.62], x: 0.21, bend: 1, give: [0.17, 0.12], zc: -0.60, duty: 0.30, lift: 0.72, off: [0.46, 0.55] },
  hind: { H: [2.30, 0.74], J: [1.13, 1.12], K: [0.20, 0.95], x: 0.30, bend: -1, give: [0.0, 0.13], zc: 0.77, duty: 0.30, lift: 0.46, off: [0.0, 0.09] },
};
for (const L of [G.fore, G.hind]) {
  L.L1 = Math.hypot(L.J[0] - L.H[0], L.J[1] - L.H[1]); L.L2 = Math.hypot(L.K[0] - L.J[0], L.K[1] - L.J[1]);
  L.a1 = Math.atan2(-(L.J[1] - L.H[1]), -(L.J[0] - L.H[0])); L.a2 = Math.atan2(-(L.K[1] - L.J[1]), -(L.K[0] - L.J[0]));   // angles from straight down, + forward
}
// --- the same sums the shader makes, for the bounds and for the checks ---
const rot2 = (y, z, a, o) => { const c = Math.cos(a), s = Math.sin(a); o[0] = c * y - s * z; o[1] = s * y + c * z; return o; };
const gPitch = (ph) => G.pitch * Math.sin(TAU * (ph - G.phPitch));
function gTrunk(y, z, ph, o) { rot2(y - G.C0[0], z - G.C0[1], gPitch(ph), o); o[0] += G.C0[0] + G.bob * Math.cos(TAU * (ph - G.phBob)); o[1] += G.C0[1]; return o; }
// the fetlock of a leg at its own beat q: [y, z, swing]
function gFoot(L, q, o) {
  const half = 0.5 * G.stride * L.duty;
  if (q < L.duty) { o[0] = G.hf; o[1] = L.zc - half + G.stride * q; o[2] = 0; return o; }
  const u = (q - L.duty) / (1 - L.duty), m = G.stride * (1 - L.duty), u2 = u * u, u3 = u2 * u, sb = Math.sin(Math.PI * u);
  o[0] = G.hf + L.lift * sb * (0.55 + 0.45 * sb); o[1] = (L.zc + half) * (2 * u3 - 3 * u2 + 1) + (L.zc - half) * (3 * u2 - 2 * u3) + m * (2 * u3 - 3 * u2 + u);
  o[2] = sstep(0, 0.22, u) * (1 - sstep(0.78, 1, u)); return o;
}
const _t = [0, 0], _f = [0, 0, 0], _j = [0, 0];
// a leg's angles at phase ph: out { Jy, Jz: the joint, Fy, Fz: the fetlock, th1, th2, th3: the turns of the upper bone, the lower and the hoof, miss }
function gLeg(L, side, ph, out) {
  const q = ph - L.off[side > 0 ? 1 : 0], F = gFoot(L, q - Math.floor(q), _f), H = gTrunk(L.H[0], L.H[1], ph, _t);
  let ty = F[0] - H[0], tz = F[1] - H[1], d = Math.max(Math.hypot(ty, tz), 1e-4); ty /= d; tz /= d;
  const full = (L.L1 + L.L2) * 0.9996, sl = clamp(full - d, -L.give[1], L.give[0]);
  H[0] -= ty * sl; H[1] -= tz * sl; d += sl;
  const dc = clamp(d, Math.abs(L.L1 - L.L2) + 1e-3, L.L1 + L.L2 - 1e-4), ca = clamp((L.L1 * L.L1 + dc * dc - L.L2 * L.L2) / (2 * L.L1 * dc), -1, 1);
  const a1 = Math.atan2(-tz, -ty) + L.bend * Math.acos(ca);
  out.Jy = H[0] - L.L1 * Math.cos(a1); out.Jz = H[1] - L.L1 * Math.sin(a1);
  const a2 = Math.atan2(-(F[1] - out.Jz), -(F[0] - out.Jy));
  out.Fy = F[0]; out.Fz = F[1]; out.th1 = a1 - L.a1; out.th2 = a2 - L.a2; out.th3 = F[2] * (out.th2 - G.flick * F[2]);
  out.miss = Math.abs(Math.hypot(F[0] - out.Jy, F[1] - out.Jz) - L.L2); out.Hy = H[0]; out.Hz = H[1]; out.knee = a1 - a2;
  return out;
}
const _leg = {};
// one vertex of the skin at phase ph (carry: the animal's own carriage of the neck, 0..1): out [x, y, z]
function gAnimate(kind, k1, k2, side, x, y, z, ph, carry, o) {
  const r = _j; let Y = y, Z = z;
  if (kind > 2.5) {
    const s = k1, a = -(G.tail0 + G.tail1 * s + G.tailW * s * Math.sin(TAU * (ph - G.phTail) - 2.4 * s));
    rot2(Y - G.Tr[0], Z - G.Tr[1], a, r); Y = G.Tr[0] + r[0]; Z = G.Tr[1] + r[1];
  } else if (kind > 1.5) {
    const nk = G.neck * Math.sin(TAU * (ph - G.phNeck)) + (carry - 0.5) * G.carry, a = nk * sstep(0, 0.5, k1);
    if (k2 > 0.5) { rot2(Y - G.Pp[0], Z - G.Pp[1], -G.headK * nk, r); Y = G.Pp[0] + r[0]; Z = G.Pp[1] + r[1]; }
    const grow = 1 + G.reach * 0.5 * sstep(0, 0.5, k1);   // (the longest neck)
    rot2(Y - G.Nb[0], Z - G.Nb[1], a, r); Y = G.Nb[0] + r[0] * grow; Z = G.Nb[1] + r[1] * grow;
  } else if (kind > 0.5) {
    const L = k1 > 1.5 ? G.hind : G.fore, P = gLeg(L, side, ph, _leg);
    if (k2 > 1.5) { rot2(Y - L.K[0], Z - L.K[1], P.th3, r); o[0] = x; o[1] = P.Fy + r[0]; o[2] = P.Fz + r[1]; return o; }
    rot2(Y - L.J[0], Z - L.J[1], mix(P.th1, P.th2, k2), r); o[0] = x; o[1] = P.Jy + r[0]; o[2] = P.Jz + r[1]; return o;
  }
  gTrunk(Y, Z, ph, r); o[0] = x * (1 + G.girth * 0.5); o[1] = r[0]; o[2] = r[1]; return o;   // (the broadest build)
}

// the skin from the rump to the top of the neck: [z, y of the centre, lean in degrees, half width, reach above, reach below]
const G_BODY = [
  [1.16, 2.28, 0, 0.06, 0.08, 0.10], [1.10, 2.26, 0, 0.20, 0.24, 0.26], [0.98, 2.25, 0, 0.31, 0.33, 0.36], [0.80, 2.25, 0, 0.375, 0.37, 0.40],
  [0.50, 2.30, 0, 0.40, 0.385, 0.36], [0.20, 2.34, 0, 0.42, 0.43, 0.41], [-0.10, 2.37, 0, 0.43, 0.51, 0.47], [-0.38, 2.40, 0, 0.43, 0.60, 0.54],
  [-0.62, 2.44, 8, 0.41, 0.64, 0.58], [-0.84, 2.52, 24, 0.38, 0.60, 0.60], [-1.02, 2.66, 40, 0.34, 0.52, 0.56], [-1.19, 2.86, 51, 0.295, 0.42, 0.47],
  [-1.36, 3.10, 56, 0.25, 0.335, 0.375], [-1.56, 3.42, 58, 0.205, 0.265, 0.29], [-1.76, 3.75, 59, 0.17, 0.215, 0.228], [-1.94, 4.06, 60, 0.14, 0.18, 0.17],
  [-2.08, 4.32, 62, 0.12, 0.155, 0.145], [-2.17, 4.50, 64, 0.105, 0.135, 0.125], [-2.22, 4.60, 64, 0.07, 0.09, 0.085],
];
const G_NECK0 = 8;   // the ring where the neck's own swing begins (the withers)
// the head: along its own line from the back of the skull HA to the nose HB: [t, half width, reach above, reach below]
const G_HA = [4.69, -2.08], G_HB = [4.40, -2.76];
const G_HEAD = [[0.0, 0.06, 0.075, 0.075], [0.07, 0.11, 0.13, 0.135], [0.20, 0.13, 0.168, 0.17], [0.36, 0.128, 0.142, 0.175], [0.52, 0.104, 0.102, 0.15], [0.68, 0.086, 0.084, 0.115], [0.82, 0.08, 0.082, 0.096], [0.93, 0.075, 0.074, 0.082], [1.0, 0.05, 0.045, 0.056]];
// a leg's rings down its bones: [bone (0 upper, 1 lower, 2 the foot), how far down it, half width across, half width fore and aft, weight, how much coat, colour]
const G_FORE = [[0, -0.08, 0.085, 0.13, 0, 1], [0, 0.02, 0.125, 0.20, 0, 1], [0, 0.20, 0.13, 0.20, 0, 1], [0, 0.37, 0.115, 0.165, 0, 1], [0, 0.56, 0.095, 0.125, 0, 1], [0, 0.76, 0.076, 0.092, 0, 0.92], [0, 0.92, 0.066, 0.074, 0, 0.82],
  [0, 0.965, 0.082, 0.097, 0.25, 0.76, 0, -0.012], [1, 0.0, 0.09, 0.108, 0.5, 0.7, 0, -0.016], [1, 0.055, 0.08, 0.092, 0.75, 0.64, 0, -0.01], [1, 0.14, 0.058, 0.063, 1, 0.55], [1, 0.50, 0.05, 0.054, 1, 0.3], [1, 0.86, 0.05, 0.055, 1, 0.06], [1, 1.0, 0.066, 0.072, 1, 0],
  [2, 0.40, 0.055, 0.06, 2, 0], [2, 0.56, 0.072, 0.088, 2, 0], [2, 0.56, 0.072, 0.088, 2, 0, 'hoof'], [2, 1.0, 0.086, 0.108, 2, 0, 'hoof']];
const G_HIND = [[0, -0.12, 0.09, 0.17, 0, 1, 0, -0.02], [0, 0.0, 0.15, 0.33, 0, 1, 0, -0.05], [0, 0.22, 0.15, 0.30, 0, 1, 0, -0.10], [0, 0.45, 0.125, 0.215, 0, 1, 0, -0.085], [0, 0.66, 0.095, 0.14, 0, 0.95, 0, -0.035], [0, 0.82, 0.075, 0.10, 0, 0.88], [0, 0.93, 0.064, 0.08, 0, 0.8],
  [0, 0.965, 0.074, 0.096, 0.25, 0.76, 0, 0.012], [1, 0.0, 0.08, 0.108, 0.5, 0.7, 0, 0.022], [1, 0.055, 0.072, 0.092, 0.75, 0.64, 0, 0.012], [1, 0.14, 0.056, 0.065, 1, 0.55], [1, 0.50, 0.05, 0.056, 1, 0.3], [1, 0.86, 0.05, 0.056, 1, 0.06], [1, 1.0, 0.066, 0.072, 1, 0],
  [2, 0.40, 0.055, 0.06, 2, 0], [2, 0.56, 0.07, 0.084, 2, 0], [2, 0.56, 0.07, 0.084, 2, 0, 'hoof'], [2, 1.0, 0.082, 0.102, 2, 0, 'hoof']];
const G_SKIN = {
  near: { body: 16, bodyRings: null, head: 12, headRings: null, leg: 10, legRings: null, horn: 5, ear: true, eye: [6, 4], mane: true, tail: [5, 6] },
  shadow: { body: 6, bodyRings: [0, 2, 4, 6, 8, 10, 12, 15, 18], head: 4, headRings: [0, 2, 5, 8], leg: 4, legRings: [0, 3, 8, 13, 17], horn: 0, ear: false, eye: null, mane: false, tail: [3, 3] },
};
const COAT_BODY = 2.7, COAT_LEG = 5.2, COAT_HEAD = 8.0;

function buildGiraffe(detail) {
  const Q = G_SKIN[detail === 'shadow' ? 'shadow' : 'near'], b = new Builder(), rad = Math.PI / 180;
  // ----- rump, barrel, shoulders and neck: one skin -----
  let v0 = b.count, i0 = b.idx.length, P = null;
  b.set({ col: GP.cream, coat: [COAT_BODY, 0, 0, 0], amount: 1, fx: [0, 0], sg: 0 });
  const rows = Q.bodyRings || G_BODY.map((_, i) => i), last = G_BODY.length - 1;
  for (const i of rows) {
    const S = G_BODY[i], u = i <= G_NECK0 ? 0 : (i - G_NECK0) / (last - G_NECK0), anim = i <= G_NECK0 ? [0, 0, 0, 0] : [2, u, 0, 0], belly = i <= G_NECK0 ? 0.85 : mix(0.5, 0.12, sstep(0, 0.4, u));   // the belly is pale and nearly plain; the breast and throat keep their patches
    const R = ring(b, S[1], S[0], S[2] * rad, S[3], S[4], S[5], Q.body, 0.9, (j, s) => { const k = sstep(0.35, 0.95, -s); return { a: anim, amount: 1 - belly * k, col: GP.cream.map((c, q) => mix(c, GP.pale[q], k)) }; });
    if (!P) b.fan(R, b.v(0, S[1], S[0] + 0.03, { a: anim, amount: 1 }), true); else b.bridge(P, R);
    P = R;
    if (i === last) b.fan(R, b.v(0, S[1] + 0.03, S[0] - 0.02, { a: anim, amount: 1 }), false);
  }
  b.smooth(v0, i0);
  // ----- the head: a long narrowing wedge, deeper at the jaw, the nose darker -----
  v0 = b.count; i0 = b.idx.length; P = null;
  const hphi = Math.atan2(G_HB[0] - G_HA[0], -(G_HB[1] - G_HA[1])), HEADA = [2, 1, 1, 0], hup = [Math.cos(hphi), Math.sin(hphi)];
  const hat = (t, up = 0) => [mix(G_HA[0], G_HB[0], t) + hup[0] * up, mix(G_HA[1], G_HB[1], t) + hup[1] * up];
  b.set({ col: GP.cream, coat: [COAT_HEAD, 0, 0, 0], amount: 1, a: HEADA, sg: 0 });
  const hrows = Q.headRings || G_HEAD.map((_, i) => i);
  for (const i of hrows) {
    const S = G_HEAD[i], c = hat(S[0]), nose = sstep(0.5, 0.82, S[0]);
    const R = ring(b, c[0], c[1], hphi, S[1], S[2], S[3], Q.head, 0.92, (j, s) => ({ amount: (1 - nose) * (0.85 - 0.5 * sstep(0.2, 0.9, -s)) * sstep(0.0, 0.1, S[0]), col: GP.cream.map((q, k) => mix(mix(q, GP.pale[k], sstep(0.2, 0.9, -s)), GP.muzzle[k], nose * 0.9)) }));
    if (!P) { const e = hat(S[0] - 0.035); b.fan(R, b.v(0, e[0], e[1], { amount: 0 }), true); } else b.bridge(P, R);
    P = R;
    if (i === G_HEAD.length - 1) { const e = hat(1.035, -0.005); b.fan(R, b.v(0, e[0], e[1], { amount: 0, col: GP.muzzle }), false); }
  }
  b.smooth(v0, i0);
  if (Q.horn) {
    // two short horns, knobbed and dark at the tip, leaning a little back and out
    for (const s of [-1, 1]) {
      v0 = b.count; i0 = b.idx.length; P = null;
      const base = hat(0.17, 0.10), dir = [s * 0.10, 0.965, 0.24], st = [[0, 0.04, GP.cream, 0.5], [0.15, 0.034, GP.cream, 0.4], [0.21, 0.035, GP.horn, 0], [0.255, 0.042, GP.horn, 0], [0.288, 0.028, GP.horn, 0]];
      b.set({ coat: [COAT_HEAD, 0, 0, 0], a: HEADA, sg: 0 });
      for (const [l, r, col, am] of st) {
        const R = [], cx = s * 0.062 + dir[0] * l, cy = base[0] + dir[1] * l, cz = base[1] + dir[2] * l;
        for (let j = 0; j < Q.horn; j++) { const th = (j / Q.horn) * TAU; R.push(b.v(cx + Math.sin(th) * r, cy - dir[2] * Math.cos(th) * r, cz + dir[1] * Math.cos(th) * r, { col, amount: am })); }
        if (P) b.bridge(R, P); P = R;
      }
      b.fan(P, b.v(s * 0.062 + dir[0] * 0.30, base[0] + dir[1] * 0.30, base[1] + dir[2] * 0.30, { col: GP.horn, amount: 0 }), true);
      b.smooth(v0, i0);
    }
  }
  if (Q.ear) {
    // ears: thin pointed leaves standing out to the side behind the horns
    for (const s of [-1, 1]) {
      v0 = b.count; i0 = b.idx.length; P = null;
      const base = hat(0.10, 0.045), dir = [s * 0.93, 0.26, 0.26];
      b.set({ col: GP.ear, coat: null, amount: 0, a: HEADA, sg: 0 });
      for (const [l, w] of [[0.0, 0.034], [0.08, 0.062], [0.17, 0.058], [0.245, 0.03]]) {
        const cx = s * 0.085 + dir[0] * l, cy = base[0] + dir[1] * l, cz = base[1] + dir[2] * l, t = 0.014;
        const R = [b.v(cx, cy + w, cz - 0.2 * w), b.v(cx, cy + 0.1 * w, cz - t - 0.5 * w, { col: GP.pale }), b.v(cx, cy - w, cz + 0.2 * w), b.v(cx, cy, cz + t + 0.25 * w)];
        if (P) { if (s > 0) b.bridge(R, P); else b.bridge(P, R); } P = R;
      }
      const tip = b.v(s * 0.085 + dir[0] * 0.29, base[0] + dir[1] * 0.29, base[1] + dir[2] * 0.29);
      b.fan(P, tip, s > 0);
      b.smooth(v0, i0);
    }
  }
  if (Q.eye) {
    for (const s of [-1, 1]) {
      v0 = b.count; i0 = b.idx.length;
      const c = hat(0.33, 0.035);
      b.set({ col: GP.eye, coat: null, amount: 0, a: HEADA, fx: [1, 0], sg: 0 });
      b.ball(s * 0.112, c[0], c[1], 0.026, 0.032, 0.038, Q.eye[0], Q.eye[1]);
      b.smooth(v0, i0);
    }
    b.set({ fx: [0, 0] });
  }
  if (Q.mane) {
    // the mane: a short dark crest down the back of the neck, from the poll to the withers
    v0 = b.count; i0 = b.idx.length; P = null;
    b.set({ col: GP.mane, coat: null, amount: 0, sg: 1 });
    for (let i = G_NECK0; i <= last - 1; i++) {
      const S = G_BODY[i], ph = S[2] * rad, cp = Math.cos(ph), sp = Math.sin(ph), u = i <= G_NECK0 ? 0 : (i - G_NECK0) / (last - G_NECK0), anim = i <= G_NECK0 ? [0, 0, 0, 0] : [2, u, 0, 0];
      const h = i === G_NECK0 ? 0.0 : i === last - 1 ? 0.035 : 0.075, lb = S[4] * 0.93, w = 0.045;
      const R = [b.v(-w, S[1] + lb * cp, S[0] + lb * sp, { a: anim }), b.v(0, S[1] + (S[4] + h) * cp, S[0] + (S[4] + h) * sp, { a: anim }), b.v(w, S[1] + lb * cp, S[0] + lb * sp, { a: anim })];
      if (P) { b.quad(P[0], P[1], R[1], R[0]); b.quad(P[1], P[2], R[2], R[1]); } P = R;
    }
    b.smooth(v0, i0);
  }
  // ----- the tail: thin, hanging from the top of the rump as built (the shader lifts it to stream), a dark tuft at its end -----
  v0 = b.count; i0 = b.idx.length; P = null;
  const TL = 1.02, tsides = Q.tail[0], trows = Q.tail[1] === 3 ? [[0, 0.04, 0], [0.62, 0.03, 0], [0.8, 0.07, 1], [1, 0.012, 1]] : [[0, 0.042, 0], [0.2, 0.032, 0], [0.42, 0.026, 0], [0.62, 0.024, 0], [0.64, 0.03, 1], [0.74, 0.062, 1], [0.88, 0.05, 1], [1, 0.012, 1]];
  b.set({ col: GP.cream, coat: [COAT_LEG, 3.3, 1.7, 0.9], amount: 0.6, sg: 0 });
  for (const [s, r, dark] of trows) {
    const R = [];
    for (let j = 0; j < tsides; j++) { const th = (j / tsides) * TAU; R.push(b.v(Math.sin(th) * r, G.Tr[0] - s * TL, G.Tr[1] - Math.cos(th) * r, { a: [3, s, 0, 0], col: dark ? GP.tuft : GP.cream, amount: dark ? 0 : 0.6 * (1 - s) })); }
    if (P) b.bridge(P, R); P = R;
  }
  b.fan(P, b.v(0, G.Tr[0] - TL - 0.02, G.Tr[1], { a: [3, 1, 0, 0], col: GP.tuft, amount: 0 }), false);
  b.smooth(v0, i0);
  // ----- four legs -----
  [G.fore, G.hind].forEach((L, kind) => {
    const T = kind ? G_HIND : G_FORE, pts = [L.H, L.J, L.K, [0, L.K[1]]], lrows = Q.legRings || T.map((_, i) => i);
    for (const s of [-1, 1]) {
      const leg = kind * 2 + (s > 0 ? 1 : 0), x = s * L.x;
      v0 = b.count; i0 = b.idx.length; P = null;
      b.set({ col: GP.cream, coat: [COAT_LEG, leg * 7.3 + 2.1, leg * 3.1, leg * 5.7], amount: 1, sg: 0 });
      const cen = (S) => { const A = pts[S[0]], B = pts[S[0] + 1]; return [mix(A[0], B[0], S[1]), mix(A[1], B[1], S[1])]; };
      lrows.forEach((i, n) => {
        const S = T[i], c = cen(S), c0 = cen(T[lrows[Math.max(0, n - 1)]]), c1 = cen(T[lrows[Math.min(lrows.length - 1, n + 1)]]);
        let ty = c1[0] - c0[0], tz = c1[1] - c0[1]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
        if (S[0] === 2) { ty = -1; tz = 0; }
        const hoof = S[6] === 'hoof', toe = S[0] === 2 ? -0.018 * S[1] : 0, pale = sstep(0.75, 0.3, S[5]), col = hoof ? GP.hoof : GP.cream.map((q, k) => mix(q, GP.pale[k], pale)), R = [];
        for (let j = 0; j < Q.leg; j++) {
          const th = (j / Q.leg) * TAU, cf = Math.cos(th), sx = Math.sin(th);
          // the ring's front is toward -z when the bone hangs straight down
          R.push(b.v(x + sx * S[2] * s, c[0] + cf * S[3] * (-tz), c[1] + toe + (S[7] || 0) + cf * S[3] * ty, { a: [1, kind * 2, S[4], s], amount: S[5], col, fx: hoof ? [0.35, 0] : [0, 0] }));
        }
        if (!P) { const top = cen([0, S[1] - 0.07]); b.fan(R, b.v(x, top[0], top[1], { a: [1, kind * 2, 0, s], amount: 1 }), s < 0); }
        else if (s > 0) b.bridge(P, R); else b.bridge(R, P);
        P = R;
        if (n === lrows.length - 1) b.fan(R, b.v(x, 0, c[1] + toe, { a: [1, kind * 2, 2, s], amount: 0, col: GP.hoof }), s > 0);
      });
      b.smooth(v0, i0);
    }
  });
  return b;
}

// ---------- shaders shared by both kinds ----------
const GLSL_COMMON = /* glsl */`
attribute vec3 aColor; attribute vec4 aCoat; attribute vec4 aAnim; attribute vec2 aFx;
attribute vec3 iPos; attribute vec4 iQuat; attribute vec4 iMisc; attribute vec4 iVar;
uniform float uTime;
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
// turns (y, z) about the animal's own x: a + angle carries what hangs down toward -z (forward)
vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
// the angle of a (y, z) direction from straight down, + toward -z
float ang(vec2 d) { return abs(d.x) + abs(d.y) > 1e-6 ? atan(-d.y, -d.x) : 0.0; }
`;
const gl2 = (v) => `vec2(${f(v[0])}, ${f(v[1])})`;
const GLSL_GIRAFFE = /* glsl */`
${GLSL_COMMON}
float gPitch(float ph) { return ${f(G.pitch)} * sin(6.2831853 * (ph - ${f(G.phPitch)})); }
vec2 gTrunk(vec2 v, float ph) { return ${gl2(G.C0)} + rot2(v - ${gl2(G.C0)}, gPitch(ph)) + vec2(${f(G.bob)} * cos(6.2831853 * (ph - ${f(G.phBob)})), 0.0); }
// the fetlock of a leg at its own beat q (0 the foot comes down, duty it leaves, 1 it comes down again): (y, z, swing)
vec3 gFoot(float q, float zc, float duty, float inv, float lift) {
  float hs = ${f(0.5 * G.stride)} * duty;
  if (q < duty) return vec3(${f(G.hf)}, zc - hs + ${f(G.stride)} * q, 0.0);
  float u = clamp((q - duty) * inv, 0.0, 1.0), m = ${f(G.stride)} * (1.0 - duty), u2 = u * u, u3 = u2 * u, sb = sin(3.14159265 * u);
  return vec3(${f(G.hf)} + lift * sb * (0.55 + 0.45 * sb), (zc + hs) * (2.0 * u3 - 3.0 * u2 + 1.0) + (zc - hs) * (3.0 * u2 - 2.0 * u3) + m * (2.0 * u3 - 3.0 * u2 + u),
    smoothstep(0.0, 0.22, u) * (1.0 - smoothstep(0.78, 1.0, u)));
}
void animate(out vec3 P, out vec3 Nn) {
  float kind = aAnim.x, ph = iMisc.y;
  vec3 p = position, n = normal;
  if (kind > 2.5) {
    // the tail streams: each ring turns about the root by its own angle, a wave running down it with the stride
    float s = aAnim.y, a = -(${f(G.tail0)} + ${f(G.tail1)} * s + ${f(G.tailW)} * s * sin(6.2831853 * (ph - ${f(G.phTail)}) - 2.4 * s));
    p.yz = ${gl2(G.Tr)} + rot2(p.yz - ${gl2(G.Tr)}, a); n.yz = rot2(n.yz, a);
  } else if (kind > 1.5) {
    // the neck pumps with the stride (and each animal carries it a little higher or lower); the head stays near level
    float nk = ${f(G.neck)} * sin(6.2831853 * (ph - ${f(G.phNeck)})) + (iVar.w - 0.5) * ${f(G.carry)}, a = nk * smoothstep(0.0, 0.5, aAnim.y);
    if (aAnim.z > 0.5) { p.yz = ${gl2(G.Pp)} + rot2(p.yz - ${gl2(G.Pp)}, -${f(G.headK)} * nk); n.yz = rot2(n.yz, -${f(G.headK)} * nk); }
    // (and each animal's neck is a little longer or shorter: it grows from the withers)
    p.yz = ${gl2(G.Nb)} + rot2(p.yz - ${gl2(G.Nb)}, a) * (1.0 + ${f(G.reach)} * (fract(iVar.x * 7.31 + iVar.w * 3.17) - 0.5) * smoothstep(0.0, 0.5, aAnim.y)); n.yz = rot2(n.yz, a);
  } else if (kind > 0.5) {
    // a leg: its fetlock is put where the stride has it, and the two bones are laid between the body and that place
    bool hind = aAnim.y > 1.5; float w = aAnim.z;
    vec2 H = hind ? ${gl2(G.hind.H)} : ${gl2(G.fore.H)}, J = hind ? ${gl2(G.hind.J)} : ${gl2(G.fore.J)}, K = hind ? ${gl2(G.hind.K)} : ${gl2(G.fore.K)};
    float L1 = hind ? ${f(G.hind.L1)} : ${f(G.fore.L1)}, L2 = hind ? ${f(G.hind.L2)} : ${f(G.fore.L2)}, A1 = hind ? ${f(G.hind.a1)} : ${f(G.fore.a1)}, A2 = hind ? ${f(G.hind.a2)} : ${f(G.fore.a2)};
    float bend = hind ? ${f(G.hind.bend)} : ${f(G.fore.bend)}, giveA = hind ? ${f(G.hind.give[0])} : ${f(G.fore.give[0])}, giveB = hind ? ${f(G.hind.give[1])} : ${f(G.fore.give[1])};
    float off = hind ? (aAnim.w > 0.0 ? ${f(G.hind.off[1])} : ${f(G.hind.off[0])}) : (aAnim.w > 0.0 ? ${f(G.fore.off[1])} : ${f(G.fore.off[0])});
    vec3 ft = gFoot(fract(ph - off), hind ? ${f(G.hind.zc)} : ${f(G.fore.zc)}, hind ? ${f(G.hind.duty)} : ${f(G.fore.duty)}, hind ? ${f(1 / (1 - G.hind.duty))} : ${f(1 / (1 - G.fore.duty))}, hind ? ${f(G.hind.lift)} : ${f(G.fore.lift)});
    vec2 Hp = gTrunk(H, ph), t = ft.xy - Hp; float d = max(length(t), 1e-4); t = t * (1.0 / d);
    float sl = clamp((L1 + L2) * 0.9996 - d, -giveB, giveA); Hp -= t * sl; d += sl;
    float dc = clamp(d, abs(L1 - L2) + 1e-3, L1 + L2 - 1e-4);
    float a1 = ang(t) + bend * acos(clamp((L1 * L1 + dc * dc - L2 * L2) / max(2.0 * L1 * dc, 1e-4), -1.0, 1.0));
    vec2 Jp = Hp - L1 * vec2(cos(a1), sin(a1));
    float th1 = a1 - A1, th2 = ang(ft.xy - Jp) - A2;
    if (w > 1.5) { float th3 = ft.z * (th2 - ${f(G.flick)} * ft.z); p.yz = ft.xy + rot2(p.yz - K, th3); n.yz = rot2(n.yz, th3); }
    else { float th = mix(th1, th2, w); p.yz = Jp + rot2(p.yz - J, th); n.yz = rot2(n.yz, th); }
    P = p; Nn = n; return;
  }
  p.x *= 1.0 + ${f(G.girth)} * (iVar.z - 0.5);   // each animal's own build: a little broader or narrower through barrel and neck
  p.yz = gTrunk(p.yz, ph); n.yz = rot2(n.yz, gPitch(ph));
  P = p; Nn = n;
}`;
const VERT_MAIN = (anim) => /* glsl */`
#include <common>
#include <fog_pars_vertex>
#ifdef BEAST_SHADOW
#include <shadowmap_pars_vertex>
#endif
varying vec3 vN; varying vec3 vCol; varying vec3 vWorld; varying vec4 vCoat; varying vec4 vVar; varying vec3 vFx; varying vec3 vRest; varying vec3 vRestN;
${anim}
void main() {
  vec3 p, n; animate(p, n);
  vec3 w = (modelMatrix * vec4(iPos + qrot(iQuat, p * iMisc.x), 1.0)).xyz;
  vN = mat3(modelMatrix) * qrot(iQuat, n); vCol = aColor;
  #ifdef BEAST_SHADOW
  // where this place of the skin lies in the sun's shadow picture (the engine's own lookup)
  vec4 worldPosition = vec4(w, 1.0);
  vec3 transformedNormal = mat3(viewMatrix) * (vN * inversesqrt(max(dot(vN, vN), 1e-12)));
  #include <shadowmap_vertex>
  #endif
  vWorld = w; vCoat = aCoat; vVar = iVar; vFx = vec3(aFx, aAnim.x); vRest = position; vRestN = normal;
  vec4 mvPosition = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VERT_DEPTH = (anim) => /* glsl */`
${anim}
void main() { vec3 p, n; animate(p, n); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(iPos + qrot(iQuat, p * iMisc.x), 1.0); }`;
const FRAG_DEPTH = /* glsl */`
#include <packing>
void main() { gl_FragColor = packDepthToRGBA(gl_FragCoord.z); }`;
const FRAG_HEAD = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSunColor, uSkyColor, uGroundColor;
#ifdef BEAST_SHADOW
uniform bool receiveShadow;
#include <packing>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#endif
varying vec3 vN; varying vec3 vCol; varying vec3 vWorld; varying vec4 vCoat; varying vec4 vVar; varying vec3 vFx; varying vec3 vRest; varying vec3 vRestN;
// how much of the sun reaches this place: 1 in the open, 0 in the shadow of a house, of another animal or of the animal itself
float sunReach() {
  #ifdef BEAST_SHADOW
  return getShadowMask();
  #else
  return 1.0;
  #endif
}
vec3 hash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
`;
// THE GIRAFFE'S COAT: dark patches parted by cream lines, by a pattern of cells in the skin's own space (so it rides the
// skin as the animal moves). Each animal cuts its own piece of the pattern, at its own size of patch, in its own tone.
const FRAG_GIRAFFE = /* glsl */`
${FRAG_HEAD}
void main() {
  float nl = dot(vN, vN);
  vec3 n = nl > 1e-8 ? vN * inversesqrt(nl) : vec3(0.0, 1.0, 0.0);
  if (!gl_FrontFacing) n = -n;
  vec3 vd = cameraPosition - vWorld; float vl = dot(vd, vd);
  vec3 V = vl > 1e-8 ? vd * inversesqrt(vl) : vec3(0.0, 0.0, 1.0);
  float amount = vCoat.w, tone = vVar.x;
  vec3 q = vCoat.xyz * (0.86 + 0.32 * vVar.y) + vVar.xyz * 61.0;
  vec3 ci = floor(q), cf = fract(q), p1 = vec3(0.0), p2 = vec3(0.0);
  float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k)), o = hash3(ci + g), r = g + 0.5 + 0.82 * (o - 0.5) - cf;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; p2 = p1; d1 = d; p1 = r; id = o.x + o.y; } else if (d < d2) { d2 = d; p2 = r; }
  }
  vec3 dv = p2 - p1; float dl = dot(dv, dv);
  // how far to the wall between this patch and its neighbour, measured along the skin (a wall that meets the skin aslant
  // would else draw a broad line): the skin's own normal as built is taken out of the wall's
  vec3 wn = dl > 1e-6 ? dv * inversesqrt(dl) : vec3(1.0, 0.0, 0.0);
  float rl = dot(vRestN, vRestN), across = rl > 1e-8 ? dot(vRestN, wn) * inversesqrt(rl) : 0.0;
  float edge = (d2 - d1) * 0.5 * inversesqrt(max(dl, 1e-6)) * inversesqrt(max(1.0 - across * across, 0.05));
  float fw = max(fwidth(q.x), max(fwidth(q.y), fwidth(q.z)));
  float wl = 0.045 + 0.03 * vVar.z + (1.0 - amount) * 0.42;                         // half the cream line; it widens where the coat thins (legs, belly)
  float spot = smoothstep(wl - 0.6 * fw, wl + 0.6 * fw + 0.03, edge);
  float cover = clamp(1.0 - wl * 2.1, 0.0, 1.0);
  spot = mix(spot, cover * cover, smoothstep(0.3, 0.9, fw)) * step(0.004, amount); // (where a patch is too small to draw, its share of the two colours)
  vec3 pc = mix(vec3(0.39, 0.155, 0.050), vec3(0.135, 0.046, 0.019), tone);
  pc *= (0.84 + 0.32 * fract(id * 7.31)) * (1.0 - 0.16 * smoothstep(0.02, 0.28, edge - wl));
  pc = mix(vCol * vec3(0.92, 0.72, 0.5), pc, 0.35 + 0.65 * smoothstep(0.0, 0.8, amount));
  vec3 alb = mix(vCol * (0.96 + 0.08 * tone), pc, spot);
  float shine = vFx.x;
  float ndl = dot(n, uSunDir), ndv = clamp(dot(n, V), 0.0, 1.0);
  float dif = mix(max(ndl, 0.0), clamp((ndl + 0.22) * 0.82, 0.0, 1.0), 0.5);         // a coat is soft: the light wraps a little round the turn
  vec3 hemi = mix(uGroundColor, uSkyColor, n.y * 0.5 + 0.5);
  float sun = sunReach();
  vec3 col = alb * (uSunColor * dif * sun + hemi) * RECIPROCAL_PI;
  float rim = 1.0 - ndv; rim = rim * rim * rim;
  col += alb * uSunColor * RECIPROCAL_PI * 0.22 * rim * smoothstep(-0.2, 0.4, ndl) * (1.0 - shine) * sun;   // the nap's faint sheen where the coat turns from the eye
  vec3 hs = V + uSunDir; float hl = dot(hs, hs);
  float ndh = hl > 1e-8 ? max(dot(n, hs * inversesqrt(hl)), 0.0) : 0.0, g2 = ndh * ndh, g8 = g2 * g2 * g2 * g2, g64 = g8 * g8 * g8 * g8 * g8 * g8 * g8 * g8;
  col += uSunColor * RECIPROCAL_PI * 0.5 * g64 * shine * step(0.0, ndl) * sun;                // the eye's and the hoof's small light
  float top = max(col.r, max(col.g, col.b)), knee = top > 0.70 ? (0.70 + (top - 0.70) * 0.22) / top : 1.0;
  gl_FragColor = vec4(min(col * knee, vec3(0.89)), 1.0);
  #include <fog_fragment>
}`;

// ---------- a herd: one instanced mesh a skin ----------
const _q = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vc = new THREE.Vector3(), _m = new THREE.Matrix4();
function makeHerd(ctx, opts, K) {
  const count = Math.max(1, opts.count | 0 || 1), onlyShadow = opts.detail === 'shadow';
  const base = onlyShadow ? K.shadow : K.near, src = base.build();
  const geo = new THREE.InstancedBufferGeometry(); geo.index = src.index; for (const k in src.attributes) geo.setAttribute(k, src.attributes[k]);
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3), iQuat = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), iMisc = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), iVar = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  // NO TWO ALIKE: each animal's own four numbers, from the world's seed, the herd's seedKey and its index
  const seed = String(ctx && ctx.seed != null ? ctx.seed : 0), key = String(opts.seedKey ?? K.name);
  for (let i = 0; i < count; i++) { iQuat.array[i * 4 + 3] = 1; varietyOf(seed, key, i, iVar.array, i * 4); }   // unposed animals have size 0: nothing is drawn of them
  const inst = { iPos, iQuat, iMisc, iVar };
  for (const k in inst) geo.setAttribute(k, inst[k]);
  geo.instanceCount = count;
  const sun = (opts.sun ? opts.sun.clone() : new THREE.Vector3(-0.23, 0.33, -0.92)).normalize(), bounce = opts.bounce ?? 0.8, town = new THREE.Color(opts.townColor ?? '#d8cfbf');
  // the animals take the shadows of the houses and of each other from the engine's own shadow light (opts.receiveShadow false: none)
  const recv = opts.receiveShadow !== false;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, recv ? THREE.UniformsLib.lights : {}, {
    uTime: { value: 0 }, uSunDir: { value: sun },
    uSunColor: { value: opts.sunColor ? new THREE.Color(opts.sunColor) : new THREE.Color('#ffd49a').multiplyScalar(3.0) },
    uSkyColor: { value: opts.skyColor ? new THREE.Color(opts.skyColor) : new THREE.Color('#bcd6f5').multiplyScalar(1.2) },
    uGroundColor: { value: new THREE.Color() } }]);
  const groundGiven = new THREE.Color(0, 0, 0), sky = new THREE.Color(), amb = new THREE.Color(), tint = new THREE.Color();
  if (opts.groundColor) groundGiven.set(opts.groundColor);
  // the bounce of the sunlit town below, worked out from the sun and the sky; a ground colour given can only brighten it
  const relight = () => {
    const g = uniforms.uGroundColor.value;
    g.copy(uniforms.uSunColor.value).multiplyScalar(Math.max(0.15, uniforms.uSunDir.value.y)).add(uniforms.uSkyColor.value).multiply(town).multiplyScalar(bounce * K.bounce);
    g.r = Math.max(g.r, groundGiven.r); g.g = Math.max(g.g, groundGiven.g); g.b = Math.max(g.b, groundGiven.b);
  };
  relight();
  // (setLightFromScene's reader: made once here, so that relighting makes nothing new however often it is called)
  let gotSun = false, gotSky = false;
  const readLight = (o) => {
    if (o.isDirectionalLight && !gotSun) { gotSun = true; uniforms.uSunDir.value.copy(o.position).sub(o.target.position).normalize(); uniforms.uSunColor.value.copy(o.color).multiplyScalar(o.intensity); }
    else if (o.isHemisphereLight && !gotSky) { gotSky = true; sky.copy(o.color).multiplyScalar(o.intensity); }
    else if (o.isAmbientLight) amb.add(tint.copy(o.color).multiplyScalar(o.intensity));
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT_MAIN(K.anim), fragmentShader: K.frag, fog: true, lights: recv, side: THREE.DoubleSide, defines: recv ? { BEAST_SHADOW: 1 } : {} });
  const depthMaterial = new THREE.ShaderMaterial({ uniforms: { uTime: uniforms.uTime }, vertexShader: VERT_DEPTH(K.anim), fragmentShader: FRAG_DEPTH, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.customDepthMaterial = depthMaterial;
  mesh.castShadow = onlyShadow && opts.castShadow !== false; mesh.receiveShadow = recv; mesh.name = K.name + (onlyShadow ? '-shadow' : '');
  const object = new THREE.Group(); object.name = K.name; object.add(mesh);
  // THE SHADOWS: every animal once more in the lightest skin, in the same pose (the same instance arrays), drawn only into the
  // shadow light's own pass: it is never seen
  let shade = null, shadeGeo = null, shadeSrc = null, shadeMat = null;
  if (opts.castShadow !== false && !onlyShadow) {
    shadeSrc = K.shadow.build(); shadeGeo = new THREE.InstancedBufferGeometry(); shadeGeo.index = shadeSrc.index;
    for (const k in shadeSrc.attributes) shadeGeo.setAttribute(k, shadeSrc.attributes[k]);
    for (const k in inst) shadeGeo.setAttribute(k, inst[k]);
    shadeGeo.instanceCount = 0;
    shadeMat = new THREE.ShaderMaterial({ uniforms: { uTime: uniforms.uTime }, vertexShader: VERT_DEPTH(K.anim), fragmentShader: FRAG_DEPTH, side: THREE.DoubleSide, colorWrite: false, depthWrite: false });
    shade = new THREE.Mesh(shadeGeo, shadeMat); shade.frustumCulled = false; shade.customDepthMaterial = depthMaterial; shade.castShadow = true; shade.receiveShadow = false; shade.name = K.name + '-shade';
    shade.onBeforeShadow = () => { shadeGeo.instanceCount = count; };
    shade.onBeforeRender = () => { shadeGeo.instanceCount = 0; };
    object.add(shade);
  }
  const api = {
    object, mesh, material, depthMaterial, shadowMesh: shade, count, bounds: K.bounds, triangles: base.triangles, shadowTriangles: K.shadow.triangles, drawCalls: 1,
    commit() { iPos.needsUpdate = true; iQuat.needsUpdate = true; iMisc.needsUpdate = true; },
    update(dt, time) { uniforms.uTime.value = time; },
    // animal i's own four numbers 0..1 (the hash of the seed, the seedKey and i), written into `out` if one is given
    variety(i, out) { const a = iVar.array, o = i * 4; if (!out) return a.subarray(o, o + 4); out[0] = a[o]; out[1] = a[o + 1]; out[2] = a[o + 2]; out[3] = a[o + 3]; return out; },
    // relight live: { sun: Vector3 toward the sun, sunColor, skyColor, groundColor: Colors times their intensities }
    setLight(l) {
      if (!l) return;
      if (l.sun) uniforms.uSunDir.value.copy(l.sun).normalize();
      if (l.sunColor) uniforms.uSunColor.value.copy(l.sunColor); if (l.skyColor) uniforms.uSkyColor.value.copy(l.skyColor); if (l.groundColor) groundGiven.set(l.groundColor);
      relight();
    },
    // reads the scene's first DirectionalLight (the sun) and HemisphereLight (its sky colour; plus any AmbientLight)
    setLightFromScene(scene) {
      gotSun = false; gotSky = false; sky.setRGB(0, 0, 0); amb.setRGB(0, 0, 0);
      scene.traverse(readLight);
      if (gotSky || amb.r + amb.g + amb.b > 0) uniforms.uSkyColor.value.copy(sky).add(amb);
      relight();
    },
    dispose() { geo.dispose(); src.dispose(); material.dispose(); depthMaterial.dispose(); if (shade) { shadeGeo.dispose(); shadeSrc.dispose(); shadeMat.dispose(); object.remove(shade); } object.remove(mesh); },
  };
  return { api, iPos, iQuat, iMisc, count };
}

// ---------- the giraffe's bounds: one animal at size 1 over the whole stride, counted from the same sums the shader makes ----------
const r2 = (x) => Math.round(x * 100) / 100;
function measureGiraffe(b, from = 0, to = b.count, o = null) {
  o = o || { up: 0, front: 0, back: 0, halfWidth: 0, head: 0, tail: 0, down: 0 };
  const P = b.p, A = b.a, NT = 24, out = [0, 0, 0];
  for (let v = from; v < to; v++) {
    const kind = A[v * 4];
    for (let t = 0; t < NT; t++) for (let c = 0; c <= 1; c++) {
      if (kind < 1.5 && c) continue; if (kind > 2.5 && c) continue;
      gAnimate(kind, A[v * 4 + 1], A[v * 4 + 2], A[v * 4 + 3], P[v * 3], P[v * 3 + 1], P[v * 3 + 2], t / NT, c, out);
      if (out[1] > o.up) o.up = out[1]; if (-out[1] > o.down) o.down = -out[1]; if (Math.abs(out[0]) > o.halfWidth) o.halfWidth = Math.abs(out[0]);
      if (-out[2] > o.front) o.front = -out[2]; if (out[2] > o.back) o.back = out[2];
    }
  }
  return o;
}
function giraffeBounds(o) {
  return { height: r2(o.up + 0.03), length: r2(o.front + o.back + 0.06), halfWidth: r2(o.halfWidth + 0.03), stride: G.stride, headFront: r2(o.front + 0.03), tailBack: r2(o.back + 0.03), shoulder: 3.07,
    duty: G.fore.duty, beats: { hind: G.hind.off.slice(), fore: G.fore.off.slice() } };
}

// ---------- the skins, built once (they are the same for every world: nothing of them comes from a seed) ----------
const KIT = { giraffe: null, ladybird: null };
function giraffeKit(near, shadow, bounds) { return { name: 'giraffes', near, shadow, bounds, anim: GLSL_GIRAFFE, frag: FRAG_GIRAFFE, bounce: 1 }; }
// Builds the skins and counts the bounds in slices, a hand-back between each. Without it the makers do the same work in one step.
async function prepareBeasts(ctx) {
  const rest = async () => { if (ctx && ctx.yield) await ctx.yield(); };
  if (!KIT.giraffe) {
    const near = buildGiraffe('near'); await rest(); const shadow = buildGiraffe('shadow'); await rest();
    let o = null; const step = Math.ceil(near.count / 6);
    for (let v = 0; v < near.count; v += step) { o = measureGiraffe(near, v, Math.min(near.count, v + step), o); await rest(); }
    KIT.giraffe = giraffeKit(near, shadow, giraffeBounds(o));
  }
  if (!KIT.ladybird) { KIT.ladybird = await prepareLadybird(rest); await rest(); }
  return KIT;
}

function makeGiraffes(ctx, opts = {}) {
  if (!KIT.giraffe) { const near = buildGiraffe('near'); KIT.giraffe = giraffeKit(near, buildGiraffe('shadow'), giraffeBounds(measureGiraffe(near))); }
  const { api, iPos, iQuat, iMisc, count } = makeHerd(ctx, opts, KIT.giraffe);
  // x, y, z: where the ground is under the animal's middle; yaw: its turn about +y (0 faces -z); phase: strides run; size: 1 = 5 m to the horns
  api.setPose = (i, x, y, z, yaw = 0, phase = 0, size = 1) => {
    if (i < 0 || i >= count) return;
    iPos.array[i * 3] = x; iPos.array[i * 3 + 1] = y; iPos.array[i * 3 + 2] = z;
    iQuat.array[i * 4] = 0; iQuat.array[i * 4 + 1] = Math.sin(yaw * 0.5); iQuat.array[i * 4 + 2] = 0; iQuat.array[i * 4 + 3] = Math.cos(yaw * 0.5);
    iMisc.array[i * 4] = size; iMisc.array[i * 4 + 1] = phase - Math.floor(phase);   // every motion repeats with the stride: only the part of a stride is kept, at full precision
  };
  return api;
}

// =====================================================================================================================
// THE LADYBIRD: a seven-spot ladybird as long as a cart.
// OWN FRAME  facing -z, back toward +y, origin on the surface under its middle; metres at size 1; 3.2 m from the front of
// the head (z -1.6) to the end of the wing cases (z +1.6).
// =====================================================================================================================
const LP = { red: lin('#d3231b'), black: lin('#0e0d0c'), pale: lin('#f4eedc'), feeler: lin('#3a2a1c') };
// THE WALK. One stride is LB.stride metres; `phase` counts strides. Six legs in two threes (fore and hind of one side with
// the middle of the other); a foot is down for `duty` of the stride and goes back under the body at the surface's own speed.
const LB = {
  stride: 1.2, duty: 0.6, lift: 0.17, ankle: 0.07, bob: 0.018, roll: 0.02, tilt: 0.95,
  ze0: -0.70, ze1: 1.60, rim: 0.13,
  // hip [x, y, z] under the body; foot: where the ankle stands at the middle of its time down [x, z]; L1, L2: thigh and shin
  legs: [
    { hip: [0.26, 0.30, -1.02], foot: [1.02, -1.50], L1: 0.52, L2: 0.64, lag: 0.0 },
    { hip: [0.30, 0.30, -0.55], foot: [1.50, -0.45], L1: 0.62, L2: 0.76, lag: 0.04 },
    { hip: [0.30, 0.30, -0.15], foot: [1.26, 0.86], L1: 0.80, L2: 0.94, lag: 0.08 },
  ],
};
for (const L of LB.legs) {
  // the leg as built: in its own upright plane, y up and z = minus the way out from the hip; knee above the line from hip to ankle
  const dx = L.foot[0] - L.hip[0], dz = L.foot[1] - L.hip[2], r0 = Math.hypot(dx, dz), ty = LB.ankle - L.hip[1], d = Math.hypot(ty, r0);
  L.dir0 = [dx / r0, dz / r0]; L.r0 = r0;
  const a1 = Math.atan2(r0, -ty) + Math.acos(clamp((L.L1 * L.L1 + d * d - L.L2 * L.L2) / (2 * L.L1 * d), -1, 1));
  L.H = [L.hip[1], 0]; L.J = [L.hip[1] - L.L1 * Math.cos(a1), -L.L1 * Math.sin(a1)]; L.K = [LB.ankle, -r0];
  L.a1 = a1; L.a2 = Math.atan2(-(L.K[1] - L.J[1]), -(L.K[0] - L.J[0]));
}
// which three a leg walks with: 0 or half a stride
const lbOff = (k, side) => (((k === 1) !== (side < 0)) ? 0.5 : 0) + LB.legs[k].lag;
// the ankle of a leg at its own beat q: [y, z in the animal's frame, swing]
function lbFoot(L, q, o) {
  const hs = 0.5 * LB.stride * LB.duty, zc = L.foot[1];
  if (q < LB.duty) { o[0] = LB.ankle; o[1] = zc - hs + LB.stride * q; o[2] = 0; return o; }
  const u = (q - LB.duty) / (1 - LB.duty), m = LB.stride * (1 - LB.duty), u2 = u * u, u3 = u2 * u, sb = Math.sin(Math.PI * u);
  o[0] = LB.ankle + LB.lift * sb * (0.55 + 0.45 * sb); o[1] = (zc + hs) * (2 * u3 - 3 * u2 + 1) + (zc - hs) * (3 * u2 - 2 * u3) + m * (2 * u3 - 3 * u2 + u);
  o[2] = sstep(0, 0.25, u) * (1 - sstep(0.75, 1, u)); return o;
}
// one vertex of a leg (built in its own plane: x across, y up, z = minus the way out) at phase ph: out [x, y, z] in the animal's frame
function lbLeg(k, side, w, x, y, z, ph, o) {
  const L = LB.legs[k], q = ph - lbOff(k, side), F = lbFoot(L, q - Math.floor(q), _f), hx = L.hip[0] * side, fx = L.foot[0] * side;
  let dx = fx - hx, dz = F[1] - L.hip[2]; const r = Math.max(Math.hypot(dx, dz), 1e-4); dx /= r; dz /= r;
  let ty = F[0] - L.H[0], tz = -r; const d = Math.max(Math.hypot(ty, tz), 1e-4); ty /= d; tz /= d;
  const dc = clamp(d, Math.abs(L.L1 - L.L2) + 1e-3, L.L1 + L.L2 - 1e-4), a1 = Math.atan2(-tz, -ty) + Math.acos(clamp((L.L1 * L.L1 + dc * dc - L.L2 * L.L2) / (2 * L.L1 * dc), -1, 1));
  const Jy = L.H[0] - L.L1 * Math.cos(a1), Jz = -L.L1 * Math.sin(a1), th1 = a1 - L.a1, th2 = Math.atan2(-(-r - Jz), -(F[0] - Jy)) - L.a2, rr = _j;
  if (w > 1.5) {
    // the foot lies along the leg's own line as built and does not turn while it stands
    rot2(y - L.K[0], z - L.K[1], -clamp((F[0] - LB.ankle) * 3.0, 0, 0.5), rr); const out = -rr[1], d0x = L.dir0[0] * side, d0z = L.dir0[1];
    o[0] = fx + d0x * out - d0z * x; o[1] = F[0] + rr[0]; o[2] = F[1] + d0z * out + d0x * x; return o;
  }
  rot2(y - L.J[0], z - L.J[1], mix(th1, th2, w), rr); const out = -(Jz + rr[1]);
  // the knee is held out to the side, not straight up: thigh and shin are turned about the line from hip to ankle
  const vx = dx * out - dz * x, vy = Jy + rr[0] - L.hip[1], vz = dz * out + dx * x;
  let kx = fx - hx, ky = F[0] - L.hip[1], kz = F[1] - L.hip[2]; const kl = Math.max(Math.hypot(kx, ky, kz), 1e-4); kx /= kl; ky /= kl; kz /= kl;
  const ta = LB.tilt * side * (k > 1.5 ? -1 : 1), c = Math.cos(ta), sn = Math.sin(ta), kd = (kx * vx + ky * vy + kz * vz) * (1 - c);
  o[0] = hx + vx * c + (ky * vz - kz * vy) * sn + kx * kd; o[1] = L.hip[1] + vy * c + (kz * vx - kx * vz) * sn + ky * kd; o[2] = L.hip[2] + vz * c + (kx * vy - ky * vx) * sn + kz * kd; return o;
}
// the wing cases' dome: t 0 (front) .. 1 (the end), a the angle from the top (0) to the rim (+-90 degrees): [x, y, z]
function domeAt(t, a) {
  const w = t < 0.38 ? 1.25 * (1 - 0.2 * Math.pow((0.38 - t) / 0.38, 2)) : 1.25 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.38) / 0.62, 2)));
  const h = t < 0.4 ? 1.5 - 0.5 * Math.pow((0.4 - t) / 0.4, 2) : LB.rim + (1.5 - LB.rim) * Math.pow(Math.max(0, 1 - Math.pow((t - 0.4) / 0.6, 2)), 0.45);
  const s = Math.sin(a), c = Math.cos(a);
  return [w * Math.sign(s) * Math.pow(Math.abs(s), 0.85), LB.rim + (h - LB.rim) * Math.pow(Math.max(c, 0), 0.8), mix(LB.ze0, LB.ze1, t)];
}
// the seven spots: one on the parting line behind the shield, three on each wing case: [t, degrees from the top, radius]
const LB_SPOTS = [[0.075, 0, 0.25], [0.27, 60, 0.20], [0.50, 28, 0.28], [0.77, 50, 0.22]].map(([t, a, r]) => { const c = domeAt(t, a * Math.PI / 180); return [c[0], c[1], c[2], r]; });
const LB_MARK = (() => { const c = domeAt(0.012, 24 * Math.PI / 180); return [c[0], c[1], c[2], 0.105]; })();
const L_SKIN = {
  near: { dome: [0, 0.07, 0.18, 0.3, 0.42, 0.55, 0.68, 0.8, 0.9, 0.97], across: 14, shield: 8, head: 6, leg: 4, feelers: true },
  shadow: { dome: [0, 0.3, 0.62, 0.93], across: 6, shield: 4, head: 0, leg: 3, feelers: false, shieldRows: [0, 2, 4] },
};
function buildLadybird(detail) {
  const Q = L_SKIN[detail === 'shadow' ? 'shadow' : 'near'], b = new Builder();
  // a shell: arcs from the left rim over the top to the right rim, front to back; closed below by a flat black belly
  const shell = (arcs, col, part, capFront, capBack) => {
    let v0 = b.count, i0 = b.idx.length; const rows = [];
    b.set({ col, coat: null, amount: 0, a: [0, 0, 0, 0], fx: [1, part], sg: 0 });
    for (const pts of arcs) rows.push(pts.map((q) => b.v(q[0], q[1], q[2])));
    for (let i = 0; i + 1 < rows.length; i++) for (let j = 0; j + 1 < rows[i].length; j++) b.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]);
    if (capBack) { const A = arcs[arcs.length - 1], c = b.v(0, capBack[0], capBack[1]), R = rows[rows.length - 1]; for (let j = 0; j + 1 < R.length; j++) b.tri(c, R[j + 1], R[j]); }
    b.smooth(v0, i0);
    // the front wall and the belly: flat, black
    v0 = b.count; i0 = b.idx.length;
    b.set({ col: LP.black, fx: [0.6, 1], sg: 1 });
    if (capFront) { const A = arcs[0], c = b.v(0, capFront[0], capFront[1]), R = A.map((q) => b.v(q[0], q[1], q[2])); for (let j = 0; j + 1 < R.length; j++) b.tri(c, R[j], R[j + 1]); b.tri(c, R[R.length - 1], R[0]); }
    b.smooth(v0, i0); v0 = b.count; i0 = b.idx.length; b.set({ sg: 2 });
    const n = arcs[0].length - 1, Lr = arcs.map((A) => b.v(A[0][0], A[0][1], A[0][2])), Rr = arcs.map((A) => b.v(A[n][0], A[n][1], A[n][2]));
    for (let i = 0; i + 1 < arcs.length; i++) b.quad(Lr[i], Rr[i], Rr[i + 1], Lr[i + 1]);
    if (capBack) { const c = b.v(0, capBack[0], capBack[1]); b.tri(Lr[arcs.length - 1], Rr[arcs.length - 1], c); }
    b.smooth(v0, i0);
  };
  const arcOf = (fn, n) => { const pts = []; for (let j = 0; j <= n; j++) pts.push(fn(-Math.PI / 2 + Math.PI * j / n)); return pts; };
  // ----- the wing cases: one high glossy dome -----
  shell(Q.dome.map((t) => arcOf((a) => domeAt(t, a), Q.across)), LP.red, 0, [0.6, LB.ze0], [LB.rim, LB.ze1]);
  // ----- the shield before them (black, a pale patch at each fore corner) and the small head -----
  const lump = (z, w, h, rim) => (a) => { const s = Math.sin(a), c = Math.cos(a); return [w * Math.sign(s) * Math.pow(Math.abs(s), 0.8), rim + (h - rim) * Math.pow(Math.max(c, 0), 0.75), z]; };
  shell([[-0.60, 1.0, 1.0], [-0.84, 0.95, 0.90], [-1.08, 0.80, 0.70], [-1.24, 0.62, 0.50], [-1.31, 0.44, 0.36]].filter((_, i) => !Q.shieldRows || Q.shieldRows.includes(i)).map(([z, w, h]) => arcOf(lump(z, w, h, 0.14), Q.shield)).reverse(), LP.black, 2, [0.3, -1.31], null);
  if (Q.head) shell([[-1.24, 0.40, 0.50], [-1.42, 0.40, 0.47], [-1.55, 0.30, 0.37]].map(([z, w, h]) => arcOf(lump(z, w, h, 0.15), Q.head)).reverse().concat([]), LP.black, 3, [0.27, -1.6], null);
  // ----- six legs: thigh, shin and foot, built in each leg's own upright plane (x across, y up, z = minus the way out) -----
  LB.legs.forEach((L, k) => {
    for (const s of [-1, 1]) {
      const v0 = b.count, i0 = b.idx.length, n = Q.leg, tip = [0.03, L.K[1] - 0.27];
      b.set({ col: LP.black, coat: null, amount: 0, fx: [0.6, 1], sg: 0 });
      const rows = [[L.H, 0.095, 0], [L.J, 0.085, 0.5], [L.K, 0.058, 1], [L.K, 0.05, 2], [tip, 0.024, 2]].slice(0, Q.feelers ? 5 : 3); let P = null;
      rows.forEach(([c, r, w], i) => {
        const c0 = rows[Math.max(0, i - 1)][0], c1 = rows[Math.min(rows.length - 1, i + 1)][0]; let ty = c1[0] - c0[0], tz = c1[1] - c0[1]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
        if (i >= 3) { ty = 0; tz = -1; } if (i === 2) { ty = -1; tz = 0; }
        const R = [];
        for (let j = 0; j < n; j++) { const th = (j / n) * TAU, cf = Math.cos(th), sx = Math.sin(th); R.push(b.v(sx * r, c[0] + cf * r * (-tz), c[1] + cf * r * ty, { a: [1, k, w, s] })); }
        if (P) b.bridge(P, R); P = R;
      });
      if (Q.feelers) b.fan(P, b.v(0, tip[0], tip[1] - 0.03, { a: [1, k, 2, s] }), false); else b.fan(P, b.v(0, L.K[0] - 0.05, L.K[1], { a: [1, k, 1, s] }), false);
      b.smooth(v0, i0);
    }
  });
  // ----- two short feelers, clubbed at the end -----
  if (Q.feelers) for (const s of [-1, 1]) {
    const v0 = b.count, i0 = b.idx.length; let P = null;
    b.set({ col: LP.feeler, coat: null, amount: 0, fx: [0.3, 1], sg: 0 });
    const root = [0.17, 0.33, -1.52], dir = [0.55, 0.42, -0.72], dl = Math.hypot(dir[0], dir[1], dir[2]);
    for (const [l, r] of [[0, 0.03], [0.26, 0.024], [0.40, 0.045], [0.5, 0.02]]) {
      const c = [s * (root[0] + dir[0] / dl * l), root[1] + dir[1] / dl * l, root[2] + dir[2] / dl * l], R = [];
      for (let j = 0; j < 3; j++) { const th = (j / 3) * TAU; R.push(b.v(c[0] + Math.cos(th) * r, c[1] + Math.sin(th) * r * 0.8, c[2] + Math.sin(th) * r * 0.5, { a: [2, l / 0.5, 0, s] })); }
      if (P) b.bridge(P, R); P = R;
    }
    b.smooth(v0, i0);
  }
  return b;
}
const gl3 = (v) => `vec3(${f(v[0])}, ${f(v[1])}, ${f(v[2])})`;
const pick3 = (fn) => `(k < 0.5 ? ${fn(LB.legs[0])} : k < 1.5 ? ${fn(LB.legs[1])} : ${fn(LB.legs[2])})`;
const GLSL_LADYBIRD = /* glsl */`
${GLSL_COMMON}
// the ankle of a leg at its own beat q (0 the foot comes down, duty it leaves): (y, z, swing)
vec3 lFoot(float q, float zc) {
  float hs = ${f(0.5 * LB.stride * LB.duty)};
  if (q < ${f(LB.duty)}) return vec3(${f(LB.ankle)}, zc - hs + ${f(LB.stride)} * q, 0.0);
  float u = clamp((q - ${f(LB.duty)}) * ${f(1 / (1 - LB.duty))}, 0.0, 1.0), m = ${f(LB.stride * (1 - LB.duty))}, u2 = u * u, u3 = u2 * u, sb = sin(3.14159265 * u);
  return vec3(${f(LB.ankle)} + ${f(LB.lift)} * sb * (0.55 + 0.45 * sb), (zc + hs) * (2.0 * u3 - 3.0 * u2 + 1.0) + (zc - hs) * (3.0 * u2 - 2.0 * u3) + m * (2.0 * u3 - 3.0 * u2 + u),
    smoothstep(0.0, 0.25, u) * (1.0 - smoothstep(0.75, 1.0, u)));
}
void animate(out vec3 P, out vec3 Nn) {
  float kind = aAnim.x, ph = iMisc.y, side = aAnim.w;
  vec3 p = position, n = normal;
  if (kind > 0.5 && kind < 1.5) {
    // a leg, built in its own upright plane (x across, y up, z = minus the way out from the hip): its ankle is put where the
    // walk has it, the thigh and shin are laid between hip and ankle with the knee up, and the plane is turned to face the foot
    float k = aAnim.y, w = aAnim.z;
    vec3 hip = ${pick3((L) => gl3(L.hip))}; vec2 foot = ${pick3((L) => gl2(L.foot))}, J = ${pick3((L) => gl2(L.J))}, K = ${pick3((L) => gl2(L.K))}, D0 = ${pick3((L) => gl2(L.dir0))};
    float L1 = ${pick3((L) => f(L.L1))}, L2 = ${pick3((L) => f(L.L2))}, A1 = ${pick3((L) => f(L.a1))}, A2 = ${pick3((L) => f(L.a2))}, lag = ${pick3((L) => f(L.lag))};
    float off = (((k > 0.5 && k < 1.5) != (side < 0.0)) ? 0.5 : 0.0) + lag;
    vec3 ft = lFoot(fract(ph - off), foot.y);
    float hx = hip.x * side, fx = foot.x * side;
    vec2 dxz = vec2(fx - hx, ft.y - hip.z); float r = max(length(dxz), 1e-4); dxz = dxz * (1.0 / r);
    vec2 t = vec2(ft.x - hip.y, -r); float d = max(length(t), 1e-4); t = t * (1.0 / d);
    float dc = clamp(d, abs(L1 - L2) + 1e-3, L1 + L2 - 1e-4);
    float a1 = ang(t) + acos(clamp((L1 * L1 + dc * dc - L2 * L2) / max(2.0 * L1 * dc, 1e-4), -1.0, 1.0));
    vec2 Jp = vec2(hip.y, 0.0) - L1 * vec2(cos(a1), sin(a1));
    float th1 = a1 - A1, th2 = ang(vec2(ft.x, -r) - Jp) - A2;
    if (w > 1.5) {
      // the foot lies along the leg's line as built and does not turn while it stands
      float th3 = -clamp((ft.x - ${f(LB.ankle)}) * 3.0, 0.0, 0.5); vec2 l = rot2(p.yz - K, th3), d0 = vec2(D0.x * side, D0.y); n.yz = rot2(n.yz, th3);
      P = vec3(fx - d0.x * l.y - d0.y * p.x, ft.x + l.x, ft.y - d0.y * l.y + d0.x * p.x);
      Nn = vec3(-d0.x * n.z - d0.y * n.x, n.y, -d0.y * n.z + d0.x * n.x);
      return;
    }
    float th = mix(th1, th2, w); vec2 l = Jp + rot2(p.yz - J, th); n.yz = rot2(n.yz, th);
    // the knee is held out to the side, not straight up: thigh and shin are turned about the line from hip to ankle
    vec3 v = vec3(-dxz.x * l.y - dxz.y * p.x, l.x - hip.y, -dxz.y * l.y + dxz.x * p.x), vn = vec3(-dxz.x * n.z - dxz.y * n.x, n.y, -dxz.y * n.z + dxz.x * n.x);
    vec3 kx = vec3(fx - hx, ft.x - hip.y, ft.y - hip.z); kx = kx * inversesqrt(max(dot(kx, kx), 1e-8));
    float ta = ${f(LB.tilt)} * side * (k > 1.5 ? -1.0 : 1.0), ct = cos(ta), st = sin(ta);
    P = vec3(hx, hip.y, hip.z) + v * ct + cross(kx, v) * st + kx * (dot(kx, v) * (1.0 - ct));
    Nn = vn * ct + cross(kx, vn) * st + kx * (dot(kx, vn) * (1.0 - ct));
    return;
  }
  if (kind > 1.5) {
    // a feeler: it nods and sways about its root, by the clock and a little with the walk
    float s = aAnim.y, a = s * (0.10 * sin(uTime * 2.3 + side * 1.1 + iVar.x * 6.2831853) + 0.06 * sin(12.5663706 * ph + side));
    vec2 root = vec2(0.33, -1.52);
    p.yz = root + rot2(p.yz - root, a); n.yz = rot2(n.yz, a);
    p.x += s * 0.035 * sin(uTime * 1.7 + side * 2.0 + iVar.y * 6.2831853);
  }
  // the body rides its legs: a small rise and fall twice a stride, a small roll once
  float roll = ${f(LB.roll)} * sin(6.2831853 * ph), cr = cos(roll), sr = sin(roll);
  p.xy = vec2(0.0, 0.4) + vec2(cr * p.x - sr * (p.y - 0.4), sr * p.x + cr * (p.y - 0.4)); n.xy = vec2(cr * n.x - sr * n.y, sr * n.x + cr * n.y);
  p.y += ${f(LB.bob)} * sin(12.5663706 * ph);
  P = p; Nn = n;
}`;
const FRAG_LADYBIRD = /* glsl */`
${FRAG_HEAD}
// 1 inside a ball of radius r about c, 0 outside, the edge aa wide
float disc(vec3 p, vec3 c, float r, float aa) { vec3 d = p - c; return 1.0 - smoothstep(r - aa, r + aa, sqrt(max(dot(d, d), 1e-12))); }
void main() {
  float nl = dot(vN, vN);
  vec3 n = nl > 1e-8 ? vN * inversesqrt(nl) : vec3(0.0, 1.0, 0.0);
  if (!gl_FrontFacing) n = -n;
  vec3 vd = cameraPosition - vWorld; float vl = dot(vd, vd);
  vec3 V = vl > 1e-8 ? vd * inversesqrt(vl) : vec3(0.0, 0.0, 1.0);
  float gloss = vFx.x, part = vFx.y;
  vec3 alb = vCol, pr = vec3(abs(vRest.x), vRest.yz);
  float aa = max(fwidth(vRest.x), max(fwidth(vRest.y), fwidth(vRest.z))) * 0.75 + 0.004;
  vec3 PALE = ${gl3(LP.pale)}, BLACK = ${gl3(LP.black)};
  if (part < 0.5) {
    // THE WING CASES: this animal's own red (from scarlet toward orange), its seven black spots (each animal's a little larger
    // or smaller), the two pale marks beside the first spot, the fine parting line, a darker rim
    alb = mix(vec3(0.62, 0.030, 0.014), vec3(0.72, 0.105, 0.012), vVar.x * vVar.x);
    float k = 0.86 + 0.28 * vVar.y;
    float sp = max(max(disc(pr * vec3(1.0, 1.0, 0.8), ${gl3(LB_SPOTS[0])} * vec3(1.0, 1.0, 0.8), ${f(LB_SPOTS[0][3])} * k, aa), disc(pr, ${gl3(LB_SPOTS[1])}, ${f(LB_SPOTS[1][3])} * k, aa)),
      max(disc(pr, ${gl3(LB_SPOTS[2])}, ${f(LB_SPOTS[2][3])} * k, aa), disc(pr, ${gl3(LB_SPOTS[3])}, ${f(LB_SPOTS[3][3])} * k, aa)));
    alb = mix(alb, PALE, disc(pr, ${gl3(LB_MARK)}, ${f(LB_MARK[3])}, aa));
    alb = mix(alb, alb * 0.22, (1.0 - smoothstep(0.004, 0.012 + aa, pr.x)) * 0.9);
    alb = mix(alb, BLACK, sp);
    alb *= mix(0.55, 1.0, smoothstep(${f(LB.rim)}, ${f(LB.rim + 0.08)}, vRest.y));
  } else if (part > 1.5 && part < 2.5) {
    // the shield: black, a pale patch at each fore corner
    alb = mix(alb, PALE, disc(pr * vec3(1.0, 0.7, 1.25), vec3(0.62, 0.50, -1.12) * vec3(1.0, 0.7, 1.25), 0.21, aa));
  } else if (part > 2.5) {
    alb = mix(alb, PALE, disc(pr, vec3(0.17, 0.45, -1.45), 0.075, aa));   // the head: two small pale marks between the eyes
  }
  float ndl = dot(n, uSunDir), dif = max(ndl, 0.0), ndv = clamp(dot(n, V), 0.0, 1.0);
  vec3 hemi = mix(uGroundColor, uSkyColor, n.y * 0.5 + 0.5);
  float sun = sunReach();
  vec3 col = alb * (uSunColor * dif * sun + hemi) * RECIPROCAL_PI;
  float redAny = clamp((alb.r - alb.g) * 2.0 - 0.2, 0.0, 1.0);
  float top = max(col.r, max(col.g, col.b)), k0 = mix(0.74, 0.58, redAny), knee = top > k0 ? (k0 + (top - k0) * 0.14) / top : 1.0;   // (the red is held deep: never boiled)
  col *= knee;
  // LACQUER: the sky and the town mirrored faintly in the shell, more where it turns from the eye; the sun's own small hard light
  float fr = 1.0 - ndv, f5 = fr * fr * fr * fr * fr;
  vec3 R = reflect(-V, n);
  vec3 env = mix(uGroundColor, uSkyColor, smoothstep(-0.2, 0.3, R.y)) * RECIPROCAL_PI;
  col += env * (0.045 + 0.6 * f5) * gloss;
  vec3 hv = V + uSunDir; float hl = dot(hv, hv);
  float ndh = hl > 1e-8 ? max(dot(n, hv * inversesqrt(hl)), 0.0) : 0.0, lit = smoothstep(-0.05, 0.15, ndl) * sun;
  float core = pow(max(ndh, 1e-4), 260.0), halo = pow(max(ndh, 1e-4), 30.0);
  vec3 sunTint = uSunColor / max(max(uSunColor.r, uSunColor.g), max(uSunColor.b, 0.001));
  col += uSunColor * RECIPROCAL_PI * halo * 0.07 * gloss * lit;
  col = mix(col, sunTint * 0.88, clamp(core * 1.6, 0.0, 1.0) * gloss * lit);
  gl_FragColor = vec4(min(col, vec3(0.89)), 1.0);
  #include <fog_fragment>
}`;
function measureLadybird(b, from = 0, to = b.count, o = null) {
  o = o || { up: 0, halfWidth: 0, front: 0, back: 0, body: 0 };
  const P = b.p, A = b.a, NT = 20, out = [0, 0, 0];
  for (let v = from; v < to; v++) {
    const kind = A[v * 4], x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    for (let t = 0; t < (kind === 1 ? NT : 1); t++) {
      if (kind === 1) lbLeg(A[v * 4 + 1], A[v * 4 + 3], A[v * 4 + 2], x, y, z, t / NT, out); else { out[0] = x; out[1] = y + LB.bob + LB.roll * Math.abs(x); out[2] = z; if (kind === 0 && Math.abs(x) > o.body) o.body = Math.abs(x); }
      if (out[1] > o.up) o.up = out[1]; if (Math.abs(out[0]) > o.halfWidth) o.halfWidth = Math.abs(out[0]); if (-out[2] > o.front) o.front = -out[2]; if (out[2] > o.back) o.back = out[2];
    }
  }
  return o;
}
function ladybirdBounds(o) {
  return { length: 3.2, halfWidth: r2(o.halfWidth + 0.03), height: r2(o.up + 0.02), stride: LB.stride, bodyHalfWidth: r2(o.body), front: r2(o.front + 0.03), back: r2(o.back + 0.03), duty: LB.duty };
}
function ladybirdKit(near, shadow, bounds) { return { name: 'ladybirds', near, shadow, bounds, anim: GLSL_LADYBIRD, frag: FRAG_LADYBIRD, bounce: 1 }; }
async function prepareLadybird(rest) {
  const near = buildLadybird('near'); await rest(); const shadow = buildLadybird('shadow'); await rest();
  return ladybirdKit(near, shadow, ladybirdBounds(measureLadybird(near)));
}

function makeLadybirds(ctx, opts = {}) {
  if (!KIT.ladybird) { const near = buildLadybird('near'); KIT.ladybird = ladybirdKit(near, buildLadybird('shadow'), ladybirdBounds(measureLadybird(near))); }
  const { api, iPos, iQuat, iMisc, count } = makeHerd(ctx, opts, KIT.ladybird);
  // point: where the surface is under the animal's middle; normal: the surface's own, out of the wall or roof; heading: the
  // angle in the surface's plane, measured from straight up the surface (on a level one: from -z, as a giraffe's yaw is) and
  // turning anticlockwise as seen from outside, looking at the surface; or, instead of an angle, the direction to face as
  // [x, y, z]. phase: strides walked (metres over bounds.stride * size). size: 1 = 3.2 m long.
  api.setPose = (i, point, normal, heading = 0, phase = 0, size = 1) => {
    if (i < 0 || i >= count) return;
    let nx = normal.x ?? normal[0], ny = normal.y ?? normal[1], nz = normal.z ?? normal[2]; const nl = Math.hypot(nx, ny, nz);
    if (nl > 1e-9) { nx /= nl; ny /= nl; nz /= nl; } else { nx = 0; ny = 1; nz = 0; }   // (no normal given: a level surface)
    // e1: straight up the surface (north where it is level); e2: to the left of that, seen from outside
    let ex = -nx * ny, ey = 1 - ny * ny, ez = -nz * ny, el = Math.hypot(ex, ey, ez);
    if (el < 1e-4) { ex = 0; ey = 0; ez = -1; el = 1; }
    ex /= el; ey /= el; ez /= el;
    let fx, fy, fz;
    if (typeof heading === 'number') {
      const c = Math.cos(heading), s = Math.sin(heading), gx = ny * ez - nz * ey, gy = nz * ex - nx * ez, gz = nx * ey - ny * ex;
      fx = ex * c + gx * s; fy = ey * c + gy * s; fz = ez * c + gz * s;
    } else {
      const hx = heading.x ?? heading[0], hy = heading.y ?? heading[1], hz = heading.z ?? heading[2], dn = hx * nx + hy * ny + hz * nz;
      fx = hx - nx * dn; fy = hy - ny * dn; fz = hz - nz * dn; const fl = Math.hypot(fx, fy, fz);
      if (fl < 1e-6) { fx = ex; fy = ey; fz = ez; } else { fx /= fl; fy /= fl; fz /= fl; }
    }
    // the animal's own x, y, z axes in the world: x = f x n, y = n, z = -f
    _va.set(fy * nz - fz * ny, fz * nx - fx * nz, fx * ny - fy * nx); _vb.set(nx, ny, nz); _vc.set(-fx, -fy, -fz);
    _q.setFromRotationMatrix(_m.makeBasis(_va, _vb, _vc));
    iPos.array[i * 3] = point.x ?? point[0]; iPos.array[i * 3 + 1] = point.y ?? point[1]; iPos.array[i * 3 + 2] = point.z ?? point[2];
    iQuat.array[i * 4] = _q.x; iQuat.array[i * 4 + 1] = _q.y; iQuat.array[i * 4 + 2] = _q.z; iQuat.array[i * 4 + 3] = _q.w;
    iMisc.array[i * 4] = size; iMisc.array[i * 4 + 1] = phase - Math.floor(phase);
  };
  return api;
}
return { prepareBeasts, makeGiraffes, makeLadybirds };
})();
export const prepareBeasts = BEASTS.prepareBeasts, makeGiraffes = BEASTS.makeGiraffes, makeLadybirds = BEASTS.makeLadybirds;
