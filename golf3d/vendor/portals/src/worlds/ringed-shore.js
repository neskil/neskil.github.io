// THE RINGED SHORE
// A mirror-wet tidal plain on an alien moon at dusk. The hero (src/parts/ringed-shore.js) paints the
// ringed giant, its rippled reflection, the wet-sand film and the crystal arch; this world adds the
// flight, the herd of Striders (and their mirror images), the crystal spire field, sea-stack mesas,
// retracting tendril plants, kite gliders, mist, motes and shooting stars.
// Everything that stands on the flat is drawn twice: once upright and once y-flipped below y = 0,
// under the hero's transparent sand film, so the mirror is real geometry.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/ringed-shore.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import * as T from '../kit/terrain.js';

const PALETTE = ['#110838', '#371d78', '#22aea2', '#ff7ab8', '#dcae82', '#1a1630', '#b8fff0'];
const STRIDE_A = 6.0, DUTY = 0.72, STRIDE = (2 * STRIDE_A) / DUTY, LIFT = 2.6;
const LEGS = [  // side x, rest z of the foot, gait phase
  { sx: -1, z: -4.5, ph: 0.0 }, { sx: -1, z: 4.5, ph: 0.25 }, { sx: 1, z: -4.5, ph: 0.5 }, { sx: 1, z: 4.5, ph: 0.75 },
];
const FOOT_X = 10;

// foot motion relative to the body: planted (moving back at walking speed) for DUTY of the cycle, then a lifted swing forward
const _foot = [0, 0];    // scratch: no per-frame allocation
function footZ(ph) {
  if (ph < DUTY) { _foot[0] = STRIDE_A * (1 - (2 * ph) / DUTY); _foot[1] = 0; return _foot; }
  const t = (ph - DUTY) / (1 - DUTY), s = t * t * (3 - 2 * t);
  _foot[0] = STRIDE_A * (-1 + 2 * s); _foot[1] = Math.sin(Math.PI * t) * LIFT;
  return _foot;
}
const GLSL_GAIT = /* glsl */`
float footZ(float ph, out float lift){
  const float A = ${STRIDE_A.toFixed(2)}, D = ${DUTY.toFixed(3)};
  if (ph < D) { lift = 0.; return A * (1. - 2. * ph / D); }
  float t = (ph - D) / (1. - D), s = t * t * (3. - 2. * t);
  lift = sin(3.14159 * t) * ${LIFT.toFixed(2)};
  return A * (-1. + 2. * s);
}
`;
// two-colour dusk light shared by everything this file shades itself
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunD, uGlowDir, uPink, uMid, uHor, uIce;
vec3 shoreLight(vec3 alb, vec3 N, vec3 V){
  float nd = dot(N, uSunD);
  float k = max(nd, 0.), wrap = max(nd * 0.5 + 0.5, 0.);
  float g = max(dot(N, uGlowDir) * 0.6 + 0.4, 0.);
  vec3 keyC = vec3(0.70, 0.86, 1.0) * 1.7;
  vec3 c = alb * (keyC * (k * 0.85 + wrap * wrap * 0.15) + uPink * g * g * 1.0 + uMid * 0.6 + uHor * 0.14 * (N.y * 0.5 + 0.5));
  float rim = pow(1. - max(dot(N, V), 0.), 3.);
  c += rim * (keyC * 0.22 * wrap + uPink * 0.34 * g) * (0.25 + alb * 2.5);
  return c;
}
`;

// ---------- Striders ----------
const STRIDER_VERT = /* glsl */`
attribute vec4 aA;      // leg phase (-1: not a leg), swing weight, lift weight, bob weight
attribute vec4 aB;      // tail weight, head weight, glow, along
attribute vec3 color;
attribute vec3 aInst;   // distance offset, seed, scale
uniform float uDist, uTime, uMirror;
uniform vec3 uCam;
varying vec3 vN, vW, vCol, vL; varying vec4 vB; varying float vSeed, vFar;
#include <fog_pars_vertex>
${GLSL_GAIT}
void main(){
  vec3 p = position;
  vL = position;
  // legs, tail and neck never get thinner than about two pixels: fatten them with distance
  vec3 cam = uCam; if (uMirror > 0.5) cam.y = -cam.y;
  float camD = length(cam - (instanceMatrix * vec4(0., 12., 0., 1.)).xyz);
  float thin = (aA.x >= 0. || aB.x > 0. || aB.y > 0.1) && aB.w < 4.5 ? 1. : 0.;
  p += normal * thin * max(camD - 70., 0.) * 0.0012 / aInst.z;
  float lamp = (aA.x < 0. && aB.x <= 0. && aB.z > 0.5) ? 1. : 0.;            // belly lanterns stay a few pixels wide
  p += normal * lamp * max(camD - 70., 0.) * 0.0042 / aInst.z;
  vFar = clamp((camD - 60.) / 200., 0., 1.);
  float d = (uDist + aInst.x) / (${STRIDE.toFixed(3)} * aInst.z);
  float seed = aInst.y;
  if (aA.x >= 0.) { float lift; float dz = footZ(fract(d + aA.x), lift); p.z += aA.y * dz; p.y += aA.z * lift; }
  p.y += aA.w * (0.32 * sin(d * 12.566) + 0.12 * sin(uTime * 0.8 + seed * 9.));
  p.x += aA.w * 0.35 * sin(d * 6.283 + 0.6);
  float tw = aB.x * aB.x;
  p.x += tw * (2.8 * sin(uTime * 0.55 + seed * 17. - aB.x * 1.6) + 1.2 * sin(d * 6.283 - aB.x * 2.2));
  p.y += tw * (1.1 * sin(uTime * 0.41 + seed * 5. - aB.x * 1.2));
  p.y += aB.y * (0.7 * sin(uTime * 0.47 + seed * 23.) - 0.25 * sin(d * 12.566 + 1.));
  p.x += aB.y * 1.1 * sin(uTime * 0.29 + seed * 11.);
  vec4 wp = instanceMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal); vCol = color; vB = aB; vSeed = seed;
  vec4 mvPosition = viewMatrix * modelMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const STRIDER_FRAG = /* glsl */`
precision highp float;
varying vec3 vN, vW, vCol, vL; varying vec4 vB; varying float vSeed, vFar;
uniform vec3 uCam, uDark; uniform float uMirror, uTime;
#include <fog_pars_fragment>
${GLSL_LIGHT}
float sh21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float svn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sh21(i), sh21(i + vec2(1., 0.)), f.x), mix(sh21(i + vec2(0., 1.)), sh21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  if (vW.y < 0.) discard;
  vec3 cam = uCam; if (uMirror > 0.5) cam.y = -cam.y;
  vec3 V = normalize(cam - vW), N = normalize(vN);
  if (vB.w > 4.5) {
    // knee webs: a translucent membrane, dark violet, pink only where the afterglow shines through it
    float q = (vB.w - 5.) / 0.8, ac = clamp((vB.z - 0.02) / 0.03, 0., 1.);
    // veins fan out from the knee: a ray from the knee keeps its place across the membrane
    float cell = svn(vL.yz * 2.2 + vL.x * 1.3);
    float vein = smoothstep(0.86, 1., abs(sin(ac * 7.854 + (cell - 0.5) * 0.5))) * smoothstep(0.03, 0.2, q);
    float back = pow(max(dot(-V, uGlowDir), 0.), 3.), backK = pow(max(dot(-V, uSunD), 0.), 6.);
    vec3 wcol = (uMid * 0.34 + uDark * 0.25) * (0.6 + 0.5 * cell) + vCol * 0.05;
    wcol += uPink * back * (0.32 + 0.26 * cell) * (0.35 + 0.65 * ac) + vec3(0.6, 0.8, 1.) * backK * 0.3;
    wcol *= 1. - 0.35 * clamp(vein, 0., 1.);
    wcol *= 0.7 + 0.3 * smoothstep(1., 0.55, q);                 // the free edge is thicker and darker
    wcol += uPink * 0.1 * smoothstep(0.25, 0., ac);
    wcol = mix(wcol, uHor * 0.32 + uPink * 0.1 + uMid * 0.14, vFar * 0.7);
    if (uMirror > 0.5) wcol *= 0.84;
    gl_FragColor = vec4(wcol, 1.);
    #include <fog_fragment>
    return;
  }
  vec3 alb = vCol * (0.8 + 0.3 * (1. - vFar) * svn(vec2(vB.w * 60. + vSeed * 30., atan(N.x, N.z + 1e-4) * 4.)));   // fine scales
  float hull = step(0.001, vB.z) * step(vB.w, 0.62) * step(vB.y, 0.01) * step(vB.x, 0.0001);
  float belly = smoothstep(0.1, -0.7, N.y) * hull;
  // hide pattern: ribbed bands along the hull, mottling, a darker ventral stripe and pale flank spots
  float mott = svn(vec2(vL.z * 1.7, atan(vL.x, vL.y - 21.5) * 2.6) + vSeed * 20.);
  float rib = smoothstep(0.2, 0.8, sin(vB.w * 96. + mott * 2.2));
  alb *= mix(1., (0.62 + 0.38 * rib) * (0.75 + 0.5 * mott), hull);
  alb = mix(alb, alb * 1.15 + uPink * 0.04, belly * 0.6);
  alb *= 1. - 0.55 * belly * smoothstep(0.75, 0.15, abs(vL.x));
  float spot = smoothstep(0.72, 0.9, svn(vec2(vL.z * 0.9 + vSeed * 7., vL.y * 0.9))) * hull * (1. - belly);
  alb = mix(alb, alb * 1.5 + uHor * 0.08, spot * 0.6);
  alb *= mix(0.7 + 0.5 * smoothstep(0., 12., vW.y), 1., hull);      // limbs: dark at the waterline, lighter toward the knee
  vec3 col = shoreLight(alb, N, V);
  col += uHor * 0.035 * smoothstep(2., 16., vW.y) * (1. - hull);
  float fr = pow(1. - max(dot(N, V), 0.), mix(1.8, 2.5, hull));
  col += fr * (vec3(0.70, 0.86, 1.0) * 0.55 * max(dot(N, uSunD) * 0.5 + 0.5, 0.) * 0.6 + uPink * 0.15 * max(dot(N, uGlowDir) * 0.5 + 0.5, 0.) + uHor * 0.06);
  // far animals sink into the dusk air: violet-teal silhouettes with lanterns, never black brackets
  col = mix(col, uHor * 0.32 + uPink * 0.1 + uMid * 0.14, vFar * 0.7);
  // every limb carries a lit edge, so a leg reads as a limb and never as a black bar or a wire
  col += fr * (uIce * 0.35 + uPink * 0.25) * (1. - hull) * (1. - 0.45 * vFar);
  // soft lanterns: belly sacs, knee joints, head and the lure at the tail tip
  float pulse = 0.7 + 0.3 * sin(uTime * 1.3 + vSeed * 40. + vB.w * 6.);
  float spots = 0.55 + 0.45 * sin(vB.w * 31. - uTime * 0.9);
  vec3 glowC = mix(uHor * 1.6, uIce, 0.6);
  float ndv = max(dot(N, V), 0.), sac = step(0.6, vB.z) * step(vB.z, 0.65);
  float lampK = mix(0.45 + 0.55 * pow(1. - ndv, 1.5) + belly, (0.3 + 1.2 * (1. - ndv) * (1. - ndv)) * (0.7 + 0.5 * max(-N.y, 0.)), sac);   // sacs: dark core, bright rim
  col += glowC * max(vB.z - 0.05, 0.) * pulse * (0.6 + 0.4 * spots) * 3.2 * lampK * mix(1. - 0.9 * vFar, 1. + 2.4 * vFar, step(0.5, vB.z));   // far away only the lanterns shine, the legs stay clean silhouettes
  col += glowC * spot * 0.22 * pulse;
  if (uMirror > 0.5) col *= 0.84;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

function makeAcc() {
  return { pos: [], nor: [], a: [], b: [], col: [], idx: [] };
}
// a tube along pts with per-ring radius; at(k) -> { a: [4], b: [4], c: Color, e: [sx, sy] }
function tube(G, pts, radii, radial, at) {
  const K = pts.length, base = G.pos.length / 3;
  const Tn = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let k = 0; k < K; k++) {
    Tn.subVectors(pts[Math.min(K - 1, k + 1)], pts[Math.max(0, k - 1)]).normalize();
    if (k === 0) { N.set(1, 0, 0); if (Math.abs(Tn.x) > 0.8) N.set(0, 0, 1); }
    N.addScaledVector(Tn, -N.dot(Tn)).normalize();
    B.crossVectors(Tn, N).normalize();
    const o = at(k), e = o.e || [1, 1], r = radii[k];
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2, cx = Math.cos(th), sy = Math.sin(th);
      v.copy(pts[k]).addScaledVector(N, cx * r * e[0]).addScaledVector(B, sy * r * e[1]);
      n.set(0, 0, 0).addScaledVector(N, cx / e[0]).addScaledVector(B, sy / e[1]).normalize();
      G.pos.push(v.x, v.y, v.z); G.nor.push(n.x, n.y, n.z);
      G.a.push(o.a[0], o.a[1], o.a[2], o.a[3]); G.b.push(o.b[0], o.b[1], o.b[2], o.b[3]); G.col.push(o.c.r, o.c.g, o.c.b);
    }
  }
  const W = radial + 1;
  for (let k = 0; k < K - 1; k++) for (let j = 0; j < radial; j++) {
    const i0 = base + k * W + j, i1 = i0 + 1, i2 = i0 + W, i3 = i2 + 1;
    G.idx.push(i0, i2, i1, i1, i2, i3);
  }
}

function striderGeometry(rng, C) {
  const G = makeAcc(), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const cLeg = C.dark.clone().lerp(C.violet, 0.5).lerp(C.sand, 0.1).multiplyScalar(1.15);
  const cBody = C.dark.clone().lerp(C.violet, 0.55).lerp(C.sand, 0.12);
  const cPale = cBody.clone().lerp(C.sand, 0.35);
  const BY = 21.7;
  // body: a slung hull, widest behind the middle
  {
    const zs = [-4.9, -4.6, -4.2, -3.6, -3.0, -2.2, -1.4, -0.5, 0.4, 1.3, 2.2, 2.9, 3.6, 4.1, 4.5].map((z) => z * 1.3);
    const rs = [0.3, 1.0, 1.6, 2.15, 2.6, 2.95, 3.2, 3.15, 3.0, 2.7, 2.3, 1.9, 1.5, 1.15, 0.8], HK = zs.length - 1;
    tube(G, zs.map((z, i) => V3(0, BY + 0.35 * Math.sin((i / HK) * Math.PI) - 0.2, z)), rs.map((r, i) => r * (i % 2 ? 1.03 : 0.985)), 16,
      (k) => ({ a: [-1, 0, 0, 1], b: [0, 0, 0.04, k / HK * 0.6], c: cBody, e: [1, 0.8] }));
    // dorsal ridge
    const dz = [-5.7, -3.4, -0.8, 1.8, 4.4], dr = [0.1, 0.5, 0.66, 0.52, 0.12];
    tube(G, dz.map((z, i) => V3(0, BY + 2.0 + 0.6 * Math.sin((i / 4) * Math.PI), z)), dr, 6,
      (k) => ({ a: [-1, 0, 0, 1], b: [0, 0, 0, 0.7 + k * 0.02], c: cPale, e: [0.5, 1.6] }));
  }
  // belly sacs: little lanterns hanging under the hull
  for (const [x, z, s] of [[-0.7, -3.4, 0.8], [0.75, -2.0, 0.6], [-0.3, -0.9, 0.95], [0.8, 0.3, 0.55], [-0.75, 1.3, 0.7], [0.4, 2.6, 0.75], [-0.4, 3.9, 0.5]]) {
    const y0 = BY - 2.0 - 0.45 * Math.cos(z * 0.3);
    tube(G, [V3(x, y0, z), V3(x, y0 - 0.5, z), V3(x * 1.05, y0 - 0.95, z), V3(x * 1.1, y0 - 1.45, z), V3(x * 1.1, y0 - 1.9, z), V3(x * 1.1, y0 - 2.2, z)],
      [0.1 * s, 0.16 * s, 0.4 * s, 0.56 * s, 0.4 * s, 0.05], 8,
      (k) => ({ a: [-1, 0, 0, 1], b: [0, 0, k < 2 ? 0.1 : 0.62, 0.7 + z * 0.05 + k * 0.012], c: cPale, e: [1, 1] }));
  }
  // neck and head, drooping forward
  {
    const pts = [V3(0, BY + 0.1, 4.6), V3(0, BY + 0.3, 6.0), V3(0, BY - 0.4, 7.0), V3(0, BY - 1.7, 8.0), V3(0, BY - 2.8, 8.5), V3(0, BY - 3.5, 9.2), V3(0, BY - 3.9, 10.1), V3(0, BY - 4.0, 10.6)];
    const rs = [0.9, 0.7, 0.52, 0.42, 0.38, 0.7, 0.56, 0.1], hw = [0, 0.15, 0.35, 0.6, 0.8, 1, 1, 1], gl = [0, 0, 0, 0, 0, 0.3, 0.7, 0.2];
    tube(G, pts, rs, 8, (k) => ({ a: [-1, 0, 0, 1], b: [0, hw[k], gl[k], 0.8 + k * 0.05], c: k > 4 ? cPale : cBody, e: [1, 1] }));
  }
  // tail: a long balancing boom ending in a glowing lure
  {
    const M = 15, pts = [], rs = [], tw = [];
    for (let i = 0; i <= M; i++) {
      const t = i / M;
      pts.push(V3(0, BY + 0.2 + 1.2 * Math.sin(t * Math.PI) + 10.5 * Math.pow(t, 1.7), -5.6 - 15.5 * Math.pow(t, 0.8)));
      rs.push(i === M ? 0.08 : i >= M - 2 ? 0.42 : lerp(0.85, 0.12, Math.pow(t, 0.7)));
      tw.push(t);
    }
    tube(G, pts, rs, 7, (k) => ({ a: [-1, 0, 0, 1], b: [tw[k], 0, k >= M - 2 ? 1 : (k % 3 === 1 ? 0.22 : 0), 1.2 + k * 0.07], c: cBody, e: [1, 1] }));
  }
  // four stilt legs: thigh up and out to a high knee, then one long shin straight down into the water
  for (const L of LEGS) {
    const fz = L.z, hip = V3(L.sx * 1.15, BY + 0.5, fz * 0.55), knee = V3(L.sx * (FOOT_X - 3.4), 25.8, fz * 0.85);
    const tp = [], tr = [], ts = [];
    for (let i = 0; i <= 5; i++) { const s = i / 5; tp.push(hip.clone().lerp(knee, s).add(V3(0, Math.sin(s * Math.PI) * 1.1, 0))); tr.push(lerp(0.72, 0.46, s) + (i === 5 ? 0.22 : 0)); ts.push(s); }
    tube(G, tp, tr, 7, (k) => ({ a: [L.ph, 0.22 * ts[k], 0, 1 - ts[k]], b: [0, 0, k === 5 ? 0.5 : 0, 2 + ts[k] * 0.2], c: cLeg, e: [1, 1] }));
    const sp = [], sr = [], st = [];
    const foot = V3(L.sx * FOOT_X, 0, fz);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      sp.push(knee.clone().lerp(foot, t)); st.push(t);
      sr.push(i === 0 ? 0.66 : i === 10 ? 0.75 : i === 9 ? 0.3 : lerp(0.46, 0.21, t) + (i % 3 === 0 ? 0.09 : 0));
    }
    tube(G, sp, sr, 7, (k) => ({ a: [L.ph, 0.22 + 0.78 * st[k], st[k], 0], b: [0, 0, k === 0 ? 0.55 : (k % 3 === 0 && k < 10 ? 0.06 : 0), 2.3 + st[k] * 0.9], c: cLeg, e: [1, 1] }));
  }
  const cWeb = cPale.clone().lerp(C.pink, 0.3).lerp(C.teal, 0.15);
  for (const L of LEGS) {
    const fz = L.z, hip = V3(L.sx * 1.15, BY + 0.5, fz * 0.55), knee = V3(L.sx * (FOOT_X - 3.4), 25.8, fz * 0.85), foot = V3(L.sx * FOOT_X, 0, fz);
    const NW = 6, base = G.pos.length / 3, nrm = V3(0, 0, 1);
    for (let i = 0; i <= NW; i++) {
      const q = i / NW, tt = 1 - q * 0.8, t = q * 0.42;
      const pa = hip.clone().lerp(knee, tt).add(V3(0, Math.sin(tt * Math.PI) * 1.1 - 0.2, 0)), pb = knee.clone().lerp(foot, t).add(V3(-L.sx * 0.15, 0, 0));
      const mid = pa.clone().lerp(pb, 0.5).add(V3(L.sx * 1.1 * Math.sin(q * Math.PI * 0.5), 0.9 * q, 0));   // the free edge sags inward toward the knee
      const wa = [L.ph, 0.22 * tt, 0, 1 - tt], wb = [L.ph, 0.22 + 0.78 * t, t, 0], wm = [L.ph, (wa[1] + wb[1]) / 2, t / 2, (1 - tt) / 2];
      for (const [p, w, gl] of [[pa, wa, 0.02], [mid, wm, 0.05], [pb, wb, 0.02]]) {
        G.pos.push(p.x, p.y, p.z); G.nor.push(nrm.x * 0.6, 0.5, L.z > 0 ? 0.62 : -0.62);
        G.a.push(w[0], w[1], w[2], w[3]); G.b.push(0, 0, gl, 5 + q * 0.8); G.col.push(cWeb.r, cWeb.g, cWeb.b);
      }
    }
    for (let i = 0; i < NW; i++) for (let j = 0; j < 2; j++) { const a = base + i * 3 + j, b = a + 3; G.idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(G.a, 4));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(G.b, 4));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
  g.setIndex(G.idx);
  return g;
}

// ---------- ring ripples under the Striders' feet ----------
const RING_R = 15;
const RING_VERT = /* glsl */`
attribute vec2 aCorner;
attribute vec4 aRing;      // foot x, rest z, gait phase, strider index
uniform vec4 uStr[9];      // x, z, yaw, gait distance in strides
uniform float uScl[9];
varying vec2 vUv; varying float vAmp, vSeed;
#include <fog_pars_vertex>
${GLSL_GAIT}
void main(){
  int i = int(aRing.w + 0.5);
  vec4 s = uStr[i]; float sc = uScl[i];
  float lift; float dz = footZ(fract(s.w + aRing.z), lift);
  vec2 l = vec2(aRing.x, aRing.y + dz) * sc;
  float cy = cos(s.z), sy = sin(s.z);
  vec2 c = s.xy + vec2(l.x * cy + l.y * sy, -l.x * sy + l.y * cy);
  vAmp = (1. - smoothstep(0.05, 1.2, lift)) * step(0.01, sc);
  vUv = aCorner; vSeed = aRing.z * 17. + aRing.w * 3.1;
  vec4 mvPosition = viewMatrix * vec4(c.x + aCorner.x * ${RING_R.toFixed(1)}, 0.04, c.y + aCorner.y * ${RING_R.toFixed(1)}, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const RING_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vAmp, vSeed;
uniform float uTime; uniform vec3 uIce, uPink;
#include <fog_pars_fragment>
void main(){
  float r = length(vUv);
  if (r > 1. || vAmp < 0.01) discard;
  float R = r * ${RING_R.toFixed(1)};
  float w = sin(R * 1.9 - uTime * 3.4 + vSeed);
  float crest = smoothstep(0.55, 1., w) - 0.5 * smoothstep(0.55, 1., -w);
  float env = smoothstep(0.25, 1.3, R) * pow(1. - r, 1.6);
  vec3 col = mix(uIce, uPink, 0.25) * crest * env * vAmp * 0.9;
  float fogF = 0.;
  #ifdef FOG_EXP2
  fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(max(col, 0.) * (1. - fogF), 1.);
}
`;

// ---------- the Striders' own double shadows: two long streaks from every planted foot ----------
const LEGSH_VERT = /* glsl */`
attribute vec2 aCorner;    // x: 0 at the foot .. 1 at the far end, y: -1..1 across
attribute vec4 aRing;      // foot x, rest z, gait phase, strider index
attribute float aKind;     // 0: thrown by the small sun (long, violet), 1: thrown by the afterglow (shorter, teal)
uniform vec4 uStr[9];
uniform float uScl[9];
uniform vec2 uDirS, uDirG;
varying vec2 vUv; varying float vAmp, vKind;
#include <fog_pars_vertex>
${GLSL_GAIT}
void main(){
  int i = int(aRing.w + 0.5);
  vec4 s = uStr[i]; float sc = uScl[i];
  float lift; float dz = footZ(fract(s.w + aRing.z), lift);
  vec2 l = vec2(aRing.x, aRing.y + dz) * sc;
  float cy = cos(s.z), sy = sin(s.z);
  vec2 c = s.xy + vec2(l.x * cy + l.y * sy, -l.x * sy + l.y * cy);
  vec2 d = aKind < 0.5 ? uDirS : uDirG;
  float len = (aKind < 0.5 ? 64. : 40.) * sc, wid = (aKind < 0.5 ? 1.5 : 1.15) * sc * (1. + 1.6 * aCorner.x);
  c += d * (aCorner.x * len - 0.8) + vec2(-d.y, d.x) * aCorner.y * wid;
  vAmp = (1. - smoothstep(0.05, 1.6, lift)) * step(0.01, sc);
  vUv = aCorner; vKind = aKind;
  vec4 mvPosition = viewMatrix * vec4(c.x, 0.045, c.y, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const LEGSH_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vAmp, vKind;
uniform vec3 uColS, uColG;
#include <fog_pars_fragment>
void main(){
  float vy = clamp(vUv.y, -1., 1.), a = 1. - vy * vy; a *= a;   // clamped: multisampling extrapolates vUv.y past its range on quads seen edge-on
  a *= smoothstep(0., 0.03, vUv.x) * pow(max(1. - vUv.x, 0.), 1.4) * vAmp;
  float fogF = 0.;
  #ifdef FOG_EXP2
  fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(vKind < 0.5 ? uColS : uColG, a * (vKind < 0.5 ? 0.9 : 0.8) * (1. - fogF));
}
`;

// ---------- kite gliders ----------
const GLIDER_VERT = /* glsl */`
attribute vec3 aW;       // span weight 0..1, tail weight 0..1, chord
attribute vec4 aI;       // loop centre xyz, loop radius
attribute vec4 aJ;       // phase, angular speed, size, seed
uniform float uTime;
varying vec3 vW; varying vec2 vUv; varying float vSeed, vTail;
#include <fog_pars_vertex>
void main(){
  float seed = aJ.w, a = aJ.x + uTime * aJ.y;
  vec3 c = aI.xyz + vec3(cos(a) * aI.w, sin(a * 1.7 + seed * 9.) * 2.2 + sin(uTime * 0.21 + seed * 30.) * 3., sin(a) * aI.w * 0.72);
  vec3 fwd = normalize(vec3(-sin(a), 0.12 * cos(a * 1.7 + seed * 9.), cos(a) * 0.72)) * sign(aJ.y);
  vec3 inw = normalize(vec3(-cos(a), 0., -sin(a) * 0.72));
  vec3 up = normalize(vec3(0., 1., 0.) + inw * 0.38);
  vec3 rt = normalize(cross(up, fwd)); up = cross(fwd, rt);
  vec3 p = position;
  float sw = aW.x * aW.x;
  p.y += sw * (0.55 + 0.75 * sin(uTime * 1.25 + seed * 20.)) + aW.x * 0.09 * sin(uTime * 2.6 - p.z * 1.6 + seed * 7.);
  float tw = aW.y;
  p.x += tw * (0.25 + tw) * 0.55 * sin(uTime * 2.1 - tw * 6.5 + seed * 11. + position.x * 2.);
  p.y += tw * 0.4 * sin(uTime * 1.5 - tw * 5. + seed * 3.) - tw * tw * 0.9;
  vec3 wp = c + (rt * p.x + up * p.y + fwd * p.z) * aJ.z;
  vW = wp; vUv = vec2(aW.x, aW.z); vSeed = seed; vTail = tw;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const GLIDER_FRAG = /* glsl */`
precision highp float;
varying vec3 vW; varying vec2 vUv; varying float vSeed, vTail;
uniform vec3 uCam, uSunD, uGlowDir, uPink, uHor, uIce, uMid;
uniform float uMirror, uTime;
#include <fog_pars_fragment>
void main(){
  if (vW.y < 0.) discard;
  vec3 cam = uCam; if (uMirror > 0.5) cam.y = -cam.y;
  vec3 V = normalize(cam - vW);
  // a soft back-lit film: faint ribs, a bright leading edge and spine, fading toward the trailing edge and the tip
  float veins = smoothstep(0.9, 1., abs(sin(vUv.x * 15.7))) * (1. - vUv.x);
  float edge = smoothstep(0.14, 0., vUv.y) * (1. - 0.6 * vUv.x) + 0.25 * smoothstep(0.92, 1., vUv.y);
  float spine = smoothstep(0.07, 0., vUv.x);
  vec3 tint = mix(uIce, mix(uHor * 2., uPink, step(0.6, fract(vSeed * 7.3))), 0.25 + 0.5 * vUv.x);
  tint = mix(tint, mix(uIce, uPink, vUv.y), 0.55);
  // translucent membrane: lit from behind by the afterglow and the small sun
  float back = pow(max(dot(-V, uGlowDir), 0.), 3.) * 1.2 + pow(max(dot(-V, uSunD), 0.), 8.) * 2.2;
  float shim = 0.75 + 0.25 * sin(uTime * 1.7 + vSeed * 50. + vUv.x * 8.);
  vec3 col = tint * (0.34 + 0.5 * back) * shim + (uIce * 0.9 + uPink * 0.4) * (veins * 0.15 + edge * 0.6 + spine * 0.7);
  float alpha = clamp((0.2 + 0.12 * back) * (1. - 0.45 * vUv.y) + veins * 0.08 + edge * 0.4 + spine * 0.5, 0., 0.92);
  if (vTail > 0.) { float tl = clamp(vTail, 0., 1.); col = mix(uPink, uIce, tl) * (1.3 - tl * 0.6); alpha = 0.75 * (1. - tl * 0.7); }   // clamped: multisampling extrapolates vTail on the thin ribbons
  if (uMirror > 0.5) { col *= 0.8; alpha *= 0.85; }
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}
`;
function gliderGeometry() {
  const pos = [], w = [], idx = [];
  const nose = [0, 0, 1.7], tailp = [0, 0, -2.3], NS = 6, NT = 4;
  const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (const sd of [-1, 1]) {
    const tip = [sd * 2.9, 0, -0.1], base = pos.length / 3;
    for (let i = 0; i <= NS; i++) for (let j = 0; j <= NT; j++) {
      const s = i / NS, t = j / NT, lead = L(nose, tip, s), trail = L(tailp, tip, s), p = L(lead, trail, t);
      p[2] -= Math.sin(s * Math.PI) * 0.35 * (t - 0.3);          // swept, slightly scalloped edges
      pos.push(p[0], p[1], p[2]); w.push(s, 0, t);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) { const a = base + i * (NT + 1) + j, b = a + NT + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  // two streaming tail ribbons
  for (const sd of [-1, 1]) {
    const base = pos.length / 3, M = 12;
    for (let i = 0; i <= M; i++) {
      const t = i / M, z = -2.2 - t * 7.5, hw = 0.11 * (1 - t * 0.6);
      pos.push(sd * 0.16 - hw, 0, z, sd * 0.16 + hw, 0, z); w.push(0, t, 0.5, 0, t, 0.5);
    }
    for (let i = 0; i < M; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(w, 3));
  g.setIndex(idx);
  return g;
}

// ---------- mesas (sea stacks), lit by the same two-colour dusk ----------
const MESA_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vN, vW, vCol;
#include <fog_pars_vertex>
void main(){
  vW = position; vN = normal; vCol = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const MESA_FRAG = /* glsl */`
precision highp float;
varying vec3 vN, vW, vCol;
uniform vec3 uCam, uSand; uniform float uMirror;
#include <fog_pars_fragment>
${GLSL_LIGHT}
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  if (vW.y < 0.) discard;
  vec3 cam = uCam; if (uMirror > 0.5) cam.y = -cam.y;
  vec3 V = normalize(cam - vW), N = normalize(vN);
  float a = atan(vW.x, vW.z) * 40.;
  float bed = vn2(vec2(vW.y * 0.22 + vn2(vec2(a * 0.05, vW.y * 0.02)) * 3., 3.7));
  float streak = vn2(vec2(a, vW.y * 0.03));
  vec3 alb = vCol * (0.6 + 0.6 * bed) * (0.85 + 0.3 * streak);
  alb = mix(alb, uSand * 0.25, smoothstep(0.62, 0.9, bed) * 0.35);
  // vertical fractures and joints, talus-dark ledges
  float hx = vW.x * 0.23 + vW.z * 0.19;
  float crack = smoothstep(0.72, 1., vn2(vec2(hx * 1.6, vW.y * 0.012))) + 0.6 * smoothstep(0.8, 1., vn2(vec2(hx * 5. + 9., vW.y * 0.03)));
  alb *= 1. - 0.5 * clamp(crack, 0., 1.);
  float grit = vn2(vec2(hx * 9., vW.y * 0.9)) - 0.5;
  alb *= 1. + 0.35 * grit;
  alb *= 0.45 + 0.55 * smoothstep(0., 9., vW.y);                    // wet tide line
  // rough rock relief in the lighting
  vec3 tg = normalize(cross(N, vec3(0., 1., 0.)) + 1e-4);
  N = normalize(N + tg * (vn2(vec2(hx * 0.9, vW.y * 0.06)) - 0.5) * 0.9 + vec3(0., 1., 0.) * (bed - 0.5) * 0.5 + tg * grit * 0.3);
  vec3 col = shoreLight(alb, N, V);
  // a decided key: lit flank toward the small sun, violet shadow side
  float kd = smoothstep(-0.2, 0.55, dot(N, uSunD));
  col = mix(col * vec3(0.6, 0.52, 0.88) + uMid * 0.012, col * 1.2 + alb * vec3(0.7, 0.86, 1.) * 0.55, kd);
  if (uMirror > 0.5) col *= 0.85;
  gl_FragColor = vec4(col, 1.);
  // capped haze: far stacks sink into the mist but keep their lit flank and shadow side
  #ifdef FOG_EXP2
  float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * vec3(0.8, 0.82, 0.95), min(ff, 0.8));
  #endif
}
`;

const mirrorInstanced = (mesh, material) => {
  const m = new THREE.InstancedMesh(mesh.geometry, material || mesh.material, mesh.count);
  m.instanceMatrix = mesh.instanceMatrix;
  if (mesh.instanceColor) m.instanceColor = mesh.instanceColor;
  m.scale.y = -1;
  return m;
};

export default {
  id: 'ringed-shore',
  name: 'The Ringed Shore',
  category: 'alien',
  weirdness: 0.45,
  async build(ctx) {
    const rng = ctx.rng;
    const scene = new THREE.Scene();

    // ----- per-seed character -----
    const side = rng.sign();                               // the herd wades left or right of the axis
    const mood = rng.pick(['afterglow', 'teal', 'violet']);
    const pal = PALETTE.slice();
    if (mood === 'teal') { pal[0] = '#0b1038'; pal[1] = '#2b2a7c'; pal[2] = '#2cc4a4'; pal[3] = '#ff8cb4'; }
    if (mood === 'violet') { pal[0] = '#170634'; pal[1] = '#4a1c84'; pal[2] = '#2a9cba'; pal[3] = '#ff6ac6'; }
    const mistAmt = rng.range(0.45, 1.25);
    const nGliders = rng.int(18, 28);
    const duration = rng.range(42, 46);
    const WALK = rng.range(2.9, 3.5);                       // Strider walking speed, m/s

    // ----- hero: planet, mirror, arch, sand film (hero-local space == world space) -----
    // this seed's planet: one of three looks, picked by a generator of its own so no other draw moves
    const rv = ctx.core.makeRng((Math.imul(ctx.seed | 0, 0x9e3779b1) ^ 0x5eed) >>> 0);
    const lookId = rv.int(0, 2), palC = pal.map((h) => new THREE.Color(h));
    const mixC = (a, ka, b, kb) => palC[a].clone().multiplyScalar(ka).add(palC[b].clone().multiplyScalar(kb));
    const look = [
      { bandA: mixC(4, 0.95, 3, 0), bandB: mixC(3, 0.8, 4, 0.15), ring: [1.24, 2.08], moon: rv.chance(0.5) ? [rv.range(-0.55, -0.1), rv.range(-0.3, 0.35), 0.06, 0.0022] : null },   // sand and rose, the classic
      { bandA: mixC(4, 0.8, 6, 0.3), bandB: mixC(1, 1.5, 3, 0.45), ring: [1.5, 2.26], moon: [rv.range(-0.5, 0), rv.range(-0.25, 0.4), 0.075, 0.0026] },                      // pale cream and violet, a narrow far ring, a moon in transit
      { bandA: mixC(3, 0.9, 4, 0.25), bandB: mixC(4, 0.7, 2, 0.3), ring: [1.16, 1.86], moon: null },                                                                          // rose and sea-green, a broad close ring
    ][lookId];
    const fieldBias = rv.range(-0.55, 0.55), fieldN = rv.int(88, 128), teethFlip = rv.chance(0.5) ? -1 : 1;
    // the planet stands large and low on the sky along the whole flight: at the entry its centre is 18.6 degrees up and its disc
    // 33.5 degrees across, and on the way in it swells only a little (to 34.5 degrees across), so its lower limb stays 1.1 to
    // 1.9 degrees above the seam and its top 35.3 to 36.3 degrees up
    const hero = await buildHero(ctx, { palette: pal, look, planetElev0: 18.6, planetSize0: 33.5, planetElev: rng.range(18.8, 19.0), planetSize: 34.5, planetElev1: 18.4, ringTilt: rng.range(12, 21), sky: 'full' });
    scene.add(hero.object);
    const A = hero.anchors, C = hero.colors;
    await ctx.yield();

    const fogC = C.teal.clone().multiplyScalar(0.4).add(C.pink.clone().multiplyScalar(0.07)).add(C.violet.clone().multiplyScalar(0.27));
    scene.fog = new THREE.FogExp2(fogC, 0.00105 * (0.85 + 0.25 * mistAmt));
    const keyLight = new THREE.DirectionalLight(A.keyLight.color, 2.3);
    keyLight.position.copy(A.sunDir).multiplyScalar(400);
    const hemi = new THREE.HemisphereLight(C.violet.clone().lerp(C.pink, 0.4).multiplyScalar(1.6), C.teal.clone().lerp(C.violet, 0.5).multiplyScalar(0.9), 1.5);
    scene.add(keyLight, hemi);

    // ----- the flight -----
    const sx = (p) => [p[0] * side, p[1], p[2]];
    const pts = [[0, 4, 880], [0, 4.2, 812], [-2, 5, 742], [-8, 6.6, 662], [-26, 8.6, 582], [-42, 9.6, 512], [-38, 11, 452], [-24, 14.5, 396], [-9, 18.6, 336]].map(sx);
    for (let i = 0; i < A.flyThrough.length - 1; i++) pts.push([A.flyThrough[i].x, A.flyThrough[i].y, A.flyThrough[i].z]);
    const path = makePath(pts);

    // ----- the Striders' route: joins the camera path around u 0.42, then bears away past the arch -----
    const jit = () => rng.range(-10, 10);
    // The file wades the shallows beside the entry reach of the flight, on the herd's side of the path. The reach runs from REACH0
    // to REACH1 metres of path from the start; the route's first three control points stand abeam of its head, its middle and its
    // end: WADE metres off the path at the head, two thirds of that at the middle, one third at the end (the first two shifted up
    // to 10 m by a seeded draw). So the file closes on the line of flight evenly and joins it at the fourth point, which is a
    // point of the path; it runs with the flight to the meeting point, then bears away across the flat at 45 degrees and more.
    const REACH0 = 60, REACH1 = 280, WADE = 150;
    const reachPt = (k, j) => {                              // k: 0, 1, 2 along the reach; j: seeded shift toward the path, metres
      const d = lerp(REACH0, REACH1, k / 2), p = path.posAtDist(d), t = path.tangentAtDist(d), l = (side * (WADE * (1 - k / 3) - j)) / (Math.hypot(t.x, t.z) || 1);
      return new THREE.Vector3(p.x + t.z * l, 0, p.z - t.x * l);
    };
    const routePts = [reachPt(0, jit()), reachPt(1, jit()), reachPt(2, 0), ...[[-42, 512], [-46, 450], [-64, 396], [-100 + jit() * 0.4, 348], [-150 + jit() * 0.4, 306], [-210 + jit() * 0.4, 270],
      [-280 + jit() * 0.4, 240], [-360 + jit() * 0.4, 216], [-450, 198], [-560, 184], [-680, 176]].map(([x, z]) => new THREE.Vector3(x * side, 0, z))];
    const route = new THREE.CatmullRomCurve3(routePts, false, 'centripetal');
    route.arcLengthDivisions = 600;
    const routeLen = route.getLength();
    const RS = 260, rX = new Float32Array(RS + 1), rZ = new Float32Array(RS + 1), rTX = new Float32Array(RS + 1), rTZ = new Float32Array(RS + 1);
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    for (let i = 0; i <= RS; i++) { route.getPointAt(i / RS, _p); rX[i] = _p.x; rZ[i] = _p.z; route.getTangentAt(i / RS, _t); rTX[i] = _t.x; rTZ[i] = _t.z; }
    // position (_p) and unit tangent (_t) at arc length s, from the tables: nothing is allocated per frame
    const routeAt = (sLen) => {
      const f = clamp(sLen / routeLen, 0.002, 0.998) * RS, i = Math.min(RS - 1, Math.floor(f)), k = f - i;
      _p.set(rX[i] + (rX[i + 1] - rX[i]) * k, 0, rZ[i] + (rZ[i + 1] - rZ[i]) * k);
      const tx = rTX[i] + (rTX[i + 1] - rTX[i]) * k, tz = rTZ[i] + (rTZ[i + 1] - rTZ[i]) * k, l = Math.hypot(tx, tz) || 1;
      _t.set(tx / l, 0, tz / l);
    };
    // the last three of the herd have gone ahead (position at u 0.8, heading). All three walk across the line of sight, so they are
    // seen in profile: one wades beside the final run and is passed at about u 0.84, one comes in from the other side and is
    // passed just before the arch, the third crosses behind the arch.
    const LAT_MAX = 24;
    const tracks = [[-side * (54 + rng.range(-4, 4)), 146 + rng.range(-6, 6), side * 0.9, -0.44], [-side * (100 + rng.range(-4, 4)), -88 + rng.range(-6, 6), side * 0.9, -0.44],
      [side * (68 + rng.range(-4, 4)), 60 + rng.range(-8, 8), -side * 0.85, -0.53]].map(([x, z, dx, dz]) => { const l = Math.hypot(dx, dz); return { x, z, dx: dx / l, dz: dz / l, yaw: Math.atan2(dx, dz) }; });
    const routeDist = (x, z) => {
      let b = 1e9; for (let i = 0; i <= RS; i++) { const dx = rX[i] - x, dz = rZ[i] - z, d = dx * dx + dz * dz; if (d < b) b = d; }
      b = Math.sqrt(b) - LAT_MAX;                                   // animals walk up to LAT_MAX off the line
      for (const tr of tracks) {
        const k = clamp((x - tr.x) * tr.dx + (z - tr.z) * tr.dz, -150, 50), d = Math.hypot(x - tr.x - tr.dx * k, z - tr.z - tr.dz * k);
        if (d < b) b = d;
      }
      return b;
    };
    // which side of the path the herd wades on at a station of the path (point pc, tangent tg): the side on which the points of
    // the route within BESIDE metres of the station lie. +1: the side of the path's normal (-tg.z, tg.x); -1: the other side;
    // 0: no part of the route is that near, the herd does not wade beside the path there
    const BESIDE = 180;
    const herdSide = (pc, tg) => {
      let sum = 0;
      for (let i = 0; i <= RS; i++) { const dx = rX[i] - pc.x, dz = rZ[i] - pc.z; if (dx * dx + dz * dz < BESIDE * BESIDE) sum += dz * tg.x - dx * tg.z; }
      return Math.sign(sum);
    };
    await ctx.yield();
    const p42 = path.pointAt(0.42);
    let s42 = 0;
    { let b = 1e9; for (let i = 0; i <= 1600; i++) { route.getPointAt(i / 1600, _p); const d = _p.distanceToSquared(new THREE.Vector3(p42.x, 0, p42.z)); if (d < b) { b = d; s42 = (i / 1600) * routeLen; } } }

    await ctx.yield();
    // ----- shared uniforms for everything shaded in this file -----
    const SU = {
      uSunD: { value: A.sunDir.clone() }, uGlowDir: { value: A.glowDir.clone() }, uPink: { value: C.pink }, uMid: { value: C.violet }, uHor: { value: C.teal },
      uIce: { value: C.ice }, uSand: { value: C.sand }, uDark: { value: C.dark }, uCam: { value: new THREE.Vector3(0, 4, 880) }, uTime: { value: 0 }, uDist: { value: 0 },
    };
    const mkMat = (vertexShader, fragmentShader, mirror, extra = {}) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...SU, uMirror: { value: mirror } }, vertexShader, fragmentShader, fog: true, side: THREE.DoubleSide, ...extra,
    });
    const under = new THREE.Group();                        // everything mirrored below the sand film
    under.name = 'mirror-images';
    scene.add(under);

    // ----- Striders: nine, in file -----
    // rel: each animal's place in the file, metres along the route from the third. The two behind the third follow it TAIL_GAP
    // metres apart; every animal but the third is shifted up to 9 m along the route by a seeded draw
    const NS = 9, THIRD = 2, TAIL_GAP = 75;
    const rel = [-2 * TAIL_GAP, -TAIL_GAP, 0, 96, 156, 218, 640, 740, 900], scl = [], seeds = [];
    for (let i = 0; i < NS; i++) { if (i !== THIRD) rel[i] += rng.range(-9, 9); scl.push(i === THIRD ? 1 : rng.range(0.86, 1.1)); seeds.push(rng()); }
    await ctx.yield();
    const sGeo = striderGeometry(rng.fork('strider'), C);
    await ctx.yield();
    const inst = new Float32Array(NS * 3);
    for (let i = 0; i < NS; i++) inst.set([rel[i], seeds[i], scl[i]], i * 3);
    sGeo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3));
    const striders = new THREE.InstancedMesh(sGeo, mkMat(STRIDER_VERT, STRIDER_FRAG, 0), NS);
    striders.frustumCulled = false;
    const stridersM = mirrorInstanced(striders, mkMat(STRIDER_VERT, STRIDER_FRAG, 1));
    stridersM.frustumCulled = false;
    scene.add(striders); under.add(stridersM);
    const strU = [], sclU = scl.slice();
    for (let i = 0; i < NS; i++) strU.push(new THREE.Vector4());
    // ring ripples: one quad per foot
    {
      const corner = [], ring = [], idx = [], zero = [];
      let v = 0;
      for (let i = 0; i < NS; i++) for (const L of LEGS) {
        for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { corner.push(q[0], q[1]); ring.push(L.sx * FOOT_X, L.z, L.ph, i); zero.push(0, 0, 0); }
        idx.push(v, v + 2, v + 1, v, v + 3, v + 2); v += 4;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(zero, 3));
      g.setAttribute('aCorner', new THREE.Float32BufferAttribute(corner, 2));
      g.setAttribute('aRing', new THREE.Float32BufferAttribute(ring, 4));
      g.setIndex(idx);
      const rings = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uStr: { value: strU }, uScl: { value: sclU }, uTime: SU.uTime, uIce: SU.uIce, uPink: SU.uPink },
        vertexShader: RING_VERT, fragmentShader: RING_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }));
      rings.frustumCulled = false; rings.renderOrder = 2;
      scene.add(rings);
      // two shadow streaks per foot, on the film: violet away from the small sun, teal away from the afterglow
      const sc2 = [], sr2 = [], sk2 = [], si2 = [], sz2 = [];
      let w = 0;
      for (let i = 0; i < NS; i++) for (const L of LEGS) for (let kind = 0; kind < 2; kind++) {
        for (const q of [[0, -1], [1, -1], [1, 1], [0, 1]]) { sc2.push(q[0], q[1]); sr2.push(L.sx * FOOT_X, L.z, L.ph, i); sk2.push(kind); sz2.push(0, 0, 0); }
        si2.push(w, w + 2, w + 1, w, w + 3, w + 2); w += 4;
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute(sz2, 3));
      g2.setAttribute('aCorner', new THREE.Float32BufferAttribute(sc2, 2));
      g2.setAttribute('aRing', new THREE.Float32BufferAttribute(sr2, 4));
      g2.setAttribute('aKind', new THREE.Float32BufferAttribute(sk2, 1));
      g2.setIndex(si2);
      const legShadows = new THREE.Mesh(g2, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uStr: { value: strU }, uScl: { value: sclU },
          uDirS: { value: new THREE.Vector2(-A.sunDir.x, -A.sunDir.z).normalize() }, uDirG: { value: new THREE.Vector2(-A.glowDir.x, -A.glowDir.z).normalize() },
          uColS: { value: C.violet.clone().lerp(C.pink, 0.3).multiplyScalar(0.78) }, uColG: { value: C.teal.clone().multiplyScalar(0.5) } },
        vertexShader: LEGSH_VERT, fragmentShader: LEGSH_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      }));
      legShadows.name = 'strider-shadows'; legShadows.frustumCulled = false; legShadows.renderOrder = 1.35;
      scene.add(legShadows);
    }
    let drift = 0, lastTime = null, lastU = 0;
    const DRIFT = 14, _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    const baseAt = (u) => s42 - WALK * (0.42 - u) * duration + DRIFT * Math.tanh(drift / DRIFT);
    const thirdBody = new THREE.Vector3();
    const thirdAt = (time, u) => { routeAt(baseAt(u)); thirdBody.set(_p.x, 20.5, _p.z); return thirdBody; };
    const ripLegsA = [[THIRD, 0], [THIRD, 1], [THIRD, 2], [THIRD, 3], [THIRD + 1, side > 0 ? 0 : 2], [THIRD + 1, side > 0 ? 1 : 3]];
    const ripLegsB = [[6, 0], [6, 1], [6, 2], [6, 3], [8, side > 0 ? 2 : 0], [8, side > 0 ? 3 : 1]];     // the final run: the animals beside the arch
    // each animal walks its own line a few metres off the route (outward +), so the file never nests into hoops seen from behind
    const lat = [-10, 12, 0, 24, -9, 15, 0, 0, 0].map((v) => v * side);
    const base08 = s42 + WALK * 0.38 * duration;
    // the third animal walks a line of its own BULGE metres outside the route and merges onto the route between MERGE0 and MERGE1
    // metres of route short of the meeting point: a stretch of the flat, which the animal walks through wherever the flight is
    const BULGE = 12 * side, MERGE0 = 30, MERGE1 = 3;
    function placeStriders(u) {
      const base = baseAt(u);
      SU.uDist.value = base;
      for (let i = 0; i < NS; i++) {
        let yaw;
        if (i >= 6) { const tr = tracks[i - 6], d = base - base08; _p.set(tr.x + tr.dx * d, 0, tr.z + tr.dz * d); yaw = tr.yaw; }
        else if (i === THIRD) {
          // e: how far through the merging stretch the animal itself has walked; l3: its distance outside the route there;
          // dl: the slope of its line against the route, which turns its heading while it merges
          const s3 = base + rel[i], e = clamp((s3 - (s42 - MERGE0)) / (MERGE0 - MERGE1), 0, 1), l3 = BULGE * (1 - e * e * (3 - 2 * e)), dl = (-BULGE * 6 * e * (1 - e)) / (MERGE0 - MERGE1);
          routeAt(s3);
          const ox = _t.z, oz = -_t.x;
          yaw = Math.atan2(_t.x + ox * dl, _t.z + oz * dl); _p.x += ox * l3; _p.z += oz * l3;
        } else { routeAt(base + rel[i]); yaw = Math.atan2(_t.x, _t.z); _p.x += _t.z * lat[i]; _p.z -= _t.x * lat[i]; }
        _m.compose(_p, _q.setFromAxisAngle(Y, yaw), _s.setScalar(scl[i]));
        striders.setMatrixAt(i, _m);
        strU[i].set(_p.x, _p.z, yaw, (base + rel[i]) / (STRIDE * scl[i]));
      }
      striders.instanceMatrix.needsUpdate = true;
      // the nearest feet also bend the planet's reflection (hero ripple sources 2..7)
      const ripLegs = u > 0.52 ? ripLegsB : ripLegsA;
      for (let k = 0; k < ripLegs.length; k++) {
        const s = strU[ripLegs[k][0]], L = LEGS[ripLegs[k][1]], sc = scl[ripLegs[k][0]];
        const ph = (((s.w + L.ph) % 1) + 1) % 1, fz = footZ(ph);
        const lx = L.sx * FOOT_X * sc, lz = (L.z + fz[0]) * sc, cy = Math.cos(s.z), sy = Math.sin(s.z);
        hero.setRipple(2 + k, s.x + lx * cy + lz * sy, s.y - lx * sy + lz * cy, fz[1] > 0.05 ? 0.25 : 1.3, k * 1.7);
      }
    }
    placeStriders(0);
    await ctx.yield();

    // ----- crystal spires (same crystal as the arch), in chunks so they cull -----
    const rs = rng.fork('spires');
    const chunks = [[], [], [], []], chunkOf = (z) => (z > 600 ? 0 : z > 430 ? 1 : z > 210 ? 2 : 3);
    const spireOK = (x, z, h, minPath) => {
      const n = path.nearestXZ(x, z);
      if (n.dist < minPath + h * 0.36) return false;
      if (routeDist(x, z) < 17 + h * 0.3) return false;
      if (z < 300 && Math.abs(x) < 16 + (300 - z) * 0.2) return false;      // keep the final run open
      if (Math.hypot(x, z) < 46) return false;                               // the arch has its own shards
      if (z > 850 && Math.abs(x) < 30) return false;                         // nothing around the entry
      return true;
    };
    const casters = [];                                        // [x, z, height, half width] of everything that throws a shadow on the film
    const addSpire = (x, z, h, o = {}) => { chunks[chunkOf(z)].push({ x, z, h, lean: [rs.gauss() * 0.07, rs.gauss() * 0.07], ...o }); if (h > 3.2) casters.push([x, z, h, h * 0.07 + 0.5]); };
    // E: three tall dark teeth on the seam, framing the planet in the entry view
    for (const [x, z, h] of [[side * 44, 640, 36], [side * 36, 722, 30], [-side * 24, 772, 26]]) {
      addSpire(x + rs.range(-2, 2), z + rs.range(-5, 5), h * rs.range(0.92, 1.1), { dark: 0.22, r: h * 0.09, glow: 0.7, shards: 5, tip: true, lean: [rs.gauss() * 0.03, rs.gauss() * 0.03] });
    }
    // A: the crystal field the camera climbs through (u 0.5 - 0.68)
    for (let i = 0, k = 0; i < 900 && k < fieldN; i++) {
      const z = rs.range(232, 476), far = Math.pow(rs(), 1.5), d = 9 + far * 95;
      const pp = path.nearestXZ(0, z), px = path.pointAt(pp.u).x, x = px + (rs() < 0.5 + 0.5 * fieldBias ? -1 : 1) * d + rs.range(-3, 3);
      const h = lerp(5, 40, Math.pow(rs(), 2.2)) * (0.45 + 0.55 * smoothstep(8, 46, d));
      if (!spireOK(x, z, h, 8.5)) continue;
      addSpire(x, z, h); k++;
    }
    await ctx.yield();
    // B: sparse teeth along the horizon seam and out on the flanks
    for (let i = 0, k = 0; i < 600 && k < 52; i++) {
      const x = rs.range(-380, 380), z = rs.range(60, 660), h = lerp(7, 36, Math.pow(rs(), 1.8));
      if (Math.abs(x) < 34 || !spireOK(x, z, h, 30)) continue;
      addSpire(x, z, h, { shards: rs.int(1, 2) }); k++;
    }
    await ctx.yield();
    // C: four clusters beside the first third of the flight: one every tenth of the path's length (89 m) from 62 m in, each shifted
    // up to 18 m along the path by a seeded draw, 30 to 62 m off the path (the third at 0.55 of that). One rule decides the side
    // of all four: beside a reach where the herd wades, a cluster stands across the path from the herd (the path heads toward -z
    // here, so the + side of its normal is +x); were no herd beside its station, it would stand on the side the herd does not enter from
    for (let c = 0; c < 4; c++) {
      const u0 = 0.07 + c * 0.1 + rs.range(-0.02, 0.02), pc = path.pointAt(u0), lat = -(herdSide(pc, path.tangentAt(u0)) || -side) * rs.range(30, 62) * (c === 2 ? 0.55 : 1);
      const n = rs.int(5, 9);
      for (let j = 0; j < n; j++) {
        const x = pc.x + lat + rs.gauss() * 9, z = pc.z + rs.gauss() * 12, h = lerp(4, 24, Math.pow(rs(), 1.6));
        if (spireOK(x, z, h, 14)) addSpire(x, z, h);
      }
    }
    await ctx.yield();
    // D: glittering shards all along the route, low and close: the foreground
    for (let i = 0, k = 0; i < 700 && k < 130; i++) {
      const u0 = rs.range(0.03, 0.97), pc = path.pointAt(u0), tg = path.tangentAt(u0), d = rs.sign() * (7.5 + Math.pow(rs(), 1.4) * 26);
      const x = pc.x - tg.z * d, z = pc.z + tg.x * d, h = rs.range(0.5, 2.6) * (rs.chance(0.12) ? 2 : 1);
      if (path.nearestXZ(x, z).dist < 7.2 || routeDist(x, z) < 13 || Math.hypot(x, z) < 40) continue;
      addSpire(x, z, h, { shards: rs.int(1, 3), tip: rs.chance(0.25), glow: 0.5, lean: [rs.gauss() * 0.3, rs.gauss() * 0.3] }); k++;
      if ((i & 127) === 127) await ctx.yield();
    }
    // F: two dark teeth close to the entry axis, so the view through the previous portal has silhouettes standing on the seam
    for (const [x, z, h] of [[side * teethFlip * 15.5, 812, 18], [-side * teethFlip * 17.5, 800, 24]]) {
      addSpire(x, z + rs.range(-4, 4), h * rs.range(0.92, 1.08), { dark: 0.22, r: h * 0.075, glow: 0.3, shards: 2, tip: true, lean: [rs.gauss() * 0.02, rs.gauss() * 0.02] });
    }
    await ctx.yield();
    const tips = [];
    for (const list of chunks) {
      if (!list.length) continue;
      const c = await hero.buildCrystals(list, rs, () => ctx.yield());
      hero.object.add(c.object);
      for (const t of c.tips) tips.push(t);
      await ctx.yield();
    }
    hero.object.add(hero.buildTipGlints(tips, rs));
    await ctx.yield();
    // G: more low crystals of the foreground, from a generator of their own (rc: places, heights, leans, shapes, tints and tip
    // sparks) and kept in lists of their own, so that nothing here takes a draw from the shared spire stream above
    const rc = ctx.core.makeRng((Math.imul(ctx.seed | 0, 0x9e3779b1) ^ 0xc1a5) >>> 0);
    const lows = [[], []];                                     // beside the first half of the flight, beside the second
    const addLow = (x, z, h, o) => { lows[z > 430 ? 0 : 1].push({ x, z, h, ...o }); if (h > 3.2) casters.push([x, z, h, h * 0.07 + 0.5]); };
    // 36 low clusters (3 to 6 m tall, three shards and a lit tip each) beside the whole flight: one in every 22 m of path (4.5 to
    // the hundred metres) from 40 m after the entry to 49 m before the arch, at a seeded place inside its 22 m, 9.6 to 16 m off
    // the line of flight, on alternating sides (on the other side where the first is not free). Beside the open final run
    // (z under 300) they stand 12.5 to 17.5 m off the line and are a fifth lower.
    const NCL = 36;
    for (let j = 0; j < NCL; j++) {
      const u0 = 0.045 + ((j + rc()) / NCL) * 0.9, pc = path.pointAt(u0), tg = path.tangentAt(u0), open = pc.z < 300, d0 = open ? rc.range(12.5, 17.5) : rc.range(9.6, 16), h = rc.range(3, 6) * (open ? 0.8 : 1);
      const lx = rc.gauss() * 0.1, lz = rc.gauss() * 0.1;
      for (const sd of j % 2 ? [1, -1] : [-1, 1]) {
        const x = pc.x - tg.z * d0 * sd, z = pc.z + tg.x * d0 * sd;
        if (path.nearestXZ(x, z).dist < 9.2 || routeDist(x, z) < 13 || Math.hypot(x, z) < 40) continue;
        addLow(x, z, h, { shards: 3, tip: true, glow: 0.6, lean: [lx, lz] });
        break;
      }
    }
    await ctx.yield();
    // and 16 more shards by the rule of D: a seeded station anywhere along the flight, 7.5 to 33.5 m off the line on a seeded side
    for (let i = 0, k = 0; i < 300 && k < 16; i++) {
      const u0 = rc.range(0.03, 0.97), pc = path.pointAt(u0), tg = path.tangentAt(u0), d = rc.sign() * (7.5 + Math.pow(rc(), 1.4) * 26);
      const x = pc.x - tg.z * d, z = pc.z + tg.x * d, h = rc.range(0.5, 2.6) * (rc.chance(0.12) ? 2 : 1);
      if (path.nearestXZ(x, z).dist < 7.2 || routeDist(x, z) < 13 || Math.hypot(x, z) < 40) continue;
      addLow(x, z, h, { shards: rc.int(1, 3), tip: rc.chance(0.25), glow: 0.5, lean: [rc.gauss() * 0.3, rc.gauss() * 0.3] }); k++;
    }
    await ctx.yield();
    const lowTips = [];
    for (const list of lows) {
      if (!list.length) continue;
      const c = await hero.buildCrystals(list, rc, () => ctx.yield());
      hero.object.add(c.object);
      for (const t of c.tips) lowTips.push(t);
      await ctx.yield();
    }
    if (lowTips.length) hero.object.add(hero.buildTipGlints(lowTips, rc));
    await ctx.yield();

    // ----- mesas offshore, with pink frond spirals on top -----
    const rm = rng.fork('mesas');
    const mesaParts = [], mesas = [], frondSpots = [];
    const hex = (c) => '#' + c.getHexString();
    const mCol = hex(C.violet.clone().lerp(C.dark, 0.35).lerp(C.sand, 0.12)), mColB = hex(C.dark.clone().lerp(C.violet, 0.35)), mTop = hex(C.violet.clone().lerp(C.pink, 0.35));
    const nMesa = rm.int(9, 12);
    for (let i = 0, k = 0; i < 400 && k < nMesa; i++) {
      const farSet = k < 3, sd = k % 2 ? 1 : -1;
      const x = sd * (farSet ? rm.range(430, 980) : rm.range(385, 860)), z = farSet ? rm.range(-1500, -850) : rm.range(-700, 840);
      if (mesas.some((m) => Math.hypot(m.x - x, m.z - z) < 230) || routeDist(x, z) < 120) continue;
      const h = rm.range(80, 150) * (farSet ? 1.25 : 1), r = rm.range(26, 54) * (farSet ? 1.3 : 1);
      const g = T.seaStackGeometry({ rng: rm, height: h, radius: r, segments: 28, ledges: rm.int(3, 5), top: 'flat', sink: 0, lean: 0.06, undercut: 0.13, flute: 0.26, lobes: 0.42, waist: 0.2, roughness: 0.42, crease: 0.6,
        color: mCol, colorB: mColB, colorTop: mTop });
      casters.push([x, z, Math.min(h, 60), r * 0.85]);
      mesaParts.push({ g, m: new THREE.Matrix4().makeRotationY(rm.range(0, 6.28)).setPosition(x, 0, z) });
      mesas.push({ x, z, h, r }); k++;
      const nf = rm.int(3, 6);
      for (let j = 0; j < nf; j++) { const a = rm.range(0, 6.28), rr = rm.range(0, 0.42) * r; frondSpots.push([x + Math.cos(a) * rr, h - 1, z + Math.sin(a) * rr, rm.range(2.4, 4.6), rm.range(0, 6.28)]); }
      await ctx.yield();
    }
    const mesaGeo = T.mergeRocks(mesaParts);
    await ctx.yield();
    for (const p of mesaParts) p.g.dispose();
    const mesaMesh = new THREE.Mesh(mesaGeo, mkMat(MESA_VERT, MESA_FRAG, 0));
    const mesaMirror = new THREE.Mesh(mesaGeo, mkMat(MESA_VERT, MESA_FRAG, 1));
    mesaMirror.scale.y = -1;
    scene.add(mesaMesh); under.add(mesaMirror);
    await ctx.yield();

    // ----- flora: one wind, one material -----
    const rf = rng.fork('flora');
    const wind = flora.makeWind({ direction: [0.8 * side, 0.5], strength: rng.range(0.8, 1.3), speed: 0.8 });
    await ctx.yield();
    const fOpts = { wind, backlight: 1.1, backlightTint: hex(C.pink), ambient: 1.6, leafAmbient: 1.0, glow: 0.7, hold: true };   // hold: colour and glow stay inside what the plants carry (a far crystal facet under a multisample glowed as a white square)
    await flora.prepareLeafTexture(fOpts, () => ctx.yield());      // draws the leaf atlas in short steps
    const fMat = flora.windMaterial(fOpts);
    await ctx.yield();
    const dummy = new THREE.Object3D(), floraGeos = [];
    const instanced = (geo, list) => {     // list: [x, y, z, scale, rot]
      const m = new THREE.InstancedMesh(geo, fMat, list.length); floraGeos.push(geo);
      list.forEach((p, i) => { dummy.position.set(p[0], p[1], p[2]); dummy.rotation.set(0, p[4], 0); dummy.scale.setScalar(p[3]); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
      const mm = mirrorInstanced(m);
      scene.add(m); under.add(mm);
      m.userData.mirror = mm;
      return m;
    };
    const frondGeo = flora.frondSpiralGeometry({ rng: rf, detail: 0, height: 8, stalk: hex(C.violet), stalkTip: hex(C.pink), leaf: hex(C.pink.clone().lerp(C.violet, 0.5)), leafTip: '#ffc0dc', glow: 1.8 });
    await ctx.yield();
    instanced(frondGeo, frondSpots);
    // tendril plants: clusters beside the path that fold away as the camera nears
    const tendrils = [[], []];
    const tendrilAt = (u0, sd, latMin, latMax) => {
      const pc = path.pointAt(u0), tg = path.tangentAt(u0), n = rf.int(3, 6), lat = sd * rf.range(latMin, latMax);
      for (let j = 0; j < n; j++) {
        const d = lat + sd * Math.abs(rf.gauss()) * 3.5, al = rf.gauss() * 5;
        const x = pc.x - tg.z * d + tg.x * al, z = pc.z + tg.x * d + tg.z * al;
        if (path.nearestXZ(x, z).dist < 8 || routeDist(x, z) < 13.5) continue;
        tendrils[u0 < 0.5 ? 0 : 1].push([x, 0, z, rf.range(0.6, 1.2), rf.range(0, 6.28)]);
      }
    };
    for (let c = 0; c < 7; c++) tendrilAt(0.1 + c * 0.03 + rf.range(-0.008, 0.008), c % 2 ? 1 : -1, 9, c % 2 === (side > 0 ? 1 : 0) ? 20 : 11.5);
    for (let c = 0; c < 3; c++) tendrilAt(0.75 + c * 0.06 + rf.range(-0.01, 0.01), c % 2 ? 1 : -1, 16, 26);
    const tGeo = [];
    for (let i = 0; i < 2; i++) {
      tGeo.push(flora.tendrilGeometry({ rng: rf, detail: 1, count: 6, height: rf.range(6, 7.5), base: hex(C.dark.clone().lerp(C.teal, 0.3)), mid: hex(C.teal), tip: hex(C.pink.clone().lerp(C.violet, 0.3)), glow: 1.6 }));
      await ctx.yield();
    }
    const tMesh = tendrils.map((list, i) => (list.length ? instanced(tGeo[i], list) : null));
    for (const m of tMesh) if (m) { m.frustumCulled = false; m.userData.mirror.frustumCulled = false; }
    const updateTendrils = (cam, u) => {
      for (let v = 0; v < 2; v++) {
        const mesh = tMesh[v]; if (!mesh) continue;
        if (!(v === 0 ? u < 0.45 : u > 0.4)) continue;      // both sets stay in the scene: nothing is switched on or off in flight
        const list = tendrils[v];
        for (let i = 0; i < list.length; i++) {
          const p = list[i], d = Math.hypot(p[0] - cam.x, p[2] - cam.z), open = smoothstep(20, 58, d);
          dummy.position.set(p[0], 0, p[2]); dummy.rotation.set(0, p[4] + (1 - open) * 1.4, 0);
          dummy.scale.set(p[3] * lerp(0.55, 1, open), p[3] * lerp(0.16, 1, open), p[3] * lerp(0.55, 1, open));
          dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    };
    // crystal trees with glowing tips, the middle scale between tendrils and spires
    await ctx.yield();
    {
      const list = [];
      for (let i = 0; i < 300 && list.length < 10; i++) {
        const u0 = rf.range(0.08, 0.62), pc = path.pointAt(u0), tg = path.tangentAt(u0), d0 = rf.sign() * rf.range(24, 52), d = u0 < 0.3 ? side * Math.abs(d0) : d0;   // early trees stand across the path from the herd, never in front of it
        const x = pc.x - tg.z * d, z = pc.z + tg.x * d;
        if (path.nearestXZ(x, z).dist < (u0 < 0.2 ? 40 : 22) || routeDist(x, z) < 16) continue;
        list.push([x, -0.1, z, rf.range(0.9, 1.6), rf.range(0, 6.28)]);
      }
      await ctx.yield();
      const treeGeo = flora.crystalTreeGeometry({ rng: rf, detail: 1, height: 10, trunk: hex(C.violet), trunkDark: hex(C.dark), trunkLight: hex(C.teal), crystal: hex(C.teal.clone().lerp(C.violet, 0.25).multiplyScalar(0.85)), crystalTip: hex(C.ice.clone().multiplyScalar(0.6)), glow: 0.6 });
      await ctx.yield();
      instanced(treeGeo, list);
      for (const t of list) casters.push([t[0], t[2], 9 * t[3], 2.2 * t[3]]);
    }
    flora.holdGlow(fMat, floraGeos);   // every plant drawn with fMat is in the list by now
    await ctx.yield();

    await ctx.yield();
    // ----- double shadows on the wet film: a long violet-blue one away from the small sun, a shorter teal one away from the afterglow -----
    {
      for (const f of A.feet) casters.push([f.x, f.z, 30, 3.2]);
      const pos = [], uv = [], colr = [], idx = [];
      const sd = new THREE.Vector2(-A.sunDir.x, -A.sunDir.z).normalize(), gd = new THREE.Vector2(-A.glowDir.x, -A.glowDir.z).normalize();
      const cS = C.violet.clone().multiplyScalar(0.9), cSn = C.violet.clone().lerp(C.pink, 0.2).multiplyScalar(0.72), cG = C.teal.clone().multiplyScalar(0.55), cK = C.dark.clone().multiplyScalar(0.25);
      let v = 0;
      const quad = (x, z, d, L, w, c, a) => {
        const nx = -d.y, nz = d.x;
        for (const [uu, vv] of [[0, -1], [1, -1], [1, 1], [0, 1]]) {
          const ww = w * (uu ? 0.4 : 1) * vv, al = uu ? L : -w * 0.7;
          pos.push(x + d.x * al + nx * ww, 0.03, z + d.y * al + nz * ww); uv.push(uu, vv); colr.push(c.r, c.g, c.b, a);
        }
        idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
      };
      // a dark contact pool under each caster (uv.x 2..3 marks it for the shader)
      const pool = (x, z, r) => {
        for (const [uu, vv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x + uu * r, 0.035, z + vv * r); uv.push(2.5 + uu * 0.5, vv); colr.push(cK.r, cK.g, cK.b, 0.6); }
        idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
      };
      let ci = 0;
      for (const [x, z, h, w] of casters) {
        const near = path.nearestXZ(x, z).dist < 80;          // the shadows the flight passes close to are the ones that must read
        quad(x, z, sd, Math.min(h * 1.9, 80), w * 2.3, near ? cSn : cS, near ? 0.82 : 0.75); quad(x, z, gd, Math.min(h * 1.5, 56), w * 1.4, cG, near ? 0.88 : 0.65); if (w < 12) pool(x, z, w * 1.5 + 0.6);
        if ((++ci & 63) === 0) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(colr, 4));
      g.setIndex(idx);
      const shadows = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog) }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aCol; varying vec2 vUv; varying vec4 vCol;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vCol = aCol; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          precision highp float;
          varying vec2 vUv; varying vec4 vCol;
          #include <fog_pars_fragment>
          void main(){
            float vy = clamp(vUv.y, -1., 1.), a = 1. - vy * vy; a *= a;   // clamped: multisampling extrapolates vUv.y past its range on quads seen edge-on
            if (vUv.x > 1.5) a = smoothstep(1., 0.25, length(vec2((vUv.x - 2.5) * 2., vUv.y)));
            else a *= smoothstep(0., 0.08, vUv.x) * pow(max(1. - vUv.x, 0.), 1.25);
            float fogF = 0.;
            #ifdef FOG_EXP2
            fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #endif
            gl_FragColor = vec4(vCol.rgb, a * vCol.a * (1. - fogF));
          }`,
      }));
      shadows.name = 'double-shadows'; shadows.renderOrder = 1.3; shadows.frustumCulled = false;
      scene.add(shadows);
    }

    await ctx.yield();
    // ----- kite gliders riding the breeze in loose groups -----
    {
      const rg = rng.fork('gliders'), geo = gliderGeometry();
      const ig = new THREE.InstancedBufferGeometry();
      ig.index = geo.index; ig.setAttribute('position', geo.attributes.position); ig.setAttribute('aW', geo.attributes.aW);
      const extra = [];                                          // [cx, cy, cz, radius, size]: escorts that fly close to the route
      for (let k = 0; k < 6; k++) {                              // the final run: loops either side of the axis, across the planet's reflection
        const r = rg.range(15, 21), sd = k % 2 ? 1 : -1;
        extra.push([sd * (r + rg.range(16, 24)), rg.range(9, 14) - k * 0.5, [250, 205, 160, 120, 85, 52][k] + rg.range(-8, 8), r, rg.range(1.5, 2.0)]);
      }
      for (let k = 0; k < 4; k++) {                              // the opening third
        const u0 = [0.05, 0.1, 0.16, 0.24][k], pc = path.pointAt(u0), tg = path.tangentAt(u0), r = rg.range(15, 21), d = (k % 2 ? 1 : -1) * (r + rg.range(16, 24));
        extra.push([pc.x - tg.z * d, pc.y + rg.range(5, 9), pc.z + tg.x * d, r, rg.range(1.7, 2.2)]);
      }
      // no loop may come within minD of the flight line: push its centre away from the path until it is clear
      const clearLoop = (c, minD) => {
        for (let it = 0; it < 8; it++) {
          let m = 1e9, mu = 0, mx = 0, mz = 0;
          for (let j = 0; j < 16; j++) {
            const a = (j / 16) * Math.PI * 2, x = c[0] + Math.cos(a) * c[3], z = c[2] + Math.sin(a) * c[3] * 0.72, n = path.nearestXZ(x, z);
            if (n.dist < m) { m = n.dist; mu = n.u; mx = x; mz = z; }
          }
          if (m >= minD) break;
          const pp = path.pointAt(mu); let dx = mx - pp.x, dz = mz - pp.z; const l = Math.hypot(dx, dz);
          if (l < 0.5) { dx = c[0] - pp.x; dz = c[2] - pp.z; }
          const l2 = Math.hypot(dx, dz) || 1;
          c[0] += (dx / l2) * (minD - m + 2); c[2] += (dz / l2) * (minD - m + 2);
        }
        return c;
      };
      for (const e of extra) clearLoop(e, 30);
      await ctx.yield();
      const nAll = nGliders + extra.length;
      const aI = new Float32Array(nAll * 4), aJ = new Float32Array(nAll * 4);
      const groups = [0.09, 0.26, 0.5, 0.63, 0.78, 0.86, 0.93, 0.82];
      for (let i = 0; i < nGliders; i++) {
        const u0 = clamp(groups[i % groups.length] + rg.range(-0.035, 0.035), 0.03, 0.97), pc = path.pointAt(u0), tg = path.tangentAt(u0);
        const r = rg.range(14, 36), d = rg.sign() * (r + rg.range(16, 60));
        const cy = clamp(pc.y + rg.range(3, 24), 10, 44), sp = rg.range(5, 9) * rg.sign();
        aI.set(clearLoop([pc.x - tg.z * d, cy, pc.z + tg.x * d, r], 28), i * 4);
        aJ.set([rg.range(0, 6.28), sp / r, rg.range(1.1, 1.7), rg()], i * 4);
        if ((i & 7) === 7) await ctx.yield();
      }
      extra.forEach((e, k) => { const i = nGliders + k; aI.set([e[0], e[1], e[2], e[3]], i * 4); aJ.set([rg.range(0, 6.28), (rg.range(6, 9) * rg.sign()) / e[3], e[4], rg()], i * 4); });
      // more escorts by one rule along the whole flight, from a generator of their own (rk) made here, after the last draw of the
      // gliders' stream: one loop every ESC_STEP metres of path from a seeded start. Where the herd wades beside the path the
      // loop flies on the side away from the herd, elsewhere on a seeded side. One range each for all of them: loop radius 14 to
      // 18 m, centre 15 to 21 m more than the radius off the path and 8 to 18 m above it, size 1.8 to 2.2; like every escort's,
      // no loop comes within 30 m of the line of flight.
      const rk = ctx.core.makeRng((Math.imul(ctx.seed | 0, 0x9e3779b1) ^ 0x6b17) >>> 0), ESC_STEP = 200, more = [];
      for (let s = rk.range(0, ESC_STEP); s < path.length; s += ESC_STEP) {
        const pc = path.posAtDist(s), tg = path.tangentAtDist(s), r = rk.range(14, 18), free = rk.sign(), d = (-herdSide(pc, tg) || free) * (r + rk.range(15, 21));
        const e = clearLoop([pc.x - tg.z * d, pc.y + rk.range(8, 18), pc.z + tg.x * d, r], 30);
        more.push([e[0], e[1], e[2], e[3], rk.range(0, 6.28), (rk.range(6, 9) * rk.sign()) / r, rk.range(1.8, 2.2), rk()]);
      }
      const nKites = nAll + more.length, kI = new Float32Array(nKites * 4), kJ = new Float32Array(nKites * 4);
      kI.set(aI); kJ.set(aJ);
      more.forEach((e, k) => { kI.set(e.slice(0, 4), (nAll + k) * 4); kJ.set(e.slice(4), (nAll + k) * 4); });
      ig.setAttribute('aI', new THREE.InstancedBufferAttribute(kI, 4));
      ig.setAttribute('aJ', new THREE.InstancedBufferAttribute(kJ, 4));
      ig.instanceCount = nKites;
      const opt = { transparent: true, depthWrite: false };
      const gl = new THREE.Mesh(ig, mkMat(GLIDER_VERT, GLIDER_FRAG, 0, opt)), glM = new THREE.Mesh(ig, mkMat(GLIDER_VERT, GLIDER_FRAG, 1, opt));
      gl.frustumCulled = false; glM.frustumCulled = false; gl.renderOrder = 2; glM.renderOrder = 0.5; glM.scale.y = -1;
      scene.add(gl); under.add(glM);
      geo.dispose();
    }

    await ctx.yield();
    // ----- atmosphere: seam mist, drifting puffs, motes, shooting stars -----
    const fxTime = { value: 0 }, set = fx.fxGroup();
    set.object.name = 'atmosphere';
    scene.add(set.object);
    const mistC = fogC.clone().multiplyScalar(1.35).lerp(C.teal.clone().multiplyScalar(0.6), 0.45);
    set.add(fx.makeGroundFog({ time: fxTime, layers: 2, size: 1100, y: 0.6, height: 9, color: mistC.clone().multiplyScalar(0.75).lerp(C.teal, 0.3), opacity: 0.3 * mistAmt, coverage: 0.5, scale: 0.004, wind: [2.6 * side, 0.9],
      near: [90, 260], sunDir: A.sunDir, sunColor: '#bcd8ff', scatter: 0.4 }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: rng.fork('mist'), time: fxTime, count: 30, area: [640, 3, 640], center: [0, 2.2, 0], size: [22, 52], color: mistC, opacity: 0.2 * mistAmt, drift: [2.2 * side, 0, 0.8], follow: true }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time: fxTime, count: 1500, box: [64, 26, 64], size: [0.035, 0.1],
      colors: [hex(C.ice), hex(C.teal.clone().lerp(C.ice, 0.5)), hex(C.pink)], intensity: 1.5, velocity: [0.5 * side, 0.08, 0.2] }));
    await ctx.yield();
    set.add(fx.makeShootingStars({ rng: rng.fork('stars'), time: fxTime, count: rng.int(8, 16), period: [5, 13], minElevation: 0.3, radius: 1500, color: hex(C.ice), tailColor: hex(C.teal), intensity: 4 }));
    await ctx.yield();

    const camP = SU.uCam.value;
    // the gaze on the second half: level, at the arch, so the planet and its reflection sit whole in the frame, top and bottom
    const yTab = new Float32Array(65), zTab = new Float32Array(65);
    for (let i = 0; i <= 64; i++) { const q = path.pointAt(i / 64); yTab[i] = q.y; zTab[i] = q.z; }
    const archV = new THREE.Vector3();
    const archAt = (time, u) => {       // a point on the axis 300 m ahead, at the camera's own height
      const f = clamp(u, 0, 1) * 64, i = Math.min(63, Math.floor(f)), k = f - i;
      return archV.set(0, yTab[i] + (yTab[i + 1] - yTab[i]) * k + 1, zTab[i] + (zTab[i + 1] - zTab[i]) * k - 300);
    };
    // the middle of the flight belongs to the herd. At the meeting (MEET: the third animal is over the path; it is baseAt's own
    // 0.42, written once more here) the third falls behind and the gaze goes with the file: it turns to where the file is bound,
    // the far end of the Striders' route out on the flat (some 60 degrees off the flight seen from the meeting and more as the
    // flight goes on, on the herd's side, whichever that is), at the height of a Strider's body. The animals that walk ahead of
    // the third lie 30 to 50 degrees to one side of that line at the meeting and each crosses it once as the flight overtakes
    // them, so they pass through the frame large while the planet slides to its edge.
    // The way back is the arch's own look, which stands after the herd's in the list and so takes the gaze from it: it begins at
    // PASSED, a catch-up reckoned along one line (the head start of the next animal of the file, rel[THIRD + 1] metres, made up
    // at the flight's speed less the walking speed; the routes are not one line, and the flight is in fact abeam of that animal
    // a second or two sooner), and rises over ARCH_EASE of the flight, the span the arch's look has always taken to let go
    // before the portal (0.3 of its old run from 0.46 to 0.92). The herd's look ends where the arch's stands whole, at
    // PASSED + ARCH_EASE, and lets go under it on the way; from there on the gaze is the arch's alone, as it always was.
    const MEET = 0.42, ARCH_EASE = 0.3 * (0.92 - 0.46), PASSED = MEET + rel[THIRD + 1] / (path.length - WALK * duration);
    routeAt(routeLen);
    const boundV = new THREE.Vector3(_p.x, 20.5, _p.z);
    return {
      scene, path, duration,
      camera: { fov: 75, near: 0.3, far: 4000, lookAhead: 30, sway: 1, bank: 0.8 },
      pois: [
        { at: [0, 14, 0], from: 0.0, to: 0.3, weight: 0.4 },
        { at: thirdAt, from: 0.3, to: 0.445, weight: 0.35, fade: 0.3 },
        { at: boundV, from: MEET, to: PASSED + ARCH_EASE, weight: 0.85, fade: 0.3 },
        { at: archAt, from: PASSED, to: 0.92, weight: 0.8, fade: ARCH_EASE / (0.92 - PASSED) },
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: '#6fead6', glow: 0.7, revealDistance: 320 },
      post: {
        exposure: 1.0, bloom: { strength: 0.5, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#fff4fb', shadowTint: '#0a0622', vignette: 0.36, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        camP.setFromMatrixPosition(camera.matrixWorld);
        SU.uTime.value = time; fxTime.value = time;
        // the herd keeps time with the flight (the third animal is over the path at u 0.42), and walks on while the flight is not moving
        const dtT = lastTime === null ? 0 : clamp(time - lastTime, 0, 2), du = u - lastU;
        lastTime = time; lastU = u;
        if (Math.abs(du) > 0.02) drift = 0;
        else if (du < 1e-6) drift += WALK * dtT;
        else drift -= Math.sign(drift) * Math.min(Math.abs(drift), 0.4 * WALK * dtT);
        placeStriders(u);
        hero.setProgress(u);
        hero.update(dt, time, camera);
        updateTendrils(camP, u);
        wind.update(time);
        set.update(dt, time, camera);
      },
      dispose() { hero.dispose(); tMesh.forEach((m, i) => { if (!m) tGeo[i].dispose(); }); },
    };
  },
};
