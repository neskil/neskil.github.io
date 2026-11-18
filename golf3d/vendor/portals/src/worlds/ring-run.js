// THE RING RUN: a flat-out skiff race across, through and under the rings of a butterscotch giant, to the
// gap where a shepherd moon raises standing waves in the ring's edge (hero: src/parts/ring-run.js).
// World space == hero local space: the camera flies toward -Z, +X is down the wave train (right), the ring
// plane is y = 0. Down-ring distance d = Z0 - z. Everything is self-lit by shaders (one hard sun on the
// left, planet-shine on the right); there are no three.js lights.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/ring-run.js';

const PALETTE = ['#E8B46A', '#B9762F', '#F7E6C2', '#E6F1FC', '#6FA6E0', '#04060C', '#6FF2E0'];
const Z0 = 3830;            // z of the entry point; the near shore of the gap is z = 930, the far shore z = 330
const NL = 96;              // path LUT samples (z -> x, y) used to keep the corridor clear on the GPU
const LUT_Z0 = -80, LUT_STEP = (Z0 + 40 - LUT_Z0) / (NL - 1);

const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s / .9375; }
`;
const PATH_GLSL = /* glsl */`
uniform vec2 uPath[${NL}];
vec2 pathXY(float z){ float f = clamp((z - (${LUT_Z0.toFixed(1)})) / ${LUT_STEP.toFixed(4)}, 0., ${(NL - 1).toFixed(1)} - .001); int i = int(f); return mix(uPath[i], uPath[i + 1], f - float(i)); }
float ragF(float x){ return sin(x * .021) * 22. + sin(x * .0057 + 1.3) * 38. + sin(x * .13) * 6.; }
float waveF(float z){ float d = ${Z0.toFixed(1)} - z; return smoothstep(2180., 2420., d) * (1. - smoothstep(2850., 2925., d)); }
`;

// ---------------- sky: vacuum, stars, the sun, the giant, two far moons ----------------
const SKY_VS = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FS = /* glsl */`
uniform vec3 uSun, uPl, uPlR, uPlU, uC1, uC2, uC3, uC4, uSunCol, uM1, uM2;
uniform float uTime, uPlRad, uKind, uTilt, uShLat, uStormLon, uStormLat;
varying vec3 vD;
${NOISE}
float stars(vec3 d, float n, float seed){
  vec3 a = abs(d); vec2 uv; float f;
  if (a.x > a.y && a.x > a.z) { uv = d.yz / a.x; f = sign(d.x) + 2.; }
  else if (a.y > a.z) { uv = d.xz / a.y; f = sign(d.y) + 5.; }
  else { uv = d.xy / max(a.z, 1e-4); f = sign(d.z) + 8.; }
  vec2 g = uv * n; float w = max(.07, 1.1 * max(fwidth(g.x), fwidth(g.y)));
  vec2 id = floor(g), fr = fract(g) - .5; float h = h21(id + f * 17.3 + seed);
  vec2 o = (vec2(h21(id + f * 3.1 + .5), h21(id + f * 7.7 + .9)) - .5) * .6;
  float b = max(h - .955, 0.) / .045; b = b * b;
  return b * (1. - smoothstep(w * .3, w, length(fr - o))) * min(1., .12 / w);
}
vec3 bead(vec3 d, vec3 c, float rad, vec3 tint){
  vec3 r = normalize(cross(c, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), u = cross(r, c);
  vec2 q = vec2(dot(d, r), dot(d, u)) / rad; float r2 = dot(q, q);
  if (dot(d, c) < 0. || r2 > 1.) return vec3(0.);
  vec3 n = r * q.x + u * q.y - c * sqrt(max(1. - r2, 0.));
  return tint * smoothstep(-.02, .12, dot(n, uSun)) * (.55 + .45 * vn(q * 5. + rad * 900.)) * (1. - smoothstep(.8, 1., r2));
}
void main(){
  vec3 d = normalize(vD);
  vec3 col = vec3(.0016, .0022, .0046);
  col += vec3(.9, .95, 1.) * stars(d, 90., 0.) * 1.5 + vec3(1., .9, .8) * stars(d, 190., 9.) * .7;
  // the sun: small, white, fierce
  float sd = max(dot(d, uSun), 0.);
  float s2 = sd * sd; s2 *= s2; s2 *= s2; s2 *= s2; float s64 = s2 * s2 * s2 * s2; float s1k = s64 * s64; s1k *= s1k; s1k *= s1k; s1k *= s1k;
  col += uSunCol * (smoothstep(.99995, .99998, sd) * 6. + s1k * 1.5 + s64 * .12 + s2 * .02);
  col += bead(d, uM1, .011, vec3(.8, .78, .72)) + bead(d, uM2, .0065, vec3(.7, .62, .5));
  // the giant
  vec2 q = vec2(dot(d, uPlR), dot(d, uPlU)) / uPlRad; float r2 = dot(q, q);
  if (dot(d, uPl) > 0. && r2 < 1.02) {
    float nz = sqrt(max(1. - r2, 0.));
    float ct = cos(uTilt), st = sin(uTilt);
    vec3 nt = vec3(q.x, q.y * ct - nz * st, q.y * st + nz * ct);
    float lat = asin(clamp(nt.y, -1., 1.)); float lon = atan(nt.x, nt.z + 1e-4);
    float shear = sin(lat * 9.) * .6 + sin(lat * 23. + 1.) * .3;
    float lo = lon + uTime * .02 * shear;
    float turb = fbm(vec2(lo * 3., lat * 9.) + 3.);
    float fine = fbm(vec2(lo * 9. + uTime * .03 * shear, lat * 40.));
    float b = .5 + .5 * sin(lat * 15. + 2.2 * vn(vec2(lat * 5., 1.7)) + (turb - .5) * 2.2);
    float b2 = .5 + .5 * sin(lat * 41. + (fine - .5) * 3. + 1.);
    vec3 pc = mix(uC2, uC1, smoothstep(.15, .8, b));
    pc = mix(pc, uC3, smoothstep(.5, .95, b * .6 + b2 * .5) * .8);
    pc *= .82 + .36 * fine;
    // the pale oval storm, turning
    vec2 sp = vec2(lon - uStormLon - uTime * .003, (lat - uStormLat) * 2.1); float sr = length(sp) / .17;
    float ang = atan(sp.y, sp.x + 1e-5) + (1. - sr) * 5. - uTime * .25;
    vec3 sc = mix(uC3, uC1, .25 + .25 * sin(ang * 2. + sr * 9.));
    pc = mix(pc, sc, (1. - smoothstep(.55, 1., sr)) * .9);
    pc = mix(pc, uC2 * .7, smoothstep(.75, 1., sr) * (1. - smoothstep(1., 1.25, sr)) * .5);
    // kind 1: a hexagonal polar storm tipped toward us
    float pd = acos(clamp(nt.y, -1., 1.)) / .42; float ha = atan(nt.x, nt.z + 1e-4);
    float hex = pd * (1. + .07 * cos(6. * ha + uTime * .04));
    vec3 pol = mix(uC4 * .55, uC4, .5 + .5 * sin(hex * 14. - uTime * .3 + ha));
    pc = mix(pc, pol, step(.5, uKind) * step(uKind, 1.5) * (1. - smoothstep(.85, 1., hex)));
    // the rings' own shadow: one thin dark stripe hugging the equator
    float sl = q.y - uShLat * nz; float sw = mix(.02, .008, step(1.5, uKind));
    pc *= 1. - .82 * (1. - smoothstep(sw * .5, sw, abs(sl)));
    vec3 nW = uPlR * q.x + uPlU * q.y - uPl * nz;
    float ndl = dot(nW, uSun);
    float lit = mix(smoothstep(-.1, .4, ndl), smoothstep(-.45, -.05, ndl), step(1.5, uKind));
    vec3 g = pc * lit * (.35 + .65 * sqrt(nz)) * .8;
    g += uC3 * .22 * (1. - nz) * (1. - nz) * lit;
    col = mix(col, g, 1. - smoothstep(.985, 1.02, r2));
  }
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------- the ring sheet: one shader plane, frost-bright above, glowing from below ----------------
const SHEET_VS = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SHEET_FS = /* glsl */`
uniform vec3 uSun, uPlanet, uSunCol, uShineCol, uFrost, uCream, uBlue, uShC;
uniform float uTime, uX0, uX1, uFar, uCombK, uCombT, uRose, uBraid;
varying vec3 vW;
${NOISE}
${PATH_GLSL}
float pebble(vec2 cq, float cov, float rs, out float lit){
  cq.x += fract(sin(floor(cq.y) * 91.7) * 43758.5);            // every row slides by its own amount: no grid of dots
  vec2 ci = floor(cq); float ch = h21(ci), c2 = h21(ci + 71.3), c3 = h21(ci + 13.7);
  float r = (.2 + .28 * c3) * rs;
  float d = length(fract(cq) - .5 + (vec2(c2, c3) - .5) * .5) + (vn(cq * 3.1 + 5.) - .5) * .16 * rs;   // chipped outlines, not ovals
  lit = step(fract(c2 * 7.7), .64);
  return step(ch, cov) * (1. - smoothstep(r - .08 * rs, r, d));
}
void main(){
  float x = vW.x, z = vW.z; float dn = ${Z0.toFixed(1)} - z;
  float dither = h21(gl_FragCoord.xy * .7131);
  float rg = ragF(x) + (vn(vec2(x * .09, 7.)) - .5) * 26.;
  float cov;
  if (uFar < .5) {
    float e = z - (930. + rg);
    float strands = .5 + .5 * sin(e * .11 + sin(x * .013) * 3.);
    cov = smoothstep(-6., 40., e) * mix(1., smoothstep(.2, .55, strands) + smoothstep(120., 200., e), uBraid);
  } else {
    float side = max(1. - smoothstep(uX0 + 20., uX0 + 210., x), smoothstep(uX1 - 150., uX1 - 20., x));
    cov = max((1. - smoothstep(-40., 6., z - (300. + rg * .5))) * side, step(z, -620.));
  }
  if (cov < .08 + .84 * dither) discard;
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)); float dist = length(cameraPosition - vW);
  vec2 q = vec2(x, z + uTime * 6.);
  vec2 fwq = fwidth(q); float px = max(fwq.x, fwq.y);
  float calm = 1. - smoothstep(6., 70., px);                 // the far sheet is perfectly calm
  vec2 qs = mat2(.94, -.34, .34, .94) * q;
  float sraw = fbm(vec2(qs.x * .021, qs.y * .0023));
  float streak = mix(.5, sraw, calm);
  float clump = mix(.5, fbm(q * .011 + 7.3), calm);
  float wv = waveF(z);
  float dens = clamp(.3 + .7 * smoothstep(.2, .6, streak) * (.6 + .9 * clump), 0., 1.);
  dens = mix(dens, 1., wv * .85);
  float a = .25 + .75 * dens;
  float up = step(0., V.y);
  vec2 qr = mat2(.8, -.6, .6, .8) * q;
  // mid-distance grain is combed along the streaks, so it never reads as a cell pattern
  float m1 = fbm(vec2(qs.x * .1, qs.y * .021) + 5.), m2 = vn(vec2(qs.x * .45, qs.y * .1) + 9.);
  float near = 1. - smoothstep(.35, 1.4, px * .43);
  float near3 = 1. - smoothstep(.2, .6, px * 1.3);
  // pebbles in three sizes, a steep power law: many small, few large
  // the two larger layers are stretched 3:1 along the streaks: combed grain, not round cells
  float litCell; float pm = pebble(vec2(qs.x * .62, qs.y * .21), a, .6, litCell);
  float lit2; float pm2 = pebble(vec2(qs.x * .41, qs.y * .14) + 31.7, a * .45, 1., lit2);
  if (pm2 > pm) { pm = pm2; litCell = lit2; }
  float lit3; float pm3 = pebble(qr.yx * 1.3 + 11.3, a * .8, .8, lit3) * near3;
  if (pm3 > pm) { pm = pm3; litCell = lit3; }
  if (up > .5 && px < .2 && pm < .5 && h21(floor(q * 2.6) + 5.) > a * .7 + .5) discard;   // close up the dust is a haze between stones
  float mid = 1. - smoothstep(1.5, 9., px);
  float pmix = mix(a * mix(.55, smoothstep(.34, .64, m1 * .6 + m2 * .4) * 1.1, mid), pm, near);
  float dustG = mix(.42, .68 + .14 * (m2 - .5), near);
  float grain = mix(dustG, mix(1.2, mix(.9, 1.03, litCell), near), pmix) * mix(1., .85 + .3 * vn(q * .3), mid);
  // comb: the long parallel shadows of the bergs, raked along the sun's ground track
  vec2 gd = normalize(-uSun.xz + vec2(1e-5, 0.));
  float ca = dot(q, gd), cc = dot(q, vec2(-gd.y, gd.x));
  float cn = fbm(vec2(ca * uCombK + 3.1, cc * .1));
  float comb = smoothstep(uCombT, uCombT + .06, cn) * .9 * (1. - smoothstep(4., 30., px)) * (1. - wv);
  vec3 refl = uFrost * uSunCol * (.4 + .6 * smoothstep(0., .5, uSun.y)) * (.6 + .4 * dens) * grain;
  refl *= mix(vec3(1.), uBlue * .28, comb);
  refl *= 1. + uRose * 1.1 * smoothstep(1650., 1720., dn) * (1. - smoothstep(1900., 1980., dn));   // rose ring: a bright white inner band
  float fw = max(dot(-V, uSun), 0.); float fwd = fw * fw; fwd *= fwd * fw;
  // from below: backlit frosted glass. Thin lanes bloom cream-white; the clumped rubble is a diagonal comb of blue streaks
  float calmB = 1. - smoothstep(40., 500., px);
  float sB = smoothstep(.36, .62, fbm(vec2(qs.x * .0045, qs.y * .0008) + 2.));
  float sN = smoothstep(.3, .55, sraw);
  float densU = mix(mix(.5, .2 + .65 * sB, calmB), sN * (.72 + .28 * sB), calm);
  densU = mix(densU, 1., wv * .9);
  float gU = 1. + (.5 * (m1 - .5) + .3 * (m2 - .5)) * mid + .25 * (vn(q * 1.7) - .5) * near;
  vec3 trans = uSunCol * mix(mix(uCream, vec3(1.), .3), uBlue * .85, densU * .85) * (.46 + .95 * fwd + .72 * uSun.y) * (1.38 - 1.02 * densU) * gU;
  trans *= mix(.3, 1., smoothstep(0., .22, abs(V.y))) * mix(1., 1.25, smoothstep(.3, .5, uSun.y));   // the high sun lights the ceiling brightest                    // seen edge-on the sheet is thick: the far ceiling dims to blue
  trans *= mix(vec3(1.), uBlue * .8, comb * .5) * mix(vec3(1.), vec3(.1, .15, .24), wv);
  vec3 col = mix(trans, refl, up);
  col += uShineCol * uFrost * (.12 + .4 * max(uPlanet.y * (up * 2. - 1.), 0.) + .25 * max(dot(V.xz, -uPlanet.xz), 0.)) * (1.2 - .5 * grain) * mix(.6, 1., up);
  // thin forward-scattering haze confined to the sheet: the vanishing line burns
  float gz = 1. - abs(V.y); gz *= gz; gz *= gz; gz *= gz; gz *= gz;
  col += uSunCol * mix(mix(uCream, uBlue, .75) * (.3 + .9 * fw * fw) * (.2 + .8 * sB) * .1 * (1. - .8 * wv), uFrost * (.1 + .5 * fw * fw), up) * gz;
  col *= mix((1. - .88 * smoothstep(1800., 6500., dist)) * mix(vec3(1.), uBlue * 1.15, smoothstep(700., 2400., dist) * .8), vec3(1.), up);              // the far ceiling sinks into deep blue: no grey bar on the horizon
  float gl = step(.9968, h21(floor(q * 1.3) + 3.)) * near * up;
  col += uSunCol * gl * 2.2;
  // the giant's shadow bites the ring off to black along a clean curved edge
  col *= mix(.015, 1., smoothstep(-260., 260., length(vec2(x, z) - uShC.xy + vec2(uTime * 5., 0.)) - uShC.z));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------- stones: instanced, wrapped round the camera along the run, two-tone vacuum light ----------------
const ROT_GLSL = /* glsl */`
vec3 rotAx(vec3 p, vec3 ax, float ca, float sa){ return p * ca + cross(ax, p) * sa + ax * dot(ax, p) * (1. - ca); }`;
const CENTRE_GLSL = /* glsl */`
attribute vec4 aP;   // x (m), z0 (0..1), y gauss, radius (m)
attribute vec4 aQ;   // spin phase, drift (m/s), glint, hash
uniform float uTime, uPix, uL, uAhead, uX0, uX1;
${PATH_GLSL}
float gWave;
vec3 stoneCentre(out float sc){
  float zb = cameraPosition.z - uL * uAhead;
  float rel = mod(aP.y * uL + aQ.y * uTime - zb, uL);
  float z = zb + rel; gWave = waveF(z);
  float x = aP.x * mix(1., .5, gWave);
  float y = aP.z * mix(4.5, 46., gWave);
  float rg = ragF(x);
  float side = max(1. - smoothstep(uX0 + 20., uX0 + 210., x), smoothstep(uX1 - 150., uX1 - 20., x));
  sc = max(step(936. + rg, z), step(z, 296. + rg * .5) * step(aQ.w, side * .999));
  float f = rel / uL; sc *= smoothstep(0., .07, f) * (1. - smoothstep(.93, 1., f));
  vec2 pc = pathXY(z); vec2 dv = vec2(x, y) - pc; float dl = length(dv);
  float minR = (aP.w < .7 ? 2.8 : 7.) + aP.w * 1.7;
  if (dl < minR) { dv = dl > 1e-3 ? dv / dl : vec2(0., -1.); x = pc.x + dv.x * minR; y = pc.y + dv.y * minR; }
  return vec3(x, y, z);
}`;
const STONE_VS = /* glsl */`
attribute vec3 aAxis; attribute vec3 color;
varying vec3 vN, vW, vCol, vO; varying float vGl, vBelow;
${CENTRE_GLSL}
${ROT_GLSL}
void main(){
  float sc; vec3 c = stoneCentre(sc);
  float dist = length(cameraPosition - c);
  float s = max(aP.w, dist * uPix * .8) * sc;
  float ang = aQ.x + uTime * (.25 + fract(aQ.x * 7.31) * .8) * (aP.w > 6. ? .3 : 1.);
  vec3 ax = normalize(aAxis + vec3(1e-4, 0., 0.)); float ca = cos(ang), sa = sin(ang);
  vW = c + rotAx(position, ax, ca, sa) * s; vN = rotAx(normal, ax, ca, sa); vCol = color; vGl = aQ.z; vO = position;
  vBelow = (1. - smoothstep(-1.5, 1., vW.y)) * (1. - gWave);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const BERG_VS = /* glsl */`
attribute vec4 iP; attribute vec4 iQ; attribute vec3 iAxis; attribute vec3 color;
uniform float uTime;
varying vec3 vN, vW, vCol, vO; varying float vGl, vBelow;
${PATH_GLSL}
${ROT_GLSL}
void main(){
  float ang = iQ.x + uTime * iQ.y; vec3 ax = normalize(iAxis + vec3(1e-4, 0., 0.)); float ca = cos(ang), sa = sin(ang);
  vec3 c = iP.xyz + vec3(0., 0., uTime * iQ.w);
  vW = c + rotAx(position, ax, ca, sa) * iP.w; vN = rotAx(normal, ax, ca, sa); vCol = color; vGl = iQ.z; vO = position;
  vBelow = (1. - smoothstep(-1.5, 1., vW.y)) * (1. - waveF(c.z));
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const STONE_FS = /* glsl */`
uniform vec3 uSun, uPlanet, uSunCol, uShineCol, uAmb, uCream, uBlue; uniform float uLitK;
varying vec3 vN, vW, vCol, vO; varying float vGl, vBelow;
#ifdef DETAIL
vec3 h33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
// fracture cells: the nearest cell's own tilt, and the distance to the crack between cells
void facet(vec3 x, out vec3 cn, out float edge){
  vec3 ip = floor(x), fp = fract(x); float d1 = 8., d2 = 8.; vec3 best = vec3(.5);
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k)); vec3 o = h33(ip + g); vec3 r = g + o - fp; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; best = o; } else if (d < d2) { d2 = d; }
  }
  cn = best * 2. - 1.; edge = sqrt(d2) - sqrt(d1);
}
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(h33(i).x, h33(i + vec3(1., 0., 0.)).x, f.x), mix(h33(i + vec3(0., 1., 0.)).x, h33(i + vec3(1., 1., 0.)).x, f.x), f.y);
  float b = mix(mix(h33(i + vec3(0., 0., 1.)).x, h33(i + vec3(1., 0., 1.)).x, f.x), mix(h33(i + vec3(0., 1., 1.)).x, h33(i + vec3(1., 1., 1.)).x, f.x), f.y);
  return mix(a, b, f.z); }
#endif
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  vec3 alb = vCol; float hoar = 0.;
#ifdef DETAIL
  float fwO = length(fwidth(vO));
  float dk = 1. - smoothstep(.03, .14, fwO), gk = 1. - smoothstep(.006, .02, fwO);
  vec3 cn; float ed; facet(vO * vec3(2.2, 3.3, 2.6) + .25 * sin(vO.yzx * 6.3 + 1.7) + 7., cn, ed);
  vec3 cn2; float ed2; facet(vO * 6.3 + .3 * sin(vO.zxy * 11.) + 3., cn2, ed2);
  N = normalize(N + (cn * .4 + cn2 * .22 * gk) * dk);                     // fractured planes, finer than the mesh
  float cr = abs(vn3(vO * 2.4 + 11.) - .5), cr2 = abs(vn3(vO * 5.7 + 4.) - .5);
  float crack = (1. - smoothstep(.004, .022, cr)) * dk * .75 + (1. - smoothstep(.006, .03, cr2)) * gk * .45;   // a few long cracks
  vec3 gh = h33(floor(vO * 52.));
  alb *= (.94 + .12 * fract(cn.x * 7.3 + cn.y * 3.1)) * mix(1., .86 + .28 * gh.x, gk);   // facet tone and fine frost grain
  alb = mix(alb, uBlue * .4, min(crack, 1.) * .7);
  hoar = step(.985, gh.y) * gk;                                           // feathered hoar: glints that flash as the berg turns
#endif
  float ndl = dot(N, uSun); float lit = smoothstep(-.02, .09, ndl) * (1. - .96 * vBelow);
  vec3 col = alb * uSunCol * lit * (.3 + .7 * clamp(ndl, 0., 1.)) * uLitK * mix(vec3(.5, .7, 1.), vec3(1.), smoothstep(0., .65, ndl));
  float pl = smoothstep(-.15, .7, dot(N, uPlanet));
  col += alb * uShineCol * pl * (1. - lit * .75) * 1.25 * (1. - .55 * vBelow) + alb * uAmb;
  col += alb * uCream * uSunCol * vBelow * .1 * smoothstep(.1, .9, N.y);          // lit softly by the glowing ceiling
  vec3 H = normalize(uSun + V + vec3(0., 1e-5, 0.));
  float g = max(dot(N, H), 0.); g = g * g; g = g * g; g = g * g; g = g * g; g = g * g; g = g * g;
  col += uSunCol * g * lit * vGl * 3.;
  float g16 = max(dot(N, H), 0.); g16 *= g16; g16 *= g16; g16 *= g16; g16 *= g16;
  col += uSunCol * hoar * g16 * lit * 4.;
  float back = max(dot(-V, uSun), 0.); back *= back; back *= back;
  float rim = 1. - abs(dot(N, V)); rim = rim * rim * rim;
  col += uSunCol * rim * (back * 1.6 + vBelow * 2.2 * smoothstep(-.2, .5, N.y));     // dark shapes rimmed in fire-white
  gl_FragColor = vec4(col, 1.);
}`;

// long parallel shadows: stretched quads laid on the sheet behind each larger stone (multiply blend)
const SHADOW_VS = /* glsl */`
uniform vec3 uSun; uniform float uShLen;
varying vec3 vUA;
#ifdef FIXED
attribute vec4 iP; attribute vec4 iQ; uniform float uTime, uPix;
${PATH_GLSL}
#else
${CENTRE_GLSL}
#endif
void main(){
#ifdef FIXED
  vec3 c = iP.xyz + vec3(0., 0., uTime * iQ.w); float r = iP.w; float sc = step(abs(c.y), r * 1.2) * (1. - waveF(c.z)); float gW = 0.;
#else
  float sc; vec3 c = stoneCentre(sc); float r = aP.w; float gW = gWave;
#endif
  vec2 g = normalize(-uSun.xz + vec2(1e-5, 0.)); vec2 pp = vec2(-g.y, g.x);
  float len = min(r * uShLen, 500.);
  float dist = length(cameraPosition - c);
  float ys = (cameraPosition.y > 0. ? 1. : -1.) * (.25 + dist * .004);
  vec2 xz = c.xz + g * (position.x * len + r * .3) + pp * position.y * r * 1.9 * (1. - .55 * position.x);
  vUA = vec3(position.xy, sc * (1. - gW) * (1. - smoothstep(420., 640., dist)));
  gl_Position = projectionMatrix * viewMatrix * vec4(xz.x, ys, xz.y, 1.);
}`;
const SHADOW_FS = /* glsl */`
uniform vec3 uShTint; varying vec3 vUA;
void main(){
  float a = vUA.z * (1. - smoothstep(.2, .5, abs(vUA.y))) * (1. - .7 * smoothstep(.5, 1., vUA.x)) * smoothstep(0., .04, vUA.x);
  gl_FragColor = vec4(mix(vec3(1.), uShTint, a), 1.);
}`;

// near-field ice motes: velocity-stretched glints in a box that wraps round the camera
const MOTE_VS = /* glsl */`
attribute vec4 aM;
uniform float uTime, uPix, uFlow, uMoteK; uniform vec3 uBoxM, uVel;
varying vec2 vQ; varying float vI;
${PATH_GLSL}
void main(){
  vec3 b = aM.xyz * uBoxM; b.z += uTime * uFlow * (.6 + .8 * aM.w);
  vec3 o = cameraPosition - uBoxM * vec3(.5, .5, .72);
  vec3 rel = mod(b - o, uBoxM); vec3 c = o + rel;
  float wv = waveF(c.z); float sig = mix(7., 46., wv);
  float wy = exp(-c.y * c.y / (2. * sig * sig));
  float rg = ragF(c.x);
  float w = c.z > 936. + rg ? max(wy, .05) : (c.z < 330. ? .5 : 0.);
  float keep = step(fract(aM.w * 17.37), w * uMoteK);
  vec3 f = rel / uBoxM; keep *= smoothstep(0., .08, f.z) * (1. - smoothstep(.9, 1., f.z));
  vec3 toC = c - cameraPosition; float dist = length(toC);
  vec3 sd = normalize(cross(uVel, toC) + vec3(1e-5, 0., 0.));
  float wd = max(.035 + .08 * aM.w, dist * uPix * 1.5);
  vec3 P = c + uVel * (position.y - .5) + sd * position.x * wd;
  float tw = .5 + .5 * sin(uTime * (3. + aM.w * 9.) + aM.w * 40.); tw *= tw; tw *= tw;
  vI = keep * smoothstep(1.2, 3.5, dist) * (.35 + 2.4 * tw); vQ = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
}`;
const MOTE_FS = /* glsl */`
uniform vec3 uSunCol; varying vec2 vQ; varying float vI;
void main(){ float a = (1. - smoothstep(.1, .5, abs(vQ.x))) * smoothstep(0., .25, vQ.y) * (1. - smoothstep(.75, 1., vQ.y)); gl_FragColor = vec4(uSunCol * vI * a * .45, 1.); }`;

// matte graphite hulls (the skiff, the rivals, the tug): self-lit two-tone, vertex colour + emissive channel
const HULL_VS = /* glsl */`
attribute vec3 color; attribute float aE;
varying vec3 vN, vW, vC; varying float vE, vInst;
void main(){
  mat4 m = modelMatrix; vInst = 0.;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix; vInst = 1.;
#endif
  vec4 w = m * vec4(position, 1.); vW = w.xyz; vN = mat3(m) * normal; vC = color; vE = aE;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const HULL_FS = /* glsl */`
uniform vec3 uSun, uPlanet, uSunCol, uShineCol, uAmb, uMint; uniform float uUnder;
varying vec3 vN, vW, vC; varying float vE, vInst;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSun); float lit = smoothstep(-.02, .12, ndl) * (1. - .8 * uUnder);
  vec3 col = vC * uSunCol * lit * (.45 + .55 * clamp(ndl, 0., 1.));
  col += vC * uShineCol * smoothstep(-.2, .7, dot(N, uPlanet)) * 1.6 + vC * uAmb * 2.;
  float rim = 1. - abs(dot(N, V)); rim *= rim * rim;
  col += rim * (uSunCol * .05 * smoothstep(-.3, .4, ndl) + uShineCol * .22 * smoothstep(-.3, .5, dot(N, uPlanet)));
  col += uSunCol * uUnder * .03 * smoothstep(0., 1., N.y);
  col += uSunCol * rim * uUnder * vInst * .5 * smoothstep(-.3, .4, N.y);
  col += uMint * vE;
  gl_FragColor = vec4(col, 1.);
}`;

// lights and dust: additive point sprites with a minimum size so far tail lights stay stars
const GLOW_VS = /* glsl */`
attribute vec4 aC; attribute float aS; uniform float uPix; varying vec4 vC;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aS / max(-mv.z * uPix, 1e-4), 2.5, 72.); vC = aC; }`;
const GLOW_FS = /* glsl */`
varying vec4 vC;
void main(){ float r = clamp(1. - length(gl_PointCoord - .5) * 2., 0., 1.); float g = r * r * r * .55 + smoothstep(.55, .9, r) * vC.a; gl_FragColor = vec4(vC.rgb * g, 1.); }`;

// frost vapour threads whipping back from the prong tips (ride space ribbons)
const VAP_VS = /* glsl */`
uniform float uTime; varying vec2 vUv;
void main(){ vUv = uv; vec3 p = position; float s = uv.x;
  p.x += sin(s * 9. - uTime * 15. + p.x * 3.) * .06 * s; p.y += sin(s * 7. - uTime * 11. + 1.7) * .05 * s;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`;
const VAP_FS = /* glsl */`
uniform float uTime; uniform vec3 uFrost; varying vec2 vUv;
${NOISE}
void main(){ float s = vUv.x; float a = (1. - s) * sqrt(max(1. - s, 0.)) * smoothstep(0., .04, s) * (1. - abs(vUv.y - .5) * 2.);
  a *= .35 + .65 * vn(vec2(s * 14. - uTime * 10., vUv.y * 2.)); gl_FragColor = vec4(uFrost * a * .55, 1.); }`;

// canopy frost: feathered crystals that flower at the frame's edge in the hail and sublime away
const FROST_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const FROST_FS = /* glsl */`
uniform float uAmt, uTime; uniform vec3 uFrost; varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vUv * 2. - 1.; float ax = abs(p.x), ay = abs(p.y) * .92; float mx = max(abs(p.x), abs(p.y));
  float e = smoothstep(.72, .98, max(ax, ay)) * (1. - smoothstep(.97, 1., mx));
  // dendrites growing in from the nearest edge: needles pointing inward, feathered with barbs at an angle
  float sx = step(ay, ax);
  float al = mix(1. - abs(p.y), 1. - abs(p.x), sx), ac = mix(p.x, p.y, sx);
  float wob = vn(vec2(ac * 6., al * 5.) + 3.) - .5;
  float n1 = vn(vec2(ac * 34. + wob * 2.2, al * 5.));
  float needle = 1. - abs(n1 - .5) * 2.; needle *= needle; needle *= needle;
  float n2 = vn(vec2((ac + al * .7) * 90., (al - ac * .7) * 16.)), n3 = vn(vec2((ac - al * .7) * 90., (al + ac * .7) * 16.) + 7.);
  float barb = max(1. - abs(n2 - .5) * 2., 1. - abs(n3 - .5) * 2.); barb *= barb; barb *= barb; barb *= barb;
  float fe = max(needle, barb * smoothstep(.2, .7, needle + .3));
  float m = fe * e * min(uAmt * 1.6, 1.) * smoothstep(1. - uAmt, 1.25 - uAmt, e + .3 * fe);
  float sp = step(.985, h21(floor(vUv * vec2(260., 150.)) + floor(uTime * 3.))) * m;
  gl_FragColor = vec4(uFrost * (m * .3 + sp * 1.2), 1.);
}`;

// rare event: a sheared curtain of impact ejecta across the open sheet, holed by each skiff
const CURT_VS = /* glsl */`varying vec2 vUv; varying vec3 vW;
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CURT_FS = /* glsl */`
uniform vec4 uHole[6]; uniform vec3 uSunCol, uFrost; uniform float uTime;
varying vec2 vUv; varying vec3 vW;
${NOISE}
void main(){
  float n = fbm(vec2(vUv.x * 12. + vUv.y * 3., vUv.y * 2.5 - uTime * .04));
  float st = fbm(vec2(vUv.x * 70. + vUv.y * 26., vUv.y * 1.4 - uTime * .08));
  float up = 1. - vUv.y;
  float fil = smoothstep(.3, .72, st);                         // sheared filaments of ejecta with dark lanes between, not a fog
  float a = smoothstep(0., .1, vUv.x) * (1. - smoothstep(.82, 1., vUv.x)) * up * up * smoothstep(0., .04, vUv.y) * (.3 + .7 * n) * (.14 + .86 * fil);
  vec2 gq = vec2(vUv.x * 2600. + vUv.y * 900., vUv.y * 420.);
  float gl = step(.97, h21(floor(gq) + floor(uTime * 5.))) * (1. - smoothstep(.3, 1., max(fwidth(gq.x), fwidth(gq.y))));
  for (int i = 0; i < 6; i++) { float r = max(uHole[i].w, .01); a *= smoothstep(r * .65, r * 1.2, length(vW - uHole[i].xyz) + step(uHole[i].w, .02) * 100.); }
  a *= .25 + .75 * smoothstep(40., 260., length(cameraPosition - vW));
  gl_FragColor = vec4(uSunCol * uFrost * a * (.55 + 2.2 * gl), 1.);
}`;

// the portal's pool of light: a mint-white ring of glow round the seat (nothing inside the opening itself)
const HALO_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const HALO_FS = /* glsl */`
uniform vec3 uMint, uShineCol; uniform float uK, uTime; varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = (vUv - .5) * 100.; float r = length(p);
  float ray = .75 + .25 * vn(p / max(r, 1.) * 3. + vec2(r * .06 - uTime * .35, 7.));
  float g = smoothstep(6.7, 7.8, r) * exp(-max(r - 7., 0.) / 10.) * (1. - smoothstep(38., 50., r));
  vec3 col = mix(uMint, vec3(1.), .35) * g * ray * uK * .8;
  // the giant lights the right rim butterscotch
  float side = smoothstep(-.1, .8, p.x / max(r, 1.));
  col += uShineCol * 6. * side * smoothstep(6.6, 7.3, r) * (1. - smoothstep(7.5, 11., r)) * uK;
  gl_FragColor = vec4(col, 1.);
}`;

// sun shafts stabbing through the dust of the density wave: long ribbons along the sun's direction, turned to the eye
const SHAFT_VS = /* glsl */`
attribute vec4 aS;   // t (-1..1 along), side (-1..1), length, width
attribute float aH;
uniform vec3 uSun; varying vec3 vQ; varying float vF;
void main(){
  vec3 c = position; vec3 toC = c - cameraPosition;
  vec3 sd = normalize(cross(uSun, toC) + vec3(0., 1e-4, 0.));
  vec3 P = c - uSun * aS.x * aS.z + sd * aS.y * aS.w;
  vQ = vec3(aS.xy, aH);
  vF = smoothstep(30., 120., length(P - cameraPosition)) * (1. - smoothstep(520., 760., length(toC)));
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
}`;
const SHAFT_FS = /* glsl */`
uniform vec3 uSunCol, uCream; uniform float uTime; varying vec3 vQ; varying float vF;
${NOISE}
void main(){
  float e = 1. - vQ.y * vQ.y; e *= e * e;
  float l = smoothstep(-1., -.2, vQ.x) * (1. - smoothstep(-.2, 1., vQ.x));
  float n = .25 + .75 * vn(vec2(vQ.y * 5. + vQ.z * 31., vQ.x * 1.3 - uTime * .12 + vQ.z * 5.));   // rays within the shaft
  n *= .7 + .3 * vn(vec2(vQ.x * 9. - uTime * .3, vQ.z * 17.));
  gl_FragColor = vec4(uSunCol * mix(uCream, vec3(1.), .4) * e * l * n * vF * .034, 1.);
}`;

// ---------------- CPU helpers ----------------
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }

// a fractured ice block of roughly unit radius with flat facets and per-face colour
function stoneGeometry(kind, rng, frost, blue, cream) {
  let g = kind === 0 ? new THREE.OctahedronGeometry(1, 0) : new THREE.IcosahedronGeometry(1, kind === 1 ? 0 : kind === 2 ? 1 : 2);
  const pos = g.attributes.position, v = new THREE.Vector3();
  const sq = kind === 3 ? [1.12, 0.8, 0.95] : [rng.range(1.1, 1.3), rng.range(0.55, 0.75), rng.range(0.8, 1.0)];
  const planes = [];
  for (let i = 0; i < [0, 2, 5, 9][kind]; i++) planes.push({ n: new THREE.Vector3(rng.gauss(), rng.gauss(), rng.gauss()).normalize(), d: rng.range(0.42, 0.72) });
  const ph = rng.range(0, 50), amp = kind === 3 ? 0.32 : 0.5;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = 0.74 + amp * hash3(Math.round(v.x * 100) + ph, Math.round(v.y * 100), Math.round(v.z * 100));
    v.multiplyScalar(r);
    for (const p of planes) { const o = v.dot(p.n) - p.d; if (o > 0) v.addScaledVector(p.n, -o * 0.92); }
    pos.setXYZ(i, v.x * sq[0], v.y * sq[1], v.z * sq[2]);
  }
  g.deleteAttribute('uv');
  if (kind >= 2) {
    g.deleteAttribute('normal'); g = mergeVertices(g, 1e-3); g.computeVertexNormals();
    const n = g.attributes.position.count, colS = new Float32Array(n * 3), cs = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const b = rng.range(0.58, 0.74), w = rng();
      cs.copy(frost).lerp(w < 0.25 ? blue : cream, w < 0.25 ? 0.25 : rng.range(0, 0.22)).multiplyScalar(b);
      colS[i * 3] = cs.r; colS[i * 3 + 1] = cs.g; colS[i * 3 + 2] = cs.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colS, 3));
    return g;
  }
  g.computeVertexNormals();
  const col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let f = 0; f < pos.count / 3; f++) {
    const b = rng.range(0.5, 0.78), w = rng();
    c.copy(frost).lerp(w < 0.25 ? blue : cream, w < 0.25 ? 0.3 : rng.range(0, 0.25)).multiplyScalar(b);
    for (let j = 0; j < 3; j++) col.set([c.r, c.g, c.b], (f * 3 + j) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// hull pieces: non-indexed geometry with a flat colour and an emissive amount, ready to merge
function piece(g, col, e = 0, m = null) {
  if (g.index) g = g.toNonIndexed();
  if (m) g.applyMatrix4(m);
  g.deleteAttribute('uv'); g.computeVertexNormals();
  const n = g.attributes.position.count, C = new Float32Array(n * 3), E = new Float32Array(n);
  for (let i = 0; i < n; i++) { C[i * 3] = col[0]; C[i * 3 + 1] = col[1]; C[i * 3 + 2] = col[2]; E[i] = e; }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('aE', new THREE.BufferAttribute(E, 1));
  return g;
}
const _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _zn = new THREE.Vector3(0, 0, -1), _one = new THREE.Vector3(1, 1, 1);
// a box beam from a to b (w wide, h high), its far end scaled by taper
function beam(a, b, w, h, col, e = 0, taper = 1) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.BoxGeometry(w, h, len).translate(0, 0, -len / 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getZ(i) < -len / 2) p.setXY(i, p.getX(i) * taper, p.getY(i) * taper);
  _q.setFromUnitVectors(_zn, B.clone().sub(A).normalize());
  return piece(g, col, e, _m4.compose(A, _q, _one).clone());
}

export default {
  id: 'ring-run',
  name: 'The Ring Run',
  category: 'alien',
  media: ['space'],
  weirdness: 0.3,
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {};
    const detail = (ctx.quality && ctx.quality.detail) || 1;
    const busy = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020308');
    scene.fog = new THREE.FogExp2('#060a14', 0.00007);
    const pal = PALETTE.map((h) => new THREE.Color(h));
    const [butter, caramel, cream, frostBase, blue, , mint] = pal;

    // ---------- per-seed variety ----------
    let look = rng.int(0, 2);                                   // 0: sun at 14 deg, 1: grazing 4 deg (tiger stripes), 2: high 30 deg (white road)
    if (vary.hour === 'dawn' || vary.hour === 'golden' || vary.hour === 'night') look = 1; else if (vary.hour === 'day') look = 2;
    const sunElev = [14, 4, 30][look];
    const giantKind = rng.int(0, 2);                            // butterscotch | pale gold + slate bands + hex polar storm | near-full disc
    const ringType = rng.pick(['ice', 'ice', 'rose', 'braid']);
    const moonType = rng.pick(['potato', 'potato', 'walnut', 'pair']);
    const nRivals = Math.max(0, Math.min(5, Math.round(rng.pick([0, 1, 2, 3, 3, 3, 4, 5]) * busy)));
    const convoy = rng.chance(0.35);
    const rare = !!vary.rare;
    const planetDir = new THREE.Vector3(0.54, 0.09, -0.80).normalize();

    // ---------- the hero: the far shore and the shepherd moon ----------
    const hero = await buildHero(ctx, { palette: PALETTE, sunElevation: sunElev, planetDir: planetDir.toArray(), ring: ringType, moon: moonType, density: Math.min(1, busy) });
    scene.add(hero.object);
    const H = hero.uniforms, A = hero.anchors, sunDir = A.sunDir.clone();
    const shine = giantKind === 1 ? new THREE.Color('#E9D49A') : butter;
    H.uShineCol.value.copy(shine).multiplyScalar(giantKind === 2 ? 0.5 : 0.42);
    await ctx.yield();

    // ---------- the path ----------
    const pxF = (d) => (d < 2900 ? -40 * Math.sin(((d - 2250) / 400) * Math.PI * 2) * ss(2250, 2330, d) * (1 - ss(2770, 2850, d))
      + 22 * Math.sin(((d - 300) / 400) * Math.PI * 2) * ss(300, 370, d) * (1 - ss(630, 700, d))     // the first close pass: a jink round three bergs
      : -25 * Math.pow(Math.sin(Math.PI * Math.min(1, (d - 2900) / 480)), 2));
    const pyF = (d) => 20 - 90 * ss(750, 1050, d) + 110 * ss(2150, 2800, d);
    const pts = [];
    for (let d = 0; d <= 3380; d += 26) pts.push([pxF(d), pyF(d), Z0 - d]);
    for (let i = 2; i < A.flyThrough.length; i++) pts.push(A.flyThrough[i].clone());
    const path = makePath(pts, { samples: 480 });
    const LEN = path.length;
    const lut = [];
    { const sm = [], v = new THREE.Vector3(); for (let i = 0; i <= 1600; i++) { path.pointAt(i / 1600, v); sm.push(v.x, v.y, v.z); }
      let j = 1600;
      for (let k = 0; k < NL; k++) { const z = LUT_Z0 + k * LUT_STEP; while (j > 0 && sm[j * 3 + 2] < z) j--; lut.push(new THREE.Vector2(sm[j * 3], sm[j * 3 + 1])); } }
    await ctx.yield();
    const uOf = (d) => Math.min(1, d / LEN);                     // d (down-ring metres) is close to arc length for the level stretch

    // ---------- shared uniforms ----------
    const sunCol = H.uSunCol.value;
    const S = {
      uTime: H.uTime, uPix: H.uPix, uSun: H.uSun, uPlanet: H.uPlanet, uSunCol: H.uSunCol, uShineCol: H.uShineCol, uAmb: H.uAmb,
      uFrost: H.uFrost, uCream: H.uCream, uBlue: H.uBlue, uX0: H.uX0, uX1: H.uX1, uPath: { value: lut },
      uMint: { value: mint.clone() }, uUnder: { value: 0 }, uLitK: { value: 0.5 },
    };
    const mat = (vs, fs, uniforms, extra = {}) => new THREE.ShaderMaterial(Object.assign({ uniforms: Object.assign({}, S, uniforms), vertexShader: vs, fragmentShader: fs }, extra));
    const addMat = (vs, fs, uniforms, extra = {}) => mat(vs, fs, uniforms, Object.assign({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, extra));

    await ctx.yield();

    // ---------- sky ----------
    const up = new THREE.Vector3(0, 1, 0);
    const plC = new THREE.Vector3(planetDir.x, 0.035, planetDir.z).normalize();
    const plR = new THREE.Vector3().crossVectors(plC, up).normalize(), plU = new THREE.Vector3().crossVectors(plR, plC).normalize();
    const gcol = giantKind === 1 ? ['#E9D49A', '#5E7896', '#F4ECD2', '#7F9DBE'] : ['#E8B46A', '#B9762F', '#F7E6C2', '#B9762F'];
    const skyMat = mat(SKY_VS, SKY_FS, {
      uPl: { value: plC }, uPlR: { value: plR }, uPlU: { value: plU },
      uC1: { value: new THREE.Color(gcol[0]) }, uC2: { value: new THREE.Color(gcol[1]) }, uC3: { value: new THREE.Color(gcol[2]) }, uC4: { value: new THREE.Color(gcol[3]) },
      uM1: { value: new THREE.Vector3(-0.36, 0.3, -0.88).normalize() }, uM2: { value: new THREE.Vector3(0.12, 0.42, -0.9).normalize() },
      uPlRad: { value: Math.sin(THREE.MathUtils.degToRad(giantKind === 2 ? 39 : 35)) }, uKind: { value: giantKind },
      uTilt: { value: giantKind === 1 ? -0.44 : rng.range(-0.05, 0.05) }, uShLat: { value: giantKind === 2 ? 0.05 : 0.06 + sunElev * 0.004 },
      uStormLon: { value: rng.range(-0.75, -0.2) }, uStormLat: { value: rng.range(0.2, 0.42) * (giantKind === 1 ? -0.6 : 1) },
    }, { depthTest: false, depthWrite: false, side: THREE.BackSide });
    const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 3), skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

    // ---------- the ring sheet (near side of the gap at y 0; the far side lies just under the hero's own sheet) ----------
    const combK = 0.011 * Math.tan(THREE.MathUtils.degToRad(sunElev)) / Math.tan(THREE.MathUtils.degToRad(14));
    const sheetU = (far) => ({ uFar: { value: far }, uCombK: { value: Math.max(0.0035, combK) }, uCombT: { value: [0.5, 0.42, 0.56][look] },
      uRose: { value: ringType === 'rose' ? 1 : 0 }, uBraid: { value: ringType === 'braid' ? 1 : 0 }, uShC: { value: new THREE.Vector3(9800, -5200, 6200) } });
    const quad = (z0, z1, y) => { const g = new THREE.PlaneGeometry(30000, z1 - z0).rotateX(-Math.PI / 2).translate(0, y, (z0 + z1) / 2); return g; };
    const sheetA = new THREE.Mesh(quad(840, 14000, 0), mat(SHEET_VS, SHEET_FS, sheetU(0), { side: THREE.DoubleSide }));
    const sheetB = new THREE.Mesh(quad(-14000, 350, -1.5), mat(SHEET_VS, SHEET_FS, sheetU(1), { side: THREE.DoubleSide }));
    sheetA.frustumCulled = sheetB.frustumCulled = false; scene.add(sheetA, sheetB);
    await ctx.yield();

    // ---------- wrapped stones: pebbles, boulders, bergs ----------
    const frost = H.uFrost.value.clone().multiplyScalar(1 / 0.66);
    const shLen = 2 / Math.tan(THREE.MathUtils.degToRad(Math.max(sunElev, 5)));
    const shTint = blue.clone().multiplyScalar(0.3).lerp(new THREE.Color(1, 1, 1), 0.06);
    const quadG = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);
    const srng = rng.fork('stones');
    const classes = [
      { kind: 0, n: Math.round(9700 * detail * busy), L: 640, half: 330, pw: 2.0, rmin: 0.28, rmax: 1.1, alpha: 2.2, drift: [2, 9], shadow: false },
      { kind: 1, n: Math.round(4200 * Math.max(0.8, detail) * busy), L: 1300, half: 620, pw: 1.6, rmin: 1.4, rmax: 5.5, alpha: 1.9, drift: [1, 6], shadow: true },
      { kind: 2, n: Math.round(420 * busy), L: 2400, half: 1500, pw: 1.25, rmin: 6, rmax: 15, alpha: 2.2, drift: [0.5, 3], shadow: true },
    ];
    for (const cl of classes) {
      const base = stoneGeometry(cl.kind, srng, frost, blue, cream);
      const P = new Float32Array(cl.n * 4), Q = new Float32Array(cl.n * 4), AX = new Float32Array(cl.n * 3);
      for (let i = 0; i < cl.n; i++) {
        P[i * 4] = srng.sign() * cl.half * Math.pow(srng(), cl.pw); P[i * 4 + 1] = srng(); P[i * 4 + 2] = srng.gauss();
        P[i * 4 + 3] = Math.min(cl.rmax, cl.rmin * Math.pow(1 - srng() * 0.985, -1 / cl.alpha));
        Q[i * 4] = srng.range(0, 6.283); Q[i * 4 + 1] = srng.range(cl.drift[0], cl.drift[1]); Q[i * 4 + 2] = srng() < 0.35 ? srng.range(0.6, 1.6) : 0.1; Q[i * 4 + 3] = srng();
        AX[i * 3] = srng.gauss(); AX[i * 3 + 1] = srng.gauss(); AX[i * 3 + 2] = srng.gauss();
      }
      const aP = new THREE.InstancedBufferAttribute(P, 4), aQ = new THREE.InstancedBufferAttribute(Q, 4);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); g.setAttribute('color', base.attributes.color);
      g.setAttribute('aP', aP); g.setAttribute('aQ', aQ); g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(AX, 3));
      if (base.index) g.setIndex(base.index);
      g.instanceCount = cl.n;
      const cu = { uL: { value: cl.L }, uAhead: { value: 0.8 } };
      const mesh = new THREE.Mesh(g, mat(STONE_VS, STONE_FS, cu, cl.kind === 2 ? { defines: { DETAIL: 1 } } : {})); mesh.frustumCulled = false; scene.add(mesh);
      if (cl.shadow) {
        const sg = new THREE.InstancedBufferGeometry();
        sg.setAttribute('position', quadG.attributes.position); sg.setIndex(quadG.index);
        sg.setAttribute('aP', aP); sg.setAttribute('aQ', aQ); sg.instanceCount = cl.n;
        const sh = new THREE.Mesh(sg, mat(SHADOW_VS, SHADOW_FS, Object.assign({ uShLen: { value: shLen }, uShTint: { value: shTint } }, cu),
          { transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide }));
        sh.frustumCulled = false; sh.renderOrder = 1; scene.add(sh);
      }
      await ctx.yield();
    }

    // ---------- placed bergs: landmarks on the open sheet, keels under it, the slalom in the density wave ----------
    const brng = rng.fork('bergs'), bergs = [];
    const addBerg = (d, lat, y, r, near = false) => {
      const z = Z0 - d; let x = pxF(Math.min(d, 2899)) + lat, t = 0;
      while (path.distanceTo(x, y, z) < r * 1.3 + 7.5 && t++ < 30) x += (lat < 0 ? -1 : 1) * 2.5;
      const dr = near ? 0 : brng.range(-1.2, 1.2);
      if (z - r < 962) return;                                 // nothing hangs over the gap: the black is sudden
      bergs.push([x, y, z, r, dr]);
    };
    addBerg(250, -62, 2, 12); addBerg(520, 96, -3, 18); addBerg(830, -140, 3, 22); addBerg(1010, 48, 0, 10);
    // the first close pass (d 400-720): bergs standing up through the sheet on the inside of each bend of the jink
    addBerg(400, -29, 6, 16, true); addBerg(490, 27, 8, 13, true); addBerg(522, -36, 4, 18, true); addBerg(600, 28, 6, 17, true); addBerg(716, 27, 7, 12, true);
    for (let i = 0; i < Math.round(20 * busy); i++) { const r = brng.range(8, 20); addBerg(brng.range(80, 1550), brng.sign() * brng.range(50, 560), brng.range(-0.35, 0.35) * r, r); }
    await ctx.yield();
    for (let i = 0; i < 7; i++) { const r = brng.range(12, 22); addBerg(1380 + i * 118 + brng.range(-30, 30), (i % 2 ? 1 : -1) * (r * 1.3 + brng.range(9, 17)), -70 + brng.range(6, 30), r, true); }
    for (let i = 0; i < Math.round(13 * busy); i++) { const r = brng.range(12, 28); addBerg(brng.range(1330, 2250), brng.sign() * brng.range(50, 420), -r * brng.range(0.4, 0.7), r); }
    await ctx.yield();
    for (let d = 2296, i = 0; d < 2885; d += 25, i++) { const r = brng.range(8, 17); addBerg(d, (i % 2 ? 1 : -1) * (r * 1.3 + brng.range(8.5, 11.5)), pyF(d) + brng.range(-0.5, 0.5) * r, r, true); }
    for (let i = 0; i < Math.round(36 * busy); i++) { const r = brng.range(9, 24); addBerg(brng.range(2270, 2850), brng.sign() * brng.range(46, 320), brng.gauss() * 36, r); }
    await ctx.yield();
    const loose = [quadG];
    {
      const base = stoneGeometry(3, brng, frost, blue, cream); loose.push(base);
      const n = bergs.length, P = new Float32Array(n * 4), Q = new Float32Array(n * 4), AX = new Float32Array(n * 3);
      bergs.forEach((b, i) => {
        P.set([b[0], b[1], b[2], b[3]], i * 4);
        Q.set([brng.range(0, 6.283), brng.range(0.03, 0.11) * brng.sign(), brng.range(0.5, 1.5), b[4]], i * 4);
        AX.set([brng.gauss(), brng.gauss(), brng.gauss()], i * 3);
      });
      const iP = new THREE.InstancedBufferAttribute(P, 4), iQ = new THREE.InstancedBufferAttribute(Q, 4);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); g.setAttribute('color', base.attributes.color);
      g.setAttribute('iP', iP); g.setAttribute('iQ', iQ); g.setAttribute('iAxis', new THREE.InstancedBufferAttribute(AX, 3)); g.instanceCount = n;
      if (base.index) g.setIndex(base.index);
      const mesh = new THREE.Mesh(g, mat(BERG_VS, STONE_FS, { uLitK: { value: 0.42 } }, { defines: { DETAIL: 1 } })); mesh.frustumCulled = false; scene.add(mesh);
      const sg = new THREE.InstancedBufferGeometry();
      sg.setAttribute('position', quadG.attributes.position); sg.setIndex(quadG.index); sg.setAttribute('iP', iP); sg.setAttribute('iQ', iQ); sg.instanceCount = n;
      const sh = new THREE.Mesh(sg, mat(SHADOW_VS, SHADOW_FS, { uShLen: { value: shLen }, uShTint: { value: shTint } },
        { transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide, defines: { FIXED: 1 } }));
      sh.frustumCulled = false; sh.renderOrder = 1; scene.add(sh);
    }
    await ctx.yield();

    // ---------- near-field motes (the hail when we punch through the plane) ----------
    const moteU = { uBoxM: { value: new THREE.Vector3(40, 26, 200) }, uVel: { value: new THREE.Vector3(0, 0, -2.6) }, uFlow: { value: 22 }, uMoteK: { value: 1 } };
    {
      const n = Math.round(2400 * detail), M = new Float32Array(n * 4), mr = rng.fork('motes');
      for (let i = 0; i < n * 4; i++) M[i] = mr();
      const qg = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0); loose.push(qg);
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', qg.attributes.position); g.setIndex(qg.index);
      g.setAttribute('aM', new THREE.InstancedBufferAttribute(M, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, addMat(MOTE_VS, MOTE_FS, moteU, { side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
    }

    await ctx.yield();

    // ---------- the skiff, built round the camera (ride space: eye at the origin, looking down -Z) ----------
    const GRAPH = [0.018, 0.02, 0.025], GRAPH2 = [0.03, 0.033, 0.04], DARK = [0.008, 0.009, 0.012], STRUT = [0.1, 0.11, 0.13];
    const hullMat = mat(HULL_VS, HULL_FS, {});
    const skiff = new THREE.Group(); scene.add(skiff);
    const tips = [[-0.7, -1.2, -6.3], [0.7, -1.2, -6.3]];
    {
      const parts = [];
      for (const sx of [-1, 1]) {
        parts.push(beam([sx * 0.7, -1.34, -0.6], [sx * 0.7, -1.2, -6.3], 0.2, 0.15, GRAPH, 0, 0.28));          // prow prongs
        parts.push(beam([sx * 0.7, -1.255, -2.2], [sx * 0.7, -1.19, -5.0], 0.035, 0.02, GRAPH2, 0.5, 0.6));     // lit seam along each prong
        parts.push(piece(new THREE.OctahedronGeometry(0.075, 0), GRAPH, 5, new THREE.Matrix4().makeTranslation(sx * 0.7, -1.2, -6.32)));
        parts.push(beam([sx * 1.58, -1.0, -1.2], [sx * 1.0, 1.25, -1.12], 0.017, 0.03, STRUT));              // raked canopy struts: slim, out at the frame's edge
        parts.push(beam([sx * 1.0, 1.25, -1.12], [0, 1.32, -0.6], 0.04, 0.07, GRAPH));
        let prev = null;                                                                                          // the low coaming
        for (let k = 0; k <= 6; k++) {
          const a = (k / 6) * 1.5, p = [sx * Math.sin(a) * 1.5, -1.02 - 0.02 * k, -0.25 - Math.cos(a) * 1.75];
          if (prev) parts.push(beam(prev, p, 0.16, 0.18, k % 2 ? GRAPH : GRAPH2)); prev = p;
        }
      }
      parts.push(beam([0, 1.32, -0.6], [0, 1.36, 1.2], 0.1, 0.12, GRAPH));                                       // the spine overhead
      parts.push(beam([0, -1.2, -1.2], [0, -1.36, -3.4], 1.7, 0.12, DARK, 0, 0.82));                              // foredeck between the prongs
      for (let k = -1; k <= 1; k++) parts.push(piece(new THREE.BoxGeometry(0.03, 0.03, 0.02), GRAPH, 3.2, new THREE.Matrix4().makeTranslation(k * 0.09, -0.905, -1.87)));
      const hg = mergeGeometries(parts); parts.forEach((p) => p.dispose());
      const hull = new THREE.Mesh(hg, hullMat); hull.frustumCulled = false; skiff.add(hull);
    }
    await ctx.yield();
    const levelBar = new THREE.Mesh(piece(new THREE.BoxGeometry(0.46, 0.014, 0.014), GRAPH, 3.4), hullMat);
    levelBar.position.set(0, -0.855, -1.98); levelBar.frustumCulled = false; skiff.add(levelBar);
    const vanes = [-1, 1].map((sx) => {
      const g = piece(new THREE.BoxGeometry(0.5, 0.03, 0.6).translate(sx * 0.25, 0, 0), GRAPH2, 0);
      const v = new THREE.Mesh(g, hullMat); v.position.set(sx * 1.6, -1.0, -1.75); v.frustumCulled = false; skiff.add(v); return v;
    });
    const glowMat = addMat(GLOW_VS, GLOW_FS, {});
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(tips.flat(), 3));
      g.setAttribute('aC', new THREE.Float32BufferAttribute([mint.r * 2.2, mint.g * 2.2, mint.b * 2.2, 1.2, mint.r * 2.2, mint.g * 2.2, mint.b * 2.2, 1.2], 4));
      g.setAttribute('aS', new THREE.Float32BufferAttribute([0.75, 0.75], 1));
      const p = new THREE.Points(g, glowMat); p.frustumCulled = false; p.renderOrder = 6; skiff.add(p);
      // vapour threads trailing back and outward from the tips
      const P = [], UV = [], I = [], NS = 14;
      tips.forEach((t, s) => {
        const sx = s ? 1 : -1, b0 = P.length / 3;
        for (let k = 0; k <= NS; k++) {
          const f = k / NS, w = 0.02 + 0.2 * f, c = [t[0] + sx * (0.25 * f + 1.6 * f * f), t[1] + 0.18 * f + 0.5 * f * f, t[2] + 6.4 * f];
          P.push(c[0] - w * 0.5, c[1], c[2], c[0] + w * 0.5, c[1] + w * 0.6, c[2]); UV.push(f, 0, f, 1);
          if (k < NS) { const a = b0 + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
      });
      const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); vg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); vg.setIndex(I);
      const vap = new THREE.Mesh(vg, addMat(VAP_VS, VAP_FS, {}, { side: THREE.DoubleSide })); vap.frustumCulled = false; vap.renderOrder = 5; skiff.add(vap);
    }
    const frostU = { uAmt: { value: 0 } };
    {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.3), addMat(FROST_VS, FROST_FS, frostU, { depthTest: false }));
      f.position.set(0, 0, -0.85); f.frustumCulled = false; f.renderOrder = 20; skiff.add(f);
    }
    await ctx.yield();

    // ---------- the rivals, the buoys, the ore-tug: hulls and one sheet of glow points ----------
    const rr = rng.fork('cast');
    const dartG = mergeGeometries([
      piece(new THREE.ConeGeometry(0.95, 7, 4).rotateX(-Math.PI / 2).scale(1, 0.42, 1).translate(0, 0, -1.5), GRAPH),
      piece(new THREE.ConeGeometry(0.95, 2.2, 4).rotateX(Math.PI / 2).scale(1, 0.42, 1).translate(0, 0, 3.1), DARK),
      beam([-0.3, 0, 1.2], [-2.3, 0.25, 3.6], 0.5, 0.06, GRAPH2, 0, 0.3), beam([0.3, 0, 1.2], [2.3, 0.25, 3.6], 0.5, 0.06, GRAPH2, 0, 0.3),
      piece(new THREE.BoxGeometry(0.7, 0.14, 0.1), GRAPH, 4, new THREE.Matrix4().makeTranslation(0, 0, 4.15)),
    ]);
    await ctx.yield();
    const rivals = new THREE.InstancedMesh(dartG, hullMat, 5); rivals.count = nRivals; rivals.frustumCulled = false; scene.add(rivals);
    const rv = [];
    for (let i = 0; i < 5; i++) rv.push({ ahead: i === 0 ? 205 : rr.range(70, 300), lat: rr.sign() * rr.range(7, 20), amp: rr.range(5, 11), f: rr.range(0.45, 0.9), ph: rr.range(0, 6.28), yo: rr.range(0.75, 1.15) });
    const NB = 10, buoyD = []; for (let i = 0; i < NB; i++) buoyD.push(120 + 150 * i);   // a metronome: six stand on the open sheet, four hang under it
    const buoyG = mergeGeometries([piece(new THREE.CylinderGeometry(0.1, 0.32, 13, 5).translate(0, 6.5, 0), GRAPH2), piece(new THREE.OctahedronGeometry(0.42, 0).translate(0, 13.3, 0), GRAPH, 2.5)]);
    const buoys = new THREE.InstancedMesh(buoyG, hullMat, NB); buoys.frustumCulled = false; scene.add(buoys);
    const buoyP = buoyD.map((d, i) => { const flip = d > 840 ? -1 : 1, bx = pxF(d) - 13; const m = new THREE.Matrix4().makeRotationX(flip < 0 ? Math.PI : 0).setPosition(bx, 0, Z0 - d); buoys.setMatrixAt(i, m); return new THREE.Vector3(bx, 13.3 * flip, Z0 - d); });
    const nTug = convoy ? 4 : 1;
    const tugG = mergeGeometries([
      piece(new THREE.IcosahedronGeometry(13, 1), [0.5, 0.54, 0.6]),
      piece(new THREE.TorusGeometry(13.3, 0.4, 4, 14), DARK), piece(new THREE.TorusGeometry(13.3, 0.4, 4, 14).rotateY(Math.PI / 2), DARK), piece(new THREE.TorusGeometry(13.3, 0.4, 4, 14).rotateX(Math.PI / 2), DARK),
      beam([0, 0, 0], [26, 0, 0], 0.5, 0.5, DARK), piece(new THREE.BoxGeometry(9, 3, 3.4).translate(30, 0, 0), GRAPH2), piece(new THREE.BoxGeometry(0.5, 0.8, 3.6).translate(34.6, 0, 0), GRAPH, 3),
    ]);
    { const p = tugG.attributes.position, v = new THREE.Vector3();                                              // lump the netted berg
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const l = v.length(); if (l < 13.05 && l > 12.9) { v.multiplyScalar(0.8 + 0.3 * hash3(Math.round(v.x * 10), Math.round(v.y * 10), Math.round(v.z * 10))); p.setXYZ(i, v.x, v.y, v.z); } }
      tugG.computeVertexNormals(); }
    await ctx.yield();
    const tugs = new THREE.InstancedMesh(tugG, hullMat, nTug); tugs.frustumCulled = false; scene.add(tugs);
    const tugZ = rr.range(560, 700), tugY = rr.range(-46, -22);

    const NTR = 18, NG = 5 + 5 * NTR + NB + 4 + 1;
    const gPos = new Float32Array(NG * 3), gCol = new Float32Array(NG * 4), gSize = new Float32Array(NG);
    const glowG = new THREE.BufferGeometry();
    glowG.setAttribute('position', new THREE.BufferAttribute(gPos, 3)); glowG.setAttribute('aC', new THREE.BufferAttribute(gCol, 4)); glowG.setAttribute('aS', new THREE.BufferAttribute(gSize, 1));
    const glows = new THREE.Points(glowG, glowMat); glows.frustumCulled = false; glows.renderOrder = 4; scene.add(glows);
    const setGlow = (i, p, c, k, size, core = 1) => { gPos[i * 3] = p.x; gPos[i * 3 + 1] = p.y; gPos[i * 3 + 2] = p.z; gCol[i * 4] = c.r * k; gCol[i * 4 + 1] = c.g * k; gCol[i * 4 + 2] = c.b * k; gCol[i * 4 + 3] = core; gSize[i] = size; };

    // ---------- rare event: the ejecta curtain of a meteoroid strike, sheared across the open sheet ----------
    const cA = new THREE.Vector3(-560, 0, Z0 - 470), cB = new THREE.Vector3(520, 0, Z0 - 1010), cS = new THREE.Vector3(-45, 70, -26);
    const cN = new THREE.Vector3().subVectors(cB, cA).cross(cS).normalize(); if (cN.z < 0) cN.negate();
    const holes = []; for (let i = 0; i < 6; i++) holes.push(new THREE.Vector4(0, 0, 0, 0));
    {
      const g = new THREE.PlaneGeometry(1, 1, 30, 6), p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const a = uv.getX(i), b = uv.getY(i); p.setXYZ(i, cA.x + (cB.x - cA.x) * a + cS.x * b, cS.y * b, cA.z + (cB.z - cA.z) * a + cS.z * b); }
      const curtain = new THREE.Mesh(g, addMat(CURT_VS, CURT_FS, { uHole: { value: holes } }, { side: THREE.DoubleSide }));
      curtain.frustumCulled = false; curtain.renderOrder = 2; curtain.visible = rare; scene.add(curtain);
    }
    await ctx.yield();

    // ---------- the portal's halo and the slalom's sun shafts ----------
    const haloU = { uK: { value: 0.5 } };
    {
      const h = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), addMat(HALO_VS, HALO_FS, haloU, { side: THREE.DoubleSide }));
      h.position.copy(A.portalSeat.position).addScaledVector(A.approachDir, 0.6);
      h.lookAt(h.position.clone().sub(A.approachDir)); h.frustumCulled = false; h.renderOrder = 7; scene.add(h);
      const shr = rng.fork('shafts'), NSH = 5, P = [], SA = [], HH = [], I = [];
      for (let k = 0; k < NSH; k++) {
        const d = 2350 + k * 105 + shr.range(-20, 20), sx = k % 2 ? 1 : -1;
        const c = [pxF(d) + sx * shr.range(16, 30), pyF(d) + shr.range(10, 22), Z0 - d], len = shr.range(130, 200), wid = shr.range(2.5, 5), hh = shr();
        const b = P.length / 3;
        for (const t of [-1, 1]) for (const sd of [-1, 1]) { P.push(c[0], c[1], c[2]); SA.push(t, sd, len, wid); HH.push(hh); }
        I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(SA, 4));
      g.setAttribute('aH', new THREE.Float32BufferAttribute(HH, 1)); g.setIndex(I);
      const sh = new THREE.Mesh(g, addMat(SHAFT_VS, SHAFT_FS, {}, { side: THREE.DoubleSide })); sh.frustumCulled = false; sh.renderOrder = 3; scene.add(sh);
    }
    await ctx.yield();

    // ---------- runtime ----------
    const { smoothstep, bell, clamp } = ctx.core;
    const uHail = path.nearestXZ(0, Z0 - 840).u;                 // where the camera goes through the ring plane
    const uGapA = path.nearestXZ(0, 930).u, uGapB = path.nearestXZ(0, 330).u, uWave = path.nearestXZ(0, Z0 - 2250).u;
    const camP = new THREE.Vector3(), camQ = new THREE.Quaternion(), camS = new THREE.Vector3(), tan = new THREE.Vector3(), right = new THREE.Vector3();
    const qT = new THREE.Quaternion(), qR = new THREE.Quaternion(), m4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), t3 = new THREE.Vector3(), r3 = new THREE.Vector3(), u3 = new THREE.Vector3();
    const O = new THREE.Vector3(), Zax = new THREE.Vector3(0, 0, 1), sc3 = new THREE.Vector3(), white = new THREE.Color(0.75, 0.85, 1.0), poiV = new THREE.Vector3(), poiC = new THREE.Vector3(), poiM = new THREE.Vector3();
    const seat = A.portalSeat.position;
    const waveAt = (z) => { const d = Z0 - z; return smoothstep(2180, 2420, d) * (1 - smoothstep(2850, 2925, d)); };
    const heroStones = hero.object.children.filter((m) => /^stones/.test(m.name) && m.userData.full);

    function update(dt, time, camera, u) {
      u = u || 0;
      hero.setProgress(0.3 + 0.35 * smoothstep(uGapA - 0.03, uGapB, u));
      H.uRise.value = 0.03 + 0.97 * smoothstep(uHail + 0.05, uHail + 0.17, u);   // the far shore stands up while we are under the ceiling
      haloU.uK.value = 0.5 + 0.5 * smoothstep(uGapB - 0.03, 0.93, u);
      // while the far shore lies flat three kilometres off (and while we are seen through a portal) it is drawn with fewer stones
      const hk = u > uHail + 0.03 ? 1 : 0.35;
      for (let i = 0; i < heroStones.length; i++) heroStones[i].geometry.instanceCount = Math.floor(heroStones[i].userData.full * hk);
      hero.update(dt, time, camera);
      camera.matrixWorld.decompose(camP, camQ, camS);
      S.uUnder.value = smoothstep(3, -8, camP.y) * (1 - waveAt(camP.z));
      path.tangentAt(u, tan);
      moteU.uVel.value.copy(tan).multiplyScalar(2.8);
      const hail = smoothstep(uHail - 0.012, uHail, u) * (1 - smoothstep(uHail + 0.004, uHail + 0.02, u));
      moteU.uMoteK.value = 1 + 2.5 * hail;
      frostU.uAmt.value = smoothstep(uHail - 0.006, uHail + 0.004, u) * (1 - smoothstep(uHail + 0.015, uHail + 0.05, u));

      // the skiff rides the camera: mostly the gaze, a little the direction of travel, so it lags a head turn
      m4.lookAt(O, tan, up); qT.setFromRotationMatrix(m4).slerp(camQ, 0.74);
      skiff.quaternion.copy(qT);
      const here = u > 0 ? 1 : 0, slide = 1 - smoothstep(0, 0.006, u);
      skiff.position.copy(camP); skiff.position.y += Math.sin(time * 37) * 0.004 - slide * 2.2;
      skiff.scale.setScalar(here ? 1 : 1e-4);
      right.set(1, 0, 0).applyQuaternion(camQ);
      const roll = Math.asin(clamp(right.y, -1, 1));
      levelBar.rotation.z = -roll * 1.6 + Math.sin(time * 1.7) * 0.012;
      vanes[0].rotation.z = roll * 2.2 + Math.sin(time * 5.3) * 0.03 + 0.12; vanes[1].rotation.z = roll * 2.2 + Math.sin(time * 4.7 + 1) * 0.03 - 0.12;

      // rivals: dark darts on offset copies of the path, weaving, clipping the sheet, the leader through the portal first
      const dist = u * LEN;
      for (let i = 0; i < 5; i++) {
        const r = rv[i], d = dist + r.ahead, on = i < nRivals && d < LEN - 2;
        const ru = d / LEN, conv = 1 - smoothstep(0.84, 0.95, ru);
        path.posAtDist(d, p3); path.tangentAtDist(d, t3);
        r3.crossVectors(t3, up).normalize(); u3.crossVectors(r3, t3);
        const w = Math.sin(time * r.f + r.ph), wv = Math.cos(time * r.f + r.ph);
        const dipp = Math.max(0, Math.sin(time * 0.37 + r.ph * 2)); const yo = (-0.5 * clamp(p3.y, -18, 24) * r.yo - 6 * dipp * dipp * dipp * Math.sign(p3.y)) * conv;
        const file = 1 - 0.82 * Math.max(bell(d, 320, 780, 0.15), bell(d, 2250, 2910, 0.08));   // single file along the line where the bergs stand close
        p3.addScaledVector(r3, (r.lat + r.amp * w) * conv * file).addScaledVector(u3, yo);
        m4.lookAt(O, t3, up); qR.setFromRotationMatrix(m4); qT.setFromAxisAngle(Zax, -wv * 0.55 * conv); qR.multiply(qT);
        m4.compose(p3, qR, sc3.setScalar(on ? 1.9 : 1e-4)); rivals.setMatrixAt(i, m4);
        setGlow(i, poiV.copy(p3).addScaledVector(t3, -8), mint, on ? 2.6 : 0, 4.5);
        const clip = on ? smoothstep(9, 3.5, Math.abs(p3.y)) * (1 - waveAt(p3.z)) * (p3.z > 930 ? 1 : 0) : 0;   // a thin fan, only while the hull clips the sheet
        for (let k = 0; k < NTR; k++) {
          const j = 5 + i * NTR + k, f = k / NTR;
          poiV.copy(p3).addScaledVector(t3, -(8 + k * 5.5)).addScaledVector(r3, Math.sin(k * 1.9 + i * 2.1 + time * 2) * k * 0.3).addScaledVector(u3, k * 0.45 * Math.sign(p3.y || 1));
          setGlow(j, poiV, white, clip * (1 - f) * (1 - f) * 0.7, 1.4 + k * 0.3, 0);
        }
        // the curtain: each skiff punches a dark hole in it
        if (rare) { const s = poiV.copy(p3).sub(cA).dot(cN); holes[i].set(p3.x - cN.x * s, p3.y - cN.y * s, p3.z - cN.z * s, on && s < 0 ? 17 * smoothstep(0, 40, -s) : 0); }
      }
      if (rare) { const s = p3.copy(camP).sub(cA).dot(cN); holes[5].set(camP.x - cN.x * s, camP.y - cN.y * s, camP.z - cN.z * s, s < 30 ? 22 : 0); }
      rivals.instanceMatrix.needsUpdate = true;
      // buoys: slow-turning lamps, brightest as the beam sweeps past the eye
      for (let i = 0; i < NB; i++) {
        const b = buoyP[i], a = Math.atan2(camP.x - b.x, camP.z - b.z) - time * 0.9 - i * 1.1; let c = 0.5 + 0.5 * Math.cos(a); c *= c; c *= c;
        setGlow(5 + 5 * NTR + i, b, mint, 0.5 + 2.6 * c, 1.8 + 2.2 * c);
      }
      // the ore-tug (or a slow convoy of four) hauling netted bergs across the gap, keyed to the run so it is there when we are
      const tx = -620 + 900 * smoothstep(0.35, 1, u) + time * 4;
      for (let i = 0; i < 4; i++) {
        p3.set(tx - i * 150, tugY + Math.sin(i * 2.3) * 14, tugZ + Math.sin(i * 1.7) * 40);
        if (i < nTug) { qR.setFromAxisAngle(up, 0.08 * Math.sin(time * 0.2 + i)); m4.compose(p3, qR, sc3.setScalar(1)); tugs.setMatrixAt(i, m4); }
        p3.x += 35.5; setGlow(5 + 5 * NTR + NB + i, p3, mint, i < nTug ? 2.4 : 0, 3.2);
      }
      tugs.instanceMatrix.needsUpdate = true;
      // the portal: a mint-white star under the nearest crest, seen from across the gap
      setGlow(NG - 1, seat, mint, 3.0 * smoothstep(uWave - 0.1, uGapA, u) * (1 - smoothstep(0.9, 0.96, u)), 30);
      glowG.attributes.position.needsUpdate = true; glowG.attributes.aC.needsUpdate = true; glowG.attributes.aS.needsUpdate = true;
    }

    return {
      scene, path, duration: 39,
      pace: (u) => 1.04 + 0.1 * smoothstep(0.2, 0.36, u) - 0.3 * bell(u, uWave - 0.02, uGapA + 0.01, 0.3) - 0.12 * bell(u, uGapA + 0.01, uGapB + 0.02, 0.3),   // the hush: the gap is crossed unhurried
      ride: 'none', style: 'none',
      camera: { fov: 70, near: 0.35, far: 9000, lookAhead: 60, sway: 0.3, bank: 1 },
      pois: [
        { at: (time, u) => { path.pointAt(Math.min(1, u + 0.05), poiC); poiC.y += 95; return poiC; }, from: uHail + 0.01, to: uWave + 0.02, weight: 0.5 },
        { at: () => hero.moon.getWorldPosition(poiM), from: uGapA - 0.035, to: uGapA + 0.06, weight: 0.35 },
        { at: [420, 110, 40], from: uGapA + 0.01, to: uGapB - 0.02, weight: 0.4 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#DFFCF6', glow: 1, revealDistance: 1700, tilt: true },
      post: {
        exposure: [1.0, 1.15, 0.8][look],
        bloom: { strength: 0.5, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.07, tint: '#ffffff', shadowTint: '#020308', vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { for (const g of loose) g.dispose(); },
    };
  },
};
