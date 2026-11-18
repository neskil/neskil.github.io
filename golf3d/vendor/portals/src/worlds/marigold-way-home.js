// THE MARIGOLD WAY HOME: a courtyard house on the night the family is expected. One straight axis, built 8x
// life size: street passage -> open patio with fountain, lemon tree and dog -> kitchen -> the best room and
// its seven-tier candlelit altar (src/parts/marigold-way-home.js). A glowing petal road runs the whole way. The
// camera keeps a child's eye height but does not sit on the road: it leans off it in the passage, pans across the
// open court from high along the right arcade, passes the pots close, drifts by the rocking chair, and only then
// takes the middle of the petal aisle and climbs into the marigold arch.
// Light is two colours only: cobalt from the sky, orange-gold from petals and flame. Nothing here uses
// three.js lights: every surface is shaded by the altar's shader family (shared uniform table) plus the
// house shader below (procedural tiles, limewash, flagstones, wet reflections, analytic petal-road glow).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, buildPetalRoad, heroKit as K, makeCandleSet, makeHeadSet, makeLoosePetalSet, makeFlagSet } from '../parts/marigold-way-home.js';

const TAU = Math.PI * 2;
const PALETTE = ['#0B1230', '#1F47A8', '#FF9A1F', '#FFD98A', '#7A4FB0', '#D6336C', '#A8492E'];
// layout along -z (metres)
const Z0 = 30, ZSTART = 12, ZP0 = -80, ZK0 = -190, ZB0 = -260, ZEND = -390, HERO_Z = -376, WT = 2;   // WT = half thickness of the cross walls
const PW = 11, PH = 34, YW = 48, AX = 36, KW = 22, KH = 32, BW = 30, BH = 46;        // half widths and heights
const FTN = { x: 0, z: -135, r: 9 }, TREE = { x: -22, z: -157 }, BAY = 22, EYE = 7;
const bump = (z, c, h) => { const t = clamp((z - c) / h, -1, 1), k = Math.cos(t * Math.PI / 2); return k * k; };
// the petal road swings right round the fountain and is otherwise dead straight; the camera does not ride it everywhere:
// it lifts and leans left in the passage, takes the patio wide and high along the right arcade (road and fountain below
// on the left), cuts back over the road to the kitchen door, swings right to the pots, and drifts left past the rocking chair
const pathX = (z) => 17 * bump(z, -135, 50);
const camX = (z) => -2.4 * bump(z, -44, 34) + 27 * bump(z, -132, 54) + 7.4 * smoothstep(-200, -220, z) * smoothstep(-258, -239, z) - 5.4 * bump(z, -294, 24);
const camY = (z) => EYE + 3.4 * bump(z, -46, 36) + 4.4 * bump(z, -130, 56) + 2 * smoothstep(-266, -298, z);   // up over the carpet before the climb
const roadHW = (z) => (z < ZB0 ? lerp(15, 5, smoothstep(0, 42, z + 362)) : lerp(lerp(1.7, 3, smoothstep(6, -6, z - ZP0)), 5, smoothstep(6, -6, z - ZK0)));

// the four looks: blue hour after rain, full moon, windy dawn, still warm dusk
const LOOKS = {
  rain: { zen: '#1a3fa6', hor: '#2d4fae', east: '#0b1230', glow: '#c9577a', glowK: 0.5, stars: 0.7, moon: 0.25, full: 0, key: '#3f62d8', keyK: 0.22, sky: '#3c63d6', skyK: 0.62, amb: 1.0,
    skyGain: 1.9, wet: 1, wind: 0.06, burn: 0, petal: 0.9, warm: '#ffb45a', fog: '#1c1a4c', fogD: 0.0024, rockets: 0.8, exposure: 1.12, moths: 1, tint: '#fff4ea', shadow: '#0a0f3a',
    side: 1, room: [1.0, 1.0, 1.0], back: '#3f62d8', backK: 0.1, winK: 0, shaft: 0, wetIn: 0.92, blaze: 0.85 },
  moon: { zen: '#0c1a52', hor: '#16286c', east: '#060a22', glow: '#30407a', glowK: 0.25, stars: 1, moon: 1.6, full: 1, key: '#aebfff', keyK: 3.6, elev: 0.36, sky: '#2c46a8', skyK: 0.5, amb: 0.85,
    skyGain: 1.5, wet: 0.3, wind: 0.04, burn: 0, petal: 1.0, warm: '#ffb04e', fog: '#12143c', fogD: 0.0021, rockets: 1.4, exposure: 1.18, moths: 1.5, tint: '#f4f1ff', shadow: '#080c36',
    side: -1, room: [0.26, 0.32, 0.5], back: '#aebfff', backK: 0.2, winK: 1.2, shaft: 0.33, wetIn: 0.22, blaze: 0.5 },
  dawn: { zen: '#5a6fc0', hor: '#f0a48c', east: '#3a3f8a', glow: '#ffcf8a', glowK: 1.1, stars: 0.12, moon: 0, full: 0, key: '#ff9c8a', keyK: 1.15, sky: '#8b86d0', skyK: 0.7, amb: 1.05,
    skyGain: 1.0, wet: 0.25, wind: 0.4, burn: 0.6, petal: 0.8, warm: '#ffa850', fog: '#4a3a70', fogD: 0.0023, rockets: 0, exposure: 1.05, moths: 0.5, tint: '#fff0ee', shadow: '#1a1240',
    side: -1, room: [1.7, 1.15, 1.1], back: '#ff9c8a', backK: 0.65, winK: 1.3, paneK: 0.36, shaft: 0.42, wetIn: 0.2, blaze: 0.62 },
  dusk: { zen: '#274aa8', hor: '#ff8f3a', east: '#141a52', glow: '#ffae3c', glowK: 1.3, stars: 0.3, moon: 0.2, full: 0, key: '#ff9a3c', keyK: 1.1, sky: '#5a66c8', skyK: 0.62, amb: 1.0,
    skyGain: 1.25, wet: 0.2, wind: 0.0, burn: 0, petal: 0.85, warm: '#ffb252', fog: '#33265e', fogD: 0.0022, rockets: 0.6, exposure: 1.08, moths: 0.8, tint: '#fff2e2', shadow: '#150f3c',
    side: 1, room: [1.3, 1.0, 0.78], back: '#ff9a3c', backK: 0.3, winK: 1.3, paneK: 0.45, shaft: 0.45, wetIn: 0.2, blaze: 0.8 },
};

// ---------------------------------------------------------------- GLSL shared by the house shaders
const PATH_GLSL = /* glsl */`
#define TREE_X ${TREE.x.toFixed(1)}
#define TREE_Z ${TREE.z.toFixed(1)}
float bumpf(float z, float c, float h){ float t = clamp((z - c) / h, -1., 1.); float k = cos(t * 1.5707963); return k * k; }
float pathX(float z){ return 17. * bumpf(z, -135., 50.); }
// the camera's own line from the kitchen on (the rare gust rides it)
float camX(float z){ return 7.4 * (1. - smoothstep(-220., -200., z)) * smoothstep(-258., -239., z) - 5.4 * bumpf(z, -294., 24.); }
float camY(float z){ return 7. + 2. * (1. - smoothstep(-298., -266., z)); }
float roadHW(float z){
  float a = mix(1.7, 3., 1. - smoothstep(-86., -74., z)); a = mix(a, 5., 1. - smoothstep(-196., -184., z));
  return z < -260. ? mix(15., 5., smoothstep(0., 42., z + 362.)) : a; }
float openAt(vec3 p){
  float inP = step(p.z, -81.9) * step(-188.1, p.z);
  float o = inP * mix(1., 0.38, smoothstep(33., 37., abs(p.x)));
  float dz = min(abs(p.z + 80.), abs(p.z + 190.));
  o = max(o, 0.6 * exp(-dz / 12.) * (1. - smoothstep(8., 20., abs(p.x))));
  return max(o, 0.13); }
// petal-road light on a surface point (the road glows on its own account)
float roadLight(vec3 p, vec3 n){
  float hw = roadHW(p.z); float dx = max(abs(p.x - pathX(p.z)) - hw, 0.);
  float d = sqrt(dx * dx + p.y * p.y) / 5.;
  float e = sqrt(hw / 3.) / (1. + d * sqrt(d) * 1.05);
  return e * mix(0.5, 1.2, 0.5 - 0.5 * n.y) * (1. - smoothstep(-372., -362., p.z) * 0.6); }
// the altar's blaze as one big soft light in the best room, spilling through the door
float blazeLight(vec3 p, vec3 n){
  vec3 L = vec3(0., 15., -372.) - p; float d = length(L); L /= max(d, 1e-3);
  float m = p.z < -260. ? 1. : (1. - smoothstep(6., 9. + (p.z + 260.) * 0.12, abs(p.x))) * exp(-(p.z + 260.) / 70.);
  return m * (0.3 + 0.7 * clamp(dot(n, L) * 0.6 + 0.4, 0., 1.)) / (1. + d * d / 2200.); }
// the charcoal along the bench stove as one soft line of light for the kitchen's ceiling timber, 26 to 28 m over it
float stoveLight(vec3 p, vec3 n){
  vec3 L = vec3(17., 4., clamp(p.z, -247., -205.)) - p; float d = length(L); L /= max(d, 1e-3);
  return (0.3 + 0.7 * clamp(dot(n, L) * 0.6 + 0.4, 0., 1.)) / (1. + d * d / 2200.); }
// what the hour does indoors: uRoom tints and scales the sky ambient under a roof, uBackCol comes in at the street door
uniform vec3 uRoom, uBackCol, uWinCol; uniform float uSide;
vec3 roomAmb(float open){ return mix(uRoom, vec3(1.), smoothstep(0.13, 0.38, open)); }
float backLight(vec3 p, vec3 n){ return smoothstep(-82., -76., p.z) * (0.3 + 0.7 * max(n.z, 0.)) * exp(-(30. - p.z) / 75.); }
// hard key light (moon / low sun) from the left and a little ahead; a shadow falls KSH metres across the floor per metre of height
uniform vec2 uKsh;
#define KSH uKsh
const vec2 KSHW = vec2(1.256, 0.256);   // the window shaft keeps one slope so it matches its dusty sheets
// 1 where a ray that crosses an arcade's column line at height y, position z passes through an arch
float arcadeOpen(float y, float z){
  float c = abs(fract((-82. - z) / 21.2) - 0.5) * 21.2;
  return smoothstep(0., 0.8, 8.9 - c) * smoothstep(0., 0.8, 12.5 + sqrt(max(82.8 - c * c, 0.)) - y); }
float keyShade(vec3 p){
  if (p.z > -81.9 || p.z < -188.1) return 0.;
  p.x *= uSide;      // the light comes from -x here; the house is mirror-symmetric apart from the tree
  float lit = step(26.2, p.y);
  // through the left arcade's arches (pools of light and long column shadows on the open floor) or over its roof
  if (p.x > -36.) { float h = (p.x + 36.) / KSH.x;
    lit = max(lit, max(arcadeOpen(p.y + h, p.z - h * KSH.y), smoothstep(0., 1.5, p.y + (p.x + 48.) / KSH.x - 34.5))); }
  // into the right arcade: arch-shaped pools on its floor and back wall
  if (p.x > 36. && p.y < 26.) { float h = (p.x - 36.) / KSH.x; lit *= arcadeOpen(p.y + h, p.z - h * KSH.y); }
  lit *= smoothstep(-0.6, 0.6, (p.z + 188.) - (36. - p.y) * KSH.y);
  // the fountain: upper bowl, basin rim, stem and finial
  vec2 d = p.xz - vec2(0., -135.);
  float sh = (1. - smoothstep(4.2, 5.6, length(d - KSH * max(8.5 - p.y, 0.)))) * step(p.y, 8.3);
  sh = max(sh, (1. - smoothstep(9.2, 10.4, length(d - KSH * max(3. - p.y, 0.)))) * step(p.y, 2.6));
  float al = dot(d, vec2(0.98, 0.2)), ac = abs(dot(d, vec2(-0.2, 0.98)));
  sh = max(sh, step(0., al) * (1. - smoothstep(11.6, 12.4, al / length(KSH) + p.y)) * (1. - smoothstep(0.7, 1.5, ac)));
  lit *= 1. - 0.9 * sh;
  // the tree: a dappled crown and its trunk
  vec2 t = p.xz - vec2(TREE_X * uSide, TREE_Z); vec2 tc = t - KSH * (25. - p.y);
  float tr = length(vec2(dot(tc, vec2(0.98, 0.2)) / 17.5, dot(tc, vec2(-0.2, 0.98)) / 13.)) + 0.2 * sin(p.x * 0.9 + p.z * 0.35) * sin(p.z * 0.8 - p.x * 0.3) + 0.1 * sin(p.x * 2.3 + 1.) * sin(p.z * 2.1);
  float ts = (1. - smoothstep(0.78, 1.05, tr)) * step(p.y, 14.);
  float al2 = dot(t, vec2(0.98, 0.2)), ac2 = abs(dot(t, vec2(-0.2, 0.98)));
  ts = max(ts, step(0., al2) * step(al2 / length(KSH) + p.y, 16.) * (1. - smoothstep(1.2, 2.2, ac2)));
  lit *= 1. - 0.85 * ts;
  return lit; }
// the key light through the best room's left window (x = -30, z -322 +- 3.2, y 9..30): a long slatted patch on the floor
float winLight(vec3 p){
  p.x *= uSide;
  if (p.z > -262. || p.x < -29.8) return 0.;
  float h = (p.x + 30.) / KSHW.x; float y = p.y + h, z = p.z - h * KSHW.y + 322.;
  float m = smoothstep(0., 0.5, 3.2 - abs(z)) * smoothstep(0., 0.6, y - 9.) * smoothstep(0., 0.6, 30. - y);
  float slat = 0.5 + 0.5 * smoothstep(0.16, 0.4, abs(fract(y / 1.9) - 0.5));
  return m * slat * smoothstep(0.06, 0.3, abs(z)) * smoothstep(0.15, 0.45, abs(y - 19.5)); }
`;

// ---------------------------------------------------------------- the house shell material
// attributes from heroKit.makeBatch: aCol, aAux = (baked candle glow, emissive, gloss, material id)
// ids: 0 limewash, 1 herringbone clay floor, 2 flagstones, 3 painted wall tiles, 4 wood, 5 square clay tiles,
//      6 roof tiles, 7 stone, 8 limewash with blue dado, 9 limewash with terracotta dado
function houseMaterial(U, HU) {
  return K.shader(U, {
    uniforms: HU,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec3 aCol; attribute vec4 aAux; varying vec3 vCol, vN, vL, vW; varying vec4 vAux;
      void main(){ vCol = aCol; vAux = aAux; vL = position; vec3 P = position;
        vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${K.V_WORLD} }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + PATH_GLSL + /* glsl */`
      uniform vec3 uDadoA, uDadoB, uTileBlue, uTileYel, uTileWhite, uMoss, uKeyDir, uKeyCol, uPathCol, uBlazeCol, uReflZen, uReflHor;
      uniform float uWet, uWetIn, uPathGain, uWinK;
      varying vec3 vCol, vN, vL, vW; varying vec4 vAux;
      float herring(vec2 p, out vec2 id){
        vec2 c = floor(p), f = fract(p); float k = mod(c.x - c.y, 4.);
        float l = f.x, r = 1. - f.x, b = f.y, t = 1. - f.y, e;
        if (k < 0.5) { e = min(l, min(b, t)); id = c; }
        else if (k < 1.5) { e = min(r, min(b, t)); id = c - vec2(1., 0.); }
        else if (k < 2.5) { e = min(min(l, r), t); id = c + vec2(0.37, 0.); }
        else { e = min(min(l, r), b); id = c + vec2(0.37, 1.); }
        return e; }
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float id = vAux.w, gloss = vAux.z;
        vec2 fl = vW.xz, wl = abs(n.x) > 0.6 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
        float aaF = fwidth(fl.x) + fwidth(fl.y), aaW = fwidth(wl.x) + fwidth(wl.y);
        vec2 lw = abs(n.y) > 0.6 ? fl : wl;      // noise in the surface's own plane (sheared coordinates drew a diagonal hatch on the walls)
        float n1 = vnoise(lw * 0.23 + 3.7), n2 = vnoise(lw * 1.7 + 11.), n3 = vnoise(lw * 6.1);
        vec3 alb = vCol; float grout = 0., wetK = 0.;
        if (id < 0.5 || id > 7.5) {
          if (id > 7.5) {
            vec3 dd = id > 8.5 ? uDadoB : uDadoA; float y = vW.y + 0.25 * sin(wl.x * 0.9) * 0.;
            float band = step(y, 8.6) * step(8.0, y);
            float inD = step(y, 8.0);
            float dq = abs(fract(wl.x / 2.6) - 0.5) * 2. + abs((y - 6.3) / 0.85);
            float sten = (step(dq, 1.) - step(dq, 0.62)) + step(abs(y - 4.9), 0.11) + step(dq, 0.22);
            float brush = vnoise(vec2(wl.x * 0.35, y * 1.6)) * 0.5 + vnoise(vec2(wl.x * 2.1, y * 0.25)) * 0.5;
            dd *= 0.62 + 0.55 * brush;
            dd = mix(dd, (id > 8.5 ? uTileBlue * 0.9 : uTileYel * 0.7), sten * 0.75 / (1. + aaW * 2.5));
            alb = mix(alb, dd, inD); alb = mix(alb, uTileYel * 0.55, band);
            alb *= 1. - 0.25 * (1. - smoothstep(0., 2.2, y)) * (0.5 + 0.5 * n2);
          }
          float streak = vnoise(vec2(wl.x * 0.9, wl.y * 0.08));
          alb *= 0.74 + 0.3 * n1 + 0.16 * n2 + 0.08 * n3 - 0.12 * streak;
          alb = mix(alb, alb * vec3(1.15, 1.02, 0.9), smoothstep(0.55, 0.9, vnoise(wl * 0.11 + 7.)) * 0.5);
        } else if (id < 1.5) {
          vec2 tid; float e = herring(fl / 2., tid); float h = hash21(tid);
          grout = (1. - smoothstep(0.03, 0.03 + aaF * 0.8, e)) / (1. + aaF * 5.);
          alb *= 0.72 + 0.42 * h + 0.14 * n3; alb = mix(alb, alb * vec3(0.7, 0.62, 0.7), step(0.86, h));
          alb = mix(alb, vec3(0.05, 0.035, 0.04), grout * 0.8); wetK = 1.;
        } else if (id < 2.5) {
          vec2 q = fl / vec2(5.2, 3.6); float row = floor(q.y); q.x += hash21(vec2(row, 3.)) * 0.8 + row * 0.37;
          vec2 c = floor(q), f = fract(q); float w = 0.7 + 0.3 * hash21(c + 11.);
          float e = min(min(f.x, 1. - f.x) * 5.2, min(f.y, 1. - f.y) * 3.6) + (n2 - 0.5) * 0.25; float h = hash21(c);
          grout = (1. - smoothstep(0.14, 0.3 + aaF * 0.8, e)) / (1. + aaF * 2.);
          alb *= (0.45 + 0.7 * h * w) * (0.78 + 0.34 * n1 + 0.14 * n3);
          alb = mix(alb, uMoss * (0.3 + 0.6 * n2), grout * 0.92 + 0.4 * smoothstep(0.55, 0.85, n1) * (1. - grout));
          wetK = 1.;
        } else if (id < 3.5) {
          vec2 q = wl / 4.; vec2 c = floor(q), t = fract(q) - 0.5; float odd = mod(c.x + c.y, 2.);
          float r = length(t); float a = r > 1e-3 ? atan(t.y, t.x) : 0.;
          vec3 col = uTileWhite * (0.9 + 0.1 * n2);
          if (vW.y < 20.) {
            if (odd < 0.5) { float st = 0.37 * (0.58 + 0.42 * cos(a * 4.)); col = mix(col, uTileBlue, step(r, st)); col = mix(col, uTileWhite, step(r, st - 0.07) * step(0.16, r)); col = mix(col, uTileYel, step(r, 0.11)); }
            else { float d = abs(t.x) + abs(t.y); col = mix(col, uTileBlue, step(d, 0.36)); col = mix(col, uTileYel, step(d, 0.24)); col = mix(col, uTileBlue, step(d, 0.11)); }
            float cr = length(abs(t) - 0.5); col = mix(col, uTileYel, step(cr, 0.22)); col = mix(col, uTileBlue, step(cr, 0.22) * step(0.15, cr));
            float e = 0.5 - max(abs(t.x), abs(t.y)); col = mix(col, vec3(0.2, 0.2, 0.26), (1. - smoothstep(0.012, 0.012 + aaW * 0.3, e)) / (1. + aaW * 2.));
            alb = col * (0.85 + 0.15 * hash21(c)); gloss = max(gloss, 0.7);
          } else if (vW.y < 22.) { float s = fract(wl.x / 2.); alb = mix(uTileBlue, uTileYel, step(0.5, s) * step(vW.y, 21.4) * step(20.6, vW.y)); gloss = max(gloss, 0.5); }
          else alb *= 0.76 + 0.3 * n1 + 0.14 * n2;
        } else if (id < 4.5) {
          float g = vnoise(vec2(vW.x * 0.35 + vW.z * 0.35, (vW.y * 1.3 + vW.z + vW.x) * 4.));
          alb *= 0.6 + 0.5 * g + 0.2 * n3;
        } else if (id < 5.5) {
          vec2 q = fl / 3.2; vec2 c = floor(q), f = fract(q); float e = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)); float h = hash21(c);
          vec2 k = abs(f - 0.5); float ins = step(0.84, k.x + k.y);
          grout = (1. - smoothstep(0.018, 0.018 + aaF * 0.4, e)) / (1. + aaF * 3.);
          alb *= 0.74 + 0.36 * h + 0.14 * n3; alb = mix(alb, uTileBlue * (0.6 + 0.5 * h), ins);
          alb = mix(alb, vec3(0.06, 0.04, 0.05), grout * 0.8); wetK = 1.;
        } else if (id < 6.5) {
          vec2 q = vec2(abs(n.x) > 0.25 ? vW.z : vW.x, vW.y * 2.4 + abs(vW.x) * 0.9) / vec2(1.7, 2.6); q.x += 0.5 * mod(floor(q.y), 2.);
          vec2 c = floor(q), f = fract(q); float rnd = sqrt(max(1. - (2. * f.x - 1.) * (2. * f.x - 1.), 0.));
          alb *= (0.45 + 0.6 * rnd) * (0.55 + 0.45 * f.y) * (0.75 + 0.45 * hash21(c)) / (1. + min(aaW, 4.) * 0.6) + min(aaW, 2.) * 0.12;
        } else {
          float sp = vnoise(vW.xy * 3.1 + vW.z * 2.7);
          alb *= 0.7 + 0.28 * n1 + 0.22 * sp + 0.1 * n3;
          if (abs(n.y) < 0.5) { float row = floor(vW.y / 3.); float dy = (0.5 - abs(fract(vW.y / 3.) - 0.5)) * 3.;
            float xx = wl.x / 4.6 + 0.5 * mod(row, 2.); float dx = (0.5 - abs(fract(xx) - 0.5)) * 4.6;
            float jt = 1. - smoothstep(0.03, 0.1 + aaW, min(dx, dy)); alb *= (1. - 0.5 * jt / (1. + aaW * 3.)) * (0.86 + 0.28 * hash21(vec2(floor(xx), row))); }
        }
        float open = openAt(vW), up = n.y * 0.5 + 0.5;
        vec3 light = uSky * uAmb * roomAmb(open) * (0.25 + 0.75 * up) * mix(1.1, 1.25, open) + uGround * (0.2 + 0.55 * (1. - up));
        light += uWarm * vAux.x * flick(vL);
        light += uPathCol * roadLight(vW, n) * uPathGain * (0.92 + 0.08 * flick(vL * 0.3));
        float bz = blazeLight(vW, n);
        // the best room's side walls take a warm wash from the altar, strongest low and near the blaze
        if (vW.z < -262. && abs(n.x) > 0.6) bz += (0.2 + 0.8 * smoothstep(-268., -350., vW.z)) * exp(-max(vW.y - 7., 0.) / 27.) * 0.72;
        light += uBlazeCol * bz * (0.9 + 0.1 * flick(vec3(3., 2., 1.)));
        // the kitchen's cross beams and the ceiling between them take the stove's glow from below by the altar blaze's own law, in the blaze's
        // own colour and hour strength, at 0.9: the beam right over the stove never takes more light than the best room's brightest beam takes
        // by the altar, in any of the four hours, at any flicker. No blue is added: the hour's blue reaches this timber only by the ambient
        // line above. The walls take none of it and stay dark at the beams. (The baked candle glow ends 20 m from a flame, so this timber drew black.)
        if (vW.y > 29.5 && vW.z < -191.9 && vW.z > -258.1 && ((id > 3.5 && id < 4.5) || (id < 0.5 && n.y < -0.5))) light += uBlazeCol * stoveLight(vW, n) * 0.9 * (0.9 + 0.1 * flick(vec3(17., 4., -226.)));
        light += uKeyCol * max(dot(n, uKeyDir), 0.) * (keyShade(vW) * open + winLight(vW) * uWinK);
        light += uBackCol * backLight(vW, n);
        vec3 col = alb * light + vCol * vAux.y;
        if (wetK > 0.5 && n.y > 0.8) {
          float pud = open > 0.5 ? smoothstep(0.42, 0.62, vnoise(fl * 0.055) + 0.3 * vnoise(fl * 0.19)) : uWetIn;
          float gl = uWet * gloss * (0.3 + 0.7 * pud) * (1. - grout * 0.6);
          vec3 R = reflect(-V, normalize(n + vec3(n2 - 0.5, 0., n3 - 0.5) * 0.05 * (1. - pud * 0.8)));
          float fr = 1. - max(V.y, 0.); fr = 0.06 + 0.94 * fr * fr * fr * fr;
          vec3 skyR = mix(uReflHor, uReflZen, clamp(R.y, 0., 1.)) * open;
          vec3 Lb = normalize(vec3(0., 16., -372.) - vW); float sb = max(dot(R, Lb), 0.); sb *= sb; sb *= sb; sb *= sb; sb *= sb;
          float axis = 1. - smoothstep(3., 13., abs(vW.x - pathX(vW.z) * 0.3));
          col = col * (1. - 0.6 * gl) + gl * (fr * skyR * 1.3 + uBlazeCol * sb * axis * 2.2 * (0.4 + 0.6 * fr));
          // the altar mirrored in the wet tiles of the best room: rows of flame, the petal aisle, the lit arch
          if (vW.z < -262. && R.z < -0.05) {
            float tt = (-368. - vW.z) / R.z; vec2 hp = vec2(vW.x + R.x * tt, R.y * tt) + (vec2(n2, n3) - 0.5) * (0.6 + tt * 0.035);
            float hw = 22. - hp.y / 3., ax = abs(hp.x);
            float rows = (0.35 + 0.65 * smoothstep(0.25, 0.0, abs(fract(hp.y / 3.) - 0.72))) * (0.75 + 0.25 * sin(hp.x * 5.2));
            float tiers = step(ax, hw) * step(7.4, ax) * step(0.4, hp.y) * step(hp.y, 21.5) * rows;
            float aisle = step(ax, 7.) * step(0., hp.y) * step(hp.y, 21.5) * 0.55;
            float bow = step(21.5, hp.y) * (1. - smoothstep(9.5, 10.8, length(vec2(hp.x, max(hp.y - 31., 0.))))) * step(ax, 10.6) * 0.8;
            col += gl * (0.25 + 0.75 * fr) * (uWarm * tiers * 1.25 + uPathCol * aisle * uPathGain + uWarm * bow) * (1. - smoothstep(60., 130., tt));
          }
        } else if (gloss > 0.01) {
          vec3 R = reflect(-V, n); float fr = 1. - max(dot(n, V), 0.); fr = fr * fr * fr;
          vec3 Lb = normalize(vec3(pathX(vW.z), 2., vW.z - 14.) - vW); float sb = max(dot(R, Lb), 0.); sb *= sb; sb *= sb; sb *= sb;
          col += gloss * (uPathCol * sb * 0.5 * uPathGain + uSky * fr * 0.5 * open + uWarm * fr * vAux.x * 0.6);
        }
        gl_FragColor = vec4(clamp(col, 0., 40.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// props: vertex colour, baked candle glow, emissive, gloss; aAux.w = 0 still, (0, 1] sways (hanging things, leaves),
// > 1 rattles (pot lids). gloss >= 2 marks the dog and cat: dark hide with a gold rim from the candles behind.
function propMaterial(U, HU) {
  return K.shader(U, {
    uniforms: HU, side: THREE.DoubleSide,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec3 aCol; attribute vec4 aAux; uniform float uTime, uWind;
      varying vec3 vCol, vN, vL, vW; varying vec4 vAux;
      void main(){ vCol = aCol; vAux = aAux; vec3 P = position; float k = aAux.w;
        if (k > 1.) { float ph = k * 37.; float jb = max(sin(uTime * 9. + ph) * sin(uTime * 2.1 + ph * 1.7), 0.); P.y += jb * (0.42 + 0.16 * sin(P.z * 1.3 + ph)); P.x += sin(uTime * 13. + ph) * 0.04; }
        else if (k > 0.) { float ph = P.x * 0.21 + P.z * 0.17 + P.y * 0.05;
          P.xz += vec2(sin(uTime * (1.1 + uWind * 2.) + ph), cos(uTime * 0.83 + ph * 1.3)) * k * (0.8 + 2.4 * uWind); }
        vL = P; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${K.V_WORLD} }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + PATH_GLSL + /* glsl */`
      uniform vec3 uKeyDir, uKeyCol, uPathCol, uBlazeCol; uniform float uPathGain, uWinK;
      varying vec3 vCol, vN, vL, vW; varying vec4 vAux;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float nz = vnoise(vL.xz * 1.9 + vL.y * 1.3), nz2 = vnoise(vL.xy * 7. + vL.z * 5.);
        vec3 alb = vCol * (0.8 + 0.26 * nz + 0.14 * nz2);
        // the tree's crown (sway id 0.31): small glossy leaves. A leaf-scale pattern tilts the normal and breaks the colour,
        // the outline goes ragged, and the hard key light only silvers the edge instead of flooding the mass
        float leaf = step(abs(vAux.w - 0.31), 0.006), keyK = 1., frl = 1. - abs(dot(n, V));
        if (leaf > 0.5) {
          vec3 lp = vL * 1.5;
          float l1 = vnoise(lp.xz + lp.y * vec2(0.7, -0.6)), l2 = vnoise(lp.xy * 2.3 + lp.z * vec2(1.1, 0.8) + 7.), l3 = vnoise(lp.zy * 4.7 + lp.x * 2.1);
          if (frl > 0.66 && l3 * 0.7 + l1 * 0.5 < (frl - 0.66) * 3.6) discard;
          n = normalize(n + (vec3(l1, l2, l3) - 0.5) * 1.2);
          alb = vCol * (0.4 + 1.1 * l2 * (0.45 + l3));
          keyK = 0.22;
        }
        float creature = step(1.5, vAux.z); float open = openAt(vW), up = n.y * 0.5 + 0.5, gloss = mix(min(vAux.z, 1.), 0.12, creature);
        vec3 light = uSky * uAmb * roomAmb(open) * (0.25 + 0.75 * up) * mix(1.1, 1.25, open) + uGround * (0.2 + 0.55 * (1. - up));
        light += uWarm * vAux.x * flick(vL) + uPathCol * roadLight(vW, n) * uPathGain + uBlazeCol * blazeLight(vW, n);
        light += uKeyCol * keyK * max(dot(n, uKeyDir), 0.) * (keyShade(vW) * open + winLight(vW) * uWinK) + uBackCol * backLight(vW, n);
        vec3 col = alb * light + leaf * uKeyCol * vCol * 0.5 * frl * frl * clamp(dot(n, uKeyDir) + 0.25, 0., 1.);
        vec3 R = reflect(-V, n); float fr = 1. - max(dot(n, V), 0.);
        vec3 Lp = normalize(vec3(pathX(vW.z), 1., vW.z - 6.) - vW); float sp = max(dot(R, Lp), 0.); sp *= sp; sp *= sp; sp *= sp;
        col += gloss * (uPathCol * sp * 0.9 * uPathGain * mix(vec3(1.), vCol * 1.8, 0.6) + uSky * fr * fr * fr * 0.6 * mix(0.4, 1.3, open) + uWarm * vCol * fr * fr * (0.2 + vAux.x));
        if (creature > 0.5) {
          // the dog and the cat: matte slate, no highlights; only a thin gold rim from the candles behind them
          col = vCol * (0.9 + 0.2 * nz) * (uSky * uAmb * (0.4 + 0.8 * up) * mix(0.9, 1.6, open) + uWarm * vAux.x * 0.07 + uKeyCol * max(dot(n, uKeyDir), 0.) * keyShade(vW) * open * 0.45);
          float rim = smoothstep(0.5, 0.95, fr); rim *= rim;
          col += uWarm * (vAux.z - 1.5) * rim * (0.3 + 0.7 * clamp(dot(n, vec3(-0.82, 0.29, -0.5)) * 0.6 + 0.55, 0., 1.)) * 1.25;
        }
        col += vCol * vAux.y * (0.8 + 0.2 * flick(vL * 3.));
        gl_FragColor = vec4(clamp(col, 0., 40.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// the sky over the patio: cobalt gradient, a glow low on the left, stars, moon, slow far-off rockets
function skyMaterial(SU, windowPane = false, paneK = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { ...SU, uPane: { value: windowPane ? 1 : 0 }, uPaneK: { value: paneK } }, depthWrite: windowPane, depthTest: true, side: THREE.DoubleSide, fog: false,
    // one program for the dome and the window panes (uPane picks the vertex path)
    vertexShader: /* glsl */`varying vec3 vDir; varying vec2 vH; uniform float uPane;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vec4 p = projectionMatrix * viewMatrix * w; vH = vec2((w.y - 9.) / 21., (w.z + 322.) / 3.2);
        if (uPane > 0.5) { vDir = w.xyz - cameraPosition; gl_Position = p; }
        else { vDir = position; if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; } }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZen, uHor, uEast, uGlowC, uMoonDir; uniform float uGlowK, uStars, uMoon, uFull, uTime, uRockets, uBurst, uSide, uPane, uPaneK;
      varying vec3 vDir; varying vec2 vH;
      float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      vec3 burst(vec3 d, vec3 c, float age, float size, vec3 tint, float seed){
        vec3 rt = normalize(cross(vec3(0., 1., 0.), c) + vec3(1e-4, 0., 0.)); vec3 upv = cross(c, rt);
        vec2 q = vec2(dot(d, rt), dot(d, upv)) / size; q.y += age * age * 0.28;
        float r = length(q); float a = r > 1e-3 ? atan(q.y, q.x) : 0.;
        float R = 1. - (1. - age) * (1. - age) * (1. - age);
        float ray = 0.5 + 0.5 * cos(a * 16. + seed * 6.); ray *= ray; ray *= ray;
        float ring = exp(-(r - R) * (r - R) * 60.) * (0.35 + 0.9 * ray);
        float trail = exp(-max(R - r, 0.) * 5.) * step(r, R) * ray * 0.5;
        float core = exp(-r * r * 9.) * (1. - age) * (1. - age);
        float fade = (1. - age) * (1. - age) * smoothstep(0., 0.08, age);
        float tw = 0.75 + 0.25 * sin(uTime * 17. + a * 9.);
        return tint * ((ring + trail) * tw * fade * 1.6 + core * 0.8 + exp(-r * r * 1.4) * fade * 0.12) * step(0., dot(d, c));
      }
      void main(){
        vec3 d = normalize(vDir + vec3(0., 1e-5, 0.)); float y = max(d.y, 0.);
        vec3 col = mix(uHor, uZen, pow(y, 0.5));
        float east = clamp(d.x * uSide * 0.5 + 0.5, 0., 1.); col = mix(col, uEast, east * east * 0.8 * (0.35 + 0.65 * y));
        float west = clamp(-d.x * uSide, 0., 1.), low = (1. - y); low *= low; low *= low;
        col += uGlowC * uGlowK * low * low * (0.2 + 0.8 * west * west) * 0.9;
        vec2 sp = d.xz / (0.4 + y) * 22.; vec2 sc = floor(sp), sf = fract(sp) - 0.5; float sh = hash21(sc);
        vec2 so = (vec2(hash21(sc + 3.7), hash21(sc + 9.1)) - 0.5) * 0.6; float sd = length(sf - so);
        col += vec3(0.8, 0.86, 1.) * step(0.9, sh) * (1. - smoothstep(0.03, 0.11, sd)) * uStars * (0.7 + 0.5 * sin(uTime * (1.5 + sh * 3.) + sh * 50.)) * smoothstep(0.08, 0.3, y) * 1.6;
        float md = 1. - dot(d, uMoonDir), mr = mix(0.00035, 0.0011, uFull);
        float disc = 1. - smoothstep(mr * 0.8, mr, md);
        float md2 = 1. - dot(d, normalize(uMoonDir + vec3(0.016, 0.01, 0.)));
        float cres = disc * smoothstep(mr * 0.55, mr * 0.8, md2);
        col += vec3(0.86, 0.9, 1.) * uMoon * (mix(cres, disc, uFull) * 2.2 + exp(-md * 260.) * 0.35 * uFull + exp(-md * 28.) * 0.1 * (0.3 + uFull));
        if (uRockets > 0.01) {
          for (int i = 0; i < 4; i++) {
            float fi = float(i), per = 6.3 + fi * 1.7, tt = uTime / per + fi * 0.31, id = floor(tt), t = fract(tt);
            float az = (hash21(vec2(id, fi)) - 0.5) * 2.6 + 3.14159, el = 0.42 + 0.3 * hash21(vec2(id + 7., fi));
            vec3 c = normalize(vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el)));
            vec3 tint = hash21(vec2(id, fi + 3.)) < 0.6 ? vec3(1., 0.72, 0.3) : vec3(0.95, 0.93, 1.);
            float age = clamp((t - 0.12) / 0.6, 0., 1.);
            col += burst(d, c, age, 0.045 + 0.025 * hash21(vec2(id, fi + 5.)), tint, id) * uRockets * 0.8 * step(0.12, t) * step(t, 0.72);
            vec3 cr = normalize(c - vec3(0., 0.22 * (1. - t / 0.12), 0.)); float dr = 1. - dot(d, cr);
            col += tint * exp(-dr * 60000.) * step(t, 0.12) * uRockets;
          }
          vec3 c2 = normalize(vec3(-0.515, 0.326, -0.793));
          col += burst(d, c2, clamp(uBurst, 0., 1.), 0.085, vec3(1., 0.66, 0.24), 3.) * uRockets * step(0.001, uBurst) * step(uBurst, 0.999) * 0.75;
          col += vec3(1., 0.7, 0.4) * exp(-(1. - dot(d, c2)) * 9.) * 0.1 * uRockets * (1. - uBurst) * step(0.001, uBurst) * smoothstep(0., 0.2, uBurst);
        }
        // a window pane: the sky graded up its height (glow low, zenith high) so it never reads as one flat slab
        if (uPane > 0.5) { float g = clamp(vH.x, 0., 1.); col = mix(col, mix(uHor + uGlowC * uGlowK * 0.3, uZen, g * g * (3. - 2. * g)), 0.7) * uPaneK;
          // dark glazing bars: a mullion, a transom and small panes, so the opening reads as a window at any hour
          float bar = max(step(abs(vH.y), 0.05), step(0.44, abs(fract(vH.x * 6.) - 0.5)));
          bar = max(bar, step(0.43, abs(fract(vH.y * 1.5 + 0.5) - 0.5)));
          col = mix(col, vec3(0.035, 0.022, 0.02), bar); }
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// fountain water: basin surface (rings, sky and flame glints) and falling sheets (uv.y down the fall)
function waterMaterial(U, HU, sheet) {
  return K.shader(U, {
    uniforms: HU, transparent: sheet, depthWrite: !sheet, side: THREE.DoubleSide,
    vertexShader: K.FOG_V + /* glsl */`
      varying vec2 vUv; varying vec3 vN, vL, vW;
      void main(){ vUv = uv; vL = position; vec3 P = position; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${K.V_WORLD} }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + /* glsl */`
      uniform vec3 uReflZen, uReflHor, uPathCol; varying vec2 vUv; varying vec3 vN, vL, vW;
      void main(){
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        ${sheet ? /* glsl */`
        float s = vnoise(vec2(vUv.x * 46., vUv.y * 2.2 - uTime * 2.6)) * 0.6 + vnoise(vec2(vUv.x * 120., vUv.y * 5. - uTime * 4.1)) * 0.4;
        float gap = smoothstep(0.1, 0.55, abs(sin(vUv.x * 37.699)));
        float a = (0.03 + 0.45 * smoothstep(0.45, 0.85, s)) * gap * smoothstep(0., 0.06, vUv.y) * (1. - 0.4 * vUv.y);
        float fr = 1. - abs(dot(normalize(vN), V));
        vec3 col = uReflZen * (0.3 + 0.6 * s) + uReflHor * fr * 0.4 + uWarm * (0.12 + 0.5 * smoothstep(0.7, 0.95, s)) * flick(vL);
        gl_FragColor = vec4(clamp(col, 0., 20.), clamp(a, 0., 1.));` : /* glsl */`
        vec2 p = vL.xz; float r = length(p);
        float h1 = sin(r * 2.1 - uTime * 2.4) * 0.5 + sin((r - 4.2) * 3.3 + uTime * 1.9) * 0.3 * step(r, 5.5);
        float h2 = vnoise(p * 1.3 + uTime * 0.4) - 0.5;
        vec3 n = normalize(vec3((h1 * p.x / max(r, 0.2)) * 0.16 + h2 * 0.2, 1., (h1 * p.y / max(r, 0.2)) * 0.16 + (vnoise(p * 1.3 - uTime * 0.35 + 9.) - 0.5) * 0.2));
        vec3 R = reflect(-V, n); float fr = 1. - max(dot(n, V), 0.); fr = 0.08 + 0.92 * fr * fr * fr;
        vec3 col = vec3(0.012, 0.03, 0.07) + mix(uReflHor, uReflZen, clamp(R.y, 0., 1.)) * fr * 0.85;
        float gl = vnoise(p * 2.6 + R.xz * 5. + uTime * 0.7); gl = smoothstep(0.62, 0.9, gl);
        col += uWarm * gl * 0.55 * flick(vL) + uPathCol * 0.06;
        gl_FragColor = vec4(clamp(col, 0., 20.), 1.);`}
        #include <fog_fragment>
      }`,
  });
}

// wet-floor reflections: one floor-hugging streak per flame, running from its foot towards the eye
function streakMaterial(U, HU) {
  return K.shader(U, {
    uniforms: HU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec4 iPos; varying vec2 vQ; varying float vPh, vK;
      void main(){
        vec3 b = iPos.xyz; vec2 toC = cameraPosition.xz - b.xz; float dist = length(toC); toC /= max(dist, 1e-3);
        vec2 rt = vec2(-toC.y, toC.x);
        float h = max(cameraPosition.y - b.y, 0.5), len = clamp(dist * 0.4, 2.5, 26.) * (0.7 + 0.5 * iPos.w), w = (0.45 + dist * 0.006) * (0.8 + 0.4 * iPos.w);
        vec3 wp = b + vec3(rt.x, 0., rt.y) * position.x * w + vec3(toC.x, 0., toC.y) * (position.y * len + 0.2);
        vQ = position.xy; vPh = iPos.w * 31.; vK = clamp(dist / (h * 5.), 0., 1.);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + /* glsl */`
      uniform float uWet; varying vec2 vQ; varying float vPh, vK;
      void main(){
        float x = abs(vQ.x), y = vQ.y;
        float rip = 0.6 + 0.4 * sin(y * 34. + vPh + sin(uTime * 1.7 + vPh) * 1.5) * sin(y * 13. - uTime * 0.9 + vPh * 2.);
        float a = (1. - smoothstep(0.2, 1., x * (0.6 + rip * 0.6))) * exp(-y * (3.6 - 2.2 * uWet)) * smoothstep(0., 0.04, y) * rip;
        vec3 col = uWarm * a * uWet * (0.25 + 0.75 * vK) * 1.15 * (0.85 + 0.15 * sin(uTime * 3.1 + vPh));
        ${K.FOG_ADD}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// steam, kitchen smoke and incense: camera-facing ribbons; aDim = (height, width, drift speed, warmth)
function steamMaterial(U, HU) {
  return K.shader(U, {
    uniforms: HU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec3 aBase; attribute vec4 aDim; attribute float aPh; uniform float uTime, uWind; uniform vec3 uWindDir;
      varying vec2 vUv; varying float vPh; varying vec4 vDim;
      void main(){
        float h = uv.y, ph = aPh, H = aDim.x;
        vec3 c = aBase + vec3(sin(uTime * 0.5 + ph * 9. + h * 3.) * 0.09 * H * h + sin(uTime * 0.23 + h * 7. + ph) * 0.06 * H * h * h, h * H,
          cos(uTime * 0.4 + ph * 5. + h * 2.6) * 0.07 * H * h) + uWindDir * uWind * h * h * H * 0.55;
        float pot = step(0.55, aDim.w); c.x -= pot * h * h * H * (0.42 + 0.1 * sin(uTime * 0.31 + ph * 20.)); c.y -= pot * h * h * H * 0.3;
        vec3 cw = (modelMatrix * vec4(c, 1.)).xyz;
        vec3 right = normalize(cross(vec3(0., 1., 0.), cameraPosition - cw) + vec3(1e-4, 0., 0.));
        vec3 wp = cw + right * uv.x * aDim.y * (0.25 + 1.3 * h);
        vUv = uv; vPh = ph; vDim = aDim;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + /* glsl */`
      uniform vec3 uViolet; varying vec2 vUv; varying float vPh; varying vec4 vDim;
      void main(){
        float h = vUv.y;
        vec2 q = vec2(vUv.x * 1.1 + vPh * 13., h * 3.6 - uTime * vDim.z + vPh * 7.);
        float n = vnoise(q) * 0.6 + vnoise(q * 2.3 + 3.1) * 0.4;
        float wisp = smoothstep(0.2, 0.8, n + 0.25 * sin(h * 9. - uTime * 0.6 + vUv.x * 3.));
        float a = (1. - smoothstep(0.1, 1., abs(vUv.x))) * smoothstep(0., 0.07, h) * pow(max(1. - h, 0.), 1.2) * (0.3 + 0.7 * wisp) * 0.6;
        float pot = step(0.55, vDim.w); a = min(a * (1. + 0.75 * pot), 0.9);
        vec3 col = mix(uWarm * (0.35 + 0.9 * vDim.w), uViolet * 0.6 + uSky * 0.5 + uWarm * (0.1 * vDim.w + 0.4 * pot), smoothstep(0., 0.6, h));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}

// haze: big soft sheets (incense layers in the best room, a veil in every doorway). aK = (fade-near distance, gain, seed)
function mistMaterial(U, HU) {
  return K.shader(U, {
    uniforms: HU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec3 aK; varying vec2 vUv; varying vec3 vK, vW;
      void main(){ vUv = uv; vK = aK; vec3 P = position; ${K.V_WORLD} }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + /* glsl */`
      uniform vec3 uViolet; varying vec2 vUv; varying vec3 vK, vW;
      void main(){
        vec2 p = vUv * 2. - 1.; float edge = (1. - smoothstep(0.55, 1., abs(p.x))) * (1. - smoothstep(0.5, 1., abs(p.y)));
        vec2 q = vW.xz * 0.035 + vW.y * 0.05 + vK.z * 17.;
        float n = vnoise(q + vec2(uTime * 0.03, uTime * 0.017)) * 0.6 + vnoise(q * 2.7 - uTime * 0.04) * 0.4;
        float near = smoothstep(vK.x * 0.25, vK.x, distance(cameraPosition, vW));
        float a = edge * smoothstep(0.25, 0.85, n) * near * vK.y;
        vec3 col = (uViolet * 0.55 + uWarm * 0.3 * flick(vW * 0.2)) * a;
        ${K.FOG_ADD}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// the shaft of moon or low sun through one of the best room's windows: a stack of faint additive sheets, each a soft bell
// across with no edge, thinning before the floor, dust drifting through it; a sheet fades out as the camera nears it
function shaftMaterial(U) {
  return K.shader(U, {
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: K.FOG_V + /* glsl */`
      attribute float aW; varying vec2 vUv; varying vec3 vW; varying float vWt;
      void main(){ vUv = uv; vWt = aW; vec3 P = position; ${K.V_WORLD} }`,
    fragmentShader: K.FOG_F + K.GLSL_COMMON + /* glsl */`
      uniform vec3 uWinCol; varying vec2 vUv; varying vec3 vW; varying float vWt;
      void main(){
        float ac = clamp(vUv.x, 0., 1.), al = clamp(vUv.y, 0., 1.);
        float across = sin(3.14159 * ac); across *= across;
        float along = smoothstep(0., 0.14, al) * (1. - smoothstep(0.62, 1., al)) * (1. - 0.4 * al);
        vec2 q = vW.xy * 0.15 + vec2(vW.z * 0.13, vWt * 3.);
        float dust = vnoise(q + vec2(uTime * 0.035, -uTime * 0.05)) * 0.6 + vnoise(q * 3.1 - vec2(uTime * 0.06, uTime * 0.02)) * 0.4;
        float fingers = 0.84 + 0.16 * sin(ac * 13. + 2.5 * vnoise(vec2(al * 2.5, vWt * 9.)));
        float near = smoothstep(2.5, 17., distance(cameraPosition, vW));
        vec3 col = uWinCol * across * along * (0.4 + 0.8 * dust) * fingers * near * vWt * 0.062;
        ${K.FOG_ADD}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// moths circling the candle groups (mode 0) and bats or swallows crossing the patio sky (mode 1): flapping instanced wings
function flyerMaterial(U) {
  return K.shader(U, {
    side: THREE.DoubleSide,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec4 iA, iB; attribute vec3 iC; uniform float uTime; varying vec3 vCol; varying float vMode, vSh;
      vec3 orbit(float a, float ph, float mode){
        if (mode < 0.5) return iA.xyz + vec3(cos(a), 0.45 * sin(a * 1.7 + ph * 6.), sin(a)) * iA.w * (0.75 + 0.25 * sin(a * 0.37 + ph * 3.));
        return iA.xyz + vec3(sin(a) * iA.w, 5. * sin(a * 2.3 + ph * 5.), sin(a * 0.63 + ph * 4.) * iA.w * 1.1); }
      void main(){
        float ph = iB.y, mode = iB.w, a = uTime * iB.x + ph * 6.2832;
        vec3 c = orbit(a, ph, mode), fwd = normalize(orbit(a + 0.06, ph, mode) - c + vec3(1e-4, 0., 1e-5));
        vec3 rt = normalize(cross(fwd, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), upv = cross(rt, fwd);
        float fl = sin(uTime * (mode < 0.5 ? 19. : 9.) + ph * 40.) * (mode < 0.5 ? 1.0 : 0.75);
        vec3 l = position * iB.z;
        vec3 P = c + rt * l.x * cos(fl) + upv * (abs(l.x) * sin(fl) + l.y) + fwd * l.z;
        vCol = iC; vMode = mode; vSh = 0.7 + 0.3 * abs(position.x);
        vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: K.FOG_F + /* glsl */`
      uniform vec3 uSky, uWarm; uniform float uAmb; varying vec3 vCol; varying float vMode, vSh;
      void main(){
        vec3 col = vMode < 0.5 ? vCol * vSh * (uWarm * 1.05 + uSky * 0.35) : vCol * uSky * uAmb * 0.35;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// the rare event: the whole road lifts into one ribbon of glowing petals that streams past on both sides and into the arch
function gustMaterial(U, GU) {
  return K.shader(U, {
    uniforms: GU, side: THREE.DoubleSide,
    vertexShader: K.FOG_V + PATH_GLSL + /* glsl */`
      attribute vec4 iA, iB; uniform float uTime, uCamZ, uGustK; varying vec3 vCol; varying vec2 vQ; varying float vShade;
      void main(){
        float ph = iA.w, sp = fract(iA.x + uTime * (0.08 + 0.05 * fract(ph * 7.3)));
        float z = uCamZ + 30. - sp * 200., side = sign(iA.y);
        float climb = max(-320.9 - z, 0.) * 0.3443;
        float squeeze = mix(0.3, 1., smoothstep(-386., -305., z));
        // two streams, one either side of the path, weaving a little and closing on the arch
        float weave = sin(z * 0.055 + uTime * 0.8 + side * 1.3) * 1.3, wob = sin(z * 0.13 + ph * 30. + uTime * 0.9), wob2 = cos(z * 0.09 + ph * 17. - uTime * 0.6);
        vec3 c = vec3(camX(z) + (iA.y + weave + wob * 0.5) * squeeze, camY(z) - 0.4 + climb + 2.6 * (1. - smoothstep(-322., -274., z)) + (iA.z + wob2 * 0.5 + 0.8 * sin(z * 0.04 + side * 2.)) * mix(0.55, 1., squeeze), z);
        float lift = smoothstep(0., 1., uGustK * 1.6 - fract(ph * 3.1) * 0.6);
        c.y = mix(0.3, c.y, lift);
        float size = iB.w * lift * step(-386.5, z) * smoothstep(0., 0.04, sp) * (1. - smoothstep(0.94, 1., sp));
        vec3 l = position * size; l.y += (position.x * position.x * 1.1 + position.z * position.z * 0.18) * size;      // cupped and curled
        float tilt = uTime * (2. + 3. * fract(ph * 5.1)) + ph * 40., yaw = uTime * 1.7 + ph * 20.;
        float cs = cos(tilt), sn = sin(tilt); l = vec3(l.x, l.y * cs - l.z * sn, l.y * sn + l.z * cs);
        cs = cos(yaw); sn = sin(yaw); l = vec3(l.x * cs + l.z * sn, l.y, -l.x * sn + l.z * cs);
        vCol = iB.rgb; vQ = position.xz; vShade = 0.8 + 0.25 * sn;
        vec4 mvPosition = viewMatrix * vec4(c + l, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: K.FOG_F + /* glsl */`
      uniform vec3 uSky; uniform float uPetal; varying vec3 vCol; varying vec2 vQ; varying float vShade;
      void main(){
        float z = vQ.y, x = vQ.x;
        float w = 0.58 * sqrt(max(1. - z * z, 0.)) * (0.72 + 0.28 * z);      // a petal: narrow claw, broad ruffled lip
        w *= 1. - 0.12 * step(0.3, z) * abs(sin(x * 14.));
        if (abs(x) > w) discard;
        vec3 col = mix(vCol * vec3(0.72, 0.42, 0.3), vCol * vec3(1.12, 1.02, 0.78), smoothstep(-0.8, 0.75, z));
        col *= (1. - 0.3 * exp(-x * x * 40.)) * vShade * (uPetal * 1.25 + 0.3);
        gl_FragColor = vec4(col + uSky * 0.05, 1.);
        #include <fog_fragment>
      }`,
  });
}

// small bright things as camera-facing quads: iB.w = 0 charcoal spark, 1 drip, 2 lantern glow, 3 drifting mote
function sparkleMaterial(U) {
  return K.shader(U, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: K.FOG_V + /* glsl */`
      attribute vec4 iA, iB; attribute vec3 iC; uniform float uTime, uWind; varying vec2 vQ; varying vec3 vCol; varying float vKind, vPh;
      void main(){
        float ph = iB.y, kind = iB.w, t = fract(uTime * iB.x + ph), size = iB.z; vec3 c = iA.xyz; vec2 st = vec2(1.);
        if (kind < 0.5) { c += vec3(sin(t * 9. + ph * 20.) * 0.12, 1., cos(t * 7. + ph * 31.) * 0.1) * t * iA.w; size *= (1. - t) * smoothstep(0., 0.05, t); }
        else if (kind < 1.5) { c.y -= t * t * iA.w; st = vec2(0.5, 2. + 7. * t); size *= step(t, 0.97); }
        else if (kind < 2.5) { c.xz += vec2(sin(uTime * 1.1 + ph * 9.), cos(uTime * 0.9 + ph * 7.)) * iA.w * (0.25 + uWind); size *= 0.86 + 0.14 * sin(uTime * 5.3 + ph * 30.) * sin(uTime * 2.1 + ph * 11.); }
        else { c += vec3(sin(uTime * 0.21 + ph * 9.), sin(uTime * 0.16 + ph * 5.) * 0.4, cos(uTime * 0.18 + ph * 13.)) * iA.w; size *= 0.6 + 0.4 * sin(uTime * 1.3 + ph * 40.); }
        vec3 rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), upv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        if (kind > 0.5 && kind < 1.5) upv = vec3(0., 1., 0.);
        vec3 P = c + (rt * position.x * st.x + upv * position.y * st.y) * size;
        vQ = position.xy; vCol = iC; vKind = kind; vPh = ph;
        vec4 mvPosition = viewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: K.FOG_F + /* glsl */`
      varying vec2 vQ; varying vec3 vCol; varying float vKind, vPh;
      void main(){
        float r2 = dot(vQ, vQ); float a = exp(-r2 * 5.) * (1. - smoothstep(0.7, 1., r2));
        if (vKind > 1.5 && vKind < 2.5) { float cr = exp(-abs(vQ.x) * 14.) * exp(-abs(vQ.y) * 2.6) + exp(-abs(vQ.y) * 14.) * exp(-abs(vQ.x) * 2.6); a = a * 0.55 + exp(-r2 * 40.) * 1.2 + cr * 0.35; }
        vec3 col = vCol * a;
        ${K.FOG_ADD}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// ---------------------------------------------------------------- small geometry helpers
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// tessellated parallelogram: origin o, edges ux and uy (normal = ux x uy), at most `edge` metres between vertices
function quadGeo(o, ux, uy, edge = 5) {
  const lu = ux.length(), lv = uy.length(), nu = Math.max(1, Math.ceil(lu / edge)), nv = Math.max(1, Math.ceil(lv / edge));
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(o.x + ux.x * i / nu + uy.x * j / nv, o.y + ux.y * i / nu + uy.y * j / nv, o.z + ux.z * i / nu + uy.z * j / nv);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
// grid from a function (a, b in 0..1) -> [x, y, z]
function fnGeo(nu, nv, fn, flip = false) {
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const r = fn(i / nu, j / nv); P.push(r[0], r[1], r[2]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (flip) I.push(a, c, b, b, c, d); else I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
const I4 = new THREE.Matrix4();

export default {
  id: 'marigold-way-home',
  name: 'The Marigold Way Home',
  category: 'domestic',
  weirdness: 0.15,
  media: ['interior'],
  async build(ctx) {
    const rng = ctx.rng.fork('marigold-house'), detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || {}, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const seedN = Math.abs(Math.floor(Number(ctx.seed) || 0));
    const lookName = vary.hour === 'dawn' ? 'dawn' : vary.hour === 'night' ? 'moon' : vary.hour === 'golden' ? 'dusk' : ['moon', 'rain', 'dawn', 'dusk', 'moon', 'rain', 'dawn'][seedN % 7];
    const L = LOOKS[lookName];
    const cast = { orangeTree: rng.chance(0.4), dogPair: rng.chance(0.35), catFar: rng.chance(0.5), flagScheme: rng.int(0, 2), swallows: lookName === 'dusk' || lookName === 'dawn' };
    const hex = K.hex, mixc = K.mixc, M = K.M, lathe = K.lathe;
    const pal = { indigo: hex(PALETTE[0]), cobalt: hex(PALETTE[1]), orange: hex(PALETTE[2]), gold: hex(PALETTE[3]), violet: hex(PALETTE[4]), magenta: hex(PALETTE[5]), terra: hex(PALETTE[6]) };
    pal.deep = mixc(pal.orange, pal.terra, 0.6);
    const marigold = () => (rng() < 0.28 ? mixc(pal.gold, pal.orange, rng.range(0, 0.35)) : mixc(pal.orange, pal.deep, rng.range(0, 0.45))).multiplyScalar(rng.range(0.8, 1.05));

    const scene = new THREE.Scene();
    const fogC = hex(L.fog);
    scene.fog = new THREE.FogExp2(fogC, L.fogD);
    scene.background = fogC.clone().multiplyScalar(0.5);
    await ctx.yield();

    // ---- the hero: altar, bower, carpet and the road stub back to the best-room door
    const hero = await buildHero(ctx, { palette: PALETTE, road: 102, roadWidth: 10, wall: { width: BW * 2, height: BH }, burn: L.burn });
    hero.object.position.set(0, 0, HERO_Z); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const U = hero.uniforms;
    const skyC = hex(L.sky).multiplyScalar(L.skyK), warmC = hex(L.warm);
    hero.setLight({ sky: skyC, warm: warmC, ambient: L.amb, petal: L.petal, flame: 1 - 0.1 * L.burn });
    hero.setWind(0.25, -1, L.wind);
    const elev = L.elev || 0.78, keyDir = V3(-0.98 * L.side, elev, -0.2).normalize();   // a low moon throws the arcade's columns right across the floor
    Object.assign(U, {
      uDadoA: { value: mixc(pal.cobalt, hex('#5f86e8'), 0.2).multiplyScalar(0.85) }, uDadoB: { value: pal.terra.clone().multiplyScalar(0.75) },
      uTileBlue: { value: mixc(pal.cobalt, pal.indigo, 0.15) }, uTileYel: { value: mixc(pal.gold, pal.orange, 0.45) }, uTileWhite: { value: hex('#d9d3c4') },
      uMoss: { value: hex('#3d5a2c') }, uKeyDir: { value: keyDir }, uKeyCol: { value: hex(L.key).multiplyScalar(L.keyK) },
      uPathCol: { value: mixc(pal.orange, pal.gold, 0.15).multiplyScalar(1.0) }, uPathGain: { value: 0.95 * L.petal }, uBlazeCol: { value: warmC.clone().multiplyScalar(L.blaze) },
      uReflZen: { value: hex(L.zen).multiplyScalar(0.9) }, uReflHor: { value: mixc(hex(L.hor), hex(L.glow), 0.3).multiplyScalar(0.8) },
      uKsh: { value: new THREE.Vector2(0.98 / elev, 0.2 / elev) }, uSide: { value: L.side }, uWet: { value: L.wet }, uWetIn: { value: L.wetIn }, uWinK: { value: L.winK }, uRoom: { value: V3(L.room[0], L.room[1], L.room[2]) },
      uBackCol: { value: hex(L.back).multiplyScalar(L.backK) }, uWinCol: { value: hex(L.key).multiplyScalar(L.keyK * L.shaft) }, uViolet: { value: pal.violet.clone() }, uCamZ: { value: 0 }, uGustK: { value: 0 },
    });
    const houseMat = houseMaterial(U), propMat = propMaterial(U);
    await ctx.yield();

    // ---- collectors: candles, flower heads, loose petals, streaks, sparkles, steam, flags; baked at the end
    const candles = [], heads = [], loose = [], streaks = [], sparkles = [], steam = [], flagRows = [], moths = [], bigLights = [];
    const WAX = [hex('#efe3c8'), hex('#f3ead6'), hex('#e8c98a'), mixc(pal.orange, hex('#ffffff'), 0.25), mixc(pal.magenta, hex('#ffffff'), 0.2)];
    const GLASSC = [mixc(pal.orange, pal.gold, 0.4), pal.magenta.clone(), mixc(pal.cobalt, hex('#6fa0ff'), 0.4), pal.violet.clone(), pal.orange.clone()];
    function addCandle(x, y, z, kind, hk = 1, streak = true) {
      let r, h, col, fs;
      if (kind === 0) { r = rng.range(0.11, 0.15); h = Math.max(0.45, rng.range(1.3, 2.5) * hk * (1 - 1.15 * L.burn)); col = WAX[rng() < 0.75 ? rng.int(0, 1) : rng.int(2, 4)]; fs = 0.32; }
      else if (kind === 1) { r = rng.range(0.26, 0.4); h = Math.max(0.38, rng.range(0.6, 1.3) * hk * (1 - 0.75 * L.burn)); col = WAX[rng.int(0, 2)]; fs = 0.36; }
      else { r = rng.range(0.28, 0.34); h = rng.range(0.7, 0.85); col = GLASSC[rng() < 0.5 ? 0 : rng.int(0, 4)]; fs = 0.27; }
      const c = { x, y, z, r, h, kind, col, fs: fs * rng.range(0.9, 1.15) * (1 + 0.08 * L.burn), fy: y + (kind === 2 ? h * 0.55 : h + r * 0.5) };
      candles.push(c); if (streak && y < 0.5) streaks.push([x, y + 0.2, z, rng()]);
      return c;
    }
    const addHead = (x, y, z, nx, ny, nz, r, col, em = 0.6, tall = 1) => heads.push({ x, y, z, nx, ny, nz, r, col, em, tall });
    // a jar or bucket of blooms (the vessel goes into the prop batch by the caller): a dark mound of leaves packed with
    // many small pom-pom heads, or (cock) crinkled velvet crests of cockscomb standing out of it
    const leafD = hex('#1d3a24'), cockA = hex('#5a0c2c');
    function bouquet(B, x, y, z, s, n, cock = false) {
      B.add(new THREE.IcosahedronGeometry(1, 1), M(x, y + 0.1 * s, z, 0.86 * s, 0.7 * s, 0.86 * s, rng.range(0, TAU)), (px, py, pz, o) => { o.copy(leafD).multiplyScalar(0.7 + 0.5 * Math.abs(Math.sin(px * 9 + pz * 7 + py * 5))); }, [0, 0.3, 0.12]);
      if (cock) {
        const nc = Math.max(5, Math.round(n * 0.55));
        for (let k = 0; k < nc; k++) {
          const a = rng.range(0, TAU), el = k === 0 ? 1.45 : rng.range(0.45, 1.3), rr = s * rng.range(0.5, 0.8), w = s * rng.range(0.55, 0.8), h = s * rng.range(0.95, 1.35), ph = rng.range(0, 6), col = mixc(pal.magenta, hex('#ff5a8e'), rng.range(0, 0.35));
          const nx = Math.cos(a) * Math.cos(el), ny = Math.sin(el), nz = Math.sin(a) * Math.cos(el);
          // a fan that widens upwards, its lip folded into tight ruffles, standing out of the mound along (nx, ny, nz)
          B.add(fnGeo(14, 4, (u, v) => { const t = u * 2 - 1, wd = w * (0.25 + 0.75 * Math.sqrt(v)), rf = v * v;
            return [t * wd, v * h * (1 - 0.22 * t * t) + 0.1 * s * Math.sin(u * 31 + ph) * rf, (0.2 * Math.sin(u * 23 + ph) * rf + 0.1 * Math.sin(u * 7 + ph * 2) * v) * s]; }),
            M(x + nx * rr, y + ny * rr * 0.9, z + nz * rr, 1, 1, 1, Math.PI / 2 - a + rng.range(-0.5, 0.5), (Math.PI / 2 - el) * 0.8),
            (px, py, pz, o) => { o.copy(cockA).lerp(col, clamp(py / h, 0, 1)).multiplyScalar(0.75 + 0.35 * Math.abs(Math.sin(px * 17 / s + ph))); }, [0.22, 0.12, 0.1]);
        }
        return;
      }
      n = Math.round(n * 2.2);
      for (let k = 0; k < n; k++) {
        const a = rng.range(0, TAU), el = k === 0 ? 1.5 : rng.range(0.1, 1.4), rr = s * (0.6 + 0.45 * Math.sqrt(rng()));
        const nx = Math.cos(a) * Math.cos(el), ny = Math.sin(el), nz = Math.sin(a) * Math.cos(el);
        addHead(x + nx * rr, y + ny * rr * 0.9, z + nz * rr, nx, ny + 0.35, nz, 0.33 * s * rng.range(0.8, 1.2), marigold(), 0.55, 1);
      }
    }
    // a sagging garland of heads between two points
    function garland(a, b, sag, n, r = 0.5) {
      for (let k = 0; k <= n; k++) {
        const t = k / n, s = sag * 4 * t * (1 - t);
        addHead(lerp(a[0], b[0], t) + rng.range(-0.1, 0.1), lerp(a[1], b[1], t) - s + rng.range(-0.08, 0.08), lerp(a[2], b[2], t) + rng.range(-0.1, 0.1), rng.range(-0.4, 0.4), rng.range(-0.2, 0.6), rng.range(-0.4, 0.4) + 0.5, r * rng.range(0.8, 1.2), marigold(), 0.6);
      }
    }
    // lazily built glow bake: candles are clustered on a 2.5 m grid and binned every 20 m of z
    let bins = null;
    function prepBake() {
      const cl = new Map();
      const put = (x, y, z, n) => { const k = Math.round(x / 2.5) + ',' + Math.round(y / 3) + ',' + Math.round(z / 2.5); let e = cl.get(k); if (!e) cl.set(k, e = [0, 0, 0, 0]); e[0] += x * n; e[1] += y * n; e[2] += z * n; e[3] += n; };
      for (const c of candles) put(c.x, c.fy, c.z, 1);
      for (const b of bigLights) put(b[0], b[1], b[2], b[3]);
      for (const g of hero.anchors.candleGroups) put(g.position.x, g.position.y, g.position.z + HERO_Z, g.count);
      bins = new Map();
      for (const e of cl.values()) { const k = Math.floor(e[2] / e[3] / 20); let b = bins.get(k); if (!b) bins.set(k, b = []); b.push(e[0] / e[3], e[1] / e[3], e[2] / e[3], e[3]); }
    }
    const bake = (x, y, z, nx, ny, nz) => {
      if (!bins) prepBake();
      let g = 0; const k0 = Math.floor(z / 20);
      for (let kb = k0 - 1; kb <= k0 + 1; kb++) {
        const b = bins.get(kb); if (!b) continue;
        for (let k = 0; k < b.length; k += 4) {
          const dx = b[k] - x, dy = b[k + 1] - y, dz = b[k + 2] - z, d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > 400) continue;
          const wrap = (dx * nx + dy * ny + dz * nz) / Math.sqrt(d2 + 0.3) * 0.62 + 0.38;
          if (wrap <= 0) continue;
          const f = 1 + d2 * 0.16; g += b[k + 3] * wrap / (f * Math.sqrt(f));
        }
      }
      return Math.min(g * 0.34, 1.25);
    };

    // ---- shell and prop batches, one pair per room so they cull
    const S = { pas: K.makeBatch(), pat: K.makeBatch(), kit: K.makeBatch(), best: K.makeBatch() };
    const P = { pas: K.makeBatch(), pat: K.makeBatch(), kit: K.makeBatch(), best: K.makeBatch() };
    const wallX = (B, x, z0, z1, y0, y1, face, col, aux, edge = 5) => B.add(quadGeo(V3(x, y0, face > 0 ? Math.max(z0, z1) : Math.min(z0, z1)), V3(0, 0, -face * Math.abs(z1 - z0)), V3(0, y1 - y0, 0), edge), I4, col, aux);
    const wallZ = (B, z, x0, x1, y0, y1, face, col, aux, edge = 5) => B.add(quadGeo(V3(face > 0 ? Math.min(x0, x1) : Math.max(x0, x1), y0, z), V3(face * Math.abs(x1 - x0), 0, 0), V3(0, y1 - y0, 0), edge), I4, col, aux);
    const slabY = (B, x0, x1, z0, z1, y, up, col, aux, edge = 5) => B.add(quadGeo(V3(Math.min(x0, x1), y, up > 0 ? Math.min(z0, z1) : Math.max(z0, z1)), V3(0, 0, up * Math.abs(z1 - z0)), V3(Math.abs(x1 - x0), 0, 0), edge), I4, col, aux);
    const box = (B, x, y, z, sx, sy, sz, col, aux, ry = 0, seg = 1) => B.add(new THREE.BoxGeometry(sx, sy, sz, seg, 1, seg), M(x, y, z, 1, 1, 1, ry), col, aux);
    const DOOR = { hw: 8, spring: 18 }, archY = (x) => DOOR.spring + Math.sqrt(Math.max(DOOR.hw * DOOR.hw - x * x, 0));
    const stoneC = hex('#8c8478'), woodC = hex('#5a3a22'), woodD = hex('#35221a');
    // a cross wall face with the round-arched doorway cut out of it, facing +z (face 1) or -z (face -1)
    function archFace(B, z, face, hw, H, col, aux) {
      wallZ(B, z, -hw, -DOOR.hw, 0, H, face, col, aux); wallZ(B, z, DOOR.hw, hw, 0, H, face, col, aux);
      B.add(fnGeo(16, 5, (a, b) => { const x = (a * 2 - 1) * DOOR.hw; return [x, lerp(archY(x), H, b), z]; }, face < 0), I4, col, aux);
      // stone archivolt and jamb trim, standing a little proud of the wall
      const per = (t) => { const s = t * (2 * DOOR.spring + Math.PI * DOOR.hw); if (s < DOOR.spring) return [-1, 0, -DOOR.hw, s]; if (s > DOOR.spring + Math.PI * DOOR.hw) return [1, 0, DOOR.hw, 2 * DOOR.spring + Math.PI * DOOR.hw - s];
        const an = Math.PI - (s - DOOR.spring) / DOOR.hw; return [Math.cos(an), Math.sin(an), Math.cos(an) * DOOR.hw, DOOR.spring + Math.sin(an) * DOOR.hw]; };
      B.add(fnGeo(48, 2, (a, b) => { const p = per(a), o = b * 1.7; return [p[2] + p[0] * o, p[3] + p[1] * o, z + face * (0.5 - 0.2 * Math.abs(b - 0.5))]; }, face < 0), I4,
        (x, y, zz, o) => { o.copy(stoneC).multiplyScalar(0.8 + 0.25 * (Math.floor(Math.atan2(y - DOOR.spring, x) * 5 + y * 0.33) % 2 ? 1 : 0.6)); }, [0, 0.1, 7]);
    }
    // the reveal through the wall's thickness, and a pair of leaves folded back against the far face
    function doorway(B, zc, leafSide) {
      const per = (t) => { const Lp = 2 * DOOR.spring + Math.PI * DOOR.hw, s = t * Lp; if (s < DOOR.spring) return [-DOOR.hw, s]; if (s > Lp - DOOR.spring) return [DOOR.hw, Lp - s];
        const an = Math.PI - (s - DOOR.spring) / DOOR.hw; return [Math.cos(an) * DOOR.hw, DOOR.spring + Math.sin(an) * DOOR.hw]; };
      B.add(fnGeo(2, 40, (a, b) => { const p = per(b); return [p[0], p[1], zc + WT + 0.5 - a * (2 * WT + 1)]; }), I4, stoneC.clone().multiplyScalar(0.8), [0, 0.1, 7]);
      for (const sx of [-1, 1]) {
        const zf = zc + leafSide * (WT + 0.45), xc = sx * 13.2;
        box(B, xc, 9.6, zf, 8.2, 19.2, 0.5, woodD, [0, 0.15, 4]);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) box(B, xc + (c - 0.5) * 3.7, 3.8 + r * 6.0, zf + leafSide * 0.32, 3.0, 5.0, 0.3, woodC.clone().multiplyScalar(0.9 + 0.2 * ((r + c) % 2)), [0, 0.25, 4]);
        for (let r = 0; r < 4; r++) for (const c of [-3.75, 0, 3.75]) B.add(new THREE.SphereGeometry(0.22, 6, 4), M(xc + c, 0.8 + r * 6.0, zf + leafSide * 0.36), hex('#2a2422'), [0, 0.8, 0]);
      }
    }
    // a stone candle shelf on two scrolled corbels, top at y, against the wall x (room side = -sx)
    const shelf = (B, x, sx, y, z, len) => {
      box(B, x - sx * 0.85, y - 0.16, z, 1.7, 0.32, len, stoneC, [0, 0.15, 7], 0, 3);
      B.add(new THREE.CylinderGeometry(0.2, 0.2, len, 8, 3).rotateX(Math.PI / 2), M(x - sx * 1.7, y - 0.2, z), stoneC.clone().multiplyScalar(1.1), [0, 0.15, 7]);
      box(B, x - sx * 0.7, y - 0.5, z, 1.3, 0.3, len - 0.7, stoneC.clone().multiplyScalar(0.75), [0, 0.1, 7]);
      for (const dz of [-len * 0.32, len * 0.32]) { B.add(new THREE.SphereGeometry(1, 10, 8), M(x - sx * 0.55, y - 1.15, z + dz, 0.75, 0.75, 0.3), stoneC.clone().multiplyScalar(0.85), [0, 0.15, 7]);
        B.add(new THREE.SphereGeometry(1, 8, 6), M(x - sx * 0.3, y - 1.95, z + dz, 0.42, 0.5, 0.26), stoneC.clone().multiplyScalar(0.7), [0, 0.15, 7]); }
    };
    const beamsX = (B, zs, x0, x1, y, w, h, col) => { for (const z of zs) box(B, (x0 + x1) / 2, y - h / 2, z, Math.abs(x1 - x0), h, w, col.clone().multiplyScalar(rng.range(0.8, 1.1)), [0, 0.05, 4], 0, 6); };

    // ================================================================ 1. the entry passage (z 30 .. -78)
    const terraW = mixc(pal.terra, hex('#b98a6a'), 0.32).multiplyScalar(0.9), clayC = hex('#a25336'), ceilC = hex('#2b1d1e'), strawC = hex('#c9a455');
    const zPasEnd = ZP0 + WT;
    slabY(S.pas, -PW, PW, Z0, zPasEnd, 0, 1, clayC, [0, 1, 1], 4);
    for (const sx of [-1, 1]) wallX(S.pas, sx * PW, Z0, zPasEnd, 0, PH, -sx, terraW, [0, 0, 8]);
    slabY(S.pas, -PW, PW, Z0, zPasEnd, PH, -1, ceilC, [0, 0, 0], 8);
    await ctx.yield();
    beamsX(S.pas, Array.from({ length: 18 }, (_, k) => 24 - k * 6), -PW, PW, PH, 1.5, 2.4, woodC);
    await ctx.yield();
    for (const sx of [-1, 1]) box(S.pas, sx * (PW - 0.9), PH - 3.2, (Z0 + zPasEnd) / 2, 1.8, 1.6, Z0 - zPasEnd, woodD, [0, 0.05, 4], 0, 10);
    archFace(S.pas, zPasEnd, 1, PW, PH, terraW, [0, 0, 8]);
    await ctx.yield();
    doorway(S.pas, ZP0, -1);
    await ctx.yield();
    // candle shelves with a painted arch behind them
    for (let k = 0; k < 7; k++) for (const sx of [-1, 1]) {
      const z = 18 - k * 14 - (sx > 0 ? 7 : 0), x = sx * PW;
      shelf(S.pas, x, sx, 9.43, z, 4.8);
      S.pas.add(fnGeo(12, 1, (a, b) => { const an = Math.PI * a, r = 2.9 + b * 0.7; return [x - sx * 0.08, 9.45 + 3.2 + Math.sin(an) * r * 1.25 - 3.2 * (1 - Math.min(1, Math.sin(an) * 3)), z + Math.cos(an) * r * sx]; }, true), I4, pal.gold.clone().multiplyScalar(0.55), [0, 0.2, 0]);
      for (let c = 0; c < 4; c++) addCandle(x - sx * rng.range(0.5, 1.2), 9.43, z + (c - 1.5) * 1.05 + rng.range(-0.2, 0.2), c % 3 === 0 ? 2 : rng.int(0, 1), 0.9, false);
      moths.push([x - sx * 1.2, 11.5, z, 2.2]);
      await ctx.yield();
    }
    // two rows of floor candles beside the petal line
    for (const sx of [-1, 1]) for (let z = Z0 - 3; z > zPasEnd + 3; z -= rng.range(3.0, 3.9)) addCandle(sx * rng.range(3.3, 3.9), 0, z, rng.chance(0.55) ? 1 : 0, 1.15);
    // the bench with a straw hat, the watering can, jars of marigolds
    {
      const B = P.pas, bz = -34, bx = -PW + 2.2;
      box(B, bx, 3.5, bz, 3.2, 0.5, 15, woodC, [0, 0.25, 0], 0, 4);
      for (const dz of [-6.6, 0, 6.6]) { box(B, bx - 1.2, 1.65, bz + dz, 0.6, 3.3, 0.7, woodD, [0, 0.1, 0]); box(B, bx + 1.2, 1.65, bz + dz, 0.6, 3.3, 0.7, woodD, [0, 0.1, 0]); box(B, bx, 2.9, bz + dz, 2.6, 0.5, 0.5, woodD, [0, 0.1, 0]); }
      box(B, bx - 1.4, 6.6, bz, 0.4, 1.3, 15, woodC, [0, 0.25, 0], 0, 4); box(B, bx - 1.4, 5.0, bz, 0.35, 0.6, 15, woodD, [0, 0.2, 0]);
      for (const dz of [-7.2, -2.4, 2.4, 7.2]) box(B, bx - 1.45, 5.3, bz + dz, 0.45, 3.4, 0.55, woodD, [0, 0.1, 0]);
      B.add(lathe([[0.02, 0.9], [1.1, 0.95], [1.35, 0.5], [1.5, 0.12], [2.9, 0], [3.0, 0.06], [1.5, 0.3], [1.3, 0.9], [1.0, 1.3], [0.02, 1.4]], 18), M(bx + 0.2, 3.76, bz + 3.4, 1, 1, 1, 0.4, 0.06),
        (x, y, z, o) => { o.copy(strawC).multiplyScalar(0.75 + 0.3 * Math.abs(Math.sin(Math.hypot(x, z) * 14))); if (y > 0.28 && y < 0.6 && Math.hypot(x, z) < 1.6) o.copy(pal.magenta).multiplyScalar(0.7); }, [0, 0.15, 0]);
      const wx = PW - 2.6, wz = -52, tin = hex('#6f7f86');
      B.add(lathe([[0.02, 0], [1.5, 0], [1.6, 0.15], [1.45, 3.2], [1.55, 3.35], [1.4, 3.4], [1.3, 3.2], [0.02, 3.1]], 14), M(wx, 0, wz), (x, y, z, o) => { o.copy(tin).multiplyScalar(y > 1.3 && y < 1.5 || y > 2.6 && y < 2.75 ? 0.6 : 1); }, [0, 0.7, 0]);
      B.add(K.tubeGeo([V3(0, 1.0, -1.3), V3(0, 2.0, -2.6), V3(0, 3.2, -3.7), V3(0, 3.9, -4.2)], (t) => 0.34 - 0.14 * t, 7), M(wx, 0, wz), tin, [0, 0.7, 0]);
      B.add(lathe([[0.02, 0], [0.5, 0.05], [0.62, 0.3], [0.02, 0.36]], 9), M(wx, 3.85, wz - 4.3, 1, 1, 1, 0, -0.9), tin.clone().multiplyScalar(0.8), [0, 0.7, 0]);
      B.add(new THREE.TorusGeometry(1.25, 0.14, 5, 12, Math.PI), M(wx, 2.3, wz + 1.4, 1, 1, 1, Math.PI / 2, 0, -Math.PI / 2), tin, [0, 0.7, 0]);
      await ctx.yield();
      for (const [jx, jz, js] of [[-PW + 2.4, 6, 1.5], [PW - 2.3, -4, 1.3], [-PW + 2.3, -58, 1.4], [PW - 2.4, -24, 1.6], [-PW + 2.6, -70, 1.2], [PW - 2.5, -68, 1.5]]) {
        B.add(lathe([[0.02, 0], [0.5, 0], [0.56, 0.06], [0.86, 0.6], [1.0, 1.3], [0.8, 1.9], [0.5, 2.2], [0.62, 2.45], [0.5, 2.4], [0.4, 2.15]], 11), M(jx, 0, jz, js), (x, y, z, o) => { o.copy(pal.terra).multiplyScalar(y > 1.0 && y < 1.5 ? 0.5 : 0.85); }, [0, 0.35, 0], 0.1, rng);
        bouquet(B, jx, 2.6 * js, jz, 1.1 * js, 13, rng.chance(0.25));
      }
    }
    // ten rows of cut-paper flags overhead
    const FLAGC = [[pal.magenta, pal.violet], [hex('#e9dcc4'), pal.orange], [pal.magenta, pal.orange, pal.violet, pal.cobalt]][cast.flagScheme];
    for (let k = 0; k < 11; k++) flagRows.push({ x0: -PW + 0.3, x1: PW - 0.3, y: 23.5 + (k % 2) * 1.2, z: 16.4 - k * 8.4, sag: 2.2, n: 6, w: 3.1, h: 3.7, colors: k % 2 ? FLAGC.slice().reverse() : FLAGC });
    await ctx.yield();

    // ================================================================ 2. the patio (z -82 .. -188), open to the sky
    const zA = ZP0 - WT, zB = ZK0 + WT, YH = 36, BAYL = (zA - zB) / 5, flagC = hex('#5f5953');
    slabY(S.pat, -YW, YW, zA, zB, 0, 1, flagC, [0, 1, 2], 6);
    archFace(S.pat, zA, -1, YW, YH, terraW, [0, 0, 8]); archFace(S.pat, zB, 1, YW, YH, terraW, [0, 0, 8]);
    doorway(S.pat, ZK0, -1);
    for (const [B, zc] of [[S.pat, ZP0], [S.pat, ZK0], [S.kit, ZB0]]) slabY(B, -8.6, 8.6, zc + WT + 0.6, zc - WT - 0.6, 0.03, 1, flagC, [0, 1, 2], 3);
    for (const z of [zA - 1, zB + 1]) box(S.pat, 0, YH + 0.6, z, YW * 2, 1.4, 3.4, pal.terra.clone().multiplyScalar(0.7), [0, 0.1, 6], 0, 12);
    await ctx.yield();
    for (const sx of [-1, 1]) {
      wallX(S.pat, sx * YW, zA, zB, 0, 33, -sx, terraW, [0, 0, 8]);
      slabY(S.pat, sx > 0 ? AX - 1 : -YW, sx > 0 ? YW : -AX + 1, zA, zB, 25.6, -1, ceilC, [0, 0, 4], 6);
      for (let k = 0; k <= 10; k++) box(S.pat, sx * (AX + 6), 24.9, zA - k * BAYL / 2, 12, 1.4, 1.1, woodC, [0, 0.05, 4]);
      for (let k = 0; k < 5; k++) {
        const z0 = zA - k * BAYL, zc = z0 - BAYL / 2, R = BAYL / 2 - 1.5, yb = (dz) => (Math.abs(dz) >= R ? 12.5 : 12.5 + Math.sqrt(R * R - dz * dz));
        for (const side of [-1, 1]) S.pat.add(fnGeo(26, 3, (a, b) => { const dz = (a - 0.5) * BAYL; return [sx * (AX + side * 1.1), lerp(yb(dz), 27, b), zc + dz]; }, sx * side > 0), I4, terraW, [0, 0, 0]);
        S.pat.add(fnGeo(24, 1, (a, b) => { const an = Math.PI * a; return [sx * (AX - 1.1 + b * 2.2), 12.5 + Math.sin(an) * R, zc + Math.cos(an) * R]; }, sx < 0), I4, terraW.clone().multiplyScalar(0.8), [0, 0, 0]);
      }
      await ctx.yield();
      for (let k = 0; k <= 5; k++) {
        const z = zA - k * BAYL;
        S.pat.add(lathe([[1.95, 0], [1.95, 0.7], [1.7, 0.9], [1.75, 1.2], [1.5, 1.5], [1.52, 5.5], [1.4, 10.4], [1.55, 10.7], [1.42, 10.95], [1.6, 11.3], [1.95, 12.0], [1.95, 12.5]], 14), M(sx * AX, 0, z), stoneC, [0, 0.12, 7], 0.08, rng);
        box(S.pat, sx * AX, 12.75, z, 4.3, 0.6, 4.3, stoneC.clone().multiplyScalar(0.85), [0, 0.1, 7]);
        box(S.pat, sx * AX, 0.25, z, 4.4, 0.5, 4.4, stoneC.clone().multiplyScalar(0.7), [0, 0.1, 7]);
      }
      await ctx.yield();
      // tiled roof sloping to the eave, a fascia beam and rafter ends
      S.pat.add(fnGeo(8, 24, (a, b) => [sx * lerp(AX - 3, YW, a), lerp(26.6, 32, a), lerp(zA, zB, b)], sx < 0), I4, pal.terra.clone().multiplyScalar(0.8), [0, 0, 6]);
      box(S.pat, sx * (AX - 2.6), 26.2, (zA + zB) / 2, 0.8, 1.0, zA - zB, woodD, [0, 0.05, 4], 0, 12);
      for (let k = 0; k < 36; k++) box(S.pat, sx * (AX - 1.9), 25.9, zA - 1.5 - k * 2.95, 2.4, 0.6, 0.5, woodC, [0, 0.05, 4]);
      wallX(S.pat, sx * (YW - 0.1), zA, zB, 32, 34.5, -sx, terraW.clone().multiplyScalar(0.7), [0, 0, 6]);
      await ctx.yield();
    }

    // ---- the two-tier fountain on the axis: stone basin, stem, upper bowl, finial
    const ftn = new THREE.Group(); ftn.position.set(FTN.x, 0, FTN.z);
    {
      const B = S.pat, m = M(FTN.x, 0, FTN.z), st = (k) => [0, 0.25, 7];
      const band = (x, y, z, o) => { o.copy(stoneC).multiplyScalar(0.72 + 0.3 * Math.abs(Math.sin(Math.atan2(z, x) * 8)) * (y > 1.2 && y < 2.0 ? 1 : 0.35)); };
      B.add(lathe([[9.6, 0], [9.6, 0.6], [9.2, 0.75], [9.25, 1.4], [9.0, 1.6], [9.05, 2.3], [9.35, 2.6], [9.3, 2.95], [8.5, 3.0], [8.3, 2.6], [8.2, 0.9], [0.02, 0.8]], 40), m, band, st());
      B.add(lathe([[2.4, 0.8], [2.4, 1.6], [1.5, 2.0], [1.1, 3.4], [1.5, 4.3], [1.0, 4.9], [0.9, 6.3], [1.6, 6.9], [3.4, 7.5], [4.6, 8.2], [4.75, 8.55], [4.4, 8.6], [3.2, 8.0], [0.02, 7.9]], 28), m, band, st());
      B.add(lathe([[1.0, 7.9], [0.7, 8.9], [1.05, 9.5], [0.6, 10.2], [0.75, 10.9], [0.3, 11.5], [0.42, 11.9], [0.02, 12.2]], 14), m, stoneC, st());
      await ctx.yield();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; B.add(new THREE.SphereGeometry(0.55, 7, 5), M(FTN.x + Math.cos(a) * 9.3, 3.2, FTN.z + Math.sin(a) * 9.3, 1, 0.8, 1), stoneC.clone().multiplyScalar(0.9), [0, 0.2, 7]); }
      const basin = new THREE.Mesh(new THREE.CircleGeometry(8.5, 40).rotateX(-Math.PI / 2), waterMaterial(U, undefined, false)); basin.position.set(FTN.x, 2.45, FTN.z); basin.name = 'basin'; scene.add(basin);
      const bowl = new THREE.CircleGeometry(4.4, 24).rotateX(-Math.PI / 2); bowl.translate(0, 8.5 - 2.45, 0);
      const bm = new THREE.Mesh(bowl, basin.material); bm.position.copy(basin.position); scene.add(bm);
      // falling sheets: off the upper bowl's lip into the basin, and from the jet into the bowl
      const sheets = [];
      const fall = (r0, r1, y0, y1, bulge) => fnGeo(40, 6, (a, b) => { const an = a * TAU, r = lerp(r0, r1, b) + bulge * Math.sin(b * Math.PI * 0.5); return [Math.cos(an) * r, lerp(y0, y1, b * b), Math.sin(an) * r]; });
      for (const [g, v0] of [[fall(4.72, 5.5, 8.55, 2.5, 0.5), 0], [fall(0.3, 1.9, 11.9, 8.5, 0.9), 0.3]]) {
        const uv = new Float32Array(g.attributes.position.count * 2);
        for (let j = 0; j <= 6; j++) for (let i = 0; i <= 40; i++) { uv[(j * 41 + i) * 2] = i / 40 + v0; uv[(j * 41 + i) * 2 + 1] = j / 6; }
        g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); sheets.push(g);
      }
      for (const g of sheets) { const sm = new THREE.Mesh(g, ftn.userData.sheetMat || (ftn.userData.sheetMat = waterMaterial(U, undefined, true))); sm.position.set(FTN.x, 0, FTN.z); sm.renderOrder = 2; scene.add(sm); }
      bigLights.push([FTN.x, 3.5, FTN.z, 14]);
      for (let k = 0; k < 14; k++) sparkles.push([FTN.x + rng.range(-5, 5), 2.6, FTN.z + rng.range(-5, 5), rng.range(1.2, 2.6), rng.range(0.6, 1.1), rng(), 0.16, 0, 0.6, 0.75, 1.0]);
    }
    await ctx.yield();
    // candles and flower heads floating in the basin: their own little sets so the whole ring can turn
    const floatC = [], floatH = [];
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU + rng.range(-0.15, 0.15), r = rng.range(5.6, 7.9); floatC.push({ x: Math.cos(a) * r, y: 2.4, z: Math.sin(a) * r, r: 0.42, h: 0.45, kind: 2, col: GLASSC[rng.int(0, 4)], fs: 0.3, fy: 2.9 }); }
    for (let k = 0; k < 46; k++) { const a = rng.range(0, TAU), r = rng.range(5.2, 8.2); floatH.push({ x: Math.cos(a) * r, y: 2.46, z: Math.sin(a) * r, nx: rng.range(-0.15, 0.15), ny: 1, nz: rng.range(-0.15, 0.15), r: rng.range(0.4, 0.62), col: marigold(), em: 0.8 }); }

    // ---- the lemon (or orange) tree, 34 m tall, 26 m left of the fountain, tin star lanterns in its branches
    {
      const B = P.pat, bark = hex('#3a2c26'), leafA = hex('#173626'), leafB = hex('#2a5a36'), fruitC = cast.orangeTree ? hex('#ff8a1c') : hex('#f2dc6a');
      const limb = (pts, r0, r1) => B.add(K.tubeGeo(pts, (t) => lerp(r0, r1, t), 8), I4, (x, y, z, o) => { o.copy(bark).multiplyScalar(0.7 + 0.5 * Math.abs(Math.sin(y * 1.3 + x * 2.1 + z * 1.7))); }, [0, 0.05, 0]);
      limb([V3(TREE.x, 0, TREE.z), V3(TREE.x + 0.4, 5, TREE.z - 0.3), V3(TREE.x - 0.5, 10, TREE.z + 0.4), V3(TREE.x, 15, TREE.z)], 1.9, 1.3);
      B.add(lathe([[4.2, 0], [4.2, 1.6], [3.9, 1.9], [3.7, 1.8], [3.7, 0.4], [0.02, 0.4]], 20), M(TREE.x, 0, TREE.z), stoneC.clone().multiplyScalar(0.8), [0, 0.1, 0]);
      await ctx.yield();
      const crowns = [];
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + rng.range(-0.3, 0.3), el = k === 0 ? 1.5 : rng.range(0.35, 1.0), len = rng.range(8, 12);
        const tip = V3(TREE.x + Math.cos(a) * Math.cos(el) * len, 15 + Math.sin(el) * len, TREE.z + Math.sin(a) * Math.cos(el) * len);
        limb([V3(TREE.x, 13.5, TREE.z), V3(lerp(TREE.x, tip.x, 0.4), lerp(14, tip.y, 0.55), lerp(TREE.z, tip.z, 0.4)), tip], 0.9, 0.3);
        crowns.push(tip);
      }
      await ctx.yield();
      const blobs = [];
      for (let k = 0; k < 46; k++) {
        const c = crowns[k % crowns.length], d = rng.range(0, 6.5), a = rng.range(0, TAU), el = rng.range(-0.5, 1.2), r = rng.range(3.2, 5.6);
        const p = V3(c.x + Math.cos(a) * Math.cos(el) * d, c.y + Math.sin(el) * d * 0.9 + 1, c.z + Math.sin(a) * Math.cos(el) * d); blobs.push([p, r]);
        const g = new THREE.IcosahedronGeometry(1, 2), pa = g.attributes.position;
        for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), n = 1 + 0.32 * ctx.noise.n3(x * 2.3 + k * 7, y * 2.3, z * 2.3) + 0.14 * ctx.noise.n3(x * 6 + k, y * 6, z * 6); pa.setXYZ(i, x * n, y * n * 0.82, z * n); }
        { const na = g.attributes.normal; for (let i = 0; i < pa.count; i++) { const l = Math.hypot(pa.getX(i), pa.getY(i) * 1.2, pa.getZ(i)) || 1; na.setXYZ(i, pa.getX(i) / l, pa.getY(i) * 1.2 / l, pa.getZ(i) / l); } }
        B.add(g, M(p.x, p.y, p.z, r, r, r, rng.range(0, TAU)), (x, y, z, o) => { o.copy(leafA).lerp(leafB, clamp(y * 0.6 + 0.4 + 0.5 * ctx.noise.n3(x * 1.5, y * 1.5, z * 1.5 + k), 0, 1)); }, [0, 0.55, 0.31]);
        await ctx.yield();
      }
      const nFruit = Math.round(170 * lerp(0.7, 1, detail));
      for (let k = 0; k < nFruit; k++) {
        if ((k & 15) === 0) await ctx.yield();   // every 16 fruit
        const b = rng.pick(blobs), a = rng.range(0, TAU), el = rng.range(-1.1, 0.5), r = b[1] * 0.98;
        B.add(new THREE.SphereGeometry(rng.range(0.34, 0.46), 5, 4), M(b[0].x + Math.cos(a) * Math.cos(el) * r, b[0].y + Math.sin(el) * r * 0.82, b[0].z + Math.sin(a) * Math.cos(el) * r, 1, 1.25, 1), fruitC.clone().multiplyScalar(rng.range(0.75, 1.05)), [0.1, 0.5, 0.3]);
      }
      await ctx.yield();
      // star lanterns hung under the crown
      for (let k = 0; k < 11; k++) {
        const b = blobs[(k * 4 + 1) % blobs.length], x = b[0].x + rng.range(-2, 2), z = b[0].z + rng.range(-2, 2), y = Math.max(13, b[0].y - b[1] * 0.82 - rng.range(1.5, 4.5));
        B.add(new THREE.OctahedronGeometry(0.75, 0), M(x, y, z, 1, 1.3, 1, rng.range(0, 3)), mixc(pal.gold, pal.orange, 0.3), [2.2, 0.3, 0.6]);
        box(B, x, (y + b[0].y) / 2 + 0.5, z, 0.09, Math.max(0.5, b[0].y - y - 1), 0.09, hex('#2a2422'), [0, 0, 0.6]);
        sparkles.push([x, y, z, 0.35, 0.2, rng(), 2.6, 2, 1.0, 0.62, 0.25]); bigLights.push([x, y, z, 5]);
      }
      moths.push([TREE.x + 6, 14, TREE.z + 4, 3.5]);
    }
    await ctx.yield();

    // ---- the hairless dog on the open flags beyond the fountain, inside the road's curve: a slate outline lying broadside
    // to the camera as it comes round, an arc of candles behind it; its head (pivot at the base of the neck) lifts and
    // turns to watch us from u 0.30, at the middle of the pan across the court
    const DOG = { x: -1, z: -155.5, ry: -0.526, s: 1.32, bx: -0.86, bz: -0.5 };   // (bx, bz): the side away from the arriving camera
    const dogBody = K.makeBatch(), dogHead = K.makeBatch();
    {
      const hide = hex('#39404f'), hideD = hex('#2a2f3c'), DA = [0, 2.7, 0];
      const sph = (B, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, c = hide) => B.add(new THREE.SphereGeometry(1, 14, 10), M(x, y, z, sx, sy, sz, ry, rx, rz), c, DA);
      // spine from rump to chest: deep ribcage, tucked waist, lean haunch
      const curve = new THREE.CatmullRomCurve3([V3(0, 0.62, -3.55), V3(0, 0.92, -3.1), V3(0.05, 1.06, -2.4), V3(0.03, 0.98, -1.3), V3(0, 1.1, -0.2), V3(0, 1.28, 0.9), V3(0, 1.4, 1.7), V3(0, 1.52, 2.3)]);
      const rad = [0.22, 0.74, 1.02, 0.8, 0.96, 1.16, 1.0, 0.62], rAt = (t) => { const f = t * (rad.length - 1), k = Math.min(rad.length - 2, Math.floor(f)), q = f - k, e = q * q * (3 - 2 * q); return lerp(rad[k], rad[k + 1], e); };
      dogBody.add(K.tubeGeo(curve.getPoints(36), (t) => rAt(t), 18), M(0, 0.04, 0, 0.86, 0.95, 1), (x, y, z, o) => { o.copy(hideD).lerp(hide, clamp(y * 0.7, 0, 1)); }, DA);
      sph(dogBody, 0, 1.5, 2.25, 0.56, 0.6, 0.42);
      for (const sx of [-1, 1]) {
        // forelegs: elbow tucked under the chest, slim forearm laid forward, small paw
        dogBody.add(K.tubeGeo([V3(sx * 0.62, 1.0, 1.75), V3(sx * 0.7, 0.5, 1.6), V3(sx * 0.72, 0.3, 2.2), V3(sx * 0.68, 0.27, 3.0), V3(sx * 0.66, 0.24, 3.75)], (t) => 0.42 - 0.17 * t, 10), I4, hide, DA);
        sph(dogBody, sx * 0.66, 0.22, 3.85, 0.3, 0.2, 0.44, 0, 0, 0, hideD);
        // hind legs folded flat against the body: thigh, hock, foot
        sph(dogBody, sx * 0.72, 0.74, -2.1, 0.42, 0.74, 1.05, 0.2);
        dogBody.add(K.tubeGeo([V3(sx * 0.86, 0.36, -2.75), V3(sx * 0.98, 0.26, -2.0), V3(sx * 1.02, 0.22, -1.1)], (t) => 0.24 - 0.06 * t, 8), I4, hide, DA);
        sph(dogBody, sx * 1.02, 0.19, -0.95, 0.22, 0.16, 0.36, 0, 0, 0, hideD);
      }
      dogBody.add(K.tubeGeo([V3(0, 0.66, -3.45), V3(0.25, 0.42, -4.0), V3(0.95, 0.24, -4.05), V3(1.6, 0.18, -3.5), V3(1.85, 0.15, -2.8)], (t) => 0.17 - 0.12 * t, 7), I4, hide, DA);
      await ctx.yield();
      // head group: long neck, wedge skull, tapering muzzle, tall bat ears
      dogHead.add(K.tubeGeo([V3(0, -0.2, -0.1), V3(0, 0.6, 0.3), V3(0, 1.3, 0.7), V3(0, 1.75, 1.05)], (t) => 0.6 - 0.2 * t, 12), I4, hide, DA);
      {
        const hc = new THREE.CatmullRomCurve3([V3(0, 1.86, 0.72), V3(0, 1.97, 1.2), V3(0, 1.93, 1.75), V3(0, 1.84, 2.35), V3(0, 1.77, 2.9), V3(0, 1.72, 3.35), V3(0, 1.7, 3.56)]);
        const hr = [0.3, 0.55, 0.5, 0.33, 0.25, 0.19, 0.03], hAt = (t) => { const f = t * (hr.length - 1), k = Math.min(hr.length - 2, Math.floor(f)), q = f - k, e = q * q * (3 - 2 * q); return lerp(hr[k], hr[k + 1], e); };
        dogHead.add(K.tubeGeo(hc.getPoints(22), (t) => hAt(t), 14), M(0, 0, 0, 0.94, 1, 1), hide, DA);
      }
      for (const sx of [-1, 1]) dogHead.add(lathe([[0.02, 0], [0.44, 0.1], [0.56, 0.6], [0.44, 1.35], [0.16, 2.0], [0.02, 2.1]], 10), M(sx * 0.46, 2.3, 1.0, 1, 1, 0.26, sx * 0.55, -0.12, -sx * 0.3), hide, DA);
      // the candle row behind it (seen from the path as we round the fountain) and a few by its paws
      const dBack = cast.dogPair ? 10 : 5.6;      // the second dog lies just beyond the first, the candles beyond both
      for (let k = 0; k < 21; k++) { const t = (k + rng.range(-0.3, 0.3)) / 20 * 2 - 1, d = dBack + rng.range(-0.9, 1.3) - 1.6 * t * t; addCandle(DOG.x + DOG.bx * d - DOG.bz * t * 8.4, 0, DOG.z + DOG.bz * d + DOG.bx * t * 8.4, k % 3 === 2 ? 1 : 0, 1.45); }
      for (let k = 0; k < 4; k++) addCandle(DOG.x + Math.sin(DOG.ry) * 6.6 - DOG.bx * (0.6 + k * 1.2) + rng.range(-0.4, 0.4), 0, DOG.z + Math.cos(DOG.ry) * 6.6 - DOG.bz * (0.6 + k * 1.2) + rng.range(-0.4, 0.4), rng.int(1, 2), 1.1);
      bigLights.push([DOG.x + DOG.bx * (dBack + 1), 2.5, DOG.z + DOG.bz * (dBack + 1), 16]);
      moths.push([DOG.x + DOG.bx * dBack, 4.5, DOG.z + DOG.bz * dBack, 3.4]);
    }
    await ctx.yield();
    // ---- the cat on the wall against the sky
    const CAT = { x: cast.catFar ? 15 : -15, y: YH + 1.3, z: zB + 1 };   // on the kitchen roofline against the sky, either side of the arch
    const catBody = K.makeBatch(), catTail = K.makeBatch();
    {
      const fur = hex('#16161f'), a = [0, 2.2, 0];
      catBody.add(lathe([[0.02, 0], [1.05, 0.08], [1.2, 0.7], [1.0, 1.7], [0.62, 2.5], [0.4, 2.9], [0.02, 3.0]], 12), M(0, 0, 0, 1, 1, 1.15), fur, a);
      catBody.add(new THREE.SphereGeometry(0.62, 10, 8), M(0, 3.15, 0.25, 1.05, 0.92, 1), fur, a);
      for (const sx of [-1, 1]) { catBody.add(new THREE.ConeGeometry(0.3, 0.62, 4), M(sx * 0.36, 3.82, 0.2, 1, 1, 0.55, sx * 0.3, 0, -sx * 0.2), fur, a); catBody.add(new THREE.SphereGeometry(0.3, 6, 5), M(sx * 0.4, 0.3, 0.95, 0.9, 1, 1.5), fur, a); }
      catTail.add(K.tubeGeo([V3(0, 0, 0), V3(0, -0.5, -0.5), V3(0, -1.6, -0.75), V3(0, -2.6, -0.6), V3(0, -3.2, -0.2)], (t) => 0.2 - 0.06 * t, 6), I4, fur, a);
    }
    await ctx.yield();

    // ---- patio dressing: lanterns, garlands and pots on every column, floor candles, broom, bougainvillea, flags
    {
      const B = P.pat, iron = hex('#221d1c'), potC = pal.terra.clone().multiplyScalar(0.8), fernC = hex('#2f5f33'), gerC = [pal.magenta, hex('#e8402a'), mixc(pal.magenta, pal.violet, 0.4)];
      for (const sx of [-1, 1]) for (let k = 0; k <= 5; k++) {
        const z = zA - k * BAYL, zc = clamp(z, zB + 2.4, zA - 2.4), lx = sx * (AX - 2.5);
        box(B, sx * (AX - 1.9), 10.6, zc, 1.3, 0.16, 0.16, iron, [0, 0.4, 0]);
        B.add(lathe([[0.02, 0], [0.42, 0.1], [0.55, 0.2], [0.55, 1.3], [0.42, 1.4], [0.6, 1.5], [0.25, 1.95], [0.02, 2.0]], 6), M(lx, 8.5, zc), (x, y, zz, o) => { if (y > 0.25 && y < 1.3) o.copy(mixc(pal.gold, pal.orange, 0.35)); else o.copy(iron); }, [0, 0.4, 0.25]);
        B.add(new THREE.CylinderGeometry(0.46, 0.46, 1.0, 6, 1, true), M(lx, 9.3, zc), mixc(pal.gold, pal.orange, 0.3), [2.4, 0.3, 0.25]);
        sparkles.push([lx, 9.3, zc, 0.12, 0.2, rng(), 3.4, 2, 1.0, 0.6, 0.22]); bigLights.push([lx - sx * 0.6, 9.3, zc, 9]);
        if (k < 5) garland([sx * (AX - 1.75), 11.9, z - 1.3], [sx * (AX - 1.75), 11.9, z - BAYL + 1.3], 2.7, Math.round(36 * lerp(0.8, 1.1, density - 0.2)), 0.4);
        // pot with a fern or a geranium
        const px = sx * (AX - 4.2), pz = zc + (k % 2 ? 2.8 : -2.8), ps = rng.range(1.0, 1.3), fern = (k + (sx > 0 ? 1 : 0)) % 2 === 0;
        B.add(lathe([[0.02, 0], [0.8, 0], [0.86, 0.1], [1.25, 1.6], [1.42, 1.75], [1.42, 2.0], [1.2, 2.0], [1.15, 1.75], [0.02, 1.7]], 12), M(px, 0, pz, ps), (x, y, zz, o) => { o.copy(potC).multiplyScalar(y > 1.7 ? 0.75 : 0.9 + 0.1 * Math.sin(y * 9)); }, [0, 0.3, 0], 0.1, rng);
        if (fern) for (let f = 0; f < 11; f++) {
          const a = (f / 11) * TAU + rng.range(-0.2, 0.2), len = rng.range(3.2, 4.6) * ps, rise = rng.range(1.8, 3.0) * ps, col = fernC.clone().multiplyScalar(rng.range(0.7, 1.2));
          B.add(fnGeo(7, 2, (t, w) => { const r = 0.5 + t * len, y = 1.9 * ps + rise * Math.sin(t * 2.2) - t * t * 1.4, wd = (w - 0.5) * 1.3 * ps * Math.sin(Math.min(1, t * 1.15 + 0.08) * Math.PI); return [px + Math.cos(a) * r - Math.sin(a) * wd, y - Math.abs(w - 0.5) * 0.5, pz + Math.sin(a) * r + Math.cos(a) * wd]; }), I4, col, [0, 0.3, 0.35]);
        } else {
          const g = new THREE.IcosahedronGeometry(1.7 * ps, 1); B.add(g, M(px, 2.9 * ps, pz, 1, 0.8, 1), (x, y, zz, o) => { o.copy(fernC).multiplyScalar(0.6 + 0.5 * rng()); }, [0, 0.3, 0.2]);
          const gc = rng.pick(gerC);
          for (let f = 0; f < 9; f++) { const a = rng.range(0, TAU), el = rng.range(0.2, 1.4); addHead(px + Math.cos(a) * Math.cos(el) * 1.75 * ps, 2.9 * ps + Math.sin(el) * 1.5 * ps, pz + Math.sin(a) * Math.cos(el) * 1.75 * ps, Math.cos(a), 1, Math.sin(a), 0.5 * ps, gc.clone().multiplyScalar(rng.range(0.7, 1)), 0.3, 1.3); }
        }
        if (k % 2 === 1) for (let c = 0; c < 3; c++) addCandle(sx * (AX - 3.6 + rng.range(-0.8, 0.8)), 0, zc - 2.6 + rng.range(-1.2, 1.2), rng.int(0, 2), 1.1);
        await ctx.yield();
      }
      // candles beside the road as it swings round the fountain
      for (const sd of [-1, 1]) for (let z = zA - 3; z > zB + 3; z -= rng.range(3.4, 4.6)) {
        const x = pathX(z) + sd * (roadHW(z) + rng.range(1.7, 2.4));
        if (Math.hypot(x - FTN.x, z - FTN.z) > FTN.r + 2.2 && Math.hypot(x - DOG.x, z - DOG.z) > 6.2) addCandle(x, 0, z, rng.chance(0.5) ? 1 : 0, 1.15);
      }
      // broom against a column, clay jars near the kitchen door
      const bx = AX - 2.1, bz = zA - 3 * BAYL + 2.6;
      B.add(K.tubeGeo([V3(bx - 2.2, 0.9, bz + 0.5), V3(bx - 0.6, 10.5, bz)], () => 0.17, 6), I4, strawC.clone().multiplyScalar(0.6), [0, 0.2, 0]);
      B.add(lathe([[1.25, 0], [1.3, 0.3], [0.55, 2.5], [0.28, 2.9], [0.02, 2.95]], 9), M(bx - 2.35, 0, bz + 0.55, 1, 1, 0.5, 0, 0, 0.12), (x, y, zz, o) => { o.copy(strawC).multiplyScalar(0.55 + 0.4 * Math.abs(Math.sin(Math.atan2(zz, x) * 9 + y * 3))); }, [0, 0.1, 0]);
      for (const [jx, jz, js, ck] of [[-13, zB + 5, 1.7, false], [-10.6, zB + 7.4, 1.2, true], [13.5, zB + 5, 1.5, false], [-12.5, zA - 4.4, 1.4, false], [13, zA - 4.2, 1.6, true]]) {
        B.add(lathe([[0.02, 0], [0.5, 0], [0.56, 0.06], [0.86, 0.6], [1.0, 1.3], [0.8, 1.9], [0.5, 2.2], [0.62, 2.45], [0.5, 2.4], [0.4, 2.15]], 11), M(jx, 0, jz, js), (x, y, zz, o) => { o.copy(pal.terra).multiplyScalar(y > 1.0 && y < 1.5 ? 0.5 : 0.85); }, [0, 0.35, 0], 0.1, rng);
        bouquet(B, jx, 2.6 * js, jz, 1.1 * js, 14, ck);
      }
      await ctx.yield();
      // bougainvillea spilling over the left arcade roof
      for (let k = 0; k < Math.round(170 * density); k++) {
        const t = rng(), z = -150 - rng.range(0, 30) + rng.gauss() * 2, over = rng.chance(0.4), x = over ? -(AX - 3.1) : -lerp(AX - 3, AX + 6, t * t), y = over ? 26.4 - rng.range(0, 5.5) * rng() : lerp(26.6, 32, (-x - (AX - 3)) / (YW - AX + 3)) + 0.3;
        addHead(x + (over ? rng.range(0, 0.5) : 0), y, z, over ? 1 : 0.3, over ? 0.2 : 1, rng.range(-0.3, 0.3), rng.range(0.45, 0.8), mixc(pal.magenta, pal.violet, rng.range(0, 0.45)).multiplyScalar(rng.range(0.6, 0.95)), 0.22, 1.2);
      }
      await ctx.yield();
      // flags from arcade to arcade (clear of the tree)
      for (const z of [-93, -106, -119, -178, -184]) flagRows.push({ x0: -(AX - 1.2), x1: AX - 1.2, y: 25.2, z, sag: 4.6, n: 15, w: 3.5, h: 4.1, cord: 0.16, colors: z % 2 ? FLAGC.slice().reverse() : FLAGC });
      // the neighbours: a water tank and tiled ridges beyond the walls, one bell tower two streets off
      const far = mixc(pal.indigo, pal.terra, 0.25).multiplyScalar(0.55), SB = S.pat;
      SB.add(lathe([[3.4, 0], [3.5, 5], [3.2, 5.3], [0.02, 5.8]], 12), M(-29, YH + 2.6, zB - 12), far.clone().multiplyScalar(1.2), [0, 0.2, 7]);
      for (const a of [0.8, 2.4, 3.9, 5.5]) box(SB, -29 + Math.cos(a) * 2.6, YH + 1.3, zB - 12 + Math.sin(a) * 2.6, 0.5, 2.8, 0.5, far, [0, 0, 7]);
      for (const [x, y, z, w, d] of [[-70, 38, -120, 34, 60], [-66, 44, -175, 26, 40], [70, 40, -150, 36, 70], [66, 46, -100, 24, 30], [-40, 41, -215, 30, 30], [44, 43, -212, 34, 26]]) {
        box(SB, x, y / 2, z, w, y, d, far, [0, 0, 0]); box(SB, x, y + 0.7, z, w + 2, 1.4, d + 2, far.clone().multiplyScalar(1.3), [0, 0, 6]); }
      const tx = 44, tz = -292;
      box(SB, tx, 43, tz, 13, 86, 13, far, [0, 0, 7], 0, 2);
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) box(SB, tx + cx * 5.2, 94, tz + cz * 5.2, 2.6, 16, 2.6, far, [0, 0, 7]);
      for (const y of [86.6, 102.6]) box(SB, tx, y, tz, 14.8, 1.6, 14.8, far.clone().multiplyScalar(1.2), [0, 0, 7]);
      SB.add(new THREE.ConeGeometry(10, 16, 4), M(tx, 111.4, tz, 1, 1, 1, Math.PI / 4), far.clone().multiplyScalar(0.9), [0, 0, 6]);
      SB.add(new THREE.SphereGeometry(0.9, 6, 5), M(tx, 120, tz), far, [0, 0, 7]);
      SB.add(lathe([[0.02, 5.6], [1.0, 5.5], [1.8, 4.3], [2.5, 1.8], [3.6, 0.4], [3.8, 0]], 10), M(tx, 89.5, tz), hex('#6a5a30'), [0, 0.8, 7]);
      steam.push([-72, 40, -168, 70, 7, 0.1, 0.4], [64, 42, -236, 60, 6, 0.1, 0.4]);
    }
    await ctx.yield();

    // ================================================================ 3. the kitchen (z -192 .. -258), a through-room
    const zKa = ZK0 - WT, zKb = ZB0 + WT, plasterK = hex('#b39a72');
    const clayJar = (B, x, y, z, s, n = 13, ck = false) => {
      B.add(lathe([[0.02, 0], [0.5, 0], [0.56, 0.06], [0.86, 0.6], [1.0, 1.3], [0.8, 1.9], [0.5, 2.2], [0.62, 2.45], [0.5, 2.4], [0.4, 2.15]], 11), M(x, y, z, s), (px, py, pz, o) => { o.copy(pal.terra).multiplyScalar(py > 1.0 && py < 1.5 ? 0.5 : 0.85); }, [0, 0.35, 0], 0.1, rng);
      if (n) bouquet(B, x, y + 2.6 * s, z, 1.1 * s, n, ck);
    };
    const loaf = (B, x, y, z, s) => {
      const crust = hex('#c98a3c'), crustD = hex('#8a4f1c'), sugar = hex('#f1e2c0'), ry = rng.range(0, TAU);
      const cf = (px, py, pz, o) => { o.copy(crustD).lerp(crust, clamp(py * 1.4 + 0.45, 0, 1)); if (rng() < 0.3) o.lerp(sugar, 0.6); };
      B.add(new THREE.SphereGeometry(1, 12, 8), M(x, y + 0.5 * s, z, s * 0.9, s * 0.56, s * 0.9, ry), cf, [0, 0.15, 0]);
      for (let b = 0; b < 2; b++) B.add(new THREE.SphereGeometry(1, 8, 5), M(x, y + 0.86 * s, z, s * 0.92, s * 0.2, s * 0.17, ry + b * Math.PI / 2), cf, [0, 0.15, 0]);
      B.add(new THREE.SphereGeometry(1, 7, 5), M(x, y + 1.08 * s, z, s * 0.22), cf, [0, 0.15, 0]);
    };
    slabY(S.kit, -KW, KW, zKa, zKb, 0, 1, clayC, [0, 1, 5], 4);
    for (const sx of [-1, 1]) wallX(S.kit, sx * KW, zKa, zKb, 0, KH, -sx, plasterK, [0, 0.3, 3]);
    archFace(S.kit, zKa, -1, KW, KH, plasterK, [0, 0.3, 3]); archFace(S.kit, zKb, 1, KW, KH, plasterK, [0, 0.3, 3]);
    doorway(S.kit, ZB0, -1);
    slabY(S.kit, -KW, KW, zKa, zKb, KH, -1, ceilC, [0, 0, 0], 8);
    beamsX(S.kit, Array.from({ length: 12 }, (_, k) => zKa - 3 - k * 5.5), -KW, KW, KH, 1.5, 2.4, woodC);
    await ctx.yield();
    const POTS = [-205, -215.5, -226, -236.5, -247], BX = 15, BTOP = 3.4;
    {
      const B = S.kit, Pk = P.kit, iron = hex('#221d1c'), potC = hex('#7a3a26'), copper = hex('#b8642e');
      // the tiled bench stove along the right wall
      wallX(B, BX, -196, -252, 0, BTOP, -1, plasterK, [0, 0.4, 3], 3); wallZ(B, -196, BX, KW, 0, BTOP, 1, plasterK, [0, 0.4, 3]); wallZ(B, -252, BX, KW, 0, BTOP, -1, plasterK, [0, 0.4, 3]);
      slabY(B, BX, KW, -196, -252, BTOP, 1, clayC.clone().multiplyScalar(1.1), [0, 0.5, 5], 3);
      box(B, BX - 0.25, BTOP + 0.1, -224, 0.9, 0.7, 56.6, mixc(pal.cobalt, pal.indigo, 0.15).multiplyScalar(0.9), [0, 0.5, 7], 0, 8);
      for (const [i, z] of POTS.entries()) {
        // fire mouth: stone arch, dark recess, glowing charcoal behind an iron grate
        B.add(fnGeo(10, 1, (a, b) => { const an = Math.PI * a, r = 1.5 + b * 0.55; return [BX - 0.12, 1.0 + Math.sin(an) * r * 0.92, z + Math.cos(an) * r]; }), I4, stoneC, [0, 0.1, 7]);
        for (const dz of [-1.78, 1.78]) box(B, BX - 0.12, 0.5, z + dz, 0.2, 1.0, 0.55, stoneC, [0, 0.1, 7]);
        B.add(fnGeo(8, 2, (a, b) => { const an = Math.PI * a; return [BX - 0.06, lerp(0, 1.0 + Math.sin(an) * 1.38, b), z + Math.cos(an) * 1.5]; }), I4, hex('#0a0606'), [0, 0, 0]);
        for (let c = 0; c < 12; c++) Pk.add(new THREE.IcosahedronGeometry(rng.range(0.22, 0.4), 0), M(BX - 0.25 - rng.range(0, 0.5), 0.25 + rng.range(0, 0.9) * rng(), z + rng.range(-1.2, 1.2), 1, 0.8, 1, rng.range(0, 3)), new THREE.Color(1, rng.range(0.16, 0.42), 0.03), [rng.range(1.2, 3.4), 0, 0]);
        for (const dz of [-0.9, -0.3, 0.3, 0.9]) box(Pk, BX - 0.7, 0.95, z + dz, 0.12, 1.9, 0.12, iron, [0, 0.5, 0]);
        box(Pk, BX - 0.7, 0.12, z, 0.3, 0.24, 2.6, iron, [0, 0.5, 0]);
        bigLights.push([BX - 2.2, 1.0, z, 13], [BX + 3.4, BTOP + 0.6, z, 9]);
        // the glow of the fire: a soft bloom at the mouth, a bed of embers round the pot's foot, its belly lit from below
        sparkles.push([BX - 0.9, 1.1, z, 0.12, 0.3, rng(), 4.6, 3, 1.0, 0.36, 0.07], [BX + 3.4 - 2.6, BTOP + 0.7, z, 0.1, 0.4, rng(), 3.6, 3, 0.9, 0.3, 0.05]);
        for (let c = 0; c < 22; c++) { const a = rng.range(0, TAU), d = rng.range(1.5, 2.5); Pk.add(new THREE.IcosahedronGeometry(rng.range(0.16, 0.32), 0), M(BX + 3.4 + Math.cos(a) * d, BTOP + 0.2, z + Math.sin(a) * d, 1, 0.7, 1, rng.range(0, 3)), new THREE.Color(1, rng.range(0.14, 0.4), 0.03), [rng.range(0.8, 3.2), 0, 0]); }
        Pk.add(lathe([[1.46, 0.14], [2.36, 0.9], [2.66, 1.35]], 22), M(BX + 3.4, BTOP + 0.02, z, 1.02), (x, y, zz, o) => { o.setRGB(1, 0.34, 0.06).multiplyScalar(0.55 * (1 - (y - 0.14) / 1.3)); }, [0.75, 0, 0]);
        for (let c = 0; c < 9; c++) sparkles.push([BX - 0.6 + rng.range(-0.3, 0.3), 0.8, z + rng.range(-1, 1), rng.range(4, 10), rng.range(0.12, 0.3), rng(), rng.range(0.14, 0.24), 0, 1.6, 0.55, 0.12]);
        // the pot: a big clay olla with ears, a rattling lid (the middle pot stands open, just stirred)
        const px = BX + 3.4, s = rng.range(0.95, 1.08), open = i === 2, bandC = [pal.cobalt, hex('#e8dcc0'), pal.gold][i % 3];
        Pk.add(lathe([[0.02, 0], [1.2, 0], [1.4, 0.15], [2.3, 0.9], [2.75, 1.8], [2.6, 2.6], [2.05, 3.1], [1.9, 3.3], [2.1, 3.55], [1.95, 3.6], [1.75, 3.35], [1.7, 3.1]], 22), M(px, BTOP, z, s),
          (x, y, zz, o) => { o.copy(potC).multiplyScalar((0.7 + 0.25 * y / 3.6) * (0.9 + 0.12 * Math.sin(y * 17))); if (y < 1.0) o.lerp(hex('#140c0c'), 0.75 - y * 0.6); if (y > 2.45 && y < 2.75) o.copy(bandC).multiplyScalar(Math.sin(Math.atan2(zz, x) * 10) > 0 ? 0.75 : 0.4); }, [0, 0.55, 0], 0.08, rng);
        for (const dz of [-1, 1]) Pk.add(new THREE.TorusGeometry(0.62, 0.17, 6, 10), M(px, BTOP + 2.75 * s, z + dz * 2.45 * s, 1, 1, 1, 0, 0, Math.PI / 2), potC.clone().multiplyScalar(0.9), [0, 0.5, 0]);
        Pk.add(new THREE.CircleGeometry(1.85 * s, 18).rotateX(-Math.PI / 2), M(px, BTOP + 3.4 * s, z), hex('#3a1408'), [0.12, 1, 0]);
        if (!open) Pk.add(lathe([[0.02, 0.62], [0.3, 0.6], [0.36, 0.35], [0.2, 0.28], [0.5, 0.2], [1.7, 0.05], [2.05, -0.05], [2.0, -0.14], [0.02, -0.1]], 18), M(px, BTOP + 3.68 * s, z, s), (x, y, zz, o) => { o.copy(potC).multiplyScalar(0.95 + 0.2 * Math.sin(Math.hypot(x, zz) * 6)); }, [0, 0.55, 1.1 + i * 0.1]);
        else {
          Pk.add(K.tubeGeo([V3(px - 0.6, BTOP + 3.0, z + 0.3), V3(px - 1.6, BTOP + 5.4, z - 0.8), V3(px - 2.3, BTOP + 7.4, z - 1.5)], (t) => 0.16 + 0.04 * t, 6), I4, woodC.clone().multiplyScalar(1.4), [0, 0.3, 0]);
          for (let c = 0; c < 11; c++) Pk.add(new THREE.SphereGeometry(rng.range(0.24, 0.52), 8, 6), M(px + rng.range(-1.2, 1.2), BTOP + 3.4 * s, z + rng.range(-1.2, 1.2), 1, 0.5, 1), hex('#5a2410'), [0.2, 1, 1.5 + c * 0.07]);
        }
        steam.push([px - 0.3, BTOP + 3.5, z, open ? 28 : 22, open ? 8.5 : 6.5, 0.5, 0.8], [px + 0.5, BTOP + 3.5, z - 0.9, 17, 5, 0.7, 0.7], [px - 0.4, BTOP + 3.5, z + 1.0, 20, 6, 0.6, 0.75]);
        box(B, px, BTOP + 0.06, z, 4.4, 0.12, 4.4, hex('#1a1414'), [0, 0, 0]);
        await ctx.yield();
      }
      // the griddle on three stones, tortillas warming
      Pk.add(lathe([[0.02, 0.3], [2.7, 0.3], [2.9, 0.42], [2.85, 0.2], [0.02, 0.12]], 20), M(BX + 3.4, BTOP + 0.8, -198.9), iron, [0, 0.6, 0]);
      for (const a of [0.5, 2.6, 4.7]) Pk.add(new THREE.IcosahedronGeometry(0.75, 1), M(BX + 3.4 + Math.cos(a) * 1.8, BTOP + 0.45, -198.9 + Math.sin(a) * 1.8, 1, 0.75, 1), stoneC.clone().multiplyScalar(0.6), [0, 0.1, 0]);
      for (const [dx, dz] of [[-0.9, 0.6], [1.0, 0.2], [0, -1.1]]) Pk.add(new THREE.CylinderGeometry(0.85, 0.85, 0.07, 12), M(BX + 3.4 + dx, BTOP + 1.26, -198.9 + dz), hex('#e2cf9a'), [0.03, 0.1, 0]);
      // rail over the stove: copper pans, clay mugs, braids of chillies and garlic, all stirring in the heat
      Pk.add(K.tubeGeo([V3(KW - 1.6, 17.5, -197), V3(KW - 1.6, 17.5, -251)], () => 0.22, 6), I4, woodC, [0, 0.2, 0]);
      for (let k = 0; k < 19; k++) {
        await ctx.yield();
        const z = -198.5 - k * 2.85, x = KW - 1.6, kind = k % 4;
        if (kind === 0) { const r = rng.range(1.1, 1.5); Pk.add(lathe([[0.02, 0], [r, 0], [r + 0.15, 0.45], [r + 0.05, 0.45], [r - 0.08, 0.1], [0.02, 0.1]], 14), M(x + 0.3, 15.3 - r, z, 1, 1, 1, 0, 0, Math.PI / 2 - 0.12), copper, [0.02, 1, 0.3]); box(Pk, x + 0.2, 16.4, z, 0.22, 2.2, 0.12, copper.clone().multiplyScalar(0.6), [0, 0.8, 0.3]); }
        else if (kind === 2) { Pk.add(lathe([[0.02, 0], [0.42, 0], [0.52, 0.5], [0.5, 0.95], [0.44, 0.95], [0.44, 0.1], [0.02, 0.08]], 9), M(x, 15.3, z, 1.25), [pal.terra, pal.cobalt, hex('#d9cdb0')][k % 3].clone().multiplyScalar(0.8), [0, 0.5, 0.35]);
          Pk.add(new THREE.TorusGeometry(0.34, 0.09, 5, 8), M(x, 16.0, z + 0.78, 1, 1, 1, Math.PI / 2), pal.terra.clone().multiplyScalar(0.7), [0, 0.5, 0.35]); box(Pk, x, 16.95, z + 0.8, 0.07, 1.1, 0.07, iron, [0, 0, 0.35]); }
        else {
          const garlic = kind === 3, n = garlic ? 12 : 22, len = garlic ? 4.2 : 5.6;
          for (let c = 0; c < n; c++) { const t = c / n, a = c * 2.4, rr = garlic ? 0.42 : 0.3 + 0.25 * Math.sin(t * Math.PI);
            Pk.add(new THREE.SphereGeometry(garlic ? 0.36 : 0.2, 5, 4), M(x + Math.cos(a) * rr, 17.1 - t * len, z + Math.sin(a) * rr, 1, garlic ? 0.85 : 2.6, 1, 0, Math.cos(a) * 0.5, Math.sin(a) * 0.5), garlic ? hex('#d8cdb8').multiplyScalar(rng.range(0.8, 1)) : mixc(hex('#a3121a'), pal.magenta, rng.range(0, 0.3)).multiplyScalar(rng.range(0.6, 1)), [0.02, 0.7, 0.25 + 0.5 * t]); }
        }
      }
    }
    await ctx.yield();

    // ---- the patio's kitchen-door end: stone offering benches against the wall with banks of candles and jars of blooms, big
    // tin lanterns on brackets either side of the arch, candle clusters fanning out over the flags. Under a low moon this
    // wall and the floor before it are in shadow, so flame and lit paper have to carry them.
    {
      const B = P.pat, iron = hex('#221d1c'), lampC = mixc(pal.gold, pal.orange, 0.3);
      for (const sx of [-1, 1]) {
        const bx = sx * 23, bz = zB + 2.3;
        box(S.pat, bx, 2.9, bz, 13, 0.7, 3.6, stoneC, [0, 0.15, 7], 0, 4);
        box(S.pat, bx, 2.4, bz, 12.2, 0.4, 3.0, stoneC.clone().multiplyScalar(0.7), [0, 0.1, 7]);
        for (const dx of [-4.8, 0, 4.8]) box(S.pat, bx + dx, 1.1, bz, 1.6, 2.2, 2.8, stoneC.clone().multiplyScalar(0.85), [0, 0.1, 7]);
        for (let c = 0; c < 12; c++) addCandle(bx + (c - 5.5) * 0.98 + rng.range(-0.2, 0.2), 3.25, bz + rng.range(-1.1, 1.0), c % 4 === 1 ? 2 : rng.int(0, 1), 1.0, false);
        clayJar(B, bx - sx * 4.6, 3.25, bz - 0.2, 0.8, 9, false); clayJar(B, bx + sx * 5.2, 3.25, bz, 0.7, 8, sx > 0);
        moths.push([bx, 6, bz + 0.5, 3.6]);
        for (const lx of [sx * 12.6, sx * 27]) {
          const ly = 15.5, lz = zB + 1.7, sc = 1.9;
          box(B, lx, ly + 2.25 * sc, zB + 0.95, 0.22, 0.22, 1.9, iron, [0, 0.4, 0]);
          B.add(lathe([[0.02, 0], [0.42, 0.1], [0.55, 0.2], [0.55, 1.3], [0.42, 1.4], [0.6, 1.5], [0.25, 1.95], [0.02, 2.0]], 6), M(lx, ly, lz, sc), (x, y, zz, o) => { if (y > 0.25 && y < 1.3) o.copy(lampC); else o.copy(iron); }, [0, 0.4, 0.25]);
          B.add(new THREE.CylinderGeometry(0.46, 0.46, 1.0, 6, 1, true), M(lx, ly + 0.8 * sc, lz, sc), lampC, [2.4, 0.3, 0.25]);
          sparkles.push([lx, ly + 0.8 * sc, lz + 0.3, 0.12, 0.2, rng(), 5.4, 2, 1.0, 0.6, 0.22]); bigLights.push([lx, ly, lz + 1.2, 24], [lx, 21, lz + 5, 14]);
        }
        for (const [cx, cz, n] of [[13, 7, 6], [20, 12.5, 7], [29, 8.5, 6], [9, 15.5, 5], [26, 18, 5], [16, 21, 5]]) for (let c = 0; c < n; c++) { const a = rng.range(0, TAU), d = rng.range(0.3, 2.3); addCandle(sx * cx + Math.cos(a) * d, 0, zB + cz + Math.sin(a) * d, rng.int(0, 2), 1.25); }
      }
    }
    await ctx.yield();

    // a ladder-back chair (8x life size) into any batch; rockers optional
    function buildChair(B, m, rockers) {
      const wd = woodC.clone().multiplyScalar(1.25), add = (g, mm, c, a) => B.add(g, m.clone().multiply(mm), c, a);
      for (const sx of [-1, 1]) {
        add(lathe([[0.26, 0], [0.3, 1.2], [0.22, 1.5], [0.32, 2.2], [0.26, 3.2], [0.3, 4.4], [0.2, 5.3], [0.02, 5.4]], 8), M(sx * 2.0, 0.25, 1.8), wd, [0, 0.35, 0]);
        add(lathe([[0.26, 0], [0.3, 1.4], [0.24, 3.3], [0.3, 5.0], [0.22, 8.6], [0.3, 9.0], [0.34, 9.3], [0.02, 9.6]], 8), M(sx * 2.0, 0.25, -1.9, 1, 1, 1, 0, -0.07), wd, [0, 0.35, 0]);
        add(K.tubeGeo([V3(sx * 2.0, 5.4, 1.9), V3(sx * 2.05, 5.5, 0), V3(sx * 2.0, 5.3, -2.1)], (t) => 0.26 + 0.1 * Math.sin(t * Math.PI), 7), I4, wd, [0, 0.4, 0]);
        for (const y of [1.5, 2.6]) add(new THREE.CylinderGeometry(0.13, 0.13, 3.7, 6).rotateX(Math.PI / 2), M(sx * 2.0, y, 0), wd, [0, 0.3, 0]);
        if (rockers) add(K.tubeGeo(Array.from({ length: 9 }, (_, k) => { const t = k / 8 * 2 - 1; return V3(sx * 2.0, 0.28 + 1.5 * t * t - 0.05, t * 4.3 - 0.3); }), () => 0.24, 7), I4, wd, [0, 0.4, 0]);
      }
      for (const y of [1.3, 2.4]) for (const z of [1.8, -1.85]) add(new THREE.CylinderGeometry(0.13, 0.13, 4.0, 6).rotateZ(Math.PI / 2), M(0, y, z), wd, [0, 0.3, 0]);
      add(new THREE.BoxGeometry(4.4, 0.35, 4.1, 10, 1, 10), M(0, 3.45, 0), (x, y, z, o) => { const w = Math.sin(x * 7) * Math.sin(z * 7); o.copy(strawC).multiplyScalar(0.6 + 0.3 * (w > 0 ? 1 : 0.4)); }, [0, 0.2, 0]);
      for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(4.0, 0.8, 0.22, 6, 1, 1), M(0, 5.3 + k * 1.15, -2.02 - k * 0.08, 1, 1, 1, 0, -0.07), wd.clone().multiplyScalar(0.9), [0, 0.35, 0]);
    }
    // heads round a doorway arch, with two hanging tails
    function archGarland(z, face) {
      const n = Math.round(46 * density);
      for (let k = 0; k <= n; k++) { const an = Math.PI * (-0.12 + 1.24 * k / n), r = DOOR.hw + 1.25 + 0.25 * Math.sin(k * 0.9); addHead(Math.cos(an) * r, DOOR.spring + Math.sin(an) * r, z + face * 0.75, rng.range(-0.3, 0.3), rng.range(-0.2, 0.4), face, rng.range(0.5, 0.78), marigold(), 0.65); }
      for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) addHead(sx * (DOOR.hw + 1.4 + 0.2 * Math.sin(k)), DOOR.spring - 1.2 - k * 0.95, z + face * 0.75, sx * 0.3, 0, face, rng.range(0.45, 0.65), marigold(), 0.65);
    }
    archGarland(zPasEnd, 1); archGarland(zB, 1); archGarland(zKb, 1);
    await ctx.yield();
    {
      // the kitchen table on the left: sugared loaves, oranges, the grinding slab, candles
      const B = P.kit, tx = -12.5, tz = -224, TY = 6, wd = woodC.clone().multiplyScalar(1.2);
      B.add(new THREE.BoxGeometry(8.4, 0.7, 23, 4, 1, 12), M(tx, TY - 0.35, tz), (x, y, z, o) => { o.copy(wd).multiplyScalar(0.8 + 0.25 * Math.abs(Math.sin(x * 2.2)) + 0.1 * Math.sin(z * 9)); }, [0, 0.35, 0]);
      box(B, tx, TY - 1.3, tz, 7.2, 1.0, 21.6, wd.clone().multiplyScalar(0.7), [0, 0.2, 0]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(lathe([[0.5, 0], [0.55, 0.6], [0.36, 1.0], [0.5, 2.2], [0.34, 3.6], [0.55, 4.2], [0.55, 4.9]], 9), M(tx + sx * 3.3, 0, tz + sz * 10.3), wd.clone().multiplyScalar(0.85), [0, 0.3, 0]);
      for (const sz of [-1, 1]) box(B, tx, 1.2, tz + sz * 10.3, 6.6, 0.5, 0.5, wd.clone().multiplyScalar(0.7), [0, 0.2, 0]);
      box(B, tx, 1.2, tz, 0.5, 0.5, 20.6, wd.clone().multiplyScalar(0.7), [0, 0.2, 0]);
      for (const [dx, dz, s] of [[1.6, 7.6, 1.5], [-1.4, 5.6, 1.35], [1.8, 3.4, 1.4], [-0.6, 8.9, 1.2], [0.4, 5.9, 1.25]]) loaf(B, tx + dx, TY, tz + dz, s);
      B.add(lathe([[0.02, 0], [1.2, 0], [2.2, 0.4], [2.45, 0.56], [2.3, 0.62], [1.2, 0.26], [0.02, 0.22]], 14), M(tx + 0.8, TY, tz - 0.6), pal.cobalt.clone().multiplyScalar(0.7), [0, 0.6, 0]);
      for (let l = 0, n = 3; n >= 1; n--, l++) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) B.add(new THREE.SphereGeometry(0.62, 9, 7), M(tx + 0.8 + (a - (n - 1) / 2) * 1.2, TY + 0.95 + l * 0.95, tz - 0.6 + (b - (n - 1) / 2) * 1.2, 1, 0.94, 1), hex('#ff8a1c').multiplyScalar(rng.range(0.75, 1.05)), [0.06, 0.4, 0]);
      await ctx.yield();
      // metate: a sloping stone slab on three feet with its roller
      B.add(new THREE.BoxGeometry(3.2, 0.5, 5.0, 3, 1, 5), M(tx - 0.6, TY + 1.2, tz - 6.2, 1, 1, 1, 0.3, 0.2), hex('#4a4744'), [0, 0.15, 0], 0.15, rng);
      for (const [dx, dz, h] of [[-1.1, -1.8, 1.5], [1.1, -1.8, 1.5], [0, 1.9, 0.7]]) B.add(new THREE.CylinderGeometry(0.3, 0.2, h, 6), M(tx - 0.6 + dx * 0.9 + dz * 0.25, TY + h / 2, tz - 6.2 + dz * 0.9, 1, 1, 1), hex('#3f3c3a'), [0, 0.1, 0]);
      B.add(new THREE.CylinderGeometry(0.42, 0.42, 3.6, 8).rotateZ(Math.PI / 2), M(tx - 0.5, TY + 1.95, tz - 6.6, 1, 1, 1, 0.3), hex('#57534f'), [0, 0.2, 0]);
      for (const [dx, dz] of [[-2.9, 9.6], [2.6, 0.9], [-2.6, -2.4], [2.9, -9.4], [-0.2, -9.9]]) addCandle(tx + dx, TY, tz + dz, rng.int(0, 1), 1.2, false);
      clayJar(B, tx - 2.4, TY, tz + 1.6, 0.9, 11); moths.push([tx, TY + 3.5, tz + 2, 3.2], [tx, TY + 3, tz - 7, 2.6]);
      await ctx.yield();
      // plate shelves on the left wall, jars and buckets of blooms on the floor
      for (const y of [11, 16.5]) { box(B, -KW + 1.1, y, -224, 2.2, 0.4, 36, wd, [0, 0.3, 0], 0, 6);
        for (let k = 0; k < 13; k++) { const z = -207.5 - k * 2.75, c = [pal.cobalt, hex('#d9cdb0'), pal.gold, pal.terra][(k + (y > 12 ? 1 : 0)) % 4];
          B.add(lathe([[0.02, 0], [0.5, 0.02], [1.0, 0.16], [1.15, 0.2], [1.1, 0.26], [0.5, 0.1], [0.02, 0.08]], 12), M(-KW + 0.75, y + 1.35, z, 1, 1, 1, 0, 0, -Math.PI / 2 + 0.22), (px, py, pz, o) => { const r = Math.hypot(px, pz); o.copy(r > 0.85 ? c : r > 0.55 ? hex('#d9cdb0') : c).multiplyScalar(0.8); }, [0, 0.8, 0]); }
        await ctx.yield(); }
      for (const [jx, jz, js, ck] of [[-9.2, -197.5, 1.5, false], [-9.5, -199, 1.2, true], [-19, -247, 1.7, false], [-14.5, -251.5, 1.3, false], [12.5, -254.5, 1.4, true], [-9.0, -253.5, 1.25, false]]) clayJar(B, jx, 0, jz, js, 14, ck);
      await ctx.yield();
      for (const sd of [-1, 1]) for (let z = zKa - 4; z > zKb + 3; z -= rng.range(3.6, 4.8)) { const x = pathX(z) + sd * (roadHW(z) + rng.range(1.6, 2.2)); if (x < BX - 2.5) addCandle(x, 0, z, rng.chance(0.5) ? 1 : 0, 1.15); }
    }
    await ctx.yield();

    // ================================================================ 4. the best room (z -262 .. -390)
    const zBa = ZB0 - WT, blueW = mixc(mixc(mixc(pal.indigo, pal.cobalt, 0.55), hex('#8a8aa0'), 0.14), pal.violet, 0.42).multiplyScalar(1.25);
    const blueFn = (x, y, z, o) => { o.copy(blueW).multiplyScalar(1 - 0.45 * clamp(y / BH, 0, 1)); };
    slabY(S.best, -BW, BW, zBa, ZEND, 0, 1, clayC.clone().multiplyScalar(0.9), [0, 1, 5], 4);
    for (const sx of [-1, 1]) wallX(S.best, sx * BW, zBa, ZEND, 0, BH, -sx, blueFn, [0, 0, 9]);
    await ctx.yield();
    archFace(S.best, zBa, -1, BW, BH, blueFn, [0, 0, 9]);
    slabY(S.best, -BW, BW, zBa, ZEND, BH, -1, ceilC, [0, 0, 0], 10);
    await ctx.yield();
    beamsX(S.best, Array.from({ length: 20 }, (_, k) => zBa - 3 - k * 6.5), -BW, BW, BH, 1.8, 2.8, woodC);
    for (const sx of [-1, 1]) box(S.best, sx * 12, BH - 3.6, (zBa + ZEND) / 2, 2.2, 1.8, zBa - ZEND, woodD, [0, 0.05, 4], 0, 10);
    await ctx.yield();
    const winQuads = [];
    const chair = K.makeBatch(), CHAIR = { x: -15.5, z: -297, ry: Math.PI - 0.5 };
    {
      const B = S.best, Pb = P.best;
      // two tall shuttered windows, a slit of night sky between the leaves
      for (const sx of [-1, 1]) {
        const x = sx * BW, z = -322, fr = hex('#a8763a'), lf = hex('#4a2c1a');
        winQuads.push(quadGeo(V3(x - sx * 0.12, 9, sx > 0 ? z - 3.2 : z + 3.2), V3(0, 0, sx * 6.4), V3(0, 21, 0), 8));
        if (L.wet > 0.8) for (let k = 0; k < 14; k++) sparkles.push([x - sx * 0.3, 30, z + rng.range(-3, 3), 21, rng.range(0.5, 0.9), rng(), 0.17, 1, 0.5, 0.66, 1.0]);
        for (const dz of [-4.9, 4.9]) box(Pb, x - sx * 0.5, 19.5, z + dz, 1.0, 22.6, 0.9, fr, [0, 0.3, 0]);
        for (const y of [8.4, 30.6]) box(Pb, x - sx * 0.5, y, z, 1.0, 0.9, 10.7, fr, [0, 0.3, 0]);
        box(Pb, x - sx * 0.9, 7.7, z, 1.8, 0.5, 12, stoneC, [0, 0.1, 0]);
        for (const sd of [-1, 1]) {
          const ang = sd * (0.55 + 0.12 * sd * sx), hz = z + sd * 4.4, m = M(x - sx * 0.7, 19.5, hz, 1, 1, 1, (sx > 0 ? Math.PI : 0) + ang * sx);
          const leaf = (g, mm, c, a) => Pb.add(g, m.clone().multiply(mm), c, a);
          for (const dz of [0.25, 2.6]) leaf(new THREE.BoxGeometry(0.3, 21.4, 0.5), M(0, 0, -sd * dz * sx), lf, [0, 0.3, 0.04]);
          for (const y of [-10.4, 0, 10.4]) leaf(new THREE.BoxGeometry(0.3, 0.6, 2.85), M(0, y, -sd * 1.42 * sx), lf, [0, 0.3, 0.04]);
          for (let k = 0; k < 16; k++) leaf(new THREE.BoxGeometry(0.12, 0.85, 2.3), M(0, -9.5 + k * 1.27 + (k > 7 ? 0.3 : 0), -sd * 1.42 * sx, 1, 1, 1, 0, 0, 0.5), lf.clone().multiplyScalar(0.8 + 0.3 * (k % 2)), [0, 0.3, 0.04]);
        }
        // candle shelves along the walls and a row of plain chairs, a glass of water set at each
        for (const zs of [-276, -300, -346, -366]) {
          shelf(B, x, sx, 10.43, zs, 5.4);
          for (let c = 0; c < 5; c++) addCandle(x - sx * rng.range(0.5, 1.3), 10.43, zs + (c - 2) * 1.0 + rng.range(-0.2, 0.2), c % 2 ? 2 : rng.int(0, 1), 0.9, false);
          moths.push([x - sx * 1.6, 12.6, zs, 2.4]);
        }
        // high niches with a few votives, and marigold swags pegged along the wall (one over the window)
        for (const zs of [-288, -356]) { shelf(B, x, sx, 21.43, zs, 4.2); for (let c = 0; c < 4; c++) addCandle(x - sx * rng.range(0.5, 1.2), 21.43, zs + (c - 1.5) * 0.95, c % 2 ? 0 : 2, 0.9, false); }
        for (const [z0, z1, yp, sg] of [[-266, -288, 28, 3.4], [-288, -310, 28, 3.4], [-311, -333, 35, 2.2], [-334, -356, 28, 3.4], [-356, -378, 28, 3.4]]) {
          const n = Math.round(24 * lerp(0.8, 1.1, density - 0.2));
          for (let k = 0; k <= n; k++) { const t = k / n; addHead(x - sx * rng.range(0.35, 0.6), yp - sg * 4 * t * (1 - t) + rng.range(-0.1, 0.1), lerp(z0, z1, t), -sx, rng.range(-0.2, 0.4), 0.45, (k === 0 || k === n ? 0.85 : 0.6) * rng.range(0.85, 1.15), marigold(), 0.6); }
        }
        await ctx.yield();
      }
      for (const [z, ry] of [[-282, -Math.PI / 2 + 0.1], [-291, -Math.PI / 2 - 0.08], [-338, -Math.PI / 2 + 0.05]]) {
        buildChair(Pb, M(BW - 5.2, 0, z, 1, 1, 1, ry), false);
        Pb.add(lathe([[0.02, 0], [0.24, 0], [0.26, 0.03], [0.31, 0.74], [0.325, 0.76], [0.29, 0.74], [0.25, 0.1], [0.02, 0.08]], 9), M(BW - 5.6, 3.63, z + 0.6, 1.5), hex('#9fc4e6'), [0.12, 1, 0]);
        await ctx.yield();
      }
      // the rocking chair on the left, still moving, a shawl over its arm; the guitar on the wall behind it
      buildChair(chair, I4, true);
      const stripes = [pal.magenta, pal.violet, pal.indigo, pal.magenta, pal.orange];
      chair.add(new THREE.BoxGeometry(1.5, 0.22, 4.6, 3, 1, 14), M(2.05, 5.72, -0.2), (x, y, z, o) => { const k = Math.floor((z + 3) * 2.2); o.copy(stripes[((k % 5) + 5) % 5]).multiplyScalar(k % 2 ? 0.85 : 0.6); }, [0, 0, 0]);
      for (const sd of [-1, 1]) chair.add(new THREE.BoxGeometry(0.16, 2.6, 4.4, 1, 4, 14), M(2.05 + sd * 0.72, 4.5, -0.2 + sd * 0.1), (x, y, z, o) => { const k = Math.floor((z + 3) * 2.2); o.copy(stripes[((k % 5) + 5) % 5]).multiplyScalar((k % 2 ? 0.85 : 0.6) * (0.7 + 0.1 * y)); }, [0, 0, 0]);
      await ctx.yield();
      const gm = M(-BW + 0.75, 17, -304, 1, 1, 1, Math.PI / 2, 0, 0.3), gw = hex('#b06a2c'), gadd = (g, mm, c, a) => Pb.add(g, gm.clone().multiply(mm), c, a);
      gadd(new THREE.CylinderGeometry(2.5, 2.5, 1.1, 20).rotateX(Math.PI / 2), M(0, -2.2, 0), gw, [0, 0.8, 0]);
      gadd(new THREE.CylinderGeometry(1.9, 1.9, 1.1, 18).rotateX(Math.PI / 2), M(0, 0.9, 0), gw, [0, 0.8, 0]);
      gadd(new THREE.CylinderGeometry(1.6, 1.6, 1.08, 14).rotateX(Math.PI / 2), M(0, -0.5, 0), gw, [0, 0.8, 0]);
      gadd(new THREE.CircleGeometry(0.85, 16), M(0, 0.1, 0.57), hex('#120a08'), [0, 0, 0]);
      gadd(new THREE.BoxGeometry(0.62, 6.6, 0.4), M(0, 5.6, 0.35), woodD, [0, 0.5, 0]);
      gadd(new THREE.BoxGeometry(0.95, 1.7, 0.4), M(0, 9.6, 0.25, 1, 1, 1, 0, -0.12), woodC, [0, 0.5, 0]);
      gadd(new THREE.BoxGeometry(1.7, 0.3, 0.2), M(0, -3.0, 0.62), woodD, [0, 0.4, 0]);
      for (let k = 0; k < 5; k++) gadd(new THREE.BoxGeometry(0.05, 11.6, 0.05), M((k - 2) * 0.1, 3.0, 0.68), hex('#d8c9a0'), [0.15, 1, 0]);
      await ctx.yield();
      // floor censers by the carpet, their smoke rising into the haze; jars of blooms by the door
      for (const sx of [-1, 1]) {
        Pb.add(lathe([[0.02, 0], [1.3, 0], [1.4, 0.2], [0.65, 0.55], [0.45, 1.4], [0.75, 1.95], [1.55, 2.55], [1.9, 3.4], [1.8, 3.8], [1.58, 3.75], [1.5, 3.35], [0.02, 3.25]], 14), M(sx * 20.5, 0, -333), (x, y, z, o) => { o.copy(hex('#2a1a18')).lerp(pal.terra, 0.4); if (y > 2.7 && y < 3.1) o.copy(sx > 0 ? pal.cobalt : pal.magenta).multiplyScalar(0.8); }, [0, 0.45, 0]);
        Pb.add(new THREE.CircleGeometry(1.5, 12).rotateX(-Math.PI / 2), M(sx * 20.5, 3.5, -333), new THREE.Color(1, 0.3, 0.05), [2.6, 0, 0]);
        steam.push([sx * 20.5, 3.7, -333, 34, 6.5, 0.28, 0.25], [sx * 20.5 + 0.6, 3.7, -332.5, 26, 4.5, 0.36, 0.2]);
        clayJar(Pb, sx * 13.5, 0, zBa - 5, 1.7, 15, sx > 0); clayJar(Pb, sx * 17.5, 0, zBa - 4.2, 1.2, 12, false);
        for (let c = 0; c < 7; c++) addCandle(sx * (22 + rng.range(-2.4, 2.4)), 0, -333 + rng.range(-3.5, 3.5) + (c < 3 ? 6 : 0), rng.int(0, 2), 1.2);
        await ctx.yield();
      }
      for (const sx of [-1, 1]) for (const [z, js] of [[-287, 1.7], [-311, 1.4], [-352, 1.8]]) { clayJar(Pb, sx * 26.4, 0, z, js, 14, z === -311);
        for (let c = 0; c < 4; c++) addCandle(sx * (24 + rng.range(-1.5, 1.2)), 0, z + rng.range(-4, 4), rng.int(0, 2), 1.1); }
      await ctx.yield();
      for (const sx of [-1, 1]) for (const [z0, z1] of [[-266, -310], [-334, -378]]) {
        flagRows.push({ zrow: true, x0: sx > 0 ? z0 : z1, x1: sx > 0 ? z1 : z0, y: 34.6, z: sx * (BW - 0.55), face: -sx, sag: 1.5, n: 12, w: 3.0, h: 3.5, cord: 0.13, colors: sx > 0 ? FLAGC : FLAGC.slice().reverse() });
        for (const f of [0.25, 0.75]) bigLights.push([sx * (BW - 3.2), 30.5, lerp(z0, z1, f), 7]);
      }
      for (let k = 0; k < 4; k++) flagRows.push({ x0: -BW + 0.4, x1: BW - 0.4, y: 37.5, z: -272 - k * 11.5, sag: 4.2, n: 14, w: 3.3, h: 3.9, cord: 0.15, colors: k % 2 ? FLAGC.slice().reverse() : FLAGC });
      for (const g of hero.anchors.candleGroups) moths.push([g.position.x * 0.92, g.position.y + 1.2, g.position.z + HERO_Z + 0.6, 3.6], [g.position.x * 0.6 + rng.range(-2, 2), g.position.y + 2.4, g.position.z + HERO_Z + 0.5, 2.6]);
    }
    await ctx.yield();

    // ================================================================ the road, its flower edges and loose petals
    const roadPts = [];
    for (let z = Z0; z >= ZB0 - 0.01; z -= 3) roadPts.push([pathX(z), z, 2 * roadHW(z)]);
    const road = buildPetalRoad(ctx, { points: roadPts, y: 0.15, palette: PALETTE, uniforms: U });
    road.object.frustumCulled = false; scene.add(road.object);
    await ctx.yield();
    for (const sd of [-1, 1]) for (let z = Z0 - 0.5; z > ZB0; z -= rng.range(0.8, 1.6) / Math.max(detail * density, 0.6)) addHead(pathX(z) + sd * (roadHW(z) + rng.range(-0.25, 0.55)), 0.2, z, rng.range(-0.3, 0.3), 1, rng.range(-0.3, 0.3), rng.range(0.32, 0.52), marigold(), 0.9);
    await ctx.yield();
    const nLoose = Math.round((lookName === 'dawn' ? 2600 : 1500) * detail);
    for (let k = 0; k < nLoose; k++) {
      if ((k & 511) === 0) await ctx.yield();   // every 512 petals
      const z = rng.range(ZB0, Z0), wide = lookName === 'dawn' && k % 3 === 0, c = marigold();
      const lat = (roadHW(z) - 0.4 + Math.abs(rng.gauss()) * (wide ? 6 : 1.8)) * rng.sign(), x = pathX(z) + lat;
      if (Math.hypot(x - FTN.x, z - FTN.z) < FTN.r + 0.8 || (z < ZP0 && z > ZP0 - 2 * WT - 1 && Math.abs(x) > DOOR.hw - 0.5)) continue;
      loose.push([x, 0.07, z, rng.range(0.17, 0.32), c.r, c.g, c.b]);
    }
    for (let k = 0; k < Math.round(3400 * detail); k++) {
      if ((k & 511) === 0) await ctx.yield();
      const z = rng.range(ZB0, Z0), c = marigold(); loose.push([pathX(z) + rng.range(-1, 1) * roadHW(z) * 0.97, 0.25, z, rng.range(0.2, 0.36), c.r, c.g, c.b]);
    }
    // drips from the eaves after rain; warm motes hanging in the rooms
    if (L.wet > 0.8) for (const sx of [-1, 1]) for (let z = zA - 1; z > zB + 1; z -= rng.range(1.6, 3.0)) sparkles.push([sx * (AX - 3.05), 26.2, z, 26, rng.range(0.45, 0.8), rng(), 0.13, 1, 0.45, 0.62, 1.0]);
    for (let k = 0; k < Math.round(150 * detail); k++) { const z = rng.range(ZEND + 30, Z0); if (z < zA && z > zB) continue; sparkles.push([pathX(z) + rng.range(-9, 9), rng.range(2.5, 15), z, rng.range(1.5, 4), 0.1, rng(), rng.range(0.07, 0.13), 3, 0.9, 0.55, 0.22]); }

    // ================================================================ assemble
    const addMesh = (geo, mat, name, order) => { const m = new THREE.Mesh(geo, mat); m.name = name; if (order !== undefined) m.renderOrder = order; scene.add(m); return m; };
    for (const k of ['pas', 'pat', 'kit', 'best']) { addMesh(await S[k].build(bake, ctx), houseMat, 'shell-' + k); await ctx.yield(); addMesh(await P[k].build(bake, ctx), propMat, 'props-' + k); await ctx.yield(); }
    const cset = makeCandleSet(U, candles, bake, rng, L.burn); scene.add(cset.body, cset.flames);
    await ctx.yield();
    scene.add(await makeHeadSet(U, heads, bake, rng, ctx));
    await ctx.yield();
    scene.add(makeLoosePetalSet(U, loose, rng));
    await ctx.yield();
    scene.add(makeFlagSet(U, flagRows, bake, rng));
    await ctx.yield();
    const bakeAt = (ox, oy, oz) => (x, y, z, nx, ny, nz) => bake(x + ox, y + oy, z + oz, nx, ny, nz);
    {
      const fb = bakeAt(FTN.x, 0, FTN.z), fc = makeCandleSet(U, floatC, fb, rng, 0);
      ftn.add(fc.body, fc.flames, await makeHeadSet(U, floatH, fb, rng, ctx)); scene.add(ftn);
    }
    await ctx.yield();
    // dog (or a sleeping pair), cat, rocking chair
    const dog = new THREE.Group(), dogNeck = new THREE.Group(); dog.position.set(DOG.x, 0, DOG.z); dog.rotation.y = DOG.ry; dog.scale.setScalar(DOG.s);
    const dogBake = (x, y, z, nx, ny, nz) => { const c = Math.cos(DOG.ry), sn = Math.sin(DOG.ry); return bake(DOG.x + (x * c + z * sn) * DOG.s, y * DOG.s, DOG.z + (-x * sn + z * c) * DOG.s, nx * c + nz * sn, ny, -nx * sn + nz * c); };
    const dogG = await dogBody.build(dogBake, ctx), dogHG = await dogHead.build((x, y, z, nx, ny, nz) => dogBake(x, y + 1.5, z + 2, nx, ny, nz), ctx);
    dog.add(new THREE.Mesh(dogG, propMat)); dogNeck.position.set(0, 1.5, 2.0); dogNeck.add(new THREE.Mesh(dogHG, propMat)); dog.add(dogNeck); scene.add(dog);
    let dog2Neck = null;
    if (cast.dogPair) {
      const d2 = new THREE.Group(); d2.position.set(DOG.x - 2.8, 0, DOG.z - 4); d2.rotation.y = DOG.ry + 0.3; d2.scale.setScalar(DOG.s * 0.84);
      dog2Neck = new THREE.Group(); dog2Neck.position.set(0, 1.5, 2.0); dog2Neck.rotation.set(0.62, 0.5, 0); dog2Neck.add(new THREE.Mesh(dogHG, propMat));
      d2.add(new THREE.Mesh(dogG, propMat), dog2Neck); scene.add(d2);
    }
    const cat = new THREE.Group(), catTailG = new THREE.Group(); cat.position.set(CAT.x, CAT.y, CAT.z); cat.scale.setScalar(1.4);
    cat.add(new THREE.Mesh(await catBody.build(() => 0.05, ctx), propMat)); catTailG.position.set(0.5, 0.2, 2.05); catTailG.add(new THREE.Mesh(await catTail.build(() => 0.05, ctx), propMat)); cat.add(catTailG); scene.add(cat);
    const chairG = new THREE.Group(); chairG.position.set(CHAIR.x, 0, CHAIR.z); chairG.rotation.order = 'YXZ'; chairG.rotation.y = CHAIR.ry;
    chairG.add(new THREE.Mesh(await chair.build(bakeAt(CHAIR.x, 0, CHAIR.z), ctx), propMat)); scene.add(chairG);
    await ctx.yield();

    // instanced extras: wet streaks, sparkles, moths and bats, steam ribbons, haze sheets, the gust ribbon
    const inst = (base, attrs, n, mat, name, order) => {
      const g = new THREE.InstancedBufferGeometry(); if (base.index) g.index = base.index; g.setAttribute('position', base.attributes.position);
      for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k][0]), attrs[k][1]));
      g.instanceCount = n; const m = addMesh(g, mat, name, order); m.frustumCulled = false; return m;
    };
    {
      const q = new THREE.PlaneGeometry(2, 1); q.translate(0, 0.5, 0);
      inst(q, { iPos: [streaks.flat(), 4] }, streaks.length, streakMaterial(U), 'wet-streaks', 1);
      const sq = new THREE.PlaneGeometry(2, 2), A = [], Bq = [], C = [];
      for (const s of sparkles) { A.push(s[0], s[1], s[2], s[3]); Bq.push(s[4], s[5], s[6], s[7]); C.push(s[8], s[9], s[10]); }
      inst(sq, { iA: [A, 4], iB: [Bq, 4], iC: [C, 3] }, sparkles.length, sparkleMaterial(U), 'sparkles', 4);
      // flyers
      const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, 0, 0, -0.5, -1, 0, 0.1, 1, 0, 0.1, -0.75, 0, -0.5, 0.75, 0, -0.5], 3)); wing.setIndex([0, 2, 1, 0, 1, 3, 1, 2, 4, 1, 5, 3]);
      const fA = [], fB = [], fC = [], nMoth = Math.round(72 * L.moths * detail);
      for (let k = 0; k < nMoth; k++) { const c = moths[k % moths.length]; fA.push(c[0], c[1] + rng.range(-0.6, 1.2), c[2], c[3] * rng.range(0.5, 1.1)); fB.push(rng.range(0.7, 1.6) * rng.sign(), rng(), rng.range(0.3, 0.46), 0); const w = rng.range(0.75, 1); fC.push(w, w * 0.92, w * 0.74); }
      const nBat = cast.swallows ? 6 : 2;
      for (let k = 0; k < nBat; k++) { fA.push(rng.range(-6, 6), 45 + k * 2.2, FTN.z + rng.range(-8, 8), rng.range(26, 36)); fB.push(rng.range(0.3, 0.45) * (k % 2 ? 1 : -1), rng(), cast.swallows ? 1.1 : 1.5, 1); fC.push(0.08, 0.08, 0.14); }
      inst(wing, { iA: [fA, 4], iB: [fB, 4], iC: [fC, 3] }, nMoth + nBat, flyerMaterial(U), 'moths-and-bats');
      await ctx.yield();
      // steam and smoke ribbons
      const SEG = 12, sP = [], sUV = [], sBA = [], sPH = [], sD = [], sI = []; let v0 = 0;
      for (const s of steam) { const ph = rng();
        for (let j = 0; j <= SEG; j++) for (const sd of [-1, 1]) { sP.push(s[0], s[1], s[2]); sUV.push(sd, j / SEG); sBA.push(s[0], s[1], s[2]); sPH.push(ph); sD.push(s[3], s[4], s[5], s[6]); }
        for (let j = 0; j < SEG; j++) { const a = v0 + j * 2; sI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        v0 += (SEG + 1) * 2; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sP, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(sUV, 2));
      sg.setAttribute('aBase', new THREE.Float32BufferAttribute(sBA, 3)); sg.setAttribute('aPh', new THREE.Float32BufferAttribute(sPH, 1)); sg.setAttribute('aDim', new THREE.Float32BufferAttribute(sD, 4)); sg.setIndex(sI);
      addMesh(sg, steamMaterial(U), 'steam', 2).frustumCulled = false;
      // haze: incense layers in the best room and a veil in every doorway
      const mP = [], mUV = [], mK = [], mI = []; let m0 = 0;
      const sheet = (a, b, c, d, k) => { for (const [p, uv] of [[a, [0, 0]], [b, [1, 0]], [c, [1, 1]], [d, [0, 1]]]) { mP.push(...p); mUV.push(...uv); mK.push(...k); } mI.push(m0, m0 + 1, m0 + 2, m0, m0 + 2, m0 + 3); m0 += 4; };
      [9.5, 15, 22, 31].forEach((y, i) => sheet([-BW, y, zBa - 4], [BW, y, zBa - 4], [BW, y, ZEND + 6], [-BW, y, ZEND + 6], [16, 0.15 - i * 0.02, i + 1]));
      for (const [z, g] of [[ZP0, 0.2], [ZK0, 0.34], [ZB0, 0.42]]) sheet([-9, 0, z], [9, 0, z], [9, 27, z], [-9, 27, z], [34, g, z * 0.1]);
      sheet([-KW, 13, zKa - 3], [KW, 13, zKa - 3], [KW, 13, zKb + 3], [-KW, 13, zKb + 3], [14, 0.14, 7]);
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(mP, 3)); mg.setAttribute('uv', new THREE.Float32BufferAttribute(mUV, 2)); mg.setAttribute('aK', new THREE.Float32BufferAttribute(mK, 3)); mg.setIndex(mI);
      addMesh(mg, mistMaterial(U), 'haze', 5).frustumCulled = false;
      if (rare) {
        const petal = new THREE.PlaneGeometry(1.2, 2, 2, 1).rotateX(-Math.PI / 2);
        const gA = [], gB = [], nG = Math.round(7600 * detail);
        for (let k = 0; k < nG; k++) { const c = marigold(), sd = rng.sign(), stray = rng.chance(0.05); gA.push(rng(), sd * Math.max(3.6, 5.6 + rng.gauss() * (stray ? 2.2 : 0.55)), rng.gauss() * (stray ? 2.2 : 0.6) - 0.3, rng()); gB.push(c.r, c.g, c.b, rng.range(0.13, 0.24)); }
        inst(petal, { iA: [gA, 4], iB: [gB, 4] }, nG, gustMaterial(U), 'gust-ribbon');
      }
    }
    await ctx.yield();
    // the sky, seen over the patio and nowhere else
    const moonDir = V3(-0.52 * L.side, 0.44, -0.73).normalize();
    const SU = { uZen: { value: hex(L.zen).multiplyScalar(L.skyGain) }, uHor: { value: hex(L.hor).multiplyScalar(L.skyGain) }, uEast: { value: hex(L.east).multiplyScalar(L.skyGain) }, uGlowC: { value: hex(L.glow) }, uGlowK: { value: L.glowK }, uStars: { value: L.stars },
      uMoon: { value: L.moon }, uFull: { value: L.full }, uMoonDir: { value: moonDir }, uTime: { value: 0 }, uRockets: { value: L.rockets }, uBurst: { value: 0 }, uSide: { value: L.side } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), skyMaterial(SU)); sky.frustumCulled = false; sky.renderOrder = -1; sky.name = 'sky'; scene.add(sky);
    {
      // the best room's window panes show that same sky; a dusty shaft of the key light slants in from the left one
      const wP = []; for (const g of winQuads) { const q = g.toNonIndexed(); wP.push(...q.attributes.position.array); q.dispose(); g.dispose(); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wP, 3));
      const panes = new THREE.Mesh(wg, skyMaterial(SU, true, L.paneK ?? 1)); panes.name = 'window-sky'; scene.add(panes);
      if (L.shaft > 0) {
        const sP = [], sUV = [], sWt = [], sI = [], NS = 9;
        for (let k = 0; k < NS; k++) { const f = k / (NS - 1) * 2 - 1, zc = -322 + f * 3.4, w = 1 - 0.6 * f * f;
          sP.push(-29.8 * L.side, 31.5, zc, -29.8 * L.side, 7.5, zc, -17 * L.side, 0.1, zc + 2.6, 9.6 * L.side, 0.1, zc + 8.1); sUV.push(0, 0, 1, 0, 1, 1, 0, 1); sWt.push(w, w, w, w); sI.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sP, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(sUV, 2)); sg.setAttribute('aW', new THREE.Float32BufferAttribute(sWt, 1)); sg.setIndex(sI);
        addMesh(sg, shaftMaterial(U), 'window-shaft', 5).frustumCulled = false;
      }
    }
    await ctx.yield();

    // ================================================================ the flight
    const pts = [];
    pts.push([0, EYE, ZSTART]);
    for (let z = 0; z >= -310.01; z -= 10) pts.push([camX(z), camY(z), z]);
    hero.anchors.flyThrough.slice(3).forEach((p) => pts.push([p.x, p.y, p.z + HERO_Z]));   // the straight 19 degree climb up the petal aisle
    const path = makePath(pts);
    const uOf = (z) => path.nearestXZ(camX(z), z).u;
    const uDog = uOf(DOG.z + 1), uPots = uOf(-226), uChair = uOf(CHAIR.z), uBest = uOf(ZB0), uPatio = uOf(ZP0);
    const altarLook = hero.anchors.lookAt.clone().add(V3(0, -4, HERO_Z));
    // the patio is one slow pan across the open court as we slide along the right arcade: fountain and sky first, then the
    // dog below its candle arc with the lantern tree behind, then the garlanded kitchen arch
    const gzA = V3(0, 15, FTN.z), gzB = V3(-5, 9.5, -153), gzC = V3(-1, 15, ZK0 + WT), gz = new THREE.Vector3();
    const pois = [
      { at: (time, u) => gz.copy(gzA).lerp(gzB, smoothstep(0.27, 0.34, u)).lerp(gzC, smoothstep(0.37, 0.45, u)), from: 0.17, to: 0.5, weight: 0.8 },
      { at: V3(BX + 3.4, 6.4, -228), from: uPots - 0.085, to: uPots + 0.03, weight: 0.5 },
      { at: V3(CHAIR.x, 6, CHAIR.z), from: uChair - 0.07, to: uChair + 0.02, weight: 0.3 },
      { at: altarLook, from: uBest - 0.03, to: 0.9, weight: 0.5 },
    ];

    const tan = new THREE.Vector3(), camW = new THREE.Vector3();
    const flameK = 1 - 0.1 * L.burn;
    return {
      scene, path, duration: 38, title: 'The Marigold Way Home',
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 22, sway: 0.4, bank: 0 },
      pois,
      portal: { shape: 'arch', width: 14, height: 17, color: '#ffd9a0', glow: 1, tilt: true, revealDistance: 300 },
      post: { exposure: L.exposure, bloom: { strength: 0.42, radius: 0.7, threshold: 1.0 },
        grade: { saturation: lookName === 'dawn' ? 1.0 : lookName === 'dusk' ? 1.04 : 1.1, contrast: 1.05, tint: L.tint, shadowTint: L.shadow, vignette: 0.36, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        const uu = clamp(u ?? 0, 0, 1);
        path.tangentAt(uu, tan);
        hero.setTravel(tan, 1);
        hero.setProgress(smoothstep(0.62, 1, uu));
        const g = rare ? smoothstep(0.55, 0.68, uu) : 0;
        hero.setGust(g * 0.85); U.uGustK.value = g;
        hero.setWind(0.25, -1, Math.max(L.wind, g * 0.7));
        hero.setLight({ flame: flameK * (1 + 0.15 * g) });
        hero.update(dt, time, camera);
        camera.getWorldPosition(camW);
        U.uCamZ.value = camW.z;
        sky.position.copy(camW);
        SU.uTime.value = time; SU.uBurst.value = clamp((uu - 0.285) / 0.1, 0, 1);
        ftn.rotation.y = time * 0.07;
        // the dog lifts its head, turns to watch us pass, and lays it down again
        const lift = smoothstep(0.295, 0.345, uu) * (1 - smoothstep(uDog + 0.03, uDog + 0.075, uu));
        const ddx = camW.x - DOG.x, ddz = camW.z - DOG.z, dc = Math.cos(DOG.ry), ds = Math.sin(DOG.ry);
        const yaw = clamp(Math.atan2(ddx * dc - ddz * ds, ddx * ds + ddz * dc), -1.75, 1.75);
        dogNeck.rotation.set(lerp(0.72, -0.12, lift) + 0.02 * Math.sin(time * 1.6), lerp(0.08, yaw * 0.92, lift), 0.07 * lift * Math.sin(time * 0.9), 'YXZ');
        dog.scale.set(DOG.s, DOG.s * (1 + 0.014 * Math.sin(time * 1.4)), DOG.s);
        if (dog2Neck) dog2Neck.rotation.x = 0.62 + 0.02 * Math.sin(time * 1.2 + 1);
        catTailG.rotation.z = 0.55 * Math.sin(time * 1.25) + 0.15 * Math.sin(time * 2.9);
        chairG.rotation.x = 0.12 * Math.sin(time * 1.55) * (0.75 + 0.25 * Math.sin(time * 0.21));
      },
      dispose() { hero.dispose(); },
    };
  },
};
