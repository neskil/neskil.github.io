// THE RED WEED, what is in the air and on the water: the far wood burning (flames that catch as the engine walks),
// the black smoke lying in its hollow like ink (a heavy bank with a level top and tongues), the green falling star, the swans and moorhens in the leads, and
// the crows that sit on the dead engine until we come.
//
//   makeFarFire(U, o)     o: { flames: [[x, y, z, size, catches (-1 = alight from the start), seed]], flare } -> { object, uniforms (uU), triangles }
//                         uU is any measure that only grows (the world gives the metres its engine has walked); a flame
//                         takes fire when uU passes its `catches` and is full `flare` later
//   makeInk(U, o)         o: { centre: [x, z], size: [a, b], top, floor(x, z), reach: [x, z] } -> { object, uniforms, triangles }
//   makeFallingStar(U, o) o: { from, to (Vector3, far points), flash } -> { object, uniforms (uT 0..1 along, uFlash), triangles }
//   makeWaterfowl(U, wake, o)  wake: the sheet's uWake uniform (8 x vec4: x, z, heading x, heading z); birds 0..1 swans, 2..7 moorhens
//   makePerched(U, o)     o: { perches: [[x, y, z, heading]], size, color } -> { object, uniforms (uLift 0..1), triangles }
import * as THREE from 'three';
import { RW_GLSL, withShared, Acc, C } from './the-red-weed-common.js';

// ---------------------------------------------------------------- far fire
const FIRE_VS = /* glsl */`
uniform float uTime, uU, uFlare;
attribute vec4 aP;            // base xyz, size
attribute vec4 aQ;            // corner x -1..1, corner y 0..1, when it catches (in uU's measure), seed (+2 = a ground glow)
varying vec2 vUv; varying float vOn, vSeed, vGlow;
void main(){
  float seed = fract(aQ.w), glow = step(1.5, aQ.w);
  vec3 toCam = cameraPosition - aP.xyz; vec2 rt = normalize(vec2(toCam.z, -toCam.x) + vec2(1e-5, 0.0));
  float flick = 1.0 + 0.12*sin(uTime*7.0 + seed*50.0) + 0.08*sin(uTime*13.0 + seed*90.0);
  float on = aQ.z < 0.0 ? 1.0 : smoothstep(aQ.z, aQ.z + max(uFlare, 1e-3), uU);
  float w = aP.w*mix(0.5, 2.6, glow), h = aP.w*mix(1.55*flick, 0.9, glow)*(0.35 + 0.65*on);
  vec3 p = aP.xyz + vec3(rt.x, 0.0, rt.y)*aQ.x*w + vec3(0.0, 1.0, 0.0)*(aQ.y*h - glow*h*0.3);
  vUv = vec2(aQ.x, aQ.y); vOn = on; vSeed = seed; vGlow = glow;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const FIRE_FS = /* glsl */`
${RW_GLSL}
uniform float uU, uGain;
varying vec2 vUv; varying float vOn, vSeed, vGlow;
void main(){
  float x = vUv.x, y = clamp(vUv.y, 0.0, 1.0), t = uTime*1.25 + vSeed*20.0;
  vec3 col;
  if (vGlow > 0.5) {
    float r = length(vec2(x, (y - 0.3)*1.6));
    col = vec3(1.0, 0.3, 0.06)*(1.0 - smoothstep(0.0, 1.0, r))*(1.0 - smoothstep(0.0, 1.0, r))*0.16*(0.85 + 0.15*sin(uTime*3.0 + vSeed*30.0));
  } else {
    float n1 = rwN(vec2(x*2.0 + vSeed*7.0, y*2.6 - t)), n2 = rwN(vec2(x*4.6 - vSeed*3.0, y*6.5 - t*1.9));
    float prof = 1.0 - abs(x + (n1 - 0.5)*0.9*y)/max(0.95*(1.0 - 0.88*y), 0.06);
    float m = clamp(prof, 0.0, 1.0)*(1.0 - y)*(0.5 + 1.1*n2) + 0.3*(1.0 - y)*(1.0 - y)*clamp(prof, 0.0, 1.0);
    float f = smoothstep(0.1, 0.5, m);
    col = mix(vec3(0.8, 0.09, 0.01), vec3(1.0, 0.36, 0.05), smoothstep(0.22, 0.7, m));
    col = mix(col, vec3(1.0, 0.5, 0.11), smoothstep(0.8, 1.25, m))*f*0.62;
  }
  gl_FragColor = vec4(col*vOn*uGain, 1.0);
}`;
export function makeFarFire(U, o) {
  const n = o.flames.length, P = new Float32Array(n * 4 * 3), A = new Float32Array(n * 16), Q = new Float32Array(n * 16), I = [];
  for (let k = 0; k < n; k++) {
    const f = o.flames[k], cs = [[-1, 0], [1, 0], [1, 1], [-1, 1]];
    for (let c = 0; c < 4; c++) { const q = k * 4 + c; P[q * 3] = f[0]; P[q * 3 + 1] = f[1]; P[q * 3 + 2] = f[2]; A.set([f[0], f[1], f[2], f[3]], q * 4); Q.set([cs[c][0], cs[c][1], f[4], f[5]], q * 4); }
    I.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.BufferAttribute(A, 4)); g.setAttribute('aQ', new THREE.BufferAttribute(Q, 4)); g.setIndex(I);
  g.computeBoundingSphere(); g.boundingSphere.radius += 200;
  const uniforms = withShared(U, { uU: { value: 0 }, uGain: { value: o.gain ?? 1 }, uFlare: { value: o.flare ?? 1 } });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: FIRE_VS, fragmentShader: FIRE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.renderOrder = 3;
  return { object: mesh, uniforms, triangles: n * 2 };
}

// ---------------------------------------------------------------- the black smoke
// "A gaseous hill that sank and spread itself": a heavy bank that fills its hollow to a level, laps up against the
// rising ground and puts tongues out over the water, with the heaps it sank from still standing on it, coiling.
// One closed skin over the ground (rings from its middle to its lip), ink black; the evening gives its upper
// curves a dull sheen, the side toward the afterglow a rim, the side toward the burning wood a trace of its red.
const INK_VS = /* glsl */`
${RW_GLSL}
attribute vec2 aL;            // 0 middle .. 1 lip; how thick the smoke is here (m)
varying vec3 vW, vN; varying vec2 vL;
void main(){
  vec3 p = position;
  float heave = rwN(p.xz*0.04 + vec2(uTime*0.02, 0.0)) + 0.5*rwN(p.xz*0.11 - vec2(0.0, uTime*0.03));
  p += normal*(heave - 0.75)*(1.3 + 0.1*min(aL.y, 34.0))*smoothstep(0.0, 3.0, aL.y);
  vW = p; vN = normal; vL = aL;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const INK_FS = /* glsl */`
${RW_GLSL}
uniform vec3 uInk;
varying vec3 vW, vN; varying vec2 vL;
float inkB(vec3 q){ return 0.6*rwN(q.xz*0.075 + vec2(uTime*0.015, q.y*0.05)) + 0.4*rwN(q.xz*0.21 + vec2(q.y*0.17, -uTime*0.02)); }
void main(){
  vec3 vv = cameraPosition - vW; float dist = length(vv); vec3 v = vv/max(dist, 1e-3);
  // the coils: the skin's normal is turned by the slope of a slow field, more where the smoke is deep
  float bil = inkB(vW), e = 1.6;
  vec3 gr = vec3(inkB(vW + vec3(e, 0.0, 0.0)) - bil, 0.0, inkB(vW + vec3(0.0, 0.0, e)) - bil)/e;
  float deep = smoothstep(1.0, 12.0, clamp(vL.y, 0.0, 40.0));
  vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0) - gr*(3.0 + 9.0*deep));
  float ndv = clamp(dot(normalize(vN + vec3(0.0, 1e-4, 0.0)), v), 0.0, 1.0), fr = 1.0 - ndv;
  vec3 rf = reflect(-v, n); rf.y = abs(rf.y) + 0.02; rf = normalize(rf);
  // ink: nearly black; upper curves carry a dull sheen of the evening, the hollows between the coils none
  float up = smoothstep(0.15, 0.95, n.y), hollow = smoothstep(0.25, 0.75, bil);
  vec3 col = uInk*(0.55 + 0.6*bil) + rwSky(rf)*(0.02 + 0.16*fr*fr*fr)*up + rwAmb(n)*(0.012 + 0.05*up*hollow);
  vec3 gd = normalize(vec3(uGlow.x, 0.25, uGlow.z));
  float rim = clamp(dot(n, gd), 0.0, 1.0); col += (uSkyRose*0.6 + uSkyAmber*0.4)*uGlow.w*rim*rim*0.07*(0.4 + 0.6*hollow);
  // its coils are told apart: a finer roll over the slow one, grey-violet on the crowns, and the afterglow lies
  // along every crown's sky side (it is smoke, not a hill)
  float roll = rwN(vW.xz*0.55 + vec2(vW.y*0.4, uTime*0.03)), crown = smoothstep(0.45, 0.8, 0.6*bil + 0.4*roll);
  float sky2 = clamp(0.5 + 0.5*dot(n, gd), 0.0, 1.0);
  col += (0.5*uSkyRose + 0.25*uSkyAmber + 0.25*uMistCol)*uGlow.w*(0.05*crown*sky2 + 0.11*fr*fr*sky2*sky2);
  col += (0.6*uMistCol + 0.4*uSkyRose)*0.045*crown*(0.3 + 0.7*up);
  col *= 0.62 + 0.38*smoothstep(0.2, 0.6, roll);
  vec3 fd = normalize(uFire.xyz - vW); col += uFireCol*uFire.w*clamp(dot(n, fd), 0.0, 1.0)*0.035;
  // its thin lip is grey and torn, not a cut-out; its outline against the sky is soft
  float thick = clamp(vL.y, 0.0, 40.0), lipK = smoothstep(0.0, 2.2, thick + (bil - 0.5)*1.6);
  col = mix(uInk*1.6 + 0.03*uMistCol, col, lipK);
  float a = lipK*smoothstep(0.02, 0.26, ndv)*0.97;
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), a);
}`;
// o.heaps: [[x, z, height, radius], ...] in metres from the centre (already mirrored by the world)
export function makeInk(U, o) {
  const [cx, cz] = o.centre, [ha, hb] = o.size, top = o.top ?? 14, floor = o.floor || (() => 0), RINGS = 26, SEG = 96, P = [], L = [], I = [], heaps = o.heaps || [];
  const ra = o.reach ? Math.atan2(o.reach[1], o.reach[0]) : 0;
  // its outline on the ground: lobed, with one tongue down the wind (o.reach, the wind the flakes go on); the tongue
  // adds three tenths of the bank's own half length that way, the same for any bank (the outline is not seeded)
  const outline = (th) => 0.74 + 0.11 * Math.sin(3 * th + 1.3) + 0.07 * Math.sin(5 * th + 4.1) + 0.05 * Math.sin(9 * th + 0.7) + (o.reach ? 0.3 * Math.pow(Math.max(0, Math.cos(th - ra)), 6) : 0);
  for (let i = 0; i <= RINGS; i++) for (let k = 0; k <= SEG; k++) {
    const rho = Math.pow(i / RINGS, 0.8), th = (k / SEG) * Math.PI * 2, e = outline(th), x = cx + Math.cos(th) * ha * rho * e, z = cz + Math.sin(th) * hb * rho * e;
    const g = floor(x, z), level = Math.max(top - g, 0); let heap = 0;
    for (const h of heaps) heap += h[2] * Math.exp(-(Math.pow(x - cx - h[0], 2) + Math.pow(z - cz - h[1], 2)) / (h[3] * h[3]));
    const thick = level * Math.sqrt(Math.max(0, 1 - Math.pow(rho, 4))) + heap * Math.min(1, level / 4) * Math.max(0, 1 - Math.pow(rho, 3));
    P.push(x, g + thick - (thick < 0.05 ? 0.4 : 0), z); L.push(rho, thick);
  }
  for (let i = 0; i < RINGS; i++) for (let k = 0; k < SEG; k++) { const a = i * (SEG + 1) + k, b = a + SEG + 1; I.push(a, a + 1, b + 1, a, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 2)); g.setIndex(I);
  g.computeVertexNormals(); g.computeBoundingSphere();
  const uniforms = withShared(U, { uInk: { value: o.ink || new THREE.Color(0.022, 0.022, 0.027) } });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: INK_VS, fragmentShader: INK_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  mesh.renderOrder = 2;
  return { object: mesh, uniforms, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- the green falling star (the keyed one)
const STAR_VS = /* glsl */`
uniform float uT, uPx, uFlash; uniform vec3 uFrom, uTo;
attribute vec3 aS;            // along the tail 0 (head) .. 1, side -1..1, kind (0 streak, 1 head, 2 horizon bloom)
varying vec3 vS; varying float vA;
void main(){
  vec3 dir = uTo - uFrom; float len = length(dir); dir /= max(len, 1.0);
  float tt = clamp(uT, 0.0, 1.0);
  vec3 head = cameraPosition + uFrom + dir*len*tt;
  float tail = min(len*tt, len*0.15);
  vec3 p = head - dir*tail*aS.x*step(aS.z, 0.5);
  vec3 vd = normalize(p - cameraPosition), sd = normalize(cross(dir, vd) + vec3(0.0, 1e-5, 0.0));
  float dist = length(p - cameraPosition), wpx = aS.z < 0.5 ? 1.5*(1.0 - 0.75*aS.x) : (aS.z < 1.5 ? 4.5 : 0.0);
  p += sd*aS.y*wpx*uPx*dist + (aS.z > 0.5 && aS.z < 1.5 ? cross(sd, vd)*(aS.x*2.0 - 1.0)*wpx*uPx*dist : vec3(0.0));
  if (aS.z > 1.5) { p = cameraPosition + uTo + vec3(0.0, 40.0, 0.0) + sd*aS.y*len*0.16 + vec3(0.0, 1.0, 0.0)*(aS.x*2.0 - 1.0)*len*0.045; }
  vS = aS; vA = smoothstep(0.0, 0.06, uT)*(1.0 - smoothstep(0.93, 1.0, uT));
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const STAR_FS = /* glsl */`
uniform float uFlash;
varying vec3 vS; varying float vA;
void main(){
  vec3 col;
  float sx = clamp(vS.x, 0.0, 1.0), sy = clamp(vS.y, -1.0, 1.0);
  if (vS.z < 0.5) { float e = 1.0 - sy*sy; col = mix(vec3(0.5, 1.6, 0.7)*2.2, vec3(0.05, 0.42, 0.14), smoothstep(0.0, 0.45, sx))*e*e*(1.0 - sx)*vA; }
  else if (vS.z < 1.5) { float r = length(vec2(vS.x*2.0 - 1.0, vS.y)); float g = 1.0 - smoothstep(0.0, 1.0, r); col = vec3(0.6, 1.5, 0.8)*g*g*g*3.2*vA; }
  else { float r = length(vec2(vS.x*2.0 - 1.0, vS.y)); float g = 1.0 - smoothstep(0.0, 1.0, r); col = vec3(0.1, 0.75, 0.3)*g*g*0.55*uFlash; }
  gl_FragColor = vec4(col, 1.0);
}`;
export function makeFallingStar(U, o) {
  const S = [], I = [], P = [];
  const quad = (kind, n) => { const b = S.length / 3; for (let k = 0; k <= n; k++) for (const sd of [-1, 1]) { S.push(k / n, sd, kind); P.push(0, 0, 0); } for (let k = 0; k < n; k++) { const q = b + k * 2; I.push(q, q + 1, q + 3, q, q + 3, q + 2); } };
  quad(0, 8); quad(1, 1); quad(2, 1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const uniforms = { uT: { value: -1 }, uPx: U.uPx, uFlash: { value: 0 }, uFrom: { value: o.from.clone() }, uTo: { value: o.to.clone() } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  mesh.frustumCulled = false; mesh.renderOrder = 1;
  return { object: mesh, uniforms, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- swans and moorhens
const FOWL_VS = /* glsl */`
uniform float uTime; uniform vec4 uWake[8];
attribute vec3 color; attribute vec4 aE;      // bird, head weight, -, phase
varying vec3 vW, vN, vCol;
void main(){
  int i = int(aE.x + 0.5); vec4 wk = uWake[i];
  vec3 F = vec3(wk.z, 0.0, wk.w), R = vec3(-wk.w, 0.0, wk.z);
  vec3 lp = position; float ph = aE.w*40.0;
  lp.z -= aE.y*0.035*sin(uTime*4.6 + ph);                       // a moorhen jerks its head as it swims
  lp.y += 0.012*sin(uTime*1.7 + ph) - 0.02;
  vec3 wp = vec3(wk.x, 0.0, wk.y) + R*lp.x + vec3(0.0, lp.y, 0.0) - F*lp.z;
  vW = wp; vN = normalize(R*normal.x + vec3(0.0, normal.y, 0.0) - F*normal.z); vCol = color;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const FOWL_FS = /* glsl */`
${RW_GLSL}
varying vec3 vW, vN, vCol;
void main(){
  vec3 n = normalize(vN);
  vec3 col = vCol*(uKeyCol*clamp(dot(n, uKeyDir)*0.8 + 0.2, 0.0, 1.0) + rwAmb(n)*1.5 + uSkyRose*0.1*clamp(-n.y, 0.0, 1.0));
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
export function makeWaterfowl(U, wake, o = {}) {
  const acc = new Acc(), white = C('#cfcac0'), dark = C('#17161a');
  for (let b = 0; b < 8; b++) {
    const swan = b < 2, ph = (b * 0.37 + (o.phase || 0)) % 1; acc.extra(b, 0, 0, ph);
    if (swan) {
      acc.color(white); acc.ball(0, 0.16, 0.05, [0.26, 0.2, 0.52], 8, 5);
      for (const s of [1, -1]) acc.ball(s * 0.17, 0.3, 0.14, [0.1, 0.13, 0.36], 6, 4);                    // the wings held a little arched
      acc.ball(0, 0.22, 0.6, [0.09, 0.07, 0.16], 5, 3);                                                   // tail
      const neck = [[0, 0.24, -0.4], [0, 0.5, -0.54], [0, 0.74, -0.5], [0, 0.9, -0.52], [0, 0.93, -0.64]];
      for (let k = 0; k < neck.length - 1; k++) acc.tube(neck[k], neck[k + 1], 0.07 - k * 0.006, 0.064 - k * 0.006, 6, 0);
      acc.ball(0, 0.93, -0.66, [0.055, 0.055, 0.085], 6, 4); acc.color(C('#b8632a')); acc.tube([0, 0.92, -0.72], [0, 0.89, -0.85], 0.03, 0.012, 5, 0);
    } else {
      acc.color(dark); acc.ball(0, 0.07, 0.0, [0.085, 0.075, 0.15], 6, 4);
      acc.extra(b, 1, 0, ph); acc.ball(0, 0.17, -0.13, [0.04, 0.04, 0.05], 5, 3); acc.color(C('#a8301c')); acc.tube([0, 0.17, -0.17], [0, 0.155, -0.215], 0.016, 0.006, 4, 0);
      acc.extra(b, 0, 0, ph); acc.color(C('#bdb8ae')); acc.ball(0, 0.12, 0.15, [0.03, 0.03, 0.03], 4, 3);   // the white under the tail
    }
  }
  const g = acc.geometry('aE', true); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const uniforms = withShared(U, { uWake: wake });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: FOWL_VS, fragmentShader: FOWL_FS }));
  mesh.frustumCulled = false;
  return { object: mesh, uniforms, triangles: acc.triangles };
}

// ---------------------------------------------------------------- the birds that sit on the dead engine
const PERCH_VS = /* glsl */`
uniform float uTime, uLift; uniform vec4 uPerch[8];
attribute vec4 aE;            // bird, wing side (-1, 0 body, 1), span along the wing 0..1, phase
varying vec3 vW, vN;
void main(){
  int i = int(aE.x + 0.5); vec4 pc = uPerch[i]; float ph = aE.w;
  float tau = clamp(uLift*1.7 - ph*0.7, 0.0, 1.0), fly = smoothstep(0.0, 0.1, tau);
  // sitting it faces along its heading; once up it wheels away outward and climbs
  float hd = pc.w + tau*(1.2 + 2.5*ph);
  vec3 F = vec3(sin(hd), 0.0, -cos(hd)), R = vec3(cos(hd), 0.0, sin(hd));
  vec3 lp = position;
  float flap = sin(uTime*(8.0 + 3.0*ph) + ph*30.0)*0.95 - 0.2;
  float ang = aE.y*mix(-1.25, flap, fly);                                 // folded down along the body, or beating
  float span = lp.x*mix(0.3, 1.0, fly);
  if (abs(aE.y) > 0.5) { lp.x = span*cos(ang); lp.y += abs(span)*sin(abs(ang))*sign(ang*aE.y); }
  lp.y += 0.03*sin(uTime*1.3 + ph*20.0)*(1.0 - fly);                     // a sitting bird shifts
  vec3 off = F*(tau*(9.0 + 12.0*ph)) + vec3(0.0, tau*(2.5 + 7.0*tau) + 0.6*fly*sin(uTime*2.0 + ph*9.0), 0.0) + R*(tau*tau*6.0*(ph - 0.5));
  vec3 wp = pc.xyz + off + R*lp.x + vec3(0.0, lp.y, 0.0) - F*lp.z;
  vW = wp; vN = normalize(R*normal.x + vec3(0.0, normal.y, 0.0) - F*normal.z);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const PERCH_FS = /* glsl */`
${RW_GLSL}
uniform vec3 uCol;
varying vec3 vW, vN;
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 col = uCol*(uKeyCol*clamp(dot(n, uKeyDir)*0.8 + 0.2, 0.0, 1.0) + rwAmb(n)*1.3);
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
export function makePerched(U, o) {
  const acc = new Acc(), n = Math.min(8, o.perches.length), sz = o.size ?? 1;
  for (let b = 0; b < n; b++) {
    const ph = (b * 0.618 + 0.13 + (o.phase || 0)) % 1;
    acc.extra(b, 0, 0, ph); acc.ball(0, 0.16 * sz, 0, [0.085 * sz, 0.1 * sz, 0.2 * sz], 6, 4); acc.ball(0, 0.27 * sz, -0.19 * sz, [0.055 * sz, 0.055 * sz, 0.07 * sz], 5, 3);
    acc.tube([0, 0.27 * sz, -0.24 * sz], [0, 0.25 * sz, -0.35 * sz], 0.022 * sz, 0.006 * sz, 4, 0);
    acc.quad([-0.05 * sz, 0.15 * sz, 0.16 * sz], [0.05 * sz, 0.15 * sz, 0.16 * sz], [0.08 * sz, 0.12 * sz, 0.4 * sz], [-0.08 * sz, 0.12 * sz, 0.4 * sz]);
    for (const s of [1, -1]) {
      const e = (t) => [b, s, t, ph], y = 0.2 * sz;
      const i0 = acc.v(s * 0.06 * sz, y, -0.1 * sz, 0, 1, 0, e(0)), i1 = acc.v(s * 0.06 * sz, y, 0.14 * sz, 0, 1, 0, e(0)), i2 = acc.v(s * 0.3 * sz, y, 0.16 * sz, 0, 1, 0, e(0.5)), i3 = acc.v(s * 0.3 * sz, y, -0.08 * sz, 0, 1, 0, e(0.5)), i4 = acc.v(s * 0.56 * sz, y, 0.1 * sz, 0, 1, 0, e(1)), i5 = acc.v(s * 0.5 * sz, y, -0.02 * sz, 0, 1, 0, e(1));
      acc.quadI(i0, i1, i2, i3); acc.quadI(i3, i2, i4, i5);
    }
  }
  const g = acc.geometry('aE', false); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const perch = []; for (let b = 0; b < 8; b++) { const p = o.perches[Math.min(b, n - 1)]; perch.push(new THREE.Vector4(p[0], p[1], p[2], p[3])); }
  const uniforms = withShared(U, { uLift: { value: 0 }, uPerch: { value: perch }, uCol: { value: C(o.color ?? '#141317') } });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: PERCH_VS, fragmentShader: PERCH_FS, side: THREE.DoubleSide }));
  mesh.frustumCulled = false;
  return { object: mesh, uniforms, triangles: acc.triangles };
}
