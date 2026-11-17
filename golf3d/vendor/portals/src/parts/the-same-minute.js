// The Same Minute: the central device. ONE CAR, DRAWN FIVE TIMES on a line that crosses itself.
// Everything here is driven by u (0..1 along the path); only steam, tugging balloons and preening doves run on time.
import * as THREE from 'three';

// [cure1] THE MAY PETALS' NEAR LAW, one switch: 1 a petal's drawn radius goes smoothly to nothing as it comes near the eye (whole
// from 2.5 m, gone inside 0.6 m: the kit's figures for small falling things, the owner's word of 8 October 13:15); 0 leaves the
// petal shader's text and uniforms exactly as live's.
export const PETAL_NEAR = 1;

// ---------------------------------------------------------------- the line
export const LEN = 840;          // metres of route, measured along the rail (slopes included)
export const GAP = 0.42;         // another of us is always this far ahead and behind
export const LENS = 3.4;         // the lens rides this far above the rail
export const RUNIN = 56;         // the hoop stands this far behind the entry point on the line produced (the brief's 16 m hid it behind the ring from the hairpin; at 56 the third car is out of it, steaming, by u 0.79)
export const BACK = RUNIN + 2;   // the bed starts here
const PMIN = -BACK / LEN;        // a slot with PMIN <= p < 0 is on the run-in from the hoop
const D1 = 190.0;                // entry point -> diamond, first pass
const LOOP = 322.8;              // the teardrop round the knoll
const D2 = D1 + LOOP;            // 512.8: diamond, second pass  (= D1 - 30 + 0.42 x 840)
// rail height at rail distance s: level 60 m, 11 degrees to the diamond, 14 over the knoll, 6 down to the last straight
const HN = [[-40, 20], [0, 20], [60, 20], [215, 51], [351.4, 86], [487.8, 48.62], [780, 18], [900, 18]];
function hLin(s) {
  s = Math.max(-40, Math.min(899, s));
  for (let i = 0; i < HN.length - 1; i++) {
    if (s <= HN[i + 1][0]) { const a = HN[i], b = HN[i + 1]; return a[1] + ((b[1] - a[1]) * (s - a[0])) / (b[0] - a[0]); }
  }
  return 18;
}
export function railY(s) {   // kinks rounded over 15 m either side; both passes of the diamond stay at exactly 46
  return (hLin(s - 15) + 2 * hLin(s - 7.5) + 3 * hLin(s) + 2 * hLin(s + 7.5) + hLin(s + 15)) / 9;
}
// Rail distance is measured up and down the slopes, the plan is drawn on the map: G[s] is the ground distance covered
// after s metres of rail, so that the two passes of the diamond fall at exactly 190.0 and 512.8 m of rail.
const G = new Float32Array(LEN + 2);
for (let i = 1; i < G.length; i++) { const dy = railY(i) - railY(i - 1); G[i] = G[i - 1] + Math.sqrt(Math.max(1 - dy * dy, 0.01)); }
const ground = (s) => { if (s <= 0) return s; const i = Math.min(Math.floor(s), LEN), f = s - i; return G[i] + (G[i + 1] - G[i]) * f; };
const A = Math.atan2(0.42, 0.91);                 // each leg is 24.8 degrees off the fall line
const G1 = ground(D1), GL = ground(D2) - G1, G2 = G1 + GL;   // the same three lengths on the map
const LT = GL / (2 + Math.tan(A) * (Math.PI + 2 * A));     // straight part of each side of the teardrop
const RL = LT * Math.tan(A);                      // radius of the teardrop's round end
const CZ = -LT / Math.cos(A);                     // its centre (0, CZ)
// Exit: 327.2 m of rail. The brief's hairpin (radius 40, 150 degrees) put the ring's rim inside the right edge of the
// entry frame on a wide screen; radius 34 and 150 degrees puts the ring 53 m east of the entry point, 63 degrees off the entry
// axis (out of that frame), and aims the last straight so that the car out of the hoop climbs 9 degrees beside the ring at u 0.90.
const RH = 34, HA = (150 * Math.PI) / 180, S3 = ground(LEN) - G2 - RH * HA - 60;      // hairpin radius and angle, exit straight

// plan position at rail distance s (may be below 0: the run-in from the hoop); mirror = -1 flips x
export function planAt(s, mirror = 1, out = { x: 0, z: 0 }) {
  const sa = Math.sin(A), ca = Math.cos(A), g = ground(s);
  let x, z;
  if (g <= G1) { const t = g - G1; x = sa * t; z = -ca * t; }
  else if (g <= G2) {
    const t = g - G1;
    if (t <= LT) { x = sa * t; z = -ca * t; }
    else if (t <= GL - LT) { const th = A - (t - LT) / RL; x = RL * Math.cos(th); z = CZ + RL * Math.sin(th); }
    else { const q = t - GL; x = sa * q; z = ca * q; }
  } else {
    const t = g - G2;
    if (t <= S3) { x = sa * t; z = ca * t; }
    else {
      const cx = sa * S3 - RH * ca, cz = ca * S3 + RH * sa;
      const th = -A + Math.min(t - S3, RH * HA) / RH;
      x = cx + RH * Math.cos(th); z = cz + RH * Math.sin(th);
      const over = t - S3 - RH * HA;
      if (over > 0) { x += -Math.sin(th) * over; z += Math.cos(th) * over; }
    }
  }
  out.x = x * mirror; out.z = z; return out;
}
// points for makePath (lens height), every 6 m
export function routePoints(mirror = 1) {
  const pts = [], o = { x: 0, z: 0 };
  for (let i = 0; i <= 140; i++) { const s = i * 6; planAt(s, mirror, o); pts.push([o.x, railY(s) + LENS, o.z]); }
  return pts;
}
// nearest point of the line in plan, both legs considered: { dist, y, s }
export function makeNearest(mirror = 1) {
  const N = 480, px = new Float32Array(N + 1), pz = new Float32Array(N + 1), py = new Float32Array(N + 1), o = { x: 0, z: 0 };
  for (let i = 0; i <= N; i++) { const s = -BACK + (i / N) * (LEN + BACK); planAt(s, mirror, o); px[i] = o.x; pz[i] = o.z; py[i] = railY(s); }
  return (x, z) => {
    // low: the lowest bed within reach, allowed to rise 0.3 m per metre away from it (steeper than any gradient of the line): where the two legs meet at
    // different slopes the ground is carved to the lower one, and the other rides on its ballast shoulder
    let best = 1e12, bi = 0, low = 1e9;
    for (let i = 0; i <= N; i++) {
      const dx = px[i] - x, dz = pz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; }
      if (d < 196) { const c = py[i] + 0.3 * Math.sqrt(d); if (c < low) low = c; }
    }
    // refine against the two neighbouring segments
    let bd = Math.sqrt(best), by = py[bi];
    for (let j = Math.max(0, bi - 1); j < Math.min(N, bi + 1); j++) {
      const ax = px[j], az = pz[j], bx = px[j + 1] - ax, bz = pz[j + 1] - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / Math.max(bx * bx + bz * bz, 1e-6)));
      const dx = ax + bx * t - x, dz = az + bz * t - z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < bd) { bd = d; by = py[j] + (py[j + 1] - py[j]) * t; }
    }
    return { dist: bd, y: by, low, s: -BACK + (bi / N) * (LEN + BACK) };
  };
}
export const DIAMOND = { s1: D1, s2: D2, y: 46, knollZ: CZ, loopR: RL, apexZ: CZ - RL };

// ---------------------------------------------------------------- small geometry helpers
const _c = new THREE.Color();
function paint(geo, hex, m4) {           // non-indexed copy with a flat vertex colour, transformed
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (m4) g.applyMatrix4(m4);
  _c.set(hex);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); col.set(g.attributes.color.array, o);
    o += g.attributes.position.count * 3; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function at(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
// a painted thing's own light is its paint's colour: cream stays cream in its own shade, glass and iron stay dark
function selfLit(mat) {
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
  mat.customProgramCacheKey = () => 'tsm-selflit'; return mat;
}
const box = (w, h, d, hex, m) => paint(new THREE.BoxGeometry(w, h, d), hex, m);
const cyl = (r0, r1, h, seg, hex, m) => paint(new THREE.CylinderGeometry(r0, r1, h, seg), hex, m);

// The car. Local frame: +Z forward (the path tangent), +Y up, +X the traveller's LEFT (world up x tangent).
// So the brass pole at the front right corner is at x = -0.9, z = +2.0. Origin on the rail head.
export const CS = 1.5;            // every car is drawn half as big again as the brief's toy: 6.3 m long, 3.9 m to the roof
const BS = 1.35;                 // and its string and balloon with it
export const POLE_TOP = new THREE.Vector3(-0.9, 2.9, 2.0);
export const FUNNEL_TOP = new THREE.Vector3(0, 3.05, -1.55);
async function carGeometry(pal, withPole, pause) {   // pause: ctx.yield, so that no stretch of this holds the page
  const P = [], DK = '#2c2f2e', GLASS = '#2f4450', LINE = pal.brass;
  // running gear: underframe, sole bars, four spoked wheels with tyres and hubs, axle boxes, springs, guard irons
  P.push(box(1.6, 0.22, 4.0, '#3a3d3c', at(0, 0.60, 0)));
  for (const x of [-0.86, 0.86]) P.push(box(0.08, 0.2, 4.1, '#454947', at(x, 0.66, 0)));
  for (const z of [-1.15, 1.15]) {
    P.push(cyl(0.06, 0.06, 1.6, 6, '#1f2120', at(0, 0.4, z, 0, 0, Math.PI / 2)));
    await pause();
    for (const x of [-0.5, 0.5]) {   // the wheels sit on the rails (0.72 m either side) once the car is scaled
      P.push(cyl(0.4, 0.4, 0.12, 16, '#262928', at(x, 0.4, z, 0, 0, Math.PI / 2)));
      P.push(cyl(0.33, 0.33, 0.16, 16, '#4a4e4c', at(x, 0.4, z, 0, 0, Math.PI / 2)));
      P.push(cyl(0.1, 0.1, 0.24, 8, '#191b1a', at(x, 0.4, z, 0, 0, Math.PI / 2)));
      P.push(box(0.1, 0.26, 0.3, DK, at(x * 1.25, 0.46, z)));                               // axle box
      P.push(box(0.06, 0.07, 0.9, '#1f2120', at(x * 1.25, 0.62, z)));                       // leaf spring
    }
  }
  for (const z of [-2.12, 2.12]) {
    P.push(box(1.96, 0.24, 0.2, DK, at(0, 0.6, z)));                                        // buffer beams
    P.push(cyl(0.11, 0.11, 0.2, 8, '#55595a', at(0, 0.6, z + Math.sign(z) * 0.18, Math.PI / 2, 0, 0)));
    for (const x of [-0.72, 0.72]) P.push(box(0.05, 0.4, 0.05, '#1f2120', at(x, 0.32, z, 0.3 * Math.sign(z), 0, 0)));
  }
  await pause();
  // body: rocker panel, waist panel with a brass lining band, eight windows a side under a cant rail
  P.push(box(1.9, 0.3, 3.76, pal.roof, at(0, 0.86, 0)));
  P.push(box(2.0, 0.72, 3.7, pal.cream, at(0, 1.3, 0)));
  P.push(box(2.03, 0.045, 3.73, LINE, at(0, 1.02, 0)));
  P.push(box(2.05, 0.07, 3.76, pal.roof, at(0, 1.68, 0)));
  P.push(box(1.86, 0.62, 3.56, GLASS, at(0, 2.02, 0)));
  await pause();
  for (let i = 0; i < 5; i++) for (const x of [-0.96, 0.96]) P.push(box(0.09, 0.66, 0.11, pal.cream, at(x, 2.02, -1.8 + i * 0.9)));
  for (const z of [-1.8, 1.8]) for (const x of [-0.5, 0, 0.5]) P.push(box(0.08, 0.66, 0.09, pal.cream, at(x, 2.02, z * 1.003)));
  for (const x of [-0.955, 0.955]) for (let i = 0; i < 4; i++) P.push(box(0.03, 0.035, 0.74, '#d9cba6', at(x, 2.21, -1.35 + i * 0.9)));   // top-light bars
  P.push(box(2.04, 0.12, 3.74, pal.cream, at(0, 2.38, 0)));                                 // cant rail
  P.push(box(2.0, 0.6, 0.07, pal.cream, at(0, 1.98, -1.83)));                               // rear bulkhead (the funnel end)
  P.push(box(0.5, 0.3, 0.05, GLASS, at(-0.45, 2.05, -1.875))); P.push(box(0.5, 0.3, 0.05, GLASS, at(0.45, 2.05, -1.875)));
  await pause();
  // roof: an arched canopy overhanging both ends, a clerestory with vents, gutter
  { const r = new THREE.CylinderGeometry(1.17, 1.17, 4.36, 14, 1, false, Math.PI / 2, Math.PI);
    P.push(paint(r, pal.roof, at(0, 2.42, 0, Math.PI / 2, 0, 0, 1, 1, 0.2))); }
  P.push(box(2.3, 0.05, 4.4, '#cdbd92', at(0, 2.43, 0)));
  P.push(box(0.9, 0.16, 3.0, pal.cream, at(0, 2.66, 0.25)));
  P.push(box(1.0, 0.04, 3.1, pal.roof, at(0, 2.75, 0.25)));
  for (let i = 0; i < 5; i++) for (const x of [-0.455, 0.455]) P.push(box(0.02, 0.09, 0.4, GLASS, at(x, 2.66, -0.95 + i * 0.6)));
  await pause();
  // the funnel at the rear: black, with a brass cap ring; a brass dome and a lamp at the front
  P.push(cyl(0.2, 0.26, 0.2, 12, '#161616', at(0, 2.56, -1.55)));
  P.push(cyl(0.19, 0.2, 0.5, 12, '#161616', at(0, 2.86, -1.55)));
  P.push(cyl(0.27, 0.2, 0.1, 12, '#161616', at(0, 3.0, -1.55)));
  P.push(cyl(0.285, 0.285, 0.035, 12, LINE, at(0, 3.05, -1.55)));
  P.push(paint(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), LINE, at(0, 2.62, -0.75)));
  P.push(cyl(0.13, 0.13, 0.16, 10, LINE, at(0, 1.0, 2.2, Math.PI / 2, 0, 0)));
  P.push(cyl(0.1, 0.1, 0.03, 10, '#fff4d0', at(0, 1.0, 2.29, Math.PI / 2, 0, 0)));
  await pause();
  // dash panels at each end, a step either side
  P.push(box(1.96, 0.5, 0.06, pal.cream, at(0, 1.2, 1.9))); P.push(box(1.96, 0.5, 0.06, pal.cream, at(0, 1.2, -1.9)));
  for (const x of [-1.04, 1.04]) for (const z of [-1.5, 1.5]) P.push(box(0.22, 0.04, 0.5, DK, at(x, 0.52, z)));
  if (withPole) {                                                                          // the brass pole, front right
    P.push(cyl(0.045, 0.06, 2.2, 8, pal.brass, at(-0.9, 1.8, 2.0)));
    P.push(cyl(0.1, 0.1, 0.08, 8, pal.brass, at(-0.9, 0.74, 2.0)));
    P.push(paint(new THREE.SphereGeometry(0.085, 8, 6), pal.brass, at(-0.9, 2.9, 2.0)));
  }
  await pause();
  return merge(P);
}

// ---------------------------------------------------------------- shared shader pieces
const FOG_PARS = /* glsl */`
uniform vec3 uFogColor; uniform float uFogDensity;
vec3 withFog(vec3 c, float d) { float f = 1.0 - exp(-uFogDensity * uFogDensity * d * d); return mix(c, uFogColor, clamp(f, 0.0, 1.0)); }`;

// the balloon: a camera-facing shaded disc, never under uMinPx pixels across, never darkened, never fogged
const BALLOON_VERT = /* glsl */`
attribute vec3 aCenter; attribute float aSize; attribute float aAlpha;
uniform vec2 uRes; uniform float uMinPx;
varying vec2 vUv; varying float vAlpha;
void main() {
  vUv = position.xy; vAlpha = step(0.001, aAlpha);   // full red until it is gone: aAlpha shrinks the disc, it never fades it
  vec4 mv = viewMatrix * modelMatrix * vec4(aCenter, 1.0);
  vec4 clip = projectionMatrix * mv;
  float w = max(abs(clip.w), 1e-4);
  float rpx = 0.5 * aSize * projectionMatrix[1][1] / w * uRes.y * 0.5;     // radius in pixels
  rpx = max(rpx, 0.5 * uMinPx) * clamp(aAlpha, 0.0, 1.0);
  clip.xy += position.xy * rpx * 2.0 / max(uRes, vec2(1.0)) * clip.w * vec2(1.0, 1.12);   // a little taller than wide
  gl_Position = clip;
}`;
const BALLOON_FRAG = /* glsl */`
uniform vec3 uRed; varying vec2 vUv; varying float vAlpha;
void main() {
  vec2 p = vUv; float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float z = sqrt(max(1.0 - r2, 0.0));
  float lit = 0.80 + 0.20 * clamp(dot(vec3(p, z), vec3(0.45, 0.6, 0.66)), 0.0, 1.0);    // unlit plus a breath of form
  float spec = smoothstep(0.90, 0.99, dot(vec3(p, z), vec3(0.38, 0.52, 0.765)));
  vec3 c = uRed * lit + vec3(0.25, 0.2, 0.2) * spec;
  c *= mix(0.72, 1.0, smoothstep(0.0, 0.35, z));                                        // a darker red rim keeps the edge hard
  gl_FragColor = vec4(c, vAlpha * (1.0 - smoothstep(0.92, 1.0, r2)));
}`;

// strings: a ribbon from aA to aB with sag, never thinner than 1.5 px
const STRING_VERT = /* glsl */`
attribute vec3 aA; attribute vec3 aB; attribute float aSag; attribute float aAlpha;
uniform vec2 uRes;
varying float vAlpha;
vec3 pt(float t) { return mix(aA, aB, t) - vec3(0.0, aSag * sin(3.14159 * t), 0.0); }
void main() {
  vAlpha = aAlpha;
  float t = position.y;
  vec4 c0 = projectionMatrix * viewMatrix * modelMatrix * vec4(pt(t), 1.0);
  vec4 c1 = projectionMatrix * viewMatrix * modelMatrix * vec4(pt(t + 0.05), 1.0);
  float w0 = max(abs(c0.w), 1e-4), w1 = max(abs(c1.w), 1e-4);
  vec2 d = (c1.xy / w1 - c0.xy / w0) * uRes;
  float dl = length(d);
  vec2 n = dl > 1e-3 ? vec2(-d.y, d.x) / dl : vec2(1.0, 0.0);
  float px = max(0.03 * projectionMatrix[1][1] / w0 * uRes.y * 0.5, 1.5) * step(0.001, aAlpha);
  c0.xy += n * position.x * px / max(uRes, vec2(1.0)) * c0.w;
  gl_Position = c0;
}`;
const STRING_FRAG = /* glsl */`
uniform vec3 uColor; varying float vAlpha;
void main() { gl_FragColor = vec4(uColor, vAlpha); }`;

// cloud shadows sliding uphill (-z) at 6 m/s: shared with the world's turf and grass shaders so bed and turf darken
// together. Big soft-edged pools, a couple of hundred metres across, about a third of the down in shade at any time.
export const CLOUD_GLSL = /* glsl */`
float cloudShade(vec2 p, float t) {
  p += vec2(-160.0, 120.0 + 6.0 * t);
  p += 38.0 * vec2(sin(p.y * 0.0061 + 0.4), sin(p.x * 0.0053 + 1.9));
  float n = sin(p.x * 0.0098 + 1.3) * sin(p.y * 0.0083 + 0.7) + 0.50 * sin(p.x * 0.0210 - p.y * 0.0160 + 2.1) + 0.16 * sin(p.x * 0.047 + p.y * 0.039);
  return smoothstep(0.20, 0.72, n);
}`;
// cast shadows, drawn by whatever they fall on (turf, grass, ballast): no shadow map and no floating quads. Each caster is
// a capsule in plan, swept from its foot along the direction the light travels by its height over tan(sun elevation).
export const CAST_GLSL = /* glsl */`
uniform vec4 uCars[4];    // xyz: each other car at rail level, w: its presence 0..1
uniform vec4 uStill[2];   // x, z, radius, height of the things that stand still: the hut, the thorn
uniform vec4 uCast;       // xy: unit direction shadows fall in plan, z: metres of shadow per metre of height, w: 1
uniform vec4 uGate;       // the gate arm's shadow, a thin segment on the ground: xy one end, zw the other (it swings with the arm)
uniform vec4 uGatePost;   // and its post's
float segShade(vec2 p, vec4 sg, float r) {
  vec2 a = sg.xy, b = sg.zw - a; float t = clamp(dot(p - a, b) / max(dot(b, b), 1e-3), 0.0, 1.0);
  return 1.0 - smoothstep(r, r + 0.3, length(p - a - b * t));
}
float capShade(vec2 q, float len, float r0, float r1) {
  float t = clamp(dot(q, uCast.xy) / max(len, 1e-3), 0.0, 1.0);
  float d = length(q - uCast.xy * len * t), r = mix(r0, r1, t);
  return 1.0 - smoothstep(r * 0.62, r * 1.08 + 0.2, d);
}
float castShade(vec3 w) {
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 q = w.xz - uCars[i].xz;
    float body = capShade(q, 4.0 * uCast.z, 2.4, 1.9);
    float plume = capShade(q, 30.0 * uCast.z, 1.5, 5.0) * 0.42;      // the plume's long soft streak
    s = max(s, uCars[i].w * max(body, plume) * (1.0 - smoothstep(4.0, 16.0, abs(w.y - uCars[i].y))));
  }
  for (int i = 0; i < 2; i++) s = max(s, capShade(w.xz - uStill[i].xy, uStill[i].w * uCast.z, uStill[i].z, uStill[i].z * 0.8));
  s = max(s, 0.85 * max(segShade(w.xz, uGate, 0.12), segShade(w.xz, uGatePost, 0.16)));
  return s;
}`;
const LIGHT_PARS = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol; uniform vec3 uShadowTone;
vec3 lightOn(vec3 n) { return uSunCol * max(dot(n, uSunDir), 0.0) + mix(uGndCol, uSkyCol, 0.5 + 0.5 * n.y); }`;

// steam: soft white discs placed on the CPU, at least uMinPx wide
const STEAM_VERT = /* glsl */`
attribute vec4 aPS; attribute float aAlpha;
uniform vec2 uRes; uniform float uMinPx;
varying vec2 vUv; varying float vAlpha; varying float vDist;
void main() {
  vUv = position.xy; vAlpha = aAlpha;
  vec4 mv = viewMatrix * modelMatrix * vec4(aPS.xyz, 1.0);
  vec4 clip = projectionMatrix * mv;
  float w = max(abs(clip.w), 1e-4);
  float rpx = 0.5 * aPS.w * projectionMatrix[1][1] / w * uRes.y * 0.5;
  rpx = max(rpx, 0.5 * uMinPx) * step(0.001, aAlpha);
  clip.xy += position.xy * rpx * 2.0 / max(uRes, vec2(1.0)) * clip.w;
  vDist = length(mv.xyz);
  gl_Position = clip;
}`;
const STEAM_FRAG = /* glsl */`
${FOG_PARS}
uniform vec3 uSteam; uniform vec3 uSteamShade;
varying vec2 vUv; varying float vAlpha; varying float vDist;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  float body = 1.0 - r2;
  vec3 c = mix(uSteamShade, uSteam, clamp(0.55 + 0.5 * vUv.y + 0.25 * vUv.x, 0.0, 1.0));
  gl_FragColor = vec4(withFog(c, vDist * 0.22), vAlpha * smoothstep(0.0, 0.72, body));
}`;

// the bed: white chalk ballast with a shoulder, two polished rails and timber sleepers that melt into the bed's mean
// tone with distance; never under 3 px wide
const TRACK_VERT = /* glsl */`
attribute vec3 aSide; attribute float aU; attribute float aS;
uniform vec2 uRes;
varying float vX; varying float vS; varying vec3 vWorld; varying float vDist; varying vec3 vSide;
void main() {
  vec4 c0 = projectionMatrix * viewMatrix * vec4(position, 1.0);
  vec4 c1 = projectionMatrix * viewMatrix * vec4(position + aSide * 1.7, 1.0);
  float w0 = max(abs(c0.w), 1e-4), w1 = max(abs(c1.w), 1e-4);
  vec2 d = (c1.xy / w1 - c0.xy / w0) * uRes * 0.5;          // the half width on screen, in pixels
  float dl = length(d);
  vec2 dir = dl > 1e-3 ? d / dl : vec2(0.0, 1.0);
  float grow = max(1.6 - dl, 0.0);                           // what is missing to reach 1.6 px each side
  float sg = sign(aU), out1 = step(1.01, abs(aU));           // the outer vertices are the foot of the shoulder, 1.1 m down
  vec3 wp = position + aSide * 1.7 * aU - vec3(0.0, 0.75 * out1, 0.0);
  vec4 c = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  c.xy += dir * sg * grow * 2.0 / max(uRes, vec2(1.0)) * c.w * step(0.0, c0.w);
  vX = aU * 1.7; vS = aS; vWorld = wp; vSide = aSide * sg;
  vDist = w0;
  gl_Position = c;
}`;
const TRACK_FRAG = /* glsl */`
${FOG_PARS}
${LIGHT_PARS}
${CLOUD_GLSL}
${CAST_GLSL}
uniform vec3 uChalk; uniform vec3 uRail; uniform vec3 uSleeper; uniform vec3 uMean; uniform vec3 uFoot; uniform float uTime; uniform float uGain;
varying float vX; varying float vS; varying vec3 vWorld; varying float vDist; varying vec3 vSide;
float hash2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  float ax = abs(vX);
  float near = 1.0 - smoothstep(40.0, 70.0, vDist);
  float close = 1.0 - smoothstep(10.0, 34.0, vDist);
  vec2 q = vec2(vX, vS);
  float stone = vnoise(q * 14.0), stone2 = vnoise(q * 5.0 + 3.1), drift = vnoise(q * vec2(0.9, 0.22) + 7.0);
  float grit = smoothstep(0.25, 0.75, vnoise(q * 47.0 + 11.0)), chip = smoothstep(0.35, 0.65, vnoise(q * 23.0 + 5.0));
  float tight = 1.0 - smoothstep(4.0, 20.0, vDist);
  float peb = mix(0.5, mix(stone * 0.6 + stone2 * 0.4, chip * 0.55 + grit * 0.45, tight * 0.7), close);
  vec3 c = uChalk * (0.80 + 0.26 * peb + 0.08 * drift);                       // broken chalk: every stone its own white
  c = mix(c, c * vec3(0.93, 0.92, 0.84), smoothstep(0.55, 0.8, drift) * 0.5);  // older, rain-stained drifts
  // sleepers: weathered timber, grain along their length, a dark joint where they bed into the ballast
  float sp = abs(fract(vS / 1.25) - 0.5) * 1.25;
  float sl = (1.0 - smoothstep(0.115, 0.135, sp)) * (1.0 - smoothstep(1.08, 1.12, ax));
  float bedj = (1.0 - smoothstep(0.135, 0.19, sp)) * (1.0 - smoothstep(1.10, 1.16, ax)) * (1.0 - sl);
  float grain = vnoise(vec2(vX * 3.0 + floor(vS / 1.25) * 7.3, vS * 60.0));
  vec3 wood = uSleeper * (0.72 + 0.5 * grain) * (0.9 + 0.25 * hash2(vec2(floor(vS / 1.25), 3.0)));
  c = mix(c, c * 0.62, bedj * 0.8);
  c = mix(c, wood, sl * 0.92);
  // rails: a rusty web, a foot shadow on the side away from the sun, and a polished head that carries the sky
  float rd = ax - 0.72;
  float web = 1.0 - smoothstep(0.050, 0.075, abs(rd));
  float head = 1.0 - smoothstep(0.012, 0.032, abs(rd));
  float sdot = dot(vSide, uSunDir) * sign(vX + 1e-5);
  float rds = vX - sign(vX + 1e-5) * 0.72;
  float shd = (1.0 - smoothstep(0.0, 0.2, abs(rds + sign(sdot + 1e-4) * 0.14))) * (1.0 - web);
  c = mix(c, c * 0.60, shd * 0.7);
  c = mix(c, uRail * (0.8 + 0.3 * stone2), web);
  float chair = (1.0 - smoothstep(0.09, 0.12, abs(rd))) * (1.0 - smoothstep(0.07, 0.09, sp)) * (1.0 - web);
  c = mix(c, uRail * 0.6, chair);
  vec3 n = vec3(0.0, 1.0, 0.0);
  // the shoulder: ballast spilling down to the turf, lit on one side and blue-green on the other
  float sh = smoothstep(1.62, 1.78, ax);
  vec3 ns = normalize(vSide * 0.62 + vec3(0.0, 0.80, 0.0));
  n = normalize(mix(n, ns, sh) + vec3((stone - 0.5) * 0.5 * close, 0.0, (stone2 - 0.5) * 0.5 * close));
  float foot = smoothstep(1.95, 2.6, ax + (stone2 - 0.5) * 0.7 + (drift - 0.5) * 0.5);
  c = mix(c, mix(uChalk * (0.70 + 0.36 * peb), uFoot * (0.8 + 0.4 * stone), foot), sh);
  c = mix(mix(uMean, mix(uMean * 0.9, uFoot, foot), sh), c, near);
  float cs = cloudShade(vWorld.xz, uTime);
  vec3 fill = mix(uGndCol, uSkyCol, 0.5 + 0.5 * n.y); fill = mix(fill, vec3(dot(fill, vec3(0.3, 0.5, 0.2))) * vec3(1.0, 0.99, 0.95), 0.6 * (1.0 - foot * sh));   // chalk in shade is a cool white, not a blue
  float shd2 = castShade(vWorld);
  vec3 lit = uSunCol * (max(dot(n, uSunDir), 0.0) * 0.8 + 0.2) * (1.0 - 0.60 * cs) * (1.0 - 0.80 * shd2) + fill * (1.0 - 0.10 * shd2);
  vec3 col = c * mix(uGain, 1.0, foot * sh) * lit;
  col = mix(col, col * vec3(0.50, 0.60, 0.66), shd2);                                   // a shadow across the white line is blue-green, and plain to see
  col += (uSkyCol * 1.5 + uSunCol * 0.25) * head * near * (0.75 + 0.25 * stone2) * (1.0 - 0.5 * cs) * (1.0 - 0.6 * shd2);    // the bright running line of the railhead
  gl_FragColor = vec4(withFog(col, vDist), 1.0);
}`;

// doves: 40 instanced, each on a fixed seeded curve parametrised by uE; they flap in the vertex shader
const DOVE_VERT = /* glsl */`
attribute vec3 aRoof; attribute vec4 aSeed; attribute float aWing;
uniform float uE; uniform float uTime; uniform float uHand; uniform vec3 uHut; uniform vec2 uRes; uniform float uMinPx;
varying float vShade; varying float vDist;
void main() {
  float f = clamp((uE + 45.0) / 245.0, 0.0, 1.0);
  float fi = clamp((f - 0.05 * aSeed.x) / 0.95, 0.0, 1.0);
  float w = smoothstep(0.0, 0.10, fi) * (1.0 - smoothstep(0.80, 1.0, fi));
  // The wheel is a tight one, just seaward of the hut: 11 m and more from the second leg, 7 m and more from the entry leg.
  // Its pace is one function of e (q): off the roof and round to the line side by e -12 (in the sky beside the stranger's
  // plume for the car coming up, beside the earlier self for the car coming down), then on round the seaward side, so at
  // e 0 it is in the upper car's frame over the hut and has just left the lower car's. No bird comes near either lens.
  float R = 4.3 + 1.4 * aSeed.y;
  float q = 0.5 * fi + 0.5 * smoothstep(0.03, 0.26, fi);
  float ph = 6.28318 * q + (aSeed.w - 0.5) * 0.3;
  float hs = sin(ph * 0.5);
  vec3 C = uHut + vec3(-uHand * 0.5, 1.5 + 2.6 * aSeed.z + 1.6 * hs * hs, 9.0);
  vec3 a = vec3(0.0, 0.0, -1.0), b = vec3(uHand, 0.0, 0.0);
  vec3 fly = C + R * (cos(ph) * a + sin(ph) * b) + vec3(0.0, 0.8 * sin(ph * 2.0 + aSeed.x * 6.0), 0.0);
  vec3 sit = aRoof + vec3(0.06 * sin(uTime * 0.9 + aSeed.x * 40.0), 0.0, 0.05 * sin(uTime * 0.7 + aSeed.y * 31.0));
  vec3 P = mix(sit, fly, w);
  vec3 hd = mix(vec3(sin(aSeed.w * 6.28 + 0.4 * sin(uTime * 0.5 + aSeed.z * 9.0)), 0.0, cos(aSeed.w * 6.28)), -sin(ph) * a + cos(ph) * b, smoothstep(0.0, 0.3, w));
  hd = hd / max(length(hd), 1e-3);
  vec3 sd = vec3(hd.z, 0.0, -hd.x);
  float flap = sin(uTime * 15.0 + aSeed.x * 6.28) * 0.95;
  float open = mix(0.22, 1.0, smoothstep(0.0, 0.2, w));            // wings folded on the roof, a preening flick now and then
  open += 0.5 * smoothstep(0.93, 1.0, sin(uTime * 0.8 + aSeed.y * 50.0)) * (1.0 - w);
  vec3 lp = position;
  float tip = abs(aWing);
  lp.x *= mix(1.0, open, step(0.01, tip));
  lp.y += tip * abs(lp.x) * flap * mix(0.2, 1.0, w) * 1.2;
  vec4 mv0 = viewMatrix * vec4(P, 1.0);
  float dist = max(-mv0.z, 0.1);
  float px = 0.875 * projectionMatrix[1][1] / dist * uRes.y * 0.5;   // wingspan in pixels
  float sc = max(1.0, uMinPx / max(px, 1e-3));
  vec3 wp = P + (sd * lp.x + vec3(0.0, 1.0, 0.0) * lp.y + hd * lp.z) * sc * 1.25;   // like the cars, larger than life
  vShade = 0.86 + 0.14 * clamp(lp.y * 4.0 + 0.5, 0.0, 1.0) - 0.34 * tip * step(flap, 0.0) * w - 0.20 * tip * tip;   // grey under the lifted wing: they show against cloud too
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const DOVE_FRAG = /* glsl */`
${FOG_PARS}
uniform vec3 uDove; varying float vShade; varying float vDist;
void main() { gl_FragColor = vec4(withFog(uDove * vShade, vDist * 0.5), 1.0); }`;

// ---------------------------------------------------------------- the device
// opts: { path, mirror: 1|-1, pal, light: {uSunDir,uSunCol,uSkyCol,uGndCol,uShadowTone}, fog: {uFogColor,uFogDensity},
//         heightAt(x,z), wind: +1 (plumes lean seaward) | -1 (onshore: they lean uphill), rare, detail, time: {value} }
export async function buildHero(ctx, opts = {}) {
  const { path, mirror = 1, pal, heightAt, wind = 1, rare = false } = opts;
  const detail = opts.detail ?? 1;
  const object = new THREE.Group();
  const uRes = { value: new THREE.Vector2(800, 450) };
  const uTime = opts.time || { value: 0 };
  const uE = { value: 400 };
  const shared = { uRes, uTime, uE, ...opts.light, ...opts.fog, ...opts.cast };
  const PD2 = D2 / LEN;                                   // 0.6105: the diamond on the second leg, as a share of the journey
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const start = path.pointAt(0), startT = path.tangentAt(0); startT.y = 0; startT.normalize();
  // where a car is at share p of the journey (p may run a little below 0: the run-in from the hoop). Not path.frameAt.
  function poseAt(p, m4) {
    if (p < 0) { P.copy(start).addScaledVector(startT, p * path.length); Z.copy(startT); }
    else { path.pointAt(Math.min(p, 1), P); path.tangentAt(Math.min(p, 1), Z); }
    P.y -= LENS;
    X.crossVectors(UP, Z).normalize(); Y.crossVectors(Z, X).normalize();
    if (m4) m4.makeBasis(X, Y, Z).setPosition(P);
    return P;
  }
  const local = (v, out) => out.copy(P).addScaledVector(X, v.x * CS).addScaledVector(Y, v.y * CS).addScaledVector(Z, v.z * CS);

  // --- the bed: one ribbon from the hoop to the ring
  {
    const n = Math.floor((LEN + BACK) / 2) + 1, pos = new Float32Array(n * 12), side = new Float32Array(n * 12), au = new Float32Array(n * 4), as = new Float32Array(n * 4);
    const a = { x: 0, z: 0 }, b = { x: 0, z: 0 }, idx = [], AU = [-1.6, -1, 1, 1.6];
    for (let i = 0; i < n; i++) {
      const s = -BACK + i * 2; planAt(s - 0.5, mirror, a); planAt(s + 0.5, mirror, b);
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, y = railY(s) - 0.06 + (s > 350 ? 0.035 : 0);   // the second leg lies a hair over the first at the diamond
      for (let k = 0; k < 4; k++) {
        const o = (i * 4 + k) * 3;
        pos[o] = (a.x + b.x) / 2; pos[o + 1] = y; pos[o + 2] = (a.z + b.z) / 2;
        side[o] = tz / tl; side[o + 1] = 0; side[o + 2] = -tx / tl;
        au[i * 4 + k] = AU[k]; as[i * 4 + k] = s;
      }
      if (i < n - 1) for (let k = 0; k < 3; k++) { const v = i * 4 + k; idx.push(v, v + 1, v + 4, v + 1, v + 5, v + 4); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSide', new THREE.BufferAttribute(side, 3));
    g.setAttribute('aU', new THREE.BufferAttribute(au, 1)); g.setAttribute('aS', new THREE.BufferAttribute(as, 1)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      uniforms: { ...shared, uGain: { value: opts.chalkGain || 1.5 }, uChalk: { value: new THREE.Color(pal.chalk).multiplyScalar(0.82) }, uRail: { value: new THREE.Color('#8C8F8A').multiplyScalar(0.7) },
        uSleeper: { value: new THREE.Color('#8a7a62') }, uFoot: { value: new THREE.Color(pal.turf).multiplyScalar(0.95) }, uMean: { value: new THREE.Color(pal.chalkMean).multiplyScalar(0.8) } },
      vertexShader: TRACK_VERT, fragmentShader: TRACK_FRAG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    });
    const bed = new THREE.Mesh(g, m); bed.frustumCulled = false; bed.renderOrder = 1; object.add(bed);
  }
  await ctx.yield();

  // --- five cars, one model. Slot 2 (k = 0) is ours: its body is never drawn.
  const SLOTS = [-2 * GAP, -GAP, 0, GAP, 2 * GAP];
  const lambert = new THREE.MeshLambertMaterial({ vertexColors: true });
  // a breath of cream of their own, so the shaded side of a car seen against the light is still the cream of the car seen in sun
  const carMat = selfLit(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#ffffff').multiplyScalar((opts.carGlow || 0.17) * 1.25) }));
  const carGeo = await carGeometry(pal, true, () => ctx.yield());
  await ctx.yield();
  const cars = new THREE.InstancedMesh(carGeo, carMat, 5);
  cars.frustumCulled = false; cars.instanceMatrix.setUsage(THREE.DynamicDrawUsage); object.add(cars);
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), M = new THREE.Matrix4(), MS = new THREE.Matrix4();
  for (let i = 0; i < 5; i++) cars.setMatrixAt(i, ZERO);
  // their shadows (and the hut's and the thorn's) are drawn by the turf, the grass and the bed themselves: see CAST_GLSL.
  // The world owns the three uniforms; update() writes where the four other cars stand.
  const cast = opts.cast;
  await ctx.yield();

  // --- the keeper's hut, the fixed witness, in the angle between the two legs; and the gate arm across the entry leg
  const hutX = -16 * mirror, hutZ = -4;   // 4 m up the slope from the brief's spot (out of the frame at the gasp). The sight line from the second leg to our earlier self sweeps across this angle at u 0.57 to 0.59:
  // the hut stands low (a shallow roof, its floor a step down in the turf) so the car's roof, its balloon and its plume show over it all the way
  const hutY = heightAt(hutX, hutZ) - 0.35;
  await ctx.yield();
  // local +X of the hut looks toward the crossing (the door side), so its whitewashed front is what both legs see
  const SL = '#6C7A84', SL2 = '#5d6a74', hutParts = [
    box(3.3, 0.5, 3.3, '#8d9690', at(0, 0.1, 0)),                                           // tarred flint plinth
    box(3, 2.5, 3, pal.white, at(0, 1.45, 0)),
    box(3.06, 0.12, 3.06, '#e2ded2', at(0, 2.66, 0)),                                       // eaves board
    paint(new THREE.ConeGeometry(2.62, 0.6, 4, 1), SL, at(0, 3.0, 0, 0, Math.PI / 4, 0)),
    paint(new THREE.ConeGeometry(2.7, 0.12, 4, 1), SL2, at(0, 2.76, 0, 0, Math.PI / 4, 0)),
    box(0.5, 0.6, 0.5, pal.white, at(-0.7, 3.0, -0.6)), box(0.6, 0.08, 0.6, SL2, at(-0.7, 3.33, -0.6)),
    cyl(0.11, 0.14, 0.22, 8, '#8a8f8c', at(-0.7, 3.46, -0.6)),   // a grey pot: no red, orange or pink in this world
    box(0.08, 1.9, 0.9, '#51606b', at(1.51, 1.15, 0.5)), box(0.1, 2.0, 0.08, '#dcd8cc', at(1.52, 1.2, 0.0)), box(0.1, 2.0, 0.08, '#dcd8cc', at(1.52, 1.2, 1.0)),
    box(0.1, 0.08, 1.08, '#dcd8cc', at(1.52, 2.18, 0.5)), box(0.5, 0.14, 1.2, '#8d9690', at(1.7, 0.28, 0.5)),
    box(0.06, 0.06, 0.06, pal.brass, at(1.57, 1.15, 0.82)),
    box(0.08, 0.8, 0.8, '#2f4450', at(1.51, 1.75, -0.75)), box(0.1, 0.06, 0.94, '#dcd8cc', at(1.53, 1.33, -0.75)), box(0.1, 0.8, 0.05, '#dcd8cc', at(1.53, 1.75, -0.75)), box(0.1, 0.05, 0.8, '#dcd8cc', at(1.53, 1.75, -0.75)),
    box(0.8, 0.8, 0.08, '#2f4450', at(0, 1.75, 1.51)), box(0.94, 0.06, 0.1, '#dcd8cc', at(0, 1.33, 1.53)), box(0.05, 0.8, 0.1, '#dcd8cc', at(0, 1.75, 1.53)), box(0.8, 0.05, 0.1, '#dcd8cc', at(0, 1.75, 1.53)),
    box(0.8, 0.8, 0.08, '#2f4450', at(0, 1.75, -1.51)), box(0.94, 0.06, 0.1, '#dcd8cc', at(0, 1.33, -1.53)), box(0.05, 0.8, 0.1, '#dcd8cc', at(0, 1.75, -1.53)),
    box(1.5, 0.08, 0.34, '#7d8a80', at(0.2, 0.62, 1.8)), box(0.08, 0.4, 0.3, '#7d8a80', at(-0.45, 0.4, 1.8)), box(0.08, 0.4, 0.3, '#7d8a80', at(0.85, 0.4, 1.8)),   // the keeper's bench
    cyl(0.05, 0.05, 2.9, 6, '#dcd8cc', at(1.9, 1.6, -1.9)), box(0.26, 0.34, 0.26, '#3a4248', at(1.9, 3.15, -1.9)), box(0.34, 0.05, 0.34, SL2, at(1.9, 3.35, -1.9)),   // an unlit lamp on a white post
  ];
  await ctx.yield();
  // the halt's yard: a white paling round a square of garden (nothing taller than the hut stands here: from the second leg
  // the sight line to our earlier self passes over this roof)
  {
    const PAL = '#f4f1e6', Y0 = 4.0;
    const X1 = 3.3, NP = 26;
    for (let i = 0; i <= NP; i++) {
      const t = -Y0 + (i / NP) * 2 * Y0, tx = -Y0 + (i / NP) * (Y0 + X1), hgt = 0.9 + 0.07 * (i % 2);
      for (const [x, z] of [[tx, Y0], [tx, -Y0], [-Y0, t]]) hutParts.push(box(0.065, hgt, 0.05, PAL, at(x, 0.42, z)));
      if (Math.abs(t - 0.5) > 1.0) hutParts.push(box(0.05, hgt, 0.065, PAL, at(X1, 0.42, t)));       // a gap for the gate, before the door
    }
    for (const yy of [0.28, 0.7]) { hutParts.push(box(Y0 + X1, 0.06, 0.04, PAL, at((X1 - Y0) / 2, yy, Y0)), box(Y0 + X1, 0.06, 0.04, PAL, at((X1 - Y0) / 2, yy, -Y0)), box(0.04, 0.06, 2 * Y0, PAL, at(-Y0, yy, 0)),
      box(0.04, 0.06, Y0 - 0.5, PAL, at(X1, yy, -(Y0 + 0.5) / 2)), box(0.04, 0.06, Y0 - 1.5, PAL, at(X1, yy, (Y0 + 1.5) / 2))); }
    await ctx.yield();
  }
  await ctx.yield();
  const hutGeo = merge(hutParts);
  await ctx.yield();
  const hutMat = selfLit(new THREE.MeshLambertMaterial({ vertexColors: true, color: '#eeeeee', emissive: new THREE.Color('#ffffff').multiplyScalar((opts.hutGlow || 0.17) * 1.2) }));   // whitewash stays white in its own shade
  const HS = 1.0;                                          // the brief's 3 m hut: the earlier self and its balloon show over its roof all the way down the second leg
  const hut = new THREE.Mesh(hutGeo, hutMat); hut.position.set(hutX, hutY, hutZ); hut.scale.set(HS, HS * 0.85, HS);
  hut.rotation.y = mirror > 0 ? 0 : Math.PI; object.add(hut);
  cast.uStill.value[0].set(hutX, hutZ, 2.1 * HS, 3.0 * HS);
  const g0 = planAt(D1 - 8, mirror), g1 = planAt(D1 - 7, mirror);
  const gdx = g1.x - g0.x, gdz = g1.z - g0.z;                 // heading of the entry leg at the gate
  const gate = new THREE.Group();
  const lx = gdz, lz = -gdx;                                   // unit vector from track centre to the traveller's LEFT on the entry leg: the pivot stands there on either hand, so the lifted arm never rises in front of our balloon (which rides right)
  gate.position.set(g0.x + lx * 2.6, railY(D1 - 8) + 1.15, g0.z + lz * 2.6);
  gate.rotation.y = Math.atan2(lz, -lx);                       // local +X runs from the pivot across the track
  const armParts = [];
  // a pole a quarter of a metre thick in short black and white bands, a round white target with a black centre near its
  // tip and a small iron counterweight (nothing black and blocky at its foot)
  for (let i = 0; i < 13; i++) { const hh = 0.25 - 0.003 * i; armParts.push(cyl(hh * 0.5, hh * 0.5, 0.412, 8, i % 2 ? '#16181a' : pal.white, at(-0.07 + 0.412 * i, 0, 0, 0, 0, Math.PI / 2))); }   // a quarter of a metre thick, black and white: one of the three signs that the two crossings are the same film
  armParts.push(cyl(0.3, 0.3, 0.05, 14, pal.white, at(4.55, 0, 0, Math.PI / 2, 0, 0)), cyl(0.13, 0.13, 0.06, 12, '#16181a', at(4.55, 0, 0, Math.PI / 2, 0, 0)));
  armParts.push(box(0.5, 0.26, 0.2, '#56636e', at(-0.5, 0, 0)));           // the counterweight
  const arm = new THREE.Mesh(merge(armParts), selfLit(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#ffffff').multiplyScalar(0.34) }))); gate.add(arm);
  const cdir = cast.uCast.value;
  cast.uGatePost.value.set(gate.position.x, gate.position.z, gate.position.x + cdir.x * 1.3 * cdir.z, gate.position.z + cdir.y * 1.3 * cdir.z);
  const ARM = 5.35, setGateShadow = (th) => {      // the arm from its pivot (1.15 m up) to its tip, thrown onto the ground
    const c = Math.cos(th) * ARM, h1 = 1.15 + Math.sin(th) * ARM;
    cast.uGate.value.set(gate.position.x + cdir.x * 1.15 * cdir.z, gate.position.z + cdir.y * 1.15 * cdir.z, gate.position.x - lx * c + cdir.x * h1 * cdir.z, gate.position.z - lz * c + cdir.y * h1 * cdir.z);
  };
  // a stout post with the crossing's white saltire on it, and a forked rest across the line where the arm's tip lands
  const post = new THREE.Mesh(merge([
    box(0.24, 2.2, 0.24, pal.white, at(0, -0.5, -0.3)), box(0.26, 0.4, 0.26, '#56636e', at(0, -1.3, -0.3)), cyl(0.0, 0.2, 0.22, 4, '#5d6a74', at(0, 0.71, -0.3, 0, Math.PI / 4, 0)),
    box(0.18, 1.3, 0.18, pal.white, at(5.12, -0.86, 0)), box(0.2, 0.26, 0.2, '#56636e', at(5.12, -1.34, 0)),
    box(0.07, 0.34, 0.07, pal.white, at(5.12, -0.1, 0.17)), box(0.07, 0.34, 0.07, pal.white, at(5.12, -0.1, -0.17)),
  ]), lambert); gate.add(post);
  object.add(gate);

  await ctx.yield();
  // --- the hoop the cars roll out of: plain white iron, 15 m across, RUNIN m behind the entry point on the line produced
  const hp = planAt(-RUNIN, mirror), hq = planAt(-RUNIN + 1, mirror);
  const hoopMat = new THREE.ShaderMaterial({
    uniforms: { ...opts.light, ...opts.fog, uWhite: { value: new THREE.Color(pal.white) } },
    vertexShader: /* glsl */`varying vec3 vN; varying float vDist;
      void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`${FOG_PARS}
      uniform vec3 uWhite; uniform vec3 uSunDir; uniform vec3 uSunCol; varying vec3 vN; varying float vDist;
      void main() {
        vec3 n = vN / max(length(vN), 1e-3);
        float k = 0.5 + 0.5 * dot(n, uSunDir);
        vec3 c = uWhite * (0.62 + 0.30 * k) + uWhite * uSunCol * 0.16 * k * k;      // white paint: its own shade is a pale grey, never dark
        gl_FragColor = vec4(withFog(c, vDist * 2.4), 1.0);                            // it stands back in the haze from the far legs
      }`,
  });
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.62, 10, 56), hoopMat);
  hoop.position.set(hp.x, railY(-RUNIN) + 6.6, hp.z); hoop.rotation.y = Math.atan2(hq.x - hp.x, hq.z - hp.z); object.add(hoop);
  const hoopT = new THREE.Vector3(hq.x - hp.x, 0, hq.z - hp.z).normalize();   // the way the cars roll out of it
  const NHS = 9;                                                             // loose curds of steam drifting out of the hoop
  await ctx.yield();

  // --- balloons and strings. World set: one per other car (slots -2,-1,+1,+2), carried until e = -12 then free;
  //     plus, on the rare visit, seven from laps before ours that never faded.
  const quad = new THREE.PlaneGeometry(2, 2);
  const LAPS = rare ? [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [-2, -1, 1, 2];
  const NB = LAPS.length;
  const minPx = ctx.quality && ctx.quality.mobile ? 8 : 11;     // a far self's balloon is never under this many pixels across
  const balloonMat = new THREE.ShaderMaterial({
    uniforms: { uRes, uMinPx: { value: minPx }, uRed: { value: new THREE.Color(pal.red) } },
    vertexShader: BALLOON_VERT, fragmentShader: BALLOON_FRAG, transparent: true, depthWrite: true,
  });
  const stringMat = new THREE.ShaderMaterial({
    uniforms: { uRes, uColor: { value: new THREE.Color('#f4f1e6').multiplyScalar(0.8) } },
    vertexShader: STRING_VERT, fragmentShader: STRING_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const stripGeo = new THREE.PlaneGeometry(2, 1, 1, 10); stripGeo.translate(0, 0.5, 0);      // x -1..1 across, y 0..1 along
  function balloonSet(n) {
    const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
    const c = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), sz = new THREE.InstancedBufferAttribute(new Float32Array(n), 1), al = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    c.setUsage(THREE.DynamicDrawUsage); sz.setUsage(THREE.DynamicDrawUsage); al.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aCenter', c); g.setAttribute('aSize', sz); g.setAttribute('aAlpha', al); g.instanceCount = n;
    const mesh = new THREE.Mesh(g, balloonMat); mesh.frustumCulled = false; mesh.renderOrder = 6;
    return { mesh, c, sz, al };
  }
  function stringSet(n) {
    const g = new THREE.InstancedBufferGeometry(); g.index = stripGeo.index; g.setAttribute('position', stripGeo.attributes.position);
    const a = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), b = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const sag = new THREE.InstancedBufferAttribute(new Float32Array(n), 1), al = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    for (const x of [a, b, sag, al]) x.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aA', a); g.setAttribute('aB', b); g.setAttribute('aSag', sag); g.setAttribute('aAlpha', al); g.instanceCount = n;
    const mesh = new THREE.Mesh(g, stringMat); mesh.frustumCulled = false; mesh.renderOrder = 5;
    return { mesh, a, b, sag, al };
  }
  const wb = balloonSet(NB), ws = stringSet(4);
  object.add(wb.mesh, ws.mesh);
  // the point in the air where every balloon is let go: the pole top of a car 12 m short of the diamond, plus its string
  poseAt(PD2 - 12 / LEN);
  const REL = local(POLE_TOP, new THREE.Vector3()).addScaledVector(UP, 2.7 * BS).addScaledVector(Z, -1.1 * BS);
  const windZ = wind;                                        // +1: released balloons drift seaward; -1: uphill, after us

  // --- steam: plumes for the four other cars, and the two whistle puffs of whichever car is in the event
  const NPL = Math.max(14, Math.round(24 - 25 * (1 - detail)));
  const NS = 4 * NPL + 10 + NHS;
  const PUFF = [[0, 0, 0, 1], [0.9, 0.5, 0.3, 0.7], [-0.8, 0.6, -0.2, 0.75], [0.3, 1.1, 0.5, 0.6], [-0.3, -0.5, -0.4, 0.65]];   // a whistle puff is a small curd of five
  function steamSet(n, minpx) {
    const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
    const ps = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), al = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    ps.setUsage(THREE.DynamicDrawUsage); al.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aPS', ps); g.setAttribute('aAlpha', al); g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: { ...shared, uMinPx: { value: minpx }, uSteam: { value: new THREE.Color(pal.steam).multiplyScalar(1.22) }, uSteamShade: { value: new THREE.Color(pal.steamShade) } },
      vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4;
    return { mesh, ps, al };
  }
  const steam = steamSet(NS, 7);
  object.add(steam.mesh);
  const WH = [-50, -36].map((e) => { poseAt(PD2 + e / LEN); return local(FUNNEL_TOP, new THREE.Vector3()); });   // where each whistle is blown
  const jit = new Float32Array(NPL * 2); { const r = ctx.rng.fork('steam'); for (let i = 0; i < jit.length; i++) jit[i] = r(); }
  await ctx.yield();

  // --- forty doves on the hut roof
  const dv = [];
  const tri = (ax, ay, az, bx, by, bz, cx, cy, cz, w) => dv.push([ax, ay, az, w[0]], [bx, by, bz, w[1]], [cx, cy, cz, w[2]]);
  // a bird, not a shard: a spindle of a body, a fanned tail, and wings in two parts (shoulder to wrist, wrist to a swept tip)
  tri(0, 0.01, 0.19, 0.055, 0.0, 0.04, 0, 0.06, 0.02, [0, 0, 0]); tri(0, 0.01, 0.19, 0, 0.06, 0.02, -0.055, 0.0, 0.04, [0, 0, 0]);
  tri(0.055, 0.0, 0.04, 0, 0.01, -0.14, 0, 0.06, 0.02, [0, 0, 0]); tri(-0.055, 0.0, 0.04, 0, 0.06, 0.02, 0, 0.01, -0.14, [0, 0, 0]);
  tri(0, 0.01, 0.19, -0.055, 0.0, 0.04, 0.055, 0.0, 0.04, [0, 0, 0]); tri(0.055, 0.0, 0.04, -0.055, 0.0, 0.04, 0, 0.01, -0.14, [0, 0, 0]);
  tri(0, 0.012, -0.11, 0.075, 0.012, -0.30, -0.075, 0.012, -0.30, [0, 0, 0]);
  for (const sg of [1, -1]) {
    tri(0.04 * sg, 0.03, 0.09, 0.19 * sg, 0.04, 0.07, 0.04 * sg, 0.03, -0.08, [0, 0.45 * sg, 0]);
    tri(0.19 * sg, 0.04, 0.07, 0.17 * sg, 0.03, -0.10, 0.04 * sg, 0.03, -0.08, [0.45 * sg, 0.4 * sg, 0]);
    tri(0.19 * sg, 0.04, 0.07, 0.40 * sg, 0.03, -0.07, 0.17 * sg, 0.03, -0.10, [0.45 * sg, sg, 0.4 * sg]);
  }
  const dg = new THREE.InstancedBufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dv.flatMap((v) => [v[0], v[1], v[2]])), 3));
  dg.setAttribute('aWing', new THREE.BufferAttribute(new Float32Array(dv.map((v) => v[3])), 1));
  const ND = 40, roof = new Float32Array(ND * 3), seed = new Float32Array(ND * 4), dr = ctx.rng.fork('doves');
  for (let i = 0; i < ND; i++) {
    const a = dr.range(-1, 1), b = dr.range(-1, 1), top = 1 - Math.max(Math.abs(a), Math.abs(b));
    roof[i * 3] = hutX + a * 1.55 * HS; roof[i * 3 + 1] = hutY + (2.70 + (0.162 + 0.838 * top) * 0.6) * HS * 0.85 + 0.05; roof[i * 3 + 2] = hutZ + b * 1.55 * HS;
    seed[i * 4] = dr(); seed[i * 4 + 1] = dr(); seed[i * 4 + 2] = dr(); seed[i * 4 + 3] = dr();
  }
  dg.setAttribute('aRoof', new THREE.InstancedBufferAttribute(roof, 3)); dg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); dg.instanceCount = ND;
  const doves = new THREE.Mesh(dg, new THREE.ShaderMaterial({
    uniforms: { ...shared, uHand: { value: mirror }, uHut: { value: new THREE.Vector3(hutX, hutY, hutZ) }, uMinPx: { value: 8 }, uDove: { value: new THREE.Color('#ffffff').multiplyScalar(0.86) } },
    vertexShader: DOVE_VERT, fragmentShader: DOVE_FRAG, side: THREE.DoubleSide,
  }));
  doves.frustumCulled = false; object.add(doves);

  // --- OUR pole, string and balloon: carried with the lens, under one group (see shots/the-same-minute/carried.txt)
  const carried = new THREE.Group(); carried.name = 'carried'; carried.matrixAutoUpdate = false; object.add(carried);
  const poleGeo = new THREE.CylinderGeometry(1, 1.25, 1, 8); poleGeo.translate(0, 0.5, 0);
  const brass = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(pal.brass).multiplyScalar(0.3) });
  const pole = new THREE.Mesh(paint(poleGeo, pal.brass), brass); pole.frustumCulled = false; carried.add(pole);
  const knob = new THREE.Mesh(paint(new THREE.SphereGeometry(1, 10, 8), pal.brass), brass); knob.frustumCulled = false; carried.add(knob);
  // the BOW of our own car, right across the bottom of the frame: the cream dash of every car on the line, a brass
  // handrail on stanchions along its top and the brass pole planted in its front right corner. It runs out past both
  // edges of the frame (no ends in view), so it reads as the vehicle we ride. Frame units: x half-widths, y half-heights.
  let bonnet;
  {
    const NXB = 64, pos = [], col = [], idx = [], cc = new THREE.Color();
    const topY = (t) => -0.835 - 0.10 * t * t, bowZ = (t) => -4.0 + 0.55 * t * t;
    // the dash: capping, then the panel falling away under the frame
    const ROWS = [[-0.07, 0.0, '#cdbd92'], [0.0, -0.014, '#fff6dc'], [0.03, -0.034, pal.cream], [0.36, -0.20, pal.cream], [0.40, -0.215, '#cdbd92'], [0.44, -0.23, pal.roof], [1.3, -0.75, pal.roof]];
    for (let r = 0; r < ROWS.length; r++) for (let i = 0; i <= NXB; i++) {
      const t = (i / NXB) * 2 - 1;
      pos.push(t * 1.3, topY(t) + ROWS[r][1], bowZ(t) + ROWS[r][0]);
      cc.set(ROWS[r][2]); const plank = (r >= 2 && r <= 3 && i % 4 === 0 ? 0.66 : 1) * (r >= 5 ? 0.9 : 1); col.push(cc.r * plank, cc.g * plank, cc.b * plank);
    }
    for (let r = 0; r < ROWS.length - 1; r++) for (let i = 0; i < NXB; i++) { const v = r * (NXB + 1) + i; idx.push(v, v + 1, v + NXB + 1, v + 1, v + NXB + 2, v + NXB + 1); }
    // the handrail: a brass tube drawn as a band of three tones (light above, shade below), and its stanchions
    const mkGeo = (pp, cl, ix) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pp), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cl), 3)); g.setIndex(ix); g.computeVertexNormals(); return g; };
    const dashG = mkGeo(pos, col, idx); pos.length = 0; col.length = 0; idx.length = 0;
    const quadAt = (x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3, c0, c1) => {
      const v = pos.length / 3; pos.push(x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3);
      cc.set(c0); col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b); cc.set(c1); col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    };
    const RY = 0.075, RT = 0.015, BR = ['#f1d27e', pal.brass, '#7a5a22'];
    for (let i = 0; i < NXB; i++) {
      const t0 = (i / NXB) * 2 - 1, t1 = ((i + 1) / NXB) * 2 - 1, x0 = t0 * 1.3, x1 = t1 * 1.3, y0 = topY(t0) + RY, y1 = topY(t1) + RY, z0 = bowZ(t0) + 0.02, z1 = bowZ(t1) + 0.02;
      quadAt(x0, y0 + RT, z0, x1, y1 + RT, z1, x0, y0, z0, x1, y1, z1, BR[0], BR[1]);
      quadAt(x0, y0, z0, x1, y1, z1, x0, y0 - RT, z0, x1, y1 - RT, z1, BR[1], BR[2]);
    }
    for (let k = -6; k <= 6; k++) {
      const t = k / 6.6 + 0.045, x = t * 1.3, y = topY(t), z = bowZ(t) + 0.015, w = 0.006;
      quadAt(x - w, y + RY, z, x + w, y + RY, z, x - w, y - 0.01, z, x + w, y - 0.01, z, pal.brass, '#7a5a22');
      quadAt(x - w * 2.2, y + 0.004, z, x + w * 2.2, y + 0.004, z, x - w * 2.2, y - 0.012, z, x + w * 2.2, y - 0.012, z, '#f1d27e', pal.brass);   // its foot
    }
    bonnet = new THREE.Mesh(dashG, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, color: '#8a8a8a', emissive: new THREE.Color('#F2DDB0').multiplyScalar(0.52) }));   // the dash faces us, away from the key: it carries its own cream
    const rail = new THREE.Mesh(mkGeo(pos, col, idx), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false })); rail.frustumCulled = false; bonnet.add(rail);
    bonnet.frustumCulled = false; carried.add(bonnet);
  }
  const socket = new THREE.Mesh(paint(new THREE.CylinderGeometry(1, 1.2, 1, 10), pal.brass), brass); socket.frustumCulled = false; carried.add(socket);
  const ob = balloonSet(1), os = stringSet(1), op = steamSet(2, 4);
  carried.add(ob.mesh, os.mesh, op.mesh);
  const parked = new THREE.Matrix4();
  { const f = startT.clone(), r = new THREE.Vector3().crossVectors(f, UP).normalize(); parked.makeBasis(r, UP, f.clone().negate()).setPosition(start); }
  const CD = 4;                                               // metres in front of the lens
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), vq = new THREE.Quaternion();
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const UPANG = (80 * Math.PI) / 180;
  // the gate arm as a function of e alone (the brief lifts it at e +40..+70, but the car on the entry leg reaches the arm
  // at e +22, so it lifts at e +6..+18: the crossing car's tail is clear of the diamond by then)
  function armAngle(e) {
    if (e <= -45 || e >= 18) return UPANG;
    if (e < -25) { const t = (e + 45) / 20; const f = t < 0.7 ? (t / 0.7) * (t / 0.7) : 1 - 0.13 * Math.sin((Math.PI * (t - 0.7)) / 0.3); return UPANG * (1 - f); }
    if (e < 6) return 0;
    return UPANG * smooth(6, 18, e);
  }
  // a released balloon jumps clear of its pole (5 m in the first 12 m of travel: it is against the sky as the car crosses),
  // hangs, then climbs 0.16 m per metre: 7.5 m up as the next car passes under it, as before
  const rise = (d) => { const q = Math.max(0, d - 35); return 5.0 * (1 - Math.exp(-d / 11)) + (0.16 * q * q) / (q + 25); };
  // and the air over the crossing carries it toward the entry line: on the mirrored hand right across it, so the lost balloon
  // never climbs through the corner where our own rides; on the other hand part of the way, so it stays in the frame over the diamond
  const CROSS = mirror > 0 ? 8 : -18, crossAt = (d) => CROSS * (1 - Math.exp(-Math.min(d, 340) / 30));
  const RISE340 = rise(340);
  const size = new THREE.Vector2(), camW = new THREE.Vector3();
  const state = { e: 400, other: new THREE.Vector3(), hut: new THREE.Vector3(hutX, hutY + 2, hutZ) };

  const DIRTY = [steam.ps, steam.al, ws.a, ws.b, ws.sag, ws.al, wb.c, wb.sz, wb.al], DIRTY2 = [ob.c, ob.sz, ob.al, os.a, os.b, os.sag, os.al, op.ps, op.al];
  function update(dt, time, camera, u) {
    ctx.renderer.getDrawingBufferSize(size); uRes.value.copy(size);
    uTime.value = time;
    camera.getWorldPosition(camW);
    // which car is inside the event window: one function E(e) for whoever it is
    let ev = 400;
    for (let i = 0; i < 5; i++) { const p = u + SLOTS[i], e = (p - PD2) * LEN; if (p >= PMIN && p <= 1 && e > -60 && e <= 230) ev = e; }
    uE.value = ev; state.e = ev;
    arm.rotation.z = armAngle(ev); setGateShadow(arm.rotation.z);

    // the cars, their shadows, plumes, balloons and strings
    let si = 0;
    for (let i = 0; i < 5; i++) {
      const p = u + SLOTS[i], e = (p - PD2) * LEN;
      const vis = i !== 2 && p >= PMIN && p <= 1;
      const slot = i < 2 ? i : i - 1;                         // 0..3 among the four other cars
      if (i === 2) continue;
      if (!vis) {
        cars.setMatrixAt(i, ZERO); cast.uCars.value[slot].set(0, -999, 0, 0);
        for (let j = 0; j < NPL; j++) steam.al.array[slot * NPL + j] = 0;
        ws.al.array[slot] = 0;
      } else {
        const grow = smooth(PMIN, PMIN + 0.008, p);
        poseAt(p, M); M.scale(_s.set(grow * CS, grow * CS, grow * CS)); cars.setMatrixAt(i, M);
        cast.uCars.value[slot].set(P.x, P.y, P.z, grow);
        if (i === 3) state.other.copy(P).addScaledVector(UP, 2.4 * CS);
        // plume: 22 m tall (the brief's 14 read as a wisp from the far legs), leaning back along the track; its phase runs on time so it boils at a halt too
        local(FUNNEL_TOP, va);
        // from far off a plume is drawn up to twice as wide and all but opaque: a solid white column, a cumulus edge, not a wisp
        const cd = camW.distanceTo(P), farK = smooth(70, 200, cd), wide = 1 + 1.0 * farK + 0.7 * smooth(200, 330, cd), dense = 0.86 + 0.12 * farK, tall = 30 * (1 + 0.45 * smooth(200, 330, cd));   // and half as tall again from across the down
        for (let j = 0; j < NPL; j++) {
          const a = (j / NPL + time * 0.42 + slot * 0.37) % 1, k = slot * NPL + j, a8 = Math.pow(a, 0.8);
          const wob = Math.sin(time * 1.3 + j * 2.1 + slot) * 0.5 * a;
          steam.ps.array[k * 4] = va.x - Z.x * 6.0 * a + X.x * wob + (jit[j * 2] - 0.5) * a * 1.6;
          steam.ps.array[k * 4 + 1] = va.y + tall * a8 * grow;
          steam.ps.array[k * 4 + 2] = va.z - Z.z * 6.0 * a + X.z * wob + windZ * (windZ > 0 ? 2.5 : 7) * a * a + (jit[j * 2 + 1] - 0.5) * a * 1.6;
          steam.ps.array[k * 4 + 3] = (1.5 + 5.6 * a) * grow * wide;
          steam.al.array[k] = dense * Math.min(a * 7, 1) * Math.pow(1 - a, 0.7 - 0.25 * farK) * grow;
        }
        // string: to the balloon while it is carried, bare and slack after e = -12
        local(POLE_TOP, va); const tug = Math.sin(time * 2.3 + i * 1.7) * 0.22, tug2 = Math.sin(time * 3.4 + i) * 0.15;
        if (e < -12) vb.copy(va).addScaledVector(UP, 2.15 * BS).addScaledVector(Z, -1.1 * BS + tug2).addScaledVector(X, tug);
        else vb.copy(va).addScaledVector(UP, -2.3 * BS).addScaledVector(Z, -1.5 * BS + tug2).addScaledVector(X, tug * 0.6);
        va.toArray(ws.a.array, slot * 3); vb.toArray(ws.b.array, slot * 3);
        ws.sag.array[slot] = e < -12 ? 0.06 : 0.3; ws.al.array[slot] = grow;
      }
    }
    for (let j = 0; j < NB; j++) {
      const lap = LAPS[j], p = u + GAP * lap, e = (p - PD2) * LEN;
      let alpha = 0;
      if (e < -12) {
        if (p >= PMIN) {
          poseAt(p); local(POLE_TOP, va); const tug = Math.sin(time * 2.3 + (lap + 2 + (lap > 0 ? 0 : 0)) * 1.7) * 0.22;
          const ii = lap + 2; const t1 = Math.sin(time * 2.3 + ii * 1.7) * 0.22, t2 = Math.sin(time * 3.4 + ii) * 0.15;
          vc.copy(va).addScaledVector(UP, 2.7 * BS).addScaledVector(Z, -1.1 * BS + t2).addScaledVector(X, t1 + tug * 0);
          alpha = smooth(PMIN, PMIN + 0.008, p);
        }
      } else {
        const d = e + 12;
        // 0.16 m up per metre of e. Past 340 m (after an ordinary balloon has faded) the climb eases and a cross wind takes
        // them, so the rare visit's old balloons hang in a slowly rising line slanting out over the sea beyond the hoop: seven
        // separate discs above the horizon from the top loop, and above the hoop and the ring from the hairpin
        const far = Math.max(0, d - 340);
        vc.copy(REL); vc.y += (d < 340 ? rise(d) : RISE340 + 0.012 * far) + Math.sin(time * 0.9 + lap) * 0.4;
        vc.z += windZ * (0.25 * Math.min(d, 340) + 0.12 * far); vc.x += Math.sin(time * 0.6 + lap * 2.0) * 0.6 - mirror * 0.14 * far + crossAt(d);
        alpha = rare ? 1 : 1 - smooth(255, 330, e);          // it dwindles, full red, and is gone: never a pink ghost
      }
      vc.toArray(wb.c.array, j * 3); wb.sz.array[j] = 1.2 * BS + 0.35 * smooth(-12, -4, e) * (1 - smooth(60, 120, e)); wb.al.array[j] = alpha;
    }
    // the two whistle puffs, hanging where they were blown
    for (let i = 0; i < 2; i++) {
      const age = ev - (i ? -36 : -50), on = age >= 0 && age < 60, g = Math.max(age, 0), sp = 1 + 0.014 * g;   // one curd that swells, not five balls drifting apart
      for (let j = 0; j < 5; j++) {
        const k = 4 * NPL + i * 5 + j, o = PUFF[j];
        steam.ps.array[k * 4] = WH[i].x + o[0] * sp; steam.ps.array[k * 4 + 1] = WH[i].y + 1.0 + 0.10 * g + o[1] * sp;
        steam.ps.array[k * 4 + 2] = WH[i].z + o[2] * sp + windZ * 0.03 * g; steam.ps.array[k * 4 + 3] = (2.3 + 0.07 * g) * o[3];
        steam.al.array[k] = on ? 0.9 * Math.min(age / 3, 1) * (1 - (age / 60) * (age / 60)) : 0;
      }
    }
    // loose steam drifting out of the hoop and up the wind: nine curds, each its own size and pace (no disc, no veil)
    for (let j = 0; j < NHS; j++) {
      const k = 4 * NPL + 10 + j, a = (j / NHS + time * (0.045 + 0.011 * (j % 3))) % 1, sd = ((j * 4) % NHS) / NHS - 0.5;
      steam.ps.array[k * 4] = hoop.position.x + hoopT.x * (0.5 + 5 * a) + hoopT.z * sd * 7 * (1 - 0.5 * a);
      steam.ps.array[k * 4 + 1] = hoop.position.y - 5.0 + 19 * a + Math.sin(time * 0.7 + j) * 0.5;       // up through the hoop and away over its top
      steam.ps.array[k * 4 + 2] = hoop.position.z + hoopT.z * (0.5 + 5 * a) - hoopT.x * sd * 7 * (1 - 0.5 * a) + windZ * 9 * a * a;
      steam.ps.array[k * 4 + 3] = 3.0 + 4.5 * a + (j % 2);
      steam.al.array[k] = 0.34 * Math.min(a * 5, 1) * (1 - a) * (1 - a);
    }
    cars.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < DIRTY.length; i++) DIRTY[i].needsUpdate = true;
    updateCarried(time, camera, u);
  }

  function updateCarried(time, camera, u) {
    // While u is 0 the world may be being drawn through the previous portal: park at the entry pose (no slicing, no jump).
    if (u > 0) { if (camera.matrixAutoUpdate) camera.updateMatrixWorld(); carried.matrix.copy(camera.matrixWorld); } else carried.matrix.copy(parked);
    const hh = CD * Math.tan(((camera.fov || 62) * Math.PI) / 360), hw = hh * (camera.aspect || 1.78);
    // On a tall screen the field of view is wide, and a frame 4 m off would reach below the rails: draw the whole group
    // nearer the eye by kc (scaling about the eye leaves the picture exactly as it was) so nothing carried sinks into the bed.
    const kc = Math.min(1, 2.75 / Math.max(hh, 1e-3));
    carried.matrix.scale(_s.set(kc, kc, kc));
    carried.matrixWorldNeedsUpdate = true;
    const e0 = (u - PD2) * LEN, r = Math.max(0, Math.min(1, (e0 + 12) / 36));
    const sx = (Math.sin(time * 1.9) * 0.024 + Math.sin(time * 3.1 + 1) * 0.012) * hh, sy = Math.sin(time * 2.6 + 0.5) * 0.012 * hh;
    // pole: up from under the lower right of the frame
    // Seen through the previous portal (u is exactly 0 then) from well behind the entry pose, the parked dash would be a board
    // hanging in the air: it is left out until we are aboard, and the pole stands on the ballast beside the rail holding the balloon.
    const aboard = u > 0; bonnet.visible = aboard; socket.visible = aboard;
    va.set(0.47 * hw + 0.012 * hh, aboard ? -0.875 * hh : -LENS / kc, -CD + 0.06); vb.set(0.46 * hw, -0.36 * hh, -CD);   // planted on the dash's capping
    pole.position.copy(va); vc.subVectors(vb, va); const len = vc.length();
    pole.quaternion.setFromUnitVectors(UP, vc.multiplyScalar(1 / Math.max(len, 1e-4))); pole.scale.set(0.013 * hh, len, 0.013 * hh);
    knob.position.copy(vb); knob.scale.setScalar(0.022 * hh);
    bonnet.scale.set(hw, hh, 1);
    socket.position.set(0.47 * hw + 0.012 * hh, -0.862 * hh, -CD + 0.07); socket.scale.set(0.026 * hh, 0.04 * hh, 0.026 * hh);
    // balloon: 30 percent in from the right edge, 24 percent down from the top, 7 percent of the frame's height
    let bx = 0.40 * hw + sx, by = 0.52 * hh + sy, alpha = 1;
    const rr = 1 - (1 - r) * (1 - r);                          // it goes at once, then slows: gone by the top of the frame in 24 m
    if (e0 >= -12) { by += 0.66 * hh * (0.35 * rr + 0.65 * r * r); bx -= 0.10 * hw * r; alpha = r >= 1 ? 0 : 1; }
    ob.c.array[0] = bx; ob.c.array[1] = by; ob.c.array[2] = -CD; ob.sz.array[0] = 0.14 * hh * kc; ob.al.array[0] = alpha;
    // string: taut to the balloon, then slack, then hanging bare from the pole top for the rest of the ride
    const k = smooth(0.03, 0.45, r), swing = Math.sin(time * 1.4) * 0.03 * hh;
    const hx = vb.x - 0.02 * hw + swing, hy = vb.y - 0.44 * hh;
    const tx = bx, ty = by - 0.075 * hh;
    vb.toArray(os.a.array, 0);
    os.b.array[0] = tx + (hx - tx) * k; os.b.array[1] = ty + (hy - ty) * k; os.b.array[2] = -CD;
    os.sag.array[0] = 0.015 * hh + 0.10 * hh * Math.sin(Math.PI * k); os.al.array[0] = 1;
    // our own two whistle puffs: up from under the frame and swept back past the lens
    for (let i = 0; i < 2; i++) {
      const age = e0 - (i ? -36 : -50), q = age / 24, on = q >= 0 && q < 1;
      const z = -7 + 6.3 * Math.max(0, Math.min(1, q)), hz = -z * Math.tan(((camera.fov || 62) * Math.PI) / 360);
      op.ps.array[i * 4] = (-0.34 + 0.3 * i) * hz * Math.min(camera.aspect || 1.78, 1.78); op.ps.array[i * 4 + 1] = (-1.2 + 0.75 * q) * hz; op.ps.array[i * 4 + 2] = z; op.ps.array[i * 4 + 3] = (0.8 + 0.9 * q) * hz * kc;
      op.al.array[i] = on ? 0.8 * Math.min(q * 6, 1) * (1 - q) : 0;
    }
    for (let i = 0; i < DIRTY2.length; i++) DIRTY2[i].needsUpdate = true;
  }

  // where the car in slot k (in shares of the journey ahead of us) is at u: for the world's points of interest
  const _car = new THREE.Vector3();
  function carAt(k, u, out = _car) { poseAt(Math.max(PMIN, Math.min(1, u + k))); return out.copy(P).addScaledVector(UP, 2.4 * CS); }

  return {
    object, carried, radius: 300, height: 100, center: new THREE.Vector3(0, 46, 0),
    anchors: { hut: state.hut, hoop: hoop.position, diamond: new THREE.Vector3(0, 46, 0), release: REL },
    state, carAt, PD2,
    update, dispose() { quad.dispose(); stripGeo.dispose(); },
  };
}

// ---------------------------------------------------------------- the dressing of the down
// Everything that stands beside the line and beyond it: telegraph poles and their wires, flowers, may and gorse, sheep,
// the far headlands, the stacks and their lighthouse, sails. None of it is red, orange or pink, none of it is on the line,
// and none of it knows about u: it is the place the one event happens in.
// opts: { mirror, pal, light, fog, time, groundAt(x,z), latAt(x,z), castDir: Vector4 (uCast), detail, evening }
export async function buildDressing(ctx, opts = {}) {
  const { mirror = 1, pal, groundAt, latAt } = opts, detail = opts.detail ?? 1;
  const object = new THREE.Group(), uRes = { value: new THREE.Vector2(800, 450) }, uTime = opts.time || { value: 0 };
  const lambert = new THREE.MeshLambertMaterial({ vertexColors: true });
  const a0 = { x: 0, z: 0 }, a1 = { x: 0, z: 0 }, m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), UPV = new THREE.Vector3(0, 1, 0);
  const size = new THREE.Vector2(), updaters = [], LEFT = { x: 0, z: 0, yaw: 0 };
  const beside = (s, off, out) => {          // a point off metres to the traveller's left of the line at rail distance s (the figure's hand flips it)
    planAt(s, mirror, a0); planAt(s + 1, mirror, a1); const tx = a1.x - a0.x, tz = a1.z - a0.z, l = Math.hypot(tx, tz) || 1;
    out.x = a0.x + (tz / l) * off * mirror; out.z = a0.z - (tx / l) * off * mirror; out.yaw = Math.atan2(tx, tz); return out;
  };

  // --- telegraph poles up the entry leg to the halt and down the exit leg to the hairpin, four wires sagging between them
  {
    const WOOD = '#4c4f4c', parts = [cyl(0.09, 0.15, 7.6, 7, WOOD, at(0, 3.5, 0)), box(1.9, 0.13, 0.13, WOOD, at(0, 6.9, 0)), box(1.3, 0.11, 0.11, WOOD, at(0, 6.3, 0)),
      box(0.06, 0.9, 0.06, WOOD, at(0.42, 6.55, 0.08, 0, 0, 0.75)), box(0.06, 0.9, 0.06, WOOD, at(-0.42, 6.55, 0.08, 0, 0, -0.75))];
    const INS = [[-0.85, 7.04], [0.85, 7.04], [-0.55, 6.43], [0.55, 6.43]];
    for (const [x, y] of INS) parts.push(cyl(0.055, 0.07, 0.16, 6, '#f4f1e6', at(x, y, 0)));
    const runs = [[-40, 110], [545, 695]], spots = [];   // fifty-metre spans; none within 80 m of the diamond (nothing stands beside the earlier self at the gasp)
    for (const [s0, s1] of runs) { const run = []; for (let s = s0; s <= s1; s += 50) { const o = beside(s, s0 < 300 ? 8.5 * mirror : 8.5, { x: 0, z: 0, yaw: 0 }); /* on the traveller's left on either hand: never in the corner where our balloon rides */ o.y = groundAt(o.x, o.z) - 0.2; run.push(o); } spots.push(run); }
    const n = spots[0].length + spots[1].length, poles = new THREE.InstancedMesh(merge(parts), lambert, n); let k = 0;
    const strip = new THREE.PlaneGeometry(2, 1, 1, 10); strip.translate(0, 0.5, 0);
    const nw = (n - 2) * INS.length, wa = new Float32Array(nw * 3), wb = new Float32Array(nw * 3), wsag = new Float32Array(nw), wal = new Float32Array(nw).fill(0.62); let w = 0;
    const tip = (o, i, out) => out.set(o.x + Math.cos(o.yaw) * INS[i][0], o.y + INS[i][1] + 0.1, o.z - Math.sin(o.yaw) * INS[i][0]);
    const va = new THREE.Vector3(), vb = new THREE.Vector3();
    for (const run of spots) for (let i = 0; i < run.length; i++) {
      const o = run[i]; m4.compose(va.set(o.x, o.y, o.z), q4.setFromAxisAngle(UPV, o.yaw), vb.set(1, 1, 1)); poles.setMatrixAt(k++, m4);
      if (i > 0) for (let j = 0; j < INS.length; j++) { tip(run[i - 1], j, va).toArray(wa, w * 3); tip(o, j, vb).toArray(wb, w * 3); wsag[w++] = 1.25 + 0.3 * (j % 2); }
    }
    poles.frustumCulled = false; object.add(poles);
    const wg = new THREE.InstancedBufferGeometry(); wg.index = strip.index; wg.setAttribute('position', strip.attributes.position);
    wg.setAttribute('aA', new THREE.InstancedBufferAttribute(wa, 3)); wg.setAttribute('aB', new THREE.InstancedBufferAttribute(wb, 3));
    wg.setAttribute('aSag', new THREE.InstancedBufferAttribute(wsag, 1)); wg.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(wal, 1)); wg.instanceCount = w;
    const wires = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: { uRes, uColor: { value: new THREE.Color('#57524a') } }, vertexShader: STRING_VERT.replace(', 1.5) * step', ', 1.0) * step'), fragmentShader: STRING_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    wires.frustumCulled = false; wires.renderOrder = 3; object.add(wires);
  }
  await ctx.yield();
  // --- flowers: drifts of ox-eye daisies and cowslips in the long grass either side of the line, nodding in the wind.
  // Each is one disc turned to the eye, never under a pixel across while it is near, sunk away by 60 to 90 m.
  {
    const NF = Math.round(15600 * detail), KZF = DIAMOND.knollZ, fp = new Float32Array(NF * 3), fr = new Float32Array(NF * 4), fg = new Float32Array(NF * 2), r = ctx.rng.fork('flowers'); let n = 0;
    for (let i = 0; i < NF; i++) {
      if (i % 600 === 599) await ctx.yield();
      const s = -30 + r() * 870, sd = r() < 0.5 ? -1 : 1, t = r(), off = sd * (2.6 + t * t * 34), r1 = r(), r2 = r(), r3 = r();
      // three in thirteen flower on the knoll inside the top loop: the empty place the gaze rests on is a meadow in flower
      // (nothing that stands, nothing that goes anywhere), and these are seen from the whole loop, so they sink away later
      const knoll = i % 13 < 3;
      if (knoll) { const ka = s * 0.0271, kr = 35 * Math.sqrt(t); LEFT.x = Math.cos(ka) * kr; LEFT.z = KZF + Math.sin(ka) * kr; } else beside(s, off, LEFT);
      const x = LEFT.x, z = LEFT.z;
      const drift = ctx.noise.fbm2(x * 0.021 + 3.1, z * 0.021 + 1.7, 2), gold = ctx.noise.fbm2(x * 0.013 + 9.3, z * 0.013 + 4.1, 2);
      if (drift < (knoll ? -0.3 : -0.12 + 0.25 * t) || latAt(x, z) < 2.5 || Math.abs(x) > 350 || z > 318) continue;
      fp[n * 3] = x; fp[n * 3 + 1] = groundAt(x, z); fp[n * 3 + 2] = z;
      fg[n * 2] = (groundAt(x + 1.5, z) - groundAt(x - 1.5, z)) / 3; fg[n * 2 + 1] = (groundAt(x, z + 1.5) - groundAt(x, z - 1.5)) / 3;
      fr[n * 4] = r1; fr[n * 4 + 1] = r2; fr[n * 4 + 2] = gold > (knoll ? 0.04 : 0.12) ? 0.6 + 0.4 * r3 : r3 * 0.55; fr[n * 4 + 3] = knoll ? 1 : 0; n++;
    }
    const g = new THREE.InstancedBufferGeometry(), qd = new THREE.PlaneGeometry(2, 2); g.index = qd.index; g.setAttribute('position', qd.attributes.position);
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(fp.slice(0, n * 3), 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(fr.slice(0, n * 4), 4)); g.setAttribute('aGrad', new THREE.InstancedBufferAttribute(fg.slice(0, n * 2), 2)); g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...opts.light, ...opts.fog, uRes, uTime, uWhite: { value: new THREE.Color('#f6f3ea') }, uGold: { value: new THREE.Color('#f2d24e') }, uWind: { value: opts.wind || 1 } },
      vertexShader: /* glsl */`
        ${CLOUD_GLSL}
        attribute vec3 aPos; attribute vec4 aRnd; attribute vec2 aGrad;
        uniform vec2 uRes; uniform float uTime; uniform float uWind; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uWhite; uniform vec3 uGold;
        varying vec2 vUv; varying vec3 vCol; varying vec3 vEye; varying float vDist; varying float vBig;
        void main() {
          vUv = position.xy;
          float gust = sin(uTime * 1.7 + aPos.x * 0.21 + aPos.z * 0.13) * 0.6 + sin(uTime * 2.9 + aRnd.y * 40.0) * 0.4;
          vec3 head = aPos + vec3(0.05 * gust * uWind, 0.34 + 0.26 * aRnd.x, -0.09 * gust * uWind);
          vec4 mv = viewMatrix * vec4(head, 1.0); vDist = length(mv.xyz);
          vec4 clip = projectionMatrix * mv; float w = max(abs(clip.w), 1e-4);
          float f0 = mix(40.0 + 34.0 * aRnd.y, 100.0 + 40.0 * aRnd.y, aRnd.w), gone = 1.0 - smoothstep(f0, f0 + 22.0, vDist);
          float rpx = max((0.055 + 0.04 * aRnd.x) * projectionMatrix[1][1] / w * uRes.y * 0.5 * (0.4 + 0.6 * gone), 0.75);   // never a quad under a pixel and a half: slivers speckle under antialiasing
          clip.xy += position.xy * rpx * 2.0 / max(uRes, vec2(1.0)) * clip.w;
          float cs = cloudShade(aPos.xz, uTime);
          vec3 gn = vec3(-aGrad.x * 2.4, 1.0, -aGrad.y * 2.4); gn = gn / max(length(gn), 1e-3);
          float sun = clamp(dot(gn, uSunDir) * 1.25 + 0.15, 0.0, 1.0) * (1.0 - 0.8 * cs);
          float gold = step(0.6, aRnd.z);
          vec3 lit = uSunCol * 0.95 * sun + uSkyCol * 1.05 + vec3(0.11, 0.12, 0.10);     // a pale petal passes light: in cloud shadow it is still paler than the turf
          vCol = mix(uWhite, uGold, gold) * lit;
          vEye = mix(uGold * 0.92, uGold * 0.84, gold) * lit;
          vBig = smoothstep(1.6, 3.2, rpx);                      // a flower a pixel or two across is all petal: its eye shows only close to
          if (gone < 0.04) clip = vec4(2.0, 2.0, 2.0, 1.0);     // sunk away: off the screen, not shrunk to nothing
          gl_Position = clip;
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        varying vec2 vUv; varying vec3 vCol; varying vec3 vEye; varying float vDist; varying float vBig;
        void main() {
          float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
          vec3 c = mix(vCol, vEye, (1.0 - smoothstep(0.08, 0.16, r2)) * vBig);          // a yellow eye in a ring of white rays
          gl_FragColor = vec4(withFog(c, vDist), 1.0);
        }`,
    });
    const flowers = new THREE.Mesh(g, mat); flowers.frustumCulled = false; object.add(flowers);
  }
  await ctx.yield();
  // --- sheep: small flocks grazing beside the line. They amble and nod; nothing they do depends on u.
  {
    const WOOL = '#ebe5d4', DARK = '#2b2723', ico = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), P = ico.attributes.position;
    for (let i = 0; i < P.count; i++) { const d = 1 + 0.10 * Math.sin(P.getX(i) * 5.1 + P.getY(i) * 3.3) + 0.07 * Math.sin(P.getZ(i) * 6.7 + 1.0); P.setXYZ(i, P.getX(i) * d, P.getY(i) * d, P.getZ(i) * d); }
    ico.computeVertexNormals();
    const body = paint(ico, WOOL, at(0, 0.66, 0, 0, 0, 0, 0.36, 0.33, 0.6)), bc = body.attributes.color, bn = body.attributes.normal;
    for (let i = 0; i < bc.count; i++) { const k = 0.72 + 0.28 * Math.max(0, Math.min(1, bn.getY(i) * 0.8 + 0.6)); bc.setXYZ(i, bc.getX(i) * k, bc.getY(i) * k, bc.getZ(i) * k); }   // wool in its own shade underneath
    const parts = [body, box(0.17, 0.2, 0.3, DARK, at(0, 0.5, 0.7, 0.75, 0, 0)), box(0.3, 0.05, 0.07, DARK, at(0, 0.62, 0.6)), box(0.16, 0.22, 0.2, WOOL, at(0, 0.7, 0.52, 0.5, 0, 0)),
      box(0.08, 0.12, 0.1, WOOL, at(0, 0.72, -0.6))];
    for (const x of [-0.17, 0.17]) for (const z of [-0.32, 0.34]) parts.push(box(0.07, 0.44, 0.07, DARK, at(x, 0.2, z)));
    const NSH = Math.max(24, Math.round(64 * detail)), KZ = DIAMOND.knollZ;
    const sheep = new THREE.InstancedMesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#3b382f') }), NSH);
    sheep.frustumCulled = false; sheep.instanceMatrix.setUsage(THREE.DynamicDrawUsage); object.add(sheep);
    // where the flocks graze: [rail distance, metres to the left (+) or right (-) of the line, spread], and one on the knoll's seaward flank
    const FLOCKS = [[62, 19, 9], [118, -24, 10], [18, -27, 9], [748, -44, 9], [596, -21, 10], [646, 25, 9], [706, -15, 7], [792, 23, 8]];   // none on the top loop (path metres 220 to 360): the brief keeps it empty
    const home = new Float32Array(NSH * 6), r = ctx.rng.fork('sheep');
    for (let i = 0; i < NSH; i++) {
      const f = FLOCKS[i % FLOCKS.length], a = r() * 6.283, d = f[2] * Math.sqrt(r());
      beside(f[0], f[1], LEFT);
      // the top loop is kept empty (the viewer has only the balloon to think about): just two ewes lie up under the thorn
      const lone = i === 2 || i === 11; if (lone) { LEFT.x = (i === 2 ? -3.5 : 2.5) * mirror; LEFT.z = KZ + (i === 2 ? 2.5 : 4.5); }
      home[i * 6] = LEFT.x + (lone ? 0 : Math.cos(a) * d); home[i * 6 + 1] = LEFT.z + (lone ? 0 : Math.sin(a) * d * 0.8); home[i * 6 + 2] = r() * 6.283;
      home[i * 6 + 3] = r() < 0.2 ? 0.58 : 0.95 + 0.25 * r(); home[i * 6 + 4] = r() * 6.283; home[i * 6 + 5] = 0.6 + 0.8 * r();
    }
    const pos = new THREE.Vector3(), scl = new THREE.Vector3(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
    updaters.push((time) => {
      for (let i = 0; i < NSH; i++) {
        const ph = home[i * 6 + 4], sp = home[i * 6 + 5], sc = home[i * 6 + 3];
        // a slow figure of their own: a few steps, a pause with the head down, a few steps more
        const wx = Math.sin(time * 0.10 * sp + ph) * 1.6 + Math.sin(time * 0.043 + ph * 2.0) * 1.2, wz = Math.cos(time * 0.083 * sp + ph * 1.3) * 1.4;
        const x = home[i * 6] + wx, z = home[i * 6 + 1] + wz;
        eu.set(0.05 + 0.07 * Math.sin(time * 1.9 * sp + ph * 3.0) * (0.5 + 0.5 * Math.sin(time * 0.31 + ph)), home[i * 6 + 2] + 0.7 * Math.sin(time * 0.06 * sp + ph * 1.7), 0);
        m4.compose(pos.set(x, groundAt(x, z) - 0.03, z), q4.setFromEuler(eu), scl.set(sc, sc, sc)); sheep.setMatrixAt(i, m4);
      }
      sheep.instanceMatrix.needsUpdate = true;
    });
    updaters[updaters.length - 1](0);
  }
  await ctx.yield();
  // --- may and gorse: clumps of thorn in white blossom and gorse in yellow, in the combes and on the spurs away from the line
  {
    const lump = (hexLow, hexHigh, hexBloom, bloom) => {
      const list = [], c0 = new THREE.Color(hexLow), c1 = new THREE.Color(hexHigh), cb = new THREE.Color(hexBloom), cc = new THREE.Color();
      for (const [x, y, z, rr] of [[0, 0.75, 0, 1.0], [0.85, 0.55, 0.3, 0.72], [-0.7, 0.5, -0.45, 0.68], [0.1, 0.5, -0.9, 0.6], [-0.2, 1.25, 0.2, 0.62]]) {
        const g = new THREE.IcosahedronGeometry(rr, 1).toNonIndexed(); g.applyMatrix4(at(x, y, z, 0, x * 2.0, 0, 1.15, 0.85, 1.15)); g.computeVertexNormals();
        const P = g.attributes.position, N = g.attributes.normal, col = new Float32Array(P.count * 3);
        for (let i = 0; i < P.count; i++) {
          const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), h = Math.sin(px * 7.3 + pz * 5.1) * Math.sin(py * 6.1 + px * 2.3) + 0.5 * Math.sin(pz * 11.0 + py * 4.0);
          cc.copy(c0).lerp(c1, Math.max(0, Math.min(1, 0.45 + 0.55 * N.getY(i) + 0.2 * h)));
          if (h > bloom && N.getY(i) > -0.2) cc.lerp(cb, bloom > 0.5 ? 0.7 : 0.85);
          col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); list.push(g);
      }
      return merge(list);
    };
    const ev = !!opts.evening, mayG = lump('#1f3f24', ev ? '#6b8a3a' : '#4d8a3c', '#f3f0e4', 0.05), gorseG = lump('#1f3a1f', ev ? '#55702f' : '#3a652c', '#e9d86a', 1.05);
    await ctx.yield();
    const NBU = Math.round(46 * (0.6 + 0.4 * detail)), bushMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#141f10') });
    const may = new THREE.InstancedMesh(mayG, bushMat, NBU), gorse = new THREE.InstancedMesh(gorseG, bushMat, NBU), r = ctx.rng.fork('bushes');
    const pos = new THREE.Vector3(), scl = new THREE.Vector3(), KZ = DIAMOND.knollZ, cd = opts.castDir || { x: 1, y: 0, z: 1 };
    for (const [mesh, seedOff] of [[may, 0], [gorse, 40]]) {
      let n = 0, tries = 0;
      while (n < NBU && tries++ < 4000) {
        if (tries % 300 === 299) await ctx.yield();
        const x = (r() * 2 - 1) * 330, z = -300 + r() * 600, lat = latAt(x, z), rr = 1.0 + 1.1 * r() * r(), yaw = r() * 6.283;
        const patch = ctx.noise.fbm2(x * 0.011 + seedOff, z * 0.011 + 5.0, 2);
        if (lat < (z > 95 ? 62 : 30) || lat > 150 || patch < 0.08 || Math.hypot(x, z - KZ) < 26 || Math.hypot(x + 16 * mirror, z + 6) < 16) continue;
        m4.compose(pos.set(x, groundAt(x, z) - 0.15, z), q4.setFromAxisAngle(UPV, yaw), scl.set(rr, rr * (0.8 + 0.3 * r()), rr)); mesh.setMatrixAt(n++, m4);
        if (opts.darken) { opts.darken(x, z, rr * 1.6); opts.darken(x + cd.x * rr * cd.z * 0.7, z + cd.y * rr * cd.z * 0.7, rr * 1.4); }   // the turf under and down-light of it lies in its shade
      }
      mesh.count = n; mesh.frustumCulled = false; object.add(mesh);
    }
  }
  await ctx.yield();
  // --- the far layer: two chalk headlands either side of a bay, stacks off their points, a white lighthouse on the last
  // rock of the eastern row (straight down the exit leg), and sails. Drawn with their own long haze: the scene's would erase them.
  {
    const coastMat = new THREE.ShaderMaterial({
      uniforms: { ...opts.light, ...opts.fog, uFar: { value: 0.17 } }, vertexColors: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aFace;
        varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying float vFace; varying float vDist;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = mat3(modelMatrix) * normal; vCol = color; vFace = aFace;
          vec4 mv = viewMatrix * w; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        ${LIGHT_PARS}
        uniform float uFar;
        varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying float vFace; varying float vDist;
        void main() {
          vec3 n = vN / max(length(vN), 1e-3);
          // the coast's ribbons are wound so that their normals point inward (the chalk was never in the sun): turn each to the eye
          vec3 toEye = cameraPosition - vW; if (dot(n, toEye) < 0.0) n = -n;
          float fc = clamp(vFace, 0.0, 1.0);
          // the chalk face is modelled: buttresses and gullies (a coordinate along the wall, bent a little with height so
          // they lean), turned to or from the key; flint bands; a foot in its own shade; a dark lip where the turf overhangs
          float along = vW.x * 0.031 + vW.z * 0.024 + 0.010 * vW.y + 1.1 * sin(vW.x * 0.0061 + vW.z * 0.0083), b1 = sin(along + 1.3 * sin(along * 0.37)), b2 = sin(along * 2.3 + 1.7 + 0.9 * sin(along * 0.71));
          float butt = 0.62 * b1 + 0.38 * b2;                                   // +1 on a buttress's nose, -1 in a gully
          float dbt = 0.62 * cos(along + 1.3 * sin(along * 0.37)) + 0.38 * cos(along * 2.3 + 1.7 + 0.9 * sin(along * 0.71));
          vec3 tg = vec3(-n.z, 0.0, n.x); tg = tg / max(length(tg), 1e-3);
          vec3 nb = n + tg * dbt * 0.9 * fc; nb = nb / max(length(nb), 1e-3);
          n = mix(n, nb, fc);
          float band = 0.5 + 0.5 * sin(vW.y * 0.42 + 1.6 * sin(along * 0.5)), flint = smoothstep(0.82, 0.98, band);
          float foot = smoothstep(-2.0, 30.0, vW.y), gul = smoothstep(-0.9, 0.5, butt);
          vec3 c = vCol * mix(vec3(1.0), (0.74 + 0.26 * gul) * (0.8 + 0.2 * foot) * (1.0 - 0.12 * flint) * vec3(1.0, 0.985, 0.95), fc);
          // chalk out of the sun is a cool blue-white (sky and sea light on a white wall), never a dun shade
          vec3 lit = uSunCol * max(dot(n, uSunDir), 0.0) * mix(0.85, 1.25, fc) + mix(mix(uGndCol, uSkyCol, 0.5 + 0.5 * n.y) * 1.15, uSkyCol * (1.7 + 0.7 * gul) + uSunCol * 0.42, fc);
          gl_FragColor = vec4(withFog(c * lit, vDist * uFar), 1.0);
        }`,
    });
    const pos = [], col = [], face = [], idx = [], cc = new THREE.Color(), CHALK = new THREE.Color('#f1eee4').multiplyScalar(0.84), SCREE = new THREE.Color('#d6d0bf').multiplyScalar(0.8), TURF = new THREE.Color(pal.deep || pal.turf).multiplyScalar(0.95), CREST = new THREE.Color(pal.turf).multiplyScalar(0.9);
    const put = (x, y, z, c, f) => { pos.push(x * mirror, y, z); col.push(c.r, c.g, c.b); face.push(f); return pos.length / 3 - 1; };
    const tongue = (pts, w0, w1, h0, h1) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], 0, q[1]))), N = 46, base = pos.length / 3, c = new THREE.Vector3(), tg = new THREE.Vector3();
      for (let i = 0; i <= N; i++) {
        const t = i / N; curve.getPoint(t, c); curve.getTangent(t, tg); const nx = tg.z, nz = -tg.x, end = i === N ? 1 : 0;
        const w = (w0 + (w1 - w0) * t) * (1 + 0.16 * Math.sin(t * 19.0)) * (end ? 0.25 : 1), h = (h0 + (h1 - h0) * t) * (0.8 + 0.2 * Math.cos(t * 27.0)) * (end ? 0.15 : 1);
        const rows = [[-w - 14, -3, SCREE, 1], [-w, h, CHALK, 1], [-w, h, TURF, 0], [0, h + 0.06 * w, CREST, 0], [w, h, TURF, 0], [w, h, CHALK, 1], [w + 14, -3, SCREE, 1]];
        for (const [o, y, cl, f] of rows) put(c.x + nx * o + tg.x * end * 30, y, c.z + nz * o + tg.z * end * 30, cl, end ? 1 : f);
        if (i < N) for (let j = 0; j < 6; j++) { if (j === 1 || j === 4) continue; const v = base + i * 7 + j; idx.push(v, v + 1, v + 7, v + 1, v + 8, v + 7); }
      }
      curve.getPoint(1, c); curve.getTangent(1, tg); return { x: c.x, z: c.z, dx: tg.x, dz: tg.z };
    };
    const stack = (x, z, rad, h, sides = 7) => {            // a chalk pinnacle with a cap of turf (h < 0: bare, for the lighthouse rock)
      const base = pos.length / 3, bare = h < 0; h = Math.abs(h);
      for (let k = 0; k <= 3; k++) for (let a = 0; a < sides; a++) {
        const th = (a / sides) * 6.283 + k * 0.3, rr = rad * [1.12, 0.9, 0.72, 0.6][k] * (0.85 + 0.3 * Math.abs(Math.sin(a * 2.7 + x))), y = [-3, h * 0.45, h * 0.86, h][k];
        put(x + Math.cos(th) * rr, y, z + Math.sin(th) * rr * 0.8, k === 0 ? SCREE : CHALK, 1);
        if (k < 3) { const v = base + k * sides + a, v1 = base + k * sides + (a + 1) % sides; idx.push(v, v1, v + sides, v1, v1 + sides, v + sides); }
      }
      const top = put(x, h + (bare ? 0 : 2.5), z, bare ? CHALK : TURF, bare ? 1 : 0);
      for (let a = 0; a < sides; a++) idx.push(base + 3 * sides + a, base + 3 * sides + (a + 1) % sides, top);
    };
    const east = tongue([[3300, -350], [2300, 250], [1550, 700], [1080, 990], [800, 1130]], 420, 70, 118, 78);
    const west = tongue([[-3300, -300], [-2400, 250], [-1700, 650], [-1300, 880], [-1100, 1000]], 440, 80, 124, 82);
    await ctx.yield();
    [[105, 34, 62], [190, 27, 50], [262, 21, 38], [322, 16, 27]].forEach(([d, r0, h]) => stack(east.x + east.dx * d + east.dz * 8, east.z + east.dz * d, r0, h));
    [[110, 30, 54], [185, 20, 36]].forEach(([d, r0, h]) => stack(west.x + west.dx * d, west.z + west.dz * d, r0, h));
    // the lighthouse: a white tower on the last rock, a dark gallery, a glazed lantern under a slate cap
    const LX = east.x + east.dx * 405, LZ = east.z + east.dz * 405, WHITE = new THREE.Color('#f7f4ea').multiplyScalar(0.9), SLATE = new THREE.Color('#4f5b64');
    stack(LX, LZ, 22, -9, 8);
    const ring = (y, rr, c, f) => { const b = pos.length / 3; for (let a = 0; a < 8; a++) put(LX + Math.cos(a * 0.7854) * rr, y, LZ + Math.sin(a * 0.7854) * rr, c, f); return b; };
    const band = (b0, b1) => { for (let a = 0; a < 8; a++) { const a1 = (a + 1) % 8; idx.push(b0 + a, b0 + a1, b1 + a, b0 + a1, b1 + a1, b1 + a); } };
    band(ring(7, 7.5, WHITE, 0), ring(46, 5.2, WHITE, 0)); band(ring(46, 7.0, SLATE, 0), ring(48, 7.0, SLATE, 0)); band(ring(48, 4.2, WHITE, 0), ring(54, 4.2, WHITE, 0));
    { const b = ring(54, 5.2, SLATE, 0), t = put(LX, 60, LZ, SLATE, 0); for (let a = 0; a < 8; a++) idx.push(b + a, b + (a + 1) % 8, t); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    g.setAttribute('aFace', new THREE.BufferAttribute(new Float32Array(face), 1)); g.setIndex(idx); g.computeVertexNormals();
    const coast = new THREE.Mesh(g, coastMat); coast.frustumCulled = false; object.add(coast);
    await ctx.yield();
    // the lantern: a slow sweep of light, once in five seconds, eased
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(4.6, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }));
    lamp.position.set(LX * mirror, 51, LZ); object.add(lamp);
    // sails: luggers standing across the bay, heeling a little, each at its own pace
    const sp = [], sc = [], sf = [], sn = [], tri = (a, b, c, cl, f) => { for (const v of [a, b, c]) { sp.push(v[0], v[1], v[2]); sc.push(cl.r, cl.g, cl.b); sf.push(f); sn.push(0, 0.3, 1); } };
    const HULL = new THREE.Color('#2c343c'), SAIL = new THREE.Color('#f7f3e6').multiplyScalar(0.92);
    tri([-6.5, 2.2, 0], [7, 2.2, 0], [5.5, 0, 0], HULL, 0); tri([-6.5, 2.2, 0], [5.5, 0, 0], [-5, 0, 0], HULL, 0);
    tri([0.8, 2.6, 0], [0.8, 21, 0], [-6.5, 3.2, 0], SAIL, 0.4); tri([1.6, 2.6, 0], [1.2, 16, 0], [7.5, 2.6, 0], SAIL, 0.4);
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3)); bg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sc), 3));
    bg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(sn), 3)); bg.setAttribute('aFace', new THREE.BufferAttribute(new Float32Array(sf), 1));
    const boats = [], br = ctx.rng.fork('sails');
    for (let i = 0; i < 11; i++) {       // seven across the bay, and four working closer in over the pale shelf
      const b = new THREE.Mesh(bg, coastMat), inshore = i >= 7; b.frustumCulled = false; object.add(b);
      boats.push({ b, x: (inshore ? -960 + (i - 7) * 520 : -800 + i * 250) + br.range(-60, 60), z: inshore ? 420 + br() * 130 : 470 + br() * 520, v: (i % 2 ? -1 : 1) * br.range(1.6, 3.0), ph: br() * 6.283, sc: inshore ? br.range(0.7, 0.9) : br.range(0.9, 1.35) });
    }
    updaters.push((time) => {
      const k = Math.max(0, Math.sin(time * 1.2566)), k2 = k * k, k8 = k2 * k2 * k2 * k2;
      lamp.material.color.setRGB(0.9 + 5.0 * k8, 0.9 + 4.3 * k8, 0.82 + 3.0 * k8);
      for (const o of boats) {
        const x = ((o.x + o.v * time + 1100) % 2200 + 2200) % 2200 - 1100;
        o.b.position.set(x * mirror, Math.sin(time * 0.8 + o.ph) * 0.5, o.z); o.b.scale.set(o.sc * (o.v * mirror > 0 ? 1 : -1), o.sc, o.sc);
        o.b.rotation.set(0.10 + 0.05 * Math.sin(time * 0.6 + o.ph), 0, 0.03 * Math.sin(time * 0.9 + o.ph));
      }
    });
    updaters[updaters.length - 1](0);
  }
  await ctx.yield();
  return {
    object,
    update(time, camera) { ctx.renderer.getDrawingBufferSize(size); uRes.value.copy(size); for (let i = 0; i < updaters.length; i++) updaters[i](time, camera); },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// The country round the line (polish 1): a harbour village east of the hairpin, outside the bend, a
// tarred windmill, a stone mole with moored luggers, field walls and wind-bent trees, a beech clump on the crest, gulls,
// and the thorn's blossom going down the wind. None of it is red, none of it moves along the line, none of it stands on a
// sight line of the story (the far car at u 0.02, the hoop from the hairpin, the third car right of the ring).
const facet = (g) => { g.computeVertexNormals(); return g; };
const prism = (len, hex, m) => facet(paint(new THREE.CylinderGeometry(1, 1, len, 4, 1, true), hex, m));   // a ridge roof: a diamond along local Y, open at the gables
export async function buildCountry(ctx, opts = {}) {
  const { mirror = 1, pal, groundAt, latAt } = opts, detail = opts.detail ?? 1, ev = !!opts.evening;
  const object = new THREE.Group(), uTime = opts.time || { value: 0 }, uRes = { value: new THREE.Vector2(800, 450) };
  const updaters = [], size = new THREE.Vector2(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), UPV = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3(), scl = new THREE.Vector3(), HP = Math.PI / 2;
  const SLATE = '#59666f', SLATE2 = '#6a7780', WHITE = '#efece2', FLINT = '#c9c2ad', GLASS = '#26323b', DOOR = '#3c5566', TAR = '#3a3531';
  const houseMat = selfLit(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#ffffff').multiplyScalar(ev ? 0.26 : 0.2) }));
  const shade = (x, z, r) => { if (opts.darken) { opts.darken(x, z, r); const cd = opts.castDir; if (cd) opts.darken(x + cd.x * r * 0.8, z + cd.y * r * 0.8, r * 0.8); } };

  // --- cottages: whitewash or flint under slate, a door and two windows to the front, a chimney at one gable
  const cottage = (wall, roof) => {
    const parts = [box(7.5, 5.3, 5.6, wall, at(0, 0.65, 0)), prism(8.1, roof, at(0, 3.3, 0, 0, 0, HP, 2.5, 1, 3.25)), prism(7.5, wall, at(0, 3.3, 0, 0, 0, HP, 2.3, 1, 2.8)),
      box(7.5, 0.02, 0.02, wall, at(0, 3.3, 0)), box(0.75, 2.0, 0.75, wall, at(2.9, 5.5, 0)), box(0.85, 0.14, 0.85, SLATE, at(2.9, 6.5, 0)), cyl(0.16, 0.2, 0.5, 6, '#a9876a', at(2.9, 6.8, 0)),
      box(0.95, 1.9, 0.1, DOOR, at(-0.5, 0.95, 2.8)), box(1.2, 0.12, 0.3, SLATE, at(-0.5, 2.0, 2.9))];
    for (const x of [-2.6, 1.9]) for (const s of [1, -1]) parts.push(box(1.0, 1.05, 0.1, GLASS, at(x, 1.85, 2.8 * s)), box(1.2, 0.1, 0.16, '#fbf9f2', at(x, 1.28, 2.84 * s)), box(0.06, 1.05, 0.12, '#fbf9f2', at(x, 1.85, 2.82 * s)));
    // gable caps for the wall-coloured prism (it is open-ended): two triangles each end
    for (const s of [1, -1]) {
      const g = new THREE.BufferGeometry(), x = 3.75 * s, v = s > 0 ? [x, 3.3, 2.8, x, 3.3, -2.8, x, 5.6, 0] : [x, 3.3, -2.8, x, 3.3, 2.8, x, 5.6, 0];
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([s, 0, 0, s, 0, 0, s, 0, 0]), 3)); parts.push(paint(g, wall));
    }
    return merge(parts);
  };
  // The village stands EAST of the hairpin, outside the bend: from the top loop nothing of it lies behind the last 120 m of the
  // line, the ring or the hoop (the wide shot keeps its second car, plume and ring alone on open turf against the sea), and
  // from the second leg it is dead ahead, so the line runs down to it.
  const ROWS = [[106, 140, 113, 206, 5], [150, 172, 214, 196, 4], [130, 232, 206, 248, 6], [142, 264, 224, 280, 6], [238, 226, 262, 288, 4], [172, 304, 290, 308, 8]];
  const spots = [], vr = ctx.rng.fork('village');
  for (const [x0, z0, x1, z1, n] of ROWS) for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5, x = x0 + (x1 - x0) * t + vr.range(-2, 2), z = z0 + (z1 - z0) * t + vr.range(-3, 3);
    const along = Math.atan2(z1 - z0, x1 - x0), yaw = -along + vr.range(-0.22, 0.22) + (Math.abs(x1 - x0) < 20 ? HP : 0);
    spots.push({ x, z, yaw, sc: vr.range(1.25, 1.65), kind: vr() < 0.6 ? 0 : 1 });   // larger than life, like the cars
  }
  await ctx.yield();
  const kinds = [cottage(WHITE, SLATE)]; await ctx.yield(); kinds.push(cottage(FLINT, SLATE2));
  await ctx.yield();
  for (let k = 0; k < 2; k++) {
    const list = spots.filter((s) => s.kind === k), mesh = new THREE.InstancedMesh(kinds[k], houseMat, list.length);
    list.forEach((s, i) => {
      const y = Math.min(groundAt(s.x * mirror, s.z), groundAt(s.x * mirror, s.z + 3), groundAt(s.x * mirror, s.z - 3)) - 0.1;
      m4.compose(pos.set(s.x * mirror, y, s.z), q4.setFromAxisAngle(UPV, s.yaw * mirror), scl.set(s.sc, s.sc * (0.95 + 0.1 * (i % 3)), s.sc)); mesh.setMatrixAt(i, m4); shade(s.x * mirror, s.z, 5);
    });
    mesh.frustumCulled = false; object.add(mesh);
  }
  await ctx.yield();
  // --- the church: a flint nave under slate and a square tower with a short lead spire, the tallest thing below the hill
  {
    const C = { x: 137 * mirror, z: 246 }, y = groundAt(C.x, C.z + 6) - 0.2, W = '#d2cbb6';
    const parts = [box(8, 9.5, 17, W, at(0, 2.75, 0)), prism(17.6, SLATE, at(0, 7.5, 0, HP, 0, 0, 4.7, 1, 4.2)), prism(17, W, at(0, 7.5, 0, HP, 0, 0, 4.0, 1, 3.9)),
      box(6, 24, 6, W, at(0, 10, -11.2)), box(6.6, 0.5, 6.6, '#bdb6a2', at(0, 22.2, -11.2)), facet(cyl(0, 3.6, 9.5, 4, '#6f7c84', at(0, 27.0, -11.2, 0, Math.PI / 4, 0))),
      box(6, 6.5, 5, W, at(0, 1.25, 10.5)), prism(5.4, SLATE, at(0, 4.5, 10.5, HP, 0, 0, 3.4, 1, 3.3))];
    for (const s of [1, -1]) { for (const z of [-4.5, 0, 4.5]) parts.push(box(0.12, 3.4, 1.3, GLASS, at(4.0 * s, 4.2, z))); parts.push(box(1.1, 2.4, 0.12, GLASS, at(0, 18.5, -11.2 + 3.0 * s)), box(0.12, 2.4, 1.1, GLASS, at(3.0 * s, 18.5, -11.2))); }
    for (const sx of [1, -1]) for (const sz of [1, -1]) parts.push(box(0.8, 1.5, 0.8, W, at(2.7 * sx, 22.9, -11.2 + 2.7 * sz)));
    const church = new THREE.Mesh(merge(parts), houseMat); church.position.set(C.x, y, C.z); church.rotation.y = 0.35 * mirror; church.scale.setScalar(1.2); object.add(church); shade(C.x, C.z, 9);
  }
  await ctx.yield();
  // --- the windmill: a tarred smock mill on a whitewashed base at the village's west end, white cap, four white sweeps turning
  {
    // It stands where, seen from the second leg, it is left of the ring and never behind our earlier self (whose bearing runs from the ring's to the hoop's through the gasp)
    const M = { x: 192 * mirror, z: 214 }, y = groundAt(M.x, M.z) - 0.3, face = Math.atan2((63 * mirror) - M.x, 120 - M.z);   // it faces up the hill, toward the hairpin
    const body = merge([facet(cyl(3.9, 4.2, 3.0, 8, WHITE, at(0, 1.0, 0))), facet(cyl(2.1, 3.7, 12.5, 8, TAR, at(0, 8.7, 0))), box(4.4, 0.16, 4.4, '#d9d5c8', at(0, 2.6, 0, 0, 0.39, 0)),
      box(1.0, 2.0, 0.2, DOOR, at(0, 1.2, 4.05)), box(0.7, 0.9, 0.2, '#fbf9f2', at(0, 8.0, 3.0)), box(0.7, 0.9, 0.2, '#fbf9f2', at(0, 12.0, 2.5)),
      paint(new THREE.SphereGeometry(2.5, 10, 6, 0, Math.PI * 2, 0, HP), '#f2efe6', at(0, 14.9, 0, 0, 0, 0, 1, 0.9, 1.25)), box(0.35, 0.35, 3.2, '#d9d5c8', at(0, 15.6, 2.4))]);
    const MS = 1.3, mill = new THREE.Mesh(body, houseMat); mill.position.set(M.x, y, M.z); mill.rotation.y = face; mill.scale.setScalar(MS); object.add(mill); shade(M.x, M.z, 6);
    await ctx.yield();
    const sw = [];
    for (let k = 0; k < 4; k++) {
      const r = at(0, 0, 0, 0, 0, k * HP);
      sw.push(box(0.22, 10.2, 0.22, '#e9e5d8', at(0, 5.1, 0).premultiply(r)), box(1.9, 7.6, 0.07, '#f8f5ec', at(1.0, 6.2, 0.06, 0, 0.14, 0).premultiply(r)));
      for (let j = 0; j < 5; j++) sw.push(box(1.9, 0.09, 0.1, '#bdb8aa', at(1.0, 2.8 + j * 1.7, 0.08, 0, 0.14, 0).premultiply(r)));
    }
    sw.push(cyl(0.45, 0.45, 0.5, 8, TAR, at(0, 0, 0, HP, 0, 0)));
    const sails = new THREE.Mesh(merge(sw), houseMat), hub = new THREE.Group();
    hub.position.set(M.x + Math.sin(face) * 4.1 * MS, y + 15.6 * MS, M.z + Math.cos(face) * 4.1 * MS); hub.rotation.y = face; hub.scale.setScalar(MS); hub.add(sails); object.add(hub);
    updaters.push((time) => { sails.rotation.z = -time * 0.55 * (opts.wind || 1); });
  }
  await ctx.yield();
  // --- the harbour: a stone mole with a white light on its head, a shorter east arm, luggers moored inside rocking on the swell
  {
    const stone = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#2a2c2a') }), parts = [];
    const arm = (pts, w) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], l = Math.hypot(bx - ax, bz - az), yw = Math.atan2(bx - ax, bz - az);
      parts.push(box(w, 6.4, l + w * 0.6, '#9a9584', at((ax + bx) / 2 * mirror, -0.6, (az + bz) / 2, 0, yw * mirror, 0)), box(w * 0.42, 1.1, l + w * 0.6, '#b9b39f', at(((ax + bx) / 2 + Math.cos(yw) * w * 0.29 * (pts === WEST ? -1 : 1)) * mirror, 3.1, (az + bz) / 2 - Math.sin(yw) * w * 0.29 * (pts === WEST ? -1 : 1), 0, yw * mirror, 0))); } };
    const HX = 235, WEST = [[-58, 326], [-67, 352], [-60, 380], [-38, 401], [-6, 410], [26, 403]].map(([x, z]) => [x + HX, z]), EAST = [[68, 326], [70, 356], [60, 380]].map(([x, z]) => [x + HX, z]);
    arm(WEST, 5.5); arm(EAST, 5);
    parts.push(box(120, 5.0, 4, '#9a9584', at((4 + HX) * mirror, -0.6, 331)));                               // the quay under the harbour front
    const mole = new THREE.Mesh(merge(parts), stone); mole.frustumCulled = false; object.add(mole);
    const light = new THREE.Mesh(merge([facet(cyl(1.25, 1.7, 8.5, 10, WHITE, at(0, 4.2, 0))), cyl(1.9, 1.9, 0.3, 10, SLATE, at(0, 8.5, 0)), cyl(1.0, 1.0, 1.5, 8, GLASS, at(0, 9.4, 0)), facet(cyl(0, 1.5, 1.3, 8, SLATE, at(0, 10.8, 0)))]), houseMat);
    light.position.set((26 + HX) * mirror, 2.6, 403); object.add(light);
    // a lugger: tarred hull, a mast, a tan lugsail and a white jib, drawn two-sided
    const TAN = '#cdbb8e', tri = (v, hex) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.computeVertexNormals(); return paint(g, hex); };
    const hull = [box(2.3, 1.3, 5.2, '#2c343c', at(0, 0.35, -0.6)), facet(cyl(0.02, 1.62, 2.6, 4, '#2c343c', at(0, 0.35, 3.3, HP, Math.PI / 4, 0, 1, 1, 0.56))), box(2.4, 0.14, 5.3, '#e9e5d8', at(0, 1.02, -0.6)),
      cyl(0.09, 0.12, 9.5, 6, '#6b5a44', at(0, 5.4, 0.6)), cyl(0.06, 0.06, 5.2, 5, '#6b5a44', at(0, 8.2, -0.6, 1.25, 0, 0))];
    for (const s of [1, -1]) { const x = 0.05 * s; hull.push(tri(s > 0 ? [x, 1.9, 1.0, x, 1.7, -3.9, x, 9.0, -3.0, x, 1.9, 1.0, x, 9.0, -3.0, x, 7.4, 1.7] : [x, 1.9, 1.0, x, 9.0, -3.0, x, 1.7, -3.9, x, 1.9, 1.0, x, 7.4, 1.7, x, 9.0, -3.0], TAN),
      tri(s > 0 ? [x, 1.8, 1.4, x, 8.6, 0.8, x, 1.6, 4.6] : [x, 1.8, 1.4, x, 1.6, 4.6, x, 8.6, 0.8], '#f3efe2')); }
    await ctx.yield();
    const NB = 9, boats = new THREE.InstancedMesh(merge(hull), houseMat, NB), br = ctx.rng.fork('moored'), berth = [];
    boats.instanceMatrix.setUsage(THREE.DynamicDrawUsage); boats.frustumCulled = false; object.add(boats);
    for (let i = 0; i < NB; i++) berth.push({ x: (-46 + HX + i * 11.5 + br.range(-3, 3)) * mirror, z: 346 + ((i * 37) % 44) + br.range(-3, 3), yaw: br.range(-0.5, 0.5) + (i % 3 === 0 ? 1.6 : 0), ph: br() * 6.283, sc: br.range(1.25, 1.75) });
    const eu = new THREE.Euler(0, 0, 0, 'YXZ');
    updaters.push((time) => {
      for (let i = 0; i < NB; i++) { const b = berth[i]; eu.set(0.05 * Math.sin(time * 1.1 + b.ph), b.yaw + 0.12 * Math.sin(time * 0.23 + b.ph), 0.09 * Math.sin(time * 0.8 + b.ph * 1.7));
        m4.compose(pos.set(b.x, 0.25 + 0.22 * Math.sin(time * 0.9 + b.ph), b.z), q4.setFromEuler(eu), scl.set(b.sc, b.sc, b.sc)); boats.setMatrixAt(i, m4); }
      boats.instanceMatrix.needsUpdate = true;
    });
    updaters[updaters.length - 1](0);
  }
  await ctx.yield();
  // --- trees: round-headed, wind-leaned; along the field walls, among the cottages, and two beech clumps on the far crest
  const along = (s, off, out) => {       // a point off metres to the traveller's left of the line at rail distance s
    const a = planAt(s, mirror, { x: 0, z: 0 }), b = planAt(s + 1, mirror, { x: 0, z: 0 }), tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
    out.x = a.x + (tz / l) * off * mirror; out.z = a.z - (tx / l) * off * mirror; out.yaw = Math.atan2(tx, tz); return out;
  };
  const P0 = { x: 0, z: 0, yaw: 0 };
  {
    const c0 = new THREE.Color(ev ? '#27401f' : '#1f4a26'), c1 = new THREE.Color(ev ? '#8fa23e' : '#6fa344'), cc = new THREE.Color(), list = [cyl(0.2, 0.42, 4.6, 6, '#4b4136', at(0.25, 2.2, 0, 0, 0, -0.1)), cyl(0.1, 0.18, 2.6, 5, '#4b4136', at(1.0, 4.9, 0, 0, 0, -0.75))];
    for (const [x, y, z, rr] of [[0.6, 6.4, 0, 2.5], [2.3, 5.9, 0.5, 1.9], [-1.2, 5.6, -0.6, 1.8], [0.9, 5.4, -1.8, 1.6], [0.6, 5.5, 1.9, 1.6], [1.6, 7.7, 0.1, 1.5], [3.6, 5.2, -0.2, 1.2]]) {
      const g = new THREE.IcosahedronGeometry(rr, 1).toNonIndexed(); g.applyMatrix4(at(x, y, z, 0, x * 1.7, 0, 1.15, 0.82, 1.1));   // the sphere's own normals: round heads, not facets
      const P = g.attributes.position, N = g.attributes.normal, col = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) { const h = Math.sin(P.getX(i) * 4.3 + P.getZ(i) * 3.1) * Math.sin(P.getY(i) * 3.7); cc.copy(c0).lerp(c1, Math.max(0, Math.min(1, 0.42 + 0.5 * N.getY(i) + 0.18 * h + 0.06 * (P.getY(i) - 6)))); col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); list.push(g);
    }
    await ctx.yield();
    const treeG = merge(list), tr = ctx.rng.fork('trees'), T = [];
    const add = (x, z, sc, yaw) => T.push({ x, z, sc, yaw: yaw ?? tr.range(-0.5, 0.5) });
    // along the two field walls (never on the far car's side of the entry leg near the line, never before the ring as seen from the diamond)
    for (const off of [46, 78, 118]) { along(95 + 0.0011 * off * off, off, P0); add(P0.x, P0.z + 4, tr.range(0.9, 1.25)); }
    for (const off of [34, 66, 104, 128]) { along(623, off, P0); add(P0.x, P0.z - 4, tr.range(0.9, 1.3)); }
    // among the cottages and behind the harbour front
    for (const [x, z] of [[118, 224], [124, 156], [160, 158], [176, 206], [222, 214], [168, 256], [214, 262], [246, 250], [132, 286], [190, 292], [236, 298], [272, 270], [128, 184], [-60, 238], [-71, 247], [-64, 256], [-79, 241]]) add((x + tr.range(-2, 2)) * mirror, z + tr.range(-2, 2), tr.range(0.85, 1.2));
    // the clumps on the crest: tall beeches standing close, one left of the knoll and one far to the right (clear sky behind the far car)
    for (const [cx, cz, n] of [[-112, -238, 9], [318, -196, 11], [-250, -150, 7]]) for (let i = 0; i < n; i++) { const a = i * 2.4, d = 5.5 * Math.sqrt(i); add((cx + Math.cos(a) * d) * mirror, cz + Math.sin(a) * d * 0.8, 1.7 + 0.5 * tr(), a); }
    await ctx.yield();
    const trees = new THREE.InstancedMesh(treeG, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(ev ? '#1a2210' : '#10220f') }), T.length);
    T.forEach((t, i) => { m4.compose(pos.set(t.x, groundAt(t.x, t.z) - 0.3, t.z), q4.setFromAxisAngle(UPV, t.yaw + (opts.wind < 0 ? Math.PI : 0) - HP), scl.set(t.sc, t.sc, t.sc)); trees.setMatrixAt(i, m4); shade(t.x, t.z, 3.2 * t.sc); });
    trees.frustumCulled = false; object.add(trees);
  }
  await ctx.yield();
  // --- drystone field walls across the down, with a gap and two capped piers where the line goes through
  {
    const parts = [], G1 = '#aaa593', G2 = '#c6c1ad', G3 = '#8c897b', eY = new THREE.Euler(0, 0, 0, 'YXZ'), atY = (x, y, z, pitch, yaw) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(eY.set(pitch, yaw, 0)), new THREE.Vector3(1, 1, 1)), wr = ctx.rng.fork('walls'), A = { x: 0, z: 0, yaw: 0 }, B = { x: 0, z: 0, yaw: 0 };
    const run = async (s0, bow, t0, t1) => {
      for (let t = t0, n = 0; t < t1; t += 4) {
        if (++n % 5 === 0) await ctx.yield();
        if (Math.abs(t + 2) < 8) continue;                    // the gap for the line
        along(s0 + bow * t * t, t, A); along(s0 + bow * (t + 4) * (t + 4), t + 4, B);
        const ya = groundAt(A.x, A.z), yb = groundAt(B.x, B.z), l = Math.hypot(B.x - A.x, B.z - A.z), ll = Math.hypot(l, yb - ya), pitch = -Math.atan2(yb - ya, l), yaw = Math.atan2(B.x - A.x, B.z - A.z);
        for (let k = 0; k < 3; k++) {                             // three runs of stone to a rod, each its own height and tone, with upright copers on top
          const f = (k + 0.5) / 3, x = A.x + (B.x - A.x) * f, z = A.z + (B.z - A.z) * f, y = ya + (yb - ya) * f, h = 0.95 + 0.28 * wr(), tone = [G1, G2, G3][(wr() * 3) | 0];
          parts.push(box(0.62 + 0.16 * wr(), h + 0.8, ll / 3 + 0.03, tone, atY(x, y + h / 2 - 0.4, z, pitch, yaw)));
          for (let c = 0; c < 2; c++) { const fc = (k + (c + 0.5) / 2) / 3; parts.push(box(0.5, 0.22 + 0.14 * wr(), 0.42, [G1, G2, G3][(wr() * 3) | 0], atY(A.x + (B.x - A.x) * fc, ya + (yb - ya) * fc + h + 0.1, A.z + (B.z - A.z) * fc, pitch + 0.5 * (wr() - 0.5), yaw))); }
        }
      }
      for (const t of (t0 > 0 ? [7.7] : [-7.7, 7.7])) { along(s0 + bow * t * t, t, A); const y = groundAt(A.x, A.z); parts.push(box(0.8, 2.5, 0.8, G2, at(A.x, y + 0.75, A.z, 0, A.yaw, 0)), facet(cyl(0, 0.68, 0.42, 4, SLATE, at(A.x, y + 2.2, A.z, 0, A.yaw + Math.PI / 4, 0)))); }
    };
    // the first ends west of the entry leg: seen from the exit straight nothing stands between us and the third car
    await run(95, 0.0011, 8, 150); await ctx.yield(); await run(623, 0, -44, 140);   // its west end stops short of the sight line from the exit straight to the third car await ctx.yield();
    const walls = new THREE.Mesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#45463e') })); walls.frustumCulled = false; object.add(walls);
  }
  await ctx.yield();
  // --- three grey boulders lying in the grass of the knoll's flank: scattered, fallen, no figure to them (a ring of standing
  // stones at the middle of a loop in time would offer a cause for it; this is an ordinary morning)
  {
    const parts = [], sr = ctx.rng.fork('stones'), KZ = DIAMOND.knollZ;
    for (const [bx, bz, len] of [[-13.5, 9.5, 2.3], [9.0, 14.5, 1.7], [-4.5, -12.0, 2.0]]) {
      const x = bx * mirror, z = KZ + bz;
      parts.push(facet(cyl(0.36 + 0.1 * sr(), 0.6 + 0.12 * sr(), len, 5, ['#9fa3a0', '#b0b2ab', '#8e9391'][parts.length % 3], at(x, groundAt(x, z) + 0.22, z, 1.45, sr() * 3, sr.range(-0.12, 0.12), 1.35, 1, 0.8)))); shade(x, z, 1.2);
    }
    const stones = new THREE.Mesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#2c2e2a') })); stones.frustumCulled = false; object.add(stones);
  }
  await ctx.yield();
  // --- gulls: white, wheeling over the harbour and the lip of the land on their own slow circles (nothing they do depends on u)
  {
    const wing = (s) => { const v = [0, 0, 0.24, 1.3 * s, 0.4, -0.2, 0, 0, -0.26, 0, 0, 0.24, 1.3 * s, 0.4, 0.12, 1.3 * s, 0.4, -0.2], w = [];
      for (let i = 0; i < 18; i += 9) { w.push(...v.slice(i, i + 9)); w.push(v[i], v[i + 1], v[i + 2], v[i + 6], v[i + 7], v[i + 8], v[i + 3], v[i + 4], v[i + 5]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(w), 3)); g.computeVertexNormals(); return paint(g, '#f6f4ec'); };
    const NG = Math.max(10, Math.round(20 * detail)), gulls = new THREE.InstancedMesh(merge([wing(1), wing(-1), box(0.2, 0.17, 0.8, '#f6f4ec', at(0, 0, 0))]), houseMat, NG), gr = ctx.rng.fork('gulls'), G = [];
    gulls.instanceMatrix.setUsage(THREE.DynamicDrawUsage); gulls.frustumCulled = false; object.add(gulls);
    for (let i = 0; i < NG; i++) { const west = i % 3 === 2; G.push({ cx: (west ? 205 : 243) * mirror + gr.range(-18, 18), cz: (west ? 318 : 368) + gr.range(-14, 14), R: gr.range(14, 46), h: gr.range(16, 38), w: gr.range(0.16, 0.3) * (i % 2 ? 1 : -1), ph: gr() * 6.283, sc: gr.range(1.5, 2.1) }); }
    const eu = new THREE.Euler(0, 0, 0, 'YXZ');
    updaters.push((time) => {
      for (let i = 0; i < NG; i++) { const g = G[i], a = g.ph + time * g.w, flap = Math.sin(time * 5.2 + g.ph * 3.0), glide = 0.5 + 0.5 * Math.sin(time * 0.37 + g.ph);
        eu.set(0, -a + (g.w > 0 ? 0 : Math.PI), (g.w > 0 ? -0.35 : 0.35));
        m4.compose(pos.set(g.cx + Math.cos(a) * g.R, g.h + 3.0 * Math.sin(time * 0.31 + g.ph), g.cz + Math.sin(a) * g.R), q4.setFromEuler(eu), scl.set(g.sc, g.sc * (glide > 0.7 ? 0.5 : 0.25 + 0.95 * flap), g.sc)); gulls.setMatrixAt(i, m4); }
      gulls.instanceMatrix.needsUpdate = true;
    });
    updaters[updaters.length - 1](0);
  }
  await ctx.yield();
  // --- may blossom going down the wind from the thorn on the knoll: petals as small discs, never under a pixel and a half
  {
    const NPt = Math.round(200 * detail), rn = new Float32Array(NPt * 4), pr = ctx.rng.fork('petals'); for (let i = 0; i < NPt * 4; i++) rn[i] = pr();
    const g = new THREE.InstancedBufferGeometry(), qd = new THREE.PlaneGeometry(2, 2); g.index = qd.index; g.setAttribute('position', qd.attributes.position);
    g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rn, 4)); g.instanceCount = NPt;
    const T0 = opts.thorn || new THREE.Vector3(0, 90, DIAMOND.knollZ);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...opts.fog, uRes, uTime, uWind: { value: opts.wind || 1 }, uThorn: { value: T0 }, uCol: { value: new THREE.Color('#fbf8ee').multiplyScalar(ev ? 1.15 : 1.05) } },
      vertexShader: /* glsl */`
        attribute vec4 aRnd; uniform vec2 uRes; uniform float uTime; uniform float uWind; uniform vec3 uThorn;
        varying vec2 vUv; varying float vA; varying float vDist;
        void main() {
          vUv = position.xy;
          float t = fract(uTime * 0.062 * (0.7 + 0.6 * aRnd.x) + aRnd.y);
          vec3 p = uThorn + vec3((aRnd.z - 0.5) * 6.0, 5.0 + aRnd.w * 3.6, 4.0 * uWind + (aRnd.x - 0.5) * 9.0);
          float fall = uWind > 0.0 ? -(9.0 + 10.0 * aRnd.w) : (3.0 + 5.0 * aRnd.w);
          p += vec3(sin(t * 9.0 + aRnd.y * 40.0) * 1.6 + (aRnd.z - 0.5) * 13.0 * t, t * fall + sin(t * 15.0 + aRnd.x * 30.0) * 0.7, uWind * t * (48.0 + 34.0 * aRnd.x));
          vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz);
          vec4 clip = projectionMatrix * mv; float w = max(abs(clip.w), 1e-4);
          float rpx = max(0.075 * projectionMatrix[1][1] / w * uRes.y * 0.5, 0.8);${PETAL_NEAR ? ' rpx *= smoothstep(0.6, 2.5, vDist);   // [cure1] near law: vDist is metres from the petal to the eye' : ''}
          clip.xy += position.xy * rpx * 2.0 / max(uRes, vec2(1.0)) * clip.w;
          vA = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.72, 1.0, t)) * (1.0 - smoothstep(60.0, 105.0, vDist));
          if (vA < 0.02) clip = vec4(2.0, 2.0, 2.0, 1.0);
          gl_Position = clip;
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        uniform vec3 uCol; varying vec2 vUv; varying float vA; varying float vDist;
        void main() { float r2 = dot(vUv, vUv); if (r2 > 1.0) discard; gl_FragColor = vec4(withFog(uCol, vDist), vA); }`,
      transparent: true, depthWrite: false,
    });
    const petals = new THREE.Mesh(g, mat); petals.frustumCulled = false; petals.renderOrder = 2; object.add(petals);
  }
  await ctx.yield();
  return {
    object,
    update(time, camera) { ctx.renderer.getDrawingBufferSize(size); uRes.value.copy(size); for (let i = 0; i < updaters.length; i++) updaters[i](time, camera); },
    dispose() {},
  };
}
