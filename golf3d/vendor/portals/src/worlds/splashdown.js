// SPLASHDOWN: bolted to the shoulder of a returning capsule. Fire, silence, three parachutes, the sea.
//
// MAP OF THIS FILE (in order)
//   1. constants, keyframe helpers, the script's key tables (GAZE, MOUNT, ALT, AIR ...): every scripted
//      moment hangs off T = u * 40 (the brief's flight seconds).
//   2. MOODS (seeded hour: dawn / golden / noon / night) and WEATHER (streets / popcorn / stratocumulus):
//      sky colours, key light, haze, exposure, cloud layout. Cast (skin, canopy pattern, ship, birds) is
//      picked in build().
//   3. shaders: DOME (our own sky + the whole Earth seen from height, analytic, driven by uAlt / uAir /
//      uBand / uStars / uDrift; its cumulus deck is a noise field filled with round heaps, filtered by footprint),
//      VEIL (the cloud we fall through at 13.5 s and 26.3-27.4 s, and the wisps: three zooming sheets of lit and
//      shadowed billows with rents, never a blank frame; a BACK sheet 9 m out behind the capsule and thin FRONT wisps;
//      uA cover, uBias wipe, uStreak fibres), DECALS (one sheet 2 m above the real sea: the sheen and the
//      glitter road's glow uRoad, cloud shadows and the one dark patch over the portal, canopy shadows uCan, the dye
//      bloom uDye, the lacy foam ring, wakes uShip / uBoat, wash rings uHeli, weed and foam windrows), SPRAY (the crown
//      at touchdown: uT), STEAM (wisps off the wet lip in act four, screen space), ROTOR, BEAM (night only: the
//      ship's two searchlights crossing the cloth at 17-24 s, cones measured in rig space on a screen sheet).
//   4. small builders: ship, helicopter, boats (merged vertex-coloured boxes and lofts).
//   5. build(): variations -> path -> kit sky / light rig / fog -> hero -> dome, veil -> act-four sea,
//      decals, craft, clouds, birds, spray, steam, the portal's occluder -> post.
//   6. update(): T -> gaze e, roll, shake -> rig (dome) and hero placed at the camera -> uniforms -> act
//      four craft -> fog.
//
// HOW IT WORKS  The real path is a level line (27 s) that noses over into a 65 degree dive onto a portal
//   lying on the sea. Until the last cloud (u 0.67) nothing real is seen: a RIG (the dome with its analytic
//   Earth) is copied to the camera every frame and pitched by -e, e being the gaze angle above the apparent
//   horizon, and the hero capsule is posed in camera space on one of its two mounts (along the cone for
//   fire and cloth, outward over the heat-shield lip for silence and the sea). The swap to the real sea
//   (kit ocean + kit sky) hides in the cumulus at 26.74-26.94 s, the only time the BACK veil is closed (the capsule,
//   lit and moving, stays in front of it; before and after, sky and sea show through its rents). Until then a depth-only disc rides in
//   front of the exit portal (the engine puts it in this scene and the dome ignores depth), so its ring is not
//   seen over the Earth. The real sea has a light of its own: its key is turned each frame so the glitter road
//   runs through the ship (the sun is out of frame), and at night it gets a moonlit ambient.
//   ctx.vary: hour picks the mood, rare lags the third main, density thins weed, birds and clouds, mood sets
//   the swing of the ride and the amount of cirrus.
//   PATH: section 5 "path".  POIS: one, on the portal, in the return.  HERO PLACEMENT: update() "hero".
//   MOODS: MOODS / WEATHER tables.  EXPOSURE, BLOOM, GRADE: the return of build().  FOG: update() "fog".
//   Portal preview (u = 0, a camera whose near plane is the portal): the lens stands off the capsule's flank,
//   beyond that near plane, so the disc shows the whole fireball; it swoops onto the mount as the viewer arrives.
//   FLOCK CURE (10 Oct): both flocks hand the kit maxSigma 3 (no bird is dealt beyond three scatters); the escort also hands keepClear, and the kit shifts its course bodily, by place, until no body flies within 2.3 m of the flown line from its share 0.67 on (birds are drawn only from T_SWAP, share 0.67125), in a build step of its own.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/splashdown.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
// eased keyframes: ks = [[t, value], ...]
const key = (ks, t) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const a = ks[i - 1], b = ks[i], f = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * f * f * (3 - 2 * f); }
  return ks[ks.length - 1][1];
};
const pulse = (t, a, b, c, d) => smoothstep(a, b, t) * (1 - smoothstep(c, d, t));

// ---------------------------------------------------------------- the script (seconds of the 40 s take)
const GAZE = [[0, 25], [7, 25], [9, -32], [13.7, -32], [14.9, 58], [19.5, 58], [20.6, 22], [22.6, 22], [26.4, 3]];   // e: gaze above the apparent horizon (deg)
const MOUNT = [[7, 0], [9, 1], [13.7, 1], [14.9, 0], [26.5, 0], [27.0, 1]];                                         // 0 along the cone, 1 outward over the lip
const IMAGE = [[19.5, 0], [20.6, 0.55], [26.5, 0.55]];                                                                    // along -> the held image
const ALT = [[0, 75], [7, 50], [10, 30], [13.5, 11], [15, 6], [16.2, 2.6], [21, 2.0], [26, 1.3], [27.2, 1.15]];     // apparent altitude, km
const AIR = [[0, 0], [7, 0.05], [10, 0.34], [13.5, 0.52], [15, 0.6], [16.6, 0.72], [19, 0.9], [21, 1]];                       // 0 vacuum .. 1 inside the weather
const BAND = [[0, 0.028], [7, 0.034], [10, 0.05], [13.5, 0.09], [16.2, 0.15], [21, 0.17]];                          // thickness of the dawn stack (rad)
const STARS = [[0, 1], [8.5, 0.85], [13, 0.15], [15, 0]];
const CIRRUS = [[13.9, 0], [14.7, 1], [25.5, 1], [26.5, 0.6]];                                                             // the 11 km veil seen from below
const CLOUDY = [[21.5, -430], [22.6, -270], [23.6, -120], [24.6, -40], [25.6, 8], [27.3, 0]];                         // real cumulus field: y offset (it rises past us)
const T_SWAP = 26.85;                                                                                               // rig world -> real sea (inside the white-out)

// ---------------------------------------------------------------- seeded looks
// pal: hero palette [space black, violet, magenta, rose, gold, slate, orange]
const MOODS = {
  dawn: {
    preset: 'dawn', sunEl: 7, sky: { zenith: '#6578c8', mid: '#98a0dc', horizon: '#f6c2a4', scatterColor: '#ffc890', scatter: 0.75 },
    key: '#FFD9A0', keyI: 1.25, shine: ['#4A4F9A', 1.9], bounce: ['#F2A0A8', 0.32], sun: ['#ffc98e', 1.0], disc: 7,
    line: ['#ff6a1f', 1.9], gold: ['#F6C27A', 1.15], seam: ['#bfeecb', 0.8], blue: ['#4b6fe6', 0.8], slate: ['#34416f', 0.6], rose: ['#F2A0A8', 0.9],
    indigo: ['#1B1F5C', 1], powder: ['#7C8FD0', 1], sea: ['#27406B', 0.55], hazeS: ['#f6c6a0', 0.95], hazeA: ['#b3a3dc', 0.85],
    cloudL: ['#ffd0b0', 1.0], cloudS: ['#5a5fae', 0.62], shadow: '#232652', foam: ['#ffe9d6', 0.85], deep: '#476a80', scatter: '#8aa0a8', sheen: ['#F6B98A', 0.6], shAmt: 0.42,
    pal: ['#05060D', '#6B3FD0', '#E8409A', '#F2A0A8', '#F6C27A', '#27406B', '#FF6A1F'], exposure: 1.0, stars: 0, fog: 0.00042, veil: '#EDE6F5',
  },
  golden: {
    preset: 'goldenHour', sunEl: 9, sky: { zenith: '#6274b8', mid: '#ae98b4', horizon: '#f6b56a', scatterColor: '#ff8a30', scatter: 0.85 },
    key: '#FFB060', keyI: 1.35, shine: ['#4a4a92', 1.7], bounce: ['#e88a58', 0.34], sun: ['#ffa24e', 1.1], disc: 7,
    line: ['#ff4a12', 2.0], gold: ['#ffb24a', 1.25], seam: ['#f0d890', 0.7], blue: ['#3f5fd0', 0.75], slate: ['#3a3a66', 0.6], rose: ['#e8887a', 0.9],
    indigo: ['#1a1c56', 1], powder: ['#5f78c8', 1], sea: ['#6a3a1e', 0.6], hazeS: ['#f8ae62', 1.0], hazeA: ['#a08cc4', 0.8],
    cloudL: ['#ffb878', 1.05], cloudS: ['#55508f', 0.6], shadow: '#2a2046', foam: ['#ffd9b0', 0.85], deep: '#8a6238', scatter: '#d09a58', sheen: ['#ff9440', 0.62], shAmt: 0.42,
    pal: ['#05060D', '#6B3FD0', '#E8409A', '#F2A0A8', '#F6B060', '#27406B', '#FF4212'], exposure: 1.0, stars: 0, fog: 0.00042, veil: '#F3DCC8',
  },
  noon: {
    preset: 'day', sunEl: 34, sky: { zenith: '#1f55c0', mid: '#5b93e0', horizon: '#bfe0f6', scatter: 0.25 },
    key: '#fff4e0', keyI: 1.45, shine: ['#3f62c4', 1.9], bounce: ['#9fc8f0', 0.3], sun: ['#fff1d6', 1.0], disc: 6,
    line: ['#bfe6ff', 1.6], gold: ['#d8ecff', 1.1], seam: ['#a8d8ff', 0.9], blue: ['#2f62e0', 0.85], slate: ['#5d8fd6', 0.8], rose: ['#bcd8f6', 0.9],
    indigo: ['#15226e', 1], powder: ['#3f78d8', 1], sea: ['#0f3fa0', 0.6], hazeS: ['#c8e2f8', 0.95], hazeA: ['#a8c4ee', 0.9],
    cloudL: ['#ffffff', 0.95], cloudS: ['#6f8fc8', 0.7], shadow: '#081c50', foam: ['#ffffff', 0.9], deep: '#0a3f9a', scatter: '#2fb8c8', sheen: ['#dcebff', 0.34], shAmt: 0.55,
    pal: ['#05060D', '#6B3FD0', '#E8409A', '#F2A0A8', '#F6C27A', '#27406B', '#FF6A1F'], exposure: 0.95, stars: 0, fog: 0.00034, veil: '#EEF3FA',
  },
  night: {
    preset: 'night', sunEl: 30, sky: { horizon: '#2c4678', mid: '#12224a' },
    key: '#c4d4ff', keyI: 0.95, shine: ['#2a3a8a', 1.5], bounce: ['#3a4a90', 0.3], sun: ['#cfdcff', 0.5], disc: 3,
    line: ['#5f7fe0', 0.55], gold: ['#3f5fc0', 0.45], seam: ['#4f7fd0', 0.4], blue: ['#1c2f86', 0.5], slate: ['#141e50', 0.5], rose: ['#2c3a86', 0.5],
    indigo: ['#0a0f38', 1], powder: ['#101a52', 1], sea: ['#0a1640', 0.7], hazeS: ['#3a4f9a', 0.6], hazeA: ['#1c2a66', 0.6],
    cloudL: ['#9fb4ee', 0.6], cloudS: ['#1e2a66', 0.6], shadow: '#0a0e30', foam: ['#c8d4f6', 0.7], deep: '#4b5a78', scatter: '#8f9ab4', sheen: ['#ccd4ee', 0.4], shAmt: 0.34,
    seaAmb: [0.34, 0.32, 0.3], seaSun: ['#e6e8f4', 1.5],
    pal: ['#05060D', '#6B3FD0', '#E8409A', '#F2A0A8', '#F6C27A', '#27406B', '#FF6A1F'], exposure: 1.25, stars: 0.75, fog: 0.00036, veil: '#8f9fd8',
  },
};
const WEATHER = {
  // street 0..1: how far the field is drawn into rows; cell scales the field (bigger = smaller clumps); cov: lower = more cloud;
  // heap: size of one cumulus top (km); gap: share of empty heap cells; fill: how far the heaps merge into a sheet;
  // shadow: threshold of the real sea's far cloud shadows
  streets: { street: 1, cell: 1, cov: 0.47, heap: 1.3, gap: 0.1, fill: 0, clouds: 1, shadow: 0.6 },
  popcorn: { street: 0, cell: 1.2, cov: 0.4, heap: 2.0, gap: 0.12, fill: 0, clouds: 0.8, shadow: 0.63 },
  strato: { street: 0.3, cell: 0.62, cov: 0.43, heap: 1.5, gap: 0.04, fill: 0.45, clouds: 1.3, shadow: 0.57 },
};

// ---------------------------------------------------------------- shaders
const GLSL_NZ = /* glsl */`
  uniform sampler2D uNoise;
  vec4 nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return texture2D(uNoise, (i + f + .5) / 256.); }
  vec4 nzl(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return textureLod(uNoise, (i + f + .5) / 256., 0.); }
`;

const DOME_VERT = /* glsl */`
  varying vec3 vDir;
  void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = vec4(p.xy, p.w * .99995, p.w); }
`;
const DOME_FRAG = fx.GLSL_HASH + GLSL_NZ + /* glsl */`
  uniform float uAlt, uAir, uBand, uStars, uTime, uPix, uCov, uStreet, uCell, uShLen, uDisc, uSpin, uCir, uGap, uFill, uHeap;
  uniform vec2 uDrift, uWind, uSunAz;
  uniform vec3 uSun, uSunCol, uLine, uGold, uSeam, uBlue, uSlate, uRose, uIndigo, uPowder, uSea, uHazeS, uHazeA, uCloudL, uCloudS;
  varying vec3 vDir;
  const float R = 3200.;

  vec3 bandCol(float x, float ws){
    vec3 c = mix(uBlue, uSeam, (smoothstep(.7, .95, x) - smoothstep(.95, 1.25, x)) * mix(.75, .3, uAir));
    c = mix(c, uGold, 1. - smoothstep(.2, .9, x));
    c = mix(c, uLine, (1. - smoothstep(.02, .22, x)) * mix(1., .3, uAir));
    vec3 a = mix(uBlue * .75, uRose, 1. - smoothstep(.9, 1.9, x));
    a = mix(a, uSlate, 1. - smoothstep(.3, .75, x));
    return mix(a, c, ws);
  }
  vec3 skyCol(float delta, float ws, float up){
    float x = delta / uBand;
    vec3 zen = mix(mix(vec3(.003, .004, .01), uIndigo, smoothstep(0., .5, uAir)), uPowder, smoothstep(.45, 1., uAir));
    zen *= 1. - .35 * up * uAir;
    return mix(zen, bandCol(x, ws), 1. - smoothstep(1.2, 3.4, x));
  }
  // ---- the cumulus deck seen from height. A noise field (clumps, streets, mesoscale holes) says where cloud stands; inside it
  //      round heaps in jittered cells (two sizes, rims torn by noise) are the cumulus tops. Every lookup is at lod 0 and each
  //      term fades to its mean as its cells shrink toward a pixel (foot = kilometres under one pixel), so nothing speckles.
  float fadeF(float x){ return 1. - smoothstep(.22, .65, x); }
  float fieldN(vec2 p, float foot){
    vec2 q = vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x)));
    float big = nzl(p * .017 + 7.).g, meso = nzl(p * .075 + 3.).b;
    vec2 w = (nzl(q * .23 + 17.).rg - .5) * 2.4, qa = (q + w) * uCell;      // warped, and two turned lattices, so no cloud is a brick
    float n = (nzl(mat2(.87, .5, -.5, .87) * qa * vec2(.42, .6)).r + nzl(mat2(.87, -.5, .5, .87) * qa * vec2(.47, .66) + 7.3).a) * .5;
    n = mix(.5, n, fadeF(foot * .6 * uCell));
    float rows = nzl(vec2(q.x * .045, q.y * .46)).a;
    float st = mix(.5 + .5 * cos(q.y * 2.618 + (nzl(q * .09).a - .5) * 7.), smoothstep(.3, .7, rows), .55);
    n *= mix(1., .45 + .95 * mix(.55, st, fadeF(foot * .45)), uStreet);
    return n + (big - .5) * .42 + (meso - .5) * .2;
  }
  vec4 cellHash(vec2 c){ return textureLod(uNoise, (c + .5) / 256., 0.); }
  // x: height, 1 at the crown, 0 at the rim; yz: where we are in the heap (rim = length 1)
  vec3 heap(vec2 b, vec2 o, vec2 f){
    vec4 r = cellHash(b + o);
    vec2 e = (f - o - .5 - (r.xy - .5) * .5) / (.5 * (.55 + .45 * r.z));
    return vec3(mix(-1., 1. - dot(e, e), step(uGap, r.w)), e);
  }
  vec3 best(vec3 a, vec3 b){ return a.x > b.x ? a : b; }
  vec3 heaps(vec2 g){
    vec2 b = floor(g - .5), f = g - b;
    return best(best(heap(b, vec2(0.), f), heap(b, vec2(1., 0.), f)), best(heap(b, vec2(0., 1.), f), heap(b, vec2(1.), f)));
  }
  // returns (cover, lit flank about -1..1)
  vec2 cover(vec2 p, float foot){
    float M = smoothstep(uCov - .15, uCov + .2, fieldN(p, foot)), fc = foot * uHeap;
    vec2 q = vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x)));
    float k2 = fadeF(foot * 2.6), k3 = fadeF(foot * 7.), k4 = fadeF(foot * 21.);
    vec2 wv = nzl(q * .9 + 13.).gb - .5;
    float wob = wv.x * .5 + (nzl(mat2(.6, .8, -.8, .6) * q * 2.6 + 31.).b - .5) * .32 * k2 + (nzl(mat2(.8, -.6, .6, .8) * q * 7. + 9.).a - .5) * .16 * k3;
    vec4 fn = nzl(mat2(.6, -.8, .8, .6) * q * 21. + 3.);
    float soft = 1. - smoothstep(1.25, 1.62, uAlt);      // sinking onto the tops: heaps melt into rounded swells of mist, no rims
    float lump = ((fn.r - .5) * .6 + (nzl(q * 57. + fn.gb * 2.).g - .5) * .4 * fadeF(foot * 57.)) * k4 * (1. - soft);      // seen from close above: cauliflower, not dunes
    wob += lump * .3;
    vec2 g = (q + wv.yx * .7) * uHeap;
    vec3 h = heaps(g), h2 = heaps(g * 2.3 + 31.7); h2.x = mix(h2.x * .8 - .1, -1., soft); h = best(h, h2);
    float v = max(h.x, -.25) * (.35 + .4 * M) + wob + (M - .62) * 1.1 + uFill * M * .5;      // a clump's core is solid, its rim breaks into heaps
    float w = clamp(fc * .7, 0., .3) + mix(.17, .2, smoothstep(.01, .08, fc)) + .3 * soft, far = smoothstep(.22, .6, fc);
    vec2 sQ = vec2(dot(uSunAz, uWind), dot(uSunAz, vec2(-uWind.y, uWind.x))), e = h.yz / max(1., length(h.yz));
    return vec2(mix(smoothstep(.35 - w, .35 + w, v), smoothstep(.45, 1., M) * .8 + .2 * uFill * M, far), (dot(e, sQ) * .55 * (1. - .6 * soft) + wob * 1.1 + lump * .8) * (1. - far));
  }
  float coverLo(vec2 p, float foot){ return smoothstep(uCov - .05, uCov + .25, fieldN(p, foot)); }
  float starField(vec3 d){
    float c = cos(uSpin), s = sin(uSpin); d = vec3(d.x * c - d.y * s, d.x * s + d.y * c, d.z);
    vec3 p = d * 42., i = floor(p), f = fract(p) - .5, h = hash33(i);
    float rad = max(.07, uPix * 55.);
    float r = length(f - (h - .5) * .56);
    return step(.83, h.z) * (1. - smoothstep(rad * .55, rad, r)) * (.5 + 2.2 * h.y * h.y);
  }
  void main(){
    vec3 d = normalize(vDir);
    float h = uAlt, Rh = R + h, b = Rh * d.y, c = 2. * R * h + h * h, disc = b * b - c;
    float sinDip = sqrt(c) / Rh;
    float delta = asin(clamp(d.y, -1., 1.)) + asin(clamp(sinDip, 0., 1.));
    float cosAz = dot(normalize(d.xz + vec2(1e-5, 0.)), uSunAz), ws = smoothstep(-.15, .9, cosAz);
    float sd = max(dot(d, uSun), 0.);
    vec3 col;
    if (disc > 0. && b < 0.) {
      float t = -b - sqrt(disc);
      vec3 P = vec3(0., Rh, 0.) + d * t, n = P / R;
      float mu = max(dot(-d, n), 0.);
      vec2 ps = P.xz + uDrift;
      // cloud layer, tops 0.9 km over the sea
      float c2 = (h - .9) * (2. * R + h + .9), t2 = -b - sqrt(max(b * b - c2, 0.));
      vec2 pc = (vec3(0., Rh, 0.) + d * t2).xz + uDrift;
      float foot = t2 * uPix * mix(1., 1. / max(mu, .06), .8);
      vec2 cvf = cover(pc, foot); float cv = cvf.x, flank = cvf.y;
      float sh = max(coverLo(ps + uSunAz * uShLen * .2, foot), max(coverLo(ps + uSunAz * uShLen * .55, foot) * .85, coverLo(ps + uSunAz * uShLen, foot) * .6));
      // the sea: deep body, the dawn band mirrored by a rough surface, the glitter road, wind streaks
      vec3 r = reflect(d, n);
      float fr = mix(.1, 1., pow(max(1. - mu, 0.), 3.));
      vec3 refl = skyCol(asin(clamp(dot(r, n), 0., 1.)) * .5, ws, 0.);
      vec2 q = vec2(dot(ps, uWind), dot(ps, vec2(-uWind.y, uWind.x)));
      float streak = (nzl(vec2(q.x * .7, q.y * 8.)).b - .5) * (1. - smoothstep(.2, .6, foot * 8.)), swell = (nzl(ps * 5.3 + uTime * .05).r - .5) * (1. - smoothstep(.2, .6, foot * 5.3));
      vec3 sea = uSea * mix(.55, 1., ws) * (1. + (streak * .5 + swell * .35) * uAir) + refl * fr * .9;
      float sr = max(dot(r, uSun), 0.), g = pow(sr, 70.) * 2.4 + pow(sr, 9.) * .5;
      float sp = mix(1., nzl(ps * 17. + uTime * vec2(.5, .2)).r * nzl(ps * 29. - uTime * vec2(.2, .45)).g * 4., 1. - smoothstep(.15, .5, foot * 17.));
      g *= mix(1., sp, .75 * uAir * smoothstep(1.2, 1.7, h));
      sea = mix(sea, sea * .3 + uSlate * .05, sh * .9) + uSunCol * g * (1. - sh);
      vec3 cl = mix(uCloudS, uCloudL, clamp(.42 + flank * .9 + (ws - .5) * .3, 0., 1.)) * (.8 + .32 * cv);
      vec3 surf = mix(sea, cl, cv * .96);
      float tau = .013 * min(t, min(h, 9.) / max(mu, .02)) * (1. + 1.3 * (1. - smoothstep(.05, .4, mu))), hz = 1. - exp(-tau);   // haze takes the deck before the limb
      vec3 haze = mix(mix(uHazeA, uHazeS, ws), skyCol(0., ws, 0.), smoothstep(.55, 1., hz));
      hz = max(hz, .57 * (1. - smoothstep(.3, .7, h - .9)));      // sinking toward the cloud tops: their mist takes the deck
      col = mix(surf, haze, hz);
    } else {
      col = skyCol(max(delta, 0.), ws, max(d.y, 0.));
      col += starField(d) * uStars * vec3(.9, .95, 1.1) * smoothstep(.9, 3.2, delta / uBand);
      if (uCir > .001 && d.y > .01) {
        vec2 cp = d.xz * (max(11. - h, 1.5) / (d.y + .07)) + uDrift * .15, cq = vec2(dot(cp, uWind), dot(cp, vec2(-uWind.y, uWind.x))) + vec2(uTime * .22, 0.);
        float ci = nz(vec2(cq.x * .06, cq.y * .22)).r * .55 + nz(vec2(cq.x * .19, cq.y * .6) + 5.).g * .3 + nz(cq * 1.3).b * .15;
        ci = smoothstep(.5, .86, ci * (.55 + .9 * nz(cq * .05 + 9.).b)) * smoothstep(.02, .2, d.y) * uCir;
        col = mix(col, mix(uCloudS * 1.25, uCloudL * 1.12, clamp(ws * 1.1 + ci * .25, 0., 1.)), ci * .4);
      }
    }
    col += uSunCol * (pow(sd, 6.) * .22 * uAir + pow(sd, mix(1400., 160., uAir)) * mix(2.2, .9, uAir) + smoothstep(.99988, .99996, sd) * uDisc);
    gl_FragColor = vec4(col, 1.);
  }
`;

// cloud we fall through (the cirrus sheet at 13.5 s, the cumulus at 26.3-27.4 s, the wisps): never a blank frame. Three sheets of
// billows zoom toward the lens and cross-fade (far ones small and dim, near ones big and bright), each shaded lit / shadowed by
// its own slope toward the sun and torn by rents that show the sheet behind it, and through all three the sky or the sea.
// Two meshes share the shader: BACK stands 9 m out and is depth tested, so the capsule stays in front of it; FRONT is thin
// wisps over everything. Only at uA = 1 (0.2 s, where the rig world is swapped for the real sea) is BACK closed by uDeep.
const VEIL_VERT = /* glsl */`
  uniform float uDepth; varying vec2 vUv;
  void main(){ vUv = position.xy; vec4 c = projectionMatrix * vec4(0., 0., -uDepth, 1.); gl_Position = vec4(position.xy, uDepth > 0. ? clamp(c.z / max(c.w, 1e-4), -1., .9999) : 0., 1.); }`;
const VEIL_FRAG = GLSL_NZ + /* glsl */`
  uniform float uA, uTime, uStreak, uBias, uGain, uSpeed; uniform vec2 uLight; uniform vec3 uCol, uCol2, uDeep; varying vec2 vUv;
  vec4 sheet(vec4 acc, vec2 p, float k, float f, float n, float cov){
    float ph = (k + f) / 3., z = exp2(mix(1.5, -1.9, ph));
    vec2 q = p * z * mix(vec2(1.), vec2(.26, 2.4), uStreak) + mod((n - k) * vec2(17.31, 9.73), 256.);
    vec2 ql = q + uLight * .2;
    float d = nzl(q).r * .58 + nzl(q * 2.7 + 11.3).g * .3 + nzl(q * 6.3 + 4.7).b * .12;
    float d2 = nzl(ql).r * .58 + nzl(ql * 2.7 + 11.3).g * .3 + .085;
    float w = smoothstep(0., .22, ph) * (1. - smoothstep(.78, 1., ph));
    float th = mix(.8, mix(.1, .5, ph), cov);                        // the nearest sheet always keeps its rents
    float a = smoothstep(th, th + .17, d) * w * uGain;
    float lit = smoothstep(-.09, .12, d - d2), thin = smoothstep(th, th + .1, d) * (1. - smoothstep(th + .1, th + .36, d));
    vec3 c = mix(uCol2, uCol, lit) * (1. + .25 * thin * lit) * (.9 + .22 * dot(uLight, vUv));      // sun through a billow's thin edge; the key side of the frame
    c = mix(uDeep, c, .3 + .7 * ph);
    acc.rgb += (1. - acc.a) * a * c; acc.a += (1. - acc.a) * a;
    return acc;
  }
  void main(){
    vec2 p = vUv * vec2(1.78, 1.) + vec2(.2, .35);
    float tt = uTime * uSpeed, f = fract(tt), n = floor(tt);
    float cov = clamp(uA + uBias * vUv.y, 0., 1.);
    vec4 acc = sheet(vec4(0.), p, 2., f, n, cov);
    acc = sheet(acc, p, 1., f, n, cov);
    acc = sheet(acc, p, 0., f, n, cov);
    float fill = smoothstep(.86, 1., uA) * step(.99, uGain);
    vec3 deep = uDeep * (.7 + .4 * nzl(p * 1.1 + vec2(uTime * .3, -uTime * .5)).a + .3 * nzl(p * 3.3 + vec2(-uTime * .4, uTime * .9)).r) + uCol * .2 * max(dot(uLight, vUv) + .25, 0.);
    acc.rgb += (1. - acc.a) * fill * deep; acc.a += (1. - acc.a) * fill;
    gl_FragColor = acc;
  }
`;

// everything that lies on the real sea, one sheet just above the crests
const DECAL_VERT = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DECAL_FRAG = GLSL_NZ + /* glsl */`
  uniform float uTime, uDye, uCanA, uWeed, uShAmt, uPix, uShCov;
  uniform vec2 uPortal, uSunAz, uWind, uCan[3], uRoad;
  uniform vec4 uShip, uBoat[4];
  uniform vec3 uHeli[2], uShadowCol, uFoamCol, uWeedCol, uDyeCol, uSheenCol, fogColor;
  uniform float fogDensity;
  varying vec3 vW;
  void over(inout vec4 acc, vec3 c, float a){ acc = acc * (1. - a) + vec4(c * a, a); }
  void main(){
    vec2 p = vW.xz; vec3 toCam = cameraPosition - vW; float dist = length(toCam);
    float px = dist * uPix / max(abs(toCam.y) / max(dist, 1e-3), .06);
    vec4 acc = vec4(0.);
    vec2 q = vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x)));
    // noise used below (never fetched inside a loop)
    float nA = nz(vec2(q.x * .03 - uTime * .12, q.y * .22)).r, nB = nz(p * .31 + uTime * .05).g, nC = nz(p * .06 + uTime * .012).b;
    // ---- cloud shadows, long along the sun's azimuth: faint ones far off, and the one dark patch that lies over the portal
    vec2 H = uShip.zw, rs = p - uShip.xy;
    vec2 sq = vec2(dot(p, uSunAz), dot(p, vec2(-uSunAz.y, uSunAz.x)));
    float cs = smoothstep(uShCov, uShCov + .12, nz(sq * vec2(.0008, .0031) + vec2(uTime * .003, 2.)).r * .7 + nz(sq * vec2(.0027, .0098)).g * .3);
    cs *= smoothstep(170., 340., length(rs));
    vec2 pr = p - uPortal, pq = vec2(dot(pr, uSunAz) + 55., dot(pr, vec2(-uSunAz.y, uSunAz.x)));
    float own = 1. - smoothstep(.4, 1.05, length(pq / vec2(205., 82.)) + (nC - .5) * .25);
    // ---- the sheen: the sky's bright band mirrored by the far and sunward sea, in ruffled lanes, and the glitter road's glow
    vec2 hd = -toCam.xz / max(length(toCam.xz), 1e-3);
    float graze = clamp(1. - abs(toCam.y) / max(dist, 1e-3), 0., 1.), azR = dot(hd, uRoad), azS = max(dot(hd, uSunAz), azR);
    float qy = q.y + (nC - .5) * 14.;
    float rip = nz(vec2(q.x * .0034 - uTime * .012, qy * .07)).g * .55 + nz(vec2(q.x * .0083 + 5. + uTime * .016, qy * .19)).r * .45;
    float sheen = pow(graze, 2.2) * smoothstep(-.05, .95, azS) * (.3 + .9 * smoothstep(.28, .8, rip));
    float road = pow(max(azR, 0.), 22.) * pow(graze, .9) * (.45 + 1.1 * rip);
    float lit = (1. - .88 * own) * (1. - .45 * cs);
    acc = vec4(uSheenCol * (sheen * .85 + road * .5) * lit, min(sheen * .3, .3) * lit);
    // ---- windrows: lanes parallel to the wind, some weed (2-4 m), some foam (thin)
    float warp = (nz(vec2(q.x * .006, q.y * .013)).a - .5) * 2.4 + (nz(vec2(q.x * .021, q.y * .05)).r - .5) * .5;
    float lane = q.y / 27. + warp, id = floor(lane);
    vec4 hsh = texture2D(uNoise, (vec2(id, 3.) + .5) / 256.);
    float dl = abs(fract(lane) - .5) * 27.;
    float ptc = smoothstep(.47, .66, nz(vec2(q.x * .0024 + id * .13, q.y * .004)).g);
    float gaps = smoothstep(.25, .6, nz(vec2(q.x * .014 + id * 7.3, id * .37)).r) * ptc;
    float isWeed = step(.5, hsh.r);
    float w = mix(.35 + .6 * hsh.g, 1.4 + 1.8 * hsh.g, isWeed) * (.5 + 1.1 * nz(vec2(q.x * .05, id)).g);
    float band = (1. - smoothstep(max(w - px, 0.) * .4, w + px, dl)) * min(1., 1.6 * w / max(px, 1e-3)) * gaps * smoothstep(28., 80., length(p - uPortal));
    float clump = smoothstep(.42, .7, nz(vec2(q.x * .07, q.y * .5)).b + .1) * (.5 + .5 * smoothstep(.3, .6, nz(q * vec2(.5, 1.7)).r));
    over(acc, uWeedCol * (.5 + 1.0 * nB), band * isWeed * clump * .8 * uWeed);
    float foam = band * (1. - isWeed) * smoothstep(.35, .7, nA) * .2;
    // ---- the ship's wake and bow wave
    float al = dot(rs, H), ac = dot(rs, vec2(-H.y, H.x));
    float s1 = -(al + 68.), w1 = 10. + max(s1, 0.) * .1;
    foam += step(0., s1) * (1. - smoothstep(w1 * .55, w1, abs(ac))) * exp(-max(s1, 0.) / 105.) * (.3 + .7 * nB) * .8;
    float s2 = -(al - 66.), arm = abs(abs(ac) - (5. + max(s2, 0.) * .34));
    foam += step(0., s2) * (1. - smoothstep(1., 2.5 + s2 * .03 + px, arm)) * exp(-max(s2, 0.) / 60.) * (.4 + .6 * nA) * .8;
    foam += (1. - smoothstep(9., 16., length(vec2(ac, (al - 70.) * .55)))) * .6 * nB;
    // ---- four boats on arcs: turbulent trail and the two arms
    for (int i = 0; i < 4; i++) {
      vec4 B = uBoat[i]; float dir = sign(B.z), r = abs(B.z);
      vec2 rel = p - B.xy; float rr = length(rel), ang = atan(rel.y, rel.x + 1e-4);
      float s = mod((B.w - ang) * dir, 6.2831853) * r, wk = .9 + s * .075, dd = abs(rr - r);
      float trail = (1. - smoothstep(wk * .45, wk + px, dd)) * exp(-s / 75.);
      float arms = (1. - smoothstep(.5, 1.3 + px, abs(dd - wk * 1.7))) * exp(-s / 45.) * .7;
      foam += (trail * (.45 + .55 * nB) + arms) * step(s, r * 4.);
    }
    // ---- rotor wash: a ragged ring of flattened, streaked water
    for (int i = 0; i < 2; i++) {
      vec2 rel = p - uHeli[i].xy; float rr = length(rel); vec2 rd = rel / max(rr, 1e-3);      // (the direction, not its angle: no seam)
      float sn = nzl(rd * 4.6 + (rr * .16 - uTime * 1.6) * .71).r, sm = nzl(rd * 1.4 + vec2(9., uTime * .2)).g;
      float edge = 17. + (sm - .5) * 9.;
      foam += (smoothstep(edge - 9., edge, rr) - smoothstep(edge + 1., edge + 9., rr)) * smoothstep(.3, .75, sn) * uHeli[i].z * .55;
    }
    over(acc, uFoamCol, clamp(foam, 0., 1.) * .88);
    over(acc, uShadowCol, max(cs * .4, own) * uShAmt);
    // ---- our three canopies' shadows
    float can = 0.;
    for (int i = 0; i < 3; i++) can = max(can, 1. - smoothstep(12., 19., length(p - uCan[i])));
    over(acc, uShadowCol * .8, can * uCanA * .46);
    // ---- the dye: a fluorescein bloom that drifts downwind, its edge feathered by warped noise and combed by the swell
    vec2 sl = vec2(dot(pr, uWind), dot(pr, vec2(-uWind.y, uWind.x)));
    vec2 wp = vec2(nz(pr * .043 + vec2(4., uTime * .011)).r, nz(pr * .043 + vec2(31.7, -uTime * .009)).g) - .5;
    float cl = nz(pr * .1 + wp * 2.6 + 9.).b * .6 + nz(pr * .26 + wp * 3.4 + uTime * .02).r * .4;
    float R1 = 19. + 9. * uDye, dr = length(vec2((sl.x - 9. * uDye) * .56, sl.y)) + (cl - .5) * 13. + (nC - .5) * 7.;
    float bloom = 1. - smoothstep(0., R1 * 1.45, dr); bloom *= bloom;
    float comb = nz(vec2(q.x * .21 - uTime * .35, q.y * .05)).g;
    float slick = bloom * (.5 + .5 * smoothstep(.2, .8, cl + (nB - .5) * .3)) * mix(.62 + .76 * comb, 1., smoothstep(.2, .75, bloom));
    over(acc, mix(uDyeCol * .55, uDyeCol * vec3(1.25, 1.02, .8) + vec3(.1, .08, 0.), smoothstep(.15, .9, slick)), clamp(slick * .74, 0., .64));
    // ---- the foam ring: a ragged, broken band of thick foam marbled with open water, and lace feathering off both sides
    float rl = length(pr * vec2(1., 1.08)); vec2 rdv = pr / max(length(pr), 1e-3);
    float rn = nz(rdv * 2.6 + vec2(uTime * .25, 5.)).r, rn2 = nz(rdv * 7.7 + vec2(3., -uTime * .16)).g;
    float rc = 9.9 + (rn - .5) * 3.4 + (rn2 - .5) * 1.7 + .45 * sin(uTime * 1.3), bw = .55 + 2.1 * rn * rn + .7 * rn2;
    float dc = abs(rl - rc), core = 1. - smoothstep(bw * .3, bw + px, dc), fea = 1. - smoothstep(bw * .6, bw * 3.2 + 1.2 + px, dc);
    vec2 fp = pr + rdv * (uTime * .22);
    float aa = 1. - smoothstep(.25, .8, px * 2.4);
    float blob = nz(fp * 1.3 + uTime * .1).r * .6 + nz(fp * 3.7 - uTime * .07).g * .4;
    float vein = 1. - abs(nz(fp * 2.4 + 7. + (blob - .5) * 1.2).b * 2. - 1.), vein2 = 1. - abs(nz(fp * .9 + 21.).a * 2. - 1.);
    float thick = core * mix(.75, smoothstep(.36, .56, blob + core * .22) * (1. - .55 * smoothstep(.86, .97, vein)), aa);
    float lace = fea * (1. - core) * mix(.25, smoothstep(.74, .93, vein) * .85 + smoothstep(.8, .96, vein2) * .6, aa) * smoothstep(.3, .6, blob + fea * .25);
    float ringA = clamp(thick + lace, 0., 1.);
    over(acc, mix(uFoamCol, vec3(.96, .98, 1.), .45) * mix(.8, 1.04 + .34 * thick, aa), ringA * mix(.8, .96, aa));
    float ff = 1. - exp(-fogDensity * fogDensity * dist * dist);
    acc.rgb = mix(acc.rgb, fogColor * acc.a, ff);
    gl_FragColor = acc * (1. - smoothstep(1300., 1900., dist));
  }
`;

// the low crown of spray that leaps along the bottom edge at touchdown (screen space)
const SPRAY_VERT = /* glsl */`
  attribute vec4 aSeed; uniform float uT, uAspect; varying vec2 vUv; varying float vA;
  void main(){
    float tau = max(uT - aSeed.y * .35, 0.), life = .55 + aSeed.z * .5, k = clamp(tau / life, 0., 1.);
    float y = -1.08 + (1.5 + aSeed.w * 1.4) * tau - 2.6 * tau * tau;
    float x = aSeed.x * 1.15 + (aSeed.w - .5) * .25 * tau;
    float s = (.07 + .13 * aSeed.z) * (.5 + 1.6 * k);
    vUv = position.xy; vA = step(1e-4, tau) * (1. - k) * (1. - k);
    gl_Position = vec4(x + position.x * s / uAspect, y + position.y * s, 0., 1.);
  }`;
const SPRAY_FRAG = /* glsl */`
  uniform vec3 uCol; varying vec2 vUv; varying float vA;
  void main(){ float r = length(vUv), a = (1. - smoothstep(.25, 1., r)) * vA * .5; gl_FragColor = vec4(uCol * a, a); }`;

// steam curling off the wet lip in act four (screen space: the lip's upper edge is an arc along the bottom of the frame)
const STEAM_VERT = /* glsl */`
  attribute vec4 aSeed; uniform float uTime, uAspect, uA; varying vec2 vUv; varying vec3 vS; varying float vA;
  void main(){
    float life = fract(uTime * (.13 + .09 * aSeed.y) + aSeed.z * 7.), xh = (aSeed.x * 2. - 1.) * 1.6, xe = xh / 1.7;
    float y0 = -.75 - .33 * xe * xe;
    float x = xh + life * life * (.22 + .3 * aSeed.y) + .035 * sin(life * 7. + aSeed.z * 40.);
    float y = y0 + life * (.13 + .17 * aSeed.w);
    float sz = (.06 + .09 * aSeed.w) * (.55 + 1.7 * life);
    vUv = position.xy; vS = vec3(aSeed.z * 23., life, aSeed.w);
    vA = smoothstep(0., .18, life) * (1. - life) * (1. - life) * uA;
    gl_Position = vec4((x + position.x * sz * 1.5) / uAspect, y + position.y * sz, 0., 1.);
  }`;
const STEAM_FRAG = GLSL_NZ + /* glsl */`
  uniform vec3 uCol, uCol2; varying vec2 vUv; varying vec3 vS; varying float vA;
  void main(){
    float r = length(vUv);
    vec2 q = vUv * vec2(1.5, 1.) + vec2(vS.x, vS.x * .37 - vS.y * 1.4);
    float n = nz(q * 1.7).r * .6 + nz(q * 4.3 + 3.).g * .4;
    float a = (1. - smoothstep(.1, 1., r)) * smoothstep(.34, .72, n + .3 * (1. - r)) * vA;
    gl_FragColor = vec4(mix(uCol, uCol2, smoothstep(-.6, .7, vUv.x + (n - .5))) * a, a);
  }`;

// a turning rotor seen as a smeared disc
const ROTOR_FRAG = /* glsl */`
  uniform float uTime; uniform vec3 fogColor; uniform float fogDensity; varying vec3 vL; varying float vD;
  void main(){
    float r = length(vL.xz), ang = atan(vL.z, vL.x + 1e-4);
    float bl = pow(abs(cos(ang * 2. + uTime * 23.)), 10.);
    float a = (.1 + .34 * bl) * (1. - smoothstep(.93, 1., r)) * smoothstep(.04, .1, r);
    vec3 c = mix(vec3(.05, .055, .07), fogColor, 1. - exp(-fogDensity * fogDensity * vD * vD));
    gl_FragColor = vec4(c * a, a);
  }`;
const ROTOR_VERT = /* glsl */`varying vec3 vL; varying float vD; void main(){ vL = position; vec4 mv = modelViewMatrix * vec4(position, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;

// night only: the ship's two searchlights, pale cones of lit haze that come up from the lower left and cross the cloth.
// A screen sheet 9 m out (behind the capsule): each pixel's ray is taken into rig space and measured against the two beam
// axes (uSrc -> uTo), so the cones stay put in the world while the gaze moves.
const BEAM_FRAG = GLSL_NZ + /* glsl */`
  uniform float uA, uTime, uTan, uAspect; uniform mat3 uRot; uniform vec3 uSrc, uTo[2], uCol; varying vec2 vUv;
  float beam(vec3 d, vec3 to, float ph){
    vec3 b = normalize(to - uSrc), w0 = -uSrc;
    float c = dot(d, b), dd = dot(d, w0), e = dot(b, w0), den = max(1. - c * c, .02);
    float t = (c * e - dd) / den, s = (e - c * dd) / den;
    float r = max(s, 1.) * .0031, dist = length(w0 + t * d - s * b) / r;
    float dust = .6 + .8 * nzl(vec2(s * .012 - uTime * .35, ph + dist * 1.3)).r * nzl(vec2(s * .004 + uTime * .1, ph * 3.)).g * 2.;
    return step(0., t) * step(0., s) * (1. - smoothstep(.15, 1., dist)) * dust * min(1. / sqrt(den), 2.5) * (1. - smoothstep(3600., 5200., s));
  }
  void main(){
    vec3 d = normalize(uRot * vec3(vUv.x * uTan * uAspect, vUv.y * uTan, -1.));
    float a = (beam(d, uTo[0], 3.) + beam(d, uTo[1], 11.)) * uA;
    gl_FragColor = vec4(uCol * a, 1.);
  }`;

// ---------------------------------------------------------------- small builders (flat-shaded, vertex-coloured)
function makeGeo() {
  const P = [], C = [];
  const g = {
    tri(a, b, c, col) { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let i = 0; i < 3; i++) C.push(col[0], col[1], col[2]); },
    quad(a, b, c, d, col) { g.tri(a, b, c, col); g.tri(a, c, d, col); },
    // box standing on y = y0; the top face is scaled by tx, tz and shifted by oz (raked fronts)
    box(cx, y0, cz, sx, sy, sz, col, tx = 1, tz = 1, oz = 0, topCol = null) {
      const x = sx / 2, z = sz / 2, X = x * tx, Z = z * tz, y1 = y0 + sy;
      const b = [[cx - x, y0, cz - z], [cx + x, y0, cz - z], [cx + x, y0, cz + z], [cx - x, y0, cz + z]];
      const t = [[cx - X, y1, cz - Z + oz], [cx + X, y1, cz - Z + oz], [cx + X, y1, cz + Z + oz], [cx - X, y1, cz + Z + oz]];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, k = i % 2 ? 0.86 : 1; g.quad(b[i], t[i], t[j], b[j], [col[0] * k, col[1] * k, col[2] * k]); }
      g.quad(t[0], t[3], t[2], t[1], topCol || [col[0] * 1.1, col[1] * 1.1, col[2] * 1.1]);
      return g;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      geo.computeVertexNormals(); return geo;
    },
  };
  return g;
}

// 150 m amphibious dock ship (bow toward +Z, waterline y = 0). white = the recovery-vessel cast.
function buildShip(white, rng) {
  const g = makeGeo();
  const hull = white ? [0.62, 0.62, 0.6] : [0.2, 0.225, 0.26], boot = white ? [0.5, 0.12, 0.05] : [0.05, 0.055, 0.065], deck = white ? [0.2, 0.3, 0.26] : [0.12, 0.13, 0.15];
  const sup = white ? [0.7, 0.7, 0.68] : [0.25, 0.275, 0.31], dark = [0.02, 0.025, 0.035], mark = [0.62, 0.62, 0.58];
  const zs = [-75, -70, -40, 0, 30, 50, 63, 71, 75], bd = [10.2, 11, 11.5, 11.5, 10.8, 8.6, 5.4, 2.4, 0.5], dh = [9, 9, 9, 9, 9.6, 10.6, 11.6, 12.4, 13];
  for (let i = 0; i < zs.length - 1; i++) {
    for (const s of [-1, 1]) {
      const w0 = [s * bd[i] * 0.86, -2, zs[i] + (i === 0 ? 1 : 0)], w1 = [s * bd[i + 1] * 0.86, -2, zs[i + 1] - (i > 5 ? 2 : 0)];
      const m0 = [s * bd[i] * 0.93, 1.6, zs[i]], m1 = [s * bd[i + 1] * 0.93, 1.6, zs[i + 1]], d0 = [s * bd[i], dh[i], zs[i]], d1 = [s * bd[i + 1], dh[i + 1], zs[i + 1]];
      const k = 0.9 + 0.2 * rng();
      g.quad(w0, w1, m1, m0, boot); g.quad(m0, m1, d1, d0, [hull[0] * k, hull[1] * k, hull[2] * k]);
    }
    g.quad([-bd[i], dh[i], zs[i]], [bd[i], dh[i], zs[i]], [bd[i + 1], dh[i + 1], zs[i + 1]], [-bd[i + 1], dh[i + 1], zs[i + 1]], deck);
  }
  g.quad([-10.2, -2, -74], [10.2, -2, -74], [10.2, 9, -75], [-10.2, 9, -75], hull);
  g.box(0, 0.6, -75.6, 15, 6.4, 0.6, dark);                                      // the well deck's mouth (the amber glow sits in it)
  // flight deck markings
  g.box(0, 9.02, -42, 0.7, 0.12, 54, mark); g.box(0, 9.02, -30, 15, 0.12, 0.7, mark); g.box(0, 9.02, -56, 15, 0.12, 0.7, mark);
  for (const s of [-1, 1]) g.box(s * 9.6, 9.02, -42, 0.5, 0.12, 60, mark);
  // hangar, superstructure tiers, bridge
  g.box(0, 9, -4, 19, 8, 14, sup, 0.92, 0.9); g.box(0, 9, 18, 21, 8.5, 34, sup, 0.9, 0.94, 0); g.box(0, 17.5, 21, 16, 5.5, 24, sup, 0.86, 0.9, -1);
  g.box(0, 23, 27, 13, 3.6, 11, sup, 0.9, 0.8, -1); g.box(0, 24.2, 32.3, 11.5, 1.1, 0.5, dark); g.box(0, 19.6, 35.2, 14, 1.0, 0.5, dark);
  for (const s of [-1, 1]) { g.box(s * 9.6, 12.5, 18, 0.4, 1.0, 26, dark); g.box(s * 11.2, 9, 6, 2.2, 3.2, 9, white ? [0.7, 0.3, 0.1] : [0.16, 0.17, 0.19]); g.box(s * 7.5, 9, 44, 3, 2.6, 5, sup, 0.7, 0.7); }
  // masts: an enclosed fore mast in bands (reads as lattice at this range), an aft mast, domes
  for (let i = 0; i < 6; i++) { const k = 1 - i * 0.12; g.box(0, 26.6 + i * 2.6, 26, 5.2 * k, 2.6, 5.2 * k, i % 2 ? dark : sup, 0.9, 0.9); }
  g.box(0, 42.2, 26, 0.5, 5, 0.5, dark); g.box(0, 17, -1, 3.6, 12, 3.6, sup, 0.35, 0.35); g.box(0, 29, -1, 0.4, 5, 0.4, dark);
  g.box(0, 23, 12, 4.4, 5, 4.4, sup, 0.5, 0.5); g.box(5, 23, 16, 2.4, 2.4, 2.4, mark, 0.4, 0.4); g.box(-5, 23, 16, 2.4, 2.4, 2.4, mark, 0.4, 0.4);
  // foredeck: gun or helipad, capstans
  if (white) { g.box(0, 11.2, 58, 12, 0.5, 12, [0.25, 0.4, 0.34], 1, 1); g.box(0, 11.72, 58, 6, 0.1, 1, mark); g.box(-2.6, 11.72, 58, 1, 0.1, 6, mark); g.box(2.6, 11.72, 58, 1, 0.1, 6, mark); }
  else { g.box(0, 10.8, 56, 4, 2.2, 5, sup, 0.7, 0.7); g.box(0, 12, 59.5, 0.5, 0.5, 5, dark); }
  for (let i = 0; i < 5; i++) g.box((rng() - 0.5) * 12, 9, -68 + i * 3 + rng() * 40, 1.6 + rng() * 2, 1.2 + rng() * 1.6, 1.6 + rng() * 3, sup);
  return g.build();
}
const shipRadarGeo = () => makeGeo().box(0, 0, 0, 9, 1.3, 0.7, [0.3, 0.32, 0.36]).box(0, -1.4, 0, 0.8, 1.4, 0.8, [0.05, 0.05, 0.06]).build();

// 19 m grey helicopter with an orange tail band (nose toward +Z, rotor hub at y = 2.9)
function buildHeli() {
  const g = makeGeo(), gr = [0.2, 0.22, 0.25], dk = [0.03, 0.035, 0.045], or = [1.0, 0.16, 0.02];
  g.box(0, -1.7, 1, 3.2, 1.6, 9.5, gr, 1.12, 1.02); g.box(0, -0.1, 1, 3.6, 2.2, 9.7, gr, 0.72, 0.86, -0.4);
  g.box(0, -1.5, 6.6, 3.0, 1.6, 2.6, gr, 0.8, 0.5, -0.9); g.box(0, 0.1, 5.9, 2.9, 1.3, 1.2, dk, 0.75, 0.6, -0.5);      // nose, windscreen
  g.box(0, 2.0, 0.6, 1.8, 0.9, 5, gr, 0.7, 0.8); g.box(0, 2.6, 0.6, 0.5, 0.5, 0.5, dk);                                   // engines, mast
  g.box(0, 0.1, -7.6, 1.3, 1.5, 8.4, gr, 0.7, 1); g.box(0, 0.05, -8.4, 1.5, 1.7, 1.5, or, 0.72, 1);                        // boom and its orange band
  g.box(0, 0.6, -12.2, 0.45, 4.2, 2.0, gr, 1, 0.55, -1.1); g.box(0, 3.6, -13, 0.5, 1.0, 1.6, or, 1, 0.8);                  // fin, orange tip
  g.box(0, 1.4, -11.4, 4.2, 0.25, 1.2, gr);                                                                               // stabiliser
  for (const s of [-1, 1]) { g.box(s * 2.0, -1.9, 0.6, 1.0, 1.0, 3.6, gr, 0.8, 0.8); g.box(s * 2.0, -2.5, 0.8, 0.5, 0.7, 0.9, dk); }
  g.box(0, -2.4, 5.4, 0.4, 0.7, 0.8, dk);
  return g.build();
}

// 11 m dark inflatable (bow toward +Z)
function buildBoat() {
  const g = makeGeo(), tube = [0.035, 0.04, 0.05], dk = [0.015, 0.017, 0.02], gy = [0.1, 0.11, 0.12];
  for (const s of [-1, 1]) { g.box(s * 1.35, 0.1, -0.6, 0.95, 0.85, 8.4, tube, 0.8, 1); g.box(s * 0.85, 0.2, 4.4, 0.95, 0.85, 2.2, tube, 0.8, 0.8, 0.3); }
  g.box(0, 0.35, 5.4, 1.3, 0.8, 1.2, tube, 0.6, 0.6, 0.3); g.box(0, 0.05, -0.4, 2.0, 0.35, 8.2, gy);
  g.box(0, 0.4, -0.2, 1.1, 1.5, 1.3, dk, 0.9, 0.7); g.box(0, 1.9, -0.2, 1.3, 0.1, 1.5, dk);
  g.box(-0.45, 0.4, -1.8, 0.5, 1.5, 0.5, dk, 0.8, 0.8); g.box(0.45, 0.4, -1.8, 0.5, 1.5, 0.5, dk, 0.8, 0.8); g.box(0, 0.4, 1.6, 0.5, 1.3, 0.5, dk, 0.8, 0.8);
  g.box(-0.5, 0.2, -5.2, 0.6, 1.3, 0.9, dk); g.box(0.5, 0.2, -5.2, 0.6, 1.3, 0.9, dk);
  return g.build();
}

// pose of a camera mount in hero space -> position + quaternion (camera convention: -Z forward, +Y up)
const _m4 = new THREE.Matrix4();
function mountPose(m) { return { p: m.position.clone(), q: new THREE.Quaternion().setFromRotationMatrix(_m4.lookAt(m.position, m.target, m.up)) }; }

// ================================================================ the world
export default {
  id: 'splashdown',
  name: 'Splashdown',
  category: 'sky',
  weirdness: 0.1,
  media: ['air', 'space'],
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1;
    const u1 = (v) => ({ value: v });

    // ---------------- variations (every draw happens, whatever the viewer's hour, so layouts stay put)
    const seededMood = rng.pick(['dawn', 'golden', 'night', 'golden', 'noon', 'dawn', 'dawn']);
    const moodId = { dawn: 'dawn', day: 'noon', golden: 'golden', night: 'night' }[vary.hour] || seededMood, M = MOODS[moodId], night = moodId === 'night';
    const weatherId = rng.pick(['streets', 'strato', 'popcorn', 'streets']), Wx = WEATHER[weatherId];
    const skin = rng.pick(['tile', 'tile', 'foil', 'gumdrop']), pattern = rng.pick(['blocks', 'onegore', 'quarters', 'blocks']);
    const whiteShip = rng.chance(0.4), birdCast = rng.pick(['albatross', 'albatross', 'frigate', 'dolphins']);
    const windA = rng.range(-0.55, 0.55), wind = new THREE.Vector2(Math.sin(windA), Math.cos(windA));
    const moodK = clamp(vary.mood ?? 0.5, 0, 1), swing = lerp(0.75, 1.3, moodK), cirK = lerp(0.6, 1.35, moodK);   // the visit's free mood: a calm or a lively ride

    const scene = new THREE.Scene();

    // ---------------- path: level for 486 m, a 174 m arc down to 65 degrees, 60 m straight onto the portal
    const Y0 = 147.6, RA = 153.5, pts = [[0, Y0, 0], [0, Y0, 120], [0, Y0, 240], [0, Y0, 360], [0, Y0, 440], [0, Y0, 486]];
    for (let a = 13; a <= 65; a += 13) pts.push([0, Y0 - RA * (1 - Math.cos(a * DEG)), 486 + RA * Math.sin(a * DEG)]);
    const ae = pts[pts.length - 1], dv = [0, -Math.sin(65 * DEG), Math.cos(65 * DEG)];
    pts.push([0, ae[1] + dv[1] * 30, ae[2] + dv[2] * 30], [0, ae[1] + dv[1] * 60, ae[2] + dv[2] * 60]);
    const path = makePath(pts), portalPos = path.pointAt(1).clone(), PXZ = new THREE.Vector2(portalPos.x, portalPos.z);

    // ---------------- kit sky (drawn in act four, lights everything real), light rig, fog
    const skyOpts = { rng, preset: M.preset, clouds: false, clouds2: { opacity: 0.32, coverage: 0.5 }, ...M.sky };
    if (night) Object.assign(skyOpts, { bodyOverrides: { 0: { elevation: M.sunEl, azimuth: 122, size: 2.4 } }, bake: true, renderer: ctx.renderer });
    else Object.assign(skyOpts, { sunElevation: M.sunEl, sunAzimuth: 122 });
    const sky = makeSky(skyOpts); scene.add(sky.object);
    const SUN_W = (sky.keyDirection || sky.sunDirection).clone().normalize(), SUN_RIG = V3(-SUN_W.x, SUN_W.y, -SUN_W.z);
    const sunAzW = new THREE.Vector2(SUN_W.x, SUN_W.z).normalize(), sunAzRig = new THREE.Vector2(-sunAzW.x, -sunAzW.y);
    const fog = new THREE.FogExp2(sky.fogColor.clone(), 0); scene.fog = fog;
    // (follow: false and no camera in update(): the rig's follow code calls camera.getWorldDirection(), which rebuilds the
    //  portal camera's world matrix from its unused local one and so breaks the view of this world through a portal)
    const rigL = makeLightRig(sky, { bounce: 0.45, follow: false }); scene.add(rigL.object);
    const keyCol = new THREE.Color(M.key).multiplyScalar(M.keyI), shineCol = new THREE.Color(M.shine[0]).multiplyScalar(M.shine[1]), bounceCol = new THREE.Color(M.bounce[0]).multiplyScalar(M.bounce[1]);
    await ctx.yield();

    // ---------------- hero: the capsule and what it wears (posed in camera space every frame)
    const hero = await buildHero(ctx, { palette: M.pal, skin, pattern, lagThird: !!vary.rare, lagAt: 21.2, pod: false, sunDir: SUN_W, gloss: night ? 0.4 : 1 });
    hero.pod.visible = false; hero.object.matrixAutoUpdate = false; scene.add(hero.object);
    hero.setSun(SUN_W, keyCol); hero.setAmbient(shineCol, bounceCol);
    const MT = hero.anchors.mounts, pa = mountPose(MT.along), pi = mountPose(MT.image), po = mountPose(MT.outward);
    const cloth = hero.object.children.filter((c) => c.material && c.material.uniforms && (c.material.uniforms.uStage || c.material.uniforms.uOpen));
    await ctx.yield();

    // ---------------- shared noise, the dome (sky + Earth from height), the veil
    const nd = new Uint8Array(256 * 256 * 4), nr = rng.fork('noise');
    for (let i = 0; i < nd.length; i++) nd[i] = (nr() * 256) | 0;
    const noiseTex = new THREE.DataTexture(nd, 256, 256, THREE.RGBAFormat);
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.magFilter = THREE.LinearFilter; noiseTex.minFilter = THREE.LinearMipmapLinearFilter; noiseTex.generateMipmaps = true; noiseTex.needsUpdate = true;
    const uNoise = u1(noiseTex);
    await ctx.yield();
    const shLen = Math.min(2.6, 0.9 / Math.max(0.12, Math.tan(M.sunEl * DEG)));
    const DU = {
      uNoise, uAlt: u1(75), uAir: u1(0), uBand: u1(0.03), uStars: u1(1), uTime: u1(0), uPix: u1(0.003), uSpin: u1(0),
      uCov: u1(Wx.cov), uStreet: u1(Wx.street), uCell: u1(Wx.cell), uGap: u1(Wx.gap), uFill: u1(Wx.fill),
      uHeap: u1(1 / Wx.heap),
      uShLen: u1(shLen), uDisc: u1(M.disc), uCir: u1(0),
      uDrift: u1(new THREE.Vector2()), uWind: u1(wind.clone()), uSunAz: u1(sunAzRig), uSun: u1(SUN_RIG.clone()), uSunCol: u1(lin(M.sun[0], M.sun[1])),
      uLine: u1(lin(...M.line)), uGold: u1(lin(...M.gold)), uSeam: u1(lin(...M.seam)), uBlue: u1(lin(...M.blue)), uSlate: u1(lin(...M.slate)), uRose: u1(lin(...M.rose)),
      uIndigo: u1(lin(...M.indigo)), uPowder: u1(lin(...M.powder)), uSea: u1(lin(...M.sea)), uHazeS: u1(lin(...M.hazeS)), uHazeA: u1(lin(...M.hazeA)),
      uCloudL: u1(lin(...M.cloudL)), uCloudS: u1(lin(...M.cloudS)),
    };
    const dome = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({ uniforms: DU, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthTest: false, depthWrite: false }));
    dome.scale.setScalar(3000); dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
    const vLit = lin(M.veil, 0.55).add(lin(M.cloudL[0], M.cloudL[1] * 0.42)), vSh = lin(M.veil, 0.3).add(lin(M.cloudS[0], M.cloudS[1] * 0.5)), vDeep = lin(M.veil, 0.19).add(lin(M.cloudS[0], M.cloudS[1] * 0.3));
    const veilU = (depth, gain, speed) => ({ uNoise, uA: u1(0), uTime: u1(0), uStreak: u1(1), uBias: u1(0), uGain: u1(gain), uSpeed: u1(speed), uDepth: u1(depth), uLight: u1(new THREE.Vector2(-0.82, 0.57)), uCol: u1(vLit), uCol2: u1(vSh), uDeep: u1(vDeep) });
    const VU = veilU(9, 1, 1.5), VF = veilU(0, 0.5, 2.3);
    const veilMesh = (U, test, order) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, transparent: true, premultipliedAlpha: true, depthTest: test, depthWrite: false }));
      m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m;
    };
    const veil = veilMesh(VU, true, 60), veilF = veilMesh(VF, false, 61);
    // night: the ship's searchlights (rig space: the ship lies far below, ahead and to the left; the beams cross at the cluster)
    const KU = { uNoise, uA: u1(0), uTime: u1(0), uTan: u1(0.767), uAspect: u1(1.78), uDepth: u1(9), uRot: u1(new THREE.Matrix3()), uSrc: u1(V3(-1150, -1900, -1250)), uTo: u1([V3(-24, 60, -44), V3(27, 66, -36)]), uCol: u1(lin('#cfe0ff', 0.2)) };
    const beams = night ? new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: KU, vertexShader: VEIL_VERT, fragmentShader: BEAM_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false })) : null;
    if (beams) { beams.frustumCulled = false; beams.renderOrder = 58; beams.visible = false; scene.add(beams); }
    // apparent ground travelled (km), so the sea and its streets creep under us at every height
    const driftTab = new Float32Array(402), altAt = (t) => Math.exp(key(ALT.map(([a, b]) => [a, Math.log(b)]), t));
    for (let i = 1; i < 402; i++) driftTab[i] = driftTab[i - 1] + altAt(i * 0.1) * 0.035 * 0.1;
    const altLog = ALT.map(([a, b]) => [a, Math.log(b)]);

    // ---------------- act two: ice crystals hanging round the capsule
    const ice = fx.makeParticles({ rng: rng.fork('ice'), preset: 'dust', count: Math.round(520 * detail), box: [10, 7, 12], size: [0.018, 0.05], colors: ['#ffffff', '#cfe0ff', '#ffe2cc'], intensity: 2.1, fog: false, velocity: [0.25, 0.12, 17.7], velocityRandom: [0.25, 0.15, 0.3] });
    ice.setOpacity(0); scene.add(ice.object);
    // ---------------- act four: the real sea and what is on it
    const L = Water.waterLight(sky);
    // (a private light: the sea's own key is turned every frame so that its glitter road runs through the ship; the sun
    //  itself is out of frame all flight. At night the sea also gets a moonlit ambient of its own, or it is crushed to black.)
    const seaOpts = { rng, light: L, preset: 'breeze', height: 1.0, foam: 0.3, windAngle: Math.atan2(wind.x, wind.y), deep: M.deep, scatter: M.scatter, radius: 3600, sunDir: SUN_W.clone() };
    if (M.seaAmb) seaOpts.ambient = new THREE.Color().setRGB(M.seaAmb[0], M.seaAmb[1], M.seaAmb[2]);
    if (M.seaSun) { seaOpts.sunColor = M.seaSun[0]; seaOpts.sunIntensity = M.seaSun[1]; }
    const ocean = Water.makeOcean(seaOpts), seaKey = ocean.light.sunDir, seaEl = Math.max(SUN_W.y, 0.2), road = sunAzW.clone();
    ocean.light.scatDir.copy(SUN_W);
    scene.add(ocean.object);
    await ctx.yield();
    const fogU = () => ({ fogColor: u1(new THREE.Color()), fogDensity: u1(0), fogNear: u1(1), fogFar: u1(2000) });
    const shipPos0 = new THREE.Vector2(195, 830), shipH = new THREE.Vector2(0.967, -0.254).normalize();
    const BU = {
      ...fogU(), uNoise, uTime: u1(0), uDye: u1(0), uCanA: u1(0), uWeed: u1(clamp(0.75 * density, 0.4, 1)), uShAmt: u1(M.shAmt), uSheenCol: u1(lin(...M.sheen)), uRoad: u1(sunAzW.clone()), uPix: u1(0.003), uShCov: u1(Wx.shadow),
      uPortal: u1(PXZ.clone()), uSunAz: u1(sunAzW.clone()), uWind: u1(wind.clone()), uCan: u1([new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()]),
      uShip: u1(new THREE.Vector4(shipPos0.x, shipPos0.y, shipH.x, shipH.y)), uBoat: u1([0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 100, 0))),
      uHeli: u1([V3(0, 0, 0), V3(0, 0, 0)]), uShadowCol: u1(lin(M.shadow, 1)), uFoamCol: u1(lin(...M.foam)),
      uWeedCol: u1(lin('#b48c38', night ? 0.18 : 0.42).multiply(lin(M.key, 1).addScalar(0.25))), uDyeCol: u1(lin('#7CFF4F', night ? 0.75 : 1.0)),
    };
    const decals = new THREE.Mesh(new THREE.PlaneGeometry(3400, 3400).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: BU, vertexShader: DECAL_VERT, fragmentShader: DECAL_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: true }));
    decals.position.set(0, 2.0, 650); decals.renderOrder = 2; scene.add(decals);      // (above the highest crest of the 1 m waves: nothing pokes through the foam ring)

    const craftMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.12, side: THREE.DoubleSide });
    if (night) craftMat.color.setRGB(0.8, 0.62, 0.42);      // (under the blue moon key grey paint goes ultramarine: warm it back to a dark steel)
    const shipG = new THREE.Group(), shipMesh = new THREE.Mesh(buildShip(whiteShip, rng.fork('ship')), craftMat), radar = new THREE.Mesh(shipRadarGeo(), craftMat);
    radar.position.set(0, 45.6, 26);
    // self-lit bits: the amber well deck in the stern, masthead and deck lamps (HDR vertex colours, so they bloom)
    const lg = makeGeo(), amber = new THREE.Color('#ffa63a').multiplyScalar(night ? 3.4 : 2.3), lampC = new THREE.Color('#ffe2b0').multiplyScalar(night ? 5 : 2.6), la = [lampC.r, lampC.g, lampC.b];
    lg.box(0, 1.1, -76.0, 13.4, 5.2, 0.2, [amber.r, amber.g, amber.b]); lg.box(0, 47.3, 26, 0.7, 0.7, 0.7, la); lg.box(0, 34.1, -1, 0.6, 0.6, 0.6, la);
    for (const sx of [-1, 1]) for (const z of [-66, -20, 34]) lg.box(sx * 9.9, 10.2, z, 0.5, 0.5, 0.5, la);
    const well = new THREE.Mesh(lg.build(), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    shipG.add(shipMesh, radar, well); shipG.rotation.y = Math.atan2(shipH.x, shipH.y); scene.add(shipG);
    const heliGeo = buildHeli(), rotorGeo = new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), RU = { ...fogU(), uTime: u1(0) };
    const rotorMat = new THREE.ShaderMaterial({ uniforms: RU, vertexShader: ROTOR_VERT, fragmentShader: ROTOR_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: true });
    const helis = [0, 1].map(() => { const g = new THREE.Group(), r = new THREE.Mesh(rotorGeo, rotorMat); r.position.y = 3.0; r.scale.setScalar(8.6); r.renderOrder = 4; g.add(new THREE.Mesh(heliGeo, craftMat), r); scene.add(g); return g; });
    const boats = new THREE.InstancedMesh(buildBoat(), craftMat, 4); boats.frustumCulled = false; scene.add(boats);
    // boats: arcs that curl in toward the slick and stop 120 m short of it at 40 s
    const boatArcs = [18, 162, -34, 205].map((deg, i) => {
      const a = deg * DEG + rng.range(-0.12, 0.12), E = new THREE.Vector2(PXZ.x + Math.cos(a) * 124, PXZ.y + Math.sin(a) * 124), h = PXZ.clone().sub(E).normalize();
      const dir = i % 2 ? 1 : -1, r = rng.range(140, 200), n = new THREE.Vector2(-h.y, h.x).multiplyScalar(dir), c = E.clone().addScaledVector(n, r);
      return { c, r, dir, end: Math.atan2(E.y - c.y, E.x - c.x), speed: rng.range(12, 15) };
    });
    await ctx.yield();

    // ---------------- cumulus: towers that rise past us in act three (then hang over the sea), far streets for act four
    const cr = rng.fork('clouds'), at = [[0, 170, 552, 125]];
    const nNear = Math.round((weatherId === 'popcorn' ? 6 : 8) * clamp(density, 0.8, 1.2));
    for (let i = 0; i < nNear; i++) { const w = cr.range(105, weatherId === 'strato' ? 230 : 180), s = i % 2 ? 1 : -1; at.push([s * (w * 0.5 + cr.range(24, 95)), 172 + cr.range(0, 55), 350 + (i / nNear) * 330 + cr.range(-20, 20), w]); }
    at.push([-74, 150, 492, 84], [80, 172, 452, 72], [-92, 196, 566, 96]);      // three towers close by the line: they rise past at arm's length at 23.5-25.5 s
    const nearField = makeCloudField({ rng, sky, at, puffs: Math.round(44 * (0.6 + 0.4 * detail)), wind: [0.8, 0, 0.4], nearFade: [0.14, 0.55], opacity: 1 });
    scene.add(nearField.object);
    await ctx.yield();
    const farField = makeCloudField({
      rng, sky, noiseTexture: nearField.noiseTexture, count: Math.round(13 * Wx.clouds * clamp(density, 0.8, 1.25)), center: [0, 0, 1000], extent: [4400, 4400], altitude: 235, altitudeJitter: 50,
      size: weatherId === 'strato' ? [260, 460] : [170, 330], puffs: Math.round(40 * (0.6 + 0.4 * detail)), filter: (x, y, z) => Math.hypot(x, z - 560) > 430,
    });
    scene.add(farField.object);
    await ctx.yield();

    // ---------------- life on the real sea
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const birdCol = birdCast === 'frigate'
      ? { species: 'swifts', count: 3, size: 3.4, body: '#1c1a20', belly: '#e9e4da', wingC: '#222028', trail: '#2a2830', tip: '#101014', head: '#16141a', flap: 1.6, glide: 0.9 }
      : { species: 'gulls', count: 2, size: 3.2, body: '#f4f2ec', belly: '#ffffff', wingC: '#ecebe6', trail: '#33363c', tip: '#121418', head: '#f8f6f0', beak: '#f2b7a0', flap: 1.1, glide: 0.92 };
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('escort'), ...birdCol, speed: 17, spread: [3.4, 0.9, 2.6], wander: [0.7, 0.5, 0.7, 0.3], maxSigma: 3, keepClear: { path, dist: 2.3, step: 2, from: 0.67 }, along: { path, side: 3.5, up: -2.2, lead: 6.5, from: 0.735, to: 0.835, drift: 1.2 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({
      rng: rng.fork('shear'), species: 'swifts', count: Math.max(24, Math.round(60 * density * detail)), size: 2.9, speed: 12, center: [portalPos.x, 3.4, portalPos.z + 4], radius: 92, height: 0.9, wobble: 0.1,
      spread: [16, 1.3, 60], wander: [3, 0.8, 4, 0.5], maxSigma: 3, body: '#4a4038', belly: '#efe9de', wingC: '#51463c', trail: '#3a322c', tip: '#221d1a', head: '#3a312b', glide: 0.7, flap: 5,
    }));
    if (birdCast === 'dolphins') fauna.add(F.makeDolphins({ rng: rng.fork('dolphins'), count: 7, center: [portalPos.x - 96, 0, portalPos.z + 30], radius: 46, level: 0, light: 'day' }));
    // spray crown (screen space)
    const SN = 46, sp = [], ss = [], si = [], sr = rng.fork('spray');
    for (let i = 0; i < SN; i++) {
      const sd = [(i / (SN - 1)) * 2 - 1 + sr.range(-0.03, 0.03), sr(), sr(), sr()];
      for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { sp.push(c[0], c[1], 0); ss.push(sd[0], sd[1], sd[2], sd[3]); }
      si.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ss, 4)); sg.setIndex(si);
    const SPU = { uT: u1(0), uAspect: u1(1.78), uCol: u1(lin(M.foam[0], M.foam[1] * 1.05)) };
    const spray = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: SPU, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false }));
    spray.frustumCulled = false; spray.renderOrder = 55; scene.add(spray);
    // steam wisps off the lip (screen space, like the spray)
    const TN = Math.round(44 * (0.6 + 0.4 * detail)), tp = [], ts = [], ti = [], tr = rng.fork('steam');
    for (let i = 0; i < TN; i++) {
      const sd = [(i + tr()) / TN, tr(), tr(), tr()];
      for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { tp.push(c[0], c[1], 0); ts.push(sd[0], sd[1], sd[2], sd[3]); }
      ti.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ts, 4)); tg.setIndex(ti);
    const TU = { uNoise, uTime: u1(0), uAspect: u1(1.78), uA: u1(0), uCol: u1(lin(M.cloudL[0], night ? 0.5 : 0.85)), uCol2: u1(lin(M.veil, night ? 0.3 : 0.5).multiply(lin(M.cloudS[0], 1).addScalar(0.4))) };
    const steam = new THREE.Mesh(tg, new THREE.ShaderMaterial({ uniforms: TU, vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false }));
    steam.frustumCulled = false; steam.renderOrder = 54; steam.visible = false; scene.add(steam);
    const realObjs = [sky.object, ocean.object, decals, shipG, helis[0], helis[1], boats, farField.object];
    // the engine puts the exit portal in this scene and the dome ignores depth, so until the last cloud a depth-only disc
    // rides in front of the portal and hides its ring from acts one to three (26 m in front: the portal lies tilted on the
    // sea, so its near rim and its halo reach up to 21 m toward the lens)
    const occluder = new THREE.Mesh(new THREE.CircleGeometry(32, 24), new THREE.MeshBasicMaterial({ colorWrite: false, fog: false }));
    occluder.renderOrder = 4; occluder.frustumCulled = false; scene.add(occluder);

    // ---------------- per-frame script
    const qRig = new THREE.Quaternion(), qJ = new THREE.Quaternion(), qE = new THREE.Quaternion(), qP = new THREE.Quaternion(), eul = new THREE.Euler();
    const pP = V3(), ONE = V3(1, 1, 1), ZERO = V3(), sc = V3(), fwd = V3(), sunW = V3(), mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), size2 = new THREE.Vector2();
    const bq = new THREE.Quaternion(), bp = V3(), heliA = V3(), heliB = V3();
    const pvF = V3(), pvU = V3(), pvT = V3(), qB = new THREE.Quaternion(), mR = new THREE.Matrix4();
    const fogCol = sky.fogColor.clone(), fogRig = new THREE.Color(M.hazeS[0]).multiplyScalar(M.hazeS[1]).lerp(new THREE.Color(M.hazeA[0]).multiplyScalar(M.hazeA[1]), 0.45);

    let creep = 0, lastTime = -1;
    function update(dt, time, camera, u) {
      const T = clamp(u || 0, 0, 1) * 40, preview = !(u > 0) && camera.near > 0.6, real = T >= T_SWAP;
      fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
      const camPitch = Math.asin(clamp(fwd.y, -1, 1)) / DEG;

      // ---- gaze above the apparent horizon, roll, shake (motion, not brightness), jolts
      const e = lerp(key(GAZE, T), camPitch, smoothstep(25.6, 26.7, T));
      const roll = (6 * Math.sin(T * 0.9 + 1) * pulse(T, 8.6, 10, 13, 14.4) + 10 * Math.sin((T - 22.6) * 1.45) * pulse(T, 22.6, 23.6, 25.5, 26.5)) * swing * DEG;
      hero.setFlightTime(T, time);
      const st = hero.state;
      const amp = ((T < 7 ? lerp(0.3, 0.85, smoothstep(0, 6.2, T)) * (1 - smoothstep(6.7, 7.0, T)) : 0) + st.jolt * 1.4) * DEG;
      eul.set(amp * (0.6 * Math.sin(time * 56.5) + 0.4 * Math.sin(time * 91.3 + 1)), amp * 0.8 * (0.6 * Math.sin(time * 49.7 + 2) + 0.4 * Math.sin(time * 77.1)) + (st.thruster[1] - st.thruster[0]) * 0.5 * DEG, amp * 0.5 * Math.sin(time * 63.9 + 4));
      qJ.setFromEuler(eul);

      // ---- rig: the dome rides the camera, pitched so the horizon sits e below the gaze
      qE.setFromEuler(eul.set(0, 0, roll)); qRig.copy(camera.quaternion).multiply(qJ).multiply(qE);
      qE.setFromEuler(eul.set(-e * DEG, 0, 0)); qRig.multiply(qE);
      dome.position.copy(camera.position); dome.quaternion.copy(qRig); dome.visible = !real;
      const resY = Math.max(64, ctx.renderer.getDrawingBufferSize(size2).y), pix = (2 * Math.tan(camera.fov * 0.5 * DEG)) / resY;
      DU.uAlt.value = Math.exp(key(altLog, T)); DU.uAir.value = key(AIR, T); DU.uBand.value = key(BAND, T); DU.uStars.value = Math.max(key(STARS, T), M.stars); DU.uCir.value = key(CIRRUS, T) * (T < 13.9 ? 0 : cirK);
      DU.uTime.value = time; DU.uPix.value = pix; DU.uSpin.value = time * 0.006 + T * 0.012;
      const di = Math.min(400, T * 10), d0 = Math.floor(di);
      creep += (lastTime < 0 ? 0 : clamp(time - lastTime, 0, 2)) * DU.uAlt.value * 0.014; lastTime = time;
      DU.uDrift.value.set(wind.x * time * 0.004, -lerp(driftTab[d0], driftTab[d0 + 1], di - d0) - creep + wind.y * time * 0.004);

      // ---- hero: capsule posed on its mount at the camera (scaled about the eye in a portal preview)
      // (seen through the previous world's portal, whose plane is that camera's near plane, the lens stands off the
      //  capsule's flank by a little more than the distance to the portal and looks at it: a dark cone in its sheath of
      //  fire fills the disc; as the viewer arrives the lens swoops onto the mount and turns up the wake)
      const mk = key(MOUNT, T), ik = key(IMAGE, T), pull = preview ? Math.max(0, camera.near - 0.3) * 1.25 : 0;
      qP.copy(pa.q).slerp(pi.q, ik).slerp(po.q, mk); pP.copy(pa.p).lerp(po.p, mk);
      if (pull > 0) {
        pvF.set(0, 0, -1).applyQuaternion(pa.q); pvU.set(0, 1, 0).applyQuaternion(pa.q);
        pvT.copy(pa.p).addScaledVector(pvF, 2.2).addScaledVector(pvU, -Math.min(1.3, pull * 0.3));
        pP.copy(pa.p).addScaledVector(pvF, -0.45 * pull).addScaledVector(pvU, 0.89 * pull);
        qP.setFromRotationMatrix(mA.lookAt(pP, pvT, pvU));
      }
      hero.uniforms.plasma.uTail.value = lerp(0.07, 0.45, clamp(pull / 25, 0, 1));
      mA.compose(pP, qP, ONE).invert(); mB.compose(ZERO, qJ, ONE);
      hero.object.matrix.copy(camera.matrixWorld).multiply(mB).multiply(mA);
      hero.object.matrix.decompose(hero.object.position, hero.object.quaternion, hero.object.scale);
      hero.object.updateMatrixWorld(true);
      if (real) sunW.copy(SUN_W); else sunW.copy(SUN_RIG).applyQuaternion(qRig);
      hero.setSun(sunW, keyCol); hero.setWet(smoothstep(26.6, 27.2, T));
      hero.update(dt, time, camera);
      if (T < 14.9 || T > 27.3) for (const c of cloth) c.visible = false;   // (their shaders were compiled with the scene at build)

      // ---- cloud we pass through: the cirrus sheet at 13.5 s (torn, never closed: it wipes up the frame), the cumulus at
      //      26.3-27.4 s (closed only for the 0.2 s in which the rig world is swapped for the real sea), two wisps
      const v1 = pulse(T, 13.2, 13.55, 13.8, 14.35), v2 = pulse(T, 26.3, 26.74, 26.94, 27.4);
      const wisp = pulse(T, 23.6, 23.75, 23.85, 24.15) + pulse(T, 24.9, 25.02, 25.1, 25.4);
      VU.uA.value = Math.max(v1 * 0.62, v2); VU.uStreak.value = T < 20 ? 1 : 0; VU.uBias.value = T < 20 ? lerp(-0.42, 0.42, smoothstep(13.3, 14.2, T)) : 0;
      VU.uSpeed.value = T < 20 ? 1.1 : 1.5; VU.uTime.value = time; veil.visible = VU.uA.value > 0.002;
      VF.uA.value = Math.max(v1 * 0.4, v2 * 0.42, wisp * 0.62); VF.uStreak.value = T < 20 ? 1 : wisp > v2 ? 0.75 : 0.2; VF.uTime.value = time + 40; veilF.visible = VF.uA.value > 0.002;
      if (beams) {
        KU.uA.value = pulse(T, 16.4, 18.2, 23.2, 25.2); beams.visible = KU.uA.value > 0.002;
        qB.copy(qRig).invert().multiply(camera.quaternion); KU.uRot.value.setFromMatrix4(mR.makeRotationFromQuaternion(qB));
        KU.uTan.value = Math.tan(camera.fov * 0.5 * DEG); KU.uAspect.value = camera.aspect; KU.uTime.value = time;
        KU.uTo.value[0].set(-24 + 8 * Math.sin(time * 0.31), 60, -44 + 5 * Math.cos(time * 0.23)); KU.uTo.value[1].set(27 + 8 * Math.sin(time * 0.27 + 2), 66 + 4 * Math.sin(time * 0.19), -36);
      }
      ice.setOpacity(pulse(T, 7.4, 8.6, 12.8, 13.5) * 0.9); if (ice.update) ice.update(dt, time, camera);
      TU.uA.value = 0.5 * smoothstep(27.2, 28.4, T) * (1 - smoothstep(35.5, 38.5, T)); TU.uTime.value = time; TU.uAspect.value = camera.aspect; steam.visible = TU.uA.value > 0.002;

      // ---- the real world: sea, sky, craft, decals, birds
      for (const o of realObjs) o.visible = real;
      nearField.object.visible = T > 22.5; nearField.object.position.y = key(CLOUDY, T);
      sky.update(dt, time, camera); rigL.update(dt, time, null); ocean.update(dt, time, camera);
      if (nearField.object.visible) nearField.update(dt, time, camera);
      if (real) farField.update(dt, time, camera);
      fauna.update(dt, time, camera, u, real);
      const shx = shipPos0.x + shipH.x * 2 * (T - 27), shz = shipPos0.y + shipH.y * 2 * (T - 27);
      shipG.position.set(shx, 0.25 * Math.sin(time * 0.45), shz); shipG.rotation.z = 0.012 * Math.sin(time * 0.37); radar.rotation.y = time * 1.7;
      const ha = 2.4 + time * 0.11; heliA.set(shx + Math.cos(ha) * 150, 72 + 3 * Math.sin(time * 0.6), shz + Math.sin(ha) * 150);
      helis[0].position.copy(heliA); helis[0].rotation.set(0.08, Math.atan2(-Math.sin(ha), Math.cos(ha)), -0.16, 'YXZ');
      heliB.set(-152 + 6 * Math.sin(time * 0.21), 44 + 2 * Math.sin(time * 0.5), 772 + 6 * Math.cos(time * 0.17));
      helis[1].position.copy(heliB); helis[1].rotation.set(0.05, Math.atan2(PXZ.x - heliB.x, PXZ.y - heliB.z) + 0.12 * Math.sin(time * 0.3), 0.03 * Math.sin(time * 0.8), 'YXZ');
      RU.uTime.value = time;
      BU.uHeli.value[0].set(heliA.x, heliA.z, 0.3); BU.uHeli.value[1].set(heliB.x, heliB.z, 1);
      for (let i = 0; i < 4; i++) {
        const b = boatArcs[i], th = b.end - (b.dir * b.speed * (40 - T)) / b.r, x = b.c.x + Math.cos(th) * b.r, z = b.c.y + Math.sin(th) * b.r;
        BU.uBoat.value[i].set(b.c.x, b.c.y, b.r * b.dir, th);
        bp.set(x, (real ? ocean.heightAt(x, z, time) : 0) + 0.25, z);
        bq.setFromEuler(eul.set(-0.1 - 0.03 * Math.sin(time * 3 + i), Math.atan2(-Math.sin(th) * b.dir, Math.cos(th) * b.dir), 0.04 * Math.sin(time * 2.3 + i * 2), 'YXZ'));
        boats.setMatrixAt(i, mA.compose(bp, bq, ONE));
      }
      boats.instanceMatrix.needsUpdate = true;
      BU.uTime.value = time; BU.uPix.value = pix; BU.uDye.value = smoothstep(27, 40, T); BU.uCanA.value = smoothstep(27.3, 28.2, T) * (night ? 0.5 : 1);
      BU.uShip.value.set(shx, shz, shipH.x, shipH.y);
      road.set(shx - camera.position.x, shz - camera.position.z).normalize().multiplyScalar(0.8).addScaledVector(sunAzW, 0.2).normalize();
      BU.uRoad.value.copy(road); seaKey.set(road.x, seaEl, road.y).normalize();
      occluder.visible = !preview && !real;
      if (occluder.visible) { occluder.position.copy(camera.position).sub(portalPos).normalize().multiplyScalar(26).add(portalPos); occluder.lookAt(camera.position); }
      const alt = Math.max(camera.position.y - 4, 0), cx = lerp(PXZ.x, camera.position.x, 0.35) - 0.78 * alt * 0.5, cz = lerp(PXZ.y, camera.position.z + alt * 0.4, 0.35) + 0.62 * alt * 0.5;
      for (let i = 0; i < 3; i++) { const a = 0.6 + i * 2.094 + 0.05 * Math.sin(time * 0.4 + i); BU.uCan.value[i].set(cx + Math.cos(a) * 21, cz + Math.sin(a) * 21); }
      SPU.uT.value = T - 39.15; SPU.uAspect.value = camera.aspect; spray.visible = T > 39.15;

      // ---- fog: none in space, warm haze under the canopies, the kit sky's own on the sea
      fog.color.copy(real ? fogCol : fogRig);
      fog.density = preview || T < 14.6 ? 0 : real ? M.fog : lerp(0.00018, 0.0005, smoothstep(21, 24, T));
    }

    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: 40,
      camera: { fov: 75, near: 0.12, far: 16000, sway: 0, bank: 0 },
      pois: [{ at: portalPos, from: 0.6, to: 1, weight: 0.5 }],
      portal: { shape: 'circle', radius: 7, color: '#BFE9FF', glow: 1, revealDistance: 240, tilt: true },
      post: {
        exposure: M.exposure, bloom: { strength: 0.42, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#07071c', vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      ride: 'none', companion: 'none',
      update,
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
