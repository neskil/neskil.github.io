// ORBITAL SUNRISE: hero set piece "The Sunrise through the Wheel" (everything procedural, no kit imports beyond core).
//
// WHAT     The habitat wheel of the station: a 600 m rim of pressurised modules (rows of room windows, long garden
//          galleries with tree silhouettes, a continuous garden skylight band on the hub-facing roof), eight spokes
//          (elevator tube inside a lattice truss, radiators, tanks, braces, elevator pods), a ribbed rotating hub,
//          and, NOT rotating, the spindle that runs through the hub bore: a fore stub with a de-spun docking node and
//          a docked shuttle, and the aft spindle (truss, foil modules, tanks, solar wings, dish) ending in an offset
//          docking-port ring that seats the exit portal.
// SIZE     Wheel plane = local XY, spin axis = local Z, hub centre at (0, 300, 0) (origin = lowest point of the rim;
//          pass opts.hubAtOrigin to put the hub at the origin instead). Rim outer radius 300. Spindle from z +150
//          (fore, toward the arriving camera) to z -360 (aft); docking ring centre at (32, 300, -372).
//          radius 300, height 600, center = hub.
// OPTS     palette      7 hex strings in the brief's order (space black, deep blue, limb blue, sun white, hull white,
//                       dark metal, amber accent)
//          hubAtOrigin  (false) origin at the hub centre instead of the base of the rim
//          period       (60) seconds per turn;  steer (true) phase steering, see below
//          sunrise      (0.55) initial sunrise value until setProgress/setSunrise is called
//          sunDir       Vector3 TOWARD the sun in world space (default: dead ahead and 11 degrees down, (0,-0.2,-1))
//          shuttle      (true) docked shuttle on the fore node
// PER SEED modules per spoke gap (2 or 3), rim section (width, depth, roof slope), which modules are garden galleries,
//          hub length and ribbing, spoke dressing (radiators, tanks, pods), accent colour, spin direction and phase,
//          shuttle docking angle, spindle module layout, dish.
// PROGRESS hero.setProgress(u)   path progress 0..1 as in the brief: maps u 0.42..0.64 onto the sunrise.
//          hero.setSunrise(s)    0..1 directly. 0 = night (cool earthshine, windows and beacons only). As s rises the
//                                Earth's shadow edge sweeps DOWN across the wheel: surfaces just above it are lit deep
//                                red, then gold, then white, so the rim lights gold segment by segment as each module
//                                rotates up into the light. 1 = whole piece in full white sun.
//          hero.setSun(dirTowardSun, linearColor)   hero.setEarthshine(linearColor | null = automatic)
//          hero.sunVisibility(camera) -> 0..1: how much of the sun's disc is NOT hidden by a spoke, the hub, the rim
//                                or the spindle as seen from that camera. Drive the lens flare and key light with it
//                                (the spokes strobing across the sun). Also stored each frame in hero.sunVis.
//          hero.setPhase(rad) / hero.phase   wheel angle about its axis (overrides free running for that frame).
//          Phase steering (opts.steer): update(dt, time, camera) watches the camera closing on the wheel plane and
//          trims the spin rate by at most 30% (60% in the last 60 m) so the camera crosses mid-way between two
//          spokes whatever the flight speed. It only acts within 480 m in front of the plane; elsewhere free running.
// ANCHORS  (local space; camera arrives from +Z travelling toward -Z)
//          hub            hub centre;  axis  (0,0,1)
//          crossing       where the camera should pierce the wheel plane: 110 m from the hub on +X, so the hub is on
//                         the left and the rim's garden skylights on the right. The gap between spokes there is 86 m.
//          flyThrough     ordered points entry -> exit: in from the fore side, through `crossing`, easing in to 32 m
//                         off the spindle axis and straight for the last 250 m into portalSeat. 20 m+ clearance.
//          portalSeat     { position, normal, radius }: centre of the aft docking-port ring (inner radius 9 m), portal
//                         faces +Z. Put the sun on the line crossing -> portalSeat so the portal eclipses it.
//          foreEnd        where the world's long truss / solar wings should join the fore stub (z +150)
//          shuttle        centre of the docked shuttle;  gardenLook  a point on the rim skylights to look at
//          gantry         { position, radius }: the approach gate, a 17 m lattice hoop on the flight line at z -228 to -261
//                         (moved clear of a solar wing by seed); flyThrough threads its centre
//          viewpoints     [{ position, target }] composed stills
// LIGHTING Self-lit custom shader: it does NOT read scene lights. Sun and earthshine are uniforms (setSun,
//          setEarthshine, setSunrise). Sun colour default 1.3 (sunlit white hull sits just under bloom), windows emit
//          1-4, beacons 4.5-7. The camera mostly sees the wheel BACKLIT (sun dead ahead): then it reads as cool
//          earthshine + windows, with rails, cables, truss and bevels catching a gold-to-white silver lining, and
//          the solar blankets glowing amber. Scene fog is honoured. Wants a black sky and bloom (threshold ~0.9).
// COST     ~75k triangles (52-76k by seed, drawn twice: depth pre-pass), 5 draw calls (2 hulls x 2, beacons), 3 programs,
//          ~180 ms build in steps of a few ms (the rim, the spokes and both geometries pause as they go), no lights, no textures, nothing to dispose beyond what hangs off `object`.
//          hero.material is an ARRAY of three ShaderMaterials sharing one uniforms object (plain hull, foil, windows:
//          the triangles are grouped by class so no pixel pays for another class's shading); every hull mesh also has a
//          depth pre-pass child (hero.addPrepass). uMoonDir / uMoonCol add a faint night key (black by default).
//          hero.uniforms exposes the hull uniforms (uWin = window brightness, uFill = sunlit bounce on shadow sides,
//          uPen = half-width in metres of the red/gold shadow edge). object.userData.hero is the hero itself.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#000003', '#0a1a44', '#3fa0ff', '#ffe9c4', '#c8ccd4', '#1a1d24', '#ffb040'];
const TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const NSPOKE = 8, R_OUT = 300;

// material codes (aData.x)
const M_PAINT = 0, M_FOIL = 1, M_METAL = 2, M_ROOMS = 3, M_GALLERY = 4, M_SOLAR = 5, M_GLOW = 6, M_SKYLIGHT = 7, M_BLACK = 8, M_RADIATOR = 9, M_RAIL = 10, M_EDGE = 11;

// ---------------------------------------------------------------- geometry accumulator
class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.U = []; this.D = []; this.I = []; this.n = 0; this.m = new THREE.Matrix4(); this.rnd = 0; this.stack = []; }
  push(m) { this.stack.push(this.m.clone()); this.m.multiply(m); return this; }
  pop() { this.m.copy(this.stack.pop()); return this; }
  v(x, y, z, nx, ny, nz, u, w, st, fl = 0) {
    const e = this.m.elements;
    this.P.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const ax = e[0] * nx + e[4] * ny + e[8] * nz, ay = e[1] * nx + e[5] * ny + e[9] * nz, az = e[2] * nx + e[6] * ny + e[10] * nz;
    const l = Math.hypot(ax, ay, az) || 1;
    this.N.push(ax / l, ay / l, az / l);
    this.C.push(st.c[0], st.c[1], st.c[2]); this.U.push(u, w); this.D.push(st.m, this.rnd, st.e || 0, fl);
    return this.n++;
  }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.I.push(a, b, c); }
  get tris() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(this.D, 4));
    // triangles sorted into three material classes (plain, foil, windows): one group and one lean shader program each,
    // so a pixel of bare hull never pays for the foil crinkle or the garden parallax
    const parts = [[], [], []], I = this.I, D = this.D;
    for (let i = 0; i < I.length; i += 3) { const m = D[I[i] * 4], k = m === M_FOIL ? 1 : (m === M_ROOMS || m === M_GALLERY || m === M_SKYLIGHT) ? 2 : 0; parts[k].push(I[i], I[i + 1], I[i + 2]); }
    const sorted = parts[0].concat(parts[1], parts[2]);
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(sorted, 1) : new THREE.Uint16BufferAttribute(sorted, 1));
    let start = 0; parts.forEach((q, k) => { if (q.length) g.addGroup(start, q.length, k); start += q.length; });
    g.computeBoundingSphere();
    return g;
  }
  // the same geometry, built in steps with a pause between them (a big hull is too long a stall in one go)
  async buildAsync(pause) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    await pause();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(this.D, 4));
    await pause();
    const parts = [[], [], []], I = this.I, D = this.D;
    for (let i = 0; i < I.length; i += 3) { const m = D[I[i] * 4], k = m === M_FOIL ? 1 : (m === M_ROOMS || m === M_GALLERY || m === M_SKYLIGHT) ? 2 : 0; parts[k].push(I[i], I[i + 1], I[i + 2]); }
    await pause();
    const sorted = parts[0].concat(parts[1], parts[2]);
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(sorted, 1) : new THREE.Uint16BufferAttribute(sorted, 1));
    let start = 0; parts.forEach((q, k) => { if (q.length) g.addGroup(start, q.length, k); start += q.length; });
    await pause();
    g.computeBoundingSphere();
    return g;
  }
}

// style helper: material code, linear colour, emissive strength
const sty = (m, col, e = 0, k = 1) => ({ m, c: [col.r * k, col.g * k, col.b * k], e });

// Revolve a profile of [r, z] points about the local Z axis. Each profile edge is faceted (own vertices), smooth around.
// List the points so that walking in +z the surface normal points to +r (outside). sty: one style or one per edge.
function lathe(g, pts, st, o = {}) {
  const closed = !!o.closed, a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU, n = Math.max(2, o.n ?? 48);
  const ne = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < ne; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], s = Array.isArray(st) ? st[i % st.length] : st;
    if (!s) continue;
    const dr = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dr, dz); if (len < 1e-5) continue;
    const nr = dz / len, nz = -dr / len, rm = o.uR ?? Math.max(p[0], q[0]);
    let pa = -1, pb = -1;
    for (let k = 0; k <= n; k++) {
      const a = a0 + (a1 - a0) * (k / n), c = Math.cos(a), sn = Math.sin(a), u = a * rm;
      const va = g.v(p[0] * c, p[0] * sn, p[1], nr * c, nr * sn, nz, u, 0, s, len);
      const vb = g.v(q[0] * c, q[0] * sn, q[1], nr * c, nr * sn, nz, u, len, s, len);
      if (k > 0) g.quad(pa, va, vb, pb);
      pa = va; pb = vb;
    }
  }
  if (closed && o.caps) {
    let cr = 0, cz = 0; for (const p of pts) { cr += p[0]; cz += p[1]; } cr /= pts.length; cz /= pts.length;
    for (const [a, sg] of [[a0, -1], [a1, 1]]) {
      const c = Math.cos(a), sn = Math.sin(a), nx = -sn * sg, ny = c * sg;
      const vc = g.v(cr * c, cr * sn, cz, nx, ny, 0, 0, 0, o.caps, 8);
      const ring = pts.map((p) => g.v(p[0] * c, p[0] * sn, p[1], nx, ny, 0, p[1], p[0] - cr, o.caps, 8));
      for (let i = 0; i < ring.length; i++) g.tri(vc, ring[i], ring[(i + 1) % ring.length]);
    }
  }
}

const _fa = new THREE.Vector3(), _fb = new THREE.Vector3(), _fd = new THREE.Vector3();
function frame(A, B) {
  _fd.subVectors(B, A); const L = _fd.length(); _fd.multiplyScalar(1 / (L || 1));
  _fa.set(0, 0, 1); if (Math.abs(_fd.z) > 0.9) _fa.set(1, 0, 0);
  _fa.addScaledVector(_fd, -_fa.dot(_fd)).normalize(); _fb.crossVectors(_fd, _fa);
  return { L, d: _fd.clone(), u: _fa.clone(), w: _fb.clone() };
}

// Tapered tube between two points (smooth around). o.cap closes both ends.
function tube(g, A, B, rA, rB, sides, st, o = {}) {
  const f = frame(A, B), ra = [], rb = [];
  for (let k = 0; k <= sides; k++) {
    const a = (k / sides) * TAU + (o.rot || 0), c = Math.cos(a), s = Math.sin(a);
    const nx = f.u.x * c + f.w.x * s, ny = f.u.y * c + f.w.y * s, nz = f.u.z * c + f.w.z * s;
    ra.push(g.v(A.x + nx * rA, A.y + ny * rA, A.z + nz * rA, nx, ny, nz, a * rA, 0, st, f.L));
    rb.push(g.v(B.x + nx * rB, B.y + ny * rB, B.z + nz * rB, nx, ny, nz, a * rA, f.L, st, f.L));
    if (k > 0) g.quad(ra[k - 1], ra[k], rb[k], rb[k - 1]);
  }
  if (o.cap) for (const [P, r, sg] of [[A, rA, -1], [B, rB, 1]]) {
    const vc = g.v(P.x, P.y, P.z, f.d.x * sg, f.d.y * sg, f.d.z * sg, 0, 0, st, 2 * r); let prev = -1;
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * TAU + (o.rot || 0), c = Math.cos(a), s = Math.sin(a);
      const vv = g.v(P.x + (f.u.x * c + f.w.x * s) * r, P.y + (f.u.y * c + f.w.y * s) * r, P.z + (f.u.z * c + f.w.z * s) * r, f.d.x * sg, f.d.y * sg, f.d.z * sg, c * r, s * r, st, 2 * r);
      if (k > 0) g.tri(vc, prev, vv); prev = vv;
    }
  }
}

// Square lattice truss between two points: 4 chords, battens and alternating diagonals per bay.
function truss(g, A, B, w, bay, st, cr = 0.5, o = {}) {
  const f = frame(A, B), nb = Math.max(1, Math.round(f.L / bay)), h = w / 2;
  if (o.roll) { const c = Math.cos(o.roll), s = Math.sin(o.roll), u = f.u.clone(), v = f.w.clone(); f.u.copy(u).multiplyScalar(c).addScaledVector(v, s); f.w.copy(v).multiplyScalar(c).addScaledVector(u, -s); }
  const corner = (i, t) => { const su = i === 0 || i === 3 ? -1 : 1, sw = i < 2 ? -1 : 1; return V3().copy(A).addScaledVector(f.d, t * f.L).addScaledVector(f.u, su * h).addScaledVector(f.w, sw * h); };
  for (let i = 0; i < 4; i++) tube(g, corner(i, 0), corner(i, 1), cr, cr, 4, st);
  for (let b = 0; b <= nb; b++) {
    const t = b / nb;
    for (let i = 0; i < 4; i++) {
      tube(g, corner(i, t), corner((i + 1) % 4, t), cr * 0.62, cr * 0.62, 3, st);
      if (b < nb) { const fl = (b + i) % 2; tube(g, corner(fl ? i : (i + 1) % 4, t), corner(fl ? (i + 1) % 4 : i, (b + 1) / nb), cr * 0.55, cr * 0.55, 3, st); }
    }
  }
}

// Chamfered box in the current transform. h = half sizes, b = chamfer.
function cbox(g, cx, cy, cz, hx, hy, hz, b, st) {
  const c = [cx, cy, cz], h = [hx, hy, hz];
  b = Math.min(b, hx * 0.45, hy * 0.45, hz * 0.45);
  const P = (a, sa, u, su, w, sw, ia, iu, iw) => { const p = [0, 0, 0]; p[a] = c[a] + sa * (h[a] - ia * b); p[u] = c[u] + su * (h[u] - iu * b); p[w] = c[w] + sw * (h[w] - iw * b); return p; };
  for (let a = 0; a < 3; a++) {
    const u = (a + 1) % 3, w = (a + 2) % 3;
    for (const sa of [-1, 1]) {
      const n = [0, 0, 0]; n[a] = sa; const ids = [];
      for (const [su, sw] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = P(a, sa, u, su, w, sw, 0, 1, 1); ids.push(g.v(p[0], p[1], p[2], n[0], n[1], n[2], p[u] - c[u] + h[u], p[w] - c[w] + h[w], st, 2 * h[w])); }
      g.quad(ids[0], ids[1], ids[2], ids[3]);
      for (const su of [-1, 1]) { // chamfer between face (a,sa) and face (u,su), running along w
        const m = [0, 0, 0]; m[a] = sa * 0.7071; m[u] = su * 0.7071; const q = [];
        for (const [ia, iu, sw] of [[0, 1, -1], [0, 1, 1], [1, 0, 1], [1, 0, -1]]) { const p = P(a, sa, u, su, w, sw, ia, iu, 1); q.push(g.v(p[0], p[1], p[2], m[0], m[1], m[2], p[w] - c[w] + h[w], ia * b * 1.4, st, 2 * h[w])); }
        g.quad(q[0], q[1], q[2], q[3]);
      }
    }
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const k = 0.5774, t = [];
    for (let a = 0; a < 3; a++) { const p = P(0, sx, 1, sy, 2, sz, a === 0 ? 0 : 1, a === 1 ? 0 : 1, a === 2 ? 0 : 1); t.push(g.v(p[0], p[1], p[2], sx * k, sy * k, sz * k, 0, 0, st, 1)); }
    g.tri(t[0], t[1], t[2]);
  }
}

// Thin double-sided panel: origin corner P0 and two edge vectors.
function plate(g, P0, eu, ev, st) {
  const n = V3().crossVectors(eu, ev).normalize(), lu = eu.length(), lv = ev.length();
  const a = g.v(P0.x, P0.y, P0.z, n.x, n.y, n.z, 0, 0, st, lv);
  const b = g.v(P0.x + eu.x, P0.y + eu.y, P0.z + eu.z, n.x, n.y, n.z, lu, 0, st, lv);
  const c = g.v(P0.x + eu.x + ev.x, P0.y + eu.y + ev.y, P0.z + eu.z + ev.z, n.x, n.y, n.z, lu, lv, st, lv);
  const d = g.v(P0.x + ev.x, P0.y + ev.y, P0.z + ev.z, n.x, n.y, n.z, 0, lv, st, lv);
  g.quad(a, b, c, d);
}

// capsule / tank along local Z of the current transform (rounded ends), from z0 to z1
function capsule(g, r, z0, z1, st, n = 16, round = 0.6) {
  const pts = [[0.001, z0]], k = r * round;
  for (let i = 1; i <= 4; i++) { const a = (i / 4) * Math.PI * 0.5; pts.push([r * Math.sin(a) * 1.0, z0 + k - k * Math.cos(a)]); }
  for (let i = 3; i >= 0; i--) { const a = (i / 4) * Math.PI * 0.5; pts.push([Math.max(0.001, r * Math.sin(a)), z1 - k + k * Math.cos(a)]); }
  lathe(g, pts, st, { n });
}

// ---------------------------------------------------------------- shaders
const HULL_VERT = /* glsl */`
attribute vec4 aData;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vUv; varying vec4 vD;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color; vUv = uv; vD = aData;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const HULL_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uEarthCol; uniform vec3 uUp;
uniform vec3 uWarm; uniform vec3 uGreen; uniform vec3 uCool;
uniform vec4 uShadow; uniform float uPen; uniform float uTime; uniform float uWin; uniform float uFill;
uniform vec3 uMoonDir; uniform vec3 uMoonCol;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vUv; varying vec4 vD;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { return vn(p) * 0.55 + vn(p * 2.13 + 7.1) * 0.3 + vn(p * 4.7 + 3.3) * 0.15; }
// 1 on panels, 0 in the seams between cells of this size (metres); fades out when the cells get small on screen
float seam(vec2 uv, vec2 cell) {
  vec2 q = uv / cell; vec2 f = abs(fract(q) - 0.5); vec2 w = fwidth(q);
  float d = min((0.5 - f.x) * cell.x, (0.5 - f.y) * cell.y);
  float fade = 1.0 - smoothstep(0.1, 0.4, max(w.x, w.y));
  return mix(1.0, smoothstep(0.02, 0.12, d), fade);
}
void main() {
  int m = int(vD.x + 0.5); float rnd = vD.y; float L = max(vD.w, 0.001);
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  if ((m == 5 || m == 9) && dot(N, V) < 0.0) N = -N;
  vec2 uv = vUv; if (vD.z < 0.0) uv.y = L - uv.y;
  vec3 alb = vC; vec3 emis = vec3(0.0); float shin = 20.0; float specK = 0.12; float metal = 0.0; float trans = 0.0; float rail = 0.0; vec3 tcol = vec3(1.0, 0.75, 0.5);
  // tangent frame from derivatives (for foil crinkle and window parallax)
#if CLS != 0
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); vec2 dux = dFdx(vUv), duy = dFdy(vUv);
#endif
#if CLS != 0
  vec3 T = normalize(dpx * duy.y - dpy * dux.y + vec3(1e-7, 0.0, 0.0));
  vec3 B = normalize(dpy * dux.x - dpx * duy.x + vec3(0.0, 1e-7, 0.0));
  if (vD.z < 0.0) B = -B;
  vec3 Vt = vec3(dot(V, T), dot(V, B), max(dot(V, N), 0.22));
#endif
  if (m == 0 || m == 11) {                        // painted hull panels (11: bevels that catch the backlight)
#if CLS == 0
    vec2 cell = vec2(7.0, 4.4); vec2 id = floor(uv / cell) + floor(rnd * 97.0);
    float pr = h21(id);
    alb *= 0.8 + 0.28 * pr; alb *= mix(0.8, 1.06, fbm(uv * 0.09 + rnd * 9.0));
    alb *= mix(0.45, 1.0, seam(uv, cell)); alb *= mix(0.8, 1.0, seam(uv + 1.3, cell * vec2(0.25, 0.5)));
    if (pr > 0.93) alb *= 0.45;
    if (m == 11) rail = 0.5;
#endif
  } else if (m == 1) {                            // gold foil blankets
#if CLS == 1
    vec2 q = uv * 0.8 + rnd * 31.0; float e = 0.2; float n0 = fbm(q);
    vec2 gr = vec2(fbm(q + vec2(e, 0.0)) - n0, fbm(q + vec2(0.0, e)) - n0) / e;
    N = normalize(N + (T * gr.x + B * gr.y) * 0.5);
    alb *= 0.8 + 0.4 * n0; alb *= mix(0.6, 1.0, seam(uv, vec2(3.2, 3.2)));
    metal = 1.0; shin = 36.0; specK = 1.5;
#endif
  } else if (m == 2) {                            // bare metal, truss
#if CLS == 0
    alb *= 0.8 + 0.4 * vn(uv * 0.6 + rnd * 5.0); metal = 0.6; shin = 28.0; specK = 0.5;
#endif
  } else if (m == 3) {                            // rows of room windows
#if CLS == 2
    vec2 cs = vec2(2.6, 3.3); float rows = max(1.0, floor((L - 1.2) / cs.y)); float y0 = (L - rows * cs.y) * 0.5;
    vec2 q = vec2(uv.x / cs.x, (uv.y - y0) / cs.y); vec2 id = floor(q), f = fract(q);
    float inRow = step(0.0, q.y) * step(q.y, rows) * (rows > 3.5 ? step(0.5, mod(id.y, 2.0)) : 1.0);
    vec2 w = fwidth(q); float far = smoothstep(0.3, 1.0, max(w.x, w.y));
    float win = smoothstep(0.15, 0.2, f.x) * (1.0 - smoothstep(0.8, 0.85, f.x)) * smoothstep(0.25, 0.31, f.y) * (1.0 - smoothstep(0.7, 0.76, f.y)) * inRow;
    float blk = step(0.2, h21(vec2(floor(id.x / 6.0), id.y) + rnd * 41.0));
    float on = step(0.4, h21(id + rnd * 71.0)) * blk;
    vec3 wc = mix(uWarm, uCool, step(0.86, h21(id + 3.7))) * (1.3 + 2.7 * h21(id + 9.1));
    emis = mix(win * on * wc, uWarm * 0.42 * inRow * blk, far) * uWin;
    alb *= mix(1.0, 0.2, win * (1.0 - far)); alb *= mix(0.5, 1.0, seam(uv, vec2(cs.x * 6.0, L)));
#endif
  } else if (m == 4) {                            // garden gallery: tall windows, trees inside (parallax)
#if CLS == 2
    float mx = abs(fract(uv.x / 8.0 + 0.5) - 0.5) * 8.0;
    float gh = min(L - 2.0, 8.5), g0 = (L - gh) * 0.5;
    float glass = smoothstep(0.22, 0.38, mx) * smoothstep(g0, g0 + 0.2, uv.y) * (1.0 - smoothstep(g0 + gh - 0.2, g0 + gh, uv.y));
    vec2 p = uv - Vt.xy / Vt.z * 5.0;
    float hg = clamp((p.y - g0 + 1.0) / (gh + 1.0), 0.0, 1.0);
    float cl = 0.36 + 0.36 * vn(vec2(p.x * 0.17, rnd * 9.0)) + 0.12 * vn(vec2(p.x * 0.8, 3.0 + rnd));
    float tree = 1.0 - smoothstep(cl - 0.03, cl + 0.03, hg + 0.07 * vn(p * 1.1));
    float tr = step(abs(fract(p.x / 5.5 + 0.3 * h21(vec2(floor(p.x / 5.5), rnd))) - 0.5), 0.03) * step(hg, cl);
    vec2 pb = uv - Vt.xy / Vt.z * 13.0;
    float nearK = 1.0 - smoothstep(70.0, 150.0, length(cameraPosition - vW));      // close up the planting carries the light, not the lamps
    vec3 back = uWarm * mix(0.45, 1.5, hg) * (0.8 + 0.4 * vn(pb * vec2(0.25, 0.6))) * (1.0 - 0.5 * nearK);
    back += uWarm * 2.2 * pow(max(0.0, 1.0 - abs(fract(pb.x / 6.0) - 0.5) * 6.0), 3.0) * smoothstep(0.75, 0.95, hg);
    vec3 fol = mix(uGreen, vec3(0.2, 0.62, 0.1), 0.6 * nearK) * (0.15 + 1.1 * fbm(p * 0.7 + rnd * 3.0)) * (0.4 + 0.9 * hg) * (1.0 + 1.5 * nearK);
    vec3 inside = mix(back, fol, max(tree, tr * 0.85));
    emis = inside * glass * uWin; alb *= 1.0 - 0.8 * glass;
#endif
  } else if (m == 7) {                            // garden skylights: the garden seen from above
#if CLS == 2
    float hh = L * 0.5;
    float mx = abs(fract(uv.x / 6.0 + 0.5) - 0.5) * 6.0; float my = abs(fract(uv.y / hh + 0.5) - 0.5) * hh;
    float glass = smoothstep(0.18, 0.34, mx) * smoothstep(0.18, 0.34, my);
    vec2 p = uv - Vt.xy / Vt.z * 7.0;
    vec2 tc = p / 7.0; vec2 ti = floor(tc); vec2 tf = fract(tc) - 0.5;
    vec2 jit = vec2(h21(ti + rnd), h21(ti + 7.7 + rnd)) - 0.5;
    float td = length(tf - jit * 0.45); float rad = 0.24 + 0.2 * h21(ti + 3.3);
    float tree = (1.0 - smoothstep(rad - 0.07, rad, td + 0.05 * vn(p * 1.3))) * step(0.28, h21(ti + 5.1 + rnd));
    float shade = clamp(1.0 - td / rad, 0.0, 1.0);
    float nearK = 1.0 - smoothstep(70.0, 150.0, length(cameraPosition - vW));
    vec3 grn = mix(uGreen, vec3(0.2, 0.62, 0.1), 0.6 * nearK) * (1.0 + 0.9 * nearK);
    vec3 lawn = grn * vec3(0.55, 0.7, 0.4) * (0.22 + 0.3 * vn(p * 0.5));
    vec3 treeC = grn * (0.3 + 1.25 * shade * shade) * (0.7 + 0.6 * vn(p * 1.6 + 4.0));
    float pth = 1.0 - smoothstep(0.3, 1.1, abs(p.y - hh - sin(p.x * 0.07 + rnd * 6.0) * L * 0.24));
    vec2 lc = (fract(vec2(p.x / 11.0, p.y / hh)) - 0.5) * vec2(11.0, hh);
    float lamp = pow(max(0.0, 1.0 - length(lc) / 2.2), 2.0);
    vec3 inside = mix(lawn + uWarm * 1.5 * pth * (1.0 - 0.4 * nearK), treeC, tree) + uWarm * 3.0 * lamp * (1.0 - 0.45 * nearK);
    emis = inside * glass * uWin * 0.85; alb *= 1.0 - 0.8 * glass;
#endif
  } else if (m == 5) {                            // solar cells
#if CLS == 0
    vec2 q = uv / 1.5; vec2 f = abs(fract(q) - 0.5); vec2 w = fwidth(q);
    float fade = 1.0 - smoothstep(0.12, 0.45, max(w.x, w.y));
    float line = mix(1.0, smoothstep(0.0, 0.07, 0.5 - max(f.x, f.y)), fade);
    alb = mix(vec3(0.3, 0.33, 0.38), vC * (0.7 + 0.6 * h21(floor(q) + rnd)), line);
    alb *= mix(0.4, 1.0, seam(uv, vec2(9.0, L))) * 0.6;
    shin = 70.0; specK = 1.4; trans = 0.3;
    tcol = vec3(1.0, 0.36, 0.05) * (0.12 + 0.88 * line) * (0.5 + 0.6 * h21(floor(q) + rnd + 2.0));
    // by night: each cell is a dark glassy tile (its own shade, brighter toward grazing angles where it mirrors the
    // glow of the air and the moonlit sky), with the grid between them only a little lighter
    float cr5 = h21(floor(q) + rnd + 5.0), fr5 = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    float pan5 = mix(0.35, 1.0, seam(uv, vec2(9.0, L)));
    emis = (uMoonCol * (0.36 * (1.0 - line) + line * (0.07 + 0.3 * cr5 + 0.55 * fr5)) + uEarthCol * line * (0.04 + 0.16 * fr5) * (0.5 + cr5)) * pan5;
    // the back of a sunlit blanket (what a camera flying into the sun sees): dark kapton, the cell grid as darker lines,
    // a low even amber glow through it instead of the bright orange checker
    float bk5 = smoothstep(0.0, 0.25, -dot(N, uSunDir)) * smoothstep(-uPen, uPen, dot(vW, uShadow.xyz) - uShadow.w);
    alb = mix(alb, vec3(0.2, 0.087, 0.012) * (0.35 + 0.65 * line) * (0.85 + 0.3 * cr5) * pan5, bk5);
    tcol = mix(tcol, vec3(1.0, 0.5, 0.1) * (0.25 + 0.75 * line) * (0.85 + 0.15 * cr5) * pan5, bk5);
    trans = mix(0.3, 0.17, bk5); specK = mix(1.4, 0.3, bk5); emis *= 1.0 - 0.85 * bk5;
#endif
  } else if (m == 9) {                            // radiator panels
#if CLS == 0
    alb *= 0.86 + 0.14 * step(0.5, fract(uv.x / 1.1)); alb *= mix(0.5, 1.0, seam(uv, vec2(5.5, L)));
    shin = 14.0; specK = 0.25; trans = 0.1;
#endif
  } else if (m == 10) {                           // rails, cables: thin round members that catch a silver lining
#if CLS == 0
    alb *= 0.85; rail = 1.0; specK = 0.3;
#endif
  } else if (m == 6) {                            // light strips
#if CLS == 0
    emis = vC * abs(vD.z); alb = vec3(0.02);
#endif
  } else {                                        // black thermal tiles
#if CLS == 0
    alb *= 0.6 + 0.6 * h21(floor(uv / 1.4) + rnd); shin = 50.0; specK = 0.45;
#endif
  }
  // sunrise: the Earth's shadow edge is a plane sweeping down; just above it the light is red, then gold, then white
  float hgt = dot(vW, uShadow.xyz) - uShadow.w;
  float lit = smoothstep(-uPen, uPen, hgt);
  vec3 tint = mix(vec3(1.0, 0.1, 0.02), vec3(1.0, 0.52, 0.16), smoothstep(-uPen, uPen * 1.4, hgt));
  tint = mix(tint, vec3(1.0), smoothstep(uPen * 2.5, uPen * 9.0, hgt));
  vec3 sunC = uSunCol * tint * lit;
  float ndl = dot(N, uSunDir);
  float wr = max((ndl + 0.3) / 1.3, 0.0);
  float diff = mix(max(ndl, 0.0), wr * wr, 0.3);
  vec3 H = normalize(uSunDir + V);
  float fr = pow(1.0 - max(dot(V, H), 0.0), 5.0);
  float sp = pow(max(dot(N, H), 0.0), shin) * specK * mix(1.0, 5.0, fr) * smoothstep(-0.08, 0.08, ndl);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float back = max(dot(-V, uSunDir), 0.0);
  float rim = fres * (0.12 + 1.5 * back * back) * smoothstep(-0.7, 0.12, ndl);
  vec3 specCol = mix(vec3(1.0), alb * 1.6, metal);
  vec3 earth = uEarthCol * (0.3 + 0.7 * pow(max(0.5 - 0.5 * dot(N, uUp), 0.0), 1.5));
  vec3 fillC = uSunCol * lit * mix(tint, vec3(1.0, 0.68, 0.36), 0.6) * uFill * (1.0 - diff);
  vec3 col = alb * (1.0 - 0.6 * metal) * (sunC * diff + fillC + earth);
  col += sunC * specCol * (sp + rim * (0.22 + 0.5 * metal)) + earth * specCol * fres * (0.4 + metal);
  col += trans * sunC * max(-ndl, 0.0) * tcol * (0.7 + 0.5 * back);
  // moonlight (off by default): a faint second key so the night side of the hull is not a hole in the stars
  float ndm = dot(N, uMoonDir);
  col += uMoonCol * (alb * (1.0 - 0.6 * metal) * max(ndm, 0.0) + specCol * pow(max(dot(N, normalize(uMoonDir + V)), 0.0), shin) * specK * 0.8 * step(0.0, ndm));
  rail *= mix(0.12, 1.0, smoothstep(140.0, 480.0, length(cameraPosition - vW)));
  col += rail * sunC * (0.06 + 1.25 * back * back) * mix(tint, vec3(1.0, 0.8, 0.55), 0.5);
  col += emis;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const BEACON_VERT = /* glsl */`
attribute vec4 aB;   // size (m), phase, blink rate (0 = steady), rotates with the wheel
uniform float uTime; uniform float uAngle; uniform float uPx;
varying vec3 vC; varying float vI;
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  if (aB.w > 0.5) { float c = cos(uAngle), s = sin(uAngle); p.xy = mat2(c, s, -s, c) * p.xy; }
  float b = aB.z > 0.0 ? pow(max(0.0, sin(uTime * aB.z + aB.y)), 16.0) + 0.6 * pow(max(0.0, sin(uTime * aB.z + aB.y - 0.55)), 30.0) : 0.75 + 0.25 * sin(uTime * 1.7 + aB.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float px = aB.x * uPx / max(-mvPosition.z, 1.0);
  gl_PointSize = clamp(px, 3.0, 72.0);
  vI = b * clamp(px / 3.0, 0.35, 1.0); vC = color;
  #include <fog_vertex>
}`;
const BEACON_FRAG = /* glsl */`
varying vec3 vC; varying float vI;
#include <fog_pars_fragment>
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.3, r); float halo = pow(max(0.0, 1.0 - r), 3.0);
  vec3 col = vC * (core + halo * 0.3) * vI;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- the rotating wheel (hub at origin, axis Z)
const rotZ = (a) => new THREE.Matrix4().makeRotationZ(a);
// maps lathe/capsule space (axis = z) so that the axis runs along local +X (radial, after a rotZ)
const AXIS_X = new THREE.Matrix4().makeBasis(V3(0, 1, 0), V3(0, 0, 1), V3(1, 0, 0));
const AXIS_Y = new THREE.Matrix4().makeBasis(V3(0, 0, 1), V3(1, 0, 0), V3(0, 1, 0));

async function buildRim(g, S, beacons, pause) {
  const { rng, C, W, ro, ri, rs, rw, perGap } = S;
  const nMod = NSPOKE * perGap, arc = TAU / nMod, gapA = 2.6 / ro, seg = Math.round(384 / nMod);
  const prof = [[ro, -(W - 3)], [ro, W - 3], [ro - 3.5, W], [ri + rs, W], [ri, W - rw], [ri, -(W - rw)], [ri + rs, -W], [ro - 3.5, -W]];
  const rc = (ro + ri) / 2, small = prof.map(([r, z]) => [rc + (r - rc) * 0.8, z * 0.8]);
  const lobes = S.gardenLobes, goff = rng() * TAU;
  for (let i = 0; i < nMod; i++) {
    if (i % 3 === 0 && i > 0) await pause();
    const a0 = i * arc + gapA, a1 = (i + 1) * arc - gapA;   // module boundaries sit on the spoke lines (i % perGap == 0)
    g.rnd = rng();
    const sector = Math.sin(((i + 0.5) / nMod) * TAU * lobes + goff) > -0.3, garden = sector && (i % 2 === 0 || rng.chance(0.3));
    const tone = 0.9 + 0.16 * rng(), paint = sty(M_PAINT, C.white, 0, tone), dark = sty(M_PAINT, C.white, 0, 0.5 * tone);
    const side = (flip) => sty(garden ? M_GALLERY : M_ROOMS, C.white, flip ? -1 : 1, tone * (garden ? 0.75 : 1));
    const roof = (flip) => (sector ? sty(M_SKYLIGHT, C.white, flip ? -1 : 1, 0.7 * tone) : sty(M_ROOMS, C.white, flip ? -1 : 1, 0.8 * tone));
    const floor = rng.chance(0.3) ? sty(M_FOIL, C.gold, 0, 0.9) : sty(M_BLACK, C.dark, 0, 1.2);
    const edge = sty(M_EDGE, C.white, 0, tone), hoop = rng.chance(0.5) ? sty(M_FOIL, C.gold, 0, 0.9) : dark;
    lathe(g, prof, [floor, edge, side(false), roof(false), dark, roof(true), side(true), edge], { closed: true, a0, a1, n: seg, caps: dark });
    lathe(g, small, sty(M_METAL, C.metal, 0, 1.1), { closed: true, a0: a1, a1: a1 + 2 * gapA, n: 1 });
    // conduit rails along the section's corners: thin round members that light up as a gold outline when backlit
    for (const [rr, zz] of [[ro + 0.3, W - 2.5], [ro - 3.3, W + 0.4], [ri + rs + 0.2, W + 0.4]]) for (const sg of [-1, 1]) {
      const z = sg * zz; lathe(g, [[rr + 0.6, z], [rr, z + 0.6], [rr - 0.6, z], [rr, z - 0.6]], sty(M_RAIL, C.white, 0, 0.9), { closed: true, a0: a0 + 0.003, a1: a1 - 0.003, n: seg });
    }
    // structural hoops
    for (let k = 1, nh = perGap === 2 ? 3 : 2; k <= nh; k++) {
      const ah = lerp(a0, a1, k / (nh + 1)), big = prof.map(([r, z]) => [rc + (r - rc) * 1.05, z * 1.045]);
      lathe(g, big, hoop, { closed: true, a0: ah - 0.45 / ro, a1: ah + 0.45 / ro, n: 1, caps: hoop });
    }
    // spine dressing: equipment boxes, tanks and the odd mast on the hub-facing roof
    const am = (a0 + a1) / 2;
    for (let k = 0, nk = rng.int(1, 3); k < nk; k++) {
      const a = lerp(a0, a1, rng.range(0.12, 0.88));
      g.push(rotZ(a)); g.rnd = rng();
      const hx = rng.range(0.9, 1.8), hy = rng.range(2, 5), hz = rng.range(1.5, 3.2), z = rng.range(-1, 1) * (W - rw - hz - 0.5);
      cbox(g, ri - hx + 0.2, 0, z, hx, hy, hz, 0.35, rng.chance(0.45) ? sty(M_FOIL, C.gold) : sty(M_PAINT, C.white, 0, rng.range(0.55, 1)));
      g.pop();
    }
    if (rng.chance(0.3)) {
      g.push(rotZ(am)); const z = rng.sign() * (W - rw - 1.2), hgt = rng.range(9, 16);
      tube(g, V3(ri, 0, z), V3(ri - hgt, 0, z), 0.35, 0.12, 5, sty(M_METAL, C.metal, 0, 1.3));
      tube(g, V3(ri - hgt * 0.6, -1.6, z), V3(ri - hgt * 0.6, 1.6, z), 0.1, 0.1, 3, sty(M_METAL, C.metal, 0, 1.3));
      g.pop();
      beacons.push({ p: V3(Math.cos(am) * (ri - hgt), Math.sin(am) * (ri - hgt), z), c: C.red, s: 3.2, ph: rng() * TAU, rate: 2.1, rot: 1 });
    }
    // running lights on the outer bevels at every module joint
    for (const sg of [-1, 1]) beacons.push({ p: V3(Math.cos(a0) * (ro - 1), Math.sin(a0) * (ro - 1), sg * (W + 0.3)), c: i % perGap === 0 ? C.amber : C.warm, s: i % perGap === 0 ? 3.4 : 2.2, ph: i * 0.7, rate: 0, rot: 1 });
  }
  g.rnd = rng();
  // meteor shield tread around the outside, spine light strip, service pipes, inner bracing ring
  lathe(g, [[ro + 0.1, -(W - 4.5)], [R_OUT, -(W - 6.5)], [R_OUT, W - 6.5], [ro + 0.1, W - 4.5]], [sty(M_METAL, C.metal), sty(M_BLACK, C.dark, 0, 1.5), sty(M_METAL, C.metal)], { n: 192 });
  lathe(g, [[ri - 0.05, 0.45], [ri - 0.5, 0.3], [ri - 0.5, -0.3], [ri - 0.05, -0.45]], sty(M_GLOW, C.warm, 2.2), { n: 192 });
  for (const sg of [-1, 1]) {
    const z = sg * (W - rw - 0.9), r = ri - 0.8;
    lathe(g, [[r + 0.7, z], [r, z + 0.7], [r - 0.7, z], [r, z - 0.7]], sty(M_METAL, C.metal, 0, 1.4), { closed: true, n: 192 });
  }
  const rb = S.rBrace;
  lathe(g, [[rb + 1.5, 0], [rb, 1.5], [rb - 1.5, 0], [rb, -1.5]], sty(M_METAL, C.metal, 0, 1.5), { closed: true, n: 160 });      // metal: shaded, with a gold lining when backlit
}

async function buildSpokes(g, S, beacons, pause) {
  const { rng, C, ri, hubR, rBrace: rb } = S;
  const metal = sty(M_METAL, C.metal, 0, 1.25), paint = sty(M_PAINT, C.white), foil = sty(M_FOIL, C.gold);
  for (let k = 0; k < NSPOKE; k++) {
    if (k % 2 === 0 && k > 0) await pause();
    const a = (k / NSPOKE) * TAU;
    g.push(rotZ(a)); g.rnd = rng();
    // elevator tube with collars, flared at the hub and at the rim
    const r0 = hubR - 1.5, r1 = ri + 1, tr = 3.3, pts = [[8.5, r0], [6.2, r0 + 5], [tr, r0 + 17]], st = [paint, paint];
    for (let x = r0 + 40; x < r1 - 26; x += 29) { pts.push([tr, x], [tr + 0.8, x + 0.5], [tr + 0.8, x + 2.1], [tr, x + 2.6]); st.push(paint, metal, sty(M_PAINT, C.accent, 0, 0.9), metal); }
    pts.push([tr, r1 - 15], [5.6, r1 - 5], [7.5, r1]); st.push(paint, paint, sty(M_PAINT, C.white, 0, 0.6));
    g.push(AXIS_X); lathe(g, pts, st, { n: 14 }); g.pop();
    truss(g, V3(r0 + 8, 0, 0), V3(r1 - 6, 0, 0), 10.5, 10.2, metal, 0.5);
    // three service pipes clipped to the tube
    for (const pa of [0.9, 2.3, 4.4]) tube(g, V3(r0 + 18, Math.cos(pa) * (tr + 0.5), Math.sin(pa) * (tr + 0.5)), V3(r1 - 16, Math.cos(pa) * (tr + 0.5), Math.sin(pa) * (tr + 0.5)), 0.32, 0.32, 4, sty(M_METAL, C.metal, 0, pa > 2 ? 1.6 : 0.8));
    // root gussets to the hub and braces from the bracing ring up to the rim roof
    for (const sg of [-1, 1]) {
      const ga = sg * 0.3;
      tube(g, V3(Math.cos(ga) * (hubR - 0.5), Math.sin(ga) * (hubR - 0.5), 0), V3(78, sg * 4.5, 0), 0.85, 0.6, 6, paint);
      const ba = sg * (Math.PI / NSPOKE) * 0.62;
      tube(g, V3(rb, sg * 4, 0), V3(Math.cos(ba) * (ri + 0.5), Math.sin(ba) * (ri + 0.5), 0), 0.7, 0.55, 5, metal);
      tube(g, V3(rb - 44, sg * 5, 0), V3(Math.cos(ba * 0.52) * rb, Math.sin(ba * 0.52) * rb, 0), 0.55, 0.45, 5, metal);
    }
    for (const sz of [-1, 1]) for (const sa of [-1, 1]) {
      const ga = sa * 0.13, ba = sa * 0.1;
      tube(g, V3(Math.cos(ga) * (hubR - 2.6), Math.sin(ga) * (hubR - 2.6), sz * (S.hl - 9)), V3(Math.cos(ba) * (ri + 0.6), Math.sin(ba) * (ri + 0.6), sz * (S.W - S.rw - 0.6)), 0.17, 0.17, 4, sty(M_RAIL, C.white, 0, 0.55));
    }
    // radiator wings: pairs of tilted panels reaching fore and aft from the truss
    const nRad = S.radPerSpoke, tilt = S.radTilt * (k % 2 ? -1 : 1);
    for (let j = 0; j < nRad; j++) {
      const x0 = lerp(150, 232, nRad > 1 ? j / (nRad - 1) : 0.5) + rng.range(-6, 6), len = rng.range(20, 27), span = rng.range(24, 32);
      for (const sg of [-1, 1]) {
        const ev = V3(0, Math.sin(tilt) * span * sg, Math.cos(tilt) * span * sg), o = V3(x0, Math.sin(tilt) * 6 * sg, Math.cos(tilt) * 6 * sg);
        tube(g, V3(x0 + len / 2, 0, 0), V3(x0 + len / 2, 0, 0).add(ev).addScaledVector(o.clone().setX(0), 1), 0.4, 0.25, 4, metal);
        for (let q = 0; q < 3; q++) plate(g, o.clone().add(V3(q * (len / 3) + 0.25, 0, 0)), V3(len / 3 - 0.5, 0, 0), ev, sty(M_RADIATOR, C.white, 0, 1.1));
      }
    }
    // tanks and foil-wrapped modules strapped to the truss near the hub (the camera passes 40 m from these)
    g.rnd = rng();
    for (let j = 0, nj = rng.int(2, 4); j < nj; j++) {
      const x = rng.range(52, 128), sg = rng.sign(), kind = rng();
      if (kind < 0.5) {
        const r = rng.range(1.7, 2.6), len = rng.range(7, 12), zz = rng.sign() * rng.range(0, 3);
        g.push(new THREE.Matrix4().makeTranslation(x, sg * (5.6 + r), zz).multiply(AXIS_X)); capsule(g, r, -len / 2, len / 2, rng.chance(0.5) ? foil : sty(M_PAINT, C.white, 0, rng.range(0.6, 1.05)), 12); g.pop();
        tube(g, V3(x, sg * 5.2, zz - r), V3(x, sg * 5.2, zz + r), 0.3, 0.3, 4, metal);
      } else {
        const hx = rng.range(3, 6), hy = rng.range(1.6, 2.6), hz = rng.range(2.2, 4);
        cbox(g, x, 0, rng.sign() * (5.4 + hz), hx, hy, hz, 0.5, kind < 0.8 ? foil : sty(M_PAINT, C.white, 0, 0.7));
      }
    }
    // elevator pod riding the fore side of the truss, with a lit window band
    {
      const x = rng.range(70, 240), z = 8.4;
      g.push(new THREE.Matrix4().makeTranslation(x, 0, z).multiply(AXIS_X));
      capsule(g, 2.7, -4.5, 4.5, sty(M_PAINT, C.white, 0, 1.05), 12, 0.8);
      lathe(g, [[2.78, -1.1], [2.78, 1.1]], sty(M_GLOW, C.warm, 3.2), { n: 12 });
      g.pop();
      for (const sg of [-1, 1]) tube(g, V3(x + sg * 3, 0, 5.3), V3(x + sg * 3, 0, 6.6), 0.4, 0.4, 4, metal);
    }
    g.pop();
    // marker lights at the collars
    const c = Math.cos(a), s = Math.sin(a);
    for (let x = r0 + 41; x < r1 - 26; x += 29) beacons.push({ p: V3(c * x, s * x, 4.6), c: C.warm, s: 1.5, ph: x, rate: 0, rot: 1 });
    beacons.push({ p: V3(c * (rb + 2) + -s * 0, s * (rb + 2), -6), c: C.blue, s: 2.2, ph: k, rate: 0, rot: 1 });
  }
}

function buildHub(g, S, beacons) {
  const { rng, C, hubR, hl } = S;
  g.rnd = rng();
  const paint = sty(M_PAINT, C.white), dark = sty(M_PAINT, C.white, 0, 0.45), metal = sty(M_METAL, C.metal, 0, 1.2), foil = sty(M_FOIL, C.gold);
  const win = sty(M_ROOMS, C.white, 1, 0.9), acc = sty(M_PAINT, C.accent, 0, 0.9), black = sty(M_BLACK, C.dark, 0, 1.3);
  const r1 = hubR - 5, r2 = hubR - 2, half = [[13, -hl], [r1 - 6, -hl], [r1 - 2, -hl + 2.5], [r1 - 2, -hl + 6], [r2, -hl + 7.5], [r2, -hl + 11], [r1, -hl + 12.5]];
  const hs = [black, dark, S.hubFoil ? foil : paint, metal, acc, metal];
  // ribs along the barrel, then the central drum that carries the spokes
  const nRib = S.hubRibs, zA = -hl + 12.5, zB = -7.5;
  for (let i = 0; i < nRib; i++) {
    const za = lerp(zA, zB, i / nRib), zb = lerp(zA, zB, (i + 1) / nRib);
    half.push([r1, zb - 1.6], [r1 + 1.1, zb - 1.2], [r1 + 1.1, zb - 0.4], [r1, zb]); hs.push(i % 2 === 0 ? win : paint, metal, metal, metal);
  }
  half.push([hubR, -5.5]); hs.push(dark);
  const pts = half.slice(), st = hs.slice(); st.push(paint);
  for (let i = half.length - 1; i >= 0; i--) { pts.push([half[i][0], -half[i][1]]); if (i > 0) st.push(hs[i - 1]); }
  lathe(g, pts, st, { n: 72 });
  lathe(g, [[13, hl], [13, -hl]], black, { n: 36 });
  // end faces: a ring of lit windows and two raised collars, so they are not blank discs
  {
    const ra = Math.max(17, r1 - 16), rbw = r1 - 9.5;
    lathe(g, [[rbw, hl + 0.08], [ra, hl + 0.08]], win, { n: 72 });
    lathe(g, [[ra, -hl - 0.08], [rbw, -hl - 0.08]], win, { n: 72 });
    for (const sg of [-1, 1]) for (const rr of [ra - 1.2, rbw + 1.4]) {
      const z = sg * (hl + 0.35);
      lathe(g, [[rr + 0.45, z], [rr, z + 0.45], [rr - 0.45, z], [rr, z - 0.45]], metal, { closed: true, n: 72 });
    }
  }
  // equipment between the spoke roots, light strips on the end flanges
  for (let k = 0; k < NSPOKE; k++) {
    const a = ((k + 0.5) / NSPOKE) * TAU;
    g.push(rotZ(a)); g.rnd = rng();
    cbox(g, hubR + 1.1, 0, rng.range(-2, 2), 1.4, rng.range(3, 6), rng.range(1.5, 3), 0.4, rng.chance(0.5) ? foil : paint);
    for (const sg of [-1, 1]) cbox(g, r2 + 0.25, 0, sg * (hl - 9.2), 0.3, 2.6, 0.5, 0.1, sty(M_GLOW, C.blue, 2.6));
    g.pop();
    beacons.push({ p: V3(Math.cos(a) * (r1 - 4), Math.sin(a) * (r1 - 4), hl + 0.4), c: k % 2 ? C.warm : C.blue, s: 1.8, ph: k * 1.3, rate: 0, rot: 1 });
  }
}

// ---------------------------------------------------------------- the spindle (does not rotate)
function quadP(g, p0, p1, p2, p3, st) {
  const n = V3().subVectors(p1, p0).cross(V3().subVectors(p3, p0)).normalize(), ps = [p0, p1, p2, p3], id = [];
  for (let i = 0; i < 4; i++) id.push(g.v(ps[i].x, ps[i].y, ps[i].z, n.x, n.y, n.z, ps[i].z - p0.z, ps[i].y - p0.y + ps[i].x - p0.x, st, 6));
  g.quad(id[0], id[1], id[2], id[3]);
}

function buildShuttle(g, S, beacons, zs, phi) {
  const { rng, C } = S, metal = sty(M_METAL, C.metal, 0, 1.3), white = sty(M_PAINT, C.white, 0, 1.08), black = sty(M_BLACK, C.dark, 0, 1.1);
  g.push(rotZ(phi)); g.rnd = rng();
  tube(g, V3(14.5, 0, zs), V3(20.8, 0, zs), 2.0, 1.7, 10, metal);
  const fx = 24.0;
  g.push(new THREE.Matrix4().makeTranslation(fx, 0, zs + 2));
  const body = [[2.5, -15], [3.4, -12], [3.4, 6], [3.0, 10], [2.0, 14], [0.9, 16.3], [0.01, 17]];
  lathe(g, body, white, { n: 10, a0: Math.PI / 2, a1: Math.PI * 1.5 });           // dorsal half faces the station
  lathe(g, body, black, { n: 10, a0: -Math.PI / 2, a1: Math.PI / 2 });            // tiled belly faces out
  lathe(g, [[0.01, -15], [2.5, -15]], metal, { n: 10 });
  for (const sg of [-1, 1]) {
    const w = [V3(1.6, sg * 3, 5), V3(1.6, sg * 12.5, -9.5), V3(1.6, sg * 12.5, -13), V3(1.6, sg * 3, -13.5)];
    quadP(g, w[0], w[1], w[2], w[3], black);
    const t = w.map((p) => p.clone().setX(p.x - 0.7 + (Math.abs(p.y) > 4 ? 0.45 : 0)));
    quadP(g, t[0], t[1], t[2], t[3], sty(M_RADIATOR, C.white, 0, 1.0));
    quadP(g, w[0], t[0], t[1], w[1], white); quadP(g, w[1], t[1], t[2], w[2], white);
    g.push(new THREE.Matrix4().makeTranslation(-1.2, sg * 1.5, 0)); lathe(g, [[0.6, -15], [1.25, -17.4]], metal, { n: 8 }); g.pop();
    beacons.push({ p: V3(fx + 1.6, sg * 12.5, zs + 2 - 11).applyMatrix4(rotZ(phi)), c: sg > 0 ? C.red : C.blue, s: 1.6, ph: 0, rate: 0, rot: 0 });
  }
  g.push(new THREE.Matrix4().makeTranslation(1.3, 0, 0)); lathe(g, [[0.6, -15], [1.25, -17.4]], metal, { n: 8 }); g.pop();
  quadP(g, V3(-3.2, 0, -5.5), V3(-9.6, 0, -12.2), V3(-9.6, 0, -15.4), V3(-3.0, 0, -14.2), sty(M_RADIATOR, C.white, 0, 1.05));
  cbox(g, -2.35, 0, 11.6, 0.35, 1.5, 0.8, 0.12, sty(M_GLOW, C.warm, 1.8));
  cbox(g, -3.3, 0, -2, 0.25, 1.9, 6.5, 0.1, sty(M_PAINT, C.white, 0, 0.6));
  g.pop(); g.pop();
  beacons.push({ p: V3(fx - 9.6, 0, zs + 2 - 15).applyMatrix4(rotZ(phi)), c: C.white, s: 2.4, ph: 1.0, rate: 2.6, rot: 0 });
  return V3(fx, 0, zs + 2).applyMatrix4(rotZ(phi));
}

async function buildSpindle(g, S, beacons, pause) {
  const { rng, C, hl } = S;
  const paint = sty(M_PAINT, C.white), dark = sty(M_PAINT, C.white, 0, 0.5), metal = sty(M_METAL, C.metal, 0, 1.25), foil = sty(M_FOIL, C.gold);
  const black = sty(M_BLACK, C.dark, 0, 1.3), win = sty(M_ROOMS, C.white, 1, 0.95), acc = sty(M_PAINT, C.accent, 0, 0.9);
  const out = {};
  g.rnd = rng();
  lathe(g, [[9.5, -hl - 8], [9.5, hl + 8]], metal, { n: 24 });
  // fore de-spun docking node, then a truss stub for the world's long truss to join
  const z0 = hl + 4;
  lathe(g, [[9.5, z0], [14, z0], [16.5, z0 + 3], [16.5, z0 + 8], [15, z0 + 9.5], [15, z0 + 30], [16.5, z0 + 31.5], [16.5, z0 + 36], [12, z0 + 42], [12, z0 + 52], [8, z0 + 57], [0.01, z0 + 57]],
    [dark, paint, acc, metal, win, metal, S.hubFoil ? paint : foil, paint, foil, dark, black], { n: 40 });
  truss(g, V3(0, 0, z0 + 55), V3(0, 0, 150), 11, 11.6, metal, 0.55, { roll: Math.PI / 4 });
  lathe(g, [[8.6, 146.5], [8.6, 150], [0.01, 150]], [paint, dark], { n: 16 });
  for (const a of [0.8, 2.4, 4.0, 5.5]) { g.push(rotZ(a)); g.rnd = rng(); cbox(g, 15.6, 0, z0 + rng.range(14, 26), 1.0, rng.range(1.5, 3), rng.range(1.5, 3.5), 0.3, rng.chance(0.5) ? foil : paint); g.pop(); }
  if (S.shuttle) out.shuttle = buildShuttle(g, S, beacons, z0 + 19, S.shuttlePhi);
  for (const sg of [-1, 1]) beacons.push({ p: V3(0, sg * 8.5, 150.5), c: C.white, s: 3.4, ph: sg, rate: 2.4, rot: 0 });
  await pause();
  // aft node
  const zb = -(hl + 4);
  g.rnd = rng();
  lathe(g, [[0.01, zb - 52], [7, zb - 52], [12, zb - 46], [12, zb - 34], [15.5, zb - 30], [15.5, zb - 12], [13, zb - 9.5], [13, zb - 3], [16, zb - 1.5], [16, zb], [9.5, zb]],
    [black, dark, win, paint, S.hubFoil ? paint : foil, metal, acc, metal, paint, dark], { n: 40 });
  const zEnd = -350;
  truss(g, V3(0, 0, zb - 50), V3(0, 0, zEnd), 11, 11.5, metal, 0.55, { roll: Math.PI / 4 });
  // modules, tanks: all on the -X half so the +X side stays clear for the camera line
  let z = zb - 70;
  while (z > zEnd + 30) {
    await pause();
    const kind = rng(), len = rng.range(15, 26); g.rnd = rng();
    if (kind < 0.62) {
      const r = rng.range(4.4, 6.4), a = Math.PI + rng.range(-0.95, 0.95), off = 7.2 + r;
      g.push(rotZ(a).multiply(new THREE.Matrix4().makeTranslation(off, 0, z - len / 2)));
      const mst = rng.chance(0.55) ? foil : sty(M_PAINT, C.white, 0, rng.range(0.7, 1.05));
      capsule(g, r, -len / 2, len / 2, mst, 18, 0.55);
      for (const zz of [-len * 0.28, len * 0.28]) lathe(g, [[r + 0.3, zz - 0.5], [r + 0.3, zz + 0.5]], metal, { n: 18 });
      if (rng.chance(0.6)) lathe(g, [[r + 0.08, -2.4], [r + 0.08, 2.4]], win, { n: 18 });
      tube(g, V3(-r - 1.4, 0, 0), V3(-r + 0.3, 0, 0), 1.3, 1.3, 8, metal);
      g.pop();
    } else {
      const r = rng.range(3.0, 3.8);
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2;
        g.push(new THREE.Matrix4().makeTranslation(Math.cos(a) * (5.4 + r), Math.sin(a) * (5.4 + r), z - 6));
        capsule(g, r, -r, r, k % 2 ? foil : sty(M_PAINT, C.white, 0, 0.95), 14, 1); g.pop();
      }
      lathe(g, [[5.4 + r, z - 6.5], [5.4 + r, z - 5.5]], metal, { n: 4, a0: Math.PI / 4, a1: Math.PI / 4 + TAU });
    }
    z -= len + rng.range(10, 30);
  }
  await pause();
  // solar wings up and down (local +-Y), blankets turned to the sun (normal ~ +-Z): they glow when backlit
  out.wings = [];
  for (const wz of S.wingZ) {
    const tau = S.wingTilt, e = V3(Math.cos(tau), 0, Math.sin(tau)); g.rnd = rng();
    for (const sg of [-1, 1]) {
      tube(g, V3(0, sg * 6, wz), V3(0, sg * 81, wz), 0.6, 0.32, 6, metal);
      for (let q = 0; q < 4; q++) {
        const y0 = sg * (15 + q * 16.4);
        for (const side of [-1, 1]) plate(g, V3(0, y0, wz).addScaledVector(e, side * 0.8), e.clone().multiplyScalar(side * 6.1), V3(0, sg * 15.8, 0), sty(M_SOLAR, C.solar));
        tube(g, V3(0, y0, wz).addScaledVector(e, -7), V3(0, y0, wz).addScaledVector(e, 7), 0.2, 0.2, 3, metal);
      }
      tube(g, V3(0, sg * 80.8, wz).addScaledVector(e, -7), V3(0, sg * 80.8, wz).addScaledVector(e, 7), 0.2, 0.2, 3, metal);
      beacons.push({ p: V3(0, sg * 82, wz), c: C.red, s: 3.0, ph: wz * 0.1 + sg, rate: 2.0, rot: 0 });
      out.wings.push(V3(0, sg * 48, wz));
    }
  }
  await pause();
  // The approach gate: a lattice hoop standing off the truss, centred on the flight line, that the camera threads on its
  // way to the dock (17 m radius; a ring of guide lights on its inner face, chase lights on the face toward the camera).
  {
    let zG = -228; for (const wz of S.wingZ) if (Math.abs(zG - wz) < 22) zG = wz - 26;      // -228, or 26 m aft of a wing that stands there
    const gx = S.portalOff, gr = 17, ro2 = gr + 2.6, PT = (r, a, z) => V3(Math.cos(a) * r, Math.sin(a) * r, z);
    g.push(new THREE.Matrix4().makeTranslation(gx, 0, zG));
    const railS = sty(M_EDGE, C.white, 0, 0.95);
    for (const zz of [-1.7, 1.7]) lathe(g, [[gr + 0.45, zz], [gr, zz + 0.45], [gr - 0.45, zz], [gr, zz - 0.45]], railS, { closed: true, n: 64 });
    lathe(g, [[ro2 + 0.4, 0], [ro2, 0.4], [ro2 - 0.4, 0], [ro2, -0.4]], metal, { closed: true, n: 64 });
    const NB = 24;
    for (let k = 0; k < NB; k++) {
      const a0 = (k / NB) * TAU, a1 = ((k + 1) / NB) * TAU, am = (a0 + a1) / 2;
      tube(g, PT(gr, a0, -1.7), PT(gr, a1, 1.7), 0.16, 0.16, 3, metal);
      tube(g, PT(gr, a0, 1.7), PT(gr, a0, -1.7), 0.16, 0.16, 3, metal);
      tube(g, PT(gr, a0, -1.7), PT(ro2, am, 0), 0.14, 0.14, 3, metal);
      tube(g, PT(gr, a1, 1.7), PT(ro2, am, 0), 0.14, 0.14, 3, metal);
      if (k % 2 === 0) lathe(g, [[gr - 0.5, 0.55], [gr - 0.5, -0.55]], sty(M_GLOW, k % 4 === 0 ? C.blue : C.warm, 2.8), { n: 3, a0: a0 + 0.05, a1: a1 - 0.05 });
      if (k % 4 === 1) { g.push(rotZ(am)); cbox(g, gr + 1.3, 0, 0, 1.0, 1.9, 1.5, 0.3, k % 8 === 1 ? foil : paint); g.pop(); }
    }
    g.pop();
    for (const sg of [-1, 1]) {
      const a = Math.PI + sg * 0.42;
      tube(g, V3(5.5, sg * 3.5, zG), V3(gx + Math.cos(a) * ro2, Math.sin(a) * ro2, zG), 0.55, 0.4, 6, paint);
      tube(g, V3(5.5, sg * 3.5, zG + 16), V3(gx + Math.cos(a) * ro2, Math.sin(a) * ro2, zG), 0.3, 0.3, 4, metal);
      beacons.push({ p: V3(gx, sg * (ro2 + 1.2), zG), c: C.red, s: 3.0, ph: 2.1 + sg, rate: 2.0, rot: 0 });
    }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; beacons.push({ p: V3(gx + Math.cos(a) * (gr + 1.3), Math.sin(a) * (gr + 1.3), zG + 2.3), c: k % 3 === 0 ? C.amber : C.white, s: 1.7, ph: -k * TAU / 12, rate: 1.9, rot: 0 }); }
    out.gantry = V3(gx, 0, zG); out.gantryRadius = gr;
  }
  await pause();
  // radiators and dish on -X
  g.rnd = rng();
  const zr = lerp(zb - 60, zEnd, 0.55);
  for (const sg of [-1, 1]) { plate(g, V3(-7, sg * 0.8, zr), V3(-34, 0, 0), V3(0, sg * 6, sg * 13), sty(M_RADIATOR, C.white, 0, 1.1)); }
  tube(g, V3(-6, 0, zr), V3(-41.5, 0, zr), 0.45, 0.3, 5, metal);
  if (S.dish) {
    const zd = zb - 62;
    tube(g, V3(-6, -3, zd), V3(-21, -13, zd), 0.5, 0.35, 5, metal);
    g.push(new THREE.Matrix4().makeTranslation(-21, -13, zd).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 + 0.35)).multiply(new THREE.Matrix4().makeRotationY(-0.4)));
    lathe(g, [[0.3, 0], [2.2, 0.2], [4.2, 0.8], [6.2, 1.75], [8, 2.9]], sty(M_RADIATOR, C.white, 0, 1.05), { n: 24 });
    lathe(g, [[8, 2.9], [8.25, 3.0], [8.25, 2.6]], metal, { n: 24 });
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3; tube(g, V3(Math.cos(a) * 6, Math.sin(a) * 6, 1.6), V3(0, 0, 6.2), 0.12, 0.12, 3, metal); }
    capsule(g, 0.6, 5.6, 7.2, foil, 6, 1);
    g.pop();
  }
  // end node and the offset docking-port ring that seats the portal
  g.push(new THREE.Matrix4().makeTranslation(0, 0, zEnd - 7)); capsule(g, 7, -7.5, 7.5, paint, 20, 0.7); lathe(g, [[7.1, -1], [7.1, 1]], acc, { n: 20 }); g.pop();
  const ox = S.portalOff, zR = zEnd - 22, rIn = 8.8;
  g.push(new THREE.Matrix4().makeTranslation(ox, 0, zR)); g.rnd = rng();
  lathe(g, [[11.6, -1.6], [11.6, 1.6], [10.9, 2.4], [10.45, 2.4], [9.85, 2.4], [9.4, 2.4], [rIn, 1.6], [rIn, -1.6], [9.4, -2.4], [10.9, -2.4]],
    [paint, dark, paint, sty(M_GLOW, C.blue, 3.2), paint, dark, black, dark, foil, dark], { closed: true, n: 48 });
  for (let k = 0; k < 6; k++) { const a = (k + 0.5) * TAU / 6; g.push(rotZ(a)); cbox(g, 12.1, 0, 0, 0.8, 1.5, 2.0, 0.25, k % 2 ? foil : paint); g.pop(); }
  for (let k = 0; k < 8; k++) { const a = k * TAU / 8; beacons.push({ p: V3(ox + Math.cos(a) * 11.2, Math.sin(a) * 11.2, zR + 2.8), c: C.blue, s: 1.5, ph: k, rate: 0, rot: 0 }); }
  // approach lights: a slow chase round the ring (one lamp after another, about two a second)
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) * TAU / 8; beacons.push({ p: V3(ox + Math.cos(a) * 12.4, Math.sin(a) * 12.4, zR + 2.2), c: k % 2 ? C.white : C.amber, s: 2.3, ph: -k * TAU / 8, rate: 1.7, rot: 0 }); }
  g.pop();
  for (const [a, ny, nz] of [[Math.PI, 0, -5], [Math.PI * 0.72, 4.5, -8], [Math.PI * 1.28, -4.5, -8]]) {
    const ringP = V3(ox + Math.cos(a) * 11.4, Math.sin(a) * 11.4, zR), nodeP = V3(5.2, ny, zEnd + nz);
    tube(g, nodeP, ringP, 0.6, 0.45, 6, paint);
    tube(g, V3(5.2, -ny, zEnd - 12), ringP, 0.3, 0.3, 4, metal);
  }
  out.portal = V3(ox, 0, zR); out.portalRadius = rIn; out.zEnd = zEnd; out.foreEnd = V3(0, 0, 150);
  return out;
}

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('orbit-dawn-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const C = {
    white: pal[4].clone(), dark: pal[5].clone().lerp(pal[4], 0.1), metal: pal[5].clone().lerp(pal[4], 0.38),
    gold: pal[6].clone().multiplyScalar(0.85), accent: (rng.chance(0.5) ? pal[6] : pal[2]).clone().multiplyScalar(0.8),
    solar: pal[1].clone().lerp(pal[2], 0.22).multiplyScalar(1.6),
    warm: pal[3].clone(), amber: pal[6].clone(), blue: pal[2].clone().lerp(new THREE.Color(1, 1, 1), 0.25),
    red: pal[6].clone().lerp(new THREE.Color(1, 0.05, 0.02), 0.75), white1: new THREE.Color(1, 1, 1),
  };
  C.white = pal[4].clone().multiplyScalar(0.76); const lightWhite = pal[3].clone().lerp(new THREE.Color(1, 1, 1), 0.6);
  const green = new THREE.Color(0.3, 0.6, 0.12).lerp(pal[3], 0.42);

  // per-seed design
  const W = rng.range(13.5, 17), depth = rng.range(22, 29), ro = R_OUT - 2, hl = rng.range(30, 38);
  const S = {
    rng, C, W, ro, ri: ro - depth, rs: rng.range(6, 9.5), rw: Math.min(rng.range(7.5, 11), W - 3.6), perGap: rng.pick([2, 2, 3]),
    gardenLobes: rng.pick([2, 3, 3]), rBrace: rng.range(188, 204), hubR: rng.range(34, 38), hl,
    radPerSpoke: rng.pick([1, 2, 2]), radTilt: rng.range(0.5, 0.95), hubRibs: clamp(Math.floor((hl - 20) / 4.5), 1, 4), hubFoil: rng.chance(0.5),
    shuttle: opts.shuttle !== false, shuttlePhi: rng.range(-0.55, 0.55),
    wingZ: rng.chance(0.6) ? [-158 - rng.range(0, 20), -262 - rng.range(0, 25)] : [-205 - rng.range(0, 30)], wingTilt: rng.range(-0.3, 0.3),
    dish: rng.chance(0.7), portalOff: 32,
  };
  const beacons = [];
  const gs = new Geo();
  const pause = async () => { await ctx.yield?.(); };
  await pause();
  await buildRim(gs, S, beacons, pause); await pause();
  await buildSpokes(gs, S, beacons, pause); await pause();
  buildHub(gs, S, beacons); await pause();
  const gt = new Geo();
  const sp = await buildSpindle(gt, S, beacons, pause); await pause();

  const sunDir = (opts.sunDir ? V3().copy(opts.sunDir) : V3(0, -0.2, -1)).normalize();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uSunDir: { value: sunDir.clone() }, uSunCol: { value: new THREE.Color(1.3, 1.27, 1.22) }, uEarthCol: { value: new THREE.Color() }, uUp: { value: V3(0, 1, 0) },
    uWarm: { value: pal[3].clone() }, uGreen: { value: green }, uCool: { value: pal[2].clone().lerp(new THREE.Color(1, 1, 1), 0.45) },
    uMoonDir: { value: V3(0.3, 0.5, -0.8).normalize() }, uMoonCol: { value: new THREE.Color(0, 0, 0) },
    uShadow: { value: new THREE.Vector4(0, 1, 0, 0) }, uPen: { value: 55 }, uTime: { value: 0 }, uWin: { value: 1 }, uFill: { value: 0.16 },
  }]);
  const hullMat = [0, 1, 2].map((k) => new THREE.ShaderMaterial({ uniforms, defines: { CLS: k }, vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide }));
  const object = new THREE.Group(); object.name = 'orbit-dawn-hero';
  const hubY = opts.hubAtOrigin ? 0 : R_OUT;
  const inner = new THREE.Group(); inner.position.y = hubY; object.add(inner);
  const spin = new THREE.Group(); inner.add(spin);
  const spinMesh = new THREE.Mesh(await gs.buildAsync(pause), hullMat); spin.add(spinMesh);
  await pause();
  const staticMesh = new THREE.Mesh(await gt.buildAsync(pause), hullMat); inner.add(staticMesh);
  await pause();
  // depth pre-pass: the hull shader is dear and the wheel overlaps itself several times, so lay down depth first
  // with a trivial material (pushed back a hair) and let early-z shade every pixel of the hull only once
  const depthMat = new THREE.ShaderMaterial({
    vertexShader: 'void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; }',
    fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }', colorWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
  const addPrepass = (mesh) => { const m = new THREE.Mesh(mesh.geometry, depthMat); m.renderOrder = -5; mesh.add(m); return m; };
  addPrepass(spinMesh); addPrepass(staticMesh);

  // beacons: one Points object; wheel-mounted ones are rotated in the vertex shader
  const bp = [], bc = [], bb = [];
  for (const b of beacons) {
    const k = b.rate > 0 ? 7 : 4.5, col = b.c === C.white ? lightWhite : b.c;
    bp.push(b.p.x, b.p.y, b.p.z); bc.push(col.r * k, col.g * k, col.b * k); bb.push(b.s, b.ph, b.rate, b.rot);
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  bg.setAttribute('aB', new THREE.Float32BufferAttribute(bb, 4));
  const bUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uAngle: { value: 0 }, uPx: { value: 500 } }]);
  const beaconMat = new THREE.ShaderMaterial({ uniforms: bUniforms, vertexShader: BEACON_VERT, fragmentShader: BEACON_FRAG, vertexColors: true, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(bg, beaconMat); points.frustumCulled = false; points.renderOrder = 2; inner.add(points);

  // ---- state
  const period = opts.period ?? 60, omega = TAU / period, pitch = TAU / NSPOKE;
  const st = { phase0: rng() * TAU, dir: rng.sign(), steer: 0, override: null, prevValid: false, sunrise: clamp(opts.sunrise ?? 0.55, 0, 1), earth: null };
  const steerOn = opts.steer !== false;
  const sunCol = new THREE.Color(1.3, 1.27, 1.22), earthNight = pal[2].clone().multiplyScalar(0.06).add(pal[1].clone().multiplyScalar(0.3)), earthDay = pal[2].clone().multiplyScalar(0.2);
  const pl = V3(), pl2 = V3(), earthC = new THREE.Color(), prev = V3(), vel = V3(), sl = V3(), upW = V3(), nW = V3(), hubW = V3(), inv = new THREE.Matrix4(), size = new THREE.Vector2();
  const SPOKE_HW = 5.6, TUBE_R = 3.4, SUN_ANG = 0.008;
  const sstep = (a, b, x) => smoothstep(a, b, x);

  function localCam(camera, out) { inner.updateWorldMatrix(true, false); return inner.worldToLocal(out.setFromMatrixPosition(camera.matrixWorld)); }      // matrixWorld: a portal camera's matrix is set directly
  function sunVisibility(camera) {
    const p = localCam(camera, pl2);
    inv.copy(inner.matrixWorld).invert(); sl.copy(uniforms.uSunDir.value).transformDirection(inv);
    let vis = 1;
    if (Math.abs(sl.z) > 1e-4) {
      const t = -p.z / sl.z;
      if (t > 0) {
        const x = p.x + sl.x * t, y = p.y + sl.y * t, r = Math.hypot(x, y), soft = Math.max(1.0, t * SUN_ANG);
        vis *= sstep(S.hubR - soft, S.hubR + soft, r);
        vis *= 1 - sstep(S.ri - soft, S.ri + soft, r) * (1 - sstep(R_OUT - soft, R_OUT + soft, r));
        if (r > S.hubR && r < S.ri) {
          let da = Math.atan2(y, x) - spin.rotation.z; da -= Math.round(da / pitch) * pitch;
          const d = Math.abs(Math.sin(da)) * r;
          vis *= 1 - (0.45 * (1 - sstep(SPOKE_HW - soft, SPOKE_HW + soft, d)) + 0.55 * (1 - sstep(TUBE_R - soft, TUBE_R + soft, d)));
        }
      }
    }
    if (Math.abs(sl.z) > 1e-4) {                      // the approach gate's hoop
      const t = (sp.gantry.z - p.z) / sl.z;
      if (t > 0) { const d = Math.hypot(p.x + sl.x * t - sp.gantry.x, p.y + sl.y * t - sp.gantry.y) - sp.gantryRadius - 0.6, soft = Math.max(0.6, t * SUN_ANG); vis *= 1 - 0.6 * (1 - sstep(1.6 - soft, 1.6 + soft, Math.abs(d))); }
    }
    const q = sl.x * sl.x + sl.y * sl.y;
    if (q > 1e-6) {                                   // the spindle on the axis
      const t = -(p.x * sl.x + p.y * sl.y) / q, z = p.z + sl.z * t;
      if (t > 0 && z < 152 && z > sp.zEnd - 14) { const d = Math.hypot(p.x + sl.x * t, p.y + sl.y * t), soft = Math.max(1.0, t * SUN_ANG); vis *= sstep(8 - soft, 8 + soft, d); }
    }
    return clamp(vis, 0, 1);
  }

  const hero = {
    object, radius: R_OUT, height: R_OUT * 2, center: V3(0, hubY, 0), ground: false, groundY: 0,
    sunVis: 1, phase: 0,
    params: { hubRadius: S.hubR, rimInner: S.ri, rimOuter: R_OUT, rimHalfWidth: W, spokes: NSPOKE, period, spinDir: st.dir },
    setSunrise(s) { st.sunrise = clamp(s, 0, 1); },
    setProgress(u) { st.sunrise = smoothstep(0.42, 0.64, u); },
    setSun(dir, color) { if (dir) uniforms.uSunDir.value.copy(dir).normalize(); if (color) sunCol.copy(color); },
    setEarthshine(color) { st.earth = color ? earthC.copy(color) : null; },
    setPhase(rad) { st.override = rad; },
    sunVisibility,
    update(dt, time, camera) {
      const base = st.phase0 + st.dir * omega * time;
      if (camera) {
        localCam(camera, pl);
        if (steerOn && st.prevValid && dt > 1e-4) {
          vel.subVectors(pl, prev).multiplyScalar(1 / dt);
          const vz = -vel.z;
          if (pl.z > 1.5 && pl.z < 480 && vz > 1 && vel.length() < 120) {
            const tc = pl.z / vz, xc = pl.x + vel.x * tc, yc = pl.y + vel.y * tc, rc = Math.hypot(xc, yc);
            if (rc > S.hubR + 4 && rc < S.ri - 4) {
              let d = Math.atan2(yc, xc) - (base + st.steer + st.dir * omega * tc) - pitch / 2; d -= Math.round(d / pitch) * pitch;
              const lim = omega * (pl.z < 60 ? 0.6 : 0.3);
              st.steer += clamp(d / Math.max(tc, 0.4), -lim, lim) * dt;
            }
          }
        }
        prev.copy(pl); st.prevValid = true;
      }
      const phase = st.override !== null ? st.override : base + st.steer;
      if (st.override !== null) { st.steer = st.override - base; st.override = null; }
      spin.rotation.z = phase; hero.phase = phase;
      // sunrise: shadow-edge plane, sun colour, earthshine
      inner.updateWorldMatrix(true, false);
      const s = st.sunrise, L = uniforms.uSunDir.value;
      upW.setFromMatrixColumn(inner.matrixWorld, 1).normalize(); hubW.setFromMatrixPosition(inner.matrixWorld);
      nW.copy(upW).addScaledVector(L, -upW.dot(L)).normalize();
      uniforms.uShadow.value.set(nW.x, nW.y, nW.z, hubW.dot(nW) + lerp(R_OUT * 1.25, -R_OUT * 2.5, s));
      uniforms.uUp.value.copy(upW); uniforms.uSunCol.value.copy(sunCol);
      if (st.earth) uniforms.uEarthCol.value.copy(st.earth); else uniforms.uEarthCol.value.copy(earthNight).lerp(earthDay, smoothstep(0.1, 0.9, s));
      uniforms.uTime.value = time; bUniforms.uTime.value = time; bUniforms.uAngle.value = phase;
      if (camera) {
        const h = ctx.renderer?.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(size).y : 720;
        bUniforms.uPx.value = h * 0.5 * camera.projectionMatrix.elements[5];
        hero.sunVis = sunVisibility(camera);
      }
    },
    dispose() {},
  };
  const P = (x, y, z) => V3(x, y + hubY, z), portal = P(sp.portal.x, sp.portal.y, sp.portal.z);
  hero.anchors = {
    hub: P(0, 0, 0), axis: V3(0, 0, 1), crossing: P(110, 0, 0),
    flyThrough: [P(122, 10, 460), P(116, 5, 260), P(111, 1, 90), P(110, 0, 0), P(100, 0, -45), P(62, 0, -105), P(38, 0, -150), P(32, 0, -195), P(32, 0, -300), portal.clone()],
    portalSeat: { position: portal.clone(), normal: V3(0, 0, 1), radius: sp.portalRadius },
    foreEnd: P(0, 0, 150), aftEnd: P(0, 0, sp.zEnd), shuttle: sp.shuttle ? P(sp.shuttle.x, sp.shuttle.y, sp.shuttle.z) : null,
    gardenLook: P(S.ri, 0, 0), solarWings: sp.wings.map((w) => P(w.x, w.y, w.z)),
    gantry: { position: P(sp.gantry.x, sp.gantry.y, sp.gantry.z), radius: sp.gantryRadius },
    viewpoints: [
      { position: P(70, 45, 540), target: P(0, 0, 0) },
      { position: P(112, 2, 130), target: P(250, 40, 0) },
      { position: P(32, 0, -160), target: portal.clone() },
    ],
  };
  object.userData.hero = hero;
  hero.uniforms = uniforms;
  hero.addPrepass = addPrepass; hero.material = hullMat; hero.colors = C; hero.design = S; hero.beaconUniforms = bUniforms;   // for the world: more station in the same look
  hero.stats = { triangles: gs.tris + gt.tris, beacons: beacons.length };
  hero.update(0, 0, null);
  return hero;
}

// ---------------------------------------------------------------- toolkit for the world
// The world builds the rest of the station (fore truss, tracking solar wings, tug, spacewalkers) with the same
// accumulator and material codes and draws it with hero.material, so it shares the sunrise, sun and earthshine.
export const stationKit = {
  Geo, sty, lathe, tube, truss, cbox, plate, capsule, quadP, rotZ,
  M: { PAINT: M_PAINT, FOIL: M_FOIL, METAL: M_METAL, ROOMS: M_ROOMS, GALLERY: M_GALLERY, SOLAR: M_SOLAR, GLOW: M_GLOW, SKYLIGHT: M_SKYLIGHT, BLACK: M_BLACK, RADIATOR: M_RADIATOR, RAIL: M_RAIL, EDGE: M_EDGE },
};
// Extra beacons in the hero's beacon style. list: [{ p: Vector3, c: THREE.Color (linear), s: size m, ph: phase, rate: blink rate (0 = steady) }]
// Returns { object: Points, uniforms }: set uniforms.uTime every frame and copy uniforms.uPx from hero.beaconUniforms.
export function makeBeacons(list) {
  const bp = [], bc = [], bb = [];
  for (const b of list) { const k = b.rate > 0 ? 7 : 4.5; bp.push(b.p.x, b.p.y, b.p.z); bc.push(b.c.r * k, b.c.g * k, b.c.b * k); bb.push(b.s, b.ph || 0, b.rate || 0, 0); }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  bg.setAttribute('aB', new THREE.Float32BufferAttribute(bb, 4));
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uAngle: { value: 0 }, uPx: { value: 500 } }]);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: BEACON_VERT, fragmentShader: BEACON_FRAG, vertexColors: true, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const object = new THREE.Points(bg, mat); object.frustumCulled = false; object.renderOrder = 2;
  return { object, uniforms };
}
