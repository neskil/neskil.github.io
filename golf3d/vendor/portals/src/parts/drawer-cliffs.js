// THE TALLBOY: hero set piece for "The Drawer Cliffs".
//
// A walnut chest of drawers 346 m high whose nine drawers stand open as a flight of stairs. Every
// drawer is a tray of meadow with a pool; each pool pours through a notch in its lip onto the meadow
// below, so one cascade of nine 30 m falls runs down the middle of the stair. Each riser is a
// bow-fronted, book-matched burr drawer front with two 12 m brass bail handles and a keyhole. Above
// the top meadow the carcass mouth is a dark hall, and across it hangs the engraved brass keyhole
// plate (34 x 20 m) whose round keyhole head is the portal seat.
//
// LOCAL SPACE: origin at the base centre of the carcass front (river level, y 0), +Y up, front +Z.
//   carcass x -65..65, z -70..0, y 0..346.  Drawer i (0 = bottom) has its front at z = 216 - 18 i,
//   its lip at y = 46 + 30 i, its meadow 1 m below the lip. Bow of each front: +5 m at the centre.
//   radius 190 (about centre 0,150,70), height 346.
//
// opts: palette (7 hex strings, brief order: dark walnut, mid walnut, gold, cream, meadow green,
//   water turquoise, brass), detail 0.6-1 (thins grass, flowers, ivy, far swifts, motes only),
//   sunDir (THREE.Vector3 TOWARD the sun, world space; default the brief's: left, behind, 24 deg up),
//   sunColor, skyColor, bounceColor (hex) for the analytic light.
//
// anchors (all local space):
//   portalSeat {position, normal, radius 7, pitch}  centre of the keyhole's round head; portal faces +Z,
//                                              tilted to meet a camera descending 16 degrees.
//   flyThrough [Vector3...]   the brief's line: river approach, the 59 degree climb 9 m outside the lips
//                             and 20 m right of centre, over the top lip, down across the pool to the seat.
//   handles [{position, drawer, side}]  centre of each bail (18), for near passes.
//   lips [{position, drawer}]           centre of each drawer lip, top edge.
//   meadows [{center, halfWidth, zNear, zFar, y, drawer}]  where the world may add more life.
//   falls [{top, foot, drawer}], cascadeFoot (where the bottom fall meets the river: put ripples there).
//   keyholes [Vector3 x9], swiftKeyhole (drawer 1: the stream pours from it), swiftPath [Vector3 x6],
//   stag, ladderFoot, washing, viewpoints {river, bend, climb, top}.
//   Drawer-mounted anchors are rest positions; add hero.drawerOffset(drawer, time) to z for the live one.
//
// Progress: hero.setProgress(u) with u = the world's path u (0..1). It keys the key-swift stream
//   (bursts from the swift keyhole around u 0.45, crosses the sea, funnels into the plate keyhole by u 0.95). Drawers
//   breathe a metre or two on slow eased cycles through drawerOffset(id, time), shared by JS and every
//   shader (uniform array uOff), so front, tray, meadow, animals, pool and fall move as one.
//
// Lighting: self-lit. All materials are ShaderMaterials with one analytic sun (uSun), a sky fill and a
//   warm bounce; scene lights are ignored; scene fog is respected. Brass is the only thing that blooms.
// Cost: about 116k triangles, 9 draw calls, no textures, no lights, about 250 ms to build.
// hero.uniforms exposes uSun, uSunCol, uSky, uHorizon, uBounce if the world wants to drive the light.
// opts.focus ('hall' | 'handle' | 'mid' | 'base' | 'top' | 'stag' | 'foot') and opts.prog (0..1) are for a set-piece viewer;
//   the module never reads the page URL.
// The world module (src/worlds/drawer-cliffs.js) builds the lesser cabinets from this file's exports (Geo, PGeo,
//   addAnimal, addTree, the wood, brass, fall and prop shaders). A material compiled with the CANYON define gets
//   analytic box shadows (uBoxA/uBoxB, 12 boxes) and reads the sun for handle shadows from a varying (vSunL).
// The world approaches the keyhole RISING 16 degrees (over the top lip at y 292, low across the pool past the stag):
//   anchors.portalSeat.normal and anchors.flyThrough describe the older descending line and are not used for that.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const N = 9, HW = 65, DEPTH = 70, Y0 = 16, RISE = 30, RAIL = 4, FH = 26, FHW = 55, BOW = 5;
const HALL_TOP = 326, TOP = 346, SOIL = 1.0;
const outOf = (i) => 216 - 18 * i;
const lipY = (i) => Y0 + RISE * (i + 1);
const bowAt = (x) => BOW * (1 - (x / FHW) * (x / FHW));

// ---------- geometry accumulator: every solid in the piece goes through these few calls ----------
class Geo {
  // vertex data lives in growing typed arrays (plain arrays made this the dearest part of the build)
  constructor() { this.cap = 2048; this.p = new Float32Array(this.cap * 3); this.n = new Float32Array(this.cap * 3); this.uv = new Float32Array(this.cap * 2); this.m = new Float32Array(this.cap * 4); this.d = new Float32Array(this.cap); this.idx = []; this.c = 0; }
  grow() { const g = (a, k) => { const b = new Float32Array(this.cap * 2 * k); b.set(a); return b; }; this.p = g(this.p, 3); this.n = g(this.n, 3); this.uv = g(this.uv, 2); this.m = g(this.m, 4); this.d = g(this.d, 1); this.cap *= 2; }
  // one vertex: position, normal, board uv (metres, x along the grain), mat (kind, seed, edge, extra), drawer id
  v(p, n, uv, m, d) {
    if (this.c === this.cap) this.grow();
    const c = this.c, c3 = c * 3, c2 = c * 2, c4 = c * 4, P = this.p, Nn = this.n, M = this.m;
    P[c3] = p[0]; P[c3 + 1] = p[1]; P[c3 + 2] = p[2]; Nn[c3] = n[0]; Nn[c3 + 1] = n[1]; Nn[c3 + 2] = n[2];
    this.uv[c2] = uv[0]; this.uv[c2 + 1] = uv[1]; M[c4] = m[0]; M[c4 + 1] = m[1]; M[c4 + 2] = m[2]; M[c4 + 3] = m[3]; this.d[c] = d;
    return this.c++;
  }
  // a quad a-b-c-d (counter-clockwise seen from outside) with a flat normal
  quad(a, b, c, d, uvs, m, drw, edge) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const mm = edge === undefined ? m : [m[0], m[1], edge, m[3]];
    const i0 = this.v(a, [nx, ny, nz], uvs[0], mm, drw), i1 = this.v(b, [nx, ny, nz], uvs[1], mm, drw), i2 = this.v(c, [nx, ny, nz], uvs[2], mm, drw), i3 = this.v(d, [nx, ny, nz], uvs[3], mm, drw);
    this.idx.push(i0, i1, i2, i0, i2, i3);
  }
  // Sweep a 2D profile (array of [a,b]) along nu steps. place(t, a, b) -> [x,y,z] with t in 0..1.
  // Each profile segment is its own strip (hard arrises across the profile, smooth along the sweep);
  // segments shorter than `chamfer` are flagged as worn edges. uvScale: [metres along sweep, grain along sweep?]
  sweep(prof, nu, place, m, drw, o = {}) {
    const len = o.len ?? 1, along = o.along !== false, flip = !!o.flip, chamfer = o.chamfer ?? 1.3, uvOff = o.uvOff ?? [0, 0];
    let acc = 0;
    for (let j = 0; j < prof.length - 1; j++) {
      const A = prof[j], B = prof[j + 1], sl = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (sl < 1e-4) continue;
      const edge = o.edge !== undefined ? o.edge : (sl < chamfer ? 1 : 0);
      const base = this.c;
      for (let i = 0; i <= nu; i++) {
        const t = i / nu, t2 = Math.min(1, t + 1e-3), t1 = Math.max(0, t - 1e-3);
        const pa = place(t, A[0], A[1]), pb = place(t, B[0], B[1]), q1 = place(t1, A[0], A[1]), q2 = place(t2, A[0], A[1]);
        const sx = q2[0] - q1[0], sy = q2[1] - q1[1], sz = q2[2] - q1[2], px = pb[0] - pa[0], py = pb[1] - pa[1], pz = pb[2] - pa[2];
        let nx = sy * pz - sz * py, ny = sz * px - sx * pz, nz = sx * py - sy * px; const l = Math.hypot(nx, ny, nz) || 1; const f = (flip ? -1 : 1) / l; nx *= f; ny *= f; nz *= f;
        const s = t * len;
        const ua = along ? [s + uvOff[0], acc + uvOff[1]] : [acc + uvOff[0], s + uvOff[1]], ub = along ? [s + uvOff[0], acc + sl + uvOff[1]] : [acc + sl + uvOff[0], s + uvOff[1]];
        const wa = o.occ ? o.occ(pa) : m[3], wb = o.occ ? o.occ(pb) : m[3];
        this.v(pa, o.nrm ? o.nrm(t, A[0], A[1]) : [nx, ny, nz], o.uv ? o.uv(t, A[0], A[1]) : ua, [m[0], m[1], edge, wa], drw); this.v(pb, o.nrm ? o.nrm(t, B[0], B[1]) : [nx, ny, nz], o.uv ? o.uv(t, B[0], B[1]) : ub, [m[0], m[1], edge, wb], drw);
      }
      for (let i = 0; i < nu; i++) { const a = base + i * 2; if (flip) this.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); else this.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      acc += sl;
    }
  }
  // lathe a profile [radius, y] about a vertical axis through (cx, cz)
  lathe(prof, seg, cx, cy, cz, m, drw, o = {}) {
    const R = prof.reduce((a, q) => Math.max(a, q[0]), 0);
    this.sweep(prof, seg, (t, r, y) => { const a = t * Math.PI * 2; return [cx + Math.sin(a) * r, cy + y, cz + Math.cos(a) * r]; }, m, drw, { len: Math.PI * 2 * R, flip: true, ...o });
  }
  // axis-aligned box with optional faces mask "xXyYzZ" (lower = min side); uv from the two larger axes
  box(x0, x1, y0, y1, z0, z1, m, drw, faces = 'xXyYzZ', edge) {
    const P = (x, y, z) => [x, y, z];
    if (faces.includes('Z')) this.quad(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], m, drw, edge);
    if (faces.includes('z')) this.quad(P(x1, y0, z0), P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), [[x1, y0], [x0, y0], [x0, y1], [x1, y1]], m, drw, edge);
    if (faces.includes('X')) this.quad(P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), [[y0, z1], [y0, z0], [y1, z0], [y1, z1]], m, drw, edge);
    if (faces.includes('x')) this.quad(P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), [[y0, z0], [y0, z1], [y1, z1], [y1, z0]], m, drw, edge);
    if (faces.includes('Y')) this.quad(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0), [[x0, z1], [x1, z1], [x1, z0], [x0, z0]], m, drw, edge);
    if (faces.includes('y')) this.quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1), [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], m, drw, edge);
  }
  build() {
    const g = new THREE.BufferGeometry();
    const c = this.c;
    g.setAttribute('position', new THREE.BufferAttribute(this.p.slice(0, c * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.n.slice(0, c * 3), 3));
    g.setAttribute('aUv', new THREE.BufferAttribute(this.uv.slice(0, c * 2), 2));
    g.setAttribute('aMat', new THREE.BufferAttribute(this.m.slice(0, c * 4), 4));
    g.setAttribute('aDrw', new THREE.BufferAttribute(this.d.slice(0, c), 1));
    g.setIndex(this.idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 170, 70), 320);
    return g;
  }
}

// ---------- shared GLSL ----------
const VS_HEAD = /* glsl */`
attribute float aDrw;
uniform float uOff[10];
uniform float uTime;
varying vec3 vP; varying vec3 vW; varying vec3 vN;
#include <fog_pars_vertex>
float drwOff() { return uOff[int(clamp(aDrw + 0.5, 0., 9.))]; }
`;
const FS_HEAD = /* glsl */`
uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uBounce; uniform vec3 uHorizon;
uniform float uTime; uniform float uFill; uniform float uFillSun; uniform vec2 uHaze;
varying vec3 vP; varying vec3 vW; varying vec3 vN;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n + 17.1)); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 11.7) + 0.125 * vnoise(p * 4.1 + 3.1) + 0.0625 * vnoise(p * 8.3 + 7.9); }
float cell(vec2 p) { vec2 i = floor(p), f = fract(p); float d = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = g + h22(i + g) - f; d = min(d, dot(o, o)); }
  return sqrt(max(d, 1e-6)); }
float satan(float y, float x) { return (abs(x) + abs(y) < 1e-6) ? 0. : atan(y, x); }
vec3 skyAt(vec3 d) { float h = clamp(d.y, -1., 1.); vec3 c = mix(uHorizon, uSky, smoothstep(0., 0.7, h));
  return mix(c, uBounce * 0.55, 1. - smoothstep(-0.5, 0.05, h)); }
// analytic light: sun, sky from above, warm bounce from below and from the sunlit side
vec3 ambientAt(vec3 n) { return uSky * (0.36 + 0.3 * n.y) + uBounce * (0.34 - 0.2 * n.y + 0.1 * n.x); }
// canyon shade (worlds only; materials that define CANYON get analytic box shadows from up to 12 cabinets)
#ifdef CANYON
uniform vec4 uBoxA[12]; uniform vec4 uBoxB[12];   // A: centre x, centre z, cos yaw, sin yaw.  B: half width, half depth, top y, bottom y
uniform vec4 uCandle;                             // the candle on the dresser top: x, z, top y, 1 if there is one
uniform vec4 uGap[3];                             // sheets of sun through the gaps in the shaded wall: x, z of the gap, half width, strength
float canyonShade(vec3 p) {
  float s = 1.;
  for (int i = 0; i < 12; i++) {
    vec4 A = uBoxA[i], B = uBoxB[i];
    vec2 d = p.xz - A.xy, q = vec2(A.z * d.x + A.w * d.y, -A.w * d.x + A.z * d.y), l = vec2(A.z * uSun.x + A.w * uSun.z, -A.w * uSun.x + A.z * uSun.z);
    vec3 o = vec3(q.x, p.y - 0.5 * (B.z + B.w), q.y), h = vec3(B.x, max(0.5 * (B.z - B.w), 0.), B.y), dr = vec3(l.x, uSun.y, l.y);
    vec3 sg = vec3(dr.x < 0. ? -1. : 1., dr.y < 0. ? -1. : 1., dr.z < 0. ? -1. : 1.);
    vec3 inv = sg / max(abs(dr), vec3(1e-4));
    vec3 t1 = (-h - o) * inv, t2 = (h - o) * inv, tn3 = min(t1, t2), tf3 = max(t1, t2);
    float tn = max(max(tn3.x, tn3.y), max(tn3.z, 0.3)), tf = min(min(tf3.x, tf3.y), tf3.z);
    s *= 1. - smoothstep(0., 5., tf - tn) * step(0.5, B.z - B.w);
  }
  // sun through the gaps between the low chests: a sheet of light that runs down-sun from each gap across the river
  vec2 sd = normalize(uSun.xz + vec2(1e-5, 0.));
  for (int i = 0; i < 3; i++) {
    vec2 d = p.xz - uGap[i].xy; float al = -dot(d, sd), ac = abs(d.x * sd.y - d.y * sd.x) + 2.5 * (vnoise(p.xz * 0.11) - 0.5);
    float m = (1. - smoothstep(uGap[i].z * 0.55, uGap[i].z, ac)) * smoothstep(-6., 10., al) * (1. - smoothstep(150., 190., al)) * uGap[i].w;
    s = max(s, m * 0.92);
  }
  // the candle and its pan throw their shadow along the dresser top (and on the key that lies there)
  float hc = p.y - uCandle.z;
  if (uCandle.w > 0.5 && hc > -1. && hc < 50.) {
    vec2 d = p.xz - uCandle.xy, sl = uSun.xz / max(uSun.y, 0.1);
    float k0 = max(-hc, 0.), k1 = max(46. - hc, k0), k = clamp(-dot(d, sl) / max(dot(sl, sl), 1e-3), k0, k1);
    float stem = (1. - smoothstep(2.2, 3.6, length(d + sl * k))) * smoothstep(4.8, 5.6, length(d));
    float pan = (1. - smoothstep(13.2, 15., length(d + sl * max(1.6 - hc, 0.)))) * step(hc, 1.) * smoothstep(13.8, 14.6, length(d));
    s *= 1. - 0.9 * max(stem, pan);
  }
  return s;
}
#else
float canyonShade(vec3 p) { return 1.; }
#endif
`;
const WOOD_VS = VS_HEAD + /* glsl */`
attribute vec2 aUv; attribute vec4 aMat;
varying vec2 vUv; varying vec4 vMat;
void main() {
  vUv = aUv; vMat = aMat; vP = position;
  vec3 p = position; p.z += drwOff();
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WOOD_FS = FS_HEAD + /* glsl */`
#ifdef CANYON
varying vec3 vSunL;      // worlds: the sun in each front's own space, from the vertex shader
#define uSunL vSunL
#else
uniform vec3 uSunL;
#endif
uniform vec3 uWoodA; uniform vec3 uWoodB; uniform vec3 uWoodC; uniform vec3 uCream; uniform vec3 uOak;
varying vec2 vUv; varying vec4 vMat;
void main() {
  float kind = floor(vMat.x + 0.5), seed = vMat.y, edge = vMat.z, occ = vMat.w;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
  if (dot(N, V) < 0.) N = -N;
  vec2 b = vUv; float fw = max(fwidth(vUv.x), fwidth(vUv.y));
  // --- joinery of a drawer front (kind 1): board x is -55..55 from the centre, y 0..26 ---
  float isFront = step(0.5, kind) * step(kind, 1.5), field = 0., band = 0., inlay = 0., ebony = 0.;
  if (isFront > 0.5) {
    vec2 q = vec2(55. - abs(b.x), min(b.y, 26. - b.y)); float e = min(q.x, q.y);
    b.x = abs(b.x);                                    // book-match about the centre line
    band = 1. - smoothstep(2.0, 2.05, e);              // cross-banding border
    float aw = max(fw, 0.02);
    inlay = smoothstep(2.0 - aw, 2.0, e) * (1. - smoothstep(2.6, 2.6 + aw, e));
    ebony = 1. - smoothstep(0.08, 0.08 + aw, abs(abs(e - 2.3) - 0.36));
    field = smoothstep(4.4, 5.6, e);
    occ = max(occ, 0.35 * (1. - smoothstep(0., 1.5, e)));
  }
  float hsh = 0.;
  if (isFront > 0.5 && uSunL.z > 0.05) {
    vec2 k = -uSunL.xy / max(uSunL.z, 0.15);
    vec2 r = vec2(vUv.x - sign(vUv.x) * 30., vUv.y - 13.5);
    for (int j = 0; j < 2; j++) {
      vec2 a = vec2(j == 0 ? -5. : 5., 0.), ba = k * 6., pa = r - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.);
      hsh = max(hsh, 1. - smoothstep(0.55, 1.25, length(pa - ba * h)));
    }
    vec2 rb = r - k * 5.65 - vec2(0., -0.6);
    float el = abs(length(rb / vec2(6.0, 4.6)) - 1.) * 4.6;
    hsh = max(hsh, (1. - smoothstep(0.45, 1.1, el)) * (1. - smoothstep(-0.2, 0.6, rb.y)));
    hsh *= 0.85;
  }
  float isOak = step(1.5, kind) * step(kind, 2.5), isDark = step(2.5, kind) * step(kind, 3.5), vert = step(4.5, kind) * step(kind, 5.5), isBot = step(5.5, kind);
  vec2 g = band > 0.5 ? b.yx + 31. : b;               // g.x runs along the grain
  g += seed * vec2(37.1, 91.7);
  // --- figure: big cathedral flame, growth rings, burr eyes, pores ---
  float big = fbm(g * vec2(0.035, 0.16));
  float flame = fbm(g * vec2(0.012, 0.07) + 9.);
  float pith = g.y + (big - 0.5) * 9. + (flame - 0.5) * 22. + 3. * sin(g.x * 0.02 + seed * 6.);
  float saw = fract(pith / 0.8);
  float ring = smoothstep(0., 0.75, saw) * (1. - smoothstep(0.86, 1., saw));
  float ringFade = 1. - smoothstep(0.1, 0.4, fw);
  float wide = 0.5 + 0.5 * sin(pith * 0.9 + 4. * big);      // broad bands that survive distance
  float swirlPre = fbm(b * 0.11 + 4. * vec2(fbm(b * 0.05 + seed), fbm(b * 0.05 + 7.)));
  vec2 bw = b * 0.8 + seed * 13.; bw += 1.4 * vec2(fbm(bw * 0.6 + 3.), fbm(bw * 0.6 + 17.));
  float eyes = cell(bw); float eyeRing = 0.5 + 0.5 * sin(eyes * 9. + 22. * swirlPre + 5. * fbm(bw * 1.7));
  float swirl = swirlPre;
  float burr = field * (1. - isOak);
  float tone = mix(0.25 + 0.5 * wide + 0.25 * mix(0.5, ring, ringFade), 0.12 + 0.3 * swirl + 0.42 * smoothstep(0.3, 0.7, fbm(b * 0.05 + seed * 5.)) + 0.12 * (eyeRing - 0.5) * ringFade - 0.22 * (1. - smoothstep(0.03, 0.22, eyes)) * ringFade, burr);
  tone = clamp(tone + (flame - 0.5) * 0.35, 0., 1.);
  float pore = vnoise(g * vec2(0.4, 25.)) * vnoise(g * vec2(1.3, 9.) + 5.);
  float poreFade = 1. - smoothstep(0.012, 0.07, fw);
  vec3 alb = mix(uWoodA, uWoodB, smoothstep(0.05, 0.55, tone)); alb = mix(alb, uWoodC, smoothstep(0.6, 1., tone) * 0.45);
  alb *= vec3(1.0, 0.8, 0.72);                          // red glaze
  alb *= 1. - 0.3 * poreFade * smoothstep(0.18, 0.32, pore);
  alb *= mix(1., 0.82, band * 0.6);
  // oak drawer sides with through-dovetails (board x = metres back from the front, y = height)
  if (isOak > 0.5) {
    float fleck = smoothstep(0.62, 0.8, vnoise(g * vec2(0.5, 3.2) + 70.)) * (1. - smoothstep(0.05, 0.3, fw));
    vec3 oak = uOak * vec3(1., 0.86, 0.72) * (0.86 + 0.24 * (wide - 0.5) + 0.22 * (big - 0.5)) * (1. - 0.25 * poreFade * smoothstep(0.15, 0.3, pore)) * (1. + 0.35 * fleck);
    oak *= 1. - 0.55 * (1. - smoothstep(0.12, 0.3 + fw, abs(b.y - 2.2))) * step(3.3, b.x);            // groove of the bottom board
    oak *= 1. - 0.3 * smoothstep(0.5, 0.9, fbm(vec2(b.x * 0.05, b.y * 1.3) + seed * 30.)) * step(3.3, b.x);  // runner wear streaks
    oak = mix(oak, oak * vec3(0.7, 0.6, 0.5), smoothstep(10., 120., b.x) * 0.6 + 0.25 * big);
    if (b.x > 3.3) {      // the side is joinery, not a blank board: three boards high, each its own tone, dark joints between; a walnut runner let in along it, pegged
      float by = b.y / 8.67, bj2 = abs(fract(by) - 0.5) * 8.67;
      oak *= 0.8 + 0.4 * fract(floor(by) * 0.37 + seed * 5.3);
      oak *= 1. - 0.3 * (0.5 + 0.5 * sin((b.y + 2.5 * big) * 2.4));                                    // the long grain of each board
      oak *= 1. - 0.62 * smoothstep(3.9 - fw, 4.25, bj2);
      float run = 1. - smoothstep(1.3, 1.5 + fw, abs(b.y - 6.4));
      vec3 runC = uWoodB * vec3(1.05, 0.86, 0.76) * (0.7 + 0.4 * wide);
      float pg = length(vec2((fract(b.x / 9.) - 0.5) * 9., b.y - 6.4));
      runC = mix(runC, uOak * 1.25, (1. - smoothstep(0.45, 0.65 + fw, pg)));
      oak = mix(oak, runC, run * 0.85);
      oak *= 1. - 0.55 * (1. - smoothstep(0., 0.3 + fw, abs(b.y - 4.75))) * (1. - run);                // the runner's shadow on the board below
    }
    float ty = fract(b.y / 3.) - 0.5, tx = clamp(b.x / 3.2, 0., 1.);
    float tail = step(abs(ty), 0.17 + 0.14 * tx) * step(b.x, 3.2) * step(0.01, b.x);
    float er = 0.5 + 0.5 * sin(length(vec2(b.x - 1.6, ty * 3.) + 0.3 * big) * 9.);
    alb = mix(oak, uWoodB * (0.75 + 0.3 * er) * vec3(1.08, 0.95, 0.9), tail);
    alb *= 1. - 0.5 * (1. - smoothstep(0.0, 0.12 + fw, abs(abs(ty) - (0.17 + 0.14 * tx)) * 3.)) * step(b.x, 3.2);
    alb *= 1. - 0.35 * (1. - smoothstep(0., 0.15 + fw, abs(b.x - 3.2)));
  }
  alb = mix(alb, uCream * 0.82, inlay); alb = mix(alb, vec3(0.012, 0.009, 0.008), ebony * isFront);
  // --- wear: pale matte arrises, dust on up-facing surfaces, darkening toward gaps ---
  vec3 worn = vec3(0.49, 0.26, 0.09);
  float scr = smoothstep(0.93, 1., vnoise(b * vec2(0.9, 14.) + 40.)) * poreFade;
  alb = mix(alb, worn, clamp(edge * 0.75 + scr * 0.25, 0., 1.));
  float dust = smoothstep(0.55, 0.95, N.y) * (0.45 + 0.4 * fbm(vW.xz * 0.15)) * (1. - 0.85 * isFront);
  alb = mix(alb, vec3(0.42, 0.33, 0.22), dust * 0.55);
  alb = mix(alb, vec3(0.012, 0.008, 0.006), isDark);
  { float th = vW.y + 0.7 * vnoise(vW.xz * 0.35 + vW.y * 0.2);
    alb *= 1. - 0.5 * (1. - smoothstep(1.2, 2.4, th));
    alb = mix(alb, vec3(0.5, 0.42, 0.3), 0.45 * smoothstep(2.1, 2.5, th) * (1. - smoothstep(2.6, 3.4, th))); }
  float gloss = (1. - edge * 0.8) * (1. - dust) * (1. - isDark) * mix(1., 0.55, isOak);
  // the bottom of a drawer (kind 6): pale oak boards run front to back, each its own tone and its own figure, a dark joint
  // between each. Board x = metres back from the lip (0 at the lip, falling inward), y = across. The tone changes AT the
  // joint and is eased across the joint's own width, so no hard edge is left where the joint has faded with distance.
  if (isBot > 0.5) {
    float bq = b.y / 9.2 + seed, bf = fract(bq + 0.5), bj = abs(fract(bq) - 0.5) * 9.2, bi = floor(bq + 0.5), bn = bi + (bf < 0.5 ? -1. : 1.);
    float jFade = 1. - smoothstep(0.2, 0.9, fw), tFade = 1. - smoothstep(0.8, 3., fw);
    float t0 = 0.78 + 0.36 * fract(bi * 0.37 + seed * 3.), t1 = 0.78 + 0.36 * fract(bn * 0.37 + seed * 3.);
    float tb = mix(0.5 * (t0 + t1), t0, smoothstep(0., 0.26 + fw, bj));
    // the figure of a flat-sawn board: long arches about a heart that wanders along it, medullary flecks, open pores
    float gl = b.x * 0.03 + bi * 5.7 + seed * 11.;
    float heart = (bf - 0.5) * 9.2 + 3.2 * (fbm(vec2(gl, bi * 3.1)) - 0.5);
    float sawB = fract((abs(heart) + (b.x + 30. * fbm(vec2(gl * 0.5, bi * 1.7 + 4.))) * 0.114 * (fract(bi * 0.61) < 0.5 ? 1. : -1.)) / 0.8);      // the design's ring: 0.8 m apart, a sawtooth with a sharp dark edge on one side
    float rings = smoothstep(0., 0.75, sawB) * (1. - smoothstep(0.86, 1., sawB));
    float fleck = smoothstep(0.62, 0.8, vnoise(g * vec2(0.5, 3.2) + 70.)) * (1. - smoothstep(0.05, 0.3, fw));
    alb = uOak * vec3(1.02, 0.9, 0.76) * (0.9 + 0.2 * (wide - 0.5) + 0.14 * (big - 0.5)) * mix(0.96, tb, tFade);
    alb *= (1. - 0.22 * ringFade * (0.65 - rings)) * (1. + 0.3 * fleck) * (1. - 0.3 * poreFade * smoothstep(0.15, 0.3, pore));
    alb *= 1. - 0.66 * jFade * (1. - smoothstep(0.07, 0.26 + fw, bj));      // a joint is dark wood, never black, and narrower than a drawer's shadow gap
    if (edge > 0.05 && edge < 0.2) alb *= 1. - 0.42 * jFade * (1. - smoothstep(2.2, 3.6 + fw, abs(abs(b.y) - 30.)));      // the shade a runner lays on the boards beside it
    gloss = 0.22;
    if (edge > 0.2) {      // a runner: a walnut rail pegged in oak, as the runner let into a drawer's side; long grain, a worn arris
      float sec = abs(b.y), lg = mix(0.5, vnoise(vec2(b.x * 0.09 + seed * 40., b.y * 5.)), 1. - smoothstep(0.03, 0.12, fw)), pg = length(vec2((fract(b.x / 9.) - 0.5) * 9., b.y));
      alb = uWoodB * vec3(1.05, 0.86, 0.76) * (0.7 + 0.5 * lg) * (1. - 0.25 * poreFade * smoothstep(0.15, 0.3, pore));
      alb = mix(alb, uOak * 1.25, (1. - smoothstep(0.45, 0.65 + fw, pg)) * jFade);
      float arris = jFade * (1. - smoothstep(0.02, 0.2 + fw, abs(sec - 2.2)));
      alb = mix(alb, worn, 0.7 * arris);
      alb *= 1. - 0.16 * smoothstep(2.6, 3.8, sec);      // a rail's side is a little darker toward the boards: dark wood, never black
      alb = mix(uOak * vec3(1.02, 0.9, 0.76) * 0.864, alb, 1. - smoothstep(1.2, 3.5, fw));      // far off, where a rail is a pixel or two wide, it settles into the boards' tone: no dark thread flickers under a far drawer
      gloss = 0.3 * (1. - 0.8 * arris);      // the worn arris is matte
    }
    // dust in the still air well back from the lip (in the board's own metres, so it rides with its drawer); wet where the water threads off the lip
    float dustB = smoothstep(0.4, 0.8, fbm(b * 0.11 + seed * 9.)) * (1. - smoothstep(-16., -6., b.x)) * tFade;
    alb = mix(alb, vec3(0.42, 0.33, 0.22), 0.26 * dustB); gloss *= 1. - 0.7 * dustB;
    float wet = smoothstep(0., 1., b.x + 0.9 + 1.8 * fbm(vec2(b.y * 0.13 + seed * 7., 3.)) + 4.5 * jFade * pow(vnoise(vec2(b.y * 0.8, seed * 5.)), 3.));      // a narrow band: a drawer a little way out must not go dark all under
    wet *= tFade; alb *= mix(1., 0.68, wet); gloss = mix(gloss, 0.5, wet);
  }
  // the hall behind the keyhole plate is the inside of the carcass: plain pale boards. A slab of sun comes in at the
  // mouth and slants across the floor and the far wall; the plate hangs in it and throws its own shape.
  float hallK = step(vW.z, -0.45) * step(abs(vW.x), 55.3) * step(285.4, vW.y) * step(vW.y, 326.3), slab = 0., deep = 0.;
  if (hallK > 0.5) {
    float c = abs(N.x) > 0.5 ? vW.z : vW.x, bj = abs(fract(c / 6.5) - 0.5) * 6.5, bi = floor(c / 6.5);
    alb = uOak * vec3(1.08, 0.8, 0.52) * (0.72 + 0.3 * wide + 0.22 * (big - 0.5)) * (0.82 + 0.3 * fract(bi * 0.37 + 0.2));
    alb *= 1. - 0.5 * (1. - smoothstep(0.03, 0.14 + fw, bj));
    gloss = 0.1; occ = 0.08 + 0.42 * smoothstep(4., 46., -vW.z); deep = smoothstep(5., 30., -vW.z);
    vec3 Ls = normalize(uSun); float tz = -vW.z / max(Ls.z, 0.08); vec3 E = vW + Ls * tz;
    slab = (1. - smoothstep(53.2, 55., abs(E.x))) * (1. - smoothstep(324., 326., E.y));
    slab *= 1. - (1. - smoothstep(9., 10.6, abs(E.x))) * smoothstep(287.2, 288.8, E.y) * (1. - smoothstep(321.4, 322.8, E.y));
  }
  // --- fibre direction: grain axis turned by the figure, tilted out of the surface ---
  vec3 up = abs(N.y) > 0.9 ? vec3(0., 0., 1.) : vec3(0., 1., 0.);
  vec3 T = normalize(cross(up, N) + vec3(1e-5, 0., 0.)); vec3 B = cross(N, T);
  if (vert + band > 0.5) { vec3 t0 = T; T = B; B = -t0; }
  float turn = mix((big - 0.5) * 0.9 + (ring - 0.5) * 0.25 * ringFade, (swirl - 0.5) * 5. + (fbm(bw * 0.35) - 0.5) * 1.6, burr);
  float tilt = (tone - 0.5) * 0.42 + (flame - 0.5) * 0.3;
  vec3 F = normalize(T * cos(turn) + B * sin(turn) + N * tilt);
  vec3 L = normalize(uSun), H = normalize(L + V + vec3(0., 1e-4, 0.));
  float nl = dot(N, L), lit = smoothstep(-0.05, 0.25, nl) * (1. - occ) * (1. - hsh) * canyonShade(vW);
  lit = mix(lit, smoothstep(-0.05, 0.25, nl) * slab, hallK);
  float fh = dot(F, H), sinFH = sqrt(max(1. - fh * fh, 1e-6));
  float aniso = pow(clamp(sinFH, 1e-4, 1.), 24.) * (0.35 + 0.65 * max(nl, 0.)) * (1. - 0.4 * burr);
  float nh = max(dot(N, H), 0.), nv = max(dot(N, V), 0.);
  float coat = pow(clamp(nh, 1e-4, 1.), 300.) * (0.55 + 0.45 * tone);      // the clear coat's own glint: a narrow warm band, never a white patch
  float fres = 0.04 + 0.96 * pow(clamp(1. - nv, 1e-4, 1.), 5.);
  vec3 amb = ambientAt(N) * (1. - 0.65 * occ);
  // Luminous shade: where the sun does not reach, the wood is lit by the sunlit wall opposite, the sand and the
  // river. Lb points at that second light (the sun's azimuth turned about, low); faces that look down take the
  // river's turquoise with a slow caustic shimmer.
  float shadeK = 1. - lit * smoothstep(0., 0.3, nl + 0.05);
  vec3 Lb = normalize(vec3(-uSun.x, 0.25, -uSun.z) + vec3(1e-4, 0., 0.));
  float nlb = max(dot(N, Lb), 0.), down = smoothstep(0.35, 0.9, -N.y) * (1. - hallK);
  float caus = 1.;
  if (down > 0.01) {      // light thrown up by the river: a slow net of bright lines
    vec2 cq = vW.xz * mix(0.16, 0.3, isBot) + 0.5 * vec2(fbm(vW.xz * 0.07 + uTime * 0.04), fbm(vW.zx * 0.07 - uTime * 0.03));      // under a drawer's boards the net is finer
    float w1 = smoothstep(0.3, 0.62, cell(cq + vec2(uTime * 0.05, -uTime * 0.035))), w2 = smoothstep(0.28, 0.6, cell(cq * 1.37 + 7. - vec2(uTime * 0.04, uTime * 0.045)));
    caus = mix(0.62 + 1.25 * w1 * (0.35 + 0.65 * w2), 0.8 + 0.75 * w1 * (0.35 + 0.65 * w2), isBot);      // and gentler: light on boards, not a mottle
  }
  vec3 bcol = mix(uBounce, (vec3(0.2, 0.26, 0.24) + uBounce * 0.95) * caus, down);
  #ifdef CANYON
  float seaK = max(smoothstep(130., 175., abs(vW.x)) * (1. - smoothstep(650., 720., vW.z)), 1. - smoothstep(40., 110., vW.z));
  // a chest in the open sea has no wall opposite, but the sunlit sawdust bars and its lit neighbours throw warm light up at it from all round: its shade stays red-brown
  bcol = mix(bcol, bcol * vec3(1.1, 0.92, 0.78), seaK * (1. - down)); nlb = mix(nlb, 0.55, seaK);
  #endif
  float sf = smoothstep(0., 0.3, nl), fl = mix(uFill, uFillSun, sf);      // a face that looks at the sun but stands in a drawer's shadow sees the bright sky and river: it keeps the fuller fill
  vec3 fill = bcol * mix(fl, max(fl, 1.3), down) * shadeK * (0.5 + 0.5 * max(nlb, 0.9 * max(nl, 0.)) + 0.45 * down) * (1. - 0.5 * occ * (1. - 0.6 * sf));   // a face turned to the sun but in another's shadow still sees the bright canyon
  // inside the hall the light is what the sun slab throws about: strongest near the lit floor and wall
  if (hallK > 0.5) { float nearSlab = 1. - smoothstep(0., 30., abs(vW.x - 30.) + max(vW.y - 300., 0.) * 0.8); fill = uSunCol * vec3(1., 0.8, 0.55) * (0.1 + 0.2 * nearSlab) * shadeK * mix(1., 0.62, deep); amb *= 0.55 * mix(1., 0.4, deep); }
  vec3 col = alb * (uSunCol * max(nl, 0.) * lit + amb + fill);
  col += uBounce * vec3(1., 0.8, 0.7) * 0.035 * shadeK * (1. - 0.5 * occ) * (1. - hallK);      // a warm floor: the deepest cast shade is red-brown, never black
  col += gloss * lit * uSunCol * (vec3(0.8, 0.4, 0.14) * aniso * 0.3 * (0.5 + tone) + vec3(0.9, 0.62, 0.34) * coat * 0.24);
  // the polish in shade: the same streaming band, lit by the wall opposite
  vec3 Hb = normalize(Lb + V + vec3(0., 1e-4, 0.)); float fhb = dot(F, Hb);
  float anisoB = pow(clamp(sqrt(max(1. - fhb * fhb, 1e-6)), 1e-4, 1.), 14.) * (0.3 + 0.7 * nlb) * (1. - 0.4 * burr);
  col += gloss * shadeK * (1. - 0.6 * occ) * uBounce * uFill * vec3(1., 0.62, 0.3) * anisoB * 0.28 * (0.5 + tone);
  vec3 refl = mix(skyAt(reflect(-V, N)), uBounce * 1.5 + uSky * 0.15, 0.65 * shadeK * (1. - down));
  col += gloss * fres * refl * 0.55 * (1. - 0.7 * occ) * mix(1., min(0.45 + 0.3 * uFill, 1.), shadeK) * (1. - 0.9 * deep);
  if (hallK > 0.5) {      // slow sunlit dust: a few large soft motes of brass and tan drift in the hall, thickest in and beside the sun slab, thinning to nothing in the far corners
    float nearS = 1. - smoothstep(0., 36., abs(vW.x - 30.) + max(vW.y - 300., 0.) * 0.8);
    vec2 sq = (abs(N.z) > 0.5 ? vW.xy : (abs(N.x) > 0.5 ? vW.zy : vW.xz)) * 0.21 + uTime * vec2(0.012, 0.004), si = floor(sq), sf = fract(sq) - 0.5 - 0.3 * (h22(si) - 0.5);
    float sh = h21(si + 3.7), big = 0.6 + 0.8 * fract(sh * 17.3);
    sf += 0.05 * vec2(sin(uTime * 0.21 + sh * 40.), cos(uTime * 0.17 + sh * 23.));
    float mote = (1. - smoothstep(0.015 * big, 0.21 * big, length(sf))) * step(0.92 - 0.42 * nearS, sh);
    col += mix(vec3(0.76, 0.48, 0.07), vec3(0.69, 0.38, 0.12), step(0.5, fract(sh * 7.1))) * mote * (0.15 + 0.85 * nearS) * (0.3 + 0.7 * deep) * (1. - 0.8 * slab) * 0.75;
  }
  gl_FragColor = vec4(col, 1.);
  #ifdef USE_FOG
  // haze on the wood goes toward the sky's pale butter, never grey, and never takes more than half: a far chest is two tones paler and red-brown beneath
  float hzF = min(1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), 0.5) * uHaze.y;
  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor, vec3(0.89, 0.77, 0.55), uHaze.x), hzF);
  #endif
}`;

// ---------- the cabinet-work: carcass, mouldings, feet, columns, hall, nine drawers ----------
const pl = (xs, t) => { const f = clamp(t, 0, 1) * (xs.length - 1), i = Math.min(xs.length - 2, Math.floor(f)); return lerp(xs[i], xs[i + 1], f - i); };
async function buildWood(rng, ctx) {
  const brk = async () => { if (ctx && ctx.yield) await ctx.yield(); };
  const G = new Geo(), S = 9; // S = static (no drawer offset)
  const sd = () => rng.range(0, 1);
  // bun feet with ring turnings and a tide line of chamfers
  const foot = [[4.6, 0], [6.0, 0.5], [6.9, 2.0], [7.0, 3.4], [6.5, 5.0], [5.3, 6.1], [5.3, 6.5], [6.0, 6.8], [6.0, 7.4], [5.1, 7.7], [5.1, 8.1], [6.5, 8.5], [6.5, 9]];
  for (const fx of [-55, 55]) for (const fz of [-9, -61]) G.lathe(foot, 20, fx, 0, fz, [0, sd(), 0, 0], S, { occ: (p) => (p[1] > 8 ? 0.6 : p[1] < 1.2 ? 0.45 : 0) });
  // stepped plinth moulding, mitred round three sides
  const plinth = [[0, 7], [0.7, 7], [1.1, 6.3], [1.1, 5.5], [2.3, 4.3], [2.3, 3.5], [3.5, 2.5], [3.7, 0.7], [3.2, 0], [-2, 0]];
  const s1 = sd();
  G.sweep(plinth, 2, (t, a, b) => [lerp(-HW - a, HW + a, t), 9 + b, a], [0, s1, 0, 0], S, { len: 2 * HW });
  for (const sx of [-1, 1]) G.sweep(plinth, 2, (t, a, b) => [sx * (HW + a), 9 + b, lerp(a, -DEPTH, t)], [0, sd(), 0, 0], S, { len: DEPTH });
  G.box(-HW, HW, 9, 9.01, -DEPTH, 0, [0, s1, 0, 0.8], S, 'y');
  await brk();
  // carcass flanks: frame-and-panel, vertical grain
  for (const sx of [-1, 1]) {
    const x = sx * HW, f = sx > 0 ? 'X' : 'x', m = [5, sd(), 0, 0];
    G.box(sx > 0 ? x - 1 : x, sx > 0 ? x : x + 1, 16, HALL_TOP, -DEPTH, -1, m, S, f);
    const xo = sx > 0 ? [x, x + 0.9] : [x - 0.9, x];
    for (const [z0, z1] of [[-DEPTH, -62], [-12, -1]]) G.box(xo[0], xo[1], 16, HALL_TOP, z0, z1, [5, sd(), 0, 0], S, f + 'zZ');
    for (const y of [16, 114, 212, 316]) G.box(xo[0], xo[1], y, y + 10, -62, -12, [0, sd(), 0, 0], S, f + 'yY');
    // quarter column standing proud on the front corner, with base and capital turnings
    const col = [[5.2, 0], [5.2, 3], [4.4, 3.6], [4.4, 4.4], [4.9, 4.8], [4.9, 6.4], [4.0, 7.4], [3.7, 150], [4.0, 302], [4.9, 303.2], [4.9, 304.8], [4.3, 305.4], [4.3, 306.4], [5.2, 307], [5.2, 310]];
    G.lathe(col, 14, sx * 60, 16, -1.5, [5, sd(), 0, 0], S, { along: false, len: 1 });
    G.box(sx > 0 ? FHW : -HW, sx > 0 ? HW : -FHW, 16, HALL_TOP, -2, -1.99, [5, sd(), 0, 0.3], S, 'Z');
    await brk();
  }
  for (let k = 0; k < 6; k++) G.box(-HW + k * 21.67, -HW + (k + 1) * 21.67, 9, TOP - 6, -DEPTH, -DEPTH + 0.01, [5, sd(), 0, 0.15], S, 'z');
  await brk();
  // rails between the tiers (seen in the shadow slot under each drawer)
  for (let i = 0; i <= N; i++) { const y = Y0 + RISE * i; if (i < N) G.box(-FHW, FHW, y, y + RAIL, -3, -0.5, [0, sd(), 0, 0.75], S, 'Z'); }
  // the dark hall behind the keyhole plate
  {
    const yf = lipY(N - 1), zb = -46, m = [0, sd(), 0, 0];
    const occ = (p) => clamp(0.5 + (-p[2]) / 22, 0, 1);
    const hall = [[-FHW, yf], [-FHW, HALL_TOP], [FHW, HALL_TOP], [FHW, yf]];
    G.sweep(hall, 4, (t, a, b) => [a, b, lerp(-0.5, zb, t)], m, S, { len: 46, along: false, occ, edge: 0 });
    G.box(-FHW, FHW, yf, HALL_TOP, zb, zb + 0.01, [3, 0, 0, 1], S, 'Z');
    G.box(-FHW, FHW, yf - 0.01, yf, zb, -0.5, [3, 0, 0, 1], S, 'Y');
  }
  await brk();
  // frieze, dentils and three-step cornice
  G.box(-HW, HW, HALL_TOP, 334, -DEPTH, 0.6, [0, sd(), 0, 0], S, 'xXZ');
  G.box(-FHW, FHW, HALL_TOP, HALL_TOP + 0.01, -46, 0.6, [3, 0, 0, 1], S, 'y');
  const corn = [[0, 0], [1.3, 0], [1.3, 1.3], [2.5, 2.5], [2.5, 4.3], [4.1, 5.5], [4.1, 7.5], [5.8, 8.9], [5.8, 11.4], [5.2, 12], [-4, 12]];
  G.sweep(corn, 2, (t, a, b) => [lerp(-HW - a, HW + a, t), 334 + b, 0.6 + a], [0, sd(), 0, 0], S, { len: 2 * HW });
  for (const sx of [-1, 1]) G.sweep(corn, 2, (t, a, b) => [sx * (HW + a), 334 + b, lerp(0.6 + a, -DEPTH, t)], [0, sd(), 0, 0], S, { len: DEPTH });
  G.box(-HW - 4, HW + 4, TOP - 0.01, TOP, -DEPTH, -3, [0, sd(), 0, 0], S, 'Y');
  await brk();
  const dm = [0, sd(), 0.25, 0];
  for (let x = -63; x <= 61.01; x += 4) G.box(x, x + 2, 331.6, 334, 0.6, 2.4, dm, S, 'xXyZ');
  for (const sx of [-1, 1]) for (let z = -3; z >= -69; z -= 4) G.box(sx > 0 ? HW : HW * sx - 1.8, sx > 0 ? HW + 1.8 : -HW, 331.6, 334, z - 2, z, dm, S, 'zZy' + (sx > 0 ? 'X' : 'x'));
  await brk();
  // ---- the nine drawers ----
  const xs = [-55, -54.5, -50.6, -49.4, -44, -38, -32, -26, -20, -14, -8, -4.6, -3.6, 0, 3.6, 4.6, 8, 14, 20, 26, 32, 38, 44, 49.4, 50.6, 54.5, 55];
  const prof = [[-3, 0], [-0.5, 0], [0, 0.5], [0, 4.4], [0.9, 5.6], [0.9, 20.4], [0, 21.6], [0, 25.5], [-0.5, 26], [-3, 26], [-3, 24.6]];
  for (let i = 0; i < N; i++) {
    const out = outOf(i), yt = lipY(i), yb = yt - FH, seed = sd();
    const place = (t, a, b) => {
      const x = pl(xs, t), ex = FHW - Math.abs(x);
      let aa = a > 0 ? a * clamp((ex - 4.4) / 1.2, 0, 1) : a;
      if (a >= -0.5) aa -= Math.max(0, 0.5 - ex);
      let y = yb + b; if (b > 25.4) y -= 1.5 * (1 - smoothstep(3.6, 4.6, Math.abs(x)));
      return [x, y, out + bowAt(x) + aa];
    };
    G.sweep(prof, xs.length - 1, place, [1, seed, 0, 0], i, { uv: (t, a, b) => [pl(xs, t), b], chamfer: 0.9 });
    for (const sx of [-1, 1]) {
      const xo = sx * 54.5, xi = sx * 52.5, zf = out - 0.5, so = sd();
      // front end cap (walnut), then the oak side with its dovetails, its top edge and inner lip
      G.quad([sx * FHW, yb, out], [sx * FHW, yb, out - 3], [sx * FHW, yt, out - 3], [sx * FHW, yt, out], [[0, 0], [3, 0], [3, 26], [0, 26]], [5, seed, 0.5, 0], i);
      G.quad([xo, yb, zf - 2.5], [xo, yb, -1], [xo, yt, -1], [xo, yt, zf - 2.5], [[0, 0], [zf - 1.5, 0], [zf - 1.5, 26], [0, 26]], [2, so, 0, 0], i);
      G.quad([xo, yt, zf - 2.5], [xo, yt, -1], [xi, yt, -1], [xi, yt, zf - 2.5], [[8, 0], [zf + 6.5, 0], [zf + 6.5, 2], [8, 2]], [2, so, 0.35, 0], i);
      G.quad([xi, yt - 1.6, zf - 2.5], [xi, yt - 1.6, -1], [xi, yt, -1], [xi, yt, zf - 2.5], [[8, 3], [zf + 6.5, 3], [zf + 6.5, 4.6], [8, 3]], [2, so, 0, 0.3], i);
    }
    // the drawer's bottom: boards as under the worlds' chests (kind 6): board x = metres back from the lip (0 at the lip), y = across
    G.quad([-54.5, yb, -1], [54.5, yb, -1], [54.5, yb, out - 0.5], [-54.5, yb, out - 0.5], [[-0.5 - out, -54.5], [-0.5 - out, 54.5], [0, 54.5], [0, -54.5]], [6, sd(), 0, 0.8], i);
    await brk();
  }
  const built = G.build(); await brk();
  return built;
}

// ---------- assembly ----------
const BUILDERS = [];   // each: async (env) => void, pushed by the sections below
const DEFAULT_PALETTE = ['#3B2417', '#8A5A32', '#D9A662', '#F2E3C4', '#5E8F5A', '#4FB7C4', '#E2B84C'];
const _q = new THREE.Quaternion();
const easeHold = (s) => { const e = clamp(1.6 * s, -1, 1); return 1.5 * e - 0.5 * e * e * e; };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('tallboy') : ctx.rng;
  const palHex = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map((h) => new THREE.Color(h));
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const sun = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.83, 0.41, 0.39)).normalize();
  const U = {
    uSun: { value: sun },
    uSunCol: { value: new THREE.Color(opts.sunColor ?? '#FFD9A0').multiplyScalar(2.3) },
    uSky: { value: new THREE.Color(opts.skyColor ?? '#9DB9C6').multiplyScalar(0.85) },
    uHorizon: { value: new THREE.Color(palHex[3]).multiplyScalar(0.95) },
    uBounce: { value: new THREE.Color(opts.bounceColor ?? palHex[2]).multiplyScalar(0.5) },
    uSunL: { value: sun.clone() }, uTime: { value: 0 }, uProg: { value: 0 }, uOff: { value: new Array(10).fill(0) }, uFill: { value: opts.fill ?? 1.7 }, uFillSun: { value: opts.fillSun ?? opts.fill ?? 1.7 }, uHaze: { value: new THREE.Vector2(opts.hazeWarm ?? 0, opts.hazeK ?? 1) },
  };
  const group = new THREE.Group(); group.name = 'tallboy';
  const mat = (vs, fs, own = {}, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const add = (geo, material, order = 0) => { const m = new THREE.Mesh(geo, material); m.frustumCulled = false; m.renderOrder = order; group.add(m); return m; };
  // per-seed character of each drawer's slow breathing (amplitude m, period s, phase)
  const breath = []; for (let i = 0; i < N; i++) breath.push({ a: rng.range(0.5, 1.5), p: rng.range(14, 26), f: rng.range(0, 1) });
  const byFlight = {};      // drawer id -> seconds: a drawer the world's line of flight is laid against breathes by the flight's own second (hero.breatheBy), not the clock
  const drawerOffset = (id, time) => (id >= N ? 0 : breath[id].a * easeHold(Math.sin(((id in byFlight ? byFlight[id] : time) / breath[id].p + breath[id].f) * Math.PI * 2)));
  const anchors = {}, updaters = [];
  const env = { ctx, rng, pal, palHex, detail, U, group, mat, add, anchors, updaters, drawerOffset, sun, ribbon: opts.ribbon, moths: opts.moths, flocks: opts.flocks };

  // wood
  const wA = pal[0].clone(), wC = pal[1].clone(), wB = pal[0].clone().lerp(pal[1], 0.45); wB.r *= 1.12; wB.b *= 0.85;
  const hueJit = rng.range(-0.012, 0.012); for (const c of [wA, wB, wC]) c.offsetHSL(hueJit, 0, 0);
  const woodMat = mat(WOOD_VS, WOOD_FS, {
    uWoodA: { value: wA.multiplyScalar(0.8) }, uWoodB: { value: wB.multiplyScalar(0.85) }, uWoodC: { value: wC.multiplyScalar(0.72) },
    uCream: { value: pal[3] }, uOak: { value: pal[2].clone().lerp(pal[3], 0.5).multiplyScalar(0.44) } }, { side: THREE.DoubleSide });
  await ctx.yield?.();
  add(await buildWood(rng.fork ? rng.fork('wood') : rng, ctx), woodMat);
  await ctx.yield?.();
  for (const b of BUILDERS) { await b(env); await ctx.yield?.(); }

  // ---- anchors common to every build ----
  anchors.lips = []; anchors.meadows = [];
  for (let i = 0; i < N; i++) {
    anchors.lips.push({ position: new THREE.Vector3(0, lipY(i), outOf(i) + BOW), drawer: i });
    anchors.meadows.push({ center: new THREE.Vector3(0, lipY(i) - SOIL, i === N - 1 ? outOf(i) * 0.5 : outOf(i) - 9), halfWidth: 52, zNear: outOf(i) - 3, zFar: i === N - 1 ? 0 : outOf(i + 1) + BOW + 1, y: lipY(i) - SOIL, drawer: i });
  }
  const seatY = PLATE_Y, pitch = THREE.MathUtils.degToRad(16);
  anchors.portalSeat = { position: new THREE.Vector3(0, seatY, PLATE_Z), normal: new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch)), radius: 7, pitch };
  const fly = [[0, 20, 640], [0, 16, 420], [8, 14, 300], [18, 22, 262]];
  for (let i = 0; i < N; i++) fly.push([i < 7 ? 20 : 20 - (i - 6) * 9, lipY(i) + 9, outOf(i) + BOW + 5.1]);   // 9 m outside the line of lips
  fly.push([0, seatY + 60 * Math.sin(pitch), PLATE_Z + 60 * Math.cos(pitch)], [0, seatY, PLATE_Z]);
  anchors.flyThrough = fly.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  anchors.viewpoints = { river: new THREE.Vector3(0, 20, 640), bend: new THREE.Vector3(-120, 40, 520), climb: new THREE.Vector3(20, lipY(3) + 9, outOf(3) + 16), top: new THREE.Vector3(0, seatY + 16.5, 61) };
  anchors.cascadeFoot = new THREE.Vector3(0, 0, outOf(0) + BOW + 6);

  let prog = 0;
  // opts.focus = 'hall' | 'handle' | 'mid' | 'base' | 'top' | 'stag' | 'foot' moves a viewer's orbit; opts.prog pins the progress
  const focus = opts.focus || null, FPROG = typeof opts.prog === 'number' ? opts.prog : null;
  const FOC = { hall: [0, 300, 30, 26], handle: [30, lipY(3) - 13, outOf(3) + 8, 12], mid: [0, lipY(4) - 8, outOf(4), 42], base: [0, 24, 205, 50], top: [0, 292, 40, 44], stag: [10.5, 286.5, 39, 5], foot: [0, 40, 215, 34] }[focus];
  const hero = {
    object: group, radius: FOC ? FOC[3] : 190, height: FOC ? FOC[3] : TOP, center: FOC ? new THREE.Vector3(FOC[0], FOC[1], FOC[2]) : new THREE.Vector3(0, 165, 70), anchors, ground: true, groundY: 0,
    drawerOffset,
    uniforms: U,
    setProgress(u) { prog = clamp(u, 0, 1); },
    breatheBy(id, seconds) { byFlight[id] = seconds; },
    update(dt, time, camera) {
      U.uTime.value = time; U.uProg.value = FPROG !== null ? FPROG : prog;
      for (let i = 0; i < N; i++) U.uOff.value[i] = drawerOffset(i, time);
      group.getWorldQuaternion(_q).invert(); U.uSunL.value.copy(U.uSun.value).applyQuaternion(_q);   // sun in the hero's own space, for the handle shadows
      for (const f of updaters) f(dt, time, camera, prog);
    },
    dispose() {},
  };
  return hero;
}

// ---------- brass: bail handles, escutcheons, the keyhole plate ----------
const BRASS_VS = VS_HEAD + /* glsl */`
attribute vec2 aUv; attribute vec4 aMat;
varying vec2 vUv; varying vec4 vMat;
void main() {
  vUv = aUv; vMat = aMat; vec3 p = position; vec3 n = normal;
  if (aMat.x > 1.5 && aMat.x < 2.5) {                  // a bail: swings about its posts (aUv = pivot y, z)
    float ph = aMat.y * 6.2831;
    float a = 0.085 * sin(uTime * 0.9 + ph) + 0.05 * sin(uTime * 2.3 + ph * 1.7) * (0.5 + 0.5 * sin(uTime * 0.21 + ph));
    a += 0.04 * max(0., sin(uTime * 0.9 + ph + 1.2));     // knocks back a little further than it comes forward
    float c = cos(a), s = sin(a); vec2 r = p.yz - aUv;
    p.yz = aUv + vec2(c * r.x - s * r.y, s * r.x + c * r.y);
    n.yz = vec2(c * n.y - s * n.z, s * n.y + c * n.z);
  }
  vP = position; p.z += drwOff();
  vN = normalize(mat3(modelMatrix) * n);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BRASS_FS = FS_HEAD + /* glsl */`
uniform vec3 uBrass;
varying vec2 vUv; varying vec4 vMat;
void main() {
  float kind = floor(vMat.x + 0.5);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
  if (dot(N, V) < 0.) N = -N;
  float fw = max(fwidth(vUv.x), fwidth(vUv.y)) + 0.01;
  float cut = 0., hole = 0.;
  if (kind > 0.5 && kind < 1.5) {                      // the big plate: uv in metres about the keyhole head
    vec2 q = vUv; float r = length(q);
    vec2 e = vec2(10., 17.) - abs(q - vec2(0., -1.));  // distance to the plate's edge
    float ed = min(e.x, e.y);
    cut = 1. - smoothstep(0.06, 0.06 + fw, abs(ed - 1.1)); cut = max(cut, 1. - smoothstep(0.04, 0.04 + fw, abs(ed - 1.5)));
    cut = max(cut, (1. - smoothstep(0.05, 0.05 + fw, abs(r - 8.4))) );
    float a = satan(q.y, q.x);
    float rays = smoothstep(0.75, 0.95, abs(sin(a * 18.))) * smoothstep(8.6, 8.9, r) * (1. - smoothstep(9.3, 9.6, r));
    // scrolled acanthus: spirals in the four spandrels
    vec2 s = abs(q - vec2(0., -1.)) - vec2(5.4, 11.6); float sr = length(s);
    float sa = satan(s.y, s.x);
    float spiral = 1. - smoothstep(0.07, 0.07 + fw, abs(fract(sr * 0.55 - sa * 0.3183 * 0.5) - 0.5) * 1.2);
    cut = max(cut, max(rays, spiral * (1. - smoothstep(3.0, 3.4, sr))) * step(1.7, ed));
    N = normalize(N + 0.3 * vec3(fbm(q * 0.45) - 0.5, fbm(q * 0.45 + 13.) - 0.5, 0.) + 0.1 * vec3(vnoise(q * 3.) - 0.5, vnoise(q * 3. + 7.) - 0.5, 0.));
  } else if (kind > 2.5 && kind < 3.5) {               // escutcheon: uv in metres, keyhole drawn dark
    vec2 q = vUv; float head = length(q - vec2(0., 0.35)) - 0.42;
    float slot = max(abs(q.x) - (0.16 + 0.1 * (0.3 - q.y)), max(q.y - 0.35, -0.75 - q.y));
    hole = 1. - smoothstep(0., fw, min(head, slot));
    cut = (1. - smoothstep(0.03, 0.03 + fw, abs(length(q) - 1.45))) ;
  } else if (kind > 3.5 && kind < 4.5) {               // domed screw head with its slot
    hole = 0.85 * (1. - smoothstep(0.1, 0.1 + fw, abs(vUv.x * 0.8 + vUv.y * 0.6)));
  }
  vec3 L = normalize(uSun), H = normalize(L + V + vec3(0., 1e-4, 0.)), R = reflect(-V, N);
  float nl = dot(N, L), nh = max(dot(N, H), 0.), nv = max(dot(N, V), 0.);
  float tarn = fbm(vP.xy * 0.35 + vP.z * 0.2) * 0.5 + fbm(vP.xy * 2.1) * 0.25;
  vec3 base = uBrass * vec3(1., 0.86, 0.62) * (0.5 + 0.3 * tarn);
  // two-tone matcap: the metal mirrors a warm ground below and a pale sky above
  float m = smoothstep(-0.25, 0.1, R.y) - 0.45 * smoothstep(0.12, 0.5, R.y) + 0.35 * smoothstep(0.6, 0.95, R.y);
  float cs = canyonShade(vW);                          // brass in the canyon's shade is dull gold, lit by the wall opposite
  vec3 warm = (uBounce + vec3(dot(uBounce, vec3(0.333)))) * 0.5 * uFill * (1. - cs);
  vec3 env = mix(uBounce * 0.22 + warm * 0.6, skyAt(R) * 0.9 + uHorizon * 0.3, clamp(m, 0., 1.));
  float fres = 0.55 + 0.45 * pow(clamp(1. - nv, 1e-4, 1.), 4.);
  vec3 col = base * (uSunCol * (0.35 * max(nl, 0.)) * cs + ambientAt(N) * 0.3 + warm) + base * env * fres * 1.25;
  float glint = pow(clamp(nh, 1e-4, 1.), 140.) * 5.5 + pow(clamp(nh, 1e-4, 1.), 22.) * 0.7;
  col += base * uSunCol * glint * smoothstep(-0.05, 0.2, nl) * cs;
  col *= 1. - 0.72 * cut; col = mix(col, vec3(0.006, 0.005, 0.004), hole);
  col *= 1. - 0.6 * vMat.w;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const HANDLE_X = 30, KEY_X = 13, PLATE_Y = 306, PLATE_Z = 3.2;
const handlePos = (i, sx) => [sx * HANDLE_X, lipY(i) - 12.5, outOf(i) + bowAt(HANDLE_X) + 0.9];
const keyPos = (i) => [KEY_X, lipY(i) - 8.5, outOf(i) + bowAt(KEY_X) + 0.9];
BUILDERS.push(async (env) => {
  const { rng, pal, mat, add, anchors } = env;
  const G = new Geo();
  const latheZ = (prof, seg, cx, cy, cz, m, drw, o = {}) => G.sweep(prof, seg, (t, r, z) => {
    const a = t * Math.PI * 2, rr = r * (o.scallop && r > 2.4 ? 1 + 0.07 * Math.cos(a * 8) : 1);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (o.sy ?? 1), cz + z];
  }, m, drw, { edge: 0, uv: (t, r) => [Math.cos(t * Math.PI * 2) * r, Math.sin(t * Math.PI * 2) * r * (o.sy ?? 1)], ...o });
  const rosette = [[3.0, 0], [3.0, 0.25], [2.6, 0.6], [2.2, 0.6], [2.0, 0.42], [1.5, 0.42], [1.2, 0.95], [0.78, 1.15], [0.78, 4.1], [1.1, 4.35], [1.1, 5.65], [0.72, 5.95], [0, 6.05]];
  const ring = []; for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI * 2; ring.push([Math.cos(a), Math.sin(a)]); }
  const half = [[-5, 0], [-5.95, -0.55], [-6.2, -1.8], [-5.4, -3.05], [-3.7, -4.3], [-1.9, -4.95], [0, -5.15]];
  const pts = half.concat(half.slice(0, -1).reverse().map((q) => [-q[0], q[1]]));
  anchors.handles = []; anchors.keyholes = [];
  for (let i = 0; i < N; i++) {
    for (const sx of [-1, 1]) {
      const [hx, hy, hz] = handlePos(i, sx);
      for (const px of [-5, 5]) latheZ(rosette, 16, hx + px, hy, hz + bowAt(hx + px) - bowAt(hx), [0, 0, 0, 0], i, { scallop: true });
      const pz = hz + 5 - 0.35, curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(hx + q[0], hy + q[1], pz)), false, 'centripetal');
      const frame = (t) => { const c = curve.getPoint(t), g = curve.getTangent(t); const mid = 1 - Math.abs(t - 0.5) * 2;
        const r = 0.44 + 0.34 * smoothstep(0.1, 0.75, mid) + 0.16 * smoothstep(0.9, 0.96, mid) + 0.2 * (1 - smoothstep(0, 0.05, mid)); return { c, g, r }; };
      G.sweep(ring, 28, (t, a, b) => { const f = frame(t); return [f.c.x - f.g.y * a * f.r, f.c.y + f.g.x * a * f.r, f.c.z + b * f.r]; },
        [2, rng(), 0, 0], i, { edge: 0, uv: () => [hy, pz], nrm: (t, a, b) => { const f = frame(t); return [-f.g.y * a, f.g.x * a, b]; } });
      anchors.handles.push({ position: new THREE.Vector3(hx, hy - 2.5, pz), drawer: i, side: sx });
      await env.ctx.yield?.();
    }
    const [kx, ky, kz] = keyPos(i);
    latheZ([[1.9, 0], [1.9, 0.22], [1.55, 0.5], [0, 0.56]], 20, kx, ky, kz, [3, 0, 0, 0], i, { sy: 1.3 });
    anchors.keyholes.push(new THREE.Vector3(kx, ky - 0.2, kz + 0.6));
    await env.ctx.yield?.();
  }
  await env.ctx.yield?.();
  // ---- the keyhole plate, hung from the frieze across the hall mouth ----
  const angs = []; for (let k = 0; k <= 120; k++) angs.push(-Math.PI / 2 + (k / 120) * Math.PI * 2);
  for (const e of [0.19, 0.367, 0.5075, Math.atan2(10, 18)]) angs.push(-Math.PI / 2 + e, -Math.PI / 2 + Math.PI * 2 - e);
  angs.push(Math.atan2(16, 10), Math.PI - Math.atan2(16, 10), Math.PI + Math.atan2(18, 10));
  angs.sort((a, b) => a - b);
  const rIn = (th) => { let ph = th + Math.PI / 2; if (ph > Math.PI) ph -= Math.PI * 2; const ap = Math.abs(ph);
    const slot = ap < 1.2 ? Math.min(13.5 / Math.cos(ap), 2.6 / Math.max(Math.sin(ap), 1e-3)) : 0; return Math.max(7.25, slot); };
  const rOut = (th) => Math.min(10 / Math.max(Math.abs(Math.cos(th)), 1e-3), (Math.sin(th) > 0 ? 16 : 18) / Math.max(Math.abs(Math.sin(th)), 1e-3));
  const plateP = (t, a, z) => { const th = pl(angs, t), r = a < 5 ? rIn(th) + a : rOut(th) - (a - 10); return [Math.cos(th) * r, PLATE_Y + Math.sin(th) * r, z]; };
  G.sweep([[0, PLATE_Z - 1.5], [0, PLATE_Z - 0.2], [0.3, PLATE_Z], [10.9, PLATE_Z], [10, PLATE_Z - 0.5], [10, PLATE_Z - 1.1]], angs.length - 1, plateP, [1, 0, 0, 0], 9,
    { edge: 0, uv: (t, a, z) => { const q = plateP(t, a, z); return [q[0], q[1] - PLATE_Y]; } });
  for (const sx of [-1, 1]) {
    for (const sy of [12.6, -14.6]) latheZ([[1.15, 0], [1.05, 0.4], [0.62, 0.7], [0, 0.78]], 14, sx * 7.6, PLATE_Y + sy, PLATE_Z, [4, 0, 0, 0], 9);
    G.box(sx * 6 - 0.7, sx * 6 + 0.7, PLATE_Y + 15.5, HALL_TOP, PLATE_Z - 1.0, PLATE_Z - 0.4, [0, 0, 0, 0.2], 9, 'xXZ');
  }
  await env.ctx.yield?.();
  const brassMat = mat(BRASS_VS, BRASS_FS, { uBrass: { value: pal[6].clone() } }, { side: THREE.DoubleSide });
  const bg = G.build(); await env.ctx.yield?.();
  add(bg, brassMat);
});

// ---------- meadows: per-drawer ground with a pool drawn in the shader ----------
// zRel = metres behind the inner face of the drawer's lip (the lip follows the bow, so zRel is bow-free)
const zLip = (i, x) => outOf(i) - 3 + bowAt(x);
const meadowDepth = (i) => (i === N - 1 ? outOf(i) - 3 : 14.1);
const poolOf = (i) => (i === N - 1 ? { cz: 17, rx: 15, rz: 9 } : { cz: 8.8, rx: 12, rz: 5.0 });
function poolSdf(i, x, zr) {
  const P = poolOf(i), e = (Math.hypot(x / P.rx, (zr - P.cz) / P.rz) - 1) * Math.min(P.rx, P.rz);
  const ch = Math.max(Math.abs(x) - 2.6, zr - P.cz, -1 - zr);
  return Math.min(e, ch);
}
function groundH(i, x, zr) {
  const hills = 0.4 * Math.sin(x * 0.13 + i * 1.7) * Math.cos(zr * 0.21 + i * 2.3) + 0.22 * Math.sin(x * 0.31 + zr * 0.17 + i);
  const d = poolSdf(i, x, zr);
  return lipY(i) - SOIL + hills * smoothstep(0, 3, d) * smoothstep(0, 2.5, zr) - 0.45 * (1 - smoothstep(-1.5, 1.2, d));
}
const GROUND_VS = VS_HEAD + /* glsl */`
attribute vec2 aUv; attribute vec4 aMat;
varying vec2 vUv; varying vec4 vMat;
void main() {
  vUv = aUv; vMat = aMat; vP = position; vec3 p = position; p.z += drwOff();
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GROUND_FS = FS_HEAD + /* glsl */`
uniform vec3 uGreen; uniform vec3 uGold; uniform vec3 uWater; uniform vec3 uCream;
varying vec2 vUv; varying vec4 vMat;   // vUv = (x, zRel); vMat = (pool cz, rx, rz, depth of the visible strip)
void main() {
  vec2 q = vUv; float cz = vMat.x, rx = vMat.y, rz = vMat.z;
  float e = (length(vec2(q.x / max(rx, 1.), (q.y - cz) / max(rz, 1.))) - 1.) * min(rx, rz);   // the radii are 12 or 15 and 5 or 9 (poolOf): the guard changes nothing
  float ch = max(abs(q.x) - 2.6, max(q.y - cz, -1. - q.y));
  float d = min(e, ch) + (fbm(q * 0.5) - 0.5) * 1.6;
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  float fw = max(fwidth(q.x), fwidth(q.y));
  float dist = length(cameraPosition - vW);
  // grass: mown-by-wind bands, drifts of colour, flowers resolved near and tinted far
  float wind = fbm(q * 0.09 + vec2(uTime * 0.22, uTime * 0.05));
  float gust = smoothstep(0.35, 0.75, fbm(q * vec2(0.05, 0.16) + vec2(uTime * 0.35, 0.)));
  float patchy = fbm(q * 0.21 + 3.);
  float blades = vnoise(q * vec2(7., 1.6) + wind * 2.) * (1. - smoothstep(0.03, 0.2, fw));
  vec3 grass = mix(uGreen * 0.62, mix(uGreen, uGold, 0.55) * 1.05, patchy * 0.7 + 0.3 * gust);
  grass *= 0.8 + 0.4 * blades;
  vec2 fc = q * 1.1; vec2 fi = floor(fc); vec2 fo = fract(fc) - 0.5 - (h22(fi) - 0.5) * 0.6;
  float fl = h21(fi + 7.3), drift = smoothstep(0.42, 0.7, fbm(q * 0.12 + 20.));
  float dot_ = (1. - smoothstep(0.1, 0.16 + fw, length(fo))) * step(fl, 0.5 * drift + 0.06);
  float kindF = h21(fi + 2.1);
  vec3 fcol = kindF < 0.5 ? uCream * 0.8 : (kindF < 0.8 ? vec3(0.8, 0.58, 0.06) : vec3(0.16, 0.26, 0.7));
  float near = 1. - smoothstep(0.1, 0.45, fw);
  grass = mix(grass, fcol, dot_ * near * 0.9);
  grass = mix(grass, mix(grass, uCream * 0.8 + vec3(0.1, 0.08, 0.), 0.3), drift * (1. - near));
  // bank: wet sand and reed shadow round the water
  float bank = 1. - smoothstep(0., 1.3, d);
  vec3 ground = mix(grass, vec3(0.34, 0.27, 0.16) * (0.7 + 0.5 * patchy), bank * 0.8);
  ground = mix(ground, uGreen * 0.3, smoothstep(0.6, 1.3, d) * (1. - smoothstep(1.3, 2.4, d)) * 0.6);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float nl = max(dot(N, L), 0.);
  float back = pow(clamp(dot(-V, L) * 0.5 + 0.5, 1e-4, 1.), 3.);
  float occ = smoothstep(vMat.w - 2.5, vMat.w + 1.5, q.y) * 0.85 + 0.35 * (1. - smoothstep(0., 0.8, q.y));
  vec3 col = ground * (uSunCol * (nl * 0.95 + 0.25 * back) * (1. - occ) + ambientAt(N) * (1. - 0.6 * occ));
  // water
  if (d < 0.) {
    float depth = clamp(-d / 3.5, 0., 1.);
    vec2 src = vec2(0., min(vMat.w - 3.4, cz + 1.6));          // where the fall from above lands
    float rr = length(q - src);
    float rings = sin(rr * 2.6 - uTime * 5.5) * exp(-rr * 0.16) * step(vMat.w, 20.);
    vec2 flow = q + vec2(0., uTime * 0.9 * (1. - smoothstep(0., cz, q.y)));
    float rip = fbm(flow * 0.9 + vec2(uTime * 0.25, 0.)) - 0.5 + 0.35 * rings;
    vec3 Nw = normalize(vec3(rip * 0.5, 1., (fbm(flow * 0.9 + 9.) - 0.5) * 0.5 + 0.2 * rings));
    float fres = 0.04 + 0.96 * pow(clamp(1. - dot(Nw, V), 1e-4, 1.), 5.);
    vec3 body = mix(uWater * 0.75 + uCream * 0.12, uWater * 0.28, depth);
    vec3 wcol = body * (uSunCol * 0.45 * (1. - occ) + ambientAt(vec3(0., 1., 0.)));
    wcol = mix(wcol, skyAt(reflect(-V, Nw)) * (1. - 0.5 * occ), fres * 0.85);
    float sp = pow(clamp(dot(Nw, normalize(L + V + vec3(0., 1e-4, 0.))), 1e-4, 1.), 240.);
    wcol += uSunCol * sp * 2.2 * (1. - occ);
    float foam = smoothstep(0.55, 0.9, fbm(flow * 1.6 + uTime * 0.4)) * exp(-rr * 0.22) * step(vMat.w, 20.) + (1. - smoothstep(0., 0.35, -d)) * 0.35;
    wcol = mix(wcol, vec3(0.85, 0.92, 0.9) * (0.5 + 0.5 * (1. - occ)), clamp(foam, 0., 1.));
    col = mix(col, wcol, smoothstep(0., 0.12 + fw, -d));
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const TUFT_VS = /* glsl */`
attribute vec3 iPos; attribute vec4 iDat; attribute float iDrw; attribute vec2 uv2;
uniform float uOff[10]; uniform float uTime;
varying vec2 vUv; varying vec4 vDat; varying vec3 vW; varying float vQ;
#include <fog_pars_vertex>
void main() {
  float w = iDat.x, h = iDat.y, hang = step(h, 0.), seed = iDat.w;
  float a = iDat.z + position.z * 1.5708 + position.z * seed;   // position.z = quad index (0 or 1)
  vec3 p = vec3(cos(a), 0., sin(a)) * position.x * w * (1. - hang * position.z);
  p.y = uv2.y * h;
  float t = uTime, k = uv2.y * uv2.y;
  vec2 gust = vec2(sin(t * 1.1 + iPos.x * 0.11 + seed * 6.) + 0.6 * sin(t * 2.3 + iPos.x * 0.23 + iPos.z * 0.19), 0.6 * cos(t * 0.9 + iPos.x * 0.07 + seed * 9.));
  p.xz += gust * k * abs(h) * mix(0.16, 0.07, hang) + vec2(0.25, 0.) * k * abs(h) * (1. - hang);
  p.z += hang * k * 0.5;
  vec3 wp = iPos + p; wp.z += uOff[int(clamp(iDrw + 0.5, 0., 9.))];
  vUv = uv2; vDat = iDat; vQ = position.z;
  vec4 wpos = modelMatrix * vec4(wp, 1.); vW = wpos.xyz;
  vec4 mvPosition = viewMatrix * wpos; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TUFT_FS = /* glsl */`
uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uBounce;
uniform vec3 uGreen; uniform vec3 uGold; uniform vec3 uCream;
varying vec2 vUv; varying vec4 vDat; varying vec3 vW; varying float vQ;
#include <fog_pars_fragment>
float h11(float p) { return fract(sin(p * 127.1 + 3.7) * 43758.5453); }
void main() {
  float seed = vDat.w, hang = step(vDat.y, 0.), kind = fract(seed * 7.31);
  float nb = floor(3. + 4. * fract(seed * 3.7)); float u = vUv.x * nb, id = floor(u) + vQ * 17. + seed * 91.;
  float bx = abs(fract(u) - 0.5) * 2., top = 0.5 + 0.5 * h11(id), v = vUv.y;
  float lean = (h11(id + 5.) - 0.5) * 0.8 * v;
  float blade = step(abs(fract(u + lean) - 0.5) * 2., (1. - v / top) * 0.75 + 0.04) * step(v, top);
  // hanging strands carry little leaves; standing tufts may carry a flower head on each blade
  // ivy: a thin wavering stem with pointed leaves on alternate sides, each its own size and green, some missing
  float sx = fract(u + 0.16 * sin(v * 4.3 + id * 1.7) + 0.05 * sin(v * 11. + id)) - 0.5, slen = 0.35 + 0.65 * top;
  float lc = v * (8. + 5. * h11(id + 3.)) + h11(id + 1.), li = floor(lc), lf = fract(lc), lside = mod(li, 2.) * 2. - 1.;
  float lsz = (0.7 + 0.5 * h11(id * 3.1 + li * 7.7)) * step(0.1, h11(li * 1.3 + id * 5.)) * (1. - 0.4 * smoothstep(0.6, 1., v / slen));
  float lwid = 0.4 * lsz * sqrt(max(1. - (2. * lf - 1.) * (2. * lf - 1.), 1e-6)) * (1.2 - 0.7 * lf);
  float leaf = hang * max(step(abs(sx), 0.055), step(abs(sx - lside * 0.2 * lsz), lwid)) * step(v, slen);
  float ltone = 0.55 + 0.9 * h11(id * 3.1 + li * 2.3);
  // the garland's body: clumps of leaves that lie close under the lip and thin out downward, so it is a mass of green even seen edge-on
  vec2 bc = vec2(vUv.x * 3. + 0.37 * vQ, v * 9.), bi = floor(bc); float bush = hang * step(length(fract(bc) - 0.5 - 0.2 * vec2(h11(bi.x * 3.3 + bi.y), h11(bi.y * 5.1 + bi.x) ) + 0.1), 0.6) * step(h11(bi.x * 7.3 + bi.y * 3.1 + seed * 40.), 1.05 - 1.7 * v);
  ltone = mix(ltone, 0.6 + 0.7 * h11(bi.x * 1.7 + bi.y * 9.1 + seed * 13.), bush * (1. - leaf)); leaf = max(leaf, bush);
  float flower = (1. - hang) * step(kind, 0.3) * step(length(vec2((fract(u + lean) - 0.5) * 0.9, (v - top) * abs(vDat.y) / max(vDat.x, 0.1) * nb * 0.9)), 0.34) * step(0.35, h11(id + 9.));
  float m = max(max(blade * (1. - hang), leaf), flower);
  if (m < 0.5) discard;
  vec3 L = normalize(uSun), V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
  vec3 gcol = mix(uGreen * 0.4, mix(uGreen, uGold, 0.15 + 0.35 * h11(id + 2.)) * 0.85, v / top);
  gcol = mix(gcol, mix(vec3(0.028, 0.1, 0.03), vec3(0.075, 0.17, 0.04), step(1.25, ltone) * 0.5) * min(ltone, 1.15) * (0.75 + 0.25 * v), hang);
  float fk = fract(seed * 23.7);
  vec3 fcol = fk < 0.5 ? uCream * 0.62 : (fk < 0.8 ? vec3(0.62, 0.44, 0.05) : vec3(0.13, 0.2, 0.55));
  vec3 alb = mix(gcol, fcol, flower);
  float back = pow(clamp(dot(-V, L) * 0.5 + 0.5, 1e-4, 1.), 2.);
  vec3 col = alb * (uSunCol * (0.5 + 0.45 * back) * mix(0.35 + 0.65 * v, 1., hang * 0.5 + flower) + uSky * 0.45 + uBounce * 0.3);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
BUILDERS.push(async (env) => {
  const { rng, pal, mat, add, detail } = env;
  // ground
  const pos = [], nrm = [], uv = [], mm = [], dd = [], idx = []; let c = 0;
  for (let i = 0; i < N; i++) {
    const dep = meadowDepth(i), P = poolOf(i), rows = [0, 0.5, 1.2, 2.2, 3.5];
    for (let z = 5; z < dep - 1; z += (i === N - 1 ? 3 : 1.6)) rows.push(z);
    rows.push(dep, dep + 3, dep + 6.5);
    const nx = 42, base = c;
    for (const zr of rows) for (let k = 0; k <= nx; k++) {
      const x = -52.5 + (105 * k) / nx, y = groundH(i, x, zr), e = 0.4;
      const dx = groundH(i, x + e, zr) - groundH(i, x - e, zr), dz = groundH(i, x, zr + e) - groundH(i, x, zr - e);
      const l = Math.hypot(dx, 2 * e, dz);
      pos.push(x, y, zLip(i, x) - zr); nrm.push(-dx / l, (2 * e) / l, dz / l); uv.push(x, zr); mm.push(P.cz, P.rx, P.rz, dep); dd.push(i); c++;
    }
    for (let r = 0; r < rows.length - 1; r++) for (let k = 0; k < nx; k++) { const a = base + r * (nx + 1) + k, b = a + nx + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    await env.ctx.yield?.();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(mm, 4));
  g.setAttribute('aDrw', new THREE.Float32BufferAttribute(dd, 1)); g.setIndex(idx);
  const green = pal[4].clone(), gold = pal[2].clone();
  const own = { uGreen: { value: green }, uGold: { value: gold }, uWater: { value: pal[5] }, uCream: { value: pal[3] } };
  add(g, mat(GROUND_VS, GROUND_FS, own, { side: THREE.DoubleSide }));
  await env.ctx.yield?.();
  // tufts, flowers, reeds and the ivy over the lips: one instanced, alpha-tested mesh
  const iPos = [], iDat = [], iDrw = [];
  const total = Math.round(2700 * detail);
  for (let n = 0; n < total; n++) {
    if (n % 400 === 399) await env.ctx.yield?.();
    const i = rng() < 0.3 ? N - 1 : rng.int(0, N - 2), dep = meadowDepth(i);
    const x = rng.range(-51.5, 51.5), zr = 0.5 + (dep - 1.2) * Math.pow(rng(), i === N - 1 ? 1 : 1.25), d = poolSdf(i, x, zr);
    if (d < 0.5) { n -= rng() < 0.5 ? 1 : 0; continue; }
    const reed = d < 2.0; const h = reed ? rng.range(1.8, 2.8) : rng.range(0.7, 1.4), w = reed ? rng.range(1.0, 1.6) : rng.range(1.8, 3.2);
    iPos.push(x, groundH(i, x, zr) - 0.05, zLip(i, x) - zr); iDat.push(w, h, rng.range(0, 3.14), reed ? 0.5 + rng() * 0.49 : rng()); iDrw.push(i);
  }
  for (let i = 0; i < N; i++) {
    const n = Math.round(30 * detail);
    for (let k = 0; k < n; k++) {
      let x = rng.range(-53, 53); if (Math.abs(x) < 6) x = Math.sign(x || 1) * rng.range(6, 16);
      iPos.push(x, lipY(i) - 0.25, outOf(i) + bowAt(x) + (FHW - Math.abs(x) > 5.6 ? 1.15 : 0.3)); iDat.push(rng.range(2.5, 5.5), -rng.range(1.8, 4.6), 0, rng()); iDrw.push(i);
    }
  }
  const tg = new THREE.InstancedBufferGeometry();
  const tp = [], tuv = [], tidx = []; let tc = 0;
  for (let qd = 0; qd < 2; qd++) { for (let r = 0; r <= 2; r++) { tp.push(-0.5, 0, qd, 0.5, 0, qd); tuv.push(0, r / 2, 1, r / 2); } for (let r = 0; r < 2; r++) { const a = tc + r * 2; tidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } tc += 6; }
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('uv2', new THREE.Float32BufferAttribute(tuv, 2)); tg.setIndex(tidx);
  tg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3)); tg.setAttribute('iDat', new THREE.InstancedBufferAttribute(new Float32Array(iDat), 4));
  tg.setAttribute('iDrw', new THREE.InstancedBufferAttribute(new Float32Array(iDrw), 1)); tg.instanceCount = iDrw.length;
  add(tg, mat(TUFT_VS, TUFT_FS, own, { side: THREE.DoubleSide }));
});

// ---------- the cascade: nine falls, notch to pool, and their spray ----------
const FALL_VS = VS_HEAD + /* glsl */`
attribute vec2 aUv; attribute vec4 aMat;
varying vec2 vUv; varying vec4 vMat;
void main() {
  vUv = aUv; vMat = aMat; vP = position; vec3 p = position;
  float v = aUv.y;
  p.x += 0.35 * sin(uTime * 1.7 + v * 9. + aMat.z * 6.) * v * v;      // the sheet wavers as it falls
  p.z += 0.3 * sin(uTime * 1.3 + v * 7. + aUv.x * 2. + aMat.z * 4.) * v + drwOff();
  vN = vec3(0., 0., 1.);
  float drop = step(2.5, aMat.w), sd = aMat.z;
  float tt = fract(uTime * (0.4 + 0.25 * fract(sd * 7.1)) + sd) * 1.5;                     // a droplet's flight, looping
  vec3 vel = vec3((fract(sd * 13.7) - 0.5) * 6., 4.5 + 6. * fract(sd * 29.3), (fract(sd * 51.1) - 0.25) * 5.);
  p = mix(p, position + vec3(0., 0., drwOff()) + vel * tt - vec3(0., 4.9 * tt * tt, 0.), drop);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; mvPosition.xy += drop * aUv * aMat.x * (1.2 - 0.5 * tt);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FALL_FS = FS_HEAD + /* glsl */`
uniform vec3 uWater; uniform vec3 uCream;
varying vec2 vUv; varying vec4 vMat;   // vUv = (-1..1 across, 0..1 down in fall time); vMat = (height m, layer, seed, kind)
void main() {
  float x = clamp(vUv.x, -1., 1.), v = clamp(vUv.y, 0., 1.), H = vMat.x, layer = vMat.y, seed = vMat.z;      // the across and along coordinates, kept to their own ranges
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  float a; vec3 col;
  if (vMat.w > 0.5) {                                   // spray puff / foam ring (soft disc)
    float r = length(clamp(vUv, -1., 1.));
    float n = fbm(vUv * 2.5 + seed * 9. + vec2(0., -uTime * 0.6));
    a = (1. - smoothstep(0.25, 1., r)) * (0.35 + 0.65 * n) * vMat.x;
    if (vMat.w > 1.5) a *= 0.6 + 0.4 * sin(r * 9. - uTime * 3.2 + n * 6.);
    if (vMat.w > 2.5) a = (1. - smoothstep(0.15, 1., r)) * 0.85;
    col = mix(uWater, vec3(1.), 0.8) * (uSunCol * 0.36 + uSky * 0.5);
  } else {
    float t = uTime * (0.55 + 0.12 * layer);
    vec2 q = vec2(x * 3.2 + seed * 7. + layer * 3.3, v * 2.6 - t);
    float streak = fbm(vec2(q.x * 2.2, q.y * 1.4)) * 0.6 + vnoise(vec2(q.x * 7., q.y * 2.2 + 3.)) * 0.4;
    float clots = fbm(vec2(q.x * 0.8, q.y * 3.) + 5.);
    float glass = 1. - smoothstep(0.02, 0.2, v);           // smooth turquoise lip before it breaks up
    float body = smoothstep(0.32 + 0.2 * v, 0.62, streak * 0.75 + clots * 0.45);
    float edge = 1. - smoothstep(0.55 - 0.25 * v, 1., abs(x) + 0.25 * (vnoise(vec2(v * 9. - t * 2., seed)) - 0.5));
    a = mix(body, 0.85, glass) * edge * (0.72 + 0.28 * layer);
    a *= 1. - smoothstep(0.93, 1., v) * 0.6;
    float white = clamp(body * (0.55 + 0.6 * v) + 0.25 * streak, 0., 1.) * (1. - 0.8 * glass);
    float thru = pow(clamp(dot(-V, L) * 0.5 + 0.5, 1e-4, 1.), 2.);  // sun through the water
    vec3 wcol = mix(uWater * 0.8, vec3(0.93, 0.98, 0.97), white);
    col = wcol * (uSunCol * (0.3 + 0.16 * thru) + uSky * 0.42 + uBounce * 0.12);
    col += uSunCol * 0.25 * glass * pow(clamp(1. - abs(x), 1e-4, 1.), 2.);
    if (seed > 5.) {      // a fall into the sea (the world's): a column of water like the canyon's, whose edges fray into strands and a veil of spray as it drops; white-turquoise, the sun through it
      float drop = v * v * H, fray = smoothstep(0.08, 0.8, v), rim = smoothstep(0.25, 0.8, abs(x)) * fray;
      vec2 sq = vec2(x * (1.6 + 1.2 * fray) + seed * 7. + layer * 3.3, drop * 0.05 - t * 1.6);
      float strand = vnoise(vec2(sq.x * 1.25, sq.y * 0.22)) * 0.62 + vnoise(vec2(sq.x * 3.4 + 3., sq.y * 0.7)) * 0.38;
      float clot = fbm(vec2(sq.x * 0.7, sq.y * 1.2) + 5.);
      float bodyS = smoothstep(0.34 + 0.2 * fray, 0.62 + 0.14 * fray, strand * 0.74 + clot * 0.5);
      float veil = fbm(vec2(x * 1.1 + seed * 3., drop * 0.02 - t * 0.5)) * fray * 0.22;
      float edgeS = 1. - smoothstep(0.45, 1., abs(x) + 0.5 * fray * (vnoise(vec2(drop * 0.1 - t * 2., seed + x * 1.5)) - 0.5));
      float aS = (bodyS * (1. - 0.25 * fray) + veil) * edgeS * (0.74 + 0.26 * layer);
      a = mix(a, aS * (1. - smoothstep(0.92, 1., v) * 0.5), rim);
      float whiteS = clamp(bodyS * (0.6 + 0.5 * v) + 0.3 * strand, 0., 1.);
      col = mix(col, mix(uWater * 0.85, vec3(0.93, 0.98, 0.97), whiteS) * (uSunCol * (0.3 + 0.16 * thru) + uSky * 0.42 + uBounce * 0.12), rim);
      col = mix(col, uWater * (uSunCol * (0.34 + 0.3 * thru) + uSky * 0.5), 0.3 * (1. - white) * (1. - rim));      // the turquoise of the water shows through the column's body
    }
  }
  gl_FragColor = vec4(col, clamp(a, 0., 1.));
  #include <fog_fragment>
}`;
BUILDERS.push(async (env) => {
  const { rng, pal, mat, add, anchors } = env;
  const pos = [], uv = [], mm = [], dd = [], idx = []; let c = 0;
  const quadXZ = (cx, cy, cz, r, m, drw, up) => {    // soft disc: flat on water (up) or facing the viewer line (+Z)
    const b = c; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx + u * r, up ? cy : cy + v * r * 0.8, up ? cz + v * r : cz); uv.push(u, v); mm.push(...m); dd.push(drw); c++; }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  anchors.falls = [];
  for (let i = 0; i < N; i++) {
    const y0 = lipY(i) - 1.35, z0 = outOf(i) + BOW - 0.6, yEnd = i === 0 ? 0.1 : lipY(i - 1) - SOIL - 0.35, H = y0 - yEnd;
    const reach = i === 0 ? 5.2 : 3.6, seed = rng();
    for (let layer = 0; layer < 2; layer++) {
      const nu = 8, nv = 18, base = c;
      for (let r = 0; r <= nv; r++) for (let k = 0; k <= nu; k++) {
        const v = r / nv, xn = (k / nu) * 2 - 1, vv = Math.max(0, v - 0.04) / 0.96;
        const wHalf = (4.1 - 0.9 * smoothstep(0, 0.25, v) + 1.6 * v * v) * (layer ? 0.82 : 1);
        const y = y0 + 0.25 * (1 - smoothstep(0, 0.04, v)) - H * vv * vv;
        const z = z0 + (v < 0.04 ? (v / 0.04) * 1.4 - 0.8 : 0.6 + reach * vv) + (1 - xn * xn) * 0.5 + layer * (0.45 + 0.5 * v);
        pos.push(xn * wHalf, y, z); uv.push(xn, v); mm.push(H, layer, seed, 0); dd.push(i); c++;
      }
      for (let r = 0; r < nv; r++) for (let k = 0; k < nu; k++) { const a = base + r * (nu + 1) + k, b = a + nu + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    // spray where it lands: a foam ring flat on the water and a few standing puffs of mist
    const zf = z0 + 0.6 + reach + 0.6, tgt = Math.max(i - 1, 0);
    quadXZ(0, yEnd + 0.12, zf, i === 0 ? 15 : 7.5, [0.7, 0, rng(), 2], tgt, true);
    for (let k = 0; k < 5; k++) quadXZ(rng.range(-3.2, 3.2), yEnd + rng.range(1.5, 4.5), zf + rng.range(-1, 2.2), rng.range(3.5, 6.5) * (i === 0 ? 1.5 : 1), [0.34, 0, rng(), 1], tgt, false);
    for (let k = 0; k < 22; k++) { const b = c, sz = rng.range(0.12, 0.3) * (i === 0 ? 1.4 : 1), sdp = rng(), cx = rng.range(-2.6, 2.6);
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx, yEnd + 0.2, zf - 0.6); uv.push(u, v); mm.push(sz, 0, sdp, 3); dd.push(tgt); c++; }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    anchors.falls.push({ top: new THREE.Vector3(0, y0, z0), foot: new THREE.Vector3(0, yEnd, zf), drawer: i });
    await env.ctx.yield?.();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aMat', new THREE.Float32BufferAttribute(mm, 4)); g.setAttribute('aDrw', new THREE.Float32BufferAttribute(dd, 1)); g.setIndex(idx);
  add(g, mat(FALL_VS, FALL_FS, { uWater: { value: pal[5] }, uCream: { value: pal[3] } }, { side: THREE.DoubleSide, transparent: true, depthWrite: false }), 5);
});

// ---------- living things and traces of people: one vertex-coloured, vertex-animated mesh ----------
// aAnim = (type, phase, amount, heading). type 1: neck and head, nodding about aPiv on the animal's lateral axis
// (built head-up, held down to graze, lifted now and then); 2: ear / tail flick; 3: foliage sway; 4: cloth; 0: still.
const PROP_VS = VS_HEAD + /* glsl */`
attribute vec3 aCol; attribute vec4 aAnim; attribute vec3 aPiv;
varying vec3 vCol; varying vec4 vAnim;
void main() {
  vCol = aCol; vAnim = aAnim; vec3 p = position; vec3 n = normal;
  float ty = aAnim.x, ph = aAnim.y * 6.2831, amt = aAnim.z, t = uTime;
  vec3 lat = vec3(cos(aAnim.w), 0., -sin(aAnim.w));
  if (ty > 0.5 && ty < 1.5) {
    float lift = smoothstep(0.5, 0.8, sin(t * 0.27 + ph)) ;
    float a = amt * (1. - lift) + 0.05 * sin(t * 4.5 + ph) * (1. - lift) + 0.12 * sin(t * 0.7 + ph * 2.) * lift;
    float c = cos(a), s = sin(a); vec3 r = p - aPiv;
    p = aPiv + r * c + cross(lat, r) * s + lat * dot(lat, r) * (1. - c);
    n = n * c + cross(lat, n) * s + lat * dot(lat, n) * (1. - c);
  } else if (ty > 1.5 && ty < 2.5) {
    p += lat * amt * sin(t * 9. + ph) * smoothstep(0.6, 0.9, sin(t * 0.8 + ph * 3.));
  } else if (ty > 2.5 && ty < 3.5) {
    p.x += amt * (sin(t * 0.9 + ph + p.y * 0.3) + 0.4 * sin(t * 2.1 + ph * 2. + p.z)); p.z += amt * 0.6 * cos(t * 0.7 + ph);
  } else if (ty > 3.5) {
    p.z += amt * (sin(t * 2.6 + ph + p.x * 1.3) + 0.5 * sin(t * 4.1 + p.y * 2.)); p.x += amt * 0.3 * sin(t * 1.7 + ph);
  }
  vP = position; p.z += drwOff();
  vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-5, 0.));
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PROP_FS = FS_HEAD + /* glsl */`
varying vec3 vCol; varying vec4 vAnim;
void main() {
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  if (dot(N, V) < 0.) N = -N;
  vec3 alb = vCol; float foliage = step(2.5, vAnim.x) * step(vAnim.x, 3.5);
  float dap = vnoise(vP.xy * 2.6 + vP.z * 2.1) * 0.6 + vnoise(vP.zx * 6.3 + vP.y * 5.2) * 0.4;
  alb *= mix(1., 0.5 + 1.1 * dap, foliage);
  float blossom = foliage * smoothstep(0.74, 0.8, vnoise(vP.xz * 5.7 + vP.y * 4.9));
  alb = mix(alb, vec3(0.62, 0.2, 0.12), blossom * 0.7);
  float nl = dot(N, L), wrap = max(nl * 0.75 + 0.25, 0.);
  float back = pow(clamp(dot(-V, L) * 0.5 + 0.5, 1e-4, 1.), 2.) * foliage;
  float rim = pow(clamp(1. - dot(N, V), 1e-4, 1.), 3.) * max(nl + 0.4, 0.) * (1. - foliage);
  vec3 col = alb * (uSunCol * (wrap + 0.35 * back) + ambientAt(N)) + uSunCol * rim * 0.12;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
class PGeo {
  constructor() { this.p = []; this.n = []; this.c = []; this.a = []; this.pv = []; this.d = []; this.idx = []; this.k = 0; this.lod = 0; this.reset(); }
  reset() { this.o = [0, 0, 0]; this.h = 0; this.s = 1; this.drw = 9; this.anim = [0, 0, 0, 0]; this.piv = [0, 0, 0]; }
  at(o, heading, scale, drw) { this.o = o; this.h = heading; this.s = scale; this.drw = drw; }
  xf(q) { const c = Math.cos(this.h), s = Math.sin(this.h); return [this.o[0] + (q[0] * c + q[2] * s) * this.s, this.o[1] + q[1] * this.s, this.o[2] + (-q[0] * s + q[2] * c) * this.s]; }
  rot(q) { const c = Math.cos(this.h), s = Math.sin(this.h); return [q[0] * c + q[2] * s, q[1], -q[0] * s + q[2] * c]; }
  v(q, n, col) {
    const c = Math.cos(this.h), s = Math.sin(this.h), o = this.o, sc = this.s, pv = this.piv;
    this.p.push(o[0] + (q[0] * c + q[2] * s) * sc, o[1] + q[1] * sc, o[2] + (-q[0] * s + q[2] * c) * sc);
    this.n.push(n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c);
    this.c.push(col[0], col[1], col[2]); this.a.push(this.anim[0], this.anim[1], this.anim[2], this.h);
    this.pv.push(o[0] + (pv[0] * c + pv[2] * s) * sc, o[1] + pv[1] * sc, o[2] + (-pv[0] * s + pv[2] * c) * sc); this.d.push(this.drw);
    return this.k++;
  }
  ball(c, r, col, col2, seg = 7, rings = 5) {
    if (this.lod) { seg = Math.max(4, seg - 1 - this.lod); rings = Math.max(3, rings - 2); }      // distant props: fewer facets
    const b = this.k;
    for (let j = 0; j <= rings; j++) { const th = (j / rings) * Math.PI, sy = Math.cos(th), sr = Math.sin(th);
      const cc = col2 ? col.map((v, q) => lerp(col2[q], v, smoothstep(-0.5, 0.3, sy))) : col;
      for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, nx = Math.cos(a) * sr, nz = Math.sin(a) * sr;
        const ax = nx / r[0], ay = sy / r[1], az = nz / r[2], al = Math.hypot(ax, ay, az);
        this.v([c[0] + nx * r[0], c[1] + sy * r[1], c[2] + nz * r[2]], [ax / al, ay / al, az / al], cc); } }
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = b + j * (seg + 1) + i, e = a + seg + 1; this.idx.push(a, a + 1, e, a + 1, e + 1, e); }
  }
  tube(A, B, ra, rb, col, col2, sides = 5) {
    if (this.lod) sides = Math.max(3, sides - 1);
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], l = Math.hypot(...d) || 1, t = d.map((v) => v / l);
    let u = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let w = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]; const wl = Math.hypot(...w); w = w.map((v) => v / wl);
    u = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]];
    const b = this.k;
    for (let e = 0; e < 2; e++) for (let i = 0; i <= sides; i++) { const a = (i / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), r = e ? rb : ra, P = e ? B : A;
      const n = [u[0] * ca + w[0] * sa, u[1] * ca + w[1] * sa, u[2] * ca + w[2] * sa]; this.v([P[0] + n[0] * r, P[1] + n[1] * r, P[2] + n[2] * r], n, e && col2 ? col2 : col); }
    for (let i = 0; i < sides; i++) { const a = b + i, e = a + sides + 1; this.idx.push(a, e, a + 1, a + 1, e, e + 1); }
  }
  quad(a, b, c, d, col) { const n = [0, 0, 1]; const i0 = this.v(a, n, col), i1 = this.v(b, n, col), i2 = this.v(c, n, col), i3 = this.v(d, n, col); this.idx.push(i0, i1, i2, i0, i2, i3); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aPiv', new THREE.Float32BufferAttribute(this.pv, 3)); g.setAttribute('aDrw', new THREE.Float32BufferAttribute(this.d, 1)); g.setIndex(this.idx);
    return g;
  }
}

function addAnimal(P, rng, o, heading, drw, kind, mul = 1) {
  const stag = kind === 'stag', goat = kind === 'goat', sc = (stag ? 1.5 : goat ? 0.78 : rng.range(0.92, 1.06)) * mul;
  const coat = goat ? [0.7, 0.67, 0.6] : stag ? [0.36, 0.19, 0.09] : [0.4 + rng.range(-0.05, 0.05), 0.22, 0.1], belly = goat ? [0.52, 0.5, 0.45] : [0.55, 0.44, 0.3];
  const dark = goat ? [0.3, 0.28, 0.25] : [0.12, 0.07, 0.04], bone = [0.62, 0.55, 0.42], ph = rng();
  P.at(o, heading, sc, drw); P.piv = [0, 1.1, 0.55];
  P.anim = [0, 0, 0];
  P.ball([0, 1.0, 0], [0.27, 0.3, 0.62], coat, belly);
  P.ball([0, 1.04, 0.42], [0.25, 0.32, 0.3], coat, belly, 6, 4);
  P.ball([0, 1.04, -0.46], [0.26, 0.3, 0.3], goat ? coat : [0.5, 0.36, 0.22], belly, 6, 4);
  const step = rng.range(-0.12, 0.12);
  for (const sx of [-1, 1]) {
    const x = sx * 0.15, f = 0.45 + sx * step, hz = -0.5 - sx * step * 0.7;
    P.tube([x, 0.92, 0.45], [x, 0.48, f + 0.04], 0.085, 0.05, coat, belly); P.tube([x, 0.48, f + 0.04], [x, 0.0, f], 0.05, 0.035, belly, dark);
    P.tube([x * 1.1, 0.96, -0.5], [x * 1.1, 0.5, hz - 0.12], 0.1, 0.05, coat, belly); P.tube([x * 1.1, 0.5, hz - 0.12], [x * 1.1, 0.0, hz], 0.05, 0.035, belly, dark);
  }
  P.anim = [2, ph, 0.05]; P.tube([0, 1.14, -0.72], [0, 0.9, -0.88], 0.055, 0.02, goat ? coat : [0.75, 0.72, 0.66], dark, 4);
  P.anim = [1, ph, stag ? 0.25 : goat ? 1.75 : 1.9];
  P.tube([0, 1.1, 0.52], [0, 1.58, 0.9], 0.16, 0.09, coat, coat, 6);
  P.ball([0, 1.66, 1.04], [0.09, 0.1, 0.2], coat, belly, 6, 4); P.ball([0, 1.62, 1.22], [0.055, 0.06, 0.08], dark, null, 5, 3);
  for (const sx of [-1, 1]) {
    P.tube([sx * 0.07, 1.74, 0.95], [sx * 0.21, 1.87, 0.9], 0.05, 0.015, coat, belly, 4);
    if (stag) {
      const A = [sx * 0.06, 1.76, 0.98], B = [sx * 0.32, 2.22, 0.8], C = [sx * 0.4, 2.62, 0.96];
      P.tube(A, B, 0.04, 0.03, bone, bone, 4); P.tube(B, C, 0.03, 0.012, bone, bone, 4);
      P.tube(B, [sx * 0.46, 2.3, 1.12], 0.025, 0.01, bone, bone, 4); P.tube([sx * 0.36, 2.42, 0.88], [sx * 0.6, 2.62, 0.74], 0.025, 0.01, bone, bone, 4);
      P.tube([sx * 0.1, 1.85, 0.95], [sx * 0.17, 2.0, 1.22], 0.025, 0.01, bone, bone, 4);
    } else if (goat) P.tube([sx * 0.05, 1.75, 1.0], [sx * 0.1, 1.96, 0.84], 0.035, 0.012, bone, dark, 4);
  }
  if (goat) P.tube([0, 1.57, 1.14], [0, 1.4, 1.1], 0.04, 0.01, coat, coat, 4);
}
function addTree(P, rng, o, drw, mul = 1) {
  const sc = rng.range(0.95, 1.3) * mul, ph = rng(), bark = [0.16, 0.11, 0.07], bark2 = [0.24, 0.17, 0.1], old = mul > 1.7, crowns = [];
  P.at(o, rng.range(0, 6.28), sc, drw); P.piv = [0, 0, 0]; P.anim = [0, 0, 0];
  const lean = [rng.range(-0.5, 0.5), 0, rng.range(-0.3, 0.3)], T1 = [lean[0] * 0.5, 1.6, lean[2] * 0.5], T2 = [lean[0], 2.9, lean[2]];
  P.tube([0, -0.2, 0], T1, 0.5, 0.34, bark, bark2, 6); P.tube(T1, T2, 0.34, 0.27, bark2, bark, 6);
  const nb = 5;
  for (let k = 0; k < nb; k++) {
    const a = (k / nb) * 6.28 + rng.range(-0.4, 0.4), r = rng.range(1.5, 2.6), E = [T2[0] + Math.cos(a) * r, rng.range(3.7, 4.8), T2[2] + Math.sin(a) * r];
    P.anim = [0, 0, 0]; P.tube(T2, E, 0.2, 0.08, bark, bark2, 4);
    const g = rng.range(0.8, 1.15); P.anim = [3, ph + k * 0.13, 0.07];
    P.ball([E[0], E[1] + 0.5, E[2]], [rng.range(1.5, 2.1), rng.range(1.0, 1.4), rng.range(1.5, 2.1)], [0.12 * g, 0.24 * g, 0.06 * g], [0.04, 0.09, 0.03], 8, 5);
    crowns.push([E[0], E[1] + 0.5, E[2]]);
    const g2 = rng.range(0.85, 1.25), b2 = rng.range(0, 6.28); P.anim = [3, ph + k * 0.21, 0.1];
    P.ball([E[0] + Math.cos(b2) * 1.2, E[1] + rng.range(-0.2, 1.3), E[2] + Math.sin(b2) * 1.2], [rng.range(0.9, 1.3), rng.range(0.7, 1.0), rng.range(0.9, 1.3)], [0.14 * g2, 0.27 * g2, 0.07 * g2], [0.04, 0.09, 0.03], 6, 4);
  }
  P.anim = [3, ph, 0.09]; P.ball([T2[0], 5.4, T2[2]], [2.2, 1.5, 2.2], [0.15, 0.27, 0.07], [0.05, 0.1, 0.03], 8, 5);
  if (old) {                                                     // an old orchard tree: a dead limb, a low bough, red apples under the leaves
    P.anim = [0, 0, 0]; P.tube(T1, [T1[0] - 1.9, 3.3, T1[2] + 0.9], 0.2, 0.05, bark, bark2, 4); P.tube([T1[0] - 1.9, 3.3, T1[2] + 0.9], [T1[0] - 2.5, 4.3, T1[2] + 0.5], 0.06, 0.02, bark2, bark2, 3);
    const lb = [T1[0] + 2.4, 2.3, T1[2] - 1.2]; P.tube(T1, lb, 0.22, 0.1, bark, bark2, 4);
    P.anim = [3, ph + 0.4, 0.08]; P.ball([lb[0] + 0.3, lb[1] + 0.5, lb[2]], [1.3, 0.8, 1.2], [0.13, 0.25, 0.06], [0.04, 0.09, 0.03], 6, 4); crowns.push([lb[0] + 0.3, lb[1] + 0.2, lb[2]]);
    for (let k = 0; k < (P.lod > 1 ? 0 : 16); k++) { const c = crowns[k % crowns.length], a = rng.range(0, 6.28), r = rng.range(0.5, 1.5);      // (no apples on the far cut: they are under a pixel)
      P.anim = [3, ph + k * 0.13, 0.07]; P.ball([c[0] + Math.cos(a) * r, c[1] - rng.range(0.35, 0.95), c[2] + Math.sin(a) * r], [0.24, 0.24, 0.24], [0.7, 0.08, 0.04], [0.34, 0.03, 0.02], 5, 3); }
  }
}
BUILDERS.push(async (env) => {
  const { rng, mat, add, anchors, ctx } = env;
  const P = new PGeo();
  const spot = (i, xmin, xmax, zmin, zmax) => { for (let t = 0; t < 30; t++) { const x = rng.range(xmin, xmax) * rng.sign(), zr = rng.range(zmin, zmax); if (poolSdf(i, x, zr) > 2.2) return [x, zr]; } return [40, 5]; };
  const place = (i, x, zr) => [x, groundH(i, x, zr), zLip(i, x) - zr];
  for (let i = 0; i < N - 1; i++) {
    const nt = rng.int(1, 2); for (let k = 0; k < nt; k++) { const [x, zr] = spot(i, 20, 47, 6, 9.5); addTree(P, rng, place(i, x, zr), i); }
    const goats = i % 3 === 1, na = rng.int(2, 3), [hx, hz] = spot(i, 16, 40, 3, 9), dir = rng.range(0, 6.28);
    for (let k = 0; k < na; k++) { const x = hx + rng.range(-6, 6), zr = clamp(hz + rng.range(-3, 3), 1.5, 11.5); if (poolSdf(i, x, zr) > 1) addAnimal(P, rng, place(i, x, zr), dir + rng.range(-0.9, 0.9), i, goats ? 'goat' : 'deer'); }
    await ctx.yield?.();
  }
  // the top meadow: the stag beside the camera's last line, his does, three old apple trees
  const T = N - 1;
  rng(); addAnimal(P, rng, place(T, 18, 8), -1.78, T, 'stag', 1.75); anchors.stag = new THREE.Vector3(18, groundH(T, 18, 8) + 4.4, zLip(T, 18) - 8);
  for (const [x, zr] of [[40, 31], [46, 13], [-17, 46], [-30, 22], [-36, 9]]) addAnimal(P, rng, place(T, x + rng.range(-2, 2), zr + rng.range(-2, 2)), rng.range(0, 6.28), T, 'deer', 1.7);
  for (const [x, zr] of [[-38, 40], [40, 50], [-22, 60], [45, 26], [22, 62]]) addTree(P, rng, place(T, x + rng.range(-3, 3), zr + rng.range(-3, 3)), T, 1.9);
  await ctx.yield?.();
  // a 9 m ladder on the bottom meadow against the second drawer, beside the climb
  {
    const x0 = 31, zr = 10.2, foot = place(0, x0, zr), wood = [0.5, 0.36, 0.2];
    P.reset(); P.drw = 0; const top = [0, 8.6, -2.7];
    for (const sx of [-0.3, 0.3]) P.at([foot[0] + sx, foot[1], foot[2]], 0, 1, 0), P.tube([0, 0, 0], top, 0.06, 0.05, wood, wood, 4);
    P.at(foot, 0, 1, 0); for (let k = 1; k < 26; k++) { const f = k / 26.5; P.tube([-0.3, top[1] * f, top[2] * f], [0.3, top[1] * f, top[2] * f], 0.03, 0.03, wood, wood, 3); }
    anchors.ladderFoot = new THREE.Vector3(...foot);
  }
  // washing strung between the posts of two handles on the third drawer, clear of the fall
  {
    const i = 2, [, hy, hz] = handlePos(i, 1), A = [-25, hy + 0.3, outOf(i) + bowAt(25) + 6.6], B = [25, hy + 0.3, A[2]];
    P.reset(); P.drw = i; const line = [0.75, 0.7, 0.6], seg = 28, sag = (f) => -3.2 * 4 * f * (1 - f);
    const pt = (f) => [lerp(A[0], B[0], f), A[1] + sag(f), A[2]];
    for (let k = 0; k < seg; k++) P.tube(pt(k / seg), pt((k + 1) / seg), 0.045, 0.045, line, line, 3);
    const cols = [[0.75, 0.72, 0.66], [0.6, 0.08, 0.06], [0.75, 0.72, 0.66], [0.14, 0.24, 0.5], [0.72, 0.6, 0.3], [0.75, 0.72, 0.66], [0.55, 0.2, 0.3]];
    let f = 0.6; P.piv = [0, 0, 0];
    while (f < 0.94) { const w = rng.range(0.7, 2.3), h = rng.range(0.9, 1.9), c = rng.pick(cols), p0 = pt(f), p1 = pt(f + w / 50), ph = rng();
      P.anim = [0, ph, 0]; const a = P.v([p0[0], p0[1], p0[2]], [0, 0, 1], c), b = P.v([p1[0], p1[1], p1[2]], [0, 0, 1], c);
      P.anim = [4, ph, 0.07]; const m1 = P.v([p0[0], p0[1] - h * 0.5, p0[2]], [0, 0.2, 1], c), m2 = P.v([p1[0], p1[1] - h * 0.5, p1[2]], [0, 0.2, 1], c);
      P.anim = [4, ph, 0.16]; const e = P.v([p0[0] + 0.05, p0[1] - h, p0[2]], [0, 0.3, 1], c.map((v) => v * 0.8)), d = P.v([p1[0] - 0.05, p1[1] - h, p1[2]], [0, 0.3, 1], c.map((v) => v * 0.8));
      P.idx.push(a, m1, b, b, m1, m2, m1, e, m2, m2, e, d); f += w / 50 + rng.range(0.008, 0.03); }
    anchors.washing = new THREE.Vector3(19, A[1] - 3, A[2]);
  }
  await ctx.yield?.();
  const pg = P.build(); await ctx.yield?.();
  add(pg, mat(PROP_VS, PROP_FS, {}, { side: THREE.DoubleSide }));
});

// ---------- key-swifts: brass keys that fly as swifts ----------
// iA = (type, delay or phase, speed, seed). type 0: resident, circling a home point (iB = centre xyz, radius) on time.
// type 1: the scripted stream, keyed to progress: it pours from the second drawer's keyhole as the camera rises past,
// crosses ahead, climbs the stair and funnels into the plate's keyhole during the last approach (iB = lateral offset
// x, y, wobble phase). type 2: the world's ribbon of big keys on a second path (uPathB), keyed to uRib.
const SWIFT_VS = /* glsl */`
attribute vec4 iA; attribute vec4 iB; attribute float aW;
uniform float uTime; uniform float uProg; uniform float uRib; uniform vec3 uPath[8]; uniform vec3 uPathB[8];
varying vec3 vN; varying vec3 vW; varying float vWing;
#include <fog_pars_vertex>
vec3 cr(vec3 a, vec3 b, vec3 c, vec3 d, float t) { return 0.5 * ((2. * b) + (c - a) * t + (2. * a - 5. * b + 4. * c - d) * t * t + (3. * b - a - 3. * c + d) * t * t * t); }
vec3 pathAt(float t) { float f = clamp(t, 0., 0.9999) * 5.; int i = int(floor(f)); return cr(uPath[i], uPath[i + 1], uPath[i + 2], uPath[i + 3], fract(f)); }
vec3 pathBt(float t) { float f = clamp(t, 0., 0.9999) * 5.; int i = int(floor(f)); return cr(uPathB[i], uPathB[i + 1], uPathB[i + 2], uPathB[i + 3], fract(f)); }
vec3 swiftPos(float k) {
  if (iA.x < 0.5) {
    float a = k * iA.z + iA.y * 6.2831, r = iB.w;
    float zr = iA.x > 0.1 ? 0.9 : 0.55;
    return iB.xyz + vec3(cos(a) * r, sin(a * 2. + iA.w * 6.) * r * 0.22 + sin(a * 0.37) * 4., sin(a) * r * zr + sin(a * 3.) * r * 0.08);
  }
  float kk = clamp(k, 0., 1.);
  float tp = iA.x < 1.5 ? (kk < 0.1 ? kk * 3. : 0.3 + (kk - 0.1) * 0.7778) : kk;     // the stream bursts out, then cruises
  float taper = smoothstep(0., 0.1, tp) * (1. - smoothstep(0.86, 1., tp));
  vec3 c = iA.x < 1.5 ? pathAt(tp) : pathBt(tp);
  float wob = iB.z * 6.2831 + tp * 22.;
  vec3 off = taper * (vec3(iB.x, iB.y, 0.) * (iA.x < 1.5 ? 3.6 : 8.5) + 0.9 * vec3(sin(wob), cos(wob * 1.3), sin(wob * 0.7)));
  if (iA.x < 1.5) {      // the stream's last stretch: over the top meadow it opens into a funnel as wide as the hall's mouth, and each key flies in
    // along its own line to its own place on the rim of the keyhole's round head, so none hangs across the middle of it
    float fun = smoothstep(0.64, 0.84, tp), cl = smoothstep(0.84, 1., tp), th = 3.1416 * (0.03 + 0.94 * iB.z);
    off = mix(off, vec3(cos(th) * mix(46., 6.6, cl), sin(th) * mix(11., 6.6, cl) + 2. * (1. - cl), 0.) + 0.9 * (1. - cl) * vec3(sin(wob), cos(wob * 1.3), sin(wob * 0.7)), fun);
  }
  return c + off;
}
void main() {
  float k = iA.x < 0.5 ? uTime : (iA.x < 1.5 ? (uProg - 0.485) * 2.41 - iA.y * 0.26 : uRib - iA.y * 0.5);
  float e = iA.x < 0.5 ? 0.05 : 0.004;
  vec3 c = swiftPos(k), c2 = swiftPos(k + e);
  vec3 fw = c2 - c; fw = normalize(fw + vec3(0., 0., 1e-4));
  vec3 rt = normalize(cross(vec3(0., 1., 0.), fw) + vec3(1e-4, 0., 0.)); vec3 up = cross(fw, rt);
  float show = iA.x < 0.5 ? 1. : step(0.001, k) * step(k, 0.999);
  vec3 p = position; float wing = abs(aW);
  float flap = sin(uTime * (iA.x < 1.5 ? 13. + 5. * iA.w : 7. + 2. * iA.w) + iA.w * 40.) * (0.75 + 0.25 * sin(uTime * 0.9 + iA.w * 9.));
  p.y += wing * flap * 0.5; p.x *= 1. - 0.2 * wing * flap * flap;
  p *= (iA.x < 0.5 ? 1.25 + 7.5 * iA.x : (iA.x < 1.5 ? 2.2 : 5.)) * show;
  vec3 wp = c + rt * p.x + up * p.y + fw * p.z;
  vec3 n = normalize(rt * normal.x + up * (normal.y + 1e-3) + fw * normal.z + rt * sign(aW) * flap * wing * 0.6);
  vN = normalize(mat3(modelMatrix) * n); vWing = wing;
  vec4 w = modelMatrix * vec4(wp, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SWIFT_FS = /* glsl */`
uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uBounce; uniform vec3 uBrass;
varying vec3 vN; varying vec3 vW; varying float vWing;
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  if (dot(N, V) < 0.) N = -N;
  vec3 R = reflect(-V, N); float nh = max(dot(N, normalize(L + V + vec3(0., 1e-4, 0.))), 0.);
  vec3 base = uBrass * vec3(1., 0.84, 0.6) * mix(0.62, 0.8, step(0.01, vWing));
  vec3 env = mix(uBounce * 0.9 + vec3(0.2, 0.15, 0.08), uSky * 1.1 + vec3(0.25, 0.22, 0.16), smoothstep(-0.2, 0.3, R.y));
  vec3 col = base * (uSunCol * 0.35 * max(dot(N, L), 0.) + env * 0.95) + base * uSunCol * (pow(clamp(nh, 1e-4, 1.), 60.) * 2.6);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
BUILDERS.push(async (env) => {
  const { rng, pal, mat, add, anchors, detail, U } = env;
  const p = [], n = [], w = [], idx = []; let c = 0;
  const V = (x, y, z, nx, ny, nz, ww = 0) => { p.push(x, y, z); n.push(nx, ny, nz); w.push(ww); return c++; };
  for (let k = 0; k < 10; k++) {                                  // the bow: a flat ring standing upright, so a key passing shows its whole outline
    const a0 = (k / 10) * 6.2832, a1 = ((k + 1) / 10) * 6.2832, ro = 0.2, ri = 0.1, cz = 0.25;
    const i0 = V(0.012, Math.sin(a0) * ri * 0.86, cz + Math.cos(a0) * ri, 1, 0, 0), i1 = V(0, Math.sin(a0) * ro * 0.86, cz + Math.cos(a0) * ro, 0.8, Math.sin(a0) * 0.6, Math.cos(a0) * 0.6);
    const i2 = V(0, Math.sin(a1) * ro * 0.86, cz + Math.cos(a1) * ro, 0.8, Math.sin(a1) * 0.6, Math.cos(a1) * 0.6), i3 = V(0.012, Math.sin(a1) * ri * 0.86, cz + Math.cos(a1) * ri, 1, 0, 0);
    idx.push(i0, i1, i2, i0, i2, i3);
  }
  for (let k = 0; k < 4; k++) {                                   // the shank
    const a0 = (k / 4) * 6.2832 + 0.785, a1 = a0 + 1.5708, r = 0.05, am = a0 + 0.785;
    const i0 = V(Math.cos(a0) * r, Math.sin(a0) * r, 0.06, Math.cos(am), Math.sin(am), 0), i1 = V(Math.cos(a1) * r, Math.sin(a1) * r, 0.06, Math.cos(am), Math.sin(am), 0);
    const i2 = V(Math.cos(a1) * r * 0.8, Math.sin(a1) * r * 0.8, -0.5, Math.cos(am), Math.sin(am), 0), i3 = V(Math.cos(a0) * r * 0.8, Math.sin(a0) * r * 0.8, -0.5, Math.cos(am), Math.sin(am), 0);
    idx.push(i0, i1, i2, i0, i2, i3);
  }
  for (const [z0, z1, y1] of [[-0.5, -0.41, -0.22], [-0.41, -0.35, -0.12], [-0.35, -0.27, -0.22]]) { const i0 = V(0, 0, z0, 1, 0.2, 0), i1 = V(0, 0, z1, 1, 0.2, 0), i2 = V(0, y1, z1, 1, 0.2, 0), i3 = V(0, y1, z0, 1, 0.2, 0); idx.push(i0, i1, i2, i0, i2, i3); }
  { const i0 = V(0, 0.075, -0.02, 1, 0.2, 0), i1 = V(0, 0.075, 0.03, 1, 0.2, 0), i2 = V(0, -0.075, 0.03, 1, 0.2, 0), i3 = V(0, -0.075, -0.02, 1, 0.2, 0); idx.push(i0, i1, i2, i0, i2, i3); }   // the collar
  for (const sx of [-1, 1]) {                                     // two narrow swept wings
    const i0 = V(sx * 0.05, 0.01, 0.3, 0, 1, 0, 0), i1 = V(sx * 0.34, 0.01, 0.27, 0, 1, 0, sx * 0.5), i2 = V(sx * 0.66, 0.01, 0.02, 0, 1, 0, sx * 1.0), i3 = V(sx * 0.3, 0.01, 0.13, 0, 1, 0, sx * 0.4), i4 = V(sx * 0.05, 0.01, 0.14, 0, 1, 0, 0);
    idx.push(i0, i1, i3, i1, i2, i3, i0, i3, i4);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(w, 1)); g.setIndex(idx);
  const iA = [], iB = [], nStream = 235, nHome = Math.round(110 * detail), nRib = 28;
  // the scripted stream, the residents, the moths (as live deals them) and the ribbon are dealt from the piece's generator; the flocks (whose numbers the world chooses) from a
  // stream of their own made from the world's seed and a name, which draws from no parent
  for (let k = 0; k < nStream; k++) { const a = rng.range(0, 6.28), r = Math.sqrt(rng()); iA.push(1, Math.pow(rng(), 0.8), 1, rng()); iB.push(Math.cos(a) * r, Math.sin(a) * r, rng(), 0); }
  for (let k = 0; k < nHome; k++) {                               // residents keep to the middle drawers, clear of the camera's line (which runs along the third drawer's front)
    const i = rng.int(3, N - 3), K = anchors.keyholes[i], flock = rng();
    iA.push(0, rng(), rng.range(0.22, 0.4) * rng.sign() * (flock < 0.5 ? 1 : 0.8), rng());
    iB.push(K.x + rng.range(-34, 26), K.y + rng.range(4, 20), K.z + rng.range(14, 30), rng.range(9, 24));
  }
  const cx = env.ctx, rf = cx.core.makeRng(cx.core.hashSeed('tallboy-flocks:' + cx.seed));
  // opts.moths = [x, y, z, count]: bigger keys that wheel round a point of the world's choosing (a candle flame)
  const mo = env.moths, nMoth = mo ? Math.round(mo[3]) : 0;
  for (let k = 0; k < nMoth; k++) { iA.push(0.36, rng(), rng.range(0.4, 0.8) * rng.sign(), rng()); iB.push(mo[0] + rng.range(-2, 2), mo[1] + rng.range(-7, 6), mo[2] + rng.range(-2, 2), rng.range(6, 27)); }
  // opts.flocks = [[x, y, z, count, radius lo, radius hi, size 0..0.45, +height, +count, +radius hi, +size], ...]: resident keys that wheel round the tops of the
  // world's own chests; the last four say how much this generator may add to each flock's height, count, outer radius and size
  let nFlock = 0;
  for (const f of (env.flocks || [])) { const fy = f[1] + (f[7] || 0) * rf(), nd = Math.round((f[3] + (f[8] || 0) * rf()) * Math.max(0.6, detail)), rhi = f[5] + (f[9] || 0) * rf(), fs = f[6] + (f[10] || 0) * rf();
    for (let k = 0; k < nd; k++) { iA.push(fs, rf(), rf.range(0.16, 0.34) * rf.sign(), rf()); iB.push(f[0] + rf.range(-6, 6), fy + rf.range(-10, 10), f[2] + rf.range(-6, 6), rf.range(f[4], rhi)); nFlock++; } }
  for (let k = 0; k < nRib; k++) { const a = rng.range(0, 6.28), r = Math.sqrt(rng()); iA.push(2, (k + rng()) / nRib, 1, rng()); iB.push(Math.cos(a) * r, Math.sin(a) * r * 0.45, rng(), 0); }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
  g.instanceCount = nStream + nHome + nMoth + nFlock + nRib;
  const K = anchors.keyholes[1], S = new THREE.Vector3(0, PLATE_Y, PLATE_Z);
  anchors.swiftKeyhole = K;
  // the stream's line, from the piece's own places: out of the second drawer's keyhole, over that drawer's lip, west along its meadow at the foot of the third
  // drawer's bow front and under that front's left handle, round the stair's left corner and up its flank, over the top meadow and into the plate's keyhole
  const path = [[K.x, K.y, K.z - 6], [K.x, K.y, K.z], [K.x - 9, lipY(1) + 4, outOf(1) + 8], [-HANDLE_X - 16, lipY(1) + 10, outOf(2) + 10], [-74, lipY(6) + 9, outOf(6) + 34], [2, S.y + 9, 82], [S.x, S.y, S.z], [S.x, S.y - 1, S.z - 30]];
  anchors.swiftPath = path.slice(1, 7).map((q) => new THREE.Vector3(q[0], q[1], q[2]));
  // the world's ribbon (opts.ribbon: eight points); without one it is parked out of sight and never shown
  const rib = (env.ribbon && env.ribbon.length === 8) ? env.ribbon : path.map((q) => [q[0], q[1] - 400, q[2]]);
  U.uRib = { value: -1 };
  add(g, mat(SWIFT_VS, SWIFT_FS, { uBrass: { value: pal[6] }, uPath: { value: path.map((q) => new THREE.Vector3(q[0], q[1], q[2])) },
    uPathB: { value: rib.map((q) => new THREE.Vector3(q[0], q[1], q[2])) }, uProg: U.uProg, uRib: U.uRib }, { side: THREE.DoubleSide }));
});

// shared with the world module (src/worlds/drawer-cliffs.js), which builds the lesser cabinets in the same materials
export { Geo, PGeo, addAnimal, addTree, pl, VS_HEAD, FS_HEAD, WOOD_FS, BRASS_FS, FALL_FS, PROP_VS, PROP_FS };
