// RINGS IN THE TEA MIST. A spring morning in the tea hills of Fujian, flown as a barn swallow: out of a white-out
// over the tea rows, up an ochre wall and over a tiled eave, a descending helix round the inside of a rammed-earth ring
// fortress (a whole turn past the galleries at second-gallery height, then low over the court on a market morning: stalls under cloth awnings, villagers
// at the well, the mill, the hall and the earth god's burner, carriers with shoulder poles, tea trays on their mats, hens, ducks and the dog), up through
// kitchen smoke as the mist tears and five roof rings surface like craters, north along the mist sea past the square ring and along the largest ring's east
// flank just outside its eave, one wide turn round its north-east over the roof, and from there one straight line down at 28 degrees, over the galleries and
// the inner ring's roof, into a tilted portal that stands over the round stone well of the innermost court.
// Coordinates are the brief's: +X east (toward the morning sun), +Z north, heights above the shelf, everything
// enlarged about 1.5 times. Ring A (the hero, src/parts/tulou-rings.js) at the origin, S the rounded square, B, C and
// the largest, E, to the north; the lighter rings come from the same part file (buildRing).
// Looks by seed / ctx.vary.hour: spring morning (default), golden late afternoon, blue night with every lantern lit;
// weather: just after rain (wet cobbles, drips, slower mist); season: autumn (bronze terraces, persimmon trays),
// New Year (twice the lanterns, red paper drifting). Rare event: a cloth dragon circling the portal kerb in ring E.
// The mist lies LOW and the sky is open above it from the first frame (MIST_AS_DESIGNED = false): banks among the tea rows, a pale sea to the horizon
// with blue ranks standing over it, a washed spring blue overhead with mare's tails, the low sun a strong warm key (one side of the ring glows, the
// other is in cool shade with its lanterns lit) and its shafts raking over the roof through the kitchen smoke; the mist SEA with its craters is the
// reveal of the climb-out. (The design's white-out with no sky until the tear is kept behind MIST_AS_DESIGNED = true: strangers read it as a blank
// overcast in the first half of the flight, and their view decides.)
// Everything scripted (mist tearing and sinking, sky opening, bursts of swallows, the washing pole) is keyed to the metres flown; the dog, the villagers,
// the well and the mill run on the world's clock.
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, buildRing, Soup, ROOF, roofSection, TRUE_SIZE, COURT } from '../parts/tulou-rings.js';

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const PALETTE = ['#EEF1EC', '#C9995A', '#474C52', '#33211A', '#4E8A3A', '#D3271B', '#6C90A4'];
const SEA_CAP = 1.3;   // how bright the mist sea's sunlit colour is by day (linear, its largest channel): milk white on the lit side, never grey
const QS = 0.022, STEP = 2.5, ROWS = 35, LANE_X = 34, ROW_REACH = 46, LANE_ROWS = 10;      // terrace contour gradient (per m), riser height, tea rows per terrace unit; the lane's line; how far either side of the lane its rows are planted as real hedges; how far either side of it the rows are the lane's own (the fuller hedge)
// the rings: centre, base height, scale of the 96 m ring module (S is squared off)
const RING = {
  A: { x: 0, z: 0, y: 0, s: 1 }, S: { x: 30, z: 120, y: 1.5, s: 0.667, sq: 5 }, B: { x: 122, z: 100, y: -1.5, s: 0.833 },
  C: { x: -85, z: 115, y: 5, s: 0.9 }, E: { x: 15, z: 250, y: 0, s: 1.29 },
};
// The portal: 14 m across, over the well in the middle of ring E's innermost court, tilted to face the last straight square on. The straight comes down at
// DIVE; the portal's height is set so that its low rim hangs 0.3 m over the well's water.
const DIVE = 28 * Math.PI / 180, PORTAL_R = 7, WELL_WATER = 0.1, PORTAL = [RING.E.x, WELL_WATER + 0.3 + PORTAL_R * Math.cos(DIVE), RING.E.z];
const LOOK = 18;   // how far ahead of itself along the route the camera looks (metres)
// The camera's field of view (degrees), and the angle one pixel takes in at 1080 lines: a thing is under a pixel from further than its width / PX1080.
const FOV = 64, PX1080 = 2 * Math.tan(FOV * Math.PI / 360) / 1080, RIB_FAR = TRUE_SIZE.rib / PX1080;
// The design's mist: true = no sky until the tear (white-out at the entry, a luminous lid over ring A during the lap, a white sea). false = low mist
// under an open sky (a thin fog, the sky showing from the first frame and opening fully at the ridge): the look strangers rate higher, and the one flown.
const MIST_AS_DESIGNED = false;

const LOOKS = {
  morning: {   // the dome colours are saturated on purpose: the tone map bleaches bright colours
    title: 'Rings in the Tea Mist', sun: [0.85, 0.42, -0.32], mist: '#EEF1EC', clear: '#CFE0E6', mistFar: '#f3f1e6',
    sky: { preset: 'day', zenith: '#4f86bd', mid: '#8fb6d6', horizon: '#CFE0E6', ground: '#c4d2d6', horizonPow: 3.2, midPow: 1.3, scatterColor: '#fff0d0', scatter: 0.5, scatterPow: 6,
      sunColor: '#fff3da', sunSize: 1.3, sunIntensity: 11, sunGlow: 0.52, clouds: false, clouds2: { coverage: 0.5, stretch: 1, opacity: 0.6, scale: 0.8, haze: 1.2 },
      lightColor: '#FFE0B4', lightIntensity: 3.3, ambientColor: '#C9D6DE', groundLight: '#8a8468', ambientIntensity: 1.2 },
    glow: 0.45, bounce: null, exposure: 1.0, gain: 1.42, bloomAt: 1.32, seaShade: '#a3b7dc', seaLit: '#fcf5e8',
    md: { mist: '#EEF1EC', k: 1.42, zen: '#e4ecf0', kZ: 1.34, kL: 0.3, band: 0.2, ghostK: 0.8, warm: [1.05, 0.97, 0.86], seaLit: '#f6f7f2', seaShade: '#b4c8e2' },
    dome: { hor: '#ffe0b0', zen: '#8fb4f6', lobe: '#ffd08a', kH: 1.42, kZ: 1.0, kL: 0.4, band: 0.2, zenIn: '#7ea4ec', kZIn: 0.82, bandIn: 0.7 }, ghostSky: 0.52, ghostIn: 0.88, shafts: 0.4, shade: [0.36, 0.42, 0.58], fill: [0.3, 0.38, 0.55], glowIn: 0.5, sunIn: 1.7, hemiIn: 0.88, skyC: [0.4, 0.52, 0.78], clearIn: 0.6, ghost: [1.0, 0.93, 0.78], ghostK: 0.55, portal: '#ffe9b8',
    grade: { saturation: 1.07, contrast: 1.04, tint: '#fffdf6', shadowTint: '#0a1420' }, bloom: 0.42, hemiMist: MIST_AS_DESIGNED ? 1.3 : 1.12, sunMist: MIST_AS_DESIGNED ? 0.62 : 0.86, ridge: '#3f6585', ranks: ['#6f939d', '#accdff'],
  },
  golden: {
    title: 'Rings in the Evening Mist', sun: [-0.84, 0.33, -0.43], mist: '#f7ead2', clear: '#f6d2bc', mistFar: '#fdeed2', wild: '#3d5a26',
    sky: { preset: 'goldenHour', zenith: '#3f6fb0', mid: '#a6b2e2', horizon: '#ffd8c4', ground: '#d2b8a6', horizonPow: 3, midPow: 1.3, scatterColor: '#ffb070', scatter: 0.8, scatterPow: 5,
      sunColor: '#ffd9a0', sunSize: 1.4, sunIntensity: 12, sunGlow: 1.0, clouds: false, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.5, lit: '#ffe6c8', shade: '#b79aa8', haze: 1.0 },
      lightColor: '#ffc88a', lightIntensity: 3.4, ambientColor: '#b6c2d8', groundLight: '#8f7a5c', ambientIntensity: 1.05 },
    glow: 0.5, bounce: null, exposure: 1.0, gain: 1.3, bloomAt: 1.3, seaShade: '#9c9cc8', seaLit: '#ffe6c0',
    md: { mist: '#f7ead2', k: 1.32, zen: '#ecdccf', kZ: 1.22, kL: 0.34, band: 0.2, ghostK: 0.8, warm: [1.06, 0.95, 0.8], seaLit: '#fff0d6', seaShade: '#b9b4d8' },
    dome: { hor: '#ffc890', zen: '#b49ae0', lobe: '#ffa860', kH: 1.36, kZ: 1.0, kL: 0.45, band: 0.2, zenIn: '#9a86d8', kZIn: 0.74, bandIn: 0.6 }, ghostSky: 0.48, ghostIn: 0.88, shafts: 0.5, shade: [0.42, 0.38, 0.54], fill: [0.32, 0.3, 0.46], glowIn: 0.55, sunIn: 1.62, hemiIn: 0.9, skyC: [0.52, 0.48, 0.7], clearIn: 0.6, ghost: [1.0, 0.78, 0.5], ghostK: 0.6, portal: '#ffd9a0',
    grade: { saturation: 1.14, contrast: 1.05, tint: '#fff6e8', shadowTint: '#0c1226' }, bloom: 0.46, hemiMist: MIST_AS_DESIGNED ? 1.3 : 1.12, sunMist: MIST_AS_DESIGNED ? 0.62 : 0.86, ridge: '#5b5f86', ranks: ['#897fab', '#d5adc0'],
  },
  night: {
    title: 'Rings Under the Moon', sun: [0.42, 0.78, -0.46], mist: '#56678a', clear: '#2c3c5e', mistFar: '#6f82a6',
    sky: { preset: 'night', bake: true, zenith: '#060b1c', mid: '#101c3a', horizon: '#2c3c5e', ground: '#141c2c', stars: 0.9, milkyWay: 0.16, clouds: false, clouds2: false,
      bodies: [{ direction: [0.42, 0.78, -0.46], size: 2.4, phase: 0.94, glow: 0.5, intensity: 1.6 }], key: 0,
      lightColor: '#a9c2f0', lightIntensity: 1.25, ambientColor: '#4a62a8', groundLight: '#2a2630', ambientIntensity: 1.0 },
    glow: 2.6, bounce: [0.6, 0.34, 0.12], exposure: 1.28, gain: 1, bloomAt: 0.8, seaShade: '#2c3a5a', seaLit: '#8fa4cc',
    md: { mist: '#56678a', k: 1.0, zen: '#26335c', kZ: 1.0, kL: 0.22, band: 0.14, ghostK: 0.4, warm: [1, 1, 1] },
    dome: { hor: '#6f82a6', zen: '#1a2447', lobe: '#9fb4e6', kH: 0.92, kZ: 0.9, kL: 0.22, band: 0.14 }, ghostSky: 0.4, ghostIn: 0.85, shafts: 0.2, shade: [0.5, 0.56, 0.72], fill: [0.03, 0.045, 0.085], sunIn: 1.2, hemiIn: 0.85, skyC: [0.05, 0.075, 0.15], clearIn: 0.5, ghost: [0.6, 0.72, 1.0], ghostK: 0.35, portal: '#ffcf8a',
    grade: { saturation: 1.1, contrast: 1.05, tint: '#f2f5ff', shadowTint: '#050a1c' }, bloom: 0.5, hemiMist: 1.2, sunMist: 0.6, ridge: '#1c2a48', ranks: ['#1c2a48', '#21304f'],   // (the night pair: this look's own ridge colour, and that colour a third of the way to this sky's horizon colour: no rank lighter than the night sky behind it)
  },
};

const GLSL_N = /* glsl */`
float gh21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gh21(i), gh21(i + vec2(1., 0.)), f.x), mix(gh21(i + vec2(0., 1.)), gh21(i + vec2(1., 1.)), f.x), f.y); }
float gfbm(vec2 p){ return gvn(p) * .5 + gvn(p * 2.03 + 7.1) * .3 + gvn(p * 4.1 + 3.7) * .2; }
`;

// the ground: tea rows drawn along the terrace contours (aG.x = contour value), grassy risers, packed-earth yards with
// vegetable plots round the rings (aG.y), bamboo-forest floor on the wild slopes (aG.z), drifting cloud shadows
const GROUND_FRAG = /* glsl */`{
  float q = vG.x, pad = vG.y, wild = vG.z; vec2 wp = vWp.xz;
  float fr = fract(q), riser = smoothstep(.77, .81, fr) * (1. - pad);
  float rows = q * ${ROWS.toFixed(1)}, fw = fwidth(rows), rf = fract(rows);
  float hedge = smoothstep(.1, .26, rf) * (1. - smoothstep(.74, .9, rf)), hc = clamp((rf - .1) / .8, 0., 1.), dome = sin(3.1416 * hc);
  float aa = clamp(1. - (fw - .3) / .5, 0., 1.);
  aa *= 1. - smoothstep(.2, .6, uMistG.z * (1. - smoothstep(uMistG.x - 3.6, uMistG.x + 1.6, vWp.y)));   // under the mist sea the rows are their own average: no stripes beating through the white
  float n1 = gfbm(wp * .045), n2 = gvn(wp * .9), n3 = gvn(wp * 4.3);
  float lit = mix(hc, 1. - hc, step(0., uSunX));
  vec3 tea = uTea * (.42 + .8 * dome) * (.78 + .44 * n2) * mix(.62, 1.22, lit);
  tea = mix(tea, uTip, dome * dome * .4 * (.4 + .6 * n3));
  vec3 soil = vec3(.15, .105, .07) * (.7 + .6 * n2);
  vec3 avg = mix(soil, uTea * 1.05, .74) * (.8 + .4 * n1) * (.9 + .2 * n2);
  vec3 c = mix(avg, mix(soil, tea, hedge) * (.85 + .3 * n1), aa);
  float fwq = fw / ${ROWS.toFixed(1)}, bK = 1. - smoothstep(.3, .9, fwq * 7.);   // bands of rows picked on different days: the contours still read when single rows have blurred away
  c *= mix(1., .84 + .32 * gh21(vec2(floor(q * 7.), 2.7)), bK * (.3 + .7 * (1. - aa)));
  vec3 bank = mix(vec3(.07, .15, .04), vec3(.13, .23, .06), n3) * (.6 + .7 * n2);
  { float tf = gvn(wp * vec2(.7, 2.3) + 3.), tk = 1. - smoothstep(.2, .7, fwq * 40.);   // tussocks, bare earth and sheep-track ledges along the bank
    bank *= .72 + .56 * smoothstep(.3, .72, tf);
    bank = mix(bank, vec3(.2, .15, .09) * (.7 + .5 * n2), smoothstep(.62, .8, gvn(wp * .37 + 11.)) * .55);
    bank = mix(bank, vec3(.24, .33, .08), smoothstep(.7, .9, gvn(wp * 9.3)) * .45 * tk);
    bank *= 1. - .28 * tk * smoothstep(.3, .48, abs(fract(fr * 30.) - .5)) * step(.86, fr); }
  bank = mix(bank, vec3(.2, .185, .16) * (.6 + .8 * gh21(floor(wp * vec2(1.1, 2.3)))), smoothstep(.79, .8, fr) * (1. - smoothstep(.84, .86, fr)));
  c *= 1. - .35 * smoothstep(.7, .78, fr) * (1. - riser);
  c = mix(c, bank, riser);
  float fwp = sqrt(length(dFdx(wp)) * length(dFdy(wp)));
  if (wild > .004) {   // moso canopy: crowns in clumps with a lit and a shaded side, yellow-green crests, dark gullies
    float k2 = 1. - smoothstep(.6, 2.4, fwp), k3 = 1. - smoothstep(.2, .8, fwp), kn = 1. / (.5 + .32 * k2 + .18 * k3);
    vec2 sdx = vec2(sign(uSunX) * 1.3, .35), cw = wp + (vec2(gvn(wp * .05), gvn(wp * .05 + 7.)) - .5) * 10.;
    float ca = (gvn(cw * .1) * .5 + gvn(cw * .33 + 5.) * .32 * k2 + gvn(cw * 1.1 + 2.) * .18 * k3) * kn;
    float cb = (gvn((cw + sdx) * .1) * .5 + gvn((cw + sdx) * .33 + 5.) * .32 * k2 + gvn((cw + sdx * .5) * 1.1 + 2.) * .18 * k3) * kn;
    float lit = clamp(.5 + (ca - cb) * 5., 0., 1.), gul = smoothstep(.36, .62, gfbm(wp * .012 + 3.));
    vec3 wc = mix(uWild * .25, uWild * vec3(2.0, 2.05, 1.1), lit);
    wc = mix(wc, uWild * vec3(2.4, 2.55, 1.0), smoothstep(.54, .8, ca) * (.35 + .65 * lit));
    wc = mix(wc, uWild * .2, (1. - smoothstep(.2, .36, ca)) * .75);
    wc *= mix(.5, 1.08, gul) * (.82 + .36 * n1);
    c = mix(c, wc, wild);
  }
  vec2 pc = wp / 6.5, pid = floor(pc), pf = fract(pc); float ph = gh21(pid);
  float plot = step(.4, ph) * step(.07, pf.x) * step(pf.x, .93) * step(.09, pf.y) * step(pf.y, .91);
  float pr = fract((ph > .7 ? wp.x : wp.y) * 1.15);
  vec3 veg = mix(vec3(.12, .085, .055), mix(vec3(.1, .27, .06), vec3(.32, .43, .1), gh21(pid + 3.)), smoothstep(.2, .38, pr) * (1. - smoothstep(.7, .9, pr)) * (.6 + .4 * n3));
  vec3 yard = vec3(.36, .28, .18) * (.66 + .5 * n1) * (.82 + .36 * n3);
  yard = mix(yard, veg, plot * smoothstep(.25, .5, pad) * (1. - smoothstep(.93, .99, pad)));
  c = mix(c, yard, smoothstep(.03, .13, pad));
  c *= 1. - .3 * uWet;
  float cs = smoothstep(.42, .7, gfbm(wp * .0035 + uTime * .006 * vec2(1., .3)));
  c *= 1. - uCloud * .42 * cs;
  { vec2 sd = uSunV.xz / max(uSunV.y, .15); float shd = 0.;   // the rings' long shadows
    for (int i = 0; i < 5; i++) { vec4 rg = uRings[i]; vec2 d = wp - rg.xy; float L = max(rg.w - rg.z * .06 - vWp.y, 0.); vec2 a = -sd * L;
      float t = clamp(dot(d, a) / max(dot(a, a), 1e-3), 0., 1.); shd = max(shd, 1. - smoothstep(rg.z * .93, rg.z * .93 + 2. + L * .16, length(d - a * t))); }
    c *= mix(vec3(1.), vec3(.6, .68, .86), shd * step(.02, uSunV.y)); }   // a cool shadow, not a brown one
  diffuseColor.rgb = c;
}`;

// RANGE BEHIND RANGE (round 20): the far ridges' own look, laid over the kit's fragment shader (its geometry, its vertex shader and its uniforms are the
// kit's; vInfo = the rank from the nearest, 0, to the farthest, 1; the height on the rank as a share of its tallest peak; the rock's mottle).
//   uRankNear, uRankFar   the nearest rank's colour and the farthest's (a look's own pair, LOOKS.ranks): each rank between them is their mix by its
//                         place among the ranks (to the power uRankP.w, RANK_STEP: the lane's low mist veils the low ranks most, so the middle ranks
//                         are held a little nearer the dark one), so every rank behind is paler and bluer than the one before it;
//   uRankP.x, .y, uRankTop  each rank pales into the mist where the mist lies: RANK_FOOT of the mist's colour (uHaze, the scene's fog colour, which the
//                         world hands the ridges every frame) at and under one fixed height of the place (uRankTop: RANK_TOP, 26 m, the top of the valley's
//                         mist where it lies full; the same for the whole flight), falling by e for each RANK_FALL metres above it, on every rank alike;
//   uRankP.z              a little relief of its own (the facets toward the sun, the rock's mottle), less on each rank behind: no flat cut-out;
//   the sun-side glow of the kit stays in the mist at the feet and is faint on the rock.
const RANK_FOOT = 0.92, RANK_FALL = 16.4, RANK_RELIEF = 0.16, RANK_STEP = 1.15, RANK_TOP = 26;
const RIDGE_FRAG = /* glsl */`
uniform vec3 uHaze, uSunDir, uRim, uRankNear, uRankFar; uniform vec4 uRankP; uniform vec2 uQ; uniform float uRankTop;
varying vec3 vW; varying vec3 vInfo;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); if (n.y < 0.) n = -n;
  float l = max(dot(n, uSunDir), 0.), t = vInfo.x, foot = uRankP.x * exp(-max(vW.y - uRankTop, 0.) / uRankP.y);
  vec3 c = mix(uRankNear, uRankFar, pow(t, uRankP.w));
  c *= 1. + uRankP.z * (1. - .6 * t) * ((l - .35) * .9 + (vInfo.z - .5) * .5);
  c = mix(c, uHaze, foot);
  vec3 v = normalize(vW - cameraPosition);
  c += uRim * uQ.y * pow(max(dot(v, uSunDir), 0.), 6.) * (.12 + .5 * foot);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

export default {
  id: 'tulou-rings',
  name: 'Rings in the Tea Mist',
  category: 'city',
  weirdness: 0.05,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    // ---------- which visit is this ----------
    let hour = vary.hour; if (!hour || hour === 'any') hour = rng.pick(['day', 'day', 'golden', 'day', 'day', 'golden', 'night']);
    const lookId = hour === 'night' ? 'night' : hour === 'golden' ? 'golden' : 'morning', look = LOOKS[lookId], night = lookId === 'night';
    const season = rng.pick(['spring', 'spring', 'spring', 'autumn', 'newyear']), rain = !night && rng.chance(0.22), rare = !!vary.rare, parasols = rng.chance(0.5);
    // The visit's draws (hour, season, rain, parasols) come first from `rng`. What this version adds beside the things that draw from `rng` (more pickers by
    // the lane, a second rank of billows, four more swallow flocks) is drawn from `rngNew`, a side stream of its own made from the seed.
    const rngNew = makeRng('tulou-rings+' + (ctx.seed ?? 0));
    // A thing that stands by a rule of its own takes a stream of its own, made from the world's seed and the thing's name: it draws nothing from `rng`.
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // Where each cycle that runs on the world's clock stands when the clock starts (the well's windlass and bucket and the millstone in ring A, the line of
    // parasols, the walkers in the tea, the dragon): drawn, in this order, from 'cycle-phases'.
    const cyc = stream('cycle-phases'), PHASE = { windlass: cyc() * TAU, bucket: cyc() * TAU, mill: cyc() * TAU, parasols: cyc(), teaWalk: cyc() * TAU, dragon: cyc() * TAU };
    const pal = PALETTE.slice();
    if (season === 'autumn') pal[4] = '#8a7a34';
    const SUN = new THREE.Vector3().fromArray(look.sun).normalize(), sunLocal = [-SUN.x, SUN.y, -SUN.z];
    const MD = MIST_AS_DESIGNED, md = look.md, gain = MD ? 1 : look.gain, seaLitHex = (MD && md.seaLit) || look.seaLit, seaShadeHex = (MD && md.seaShade) || look.seaShade;
    const cMist = MD ? new THREE.Color(md.mist).multiplyScalar(md.k) : new THREE.Color(look.dome.hor).multiplyScalar(look.dome.kH), cMistFar = cMist.clone(), cClear = new THREE.Color(look.clear), cTea = new THREE.Color(pal[4]);   // the mist is the colour of the lid's horizon
    const scene = new THREE.Scene();
    scene.background = cMist.clone(); scene.fog = new THREE.FogExp2(cMist.clone(), 0.0065);
    const time = { value: 0 };

    // ---------- the flight ----------
    // the helix inside ring A: 625 degrees anticlockwise. The first whole turn at second-gallery height (10.5 m, radius 34.5: the posts 4.5 m off the wingtip,
    // lanterns, trays and washing reaching to within 2 m) with the galleries wheeling past; over the next third of a turn it sinks to 5.6 m at radius 28.3, and
    // the rest is flown low over the waking court (whatever is set out on its cobbles stands under 3 m: the stalls' awnings, the washing, the tea trays on
    // their mats, the ducks and the hens pass underneath), before it rises into the climb-out
    const LAPDEG = 625, NLAP = 50, lap = [], D2R = Math.PI / 180;
    const lapY = (d) => 10.5 - 4.9 * sstep(360, 480, d) + 4.9 * sstep(LAPDEG - 85, LAPDEG, d), lapR = (d) => 34.5 - 6.2 * sstep(360, 480, d) + 2.7 * sstep(LAPDEG - 85, LAPDEG, d);
    for (let i = 0; i <= NLAP; i++) { const d = (i / NLAP) * LAPDEG, a = d * D2R; lap.push([lapR(d) * Math.cos(a), lapY(d), lapR(d) * Math.sin(a)]); }
    // THE END, from ring E and the portal. Nothing here is a place chosen by hand: the numbers are margins and radii, and the rest is solved.
    //  - The run north is ONE straight line parallel to ring E's north axis, RUN_OFF outside its outer eave (ROOF.rEaveOut x the ring's scale + 4 = 71.08 m
    //    east of its centre). The route comes onto it from KEPT, the reveal's last point, and descends on ONE slope from KEPT all the way to the tip-over.
    //  - The last straight is the line through the portal's middle that comes down at DIVE; it begins TURN_D short of the portal.
    //  - The last turn is the circle of TURN_R in plan that touches both. Tangency fixes the straight's bearing b (from the portal, counted from east toward
    //    north): with L = TURN_D cos(DIVE), the plan distance of the turn's end from the centre, L cos(b) + TURN_R sin(b) + TURN_R = xRun. Of its two
    //    solutions the one with the LARGER turn is taken, b = atan2(TURN_R, L) + acos((xRun - TURN_R) / hypot(L, TURN_R)): its circle lies on the ring's
    //    side of the run, and the turn (90 degrees + b) comes round over the ring's north-east. (The other touches the run's line from outside.)
    //  - The nose comes down to DIVE on an arc of KNEE_R in the vertical that ends where the turn ends: turn and tip-over are finished together, and
    //    from there the route is one straight line, in plan and in pitch, to the middle of the portal.
    //  - TURN_D is the smallest length, searched upward from 45 m in half metres, for which the whole turn and the whole straight pass at least
    //    CLEAR + CLEAR_MARGIN from every part of ring E's roof: the true distance, in the ring's section, to the roof's own outline (roofSection: both
    //    slopes, the ridge cap, and the tallest ridge block taken as standing all the way round, so the answer is the same on every seed), tested every
    //    quarter metre of route. The margin covers the quarter metre between tests and the spline, which is laid through points END_SP apart on this
    //    curve and leaves it by centimetres.
    // The path's length, and with it every u and every time of the flight, falls where these put it. (As ring E stands: TURN_D 49.5 m, b 48.0 degrees, a
    // turn of 138.0 degrees and 57.8 m, the slope 3.0 degrees, the least distance to the roof 6.30 m, over the ridge, 65 m before the portal.)
    const ENTRY = [LANE_X, 4, -180], KEPT = [84, 41.5, 156], RE = RING.E, RUN_OFF = 4, TURN_R = 24, KNEE_R = 31, CLEAR = 6, CLEAR_MARGIN = 0.25, END_SP = 2.5, RUN_SP = 30;
    const xRun = ROOF.rEaveOut * RE.s + RUN_OFF, roofSec = roofSection().map(([r, y]) => [r * RE.s, RE.y + y * RE.s]);
    const roofDist = (q) => { const r = Math.hypot(q[0] - RE.x, q[2] - RE.z); let best = 1e9;   // the true distance from a point to ring E's roof (a solid of revolution: the distance to its section)
      for (let i = 0; i + 1 < roofSec.length; i++) { const a = roofSec[i], b = roofSec[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], t = sat(((r - a[0]) * ex + (q[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)); best = Math.min(best, Math.hypot(r - a[0] - ex * t, q[1] - a[1] - ey * t)); }
      return best; };
    const endAt = (TURN_D) => {
      const L = TURN_D * Math.cos(DIVE), hyp = Math.hypot(L, TURN_R); if (xRun - TURN_R > hyp) return null;   // so short a straight that no circle of TURN_R touches both lines
      const b = Math.atan2(TURN_R, L) + Math.acos((xRun - TURN_R) / hyp), TH = Math.PI / 2 + b, DHX = Math.cos(b), DHZ = Math.sin(b);
      const str = (d) => [PORTAL[0] + d * Math.cos(DIVE) * DHX, PORTAL[1] + d * Math.sin(DIVE), PORTAL[2] + d * Math.cos(DIVE) * DHZ];   // the last straight, d metres short of the portal
      const T0 = str(TURN_D), arc = TH * TURN_R, zT = T0[2] - DHX * TURN_R, X = RE.x + xRun;   // the turn's end and its length; (X, zT): where it begins, on the run's line
      const nRun = Math.max(1, Math.ceil((zT - KEPT[2]) / RUN_SP)), dz = (zT - KEPT[2]) / nRun, run = Math.hypot(X - KEPT[0], dz) + (nRun - 1) * dz;   // the run north in nRun equal steps (none longer than RUN_SP), the first of them from KEPT onto the line
      // the one slope p from KEPT to the tip-over: the height lost over the run and the turn at p, and the knee's own drop, make the height from KEPT down to T0
      let p = 0.07; for (let i = 0; i < 30; i++) p = Math.atan((KEPT[1] - T0[1] - KNEE_R * (Math.cos(p) - Math.cos(DIVE))) / (run + arc - KNEE_R * (DIVE - p)));
      const sk = KNEE_R * (DIVE - p);   // the knee's length along the route
      const turnAt = (a) => { const s = a * TURN_R, c = Math.cos(a), sn = Math.sin(a), vx = -DHZ * TURN_R, vz = DHX * TURN_R;   // a point of the last turn, a radians of turn before its end
        const y = T0[1] + (s <= sk ? KNEE_R * (Math.cos(DIVE - s / KNEE_R) - Math.cos(DIVE)) : KNEE_R * (Math.cos(p) - Math.cos(DIVE)) + (s - sk) * Math.tan(p));
        return [T0[0] - vx + vx * c + vz * sn, y, T0[2] - vz - vx * sn + vz * c]; };
      let clear = 1e9; for (let s = arc; s > 0; s -= 0.25) clear = Math.min(clear, roofDist(turnAt(s / TURN_R))); for (let d = TURN_D; d >= 0; d -= 0.25) clear = Math.min(clear, roofDist(str(d)));
      return { TURN_D, b, TH, p, sk, arc, T0, X, zT, nRun, dz, str, turnAt, clear };
    };
    let END = null; for (let d = 45; d < 90 && !(END && END.clear >= CLEAR + CLEAR_MARGIN); d += 0.5) END = endAt(d);
    const TURN_D = END.TURN_D, T0 = END.T0, str = END.str, turnAt = END.turnAt, rest = TURN_D - 2 * END_SP;
    const runPts = [], turnPts = [], yTurn = turnAt(END.TH)[1], nTurn = Math.round(END.arc / END_SP);
    for (let k = 1; k < END.nRun; k++) runPts.push([END.X, yTurn + Math.tan(END.p) * (END.nRun - k) * END.dz, KEPT[2] + k * END.dz]);   // on the run's line, on the one slope
    for (let k = nTurn; k >= 1; k--) turnPts.push(turnAt(END.TH * k / nTurn));   // round the turn every END_SP; the first is the turn's first point, on the run's line
    const TURN_IN = turnPts[0];
    await ctx.yield();
    const path = makePath([ENTRY, [LANE_X, 4, -150], [LANE_X, 4, -120], [33.6, 4.2, -98],
      [33, 5, -80], [31, 10, -64], [28.5, 19, -50], [26, 24.3, -37.5], [22, 22, -30], [21.5, 18.5, -23], [25, 15, -15], [31, 12, -7], ...lap,
      [7, 14, -29.5], [19, 23.5, -28], [33, 27, -28], [50, 31, -22],
      [66, 37, -10], [76, 42.5, 12], [78, 45.5, 44], [79, 46, 84], [81.5, 44.5, 124], KEPT,   // the reveal, then north along the mist sea, over ring B's west roof, ring S to the right
      ...runPts,                                                                               // on north past ring E's east flank, along the run's line
      ...turnPts,                                                                              // the last turn
      T0, str(TURN_D - END_SP), str(rest), str(rest * 2 / 3), str(rest / 3), PORTAL]);   // (from T0 on the points lie on one line: the curve settles onto it within END_SP and is exactly straight from there to the portal)
    const duration = 48;
    // Every scripted beat below is keyed in METRES OF ROUTE, counted from a place found on the path itself (mRidge, mLap0, ...: the metres flown where the
    // route passes that place). Points of interest, the flocks and pace() are handed the fraction of the route (metres / LEN).
    const LEN = path.length;
    await ctx.yield();
    const _pp = new THREE.Vector3();
    const uOf = (p, lo, hi) => { let b = lo, bd = 1e9; for (let i = 0; i <= 500; i++) { const u = lo + (hi - lo) * i / 500; path.pointAt(u, _pp); const d = _pp.distanceToSquared(_pp2.set(p[0], p[1], p[2])); if (d < bd) { bd = d; b = u; } } return b; };
    const _pp2 = new THREE.Vector3();
    await ctx.yield();
    const mRidge = uOf([26, 24.3, -37.5], 0.05, 0.3) * LEN; await ctx.yield();
    const mLap0 = uOf(lap[0], 0.1, 0.35) * LEN; await ctx.yield();
    const mLap1 = uOf(lap[NLAP], 0.3, 0.7) * LEN; await ctx.yield();
    const mOut = uOf([50, 31, -22], 0.4, 0.75) * LEN; await ctx.yield();
    const mApp = uOf([82.5, 43.2, 140], 0.55, 0.9) * LEN; await ctx.yield();   // on the run north, 140 m short of ring E's centre line: where the last act begins
    // two places of the end, found on the route itself by walking it in quarter metres from where the last act begins: where it meets the last turn (the turn's
    // first point, on the run's line: the pace eases there), and where it crosses ring E's ridge circle on the way in (over the roof ridge)
    const dOn = (f, d0) => { let d = d0; while (d < path.length && !f(path.posAtDist(d, _pp))) d += 0.25; let lo = Math.max(d0, d - 0.25), hi = d; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (f(path.posAtDist(m, _pp))) hi = m; else lo = m; } return hi; };
    const mTurn = dOn((q) => q.z >= TURN_IN[2], mApp), mEIn = dOn((q) => Math.hypot(q.x - RE.x, q.z - RE.z) <= ROOF.rRidge * RE.s, mTurn);
    const lapM = (deg) => mLap0 + (mLap1 - mLap0) * deg / LAPDEG;   // the metres flown at so many degrees of the helix, taking the helix as even (the flocks' and the gates' own measure)
    await ctx.yield();
    // how far round the helix the flight is, in degrees (0 at its east point, 625 where it ends), read from the place itself
    const lapDeg = (ur) => { const f = sat((ur * LEN - mLap0) / (mLap1 - mLap0)); path.pointAt(sat(ur), _pp); const a = Math.atan2(_pp.z, _pp.x) / D2R, d0 = f * LAPDEG; return Math.min(LAPDEG, Math.max(0, a + 360 * Math.round((d0 - a) / 360))); };

    // ---------- the land: a shelf of tea terraces stepping down eastward, hill to the west, valley to the east ----------
    const pads = Object.values(RING).map((r) => ({ x: r.x, z: r.z, y: r.y - 0.4 * r.s, r: 59 * r.s * (r.sq ? 1.2 : 1) }));
    const qAt = (x, z) => {
      const dz = z - Math.min(-60, Math.max(-235, z)), m = sstep(16, 90, Math.hypot(x - LANE_X, dz));
      return 0.5 + (LANE_X - x) * QS + m * 0.5 * noise.fbm2(x * 0.0042 + 3.1, z * 0.0042 - 1.7, 3);
    };
    const padAt = (x, z) => { let w = 0; for (const p of pads) w = Math.max(w, 1 - sstep(p.r, p.r + 17, Math.hypot(x - p.x, z - p.z))); return w; };
    const heightAt = (x, z) => {
      const q = qAt(x, z), f = Math.floor(q);
      let h = STEP * (f + sstep(0.8, 1, q - f)) + 0.5;
      if (x < -190) {   // the west hill: a broken crest instead of a level plateau
        const k = 0.8 + 0.5 * noise.fbm2(z * 0.0042 + 9.3, x * 0.0021 - 4.1, 3);
        h += 120 * k * (1 - Math.exp(-Math.pow(-190 - x, 1.25) * 0.085 / 120)) + sstep(-250, -520, x) * 24 * noise.fbm2(x * 0.011 + 2.2, z * 0.011 + 6.4, 2);
      }
      if (x > 240) h -= sstep(240, 460, x) * 34;
      for (const p of pads) { const w = 1 - sstep(p.r, p.r + 17, Math.hypot(x - p.x, z - p.z)); if (w > 0) h += (p.y - h) * w; }
      return h;
    };
    const ringV = Object.values(RING).map((r) => new THREE.Vector4(r.x, r.z, 52 * r.s * (r.sq ? 1.12 : 1), r.y + 20 * r.s));   // centre, outer eave radius, ridge height
    const MIST = { uMistCol: { value: new THREE.Color() }, uMistG: { value: new THREE.Vector4(0, 0.3, 0, 3.4) }, uHole: { value: new THREE.Vector4(RING.E.x, RING.E.z, 0, 72) }, uRings: { value: ringV }, uSunV: { value: SUN } };
    const mistU = () => ({ uMist: { value: new THREE.Vector4(0, 0, 0, 0) }, uMistCol: MIST.uMistCol });
    const mA = mistU(), mE = mistU(), mO = mistU();
    // any MeshStandardMaterial of the world dissolves into the mist sea below its (noisy) top, like the rings do
    const MIST_FRAG = `{ float mN = (gvn(vMw.xz * .05 + uTime * .03) - .5) * 5. + (gvn(vMw.xz * .21 - uTime * .05) - .5) * 1.8;
      float mH = 1. - uHole.z * (1. - smoothstep(uHole.w * .5, uHole.w * 1.45, length(vMw.xz - uHole.xy)));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, uMistCol * (.87 + .2 * gvn(vMw.xz * .012 - uTime * .011 + 3.) + .08 * gvn(vMw.xz * .041 + uTime * .017)), uMistG.z * mH * (1. - smoothstep(uMistG.x - 3.6 + mN, uMistG.x + 1.6 + mN, vMw.y)) * smoothstep(uMistG.y, uMistG.w, uMistG.x - vMw.y + mN * .5)); }\n#include <fog_fragment>`;
    const mistify = (sh, own) => {
      sh.uniforms.uMistCol = MIST.uMistCol; sh.uniforms.uMistG = MIST.uMistG; sh.uniforms.uHole = MIST.uHole; sh.uniforms.uTime = time;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMw;')
        .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 mw = vec4(transformed, 1.);\n#ifdef USE_INSTANCING\nmw = instanceMatrix * mw;\n#endif\nvMw = (modelMatrix * mw).xyz; }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vMw; uniform vec3 uMistCol; uniform vec4 uMistG, uHole;\n${own ? '' : 'uniform float uTime;\n' + GLSL_N}`)
        .replace('#include <fog_fragment>', MIST_FRAG);
    };
    const wildAt = (x, z) => { const wn = 34 * noise.fbm2(z * 0.007 + 1.7, x * 0.004, 2); return Math.max(sstep(-262 + wn, -318 + wn, x), sstep(360, 430, z), sstep(-250, -330, z), sstep(300, 380, x)); };   // tea bands climb the foot of the hill
    const U = { // shared uniforms of the ground and the tea rows
      uTime: time, uCloud: { value: 0 }, uWet: { value: rain ? 1 : 0 }, uTea: { value: cTea.clone().multiplyScalar(season === 'autumn' ? 1.0 : 0.95) },
      uTip: { value: new THREE.Color(season === 'autumn' ? '#c79a3a' : '#9cc34a') }, uWild: { value: new THREE.Color(look.wild || '#2f4f22') }, uSunX: { value: SUN.x }, uDew: { value: night ? 0.6 : 1.6 },
      uRings: MIST.uRings, uSunV: MIST.uSunV,
    };
    {
      const axis = (a, b, step) => { const v = []; for (let x = a; x <= b + 1e-3; x += step) v.push(x); let d = step, lo = a, hi = b; for (let i = 0; i < 19; i++) { d *= 1.28; lo -= d; hi += d; v.unshift(lo); v.push(hi); } return v; };
      const xs = axis(-150, 190, 3.4), zs = axis(-232, 346, 3.4), nx = xs.length, nz = zs.length;
      const pos = new Float32Array(nx * nz * 3), aG = new Float32Array(nx * nz * 4), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
      for (let j = 0, k = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++, k++) {
          const x = xs[i], z = zs[j];
          pos[k * 3] = x; pos[k * 3 + 1] = heightAt(x, z); pos[k * 3 + 2] = z;
          aG[k * 4] = qAt(x, z); aG[k * 4 + 1] = padAt(x, z); aG[k * 4 + 2] = wildAt(x, z);
        }
        if (j % 16 === 15) await ctx.yield();
      }
      for (let j = 0, t = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + nx; idx[t++] = a; idx[t++] = b; idx[t++] = a + 1; idx[t++] = a + 1; idx[t++] = b; idx[t++] = b + 1; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.BufferAttribute(aG, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      g.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.96, metalness: 0 });
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aG; varying vec4 vG; varying vec3 vWp;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvG = aG; vWp = position;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec4 vG; varying vec3 vWp; uniform float uTime, uCloud, uWet, uSunX; uniform vec3 uTea, uTip, uWild, uSunV; uniform vec4 uRings[5];\n${GLSL_N}`)
          .replace('#include <color_fragment>', '#include <color_fragment>\n' + GROUND_FRAG);
        mistify(sh, true);
      };
      mat.customProgramCacheKey = () => 'tulou-ground';
      const ground = new THREE.Mesh(g, mat); ground.name = 'ground'; scene.add(ground);
    }
    await ctx.yield();

    // ---------- the rings ----------
    const festival = season === 'newyear', persimmon = season === 'autumn';
    const smokeTint = night ? [0.3, 0.36, 0.52] : look === LOOKS.golden ? [1, 0.9, 0.76] : [1, 1, 1];
    // THE PEOPLE OF THE LANE work the aisles between the rows of tea, by the rows' own rule. The lane (x = LANE_X) runs from its south end to the footbridge
    // (LANE_Z); the rows lie along it, AISLE apart, and aisle j is (j + 0.5) x AISLE from the lane's line. Whoever works beside the lane takes an aisle and a
    // place along the lane's length, both drawn from the stream 'lane-pickers': a side of the lane; any aisle between two of the lane's own rows
    // (LANE_AISLES), from the first that lies between two rows beyond the lane's verge (aisle 1, 1.95 m off the line: aisle 0 is the lane's own slab) to
    // the last whose two rows are both the lane's own: the rows within LANE_ROWS (10 m) of the lane, which the planting gives the fuller hedge (with
    // these numbers aisle 6, 8.44 m off the line); a place between the lane's two ends with room for the beat.
    // What keeps them out of the eye's way is ONE margin in space, the same for every aisle and all along the lane: no part of a beat lies nearer, in
    // plan, to the line that is flown than LANE_KEEP, 5 m: two and a half times the height of a person under a hat, so that the eye, which flies 4 m
    // over the lane, passes every figure well to their side, never over their head or through their reach. The margin is tested along the whole beat (at
    // nine places from one end to the other). The random pickers further out keep 12 m. Two in one aisle keep their beats 1.5 m apart.
    // A seat is drawn until one is clear, up to LANE_TRIES times. Beside the stretch that is flown the first three aisles lie inside the margin (they are
    // clear only south of where the flight begins), so about one draw in two is turned down there. If none of the sixty is clear (the aisles would have to
    // be full) the worker takes the last place drawn, moved out to the furthest of those aisles: the margin holds there all along the lane, and only the 1.5 m between two
    // beats can then be lost.
    // The stream deals, in this order: the carrier with the shoulder pole, the three walkers under parasols, the seven pickers of `rng`, the seven of `rngNew`.
    const AISLE = 1 / (ROWS * QS), LANE_Z = [-228, -99.5], LANE_KEEP = 5, LANE_AISLES = [1, Math.floor(LANE_ROWS / AISLE) - 1], LANE_TRIES = 60, lanePick = stream('lane-pickers'), laneTaken = [];
    const laneClear = (x, z, amp) => { for (let k = -4; k <= 4; k++) if (path.nearestXZ(x, z + amp * k / 4).dist <= LANE_KEEP) return false; return true; };
    const laneSpot = (amp) => { let side = 1, j = LANE_AISLES[1], x = 0, z = 0, ok = false;
      for (let tr = 0; tr < LANE_TRIES && !ok; tr++) {
        side = lanePick.sign(); j = lanePick.int(LANE_AISLES[0], LANE_AISLES[1]); x = LANE_X + side * (j + 0.5) * AISLE; z = lanePick.range(LANE_Z[0] + amp, LANE_Z[1] - amp);
        ok = laneClear(x, z, amp) && !laneTaken.some((o) => o.side === side && o.j === j && Math.abs(o.z - z) < o.amp + amp + 1.5);
      }
      if (!ok) { j = LANE_AISLES[1]; x = LANE_X + side * (j + 0.5) * AISLE; }
      laneTaken.push({ side, j, z, amp }); return { x, z }; };
    const CARRY_HALF = 4.2, carrier = laneSpot(CARRY_HALF), TEA_WALK = { gap: 2.3, sway: 2.5 }, teaWalk = laneSpot(TEA_WALK.gap + TEA_WALK.sway);
    // villagers outside the walls, in the hero's own instanced figures (hero-local: x and z flipped): one leaning on the parapet of the footbridge over the rill,
    // looking up it (on the half of the deck away from the lane), a neighbour stopped at the bridge's foot on that side, and the carrier pacing his aisle.
    const rillX = LANE_X - 3 / (ROWS * QS), deckY = (dx) => 0.6 + 0.72 * (1 - (dx / 2.3) * (dx / 2.3));   // (RILL_X, below; the bridge deck's height dx metres from its crown)
    const folk = [{ x: -(rillX - 1.9), z: 97 - 0.32, y: deckY(1.9), heading: Math.PI, bend: 0.1, speed: 0.5 }, { x: -(rillX - 3.24), z: 97 + 0.15, y: heightAt(rillX - 3.24, -97.15) + 0.02, heading: Math.PI / 2 - 0.3, bend: 0.06, speed: 0.4 },
      { x: -carrier.x, z: -carrier.z, y: heightAt(carrier.x, carrier.z) + 0.02, walk: { dir: Math.PI / 2, half: CARRY_HALF } }];
    const hero = await buildHero(ctx, { palette: pal, sunDir: sunLocal, lanternGlow: look.glow, shafts: look.shafts, festival, persimmon, wet: rain ? 1 : 0, smokeTint, mist: mA, shade: look.shade, sky: look.skyC, fill: look.fill, folk, phases: PHASE,
      extraSmoke: [[-17.5, 2.5, 36.5, 0.62], [-27, 2.5, 30.2, 0.7], [-35, 2.5, 20.4, 0.6]] });   // three columns under the climb-out (hero-local: x and z flipped)
    hero.object.rotation.y = Math.PI; scene.add(hero.object);
    const heroRibs = hero.object.children.filter((o) => o.name === 'roof-ribs');
    hero.object.updateMatrixWorld(true); const ribBoxesW = hero.ribBoxes.map((bx) => bx.clone().applyMatrix4(hero.object.matrixWorld));   // a box round each stretch of the roof's real rib tiles, in the world's space
    await ctx.yield();
    const lc = new THREE.Color(look.sky.lightColor), bk = look.sky.lightIntensity * 0.17 * sat(SUN.y * 3);
    if (look.bounce) hero.setBounce(look.bounce[0], look.bounce[1], look.bounce[2]); else hero.setBounce(lc.r * bk * 0.75, lc.g * bk * 0.69, lc.b * bk * 0.58);
    const ringOpts = { palette: pal, sunDir: sunLocal, bounce: look.bounce || [lc.r * bk, lc.g * bk * 0.92, lc.b * bk * 0.78], lanternGlow: look.glow, festival, persimmon, wet: rain ? 1 : 0, smokeTint, sky: look.skyC, fill: look.fill };
    const ringE = await buildRing(ctx, { ...ringOpts, name: 'E', lod: 1, bays: 40, inner: true, animals: true, people: true, shade: look.shade, mist: mE });
    const ringB = await buildRing(ctx, { ...ringOpts, festival: false, name: 'B', lod: 2, roofSeg: 56, mist: mO, life: { scale: (RING.B.s + RING.C.s) / 2 } });   // the small rings keep one set of lanterns at New Year (triangles)
    const ringS = await buildRing(ctx, { ...ringOpts, festival: false, name: 'S', lod: 2, square: RING.S.sq, mist: mO, life: { scale: RING.S.s } });   // (life: the yard's own things at true size: ring B's one build stands twice, as B and as C, so it is built for the mean of the two scales)
    const place = (obj, r) => { obj.position.set(r.x, r.y, r.z); obj.rotation.y = Math.PI; obj.scale.setScalar(r.s); scene.add(obj); return obj; };
    const others = [place(ringE.object, RING.E), place(ringB.object, RING.B), place(ringS.object, RING.S), place(ringB.object.clone(), RING.C)];
    await ctx.yield();

    // ---------- stone things: the tilted portal kerb, slab paths and steps, the rill's gutter, a footbridge, far rings ----------
    const props = new Soup();
    const stone = (k = 1) => { const g = rng.range(0.24, 0.38) * k; return [g * 1.05, g, g * 0.9]; };
    { // the well in ring E's innermost court, under the portal's middle: ROUND, as a well is. A low ring of dressed stone lying on the cobbles, 15.4 m across
      // its opening, its top 1.2 m up, still water in the shaft (WELL_WATER up). The portal stands over it leaning back 28 degrees from upright to face the
      // last straight square on: its low rim hangs 0.3 m over the water, 3.3 m from the middle on the side the flight comes from; its high rim is 12.8 m up
      const KX = PORTAL[0], KZ = PORTAL[2], seg = 44, WW = WELL_WATER;
      const kp = (a, r, y) => [KX + Math.cos(a) * r, y, KZ + Math.sin(a) * r];
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * TAU, a1 = ((i + 1) / seg) * TAU, am = (a0 + a1) / 2, c = stone(1.02), c2 = stone(0.8), out = [Math.cos(am), 0.2, Math.sin(am)];
        const dk = [c2[0] * 0.5, c2[1] * 0.5, c2[2] * 0.5], top = i % 11 === 5 ? 1.5 : 1.2;   // four capstones stand a little proud
        props.quad(kp(a0, 7.7, top), kp(a1, 7.7, top), kp(a1, 9.1, top), kp(a0, 9.1, top), c, c, [0, 1, 0]);                         // the worn top
        props.quad(kp(a0, 9.1, top), kp(a1, 9.1, top), kp(a1, 9.4, 0.42), kp(a0, 9.4, 0.42), c2, dk, out);                            // the outer face, battered
        props.quad(kp(a0, 9.4, 0.42), kp(a1, 9.4, 0.42), kp(a1, 10.7, 0.36), kp(a0, 10.7, 0.36), c2, c2, [0, 1, 0]);                  // a step round it
        props.quad(kp(a0, 10.7, 0.36), kp(a1, 10.7, 0.36), kp(a1, 10.8, 0.0), kp(a0, 10.8, 0.0), dk, dk, out);
        props.quad(kp(a0, 7.7, top), kp(a1, 7.7, top), kp(a1, 7.55, WW), kp(a0, 7.55, WW), c2, [0.03, 0.03, 0.035], [-out[0], 0.2, -out[2]]);   // the shaft, going dark
        props.quad(kp(a0, 7.55, WW), kp(a1, 7.55, WW), kp(a1, 0.01, WW), kp(a0, 0.01, WW), [0.03, 0.035, 0.04], [0.012, 0.016, 0.02], [0, 1, 0]);   // still water in it
        if (top > 1.3) { props.quad(kp(a0, 7.7, 1.2), kp(a0, 9.1, 1.2), kp(a0, 9.1, top), kp(a0, 7.7, top), c2, c, [Math.sin(a0), 0, -Math.cos(a0)]); props.quad(kp(a1, 7.7, 1.2), kp(a1, 9.1, 1.2), kp(a1, 9.1, top), kp(a1, 7.7, top), c2, c, [-Math.sin(a1), 0, Math.cos(a1)]); }
      }
    }
    await ctx.yield();
    const curveOf = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])));
    const layPath = (pts, w, lift = 0.16) => {
      const cv = curveOf(pts), n = Math.max(2, Math.round(cv.getLength() / 1.3)), a = new THREE.Vector3(), b = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        cv.getPointAt(i / n, a); cv.getPointAt((i + 0.93) / n, b);
        const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, jw = rng.range(0.82, 1.06), px = -dz / l * w / 2 * jw, pz = dx / l * w / 2 * jw;
        const y = Math.max(heightAt(a.x, a.z), heightAt(b.x, b.z)) + lift, c = stone(), dk = [c[0] * 0.45, c[1] * 0.45, c[2] * 0.45];
        const top = [[a.x - px, y, a.z - pz], [a.x + px, y, a.z + pz], [b.x + px, y, b.z + pz], [b.x - px, y, b.z - pz]], cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
        props.quad(top[0], top[1], top[2], top[3], c, c, [0, 1, 0]);
        for (let e = 0; e < 4; e++) { const p0 = top[e], p1 = top[(e + 1) % 4]; props.quad(p0, p1, [p1[0], y - 0.45, p1[2]], [p0[0], y - 0.45, p0[2]], c, dk, [(p0[0] + p1[0]) / 2 - cx, 0, (p0[2] + p1[2]) / 2 - cz]); }   // a slab has sides: it beds into the ground instead of floating on it
      }
      return cv;
    };
    const RILL_X = LANE_X - 3 / (ROWS * QS);
    layPath([[LANE_X, -228], [LANE_X, -170], [LANE_X, -99.5]], 1.7, 0.1); layPath([[LANE_X, -99], [32.4, -97]], 1.6, 0.1);
    layPath([[27.8, -97], [22, -91], [10, -72], [1, -60.5]], 1.9, 0.14);
    await ctx.yield();
    layPath([[36, -150], [70, -146], [120, -151], [185, -140]], 1.6, 0.3);
    layPath([[52, 26], [58, 48], [46, 70], [31, 80]], 1.9, 0.3); layPath([[58, 48], [72, 62], [76, 120], [58, 162], [22, 171], [15, 174]], 1.9, 0.3);
    layPath([[60, 47], [90, 44], [119, 49.5]], 1.7, 0.3);
    await ctx.yield();
    const parasolCurve = layPath([[44, 73], [0, 75], [-50, 68], [-83, 61]], 1.7, 0.3);
    for (const s of [-1, 1]) for (let z = -228; z < -70; z += 1.6) { const c = stone(1.1), x = RILL_X + s * 0.42, l = rng.range(1.3, 1.5); props.box(x, 0.42, z, 0.24, 0.2, l, c, { skip: 'b', taper: 0.02 }); }
    { // the footbridge over the rill
      const arch = (u) => 0.72 * (1 - (2 * u - 1) * (2 * u - 1)), cB = stone(1.15);
      props.push(RILL_X, 0.5, -97);
      props.grid(8, 1, (u, v) => [(u - 0.5) * 4.6, 0.1 + arch(u), (v - 0.5) * 1.5, stone(1.2)], { up: [0, 1, 0] });
      for (const s of [-1, 1]) {
        props.grid(8, 1, (u, v) => { const x = (u - 0.5) * 4.6, top = 0.1 + arch(u) + 0.42, bot = Math.max(0, arch(u) - 0.45) * (Math.abs(u - 0.5) < 0.3 ? 1 : 0); return [x, bot + (top - bot) * v, s * 0.78, [cB[0] * (0.6 + 0.4 * v), cB[1] * (0.6 + 0.4 * v), cB[2] * (0.6 + 0.4 * v)]]; }, { up: [0, 0, s] });
        props.grid(8, 1, (u, v) => { const x = (u - 0.5) * 4.6, top = 0.1 + arch(u) + 0.42; return [x, top - 0.35 * v, s * 0.62, [cB[0] * 0.7, cB[1] * 0.7, cB[2] * 0.7]]; }, { up: [0, 0, -s] });
      }
      props.grid(8, 1, (u, v) => [(u - 0.5) * 4.6, Math.max(0, arch(u) - 0.45) * (Math.abs(u - 0.5) < 0.3 ? 1 : 0), (v - 0.5) * 1.56, [cB[0] * 0.3, cB[1] * 0.3, cB[2] * 0.32]], { up: [0, -1, 0] });   // the soffit
      for (const s of [-1, 1]) { props.box(s * 2.75, -0.5, 0, 1.3, 0.6, 2.1, [cB[0] * 0.9, cB[1] * 0.9, cB[2] * 0.9], { taper: 0.06, skip: 'b' }); for (const q of [-1, 1]) props.box(s * 2.35, -0.3, q * 0.78, 0.36, 1.1, 0.36, cB, { taper: 0.04, skip: 'b' }); }   // abutments and end posts
      props.pop();
    }
    await ctx.yield();
    const farRings = [];
    const farMist = (() => { const a = new THREE.Color(seaLitHex), b = new THREE.Color(seaShadeHex), mx = Math.max(a.r, a.g, a.b), cap = night ? 0.5 : SEA_CAP; if (mx > cap || !night) a.multiplyScalar(cap / mx); b.lerp(a, 0.66).multiplyScalar(1.1); return [b.r, b.g, b.b]; })();   // the sea's colour, for mounds that melt into it
    for (let i = 0; i < 9; i++) { // nine more rings on lower spurs, out in the mist
      const a = rng.range(-1.25, 1.9), r = rng.range(400, 900), x = Math.cos(a) * r, z = 60 + Math.sin(a) * r, y = rng.range(3, 13), s = rng.range(0.6, 1.1);
      const e = [0.5 * rng.range(0.8, 1.1), 0.3, 0.13], t = [0.09, 0.095, 0.1], g = [0.1, 0.19, 0.07], d = [0.05, 0.045, 0.04];
      props.M.makeScale(s, s, s).setPosition(x, y, z);
      const gm = [mix(g[0], farMist[0], 0.6), mix(g[1], farMist[1], 0.6), mix(g[2], farMist[2], 0.6)], es = [e[0] * 0.4, e[1] * 0.4, e[2] * 0.45], ef = [e[0] * 0.66, e[1] * 0.66, e[2] * 0.7], wd = [0.035, 0.03, 0.03];
      props.lathe([[110, -40, farMist], [66, -2.5, farMist], [53, -0.3, gm], [50.3, 0, gm]], 18);
      props.lathe([[50.3, 0, ef], [49.7, 4.5, e], [48.5, 13.4, e], [48.35, 14.3, es], [48, 17, es]], 20);
      for (let k = 0; k < 22; k++) for (const [wy, off, rr] of [[8.6, 0, 49.3], [12.0, 0.5, 48.85]]) {   // dark window slots, two rows
        const a = (k + off) / 22 * TAU, sa = Math.sin(a), ca = Math.cos(a), hw = 1.15;
        props.quad([sa * rr - ca * hw, wy, ca * rr + sa * hw], [sa * rr + ca * hw, wy, ca * rr - sa * hw], [sa * rr + ca * hw, wy + 1.9, ca * rr - sa * hw], [sa * rr - ca * hw, wy + 1.9, ca * rr + sa * hw], wd, wd, [sa, 0, ca]);
      }
      props.lathe([[52, 16.5, t], [45.4, 20, t], [37.2, 15.5, t]], 20); props.lathe([[39, 15.5, d], [39, 0, d]], 20); props.lathe([[39, 0.2, [0.2, 0.19, 0.17]], [0.1, 0.2, [0.22, 0.2, 0.18]]], 12);
      farRings.push([x, y, z, s]);
    }
    props.M.identity();
    await ctx.yield();
    if (festival) for (const r of Object.values(RING)) for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
      const xl = sx * (5.2 + k * 3.4), red = [0.74 * (k ? 0.85 : 1), 0.05, 0.03], gold = [0.9, 0.55, 0.08], hw = 0.8 * r.s;
      const zw = (yl) => r.z - ((r.sq ? 48.0 + 0.45 * (1 - (yl - 2) / 15) : Math.sqrt((48.0 + 0.45 * (1 - (yl - 2) / 15)) ** 2 - xl * xl)) + (r.sq ? 0.85 : 0.4)) * r.s;
      const x = r.x + xl * r.s, y1 = r.y + (14.6 - k * 0.8) * r.s, y0 = r.y + (6.2 + k * 1.3) * r.s, ym = y1 - 0.5 * r.s, yn = y0 + 0.5 * r.s;
      const P4 = (ya, yb, yla, ylb, c) => props.quad([x - hw, ya, zw(yla)], [x + hw, ya, zw(yla)], [x + hw, yb, zw(ylb)], [x - hw, yb, zw(ylb)], c, c, [0, 0, -1]);
      P4(y0, yn, 6.2 + k * 1.3, 6.7 + k * 1.3, gold); P4(yn, ym, 6.7 + k * 1.3, 14.1 - k * 0.8, red); P4(ym, y1, 14.1 - k * 0.8, 14.6 - k * 0.8, gold);
    }
    const propMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
    propMat.onBeforeCompile = (sh) => {   // dressed stone: mottled, pitted, mossy where it is grey (the far rings' earth and the banners keep their colour)
      mistify(sh, false);
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        { float n1 = gfbm(vMw.xz * 1.3 + vMw.y * 2.1), n2 = gvn(vMw.xz * 9. + vMw.y * 7.), n3 = gvn(vMw.xz * .35 + 4.), fd = 1. - smoothstep(30., 110., length(vMw - cameraPosition));
          vec3 c0 = diffuseColor.rgb; float grey = 1. - smoothstep(.06, .22, abs(c0.r - c0.b) / max(c0.r, .05));
          diffuseColor.rgb *= mix(1., (.7 + .55 * n1) * (.86 + .28 * n2), fd);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.09, .14, .05) * (.7 + .6 * n2), smoothstep(.5, .78, n3 * .55 + n1 * .45) * .55 * grey * fd); }`);
    };
    propMat.customProgramCacheKey = () => 'tulou-stone';
    await ctx.yield();
    const propMesh = new THREE.Mesh(props.toGeometry(), propMat); propMesh.name = 'stonework'; scene.add(propMesh);
    { // water running in the rill
      const g = new THREE.PlaneGeometry(0.62, 160, 1, 40); g.rotateX(-Math.PI / 2); g.translate(RILL_X, 0.52, -149);
      const rill = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), uTime: time, uCol: { value: night ? new THREE.Color('#7f98c8') : new THREE.Color('#dfeaf0') } }, fog: true,
        vertexShader: `varying vec3 vW;\n${fx.GLSL_FOG_PARS_VERT}\nvoid main(){ vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n${fx.GLSL_FOG_VERT}\n}`,
        fragmentShader: `uniform float uTime; uniform vec3 uCol; varying vec3 vW;\n${GLSL_N}\n${fx.GLSL_FOG_PARS_FRAG}\nvoid main(){ float f = gvn(vec2(vW.x * 5., vW.z * 1.4 + uTime * 1.7)), g = gvn(vec2(vW.x * 9. + 3., vW.z * 3.1 + uTime * 2.8));
          float gl = smoothstep(.6, .8, f * .6 + g * .4); vec3 c = mix(vec3(.04, .07, .08), uCol, .22 + .3 * f) + gl * uCol * 1.3; gl_FragColor = vec4(fxApplyFog(c), 1.); }` }));
      rill.name = 'rill'; scene.add(rill);
    }
    await ctx.yield();

    // ---------- tea: real clipped rows along the contours round the entry lane (the shader carries them beyond) ----------
    // THE NEAR TEA IS LEAVES (round 20). The rows nearest the lane, LEAF_REACH (12 m) either side of its line, are clipped tea bushes: a law of the place
    // (the rows' own distance from the lane), the same from wherever they are seen.
    //  - On the hedge itself (this material): two mosaics laid over the hedge's own surface (aArc, the metres round its section, and the metres along
    //    the row): the bush's sprays, LEAF_CLUMP across (24 cm), and on them the leaves, LEAF_CELL across (7 cm: a tea leaf): each its own tone
    //    and its own tilt to the light, dark between them, and on the top of the bush some of the leaves the pale new flush. Each mosaic's mean is
    //    the hedge's own colour; where its cell is under about two pixels it gives way to that mean (the footprint of a pixel, as the ground's rows do).
    //  - Standing on it ('tea-leaves', below): sprigs of the new flush, which break the top and the shoulder and give each row's edge its outline.
    const LEAF_REACH = 12, LEAF_CELL = 0.07, LEAF_CLUMP = 0.24;
    const teaMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
    teaMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aTop, aArc; uniform float uTime; varying vec3 vTw; varying vec3 vTg;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { float g = sin(uTime * 1.6 + position.z * .21 + position.x * .08) * .5 + .5; g *= g;
            transformed.x += aTop * (.03 + .09 * g) * sin(uTime * 3.3 + position.z * 1.7 + position.x * 2.3);
            transformed.y += aTop * .03 * g * sin(uTime * 4.1 + position.z * 2.9);
            vTw = position; vTg = vec3(g, aTop, aArc); }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uTime, uDew, uWet; uniform vec3 uTip; varying vec3 vTw; varying vec3 vTg;\n${GLSL_N}
          // one cell of a mosaic: how far the nearest cell's middle is, and that cell's two own numbers
          vec3 tlCell(vec2 p){ vec2 ci = floor(p), cf = fract(p), id = vec2(.5); float md = 9.;
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)), d = g + vec2(gh21(ci + g), gh21(ci + g + 17.3)) - cf; float dd = dot(d, d);
              if (dd < md) { md = dd; id = vec2(gh21(ci + g + 5.1), gh21(ci + g + 9.7)); } }
            return vec3(sqrt(md), id); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          { float n = gvn(vTw.xz * 8. + vTw.y * 5.), n2 = gvn(vTw.xz * 31. + vTw.y * 17.);
            diffuseColor.rgb *= (.62 + .55 * n) * (.8 + .4 * n2) * (1. + .22 * vTg.x * vTg.y) * (1. - .2 * uWet); }
          vec2 tlS = vec2(vTg.z, vTw.z), tlP = tlS * ${(1 / LEAF_CELL).toFixed(2)}, tlW = fwidth(tlP), tlQ = tlS * ${(1 / LEAF_CLUMP).toFixed(2)} + 31.7, tlV = fwidth(tlQ), tlT = vec2(0.);
          float tlR = 1. - smoothstep(${LEAF_REACH.toFixed(1)}, ${(LEAF_REACH + 0.6).toFixed(1)}, abs(vTw.x - ${LANE_X.toFixed(1)})), tlK = tlR * (1. - smoothstep(.25, .6, max(tlW.x, tlW.y))), tlC = tlR * (1. - smoothstep(.25, .6, max(tlV.x, tlV.y)));
          if (tlC > 0.) { vec3 cl = tlCell(tlQ); float clump = 1. - smoothstep(.35, .7, cl.x);   // the sprays of the bush, a hand and a half across
            diffuseColor.rgb *= mix(1., mix(.78, .96 + .3 * cl.y, clump), tlC); tlT = (cl.yz - .5) * .5 * clump * tlC; }
          if (tlK > 0.) { vec3 cl = tlCell(tlP); float leaf = 1. - smoothstep(.3, .62, cl.x), flush = leaf * step(.6, cl.z) * smoothstep(.7, .95, vTg.y);   // the leaves
            diffuseColor.rgb *= mix(1., mix(.64, .94 + .62 * cl.y, leaf), tlK);
            diffuseColor.rgb = mix(diffuseColor.rgb, uTip * (.8 + .5 * cl.y) * (1. - .2 * uWet), .55 * flush * tlK);
            tlT += (cl.yz - .5) * .9 * leaf * tlK; }`)
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(normal + vec3(tlT, 0.)); nonPerturbedNormal = normal;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { vec2 dc = floor(vTw.xz * 34.); float d = gh21(dc + floor(vTw.y * 9.)), tw = .5 + .5 * sin(uTime * 2.4 + d * 80.);
            totalEmissiveRadiance += vec3(1., .97, .9) * step(.993, d) * tw * tw * vTg.y * uDew * smoothstep(40., 4., length(vViewPosition)); }`);
      mistify(sh, true);
    };
    teaMat.customProgramCacheKey = () => 'tulou-tea';
    let teaRows, teaLeaves; const leafRows = [];
    {
      const P = [], Nn = [], Cc = [], Tp = [], Ar = [], I = [], cT = U.uTea.value, cTip = U.uTip.value;
      const prof6 = [[-0.5, 0], [-0.54, 0.45], [-0.31, 0.84], [0.31, 0.84], [0.54, 0.45], [0.5, 0]], prof4 = [[-0.5, 0], [-0.42, 0.76], [0.42, 0.76], [0.5, 0]];
      prof6.w = [0.06, 0.2, 0.48, 0.2, 0.06]; prof4.w = [0.14, 0.72, 0.14];   // (round 20) how the sprigs are shared among the faces of a section: most on the top, some on the shoulders, a few on the upper sides
      const nzAt = (x, z) => qAt(x, z) - (0.5 + (LANE_X - x) * QS), step = 2.4 / Math.max(0.75, Math.min(1, detail + 0.1));
      for (let k = -17; k <= 50; k++) {
        if ((k & 7) === 7) await ctx.yield();
        const qk = (k + 0.5) / ROWS, fq = qk - Math.floor(qk); if (fq > 0.765 || k === 20) continue;
        let prev = -1;
        const lr = Math.abs(k - 17) * AISLE < LEAF_REACH ? [] : null; if (lr) leafRows.push({ off: Math.abs(k - 17) * AISLE, rings: lr });   // (round 20) the lane's own rows: their sections are kept for the sprigs that stand on them
        for (let z = -228; z <= -56; z += step) {
          let x = LANE_X - (qk - 0.5) / QS; for (let it = 0; it < 3; it++) x = LANE_X - (qk - 0.5 - nzAt(x, z)) / QS;
          if (padAt(x, z) > 0.08 || (k === 17 && z < -98) || Math.abs(x - LANE_X) > ROW_REACH || (Math.abs(x - 31) < 4.5 && Math.abs(z + 97) < 2.2)) { prev = -1; if (lr) lr.push(null); continue; }
          const pf = Math.abs(x - LANE_X) < LANE_ROWS ? prof6 : prof4, y0 = heightAt(x, z), hs = 0.93 + 0.14 * noise.n2(x * 0.31, z * 0.13), base = P.length / 3, sh = 0.8 + 0.3 * noise.n2(x * 0.05 + 9, z * 0.04);
          if (lr) lr.push({ x, z, y0, hs, pf });
          for (let i = 0, arc = 0; i < pf.length; i++) { if (i) arc += Math.hypot(pf[i][0] - pf[i - 1][0], pf[i][1] - pf[i - 1][1]); Ar.push(arc); }   // (round 20) the metres round the hedge's section, for the leaf mosaic
          for (const [px, py] of pf) {
            const f = py / 0.84, j = (0.86 + 0.28 * rng()) * sh, tip = f > 0.85 ? 0.2 + 0.5 * rng() : 0;
            P.push(x + px, y0 + py * hs, z); const nl = Math.hypot(px * 1.3, 0.3 + py) || 1; Nn.push(px * 1.3 / nl, (0.3 + py) / nl, 0);
            const b = (0.3 + 0.78 * f) * j; Cc.push(mix(cT.r * b, cTip.r, tip), mix(cT.g * b, cTip.g, tip), mix(cT.b * b, cTip.b, tip)); Tp.push(f);
          }
          if (prev >= 0 && base - prev === pf.length) for (let i = 0; i < pf.length - 1; i++) I.push(prev + i, base + i, prev + i + 1, prev + i + 1, base + i, base + i + 1);
          prev = base;
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aTop', new THREE.Float32BufferAttribute(Tp, 1)); g.setAttribute('aArc', new THREE.Float32BufferAttribute(Ar, 1)); g.setIndex(I);
      teaRows = new THREE.Mesh(g, teaMat); teaRows.name = 'tea-rows'; scene.add(teaRows);
    }
    await ctx.yield();
    // THE SPRIGS OF THE LANE'S OWN ROWS ('tea-leaves', round 20): on every row within LEAF_REACH of the lane, from one hedge step south of where the flight
    // enters to the row's end, sprigs of three leaves stand on the hedge: LEAF_PER of them to the metre of row (the four rows either side of the lane,
    // the next three, the rest), most on the clipped top, some on the shoulders, a few on the upper sides (prof.w), each at a place, a turn, a size
    // and a lean drawn from the stream 'tea-leaves'. A sprig is rooted in the hedge's own triangle: it is carried by the same gust as the three
    // corners it stands between (the hedge's own law, weighted by its place among them), so it rides the hedge and never slides on it. Dark leaf at
    // the foot, the pale new flush at the tip and paler the higher on the bush it stands; a bead of dew on one tip in seven, lit as the hedge's own dew.
    // LEAF_FAR: a sprig eases to nothing between 30 and 70 m from the eye (its length and its colour, continuously: a leaf is under a pixel there
    // and would crawl), as the stonework's mottle does; nearer than that every sprig stands whole. One draw call; three triangles a sprig.
    const LEAF_PER = [[4, 14], [7, 8], [99, 5]], LEAF_FAR = [30, 70];
    {
      const lf = stream('tea-leaves'), aA = [], aN4 = [], aC0 = [], aC1 = [], aWt = [], aK = [], zFrom = ENTRY[2] - 2.4, box = new THREE.Box3();
      const nrm = (px, py) => { const l = Math.hypot(px * 1.3, 0.3 + py) || 1; return [px * 1.3 / l, (0.3 + py) / l]; };
      for (const row of leafRows) {
        const per = LEAF_PER.find((e) => Math.round(row.off / AISLE) <= e[0])[1], R = row.rings;
        for (let r = 0; r + 1 < R.length; r++) {
          const a = R[r], b = R[r + 1]; if (!a || !b || a.pf !== b.pf || b.z <= zFrom) continue;
          const pf = a.pf, want = per * (b.z - a.z), n = Math.floor(want) + (lf() < want - Math.floor(want) ? 1 : 0);
          for (let t = 0; t < n; t++) {
            let e = 0, pick = lf(); while (e < pf.w.length - 1 && pick >= pf.w[e]) { pick -= pf.w[e]; e++; }
            let v = lf(); const side = pf.w.length === 5 ? 0.5 : 0.4; if (e === 0) v = 1 - side * v; else if (e === pf.w.length - 1) v = side * v;
            const u = lf(), w = u + v <= 1 ? [1 - u - v, v, u, 0] : [0, 1 - u, 1 - v, u + v - 1];   // its share of the triangle's corners (a_e, a_e+1, b_e, b_e+1): the hedge's own two triangles
            const p0 = pf[e], p1 = pf[e + 1], wa = w[0] + w[1], wb = w[2] + w[3], w0 = w[0] + w[2], w1 = w[1] + w[3];
            const x = wa * a.x + wb * b.x + w0 * p0[0] + w1 * p1[0], y = w[0] * (a.y0 + p0[1] * a.hs) + w[1] * (a.y0 + p1[1] * a.hs) + w[2] * (b.y0 + p0[1] * b.hs) + w[3] * (b.y0 + p1[1] * b.hs), z = wa * a.z + wb * b.z;
            const n0 = nrm(p0[0], p0[1]), n1 = nrm(p1[0], p1[1]), nx = w0 * n0[0] + w1 * n1[0], ny = w0 * n0[1] + w1 * n1[1], nl = Math.hypot(nx, ny) || 1, top = (w0 * p0[1] + w1 * p1[1]) / 0.84;
            aA.push(x, y, z, lf() * TAU); aN4.push(nx / nl, ny / nl, lf.range(0.1, 0.17) * (0.7 + 0.3 * top), lf.range(0.06, 0.1));
            aC0.push(a.x + p0[0], a.x + p1[0], b.x + p0[0], b.x + p1[0]); aC1.push(a.z, b.z, p0[1] / 0.84, p1[1] / 0.84); aWt.push(w[0], w[1], w[2], w[3]); aK.push(lf(), top, lf.range(0.25, 0.7), 0);
            box.expandByPoint(_pp.set(x, y, z));
          }
        }
        await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry(), bp = []; for (let bl = 0; bl < 3; bl++) bp.push(-1, 0, bl, 1, 0, bl, 0, 1, bl);   // a sprig: three leaves, each a triangle (its two foot corners, its tip)
      g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
      for (const [nm, arr] of [['aA', aA], ['aN4', aN4], ['aC0', aC0], ['aC1', aC1], ['aWt', aWt], ['aK', aK]]) g.setAttribute(nm, new THREE.InstancedBufferAttribute(new Float32Array(arr), 4));
      g.instanceCount = aA.length / 4; box.expandByScalar(0.4); g.boundingBox = box; g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      await ctx.yield();
      const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
      leafMat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
          attribute vec4 aA, aN4, aC0, aC1, aWt, aK; uniform float uTime, uWet; uniform vec3 uTea, uTip; varying vec3 vLf; varying vec3 vLk;
          vec2 lfSway(float X, float Z, float f){ float g = sin(uTime * 1.6 + Z * .21 + X * .08) * .5 + .5; g *= g; return vec2(f * (.03 + .09 * g) * sin(uTime * 3.3 + Z * 1.7 + X * 2.3), f * .03 * g * sin(uTime * 4.1 + Z * 2.9)); }`)
          .replace('#include <beginnormal_vertex>', `float lTip = position.y, lB = position.z, lH = fract(aK.x * 13.7 + lB * .37), lAz = aA.w + lB * 2.094 + (lH - .5) * .9;
          vec3 lN = vec3(aN4.x, aN4.y, 0.), lT = vec3(aN4.y, -aN4.x, 0.), lDir = vec3(0., 0., cos(lAz)) + sin(lAz) * lT, lWd = vec3(0., 0., -sin(lAz)) + cos(lAz) * lT;
          float lFar = 1. - smoothstep(${LEAF_FAR[0].toFixed(1)}, ${LEAF_FAR[1].toFixed(1)}, length((modelViewMatrix * vec4(aA.xyz, 1.)).xyz));
          float lLen = aN4.z * (.75 + .5 * lH) * lFar, lLean = aK.z * (.7 + .6 * fract(lH * 5.3));
          vec3 lP = aA.xyz - lN * .03 + lWd * position.x * aN4.w * .5 * (1. - lTip) + (lN * cos(lLean) + lDir * sin(lLean)) * lLen * lTip;
          lP.xy += lfSway(aC0.x, aC1.x, aC1.z) * aWt.x + lfSway(aC0.y, aC1.x, aC1.w) * aWt.y + lfSway(aC0.z, aC1.y, aC1.z) * aWt.z + lfSway(aC0.w, aC1.y, aC1.w) * aWt.w;
          lP.x += lTip * .012 * sin(uTime * 5.1 + aK.x * 50. + lB);
          { float g = sin(uTime * 1.6 + aA.z * .21 + aA.x * .08) * .5 + .5, fl = aK.y * (.3 + .7 * fract(aK.x * 3.1));
            vec3 hedge = mix(uTea * (.3 + .78 * aK.y), uTip, .45 * step(.85, aK.y)) * .9, sprig = mix(uTea * (.3 + .25 * aK.y), mix(uTea, uTip * 1.12, fl) * (.85 + .3 * lH), lTip);
            vLf = mix(hedge, sprig, lFar) * (1. + .22 * g * g * aK.y) * (1. - .2 * uWet); vLk = vec3(lTip, fract(aK.x * 7.7 + lB * .31), lFar); }
          vec3 objectNormal = normalize(lN * .55 + vec3(0., .6, 0.) + lDir * .35 * lTip);`)
          .replace('#include <begin_vertex>', 'vec3 transformed = lP;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uTime, uDew; varying vec3 vLf; varying vec3 vLk;\n${GLSL_N}`)
          .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = vLf;')
          .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal); nonPerturbedNormal = normal;')   // a leaf is lit as the bush is, on both its faces
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { float tw = .5 + .5 * sin(uTime * 2.4 + vLk.y * 80.); totalEmissiveRadiance += vec3(1., .97, .9) * step(.86, vLk.y) * smoothstep(.72, .9, vLk.x) * tw * tw * uDew * vLk.z * smoothstep(40., 4., length(vViewPosition)); }`);
        mistify(sh, true);
      };
      leafMat.customProgramCacheKey = () => 'tulou-tea-leaf';
      teaLeaves = new THREE.Mesh(g, leafMat); teaLeaves.name = 'tea-leaves'; scene.add(teaLeaves);
    }
    await ctx.yield();

    // ---------- pickers bent over the rows under conical hats, a line of red parasols between the rings (the villagers on the footbridge and the lane, and the people of the courts, are the hero's and ring E's own instanced figures) ----------
    // (NLANE of the NH pickers and all NX work beside the lane, see laneSpot; the seeded cast variation: a line of red parasols on the slab path between the rings, three more walking an aisle of the tea)
    const NH = 40, NLANE = 7, NX = 7, NP = parasols ? 7 : 0, NL = parasols ? 3 : 0, hats = [];
    // a picker bent over the row: legs, a tunic leaning forward, arms down to the bush, a head under the cone hat, a basket on the back (the one maker of
    // every picker of the world: the cloth, the straw and the hat's underside are the caller's)
    const pickerInto = (s, tun, straw, under) => {
      const trs = [0.07, 0.075, 0.1], skin = [0.5, 0.36, 0.25];
      for (const sx of [-0.09, 0.09]) s.box(sx, 0, -0.02, 0.11, 0.64, 0.13, trs, { skip: 'b', g0: 0.7 });
      s.box(0, 0.6, -0.04, 0.36, 0.56, 0.21, tun, { rx: 0.52, taper: 0.02, g0: 0.75 }); s.box(0, 1.0, 0.2, 0.46, 0.1, 0.2, tun, { rx: 0.52, skip: 'b' });
      for (const sx of [-0.21, 0.21]) { s.box(sx, 0.58, 0.47, 0.08, 0.5, 0.08, tun, { rx: -0.42, skip: 'b' }); s.box(sx, 0.52, 0.47, 0.07, 0.09, 0.07, skin, {}); }
      s.box(0, 1.08, 0.3, 0.16, 0.2, 0.17, skin, { rx: 0.3 });
      s.push(0, 1.3, 0.33, 0, 0.16, 0); s.cyl(0, 0.03, 0, 0.5, 0.0, 0.25, 10, straw, { cap: false, g0: 0.75, g1: 1.2 }); s.cyl(0, 0, 0, 0.5, 0.5, 0.03, 10, under, { cap: false, capB: true }); s.pop();
      s.cyl(0, 0.7, -0.22, 0.15, 0.21, 0.44, 7, [0.52, 0.42, 0.21], { rx: 0.5, gt: 0.35, g0: 0.7 }); s.box(0, 0.98, -0.08, 0.3, 0.05, 0.05, [0.3, 0.24, 0.12], { rx: 0.5 });
    };
    let hatMesh, gang;
    {
      const s = new Soup(), w = [1, 1, 1];
      pickerInto(s, [0.2, 0.27, 0.48], [0.66, 0.66, 0.66], [0.36, 0.36, 0.36]);
      const hatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }); hatMat.onBeforeCompile = (sh) => mistify(sh, false); hatMat.customProgramCacheKey = () => 'tulou-hat';
      hatMesh = new THREE.InstancedMesh(s.toGeometry(), hatMat, NH + NP + NL + NX);
      const c = new THREE.Color();
      // the random pickers: anywhere on the tea terraces, off the yards, on a terrace's flat, and not within 12 m of the line that is flown. The tries are
      // drawn from a stream of their own ('tea-pickers'): however many tries the rule costs, nothing drawn after the pickers moves
      const pk = rng.fork('tea-pickers');
      for (let i = 0; i < NH; i++) {
        const amp = rng.range(1.5, 5); let x, z;   // (how far each way along the row the picker works)
        if (i < NLANE) { const p = laneSpot(amp); x = p.x; z = p.z; }
        else for (let tr = 0; tr < 30; tr++) { x = pk.range(-140, 180); z = pk.range(-215, 330); const q = qAt(x, z); if (padAt(x, z) < 0.02 && q - Math.floor(q) < 0.72 && path.nearestXZ(x, z).dist > 12) break; }
        hats.push({ x, z, y: heightAt(x, z) - 0.1, amp, ph: rng() * TAU, sp: rng.range(0.07, 0.16), sc: rng.range(0.92, 1.08) });
        const k = rng.range(0.75, 1.0); c.setRGB(k, k * 0.86, k * 0.58); hatMesh.setColorAt(i, c);
      }
      for (let i = 0; i < NP + NL; i++) { c.setRGB(0.95, 0.07, 0.04); hatMesh.setColorAt(NH + i, c); }
      { const q = rngNew.fork('pickers-near');   // seven more beside the lane, by the same rule (laneSpot)
        for (let i = 0; i < NX; i++) { const amp = q.range(1.5, 4), p = laneSpot(amp); hats.push({ x: p.x, z: p.z, y: heightAt(p.x, p.z) - 0.1, amp, ph: q() * TAU, sp: q.range(0.07, 0.16), sc: q.range(0.95, 1.1) });
          const k = q.range(0.75, 1.0); c.setRGB(k, k * 0.86, k * 0.58); hatMesh.setColorAt(NH + NP + NL + i, c); } }
      hatMesh.frustumCulled = false; hatMesh.name = 'hats'; scene.add(hatMesh);
    }
    await ctx.yield();
    // THE PICKING GANG (round 20): GANG_N pickers of the same maker at work beside the lane ahead of the entry, the subject of the arrival. Every draw
    // comes from the stream 'picking-gang' (the world's seed and that name: no draw of any other stream), in this order: for each picker its step south of
    // the one before, its size, the hedge it faces, where in its round of work it is, how fast it works, how far it turns; then the spread cloth's colour.
    //   WHICH SIDE   computed below (gangAisle): on each side of the lane the first whole aisle whose picker keeps GANG_KEEP from the line; the side whose
    //                first aisle is the nearer. An aisle beside the rill is the rill's bank, not a whole aisle (the rill takes the third row's place on the
    //                west, 3.9 m off): with these numbers the east, aisle 3; the west's first is aisle 4.
    //   WHICH AISLES the first aisle whose picker, hat and all (GANG_REACH: the hat's rim and a hand come to 0.97 m from the feet), keeps GANG_KEEP (3.5 m, the
    //                lead's amendment of round 20) from the line that is flown: aisle 3, 4.55 m off; and the two beyond it (5.84 and 7.14 m): three
    //                neighbouring aisles, dealt in turn.
    //   WHERE ALONG  (round 20c) the gang picks north toward the footbridge, strung out as a gang is: its leader stands GANG_SHORT (10.5 m) south of the
    //                lane's north end at the footbridge (LANE_Z), each next picker a step of GANG_STEP (4.6 to 6.4 m, drawn) south of the one before. A seat
    //                that falls within two reaches (GANG_GAP, 2 m) of the beat of anybody of `lane-pickers` in the same aisle or in either aisle beside it is
    //                moved south past that beat, and past every further beat that then holds it (round 20d: the first version of this loop could
    //                stop on one beat by rounding and leave a seat on a second). Clear of the lane's camphors (12.6 m west of the line and 14 m
    //                east), of the rill and of the footbridge. GANG_SHORT and GANG_STEP are typed, with no rule of the place behind them.
    //   AT WORK      each stands where it stands, at every clock: the feet are a place. On the world's clock, by its own phase and pace, it bends to the bush,
    //                reaches, and once in its round straightens its back (the body above the hips turns 0.46 rad upright about the hips) and turns at
    //                its place (GANG_TURN: its own 0.25 to 0.6 rad, to and fro, and a little further as it straightens). All of it in the vertex shader.
    //   CLOTH        indigo, and undyed hemp on every third, dealt in turn; one paler jacket (the third picker); hats of pale straw.
    //   THEIR THINGS (round 20c) at the lane's edge on the gang's side, beside its last picker (the south end of the gang's row, where it set them
    //                down), within the slab's narrowest half width (0.7 m), the cloth's hem ON the lane's line: so under the eye's course, 0 to 0.7 m
    //                aside of it and 2.8 m or more beneath: a cloth 0.7 m by 1.6 m spread with picked leaf, two full baskets with the carrying pole
    //                laid across them, a third basket. True size (a basket 0.52 m across, the pole 1.9 m).
    // One mesh ('picking-gang'), one draw call, drawn while the tea rows are (until the eye is down inside ring A).
    const GANG_N = 8, GANG_KEEP = 3.5, GANG_REACH = 0.97, GANG_SHORT = 10.5, GANG_STEP = [4.6, 6.4], GANG_GAP = 2, gangSeats = [];
    const gangAisle = (side) => { let j = 1; while ((j + 0.5) * AISLE - GANG_REACH < GANG_KEEP || (side * (RILL_X - LANE_X) > 0 && Math.abs(j + 0.5 - Math.abs(RILL_X - LANE_X) / AISLE) < 1)) j++; return j; };
    const GANG_SIDE = gangAisle(1) <= gangAisle(-1) ? 1 : -1;
    {
      const gq = stream('picking-gang'), CLOTH = [[0.17, 0.25, 0.5], [0.52, 0.45, 0.33], [0.74, 0.76, 0.78]], STRAW = [0.86, 0.76, 0.5], UNDER = [0.45, 0.38, 0.24];
      const j0 = gangAisle(GANG_SIDE);
      const P = [], Nn = [], Cc = [], Se = [], Wk = [];
      const take = (s, seat, work) => { for (let i = 0; i < s.p.length; i += 3) { P.push(s.p[i], s.p[i + 1], s.p[i + 2]); Nn.push(s.n[i], s.n[i + 1], s.n[i + 2]); Cc.push(s.c[i], s.c[i + 1], s.c[i + 2]); Se.push(seat[0], seat[1], seat[2], seat[3]); Wk.push(work[0], work[1], work[2], work[3]); } };
      let zAt = LANE_Z[1] - GANG_SHORT;
      for (let i = 0; i < GANG_N; i++) {
        const j = j0 + i % 3, x = LANE_X + GANG_SIDE * (j + 0.5) * AISLE, step = i === 0 ? 0 : gq.range(GANG_STEP[0], GANG_STEP[1]);
        let z = zAt - step; for (let o; (o = laneTaken.find((o) => o.side === GANG_SIDE && Math.abs(o.j - j) <= 1 && Math.abs(o.z - z) < o.amp + GANG_GAP - 1e-6)); ) z = o.z - o.amp - GANG_GAP;   // (20d) past EVERY beat that holds the seat: each move goes south, so a beat once passed is never met again and the loop ends within the count of beats
        zAt = z;
        const cloth = i === 2 ? CLOTH[2] : CLOTH[i % 3 === 1 ? 1 : 0], sc = gq.range(1.02, 1.1), face = gq.sign() * (Math.PI / 2 - gq.range(0.15, 0.55)), ph = gq() * TAU, sp = gq.range(0.9, 1.5), turn = gq.range(0.25, 0.6);
        const s = new Soup(); pickerInto(s, cloth, STRAW, UNDER);
        const seat = [x, heightAt(x, z) - 0.1, z, face]; take(s, seat, [ph, sp, turn, sc]); gangSeats.push({ x, z, y: seat[1], j, sc, face, ph, sp, turn });
      }
      { // their things, on the lane's slab at its edge on the gang's side, beside the last picker (the slab's top is 0.1 m over the land)
        const s = new Soup(), z0 = zAt, ex = LANE_X + GANG_SIDE * 0.42, yS = (z) => heightAt(LANE_X, z) + 0.1, wov = [0.5, 0.4, 0.2], leafC = [0.3, 0.5, 0.13], cl = CLOTH[gq.int(0, 1)];
        const basket = (x, z, full) => { const y = yS(z); s.cyl(x, y, z, 0.2, 0.26, 0.42, 9, wov, { g0: 0.6, gt: 0.3 }); s.cyl(x, y + 0.4, z, 0.245, 0.06, 0.1 + 0.08 * full, 9, leafC, { g0: 0.8, g1: 1.25, gt: 1.3 }); };
        basket(ex + GANG_SIDE * 0.02, z0 + 2.3, 1); basket(ex, z0 + 3.75, 0.7); basket(ex - GANG_SIDE * 0.02, z0 + 4.7, 0.4);
        s.box(ex - GANG_SIDE * 0.14, yS(z0 + 3) + 0.43, z0 + 3.02, 0.045, 0.045, 1.9, [0.62, 0.5, 0.24], { ry: GANG_SIDE * 0.05 });   // the carrying pole across the two baskets' rims
        const cx = LANE_X + GANG_SIDE * 0.35, cz = z0 + 0.6, yc = yS(cz) + 0.015;   // the cloth: 0.7 m by 1.6 m, a little rumpled, a heap of leaf on it
        s.grid(4, 5, (u, v) => [cx + (u - 0.5) * 0.66 + 0.02 * Math.sin(v * 9), yc + 0.012 * Math.sin(u * 11 + v * 7), cz + (v - 0.5) * 1.6 + 0.05 * Math.sin(u * 8), [cl[0] * (0.8 + 0.25 * u), cl[1] * (0.8 + 0.25 * u), cl[2] * (0.8 + 0.25 * u)]], { up: [0, 1, 0] });
        s.cyl(cx, yc + 0.01, cz - 0.1, 0.28, 0.07, 0.17, 10, leafC, { g0: 0.75, g1: 1.3, gt: 1.3 });
        take(s, [0, 0, 0, 0], [0, 0, 0, 1]);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
      g.setAttribute('aSeat', new THREE.Float32BufferAttribute(Se, 4)); g.setAttribute('aWork', new THREE.Float32BufferAttribute(Wk, 4));
      const gangMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
      gangMat.onBeforeCompile = (sh) => {
        mistify(sh, false);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aSeat, aWork; uniform float uTime;')
          .replace('#include <beginnormal_vertex>', `float gPh = uTime * aWork.y + aWork.x, gUp = smoothstep(.5, .92, sin(gPh));
          float gBend = step(1e-4, aWork.y) * (-.46 * gUp + .09 * (1. - gUp) * sin(gPh * 3.1 + aWork.x * 5.)) * smoothstep(.5, .74, position.y), gCb = cos(gBend), gSb = sin(gBend);
          vec3 gP = position, gN = normal; gP.yz = vec2(.62, -.03) + mat2(gCb, gSb, -gSb, gCb) * (position.yz - vec2(.62, -.03)); gN.yz = mat2(gCb, gSb, -gSb, gCb) * normal.yz;
          float gTh = aSeat.w + aWork.z * (sin(gPh * .31 + aWork.x * 3.) + .6 * gUp), gCt = cos(gTh), gSt = sin(gTh);
          gP = vec3(gP.x * gCt + gP.z * gSt, gP.y, -gP.x * gSt + gP.z * gCt) * aWork.w + aSeat.xyz;
          vec3 objectNormal = vec3(gN.x * gCt + gN.z * gSt, gN.y, -gN.x * gSt + gN.z * gCt);`)
          .replace('#include <begin_vertex>', 'vec3 transformed = gP;');
      };
      gangMat.customProgramCacheKey = () => 'tulou-gang';
      gang = new THREE.Mesh(g, gangMat); gang.frustumCulled = false; gang.name = 'picking-gang'; scene.add(gang);
      scene.userData.gang = gangSeats;   // (the seats, for whoever asks the page: it draws nothing)
    }
    await ctx.yield();

    // ---------- flora: camphors by the gates, bamboo plumes on the terrace ends and all over the west hill ----------
    const wind = flora.makeWind({ direction: [0.9, 0.3], strength: 0.9 });
    await ctx.yield();
    await flora.prepareLeafTexture({}, ctx.yield);   // the kit's leaf atlas, drawn in short steps
    const leafAtlas = flora.makeLeafTexture();
    await ctx.yield();
    const floraMat = flora.windMaterial({ wind, map: leafAtlas });
    await ctx.yield();
    const camphorG = flora.oakGeometry({ rng: rng.fork('camphor'), detail: 2, height: 15, leaf: season === 'autumn' ? '#5d6e2a' : '#3e6e2e', leafLight: '#86a63c', leafDark: '#22401f', bark: '#5a4a3c' });
    await ctx.yield();
    // The two camphors of ring A's gate stand as a pair either side of the gate's own axis (ring A's north-south line, x = RING.A.x), 19 m off it and 21 m
    // out from the gate's face (z = -48), beside the gate path: the old tree west of the axis (GATE_TREE), a younger one at its mirror place east of it, of
    // the size of the lane's young camphor (LANE_TREE: 0.74 of the species' 15 m).
    const GATE_TREE = [-19, -69, 1.15], LANE_TREE = [LANE_X - 12.6, -147, 0.74];
    const southTrees = [];   // the camphors south of ring A (by its gate and along the entry lane): out of sight behind its wall from the first lap on, and behind the camera after that
    for (const [x, z, sc] of [[2 * RING.A.x - GATE_TREE[0], GATE_TREE[1], LANE_TREE[2]], GATE_TREE, [46, 166, 1.5], [-40, 196, 1.5], LANE_TREE, [LANE_X + 14, -127, 0.45]]) { const m = new THREE.Mesh(camphorG, floraMat); m.position.set(x, heightAt(x, z) - 0.25, z); m.scale.setScalar(sc); m.rotation.y = rng() * TAU; m.name = 'camphor'; scene.add(m); if (z < 0) southTrees.push(m); }
    const bamG = [];
    for (const [k, o] of [['b0', { detail: 0, height: 12 }], ['b1', { detail: 0, height: 14 }]]) {
      bamG.push(flora.bambooGeometry({ rng: rng.fork(k), ...o })); await ctx.yield();
    }
    const bpts = [], hpts = [];
    // the lane's own plumes: three clumps of six slender culms at the edge of its planted rows, toward the footbridge
    for (const [cx, cz] of [[LANE_X + 42, -114], [LANE_X - 38, -105], [LANE_X - 41, -124]]) for (let k = 0; k < 6; k++) {
      const a = k * 2.4 + noise.n2(cx * 0.37 + k, cz * 0.21) * 1.2, r = k ? 1.5 + 1.5 * (0.5 + 0.5 * noise.n2(cx * 0.13 - k * 3.1, cz * 0.29 + k)) : 0, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      bpts.push({ x, y: heightAt(x, z), z, s: 0.5 + 0.2 * (0.5 + 0.5 * noise.n2(x * 0.9, z * 0.9)), rot: a * 1.7, d: 0, u: 0, v: 0 });
    }
    // clumps of 3-5, most of them on the west hill and up to its crest: off the yards, in the valley only on a terrace's riser, and none whose middle is within
    // 22 m of the line that is flown. The tries are drawn from a stream of their own ('bamboo-clumps'): however many the rule costs, nothing drawn later moves
    const bc = rng.fork('bamboo-clumps'), addB = (x, z, sc, v, list) => list.push({ x, y: heightAt(x, z), z, s: sc, rot: bc() * TAU, d: 0, u: 0, v });
    for (let i = 0, tr = 0, nB = Math.round(310 * Math.min(1.15, dens) * detail); i < nB && tr < 9000; tr++) {
      const hill = bc.chance(0.84), x = hill ? -178 - 420 * Math.pow(bc(), 1.35) : bc.range(-165, 235), z = hill ? bc.range(-260, 430) : bc.range(-300, 430), q = qAt(x, z);
      if ((tr & 63) === 63) await ctx.yield();
      if ((!hill && q - Math.floor(q) < 0.8) || padAt(x, z) > 0.01 || path.nearestXZ(x, z).dist < 22) continue;
      const n = hill ? bc.int(3, 5) : 1;
      for (let k = 0; k < n && i < nB; k++, i++) { const a = bc() * TAU, r = k ? bc.range(4, 11) : 0; addB(x + Math.cos(a) * r, z + Math.sin(a) * r, hill ? bc.range(1.2, 1.8) * (1 + Math.max(0, -260 - x) / 300) : bc.range(1.0, 1.6), i % 2, hill ? hpts : bpts); }
    }
    // no stray plume stands in the lane's planted tea: the rows are kept clear of bamboo out to their own width (ROW_REACH either side of the lane, its whole length)
    for (let i = bpts.length - 1; i >= 18; i--) if (Math.abs(bpts[i].x - LANE_X) < ROW_REACH && bpts[i].z > LANE_Z[0] - ROW_REACH && bpts[i].z < LANE_Z[1] + ROW_REACH) bpts.splice(i, 1);
    await ctx.yield();
    const bamboo = flora.makeScatter({ rng: rng.fork('bamboo'), variants: bamG, points: bpts, material: floraMat, tint: 0.2 });
    scene.add(bamboo.object);
    await ctx.yield();
    const hillBamboo = flora.makeScatter({ rng: rng.fork('bamboo-hill'), variants: bamG, points: hpts, material: floraMat, tint: 0.2 });
    scene.add(hillBamboo.object);
    // The plumes stand over 700 m of hill and valley, and an instanced mesh is drawn whole or not at all. So each mesh's plumes are put in order from north to
    // south and cut into sixteen bands with a box round each; every frame (update, below) the mesh draws its plumes down to the southernmost band whose box is in
    // the camera's view. No plume that can be in the picture is left out; the order of instances changes nothing that is seen.
    const plumeCull = [...bamboo.meshes, ...hillBamboo.meshes].map((m) => {
      const n = m.count, im = m.instanceMatrix.array, ic = m.instanceColor ? m.instanceColor.array : null, im0 = im.slice(), ic0 = ic ? ic.slice() : null, bands = [];
      Array.from({ length: n }, (_, i) => i).sort((a, b) => im0[b * 16 + 14] - im0[a * 16 + 14]).forEach((src, dst) => { for (let k = 0; k < 16; k++) im[dst * 16 + k] = im0[src * 16 + k]; if (ic) for (let k = 0; k < 3; k++) ic[dst * 3 + k] = ic0[src * 3 + k]; });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      for (let b = 0; b < 16; b++) { const i0 = Math.floor(n * b / 16), i1 = Math.floor(n * (b + 1) / 16); if (i1 <= i0) continue; const box = new THREE.Box3();
        for (let i = i0; i < i1; i++) { const x = im[i * 16 + 12], y = im[i * 16 + 13], z = im[i * 16 + 14], h = 15 * Math.hypot(im[i * 16 + 4], im[i * 16 + 5], im[i * 16 + 6]), w = 0.4 * h;   // a plume: 12 to 14 m by its scale, a third as wide
          box.expandByPoint(_pp.set(x - w, y - 2, z - w)); box.expandByPoint(_pp.set(x + w, y + h, z + w)); }
        bands.push({ end: i1, box }); }
      return { m, bands };
    });
    await ctx.yield();
    await ctx.yield();

    // ---------- sky, light, mist ----------
    const sky = makeSky({ rng, renderer: ctx.renderer, sunDirection: look.sun, ...look.sky });
    sky.object.traverse((o) => { if (o.material) o.material.transparent = true; });   // set once, before anything is compiled: the kit's dome is an opaque material, which three.js draws without blending, so its setOpacity would not cross-fade
    scene.add(sky.object); sky.setOpacity(look.ghostSky ?? 0.3);
    await ctx.yield();
    // the lid of mist seen from below: a dome with a pearl horizon and a cooler zenith, warmer on the sun's side, a broad glow toward the
    // sun and slow drifting bands. The real sky ghosts through it from the first frame and takes over as the mist tears.
    const domeU = { uHor: { value: cMist.clone() }, uZen: { value: MD ? new THREE.Color(md.zen).multiplyScalar(md.kZ) : new THREE.Color(look.dome.zen).multiplyScalar(look.dome.kZ) }, uLobe: { value: new THREE.Color(look.dome.lobe).multiplyScalar(MD ? md.kL : look.dome.kL) },
      uSun: { value: SUN }, uTime: time, uK: { value: 1 }, uBand: { value: MD ? md.band : look.dome.band } };
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.ShaderMaterial({ uniforms: domeU, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 900., 1.); }',
      fragmentShader: `uniform vec3 uHor, uZen, uLobe, uSun; uniform float uTime, uK, uBand; varying vec3 vD;\n${GLSL_N}
        void main(){ vec3 d = normalize(vD); float up = max(d.y, 0.), g = 1. - exp(-up * 5.);
          vec3 c = mix(uHor, uZen, g);
          float side = dot(normalize(d.xz + vec2(1e-4, 0.)), normalize(uSun.xz + vec2(1e-4, 0.)));
          c *= mix(vec3(.9, .97, 1.1), vec3(1.1, 1., .86), .5 + .5 * side);
          float ang = acos(clamp(dot(d, normalize(uSun)), -1., 1.));
          c += uLobe * (exp(-ang * 3.) + .55 * exp(-ang * 1.));
          vec2 q = d.xz / (abs(d.y) + .3);
          float b = gfbm(q * vec2(.8, 1.7) + uTime * vec2(.018, .006)) * .65 + gvn(q * vec2(2.6, 5.3) - uTime * vec2(.026, .009)) * .35;
          c *= 1. + uBand * 2.2 * (b - .5) * smoothstep(-.02, .2, d.y);
          gl_FragColor = vec4(c * uK, 1.); }` }));
    dome.renderOrder = -2; dome.frustumCulled = false; dome.name = 'mist-dome'; scene.add(dome);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.25 }); scene.add(rig.object);
    const sunI = rig.sun.intensity, hemiI = rig.hemi.intensity, hemiC0 = rig.hemi.color.clone(), hemiCIn = night ? hemiC0.clone() : new THREE.Color('#a4bdf2');   // down in the court the fill is the blue of the shade
    const ridges = makeHorizonRidges({ rng: rng.fork('ridges'), layers: 4, radius: [1300, 3000], height: [90, 320], base: -40, jagged: 0.22, colorNear: look.ridge, haze: cMist, sunDir: SUN, hazeNear: 0.6, hazeFar: 0.9, rim: night ? 0.15 : 0.35 });   // their own haze, not the scene fog: faint blue ranks stand over the mist from the first frame
    scene.add(ridges.object);
    // (round 20) the four ranks step in tone and colour, rank behind rank: see RIDGE_FRAG. Terms of the ridges' own material only.
    // The call above is live's line, kept as it stood: with RIDGE_FRAG in place its colorNear, hazeNear and hazeFar no longer act
    // (the look's pair of rank colours and the foot mist stand in their place), and its comment speaks of live's haze.
    { const ru = ridges.material.uniforms; ru.uRankNear = { value: new THREE.Color(look.ranks[0]) }; ru.uRankFar = { value: new THREE.Color(look.ranks[1]) }; ru.uRankP = { value: new THREE.Vector4(RANK_FOOT, RANK_FALL, RANK_RELIEF, RANK_STEP) }; ru.uRankTop = { value: RANK_TOP };
      ridges.material.fragmentShader = RIDGE_FRAG; ridges.material.needsUpdate = true; }
    await ctx.yield();
    const ghostMat = (k, disc) => new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Vector3().fromArray(look.ghost) }, uK: { value: k }, uDisc: { value: disc } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uK, uDisc; varying vec2 vUv; void main(){ float r = length(vUv); float a = (smoothstep(.08, .055, r) * 1.5 * uDisc + exp(-r * 5.5) * .6 + exp(-r * r * 60.) * .5 * uDisc) * uK * smoothstep(1., .65, r); gl_FragColor = vec4(uCol * a, 1.); }',
    });
    const ghostK = MD ? md.ghostK : look.ghostK;
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ghostMat(ghostK, 1));
    ghost.renderOrder = -0.4; ghost.frustumCulled = false; ghost.scale.setScalar(1650); scene.add(ghost);
    // in the golden and night looks the sun is not ahead on the climb-out: the mist thins and brightens along that heading instead
    const CLIMB = new THREE.Vector3(0.86, 0.46, 0.2).normalize();
    const ghost2 = lookId === 'morning' ? null : new THREE.Mesh(ghost.geometry, ghostMat(0, 0));
    if (ghost2) { ghost2.renderOrder = -0.4; ghost2.frustumCulled = false; ghost2.scale.setScalar(2700); scene.add(ghost2); }
    const set = fx.fxGroup(); scene.add(set.object);
    await ctx.yield();
    const pool = set.add(fx.makeGroundFog({ time, layers: 6, size: 1800, y: 0, height: 8, color: cMistFar, opacity: 0.5, coverage: 0.8, scale: 0.011, wind: [1.5, 0.25], near: [5, 30], sunDir: SUN, sunColor: lc, scatter: night ? 0.12 : 0.3 }));
    // the mist sea seen from above: two noisy sheets (parallax), holes where the rings' courts stand out of it, the rings' long shadows
    const seaLit = new THREE.Color(seaLitHex), seaShade = new THREE.Color(seaShadeHex);
    { const mx = Math.max(seaLit.r, seaLit.g, seaLit.b), cap = night ? 0.5 : SEA_CAP; if (mx > cap || !night) seaLit.multiplyScalar(cap / mx); }
    MIST.uMistCol.value.copy(seaShade).lerp(seaLit, 0.74);
    // (the map of the land's height carries, beside the height, the land's own HOLLOWS: the contour noise of qAt, the term that bends the terraces, which
    // is negative where the contours swing west and the land lies lower than the even slope; none on the levelled yards of the rings. The sea's shore
    // reads it, below: TONGUE.)
    await ctx.yield();
    const HT = { x0: -300, z0: -330, w: 720, d: 800, n: 112 }, hd = new Uint16Array(HT.n * HT.n * 2);
    for (let j = 0, k = 0; j < HT.n; j++) { if (j === HT.n >> 1) await ctx.yield();
      for (let i = 0; i < HT.n; i++, k++) { const x = HT.x0 + (i + 0.5) / HT.n * HT.w, z = HT.z0 + (j + 0.5) / HT.n * HT.d;
        hd[k * 2] = THREE.DataUtils.toHalfFloat(heightAt(x, z)); hd[k * 2 + 1] = THREE.DataUtils.toHalfFloat((qAt(x, z) - (0.5 + (LANE_X - x) * QS)) * (1 - padAt(x, z))); } }
    const hTex = new THREE.DataTexture(hd, HT.n, HT.n, THREE.RGFormat, THREE.HalfFloatType); hTex.minFilter = hTex.magFilter = THREE.LinearFilter; hTex.needsUpdate = true;
    await ctx.yield();
    // THE SEA'S HOLES FOLLOW EACH RING'S OWN PLAN (uPlan: the wall's inner face from the ring's middle, WALL_IN of the ring's own metres x its scale; the
    // power of its plan, 2 = round, the square ring's own for the square ring). Inside the inner face the sheets are open: the court and its galleries
    // stand in their own colours down to the court's own pool (the parts' dissolve). They close across the wall's own thickness (to WALL_OUT), with no
    // noise on that edge: a ragged one would lay the sheet into the rooms or leave a moat outside the wall. Ring A's hole is as it was.
    // TONGUE: along the shore the sea runs up the land's hollows: where the land's contour noise (the map's second channel) is under -0.05 the sheet is
    // taken to lie up to TONGUE metres deeper than it does, whole under -0.2: tongues of mist a terrace and a half further up each hollow (a terrace
    // rises STEP, 2.5 m), the shoulders between them standing clear as they did. Nothing is taken from the sea anywhere.
    const WALL_IN = 46, WALL_OUT = 48, TONGUE = 4;
    const seaU = { uPlan: { value: Object.values(RING).map((r) => new THREE.Vector2(WALL_IN * r.s, r.sq || 2)) }, uHt: { value: hTex }, uHtBox: { value: new THREE.Vector4(HT.x0, HT.z0, HT.w, HT.d) }, ...fx.fogUniforms(), uTime: time, uSun: { value: SUN }, uLit: { value: seaLit }, uShade: { value: seaShade }, uK: { value: 0 }, uCover: { value: 0.3 }, uThin: { value: new THREE.Vector2(0.3, 3.4) }, uHole: MIST.uHole, uRings: MIST.uRings };
    const seaMat = (layer) => new THREE.ShaderMaterial({
      uniforms: { ...seaU, uLayer: { value: layer } }, transparent: true, depthWrite: false, fog: true,
      vertexShader: `varying vec3 vW;\n${fx.GLSL_FOG_PARS_VERT}\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;\n${fx.GLSL_FOG_VERT}\n}`,
      fragmentShader: `uniform float uTime, uK, uCover, uLayer; uniform vec2 uThin; uniform vec3 uSun, uLit, uShade; uniform vec4 uHole, uHtBox; uniform vec4 uRings[5]; uniform vec2 uPlan[5]; uniform sampler2D uHt; varying vec3 vW;\n${GLSL_N}\n${fx.GLSL_FOG_PARS_FRAG}
        float seaH(vec2 p){ vec2 q = p + (vec2(gvn(p * .7 + 3.), gvn(p * .7 + 11.)) - .5) * 1.2; return gfbm(q) * .62 + gvn(q * 4.3 + uTime * .05) * .22 + gvn(p * .23 + 7.) * .34 + gvn(q * 12.7 - uTime * .08) * .07; }
        // cloud tops: round heads with creased valleys between them (45 m, 19 m and 8 m across), for the light and the ragged edge
        float gA1 = 0.;
        float seaB(vec2 p){ vec2 w = p + (vec2(gvn(p * 1.9 + 3.), gvn(p * 1.9 + 11.)) - .5) * .3; gA1 = abs(gvn(w * 2.7 + 2. + uTime * .012) * 2. - 1.);
          return gA1 * .55 + abs(gvn(w * 6.3 - uTime * .03 + 9.) * 2. - 1.) * .3 + abs(gvn(w * 15. + uTime * .05) * 2. - 1.) * .15; }
        void main(){ float d = length(vW - cameraPosition), bk = 1. - smoothstep(300., 800., d); vec3 vd = (vW - cameraPosition) / max(d, 1e-3);
          vec2 p = vW.xz * .0085 - uTime * vec2(.058, .013) * (1. - .4 * uLayer) + uLayer * 13.7;
          p += vd.xz / max(-vd.y, .25) * (seaB(p) - .34) * .034 * bk;   // the heads stand four metres proud of the valleys: seen aslant they lean over them
          float h = seaH(p), e = .07, hx = seaH(p + vec2(e, 0.)), hz = seaH(p + vec2(0., e));
          float eb = .016, b0 = seaB(p); float a1 = gA1; float bx = seaB(p + vec2(eb, 0.)), bz = seaB(p + vec2(0., eb));
          vec3 n = normalize(vec3(-(hx - h) / e * 2. - (bx - b0) / eb * .42 * bk, 1., -(hz - h) / e * 2. - (bz - b0) / eb * .42 * bk));
          float hole = 1. - uHole.z * (1. - smoothstep(uHole.w * .5, uHole.w * 1.45, length(vW.xz - uHole.xy) + (h - .55) * 46.));
          vec2 sd = uSun.xz / max(uSun.y, .15); float shd = 0.;
          for (int i = 0; i < 5; i++) { vec4 rg = uRings[i]; vec2 dd = vW.xz - rg.xy; float up = rg.w - vW.y, out_ = smoothstep(-3., 2., up), L = max(up - rg.z * .06, 0.);
            float hr = rg.z * (i == 0 ? .93 : .7);   // ring A is flown inside while the sea sinks past its galleries: its hole reaches the wall
            vec2 pl = uPlan[i], ad = min(abs(dd), vec2(4000.)); float lp = pl.y > 2.5 ? pow(pow(ad.x, pl.y) + pow(ad.y, pl.y), 1. / pl.y) : length(dd);   // the offset measured by the ring's own plan
            hole *= 1. - out_ * (1. - (i == 0 ? smoothstep(hr - 3., hr + 1., length(dd) + (h - .5) * 5.) : smoothstep(pl.x, pl.x * ${(WALL_OUT / WALL_IN).toFixed(4)}, lp)));
            vec2 a = -sd * L; float t = clamp(dot(dd, a) / max(dot(a, a), 1e-3), 0., 1.);
            shd = max(shd, out_ * (1. - smoothstep(rg.z * .93, rg.z * .93 + 3. + L * .22, length(dd - a * t)))); }
          vec2 land = textureLod(uHt, (vW.xz - uHtBox.xy) / uHtBox.zw, 0.).rg;   // the land's height, and its hollows
          float cv = uCover - .15 * uLayer, shore = smoothstep(uThin.x, uThin.y, vW.y - land.r + (h - .5) * 3. + ${TONGUE.toFixed(1)} * smoothstep(.05, .2, -land.g));
          float a = smoothstep(cv - .3, cv + .36, h + (b0 - .34) * .22 * bk) * uK * hole * shore * smoothstep(4., 24., d) * smoothstep(1., 9., cameraPosition.y - vW.y);
          if (a < .004) discard;
          vec3 sn = normalize(uSun); float l = clamp(dot(n, sn) * .95 + .42, 0., 1.), head = smoothstep(.1, .5, b0), valley = (1. - smoothstep(.02, .4, a1)) * bk;
          vec3 col = mix(uShade, uLit, clamp(l * (1. - .72 * valley) * mix(1., .5 + .5 * head, bk) * (.76 + .24 * smoothstep(.3, .7, h)) * 1.4, 0., 1.)) * (.9 + .2 * h) * (1. - .1 * uLayer);   // the heads milk white in the sun, the valleys between them in blue-white shade
          col *= mix(1., .9 + .16 * smoothstep(.3, .8, b0), bk);
          col += uLit * .2 * pow(clamp(dot(vd, sn), 0., 1.), 3.) * smoothstep(.35, .9, l);   // a soft rim toward the sun
          col = mix(col, uShade * vec3(.56, .6, .7), shd * .94 * step(.02, uSun.y));
          gl_FragColor = vec4(fxApplyFog(col), a); }`,
    });
    const seaG = new THREE.PlaneGeometry(3400, 3400).rotateX(-Math.PI / 2);
    const sea2 = new THREE.Mesh(seaG, seaMat(1)); sea2.name = 'mist-sea-low'; sea2.renderOrder = 2.2; sea2.frustumCulled = false; scene.add(sea2);
    const sea = new THREE.Mesh(seaG, seaMat(0)); sea.name = 'mist-sea'; sea.renderOrder = 2.3; sea.frustumCulled = false; scene.add(sea);
    // mist pouring out of every gate and draining east along the top of the sea
    const pourU = { ...fx.fogUniforms(), uTime: time, uTop: { value: 26 }, uThin: seaU.uThin, uK: { value: 0 }, uCol: { value: seaLit.clone().multiplyScalar(1.3) }, uShade: { value: seaShade }, uSun: { value: SUN } };
    {
      const quad = new THREE.PlaneGeometry(2, 2), g = new THREE.InstancedBufferGeometry(), a = [], b = [], pr = rng.fork('pour'), NPP = 22;
      g.index = quad.index; g.setAttribute('position', quad.attributes.position);
      for (const r of Object.values(RING)) { const np = (r === RING.B || r === RING.C) ? 12 : NPP; for (let i = 0; i < np; i++) { a.push(r.x, r.y, r.z - 48.5 * r.s, r.s); b.push((i + pr()) / np, pr(), pr.range(0.036, 0.05), pr()); } }
      // billows standing on the sea round every ring wall and along the hill shore (aSeed.z < 0), so the waterline is ragged and has height
      const bl = rng.fork('billow'), offTree = (x, z) => Math.hypot(x - 46, z - 166) > 20 && Math.hypot(x + 40, z - 196) > 20, bil = (x, z, size) => { if (offTree(x, z)) { a.push(x, heightAt(x, z), z, size); b.push(bl(), bl(), -1, bl()); } };   // (no billow stands in a camphor: the tree would cut it with a hard edge)
      for (const r of Object.values(RING)) for (let i = 0; i < 10; i++) { const an = (i + bl()) / 10 * TAU, rr = (52 * r.s * (r.sq ? 1.14 : 1) + bl.range(1, 7)); bil(r.x + Math.cos(an) * rr, r.z + Math.sin(an) * rr, bl.range(9, 16) * (0.7 + 0.3 * r.s)); }
      for (let i = 0; i < 14; i++) bil(-197 + bl.range(-7, 7), -190 + (i + bl()) * 41, bl.range(14, 22));
      // a second, outer rank lapping every wall, banks of heads out on the open sea between the rings, and big ones far down the valley so the sea's horizon is lumpy
      const b2 = rngNew.fork('billow2'), onRing = (x, z, m) => Object.values(RING).some((r) => Math.hypot(x - r.x, z - r.z) < 52 * r.s * (r.sq ? 1.2 : 1) + m);
      const bil2 = (x, z, size) => { if (offTree(x, z)) { a.push(x, heightAt(x, z), z, size); b.push(b2(), b2(), -1, b2()); } };
      for (const r of Object.values(RING)) for (let i = 0; i < 9; i++) { const an = (i + b2()) / 9 * TAU, rr = 52 * r.s * (r.sq ? 1.14 : 1) + b2.range(9, 20), x = r.x + Math.cos(an) * rr, z = r.z + Math.sin(an) * rr; if (!onRing(x, z, 3)) bil2(x, z, b2.range(12, 19) * (0.7 + 0.3 * r.s)); }
      // (the banks between the rings keep 34 m off the line that is flown: their tries are counted against that line, so they take a stream of their own,
      // 'billows-near'; the far ones after them keep `b2`)
      const bnr = stream('billows-near'), bilN = (x, z, size) => { if (offTree(x, z)) { a.push(x, heightAt(x, z), z, size); b.push(bnr(), bnr(), -1, bnr()); } };
      for (let i = 0, tr = 0; i < 30 && tr < 400; tr++) {
        const x = bnr.range(-150, 215), z = bnr.range(-80, 215); if (onRing(x, z, 14) || path.nearestXZ(x, z).dist < 34) continue;
        bilN(x, z, bnr.range(15, 23)); for (let k = 0; k < 2; k++) { const an = bnr() * TAU, rr = bnr.range(9, 16), x2 = x + Math.cos(an) * rr, z2 = z + Math.sin(an) * rr; if (!onRing(x2, z2, 6)) bilN(x2, z2, bnr.range(9, 14)); }
        i++;
      }
      for (let i = 0; i < 40; i++) { const an = b2.range(-1.35, 2.0), rr = b2.range(230, 640); bil2(60 + Math.cos(an) * rr, 80 + Math.sin(an) * rr, b2.range(26, 46)); }
      g.setAttribute('aGate', new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(b), 4)); g.instanceCount = a.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: pourU, transparent: true, depthWrite: false, fog: true,
        vertexShader: `attribute vec4 aGate, aSeed; uniform float uTime, uTop; uniform vec2 uThin; uniform vec3 uSun; varying vec2 vUv; varying vec3 vP; varying vec4 vL;\n${fx.GLSL_FOG_PARS_VERT}
          void main(){ float l = fract(uTime * max(aSeed.z, 0.) + aSeed.x), s = aGate.w, size; vec3 p = vec3(aGate.x, 0., aGate.z);
            vL = vec4(normalize((viewMatrix * vec4(uSun, 0.)).xyz), step(aSeed.z, 0.));   // the sun in view space; w = 1 on a billow
            if (aSeed.z < 0.) { float br = .5 + .5 * sin(uTime * (.11 + .1 * aSeed.x) + aSeed.y * 40.);
              p.x += sin(uTime * .05 + aSeed.y * 9.) * 3.; p.z += cos(uTime * .04 + aSeed.x * 7.) * 3.;
              p.y = uTop - .8 + (aSeed.w - .35) * 2.6 + br * .8; size = s * (.85 + .3 * br);
              vP = vec3(.95 * (.75 + .25 * br) * smoothstep(uThin.x + .5, uThin.y, uTop - aGate.y), aSeed.y, aSeed.x);
            } else {
              p.z += (-3. - 24. * (1. - exp(-l * 2.4)) + (aSeed.w - .5) * 18. * l) * s;
              p.x += (l * l * 48. + (aSeed.y - .5) * (4. + 20. * l)) * s;
              p.y = max(uTop + .5, aGate.y + 2.4) + (aSeed.w - .5) * 1.6 + l * 1.6;
              size = mix(7., 24., sqrt(l)) * s;
              vP = vec3(smoothstep(0., .3, l) * pow(1. - l, 1.25) * .85, aSeed.y, l); }   // the pour thickens as it spreads: no dense ball at the gate
            vUv = position.xy;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.); mvPosition.xy += position.xy * size * vec2(1., .6); gl_Position = projectionMatrix * mvPosition;
            if (aSeed.z < 0.) vP.x *= smoothstep(25., 70., -mvPosition.z);   // a billow never sits in front of the lens\n${fx.GLSL_FOG_VERT}\n}`,
        fragmentShader: `uniform vec3 uCol, uShade; uniform float uK; varying vec2 vUv; varying vec3 vP; varying vec4 vL;\n${GLSL_N}\n${fx.GLSL_FOG_PARS_FRAG}
          void main(){ float r = length(vUv), n = gvn(vUv * 2.3 + vP.y * 19. + vec2(vP.z * 2., 0.)), bw = vL.w, n2 = gvn(vUv * 5.3 + vP.y * 31. + 4.);
            float a = (1. - smoothstep(.15, 1., r + (n - .5) * .6 + (n2 - .5) * .3 * bw)) * vP.x * uK;
            a *= mix(1., smoothstep(-1., -.45, vUv.y), bw);   // a billow stands on the sheet: no underside
            if (a < .004) discard;
            vec3 pour = (mix(uShade, uCol, .5 + .5 * smoothstep(-.7, .6, vUv.y)) + uCol * .2 * smoothstep(.1, .7, vUv.y)) * (.92 + .2 * n);
            // a billow is a head of cloud: a dome lit from the sun's side, blue on the other, with smaller heads on it
            vec3 nv = normalize(vec3(vUv * .85 + (vec2(n, n2) - .5) * .8, sqrt(max(1. - r * r * .72, .02))));
            float lb = clamp(dot(nv, vL.xyz) * .8 + .42, 0., 1.) * (.3 + .7 * smoothstep(-.5, .3, vUv.y + (n - .5) * .5));
            vec3 head = mix(uShade, uCol * .8, lb) * (.9 + .16 * n2) + uCol * .1 * smoothstep(.75, 1., lb);
            gl_FragColor = vec4(fxApplyFog(mix(pour, head, bw)), a); }` }));
      m.name = 'gate-mist'; m.frustumCulled = false; m.renderOrder = 2.6; scene.add(m);
    }
    // the portal's glow on the shadowed cobbles of ring E's inner court
    const kerbGlow = new THREE.Mesh(new THREE.CircleGeometry(17, 40).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { ...fx.fogUniforms(), uTime: time, uCol: { value: new THREE.Color(look.portal) }, uK: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
      vertexShader: `varying vec2 vP;\n${fx.GLSL_FOG_PARS_VERT}\nvoid main(){ vP = position.xz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n${fx.GLSL_FOG_VERT}\n}`,
      fragmentShader: `uniform vec3 uCol; uniform float uK, uTime; varying vec2 vP;\n${fx.GLSL_FOG_PARS_FRAG}
        void main(){ float r = length(vP) / 17., f = max(1. - r, 0.); float a = f * f * (.55 + .45 * smoothstep(.3, .55, r)) * (.9 + .1 * sin(uTime * 1.7 + r * 9.));
          gl_FragColor = vec4(uCol * a * uK * (1. - fxFog()), 1.); }`,
    }));
    kerbGlow.position.set(PORTAL[0], 0.22, PORTAL[2]); kerbGlow.renderOrder = 2; kerbGlow.name = 'kerb-glow'; scene.add(kerbGlow);
    const courtGlowU = { ...fx.fogUniforms(), uCol: { value: new THREE.Color('#ff9440') }, uK: { value: night ? 0.2 : 0 } };
    if (night) {   // every court a bowl of amber light, seen from the air
      const gm = new THREE.ShaderMaterial({ uniforms: courtGlowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
        vertexShader: `varying vec2 vP;\n${fx.GLSL_FOG_PARS_VERT}\nvoid main(){ vP = uv * 2. - 1.; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n${fx.GLSL_FOG_VERT}\n}`,
        fragmentShader: `uniform vec3 uCol; uniform float uK; varying vec2 vP;\n${fx.GLSL_FOG_PARS_FRAG}
          void main(){ float r = length(vP), a = smoothstep(.56, .96, r) * (1. - smoothstep(.96, 1., r)); a *= a * 1.5; gl_FragColor = vec4(uCol * a * uK * (1. - fxFog()), 1.); }` });
      for (const r of Object.values(RING)) { const m = new THREE.Mesh(new THREE.CircleGeometry(41 * r.s * (r.sq ? 1.1 : 1), 28).rotateX(-Math.PI / 2), gm); m.position.set(r.x, r.y + 0.3, r.z); m.renderOrder = 2; m.name = 'court-glow'; scene.add(m); }
    }
    const creep = set.add(fx.makeMist({ rng: rng.fork('creep'), time, count: Math.round(46 * detail), area: [120, 2.5, 210], center: [LANE_X, 2.0, -135], size: [10, 24], color: cMist, opacity: 0.2, drift: [0.55, 0, 0.2] }));
    const rags = set.add(fx.makeMist({ rng: rng.fork('rags'), time, count: Math.round(64 * detail), area: [460, 13, 540], center: [45, 17, 110], size: [28, 72], color: cMistFar, opacity: 0.0, drift: [1.7, 0, 0.3], flatten: 0.5 }));
    // mist crawling across ring A's court and galleries, and streaming past the foot of its wall where the camera climbs it
    const courtMist = set.add(fx.makeMist({ rng: rng.fork('court'), time, count: Math.round(28 * detail), area: [72, 12, 72], center: [0, 9, 0], size: [10, 24], color: cMist, opacity: 0.05, drift: [0.9, 0, 0.3] }));
    const wallMist = set.add(fx.makeMist({ rng: rng.fork('wall'), time, count: Math.round(16 * detail), area: [64, 14, 22], center: [20, 11, -62], size: [11, 22], color: cMist, opacity: 0.22, drift: [2.6, 0, 0.3] }));
    const raysE = set.add(fx.makeGodRays({ rng: rng.fork('rays'), time, position: [RING.E.x + SUN.x * 60, 36, RING.E.z + SUN.z * 60], direction: [-SUN.x, -SUN.y, -SUN.z], radius: 26, count: 12, length: 84, width: [2.2, 7], color: lc, intensity: 0, fogAmount: 0.5 }));
    await ctx.yield();
    const motes = set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(1500 * detail), colors: ['#ffffff', '#fff4dc', '#eaf2ff'], intensity: night ? 0.6 : 1.0 }));
    const beacon = set.add(fx.makeGlow({ time, position: [PORTAL[0], PORTAL[1] + 2, PORTAL[2]], color: look.portal, size: 60, intensity: 0, fogAmount: 0.25, flicker: 0.15 }));
    const bowl = set.add(fx.makeGlow({ time, position: [PORTAL[0], 23, PORTAL[2]], color: look.portal, size: 70, intensity: 0, fogAmount: 0.15, core: 0.8, flicker: 0.1 }));
    const rainP = rain ? set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(1600 * detail), opacity: 0.3, velocity: [0.6, -15, 0.2] })) : null;
    const paper = festival ? set.add(fx.makeParticles({ rng: rng.fork('paper'), preset: 'petals', time, count: Math.round(650 * detail), colors: ['#D3271B', '#e8402a', '#b81c14'] })) : null;
    await ctx.yield();

    // ---------- swallows (the cast), egrets, the dog ----------
    // where the eye rests along the way
    const gazeV = new THREE.Vector3(), gazeV2 = new THREE.Vector3(), gazeV3 = new THREE.Vector3(), gazeV4 = new THREE.Vector3();
    const gazeS = new THREE.Vector3(), CLIMB_OUT = new THREE.Vector3(1, 0.3, 0.05).normalize();
    // The point the eye rests on round the lap, by how far round the helix we are (degrees). Four looks, laid by the lap's own geometry, each held whole for a
    // quarter turn (90 degrees) and more and eased into the next over 35 degrees:
    //   to 122          the oncoming galleries, level: posts, rails, doors, lanterns and trays three tiers deep (the pull itself is whole from the helix's first
    //                   point, so this look is held whole for 122 degrees of the first turn);
    //   157 to 247      up to the roof ring's inner eave and its necklace of lanterns, 48 degrees ahead of us round the ring: the eave itself (ROOF.rEaveIn,
    //                   ROOF.eaveIn), not the sky over the roof; a quarter turn and no longer;
    //   282 to 372      down into the court from gallery height, to the ring of the court where its scenes stand (17 m from the middle): the last quarter of
    //                   the first turn;
    //   from 407        through the sink (360 to 480) and round the low turn: in over the court, to a point that runs ahead of us round its middle
    //                   (11 to 15 m out), until the pull lets go for the climb-out (it is whole to where the helix turns upward, 540 degrees).
    const LAP_LOOK = { up: [122, 157], down: [247, 282], court: [372, 407] };
    const lapGaze = (d, out) => {
      const kUp = sstep(LAP_LOOK.up[0], LAP_LOOK.up[1], d), kDn = sstep(LAP_LOOK.down[0], LAP_LOOK.down[1], d), kIn = sstep(LAP_LOOK.court[0], LAP_LOOK.court[1], d), k2 = sstep(470, 560, d);
      const a = (d + mix(mix(mix(36, 48, kUp), 62, kDn), mix(42, 52, k2), kIn)) * D2R, r = mix(mix(mix(39, ROOF.rEaveIn, kUp), 17, kDn), mix(11, 15, k2), kIn), y = mix(mix(mix(lapY(d) - 1.9, ROOF.eaveIn, kUp), 1, kDn), 2.4, kIn);
      return out.set(r * Math.cos(a), y, r * Math.sin(a)); };
    // THE PLACES AND THE EASES THE BEATS ARE KEYED TO. Every span below (a look, a flock's stretch, a change of the mist or the light, the pace) ends at an
    // anchor (mRidge, mLap0, mLap1, mOut, mApp, mTurn, mEIn) or at one of the places here. Each is found on the route as the anchors are: the first metres
    // flown, from d0 on, at which a rule of the place holds (walked in quarter metres, then halved to the millimetre; f is handed the eye's place and the
    // metres flown). A change runs from one place to another. Where it needs a length of its own instead it takes one of two: SEC, one second of flight
    // at the flight's mean speed (the shortest move of the eye or the light that reads as a move and not a cut), or QUARTER, a quarter turn of the helix
    // (the length of the route's own slowest change of course). No end is a share of a length.
    const mAt = (f, d0) => { let d = d0; while (d < LEN && !f(path.posAtDist(d, _pp), d)) d += 0.25; let lo = Math.max(d0, d - 0.25), hi = d; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (f(path.posAtDist(m, _pp), m)) hi = m; else lo = m; } return hi; };
    const SEC = LEN / duration, QUARTER = (mLap1 - mLap0) * 90 / LAPDEG, rInA = (q) => Math.hypot(q.x - RING.A.x, q.z - RING.A.z);
    // sightOver(q, r, rf, h): from the place q, does a sight line over ring r's roof ridge reach a thing h up that stands rf from the ring's centre on its far
    // side (the ring's own metres)? The test update() makes for the camera (seesOver, below), made here for a place on the route.
    const sightOver = (q, r, rf, h) => { const D = Math.hypot(q.x - r.x, q.z - r.z), s = r.s, top = r.y + 19.4 * s, rr = 45.4 * s; if (D <= rr + 1) return true; if (q.y <= top) return false; return q.y - (q.y - top) * (D + rf * s) / (D - rr) < r.y + h * s; };
    // On the way in:
    //   mGate   the eye is GATE_SEE from the gate: four times the height of the wall the gate stands in (to its outer eave: 66 m). From about four times
    //           a face's height the things on it (the granite surround, the plaque, the lanterns over it) stand clear of the face as things of their own.
    //   mFoot   the route has risen one terrace riser (STEP) over the height it keeps along the lane: the climb up the wall has begun.
    //   mLip    the eye is level with the wall's lip (the outer eave): the gate goes under it and the ground mist lies below.
    //   mUnder  the eye is down inside the ring, under its inner eave: from here nothing that stands outside the wall at ground level can be seen.
    const GATE_AT = [0, 7, -50], GATE_SEE = 4 * ROOF.eaveOut;
    const mGate = mAt((q) => Math.hypot(q.x - GATE_AT[0], q.y - GATE_AT[1], q.z - GATE_AT[2]) <= GATE_SEE, 0), mFoot = mAt((q) => q.y >= ENTRY[1] + STEP, 0), mLip = mAt((q) => q.y >= ROOF.eaveOut, 0);
    const mUnder = mAt((q) => rInA(q) < ROOF.rEaveIn && q.y < ROOF.eaveIn, mRidge);
    await ctx.yield();
    // Round the helix (its degrees read from the place itself, lapDeg): mLow, where the sink ends (480 degrees); mRise, where it turns upward (LAPDEG - 85).
    const mLow = mAt((q, d) => lapDeg(d / LEN) >= 480, mLap0), mRise = mAt((q, d) => lapDeg(d / LEN) >= LAPDEG - 85, mLow);
    await ctx.yield();
    // On the way out:
    //   mOver   the eye is level with ring A's ridge on the climb-out: it sees over the roof.
    //   mHigh   the eye is a roof's height over the ridge (twice the ridge's height): the eave we cross lies far below, the far rings stand clear of A's roof.
    //   mSB     the route crosses the line that joins the middles of rings S and B: it is between the two.
    //   mSee    a sight line over ring E's roof ridge first reaches the portal's upper rim: the portal itself is in sight.
    const mOver = mAt((q) => q.y >= ROOF.ridgeY, mLap1), mHigh = mAt((q) => q.y >= 2 * ROOF.ridgeY, mOver);
    const mSB = mAt((q) => (RING.B.x - RING.S.x) * (q.z - RING.S.z) - (RING.B.z - RING.S.z) * (q.x - RING.S.x) >= 0, mOut);
    const mSee = mAt((q) => sightOver(q, RE, 0, (PORTAL[1] + PORTAL_R * Math.cos(DIVE)) / RE.s), mOut);
    await ctx.yield();
    // The look toward the low sun (or, when the sun does not stand east, along the line of the climb) is for the stretch on which we fly toward it out of
    // the court: from mSun0, where the route's heading has come within SUN_NEAR (an eighth of a turn) of that bearing, to mSun1, where the heading
    // leaves it again. One rule for every look, of the heading alone.
    const SUN_NEAR = 45, sunDir = SUN.x > 0.3 ? SUN : CLIMB_OUT, sunBear = Math.atan2(sunDir.z, sunDir.x);
    const sunward = (d) => { path.tangentAtDist(d, _pp2); const a = Math.atan2(_pp2.z, _pp2.x) - sunBear; return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) <= SUN_NEAR * D2R; };
    const mSun0 = mAt((q, d) => sunward(d), mLow), mSun1 = mAt((q, d) => !sunward(d), mSun0);
    await ctx.yield();
    // A pull on the eye: `within` begins at a and ends at b; `hold` is whole from a to b; either eases over `ease` metres at each end (the engine eases
    // a pull over the same length at both its ends). On the way out, where one look hands the eye to the next, the earlier one does not let go until the
    // later one has come on over it (a later pull in this list is laid over the earlier ones), so the eye is not let go between two looks.
    const within = (a, b, ease) => ({ from: a / LEN, to: b / LEN, fade: ease / (b - a) }), hold = (a, b, ease) => within(a - ease, b + ease, ease);
    const pois = [
      { at: GATE_AT, ...within(mGate, mLip, SEC), weight: 0.35 },                          // the gate, its lanterns and the camphor on the way up the wall: from where the gate stands clear of the wall until the eye tops the wall's lip
      { at: (tt, ur) => gazeV4.set(-9, mix(34, 15, sstep(mRidge, mRidge + SEC, ur * LEN)), 8), ...within(mLip - SEC, mLap0, SEC), weight: 0.6 },                // tipping over the ridge: first up at the far roof ring and the sky over it as the swallows pour across (the roof under us lies below the eye's line), then down across the bowl at the sunlit far galleries and the court. Whole from the wall's lip; the eye comes down over the second after the ridge; it hands over to the helix's own looks at the helix's first point
      { at: (tt, ur) => lapGaze(lapDeg(ur), gazeV), ...hold(mLap0, mRise, SEC), weight: 0.6 },   // round the helix: whole from its first point to where it turns upward
      // the climb-out: as we straighten east and rise through the kitchen smoke the low sun stands ahead of us, its shafts coming down through the smoke toward us
      // (when the sun does not stand east of the ring, the evening look, the eye keeps to the line of the climb: the sunlit east galleries, the roof ring and the swallows over it).
      // The pull is whole while we fly toward that bearing (mSun0 to mSun1); it comes on over the second before, as the
      // helix's look lets go, and lets go over the second after, under the east eave's look
      { at: (tt, ur) => { path.pointAt(ur, gazeS); return gazeS.addScaledVector(sunDir, 900); }, ...hold(mSun0, mSun1, SEC), weight: 0.6 },
      // then down over the east eave at the mist sea, ring B and the roof we are leaving (not the sky). The pull comes on while the eye climbs from the
      // level of ring A's ridge, where it first sees over the roof (mOver), to where the route crosses the east eave (mOut): the one long swing of the
      // eye in the flight, from the sun down to the mist, takes that whole climb. It is whole from the eave until the reveal begins to come on (a second
      // short of mHigh, where the eye is a roof's height over the ridge) and goes as it came, over the same length, under the reveal
      { at: (tt, ur) => { const k = sstep(mOver, mHigh, ur * LEN); return gazeV3.set(mix(60, 70, k), mix(8, 2, k), mix(-6, 40, k)); }, ...within(mOver, mHigh - SEC + (mOut - mOver), mOut - mOver), weight: 0.8 },
      { at: (tt, ur) => { const k = sstep(mHigh, mSB, ur * LEN); return gazeV2.set(mix(RING.S.x + 6, 24, k), mix(-6, 2, k), mix(RING.S.z - 22, 205, k)); },
        ...hold(mHigh, mSee + SEC, SEC), weight: 0.7 },                        // the reveal: ring S over ring A's own roof arc, then (by the time we are between rings S and B) the ground between S and E, where the portal's light is, the near rings still under the eye; whole from a roof's height over the ridge until the portal's own look is whole
      { at: PORTAL, ...within(mSee, LEN, SEC), weight: 0.8 },                                // the portal in ring E's well kerb: the eye is on it from where it comes in sight over ring E's roof (whole a second later) to the dive
    ];
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }); await ctx.yield();
    const swallow = { species: 'swifts', size: 2.5, body: '#141c38', belly: '#efe4cc', wingC: '#10172e', trail: '#1a2242', tip: '#0b0f20', head: '#8a3418', tailC: '#10172e' };
    // Every flock is sent to be drawn only on the stretch of the flight (metres flown) on which it can be there to see. A flock that crosses the route or
    // flies along it has that stretch from its own numbers (ownGate), by the kit's rule of how such a flock is moved: its first bird is at the start of
    // its line, and its hindmost bird (the flock's own length behind, the third number of its spread) at the end, at these metres flown:
    //   a crossing flock flies its line at its own speed while the flight's clock runs, speed x duration / LEN metres of its line for each metre we fly,
    //   and its first bird is half way along when we are at the place it is keyed to;
    //   a flock that flies along the route is moved along its line in step with us, its first bird its lead (give or take its drift) ahead.
    // Off its line a bird has faded out (the kit fades the first and last twentieth of an open line), so these gates only save the drawing. The wheel
    // over the tea rows (GATE): until the eye is down inside ring A under its eave (mUnder); ring A's two wheels: whenever a sight line gets inside the
    // ring ('court'); ring E's wheel: with the other rings, from the helix's last point on (see `far` in update).
    const GATE = { 'sw-tea': [-Infinity, mUnder], 'sw-court': 'court', 'sw-roof': 'court', 'sw-e': [mLap1, Infinity] };
    const ownGate = (o, f) => { const L = f.route.length, back = (o.spread ?? F.BIRD_PRESETS.swifts.spread)[2];
      if (o.cross) { const per = LEN / ((o.speed ?? F.BIRD_PRESETS.swifts.speed) * duration); return [o.cross.u * LEN - L / 2 * per, o.cross.u * LEN + (L / 2 + back) * per]; }
      if (o.along) { const a = o.along, per = (a.to - a.from) * LEN / L; return [a.from * LEN - (a.lead + a.drift) * per, a.from * LEN + (L + back + a.drift - a.lead) * per]; }
      return undefined; };
    const NEWF = ['sw-burst-in', 'sw-burst-out', 'sw-high', 'sw-roof'];   // four flocks are seeded from the side stream rngNew, the others from rng
    const flock = (o, label) => { const f = fauna.add(F.makeFlock({ rng: (NEWF.includes(label) ? rngNew : rng).fork(label), ...swallow, ...o })); fauna.items[fauna.items.length - 1].gate = GATE[label] ?? ownGate(o, f); return f; };
    // NO SWALLOW'S BOX WITHIN FLOCK_CLEAR OF THE ROUTE'S EYE, BY PLACE (cure 21a). The kit sets a bird on its flock's line, then aside by its own scatter, then
    // aside by its weave, all in the world's axes. The scatter is dealt by a gauss, which nothing bounds: each of the eleven flocks below has it cut at two
    // sigma, as ring E's wheel cuts its own (cut2: in plan to 0.9 x spread[0], in height to 0.9 x spread[1]). So a bird's BOX is its place on the line give or
    // take, in plan, 0.9 x spread[0] + hypot(1.5 x w0, w2) and, in height, 0.9 x spread[1] + w1 (w the weave; the kit's first weave runs to 1.5 times its
    // number). A wheel's line is the kit's wobbling loop: over the whole range of its draws it runs no further from its centre in plan than 1.4115 x its
    // radius and rises or falls no more than 1.2025 x its height (LOOP_OUT, LOOP_RISE), so every box of a wheel lies in an upright cylinder about its centre.
    // FLOCK_CLEAR is the reach of the kit's own guard (a swallow of size 2.7 begins to shrink 3.39 m from the lens); FLOCK_WING is half a span, kept between a
    // box and a roof. The swallows that named no weave flew the kit's 9, 5, 8 (a box 27 x 10 x 16 m): the tea wheel takes the weave of the world's other
    // wheels (WHEEL_WEAVE), the crossing streams that of its other streams (STREAM_WEAVE); the rate stays the kit's 0.7. The numbers below hold on every seed
    // and at every clock at entry: a wheel by its cylinder against the whole route; a crossing stream because its place on its line follows the metres flown
    // alone, and its first bird is short of its line at station 0 (the kit moves a stream by the clock before entry only once it is on its line). A
    // following stream's place follows the metres flown, its drift's swing and what is left of the carry the kit's treadmill gave it before entry (up to
    // 102 m ahead or 18 m behind its place, spent at 0.6 m for each metre it gains on its line): its box is counted over every place in the stream, the
    // drift's whole swing and the whole carry ahead still left at each station; the carry behind is spent within the first 30 m gained, before either
    // following stream is on its line.
    // CLEAR AIR BY PLACE (flock cure 1; this stands over what the notes on the flocks below say of their heights, of an eave they come out from under and of
    // keeping their heights). The numbers below were laid so that no box came within FLOCK_CLEAR of the eye at the same station; the law now counts by
    // place, at any clock, against the whole flown line. So the five crossings pass OVER the line, each by its own height, and the far stream flies beside
    // and over it, with 2 m of clear air to every box at the cut above (0.9 of the spread; the kit's own deal is held at three sigma before it): sw-eave
    // 9.5 m over its point of the line (it was 1.5), sw-pour 15.5 (3.5), sw-burst-in 15 (0.5: over the roof ring now), sw-burst-out 9 (-3), sw-e-eave 10.5
    // (-5), and sw-up 28 m to the right of the line and 8 m up (7 and 5). Their leads, spreads and counts are as they were; the egrets keep their line with
    // the kit's own weave written out
    const FLOCK_CLEAR = 3.5, FLOCK_WING = 0.45, LOOP_OUT = 1.42, LOOP_RISE = 1.21, WHEEL_WEAVE = [3, 2, 3], STREAM_WEAVE = [2.5, 1.5, 2.5];
    const cut2 = (f, sp) => { const A = f.geometry.attributes.iA, B = f.geometry.attributes.iB, CUT = [0.9 * sp[0], 0.9 * sp[1]];   // (the kit keeps a bird's place in the flock in iA.x, iA.y and iB.w)
      for (let i = 0; i < A.count; i++) { const x = A.getX(i), z = B.getW(i), h = Math.hypot(x, z), k = h > CUT[0] ? CUT[0] / h : 1; A.setX(i, x * k); B.setW(i, z * k); A.setY(i, Math.max(-CUT[1], Math.min(CUT[1], A.getY(i)))); }
      A.needsUpdate = true; B.needsUpdate = true; return f; };
    const flockCut = (o, label) => cut2(flock(o, label), o.spread);
    // A crossing flock is keyed to a place of the route: it is half way across, on the route itself, when we are its own lead short of that place.
    // The swallows of the tea rows hawk over the terrace of tea beside the lane, on the side where the gang picks (GANG_SIDE): their wheel stands at a place
    // along the lane's length drawn from 'tea-flock' (between the lane's two ends, LANE_Z, the wheel's radius in from each); its radius is half the width of
    // a terrace of tea (1 / QS = 45.5 m from riser to riser); its middle is a hedge's height and TEA_OVER (TEA_BUSH + TEA_OVER) over the ground at its own
    // centre, which lies 6 m beyond the last planted row (ROW_REACH), and it rises and falls TEA_RISE about that. Its centre is off the lane's line by the cylinder of its boxes plus FLOCK_CLEAR:
    // 1.42 x 22.73 + 0.9 x 12 + hypot(4.5, 3) = 48.48 m, + 3.5, + 0.1 (the route runs up to 0.04 m to that side of the lane's line): 52.08 m.
    const TEA_R = 0.5 / QS, TEA_RISE = 3.5, TEA_OVER = 6, TEA_BUSH = 0.84, teaZ = stream('tea-flock').range(LANE_Z[0] + TEA_R, LANE_Z[1] - TEA_R);
    const TEA_SPREAD = [12, 3, 26], teaX = LANE_X + GANG_SIDE * (LOOP_OUT * TEA_R + 0.9 * TEA_SPREAD[0] + Math.hypot(1.5 * WHEEL_WEAVE[0], WHEEL_WEAVE[2]) + FLOCK_CLEAR + 0.1);
    flockCut({ count: Math.round(16 * dens), center: [teaX, heightAt(teaX, teaZ) + TEA_BUSH + TEA_OVER, teaZ], radius: TEA_R, height: TEA_RISE, spread: TEA_SPREAD, speed: 15, wander: [...WHEEL_WEAVE, 0.7], size: 2.6 }, 'sw-tea'); await ctx.yield();
    // the stream pours across over the ridge itself (mRidge), on its own line and at its own height (1.5 m over the ridge point), wholly AHEAD of us as we
    // come up the wall (cure 21b). Its lead and its own length do it (the length is the third number of its spread: the kit sets a bird behind the first by
    // a share of it, one die a bird whatever it is). Its first bird is short of its line at station 0 for any lead up to 56.59 m; the length is the greatest
    // even one whose least whole clearing lead (no box within 3.5 m of the route's eye at the same station) is 2 m or more under that: 30 m with lead 54
    // (32 m needs 56; the 44 m it had needs 69). Least box 4.04 m
    flockCut({ count: 78, cross: { path, u: (mRidge - 54) / LEN, lead: 54, angle: 36, side: 1, height: 9.5, span: 170, rise: 4, duration }, spread: [9, 4.5, 30], wander: [...STREAM_WEAVE, 0.7], maxSigma: 3, size: 2.5 }, 'sw-eave');
    await ctx.yield();
    // The wheel before ring A's wall, beside the place where the route climbs it. Its cylinder (1.42 x 13 + 0.9 x 9 + hypot(6, 4) = 33.77 m about its centre)
    // touches the outer eave's circle from outside: its centre is SWW_RC = 52 + 0.45 + 33.77 = 86.22 m from the ring's axis. Round the ring it stands east
    // of the crossing (west of it are the gate and its camphors), at the first bearing at which the centre is 33.77 + 3.5 m in plan from the whole way in
    // (the lane, the gate path, the climb to the ridge): SWW_BEAR, 51.2 degrees from south toward east. Its top (1.21 x 3.5 + 0.9 x 3 + 2.5 = 9.44 m over its
    // middle) is 3.5 m under the lowest the way out later passes over its disc (29.54 m): its middle 16.6 m up, the height of the wall's lip.
    const SWW_SPREAD = [9, 3, 26], SWW_WEAVE = [4, 2.5, 4], SWW_R = 13, SWW_BEAR = 51.2 * D2R, SWW_RC = ROOF.rEaveOut + FLOCK_WING + LOOP_OUT * SWW_R + 0.9 * SWW_SPREAD[0] + Math.hypot(1.5 * SWW_WEAVE[0], SWW_WEAVE[2]);
    flockCut({ count: 30, center: [RING.A.x + SWW_RC * Math.sin(SWW_BEAR), 16.6, RING.A.z - SWW_RC * Math.cos(SWW_BEAR)], radius: SWW_R, height: 3.5, spread: SWW_SPREAD, speed: 15, wander: [...SWW_WEAVE, 0.8], size: 2.6 }, 'sw-wall'); await ctx.yield();
    // pouring out from under the eave where the route comes level with the wall's lip (mLip): on its own line and at its own height, wholly AHEAD of us. Its
    // lead is the least whole one at which no box is within 3.5 m of the route's eye at the same station: 48 m, with the least weave the world has (ring
    // E's 2, 1, 2); a wider weave needs 50 m, and over 48.76 m its first bird would stand on its line at station 0
    flockCut({ count: 36, cross: { path, u: (mLip - 48) / LEN, lead: 48, angle: 96, side: -1, height: 15.5, span: 150, rise: -4, duration }, spread: [7, 3, 34], wander: [2, 1, 2, 0.7], maxSigma: 3, size: 2.6 }, 'sw-pour'); await ctx.yield();
    // THE SIX THAT FLY WITH US round the lap fly the ROUTE. Their station is E_LEAD metres ahead of us along the path, by metres flown; E_SIDE metres to the
    // court's side of the path (its left: the helix turns left round the court) and E_DROP under it. From the helix's last point to where we cross ring A's
    // east eave (mLap1 to mOut) they draw E_AWAY further ahead and rise E_RISE: away up the climb-out. Each bird keeps its own place about the station and
    // weaves its own course with its own phase, from the stream 'escort'. No line here reads the camera. The station's line runs from E0 to E1 of our metres
    // flown: from where we come down inside the ring under its eave (mUnder) to the east eave (mOut); they are drawn on that stretch.
    const E_LEAD = 12, E_SIDE = 2, E_DROP = 1, E_AWAY = 48, E_RISE = 5, E0 = mUnder, E1 = mOut, E_N = 110, _et = new THREE.Vector3();
    const escortPath = { length: LEN, tangentAtDist: (d, out) => path.tangentAtDist(d, out),
      posAtDist(d, out) { const k = sstep(mLap1, mOut, d), s = d + E_LEAD + E_AWAY * k; path.posAtDist(s, out); path.tangentAtDist(s, _et); _et.y = 0; _et.normalize(); out.x -= _et.z * E_SIDE; out.z += _et.x * E_SIDE; out.y += E_RISE * k - E_DROP; return out; } };
    // (a little broader in the wing than the swifts of the storm, and beating more than gliding)
    // CLEAR AIR BY PLACE (flock cure 1): the station above runs along the flown line itself, so by place it cannot stay there. The kit's line for the six is
    // laid a further 11 m to the court's side of that station, across our own heading, and 3 m up (their lead of E_LEAD m is as it was): by place it runs
    // 4.6 to 13 m from the flown line in plan, 9 m at the median, and 2.6 m over it at the median. Their scatter is two fifths of what it was across and in
    // height (1.2 and 0.28 m; it was 3.0 and 0.7), held at three sigma: no bird's reach comes within 2 m of any part of the flown line, at any clock
    const escort = fauna.add(F.makeFlock({ rng: stream('escort'), ...swallow, count: 6, along: { path: escortPath, side: 11, up: 3, lead: 0, points: E_N, from: E0 / LEN, to: E1 / LEN, drift: 0 }, spread: [1.2, 0.28, 4.5], wander: [0.5, 0.3, 0.8, 0.8], maxSigma: 3, size: 2.7, amp: 0.62, glide: 0.3, dihedral: 0.08, body: '#1c2444', wingC: '#161c36', trail: '#232c50',
      palette: { chord: 0.09, girth: 0.046, tail: 0.12, tailW: 0.08 } }));
    fauna.items[fauna.items.length - 1].gate = [E0, E1];
    // The kit spaces a group along its route by the route's own length, and the station's line is not as long as ours (it runs inside the turn). So for our
    // metres flown the kit is handed the fraction at which its group stands at our station: the length of the station's line up to that station (summed
    // here along the kit's own curve, eight steps between stations) over its whole length.
    { const curve = escort.route.curve, STEPS = (E_N - 1) * 8, arc = [0], p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), kitUpdate = escort.update; curve.getPoint(0, p0);
      for (let i = 1; i <= STEPS; i++) { curve.getPoint(i / STEPS, p1); arc.push(arc[i - 1] + p1.distanceTo(p0)); p0.copy(p1); }
      escort.update = (dt, time, cam, pu) => {
        if (!(pu > 1e-5)) return kitUpdate(dt, time, cam, pu);
        const x = sat((pu * LEN - E0) / (E1 - E0)) * STEPS, i = Math.min(STEPS - 1, Math.floor(x));
        return kitUpdate(dt, time, cam, (E0 + (E1 - E0) * (arc[i] + (arc[i + 1] - arc[i]) * (x - i)) / arc[STEPS]) / LEN); }; }
    await ctx.yield();
    // The two bursts keep their lines and heights and cross wholly AHEAD of us, as the pour does: each lead is the least whole one at which no box is
    // within 3.5 m of the route's eye at the same station (passing over or under the route with that much air their boxes would stand in a roof or in the
    // court's floor). Their first birds are 78 m and 436 m short of their lines at station 0.
    flockCut({ count: 30, cross: { path, u: (mLap0 - 45) / LEN, lead: 45, angle: 62, side: -1, height: 15, span: 120, rise: -3, duration }, spread: [6, 2.5, 30], wander: [...STREAM_WEAVE, 0.7], maxSigma: 3, size: 2.5 }, 'sw-burst-in'); await ctx.yield();   // out from under the eave across the helix's first point (mLap0) as we sink into the court
    flockCut({ count: 30, cross: { path, u: (mOut - 66) / LEN, lead: 66, angle: 78, side: 1, height: 9, span: 150, rise: 5, duration }, spread: [7, 3, 34], wander: [...STREAM_WEAVE, 0.7], maxSigma: 3, size: 2.5 }, 'sw-burst-out'); await ctx.yield();   // and again across the place where we clear the east eave (mOut)
    // a stream at a distance on the climb-out and the reveal: its own lead (UP_LEAD) ahead of us while we fly from where the helix turns upward (mRise) to
    // where the last act begins (mApp): the two ends of its line are written by that lead. The six escorts stay the near birds. The lead is the least whole
    // one at which no box (every place in the stream, the drift's whole swing) is within 3.5 m of the route's eye at the same station: 52 m
    const UP_LEAD = 52;
    flockCut({ count: 34, along: { path, side: 28, up: 8, lead: UP_LEAD, from: (mRise + UP_LEAD) / LEN, to: (mApp + UP_LEAD) / LEN, drift: 5 }, spread: [14, 4, 26], wander: [2.5, 1.4, 2.5, 0.7], maxSigma: 3, size: 2.4 }, 'sw-up');
    await ctx.yield();
    // The court's wheel hawks about the hall in the court's middle, inside the lap. Its boxes reach 1.21 x 2 + 0.9 x 3 + 2 = 7.12 m over and under its middle:
    // their foot is half a span over the hall's top (7.5 m), so its middle is 15.1 m up. The widest cylinder about the court's axis with that band which
    // the whole route keeps 3.5 m from is 25.6 m (the low lap, 28.6 m out and 6.2 m up, limits it): radius (25.6 - 0.9 x 6 - hypot(4.5, 3)) / 1.42 = 10.4 m.
    flockCut({ count: 40, center: [0, 15.1, 0], radius: 10.4, height: 2, spread: [6, 3, 40], speed: 16, wander: [...WHEEL_WEAVE, 0.8] }, 'sw-court'); await ctx.yield();
    // a stream of swallows under the roof ring round the first turn (the helix's 40 to 240 degrees), on the court side of the route: its line is
    // 0.9 x 3.5 + 1.5 + 3.5 = 8.15 m over the lap, which is level under it (8.2)
    flockCut({ count: 26, along: { path, side: 9, up: 8.2, lead: 24, from: lapM(40) / LEN, to: lapM(240) / LEN, drift: 4 }, spread: [10, 3.5, 24], wander: [2.5, 1.5, 2.5, 0.7], size: 2.6 }, 'sw-high'); await ctx.yield();
    // wheeling under the roof ring, against the sky: what the eye goes up to on the first turn. Its boxes reach 1.21 x 2.5 + 0.9 x 3.5 + 2 = 8.18 m over and
    // under its middle: their foot is 3.5 m over the level lap (10.51 m), so its middle is 22.2 m up. Its cylinder is the widest with that band that lies
    // inside the inner eave's circle less half a span (36.75 m) and that the way in and the way out (both in the south-east) keep 3.5 m from: 31.1 m about
    // a centre 4.25 m west and 3.5 m north of the court's: radius (31.1 - 0.9 x 8 - hypot(4.5, 3)) / 1.42 = 13 m.
    flockCut({ count: 36, center: [RING.A.x - 4.25, 22.2, RING.A.z + 3.5], radius: 13, height: 2.5, spread: [8, 3.5, 90], speed: 15, wander: [...WHEEL_WEAVE, 0.8], size: 2.7 }, 'sw-roof'); await ctx.yield();
    // RING E'S COURT FLOCK WHEELS UNDER THE LAST STRAIGHT: every bird, at its own distance from the portal (a rule of place, the same for the whole flight).
    // The straight comes down to the portal's middle at DIVE, so rho metres from the portal in plan it is PORTAL height + rho tan(DIVE) up. The cone of
    // that slope about the portal's upright axis, set SWE_UNDER (4 m) lower, lies 4 m under the straight on the straight's own bearing and is the same
    // on every other. The flock keeps under that cone:
    //   where     on a circle about the portal's axis over the open outer court, half way between the inner house ring's outer eave (E_HOUSE.eave, the
    //             ring's own metres: the roof of buildInner in the parts) and the gallery's inner eave (ROOF.rEaveIn): 28.0 and 48.0 m out, so SWE_R = 38.0 m.
    //             The circle is laid through SWE_N points; no line through them comes nearer the axis than their chords, SWE_R cos(pi / SWE_N) = 37.7 m;
    //   how wide  out to those two eaves and no further: SWE_HALF = 10.0 m either side of the circle holds the plan scatter and the whole weave. The
    //             weave (SWE_WEAVE) is up to 1.5 x 2 m one way and 2 m the other, 3.6 m together; the 6.4 m left is two sigma of the plan scatter (the
    //             kit scatters a loose flock by 0.45 of its spread: a spread of 6.4 / 0.9 = 7.1 m), and the scatter is cut there: a bird dealt a place
    //             further than two sigma from the flock's line, in plan or in height, is set at two sigma (SWE_CUT);
    //   the cone  over the nearest that any bird can come, 37.7 - 10.0 = 27.7 m out, is 6.58 - 4 + 27.7 tan(28 deg) = 17.29 m up (SWE_TOP);
    //   how high  between that and the ridge of the inner house ring (E_HOUSE.ridge: 6.06 m up, SWE_LOW; no roof inside the galleries is taller): the
    //             circle lies half way, 11.68 m up, 5.61 m from either. Of that the wheel's own rise and fall takes SWE_RISE (1.5 m: lowest where the
    //             straight passes over the circle and opposite, highest a quarter turn on), the weave 1 m, and the 3.11 m left is two sigma of the
    //             vertical scatter: a spread of 3.46 m.
    // So no bird is ever higher than 11.68 + 1.5 + 1 + 3.11 = 17.29 m, the cone's height over the innermost place a bird can have; a bird further out has
    // the cone higher over it by 0.53 m for each metre, and the straight is 4 m over the cone. The circle is flown the way the route itself turns in over
    // the ring. Where on the circle the flock is, and each bird's place in the flock, are drawn (the flock's own fork).
    const E_HOUSE = { eave: 21.7, ridge: 4.7 }, SWE_UNDER = 4, SWE_RISE = 1.5, SWE_WEAVE = [2, 1, 2], SWE_N = 24;
    const SWE_R = RE.s * (E_HOUSE.eave + ROOF.rEaveIn) / 2, SWE_HALF = RE.s * (ROOF.rEaveIn - E_HOUSE.eave) / 2, SWE_SX = (SWE_HALF - Math.hypot(1.5 * SWE_WEAVE[0], SWE_WEAVE[2])) / 0.9;
    const SWE_TOP = PORTAL[1] - SWE_UNDER + (SWE_R * Math.cos(Math.PI / SWE_N) - SWE_HALF) * Math.tan(DIVE), SWE_LOW = RE.y + RE.s * E_HOUSE.ridge, SWE_Y = (SWE_TOP + SWE_LOW) / 2, SWE_SY = ((SWE_TOP - SWE_LOW) / 2 - SWE_RISE - SWE_WEAVE[1]) / 0.9;
    const mWheel = mAt((q) => Math.hypot(q.x - PORTAL[0], q.z - PORTAL[2]) <= SWE_R, mEIn);   // where the last straight passes over the circle
    path.posAtDist(mWheel, _pp); const sweBear = Math.atan2(_pp.z - PORTAL[2], _pp.x - PORTAL[0]);   // the bearing of that place from the portal: the straight's own
    path.tangentAtDist(mTurn, _pp); path.tangentAtDist(mWheel, _pp2); const sweDir = _pp.x * _pp2.z - _pp.z * _pp2.x < 0 ? -1 : 1;   // the way the route turns between the turn's first point and the straight
    const swePts = Array.from({ length: SWE_N }, (_, i) => { const a = sweBear + sweDir * i / SWE_N * TAU; return [PORTAL[0] + SWE_R * Math.cos(a), SWE_Y - SWE_RISE * Math.cos(2 * (a - sweBear)), PORTAL[2] + SWE_R * Math.sin(a)]; });
    const sweFlock = flock({ count: 46, route: swePts, spread: [SWE_SX, SWE_SY, 50], wander: [...SWE_WEAVE, 0.8], speed: 17, size: 2.1 }, 'sw-e'); await ctx.yield();
    { const A = sweFlock.geometry.attributes.iA, B = sweFlock.geometry.attributes.iB, SWE_CUT = [0.9 * SWE_SX, 0.9 * SWE_SY];   // (the kit keeps a bird's place in the flock in iA.x, iA.y and iB.w)
      for (let i = 0; i < A.count; i++) { const x = A.getX(i), z = B.getW(i), h = Math.hypot(x, z), k = h > SWE_CUT[0] ? SWE_CUT[0] / h : 1; A.setX(i, x * k); B.setW(i, z * k); A.setY(i, Math.max(-SWE_CUT[1], Math.min(SWE_CUT[1], A.getY(i)))); }
      A.needsUpdate = true; B.needsUpdate = true; }
    // pouring out from under ring E's eave across the place where we cross its ridge (mEIn): on its own line and at its own height, wholly ahead of us, by
    // the least whole lead at which no box is within 3.5 m of the route's eye at the same station (100 m; its first bird is 713 m short of its line at station 0)
    flockCut({ count: 44, cross: { path, u: (mEIn - 100) / LEN, lead: 100, angle: 68, side: 1, height: 10.5, span: 180, rise: 5, duration }, spread: [12, 4, 50], wander: [...STREAM_WEAVE, 0.7], maxSigma: 3, size: 2.6 }, 'sw-e-eave'); await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('egrets'), species: 'gulls', count: 5, size: 2.3, body: '#f4f4ee', belly: '#ffffff', wingC: '#f0f0ea', trail: '#e6e6e0', tip: '#dcdcd6', head: '#f6f6f0', beak: '#e0b030',
      cross: { path, u: (mSB - 80) / LEN, lead: 80, angle: 112, side: 1, height: -26, span: 320, rise: 20, duration }, spread: [10, 3, 26], wander: [5, 2.5, 4, 0.35], maxSigma: 3 }));   // the egrets cross low over the mist sea where the route passes between rings S and B (mSB)
    await ctx.yield();
    scene.userData.census = { yards: { B: ringB.yard, S: ringS.yard } };   // (a count of what this version sets down, for whoever asks the page: it draws nothing)
    let dog;
    {
      const s = new Soup(), c = rng.pick([[0.5, 0.36, 0.2], [0.13, 0.11, 0.1], [0.62, 0.58, 0.5]]), d = [c[0] * 0.75, c[1] * 0.75, c[2] * 0.75];
      s.box(0, 0.34, 0, 0.24, 0.26, 0.66, c, { taper: 0.02 }); s.box(0, 0.5, 0.38, 0.2, 0.2, 0.26, c, { taper: 0.03 }); s.box(0, 0.52, 0.56, 0.1, 0.09, 0.14, d, {});
      for (const sx of [-0.08, 0.08]) { s.box(sx, 0.68, 0.34, 0.05, 0.1, 0.03, d, {}); for (const sz of [-0.26, 0.26]) s.box(sx, 0, sz, 0.06, 0.36, 0.06, d, { skip: 'tb' }); }
      s.box(0, 0.52, -0.42, 0.04, 0.04, 0.3, d, { rx: -0.7 });
      // a village dog at its true size: its shoulder (the top of the body, DOG_SHOULDER in the model above) a third of a villager's height in this world's
      // scale (TRUE_SIZE.villager, 1.92 m with the hat): 0.64 m at the shoulder, 1.3 m from nose to tail
      const DOG_SHOULDER = 0.6;
      dog = new THREE.Mesh(s.toGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); dog.name = 'dog'; dog.scale.setScalar(TRUE_SIZE.villager / 3 / DOG_SHOULDER); scene.add(dog);
    }
    // The dog runs its own round of ring A's court on the world's clock: the round the court leaves clear for it between the things set out on the cobbles
    // and the carriers' walk (COURT.rDog, see the hero), at a steady trot (DOG_SPEED, metres a second), from a start and a way round drawn from 'dog-round'.
    const dogQ = stream('dog-round'), DOG_SPEED = 3, DOG_A0 = dogQ() * TAU, DOG_WAY = dogQ.sign();

    // ---------- the rare event: a cloth dragon circling the portal kerb, chasing its pearl ----------
    let dragon = null;
    if (rare) {
      const NS = 22, NPOLE = 8, R0 = 14.2, red = [0.72, 0.05, 0.03], gold = [1.0, 0.6, 0.08], grn = [0.08, 0.4, 0.16], spine = [1.7, 1.05, 0.16], wht = [1.25, 1.2, 1.1];
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), selfU = { uSelf: { value: night ? 0.35 : 0 } };
      const selfLit = (sh) => { sh.uniforms.uSelf = selfU.uSelf; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSelf;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * uSelf;'); };
      mat.onBeforeCompile = selfLit; mat.customProgramCacheKey = () => 'tulou-dragon-head';
      // the body: an eight-sided cloth tube with a gold spine, green scale flecks and a scalloped gold belly fringe; position = (side, up, place along the body)
      const dragU = { uTime: time, uA0: { value: 0 } }, bp = [], bn = [], bc = [], bi = [], NRG = 72, SD = 8;
      for (let k = 0; k <= NRG; k++) {
        const i = k / NRG * NS, tp = i > NS - 6 ? 1 - (i - NS + 6) * 0.14 : 1, r = 1.5 * tp * (1 + 0.13 * Math.sin(i * 2.6));
        for (let j = 0; j < SD; j++) { const th = j / SD * TAU, cx = Math.cos(th), sy = Math.sin(th), c = sy > 0.9 ? spine : (sy > 0.6 && k % 2 === 0) ? gold : (k % 3 === 0 && Math.abs(cx) > 0.6) ? grn : red, sh = sy > 0.9 ? 1 : 0.72 + 0.28 * (k % 2) + 0.12 * sy;   // a bright gold spine with a saw-tooth of gold scales: the coil reads as a ring from the air
          bp.push(cx * r * 1.05, sy * r * 0.85, i); bn.push(cx, sy, 0); bc.push(c[0] * sh, c[1] * sh, c[2] * sh); }
        if (k < NRG) for (let j = 0; j < SD; j++) { const p = k * SD + j, q = k * SD + (j + 1) % SD; bi.push(p, q, p + SD, q, q + SD, p + SD); }
      }
      for (let k = 0, base = bp.length / 3; k <= NRG; k++) {
        const i = k / NRG * NS, tp = i > NS - 6 ? 1 - (i - NS + 6) * 0.14 : 1, r = 1.5 * tp;
        bp.push(0, -r * 0.82, i, 0, -r * 0.82 - (k % 2 ? 0.75 : 0.25) * tp, i); bn.push(1, 0, 0, 1, 0, 0); bc.push(gold[0], gold[1], gold[2], gold[0] * 0.7, gold[1] * 0.7, gold[2] * 0.7);
        if (k < NRG) { const p = base + k * 2; bi.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3)); bg.setIndex(bi);
      const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
      bodyMat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, dragU); selfLit(sh);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
          uniform float uTime, uA0;
          vec3 dPose(float i){ float a = uA0 - i * ${(1.96 / R0).toFixed(5)}, R = ${R0.toFixed(1)} + sin(i * .5 - uTime * 2.); return vec3(${PORTAL[0].toFixed(1)} + cos(a) * R, 5.2 + .75 * sin(i * .62 - uTime * 2.6), ${PORTAL[2].toFixed(1)} + sin(a) * R); }`)
          .replace('#include <beginnormal_vertex>', `float dI = position.z; vec3 dC = dPose(dI), dF = normalize(dPose(dI - .3) - dPose(dI + .3)), dS = normalize(cross(vec3(0., 1., 0.), dF)), dUp = cross(dF, dS);
          float dRip = 1. + .1 * sin(dI * 3.1 - uTime * 5.) + .06 * sin(dI * 7.3 + uTime * 3.);
          vec3 objectNormal = normalize(dS * normal.x + dUp * normal.y);`)
          .replace('#include <begin_vertex>', `vec3 transformed = dC + dS * (position.x * dRip + .12 * sin(dI * 2.2 - uTime * 4. + position.y * 2.) * step(position.y, -.5)) + dUp * position.y * dRip;`);
      };
      bodyMat.customProgramCacheKey = () => 'tulou-dragon';
      const seg = new THREE.Mesh(bg, bodyMat); seg.frustumCulled = false; seg.name = 'dragon-body';
      const pole = new Soup(); pole.cyl(0, 0, 0, 0.3, 0.24, 1.5, 6, [0.8, 0.78, 0.66], { cap: false, g0: 0.45 }); pole.cyl(0, 1.5, 0, 0.5, 0.0, 0.26, 8, [0.7, 0.58, 0.32], { cap: false }); pole.box(0.3, 0.9, 0, 0.07, 4.4, 0.07, [0.35, 0.28, 0.14], { skip: 'b' });
      const poles = new THREE.InstancedMesh(pole.toGeometry(), mat, NPOLE + 1); poles.frustumCulled = false;
      const hd = new Soup();
      // the head, nose toward +Z: skull and gold brow, a snout that tapers forward, an open lower jaw with teeth and a white beard, two swept horns
      const HP = Math.PI / 2, dk = [0.2, 0.02, 0.02];
      hd.box(0, -0.6, 0.1, 1.5, 1.2, 1.5, red, { taper: 0.16 }); hd.box(0, 0.52, 0.72, 1.56, 0.2, 0.4, gold, { taper: 0.05 });
      hd.box(0, -0.02, 0.8, 1.16, 1.65, 0.62, red, { rx: HP - 0.12, taper: 0.36 }); hd.box(0, 0.28, 2.3, 0.5, 0.26, 0.34, gold, { taper: 0.06 });
      hd.box(0, -0.8, 0.55, 1.0, 1.5, 0.2, dk, { rx: HP + 0.42, taper: 0.3 }); hd.box(0, -0.93, 0.55, 1.04, 1.52, 0.1, gold, { rx: HP + 0.42, taper: 0.3 });
      hd.box(0, -0.62, 0.9, 0.4, 1.0, 0.08, [1.3, 0.25, 0.1], { rx: HP + 0.2, taper: 0.1 });   // tongue
      for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { const z = 1.0 + k * 0.36; hd.box(sx * (0.46 - k * 0.085), -0.58 + (z - 0.8) * 0.12, z, 0.1, 0.24, 0.1, wht, { skip: 't', taper: -0.0 }); }
      for (let k = 0; k < 6; k++) { const u = k / 5 - 0.5, z = 0.75 + (1 - Math.abs(u) * 2) * 0.75; hd.box(u * 0.9, -1.0 - (z - 0.55) * 0.45 - 0.8, z, 0.13, 0.8, 0.05, wht, { rx: 0.25, skip: 'b', g0: 1.1 }); }   // the beard
      for (const sx of [-1, 1]) {
        hd.cyl(sx * 0.42, 0.55, -0.1, 0.14, 0.1, 0.72, 5, gold, { rx: -0.5, rz: -sx * 0.35, cap: false }); hd.cyl(sx * 0.66, 1.12, -0.42, 0.1, 0.02, 0.85, 5, gold, { rx: -1.05, rz: -sx * 0.12, cap: false });
        hd.box(sx * 0.62, 0.08, 0.7, 0.36, 0.36, 0.14, [1.6, 1.5, 1.2], {}); hd.box(sx * 0.64, 0.15, 0.79, 0.14, 0.17, 0.06, [0.01, 0.01, 0.01], {});
        hd.box(sx * 0.82, -0.5, -0.3, 0.08, 0.9, 1.3, grn, { rz: -sx * 0.5 }); hd.box(sx * 0.4, 0.1, 2.3, 0.035, 0.035, 1.3, gold, { rx: -0.5, ry: sx * 0.6 }); }
      for (let k = 0; k < 9; k++) { const an = (k / 8 - 0.5) * 2.6, up = Math.cos(an); hd.box(Math.sin(an) * 0.78, -0.05 + up * 0.62, -0.55, 0.2, 1.25 + 0.5 * up, 0.3, k % 2 ? wht : gold, { rx: -(HP - 0.35 * up - 0.1), ry: -Math.sin(an) * 0.45, taper: 0.095, skip: 'b' }); }   // a mane of flame-shaped tufts swept back
      const head = new THREE.Mesh(hd.toGeometry(), mat); head.frustumCulled = false; head.scale.setScalar(3.0);
      const pearl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 0.9) })); pearl.frustumCulled = false;
      const grp = new THREE.Group(); grp.name = 'dragon'; grp.add(seg, poles, head, pearl); scene.add(grp);
      const pearlGlow = fx.makeGlow({ time, position: [PORTAL[0], 6, PORTAL[2]], color: '#ffd27a', size: 8, intensity: 3, fogAmount: 0.3, flicker: 0.2 });
      pearlGlow.object.traverse((o) => { o.frustumCulled = false; }); grp.add(pearlGlow.object);
      dragon = { seg, poles, head, pearl, pearlGlow, NS, NPOLE, R: R0, U: dragU };
    }
    await ctx.yield();

    // ---------- every frame ----------
    const V = new THREE.Vector3(), V2 = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(0, 0, 0, 'YXZ'), S1 = new THREE.Vector3(1, 1, 1);
    const CP = new THREE.Vector3(), CQ = new THREE.Quaternion(), CS = new THREE.Vector3();   // the camera's world transform (it may be the camera behind a portal)
    const late = rain ? SEC : 0, mTear0 = mRise, mTear1 = mOut + late;   // the tear starts where the helix turns upward (mRise), so the climb-out rises into open sky; the sky is open where we cross the east eave (mOut), in rain a second of flight later
    const cLid0 = pool.uniforms.uColor.value.clone(), lidSc0 = pool.uniforms.uScatter.value;
    const cMistRaw = cMist.clone().multiplyScalar(1 / gain), cMistIn = MD ? new THREE.Color(cMist.r * md.warm[0], cMist.g * md.warm[1], cMist.b * md.warm[2]) : cMist;   // inside the ring the haze is sunlit: a little warmer than the lid
    const skyG = sky.uniforms && sky.uniforms.uGrad ? sky.uniforms.uGrad.value : null, skyG2 = sky.uniforms && sky.uniforms.uGrad2 ? sky.uniforms.uGrad2.value : null, skyG0 = skyG ? skyG.clone() : null, skyG20 = skyG2 ? skyG2.clone() : null;
    const cZen0 = domeU.uZen.value.clone(), cZenIn = MD ? cZen0.clone() : new THREE.Color(look.dome.zenIn || look.dome.zen).multiplyScalar(look.dome.kZIn ?? look.dome.kZ);
    const band0 = MD ? md.band : look.dome.band, bandIn = MD ? md.band * 1.4 : look.dome.bandIn ?? look.dome.band;
    const dragonPose = (a, i, t, out) => { const R = dragon.R + 1.0 * Math.sin(i * 0.5 - t * 2.0); return out.set(PORTAL[0] + Math.cos(a) * R, 5.2 + 0.75 * Math.sin(i * 0.62 - t * 2.6), PORTAL[2] + Math.sin(a) * R); };
    // seesOver(r, rf, h): can the camera see, over ring r's roof ridge, a thing h metres up that stands rf metres from the ring's centre on its far side
    // (both in the ring's own metres)? From over the ring or inside it, always. The ridge (20 m) is taken 0.6 m low, so the answer turns to yes a little early.
    const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _pv = new THREE.Matrix4(), _sph = new THREE.Sphere(); let courtSeen = true, insideSeen = true, eFloorSeen = true; const _creepBoxes = []; for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) _creepBoxes.push(new THREE.Box3(new THREE.Vector3(LANE_X - 74 + i * 37, -4, -254 + k * 40), new THREE.Vector3(LANE_X - 37 + i * 37, 12, -214 + k * 40)));   // (the lane's creeping mist with the size of its puffs, in 24 cells: one great box would count as in view from anywhere near it)
    const seesOver = (r, rf, h) => { const D = Math.hypot(CP.x - r.x, CP.z - r.z), s = r.s, top = r.y + 19.4 * s, rr = 45.4 * s; if (D <= rr + 1) return true; if (CP.y <= top) return false; return CP.y - (CP.y - top) * (D + rf * s) / (D - rr) < r.y + h * s; };
    const TIER_TOPS = [16, 13.1, 8.9, 4.7];   // the tops of the four gallery tiers, from the top one down, half a metre to spare (a ring's own metres)
    const inFrame = (r, rad) => { _sph.center.set(r.x, r.y + 8 * r.s, r.z); _sph.radius = rad * r.s + 6; return _fr.intersectsSphere(_sph); };   // is the ring's court (a ball round it, 6 m to spare) in the camera's view?
    function update(dt, t, camera, uReal) {
      const m = uReal * LEN;   // metres flown
      time.value = t; camera.matrixWorld.decompose(CP, CQ, CS);
      const open = sstep(mTear0, mTear1, m), camY = CP.y, pv = sstep(0, SEC, m);   // pv 0 = the view through the previous world's portal; it gives way over the first second of flight
      const top = 26 - 16 * sstep(mRise, mOver, m) - 4.5 * sstep(mTear1, mApp, m) - 2.5 * sstep(mApp, mEIn, m);   // the mist's top: over the roof ring while we are in the court; under the eaves by the time the eye is level with the ridge; sinking on to where the last act begins, and again to where we cross ring E's ridge
      { const far = m > mLap1; for (const o of others) o.visible = far; hillBamboo.object.visible = far || m < mUnder; teaRows.visible = teaLeaves.visible = gang.visible = m < mUnder;   // the other rings cannot be seen from the tea rows or from inside ring A: they are drawn from the helix's last point on; what stands outside ring A's wall to the south and west, until the eye is down inside the ring under its eave
        for (const o of southTrees) o.visible = m < mUnder;
        // What is INSIDE rings A and E is drawn when the camera can see it: rules in space (where the camera is and where it looks), not places on the flight.
        // Both rings alike: the galleries tier by tier from the top, each when the ring is in the frame and a sight line over its roof ridge reaches that tier on
        // the far side; with a tier, what hangs in it. Ring E's court floor (cobbles, villagers, fowl, the kerb's glow) when a line reaches the floor. Ring A's
        // court as ONE set (the hall and the stalls, what hangs in the court, villagers, their shadows, fowl) when a line reaches below the top of the second
        // tier at the far galleries (8.9 m: the tallest thing in the court, the hall's ridge, stands 7.3 m); ring A's two flocks, which wheel above the galleries,
        // and the court's mist whenever any line gets inside. What stands outside A's wall is always drawn.
        // No distance enters into it: ring A's galleries are drawn whole from however far a sight line reaches them. (A stand-in for them from beyond the distance
        // at which a gallery post is one pixel, 285 m, was built and looked at: the posts are under a pixel there but the bays, their doors and their plaster are
        // metres wide, and the change showed. So nothing is replaced.)
        // The roof's real rib tiles (TRUE_SIZE.rib, 0.25 m wide, laid on the stretches the flight skims) by a rule of true size, the same in every flight: drawn
        // while a stretch of them is in the frame and nearer than RIB_FAR, where a rib is one pixel wide at 1080 lines (0.25 / PX1080 = 216 m); the tile shader
        // draws a crest in each rib's place at any distance.
        _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, _pv.copy(camera.matrixWorld).invert()));
        { const on = ribBoxesW.some((bx) => bx.distanceToPoint(CP) < RIB_FAR && _fr.intersectsBox(bx)); for (const o of heroRibs) o.visible = on; }
        { let lvl = 0; if (inFrame(RING.A, 46)) for (const h of TIER_TOPS) { if (!seesOver(RING.A, 39, h)) break; lvl++; }
          insideSeen = lvl > 0; courtSeen = lvl >= 3; hero.setInside(lvl, courtSeen); }
        const eIn = inFrame(RING.E, 46); eFloorSeen = far && eIn && seesOver(RING.E, 36, 3.5);
        { let lvl = 0; if (far && eIn) for (const h of TIER_TOPS) { if (!seesOver(RING.E, 39, h)) break; lvl++; } ringE.setInside(lvl, eFloorSeen); }
        hero.object.visible = !(Math.hypot(CP.x - RING.E.x, CP.z - RING.E.z) < 37.2 * RING.E.s && camY < RING.E.y + 19 * RING.E.s); }   // down inside ring E's court, below its roof line, ring A (250 m south and lower than E's ridge) is behind E's wall
      const above = sstep(top - 5, top + 4, camY) * open;
      // thin uniform fog (the low banks carry the dense mist). Topping the wall the camera comes out of the ground mist: the fog thins, its colour cools
      // toward the open sky, and the sky itself shows through the lid, which from here on is only torn rags over the court
      // MIST_AS_DESIGNED: no sky until the tear. A white-out over the tea rows (the near 30 m stay sharp, ring A's roof grows out of it from 3 s),
      // a milky haze inside the ring under a luminous lid, thinning as the lid tears (open) and the blue comes through
      const skyIn = MD ? 0 : sstep(mFoot, mRidge, m);   // from the foot of the climb to the ridge
      const dLow = MD ? mix(mix(mix(0.019, 0.0125, sstep(0, mGate, m)), mix(0.0052, 0.0038, open), sstep(mFoot, mRidge, m)), 0.003, sstep(mTear1, mApp, m))
        : mix(mix(mix(0.0045, 0.0042, pv), mix(0.003, 0.0034, sstep(mUnder, mLap0, m)), sstep(mFoot, mRidge, m)), 0.003, sstep(mTear1, mApp, m));
      scene.fog.density = mix(dLow, night ? 0.0016 : 0.0012, above);
      const inC = sstep(mLip, mLap0, m);   // from the wall's lip to the helix's first point
      scene.fog.color.copy(cMistRaw).lerp(cMist, pv).lerp(cMistIn, MD ? inC : 0).lerp(cClear, Math.max(open, (look.clearIn ?? 0.5) * skyIn)); scene.background.copy(scene.fog.color);
      sky.setOpacity(MD ? open : mix(mix(look.ghostSky ?? 0.3, look.ghostIn ?? look.ghostSky ?? 0.3, skyIn), 1, open)); domeU.uK.value = mix(1 / gain, 1, pv) * (1 - 0.6 * skyIn) * (MD ? 1 - 0.3 * inC : 1);
      if (MD) ridges.object.visible = m > mTear0;   // the blue ranks belong to the opened sky; they come back while the camera is still down in the court, behind its wall   // what is left of the lid under the opened sky is a faint warm haze, not a white sheet
      wallMist.uniforms.uOpacity.value = 0.22 * (1 - sstep(mLip, mRidge, m));
      if (skyG && skyG2) { const k = skyIn * (1 - open); skyG.x = mix(skyG0.x, Math.max(skyG0.x, 7.5), k); skyG.y = skyG0.y * (1 - 0.5 * k); skyG2.x = mix(skyG20.x, Math.max(skyG20.x, 2.2), k); }
      domeU.uZen.value.copy(cZen0).lerp(cZenIn, inC); domeU.uBand.value = mix(band0, bandIn, inC);
      ridges.uniforms.uHaze.value.copy(scene.fog.color); { const hz = ridges.uniforms.uHaze.value, k = 1 - open; hz.r *= 1 - 0.1 * k; hz.g *= 1 - 0.05 * k; }   // the ranks stay faint and blue, under the lid and after the tear
      const over = sstep(top + 1, top + 7, camY) * open;   // the camera is above the sea: the lid's sheets give way to the sea with its craters
      // the sheets: low banks among the tea rows first; none while we tip over the ridge and look down into the bowl; then, re-laid unseen, the lid over the court
      const low = 1 - sstep(mFoot, mLip, m), lid = sstep(mUnder, mLap0, m), lowOn = low > 0;   // the low banks are gone by the wall's lip; the lid is laid between the eave we come down under and the helix's first point
      pool.object.scale.y = lowOn ? 0.42 : 1; pool.object.position.y = lowOn ? 0.3 : mix(MD ? 20.5 : 18, top - 8, over); rags.uniforms.uCenter.value.y = top + 0.5;   // designed: the lid lies on the roof ring, from 20.5 m up
      pool.uniforms.uOpacity.value = lowOn ? (MD ? 0.26 : 0.17) * low : lid * (MD ? 0.5 : 0.5 - 0.41 * inC * (1 - open)) * (1 - 0.7 * open) * (1 - sstep(mRise, mLap1, m)); pool.uniforms.uCoverage.value = lowOn ? 0.55 : 0.86 - (MD ? 0 : 0.4 * inC * (1 - open)) - 0.34 * open - 0.2 * sstep(mSB, mApp, m);   // the lid tears into rags as the sky opens
      if (MD) { pool.uniforms.uColor.value.copy(cLid0).multiplyScalar(lowOn ? 1 : 0.8); pool.uniforms.uScatter.value = lowOn ? lidSc0 : 0.4 * lidSc0; }   // from under it the lid is a soft white, a little under the bloom threshold: the court keeps its lit wall and its shade wall
      const lit = sstep(mOver, mHigh, m);   // the light in ring E's court comes up as the eye rises over ring A's ridge
      motes.setOpacity(1 - 0.75 * open); beacon.uniforms.uIntensity.value = 3.2 * lit * (1 - 0.3 * sstep(mSee, mSee + QUARTER, m)) * (1 - sstep(mTurn, mEIn, m));   // the point of light in ring E's court gives way to the portal itself as we come over its roof
      kerbGlow.material.uniforms.uK.value = 1.5 * lit;
      beacon.uniforms.uSize.value = mix(60, 30, sstep(mTurn, mEIn, m));   // the halo stands over ring E's roof until we are over it ourselves
      bowl.uniforms.uIntensity.value = (night ? 1.4 : 2.8) * lit * (1 - sstep(mSB, mApp, m));
      // the mist sea from above: geometry below its top dissolves into it (mk), courts stand clear down to a low pool, ring E's bowl empties for the last turn
      // (ring A's court only ever holds its low pool: we are inside it while the sea sinks; and the lid over it is gone before the climb-out reaches it)
      const mk = over * (1 - 0.45 * sstep(mApp, mTurn, m)), hole = sstep(mHigh, mSB, m);
      const inTop = (ridge, base) => mix(1.6, top - base, sstep(ridge - 3, ridge + 3, top));
      // after the tear the mist drains: it stays only where the land lies well below its top, so the upper terraces stand out of it in bands
      const thin = sstep(mTear1, mSB, m), t0 = mix(0.3, 4.5, thin), t1 = mix(3.4, 9.5, thin);
      MIST.uHole.value.z = hole; MIST.uMistG.value.set(top, t0, mk, t1); seaU.uThin.value.set(t0, t1);
      mA.uMist.value.set(top, 1.6, mk, mk * 0.45 * sstep(mOut, mHigh, m));   // ring A's own pool gathers once we are out over its roof: from inside, the court stays clear to the cobbles
      mO.uMist.value.set(top, inTop(17, 1.5), mk, mk * 0.45); mE.uMist.value.set(top, inTop(25.8, 0), mk * (1 - hole), mk * 0.45 * (1 - hole));
      sea.position.set(CP.x, top - 0.4, CP.z); sea2.position.set(CP.x, top - 3.9, CP.z);
      seaU.uK.value = open * (1 - 0.5 * sstep(mApp, mTurn, m)); seaU.uCover.value = 0.34 + 0.34 * sstep(mHigh, mApp, m);
      pourU.uTop.value = top; pourU.uK.value = 0.95 * mk;
      rags.uniforms.uOpacity.value = (night ? 0.08 : 0.13) * sstep(mLap1, mOut, m) * (1 - 0.8 * sstep(mHigh, mApp, m));
      raysE.uniforms.uIntensity.value = (night ? 0.07 : 0.2) * sstep(mHigh, mApp, m);
      U.uCloud.value = night ? 0 : 0.9 * open;
      if (paper) paper.setOpacity(Math.max(sstep(mRidge, mLap0, m) * (1 - sstep(mLap1, mOut, m)), sstep(mApp, mTurn, m)));
      if (rainP) rainP.setOpacity(0.3 * (1 - 0.7 * open));
      const lapU = sat((m - mLap0) / (mLap1 - mLap0));
      courtMist.uniforms.uOpacity.value = 0.045 * mix(0.45, 1, sstep(mLap0, mLap0 + SEC, m)) * (1 - 0.6 * sstep(0.2, 0.3, lapU) * (1 - sstep(0.75, 0.9, lapU)));
      hero.setProgress(lapU); hero.update(dt, t, camera);
      ringE.update(dt, t, camera); ringB.update(dt, t); ringS.update(dt, t);
      sky.update(dt, t, camera); rig.update(dt, t, camera);
      const sunK = sstep(mFoot, mRidge, m);
      const inL = sstep(mFoot, mLip, m) * (1 - 0.3 * sstep(mHigh, mSB, m));   // from the ridge on and down in the court the low sun is the light: a stronger key, a thinner fill, long shadows
      rig.sun.intensity = sunI * mix(look.sunMist, 1, sunK) * mix(1, look.sunIn ?? 1.22, inL); rig.hemi.intensity = hemiI * mix(look.hemiMist, 1, sunK) * mix(1, look.hemiIn ?? 0.8, inL);
      rig.hemi.color.copy(hemiC0).lerp(hemiCIn, 0.55 * inL);
      hero.setLanternGlow(mix(look.glow, look.glowIn ?? look.glow, inC * (1 - sstep(mLap1, mOut, m))));   // inside the ring the lanterns are lit
      // a layer that is wholly transparent, or cannot be in the picture, is not sent to be drawn: the ground fog and the mist by the south wall once they have thinned to nothing, the
      // rags and ring E's sun rays and glows before they have begun, the lane's mist when the lane is out of the camera's view, the court's mist with the court,
      // the glow on the well kerb with ring E's court floor
      pool.object.visible = pool.uniforms.uOpacity.value > 0; wallMist.object.visible = wallMist.uniforms.uOpacity.value > 0; rags.object.visible = rags.uniforms.uOpacity.value > 0; raysE.object.visible = raysE.uniforms.uIntensity.value > 0;
      beacon.object.visible = beacon.uniforms.uIntensity.value > 0; bowl.object.visible = bowl.uniforms.uIntensity.value > 0;
      creep.object.visible = _creepBoxes.some((bx) => _fr.intersectsBox(bx)); courtMist.object.visible = insideSeen; kerbGlow.visible = eFloorSeen;
      ridges.update(dt, t, camera); set.update(dt, t, camera); fauna.update(dt, t, camera, uReal); for (const it of fauna.items) if (it.gate && it.warmed && !it.stub && (it.gate === 'court' ? !insideSeen : m < it.gate[0] || m > it.gate[1])) it.f.object.visible = false;   // (ring A's own two flocks wheel above its galleries: they are drawn whenever a sight line gets inside the ring, see insideSeen)
      for (const c of plumeCull) c.m.visible = true;
      flora.updateWind(wind, t); bamboo.update(dt, t, camera); hillBamboo.update(dt, t, camera);
      for (const c of plumeCull) { let k = 0; for (const b of c.bands) if (_fr.intersectsBox(b.box)) k = b.end; if (k) c.m.count = k; else c.m.visible = false; }   // (see plumeCull)
      ghost.position.copy(CP).addScaledVector(SUN, 1500); ghost.quaternion.copy(CQ);
      ghost.material.uniforms.uK.value = ghostK * (1 - open) * (MD ? 1 - 0.4 * inC : 1);
      if (ghost2) { ghost2.position.copy(CP).addScaledVector(CLIMB, 1500); ghost2.quaternion.copy(CQ);
        ghost2.material.uniforms.uK.value = 0.45 * ghostK * sstep(mRise, mLap1, m) * (1 - sstep(mOut, mHigh, m)); }
      // pickers along the rows, parasols between the rings
      for (let i = 0; i < NH + NX; i++) {
        const h = hats[i], ph = t * h.sp + h.ph, z = h.z + h.amp * Math.sin(ph);
        EU.set(0.12 * Math.sin(t * 0.9 + h.ph * 3), Math.cos(ph) > 0 ? 0 : Math.PI, 0); Q.setFromEuler(EU);
        M4.compose(V.set(h.x, h.y + 0.04 * Math.sin(t * 2.2 + h.ph), z), Q, S1.setScalar(h.sc)); hatMesh.setMatrixAt(i < NH ? i : i + NP + NL, M4);
      }
      for (let i = 0; i < NP; i++) {
        const s = (t * 0.006 + PHASE.parasols + i * 0.022) % 1; parasolCurve.getPointAt(s, V); const y = heightAt(V.x, V.z);
        EU.set(0.1 * Math.sin(t * 1.3 + i), i * 1.7, 0.08 * Math.sin(t * 1.1 + i * 2)); Q.setFromEuler(EU);
        M4.compose(V.set(V.x, y + 0.45 + 0.05 * Math.sin(t * 3 + i), V.z), Q, S1.set(1.7, 1.25, 1.7)); hatMesh.setMatrixAt(NH + i, M4);
      }
      for (let i = 0; i < NL; i++) {
        const x = teaWalk.x, z = teaWalk.z + (i - 1) * TEA_WALK.gap + TEA_WALK.sway * Math.sin(t * 0.07 + PHASE.teaWalk + i * 0.4);
        EU.set(0.1 * Math.sin(t * 1.3 + i * 2.1), i * 1.7, 0.08 * Math.sin(t * 1.1 + i * 2)); Q.setFromEuler(EU);
        M4.compose(V.set(x, heightAt(x, z) + 0.45 + 0.05 * Math.sin(t * 3 + i), z), Q, S1.set(1.7, 1.25, 1.7)); hatMesh.setMatrixAt(NH + NP + i, M4);
      }
      hatMesh.instanceMatrix.needsUpdate = true;
      { const a = DOG_A0 + DOG_WAY * t * DOG_SPEED / COURT.rDog, ca = Math.cos(a), sa = Math.sin(a), hop = Math.abs(Math.sin(t * 9));
        dog.position.set(COURT.rDog * ca, 0.05 + 0.08 * hop, COURT.rDog * sa); dog.rotation.set(0.07 * Math.sin(t * 9), Math.atan2(-sa * DOG_WAY, ca * DOG_WAY), 0); }
      if (dragon) {
        const a0 = t * 0.42 + PHASE.dragon, da = 1.96 / dragon.R; dragon.U.uA0.value = a0;
        for (let i = 0; i < dragon.NS; i++) {
          dragonPose(a0 - i * da, i, t, V); dragonPose(a0 - (i - 1) * da, i - 1, t, V2); V2.sub(V);
          EU.set(-Math.atan2(V2.y, Math.hypot(V2.x, V2.z)), Math.atan2(V2.x, V2.z), 0); Q.setFromEuler(EU);
          if (i === 0) { dragon.head.position.copy(V).addScaledVector(V2.normalize(), 1.6); dragon.head.quaternion.copy(Q); }
          if (i % 3 === 1) { const j = (i - 1) / 3; EU.set(0, Math.atan2(V2.x, V2.z), 0); Q.setFromEuler(EU); M4.compose(V2.set(V.x, 0.05, V.z), Q, S1.set(1, 1, 1)); dragon.poles.setMatrixAt(j, M4); }
        }
        const ap = a0 + 0.5; V.set(PORTAL[0] + Math.cos(ap) * dragon.R, 6.3 + 0.5 * Math.sin(t * 1.7), PORTAL[2] + Math.sin(ap) * dragon.R); dragon.pearl.position.copy(V); dragon.pearlGlow.object.position.copy(V);
        EU.set(0, -ap, 0); Q.setFromEuler(EU); M4.compose(V2.set(V.x - 0.3 * Math.cos(-ap), 0.05, V.z + 0.3 * Math.sin(-ap)), Q, S1.set(1, 1, 1)); dragon.poles.setMatrixAt(dragon.NPOLE, M4);
        M4.makeScale(0, 0, 0); dragon.poles.setMatrixAt(dragon.NPOLE - 1, M4);   // the spare carrier
        dragon.poles.instanceMatrix.needsUpdate = true;
      }
    }
    { const c0 = new THREE.PerspectiveCamera(FOV, ctx.aspect || 1.78, 0.3, 5000); path.pointAt(0, c0.position); c0.lookAt(LANE_X, 4, 0); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const names = { autumn: 'Persimmon Season', newyear: 'New Year' };
    return {
      scene, path, duration,
      // unhurried over the tea rows, quickening up the wall (from the foot of the climb to the ridge) to a swallow's pace round ring A's court; quickest along
      // the mist sea, its flat top from where the eye is a roof's height over ring A's ridge (mHigh, rising from the east eave, mOut) to where the last act
      // begins (mApp, falling over a quarter turn's length); and slowest at ring E: the pace eases from where the route meets the last turn (mTurn) to where
      // it crosses ring E's ridge (mEIn), so the turn in over the roof and the straight down to the portal are given time
      pace: (ur) => { const m = ur * LEN; return 0.86 + 0.1 * sstep(mFoot, mRidge, m) + 0.28 * sstep(mOut, mHigh, m) * (1 - sstep(mApp, mApp + QUARTER, m)) + 0.04 * sstep(mApp, mApp + QUARTER, m) - 0.16 * sstep(mTurn, mEIn, m); },
      title: look.title + (rare ? ': the Dragon' : rain ? ', After Rain' : names[season] ? ', ' + names[season] : ''),
      ride: 'none',
      camera: { fov: FOV, near: 0.3, nearThrough: 0.3, far: 5000, lookAhead: LOOK, sway: 0.8, bank: 0.45 },   // bank 0.45: seven degrees of roll round the lap and the turn into ring E (strangers called sixteen 'steeply tilted')
      pois,
      portal: { shape: 'circle', radius: PORTAL_R, tilt: true, color: look.portal, glow: 1.3, revealDistance: 420, blendDistance: 30 },
      post: {
        exposure: look.exposure,
        bloom: { strength: look.bloom, radius: 0.7, threshold: look.bloomAt },
        grade: { saturation: look.grade.saturation, contrast: look.grade.contrast, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.3, grain: 0.022, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); hTex.dispose(); },
    };
  },
};
