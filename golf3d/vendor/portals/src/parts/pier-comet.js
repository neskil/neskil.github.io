// The Pier Comet: hero set piece. THE HUBLESS WHEEL and the needle of track that dives through it.
//
// What it is
//   A white box-truss ring 60 m across with no hub and no spokes, turning in a four-roller cradle
//   (two low bogies on trestles in the sand, two guide bogies on a lattice tower at the pier edge),
//   36 enclosed gondolas in mint / pink / white hung on outriggers on its FRONT face, 720 rim bulbs
//   chasing in three interleaved colours (mint and pink alternate on the two outer circles, mint
//   comets leading and pink following; white holds steady on the inner circle; one lap per 9 s),
//   the last 62 m of coaster track coming down at 12 degrees on ONE needle-thin mast and ending at
//   the exact centre of the ring, a boarding gangway with a striped canopy, a pennant, and the whole
//   thing doubled upside-down under a wet-sand mirror so that it stands as a figure of eight.
//
// Local space
//   Origin on the sand directly under the ring centre, +Y up. The ring lies in the XY plane, centre
//   (0, 32, 0). FRONT is +Z: the camera arrives from +Z flying toward -Z (in the brief's world that
//   is west -> east). The pier is on local -X: its south edge is the plane x = -32, deck at y = 8.
//
// opts
//   palette      array of 7 hex strings (brief order: navy, teal, violet, peach, mint, pink, white)
//   reflection   true   build the Y-flipped mirror copy under y = 0 (stretched 1.3x, dimmed, wobbling)
//   sand         true   build the hero's own wet-sand disc (translucent, fresnel) over the mirror.
//                       Pass false if the world lays its own sand: it must then be a translucent
//                       surface at y = 0 (alpha about 0.45-0.9) or the mirror will not show.
//   sandRadius   520
//   mirrorRadius 168, mirrorDepth 96   size of the mirror zone under the sand (a world that mirrors its own
//                       things, such as fireworks, needs it wide and deep enough to hold them)
//   track        true   build the final 62 m of track and its mast (false: ring only)
//   (uniforms)   hero.uniforms.uSea = (sea level, world z beyond which the sea lies): mirrored bulbs whose reflection
//                       falls on the sea are laid on the water as streaks; uShore.x = world z of the dry-sand line;
//                       uReflMin = how mirror-like the wet sand is looking straight down; uLamp = bulb brightness
//   turnPeriod   78     seconds per revolution of the ring (sign is chosen per seed)
//
// anchors (all local space, plain arrays)
//   portalSeat   { position:[0,32,0], normal:[0,sin12,cos12], radius:7, tiltDeg:12 }  the 14 m portal
//                sits at the ring centre, facing up the track (normal points at the arriving camera).
//   flyThrough   ordered points of the camera line: the last 62 m, straight, pitched 12 degrees down,
//                ending at the portal centre. The only structure near it is the track 1.3 m below.
//   flyBeyond    a point 12 m past the portal on the same line (for tangents).
//   trackJoin    { position, direction }  rail-top point and travel direction where the world's
//                coaster must hand over to this piece's track (62 m up-line from the centre).
//   railDrop     1.3  metres the rail tops sit under the camera line.
//   ringCenter, ringRadius (30), clearRadius (22.5: nothing but the track inside this circle)
//   pier         { side:-1, edgeX:-32, deckY:8 }  where the pier's south edge must be.
//   towerTop     top of the cradle tower (pennant).
//   viewpoints   { reveal, lastClimb, under }  good camera positions looking at ringCenter.
//   fireworks    centre of the sky region behind the ring that the last four seconds frame.
//
// Hooks
//   hero.setProgress(u)   0..1; from 0.85 the chase quickens and the rim swells (arrival), no clock.
//   hero.setFlash(k)      0..0.25 ambient lift on the white paint for a firework burst.
//   hero.uniforms         shared uniforms (uSky, uGround, uRim, uRimDir ...) if the world wants to retint.
//
// Size and cost: radius 36, height 63 (mirror reaches y = -82). About 88k triangles with the mirror
// (about 44k without), 10 draw calls (5 without mirror and sand), no lights, no textures. Build
// about 110-190 ms on the shared test machine.
//
// Lighting: none needed. Everything is shaded by its own ShaderMaterials: hemisphere ambient (teal
// sky over navy ground), a faint peach rim from +Z (west), and mint/pink bulb glow baked per vertex.
// Scene lights are ignored; scene fog is honoured. Emissive bulbs are 5-7 linear so they bloom with
// hard cores.
import * as THREE from 'three';

const HUBY = 32, R_OUT = 30, R_IN = 27.3, HALF_Z = 1.5, PIV_R = 27.0, PIV_Z = 3.7;
const TILT = 12 * Math.PI / 180, RAIL_DROP = 1.3, TRACK_LEN = 62;
const DEFAULT_PALETTE = ['#0E1630', '#1E6A7A', '#4A2F7A', '#FFB59A', '#7FF0CF', '#FF7EB6', '#F6FBFF'];

// ---------- tiny non-indexed geometry builder (position, normal, aCol, aGlow, aFx) ----------
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.g = []; this.f = []; this.col = [0.7, 0.7, 0.7]; this.glow = [0, 0, 0]; this.fx = 0; }
  v(x, y, z, nx, ny, nz, fx = this.fx) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(this.col[0], this.col[1], this.col[2]); this.g.push(this.glow[0], this.glow[1], this.glow[2]); this.f.push(fx); }
  quad(a, b, c, d, fa, fb, fc, fd) { // a,b,c,d counter-clockwise, flat normal
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    this.v(a[0], a[1], a[2], nx, ny, nz, fa); this.v(b[0], b[1], b[2], nx, ny, nz, fb); this.v(c[0], c[1], c[2], nx, ny, nz, fc);
    this.v(a[0], a[1], a[2], nx, ny, nz, fa); this.v(c[0], c[1], c[2], nx, ny, nz, fc); this.v(d[0], d[1], d[2], nx, ny, nz, fd);
  }
  // square/rect tube from a to b; w across `side`, h across `up`; taper = scale at b; ref picks roll
  beam(a, b, w, h, opt = {}) {
    const ref = opt.ref || [0, 0, 1], t = opt.taper ?? 1;
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    let rx = ref[0], ry = ref[1], rz = ref[2];
    if (Math.abs(dx * rx + dy * ry + dz * rz) > 0.96) { rx = ref[1]; ry = ref[2]; rz = ref[0]; }
    let sx = dy * rz - dz * ry, sy = dz * rx - dx * rz, sz = dx * ry - dy * rx; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const ux = sy * dz - sz * dy, uy = sz * dx - sx * dz, uz = sx * dy - sy * dx;
    const k = (o, s, u, m) => [o[0] + (sx * s * w + ux * u * h) * 0.5 * m, o[1] + (sy * s * w + uy * u * h) * 0.5 * m, o[2] + (sz * s * w + uz * u * h) * 0.5 * m];
    const A = [k(a, -1, -1, 1), k(a, 1, -1, 1), k(a, 1, 1, 1), k(a, -1, 1, 1)], B = [k(b, -1, -1, t), k(b, 1, -1, t), k(b, 1, 1, t), k(b, -1, 1, t)];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(A[j], A[i], B[i], B[j]); }
    if (opt.caps) { this.quad(A[0], A[1], A[2], A[3]); this.quad(B[3], B[2], B[1], B[0]); }
  }
  // smooth tube through pts (array of [x,y,z]) with radius fn(i/(n-1)); closed loops when opt.closed
  tube(pts, rad, sides = 6, opt = {}) {
    const n = pts.length, closed = !!opt.closed, rings = [];
    const up0 = opt.up || [0, 0, 1];
    for (let i = 0; i < n; i++) {
      const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)], o = pts[i];
      let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
      let rx = up0[0], ry = up0[1], rz = up0[2]; if (Math.abs(dx * rx + dy * ry + dz * rz) > 0.96) { rx = 1; ry = 0; rz = 0; }
      let sx = dy * rz - dz * ry, sy = dz * rx - dx * rz, sz = dx * ry - dy * rx; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      const ux = sy * dz - sz * dy, uy = sz * dx - sx * dz, uz = sx * dy - sy * dx;
      const r = typeof rad === 'function' ? rad(i / Math.max(1, n - 1)) : rad, ring = [];
      for (let s = 0; s < sides; s++) { const th = (s / sides) * Math.PI * 2, c = Math.cos(th), q = Math.sin(th); const nx = sx * c + ux * q, ny = sy * c + uy * q, nz = sz * c + uz * q; ring.push([o[0] + nx * r, o[1] + ny * r, o[2] + nz * r, nx, ny, nz]); }
      rings.push(ring);
    }
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const A = rings[i], B = rings[(i + 1) % n];
      for (let s = 0; s < sides; s++) {
        const t = (s + 1) % sides, a = A[s], b = A[t], c = B[t], d = B[s];
        this.v(a[0], a[1], a[2], a[3], a[4], a[5]); this.v(c[0], c[1], c[2], c[3], c[4], c[5]); this.v(b[0], b[1], b[2], b[3], b[4], b[5]);
        this.v(a[0], a[1], a[2], a[3], a[4], a[5]); this.v(d[0], d[1], d[2], d[3], d[4], d[5]); this.v(c[0], c[1], c[2], c[3], c[4], c[5]);
      }
    }
  }
  get tris() { return this.p.length / 9; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.g, 3));
    g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.f, 1));
    return g;
  }
}

// ---------- shaders ----------
const NOISE_GLSL = /* glsl */`
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

const PAINT_VS = /* glsl */`
attribute vec3 aCol; attribute vec3 aGlow; attribute float aFx;
#ifdef GONDOLA
attribute vec3 iA; attribute float aTint; attribute float aEm;
uniform vec3 uPal[3];
varying float vEm; varying vec3 vLamp; varying vec2 vUv;
#endif
uniform float uTime, uRot, uMirror;
varying vec3 vCol, vGlow, vN, vW;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; vec3 col = aCol;
#ifdef GONDOLA
  float a = iA.x + uRot; float top = smoothstep(0.5, 1.0, sin(a));
  float th = 0.05*sin(uTime*1.1 + iA.z) + top*0.21*sin(uTime*1.9 + iA.z*1.7);
  float c = cos(th), s = sin(th); mat2 m = mat2(c, s, -s, c);
  p.xy = m*p.xy; n.xy = m*n.xy;
  p += vec3(cos(a)*${PIV_R.toFixed(2)}, ${HUBY.toFixed(1)} + sin(a)*${PIV_R.toFixed(2)}, ${PIV_Z.toFixed(2)});
  vec3 pal = iA.y < 0.5 ? uPal[0] : (iA.y < 1.5 ? uPal[1] : uPal[2]);
  col = mix(col, col*pal*1.25, aTint); vEm = aEm; vLamp = pal; vUv = uv;
#endif
  p.z += aFx*(sin(uTime*5.3 + p.x*2.4) + 0.5*sin(uTime*8.1 + p.x*4.7 + p.y))*0.42;
  vec4 w = modelMatrix*vec4(p, 1.0);
  float dep = max(0.0, -w.y);
  w.x += uMirror*sin(w.y*0.42 + uTime*1.6 + w.z*0.3)*0.02*min(dep, 22.0);
  w.z += uMirror*sin(w.y*0.31 + uTime*1.1)*0.012*min(dep, 22.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix)*n); vCol = col; vGlow = aGlow;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const PAINT_FS = /* glsl */`
uniform vec3 uSky, uGround, uRim, uRimDir; uniform float uTime, uFlash, uGlowK, uDim, uMirror, uSwell;
varying vec3 vCol, vGlow, vN, vW;
#ifdef GONDOLA
varying float vEm; varying vec3 vLamp; varying vec2 vUv;
#endif
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(1e-5));
  float ny = mix(N.y, -N.y, uMirror);
  vec3 amb = mix(uGround, uSky, ny*0.5 + 0.5);
  float rim = max(dot(N, uRimDir), 0.0); rim *= rim;
  float wear = vn3(vW*2.1)*0.6 + vn3(vW*7.3)*0.4;
  vec3 light = amb*(1.0 + uFlash*3.0) + uRim*rim + vGlow*uGlowK*(1.0 + uSwell*0.6);
  vec3 col = vCol*(0.80 + 0.22*wear)*light;
#ifdef GONDOLA
  float mull = smoothstep(0.05, 0.10, 0.5 - abs(fract(vUv.x*8.0) - 0.5));
  float band = smoothstep(0.0, 0.12, vUv.y)*(1.0 - smoothstep(0.88, 1.0, vUv.y));
  float people = 0.75 + 0.25*step(0.45, vn3(vec3(vUv.x*16.0, vUv.y*2.0, vLamp.g*9.0)));
  col = mix(col, vLamp*(0.3 + 3.4*mull*band*people), vEm);
#endif
  float dep = max(0.0, -vW.y);
  col *= mix(1.0, uDim*exp(-dep*0.008), uMirror);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const SWING_GLSL = /* glsl */`
float gSwing(float a, float ph, float t){ float top = smoothstep(0.5, 1.0, sin(a)); return 0.05*sin(t*1.1 + ph) + top*0.21*sin(t*1.9 + ph*1.7); }
`;

// One instanced billboard draw for every bulb. iDat = (colour id, angle, mode, half size);
// mode 0 static, 1 on the turning ring, 2 hung under a gondola. iCh = (pattern, phase):
// pattern 0 the three-colour rim chase, 1 steady twinkle, 2 a run along the track toward the portal.
const BULB_VS = /* glsl */`
attribute vec3 iPos; attribute vec4 iDat; attribute vec2 iCh;
uniform float uTime, uRot, uMirror, uChaseT, uK, uSwell, uLamp; uniform vec2 uRes, uSea; uniform vec3 uPal[3];
varying vec2 vQ; varying vec3 vC; varying float vFog;
${SWING_GLSL}
void main(){
  vec3 c = iPos; float mode = iDat.z, ang = iDat.y;
  if (mode > 0.5 && mode < 1.5) { float cr = cos(uRot), sr = sin(uRot); c.xy = mat2(cr, sr, -sr, cr)*c.xy; c.y += ${HUBY.toFixed(1)}; ang += uRot; }
  else if (mode > 1.5) { float a = iDat.y + uRot; float th = gSwing(a, iCh.y, uTime); float ct = cos(th), st = sin(th);
    c.xy = mat2(ct, st, -st, ct)*c.xy; c += vec3(cos(a)*${PIV_R.toFixed(2)}, ${HUBY.toFixed(1)} + sin(a)*${PIV_R.toFixed(2)}, ${PIV_Z.toFixed(2)}); }
  float b;
  if (iCh.x < 0.5) {
    float f = fract(uK*ang*0.15915494 - uChaseT);
    if (iDat.x < 0.5) b = 0.13 + 1.5*f*f*f;
    else if (iDat.x < 1.5) { float f2 = fract(f + 0.36); b = 0.13 + 1.5*f2*f2*f2; }
    else b = 0.42 + 0.05*sin(uTime*3.0 + ang*40.0);
    b *= 1.0 + uSwell*0.8;
  } else if (iCh.x < 1.5) { b = 0.72 + 0.28*sin(uTime*(1.6 + fract(iCh.y*7.31)*2.5) + iCh.y*43.0); }
  else { float f = fract(iCh.y - uTime*0.55); b = 0.2 + 1.3*f*f*f; }
  vec3 pal = iDat.x < 0.5 ? uPal[0] : (iDat.x < 1.5 ? uPal[1] : uPal[2]);
  vec4 w = modelMatrix*vec4(c, 1.0);
  float dep = max(0.0, -w.y);
  w.x += uMirror*sin(w.y*0.42 + uTime*1.6 + w.z*0.3)*0.02*min(dep, 22.0);
  w.z += uMirror*sin(w.y*0.31 + uTime*1.1)*0.012*min(dep, 22.0);
  // where the mirrored bulb is seen in the SEA (not the sand) it is laid on the water as a long wobbling streak
  float sz = iDat.w, tall = 1.0;
  if (uMirror > 0.5) {
    float f = clamp((cameraPosition.y - uSea.x)/max(cameraPosition.y - w.y, 0.05), 0.0, 1.0);
    vec3 sp = cameraPosition + (w.xyz - cameraPosition)*f;
    if (sp.z > uSea.y && cameraPosition.y > uSea.x + 0.3) {
      sz *= f; tall = 3.6; b *= 0.12;
      w.xyz = sp + vec3(sin(uTime*2.1 + sp.z*0.9 + iPos.x*5.0 + iPos.y*3.0)*sz*1.6, 0.45, 0.0);
    }
  }
  vec4 mv = viewMatrix*w;
  float d = max(-mv.z, 0.1);
  float px = sz*projectionMatrix[1][1]*uRes.y*0.5/d;
  float s = max(px, 1.7);
  b *= clamp(px*px/(s*s), 0.34, 1.0);
  b *= mix(1.0, 0.85*exp(-dep*0.007), uMirror)*uLamp;
  mv.xy += position.xy*vec2(1.0, tall)*sz*(s/max(px, 1e-3));
  vQ = position.xy; vC = pal*b;
  vFog = d;
  gl_Position = projectionMatrix*mv;
}`;
const BULB_FS = /* glsl */`
varying vec2 vQ; varying vec3 vC; varying float vFog;
#ifdef USE_FOG
uniform float fogDensity; uniform float fogNear; uniform float fogFar;
#endif
void main(){
  float r = length(vQ);
  float core = 1.0 - smoothstep(0.30, 0.46, r);
  float halo = exp(-r*r*6.5)*(1.0 - smoothstep(0.75, 1.0, r));
  vec3 col = mix(vC, vec3(dot(vC, vec3(0.34))), 0.22)*core*5.5 + vC*halo*0.75;
#ifdef USE_FOG
  #ifdef FOG_EXP2
  col *= exp(-fogDensity*fogDensity*vFog*vFog);
  #else
  col *= 1.0 - smoothstep(fogNear, fogFar, vFog);
  #endif
#endif
  gl_FragColor = vec4(col, 1.0);
}`;

// Mirrored sky under the sand: what the wet sand reflects where no mirrored object stands.
const SKYREF_GLSL = /* glsl */`
uniform vec3 uZenith, uHorizon, uPeach;
vec3 skyRef(vec3 dir){ // dir: view ray, pointing down into the mirror
  float e = clamp(-dir.y, 0.0, 1.0);
  vec3 c = mix(uHorizon, uZenith, smoothstep(0.0, 0.55, e));
  float west = smoothstep(0.1, 0.9, normalize(dir.xz + vec2(1e-5)).y);   // +Z is west: the peach band lies only there
  c += uPeach*west*exp(-e*9.0)*0.55;
  return c*0.3;
}`;
const BUCKET_VS = /* glsl */`
varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BUCKET_FS = /* glsl */`
varying vec3 vW;
${SKYREF_GLSL}
#include <fog_pars_fragment>
void main(){ vec3 dir = normalize(vW - cameraPosition + vec3(1e-5)); gl_FragColor = vec4(skyRef(dir), 1.0);
  #include <fog_fragment>
}`;
const SAND_FS = /* glsl */`
varying vec3 vW;
uniform vec3 uSand, uSandDry, uGlowA, uGlowB, uOrigin; uniform float uTime, uZone, uSwell, uFlash, uReflMin; uniform vec2 uShore;
${SKYREF_GLSL}
${NOISE_GLSL}
#include <fog_pars_fragment>
void main(){
  vec3 dv = vW - cameraPosition; float dist = length(dv); vec3 dir = dv/max(dist, 1e-3);
  float cosT = clamp(-dir.y, 0.0, 1.0);
  float fres = (1.0 - cosT)*(1.0 - cosT);                       // the mirror strengthens toward grazing
  float n0 = vn3(vec3(vW.xz*0.009, 7.7)), n1 = vn3(vec3(vW.xz*0.035, 1.3)), n2 = vn3(vec3(vW.xz*0.21, 4.1));
  // sand bars: long meandering ripple marks parallel to the shore, faded by their own footprint on screen
  float ph = vW.z*1.7 + n1*9.0 + n2*2.2 + sin(vW.x*0.23)*1.5, fw = fwidth(ph);
  float rip = sin(ph), lod = 1.0 - smoothstep(1.0, 2.8, fw);
  float ridge = smoothstep(0.15, 0.9, rip)*lod;
  float ph2 = vW.z*9.0 + n2*5.0 + sin(vW.x*1.1)*1.2, fw2 = fwidth(ph2);
  float fine = (0.5 + 0.5*sin(ph2))*(1.0 - smoothstep(0.7, 2.0, fw2));
  // dry and pale under the promenade, glassy toward the tide line
  float shore = vW.z + (n1 - 0.5)*24.0 + (n0 - 0.5)*44.0;
  float dry = 1.0 - smoothstep(uShore.x, uShore.x + 42.0, shore);
  // tide pools, and the film of water that wanders over the flats
  float pool = smoothstep(0.55, 0.6, n1*0.72 + n0*0.38 + 0.015*sin(uTime*0.4 + vW.x*0.1))*(1.0 - dry);
  float film = smoothstep(0.30, 0.62, n1 + 0.25*n2);
  // wrack lines: dark kelp left in curving bands by each tide
  float wr = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float zc = uShore.x + 24.0 + fi*39.0 + (vn3(vec3(vW.x*0.017, fi*3.7, 2.0)) - 0.5)*34.0 + sin(vW.x*0.05 + fi*2.0)*4.0;
    wr += (1.0 - smoothstep(0.2, 1.5 + fi*0.5, abs(vW.z - zc)))*smoothstep(0.3, 0.55, vn3(vec3(vW.x*0.45, vW.z*1.3, fi)));
  }
  wr = min(wr, 1.0)*(1.0 - pool);
  float wet = mix(0.78, 1.0, film)*(1.0 - 0.5*ridge)*(1.0 - 0.92*dry);
  wet = mix(wet, 1.0, pool);
  float refl = clamp(mix(uReflMin, 0.97, fres)*wet, 0.0, 0.97)*(1.0 - 0.85*wr);
  vec3 base = mix(uSand, uSandDry, dry)*(0.5 + 0.42*n2 + 0.4*ridge + 0.16*fine)*(1.0 - 0.35*pool);
  base = mix(base, uSand*0.1 + vec3(0.004, 0.006, 0.003), wr*0.9);
  // bulb light pooled on the sand under the ring
  vec2 q = vW.xz - uOrigin.xz; float lp = exp(-(q.x*q.x/900.0 + q.y*q.y/160.0));   // relative to the wheel, wherever the world stands it
  float sw = 0.5 + 0.5*sin(q.x*0.11 + uTime*0.7);
  base += mix(uGlowA, uGlowB, sw)*lp*(0.035 + 0.05*ridge)*(1.0 + uSwell);
  base *= 1.0 + uFlash*2.0;
  float zone = 1.0 - smoothstep(uZone*0.62, uZone, length(q));
  float a = 1.0 - refl*zone;
  vec3 rd = normalize(dir + vec3(0.0, -0.07*rip*lod - 0.03*(fine - 0.5), 1e-5));    // the ripples tilt what the film reflects
  vec3 col = (base*(1.0 - refl) + skyRef(rd)*refl*(1.0 - zone))/max(a, 0.02);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------- gondola (one geometry, 36 instances): a rounded-square cabin under a yoke ----------
function buildGondolaGeometry(rng) {
  const P = [], Nn = [], C = [], T = [], E = [], U = [], G = [], F = [];
  const SEG = 16;
  // profile rows: y below the pivot, half width, tint (painted in the gondola's colour), emissive, v
  const rows = [
    [-0.42, 0.10, 0, 0, 0], [-0.52, 0.34, 0, 0, 0], [-0.60, 0.42, 1, 0, 0], [-0.80, 0.98, 1, 0, 0], [-0.93, 1.22, 1, 0, 0],
    [-1.00, 1.22, 0, 0, 0], [-1.03, 1.10, 0, 0, 0], [-1.03, 1.08, 0, 1, 0], [-1.98, 1.13, 0, 1, 1], [-1.98, 1.20, 0, 0, 0],
    [-2.10, 1.22, 0, 0, 0], [-2.13, 1.17, 1, 0, 0], [-2.62, 1.05, 1, 0, 0], [-2.92, 0.74, 1, 0, 0], [-3.02, 0.30, 0, 0, 0], [-3.02, 0.0, 0, 0, 0],
  ];
  const ring = (row) => { const out = []; for (let s = 0; s <= SEG; s++) { const a = (s / SEG) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), q = Math.sin(a), e = 0.62;
    const x = Math.sign(c) * Math.pow(Math.abs(c), e) * row[1], z = Math.sign(q) * Math.pow(Math.abs(q), e) * row[1] * 0.92; out.push([x, row[0], z, s / SEG]); } return out; };
  const push = (v, n, col, tint, em, u, vv) => { P.push(v[0], v[1], v[2]); Nn.push(n[0], n[1], n[2]); C.push(col, col, col * 1.02); T.push(tint); E.push(em); U.push(u, vv); G.push(0, 0, 0); F.push(0); };
  for (let i = 0; i < rows.length - 1; i++) {
    const r0 = rows[i], r1 = rows[i + 1]; if (r0[0] === r1[0] && r0[1] === r1[1]) continue;
    const A = ring(r0), B = ring(r1), tint = Math.min(r0[2], r1[2]) , em = Math.min(r0[3], r1[3]);
    const dy = r1[0] - r0[0], dr = r1[1] - r0[1], sl = Math.hypot(dy, dr) || 1;
    const col = em ? 0.1 : (tint ? 0.66 : 0.72);
    for (let s = 0; s < SEG; s++) {
      const nrm = (v) => { const l = Math.hypot(v[0], v[2]) || 1; const k = -dy / sl; return [v[0] / l * k, dr / sl, v[2] / l * k]; };
      const mid = [(A[s][0] + A[s + 1][0]) * 0.5, 0, (A[s][2] + A[s + 1][2]) * 0.5];
      const flat = r0[1] < 0.2 || r1[1] < 0.2 ? [0, Math.sign(dr) || -1, 0] : null;
      const q = [[A[s], r0[4]], [A[s + 1], r0[4]], [B[s + 1], r1[4]], [B[s], r1[4]]];
      for (const k of [0, 1, 2, 0, 2, 3]) { const v = q[k][0]; const base = Math.hypot(v[0], v[2]) > 0.05 ? v : mid; push(v, flat || nrm(base), col, tint, em, v[3], q[k][1]); }
    }
  }
  // yoke: axle boss and two hanger straps down to the roof
  const g = new Geo(); g.col = [0.7, 0.7, 0.72];
  g.beam([0, 0, -1.9], [0, 0, 0.55], 0.2, 0.2, { caps: true, ref: [0, 1, 0] });
  g.beam([0, 0.02, -0.5], [0.0, -0.5, -0.5], 0.12, 0.22, { ref: [0, 0, 1] }); g.beam([0, 0.02, 0.5], [0.0, -0.5, 0.5], 0.12, 0.22, { ref: [0, 0, 1] });
  g.beam([-0.5, -0.52, 0], [0.5, -0.52, 0], 0.16, 0.12, { caps: true, ref: [0, 1, 0] });
  for (let i = 0; i < g.p.length / 3; i++) { P.push(g.p[i * 3], g.p[i * 3 + 1], g.p[i * 3 + 2]); Nn.push(g.n[i * 3], g.n[i * 3 + 1], g.n[i * 3 + 2]); C.push(0.7, 0.7, 0.72); T.push(0); E.push(0); U.push(0, 0); G.push(0, 0, 0); F.push(0); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
  geo.setAttribute('aGlow', new THREE.Float32BufferAttribute(G, 3));
  geo.setAttribute('aFx', new THREE.Float32BufferAttribute(F, 1));
  geo.setAttribute('aTint', new THREE.Float32BufferAttribute(T, 1));
  geo.setAttribute('aEm', new THREE.Float32BufferAttribute(E, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  return geo;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [navy, teal, violet, peach, mint, pink, white] = pal;
  const wantMirror = opts.reflection !== false, wantSand = opts.sand !== false, wantTrack = opts.track !== false;
  const sandRadius = opts.sandRadius ?? 520;
  const mirrorRadius = opts.mirrorRadius ?? 168, mirrorDepth = opts.mirrorDepth ?? 96;   // the bucket of mirrored sky under the sand
  const turnDir = rng.chance(0.5) ? 1 : -1;
  const turnRate = turnDir * Math.PI * 2 / (opts.turnPeriod ?? 78);
  const chaseDir = rng.chance(0.5) ? 1 : -1, chaseK = rng.int(2, 4);
  const glowPhase = rng.range(0, 6.28), colStart = rng.int(0, 2);
  const pennantCol = rng.chance(0.5) ? pink : mint;
  let rot = rng.range(0, 6.28), chaseT = 0, progress = 0, flash = 0;

  const root = new THREE.Group(); root.name = 'pier-comet-hero';
  const lamp = [mint, pink, white].map((c) => c.clone());
  const sky = teal.clone().multiplyScalar(0.6).add(violet.clone().multiplyScalar(0.4)).multiplyScalar(1.3).addScalar(0.10);
  const ground = navy.clone().multiplyScalar(2.0).add(mint.clone().multiplyScalar(0.035)).add(pink.clone().multiplyScalar(0.035));
  const shared = {
    uTime: { value: 0 }, uRot: { value: rot }, uChaseT: { value: 0 }, uK: { value: chaseK }, uSwell: { value: 0 }, uFlash: { value: 0 },
    uSky: { value: sky }, uGround: { value: ground }, uRim: { value: peach.clone().multiplyScalar(0.2) },
    uRimDir: { value: new THREE.Vector3(0, 0.18, 1).normalize() }, uGlowK: { value: 1 },
    uPal: { value: lamp }, uRes: { value: new THREE.Vector2(800, 450) }, uOrigin: { value: new THREE.Vector3() },
    uSea: { value: new THREE.Vector2(0, 1e9) }, uLamp: { value: 1 }, uReflMin: { value: 0.6 }, uShore: { value: new THREE.Vector2(-75, 150) }, uSandDry: { value: navy.clone().multiplyScalar(3.2).addScalar(0.02) },
    uZenith: { value: violet.clone().multiplyScalar(0.55).add(navy.clone().multiplyScalar(0.6)) },
    uHorizon: { value: teal.clone().multiplyScalar(0.75).add(violet.clone().multiplyScalar(0.25)) }, uPeach: { value: peach.clone() },
  };
  const mats = [];
  const paintMat = (mirror, gondola) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uMirror: { value: mirror ? 1 : 0 }, uDim: { value: 0.85 } },
      vertexShader: PAINT_VS, fragmentShader: PAINT_FS, fog: true, defines: gondola ? { GONDOLA: 1 } : {}, side: gondola ? THREE.DoubleSide : THREE.FrontSide,
    }); mats.push(m); return m;
  };
  const bulbMat = (mirror) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uMirror: { value: mirror ? 1 : 0 } },
      vertexShader: BULB_VS, fragmentShader: BULB_FS, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }); mats.push(m); return m;
  };

  // paint colours: white with small warm/cool drift per member; glow = baked mint/pink bulb light
  const paint = (g, k = 1) => { const v = rng.range(0.64, 0.74) * k; g.col = [v * rng.range(0.97, 1.0), v, v * rng.range(0.99, 1.03)]; };
  const mixGlow = (t, s) => [(mint.r * (1 - t) + pink.r * t) * s, (mint.g * (1 - t) + pink.g * t) * s, (mint.b * (1 - t) + pink.b * t) * s];
  const TAU = Math.PI * 2;
  const rp = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z];

  // bulbs collect here: [x,y,z, colourId, angle, mode, size, pattern, phase]
  const bulbs = [];
  const bulb = (x, y, z, id, ang, mode, size, pattern, phase) => bulbs.push(x, y, z, id, ang, mode, size, pattern, phase);

  // ===== 1. the turning ring (local to its centre; the group sits at y = 32) =====
  const rg = new Geo();
  const NC = 144, NB = 72;
  for (const [r, z, rad] of [[R_OUT, HALF_Z, 0.19], [R_OUT, -HALF_Z, 0.19], [R_IN, HALF_Z, 0.17], [R_IN, -HALF_Z, 0.17]]) {
    const pts = []; for (let i = 0; i < NC; i++) pts.push(rp(r, (i / NC) * TAU, z));
    paint(rg, 1.04); rg.glow = mixGlow(0.5, r === R_OUT ? 0.34 : 0.26);
    rg.tube(pts, rad, 6, { closed: true, up: [0, 0, 1] });
  }
  // two running rails on the outside for the cradle rollers
  for (const z of [-HALF_Z, HALF_Z]) for (let i = 0; i < 96; i++) {
    const a0 = (i / 96) * TAU, a1 = ((i + 1) / 96) * TAU; paint(rg, 0.82); rg.glow = mixGlow(0.5 + 0.5 * Math.sin(a0 * 3 + glowPhase), 0.3);
    rg.beam(rp(R_OUT + 0.33, a0, z), rp(R_OUT + 0.33, a1, z), 0.62, 0.12, { ref: [0, 0, 1] });
  }
  await ctx.yield?.();
  for (let b = 0; b < NB; b++) {
    const a0 = (b / NB) * TAU, a1 = ((b + 1) / NB) * TAU, flip = b % 2 === 0;
    const gt = 0.5 + 0.5 * Math.sin(a0 * 3 + glowPhase);
    const m = (p, q, w, s, ref) => { paint(rg); rg.glow = mixGlow(gt, s); rg.beam(p, q, w, w, { ref }); };
    m(rp(R_IN, a0, HALF_Z), rp(R_OUT, a0, HALF_Z), 0.16, 0.34, [0, 0, 1]);            // front radial
    m(rp(R_IN, a0, -HALF_Z), rp(R_OUT, a0, -HALF_Z), 0.16, 0.16, [0, 0, 1]);          // back radial
    m(rp(R_OUT, a0, -HALF_Z), rp(R_OUT, a0, HALF_Z), 0.14, 0.24, [1, 0, 0]);          // outer cross
    m(rp(R_IN, a0, -HALF_Z), rp(R_IN, a0, HALF_Z), 0.14, 0.2, [1, 0, 0]);             // inner cross
    m(rp(flip ? R_IN : R_OUT, a0, HALF_Z), rp(flip ? R_OUT : R_IN, a1, HALF_Z), 0.12, 0.32, [0, 0, 1]);    // front diagonal
    m(rp(flip ? R_OUT : R_IN, a0, -HALF_Z), rp(flip ? R_IN : R_OUT, a1, -HALF_Z), 0.12, 0.14, [0, 0, 1]);  // back diagonal
    m(rp(R_OUT, a0, flip ? -HALF_Z : HALF_Z), rp(R_OUT, a1, flip ? HALF_Z : -HALF_Z), 0.11, 0.22, [1, 0, 0]); // outer face diagonal
    m(rp(R_IN, a0, flip ? HALF_Z : -HALF_Z), rp(R_IN, a1, flip ? -HALF_Z : HALF_Z), 0.11, 0.18, [1, 0, 0]);   // inner face diagonal
    // gusset plates on the front nodes
    paint(rg, 1.05); rg.glow = mixGlow(gt, 0.4);
    rg.beam(rp(R_OUT - 0.75, a0, HALF_Z + 0.1), rp(R_OUT + 0.1, a0, HALF_Z + 0.1), 0.7, 0.06, { ref: [0, 0, 1], taper: 1.5, caps: true });
    rg.beam(rp(R_IN + 0.75, a0, HALF_Z + 0.1), rp(R_IN - 0.1, a0, HALF_Z + 0.1), 0.7, 0.06, { ref: [0, 0, 1], taper: 1.5, caps: true });
  }
  await ctx.yield?.();
  // gondola outriggers: a V bracket and bearing block per car
  const NG = 36;
  for (let i = 0; i < NG; i++) {
    const a = (i / NG) * TAU, da = 0.045; paint(rg, 0.95); rg.glow = mixGlow(i % 2, 0.3);
    rg.beam(rp(R_IN, a - da, HALF_Z), rp(PIV_R, a, HALF_Z + 0.45), 0.16, 0.16, { ref: [0, 0, 1] });
    rg.beam(rp(R_IN, a + da, HALF_Z), rp(PIV_R, a, HALF_Z + 0.45), 0.16, 0.16, { ref: [0, 0, 1] });
    rg.beam(rp(R_IN, a, -HALF_Z), rp(PIV_R, a, HALF_Z + 0.2), 0.13, 0.13, { ref: [1, 0, 0] });
    rg.beam(rp(PIV_R, a, HALF_Z + 0.1), rp(PIV_R, a, HALF_Z + 0.75), 0.46, 0.46, { ref: [1, 0, 0], caps: true });
  }
  // 720 rim bulbs: outer front, outer back, inner front; colours interleave mint, pink, white
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * TAU;
    bulb(...rp(R_OUT + 0.05, a, HALF_Z + 0.42), i % 2, a, 1, 0.48, 0, 0);
    bulb(...rp(R_OUT + 0.05, a + TAU / 480, -HALF_Z - 0.42), (i + 1) % 2, a + TAU / 480, 1, 0.42, 0, 0);
    bulb(...rp(R_IN - 0.05, a + TAU / 720, HALF_Z + 0.42), 2, a + TAU / 720, 1, 0.36, 0, 0);
  }
  await ctx.yield?.();

  const ringGeo = rg.build();
  await ctx.yield?.();
  const ringGroup = new THREE.Group(); ringGroup.position.y = HUBY; ringGroup.rotation.z = rot;
  const ringMesh = new THREE.Mesh(ringGeo, paintMat(false, false)); ringMesh.frustumCulled = false; ringGroup.add(ringMesh);
  root.add(ringGroup);

  // gondolas
  const gondGeo = buildGondolaGeometry(rng);
  const iA = new Float32Array(NG * 3);
  for (let i = 0; i < NG; i++) {
    const a = (i / NG) * TAU, ph = rng.range(0, 6.28), id = (i + colStart) % 3;
    iA[i * 3] = a; iA[i * 3 + 1] = id; iA[i * 3 + 2] = ph;
    bulb(0, -3.12, 0, id, a, 2, 0.42, 1, ph);           // lamp under the floor
    bulb(0, -0.36, 0.95, 2, a, 2, 0.24, 1, ph);         // white marker on the yoke
  }
  await ctx.yield?.();
  gondGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 3)); gondGeo.instanceCount = NG;
  const gondMesh = new THREE.Mesh(gondGeo, paintMat(false, true)); gondMesh.frustumCulled = false; root.add(gondMesh);

  // ===== 2. everything that stands still: cradle, tower, gangway, mast, track =====
  const sg = new Geo();
  const concrete = () => { const v = rng.range(0.2, 0.26); sg.col = [v, v * 1.02, v * 1.08]; sg.glow = mixGlow(rng(), 0.12); };
  const steel = () => { const v = rng.range(0.3, 0.36); sg.col = [v * 0.95, v, v * 1.1]; sg.glow = mixGlow(rng(), 0.55); };
  const wp = (t, s = 0.3) => { paint(sg); sg.glow = mixGlow(t ?? rng(), s); };
  const roller = (cx, cy, z) => { // a flanged wheel on a z axle
    steel(); const pts = [[cx, cy, z - 0.42], [cx, cy, z - 0.3], [cx, cy, z + 0.3], [cx, cy, z + 0.42]];
    sg.tube(pts, (u) => (u < 0.2 || u > 0.8 ? 0.62 : 0.5), 10, { up: [0, 1, 0] });
    sg.beam([cx, cy, z - 0.43], [cx, cy, z + 0.43], 0.5, 0.5, { caps: true, ref: [0, 1, 0] });
  };
  const bogie = (a, feet) => {
    const rr = R_OUT + 0.39 + 0.5, t = [-Math.sin(a), Math.cos(a)], da = 0.05;
    const c = [rr * Math.cos(a), HUBY + rr * Math.sin(a)], o = [Math.cos(a), Math.sin(a)];
    for (const s of [-1, 1]) for (const z of [-HALF_Z, HALF_Z]) roller(rr * Math.cos(a + s * da), HUBY + rr * Math.sin(a + s * da), z);
    // side frames, axle beams, motor housing
    for (const z of [-HALF_Z - 0.75, HALF_Z + 0.75, 0]) { wp(0.5, 0.45); sg.beam([c[0] - t[0] * 2.4 + o[0] * 0.25, c[1] - t[1] * 2.4 + o[1] * 0.25, z], [c[0] + t[0] * 2.4 + o[0] * 0.25, c[1] + t[1] * 2.4 + o[1] * 0.25, z], 0.24, 0.7, { caps: true, ref: [0, 0, 1] }); }
    for (const s of [-1, 1]) { wp(0.5, 0.4); const x = rr * Math.cos(a + s * da), y = HUBY + rr * Math.sin(a + s * da); sg.beam([x, y, -HALF_Z - 0.9], [x, y, HALF_Z + 0.9], 0.2, 0.2, { caps: true, ref: [0, 1, 0] }); }
    steel(); sg.beam([c[0] + o[0] * 0.95, c[1] + o[1] * 0.95, -0.7], [c[0] + o[0] * 0.95, c[1] + o[1] * 0.95, 0.7], 1.5, 0.9, { caps: true, ref: [t[0], t[1], 0] });
    bulb(c[0] + o[0] * 0.2, c[1] + o[1] * 0.2, HALF_Z + 1.05, 2, 0, 0, 0.3, 1, rng.range(0, 9));
    const head = [c[0] + o[0] * 0.7, c[1] + o[1] * 0.7];
    for (const f of feet) { wp(rng(), 0.3); sg.beam([head[0] + (f[0] - head[0]) * 0.02, head[1], f[2] * 0.55], f, 0.3, 0.3, { ref: [0, 0, 1], taper: 1.25 }); }
    return head;
  };
  // low bogies on trestles in the sand
  for (const sx of [-1, 1]) {
    const a = -Math.PI / 2 + sx * 0.49, cx = Math.cos(a) * 30.9;
    const feet = [[cx - 2.6, 0.5, -2.9], [cx - 2.6, 0.5, 2.9], [cx + 2.6, 0.5, -2.9], [cx + 2.6, 0.5, 2.9]];
    const head = bogie(a, feet);
    for (const z of [-2.9, 2.9]) { wp(rng(), 0.3); sg.beam([cx - 2.6, 0.5, z], [cx + 2.6, 2.6, z * 0.75], 0.14, 0.14); sg.beam([cx + 2.6, 0.5, z], [cx - 2.6, 2.6, z * 0.75], 0.14, 0.14); }
    for (const x of [cx - 2.6, cx + 2.6]) { wp(rng(), 0.3); sg.beam([x, 2.2, -2.2], [x, 2.2, 2.2], 0.16, 0.16, { ref: [0, 1, 0] }); sg.beam([x, 0.6, -2.9], [x, 2.2, 2.2], 0.12, 0.12, { ref: [1, 0, 0] }); }
    for (const f of feet) { concrete(); sg.beam([f[0], -0.2, f[2]], [f[0], 0.55, f[2]], 1.5, 1.5, { taper: 0.72, caps: true, ref: [0, 0, 1] }); }
    void head;
  }
  // base girders tying the feet together under the ring
  for (const z of [-2.9, 2.9]) {
    wp(0.5, 0.5); sg.beam([-34, 0.62, z], [19, 0.62, z], 0.3, 0.42, { caps: true, ref: [0, 0, 1] });
    for (let x = -32; x < 18; x += 3.4) { wp(rng(), 0.4); sg.beam([x, 0.62, z], [x + 1.7, 0.62, z * 0.1], 0.12, 0.12, { ref: [0, 1, 0] }); sg.beam([x + 1.7, 0.62, z * 0.1], [x + 3.4, 0.62, z], 0.12, 0.12, { ref: [0, 1, 0] }); }
  }
  await ctx.yield?.();

  // lattice tower at the pier edge (x = -32 .. -36.4) carrying the two guide bogies
  const TW_H = 47, towerX = -34.2;
  const leg = (sx, sz, y) => { const k = 1 - 0.58 * (y / TW_H); return [towerX + sx * 2.2 * k, y, sz * 2.3 * k]; };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pts = []; for (let y = 0; y <= TW_H; y += TW_H / 12) pts.push(leg(sx, sz, y));
    wp(0.5, 0.45); sg.tube(pts, (u) => 0.26 - 0.1 * u, 6, { up: [1, 0, 0] });
    concrete(); sg.beam([towerX + sx * 2.2, -0.2, sz * 2.3], [towerX + sx * 2.2, 0.7, sz * 2.3], 1.3, 1.3, { taper: 0.7, caps: true });
  }
  await ctx.yield?.();
  const NBAY = 12;
  for (let b = 0; b < NBAY; b++) {
    const y0 = (b / NBAY) * TW_H, y1 = ((b + 1) / NBAY) * TW_H, fl = b % 2 ? 1 : -1, gt = b / NBAY;
    const faces = [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]];
    for (const [p, q] of faces) {
      wp(gt, 0.38);
      sg.beam(leg(p[0], p[1], y1), leg(q[0], q[1], y1), 0.13, 0.13, { ref: [0, 1, 0] });
      sg.beam(fl > 0 ? leg(p[0], p[1], y0) : leg(q[0], q[1], y0), fl > 0 ? leg(q[0], q[1], y1) : leg(p[0], p[1], y1), 0.11, 0.11, { ref: [0, 1, 0] });
    }
    // bulbs climbing the two front legs
    for (let k = 0; k < 3; k++) { const y = y0 + (k + 0.5) * (y1 - y0) / 3; for (const sx of [-1, 1]) { const p = leg(sx, 1, y); bulb(p[0], p[1], p[2] + 0.3, (b * 3 + k + (sx > 0 ? 1 : 0)) % 3, 0, 0, 0.3, 1, rng.range(0, 9)); } }
  }
  await ctx.yield?.();
  for (const sy of [-1, 1]) { // guide bogies with bracket arms back to the tower
    const a = Math.PI + sy * 0.225, cy = HUBY + 30.9 * Math.sin(a), k = 1 - 0.58 * (cy / TW_H);
    bogie(a, [[towerX + 2.2 * k, cy + 2.6, 2.3 * k], [towerX + 2.2 * k, cy + 2.6, -2.3 * k], [towerX + 2.2 * k, cy - 2.6, 2.3 * k], [towerX + 2.2 * k, cy - 2.6, -2.3 * k]]);
  }
  // crow's nest, finial and pennant
  wp(0.5, 0.5); sg.beam([towerX, TW_H - 0.1, 0], [towerX, TW_H + 0.35, 0], 2.9, 2.9, { caps: true, taper: 1.12 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; wp(0.5, 0.5); sg.beam([towerX + Math.cos(a) * 1.5, TW_H + 0.3, Math.sin(a) * 1.5], [towerX + Math.cos(a) * 1.6, TW_H + 1.4, Math.sin(a) * 1.6], 0.09, 0.09); bulb(towerX + Math.cos(a) * 1.65, TW_H + 1.5, Math.sin(a) * 1.65, i % 3, 0, 0, 0.3, 1, rng.range(0, 9)); }
  wp(0.5, 0.5); sg.tube([[towerX, TW_H, 0], [towerX, TW_H + 5, 0], [towerX, TW_H + 10.5, 0]], (u) => 0.16 - 0.1 * u, 6, { up: [1, 0, 0] });
  bulb(towerX, TW_H + 10.8, 0, 2, 0, 0, 0.55, 1, 3.3);
  { // pennant: a tapering strip that flutters (aFx grows toward the tail)
    sg.col = [pennantCol.r * 0.9 + 0.08, pennantCol.g * 0.9 + 0.08, pennantCol.b * 0.9 + 0.08]; sg.glow = [0.5, 0.5, 0.55];
    const y = TW_H + 9.6, L = 5.2, n = 10;
    for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, h0 = 0.85 * (1 - u0 * 0.9), h1 = 0.85 * (1 - u1 * 0.9);
      const a = [towerX - u0 * L, y - h0, 0], b2 = [towerX - u1 * L, y - h1, 0], c = [towerX - u1 * L, y + h1, 0], d = [towerX - u0 * L, y + h0, 0];
      sg.quad(a, d, c, b2, u0, u0, u1, u1); sg.quad(a, b2, c, d, u0, u1, u1, u0); }
  }

  // boarding gangway in front of the gondola line, at pier-deck height, with a striped canopy
  const GZ0 = 5.2, GZ1 = 7.8, GX0 = -32.5, GX1 = -15.5, GY = 8;
  wp(0.4, 0.5); sg.beam([GX0, GY - 0.15, (GZ0 + GZ1) / 2], [GX1, GY - 0.15, (GZ0 + GZ1) / 2], GZ1 - GZ0, 0.3, { caps: true, ref: [0, 0, 1] });
  for (let x = GX0 + 0.4; x < GX1; x += 0.55) { paint(sg, rng.range(0.8, 1.0)); sg.glow = mixGlow(rng(), 0.5); sg.beam([x, GY + 0.02, GZ0], [x, GY + 0.02, GZ1], 0.45, 0.05, { ref: [0, 1, 0] }); }
  for (const z of [GZ0 + 0.1, GZ1 - 0.1]) {
    wp(0.4, 0.45); sg.beam([GX0, GY - 0.5, z], [GX1, GY - 0.5, z], 0.2, 0.5, { caps: true, ref: [0, 0, 1] });
    wp(0.4, 0.6); sg.beam([GX0, GY + 1.1, z], [GX1, GY + 1.1, z], 0.1, 0.1, { ref: [0, 1, 0] }); sg.beam([GX0, GY + 0.6, z], [GX1, GY + 0.6, z], 0.06, 0.06, { ref: [0, 1, 0] });
    for (let x = GX0; x <= GX1 + 0.01; x += 1.7) { wp(rng(), 0.5); sg.beam([x, GY, z], [x, GY + 1.12, z], 0.09, 0.09); }
    let k = 0; for (let x = GX0 + 0.85; x < GX1; x += 1.7) bulb(x, GY + 1.3, z, (k++) % 3, 0, 0, 0.26, 1, rng.range(0, 9));
  }
  for (const x of [-27, -21.5, -16.5]) {
    for (const z of [GZ0 + 0.2, GZ1 - 0.2]) { wp(rng(), 0.3); sg.beam([x, 0.2, z + (z > 6 ? 0.8 : -0.5)], [x, GY - 0.5, z], 0.26, 0.26, { taper: 0.8 }); concrete(); sg.beam([x, -0.2, z + (z > 6 ? 0.8 : -0.5)], [x, 0.4, z + (z > 6 ? 0.8 : -0.5)], 0.9, 0.9, { taper: 0.75, caps: true }); }
    wp(rng(), 0.3); sg.beam([x, 0.8, GZ0 - 0.2], [x, GY - 0.9, GZ1 - 0.2], 0.1, 0.1); sg.beam([x, 0.8, GZ1 + 0.5], [x, GY - 0.9, GZ0 + 0.2], 0.1, 0.1);
  }
  await ctx.yield?.();
  { // canopy: eight stripes, pitched, with a scalloped valance that stirs in the breeze
    const cx0 = -32.3, cx1 = -26.3, zr = (GZ0 + GZ1) / 2, eave = GY + 3.0, ridge = GY + 4.3, stripe = rng.chance(0.5) ? mint : pink;
    for (const x of [cx0 + 0.2, cx1 - 0.2]) for (const z of [GZ0 + 0.15, GZ1 - 0.15]) { wp(0.5, 0.6); sg.beam([x, GY, z], [x, eave, z], 0.12, 0.12); }
    const n = 8;
    for (let i = 0; i < n; i++) {
      const x0 = cx0 + (cx1 - cx0) * i / n, x1 = cx0 + (cx1 - cx0) * (i + 1) / n, isW = i % 2 === 0;
      sg.col = isW ? [0.74, 0.74, 0.76] : [stripe.r * 0.8 + 0.05, stripe.g * 0.8 + 0.05, stripe.b * 0.8 + 0.05]; sg.glow = [0.5, 0.5, 0.52];
      for (const s of [-1, 1]) {
        const ze = zr + s * 1.75, a = [x0, eave, ze], b2 = [x1, eave, ze], c = [x1, ridge, zr], d = [x0, ridge, zr];
        if (s > 0) sg.quad(a, b2, c, d); else sg.quad(b2, a, d, c);
        const m = [(x0 + x1) / 2, eave - 0.5, ze + s * 0.06];
        sg.quad(a, m, m, b2, 0, 0.25, 0.25, 0); sg.quad(b2, m, m, a, 0, 0.25, 0.25, 0);
      }
      bulb((x0 + x1) / 2, eave + 0.1, zr + 1.85, i % 3, 0, 0, 0.26, 1, rng.range(0, 9));
    }
    wp(0.5, 0.6); sg.beam([cx0 - 0.1, ridge + 0.05, zr], [cx1 + 0.1, ridge + 0.05, zr], 0.12, 0.12, { caps: true, ref: [0, 1, 0] });
  }
  await ctx.yield?.();

  // ===== 3. the needle: last 62 m of track at 12 degrees down, on one mast =====
  const sT = Math.sin(TILT), cT = Math.cos(TILT);
  const camAt = (s) => [0, HUBY + s * sT, s * cT];                                   // camera line, s metres up-line
  const railAt = (s, x = 0, drop = 0) => [x, HUBY + s * sT - (RAIL_DROP + drop) * cT, s * cT + (RAIL_DROP + drop) * sT];
  const UPT = [0, cT, -sT];
  if (wantTrack) {
    const S0 = 0.4, S1 = TRACK_LEN;
    for (const x of [-0.6, 0.6]) {
      wp(0.5, 0.6); sg.beam(railAt(S0, x, 0.16), railAt(S1, x, 0.16), 0.2, 0.26, { caps: true, ref: UPT });
      steel(); sg.col = [0.46, 0.5, 0.58]; sg.glow = mixGlow(x > 0 ? 0.8 : 0.2, 1.3);
      sg.beam(railAt(S0, x, 0.0), railAt(S1, x, 0.0), 0.16, 0.06, { caps: true, ref: UPT });
    }
    for (const x of [-0.42, 0.42]) { wp(0.5, 0.45); sg.beam(railAt(S0, x, 0.62), railAt(S1, x, 0.62), 0.16, 0.44, { caps: true, ref: UPT }); }
    let k = 0;
    for (let s = S0 + 0.3; s < S1; s += 1.15, k++) {
      paint(sg, rng.range(0.9, 1.04)); sg.glow = mixGlow(rng(), 0.5);
      sg.beam(railAt(s, -1.02, 0.36), railAt(s, 1.02, 0.36), 0.24, 0.14, { caps: true, ref: UPT });
      if (k % 2 === 0) for (const x of [-1.12, 1.12]) bulb(...railAt(s, x, 0.3), (k / 2 + (x > 0 ? 1 : 0)) % 3, 0, 0, 0.2, 2, (1 - s / S1) * 7 + (x > 0 ? 0.08 : 0));
    }
    // triangular spine truss under the stringers
    const bayL = 2.3; wp(0.5, 0.4);
    sg.tube([railAt(S0, 0, 2.0), railAt(S1 * 0.5, 0, 2.0), railAt(S1, 0, 2.0)], 0.13, 6, { up: [1, 0, 0] });
    for (let s = S0, i = 0; s < S1 - 0.1; s += bayL, i++) {
      const e = Math.min(S1, s + bayL), mdl = (s + e) / 2;
      for (const x of [-0.42, 0.42]) { wp(rng(), 0.4); sg.beam(railAt(s, x, 0.8), railAt(mdl, 0, 2.0), 0.08, 0.08, { ref: [1, 0, 0] }); sg.beam(railAt(mdl, 0, 2.0), railAt(e, x, 0.8), 0.08, 0.08, { ref: [1, 0, 0] }); }
    }
    // buffer plate where the rails meet the portal
    wp(0.5, 0.8); sg.beam(railAt(S0, -0.9, 0.3), railAt(S0, 0.9, 0.3), 0.1, 0.5, { caps: true, ref: UPT });
    // the mast: one tapered needle with a flared foot, three collars and a forked head
    const sM = 14 / cT, headP = railAt(sM, 0, 2.0), mastTop = headP[1] - 0.9, mz = headP[2];
    const mp = []; for (let i = 0; i <= 16; i++) mp.push([0, (i / 16) * mastTop, mz]);
    wp(0.5, 0.42); sg.tube(mp, (u) => 0.24 + 0.4 * (1 - u) + 0.75 * Math.pow(Math.max(0, 1 - u * 14), 2), 10, { up: [1, 0, 0] });
    for (const f of [0.3, 0.58, 0.86]) { const y = f * mastTop, r = 0.24 + 0.4 * (1 - f); wp(0.5, 0.6); sg.tube([[0, y - 0.25, mz], [0, y - 0.12, mz], [0, y + 0.12, mz], [0, y + 0.25, mz]], (u) => r + (u > 0.2 && u < 0.8 ? 0.16 : 0.03), 10, { up: [1, 0, 0] }); bulb(0, y, mz + r + 0.4, f < 0.5 ? 0 : (f < 0.8 ? 1 : 2), 0, 0, 0.3, 1, f * 9); }
    concrete(); sg.beam([0, -0.2, mz], [0, 0.5, mz], 3.6, 3.6, { taper: 0.7, caps: true });
    for (const x of [-0.42, 0.42]) for (const ds of [-1.6, 1.6]) { wp(0.5, 0.5); sg.beam([0, mastTop - 0.3, mz], railAt(sM + ds, x, 0.84), 0.2, 0.2, { taper: 0.6, ref: [1, 0, 0] }); }
    wp(0.5, 0.5); sg.beam([0, mastTop - 0.5, mz], headP, 0.3, 0.3, { taper: 0.6 });
  }
  await ctx.yield?.();

  const staticGeo = sg.build();
  await ctx.yield?.();
  const staticMesh = new THREE.Mesh(staticGeo, paintMat(false, false)); staticMesh.frustumCulled = false; root.add(staticMesh);

  // ===== 4. bulbs: one instanced draw =====
  const nB = bulbs.length / 9, bp = new Float32Array(nB * 3), bd = new Float32Array(nB * 4), bc = new Float32Array(nB * 2);
  for (let i = 0; i < nB; i++) { const o = i * 9; bp.set([bulbs[o], bulbs[o + 1], bulbs[o + 2]], i * 3); bd.set([bulbs[o + 3], bulbs[o + 4], bulbs[o + 5], bulbs[o + 6]], i * 4); bc.set([bulbs[o + 7], bulbs[o + 8]], i * 2); }
  const quad = new THREE.PlaneGeometry(2, 2);
  const bulbGeo = new THREE.InstancedBufferGeometry();
  bulbGeo.setIndex(quad.index); bulbGeo.setAttribute('position', quad.getAttribute('position'));
  bulbGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(bp, 3));
  bulbGeo.setAttribute('iDat', new THREE.InstancedBufferAttribute(bd, 4));
  bulbGeo.setAttribute('iCh', new THREE.InstancedBufferAttribute(bc, 2));
  bulbGeo.instanceCount = nB;
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat(false)); bulbMesh.frustumCulled = false; bulbMesh.renderOrder = 3; root.add(bulbMesh);

  // ===== 5. the figure of eight: Y-flipped copies under a wet-sand mirror =====
  let mirrorRing = null;
  if (wantMirror) {
    const mg = new THREE.Group(); mg.name = 'mirror'; mg.scale.set(1, -1.3, 1);
    mirrorRing = new THREE.Group(); mirrorRing.position.y = HUBY; mirrorRing.rotation.z = rot;
    const a = new THREE.Mesh(ringGeo, paintMat(true, false)), b = new THREE.Mesh(staticGeo, paintMat(true, false)), c = new THREE.Mesh(gondGeo, paintMat(true, true)), d = new THREE.Mesh(bulbGeo, bulbMat(true));
    for (const m of [a, b, c, d]) m.frustumCulled = false;
    d.renderOrder = 1.4; mirrorRing.add(a); mg.add(mirrorRing, b, c, d); root.add(mg);
    // the mirrored sky the sand shows where nothing stands: an open bucket under the mirror zone
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(mirrorRadius, mirrorRadius, mirrorDepth, 48, 1, false), new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared }, vertexShader: BUCKET_VS, fragmentShader: BUCKET_FS, fog: true, side: THREE.BackSide }));
    bucket.position.y = -mirrorDepth / 2 - 0.05; bucket.frustumCulled = false; mats.push(bucket.material); root.add(bucket);
  }
  await ctx.yield?.();
  if (wantSand) {
    const sandGeo = new THREE.CircleGeometry(sandRadius, 96); sandGeo.rotateX(-Math.PI / 2);
    const sandMat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uSand: { value: navy.clone().multiplyScalar(1.5) }, uGlowA: { value: mint.clone() }, uGlowB: { value: pink.clone() }, uZone: { value: wantMirror ? mirrorRadius * 0.893 : 0.001 } },
      vertexShader: BUCKET_VS, fragmentShader: SAND_FS, fog: true, transparent: true, depthWrite: false });
    const sand = new THREE.Mesh(sandGeo, sandMat); sand.position.y = 0.04; sand.renderOrder = 2; sand.frustumCulled = false; mats.push(sandMat); root.add(sand);
  }
  await ctx.yield?.();

  // ===== anchors =====
  const fly = []; for (const s of [62, 48, 34, 20, 8, 0]) fly.push(camAt(s));
  const anchors = {
    portalSeat: { position: [0, HUBY, 0], normal: [0, sT, cT], radius: 7, tiltDeg: 12 },
    flyThrough: fly, flyBeyond: camAt(-12),
    trackJoin: { position: railAt(TRACK_LEN), direction: [0, -sT, -cT] }, railDrop: RAIL_DROP,
    ringCenter: [0, HUBY, 0], ringRadius: R_OUT, clearRadius: 22.5,
    pier: { side: -1, edgeX: -32, deckY: 8 }, towerTop: [towerX, TW_H + 10.5, 0],
    viewpoints: { reveal: [70, 9, 230], lastClimb: [10, 47, 120], under: [22, 3, 46] },
    fireworks: [0, 78, -300],
  };

  const size = new THREE.Vector2();
  let lastT = null;
  return {
    object: root, radius: 36, height: 63, center: new THREE.Vector3(0, HUBY, 0), anchors,
    uniforms: shared,
    triangles: Math.round((rg.tris + sg.tris + NG * gondGeo.getAttribute('position').count / 3 + nB * 2) * (wantMirror ? 2 : 1)),
    setProgress(u) { progress = Math.min(1, Math.max(0, u || 0)); },
    setFlash(k) { flash = Math.min(0.25, Math.max(0, k || 0)); },
    update(dt, time, camera) {
      let d = Number.isFinite(dt) ? dt : (lastT === null ? 0 : time - lastT); lastT = time; d = Math.min(0.1, Math.max(0, d));
      const t = Math.min(1, Math.max(0, (progress - 0.85) / 0.15)), swell = t * t * (3 - 2 * t);
      rot += turnRate * d; chaseT += chaseDir * chaseK * (d / 9) * (1 + swell * 1.2);
      if (rot > 1e4 || rot < -1e4) rot %= TAU;
      ringGroup.rotation.z = rot; if (mirrorRing) mirrorRing.rotation.z = rot;
      shared.uRot.value = rot; shared.uChaseT.value = chaseT - Math.floor(chaseT); shared.uTime.value = time; shared.uSwell.value = swell; shared.uFlash.value = flash;
      if (ctx.renderer?.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); shared.uRes.value.copy(size); }
      root.getWorldPosition(shared.uOrigin.value);
      void camera;
    },
    dispose() { quad.dispose(); },
    ground: !wantSand, groundY: 0,
  };
}

export { Geo };
