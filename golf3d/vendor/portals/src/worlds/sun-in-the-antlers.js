// WORLD: "The Elk Who Carries the Sun" (sun-in-the-antlers).
// A snowbound taiga at daybreak. An elk taller than the mountains, whose body is a window onto the
// night sky, walks through it carrying the sun in its antlers and trailing a shadow that is night.
//
// AXES: the brief's elk axes. Origin on the ground under the withers, +x the way it walks, +z its
// right side. The elk stays put; the taiga scrolls backward under it (ground = world + scroll,
// scroll = 1,800 m x u), so elk, sun, shadow, rail and portal never move against each other.
// Everything is unlit gouache: flat tones cut with step() and broken by dry-brush noise.
// The night shadow is real: every frame the hero's shadow meshes are drawn top-down into a mask
// (R = night, G = the rare calf's midsummer meadow) that snow, trees, cabins and herd all read.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, poseElk, ELK_VERT } from '../parts/sun-in-the-antlers.js';

const TAU = Math.PI * 2;
const CELL = 28;                       // tree lattice (m), shared by the instanced spruce and the painted dots
const MASK = { x0: -4100, z0: -500, w: 4800, d: 2800 };   // world rect the shadow mask covers

// ---------------------------------------------------------------- hours (seeded looks)
const HOURS = {
  // peach daybreak: the brief's default
  dawn: { sky: ['#F7C9A3', '#F29B4B', '#F6E3B4', '#DCE8FF', '#8FA3DC'], twilight: '#27306A',
    snowLit: '#EAF2FB', snowWarm: '#F7C9A3', shade: '#8FA3DC', spruce: '#1F3B3A', spruceLit: '#35594F', gold: '#FFD277', apricot: '#F29B4B',
    nightSnow: '#2C3A78', nightTree: '#0E1A2E', haze: '#EBC9BC', ice: '#DCE8FF', mount: '#7F93CE', exposure: 0.9, sunElev: 0.339,
    bone: '#7686CE', sunCols: ['#FFCB2E', '#F7A233', '#EC7A2A'], forest: '#16302F', cobalt: '#5F74C8' },
  // deep blue hour, ember sun, long violet shadows
  blue: { sky: ['#E9A58C', '#E5683A', '#C9A2B6', '#8E9AD2', '#4A5AA6'], twilight: '#1C2356',
    snowLit: '#C3CEF0', snowWarm: '#EBB4A0', shade: '#6A70C2', spruce: '#182F3A', spruceLit: '#2A4A52', gold: '#FFB25E', apricot: '#E5683A',
    nightSnow: '#2A3880', nightTree: '#101B36', haze: '#B79FC2', ice: '#B9C6F2', mount: '#5562AE', exposure: 0.98, sunElev: 0.27,
    bone: '#343E8C', sunCols: ['#FFB23A', '#F27A2C', '#D9521F'], forest: '#12263A', cobalt: '#4450A8' },
  // hard pale-lemon winter morning, white-gold rim
  lemon: { sky: ['#FBEFC4', '#FFE08A', '#F3F4D8', '#D3E6FA', '#86AEE2'], twilight: '#2B3A7C',
    snowLit: '#F2F5F6', snowWarm: '#FBEFC4', shade: '#86A6E0', spruce: '#1E4038', spruceLit: '#3C6652', gold: '#FFE9A6', apricot: '#F2B65A',
    nightSnow: '#2E4084', nightTree: '#0F1E36', haze: '#E6E4D2', ice: '#D6E8FF', mount: '#7C9CD8', exposure: 0.86, sunElev: 0.40,
    bone: '#5F7ECC', sunCols: ['#FFD21F', '#F9AE2E', '#EE8A26'], forest: '#17362F', cobalt: '#5A7ED0' },
};

// ---------------------------------------------------------------- shared GLSL
const COMMON = /* glsl */`
uniform float uScroll; uniform float uTime; uniform sampler2D uMask; uniform vec4 uMaskRect; uniform vec3 uSun;
uniform vec3 uHaze; uniform float uHazeK;
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec4 h24(vec2 p) { vec4 q = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099)); q += dot(q, q.wzxy + 33.33); return fract((q.xxyz + q.yzzw) * q.zywx); }
float vn2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y);
}
// dry-brush: streaky value noise, stretched 5:1
float brush2(vec2 p) { return vn2(p * vec2(1., 5.)) * .6 + vn2(p * vec2(2.3, 13.) + 7.) * .4; }
float riverZ(float gx) { return 690. + 22. * sin(gx * .0021 + .6) + 10. * sin(gx * .0057 + 2.); }
// world-fixed easing of the relief: low under the camera's low run and along the elk's own line
float reliefK(vec2 w) {
  float zc = mix(650., 300., smoothstep(-1750., -800., w.x));
  float cor = mix(.26, 1., smoothstep(40., 330., abs(w.y - zc)));
  cor = mix(cor, 1., smoothstep(-760., -400., w.x));
  float track = mix(.1, 1., smoothstep(150., 430., abs(w.y)));
  track = mix(1., track, smoothstep(-1700., -1150., w.x) * (1. - smoothstep(500., 1000., w.x)));
  return min(cor, track);
}
float rollN(vec2 g) {
  float n = sin(g.x * .0031 + 1.3 + 1.7 * sin(g.y * .0017)) * sin(g.y * .0027 + .4) * .5
          + sin(dot(g, vec2(.0062, .0041)) + 2.1) * .25 + sin(dot(g, vec2(-.0093, .0121)) + .7) * .13
          + sin(dot(g, vec2(.021, -.017))) * .06;
  return clamp(n, -1., 1.);
}
// ground height at a WORLD xz
float groundH(vec2 w) {
  vec2 g = w + vec2(uScroll, 0.);
  float bank = smoothstep(38., 150., abs(g.y - riverZ(g.x)));
  return (22. + 22. * rollN(g)) * bank * reliefK(w);
}
// x = night (the elk's shadow), y = meadow (the calf's shadow); edge wobbled like a brush stroke
vec2 maskAt(vec2 w) {
  vec2 g = w + vec2(uScroll, 0.);
  vec2 q = w + (vec2(vn2(g * .045), vn2(g * .045 + 31.)) - .5) * 16.;
  vec2 uv = clamp((q - uMaskRect.xy) * uMaskRect.zw, 0., 1.);
  vec2 m = textureLod(uMask, uv, 0.).rg;
  return smoothstep(vec2(.42), vec2(.58), m);
}
vec2 maskSoft(vec2 w) {
  vec2 uv = clamp((w - uMaskRect.xy) * uMaskRect.zw, 0., 1.);
  return textureLod(uMask, uv, 0.).rg;
}
// distance as three flat haze planes with dry-brushed joins
vec3 hazed(vec3 c, float dist, vec2 w) {
  float f = 1. - exp(-dist * uHazeK * mix(1., .42, smoothstep(260., 1000., cameraPosition.y)));
  float q = floor(clamp(f * 3.999 + (brush2(w * .0016 + 3.) - .5) * .5, 0., 3.999)) / 3.;
  return mix(c, uHaze, q * .7);
}
// three flat tones
vec3 tone3(float s, vec3 shade, vec3 mid, vec3 lit) { return mix(mix(shade, mid, step(.40, s)), lit, step(.68, s)); }
`;

// the same ground in JS (cabins, herd, carving checks)
const riverZ = (gx) => 690 + 22 * Math.sin(gx * 0.0021 + 0.6) + 10 * Math.sin(gx * 0.0057 + 2.0);
function reliefK(x, z) {
  const zc = lerp(650, 300, smoothstep(-1750, -800, x));
  let cor = lerp(0.26, 1, smoothstep(40, 330, Math.abs(z - zc)));
  cor = lerp(cor, 1, smoothstep(-760, -400, x));
  let track = lerp(0.1, 1, smoothstep(150, 430, Math.abs(z)));
  track = lerp(1, track, smoothstep(-1700, -1150, x) * (1 - smoothstep(500, 1000, x)));
  return Math.min(cor, track);
}
function rollN(gx, gz) {
  const n = Math.sin(gx * 0.0031 + 1.3 + 1.7 * Math.sin(gz * 0.0017)) * Math.sin(gz * 0.0027 + 0.4) * 0.5
    + Math.sin(gx * 0.0062 + gz * 0.0041 + 2.1) * 0.25 + Math.sin(-gx * 0.0093 + gz * 0.0121 + 0.7) * 0.13
    + Math.sin(gx * 0.021 - gz * 0.017) * 0.06;
  return clamp(n, -1, 1);
}
function groundH(x, z, scroll) {
  const gx = x + scroll;
  const bank = smoothstep(38, 150, Math.abs(z - riverZ(gx)));
  return (22 + 22 * rollN(gx, z)) * bank * reliefK(x, z);
}

// trees live on a jittered lattice in ground space; the same function seats the instanced spruce and
// paints every tree's footprint and cobalt shadow on the snow, far beyond the instanced rings
const FOREST = /* glsl */`
uniform float uDensity;
// stands and clearings: three scales of noise cut hard, so trees gather in clumps of ten to thirty with open snow between
float forestK(vec2 g) { return vn2(g * .0019 + 5.) * .42 + vn2(g * .0056 + 1.) * .3 + vn2(g * .0127 + 9.) * .28; }
float standK(vec2 g) { return smoothstep(.45, .52, forestK(g)); }
// xy = ground position of the tree, z = height, w = exists
vec4 treeCell(vec2 id) {
  vec4 h = h24(id + 71.);
  vec2 g = (id + .04 + .92 * h.xy) * ${CELL}.;      // jitter over the whole cell: no rows
  float keep = step(h.w, (.015 + .985 * standK(g)) * uDensity);
  keep *= step(92., abs(g.y - riverZ(g.x)));
  return vec4(g, mix(17., 31., h.z), keep);
}`;

// ---------------------------------------------------------------- sky dome
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SKY_FRAG = /* glsl */`
${COMMON}
uniform vec3 uBand[5]; uniform vec3 uTwilight; uniform float uTwi; uniform vec2 uSunAz; uniform float uCloud;
varying vec3 vDir;
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  float e = asin(clamp(d.y, -1., 1.)) * 57.2958;                       // elevation, degrees
  float ax = abs(d.x) < 1e-5 ? 1e-5 : d.x;
  float az = atan(d.z, ax);
  float br = brush2(vec2(az * 2.2, e * .09)) - .5;                    // long horizontal strokes
  float e2 = e + br * 5. + (brush2(vec2(az * 13., e * .45) + 5.) - .5) * 2.6;
  float lh = length(d.xz);
  float cs = dot(d.xz / max(lh, 1e-4), uSunAz);                        // 1 toward the sun's side
  vec3 col = uBand[0];
  col = mix(col, uBand[2], step(7., e2));
  col = mix(col, uBand[3], step(17., e2));
  col = mix(col, uBand[4], step(34., e2));
  // apricot wedge low on the sun's side only, and the brighter notch where it ought to have risen
  float wedge = smoothstep(.2, .95, cs);
  col = mix(col, uBand[1], step(e2, 10. * wedge) * step(.02, wedge));
  col = mix(col, mix(uBand[2], vec3(1.), .25) * 1.05, step(e2, 3.6 * smoothstep(.86, .99, cs)) * step(.87, cs));
  // inside the shadow: twilight above 30 degrees, the dawn ring stays round the horizon
  // (the join is dry-brushed in three ragged steps, and the cap itself is the lighter twilight violet, never a slab)
  float e3 = e2 + (brush2(vec2(az * 6., e * .16) + 11.) - .5) * 15. + (brush2(vec2(az * 23., e * .5) + 2.) - .5) * 5.;
  float tw = uTwi * step(35., e3);
  vec3 twiC = mix(uTwilight, uBand[4], .3) * 1.12;
  vec3 night = twiC * (1. + .12 * step(.5, vn2(d.xz * 5. + 3.)));
  col = mix(col, mix(col, twiC, .38), uTwi * step(15., e3));
  col = mix(col, mix(col, twiC, .62), uTwi * step(25., e3));
  col = mix(col, night, tw);
  vec2 sp = d.xz / (.35 + abs(d.y)) * 13.;
  vec2 id = floor(sp), f = fract(sp) - .5; vec4 hs = h24(id + 9.);
  float star = (1. - smoothstep(.03 + .05 * hs.z, .05 + .07 * hs.z, length(f - (hs.xy - .5) * .6))) * step(hs.w, .5);
  col += vec3(.9, .92, 1.) * star * tw * (.65 + .35 * sin(uTime * (1.5 + 3. * hs.x) + hs.y * 40.));
  // three flat lens clouds, low and far to the right: peach under, lilac over
  if (d.z > .05) {
    float a = d.x / d.z;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 c = vec2(-.9 + fi * .85 + uCloud + uTime * .0012, 5.5 + 2.6 * h11(fi + uCloud * 7.));
      vec2 r = vec2(.32 + .1 * h11(fi + 3.), 1.5 + .5 * h11(fi + 5.));
      vec2 q = (vec2(a, e) - c) / r;
      float top = q.y > 0. ? q.y : q.y * 2.6;                           // flat-bottomed lens
      float lens = step(q.x * q.x + top * top + br * .5, 1.);
      vec3 cc = mix(uBand[0] * 1.04, mix(uBand[4], uBand[3], .35), step(-.05 + br * .6, q.y));
      col = mix(col, mix(cc, uTwilight * 1.5, uTwi * .6), lens);
    }
  }
  col = mix(uHaze, col, smoothstep(-2.5, .5, e + br * 2.));          // below the horizon: the far haze plane
  col *= .97 + .06 * h21(floor(gl_FragCoord.xy * .5));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- terrain
const TERRAIN_VERT = /* glsl */`
${COMMON}
varying vec3 vW;
void main() {
  vec3 w = position;
  w.y = groundH(w.xz);
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const TERRAIN_FRAG = /* glsl */`
${COMMON}
${FOREST}
uniform vec3 uSnowLit; uniform vec3 uSnowWarm; uniform vec3 uShade; uniform vec3 uSpruce; uniform vec3 uNightSnow; uniform vec3 uNightTree;
uniform vec3 uIce; uniform vec3 uApricot; uniform vec3 uGold; uniform vec4 uPrint[4]; uniform vec3 uForest; uniform vec3 uCobalt; uniform vec4 uShake[2]; uniform vec4 uCab[3];
varying vec3 vW;
float massAt(vec2 g) { return step(.5, standK(g) * .66 + (brush2(g * .004 + 2.) - .5) * .3 + vn2(g * .011) * .1); }
// footprint (x) and spruce-shaped cobalt shadow (y) of the tree in lattice cell id
vec2 treePaint(vec2 id, vec2 g, vec2 sun, float lenK) {
  vec4 t = treeCell(id);
  vec2 v = g - t.xy;
  float r = t.z * .25, L = t.z * lenK;
  float al = dot(v, -sun), ac = abs(dot(v, vec2(-sun.y, sun.x)));
  float k = clamp(al / L, 0., 1.);
  float sh = step(0., al) * step(al, L) * step(ac, r * (1. - k) * (.7 + .3 * step(.5, fract(k * 5.))));
  return vec2(step(dot(v, v), r * r), sh) * t.w;
}
void main() {
  vec2 w = vW.xz, g = w + vec2(uScroll, 0.);
  float dist = length(vW - cameraPosition);
  float near = 1. - smoothstep(350., 1100., dist), close = 1. - smoothstep(120., 420., dist);
  // slope light: flat snow sits in the middle tone, sun-facing slopes warm, lee slopes cobalt
  float e = 4.;
  float h0 = vW.y, hx = groundH(w + vec2(e, 0.)), hz = groundH(w + vec2(0., e));
  vec3 n = normalize(vec3(h0 - hx, e, h0 - hz));
  vec2 sunXZ = uSun.xz / max(length(uSun.xz), 1e-4);
  float br = brush2(g * .021);
  float s = (dot(n, uSun) - uSun.y) * 2.6 + .56 + (br - .5) * .2;
  // terraced drifts: contour bands with scalloped lee edges throwing cobalt shapes
  float hh = h0 / 4.5 + vn2(g * .012) * 1.3;
  float fr = fract(hh);
  float lee = step(dot(n.xz, sunXZ), .02);
  float riser = step(fr, .1 + .16 * vn2(g * .09)) * step(.6, h0);
  s -= riser * mix(.1, .3, lee);
  s += step(.82, fr) * .07;
  // sastrugi: wind ripples as thin lilac lenses
  vec2 rg = vec2(g.x * .82 + g.y * .57, -g.x * .57 + g.y * .82);
  float sas = step(.66, vn2(rg * vec2(.05, .38)) * .75 + vn2(rg * vec2(.013, .09) + 9.) * .35);
  s -= sas * .2 * near;
  // spindrift: bands of blown snow travelling downwind, long strokes near and broad ones far
  vec2 wd = vec2(g.x * .8 + g.y * .6, -g.x * .6 + g.y * .8);
  vec2 so = vec2(sunXZ.x * .8 + sunXZ.y * .6, -sunXZ.x * .6 + sunXZ.y * .8);
  vec2 d1 = vec2((wd.x - uTime * 18.) * .004, wd.y * .03), d2 = vec2((wd.x - uTime * 55.) * .0008, wd.y * .0034) + 7.;
  float drift = step(.68, brush2(d1)) * near + step(.66, brush2(d2)) * (1. - near);
  float driftSh = step(.68, brush2(d1 + so * vec2(.004, .03) * 5.)) * near + step(.66, brush2(d2 + so * vec2(.0008, .0034) * 36.)) * (1. - near);
  s += drift * .15 - driftSh * (1. - drift) * .2;
  // tussock humps and half-buried boulders
  vec2 tc = g / 9., tid = floor(tc), tf = fract(tc) - .5; vec4 th = h24(tid + 5.);
  vec2 tv = (tf - (th.xy - .5) * .6) * 9.;
  float tr = .7 + 1.5 * th.z;
  float hump = step(length(tv), tr) * step(th.w, .55);
  float crescent = step(length(tv + sunXZ * tr * .75), tr * 1.05) * step(th.w, .55) * (1. - hump);
  s += (hump * .13 - crescent * .3) * close;
  float rock = step(length(tv + vec2(0., tr * .25)), tr * .55) * step(th.w, .12) * close;
  // the elk's own cloven prints, one stride apart, going back along its line
  float print = 0.;
  for (int i = 0; i < 4; i++) {
    vec4 P = uPrint[i];
    float dx = mod(g.x - P.x + 180., 360.) - 180.;
    vec2 pv = vec2(dx, abs(w.y - P.y) - 15.);
    float lobe = step(pv.x * pv.x / 1700. + pv.y * pv.y / 150., 1.);
    float rim = step((pv.x - 6. * sunXZ.x) * (pv.x - 6. * sunXZ.x) / 1700. + pv.y * pv.y / 150., 1.);
    print = max(print, (lobe * .6 + rim * .4) * step(g.x, P.x + 45.) * P.w);
  }
  s -= print * .34;
  // frozen river: ice, swept lilac, a braided ribbon of tracks
  float rz = riverZ(g.x), rd = abs(g.y - rz);
  float ice = 1. - step(34. + 6. * vn2(g * .03), rd);
  float sweep = step(.55, brush2(vec2(g.y * .02, g.x * .004) + 4.));
  float braid = step(abs(sin((g.y - rz) * .19 + 2.5 * vn2(vec2(g.x * .012, 2.)))), .13) * step(rd, 15.) * near;
  float lip = step(rd, 44.) * (1. - ice) * step(0., (g.y - rz) * sunXZ.y);
  vec3 lit = mix(uSnowLit, uSnowWarm, .45) * .78, mid = uSnowLit * .73, shade = mix(uShade, uSnowLit, .12) * .68;
  vec3 day = tone3(s - lip * .25, shade, mid, lit);
  vec3 iceC = mix(uIce * .66, mix(uShade, uIce, .5) * .6, sweep);
  iceC = mix(iceC, uSnowLit * .74, step(.6, vn2(g * vec2(.02, .07) + 2.)));
  day = mix(day, mix(iceC, uShade * .55, braid), ice);
  // starlit snow in two blues: broad dry-brushed drifts of a paler, greyer blue over the deep one
  float s2 = s + (brush2(g * .0052 + 7.) - .5) * .62 + (vn2(g * .0031) - .5) * .3;
  vec3 ngt = tone3(s2, uNightSnow * .74, uNightSnow, mix(uNightSnow, uShade, .36) * 1.3);
  ngt = mix(ngt, mix(uNightSnow * 1.12, uNightSnow * .7, max(braid, sweep * .5)), ice);
  // sled tracks: two runner lines from the near cabins down onto the ice and away up the river
  float tz = rz - mix(62., 25., smoothstep(-2225., -2090., g.x)) + 3. * sin(g.x * .013);
  float sled = step(abs(abs(g.y - tz) - .9), .16 + dist * .0022) * step(-2232., g.x) * (1. - smoothstep(700., 1100., dist));
  day = mix(day, shade * .82, sled);
  ngt = mix(ngt, mix(uNightSnow, uShade, .5) * 1.5, sled);
  // trees: footprint and shadow, this cell and the two cells toward the sun
  vec2 cid = floor(g / ${CELL}.);
  vec2 sc = sunXZ * ${CELL}.;
  float lenK = min(2.4, .82 / max(uSun.y, .2));
  vec2 tp = treePaint(cid, g, sunXZ, lenK);
  tp = max(tp, treePaint(floor((g + sc) / ${CELL}.), g, sunXZ, lenK));
  tp = max(tp, treePaint(floor((g + sc * 1.9) / ${CELL}.), g, sunXZ, lenK));
  tp *= (1. - ice) * (1. - smoothstep(800., 1500., dist));
  day = mix(day, shade * .92, tp.y * (1. - step(s, .4) * .5));
  day = mix(day, uSpruce * .8, tp.x);
  day = mix(day, uShade * .3, rock);
  // each hoof-fall plume lays one long cobalt shape down-sun, torn at the edge
  float plume = 0.;
  for (int i = 0; i < 2; i++) {
    vec4 sh = uShake[i];
    vec2 pv = w - sh.xy;
    float al = dot(pv, -sunXZ), ac = dot(pv, vec2(-sunXZ.y, sunXZ.x)), kk = clamp(al / 300., 0., 1.);
    float q = length(vec2((al - 140.) / 185., ac / (125. * (1. - .4 * kk))));
    plume = max(plume, sh.z * step(q + (vn2(g * .021) - .5) * .34 + (brush2(g * .006 + 1.) - .5) * .3, 1.));
  }
  day = mix(day, mix(uCobalt * 1.12, uSpruce * .7, tp.x), plume * (1. - ice));
  // far away the dots merge into flat forest shapes with dry-brushed edges
  float open = (1. - ice) * step(92., rd);
  float mass = massAt(g) * open;
  float far = smoothstep(500., 1500., dist) * uDensity;
  float mtone = step(.56, s + (vn2(g * .006 + 4.) - .5) * .5);
  // from high up: the snow settles to two pale tones, the forest to dark masses that throw cobalt shadow shapes
  float hi = smoothstep(420., 1050., cameraPosition.y) * smoothstep(500., 1500., dist);
  day = mix(day, tone3(mix(s, .62, .7), shade, mid, lit), hi);
  float massSh = massAt(g + sunXZ * (46. + 30. * vn2(g * .008))) * open * (1. - mass);
  day = mix(day, uCobalt, massSh * hi);
  vec3 mcol = mix(uSpruce * .8, mix(uSpruce, uShade, .3) * 1.15, mtone);
  mcol = mix(mcol, mix(uForest * .7, uForest * 1.25, mtone), hi);
  day = mix(day, mcol, mass * mix(far * .92, 1., hi));
  ngt = mix(ngt, uNightTree * mix(1., 1.6, mtone), mass * far * .9);
  ngt = mix(ngt, uNightTree * 1.1, max(tp.x, rock));
  ngt = mix(ngt, uNightSnow * .62, tp.y * .6);
  // the night shadow: starlight palette, glints, and an apricot-to-violet fringe along its edge
  vec2 m = maskAt(w), ms = maskSoft(w);
  vec2 gc = g / 13., gid = floor(gc), gf = fract(gc) - .5; vec4 gh = h24(gid + 3.);
  float gr = max(.05, dist * .0002);
  float glint = (1. - smoothstep(gr * .6, gr, length(gf - (gh.xy - .5) * .7))) * step(gh.w, .6) * (.5 + .5 * sin(uTime * (1.2 + 2.5 * gh.z) + gh.x * 30.));
  // a second, finer field of stars near the lens, so the ground reads as night with stars in it
  vec2 gc2 = g / 5.5 + 17., gid2 = floor(gc2), gf2 = fract(gc2) - .5; vec4 gh2 = h24(gid2 + 41.);
  float gr2 = max(.035, dist * .00042);
  float glint2 = (1. - smoothstep(gr2 * .6, gr2, length(gf2 - (gh2.xy - .5) * .7))) * step(gh2.w, .5) * (.45 + .55 * sin(uTime * (1.5 + 2.5 * gh2.z) + gh2.x * 30.));
  glint = max(glint, glint2 * (.55 + .45 * gh2.z) * (1. - smoothstep(160., 420., dist)));
  // the near cabins' windows each lay a small warm patch on the blue snow
  float warm = 0.;
  for (int i = 0; i < 3; i++) {
    vec4 cb = uCab[i]; vec2 dv = (g - cb.xy) / 1.5;
    vec2 lc = vec2(dv.x * cb.z - dv.y * cb.w, dv.x * cb.w + dv.y * cb.z);
    vec2 wq = vec2((lc.x + 1.52) / 2.5, (abs(lc.y) - 6.9) / 3.2);
    float d2 = dot(wq, wq) + (vn2(g * .8) - .5) * .35;
    warm = max(warm, step(d2, 1.) * .5 + step(d2, .42) * .5);
  }
  ngt = mix(ngt, mix(uNightSnow, uGold, .62) * .95, warm * .9);
  ngt += vec3(.75, .82, 1.) * glint * (1. - tp.x) * (.4 + .6 * near);
  vec3 col = mix(day, ngt, m.x);
  float fringe = smoothstep(.12, .42, ms.x) * (1. - smoothstep(.42, .7, ms.x)) * (1. - m.x);
  col = mix(col, mix(uApricot, uShade, .35) * .8, fringe * .75);
  // rare: the calf's shadow is a midsummer meadow
  if (m.y > .01) {
    float gs = (dot(n, uSun) - uSun.y) * 2.6 + .5 + (br - .5) * .45 + (vn2(g * .05) - .5) * .5;
    vec3 mead = tone3(gs, vec3(.07, .26, .12), vec3(.2, .46, .16), vec3(.47, .66, .22));
    vec2 fc = g / 5., fid = floor(fc), ff = fract(fc) - .5; vec4 fh = h24(fid + 17.);
    float fl = step(length(ff - (fh.xy - .5) * .6), .1 + .09 * fh.z + dist * .00035) * step(fh.w, .6);
    vec3 fcol = fh.z < .4 ? vec3(.95, .93, .86) : (fh.z < .75 ? vec3(1., .78, .2) : vec3(.92, .42, .55));
    mead = mix(mead, fcol * .85, fl);
    mead = mix(mead, vec3(.05, .2, .1), max(tp.y * .7, tp.x));
    col = mix(col, mead, m.y);
  }
  col *= mix(1., .955 + .09 * h21(floor(g * 4.)), close);                 // paper tooth
  col = hazed(col, dist, g);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- flora (spruce rings, riverside birch and willow)
// aKind: 0 spruce skirt, 1 snow lobe, 2 trunk, 3 birch bark, 4 willow twig
const FLORA_VERT = /* glsl */`
${COMMON}
${FOREST}
attribute float aKind; attribute vec2 aCell;
uniform float uN; uniform vec2 uRing; uniform float uCellK; uniform float uScale; uniform vec4 uShake[2];
varying vec3 vO; varying float vKind; varying float vS; varying vec2 vM; varying float vDist; varying vec2 vG; varying float vFall;
void main() {
  vec2 cg = cameraPosition.xz + vec2(uScroll, 0.);
  float show, hgt; vec2 gxz; vec4 hs;
  #ifdef RIVERSIDE
    float cc = floor(cg.x / 13.);
    float ix = cc + mod(aCell.x - cc + uN * .5, uN) - uN * .5;
    hs = h24(vec2(ix, aCell.y + 40.));
    gxz.x = (ix + hs.x * .7) * 13.;
    gxz.y = riverZ(gxz.x) + aCell.y * (41. + 16. * hs.y);
    show = step(hs.w, .72) * step(abs(mod(hs.z * 2., 1.) - .5) * 2., 2.) * (aKind < 3.5 ? step(hs.z, .55) : step(.55, hs.z));
    hgt = aKind < 3.5 ? mix(7., 11.5, hs.x) : mix(4., 6.5, hs.y);
  #else
    vec2 cc = floor(cg / (${CELL}. * uCellK));
    vec2 id = (cc + mod(aCell - cc + uN * .5, uN) - uN * .5) * uCellK;
    if (uCellK > 1.5) id += floor(h24(id + 3.).xy * uCellK * .999);   // far ring: a random cell of each block, never a row
    vec4 t = treeCell(id);
    hs = h24(id + 13.);
    gxz = t.xy; hgt = t.z * uScale;
    float dc = length(gxz - cg);
    show = t.w * smoothstep(uRing.x - 14., uRing.x, dc) * (1. - smoothstep(uRing.y - 14., uRing.y, dc));
  #endif
  vec2 wxz = gxz - vec2(uScroll, 0.);
  float ca = cos(hs.x * 6.283), sa = sin(hs.x * 6.283);
  vec3 p = vec3(position.x * ca - position.z * sa, position.y, position.x * sa + position.z * ca);
  vec3 n = vec3(normal.x * ca - normal.z * sa, normal.y, normal.x * sa + normal.z * ca);
  p *= hgt * show;
  // hoof-fall: every spruce round it drops its snow
  float fall = 0.;
  for (int i = 0; i < 2; i++) {
    vec4 sh = uShake[i];
    fall = max(fall, sh.z * (1. - smoothstep(sh.w * .55, sh.w, length(wxz - sh.xy))));
  }
  if (aKind > .5 && aKind < 1.5) { p.xz *= 1. - fall * .9; p.y -= fall * fall * position.y * hgt * .8; }
  // tips nod in a light wind
  float sway = sin(uTime * (.9 + hs.y) + hs.z * 20. + gxz.x * .02) * .012 + sin(uTime * 2.7 + hs.w * 9.) * .004;
  p.xz += vec2(.8, .6) * sway * position.y * position.y * hgt * (aKind > 3.5 ? 3. : 1.);
  vec3 w = vec3(wxz.x + p.x, groundH(wxz) - .3 + p.y, wxz.y + p.z);
  vO = position * hgt + hs.xyz * 30.; vKind = aKind; vG = gxz; vFall = fall;
  vS = dot(normalize(n + vec3(0., 1e-4, 0.)), uSun) * .5 + .5;
  vM = maskAt(wxz);
  vec4 mv = viewMatrix * vec4(w, 1.); vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FLORA_FRAG = /* glsl */`
${COMMON}
uniform vec3 uSnowLit; uniform vec3 uSnowWarm; uniform vec3 uShade; uniform vec3 uSpruce; uniform vec3 uSpruceLit;
uniform vec3 uNightSnow; uniform vec3 uNightTree; uniform vec3 uApricot;
varying vec3 vO; varying float vKind; varying float vS; varying vec2 vM; varying float vDist; varying vec2 vG; varying float vFall;
void main() {
  float br = brush2(vO.xy * .35 + vO.z * .2) - .5;
  float s = vS + br * .3;
  vec3 day, ngt;
  if (vKind < .5) {                               // skirt
    day = tone3(s, uSpruce * .62, uSpruce, uSpruceLit);
    ngt = mix(uNightTree, uNightTree * 1.9, step(.6, s));
    // snow dusted over the boughs in dry strokes; the trees round a hoof-fall have dropped theirs and stand dark and bare
    float dust = step(.6, brush2(vO.xz * .7 + vO.y * .9 + 3.) + (vS - .5) * .5) * (1. - vFall);
    day = mix(day * mix(1., .7, vFall), mix(mix(uShade, uSnowLit, .1) * .7, uSnowLit * .74, step(.5, s)), dust);
    ngt = mix(ngt, uNightSnow * 1.15, dust);
  } else if (vKind < 1.5) {                       // its snow load
    day = tone3(s + .08, mix(uShade, uSnowLit, .1) * .7, uSnowLit * .74, mix(uSnowLit, uSnowWarm, .4) * .8);
    ngt = mix(uNightSnow * .9, uNightSnow * 1.5, step(.55, s));
  } else if (vKind < 2.5) {                       // trunk
    day = uSpruce * .45; ngt = uNightTree * .8;
  } else if (vKind < 3.5) {                       // birch: pale bark, dark ticks, lilac shade
    float tick = step(.8, vn2(vec2(vO.y * 1.7, vO.x * .4)));
    day = mix(mix(uShade * .78, uSnowLit * .8, step(.5, s)), uSpruce * .5, tick);
    ngt = mix(uNightSnow * 1.25, uNightTree, tick);
  } else {                                        // willow: red-gold twigs
    day = mix(vec3(.5, .13, .07), mix(uApricot, vec3(.8, .3, .1), .45), step(.45, s + br));
    ngt = mix(uNightTree * 1.5, vec3(.16, .1, .22), step(.5, s));
  }
  vec3 col = mix(day, ngt, vM.x);
  col = mix(col, col * vec3(.75, 1.15, .7) + vec3(0., .05, 0.) * step(vKind, 1.5) * step(.5, vKind), vM.y);   // meadow shade: thawed green
  col *= .96 + .08 * h21(floor(vO.xy * 3.));
  gl_FragColor = vec4(hazed(col, vDist, vG), 1.);
}`;

// a spruce as stacked flat skirts with scalloped hems, each carrying its own snow lobe (unit height)
function spruceGeo(skirts, segs, scallop, rng) {
  const pos = [], kind = [], idx = [];
  const V = (x, y, z, k) => { pos.push(x, y, z); kind.push(k); return pos.length / 3 - 1; };
  for (let k = 0; k < skirts; k++) {
    const f = k / skirts, y0 = 0.1 + f * 0.84, top = Math.min(1, y0 + 1.25 / skirts + 0.05), R = 0.27 * (1 - f * 0.78);
    const ringN = scallop ? segs * 2 : segs, a0 = rng() * TAU;
    const apex = V(0, top, 0, 0), first = pos.length / 3;
    for (let j = 0; j < ringN; j++) {
      const a = a0 + (j / ringN) * TAU, r = R * (scallop && j % 2 ? 0.74 : 1), dy = scallop && j % 2 ? 0.035 : 0;
      V(Math.cos(a) * r, y0 + dy - 0.02, Math.sin(a) * r, 0);
    }
    for (let j = 0; j < ringN; j++) idx.push(apex, first + (j + 1) % ringN, first + j);
    // snow lobe: an irregular cap over the upper part of the skirt
    const sa = V(0, top + 0.012, 0, 1), sf = pos.length / 3, hgt = top - y0;
    for (let j = 0; j < segs; j++) {
      const a = a0 + 0.3 + (j / segs) * TAU, cover = 0.5 + 0.32 * rng(), r = R * cover * 1.12;
      V(Math.cos(a) * r, top - hgt * cover + 0.02, Math.sin(a) * r, 1);
    }
    for (let j = 0; j < segs; j++) idx.push(sa, sf + (j + 1) % segs, sf + j);
  }
  if (scallop) {                                  // trunk
    const t = V(0, 0.3, 0, 2), b = pos.length / 3;
    for (let j = 0; j < 3; j++) V(Math.cos(j * 2.1) * 0.03, 0, Math.sin(j * 2.1) * 0.03, 2);
    for (let j = 0; j < 3; j++) idx.push(t, b + (j + 1) % 3, b + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// bare birch (kind 3) and red-gold willow (kind 4) in one unit-height geometry; the shader shows one of them
function riversideGeo(rng) {
  const pos = [], kind = [], idx = [];
  const tri = (a, b, c, k) => { const o = pos.length / 3; pos.push(...a, ...b, ...c); kind.push(k, k, k); idx.push(o, o + 1, o + 2); };
  for (let c = 0; c < 2; c++) {                   // birch trunk: two crossed tapered blades
    const dx = c ? 0.022 : 0, dz = c ? 0 : 0.022;
    tri([-dx, 0, -dz], [dx, 0, dz], [dx * 0.3, 1, dz * 0.3], 3); tri([-dx, 0, -dz], [dx * 0.3, 1, dz * 0.3], [-dx * 0.3, 1, -dz * 0.3], 3);
  }
  for (let i = 0; i < 9; i++) {                   // branches
    const y = 0.32 + 0.065 * i, a = i * 2.4 + rng() * 0.6, L = 0.36 * (1 - (y - 0.3) * 0.75), up = 0.75 + rng() * 0.3;
    const ex = Math.cos(a) * L, ez = Math.sin(a) * L;
    tri([0, y - 0.012, 0], [0, y + 0.014, 0], [ex, y + L * up, ez], 3);
    tri([ex * 0.5, y + L * up * 0.45, ez * 0.5], [ex * 0.52, y + L * up * 0.5, ez * 0.52], [ex * 0.5 + Math.cos(a + 1) * L * 0.4, y + L * up * 0.95, ez * 0.5 + Math.sin(a + 1) * L * 0.4], 3);
  }
  for (let i = 0; i < 12; i++) {                  // willow twigs fanning from the root
    const a = i * 0.52 + rng() * 0.4, sp = 0.28 + rng() * 0.3, h = 0.65 + rng() * 0.35, b = 0.045;
    tri([Math.cos(a + 1.57) * b, 0, Math.sin(a + 1.57) * b], [-Math.cos(a + 1.57) * b, 0, -Math.sin(a + 1.57) * b], [Math.cos(a) * sp, h, Math.sin(a) * sp], 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the built things (one merged mesh in ground space)
// aKind: 0 log wall, 1 heaped snow, 2 window, 3 dark wood, 4 hay
class Built {
  constructor() { this.pos = []; this.kind = []; this.base = []; this.loc = []; this.m = new THREE.Matrix4(); this.v = new THREE.Vector3(); }
  at(gx, gz, rot, scale = 1) { this.m.makeRotationY(rot).scale(this.v.set(scale, scale, scale)); this.gx = gx; this.gz = gz; return this; }
  tri(a, b, c, k) {
    for (const p of [a, b, c]) {
      this.v.set(p[0], p[1], p[2]); this.loc.push(this.v.x, this.v.y, this.v.z);
      this.v.applyMatrix4(this.m);
      this.pos.push(this.v.x + this.gx, this.v.y, this.v.z + this.gz); this.kind.push(k); this.base.push(this.gx, this.gz);
    }
  }
  quad(a, b, c, d, k) { this.tri(a, b, c, k); this.tri(a, c, d, k); }
  box(x, y, z, sx, sy, sz, k) {                   // centre x,z; base y
    const x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, y1 = y + sy;
    this.quad([x0, y, z1], [x1, y, z1], [x1, y1, z1], [x0, y1, z1], k); this.quad([x1, y, z0], [x0, y, z0], [x0, y1, z0], [x1, y1, z0], k);
    this.quad([x1, y, z1], [x1, y, z0], [x1, y1, z0], [x1, y1, z1], k); this.quad([x0, y, z0], [x0, y, z1], [x0, y1, z1], [x0, y1, z0], k);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], k);
  }
  // gable prism along x with a rounded heap profile; profile = [[z, y], ...] from one eave over the ridge to the other
  prism(x0, x1, prof, k) {
    for (let i = 0; i < prof.length - 1; i++) {
      const [za, ya] = prof[i], [zb, yb] = prof[i + 1];
      this.quad([x0, ya, za], [x0, yb, zb], [x1, yb, zb], [x1, ya, za], k);
    }
    const mid = prof[Math.floor(prof.length / 2)];
    for (let i = 0; i < prof.length - 1; i++) {
      if (i === Math.floor(prof.length / 2) || i + 1 === Math.floor(prof.length / 2)) continue;
      this.tri([x0, prof[i][1], prof[i][0]], [x0, mid[1], mid[0]], [x0, prof[i + 1][1], prof[i + 1][0]], k);
      this.tri([x1, prof[i][1], prof[i][0]], [x1, prof[i + 1][1], prof[i + 1][0]], [x1, mid[1], mid[0]], k);
    }
    const a = prof[0], b = prof[prof.length - 1];
    this.tri([x0, a[1], a[0]], [x0, b[1], b[0]], [x0, mid[1], mid[0]], k); this.tri([x1, a[1], a[0]], [x1, mid[1], mid[0]], [x1, b[1], b[0]], k);
  }
  cabin(gx, gz, rot, s, rng) {
    this.at(gx, gz, rot, s);
    const L = 9.5, W = 6.6, H = 3.5;
    this.box(0, -1, 0, L, H + 1, W, 0);
    this.prism(-L / 2, L / 2, [[W / 2, H], [0, H + 2.9], [-W / 2, H]], 0);                               // gable ends
    this.prism(-L / 2 - 0.7, L / 2 + 0.7, [[W / 2 + 1.1, H - 0.5], [W / 2 + 0.6, H + 0.9], [0, H + 4.1], [-W / 2 - 0.6, H + 0.9], [-W / 2 - 1.1, H - 0.5]], 1);
    this.box(L * 0.24, H + 1.6, W * 0.16, 0.9, 3.4, 0.9, 3); this.box(L * 0.24, H + 5, W * 0.16, 1.25, 0.45, 1.25, 1);       // chimney + cap of snow
    for (const sz of [1, -1]) {                   // one square window each long side, gold
      const z = sz * (W / 2 + 0.06), wx = -L * 0.16;
      this.quad([wx - 1.0 * sz, 1.0, z], [wx + 1.0 * sz, 1.0, z], [wx + 1.0 * sz, 2.7, z], [wx - 1.0 * sz, 2.7, z], 2);
      this.box(wx, 0.72, sz * (W / 2 + 0.2), 2.4, 0.26, 0.4, 1);                                        // snow on the sill
    }
    this.quad([L / 2 + 0.06, 1.2, 0.8], [L / 2 + 0.06, 1.2, -0.8], [L / 2 + 0.06, 2.8, -0.8], [L / 2 + 0.06, 2.8, 0.8], 2);
    this.quad([-L / 2 - 0.06, -0.2, -0.7], [-L / 2 - 0.06, -0.2, 0.7], [-L / 2 - 0.06, 2.3, 0.7], [-L / 2 - 0.06, 2.3, -0.7], 3);
    this.prism(-L / 2 - 4, -L / 2 - 1.6, [[2.2, -0.4], [1.2, 0.9], [0, 1.25], [-1.2, 0.9], [-2.2, -0.4]], 1);    // a drift by the door
    return { gx: gx + Math.cos(rot) * L * 0.24 * s, gz: gz - Math.sin(rot) * L * 0.24 * s, top: (H + 5.6) * s };   // chimney mouth
  }
  hayRack(gx, gz, rot, s = 1) {
    this.at(gx, gz, rot, s);
    this.prism(-3, 3, [[1.8, 0.3], [0, 3.3], [-1.8, 0.3]], 4);
    this.prism(-3.3, 3.3, [[1.1, 2.1], [0.6, 3.2], [0, 3.75], [-0.6, 3.2], [-1.1, 2.1]], 1);
    for (const x of [-3.2, 3.2]) this.box(x, -1, 0, 0.3, 4.6, 0.3, 3);
  }
  bridge(gx, gz, len) {
    this.at(gx, gz, Math.PI / 2, 1);
    this.box(0, 2.2, 0, len, 0.5, 5, 3); this.box(0, 2.7, 0, len * 0.96, 0.35, 3.4, 1);
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8 - 0.5) * len;
      for (const z of [-2.4, 2.4]) { this.box(x, 2.6, z, 0.35, 1.7, 0.35, 3); this.box(x, 4.3, z, 0.6, 0.3, 0.6, 1); }
      if (i % 2 === 0) this.box(x, -2, 0, 0.8, 4.4, 4.4, 3);
    }
    for (const z of [-2.4, 2.4]) this.box(0, 3.7, z, len, 0.22, 0.22, 3);
  }
  church(gx, gz, rot) {
    this.at(gx, gz, rot, 1.25);
    this.box(0, -1, 0, 15, 7, 7.4, 0);
    this.prism(-7.5, 7.5, [[3.7, 6], [0, 10.4], [-3.7, 6]], 0);
    this.prism(-8.2, 8.2, [[4.9, 5.4], [4.2, 7.2], [0, 11.8], [-4.2, 7.2], [-4.9, 5.4]], 1);
    this.box(9.6, -1, 0, 4.4, 15, 4.4, 0);                                                              // tower
    const y = 14, r = 3.1, tip = [9.6, 25, 0], c = [[9.6 - r, y, -r], [9.6 + r, y, -r], [9.6 + r, y, r], [9.6 - r, y, r]];
    for (let i = 0; i < 4; i++) { this.tri(c[i], tip, c[(i + 1) % 4], i < 2 ? 1 : 3); }
    for (const sz of [1, -1]) for (const wx of [-4.5, -1, 2.5]) {
      const z = sz * 3.76; this.quad([wx - 0.7 * sz, 1.4, z], [wx + 0.7 * sz, 1.4, z], [wx + 0.7 * sz, 4.4, z], [wx - 0.7 * sz, 4.4, z], 2);
    }
    this.quad([11.86, 9.5, 0.7], [11.86, 9.5, -0.7], [11.86, 11.5, -0.7], [11.86, 11.5, 0.7], 2);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aLoc', new THREE.Float32BufferAttribute(this.loc, 3));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.kind, 1));
    g.setAttribute('aBase', new THREE.Float32BufferAttribute(this.base, 2));
    g.computeVertexNormals();
    return g;
  }
}

const BUILT_VERT = /* glsl */`
${COMMON}
attribute float aKind; attribute vec2 aBase; attribute vec3 aLoc;
varying vec3 vL; varying float vKind; varying float vS; varying vec2 vM; varying float vDist; varying vec2 vG;
void main() {
  vec2 bw = aBase - vec2(uScroll, 0.);
  vec3 w = vec3(position.x - uScroll, position.y + groundH(bw), position.z);
  vL = aLoc; vKind = aKind; vG = aBase; vM = maskAt(bw);
  vS = dot(normalize(normal + vec3(0., 1e-4, 0.)), uSun) * .5 + .5;
  vec4 mv = viewMatrix * vec4(w, 1.); vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const BUILT_FRAG = /* glsl */`
${COMMON}
uniform vec3 uSnowLit; uniform vec3 uSnowWarm; uniform vec3 uShade; uniform vec3 uNightSnow; uniform vec3 uNightTree; uniform vec3 uGold;
varying vec3 vL; varying float vKind; varying float vS; varying vec2 vM; varying float vDist; varying vec2 vG;
void main() {
  float br = brush2(vL.xy * .5 + vL.z * .3) - .5, s = vS + br * .25;
  vec3 day, ngt;
  if (vKind < .5) {                               // logs: warm lit, violet-brown shade, a dark seam per log
    float seam = step(fract(vL.y / .52), .16);
    day = tone3(s, vec3(.2, .13, .2), vec3(.36, .2, .15), vec3(.58, .34, .2)) * (1. - seam * .35);
    ngt = mix(uNightTree * 1.25, uNightTree * 2.1, step(.55, s)) * (1. - seam * .3);
  } else if (vKind < 1.5) {                       // heaped snow
    day = tone3(s + .06, mix(uShade, uSnowLit, .1) * .7, uSnowLit * .75, mix(uSnowLit, uSnowWarm, .4) * .8);
    ngt = mix(uNightSnow * .95, uNightSnow * 1.55, step(.55, s));
  } else if (vKind < 2.5) {                       // the window: lit while the night is on it
    day = uGold * .3; ngt = uGold * 2.3;
  } else if (vKind < 3.5) {
    day = mix(vec3(.12, .08, .13), vec3(.3, .17, .12), step(.55, s)); ngt = uNightTree;
  } else {
    day = mix(vec3(.45, .32, .14), vec3(.74, .58, .26), step(.5, s + br)); ngt = uNightTree * 1.8;
  }
  float night = vKind > 1.5 && vKind < 2.5 ? smoothstep(.0, 1., vM.x) : vM.x;
  vec3 col = mix(day, ngt, night);
  if (vKind < 1.5 || vKind > 2.5) col *= .96 + .08 * h21(floor(vL.xy * 4.));
  gl_FragColor = vec4(hazed(col, vDist, vG) , 1.);
}`;

// ---------------------------------------------------------------- reindeer stream (instanced, shader gallop)
// aPart: x = part (0 body, 1 pale patch, 2 antler, 3 leg, 4 snow kicked up), y = leg phase offset; aPivot = hip
const HERD_VERT = /* glsl */`
${COMMON}
attribute vec2 aPart; attribute vec4 aI; uniform vec4 uHerd;      // x = stream centre (world x), y = gait time, z = show, w = lane wobble time
varying vec3 vO; varying float vKind; varying float vS; varying vec2 vM; varying float vDist; varying vec2 vG;
void main() {
  float ph = uHerd.y * (5.2 + aI.w) + aI.z * 6.283;
  vec3 p = position;
  float part = aPart.x;
  if (part > 2.5 && part < 3.5) {                 // legs swing from the hip, fore and hind half a beat apart
    float a = sin(ph + aPart.y) * .85, c = cos(a), s = sin(a);
    vec2 q = p.xy - vec2(position.z > 5. ? 0. : (p.x > 0. ? .62 : -.62), 1.22);
    q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
    p.xy = q + vec2(p.x > 0. ? .62 : -.62, 1.22);
    p.y += max(0., sin(ph + aPart.y + 1.2)) * .12;
  } else if (part > 3.5) {                        // snow kicked up behind the hooves
    float t = fract(ph / 6.283 + aPart.y);
    p.xy = vec2(-.9 - t * 2.6, .15 + t * (1. - t) * 2.4) + (p.xy - vec2(-1., .3)) * (.4 + 1.6 * t) * (1. - t * t);
  } else {
    float rock = sin(ph) * .09;                   // body rocks and bounds
    p.xy = vec2(p.x * cos(rock) - (p.y - 1.3) * sin(rock), p.x * sin(rock) + (p.y - 1.3) * cos(rock) + 1.3);
  }
  p.y += abs(sin(ph)) * .16;
  p *= 1.4 + .25 * aI.z;
  float x = uHerd.x + aI.x + sin(uHerd.w * .7 + aI.z * 9.) * 4.;
  float gx = x + uScroll;
  float z = riverZ(gx) + aI.y + sin(gx * .013 + aI.z * 20.) * 4.;
  float sl = (riverZ(gx + 6.) - riverZ(gx)) / 6.;
  vec2 f = normalize(vec2(1., sl));
  vec3 w = vec3(x + p.x * f.x - p.z * f.y, p.y * uHerd.z + .1, z + p.x * f.y + p.z * f.x);
  vec3 n = normalize(normal + vec3(0., 1e-4, 0.));
  vS = dot(vec3(n.x * f.x - n.z * f.y, n.y, n.x * f.y + n.z * f.x), uSun) * .5 + .5;
  vO = position; vKind = part; vG = vec2(gx, z); vM = maskAt(vec2(x, z));
  vec4 mv = viewMatrix * vec4(w, 1.); vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const HERD_FRAG = /* glsl */`
${COMMON}
uniform vec3 uSnowLit; uniform vec3 uShade; uniform vec3 uNightSnow; uniform vec3 uNightTree; uniform vec3 uGold;
varying vec3 vO; varying float vKind; varying float vS; varying vec2 vM; varying float vDist; varying vec2 vG;
void main() {
  float s = vS + (brush2(vO.xy * 1.6 + vO.z) - .5) * .3;
  vec3 day, ngt;
  if (vKind < .5 || (vKind > 2.5 && vKind < 3.5)) {
    day = tone3(s, vec3(.17, .12, .2), vec3(.36, .27, .25), vec3(.62, .47, .36));
    ngt = mix(uNightTree * .9, uNightSnow * .8, step(.6, s));
  } else if (vKind < 1.5) {
    day = tone3(s, uShade * .7, uSnowLit * .7, uSnowLit * .8); ngt = mix(uNightSnow, uNightSnow * 1.6, step(.5, s));
  } else if (vKind < 2.5) {
    day = mix(uShade * .6, mix(uSnowLit, uGold, .3) * .74, step(.45, s)); ngt = uNightSnow * 1.35;
  } else {
    day = mix(uShade * .8, uSnowLit * .8, step(.4, s)); ngt = uNightSnow * 1.5;
  }
  gl_FragColor = vec4(hazed(mix(day, ngt, vM.x), vDist, vG), 1.);
}`;
function reindeerGeo() {
  const pos = [], part = [], idx = [];
  const V = (x, y, z, k, ph = 0) => { pos.push(x, y, z); part.push(k, ph); return pos.length / 3 - 1; };
  // lofted rings along x: [x, y, ry, rz]
  const loftX = (secs, k, M = 6) => {
    const base = pos.length / 3;
    secs.forEach(([x, y, ry, rz]) => { for (let j = 0; j < M; j++) { const a = (j / M) * TAU + 0.5; V(x, y + Math.sin(a) * ry, Math.cos(a) * rz, k); } });
    for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < M; j++) {
      const a = base + i * M + j, b = base + i * M + (j + 1) % M, c = a + M, d = b + M; idx.push(a, c, b, b, c, d);
    }
  };
  loftX([[-1.0, 1.42, 0.02, 0.02], [-0.86, 1.4, 0.3, 0.24], [-0.2, 1.3, 0.36, 0.3], [0.5, 1.36, 0.4, 0.3], [0.9, 1.5, 0.32, 0.23], [1.2, 1.68, 0.24, 0.17], [1.44, 1.8, 0.17, 0.14], [1.84, 1.66, 0.1, 0.09], [1.92, 1.63, 0.01, 0.01]], 0);
  loftX([[0.6, 1.16, 0.24, 0.2], [0.98, 1.3, 0.34, 0.25], [1.2, 1.5, 0.2, 0.18]], 1, 5);                   // pale ruff
  loftX([[-1.08, 1.5, 0.02, 0.02], [-0.98, 1.46, 0.18, 0.16], [-0.86, 1.42, 0.02, 0.02]], 1, 4);             // white scut
  for (const sx of [0.62, -0.62]) for (const sz of [0.17, -0.17]) {           // legs: tapered blades from the hip
    const ph = (sx > 0 ? 0 : Math.PI) + (sz > 0 ? 0 : 0.7), o = pos.length / 3;
    V(sx - 0.12, 1.22, sz, 3, ph); V(sx + 0.12, 1.22, sz, 3, ph); V(sx + 0.05, 0.62, sz, 3, ph); V(sx - 0.07, 0.62, sz, 3, ph);
    V(sx + 0.06, 0, sz, 3, ph); V(sx - 0.04, 0, sz, 3, ph);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3, o + 3, o + 2, o + 4, o + 3, o + 4, o + 5);
  }
  for (const sz of [1, -1]) {                     // antlers: a swept beam with three tines, flat
    const A = [[1.4, 1.9, 0.1 * sz], [0.95, 2.7, 0.5 * sz], [1.45, 3.3, 0.66 * sz]];
    const blade = (p, q, w) => { const o = pos.length / 3; V(p[0] - w, p[1], p[2], 2); V(p[0] + w, p[1], p[2], 2); V(q[0], q[1], q[2], 2); idx.push(o, o + 1, o + 2); };
    blade(A[0], A[1], 0.08); blade(A[1], A[2], 0.07); blade(A[1], [0.55, 3.1, 0.6 * sz], 0.06); blade([1.2, 2.25, 0.28 * sz], [1.75, 2.5, 0.3 * sz], 0.055);
    blade([1.2, 3.0, 0.58 * sz], [1.8, 3.2, 0.72 * sz], 0.05); blade([1.42, 1.95, 0.1 * sz], [1.95, 2.2, 0.16 * sz], 0.05);
  }
  for (let i = 0; i < 3; i++) {                   // kicked snow: small upright fans, animated in the shader
    const o = pos.length / 3, z = (i - 1) * 0.3, ph = i / 3;
    V(-1.25, 0.1, z, 4, ph); V(-0.75, 0.1, z, 4, ph); V(-0.8, 0.62, z + 0.1, 4, ph); V(-1.2, 0.55, z - 0.1, 4, ph); idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- chimney smoke: opaque scalloped discs that grow, lean and shrink
const SMOKE_VERT = /* glsl */`
${COMMON}
attribute vec4 aP; attribute float aT;        // aP: chimney ground x, z, mouth height, seed
varying vec2 vUv; varying vec2 vM; varying float vT; varying float vDist; varying vec2 vG;
void main() {
  float t = fract(uTime * .11 + aT + aP.w);
  vec2 bw = aP.xy - vec2(uScroll, 0.);
  vec3 c = vec3(bw.x, groundH(bw) + aP.z, bw.y) + vec3(.55, 0., .35) * t * t * 22. + vec3(0., t * 13., 0.);
  c.x += sin(t * 5. + aP.w * 30.) * 1.2 * t;
  float r = (.7 + 2.6 * t) * (1. - smoothstep(.72, 1., t));
  vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * r;
  vUv = position.xy; vM = maskAt(bw); vT = t + aP.w; vDist = length(mv.xyz); vG = aP.xy;
  gl_Position = projectionMatrix * mv;
}`;
const SMOKE_FRAG = /* glsl */`
${COMMON}
uniform vec3 uSnowLit; uniform vec3 uShade; uniform vec3 uNightSnow; uniform vec3 uSnowWarm;
varying vec2 vUv; varying vec2 vM; varying float vT; varying float vDist; varying vec2 vG;
void main() {
  float a = atan(vUv.y, abs(vUv.x) < 1e-4 ? 1e-4 : vUv.x);
  float edge = .86 + .12 * abs(sin(a * 3.5 + vT * 9.));
  if (length(vUv) > edge) discard;
  float s = dot(vUv, normalize(vec2(-.6, .8))) * .5 + .5 + (vn2(vUv * 2. + vT * 7.) - .5) * .3;
  vec3 day = mix(mix(uShade, uSnowLit, .3) * .72, mix(uSnowLit, uSnowWarm, .5) * .8, step(.45, s));
  vec3 ngt = mix(uNightSnow * 1.15, uNightSnow * 1.7, step(.45, s));
  gl_FragColor = vec4(hazed(mix(day, ngt, vM.x), vDist, vG), 1.);
}`;

// spindrift banners streaming from the tine tips, as off mountain peaks (same painted discs as the smoke)
const BANNER_VERT = /* glsl */`
${COMMON}
uniform mat4 uHead;
attribute vec4 aP; attribute float aT;        // aP: tine tip (elk axes, rest pose), seed
varying vec2 vUv; varying vec2 vM; varying float vT; varying float vDist; varying vec2 vG;
void main() {
  float t = fract(uTime * (.16 + .05 * aP.w) + aT + aP.w * 3.);
  vec3 wind = normalize(vec3(-1., -.1, .16 + .2 * (aP.w - .5)));
  vec3 c = (uHead * vec4(aP.xyz, 1.)).xyz + wind * (2. + t * (64. + 34. * aP.w));
  c.y += -t * t * 9. + sin(t * 9. + aP.w * 40. + uTime * .9) * 1.6 * t;
  c.z += sin(t * 6. + aP.w * 17. + uTime * .5) * 3.2 * t;
  // a stroke lying along the wind, turned to face the camera: long and thin, tapering away
  vec3 side = cross(wind, c - cameraPosition); side /= max(length(side), 1e-3);
  float wid = (.9 + 2.3 * t) * (1. - smoothstep(.55, 1., t)) * smoothstep(0., .05, t);
  float len = 5. + 9. * t;
  // blown snow is flown through: near the eye a stroke thins to nothing with its true distance from the lens, taken to the
  // middle line of its quad (the quad's nearest point, since it turns about that line to face the camera; the paint ends a
  // little short of the quad's ends, so off an end this errs toward thinning); 12 m and beyond is live's
  vec3 eye = cameraPosition - c; float eyeD = length(eye - wind * clamp(dot(eye, wind), -len, len));
  wid *= smoothstep(3., 12., eyeD);
  vec3 wp = c + wind * position.x * len + side * position.y * wid;
  vec4 mv = viewMatrix * vec4(wp, 1.);
  vUv = position.xy; vM = vec2(0.); vT = t * .4 + aP.w + aT; vDist = length(mv.xyz) * .25; vG = c.xz;
  gl_Position = projectionMatrix * mv;
}`;

// ---------------------------------------------------------------- flakes / diamond dust (points wrapped round the camera)
const FLAKE_VERT = /* glsl */`
uniform float uTime; uniform float uPx; uniform float uBox; uniform float uSize; uniform float uScrollV;
attribute vec4 aS;
varying float vA; varying float vK;
void main() {
  vec3 p = position * uBox;
  p.y -= uTime * (2.2 + 2.8 * aS.x) * uSize;
  p.x += sin(uTime * (.4 + aS.y) + aS.z * 20.) * 4. - uTime * 6. - uScrollV;
  p.z += cos(uTime * (.3 + aS.z) + aS.x * 20.) * 4.;
  p = cameraPosition + mod(p - cameraPosition + uBox * .5, uBox) - uBox * .5;
  vec4 mv = viewMatrix * vec4(p, 1.);
  float d = max(-mv.z, 1.);
  float px = uSize * (.6 + .8 * aS.w) * uPx / d;
  gl_PointSize = clamp(px, 2., 15.);
  vA = clamp(px / 1.6, .3, 1.) * smoothstep(1.5, 5., d) * (1. - smoothstep(uBox * .38, uBox * .5, d));
  vK = aS.w + uTime * (1. + aS.x);
  gl_Position = projectionMatrix * mv;
}`;
const FLAKE_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uTwinkle;
varying float vA; varying float vK;
void main() {
  vec2 q = gl_PointCoord - .5;
  float d = 1. - smoothstep(.3, .5, length(q));
  float tw = mix(1., .35 + .65 * step(.2, sin(vK * 3.)), uTwinkle);
  gl_FragColor = vec4(uCol, d * vA * tw);
}`;

// ---------------------------------------------------------------- valley fog: flat scalloped sheets the legs wade through
const FOG_VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FOG_FRAG = /* glsl */`
${COMMON}
uniform vec3 uFogCol; uniform vec3 uNightSnow; uniform vec3 uShade; uniform vec3 uSnowWarm; uniform float uLayer;
varying vec3 vW;
void main() {
  vec2 g = vW.xz + vec2(uScroll * .8 + uTime * 3., uLayer * 700.);
  float zc = mix(650., 300., smoothstep(-1750., -800., vW.x));
  float keep = smoothstep(240., 520., zc - vW.z) + smoothstep(-650., -350., vW.x);           // the elk's side only, never across the rail
  float n = vn2(g * .0016) * .6 + vn2(g * .0052 + 9.) * .3 + brush2(g * .004) * .2;
  if (n * clamp(keep, 0., 1.) < .5 + uLayer * .035) discard;
  float dist = length(vW - cameraPosition);
  vec2 m = maskAt(vW.xz);
  // billows as three flat tones, drifting with the sheet
  float tn = vn2(g * .0047 + uLayer * 3.) * .65 + brush2(g * .0023 + 5.) * .5;
  vec3 day = mix(mix(mix(uShade, uFogCol, .4) * .86, uFogCol, step(.46, tn)), mix(uFogCol, uSnowWarm, .45), step(.74, tn));
  vec3 ngt = mix(uNightSnow * 1.2, uNightSnow * 1.7, step(.5, tn));
  vec3 col = mix(day * (1. - uLayer * .04), ngt, m.x);
  gl_FragColor = vec4(hazed(col, dist, g), 1.);
}`;

// ---------------------------------------------------------------- the far wall of blue mountains
const MOUNT_VERT = /* glsl */`
varying vec3 vW; varying float vH;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vH = uv.y; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MOUNT_FRAG = /* glsl */`
${COMMON}
uniform vec3 uMount; uniform vec3 uSnowLit; uniform vec3 uSnowWarm; uniform float uLayer;
varying vec3 vW; varying float vH;
void main() {
  vec2 q = vec2(atan(vW.z + 300., abs(vW.x + 900.) < 1. ? 1. : vW.x + 900.) * 40., vW.y * .004);
  float br = brush2(q * vec2(.6, 1.2) + uLayer * 5.);
  float cap = step(.62 + (br - .5) * .5, vH + vW.y * .0005);
  vec2 dir = normalize(vW.xz + vec2(900., -300.));
  float lit = step(.2, dot(dir, -normalize(uSun.xz + 1e-4)) + (br - .5) * .8);
  vec3 col = mix(uMount, mix(uMount, uHaze, .5), uLayer);
  col = mix(col, mix(mix(uMount, uSnowLit, .55), mix(uSnowLit, uSnowWarm, .5) * .9, 1. - lit), cap);
  col = mix(col, uHaze, .12 + .3 * uLayer);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- the two ravens (scale cue at the hock)
const BIRD_VERT = /* glsl */`
uniform float uTime; attribute float aW;
varying float vW2;
void main() {
  vec3 p = position;
  float flap = sin(uTime * 5.5 + instanceMatrix[3][0] * .1) * .7;
  p.y += abs(p.x) * flap * aW * .55; p.x *= 1. - aW * .12 * (1. - cos(flap));
  vW2 = aW;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.);
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uCol; uniform vec3 uCol2; varying float vW2;
void main() { gl_FragColor = vec4(mix(uCol, uCol2, step(.82, vW2)), 1.); }`;

// ---------------------------------------------------------------- rare: the calf, a window onto a summer afternoon
const CALF_FRAG = /* glsl */`
uniform float uPass; uniform float uTime; uniform vec3 uSunW; uniform vec3 uGold;
varying vec3 vW; varying vec3 vN; varying vec3 vO; varying float vDepth;
float ch21(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float cvn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(ch21(i), ch21(i + vec2(1., 0.)), f.x), mix(ch21(i + vec2(0., 1.)), ch21(i + vec2(1., 1.)), f.x), f.y); }
void main() {
  if (uPass > 1.5) { gl_FragColor = vec4(0., 1., 0., 1.); return; }                      // meadow mask
  if (uPass > .5) {                                                                       // white-gold outline
    float s = dot(vN, uSunW) * .5 + .5;
    gl_FragColor = vec4(mix(uGold * .7, mix(uGold, vec3(1.), .5) * 1.02, step(.5, s)), 1.); return;
  }
  vec3 d = vW - cameraPosition; d /= max(length(d), 1e-4);
  float e = d.y;
  vec3 col = mix(vec3(.05, .27, .8), vec3(.012, .1, .56), smoothstep(-.25, .5, e + (cvn(d.xz * 7.) - .5) * .1));
  // cumulus: one per cell of view direction, three bumps on a flat base
  vec2 p = vec2(atan(d.z, abs(d.x) < 1e-5 ? 1e-5 : d.x) + uTime * .004, e * 1.15) / vec2(.15, .1);
  vec2 id = floor(p), q = fract(p) - .5;
  float hk = ch21(id + 3.), hx = ch21(id + 17.), hs = .75 + .5 * ch21(id + 31.);
  q = (q - vec2((hx - .5) * .3, 0.)) / hs;
  float bumps = max(max(step(length(q - vec2(-.2, -.04)), .15), step(length(q - vec2(.02, .04)), .21)), step(length(q - vec2(.22, -.05)), .14));
  bumps = max(bumps, step(abs(q.x), .3) * step(q.y, 0.));
  float cloud = bumps * step(-.17, q.y) * step(hk, .72);
  float under = step(q.y, -.09 + .03 * sin(q.x * 14.));
  col = mix(col, mix(vec3(.93, .93, .9), vec3(.55, .6, .86), under), cloud);
  col *= .96 + .08 * ch21(floor(gl_FragCoord.xy * .5));
  gl_FragColor = vec4(col, 1.);
}`;

const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
function instanced(base, name, arr, size) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
  g.instanceCount = arr.length / size;
  return g;
}

export default {
  id: 'sun-in-the-antlers',
  name: 'The Elk Who Carries the Sun',
  category: 'bizarre',
  weirdness: 0.85,
  media: ['air', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, Q = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const renderer = ctx.renderer;
    const disposables = [];
    // ---- the seeded look: hour, the night inside the elk, weather, cast
    let hourKey = rng.pick(['dawn', 'blue', 'lemon', 'dawn']);
    if (vary.hour === 'dawn' || vary.hour === 'golden') hourKey = 'dawn';
    else if (vary.hour === 'night') hourKey = 'blue';
    else if (vary.hour === 'day') hourKey = 'lemon';
    const H = HOURS[hourKey];
    const nightMode = rng.pick(['milkyway', 'comet', 'moon', 'aurora']);
    const weather = rng.pick(['clear', 'flakes', 'fog']);
    const village = rng.chance(0.45);
    const birdKind = rng.pick(['cranes', 'swans', 'ravens']);
    const rare = !!vary.rare;
    // plumage, pale accent (trailing edge of the arm), dark, bill: swans are white with a lilac shade and colour only at the bill
    const birdCols = { cranes: null, swans: ['#ECE9E0', '#AAB5EA', '#1C2350', '#F2B02C'], ravens: ['#1A1D30', '#4A5296', '#0C0E1C', '#1A1D30'] }[birdKind];

    const CALF = [-100, 0, 760];                   // rare: where the calf walks (elk axes), ahead and to the right of the flank climb
    const PH0 = 0.475;                             // walk phase so the right hind hoof lands as we come up on it
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(H.haze), 0.00016);

    // ---- the hero, in elk axes. The sun is ahead and to the left, 19 degrees up, so the camera starts
    //      inside the body's shadow and crosses its front edge on a diagonal.
    const el = 0.339, az = 0.307;
    const sunDir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az));
    const palette = [H.snowLit, H.sky[0], '#0B1033', H.ice, H.gold, H.spruce, H.apricot];
    const hero = await buildHero(ctx, { palette, detail: Q, shadow: false, night: nightMode, fogK: 0.5, sunDir: sunDir.toArray(),
      phase0: PH0, craneColors: birdCols, birdKind, cobalt: H.cobalt, craneScale: birdKind === 'swans' ? 1.9 : 1.7,
      boneShade: C(H.bone, 0.7), sunColors: H.sunCols });
    hero.object.rotation.y = Math.PI / 2;
    scene.add(hero.object);
    const E = hero.anchorsElk;
    await ctx.yield();

    // ---- the shadow mask: the hero's own shadow meshes drawn top-down (R night, G meadow)
    const maskRT = new THREE.WebGLRenderTarget(1024, 512, { depthBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const maskScene = new THREE.Scene(); maskScene.add(hero.shadow);
    const maskCam = new THREE.OrthographicCamera(-MASK.w / 2, MASK.w / 2, MASK.d / 2, -MASK.d / 2, 1, 4000);
    maskCam.position.set(MASK.x0 + MASK.w / 2, 2500, MASK.z0 + MASK.d / 2); maskCam.up.set(0, 0, -1);
    maskCam.lookAt(MASK.x0 + MASK.w / 2, 0, MASK.z0 + MASK.d / 2); maskCam.updateMatrixWorld(true);
    disposables.push(maskRT, hero.shadowMat);

    // ---- uniforms every painted thing shares
    const G = {
      uScroll: { value: 0 }, uTime: { value: 0 }, uMask: { value: maskRT.texture },
      uMaskRect: { value: new THREE.Vector4(MASK.x0, MASK.z0 + MASK.d, 1 / MASK.w, -1 / MASK.d) },
      uSun: { value: sunDir.clone() }, uHaze: { value: C(H.shade, 0.86).lerp(C(H.haze), 0.3) }, uHazeK: { value: 1 / 7000 }, uDensity: { value: 0.92 * dens },
      uSnowLit: { value: C(H.snowLit) }, uSnowWarm: { value: C(H.snowWarm) }, uShade: { value: C(H.shade) }, uSpruce: { value: C(H.spruce) },
      uSpruceLit: { value: C(H.spruceLit) }, uNightSnow: { value: C(H.nightSnow) }, uNightTree: { value: C(H.nightTree) }, uIce: { value: C(H.ice) },
      uApricot: { value: C(H.apricot) }, uGold: { value: C(H.gold) },
    };
    const mat = (vs, fs, uniforms = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...G, ...uniforms }, vertexShader: vs, fragmentShader: fs, ...extra });

    // ---- sky dome: five flat bands, the dawn ring, twilight when the camera is inside the shadow
    const skyU = { uBand: { value: H.sky.map((h) => C(h, 0.92)) }, uTwilight: { value: C(H.twilight) }, uTwi: { value: 0 },
      uSunAz: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() }, uCloud: { value: rng.range(0, 0.5) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(12500, 40, 24), mat(SKY_VERT, SKY_FRAG, skyU, { side: THREE.BackSide, depthWrite: false, depthTest: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

    // ---- far mountains: two flat walls the elk overtops
    const nz = ctx.noise;
    for (let L = 0; L < 2; L++) {
      const R = L ? 8600 : 10800, N = 220, pos = [], uv = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * TAU, cx = Math.cos(a), cz = Math.sin(a);
        const r = nz.ridged2 ? nz.ridged2(cx * 3.1 + L * 9, cz * 3.1, 4) : Math.abs(nz.fbm2(cx * 3.1 + L * 9, cz * 3.1, 4));
        const h = (L ? 380 : 820) * (0.35 + 0.65 * clamp(r, 0, 1)) * (0.75 + 0.25 * Math.sin(a * 3 + L));
        pos.push(-900 + cx * R, -260, 300 + cz * R, -900 + cx * R, h, 300 + cz * R); uv.push(i / N, 0, i / N, h / 820);
        if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, mat(MOUNT_VERT, MOUNT_FRAG, { uMount: { value: C(H.mount, 0.8) }, uLayer: { value: L } }, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }

    // ---- terrain: one warped grid, dense under the low run, displaced and painted in the shader
    const printU = { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) };
    const cabU = { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1, 0)) };
    const shakeU = { value: [new THREE.Vector4(0, 0, 0, 1), new THREE.Vector4(0, 0, 0, 1)] };
    {
      const NX = 216, NZ = 150, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
      let k = 0;
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
        const a = (i / NX) * 2 - 1, b = (j / NZ) * 2 - 1;
        pos[k++] = -1150 + 1500 * a + 10800 * Math.pow(a, 7); pos[k++] = 0; pos[k++] = 380 + 1000 * b + 11000 * Math.pow(b, 7);
      }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      const terrain = new THREE.Mesh(g, mat(TERRAIN_VERT, TERRAIN_FRAG, { uPrint: printU, uShake: shakeU, uCab: cabU, uForest: { value: C(H.forest) }, uCobalt: { value: C(H.cobalt, 0.62) } }));
      terrain.frustumCulled = false; scene.add(terrain);
    }
    await ctx.yield();

    // ---- spruce: three instanced rings on the shared lattice (near, mid, far); the snow paints the rest
    const frng = rng.fork ? rng.fork('flora') : rng;
    const ring = (geo, N, K, inner, outer, scale) => {
      const cells = new Float32Array(N * N * 2);
      for (let j = 0, k = 0; j < N; j++) for (let i = 0; i < N; i++) { cells[k++] = i; cells[k++] = j; }
      const m = new THREE.Mesh(instanced(geo, 'aCell', cells, 2), mat(FLORA_VERT, FLORA_FRAG,
        { uN: { value: N }, uRing: { value: new THREE.Vector2(inner, outer) }, uCellK: { value: K }, uScale: { value: scale }, uShake: shakeU }));
      m.frustumCulled = false; scene.add(m); return m;
    };
    const nearN = 18, midN = 2 * Math.round(24 * Math.sqrt(Q)), farN = 2 * Math.round(36 * Math.sqrt(Q));
    const nearR = nearN * CELL / 2 - 2, midR = midN * CELL / 2 - 2;
    ring(spruceGeo(5, 8, true, frng), nearN, 1, -100, nearR, 1);
    ring(spruceGeo(3, 6, false, frng), midN, 1, nearR, midR, 1);
    ring(spruceGeo(1, 3, false, frng), farN, 3, midR, farN * CELL * 3 / 2 - 20, 1.45);
    await ctx.yield();
    {                                             // birch and willow along both banks
      const N = 130, slots = new Float32Array(N * 2 * 2);
      for (let i = 0, k = 0; i < N; i++) for (const s of [-1, 1]) { slots[k++] = i; slots[k++] = s; }
      const m = new THREE.Mesh(instanced(riversideGeo(frng), 'aCell', slots, 2), mat(FLORA_VERT, FLORA_FRAG,
        { uN: { value: N }, uRing: { value: new THREE.Vector2(0, 1) }, uCellK: { value: 1 }, uScale: { value: 1 }, uShake: shakeU },
        { defines: { RIVERSIDE: 1 }, side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }

    // ---- cabins strung along the river, a bridge, hay racks (and on some visits a village church)
    const B = new Built(), brng = rng.fork ? rng.fork('built') : rng, chimneys = [];
    const bankZ = (gx, side, off) => riverZ(gx) + side * off;
    const cabinAt = (gx, side, off, s = 1.1, fixRot) => {
      const slope = (riverZ(gx + 5) - riverZ(gx - 5)) / 10;
      const rot = -Math.atan(slope) + brng.range(-0.25, 0.25) + (brng.chance(0.3) ? Math.PI / 2 : 0), k = brng.range(0.95, 1.15);   // (drawn even when overridden)
      chimneys.push(B.cabin(gx, bankZ(gx, side, off), fixRot ?? rot, fixRot === undefined ? s * k : s, brng));
    };
    // the three under the rail in the first seconds: big, turned three-quarters to the lens so a lit window and a gable show,
    // on the left bank between the rail and the ice (roofs 15 m and more under the camera)
    const NEARCAB = [[-2222, 78, 2.05], [-2190, 46, 1.2], [-2142, 92, 2.3]];
    NEARCAB.forEach(([gx, off, rot], i) => { cabinAt(gx, -1, off, 1.5, rot); cabU.value[i].set(gx, bankZ(gx, -1, off), Math.cos(rot), Math.sin(rot)); });
    cabinAt(-2075, -1, 52);
    B.hayRack(-2168, bankZ(-2168, -1, 66), 0.5, 1.5); B.hayRack(-1960, bankZ(-1960, 1, 66), -0.3);
    B.bridge(-1840, riverZ(-1840), 96);
    if (village) {
      B.church(-1915, bankZ(-1915, 1, 86), 0.2);
      for (const [gx, sd, off] of [[-2010, 1, 64], [-1975, 1, 96], [-1880, -1, 60], [-1790, 1, 62], [-1760, -1, 70], [-1820, 1, 100], [-1700, 1, 66]]) cabinAt(gx, sd, off, 1);
      for (let i = 0; i < 4; i++) cabinAt(-1500 + i * 420 + brng.range(-60, 60), i % 2 ? 1 : -1, brng.range(56, 80));
    } else {
      for (let i = 0; i < 11; i++) cabinAt(-1880 + i * 250 + brng.range(-70, 70), brng.chance(0.5) ? 1 : -1, brng.range(56, 84));
    }
    const built = new THREE.Mesh(B.geometry(), mat(BUILT_VERT, BUILT_FRAG, {}, { side: THREE.DoubleSide }));
    built.frustumCulled = false; scene.add(built);
    {                                             // a thread of smoke from every chimney
      const per = 8, n = chimneys.length * per, aP = new Float32Array(n * 4), aT = new Float32Array(n);
      chimneys.forEach((c, i) => { const seed = brng(); for (let j = 0; j < per; j++) { aP.set([c.gx, c.gz, c.top, seed], (i * per + j) * 4); aT[i * per + j] = j / per; } });
      const g = instanced(new THREE.PlaneGeometry(2, 2), 'aP', aP, 4); g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 1));
      const m = new THREE.Mesh(g, mat(SMOKE_VERT, SMOKE_FRAG)); m.frustumCulled = false; scene.add(m);
    }
    {                                             // spindrift banners off the tine tips
      const tips = [...hero.antlers.right.tines, ...hero.antlers.left.tines.filter((_, i) => i % 2 === 0)].map((T) => T.pts[T.pts.length - 1]);
      const per = Math.max(14, Math.round(24 * Q)), n = tips.length * per, aP = new Float32Array(n * 4), aT = new Float32Array(n);
      tips.forEach((q, i) => { const seed = brng(); for (let j = 0; j < per; j++) { aP.set([q.x, q.y, q.z, seed], (i * per + j) * 4); aT[i * per + j] = j / per; } });
      const g = instanced(new THREE.PlaneGeometry(2, 2), 'aP', aP, 4); g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 1));
      const m = new THREE.Mesh(g, mat(BANNER_VERT, SMOKE_FRAG, { uHead: { value: hero.uniforms.uSeg.value[3] } })); m.material.side = THREE.DoubleSide; m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    }
    await ctx.yield();

    // ---- the reindeer stream on the frozen river
    const herdN = Math.round(160 * (Q < 0.8 ? 0.6 : 1));
    const herdU = { value: new THREE.Vector4(-1700, 0, 1, 0) };
    {
      const hr = rng.fork ? rng.fork('herd') : rng, aI = new Float32Array(herdN * 4);
      for (let i = 0; i < herdN; i++) {
        const s = hr.range(-1, 1);
        aI.set([s * 200, hr.gauss() * 9 * (1 - 0.5 * Math.abs(s)), hr(), hr.range(-0.6, 0.6)], i * 4);
        aI[i * 4 + 1] = clamp(aI[i * 4 + 1], -24, 24);
      }
      const m = new THREE.Mesh(instanced(reindeerGeo(), 'aI', aI, 4), mat(HERD_VERT, HERD_FRAG, { uHerd: herdU }, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }

    // ---- weather: diamond dust always; big slow flakes or valley fog on some visits
    const flakeMats = [];
    const flakes = (count, box, size, col, twinkle) => {
      const pos = new Float32Array(count * 3), aS = new Float32Array(count * 4), fr = rng.fork ? rng.fork('flakes' + box) : rng;
      for (let i = 0; i < count; i++) { pos.set([fr(), fr(), fr()], i * 3); aS.set([fr(), fr(), fr(), fr()], i * 4); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
      const m = new THREE.ShaderMaterial({ uniforms: { uTime: G.uTime, uPx: { value: 500 }, uBox: { value: box }, uSize: { value: size }, uScrollV: { value: 0 },
        uCol: { value: col }, uTwinkle: { value: twinkle } }, vertexShader: FLAKE_VERT, fragmentShader: FLAKE_FRAG, transparent: true, depthWrite: false });
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 4; scene.add(p); flakeMats.push(m);
    };
    flakes(Math.round(3400 * Q), 220, 0.3, C(H.snowLit, 1.15), 1);
    if (weather === 'flakes') flakes(Math.round(2600 * Q), 190, 0.5, C(H.snowLit, 0.95), 0);
    if (weather === 'fog') {
      const fg = new THREE.PlaneGeometry(13000, 13000); fg.rotateX(-Math.PI / 2);
      for (let L = 0; L < 3; L++) {
        const m = new THREE.Mesh(fg, mat(FOG_VERT, FOG_FRAG, { uFogCol: { value: C(H.snowLit, 0.8).lerp(C(H.haze), 0.35) }, uLayer: { value: L } }, { side: THREE.DoubleSide }));
        m.position.set(-900, 70 + L * 45, 300); m.frustumCulled = false; scene.add(m);
      }
    }
    await ctx.yield();

    // ---- the rail (elk axes): out of the night shadow along the river, past a hoof-fall, up the flank,
    //      over the shoulder and through the right antler to the fork
    const fly = E.flyThrough, seat = E.portalSeat.position;
    const axis = (m) => E.gate.clone().addScaledVector(E.portalSeat.facing, -m).toArray();
    const pts = [
      [-2450, 30, 700], [-2390, 30, 685], [-2250, 30, 656], [-2090, 26, 664], [-1930, 16, 690], [-1790, 14, 690], [-1650, 15, 688],
      [-1480, 36, 640], [-1250, 88, 505], [-1010, 150, 350], [-800, 215, 290], [-690, 330, 385], [-560, 450, 470],
      // up beside the flank in a climbing left turn that crosses high over the rump, then down the gate's own axis
      // (a straight 11-degree descent from above the tine tips: the ring shows through the gate the whole way,
      // the sun rides in the left palm) and between the two rear tines
      [-470, 600, 540], [-360, 760, 560], [-270, 930, 500], [-250, 1090, 380], [-310, 1230, 230], [-410, 1325, 90],
      axis(780), axis(520), axis(260), fly[3].toArray(), fly[4].toArray(),
      fly[4].clone().lerp(seat, 0.33).toArray(), fly[4].clone().lerp(seat, 0.66).toArray(), seat.toArray(),
    ];
    const path = makePath(pts);
    // The scripted clock. Everything staged (walk, ground scroll, herd, hoof-fall) was timed against a 3,747 m rail;
    // the antler section is longer now, so the clock runs at KU per unit of u and simply passes 1 near the end.
    const KU = path.length / 3747, dGate = path.length - E.straightLength;
    hero.earU = 0.8 * KU;

    // ---- two ravens wheeling between the rail and the hock
    const hock = E.hocks[1];
    const ravenC = new THREE.Vector3(-735, 285, 255).lerp(hock, 0.05);
    const ravenGeo = new THREE.BufferGeometry();
    {
      const P = [], W = [], I = [];
      const v = (x, y, z, w) => { P.push(x, y, z); W.push(w); return P.length / 3 - 1; };
      const a = v(0, 0, 1.1, 0), b = v(0.24, 0, 0, 0), c = v(0, 0, -0.9, 0), d = v(-0.24, 0, 0, 0), t1 = v(0.3, 0, -1.45, 0), t2 = v(-0.3, 0, -1.45, 0);
      I.push(a, b, d, b, c, d, c, t1, t2);
      for (const s of [1, -1]) {
        const r0 = v(s * 0.15, 0, 0.4, 0), r1 = v(s * 0.15, 0, -0.35, 0), m0 = v(s * 1.2, 0, 0.3, 0.5), m1 = v(s * 1.2, 0, -0.45, 0.5), p0 = v(s * 2.2, 0, -0.1, 1), p1 = v(s * 2.0, 0, -0.6, 1);
        I.push(r0, m0, r1, r1, m0, m1, m0, p0, m1, m1, p0, p1);
      }
      ravenGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ravenGeo.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1)); ravenGeo.setIndex(I);
    }
    const ravens = new THREE.InstancedMesh(ravenGeo, new THREE.ShaderMaterial({ uniforms: { uTime: G.uTime, uCol: { value: C('#161A30') }, uCol2: { value: C('#3A4270') } },
      vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide }), 2);
    ravens.frustumCulled = false; scene.add(ravens);
    const dummy = new THREE.Object3D();

    // ---- rare: a calf at the right flank, a window onto a summer afternoon; its shadow is a meadow
    let calf = null;
    if (rare) {
      const segs = Array.from({ length: hero.segCount }, () => new THREE.Matrix4());
      const cu = { uSeg: { value: segs }, uRim: { value: 3.2 }, uPxK: { value: 0.004 }, uSunW: { value: sunDir.clone() }, uGroundW: { value: 0.6 }, uTime: G.uTime, uGold: G.uGold };
      const cm = (pass, side) => new THREE.ShaderMaterial({ uniforms: { ...cu, uPass: { value: pass } }, vertexShader: ELK_VERT, fragmentShader: CALF_FRAG, side });
      const grp = new THREE.Group(), K = 0.372;
      grp.position.set(CALF[0], CALF[1], CALF[2]); grp.scale.setScalar(K);
      const fill = new THREE.Mesh(hero.elkGeo, cm(0, THREE.FrontSide)), rim = new THREE.Mesh(hero.elkGeo, cm(1, THREE.BackSide));
      fill.renderOrder = 1; rim.renderOrder = 2;
      const shMat = cm(2, THREE.DoubleSide); shMat.uniforms.uSunW = { value: new THREE.Vector3(0.3, 0.74, 0.6).normalize() };
      const sh = new THREE.Mesh(hero.elkGeo, shMat), shGrp = new THREE.Group();
      shGrp.position.copy(grp.position); shGrp.scale.copy(grp.scale); shGrp.add(sh); maskScene.add(shGrp);
      for (const m of [fill, rim, sh]) m.frustumCulled = false;
      grp.add(fill, rim); scene.add(grp);
      disposables.push(sh.material);
      calf = { segs, cu, K, hoofs: Array.from({ length: 4 }, () => ({ x: 0, y: 0, z: 0, down: 1, c: 0 })) };
    }

    // is a point inside the elk's shadow? (the dome's twilight; capsules along the ray toward the sun)
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Vector3(), _d = new THREE.Vector3();
    const capsuleHit = (o, ax, ay, az, bx, by, bz, r) => {
      // closest approach between the ray o + sunDir t (t > 0) and the segment a-b
      _a.set(ax, ay, az); _b.set(bx, by, bz); _d.subVectors(_b, _a);
      let best = 1e9;
      for (let i = 0; i <= 6; i++) {
        _p.copy(_a).addScaledVector(_d, i / 6).sub(o);
        const t = Math.max(0, _p.dot(sunDir));
        _q.copy(sunDir).multiplyScalar(t).sub(_p);
        best = Math.min(best, _q.length());
      }
      return 1 - smoothstep(r * 0.8, r * 1.25, best);
    };
    const inShadow = (o) => {
      let s = Math.max(capsuleHit(o, -800, 690, 0, 20, 730, 0, 190), capsuleHit(o, 60, 800, 0, 560, 930, 0, 95));
      for (let i = 0; i < 4; i++) {
        const h = hero.hoof(i), hind = i % 2 === 0;
        s = Math.max(s, capsuleHit(o, h.pos.z, 40 + h.pos.y, -h.pos.x, hind ? -715 : 8, 640, -h.pos.x, 46));
      }
      return s;
    };

    // ---- the exit: a wreath of ice seated in the fork (opening 13 m, frost out to about 26 m), the lightest thing up here
    const endT = path.endTangent.clone().normalize(), ringDist = { value: 300 };
    {
      const R = 15.2, ringG = new THREE.TorusGeometry(R, 2.3, 10, 64), pos = [], bl = [], idx = [];
      const fr = rng.fork ? rng.fork('ring') : rng;
      // frost blades pointing outward, every fourth one long, every twelfth a long thin ray. From far off the blades
      // widen and lengthen and the halo bands swell (uDist), so the wreath never falls under about a twelfth of the
      // frame; they are back to their true size by the last 600 m. The 12 m opening itself never changes.
      for (let i = 0; i < 72; i++) {
        const ray = i % 12 === 6, long = i % 4 === 0;
        const a = (i / 72) * TAU + fr.range(-0.03, 0.03), L = fr.range(3.5, 7) * (long ? 1.75 : 1) * (ray ? 2.6 : 1), w = (0.05 + (long ? 0.02 : 0)) * (ray ? 0.6 : 1), o = pos.length / 3, z = fr.range(-1.5, 1.5);
        pos.push(Math.cos(a - w) * (R + 1.2), Math.sin(a - w) * (R + 1.2), 0, Math.cos(a + w) * (R + 1.2), Math.sin(a + w) * (R + 1.2), 0, Math.cos(a) * (R + 2 + L), Math.sin(a) * (R + 2 + L), z);
        bl.push(a, -w, R + 1.2, 0, a, w, R + 1.2, 0, a, 0, R + 2 + L, z);
        idx.push(o, o + 1, o + 2);
      }
      const spikes = new THREE.BufferGeometry(); spikes.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      spikes.setAttribute('aBl', new THREE.Float32BufferAttribute(bl, 4)); spikes.setIndex(idx);
      const ringFrag = `uniform vec3 uSun; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; varying vec3 vN; varying vec3 vP;
          float h(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          void main() { float s = abs(dot(vN, uSun)) * .6 + .34 + (h(floor(vP.xy * 1.2)) - .5) * .34;
            gl_FragColor = vec4(mix(mix(uA, uB, step(.42, s)), uC, step(.66, s)), 1.); }`;
      const ringUni = { uSun: G.uSun, uA: { value: C(H.ice, 0.8) }, uB: { value: C(H.snowLit, 0.98) }, uC: { value: C('#FFFFFF', 1.22) }, uDist: ringDist };
      const ringMat = new THREE.ShaderMaterial({ uniforms: ringUni,
        vertexShader: `varying vec3 vN; varying vec3 vP; void main() { vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: ringFrag, side: THREE.DoubleSide });
      const spikeMat = new THREE.ShaderMaterial({ uniforms: ringUni,
        vertexShader: `attribute vec4 aBl; uniform float uDist; varying vec3 vN; varying vec3 vP;
          void main() {
            float boost = 1. - smoothstep(1150., 1500., uDist);
            float kL = mix(1., max(1., uDist * .065 / 27.), boost), kW = mix(1., clamp(uDist / 170., 1., 5.), boost);
            float ang = aBl.x + aBl.y * kW, rad = ${R.toFixed(1)} + (aBl.z - ${R.toFixed(1)}) * kL;
            vec3 p = vec3(cos(ang) * rad, sin(ang) * rad, aBl.w);
            vN = normalize(mat3(modelMatrix) * vec3(.3 * cos(ang), .3 * sin(ang), 1.));
            vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
        fragmentShader: ringFrag, side: THREE.DoubleSide });
      // a painted glow: two flat bands of ice light round the wreath, torn like the sun's halo; stronger and wider from far off
      const glowMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: C(H.ice, 1).lerp(C('#FFFFFF'), 0.4) }, uTime: G.uTime, uDist: ringDist, uThru: { value: 0 } },
        vertexShader: `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform vec3 uCol; uniform float uTime; uniform float uDist; uniform float uThru; varying vec2 vP;
          float h(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
          void main() { float r0 = length(vP), a = atan(vP.y, abs(vP.x) < 1e-4 ? 1e-4 : vP.x);
            float boost = 1. - smoothstep(1150., 1500., uDist);          // from further off it is its true size: no second light in the antlers
            float kh = mix(1., max(1., uDist * .065 / 27.), boost), far = smoothstep(200., 620., uDist) * boost, r = r0 / kh;
            float tear = vn(vec2(a * 3.5, r * .08 + uTime * .05)) - .5;
            float g = (1. - step(27. + tear * 6., r)) * (.2 + .3 * far) + (1. - step(39. + tear * 11., r)) * (.1 + .1 * far);
            g *= mix(1., .55 * smoothstep(240., 430., uDist) * (1. - smoothstep(640., 760., uDist)), uThru);   // the far glare, see below
            gl_FragColor = vec4(uCol * g * step(12.5, r0), 1.); }`, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const frame = new THREE.Group(), glow = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), glowMat);
      glow.position.z = -1.5; glow.renderOrder = 3;
      const spikeMesh = new THREE.Mesh(spikes, spikeMat); spikeMesh.frustumCulled = false;
      // between about 700 and 250 m out (the run-in down the gate's axis) a tine can stand across the ring: a faint glare of the same two bands is laid
      // over whatever is in front (no depth test), so the destination is never lost; it is nothing outside that window
      const glareMat = glowMat.clone(); glareMat.uniforms.uTime = G.uTime; glareMat.uniforms.uDist = ringDist; glareMat.uniforms.uThru = { value: 1 }; glareMat.depthTest = false;
      const glare = new THREE.Mesh(glow.geometry, glareMat); glare.position.z = -1.5; glare.renderOrder = 6;
      frame.add(new THREE.Mesh(ringG, ringMat), spikeMesh, glow, glare);
      frame.position.copy(path.end);
      frame.lookAt(path.end.clone().add(endT));
      scene.add(frame);
    }

    // ---- per-frame
    const size = new THREE.Vector2(), prevClear = new THREE.Color(), camW = new THREE.Vector3();
    const drawMask = () => {
      const prevRT = renderer.getRenderTarget(), prevA = renderer.getClearAlpha(), prevAuto = renderer.autoClear;
      renderer.getClearColor(prevClear);
      hero.uniforms.uMask.value = 1;
      renderer.setRenderTarget(maskRT); renderer.setClearColor(0x000000, 0); renderer.autoClear = true;
      renderer.clear(); renderer.render(maskScene, maskCam);
      hero.uniforms.uMask.value = 0;
      renderer.setRenderTarget(prevRT); renderer.setClearColor(prevClear, prevA); renderer.autoClear = prevAuto;
    };
    // The mask scene is not reachable from `scene`, so the engine's warm-up never sees its programs: make them here,
    // against the mask target, so nothing is compiled in the frame the portal first opens.
    {
      const prevRT = renderer.getRenderTarget();
      renderer.setRenderTarget(maskRT);
      const ready = renderer.compileAsync ? renderer.compileAsync(maskScene, maskCam) : null;
      renderer.setRenderTarget(prevRT);
      await ctx.yield();
      if (ready) await ready;
      await ctx.yield();
    }
    let frame = 0;
    const flankGaze = new THREE.Vector3(), headGaze = new THREE.Vector3(350, 1000, 60), herdGaze = new THREE.Vector3();
    const titleGaze = new THREE.Vector3(), titleB = new THREE.Vector3(900, 1150, -60);
    const herdX = (u) => -1750 + (u - 0.15) * (u < 0.15 ? 2600 : 2400);
    const order = [0, 1, 2, 3];
    function update(dt, time, camera, uPath) {
      const u = uPath * KU, scroll = 1800 * u;
      G.uScroll.value = scroll; G.uTime.value = time;
      hero.craneClock = uPath * path.length - dGate;                // metres of rail past the gate: the flocks' clock
      hero.setProgress(u); hero.update(dt, time, camera);
      renderer.getDrawingBufferSize(size);
      const pk = camera.projectionMatrix.elements[5] * Math.max(size.y, 1);
      if (calf) {
        poseElk(calf.segs, calf.hoofs, (5 * u + PH0) / calf.K, time, 0);
        calf.cu.uPxK.value = 5 / Math.max(1e-3, pk);
      }
      // the shadow mask, from the hero's own shadow meshes
      if (Q >= 0.8 || frame % 2 === 0) drawMask();
      frame++;
      // sky follows the camera; twilight comes on while the camera is inside the shadow
      camW.setFromMatrixPosition(camera.matrixWorld);
      sky.position.copy(camW);
      skyU.uTwi.value = inShadow(camW) * (1 - smoothstep(70, 210, camW.y));
      ringDist.value = Math.min(6000, camW.distanceTo(path.end));
      // hoof prints one stride apart, and the snow shaken from the spruce round the two latest hoof-falls
      order.sort((a, b) => hero.hoof(a).cycle - hero.hoof(b).cycle);
      for (let i = 0; i < 4; i++) {
        const h = hero.hoof(i), xT = i % 2 === 0 ? -593 : 139;
        printU.value[i].set(xT + scroll - h.cycle * 360, -h.pos.x, 0, 1);
      }
      for (let k = 0; k < 2; k++) {
        const i = order[k], h = hero.hoof(i), c = h.cycle, xT = i % 2 === 0 ? -593 : 139;
        shakeU.value[k].set(xT - c * 360, -h.pos.x, smoothstep(0, 0.035, c) * (1 - smoothstep(0.34, 0.5, c)), 215);
      }
      herdU.value.set(herdX(u), time, 1, time);
      for (let i = 0; i < 2; i++) {
        const a = time * 0.42 + i * Math.PI, r = 30 + 6 * Math.sin(time * 0.3 + i);
        dummy.position.set(ravenC.x + Math.cos(a) * r, ravenC.y + Math.sin(a * 0.5 + i) * 7, ravenC.z + Math.sin(a) * r * 0.8);
        dummy.rotation.set(0, -a, -0.5, 'YXZ'); dummy.scale.setScalar(1.5);
        dummy.updateMatrix(); ravens.setMatrixAt(i, dummy.matrix);
      }
      ravens.instanceMatrix.needsUpdate = true;
      for (const m of flakeMats) { m.uniforms.uPx.value = pk * 0.5; m.uniforms.uScrollV.value = scroll; }
    }

    return {
      scene, path, duration: 50, title: 'The Elk Who Carries the Sun',
      camera: { fov: 62, near: 1.5, far: 14000, lookAhead: 45, sway: 0.2, bank: 0.6 },
      pois: [
        { at: [-420, 430, 0], from: 0.0, to: 0.13 / KU, weight: 0.3 },
        { at: (time, u) => herdGaze.set(herdX(u * KU) + 30, 0, 690), from: 0.11 / KU, to: 0.25 / KU, weight: 0.4 },
        { at: [-640, 60, 110], from: 0.3 / KU, to: 0.52 / KU, weight: 0.72 },
        { at: (time, u) => flankGaze.set(-150, 330, -60).lerp(headGaze, smoothstep(0.52, 0.76, u * KU)), from: 0.43 / KU, to: 0.56, weight: 0.6 },
        ...(rare ? [{ at: [CALF[0] + 40, 70, CALF[2] - 170], from: 0.385, to: 0.475, weight: 0.9, fade: 0.25 }] : []),   // the calf, whole, in the right half
        // the title image: head between the antlers, the sun left of centre, the ring in the right fork
        { at: (time, u) => titleGaze.set(420, 1130, 30).lerp(titleB, smoothstep(0.64, 0.76, u)), from: 0.46, to: 0.87, weight: 0.85, fade: 0.14 },
      ],
      portal: { shape: 'circle', radius: 12, tilt: true, color: '#DCE8FF', glow: 1, revealDistance: 1500 },
      post: { exposure: H.exposure, bloom: { strength: 0.35, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.05, contrast: 1.03, tint: '#ffffff', shadowTint: '#0b1033', vignette: 0.26, grain: 0.03, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() {
        maskScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        for (const d of disposables) d.dispose();
        hero.dispose();
      },
    };
  },
};
