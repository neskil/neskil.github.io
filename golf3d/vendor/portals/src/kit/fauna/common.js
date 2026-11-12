// Fauna kit internals: light, routes, geometry builder and the shared creature shader.
import * as THREE from 'three';

export const col = (c) => (c && c.isColor ? c.clone() : Array.isArray(c) ? new THREE.Color(c[0], c[1], c[2]) : new THREE.Color(c));
export const v3 = (p, d) => (p ? (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])) : d ? d.clone() : new THREE.Vector3());
const fallbackRng = () => { let a = 0x9e3779b9; const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; r.range = (a2, b) => a2 + (b - a2) * r(); return r; };
// rng with the helpers the kit needs; a fixed sequence when the caller passes none
export function rngOf(opts) {
  const r = opts && opts.rng ? opts.rng : fallbackRng();
  const f = () => r();
  f.range = (a, b) => a + (b - a) * r();
  f.int = (a, b) => Math.floor(a + (b - a + 1) * r());
  f.pick = (arr) => arr[Math.floor(r() * arr.length)];
  f.chance = (p) => r() < p;
  f.sign = () => (r() < 0.5 ? -1 : 1);
  // opts.maxSigma (a number, optional): every bell-curve draw is held to within that many sigma either side, so a caller can bound the dealt
  // places of a flock by what it hands over. Held at the bound, not drawn again: the stream is consumed exactly as without it. Not handed: unbounded, as before.
  const ms = opts && opts.maxSigma > 0 ? +opts.maxSigma : 0;
  f.gauss = () => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); return ms ? Math.max(-ms, Math.min(ms, g)) : g; };
  return f;
}

// ---------- light ----------
// DirectionalLight / HemisphereLight convention: colour x intensity. Creature shaders divide by PI like three.js does.
export const FAUNA_LIGHTS = {
  day: { sunDir: [-0.45, 0.78, 0.42], sunColor: '#fff1dc', sunIntensity: 3.0, sky: '#bcd6f5', skyIntensity: 1.5, ground: '#7d6e5a', groundIntensity: 0.7 },
  sunset: { sunDir: [-0.7, 0.22, -0.55], sunColor: '#ffb070', sunIntensity: 3.2, sky: '#8fa0d8', skyIntensity: 1.2, ground: '#70505a', groundIntensity: 0.6 },
  night: { sunDir: [0.4, 0.7, 0.3], sunColor: '#9db8ff', sunIntensity: 0.7, sky: '#2c3c6c', skyIntensity: 0.9, ground: '#141826', groundIntensity: 0.5 },
  underwater: { sunDir: [0.1, 0.98, 0.1], sunColor: '#bfeaff', sunIntensity: 2.6, sky: '#3fa6c8', skyIntensity: 1.6, ground: '#0c3550', groundIntensity: 1.0 },
  alien: { sunDir: [0.5, 0.5, -0.6], sunColor: '#ff9be0', sunIntensity: 1.6, sky: '#4b3fa8', skyIntensity: 1.3, ground: '#1b1040', groundIntensity: 0.8 },
};
export function resolveLight(light, over) {
  let L = light;
  if (!L) L = FAUNA_LIGHTS.day; else if (typeof L === 'string') L = FAUNA_LIGHTS[L] || FAUNA_LIGHTS.day;
  if (over) L = { ...L, ...over };
  if (L._resolved) return L;
  return {
    _resolved: true,
    sunDir: v3(L.sunDir, new THREE.Vector3(-0.45, 0.78, 0.42)).normalize(),
    sunColor: col(L.sunColor ?? '#fff1dc').multiplyScalar(L.sunIntensity ?? 1),
    sky: col(L.sky ?? '#bcd6f5').multiplyScalar(L.skyIntensity ?? 1),
    ground: col(L.ground ?? '#7d6e5a').multiplyScalar(L.groundIntensity ?? 1),
  };
}
// Reads the first DirectionalLight and Hemisphere/Ambient light of a scene into a fauna light.
export function lightFrom(scene, over) {
  const L = { sunDir: [-0.45, 0.78, 0.42], sunColor: new THREE.Color(0, 0, 0), sky: new THREE.Color(0, 0, 0), ground: new THREE.Color(0, 0, 0) };
  let gotSun = false, gotAmb = false;
  scene.traverse((o) => {
    if (o.isDirectionalLight && !gotSun) { gotSun = true; L.sunDir = o.position.clone().sub(o.target.position).normalize(); L.sunColor = o.color.clone().multiplyScalar(o.intensity); }
    else if (o.isHemisphereLight && !gotAmb) { gotAmb = true; L.sky = o.color.clone().multiplyScalar(o.intensity); L.ground = o.groundColor.clone().multiplyScalar(o.intensity); }
    else if (o.isAmbientLight) { const a = o.color.clone().multiplyScalar(o.intensity); L.sky.add(a); L.ground.add(a); }
  });
  if (!gotSun && !gotAmb) return resolveLight('day', over);
  return resolveLight(L, over);
}
export function lightUniforms(L) {
  return { uSunDir: { value: L.sunDir.clone() }, uSunColor: { value: L.sunColor.clone() }, uSkyColor: { value: L.sky.clone() }, uGroundColor: { value: L.ground.clone() } };
}
export function applyLight(uniforms, light, over) {
  const L = resolveLight(light, over);
  uniforms.uSunDir.value.copy(L.sunDir); uniforms.uSunColor.value.copy(L.sunColor); uniforms.uSkyColor.value.copy(L.sky); uniforms.uGroundColor.value.copy(L.ground);
}

// ---------- geometry builder ----------
// Model space for every creature: nose +Z, up +Y, metres. Attributes: position, normal, color (linear),
// aAnim (vec4, meaning depends on the creature shader), aPivot (vec3 joint), aGlow (float emissive mask).
const _c = new THREE.Color(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3();
export class Geo {
  constructor() { this.p = []; this.c = []; this.a = []; this.pv = []; this.g = []; this.idx = []; }
  get n() { return this.p.length / 3; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c.r, c.g, c.b); this.a.push(0, 0, 0, 0); this.pv.push(0, 0, 0); this.g.push(0); return this.p.length / 3 - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  // Lofted body along +Z. rings: [{ z, y, x, rx, ry, top, belly }]; colours fall back to o.top / o.belly.
  // o.sides, o.shade [lo,hi] (cos of the angle from the top where belly turns into back), o.flat (0..1 flattens the underside)
  loft(rings, o = {}) {
    const sides = o.sides || 8, start = this.n, sh = o.shade || [-0.55, 0.25], flat = o.flat || 0, sq = o.square || 0;
    const top0 = o.top || new THREE.Color(0.5, 0.5, 0.5), bel0 = o.belly || top0;
    const rows = [];
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i], top = r.top || top0, bel = r.belly || (r.top && !o.belly ? r.top : bel0);
      const tip = r.rx < 1e-5 && r.ry < 1e-5;
      if (tip) { _c.copy(top).lerp(bel, 0.5); rows.push([this.v(r.x || 0, r.y || 0, r.z, _c)]); continue; }
      const row = [];
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * Math.PI * 2; let cs = Math.cos(th), sn = Math.sin(th);
        if (sq) { const m = Math.pow(Math.pow(Math.abs(cs), 2 + sq * 6) + Math.pow(Math.abs(sn), 2 + sq * 6), -1 / (2 + sq * 6)); cs *= m; sn *= m; }
        const yy = cs < 0 ? cs * (1 - flat) : cs;
        const k = Math.min(1, Math.max(0, (Math.cos(th) - sh[0]) / (sh[1] - sh[0])));
        _c.copy(bel).lerp(top, k * k * (3 - 2 * k));
        row.push(this.v((r.x || 0) + r.rx * sn, (r.y || 0) + r.ry * yy, r.z, _c));
      }
      rows.push(row);
    }
    for (let i = 0; i < rows.length - 1; i++) {
      const A = rows[i], B = rows[i + 1];
      if (A.length === 1 && B.length === 1) continue;
      for (let j = 0; j < sides; j++) {
        const j1 = (j + 1) % sides;
        if (A.length === 1) this.tri(A[0], B[j], B[j1]);
        else if (B.length === 1) this.tri(A[j], B[0], A[j1]);
        else this.quad(A[j], B[j], B[j1], A[j1]);
      }
    }
    return [start, this.n];
  }
  // Tube along a polyline (necks, legs, tentacles, horns). pts [[x,y,z]], radii number|array, colours c0 -> c1
  tube(pts, radii, sides, c0, c1, o = {}) {
    const start = this.n, N = pts.length, rows = [];
    let px = null;
    for (let i = 0; i < N; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(N - 1, i + 1)];
      _t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      if (!px) { px = new THREE.Vector3(1, 0, 0); if (Math.abs(_t.x) > 0.9) px.set(0, 0, 1); }
      _a.copy(px).addScaledVector(_t, -px.dot(_t)).normalize(); px.copy(_a); _b.crossVectors(_t, _a);
      const r = Array.isArray(radii) ? radii[i] : radii;
      _c.copy(c0); if (c1) _c.lerp(c1, i / (N - 1));
      if (r < 1e-5) { rows.push([this.v(p[0], p[1], p[2], _c)]); continue; }
      const row = [], ex = o.flatten || 1;
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * Math.PI * 2, cs = Math.cos(th) * r, sn = Math.sin(th) * r * ex;
        row.push(this.v(p[0] + _a.x * cs + _b.x * sn, p[1] + _a.y * cs + _b.y * sn, p[2] + _a.z * cs + _b.z * sn, _c));
      }
      rows.push(row);
    }
    for (let i = 0; i < N - 1; i++) {
      const A = rows[i], B = rows[i + 1];
      if (A.length === 1 && B.length === 1) continue;
      for (let j = 0; j < sides; j++) {
        const j1 = (j + 1) % sides;
        if (A.length === 1) this.tri(A[0], B[j1], B[j]);
        else if (B.length === 1) this.tri(A[j], A[j1], B[0]);
        else this.quad(A[j], A[j1], B[j1], B[j]);
      }
    }
    return [start, this.n];
  }
  // Flat membrane between two polylines of equal length (wings, fins, flukes). Colours per edge.
  strip(ea, eb, ca, cb) {
    const start = this.n, N = ea.length, A = [], B = [];
    for (let i = 0; i < N; i++) {
      const c0 = Array.isArray(ca) ? ca[i] : ca, c1 = Array.isArray(cb) ? cb[i] : (cb || c0);
      A.push(this.v(ea[i][0], ea[i][1], ea[i][2], c0)); B.push(this.v(eb[i][0], eb[i][1], eb[i][2], c1));
    }
    for (let i = 0; i < N - 1; i++) this.quad(A[i], B[i], B[i + 1], A[i + 1]);
    return [start, this.n];
  }
  // Flat polygon as a fan around its first point
  fan(pts, c0, c1) {
    const start = this.n, ids = pts.map((p, i) => this.v(p[0], p[1], p[2], i === 0 || !c1 ? c0 : c1));
    for (let i = 1; i < ids.length - 1; i++) this.tri(ids[0], ids[i], ids[i + 1]);
    return [start, this.n];
  }
  // Low ellipsoid (heads, eyes, bells)
  blob(cx, cy, cz, rx, ry, rz, c0, c1, sides = 6, rings = 4) {
    const rs = [];
    for (let i = 0; i <= rings; i++) { const t = i / rings, a = t * Math.PI, s = Math.sin(a); rs.push({ z: cz - Math.cos(a) * rz, y: cy, x: cx, rx: i === 0 || i === rings ? 0 : rx * s, ry: i === 0 || i === rings ? 0 : ry * s }); }
    return this.loft(rs, { sides, top: c0, belly: c1 || c0 });
  }
  anim(r, fn) { for (let i = r[0]; i < r[1]; i++) { const o = fn(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2], i); this.a[i * 4] = o[0]; this.a[i * 4 + 1] = o[1]; this.a[i * 4 + 2] = o[2]; this.a[i * 4 + 3] = o[3] || 0; } return r; }
  pivot(r, x, y, z) { for (let i = r[0]; i < r[1]; i++) { this.pv[i * 3] = x; this.pv[i * 3 + 1] = y; this.pv[i * 3 + 2] = z; } return r; }
  glow(r, fn) { for (let i = r[0]; i < r[1]; i++) this.g[i] = typeof fn === 'function' ? fn(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2], i) : fn; return r; }
  paint(r, fn) { for (let i = r[0]; i < r[1]; i++) { _c.setRGB(this.c[i * 3], this.c[i * 3 + 1], this.c[i * 3 + 2]); fn(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2], _c, i); this.c[i * 3] = _c.r; this.c[i * 3 + 1] = _c.g; this.c[i * 3 + 2] = _c.b; } return r; }
  move(r, fn) { for (let i = r[0]; i < r[1]; i++) { _a.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]); fn(_a, i); this.p[i * 3] = _a.x; this.p[i * 3 + 1] = _a.y; this.p[i * 3 + 2] = _a.z; } return r; }
  // Duplicate a vertex range mirrored across x = 0 (anim.y, the side, flips sign; pivot x flips)
  mirror(r, flipAnim = 1) {
    const start = this.n, map = new Map(), i0 = r[0], i1 = r[1], tris = this.idx.length;
    for (let i = i0; i < i1; i++) {
      this.p.push(-this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]); this.c.push(this.c[i * 3], this.c[i * 3 + 1], this.c[i * 3 + 2]);
      this.a.push(this.a[i * 4], this.a[i * 4 + 1] * (flipAnim === 1 ? -1 : 1), this.a[i * 4 + 2], this.a[i * 4 + 3]);
      this.pv.push(-this.pv[i * 3], this.pv[i * 3 + 1], this.pv[i * 3 + 2]); this.g.push(this.g[i]); map.set(i, this.n - 1);
    }
    for (let k = 0; k < tris; k += 3) {
      const a = this.idx[k], b = this.idx[k + 1], c = this.idx[k + 2];
      if (a >= i0 && a < i1 && b >= i0 && b < i1 && c >= i0 && c < i1) this.idx.push(map.get(a), map.get(c), map.get(b));
    }
    return [start, this.n];
  }
  get triangles() { return this.idx.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.pv, 3));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.g, 1));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

// ---------- routes ----------
// A route is a curve baked into a 1-row float texture so shaders can move creatures (and bend long bodies) along it.
const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3();
export function bakeRoute(curveOrPoints, closed = true, samples = 256) {
  let curve = curveOrPoints;
  if (Array.isArray(curveOrPoints)) curve = new THREE.CatmullRomCurve3(curveOrPoints.map((p) => v3(p)), closed, 'centripetal', 0.5);
  curve.arcLengthDivisions = Math.max(curve.arcLengthDivisions || 0, 400); if (curve.updateArcLengths) curve.updateArcLengths();
  const N = samples, data = new Float32Array(N * 4), length = curve.getLength();
  for (let i = 0; i < N; i++) { curve.getPointAt(closed ? i / N : i / (N - 1), _p0); data[i * 4] = _p0.x; data[i * 4 + 1] = _p0.y; data[i * 4 + 2] = _p0.z; data[i * 4 + 3] = 1; }
  const texture = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.FloatType);
  texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; texture.needsUpdate = true;
  const get = (i, o) => { i = closed ? ((i % N) + N) % N : Math.min(N - 1, Math.max(0, i)); return o.set(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]); };
  const route = {
    texture, length, closed, N, curve, data,
    // same cubic B-spline the shader evaluates; s in metres, open routes extrapolate straight
    pointAt(s, out = new THREE.Vector3()) {
      const f = s / length; let fc = f, x;
      if (closed) x = (f - Math.floor(f)) * N; else { fc = Math.min(1, Math.max(0, f)); x = fc * (N - 1); }
      const i = Math.floor(x), k = x - i, k2 = k * k, k3 = k2 * k;
      const w0 = (1 - 3 * k + 3 * k2 - k3) / 6, w1 = (3 * k3 - 6 * k2 + 4) / 6, w2 = (-3 * k3 + 3 * k2 + 3 * k + 1) / 6, w3 = k3 / 6;
      out.set(0, 0, 0);
      out.addScaledVector(get(i - 1, _p0), w0).addScaledVector(get(i, _p0), w1).addScaledVector(get(i + 1, _p0), w2).addScaledVector(get(i + 2, _p0), w3);
      if (!closed && f !== fc) { const e = f > 1 ? N - 1 : 1; get(e, _p0).sub(get(e - 1, _p1)).normalize(); out.addScaledVector(_p0, (f - fc) * length); }
      return out;
    },
    tangentAt(s, out = new THREE.Vector3()) { route.pointAt(s + 1, out); route.pointAt(s - 1, _p1); return out.sub(_p1).normalize(); },
    uniforms: { uRoute: { value: texture }, uRouteInfo: { value: new THREE.Vector3(N, length, closed ? 1 : 0) } },
  };
  return route;
}
// Wobbly closed loop around a centre: the default "orbit a point" route.
export function loopPoints(rng, center, radius, o = {}) {
  const n = o.points || 9, pts = [], c = v3(center), wob = o.wobble ?? 0.3, h = o.height ?? radius * 0.15, a0 = rng() * 6.283, ell = o.ellipse ?? rng.range(0.65, 1), dir = o.dir || rng.sign();
  const ph = rng() * 6.283, rot = rng() * 6.283;
  for (let i = 0; i < n; i++) {
    const a = a0 + dir * (i / n) * Math.PI * 2, r = radius * (1 + wob * (rng() - 0.5) * 2);
    const x = Math.cos(a) * r, z = Math.sin(a) * r * ell;
    pts.push(new THREE.Vector3(c.x + x * Math.cos(rot) - z * Math.sin(rot), c.y + h * Math.sin(a * 2 + ph) + h * 0.4 * (rng() - 0.5), c.z + x * Math.sin(rot) + z * Math.cos(rot)));
  }
  return pts;
}
// Open route that crosses the camera path near path fraction u.
// o: { u, span, angle (deg from the path direction), height, side, lead (m ahead of the camera), rise, sag }
export function crossPoints(path, o = {}) {
  const u = o.u ?? 0.5, span = o.span ?? 320, ang = ((o.angle ?? 65) * Math.PI) / 180, lead = o.lead ?? 45;
  const P = path.posAtDist(u * path.length + lead, new THREE.Vector3()), T = path.tangentAtDist(u * path.length + lead, new THREE.Vector3());
  T.y = 0; T.normalize(); const R = new THREE.Vector3(-T.z, 0, T.x);
  const side = o.side ?? 1, d = new THREE.Vector3().addScaledVector(T, Math.cos(ang)).addScaledVector(R, Math.sin(ang) * side).normalize();
  const mid = P.clone().addScaledVector(R, o.offset ?? 0); mid.y += o.height ?? 6;
  const pts = [], n = 7, rise = o.rise ?? 0, sag = o.sag ?? 0, bow = o.bow ?? span * 0.06;
  const bx = new THREE.Vector3(-d.z, 0, d.x);
  for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5, p = mid.clone().addScaledVector(d, t * span); p.addScaledVector(bx, bow * (1 - 4 * t * t)); p.y += rise * t - sag * (1 - 4 * t * t) + sag; pts.push(p); }
  return pts;
}
// Route beside the camera path (creatures that escort the camera). o: { side (m right), up, from, to }
export function alongPoints(path, o = {}) {
  const pts = [], n = o.points || 40, from = o.from ?? -0.05, to = o.to ?? 1.1, p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const d = (from + (to - from) * (i / (n - 1))) * path.length; path.posAtDist(d, p); path.tangentAtDist(d, t); t.y = 0; t.normalize();
    pts.push(new THREE.Vector3(p.x - t.z * (o.side ?? 12), p.y + (o.up ?? 2), p.z + t.x * (o.side ?? 12)));
  }
  return pts;
}
// Turns the path-aware options every factory shares into a baked route and a travel function.
//   route: [[x,y,z],...] | THREE.Curve (closed unless closed:false)     follow a curve
//   center + radius (+ height, wobble)                                   orbit a point (default)
//   cross: { path, u, window | duration, span, angle, height, side, lead }   cross the camera path when the camera is at u
//   along: { path, side, up, lead, tread }                               escort the camera along its own path
// Returns { route, speed, mode, state, travel(time, u) -> metres along the route, step(dt, time, u) -> same, advancing the state }.
const _sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const CROSS_DEFAULTS = { u: 0.5, window: 0.22, span: 320, angle: 65, lead: 45, height: 6, side: 1 };
// Shared motion state: keeps creatures moving while u is parked at 0 (the world is being watched through a portal) and
// measures the effective speed so wing beats / tail strokes can follow it.
//   base(time, u) -> metres. mode 'loop' | 'cross' | 'along'. L = route length, tread = treadmill length for 'along'.
export function makeTravel(base, speed, mode, L, tread = 120) {
  const st = { pre: 0, b: NaN, prev: NaN, s: 0, vis: 1, rate: 1, extra: 0, idle: false };
  const travel = (time, u) => { const b = base(time, u); return u === undefined || mode === 'loop' ? b : b + st.pre; };
  const step = (dt, time, u) => {
    if (mode !== 'loop' && u !== undefined) {
      const b = base(time, u);
      if (u <= 1e-5) {
        st.idle = true;
        // along: fly ahead on a treadmill from 0.15 tread behind the escort position to 0.85 tread ahead of it, fading at both ends
        if (mode === 'along') { st.pre += speed * dt; if (st.pre > tread * 0.85) st.pre -= tread; const f = st.pre / tread + 0.15; st.vis = _sm(0, 0.07, f) * (1 - _sm(0.88, 1, f)); }
        else if (b > 0 && b < L) { st.pre += speed * dt; if (b + st.pre > L) st.pre -= L; }      // the shader's end fade hides the wrap
      } else {
        st.idle = false;
        const db = isNaN(st.b) ? 0 : Math.abs(b - st.b), k = Math.min(Math.abs(st.pre), Math.max(0.6 * db, 0.1 * speed * dt));
        st.pre -= Math.sign(st.pre) * k; st.vis += (1 - st.vis) * Math.min(1, dt * 2.5);
      }
      st.b = b;
    }
    const s = travel(time, u);
    if (dt > 1e-5 && !isNaN(st.prev)) {
      const v = Math.abs(s - st.prev) / dt;
      if (v < speed * 12) { const r = Math.min(2.5, Math.max(0.4, v / speed)); st.rate += (r - st.rate) * Math.min(1, dt * 3); st.extra += dt * (st.rate - 1); }
    }
    st.prev = s; st.s = s;
    return s;
  };
  return { travel, step, state: st };
}
export function resolveRoute(opts, rng, d = {}) {
  const speed = opts.speed ?? d.speed ?? 10;
  let route, base, mode = 'loop', tread = 120, key = null;   // key: the keying to the camera's own place, for a check outside the world (nothing here reads it)
  const phase = rng() * 1000;
  if (opts.cross && opts.cross.path) {
    const c = opts.cross, r = bakeRoute(crossPoints(c.path, { height: d.height, span: d.span, ...c }), false, 128);
    const L = r.length, dur = c.duration ?? opts.duration, cu = c.u ?? 0.5, win = c.window ?? (dur ? L / (2 * speed * dur) : 0.22), cycle = L + (c.gap ?? L * 0.3);
    route = r; mode = 'cross';
    key = { kind: 'cross', cu, win, L, drift: c.drift || 0, b0: ((0 - (cu - win)) / (2 * win)) * L };
    base = (time, u) => (u === undefined ? ((time * speed + phase) % cycle) : ((u - (cu - win)) / (2 * win)) * L + (c.drift ? time * c.drift : 0));
  } else if (opts.along && opts.along.path) {
    const a = opts.along, from = a.from ?? -0.05, to = a.to ?? 1.1, r = bakeRoute(alongPoints(a.path, { ...a, from, to }), false, 256);
    route = r; mode = 'along'; tread = a.tread ?? 120;
    const L = r.length, lead = a.lead ?? 30;
    key = { kind: 'along', from, to, lead, L, drift: a.drift ?? 0, tread };
    base = (time, u) => (u === undefined ? (time * speed + phase) % L : ((u - from) / (to - from)) * L + lead + (a.drift ?? 0) * Math.sin(time * 0.21 + phase));
  } else {
    const closed = opts.closed !== false;
    let src = opts.route || opts.curve;
    if (!src) src = loopPoints(rng, opts.center || d.center || [0, 30, 0], opts.radius ?? d.radius ?? 80, { height: opts.height ?? d.height, wobble: opts.wobble ?? d.wobble, dir: opts.direction });
    route = bakeRoute(src, closed, opts.routeSamples || 256);
    const L = route.length, cycle = closed ? L : L * 1.25;
    const start = opts.start ?? rng();
    base = (time) => (start * L + time * speed) % cycle;
    // ofU { from, dur, hold }: a world that drives its own flock's time from the JOURNEY rather than the clock, the way glass-nave
    // releases its doves (flock.update(dt, min(max(0, u - from) * dur, hold))), can say so here. The travel is unchanged and nothing
    // in the site reads this: it is for the counter outside (tools/airtest.mjs), which otherwise must hold every place of the course
    // against every place of the flown line and cries a breach where the two never meet in time. A flock that says this and does not
    // do it is lying to its own check, so a world declares it on the line where it drives the flock, or not at all.
    // `hold` is in seconds; `holdOfL`, for a world whose own cap is written in course lengths before the course exists, is that many
    // lengths of this route turned into seconds at this speed, which is the same number the world computes from flock.route.length.
    if (opts.ofU) { mode = 'onU'; key = { kind: 'onU', from: opts.ofU.from ?? 0, dur: opts.ofU.dur, hold: opts.ofU.hold ?? (opts.ofU.holdOfL != null ? (L * opts.ofU.holdOfL) / speed : null), L, cycle, start, speed }; }
  }
  const T = makeTravel(base, speed, mode === 'onU' ? 'loop' : mode, route.length, tread);
  return { route, travel: T.travel, step: T.step, state: T.state, speed, mode, key };
}

// ---------- bounds (frustum culling) ----------
// Sphere around xyz triples in a flat array (stride >= 3), grown by pad.
export function sphereOfPoints(arr, stride, count, pad = 0) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < count; i++) { const x = arr[i * stride], y = arr[i * stride + 1], z = arr[i * stride + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const c = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return new THREE.Sphere(c, Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + pad);
}
// Bounds of a group that follows a route: the whole loop for closed routes, a moving sphere for cross / along / open routes.
//   pad = lateral extent (spread + wander + creature size), back = how far the group trails behind its lead point
export function routeBounds(R, pad, back = 0) {
  const moving = R.mode !== 'loop' || !R.route.closed, sphere = moving ? new THREE.Sphere(new THREE.Vector3(), pad + back * 0.5 + 2) : sphereOfPoints(R.route.data, 4, R.route.N, pad);
  const follow = moving ? (s) => { R.route.pointAt(s - back * 0.5, sphere.center); } : () => {};
  return { sphere, follow };
}

// ---------- reach and clearance (keeping bodies off the camera path by place) ----------
// Radius of a winged model about its origin with the wings anywhere in their beat: a wing vertex swings its aAnim.x metres about its
// root (k > 1 allows for what a shader adds to that arm). Model units, before the instance scale.
export function wingReach(base, k = 1) {
  const ps = base.attributes.position, an = base.attributes.aAnim; let r = 0;
  for (let i = 0; i < ps.count; i++) { const d = Math.abs(an.getY(i)) > 0.5 ? an.getX(i) : 0; r = Math.max(r, Math.hypot(Math.abs(ps.getX(i)) - d, ps.getY(i), ps.getZ(i)) + d * k); }
  return r;
}
// The same for a wing that turns about a hinge lying along z through its root, keeping its z (the insects' beat): the true radius.
// wingReach adds the arm to the whole distance from the origin, which reads too large for a wing that is long along z.
export function hingeReach(base, k = 1) {
  const ps = base.attributes.position, an = base.attributes.aAnim; let r = 0;
  for (let i = 0; i < ps.count; i++) { const d = Math.abs(an.getY(i)) > 0.5 ? an.getX(i) : 0; r = Math.max(r, Math.hypot(Math.hypot(Math.abs(ps.getX(i)) - d, ps.getY(i)) + d * k, ps.getZ(i))); }
  return r;
}
// A camera path as a flat xyz polyline for distance tests. src: [[x,y,z]|Vector3,...] or a flat typed array (taken as given), a path
// ({ posAtDist, length }), or a function (d, out) -> position at d metres (give o.length) or at the fraction d (without it, 512 points);
// paths and functions are sampled every o.step metres (0.5) between the path fractions o.from..o.to (0..1), and the line then carries
// sag: twice what the curve can bulge off it between two of its points.
export function pathLine(src, o = {}) {
  if (ArrayBuffer.isView(src)) return src;
  if (Array.isArray(src)) { const a = new Float64Array(src.length * 3); src.forEach((p, i) => a.set([p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]], i * 3)); return a; }
  const fn = typeof src === 'function', at = fn ? src : (d, out) => src.posAtDist(d, out), L = o.length ?? (fn ? 1 : src.length), d0 = (o.from ?? 0) * L, d1 = (o.to ?? 1) * L;
  const n = fn && o.length === undefined ? 512 : Math.max(1, Math.ceil((d1 - d0) / (o.step ?? 0.5))), a = new Float64Array((n + 1) * 3), p = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { const q = at(d0 + (d1 - d0) * (i / n), p) || p; a.set([q.x ?? q[0], q.y ?? q[1], q.z ?? q[2]], i * 3); }
  a.sag = 0; for (let i = 3; i < n * 3; i += 3) a.sag = Math.max(a.sag, Math.hypot(a[i - 3] - 2 * a[i] + a[i + 3], a[i - 2] - 2 * a[i + 1] + a[i + 4], a[i - 1] - 2 * a[i + 2] + a[i + 5]) / 4);
  return a;
}
// Distance from a point to that polyline (or to its segments i0..i1 only); the nearest point of the line is written to out.
const _q = new THREE.Vector3(), _fw = new THREE.Vector3(), _fw0 = new THREE.Vector3();
export function lineDist(line, x, y, z, out = _q, i0 = 0, i1 = line.length / 3 - 1) {
  let best = Infinity;
  for (let i = Math.max(0, i0), n = line.length / 3; i < Math.max(1, Math.min(n - 1, i1)); i++) {
    const a = i * 3, b = Math.min(n - 1, i + 1) * 3, ax = line[a], ay = line[a + 1], az = line[a + 2], ex = line[b] - ax, ey = line[b + 1] - ay, ez = line[b + 2] - az, ll = ex * ex + ey * ey + ez * ez;
    const t = ll > 0 ? Math.min(1, Math.max(0, ((x - ax) * ex + (y - ay) * ey + (z - az) * ez) / ll)) : 0, qx = ax + ex * t, qy = ay + ey * t, qz = az + ez * t, d = (x - qx) * (x - qx) + (y - qy) * (y - qy) + (z - qz) * (z - qz);
    if (d < best) { best = d; out.set(qx, qy, qz); }
  }
  return Math.sqrt(best);
}
// Shift a baked route so that whatever rides it stays need = o.dist (2) + reach metres from the camera path, by place. offsets: flat
// [x, y, z] of each rider from the course (frame: x across the course as the flock shader lays a vee, else world axes); none: one
// rider on the course. Each pass looks at every rider on the spline the shader flies (4 places per sample; what the spline can lose
// between two of them and the path's sag are added to need) and, where one is too near, pushes the course straight away from the
// nearest point of the path, by the most any rider lacks and in the mean direction of their pushes (the larger weighing far more);
// where riders either side of the path pull against each other the course goes straight up, and upward only from then on. Without
// o.ease the whole course moves bodily and keeps its shape; with o.ease (metres) only the stretch that is too near moves, the push
// dying away over that distance to either side (a hump over or round the path). Takes no draw.
// o: { path, dist, reach (the course alone, by this much, instead of the riders by theirs), ease, up (true: no push goes downward,
// for a course low over ground or water), from, to, step, length }. Returns { need, moved: the largest shift of a sample (m),
// shift: [x, y, z] of that sample (of the whole course without ease), short: what is still missing after 32 passes (0 = clear) }.
// route.length and route.curve keep their old values: the group flies the shifted course on the old clock.
// o.each (with offsets): the course stays where it is and each rider that is too near is moved by its own offset instead, by what it
// alone lacks, away from the path (a framed rider across the heading and up or down, so that one beside the path stays beside it; a
// rider pulled both ways goes straight up, and upward only from then on; o.up: no rider is pushed downward). offsets is written in
// place. Returns { need, moved: the largest move of a rider (m), shift: that rider's move in its offset's own axes, short, each: true,
// count: how many riders moved }. o.ease does nothing with o.each.
// keepClear.each on a soar. A soaring member wheels in a flat ring about its own centre, so what it keeps out is a low drum (rh metres
// round in plan, hv up and down, its body in both), not a ball. The course stays; a member whose drum the path enters is moved straight
// up by what it alone lacks over the stretch of the path its drum stands over (or straight down, where that is nearer and `up` is not
// asked). A move up or down does not change which stretch that is, so one pass is exact and nothing is searched twice.
function* clearDrums(route, o, offsets, drum, lead = 0, chunk = 0) {
  const line = pathLine(o.path, o), np = line.length / 3, dist = o.dist ?? 2, rh = drum.rh + dist, hv = drum.hv + dist, riders = offsets.length / 3, N = route.N, M0 = (route.closed ? N : N - 1) * 4, ne = route.closed ? 0 : Math.ceil(lead / (route.length / M0)), M = M0 + ne, p = new THREE.Vector3();
  // (an open course shows its members up to `lead` metres before its start, on the course carried straight on: those places are walked too)
  const C = new Float64Array((M + 1) * 3); for (let j = 0; j <= M; j++) { route.pointAt(((j - ne) / M0) * route.length, p); C[j * 3] = p.x; C[j * 3 + 1] = p.y; C[j * 3 + 2] = p.z; }
  // between two samples a centre or the path can be half a step nearer in plan and half a step's rise nearer in height
  let seg = 0, rise = 0, step = 0, climb = 0, off = 0;
  for (let i = 3; i < np * 3; i += 3) { seg = Math.max(seg, Math.hypot(line[i] - line[i - 3], line[i + 2] - line[i - 1])); rise = Math.max(rise, Math.abs(line[i + 1] - line[i - 2])); }
  for (let j = 3; j <= M * 3; j += 3) { step = Math.max(step, Math.hypot(C[j] - C[j - 3], C[j + 2] - C[j - 1])); climb = Math.max(climb, Math.abs(C[j + 1] - C[j - 2])); }
  for (let r = 0; r < riders; r++) off = Math.max(off, Math.hypot(offsets[r * 3], offsets[r * 3 + 2]));
  const R = rh + (seg + step) / 2 + (line.sag || 0), R2 = R * R, H = hv + (rise + climb) / 2 + (line.sag || 0), far = R + off, far2 = far * far;
  const upN = new Float64Array(riders).fill(-Infinity), dnN = new Float64Array(riders).fill(-Infinity), hit = new Uint8Array(riders), cand = new Int32Array(np);
  // the path in blocks of 16 samples with a ring round each in plan, so that a centre far from a block passes it over whole
  const BK = 16, nb = Math.ceil(np / BK), ring = new Float64Array(nb * 3);
  for (let b = 0; b < nb; b++) { const i0 = b * BK, i1 = Math.min(np, i0 + BK); let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity, rr = 0;
    for (let i = i0; i < i1; i++) { const x = line[i * 3], z = line[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (let i = i0; i < i1; i++) rr = Math.max(rr, Math.hypot(line[i * 3] - cx, line[i * 3 + 2] - cz));
    ring[b * 3] = cx; ring[b * 3 + 1] = cz; ring[b * 3 + 2] = rr; }
  let work = 0; if (chunk) yield;                              // (stepped: a hand-back after every chunk * 256 looks of a drum at a sample of the path)
  for (let j = 0; j <= M; j++) { const px = C[j * 3], py = C[j * 3 + 1], pz = C[j * 3 + 2]; let n = 0;
    if (chunk && work >= chunk * 256) { work = 0; yield; }
    for (let b = 0; b < nb; b++) { const ex = ring[b * 3] - px, ez = ring[b * 3 + 1] - pz, out = ring[b * 3 + 2] + far; if (ex * ex + ez * ez > out * out) continue;
      for (let i = b * BK, i1 = Math.min(np, i + BK); i < i1; i++) { const dx = line[i * 3] - px, dz = line[i * 3 + 2] - pz; if (dx * dx + dz * dz <= far2) cand[n++] = i; } }
    if (!n) continue;
    work += n * riders;
    for (let r = 0; r < riders; r++) { const cx = px + offsets[r * 3], cy = py + offsets[r * 3 + 1], cz = pz + offsets[r * 3 + 2];
      for (let k = 0; k < n; k++) { const i = cand[k] * 3, dx = line[i] - cx, dz = line[i + 2] - cz; if (dx * dx + dz * dz > R2) continue;
        const y = line[i + 1], u = y + H - cy, d = cy + H - y; if (u > upN[r]) upN[r] = u; if (d > dnN[r]) dnN[r] = d; if (u > 0 && d > 0) hit[r] = 1; } } }
  let moved = 0, count = 0; const shift = [0, 0, 0];
  for (let r = 0; r < riders; r++) { if (!hit[r]) continue; const dy = (o.up || upN[r] <= dnN[r] ? upN[r] : -dnN[r]) + 1e-3; offsets[r * 3 + 1] += dy; count++; if (Math.abs(dy) > moved) { moved = Math.abs(dy); shift[1] = dy; } }
  return { need: hv, moved, shift, short: 0, each: true, drum: true, count };
}
// The clearing as steps (since s0r): the same work in the same order, handing back (a bare yield) after every `chunk` rider checks,
// after each plumb rise and between passes; chunk 0 never hands back. clearRoute runs it through at once; clearRouteAsync awaits `y`
// (ctx.yield) at each hand-back, so that no build step carries a whole clearing. Between two hand-backs nothing is kept in the kit's
// shared scratch: what a step reads it has written itself.
export function* clearSteps(route, o, reach = 0, offsets = null, frame = false, drum = null, lead = 0, chunk = 0) {
  if (o.reach !== undefined) { reach = o.reach; offsets = null; }
  if (o.each && offsets && drum) return yield* clearDrums(route, o, offsets, drum, lead, chunk);
  const line = pathLine(o.path, o), np = line.length / 3, need = (o.dist ?? 2) + reach, riders = offsets ? offsets.length / 3 : 1, D = route.data, N = route.N, shut = route.closed;
  // each: the course never moves, so it is walked no finer than it needs: places about a metre apart, one to four between two knots (the
  // bodily shift keeps its four, to the bit)
  let m = 4; if (o.each && offsets) { let g0 = 0; for (let i = 0; i < (shut ? N : N - 1); i++) { const a = i * 4, b = ((i + 1) % N) * 4; g0 = Math.max(g0, Math.hypot(D[b] - D[a], D[b + 1] - D[a + 1], D[b + 2] - D[a + 2])); } m = Math.max(1, Math.min(4, Math.ceil(g0))); }
  const M = (shut ? N : N - 1) * m;
  const wide = o.ease ? Math.max(1e-6, o.ease * (M / m) / route.length) : 0, at = (c) => (shut ? ((c % N) + N) % N : Math.min(N - 1, Math.max(0, c))) * 4;
  const was = D.slice(), push = new Float64Array(N), p = new THREE.Vector3(), shift = [0, 0, 0];
  // the flock shader's own heading at s metres: the level chord to 5 m ahead (a vee's x runs across it)
  const head = (s, out) => { route.pointAt(s + 5, out).sub(route.pointAt(s, p)); out.y = 0; out.z += 1e-5; return out.normalize(); };
  let up = !!o.up, off = 0, seg = 0, short = 0, moved = 0;
  // each: an open course shows its members up to `lead` metres before its start (the shader reads the end fade ahead and carries the course
  // straight on): those places are walked too
  const each = !!o.each && !!offsets, ne = each && !shut ? Math.ceil(lead / (route.length / M)) : 0, E = each ? new Float64Array(riders * 5) : null, upR = each ? new Uint8Array(riders).fill(up ? 1 : 0) : null, off0 = each ? offsets.slice() : null;
  // each: a rider found clear stays clear, since the course does not move: only the riders moved in the last pass are looked at again
  const act = each ? new Uint8Array(riders).fill(1) : null, tries = each ? new Uint8Array(riders) : null;
  for (let r = 0; offsets && r < riders; r++) off = Math.max(off, Math.hypot(offsets[r * 3], offsets[r * 3 + 1], offsets[r * 3 + 2]));
  for (let i = 3; i < np * 3; i += 3) seg = Math.max(seg, Math.hypot(line[i] - line[i - 3], line[i + 1] - line[i - 2], line[i + 2] - line[i - 1]));
  // how far each rider stands from its place on the course (a framed rider's x is laid level across the heading, so its z is unused)
  const away = new Float64Array(riders); for (let r = 0; offsets && r < riders; r++) away[r] = frame ? Math.hypot(offsets[r * 3], offsets[r * 3 + 1]) : Math.hypot(offsets[r * 3], offsets[r * 3 + 1], offsets[r * 3 + 2]);
  // the path in blocks of 16 samples, each with a ball round it (centre, radius), made once: a block whose ball lies wholly outside
  // the search radius holds no sample inside it and is passed over, so the search below finds the same first and last sample
  const BK = 16, nb = Math.ceil(np / BK), ball = new Float64Array(nb * 4);
  for (let b = 0; b < nb; b++) { const i0 = b * BK, i1 = Math.min(np, i0 + BK); let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity, rr = 0;
    for (let i = i0; i < i1; i++) { const x = line[i * 3], y = line[i * 3 + 1], z = line[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2; for (let i = i0; i < i1; i++) rr = Math.max(rr, Math.hypot(line[i * 3] - cx, line[i * 3 + 1] - cy, line[i * 3 + 2] - cz));
    ball[b * 4] = cx; ball[b * 4 + 1] = cy; ball[b * 4 + 2] = cz; ball[b * 4 + 3] = rr; }
  // lineDist over the segments i0..i1, passing over every block whose ball lies farther than T + seg from the point: a segment within
  // T of the point has its first sample within T + seg, so whatever is nearer than T is found, the same segment first, to the bit
  const near = (x, y, z, i0, i1, T) => {
    let best = Infinity; const a0 = Math.max(0, i0), a1 = Math.max(1, Math.min(np - 1, i1));
    for (let b = Math.floor(a0 / BK); b * BK < a1; b++) {
      const ex = ball[b * 4] - x, ey = ball[b * 4 + 1] - y, ez = ball[b * 4 + 2] - z, out = (ball[b * 4 + 3] + seg + T) * (1 + 1e-9) + 1e-9; if (ex * ex + ey * ey + ez * ez > out * out) continue;
      for (let i = Math.max(a0, b * BK), e = Math.min(a1, b * BK + BK); i < e; i++) {
        const a = i * 3, c = Math.min(np - 1, i + 1) * 3, ax = line[a], ay = line[a + 1], az = line[a + 2], sx = line[c] - ax, sy = line[c + 1] - ay, sz = line[c + 2] - az, ll = sx * sx + sy * sy + sz * sz;
        const t = ll > 0 ? Math.min(1, Math.max(0, ((x - ax) * sx + (y - ay) * sy + (z - az) * sz) / ll)) : 0, qx = ax + sx * t, qy = ay + sy * t, qz = az + sz * t, d = (x - qx) * (x - qx) + (y - qy) * (y - qy) + (z - qz) * (z - qz);
        if (d < best) { best = d; _q.set(qx, qy, qz); }
      }
    }
    return Math.sqrt(best);
  };
  // each: a rider sent straight up beside a climbing stretch of the path would creep, a move by what it lacks only meeting the next bit
  // of the climb. Its rise is found in one go instead: at a place of the course, the heights at which the rider would stand within its
  // limit of one segment of the path are where a plumb line passes through that segment made round (a ball at its first point, a bar to
  // the next); the least rise that lies in none of them, over every place of the course, is taken.
  let CJ = null;
  const rise = (r, T0) => {
    if (!CJ) { CJ = new Float64Array((M + ne + 1) * 5); for (let j = -ne; j <= M; j++) { const s = (j / M) * route.length, c = (j + ne) * 5; if (frame) { head(s, _fw); CJ[c + 3] = _fw.x; CJ[c + 4] = _fw.z; } route.pointAt(s, p); CJ[c] = p.x; CJ[c + 1] = p.y; CJ[c + 2] = p.z; } }
    const ox = offsets[r * 3], oy = offsets[r * 3 + 1], oz = offsets[r * 3 + 2], T = T0 * (1 + 1e-9) + 1e-6, T2 = T * T, iv = [];
    for (let j = shut ? 1 : -ne; j <= M; j++) { const c = (j + ne) * 5, rx = CJ[c] + (frame ? CJ[c + 4] * ox : ox), ry = CJ[c + 1] + oy, rz = CJ[c + 2] + (frame ? -CJ[c + 3] * ox : oz);
      for (let b = 0; b < nb; b++) { const ex = ball[b * 4] - rx, ez = ball[b * 4 + 2] - rz, out = ball[b * 4 + 3] + seg + T; if (ex * ex + ez * ez > out * out) continue;
        for (let i = b * BK, e = Math.min(np - 1, b * BK + BK); i < e; i++) {
          const a = i * 3, sx = line[a + 3] - line[a], sy = line[a + 4] - line[a + 1], sz = line[a + 5] - line[a + 2], wx = rx - line[a], wy = ry - line[a + 1], wz = rz - line[a + 2];
          const ha = T2 - wx * wx - wz * wz; if (ha > 0) { const h = Math.sqrt(ha); if (h - wy > 0) iv.push([-wy - h, -wy + h]); }
          if (i === np - 2) { const vx = wx - sx, vz = wz - sz, hb = T2 - vx * vx - vz * vz; if (hb > 0) { const h = Math.sqrt(hb), m0 = sy - wy; if (m0 + h > 0) iv.push([m0 - h, m0 + h]); } }
          const L2 = sx * sx + sy * sy + sz * sz; if (!(L2 > 0)) continue;
          const ws = wx * sx + wy * sy + wz * sz, A = 1 - sy * sy / L2, B = 2 * (wy - ws * sy / L2), K = wx * wx + wy * wy + wz * wz - ws * ws / L2 - T2; let d1 = 1, d2 = 0;
          if (A > 1e-12) { const q = B * B - 4 * A * K; if (q > 0) { const sq = Math.sqrt(q); d1 = (-B - sq) / (2 * A); d2 = (-B + sq) / (2 * A); } } else if (K < 0) { d1 = -Infinity; d2 = Infinity; }
          if (sy > 1e-12) { d1 = Math.max(d1, -ws / sy); d2 = Math.min(d2, (L2 - ws) / sy); } else if (sy < -1e-12) { d1 = Math.max(d1, (L2 - ws) / sy); d2 = Math.min(d2, -ws / sy); } else if (ws < 0 || ws > L2) continue;
          if (d1 < d2 && d2 > 0) iv.push([d1, d2]);
        } } }
    iv.sort((a, b) => a[0] - b[0]); let dy = 0; for (const [lo, hi] of iv) { if (lo > dy) break; if (hi > dy) dy = hi; }
    return dy;
  };
  const last = each ? 64 : 32;                                // (each: the later passes look at the moved riders alone and are cheap)
  let work = 0; if (chunk) yield;
  for (let pass = 0; need > 0 && pass <= last; pass++) {
    // between two checks the spline can come nearer by its chord's dip toward the path plus its own sag off the chord, and a rider
    // laid across the course by twice what the heading turns there
    let gap = 0, bend = 0, turn = 0, sx = 0, sy = 0, sz = 0, sw = 0, top = 0;
    for (let i = 0; i < N; i++) { const a = at(i), b = at(i + 1), c = at(i + 2); gap = Math.max(gap, Math.hypot(D[b] - D[a], D[b + 1] - D[a + 1], D[b + 2] - D[a + 2])); bend = Math.max(bend, Math.hypot(D[a] - 2 * D[b] + D[c], D[a + 1] - 2 * D[b + 1] + D[c + 1], D[a + 2] - 2 * D[b + 2] + D[c + 2])); }
    for (let j = 0; frame && j <= M; j++) { head((j / M) * route.length, _fw); if (j) turn = Math.max(turn, _fw.distanceTo(_fw0)); _fw0.copy(_fw); }
    const lim = need + (line.sag || 0) + need - Math.sqrt(Math.max(0, need * need - (gap / m) * (gap / m) / 4)) + bend / (8 * m * m) + 2 * off * turn, R = (lim + off + seg) * (lim + off + seg), Rs = Math.sqrt(R) * (1 + 1e-9) + 1e-9;
    push.fill(0); short = 0;
    for (let j = shut ? 1 : -ne; j <= M; j++) {
      route.pointAt((j / M) * route.length, p);
      // the stretch of the path a rider here could be too near to
      let lo = np, hi = -1;
      for (let b = 0; b < nb; b++) { const ex = ball[b * 4] - p.x, ey = ball[b * 4 + 1] - p.y, ez = ball[b * 4 + 2] - p.z, far = ball[b * 4 + 3] + Rs; if (ex * ex + ey * ey + ez * ez > far * far) continue;
        for (let i = b * BK, i1 = Math.min(np, i + BK); i < i1; i++) { const dx = line[i * 3] - p.x, dy = line[i * 3 + 1] - p.y, dz = line[i * 3 + 2] - p.z; if (dx * dx + dy * dy + dz * dz < R) { if (hi < 0) lo = i; hi = i; } } }
      if (hi < 0) continue;
      // the course's own place against the same stretch, once: a rider cannot be nearer the path than that less its own distance from
      // the course, so one that would still be clear by that sum is passed over without its own search (the same riders are pushed)
      const d0 = riders > 1 ? near(p.x, p.y, p.z, lo - 1, hi + 1, lim + off) : 0;
      if (frame) head((j / M) * route.length, _fw);
      for (let r = 0; r < riders; r++) {
        if (d0 - away[r] > lim + 1e-6 || (each && !act[r])) continue;
        work++;
        const ox = offsets ? offsets[r * 3] : 0, oy = offsets ? offsets[r * 3 + 1] : 0, oz = offsets ? offsets[r * 3 + 2] : 0, rx = p.x + (frame ? _fw.z * ox : ox), ry = p.y + oy, rz = p.z + (frame ? -_fw.x * ox : oz);
        // (each: a rider is held to its own reach across the heading, which is all a turn of the heading can swing, not to the farthest rider's)
        const limR = each ? lim - 2 * (off - Math.abs(ox)) * turn : lim, d = near(rx, ry, rz, lo - 1, hi + 1, limR); if (d >= limR) continue;
        const g = (limR - d) * 1.05 + 0.01, k = d > 1e-6 ? 1 / d : 0, w = g * g * g * g, x = j / m;
        short = Math.max(short, limR - d);
        // each: the rider's own sums, in its offset's axes (a framed rider: across the heading, up, nothing along)
        if (each) { const vx = (rx - _q.x) * k, vy = k ? (upR[r] ? Math.abs(ry - _q.y) : ry - _q.y) * k : 1, vz = (rz - _q.z) * k, e = r * 5;
          E[e] += (frame ? vx * _fw.z - vz * _fw.x : vx) * w; E[e + 1] += vy * w; E[e + 2] += (frame ? 0 : vz) * w; E[e + 3] += w; E[e + 4] = Math.max(E[e + 4], g); continue; }
        top = Math.max(top, g);
        sx += (rx - _q.x) * k * w; sy += (k ? (up ? Math.abs(ry - _q.y) : ry - _q.y) * k : 1) * w; sz += (rz - _q.z) * k * w; sw += w;
        // with ease: the samples that carry this place take its push whole, those up to `wide` beyond a share falling off as a cosine
        // (only the samples within wide + 1 of this place can take a share: the walk is over those alone, each once, and gives each the same share as a walk over all)
        if (wide) { const span = wide + 1, k0 = span * 2 + 3 < N ? Math.floor(x - span) - 1 : 0, k1 = span * 2 + 3 < N ? Math.ceil(x + span) + 1 : N - 1;
          for (let k = k0; k <= k1; k++) { const i = shut ? ((k % N) + N) % N : k; if (i < 0 || i >= N) continue; let e = Math.abs(i - x); if (shut) e = Math.min(e, N - e); e = Math.max(0, e - 1) / wide; if (e < 1) push[i] = Math.max(push[i], g * (0.5 + 0.5 * Math.cos(Math.PI * e))); } }
      }
      if (chunk && work >= chunk) { work = 0; yield; }
    }
    if (!short || pass === last) break;                       // the last pass only measures
    // (each, framed: where the heading turns sharply, as at an open course's end, a move across it only widens what the turn can swing: straight up there)
    if (each) { const offP = off; off = 0; if (frame && turn >= 0.25) upR.fill(2);
      for (let r = 0; r < riders; r++) { const e = r * 5, a = r * 3;
        if (E[e + 4]) { let x = E[e], y = E[e + 1], z = E[e + 2], l = Math.hypot(x, y, z), plumb = false; if (l < 0.5 * E[e + 3] || ++tries[r] > 6 || upR[r] === 2) { upR[r] = 1; x = z = 0; y = l = 1; plumb = true; }
        // (straight up: the whole rise at once, see rise above; never less than what the pass found lacking)
        const c = plumb ? Math.max(E[e + 4], rise(r, lim - 2 * (offP - Math.abs(offsets[a])) * turn) + 0.01) : E[e + 4] / l;   // pulled both ways, or still too near after six moves of its own: straight up from now on
        offsets[a] += x * c; offsets[a + 1] += y * c; offsets[a + 2] += z * c; if (chunk && plumb) yield; }
        act[r] = E[e + 4] ? 1 : 0; away[r] = frame ? Math.hypot(offsets[a], offsets[a + 1]) : Math.hypot(offsets[a], offsets[a + 1], offsets[a + 2]); off = Math.max(off, Math.hypot(offsets[a], offsets[a + 1], offsets[a + 2])); }
      E.fill(0); if (chunk) { work = 0; yield; } continue; }
    let l = Math.hypot(sx, sy, sz); if (l < 0.5 * sw) { up = true; sx = sz = 0; sy = l = 1; }
    for (let i = 0; i < N; i++) { const c = (wide ? push[i] : top) / l; D[i * 4] += sx * c; D[i * 4 + 1] += sy * c; D[i * 4 + 2] += sz * c; }
    if (chunk) { work = 0; yield; }
  }
  for (let a = 0; a < N * 4; a += 4) { const l = Math.hypot(D[a] - was[a], D[a + 1] - was[a + 1], D[a + 2] - was[a + 2]); if (l > moved) { moved = l; shift[0] = D[a] - was[a]; shift[1] = D[a + 1] - was[a + 1]; shift[2] = D[a + 2] - was[a + 2]; } }
  if (each) { let count = 0; for (let a = 0; a < riders * 3; a += 3) { const x = offsets[a] - off0[a], y = offsets[a + 1] - off0[a + 1], z = offsets[a + 2] - off0[a + 2], l = Math.hypot(x, y, z); if (l > 0) count++; if (l > moved) { moved = l; shift[0] = x; shift[1] = y; shift[2] = z; } } return { need, moved, shift, short, each: true, count }; }
  route.texture.needsUpdate = true;
  return { need, moved, shift, short };
}
export function clearRoute(route, o, reach = 0, offsets = null, frame = false, drum = null, lead = 0) { const it = clearSteps(route, o, reach, offsets, frame, drum, lead, 0); let s = it.next(); while (!s.done) s = it.next(); return s.value; }
export async function clearRouteAsync(route, o, reach, offsets, frame, drum, lead, y, chunk = 256) { const it = clearSteps(route, o, reach, offsets, frame, drum, lead, Math.max(1, chunk)); let s = it.next(); while (!s.done) { await y(); s = it.next(); } return s.value; }

// ---------- shared creature shader ----------
export const GLSL_UTIL = /* glsl */`
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
vec3 h31(float n){ return fract(sin(vec3(n*127.1, n*269.5+1.7, n*419.2+3.1))*43758.5453); }
mat2 rot2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
`;
export const GLSL_ROUTE = /* glsl */`
uniform sampler2D uRoute; uniform vec3 uRouteInfo;
vec3 routeTex(float i){ float N=uRouteInfo.x; i = uRouteInfo.z>.5 ? mod(i,N) : clamp(i,0.,N-1.); return texelFetch(uRoute, ivec2(int(i+.5),0), 0).xyz; }
vec3 routeAt(float s){
  float N=uRouteInfo.x, L=uRouteInfo.y, f=s/L, fc=f, x;
  if(uRouteInfo.z>.5) x=fract(f)*N; else { fc=clamp(f,0.,1.); x=fc*(N-1.); }
  float i=floor(x), k=x-i, k2=k*k, k3=k2*k;
  vec3 p = routeTex(i-1.)*((1.-3.*k+3.*k2-k3)/6.) + routeTex(i)*((3.*k3-6.*k2+4.)/6.) + routeTex(i+1.)*((-3.*k3+3.*k2+3.*k+1.)/6.) + routeTex(i+2.)*(k3/6.);
  if(uRouteInfo.z<.5 && f!=fc){ float e = f>1. ? N-1. : 1.; p += normalize(routeTex(e)-routeTex(e-1.))*(f-fc)*L; }
  return p;
}
// open routes: 0 at both ends so groups never pop in or out (closed loops: 1)
float endFade(float s){ float f = s / uRouteInfo.y; return uRouteInfo.z > .5 ? 1. : smoothstep(0., .05, f) * (1. - smoothstep(.95, 1., f)); }
`;
const VERT_HEAD = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 aAnim; attribute vec3 aPivot; attribute float aGlow;
#ifdef INSTANCED
attribute vec4 iA; attribute vec4 iB; attribute vec3 iTint;
#endif
uniform float uTime, uPhase, uQ, uEps, uSpineK, uBank, uScale, uVis; uniform vec2 uNear;
uniform vec3 uGlowColor; uniform vec4 uGlowAnim;
varying vec3 vColor, vN, vWorld, vEmit; varying float vThin; varying vec3 vLocal;
float gThin = 0.; vec3 gEmit = vec3(0.); float gFade = 1.; float gYaw = 0.;
`;
const VERT_MAIN = /* glsl */`
void frameAt(float q, out vec3 P, out vec3 F, out vec3 X, out vec3 U){
  #ifdef UPRIGHT
  P = traj(q); float cy = cos(gYaw), sy = sin(gYaw); F = vec3(sy, 0., cy); X = vec3(cy, 0., -sy); U = vec3(0., 1., 0.); return;
  #endif
  vec3 a = traj(q), b = traj(q + uEps); vec3 d = b - a; float l = length(d);
  F = l > 1e-6 ? d / l : vec3(0., 0., 1.);
  #ifdef LEVEL
  F = normalize(vec3(F.x, F.y * LEVEL, F.z) + vec3(0., 0., 1e-6));
  #endif
  X = cross(vec3(0., 1., 0.), F); float xl = length(X); X = xl > 1e-4 ? X / xl : vec3(1., 0., 0.);
  U = cross(F, X);
  #ifdef BANK
  vec3 c = traj(q + 2. * uEps); vec3 d2 = c - b; float l2 = length(d2);
  float roll = l2 > 1e-6 ? clamp(dot(d2 / l2 - F, X) / uEps * uBank, -1.2, 1.2) : 0.;
  X = X * cos(roll) - U * sin(roll); U = cross(F, X);
  #endif
  P = a;
}
void main(){
  vec3 p = position, n = normal;
  vColor = color;
  #ifdef INSTANCED
  vColor *= iTint;
  #endif
  vLocal = position;
  gEmit = uGlowColor * aGlow * (uGlowAnim.x + uGlowAnim.y * sin(uTime * uGlowAnim.z - position.z * uGlowAnim.w));
  deform(p, n);
  float sc = uScale;
  #ifdef INSTANCED
  sc *= iB.x;
  #endif
  p *= sc;
  float q = uQ; vec3 P, F, X, U;
  #ifdef SPINE
  vec3 P0 = traj(q);
  p *= gFade * uVis * smoothstep(uNear.x, uNear.y, distance(cameraPosition, (modelMatrix * vec4(P0, 1.)).xyz));
  q += p.z * uSpineK; frameAt(q, P, F, X, U);
  vec3 w = P + X * p.x + U * p.y;
  #else
  frameAt(q, P, F, X, U);
  gFade *= uVis * smoothstep(uNear.x, uNear.y, distance(cameraPosition, (modelMatrix * vec4(P, 1.)).xyz));
  vec3 w = P + (X * p.x + U * p.y + F * p.z) * gFade;
  #endif
  vec3 nn = X * n.x + U * n.y + F * n.z;
  vec4 wp = modelMatrix * vec4(w, 1.);
  vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * nn); vEmit = gEmit; vThin = gThin;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
export const FRAG_LIT = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSunColor, uSkyColor, uGroundColor;
uniform float uRim, uSpec, uShine, uTrans, uOpacity, uTime, uCaustics, uVivid, uThinAlpha, uBack, uFill;
varying vec3 vColor, vN, vWorld, vEmit, vLocal; varying float vThin;
vec3 gEmitF = vec3(0.);   // pattern() may add emission here
//PATTERN_FN
void main(){
  if(uThinAlpha < 1. && vThin > .5){ vec2 fc = gl_FragCoord.xy; if(fract(52.9829189 * fract(dot(fc, vec2(.06711056, .00583715)))) > uThinAlpha) discard; }
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld);
  float ndl = dot(N, uSunDir);
  float dif = max(ndl, 0.) * .8 + .2 * max(ndl * .5 + .5, 0.);
  float cau = 1.;
  if(uCaustics > 0.){ vec2 cp = vWorld.xz * .35 + vWorld.y * .1; float c1 = sin(cp.x * 1.7 + uTime * 1.3 + sin(cp.y * 2.1 - uTime * .9)); float c2 = sin(cp.y * 1.9 - uTime * 1.1 + sin(cp.x * 2.3 + uTime * .7)); cau = 1. + uCaustics * (pow(.5 + .5 * c1 * c2, 3.) * 2.2 - .35) * smoothstep(-.2, .6, N.y); }
  vec3 hemi = mix(uGroundColor, uSkyColor, N.y * .5 + .5) + uSunColor * uFill;
  vec3 lit = hemi + uSunColor * dif * cau;
  lit = mix(lit, vec3(dot(lit, vec3(.3, .5, .2))), uVivid);
  vec3 alb = vColor;
  #ifdef PATTERN
  alb = pattern(alb, vLocal, vThin);
  #endif
  vec3 c = alb * lit * .3183;
  c += alb * uSunColor * (uTrans * vThin * max(-ndl, 0.) * .3183);
  float fr = pow(1. - max(dot(N, V), 0.), 3.);
  c += mix(uGroundColor, uSkyColor, .7) * (fr * uRim * .3183);
  c += uSunColor * (.25 + alb) * (uBack * pow(1. - max(dot(N, V), 0.), 2.) * smoothstep(-.1, .9, dot(-V, uSunDir)) * smoothstep(-.6, .3, ndl) * .3183);
  vec3 H = normalize(V + uSunDir);
  c += uSunColor * (pow(max(dot(N, H), 0.), uShine) * uSpec * .3183) * (.4 + alb);
  c += vEmit + gEmitF;
  gl_FragColor = vec4(max(c, 0.), uOpacity);   // never negative: with antialiasing a sample on a hair-thin wing tip reads vColor below zero (a crew's float check found it)
  #include <fog_fragment>
}
`;
// spec: { traj, deform, pre, spine, bank, level, instanced, route, light, uniforms, frag, transparent, blending, depthWrite, side, rim, spec, shine, trans, opacity, caustics, eps, glow, glowAnim }
export function creatureMaterial(s) {
  const L = resolveLight(s.light);
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightUniforms(L),
    uTime: { value: 0 }, uPhase: { value: 0 }, uVis: { value: 1 }, uNear: { value: new THREE.Vector2(s.near ? s.near[0] : 0, s.near ? s.near[1] : 0.001) }, uQ: { value: 0 }, uEps: { value: s.eps ?? 1 }, uSpineK: { value: s.spineK ?? 1 }, uBank: { value: s.bank ?? 0 }, uScale: { value: s.scale ?? 1 },
    uGlowColor: { value: col(s.glow ?? '#000000') }, uGlowAnim: { value: new THREE.Vector4(...(s.glowAnim || [1, 0, 1, 0])) },
    uRim: { value: s.rim ?? 0.25 }, uSpec: { value: s.spec ?? 0 }, uShine: { value: s.shine ?? 24 }, uTrans: { value: s.trans ?? 0 }, uOpacity: { value: s.opacity ?? 1 }, uCaustics: { value: s.caustics ?? 0 }, uVivid: { value: s.vivid ?? 0 }, uThinAlpha: { value: s.thinAlpha ?? 1 }, uBack: { value: s.back ?? 0.9 }, uFill: { value: s.fill ?? 0.13 },
    ...(s.route ? s.route.uniforms : {}), ...(s.uniforms || {}),
  };
  const defines = {};
  if (s.instanced) defines.INSTANCED = 1;
  if (s.spine) defines.SPINE = 1;
  if (s.bank) defines.BANK = 1;
  if (s.upright) defines.UPRIGHT = 1;
  if (s.level !== undefined) defines.LEVEL = Number(s.level).toFixed(3);
  Object.assign(defines, s.defines || {});
  const material = new THREE.ShaderMaterial({
    uniforms, defines, fog: true, vertexColors: true,
    vertexShader: VERT_HEAD + GLSL_UTIL + (s.route ? GLSL_ROUTE : '') + (s.pre || '') + s.traj + (s.deform || 'void deform(inout vec3 p, inout vec3 n){}') + VERT_MAIN,
    fragmentShader: (s.frag || FRAG_LIT).replace('//PATTERN_FN', s.pattern || ''),
    side: s.side ?? THREE.DoubleSide, transparent: !!s.transparent, depthWrite: s.depthWrite ?? !s.transparent,
    blending: s.blending ?? THREE.NormalBlending, premultipliedAlpha: !!s.premultiplied,
  });
  if (s.polygonOffset) { material.polygonOffset = true; material.polygonOffsetFactor = -2; material.polygonOffsetUnits = -4; }
  return material;
}
// Wrap a base geometry for instancing with per-instance attributes iA (vec4), iB (vec4), iTint (vec3)
export function instancedGeo(base, count, iA, iB, iTint) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.setAttribute('iTint', new THREE.InstancedBufferAttribute(iTint, 3));
  g.instanceCount = count;
  return g;
}
// sphere: conservative world-space bounds (THREE.Sphere). With it the mesh is frustum-culled; without it it always draws.
export function creatureMesh(geometry, material, order = 0, sphere = null) {
  const m = new THREE.Mesh(geometry, material); m.renderOrder = order;
  if (sphere) { geometry.boundingSphere = sphere; m.frustumCulled = true; } else m.frustumCulled = false;
  return m;
}
export const triCount = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
// jitter a colour in HSL (hue, saturation, lightness spreads)
export function vary(c, rng, dh = 0.02, ds = 0.08, dl = 0.08) {
  const o = c.clone(), hsl = {}; o.getHSL(hsl);
  return o.setHSL((hsl.h + (rng() - 0.5) * 2 * dh + 1) % 1, Math.min(1, Math.max(0, hsl.s + (rng() - 0.5) * 2 * ds)), Math.min(1, Math.max(0, hsl.l + (rng() - 0.5) * 2 * dl)));
}

// ---------- contact shadows ----------
// A soft dark ellipse under each ground animal: a second instanced mesh that reuses the creature's trajectory shader.
const SHADOW_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform float uOpacity; varying vec3 vLocal;
void main(){
  float k = 1. - smoothstep(.1, 1., length(vLocal.xz)), a = uOpacity * k * k;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
    a *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
    a *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(0., 0., 0., a);
}
`;
export function blobGeometry(sides = 14) {
  const g = new Geo(), k = new THREE.Color(0, 0, 0), ring = [];
  for (let i = 0; i < sides; i++) { const a = (i / sides) * Math.PI * 2; ring.push([Math.sin(a), 0, Math.cos(a)]); }
  g.fan([[0, 0, 0], ...ring, ring[0]], k);
  return g.build();
}
// spec: the creature's own material spec (pre, traj, defines, uniforms, upright, level, instanced); size [halfWidth, halfLength, zOffset, lift] in metres
export function shadowMaterial(spec, size, opacity = 0.5, level = -1e9) {
  const defines = { ...(spec.defines || {}), SHADOW: 1 }; delete defines.PATTERN;
  return creatureMaterial({
    ...spec, pattern: '', frag: SHADOW_FRAG, transparent: true, depthWrite: false, polygonOffset: true, side: THREE.DoubleSide, opacity, bank: 0, spine: false, defines,
    // level: world y of a water surface the shadow should lie on when the feet are below it (creatures whose iA.xyz is a position)
    deform: 'uniform vec4 uBlob; uniform float uBlobLevel;\nvoid deform(inout vec3 p, inout vec3 n){ p = vec3(p.x * uBlob.x, uBlob.w + max(0., uBlobLevel - iA.y) / max(iB.x * uScale, 1e-3), p.z * uBlob.y + uBlob.z); }',
    uniforms: { ...(spec.uniforms || {}), uBlob: { value: new THREE.Vector4(size[0], size[1], size[2] || 0, size[3] ?? 0.04) }, uBlobLevel: { value: level } },
  });
}

// ---------- group helper ----------
// makeFauna(scene, { light, rng, range, warmRate }): owns a set of fauna objects. add() puts them in the scene and relights them
// with the shared light; update() calls every update and hides whatever lies beyond the fog (or `range` metres).
const _sph = new THREE.Sphere(), _fr = new THREE.Frustum(), _pm = new THREE.Matrix4();
export function makeFauna(scene, o = {}) {
  const items = [], shared = o.light === undefined ? null : o.light, rate = o.warmRate ?? 1;
  // warm-up: something out of view is drawn once as ONE unculled instance, so its shader compiles ahead of time and cheaply
  const stub = (it, on) => it.f.object.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, ud = g.userData;
    if (on) { if (g.isInstancedBufferGeometry && ud.faunaCount === undefined) { ud.faunaCount = g.instanceCount; g.instanceCount = Math.min(1, g.instanceCount); } m.frustumCulled = false; }
    else { if (ud.faunaCount !== undefined) { g.instanceCount = ud.faunaCount; delete ud.faunaCount; } if (g.boundingSphere) m.frustumCulled = true; }
  });
  const api = {
    items, rng: o.rng, light: shared,
    get warm() { let n = 0; for (const it of items) if (!it.warmed) n++; return n; },   // members whose shader has not been drawn yet
    add(f, io = {}) { items.push({ f, range: io.range ?? o.range, always: !!io.always, stub: false, warmed: false }); if (scene) scene.add(f.object); if (shared && io.light !== false && f.setLight) f.setLight(io.light || shared); return f; },
    setLight(light, over) { api.light = light; for (const it of items) if (it.f.setLight) it.f.setLight(light, over); },
    // active = false: the whole group is out of play (another habitat) and nothing is drawn, except the one-instance warm-up draws
    update(dt, time, camera, u, active = true) {
      const fog = scene && scene.fog, reach = fog ? (fog.isFogExp2 ? 2.6 / Math.max(fog.density, 1e-6) : fog.far) : Infinity;
      let budget = rate, frustum = false;
      for (const it of items) {
        const b = it.f.bounds; let on = active, seen = active;
        if (on && b && !it.always && camera) {
          _sph.copy(b).applyMatrix4(it.f.object.matrixWorld);
          on = _sph.center.distanceTo(camera.position) - _sph.radius < Math.min(reach, it.range ?? Infinity); seen = on;
          if (on && !it.warmed) { if (!frustum) { _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)); frustum = true; } seen = _fr.intersectsSphere(_sph); }
        }
        if (it.stub) { stub(it, false); it.stub = false; it.warmed = true; }
        else if (!it.warmed) { if (seen) it.warmed = true; else if (budget-- > 0) { stub(it, true); it.stub = true; on = true; } }
        it.f.object.visible = on; it.f.update(dt, time, camera, u);
      }
    },
    hide() { for (const it of items) it.f.object.visible = false; },
    // Compile every shader before the flight so nothing hitches when a group first comes into view. Returns a promise
    // (uses renderer.compileAsync when available): `await fauna.prewarm(ctx.renderer)` at the end of build().
    prewarm(renderer, camera) {
      if (!renderer || !scene) return Promise.resolve();
      const cam = camera || new THREE.PerspectiveCamera();
      try { if (renderer.compileAsync) return renderer.compileAsync(scene, cam).catch(() => {}); renderer.compile(scene, cam); } catch (e) { /* compile is only an optimisation */ }
      return Promise.resolve();
    },
    get triangles() { let n = 0; for (const it of items) n += it.f.triangles || 0; return n; },
  };
  return api;
}
