// THE LONG LIBRARY hero set piece: THE ORRERY, a brass clockwork solar system for the rotunda.
//
// WHAT IT IS
//   A three-step marquetry plinth (27 m across, top at y=1.1) inside a low brass balustrade carries a
//   toothed ZODIAC RING 24 m across (blue enamel band, gold sigils and degree ticks) that turns on
//   rollers, driven by pinions, with spoked gear trains meshing and turning all over the plinth.
//   From the middle rises a moulded brass column of stacked sleeves; each sleeve throws a geared arm
//   (lattice or bar, with counterweight) out to a riser and a tilted yoke holding one of SIX enamelled
//   cloisonne planets (0.6-1.6 m) that orbit and spin; some carry moons. The column ends in a clawed
//   cradle holding the SUN: amber glass 3 m across at y=11 (emissive ~5, slow convection, halo),
//   banded by a brass cage. Above the sun a mast climbs to a crown at y~27 and carries a 52 m balance
//   beam (tapering lattice truss on stay rods) from whose tips hang the two OUTER GIANTS at 26 m
//   radius, y=19: one ringed (sphere 3 m, rings 7 m, tilted), one with a carousel of moons.
//   Everything is lit in-shader by its own sun (planets show a day side and a terminator), by the
//   oculus beam from above and by a procedural reflection of the rotunda (window rank on -X).
//
// SPACE   origin = centre of the rotunda floor (y=0), +Y up, front = +Z (the long hall; the camera
//   arrives from +Z flying toward -Z, the exit gallery and great doorway are at -Z). Windows / low sun
//   are on -X (the camera's left). radius ~30 (ring tips of the giants), height ~27.5.
//   Solid envelope: inner works stay inside r<=11.4 (y<12.5), the mast inside r<1 up to y=27.5, the
//   beam between y=20.6 and 23.5, the giants below it down to y=17 at r 22.5..29.6.
//   CLEAR FLIGHT ANNULUS: r=18, y=11 (>=6.6 m from inner planets, >=7 m under giants and beam).
//
// OPTS
//   palette      7 hex strings, brief order: [glass cream, stone cream, oak, walnut, enamel blue,
//                enamel red, brass/amber accent]
//   speed        clockwork speed multiplier (default 1; inner planet periods 40-240 s)
//   sunIntensity emissive of the glass sun (default 5)
//   passAt       path u at which the ringed giant is exactly over anchors.lane mid point (default 0.68)
//   outerSweep   radians the balance beam turns per unit of u once setProgress is in use (default 2.4)
//   rail         false to omit the balustrade (default true)
//
// API (besides the contract fields)
//   setProgress(u)  call every frame with path u: the outer beam's angle becomes a pure function of u
//                   so the ringed giant sweeps over the camera at opts.passAt. Until it is called the
//                   beam turns slowly on the clock. Inner planets and gears are ambient (time driven).
//   setSpeed(k)     clockwork speed.   setSun(intensity)   glass + light it throws.
//   setWindow(i)    window light intensity only (cheap, for cloud modulation every frame).
//   setLighting({ keyColor, keyIntensity, keyDir:[x,y,z], beamRadius, windowColor, windowIntensity,
//                 envLow, envMid, envHigh })  retint the in-shader light rig to the room.
//   giantPosition(i, out)  current local position of giant i (0 = ringed, 1 = mooned).
//
// ANCHORS (local space)
//   sun          (0,11,0): the amber sun; poi target, vanishing-point light from the hall
//   lane         { radius:18, height:11, fromAz, toAz }: the 120 degree arc, azimuth measured from +Z
//                toward +X (the camera swings to its right, orrery on its left)
//   flyThrough   ordered points: hall axis -> tangent onto the arc -> arc -> back onto the axis at the
//                exit doorway of the rotunda. >= 6.6 m from every moving part at all times.
//   portalSeat   { position (0,6.5,-117), facing (0,0,1), shape:'arch', width:9, height:13 }: the
//                great doorway at the end of the 85 m exit gallery (rotunda radius 32)
//   viewpoints   { hall, enter, orbitMid, leave }: camera positions for the brief's beats
//   oculus       { base (0,0,0), top (0,48,0), radius:4 }: beam axis (god rays, dove spiral)
//   doveSpiral   { center (0,15,0), radius:7, top:44 }: free air for the three doves
//   giants       { radius:26, height:19 }
//
// COST   88-100k triangles by seed, 3 draw calls (works, glass sun, halo), one 4096x64 canvas texture, no
//   lights, build 220-430 ms in the software harness. All motion is in the vertex shader (two nested
//   rotations per vertex), so update() only writes a handful of uniforms.
// LIGHT  self-lit custom shaders (linear HDR, scene fog aware); they ignore scene lights by design so
//   the piece matches the library's baked light rig. Wants a warm dim interior: honey haze, bloom
//   threshold ~0.9. Use setLighting to match the room's key colour and window side.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#f3d9a0', '#d6c9ab', '#7d5231', '#4a2c18', '#1f3a5a', '#6b1f1f', '#ffc45a'];
const SUN_Y = 11, SUN_R = 1.5, PLINTH_Y = 1.1, GIANT_R = 26, GIANT_Y = 19, BEAM_Y = 22.2;
const KIND = { METAL: 0, ENAMEL: 1, FLOOR: 2, STONE: 3, RING: 4, ZODIAC: 5 };

const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
const _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// matrix: translate, then yaw (about Y), optional tilt (Euler x,z applied before yaw) and scale
function M(x, y, z, yaw = 0, sc = 1, tx = 0, tz = 0) {
  const e = new THREE.Euler(tx, yaw, tz, 'YXZ');
  return new THREE.Matrix4().compose(V(x, y, z), _q.setFromEuler(e), typeof sc === 'number' ? _s.set(sc, sc, sc) : _s.set(sc[0], sc[1], sc[2]));
}
// maps a unit-height Y cylinder (centred) onto the segment a -> b
function between(a, b) {
  const d = b.clone().sub(a), len = d.length();
  _q.setFromUnitVectors(_up, d.multiplyScalar(1 / len));
  return new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), _q, _s.set(1, len, 1));
}
const NOANIM = { ax: [0, 1, 0], pv: [0, 0, 0], sp: 0, ph: 0, os: 0, op: 0, of: 0 };

// ---------------------------------------------------------------- merged, animated geometry builder
class Builder {
  constructor(noise, maxV = 130000, maxI = 420000) {
    this.noise = noise; this.n = 0; this.ni = 0;
    this.P = new Float32Array(maxV * 3); this.N = new Float32Array(maxV * 3); this.C = new Float32Array(maxV * 3);
    this.Mt = new Float32Array(maxV * 4); this.AX = new Float32Array(maxV * 3); this.PV = new Float32Array(maxV * 3);
    this.SP = new Float32Array(maxV * 2); this.OR = new Float32Array(maxV * 3); this.I = new Uint32Array(maxI);
    this.maxV = maxV; this.maxI = maxI;
  }
  // st: { c:Color, metal, rough, emis, kind, vary, vf }   an: animation record (see NOANIM)
  add(geo, m, st, an = NOANIM) {
    const pa = geo.attributes.position, na = geo.attributes.normal, ix = geo.index, cnt = pa.count;
    const icnt = ix ? ix.count : cnt;
    if (this.n + cnt > this.maxV || this.ni + icnt > this.maxI) { geo.dispose(); return; }
    const base = this.n, { P, N, C, Mt, AX, PV, SP, OR } = this, c = st.c, vary = st.vary ?? 0.1, vf = st.vf ?? 0.9;
    _nm.getNormalMatrix(m);
    for (let i = 0; i < cnt; i++) {
      const k = base + i, k3 = k * 3;
      _v.fromBufferAttribute(pa, i).applyMatrix4(m); _n.fromBufferAttribute(na, i).applyMatrix3(_nm).normalize();
      P[k3] = _v.x; P[k3 + 1] = _v.y; P[k3 + 2] = _v.z; N[k3] = _n.x; N[k3 + 1] = _n.y; N[k3 + 2] = _n.z;
      const f = vary ? 1 + vary * this.noise.n3(_v.x * vf, _v.y * vf + 7.3, _v.z * vf) : 1;
      C[k3] = c.r * f; C[k3 + 1] = c.g * f; C[k3 + 2] = c.b * f;
      Mt[k * 4] = st.metal ?? 1; Mt[k * 4 + 1] = st.rough ?? 0.3; Mt[k * 4 + 2] = st.emis ?? 0; Mt[k * 4 + 3] = st.kind ?? 0;
      AX[k3] = an.ax[0]; AX[k3 + 1] = an.ax[1]; AX[k3 + 2] = an.ax[2]; PV[k3] = an.pv[0]; PV[k3 + 1] = an.pv[1]; PV[k3 + 2] = an.pv[2];
      SP[k * 2] = an.sp; SP[k * 2 + 1] = an.ph; OR[k3] = an.os; OR[k3 + 1] = an.op; OR[k3 + 2] = an.of;
    }
    if (ix) { const a = ix.array; for (let i = 0; i < icnt; i++) this.I[this.ni + i] = base + a[i]; }
    else for (let i = 0; i < icnt; i++) this.I[this.ni + i] = base + i;
    this.n += cnt; this.ni += icnt; geo.dispose();
  }
  // tapered prism from a to b (r0 at a, r1 at b)
  bar(st, an, a, b, r0, r1 = r0, sides = 6, capped = false) {
    this.add(new THREE.CylinderGeometry(r1, r0, 1, sides, 1, !capped), between(a, b), st, an);
  }
  ball(st, an, p, r, w = 12, h = 8) { this.add(new THREE.SphereGeometry(r, w, h), M(p.x, p.y, p.z), st, an); }
  lathe(st, an, prof, seg, m) { this.add(new THREE.LatheGeometry(prof.map((q) => new THREE.Vector2(q[0], q[1])), seg), m, st, an); }
  finish() {
    const g = new THREE.BufferGeometry(), n = this.n, A = (arr, sz) => new THREE.BufferAttribute(arr.slice(0, n * sz), sz);
    g.setAttribute('position', A(this.P, 3)); g.setAttribute('normal', A(this.N, 3)); g.setAttribute('color', A(this.C, 3));
    g.setAttribute('aMat', A(this.Mt, 4)); g.setAttribute('aAxis', A(this.AX, 3)); g.setAttribute('aPivot', A(this.PV, 3));
    g.setAttribute('aSpin', A(this.SP, 2)); g.setAttribute('aOrbit', A(this.OR, 3));
    g.setIndex(new THREE.BufferAttribute(this.I.slice(0, this.ni), 1));
    g.boundingSphere = new THREE.Sphere(V(0, 13, 0), 34);
    return g;
  }
}

// ---------------------------------------------------------------- gear rim with real teeth (axis +Y, y in [0,th])
// pause: the build's ctx.yield (hands the page back between pieces; takes no random draw)
async function gearRimGeo(R, T, th, rimW, bottom, pause) {
  const P = [], N = [], I = [];
  const quad = (a, b, c, d, wx, wy, wz) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = P.length / 3, flip = nx * wx + ny * wy + nz * wz < 0;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    P.push(...a, ...b, ...c, ...d); for (let k = 0; k < 4; k++) N.push(nx, ny, nz);
    if (flip) I.push(i, i + 2, i + 1, i, i + 3, i + 2); else I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  const pitch = TAU * R / T, dep = pitch * 0.62, Ra = R + dep * 0.5, Rr = R - dep * 0.5, Ri = Rr - rimW;
  const fr = [0, 0.2, 0.5, 0.7], rr = [Rr, Ra, Ra, Rr], n = T * 4;
  const pt = (j, inner, y) => { const k = Math.floor(j / 4) % T, q = j % 4, a = (k + fr[q]) / T * TAU, r = inner ? Ri : rr[q]; return [Math.sin(a) * r, y, Math.cos(a) * r]; };
  for (let j = 0; j < n; j++) {
    if (j % 128 === 0) await pause?.();
    const j1 = (j + 1) % n, a = ((Math.floor(j / 4) + fr[j % 4] + 0.1) / T) * TAU, sx = Math.sin(a), sz = Math.cos(a);
    quad(pt(j, 1, th), pt(j, 0, th), pt(j1, 0, th), pt(j1, 1, th), 0, 1, 0);
    if (bottom) quad(pt(j, 1, 0), pt(j, 0, 0), pt(j1, 0, 0), pt(j1, 1, 0), 0, -1, 0);
    quad(pt(j, 0, 0), pt(j1, 0, 0), pt(j1, 0, th), pt(j, 0, th), sx, 0, sz);
    if (j % 2 === 0) { const j2 = (j + 2) % n; quad(pt(j, 1, 0), pt(j2, 1, 0), pt(j2, 1, th), pt(j, 1, th), -sx, 0, -sz); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  return { geo: g, Ri, Ra };
}

// A whole gear: toothed rim, web (spokes | disc | none), hub and arbor cap. `m` places its local frame
// (axis = local +Y); it spins about that axis at `speed` rad/s with tooth phase `phase`. pause: as in gearRimGeo.
async function addGear(B, m, R, T, th, st, hubSt, o = {}, pause) {
  const e = m.elements, ax = [e[4], e[5], e[6]], al = Math.hypot(ax[0], ax[1], ax[2]);
  const an = { ...(o.an || NOANIM), ax: ax.map((q) => q / al), pv: [e[12], e[13], e[14]], sp: o.speed || 0, ph: o.phase || 0 };
  const L = (mm) => m.clone().multiply(mm);
  const rimW = o.rimW ?? Math.max(0.05, R * 0.13), { geo, Ri } = await gearRimGeo(R, T, th, rimW, !!o.bottom, pause);
  await pause?.();
  B.add(geo, m, st, an);
  const hubR = o.hubR ?? Math.max(0.07, R * 0.2), web = o.web ?? 'spoke';
  if (web === 'spoke') {
    const ns = o.spokes ?? (R > 1.4 ? 6 : R > 0.7 ? 5 : 4);
    for (let k = 0; k < ns; k++) {
      const g = new THREE.CylinderGeometry(0.5, 0.82, 1, 4, 1, true); g.rotateY(Math.PI / 4);
      const len = Ri - hubR * 0.8, wid = Math.max(0.05, R * 0.16);
      B.add(g, L(new THREE.Matrix4().makeRotationY(k / ns * TAU).multiply(new THREE.Matrix4().makeTranslation(0, th * 0.5, hubR * 0.8 + len * 0.5))
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).multiply(new THREE.Matrix4().makeScale(wid, len, th * 0.75))), st, an);
    }
  } else if (web === 'disc') {
    B.lathe(st, an, [[Ri + 0.005, th * 0.78], [Ri * 0.94, th * 0.78], [Ri * 0.9, th * 0.5], [Ri * 0.6, th * 0.5], [Ri * 0.55, th * 0.72], [hubR, th * 0.72]], Math.min(48, Math.max(16, T)), m);
  }
  B.lathe(hubSt, an, [[hubR * 1.15, 0], [hubR * 1.15, th * 0.9], [hubR, th * 1.0], [hubR * 0.95, th * 1.35], [hubR * 0.5, th * 1.45], [hubR * 0.45, th * 1.85], [0.001, th * 1.9]], 10, m);
  return an;
}

// ---------------------------------------------------------------- shaders
const NOISE_GLSL = /* glsl */`
float h31(vec3 p){ p = fract(p*vec3(0.1031,0.1030,0.0973)); p += dot(p, p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm3(vec3 p){ float s = 0., a = 0.5; for(int i=0;i<4;i++){ s += a*vn3(p); p = p*2.03+vec3(1.7,9.2,3.1); a *= 0.5; } return s; }
`;

const WORKS_VERT = /* glsl */`
attribute vec4 aMat; attribute vec3 aAxis; attribute vec3 aPivot; attribute vec2 aSpin; attribute vec3 aOrbit;
uniform float uTime, uOuter; uniform mat4 uInv;
varying vec3 vPos, vN, vCol, vObj, vCam; varying vec4 vMat;
#include <fog_pars_vertex>
void main(){
  vec3 p = position - aPivot, n = normal;
  vObj = p;
  float a1 = aSpin.x*uTime + aSpin.y, c1 = cos(a1), s1 = sin(a1);
  p = p*c1 + cross(aAxis,p)*s1 + aAxis*dot(aAxis,p)*(1.-c1) + aPivot;
  n = n*c1 + cross(aAxis,n)*s1 + aAxis*dot(aAxis,n)*(1.-c1);
  float a2 = mix(aOrbit.x*uTime, uOuter, aOrbit.z) + aOrbit.y, c2 = cos(a2), s2 = sin(a2);
  p = vec3(p.x*c2 + p.z*s2, p.y, p.z*c2 - p.x*s2);
  n = vec3(n.x*c2 + n.z*s2, n.y, n.z*c2 - n.x*s2);
  vPos = p; vN = n; vCol = color; vMat = aMat;
  vCam = (uInv * vec4(cameraPosition, 1.)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WORKS_FRAG = /* glsl */`
precision highp float;
uniform vec3 uEnvLow, uEnvMid, uEnvHigh, uKeyCol, uKeyDir, uWinCol, uSunCol, uOak, uWalnut, uCream, uGold;
uniform float uKeyI, uWinI, uWinSide, uSunI, uBeamR, uTime;
uniform sampler2D uGlyph;
varying vec3 vPos, vN, vCol, vObj, vCam; varying vec4 vMat;
#include <fog_pars_fragment>
${NOISE_GLSL}
vec3 envMap(vec3 d, float rough){
  float up = d.y, soft = 0.02 + rough*0.5;
  vec3 c = mix(uEnvLow, uEnvMid, smoothstep(-0.7, 0.0, up));
  c = mix(c, uEnvHigh, smoothstep(0.05, 0.75, up));
  // coffer rows of the dome and book-stack banding of the drum: only crisp in polished metal
  float az = atan(d.z, d.x);
  c *= 1. - (1.-rough)*0.35*smoothstep(0.2,0.4,up)*step(0.5, fract(az*24./6.2832))*step(0.45, fract(up*9.));
  c *= 1. - (1.-rough)*0.25*(1.-smoothstep(0.0,0.25,abs(up)))*step(0.55, fract(az*40./6.2832));
  // oculus
  c += uKeyCol * (uKeyI*2.6/(1.+rough*8.)) * smoothstep(0.984 - soft*0.3, 0.996, up);
  // rank of tall arched windows on one side
  float sx = -d.x*uWinSide, inv = 1./max(0.25, sx);
  float w = abs(fract(d.z*inv*1.5 + 0.5) - 0.5), e = up*inv;
  float win = smoothstep(0.33 + soft*0.3, 0.27, w) * smoothstep(0.16 - soft*0.3, 0.24, e) * smoothstep(1.02 - w*w*2.6 + soft*0.3, 0.92 - w*w*2.6, e);
  win *= mix(1., 0.25 + 0.75*step(0.14, fract(e*4.5))*step(0.16, fract(d.z*inv*4.5 + 0.5)), 1.-rough);   // glazing bars
  c += uWinCol * (uWinI/(1.+rough*3.5)) * win * smoothstep(0.05, 0.35, sx);
  // green-shaded reading lamps low on the shadow side
  float lamp = pow(max(0., sin(az*17.)), 24.) * smoothstep(0.07, 0.0, abs(up + 0.06)) * smoothstep(0.1, 0.4, -sx);
  c += vec3(0.5, 1.2, 0.55) * lamp * (1.-rough);
  return c;
}
void main(){
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 Vv = normalize(vCam - vPos);
  vec3 alb = vCol; float metal = vMat.x, rough = vMat.y, kind = vMat.w, emis = vMat.z;
  float ao = mix(0.62, 1., smoothstep(0.6, 4.5, vPos.y));
  if (kind < 0.5) {                                   // brass, bronze, steel: patina + brushed breakup
    float pat = fbm3(vObj*3.1 + 4.);
    float streak = vn3(vObj*vec3(26., 3., 26.));
    alb *= 0.74 + 0.38*pat; rough = clamp(rough + (pat-0.5)*0.28 + (streak-0.5)*0.1, 0.08, 0.9);
    alb = mix(alb, alb*vec3(0.55,0.5,0.42), smoothstep(0.62, 0.8, pat)*0.6);
  } else if (kind < 1.5) {                            // cloisonne enamel planet; vMat.z = style seed
    vec3 q = normalize(vObj); float sd = emis; emis = 0.;
    float f, wire;
    if (sd > 0.7) {                                   // banded giant: soft turbulent belts, one gold wire per belt
      f = abs(fract(q.y*(1.6+sd*2.4) + 0.3*fbm3(q*vec3(2.,6.,2.)+sd*31.)) - 0.5)*2.;
      wire = 1. - smoothstep(0.02, 0.05, abs(f - 0.5));
      float sw = fbm3(q*vec3(5.,16.,5.) + sd*9.);
      alb = mix(alb*0.5, mix(alb, uCream*0.85, 0.6), smoothstep(0.42, 0.58, f)) * (0.8 + 0.4*sw);
    } else {                                          // continents: three enamel tones fenced by gold wire
      f = fbm3(q*(1.7+sd*2.6) + sd*57.);
      wire = 1. - smoothstep(0.012, 0.03, abs(f - 0.5));
      wire = max(wire, 1. - smoothstep(0.01, 0.024, abs(f - 0.34)));
      vec3 hi = mix(alb, uCream*0.85, 0.6), lo = alb*0.3;
      alb = mix(lo, alb, smoothstep(0.33, 0.35, f)); alb = mix(alb, hi, smoothstep(0.49, 0.51, f));
      alb *= 0.85 + 0.3*vn3(q*14.);
    }
    metal = wire; alb = mix(alb, uGold, wire); rough = mix(0.16, 0.3, wire);
  } else if (kind < 2.5) {                            // plinth: marquetry on treads, veined stone on risers
    float r = length(vObj.xz), th = atan(vObj.z, vObj.x);
    if (N.y > 0.7) {
      float ringI = floor(r/1.72);
      float wedge = step(0.5, fract(th*24./6.2832 + ringI*0.5));
      float grain = vn3(vec3(r*9., th*r*1.2, ringI*7.)) * 0.5 + vn3(vec3(r*38., th*r*3., 1.))*0.5;
      alb = mix(uOak, uWalnut, wedge) * (0.7 + 0.5*grain);
      float star = abs(fract(th*12./6.2832) - 0.5)*2.;
      float sr = mix(3.4, 10.0, pow(1.-star, 1.6));
      float inS = smoothstep(sr, sr-0.06, r) * smoothstep(2.3, 2.36, r);
      alb = mix(alb, mix(uCream*0.62, uWalnut*0.7, step(0.5, fract(th*12./6.2832)))*(0.8+0.3*grain), inS);
      float ln = min(min(abs(r-2.3), abs(r-10.25)), min(abs(r-12.72), abs(r-13.45)));
      ln = min(ln, abs(r - sr) + (1.-step(2.3, r))*9.);
      float brass = 1. - smoothstep(0.035, 0.06, ln);
      alb = mix(alb, uGold*0.9, brass); metal = brass; rough = mix(0.34, 0.3, brass);
      ao *= mix(0.5, 1., smoothstep(1.2, 3.4, r));
    } else {
      float v = fbm3(vObj*vec3(1.3, 5., 1.3));
      alb *= 0.8 + 0.25*v; alb = mix(alb, uWalnut, smoothstep(0.03, 0.0, abs(v-0.5))*0.5); rough = 0.4; metal = 0.;
    }
  } else if (kind < 4.5 && kind > 3.5) {              // planetary ring: grooves and real gaps
    float t = (length(vObj) - 1.95)/1.6;
    float gap = step(abs(t-0.58), 0.035) + step(abs(t-0.2), 0.012) + step(abs(t-0.86), 0.015);
    if (gap > 0.5 || t < 0. || t > 1.) discard;
    float g = vn3(vec3(t*42., 0., 0.));
    alb *= 0.6 + 0.7*g; rough = 0.25 + 0.3*g;
  } else if (kind > 4.5) {                            // zodiac band: gold sigils and ticks in blue enamel
    float r = length(vObj.xz), th = atan(vObj.z, vObj.x);
    float m = texture2D(uGlyph, vec2(th/6.2832, 1. - (r - 10.72)/0.96)).r;
    m = smoothstep(0.35, 0.6, m);
    alb = mix(alb*(0.8+0.4*vn3(vObj*5.)), uGold, m); metal = m; rough = mix(0.14, 0.3, m);
  }
  float nv = max(dot(N, Vv), 0.);
  vec3 F0 = mix(vec3(0.04), alb, metal);
  vec3 F = F0 + (max(vec3(1.-rough), F0) - F0)*pow(1.-nv, 5.);
  vec3 dif = alb*(1.-metal);
  vec3 col = envMap(reflect(-Vv, N), rough)*F*ao;
  vec3 irr = mix(uEnvLow, uEnvHigh, N.y*0.5+0.5)*1.25 + uWinCol*uWinI*0.09*max(0., -N.x*uWinSide*0.8 + 0.2);
  col += dif*irr*ao;
  float sh = mix(500., 9., sqrt(rough));
  // oculus beam (key): full strength inside the shaft, a little everywhere
  float beam = 0.2 + 0.8*(1. - smoothstep(uBeamR, uBeamR*2.1, length(vPos.xz)));
  float nlk = max(dot(N, uKeyDir), 0.);
  float sk = min(pow(max(dot(N, normalize(uKeyDir + Vv)), 0.), sh)*(sh+8.)/25., 7.);
  col += uKeyCol*uKeyI*beam*nlk*(dif + F*sk);
  // the glass sun as a point light
  vec3 Ls = vec3(0., ${SUN_Y.toFixed(1)}, 0.) - vPos; float d2 = dot(Ls, Ls); Ls *= inversesqrt(d2);
  float att = uSunI/(1. + d2*0.013);
  float nls = max(dot(N, Ls), 0.);
  float ss = min(pow(max(dot(N, normalize(Ls + Vv)), 0.), sh)*(sh+8.)/25., 7.);
  col += uSunCol*att*(dif*(nls*0.85 + 0.03) + F*ss*nls*0.8 + F0*metal*nls*0.22);
  col += alb*emis;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const SUN_VERT = /* glsl */`
varying vec3 vO, vNw, vW;
#include <fog_pars_vertex>
void main(){
  vO = position; vNw = normalize(mat3(modelMatrix)*normal);
  vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SUN_FRAG = /* glsl */`
precision highp float;
uniform vec3 uCol, uDeep; uniform float uI, uTime;
varying vec3 vO, vNw, vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  vec3 N = normalize(vNw), Vv = normalize(cameraPosition - vW);
  float mu = max(dot(N, Vv), 0.);
  vec3 q = vO*1.5; float t = uTime*0.07;
  float f = fbm3(q + vec3(0., -t, t*0.6) + 1.4*fbm3(q*0.8 - t*0.5));
  float cell = smoothstep(0.32, 0.72, f);
  float pulse = 0.93 + 0.07*sin(uTime*0.9);
  vec3 c = mix(uDeep*0.62, uCol, cell) * (0.42 + 0.5*mu);        // convection seen through thick amber glass
  c += uCol*pow(mu, 2.5)*0.55;                                   // inner glow: the globe is a lamp, lit from within
  c += vec3(1., 0.8, 0.5)*pow(mu, 7.)*0.55;                      // hot heart
  c += mix(uDeep, uCol, 0.35)*pow(1.-mu, 3.)*0.45;               // glowing rim
  float seam = smoothstep(0.02, 0.0, abs(fract(atan(vO.z, vO.x)*6./6.2832) - 0.5) - 0.48);
  c *= 1. - 0.35*seam;                                           // blown-glass gore seams
  gl_FragColor = vec4(c*uI*pulse, 1.);
  #include <fog_fragment>
}`;
const HALO_VERT = /* glsl */`
uniform float uSize; varying vec2 vUv; varying float vDepth;
void main(){ vUv = uv*2.-1.; vec4 mv = modelViewMatrix*vec4(0.,0.,0.,1.); mv.xy += position.xy*uSize; vDepth = -mv.z; gl_Position = projectionMatrix*mv; }`;
const HALO_FRAG = /* glsl */`
precision highp float;
uniform vec3 uCol; uniform float uI, uTime, uFogK; varying vec2 vUv; varying float vDepth;
void main(){
  float r = length(vUv); if (r > 1.) discard;
  float a = atan(vUv.y, vUv.x);
  float g = (1./(1.+34.*r*r) - 1./35.)*0.6*(1.-r*r);
  g += pow(1.-r, 4.)*0.06*(0.5+0.5*sin(a*12. + uTime*0.15))*(0.5+0.5*sin(a*5. - uTime*0.1));
  g *= 0.94 + 0.06*sin(uTime*0.9);
  gl_FragColor = vec4(uCol*uI*g*exp(-vDepth*uFogK), 1.);
}`;

// ---------------------------------------------------------------- zodiac strip texture (mask: gold where white)
function makeGlyphTexture(rng) {
  const W = 4096, H = 64, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
  g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  for (let i = 0; i < 360; i++) {                       // degree ticks on the outer edge, long every 5 and 10
    const x = (i / 360) * W, l = i % 30 === 0 ? 0 : i % 10 === 0 ? 15 : i % 5 === 0 ? 11 : 7;
    if (l) g.fillRect(x - 1.2, H - 4 - l, 2.6, l);
    if (i % 10 === 5) { g.beginPath(); g.arc(x, 9, 1.8, 0, TAU); g.fill(); }
  }
  const cell = W / 12;
  for (let s = 0; s < 12; s++) {                        // twelve invented sigils built from astrological strokes
    const cx = (s + 0.5) * cell, cy = 26, r = 19;
    g.fillRect(s * cell - 1.5, 0, 3, H);                // house divider
    for (const dx of [-cell * 0.2, cell * 0.2, -cell * 0.36, cell * 0.36]) { const q = Math.abs(dx) > cell * 0.3 ? 6 : 11, x = cx + dx; g.beginPath(); g.moveTo(x, cy - q); g.quadraticCurveTo(x, cy, x + q, cy); g.quadraticCurveTo(x, cy, x, cy + q); g.quadraticCurveTo(x, cy, x - q, cy); g.quadraticCurveTo(x, cy, x, cy - q); g.fill(); }
    g.lineWidth = 4.4;
    const parts = 2 + (rng() < 0.5 ? 1 : 0), used = new Set();
    for (let k = 0; k < parts; k++) {
      let t = rng.int(0, 7); while (used.has(t)) t = (t + 1) % 8; used.add(t);
      g.beginPath();
      if (t === 0) g.arc(cx, cy, r * 0.55, 0, TAU);
      else if (t === 1) { g.moveTo(cx, cy - r); g.lineTo(cx, cy + r); g.moveTo(cx - r * 0.6, cy + r * 0.45); g.lineTo(cx + r * 0.6, cy + r * 0.45); }
      else if (t === 2) { g.arc(cx - r * 0.55, cy - r * 0.5, r * 0.55, 0, Math.PI); g.moveTo(cx + r * 1.1, cy - r * 0.5); g.arc(cx + r * 0.55, cy - r * 0.5, r * 0.55, 0, Math.PI); }
      else if (t === 3) g.arc(cx + r * 0.35, cy, r * 0.9, Math.PI * 0.6, Math.PI * 1.4);
      else if (t === 4) { g.moveTo(cx - r, cy + r * 0.9); g.quadraticCurveTo(cx - r * 0.5, cy + r * 0.3, cx, cy + r * 0.9); g.quadraticCurveTo(cx + r * 0.5, cy + r * 1.5, cx + r, cy + r * 0.9); }
      else if (t === 5) { g.moveTo(cx - r * 0.8, cy + r * 0.7); g.lineTo(cx + r * 0.8, cy - r * 0.8); g.lineTo(cx + r * 0.15, cy - r * 0.8); g.moveTo(cx + r * 0.8, cy - r * 0.8); g.lineTo(cx + r * 0.8, cy - r * 0.15); }
      else if (t === 6) { g.moveTo(cx - r * 0.8, cy - r * 0.9); g.lineTo(cx + r * 0.8, cy - r * 0.9); g.moveTo(cx - r * 0.5, cy - r * 0.9); g.lineTo(cx - r * 0.5, cy + r * 0.6); g.moveTo(cx + r * 0.5, cy - r * 0.9); g.lineTo(cx + r * 0.5, cy + r * 0.6); }
      else { g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.8, cy + r * 0.6); g.lineTo(cx - r * 0.8, cy + r * 0.6); g.closePath(); }
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  return tex;
}

// ================================================================= the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('orrery'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cGlass, cStone, cOak, cWalnut, cBlue, cRed, cAccent] = pal;
  const B = new Builder(noise);
  await ctx.yield?.();

  // ----- metals (per-seed alloy: yellow brass ... rosier gilding metal)
  const rose = rng.range(0, 1);
  const brass = cAccent.clone().lerp(new THREE.Color(1.0, 0.86 - rose * 0.08, 0.56 - rose * 0.1), rng.range(0.4, 0.6));
  const bronze = brass.clone().multiply(new THREE.Color(0.62, 0.5, 0.4));
  const steel = cBlue.clone().lerp(new THREE.Color(0.55, 0.6, 0.68), 0.55);
  const copper = new THREE.Color(0.95, 0.5, 0.3).lerp(cRed, 0.15);
  const BR = { c: brass, metal: 1, rough: 0.24, kind: KIND.METAL, vary: 0 };
  const BRP = { ...BR, rough: 0.14 };                           // polished
  const BZ = { c: bronze, metal: 1, rough: 0.46, kind: KIND.METAL, vary: 0 };
  const ST = { c: steel, metal: 1, rough: 0.3, kind: KIND.METAL, vary: 0 };
  const CU = { c: copper, metal: 1, rough: 0.3, kind: KIND.METAL, vary: 0 };
  const gearMats = [BR, BR, BR, BZ, CU, ST];
  const dir = rng.sign();                                                   // which way the heavens turn

  // ----- plinth: three marquetry steps
  B.lathe({ c: cStone.clone().multiplyScalar(0.62), metal: 0, rough: 0.4, kind: KIND.FLOOR, vary: 0.06 }, NOANIM,
    [[14.9, 0], [14.9, 0.3], [14.84, 0.36], [14.3, 0.36], [14.3, 0.68], [14.24, 0.74], [13.7, 0.74], [13.7, 1.04], [13.64, PLINTH_Y], [2.2, PLINTH_Y], [0.01, PLINTH_Y]], 96, M(0, 0, 0));
  await ctx.yield?.();
  B.lathe(BR, NOANIM, [[14.93, 0.27], [14.96, 0.31], [14.93, 0.35], [14.84, 0.365]], 96, M(0, 0, 0));
  B.lathe(BR, NOANIM, [[13.73, 1.0], [13.76, 1.05], [13.72, 1.1], [13.62, 1.105]], 96, M(0, 0, 0));

  // ----- balustrade: four arcs with newels, open on the two axes (scale cue: the rail is 1.05 m high)
  if (opts.rail !== false) {
    const RR = 15.9, gap = 0.17, nPer = 17;
    for (let qd = 0; qd < 4; qd++) {
      await ctx.yield?.();
      const a0 = qd * TAU / 4 + gap, a1 = (qd + 1) * TAU / 4 - gap;
      for (const [y, tr] of [[1.05, 0.065], [0.16, 0.04]]) {
        const g = new THREE.TorusGeometry(RR, tr, 6, 40, a1 - a0); g.rotateX(Math.PI / 2);   // arc now runs from azimuth 90deg back toward 90deg - arc
        B.add(g, M(0, y, 0, a1 - Math.PI / 2), tr > 0.05 ? BRP : BR);
      }
      for (let i = 0; i <= nPer; i++) {
        const a = lerp(a0, a1, i / nPer), x = Math.sin(a) * RR, z = Math.cos(a) * RR, end = i === 0 || i === nPer;
        if (end) {
          B.lathe(BZ, NOANIM, [[0.17, 0], [0.17, 0.1], [0.11, 0.16], [0.1, 0.95], [0.15, 1.02], [0.15, 1.12], [0.06, 1.18], [0.13, 1.3], [0.1, 1.42], [0.001, 1.47]], 8, M(x, 0, z));
        } else {
          B.lathe(BR, NOANIM, [[0.05, 0.16], [0.03, 0.3], [0.075, 0.52], [0.03, 0.78], [0.045, 1.0]], 6, M(x, 0, z));
        }
      }
    }
  }
  await ctx.yield();

  // ----- zodiac ring: 24 m toothed annulus riding on the plinth, turned by pinions
  const ZT = 192, ZR = 12, zw = 0.02 * dir, zy = PLINTH_Y + 0.2, zth = 0.3, zph = rng.range(0, TAU);
  const zAn = await addGear(B, M(0, zy, 0), ZR, ZT, zth, BR, BZ, { speed: zw, phase: zph, web: 'none', rimW: 1.55, hubR: 0.01, bottom: false }, ctx.yield);
  await ctx.yield?.();
  { const g = new THREE.RingGeometry(10.72, 11.68, 192, 1); g.rotateX(-Math.PI / 2);
    B.add(g, M(0, zy + zth + 0.012, 0), { c: cBlue.clone().lerp(new THREE.Color(0.02, 0.09, 0.3), 0.5), metal: 0, rough: 0.14, kind: KIND.ZODIAC, vary: 0 }, zAn);
    for (const r of [10.7, 11.7, 10.36]) { await ctx.yield?.(); const t = new THREE.TorusGeometry(r, 0.035, 4, 128); t.rotateX(Math.PI / 2); B.add(t, M(0, zy + zth + 0.01, 0), BRP, zAn); }
    await ctx.yield?.();
    for (let i = 0; i < 12; i++) {                     // a domed stud at every house boundary
      const a = i / 12 * TAU + 0.004;
      B.lathe(BRP, zAn, [[0.12, 0], [0.11, 0.04], [0.07, 0.1], [0.001, 0.12]], 8, M(Math.cos(a) * 10.53, zy + zth, Math.sin(a) * 10.53));
    }
  }
  // meshing helper: phase for gear B (teeth TB) driven by gear A (phase thA, teeth TA) in direction phi from A
  const meshPhase = (thA, TA, TB, phi) => { const tA = ((TA * (phi - thA) / TAU) % 1 + 1) % 1; return phi + Math.PI - TAU * (0.2 - tA) / TB; };
  const nPin = rng.int(3, 4), pin0 = rng.range(0, TAU);
  for (let i = 0; i < nPin; i++) {
    const a = pin0 + (i + rng.range(-0.15, 0.15)) * TAU / nPin, T = 12, R = ZR * T / ZT, d = ZR + R + 0.012;
    const x = Math.sin(a) * d, z = Math.cos(a) * d, w = -zw * ZT / T;
    await addGear(B, M(x, zy, z), R, T, zth, CU, ST, { speed: w, phase: meshPhase(zph, ZT, T, a), web: 'disc', hubR: 0.2 }, ctx.yield);
    B.lathe(BZ, NOANIM, [[0.5, PLINTH_Y], [0.46, PLINTH_Y + 0.1], [0.3, PLINTH_Y + 0.17]], 12, M(x, 0, z));
    await addGear(B, M(x, zy + zth + 0.14, z), 0.42, 14, 0.1, BR, ST, { speed: w, phase: rng.range(0, 6), web: 'spoke', spokes: 3, hubR: 0.1, bottom: true }, ctx.yield);
  }
  await ctx.yield?.();
  for (let i = 0; i < 8; i++) {                         // guide rollers on the inner edge
    const a = (i + 0.5) / 8 * TAU, x = Math.sin(a) * 10.12, z = Math.cos(a) * 10.12;
    B.lathe(ST, NOANIM, [[0.16, PLINTH_Y], [0.1, PLINTH_Y + 0.06], [0.07, zy + 0.02], [0.2, zy + 0.06], [0.2, zy + zth - 0.04], [0.07, zy + zth], [0.07, zy + zth + 0.1], [0.001, zy + zth + 0.14]], 10, M(x, 0, z));
  }
  await ctx.yield();

  // ----- gear trains on the plinth, driven from a great wheel on the column
  const pitch = 0.3, gy = PLINTH_Y + 0.1, placed = [];
  const fitR = (R) => { const T = Math.max(8, Math.round(TAU * R / pitch)); return [T * pitch / TAU, T]; };
  const [R0, T0] = fitR(2.05), w0 = 0.22 * -dir, ph0 = rng.range(0, TAU);
  await addGear(B, M(0, gy, 0), R0, T0, 0.2, BR, BZ, { speed: w0, phase: ph0, web: 'disc', hubR: 1.3 }, ctx.yield);
  placed.push([0, 0, R0 + 0.12]);
  const nCh = rng.int(5, 7), ch0 = rng.range(0, TAU);
  for (let c = 0; c < nCh; c++) {
    let px = 0, pz = 0, pR = R0, pT = T0, pw = w0, pph = ph0, phi = ch0 + (c + rng.range(-0.18, 0.18)) * TAU / nCh;
    for (let k = 0; k < 9; k++) {
      let ok = false, x, z, R, T;
      for (let tr = 0; tr < 7 && !ok; tr++) {
        const far = Math.hypot(px, pz);
        [R, T] = fitR(rng.range(0.55, far > 4.5 ? 1.9 : 1.25) * (tr > 3 ? 0.7 : 1));
        const a = k ? Math.atan2(px, pz) + rng.range(-0.85, 0.85) : phi, d = pR + R + 0.006;
        x = px + Math.sin(a) * d; z = pz + Math.cos(a) * d;
        ok = Math.hypot(x, z) + R < 10.0;
        for (const q of placed) if (Math.hypot(x - q[0], z - q[1]) < R + q[2] + 0.1 && !(q[0] === px && q[1] === pz)) ok = false;
        if (ok) phi = a;
      }
      if (!ok) break;
      const w = -pw * pT / T, ph = meshPhase(pph, pT, T, phi), st = rng.pick(gearMats), th = rng.range(0.13, 0.2);
      await addGear(B, M(x, gy, z), R, T, th, st, st === ST ? BR : ST, { speed: w, phase: ph, web: R > 0.8 && rng.chance(0.75) ? 'spoke' : 'disc', bottom: false }, ctx.yield);
      placed.push([x, z, R + 0.1]);
      B.lathe(BZ, NOANIM, [[R * 0.3 + 0.1, PLINTH_Y], [R * 0.26 + 0.08, PLINTH_Y + 0.07], [R * 0.2, gy]], 10, M(x, 0, z));
      if (R > 0.75 && rng.chance(0.7)) {                // compound: a co-axial pinion (and sometimes a third tier)
        const [r2, t2] = fitR(R * rng.range(0.3, 0.5)), st2 = rng.pick(gearMats);
        await addGear(B, M(x, gy + th + 0.07, z), r2, t2, 0.14, st2, ST, { speed: w, phase: rng.range(0, 6), web: 'disc', bottom: true }, ctx.yield);
        if (rng.chance(0.4)) B.lathe(BRP, { ...NOANIM, pv: [x, 0, z], sp: w }, [[0.05, 0.3], [0.05, 0.52], [0.12, 0.6], [0.09, 0.7], [0.001, 0.75]], 8, M(x, gy + th, z));
      }
      px = x; pz = z; pR = R; pT = T; pw = w; pph = ph;
    }
  }
  await ctx.yield();

  // ----- column of stacked sleeves, one collar per planet arm; cradle and claws for the sun
  const NP = 6, armY = [], prof = [[1.3, PLINTH_Y], [1.3, 1.5], [1.34, 1.56], [1.22, 1.66], [1.0, 1.7], [0.84, 1.95], [0.72, 2.4], [0.66, 2.6]];
  const shaftR = (y) => lerp(0.58, 0.3, clamp((y - 2.6) / 6.6, 0, 1));
  for (let i = NP - 1; i >= 0; i--) {                   // outermost planet hangs from the lowest sleeve
    const h = 8.55 - i * 1.04; armY[i] = h; const r = shaftR(h);
    prof.push([r, h - 0.36], [r + 0.13, h - 0.3], [r + 0.2, h - 0.13], [r + 0.2, h + 0.13], [r + 0.13, h + 0.3], [r, h + 0.36], [r - 0.04, h + 0.5]);
  }
  prof.push([0.3, 9.07], [0.42, 9.12], [0.72, 9.3], [0.96, 9.56], [0.97, 9.64], [0.9, 9.66], [0.62, 9.5], [0.2, 9.44]);
  B.lathe(BR, NOANIM, prof, 24, M(0, 0, 0));
  await ctx.yield?.();
  for (let i = 0; i < 3; i++) {                         // three vertical take-off wheels on the pedestal
    const a = i / 3 * TAU + ch0, m = new THREE.Matrix4().makeRotationY(a).multiply(new THREE.Matrix4().makeTranslation(0, 2.9, 0.78)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    await addGear(B, m, 0.62, 18, 0.12, i === 1 ? CU : BR, ST, { speed: 0.9 * dir * (i % 2 ? -1 : 1), phase: i, web: 'spoke', spokes: 4, bottom: true }, ctx.yield);
  }
  const nClaw = rng.int(5, 8);
  for (let i = 0; i < nClaw; i++) {
    await ctx.yield?.();
    const a = i / nClaw * TAU, pts = [];
    for (let k = 0; k <= 6; k++) { const el = lerp(-1.18, -0.2, k / 6), rr = SUN_R + 0.07 + (k === 0 ? 0.04 : 0); pts.push(V(Math.sin(a) * Math.cos(el) * rr, SUN_Y + Math.sin(el) * rr, Math.cos(a) * Math.cos(el) * rr)); }
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.055, 5, false), M(0, 0, 0), BR);
    B.ball(BRP, NOANIM, pts[6], 0.1, 8, 6);
  }
  await ctx.yield?.();
  { // cage around the glass: equator band, two meridians, polar caps
    const eq = new THREE.TorusGeometry(SUN_R + 0.05, 0.05, 6, 48); eq.rotateX(Math.PI / 2); B.add(eq, M(0, SUN_Y, 0), BRP);
    const ma = rng.range(0, Math.PI);
    for (let i = 0; i < 2; i++) { const t = new THREE.TorusGeometry(SUN_R + 0.05, 0.035, 5, 48); B.add(t, M(0, SUN_Y, 0, ma + i * Math.PI / 2), BR); }
    B.lathe(BR, NOANIM, [[0.5, -0.1], [0.44, 0.0], [0.2, 0.1], [0.16, 0.5], [0.24, 0.62], [0.2, 0.9]], 14, M(0, SUN_Y + SUN_R, 0));
  }
  await ctx.yield();

  // ----- six inner planets on geared arms (built along +Z, placed by the orbit animation)
  const rich = (c, lo = 0.13, hi = 0.36) => { const h = {}; c.getHSL(h); return new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.1 + 0.05), clamp(h.l * 2.2, lo, hi)); };
  const enamels = rng.shuffle([rich(cBlue), rich(cRed), rich(new THREE.Color('#2f6b4a')), cGlass.clone().multiplyScalar(0.7), rich(cAccent.clone().multiplyScalar(0.6)),
    rich(cBlue.clone().lerp(new THREE.Color('#3f9a96'), 0.6)), rich(cRed.clone().lerp(cOak, 0.5)), rich(cBlue.clone().lerp(cRed, 0.5))]);
  const moonSt = { c: cStone.clone().multiplyScalar(0.8), metal: 0, rough: 0.45, kind: KIND.METAL, vary: 0.2, vf: 6 };
  let prevR = 0.2;
  for (let i = 0; i < NP; i++) {
    await ctx.yield?.();
    const ro = 3.1 + i * 1.42 + rng.range(-0.12, 0.12) * (i < NP - 1 ? 1 : 0), ay = armY[i];
    let pr = i === 0 ? rng.range(0.3, 0.42) : rng.range(0.32, 0.8); pr = Math.min(pr, 1.3 - prevR); if (i === NP - 1) pr = Math.min(pr, 11 - ro); prevR = pr;
    const py = SUN_Y + (i % 2 ? -1 : 1) * rng.range(0.3, 0.5), w = dir * 0.16 * Math.pow(3.1 / ro, 1.5), ph = rng.range(0, TAU);
    const an = { ...NOANIM, os: w, op: ph }, r0 = shaftR(ay) + 0.16, lattice = i >= 2 && rng.chance(0.7), st = rng.chance(0.25) ? BZ : BR;
    if (lattice) {
      const w0 = 0.2, w1 = 0.07;
      for (const sx of [-1, 1]) B.bar(st, an, V(sx * w0, ay, r0 - 0.1), V(sx * w1, ay, ro), 0.05, 0.035, 6);
      const nr = Math.round((ro - r0) / 0.55);
      for (let k = 1; k < nr; k++) { const t = k / nr, z = lerp(r0, ro, t), ww = lerp(w0, w1, t); B.bar(ST, an, V(-ww, ay, z), V(ww, ay, z), 0.022, 0.022, 4);
        if (k % 2) B.bar(st, an, V(-ww, ay, z), V(lerp(w0, w1, (k + 1) / nr), ay, lerp(r0, ro, (k + 1) / nr)), 0.018, 0.018, 4); }
    } else {
      const g = new THREE.CylinderGeometry(0.5, 1, 1, 4, 1, true); g.rotateY(Math.PI / 4);
      B.add(g, between(V(0, ay, r0 - 0.1), V(0, ay, ro)).multiply(new THREE.Matrix4().makeScale(0.2, 1, 0.09)), st, an);
      for (let k = 1; k <= 3; k++) B.ball(BRP, an, V(0, ay, lerp(r0, ro, k / 4)), 0.09 - k * 0.012, 8, 6);
    }
    // counterweight
    const cw = rng.range(1.1, 2.1);
    B.bar(st, an, V(0, ay, -r0 + 0.1), V(0, ay, -cw), 0.05, 0.035, 6);
    if (rng.chance(0.5)) B.ball(BZ, an, V(0, ay, -cw - 0.12), rng.range(0.2, 0.3), 12, 8);
    else B.lathe(BZ, an, [[0.001, -0.09], [0.26, -0.07], [0.32, 0], [0.26, 0.07], [0.001, 0.09]], 12, M(0, ay, -cw - 0.2));
    // knuckle, tip gear, riser with collars
    B.ball(BRP, an, V(0, ay, ro), 0.13, 10, 8);
    await addGear(B, M(0, ay - 0.2, ro), 0.3, 12, 0.07, CU, ST, { an, speed: -w * 9, phase: i, web: 'disc', bottom: true, hubR: 0.07 }, ctx.yield);
    const top = py - pr - 0.14;
    B.bar(BR, an, V(0, ay, ro), V(0, top, ro), 0.065, 0.04, 6);
    B.bar(st, an, V(0, ay, ro - 0.7), V(0, Math.min(top - 0.1, ay + 0.7), ro), 0.03, 0.022, 5);
    for (const t of [0.3, 0.7]) B.lathe(BRP, an, [[0.04, -0.07], [0.085, -0.03], [0.085, 0.03], [0.04, 0.07]], 8, M(0, lerp(ay, top, t), ro));
    await ctx.yield?.();
    // tilted meridian ring, axis pins, planet
    const tilt = rng.range(0.15, 0.5) * rng.sign(), axv = [Math.sin(tilt), Math.cos(tilt), 0], mr = pr + 0.13;
    B.add(new THREE.TorusGeometry(mr, 0.028, 5, 28), M(0, py, ro), BRP, an);
    for (const s of [-1, 1]) B.ball(ST, an, V(axv[0] * mr * s, py + axv[1] * mr * s, ro), 0.05, 6, 5);
    B.add(new THREE.SphereGeometry(pr, 28, 18), M(0, py, ro, 0, 1, 0, -tilt),
      { c: enamels[i], metal: 0, rough: 0.16, emis: rng(), kind: KIND.ENAMEL, vary: 0 }, { ...an, ax: axv, pv: [0, py, ro], sp: rng.range(0.25, 0.6) * rng.sign() });
    // moons on a wire carrier turning under the planet
    const nm = i > 0 && pr > 0.4 && pr < 0.72 ? rng.int(0, 2) : 0;
    for (let k = 0; k < nm; k++) {
      const man = { ...an, ax: [0, 1, 0], pv: [0, py, ro], sp: rng.range(0.5, 1.1) * dir, ph: rng.range(0, TAU) }, md = pr + 0.32 + k * 0.14, my = top + 0.04 - k * 0.06, mrad = rng.range(0.08, 0.13);
      B.bar(BR, man, V(0, my, ro), V(md, my, ro), 0.016, 0.016, 4); B.bar(BR, man, V(md, my, ro), V(md, py - mrad, ro), 0.016, 0.012, 4);
      B.ball(moonSt, man, V(md, py, ro), mrad, 10, 8);
    }
  }
  await ctx.yield();

  // ----- mast, crown and the 52 m balance beam carrying the two giants (all on the outer rotation)
  const OUT = { ...NOANIM, of: 1 }, mastTop = 27.0, topY = BEAM_Y + 0.5;
  B.lathe(BR, OUT, [[0.2, 13.2], [0.2, 14.0], [0.3, 14.1], [0.3, 14.3], [0.19, 14.45], [0.17, 20.6], [0.3, 20.8], [0.52, 21.0], [0.56, 21.2], [0.56, 22.9], [0.5, 23.1], [0.3, 23.25], [0.16, 23.5],
    [0.13, 26.2], [0.22, 26.3], [0.22, 26.5], [0.1, 26.62], [0.08, mastTop + 0.5], [0.001, mastTop + 1.1]], 14, M(0, 0, 0));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.sin(a) * 0.6, z = Math.cos(a) * 0.6; B.bar(ST, OUT, V(x, 21.22, z), V(x, 22.88, z), 0.035, 0.035, 5); }   // lantern cage on the beam hub
  for (const y of [21.22, 22.05, 22.88]) { const t = new THREE.TorusGeometry(0.6, 0.05, 5, 24); t.rotateX(Math.PI / 2); B.add(t, M(0, y, 0), BRP, OUT); }
  await ctx.yield?.();
  { // crown: a little armillary sphere and star points
    const cy = 25.2, ta = rng.range(0, 3);
    for (let i = 0; i < 3; i++) B.add(new THREE.TorusGeometry(0.78 - i * 0.02, 0.03, 5, 32), M(0, cy, 0, ta + i * 1.05, 1, i === 2 ? Math.PI / 2 : 0, i === 1 ? 0.41 : 0), i ? BR : BRP, OUT);
    B.ball(BRP, OUT, V(0, mastTop + 0.2, 0), 0.2, 12, 8);
    const ns = rng.int(6, 10);
    for (let i = 0; i < ns; i++) { const a = i / ns * TAU; B.bar(BRP, OUT, V(Math.sin(a) * 0.2, mastTop + 0.2, Math.cos(a) * 0.2), V(Math.sin(a) * 0.75, mastTop + 0.2, Math.cos(a) * 0.75), 0.05, 0.004, 4); }
  }
  await ctx.yield?.();
  { // armillary rings turning on the mast between sun and beam: equator, ecliptic, colure, on four spokes
    const cy = 17.3, ar = rng.range(2.0, 2.5), an = { ...NOANIM, sp: 0.07 * -dir, ph: rng.range(0, TAU) }, ecl = 0.41;
    const eq = new THREE.TorusGeometry(ar, 0.05, 6, 64); eq.rotateX(Math.PI / 2); B.add(eq, M(0, cy, 0, 0, [1, 2.2, 1]), BRP, an);
    const ec = new THREE.TorusGeometry(ar - 0.07, 0.04, 6, 64); ec.rotateX(Math.PI / 2); B.add(ec, M(0, cy, 0, 0, [1, 2.6, 1], ecl, 0), CU, an);
    B.add(new THREE.TorusGeometry(ar + 0.06, 0.04, 6, 64), M(0, cy, 0), BR, an);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; B.bar(BR, an, V(Math.sin(a) * 0.18, cy, Math.cos(a) * 0.18), V(Math.sin(a) * ar, cy, Math.cos(a) * ar), 0.04, 0.025, 5); B.ball(BRP, an, V(Math.sin(a) * ar, cy, Math.cos(a) * ar), 0.085, 8, 6); }
    B.lathe(BRP, an, [[0.18, -0.3], [0.3, -0.2], [0.34, 0], [0.3, 0.2], [0.18, 0.3]], 12, M(0, cy, 0));
    for (const s of [-1, 1]) B.lathe(BRP, an, [[0.17, -0.12], [0.26, -0.05], [0.26, 0.05], [0.17, 0.12]], 10, M(0, cy + s * (ar + 0.06), 0));
    const sp = { ...an, pv: [0, cy, 0], ax: [0, Math.cos(ecl), Math.sin(ecl)], sp: 0.4 * dir };               // a little comet bead running round the ecliptic
    B.ball({ c: rich(cRed), metal: 0, rough: 0.2, emis: 0.3, kind: KIND.ENAMEL, vary: 0 }, sp, V(ar - 0.07, cy, 0), 0.16, 12, 8);
  }
  await ctx.yield?.();
  const giantTilt = [rng.range(0.3, 0.48) * rng.sign(), rng.range(0.1, 0.35) * rng.sign()], giantRad = [1.5, rng.range(1.15, 1.35)];
  const giantCol = [cGlass.clone().lerp(cAccent, 0.5).multiplyScalar(0.7), rich(rng.chance(0.5) ? cBlue.clone().lerp(new THREE.Color('#3f9a96'), 0.35) : cRed.clone().lerp(cAccent, 0.25))];
  for (let gI = 0; gI < 2; gI++) {
    await ctx.yield?.();
    const sg = gI ? -1 : 1, NPn = 15, zA = 0.5, zB = GIANT_R, nodeT = [], nodeB = [];
    const dep = (s) => lerp(1.7, 0.34, s), wid = (s) => lerp(0.46, 0.12, s);
    for (let k = 0; k <= NPn; k++) { const s = k / NPn; nodeT.push([wid(s), topY, sg * lerp(zA, zB, s)]); const sb = Math.min(1, (k + 0.5) / NPn); nodeB.push([0, topY - dep(sb), sg * lerp(zA, zB, sb)]); }
    for (const sx of [-1, 1]) B.bar(BR, OUT, V(sx * wid(0), topY, sg * zA), V(sx * wid(1), topY, sg * zB), 0.06, 0.035, 5);
    B.bar(BR, OUT, V(0, topY - dep(0), sg * zA), V(0, topY - dep(1), sg * zB), 0.065, 0.035, 5);
    for (let k = 0; k < NPn; k++) {
      if (k % 5 === 0) await ctx.yield?.();
      const b = V(...nodeB[k]), rr = lerp(0.034, 0.02, k / NPn);
      for (const sx of [-1, 1]) { B.bar(BZ, OUT, b, V(sx * nodeT[k][0], topY, nodeT[k][2]), rr, rr, 4); B.bar(BZ, OUT, b, V(sx * nodeT[k + 1][0], topY, nodeT[k + 1][2]), rr, rr, 4); }
      B.bar(ST, OUT, V(-nodeT[k][0], topY, nodeT[k][2]), V(nodeT[k][0], topY, nodeT[k][2]), rr, rr, 4);
      if (k % 3 === 1) B.ball(BRP, OUT, b, 0.075, 6, 5);
    }
    for (const s of [0.36, 0.68, 0.965]) {              // stay rods from the mast head, with turnbuckles
      const p = V(0, topY + 0.03, sg * lerp(zA, zB, s)), h = V(0, mastTop - 0.1 - s * 0.5, sg * 0.1);
      B.bar(ST, OUT, h, p, 0.026, 0.026, 4); B.bar(BRP, OUT, h.clone().lerp(p, 0.82), h.clone().lerp(p, 0.86), 0.055, 0.055, 6, true);
    }
    await ctx.yield?.();
    // hanger, meridian yoke, giant
    const R = giantRad[gI], gz = sg * GIANT_R, mr = R + 0.22, tilt = giantTilt[gI], axv = [0, Math.cos(tilt), Math.sin(tilt)], pv = [0, GIANT_Y, gz];
    B.ball(BRP, OUT, V(0, topY - 0.2, gz), 0.2, 12, 8);
    B.bar(BR, OUT, V(0, topY - 0.2, gz), V(0, GIANT_Y + mr, gz), 0.07, 0.05, 6);
    B.lathe(BRP, OUT, [[0.05, -0.1], [0.13, -0.05], [0.13, 0.05], [0.05, 0.1]], 8, M(0, GIANT_Y + mr + 0.25, gz));
    B.add(new THREE.TorusGeometry(mr, 0.05, 6, 40), M(0, GIANT_Y, gz, Math.PI / 2), BR, OUT);
    for (const s of [-1, 1]) B.ball(ST, OUT, V(0, GIANT_Y + axv[1] * mr * s, gz + axv[2] * mr * s), 0.09, 8, 6);
    await ctx.yield?.();
    const spin = { ...OUT, ax: axv, pv, sp: rng.range(0.12, 0.22) * dir };
    B.add(new THREE.SphereGeometry(R, 44, 28), M(0, GIANT_Y, gz, 0, 1, tilt, 0), { c: giantCol[gI], metal: 0, rough: 0.18, emis: gI ? rng.range(0.05, 0.6) : rng.range(0.74, 0.98), kind: KIND.ENAMEL, vary: 0 }, spin);
    await ctx.yield?.();
    if (gI === 0) {                                     // rings 7 m across, both faces, turning slowly with the globe
      for (const f of [-1, 1]) { const g = new THREE.RingGeometry(1.95, 3.55, 96, 1); g.rotateX(f * Math.PI / 2);
        B.add(g, M(0, GIANT_Y, gz, 0, 1, tilt, 0).multiply(new THREE.Matrix4().makeTranslation(0, -f * 0.012, 0)), { c: brass.clone().lerp(new THREE.Color(1, 0.95, 0.8), 0.35), metal: 0.45, rough: 0.3, kind: KIND.RING, vary: 0 }, { ...spin, sp: spin.sp * 0.3 }); }
    } else {                                            // a carousel of moons on a hoop
      const car = { ...OUT, pv, sp: 0.3 * -dir }, hr = R + rng.range(0.85, 1.15), nm = rng.int(3, 5);
      const hoop = new THREE.TorusGeometry(hr, 0.022, 4, 64); hoop.rotateX(Math.PI / 2); B.add(hoop, M(0, GIANT_Y, gz), BR, car);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU;
        B.add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(0, GIANT_Y - mr - 0.12, gz), V(Math.sin(a) * hr, GIANT_Y - mr - 0.1, gz + Math.cos(a) * hr), V(Math.sin(a) * hr, GIANT_Y, gz + Math.cos(a) * hr)), 10, 0.022, 4, false), M(0, 0, 0), BR, car); }
      B.lathe(BRP, car, [[0.06, -0.24], [0.12, -0.18], [0.12, -0.06], [0.05, 0]], 8, M(0, GIANT_Y - mr, gz));
      for (let k = 0; k < nm; k++) { const a = (k + rng.range(0.1, 0.9)) / nm * TAU, rad = rng.range(0.13, 0.27);
        B.ball(k % 2 ? moonSt : { c: enamels[6 + (k >> 1) % 2], metal: 0, rough: 0.2, emis: rng() * 0.5, kind: KIND.METAL, vary: 0.25, vf: 5 }, car, V(Math.sin(a) * hr, GIANT_Y, gz + Math.cos(a) * hr), rad, 14, 10); }
    }
  }
  await ctx.yield();

  // ----- assemble: one merged, shader-animated mesh for all the works
  const object = new THREE.Group(); object.name = 'orrery';
  const glyph = makeGlyphTexture(rng.fork('glyph'));
  await ctx.yield?.();
  const sunI = opts.sunIntensity ?? 5;
  const sunCol = cAccent.clone().lerp(new THREE.Color(1, 0.5, 0.12), 0.5), lightCol = sunCol.clone().lerp(new THREE.Color(1, 0.75, 0.4), 0.5);
  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uOuter: { value: 0 }, uInv: { value: new THREE.Matrix4() },
    uEnvLow: { value: cOak.clone().multiplyScalar(0.62) }, uEnvMid: { value: cOak.clone().lerp(cStone, 0.25).multiplyScalar(0.85) }, uEnvHigh: { value: cStone.clone().multiplyScalar(0.55) },
    uKeyCol: { value: cGlass.clone() }, uKeyDir: { value: V(-0.22, 1, 0.08).normalize() }, uKeyI: { value: 2.0 }, uBeamR: { value: 4.5 },
    uWinCol: { value: cAccent.clone().lerp(cGlass, 0.45) }, uWinI: { value: 3.0 }, uWinSide: { value: 1 },
    uSunCol: { value: lightCol }, uSunI: { value: sunI * 0.55 },
    uOak: { value: cOak.clone() }, uWalnut: { value: cWalnut.clone() }, uCream: { value: cStone.clone() }, uGold: { value: brass.clone() },
    uGlyph: { value: null },
  }]);
  U.uGlyph.value = glyph;
  const worksMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: WORKS_VERT, fragmentShader: WORKS_FRAG, vertexColors: true, fog: true });
  const works = new THREE.Mesh(B.finish(), worksMat); works.frustumCulled = false; works.name = 'orrery-works';
  object.add(works);
  await ctx.yield?.();
  const triangles = B.ni / 3, vertices = B.n;

  const sunU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: sunCol.clone() }, uDeep: { value: new THREE.Color(1.0, 0.27, 0.03) }, uI: { value: sunI }, uTime: { value: 0 } }]);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 48, 32), new THREE.ShaderMaterial({ uniforms: sunU, vertexShader: SUN_VERT, fragmentShader: SUN_FRAG, fog: true }));
  sun.position.set(0, SUN_Y, 0); sun.rotation.y = rng.range(0, TAU); object.add(sun);
  const haloU = { uCol: { value: new THREE.Color(1.0, 0.42, 0.1) }, uI: { value: sunI * 0.34 }, uTime: { value: 0 }, uSize: { value: 10.5 }, uFogK: { value: 0 } };
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: haloU, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, SUN_Y, 0); halo.frustumCulled = false; halo.renderOrder = 5; object.add(halo);

  // ----- animation state
  let speed = opts.speed ?? 1, progress = null, outerNow = 0;
  const passAt = opts.passAt ?? 0.68, sweep = opts.outerSweep ?? 2.4, outer0 = rng.range(0, TAU), fromAz = Math.PI / 6, toAz = Math.PI * 5 / 6, midAz = Math.PI / 2;
  const laneR = 18, laneY = SUN_Y, fly = [[0, 14, 64], [0.5, 13, 46], [4, 12, 30]];
  for (let k = 0; k <= 6; k++) { const a = lerp(fromAz, toAz, k / 6); fly.push([Math.sin(a) * laneR, laneY, Math.cos(a) * laneR]); }
  fly.push([4, laneY, -30], [0.5, laneY, -46], [0, laneY, -64]);
  const _inv = new THREE.Matrix4();

  return {
    object, radius: 30, height: 27.5, center: V(0, SUN_Y, 0), ground: true, groundY: 0,
    triangles, vertices,
    anchors: {
      sun: V(0, SUN_Y, 0),
      lane: { radius: laneR, height: laneY, fromAz, toAz },
      flyThrough: fly.map((p) => V(p[0], p[1], p[2])),
      portalSeat: { position: V(0, 6.5, -117), facing: V(0, 0, 1), shape: 'arch', width: 9, height: 13 },
      viewpoints: { hall: V(0, 6, 150), enter: V(0, 14, 44), orbitMid: V(laneR, laneY, 0), leave: V(0, laneY, -46) },
      oculus: { base: V(0, 0, 0), top: V(0, 48, 0), radius: 4 },
      doveSpiral: { center: V(0, 15, 0), radius: 7, top: 44 },
      giants: { radius: GIANT_R, height: GIANT_Y },
    },
    setProgress(u) { progress = u; },
    setSpeed(k) { speed = k; },
    setSun(i) { sunU.uI.value = i; haloU.uI.value = i * 0.34; U.uSunI.value = i * 0.55; },
    setWindow(i) { U.uWinI.value = i; },                                         // window light alone, no allocation (per-frame use)
    setLighting(o = {}) {
      const setC = (u, v) => { if (v !== undefined) u.value.set(v); };
      setC(U.uKeyCol, o.keyColor); setC(U.uWinCol, o.windowColor); setC(U.uEnvLow, o.envLow); setC(U.uEnvMid, o.envMid); setC(U.uEnvHigh, o.envHigh);
      if (o.keyIntensity !== undefined) U.uKeyI.value = o.keyIntensity;
      if (o.windowIntensity !== undefined) U.uWinI.value = o.windowIntensity;
      if (o.windowSide !== undefined) U.uWinSide.value = o.windowSide;          // 1: windows on -X, -1: on +X
      if (o.beamRadius !== undefined) U.uBeamR.value = o.beamRadius;
      if (o.keyDir) U.uKeyDir.value.set(o.keyDir[0], o.keyDir[1], o.keyDir[2]).normalize();
    },
    giantPosition(i, out = new THREE.Vector3()) { const a = outerNow + (i ? Math.PI : 0); return out.set(Math.sin(a) * GIANT_R, GIANT_Y, Math.cos(a) * GIANT_R); },
    update(dt, time) {
      const t = time * speed;
      U.uTime.value = t; sunU.uTime.value = time; haloU.uTime.value = time;
      outerNow = progress === null ? outer0 + t * 0.045 * dir : midAz + sweep * (progress - passAt);
      U.uOuter.value = outerNow;
      object.updateWorldMatrix(true, false);
      U.uInv.value.copy(_inv.copy(object.matrixWorld).invert());
      let root = object; while (root.parent) root = root.parent;
      const fog = root.fog; haloU.uFogK.value = fog ? (fog.isFogExp2 ? fog.density * 0.8 : 1 / Math.max(1, fog.far)) : 0;
    },
    dispose() { glyph.dispose(); },
  };
}
