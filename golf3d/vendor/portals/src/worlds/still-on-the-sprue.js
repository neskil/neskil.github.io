// STILL ON THE SPRUE. A bright valley that has not been assembled yet: trees, flyers, grazers and striders
// hang as loose parts in standing frames of unpainted kit plastic and snap together as we pass; at the
// valley's waist the Great Frame (src/parts/still-on-the-sprue.js) releases the Longwing.
//
// ONE MECHANISM runs every ambient assembly (PART_VERT): each part is an instance with a home pose on its
// frame, a dock pose in its creature's space, a release u0 and a joint; from uU and uTime the vertex shader
// does the tremble, three twists, the eased hop, the overshoot, the seated state and the stiff joint.
// No scene lights, no textures: the sun is a uniform, haze is mixed in each shader.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero, Geo, plate, roundRect } from '../parts/still-on-the-sprue.js';

const TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const FRAME_W = 24, FRAME_H = 16, RUN_R = 0.19;
// the engine's tone map (ACES on colour / 0.6), and its inverse: the linear colour that lands on a wanted screen colour
function acesFwd(c) {
  const r = c[0] / 0.6, g = c[1] / 0.6, b = c[2] / 0.6;
  const v = [0.59719 * r + 0.35458 * g + 0.04823 * b, 0.076 * r + 0.90834 * g + 0.01566 * b, 0.0284 * r + 0.13383 * g + 0.83777 * b]
    .map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
  return [1.60475 * v[0] - 0.53108 * v[1] - 0.07367 * v[2], -0.10208 * v[0] + 1.10813 * v[1] - 0.00605 * v[2], -0.00327 * v[0] - 0.07276 * v[1] + 1.07602 * v[2]].map((x) => clamp(x, 0, 1));
}
function preLin(T) {
  const c = T.slice();
  for (let i = 0; i < 60; i++) { const a = acesFwd(c); for (let k = 0; k < 3; k++) c[k] = clamp(c[k] * clamp(T[k] / Math.max(a[k], 1e-4), 0.7, 1.4), 0, 6); }
  return c;
}
const pre = (hex) => new THREE.Color().setRGB(...preLin(lin(hex)));

// ---------------------------------------------------------------------------------------------------
const GLSL_Q = /* glsl */`
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
vec4 qmul(vec4 a, vec4 b) { return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz)); }
vec4 qaxis(vec3 ax, float ang) { return vec4(ax * sin(ang * 0.5), cos(ang * 0.5)); }
`;
// the creature frame of an instance: static (centre + yaw), on an elliptical beat (flyers, striders), or
// driven by a uniform pose (the rare second creature)
const GLSL_CRE = /* glsl */`
uniform vec3 uRareP; uniform vec4 uRareQ;
void creature(vec4 c0, vec4 c1, float time, out vec3 cp, out vec4 cq) {
  cp = c0.xyz;
  if (c1.x > 0.0) {
    float a = c1.w + time * c1.z; float ca = cos(a), sa = sin(a);
    cp += vec3(ca * c1.x, c0.w * sin(a * 2.0 + c1.w * 3.0), sa * c1.y);
    vec2 tg = vec2(-sa * c1.x, ca * c1.y) * (c1.z < 0.0 ? -1.0 : 1.0);
    float yaw = (abs(tg.x) + abs(tg.y)) > 1e-5 ? atan(tg.x, tg.y) : 0.0;
    cq = vec4(0.0, sin(yaw * 0.5), 0.0, cos(yaw * 0.5));
  } else if (c1.x < 0.0) { cp = uRareP; cq = uRareQ; }
  else {
    cq = vec4(0.0, sin(c0.w * 0.5), 0.0, cos(c0.w * 0.5));
    if (c1.y != 0.0) {                                           // a walker: c1 = (0, metres per unit of u, the u it is keyed to, how far past it goes)
      cp.xz += vec2(sin(c0.w), cos(c0.w)) * c1.y * clamp(uU - c1.z, -1.0, c1.w);
      cp.y += 0.14 * sin(time * 2.1 + c1.z * 40.0);
    }
  }
}`;

const PART_VERT = /* glsl */`
attribute vec2 aux;
attribute vec3 iHomeP; attribute vec4 iHomeQ; attribute vec3 iDockP; attribute vec4 iDockQ;
attribute vec4 iCre0; attribute vec4 iCre1; attribute vec4 iRel; attribute vec4 iJoint; attribute vec3 iCol; attribute vec4 iFlex; attribute vec3 iGap;
uniform float uU; uniform float uTime; uniform float uFlex; uniform vec3 uScar; uniform vec3 uPin;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vO; varying float vThin; varying float vSt;
${GLSL_Q}
${GLSL_CRE}
void main() {
  vec3 cp; vec4 cq; creature(iCre0, iCre1, uTime, cp, cq);
  float psc = max(length(iFlex.xy), 1e-3); vec3 lp = position * psc;      // iFlex.xy: frame normal times the part's scale
  float k = (uU - iRel.x) / max(iRel.y, 1e-4);
  float seated = step(1.0, k);
  // the stiff joint, only once seated: 1 two-position wingbeat about z, 2 clicking leg about x, 3 sway about x, 4 tier
  float jm = iJoint.x; float sw = sin(uTime * iJoint.z + iJoint.w);
  float wv = jm < 1.5 ? smoothstep(-0.25, 0.25, sw) * 2.0 - 1.0 : (jm < 2.5 ? clamp(sw * 1.7, -1.0, 1.0) : sw);
  float ang = (jm > 0.5 && jm < 3.5) ? iJoint.y * wv * seated : 0.0;
  vec4 jq = jm < 1.5 ? qaxis(vec3(0.0, 0.0, 1.0), ang) : qaxis(vec3(1.0, 0.0, 0.0), ang);
  vec4 sq = qmul(cq, qmul(iDockQ, jq));
  vec3 sp = cp + qrot(cq, iDockP);
  // home: leaf tremble, then three twists on the gates, riding the flex of its frame
  float j = clamp((uU - (iRel.x - 0.012)) / 0.012, 0.0, 1.0);
  float exc = smoothstep(iRel.x - 0.07, iRel.x - 0.012, uU);
  float ph = iFlex.z * 3.1 + iHomeP.x * 0.7 + iHomeP.y * 1.3;
  float trem = (0.02 + 0.045 * exc) * (sin(uTime * 23.0 + ph) + sin(uTime * 17.3 + ph * 1.7));
  float ta = abs(iRel.z) * (trem + sin(18.85 * j) * (0.35 + 0.65 * j));
  vec4 tq = iRel.z >= 0.0 ? qaxis(vec3(1.0, 0.0, 0.0), ta) : qaxis(vec3(0.0, 1.0, 0.0), ta);
  vec4 hq = qmul(iHomeQ, tq);
  float fk = clamp((iHomeP.y - iFlex.w) / ${FRAME_H}.0, 0.0, 1.3); fk *= fk;
  vec3 hp = iHomeP + vec3(iFlex.x, 0.0, iFlex.y) / psc * (uFlex * fk * sin(uTime * 0.8 + iFlex.z));
  vec3 wpos; vec4 q; float st = 0.0;
  if (k >= 1.0) { q = sq; wpos = sp + qrot(q, lp); }
  else if (k <= 0.0) { q = hq; wpos = hp + qrot(q, lp); st = 0.6 * j; }
  else {
    vec3 gap = qrot(cq, iGap);
    st = 0.6 * (1.0 - k);
    if (k < 0.8) {
      float e = k / 0.8; e = e * e * (3.0 - 2.0 * e);
      vec3 pre = sp + gap; float d = distance(hp, pre);
      vec3 c1 = (hp + pre) * 0.5 + vec3(0.0, iRel.w * d + 1.5, 0.0);
      float s1 = 1.0 - e;
      vec3 c = s1 * s1 * hp + 2.0 * s1 * e * c1 + e * e * pre;
      vec4 qb = dot(hq, sq) < 0.0 ? -sq : sq;
      q = normalize(mix(hq, qb, e));
      wpos = c + qrot(q, lp);
    } else {
      float t = (k - 0.8) / 0.2; float s2 = t - 1.0; float bo = 1.0 + 2.2 * s2 * s2 * s2 + 1.2 * s2 * s2;
      q = jm > 3.5 ? qmul(sq, qaxis(vec3(0.0, 1.0, 0.0), 1.5708 * s2 * s2)) : sq;   // a tier spins a quarter turn as it drops
      wpos = sp + gap * (1.0 - bo) + qrot(q, lp);
    }
  }
  vW = wpos; vN = qrot(q, normal); vO = position; vThin = aux.x; vSt = st;
  vC = mix(mix(iCol, uScar, step(0.5, aux.y) * step(aux.y, 1.5)), uPin, step(2.5, aux.y) * step(aux.y, 3.5)) * (1.0 - 0.5 * step(3.5, aux.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(wpos, 1.0);
}`;

// standing frames, logs and other fixed kit: instanced, flexing at the top, some toppling when their u comes
const FRAME_VERT = /* glsl */`
attribute vec2 aux;
attribute vec3 iPos; attribute vec4 iQuat; attribute vec3 iCol; attribute vec4 iFx;   // iFx: phase, topple u0, flex amount, scale
uniform float uU; uniform float uTime; uniform float uFlex; uniform float uPix; uniform vec3 uScar; uniform vec3 uPin;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vO; varying float vThin; varying float vSt;
${GLSL_Q}
void main() {
  vec3 p = position * iFx.w; vec3 n = normal;
  float fk = clamp(p.y / ${FRAME_H}.0, 0.0, 1.3); fk *= fk;
  p.z += uFlex * iFx.z * fk * sin(uTime * 0.8 + iFx.x);
  float tk = clamp((uU - iFx.y) / 0.06, 0.0, 1.0);
  float fall = tk * tk * (1.0 + 0.06 * sin(tk * 9.42) * (1.0 - tk)) * 1.5;           // slow at first, like a card
  vec4 fq = qaxis(vec3(1.0, 0.0, 0.0), fall);
  p = qrot(fq, p); n = qrot(fq, n);
  vec3 wn = qrot(iQuat, n);
  vec3 wpos = iPos + qrot(iQuat, p);
  float dcam = distance(cameraPosition, wpos);
  wpos += wn * clamp(dcam * uPix * 1.1 - ${RUN_R.toFixed(2)} * iFx.w, 0.0, 1.6) * step(aux.y, 1.5);   // runners never under two pixels
  vW = wpos; vN = wn; vO = position; vThin = aux.x; vSt = 0.0;
  vC = mix(mix(iCol, uScar, step(0.5, aux.y) * step(aux.y, 1.5)), uPin, step(2.5, aux.y) * step(aux.y, 3.5)) * (1.0 - 0.5 * step(3.5, aux.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(wpos, 1.0);
}`;

// POLYSTYRENE (the hero's recipe, with the haze mixed in here): wrapped key, cool fill, one broad soft
// highlight, thin places bleeding light when backlit, hollow backs a little deeper, no black anywhere.
const FRAG_COMMON = /* glsl */`
uniform vec3 uSun; uniform vec3 uKey; uniform vec3 uFill; uniform vec3 uSky; uniform vec3 uFogCol; uniform float uFogDen; uniform float uPix;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vO; varying float vThin; varying float vSt;
float hazeAt(float dist) { float f = uFogDen * dist; return 1.0 - exp(-f * f); }
`;
const PLASTIC_FRAG = FRAG_COMMON + /* glsl */`
void main() {
  vec3 N = vN; float nl = length(N); N = nl > 1e-5 ? N / nl : vec3(0.0, 1.0, 0.0);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float inside = 0.0;
  if (!gl_FrontFacing) { N = -N; inside = 1.0; }
  float ndl = dot(N, uSun);
  float wrap = clamp((ndl + 0.6) / 1.6, 0.0, 1.0);
  vec3 col = mix(max(vC, vec3(0.0)), vec3(0.86, 0.84, 0.80), clamp(vSt, 0.0, 1.0) * 0.5);
  float lit = smoothstep(-0.25, 0.75, ndl);
  vec3 body = col * (mix(uFill * (0.50 + 0.10 * N.y), uKey * 1.12, lit) + uKey * 0.10 * max(-N.y, 0.0));   // a harder terminator; the lit floor bounces up
  body += (vec3(0.018, 0.020, 0.026) + col * 0.08) * (1.0 - lit);       // the same floor of sky light on the shadow side of every part
  body *= 1.0 - 0.16 * inside;
  vec3 H = uSun + V; float hl = length(H); H = hl > 1e-4 ? H / hl : N;
  float nh = clamp(dot(N, H), 0.0, 1.0); float nv = clamp(dot(N, V), 0.0, 1.0);
  float s2 = nh * nh; float s4 = s2 * s2; float s10 = s4 * s4 * s2;
  float f = 1.0 - nv;
  float toward = 0.5 + 0.5 * dot(-V, uSun);
  vec3 sheen = 0.16 * s10 * uKey + 0.07 * f * f * f * uSky + col * uKey * 0.45 * f * f * toward * toward;   // and a rim of light on whatever stands against the sun
  vec3 bleed = clamp(vThin, 0.0, 1.0) * (0.5 - 0.5 * ndl) * 0.45 * mix(col, vec3(1.0), 0.5) * (0.3 + 0.7 * toward) * uKey;
  gl_FragColor = vec4(mix(body + sheen + bleed, uFogCol, hazeAt(dist)), 1.0);
}`;
// CLEAR AMBER for the small kit parts: a multiply pass and an additive pass over the same geometry
const AMBER_FRAG = FRAG_COMMON + /* glsl */`
uniform vec3 uAmber; uniform vec3 uTrA; uniform vec3 uTrB; uniform vec3 uHot; uniform float uFire;
void main() {
  vec3 N = vN; float nl = length(N); N = nl > 1e-5 ? N / nl : vec3(0.0, 1.0, 0.0);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  if (!gl_FrontFacing) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0); float g = 1.0 - nv; float fa = hazeAt(dist);
  float rib = clamp(vThin, 0.0, 1.0);
#ifdef AMBER_MUL
  vec3 T = mix(uTrA, uTrB, clamp(rib * 0.8 + g * g * 0.7, 0.0, 1.0));
  gl_FragColor = vec4(mix(T, vec3(1.0), fa), 1.0);
#else
  float ndl = dot(N, uSun);
  float through = clamp(dot(-V, uSun), 0.0, 1.0); float fire = through * through * through;
  float face = 0.3 + 0.7 * nv;
  vec3 c = uAmber * (0.08 + 0.13 * rib + 0.04 * g) * face;
  c += mix(uAmber, uHot, 0.45) * uFire * fire * face * face * (0.35 + 0.65 * rib);
  c += rib * 0.3 * uAmber * (0.5 - 0.5 * ndl) * face + 0.04 * g * g * g * uSky * face;
  gl_FragColor = vec4(c * (1.0 - fa), 1.0);
#endif
}`;

// GROUND: one vacuum-formed shell. Stipple, pebbles, sockets, folds and river ripples are normal offsets
// worked out from world position and faded by distance (never by derivatives).
const GROUND_VERT = /* glsl */`
attribute vec2 aux; attribute vec3 acol;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying float vPale; varying float vRiver;
void main() { vW = position; vN = normal; vCol = acol; vPale = aux.x; vRiver = aux.y; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
// GLSL shared by the ground and the painted shadows: where the shells of the valley sides stand and what shade they throw
const SHELL_GLSL = /* glsl */`
// the valley sides are five moulded shells a side (the same sums of sines as ground() in build): where shell k's riser stands
float shellE(float k, float z, float w, float s) {
  return max(w * 0.44, 58.0) + k * max(w * 0.15, 19.0) + max(w * 0.04, 4.5) * (sin(z * 0.0105 + k * 2.1 + s * 1.3) + 0.6 * sin(z * 0.0231 + k * 4.3 + 1.0 - s * 0.7));
}
// the shade a riser throws inward over the tread below it, when the sun stands behind that side: len in riser widths
float shellShade(float e, float dx, float rw, float len) {
  float r = (e - dx) / rw; len = max(len, 0.05);
  return step(0.0, r) * (1.0 - smoothstep(len * 0.55, len, r)) + (1.0 - step(0.0, r)) * (1.0 - smoothstep(0.0, 0.5, -r));
}
// the shade of a whole shell and all that stands on it, thrown inward across the lower treads and the floor: reach in
// metres from its foot, and never across our own line, so the floor has a shadow side and a lit one
float wallShade(float e, float dx, float reach) {
  float lim = min(reach, max(e - 9.0, 0.0)); float r = e - dx;
  return step(0.0, r) * (1.0 - smoothstep(lim * 0.86 - 2.0, lim, r));
}
`;
const SIDE_GLSL = SHELL_GLSL + /* glsl */`
// how far the valley side takes the sun from a point of the floor or the benches (the same sums as in the ground shader):
// the painted shadows of frames and parts leave off there, since no sun reaches the ground to be kept from it
float sideShd(vec3 W, vec3 sun) {
  float cx = 0.2589 * max(0.0, W.z - 850.0); float sd = W.x >= cx ? 1.0 : -1.0; float dxc = abs(W.x - cx);
  float vw = mix(250.0, 105.0, smoothstep(760.0, 1090.0, W.z)); float rw = max(vw * 0.04, 5.0);
  float sunOut = sd * sun.x / max(sun.y, 0.25) / rw; if (sunOut <= 0.0) return 0.0;
  float e0 = shellE(0.0, W.z, vw, sd), e1 = shellE(1.0, W.z, vw, sd), e2 = shellE(2.0, W.z, vw, sd), e3 = shellE(3.0, W.z, vw, sd), e4 = shellE(4.0, W.z, vw, sd);
  float so = sunOut * rw;
  float a = max(max(shellShade(e0, dxc, rw, 18.0 * sunOut), shellShade(e1, dxc, rw, 24.0 * sunOut)), max(max(shellShade(e2, dxc, rw, 27.0 * sunOut), shellShade(e3, dxc, rw, 30.0 * sunOut)), shellShade(e4, dxc, rw, 14.0 * sunOut)));
  return max(a, max(max(wallShade(e1, dxc, 42.0 * so), wallShade(e2, dxc, 69.0 * so)), max(wallShade(e3, dxc, 99.0 * so), wallShade(e4, dxc, 113.0 * so))));
}
`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uSun; uniform vec3 uKey; uniform vec3 uFill; uniform vec3 uSky; uniform vec3 uFogCol; uniform float uFogDen; uniform float uPix;
uniform vec3 uPale; uniform float uTime; uniform vec2 uDarkZ; uniform float uCast; uniform vec3 uDeep;
uniform vec3 uFrP; uniform vec3 uFrX; uniform vec3 uFrN; uniform vec3 uHullP; uniform vec3 uHullA; uniform float uHullK;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying float vPale; varying float vRiver;
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
// a dome bump in each cell of a jittered grid: returns xy = slope, z = mask
vec3 bumps(vec2 x, float cell, float rmin, float rmax, float density) {
  vec2 g = x / cell; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float h = h21(id + cell * 7.3); float on = step(h, density);
  vec2 c = (vec2(h21(id + 3.1), h21(id + 11.7)) - 0.5) * 0.5;
  float r = mix(rmin, rmax, h21(id + 5.5)) / cell;
  vec2 d = f - c; float l = length(d); float m = on * (1.0 - smoothstep(r * 0.7, r, l));
  float edge = on * smoothstep(r * 0.35, r * 0.9, l) * (1.0 - smoothstep(r * 0.9, r * 1.05, l));
  return vec3(d / max(l, 1e-3) * edge, m);
}
// an ejector-pin witness mark at landscape scale: x = the raised ring, y = the disc inside it, zw = outward on the ring
vec4 pinMark(vec2 x, float cell, float rmin, float rmax, float density, float lw) {
  vec2 g = x / cell; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float h = h21(id + cell * 3.7); float on = step(h, density);
  vec2 c = (vec2(h21(id + 13.1), h21(id + 27.7)) - 0.5) * 0.4;
  float r = mix(rmin, rmax, h21(id + 45.5));
  vec2 d = (f - c) * cell; float l = length(d); float e = (l - r) / lw;
  float band = on * (1.0 - smoothstep(0.5, 1.0, abs(e)));
  return vec4(band, on * (1.0 - smoothstep(r - lw, r, l)), d / max(l, 1e-3) * clamp(e * 2.0, -1.0, 1.0));     // zw: the bead's two slopes
}
${SHELL_GLSL}
// x = on the riser, y = the pale lip at its crest (never under a pixel wide), z = above it
vec3 shellAt(float e, float dx, float rw, float px) {
  float r = (dx - e) / rw; float lw = 0.2 + 0.55 * px / rw;
  return vec3(smoothstep(0.0, 0.2, r) * (1.0 - smoothstep(0.75, 1.0, r)), smoothstep(0.66, 0.82, r) * (1.0 - smoothstep(0.82 + lw * 0.6, 0.82 + lw, r)), smoothstep(0.6, 1.0, r));
}
// CAST SHADOWS, painted from what is known: the ground point is carried along the sun ray to the Great Frame's plane and
// tested against its runners (the numbers are frameRuns() in src/parts/still-on-the-sprue.js, metres in the Frame's plane)
float vbar(float lx, float ly, float X, float y0, float y1, float hw) { return (1.0 - smoothstep(hw, hw * 2.0 + 0.4, abs(lx - X))) * step(y0, ly) * step(ly, y1); }
float hbar(float lx, float ly, float Y, float x0, float x1, float hw) { return (1.0 - smoothstep(hw, hw * 2.0 + 0.4, abs(ly - Y))) * step(x0, lx) * step(lx, x1); }
float frameShade(vec3 P) {
  float dn = dot(uSun, uFrN); dn = dn < 0.0 ? min(dn, -0.05) : max(dn, 0.05);
  float t = dot(uFrP - P, uFrN) / dn;
  vec3 hit = P + uSun * t - uFrP; float lx = dot(hit, uFrX), ly = hit.y;
  if (t <= 0.0 || abs(lx) > 112.0 || ly < 2.0 || ly > 142.0) return 0.0;
  float hw = 1.0 + 0.005 * t, th = hw * 0.7;
  float m = max(max(vbar(lx, ly, -109.4, 4.0, 139.4, hw), vbar(lx, ly, 109.4, 4.0, 139.4, hw)), max(vbar(lx, ly, -44.0, 4.0, 139.4, hw), vbar(lx, ly, 16.0, 4.0, 139.4, hw)));
  m = max(m, max(max(vbar(lx, ly, -77.0, 30.0, 104.0, hw), vbar(lx, ly, 34.0, 30.0, 104.0, hw)), max(vbar(lx, ly, 66.0, 30.0, 104.0, hw), vbar(lx, ly, 98.0, 30.0, 104.0, hw))));
  m = max(m, max(max(hbar(lx, ly, 4.0, -109.4, 109.4, hw), hbar(lx, ly, 139.4, -109.4, 109.4, hw)), max(hbar(lx, ly, 30.0, -109.4, 109.4, hw), hbar(lx, ly, 104.0, -109.4, 109.4, hw))));
  float n = max(max(vbar(lx, ly, -29.0, 30.0, 104.0, th), vbar(lx, ly, -14.0, 30.0, 104.0, th)), max(vbar(lx, ly, 1.0, 30.0, 104.0, th), vbar(lx, ly, 25.0, 30.0, 104.0, th)));
  n = max(n, max(max(hbar(lx, ly, 48.5, -44.0, 16.0, th), hbar(lx, ly, 67.0, -44.0, 16.0, th)), hbar(lx, ly, 85.5, -44.0, 16.0, th)));
  n = max(n, max(max(vbar(lx, ly, -76.7, 104.0, 139.4, th), vbar(lx, ly, -14.0, 104.0, 139.4, th)), max(vbar(lx, ly, 62.6, 104.0, 139.4, th), hbar(lx, ly, 17.0, -109.4, 109.4, th) * step(16.0, abs(lx + 14.0) - 14.0))));
  return max(m, 0.6 * n);
}
// the hull's shadow: a spindle 60 m long about its axis, wherever the sun ray from the ground point passes within its girth
float hullShade(vec3 P) {
  vec3 d = P - uHullP; float ds = dot(d, uSun);
  vec3 dp = d - uSun * ds; vec3 ap = uHullA - uSun * dot(uHullA, uSun);
  float sA = clamp(dot(dp, ap) / max(dot(ap, ap), 1e-3), -30.0, 30.0); float kA = sA / 30.0;
  float r = length(dp - ap * sA), rs = 7.6 * (1.0 - 0.62 * kA * kA);
  return uHullK * step(ds, 0.0) * (1.0 - smoothstep(rs * 0.55, rs * 1.1 + 1.5 - 0.012 * min(ds, 0.0), r));
}
void main() {
  vec3 N = vN; float nl = length(N); N = nl > 1e-5 ? N / nl : vec3(0.0, 1.0, 0.0);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float px = dist * uPix * 2.0;
  float fStip = clamp(1.0 - px / 0.45, 0.0, 1.0), fPeb = clamp(1.0 - px / 1.6, 0.0, 1.0), fSock = clamp(1.0 - px / 3.0, 0.0, 1.0), fFold = clamp(1.0 - px / 9.0, 0.0, 1.0);
  float river = smoothstep(0.35, 0.65, vRiver); float land = step(-0.5, vRiver);          // the far shells beyond the portal carry -1
  vec2 x = vW.xz; vec2 off = vec2(0.0); float pale = vPale; float dark = 0.0;
  vec3 st = bumps(x, 0.55, 0.12, 0.2, 0.75); off += st.xy * 1.0 * fStip * (1.0 - river);            // grass stipple
  vec3 s2b = bumps(x + 5.0, 1.45, 0.3, 0.5, 0.6); off += s2b.xy * 0.7 * clamp(1.0 - px / 1.3, 0.0, 1.0) * (1.0 - river);
  float flat1 = smoothstep(0.82, 0.97, N.y); fPeb *= flat1; fSock *= flat1;
  float dz = smoothstep(uDarkZ.x, uDarkZ.y, vW.z);
  // the moulded shells of the valley sides: a soft shade on each riser, a pale lip where the sheet stretched over
  // the tool's edge, each tread a little paler than the one below
  float cx = 0.2589 * max(0.0, vW.z - 850.0); float sd = vW.x >= cx ? 1.0 : -1.0; float dxc = abs(vW.x - cx);
  float vw = mix(250.0, 105.0, smoothstep(760.0, 1090.0, vW.z)); float rw = max(vw * 0.04, 5.0);
  float e0 = shellE(0.0, vW.z, vw, sd), e1 = shellE(1.0, vW.z, vw, sd), e2 = shellE(2.0, vW.z, vw, sd), e3 = shellE(3.0, vW.z, vw, sd), e4 = shellE(4.0, vW.z, vw, sd);
  float floorM0 = 1.0 - smoothstep(e0 - 16.0, e0 - 3.0, dxc);
  vec3 sh = shellAt(e0, dxc, rw, px) + shellAt(e1, dxc, rw, px) + shellAt(e2, dxc, rw, px) + shellAt(e3, dxc, rw, px) + shellAt(e4, dxc, rw, px);
  float riser = min(sh.x, 1.0) * land, lip = min(sh.y, 1.0) * land, level = sh.z * land;
  float sunOut = sd * uSun.x / max(uSun.y, 0.25) / rw; float shd = 0.0;
  if (sunOut > 0.0) shd = max(max(shellShade(e0, dxc, rw, 18.0 * sunOut), shellShade(e1, dxc, rw, 24.0 * sunOut)),
    max(max(shellShade(e2, dxc, rw, 27.0 * sunOut), shellShade(e3, dxc, rw, 30.0 * sunOut)), shellShade(e4, dxc, rw, 14.0 * sunOut))) * land;
  if (sunOut > 0.0) { float so = sunOut * rw; shd = max(shd, max(max(wallShade(e1, dxc, 42.0 * so), wallShade(e2, dxc, 69.0 * so)), max(wallShade(e3, dxc, 99.0 * so), wallShade(e4, dxc, 113.0 * so))) * land); }
  // kit tells on the risers, large enough to read from across the valley: a row of ejector-pin rings half way up
  // each wall and an upright parting seam every third ring; the panels between seams step darker toward the portal
  float eR = dxc > e4 ? e4 : dxc > e3 ? e3 : dxc > e2 ? e2 : dxc > e1 ? e1 : e0;
  float kR = dxc > e4 ? 4.0 : dxc > e3 ? 3.0 : dxc > e2 ? 2.0 : dxc > e1 ? 1.0 : 0.0;
  float hR = kR > 3.5 ? 14.0 : 18.0 + 4.2 * kR; float rfr = clamp((dxc - eR) / rw, 0.0, 1.0);
  float yR = (rfr * rfr * (3.0 - 2.0 * rfr) - 0.5) * hR; float cR = 34.0 + 5.0 * kR;
  float zc = vW.z / cR + kR * 0.37 + sd * 0.21; float zR = (fract(zc) - 0.5) * cR; float lwR = max(0.5, px * 0.75);
  float hRn = h21(vec2(floor(zc), kR * 7.0 + sd)); float rR = hR * (0.2 + 0.1 * hRn);
  float dR = length(vec2(zR, yR)) + 60.0 * step(0.72, fract(hRn * 7.3)); float fR = riser * (1.0 - lip) * (1.0 - smoothstep(9.0, 22.0, px));
  float ringR = (1.0 - smoothstep(lwR * 0.5, lwR, abs(dR - rR))) * fR; float discR = (1.0 - smoothstep(rR - lwR, rR, dR)) * fR;
  float zs = vW.z / (cR * 3.0) + kR * 0.37 + sd * 0.21 + 0.5 / 3.0; float zS = (fract(zs) - 0.5) * cR * 3.0;
  float seamR = (1.0 - smoothstep(lwR * 0.4, lwR * 0.9, abs(zS))) * fR; float stepR = floor((vW.z - 760.0) / 80.0) * step(760.0, vW.z) * land;
  pale += 0.035 * level + 0.6 * lip * (1.0 - 0.35 * dz) + 0.26 * max(ringR, seamR); dark += (0.27 - 0.09 * dz) * riser * (1.0 - lip) + 0.07 * discR * (1.0 - ringR) + 0.03 * min(stepR, 5.0) * (1.0 - floorM0) * (1.0 - lip);
  float floorM = (1.0 - smoothstep(e0 - 16.0, e0 - 3.0, dxc)) * (1.0 - river) * land;
  vec3 pb = bumps(x, 2.3, 0.2, 0.55, 0.3); off += pb.xy * 0.55 * fPeb; pale += pb.z * 0.08 * fPeb;      // pebbles
  vec3 pc = bumps(x + 17.0, 9.3, 0.7, 1.5, 0.22); off += pc.xy * 0.5 * fSock; pale += pc.z * 0.06 * fSock;
  vec3 sk = bumps(x + 41.0, 19.0, 1.0, 1.3, 0.3); off -= sk.xy * 0.9 * fSock * (1.0 - river); dark += sk.z * 0.12 * fSock * (1.0 - river);   // empty sockets
  // kit tells at the scale of the land: ejector-pin rings 15 to 70 m across pressed into the floor, and the mould's
  // parting seams running straight across floor and hills alike, each panel between them a slightly different pull
  float lwr = max(0.55, px * 0.6);
  vec4 m1 = pinMark(x + 91.0, 64.0, 6.5, 12.0, 0.5, lwr); vec4 m2 = pinMark(x + 300.0, 190.0, 22.0, 34.0, 0.6, lwr * 1.4);
  float f1 = (1.0 - smoothstep(3.0, 8.0, px)) * floorM, f2 = (1.0 - smoothstep(6.0, 14.0, px)) * floorM;
  float farK = smoothstep(0.4, 2.2, px);                                    // close to, a bead is seen by its light and shade; from the air, as a pale ring
  pale += (0.07 + 0.2 * farK) * (m1.x * f1 + m2.x * f2); dark += 0.09 * m1.y * (1.0 - m1.x) * f1 + 0.08 * m2.y * (1.0 - m2.x) * f2;
  off += (m1.zw * m1.x * f1 + m2.zw * m2.x * f2) * 1.1;
  vec2 sm = vec2(dot(x, vec2(0.906, 0.423)), dot(x, vec2(-0.423, 0.906))); vec2 sc = vec2(150.0, 230.0);
  vec2 sf = (fract(sm / sc + 0.5) - 0.5) * sc; vec2 sa = abs(sf); float lws = max(0.4, px * 0.55);
  float fSeam = (1.0 - smoothstep(4.0, 11.0, px)) * (1.0 - river) * land * (0.25 + 0.75 * floorM);
  float seam = max(1.0 - smoothstep(lws * 0.5, lws, sa.x), 1.0 - smoothstep(lws * 0.5, lws, sa.y)) * fSeam;
  float sshade = max((1.0 - smoothstep(lws, lws * 4.0, sa.x)) * step(0.0, sf.x), (1.0 - smoothstep(lws, lws * 4.0, sa.y)) * step(0.0, sf.y)) * fSeam;
  float panel = (h21(floor(sm / sc + 0.5) + 7.0) - 0.5) * land;
  pale += (0.08 + 0.2 * farK) * seam; dark += 0.10 * sshade * (1.0 - seam);
  float fw = sin(x.x * 0.21 + sin(x.y * 0.05) * 2.0) + sin(x.y * 0.17 + sin(x.x * 0.043) * 2.4);                  // soft radiused folds
  off += vec2(cos(x.x * 0.21 + sin(x.y * 0.05) * 2.0), cos(x.y * 0.17 + sin(x.x * 0.043) * 2.4)) * 0.10 * fFold * (1.0 - river);
  pale += 0.035 * fw * (1.0 - river);
  // the river: the same plastic, glossier, with moulded ripple ridges that do not flow but catch the light
  float rp = sin(x.y * 1.3 + sin(x.x * 0.35 + x.y * 0.11) * 2.2) * 0.5 + sin(x.y * 0.47 + x.x * 0.3) * 0.5;
  off += vec2(0.12, 1.0) * rp * 0.42 * river * clamp(1.0 - px / 4.0, 0.0, 1.0);
  N = normalize(N + vec3(off.x, 0.0, off.y));
  float ndl = dot(N, uSun); float wrap = clamp((ndl + 0.6) / 1.6, 0.0, 1.0);
  // the valley sides are a deeper plastic than the floor, so the pale parts and the clear wings stand against them
  float wallM = (1.0 - floorM0) * land;
  vec3 col = mix(mix(vCol, uDeep, 0.55 * wallM * (1.0 - 0.7 * dz)), uPale, clamp(pale, 0.0, 0.85)) * (1.0 - 0.34 * wallM * (1.0 - 0.6 * lip));
  col = mix(col, vCol * 0.88, river * 0.6) * (1.0 - dark) * (1.0 + 0.10 * panel);
  // down the dark valley the key cools and weakens, so both walls stay in one slate family; the shade is a blue of its own
  // the avenue lies in the warmest of the light, the open floor in the plain key
  vec3 keyG = mix(uKey * 1.05 * mix(vec3(1.0), vec3(1.15, 1.0, 0.76), 1.0 - smoothstep(170.0, 330.0, vW.z)), uFill * 0.98 + vec3(0.03, 0.02, 0.05), 0.35 * dz);
  vec3 fillG = uFill * vec3(0.78, 0.92, 1.16);
  float castS = max(frameShade(vW), hullShade(vW)) * land;
  float lit = smoothstep(-0.12, 0.62, ndl) * (1.0 - 0.85 * uCast * shd * (1.0 - lip)) * (1.0 - 0.8 * uCast * castS);
  vec3 body = col * (mix(fillG * (0.48 + 0.12 * N.y), keyG, lit) + uKey * 0.06 * (1.0 - N.y) * (1.0 - lit));
  body += (vec3(0.038, 0.034, 0.038) + col * 0.11) * (1.0 - lit);       // light thrown back from the lit side under every shade: the shadow side keeps its moulding, a slate navy, never black
  vec3 H = uSun + V; float hl = length(H); H = hl > 1e-4 ? H / hl : N;
  float nh = clamp(dot(N, H), 0.0, 1.0); float nv = clamp(dot(N, V), 0.0, 1.0);
  float s2 = nh * nh; float s4 = s2 * s2; float s10 = s4 * s4 * s2; float f = 1.0 - nv;
  float f3 = f * f * f;
  vec3 sheen = (0.12 + 0.5 * river) * s10 * uKey * (1.0 - 0.8 * uCast * shd) + (0.05 + 0.40 * river) * f3 * uSky;
  gl_FragColor = vec4(mix(body + sheen, uFogCol, 1.0 - exp(-uFogDen * uFogDen * dist * dist)), 1.0);
}`;

const SKY_VERT = /* glsl */`
varying vec3 vD;
void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uKey; uniform float uGlow;
varying vec3 vD;
void main() {
  vec3 d = vD / max(length(vD), 1e-4);
  float t = clamp(d.y, 0.0, 1.0); t = 1.0 - (1.0 - t) * (1.0 - t) * (1.0 - t);
  vec3 col = mix(uHorizon, uZenith, t);
  float sd = clamp(dot(d, uSun), 0.0, 1.0); float s2 = sd * sd; float s8 = s2 * s2 * s2 * s2; float s32 = s8 * s8 * s8 * s8;
  col += uKey * uGlow * (0.02 * s2 + 0.06 * s8 + 0.22 * s32 * s32);          // the sun is a soft bright place in the sky, never a disc
  gl_FragColor = vec4(col, 1.0);
}`;

// soft blue contact shadows: instanced quads multiplied on; a few ride an elliptical beat under a strider
const SHADOW_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iSz; attribute vec4 iOrb;
uniform float uTime; uniform float uU; uniform vec3 uSun;
varying vec2 vUv; varying float vK; varying float vDist; varying vec3 vW;
void main() {
  vec3 c = iPos;
  if (iOrb.x > 0.0) { float a = iOrb.w + uTime * iOrb.z; c.x += cos(a) * iOrb.x; c.z += sin(a) * iOrb.y; }
  else if (iOrb.y != 0.0) c.xz += vec2(sin(iSz.z), cos(iSz.z)) * iOrb.y * clamp(uU - iOrb.z, -1.0, iOrb.w);       // under a walker
  float cr = cos(iSz.z), sr = sin(iSz.z);
  vec2 q = position.xz * iSz.xy; q = vec2(cr * q.x + sr * q.y, -sr * q.x + cr * q.y);
  vec2 D = -uSun.xz / max(length(uSun.xz), 1e-3); float len = min(iSz.x, iSz.y) * clamp(0.75 / max(uSun.y, 0.2), 0.3, 2.6) * (iSz.w < 0.0 ? 0.0 : 1.0);
  vec3 w = c + vec3(q.x, 0.0, q.y); w.xz += D * (len * step(0.0, dot(q, D)) + min(iSz.x, iSz.y) * 0.3);      // each shadow is drawn out away from the sun
  vUv = position.xz; vK = abs(iSz.w) * (iSz.w < 0.0 ? smoothstep(iPos.y, iPos.y + 0.004, uU) : 1.0);
  if (iSz.w < 0.0) w.y = 0.12;
  vDist = distance(cameraPosition, w); vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const SHADOW_FRAG = /* glsl */`
uniform vec3 uShadow; uniform float uFogDen; uniform vec3 uSun; uniform float uCast;
varying vec2 vUv; varying float vK; varying float vDist; varying vec3 vW;
${SIDE_GLSL}
void main() {
  float d = clamp((1.0 - length(vUv)) * 1.45, 0.0, 1.0); float f = uFogDen * vDist;
  float a = d * d * (3.0 - 2.0 * d) * vK * exp(-f * f) * (1.0 - 0.9 * uCast * sideShd(vW, uSun));
  vec3 F = mix(vec3(1.0), uShadow, a);
  gl_FragColor = vec4(F, 1.0 - 0.08 * a / max(F.b, 0.2));               // blended as dst * F + F * 0.08 a / F.b: see SHADE
}`;
// the long shadow a standing frame throws: its runners and the parts still hanging in its cells, softer the further they fall
const CAST_VERT = /* glsl */`
attribute vec4 aux;
varying vec2 vUv; varying vec4 vK; varying float vDist; varying vec3 vW;
void main() { vUv = uv; vK = aux; vW = position; vDist = distance(cameraPosition, position); gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const CAST_FRAG = /* glsl */`
uniform vec3 uShadow; uniform float uFogDen; uniform float uCast; uniform vec3 uSun;
varying vec2 vUv; varying vec4 vK; varying float vDist; varying vec3 vW;
${SIDE_GLSL}
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
void main() {
  vec2 cs = vec2(23.2 / max(vK.x, 1.0), 14.3 / max(vK.y, 1.0)); vec2 p = vec2(vUv.x + 11.6, vUv.y - 1.3);
  vec2 cell = floor(p / cs); vec2 f = p - (cell + 0.5) * cs;
  float blur = 0.3 + 0.07 * max(vUv.y, 0.0);
  float line = 1.0 - smoothstep(0.2, 0.2 + blur, min(abs(abs(f.x) - cs.x * 0.5), abs(abs(f.y) - cs.y * 0.5)));
  float inside = step(-0.3, p.x) * step(p.x, 23.5) * step(-0.3, p.y) * step(p.y, 14.6);
  float hh = h21(cell + vK.z * 17.0);
  float part = (1.0 - smoothstep(0.2, 0.2 + blur * 0.12, length(f / cs))) * step(0.2, hh);
  float fo = uFogDen * vDist;
  float a = max(0.85 * line, 0.9 * part) * inside * vK.w * uCast * exp(-fo * fo) * (1.0 - 0.9 * uCast * sideShd(vW, uSun));
  vec3 F = mix(vec3(1.0), uShadow, a);
  gl_FragColor = vec4(F, 1.0 - 0.08 * a / max(F.b, 0.2));
}`;
// amber light patches: one quad per clear wing, slid along the sun ray onto the ground, ribbed like the wing
const PATCH_VERT = /* glsl */`
attribute vec3 aUv;
varying vec3 vUv; varying float vDist;
void main() { vUv = aUv; vDist = distance(cameraPosition, position); gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const PATCH_FRAG = /* glsl */`
uniform float uFogDen; uniform float uStrength; uniform vec3 uTrA; uniform vec3 uTrB; uniform vec3 uAmber;
varying vec3 vUv; varying float vDist;
void main() {
  vec2 q = vUv.xy;                                           // x along the span 0..1, y across the chord -1..1
  float sx = clamp(q.x, 0.0, 1.0); float taper = 0.16 + 0.84 * sin(3.14159 * sqrt(sx) * (0.55 + 0.45 * sx));
  float m = smoothstep(0.0, 0.05, q.x) * (1.0 - smoothstep(0.78, 1.0, q.x)) * (1.0 - smoothstep(taper * 0.45, taper, abs(q.y)));    // a soft-edged pool
  float rib = smoothstep(0.55, 0.9, abs(sin(q.x * 31.4))) * 0.5 + smoothstep(0.8, 0.95, abs(q.y) / max(taper, 0.1)) * 0.5;
  float f = uFogDen * vDist; float a = m * uStrength * vUv.z * exp(-f * f);
#ifdef PATCH_ADD
  gl_FragColor = vec4(uAmber * (0.52 - 0.3 * rib) * a, 1.0);                       // light through clear plastic: brighter than the ground it falls on
#else
  vec3 T = mix(vec3(1.0), mix(uTrA, uTrB, rib) * 1.25, 0.55);
  gl_FragColor = vec4(mix(vec3(1.0), min(T, vec3(1.0)), a), 1.0);
#endif
}`;
// swarf: pale curled slivers. Puffs are placed by progress (uU); the weather pool wraps round the camera.
const SWARF_VERT = /* glsl */`
attribute vec3 aVel; attribute vec4 aSeed;
uniform float uU; uniform float uTime; uniform float uPx; uniform vec3 uCam; uniform vec3 uWind; uniform float uBox;
varying float vA; varying float vRot;
void main() {
  vec3 p = position; float on = 1.0; float a = 0.0;
#ifdef WEATHER
  p += uWind * uTime * aSeed.w + vec3(sin(uTime * 0.6 + aSeed.z) * 1.5, 0.0, cos(uTime * 0.47 + aSeed.z * 1.7) * 1.5);
  p = uCam + mod(p - uCam + uBox * 0.5, vec3(uBox)) - uBox * 0.5;
  vec3 e = abs(p - uCam) / (uBox * 0.5);
  vA = (1.0 - smoothstep(0.75, 1.0, max(e.x, max(e.y, e.z)))) * 0.85;
#else
  float age = (uU - aSeed.x) / (0.05 * aSeed.w);
  on = step(0.0, age) * step(age, 1.0); a = clamp(age, 0.0, 1.0);
  p += aVel * (1.0 - exp(-3.5 * a)) * 1.4; p.y -= 7.0 * a * a;
  p.x += sin(uTime * 0.9 + aSeed.z) * 0.6 * a; p.z += cos(uTime * 0.7 + aSeed.z * 1.7) * 0.6 * a;
  vA = on * smoothstep(0.0, 0.04, a) * (1.0 - a * a);
#endif
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = on * clamp(aSeed.y * uPx / max(-mv.z, 1.0), 1.5, 36.0);
  if (on < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vRot = aSeed.z + uTime * (1.2 + aSeed.w);
}`;
const SWARF_FRAG = /* glsl */`
uniform vec3 uKey;
varying float vA; varying float vRot;
void main() {
  vec2 q = gl_PointCoord - 0.5; float c = cos(vRot), s = sin(vRot);
  q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  float d = abs(q.x) * 1.2 + abs(q.y) * 2.6;
  float m = 1.0 - smoothstep(0.32, 0.5, d);
  if (m * vA < 0.01) discard;
  gl_FragColor = vec4(vec3(0.84, 0.82, 0.78) * uKey, m * vA * 0.9);
}`;

// ---------------------------------------------------------------------------------------------------
// KIT PARTS. Each is modelled in its seated space with the origin at its hinge or pin, as a thin shell:
// lips, bevels and stubs carry thinness 1 (aux.x) so they glow when backlit; aux.y 1 marks a gate scar.
const SCAR = 1, PIN = 3, SEAM = 4;        // aux.y: 1 a pale gate scar, 3 a pin head in another plastic, 4 the shaded line of a seam
function scarDot(G, x, y, z, r) {                                   // the pale stress-whitened stub a gate leaves
  const keep = G.part; G.part = SCAR;
  G.lathe([x, y, z], [0, 1, 0], [[r, -r * 0.3, 1], [0, r * 0.8, 1]], 3);
  G.part = keep;
}
// half of a split spindle hull lying along z (the +x half), open on the split plane, with a seam lip,
// two inner ribs seen from behind, and a locating pin
function hullHalf(G, len, rx, ry, nose, nz, nt, bulge = 0, ribs = [0.3, 0.62], bead = 0, pins = null, scar = 0.16) {
  G.part = 0;
  const R = (w) => { const t = clamp(w, 0.001, 0.999); return Math.pow(Math.sin(Math.PI * Math.pow(t, nose)), 0.6) * (1 + bulge * Math.exp(-((t - 0.2) * (t - 0.2)) / 0.01)); };
  G.grid(nt, nz, (u, w, o) => {
    const a = (u - 0.5) * Math.PI, r = R(w);
    o[0] = Math.cos(a) * rx * r; o[1] = Math.sin(a) * ry * r; o[2] = (w - 0.5) * len;
    return (u < 0.01 || u > 0.99) ? 1 : 0;
  });
  for (const w of ribs) {                                             // inner ribs: half discs across the hollow
    const r = R(w), z = (w - 0.5) * len;
    G.grid(nt, 1, (u, v, o) => { const a = (u - 0.5) * Math.PI, k = v ? 1 : 0.55; o[0] = Math.cos(a) * rx * r * k; o[1] = Math.sin(a) * ry * r * k; o[2] = z; return 0.5; });
  }
  G.lathe([0, 0, len * 0.12], [-1, 0, 0], [[rx * 0.1, 0, 0], [rx * 0.07, rx * 0.5, 0.6]], 3);    // locating pin
  if (bead > 0.2) G.part = SEAM;
  if (bead) for (const sg of [1, -1]) G.grid(1, nz, (u, w, o) => {     // a raised seam bead along the back and the belly, where the halves meet
    const t = 0.1 + 0.8 * w, r = R(t); o[0] = u * rx * bead * 0.6; o[1] = sg * ry * r * (1 + bead * (1 - u)); o[2] = (t - 0.5) * len; return 1;
  });
  G.part = 0;
  if (pins) for (const w of pins) {                                   // headed pins through the flank at shoulder and hip, in another plastic
    const r = R(w), a = 0.42, hr = rx * 0.2; G.part = PIN;
    G.lathe([Math.cos(a) * rx * r * 0.97, Math.sin(a) * ry * r * 0.97, (w - 0.5) * len], [Math.cos(a) * ry, Math.sin(a) * rx, 0], [[hr, 0, 0], [hr, hr * 0.6, 0], [0, hr * 0.9, 0]], 5);
    G.part = 0;
  }
  if (scar > 0.2) {                                                   // the gate scar on the flank: a pale stub in a shaded ring, large enough to read from our height
    const a = -0.3, r = R(0.47), c = [Math.cos(a) * rx * r * 0.985, Math.sin(a) * ry * r * 0.985, -len * 0.03], n = [Math.cos(a) * ry, Math.sin(a) * rx, 0];
    G.part = SEAM; G.lathe(c, n, [[rx * scar * 1.35, 0, 0], [rx * scar * 1.1, 0.03, 0], [0, 0.03, 0]], 6);
    G.part = SCAR; G.lathe(c, n, [[rx * scar * 0.8, 0.03, 1], [rx * scar * 0.5, 0.1, 1], [0, 0.1, 1]], 5); G.part = 0;
  } else scarDot(G, rx * R(0.5) * 0.98, 0, 0, rx * scar);
}
// a flat bevelled plate in the xz plane from an outline, with raised ribs on top; hinge at the origin
function flatPart(G, outline, th, ribs = []) {
  G.part = 0;
  const m = new THREE.Matrix4().makeRotationX(Math.PI / 2);          // plate() builds in xy: lay it down
  G.m = m; plate(G, outline.map((p) => [p[0], p[1]]), -th, th, th * 0.8, 1); G.m = null;
  for (const r of ribs) G.lathe([r[0], th, r[1]], [r[2] - r[0], 0, r[3] - r[1]], [[th * 1.4, 0, 0.6], [th * 1.1, Math.hypot(r[2] - r[0], r[3] - r[1]), 0.6]], 3);
}
function wingPart(G) {                                              // +x wing, hinge barrel at the root
  flatPart(G, [[0.05, -0.42], [0.95, -0.62], [2.05, -0.2], [1.25, 0.5], [0.05, 0.4]], 0.035,
    [[0.1, -0.1, 1.9, -0.12], [0.1, 0.18, 1.3, 0.3]]);
  G.lathe([0, 0, -0.42], [0, 0, 1], [[0.09, 0, 0], [0.09, 0.84, 0]], 3);
  scarDot(G, 1.0, 0.03, 0.42, 0.07);
}
// the same wing for the few flyers we see close to: ribbed above and below, a headed hinge pin at the root, two gate scars
function wingRich(G) {
  const ribs = [[0.1, -0.24, 1.7, -0.34], [0.1, -0.02, 1.95, -0.14], [0.1, 0.18, 1.55, 0.24], [0.1, 0.32, 1.1, 0.42]], th = 0.035;
  flatPart(G, [[0.05, -0.42], [0.95, -0.62], [2.05, -0.2], [1.25, 0.5], [0.05, 0.4]], th, ribs);
  for (const r of ribs) G.lathe([r[0], -th, r[1]], [r[2] - r[0], 0, r[3] - r[1]], [[th * 1.5, 0, 0.6], [th * 1.1, Math.hypot(r[2] - r[0], r[3] - r[1]), 0.6]], 3);
  G.lathe([0, 0, -0.5], [0, 0, 1], [[0, 0, 0.5], [0.17, 0.02, 0], [0.17, 0.1, 0], [0.09, 0.12, 0], [0.09, 0.88, 0], [0.17, 0.9, 0], [0.17, 0.98, 0], [0, 1.0, 0.5]], 6);
  scarDot(G, 1.0, 0.03, 0.44, 0.09); scarDot(G, 1.5, 0.03, -0.42, 0.07);
}
function vanePart(G) {                                              // tail vane standing in the yz plane
  G.part = 0;
  const m = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  G.m = m; plate(G, [[0, 0], [-0.25, 0.75], [-0.75, 0.85], [-0.95, 0.1], [-0.6, -0.08]], -0.03, 0.03, 0.025, 1); G.m = null;
  scarDot(G, 0, 0.85, 0.5, 0.06);
}
function vaneRich(G) {                                              // the close-up tail vane: a rib each side and a plain pale gate scar
  vanePart(G);
  for (const sx of [0.03, -0.03]) G.lathe([sx, 0.05, 0.15], [0, 0.72, 0.45], [[0.045, 0, 0.6], [0.03, 0.8, 0.6]], 3);
  scarDot(G, 0, 0.87, 0.72, 0.11);
}
function trunkHalf(G) {                                             // the +x half of a 10 m trunk, pegged at the base
  G.part = 0;
  const prof = [[0, 0.85], [0.6, 0.62], [3.2, 0.5], [6.4, 0.38], [9.4, 0.24]];
  G.grid(4, prof.length - 1, (u, w, o) => {
    const k = Math.round(w * (prof.length - 1)), a = (u - 0.5) * Math.PI;
    o[0] = Math.cos(a) * prof[k][1]; o[1] = prof[k][0]; o[2] = Math.sin(a) * prof[k][1];
    return (u < 0.01 || u > 0.99) ? 1 : 0;
  });
  G.lathe([0, 9.4, 0], [0, 1, 0], [[0.13, 0, 0], [0.1, 1.2, 0.5]], 3);     // the pin the tiers drop over
  scarDot(G, 0.52, 3.0, 0, 0.12);
}
function tierPart(G) {                                              // a dished foliage cone, radius 1, hole in the centre, thick lip
  G.part = 0;
  const prof = [[0.13, 0.36, 0.4], [0.62, 0.24, 0], [1.0, -0.08, 1], [0.5, 0.06, 0], [0.13, 0.22, 0.4]];
  G.grid(6, prof.length - 1, (u, w, o) => {
    const k = Math.round(w * (prof.length - 1)), a = u * TAU, sc = 1 + 0.06 * Math.cos(a * 4.0) * prof[k][0];
    o[0] = Math.cos(a) * prof[k][0] * sc; o[1] = prof[k][1]; o[2] = Math.sin(a) * prof[k][0] * sc; return prof[k][2];
  }, true);
  scarDot(G, 0.985, -0.03, 0, 0.05);
}
function legPart(G) {                                               // a stilt leg hanging from its pin at the origin, 7 m long
  G.part = 0;
  G.lathe([-0.28, 0, 0], [1, 0, 0], [[0, 0, 0], [0.6, 0.05, 0.5], [0.6, 0.5, 0.5], [0, 0.56, 0]], 6);           // pin head
  G.lathe([0, 0, 0], [0.06, -1, 0.02], [[0.3, 0, 0], [0.26, 2.4, 0], [0.34, 3.4, 0], [0.14, 6.5, 0], [0.48, 6.95, 0.8], [0, 7.0, 1]], 4);
  scarDot(G, 0.3, -2.0, 0, 0.1);
}
function reedPart(G) {                                              // a comb strip: a short runner with a row of tines
  G.part = 0;
  G.lathe([-2.2, 0.12, 0], [1, 0, 0], [[0, -0.1, 0.5], [0.13, 0, 0], [0.13, 4.4, 0], [0, 4.5, 0.5]], 3);
  for (let i = 0; i < 9; i++) {
    const x = -2 + i * 0.5, h = 2.0 + 0.9 * Math.sin(i * 2.3 + 1);
    G.grid(1, 1, (u, w, o) => { o[0] = x + (u - 0.5) * 0.2 * (1 - w * 0.7); o[1] = 0.12 + w * h; o[2] = w * 0.22; return 0.7; });
  }
}
// an offcut runner lying on the ground like a log, some still T-shaped: len metres along x
function logPart(G, tee, len) {
  G.part = 0; G.m = new THREE.Matrix4().makeScale(len, 1, 1);
  G.lathe([-0.5, 0.3, 0], [1, 0, 0], [[0, 0, 1], [0.24, 0.0, 1], [0.3, 0.03, 0.2], [0.3, 0.97, 0.2], [0.24, 1.0, 1], [0, 1.0, 1]], 6);
  if (tee) G.lathe([0.1, 0.3, 0], [0, 0.25, 1], [[0.26, 0, 0], [0.24, 0.22, 0.2], [0.18, 0.25, 1], [0, 0.25, 1]], 6);
  G.part = SCAR; G.lathe([0.5, 0.3, 0], [1, 0, 0], [[0.2, -0.002, 1], [0, 0.012, 1]], 6); G.part = 0; G.m = null;
}

// ---------------------------------------------------------------------------------------------------
// FRAMES. A frame kind is a grid of cells (nx by ny) in the local xy plane, base at y 0, and a list of
// slots: where a part hangs (x, y), how it lies in the plane (q) and the gates that hold it.
const basisQ = (ex, ey, ez) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(...ex), V3(...ey), V3(...ez)));
const Q_UP = basisQ([0, 0, 1], [1, 0, 0], [0, 1, 0]);        // hull half standing: length -> y, bulge -> front
const Q_ALONG = basisQ([0, 0, 1], [0, -1, 0], [1, 0, 0]);    // hull half lying along x
const Q_FLAT = basisQ([1, 0, 0], [0, 0, 1], [0, -1, 0]);     // wing or tier: face -> front
const Q_EDGE = basisQ([0, 0, 1], [0, 1, 0], [-1, 0, 0]);     // vane or trunk half: side -> front
const Q_ID = new THREE.Quaternion();
const FX0 = -FRAME_W / 2 + 0.4, FX1 = FRAME_W / 2 - 0.4, FY0 = 1.3, FY1 = FRAME_H - 0.4;
function frameKind(nx, ny, fill) {
  const cw = (FX1 - FX0) / nx, ch = (FY1 - FY0) / ny, slots = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) fill(slots, FX0 + (i + 0.5) * cw, FY0 + (j + 0.5) * ch, cw, ch, i, j);
  return { nx, ny, cw, ch, slots };
}
const KIND_FLY = frameKind(4, 3, (S, cx, cy, cw, ch, i, j) => {
  const c = j * 4 + i, top = cy + ch / 2, bot = cy - ch / 2;
  S.push({ part: 'body', cell: c, k: 0, x: cx - 2.0, y: cy, q: Q_UP, gates: [[cx - 2.0, top, cx - 2.0, cy + 1.28]] });
  S.push({ part: 'body', cell: c, k: 1, x: cx - 0.9, y: cy, q: Q_UP, gates: [[cx - 0.9, bot, cx - 0.9, cy - 1.28]] });
  S.push({ part: 'wing', cell: c, k: 2, x: cx + 0.1, y: cy + 1.25, q: Q_FLAT, gates: [[cx + 1.0, top, cx + 1.0, cy + 1.8]] });
  S.push({ part: 'wing', cell: c, k: 3, x: cx + 0.1, y: cy - 1.25, q: Q_FLAT, gates: [[cx + 1.1, bot, cx + 1.1, cy - 1.72]] });
  S.push({ part: 'vane', cell: c, k: 4, x: cx + 1.9, y: cy - 0.4, q: Q_EDGE, gates: [[cx + cw / 2, cy, cx + 1.92, cy]] });
});
const TIER_R = [3.3, 2.6, 1.9];
const KIND_TREE = frameKind(3, 2, (S, cx, cy, cw, ch, i, j) => {
  const r = TIER_R[i];
  S.push({ part: 'tier', cell: j, k: i, x: cx, y: cy, q: Q_FLAT, gates: [[cx, cy + ch / 2, cx, cy + r * 0.99], [cx, cy - ch / 2, cx, cy - r * 0.99]] });
});
const KIND_BEAST = frameKind(4, 2, (S, cx, cy, cw, ch, i, j) => {
  const c = i >> 1, top = cy + ch / 2, bot = cy - ch / 2;          // two beasts per frame: cells 0-1 and 2-3
  if (j === 1) S.push({ part: 'gbody', cell: c, k: i & 1, x: cx, y: cy, q: Q_ALONG, gates: [[cx - 1.2, top, cx - 1.2, cy + 0.95], [cx + 1.2, bot, cx + 1.2, cy - 0.95]] });
  else {
    for (const s of [-1, 1]) S.push({ part: 'leg', cell: c, k: 2 + (i & 1) * 2 + (s > 0 ? 1 : 0), x: cx + s * 1.5, y: cy + 1.6, q: Q_ID, gates: [[cx + s * 1.5, top, cx + s * 1.5, cy + 1.75]] });
    S.push({ part: 'ghead', cell: c, k: 6 + (i & 1), x: cx, y: cy - 0.6, q: Q_UP, gates: [[cx, bot, cx, cy - 1.75]] });
  }
});
// One frame kind as one geometry: round runners (ringed so they can flex), junction discs, tapered gates
// ending in a thin stub, dot-dash tabs, two moulded feet with draft.
function frameGeo(G, kind, rng) {
  G.part = -1;
  const r = RUN_R;
  const run = (x0, y0, x1, y1, rr, seg) => {
    const L = Math.hypot(x1 - x0, y1 - y0), prof = [[0, -rr * 0.5, 0.4]];
    for (let i = 0; i <= seg; i++) prof.push([rr, (i / seg) * L, 0]);
    prof.push([0, L + rr * 0.5, 0.4]);
    G.lathe([x0, y0, 0], [(x1 - x0) / L, (y1 - y0) / L, 0], prof, 5);
  };
  for (let i = 0; i <= kind.nx; i++) { const x = FX0 + i * kind.cw; run(x, FY0, x, FY1, (i === 0 || i === kind.nx) ? r : r * 0.8, 2); }
  for (let j = 0; j <= kind.ny; j++) { const y = FY0 + j * kind.ch; run(FX0, y, FX1, y, (j === 0 || j === kind.ny) ? r : r * 0.8, 1); }
  for (let i = 0; i <= kind.nx; i += kind.nx) for (let j = 0; j <= kind.ny; j += kind.ny) {      // ejector discs at the corners
    const x = FX0 + i * kind.cw, y = FY0 + j * kind.ch, R = r * 2.5, t = r * 1.3;
    G.lathe([x, y, 0], [0, 0, 1], [[0, -t, 0], [R, 0, 0.4], [0, t, 0]], 6);
  }
  for (const s of kind.slots) for (const g of s.gates) {
    const d = [g[2] - g[0], g[3] - g[1], 0], L = Math.hypot(d[0], d[1]);
    G.lathe([g[0], g[1], 0], d, [[r * 0.75, 0, 0], [r * 0.2, L, 1]], 3);
  }
  for (let i = 0; i < kind.nx; i++) {                                 // tabs on short stalks under the top runner
    const x = FX0 + (i + 0.5) * kind.cw + kind.cw * 0.36, y = FY1 - 0.62;
    plate(G, [[x - 0.6, y - 0.3], [x + 0.6, y - 0.3], [x + 0.6, y + 0.3], [x - 0.6, y + 0.3]], -0.05, 0.05, 0.04, 0.7);
    for (let k = 0; k < 3; k++) {
      const mx = x - 0.36 + k * 0.36;
      if (rng.chance(0.45)) G.lathe([mx - 0.11, y, 0.07], [1, 0, 0], [[0.045, 0, 0], [0.045, 0.22, 0]], 3);
      else G.lathe([mx, y, 0.04], [0, 0, 1], [[0.07, 0, 0], [0, 0.06, 0.5]], 3);
    }
  }
  G.part = 2;                                                         // feet: never swollen by the far-distance rule
  for (const fx of [-7.5, 7.5]) {
    G.m = new THREE.Matrix4().makeTranslation(fx, 0, 0).multiply(new THREE.Matrix4().makeScale(2.2, 1, 1.5));
    G.lathe([0, 0, 0], [0, 1, 0], [[0.9, 0, 0.5], [0.95, 0.12, 0.8], [0.62, 0.42, 0], [0.3, 0.9, 0], [0.12, FY0, 0]], 7);
    G.m = null;
  }
  G.part = -1;
}

// ---------------------------------------------------------------------------------------------------
// Instance batches. PartBatch: one kit part kind, every instance run by the one mechanism of PART_VERT.
const PART_ATTRS = [['iHomeP', 3], ['iHomeQ', 4], ['iDockP', 3], ['iDockQ', 4], ['iCre0', 4], ['iCre1', 4], ['iRel', 4], ['iJoint', 4], ['iCol', 3], ['iFlex', 4], ['iGap', 3]];
const FIX_ATTRS = [['iPos', 3], ['iQuat', 4], ['iCol', 3], ['iFx', 4]];
class Batch {
  constructor(attrs) { this.attrs = attrs; this.data = attrs.map(() => []); this.count = 0; }
  push(...vals) { for (let i = 0; i < vals.length; i++) { const d = this.data[i], v = vals[i]; for (let k = 0; k < v.length; k++) d.push(v[k]); } this.count++; }
  mesh(geo, material, order = 0) {
    const g = new THREE.InstancedBufferGeometry();
    g.index = geo.index; for (const k of ['position', 'normal', 'aux']) g.setAttribute(k, geo.attributes[k]);
    this.attrs.forEach(([name, n], i) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(this.data[i]), n)));
    g.instanceCount = this.count;
    const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false;
    return m;
  }
}
const qa = (q) => [q.x, q.y, q.z, q.w];
const yawQ = (a) => new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), a);

// the three kits: [sand, sea-grey, oxblood, clear, olive, pale, slate] plus the clear plastic's transmittance
const KITS = [
  { name: 'oxblood, sand, sea-grey, olive and clear amber', pal: ['#E8E0CF', '#93A6AA', '#8E3B32', '#F0A94A', '#7C8455', '#DDE9EA', '#5C6B73'],
    trA: [1.0, 0.64, 0.23], trB: [0.90, 0.40, 0.09], hot: [1.0, 0.22, 0.02], portal: '#FFF4E0' },
  { name: 'navy, bone, brick and clear smoke', pal: ['#E9E3D6', '#9AA3AE', '#2F4A78', '#8F84BE', '#B25A40', '#E2E6EA', '#4E5A6E'],
    trA: [0.64, 0.60, 0.80], trB: [0.29, 0.25, 0.47], hot: [1.0, 0.70, 0.80], portal: '#F2F6FF', land: 3.1 },      // a smoked grey-violet: a clear step deeper than the sky behind it
  { name: 'pistachio, cream, coral and clear rose', pal: ['#F1E7CE', '#A2B3AE', '#D4705C', '#F590A8', '#8FB58A', '#E6EEE6', '#5E7272'],
    trA: [1.0, 0.66, 0.74], trB: [0.90, 0.34, 0.50], hot: [1.0, 0.25, 0.4], portal: '#FFF2F0' },
];
const HOURS = [
  // the sun stands low ahead of us and a little to starboard: the starboard wall is the shadow side, the port wall the lit one,
  // every standing thing throws a long shadow toward us and the clear wings are lit through
  { name: 'raking morning sun', sun: [-0.45, 0.41, 0.79], key: '#FFE7BE', fill: '#AFC3E6', zen: '#5E93D0', hor: '#EDD3A6', glow: 1.7, fire: 0.95, shadow: 1.0, patch: 1.0, keyK: 1.08 },
  { name: 'low gold sun on the starboard bow', sun: [-0.507, 0.292, 0.811], key: '#FFD49A', fill: '#A6B4DC', zen: '#7C9CD6', hor: '#F5CDA2', glow: 2.3, fire: 1.25, shadow: 1.0, patch: 1.15, keyK: 1.32 },
  { name: 'a silver sun through sea haze', sun: [-0.38, 0.52, 0.765], key: '#FFF4DA', fill: '#A6C2D2', zen: '#6A9FB8', hor: '#CFE0CE', glow: 1.2, fire: 0.85, shadow: 0.95, patch: 0.9, keyK: 1.12 },
];

export default {
  id: 'still-on-the-sprue',
  name: 'Still on the Sprue',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = (ctx.quality && ctx.quality.detail) || 1, vary = ctx.vary || {};
    const density = clamp(vary.density || 1, 0.7, 1.3);
    // ---- the visit: kit colours, hour, weather, cast (all drawn first, in a fixed order) -----------------
    const kitI = rng.chance(0.4) ? 0 : rng.int(1, 2), kit = KITS[kitI];
    let hourI = rng.chance(0.45) ? 0 : rng.int(1, 2);
    if (vary.hour === 'day') hourI = 0; else if (vary.hour === 'golden' || vary.hour === 'dawn') hourI = 1; else if (vary.hour === 'night') hourI = 2;
    const hour = HOURS[hourI];
    const weather = rng.int(0, 2);                                   // 0 still, 1 breeze, 2 a slow fall of swarf
    const nFlyers = Math.round(lerp(110, 200, rng()) * (0.5 + 0.5 * detail));
    const nStriders = rng.int(8, 14), herd = rng.chance(0.5) ? 20 : 40, nWings = rng.chance(0.1) ? 2 : 4;
    const rare = !!vary.rare;
    const prng = rng.fork('place');
    const pal = kit.pal, C = pal.map(lin);
    const [cSand, cGrey, cOx, cClear, cOlive, cPale, cSlate] = C;
    const sunDir = V3(...hour.sun).normalize();

    const scene = new THREE.Scene();
    const horizon = pre(hour.hor), fogDen = 0.00031 * (hourI === 2 ? 1.3 : 1);
    scene.fog = new THREE.FogExp2(horizon, fogDen);                  // read by the hero's shaders; ours mix the same haze themselves
    scene.background = horizon.clone();

    // ---- shared uniforms ---------------------------------------------------------------------------------
    const key = new THREE.Color(hour.key).multiplyScalar(hour.keyK);
    const U = {
      uSun: { value: sunDir.clone() }, uKey: { value: key }, uFill: { value: new THREE.Color(hour.fill) }, uSky: { value: new THREE.Color('#D6E4EA') },
      uFogCol: { value: horizon.clone() }, uFogDen: { value: fogDen }, uPix: { value: 0.0027 }, uPx: { value: 400 },
      uU: { value: 0 }, uTime: { value: 0 }, uFlex: { value: weather === 1 ? 2.0 : 0.9 }, uScar: { value: new THREE.Color().setRGB(...mix3(cPale, [0.9, 0.88, 0.84], 0.5)) }, uPin: { value: V3(...cOx.map((v) => v * 0.85)) },
      uRareP: { value: V3(0, -500, 0) }, uRareQ: { value: new THREE.Vector4(0, 0, 0, 1) },
      uAmber: { value: new THREE.Color(pal[3]) }, uTrA: { value: V3(...kit.trA) }, uTrB: { value: V3(...kit.trB) }, uHot: { value: V3(...kit.hot) }, uFire: { value: hour.fire },
      uPale: { value: new THREE.Color(pal[5]) }, uShadow: { value: new THREE.Color('#5E76B6') }, uStrength: { value: 0.75 * hour.patch },
      uZenith: { value: pre(hour.zen) }, uHorizon: { value: horizon.clone() }, uGlow: { value: hour.glow },
      uDarkZ: { value: new THREE.Vector2(740, 1030) }, uCast: { value: hour.shadow }, uDeep: { value: V3(0.2, 0.25, 0.3) },
      uFrP: { value: V3(0, 0, 0) }, uFrX: { value: V3(1, 0, 0) }, uFrN: { value: V3(0, 0, 1) }, uHullP: { value: V3(0, 500, 0) }, uHullA: { value: V3(0, 0, 1) }, uHullK: { value: 0 }, uCam: { value: V3(0, 0, 0) }, uWind: { value: weather === 1 ? V3(-5.5, -0.5, 1.5) : weather === 2 ? V3(-0.6, -1.7, 0.2) : V3(-1.3, -0.4, 0.5) }, uBox: { value: 90 },
    };
    const matPlastic = new THREE.ShaderMaterial({ uniforms: U, vertexShader: PART_VERT, fragmentShader: PLASTIC_FRAG, side: THREE.DoubleSide });
    const matFixed = new THREE.ShaderMaterial({ uniforms: U, vertexShader: FRAME_VERT, fragmentShader: PLASTIC_FRAG, side: THREE.DoubleSide });
    const blendKeep = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
    const MUL = { ...blendKeep, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor }, ADD = { ...blendKeep, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
    // painted shadows: what is behind times the shadow colour, plus a trace of that colour back (1 - alpha of it), so that
    // shadows over shadows, or over the wall's shade, settle on a deep blue and never on black
    const SHADE = { ...blendKeep, blendSrc: THREE.OneMinusSrcAlphaFactor, blendDst: THREE.SrcColorFactor };
    await ctx.yield();

    // ---- the path: +Z is our heading; the avenue, the open floor, up to the fourth wing's hole, the dark valley
    const ZH = 730, ZS = 956;                                           // z of the Great Frame's hole; z where the last straight begins
    const path = makePath([[0, 7, 0], [0, 7, 70], [0, 7, 140], [0, 7.5, 200], [0, 8.6, 255], [0, 11, 305], [0, 19, 360], [0, 28.5, 415], [0, 34, 455], [0, 37, 490], [0, 54, 565], [0, 64, 630],
      [0, 67, 680], [0, 68, ZH], [0, 65, 772], [2, 50, 835], [10, 32, 890], [20, 19.5, 932], [28.4, 13.5, ZS], [41.3, 13, 1004.3], [56.9, 13, 1062.2], [72.4, 13, 1120.2]]);
    await ctx.yield();
    const uAtZ = (z) => clamp(path.nearestXZ(0.2589 * Math.max(0, z - 850), z).u, 0, 1);       // the u at which we pass world z
    const zU = new Float32Array(141); for (let i = 0; i <= 140; i++) zU[i] = uAtZ(i * 10);
    const uOfZ = (z) => { const f = clamp(z / 10, 0, 139.999), i = f | 0; return lerp(zU[i], zU[i + 1], f - i); };
    await ctx.yield();
    // ---- OUR LINE, AND THE AIR KEPT CLEAR ABOUT IT: the body of a flyer on its ring may not come nearer our line than
    // AIR, whatever the clock says and wherever on the line we are: a test of places, never of times, the whole ring (every
    // angle at once) against the whole line, walked every STEP metres. (A late leg's hop is keyed to the metres we have
    // flown and is asked at each metre against our place for that metre: see hopGap.) What is kept is AIR + the body's
    // own reach at its largest + EDGE (the most a walk in steps can flatter a pass). NOT ASKED HERE, and left as they
    // were: a flyer's part on its way from its frame, before the last fifth of its hop (its far end rides the ring);
    // striders, whose rings are laid far to the side of our line; the walkers and the three flyers keyed to u; the
    // tiers of trees and a grazer's body halves on their hops
    const AIR = 2.0, STEP = 0.25, EDGE = 0.05, RN = Math.ceil(path.length / STEP) + 1, RL = new Float64Array(RN * 3);
    for (let i = 0, v = V3(0, 0, 0); i < RN; i++) { path.posAtDist(Math.min(path.length, i * STEP), v); RL[i * 3] = v.x; RL[i * 3 + 1] = v.y; RL[i * 3 + 2] = v.z; }
    // how far a track (its places in P) must be carried along the way (wx, wy, wz) before every place of it stands `need`
    // from our line: each place and each step of the line bar a stretch of that way; 0 where the track is clear as dealt
    // (only the steps i0 to i1 of the line are walked: the caller knows no other step can bar the way)
    const carry = (P, need, wx, wy, wz, i0 = 0, i1 = RN) => {
      const bars = [];
      for (let k = 0; k < P.length; k += 3) for (let i = i0; i < i1;) {
        const dx = RL[i * 3] - P[k], dy = RL[i * 3 + 1] - P[k + 1], dz = RL[i * 3 + 2] - P[k + 2], b = dx * wx + dy * wy + dz * wz, c = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - b * b));
        if (c < need) { const h = Math.sqrt(need * need - c * c); if (b + h > 0) bars.push([b - h, b + h]); }
        i += Math.max(1, Math.floor((c - need) / STEP));
      }
      bars.sort((p, q) => p[0] - q[0]);
      let t = 0; for (const v of bars) { if (v[0] >= t) break; if (v[1] > t) t = v[1]; }
      return t;
    };
    await ctx.yield();

    // ---- the Great Frame: skewed 50 degrees to our line, its largest hole on the path at z 880 --------------
    const heroQ = new THREE.Quaternion().setFromUnitVectors(V3(0.643, 0, -0.766).normalize(), V3(0, 0, 1));
    const heroPos = V3(0, 0, ZH).sub(V3(40.2, 0, 0).applyQuaternion(heroQ));
    const heroInv = heroQ.clone().invert();
    const toLocal = (w) => w.clone().sub(heroPos).applyQuaternion(heroInv);
    // the hero's own timeline (U) against our u: the hull is built from u 0.30 to 0.47 on a slip that keeps about
    // 100 m ahead of us, wing four meets us at its via point, and we are in the hole as the Longwing clears the top bar
    const HU = [[0, 0], [0.29, 0.20], [uOfZ(ZH - 215), 0.515], [uOfZ(ZH - 150), 0.564], [uOfZ(ZH - 105), 0.61], [uOfZ(ZH - 70), 0.64], [uOfZ(ZH - 8), 0.682], [1, 1]];
    const heroU = (u) => { for (let i = 0; i < HU.length - 1; i++) if (u <= HU[i + 1][0]) return lerp(HU[i][1], HU[i + 1][1], (u - HU[i][0]) / Math.max(HU[i + 1][0] - HU[i][0], 1e-5)); return 1; };
    const uOfU = (U_) => { for (let i = 0; i < HU.length - 1; i++) if (U_ <= HU[i + 1][1]) return lerp(HU[i][0], HU[i + 1][0], (U_ - HU[i][1]) / Math.max(HU[i + 1][1] - HU[i][1], 1e-5)); return 1; };
    const SLIP = [[0.29, -25, 39, 436, 0.2, 0.5], [0.34, -25, 43, 460, 0.2, 0.5], [0.37, -25, 46, 485, 0.2, 0.5], [0.40, -25, 49, 518, 0.2, 0.5], [0.43, -27, 54, 556, 0.2, 0.45], [0.46, -35, 63, 618, 0.12, 0.25], [0.48, -42, 70, 665, 0.05, 0.1], [0.50, -47.4, 75, 705.8, 0, 0]];
    const viaT = V3(0, 0, 0);
    const hero = await buildHero(ctx, {
      palette: pal, detail, wings: nWings, sunDir: sunDir.clone().applyQuaternion(heroInv),
      slip: SLIP.map((k) => [heroU(k[0]), ...toLocal(V3(k[1], k[2], k[3])).toArray(), k[4], k[5]]),
      partVia: (kind, i, side, Uvia, home) => {                         // where a part is half way through its hop: off our bow
        const uv = uOfU(Uvia), c = path.pointAt(uv); viaT.copy(path.pointAt(Math.min(1, uv + 0.004))).sub(c).normalize();
        if (kind === 'shell') return toLocal(c.addScaledVector(viaT, 46).add(V3(8 + 4 * Math.sin(i * 1.7) + side * 3, 9 + 2 * (i % 3), 0))).toArray();
        return toLocal(c.addScaledVector(viaT, 15 + (i % 3)).add(V3(4 + (i % 2), clamp((home.y - c.y) * 0.25, -4, 5) + 2, 0))).toArray();   // the last links: 15 m ahead, a little to port
      },
      // it lifts with the beat and clears the top bar well to starboard, where the Frame stands furthest from us, so at
      // u 0.60 we look up at its wings over the bar; then a second act down the dark valley, keyed to our u: it leads
      // us at half the frame's width (0.70), swings out over the starboard benches and lets us draw level (0.79),
      // dives across our bow over the last rows (0.88) and climbs away over the ring: [u, world x, y, z]
      flight: [[0.625, 61, 75, 49], [0.637, 66, 108, 40], [0.647, 76, 142, 15], [0.6565, 95, 152, 0],
        ...[[0.618, -58, 147, 797], [0.632, -52, 139, 838], [0.66, -22, 110, 886], [0.70, 14, 66, 925], [0.745, -40, 45, 956], [0.79, -32, 33, 990],
          [0.84, 22, 32, 1046], [0.88, 64, 30, 1102], [0.94, 92, 76, 1205], [1.0, 125, 170, 1330]]
          .map((f) => [heroU(f[0]), ...toLocal(V3(f[1], f[2], f[3])).toArray()])],
    });
    hero.object.position.copy(heroPos); hero.object.quaternion.copy(heroQ);
    scene.add(hero.object);
    hero.setSun(sunDir, key, U.uFill.value);
    hero.uniforms.uTrA.value.copy(U.uTrA.value); hero.uniforms.uTrB.value.copy(U.uTrB.value); hero.uniforms.uHot.value.copy(U.uHot.value);
    hero.uniforms.uFire.value = hour.fire; hero.uniforms.uFlex.value = weather === 1 ? 1.8 : 1.0;
    const toWorld = (l) => l.clone().applyQuaternion(heroQ).add(heroPos);
    U.uFrP.value.copy(heroPos); U.uFrX.value.set(1, 0, 0).applyQuaternion(heroQ); U.uFrN.value.set(0, 0, 1).applyQuaternion(heroQ);
    const dockW = toWorld(hero.anchors.dock.position), holeW = toWorld(hero.anchors.hole.position);
    const frameA = toWorld(V3(-112, 0, 0)), frameB = toWorld(V3(112, 0, 0));
    const flightW = hero.anchors.flight.map((f) => [f.u, toWorld(f.position)]), gazeV = V3(0, 0, 0);
    const longwingAt = (U_) => {                                       // roughly where the Longwing is at hero time U_
      if (hero.bodyAt(U_, gazeV)) return gazeV.applyQuaternion(heroQ).add(heroPos);
      const n = flightW.length - 1; if (U_ <= flightW[0][0]) return gazeV.copy(flightW[0][1]); if (U_ >= flightW[n][0]) return gazeV.copy(flightW[n][1]);
      for (let i = 0; i < n; i++) if (U_ < flightW[i + 1][0]) return gazeV.lerpVectors(flightW[i][1], flightW[i + 1][1], (U_ - flightW[i][0]) / (flightW[i + 1][0] - flightW[i][0]));
      return gazeV;
    };
    await ctx.yield();

    // ---- the ground: one vacuum-formed shell from a height function. The valley sides are five moulded shells a
    // side: a steep riser, a pale lip, a gently sloping tread. Their edges are sums of sines, so the fragment
    // shader (shellE in GROUND_FRAG, the same formula) knows exactly where each lip runs ----------------------
    const noise = ctx.noise;
    const riverX = (z) => 37 + 15 * Math.sin(z * 0.011 + 1.0) + 6 * Math.sin(z * 0.029);
    const riverK = (z) => smoothstep(150, 235, z) * (1 - smoothstep(560, 640, z));
    const valleyC = (z) => 0.2589 * Math.max(0, z - 850);
    const halfW = (z) => lerp(250, 105, smoothstep(760, 1090, z));
    const segDist = (x, z, a, b) => {
      const ex = b.x - a.x, ez = b.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez), 0, 1);
      return Math.hypot(x - a.x - ex * t, z - a.z - ez * t);
    };
    // a second reach of the moulded river winds down the dark valley to starboard of our line
    const riverX2 = (z) => valleyC(z) - 37 - 9 * Math.sin(z * 0.013 + 2.0);
    const riverK2 = (z) => smoothstep(ZH + 45, ZH + 120, z) * (1 - smoothstep(1190, 1270, z));
    const riverAt = (x, z) => Math.max(riverK(z) * (1 - smoothstep(8.5, 13.5, Math.abs(x - riverX(z)))), riverK2(z) * (1 - smoothstep(6.5, 10.5, Math.abs(x - riverX2(z)))));
    const SHELL_H = [18, 24, 27, 30, 14];
    const shellW = (w) => Math.max(w * 0.04, 5);
    const shellE = (k, z, w, s) => Math.max(w * 0.44, 58) + k * Math.max(w * 0.15, 19) + Math.max(w * 0.04, 4.5) * (Math.sin(z * 0.0105 + k * 2.1 + s * 1.3) + 0.6 * Math.sin(z * 0.0231 + k * 4.3 + 1.0 - s * 0.7));
    function ground(x, z) {
      const cx = valleyC(z), s = x >= cx ? 1 : -1, dx = Math.abs(x - cx), w = halfW(z);
      let h = 1.2 + 0.9 * noise.fbm2(x * 0.011, z * 0.011, 3) + 0.5 * Math.sin(x * 0.047 + z * 0.021) * Math.sin(z * 0.033);
      const e0 = shellE(0, z, w, s);
      if (dx > e0) {
        const rw = shellW(w), e4 = shellE(4, z, w, s) + rw;
        h += 0.055 * (Math.min(dx, e4) - e0) - 0.12 * Math.max(0, dx - e4);                 // treads tip a little inward; the land falls away behind the last lip
        for (let k = 0; k < 5; k++) h += SHELL_H[k] * (1 + 0.14 * Math.sin(z * 0.0068 + k * 1.7 + s * 2.0)) * smoothstep(0, rw, dx - shellE(k, z, w, s));
      }
      h = lerp(0.25, h, smoothstep(14, 55, dx));                                   // the flat floor under our line
      h = lerp(0, h, smoothstep(9, 42, segDist(x, z, frameA, frameB)));            // and under the Great Frame's feet
      h -= 1.7 * riverAt(x, z);
      return h;
    }
    // the land's own plastic: the brief's sea-grey, a step deeper and greener so the sunlit floor lands on it after the tone map
    const sat3 = (c, k) => { const l = 0.3 * c[0] + 0.55 * c[1] + 0.15 * c[2]; return c.map((v) => Math.max(0, l + (v - l) * k)); };
    const cFloor = preLin(sat3(cGrey.map((v) => v * 0.62), kit.land || 2.3).map((v, i) => v * [1, 1.03, 0.95][i])).map((v) => v / 0.94);
    const cDeep = sat3(cSlate.map((v) => v * 0.86), 1.3);
    U.uDeep.value.set(...sat3(cSlate.map((v) => v * 0.62), 1.5));
    const G0 = new Geo();
    {
      const NX = 112, NZ = 112, base = G0.count;
      // columns follow the shells: three ride each riser (foot, middle, lip) down the whole valley and two cross each
      // tread, so every step is a clean extruded wall instead of a saw cut by the grid; [column, metres from centre]
      const HX = NX / 2, lat = new Float32Array(HX + 1);
      const knots = (z, w, sd) => {
        const rw = shellW(w), e0 = shellE(0, z, w, sd), kn = [[0, 0], [14, Math.min(w * 0.2, e0 * 0.5)]];
        for (let k = 0; k < 5; k++) { const e = Math.max(shellE(k, z, w, sd), kn[kn.length - 1][1] + 1.5); kn.push([22 + k * 5, e], [24 + k * 5, e + rw]); }
        const eo = kn[kn.length - 1][1];
        for (let i = 1; i <= HX - 44; i++) kn.push([44 + i, lerp(eo, 470, Math.pow(i / (HX - 44), 1.7))]);
        return kn;
      };
      for (let j = 0; j <= NZ; j++) {
        const z = -180 + (j / NZ) * 1760, cx = valleyC(z), w = halfW(z);
        const dark = 0.92 * smoothstep(ZH - 260, ZH + 300, z), col = mix3(cFloor, cDeep, dark);
        for (let i = 0; i <= NX; i++) {
          const sd = i >= HX ? 1 : -1, c = Math.abs(i - HX);
          if (i === 0 || i === HX) { const kn = knots(z, w, sd); for (let q = 0; q < kn.length - 1; q++) for (let m = kn[q][0]; m <= kn[q + 1][0]; m++) lat[m] = lerp(kn[q][1], kn[q + 1][1], (m - kn[q][0]) / (kn[q + 1][0] - kn[q][0])); }
          const x = cx + sd * lat[c], h = ground(x, z);
          G0.P.push(x, h, z); G0.C.push(col[0], col[1], col[2]);
          G0.A.push(clamp(0.05 + 0.05 * noise.n2(x * 0.02, z * 0.02), 0, 1) * (1 - dark * 0.85), riverAt(x, z));
        }
        await ctx.yield();
      }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = base + j * (NX + 1) + i; G0.quad(a, a + NX + 1, a + NX + 2, a + 1); }
      await ctx.yield();
      // five far shells beyond the portal, stepping to slate: the calm dark quarter the exit is read against
      for (let k = 0; k < 5; k++) {
        const z0 = 1270 + k * 105, hk = 62 + k * 34, col = mix3(mix3(cFloor, cDeep, 0.8), cDeep.map((v) => v * 0.8), k / 4), b = G0.count, NS = 44, rows = [[0, -6, 0.04], [0.55, 10, 0.08], [0.9, 30, 0.14], [1, 58, 0.5], [0.86, 95, 0.2]];
        for (let r = 0; r < rows.length; r++) for (let i = 0; i <= NS; i++) {
          const x = -520 + (i / NS) * 1180, hh = hk * (0.62 + 0.38 * noise.n2(x * 0.0035 + k * 9.1, k * 3.3) + 0.12 * noise.n2(x * 0.011, k * 5.7)) * (0.55 + 0.45 * smoothstep(0, 260, Math.abs(x - 95 - k * 12)));
          G0.P.push(x, rows[r][0] * hh + (r ? 0 : -6), z0 + rows[r][1]); G0.C.push(col[0], col[1], col[2]); G0.A.push(rows[r][2], -1);
        }
        for (let r = 0; r < rows.length - 1; r++) for (let i = 0; i < NS; i++) { const a = b + r * (NS + 1) + i; G0.quad(a, a + NS + 1, a + NS + 2, a + 1); }
      }
    }
    await ctx.yield();
    const groundMesh = new THREE.Mesh(await G0.buildSteps(ctx), new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG }));
    groundMesh.frustumCulled = false; groundMesh.matrixAutoUpdate = false; scene.add(groundMesh);
    await ctx.yield();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 24, 12), new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ---- the land's own sprue: the top shell of each valley side still hangs from a great round runner that
    // stands along the skyline behind its lip, a tapered gate down to the lip every 52 m, an ejector disc at
    // every other junction (one merged mesh in world space) --------------------------------------------------
    const Gls = new Geo(); Gls.part = 2;
    for (const s of [1, -1]) {
      const lipAt = (z) => { const w = halfW(z), rw = shellW(w), e4 = shellE(4, z, w, s), cx = valleyC(z), lx = cx + s * (e4 + rw * 0.95); return [lx, ground(lx, z), z, cx + s * (e4 + rw + 16)]; };
      const KN = 208, RY = 152;
      for (let z0 = -170; z0 < 1270; z0 += KN) {
        if (s < 0 && z0 > 420 && z0 < 880) continue;                      // none to starboard behind the dock: the Longwing is read against clean hills there
        const a = lipAt(z0), b = lipAt(z0 + KN), pa = [a[3], RY, z0], pb = [b[3], RY, z0 + KN];
        Gls.rod(pa, pb, 3.3, 6);
        Gls.lathe(pa, [0, 0, 1], [[0, -2.8, 0], [6.0, -2.0, 0.4], [6.0, 2.0, 0.4], [0, 2.8, 0]], 10);                 // ejector disc at each knot
        Gls.lathe(pa, [0, 1, 0], [[2.6, 0, 0], [2.2, 9, 0], [1.2, 12, 1], [0, 12.6, 1]], 7);                            // and the stub of a runner that was clipped away
        for (const t of [0.27, 0.76]) {                                   // two tapered gates a run, down to the lip of the top shell
          const z = z0 + t * KN, l = lipAt(z), pt = [lerp(pa[0], pb[0], t), RY, z], d = [l[0] - pt[0], l[1] - pt[1], 0], L = Math.hypot(d[0], d[1]);
          Gls.lathe(pt, d, [[3.4, 0, 0], [2.6, L * 0.3, 0], [1.3, L * 0.8, 0.3], [0.8, L + 0.8, 1]], 6);
        }
        {                                                                 // a tab on a short stalk under the runner: dots and dashes, no words
          const t = 0.52, tx = lerp(pa[0], pb[0], t), tz = z0 + t * KN, yawT = Math.atan2(pb[0] - pa[0], KN);
          Gls.rod([tx, RY, tz], [tx, RY - 7, tz], 1.1, 6);
          Gls.m = new THREE.Matrix4().makeTranslation(tx, RY - 12.5, tz).multiply(new THREE.Matrix4().makeRotationY(yawT - Math.PI / 2));
          plate(Gls, roundRect(0, 0, 30, 11, 1.6, 2), -0.9, 0.9, 0.6, 0.7);
          for (let k = 0; k < 4; k++) for (const fz of [-1, 1]) { const mx = -10.5 + k * 7; if ((k + (z0 / KN | 0) + (s > 0 ? 1 : 0)) % 3) Gls.rod([mx - 2, 0, fz * 1.0], [mx + 2, 0, fz * 1.0], 1.0, 4); else Gls.lathe([mx, 0, fz * 0.8], [0, 0, fz], [[1.7, 0, 0], [0, 1.1, 0.5]], 5); }
          Gls.m = null;
        }
      }
      await ctx.yield();
    }
    const landSprue = new Batch(FIX_ATTRS); landSprue.push([0, 0, 0], [0, 0, 0, 1], mix3(cFloor, cDeep, 0.4), [0, 9, 0, 1]);

    // ---- batches and placement helpers ---------------------------------------------------------------------
    const FR = { fly: new Batch(FIX_ATTRS), tree: new Batch(FIX_ATTRS), beast: new Batch(FIX_ATTRS) };
    const KINDS = { fly: KIND_FLY, tree: KIND_TREE, beast: KIND_BEAST };
    const PB = {}; for (const k of ['body', 'wing', 'vane', 'trunk', 'tier', 'gbody', 'leg', 'reed', 'ebody', 'ewing', 'evane']) PB[k] = new Batch(PART_ATTRS);
    const PBA = new Batch(PART_ATTRS);                                  // clear parts (the rare second creature's wings)
    const logs = [new Batch(FIX_ATTRS), new Batch(FIX_ATTRS)];
    const shadows = { p: [], s: [], o: [], n: 0 };
    const shadow = (x, y, z, sx, sz, rot, k, orb) => { shadows.p.push(x, y, z); shadows.s.push(sx, sz, rot, k * hour.shadow); shadows.o.push(...(orb || [0, 0, 0, 0])); shadows.n++; };
    const bigPuffs = [];                                                // where a toppling frame lands
    const puffs = [];                                                   // [x, y, z, u0, size] where a part snaps free near our line
    const QX = new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), -Math.PI / 2 * 0.985);
    const frameList = [];
    function addFrame(kind, x, z, yaw, col, o = {}) {
      const sc = o.scale || 1, y = ground(x, z) - 0.12 * sc + (o.lie ? 0.3 * sc : 0);
      const q = yawQ(yaw); if (o.lie) q.multiply(QX); if (o.lean) q.multiply(new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), -o.lean));
      const phase = prng.range(0, TAU);
      FR[kind].push([x, y, z], qa(q), col, [phase, o.topple ?? 9, o.lie || o.lean ? 0 : 1, sc]);
      const n = V3(0, 0, 1).applyQuaternion(q);
      if (o.lie) shadow(x - Math.sin(yaw) * 8 * sc, y - 0.2, z - Math.cos(yaw) * 8 * sc, 15 * sc, 11 * sc, yaw, 0.7);
      else if (o.topple === undefined) shadow(x, y + 0.2, z, 13.5 * sc, 2.6 * sc, yaw, 0.8);
      else shadow(x + Math.sin(yaw) * 8 * sc, o.topple + 0.05, z + Math.cos(yaw) * 8 * sc, 14 * sc, 10 * sc, yaw, -0.5);   // appears as it lands
      if (o.topple !== undefined) bigPuffs.push([x + Math.sin(yaw) * 9 * sc, y + 1.2, z + Math.cos(yaw) * 9 * sc, o.topple + 0.052, 5 * sc]);
      const fr = { kind, pos: V3(x, y, z), q, sc, lie: !!o.lie, nx: n.x, nz: n.z, phase, col, yaw, stand: !o.lie && o.topple === undefined, lean: o.lean || 0 };
      frameList.push(fr); return fr;
    }
    const _h = V3(0, 0, 0);
    // hang one part: slot on a frame -> dock pose in a creature (cre0, cre1), released at u0 over du
    function partArgs(fr, slot, dockP, dockQ, cre0, cre1, u0, du, joint, col, scale = 1, gap = [0, 0, 0], twist = 0.45, hop = 0.22) {
      let hp = [0, 0, 0], hq = [0, 0, 0, 1], flex = [scale, 0, 0, 0];
      if (fr) {
        _h.set(slot.x * fr.sc, slot.y * fr.sc, 0).applyQuaternion(fr.q).add(fr.pos);
        hp = [_h.x, _h.y, _h.z]; hq = qa(fr.q.clone().multiply(slot.q));
        const l = Math.hypot(fr.nx, fr.nz);
        flex = fr.lie || l < 0.2 ? [scale, 0, fr.phase, fr.pos.y] : [fr.nx / l * scale, fr.nz / l * scale, fr.phase, fr.rigid ? 1e4 : fr.pos.y];
        if (u0 > 0 && u0 < 1 && path.distanceTo(_h.x, _h.y, _h.z) < 70) puffs.push([_h.x, _h.y, _h.z, u0, scale]);
      }
      return [hp, hq, dockP, dockQ, cre0, cre1, [u0, du, twist, hop], joint, col, flex, gap];
    }
    const hang = (part, ...a) => PB[part].push(...partArgs(...a));
    const SEATED = -1;
    const NOJ = [0, 0, 0, 0], QI = [0, 0, 0, 1];
    const QFLIP = qa(new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), Math.PI)), QTURN = qa(yawQ(Math.PI));

    // A FLYER'S RING IS TESTED WHOLE: its track at every angle (centre, two radii, the bob that rides the angle) against
    // the whole of our line. One that comes within AIR + its reach + EDGE keeps its radii, speed and phase and is LIFTED
    // bodily, straight up, by the least height that clears every place of it (height can always clear a ring, so none is
    // moved sideways): it flies the ring it was dealt, higher. A flyer's reach is its wing tip at the top of its beat,
    // 2.42 x its size from its middle; while it is put together in flight its parts stand off by their gaps as they
    // close, 3.53 x its size, and a ring whose flyer is put together in flight is asked with that larger reach for good.
    // (First the steps of our line that lie within `need` of the ring's box in plan are found, by every COARSE-th step
    // with the metres between allowed for, COARSE / 2 steps either side of each: our line ends fewer steps than that
    // after its last COARSE-th step. A ring with none is clear as dealt, and a lift is barred by no other step.)
    const FLY_BUILT = 2.42, FLY_OPEN = 3.53, COARSE = 16;
    function clearRing(c0, c1, reach) {
      const need = AIR + reach + EDGE, far = need + COARSE * STEP / 2; let i0 = RN, i1 = 0;
      for (let i = 0; i < RN; i += COARSE) if (Math.abs(RL[i * 3] - c0[0]) < c1[0] + far && Math.abs(RL[i * 3 + 2] - c0[2]) < c1[1] + far) { i0 = Math.min(i0, i - COARSE); i1 = i + COARSE + 1; }
      if (i1 === 0) return;                                             // no step of our line near its box: clear as dealt
      i0 = Math.max(0, i0); i1 = Math.min(RN, i1);
      const n = Math.ceil(TAU * (Math.max(c1[0], c1[1]) + 2 * c0[3]) / STEP), P = new Float64Array(n * 3);
      for (let k = 0; k < n; k++) { const a = (k / n) * TAU; P[k * 3] = c0[0] + Math.cos(a) * c1[0]; P[k * 3 + 1] = c0[1] + c0[3] * Math.sin(a * 2 + c1[3] * 3); P[k * 3 + 2] = c0[2] + Math.sin(a) * c1[1]; }
      const up = carry(P, need, 0, 1, 0, i0, i1);
      if (up === 0) return;                                             // clear as dealt: left exactly as dealt
      c0[1] += up;
    }
    // ---- flyers: five parts each, hung in a cell of a flyer frame, flocking on an elliptical beat -------------
    const flyCols = [cSand, cOx, mix3(cGrey, cPale, 0.25)];
    let flyersMade = 0;
    function flyer(fr, cell, orbit, u0, sc, keyed, rich = !!keyed) {
      const S = KIND_FLY.slots, b = cell * 5, col = fr ? fr.col : prng.pick(flyCols);
      const ph = orbit.ph + prng.range(-0.5, 0.5), k = prng.range(0.82, 1.15);
      const cre0 = keyed ? keyed[0] : [orbit.x + prng.range(-3, 3), orbit.y + prng.range(-2.5, 2.5), orbit.z + prng.range(-3, 3), orbit.bob];
      const cre1 = keyed ? keyed[1] : [orbit.rx * k, orbit.rz * k, orbit.sp * prng.range(0.92, 1.08), ph];
      if (!keyed && u0 < 1) clearRing(cre0, cre1, sc * (u0 < 0 ? FLY_BUILT : FLY_OPEN));   // a ring that is flown (one never let off its frame flies none)
      const beat = [1, 0.55, prng.range(6.5, 8.5), prng.range(0, TAU)], g = 0.5 * sc;
      const E = rich ? 'e' : '', colB = rich ? flyCols[(flyCols.indexOf(col) + 1) % 3] : col, colW = rich ? flyCols[(flyCols.indexOf(col) + 2) % 3] : col;   // seen close: a part from each plastic
      hang(E + 'body', fr, S[b], [0, 0, 0], QI, cre0, cre1, u0, 0.03, NOJ, col, sc, [g, 0, 0]);
      hang(E + 'body', fr, S[b + 1], [0, 0, 0], QFLIP, cre0, cre1, u0 + 0.004, 0.03, NOJ, colB, sc, [-g, 0, 0]);
      hang(E + 'wing', fr, S[b + 2], [0.32 * sc, 0.12 * sc, 0.1 * sc], QI, cre0, cre1, u0 + 0.011, 0.03, beat, colW, sc, [g * 2, g, 0], -0.5);
      hang(E + 'wing', fr, S[b + 3], [-0.32 * sc, 0.12 * sc, 0.1 * sc], QTURN, cre0, cre1, u0 + 0.015, 0.03, beat, colW, sc, [-g * 2, g, 0], -0.5);
      hang(E + 'vane', fr, S[b + 4], [0, 0.3 * sc, -1.05 * sc], QI, cre0, cre1, u0 + 0.02, 0.03, NOJ, colB, sc, [0, g, -g * 2], 0.6);
      flyersMade++;
    }
    // the avenue: twelve frames a side, turned like vineyard rows so their faces meet us
    const avenue = [];
    for (let i = 0; i < 12; i++) for (const s of [1, -1]) {
      const z = 14 + i * 16.5 + (s > 0 ? 0 : 5), x = s * 24.5;
      const fr = addFrame('fly', x, z, Math.PI + s * 0.72, flyCols[(i * 2 + (s > 0 ? 0 : 1) + kitI) % 3]);
      avenue.push(fr);
    }
    await ctx.yield();
    const perFrame = clamp(Math.round((nFlyers - 60) / 24), 3, 4);
    for (let f = 0; f < avenue.length; f++) {
      const fr = avenue[f], s = fr.pos.x > 0 ? 1 : -1, cross = (f % 3) !== 2;
      const rx = cross ? prng.range(22, 34) : prng.range(9, 14), cy = cross ? prng.range(19, 27) : prng.range(9, 20);
      const orbit = { x: cross ? s * prng.range(2, 12) : s * (rx + 11 + prng.range(0, 8)), y: cy, z: fr.pos.z + prng.range(25, 60), rx, rz: prng.range(26, 48), sp: s * prng.range(0.3, 0.42), ph: prng.range(0, TAU), bob: prng.range(1.5, 3) };
      const cells = prng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      const zu = fr.pos.z - prng.range(55, 85);
      for (let c = 0; c < perFrame; c++) flyer(fr, cells[c], orbit, zu < 0 ? SEATED - c : uOfZ(zu) + 0.004 + c * 0.006, 1);
      await ctx.yield();
    }
    await ctx.yield();
    // the last rows: small frames 9 m either side of the final straight, flyers still assembling
    const endDir = V3(0.2589, 0, 0.9659), endRight = V3(-0.9659, 0, 0.2589), endYaw = Math.atan2(endDir.x, endDir.z);
    for (let i = 0; i < 6; i++) for (const s of [1, -1]) {
      const d = ZS + 12 + i * 24 + (s > 0 ? 0 : 9), lat = s * 15.5;
      const x = 28.4 + 0.268 * (d - ZS) + endRight.x * lat, z = d + endRight.z * lat;
      const fr = addFrame('fly', x, z, endYaw + Math.PI - s * 0.8, flyCols[(i + (s > 0 ? 1 : 0) + kitI) % 3], { scale: 0.6 });
      const rx = prng.range(7, 11), lat2 = s * (rx + 13 + prng.range(0, 10)), dd = d + prng.range(25, 50);
      const orbit = { x: 28.4 + 0.268 * (dd - ZS) + endRight.x * lat2, y: prng.range(9, 24), z: dd + endRight.z * lat2, rx, rz: prng.range(14, 24), sp: s * prng.range(0.4, 0.55), ph: prng.range(0, TAU), bob: 1.5 };
      const cells = prng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      for (let c = 0; c < 4; c++) flyer(fr, cells[c], orbit, uOfZ(d - prng.range(60, 95)) + c * 0.007, 0.6);
      await ctx.yield();
    }
    await ctx.yield();

    // loose flocks already built, beating up and down the open floor and the dark valley
    for (let i = 0; i < Math.min(10, Math.round(9 * density)); i++) {
      const z = 235 + i * 76 + prng.range(-20, 20), side = (i % 2) ? 1 : -1, rx = prng.range(12, 20), rz = prng.range(22, 40);
      const x = valleyC(z) + side * (rx * 1.15 + 12 + prng.range(0, 10)), py = path.nearestXZ(valleyC(z), z).y;
      if (segDist(x, z, frameA, frameB) < Math.max(rx, rz) + 12 || Math.hypot(x - dockW.x, z - dockW.z) < 95) continue;
      const orbit = { x, y: Math.max(12, py + prng.range(-10, 12)), z, rx, rz, sp: side * prng.range(0.26, 0.4), ph: prng.range(0, TAU), bob: 3 };
      for (let c = 0; c < 4; c++) flyer(null, 0, orbit, SEATED, prng.range(1.3, 1.7) * (z > ZH ? 1.4 : 1));
      await ctx.yield();
    }
    for (const [ox, oy, oz, rx, rz, n] of [[0, 14, 128, 13, 64, 7], [0, 21, 285, 24, 62, 12], [18, 39, 395, 22, 50, 9]]) {   // the first ring beats low round our own line down the avenue
      const orbit = { x: ox, y: oy, z: oz, rx, rz, sp: (ox ? -1 : 1) * prng.range(0.3, 0.38), ph: 0, bob: 2.5 }, nn = Math.round(n * (0.5 + 0.5 * detail));
      for (let c = 0; c < nn; c++) { orbit.ph = (c / nn) * TAU + prng.range(-0.2, 0.2); flyer(null, 0, orbit, SEATED, prng.range(1.35, 1.75), null, oz < 300); await ctx.yield(); }   // the two rings that cross our bow early are the detailed three-plastic birds
      await ctx.yield();
    }
    // three that lead us from the first frame, a little slower than we fly, so we close on them over the open floor
    // and draw level on the climb to the dock; keyed to u like the walkers: [u, x, y, z at that u, size]
    for (const [uk, x, y, z, sc] of [[0.31, -11, 15, 377, 1.9], [0.31, 8, 18.5, 375, 1.8], [0.31, -17, 22.5, 392, 1.3]]) {
      flyer(null, 0, { ph: 0 }, SEATED, sc, [[x, y, z, -0.03], [0, 800, uk, 0.12]]);
    }
    await ctx.yield();
    // ---- striders: 9 m tall on four stilt legs, each walking its own elliptical beat on the valley floor -----
    const rings = [];                                                   // [cx, cz, rx, rz]: kept clear of trees and frames
    const ringClear = (x, z, r) => { for (const o of rings) { const rr = Math.hypot((x - o[0]) / o[2], (z - o[1]) / o[3]); if (Math.abs(rr - 1) * Math.min(o[2], o[3]) < r + 4) return false; } return true; };
    const occupied = [];                                                 // [x, z, r] of frames, trees and herds
    const free = (x, z, r) => { for (const o of occupied) if (Math.hypot(x - o[0], z - o[1]) < r + o[2]) return false; return ringClear(x, z, r); };
    for (const fr of frameList) occupied.push([fr.pos.x, fr.pos.z, 14 * fr.sc]);
    // ---- great sheets: flyer frames twice the size and still full, standing about the floor in the kit's strong
    // colours; their big flyers snap out as we near and turn in a slow ring above them ------------------------
    const sheetCols = [cSand, cOlive, mix3(cGrey, cPale, 0.25), cOlive, cSand];   // never the Great Frame's own plastic: it stays the one big frame of its colour
    let sheets = 0;
    const treeColB = mix3(cOlive, cSand, 0.3);
    const berths = [[1, 250, 66, 2.0], [1, 338, 80, 2.3], [-1, 486, 78, 2.2], [1, 446, 70, 1.9], [-1, 548, 84, 2.4], [1, 540, 74, 2.1], [-1, 628, 78, 1.8], [1, 820, 40, 1.3], [1, 890, 42, 1.4], [-1, 960, 46, 1.25]];
    for (let i = 0; i < berths.length; i++) {
      const [side, zb, lat, sc] = berths[i];
      for (let t = 0; t < 8; t++) {
        const z = zb + prng.range(-14, 14), x = valleyC(z) + side * (lat + prng.range(-5, 7)), yaw = Math.PI + side * prng.range(0.55, 0.95);
        if (!free(x, z, 12 * sc) || riverAt(x, z) > 0.02 || riverAt(x - side * 9 * sc, z) > 0.02 || segDist(x, z, frameA, frameB) < 18 * sc || Math.hypot(x - dockW.x, z - dockW.z) < 66) continue;
        const fr = addFrame('fly', x, z, yaw, sheetCols[(i + kitI) % 5], { scale: sc });
        occupied.push([x, z, 13 * sc]);
        const rx = prng.range(16, 24), orbit = { x: x - side * prng.range(8, 20), y: prng.range(30, 46), z: z + prng.range(20, 50), rx, rz: prng.range(26, 40), sp: side * prng.range(0.22, 0.3), ph: prng.range(0, TAU), bob: 3 };
        const cells = prng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), nc = Math.round(5 * (0.6 + 0.4 * detail)), zu = uOfZ(z - prng.range(100, 150));
        for (let c = 0; c < nc; c++) flyer(fr, cells[c], orbit, c < 3 ? zu + c * 0.012 : 9 + c, sc * 0.9);
        sheets++; break;
      }
      await ctx.yield();
    }
    await ctx.yield();
    // the dark valley's benches are shelves of the same kit: great part frames stand along the first two treads either
    // side, some still holding parts, two emptied and fallen back against the riser behind: [side, z, bench, kind, size, lean]
    const benchLat = (k, z, side, t) => { const w = halfW(z); return lerp(shellE(k, z, w, side) + shellW(w), shellE(k + 1, z, w, side), t); };
    const benchFrames = [[1, 878, 0, 'tree', 2.5, 0], [1, 962, 1, 'beast', 2.3, 0.5], [1, 1038, 0, 'fly', 1.7, 0], [-1, 905, 0, 'fly', 2.4, 0], [-1, 988, 1, 'tree', 2.2, 0.48], [-1, 1062, 0, 'beast', 1.7, 0]];
    for (let i = 0; i < benchFrames.length; i++) {
      const [side, z, k, kind, sc, lean] = benchFrames[i], x = valleyC(z) + side * benchLat(k, z, side, lean ? 0.62 : 0.42);
      const fr = addFrame(kind, x, z, -side * Math.PI / 2 + 0.25 + (i % 2 ? 0.14 : -0.1), sheetCols[(i + 1 + kitI) % 5], lean ? { scale: sc, lean } : { scale: sc });
      occupied.push([x, z, 12 * sc]);
      if (kind === 'tree') for (const c of lean ? [1, 5] : [0, 1, 2, 4]) hang('tier', fr, KIND_TREE.slots[c], [0, 0, 0], QI, [0, -400, 0, 0], [0, 0, 0, 0], 9, 0.01, [4, 0, 0, 0], treeColB, TIER_R[c % 3] * sc, [0, 0, 0], 0.5);
      if (kind === 'fly' && sc > 2) { const cells = prng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]); for (let c = 0; c < 3; c++) flyer(fr, cells[c], { x, y: 60, z, rx: 10, rz: 10, sp: 0.3, ph: 0, bob: 1 }, 9 + c, sc * 0.9); }
    }
    rings.push([valleyC(860) - 38, 860, 14, 24]);                       // one beside our line in the dark valley
    for (let i = 5, tries = 0; i < nStriders && tries < 200; tries++) {
      const z = prng.range(250, 1070), side = prng.chance(0.5) ? 1 : -1, rx = prng.range(18, 30), rz = prng.range(26, 60);
      const x = valleyC(z) + side * (rx + prng.range(26, 50));
      if (Math.abs(x - valleyC(z)) + rx > halfW(z) * 0.4 || segDist(x, z, frameA, frameB) < Math.max(rx, rz) + 12) continue;
      if (Math.hypot(x - dockW.x, z - dockW.z) < Math.max(rx, rz) + 30) continue;
      let ok = true; for (const o of rings) if (Math.hypot(x - o[0], z - o[1]) < Math.max(rx, rz) + Math.max(o[2], o[3]) + 6) ok = false;
      for (const o of occupied) if (Math.abs(Math.hypot((o[0] - x) / rx, (o[1] - z) / rz) - 1) * Math.min(rx, rz) < o[2] + 5) ok = false;
      if (!ok) continue;
      rings.push([x, z, rx, rz]); i++;
    }
    const striderCols = [cSand, cOx, mix3(cGrey, cPale, 0.25)];
    function strider(cre0, cre1, v, ph) {
      const om = TAU * v / 10.9, ca = prng.int(0, 2), cb = (ca + prng.int(1, 2)) % 3;
      hang('gbody', null, null, [0, 0, 0], QI, cre0, cre1, SEATED, 0.01, NOJ, striderCols[ca], 1.3);
      hang('gbody', null, null, [0, 0, 0], QFLIP, cre0, cre1, SEATED, 0.01, NOJ, striderCols[cb], 1.3);
      hang('gbody', null, null, [0, 1.0, 4.0], QI, cre0, cre1, SEATED, 0.01, NOJ, striderCols[cb], 0.5);
      hang('gbody', null, null, [0, 1.0, 4.0], QFLIP, cre0, cre1, SEATED, 0.01, NOJ, striderCols[ca], 0.5);
      for (let l = 0; l < 4; l++) {
        const sx = l & 1 ? 1 : -1, sz = l & 2 ? 1 : -1;
        hang('leg', null, null, [sx * 1.05, -0.25, sz * 2.1], sx > 0 ? QI : QTURN, cre0, cre1, SEATED, 0.01, [2, 0.4, om, (sz > 0 ? 0 : Math.PI) + ph], cOlive, 1);
      }
    }
    // one strides up the avenue as we arrive, then a file of six walking down-valley toward the Great Frame across the open floor: each is keyed to u, so
    // whatever the clock says one of them is striding off our bow from u 0.15 to 0.31, [u, x, z at that u, heading]
    for (const [uk, x, z, hx, hz] of [[0.03, 8.5, 52, 0.3, 0.954], [0.17, -6, 224.5, -0.8, 0.6], [0.20, -9, 257.5, -0.95, 0.31], [0.22, -7.5, 279.5, -0.6, 0.8], [0.26, -9, 322, -0.3, 0.954], [0.285, -2, 364, -0.6, 0.8], [0.30, -10, 392, -0.5, 0.866]]) {
      const yaw = Math.atan2(hx, hz), sp = 220, ph = prng.range(0, TAU);
      strider([x, 7.1, z, yaw], [0, sp, uk, 0.05], sp / 44, ph);
      shadow(x, 0.3, z, 4.6, 4.6, yaw, 0.75, [0, sp, uk, 0.05]);
    }
    for (let i = 0; i < rings.length; i++) {
      const [cx, cz, rx, rz] = rings[i], v = prng.range(3.0, 4.2), sp = (i % 2 ? -1 : 1) * v / ((rx + rz) * 0.5), ph = prng.range(0, TAU);
      strider([cx, ground(cx, cz) * 0.5 + 7.0, cz, 0.12], [rx, rz, sp, ph], v, ph);
      shadow(cx, 0.3, cz, 4.6, 4.6, 0, 0.7, [rx, rz, sp, ph]);
    }
    await ctx.yield();

    // ---- kit trees: a trunk of two half-shells pegged in a socket, three tiers dropped over its pin ---------
    const TIER_Y = [5.0, 7.3, 9.3];
    const treeCols = [cOlive, cOlive, mix3(cOlive, cSand, 0.45), cOlive, mix3(cOlive, cGrey, 0.5)];
    function tree(x, z, s, col, fr, cell, u0) {
      const y = ground(x, z) - 0.1, yaw = prng.range(0, TAU), cre0 = [x, y, z, yaw], st = [0, 0, 0, 0];
      hang('trunk', null, null, [0, 0, 0], QI, cre0, st, SEATED, 0.01, NOJ, cOlive, s);
      hang('trunk', null, null, [0, 0, 0], QTURN, cre0, st, SEATED, 0.01, NOJ, cOlive, s);
      for (let t = 0; t < 3; t++) {
        const slot = fr ? KIND_TREE.slots[cell * 3 + t] : null;
        hang('tier', fr, slot, [0, TIER_Y[t] * s, 0], qa(yawQ(t * 1.1)), cre0, st, fr ? u0 + t * 0.014 : SEATED, 0.034, [4, 0, 0, 0], col, TIER_R[t] * s, [0, 3.2, 0], 0.5, 0.32);
      }
      shadow(x, y + 0.25, z, 4.3 * s, 4.3 * s, 0, 0.9);
      occupied.push([x, z, 4.5 * s]);
    }
    const nTrees = Math.round(132 * density * (0.45 + 0.55 * detail));
    const treeSpot = (zmin, zmax) => {
      for (let tries = 0; tries < 30; tries++) {
        const z = prng.range(zmin, zmax), w = halfW(z), side = prng.chance(0.5) ? 1 : -1, t = prng(), x = valleyC(z) + side * lerp(z < 215 ? 46 : 26, w * 0.92, t * t * 0.9 + t * 0.1);
        if (segDist(x, z, frameA, frameB) < 22 || riverAt(x, z) > 0.02 || !free(x, z, 5) || path.nearestXZ(x, z).dist < 20) continue;
        if (Math.hypot(x - dockW.x, z - dockW.z) < 30) continue;
        return [x, z];
      }
      return null;
    };
    // the half-built ones first: a tree frame beside a pair of trunks whose tiers hop across as we near
    const nKitTrees = Math.round(nTrees * 0.13);
    for (let i = 0; i < nKitTrees; i++) {
      const z0 = 120 + (i / nKitTrees) * 960 + prng.range(-20, 20), side = (i % 2) ? 1 : -1;
      const x0 = valleyC(z0) + side * prng.range(z0 < 215 ? 52 : 30, 62);
      if (segDist(x0, z0, frameA, frameB) < 34 || riverAt(x0, z0) > 0.02 || riverAt(x0 - side * 12, z0) > 0.02 || !free(x0, z0, 16)) continue;
      const col = prng.pick(treeCols), fr = addFrame('tree', x0, z0, Math.PI + side * prng.range(0.5, 1.1), col);
      occupied.push([x0, z0, 14]);
      for (let c = 0; c < 2; c++) {
        const a = fr.yaw + (c ? 0.6 : -0.6), d = prng.range(13, 17), x = x0 + Math.sin(a) * d - side * 2, z = z0 + Math.cos(a) * d;
        tree(x, z, 1, col, fr, c, uOfZ(z - prng.range(70, 110)) + c * 0.02);
      }
      if (i % 2 === 1) await ctx.yield();
    }
    await ctx.yield();
    for (let i = 0, clump = 0, lx = 0, lz = 0; i < nTrees - nKitTrees * 2; i++) {
      // down the dark valley they stand in clumps of three or four; nothing is planted behind our start
      let sp = null;
      if (clump > 0) { clump--; for (let t = 0; t < 6 && !sp; t++) { const a = prng.range(0, TAU), d = prng.range(7, 12), x = lx + Math.sin(a) * d, z = lz + Math.cos(a) * d; if (free(x, z, 3) && riverAt(x, z) < 0.02 && path.nearestXZ(x, z).dist > 18) sp = [x, z]; } }
      if (!sp) { sp = treeSpot(0, 1210); if (sp && sp[1] > 770) { clump = prng.int(2, 3); lx = sp[0]; lz = sp[1]; } }
      if (!sp) continue;
      tree(sp[0], sp[1], prng.range(0.8, 1.25) * (sp[1] > 770 ? 1.25 : 1), prng.pick(treeCols), null, 0, 0);
      if (i % 5 === 4) await ctx.yield();
    }
    await ctx.yield();

    // ---- grazers: sand bodies on olive legs, a herd being legged beside the river -----------------------------
    const cSandB = mix3(cGrey, cSlate, 0.6);                         // the second body half comes off the sea-grey frame: two plastics meet at the seam
    const slotOf = (kind, cell, k) => kind.slots.find((s) => s.cell === cell && s.k === k);
    // A LATE LEG'S HOP IS KEYED TO THE METRES WE HAVE FLOWN: it is let go at legU0 and flies for LEG_SPAN of the route, so at
    // every metre the leg has one place on every visit, and it is asked THERE: every place PART_VERT stands the leg in
    // between its gate on the frame (h, turned hq) and its seat (s, turned sq), by the arc to the gap and the drop from it,
    // against the place of our line for the same metre, a place every STEP of the route. The leg is a stick from its pin to
    // its foot, 7 x its size long; its reach about that stick is half its thickness at the pin's head (0.662 x its size)
    // and the swing of its tremble on the way (0.455): LEG_THICK covers their sum. The least distance, as far as it is
    // under cap. (The 0.8, 0.2, 2.2, 1.2 and 1.5 in hopGap are PART_VERT's own, said again because the hop is replayed
    // here; so are the seat's height 2.72 x gs (in gap() and where the grazer is stood), the leg's slot 2 + l (in gap()
    // and where the leg is hung) and the leg's size 0.4 x gs (in need, in gap() and where the leg is hung): whoever
    // changes one changes them all.)
    const LEG_FOOT = V3(0.06, -1, 0.02).normalize().multiplyScalar(7), LEG_THICK = 1.12, LEG_SPAN = 0.034, LEG_HOP = 0.3;
    const legU0 = (u0, l) => u0 + (l === 1 ? 0 : 0.022);
    function hopGap(h, hq, s, sq, gap, u0, size, cap) {
      const pre = s.clone().add(gap), lift = LEG_HOP * h.distanceTo(pre) + 1.5, n = Math.ceil(LEG_SPAN * path.length / STEP), sg = hq.dot(sq) < 0 ? -1 : 1;
      const q = new THREE.Quaternion(), c = V3(0, 0, 0), f = V3(0, 0, 0), p = V3(0, 0, 0);
      let m = cap;
      for (let i = 0; i <= n; i++) {
        const k = i / n, e = k < 0.8 ? (k / 0.8) * (k / 0.8) * (3 - 2 * k / 0.8) : 1;
        if (k < 0.8) { c.lerpVectors(h, pre, e); c.y += 2 * e * (1 - e) * lift; }
        else { const t = (k - 0.8) / 0.2 - 1; c.copy(s).addScaledVector(gap, -2.2 * t * t * t - 1.2 * t * t); }   // the last fifth: straight in from the gap, and a little past the seat
        q.set(hq.x + (sg * sq.x - hq.x) * e, hq.y + (sg * sq.y - hq.y) * e, hq.z + (sg * sq.z - hq.z) * e, hq.w + (sg * sq.w - hq.w) * e).normalize();
        f.copy(LEG_FOOT).multiplyScalar(size).applyQuaternion(q);
        path.posAtDist(clamp((u0 + k * LEG_SPAN) * path.length, 0, path.length), p).sub(c);
        m = Math.min(m, p.addScaledVector(f, -clamp(p.dot(f) / f.lengthSq(), 0, 1)).length());
      }
      return m;
    }
    function grazer(x, z, yaw, frS, frO, cell, u0, gs = 1, dz = 0) {
      const kit = !!frS, x0 = x, z0 = z, legDock = (l) => [(l & 1 ? 1 : -1) * 0.8 * gs, -0.1 * gs, (l & 2 ? 1 : -1) * 1.5 * gs], legGap = (l) => [(l & 1 ? 1 : -1) * 1.2, -1.2, 0];
      // its two late legs hop to it from the olive frame, across our line. gap(zz): the least air either hop would leave
      // us at any metre of it, were the grazer to stand at zz (no more than `need`, AIR + the leg's reach + EDGE, is told)
      const cq = yawQ(yaw), need = AIR + LEG_THICK * 0.4 * gs + EDGE;
      const gap = (zz) => {
        let m = need;
        for (const l of [1, 2]) {
          const slot = slotOf(KIND_BEAST, cell, 2 + l), h = V3(slot.x * frO.sc, slot.y * frO.sc, 0).applyQuaternion(frO.q).add(frO.pos);
          const s = V3(...legDock(l)).applyQuaternion(cq).add(V3(x, ground(x, zz) + 2.72 * gs, zz)), sq = l & 1 ? cq : cq.clone().multiply(yawQ(Math.PI));
          m = hopGap(h, frO.q.clone().multiply(slot.q), s, sq, V3(...legGap(l)).applyQuaternion(cq), legU0(u0, l), 0.4 * gs, m);
        }
        return m;
      };
      // A grazer whose hop would come within `need` of us stands further down the valley by the shortfall and 0.05 m
      // more (so that a round always moves it on), again until both hops are clear (the leg then crosses our bow ahead
      // of us) or 80 rounds are done: a guard against a walk without end, far above the 11 rounds that the most a
      // counted seed takes (seeds 1 to 100); a hop still unclear after them would be left unclear. Its legs, their
      // release and their gait are as dealt. Each of its group dealt after it starts down the valley by the metres of
      // the one dealt just before it (dz): the mate by the first's, the whole one behind by the mate's. One whose own
      // hops would not be clear there comes back toward its dealt ground, a quarter metre at a time (a step small beside
      // the metres it is moved; its hops are asked whole where it stops), until they are: so the group keeps the shape
      // it was dealt wherever the mate stays where the first's metres set it, and the mate and the whole one behind
      // always keep theirs.
      z += dz;
      if (kit) {
        while (z > z0 && gap(z) < need) z = Math.max(z0, z - 0.25);
        for (let n = 0, m = gap(z); n < 80 && m < need; n++, m = gap(z)) z += need - m + 0.05;
      }
      const y = ground(x, z) + 2.72 * gs, cre0 = [x, y, z, yaw], st = [0, 0, 0, 0];
      hang('gbody', null, null, [0, 0, 0], QI, cre0, st, SEATED, 0.01, NOJ, cSand, gs);
      hang('gbody', null, null, [0, 0, 0], QFLIP, cre0, st, SEATED, 0.01, NOJ, cSandB, gs);
      for (let h = 0; h < 2; h++) hang('gbody', kit ? frS : null, kit ? slotOf(KIND_BEAST, cell, 6 + h) : null, [0, 0.75 * gs, 2.75 * gs], h ? QFLIP : QI, cre0, st, kit ? u0 + 0.05 + h * 0.006 : SEATED, 0.03, NOJ, h ? cSand : cSandB, 0.42 * gs, [h ? -0.5 : 0.5, 0.3, 0.8], 0.5, 0.3);
      for (let l = 0; l < 4; l++) {
        const sx = l & 1 ? 1 : -1, sz = l & 2 ? 1 : -1, late = kit && (l === 1 || l === 2);
        const test = late ? [3, 0.32, prng.range(2.2, 3.4), prng.range(0, TAU)] : [3, 0.035, prng.range(0.8, 1.6), prng.range(0, TAU)];
        hang('leg', late ? frO : null, late ? slotOf(KIND_BEAST, cell, 2 + l) : null, legDock(l), sx > 0 ? QI : QTURN, cre0, st, late ? legU0(u0, l) : SEATED, LEG_SPAN, test, cOlive, 0.4 * gs, legGap(l), 0.5, LEG_HOP);
      }
      if (kit) {                                                         // a runner prop under the belly while it waits for its legs
        const c = Math.cos(yaw), s = Math.sin(yaw), px = x + (s * -1.4 + c * 0.9) * gs, pz = z + (c * -1.4 - s * 0.9) * gs;
        logs[0].push([px, y - 1.45 * gs, pz], qa(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, yaw, Math.PI / 2 - 0.1, 'YXZ'))), cGrey.map((v) => v * 0.92), [0, 9, 0, 0.45 * gs]);
      }
      shadow(x, y - 2.5 * gs, z, 3.0 * gs, 4.2 * gs, yaw, 0.9);
      occupied.push([x0, z0, 4 * gs]);                                   // the ground it was dealt stays taken, so all that is dealt after it is dealt as before
      return z - z0;
    }
    // the herd stands close to port between our line and the river, from the avenue's mouth to the hull: each pair
    // waits on a runner prop for the legs that hop across our bow from the olive frame lying to starboard
    const kitGrazers = herd === 40 ? 10 : 6;
    for (let p = 0; p < kitGrazers / 2; p++) {
      const z = 258 + p * 44 + prng.range(-2, 2), x = -prng.range(41, 46) + 13, yaw = prng.range(-0.3, 0.3);    // the olive frame lies close beside our line: its legs hop low across our bow
      const frO = addFrame('beast', x, z, yaw, cOlive, { lie: 1 }), frS = addFrame('beast', x - 27, z + prng.range(-5, 5), yaw + prng.range(-0.2, 0.2), cSand, { lie: 1 });
      occupied.push([x, z - 8, 15], [x - 27, z - 8, 15]);
      let dz = 0;
      for (let c = 0; c < 2; c++) {
        const gz = z + 6 + c * 13 + prng.range(-1.5, 1.5), gx = clamp(riverX(gz) - 18.5 - prng.range(0, 3), 9.5, 14.5);
        dz = grazer(gx, gz, prng.range(-0.6, 0.6) + (c ? Math.PI : 0), frS, frO, c, uOfZ(gz - 24) - 0.02, prng.range(1.15, 1.3), dz);
        await ctx.yield();                                               // a kit grazer's hops are measured against our line: hand back after each
      }
      const ez = z + 31 + prng.range(-1.5, 1.5);                         // and one already whole, grazing between the pairs
      grazer(clamp(riverX(ez) - 18.5 - prng.range(0, 3), 9.5, 14.5), ez, prng.range(0, TAU), null, null, 0, 0, prng.range(1.0, 1.25), dz);
    }
    await ctx.yield();
    for (let i = 0, tries = 0; i < herd - kitGrazers && tries < 400; tries++) {
      const z = prng.range(215, 520), far = prng.chance(0.55), x = far ? riverX(z) + prng.range(15, 46) : clamp(riverX(z) - prng.range(15, 22), 9.5, 40);
      if (!free(x, z, 4.5) || riverAt(x, z) > 0.02) continue;
      grazer(x, z, prng.range(0, TAU), null, null, 0, 0); i++;
    }
    await ctx.yield();

    // ---- emptied frames: standing at all angles, lying flat, and a few that topple like cards as we pass -----
    const anyCol = [cSand, cOx, cOlive, mix3(cGrey, cPale, 0.25)];
    for (let i = 0, tries = 0; i < Math.round(9 * (0.5 + 0.5 * detail)) && tries < 300; tries++) {
      const z = prng.range(215, 960), side = prng.chance(0.5) ? 1 : -1, big = prng.chance(0.25), sc = big ? 2 : 1;
      const x = valleyC(z) + side * prng.range(big ? 56 : 27, 100);
      if (!free(x, z, 15 * sc) || riverAt(x, z) > 0.02 || segDist(x, z, frameA, frameB) < 26 * sc || Math.hypot(x - dockW.x, z - dockW.z) < 50) continue;
      const mode = i % 3, kind = big ? 'beast' : prng.pick(['fly', 'tree', 'beast']);
      const o = mode === 0 ? { lie: 1, scale: sc } : mode === 1 && z > 760 ? { topple: uOfZ(z - prng.range(50, 90)), scale: sc } : { scale: sc };
      addFrame(kind, x, z, mode === 1 && z > 760 ? (side > 0 ? 0.5 : -0.5) + prng.range(-0.3, 0.3) : prng.range(0, TAU), prng.pick(anyCol), o);
      occupied.push([x, z, 15 * sc]); i++;
    }
    for (let i = 0; i < 4; i++) {                                        // four that always fall, either side of the dark valley
      const z = 828 + i * 30, side = i % 2 ? 1 : -1, x = valleyC(z) + side * prng.range(27, 36);
      if (!free(x, z, 10)) continue;
      addFrame(i % 2 ? 'tree' : 'fly', x, z, Math.PI + side * 0.5, anyCol[(i + kitI) % 4], { topple: uOfZ(z - 85) });
      occupied.push([x, z - 8, 15]);
    }
    await ctx.yield();

    // ---- emptied frames lying flat like cards across the open floor and the dark valley ------------------------
    for (let i = 0, tries = 0; i < Math.round(14 * (0.5 + 0.5 * detail)) && tries < 500; tries++) {
      const dv = i % 5 >= 3, z = dv ? prng.range(790, 1060) : prng.range(300, 690), side = dv ? (prng.chance(0.8) ? 1 : -1) : (prng.chance(0.5) ? 1 : -1), x = valleyC(z) + side * prng.range(dv ? 22 : 28, Math.min(120, halfW(z) * 0.42));
      if (!free(x, z, 14) || riverAt(x, z) > 0.02 || riverAt(x, z - 9) > 0.02 || segDist(x, z, frameA, frameB) < 20 || Math.hypot(x - dockW.x, z - dockW.z) < 30) continue;
      addFrame(prng.pick(['fly', 'tree', 'beast']), x, z, prng.range(0, TAU), prng.pick(anyCol), { lie: 1 });
      occupied.push([x, z, 14]); i++;
    }
    await ctx.yield();
    // ---- litter: offcut runners like fallen logs and loose parts where they were clipped, thick along our line and
    // spread wider the higher we fly, so the floor is never bare from the air; every piece on its own soft shadow
    const QLIE = qa(new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), Math.PI / 2));
    const spreadAt = (c) => 40 + 2.3 * Math.max(0, c.y - 9);
    const litterSpot = (u, k) => {
      const c = path.pointAt(u), lat = prng.range(-1, 1), z = c.z + prng.range(-7, 7), w = Math.min(spreadAt(c), halfW(z) * 0.5 - 6);
      return [c.x + lat * (0.35 + 0.65 * Math.abs(lat)) * w * k, z];
    };
    const addLog = (x, z, big) => {
      if (riverAt(x, z) > 0.02 || segDist(x, z, frameA, frameB) < 5) return;
      const tee = prng.chance(0.3) ? 1 : 0, sc = prng.range(0.7, 1.25) * big, yaw = prng.range(0, TAU), y = ground(x, z) - 0.06;
      logs[tee].push([x, y, z], qa(yawQ(yaw)), prng.pick(anyCol).map((v) => v * 0.97), [0, 9, 0, sc]);
      shadow(x, y + 0.2, z, (tee ? 5.4 : 3.8) * sc, 1.5 * sc, yaw, 0.85);
    };
    const addLoose = (x, z, big) => {
      if (riverAt(x, z) > 0.02) return;
      const kind = prng.pick(['wing', 'vane', 'tier', 'tier', 'leg', 'body', 'gbody']), y = ground(x, z), yaw = prng.range(0, TAU), cre0 = [x, y, z, yaw], col = prng.pick(anyCol), st = [0, 0, 0, 0];
      if (kind === 'wing' || kind === 'vane') { const sc = prng.range(1, 1.8) * big; hang(kind, null, null, [0, kind === 'wing' ? 0.06 : 0.04, 0], kind === 'wing' ? QI : QLIE, cre0, st, SEATED, 0.01, NOJ, col, sc); shadow(x + Math.cos(yaw) * sc * (kind === 'wing' ? 1 : 0), y + 0.15, z - Math.sin(yaw) * sc * (kind === 'wing' ? 1 : 0), 1.5 * sc, 1.1 * sc, yaw, 0.65); }
      else if (kind === 'tier') { const sc = prng.range(0.8, 2.2) * big * (Math.abs(x) < 8 && z < 700 ? 0.4 : 1);   // small on our own line: a big one under the lens is only a smudge
        hang('tier', null, null, [0, 0.07 * sc, 0], prng.chance(0.5) ? QI : QFLIP, cre0, st, SEATED, 0.01, NOJ, col, sc); shadow(x, y + 0.15, z, sc * 1.45, sc * 1.45, 0, 0.75); }
      else if (kind === 'leg') { const sc = prng.range(0.3, 0.6) * big; hang('leg', null, null, [0, 0.3, 0], QLIE, cre0, st, SEATED, 0.01, NOJ, col, sc); shadow(x + Math.cos(yaw) * 3.5 * sc, y + 0.15, z - Math.sin(yaw) * 3.5 * sc, 4.2 * sc, 1.2 * sc, yaw, 0.65); }
      else { const sc = (kind === 'body' ? prng.range(1, 1.6) : prng.range(0.4, 0.8)) * big; hang(kind, null, null, [0, 0.1 * sc, 0], QLIE, cre0, st, SEATED, 0.01, NOJ, col, sc); const L = kind === 'body' ? 1.5 : 2.9; shadow(x, y + 0.15, z, 1.3 * sc, L * sc, yaw, 0.7); }
    };
    const nLogs = Math.round(135 * (0.4 + 0.6 * detail));
    for (let i = 0; i < nLogs; i++) { const sp = litterSpot((i + prng()) / nLogs, 1); addLog(sp[0], sp[1], 1 + 0.8 * smoothstep(20, 60, path.pointAt(i / nLogs).y)); }
    await ctx.yield();
    const nLoose = Math.round(245 * density * (0.4 + 0.6 * detail));
    for (let i = 0; i < nLoose; i++) { const sp = litterSpot((i + prng()) / nLoose, 1); addLoose(sp[0], sp[1], 1 + 1.2 * smoothstep(20, 60, path.pointAt(i / nLoose).y)); if (i % 25 === 24) await ctx.yield(); }
    // the avenue floor between the rows: a dozen readable pieces in any 20 m
    const nAve = Math.round(52 * (0.5 + 0.5 * detail));
    for (let i = 0; i < nAve; i++) { const z = 16 + (i + prng()) / nAve * 190, x = prng.range(-15, 15); if (Math.abs(x) < 1.5) continue; if (i % 4 === 0) addLog(x, z, 0.9); else addLoose(x, z, 1.15); }
    await ctx.yield();
    // reeds: comb strips on short runners along both banks, swaying as one piece
    const nReeds = Math.round(52 * (0.5 + 0.5 * detail));
    for (let i = 0; i < nReeds; i++) for (const s of [-1, 1]) {
      const z = 232 + (i / nReeds) * 370 + prng.range(-2, 2), x = riverX(z) + s * prng.range(11.5, 14.5);
      if (riverK(z) < 0.5 || Math.abs(x) < 7) continue;
      const yaw = Math.PI / 2 + Math.atan((riverX(z + 2) - riverX(z - 2)) / 4) + prng.range(-0.25, 0.25);
      hang('reed', null, null, [0, 0, 0], QI, [x, ground(x, z) - 0.05, z, yaw], [0, 0, 0, 0], SEATED, 0.01, [3, 0.13, prng.range(0.9, 1.3), z * 0.06], prng.chance(0.7) ? cOlive : cSand, prng.range(0.8, 1.3));
    }
    for (let i = 0; i < Math.round(nReeds * 0.7); i++) for (const s of [-1, 1]) {
      const z = ZH + 100 + (i / (nReeds * 0.7)) * 400 + prng.range(-2, 2), x = riverX2(z) + s * prng.range(8.8, 11.5);
      const yaw = Math.PI / 2 + Math.atan((riverX2(z + 2) - riverX2(z - 2)) / 4) + prng.range(-0.25, 0.25);
      hang('reed', null, null, [0, 0, 0], QI, [x, ground(x, z) - 0.05, z, yaw], [0, 0, 0, 0], SEATED, 0.01, [3, 0.13, prng.range(0.9, 1.3), z * 0.06], prng.chance(0.6) ? cOlive : cSand, prng.range(0.9, 1.5));
    }
    await ctx.yield();

    // ---- the portal frame: olive, 40 m wide and 30 m tall, its one big round part gone; the ring sits in the hole
    const PS = 3.2, pEnd = path.end.clone(), pBaseY = ground(pEnd.x, pEnd.z) - 0.2, hy = pEnd.y - pBaseY;
    const Gpf = new Geo(); Gpf.part = -1;
    {
      const R = 0.6, rod = (x0, y0, x1, y1, r = R) => Gpf.rod([x0, y0, 0], [x1, y1, 0], r, 8);
      rod(-19.4, 1.6, 19.4, 1.6); rod(-19.4, 29.4, 19.4, 29.4); rod(-19.4, 1.6, -19.4, 29.4); rod(19.4, 1.6, 19.4, 29.4);
      rod(-10.6, 1.6, -10.6, 29.4, 0.5); rod(10.6, 1.6, 10.6, 29.4, 0.5); rod(-10.6, hy + 10.6, 10.6, hy + 10.6, 0.5); rod(-19.4, hy, -10.6, hy, 0.4); rod(10.6, hy, 19.4, hy, 0.4);
      Gpf.grid(36, 8, (u, v, o) => {                                    // the ring, with a flash fin round its outside
        const a = u * TAU, b = v * TAU, rr = 7.75 + Math.cos(b) * 0.55; o[0] = Math.cos(a) * rr; o[1] = hy + Math.sin(a) * rr; o[2] = Math.sin(b) * 0.55; return Math.cos(b) > 0.9 ? 1 : 0;
      }, true);
      for (const [gx, gy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {      // four gates hold it
        const L = gy < 0 ? hy - 1.6 - 8.3 : 10.6 - 8.3; if (L < 0.3) continue;
        Gpf.lathe([gx * (8.3 + L), hy + gy * (8.3 + L), 0], [-gx, -gy, 0], [[0.75, 0, 0], [0.45, L * 0.7, 0.3], [0.3, L, 1]], 7);
      }
      for (const [x, y] of [[-19.4, 1.6], [19.4, 1.6], [-19.4, 29.4], [19.4, 29.4], [-10.6, 29.4], [10.6, 29.4], [-10.6, hy + 10.6], [10.6, hy + 10.6]])
        Gpf.lathe([x, y, 0], [0, 0, 1], [[0, -0.8, 0], [1.5, -0.65, 0.4], [1.5, 0.65, 0.4], [0, 0.8, 0]], 10);
      plate(Gpf, roundRect(0, hy + 14.2, 13, 3.6, 0.5), -0.2, 0.2, 0.1, 0.7);          // the maker's tab: dots and dashes, no words
      for (let k = 0; k < 9; k++) { const mx = -5.2 + k * 1.3; if ((k * 7 + kitI) % 3) Gpf.rod([mx - 0.35, hy + 14.2, 0.25], [mx + 0.35, hy + 14.2, 0.25], 0.16, 4); else Gpf.lathe([mx, hy + 14.2, 0.18], [0, 0, 1], [[0.26, 0, 0], [0, 0.2, 0.5]], 6); }
      rod(0, hy + 16, 0, 29.4, 0.3);
      for (const fx of [-13, 13]) {
        Gpf.m = new THREE.Matrix4().makeTranslation(fx, 0, 0).multiply(new THREE.Matrix4().makeScale(2.4, 1, 1.4));
        Gpf.lathe([0, 0, 0], [0, 1, 0], [[0, 0, 0], [2.6, 0, 0.5], [2.7, 0.25, 0.8], [1.8, 0.9, 0], [0.8, 1.6, 0]], 12);
        Gpf.m = null;
      }
      for (let i = 0; i < Gpf.P.length; i++) Gpf.P[i] /= PS;
    }
    const pYaw = Math.atan2(-path.endTangent.x, -path.endTangent.z), pQ = yawQ(pYaw);
    const pfB = new Batch(FIX_ATTRS); pfB.push([pEnd.x, pBaseY, pEnd.z], qa(pQ), cOlive, [0, 9, 0, PS]);
    const pf = { pos: V3(pEnd.x, pBaseY, pEnd.z), q: pQ, sc: 1, lie: false, nx: -path.endTangent.x, nz: -path.endTangent.z, phase: 0, col: cOlive, rigid: true };
    for (const sx of [-1, 1]) for (const [dy, r] of [[5.6, 3.3], [-5.6, 2.6]])   // parts still hanging in its side bays, trembling
      hang('tier', pf, { x: sx * 15, y: hy + dy * (sx > 0 ? 1 : -1), q: Q_FLAT }, [0, 0, 0], QI, [0, -400, 0, 0], [0, 0, 0, 0], 9, 0.01, [4, 0, 0, 0], cOlive, r, [0, 0, 0], 0.5);
    shadow(pEnd.x, pBaseY + 0.3, pEnd.z, 22, 4.5, pYaw, 0.85);
    await ctx.yield();

    // ---- the rare visit: the Great Frame is a double kit, and a second, smaller clear-winged creature builds
    // itself from a frame beside the dock and follows the first over the top bar ------------------------------
    const rareDock = V3(-64, 44, ZH - 60), rareCurve = [];
    if (rare) {
      const fr = addFrame('beast', -96, ZH - 38, Math.PI - 0.55, cOx, { scale: 2.5 });
      const cre0 = [0, 0, 0, 0], cre1 = [-1, 0, 0, 0], B = KIND_BEAST, beat = [1, 0.5, 2.3, 0];
      hang('gbody', fr, slotOf(B, 0, 0), [0, 0, 0], QI, cre0, cre1, 0.45, 0.045, NOJ, cSand, 2.5, [3, 0, 0], 0.4, 0.3);
      hang('gbody', fr, slotOf(B, 0, 1), [0, 0, 0], QFLIP, cre0, cre1, 0.46, 0.045, NOJ, cSand, 2.5, [-3, 0, 0], 0.4, 0.3);
      hang('gbody', fr, slotOf(B, 0, 6), [0, 1.6, 6.6], QI, cre0, cre1, 0.485, 0.04, NOJ, cOx, 1.05, [1.5, 1, 2], 0.5, 0.3);
      hang('gbody', fr, slotOf(B, 0, 7), [0, 1.6, 6.6], QFLIP, cre0, cre1, 0.495, 0.04, NOJ, cOx, 1.05, [-1.5, 1, 2], 0.5, 0.3);
      hang('vane', fr, slotOf(B, 0, 2), [0, 1.6, -5.2], QI, cre0, cre1, 0.51, 0.04, NOJ, cOx, 5, [0, 3, -4], 0.5, 0.3);
      const sA = slotOf(B, 1, 0), sB = slotOf(B, 1, 1);
      PBA.push(...partArgs(fr, { x: sA.x - 1.2, y: sA.y, q: Q_FLAT }, [1.7, 1.0, 0.6], QI, cre0, cre1, 0.525, 0.05, beat, cClear, 11, [5, 4, 0], -0.3, 0.3));
      PBA.push(...partArgs(fr, { x: sB.x - 1.2, y: sB.y, q: Q_FLAT }, [-1.7, 1.0, 0.6], QTURN, cre0, cre1, 0.545, 0.05, beat, cClear, 11, [-5, 4, 0], -0.3, 0.3));
      const fl = hero.anchors.flight, off = V3(14, -30, -34);
      rareCurve.push([0.4, rareDock.clone()], [0.655, rareDock.clone()]);
      for (const f of fl) if (f.u > 0.64 && f.u < 0.67) rareCurve.push([f.u + 0.04, toWorld(f.position).add(off)]);   // the lift over the top bar
      // then a route of its own, keyed to our u: it stays high over the starboard benches while the Longwing comes down to
      // us, crosses above the last rows behind the Longwing's tail and climbs away beside it over the ring; never lower
      // than we are, never nearer than 65 m, never in front of the ring: [u, world x, y, z]
      for (const k of [[0.69, -44, 126, 815], [0.725, -62, 110, 893], [0.76, -75, 90, 965], [0.80, -52, 92, 1032], [0.84, -12, 92, 1088],
        [0.875, 20, 80, 1112], [0.93, 30, 80, 1165], [0.96, 42, 105, 1198], [1.0, 68, 160, 1245]]) rareCurve.push([heroU(k[0]), V3(k[1], k[2], k[3])]);
    }
    const rareSpline = rare ? new THREE.CatmullRomCurve3(rareCurve.map((c) => c[1]), false, 'centripetal') : null;
    await ctx.yield();

    // ---- geometry: one mesh per frame kind and per part kind, all instanced --------------------------------
    const geoOf = async (fn) => { const G = new Geo(); fn(G); await ctx.yield(); const g = await G.buildSteps(ctx); await ctx.yield(); return g; };
    const fixed = new THREE.Group(), kitParts = new THREE.Group(); scene.add(fixed, kitParts);
    const grng = rng.fork('geo');
    for (const k of ['fly', 'tree', 'beast']) fixed.add(FR[k].mesh(await geoOf((G) => frameGeo(G, KINDS[k], grng)), matFixed));
    fixed.add(logs[0].mesh(await geoOf((G) => logPart(G, 0, 6)), matFixed), logs[1].mesh(await geoOf((G) => logPart(G, 1, 9)), matFixed));
    fixed.add(pfB.mesh(await Gpf.buildSteps(ctx), matFixed));
    await ctx.yield();
    fixed.add(landSprue.mesh(await Gls.buildSteps(ctx), matFixed));
    await ctx.yield();
    const PARTGEO = {
      body: (G) => hullHalf(G, 2.6, 0.42, 0.46, 0.8, 4, 4, 0, [0.45]), wing: wingPart, vane: vanePart, trunk: trunkHalf, tier: tierPart,
      gbody: (G) => hullHalf(G, 5.0, 0.95, 1.05, 0.7, 6, 5, 0.12, [0.3, 0.62], 0.3, [0.7, 0.3], 0.3), leg: legPart, reed: reedPart,
      ebody: (G) => hullHalf(G, 2.6, 0.42, 0.46, 0.8, 7, 6, 0, [0.3, 0.62], 0.14), ewing: wingRich, evane: vaneRich,   // the three that pace us, seen close
    };
    const geos = {};
    for (const k of Object.keys(PB)) { geos[k] = await geoOf(PARTGEO[k]); kitParts.add(PB[k].mesh(geos[k], matPlastic)); }
    if (rare) {
      const am = (defs, blend, order) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: PART_VERT, fragmentShader: AMBER_FRAG, defines: defs, side: THREE.DoubleSide, ...blend });
      kitParts.add(PBA.mesh(geos.wing, am({ AMBER_MUL: 1 }, MUL), 5), PBA.mesh(geos.wing, am({}, ADD), 6));
    }
    await ctx.yield();

    // ---- contact shadows: soft blue quads multiplied onto the ground ------------------------------------------
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(shadows.p), 3));
      g.setAttribute('iSz', new THREE.InstancedBufferAttribute(new Float32Array(shadows.s), 4));
      g.setAttribute('iOrb', new THREE.InstancedBufferAttribute(new Float32Array(shadows.o), 4));
      g.instanceCount = shadows.n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, ...SHADE, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.frustumCulled = false; m.renderOrder = 1; m.matrixAutoUpdate = false; scene.add(m);
    }
    // ---- the long shadows of the standing frames: one small draped grid each, laid away from the sun -----------
    {
      const sh = Math.hypot(sunDir.x, sunDir.z), Dx = -sunDir.x / Math.max(sh, 1e-3), Dz = -sunDir.z / Math.max(sh, 1e-3), cot = Math.min(sh / Math.max(sunDir.y, 0.2), 2.6);
      const P = [], UV = [], A = [], I = [], NI = 6, NJ = 4; let nf = 0;
      for (const fr of frameList) {
        if (!fr.stand) continue;
        const gy0 = ground(fr.pos.x, fr.pos.z);
        if (gy0 - ground(valleyC(fr.pos.z), fr.pos.z) > 3) continue;       // a frame up on a bench throws none: its sheet would climb the riser behind it in bands
        const K = KINDS[fr.kind], wx = Math.cos(fr.yaw), wz = -Math.sin(fr.yaw), base = P.length / 3, top = 16 * Math.cos(fr.lean);
        for (let j = 0; j <= NJ; j++) for (let i = 0; i <= NI; i++) {
          const lx = (i / NI - 0.5) * 24, ly = (j / NJ) * top, x = fr.pos.x + (wx * lx + Dx * ly * cot) * fr.sc, z = fr.pos.z + (wz * lx + Dz * ly * cot) * fr.sc;
          const gy = ground(x, z), level = Math.abs(gy - gy0) < 1.5;       // the shadow lies on the frame's own level and stops at the foot of a riser
          P.push(x, (level ? gy : gy0) + 0.22, z); UV.push(lx, (j / NJ) * 16); A.push(K.nx, K.ny, fr.phase, level ? 0.9 : 0);
        }
        for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const a = base + j * (NI + 1) + i; I.push(a, a + NI + 1, a + 1, a + 1, a + NI + 1, a + NI + 2); }
        if (++nf % 12 === 0) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aux', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CAST_VERT, fragmentShader: CAST_FRAG, ...SHADE, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.frustumCulled = false; m.renderOrder = 1; m.matrixAutoUpdate = false; scene.add(m);
    }
    await ctx.yield();
    // ---- amber patches: sunlight through each clear wing, slid along the sun ray onto the ground --------------
    // (a 7 x 3 grid each, draped on the ground every frame; a multiply pass for the tint, an additive pass for the light)
    const PNX = 6, PNY = 2, PV = (PNX + 1) * (PNY + 1);
    const patchPos = new Float32Array(4 * PV * 3), patchUv = new Float32Array(4 * PV * 3);
    const patchGeo = new THREE.BufferGeometry();
    {
      const idx = [];
      for (let w = 0; w < 4; w++) for (let j = 0; j <= PNY; j++) for (let i = 0; i <= PNX; i++) {
        const v = w * PV + j * (PNX + 1) + i; patchUv[v * 3] = i / PNX; patchUv[v * 3 + 1] = (j / PNY) * 2 - 1; patchPos[v * 3 + 1] = -50;
        if (i < PNX && j < PNY) idx.push(v, v + 1, v + PNX + 2, v, v + PNX + 2, v + PNX + 1);
      }
      patchGeo.setAttribute('position', new THREE.BufferAttribute(patchPos, 3)); patchGeo.setAttribute('aUv', new THREE.BufferAttribute(patchUv, 3)); patchGeo.setIndex(idx);
    }
    const patchRay = V3(sunDir.x * 0.14, 1, sunDir.z * 0.14).normalize();   // steeper than the sun, so the light always lands on the valley floor near our line
    for (const [defs, blend, order] of [[{}, MUL, 2], [{ PATCH_ADD: 1 }, ADD, 3]]) {
      const patches = new THREE.Mesh(patchGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: PATCH_VERT, fragmentShader: PATCH_FRAG, defines: defs, side: THREE.DoubleSide, ...blend, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      patches.frustumCulled = false; patches.renderOrder = order; patches.matrixAutoUpdate = false; scene.add(patches);
    }
    await ctx.yield();

    // ---- swarf: a puff of pale chaff at every snap near our line (placed by u), and the weather's drift ------
    const mkPoints = (pos, vel, seed, defines) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aVel', new THREE.Float32BufferAttribute(vel, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4));
      const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SWARF_VERT, fragmentShader: SWARF_FRAG, defines, transparent: true, depthWrite: false }));
      m.frustumCulled = false; m.renderOrder = 7; m.matrixAutoUpdate = false; scene.add(m); return m;
    };
    {
      const pos = [], vel = [], seed = [], srng = rng.fork('swarf');
      const puff = (p, n, big) => {
        for (let i = 0; i < n; i++) {
          const a = srng.range(0, TAU), r = srng.range(0.3, 1), k = big ? 2.2 : 1;
          pos.push(p[0] + srng.range(-1, 1) * p[4], p[1] + srng.range(-0.5, 0.5) * (big ? 1 : p[4]), p[2] + srng.range(-1, 1) * p[4]);
          vel.push(Math.cos(a) * r * 3.2 * k, srng.range(big ? 0.6 : -0.3, big ? 3 : 1.6) * k, Math.sin(a) * r * 3.2 * k);
          seed.push(p[3], srng.range(0.22, 0.5) * (big ? 1.5 : 1), srng.range(0, TAU), srng.range(0.7, 1.3) * (big ? 1.6 : 1));
        }
      };
      const cap = Math.round(170 * detail), stepP = Math.max(1, puffs.length / cap);
      for (let i = 0; i < puffs.length; i += stepP) puff(puffs[Math.floor(i)], 4, false);
      for (const p of bigPuffs) puff(p, Math.round(26 * detail), true);
      mkPoints(pos, vel, seed, {});
      const wp = [], wv = [], ws = [], nW = Math.round([240, 460, 820][weather] * (0.5 + 0.5 * detail));
      for (let i = 0; i < nW; i++) { wp.push(srng.range(0, 90), srng.range(0, 90), srng.range(0, 90)); wv.push(0, 0, 0); ws.push(0, srng.range(0.16, 0.36), srng.range(0, TAU), srng.range(0.6, 1.4)); }
      mkPoints(wp, wv, ws, { WEATHER: 1 });
    }
    await ctx.yield();

    // ---- update --------------------------------------------------------------------------------------------
    const size = new THREE.Vector2(), camP = V3(0, 0, 0), pl = V3(0, 0, 0), pq = new THREE.Quaternion(), c0 = V3(0, 0, 0), nrm = V3(0, 0, 0);
    const rp = V3(0, 0, 0), rn = V3(0, 0, 0), m4 = new THREE.Matrix4(), rq = new THREE.Quaternion(), rq1 = new THREE.Quaternion(), rq0 = yawQ(0.69), UP = V3(0, 1, 0);
    const WSIDE = [1, -1, 1, -1];
    function placePatches() {
      // between the last rows the valley floor is narrower than the wings, whose light would land on the risers: there it is gathered
      const zc = U.uHullP.value.z - patchRay.z / patchRay.y * (U.uHullP.value.y - 0.5), pool = smoothstep(1000, 1070, zc);
      for (let w = 0; w < 4; w++) {
        const live = w < nWings; let k = 0;
        hero.partLocal(w, pl); hero.partQuaternion(w, pq);
        nrm.set(0, 1, 0).applyQuaternion(pq).applyQuaternion(heroQ);
        if (live) k = smoothstep(0.08, 0.45, Math.abs(nrm.dot(patchRay)));
        for (let j = 0; j <= PNY; j++) for (let i = 0; i <= PNX; i++) {
          const o = (w * PV + j * (PNX + 1) + i) * 3;
          if (!live) { patchPos[o + 1] = -50; patchUv[o + 2] = 0; continue; }
          c0.set(WSIDE[w] * 70 * (i / PNX), 0, 4 + ((j / PNY) * 2 - 1) * 15).applyQuaternion(pq).add(pl).applyQuaternion(heroQ).add(heroPos);
          c0.addScaledVector(patchRay, -(c0.y - 0.5) / patchRay.y);
          if (pool > 0) {                                               // one pool on the floor under the hull, drawn out toward us as the low sun would draw it
            c0.z = lerp(c0.z, zc + (c0.z - zc) * 2.2 - 16, pool);
            const xc = valleyC(c0.z); c0.x = lerp(c0.x, xc + 17 * Math.tanh((c0.x - xc) / 17), pool);
          }
          const gy = ground(c0.x, c0.z), fy = ground(valleyC(c0.z), c0.z), on = gy - fy < 2;
          // the light lies on the valley floor only: where it would land on a riser the sheet stays level and runs into the riser's foot
          patchPos[o] = c0.x; patchPos[o + 1] = (on ? gy : fy) + 0.35; patchPos[o + 2] = c0.z;
          patchUv[o + 2] = on ? k : 0;
        }
      }
      patchGeo.attributes.position.needsUpdate = true; patchGeo.attributes.aUv.needsUpdate = true;
    }
    const hq = new THREE.Quaternion();
    function update(dt, time, camera, u) {
      U.uTime.value = time; U.uU.value = u;
      camP.setFromMatrixPosition(camera.matrixWorld);
      sky.position.copy(camP); U.uCam.value.copy(camP);
      const e = camera.projectionMatrix.elements;
      ctx.renderer.getDrawingBufferSize(size);
      U.uPx.value = e[5] * size.y * 0.5; U.uPix.value = 2 / Math.max(e[5] * size.y, 64);
      hero.setProgress(heroU(u)); hero.update(dt, time, camera);
      hero.bodyNow(U.uHullP.value, hq); U.uHullP.value.applyQuaternion(heroQ).add(heroPos); U.uHullA.value.set(0, 0, 1).applyQuaternion(hq).applyQuaternion(heroQ);
      U.uHullK.value = smoothstep(0.28, 0.46, u);
      placePatches();
      if (rare) {
        const n = rareCurve.length - 1, ur = heroU(u); let t = 1;
        if (ur <= rareCurve[0][0]) t = 0; else for (let i = 0; i < n; i++) if (ur < rareCurve[i + 1][0]) { t = (i + (ur - rareCurve[i][0]) / (rareCurve[i + 1][0] - rareCurve[i][0])) / n; break; }
        rareSpline.getPoint(t, rp); rareSpline.getPoint(Math.min(1, t + 0.01), rn);
        rq.copy(rq0);
        if (ur > 0.655 && rn.distanceToSquared(rp) > 1e-4) { m4.lookAt(rn, rp, UP); rq1.setFromRotationMatrix(m4); rq.slerpQuaternions(rq0, rq1, smoothstep(0.655, 0.7, ur)); }
        rp.y += Math.sin(time * 0.9) * 0.6;
        U.uRareP.value.copy(rp); U.uRareQ.value.set(rq.x, rq.y, rq.z, rq.w);
      }
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.start), projectionMatrix: new THREE.Matrix4().makePerspective(-1, 1, 0.6, -0.6, 1, 100) }, 0);

    const info = { kit: kit.name, hour: hour.name, weather: ['still', 'breeze', 'swarf fall'][weather], flyers: flyersMade, striders: rings.length + 7, sheets, herd, wings: nWings, rare };
    const GAZE_DROP = 18;
    const pace = (u) => {
      let p = lerp(1.13, 1.07, smoothstep(0.12, 0.18, u));
      p = lerp(p, 0.87, smoothstep(0.28, 0.36, u)); p = lerp(p, 0.75, smoothstep(0.43, 0.5, u));
      p = lerp(p, 1.1, smoothstep(0.65, 0.73, u)); return lerp(p, 1.0, smoothstep(0.82, 0.9, u));
    };
    // the gaze rests on the Longwing's hull; over the top bar it rises a little toward the raised wings so all four stay in frame
    // where the gaze rests: on the Longwing, eased over a short stretch of u so the lift and the crossing do not jerk the view,
    // and held some way under it while it is over the top bar, so the view is tipped about 29 degrees and no more
    const gazeT = V3(0, 0, 0);
    const gazeAt = (time, u, raw) => {
      if (raw) return gazeT.copy(longwingAt(heroU(u)));
      gazeT.copy(longwingAt(heroU(u))).multiplyScalar(2).add(longwingAt(heroU(Math.max(0, u - 0.015)))).add(longwingAt(heroU(Math.min(1, u + 0.015)))).multiplyScalar(0.25);
      gazeT.y -= GAZE_DROP * smoothstep(84, 150, gazeT.y) * (1 - smoothstep(0.60, 0.68, u));
      gazeT.y += 31 * smoothstep(0.65, 0.705, u) * (1 - smoothstep(0.89, 0.95, u));     // down the valley the gaze rides above the hull, so the raised wings stay in the frame
      return gazeT;
    };
    return {
      scene, path, duration: 44, pace,
      title: 'Still on the Sprue',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 26, sway: 0.6, bank: 0.6 },
      // the gaze goes with the Longwing: lightly while it is built, hard as it clears the top bar (eight stacked, so the
      // steady camera, which takes a third of each, still holds all of it), then down the dark valley as it leads us
      pois: [{ at: gazeAt, from: 0.25, to: 0.70, weight: 0.62, fade: 0.24 }, { at: gazeAt, from: 0.56, to: 0.97, weight: 0.6, fade: 0.15 },
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ at: gazeAt, from: 0.518 + i * 0.0045, to: 0.71 - i * 0.0045, weight: 0.85, fade: 0.45 })),
        { at: gazeAt, from: 0.72, to: 0.87, weight: 0.6, fade: 0.35 }],
      portal: { shape: 'circle', radius: 7, color: kit.portal, glow: 1, revealDistance: 420 },
      post: { exposure: 1, bloom: { strength: 0.12, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.12, contrast: 1.06, tint: '#ffffff', shadowTint: '#000000', vignette: 0.16, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', info, heroU,
      update,
      dispose() { hero.dispose(); },
    };
  },
};
