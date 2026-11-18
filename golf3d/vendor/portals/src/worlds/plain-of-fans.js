// THE PLAIN OF FANS
// A slate plain ranked to the horizon with fan-crested suitors, teal on one face and gold on the other,
// opening and turning together to write stripes, chevrons and drifting peacock eyes a kilometre wide
// across the land for the flock of white choosers we fly among. At the end stands the Great Fan.
//
// Course is -Z (so +X is the camera's right, as in the brief); pattern space is p = (x, -z).
// One GLSL function PAT(p, t) -> (open, gold) is shared by the ground paint and every fan shader.
// Three world-anchored hexagonal lattices wrap round a point ahead of the camera: full suitors near,
// shader-drawn fan cards in the middle distance, coarse cards far, ground paint beyond.
// LIGHT: one low key from the left. Every open fan is brighter on its sun-side upper part (fanLit) and the
// far cards and ground paint keep that lit / shade grain (fanFarLit); the ground shader draws each fan's
// long blue-slate shadow itself (two lobes per suitor) and the Great Fan's striped shadow; mist lies
// bright in the swales; the sky is a real gradient with a glow on the sun side and combed cirrus.
// Furled fans lie back along the rank line (world-fixed), so furled ranks read as furrows.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, buildElder } from '../parts/plain-of-fans.js';

const HERO_X = 180, HERO_Z = -1300;
const LANE_Z0 = -925, LANE_Z1 = -1250;
const PITCH = 5, ROW = 4.330127;             // hexagonal lattice
const BODY_K = 1.3;                          // the suitor's body against its fan (the fan stays 3 m)
// The elders: five of the Great Fan's own kind standing in the ranks along the flight, [x, z, height in metres,
// u at which a gold stripe crosses its pleats]. The Great Fan (153 m) stays more than twice the tallest.
const ELDERS = [[-35, -425, 68, 0.105], [120, -530, 52, 0.27], [174, -700, 50, 0.415], [244, -910, 62, 0.53], [85, -934, 58, 0.6]];
const NE = ELDERS.length;

const HOURS = {
  dawn: {
    sky: { preset: 'dawn', zenith: [0.36, 0.67, 0.70], mid: [0.98, 1.02, 0.62], horizon: [1.55, 1.16, 0.28], ground: '#8f927e', horizonPow: 9, midPow: 3.6, stars: 0,
      scatterColor: [2.1, 1.8, 1.12], scatter: 0.9, scatterPow: 6, scatterHigh: 0.3, scatterFall: 1.6, sunElevation: 11, sunAzimuth: -65, sunColor: '#FFF6D8', sunSize: 1.6, sunIntensity: 9, sunGlow: 1.25, sunGlowTight: 0.3 },
    sun: [1.75, 1.48, 0.98], fill: ['#F7EDB0', 0.55], gnd: ['#3A4763', 0.9], fog: [0.80, 0.73, 0.40], fogSun: [1.0, 0.9, 0.5],
    exposure: 0.86, tint: '#fffcec', shadowTint: '#141c33', mist: 1, cirrus: [[1.75, 1.66, 1.3], [0.62, 0.80, 0.76]],
  },
  noon: {
    sky: { preset: 'overcast', sunElevation: 38, sunAzimuth: -65, zenith: '#A9BFD8', mid: '#DCE4EA', horizon: '#F6F1E2', horizonPow: 6, midPow: 2.6, veil: 1.2, sunGlow: 1.3, sunGlowTight: 0.3,
      scatterColor: [1.5, 1.42, 1.2], scatter: 0.95, scatterPow: 3.2, scatterHigh: 0.6, scatterFall: 1.1,
      clouds: { coverage: 0.7, softness: 0.6, lit: [1.2, 1.18, 1.1], shade: [0.66, 0.71, 0.82], absorb: 0.9, silver: 1.1, scale: 0.8, detail: 0.7 },
      clouds2: { coverage: 0.66, softness: 0.6, scale: 0.5, stretch: 0.6, opacity: 0.75, lit: [1.06, 1.06, 1.03], shade: [0.68, 0.73, 0.82], wind: [0.006, 0.002] } },
    sun: [1.05, 1.02, 0.98], fill: ['#EEF0F2', 0.95], gnd: ['#5E6470', 0.8], fog: [0.72, 0.74, 0.74], fogSun: [0.84, 0.84, 0.82],
    exposure: 0.9, tint: '#f8fbff', shadowTint: '#161a26', mist: 0.8, cirrus: null,
  },
  evening: {
    sky: { preset: 'sunset', zenith: [0.34, 0.46, 0.80], mid: [1.04, 0.82, 0.66], horizon: [1.8, 1.02, 0.4], ground: '#8c7a70', horizonPow: 9, midPow: 3.6, stars: 0,
      scatterColor: [2.3, 1.6, 0.9], scatter: 0.9, scatterPow: 6, scatterHigh: 0.3, scatterFall: 1.6, sunElevation: 8, sunAzimuth: -65, sunColor: '#FFE2B4', sunSize: 1.7, sunIntensity: 9, sunGlow: 1.25, sunGlowTight: 0.3, clouds: false },
    sun: [2.2, 1.38, 0.74], fill: ['#F3CBA6', 0.6], gnd: ['#46549A', 1.15], fog: [0.92, 0.60, 0.36], fogSun: [1.2, 0.8, 0.44],
    exposure: 1.0, tint: '#ffeeda', shadowTint: '#1c1836', mist: 1, cirrus: [[1.9, 1.5, 1.12], [0.66, 0.58, 0.84]],
  },
  night: {
    sky: { preset: 'night', zenith: [0.018, 0.026, 0.07], mid: [0.05, 0.07, 0.15], horizon: [0.17, 0.21, 0.34], horizonPow: 2.4,
      bodyOverrides: { 0: { elevation: 24, azimuth: -65, size: 3.2 } }, clouds: false, milkyWay: 0.25 },
    sun: [0.78, 0.84, 1.0], fill: ['#8C96B8', 0.4], gnd: ['#2A3352', 0.9], fog: [0.15, 0.185, 0.30], fogSun: [0.22, 0.26, 0.40],
    exposure: 1.5, tint: '#eef1ff', shadowTint: '#0c1024', mist: 0.9, cirrus: ['#A4AED0', '#39426A'],
  },
};
const LIVERIES = [
  { name: 'teal and gold', pal: ['#2A2F3A', '#0FA3A3', '#2B2F8F', '#F2C230', '#F7EDB0', '#FBFBF5', '#E9A7A0'] },
  { name: 'crimson and ivory', pal: ['#26262B', '#C4162F', '#7A1A34', '#F3E7C6', '#F7EDB0', '#FBFBF5', '#F0B08A'] },
  { name: 'violet and lime', pal: ['#56342A', '#7B3FD0', '#3C2A86', '#B9DC38', '#F7EDB0', '#FBFBF5', '#F2B9A0'] },
];

function pickVariation(ctx) {
  const rng = ctx.rng, vary = ctx.vary || {};
  const hourWish = { dawn: 'dawn', day: 'noon', golden: 'evening', night: 'night' }[vary.hour];
  const hour = hourWish || rng.pick(['dawn', 'dawn', 'dawn', 'noon', 'evening', 'evening', 'night']);
  const livery = rng.pick([0, 0, 0, 1, 2]);
  const pattern = rng.pick([0, 0, 1, 2]);           // 0 stripes+chevrons+eyes, 1 herringbone+paired eyes, 2 plaid+one long eye
  const weather = rng.pick(['mist', 'mist', 'wind', 'rain']);
  const cast = rng.pick(['twenty', 'twenty', 'skein', 'giants']);
  return { hour, livery, pattern, weather, cast, rare: !!vary.rare, density: clamp(vary.density ?? 1, 0.7, 1.3) };
}

// JS mirror of the GLSL ground height (pattern space is not used here: plain world x, z)
function laneDist(x, z) {
  const zc = clamp(z, HERO_Z - 110, LANE_Z0 + 20);
  return Math.hypot(x - HERO_X, z - zc);
}
function groundH(x, z) {
  let h = 2.5 * Math.sin(z * 0.021 + 1.9 * Math.sin(x * 0.0052)) * (0.62 + 0.38 * Math.sin(x * 0.013 + z * 0.004)) - 0.5;
  h *= smoothstep(45, 210, laneDist(x, z));
  const lane = (1 - smoothstep(5.5, 9, Math.abs(x - HERO_X))) * smoothstep(LANE_Z0 + 30, LANE_Z0, z) * smoothstep(LANE_Z1 - 20, LANE_Z1, z);
  return h - 1.5 * lane;
}

const GROUND_GLSL = /* glsl */`
float laneDist(vec2 w){ float zc = clamp(w.y, ${(HERO_Z - 110).toFixed(1)}, ${(LANE_Z0 + 20).toFixed(1)}); return length(vec2(w.x - ${HERO_X.toFixed(1)}, w.y - zc)); }
float laneMask(vec2 w){ return (1. - smoothstep(5.5, 9., abs(w.x - ${HERO_X.toFixed(1)})))*(1. - smoothstep(${LANE_Z0.toFixed(1)}, ${(LANE_Z0 + 30).toFixed(1)}, w.y))*smoothstep(${(LANE_Z1 - 20).toFixed(1)}, ${LANE_Z1.toFixed(1)}, w.y); }
float groundH(vec2 w){
  float h = 2.5*sin(w.y*0.021 + 1.9*sin(w.x*0.0052))*(0.62 + 0.38*sin(w.x*0.013 + w.y*0.004)) - 0.5;
  h *= smoothstep(45., 210., laneDist(w));
  return h - 1.5*laneMask(w);
}
`;

// The pattern. p = (world x, -world z) in metres. Returns (open, gold), each 0..1.
const PATTERN_GLSL = /* glsl */`
uniform float uTime, uU, uCamS, uPatSet, uRare;
uniform vec4 uEye[3];        // xy centre (pattern space), z heading, w scale
float tri(float a){ return abs(fract(a) - 0.5)*2.; }
float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float patField(vec2 p, float t){
  if (uPatSet < 0.5) {
    float sA = sin(6.2832*(dot(p, vec2(0.94, 0.34))/260. - t/5.8));
    vec2 q = vec2(0.9063*p.x + 0.4226*p.y, -0.4226*p.x + 0.9063*p.y);
    float sB = sin(6.2832*((q.y + 210.*tri(q.x/700.))/180. + t/6.));
    float m = smoothstep(-0.2, 0.2, sin(6.2832*dot(p, vec2(0.3, -0.95))/1500. + t/40.));
    return mix(sA, sB, m);
  } else if (uPatSet < 1.5) {
    return sin(6.2832*((p.y + 150.*tri(p.x/300. + 0.25))/150. + t/5.));
  }
  float a = sin(6.2832*(dot(p, vec2(0.8, 0.6))/420. - t/11.));
  float b = sin(6.2832*(dot(p, vec2(-0.6, 0.8))/300. + t/9.));
  return clamp(a*b*1.8, -1., 1.);
}
vec2 PAT(vec2 p, float t){
  float f = patField(p, t);
  float g = smoothstep(-0.2, 0.2, f);
  float o = smoothstep(0.08, 0.3, abs(f));
  for (int i = 0; i < 3; i++) {                       // peacock eyes: rigid, only the centre moves
    vec4 E = uEye[i];
    vec2 d = p - E.xy; float c = cos(E.z), s = sin(E.z);
    vec2 l = vec2(c*d.x + s*d.y, -s*d.x + c*d.y)/(vec2(250., 400.)*max(E.w, 1e-3));
    float e = length(l), e2 = length(l - vec2(0., 0.22));
    float inE = 1. - smoothstep(0.96, 1.0, e);
    float eg = smoothstep(0.43, 0.47, e)*(1. - smoothstep(0.68, 0.72, e));
    float eo = (1. - smoothstep(0.88, 0.92, e))*smoothstep(0.18, 0.22, e2);
    g = mix(g, eg, inE); o = mix(o, eo, inE);
  }
  float s = p.y;                                       // distance down the course
  // the opening front: a chevron pointing at the entry, furled on our side of it until it has passed
  float front = 170. - 555.*uU + 1.15*abs(p.x - 4.)*(1. - smoothstep(0.04, 0.16, uU));
  float behind = smoothstep(front - 6., front + 6., s);
  float crest = behind*(1. - smoothstep(front + 230., front + 330., s));
  float early = 1. - smoothstep(0.17, 0.22, uU);
  o = mix(o, o*behind, early); g = mix(g, 1., crest*early); o = mix(o, 1., crest*early);
  // the lane: ranks stay furled until we are 35 m away, then open in world-fixed 40 m bands
  float nearLane = (1. - smoothstep(24., 34., abs(p.x - ${HERO_X.toFixed(1)})))*smoothstep(${(-LANE_Z0 - 30).toFixed(1)}, ${(-LANE_Z0 + 10).toFixed(1)}, s)*(1. - smoothstep(${(-HERO_Z - 30).toFixed(1)}, ${(-HERO_Z + 40).toFixed(1)}, s));
  float band = floor(s/40.);
  float opened = smoothstep(band*40. - 38., band*40. - 30., uCamS);
  // a second wave of opening runs down the lane toward us from the Great Fan, band by band
  opened = max(opened, smoothstep(-6., 6., band*40. + 20. - mix(1300., 1010., smoothstep(0.54, 0.76, uU))));
  float bg = mod(band, 2.);
  nearLane *= smoothstep(0.6, 0.69, uU);
  o = mix(o, opened, nearLane); g = mix(g, bg, nearLane);
  // the gold stripe that crosses the Great Fan and runs on over the plain
  float bx = ${HERO_X.toFixed(1)} + (uU - 0.90)*6667.;
  float gb = (1. - smoothstep(52., 68., abs(p.x - bx)))*step(0.84, uU);
  g = mix(g, 1., gb); o = mix(o, 1., gb);
  return vec2(o, g);
}
`;

// One sun, a hemisphere fill, distance haze warmed toward the sun. Shared by every shader in the world.
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uFogSun;
uniform float uFogDen, uFaceSun, uWet;
uniform vec3 uSlate, uFront, uRoot, uGold, uLemon, uRose;
vec3 hemi(float ny){ return mix(uGndCol, uSkyCol, ny*0.5 + 0.5); }
vec3 applyHaze(vec3 c, vec3 w){
  vec3 v = w - cameraPosition; float d = length(v);
  float f = 1. - exp(-(d*uFogDen)*(d*uFogDen));
  float a = max(dot(v/max(d, 1e-3), uSunDir), 0.);
  return mix(c, mix(uFogCol, uFogSun, a*a), f);
}
// the colour a field of fans shows from afar: used by the far cards and the ground paint so they match
// lit = 0 the shaded side of a fan or rank, 1 its sun side; 0.45 is the average of a whole fan
vec3 fanFarLit(float g, float lit){
  vec3 alb = mix(mix(uRoot*0.8, uFront, 0.72)*0.95, uGold*0.75, g);
  vec3 fill = mix(uSkyCol, vec3(dot(uSkyCol, vec3(0.3, 0.55, 0.15))), 0.6)*0.8 + uGndCol*0.55;
  return alb*(uSunCol*mix(0.42, 0.62, g)*mix(0.12, 2.1, lit) + fill*mix(0.78, 1.05, lit));
}
vec3 fanFar(float g){ return fanFarLit(g, 0.45); }
// what a cast shadow does to a colour already lit: darker and blue-slate, never black (sh 0 lit .. 1 deep shade)
vec3 inShade(vec3 c, float sh){ return c*mix(vec3(1.), vec3(0.40, 0.50, 0.78), clamp(sh, 0., 1.)); }
// a furled fan: one dark blade in the hue of the indigo and slate slots (the teal face is folded inside), at 0.78 of the luminance of live's teal blade, the gold reverse a hairline along its sun-side edge
vec3 furledBlade(float rc, float rad, float side){
  float edge = side > 0. ? smoothstep(5.6, 6.4, rc) : 1. - smoothstep(1.6, 2.4, rc);   // the gold reverse of the outer two of the eight pleats, a quarter of the blade (live showed 0.36 of it); live's softness of 0.8 pleat kept
  return mix(mix(uRoot*1.7 + uSlate*2.5, uRoot*1.4 + uSlate*4., rad)*(0.78*dot(mix(uRoot*1.1 + uSlate*0.8, uFront*0.85, 0.3 + 0.45*rad), vec3(0.3, 0.55, 0.15))/max(dot(mix(uRoot*1.7 + uSlate*2.5, uRoot*1.4 + uSlate*4., rad), vec3(0.3, 0.55, 0.15)), 1e-4)), uGold*0.8, edge);   // the body keeps the hue of the indigo and slate slots (indigo 1.7 to 1.4 with slate 2.5 to 4, root to rim) and takes its depth from live's own blade body, the mix of the indigo, slate and teal slots written out here: 0.78 of its luminance by the weights of fanFarLit's fill, one share for every livery and hour (the max only keeps the divisor above zero). So the body stands under live's blade and under the open face beside it whatever the livery, and 0.78 is as low as the share goes while the body the key does not reach, lit by the sky's fill alone, still holds the brief's floor of slate under the dawn's and the noon's light in the teal livery; the gold is live's 0.8, outside the share
}
// which part of a fan the low sun reaches: x across the fan toward the sun (-1..1), h up the fan (0..1)
float fanLit(float x, float h){ return clamp(0.42 + 0.5*x + 0.4*(h - 0.5), 0., 1.); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
float fbm3(vec2 p){ return vnoise(p)*0.55 + vnoise(p*2.13 + 7.1)*0.3 + vnoise(p*4.31 + 3.7)*0.15; }
// nearest suitor of the jittered hexagonal lattice: xy = its world xz, z = a 0..1 random
vec3 nearestSuitor(vec2 w){
  float r0 = floor(w.y/${ROW.toFixed(6)});
  vec3 best = vec3(0., 0., 0.); float bd = 1e9;
  for (int k = 0; k < 2; k++) {
    float r = r0 + float(k);
    float off = mod(r, 2.)*${(PITCH / 2).toFixed(2)};
    float c = floor((w.x - off)/${PITCH.toFixed(1)} + 0.5);
    vec2 id = vec2(c, r);
    vec2 q = vec2(c*${PITCH.toFixed(1)} + off, r*${ROW.toFixed(6)}) + (vec2(hash21(id + 3.7), hash21(id + 9.1)) - 0.5)*1.5;
    float d = dot(w - q, w - q);
    if (d < bd) { bd = d; best = vec3(q, hash21(id + 1.3)); }
  }
  return best;
}
`;

// The elders in the shaders: where their bodies lie (no suitors, bare trampled earth) and the long striped
// shadows of their fans. uEld = x, z, scale, yaw; uEldB = half spread, pleats, ground y, spare.
const ELDER_GLSL = /* glsl */`
uniform vec4 uEld[${NE}], uEldB[${NE}];
// metres outside the nearest elder's body (a capsule from its head to its hind foot); negative inside
float elderDist(vec2 w){
  float best = 1e6;
  for (int i = 0; i < ${NE}; i++) {
    vec4 E = uEld[i];
    float c = cos(E.w), s = sin(E.w);
    vec2 d = (w - E.xy)/max(E.z, 1e-3);
    vec2 l = vec2(c*d.x - s*d.y, s*d.x + c*d.y);
    best = min(best, (length(vec2(l.x, l.y - clamp(l.y, -92., 30.))) - 52.)*E.z);
  }
  return best;
}
// striped shade of the elders' fans at a world point: 0 lit .. 1 shaded
float elderShadow(vec3 wp, vec3 sun){
  float sh = 0.;
  for (int i = 0; i < ${NE}; i++) {
    vec4 E = uEld[i], B = uEldB[i];
    float c = cos(E.w), s = sin(E.w);
    vec3 d = (wp - vec3(E.x, B.z, E.y))/max(E.z, 1e-3);
    vec3 p = vec3(c*d.x - s*d.z, d.y, s*d.x + c*d.z);
    vec3 sl = vec3(c*sun.x - s*sun.z, sun.y, s*sun.x + c*sun.z);
    float lz = abs(sl.z) < 0.03 ? (sl.z < 0. ? -0.03 : 0.03) : sl.z;
    float t = -p.z/lz;
    vec2 q = p.xy + sl.xy*t - vec2(0., 30.);
    float rho = length(q), ang = atan(q.x, q.y + 1e-4);
    float pen = clamp(t*0.035, 0.6, 14.);
    float inside = step(0., t)*smoothstep(8., 12., rho)*(1. - smoothstep(117. - pen, 117. + 0.3*pen, rho))*(1. - smoothstep(B.x - 0.004*pen, B.x + 0.004*pen + 0.01, abs(ang)));
    float a = fract((ang/max(B.x, 1e-3)*0.5 + 0.5)*B.y);
    float stripe = mix(mix(0.5, 0.88, smoothstep(0.42, 0.58, a)), 0.68, clamp(t/300., 0., 1.));
    float core = step(0., t)*(1. - smoothstep(9., 13., rho))*0.8;
    sh = max(sh, max(inside*stripe, core));
  }
  return sh;
}
`;

function buildGroundGeometry() {
  const side = [0]; let x = 0, st = 1.5;
  while (x < 3600) { if (x >= 12) st = Math.min(st * 1.28, x < 500 ? 36 : 420); x += st; side.push(x); }
  const xs = [...side.slice(1).reverse().map((v) => HERO_X - v), ...side.map((v) => HERO_X + v)];
  const zs = []; let z = 760; st = 300;
  while (z > 80) { zs.push(z); z -= Math.max(10, Math.min(260, (z - 60) * 0.4)); }
  for (z = 80; z > -1460; z -= 20) zs.push(z);
  st = 20; while (z > -6200) { zs.push(z); st = Math.min(st * 1.3, 500); z -= st; }
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const o = (j * nx + i) * 3; pos[o] = xs[i]; pos[o + 1] = groundH(xs[i], zs[j]); pos[o + 2] = zs[j];
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(HERO_X, 0, -2700), 6000);
  return g;
}

function buildGroundMaterial(SU, shadowGLSL) {
  return new THREE.ShaderMaterial({
    uniforms: SU,
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vW = (modelMatrix*vec4(position, 1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec3 vW;
      uniform vec3 uHeroPos; uniform float uUnfurl, uPaintNear, uPaintFar, uMist;
      uniform vec3 uFoot[6]; uniform float uShadowK;
      ${PATTERN_GLSL}
      ${LIGHT_GLSL}
      ${GROUND_GLSL}
      ${shadowGLSL}
      ${ELDER_GLSL}
      // a giant three-toed print: x = distance to the nearest toe (cell units), y = 1 where this cell holds a print
      vec2 giantToe(vec2 gc, float wob){
        vec2 gi = floor(gc); vec2 gf = fract(gc) - 0.5 - (vec2(hash21(gi + 1.7), hash21(gi + 8.3)) - 0.5)*0.45;
        float gt = min(min(length((gf - vec2(0., 0.15))*vec2(1.7, 1.)), length((gf - vec2(0.15, -0.03))*vec2(1., 1.5))), length((gf - vec2(-0.15, -0.03))*vec2(1., 1.5)));
        return vec2(gt + wob, step(0.4, hash21(gi + 4.1)));
      }
      float giantH(vec2 t){ return (smoothstep(0.07, 0.135, t.x) + 0.45*smoothstep(0.1, 0.15, t.x)*(1. - smoothstep(0.15, 0.24, t.x)))*t.y + (1. - t.y); }
      // 1 where no suitor stands (the display lane, the Great Fan's footprints with a ragged fringe, the elders)
      float gone(vec2 q, float rnd){
        float g = (1. - step(9.6, abs(q.x - ${HERO_X.toFixed(1)})))*step(q.y, ${(LANE_Z0 + 12).toFixed(1)})*step(${(LANE_Z1 - 30).toFixed(1)}, q.y);
        for (int i = 0; i < 6; i++) g = max(g, 1. - step(uFoot[i].z + 2. + (rnd - 0.5)*9., length(q - uFoot[i].xy)));
        return max(g, 1. - smoothstep(0., 4., elderDist(q)));
      }
      void main(){
        vec2 w = vW.xz; vec2 p = vec2(w.x, -w.y);
        float dist = length(vW - cameraPosition);
        float e = 0.6;
        float h0 = groundH(w);
        vec3 n = normalize(vec3(h0 - groundH(w + vec2(e, 0.)), e, h0 - groundH(w + vec2(0., e))));
        float fw = max(fwidth(w.x), fwidth(w.y));
        // ---- near ground: slate, courts, lichen, litter, worn lanes
        float lod = 1. - smoothstep(0.25, 0.9, fw);
        float n1 = fbm3(w*0.11), n2 = fbm3(w*1.3 + 11.), n3 = vnoise(w*7.);
        vec3 alb = mix(uSlate, vec3(dot(uSlate, vec3(0.33))), 0.35)*mix(2.9, 4.7, n1) + uRoot*0.05*n2;
        alb *= mix(1., 0.72 + 0.56*n2, lod)*mix(1., 0.8 + 0.4*n3, lod*lod);
        vec3 su = nearestSuitor(w);
        float dc = length(w - su.xy);
        float court = 1. - smoothstep(0.55, 0.95, dc + (n2 - 0.5)*0.35);
        float ring = smoothstep(0.7, 0.95, dc + (n2 - 0.5)*0.5)*(1. - smoothstep(1.05, 1.7, dc + (n3 - 0.5)*0.6));
        float lane = laneMask(w);
        // where the Great Fan stands and crouches the ground is trampled bare: no courts, no ranks
        float footM = 0.;
        for (int i = 0; i < 6; i++) footM = max(footM, 1. - smoothstep(uFoot[i].z - 4., uFoot[i].z + 7., length(w - uFoot[i].xy) + (n2 - 0.5)*7.));
        float eldM = 1. - smoothstep(-5., 6., elderDist(w) + (n2 - 0.5)*9.);
        footM = max(footM, eldM);
        float keep = (1. - lane)*lod*(1. - footM)*(1. - gone(su.xy, su.z));
        alb = mix(alb, uSlate*2.3 + uRoot*0.12, court*keep);
        alb = mix(alb, mix(uLemon, uSlate*3., 0.3)*(0.6 + 0.5*n3), ring*keep*0.75);
        float litter = step(0.93, vnoise(w*21. + su.z*40.))*(1. - smoothstep(0.6, 2.3, dc));
        alb = mix(alb, uGold*0.8, litter*keep*(1. - smoothstep(0.03, 0.12, fw)));
        alb *= mix(1., 0.76, uWet);
        // the display lane and the Fan's own ground: pale stamped earth, three-toed tracks, strewn scales
        vec3 earth = mix(uSlate*3.4, uLemon*0.62, 0.5)*(0.72 + 0.4*n2)*(0.86 + 0.24*n1);
        vec2 tc = w*vec2(0.9, 0.7); vec2 ti = floor(tc); vec2 tf = fract(tc) - 0.5 - (vec2(hash21(ti), hash21(ti + 5.)) - 0.5)*0.5;
        float toe = min(min(length(tf - vec2(0., 0.16)), length(tf - vec2(0.13, -0.02))), length(tf - vec2(-0.13, -0.02)));
        float track = (1. - smoothstep(0.05, 0.09, toe))*step(0.45, hash21(ti + 2.2));
        earth *= 1. - 0.4*track*(1. - smoothstep(0.02, 0.08, fw));
        earth = mix(earth, uGold*0.8, step(0.955, vnoise(w*17.))*(1. - smoothstep(0.03, 0.1, fw)));
        // scuffed and dragged where the great body shifts: long drag marks, dusty and damp patches, deep prints
        // whose far wall takes the low sun and whose near wall is in shade, drifts of shed gold scales
        float drag = fbm3(w*0.055 + 4.) - 0.5, drag2 = vnoise(vec2(w.x*0.16 + n1*3., w.y*0.035));
        float scuff = vnoise(vec2(dot(w, vec2(0.92, 0.39))*0.05 + n1*2., dot(w, vec2(-0.39, 0.92))*0.55)) - 0.5;
        float scuff2 = vnoise(vec2(dot(w, vec2(0.5, 0.87))*0.9, dot(w, vec2(-0.87, 0.5))*0.07 + n2*2.)) - 0.5;
        earth *= 1. + (0.7*drag + 0.3*(drag2 - 0.5) + 0.5*scuff + 0.3*scuff2*(1. - smoothstep(0.1, 0.5, fw)))*footM;
        earth = mix(earth, earth*vec3(1.22, 1.16, 0.9), smoothstep(0.1, 0.4, drag)*footM*0.7);
        earth = mix(earth, earth*vec3(0.62, 0.68, 0.86), smoothstep(0.08, 0.35, -drag)*footM*0.7);
        vec2 gc = w*vec2(0.058, 0.047), sdir = uSunDir.xz/max(length(uSunDir.xz), 1e-3);
        float gwob = (n2 - 0.5)*0.03;
        vec2 g0 = giantToe(gc, gwob), g1 = giantToe(gc + sdir*vec2(0.058, 0.047)*0.9, gwob);
        float giant = (1. - smoothstep(0.075, 0.13, g0.x))*g0.y*footM;
        float slope = clamp((giantH(g1) - giantH(g0))*1.6, -1., 1.)*footM;           // rising toward the sun: that wall is in shade
        earth *= (1. - 0.5*giant)*(1. - 0.6*max(slope, 0.) + 0.85*max(-slope, 0.));
        // older, smaller prints trodden over one another, and a pebbled crust
        vec2 mc = w*vec2(0.21, 0.17) + 7.3;
        vec2 m0 = giantToe(mc, gwob*2.), m1 = giantToe(mc + sdir*vec2(0.21, 0.17)*0.3, gwob*2.);
        float mslope = clamp((giantH(m1) - giantH(m0))*1.3, -1., 1.)*footM;
        earth *= (1. - 0.3*(1. - smoothstep(0.075, 0.13, m0.x))*m0.y*footM)*(1. - 0.42*max(mslope, 0.) + 0.55*max(-mslope, 0.));
        earth *= 1. + ((vnoise(w*2.7 + 3.) - 0.5)*0.8 + (vnoise(w*0.9 + 13.) - 0.5)*0.75)*footM*(1. - smoothstep(0.2, 0.8, fw));
        // loose stones kicked out of the prints, each with a sunlit cheek and a short shadow
        vec2 stc = w*0.7 + 2.9, sti = floor(stc), stf = fract(stc) - 0.5;
        vec2 sto = (vec2(hash21(sti + 1.7), hash21(sti + 9.2)) - 0.5)*0.5;
        float strad = 0.08 + 0.15*hash21(sti + 3.3);
        float ston = step(0.42, hash21(sti + 5.1))*footM*(1. - smoothstep(0.12, 0.4, fw));
        float stone = 1. - smoothstep(strad*0.75, strad, length(stf - sto));
        float stsh = (1. - smoothstep(strad*0.6, strad*1.6, length(stf - sto + sdir*strad)))*(1. - stone);
        earth *= 1. - 0.5*stsh*ston;
        earth = mix(earth, (earth*0.6 + uFogCol*0.3)*(1.05 + 0.6*clamp(dot(stf - sto, sdir)/strad, -1., 1.)), stone*ston);
        float drift = smoothstep(0.52, 0.7, fbm3(w*0.085 + 21.))*footM;
        earth = mix(earth, uGold*(0.5 + 0.5*n3), drift*(0.25 + 0.6*step(0.55, vnoise(w*4.3 + 9.))*(1. - smoothstep(0.2, 0.7, fw))));
        alb = mix(alb, earth*mix(1., 0.86, uWet), max(lane, footM*0.9));
        // ---- light
        float ndl = max(dot(n, uSunDir), 0.);
        vec2 og = PAT(p, uTime);
        float castSh = max(greatFanShadow(vW - uHeroPos, uSunDir, uUnfurl), elderShadow(vW, uSunDir));
        float gfs = 1. - castSh*0.8;
        // every fan lays a long shadow away from the sun: two soft lobes per suitor, resolved near the lens,
        // settling to their average (with a grain along the ranks) where they are too small to see
        vec2 shd = -uSunDir.xz/max(length(uSunDir.xz), 1e-3), shp = vec2(-shd.y, shd.x);
        float sl = mix(3.4, 4.6, og.x)*clamp(0.24/max(uSunDir.y, 0.05), 0.3, 1.15), sw = mix(0.42, 1.9, og.x);
        float o1 = 0.3 + sl*0.5, o2 = 0.3 + sl*1.5;
        vec3 s1 = nearestSuitor(w - shd*o1), s2 = nearestSuitor(w - shd*o2);
        vec2 d1 = w - s1.xy - shd*o1, d2 = w - s2.xy - shd*o2;
        float f1 = (1. - smoothstep(0.5, 1., length(vec2(dot(d1, shd)/(sl*0.5 + 0.5), dot(d1, shp)/sw))))*(1. - gone(s1.xy, s1.z));
        float f2 = (1. - smoothstep(0.45, 1., length(vec2(dot(d2, shd)/(sl*0.5 + 0.5), dot(d2, shp)/(sw*0.8)))))*(1. - gone(s2.xy, s2.z));
        float ranks = 0.5 + 0.5*sin(dot(w, shp)*1.2 + n1*6.);
        float fAvg = (0.16 + 0.5*og.x)*(0.7 + 0.6*ranks)*(1. - lane)*(1. - footM);
        float fsh = mix(max(f1, f2*0.85), fAvg, smoothstep(0.6, 2.0, fw));
        float shade = gfs*(1. - uShadowK*fsh);
        float under = smoothstep(0.55, 1., footM)*(1. - 0.55*eldM);                 // close under the great body: sky cut off
        shade *= 1. - 0.6*under;
        vec3 col = alb*(uSunCol*ndl*shade*2.7 + hemi(n.y)*mix(0.8, 1., shade)*(1. - 0.3*under) + uGndCol*0.8);
        col += uWet*uSkyCol*0.10*pow(clamp(1. - max(dot(normalize(cameraPosition - vW), n), 0.), 0., 1.), 3.);
        // between open fans the ground stands in their shade and takes their colour: deep gold or teal, not grey holes
        col = mix(col, fanFarLit(og.y, 0.08)*gfs, og.x*0.6*(1. - lane)*(1. - footM)*smoothstep(0.1, 0.5, fw + 0.1));
        // ---- far paint: the pattern itself, ruled with lit and shaded ranks, rising where the cards shrink away
        float paint = smoothstep(uPaintNear, uPaintFar, dist)*(1. - lane);
        float rl = abs(fract(w.y/${ROW.toFixed(4)}) - 0.5)*2.;
        float fy = fwidth(w.y/${ROW.toFixed(4)});
        float litRow = mix(0.45, smoothstep(0.1, 0.62, rl), 1. - smoothstep(0.25, 0.8, fy));
        litRow = clamp(litRow + (vnoise(vec2(w.x*0.025, w.y/13.)) - 0.5)*0.55*(1. - smoothstep(1., 3., fy)) + (n1 - 0.5)*0.25, 0., 1.);
        // furled ranks from afar: furrows of indigo shade ruled with the gold hairlines of the waiting blades (hair, and the furl that reads it); under OPEN ranks the paint keeps live's furl whole (furlO, on live's blade): the two are mixed by the rank's own open state og.x. The furrow's tone is the indigo slot at 1.18 with the slate slot at 6.41, darkened by the blade's own share 0.78 on that tone alone (the earth in the furrow and the gold keep their light); the gold covers 0.18 of a ruled rank and 0.18 of a merged one (live 0.36 and 0.3) as the blade's gold is a hairline. These numbers hold the paint, channel by channel, as near the furled card as the four hours' lights and the three liveries allow together: never further than live's paint stood from live's card at its furthest, and no further than live's in nine of the twelve hours and liveries (further in the violet livery at noon and evening and in the teal at night)
        float blade = mix(0.3, smoothstep(0.5, 0.78, rl), 1. - smoothstep(0.25, 0.8, fy))*(0.75 + 0.5*n2), hair = mix(0.18, smoothstep(0.68, 0.96, rl), 1. - smoothstep(0.25, 0.8, fy))*(0.75 + 0.5*n2);
        vec3 furlO = mix(mix(alb*0.5, uRoot*0.8 + uFront*0.55, 0.6)*(hemi(1.) + uGndCol*0.8), uGold*0.72*(uSunCol*0.8 + hemi(1.)*0.5), blade*0.8), furl = mix(mix(mix(alb*0.5, (uRoot*1.18 + uSlate*6.41)*0.78, 0.6)*(hemi(1.) + uGndCol*0.8), uGold*0.72*(uSunCol*0.8 + hemi(1.)*0.5), hair*0.8), furlO, og.x);
        vec3 pc = mix(furl, fanFarLit(og.y, litRow), 0.86*og.x)*gfs;
        col = mix(col, pc, paint);
        col = inShade(col, castSh*0.8);
        // ---- mist pooled in the swales
        float mist = (1. - smoothstep(-3.1, -0.6, vW.y + (n1 - 0.5)*1.2 - 1.5*lane))*uMist*(1. - lane);
        float sunward = max(dot(normalize(vW - cameraPosition), uSunDir), 0.);
        col = mix(col, mix(uFogCol, uFogSun, 0.45 + 0.55*sunward)*1.1, mist*0.4);
        gl_FragColor = vec4(applyHaze(col, vW), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the suitor (lattice A geometry)
// Local frame: +Z toward the choosers (front), +Y up. Body vertices carry position/normal/colour;
// fan vertices carry (rib coordinate 0..8, radius, lateral metres) in `position` and are placed by the shader.
// aKind: 0 body, 1 rib, 2 pleat, 3 spatula, 4 throat, 5 eye-ring.
function buildSuitorGeometry(pal, scale = 1) {
  const pos = [], nor = [], col = [], kind = [], idx = [];
  const lin = (c, k = 1) => [c.r * k, c.g * k, c.b * k];
  const hide = lin(pal[0].clone().lerp(pal[2], 0.5), 4.75), belly = lin(pal[0].clone().lerp(pal[4], 0.3), 4.2), dark = lin(pal[0], 2.2), pale = lin(pal[4].clone().lerp(pal[0], 0.3), 0.85), rose = lin(pal[6], 1);   // the hide is the slate and indigo slots in equal parts, lifted 4.75: under the dawn's and the noon's key it returns no more luma than live's grey hide did (in the crimson livery, whose indigo slot holds a crimson, more), and 4.75 is all that allows: where only the sky's fill reaches it, it then stands by the brief's floor of slate about where live's hide stood; belly and dark are live's lines again (neck, head and feet pale against the hide, the tips of rump and snout dark), pale is live's; the rose slot whole on throat and bill
  const V = (p, n, c, k) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); kind.push(k); return pos.length / 3 - 1; };
  const a = new THREE.Vector3(), b = new THREE.Vector3(), t = new THREE.Vector3(), s = new THREE.Vector3(), u = new THREE.Vector3();
  // lofted tube through rings [x,y,z, rSide, rUp, colour, kind]
  const tube = (rings, sides, capEnds = true) => {
    const base = pos.length / 3;
    rings.forEach((r, i) => {
      a.fromArray(rings[Math.max(i - 1, 0)]); b.fromArray(rings[Math.min(i + 1, rings.length - 1)]);
      t.subVectors(b, a).normalize();
      s.set(0, 1, 0).cross(t); if (s.lengthSq() < 1e-4) s.set(1, 0, 0); s.normalize(); u.crossVectors(t, s);
      for (let k = 0; k < sides; k++) {
        const an = (k / sides) * Math.PI * 2 + (sides === 4 ? Math.PI / 4 : 0), cx = Math.cos(an), cy = Math.sin(an);
        const p = [r[0] + s.x * cx * r[3] + u.x * cy * r[4], r[1] + s.y * cx * r[3] + u.y * cy * r[4], r[2] + s.z * cx * r[3] + u.z * cy * r[4]];
        const n = [s.x * cx + u.x * cy, s.y * cx + u.y * cy, s.z * cx + u.z * cy];
        if (capEnds && (i === 0 || i === rings.length - 1)) { const e = i === 0 ? -0.7 : 0.7; n[0] += t.x * e; n[1] += t.y * e; n[2] += t.z * e; }
        const l = Math.hypot(n[0], n[1], n[2]) || 1;
        V(p, [n[0] / l, n[1] / l, n[2] / l], r[5], r[6] ?? 0);
      }
    });
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < sides; k++) {
      const q = base + i * sides + k, q1 = base + i * sides + (k + 1) % sides;
      idx.push(q, q1, q + sides, q1, q1 + sides, q + sides);
    }
  };
  // body: squat, rump high (the fan springs from it), chest low toward the choosers
  tube([[0, 1.02, -0.78, 0.05, 0.05, dark], [0, 1.08, -0.62, 0.3, 0.26, hide], [0, 1.0, -0.2, 0.46, 0.4, hide],
    [0, 0.9, 0.25, 0.42, 0.36, hide], [0, 0.82, 0.56, 0.24, 0.22, hide], [0, 0.8, 0.68, 0.05, 0.05, hide]], 6);
  // neck held low and forward, then the wedge head
  tube([[0, 0.84, 0.5, 0.17, 0.17, hide], [0, 0.82, 0.86, 0.13, 0.14, hide], [0, 0.98, 1.16, 0.1, 0.12, belly], [0, 1.12, 1.36, 0.09, 0.1, belly]], 4, false);
  tube([[0, 1.1, 1.3, 0.08, 0.09, belly], [0, 1.15, 1.44, 0.14, 0.13, hide], [0, 1.1, 1.68, 0.085, 0.075, dark], [0, 1.05, 1.9, 0.02, 0.025, rose]], 4);
  // throat patch (swells in the shader) and an eye-ring on each side
  tube([[0, 0.72, 0.58, 0.02, 0.02, rose, 4], [0, 0.66, 0.9, 0.17, 0.16, rose, 4], [0, 0.9, 1.26, 0.02, 0.02, rose, 4]], 4, false);
  for (const sx of [-1, 1]) {
    const e = [sx * 0.145, 1.17, 1.46], n = [sx, 0.15, 0.1], q = pos.length / 3, r = 0.1;
    V([e[0], e[1] - r, e[2] - r], n, [-1, -1, 0], 5); V([e[0], e[1] - r, e[2] + r], n, [1, -1, 0], 5);
    V([e[0], e[1] + r, e[2] + r], n, [1, 1, 0], 5); V([e[0], e[1] + r, e[2] - r], n, [-1, 1, 0], 5);
    idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
  }
  // three legs: two forelegs planted wide, one hind strut braced back
  const leg = (hip, knee, foot) => tube([[...hip, 0.16, 0.16, hide], [...knee, 0.1, 0.1, pale], [...foot, 0.065, 0.065, belly], [foot[0] * 1.06, 0.0, foot[2] + (foot[2] > 0 ? 0.2 : -0.2), 0.15, 0.04, pale]], 3, false);
  leg([-0.3, 0.86, 0.3], [-0.78, 0.7, 0.5], [-0.92, 0.05, 0.62]);
  leg([0.3, 0.86, 0.3], [0.78, 0.7, 0.5], [0.92, 0.05, 0.62]);
  leg([0, 0.95, -0.55], [0, 0.72, -1.05], [0, 0.05, -1.5]);
  // ---- the fan: nine ribs, eight pleats, a spatula on every rib tip
  const F = (ribCoord, r, lat, k) => V([ribCoord, r, lat], [0, 0, 1], [0, 0, 0], k);
  for (let i = 0; i <= 8; i++) {
    const q = pos.length / 3, rs = [0.1, 1.5, 3.0], ws = [0.055, 0.04, 0.02];
    rs.forEach((r, j) => { F(i, r, -ws[j], 1); F(i, r, ws[j], 1); });
    idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2, q + 2, q + 3, q + 4, q + 3, q + 5, q + 4);
    const sp = pos.length / 3;
    F(i, 2.9, -0.035, 3); F(i, 3.12, -0.12, 3); F(i, 3.3, 0, 3); F(i, 3.12, 0.12, 3); F(i, 2.9, 0.035, 3);
    idx.push(sp, sp + 1, sp + 4, sp + 1, sp + 3, sp + 4, sp + 1, sp + 2, sp + 3);
  }
  for (let k = 0; k < 8; k++) {
    const q = pos.length / 3;
    for (const r of [0.22, 1.7, 2.92]) for (const c of [0.001, 0.5, 0.999]) F(k + c, c === 0.5 && r > 2 ? r - 0.36 : r, 0, 2);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const v = q + j * 3 + i; idx.push(v, v + 1, v + 3, v + 1, v + 4, v + 3); }
  }
  const g = new THREE.InstancedBufferGeometry();
  const P = new Float32Array(pos); if (scale !== 1) for (let i = 0; i < P.length; i += 3) if (kind[i / 3] === 0 || kind[i / 3] >= 4) { P[i] *= scale; P[i + 1] *= scale; P[i + 2] *= scale; }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(kind), 1));
  g.setIndex(idx);
  return g;
}

// instance attribute: the base cell of each lattice point inside its wrapped tile
function addLattice(g, cols, rows, pitch = PITCH, row = ROW, keep = 1, rng = null) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (keep < 1 && rng && rng() > keep) continue;
    cells.push(c * pitch + (r % 2) * pitch * 0.5, r * row);
  }
  g.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(cells), 2));
  g.instanceCount = cells.length / 2;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return { tile: new THREE.Vector2(cols * pitch, rows * row), count: cells.length / 2 };
}

// Shared vertex code: where this instance's suitor stands, how open and which colour it shows, and the
// frame of its fan (facing the flock, leaning back by the flock's elevation).
const SUITOR_VS = /* glsl */`
attribute vec2 aCell;
uniform vec3 uCentre, uCentreA, uCentreB;
uniform vec2 uTile, uTileA, uTileB;
uniform vec3 uFoot[6];
uniform float uCoarse, uGust, uSize, uJuv, uBodyK;
uniform vec3 uSunDir;
${PATTERN_GLSL}
${GROUND_GLSL}
${ELDER_GLSL}
// sDir/sRight: toward the lens. sBDir/sBRight: the body, turned a quarter away so it is seen in three-quarter
// view. sFR/sUp/sNrm: the fan's frame. sSide: how far the fan's +x points at the sun (-1..1).
vec3 sBase, sDir, sRight, sUp, sNrm, sFR, sBDir, sBRight; float sRnd, sOpen, sGold, sShow, sTrans, sDist, sSide, sEld;
float fanLitV(float x, float h){ return clamp(0.42 + 0.5*x + 0.4*(h - 0.5), 0., 1.); }
float cheb(vec2 w, vec3 c, vec2 tile){ vec2 d = abs(w - c.xz)/(tile*0.5); return max(d.x, d.y); }
void placeSuitor(float level){
  vec2 w0 = aCell + floor((uCentre.xz - aCell)/uTile + 0.5)*uTile;
  float rw = ${ROW.toFixed(6)}*uCoarse, pw = ${PITCH.toFixed(1)}*uCoarse;
  float r = floor(w0.y/rw + 0.5), off = mod(r, 2.)*pw*0.5, c = floor((w0.x - off)/pw + 0.5);
  vec2 id = vec2(c, r) + (uCoarse - 1.)*71.;
  vec2 q = vec2(c*pw + off, r*rw) + (vec2(hash21(id + 3.7), hash21(id + 9.1)) - 0.5)*1.5*uCoarse;
  sRnd = hash21(id + 1.3);
  sBase = vec3(q.x, groundH(q), q.y);
  // which lattice shows this ground: A near, B middle, C far, each fading at its tile edge
  float eA = cheb(q, uCentreA, uTileA), eB = cheb(q, uCentreB, uTileB), eS = cheb(q, uCentre, uTile);
  float show = 1. - smoothstep(0.84, 0.98, eS);
  if (level > 0.5) show *= smoothstep(0.82, 0.96, eA);
  if (level > 1.5) show *= smoothstep(0.82, 0.96, eB);
  float lane = (1. - step(9.6, abs(q.x - ${HERO_X.toFixed(1)})))*step(q.y, ${(LANE_Z0 + 12).toFixed(1)})*step(${(LANE_Z1 - 30).toFixed(1)}, q.y);
  show *= 1. - lane;
  for (int i = 0; i < 6; i++) show *= step(uFoot[i].z + 2.*uCoarse + (sRnd - 0.5)*9., length(q - uFoot[i].xy));
  show *= smoothstep(0., 4., elderDist(q));
  sShow = show;
  sEld = elderShadow(sBase + vec3(0., 2., 0.), uSunDir);
  vec2 og = PAT(vec2(q.x, -q.y), uTime - sRnd*0.25);
  if (uJuv > 0.5) {                                    // juveniles: absolute positions in the lane, running and flicking stub fans
    sRnd = hash21(aCell*0.37);
    float ph = uTime*(0.5 + 0.5*sRnd) + sRnd*40.;
    float flee = 1. - smoothstep(6., 46., abs(-aCell.y - uCamS - 14.));
    q = aCell + vec2((2.6*sin(ph*0.7) + flee*sign(aCell.x - ${HERO_X.toFixed(1)})*3.)*0.8, 7.*sin(ph*0.45) - flee*9.);
    q.x = clamp(q.x, ${(HERO_X - 5.2).toFixed(1)}, ${(HERO_X + 5.2).toFixed(1)});
    sBase = vec3(q.x, groundH(q) + 0.12*abs(sin(ph*9.)), q.y);
    sShow = 1.;
    og = vec2(0.5 + 0.5*sin(uTime*(2.2 + 2.*sRnd) + sRnd*20.), step(0.5, fract(sRnd*7. + floor(uTime*0.35 + sRnd*3.)*0.5)));
  }
  sOpen = og.x; sGold = og.y; sTrans = 4.*og.x*(1. - og.x);
  vec3 toC = cameraPosition - sBase; float hd = max(length(toC.xz), 1e-3);
  sDist = length(toC);
  sDir = vec3(toC.x/hd, 0., toC.z/hd);
  sRight = vec3(sDir.z, 0., -sDir.x);
  float lean = clamp(atan(toC.y - 1.5, hd), 0.26, 1.22);
  lean += uGust*sOpen*(0.22*sin(dot(q, vec2(0.045, 0.027)) - uTime*1.9) + 0.10*sin(dot(q, vec2(-0.02, 0.07)) - uTime*2.7));
  // furled, the blade stands slim and raked back, turned a little along the rank line (a world-fixed direction),
  // so ranks of furled fans read as rows of gold-edged blades; opening, it swings round to face the flock
  float fo = max(smoothstep(0., 0.6, sOpen), uJuv);
  vec3 back = mix(vec3(0.94, 0., -0.34), -sDir, max(fo, 0.65)) + vec3(0., 0., -0.03);
  // waiting is not standing still: furled blades rock and twist in slow waves that run along the ranks
  float rest = (1. - fo)*(1. - uJuv);
  back += vec3(-back.z, 0., back.x)*rest*0.34*sin(dot(q, vec2(-0.031, 0.06)) + uTime*1.7 + sRnd*5.);
  back /= max(length(back), 1e-4);
  lean = mix(0.62 + 0.25*(sRnd - 0.5), lean, fo);
  lean += rest*0.15*(sin(dot(q, vec2(0.07, 0.043)) - uTime*2.2) + 0.5*sin(uTime*3.4 + sRnd*40.));
  sFR = vec3(-back.z, 0., back.x);
  sUp = vec3(0., cos(lean), 0.) + back*sin(lean);
  sNrm = -back*cos(lean) + vec3(0., sin(lean), 0.);
  float ya = (sRnd > 0.5 ? 0.82 : -0.82)*(1. - 0.4*uJuv);
  sBDir = sDir*cos(ya) + sRight*sin(ya);
  sBRight = vec3(sBDir.z, 0., -sBDir.x);
  vec2 sf = uSunDir.xz/max(length(uSunDir.xz), 1e-3);
  sSide = dot(sFR.xz, sf);
}
`;
// pleat louvre phase: each pleat turns over one after the next as gold goes 0 -> 1
const FLIP_GLSL = /* glsl */`float flipPhase(float k, float g){ return smoothstep(k/12., k/12. + 0.34, g); }`;

function buildSuitorMaterial(SU, own, shadowGLSL) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SU, own), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute float aKind;
      varying vec3 vW, vN, vT, vCol; varying vec4 vFan; varying vec4 vState; varying vec2 vEld;
      ${SUITOR_VS}
      ${FLIP_GLSL}
      void main(){
        placeSuitor(0.);
        float size = (0.88 + 0.26*sRnd)*uSize*sShow;
        float openK = mix(0.23, 1., sOpen);
        float rise = 0.3*sOpen + 0.07*sTrans*abs(sin(uTime*13. + sRnd*30.));
        vec3 P, N; vT = sRight; vFan = vec4(0., 0., aKind, 0.); float lit = 0.5;
        if (aKind < 0.5 || aKind > 3.5) {
          vec3 lp = position; vec3 ln = normal;
          if (aKind > 3.5 && aKind < 4.5) lp += ln*0.07*sOpen*(0.8 + 0.2*sin(uTime*5. + sRnd*20.));
          lp.y += rise*smoothstep(0., 0.6, lp.y);
          P = sBase + (sBRight*lp.x + vec3(0., lp.y, 0.) + sBDir*lp.z)*size;
          N = sBRight*ln.x + vec3(0., ln.y, 0.) + sBDir*ln.z;
        } else {
          float rc = position.x, rad = position.y, lat = position.z;
          float k = min(floor(rc), 7.), fr = rc - k, ph = 0.;
          if (aKind > 1.5 && aKind < 2.5) { ph = flipPhase(k, sGold); fr *= abs(cos(3.14159*ph)); }
          else { k = rc; fr = 0.; }
          float th = ((k + fr)/8. - 0.5)*2.967*openK;
          th += 0.05*sTrans*sin(uTime*56. + sRnd*40.) + 0.012*sin(uTime*2.3 + sRnd*17. + rc)*sOpen;
          vec3 R = sFR*sin(th) + sUp*cos(th), T = sFR*cos(th) - sUp*sin(th);
          float depth = (aKind > 1.5 && aKind < 2.5) ? -0.15*rad*sin(3.14159*clamp(fr, 0., 1.))*openK : 0.035;
          vec3 pivot = sBase + (vec3(0., 1.1*uBodyK + rise, 0.) - sBDir*0.52*uBodyK)*size;
          lit = fanLitV(sin(th)*rad/2.4*sSide, cos(th)*rad/3.);
          P = pivot + (R*rad + T*lat + sNrm*depth)*size;
          N = sNrm; vT = T; vFan = vec4(rc, rad/3., aKind, ph);
        }
        vW = P; vN = N; vCol = aCol; vState = vec4(sOpen, sGold, sRnd, lit); vEld = vec2(sEld, sSide);
        gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vT, vCol; varying vec4 vFan; varying vec4 vState; varying vec2 vEld;
      uniform float uTime, uUnfurl; uniform vec3 uHeroPos;
      float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
      ${LIGHT_GLSL.replace(/vec3 nearestSuitor[\s\S]*$/, '')}
      ${shadowGLSL}
      void main(){
        float kind = vFan.z;
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); vec3 alb; float trans = 0.; float gloss = 0.;
        vec3 V = normalize(cameraPosition - vW);
        float dist = length(cameraPosition - vW);
        // what is too small to draw settles to the colour of the fan it belongs to, never to black specks
        float farB = smoothstep(40., 105., dist), farK = smoothstep(0.35, 1.3, fwidth(vFan.y)*6.);
        float openK = smoothstep(0.02, 0.26, vState.x);
        if (kind < 0.5 || (kind > 3.5 && kind < 4.5)) {
          alb = vCol*mix(0.8 + 0.4*hash21(floor(vW.xy*9.) + floor(vW.z*9.)), 1., farB);
        } else if (kind > 4.5) {
          float rr = length(vCol.xy); if (rr > 1.) discard;
          alb = rr > 0.5 ? uRose*0.95 : mix(vec3(0.02), uSlate*3., smoothstep(14., 38., dist));
        } else if (kind < 1.5) {
          alb = mix(uSlate*0.9, uLemon*0.5, 1. - smoothstep(0.06, 0.16, vFan.y));
          alb = mix(alb, uLemon*0.45, (1. - smoothstep(0.02, 0.05, abs(fract(vFan.y*5.) - 0.5)))*0.6);
          alb = mix(alb, furledBlade(vFan.x, vFan.y, vEld.y)*1.15, (1. - vState.x)*0.85);
          trans = farK*openK;
        } else if (kind > 2.5) {
          alb = mix(uRose*0.9, uLemon*0.7, 0.25);
        } else {
          float rc = vFan.x, fr = fract(rc), rad = vFan.y;
          float gold = step(0.5, vFan.w);
          float s = fr < 0.5 ? 1. : -1.;
          n = normalize(n + vT*s*0.85*smoothstep(0., 0.3, vState.x));
          float vein = (1. - smoothstep(0.03, 0.09, abs(fract(fr*4. + 0.5) - 0.5)))*(1. - farK);
          float ringB = 0.5 + 0.5*sin(rad*34. + sin(rc*3.)*1.5);
          float grain = hash21(floor(vec2(rc*24., rad*60.)));
          vec3 front = mix(uRoot*0.8, uFront, smoothstep(0.08, 0.62, rad))*(0.82 + 0.25*ringB);
          front = mix(front, uRoot*0.5, vein*0.5);
          float eyeSpot = 1. - smoothstep(0.05, 0.085, length(vec2((fr - 0.5)*0.55, rad - 0.8)));
          front = mix(front, uGold*0.75, eyeSpot*0.9);
          vec3 back = uGold*0.75*(0.78 + 0.3*grain)*(0.85 + 0.2*ringB);
          back = mix(back, uGold*0.35, vein*0.35);
          alb = mix(front, back, gold);
          alb = mix(furledBlade(rc, rad, vEld.y), alb, openK);                          // furled: one slim blade, gold along its sun edge
          trans = 1.; gloss = 1. - gold;
        }
        if (dot(n, V) < 0.) n = -n;
        float castSh = max(greatFanShadow(vW - uHeroPos, uSunDir, uUnfurl), vEld.x);
        float gsh = 1. - castSh*0.8;
        float ndl = dot(n, uSunDir);
        // the low sun reaches the sun-side, upper part of each fan; the rest stands in its neighbour's shade
        float lk = mix(1., mix(0.3, 1.75, vState.w), trans)*gsh;
        vec3 col = alb*(uSunCol*max(ndl, 0.)*lk + hemi(n.y)*mix(1., mix(0.82, 1.08, vState.w), trans)*(0.62 + 0.38*gsh) + uGndCol*0.7*(1. - trans));
        float g2 = clamp(dot(n, normalize(vec3(uSunDir.x, uSunDir.y + 0.62, -0.3*uSunDir.z) + vec3(0., 1e-4, 0.)))*0.75 + 0.25, 0., 1.);
        col += alb*uSunCol*0.42*g2*g2*(1. - trans)*gsh;                           // the bright sun-side sky on hide and bone
        // the sun behind a membrane comes through it: teal to lemon
        vec3 tc = mix(alb*1.5 + uLemon*0.10, alb, 0.3);
        col += trans*tc*uSunCol*max(-ndl, 0.)*0.62*lk;
        vec3 H = normalize(V + uSunDir + vec3(0., 1e-4, 0.));
        col += gloss*uSunCol*0.22*pow(max(dot(n, H), 0.), 24.)*lk*(1. + 2.*uWet);
        if (kind > 0.5 && kind < 3.5) col = mix(col, fanFarLit(kind > 1.5 && kind < 2.5 ? step(0.5, vFan.w) : step(0.5, vState.y), vState.w)*gsh, farK*openK);
        else col = mix(col, fanFarLit(step(0.5, vState.y), 0.2)*gsh, farB*0.7*openK);                // bodies under open fans: the fan's own shade
        col = inShade(col, castSh*0.8);
        gl_FragColor = vec4(applyHaze(col, vW), 1.);
      }`,
  });
}

// Middle and far distance: one quad per suitor, the fan drawn in the fragment shader with the same
// kinematics (open angle, pleats, louvre flip, lean) and the same paints as the full suitor.
function buildCardMaterial(SU, own, level, shadowGLSL) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SU, own), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vW, vR, vU, vN; varying vec2 vC; varying vec4 vState; varying float vSide, vEld;
      ${SUITOR_VS}
      void main(){
        placeSuitor(${level.toFixed(1)});
        float size = (0.88 + 0.26*sRnd)*uCoarse*sShow;
        vec3 pivot = sBase + (vec3(0., 1.1*uBodyK + 0.3*sOpen, 0.) - sBDir*0.52*uBodyK)*size;
        float th = 0.05*sTrans*sin(uTime*56. + sRnd*40.);
        vec3 R = sFR*cos(th) + sUp*sin(th), U = sUp*cos(th) - sFR*sin(th);
        vec3 P = pivot + (R*position.x + U*position.y)*size;
        vSide = sSide; vEld = sEld;
        vW = P; vR = R; vU = U; vN = sNrm; vC = position.xy; vState = vec4(sOpen, sGold, sRnd, sDist);
        gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vR, vU, vN; varying vec2 vC; varying vec4 vState; varying float vSide, vEld;
      uniform float uUnfurl; uniform vec3 uHeroPos;
      float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
      ${LIGHT_GLSL}
      ${FLIP_GLSL}
      ${shadowGLSL}
      void main(){
        vec2 c = vC; float open = vState.x, gold = vState.y;
        float fw = fwidth(c.x) + fwidth(c.y);
        float r = length(c), th = atan(c.x, c.y + 1e-4);
        float halfA = 1.4835*mix(0.23, 1., open);
        float rc = clamp((th/(2.*halfA) + 0.5)*8., 0., 7.999), k = floor(rc), fr = rc - k;
        float ph = flipPhase(k, gold);
        float rim = 2.95 - 0.36*sin(3.14159*fr)*smoothstep(0.2, 0.6, open);
        float inFan = step(abs(th), halfA)*step(0.12, r)*step(r, rim);
        // ribs: kept a pixel and a half wide where they are the picture (furled blades), but never allowed to
        // swallow the membrane of an open or opening fan, which is what turned half-open ranks black
        float ribD = min(fr, 1. - fr)*r*0.37*mix(0.23, 1., open) + (1. - inFan);
        float so = smoothstep(0.1, 0.5, open);
        float rib = 1. - step(0.07 + fw*0.3, ribD);
        float ribGap = 1. - step(0.07 + fw*mix(0.3, 0.08, so), ribD);
        float louvre = step(fr, abs(cos(3.14159*ph)) + 0.04);
        float body = step(length((c - vec2(0., -0.5))/vec2(0.52, 0.72)), 1.);
        body = max(body, step(abs(abs(c.x) - (-c.y - 0.25)*0.75), 0.09)*step(c.y, -0.3)*step(-1.2, c.y));
        float fan = inFan*max(louvre, ribGap);
        if (fan + body < 0.5) discard;
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); vec3 alb; float trans = 0., gloss = 0.;
        vec3 V = normalize(cameraPosition - vW);
        float lit = fanLit(c.x/2.4*vSide, c.y/3.);
        if (fan < 0.5) { alb = mix(uSlate, uRoot, 0.46)*4.4; lit = 0.5; }   // the same animal from afar: the suitor's hide (slate and indigo slots in equal parts) written in the balanced slots: 0.46 of the indigo, lifted 4.4, keeps the wedge nearest the hide in every channel under the four hours' lights and in the three liveries together, and in each of them nearer than live's wedge stood to live's hide
        else {
          vec3 ribC = mix(uSlate*2.4, furledBlade(rc, r/3., vSide)*1.15, (1. - open)*0.85);
          alb = ribC;
          if (louvre > 0.5) {
          vec3 T = vR*cos(th) - vU*sin(th);
          n = normalize(n + T*(fr < 0.5 ? 1. : -1.)*0.85*smoothstep(0., 0.3, open));
          float rad = r/3.;
          float ringB = 0.5 + 0.5*sin(rad*34. + sin(rc*3.)*1.5);
          vec3 front = mix(uRoot*0.8, uFront, smoothstep(0.08, 0.62, rad))*(0.82 + 0.25*ringB);
          float eyeSpot = 1. - smoothstep(0.05, 0.085, length(vec2((fr - 0.5)*0.55, rad - 0.8)));
          front = mix(front, uGold*0.75, eyeSpot*0.9);
          vec3 back = uGold*0.75*(0.93 + 0.2*ringB - 0.1);
          alb = mix(front, back, step(0.5, ph));
          alb = mix(furledBlade(rc, rad, vSide), alb, smoothstep(0.02, 0.26, open));   // furled: one slim blade, gold along its sun edge
          trans = 1.; gloss = 1. - step(0.5, ph);
          }
          float ra = rib*mix(1., 0.07/(0.07 + fw*0.3), louvre*so);
          alb = mix(alb, ribC, ra); trans *= 1. - ra; gloss *= 1. - ra;
        }
        if (dot(n, V) < 0.) n = -n;
        float castSh = max(greatFanShadow(vW - uHeroPos, uSunDir, uUnfurl), vEld);
        float gsh = 1. - castSh*0.8;
        float ndl = dot(n, uSunDir);
        float lk = mix(1., mix(0.3, 1.75, lit), trans)*gsh;
        vec3 col = alb*(uSunCol*max(ndl, 0.)*lk + hemi(n.y)*mix(1., mix(0.82, 1.08, lit), trans)*(0.62 + 0.38*gsh));
        col += trans*mix(alb*1.5 + uLemon*0.10, alb, 0.3)*uSunCol*max(-ndl, 0.)*0.62*lk;
        // too small to resolve the pleats: settle to the colour the ground paint uses, keeping the lit / shade relief
        float far = smoothstep(0.35, 1.3, fw)*fan*smoothstep(0.02, 0.26, open);
        // (beyond that each fan keeps a lit or shaded grain of its own, so a far field of gold is corduroy, not paint)
        col = mix(col, fanFarLit(gold, mix(lit, 0.16 + 0.62*vState.z, smoothstep(2.5, 7., fw)))*(0.9 + 0.2*vState.z)*gsh, far);
        col = inShade(col, castSh*0.8);
        gl_FragColor = vec4(applyHaze(col, vW), 1.);
      }`,
  });
}

function quadGeometry(x0, x1, y0, y1) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// ---------------------------------------------------------------- the choosers
// White fliers: 2 m body, long neck, rose bill, two pairs of narrow wings beating out of step, three
// tail ribbons. Local +Z is forward. aPart: x = 0 body, 1 fore wing, 2 hind wing, 3 ribbon; y = span or length 0..1; z = side / ribbon index.
function buildChooserGeometry() {
  const pos = [], nor = [], part = [], tint = [], idx = [];
  const V = (p, n, pt, tn) => { pos.push(...p); nor.push(...n); part.push(...pt); tint.push(tn); return pos.length / 3 - 1; };
  // body, neck, head, bill as one lofted tube along z: [z, y, rx, ry, tint]  (tint 0 white, 1 rose bill)
  const rings = [[-1.0, 0.02, 0.02, 0.02, 0], [-0.8, 0.03, 0.11, 0.09, 0], [-0.35, 0.0, 0.22, 0.19, 0], [0.1, -0.02, 0.25, 0.22, 0], [0.45, 0.0, 0.19, 0.17, 0],
    [0.75, 0.06, 0.09, 0.09, 0], [1.2, 0.12, 0.065, 0.065, 0], [1.55, 0.13, 0.06, 0.06, 0], [1.68, 0.14, 0.095, 0.085, 0], [1.8, 0.12, 0.05, 0.04, 1], [2.08, 0.08, 0.008, 0.008, 1]];
  const S = 8;
  rings.forEach((r) => { for (let k = 0; k < S; k++) { const a = (k / S) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); V([c * r[2], r[1] + s * r[3], r[0]], [c, s, 0], [0, 0, 0], r[4]); } });
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < S; k++) { const q = i * S + k, q1 = i * S + (k + 1) % S; idx.push(q, q + S, q1, q1, q + S, q1 + S); }
  // wings: narrow tapering strips; the shader bends them
  const wing = (z0, half, chord, id) => { for (const sd of [-1, 1]) {
    const base = pos.length / 3, n = 6;
    for (let i = 0; i <= n; i++) {
      const s = i / n, x = sd * (0.12 + s * half), ch = chord * (1 - 0.8 * s * s) * (0.55 + 0.45 * Math.sin(Math.min(s * 2.2 + 0.25, 1.57))), sweep = (0.22 * Math.sin(s * 3.1) - 0.95 * s * s) * half * 0.42;
      V([x, 0.1, z0 + ch * 0.4 + sweep], [0, 1, 0], [id, s, sd], 0); V([x, 0.1, z0 - ch * 0.6 + sweep], [0, 1, 0], [id, s, sd], -1);
    }
    for (let i = 0; i < n; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  } };
  wing(0.36, 2.5, 1.2, 1); wing(-0.46, 1.9, 0.95, 2);
  for (let j = 0; j < 3; j++) {
    const base = pos.length / 3, n = 12, x0 = (j - 1) * 0.07;
    for (let i = 0; i <= n; i++) { const s = i / n, w = 0.022 + 0.018 * Math.sin(s * Math.PI) + (s > 0.84 ? 0.075 * Math.sin((s - 0.84) / 0.16 * Math.PI) : 0);
      V([x0 - w * 1.5, 0.03, -0.9 - s * 4.6], [0, 1, 0], [3, s, j], 0); V([x0 + w * 1.5, 0.03, -0.9 - s * 4.6], [0, 1, 0], [3, s, j], 0); }
    for (let i = 0; i < n; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 3)); g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 1));
  g.setIndex(idx);
  return g;
}

function buildChooserMaterial(SU, beat) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SU, { uBeat: { value: beat } }), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aPart; attribute float aTint, aPhase;
      uniform float uTime, uBeat;
      varying vec3 vW, vN; varying float vTint, vUnder; varying vec2 vWing;
      void main(){
        vec3 p = position, n = normal; float id = aPart.x, s = aPart.y;
        vUnder = 0.; vWing = vec2(id, s);
        if (id > 0.5 && id < 2.5) {
          float ph = uTime*uBeat + aPhase + (id > 1.5 ? 2.1 : 0.);
          float ang = (0.46*sin(ph) + 0.22)*s + 0.3*sin(ph - 1.1)*s*s;
          float x0 = 0.12*aPart.z, dx = p.x - x0;
          p.x = x0 + dx*cos(ang); p.y += abs(dx)*sin(ang);
          n = normalize(vec3(-aPart.z*sin(ang), cos(ang), 0.));
        } else if (id > 2.5) {
          float w = s*4.6;
          p.x += (0.10 + 0.05*aPart.z)*w*0.5*sin(uTime*4.3 - w*0.9 + aPhase + aPart.z*1.7)*s + (aPart.z - 1.)*0.35*s;
          p.y += 0.22*w*0.4*sin(uTime*3.1 - w*0.7 + aPhase*1.3 + aPart.z)*s - 0.25*s*s;
          n = normalize(vec3(0.3*cos(uTime*4.3 - w*0.9 + aPhase), 1., 0.));
        } else {
          p.y += 0.05*sin(uTime*uBeat + aPhase + 3.14);
        }
        vec4 wp = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix*instanceMatrix)*n + vec3(0., 1e-5, 0.)); vTint = aTint;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vTint; varying vec2 vWing;
      float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
      ${LIGHT_GLSL}
      uniform vec3 uWhite, uLav; uniform float uChooserFill;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
        if (dot(n, cameraPosition - vW) < 0.) n = -n;
        float trail = max(-vTint, 0.);
        vec3 alb = mix(uWhite*0.72, uRose*0.85, max(vTint, 0.));
        float ndl = dot(n, uSunDir);
        // a real sun side and a lavender shade side: surfaces turned to the low sun are warm white, those turned
        // away (the far wings, the belly, the far flank of the neck) fall to lavender, as do undersides
        vec3 sh = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-4, 0., 0.));
        float sideLit = dot(n, sh);
        float wingK = step(0.5, vWing.x)*step(vWing.x, 2.5);
        float lit = clamp(0.55 + 0.75*sideLit + 0.35*n.y, 0., 1.);
        lit = mix(lit, lit*0.55 + 0.45*smoothstep(-0.2, 0.5, n.y), wingK);
        // feathers: the trailing edge and the tips lie in the shade of the leading edge
        lit *= 1. - wingK*(0.62*smoothstep(0.25, 0.95, trail) + 0.3*smoothstep(0.6, 1., vWing.y));
        alb *= 1. - 0.12*wingK*step(0.5, fract(vWing.y*9.))*smoothstep(0.3, 0.8, trail);
        vec3 col = alb*(uSunCol*(max(ndl, 0.)*0.5 + max(-ndl, 0.)*0.1) + mix(uLav*0.78, vec3(1.16, 1.14, 1.04)*uChooserFill, lit));
        gl_FragColor = vec4(applyHaze(col, vW), 1.);
      }`,
  });
}

// Flock choreography. Returns { mesh, update(time, u, camDist, camMatrixElements) }.
// The few nearest birds hold stations in the lens's own frame (ahead, below and to the left, stepping back on a
// diagonal toward the centre), far enough that each is whole in the picture with its ribbons; the rest fly one or
// two clean Vs ahead on offset copies of the path. Near the end the leaders go on ahead into the collar and the
// Vs bank away left across the pleats, so nothing crosses the Great Fan's limbs or the portal in the last stretch.
function buildChoosers(ctx, SU, path, V) {
  const rng = ctx.rng.fork('choosers');
  const cfg = { twenty: { n: 20, scale: 1, beat: 3.1, near: 4, vs: [{ n: 16, lead: 118, step: 7, lat0: 8, latStep: 5.2, drop: 10 }] },
    skein: { n: 36, scale: 0.62, beat: 7.5, near: 5, vs: [{ n: 15, lead: 70, step: 5, lat0: 5, latStep: 3.1, drop: 6.5 }, { n: 16, lead: 128, step: 6, lat0: 36, latStep: 4.4, drop: 15 }] },
    // giants swing wide as the Fan opens, then wheel across its face (u 0.86 to 0.90): two from the right with the low
    // sun on their backs, one from the left, each banked into its turn, and climb away over the rim. Station ahead,
    // right, above (metres in the lens's frame), the distance each travels across (leftward positive), and its bank
    giants: { n: 3, scale: 2.8, beat: 1.5, near: 3, vs: [], fan: [[50, 15.2, 16.5, 20, 0.95], [56, -27, 12, -14, 0.85], [40, 22.6, 9, 14, 0.8]] } }[V.cast];
  const SLOT = [[19, -7.8, 5.6], [24, -3.2, 6.5], [30, 2, 7.4], [37, 8, 8.3], [45, 15, 9.2]];      // ahead, right, below (metres at scale 1)
  const sk = Math.pow(cfg.scale, 0.94);
  const geo = buildChooserGeometry();
  const mesh = new THREE.InstancedMesh(geo, buildChooserMaterial(SU, cfg.beat), cfg.n);
  mesh.frustumCulled = false;
  const ph = new Float32Array(cfg.n), B = [];
  for (let i = 0; i < cfg.n; i++) {
    ph[i] = rng() * 6.283;
    const f1 = rng.range(0.11, 0.23), f2 = rng.range(0.07, 0.16), p1 = rng() * 6.283, p2 = rng() * 6.283;
    if (i < cfg.near) { const sl = SLOT[i]; B.push({ near: true, lead: sl[0] * sk, lat: sl[1] * sk, drop: sl[2] * sk, f1, f2, p1, p2, fan: cfg.fan ? cfg.fan[i] : null }); continue; }
    let j = i - cfg.near, g = 0; while (g < cfg.vs.length - 1 && j >= cfg.vs[g].n) { j -= cfg.vs[g].n; g++; }
    const v = cfg.vs[g], arm = j % 2 ? 1 : -1, rank = Math.ceil(j / 2);
    B.push({ near: false, lead: v.lead - rank * v.step + rng.range(-0.6, 0.6), lat: v.lat0 + arm * rank * v.latStep + rng.range(-0.4, 0.4), drop: v.drop + rank * 0.35 + rng.range(-0.3, 0.3), f1, f2, p1, p2, peel: arm > 0 });
  }
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), q = new THREE.Vector3(), tg = new THREE.Vector3(), rt = new THREE.Vector3(), up = new THREE.Vector3(), f = new THREE.Vector3();
  const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), pY = new THREE.Vector3();
  const cP = new THREE.Vector3(), cR = new THREE.Vector3(), cU = new THREE.Vector3(), cF = new THREE.Vector3();
  // low over the lane, above the fans elsewhere; no step between the two
  const laneW = (o) => (1 - smoothstep(4.5, 9.5, Math.abs(o.x - HERO_X))) * (1 - smoothstep(LANE_Z0 - 12, LANE_Z0 + 12, o.z)) * smoothstep(LANE_Z1 - 12, LANE_Z1 + 12, o.z);
  const HIGH = 6.5 * cfg.scale + 1.5;
  const floorY = (o) => groundH(o.x, o.z) + lerp(HIGH, 3.4, laneW(o));
  const q5 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * t * (t * (6 * t - 15) + 10); };
  const dq5 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return 30 * t * t * (1 - t) * (1 - t) / (b - a); };
  let slX = 0, slY = 0, hide = false, wheel = 0;                        // a near bird's sideways and upward drift per metre flown, for its heading
  // a bird on an offset copy of the path
  const onPath = (b, d, lat, drop, own, out) => {
    path.posAtDist(d, out); path.tangentAtDist(d, tg);
    out.y = lerp(path.posAtDist(d - b.lead, pY).y, out.y, own);       // most of the height from where the lens is: below eye level through climbs and descents
    rt.set(-tg.z, 0, tg.x); if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0); rt.normalize();
    out.addScaledVector(rt, lat); out.y -= drop;
    return out;
  };
  const place = (b, time, u, d0, out) => {
    const amp = V.cast === 'skein' ? 0.6 : 1;
    const wl = Math.sin(time * b.f2 + b.p2), wx = Math.sin(time * b.f1 + b.p1), wy = Math.sin(time * b.f2 * 1.3 + b.p1);
    if (b.near) {
      let L = b.lead + 1.3 * sk * wl, Xs = b.lat + 1.0 * sk * wx, D = b.drop + 0.45 * sk * wy;
      slX = 0; slY = 0; hide = false; wheel = 0;
      if (b.fan) {
        const k = q5(0.79, 0.865, u), c = q5(0.835, 0.945, u), e = q5(0.9, 0.95, u), F = b.fan;
        const dk = dq5(0.79, 0.865, u), dc = dq5(0.835, 0.945, u), de = dq5(0.9, 0.95, u);
        out.copy(cP).addScaledVector(cF, L).addScaledVector(cR, Xs);
        const low = laneW(out) * (1 - k);                                // one that flew low over the lane rises with the rest, at its own pace
        const way = F[3] > 0 ? 1 : -1;
        L += (F[0] - b.lead) * k; Xs += (F[1] - b.lat) * k - F[3] * c - way * 50 * e; D += (-F[2] - b.drop) * k - 30 * e;
        slX = ((F[1] - b.lat) * dk - F[3] * dc - way * 50 * de) / path.length; slY = (30 * de + (F[2] + b.drop) * dk) / path.length;
        wheel = way * F[4] * dc * 0.11 / 1.875; hide = e > 0.995;
        out.copy(cP).addScaledVector(cF, L).addScaledVector(cR, Xs).addScaledVector(cU, -D);
        const fl = groundH(out.x, out.z) + lerp(HIGH, 3.4, low), dy = out.y - fl, root = Math.sqrt(dy * dy + 25);
        out.y = fl + 0.5 * (dy + root);                                  // a soft floor: no kink where the station lifts off it
        slY = 0.3 * Math.tanh(slY * 0.5 * (1 + dy / root) / 0.3);
        return Math.min(d0 + L, path.length - 2);
      }
      const go = smoothstep(0.8, 0.9, u);                              // the leaders go on ahead into the collar
      out.copy(cP).addScaledVector(cF, L).addScaledVector(cR, Xs).addScaledVector(cU, -D);
      out.y = Math.max(out.y, floorY(out));
      if (go <= 0) return d0 + L;
      const gt = clamp((u - 0.8) / 0.1, 0, 1), dgo = 60 * gt * (1 - gt) / path.length;
      slX = -Xs * dgo; slY = D * dgo;
      const d = d0 + L + go * 132;
      onPath(b, d, Xs * (1 - go), D * (1 - go), go, q); q.y = Math.max(q.y, floorY(q));
      out.lerp(q, go);
      return d;
    }
    const reveal = smoothstep(0.2, 0.4, u) * (1 - smoothstep(0.58, 0.72, u));
    const lane = smoothstep(0.66, 0.74, u) * (1 - smoothstep(0.82, 0.88, u));
    const end = smoothstep(0.82, 0.94, u), rare = V.rare && b.peel ? smoothstep(0.5, 0.75, u) : 0;
    const lead = b.lead + amp * 2.2 * wl + reveal * b.lead * 0.25 + rare * 260;
    let lat = b.lat + amp * 1.3 * wx, drop = b.drop + 0.6 * wy + reveal * (6 + b.drop * 1.2);
    if (lane > 0) { lat = lerp(lat, clamp(lat, -4.2, 4.2), lane); drop = lerp(drop, Math.min(drop, 2.4), lane); }
    lat -= end * (55 + b.lead * 0.6) + rare * -520; drop -= end * (16 + b.lead * 0.25) + rare * 14;
    onPath(b, d0 + lead, lat, drop, 0.3, out);
    out.y = Math.max(out.y, floorY(out));
    return d0 + lead;
  };
  return { mesh, update(time, u, d0, me) {
    cP.set(me[12], me[13], me[14]); cR.set(me[0], me[1], me[2]).normalize(); cU.set(me[4], me[5], me[6]).normalize(); cF.set(-me[8], -me[9], -me[10]).normalize();
    for (let i = 0; i < cfg.n; i++) {
      const b = B[i];
      const d = place(b, time, u, d0, p);
      let bank = 0.18 * Math.sin(time * b.f1 + b.p1 + 1.57);
      if (b.near) {
        const weave = 1 - smoothstep(0.78, 0.84, u);                          // straightens to the line of the lane before it draws ahead
        path.tangentAtDist(Math.min(d, path.length - 2), f);
        const turn = (0.36 + 0.1 * Math.sin(time * b.f1 * 0.7 + b.p2)) * weave;        // a slow weave across our line
        rt.set(-f.z, 0, f.x); if (rt.lengthSq() < 1e-8) rt.set(1, 0, 0); rt.normalize();
        f.addScaledVector(rt, turn + slX - 0.3 * wheel); f.y += slY - 0.1 * weave;
        if (f.lengthSq() < 1e-8) f.set(0, 0, -1); f.normalize();
        bank += 0.34 * weave + 0.45 * clamp(slX, -1, 1) - wheel;
      } else {
        place(b, time + 0.12, u, d0 + 3.4, p2); f.subVectors(p2, p);
        if (f.lengthSq() < 0.25) path.tangentAtDist(Math.min(d, path.length - 2), f);       // never a heading from a difference too small to mean one
        f.normalize();
      }
      rt.set(-f.z, 0, f.x); if (rt.lengthSq() < 1e-8) rt.set(1, 0, 0); rt.normalize(); up.set(0, 1, 0);
      Y.copy(up).addScaledVector(rt, bank).normalize(); X.crossVectors(Y, f).normalize(); Y.crossVectors(f, X);
      const s = cfg.scale * (d > path.length - 1.5 || (b.near && hide) ? 0 : 1);
      m.makeBasis(X, Y, f).scale(p2.set(s, s, s)).setPosition(p);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  } };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'plain-of-fans',
  name: 'The Plain of Fans',
  category: 'alien',
  weirdness: 0.6,
  media: ['air', 'open'],
  async build(ctx) {
    const V = pickVariation(ctx);
    const H = HOURS[V.hour];
    const detail = ctx.quality?.detail ?? 1;
    const palHex = LIVERIES[V.livery].pal;
    const pal = palHex.map((h) => new THREE.Color(h));
    const scene = new THREE.Scene();

    // ---- sky: the brightest thing in every level frame
    const windy = V.weather === 'wind', rainy = V.weather === 'rain';
    const skyOpts = Object.assign({ rng: ctx.rng }, V.hour === 'noon' ? {} : { clouds: false }, H.sky);
    if (H.cirrus) skyOpts.clouds2 = { coverage: rainy ? 0.6 : 0.46, stretch: 1, scale: 1.5, opacity: rainy ? 0.9 : 0.9, softness: 0.4, wind: [windy ? 0.05 : 0.02, 0.004], lit: H.cirrus[0], shade: H.cirrus[1], haze: 0.3 };
    if (rainy && V.hour !== 'noon') skyOpts.clouds = { coverage: 0.5, softness: 0.55, scale: 1.3, opacity: 0.7, absorb: 0.8, lit: V.hour === 'night' ? H.cirrus[0] : [1.5, 1.46, 1.3], shade: V.hour === 'night' ? H.cirrus[1] : [0.84, 0.9, 0.9], wind: [0.02, 0.006] };
    await ctx.yield();
    const sky = makeSky(skyOpts);
    scene.add(sky.object);
    await ctx.yield();
    const sunDir = sky.lightDirection.clone().normalize();
    const lin = (a, k = 1) => new THREE.Color(a[0] * k, a[1] * k, a[2] * k);
    const dim = rainy ? 0.86 : 1;
    const sunCol = lin(H.sun, dim), skyCol = new THREE.Color(H.fill[0]).multiplyScalar(H.fill[1]), gndCol = new THREE.Color(H.gnd[0]).multiplyScalar(H.gnd[1]);
    const fogCol = lin(H.fog), fogSun = lin(H.fogSun);
    const fogDen = (rainy ? 1.5 : V.weather === 'mist' ? 1.15 : 1) * 0.00046;
    scene.fog = new THREE.FogExp2(fogCol.clone().lerp(fogSun, 0.25), fogDen);

    // ---- the course: a shallow S, 180 m to the right, ending level and straight in the Great Fan's collar
    // Low over the ranks to the gate of two elders (u 0.16 to 0.25), up past a third to the reveal from 118 m (u 0.43
    // to 0.52), down between two more onto the lane, then one long shallow climb to the collar (no nod at the end).
    const path = makePath([[0, 25, 0], [0, 25, -70], [0, 26, -150], [4, 29, -230], [14, 35, -320], [30, 45, -400], [56, 72, -480], [91, 108, -570], [128, 121, -670], [158, 100, -780],
      [175, 56, -880], [180, 25, -960], [180, 10.5, -1020], [180, 8, -1060], [180, 8, -1100], [180, 10.5, -1140], [180, 18, -1185], [180, 26.5, -1225], [180, 30, -1255], [HERO_X, 30, HERO_Z]]);

    // ---- the Great Fan
    const hero = await buildHero(ctx, { palette: palHex, autoplay: false, detail, sunColor: sunCol, skyColor: skyCol, groundColor: gndCol, glow: V.hour === 'night' ? 0.45 : 0.8 });
    hero.object.position.set(HERO_X, 0, HERO_Z);
    hero.setSun(sunDir, sunCol);
    hero.setBounce(pal[4].clone().lerp(pal[3], 0.3).multiply(sunCol).multiplyScalar(0.38));
    scene.add(hero.object);
    await ctx.yield();

    // ---- the elders
    const elders = [];
    for (let i = 0; i < NE; i++) {
      const [ex, ez, eh] = ELDERS[i];
      const e = await buildElder(ctx, hero, { palette: palHex, seed: i, scale: eh / 153 });
      e.object.position.set(ex, groundH(ex, ez) - 0.3, ez);
      scene.add(e.object); elders.push(e);
      await ctx.yield();
    }

    // the front paints are balanced against the tint of the hour's light, so teal stays peacock teal under a lemon sky
    const lightT = sunCol.clone().multiplyScalar(0.3).add(skyCol), lightL = (lightT.r + lightT.g + lightT.b) / 3;
    const balance = (c, k = 0.7) => { const o = c.clone(); o.r *= lerp(1, lightL / Math.max(lightT.r, 1e-3), k); o.g *= lerp(1, lightL / Math.max(lightT.g, 1e-3), k); o.b *= lerp(1, lightL / Math.max(lightT.b, 1e-3), k); return o; };
    // ---- uniforms shared by every material of the plain
    const foot = hero.anchors.footprints.slice(0, 6).map((f) => new THREE.Vector3(HERO_X + f[0], HERO_Z + f[1], f[2]));
    while (foot.length < 6) foot.push(new THREE.Vector3(0, 9e5, 1));
    const SU = {
      uTime: { value: 0 }, uU: { value: 0 }, uCamS: { value: 0 }, uPatSet: { value: V.pattern }, uRare: { value: 0 },
      uEye: { value: [new THREE.Vector4(0, 380, 0, 1), new THREE.Vector4(900, 900, 0.4, 1), new THREE.Vector4(-800, 1600, -0.5, 1)] },
      uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol }, uGndCol: { value: gndCol },
      uFogCol: { value: fogCol }, uFogSun: { value: fogSun }, uFogDen: { value: fogDen },
      uFaceSun: { value: 0.3 }, uWet: { value: rainy ? 1 : 0 },
      uSlate: { value: balance(pal[0], 1) }, uFront: { value: balance(pal[1]) }, uRoot: { value: balance(pal[2]) }, uGold: { value: pal[3] }, uLemon: { value: pal[4] }, uRose: { value: pal[6] },
      uWhite: { value: pal[5] }, uLav: { value: new THREE.Color('#9FA4C4') }, uChooserFill: { value: V.hour === 'night' ? 0.34 : V.hour === 'noon' ? 0.9 : 1 },
      uHeroPos: { value: hero.object.position }, uUnfurl: hero.uniforms.uUnfurl,
      uPaintNear: { value: 420 * (0.4 + 0.6 * detail) }, uPaintFar: { value: 760 * (0.4 + 0.6 * detail) }, uMist: { value: H.mist * (V.weather === 'mist' ? 1.25 : windy ? 0.55 : 0.9) },
      uCentreA: { value: new THREE.Vector3() }, uCentreB: { value: new THREE.Vector3() }, uCentreC: { value: new THREE.Vector3() },
      uTileA: { value: new THREE.Vector2(1, 1) }, uTileB: { value: new THREE.Vector2(1, 1) },
      uEld: { value: elders.map((e, i) => new THREE.Vector4(ELDERS[i][0], ELDERS[i][1], e.scale, 0)) },                               // x, z, scale, yaw
      uEldB: { value: elders.map((e) => new THREE.Vector4(e.params.spread, e.params.nRibs - 1, e.object.position.y, e.clear)) },       // half spread, pleats, ground y, cleared radius
      uFoot: { value: foot }, uGust: { value: windy ? 1 : 0.12 }, uShadowK: { value: V.hour === 'noon' ? 0.55 : V.hour === 'night' ? 0.7 : 0.84 },
    };

    // ---- ground
    const ground = new THREE.Mesh(buildGroundGeometry(), buildGroundMaterial(SU, hero.shadowGLSL));
    ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- the ranks: three lattices on the same hexagonal grid
    const thin = ctx.rng.fork('thin');
    const mkLattice = (geo, cols, rows, coarse, keep, mat, centreU) => {
      const lat = addLattice(geo, cols, rows, PITCH * coarse, ROW * coarse, keep, thin);
      mat.uniforms.uTile = { value: lat.tile }; mat.uniforms.uCentre = centreU; mat.uniforms.uCoarse = { value: coarse };
      mat.uniforms.uSize = { value: 1 }; mat.uniforms.uJuv = { value: 0 }; mat.uniforms.uBodyK = { value: BODY_K };
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);
      return lat;
    };
    const suitorGeo = buildSuitorGeometry(pal, BODY_K);
    const latA = mkLattice(suitorGeo, 18, 20, 1, 1, buildSuitorMaterial(SU, {}, hero.shadowGLSL), SU.uCentreA);
    SU.uTileA.value.copy(latA.tile);
    const puffMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SU), transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        varying vec2 vUv; varying float vA; varying vec3 vW;
        ${SUITOR_VS}
        void main(){
          placeSuitor(0.);
          float ph = uTime*0.8 + sRnd*6.283;
          float sz = (1.5 + 1.6*sRnd)*(0.7 + 0.5*sTrans);
          vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 c = sBase + vec3(0.5*sin(ph), 0.5 + 0.9*sTrans + 0.3*sin(ph*1.3), 0.5*cos(ph));
          vec3 P = c + (cr*position.x + vec3(0., 1., 0.)*(position.y - 0.3))*sz;
          vUv = position.xy*2. - vec2(0., 1.); vA = sShow*sTrans*smoothstep(4., 14., sDist); vW = P;
          gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying float vA; varying vec3 vW;
        float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
        ${LIGHT_GLSL}
        void main(){
          float r = length(vUv);
          float a = (1. - smoothstep(0.25, 1., r))*vA*0.5*(0.6 + 0.4*vnoise(vW.xy*1.7 + vW.z));
          if (a < 0.004) discard;
          vec3 col = mix(uLemon*0.55, uSlate*3., 0.35)*(uSunCol*0.5 + uSkyCol*0.9);
          gl_FragColor = vec4(applyHaze(col, vW), a);
        }`,
    });
    mkLattice(quadGeometry(-0.5, 0.5, 0, 1), 18, 20, 1, 1, puffMat, SU.uCentreA);
    await ctx.yield();
    const latB = mkLattice(quadGeometry(-3.4, 3.4, -1.3, 3.45), 120, 138, 1, detail, buildCardMaterial(SU, {}, 1, hero.shadowGLSL), SU.uCentreB);
    SU.uTileB.value.copy(latB.tile);
    await ctx.yield();
    mkLattice(quadGeometry(-3.4, 3.4, -1.3, 3.45), 132, 152, 2, detail, buildCardMaterial(SU, {}, 2, hero.shadowGLSL), SU.uCentreC);
    await ctx.yield();
    // juveniles practising in the display lane
    const juvGeo = buildSuitorGeometry(pal, BODY_K);
    const juvRng = ctx.rng.fork('juv'), juvCells = [];
    for (let i = 0; i < 56; i++) juvCells.push(HERO_X + juvRng.range(-4.5, 4.5), lerp(LANE_Z0 - 20, LANE_Z1 + 30, (i + juvRng()) / 56));
    juvGeo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(juvCells), 2));
    juvGeo.instanceCount = 56; juvGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const juvMat = buildSuitorMaterial(SU, {}, hero.shadowGLSL);
    Object.assign(juvMat.uniforms, { uTile: { value: new THREE.Vector2(1e6, 1e6) }, uCentre: SU.uCentreA, uCoarse: { value: 1 }, uSize: { value: 0.54 }, uJuv: { value: 1 }, uBodyK: { value: BODY_K } });
    const juv = new THREE.Mesh(juvGeo, juvMat); juv.frustumCulled = false; scene.add(juv);

    // ---- mist pooled in the swales: one flat sheet whose opacity is the depth of ground beneath it
    const mistMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SU), transparent: true, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position, 1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.); }`,
      fragmentShader: /* glsl */`
        varying vec3 vW; uniform float uTime, uMist, uU;
        float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
        ${LIGHT_GLSL}
        ${GROUND_GLSL}
        void main(){
          vec2 w = vW.xz; float gh = groundH(w);
          vec2 drift = vec2(uTime*1.1, uTime*0.35);
          float n = fbm3(w*0.018 + drift*0.02)*0.65 + fbm3(w*0.07 - drift*0.05)*0.35;
          // pooled where the ground is low: a bank deep enough to drown the fans standing in the swale
          float pool = 1. - smoothstep(-2.9, -1.3, gh + (n - 0.5)*1.8);
          float a = pool*(0.35 + 0.65*smoothstep(0.3, 0.72, n))*uMist*0.78;
          // dust thrown up along the opening front
          float fr = 170. - 555.*uU + 1.15*abs(w.x - 4.)*(1. - smoothstep(0.04, 0.16, uU));
          float df = (-w.y - fr - 8.)/16.;
          a = max(a, exp(-df*df)*(1. - smoothstep(0.17, 0.22, uU))*(0.3 + 0.7*n)*0.5);
          vec3 v = vW - cameraPosition; float d = length(v);
          a *= smoothstep(8., 45., d)*mix(0.5, 1., smoothstep(50., 170., d))*(1. - laneMask(w))*(1. - smoothstep(0.3, 0.9, abs(v.y)/max(d, 1e-3))*0.45)*(1. - 0.5*smoothstep(40., 105., cameraPosition.y - vW.y));
          float sunward = max(dot(v/max(d, 1e-3), uSunDir), 0.);
          vec3 col = mix(uFogCol, uFogSun, 0.55 + 0.45*sunward)*(1.25 + 0.35*n);
          gl_FragColor = vec4(applyHaze(col, vW), a);
        }`,
    });
    const mistGeo = new THREE.PlaneGeometry(9000, 9000, 1, 1); mistGeo.rotateX(-Math.PI / 2);
    for (const my of [1.0, 2.4]) { const mist = new THREE.Mesh(mistGeo, mistMat); mist.position.set(HERO_X, my, -2400); mist.frustumCulled = false; mist.renderOrder = 2; scene.add(mist); }

    // ---- wire-grass: indigo tufts with rose seed heads, wrapped round the near lattice's centre
    const grng = ctx.rng.fork('grass'), nG = Math.round(4200 * detail * clamp(V.density, 0.8, 1.2)), GT = 112;
    const gGeo = new THREE.InstancedBufferGeometry();
    gGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0, 0, 0, -0.5, 0, 0, 0.5, 0, 1, 0.5, 0, 1, -0.5]), 3));
    gGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]), 2));
    gGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    const gc = new Float32Array(nG * 4);
    for (let i = 0; i < nG; i++) gc.set([grng() * GT, grng() * GT, grng(), grng()], i * 4);
    gGeo.setAttribute('aCell4', new THREE.InstancedBufferAttribute(gc, 4)); gGeo.instanceCount = nG;
    gGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const grassMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SU, { uTile: { value: new THREE.Vector2(GT, GT) } }), side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aCell4; varying vec2 vUv; varying vec3 vW; varying float vR;
        uniform vec3 uCentreA; uniform vec2 uTile; uniform float uTime, uGust; uniform vec3 uFoot[6];
        ${GROUND_GLSL}
        ${ELDER_GLSL}
        void main(){
          vec2 q = aCell4.xy + floor((uCentreA.xz - aCell4.xy)/uTile + 0.5)*uTile;
          vec2 e = abs(q - uCentreA.xz)/(uTile*0.5);
          float s = (0.75 + 1.15*aCell4.z)*(1. - smoothstep(0.8, 1., max(e.x, e.y)));
          for (int i = 0; i < 6; i++) s *= smoothstep(uFoot[i].z, uFoot[i].z + 5., length(q - uFoot[i].xy));
          s *= smoothstep(-6., 2., elderDist(q));
          float a = aCell4.w*6.283; vec2 rot = vec2(cos(a), sin(a));
          vec3 lp = vec3(position.x*rot.x - position.z*rot.y, position.y, position.x*rot.y + position.z*rot.x);
          float wind = (0.12 + 0.4*uGust)*(sin(uTime*1.7 + q.x*0.21 + q.y*0.13) + 0.5*sin(uTime*3.1 + q.x*0.5));
          vec3 P = vec3(q.x, groundH(q), q.y) + vec3(lp.x*0.75, lp.y*0.5, lp.z*0.75)*s + vec3(1., 0., 0.3)*wind*position.y*position.y*0.3*s;
          vUv = uv; vW = P; vR = aCell4.z;
          gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying vec3 vW; varying float vR;
        float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
        ${LIGHT_GLSL}
        void main(){
          float b = floor(vUv.x*7.), bh = 0.45 + 0.55*hash21(vec2(b, floor(vR*90.)));
          float fx = abs(fract(vUv.x*7.) - 0.5 - (hash21(vec2(b, 3.)) - 0.5)*0.5*vUv.y);
          float blade = step(fx, 0.34*(1. - vUv.y/bh))*step(vUv.y, bh);
          float head = step(length(vec2(fx*0.55, (vUv.y - bh*0.95)*1.5)), 0.13)*step(0.4, hash21(vec2(b, 9.)));
          if (blade + head < 0.5) discard;
          vec3 alb = mix(mix(uRoot*0.5, uSlate*3.0, 0.62)*(0.6 + 0.9*vUv.y), uRose*0.95, head);
          vec3 col = alb*(uSunCol*(0.35 + 0.5*vUv.y) + uSkyCol*0.9);
          gl_FragColor = vec4(applyHaze(col, vW), 1.);
        }`,
    });
    const grass = new THREE.Mesh(gGeo, grassMat); grass.frustumCulled = false; scene.add(grass);
    await ctx.yield();

    // ---- air: shed gold scales rising, dust from the stamping, rain in the wet variation
    const fxTime = { value: 0 }, parts = [];
    const goldC = pal[3].clone().multiplyScalar(0.9), goldD = pal[3].clone().multiplyScalar(0.5), paleC = pal[4].clone().multiplyScalar(0.7);
    parts.push(fx.makeParticles({ rng: ctx.rng.fork('scales'), preset: 'petals', time: fxTime, count: Math.round(1300 * detail), box: [70, 30, 70],
      velocity: [1.2 + (windy ? 4 : 0), 0.9, 0.3], velocityRandom: [0.8, 0.7, 0.8], colors: [goldC, goldD, paleC], size: [0.07, 0.17], lightDir: sunDir }));
    parts.push(fx.makeParticles({ rng: ctx.rng.fork('dust'), preset: 'dust', time: fxTime, count: Math.round(900 * detail), box: [60, 14, 60],
      colors: [paleC, goldC, paleC], intensity: V.hour === 'night' ? 0.25 : 0.8, additive: 0 }));
    if (rainy) parts.push(fx.makeParticles({ rng: ctx.rng.fork('rain'), preset: 'rain', time: fxTime, count: Math.round(3200 * detail), opacity: 0.5 }));
    for (const p of parts) scene.add(p.object);

    // ---- the choosers
    const flock = buildChoosers(ctx, SU, path, V);
    scene.add(flock.mesh);
    await ctx.yield();

    // ---- rare event: a second mast stands up far to the right and opens gold in answer
    const MAST = new THREE.Vector3(830, 0, -1840);
    let mast = null;
    if (V.rare) {
      const N = 41, mp = [], mi = [];
      for (let i = 0; i < N; i++) {
        const b = mp.length / 3;
        mp.push(i, 9, 0, i, 122, 0, i + 0.5, 9, 0, i + 0.5, 110, 0);
        if (i < N - 1) mi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4, b + 3, b + 5, b + 4);
      }
      const apex = mp.length / 3; mp.push(0, 34, 2);
      for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; mp.push(Math.cos(a) * 62, -2, Math.sin(a) * 78 - 30, 2); mp.splice(mp.length - 1, 1); }
      for (let k = 0; k < 16; k++) mi.push(apex, apex + 2 + k, apex + 1 + k);
      const kinds = new Float32Array(mp.length / 3); for (let i = apex; i < kinds.length; i++) kinds[i] = 1;
      const mg = new THREE.BufferGeometry();
      mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mg.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1)); mg.setIndex(mi);
      const mm = new THREE.ShaderMaterial({
        uniforms: Object.assign({}, SU, { uOpen: { value: 0 }, uRise: { value: 0 } }), side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute float aKind; uniform float uOpen, uRise, uTime; varying vec3 vW; varying vec3 vF;
          void main(){
            vec3 p = position;
            if (aKind < 0.5) {
              float s = position.x/40.*2. - 1.;
              float e = clamp(uOpen*1.6 - 0.6*(1. - abs(s)), 0., 1.); e = e*e*(3. - 2.*e);
              float a = s*1.47*mix(0.02, 1., e) + 0.01*sin(uTime*0.7 + position.x)*e;
              float fr = fract(position.x);
              p = vec3(sin(a)*position.y, (30. + cos(a)*position.y)*uRise, -4.*step(0.25, fr)*e + s*3.*(1. - e));
              vF = vec3(position.x, position.y/120., 0.);
            } else { p.y *= uRise; vF = vec3(0., 0., 1.); }
            vW = (modelMatrix*vec4(p, 1.)).xyz;
            gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.);
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vW; varying vec3 vF;
          float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
          ${LIGHT_GLSL}
          void main(){
            vec3 col;
            if (vF.z > 0.5) col = mix(uSlate, uRoot, 0.4)*1.5*(uSunCol*0.25 + uSkyCol);
            else {
              float fr = fract(vF.x), facet = smoothstep(0.42, 0.58, fr);
              float ring = 0.5 + 0.5*sin(vF.y*70.);
              vec3 alb = mix(uGold*0.75, uGold*0.3, 1. - smoothstep(0.08, 0.3, vF.y))*(0.85 + 0.2*ring);
              col = alb*(uSunCol*mix(0.95, 0.2, facet) + uSkyCol*0.9);
              col = mix(col, uSlate*0.6, 1. - smoothstep(0.02, 0.06, min(fr, 1. - fr)));
            }
            gl_FragColor = vec4(applyHaze(col, vW), 1.);
          }`,
      });
      mast = new THREE.Mesh(mg, mm); mast.position.copy(MAST); mast.position.y = groundH(MAST.x, MAST.z); mast.frustumCulled = false; scene.add(mast);
    }

    // ---- per-frame state
    const fwd = new THREE.Vector3(), camP = new THREE.Vector3(), tmp = new THREE.Vector3(), crs = new THREE.Vector3();
    const eye0 = new THREE.Vector2(), head0 = new THREE.Vector2(0, 1); let eyeInit = false;
    const E = SU.uEye.value;
    const hubW = new THREE.Vector3(HERO_X, 30, HERO_Z);
    const eyeScale = V.pattern === 2 ? [1.75, 0, 0] : V.pattern === 1 ? [0.72, 0.72, 0.9] : [1, 1, 1];

    const update = (dt, time, camera, u) => {
      const uu = clamp(u || 0, 0, 1);
      SU.uTime.value = time; SU.uU.value = uu; fxTime.value = time;
      path.pointAt(uu, tmp); SU.uCamS.value = -tmp.z;
      // read the camera's world matrix directly: a portal camera may be driven by its matrix alone
      const me = camera.matrixWorld.elements;
      camP.set(me[12], me[13], me[14]); fwd.set(-me[8], -me[9], -me[10]);
      fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
      // lattice centres ride ahead of the lens, farther when we are high
      SU.uCentreA.value.copy(camP).addScaledVector(fwd, 36 + camP.y * 0.95);
      SU.uCentreB.value.copy(camP).addScaledVector(fwd, 240 + camP.y * 1.2);
      SU.uCentreC.value.copy(camP).addScaledVector(fwd, 640 + camP.y);
      // eye 0 keeps station ahead of the flock on a smoothed heading; the others glide across (rigid: only centres move)
      // (the route's heading, not the gaze: when the lens looks aside the eye stays on the course and slides off-centre)
      // (an ease carried from call to call by the clock's own step, with no stand-in for a step of 0: while the clock stands nothing eases)
      const k = dt > 0 ? 1 - Math.exp(-Math.min(dt, 0.1) * 0.9) : 0;
      path.tangentAt(uu, crs); crs.y = 0; if (crs.lengthSq() < 1e-6) crs.set(0, 0, -1); crs.normalize();
      if (k > 0) { head0.x += (crs.x - head0.x) * k; head0.y += (-crs.z - head0.y) * k; }
      let hl = Math.hypot(head0.x, head0.y) || 1, hx = head0.x / hl, hy = head0.y / hl;
      const ahead = V.pattern === 2 ? 620 : 380;
      // the first call, and a jump of place (the station over 140 from the eye), put the eye ON the course's own station: the heading
      // is taken again from the course before the station is, so nothing is left over to ease and two draws of one frame are equal
      if (!eyeInit || Math.hypot(camP.x + hx * ahead - eye0.x, -camP.z + hy * ahead - eye0.y) > 140) { head0.set(crs.x, -crs.z); hl = Math.hypot(head0.x, head0.y) || 1; hx = head0.x / hl; hy = head0.y / hl; eye0.set(camP.x + hx * ahead, -camP.z + hy * ahead); }
      else if (k > 0) { eye0.x += (camP.x + hx * ahead - eye0.x) * k; eye0.y += (-camP.z + hy * ahead - eye0.y) * k; }
      eyeInit = true;
      E[0].set(eye0.x, eye0.y, Math.atan2(-hx, hy), eyeScale[0]);
      const run = (0.45 - uu) * 1012, wob = 30 * Math.sin(time * 0.1);
      let e1x = 60 + run + wob, e1y = 1150, e2x = 60 - run * 1.25 - wob, e2y = 1950;
      if (V.pattern === 1) { e1x = eye0.x + hy * 420; e1y = eye0.y - hx * 420; }
      if (V.rare) {                                    // both eyes on the plain drift toward the answering mast
        const dr = smoothstep(0.5, 0.95, uu);
        e1x = lerp(e1x, MAST.x - 260, dr); e1y = lerp(e1y, -MAST.z - 420, dr);
        e2x = lerp(e2x, MAST.x + 120, dr); e2y = lerp(e2y, -MAST.z + 380, dr);
      }
      E[1].set(e1x, e1y, V.pattern === 1 ? E[0].z : -Math.PI / 2, eyeScale[1]);
      E[2].set(e2x, e2y, Math.PI / 2, eyeScale[2]);
      if (V.pattern === 2) { E[1].set(9e5, 9e5, 0, 0.001); E[2].set(9e5, -9e5, 0, 0.001); }
      hero.setProgress(uu);
      hero.update(dt, time, camera);
      // the elders turn to keep facing the flock (a point a little ahead of the lens on the route); a gold stripe
      // crosses each in turn as we come up to it, pleat by pleat like the Great Fan's
      path.posAtDist(uu * path.length + 26, tmp);
      for (let i = 0; i < NE; i++) {
        const e = elders[i], o = e.object;
        const yaw = Math.atan2(tmp.x - o.position.x, tmp.z - o.position.z);
        o.rotation.y = yaw; SU.uEld.value[i].w = yaw;
        const ph = (uu - ELDERS[i][3]) / 0.075 + 0.04 * Math.sin(time * 0.6 + i * 2.1);
        e.setStripe(ph > -1.3 && ph < 1.3 ? ph * 215 : -1e4, 150);
      }
      if (mast) { mast.material.uniforms.uRise.value = smoothstep(0.46, 0.52, uu); mast.material.uniforms.uOpen.value = smoothstep(0.51, 0.66, uu); }
      flock.update(time, uu, uu * path.length, me);
      sky.update(dt, time, camera);
      for (const p of parts) if (p.update) p.update(dt, time, camera);
    };
    const cam0 = new THREE.PerspectiveCamera(62, 1.78, 0.3, 7000);
    cam0.position.copy(path.start); cam0.lookAt(path.start.clone().add(path.startTangent)); cam0.updateMatrixWorld(true);
    update(0, 0, cam0, 0);
    eyeInit = false;
    await sky.prewarm(ctx.renderer, null, scene);

    const poiV = new THREE.Vector3();
    const pois = [
      { at: new THREE.Vector3(40, 22, -480), from: 0.03, to: 0.2, weight: 0.5, fade: 0.25 },                 // the gate of the first two elders
      { at: new THREE.Vector3(ELDERS[1][0], 14, ELDERS[1][1]), from: 0.26, to: 0.4, weight: 0.35, fade: 0.35 },
      { at: (time, u) => path.pointAt(Math.min(u + lerp(0.1, 0.27, smoothstep(0.2, 0.4, u)), 0.98), poiV).setY(0), from: 0.2, to: 0.6, weight: 0.7, fade: 0.2 },
      { at: new THREE.Vector3(380, 0, -900), from: 0.44, to: 0.62, weight: 0.45, fade: 0.45 },               // a glance out over the stripes on the right, past the fourth elder
      { at: hubW.clone().setY(58), from: 0.56, to: 0.86, weight: 0.5 },
      { at: hubW.clone(), from: 0.84, to: 0.99, weight: 0.8, fade: 0.2 },                                     // the collar, held steady to the end
    ];
    if (V.rare) pois.push({ at: MAST.clone().setY(70), from: 0.5, to: 0.64, weight: 0.3 });

    const names = { dawn: 'The Plain of Fans', noon: 'The Plain of Fans, Pearl Noon', evening: 'The Plain of Fans at Evening', night: 'The Plain of Fans by Moonlight' };
    return {
      scene, path, duration: 46, title: names[V.hour],
      camera: { fov: 62, near: 0.3, far: 7000, lookAhead: 26, sway: 0.7, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FBFBF5', glow: 1, revealDistance: 300 },
      post: {
        exposure: H.exposure,
        bloom: { strength: V.hour === 'night' ? 0.18 : 0.24, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.08, contrast: 1.08, tint: H.tint, shadowTint: H.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      ride: 'none',
      update,
      dispose() { if (sky.dispose) sky.dispose(); },
    };
  },
};
