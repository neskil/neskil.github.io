// THE SOUNDING. From a submersible, a pitch-black ocean trench that exists only as sonar: each ping paints basalt
// walls, a fleeing giant squid, a curtain of living amber light, a vent field, and at last a great lost liner.
// Nothing is lit: every surface is a black occluder carrying contour lines / points whose brightness is the sum of
// expanding wavefronts and their afterglow (shared uniforms from the hero, src/parts/the-sounding.js). Living things
// alone are amber point clouds. Sub pings are keyed to path progress u; the lander, robots and second sub ping on time.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeBuilders, SONAR_GLSL, SHADERS } from '../parts/the-sounding.js';

const TAU = Math.PI * 2;
const DUR = 42;
// instrument colour schemes: black, navy, violet floor / far, deep, near, wavefront, living amber
const SCHEMES = [
  { name: 'cyan', pal: ['#02040C', '#071A3A', '#3A2A7A', '#0F4C81', '#19C8E6', '#B8FFF4', '#FFB347'], portal: '#9ff4ff', tint: '#eaf6ff' },
  { name: 'phosphor', pal: ['#020804', '#06240f', '#1c5a48', '#0c6b3a', '#3cf07a', '#d8ffd0', '#FFB347'], portal: '#b4ffc4', tint: '#f0fff0' },
  { name: 'indigo', pal: ['#04030f', '#120a3a', '#6a50d0', '#6f7cff', '#cfd4ff', '#ffffff', '#FFB347'], portal: '#d8dcff', tint: '#f2f0ff' },
];

// ------------------------------------------------------------------ shaders
const TRENCH_VS = /* glsl */`
attribute vec2 aF;
varying vec3 vP, vV; varying vec2 vF;
#include <fog_pars_vertex>
void main() {
  vP = position; vF = aF;
  vec4 mvPosition = viewMatrix * vec4(position, 1.); vV = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// walls: stacked basalt columns (joint lines broken per column + column edges); floor: height contours.
// Lines have constant pixel width (fwidth) and cross-fade to hashed triplanar points beyond ~200 m.
const TRENCH_FS = /* glsl */`
varying vec3 vP, vV; varying vec2 vF;
#include <fog_pars_fragment>
${SONAR_GLSL}
vec2 h22(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float h2(float a, float b) { return fract(sin(a * 12.9898 + b * 78.233) * 43758.5453); }
float dots(vec2 q, float cell, float r) {
  vec2 g = q / cell, id = floor(g), h = h22(id);
  float d = length(fract(g) - (0.12 + 0.76 * h)) * cell;
  return (1. - smoothstep(r * 0.55, r * 1.1, d)) * step(0.3, fract(h.x * 7.3 + h.y * 3.1));
}
void main() {
  vec3 n = abs(normalize(cross(dFdx(vP), dFdy(vP))));
  vec2 q = (n.x > n.y && n.x > n.z) ? vP.zy : ((n.y > n.z) ? vP.xz : vP.xy);
  float dist = length(vV);
  float pxw = max(length(dFdx(vV)), length(dFdy(vV)));
  float lod = max(0., log2(max(dist, 1.) / 60.)), l0 = floor(lod), lf = lod - l0;
  float r = max(0.05, pxw * 0.75);
  float pts = mix(dots(q, 0.6 * exp2(l0), r), dots(q + 17.3, 0.6 * exp2(l0 + 1.), r), lf);
  float far = smoothstep(260., 430., dist);
  float ln = 0.;
  if (vF.y > 0.5) {
    float f = vP.y / 0.9, w = fwidth(f);
    ln = (1. - smoothstep(0.35, 1.0, abs(fract(f - 0.5) - 0.5) / max(w, 1e-4))) * (1. - smoothstep(0.25, 0.6, w)) * 0.36;
  } else {
    // stacked basalt columns: only the column edges are drawn. Boundaries are jittered so widths run 8..15 m,
    // every column stands on its own step above the tier's ledge, and each tier is offset from the one below.
    float cz = vP.z / 11.;
    float ci = floor(cz), cf = cz - ci;
    float j0 = 0.34 * (h2(ci, 0.) - 0.5), j1 = 0.34 * (h2(ci + 1., 0.) - 0.5);
    float cl = cf < j0 ? ci - 1. : (cf > 1. + j1 ? ci + 1. : ci);
    float lb = cl + 0.34 * (h2(cl, 0.) - 0.5), rb = cl + 1. + 0.34 * (h2(cl + 1., 0.) - 0.5);
    float dE = min(cz - lb, rb - cz), bid = (cz - lb < rb - cz) ? cl : cl + 1.;
    // every column breaks into its next tier at its own height, so the wall is stepped column tops, never courses
    float yb = vP.y + 30. * sin(vP.z * 0.004) + 26. * fract(cl * 0.618034 + 0.25);
    float tier = floor(yb / 60.), ty = yb - tier * 60.;
    float wz = fwidth(vP.z) / 11., wy = fwidth(vP.y), fineZ = 1. - smoothstep(0.2, 0.5, wz), fineY = 1. - smoothstep(2.5, 6., wy);
    float edge = (1. - smoothstep(0.4, 1.1, dE / max(wz, 1e-4))) * fineZ * mix(0.5, 1., h2(bid, tier + 7.3));
    float tf = lb + (rb - lb) * (0.3 + 0.4 * h2(cl, tier + 3.1));
    float facet = (1. - smoothstep(0.4, 1.1, abs(cz - tf) / max(wz, 1e-4))) * fineZ * step(0.4, h2(cl, tier + 4.4));
    float ledge = (1. - smoothstep(0.4, 1.1, min(ty, 60. - ty) / max(wy, 1e-4))) * fineY * step(0.3, h2(cl, tier + 1.7));
    float jy = 60. * (0.25 + 0.5 * h2(cl, tier + 5.9));
    float joint = (1. - smoothstep(0.4, 1.1, abs(ty - jy) / max(wy, 1e-4))) * fineY * step(0.5, h2(cl, tier + 9.1));
    float steep = 1. - smoothstep(0.55, 0.85, n.y);
    ln = max(max(edge * 0.85, facet * 0.22), max(ledge * 0.3, joint * 0.14)) * steep;
  }
  float m = max(pts * mix(0.36, 0.5, far), ln * (1. - far));
  vec3 col = sonar(vP, m * vF.x, m * vF.x * 0.8) * (0.92 + 0.08 * sin(gl_FragCoord.y * 2.0944));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// every point cloud: the body fills wp (world position), col (linear HDR) and size (metres)
const pointsVS = (decl, body) => /* glsl */`
uniform float uTime, uViewH; uniform vec3 uCAmber;
varying vec3 vCol;
${SONAR_GLSL}
${decl}
float h11(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
void main() {
  vec3 wp, col; float size;
  ${body}
  vec4 mv = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mv;
  float px = size * projectionMatrix[1][1] * uViewH * 0.5 / max(-mv.z, 0.3);
  float cl = clamp(px, 1.7, 44.);
  gl_PointSize = cl;
  vCol = col * clamp((px * px) / (cl * cl), 0.1, 1.);
}`;
const POINTS_FS = /* glsl */`
varying vec3 vCol;
void main() {
  vec2 d = gl_PointCoord - 0.5; float l = dot(d, d) * 4.;
  gl_FragColor = vec4(vCol * exp(-l * 2.6) * (1. - smoothstep(0.7, 1., l)) * (0.92 + 0.08 * sin(gl_FragCoord.y * 2.0944)), 1.);
}`;

const SNOW_VS = pointsVS(/* glsl */`
attribute vec3 aR; uniform vec3 uFwd, uRight, uUp; uniform float uLamp;`, /* glsl */`
  float bs = aR.y < 0.62 ? 16. : 40.;
  vec3 b = position * (bs / 30.);
  b.y -= uTime * (0.22 + aR.x * 0.3); b.x += sin(uTime * 0.21 + aR.y * 6.3) * 0.5; b.z += cos(uTime * 0.17 + aR.z * 6.3) * 0.4;
  vec3 rel = mod(b - cameraPosition + bs * 0.5, bs) - bs * 0.5;
  wp = cameraPosition + rel;
  float cone = 0.;
  for (int i = 0; i < 2; i++) {
    vec3 rr = rel - uRight * (i == 0 ? -1.15 : 1.15) + uUp * 0.75;
    float al = dot(rr, uFwd), pe = length(rr - uFwd * al);
    cone += (1. - smoothstep(0.45, 1., pe / (0.2 + al * 0.3))) * smoothstep(0.4, 1.6, al) * pow(max(0., 1. - al / 14.), 1.4);
  }
  float dn = length(rel), nearK = 1. - smoothstep(5., 15., dn);
  col = uCAmber * cone * uLamp * (1.8 + 2.4 * aR.x) + sonar(wp, 0.16 * nearK, 0.) + uCDeep * 0.05 * nearK * aR.y;
  col *= smoothstep(0.7, 2.2, dn);
  size = min(0.035 + 0.05 * aR.z, dn * 0.012);`);

// lanternfish: each spark circles its school; every sub wavefront throws the school outward, then it regroups
const FISH_VS = pointsVS(/* glsl */`
attribute vec3 aC; attribute vec3 aR;`, /* glsl */`
  float ph = aR.x * 6.283, rad = length(position);
  float a = uTime * (0.5 + 0.5 * aR.y) / (0.5 + rad * 0.14) + ph;
  float ca = cos(a), sa = sin(a);
  vec3 o = vec3(position.x * ca - position.z * sa, position.y + 0.8 * sin(uTime * 0.7 + ph), position.x * sa + position.z * ca);
  vec3 c = aC + vec3(sin(uTime * 0.11 + aC.z), 0.6 * sin(uTime * 0.17 + aC.x), cos(uTime * 0.13 + aC.y)) * 5.;
  float burst = 0.;
  for (int i = 0; i < 4; i++) {
    vec4 e = uEmit[i], eb = uEmitB[i];
    if (eb.x < 0.) continue;
    float x = e.w * eb.x - distance(c, e.xyz);
    if (x > 0.) burst += smoothstep(0., 8., x) * exp(-x / e.w * 0.9);
  }
  burst = min(burst, 1.3);
  wp = c + o * (1. + 2.2 * burst) + normalize(o + 0.001) * burst * 3. * aR.z;
  float tw = 0.5 + 0.5 * sin(uTime * (2. + 3. * aR.z) + ph * 3.);
  float fogK = 1. - smoothstep(380., 760., distance(wp, cameraPosition));
  col = uCAmber * (0.7 + 2.4 * tw * tw + 2.5 * burst) * fogK;
  size = 0.16 + 0.1 * aR.y;`);

// siphonophore: beads on hanging chains; a wave runs down every chain and the light runs with it
const VEIL_VS = pointsVS(/* glsl */`
attribute vec3 aAx; attribute vec4 aR; uniform vec3 uGap;`, /* glsl */`
  float t = aR.x, ph = aR.y * 6.283;
  float wv = sin(uTime * 1.1 - t * 9. + ph), wv2 = sin(uTime * 0.6 - t * 4. + ph * 1.7);
  wp = position + aAx * ((0.5 * wv + 0.9 * wv2) * (0.2 + t)) + vec3(0., 0.25 * wv * t, 0.) ;
  wp += cross(aAx, vec3(0., 1., 0.)) * 1.6 * t * sin(uTime * 0.33 + position.y * 0.1 + ph * 0.2);
  float run = pow(0.5 + 0.5 * sin(uTime * 1.9 - t * 14. + ph), 6.);
  float fogK = 1. - smoothstep(420., 800., distance(wp, cameraPosition));
  col = uCAmber * (0.8 + 4.4 * run * aR.w + 1.6 * aR.z) * fogK;
  size = 0.12 + 0.2 * aR.z;`);

// vent smoke: amber where it leaves the throat, cooling to the sonar's memory as it billows up
const SMOKE_VS = pointsVS(/* glsl */`
attribute vec4 aR;`, /* glsl */`
  // half of every plume (aR.z > 0.5) climbs 40..100 m as a narrow column, so the field reads from far up the trench
  float tall = step(0.5, aR.z);
  float life = fract(uTime * (0.05 + 0.05 * aR.y) + aR.x), h = life * mix(16. + 16. * aR.z, 40. + 60. * aR.z, tall);
  float rr = 0.5 + min(h, 26.) * (0.24 + 0.14 * aR.w) + max(h - 26., 0.) * 0.07, an = aR.w * 6.283 + h * 0.35 + uTime * 0.25;
  wp = position + vec3(cos(an) * rr + 0.9 * sin(h * 0.3 + uTime * 0.4 + aR.x * 9.), h, sin(an) * rr + 0.12 * h);
  float fl = 0.75 + 0.25 * sin(uTime * 7. + aR.x * 40.), dc = distance(wp, cameraPosition);
  col = uCAmber * 2.5 * exp(-h * 0.05) * fl + (sonar(wp, 0.12, 0.3) + uCFar * 0.06) * (1. - life) * smoothstep(1., 5., h);
  col *= smoothstep(3., 14., dc) * (1. - 0.5 * smoothstep(0.75, 1., life));
  size = min(0.52, 0.28 + h * 0.03) * (1. + min(dc, 520.) / 170.) * mix(0.55, 1., smoothstep(6., 45., dc));`);

// living creatures: a point cloud skinned by sines. aL = (t along the limb, flex, phase, flare weight),
// aD = flare direction, aB = bend direction, aS = (size, brightness, mantle weight)
const CREATURE_VS = pointsVS(/* glsl */`
attribute vec4 aL; attribute vec3 aD, aB, aS;
uniform float uFlare, uPulse, uFreq, uWave, uSelf, uRainbow, uFront, uFade; uniform vec3 uTintC;`, /* glsl */`
  vec3 p = position;
  p += aD * (uFlare * aL.w * aL.x);
  p += aB * aL.y * sin(uTime * uFreq - aL.x * uWave + aL.z);
  p.xy *= 1. - uPulse * aS.z * 0.3;
  wp = (modelMatrix * vec4(p, 1.)).xyz;
  float fr = 0.;
  for (int i = 0; i < 8; i++) {
    vec4 e = uEmit[i], eb = uEmitB[i];
    if (eb.x < 0.) continue;
    float x = e.w * eb.x - distance(wp, e.xyz), f = x / 4.;
    fr += eb.y * (exp(-f * f) + step(0., x) * 0.45 * exp(-x / e.w * 1.4));
  }
  float tw = 0.75 + 0.25 * sin(uTime * (1.5 + 2. * h11(aL.z)) + aL.z * 17.);
  vec3 c = uTintC;
  if (uRainbow > 0.) {
    float hue = aL.x * 2.5 - uTime * 1.6 + aL.z;
    vec3 rb = 0.55 + 0.45 * cos(6.283 * (hue + vec3(0., 0.33, 0.67)));
    c = mix(c, rb * (0.6 + 0.8 * pow(0.5 + 0.5 * sin(hue * 6.283), 3.)), uRainbow * aL.w);
  }
  col = c * aS.y * tw * (uSelf + uFront * min(fr, 1.6)) * (1. - uFade * 0.6 * smoothstep(150., 420., distance(wp, cameraPosition)));
  size = aS.x;`);

// krill round the cut face: a slow double vortex of living sparks about the approach to the portal
const DRIFT_VS = pointsVS(/* glsl */`
attribute vec3 aR; uniform vec3 uSeat, uAxis; uniform float uShow;`, /* glsl */`
  float dir = aR.z > 0.5 ? 1. : -1.;
  float a = aR.x * 6.283 + uTime * (0.22 + 0.3 * aR.y) * dir;
  float r = 5.6 + 5.4 * aR.y + 1.1 * sin(uTime * 0.6 + aR.x * 20.);
  vec3 ux = normalize(cross(uAxis, vec3(0., 1., 0.)));
  float along = position.x + 1.6 * sin(uTime * 0.4 + aR.z * 30.);
  wp = uSeat + uAxis * along + (ux * cos(a) + vec3(0., 1., 0.) * sin(a)) * r;
  if (position.y > 0.5) {   // some climb in a slow helix above the break: a sign of the goal over the liner's superstructure
    float hh = fract(aR.x + uTime * 0.012 * (0.5 + aR.y)), a2 = aR.z * 6.283 + uTime * 0.15 * dir + hh * 5.;
    wp = uSeat + uAxis * 2. + (ux * cos(a2) + uAxis * sin(a2)) * (1.5 + 5. * aR.y * (0.4 + hh)) + vec3(0., 11. + hh * 46., 0.);
  }
  float tw = 0.5 + 0.5 * sin(uTime * (2. + 3. * aR.z) + aR.x * 40.);
  col = uCAmber * (0.5 + 2.4 * tw * tw) * uShow * (1. - smoothstep(160., 380., distance(wp, cameraPosition)));
  size = 0.1 + 0.08 * aR.z;`);

// amphipods on the outside of the glass: a few pale crawlers round the edge of the view (camera space)
const AMPHI_VS = pointsVS(/* glsl */`
uniform vec3 uFwd, uRight, uUp; uniform float uShow;`, /* glsl */`
  float id = position.z, th = (h11(id) + uTime * 0.006 * (h11(id + 3.) - 0.5)) * 6.283;
  vec2 c = vec2(clamp(cos(th) * 1.5, -1., 1.) * 0.9, clamp(sin(th) * 1.5, -1., 1.) * 0.88);
  float wig = 0.5 + 0.5 * sin(uTime * 6. + id * 3. + position.x * 40.);
  vec2 tg = normalize(vec2(-sin(th), cos(th)) + 1e-4), o = (tg * position.x + vec2(-tg.y, tg.x) * position.y * (0.75 + 0.5 * wig)) * 1.2;
  vec3 d = uFwd + uRight * (c.x + o.x * projectionMatrix[0][0]) / projectionMatrix[0][0] + uUp * (c.y + o.y * projectionMatrix[1][1]) / projectionMatrix[1][1];
  wp = cameraPosition + d * 1.15;
  col = (uCFront * 0.5 + uCAmber * 0.4) * uShow * (0.7 + 0.3 * wig);
  size = 0.008;`);

// self-lit lamps and the lander's strobe (a handful of points written on the CPU)
const LAMP_VS = pointsVS(/* glsl */`
attribute vec4 aC;`, /* glsl */`
  wp = position; col = aC.rgb; size = aC.w;`);

const CONE_VS = /* glsl */`
varying float vT; varying vec3 vN, vE;
void main() { vT = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vE = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const CONE_FS = /* glsl */`
uniform vec3 uCAmber; uniform float uTime;
varying float vT; varying vec3 vN, vE;
void main() { float f = pow(abs(dot(vN, vE)), 1.5); gl_FragColor = vec4(uCAmber * f * pow(vT, 1.6) * 0.28 * (0.9 + 0.1 * sin(uTime * 9.)), 1.); }`;

// ------------------------------------------------------------------ creature point clouds
function makeCloud() {
  const P = [], L = [], D = [], B = [], S = [];
  return {
    n: 0,
    // p [x,y,z], l [t, flex, phase, flareW], d flare dir, b bend dir, s [size, bright, mantle]
    add(p, l, d, b, s) { P.push(p[0], p[1], p[2]); L.push(l[0], l[1], l[2], l[3]); D.push(d[0], d[1], d[2]); B.push(b[0], b[1], b[2]); S.push(s[0], s[1], s[2]); this.n++; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 4));
      g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 3));
      return g;
    },
  };
}
const Z3 = [0, 0, 0];
// a spindle of points snapped to rings and meridians so it reads as a drawing; rad(t) is the radius profile
function spindle(C, rng, n, z0, z1, rad, opt = {}) {
  const rings = opt.rings || 22, mer = opt.mer || 10, sx = opt.sx ?? 1, sy = opt.sy ?? 1;
  for (let i = 0; i < n; i++) {
    let t = rng(), a = rng() * TAU;
    const k = rng();
    if (k < 0.45) t = Math.round(t * rings) / rings; else if (k < 0.8) a = (Math.round((a / TAU) * mer) / mer) * TAU;
    const r = rad(t), z = lerp(z0, z1, t);
    const l = opt.limb ? opt.limb(t) : [t, 0, 0, 0];
    C.add([Math.cos(a) * r * sx + (opt.ox || 0), Math.sin(a) * r * sy + (opt.oy || 0), z], l, opt.d || Z3, opt.b || Z3, [opt.size || 0.06, opt.bright || 1, opt.mantle || 0]);
  }
}
// giant squid, 12 m: mantle tip at +Z (it jets that way), arms trailing toward -Z
function squidCloud(rng) {
  const C = makeCloud();
  spindle(C, rng, 2300, 0.5, 6.8, (t) => 0.9 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.16 + t * 0.84)), 0.7) + 0.02, { rings: 26, mer: 12, mantle: 1, size: 0.055 });
  for (let i = 0; i < 520; i++) {                                   // two fins near the tip
    const s = i % 2 ? 1 : -1, t = rng(), z = lerp(4.3, 6.6, rng()), w = 1.5 * Math.sin(Math.PI * (z - 4.3) / 2.3);
    const tt = rng() < 0.4 ? 1 : t;
    C.add([s * (0.35 + w * tt), 0, z], [tt, 0.32 * tt, z * 1.4, 0], Z3, [0, 1, 0], [0.05, 0.9, 0]);
  }
  spindle(C, rng, 320, -0.9, 0.5, (t) => 0.5 + 0.08 * Math.sin(t * Math.PI), { rings: 6, mer: 8, size: 0.055 });
  for (const s of [-1, 1]) for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, r = i < 14 ? 0.22 : 0.1; C.add([s * 0.52, 0.05 + Math.sin(a) * r, -0.2 + Math.cos(a) * r], [0, 0, i, 0], Z3, Z3, [0.07, 2.2, 0]); }
  for (let k = 0; k < 10; k++) {                                    // eight arms, two long tentacles
    const tent = k >= 8, a = tent ? (k === 8 ? 0.35 : Math.PI - 0.35) : (k / 8) * TAU + 0.2, len = tent ? 7.6 : 4.3, n = tent ? 380 : 300;
    const dx = Math.cos(a), dy = Math.sin(a);
    for (let i = 0; i < n; i++) {
      const t = Math.pow(rng(), tent ? 0.7 : 0.9), club = tent && t > 0.84;
      const thick = club ? 0.2 : tent ? 0.035 : 0.14 * (1 - t) + 0.02, b = rng() * TAU;
      const sucker = !club && rng() < 0.3;
      C.add([dx * 0.32 + Math.cos(b) * thick, dy * 0.32 + Math.sin(b) * thick, -0.9 - t * len],
        [t, (tent ? 0.55 : 0.34) * t, k * 0.9, tent ? 0.55 : 1], [dx * 3.4, dy * 3.4, 1.4], [-dy, dx, 0], [sucker ? 0.07 : 0.045, sucker ? 1.5 : 0.85, 0]);
    }
  }
  return C;
}
// sleeper shark, 8 m: snout at +Z, a slow sweep that grows toward the tail
function sharkCloud(rng) {
  const C = makeCloud(), tOf = (z) => (4 - z) / 8, fx = (z) => 0.9 * Math.pow(tOf(z), 2.2);
  const limb = (z) => [tOf(z), fx(z), 0, 0], BX = [1, 0, 0];
  for (let i = 0; i < 2600; i++) {
    let t = rng(), a = rng() * TAU; const k = rng();
    if (k < 0.45) t = Math.round(t * 30) / 30; else if (k < 0.8) a = (Math.round((a / TAU) * 10) / 10) * TAU;
    const z = 4 - t * 8, r = 0.95 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.9)), 0.8) * (1 - 0.45 * t) + 0.03;
    C.add([Math.cos(a) * r * 0.82, Math.sin(a) * r, z], limb(z), Z3, BX, [0.06, 1, 0]);
  }
  const fin = (n, f) => { for (let i = 0; i < n; i++) { const p = f(rng(), rng() < 0.45 ? 1 : rng()); C.add(p, limb(p[2]), Z3, BX, [0.055, 0.9, 0]); } };
  fin(260, (u, v) => [0, 0.75 + 0.85 * v * (1 - u * 0.5), 0.6 - u * 1.5 - v * 0.7]);                     // dorsal
  for (const s of [-1, 1]) for (let i = 0; i < 260; i++) { const v = Math.pow(rng(), 0.8), u = rng() < 0.5 ? (rng() < 0.6 ? 0 : 1) : rng(), p = [s * (0.6 + 1.5 * v), -0.45 - 0.35 * v, 2.0 - u * 1.1 * (1 - v * 0.75) - v * 0.9]; C.add(p, limb(p[2]), Z3, BX, [0.055, 0.9, 0]); }   // pectorals
  for (let i = 0; i < 380; i++) { const up = rng() < 0.62, v = rng(), w = rng() < 0.5 ? (rng() < 0.6 ? 0 : 1) : rng(), p = [0, (up ? 1 : -0.6) * 1.7 * v, -3.7 - v * (up ? 1.2 : 0.6) - w * 0.75 * (1 - v)]; C.add(p, limb(p[2]), Z3, BX, [0.055, 0.9, 0]); }   // tail
  for (const s of [-1, 1]) for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; C.add([s * 0.42, 0.18 + Math.sin(a) * 0.09, 3.1 + Math.cos(a) * 0.09], limb(3.1), Z3, BX, [0.06, 2.2, 0]); }
  for (let g = 0; g < 5; g++) for (const s of [-1, 1]) for (let i = 0; i < 12; i++) C.add([s * 0.74, -0.3 + i * 0.05, 2.3 - g * 0.16], limb(2.2), Z3, BX, [0.04, 1.3, 0]);
  return C;
}
// a swarm of comb jellies: lobed ovals whose eight comb rows run with rainbow light
function jellyCloud(rng, path, d0, count, C = makeCloud(), a0 = -34, a1 = 30, r0 = 4.5, r1 = 17) {
  const c = new THREE.Vector3(), tg = new THREE.Vector3(), rt = new THREE.Vector3(), q = new THREE.Quaternion(), v = new THREE.Vector3(), e = new THREE.Euler(), dd = new THREE.Vector3();
  for (let j = 0; j < count; j++) {
    const along = rng.range(a0, a1), ang = rng() * TAU, rad = rng.range(r0, r1);
    path.posAtDist(d0 + along, c); path.tangentAtDist(d0 + along, tg); rt.set(tg.z, 0, -tg.x).normalize();
    c.addScaledVector(rt, Math.cos(ang) * rad).y += Math.sin(ang) * rad * 0.7;
    const sc = rng.range(0.8, 1.9), ph = rng() * 20;
    q.setFromEuler(e.set(rng.range(-0.6, 0.6), rng() * TAU, rng.range(-0.6, 0.6)));
    const put = (x, y, z, l, d, s) => { v.set(x, y, z).multiplyScalar(sc).applyQuaternion(q).add(c); dd.set(d[0], d[1], d[2]).applyQuaternion(q); C.add([v.x, v.y, v.z], l, [dd.x, dd.y, dd.z], [0, 1, 0], s); };
    for (let r = 0; r < 8; r++) {
      const a = (r / 8) * TAU;
      for (let i = 0; i < 20; i++) { const t = i / 19, th = 0.25 + t * 2.6, rr = 0.42 * Math.sin(th); put(Math.cos(a) * rr, 0.62 * Math.cos(th), Math.sin(a) * rr, [t, 0.35, ph + r * 0.4, 1], [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12], [0.05 * sc, 1.5, 0]); }
    }
    for (let i = 0; i < 46; i++) { const th = rng() * Math.PI, a = rng() * TAU, rr = 0.4 * Math.sin(th); put(Math.cos(a) * rr, 0.6 * Math.cos(th), Math.sin(a) * rr, [rng(), 0.35, ph, 0], Z3, [0.035 * sc, 0.45, 0]); }
    for (let s = 0; s < 2; s++) for (let i = 0; i < 14; i++) { const t = i / 13; put((s ? 0.2 : -0.2), -0.6 - t * 1.6, 0, [t, 0.35 + 0.3 * t, ph + s, 0], Z3, [0.03 * sc, 0.6, 0]); }
  }
  return C;
}
// dumbo octopus: a dome, two ear fins that flap, a webbed skirt that pulses
function octopusCloud(rng) {
  const C = makeCloud();
  for (let i = 0; i < 420; i++) {
    let th = rng() * 1.75, a = rng() * TAU; if (rng() < 0.5) th = Math.round(th * 5) / 5; else a = (Math.round((a / TAU) * 10) / 10) * TAU;
    C.add([Math.sin(th) * 0.55 * Math.cos(a), 0.2 + Math.cos(th) * 0.62, Math.sin(th) * 0.55 * Math.sin(a)], [0, 0, i, 0], Z3, Z3, [0.035, 1, 0]);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 150; i++) {
    const t = rng() < 0.4 ? 1 : rng(), w = (rng() - 0.5) * 0.5 * Math.sin(Math.PI * Math.min(1, t + 0.15));
    C.add([s * (0.45 + 0.6 * t), 0.5 + 0.1 * t, w], [t, 0.55 * t, 0, 0], Z3, [0, 1, 0.4], [0.035, 1.2, 0]);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; C.add([s * 0.3 + Math.cos(a) * 0.06, 0.3 + Math.sin(a) * 0.06, 0.48], [0, 0, i, 0], Z3, Z3, [0.04, 2.4, 0]); }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU, dx = Math.cos(a), dz = Math.sin(a);
    for (let i = 0; i < 46; i++) { const t = i / 45; C.add([dx * (0.3 + 0.35 * t), -0.1 - t * 0.75, dz * (0.3 + 0.35 * t)], [t, 0.1 * t, k, 1], [dx * 0.55, 0.25, dz * 0.55], [-dz, 0, dx], [0.035, 1, 0]); }
    for (let i = 0; i < 24; i++) { const t = 0.3 + 0.7 * rng(), b = a + rng() * (TAU / 8); C.add([Math.cos(b) * (0.3 + 0.35 * t), -0.1 - t * 0.75, Math.sin(b) * (0.3 + 0.35 * t)], [t, 0, k, 1], [Math.cos(b) * 0.55, 0.25, Math.sin(b) * 0.55], Z3, [0.028, 0.5, 0]); }
  }
  return C;
}
// the rare thing: a vast slow winged body, 240 m, drawn as a plan-form outline (dense edges, sparse ribs, an eye).
// Head at +Z, back at +Y.
function leviathanCloud(rng) {
  const C = makeCloud(), BY = [0, 1, 0];
  const hw = (t) => 17 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.07 + t * 0.6)), 0.7) * (1 - 0.72 * smoothstep(0.3, 0.95, t)) + 0.6;
  const zOf = (t) => 100 - t * 240, flex = (t) => 15 * t * t;
  const lead = (u) => 66 - 78 * Math.pow(u, 1.25), trail = (u) => -52 + 40 * Math.pow(u, 0.75);
  const wing = (s, u, v, big) => { const z = lerp(lead(u), trail(u), v), t = (100 - z) / 240; C.add([s * (hw(t) * (1 - u) + 80 * u), 1 + 5 * u * u, z], [t + 0.25 * u, flex(t) + 13 * u * u, 0, 0], Z3, BY, big ? [1.25, 1.25, 0] : [0.8, 0.42, 0]); };
  for (let i = 0; i < 1500; i++) { const t = Math.pow(rng(), 0.9), s = i % 2 ? 1 : -1; if (t > 0.12 && t < 0.62 && rng() < 0.75) continue; C.add([s * hw(t), 0, zOf(t)], [t, flex(t), 0, 0], Z3, BY, [1.25, 1.25, 0]); }   // body edge (open where the wings join)
  for (let i = 0; i < 1500; i++) { const s = i % 2 ? 1 : -1, u = rng(); wing(s, u, rng() < 0.58 ? 0 : 1, true); }                 // wing edges
  for (let i = 0; i < 700; i++) { const s = i % 2 ? 1 : -1; wing(s, Math.round(rng() * 9) / 9, rng(), false); }                   // wing rays
  for (let i = 0; i < 900; i++) { const t = Math.round(rng() * 30) / 30, x = (rng() * 2 - 1) * hw(t); C.add([x, 2.5 * (1 - Math.pow(x / hw(t), 2)), zOf(t)], [t, flex(t), 0, 0], Z3, BY, [0.8, 0.4, 0]); }   // ribs
  for (let i = 0; i < 260; i++) { const t = rng(); C.add([0, 3, zOf(t)], [t, flex(t), 0, 0], Z3, BY, [0.9, 0.7, 0]); }             // spine
  for (let i = 0; i < 700; i++) {                                                                                                   // flukes
    const s = i % 2 ? 1 : -1, u = rng(), e = rng() < 0.5;
    C.add([s * 40 * u, 0, -140 - (e ? 26 * Math.pow(u, 0.7) : 6 * Math.sin(Math.PI * u) + 26 * u * u)], [1 + 0.15 * u, 15 + 5 * u, 0, 0], Z3, BY, [1.2, 1.2, 0]);
  }
  for (const s of [-1, 1]) {                                                                                                        // eyes and gill slits
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, r = i % 2 ? 3.2 : 1.3; C.add([s * 9.5 + Math.cos(a) * r, 2.5, 74 + Math.sin(a) * r * 1.3], [0.11, flex(0.11), 0, 0], Z3, BY, [1.5, 2.6, 0]); }
    for (let g = 0; g < 5; g++) for (let i = 0; i < 22; i++) { const v = i / 21; C.add([s * (5 + 7 * v), 2, 52 - g * 6.5 - 5 * v * v], [0.22, flex(0.22), 0, 0], Z3, BY, [0.8, 0.8, 0]); }
  }
  return C;
}

const hash2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

export default {
  id: 'the-sounding',
  name: 'The Sounding',
  category: 'ocean',
  weirdness: 0.3,
  media: ['underwater'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const rare = !!vary.rare;

    // ---------------------------------------------------------------- per-seed character
    for (let i = 0; i < 6; i++) rng();                                  // the first draws of neighbouring seeds run close together
    const sv = (rng() * 7.13 + rng() * 3.71 + rng() * 1.37) % 1;
    const look = sv < 0.36 ? 0 : sv < 0.68 ? 1 : 2, scheme = SCHEMES[look];
    const interval = look === 0 ? rng.pick([3, 3, 3.5]) : look === 1 ? rng.pick([2, 2.5]) : rng.pick([3, 3.5]);   // calm cyan, urgent phosphor, slow indigo
    const snowAmt = (look === 0 ? rng.range(0.8, 1.05) : look === 1 ? rng.range(1.2, 1.4) : rng.range(0.42, 0.62)) * density;
    const cast = ['squid', 'shark', 'jellies'][look];
    const nVents = Math.round(rng.range(11, 15));
    const nSchools = Math.round(rng.range(5, 8) * density);
    const wob = rng.range(-1, 1);
    const pal = scheme.pal;


    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 300, 720);

    // ---------------------------------------------------------------- hero: the liner, bow toward the camera
    const HX = 16, HZ = 760;
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, { palette: pal, range: [100, 300], seabed: true });
    hero.object.position.set(HX, 0, HZ); hero.object.rotation.y = Math.PI; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    hero.setEmitter(0, new THREE.Vector3(), -1); hero.setCut(-0.2);      // take the hero out of its stand-alone demo
    const SU = hero.sonar.uniforms;
    SU.uGain.value.set(2.2, look === 2 ? 1.5 : 1.4, look === 2 ? 1.3 : 1.2);
    const toW = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const A = hero.anchors;
    const fly = A.flyThrough.map(toW), seat = toW(A.portalSeat.position);
    fly[0].y -= 2; fly[1].y -= 4.5; fly[2].y -= 4.5;                    // come in low, so the stem towers over the sphere
    await ctx.yield();

    // ---------------------------------------------------------------- the flight
    const path = makePath([
      [0, 190, 0], [0, 186, 50], [5 + wob * 3, 150, 128], [6 + wob * 5, 113, 235], [wob * 4, 71, 330], [-6, 41, 410], [-5, 16, 492],
      ...fly,
    ]);
    const LEN = path.length;
    // path height / x as a function of z (the route runs steadily +z)
    const PZ = [], PX = [], PY = [];
    { const v = new THREE.Vector3(); for (let i = 0; i <= 300; i++) { path.pointAt(i / 300, v); PZ.push(v.z); PX.push(v.x); PY.push(v.y); } }
    const atZ = (z, arr) => {
      if (z <= PZ[0]) return arr[0]; if (z >= PZ[300]) return arr[300];
      let lo = 0, hi = 300; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PZ[m] <= z) lo = m; else hi = m; }
      return lerp(arr[lo], arr[hi], (z - PZ[lo]) / Math.max(1e-6, PZ[hi] - PZ[lo]));
    };
    const pathY = (z) => atZ(z, PY), pathX = (z) => atZ(z, PX);
    const uOfPoint = (p) => { let best = 1e9, bu = 0; const v = new THREE.Vector3(); for (let i = 0; i <= 600; i++) { const d = path.pointAt(i / 600, v).distanceToSquared(p); if (d < best) { best = d; bu = i / 600; } } return bu; };

    // sub pings, keyed to u: the three that draw the liner fall where the hero wants them; the rest count back from there
    const uR = [uOfPoint(fly[0]) - 0.012, uOfPoint(fly[3]) - 0.02, uOfPoint(fly[5])];
    const pingU = [];
    { let u = uR[0]; for (let k = 1; k < 40; k++) { u -= (u > 0.5 ? Math.min(interval, 3) : interval) / DUR; if (u < 0.02) break; pingU.unshift(u); } }   // never more than 3 s apart on the run-in to the wreck
    if (pingU[0] > 0.065) pingU.unshift(0.022);
    pingU.unshift(-0.02 - Math.min(interval, 3) / DUR, -0.02);         // two already ringing when the world is first seen (through the portal)
    const iReveal = pingU.length;
    pingU.push(uR[0], uR[0] + 1.5 / DUR, (uR[0] + uR[1]) / 2, uR[1], (uR[1] + uR[2]) / 2, uR[2], Math.min(0.965, uR[2] + 3 / DUR));   // never a dark gap between the liner's shells
    const pings = pingU.map((u) => ({ u, pos: path.pointAt(Math.max(0, u)), slot: 0, life: 6.6 }));
    { const last = [null, null, null, null];                           // each ping takes the slot that has been ringing longest; the one it replaces fades out first
      for (const pg of pings) { let b = 0; for (let i = 1; i < 4; i++) if ((last[i] ? last[i].u : -9) < (last[b] ? last[b].u : -9)) b = i; if (last[b]) last[b].life = Math.min(last[b].life, (pg.u - last[b].u) * DUR); pg.slot = b; last[b] = pg; } }
    // the cut face is drawn by the third liner ping, the one sounded where the path leaves the promenade to cross the
    // break (the hero's own cut ping origin). Its wave starts when that shell reaches the face and runs from the shell
    // plating to the well's innermost ring in exactly the flight that is then left to the seat.
    const iCut = iReveal + 5, cutDist = pings[iCut].pos.distanceTo(seat);
    const cutLeft = Math.max(0.5, (1 - pings[iCut].u) * DUR - cutDist / 150), cutRate = (hero.cutEnd + 0.1) / cutLeft;

    // ---------------------------------------------------------------- trench: two walls of stacked columns, a floor
    const halfW0 = (z) => lerp(190, 73, smoothstep(0, 620, z));
    const cxOf = (z) => 8 * smoothstep(400, 650, z);
    const zRise = 238;                                                  // where the trench floor starts to climb out of the abyss toward the vent plain
    const floorBase = (z) => lerp(-150, 0, smoothstep(zRise, 345, z));
    const wallX = (s, z, y) => {
      const ci = Math.floor(z / 11), st = ci * 0.618034 + 0.25;
      const tier = Math.floor((y + 30 * Math.sin(z * 0.004) + 26 * (st - Math.floor(st))) / 60);   // each column steps into its next tier at its own height (as TRENCH_FS draws it)
      const h = hash2(ci, tier);
      return cxOf(z) + s * (halfW0(z) - 0.2 * pathY(z) - 2.5 + 0.1 * y + 6 * tier + 9 * h + 14 * noise.fbm2(z * 0.004 + s * 31, y * 0.004, 2));
    };
    const apronE = (x, z) => Math.hypot((x - (HX + 20)) / 126, (z - HZ) / 222);
    const floorY = (x, z) => {
      const e = apronE(x, z);
      const m = 3.2 * Math.pow(Math.abs(noise.n2(x * 0.035, z * 0.035)), 1.5) + 1.6 * noise.fbm2(x * 0.012 + 9, z * 0.012, 3) + 0.5 * noise.n2(x * 0.11, z * 0.11);
      return floorBase(z) - 1 + m * smoothstep(250, 330, z) - 7.5 * (1 - smoothstep(0.58, 0.84, e));
    };
    const TB = makeBuilders();
    const Z0 = -90, Z1 = 1050, NZW = 228, NYW = 70;
    // built in z-bands (the same vertices, band seams doubled) so that no step of the build holds the page for long
    const WB = 12, FB = 5;
    for (const s of [-1, 1]) for (let k = 0; k < WB; k++) {
      const za = lerp(Z0, Z1, k / WB), zb = lerp(Z0, Z1, (k + 1) / WB);
      TB.O.grid(NZW / WB, NYW, (a, b) => {
        const z = lerp(za, zb, a), py = pathY(z);
        const y0 = Math.max(floorBase(z) - 14, py - 175), y1 = py + 245;
        const y = lerp(y0, y1, Math.pow(b, 1.15));
        return [wallX(s, z, y), y, z, 1];
      }, 1, 0);
      await ctx.yield();
    }
    for (let k = 0; k < FB; k++) {
      const za = lerp(236, Z1, k / FB), zb = lerp(236, Z1, (k + 1) / FB);
      TB.O.grid(170 / FB, 52, (a, b) => {
        const z = lerp(za, zb, a), fb = floorBase(z) - 3;
        const xa = wallX(-1, z, fb) - 4, xb = wallX(1, z, fb) + 4, x = lerp(xa, xb, b);
        return [x, floorY(x, z), z, 0.8];
      }, 0.8, 1);
      await ctx.yield();
    }
    const trenchMat = hero.makeMaterial(TRENCH_VS, TRENCH_FS, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
    await ctx.yield();
    const trench = new THREE.Mesh(TB.O.geometry(), trenchMat);
    trench.frustumCulled = false; scene.add(trench);
    await ctx.yield();

    // ---------------------------------------------------------------- helpers along the path
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    const station = (d) => { path.posAtDist(d, _p); path.tangentAtDist(d, _t); const r = new THREE.Vector3(-_t.z, 0, _t.x).normalize(); return { p: _p.clone(), t: _t.clone(), r }; };
    const pointsMat = (vs, extra = {}) => new THREE.ShaderMaterial({
      uniforms: { ...SU, ...extra }, vertexShader: vs, fragmentShader: POINTS_FS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const addPoints = (geo, mat, order = 3) => { const m = new THREE.Points(geo, mat); m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m; };
    const f32 = (a, n) => new THREE.Float32BufferAttribute(a, n);

    // ---------------------------------------------------------------- vent field: black smokers, tube worms, crinoids
    const PB = makeBuilders(), { L, O, R } = PB;
    const vents = [], smokeP = [], smokeR = [];
    for (let i = 0, tries = 0; i < nVents && tries < 400; tries++) {
      const zr = rng.range(350, 502), side = rng.sign(), lr = rng.range(13, 46);
      // the three tallest stand 10-13 m off the path where it has come down among them: a close pass through their smoke
      const z = i < 3 ? 442 + (zr - 350) * 0.36 : zr, lat = i < 3 ? 10 + (lr - 13) / 11 : lr * (i < 4 ? 0.55 : 1) + (i < 4 ? 6 : 0);
      const x = pathX(z) + side * lat;
      if (vents.some((v) => Math.hypot(v.x - x, v.z - z) < 10)) continue;
      const h = i < 3 ? rng.range(22, 30) : rng.range(8, 26), y0 = floorY(x, z) - 0.5;
      const top = h;
      vents.push({ x, y0, z, h: top, rb: 2.4 + top * 0.11, rt: rng.range(0.9, 1.6), sd: rng.range(0, 90), lx: rng.range(-0.06, 0.06), lz: rng.range(-0.06, 0.06) });
      i++;
    }
    const nField = vents.length;
    for (const [z, lat, h] of [[527, -17 - rng.range(0, 5), rng.range(17, 24)], [556, 23 + rng.range(0, 4), rng.range(14, 21)]]) {
      const x = pathX(z) + lat; vents.push({ x, y0: floorY(x, z) - 0.5, z, h, rb: 2.4 + h * 0.11, rt: rng.range(0.9, 1.6), sd: rng.range(0, 90), lx: rng.range(-0.06, 0.06), lz: rng.range(-0.06, 0.06) });
    }
    // tall plumes, outlier smokers and the krill helix draw on a stream of their own, so the vent field keeps its draws
    const xo = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':sounding-more'));
    const buildVent = (v, rng, worms) => {
      const NA = 16, NR = 9;
      const pt = (a, t) => {
        const ang = (a / NA) * TAU, lump = 1 + 0.4 * noise.n2(Math.cos(ang) * 1.3 + v.sd, t * 4.2 + Math.sin(ang) * 1.3) + 0.12 * Math.sin(t * 19 + v.sd);
        const r = lerp(v.rb, v.rt, Math.pow(t, 0.55)) * lump, y = t * v.h;
        return [v.x + Math.cos(ang) * r + v.lx * y, v.y0 + y, v.z + Math.sin(ang) * r + v.lz * y];
      };
      O.grid(NA, NR, (a, b) => pt(a * NA, b), 1.1, 0);
      for (let j = 1; j <= NR; j++) {
        const q = []; for (let a = 0; a < NA; a++) q.push(...pt(a, j / NR));
        L.pl(q, j === NR ? 0.16 : 0.09, j === NR ? 1.1 : 0.55, true);
      }
      for (let a = 0; a < NA; a += 2) { const q = []; for (let j = 0; j <= NR; j++) q.push(...pt(a + (j % 2) * 0.3, j / NR)); L.pl(q, 0.08, 0.45); }
      const nCr = Math.round(5 * density);
      for (let c = 0; c < nCr; c++) {                                   // crinoids: little swaying fans on the flanks
        const a = rng.range(0, NA), t = rng.range(0.25, 0.92), b = pt(a, t), ang = (a / NA) * TAU, ox = Math.cos(ang), oz = Math.sin(ang);
        L.seg(b[0], b[1], b[2], b[0] + ox * 0.5, b[1] + 0.5, b[2] + oz * 0.5, 0.05, 0.8, 0, 0.05);
        for (let k = 0; k < 7; k++) { const f = (k / 6 - 0.5) * 2.2; L.seg(b[0] + ox * 0.5, b[1] + 0.5, b[2] + oz * 0.5, b[0] + ox * (0.9 + 0.3 * Math.cos(f)) - oz * Math.sin(f) * 0.7, b[1] + 1.0 + 0.5 * Math.cos(f), b[2] + oz * (0.9 + 0.3 * Math.cos(f)) + ox * Math.sin(f) * 0.7, 0.04, 0.75, 0.05, 0.28); }
      }
      const mx = v.x + v.lx * v.h, my = v.y0 + v.h, mz = v.z + v.lz * v.h;
      R.add(mx, my + 0.3, mz, worms ? 2.2 : 1.5, 0, 0, 0, worms ? 2.2 : 1.5, 0, 2, 1.5, rng());
      R.add(mx, my + 1.0, mz, 0.6, 0, 0, 0, 0.6, 0, 2, 1.0, rng());
      const nS = Math.round(420 * density);
      for (let k = 0; k < nS; k++) { smokeP.push(mx, my, mz); smokeR.push(rng(), rng(), rng(), rng()); }
      for (let k = 0, nX = Math.round(180 * density); k < nX; k++) { smokeP.push(mx, my, mz); smokeR.push(xo(), xo(), xo(), xo()); }
      for (let c = 0; worms && c < 4; c++) {                            // tube-worm thickets round the foot
        const ca = rng() * TAU, cr = v.rb + rng.range(0.8, 4.5), cx = v.x + Math.cos(ca) * cr, cz = v.z + Math.sin(ca) * cr, nW = Math.round(rng.range(9, 16) * density);
        for (let k = 0; k < nW; k++) {
          const x = cx + rng.gauss() * 0.7, z = cz + rng.gauss() * 0.7, y = floorY(x, z) - 0.2, hh = rng.range(1.3, 2.6), lx = rng.range(-0.3, 0.3), lz = rng.range(-0.3, 0.3);
          L.seg(x, y, z, x + lx * 0.5, y + hh * 0.55, z + lz * 0.5, 0.07, 0.75, 0, 0.1);
          L.seg(x + lx * 0.5, y + hh * 0.55, z + lz * 0.5, x + lx, y + hh, z + lz, 0.07, 0.9, 0.1, 0.3);
          if (k % 2 === 0) R.add(x + lx, y + hh + 0.05, z + lz, 0.16, 0, 0, 0, 0.16, 0, 2, 1.1, rng());
        }
      }
    };
    for (let i = 0; i < vents.length; i++) { buildVent(vents[i], rng, true); await ctx.yield(); }
    await ctx.yield();
    // a few pillow-lava bosses and loose sea whips out on the plain, so the floor is never bare between vents
    for (let i = 0; i < Math.round(70 * density); i++) {
      const z = rng.range(345, 560), x = pathX(z) + rng.sign() * rng.range(5, 52), y = floorY(x, z) - 0.2;
      if (apronE(x, z) < 0.7) continue;
      const hh = rng.range(2.2, 4.4), lx = rng.range(-0.8, 0.8), lz = rng.range(-0.8, 0.8), q = [];
      for (let k = 0; k <= 4; k++) { const t = k / 4; q.push(x + lx * t * t, y + hh * t, z + lz * t * t); }
      L.pl(q, 0.06, 0.8, false, 0, 0.55);
      for (let k = 1; k <= 3; k++) { const t = k / 4, s = (k % 2 ? 1 : -1) * 0.6; L.seg(x + lx * t * t, y + hh * t, z + lz * t * t, x + lx * t * t + s, y + hh * t + 0.6, z + lz * t * t + s * 0.4, 0.04, 0.6, 0.55 * t, 0.55 * t + 0.2); }
    }
    // the gate of the trench: free-standing stacks of hexagonal basalt columns either side of the entry axis, their
    // stepped tops at eye level, so the first thing seen through the portal is lit by the lander's slow shells
    const sideL = wob > 0 ? -1 : 1;                                     // the lander hangs on the side the path leans away from
    const AX = [[0, 0], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1], [1, 1], [-1, 2], [-2, 1], [2, -1], [-1, -1]];
    const stacks = [[-20 * sideL, 72, 9], [25 * sideL, 97, 10], [-18 * sideL, 121, 8], [36 * sideL, 150, 9], [-38 * sideL, 104, 7]];
    for (const [sx, sz, nc] of stacks) {
      const RH = rng.range(2.5, 3.3), dd = RH * Math.sqrt(3), rot = rng.range(0, 1), cr = Math.cos(rot), sr = Math.sin(rot), base = rng.range(196, 208);
      for (let c = 0; c < nc; c++) {
        const [q, r] = AX[c], lx = dd * (q + r / 2), lz = dd * 0.866 * r, cx = sx + lx * cr - lz * sr, cz = sz + lx * sr + lz * cr;
        const top = base + (c === 0 ? 14 : rng.range(-26, 9)) - 2.5 * Math.hypot(q + r / 2, r), bot = 36 + rng.range(0, 20);
        if (path.nearestXZ(cx, cz).dist < RH + 8) continue;
        const hx = (k) => { const a = rot + (k + 0.5) * (TAU / 6); return [cx + Math.cos(a) * RH * 0.985, cz + Math.sin(a) * RH * 0.985]; };
        O.grid(6, 1, (a, t) => { const h = hx(Math.round(a * 6)); return [h[0], lerp(bot, top, t), h[1]]; }, 1.2, 0);
        { const ct = O.v(cx, top - 0.35, cz, 1.2); for (let k = 0; k < 6; k++) { const h0 = hx(k), h1 = hx(k + 1); O.quad(ct, O.v(h0[0], top, h0[1], 1.2), O.v(h1[0], top, h1[1], 1.2), ct); } }
        const lv = [top]; for (let y = top - rng.range(3, 9); y > bot; y -= rng.range(7, 15)) lv.push(y); lv.push(bot);
        const eb = [0, 1, 2, 3, 4, 5].map(() => rng.range(0.45, 0.95));
        for (let j = 0; j < lv.length - 1; j++) for (let k = 0; k < 6; k++) {
          const h0 = hx(k), h1 = hx(k + 1);
          L.seg(h0[0], lv[j], h0[1], h0[0], lv[j + 1], h0[1], 0.13, eb[k]);
          if (j === 0) L.seg(h0[0], top + 0.03, h0[1], h1[0], top + 0.03, h1[1], 0.15, 1.05);
          else if ((j + k + c) % 3 !== 0) L.seg(h0[0], lv[j], h0[1], h1[0], lv[j], h1[1], 0.07, 0.3);
        }
        if (rng() < 0.5) R.add(cx + rng.range(-1, 1), top + 0.3, cz + rng.range(-1, 1), 0.22, 0, 0, 0, 0.22, 0, 2, 0.9, rng());
      }
    }
    await ctx.yield();
    // outlier smokers high in the trench: four chimneys on basalt pinnacles beside the descent, their mouths just under
    // the sub's line, so plumes and sparks rise past the glass long before the vent field. They stand evenly spaced
    // along the trench from the last gate stack to where the floor starts to rise, the whole row shifted by a seeded
    // part of one spacing; they take sides in turn, the first across the path from that stack, 15 to 19 m off it.
    const gate = stacks.reduce((a, b) => (b[1] > a[1] ? b : a));        // the gate stack farthest down the trench
    const outStep = (zRise - gate[1]) / 4, outZ0 = gate[1] + xo.range(0, outStep);
    for (let n = 0; n < 4; n++) {
      const oz = outZ0 + n * outStep, lat = (n % 2 ? 1 : -1) * Math.sign(gate[0]) * xo.range(15, 19);
      const ox = pathX(oz) + lat, h = xo.range(8, 12), topC = pathY(oz) - 5 - h, RH = xo.range(2.4, 2.9), dd = RH * Math.sqrt(3), rot = xo.range(0, 1), cr = Math.cos(rot), sr = Math.sin(rot);
      for (let c = 0; c < 4; c++) {
        const [q, r] = AX[c], lx = dd * (q + r / 2), lz = dd * 0.866 * r, cx = ox + lx * cr - lz * sr, cz = oz + lx * sr + lz * cr;
        const top = topC + (c === 0 ? 0.6 : xo.range(-9, -1)), bot = topC - xo.range(55, 80);
        const hx = (k) => { const a = rot + (k + 0.5) * (TAU / 6); return [cx + Math.cos(a) * RH * 0.985, cz + Math.sin(a) * RH * 0.985]; };
        O.grid(6, 1, (a, t) => { const hh = hx(Math.round(a * 6)); return [hh[0], lerp(bot, top, t), hh[1]]; }, 1.2, 0);
        { const ct = O.v(cx, top - 0.35, cz, 1.2); for (let k = 0; k < 6; k++) { const h0 = hx(k), h1 = hx(k + 1); O.quad(ct, O.v(h0[0], top, h0[1], 1.2), O.v(h1[0], top, h1[1], 1.2), ct); } }
        const lv = [top]; for (let y = top - xo.range(3, 9); y > bot; y -= xo.range(7, 15)) lv.push(y); lv.push(bot);
        for (let j = 0; j < lv.length - 1; j++) for (let k = 0; k < 6; k++) {
          const h0 = hx(k), h1 = hx(k + 1);
          L.seg(h0[0], lv[j], h0[1], h0[0], lv[j + 1], h0[1], 0.13, 0.5 + 0.45 * ((k * 7 + c * 3) % 5) / 4);
          if (j === 0) L.seg(h0[0], top + 0.03, h0[1], h1[0], top + 0.03, h1[1], 0.15, 1.05);
          else if ((j + k + c) % 3 !== 0) L.seg(h0[0], lv[j], h0[1], h1[0], lv[j], h1[1], 0.07, 0.3);
        }
      }
      const v = { x: ox, y0: topC - 0.4, z: oz, h, rb: 2.0 + h * 0.08, rt: xo.range(0.9, 1.4), sd: xo.range(0, 90), lx: xo.range(-0.05, 0.05), lz: xo.range(-0.05, 0.05) };
      vents.push(v); buildVent(v, xo, false);
      await ctx.yield();
    }
    await ctx.yield();
    // the same three materials as the hero, but never gated by the reveal shell
    const open = { value: new THREE.Vector4(0, 0, 0, 1e6) }, glowOpt = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
    const ungated = (m) => { m.uniforms.uGate = open; return m; };
    const occMat = ungated(hero.makeMaterial(SHADERS.OCC_VS, SHADERS.OCC_FS, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }));
    const ringMat = ungated(hero.makeMaterial(SHADERS.RING_VS, SHADERS.RING_FS, glowOpt)), lineMat = ungated(hero.makeMaterial(SHADERS.LINE_VS, SHADERS.LINE_FS, glowOpt));
    const propOcc = new THREE.Mesh(O.geometry(), occMat);
    await ctx.yield();
    const propRings = new THREE.Mesh(R.geometry(), ringMat);
    await ctx.yield();
    const propLines = new THREE.Mesh(L.geometry(), lineMat);
    await ctx.yield();
    propRings.renderOrder = 1; propLines.renderOrder = 2;
    for (const m of [propOcc, propRings, propLines]) { m.frustumCulled = false; scene.add(m); }
    { const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(smokeP, 3)); g.setAttribute('aR', f32(smokeR, 4)); addPoints(g, pointsMat(SMOKE_VS)); }
    await ctx.yield();

    // sea whips and glass sponges along the liner's promenade rail (hero space)
    { const WB = makeBuilders(), W = WB.L, g0 = A.davitGap, wx = g0.x - 1.1, wy = g0.y - 0.9;
      for (let i = 0; i < Math.round(22 * density); i++) {
        const z = rng.range(20, 78), hh = rng.range(2.6, 4.4), ox = rng.range(0.4, 1.5), oz = rng.range(-0.8, 0.8), q = [];
        for (let k = 0; k <= 4; k++) { const t = k / 4; q.push(wx + ox * t * t, wy + hh * t, z + oz * t); }
        W.pl(q, 0.05, 0.5, false, 0, 0.6);
      }
      for (let i = 0; i < 14; i++) {
        const z = rng.range(22, 76), r = rng.range(0.25, 0.42), hh = rng.range(0.8, 1.4);
        for (let k = 0; k <= 3; k++) W.ring(wx, wy + (hh * k) / 3, z, [1, 0, 0], [0, 0, 1], r * (0.45 + 0.55 * k / 3), r * (0.45 + 0.55 * k / 3), 9, 0.04, 0.7);
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; W.seg(wx + Math.cos(a) * r * 0.45, wy, z + Math.sin(a) * r * 0.45, wx + Math.cos(a) * r, wy + hh, z + Math.sin(a) * r, 0.04, 0.6); }
      }
      const m = new THREE.Mesh(W.geometry(), hero.materials.lines); m.frustumCulled = false; m.renderOrder = 2; hero.object.add(m); }

    // ---------------------------------------------------------------- vehicles: two robots, the lander, a second sub
    const lineMesh = (B) => { const m = new THREE.Mesh(B.L.geometry(), lineMat); m.frustumCulled = false; m.renderOrder = 2; return m; };
    const coneMat = new THREE.ShaderMaterial({ uniforms: { uCAmber: SU.uCAmber, uTime: SU.uTime }, vertexShader: CONE_VS, fragmentShader: CONE_FS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const robots = [];
    for (let i = 0; i < 2; i++) {
      const v = vents[Math.min(nField - 1, i === 0 ? 0 : 2 + Math.floor(nField / 2))], B = makeBuilders(), l = B.L;
      const side = Math.sign(v.x - pathX(v.z)) || 1;
      let bx = v.x - side * 5.5; if (Math.abs(bx - pathX(v.z)) < 9.5) bx = v.x + side * 5.5;
      l.box(-0.6, -0.4, -1, 0.6, 0.4, 1, 0.07, 1.1); l.box(-0.45, 0.4, -0.7, 0.45, 0.66, 0.7, 0.05, 0.7);
      for (const s of [-1, 1]) { l.ring(s * 0.78, 0, -0.75, [1, 0, 0], [0, 1, 0], 0.24, 0.24, 10, 0.05, 0.9); l.ring(s * 0.3, 0.5, 0.2, [1, 0, 0], [0, 0, 1], 0.18, 0.18, 8, 0.05, 0.8); }
      l.seg(0.3, -0.4, 0.9, 0.55, -0.95, 1.6, 0.06, 1, 0, 0.1); l.seg(0.55, -0.95, 1.6, 0.4, -1.35, 2.1, 0.06, 1, 0.1, 0.22);
      l.seg(0.4, -1.35, 2.1, 0.55, -1.55, 2.3, 0.05, 1, 0.22, 0.3); l.seg(0.4, -1.35, 2.1, 0.25, -1.55, 2.3, 0.05, 1, 0.22, 0.3);
      const q = [], bend = rng.range(18, 34) * -side, bz = rng.range(-20, 20);
      for (let k = 0; k <= 26; k++) { const t = k / 26; q.push(bend * (1 - Math.cos(t * 2.2)) * 0.6, 0.66 + 200 * t, -0.6 + bz * Math.sin(t * 2.4)); }
      l.pl(q, 0.07, 0.75, false, 0, 1.6);
      const g = new THREE.Group(); g.add(lineMesh(B));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 9, 18, 1, true).translate(0, -4.5, 0).rotateX(-0.65).translate(0, -0.3, 1), coneMat);
      cone.renderOrder = 3; g.add(cone); scene.add(g);
      robots.push({ g, base: new THREE.Vector3(bx, v.y0 + Math.max(4.5, v.h * rng.range(0.3, 0.6)), v.z + rng.range(-2, 2)), ph: rng.range(0, 9), yaw: Math.atan2(v.x - bx, 0.001), pos: new THREE.Vector3() });
    }
    const lander = new THREE.Group();
    { const B = makeBuilders(), l = B.L, U = [1, 0, 0], V = [0, 0, 1];
      l.ring(0, 0, 0, U, V, 1.7, 1.7, 8, 0.09, 1.1); l.ring(0, 1.5, 0, U, V, 1.1, 1.1, 8, 0.07, 0.9); l.ring(0, 2.3, 0, U, V, 0.55, 0.55, 10, 0.06, 0.9);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.5, c = Math.cos(a), s = Math.sin(a); l.seg(c * 1.7, 0, s * 1.7, c * 2.7, -2.6, s * 2.7, 0.09, 1); l.ring(c * 2.7, -2.6, s * 2.7, U, V, 0.5, 0.5, 8, 0.06, 0.9); l.seg(c * 1.1, 1.5, s * 1.1, c * 1.7, 0, s * 1.7, 0.07, 0.8); l.seg(c * 1.1, 1.5, s * 1.1, 0, 3.2, 0, 0.06, 0.8); }
      l.box(-0.5, 0.1, -0.5, 0.5, 1.2, 0.5, 0.06, 0.9);
      const q = []; for (let k = 0; k <= 22; k++) q.push(0, 3.2 + k * 16, 0); l.pl(q, 0.08, 0.8, false, 0, 0.9);
      lander.add(lineMesh(B)); scene.add(lander); }
    const landerBase = new THREE.Vector3(rng.range(9.5, 11.5) * sideL, 0, rng.range(80, 90));
    const sub2 = new THREE.Group();
    { const B = makeBuilders(), l = B.L;
      l.ring(0, 0, 2.2, [1, 0, 0], [0, 1, 0], 1.2, 1.2, 14, 0.09, 1.1); l.ring(0, 0, 2.2, [0, 0, 1], [0, 1, 0], 1.2, 1.2, 14, 0.07, 0.8); l.ring(0, 0, 2.2, [1, 0, 0], [0, 0, 1], 1.2, 1.2, 14, 0.07, 0.8);
      l.box(-1.1, -1.2, -4.5, 1.1, 0.9, 1.2, 0.09, 1); l.box(-0.5, 0.9, -2.6, 0.5, 1.7, -0.8, 0.07, 0.8);
      for (const s of [-1, 1]) { l.seg(s * 1.3, -1.6, -4, s * 1.3, -1.6, 2.4, 0.08, 0.9); l.ring(s * 1.5, 0, -4.2, [1, 0, 0], [0, 1, 0], 0.45, 0.45, 10, 0.06, 0.9); }
      sub2.add(lineMesh(B)); scene.add(sub2); }
    const sub2Base = new THREE.Vector3(rng.range(-115, -85), rng.range(115, 150), rng.range(240, 300));
    // the second sub does not stay put: it crosses ahead of us beyond the vents, then stands off over the wreck
    const s2X = station(0.585 * LEN + 30), s2j = rng.range(0, 8);
    const s2W = [sub2Base, s2X.p.clone().addScaledVector(s2X.r, 4 + s2j * 0.25).setY(s2X.p.y + 3), toW(new THREE.Vector3(-22, 62, 118)), toW(new THREE.Vector3(-8, 58, -62))];
    const s2U = [0.34, 0.585, uR[0] + 0.055, 0.92];
    const sub2At = (u, out) => {
      let i = 0; while (i < 2 && u > s2U[i + 1]) i++;
      const k = clamp((u - s2U[i]) / (s2U[i + 1] - s2U[i]), 0, 1);
      return out.lerpVectors(s2W[i], s2W[i + 1], k * k * (3 - 2 * k));
    };
    // two transponder beacons dropped at the wreck: slow shells that keep crossing the hull whatever the sub is doing
    const beacons = [toW(new THREE.Vector3(-9, 2.2, 188)), toW(new THREE.Vector3(27, 2.6, -24))];
    for (const bp of beacons) {
      const B = makeBuilders(), l = B.L, U = [1, 0, 0], V = [0, 0, 1];
      l.ring(0, 0, 0, U, V, 0.45, 0.45, 8, 0.07, 1); l.ring(0, 0.9, 0, U, V, 0.3, 0.3, 8, 0.06, 0.9); l.seg(0, 0.9, 0, 0, 2.1, 0, 0.07, 1);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU, c = Math.cos(a), sn = Math.sin(a); l.seg(c * 0.45, 0, sn * 0.45, c * 1.5, -2.4, sn * 1.5, 0.08, 0.9); l.seg(c * 0.45, 0, sn * 0.45, c * 0.3, 0.9, sn * 0.3, 0.06, 0.8); }
      const g = lineMesh(B); g.position.copy(bp); scene.add(g);
    }
    // lamps: 0 lander strobe, 1 lander pilot, 2-3 robot lamps, 4-5 second sub, 6-7 beacons
    const lampPos = new Float32Array(24), lampCol = new Float32Array(32);
    const lampGeo = new THREE.BufferGeometry();
    lampGeo.setAttribute('position', new THREE.BufferAttribute(lampPos, 3)); lampGeo.setAttribute('aC', new THREE.BufferAttribute(lampCol, 4));
    addPoints(lampGeo, pointsMat(LAMP_VS), 4);
    const amber = new THREE.Color(pal[6]), frontC = new THREE.Color(pal[5]);
    const setLamp = (i, p, c, k, size) => { lampPos[i * 3] = p.x; lampPos[i * 3 + 1] = p.y; lampPos[i * 3 + 2] = p.z; lampCol[i * 4] = c.r * k; lampCol[i * 4 + 1] = c.g * k; lampCol[i * 4 + 2] = c.b * k; lampCol[i * 4 + 3] = size; };
    await ctx.yield();

    // ---------------------------------------------------------------- the siphonophore veil
    const uVeil = 0.36 + rng.range(-0.015, 0.02), veilW = rng.range(52, 72), veilH = rng.range(20, 28);
    const veilMat = pointsMat(VEIL_VS);
    const veilGeo = (S, vW, vH, nCh, gap, r) => {
      const pos = [], ax = [], ar = [], ph0 = r.range(0, 9);
      const put = (lat, y, t, ph, big, run) => {
        const a = Math.abs(lat), g = Math.exp(-Math.pow((y - S.p.y) / 7.5, 2));
        const l2 = Math.sign(lat || 1) * (a < gap ? a + (gap - a) * g : a), dz = 2.6 * Math.sin(lat * 0.19 + ph0) + 1.2 * Math.sin(y * 0.3 + lat);
        pos.push(S.p.x + S.r.x * l2 + S.t.x * dz, y, S.p.z + S.r.z * l2 + S.t.z * dz); ax.push(S.r.x, 0, S.r.z); ar.push(t, ph, big, run);
      };
      for (let c = 0; c < nCh; c++) {
        const lat = ((c + r()) / nCh - 0.5) * vW, top = S.p.y + vH * 0.52 + 2.4 * Math.sin(lat * 0.14 + ph0) - 0.009 * lat * lat;
        const len = vH * r.range(0.6, 1.05) * (1 - 0.35 * Math.pow(Math.abs(lat) / (vW * 0.5), 2)), nb = Math.round(len / 0.5), ph = r();
        put(lat, top, 0, ph, 0.55, 0.4); put(lat + 0.25, top + 0.2, 0, ph + 0.3, 0.35, 0.4);
        for (let k = 1; k <= nb; k++) put(lat, top - (k / nb) * len, (k / nb) * (len / vH), ph, k % 7 === 0 ? 0.7 : r() * 0.25, 1);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('aAx', f32(ax, 3)); g.setAttribute('aR', f32(ar, 4));
      return g;
    };
    addPoints(veilGeo(station(uVeil * LEN), veilW, veilH, Math.round(150 * density), 7, rng), veilMat);
    await ctx.yield();

    // ---------------------------------------------------------------- lanternfish schools
    const fishMat = pointsMat(FISH_VS);
    { const pos = [], cen = [], ar = [];
      const seats = [new THREE.Vector3(-3 * sideL, 184, 84), toW(new THREE.Vector3(-5, 25, 170)), toW(new THREE.Vector3(3, 25, -10)), toW(new THREE.Vector3(27, 9, -30)), toW(new THREE.Vector3(30, 34, 96))];
      const nAll = nSchools + seats.length - 1, per = Math.round((2300 * density) / nAll);
      for (let s = 0; s < nAll; s++) {
        let c;
        if (s < seats.length) c = seats[s];
        else { const S = station(rng.range(0.1, 0.68) * LEN); c = S.p.clone().addScaledVector(S.r, rng.sign() * rng.range(11, 34)).addScaledVector(S.t, rng.range(-10, 10)); c.y += rng.range(-9, 10); }
        const rad = rng.range(3, 5.5) * (s === 0 ? 1.3 : 1);
        for (let i = 0; i < per; i++) { pos.push(rng.gauss() * rad, rng.gauss() * rad * 0.5, rng.gauss() * rad); cen.push(c.x, c.y, c.z); ar.push(rng(), rng(), rng()); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('aC', f32(cen, 3)); g.setAttribute('aR', f32(ar, 3));
      addPoints(g, fishMat); }
    await ctx.yield();

    // ---------------------------------------------------------------- marine snow (wraps round the camera; amber only in the lamp cones)
    const snowU = { uFwd: { value: new THREE.Vector3(0, 0, 1) }, uRight: { value: new THREE.Vector3(-1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uLamp: { value: 1 } };
    { const n = Math.min(11000, Math.round(8000 * snowAmt)), pos = new Float32Array(n * 3), ar = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i++) { pos[i] = rng() * 30; ar[i] = rng(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(ar, 3));
      addPoints(g, pointsMat(SNOW_VS, snowU), 5); }
    await ctx.yield();
    const driftU = { uShow: { value: 0 } };
    { const n = Math.round(760 * density), pos = [], ar = [], fc = A.portalSeat.facing.clone().transformDirection(hero.object.matrixWorld);
      for (let i = 0; i < n; i++) { pos.push(rng.range(0.5, 30), 0, 0); ar.push(rng(), Math.pow(rng(), 1.4), rng()); }
      for (let i = 0; i < Math.round(260 * density); i++) { pos.push(0, 1, 0); ar.push(xo(), xo(), xo()); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('aR', f32(ar, 3));
      addPoints(g, pointsMat(DRIFT_VS, { uSeat: { value: seat.clone() }, uAxis: { value: fc }, ...driftU })); }
    const amphiU = { uFwd: snowU.uFwd, uRight: snowU.uRight, uUp: snowU.uUp, uShow: { value: 0 } };
    { const pos = [];
      for (let c = 0; c < 6; c++) {
        for (let k = 0; k < 7; k++) { const t = k / 6 - 0.5; pos.push(t * 0.05, 0.012 * Math.cos(t * 3.1) - 0.006, c * 1.7 + 0.3); }      // arched body
        for (let k = 0; k < 4; k++) pos.push((k / 3 - 0.5) * 0.034, -0.016, c * 1.7 + 0.3);                                              // legs
        pos.push(0.034, 0.012, c * 1.7 + 0.3, 0.041, 0.018, c * 1.7 + 0.3);                                                           // antennae
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3));
      addPoints(g, pointsMat(AMPHI_VS, amphiU), 6); }
    await ctx.yield();

    // ---------------------------------------------------------------- the creature of the second ping: squid, shark or comb jellies
    const creatureU = { uFade: { value: 0 }, uFlare: { value: 0 }, uPulse: { value: 0 }, uFreq: { value: 2.2 }, uWave: { value: 5 }, uSelf: { value: 0.55 }, uRainbow: { value: 0 }, uFront: { value: 2.6 }, uTintC: { value: new THREE.Vector3(amber.r, amber.g, amber.b) } };
    let kS = 1; for (let k = 1; k < iReveal; k++) if (Math.abs(pingU[k] - 0.15) < Math.abs(pingU[kS] - 0.15)) kS = k;
    const uS = pingU[kS], dS = uS * LEN + 36;
    let castCloud;
    if (cast === 'squid') castCloud = squidCloud(rng); else if (cast === 'shark') castCloud = sharkCloud(rng);
    else {                                                              // the swarm in three goes (the same draws in the same order)
      const nJ = Math.round(26 * density), n1 = Math.ceil(nJ / 3), n2 = Math.ceil((nJ - n1) / 2);
      castCloud = jellyCloud(rng, path, dS + 18, n1); await ctx.yield();
      jellyCloud(rng, path, dS + 18, n2, castCloud); await ctx.yield();
      jellyCloud(rng, path, dS + 18, nJ - n1 - n2, castCloud);
    }
    await ctx.yield();
    const creature = addPoints(castCloud.geometry(), pointsMat(CREATURE_VS, creatureU));
    await ctx.yield();
    const creaturePos = new THREE.Vector3().copy(path.posAtDist(dS));
    if (cast === 'jellies') { creatureU.uRainbow.value = 1; creatureU.uFreq.value = 1.1; creatureU.uWave.value = 0.6; creatureU.uSelf.value = 0.8; creatureU.uFront.value = 2; }
    if (cast === 'shark') { creatureU.uFreq.value = 1.15; creatureU.uWave.value = 3.4; creature.scale.setScalar(1.15); }
    const ink = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
    { const p = ink.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.3 * noise.n3(x * 1.6, y * 1.6, z * 1.6) + 0.12 * noise.n3(x * 4, y * 4, z * 4); p.setXYZ(i, x * k, y * k * 0.8, z * k); } }
    ink.visible = false; if (cast === 'squid') scene.add(ink);
    const sideS = rng.sign();

    // dumbo octopus above the bridge
    const octoU = { uFade: { value: 0 }, uFlare: { value: 0 }, uPulse: { value: 0 }, uFreq: { value: 3.1 }, uWave: { value: 1.2 }, uSelf: { value: 0.9 }, uRainbow: { value: 0 }, uFront: { value: 2.2 }, uTintC: creatureU.uTintC };
    const octo = addPoints(octopusCloud(rng).geometry(), pointsMat(CREATURE_VS, octoU));
    const perch = toW(A.octopusPerch), uOct = uOfPoint(toW(A.bridgeWing));
    octo.scale.setScalar(1.9); octo.rotation.y = -Math.PI / 2;
    await ctx.yield();

    // rare: something vast crosses behind the liner, drawn once in violet by the second liner ping
    let levi = null; const leviU = { uFlare: { value: 0 }, uPulse: { value: 0 }, uFreq: { value: 0.9 }, uWave: { value: 2.4 }, uSelf: { value: 0 }, uRainbow: { value: 0 }, uFront: { value: 0 }, uTintC: { value: new THREE.Vector3(0.42, 0.2, 1.0).multiplyScalar(1.5) }, uFade: { value: 1 } };
    const leviC = new THREE.Vector3(HX - 4, 90, HZ + 220), leviDir = new THREE.Vector3(-0.62, 0.2, -0.75).normalize();
    if (rare) {
      levi = addPoints(leviathanCloud(rng).geometry(), pointsMat(CREATURE_VS, leviU), 1); levi.scale.setScalar(1.2);
      // plan-form turned to face the promenade: it crosses the trench above the break, banking, back toward us
      const yA = new THREE.Vector3(-0.1, -0.34, -0.94), xA = new THREE.Vector3();
      yA.addScaledVector(leviDir, -yA.dot(leviDir)).normalize(); xA.crossVectors(yA, leviDir);
      levi.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, leviDir));
    }
    const leviDelay = pings[iReveal + 3].pos.distanceTo(leviC) / 150;
    await ctx.yield();

    // ---------------------------------------------------------------- living light for the dim stretches (its own rng: the layout above is as it was)
    const xr = rng.fork('living');
    // the two dim stretches of the descent, as distances along the path: from abeam of the last gate stack down to the
    // veil, and from the veil on to where the sub sounds its first liner ping
    const dGate = path.nearestXZ(gate[0], gate[1]).u * LEN, dVeil = uVeil * LEN, dLiner = uR[0] * LEN;
    const dim = [[dGate, dVeil], [dVeil, dLiner]];
    { const pos = [], cen = [], ar = [];                                // lanternfish schools close beside the path
      // through each stretch the schools follow one another at gaps of 30 to 50 m, every gap drawn anew (the first
      // from the head of the stretch); they take sides in turn
      const fishD = []; for (const [da, db] of dim) for (let d = da + xr.range(30, 50); d < db; d += xr.range(30, 50)) fishD.push(d);
      fishD.forEach((d, k) => {
        const S = station(d), c = S.p.clone().addScaledVector(S.r, (k % 2 ? 1 : -1) * xr.range(7, 9)), rad = xr.range(2.6, 3.8); c.y -= 2;
        for (let i = 0; i < Math.round(220 * density); i++) { pos.push(xr.gauss() * rad, xr.gauss() * rad * 0.5, xr.gauss() * rad); cen.push(c.x, c.y, c.z); ar.push(xr(), xr(), xr()); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('aC', f32(cen, 3)); g.setAttribute('aR', f32(ar, 3));
      addPoints(g, fishMat); }
    // two small siphonophore strands, one in each dim stretch at a place drawn there. Both hang at the path's height
    // 13 m off it, on the side away from the creature. A strand is 14 m wide and a plume needs room, so a place with a
    // chimney standing within 15 m is drawn again (after twelve draws the clearest of them is taken).
    await ctx.yield();
    for (const [da, db] of dim) {
      let S = null, best = -1;
      for (let n = 0; n < 12 && best < 15; n++) {
        const T = station(xr.range(da, db)); T.p.addScaledVector(T.r, -sideS * 13);
        const room = vents.reduce((m, v) => Math.min(m, Math.hypot(v.x - T.p.x, v.z - T.p.z)), 1e9);
        if (room > best) { best = room; S = T; }
      }
      addPoints(veilGeo(S, 14, 12, Math.round(35 * density), 0, xr), veilMat);
    }
    await ctx.yield();
    // comb jellies drifting by the path, whatever the cast
    const jelU = { uFade: { value: 0 }, uFlare: { value: 0.5 }, uPulse: { value: 0 }, uFreq: { value: 1.1 }, uWave: { value: 0.6 }, uSelf: { value: 0.8 }, uRainbow: { value: 1 }, uFront: { value: 2 }, uTintC: creatureU.uTintC };
    { const C = makeCloud(); jellyCloud(xr, path, 0.22 * LEN, 9, C, -14, 22, 5, 11); await ctx.yield(); jellyCloud(xr, path, 0.6 * LEN, 9, C, -10, 26, 5, 11); await ctx.yield(); addPoints(C.geometry(), pointsMat(CREATURE_VS, jelU)); }
    await ctx.yield();
    // until the first liner shell reaches the stern, nothing of the exit shows: a black disc stands before the portal
    const cover = new THREE.Mesh(new THREE.CircleGeometry(15, 28), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, side: THREE.DoubleSide }));
    { const fc = A.portalSeat.facing.clone().transformDirection(hero.object.matrixWorld);
      cover.position.copy(seat).addScaledVector(fc, 0.7); cover.lookAt(seat.clone().addScaledVector(fc, 10)); scene.add(cover); }
    const coverDist = pings[iReveal].pos.distanceTo(seat) - 16;
    await ctx.yield();

    // ---------------------------------------------------------------- per-frame
    const OFF = new THREE.Vector3(), fwd = new THREE.Vector3(), rgt = new THREE.Vector3(), upv = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
    const Y = new THREE.Vector3(0, 1, 0), ZP = new THREE.Vector3(0, 0, 1), landerPos = new THREE.Vector3(), sub2Pos = new THREE.Vector3(), white = new THREE.Color(1, 1, 1);
    const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

    function update(dt, time, camera, u) {
      hero.update(dt, time, camera);
      // the sub's own pings: pure functions of u, so every beat lands
      for (let i = 0; i < 4; i++) hero.setEmitter(i, OFF, -1);
      for (let k = 0; k < pings.length; k++) { const pg = pings[k], age = (u - pg.u) * DUR; if (age >= 0 && age < pg.life) hero.setEmitter(pg.slot, pg.pos, age, 150, Math.min(1, (pg.life - age) / 0.7), 6, 5); }
      // while the world waits behind its portal (u held at 0) the sub keeps sounding on the clock; this hands over to the keyed pings on entry
      const idle = 1 - smoothstep(0, 0.012, u);
      if (idle > 0) for (let i = 0; i < 2; i++) { const ag = (time + 3 * i) % 6; hero.setEmitter(2 + i, pings[0].pos, ag, 150, idle * Math.min(1, (6 - ag) / 0.7), 6, 5); }
      // the wreck stays unseen until the first liner shell reaches it, and is drawn only as far as that shell has run
      const aR = (u - uR[0]) * DUR;
      SU.uGate.value.set(pings[iReveal].pos.x, pings[iReveal].pos.y, pings[iReveal].pos.z, aR >= 0 ? 150 * aR + 3 : -1e4);
      octo.visible = aR * 150 > 130;
      const a3 = (u - pings[iCut].u) * DUR - cutDist / 150;              // seconds since the third liner shell reached the face
      hero.setCut(a3 > 0 ? Math.min(2, -0.1 + a3 * cutRate) : -0.2);      // outline, then the nine decks outside in, then the well's frames
      cover.visible = aR * 150 + 3 < coverDist;
      // the krill show with the exit: from the moment the first liner shell has run to the seat (as the disc goes), brightening over the next 150 m of its run
      driftU.uShow.value = smoothstep(coverDist, coverDist + 150, aR * 150 + 3);

      // lander: sinking on its cable, a strobe every 2 s, each blink a small slow shell
      const cyc = time % 140, lf = clamp(Math.min(cyc, 140 - cyc) / 2, 0, 1);        // dark for a moment when the cycle wraps
      landerPos.set(landerBase.x + 1.5 * Math.sin(time * 0.13), 208 - cyc * 0.13, landerBase.z);
      lander.position.copy(landerPos); lander.rotation.y = time * 0.07; lander.rotation.z = 0.04 * Math.sin(time * 0.31);
      const sp = time % 2, strobe = sp < 0.1 ? sp / 0.1 : Math.exp(-(sp - 0.1) / 0.14);
      setLamp(0, v1.copy(landerPos).setY(landerPos.y + 2.5), white, (0.2 + 6 * strobe) * lf, 0.45 + 0.7 * strobe);
      setLamp(1, v1.copy(landerPos).setY(landerPos.y + 0.6), amber, 1.6 * lf, 0.3);
      // slots 4-5: the lander's shells at the top of the trench, the wreck beacons' once we are down among the vents
      const bk = smoothstep(0.5, 0.57, u), lk = 1 - smoothstep(0.42, 0.5, u);
      for (let i = 0; i < 2; i++) {
        const ba = (time + 1.6 * i) % 3.2, bs = ba < 0.1 ? ba / 0.1 : Math.exp(-(ba - 0.1) / 0.2);
        if (bk > 0) hero.setEmitter(4 + i, beacons[i], ba, 60, 0.62 * bk * Math.min(1, (3.2 - ba) / 0.5), 5, 2.7);
        else hero.setEmitter(4 + i, landerPos, (time + 2 * i) % 4, 60, 0.55 * lf * lk, 4, 3.2);
        setLamp(6 + i, v1.copy(beacons[i]).setY(beacons[i].y + 2.2), frontC, (0.3 + 4 * bs) * bk, 0.3 + 0.4 * bs);
      }

      // robots working the vents, pinging in turn
      for (let i = 0; i < 2; i++) {
        const r = robots[i], t = time + r.ph;
        r.pos.set(r.base.x + Math.sin(t * 0.31) * 2.2, r.base.y + Math.sin(t * 0.47) * 1.3, r.base.z + Math.cos(t * 0.23) * 2.6);
        r.g.position.copy(r.pos); r.g.rotation.set(0.06 * Math.sin(t * 0.7), r.yaw + 0.6 * Math.sin(t * 0.19), 0.05 * Math.sin(t * 0.53));
        r.g.updateMatrixWorld();
        setLamp(2 + i, v1.set(0, -0.3, 1.05).applyMatrix4(r.g.matrixWorld), amber, 1.8 + 0.3 * Math.sin(time * 11 + i * 2), 0.3);
      }
      const rn = Math.floor(time / 2.6);
      hero.setEmitter(6, robots[rn % 2].pos, time - rn * 2.6, 60, 0.55, 4, 1.7);

      // the second submersible, far off, lighting the walls from the other side
      sub2At(u, sub2Pos); sub2At(u + 0.02, v2);
      const s2k = smoothstep(0.5, 0.6, u), hold = 1 - smoothstep(0.3, 0.36, u);
      if (v2.distanceToSquared(sub2Pos) > 0.04) sub2.rotation.y = Math.atan2(v2.x - sub2Pos.x, v2.z - sub2Pos.z); else sub2.rotation.y = 0.3 + 0.4 * Math.cos(time * 0.037) + (u > 0.5 ? 2.2 : 0);
      sub2Pos.x += 8 * Math.sin(time * 0.05) * hold + 1.5 * Math.sin(time * 0.21); sub2Pos.y += 5 * Math.sin(time * 0.08) * hold + 1.2 * Math.sin(time * 0.33); sub2Pos.z += 34 * Math.sin(time * 0.037) * hold;
      sub2.position.copy(sub2Pos);
      sub2.updateMatrixWorld();
      for (let i = 0; i < 2; i++) setLamp(4 + i, v1.set(i ? 0.8 : -0.8, -0.9, 3.2).applyMatrix4(sub2.matrixWorld), amber, 3, 0.45);
      { const sa = (time + 1.3) % 3.7; hero.setEmitter(7, sub2Pos, sa, 150, lerp(0.45, 0.7, s2k) * Math.min(1, (3.7 - sa) / 0.5), 8, lerp(1.5, 2.6, s2k)); }
      lampGeo.attributes.position.needsUpdate = true; lampGeo.attributes.aC.needsUpdate = true;

      // lamp cones for the snow follow whatever camera is drawing us; lamps go down for the veil
      camera.getWorldDirection(fwd); rgt.crossVectors(fwd, Y).normalize(); upv.crossVectors(rgt, fwd);
      snowU.uFwd.value.copy(fwd); snowU.uRight.value.copy(rgt); snowU.uUp.value.copy(upv);
      snowU.uLamp.value = 1 - 0.85 * ease(1 - Math.abs(u - uVeil) / 0.07);
      amphiU.uShow.value = smoothstep(0.004, 0.03, u);

      // the creature (keyed to u)
      const dc = u * LEN;
      if (cast === 'squid') {
        const k1 = ease((u - uS) / 0.03), j = clamp((u - uS - 0.03) / 0.085, 0, 1);
        const jet = (ease(j * 3) + ease(j * 3 - 1) + ease(j * 3 - 2)) / 3;
        const sep = lerp(36, 22, k1) - 66 * jet - 40 * clamp((u - uS - 0.115) / 0.1, 0, 1);
        const d = Math.max(dc, uS * LEN) + sep;
        path.posAtDist(d, v1); path.tangentAtDist(d, v2); v3.set(-v2.z, 0, v2.x).normalize();
        const lat = 3.6 - 2.6 * smoothstep(8, 30, sep);
        creaturePos.copy(v1).addScaledVector(v3, sideS * lat); creaturePos.y += -0.9 + 0.5 * Math.sin(time * 0.8);
        creature.position.copy(creaturePos);
        const turn = ease(j * 4);
        fwd.copy(v3).multiplyScalar(sideS * 0.9).addScaledVector(Y, 0.45).normalize().lerp(v2.negate(), turn).normalize();
        creature.quaternion.setFromUnitVectors(ZP, fwd);
        const beat = j > 0 && j < 1 ? Math.pow(Math.sin(j * 3 * Math.PI), 2) : 0;
        creatureU.uFlare.value = 0.16 + 0.95 * ease((u - uS - 0.004) / 0.018) * (1 - turn) + 0.12 * (1 - beat) * turn + 0.05 * Math.sin(time * 1.3);
        creatureU.uSelf.value = 0.1 + 0.5 * ease((u - uS) / 0.012);
        creatureU.uPulse.value = beat + 0.15 * (0.5 + 0.5 * Math.sin(time * 2.1)) * (1 - turn);
        creatureU.uFreq.value = 2.2 + 3 * turn;
        const ik = clamp((u - uS - 0.034) / 0.05, 0, 1);
        ink.visible = ik > 0;
        if (ik > 0) {
          const di = uS * LEN + 24 + 22; path.posAtDist(di, v1); path.tangentAtDist(di, v2); v3.set(-v2.z, 0, v2.x).normalize();
          ink.position.copy(v1).addScaledVector(v3, sideS * 11.5); ink.position.y -= 2.5;
          ink.scale.setScalar(0.3 + 4.6 * Math.pow(ik, 0.5)); ink.rotation.set(time * 0.11, time * 0.07, 0);
        }
      } else if (cast === 'shark') {
        const sep = lerp(46, -22, ease((u - uS + 0.02) / 0.17));
        const d = Math.max(dc, 0) + sep;
        path.posAtDist(d, v1); path.tangentAtDist(d, v2); v3.set(-v2.z, 0, v2.x).normalize();
        creaturePos.copy(v1).addScaledVector(v3, sideS * (3.8 + 0.7 * Math.sin(u * 30))); creaturePos.y += -1.6 + 0.6 * Math.sin(time * 0.5);
        creature.position.copy(creaturePos);
        fwd.copy(v2).addScaledVector(v3, -sideS * 0.12).normalize(); creature.quaternion.setFromUnitVectors(ZP, fwd);
      } else {
        creatureU.uFlare.value = 0.5 + 0.5 * Math.sin(time * 1.4);
      }

      // octopus: flaps aside as the sphere comes down the promenade
      const os = ease((u - uOct + 0.07) / 0.07);
      octo.position.set(perch.x + 5 * os, perch.y + 1.6 + 0.5 * Math.sin(time * 0.9) + 4.5 * os, perch.z + 3 * os);
      octo.rotation.z = 0.15 * Math.sin(time * 1.1) - 0.5 * os;
      octoU.uFlare.value = 0.5 + 0.5 * Math.sin(time * (1.7 + 2 * os));
      jelU.uFlare.value = 0.5 + 0.5 * Math.sin(time * 1.4 + 1);
      octoU.uFreq.value = 3.1 + 3.5 * os * (1 - ease((u - uOct - 0.03) / 0.05));

      if (levi) {
        const e = (u - uR[1]) * DUR - leviDelay;
        leviU.uSelf.value = e > 0 ? ease(e / 0.35) * Math.exp(-e * 0.7) * (1 - ease((e - 2.6) / 0.6)) : 0;
        levi.visible = leviU.uSelf.value > 0.001;
levi.position.copy(leviC).addScaledVector(leviDir, -14 + 10 * e); levi.position.y += 2 * Math.sin(time * 0.2);
      }
    }

    const U = (p) => uOfPoint(p);
    const pois = [
      { at: toW(A.lookAts.stem), from: uR[0] - 0.06, to: U(fly[2]) + 0.01, weight: 0.75 },
      { at: toW(A.lookAts.funnels), from: U(fly[3]) - 0.01, to: U(fly[4]) + 0.03, weight: 0.32 },
      { at: seat.clone(), from: U(fly[5]) - 0.02, to: 1, weight: 0.55 },
    ];
    if (cast !== 'jellies') pois.unshift({ at: () => creaturePos, from: uS - 0.03, to: uS + (cast === 'squid' ? 0.055 : 0.14), weight: cast === 'squid' ? 0.5 : 0.55 });
    update(0, 0, { getWorldDirection: (v) => v.set(0, 0, 1) }, 0);

    return {
      scene, path, duration: DUR,
      title: scheme.name === 'cyan' ? 'The Sounding' : scheme.name === 'phosphor' ? 'The Sounding (green phosphor)' : 'The Sounding (white on indigo)',
      ride: 'glass-dome', style: 'none',
      camera: { fov: 62, near: 0.3, far: 1500, lookAhead: 26, sway: 0.5, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: 6.8, color: scheme.portal, glow: 0.5, revealDistance: 180 },
      post: { exposure: 0.95, bloom: { strength: 0.42, radius: 0.6, threshold: 0.85 },
        grade: { saturation: look === 2 ? 0.95 : 1.08, contrast: 1.05, tint: scheme.tint, shadowTint: '#000000', vignette: 0.5, grain: 0.055, aberration: 0.02 } },
      update,
      dispose() { if (!ink.parent) { ink.geometry.dispose(); ink.material.dispose(); } },
    };
  },
};
