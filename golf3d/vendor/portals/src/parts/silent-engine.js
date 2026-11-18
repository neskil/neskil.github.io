// THE SILENT ENGINE: hero set piece
// ---------------------------------------------------------------------------------------------
// Five concentric dark-brass rings wheeling around a captive miniature star.
//
// What this module builds (self-contained: only 'three' and '../kit/core.js'):
//   rings   0  1000 m  flat band: wide hoop, recessed glyph strips on both faces, crenellated rims, ribs
//           1   800 m  lattice: triangular truss of three rails, Warren bracing, a central glyph ribbon
//           2   620 m  toothed: gear hoop with big outward teeth, small inward teeth, glyph side strips
//           3   440 m  twin-rail: two glyph-lined rails, sleepers, lit bogies            (tumbles)
//           4   300 m  segmented: chunky arc blocks on a conduit, four beam emitters      (tumbles)
//           Rings 0-2 keep FIXED planes 20 / 35 / 50 degrees off the approach line (the local Z axis)
//           and only spin in-plane, so their swept volume is static. Rings 3-4 are nested gimbals
//           (armillary): 3 turns about a fixed diameter, 4 about a diameter carried by 3.
//   star    40 m sphere, convection + spots at HDR 5-9, corona billboard with slow streamers,
//           billboarded prominence loops, four flickering tether beams to the innermost ring,
//           and a thin gold line rising 4 km into space.
//   dust    ~4200 additive motes orbiting the star + a gold dust veil disc below it. Both, and the
//           rings themselves, receive the analytic shadows of the rings, so dark blades sweep the
//           veil and the outer rings as the inner rings tumble.
//   debris  two slow belts of pale ash rock fragments.
//
// Size: radius 520, height 2 * starHeight (default 840). Origin at the base centre, +Y up, front
// toward +Z: the star sits at (0, starHeight, 0); the camera approaches from +Z flying toward -Z.
// It hangs in the air over a pit: ground = false.
//
// opts
//   palette     [void, shadow, steel, ash, brass, starGold, glyphCyan] hex strings (brief default)
//   starHeight  420   height of the star centre above the origin
//   veil        true  the gold dust veil disc (set false if your own ground fog replaces it)
//   veilDrop    250   how far below the star the veil lies
//   skyBeam     true  the vertical gold line into space
//   progress    1     initial setProgress value
//
// anchors (hero-local space)
//   star         { position, radius 20 }
//   portalSeat   { position (0, starHeight, 280), facing (0,0,1), radius 7 }: 280 m short of the star
//                on the approach axis, outside the 230 m reach of the tumbling rings, so the star
//                and inner rings frame the portal.
//   flyThrough   ordered points: level run in from +Z, passing ~40 m under the near rim of ring 0,
//                easing down onto the star axis, last 60 m straight to the portal seat. Every point
//                is checked at build against the static ring volumes (>= 30 m clear).
//   rimPass      the point of that close pass; rimPoint is the ring-0 rim point above it.
//   approachDir  (0,0,-1)
//   innerReach   230: nothing tumbling ever leaves this sphere around the star.
//   rings        [{ radius, halfWidth, normal, spin, fixed }] local-space planes of the five rings
//                (normal is live for the two tumbling ones).
//   clearance(p) function: distance in metres from local point p to the nearest solid swept volume
//                (three static tori, the inner reach sphere). Use it to validate your path.
//   keyLight     { position, color, intensity }: where to put the world's one PointLight.
//   viewpoints   { reveal, rimPass, axis, above } each { position, target }.
// hooks
//   update(dt, time, camera)   every frame. Never caches the camera.
//   setProgress(u)             0..1. Glyph strips ignite ring by ring from the outside in as u goes
//                              0.15 -> 0.85, and the tethers and corona swell slightly. Default 1.
//   uniforms                   shared uniform table. uniforms.uStar (world position) and
//                              uniforms.uRingN / uRingW feed shadowGLSL.
//   shadowGLSL                 GLSL source of `float engineShadow(vec3 worldPos, float idx)` (idx -1
//                              = shadowed by all five rings) for your pit wall / floor shaders;
//                              bind uniforms.uStar, uRingN, uRingW to it.
//
// Lighting it expects: an airless black sky and NO scene light on the piece. All ring, debris and
// dust shading is computed in its own shaders from the star (fierce white-gold point source at the
// centre, cold blue starlight fill), so it looks the same under any world lights. Bloom threshold
// about 0.9: the star, corona, tethers, prominences, glyph lines and emitter lamps exceed 1.
// Fog: every material honours scene fog (additive ones fade out rather than toward fog colour).
// Every fragment shader ends with a NaN/inf guard: one bad pixel would black out the whole bloom chain.
//
// Cost: about 86k triangles, 14 draw calls (13 without the veil), ~350 ms build, no real-time lights,
// no textures or render targets.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#020206', '#1b1c2a', '#5d5a66', '#d9d2c4', '#b08a4a', '#ffd27a', '#7af0ff'];
const TAU = Math.PI * 2;
const RADII = [500, 400, 310, 220, 150];
const TILT_DEG = [20, 35, 50];

// ---------- geometry writer: flat-shaded quads with colour, uv (metres) and a material mask ----------
// mask m: 0 metal, 1 glyph strip (uv.x in glyph cells, uv.y 0..1 across), 2 warm lamp, 3 stone
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.m = []; this.ix = []; this.nv = 0; }
  quad(a, b, c, d, hint, col, m = 0, uvs = null) {
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    let vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    let l = Math.hypot(nx, ny, nz);
    if (l < 1e-7) { // degenerate corner: use the other diagonal pair
      ux = c[0] - b[0]; uy = c[1] - b[1]; uz = c[2] - b[2]; vx = d[0] - b[0]; vy = d[1] - b[1]; vz = d[2] - b[2];
      nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx; l = Math.hypot(nx, ny, nz) || 1;
    }
    nx /= l; ny /= l; nz /= l;
    const flip = nx * hint[0] + ny * hint[1] + nz * hint[2] < 0;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const v = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
      this.p.push(v[i][0], v[i][1], v[i][2]); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.m.push(m);
      if (uvs) this.uv.push(uvs[i][0], uvs[i][1]); else this.uv.push(v[i][0] + v[i][2] * 0.37, v[i][1] + v[i][2] * 0.61);
    }
    const o = this.nv; this.nv += 4;
    if (flip) this.ix.push(o, o + 2, o + 1, o, o + 3, o + 2); else this.ix.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(this.m, 1));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.ix, 1) : new THREE.Uint16BufferAttribute(this.ix, 1));
    return g;
  }
  get tris() { return this.ix.length / 3; }
}

// ring-local frame: the ring lies in the XZ plane, r = radius from the axis, a = axial (Y), t = tangential offset
const ringPt = (th, r, a, t = 0) => { const c = Math.cos(th), s = Math.sin(th); return [r * c - t * s, a, r * s + t * c]; };
const tint = (col, k) => [col[0] * k, col[1] * k, col[2] * k];
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Sweep a closed CCW profile (points {r, a, m, k, g}: radial offset, axial offset; the edge that STARTS at
// a point carries mask m, colour multiplier k) around radius R from angle t0 to t1 in N steps.
function sweep(G, R, prof, N, o = {}) {
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? TAU, col = o.col, jit = o.jit ?? (() => 1);
  const M = prof.length, cum = [0];
  for (let j = 0; j < M; j++) { const p = prof[j], q = prof[(j + 1) % M]; cum.push(cum[j] + Math.hypot(q.r - p.r, q.a - p.a)); }
  for (let i = 0; i < N; i++) {
    const ta = t0 + (t1 - t0) * (i / N), tb = t0 + (t1 - t0) * ((i + 1) / N), tm = (ta + tb) / 2;
    const kj = jit(i);
    for (let j = 0; j < M; j++) {
      const p = prof[j], q = prof[(j + 1) % M];
      const er = q.r - p.r, ea = q.a - p.a, el = Math.hypot(er, ea) || 1;
      const nr = ea / el, na = -er / el; // outward normal of a CCW profile edge
      const hint = [nr * Math.cos(tm), na, nr * Math.sin(tm)];
      const A = ringPt(ta, R + p.r, p.a), B = ringPt(tb, R + p.r, p.a), C = ringPt(tb, R + q.r, q.a), D = ringPt(ta, R + q.r, q.a);
      let uvs;
      if (p.m === 1) { const cw = el * 0.5, ph = (o.phase ?? 0) + j * 13.7; uvs = [[ta * R / cw + ph, 0], [tb * R / cw + ph, 0], [tb * R / cw + ph, 1], [ta * R / cw + ph, 1]]; }
      else uvs = [[ta * R, cum[j]], [tb * R, cum[j]], [tb * R, cum[j + 1]], [ta * R, cum[j + 1]]];
      G.quad(A, B, C, D, hint, tint(col, (p.k ?? 1) * kj), p.m ?? 0, uvs);
    }
  }
  if (o.cap) { // flat end caps for arcs (profile must be star-shaped about its centroid)
    let cr = 0, ca = 0; for (const p of prof) { cr += p.r / M; ca += p.a / M; }
    for (const [th, sgn] of [[t0, -1], [t1, 1]]) {
      const hint = [-Math.sin(th) * sgn, 0, Math.cos(th) * sgn], cc = ringPt(th, R + cr, ca);
      for (let j = 0; j < M; j++) {
        const p = prof[j], q = prof[(j + 1) % M];
        G.quad(cc, ringPt(th, R + p.r, p.a), ringPt(th, R + q.r, q.a), cc, hint, tint(col, o.capK ?? 0.8), o.capM ?? 0);
      }
    }
  }
}

// Loft rectangular stations through an arbitrary frame f(u, v, w) -> [x,y,z]. stations: [{u, hv, hw, v0?, w0?}]
// (u = distance along the block's axis, hv / hw half sizes). Caps both ends. Convex blocks only.
function block(G, f, st, col, o = {}) {
  const loops = st.map((s) => { const v0 = s.v0 ?? 0, w0 = s.w0 ?? 0; return [f(s.u, v0 - s.hv, w0 - s.hw), f(s.u, v0 + s.hv, w0 - s.hw), f(s.u, v0 + s.hv, w0 + s.hw), f(s.u, v0 - s.hv, w0 + s.hw)]; });
  const mid = st[Math.floor(st.length / 2)], first = st[0], last = st[st.length - 1];
  const ctr = f((first.u + last.u) / 2, mid.v0 ?? 0, mid.w0 ?? 0);
  const sub = (p) => [p[0] - ctr[0], p[1] - ctr[1], p[2] - ctr[2]];
  const avg = (a, b, c, d) => [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4];
  const sideM = o.sideM ?? [0, 0, 0, 0];
  for (let i = 0; i < loops.length - 1; i++) for (let j = 0; j < 4; j++) {
    const a = loops[i][j], b = loops[i + 1][j], c = loops[i + 1][(j + 1) % 4], d = loops[i][(j + 1) % 4];
    const m = (o.bandM && i === o.bandAt) ? o.bandM : sideM[j];
    G.quad(a, b, c, d, sub(avg(a, b, c, d)), tint(col, (o.k ?? 1) * (j & 1 ? 0.92 : 1.06)), m);
  }
  if (!o.noCapA) { const L = loops[0]; G.quad(L[0], L[1], L[2], L[3], sub(avg(L[0], L[1], L[2], L[3])), tint(col, 0.85), o.capAM ?? 0); }
  if (!o.noCapB) { const L = loops[loops.length - 1]; G.quad(L[0], L[1], L[2], L[3], sub(avg(L[0], L[1], L[2], L[3])), tint(col, 1.0), o.capBM ?? 0); }
}

// Square strut between two points (ends left open: they are buried in nodes), swelling slightly at the middle.
function strut(G, A, B, w, col, m = 0) {
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
  let s = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let e1 = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]]; const l1 = Math.hypot(e1[0], e1[1], e1[2]); e1 = e1.map((x) => x / l1);
  const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
  const f = (u, v, ww) => [A[0] + d[0] * u + e1[0] * v + e2[0] * ww, A[1] + d[1] * u + e1[1] * v + e2[1] * ww, A[2] + d[2] * u + e1[2] * v + e2[2] * ww];
  block(G, f, [{ u: 0, hv: w, hw: w }, { u: L * 0.5, hv: w * 0.72, hw: w * 0.72 }, { u: L, hv: w, hw: w }], col, { noCapA: true, noCapB: true, sideM: [m, m, m, m] });
}

// ---------- GLSL ----------
const NOISE = /* glsl */`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm3(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn3(p); p=p*2.03+vec3(7.1,3.3,5.7); a*=.5; } return s; }
`;
// Analytic ring shadows. A thin ring around a point light shadows exactly the directions that lie close to
// its own plane, beyond its radius. uRingW[k] = (sin of half angular width, opacity, radius).
export const SHADOW_GLSL = /* glsl */`
uniform vec3 uStar; uniform vec3 uRingN[5]; uniform vec3 uRingW[5];
float engineShadow(vec3 wp, float idx){
  vec3 d=wp-uStar; float dist=length(d); d/=max(dist,1e-3); float s=1.;
  for(int k=0;k<5;k++){
    if(float(k)>idx+.5){
      float a=abs(dot(d,uRingN[k]));
      s*=1.-uRingW[k].y*(1.-smoothstep(uRingW[k].x,uRingW[k].x*1.7+.006,a))*step(uRingW[k].z,dist);
    }
  }
  return s;
}
`;
const FOG_FADE = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF=1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float fogF=smoothstep(fogNear,fogFar,vFogDepth);
  #endif
  gl_FragColor.rgb*=1.-fogF;
#endif
`;

const RING_VS = /* glsl */`
attribute vec3 aCol; attribute float aM;
varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying float vM;
#include <fog_pars_vertex>
void main(){
  vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vN=normalize(mat3(modelMatrix)*normal);
  vCol=aCol; vUv=uv; vM=aM;
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RING_FS = /* glsl */`
varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying float vM;
uniform vec3 uStarCol; uniform vec3 uKey; uniform vec3 uFill; uniform vec3 uGlyph; uniform vec3 uBeam[4];
uniform float uTime; uniform float uIdx; uniform float uProgress; uniform float uStarI;
#include <fog_pars_fragment>
${NOISE}
${SHADOW_GLSL}
float glyph(vec2 uv){
  float c=floor(uv.x); vec2 g=vec2(fract(uv.x),uv.y); float id=h21(vec2(c,17.));
  if(id<.16) return 0.;
  g=(g-.5)*vec2(1.3,1.45)+.5; if(g.x<0.||g.x>1.||g.y<0.||g.y>1.) return 0.;
  vec2 q=floor(g*vec2(3.,5.)), qf=fract(g*vec2(3.,5.));
  float on=step(.42,h21(q+vec2(c*7.31,3.)));
  float bar=step(.14,qf.x)*step(qf.x,.86)*step(.16,qf.y)*step(qf.y,.84);
  float joinH=step(.5,h21(q+vec2(c*3.7,9.)))*step(.3,qf.y)*step(qf.y,.7);
  float spine=step(abs(g.x-.5),.07)*step(.45,id);
  return max(on*max(bar,joinH),spine);
}
void main(){
  vec3 N=normalize(vN); vec3 toS=uStar-vWp; float ds=length(toS); vec3 L=toS/ds; vec3 V=normalize(cameraPosition-vWp);
  float sh=engineShadow(vWp,uIdx);
  float ndl=dot(N,L), ndv=max(dot(N,V),0.);
  vec3 alb=vCol; float rough=.45; vec3 emi=vec3(0.); float metal=1.; float det=1.;
  float gn=fbm3(vWp*.045+uIdx*7.);
  if(vM<.5){
    vec2 sc=vec2(11.,3.4); vec2 pu=vUv/sc; pu.x+=.5*step(.5,fract(floor(pu.y)*.5));
    vec2 cell=floor(pu), f=fract(pu);
    float e=min(min(f.x,1.-f.x)*sc.x,min(f.y,1.-f.y)*sc.y);
    float farK=smoothstep(.12,.7,fwidth(pu.y));
    float seam=mix(smoothstep(.0,.2,e),.88,farK);
    float tn=mix(h21(cell+uIdx*3.1),.5,farK*.7);
    det=(.7+.55*tn)*mix(.4,1.,seam);
    alb*=det;
    alb=mix(alb,alb*vec3(.6,.74,.64)+vec3(.0,.008,.006),smoothstep(.62,.84,gn)*.4);
    rough=mix(.26,.6,gn)+.16*step(.78,tn);
  } else if(vM<1.5){
    float fw=fwidth(vUv.x);
    float g=mix(glyph(vUv),.34,smoothstep(.3,1.1,fw));
    float line=step(.42,abs(vUv.y-.5))*step(abs(vUv.y-.5),.47);
    vec3 d=-L; float bm=0.;
    for(int k=0;k<4;k++) bm=max(bm,smoothstep(.9,.995,dot(d,uBeam[k])));
    float pulse=pow(clamp(.5+.5*sin(vUv.x*.19-uTime*1.15+uIdx*2.1),0.,1.),8.);
    float thr=.15+uIdx*.14; float ign=smoothstep(thr,thr+.14,uProgress);
    ign*=mix(.55+.45*step(.5,fract(uTime*9.+h21(vec2(floor(vUv.x),2.)))),1.,smoothstep(.6,1.,ign));
    emi=uGlyph*(g*min(1.1+2.2*pulse+4.4*bm,3.2)+line*.55)*ign*mix(.62,1.,smoothstep(.5,2.5,uIdx));
    alb*=.3; rough=.75; det=.5;
  } else if(vM<2.5){
    float lv=mix(.3+.7*smoothstep(.2,.45,abs(fract(vUv.y*.45)-.5)),.72,smoothstep(.2,.9,fwidth(vUv.y*.45)));
    emi=uStarCol*(3.+.8*sin(uTime*2.3+vWp.x*.07+vWp.z*.05))*lv*smoothstep(.1,.4,uProgress+.3); alb*=.25; det=.5;
  } else {
    metal=0.; det=.7+.6*gn; alb*=det; rough=.95;
  }
  float fr=pow(clamp(1.-ndv,0.,1.),4.);
  float lit=max(ndl,0.)*sh;
  vec3 H=normalize(L+V);
  float sp=pow(max(dot(N,H),0.),mix(120.,14.,rough))*mix(2.4,.3,rough)*step(0.,ndl)*sh*metal;
  vec3 key=uKey*uStarI;
  vec3 col=alb*key*lit*mix(.95,.6,metal);
  col+=mix(alb,vec3(.6),.35)*key*sp;
  col+=mix(alb,vec3(.5),.4)*key*fr*smoothstep(-.3,.3,ndl)*sh*.3;          // gold edge light near the terminator
  col+=uFill*det*(.75+.45*N.y)+uFill*fr*1.2*metal;                         // cold starlight fill: blue-black shadow side
  col+=alb*uStarCol*.03*(1.-max(ndl,0.));                                  // faint warm bounce from the other rings
  col+=emi;
  gl_FragColor=vec4(col,1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
  #include <fog_fragment>
}`;

const STAR_VS = /* glsl */`
varying vec3 vP; varying vec3 vWp; varying vec3 vNw;
#include <fog_pars_vertex>
void main(){
  vP=position; vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vNw=normalize(mat3(modelMatrix)*normal);
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STAR_FS = /* glsl */`
varying vec3 vP; varying vec3 vWp; varying vec3 vNw;
uniform vec3 uStarCol; uniform float uTime; uniform float uGain;
#include <fog_pars_fragment>
${NOISE}
void main(){
  vec3 p=normalize(vP); float t=uTime;
  vec3 q=p*4.5;
  vec3 w=vec3(fbm3(q+t*.06),fbm3(q+11.3-t*.05),fbm3(q+23.7+t*.045));
  float g=fbm3(p*8.+w*2.4+t*.03);
  float cells=fbm3(p*24.+w*3.2+vec3(t*.11));
  float v=g*.62+cells*.48;
  float spot=smoothstep(.37,.25,fbm3(p*2.4+31.+t*.008));
  float mu=max(dot(normalize(vNw),normalize(cameraPosition-vWp)),0.);
  float limb=.42+.58*pow(clamp(mu,0.,1.),.6);
  vec3 hot=vec3(1.,.96,.84), cool=vec3(1.,.36,.07);
  vec3 c=mix(cool,uStarCol,smoothstep(.3,.5,v)); c=mix(c,hot,smoothstep(.5,.68,v));
  c*=mix(.75,4.6,smoothstep(.38,.7,v))*limb;
  c=mix(c,cool*.55,spot*.8);
  c+=cool*1.4*pow(clamp(1.-mu,0.,1.),3.);
  gl_FragColor=vec4(c*uGain,1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
  ${FOG_FADE.replace('1.-fogF', '1.-fogF*.5')}
}`;

const CORONA_VS = /* glsl */`
uniform float uSize; varying vec2 vQ; varying float vBoost;
#include <fog_pars_vertex>
void main(){
  vQ=position.xy; vec4 mvPosition=modelViewMatrix*vec4(0.,0.,0.,1.); vBoost=clamp(-mvPosition.z/420.,1.,2.4); mvPosition.xy+=position.xy*uSize;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CORONA_FS = /* glsl */`
varying vec2 vQ; varying float vBoost; uniform vec3 uStarCol; uniform float uTime; uniform float uSize; uniform float uR; uniform float uGain;
#include <fog_pars_fragment>
${NOISE}
void main(){
  float r=length(vQ)*uSize/uR; float t=uTime;
  vec2 dir=normalize(vQ+vec2(1e-5,0.));
  float rr=max(r,1.);
  float glow=.42/(rr*rr)+.8*exp(-(rr-1.)*4.);
  float s=fbm3(vec3(dir*2.6,rr*.5-t*.12));
  float rays=s*s*exp(-(rr-1.)*.5)*.8;
  float n=vn3(vec3(dir*7.,t*.04+3.));
  float spikes=pow(clamp(n,0.,1.),5.)*exp(-(rr-1.)*.16)*1.3;
  float inner=smoothstep(.75,1.,r);
  float edge=smoothstep(1.,.5,length(vQ));
  vec3 c=mix(uStarCol,vec3(1.,.93,.8),exp(-(rr-1.)*1.2))*(glow+rays+spikes)*inner*edge*edge*uGain*vBoost;
  gl_FragColor=vec4(c,1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
  ${FOG_FADE.replace('1.-fogF', '1.-fogF*.6')}
}`;

// View-aligned ribbons: tether beams (kind 0), the sky line (1) and prominence loops (2).
const RIBBON_VS = /* glsl */`
attribute vec3 aTan; attribute vec3 aSide; attribute float aW;
uniform float uViewH; uniform float uMinPx;
varying vec3 vS;
#include <fog_pars_vertex>
void main(){
  vS=aSide; vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  vec3 tv=normalize((modelViewMatrix*vec4(aTan,0.)).xyz);
  vec3 sd=cross(tv,normalize(mvPosition.xyz)); sd/=max(length(sd),1e-4);
  float w=max(aW,-mvPosition.z*uMinPx*2./(projectionMatrix[1][1]*uViewH));
  mvPosition.xyz+=sd*aSide.x*w;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIBBON_FS = /* glsl */`
varying vec3 vS; uniform vec3 uStarCol; uniform float uTime; uniform float uKind; uniform float uGain;
#include <fog_pars_fragment>
${NOISE}
void main(){
  float s=vS.x, u=vS.y, sd=vS.z, t=uTime; vec3 c;
  if(uKind<.5){
    float core=exp(-s*s*5.)+.1*exp(-s*s*1.5);
    float pk=pow(clamp(.5+.5*sin(u*20.-t*5.5+sd*3.),0.,1.),8.);
    float fl=.72+.4*vn3(vec3(t*6.,sd*9.,u*5.-t*2.));
    c=mix(uStarCol,vec3(1.,.95,.85),exp(-s*s*14.))*core*(4.6*fl+4.*pk)*smoothstep(1.,.985,u);
  } else if(uKind<1.5){
    float core=exp(-s*s*4.);
    c=mix(uStarCol,vec3(1.,.92,.75),.4)*core*1.5*pow(clamp(1.-u,0.,1.),1.3)*smoothstep(0.,.006,u)*(.85+.15*sin(u*260.-t*2.5));
  } else {
    float fil=fbm3(vec3(u*5.-t*.3+sd*10.,s*1.8,sd*5.+t*.08));
    float shape=pow(clamp(1.-s*s,0.,1.),2.)*smoothstep(0.,.1,u)*smoothstep(1.,.9,u);
    c=mix(vec3(1.,.3,.06),uStarCol,fil)*shape*pow(clamp(fil,0.,1.),1.6)*9.;
  }
  gl_FragColor=vec4(c*uGain,1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
  ${FOG_FADE}
}`;

const DUST_VS = /* glsl */`
attribute vec4 aD; uniform float uTime; uniform float uViewH; uniform vec3 uStarCol;
varying vec3 vC;
#include <fog_pars_vertex>
${SHADOW_GLSL}
void main(){
  float a=aD.x*uTime; float c=cos(a), s=sin(a);
  vec3 p=vec3(position.x*c-position.z*s, position.y+sin(uTime*.2+aD.z)*3., position.x*s+position.z*c);
  vec4 wp=modelMatrix*vec4(p,1.);
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  float sh=engineShadow(wp.xyz,-1.);
  float dist=length(wp.xyz-uStar);
  float px=aD.y*projectionMatrix[1][1]*uViewH*.5/max(-mvPosition.z,1.);
  float tw=.6+.4*sin(uTime*(1.+aD.z)+aD.z*40.);
  float b=aD.w*sh*clamp(170./dist,.25,2.2)*tw*min(px,1.);
  gl_PointSize=clamp(px,1.,5.);
  vC=mix(uStarCol,vec3(1.,.9,.72),.3)*b;
  #include <fog_vertex>
}`;
const DUST_FS = /* glsl */`
varying vec3 vC;
#include <fog_pars_fragment>
void main(){
  float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.12,d);
  gl_FragColor=vec4(vC*a,1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
  ${FOG_FADE}
}`;

const VEIL_VS = /* glsl */`
varying vec3 vWp; varying vec3 vL;
#include <fog_pars_vertex>
void main(){
  vL=position; vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz;
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const VEIL_FS = /* glsl */`
varying vec3 vWp; varying vec3 vL; uniform vec3 uStarCol; uniform float uTime; uniform float uVeilR; uniform float uGain;
#include <fog_pars_fragment>
${NOISE}
${SHADOW_GLSL}
void main(){
  float rr=length(vL.xz)/uVeilR; float t=uTime;
  float sh=engineShadow(vWp,-1.);
  float ang=atan(vL.z,vL.x)+t*.012+rr*1.4;
  vec2 sw=vec2(cos(ang),sin(ang))*rr;
  float n=fbm3(vec3(sw*5.,t*.03));
  float n2=fbm3(vec3(sw*17.+4.,t*.05));
  float body=smoothstep(.02,.3,rr)*pow(max(1.-rr,0.),1.4);
  float pool=exp(-rr*rr*26.)*.55;
  float vd=abs(normalize(cameraPosition-vWp).y); float edge=smoothstep(.01,.16,vd);
  vec3 c=uStarCol*vec3(1.,.82,.55)*((.09+.5*n*n+.2*n2*n)*body+pool)*mix(.12,1.,sh)*edge*uGain;
  gl_FragColor=vec4(c,1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
  ${FOG_FADE}
}`;

// ---------- ring builders (ring-local: plane XZ, axis Y) ----------
const P = (r, a, m = 0, k = 1) => ({ r, a, m, k });
const hexProf = (r0, a0, rr, k = 1, n = 6) => { const o = []; for (let j = 0; j < n; j++) { const t = (j / n) * TAU + 0.26; o.push(P(r0 + rr * Math.cos(t), a0 + rr * Math.sin(t), 0, 0.82 + 0.3 * ((j * 7) % n) / n * k)); } return o; };
// colour jitter in runs of a few segments so plates read as plates
function panelJitter(rng, N, lo = 0.8, hi = 1.18) {
  const a = new Float32Array(N); let i = 0;
  while (i < N) { const run = rng.int(2, 6), v = rng.range(lo, hi); for (let j = 0; j < run && i < N; j++) a[i++] = v; }
  return (i2) => a[i2 % N];
}

// 0: flat band, 1000 m
function buildBand(G, R, rng, C) {
  const N = 320, col = mixc(C.brass, C.steel, 0.12);
  const prof = [P(-5, -21), P(-2, -24, 0, 0.8), P(3, -24), P(5, -22, 0, 1.1), P(5, -9, 0, 0.7), P(3.6, -8, 1), P(3.6, 8, 0, 0.7), P(5, 9, 0, 1.1),
    P(5, 22), P(3, 24, 0, 0.8), P(-2, 24), P(-5, 21, 0, 1.1), P(-5, 9, 0, 0.7), P(-3.8, 8, 1), P(-3.8, -8, 0, 0.7), P(-5, -9, 0, 1.1)];
  sweep(G, R, prof, N, { col, jit: panelJitter(rng, N), phase: rng.range(0, 99) });
  // crenellated rims: inward teeth (lit, the camera passes under these) and low outer merlons
  const nt = rng.int(40, 54) * 4, pitch = TAU * R / nt;
  for (let k = 0; k < nt; k++) {
    const th = (k + 0.5) / nt * TAU, tall = k % 4 === 0 ? 1.5 : 1;
    for (const sg of [-1, 1]) {
      block(G, (u, v, w) => ringPt(th, R - 5 - u, sg * 18.6 + v, w), [{ u: -0.5, hv: 3.6, hw: pitch * 0.33 }, { u: 5 * tall, hv: 3.0, hw: pitch * 0.27 }, { u: 7.5 * tall, hv: 1.8, hw: pitch * 0.15 }], tint(col, rng.range(0.8, 1.15)), { noCapA: true });
      if (k % 2 === 0) block(G, (u, v, w) => ringPt(th, R + 5 + u, sg * 19.6 + v, w), [{ u: -0.5, hv: 2.6, hw: pitch * 0.42 }, { u: 3.2, hv: 2.0, hw: pitch * 0.34 }], tint(C.steel, rng.range(0.7, 1.0)), { noCapA: true });
    }
  }
  // ribs across the band and lamp housings on the outer face
  const nr = rng.int(13, 18) * 4;
  for (let k = 0; k < nr; k++) {
    const th = k / nr * TAU;
    if (k % 4 === 0) {
      block(G, (u, v, w) => ringPt(th, R + 4 + u, v, w), [{ u: 0, hv: 13, hw: 8 }, { u: 5, hv: 12, hw: 7 }, { u: 8.5, hv: 9, hw: 5 }, { u: 9.4, hv: 5, hw: 1.6 }], tint(C.steel, 0.9), { noCapA: true, capBM: 2 });
      block(G, (u, v, w) => ringPt(th, R - 4 - u, v, w), [{ u: 0, hv: 12, hw: 6 }, { u: 4.5, hv: 9, hw: 4 }], tint(C.steel, 1.0), { noCapA: true });
    } else {
      block(G, (u, v, w) => ringPt(th, R + 4.6 + u, v, w), [{ u: 0, hv: 22.5, hw: 1.5 }, { u: 2.4, hv: 21.5, hw: 0.9 }], tint(col, 0.75), { noCapA: true });
    }
  }
}

// 1: lattice, 800 m: triangular truss
function buildLattice(G, R, rng, C) {
  const col = mixc(C.brass, C.steel, 0.3), N = 240;
  const rails = [[1, -20], [1, 20], [-30, 0]];
  for (const [r0, a0] of rails) sweep(G, R, hexProf(r0, a0, 2.5), N, { col, jit: panelJitter(rng, N, 0.85, 1.12) });
  // central glyph ribbon
  sweep(G, R, [P(0.4, -5.5, 0, 0.7), P(2.2, -5.5, 1), P(2.2, 5.5, 0, 0.7), P(0.4, 5.5, 1)], N, { col: tint(col, 0.8), phase: rng.range(0, 99) });
  const nb = rng.int(34, 44) * 2, dcol = tint(mixc(C.brass, C.steel, 0.5), 0.9);
  const node = (k, j) => ringPt((k / nb) * TAU, R + rails[j][0], rails[j][1]);
  for (let k = 0; k < nb; k++) {
    const e = k % 2;
    strut(G, node(k, e), node(k + 1, 1 - e), 0.95, dcol);                 // outer face zigzag
    strut(G, node(k, e ? 0 : 2), node(k + 1, e ? 2 : 0), 0.85, dcol);     // lower face
    strut(G, node(k, e ? 2 : 1), node(k + 1, e ? 1 : 2), 0.85, dcol);     // upper face
    strut(G, node(k, 0), node(k, 1), 1.1, tint(col, 0.9));                // frame
    strut(G, node(k, 0), node(k, 2), 0.9, tint(col, 0.8));
    strut(G, node(k, 1), node(k, 2), 0.9, tint(col, 0.8));
    if (k % 6 === 0) { // lamp collars on the apex rail and gusset boxes on the outer rails
      const th = (k / nb) * TAU;
      block(G, (u, v, w) => ringPt(th, R - 30 - u, v, w), [{ u: -3.4, hv: 3.6, hw: 4.6 }, { u: 3.4, hv: 3.6, hw: 4.6 }, { u: 6, hv: 2, hw: 2.4 }], tint(C.steel, 0.9), { capBM: 2 });
      for (const a0 of [-20, 20]) block(G, (u, v, w) => ringPt(th, R + 1 + u, a0 + v, w), [{ u: -3.6, hv: 3.6, hw: 5 }, { u: 3.6, hv: 3.6, hw: 5 }], tint(C.steel, 0.8));
    }
  }
}

// 2: toothed, 620 m
function buildGear(G, R, rng, C) {
  const col = mixc(C.brass, C.steel, 0.05), N = 264;
  const prof = [P(-9, -6), P(-7, -8, 0, 0.9), P(-4, -8, 0, 0.7), P(-3, -6.8, 1), P(3, -6.8, 0, 0.7), P(4, -8, 0, 0.9), P(7, -8), P(9, -6, 0, 1.1),
    P(9, 6), P(7, 8, 0, 0.9), P(4, 8, 0, 0.7), P(3, 6.8, 1), P(-3, 6.8, 0, 0.7), P(-4, 8, 0, 0.9), P(-7, 8), P(-9, 6, 0, 1.1)];
  sweep(G, R, prof, N, { col, jit: panelJitter(rng, N), phase: rng.range(0, 99) });
  const nt = rng.int(26, 36) * 2, pitch = TAU * R / nt;
  for (let k = 0; k < nt; k++) {
    const th = (k / nt) * TAU, tc = tint(col, rng.range(0.82, 1.15));
    block(G, (u, v, w) => ringPt(th, R + 8.5 + u, v, w), [{ u: -0.5, hv: 6.4, hw: pitch * 0.31 }, { u: 7, hv: 5.8, hw: pitch * 0.26 }, { u: 13, hv: 4.4, hw: pitch * 0.15 }, { u: 15, hv: 3, hw: pitch * 0.09 }], tc, { noCapA: true });
    for (const h of [0.25, 0.75]) {
      const t2 = ((k + h) / nt) * TAU;
      block(G, (u, v, w) => ringPt(t2, R - 8.5 - u, v, w), [{ u: -0.5, hv: 5.2, hw: pitch * 0.12 }, { u: 4.6, hv: 4.2, hw: pitch * 0.07 }], tint(C.steel, rng.range(0.8, 1.1)), { noCapA: true });
    }
    if (k % 4 === 0) for (const sg of [-1, 1]) { // bolt bosses with a lamp on the gear faces
      const t3 = ((k + 0.5) / nt) * TAU;
      block(G, (u, v, w) => ringPt(t3, R + 6 + v, sg * (7.6 + u), w), [{ u: 0, hv: 2.4, hw: 3.4 }, { u: 2, hv: 1.6, hw: 2.4 }], tint(C.steel, 0.9), { noCapA: true, capBM: 2 });
    }
  }
}

// 3: twin-rail, 440 m
function buildTwinRail(G, R, rng, C) {
  const col = mixc(C.brass, C.steel, 0.2), N = 200;
  for (const sg of [-1, 1]) {
    const a0 = sg * 10.5, top = sg > 0;
    const prof = [P(-3.6, a0 - 2, 0, 0.9), P(-2.6, a0 - 3, top ? 0 : 1), P(2.6, a0 - 3, 0, 0.9), P(3.6, a0 - 2, 1),
      P(3.6, a0 + 2, 0, 0.9), P(2.6, a0 + 3, top ? 1 : 0), P(-2.6, a0 + 3, 0, 0.9), P(-3.6, a0 + 2, 0, 1.1)];
    sweep(G, R, prof, N, { col, jit: panelJitter(rng, N), phase: rng.range(0, 99) });
  }
  sweep(G, R, hexProf(-7.5, 0, 1.3), 120, { col: tint(C.steel, 0.9) });
  const ns = rng.int(40, 56);
  for (let k = 0; k < ns; k++) {
    const th = (k / ns) * TAU;
    block(G, (u, v, w) => ringPt(th, R + v, u, w), [{ u: -8, hv: 2.4, hw: 1.7 }, { u: 0, hv: 1.1, hw: 0.9 }, { u: 8, hv: 2.4, hw: 1.7 }], tint(C.steel, rng.range(0.75, 1.05)), { noCapA: true, noCapB: true });
    strut(G, ringPt(th, R - 7.5, 0), ringPt(th, R, 0), 0.55, tint(C.steel, 0.8));
  }
  const nb = rng.int(5, 8), off = rng.range(0, TAU);
  for (let k = 0; k < nb; k++) {
    const th = off + (k / nb) * TAU;
    block(G, (u, v, w) => ringPt(th, R + u, v, w), [{ u: -6.5, hv: 11, hw: 5 }, { u: -3, hv: 15.5, hw: 9 }, { u: 4.5, hv: 15.5, hw: 9 }, { u: 8.5, hv: 9, hw: 5 }, { u: 9.6, hv: 6, hw: 2 }], tint(mixc(C.brass, C.steel, 0.6), 0.95), { capBM: 2 });
  }
}

// 4: segmented, 300 m; returns the emitter angles for the tether beams
function buildSegmented(G, R, rng, C) {
  const col = mixc(C.brass, C.steel, 0.1);
  const prof = [P(-7, -7), P(-5, -9, 0, 0.85), P(5, -9), P(7, -7, 0, 1.1), P(7, -4.5, 0, 0.7), P(5.8, -3.8, 1), P(5.8, 3.8, 0, 0.7), P(7, 4.5, 0, 1.1),
    P(7, 7), P(5, 9, 0, 0.85), P(-5, 9), P(-7, 7, 0, 1.1), P(-7, 4.5, 0, 0.7), P(-5.8, 3.8, 1), P(-5.8, -3.8, 0, 0.7), P(-7, -4.5, 0, 1.1)];
  const ns = rng.int(9, 14), fill = rng.range(0.76, 0.86), off = rng.range(0, TAU);
  for (let k = 0; k < ns; k++) {
    const t0 = off + (k / ns) * TAU, t1 = t0 + (fill / ns) * TAU;
    sweep(G, R, prof, 9, { t0, t1, col: tint(col, rng.range(0.85, 1.15)), cap: true, capM: 2, phase: rng.range(0, 99) });
  }
  sweep(G, R, hexProf(0, 0, 2.3), 120, { col: tint(C.steel, 0.85) });
  sweep(G, R, hexProf(-3, 5.5, 0.9), 96, { col: tint(C.steel, 0.7) });
  const eo = rng.range(0, TAU), ang = [];
  const big = prof.map((p) => P(p.r * 1.22, p.a * 1.16, 0, p.k));
  for (let k = 0; k < 4; k++) {
    const th = eo + k * TAU / 4; ang.push(th);
    sweep(G, R, big, 4, { t0: th - 0.05, t1: th + 0.05, col: tint(C.steel, 0.9), cap: true });
    block(G, (u, v, w) => ringPt(th, R - 8 - u, v, w), [{ u: -1, hv: 5.2, hw: 5.2 }, { u: 5, hv: 3.4, hw: 3.4 }, { u: 9, hv: 1.6, hw: 1.6 }, { u: 10.5, hv: 2.6, hw: 2.6 }, { u: 12, hv: 2.2, hw: 2.2 }], tint(C.steel, 1.0), { noCapA: true, capBM: 2 });
  }
  return { emitters: ang, tipR: R - 20 };
}

// Deformed icosahedron rock, flat shaded, written into G (mask 3 = stone)
function rock(G, noise, cx, cy, cz, s, detail, col, seed) {
  const ico = new THREE.IcosahedronGeometry(1, detail), pa = ico.getAttribute('position'), v = [];
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const k = s * (0.72 + 0.42 * noise.n3(x * 1.3 + seed, y * 1.3, z * 1.3) + 0.14 * noise.n3(x * 3.1, y * 3.1 + seed, z * 3.1));
    v.push([cx + x * k * 1.25, cy + y * k * 0.8, cz + z * k]);
  }
  for (let i = 0; i < v.length; i += 3) {
    const a = v[i], b = v[i + 1], c = v[i + 2], m = [(a[0] + b[0] + c[0]) / 3 - cx, (a[1] + b[1] + c[1]) / 3 - cy, (a[2] + b[2] + c[2]) / 3 - cz];
    G.quad(a, b, c, c, m, tint(col, 0.8 + 0.4 * ((i * 7919) % 13) / 13), 3);
  }
  ico.dispose();
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const starY = opts.starHeight ?? 420, veilDrop = opts.veilDrop ?? 250, STAR_R = 20;
  const V3 = THREE.Vector3;

  // per-seed character
  const warmth = rng.range(-1, 1);                       // brass: pale gold <-> copper; star: white <-> amber
  const brass0 = lin(pal[4]);
  const C = {
    brass: tint(mixc(brass0, warmth > 0 ? [brass0[0] * 1.05, brass0[1] * 0.72, brass0[2] * 0.6] : [brass0[0], brass0[1] * 1.12, brass0[2] * 1.5], Math.abs(warmth) * 0.6), 0.92),
    steel: tint(lin(pal[2]), 0.75), ash: tint(lin(pal[3]), 0.8),
  };
  const starCol = new THREE.Color(pal[5]); starCol.lerp(new THREE.Color(warmth > 0 ? '#ffb45a' : '#fff0c8'), Math.abs(warmth) * 0.35);
  const keyCol = starCol.clone().lerp(new THREE.Color('#ffffff'), 0.62);
  const fillCol = new THREE.Color(pal[1]).multiplyScalar(1.7);

  const U = {
    uTime: { value: 0 }, uProgress: { value: opts.progress ?? 1 }, uViewH: { value: 720 },
    uStar: { value: new V3(0, starY, 0) },
    uRingN: { value: [0, 1, 2, 3, 4].map(() => new V3(0, 1, 0)) },
    uRingW: { value: [new V3(24 / 500, 0.9, 480), new V3(21 / 400, 0.5, 365), new V3(9 / 310, 0.88, 294), new V3(13.5 / 220, 0.66, 208), new V3(9 / 150, 0.82, 140)] },
    uBeam: { value: [0, 1, 2, 3].map(() => new V3(1, 0, 0)) },
    uStarCol: { value: starCol }, uKey: { value: keyCol }, uFill: { value: fillCol }, uGlyph: { value: new THREE.Color(pal[6]) },
    uStarI: { value: 2.5 },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const share = (...names) => { const o = {}; for (const n of names) o[n] = U[n]; return o; };
  const ringMat = (idx) => new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...share('uTime', 'uProgress', 'uStar', 'uRingN', 'uRingW', 'uBeam', 'uStarCol', 'uKey', 'uFill', 'uGlyph', 'uStarI'), uIdx: { value: idx } },
    vertexShader: RING_VS, fragmentShader: RING_FS, fog: true,
  });
  const addMat = (vs, fs, extra, names) => new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...share(...names), ...extra }, vertexShader: vs, fragmentShader: fs, fog: true,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });

  const root = new THREE.Group(); root.name = 'silent-engine';
  const core = new THREE.Group(); core.position.set(0, starY, 0); root.add(core);

  // ---- ring planes: 20 / 35 / 50 degrees off the approach line (local Z) ----
  const Y = new V3(0, 1, 0), normals = [];
  let phi = Math.PI / 2 + rng.range(-0.2, 0.2);
  for (let i = 0; i < 3; i++) {
    const al = TILT_DEG[i] * Math.PI / 180;
    // ring 0 always leans so its near rim (toward +Z) is ABOVE the axis: the camera passes under it
    const zs = i === 0 ? -1 : rng.sign();
    normals.push(new V3(Math.cos(al) * Math.cos(phi), Math.cos(al) * Math.sin(phi), zs * Math.sin(al)).normalize());
    phi += rng.sign() * rng.range(0.85, 1.4);
  }
  const builders = [buildBand, buildLattice, buildGear, buildTwinRail, buildSegmented];
  const meshes = [], spin = [], phase = [];
  let emit = null, tris = 0;
  for (let i = 0; i < 5; i++) {
    const G = new Geo();
    const res = builders[i](G, RADII[i], rng, C);
    if (i === 4) emit = res;
    tris += G.tris;
    const mesh = new THREE.Mesh(G.build(), ringMat(i));
    mesh.frustumCulled = false; mesh.name = 'ring' + i;
    meshes.push(mesh);
    await ctx.yield?.();
  }
  // fixed rings: tilt group + in-plane spin
  const dirSign = rng.sign();
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.quaternion.setFromUnitVectors(Y, normals[i]); g.add(meshes[i]); core.add(g);
    spin.push((i % 2 ? -1 : 1) * dirSign * [rng.range(0.018, 0.028), rng.range(0.03, 0.045), rng.range(0.05, 0.07)][i]);
    phase.push(rng.range(0, TAU));
  }
  // tumbling rings: nested gimbals
  const g3 = new THREE.Group(); g3.quaternion.setFromEuler(new THREE.Euler(rng.range(-0.6, 0.6), rng.range(0, TAU), rng.range(-0.6, 0.6)));
  const gA = new THREE.Group(); g3.add(gA); gA.add(meshes[3]); core.add(g3);
  const g4 = new THREE.Group(); g4.rotation.y = rng.range(0.5, 1.2) * rng.sign(); gA.add(g4);
  const gB = new THREE.Group(); g4.add(gB); gB.add(meshes[4]);
  spin.push(rng.sign() * rng.range(0.1, 0.15), rng.sign() * rng.range(0.17, 0.24));
  phase.push(rng.range(0, TAU), rng.range(0, TAU));

  // ---- the captive star ----
  const starMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...share('uTime', 'uStarCol'), uGain: { value: 1 } }, vertexShader: STAR_VS, fragmentShader: STAR_FS, fog: true });
  const star = new THREE.Mesh(new THREE.SphereGeometry(STAR_R, 56, 36), starMat);
  star.rotation.set(rng.range(-0.4, 0.4), 0, rng.range(-0.4, 0.4)); core.add(star);
  const coronaMat = addMat(CORONA_VS, CORONA_FS, { uSize: { value: STAR_R * 22 }, uR: { value: STAR_R }, uGain: { value: 1 } }, ['uTime', 'uStarCol']);
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), coronaMat); corona.frustumCulled = false; corona.renderOrder = 3; core.add(corona);

  // view-aligned ribbon batches
  const ribbonGeo = (strips) => { // strips: [{ pts: [[x,y,z]...], w: [..], seed }]
    const p = [], tn = [], sd = [], w = [], ix = []; let nv = 0;
    for (const s of strips) {
      const n = s.pts.length;
      for (let i = 0; i < n; i++) {
        const a = s.pts[Math.max(i - 1, 0)], b = s.pts[Math.min(i + 1, n - 1)], q = s.pts[i];
        const tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2], tl = Math.hypot(tx, ty, tz) || 1, u = s.u ? s.u[i] : i / (n - 1);
        for (const side of [-1, 1]) { p.push(q[0], q[1], q[2]); tn.push(tx / tl, ty / tl, tz / tl); sd.push(side, u, s.seed); w.push(s.w[i]); }
        if (i < n - 1) ix.push(nv, nv + 1, nv + 2, nv + 1, nv + 3, nv + 2);
        nv += 2;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tn, 3));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(sd, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(w, 1));
    g.setIndex(ix); return g;
  };
  const ribbonMat = (kind, minPx) => addMat(RIBBON_VS, RIBBON_FS, { uKind: { value: kind }, uGain: { value: 1 }, uMinPx: { value: minPx } }, ['uTime', 'uStarCol', 'uViewH']);

  // prominences: loops rooted on the surface, turning with the star
  const proms = [], np = rng.int(5, 8);
  for (let k = 0; k < np; k++) {
    const b = new V3(rng.gauss(), rng.gauss() * 0.6, rng.gauss()).normalize();
    const d = new V3(rng.gauss(), rng.gauss(), rng.gauss()).cross(b).normalize();
    const span = rng.range(0.3, 0.8), h = rng.range(5, 17), lean = rng.range(-0.3, 0.3), side = new V3().crossVectors(b, d);
    const pts = [], ws = [], n = 22, wd = rng.range(1.8, 3.4);
    for (let j = 0; j <= n; j++) {
      const f = j / n, a = (f - 0.5) * span, lift = Math.pow(Math.sin(Math.PI * f), 0.8);
      const dir = b.clone().multiplyScalar(Math.cos(a)).addScaledVector(d, Math.sin(a)).addScaledVector(side, lean * lift * 0.3).normalize();
      const r = STAR_R - 0.6 + h * lift;
      pts.push([dir.x * r, dir.y * r, dir.z * r]); ws.push(wd * (0.55 + 0.75 * lift));
    }
    proms.push({ pts, w: ws, seed: rng() });
  }
  const promMesh = new THREE.Mesh(ribbonGeo(proms), ribbonMat(2, 0)); promMesh.frustumCulled = false; promMesh.renderOrder = 4; star.add(promMesh);

  // four tether beams: star -> emitters on the innermost ring (they ride its gimbal)
  const beamDirsLocal = emit.emitters.map((th) => new V3(Math.cos(th), 0, Math.sin(th)));
  const tethers = beamDirsLocal.map((d, k) => {
    const pts = [], w = [], n = 6;
    for (let j = 0; j <= n; j++) { const r = lerp(STAR_R - 1, emit.tipR, j / n); pts.push([d.x * r, 0, d.z * r]); w.push(1.5); }
    return { pts, w, seed: k * 0.37 + rng() };
  });
  const tetherMat = ribbonMat(0, 1.3);
  const tetherMesh = new THREE.Mesh(ribbonGeo(tethers), tetherMat); tetherMesh.frustumCulled = false; tetherMesh.renderOrder = 5; gB.add(tetherMesh);

  // the gold line into space
  let skyBeam = null;
  if (opts.skyBeam !== false) {
    const ys = [STAR_R, 60, 160, 400, 900, 1800, 3000, 4200], top = 4200;
    skyBeam = new THREE.Mesh(ribbonGeo([{ pts: ys.map((y) => [0, y, 0]), w: ys.map((y) => 1.8 + y * 0.0008), u: ys.map((y) => y / top), seed: 0.5 }]), ribbonMat(1, 1.1));
    skyBeam.frustumCulled = false; skyBeam.renderOrder = 2; core.add(skyBeam);
  }
  await ctx.yield?.();

  // ---- dust: orbiting motes in the star's rays + the veil layer ----
  {
    const nHaze = 2600, nVeil = opts.veil === false ? 0 : 1600, n = nHaze + nVeil;
    const pos = new Float32Array(n * 3), aD = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let r, y;
      if (i < nHaze) { r = 45 + 520 * Math.pow(rng(), 1.5); const el = rng.gauss() * 0.42; y = Math.sin(el) * r; r = Math.cos(el) * r; }
      else { r = 110 + 640 * Math.sqrt(rng()); y = -veilDrop + rng.gauss() * 14 + 6; }
      const th = rng() * TAU;
      pos[i * 3] = Math.cos(th) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(th) * r;
      aD[i * 4] = rng.range(0.015, 0.05) * Math.sqrt(220 / Math.max(r, 60)) * (rng.chance(0.85) ? 1 : -1);
      aD[i * 4 + 1] = rng.range(0.7, 2.4) * (rng.chance(0.06) ? 2.2 : 1); aD[i * 4 + 2] = rng() * 6.28; aD[i * 4 + 3] = rng.range(0.35, 1.3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aD', new THREE.BufferAttribute(aD, 4));
    const dust = new THREE.Points(g, addMat(DUST_VS, DUST_FS, {}, ['uTime', 'uViewH', 'uStarCol', 'uStar', 'uRingN', 'uRingW']));
    dust.frustumCulled = false; dust.renderOrder = 6; core.add(dust);
  }
  const VEIL_R = 800;
  if (opts.veil !== false) {
    const vg = new THREE.RingGeometry(0.5, VEIL_R, 96, 12); vg.rotateX(-Math.PI / 2);
    const veil = new THREE.Mesh(vg, addMat(VEIL_VS, VEIL_FS, { uVeilR: { value: VEIL_R }, uGain: { value: 1 } }, ['uTime', 'uStarCol', 'uStar', 'uRingN', 'uRingW']));
    veil.position.y = -veilDrop; veil.frustumCulled = false; veil.renderOrder = 1; core.add(veil);
  }

  // ---- debris belts: pale ash fragments in the gaps between ring shells ----
  const belts = [];
  const beltSpec = [{ lo: 420, hi: 474, ha: 12, big: 22, small: 46 }, { lo: 540, hi: 640, ha: 20, big: 20, small: 50 }];
  for (let b = 0; b < 2; b++) {
    const sp = beltSpec[b], G = new Geo(), s = b ? -1 : 1;
    // normals lean toward +/-Z with the same sign as Y so the belts stay far from the approach line
    const n = new V3(rng.range(-0.35, 0.35), rng.range(0.6, 0.85), rng.range(0.5, 0.75)).normalize();
    for (let k = 0; k < sp.big + sp.small; k++) {
      const big = k < sp.big, th = rng() * TAU, r = rng.range(sp.lo + 6, sp.hi - 6), y = rng.range(-1, 1) * (sp.ha - 5);
      const size = big ? rng.range(2.6, 6.5) : rng.range(0.8, 2.2);
      rock(G, noise, Math.cos(th) * r, y, Math.sin(th) * r, size, big ? 1 : 0, tint(C.ash, rng.range(0.7, 1.05)), rng() * 50);
    }
    tris += G.tris;
    const mesh = new THREE.Mesh(G.build(), ringMat(-1)); mesh.frustumCulled = false;
    const g = new THREE.Group(); g.quaternion.setFromUnitVectors(Y, n); g.add(mesh); core.add(g);
    belts.push({ mesh, normal: n, speed: s * rng.range(0.008, 0.016), Rc: (sp.lo + sp.hi) / 2, hr: (sp.hi - sp.lo) / 2 + 2, ha: sp.ha + 2 });
    await ctx.yield?.();
  }

  // ---- clearance against the static swept volumes (hero-local space) ----
  const starPos = new V3(0, starY, 0), INNER_REACH = 230;
  const solids = [
    { n: normals[0], Rc: 498.5, hr: 14.5, ha: 24 }, { n: normals[1], Rc: 386, hr: 18.5, ha: 23.5 }, { n: normals[2], Rc: 315, hr: 19.5, ha: 9 },
    ...belts.map((b) => ({ n: b.normal, Rc: b.Rc, hr: b.hr, ha: b.ha })),
  ];
  const tmp = new V3();
  const clearance = (p) => {
    tmp.set(p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]).sub(starPos);
    let d = tmp.length() - INNER_REACH;
    for (const s of solids) {
      const h = tmp.dot(s.n), rho = Math.sqrt(Math.max(tmp.lengthSq() - h * h, 0));
      d = Math.min(d, Math.hypot(Math.max(Math.abs(rho - s.Rc) - s.hr, 0), Math.max(Math.abs(h) - s.ha, 0)));
    }
    return d;
  };

  // ---- anchors ----
  const n0 = normals[0];
  const rimDir = new V3(0, 0, 1).addScaledVector(n0, -n0.z).normalize();          // ring-0 rim point nearest the approach
  const rimPoint = rimDir.clone().multiplyScalar(RADII[0]).add(starPos);
  const toAxis = new V3(-rimDir.x, -rimDir.y, 0).normalize();
  const rimPass = rimPoint.clone().addScaledVector(toAxis, 44);
  for (let i = 0; i < 30 && clearance(rimPass) < 40; i++) rimPass.addScaledVector(toAxis, 3);
  const portalPos = new V3(0, starY, 280);
  const off = rimPass.clone().sub(starPos), zq = off.z;
  const flyThrough = [new V3(off.x, off.y, zq + 330), new V3(off.x, off.y, zq + 170), new V3(off.x, off.y, zq)];
  for (const s of [0.3, 0.55, 0.8]) { const k = 0.5 + 0.5 * Math.cos(Math.PI * s); flyThrough.push(new V3(off.x * k, off.y * k, lerp(zq, 345, s))); }
  flyThrough.push(new V3(0, 0, 340), new V3(0, 0, 310), new V3(0, 0, 280));
  for (const p of flyThrough) p.add(starPos);
  // safety: push any point that is too tight toward the axis side (it never is for the default layout)
  for (const p of flyThrough) for (let i = 0; i < 20 && clearance(p) < 30 && p.z > 300; i++) p.addScaledVector(toAxis, 4);
  const ringInfo = [0, 1, 2, 3, 4].map((i) => ({ radius: RADII[i], halfWidth: [24, 23.5, 9, 15.5, 9][i], normal: i < 3 ? normals[i].clone() : new V3(0, 1, 0), spin: spin[i], fixed: i < 3 }));
  const anchors = {
    star: { position: starPos.clone(), radius: STAR_R },
    portalSeat: { position: portalPos, facing: new V3(0, 0, 1), radius: 7 },
    flyThrough, flyThroughClearance: Math.min(...flyThrough.map(clearance)),
    rimPass, rimPoint, approachDir: new V3(0, 0, -1), innerReach: INNER_REACH,
    rings: ringInfo, clearance,
    keyLight: { position: starPos.clone(), color: '#' + keyCol.getHexString(), intensity: 2.5 },
    viewpoints: {
      reveal: { position: new V3(0, starY + off.y, 900), target: starPos.clone() },
      rimPass: { position: rimPass.clone(), target: starPos.clone() },
      axis: { position: new V3(0, starY, 430), target: starPos.clone() },
      above: { position: new V3(380, starY + 460, 760), target: starPos.clone() },
    },
  };

  // ---- animation ----
  let progress = clamp(opts.progress ?? 1, 0, 1);
  const size = new THREE.Vector2(), inv = new THREE.Matrix4(), wq = new V3();
  // close to the star (the last run to the portal) the surface and corona are held below clip so the convection
  // cells, spots and prominences read instead of a white disc
  let nearK = 0;
  const applyProgress = () => {
    U.uProgress.value = progress;
    coronaMat.uniforms.uGain.value = (0.8 + 0.2 * progress) * lerp(1, 0.36, nearK);
    starMat.uniforms.uGain.value = lerp(1, 0.36, nearK);
    tetherMat.uniforms.uGain.value = 0.55 + 0.45 * smoothstep(0.1, 0.9, progress);
  };
  applyProgress();
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (camera) { nearK = 1 - smoothstep(400, 720, camera.position.distanceTo(U.uStar.value)); applyProgress(); }
    for (let i = 0; i < 3; i++) meshes[i].rotation.y = phase[i] + spin[i] * time;
    gA.rotation.x = phase[3] + spin[3] * time;
    gB.rotation.z = phase[4] + spin[4] * time;
    star.rotation.y = time * 0.035;
    for (const b of belts) b.mesh.rotation.y = b.speed * time;
    root.updateWorldMatrix(true, true);
    core.getWorldPosition(U.uStar.value);
    inv.copy(root.matrixWorld).invert();
    for (let i = 0; i < 5; i++) {
      U.uRingN.value[i].set(0, 1, 0).transformDirection(meshes[i].matrixWorld);
      if (i >= 3) ringInfo[i].normal.copy(U.uRingN.value[i]).transformDirection(inv);
    }
    for (let k = 0; k < 4; k++) U.uBeam.value[k].copy(beamDirsLocal[k]).transformDirection(meshes[4].matrixWorld);
    if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); if (size.y > 0) U.uViewH.value = size.y; }
  }
  update(0, 0, null);

  return {
    object: root, radius: 520, height: starY * 2, center: starPos.clone(), anchors,
    update, dispose() {},
    setProgress(u) { progress = clamp(u, 0, 1); applyProgress(); },
    uniforms: U, shadowGLSL: SHADOW_GLSL,
    ground: false, groundY: 0,
    stats: { triangles: tris + 56 * 36 * 2 + 96 * 10 * 2 },
  };
}
