// still-waving: the central device.
//  1. makeFiction(): the fiction's road (a hill lane, in metres), the car's distance table S(u) and the matrix
//     that carries the whole outdoors past a camera that never looks ahead.
//  2. buildFigure(): the person at the gate, her arm with an elbow, the cloth, and her far forms (a designed point).
//  3. buildGlass() / buildCar(): the back window fixed to the camera and the car that takes over when the head turns.
import * as THREE from 'three';

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D2R = Math.PI / 180;

export const U_TURN = 0.403;      // the head starts to turn (rail: end of the first leg)
export const U_FREE = 0.561;      // from here the car's motion is the rail's own and the outdoors stands still
const TIP_EASE = 0.28;
export const EYE = 1.25;          // a kneeling child's eye above the lane

// GLSL shared by every outdoor shader: one peach key, a sky/ground fill, true exponential haze.
export const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunW;      // direction TO the afterglow, world space
uniform vec3 uKeyCol; uniform vec3 uSkyCol; uniform vec3 uGndCol; uniform vec3 uFogCol; uniform float uFogK;
vec3 swLight(vec3 alb, vec3 n) {
  float nl = max(dot(n, uSunW), 0.);
  vec3 hemi = mix(uGndCol, uSkyCol, n.y * .5 + .5);
  return alb * (uKeyCol * nl * 1.9 + hemi * .74 + uSkyCol * .25);      // a decided key: what faces the afterglow is peach, the rest slate
}
vec3 swFog(vec3 c, float d) { return mix(uFogCol, c, exp(-uFogK * max(d, 0.))); }
`;

export function makeFiction(opts = {}) {
  const mirror = opts.mirror ? -1 : 1;
  const S0 = -60, S1 = 660, DS = 0.5, N = Math.round((S1 - S0) / DS);
  const gate = { x: 0, z: -8 };
  const A = 40 * D2R;
  const X = new Float32Array(N + 1), Z = new Float32Array(N + 1), Hd = new Float32Array(N + 1), Y = new Float32Array(N + 1), Gr = new Float32Array(N + 1);
  let beta = 26.7 * D2R;
  const lay = (b) => {
    const i0 = Math.round(-S0 / DS);
    for (let i = 0; i <= N; i++) { const s = S0 + i * DS; Hd[i] = -A * ss(150, 210, s) + b * ss(250, 300, s); }
    X[i0] = 0; Z[i0] = 0;
    for (let i = i0 + 1; i <= N; i++) { const h = (Hd[i] + Hd[i - 1]) * .5; X[i] = X[i - 1] + Math.sin(h) * DS; Z[i] = Z[i - 1] + Math.cos(h) * DS; }
    for (let i = i0 - 1; i >= 0; i--) { X[i] = 0; Z[i] = Z[i + 1] - DS; }
    const j = Math.round((300 - S0) / DS), hf = b - A;
    return (gate.x - X[j]) * Math.cos(hf) - (gate.z - Z[j]) * Math.sin(hf);   // 0 when the line from s 300 runs through the gate
  };
  let lo = 8 * D2R, hi = 45 * D2R, flo = lay(lo);
  for (let k = 0; k < 24; k++) { beta = (lo + hi) * .5; const f = lay(beta); if ((f > 0) === (flo > 0)) { lo = beta; flo = f; } else hi = beta; }
  lay(beta);
  const hf = beta - A, sf = Math.sin(hf), cf = Math.cos(hf);
  const aOf = (x, z) => (x - gate.x) * sf + (z - gate.z) * cf;        // metres from the gate along the last line of the road
  const bOf = (x, z) => (x - gate.x) * cf - (z - gate.z) * sf;        // metres to the car's left of that line
  const idx = (s) => Math.round((s - S0) / DS);
  const a210 = aOf(X[idx(210)], Z[idx(210)]), a300 = aOf(X[idx(300)], Z[idx(300)]);
  const ac = a300 + 70, a513 = a300 + 213, a635 = a300 + 335;
  // the hill: a ridge lying square across the last line of the road, F(a)
  const A0 = -300, NA = 1500, F = new Float32Array(NA + 1);
  const up = (a) => ss(a210, a210 + 36, a) - ss(ac - 13, ac + 3, a);      // a straight climb, then a short brow
  const dn = (a) => -0.05 * (ss(ac - 5, ac + 13, a) - ss(ac + 86, ac + 110, a));
  let G = 0.18;
  for (let it = 0; it < 4; it++) {
    let i1 = 0, i2 = 0, best = 0, b1 = 0, b2 = 0;
    for (let i = 1; i <= NA; i++) { const a = A0 + i - .5; i1 += up(a); i2 += dn(a); if (G * i1 + i2 > best) { best = G * i1 + i2; b1 = i1; b2 = i2; } }
    G = (22 - b2) / Math.max(b1, 1);
  }
  F[0] = 0;
  for (let i = 1; i <= NA; i++) { const a = A0 + i - .5; F[i] = F[i - 1] + G * up(a) + dn(a); }
  for (let i = 0; i <= NA; i++) F[i] -= 1.05 * ss(a513 + 6, a635, A0 + i);
  const hillAt = (a) => { const f = Math.min(NA - 1e-3, Math.max(0, a - A0)), i = f | 0, t = f - i; return F[i] * (1 - t) + F[i + 1] * t; };
  for (let i = 0; i <= N; i++) Y[i] = hillAt(aOf(X[i], Z[i]));
  // smoothed grade for the tip of the window (8 m window), so the picture never nods
  for (let i = 0; i <= N; i++) { const i0 = Math.max(0, i - 16), i1 = Math.min(N, i + 16); Gr[i] = (Y[i1] - Y[i0]) / ((i1 - i0) * DS); }
  for (let pass = 0; pass < 2; pass++) { let p = Gr[0]; for (let i = 1; i < N; i++) { const c = Gr[i]; Gr[i] = (p + 2 * c + Gr[i + 1]) / 4; p = c; } }
  const road = (s, out = {}) => {
    const f = Math.min(N - 1e-3, Math.max(0, (s - S0) / DS)), i = f | 0, t = f - i;
    out.x = X[i] + (X[i + 1] - X[i]) * t; out.z = Z[i] + (Z[i + 1] - Z[i]) * t; out.y = Y[i] + (Y[i + 1] - Y[i]) * t;
    out.h = Hd[i] + (Hd[i + 1] - Hd[i]) * t; out.grade = Gr[i] + (Gr[i + 1] - Gr[i]) * t;
    return out;
  };
  // a point beside the road: lat metres to the car's LEFT, up metres above the lane
  const _r = {};
  const place = (s, lat, upY = 0, out = new THREE.Vector3()) => { road(s, _r); return out.set(_r.x + Math.cos(_r.h) * lat, _r.y + upY, _r.z - Math.sin(_r.h) * lat); };

  // S(u): the car's distance. Seconds = u / 0.0115 on the first leg; v = .6, 1.2, 2.2, 6, 20.2 m/s at 0, 3, 8, 13, 22 s.
  const KT = [0, 3, 8, 13, 22, 1e3], KV = [0.6, 1.2, 2.2, 6, 20.2, 20.2];
  const sOfT = (t) => { let s = 0; for (let k = 0; k < 5; k++) { const t0 = KT[k], t1 = Math.min(t, KT[k + 1]); if (t1 <= t0) break; const m = (KV[k + 1] - KV[k]) / (KT[k + 1] - t0); s += (t1 - t0) * (KV[k] + .5 * m * (t1 - t0)); } return s; };
  const sTurn = sOfT(U_TURN / 0.0115), m0 = 20.2 / 0.0115, m1 = 278, du = U_FREE - U_TURN;
  const S = (u) => {
    if (u <= U_TURN) return sOfT(Math.max(0, u) / 0.0115);
    if (u >= U_FREE) return 513 + 278 * (u - U_FREE);
    const t = (u - U_TURN) / du, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * sTurn + (t3 - 2 * t2 + t) * m0 * du + (-2 * t3 + 3 * t2) * 513 + (t3 - t2) * m1 * du;
  };
  const speed = (u) => (S(u + 1e-4) - S(u - 1e-4)) / 2e-4;     // metres per unit u

  // the rail: a dead level hairpin. First leg along -Z (the camera looks back down the lane), the car's heading is +Z.
  const railPoints = [];
  for (let z = 0; z >= -112; z -= 14) railPoints.push([0, 0, z]);
  for (let k = 1; k < 12; k++) { const th = (k / 12) * Math.PI; railPoints.push([(-14 + 14 * Math.cos(th)) * mirror, 0, -112 - 14 * Math.sin(th)]); }
  for (let z = -112; z <= 10.01; z += 12.2) railPoints.push([-28 * mirror, 0, z]);

  // W = T(rail point) Rx(tip) Ry(-heading) T(-eye): from u alone, never from the camera or the last frame
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = {};
  const setW = (W, u, path) => {
    const uu = Math.min(Math.max(u, 0), U_FREE);
    road(S(uu), _q); path.pointAt(uu, _p); _p.x *= mirror;      // compose unmirrored, then mirror the whole thing
    // the window tips with the climb; less on the upper hill, so the far ridge sits a third of the way down the glass
    const g = uu >= U_FREE ? 0 : (0.8 - TIP_EASE * ss(258, 312, S(uu))) * Math.atan(_q.grade);
    W.matrix.makeTranslation(_p.x, _p.y, _p.z);
    W.matrix.multiply(_m.makeRotationX(g)).multiply(_m.makeRotationY(-_q.h)).multiply(_m.makeTranslation(-_q.x, -(_q.y + EYE), -_q.z));
    if (mirror < 0) W.matrix.premultiply(_m.makeScale(-1, 1, 1));
    W.matrixWorldNeedsUpdate = true;
    return _q;
  };
  const pace = (u) => 0.39 + (2.5 - 0.39) * ss(U_TURN, U_FREE, u);
  return { mirror, gate, beta, hf, aOf, bOf, hillAt, road, place, S, speed, setW, pace, railPoints, a210, a300, ac, a513, G };
}

// ---------------------------------------------------------------------------------------------------------
// THE FIGURE. One merged mesh; arms and cloth are posed in the vertex shader from a bone index per vertex.
// aB = (bone, side, d, v): bone 0 body, 1 upper arm, 2 forearm, 3 hand, 4 cloth; side -1/+1 = which arm;
// d = 0..1 from the grip along the cloth, v = 0..1 across it.
const FIG_VERT = /* glsl */`
uniform float uTime; uniform float uHand; uniform float uWave; uniform vec3 uCamW;
attribute vec4 aB; attribute vec3 aLit; attribute vec3 aShd;
varying vec3 vLit; varying vec3 vShd; varying vec3 vN; varying float vDist; varying float vGlow;
const float W = 9.42478;                       // 2 pi x 1.5: three swings every two seconds
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float tired() { float c = fract(uTime / 4.); return c < .8333 ? c / .8333 : 1. - smoothstep(.8333, 1., c); }
// the chain of one arm: angles from hanging, positive = out to its own side and up over the head
void arm(float side, out vec2 S, out vec2 E, out vec2 Wr, out vec3 ang) {
  float up = side < 0. ? 1. - smoothstep(.5, 1., uHand) : smoothstep(0., .5, uHand);
  up *= uWave;
  float bump = 4. * uHand * (1. - uHand), tr = tired(), amp = 1. - .4 * tr, t = W * uTime + 1.2;
  float a1 = mix(.10, 2.45 - .25 * tr + .30 * amp * sin(t) + .42 * bump, up);
  float a2 = a1 + mix(.18, .5 + .35 * amp * sin(t - .6) + .25 * bump, up);
  float a3 = a2 + .32 * amp * sin(t - 1.1) * up;
  S = vec2(side * .185, 1.37);
  E = S + rot(vec2(0., -.30), side * a1);
  Wr = E + rot(vec2(0., -.27), side * a2);
  ang = vec3(a1, a2, a3) * side;
}
void main() {
  vec3 p = position, n = normal;
  float bone = aB.x, glow = 0.;
  if (bone > .5 && bone < 3.5) {
    vec2 S, E, Wr; vec3 ang; arm(aB.y, S, E, Wr, ang);
    vec2 q = p.xy - vec2(aB.y * .185, 1.37);
    if (bone < 1.5) { p.xy = S + rot(q, ang.x); n.xy = rot(n.xy, ang.x); }
    else if (bone < 2.5) { p.xy = E + rot(q + vec2(0., .30), ang.y); n.xy = rot(n.xy, ang.y); }
    else { p.xy = Wr + rot(q + vec2(0., .57), ang.z); n.xy = rot(n.xy, ang.z); }
    p.z += .04 * smoothstep(0., 2., abs(ang.x));
  } else if (bone > 3.5) {
    vec2 S, E, Wr; vec3 angL, angR; vec2 WrL, WrR;
    arm(-1., S, E, WrL, angL); arm(1., S, E, WrR, angR);
    float k = smoothstep(.45, .55, uHand), sgn = mix(-1., 1., k);
    float a3 = mix(angL.z, angR.z, k);
    vec2 grip = mix(WrL + rot(vec2(0., -.09), angL.z), WrR + rot(vec2(0., -.09), angR.z), k);
    float tr = tired(), amp = (1. - .4 * tr) * uWave, t = W * uTime + 1.2, d = aB.z, v = aB.w;
    // A TEA TOWEL held by one corner. Its centre line is whipped from the fist: each part of it points where the hand
    // was a moment before, so it streams to one side, crosses over the head and streams to the other, and the free end
    // snaps late. The line is walked in eight steps; the sheet's width turns about it (the free end curls).
    float L = .80, th = 0.; vec2 c = grip;
    for (int i = 0; i < 8; i++) {
      float sI = (float(i) + .5) / 8. * d;
      th = mix(3.0 * sgn, sgn * .22 + 1.12 * amp * sin(t - 1.45 - 1.7 * sI) + .40 * amp * sI * sin(2. * t - 3.4 * sI + .8), uWave);
      c += vec2(sin(th), cos(th)) * (L * d / 8.);
    }
    th = mix(3.0 * sgn, sgn * .22 + 1.12 * amp * sin(t - 1.45 - 1.7 * d) + .40 * amp * d * sin(2. * t - 3.4 * d + .8), uWave);
    vec2 T = vec2(sin(th), cos(th)), Pp = vec2(T.y, -T.x);
    float tw = (.25 + 1.15 * d) * sin(.5 * t + 1.3 - 2.2 * d) * uWave;                 // the curl, a different one each swing
    float wd = .44 * smoothstep(0., .20, d) * (1. - .12 * d);
    vec3 across = vec3(Pp * cos(tw), sin(tw));
    float rp = 9. * d - 2. * t + 3. * v, rip = .045 * d * sin(rp);                     // a fine ripple, for the light to catch
    p = vec3(c, .07) + across * ((v - .12) * wd) + vec3(0., 0., rip);
    n = normalize(cross(across, vec3(T, .40 * d * cos(rp))) + vec3(0., 0., 1e-4));
    glow = 1. + v;                                                                     // 1..2: the cloth, and where across it
  }
  p.x += .02 * sin(uTime * .9) * smoothstep(0., 1.4, p.y) - .025 * smoothstep(.4, 1.0, p.y) * (1. - smoothstep(1.0, 1.5, p.y));
  vec4 wp = modelMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * n);
  vLit = aLit; vShd = aShd; vGlow = glow; vDist = distance(wp.xyz, uCamW);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FIG_FRAG = /* glsl */`
${LIGHT_GLSL}
uniform float uNear; uniform float uGlow;
varying vec3 vLit; varying vec3 vShd; varying vec3 vN; varying float vDist; varying float vGlow;
void main() {
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) n = -n;
  float nl = dot(n, uSunW) * (vGlow > .5 ? (gl_FrontFacing ? 1. : -1.) : 1.);
  vec3 c = mix(vShd * vec3(.80, .90, 1.08), vLit * vec3(1.22, 1.06, .98), smoothstep(-.04, .04, nl + .12));     // two flat tones: peach side, slate side
  if (vGlow > .5) {                                              // the cloth: its lit folds near white, its shade a cool grey, so it flaps
    float f = smoothstep(-.30, .30, nl + .05);
    c = mix(vShd * vec3(.56, .62, .72), vLit * vec3(1.04, .97, .90) * uGlow, f);
    float hem = vGlow - 1.;                                      // a blue stripe along one hem, and a thin one inside it
    float stripe = smoothstep(.80, .825, hem) * (1. - smoothstep(.90, .925, hem)) + smoothstep(.70, .715, hem) * (1. - smoothstep(.735, .75, hem));
    c = mix(c, vec3(.16, .30, .52) * (.55 + .65 * f), stripe * .85);
  }
  gl_FragColor = vec4(swFog(c, vDist), uNear);
}`;

// uniforms every outdoor material shares (the world owns the values and updates them each frame)
export function makeShared(pal = {}) {
  const lin = (h) => new THREE.Color(h);
  return {
    uTime: { value: 0 }, uCamW: { value: new THREE.Vector3() }, uSunW: { value: new THREE.Vector3(-0.8, 0.21, 0.56) },
    uKeyCol: { value: lin(pal.key || '#F0B59B') }, uSkyCol: { value: lin(pal.fillSky || '#8FA6B8') },
    uGndCol: { value: lin(pal.fillGround || '#3C4A44') }, uFogCol: { value: lin(pal.fog || '#7F96A6') }, uFogK: { value: 0.0012 },
  };
}

// a small accumulator of triangles with the figure's attributes
function makeAcc() {
  const P = [], Nn = [], B = [], L = [], Sd = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  return {
    add(geo, m, bone, side, lit, shd, bf) {
      const g = geo.index ? geo.toNonIndexed() : geo, pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
      nm.getNormalMatrix(m);
      const cl = new THREE.Color(lit), cs = new THREE.Color(shd);
      for (let i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i).applyMatrix4(m); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
        P.push(v.x, v.y, v.z); Nn.push(n.x, n.y, n.z);
        if (bf) { const o = bf(ua.getX(i), ua.getY(i)); B.push(bone, side, o[0], o[1]); } else B.push(bone, side, 0, 0);
        L.push(cl.r, cl.g, cl.b); Sd.push(cs.r, cs.g, cs.b);
      }
      if (g !== geo) g.dispose(); geo.dispose();
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 4)); g.setAttribute('aLit', new THREE.Float32BufferAttribute(L, 3));
      g.setAttribute('aShd', new THREE.Float32BufferAttribute(Sd, 3));
      return g;
    },
  };
}

// opts: { scale, dress: [lit, shade], cloth: true }.  Local frame: feet at the origin, facing +Z (toward the leaving car).
export async function buildFigure(ctx, shared, opts = {}) {
  const acc = makeAcc(), M = new THREE.Matrix4(), T = (x, y, z, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().makeTranslation(x, y, z).multiply(M.makeScale(sx, sy, sz));
  const dress = opts.dress || ['#A8584C', '#5C3A40'], skin = ['#D9A98C', '#8A6A66'], hair = ['#2B2622', '#1E1B1C'], cloth = ['#F4EFE2', '#B9C2CC'];
  // skirt and torso: one lathe, flattened front to back
  const prof = [[0.02, 0.40], [0.31, 0.40], [0.29, 0.52], [0.22, 0.80], [0.150, 0.98], [0.165, 1.10], [0.185, 1.26], [0.19, 1.34], [0.15, 1.41], [0.062, 1.455], [0.05, 1.50]]
    .map((p) => new THREE.Vector2(p[0], p[1]));
  acc.add(new THREE.LatheGeometry(prof, 40), T(0, 0, 0, 1, 1, 0.70), 0, 0, dress[0], dress[1]);
  await ctx.yield();
  acc.add(new THREE.CylinderGeometry(0.05, 0.047, 0.10, 16, 1, true), T(0, 1.50, 0), 0, 0, skin[0], skin[1]);
  acc.add(new THREE.SphereGeometry(0.105, 32, 20), T(0, 1.61, 0.012, 0.90, 1.10, 0.96), 0, 0, skin[0], skin[1]);
  acc.add(new THREE.SphereGeometry(0.112, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), T(0, 1.622, -0.006, 0.93, 1.10, 1.0), 0, 0, hair[0], hair[1]);
  await ctx.yield();
  acc.add(new THREE.SphereGeometry(0.108, 24, 14), T(0, 1.60, -0.03, 0.90, 1.0, 0.86), 0, 0, hair[0], hair[1]);
  acc.add(new THREE.SphereGeometry(0.055, 16, 10), T(0, 1.70, -0.085), 0, 0, hair[0], hair[1]);
  await ctx.yield();
  for (const sx of [-1, 1]) {
    acc.add(new THREE.CylinderGeometry(0.052, 0.040, 0.42, 14, 1, true), T(sx * 0.085, 0.24, 0), 0, 0, skin[0], skin[1]);
    acc.add(new THREE.SphereGeometry(0.06, 14, 8), T(sx * 0.085, 0.04, 0.035, 0.85, 0.62, 1.7), 0, 0, '#3A3230', '#252022');
    // arms hang from the shoulder at (sx 0.185, 1.37); the vertex shader swings them
    const X = sx * 0.185;
    await ctx.yield();
    acc.add(new THREE.SphereGeometry(0.062, 14, 10), T(X, 1.37, 0), 1, sx, dress[0], dress[1]);
    acc.add(new THREE.CylinderGeometry(0.058, 0.043, 0.30, 14, 3, true), T(X, 1.37 - 0.15, 0), 1, sx, dress[0], dress[1]);
    acc.add(new THREE.SphereGeometry(0.043, 12, 8), T(X, 1.37 - 0.30, 0), 2, sx, skin[0], skin[1]);
    acc.add(new THREE.CylinderGeometry(0.041, 0.031, 0.27, 12, 3, true), T(X, 1.37 - 0.435, 0), 2, sx, skin[0], skin[1]);
    acc.add(new THREE.SphereGeometry(0.043, 12, 8), T(X, 1.37 - 0.64, 0, 0.75, 1.55, 0.5), 3, sx, skin[0], skin[1]);
  }
  if (opts.cloth !== false) acc.add(new THREE.PlaneGeometry(1, 1, 16, 22), T(0, 2, 0), 4, 0, cloth[0], cloth[1], (u, v) => [v, u]);
  await ctx.yield();
  const geometry = acc.build();
  const uniforms = { ...shared, uHand: { value: 0 }, uWave: { value: 1 }, uNear: { value: 1 }, uGlow: { value: 1.08 } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: FIG_VERT, fragmentShader: FIG_FRAG, side: THREE.DoubleSide, transparent: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; mesh.renderOrder = 3;
  if (opts.scale) mesh.scale.setScalar(opts.scale);
  return { mesh, uniforms, triangles: geometry.attributes.position.count / 3 };
}

// ---------------------------------------------------------------------------------------------------------
// FAR FORMS: K camera-facing quads whose size never falls under a floor in pixels. Slot 0 the cloth, 1 the
// body, 2 the lit window, 3 the dog, 4 a second body. Everything is a uniform; nothing is made later.
export const FAR_K = 6;
export function buildFarForms(shared) {
  const pos = [], uv = [], kk = [], ix = [];
  for (let k = 0; k < FAR_K; k++) {
    const b = k * 4;
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(0, 0, 0); uv.push(c[0], c[1]); kk.push(k); }
    ix.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 1)); g.setIndex(ix);
  const uniforms = {
    ...shared,
    uP: { value: Array.from({ length: FAR_K }, () => new THREE.Vector3()) },
    uC: { value: Array.from({ length: FAR_K }, () => new THREE.Vector4(0, 0, 0, 0)) },      // rgb radiance, alpha
    uSz: { value: Array.from({ length: FAR_K }, () => new THREE.Vector3(1, 1, 0)) },        // width m, height m, floor px at 450 high
    uView: { value: new THREE.Vector2(800, 450) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,      // built in clip space: a mirrored world (variation B) must not cull it
    vertexShader: /* glsl */`
      uniform vec3 uP[${FAR_K}]; uniform vec4 uC[${FAR_K}]; uniform vec3 uSz[${FAR_K}]; uniform vec2 uView; uniform vec3 uCamW;
      attribute float aK;
      varying vec2 vUv; varying vec4 vC; varying float vBody; varying float vDist;
      void main() {
        int k = int(aK + .5);
        vec4 wp = modelMatrix * vec4(uP[k], 1.);
        vec4 cp = projectionMatrix * viewMatrix * wp;
        vec3 sz = uSz[k];
        float pxPerM = projectionMatrix[1][1] * uView.y * .5 / max(cp.w, .1);
        vec2 px = max(sz.xy * pxPerM, vec2(sz.z * uView.y / 450.));          // true size, but never under the floor
        cp.xy += uv * px / uView * cp.w;
        if (uC[k].a < .003 || cp.w < .2) cp = vec4(2., 2., 2., 1.);
        vUv = uv; vC = uC[k]; vBody = (k == 1 || k == 4) ? 1. : 0.; vDist = distance(wp.xyz, uCamW);
        gl_Position = cp;
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec2 vUv; varying vec4 vC; varying float vBody; varying float vDist;
      void main() {
        float a; vec3 c = vC.rgb;
        if (vBody > .5) {                                   // a two tone figure: lit toward the afterglow, dark hair on top
          float w = mix(.95, .42, smoothstep(-1., .5, vUv.y));
          a = (1. - smoothstep(w - .25, w, abs(vUv.x))) * (1. - smoothstep(.85, 1., abs(vUv.y)));
          c = mix(c * .5, c, smoothstep(.1, -.1, vUv.x));
          c = mix(c, vec3(.03, .025, .025), smoothstep(.62, .72, vUv.y));
        } else {
          float r = length(vUv);
          a = 1. - smoothstep(.45, 1., r);
        }
        float f = exp(-uFogK * vDist);
        a *= vC.a;
        gl_FragColor = vec4(mix(uFogCol, c, mix(1., f, vBody)) * a, a);       // lights keep their hue through the haze
      }`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------------------------------------------------
// THE GLASS: the back window, fixed to the lens, drawn last. It slides out of frame as the head turns.
export function buildGlass(opts = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const uniforms = {
    uRes: { value: new THREE.Vector2(800, 450) }, uRot: { value: new THREE.Matrix3() }, uTan: { value: new THREE.Vector2(0.72, 0.404) }, uOut: { value: 1 }, uAlpha: { value: 0 },
    uBreath: { value: 0 }, uTime: { value: 0 }, uBeads: { value: opts.beads ? 1 : 0 }, uBreathGain: { value: opts.breathGain || 1 },
    uFrame: { value: new THREE.Color(opts.frame || '#5C6C7E') }, uSheen: { value: new THREE.Color('#8FA6B8') },
    uWire: { value: new THREE.Color('#6B4A2E') }, uMist: { value: new THREE.Color(opts.mist || '#AEB9C0') },
    uSeat: { value: new THREE.Color(opts.seat || '#9A7C62') }, uKeyG: { value: new THREE.Color(opts.key || '#F0B59B') }, uSide: { value: opts.side || 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true,
    vertexShader: /* glsl */`void main() { gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec2 uRes; uniform mat3 uRot; uniform vec2 uTan; uniform float uOut; uniform float uAlpha; uniform float uBreath; uniform float uTime;
      uniform float uBeads; uniform float uBreathGain; uniform vec3 uFrame; uniform vec3 uSheen; uniform vec3 uWire; uniform vec3 uMist;
      uniform vec3 uSeat; uniform vec3 uKeyG; uniform float uSide;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
      void main() {
        float asp = uRes.x / max(uRes.y, 1.), px = 2. / max(uRes.y, 1.);
        // the window is a rectangle in the car, one unit behind the lens: find where this pixel's ray meets it
        vec2 ndc = gl_FragCoord.xy / max(uRes, vec2(1.)) * 2. - 1.;
        vec3 ray = uRot * vec3(ndc * uTan, -1.);
        vec2 p = ray.z < -.05 ? ray.xy / (-ray.z) / max(uTan.y, 1e-3) : vec2(99.);
        vec2 b = vec2(asp - .08, .92);                         // inset 4 percent of the short side
        float r = .18;                                         // corner radius 9 percent
        vec2 q = abs(p) - b + r;
        float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r;
        vec3 col = vec3(0.); float a = 0.;
        float inside = 1. - smoothstep(-px, px, d);
        // eleven heater hairs
        float f = p.y / b.y * 6.2, fl = abs(fract(f + .5) - .5) * (b.y / 6.2);
        float hair = (1. - smoothstep(.75 * px, 1.75 * px, fl)) * step(abs(f), 5.4) * smoothstep(0., .1, -d - .04);
        float ah = .10 * hair * inside; col = col * (1. - ah) + uWire * ah; a = a + ah * (1. - a);
        // breath: comes and goes at the bottom centre, never into the middle third
        float cyc = .5 - .5 * cos(6.2832 * uTime / 3.6); cyc = cyc * cyc * (3. - 2. * cyc);
        // an even bloom of fog on the pane: only its size and strength breathe, its outline holds still; it swells from
        // the middle and shrinks back from its edges inward
        float amt = cyc * (.25 + .75 * uBreath), grow = mix(.55, 1., smoothstep(0., .8, amt));
        vec2 e = (p - vec2(0., -b.y + .125)) / (vec2(.235 * asp, .15) * (1. + .12 * uBreath) * grow);
        float edge = length(e) + (vnoise(p * 4. + 3.) - .5) * .16;       // a still, slightly uneven outline
        float core = 1. - smoothstep(.30, 1.0, edge); core = core * core * (3. - 2. * core);
        float ab = core * mix(.02, .30, amt) * uBreathGain * inside;
        ab *= .93 + .14 * vnoise(p * 150.);                              // the fog is fine droplets
        ab = min(ab, .34);
        vec3 mist = uMist * (.97 + .06 * core);
        col = col * (1. - ab) + mist * ab; a = a + ab * (1. - a);
        // rain beads trembling along the edges (variation C)
        if (uBeads > .5) {
          vec2 gc = p * 19., ci = floor(gc), cf = fract(gc) - .5;
          float h = hash(ci), near = smoothstep(-.15, -.03, d) * step(h, .22);
          vec2 o = (vec2(hash(ci + 7.), hash(ci + 13.)) - .5) * .5 + .04 * vec2(sin(uTime * 9. + h * 40.), cos(uTime * 7. + h * 31.));
          float bead = (1. - smoothstep(.13, .21, length(cf - o))) * near * inside;
          float hl = (1. - smoothstep(.03, .08, length(cf - o - vec2(-.05, .06))));
          vec3 bc = mix(uMist * .55, vec3(1.25, 1.05, .9), hl);
          float abd = bead * .55; col = col * (1. - abd) + bc * abd; a = a + abd * (1. - a);
        }
        // rim sheen, two pixels
        float rim = (1. - smoothstep(px, 3. * px, abs(d))) * .25;
        col = col * (1. - rim) + uSheen * rim; a = a + rim * (1. - a);
        // the dark surround; the car's real body takes over as the head turns
        float ao = smoothstep(-px, px, d) * uOut;
        // not a flat border: the car's own rear panel, lit by its window and falling darker toward the corners, a black
        // rubber seal round the glass with a thin light on it, a peach edge on the afterglow side, and along the bottom the
        // pleated top of the seat we kneel on
        float dd = max(d, 0.), sunS = smoothstep(.55, -.55, p.x * uSide / max(asp, .1));
        vec3 pan = uFrame * (.30 + .78 * exp(-dd / .085)) * (.93 + .14 * vnoise(p * 70.));
        pan += (uKeyG * mix(.05, .30, sunS) + uSheen * .06) * exp(-dd / .030);
        float seal = 1. - smoothstep(.016, .016 + 2. * px, dd);
        pan = mix(pan, vec3(.012, .015, .019) + uSheen * .10 * (1. - smoothstep(0., .008, abs(dd - .006))), seal);
        float sy = -(p.y + b.y) - .034 - .05 * (p.x / max(asp, .1)) * (p.x / max(asp, .1));       // below the seat's top line
        float seatK = smoothstep(0., 2. * px, sy);
        float pc = p.x / .105, pl = abs(fract(pc) - .5) * 2.;
        vec3 seat = uSeat * (.50 + .42 * smoothstep(0., .35, 1. - pl)) * (.80 + .45 * exp(-max(sy, 0.) / .03));
        seat += uKeyG * .16 * exp(-max(sy, 0.) / .010) * (.4 + .6 * sunS);                           // the piping takes the light
        pan = mix(pan, seat, seatK);
        col = col * (1. - ao) + pan * ao; a = a + ao * (1. - a);
        gl_FragColor = vec4(col, a) * uAlpha;
      }`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 1000;
  // call every frame with the real camera; rear = the car's rearward axis in world space
  const fw = new THREE.Vector3(), rt = new THREE.Vector3(), upv = new THREE.Vector3(), sz = new THREE.Vector2();
  const update = (camera, renderer, rear, u, time, breath) => {
    const e = camera.matrixWorld.elements;
    rt.set(e[0], e[1], e[2]).normalize(); upv.set(e[4], e[5], e[6]).normalize(); fw.set(-e[8], -e[9], -e[10]).normalize();
    const cf = rear.dot(fw), psi = Math.acos(Math.min(1, Math.max(-1, cf)));
    const p = camera.projectionMatrix.elements, tanH = 1 / Math.max(p[0], 1e-3), tanV = 1 / Math.max(p[5], 1e-3);
    const on = cf > 0.2;
    renderer.getDrawingBufferSize(sz);
    uniforms.uRes.value.copy(sz);
    uniforms.uRot.value.setFromMatrix4(camera.matrixWorld); uniforms.uTan.value.set(tanH, tanV);
    uniforms.uOut.value = 1 - ss(0.15, 0.6, psi);
    uniforms.uAlpha.value = on ? ss(0, 0.012, u) * (1 - ss(1.05, 1.3, psi)) : 0;
    uniforms.uBreath.value = breath; uniforms.uTime.value = time;
    mesh.visible = on && u > 0;
    return psi;
  };
  return { mesh, uniforms, update };
}

// ---------------------------------------------------------------------------------------------------------
// THE CAR: seen only when the head turns. Local frame: the lens at the origin, +Z the car's heading.
// The rear opening subtends the glass's rounded rectangle from the lens (for the aspect at build time).
// Surfaces by kind: 0 painted metal and lining, 1 seat vinyl (pleated, piped), 2 dash and rubber, 3 bright metal, 4 head lining,
// 6 the head rests' stuffed pad (three rolls between two stitched seams), 7 seat-belt webbing.
const CAR_VERT = /* glsl */`
attribute vec3 color; attribute float aKind;
varying vec3 vCol; varying vec3 vN; varying vec3 vLp; varying vec3 vV; varying float vKind;
varying float vMir;      // -1 when the car is laid out mirrored (one deal gives its group a negative x scale), else 1: the same value at every vertex
void main() {
  vCol = color; vKind = aKind; vLp = position; vMir = modelMatrix[0][0] < 0. ? -1. : 1.;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vN = mat3(modelMatrix) * normal; vV = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CAR_FRAG = /* glsl */`
uniform vec3 uSunW; uniform vec3 uKeyCol; uniform vec3 uSkyA; uniform vec3 uSkyB; uniform vec3 uSeatBounce;
uniform float uRing; uniform float uFwd; uniform vec3 uRingCol;      // the exit ring's light (0..1), and 1 once we face forward at dusk
uniform vec4 uGeo;       // WX (half width of the cabin), and the rear opening: half width, half height, corner radius
uniform float uPadY;     // the height of the middle of the head rests' pads, in the car's metres
float sdBox(vec2 p, vec2 c, vec2 h, float r) { vec2 q = abs(p - c) - h + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
varying vec3 vCol; varying vec3 vN; varying vec3 vLp; varying vec3 vV; varying float vKind; varying float vMir;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main() {
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV + vec3(0., 0., 1e-5));
  vec3 alb = vCol; float gloss = .25, spec = .06;
  if (vKind < .5) {                                        // paint: a faint orange peel
    alb *= .96 + .08 * vn(vLp.xy * 60. + vLp.z * 47.);
  } else if (vKind < 1.5) {                                // vinyl: pleats 6 cm wide with a stitched valley, a fine grain
    float pc = (vLp.x + vLp.z) / .062, pl = abs(fract(pc) - .5) * 2.;
    float pleat = smoothstep(.0, .22, 1. - pl);
    alb *= mix(.62, 1., pleat) * (.94 + .12 * vn(vLp.xy * 140. + vLp.z * 90.));
    n = normalize(n + vec3((fract(pc) - .5) * .9 * (1. - pleat) * abs(n.z), 0., (fract(pc) - .5) * .9 * (1. - pleat) * abs(n.x)));
    gloss = .5; spec = .16;
  } else if (vKind < 2.5) {                                // dash: matt grain
    alb *= .9 + .2 * (vn(vLp.xy * 190.) * .5 + vn(vLp.zy * 170. + 3.) * .5);
    gloss = .2; spec = .10;
    float st = (1. - smoothstep(.003, .006, abs(vLp.z - 1.655))) * step(.42, fract(vLp.x * 38.)) * step(.5, n.y);   // a stitched seam along the padded roll
    alb = mix(alb, vec3(.62, .56, .46), st * .8);
  } else if (vKind < 3.5) {                                // bright metal: it shows the windows
    gloss = 1.; spec = .55; alb *= .30;
  } else if (vKind > 5.5 && vKind < 6.5) {                 // a head rest's pad: three stuffed rolls 5 cm tall, a stitched seam between each
    float ry = (vLp.y - uPadY) / .05;                      // the seams lie 2.5 cm above and below the pad's middle
    float dy = abs(ry) - .5, sd = abs(dy) * .05;           // metres from the nearer seam
    float puff = smoothstep(0., .009, sd);                 // each roll swells out of its seam over 9 mm
    alb *= (.66 + .34 * puff) * (.94 + .12 * vn(vLp.xy * 140. + vLp.z * 90.));
    float th = step(.45, fract((vLp.x + vLp.z) / .009)) * (1. - smoothstep(.0010, .0022, abs(sd - .0045)));      // the thread: a stitch every 9 mm, 4.5 mm from the valley
    alb = mix(alb, vCol * 1.35, th * .8);
    n = normalize(n + vec3(0., -sign(dy) * sign(ry) * (1. - puff) * .45, 0.));      // the roll's flank faces its seam
    gloss = .5; spec = .16;
  } else if (vKind > 4.5) {                                // seat-belt webbing: a ribbed weave, almost black
    alb *= .80 + .40 * vn(vec2(vLp.z * 300., vLp.y * 45.)); gloss = .35; spec = .10;
  } else {                                                 // head lining: perforated cloth
    vec2 c = fract(vLp.xz * 55.) - .5; float fw = fwidth(vLp.x) * 55.;
    alb *= 1. - .22 * (1. - smoothstep(.12, .22, length(c))) * (1. - smoothstep(.15, .5, fw));
  }
  // light comes in by the glass: sky from above and the sides, the afterglow from its own side, a warm bounce off the seats
  float up = n.y * .5 + .5;
  vec3 amb = mix(uSeatBounce * .6, uSkyA, smoothstep(.15, .95, up)) * .85 + uSkyB * .25 * (1. - up);
  vec3 side = uSkyA * max(abs(n.x) * .7 + abs(n.z) * .5 - .2, 0.) * .50;
  float nl = max(dot(n, uSunW), 0.);
  vec3 c = alb * (amb + side + uKeyCol * nl * .85);
  if (vKind > 5.5 && vKind < 6.5) {                         // a pad stands between its door's pane and the cabin: the side toward the door
    float door = n.x * vMir * sign(vLp.x);                 // (vMir turns the world normal's x back into the car's own, so the mirrored deal lights the same side) takes the pane's light, the side toward the middle of the car is in shade
    c *= mix(.50, 1., smoothstep(-.7, .2, door));
    c += alb * mix(uSkyA, uKeyCol * 1.25, 1. - smoothstep(-.55, .25, vLp.x)) * (.55 * smoothstep(.15, .9, door));
  }
  vec3 r = reflect(-v, n);
  vec3 env = mix(uSkyB, uSkyA, smoothstep(-.2, .6, r.y)) * (.55 + .45 * smoothstep(.0, .5, abs(r.z) + abs(r.x) * .6));
  env += uKeyCol * 1.4 * smoothstep(.75, .98, dot(r, uSunW));
  float fr = 1. - max(dot(n, v), 0.); fr = fr * fr;
  c += env * spec * (gloss + (1. - gloss) * fr);
  // the light is at the glass: every panel is brightest round its window and falls away toward the floor, and the
  // edge of each opening catches the sky (peach on the afterglow side, the car's right)
  c *= mix(.66, 1.10, smoothstep(-.95, .40, vLp.y));
  float dW = 9.;
  if (abs(abs(vLp.x) - uGeo.x) < .03) dW = min(sdBox(vLp.zy, vec2(-.185, .02), vec2(.565, .28), .08), sdBox(vLp.zy, vec2(1.24, .02), vec2(.74, .28), .08));
  else if (abs(vLp.z + .8) < .02) dW = sdBox(vLp.xy, vec2(0.), uGeo.yz, uGeo.w);
  else if (abs(vLp.z - 2.1) < .02) dW = sdBox(vLp.xy, vec2(0., .02), vec2(uGeo.x - .10, .35), .10);
  dW = max(dW, 0.);
  float sunSide = 1. - smoothstep(-.55, .25, vLp.x);
  vec3 edge = mix(uSkyA, uKeyCol * 1.25, sunSide);
  c += alb * edge * (.34 * exp(-dW / .20));
  if (vKind < .5 || (vKind > 3.5 && vKind < 4.5)) c *= vec3(.40, .43, .47);      // paint and lining sit in the cabin's own shade: the light is outside
  c += edge * (.24 * exp(-dW / .007)) * step(dW, 8.);                              // only the lip of each opening takes the sky
  c *= mix(1., .66, uFwd);
  c += mix(uSkyA, uSkyB, .3) * (.013 + .020 * smoothstep(-.6, .4, vLp.y)) * uFwd;      // shade in the cabin is slate, never black                                                   // dusk in the cabin once we face forward
  if (vKind > 1.5 && vKind < 2.5 && n.y > .55 && vLp.z > 1.4) {             // the dash top: dark, holding the sky as a soft gradient
    float tow = smoothstep(1.64, 2.06, vLp.z);
    c += mix(uSkyB, uSkyA, .45) * (.015 + .15 * tow * tow * tow) * (.70 + .30 * vn(vLp.xz * vec2(2.2, 7.)));
    // the windscreen lies on it as a pale shape: follow the mirrored ray back to the opening
    float tz = (2.1 - vLp.z) / max(r.z, .05);
    vec2 hit = vLp.xy + r.xy * tz;
    float inW = (1. - smoothstep(-.06, .10, sdBox(hit, vec2(0., .02), vec2(uGeo.x - .10, .35), .10))) * step(.05, r.z);
    c += mix(uSkyB, uSkyA, smoothstep(-.2, .37, hit.y)) * inW * (.02 + .20 * fr) * (.35 + .65 * tow);
    c += uKeyCol * .24 * (1. - smoothstep(-uGeo.x, -.05, vLp.x)) * (.30 + .70 * tow);
    c += uKeyCol * .55 * (1. - smoothstep(.0, .05, abs(vLp.x + uGeo.x - .045) - .006)) * (.4 + .6 * tow);     // a peach line along the afterglow edge
    // the ring ahead lays its light down the middle of the dash
    c += uRingCol * uRing * (exp(-vLp.x * vLp.x / .014) * (.08 + .50 * tow * tow) + .04 * tow);
  }
  // and lifts every edge that faces it: pillars, the mirror, the binnacle, the wheel rim, the rim of the screen
  float nearScr = smoothstep(1.2, 1.9, vLp.z);
  c += uRingCol * uRing * nearScr * (.50 * fr * fr * (1. - smoothstep(.3, .7, n.y)) + (.30 * exp(-dW / .025) + .08 * exp(-dW / .15)) * step(dW, 8.));
  gl_FragColor = vec4(c, 1.);
}`;
// a cushion: a sphere pressed toward a box (superellipsoid), smooth normals
function cushion(sx, sy, sz, e = 0.5, seg = 18) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7))), pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    pa.setXYZ(i, Math.sign(x) * Math.pow(Math.abs(x), e) * sx / 2, Math.sign(y) * Math.pow(Math.abs(y), e) * sy / 2, Math.sign(z) * Math.pow(Math.abs(z), e) * sz / 2);
  }
  g.computeVertexNormals();
  return g;
}
export async function buildCar(opts = {}) {
  const pause = opts.yield || (async () => {});
  const aspect = opts.aspect || 16 / 9, tanV = Math.tan((opts.fov || 44) * D2R / 2), D = 0.8;
  const hw = (aspect - 0.08) * tanV * D, hh = 0.92 * tanV * D, rr = 0.18 * tanV * D;
  const P = [], Nn = [], C = [], Kd = [], col = new THREE.Color(), v = new THREE.Vector3(), nv = new THREE.Vector3();
  const push = (geo, m, hex, k = 1, kind = 0) => {
    const g = geo.index ? geo.toNonIndexed() : geo, pa = g.attributes.position, na = g.attributes.normal;
    col.set(hex).multiplyScalar(k);
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(m); P.push(v.x, v.y, v.z); nv.fromBufferAttribute(na, i).transformDirection(m); Nn.push(nv.x, nv.y, nv.z);
      const gk = 0.70 + 0.36 * ss(-1.0, 0.44, v.y) - 0.08 * ss(0.4, 2.1, v.z);        // darker toward the floor: the light is at the glass
      C.push(col.r * gk, col.g * gk, col.b * gk); Kd.push(kind);
    }
    if (g !== geo) g.dispose(); geo.dispose();
  };
  const M = (x, y, z, ry = 0, rx = 0) => new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeRotationX(rx));
  const RZ = (a) => new THREE.Matrix4().makeRotationZ(a);
  const box = (x, y, z, sx, sy, sz, hex, k = 1, kind = 0) => push(new THREE.BoxGeometry(sx, sy, sz), M(x, y, z), hex, k, kind);
  const holed = (w0, w1, y0, y1, holes) => {      // a panel with rounded holes: [x0, x1, y0, y1, r]
    const s = new THREE.Shape(); s.moveTo(w0, y0); s.lineTo(w1, y0); s.lineTo(w1, y1); s.lineTo(w0, y1); s.closePath();
    for (const [hx0, hx1, hy0, hy1, r] of holes) {
      const h = new THREE.Path();
      h.moveTo(hx0 + r, hy0); h.lineTo(hx1 - r, hy0); h.quadraticCurveTo(hx1, hy0, hx1, hy0 + r); h.lineTo(hx1, hy1 - r);
      h.quadraticCurveTo(hx1, hy1, hx1 - r, hy1); h.lineTo(hx0 + r, hy1); h.quadraticCurveTo(hx0, hy1, hx0, hy1 - r); h.lineTo(hx0, hy0 + r);
      h.quadraticCurveTo(hx0, hy0, hx0 + r, hy0);
      s.holes.push(h);
    }
    return new THREE.ShapeGeometry(s, 8);
  };
  // Two tones so the turn reads as a car and not a wall: slate-blue metal and lining (B), warm tan seats and door cards (S).
  const B = '#66788C', S = opts.seat || '#9A7C62', K = '#4C5A6C', CH = '#C9D2D8', WX = Math.max(0.65, hw + 0.10), ZF = 2.1, ROOF = 0.44, BELT = -0.26, DB = BELT - 0.07, SEATX = 0.41, SEATD = 0.15;      // DB: the dash top, lower than the side belt line so the screen is tall
  const WIN = [[-D + 0.05, 0.38, BELT, 0.30, 0.08], [0.50, 1.98, BELT, 0.30, 0.08]];              // rear side window, door window: tall panes, a low belt line
  push(holed(-WX, WX, -1.0, ROOF, [[-hw, hw, -hh, hh, rr]]), M(0, 0, -D, Math.PI), B, 0.62);     // rear panel and its opening
  push(cushion(2 * WX - 0.06, 0.20, 0.56, 0.45, 20), M(0, -hh - 0.11, -D + 0.29), S, 0.95, 1);   // the top of the seat we kneel on
  for (const sx of [-1, 1]) {
    // side wall with two openings: the rear pillar and the door pillar are what is left between them
    push(holed(-D, ZF, -1.0, ROOF, WIN), M(sx * WX, 0, 0, -Math.PI / 2), B, 0.78);
    for (const w of WIN) {                                                                       // a dark rubber seal round each pane
      const zc = (w[0] + w[1]) / 2, yc = (w[2] + w[3]) / 2, wl = w[1] - w[0], wh = w[3] - w[2], x = sx * (WX - 0.008);
      box(x, w[3] + 0.012, zc, 0.016, 0.024, wl + 0.04, K, 0.7, 2); box(x, w[2] - 0.012, zc, 0.016, 0.024, wl + 0.04, K, 0.7, 2);
      box(x, yc, w[0] - 0.012, 0.016, wh, 0.024, K, 0.7, 2); box(x, yc, w[1] + 0.012, 0.016, wh, 0.024, K, 0.7, 2);
    }
    box(sx * (WX - 0.012), BELT - 0.045, (ZF - D) / 2, 0.012, 0.007, ZF + D - 0.3, CH, 1, 3);    // a bright strip along the belt line
    push(new THREE.BoxGeometry(0.02, 0.70, ZF + D - 0.5), M(sx * (WX - 0.014), BELT - 0.07 - 0.37, (ZF - D) / 2), S, 0.72, 1);   // pleated door card
    push(cushion(0.09, 0.07, 0.50, 0.5, 12), M(sx * (WX - 0.05), BELT - 0.27, 1.05), K, 1.1, 2);  // arm rest
    push(new THREE.CylinderGeometry(0.024, 0.024, 0.045, 12), M(sx * (WX - 0.035), BELT - 0.16, 0.74).multiply(RZ(Math.PI / 2)), CH, 1, 3);   // window winder
    box(sx * (WX - 0.058), BELT - 0.19, 0.775, 0.014, 0.016, 0.09, CH, 1, 3);
    push(new THREE.SphereGeometry(0.016, 8, 6), M(sx * (WX - 0.066), BELT - 0.205, 0.815), K, 1, 2);
    push(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), M(sx * (WX - 0.03), BELT - 0.02, -0.1), CH, 1, 3);   // the lock button on the sill
    await pause();
    // front seat: a rounded pleated back, a head rest on two bright posts at the child's eye level, the cushion below
    push(cushion(0.44, 0.86, 0.17, 0.42, 22), M(sx * SEATX, -0.61 - SEATD, 0.93, 0, -0.06), S, 0.86, 1);
    push(cushion(0.46, 0.06, 0.19, 0.5, 14), M(sx * SEATX, -0.19 - SEATD, 0.955), S, 1.12, 2);            // piping along the top
    // the head rest (flight round 2: it was one smooth lump in the dash's matt tone and read as a blob as the head turns
    // past it). The same pad in the same place and size (0.20 by 0.15 by 0.105 m), pressed squarer (exponent 0.34, so it
    // has a back panel, sides and rounded edges), in its own surface (kind 6: three stuffed rolls and two stitched
    // seams), with a piped welt round the edge of its back panel: a 4.5 mm cord on a rounded rectangle 16 mm inside the
    // pad's outline, lying on the back panel where it begins to turn into the sides (0.92 of the pad's half depth).
    push(cushion(0.20, 0.15, 0.105, 0.34, 18), M(sx * SEATX, 0.025 - SEATD, 0.955), S, 0.95, 6);
    {
      const hx = 0.10 - 0.016, hy = 0.075 - 0.016, rc = 0.028, pts = [];
      for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) {
        const a = (k + j / 3) * Math.PI / 2, cx = (k === 0 || k === 3 ? 1 : -1) * (hx - rc), cy = (k < 2 ? 1 : -1) * (hy - rc);
        pts.push(new THREE.Vector3(cx + rc * Math.cos(a), cy + rc * Math.sin(a), 0));
      }
      push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.2), 40, 0.0045, 5, true), M(sx * SEATX, 0.025 - SEATD, 0.955 - 0.92 * 0.105 / 2), S, 1.25, 2);
    }
    for (const px of [-0.055, 0.055]) push(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 8), M(sx * SEATX + px, -0.10 - SEATD, 0.955), CH, 1, 3);
    push(cushion(0.45, 0.16, 0.52, 0.45, 16), M(sx * SEATX, -0.90, 1.22), S, 0.8, 1);
    // a seat belt hanging on the door pillar: a dark webbing strap from its top anchor to the floor, the bright tongue half way
    // The webbing is the slate of the lining, not black, so the pillar is one painted post with a woven band down it and
    // not a black bar; it hangs a little slack (eight short lengths bowed 1.5 cm) from a bright D ring at the top anchor,
    // and its tongue hangs below the sill, against the door card, where a stowed tongue hangs.
    for (let i = 0; i < 8; i++) {
      const y0 = 0.31 - 1.28 * i / 8, y1 = 0.31 - 1.28 * (i + 1) / 8, bow = (y) => 0.44 + 0.015 * Math.sin(Math.PI * (0.31 - y) / 1.28);
      const zc = (bow(y0) + bow(y1)) / 2, tilt = Math.atan2(bow(y1) - bow(y0), y1 - y0);
      push(new THREE.BoxGeometry(0.006, y0 - y1 + 0.004, 0.036), M(sx * (WX - 0.014), (y0 + y1) / 2, zc, 0, tilt), '#55616E', 0.9, 7);
    }
    push(new THREE.TorusGeometry(0.021, 0.0045, 6, 16), M(sx * (WX - 0.016), 0.325, 0.44, Math.PI / 2), CH, 1, 3);      // the D ring
    box(sx * (WX - 0.012), 0.352, 0.44, 0.008, 0.034, 0.03, K, 0.8, 2);                                               // its anchor plate
    box(sx * (WX - 0.024), -0.40, 0.452, 0.006, 0.060, 0.030, CH, 1, 3); box(sx * (WX - 0.028), -0.415, 0.452, 0.004, 0.018, 0.014, K, 0.8, 2);   // the tongue (at y -0.40, 0.14 m below the belt line at -0.26) and its slot, which shows the lining behind it in the anchor plate's tone: never black
    // a bright bead round each pane, between the glass and its rubber: the glass has an edge
    for (const w of WIN) {
      const zc = (w[0] + w[1]) / 2, yc = (w[2] + w[3]) / 2, wl = w[1] - w[0], wh = w[3] - w[2], x = sx * (WX - 0.006), t = 0.006;
      box(x, w[3] - t / 2, zc, 0.003, t, wl - 0.10, CH, 0.6, 3); box(x, w[2] + t / 2, zc, 0.003, t, wl - 0.10, CH, 0.6, 3);
      box(x, yc, w[0] + t / 2, 0.003, wh - 0.10, t, CH, 0.6, 3); box(x, yc, w[1] - t / 2, 0.003, wh - 0.10, t, CH, 0.6, 3);
    }
    await pause();
    // windscreen pillar, wrapped in lining, and a sun visor folded up
    push(cushion(0.36, 0.10, 0.025, 0.4, 12), M(sx * 0.40, 0.385, ZF - 0.20, 0, -0.5), B, 0.92, 4);
  }
  await pause();
  push(new THREE.PlaneGeometry(2 * WX, ZF + D), M(0, ROOF, (ZF - D) / 2, 0, Math.PI / 2), B, 0.90, 4);     // head lining
  box(0, ROOF - 0.012, 0.55, 0.11, 0.02, 0.07, '#E9E2CF', 0.9, 2);                                        // the roof lamp, unlit
  push(new THREE.PlaneGeometry(2 * WX, ZF + D), M(0, -1.0, (ZF - D) / 2, 0, -Math.PI / 2), K, 0.8, 2);     // floor
  push(holed(-WX, WX, -1.0, ROOF, [[-WX + 0.10, WX - 0.10, DB, 0.37, 0.10]]), M(0, 0, ZF), B, 0.66);   // windscreen frame
  box(0, 0.385, ZF - 0.012, 2 * WX - 0.18, 0.02, 0.02, K, 0.7, 2); box(0, DB + 0.006, ZF - 0.012, 2 * WX - 0.18, 0.02, 0.02, K, 0.7, 2);   // its seal
  await pause();
  // the dash: a padded top that holds a little of the sky, a face with a bright strip, a hooded binnacle with two dials
  push(cushion(2 * WX - 0.02, 0.13, 0.44, 0.42, 20), M(0, DB - 0.07, ZF - 0.21), K, 0.60, 2);
  push(cushion(2 * WX - 0.02, 0.085, 0.11, 0.5, 14), M(0, DB - 0.045, ZF - 0.445), K, 0.82, 2);      // the padded roll along its near edge
  box(0, DB - 0.22, ZF - 0.40, 2 * WX, 0.30, 0.04, K, 0.55, 2);
  box(0, DB - 0.145, ZF - 0.425, 2 * WX - 0.1, 0.012, 0.012, CH, 1, 3);
  box(0, DB - 0.27, ZF - 0.425, 2 * WX, 0.05, 0.012, S, 0.9, 1);
  push(cushion(0.40, 0.15, 0.24, 0.5, 14), M(-SEATX, DB + 0.005, ZF - 0.36), K, 0.66, 2);
  for (const dx of [-0.085, 0.085]) {
    push(new THREE.CircleGeometry(0.058, 24), M(-SEATX + dx, DB - 0.03, ZF - 0.485, Math.PI), '#D9DED6', 0.42, 0);
    push(new THREE.TorusGeometry(0.060, 0.006, 6, 24), M(-SEATX + dx, DB - 0.03, ZF - 0.487), CH, 1, 3);
    box(-SEATX + dx + 0.012, DB - 0.018, ZF - 0.490, 0.045, 0.006, 0.004, '#B5412E', 1, 0);     // the needle
  }
  for (const vx of [0.30]) for (let j = 0; j < 5; j++) box(vx + j * 0.022, DB - 0.004, ZF - 0.13, 0.012, 0.004, 0.09, '#1A2028', 1, 2);   // demister slots
  box(SEATX, DB - 0.22, ZF - 0.425, 0.30, 0.15, 0.008, K, 0.8, 2); push(new THREE.SphereGeometry(0.012, 8, 6), M(SEATX, DB - 0.17, ZF - 0.435), CH, 1, 3);   // glove box
  await pause();
  // the steering wheel, nobody shown at it; a gear stick between the seats
  const WM = M(-SEATX, DB - 0.06, ZF - 0.47, 0, -0.42);
  push(new THREE.TorusGeometry(0.185, 0.013, 10, 40), WM, '#262E38', 1, 2);
  for (const a of [0.52, 2.62, 4.71]) push(new THREE.BoxGeometry(0.185, 0.02, 0.010), WM.clone().multiply(RZ(a)).multiply(new THREE.Matrix4().makeTranslation(0.092, 0, 0)), CH, 0.8, 3);
  push(new THREE.CylinderGeometry(0.035, 0.04, 0.03, 16), WM.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), '#262E38', 1.2, 2);
  push(new THREE.CylinderGeometry(0.009, 0.012, 0.42, 8), M(0.0, -0.80, 1.52, 0, 0.35), CH, 0.9, 3);
  push(new THREE.SphereGeometry(0.03, 12, 8), M(0.0, -0.60, 1.595), '#1F2730', 1.4, 2);
  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(Kd, 1));
  const sh = opts.shared || {};
  const uniforms = { uRing: { value: 0 }, uFwd: { value: 0 }, uRingCol: { value: new THREE.Color(opts.ring || '#CFE3F2') } };
  const body = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uSunW: sh.uSunW || { value: new THREE.Vector3(-0.8, 0.2, 0.56) }, uKeyCol: sh.uKeyCol || { value: new THREE.Color('#F0B59B') },
      uSkyA: { value: new THREE.Color(opts.paneTop || '#9FB4C6') }, uSkyB: { value: new THREE.Color(opts.paneLow || '#F0C4A8') }, uSeatBounce: { value: new THREE.Color(S) },
      uGeo: { value: new THREE.Vector4(WX, hw, hh, rr) }, uPadY: { value: 0.025 - SEATD } },
    vertexShader: CAR_VERT, fragmentShader: CAR_FRAG, side: THREE.DoubleSide,
  }));
  // side panes: misted glass holding the sky, so the turn is never a black frame and the land outside is only a blur
  // (the line above is the live version's, kept as it stands; since flight round 2 the panes are CLEAN glass holding a
  // little of the sky, and the land outside is sharp: see NO BREATH ON THE SIDE PANES below)
  const paneGeo = new THREE.PlaneGeometry(1, 1);
  // Glass, and seen to be glass: a bevelled edge inside the bead, the dusk sky of the far side's windows lying across it
  // as two slanting bars that slide as the head moves. All of it thin: the land outside is what the pane is for.
  // NO BREATH ON THE SIDE PANES (the lead's mend E, flight round 2): the live version's mist along the sill read to
  // strangers as a wash over the view, and this round's first cure, a small patch with a fingertip's stroke through
  // it, was the trace of a hand, which the brief leaves out. It is taken out whole: nothing lies on this glass but
  // its reflections. The breath of the brief is the one on the back window (buildGlass), untouched.
  const paneMat = (w) => new THREE.ShaderMaterial({
    uniforms: { uA: { value: new THREE.Color(opts.paneTop || '#9FB4C6') }, uB: { value: new THREE.Color(opts.paneLow || '#F0C4A8') }, uTime: opts.time || { value: 0 },
      uSize: { value: new THREE.Vector2(w[1] - w[0] + 0.04, w[3] - w[2] + 0.04) } },
    vertexShader: /* glsl */`varying vec2 vUv; varying float vPar;
      void main() { vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.);
        vec3 vd = cameraPosition - wp.xyz; vPar = dot(vd, normalize(mat3(modelMatrix) * vec3(1., 0., 0.))) / max(length(vd), 1e-3);
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`uniform vec3 uA; uniform vec3 uB; uniform float uTime; uniform vec2 uSize; varying vec2 vUv; varying float vPar;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
      void main() {
        vec2 m = (vUv - .5) * uSize;                                             // metres from the middle of the pane
        vec2 q = abs(m) - uSize * .5 + .10; float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - .10;      // metres outside its rounded edge (inside: below zero)
        vec3 c = mix(mix(uB, vec3(.40, .48, .52), .8), uA, smoothstep(.1, .9, vUv.y)) * .9; float a = .035 + .05 * smoothstep(.5, 0., vUv.y);
        float sh = sin(vUv.x * 5. + vUv.y * 2.2 - uTime * 2.1) * .5 + .5;        // the sky sliding across the pane
        sh = sh * sh * (3. - 2. * sh); c *= .86 + .28 * sh; a += .035 * sh;
        // the far windows' sky in the glass: two bars on a slant of one in two, the second thinner; they move with the eye
        float sl = m.x + m.y * .5 + vPar * .35;
        float bar = (1. - smoothstep(.05, .12, abs(sl - .10))) + .6 * (1. - smoothstep(.015, .045, abs(sl + .09)));
        bar *= (1. - smoothstep(-.10, -.02, d)) * (.75 + .25 * vnoise(m * 9.));      // full 10 cm inside the pane's edge, none within 2 cm of it
        vec3 cr = mix(uB, uA, smoothstep(-.2, .25, m.y)) * 1.05;
        float ar = .085 * bar;
        // the glass's edge: a line of sky about 5 mm wide, 26 mm inside the pane's own edge. The pane's edge lies 20 mm under
        // the rubber and the bead is 6 mm wide, so the line runs along the bead's inner edge, where glass meets its trim
        float bev = (1. - smoothstep(.002, .005, abs(d + .026))) * .30;
        vec3 col = c * a; float al = a;
        col = col * (1. - ar) + cr * ar; al = al + ar * (1. - al);
        col = col * (1. - bev) + uA * bev; al = al + bev * (1. - al);
        gl_FragColor = vec4(col, al); }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, premultipliedAlpha: true,
  });
  const paneMats = [paneMat(WIN[0]), paneMat(WIN[1])];
  const group = new THREE.Group();
  group.add(body);
  for (const sx of [-1, 1]) for (let wi = 0; wi < 2; wi++) {
    const w = WIN[wi], pane = new THREE.Mesh(paneGeo, paneMats[wi]);
    pane.scale.set(w[1] - w[0] + 0.04, w[3] - w[2] + 0.04, 1); pane.position.set(sx * (WX + 0.012), (w[2] + w[3]) / 2, (w[0] + w[1]) / 2); pane.rotation.y = Math.PI / 2;
    pane.renderOrder = 900; group.add(pane);
  }
  body.frustumCulled = false;
  return { group, uniforms, triangles: P.length / 9, hw, hh, D };
}

// the part viewer: the figure alone, changing hands now and then so the arm can be judged in motion
export async function buildHero(ctx, opts = {}) {
  const shared = makeShared(opts.palette);
  const fig = await buildFigure(ctx, shared, opts);
  const object = new THREE.Group(); object.add(fig.mesh);
  return {
    object, radius: 1.4, height: 2.8, center: new THREE.Vector3(0, 1.5, 0), anchors: {},
    update(dt, time, camera) {
      shared.uTime.value = time; if (camera) camera.getWorldPosition(shared.uCamW.value);
      const c = (time % 16) / 16; fig.uniforms.uHand.value = ss(0.40, 0.46, c) - ss(0.90, 0.96, c);
    },
    dispose() {}, ground: true, groundY: 0,
  };
}

// two flat tones for anything else that should match the figure (the dog): attributes aLit, aShd
export function makeToonMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`uniform vec3 uCamW; attribute vec3 aLit; attribute vec3 aShd; varying vec3 vLit; varying vec3 vShd; varying vec3 vN; varying float vDist;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vN = mat3(modelMatrix) * normal; vLit = aLit; vShd = aShd; vDist = distance(wp.xyz, uCamW);
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`${LIGHT_GLSL}
      varying vec3 vLit; varying vec3 vShd; varying vec3 vN; varying float vDist;
      void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); vec3 c = mix(vShd, vLit, smoothstep(-.04, .04, dot(n, uSunW) + .1)); gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
  });
}
export { makeAcc };
