// KNEE-DEEP UNDER THE WAVE, part SEA (film worlds D): everything at the calm sea's level, in front of the wave,
// under it and behind it, to the horizon: the mirror, the hole's path of glitter, half a metre of clear water over
// pale rippled sand with its bars and channels and its net of light, the drawing-off in front of the wave's foot,
// the churn at the foot's edge and the lanes of foam behind the back.
//   buildSea(ctx, { path, light }) -> { object, uniforms, update(time, s, camera), dispose() }
//   SEA_WATER_GLSL                  the water's colour rule as GLSL (seaMirror, seaWater, the sand's two colours):
//                                   for the wave's back, so that it can be brought into tune with the sea
// ONE flat mesh at y = 0, fixed in the world (finer along the route only so that the world place handed to the
// shader is exact there); all the work is in its fragment shader. Everything scripted comes from the law through
// xi = z - uKdCrestZ (the light's uniform, set by metres flown); the clock moves only what loops (ripples, glitter,
// the net of light, the streaming's drift, the foam's drift). The eye is read for the mirror's and the sheen's
// direction of view, the pixel's footprint (every pattern fades to its mean before it is finer than a pixel) and
// the air by distance (kdHaze). What a seed deals: where the patterns lie (uSeaSeed: the sand's forms and ripples,
// the cat's paws, the foam's lines), nothing else: one look. The surface is opaque, writes depth at exactly y = 0
// and is drawn early (renderOrder -5): whatever another part lays ON the water wants a few centimetres of height.
// In front of the wave the wet flat mirrors the wave itself (its face by the height the mirrored ray meets it, its
// burning crest as a torn band of light) and the drawn-off water runs braided round banks of sand. Seen from high
// the same hand is kept by levels of detail that follow the pixel's footprint: the sand's ridges and the net of
// light exist at three sizes, the path of light is a field of sharp glints, and the hole's mirror image is thrown
// apart into dashes where the pixel cannot show the ripples. The hole's growth is read from the light (uKdGrow).
// EVERY NUMBER OF THE LAW is written into the shader from the law's own names when the part is built (its seaDepth
// and seaStream, the wave's face, height, back, apron, the sea's depth, the hole's angles): none is typed here.
import * as THREE from 'three';
import { GLSL_HASH, GLSL_VALUE_NOISE } from '../kit/fx.js';
import { SEA, WAVE, HOLE } from './knee-deep-under-the-wave-law.js';

const f = (v) => { const s = String(v); return /[.e]/.test(s) ? s : s + '.'; };       // a number as a GLSL float
const rad = (deg) => deg * Math.PI / 180;

const VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

// the law's numbers, for the shader
const LAW = /* glsl */`
const float SEA_DEPTH = ${f(SEA.depth)}, SEA_THIN = ${f(SEA.thin)};
const float W_FACE = ${f(WAVE.face)}, W_BACK = ${f(WAVE.back)}, W_APRON = ${f(WAVE.apron)}, W_DRAW = ${f(WAVE.draw)}, W_STREAM = ${f(WAVE.stream)}, W_HEIGHT = ${f(WAVE.height)};
uniform float uSeaTime; uniform vec4 uSeaSeed;
float sstep(float t) { t = clamp(t, 0., 1.); return t * t * (3. - 2. * t); }
// THE LAW'S seaDepth(xi) and seaStream(xi), written out here from the law's own names (SEA.depth, SEA.thin,
// WAVE.face, WAVE.draw, WAVE.stream; sstep is the law's smooth step): no number of them is typed in this file
float seaDrawn(float xi) { return sstep((xi - W_FACE) / W_DRAW); }                         // 0 at the foot, 1 where the drawing-off ends
float seaDepthOf(float drawn) { return SEA_DEPTH * (SEA_THIN + (1. - SEA_THIN) * drawn); }  // the law's seaDepth, by that share
float seaStreamAt(float xi) { return 1. - sstep((xi - W_FACE) / W_STREAM); }               // the law's seaStream
// the hole's size, from the law's angles (no measure of the hole is typed here, only my shares of them): its half
// size as a direction (of the band's reach, of the arch's top), and the widths of its light told as slopes of the
// water that mirror it (of the band's reach east-west, of the ring along the view); all grown by the light's uKdGrow
const vec2 SEA_HOLE_HALF = vec2(${f(0.8 * Math.sin(rad(HOLE.band)))}, ${f(0.857 * Math.sin(rad(HOLE.archTop)))});
const float SEA_HOLE_EX = ${f(0.2344 * rad(HOLE.band))}, SEA_HOLE_EZ = ${f(0.3526 * rad(HOLE.ring))};
`;

// THE WATER'S COLOUR RULE, kept in one place so that the wave's back can be brought into tune with it (copy the
// two functions, or their numbers). Linear colour.
//   seaMirror(c)             how much of the sky the surface mirrors when the view makes the cosine c with the
//                            surface's normal: 2 parts in 100 looking straight down, 14 in 100 at 20 degrees over
//                            the surface, 64 in 100 at 5 degrees (the usual short rule for water)
//   seaWater(bed, way, lit)  what is seen of a lit bottom of colour bed through way metres of this water: the red
//                            goes first (aquamarine over pale sand at knee depth, teal at two metres, pale gold-
//                            green over a bar a hand deep) and the water's own blue-green comes up in its place;
//                            lit is the share of the hole's direct light there (kdLit)
//   SEA_SAND_PALE, SEA_SAND_DARK   the sand's two colours (its crests and bars; its troughs), before the light
export const SEA_WATER_GLSL = /* glsl */`
const vec3 SEA_SAND_PALE = vec3(0.86, 0.80, 0.66), SEA_SAND_DARK = vec3(0.50, 0.44, 0.33);
float seaMirror(float c) { return 0.02 + 0.98 * pow(1. - clamp(c, 0., 1.), 5.); }
vec3 seaWater(vec3 bed, float way, float lit) {
  vec3 through = exp(-max(way, 0.) * vec3(2.2, 0.36, 0.30));
  return bed * through + (1. - through) * vec3(0.010, 0.085, 0.105) * (0.55 + 0.75 * lit);
}
`;
const FRAG_HEAD = /* glsl */`
//<LIGHT>
${GLSL_HASH}${GLSL_VALUE_NOISE}
${LAW}
${SEA_WATER_GLSL}
varying vec3 vW;
`;
// a layer's map from metres to its cells: turned by deg, cells cx metres long (along its crests) and cz across
const M2 = (deg, cx, cz) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return `mat2(${f((c / cx).toFixed(5))}, ${f((-s / cz).toFixed(5))}, ${f((s / cx).toFixed(5))}, ${f((c / cz).toFixed(5))})`; };
// THE SURFACE: almost glass. A long low swell, two fine ripples, and cat's paws (patches of a rougher, shorter
// ripple). Each layer fades to nothing before its cells are finer than the pixel's footprint fp (metres), and what
// has faded is handed on as sig2, the variance of the slopes the pixel can no longer show (the path of light's width).
const FRAG_SURF = /* glsl */`
// value noise with its gradient: x the value 0..1, yz its slope per cell
vec3 seaN(vec2 q) {
  vec2 i = floor(q), w = fract(q); vec2 u = w * w * (3. - 2. * w), du = 6. * w * (1. - w);
  i = mod(i, 2048.);
  float a = hash12(i), b = hash12(i + vec2(1., 0.)), c = hash12(i + vec2(0., 1.)), e = hash12(i + vec2(1., 1.)), k = a - b - c + e;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}
const mat2 SM0 = ${M2(8, 130, 27)}, SM1 = ${M2(-24, 2.3, 0.85)}, SM2 = ${M2(31, 0.95, 0.34)}, SM3 = ${M2(6, 0.75, 0.24)};
// the water's slope (dh/dx, dh/dz) at p as far as the pixel can show it; rough: how strongly the cat's paws stand here
vec2 seaSlope(vec2 p, float fp, float rough, out float sig2) {
  float T = uSeaTime;
  float f0 = 1. - smoothstep(0.35, 1., fp / 27.), f1 = 1. - smoothstep(0.35, 1., fp / 0.85);
  float f2 = 1. - smoothstep(0.35, 1., fp / 0.34), f3 = 1. - smoothstep(0.35, 1., fp / 0.24);
  vec2 sl = 0.012 * 27. * f0 * (seaN(SM0 * p + vec2(0.02, 0.05) * T + uSeaSeed.xy).yz * SM0);
  sl += 0.024 * 0.85 * f1 * (seaN(SM1 * p + vec2(0.10, 0.33) * T + uSeaSeed.zw).yz * SM1);
  sl += 0.030 * 0.34 * f2 * (seaN(SM2 * p + vec2(-0.22, 0.62) * T + uSeaSeed.yx).yz * SM2);
  sl += 0.30 * rough * 0.24 * f3 * (seaN(SM3 * p + vec2(0.3, 1.2) * T + uSeaSeed.wz).yz * SM3);
  sig2 = 0.2 * (0.0006 * (1. - f1 * f1) + 0.0009 * (1. - f2 * f2) + 0.09 * rough * rough * (1. - f3 * f3)) + 0.00004;
  return sl;
}
`;
// THE BED: pale sand in large forms (long bars that rise almost to the surface, channels that lie deeper and show
// tealer), fine wavy ripples on it, and the wandering net of light the ripples of the surface throw on it.
const FRAG_BED = /* glsl */`
// the large forms, 0..1 (low: a channel; high: a bar): long shapes lying east-west, 40 to 400 m across
float seaBars(vec2 p, float fp) {
  vec2 q = p + uSeaSeed.xy * 37.;
  float b = 0.56 * mix(0.5, vnoise(q * vec2(0.0034, 0.0083)), 1. - smoothstep(40., 160., fp))
    + 0.30 * mix(0.5, vnoise(vec2(q.x * 0.0095 + q.y * 0.0040, q.y * 0.021 - q.x * 0.0030) + 5.3), 1. - smoothstep(16., 64., fp));
  float fine = vnoise(vec2(q.x * 0.026 - q.y * 0.011, q.y * 0.058 + q.x * 0.008) + 11.7);
  return b + 0.14 * mix(0.5, fine, 1. - smoothstep(6., 24., fp));
}
// the tidal channels, 0..1 (1 on a channel's floor): winding runs of deeper water some 25 to 60 m wide and many
// hundreds of metres long, that fork and meet (the lines on which a slow noise crosses its middle, bent by a
// second one); wider where the bed lies low (big: the large forms). Far off, finer than the pixel: their mean.
float seaChannels(vec2 p, float big, float fp) {
  vec2 q = p + uSeaSeed.zw * 53.;
  q += 90. * (vnoise(q * 0.0042 + 3.1) - 0.5) * vec2(0.8, 0.6);
  float line = 1. - abs(2. * vnoise(q * vec2(0.0019, 0.0031)) - 1.), wide = 0.07 + 0.12 * (1. - big);
  return mix(0.16, smoothstep(1. - wide, 1. - wide + max(0.18 * wide, 0.012 * fp), line), 1. - smoothstep(12., 60., fp));
}
// the fine ripples of the sand at the bed's point q: x their height 0..1 (crests sharp), y their slope toward the north
vec2 seaSandRipple(vec2 q, float fp) {
  // two fields of ripples, a finer and a coarser, lying a little askew of each other, take turns in patches
  float w1 = vnoise(q * 0.17 + uSeaSeed.zw), w2 = vnoise(q * vec2(0.9, 0.5) + 3.1 + uSeaSeed.wz);
  float pa = 6.2832 * (q.y / 0.62 + 0.11 * q.x + 0.9 * w1 + 0.3 * w2), pc = 6.2832 * (q.y / 1.15 - 0.09 * q.x + 1.4 * w1 - 0.25 * w2);
  float ka = 1. - smoothstep(0.3, 0.8, fp / 0.39), kc = 1. - smoothstep(0.3, 0.8, fp / 0.72), m = smoothstep(0.38, 0.62, w1);
  float h = mix(mix(0.5, 0.5 + 0.5 * sin(pa), ka), mix(0.5, 0.5 + 0.5 * sin(pc), kc), m);
  return vec2(h * h * (3. - 2. * h), mix(cos(pa) * ka, cos(pc) * kc, m));
}
// the net of light: two nets of thin bright lines crossing, wandering with the clock; mean 1; gone to its mean far off
float seaNet(vec2 q, float fp) {
  float T = uSeaTime;
  // the nets lie turned against each other and against the compass, and each is bent by a slow wander of its own
  vec2 w = q + 0.22 * vec2(sin(q.y * 1.3 + 0.7 * T + 2. * sin(q.x * 0.7)), sin(q.x * 1.1 - 0.6 * T + 2. * sin(q.y * 0.9)));
  vec2 qa = vec2(w.x * 0.87 + w.y * 0.5, w.y * 0.87 - w.x * 0.5) * 2.7, qb = vec2(w.x * 0.34 - w.y * 0.94, w.y * 0.34 + w.x * 0.94) * 4.3;
  float a = vnoise(vec3(qa + vec2(0.11, -0.07) * T, T * 0.33)), b = vnoise(vec3(qb + 7.7 - vec2(0.05, 0.13) * T, T * 0.41 + 3.));
  float la = 1. - abs(2. * a - 1.), lb = 1. - abs(2. * b - 1.);
  float net = 2.3 * smoothstep(0.84, 1., la) + 1.3 * smoothstep(0.86, 1., lb) + 0.7 * la * la * lb;
  return mix(1., 0.42 + net, 1. - smoothstep(0.1, 0.4, fp));
}
`;
// IN FRONT OF THE WAVE the water runs north toward it: short wandering streaks in the mirror, threads of foam near the foot, and on the last
// metres before the foot churned white water with holes in it. The clock carries the pattern north at the law's
// seaStream times 13 m a second; two phases of one pattern relieve each other, so it never winds up.
const FRAG_RUN = /* glsl */`
// run: the law's seaStream here; apron: the churn's share here. Returns xy the slope the streaks add, z foam 0..1
vec3 seaRun(vec2 p, vec2 fw, float run, float apron) {
  float ph = uSeaTime * 0.22, a1 = fract(ph), a2 = fract(ph + 0.5), w1 = 1. - abs(2. * a1 - 1.);
  float reach = 59. * run;
  // nothing here is ruled: the run follows the braided bed, swinging tens of metres east and west on its way (a bend
  // that stays in its place), and its streaks are short and broken
  float bend = 26. * vnoise(p * vec2(0.013, 0.021) + uSeaSeed.yw) + 7. * vnoise(p * vec2(0.06, 0.045) + uSeaSeed.xz);
  vec2 q1 = vec2(p.x + bend, p.y + reach * (a1 - 0.5)), q2 = vec2(p.x + bend + 31.7, p.y + reach * (a2 - 0.5));
  // every pattern here is long north-south and fades by the pixel's footprint counted in its own cells (seen
  // along their length the streaks hold far out; seen across it they go to their mean early)
  const vec2 K = vec2(1.4, 0.2), KA = vec2(0.6, 0.07), KB = vec2(2.1, 0.3), KC = vec2(6.5, 1.1);
  float fs = 1. - smoothstep(0.35, 1., max(fw.x * K.x, fw.y * K.y)), fa = 1. - smoothstep(0.35, 1., max(fw.x * KA.x, fw.y * KA.y));
  float fb = 1. - smoothstep(0.35, 1., max(fw.x * KB.x, fw.y * KB.y)), fc = 1. - smoothstep(0.35, 1., max(fw.x * KC.x, fw.y * KC.y));
  vec2 g = mix(seaN(q2 * K).yz, seaN(q1 * K).yz, w1) * K * (0.085 * run * fs);
  float c1 = 0.62 * vnoise(q1 * KA) + 0.38 * mix(0.5, vnoise(q1 * KB + 3.3), fb);
  float c2 = 0.62 * vnoise(q2 * KA) + 0.38 * mix(0.5, vnoise(q2 * KB + 3.3), fb);
  float c = mix(0.5, mix(c2, c1, w1), fa);
  float fine = mix(0.5, mix(vnoise(q2 * KC), vnoise(q1 * KC), w1), fc);
  // lines of foam that thicken toward the foot, and the churn on the apron (foam with holes in it)
  // (the lines: short wandering threads in patches, none far out where the run is slow, each a pixel wide at least)
  const vec2 KL = vec2(0.8, 0.07);
  float n1 = vnoise(q1 * KL + 9.1), n2 = vnoise(q2 * KL + 9.1);
  float ln = mix(1. - abs(2. * n2 - 1.), 1. - abs(2. * n1 - 1.), w1), lw = 2.4 * fw.x + 0.03;
  float th = mix(1.0, 0.80, run * run);
  float streak = (0.3 + 0.55 * run) * smoothstep(0.78, 0.95, run) * smoothstep(th - lw, th + lw, ln + 0.1 * (c - 0.5)) * min(1., 0.2 / lw) * smoothstep(0.42, 0.6, c);
  float churn = smoothstep(1.14 - 0.86 * apron, 1.36 - 0.86 * apron, c + 0.3 * fine + 0.1);
  return vec3(g, max(streak, churn));
}
`;
// SPARKLE: here and there the flank of a wavelet throws the hole's light at the eye for a moment. Cells a third of
// a metre across hold one small facet each, its tilt swinging slowly on the clock (so a glint swells and dies; none
// flashes); a facet shines when its tilt mirrors the hole. Far off, where a cell is finer than the pixel, the true
// mean of the same facets takes over: the long path from the horizon to the eye. Returns the pixel's shining share.
const FRAG_SPARK = /* glsl */`
float seaSparkle(vec2 p, vec2 need, float ex2, float ez2, float fp) {
  vec2 c = p * 3., i = mod(floor(c), 1024.), w = fract(c) - 0.5;
  vec2 h = hash22(i); float h3 = hash12(i + 71.3), T = uSeaTime;
  vec2 s = 0.17 * vec2(sin(T * (1.3 + 1.6 * h.x) + 6.2832 * h.y), sin(T * (1.1 + 1.9 * h.y) + 6.2832 * h3));
  vec2 dn = need - s, off = (w + 0.56 * (h - 0.5)) * vec2(0.55 + 0.5 * h3, 1.25);
  float near = (1. - smoothstep(0.05, 0.19, sqrt(dot(off, off)))) * exp(-0.5 * (dn.x * dn.x / ex2 + dn.y * dn.y / ez2));
  float vx = 0.0145 + ex2, vz = 0.0145 + ez2;
  float far = 0.04 * sqrt(ex2 * ez2 / (vx * vz)) * exp(-0.5 * (need.x * need.x / vx + need.y * need.y / vz));
  return mix(far, near, 1. - smoothstep(0.3, 0.9, fp * 3.));
}
`;
// LIFE SEEN FROM HIGH (all by the clock): the wind's cat's-paws, ruffled patches 40 to 300 m across that drift at
// about 15 m a second and slowly change shape; a long low swell, lines 260 and 170 m apart that run south after
// the wave; and for the path of light sharp glints (points and short dashes) at the size the pixel can show.
const FRAG_WIND = /* glsl */`
// x: how ruffled the water is here, 0..1; y: the swell's slope (dh/dz). Far off, finer than the pixel: the mean.
vec2 seaWind(vec2 p, float fp) {
  float T = uSeaTime;
  vec2 q = p - vec2(8.5, 12.) * T + uSeaSeed.xy * 91.;
  // three sizes of patch (about 240, 80 and 26 m), each kept as far out as the pixel can still show it
  float a = mix(0.5, vnoise(vec3(q * vec2(0.0042, 0.0062), T * 0.05)), 1. - smoothstep(60., 220., fp));
  float b = mix(0.5, vnoise(vec3(q * vec2(0.013, 0.019) + 31.7, T * 0.12)), 1. - smoothstep(20., 75., fp));
  float c = mix(0.5, vnoise(vec3(q * vec2(0.038, 0.055) + 67.1, T * 0.25)), 1. - smoothstep(7., 25., fp));
  float n = 0.5 * a + 0.26 * b + 0.24 * c, eg = max(0.012, 0.03 * fp);
  float g = 0.4 * smoothstep(0.44, 0.64, n) + 0.6 * smoothstep(0.53 - eg, 0.53 + eg, n);     // a soft swell of ruffle with a crisp, ragged front
  float w = 2.2 * vnoise(p * vec2(0.0011, 0.0006) + uSeaSeed.zw);
  float sw = 0.6 * cos(6.2832 * ((p.y - 12. * T) / 260. + w)) + 0.4 * cos(6.2832 * ((p.y - 10. * T) / 170. - 0.7 * w + 0.3));
  return vec2(g, 0.012 * sw * (1. - smoothstep(40., 120., fp)));
}
// SHARP GLINTS at any height and any angle of view: a field of points and short strokes. Its cells are some six
// pixels across each way (their size east-west and north-south follows the pixel's footprint each way by whole
// doublings, neighbouring sizes cross-fading: a level of detail, so a glint is never finer than the pixel can show,
// never a blob, and far out on flat water still a dash); in each cell one small bright dash lying east-west, with a
// slow beat of its own on the clock. share: how many of the cells shine just now, 0..1. Returns the pixel's cover
// by shining dashes (about 0.11 * share on the mean, which is what it gives at the horizon).
float seaGlintLevel(vec2 p, vec2 l, float share) {
  vec2 c = p * exp2(-l) + 9.7 * l; c.x += 0.5 * mod(floor(c.y), 2.);
  vec2 i = mod(floor(c), 512.), w = fract(c) - 0.5;
  vec2 h = hash22(i + 3.3 * l); float h3 = hash12(i + 41.7 + l.yx);
  vec2 o = (w - 0.5 * (h - 0.5)) / (vec2(0.32, 0.21) * (0.7 + 0.5 * h3));
  float beat = 0.5 + 0.5 * sin(uSeaTime * (1.4 + 2.2 * h3) + 6.2832 * h.x);
  return (1. - smoothstep(0.5, 1., dot(o, o))) * smoothstep(1. - share, 1.08 - share, beat * (0.55 + 0.45 * h.y));
}
float seaGlints(vec2 p, vec2 fw, float share) {
  vec2 L = log2(max(vec2(6., 5.) * fw, vec2(1e-3))), l0 = floor(L), k = L - l0;
  float g = mix(mix(seaGlintLevel(p, l0, share), seaGlintLevel(p, l0 + vec2(1., 0.), share), k.x),
    mix(seaGlintLevel(p, l0 + vec2(0., 1.), share), seaGlintLevel(p, l0 + 1., share), k.x), k.y);
  return mix(0.11 * share, g, 1. - smoothstep(150., 600., fw.y));
}
`;
// THE BREAKING of a mirror image where the pixel cannot show the ripples that break it: about -1..1, a field whose cells
// are some six pixels east-west and two north-south (a level of detail by the pixel's footprint, as the
// glints'), drifting slowly on the clock
const FRAG_BREAK = /* glsl */`
float seaBreakLevel(vec2 p, vec2 l) { return vnoise(p * exp2(-l) + 17.3 * l + 0.3 * uSeaTime); }
float seaBreak(vec2 p, vec2 fw) {
  vec2 L = max(log2(max(vec2(6., 2.2) * fw, vec2(1e-3))), vec2(-3.)), l0 = floor(L), k = L - l0;
  // (steep: most patches stand well off the middle, so a thin line of the image is thrown apart, not bent)
  return clamp(7. * (mix(mix(seaBreakLevel(p, l0), seaBreakLevel(p, l0 + vec2(1., 0.)), k.x),
    mix(seaBreakLevel(p, l0 + vec2(0., 1.)), seaBreakLevel(p, l0 + 1.), k.x), k.y) - 0.5), -1.5, 1.5);
}
`;

const FRAG_MAIN = /* glsl */`
void main() {
  vec3 p = vec3(vW.x, 0., vW.z);
  vec3 toP = p - cameraPosition; float dist = max(length(toP), 1e-3); vec3 d = toP / dist;
  float xi = p.z - uKdCrestZ;
  vec2 fw2 = fwidth(p.xz); float fp = max(max(fw2.x, fw2.y), 1e-4);
  // cat's paws: patches of ruffled water some tens of metres across, drifting; far off their mean
  float paw = smoothstep(0.50, 0.80, vnoise(p.xz * vec2(0.011, 0.028) + uSeaSeed.xz + vec2(0.004, 0.011) * uSeaTime));
  paw = mix(0.39, paw, 1. - smoothstep(0.25, 1.5, fp));
  vec2 wind = seaWind(p.xz, fp);
  // THE WATER'S DEPTH here: the law's seaDepth in front of the foot (knee-deep again behind the back) less the
  // bed's large forms; where the sea is drawn off, long ridges of sand that point at the wave come out of it bare
  float calm = max(seaDrawn(xi), step(xi, 0.));
  float run = seaStreamAt(xi) * step(0., xi);
  float big = seaBars(p.xz, fp);
  float ridge = 0.5;
  if (calm < 0.999) {
    // (BRAIDED: lens-shaped banks of two sizes, some 12 by 60 m and 3 by 16 m, on a bed that swings east and west
    // by tens of metres: the running water wanders round them, parts and joins; nothing ruled, no even spacing)
    vec2 wq = p.xz + vec2(26. * vnoise(p.xz * vec2(0.013, 0.021) + uSeaSeed.yw) + 7. * vnoise(p.xz * vec2(0.06, 0.045) + uSeaSeed.xz), 0.);
    float rA = mix(0.5, vnoise(wq * vec2(0.085, 0.017) + uSeaSeed.yw), 1. - smoothstep(0.35, 1., max(fw2.x * 0.085, fw2.y * 0.017)));
    float rB = mix(0.5, vnoise(wq * vec2(0.31, 0.062) + uSeaSeed.zx), 1. - smoothstep(0.35, 1., max(fw2.x * 0.31, fw2.y * 0.062)));
    ridge = clamp(0.5 + 0.8 * (rA - 0.5) + 0.5 * (rB - 0.5), 0., 1.);
  }
  // (bars rise to a hand under the surface; the low grounds lie half a metre deeper, the channels a metre and more)
  float chan = seaChannels(p.xz, big, fp);
  // (a bar and a low ground each have a CRISP edge, a pixel and a half wide at least, on a soft rise: shapes with
  // outlines, as banks of sand are from the air, never soft clouds)
  float eb = max(0.008, 0.022 * fp);
  float bar = 0.4 * smoothstep(0.50, 0.80, big) + 0.6 * smoothstep(0.60 - eb, 0.60 + eb, big);
  float low = 0.4 * (1. - smoothstep(0.14, 0.44, big)) + 0.6 * (1. - smoothstep(0.38 - eb, 0.38 + eb, big));
  float rel = 0.42 * bar - 0.55 * low * calm - 1.3 * chan + 0.62 * (ridge - 0.5) * (1. - calm);
  float depth = seaDepthOf(calm) - rel;
  float bare = 1. - smoothstep(0., 0.03, depth); depth = max(depth, 0.);
  float sig2 = 0.;
  vec2 sl = seaSlope(p.xz, fp, paw, sig2);
  // (the thin sheet of the drawing-off carries no swell and hardly a ripple)
  sl *= 0.3 + 0.7 * calm; sig2 += 0.0035 * wind.x; sl.y += wind.y * calm;
  float apron = (1. - sstep((xi - W_FACE) / (W_APRON + 2. * fp))) * W_APRON / (W_APRON + 2. * fp);
  vec3 runs = vec3(0.);
  if (run > 0.002) runs = seaRun(p.xz, fw2, run, apron);
  sl = (sl + runs.xy) * (1. - bare);
  vec3 n = normalize(vec3(-sl.x, 1., -sl.y));
  // what the pixel cannot show of the ripples still turns its facets toward the eye: at grazing angles the far sea
  // mirrors a little less of the sky (so it lies darker than the sky at the horizon)
  float cosV = clamp(dot(-d, n), 0., 1.), cosF = sqrt(cosV * cosV + 1.2 * sig2);
  float fr = seaMirror(cosF); fr += 0.05 * wind.x * (1. - fr);
  vec3 r = reflect(d, n); r.y = max(r.y, 0.004); r = normalize(r);
  // where the pixel cannot show the ripples they still break the hole's mirror image: round the hole's image each
  // small patch of water mirrors a place a little higher or lower and a little aside, by more than the patch is
  // wide, so the image falls apart into dashes and bands of light and nothing in it keeps an outline (the hole's
  // size: the law's angles in SEA_HOLE_HALF, grown by the light's uKdGrow, which is the law's growth)
  float stroke = smoothstep(0.04, 0.2, fp), grow = max(uKdGrow, 1.);
  if (stroke > 0.) {
    vec2 hq = (r.xy - KD_HOLE_DIR.xy) / (grow * SEA_HOLE_HALF);
    float amt = stroke * grow * (1. - smoothstep(1.0, 3.2, dot(hq, hq)));
    if (amt > 0.) {
      r.y = max(r.y + 0.028 * amt * seaBreak(p.xz, fw2), 0.004); r.x += 0.04 * amt * seaBreak(p.xz + 91.3, fw2);
      r = normalize(r);
    }
  }
  float open = kdOpen(p, r);
  vec3 sky = kdSky(r);
  // the mirror image of the wave's dark face, seen through the air that lies between the water and the wave
  // THE WAVE IN THE WET FLAT, as a wet beach shows a mountain: where the mirrored ray meets the wave the water shows
  // the face at the height the ray meets it (frac: 0 at the foot, 1 at the crest; the face taken as a straight
  // slope from the foot to the crest, so that the crest's image lies where the light's kdOpen lets the sky begin):
  // deep teal low, turquoise above, pale jade under the crest (the wave's own colours, as plain numbers of mine)
  float toWave = max(xi - 0.6 * W_FACE, 0.) / max(-r.z, 0.05);
  float tanE = r.y / max(-r.z, 0.05), hc = xi * tanE;
  float frac = clamp(hc * max(xi - W_FACE, 0.) / max(W_HEIGHT * xi - hc * W_FACE, 1.), 0., 2.);
  vec3 face = mix(vec3(0.002, 0.058, 0.105), vec3(0.02, 0.22, 0.26), smoothstep(0.08, 0.46, frac));
  face = mix(face, vec3(0.06, 0.30, 0.31), smoothstep(0.46, 0.66, frac));
  face = mix(face, vec3(0.30, 0.48, 0.46), smoothstep(0.66, 0.92, frac));
  // and THE BURNING CREST LINE lies in the water as a bright band toward the lens: as wide as the ripples the
  // pixel cannot show smear it (thinner in light as it widens), a little uneven along its length as the crest is
  float xc = p.x + r.x / max(-r.z, 0.05) * xi;
  float und = 0.05 * (vnoise(vec2(xc * 0.0021, 7.3) + uSeaSeed.xy) - 0.5) + 0.03 * (vnoise(vec2(xc * 0.009, 1.7) + uSeaSeed.zw) - 0.5);
  float wc = 0.035 + min(1.2 * sqrt(sig2) / max(tanE, 0.05), 0.085), qc = (frac - 1. - und) / wc;
  float crestBand = exp(-min(qc * qc, 40.)) * (0.3 + 0.7 * 0.035 / wc) * step(W_FACE, xi);
  vec3 waveImage = mix(face, kdAir(normalize(vec3(r.x, 0.03 + 0.25 * r.y, r.z))), 1. - exp(-toWave * KD_HAZE));
  // the hole is this world's sun: what of it is brighter than white (its band, ring and arches) is so bright in
  // truth that the water throws it back at any angle, as it does a sun's image; the rest follows seaMirror
  vec3 hot = max(sky - vec3(0.85), 0.) * open;
  vec3 mirror = mix(waveImage, min(sky, vec3(0.85 - 0.25 * stroke)), open);
  mirror = mirror * (0.9 - 0.42 * wind.x) + vec3(0.015, 0.022, 0.035) * wind.x;
  float lit = kdLit(p);
  // THE WATER AND THE SAND: the water's depth here (the law's seaDepth in front of the foot; knee-deep again behind
  // the back) less the bed's large forms; the bed's point by refraction; the sand lit by the hole and the sky
  vec3 dr = refract(d, n, 0.75); float way = depth / max(-dr.y, 0.3);
  vec2 pb = p.xz + dr.xz * way;
  // (where the water runs hard toward the wave it has washed the bed's ripples almost flat)
  // (the bed's fine ripples and the net of light are asked for only where the pixel can still show them)
  // THE SAME HAND AT EVERY HEIGHT: the sand's ridges and the net of light exist at three sizes (ripples under a
  // net of half a metre; ridges 4 to 7 m apart under a net of 2 to 3 m; sand waves 22 to 41 m apart under a net of
  // 10 to 16 m), and the pixel shows, sharp, the size it can show: each comes in as the finer one goes under the
  // pixel and gives way to the next (a level of detail by the pixel's footprint)
  vec2 rip = vec2(0.5, 0.); float net = 1.;
  float bedCalm = 1. - 0.85 * run * run, bedWide = bedCalm * (0.12 + 0.88 * calm), netOn = 0.75 * smoothstep(0.02, 0.25, depth);
  if (fp < 0.6) { rip = mix(rip, seaSandRipple(pb, fp), bedCalm); net = mix(1., seaNet(pb, fp), netOn); }
  if (fp > 0.1 && fp < 3.6) {
    float wB = smoothstep(0.1, 0.4, fp);
    rip += wB * bedWide * (seaSandRipple(pb / 6., fp / 6.) - vec2(0.5, 0.)); net += wB * netOn * (seaNet(pb / 6., fp / 6.) - 1.);
  }
  if (fp > 0.6 && fp < 22.) {
    float wC = smoothstep(0.6, 2.4, fp);
    rip += wC * bedWide * (seaSandRipple(pb / 36., fp / 36.) - vec2(0.5, 0.)); net += wC * netOn * (seaNet(pb / 36., fp / 36.) - 1.);
  }
  // (the sand: pale on the bars and on its ripples' crests, darker in the troughs and on the channels' floors)
  vec3 sand = mix(SEA_SAND_DARK, SEA_SAND_PALE, clamp(0.34 + 0.26 * rip.x + 0.4 * bar - 0.3 * chan, 0., 1.));
  vec3 bedLight = KD_GOLD * lit * (0.44 * net * (1. + 0.6 * rip.y)) + vec3(0.09, 0.13, 0.18) * (0.87 + 0.13 * rip.x);
  vec3 bed = seaWater(sand * bedLight, way, lit);
  // the bared sand of the drawing-off: wet and dark, paler along the tops of its ridges, with a dull sheen of the sky
  vec3 wet = sand * mix(0.5, 0.78, smoothstep(0.5, 0.8, ridge)) * (KD_GOLD * lit * 0.5 * (1. + 0.8 * rip.y) + vec3(0.15, 0.21, 0.29)
    + vec3(0.5, 0.36, 0.18) * (smoothstep(0.5, 0.85, ridge) * (1. - calm)));   // (the ridges catch the crest's light)
  bed = mix(bed, wet, bare);
  // (the wave is a lit thing as large as the sky: its image in the flat is given more than seaMirror's share, so
  // that it reads as on a wet beach; where the sky shows, that share alone)
  float frW = fr + (1. - fr) * 0.42 * (1. - open) * step(W_FACE, xi);
  vec3 col = mix(bed, mix(mirror, min(mirror, vec3(0.9)), bare), frW * mix(1., 0.6, bare));
  // THE PATH OF LIGHT, where the ripples are finer than the pixel: the true mean of what their facets throw toward
  // the eye of the hole's light: the share of the pixel's facets that mirror the hole (its size in the sky, told in
  // slopes: ex east-west, ez along the view), less the image itself, which the mirror shows. A share: never over 1.
  vec3 hv = KD_HOLE_DIR - d; float hy = max(hv.y, 0.02);
  vec2 need = -hv.xz / hy - sl;
  // (the hole's size follows the law's growth past the crest, read through the light's uniform uKdGrow)
  float ex = SEA_HOLE_EX * grow / hy, ez = SEA_HOLE_EZ * grow, ex2 = ex * ex, ez2 = ez * ez;
  float pc = ex * ez * exp(-0.5 * (need.x * need.x / (sig2 + ex2) + need.y * need.y / (sig2 + ez2))) / sqrt((sig2 + ex2) * (sig2 + ez2));
  float p0 = exp(-0.5 * (need.x * need.x / ex2 + need.y * need.y / ez2));
  // (a sun's light: a small share of facets already shows bright; the path fills toward its core)
  float glit = 1. - exp(-9. * max(pc - p0, 0.));
  // the path is drawn as SHARP GLINTS (points and short strokes) over a faint glow, and where the pixel cannot show
  // the ripples that break it the hole's bright image (ring, band, arches) is broken into such strokes too: glitter
  // on water, never a ruled white outline. The dark of the disc stays, in the mirror.
  float gl = 0., gh = 0.;
  if (glit > 0.004) gl = seaGlints(p.xz, fw2, min(1.5 * glit, 1.));
  if (hot.r + hot.g + hot.b > 0.003) gh = seaGlints(p.xz + 37., fw2, 0.55);
  col += hot * mix(fr, 1., 0.7) * mix(1., 0.3 + 8. * gh, stroke) * (1. - 0.6 * bare);
  // (the crest's band is torn into glitter: by the ripples and the rivulets themselves where the pixel shows them,
  // by the glints where it cannot)
  float gc = 0.; if (crestBand > 0.004) gc = seaGlints(p.xz + 71.3, fw2, 0.45);
  col += vec3(1.5, 1.1, 0.6) * (crestBand * mix(fr, 1., 0.6) * mix(1., 0.35 + 9. * gc, stroke) * (1. - 0.4 * bare));
  col += vec3(1.0, 0.86, 0.62) * ((0.16 * glit + 6.5 * gl) * mix(fr, 1., 0.5) * lit * (1. - bare));
  col += vec3(1.0, 0.90, 0.70) * (5. * seaSparkle(p.xz, need, ex2, ez2, fp) * lit * (1. - bare));
  // BEHIND THE WAVE: for some 600 m behind the end of its back long lines of foam lie parallel to the crest (they
  // stay where the wave left them, and thin out as it runs on). They are LANES of torn foam, 6 to 15 m wide, never
  // ruled lines: a lane that the picture would show thinner than some three pixels is left to its mean (nothing)
  float bk = -W_BACK - xi;
  // a place for a lane every 56 m, each set off north or south by its own number and bent along its length (a long
  // bend and a short one); a lane lies there only in long pieces, in fewer and shorter ones the further behind
  float lines = 0., torn = 0.5, lfw = fw2.y / 56.;
  if (bk > -30. && bk < 620.) {
    vec2 pl = p.xz - vec2(1.1, 0.9) * uSeaTime;      // (the lanes drift with the wind)
    float lu = (pl.y + 24. * vnoise(vec2(pl.x * 0.006, pl.y * 0.003) + uSeaSeed.zy) + 7. * vnoise(vec2(pl.x * 0.03, pl.y * 0.02) + uSeaSeed.wx)) / 56.;
    float lid = floor(lu), lt = abs(fract(lu) - 0.5 - 0.3 * (hash11(lid + 77.) - 0.5));
    float piece = 0.65 * vnoise(vec2(pl.x * 0.0045 + lid * 3.7, lid * 0.61) + uSeaSeed.xw) + 0.35 * hash11(lid + 311.);
    float dens = (1. - sstep((bk - 20.) / 580.)) * sstep((bk + 25.) / 40.);
    torn = 0.6 * vnoise(pl * vec2(0.05, 0.16) + uSeaSeed.xw) + 0.4 * mix(0.5, vnoise(pl * vec2(0.21, 0.55) + uSeaSeed.wy), 1. - smoothstep(1., 4., fp));
    float half13 = (0.05 + 0.08 * piece) * (0.4 + 1.2 * torn);
    lines = (1. - smoothstep(0.35 * half13, half13 + 0.5 * lfw + 1e-3, lt)) * smoothstep(1.5, 3.5, 2. * half13 / max(lfw, 1e-4))
      * smoothstep(1.06 - 0.62 * dens, 1.20 - 0.62 * dens, piece + 0.25) * smoothstep(0.38, 0.62, torn) * 0.62;
  }
  float foam = max(runs.z, lines);
  vec3 foamCol = vec3(0.83, 0.85, 0.87) * (KD_GOLD * (0.85 * lit) + vec3(0.20, 0.27, 0.36)) * (0.62 + 0.2 * torn + 0.36 * runs.z);
  col = mix(col, foamCol, 0.93 * foam);
  gl_FragColor = vec4(kdHaze(col, p), 1.);
}`;

// a flat grid from two lists of places (fine where the route runs, a few large cells to the horizon)
function seaGeometry() {
  const xs = [0], zs = [];
  for (let x = 30; x < 41000; x *= 1.9) { xs.push(x); xs.unshift(-x); }
  for (let z = 300; z >= -2700; z -= 60) zs.push(z);
  for (let e = 90; e < 41000; e *= 1.9) { zs.unshift(300 + e); zs.push(-2700 - e); }
  const pos = [], idx = [], nx = xs.length, nz = zs.length;
  for (const z of zs) for (const x of xs) pos.push(x, 0, z);
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + nx; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -1200), 90000);
  return g;
}

export async function buildSea(ctx, opts) {
  const group = new THREE.Group(); group.name = 'sea';
  const light = opts.light;
  const rng = ctx.core.makeRng(ctx.core.hashSeed('knee-deep-under-the-wave:sea:' + ctx.seed));
  const U = { ...light.uniforms, uSeaTime: { value: 0 },
    uSeaSeed: { value: new THREE.Vector4(rng() * 400, rng() * 400, rng() * 400, rng() * 400) } };
  const material = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT,
    fragmentShader: (FRAG_HEAD + FRAG_SURF + FRAG_BED + FRAG_RUN + FRAG_SPARK + FRAG_WIND + FRAG_BREAK + FRAG_MAIN).replace('//<LIGHT>', light.GLSL) });
  const geometry = seaGeometry();
  await ctx.yield();
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = -5;
  group.add(mesh);
  function update(time, s, camera) { U.uSeaTime.value = time; }
  update(0, 0, null);
  return { object: group, uniforms: U, update, dispose() { geometry.dispose(); material.dispose(); } };
}
