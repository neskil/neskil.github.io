// THE SLEDGE BETWEEN THE VOLCANOES: what every part of this world shares.
//   makeShared()   the uniform objects of the world's three lights and its fog. The world writes them once a frame and
//                  every own shader of the world reads the same objects (assigned, never cloned).
//   SBV_LIGHT      GLSL: sbvFire (the lava front as a red area light plus the wash from the plume's underside),
//                  sbvLight (cold skylight + the afterglow + the fire), sbvFog (scene fog, at a chosen share of the distance).
//   Acc            a small mesh accumulator (box, tube, ball) with a part id and a colour per vertex.
import * as THREE from 'three';

export const PI = Math.PI;
const INV_PI = 1 / Math.PI;

// Colours are stored as radiance per unit albedo (colour x intensity / pi), which is what a lit standard material gives.
export function makeShared() {
  return {
    uTime: { value: 0 },
    uSkyCol: { value: new THREE.Color('#35508A').multiplyScalar(4.2 * INV_PI) },
    uGndCol: { value: new THREE.Color('#1B2640').multiplyScalar(4.2 * INV_PI) },
    uGlowDir: { value: new THREE.Vector3(-0.34, 0.14, -0.93).normalize() },
    uGlowCol: { value: new THREE.Color('#E8C8A8').multiplyScalar(3.0 * INV_PI) },
    uFirePos: { value: new THREE.Vector3(190, 110, -400) },
    uFireCol: { value: new THREE.Color('#FF5A1E') },
    uFire: { value: new THREE.Vector4(90, 1, 0.1, 0) },          // radius of the source (m), strength of the front, strength of the wash, flash
    uWashDir: { value: new THREE.Vector3(0.62, 0.62, -0.48).normalize() },
    uFireZ: { value: new THREE.Vector2(-705, -585) },             // the lip hides the fire: nothing beyond x, everything before y (world z)
    uFogCol: { value: new THREE.Color('#2A3B5E') },
    uFogDen: { value: 0.00045 },
    uFire2: { value: new THREE.Vector4(0, 0, 0, 0) },            // a second, small fire: the tongue beside the icefall (place, reach in m; 0 = none)
    uRing: { value: new THREE.Vector4(0, 0, 0, 0) },             // the way out's cold light: its place, its strength
    uRingCol: { value: new THREE.Color('#9fc4ff') },
    uBelly: { value: new THREE.Vector4(0, 0, 0, 0) },            // (polish 1) the eruption's burning belly over the crater: its place, its strength
  };
}
// a fixed list of forks, taken in order, one for each kind of thing a builder deals
export const forksOf = (rng, names) => { const f = {}; for (const n of names) f[n] = rng.fork(n); return f; };
export const sharedUniforms = (S) => ({ uTime: S.uTime, uSkyCol: S.uSkyCol, uGndCol: S.uGndCol, uGlowDir: S.uGlowDir, uGlowCol: S.uGlowCol, uFirePos: S.uFirePos, uFireCol: S.uFireCol,
  uFire: S.uFire, uWashDir: S.uWashDir, uFireZ: S.uFireZ, uFogCol: S.uFogCol, uFogDen: S.uFogDen, uFire2: S.uFire2, uRing: S.uRing, uRingCol: S.uRingCol, uBelly: S.uBelly });

export const SBV_NOISE = /* glsl */`
float sH1(float p){ p = fract(p*.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float sH2(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float sH3(vec3 p3){ p3 = fract(p3*.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y)*p3.z); }
float sN2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(sH2(i), sH2(i + vec2(1., 0.)), f.x), mix(sH2(i + vec2(0., 1.)), sH2(i + vec2(1., 1.)), f.x), f.y); }
float sN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(mix(sH3(i), sH3(i + vec3(1., 0., 0.)), f.x), mix(sH3(i + vec3(0., 1., 0.)), sH3(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(sH3(i + vec3(0., 0., 1.)), sH3(i + vec3(1., 0., 1.)), f.x), mix(sH3(i + vec3(0., 1., 1.)), sH3(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float sF2(vec2 p){ return .5*sN2(p) + .27*sN2(p*2.03 + 17.3) + .15*sN2(p*4.1 + 31.7) + .08*sN2(p*8.3 + 5.1); }
float sF3(vec3 p){ return .52*sN3(p) + .27*sN3(p*2.03 + vec3(7.1, 3.3, 5.7)) + .14*sN3(p*4.07 + vec3(1.7, 9.2, 4.4)) + .07*sN3(p*8.1 + vec3(3.3, 1.1, 8.8)); }
`;

export const SBV_LIGHT = /* glsl */`
uniform vec3 uSkyCol, uGndCol, uGlowDir, uGlowCol, uFirePos, uFireCol, uWashDir, uFogCol;
uniform vec4 uFire, uFire2, uRing, uBelly; uniform vec3 uRingCol; uniform vec2 uFireZ; uniform float uFogDen;
// the fire: the lava front as an area light and the broad wash from the plume's underside; both stop at the lip
vec3 sbvFire(vec3 wp, vec3 n){
  vec3 d = uFirePos - wp; float l = length(d); vec3 L = d/max(l, 1e-3);
  float r = uFire.x, att = r*r/(l*l + r*r);
  float nl = clamp(dot(n, L)*.96 + .04, 0., 1.);
  float wash = smoothstep(.66, 1., dot(n, uWashDir));
  float lip = smoothstep(uFireZ.x, uFireZ.y, wp.z);
  return uFireCol*((uFire.y*att*nl + uFire.z*wash)*lip*(1. + uFire.w));
}
vec3 sbvSky(vec3 n){ return mix(uGndCol, uSkyCol, clamp(n.y*.5 + .5, 0., 1.)) + uGlowCol*max(dot(n, uGlowDir), 0.); }
// the tongue beside the icefall: an orange light on what is turned to it, nothing on what is turned away; it beats with the bursts
vec3 sbvFire2(vec3 wp, vec3 n){
  vec3 d = uFire2.xyz - wp; float l = length(d), r = uFire2.w, att = r*r/(l*l + r*r + 1e-3);
  float nl = clamp(dot(n, d/max(l, 1e-3)), 0., 1.);
  return uFireCol*(uFire.y*att*nl*nl*(1. + 3.*uFire.w));
}
// the way out's own cold light on what stands near it
vec3 sbvRing(vec3 wp, vec3 n){ vec3 d = uRing.xyz - wp; float l2 = dot(d, d); return uRingCol*(uRing.w*clamp(dot(n, d*inversesqrt(l2 + 1e-3))*.6 + .4, 0., 1.)*81./(l2 + 81.)); }
// (polish 1) the eruption's burning belly, far up over the crater: a dull red light on what is turned to it, dying
// with distance from the mountain (a light of the place: by metres over the ground from the crater's column, 1,100 m
// its measure). It comes in low, from the lit underside of the smoke, so it catches the faces turned to the mountain
// (the windward faces) far more than flat snow.
vec3 sbvBelly(vec3 wp, vec3 n){ vec3 d = uBelly.xyz - wp; float l2 = dot(d.xz, d.xz); d.y *= .4;
  return uFireCol*(uBelly.w*clamp(dot(n, d*inversesqrt(dot(d, d) + 1.))*1.45 - .45, 0., 1.)*1.21e6/(l2 + 1.21e6)); }
// the way out's light on the ridges that stand nearest it (30 m its measure)
vec3 sbvRingFar(vec3 wp, vec3 n){ vec3 d = uRing.xyz - wp; float l2 = dot(d, d); return uRingCol*(.3*uRing.w*clamp(dot(n, d*inversesqrt(l2 + 1e-3))*.6 + .4, 0., 1.)*900./(l2 + 900.)); }
vec3 sbvLight(vec3 wp, vec3 n){ return sbvSky(n) + sbvFire(wp, n) + sbvFire2(wp, n) + sbvRing(wp, n); }
vec3 sbvFog(vec3 c, float dist, float k){ float q = uFogDen*dist*k; return mix(c, uFogCol, 1. - exp(-q*q)); }
`;

// ---------------------------------------------------------------- mesh accumulator
// Non-indexed triangles with position, normal, colour and one float `aPart` (which rigid part of a figure a vertex
// belongs to) plus `aK` (a free 0..1 per vertex: height along a limb, cloth looseness...).
export class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; this.part = []; this.k = []; this.col = new THREE.Color(1, 1, 1); this.pid = 0; this.kv = 0; this.m = null; }
  color(c) { this.col.set(c); return this; }
  rgb(r, g, b) { this.col.setRGB(r, g, b); return this; }
  id(i) { this.pid = i; return this; }
  _v(v, nn, k) {
    if (this.m) { v = v.clone().applyMatrix4(this.m); nn = nn.clone().transformDirection(this.m); }
    this.p.push(v.x, v.y, v.z); this.n.push(nn.x, nn.y, nn.z); this.c.push(this.col.r, this.col.g, this.col.b); this.part.push(this.pid); this.k.push(k ?? this.kv);
  }
  tri(a, b, c, na, nb, nc, ka, kb, kc) {
    if (!na) { na = nb = nc = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize(); }
    this._v(a, na, ka); this._v(b, nb, kb); this._v(c, nc, kc);
  }
  quad(a, b, c, d, n) { this.tri(a, b, c, n, n, n); this.tri(a, c, d, n, n, n); }
  // a box from its centre, half sizes and an optional rotation (Euler); taper scales the top face in x and z
  box(cx, cy, cz, hx, hy, hz, rot = null, taper = 1) {
    const q = new THREE.Quaternion(); if (rot) q.setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
    const P = (sx, sy, sz) => new THREE.Vector3(sx * hx * (sy > 0 ? taper : 1), sy * hy, sz * hz * (sy > 0 ? taper : 1)).applyQuaternion(q).add(new THREE.Vector3(cx, cy, cz));
    const F = [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]],
      [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]];
    for (const f of F) { const v = f.map((s) => P(s[0], s[1], s[2])); this.quad(v[0], v[1], v[2], v[3], null); }
    return this;
  }
  // a tube of rings: pts [[x,y,z,r], ...] (r may be [rx, rz] for an oval section in the tube's own frame), smooth normals,
  // closed with caps; k runs 0..1 along it
  tube(pts, seg = 8, capA = true, capB = true) {
    const rings = [], up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      const ref = Math.abs(t.y) > 0.95 ? tmp.set(0, 0, 1) : up;
      const sx = new THREE.Vector3().crossVectors(ref, t).normalize(), sz = new THREE.Vector3().crossVectors(t, sx).normalize();
      const r = pts[i][3], rx = Array.isArray(r) ? r[0] : r, rz = Array.isArray(r) ? r[1] : r, ring = [];
      for (let j = 0; j < seg; j++) { const an = (j / seg) * PI * 2, c = Math.cos(an), s = Math.sin(an);
        const nn = new THREE.Vector3().addScaledVector(sx, c * rz).addScaledVector(sz, s * rx).normalize();
        ring.push({ v: new THREE.Vector3(pts[i][0], pts[i][1], pts[i][2]).addScaledVector(sx, c * rx).addScaledVector(sz, s * rz), n: nn }); }
      rings.push(ring);
    }
    const N = rings.length;
    for (let i = 0; i < N - 1; i++) { const ka = i / (N - 1), kb = (i + 1) / (N - 1);
      for (let j = 0; j < seg; j++) { const a = rings[i][j], b = rings[i][(j + 1) % seg], c = rings[i + 1][(j + 1) % seg], d = rings[i + 1][j];
        this.tri(a.v, b.v, c.v, a.n, b.n, c.n, ka, ka, kb); this.tri(a.v, c.v, d.v, a.n, c.n, d.n, ka, kb, kb); } }
    const cap = (ring, pt, sgn, k) => { const cv = new THREE.Vector3(pt[0], pt[1], pt[2]);
      for (let j = 0; j < seg; j++) { const a = ring[j], b = ring[(j + 1) % seg]; const nn = new THREE.Vector3().subVectors(a.v, cv).cross(new THREE.Vector3().subVectors(b.v, cv)).normalize().multiplyScalar(sgn);
        if (sgn > 0) this.tri(cv, a.v, b.v, nn, nn, nn, k, k, k); else this.tri(cv, b.v, a.v, nn, nn, nn, k, k, k); } };
    if (capA) cap(rings[0], pts[0], -1, 0); if (capB) cap(rings[N - 1], pts[N - 1], 1, 1);
    return this;
  }
  // an ellipsoid (rx, ry, rz) at a centre; cut: keep only latitudes above this (-1 whole)
  ball(cx, cy, cz, rx, ry, rz, seg = 8, rows = 6, cut = -1) {
    const P = (i, j) => { const th = (j / rows) * PI, ph = (i / seg) * PI * 2; const y = Math.max(cut, Math.cos(th)), s = Math.sqrt(Math.max(0, 1 - y * y));
      const n = new THREE.Vector3(Math.cos(ph) * s, y, Math.sin(ph) * s); return { v: new THREE.Vector3(cx + n.x * rx, cy + n.y * ry, cz + n.z * rz), n: new THREE.Vector3(n.x / rx, n.y / ry, n.z / rz).normalize() }; };
    for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      if (j > 0) this.tri(a.v, b.v, c.v, a.n, b.n, c.n); if (j < rows - 1) this.tri(a.v, c.v, d.v, a.n, c.n, d.n); }
    return this;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.part, 1)); g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 1));
    return g;
  }
  get triangles() { return this.p.length / 9; }
}
