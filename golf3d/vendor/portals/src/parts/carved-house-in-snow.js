// The Carved House in Snow: hero set piece = THE DOVECOTE and the well that announces it.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera, u), dispose, uniforms, ... }
//   object   the round shaft (60 m across, floor at y = 78, leaning shut at ~204), its honeycomb of red-rimmed niches,
//            the well below it (24 m across, lined with niches, from y = -8), the well parapet, the carved great window
//            in the north-west lean, and one InstancedMesh of pigeons (one per niche + birds always on the wing).
//   anchors  portal (Vector3, centre of the great window), portalDir (unit Vector3, 55 degrees up, heading north-west),
//            floorY (78), shaftRadius (30), wellRadius (12), axis (Vector3 0,0,0)
//   update   pass u as the 4th argument: the flock lifts ring by ring from u = 0.674 and funnels out through the window;
//            from u = 0.86 an escort of pigeons forms up round the line to the window and overtakes the camera out of it.
//   The top of the shaft is open: a sky disc (opts.sky: { zen, hor, cloud, flakes, stars }), a snow cornice and
//   icicles (opts.snowy), and a column of cold light down the middle (opts.column: its colour).
//   opts     { rock: uniforms object shared with the house (see makeRock), slate: share of slate-grey tumblers,
//              dark: 0..1 darkens the well birds (swallows at dusk), holes: false to skip the mouth cut in the floor,
//              mouth(a, r) -> true where the dovecote floor is open (the ramp mouth), wellSkip(a, y) -> 3 for a
//              well tile an inner arch cuts through, wellCut(a, y) -> true inside that opening, holeAngle (azimuth
//              of the five flight holes, towards the sun), archY (heights where birds cross the well), duration,
//              fillK (scales the baked fill of shaft and well, when the house runs a stronger fill colour) }
//
// This file also exports what the world file needs to carve the rest of the house out of the same rock:
//   LAYOUT (the spiral gallery's centre line and section tables), Bld (a merging geometry builder that writes the
//   attributes the rock shader reads), makeRock (the one material: vertex colour, pick strokes, ochre dado, baked snow
//   glare, analytic sun through window rectangles, warm point accents), and small shape helpers.
// Conventions: 1 unit = 1 m, the cone's axis is the y axis, north = -z, east = +x. No three.js lights anywhere.
import * as THREE from 'three';

export const FLOOR = 78, SHAFT_R = 30, WELL_R = 12, TOP = 204, S0 = -16, S_END = 465;
export const ARCHES = [70, 150, 230, 310, 390];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
export { sstep, lerp };

// ---------------------------------------------------------------------------------------------------------------
// The gallery: a level stable (s = 0..70) running north, then a ramp winding anticlockwise round the well.
// s = distance along the centre line in plan. frame(s) gives the floor centre, the tangent and the outward normal.
// ---------------------------------------------------------------------------------------------------------------
function makeLayout() {
  const DS = 0.5, N = Math.round((S_END + 4 - S0) / DS), A = new Float32Array(N + 1), Y = new Float32Array(N + 1);
  const radius = (s) => lerp(34, 21, sstep(396, 440, s));
  const slopeK = (k, s) => (s < 60 ? 0 : lerp(lerp(0, k, sstep(60, 84, s)), 0.325, sstep(400, 430, s)));
  const fill = (k) => { let a = 0, y = 0; for (let i = 0; i <= N; i++) { const s = S0 + i * DS; A[i] = a; Y[i] = y; if (s >= 70) a += DS / radius(s); y += slopeK(k, s) * DS; } return Y[Math.round((S_END - S0) / DS)]; };
  let k = 0.19; for (let it = 0; it < 12; it++) { const y = fill(k); k *= 1 + (FLOOR - y) / Math.max(y, 1) * 0.9; }
  fill(k);
  const tab = (T, s) => { const f = Math.min(N - 1e-3, Math.max(0, (s - S0) / DS)), i = Math.floor(f); return T[i] + (T[i + 1] - T[i]) * (f - i); };
  const pinch = (s) => { let p = 0; for (const a of ARCHES) p = Math.max(p, 1 - sstep(2.2, 6.5, Math.abs(s - a))); return p; };
  const L = {
    k, radius, pinch, angle: (s) => tab(A, s), y: (s) => tab(Y, s), slope: (s) => slopeK(k, s),
    // half widths (left = towards the well, right = outer wall) and crown height of the section
    wR(s) { const room = s < 64 ? 20 : lerp(20, 17, sstep(64, 76, s)); return lerp(lerp(room, 8, pinch(s)), 8, sstep(405, 432, s)); },
    wL(s) { return s < 70 ? L.wR(s) : Math.min(L.wR(s), radius(s) - 13.6); },
    crown(s) { return lerp(lerp(26, 20, pinch(s)), 15, sstep(388, 412, s)); },
    frame(s, o = {}) {
      if (s < 70) { o.x = 34; o.z = 70 - s; o.y = tab(Y, s); o.tx = 0; o.tz = -1; o.nx = 1; o.nz = 0; o.a = 0; return o; }
      const a = tab(A, s), r = radius(s); o.a = a; o.nx = Math.cos(a); o.nz = -Math.sin(a); o.tx = -Math.sin(a); o.tz = -Math.cos(a);
      o.x = r * o.nx; o.z = r * o.nz; o.y = tab(Y, s); return o;
    },
    // floor point: l = lateral metres (+ = outwards / right of travel), h = metres above the floor
    point(s, l, h, out = new THREE.Vector3()) { const f = L.frame(s, _f); return out.set(f.x + f.nx * l, f.y + h + L.rib(s), f.z + f.nz * l); },
    rib(s) { if (s < 74 || s > 452) return 0; const d = Math.abs(((s % 8) + 8) % 8 - 4); return 0.28 * (1 - sstep(3.1, 3.9, d)) * (1 - L.kilim(s)); },
    kilim(s) { return sstep(236, 240, s) * (1 - sstep(300, 304, s)); },
    // matrix that seats a prop: origin on the floor at (s, l), +z of the prop along the travel direction, turned by yaw
    seat(s, l, h = 0, yaw = 0, sc = 1) {
      const f = L.frame(s, _f), m = new THREE.Matrix4();
      m.makeRotationY(Math.atan2(-f.tx, -f.tz) + Math.PI + yaw); if (sc !== 1) m.scale(_v.set(sc, sc, sc));
      return m.setPosition(f.x + f.nx * l, f.y + h, f.z + f.nz * l);
    },
  };
  return L;
}
const _f = {}, _v = new THREE.Vector3();
export const LAYOUT = makeLayout();
// azimuth used for everything round the axis: a point at angle a is (r cos a, y, -r sin a); a grows anticlockwise seen from above
export const angOf = (x, z) => Math.atan2(-z, x);

// the great window: centre and the direction the flight leaves through it (55 degrees up, heading west along a chord
// of the shaft that passes 16 m north of the axis, so the window sits in the north-west lean)
const PITCH = 55 * Math.PI / 180;
export const PORTAL_DIR = new THREE.Vector3(-Math.cos(PITCH), Math.sin(PITCH), 0);
export const PORTAL_POS = new THREE.Vector3(-17.2, 185, -16);
// shaft radius by height: upright to 150 m, then the lean
export const shaftR = (y) => SHAFT_R - 12 * Math.pow(sstep(150, 208, y), 1.6);

// ---------------------------------------------------------------------------------------------------------------
// Bld: merges shapes into one geometry with the attributes the rock shader reads
//   color (linear rgb), aM (kind, emissive, sway phase, spare), aUV (pattern coordinates), aSw (sway vector, metres),
//   aL (baked light: snow glare, fill, top light): set b.lit = [g, f, t] (or o.l) for direct values, otherwise
//   build(light) asks light(px,py,pz,nx,ny,nz,out) for every vertex.
// kinds: 0 rock (pick strokes, dado by aUV.y), 1 plain (wood, clay, straw), 2 cloth (aM.w 1: stripes by aUV, 2: patchwork), 3 metal,
//        4 kilim (pattern by aUV), 5 painted niche wall (ochre rim and sunbursts by aUV), 6 embers (animated glow)
// ---------------------------------------------------------------------------------------------------------------
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color(), _nm = new THREE.Matrix3();
export const lin = (hex) => { _c.set(hex); return [_c.r, _c.g, _c.b]; };
export class Bld {
  // typed arrays that double when full (plain arrays cost a third of the build): n = vertices, ni = indices in use
  constructor(cap = 2048) { this.cap = cap; this.P = new Float32Array(cap * 3); this.N = new Float32Array(cap * 3); this.C = new Float32Array(cap * 3); this.M = new Float32Array(cap * 4); this.U = new Float32Array(cap * 2); this.S = new Float32Array(cap * 3); this.L = new Float32Array(cap * 3); this.I = new Uint32Array(cap * 6); this.n = 0; this.ni = 0; this.sway = false; this.lit = null; }
  room(k) {
    if (this.n + k <= this.cap) return; let cap = this.cap * 2; while (cap < this.n + k) cap *= 2; this.cap = cap;
    for (const [key, w] of [['P', 3], ['N', 3], ['C', 3], ['M', 4], ['U', 2], ['S', 3], ['L', 3]]) { const a = new Float32Array(cap * w); a.set(this[key]); this[key] = a; }
  }
  iroom(k) { if (this.ni + k <= this.I.length) return; let c = this.I.length * 2; while (c < this.ni + k) c *= 2; const a = new Uint32Array(c); a.set(this.I); this.I = a; }
  // low level: one vertex, returns its index
  v(x, y, z, nx, ny, nz, c, kind = 0, emis = 0, u = 0, w = 0, mw = 0) {
    if (this.n >= this.cap) this.room(1);
    const i = this.n, k = i * 3, P = this.P, N = this.N, C = this.C, M = this.M, Lt = this.L, l = this.lit;
    P[k] = x; P[k + 1] = y; P[k + 2] = z; N[k] = nx; N[k + 1] = ny; N[k + 2] = nz; C[k] = c[0]; C[k + 1] = c[1]; C[k + 2] = c[2];
    M[i * 4] = kind; M[i * 4 + 1] = emis; M[i * 4 + 3] = mw; this.U[i * 2] = u; this.U[i * 2 + 1] = w;
    if (l) { Lt[k] = l[0]; Lt[k + 1] = l[1]; Lt[k + 2] = l[2]; } else Lt[k] = -1;
    return this.n++;
  }
  tri(a, b, c) { if (this.ni + 3 > this.I.length) this.iroom(3); const I = this.I, k = this.ni; I[k] = a; I[k + 1] = b; I[k + 2] = c; this.ni = k + 3; }
  quad(a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); }
  // the same, but wound so that the face looks the way vertex a's normal points
  triN(a, b, c) {
    const P = this.P, N = this.N, ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
    const d = (uy * vz - uz * vy) * N[a * 3] + (uz * vx - ux * vz) * N[a * 3 + 1] + (ux * vy - uy * vx) * N[a * 3 + 2];
    if (d >= 0) this.tri(a, b, c); else this.tri(a, c, b);
  }
  quadN(a, b, c, d) { this.triN(a, b, c); this.triN(a, c, d); }
  // add a BufferGeometry. o: { m: Matrix4, c: [r,g,b] | (x,y,z,n)=>[r,g,b] (local coordinates), kind, emis,
  //   uv: (x,y,z)=>[u,v], sway: (x,y,z)=>[sx,sy,sz,phase] (local point -> world sway vector), flip }
  add(geo, o = {}) {
    const pos = geo.attributes.position, nor = geo.attributes.normal, idx = geo.index, base = this.n, m = o.m, cnt0 = pos.count;
    const pa = pos.array, na = nor.array, plain = !pos.isInterleavedBufferAttribute && !nor.isInterleavedBufferAttribute && pos.itemSize === 3 && nor.itemSize === 3;
    if (m) _nm.getNormalMatrix(m);
    this.room(cnt0);
    const gc = o.c === 'geo' ? geo.attributes.color : null, cf = typeof o.c === 'function' ? o.c : null, c0 = cf || gc ? null : (o.c || [0.6, 0.45, 0.33]);
    const P = this.P, N = this.N, C = this.C, M = this.M, U = this.U, S = this.S, Lt = this.L, kind = o.kind || 0, emis = o.emis || 0, mw = o.w || 0, l = o.l || this.lit, flip = !!o.flip;
    for (let i = 0; i < cnt0; i++) {
      let lx, ly, lz;
      if (plain) { lx = pa[i * 3]; ly = pa[i * 3 + 1]; lz = pa[i * 3 + 2]; _n.set(na[i * 3], na[i * 3 + 1], na[i * 3 + 2]); } else { lx = pos.getX(i); ly = pos.getY(i); lz = pos.getZ(i); _n.set(nor.getX(i), nor.getY(i), nor.getZ(i)); }
      _p.set(lx, ly, lz);
      const j = base + i, k = j * 3, uv = o.uv ? o.uv(lx, ly, lz) : null, sw = o.sway ? o.sway(lx, ly, lz, i) : null;
      if (gc) { C[k] = gc.getX(i); C[k + 1] = gc.getY(i); C[k + 2] = gc.getZ(i); } else { const c = cf ? cf(lx, ly, lz, _n) : c0; C[k] = c[0]; C[k + 1] = c[1]; C[k + 2] = c[2]; }
      if (m) { _p.applyMatrix4(m); _n.applyMatrix3(_nm).normalize(); }
      if (flip) _n.negate();
      P[k] = _p.x; P[k + 1] = _p.y; P[k + 2] = _p.z; N[k] = _n.x; N[k + 1] = _n.y; N[k + 2] = _n.z;
      M[j * 4] = kind; M[j * 4 + 1] = emis; M[j * 4 + 2] = sw ? sw[3] : 0; M[j * 4 + 3] = mw;
      if (uv) { U[j * 2] = uv[0]; U[j * 2 + 1] = uv[1]; }
      if (sw) { S[k] = sw[0]; S[k + 1] = sw[1]; S[k + 2] = sw[2]; this.sway = true; }
      if (l) { Lt[k] = l[0]; Lt[k + 1] = l[1]; Lt[k + 2] = l[2]; } else Lt[k] = -1;
    }
    const cnt = idx ? idx.count : cnt0, ia = idx ? idx.array : null; this.iroom(cnt);
    const I = this.I; let q = this.ni;
    for (let i = 0; i + 2 < cnt; i += 3) { const a = base + (ia ? ia[i] : i), b = base + (ia ? ia[i + 1] : i + 1), c = base + (ia ? ia[i + 2] : i + 2); I[q] = a; if (flip) { I[q + 1] = c; I[q + 2] = b; } else { I[q + 1] = b; I[q + 2] = c; } q += 3; }
    this.ni = q; this.n += cnt0; geo.dispose();
    return this;
  }
  get triangles() { return this.ni / 3; }
  // the lighting pass of build(light), done beforehand in slices so that a large mesh never holds the page
  async bake(light, ctx) {
    const P = this.P, N = this.N, Lt = this.L, o = [0, 0.6, 0];
    for (let i = 0; i < this.n; i++) { if ((i & 255) === 0) await ctx.yield(); const k = i * 3; if (Lt[k] >= 0) continue; light(P[k], P[k + 1], P[k + 2], N[k], N[k + 1], N[k + 2], o); Lt[k] = o[0]; Lt[k + 1] = o[1]; Lt[k + 2] = o[2]; }
  }
  // light(px,py,pz,nx,ny,nz,out) writes [glare, fill, top]
  build(light) {
    const g = new THREE.BufferGeometry(), n = this.n, P = this.P, N = this.N, Lt = this.L.slice(0, n * 3), o = [0, 0.6, 0];
    for (let i = 0; i < n; i++) { const k = i * 3; if (Lt[k] >= 0) continue; if (light) { light(P[k], P[k + 1], P[k + 2], N[k], N[k + 1], N[k + 2], o); Lt[k] = o[0]; Lt[k + 1] = o[1]; Lt[k + 2] = o[2]; } else { Lt[k] = 0; Lt[k + 1] = 0.6; Lt[k + 2] = 0; } }
    g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3)); g.setAttribute('aM', new THREE.BufferAttribute(this.M.slice(0, n * 4), 4));
    g.setAttribute('aUV', new THREE.BufferAttribute(this.U.slice(0, n * 2), 2)); g.setAttribute('aL', new THREE.BufferAttribute(Lt, 3));
    g.setAttribute('aSw', new THREE.BufferAttribute(this.S.slice(0, n * 3), 3));
    g.setIndex(new THREE.BufferAttribute(n > 65535 ? this.I.slice(0, this.ni) : new Uint16Array(this.I.subarray(0, this.ni)), 1));
    g.computeBoundingSphere(); g.boundingSphere.radius += 3;
    return g;
  }
}

// ---- small shape helpers (all return plain BufferGeometry in local space, y up) ----
// lathe from [[r, y], ...]
export const lathe = (pts, seg = 14) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 1e-3), p[1])), seg);
// a soft box (cushion, sack, bench, beam): superellipsoid, e = 0.3 boxy .. 1 round
export function pillow(w, h, d, e = 0.4, sx = 10, sy = 6) {
  const g = new THREE.SphereGeometry(1, sx, sy), p = g.attributes.position, pw = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i < p.count; i++) p.setXYZ(i, pw(p.getX(i)) * w * 0.5, pw(p.getY(i)) * h * 0.5 + h * 0.5, pw(p.getZ(i)) * d * 0.5);
  g.computeVertexNormals(); return g;
}
// a bar between two points (round or squared timber), radius r0 -> r1
export function bar(a, b, r0, r1 = r0, sides = 6) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length(), g = new THREE.CylinderGeometry(r1, r0, len, sides, 2, false);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return g;
}
// a hanging / standing sheet in the local xy plane, w wide, h tall (top at y = 0), nx by ny cells, optional drape(u, v) -> z
export function sheet(w, h, nx, ny, drape) {
  const g = new THREE.PlaneGeometry(w, h, nx, ny), p = g.attributes.position; g.translate(0, -h / 2, 0);
  if (drape) { for (let i = 0; i < p.count; i++) p.setZ(i, drape(p.getX(i) / w + 0.5, -p.getY(i) / h)); g.computeVertexNormals(); }
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// The rock: one shader for house, shaft and every prop. makeRock() -> { U (shared uniforms), material(opts),
// setWindows(list), setHot(i, x, y, z, k) }. A window is { c: Vector3, n: outward unit normal (horizontal),
// hw, hh, reach, hole }: a fragment is in the sun when the ray from it towards the sun passes through the rectangle
// (hole: a flight hole of the dovecote: a rounded opening with a hard edge and no grille).
// ---------------------------------------------------------------------------------------------------------------
export const NWIN = 32, NHOT = 12;
const ROCK_VERT = /* glsl */`
attribute vec4 aM; attribute vec2 aUV; attribute vec3 aL; attribute vec3 aSw;
uniform float uTime;
varying vec3 vW, vN, vC, vL; varying vec4 vM; varying vec2 vUV;
void main(){
  vec3 p=position;
  #ifdef SWAY
  float ph=aM.z, f=.7+fract(ph*3.7)*.9;
  f*=1.+3.6*step(1.5,ph);                         // phase 2..3: the quick ones (a hen pecking)
  p+=aSw*(sin(uTime*f+ph*6.283)+.35*sin(uTime*f*2.3+ph*17.));
  #endif
  vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal);
  vC=color; vL=aL; vM=aM; vUV=aUV;
  gl_Position=projectionMatrix*viewMatrix*w;
}`;
const ROCK_FRAG = /* glsl */`precision highp float;
uniform float uTime, uDim, uFogDen, uCount, uShimmer;
uniform vec3 uSun, uSunCol, uGlareCol, uFillCol, uTopCol, uFogCol, uHotCol, uSky;
uniform vec4 uWinC[${NWIN}], uWinN[${NWIN}], uWinR[${NWIN}], uHot[${NHOT}];
varying vec3 vW, vN, vC, vL; varying vec4 vM; varying vec2 vUV;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float band(float x, float c, float w, float aa){ return 1.-smoothstep(w-aa, w+aa, abs(x-c)); }
// the pick strokes near P: t1, t2 span the surface, w = half width of a groove in metres (never under a pixel)
float picks(vec3 P, vec3 t1, vec3 t2, float w){
  vec3 c0=floor(P/.85-.5); float acc=0., k=.05/w;
  for(int i=0;i<8;i++){
    float fi=float(i); vec3 ci=c0+vec3(mod(fi,2.), mod(floor(fi*.5),2.), floor(fi*.25));
    vec3 h=vec3(h21(ci.xy+ci.z*7.13), h21(ci.yz+ci.x*3.71), h21(ci.zx+ci.y*5.39));
    vec3 lp=P-(ci+.5+(h-.5)*.3)*.85;
    float a=dot(lp,t1), b=dot(lp,t2), ang=.82+(h.x-.5)*.5, ca=cos(ang), sn=sin(ang);
    float al=a*ca+b*sn, ac=b*ca-a*sn, hl=.23+.09*h.y;
    float body=(1.-smoothstep(hl*.5,hl,abs(al)))*step(.16,h.z);
    float g=ac/w, l=(ac-w*1.7)/w;
    acc+=body*(exp(-l*l)*.55-exp(-g*g))*k;
  }
  return acc;
}
void main(){
  float kind=floor(vM.x+.5);
  vec3 N=normalize(vN);
  vec3 V=normalize(cameraPosition-vW);
  #ifdef TWOSIDE
  if(dot(N,V)<0.) N=-N;
  #endif
  vec2 q=vW.xz+vW.y*vec2(.37,.61);
  vec2 uv=vUV; float aa=max(fwidth(uv.x)+fwidth(uv.y), 1e-3);
  float n1=vn(q*.21), n2=vn(q*1.7+3.), n3=vn(q*7.3);
  float rr=length(vW.xz), pxw=min(length(fwidth(vW)),1.);          // pxw: the size of a pixel on the rock, in metres
  vec3 base=vC; float gloss=0., strokes=0., hz=1.;
  vec3 OCHRE=vec3(.34,.088,.05), CREAM=vec3(.80,.72,.58), INDIGO=vec3(.018,.05,.16), MADDER=vec3(.42,.045,.03);
  if(kind<.5){                                   // carved rock: pick strokes in bands, ochre dado between 8 and 10.2 m
    // pick strokes: short slanting gouges scattered over the rock, each a dark groove with a raised lip on one side. One
    // stroke lives in each 0.85 m cell of space and is laid in the plane of the surface, so strokes are the same size on
    // every wall, vault and reveal however it curves, and there are no bands or seams. They are gone with distance well
    // before they could beat against the pixel grid.
    if(pxw<.13){
      vec3 ref=normalize(mix(vec3(0.,1.,0.), vec3(-vW.z,0.,vW.x)/max(rr,1.), smoothstep(.55,.85,abs(N.y)))+vec3(0.,1e-3,0.));
      vec3 t1=cross(N,ref); t1*=inversesqrt(dot(t1,t1)+1e-4); vec3 t2=cross(N,t1);
      strokes=picks(vW,t1,t2,max(.05,pxw*.9))*smoothstep(.2,.45,vn(q*.12+3.))*(1.-smoothstep(.05,.13,pxw));
    }
    base*=(.8+.36*n1)*(.9+.2*n2)*max(1.+.5*strokes,.25);
    hz=smoothstep(7.,15.5,uv.y);                     // 0 on the walls below the sills, 1 on the vault
    base=mix(base, base*vec3(1.06,.9,.82), smoothstep(.55,.9,vn(q*.06)));
    float d=(uv.y-8.)/2.2;
    if(d>-.05&&d<1.05){
      float cell=floor(uv.x/7.), cx=(uv.x-cell*7.)/7., pick=h21(vec2(cell,3.)), a2=aa/2.2;
      float m=band(d,.06,.035,a2)+band(d,.94,.035,a2);
      float zz=abs(fract(uv.x/1.6)-.5)*2.;
      float zig=band(d,.3+zz*.4,.07,a2*1.5);
      float px=(cx-.5)*7./2.2, py=d-.5, rr=length(vec2(px,py));
      float ang=atan(py, px+1e-4);
      float wheel=band(rr,.3,.05,a2)+step(rr,.3)*band(fract(ang*1.2732+.5),.5,.13,.05)+step(rr,.07);
      float comb=step(abs(px),.55)*step(abs(py),.3)*max(step(.2,py), step(.5,fract(px*4.+.25)));
      float mot=pick<.5?zig:(pick<.78?max(wheel, zig*step(.5,abs(px))):max(comb, zig*step(.75,abs(px))));
      m=clamp(m+mot,0.,1.)*(.55+.45*n2)*smoothstep(.15,.45,n3+.25);
      base=mix(base, OCHRE*(.8+.5*n1), m*.9);
    }
    if(uv.y>300.){                               // the plain rock round the great window: painted zigzag courses
      float zz=abs(fract(uv.x/1.9)-.5)*2., cy=fract((uv.y-382.)/2.3)*2.3, a4=aa*1.2;
      base=mix(base, OCHRE*(.8+.5*n1), band(cy,.55+zz*.75,.11,a4)*(.55+.45*n2)*smoothstep(.15,.45,n3+.25)*.85);
    }
    // a second painted course low on the wall: a line and a row of teeth
    float d2=(uv.y-2.95)/.95;
    if(d2>-.15&&d2<1.2){
      float a3=aa/.95, tooth=1.-abs(fract(uv.x/1.25)-.5)*2.;
      float m2=max(band(d2,1.08,.05,a3), smoothstep(-a3,a3,tooth-d2/.82-.04)*step(0.,d2));
      base=mix(base, OCHRE*(.8+.5*n1), m2*(.55+.45*n2)*smoothstep(.15,.45,n3+.25)*.85);
    }
  } else if(kind<1.5){                           // plain: wood, clay, straw, fur
    base*=(.8+.34*n2)*(.9+.2*n3);
  } else if(kind<2.5){                           // cloth: stripes of cream by vM.w, weave
    if(vM.w>1.5){                                 // a patchwork quilt: counter-changed diamonds, seams between the patches
      vec2 pq=vec2(uv.x+uv.y,uv.x-uv.y)*1.1, ci=floor(pq), cf=fract(pq)-.5;
      float chk=mod(ci.x+ci.y,2.), star=step(abs(cf.x)+abs(cf.y),.3);
      base=mix(mix(base,CREAM,chk), mix(CREAM,base,chk), star)*(1.-.3*step(.45,max(abs(cf.x),abs(cf.y))));
    } else base=mix(base, CREAM, step(.5,fract(uv.y))*vM.w);
    base*=(.9+.1*sin(uv.x*31.)*sin(uv.y*31.))*(.88+.2*n2);
    float qd=min(abs(fract(uv.x*.5+uv.y*.5)-.5), abs(fract(uv.x*.5-uv.y*.5)-.5));
    base*=.82+.18*smoothstep(.0,.06,qd);
  } else if(kind<3.5){                           // metal
    base*=(.75+.3*n2); gloss=1.;
  } else if(kind<4.5){                           // kilim: uv.x 0..1 across, uv.y metres along
    float u=fract(uv.x), v=uv.y, e=abs(u-.5)*2.;
    float dm=abs(fract(v/5.)-.5)*2.+e*.9;
    float k=floor(dm*5.+.001); float md=mod(k,4.);
    vec3 c=md<.5?MADDER:(md<1.5?CREAM:(md<2.5?INDIGO:vec3(.62,.3,.12)));
    float st=step(.5,fract(dm*5.))*step(.5,fract(v*1.2+u*9.));
    c=mix(c, c*.55+CREAM*.2, st*.5);
    float bd=step(.86,e); float tri=step(fract(v/1.6), abs(fract(e*3.5)-.5)*2.);
    c=mix(c, mix(INDIGO,CREAM,tri), bd);
    c=mix(c, MADDER, step(.965,e));
    base=mix(c,vec3(dot(c,vec3(.33))),.12)*(.62+.2*n2)*(.9+.1*sin(v*40.)); base*=mix(1., vC.r*1.6, .5);
  } else if(kind<5.5){                           // painted niche wall: sunbursts at the tile corners
    base*=(.84+.3*n1)*(.92+.16*n2);
    vec2 c=vec2(abs(uv.x)-vM.w, min(uv.y, 4.6-uv.y));
    float rr=length(c), ang=atan(c.y, c.x-1e-4);
    float sb=step(rr,.42)+step(.55,rr)*step(rr,1.05)*step(.5,fract(ang*2.546));
    base=mix(base, OCHRE*(.85+.4*n1), clamp(sb,0.,1.)*.85*smoothstep(.2,.5,n3+.3));
  } else if(kind<6.5){                           // embers
    float e=vn(vW.xz*.55+uTime*vec2(.13,-.09))*vn(vW.xz*1.9-uTime*.21);
    base=vec3(.12,.03,.01); gl_FragColor.a=1.;
    vec3 hot=vec3(1.9,.42,.05)*(.16+1.7*e*e)*(.85+.15*sin(uTime*7.+vW.x));
    gl_FragColor=vec4(hot,1.); return;
  } else {                                       // rock floor: uv = (s, lateral)
    vec2 g=uv/vec2(5.5,4.2); g.x+=floor(g.y)*.37; vec2 gf=abs(fract(g)-.5);
    float joint=smoothstep(.5-aa*.3-.012,.5-aa*.3-.035, max(gf.x,gf.y));
    float worn=1.-smoothstep(2.,9.,abs(uv.y));
    base*=(.8+.34*n1)*(.9+.2*n2)*(.72+.28*joint)*(1.+.12*worn)*(.95+.1*h21(floor(g)));
    base=mix(base, vec3(.62,.5,.26)*(.7+.5*n3), vC.g>vC.r?0.:smoothstep(.62,.8,n2*.6+n3*.5)*.0);
  }
  // light through the window rectangles: the sun (one direction for all), or under a snow sky (uSky.z = 1) the cold
  // daylight that each window lets fall along its own axis, soft edged and fading with distance
  float sunL=0., sunK=0.;
  for(int i=0;i<${NWIN};i++){
    vec4 c=uWinC[i], n=uWinN[i], r=uWinR[i];
    vec3 sd=mix(uSun, vec3(n.x*uSky.x, uSky.y, n.z*uSky.x), uSky.z);
    float dn=dot(sd,n.xyz);
    if(float(i)<uCount && dn>.04){
      float t=dot(c.xyz-vW,n.xyz)/dn;
      vec3 hp=vW+sd*t-c.xyz;
      float a=abs(dot(hp.xz,r.xz)), b=abs(hp.y), hole=r.y, e=mix(.2+t*.013,.14+t*.006,hole)*(1.+1.9*uSky.z);
      float m=(1.-smoothstep(n.w-e,n.w+e,a))*(1.-smoothstep(r.w-e,r.w+e,b));
      float ex=a/n.w, ey=b/r.w, el=sqrt(sqrt(ex*ex*ex*ex+ey*ey*ey*ey)), ee=e/n.w;
      m=mix(m, 1.-smoothstep(1.-ee,1.+ee,el), hole)*step(0.,t)*(1.-smoothstep(c.w*.75,c.w,t));
      m*=1.-.85*(1.-hole)*(1.-uSky.z)*max(1.-smoothstep(.16-e*.3,.16+e,a), 1.-smoothstep(.16-e*.3,.16+e,abs(b-r.w*.3)));
      m*=mix(1., 1.35/(1.+t*t*.0011), uSky.z);
      float ld=dot(N,sd), l=max(ld,0.);
      if(kind>1.5&&kind<2.5) l=l*.7+.3*abs(ld);                    // cloth lets light through
      l=l*1.4/(.4+l);
      sunL=max(sunL,m); sunK=max(sunK,m*l);
    }
  }
  float shim=1.+uShimmer*(vn(vec2(vW.y*.1-uTime*.9, vW.x*.06+vW.z*.08+uTime*.2))+.5*vn(vec2(vW.x*.21+uTime*1.3, vW.z*.21+vW.y*.17-uTime*.7))-.75);
  vec3 sun=uSunCol*sunK*uDim*max(1.+.25*strokes,.4)*mix(1.,shim,.5);
  // where the bounce is strong it carries more of the window's own white, so lit rock is apricot and shade rose-tan
  vec3 fillC=mix(uFillCol, uFillCol*.55+vec3(.42,.4,.36)*dot(uFillCol,vec3(.6)), smoothstep(.45,.9,vL.y));
  vec3 light=fillC*vL.y*(.8+.2*N.y)*mix(1.,shim,.25)*(.5+.5*uDim);
  vec3 top=uTopCol*vL.z*mix(1.,shim,.25);
  vec3 glare=uGlareCol*vL.x*shim*uDim*(kind<.5?mix(.5,1.,hz):1.);
  for(int i=0;i<${NHOT};i++){
    vec3 d=uHot[i].xyz-vW; float d2=dot(d,d);
    float fl=.82+.18*sin(uTime*(9.+float(i)*2.3)+float(i)*1.7)*sin(uTime*3.7+float(i));
    light+=uHotCol*uHot[i].w*fl*(.25+.75*max(dot(N,d*inversesqrt(d2+1e-3)),0.))/(1.+d2*.011);
  }
  // snow glare is so much bluer than the rock is warm that it bleaches it: lit by it, apricot goes blue-white
  vec3 cool=mix(base, vec3(dot(base,vec3(.4,.4,.2))), kind<.5?mix(.25,.84,hz):(kind>6.5?.5:.35));
  // the white light of the well and of the open shaft, and the daylight of a snow sky, bleach it a little as well
  vec3 col=base*light+mix(base,cool,.45)*top+mix(base,vec3(dot(base,vec3(.4,.4,.2))),.8*uSky.z)*sun+cool*glare; light+=glare+top+sun;
  if(gloss>.5){
    vec3 R=reflect(-V,N); float up=smoothstep(-.25,.65,R.y);
    vec3 env=mix(uFillCol*.3, uGlareCol*1.15+uTopCol*.25, up)*(.6+.8*vn(R.xz*2.6+R.y*1.7));
    float fr=pow(1.-max(dot(N,V),0.),3.);
    col=base*(light*.28+env*(.75+.6*fr))+base*uSunCol*pow(max(dot(R,uSun),0.),20.)*sunL*1.2+vec3(1.,.92,.8)*pow(max(dot(R,normalize(vec3(.3,.8,.5))),0.),40.)*.3;
  }
  col+=vC*vM.y*(.9+.1*sin(uTime*11.+vW.x*3.));
  float fd=length(cameraPosition-vW)*uFogDen; col=mix(uFogCol, col, exp(-fd*fd));
  gl_FragColor=vec4(col,1.);
}`;

export function makeRock() {
  const v4 = () => Array.from({ length: NWIN }, () => new THREE.Vector4());
  const U = {
    uTime: { value: 0 }, uDim: { value: 1 }, uFogDen: { value: 0.004 }, uCount: { value: 0 }, uShimmer: { value: 0.3 },
    uSun: { value: new THREE.Vector3(0.646, 0.407, 0.646) }, uSunCol: { value: new THREE.Color(3.2, 2.7, 2.1) },
    uGlareCol: { value: new THREE.Color(0.86, 1.0, 1.2) }, uFillCol: { value: new THREE.Color(0.62, 0.5, 0.46) },
    uTopCol: { value: new THREE.Color(1.25, 1.3, 1.4) }, uFogCol: { value: new THREE.Color('#dfeaf6') }, uHotCol: { value: new THREE.Color(2.4, 0.95, 0.3) },
    uWinC: { value: v4() }, uWinN: { value: v4() }, uWinR: { value: v4() }, uHot: { value: Array.from({ length: NHOT }, () => new THREE.Vector4(0, -999, 0, 0)) },
    uSky: { value: new THREE.Vector3(0.88, 0.47, 0) },      // x, y: cosine and sine of the elevation of the daylight of a snow sky; z: 1 switches it on
  };
  const mats = [];
  return {
    U, windows: [],
    material(o = {}) {
      const m = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, vertexColors: true, side: o.side ?? THREE.FrontSide, defines: { ...(o.sway ? { SWAY: 1 } : {}), ...(o.side === THREE.DoubleSide ? { TWOSIDE: 1 } : {}) } });
      mats.push(m); return m;
    },
    // list of { c, n, hw, hh, reach }: the rectangles the sun shines through (at most NWIN)
    setWindows(list) {
      this.windows = list; U.uCount.value = Math.min(NWIN, list.length);
      for (let i = 0; i < U.uCount.value; i++) { const w = list[i]; U.uWinC.value[i].set(w.c.x, w.c.y, w.c.z, w.reach ?? 70); U.uWinN.value[i].set(w.n.x, 0, w.n.z, w.hw); U.uWinR.value[i].set(-w.n.z, w.hole ? 1 : 0, w.n.x, w.hh); }
    },
    setHot(i, x, y, z, k) { U.uHot.value[i].set(x, y, z, k); },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Niche wall: rings of tiles on a surface of revolution r = rad(y), each a pointed arch 3.2 x 3.4 m recessed 2.5 m,
// rimmed in red ochre (49 triangles a tile). Returns the perches: [x, y, z, angle, ring] for one bird a niche.
// ---------------------------------------------------------------------------------------------------------------
const ARCH = [[-1.6, 0.6], [-1.6, 2.5], [-1.05, 3.45], [0, 4.0], [1.05, 3.45], [1.6, 2.5], [1.6, 0.6]];
const TILE_H = 4.6, C_ROCK = lin('#e9b98e'), C_SHADE = lin('#b9795a'), C_OCHRE = lin('#b4432b'), C_STRAW = lin('#d9b45e'), C_PALE = lin('#f1dcc2');
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
async function nicheWall(b, o) {
  const { rings, cols, y0, rad, skip, lightAt, glow } = o, perches = [], A = [], B = [], B2 = [], O = [], R = [], Rb = [];
  for (let ring = 0; ring < rings; ring++) for (let col = 0; col < cols; col++) {
    if (col === 0 && o.pause) await o.pause();      // a ring of niches, then let a frame through
    const a0 = ((col + (ring % 2) * 0.5) / cols) * Math.PI * 2, yb = y0 + ring * TILE_H, rc = rad(yb + 2.3), hw = Math.PI * rc / cols;
    const sk = skip ? skip(a0, yb + 2.3, ring, col) : 0; if (sk === true) continue;
    if (sk === 3) {     // a blank plate (an inner arch is cut through here): 0.66 m cells, those inside the opening dropped
      const nx = 6, ny = 7, id = [], L = lightAt(yb + 2.3); b.lit = L;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const a = a0 + ((i / nx) * 2 - 1) * hw / rc, yy = yb + (j / ny) * TILE_H, r = rad(yy); id.push(b.v(r * Math.cos(a), yy, -r * Math.sin(a), -Math.cos(a), 0, Math.sin(a), mul(C_ROCK, 0.95), 0, 0, a * r, yy + (o.blankV ?? 20))); }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = a0 + (((i + 0.5) / nx) * 2 - 1) * hw / rc; if (o.cut && o.cut(a, yb + ((j + 0.5) / ny) * TILE_H)) continue; b.quadN(id[j * (nx + 1) + i], id[j * (nx + 1) + i + 1], id[(j + 1) * (nx + 1) + i + 1], id[(j + 1) * (nx + 1) + i]); }
      continue;
    }
    const dR = (rad(yb + 3.3) - rad(yb + 1.3)) / 2, nl = Math.hypot(1, dR);
    const put = (x, y, d, n0, n1, n2, c, lk, kind = 5, emis = 0) => {
      const a = a0 + x / rc, yy = yb + y, r = rad(yy) + d, ca = Math.cos(a), sa = Math.sin(a), L = lightAt(yy);
      b.lit = [L[0] * lk, L[1] * (0.4 + 0.6 * lk), L[2] * lk];
      return b.v(r * ca, yy, -r * sa, -sa * n0 + ca * n2, n1, -ca * n0 - sa * n2, c, kind, emis, x, y, hw);
    };
    const tone = 0.9 + 0.2 * (((ring * 7 + col * 13) % 10) / 10), rock = mul(C_ROCK, tone), ochre = mul(C_OCHRE, 0.85 + 0.3 * (((ring * 5 + col * 3) % 7) / 7));
    const OUT = [[-hw, 0], [-hw, 2.5], [-hw, TILE_H], [0, TILE_H], [hw, TILE_H], [hw, 2.5], [hw, 0]];
    for (let i = 0; i < 7; i++) {
      const p = ARCH[i], dx = p[0], dy = p[1] - 2.2, dl = Math.hypot(dx, dy), ox = dx / dl, oy = dy / dl, low = i === 0 || i === 6;
      A[i] = put(p[0], p[1], 0, 0, dR / nl, -1 / nl, ochre, 1);
      B[i] = put(p[0] + ox * 0.38, p[1] + oy * 0.38, 0, 0, dR / nl, -1 / nl, ochre, 1);
      B2[i] = put(p[0] + ox * 0.38, p[1] + oy * 0.38, 0, 0, dR / nl, -1 / nl, low ? C_PALE : rock, 1);
      O[i] = put(OUT[i][0], OUT[i][1], 0, 0, dR / nl, -1 / nl, low ? mul(C_PALE, 0.9) : rock, 1);
      R[i] = put(p[0], p[1], 0.02, -ox, -oy, 0, low ? C_STRAW : mul(C_SHADE, 0.95), 0.8);
      Rb[i] = put(p[0], p[1], 2.5, -ox, -oy, 0, low ? mul(C_STRAW, 0.7) : mul(C_SHADE, 0.6), 0.34);
    }
    for (let i = 0; i < 7; i++) { const j = (i + 1) % 7; b.quadN(A[i], A[j], B[j], B[i]); b.quadN(B2[i], B2[j], O[j], O[i]); b.quadN(R[i], R[j], Rb[j], Rb[i]); }
    if (sk === 2) {     // a flight hole: the back of the niche is open sky
      const c = put(0, 2.3, 1.3, 0, 0, -1, glow, 1, 1, 1); let prev = put(ARCH[0][0], ARCH[0][1], 1.3, 0, 0, -1, glow, 1, 1, 1), first = prev;
      for (let i = 1; i < 7; i++) { const v = put(ARCH[i][0], ARCH[i][1], 1.3, 0, 0, -1, glow, 1, 1, 1); b.triN(c, prev, v); prev = v; } b.triN(c, prev, first);
    } else {
      const c = put(0, 2.2, 2.5, 0, 0, -1, mul(C_SHADE, 0.5), 0.3, 1);
      for (let i = 0; i < 7; i++) { const v = put(ARCH[i][0], ARCH[i][1], 2.5, 0, 0, -1, mul(C_SHADE, i === 0 || i === 6 ? 0.75 : 0.5), 0.3, 1), w = put(ARCH[(i + 1) % 7][0], ARCH[(i + 1) % 7][1], 2.5, 0, 0, -1, mul(C_SHADE, 0.5), 0.3, 1); b.triN(c, v, w); }
      const r = rad(yb + 1.2) + 0.3; perches.push([r * Math.cos(a0), yb + 1.02, -r * Math.sin(a0), a0, ring]);      // on the lip of its niche
    }
  }
  b.lit = null;
  return perches;
}
// a plain band of the same surface of revolution (kind 0 rock, or the kind given), facing the axis (or away: out = true)
function band(b, o) {
  const { y0, y1, ny, na, rad, lightAt, kind = 0, out = false, c = C_ROCK, skip } = o, idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= na; i++) {
    const y = lerp(y0, y1, j / ny), a = (i / na) * Math.PI * 2, r = rad(y, j / ny), dR = (rad(y + 0.5, j / ny) - rad(y - 0.5, j / ny)), nl = Math.hypot(1, dR) * (out ? -1 : 1), ca = Math.cos(a), sa = Math.sin(a);
    const yy = o.yOf ? o.yOf(j / ny) : y, t = 0.9 + 0.2 * Math.sin(i * 12.9898 + j * 78.233) * Math.sin(i * 3.7);
    b.lit = lightAt(yy, r); idx.push(b.v(r * ca, yy, -r * sa, o.up ? 0 : -ca / nl, o.up || dR / nl, o.up ? 0 : sa / nl, mul(typeof c === 'function' ? c(a, r) : c, t), kind, 0, kind === 7 ? a * 20 : a * r, kind === 7 ? r - 22 : yy - (o.vBase ?? FLOOR)));
  }
  const W = na + 1;
  for (let j = 0; j < ny; j++) for (let i = 0; i < na; i++) {
    if (skip && skip(((i + 0.5) / na) * Math.PI * 2, rad(lerp(y0, y1, (j + 0.5) / ny), (j + 0.5) / ny))) continue;
    b.quadN(idx[j * W + i], idx[j * W + i + 1], idx[(j + 1) * W + i + 1], idx[(j + 1) * W + i]);
  }
  b.lit = null;
}

// ---------------------------------------------------------------------------------------------------------------
// Pigeons: one InstancedMesh. Perched birds bob and shuffle with folded wings; from their release u they lift,
// join a rising vortex round the axis (inside 11 m, clear of the flight helix at 20 m) and funnel out of the window.
// ---------------------------------------------------------------------------------------------------------------
function birdGeometry() {
  const P = [], N = [], W = [], I = []; let n = 0;
  const v = (x, y, z, w, nx = 0, ny = 1, nz = 0) => { P.push(x, y, z); N.push(nx, ny, nz); W.push(w); return n++; };
  // body: a smooth spindle along z with a neck, a round head and a beak: stations (z, radius, y), 6 sides
  const st = [[-1.0, 0.02, 0.05], [-0.78, 0.18, 0.03], [-0.42, 0.38, 0.0], [0.05, 0.47, 0.0], [0.46, 0.4, 0.1], [0.72, 0.21, 0.25], [0.92, 0.26, 0.42], [1.08, 0.22, 0.46], [1.2, 0.09, 0.42], [1.38, 0.01, 0.38]], S = 6, ring = [];
  for (let i = 0; i < st.length; i++) {
    const a0 = st[Math.max(0, i - 1)], a1 = st[Math.min(st.length - 1, i + 1)], dr = (a1[1] - a0[1]) / (a1[0] - a0[0]), dy = (a1[2] - a0[2]) / (a1[0] - a0[0]); ring[i] = [];
    for (let k = 0; k < S; k++) { const a = (k / S) * Math.PI * 2 + Math.PI / 2, c = Math.cos(a), s = Math.sin(a), nz = -dr - s * dy, l = Math.hypot(c, s, nz); ring[i][k] = v(c * st[i][1] * 0.92, st[i][2] + s * st[i][1] * 0.85, st[i][0], 0, c / l, s / l, nz / l); }
  }
  for (let i = 0; i + 1 < st.length; i++) for (let k = 0; k < S; k++) { const k2 = (k + 1) % S; I.push(ring[i][k], ring[i + 1][k], ring[i + 1][k2], ring[i][k], ring[i + 1][k2], ring[i][k2]); }
  // wings: six spanwise stations [x, leading edge z, trailing edge z, weight 0.1 .. 1]: a broad arm pushed forward to
  // the wrist, then a hand swept back to a point. Three vertices across the chord (leading edge, the raised middle,
  // trailing edge); the normal's z says where on the chord a vertex sits: the shader folds and rounds the wing with it.
  const WS = [[0.3, 0.55, -0.44, 0.1], [0.95, 0.8, -0.52, 0.34], [1.55, 0.74, -0.46, 0.56], [2.1, 0.46, -0.36, 0.76], [2.55, 0.06, -0.36, 0.92], [2.86, -0.54, -0.64, 1]];
  for (const sd of [-1, 1]) {
    const rows = WS.map((q) => [v(sd * q[0], 0.15, q[1], sd * q[3], 0, 1, 0.6), v(sd * q[0], 0.23 - 0.06 * q[3], (q[1] + q[2]) / 2 + 0.05, sd * q[3], 0, 1, 0.05), v(sd * q[0], 0.13, q[2], sd * q[3], 0, 1, -0.6)]);
    for (let i = 0; i + 1 < WS.length; i++) for (let k = 0; k < 2; k++) I.push(rows[i][k], rows[i + 1][k], rows[i][k + 1], rows[i][k + 1], rows[i + 1][k], rows[i + 1][k + 1]);
  }
  // tail fan
  const t0 = v(0, 0.06, -0.66, 0), t1 = v(-0.62, 0.05, -1.46, 0), t2 = v(-0.24, 0.07, -1.68, 0), t3 = v(0.24, 0.07, -1.68, 0), t4 = v(0.62, 0.05, -1.46, 0); I.push(t0, t1, t2, t0, t2, t3, t0, t3, t4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1)); g.setIndex(I);
  return g;
}
const BIRD_VERT = /* glsl */`
attribute float aWing; attribute vec4 iA, iB; attribute float iC, iD;
uniform float uTime, uU, uDur, uPart; uniform vec3 uPortal, uPDir, uPRight, uPUp;
varying vec3 vN, vW, vQ; varying vec4 vK;
vec3 route(float s, float t, out float lift){
  float seed=iB.x, rho=iB.y, kind=iB.w;
  if(kind>.5){ lift=1.; float th=seed*43.98+t*(.42+.3*fract(seed*13.7)); float yc=iA.y+5.*sin(t*.23+seed*9.)+2.*sin(t*.61+seed*4.); rho*=.8+.2*sin(t*.31+seed*21.);
    vec3 circ=vec3(rho*cos(th), yc, -rho*sin(th));
    if(kind<1.5) return circ;
    // the escort: these circle high in the shaft until the last climb, then form up round the line from the camera to
    // the great window and overtake us all the way out through it, a ring of wings round the opening (iB.z = how far
    // out from that line, iD = where in the stream)
    float lead=mod(iD+t*6.5,52.)-9., dc=dot(uPortal-cameraPosition,uPDir)-lead, ph=seed*18.85+.25*sin(t*.8+seed*40.);
    vec3 q=uPortal-uPDir*dc+(uPRight*cos(ph)+uPUp*sin(ph))*(iB.z+lead*.07)*(1.+.07*sin(t*1.7+seed*20.))*(.6+.4*smoothstep(2.,18.,dc));
    return mix(circ,q,smoothstep(.862,.912,uU)); }
  lift=smoothstep(0.,1.05,s);
  float yv=iA.y+2.5+max(s,0.)*iB.z;
  // the ribbon: two strands of one helix round the axis (a turn every 38 m) that turns slowly on itself as the flight
  // goes on; a bird keeps its place across the ribbon (iD: the strand that was nearer its niche when it left, and where
  // across that strand) and climbs along it at its own speed, so the gaps between the coils stay open
  float th=(yv-78.)/6.+(iA.w*uDur+s)*.3+iD;
  rho+=.7*sin(t*.9+seed*31.);
  vec3 vort=vec3(rho*cos(th), yv+.8*sin(t*.7+seed*13.), -rho*sin(th));
  vec3 p=mix(iA.xyz+vec3(0.,2.2*sin(lift*3.1416),0.), vort, lift);
  float e=smoothstep(160.,186.,yv)*lift;
  float ph=seed*61.;
  vec3 q=uPortal-uPDir*(1.-e)*26.+(uPRight*cos(ph)*.92+uPUp*(sin(ph)*.9+.12))*(5.6+2.4*fract(seed*5.3))*(1.-e*.14);
  return mix(p,q,e*e*(3.-2.*e));
}
// keep the air round the camera and along its line to the window open: nearer birds are moved out, further ones less,
// so that nothing piles up on the edge of the clearing
vec3 part(vec3 p){
  vec3 a=cameraPosition, ab=uPortal-a; float h=clamp(dot(p-a,ab)/max(dot(ab,ab),1.),0.,1.);
  vec3 d=p-(a+ab*h); float dist=length(d)+1e-3;
  float rad=mix(mix(16.,8.5,smoothstep(0.,.3,h)),5.6,smoothstep(.8,1.,h)), R=rad*2.2;
  return p+d/dist*max(rad-dist*rad/R,0.)*uPart;
}
void main(){
  float seed=iB.x, kind=iB.w, s=(uU-iA.w)*uDur, l0, l1;
  vec3 p0=route(s,uTime,l0), p1=route(s+.12,uTime+.12,l1);
  float esc=step(1.5,kind), k1=min(kind,1.);
  p0=mix(p0,part(p0),l0*(1.-esc)); p1=mix(p1,part(p1),l1*(1.-esc));
  vec3 inward=normalize(vec3(-iA.x,0.,-iA.z)+vec3(1e-4,0.,0.));
  float sh=.55*sin(uTime*.6+seed*20.)+.25*sin(uTime*1.9+seed*7.);
  vec3 perch=normalize(inward+vec3(-inward.z,0.,inward.x)*sh);
  vec3 d=p1-p0; vec3 fly=d*inversesqrt(dot(d,d)+1e-6);
  vec3 fw=normalize(mix(perch,fly,l0)+vec3(0.,1e-4,0.));
  vec3 rt=cross(vec3(0.,1.,0.),fw); rt*=inversesqrt(dot(rt,rt)+1e-5); vec3 up=cross(fw,rt);
  float roll=iC>.5?6.2832*smoothstep(.72,1.,sin(uTime*.9+seed*9.))*l0:0.;
  roll+=(.4*sin(uTime*.7+seed*33.))*l0;
  float cr=cos(roll), sr=sin(roll); vec3 r2=rt*cr+up*sr, u2=up*cr-rt*sr;
  vec3 q=position; float w=abs(aWing), sd=sign(aWing), isW=step(.01,w), ax=abs(q.x), cz=clamp(normal.z/.6,-1.,1.);
  // flying: the arm beats from the shoulder and the hand follows a little later from the wrist, so the wing bends
  float phs=uTime*(9.+3.5*fract(seed*3.3))+seed*50.;
  float aIn=(sin(phs)*.9+.12)*l0, aOut=aIn+(sin(phs-1.1)*.75-.12)*l0;
  float xin=min(ax,1.05), xo=max(ax-1.05,0.);
  vec3 qf=vec3(sd*(xin*cos(aIn)+xo*cos(aOut)), q.y+xin*sin(aIn)+xo*sin(aOut), q.z-.22*w*w*cos(phs));
  qf=mix(q-vec3(0.,.1*sin(phs),0.), qf, isW);
  // perched: the body fluffed, each wing folded to a blade along the flank, the bird tipped up on its feet
  float fat=mix(1.5,1.12,smoothstep(.45,.85,q.z));
  vec3 qp=mix(vec3(q.x*fat,q.y*fat*.94,q.z*.92), vec3(sd*(.76-.44*w*w), .3+.3*cz-.2*w, .5-1.7*w+.14*cz), isW);
  qp=vec3(qp.x, qp.y*.8+qp.z*.6+.3, qp.z*.8-qp.y*.6);
  q=mix(qp,qf,l0);
  float aw=mix(aIn,aOut,step(1.05,ax));
  vec3 n=normal; if(w>.01) n=normalize(mix(vec3(sd*.9,.45,0.), vec3(-sd*sin(aw), cos(aw), normal.z*.5), l0));
  float bob=(1.-l0)*.14*abs(sin(uTime*1.7+seed*30.));
  float yv=iA.y+2.5+max(s,0.)*iB.z;
  // on the wing a bird is drawn smaller than on its perch, so that one bird never covers more than a tenth of the picture
  float dcE=dot(uPortal-p0,uPDir);
  float sc=kind>1.5?.78*smoothstep(-1.,5.,dcE)*mix(1.,1.-smoothstep(35.,42.,dot(p0-cameraPosition,uPDir)),smoothstep(.862,.912,uU)):kind>.5?mix(1.,.8,step(${FLOOR}.,iA.y)):(1.-smoothstep(183.,187.,yv)*step(0.,s))*(1.-.5*smoothstep(166.,185.,yv)*step(0.,s))*mix(1.,.62,smoothstep(0.,.6,l0));
  vec3 c=p0+vec3(0.,bob,0.);
  float cd=distance(c,cameraPosition);
  sc*=smoothstep(5.,11.,cd)*mix(1.,mix(step(.5,fract(seed*7.31)),1.,smoothstep(18.,64.,cd)),l0*(1.-k1));     // the lifting flock thins round the camera
  vec3 wp=c+(r2*q.x+u2*q.y+fw*q.z)*sc;
  vN=normalize(r2*n.x+u2*n.y+fw*n.z); vW=(modelMatrix*vec4(wp,1.)).xyz;
  vK=vec4(iC, w, l0, kind*(1.-esc)); vQ=vec3(abs(position.x), position.z, position.y);
  gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);
}`;
const BIRD_FRAG = /* glsl */`precision highp float;
uniform vec3 uGlareCol, uFillCol, uTopCol, uFogCol, uSunCol, uSun, uBounce, uSky; uniform float uFogDen, uDark, uGain, uCount;
uniform vec4 uWinC[${NWIN}], uWinN[${NWIN}], uWinR[${NWIN}];
varying vec3 vN, vW, vQ; varying vec4 vK;
void main(){
  vec3 N=normalize(vN);
  vec3 V=normalize(cameraPosition-vW);
  float face=dot(N,V)<0.?-1.:1.; N*=face;
  float wing=step(.01,vK.y), fl=vK.z, under=(1.-face)*.5, fw=fwidth(vQ.x)*2.4, body=(1.-wing)*(1.-fl);
  vec3 base=mix(vec3(.95,.94,.91), vec3(.24,.27,.35), vK.x);
  base=mix(base, base*vec3(.27,.29,.38), smoothstep(.62,.84,vK.y));            // dark flight feathers on the hand of the wing
  base*=1.-.25*smoothstep(.3,.5,vK.y)*(1.-smoothstep(.55,.7,vK.y));           // a bar across the coverts
  base=mix(base, base*vec3(.42,.46,.6), wing*(1.-fl));                         // folded, the wings lie grey along the flanks
  // the gaps between the flight feathers, on the trailing half of the wing (gone before they could alias)
  float gap=(1.-smoothstep(0.,.3,abs(fract(vQ.x*2.4-vQ.y*1.2)-.5)*2.))*(1.-smoothstep(-.45,0.,vQ.y))*wing*(1.-smoothstep(.15,.5,fw));
  base*=1.-.34*gap;
  base=mix(base, base*vec3(.68,.71,.8), under*mix(.45,1.,wing)*fl);             // grey underside
  // on the perch: a grey-violet collar, a dark eye, the breast shading down to the feet
  base=mix(base, base*vec3(.55,.52,.68), body*smoothstep(.5,.6,vQ.y)*(1.-smoothstep(.76,.86,vQ.y))*.8);
  base*=1.-.9*(1.-wing)*(1.-smoothstep(.06,.1,length(vec3(vQ.x-.2,vQ.z-.47,vQ.y-1.02))));
  base*=mix(1.,mix(.42,1.,smoothstep(-.45,.3,vQ.z)),body);
  base=mix(base, vec3(.5,.26,.24), smoothstep(1.2,1.26,vQ.y)*(1.-wing));        // the beak
  base*=1.-.4*(1.-smoothstep(-1.55,-1.3,vQ.y))*(1.-wing);                            // a darker band at the end of the tail
  float dk=uDark*step(.5,vK.w);                                              // only the well flyers (swallows at dusk): dark slate, never black
  base=mix(base, vec3(.15,.16,.22), dk*.9);
  // the light comes down the shaft (and, for a bird on its perch, from the middle of it): backs and breasts bright,
  // bellies and flanks in grey shade; a spread wing seen from below lets some of the light through
  vec3 Lk=normalize(vec3(-vW.x*mix(.9,.35,fl), 26., -vW.z*mix(.9,.35,fl)));
  float kd=dot(N,Lk), lit=smoothstep(mix(.0,-.3,fl),mix(.95,.8,fl),kd), up=N.y*.5+.5, thru=wing*fl*under*max(-kd,0.);
  vec3 light=(uFillCol*.3+uTopCol*(.2+.95*lit+.6*thru)+uGlareCol*.12*(1.-up))*mix(.86,1.,fl);
  // a bird crossing one of the bars of sun from the flight holes flares, warmest on its rim
  float sunL=0.;
  for(int i=0;i<${NWIN};i++){
    vec4 c=uWinC[i], n=uWinN[i], r=uWinR[i];
    vec3 sd=mix(uSun, vec3(n.x*uSky.x, uSky.y, n.z*uSky.x), uSky.z);
    float dn=dot(sd,n.xyz);
    if(float(i)<uCount && r.y>.5 && dn>.04){
      float t=dot(c.xyz-vW,n.xyz)/dn; vec3 hp=vW+sd*t-c.xyz;
      float ex=abs(dot(hp.xz,r.xz))/n.w, ey=abs(hp.y)/r.w, el=sqrt(sqrt(ex*ex*ex*ex+ey*ey*ey*ey));
      sunL=max(sunL,(1.-smoothstep(.85,1.1,el))*step(0.,t)*step(t,c.w));
    }
  }
  float rim=max(1.-abs(dot(N,V)),0.); rim*=rim;
  light+=uSunCol*sunL*(.2+.3*abs(dot(N,uSun))+1.1*rim)*mix(1.,.5,uSky.z);
  light+=uBounce*fl*(1.-.5*up);                                              // the last sun off the red wall, under a risen bird
  vec3 col=base*light*uGain+uTopCol*rim*.12*(1.-dk*.5);
  float fd=length(cameraPosition-vW)*uFogDen; col=mix(uFogCol, col, exp(-fd*fd));
  gl_FragColor=vec4(col,1.);
}`;

// the sky seen through the open top of the shaft (painted by view ray), and the column of daylight that falls from it
const SKY_VERT = /* glsl */`varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const SKY_FRAG = /* glsl */`precision highp float;
uniform vec3 uZen, uHor; uniform float uTime, uCloud, uFlakes, uStars; varying vec3 vW;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
void main(){
  vec3 rd=normalize(vW-cameraPosition); float up=clamp(rd.y,0.,1.);
  vec2 q=rd.xz/max(rd.y,.25);
  vec3 col=mix(uHor,uZen,smoothstep(.5,1.,up));
  float cl=vn(q*2.6+uTime*vec2(.06,.025))*.6+vn(q*6.1-uTime*vec2(.035,.07))*.4;
  col=mix(col, mix(uHor,vec3(1.),.55)*1.2, smoothstep(.42,.8,cl)*uCloud);
  col+=uStars*step(.992,h21(floor(q*70.)))*vec3(2.2,2.4,3.)*(.6+.4*sin(uTime*3.+q.x*90.));
  // flakes coming down the throat: three layers, the nearer ones larger and faster
  for(int k=0;k<3;k++){ float fk=float(k); vec2 g=vW.xz*(.16+fk*.11)+vec2(sin(uTime*.5+fk*2.)*.6+fk*7., uTime*(.5+fk*.35)); vec2 gi=floor(g);
    float d=length(fract(g)-.5-(vec2(h21(gi+fk),h21(gi+3.+fk))-.5)*.6); col=mix(col, vec3(1.25,1.3,1.4), smoothstep(.2,.06,d)*.8*uFlakes*step(.35,h21(gi+9.))); }
  gl_FragColor=vec4(col,1.);
}`;
const COL_VERT = /* glsl */`varying vec3 vW, vN; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`;
const COL_FRAG = /* glsl */`precision highp float;
uniform vec3 uCol; uniform float uTime, uFlakes; varying vec3 vW, vN;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
void main(){
  vec3 d=cameraPosition-vW; float dist=length(d); vec3 V=d/max(dist,1e-3);
  float f=abs(dot(normalize(vN),V)); f=f*f*(3.-2.*f);                           // thick through the middle, nothing at the limb
  float ang=atan(vW.z,vW.x+1e-5);
  float n=vn(vec2(ang*3.,vW.y*.07+uTime*.22))*.6+vn(vec2(ang*9.,vW.y*.21+uTime*.5))*.4;
  float h=smoothstep(${FLOOR}.,${FLOOR + 30}.,vW.y)*(.45+.55*smoothstep(${FLOOR}.,${TOP}.,vW.y));
  float a=f*h*(.55+.9*n)*smoothstep(4.,16.,dist);
  vec2 g=vec2(ang*26.,vW.y*.9+uTime*2.4), gi=floor(g);                          // snow coming down in it
  float fl=step(.9,h21(gi))*smoothstep(.4,.1,length(fract(g)-.5))*uFlakes*f*smoothstep(8.,24.,dist)*(1.-smoothstep(60.,110.,dist));
  gl_FragColor=vec4(uCol*(a+fl*9.),1.);
}`;

// portal frame axes (the engine's tilted exit frame: right = north, up leans east, -Z = PORTAL_DIR)
const P_RIGHT = new THREE.Vector3(0, 0, -1), P_UP = new THREE.Vector3(Math.sin(PITCH), Math.cos(PITCH), 0);
const archSd = (x, y) => { const bx = Math.abs(x) - 7, by = Math.abs(y + 3.5) - 4.5, box = Math.hypot(Math.max(bx, 0), Math.max(by, 0)) + Math.min(Math.max(bx, by), 0); return Math.min(box, Math.hypot(x, y - 1) - 7); };
// how far (along PORTAL_DIR) the shaft wall at a point is pushed back to clear the great window: behind the opening the
// rock goes back 3.5 m, round it the wall is never left in front of the face of the carved frame, and that fades out
// over ten metres (the window is cut on a chord, so on its north side the wall stands well in front of it)
function pushBack(x, y, z, tl) {
  portalLocal(x, y, z, tl); if (Math.abs(tl[2]) > 18) return 0;
  const sd = archSd(tl[0], tl[1]); if (sd > 10) return 0;
  return lerp(Math.max(tl[2], lerp(3.5, -0.6, sstep(1, 3.4, sd))), tl[2], sstep(3.4, 10, sd)) - tl[2];
}
function portalLocal(x, y, z, o) { const rx = x - PORTAL_POS.x, ry = y - PORTAL_POS.y, rz = z - PORTAL_POS.z; o[0] = rx * P_RIGHT.x + ry * P_RIGHT.y + rz * P_RIGHT.z; o[1] = rx * P_UP.x + ry * P_UP.y + rz * P_UP.z; o[2] = rx * PORTAL_DIR.x + ry * PORTAL_DIR.y + rz * PORTAL_DIR.z; return o; }

export async function buildHero(ctx, opts = {}) {
  const rng = (ctx.rng.fork ? ctx.rng.fork('dovecote') : ctx.rng), object = new THREE.Group(), own = !opts.rock, rock = opts.rock || makeRock(), U = rock.U;
  const SKY = opts.glow || [2.2, 2.9, 4.0], tl = [0, 0, 0];
  // ---- shaft ----
  const b = new Bld(), Y0 = FLOOR + 4, RINGS = 24, COLS = 44;
  const shaftLight = (y) => [0.1 + 0.3 * sstep(150, 204, y), 0.5 - 0.16 * sstep(84, 150, y), 0.1 + 0.52 * sstep(88, 200, y)];     // warm from the house below, cold from the open top; about a stop under the sun ovals
  const hc = Math.round((((opts.holeAngle ?? -Math.PI / 4) / (Math.PI * 2)) % 1 + 1) % 1 * COLS), holes = [];
  const HOLES = (opts.holeRings || [[12, -4], [13, -2], [14, 0], [15, 2], [16, 4]]).map((h) => [h[0], (h[1] + hc + COLS) % COLS]);
  const perches = await nicheWall(b, { pause: ctx.yield, rings: RINGS, cols: COLS, y0: Y0, rad: shaftR, lightAt: shaftLight, glow: SKY, blankV: 300, skip(a, y, ring, col) {
    const r = shaftR(y); portalLocal(r * Math.cos(a), y, -r * Math.sin(a), tl); if (Math.abs(tl[2]) < 14 && archSd(tl[0], tl[1]) < 1.5) return true;
    for (const [da, dy] of [[0, 0], [-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]]) { const rr = shaftR(y + dy), aa = a + da / rr; if (pushBack(rr * Math.cos(aa), y + dy, -rr * Math.sin(aa), tl) > 0.3) return 3; }      // plain rock wherever the wall is pushed back into the splay of the great window
    for (const h of HOLES) if (h[0] === ring && h[1] === col) { const rr = r + 0.4; holes.push({ c: new THREE.Vector3(rr * Math.cos(a), y, -rr * Math.sin(a)), n: new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), hw: 2.1, hh: 2.2, reach: 98, hole: true }); return 2; }
    return 0;
  } });
  if (ctx.yield) await ctx.yield();
  band(b, { y0: FLOOR, y1: Y0, ny: 2, na: 88, rad: shaftR, lightAt: shaftLight });
  if (ctx.yield) await ctx.yield();
  band(b, { y0: Y0 + RINGS * TILE_H, y1: TOP, ny: 5, na: 66, rad: shaftR, lightAt: shaftLight, vBase: 188.4 });      // vBase: the ochre frieze of the rooms runs round the top of the shaft too
  // the shaft is open to the sky: an ochre lip, then the throat cut through the roof of the cone, a cornice of snow
  // round its upper edge and icicles under that (opts.snowy)
  if (ctx.yield) await ctx.yield();
  const RT = shaftR(TOP), RO = RT - 1.6, YT = TOP + 8;
  band(b, { y0: TOP, y1: TOP + 1.5, ny: 1, na: 66, rad: () => RT, c: mul(C_OCHRE, 0.9), lightAt: () => [0.3, 0.3, 0.45] });
  band(b, { y0: 0, y1: 1, ny: 1, na: 66, rad: (y, t) => lerp(RT, RO, t), yOf: () => TOP + 1.5, up: -1, lightAt: () => [0.25, 0.3, 0.3] });
  band(b, { y0: TOP + 1.5, y1: YT, ny: 3, na: 66, rad: () => RO, lightAt: (y) => [0.5 + 0.5 * sstep(TOP + 1.5, YT, y), 0.2, 0.6 + 0.3 * sstep(TOP + 1.5, YT, y)], vBase: TOP - 9 });
  if (ctx.yield) await ctx.yield();
  if (opts.snowy) {
    const cg = new THREE.TorusGeometry(RO - 0.5, 1.5, 7, 54).rotateX(Math.PI / 2), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), a = Math.atan2(z, x), k = 1 + 0.3 * Math.sin(a * 7) * Math.sin(a * 3 + 1) + 0.18 * Math.sin(a * 23); cp.setXYZ(i, x * (1 - 0.035 * (k - 1)), y * k * (y < 0 ? 1.5 : 1), z * (1 - 0.035 * (k - 1))); }
    cg.computeVertexNormals(); b.add(cg.translate(0, YT - 0.4, 0), { c: [0.9, 0.94, 1.0], kind: 1, l: [1.0, 0.1, 0.75] });
    for (let i = 0; i < 46; i++) { if ((i & 15) === 0 && ctx.yield) await ctx.yield(); const a = (i / 46) * Math.PI * 2 + 0.07 * Math.sin(i * 5.1), len = 1.6 + 4.2 * Math.abs(Math.sin(i * 2.37)) * Math.abs(Math.sin(i * 0.9 + 1)), r = RO - 0.9 - 0.5 * Math.sin(i * 3.3);
      b.add(new THREE.ConeGeometry(0.2 + len * 0.045, len, 5, 1).rotateX(Math.PI).translate(r * Math.cos(a), YT - 1.6 - len / 2, -r * Math.sin(a)), { c: [0.72, 0.86, 1.0], kind: 3, l: [0.9, 0.2, 0.8] }); }
  }
  if (ctx.yield) await ctx.yield();
  // the embrasure: push the wall back round the great window so that nothing stands in the opening
  for (let i = 0; i < b.n; i++) {
    if ((i & 16383) === 16383 && ctx.yield) await ctx.yield();
    const k = i * 3, dz = pushBack(b.P[k], b.P[k + 1], b.P[k + 2], tl); if (dz === 0) continue;
    b.P[k] += PORTAL_DIR.x * dz; b.P[k + 1] += PORTAL_DIR.y * dz; b.P[k + 2] += PORTAL_DIR.z * dz;
  }
  if (ctx.yield) await ctx.yield();
  // dovecote floor (the ramp mouth is left open) and the well parapet
  band(b, { y0: 0, y1: 1, ny: 11, na: 110, rad: (y, t) => lerp(13.6, 30.2, t), yOf: () => FLOOR, up: 1, kind: 7, lightAt: (y, r) => [0.4 * (1 - sstep(15, 25, r)), 0.46, 0.2 - 0.1 * sstep(22, 30, r)], skip: opts.mouth, c: (a, r) => (Math.sin(a * 23 + r * 1.3) + Math.sin(a * 7 - r * 2.1) > 1.1 ? C_STRAW : C_ROCK) });
  band(b, { y0: FLOOR, y1: FLOOR + 3, ny: 2, na: 60, rad: () => 13.6, out: true, lightAt: () => [0.1, 0.5, 0.4] });
  band(b, { y0: 0, y1: 1, ny: 1, na: 60, rad: (y, t) => lerp(WELL_R, 13.6, t), yOf: () => FLOOR + 3, up: 1, lightAt: () => [0.15, 0.5, 0.7] });
  if (ctx.yield) await ctx.yield();
  // the carved frame of the great window
  {
    const out = [], add = (x, y, mx, my) => out.push([x, y, mx, my]);
    add(-7, -8, -0.7, -0.7); add(-7, -3.5, -1, 0); add(-7, 1, -1, 0);
    for (let i = 1; i < 16; i++) { const a = Math.PI - (i / 16) * Math.PI; add(7 * Math.cos(a), 1 + 7 * Math.sin(a), Math.cos(a), Math.sin(a)); }
    add(7, 1, 1, 0); add(7, -3.5, 1, 0); add(7, -8, 0.7, -0.7); add(0, -8, 0, -1);
    const prof = [[0, 0.5, 0], [0, -1.3, 0], [0.6, -1.7, 1], [0.95, -1.7, 1], [0.95, -1.7, 3], [1.6, -1.7, 3], [1.6, -1.7, 1], [1.9, -1.7, 1], [2.6, -1.2, 2], [2.9, 8, 2]];
    const ix = []; let arc = 0;
    for (let i = 0; i <= out.length; i++) {
      const o = out[i % out.length], pr = out[(i + out.length - 1) % out.length]; if (i) arc += Math.hypot(o[0] - pr[0], o[1] - pr[1]);
      ix[i] = prof.map((q) => {
        const x = o[0] + o[2] * q[0], y = o[1] + o[3] * q[0], z = q[1];
        const n = q[2] === 0 ? [-o[2], -o[3], 0] : q[2] === 2 ? [o[2], o[3], -0.2] : [0, 0, -1];
        _p.copy(PORTAL_POS).addScaledVector(P_RIGHT, x).addScaledVector(P_UP, y).addScaledVector(PORTAL_DIR, z);
        _n.set(0, 0, 0).addScaledVector(P_RIGHT, n[0]).addScaledVector(P_UP, n[1]).addScaledVector(PORTAL_DIR, n[2]).normalize();
        b.lit = q[2] === 0 ? [0.5, 0.6, 0.9] : [0.22, 0.55, 0.62];
        return b.v(_p.x, _p.y, _p.z, _n.x, _n.y, _n.z, q[2] === 3 ? C_OCHRE : mul(C_ROCK, q[2] === 0 ? 1.05 : 0.95), 0, 0, arc, 13 + q[0]);
      });
    }
    for (let i = 0; i < out.length; i++) for (let j = 0; j + 1 < prof.length; j++) { if (j === 3 || j === 5) continue; b.quadN(ix[i][j], ix[i + 1][j], ix[i + 1][j + 1], ix[i][j + 1]); }
    b.lit = null;
  }
  if (ctx.yield) await ctx.yield();
  const fillK = opts.fillK ?? 1; for (let i = 1; i < b.n * 3; i += 3) b.L[i] *= fillK;      // the house may run a stronger fill colour than the shaft wants
  if (ctx.yield) await ctx.yield();
  const mat = rock.material(), shaft = new THREE.Mesh(b.build(), mat); shaft.name = 'dovecote'; object.add(shaft);
  let triangles = b.triangles;
  if (ctx.yield) await ctx.yield();
  // ---- well ----
  const w = new Bld(), wellLight = (y) => { const t = sstep(-8, FLOOR, y); return [0.03, 0.22, 0.62 + 0.5 * t]; };
  const wellPerch = await nicheWall(w, { pause: ctx.yield, rings: 18, cols: 19, y0: -6.8, rad: () => WELL_R, lightAt: wellLight, glow: SKY, skip: opts.wellSkip || null, cut: opts.wellCut });
  if (ctx.yield) await ctx.yield();
  band(w, { y0: 76, y1: FLOOR + 3, ny: 2, na: 60, rad: () => WELL_R, lightAt: wellLight });
  band(w, { y0: 0, y1: 1, ny: 3, na: 30, rad: (y, t) => lerp(0.4, WELL_R, t), yOf: () => -6.8, up: 1, kind: 7, c: mul(C_SHADE, 0.6), lightAt: () => [0, 0.25, 0.1] });
  w.add(new THREE.TorusGeometry(WELL_R - 0.1, 0.42, 5, 72).rotateX(Math.PI / 2).translate(0, 76.4, 0), { c: (x, y, z) => mul(C_PALE, 0.8 + 0.2 * Math.sin(Math.atan2(z, x) * 60)), kind: 1, l: [0.1, 0.4, 0.9] });
  for (let i = 1; i < w.n * 3; i += 3) w.L[i] *= fillK;
  const well = new THREE.Mesh(w.build(), mat); well.name = 'well'; object.add(well); triangles += w.triangles;
  if (ctx.yield) await ctx.yield();
  // ---- pigeons ----
  const flyers = [], archY = opts.archY || [15, 27, 43, 58, 72];
  for (let i = 0; i < 40; i++) flyers.push([archY[i % archY.length] + rng.range(-3, 5), rng.range(2.5, 9.5)]);
  for (let i = 0; i < 16; i++) flyers.push([rng.range(96, 172), rng.range(3, 11)]);
  const NESC = 72; for (let i = 0; i < NESC; i++) flyers.push([rng.range(112, 150), rng.range(3, 10.5), 2]);      // the escort (kind 2)
  const count = perches.length + flyers.length, iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iC = new Float32Array(count), iD = new Float32Array(count), slate = opts.slate ?? 0;
  for (let i = 0; i < count; i++) {
    const p = perches[i];
    // the wave of lifting runs up the wall from u 0.674 to 0.748 (a few birds hang back and follow later); rather more than
    // half of the flock climbs fast and streams out of the window, the rest climbs about as fast as the camera does
    if (p) { iA[i * 4] = p[0]; iA[i * 4 + 1] = p[1]; iA[i * 4 + 2] = p[2]; iA[i * 4 + 3] = 0.674 + 0.074 * (p[4] / (RINGS - 1)) + rng.range(-0.003, 0.006) + (rng() < 0.08 ? rng.range(0, 0.2) : 0); iB[i * 4 + 3] = 0; }
    else { const f = flyers[i - perches.length]; iA[i * 4 + 1] = f[0]; iA[i * 4 + 3] = -1; iB[i * 4 + 3] = f[2] || 1; }
    iB[i * 4] = rng(); iB[i * 4 + 1] = p ? rng.range(4.5, 9.5) : flyers[i - perches.length][1]; iB[i * 4 + 2] = rng() < 0.55 ? rng.range(13, 22) : rng.range(4.5, 8.5);
    iC[i] = rng() < slate ? 1 : 0;
    if (!p && iB[i * 4 + 3] > 1.5) { iB[i * 4 + 2] = rng.range(5.3, 8.6); iD[i] = rng.range(0, 52); }
    if (p) { const DUR = opts.duration || 40, jit = (rng() - 0.5) * 1.1, th0 = (p[1] + 2.5 - FLOOR) / 6 + iA[i * 4 + 3] * DUR * 0.3 + jit, d0 = th0 - p[3], w0 = Math.abs(d0 - Math.PI * 2 * Math.round(d0 / (Math.PI * 2))); iD[i] = jit + (w0 > Math.PI / 2 ? Math.PI : 0); }
  }
  if (ctx.yield) await ctx.yield();
  const bg0 = birdGeometry(), bg = new THREE.InstancedBufferGeometry(); bg.index = bg0.index; for (const k in bg0.attributes) bg.setAttribute(k, bg0.attributes[k]);
  bg.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); bg.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); bg.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 1)); bg.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 1)); bg.instanceCount = count;
  const BU = { uTime: U.uTime, uU: { value: 0 }, uDur: { value: opts.duration || 40 }, uPortal: { value: PORTAL_POS.clone() }, uPDir: { value: PORTAL_DIR.clone() }, uPRight: { value: P_RIGHT.clone() }, uPUp: { value: P_UP.clone() },
    uGlareCol: U.uGlareCol, uFillCol: U.uFillCol, uTopCol: U.uTopCol, uFogCol: U.uFogCol, uSunCol: U.uSunCol, uSun: U.uSun, uFogDen: U.uFogDen, uDark: { value: opts.dark || 0 }, uBounce: { value: new THREE.Vector3(...(opts.bounce || [0, 0, 0])) }, uGain: { value: 0.82 }, uPart: { value: 1 }, uSky: U.uSky, uCount: U.uCount, uWinC: U.uWinC, uWinN: U.uWinN, uWinR: U.uWinR };
  const birds = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: BU, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide }));
  birds.frustumCulled = false; birds.name = 'pigeons'; object.add(birds); triangles += count * (bg0.index.count / 3);
  // the sky in the open top and the column of light under it
  const sk = opts.sky || {}, SU = { uTime: U.uTime, uZen: { value: new THREE.Color(...(sk.zen || [0.5, 0.62, 0.85])) }, uHor: { value: new THREE.Color(...(sk.hor || [1.0, 1.08, 1.2])) }, uCloud: { value: sk.cloud ?? 0.6 }, uFlakes: { value: sk.flakes ?? 0 }, uStars: { value: sk.stars ?? 0 } };
  const skyDisc = new THREE.Mesh(new THREE.CircleGeometry(shaftR(TOP) + 1.5, 40).rotateX(Math.PI / 2).translate(0, TOP + 8.6, 0), new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG })); skyDisc.name = 'sky'; object.add(skyDisc);
  const CU = { uTime: U.uTime, uCol: { value: new THREE.Color(...(opts.column || [0.05, 0.065, 0.09])) }, uFlakes: { value: sk.flakes ?? 0 } };
  const column = new THREE.Mesh(new THREE.CylinderGeometry(shaftR(TOP) - 3.2, 12.6, TOP + 8 - FLOOR, 40, 6, true).translate(0, (TOP + 8 + FLOOR) / 2, 0), new THREE.ShaderMaterial({ uniforms: CU, vertexShader: COL_VERT, fragmentShader: COL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  column.name = 'column'; column.renderOrder = 2; object.add(column);
  if (own) { rock.setWindows(holes); U.uFogDen.value = 0.002; }
  return {
    object, radius: SHAFT_R + 4, height: TOP + 8, center: new THREE.Vector3(0, 140, 0), ground: false, groundY: FLOOR,
    anchors: { portal: PORTAL_POS.clone(), portalDir: PORTAL_DIR.clone(), floorY: FLOOR, shaftRadius: SHAFT_R, wellRadius: WELL_R, axis: new THREE.Vector3(0, 0, 0) },
    rock, holes, perches, wellPerch, birds, birdUniforms: BU, triangles, drawCalls: 5,
    update(dt, time, camera, u) { U.uTime.value = time; BU.uU.value = u === undefined ? 0.62 + ((time % 18) / 18) * 0.36 : u; },
    dispose() {},
  };
}
