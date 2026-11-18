// THE LAST LIT WINDOWS, the cast of the Night Land: the night hounds, the silent walkers on the road, the armoured
// men at the ring with their discs, the grey giants at the kiln.
//
//   makeCreatures(shared, geometry, n, rig)   up to 20 animals of one kind in one draw call. Where each one is, which way
//                                              it heads and where it is in its stride come from uniforms the world
//                                              writes each frame; the limbs swing in the vertex shader about their joints.
//   houndGeometry(), giantGeometry()           aB: joint y, joint z, phase of the limb (turns), kind (0 body, 1 upper
//                                              limb, 2 lower limb); aK: second joint y, z, unused, how much the spine flexes
//   buildWalkers(shared, n)                    tall shrouded shapes; their shrouds sway in the vertex shader
//   buildDiscs(shared, figures)                the discs in the hands of the men at the ring (they share the men's pose)
import * as THREE from 'three';
import { NL_GLSL, FIG_POSE } from './last-lit-windows.js';

class Rig {
  constructor() { this.p = []; this.n = []; this.b = []; this.k = []; this.i = []; }
  // a tube through rings [x, y, z, rx, ry] (ry along y, rx across), each with its own bone [jy, jz, phase, kind] and aK
  tube(rings, sides, bone, knee = [0, 0, 0, 0], capA = true, capB = true) {
    const base = this.p.length / 3;
    rings.forEach((r, ri) => {
      const bn = Array.isArray(bone[0]) ? bone[ri] : bone, kn = Array.isArray(knee[0]) ? knee[ri] : knee;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + Math.PI / sides, cx = Math.cos(a), sy = Math.sin(a);
        this.p.push(r[0] + cx * r[3], r[1] + sy * r[4], r[2]); this.n.push(cx, sy, 0); this.b.push(...bn); this.k.push(...kn);
      }
    });
    for (let ri = 0; ri < rings.length - 1; ri++) for (let s = 0; s < sides; s++) {
      const a = base + ri * sides + s, b2 = base + ri * sides + (s + 1) % sides, c = a + sides, d = b2 + sides;
      this.i.push(a, c, b2, b2, c, d);
    }
    const cap = (ri, flip) => { const r = rings[ri], bn = Array.isArray(bone[0]) ? bone[ri] : bone, kn = Array.isArray(knee[0]) ? knee[ri] : knee, c = this.p.length / 3;
      this.p.push(r[0], r[1], r[2]); this.n.push(0, 0, flip ? -1 : 1); this.b.push(...bn); this.k.push(...kn);
      for (let s = 0; s < sides; s++) { const a = base + ri * sides + s, b2 = base + ri * sides + (s + 1) % sides; if (flip) this.i.push(c, b2, a); else this.i.push(c, a, b2); } };
    if (capA) cap(0, true); if (capB) cap(rings.length - 1, false);
  }
  // a limb hanging down: rings [x, y, z, r] from the joint
  limb(rings, sides, bones, knees) {
    const base = this.p.length / 3;
    rings.forEach((r, ri) => { for (let s = 0; s < sides; s++) { const a = (s / sides) * Math.PI * 2 + Math.PI / sides, cx = Math.cos(a), sz = Math.sin(a);
      this.p.push(r[0] + cx * r[3], r[1], r[2] + sz * r[3] * (r[4] ?? 1)); this.n.push(cx, 0, sz); this.b.push(...bones[ri]); this.k.push(...knees[ri]); } });
    for (let ri = 0; ri < rings.length - 1; ri++) for (let s = 0; s < sides; s++) {
      const a = base + ri * sides + s, b2 = base + ri * sides + (s + 1) % sides, c = a + sides, d = b2 + sides;
      this.i.push(a, b2, c, b2, d, c);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(this.b, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 4)); g.setIndex(this.i);
    return g;
  }
}
// A night hound: 3 m long, as tall as a horse, heavy in the shoulder, a long blunt head carried low. Faces +Z.
export function houndGeometry() {
  const R = new Rig(), B = [0, 0, 0, 0];
  const fl = (w) => [0, 0, 0, w];
  R.tube([[0, 1.42, -1.3, 0.2, 0.24], [0, 1.5, -0.75, 0.33, 0.4], [0, 1.47, 0.0, 0.37, 0.44], [0, 1.56, 0.62, 0.47, 0.62], [0, 1.66, 1.0, 0.34, 0.44],
    [0, 1.62, 1.4, 0.24, 0.27], [0, 1.52, 1.75, 0.2, 0.21], [0, 1.4, 2.2, 0.1, 0.1]], 10, B,
    [fl(-1), fl(-0.6), fl(0), fl(0.5), fl(0.8), fl(1), fl(1), fl(1)]);
  // ears, laid back
  for (const sx of [-1, 1]) R.tube([[sx * 0.15, 1.86, 1.36, 0.07, 0.09], [sx * 0.2, 2.02, 1.2, 0.01, 0.01]], 4, B, fl(1), false, false);
  R.tube([[0, 1.46, -1.3, 0.08, 0.08], [0, 1.32, -1.75, 0.06, 0.06], [0, 1.02, -2.15, 0.03, 0.03]], 5, B, [fl(-1), fl(-1.6), fl(-2.2)], false, true);
  const leg = (x, jy, jz, ky, kz, fz, phase, r) => R.limb(
    [[x, jy, jz, r * 1.5, 1.3], [x, ky, kz, r, 1.1], [x, ky, kz, r, 1.1], [x, 0.1, fz, r * 0.75, 1], [x, 0, fz + 0.1, r * 1.1, 1.5]], 6,
    [[jy, jz, phase, 1], [jy, jz, phase, 1], [jy, jz, phase, 2], [jy, jz, phase, 2], [jy, jz, phase, 2]],
    [[ky, kz, 0, 0], [ky, kz, 0, 0], [ky, kz, 0, 0], [ky, kz, 0, 0], [ky, kz, 0, 0]]);
  leg(-0.3, 1.36, 0.66, 0.74, 0.74, 0.7, 0.5, 0.115); leg(0.3, 1.36, 0.66, 0.74, 0.74, 0.7, 0.6, 0.115);
  leg(-0.27, 1.34, -0.9, 0.72, -1.12, -0.95, 0.0, 0.12); leg(0.27, 1.34, -0.9, 0.72, -1.12, -0.95, 0.1, 0.12);
  return R.geometry();
}
// A grey giant, 14 m tall, stooped, long in the arm. Faces +Z.
export function giantGeometry() {
  const R = new Rig(), B = [0, 0, 0, 0], K = [0, 0, 0, 0];
  R.tube([[0, 7.0, -0.1, 1.7, 1.0], [0, 9.4, 0.25, 2.0, 1.25], [0, 11.3, 0.9, 2.3, 1.2], [0, 12.0, 1.3, 1.0, 0.8]].map((r) => [r[0], r[2], r[1], r[3], r[4]]), 8, B, K);
  // (the tube runs along z: turn it upright)
  { const p = R.p, n = R.n; for (let i = 0; i < p.length; i += 3) { const y = p[i + 1], z = p[i + 2]; p[i + 1] = z; p[i + 2] = y; const ny = n[i + 1]; n[i + 1] = 0; n[i + 2] = ny; } }
  R.limb([[0, 13.9, 1.75, 0.5, 1], [0, 13.4, 1.8, 0.95, 1.1], [0, 12.4, 1.7, 0.85, 1], [0, 11.9, 1.4, 0.5, 1]], 6, [B, B, B, B], [K, K, K, K]);
  const limb = (x, jy, jz, ky, kz, ey, ez, phase, r) => R.limb(
    [[x, jy, jz, r * 1.3, 1], [x, ky, kz, r, 1], [x, ky, kz, r, 1], [x, ey + 0.3, ez, r * 0.8, 1], [x, ey, ez + 0.2, r * 1.0, 1.5]], 6,
    [[jy, jz, phase, 1], [jy, jz, phase, 1], [jy, jz, phase, 2], [jy, jz, phase, 2], [jy, jz, phase, 2]], [0, 1, 2, 3, 4].map(() => [ky, kz, 0, 0]));
  limb(-1.0, 7.3, 0, 3.8, 0.2, 0, 0, 0.0, 0.62); limb(1.0, 7.3, 0, 3.8, 0.2, 0, 0, 0.5, 0.62);
  limb(-2.7, 11.0, 0.8, 8.0, 0.7, 5.0, 1.1, 0.5, 0.45); limb(2.7, 11.0, 0.8, 8.0, 0.7, 5.0, 1.1, 0.0, 0.45);
  return R.geometry();
}
const CREATURE_VS = /* glsl */`
${NL_GLSL}
uniform vec4 uAt[20];       // x, y, z, heading (0 = +Z)
uniform vec4 uGait[20];     // stride phase (turns), how hard it runs (0..1), size, unused
uniform vec4 uRig;          // swing of the limbs (rad), bend of the second joint, bob (m), flex of the spine
uniform vec3 uAlb; uniform float uRim, uFire;
attribute float aId; attribute vec4 aB; attribute vec4 aK;
varying vec3 vCol; varying vec3 vW;
vec2 rot(vec2 p, vec2 c, float a){ float s = sin(a), co = cos(a); vec2 d = p - c; return c + vec2(d.x*co - d.y*s, d.x*s + d.y*co); }
void main(){
  int id = int(aId + 0.5);
  vec4 at = uAt[id]; vec4 gait = uGait[id];
  float ph = gait.x*6.2831853, run = gait.y;
  vec3 p = position; vec3 n = normal;
  if (aB.w > 0.5) {
    float lp = ph + aB.z*6.2831853;
    float swing = uRig.x*run*sin(lp);
    if (aB.w > 1.5) { float bend = uRig.y*run*max(0.0, sin(lp + 1.9)); p.yz = rot(p.yz, aK.xy, bend); }
    p.yz = rot(p.yz, aB.xy, swing); n.yz = rot(n.yz, vec2(0.0), swing);
    p.y += uRig.z*run*sin(ph*2.0 + 0.8)*0.5;
  } else {
    p.y += uRig.z*run*sin(ph*2.0 + 0.8) + uRig.w*run*aK.w*abs(aK.w)*sin(ph + 0.4)*0.5;
  }
  p *= gait.z;
  float cy = cos(at.w), sy = sin(at.w);
  vec3 wp = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy) + at.xyz;
  vec3 N = normalize(vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy));
  vec3 toE = cameraPosition - wp; vec3 V = toE/max(length(toE), 1e-3);
  // firelight carries far over a black plain to a thing as big as a horse: the pits redden it from uFire times their reach
  vec3 fire = vec3(0.0); float fr = 1.0 - abs(dot(N, V));        // the edge of the body, whichever way its plates are wound
  for (int i = 0; i < 4; i++) {
    vec3 dl = uPit[i].xyz - wp; float r2 = dot(dl, dl), rw = uPit[i].w*uFire;
    float ndl = max(dot(N, dl)*inversesqrt(r2 + 1e-3), 0.0);
    // (a black thing by a fire: little of the red lies on its body, most of it runs along the edge turned from us)
    fire += (uAlb*(0.02 + 0.25*ndl) + 0.24*uRim*fr*fr*fr*fr)*uPitCol[i]/(1.0 + r2/(rw*rw));
  }
  vCol = nlKey(wp, N, V, uAlb, uRim*0.5) + fire + nlPales(wp, N, V, uAlb*1.5, uRim) + uAlb*vec3(0.004, 0.0045, 0.007);
  vW = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const PLAIN_FS = /* glsl */`precision highp float;
${NL_GLSL}
varying vec3 vCol; varying vec3 vW;
void main(){ gl_FragColor = vec4(nlFog(vCol, vW), 1.0); }`;
export function makeCreatures(shared, geometry, n, rig) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geometry.index; for (const k of ['position', 'normal', 'aB', 'aK']) g.setAttribute(k, geometry.attributes[k]);
  g.setAttribute('aId', new THREE.InstancedBufferAttribute(new Float32Array(n).map((_, i) => i), 1)); g.instanceCount = n;
  const uniforms = { ...shared.uniforms, uAt: { value: Array.from({ length: 20 }, () => new THREE.Vector4(0, -500, 0, 0)) }, uGait: { value: Array.from({ length: 20 }, () => new THREE.Vector4(0, 1, 1, 0)) },
    uRig: { value: new THREE.Vector4(...rig.rig) }, uAlb: { value: new THREE.Color(...rig.albedo) }, uRim: { value: rig.rim ?? 0.9 }, uFire: { value: rig.fire ?? 1 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: CREATURE_VS, fragmentShader: PLAIN_FS }));
  mesh.frustumCulled = false; mesh.name = rig.name || 'creatures';
  return { mesh, uniforms, at: uniforms.uAt.value, gait: uniforms.uGait.value, count: n, triangles: n * geometry.index.count / 3 };
}

// The silent walkers: 5.5 m tall, shrouded from crown to ground, broad in the shoulder and trailing their shrouds,
// gliding. They never turn. They are dark: seen against the pale road, the ring's line and the lit ground inside it.
export function buildWalkers(shared, n) {
  const p = [], nn = [], idx = [], S = 9;
  const rings = [[0, 0.82], [0.5, 0.74], [2.2, 0.56], [3.9, 0.5], [4.35, 0.62], [4.7, 0.34], [5.0, 0.38], [5.35, 0.26], [5.5, 0.02]];
  rings.forEach((r) => { for (let s = 0; s < S; s++) { const a = s / S * 6.2832; p.push(Math.cos(a) * r[1] * 1.45 * (r[0] > 4 && r[0] < 4.6 ? 1.25 : 1), r[0], Math.sin(a) * r[1] * 1.45 * 0.8); nn.push(Math.cos(a), 0.2, Math.sin(a)); } });
  for (let ri = 0; ri < rings.length - 1; ri++) for (let s = 0; s < S; s++) { const a = ri * S + s, b = ri * S + (s + 1) % S, c = a + S, d = b + S; idx.push(a, b, c, b, d, c); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); g.setIndex(idx);
  g.setAttribute('aId', new THREE.InstancedBufferAttribute(new Float32Array(n).map((_, i) => i), 1)); g.instanceCount = n;
  const uniforms = { ...shared.uniforms, uAt: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, -500, 0, 0)) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, fragmentShader: PLAIN_FS,
    vertexShader: /* glsl */`
      ${NL_GLSL}
      uniform vec4 uAt[12];      // x, y, z, a phase of its own
      attribute float aId;
      varying vec3 vCol; varying vec3 vW;
      void main(){
        vec4 at = uAt[int(aId + 0.5)];
        vec3 p = position; float hang = 1.0 - smoothstep(0.0, 4.7, p.y);
        // the shroud trails and sways below; the whole shape leans a little into its going, and rocks, slowly
        float ph = uTime*0.9 + at.w;
        p.x -= hang*hang*(0.55 + 0.25*sin(ph + p.z*2.0));
        p.z += hang*0.18*sin(ph*1.3 + p.x*3.0);
        p.x += 0.05*p.y*(1.0 + 0.4*sin(ph*0.5));
        vec3 wp = p + at.xyz;
        vec3 N = normalize(normal);
        vec3 toE = cameraPosition - wp; vec3 V = toE/max(length(toE), 1e-3);
        vec3 alb = vec3(0.02, 0.02, 0.024)*(0.7 + 0.5*nlN(vec2(position.y*3.0 + at.w, atan(position.z, position.x + 1e-4)*2.0)));
        vCol = nlKey(wp, N, V, alb, 0.03) + nlPits(wp, N, V, alb, 0.05);
        vW = wp;
        gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'walkers';
  return { mesh, uniforms, at: uniforms.uAt.value, count: n, triangles: n * idx.length / 3 };
}

// The discs of the armoured men: a wheel of clear cold light in each right hand, spinning, flickering a little. Close by
// it is the wheel itself, on edge in the hand; far off, where the wheel is smaller than a pixel and a half, it is a point
// of its light kept that size and dimmed by what it was widened, so that a rank of men is a row of small cold lights.
export function buildDiscs(shared, figures) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aPos', figures.aPos); g.setAttribute('aVar', figures.aVar); g.instanceCount = figures.count; g.boundingSphere = figures.sphere;
  const uniforms = { ...shared.uniforms, uEye: figures.uniforms.uEye, uWave: figures.uniforms.uWave };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec2 uRes;
      ${FIG_POSE}
      varying vec2 vQ; varying float vS; varying vec3 vW; varying vec2 vK;
      void main(){
        float yaw = figYaw(), raise = figRaise();
        vec3 hand = figHand(raise) + vec3(0.0, 0.1, 0.02);
        // the disc stands on edge in the hand, its face turned a little outward; raised, it tips toward the dark
        vec3 q = vec3(position.x*0.1, position.y*0.3, position.x*0.3);
        vec3 c0 = figPlace(hand, yaw), toE = cameraPosition - c0;
        float pix = length(toE)*1.2498/max(uRes.y, 1.0), hw = max(0.3, 1.2*pix), farK = smoothstep(0.3, 0.55, 1.2*pix);
        vec3 right = normalize(vec3(toE.z, 0.0, -toE.x) + vec3(1e-4, 0.0, 0.0));
        vec3 wp = mix(figPlace(hand + q, yaw), c0 + right*(position.x*hw) + vec3(0.0, position.y*hw, 0.0), farK);
        vQ = position.xy; vS = aVar.y; vW = wp; vK = vec2(farK, 0.3/hw);
        gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${NL_GLSL}
      varying vec2 vQ; varying float vS; varying vec3 vW; varying vec2 vK;
      void main(){
        float r = length(vQ), a = atan(vQ.y, vQ.x + 1e-5);
        float spin = a*3.0 + uTime*(9.0 + 5.0*vS) + vS*40.0;
        float rimL = smoothstep(0.82, 0.9, r)*(1.0 - smoothstep(0.94, 1.0, r));
        float blade = (1.0 - smoothstep(0.0, 0.9, r))*(0.25 + 0.75*smoothstep(0.2, 0.9, sin(spin)));
        float hub = 1.0 - smoothstep(0.0, 0.22, r);
        float wheel = (2.0*rimL + 0.7*blade + 1.3*hub)*(1.0 - smoothstep(0.96, 1.0, r));
        float k = clamp(vK.y, 0.0, 1.0);
        float point = 1.1*exp(-r*r*5.0)*(1.0 - smoothstep(0.8, 1.0, r))*k*k;
        float flick = 0.82 + 0.18*sin(uTime*(6.0 + 5.0*vS) + vS*50.0);
        vec3 c = vec3(0.72, 0.83, 1.0)*(mix(wheel, point, clamp(vK.x, 0.0, 1.0))*flick);
        gl_FragColor = vec4(c*(1.0 - nlFogAmount(vW, uFog.x*0.5)), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'discs'; mesh.renderOrder = 3;
  return { mesh, uniforms, triangles: figures.count * 2 };
}
