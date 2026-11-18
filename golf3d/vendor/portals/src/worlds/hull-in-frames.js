// Ribs of the Unfinished Ship (hull-in-frames): noon under the thatch of a Sulawesi boatyard, built 8 times life size.
// We ride a steaming ironwood plank the length of a ship standing in frames and see it bent home at the bow.
//
// OUTLINE (one section per function, in build order)
//   looks      noon / late light (amber oval coins, a bow third of new timber, a buffalo calf) / rain / night, picked
//              by seed and ctx.vary.hour; fog, fauna light, backdrop gains
//   hero       src/parts/hull-in-frames.js at the origin: ribs, backbone, the plank (carried), light model with coins
//   sand       one plane: ripples, footprints, shavings, coins, contact shade under hull and posts
//   outside    beyond the eaves: palm walls with real crowns at several depths in front of them, one sky by direction
//              on every wall (grey-white with a dark shower in the rain look), white beach with palm shade. The lagoon
//              is LIGHT and never a view: a clipped band of turquoise glare over white sand that melts up into a pale
//              strip of sky (no water plane, no horizon, no waves), seen between posts and ribs to starboard
//   shed       tree-trunk posts with creepers, tie beams, thatch with the pinholes drawn as points of day, frond fringe
//              and real fronds at the entry eaves, bamboo gantry round the portal, tripod at the stern, A-frame at the bow
//   mats       the bow gable: rows of woven palm mats hung from poles in front of a dim backing sheet (own shader:
//              an uneven twill plait, belly, folds, frayed hems and sides, pricks of day, wind), one slot left open to
//              the lagoon right of the stem; the same mats hung outside the port staging abreast of the berth (a
//              straight run that stops just past the last rib, then a short looser return turning away to port), so
//              the new ribs there stand against shade and not against the sunlit palms; the next strakes stacked
//              beside the stem
//   bamboo     one InstancedMesh: props under the bilge, rafters, staging poles
//   staging    plank walks on both sides, the tall tower (three decks; kettle, glasses, tools, coconuts on the top one)
//   cloth      one mesh, own shader (woven, sun-bleached, folds): washing and sarongs in faded madder, ochre and
//              indigo on the staging rails and the tower, washed indigo awnings, red and yellow pennants from the
//              gantry and the tower; rattan coils on long ropes from the roof
//   entry      trough on embers under wet mats, log pile, sawpit and saw, two canoes, water jars
//   fauna      hens and the rooster (own shader, coins on their backs), five stocky goats on the log pile (own
//              instanced mesh and shader; one lies down) or a buffalo calf, swallows,
//              butterflies or fireflies (along the nave and round the ring), the rare hornbill (own mesh and shader)
//   air        dust that sparkles in the pinhole rays, falling shavings, smoke layers, trough and kettle steam (one
//              column leans across the foot of the rudder), ember glow and its warm pool on the sand, rain beads (rain look), lagoon glare in the haze inside the starboard ribs, garland
//              petals, peg dust
//   flight     THE BRIEF'S PATH, point for point, inside the shed and the hull all the way: in from astern at y 24 on
//              x 6 to 6.5 over the trough (the black upright of sternpost and rudder on the axis, in the bright mouth
//              of the ribcage), past them 9.5 m to port, up to y 34 into the ribcage (from u 0.27), down the nave at
//              y 31-34 a little to starboard of the keel, across to port at the bow and out by the ring between stem
//              and gantry. About 534 m in 48 s. The plank rides 4 m to port, 5 m below, its middle 10 m ahead, in the
//              traveller's slings. pace (the brief's); the gaze is the line of travel but for three slow looks (the
//              tower, the glare, the berth; each its own poi, eased in, held about 2 s, eased out, and clamped so the
//              whole ring stays in frame) and one pitch down along the keel; post; update() keys the scripted
//              moments (the hero's keys run on a story clock mapped from path u by SU)
//   light      no lights but the hero's model: coins from the roof's pinholes (one broad shaft over the first curtain
//              of shavings; two worn places in the thatch where the pencils stand in dense clusters: over the steam
//              before the sternpost and over the second curtain), the three fills (brown shade from thatch and sand,
//              green from port, turquoise from starboard forward), the embers astern, the lagoon's glare
//   timber     the brief's seeded swap (the 'swaps' draw): pale teak (seeds 5, 7, 9, 11 ...) or dark ironwood
//              (3, 21, 12 ...) by day; rain and night draw it in the hero
//
// SCRIPTED (by path u): the ship from astern 0-0.2: the rudder swings to lie fore and aft 0.01-0.075, trough steam
//   drifting before the black upright; goats on the logs to starboard | the plank comes up out of the trough's steam
//   behind and below 0.12-0.24, its own cloud standing on its forward half; its wet tip slides out of the cloud into
//   the lower left 0.20-0.26 | into the ribcage 0.27 | curtain of shavings in the one shaft to starboard 0.33-0.39 |
//   look to the tower's top walk 0.375-0.505 (held 0.414-0.466): the rooster on its rail shakes a wing 0.402-0.461,
//   kettle, glasses, tools; washing and pennants in the upper right as the look eases out 0.46-0.52 | swallows cross
//   0.52 under the hung coils | look to the second curtain of shavings in the lagoon's glare 0.545-0.66 (held
//   0.58-0.625), three swallows across it 0.61, hens on the low stage below it | pitch down along the keel 0.655-0.75
//   | hauling lines take the plank 0.71; it swings ahead and turns on edge to its berth on the port ribs 0.715-0.803 |
//   look to the berth 0.745-0.915 (held 0.79-0.87), following the peg being driven: bent home 0.806-0.87 and pegged
//   0.812-0.876 (nine pegs, three knocks each, a small pale puff per knock) | the ring beside the stem, under the
//   pennants. Rare (seed 3): a hornbill flies the nave ahead of the eye 0.378-0.622.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/hull-in-frames.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';

const PALETTE = ['#3A2A20', '#C8A46A', '#8B8277', '#FFE6A8', '#8A7A50', '#E8DBBE', '#3FC4BE'];
// (the brief's shed: ridge at y 118, eaves at y 52 over x 88; the outside is two slices of light under the eaves)
const RIDGE_Y = 118, ROOF_SLOPE = 0.75, SHED_Z0 = 115, SHED_Z1 = -500;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// the four looks: fog, fauna light, what the cards outside show, post
const LOOKS = {
  noon: { fog: '#93a8bc', dens: 0.0026, bg: '#cfd8d2', out: [1, 1, 1], sunOut: 0.3, exposure: 1.09, tint: '#fff6ea', shadow: '#0a0603', sat: 1.08,
    fauna: { sunColor: '#ffe6a8', sunIntensity: 0.55, sky: '#b89a70', skyIntensity: 0.9, ground: '#e0c08a', groundIntensity: 0.8 }, dust: [1.0, 0.86, 0.55], smoke: '#cdb692', portal: '#ffe6a8' },
  amber: { fog: '#98a4b4', dens: 0.0025, bg: '#d2d6cc', out: [1.02, 0.98, 0.9], sunOut: 0.3, exposure: 1.09, tint: '#fff5e6', shadow: '#0a0604', sat: 1.06,
    fauna: { sunColor: '#ffdc9a', sunIntensity: 0.6, sky: '#b89a70', skyIntensity: 0.9, ground: '#e0be88', groundIntensity: 0.8 }, dust: [1.0, 0.8, 0.46], smoke: '#cdb692', portal: '#ffe0a0' },
  rain: { fog: '#7f8a88', dens: 0.0027, bg: '#aebdc2', out: [0.62, 0.74, 0.78], sunOut: 0.16, exposure: 1.15, tint: '#eef6ff', shadow: '#04070a', sat: 1.0,
    fauna: { sunColor: '#d8ecff', sunIntensity: 0.45, sky: '#8ea2a8', skyIntensity: 0.9, ground: '#9a9a8c', groundIntensity: 0.6 }, dust: [0.8, 0.92, 1.0], smoke: '#aab4b4', portal: '#cfeaff' },
  night: { fog: '#141c38', dens: 0.0021, bg: '#070b1c', out: [0.035, 0.06, 0.13], sunOut: 0.05, exposure: 1.25, tint: '#e6ecff', shadow: '#030512', sat: 1.0,
    fauna: { sunColor: '#b8ccff', sunIntensity: 1.15, sky: '#4a5a9a', skyIntensity: 1.25, ground: '#2a3460', groundIntensity: 0.9 }, dust: [0.6, 0.72, 1.0], smoke: '#3c4a7c', portal: '#9fc0ff' },
};

// ---------------------------------------------------------------- shaders
const BASIC_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec3 aCol;
uniform float uTime;
uniform float uStir;
varying vec3 vCol; varying vec2 vUv; varying vec3 vWp; varying vec3 vWn;
void main() {
  vec3 pos = position;
  // uStir: hanging things (mats, fringe) breathe; uv.y = 0 at the fixed edge
  float k = uStir * uv.y;
  pos.z += k * (0.5 * sin(uTime * 0.7 + position.x * 0.07) + 0.25 * sin(uTime * 1.3 + position.x * 0.19 + position.y * 0.1));
  pos.x += k * 0.3 * sin(uTime * 0.9 + position.z * 0.11);
  vec4 wp = modelMatrix * vec4(pos, 1.);
  vWn = normalize(mat3(modelMatrix) * normal);
  vCol = aCol; vUv = uv; vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const NOISE = /* glsl */`
float sHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030) + 0.019); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float sNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sHash(i), sHash(i + vec2(1., 0.)), f.x), mix(sHash(i + vec2(0., 1.)), sHash(i + vec2(1., 1.)), f.x), f.y);
}
float sFbm(vec2 p) { return sNoise(p) * 0.55 + sNoise(p * 2.3 + 7.1) * 0.3 + sNoise(p * 5.9 + 3.3) * 0.15; }
`;
// the sand: ripples, bare footprints, drifts of shavings, coins; full sun beyond the eaves
const sandFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
uniform vec3 uSand; uniform vec3 uShaving; uniform float uSunOut; uniform float uPock; uniform vec4 uSpill; uniform vec3 uSpillCol; uniform float uPool;
varying vec3 vWp;
void main() {
  vec3 p = vWp;
  float dist = length(cameraPosition - p);
  float fine = 1. - smoothstep(70., 220., dist);
  float big = sFbm(p.xz * 0.02);
  float rph = p.x * 1.1 + sNoise(p.xz * 0.11) * 5. + p.z * 0.25;
  float rip = sin(rph) * 0.5 + 0.5;
  float relief = cos(rph) * fine * (0.6 + 0.4 * sNoise(p.xz * 0.37 + 5.));      // the side of each ripple that faces the light
  vec3 alb = uSand * (0.8 + 0.3 * big) * (1. - 0.12 * rip * fine);
  // footprints: an oval dimple in one cell out of three, in wandering trails
  vec2 g = p.xz / 2.6; vec2 c = floor(g); vec2 f = fract(g) - 0.5;
  float h = sHash(c + 3.1);
  float trail = smoothstep(0.52, 0.6, sNoise(c * 0.21 + 9.));
  float ang = sHash(c + 17.) * 6.2832;
  vec2 r = vec2(cos(ang) * f.x + sin(ang) * f.y, -sin(ang) * f.x + cos(ang) * f.y);
  float fl = length(r * vec2(2.6, 5.5));
  float foot = (1. - smoothstep(0.5, 1., fl)) * step(h, 0.55) * trail;
  float lip = smoothstep(0.7, 1., fl) * (1. - smoothstep(1., 1.4, fl)) * step(h, 0.55) * trail * (0.5 + 0.5 * r.y / max(fl, 0.2));
  alb *= 1. - 0.34 * foot * fine;
  relief += 1.1 * lip * fine;
  // rain pocks
  vec2 g2 = p.xz / 0.9; vec2 f2 = fract(g2) - 0.5;
  alb *= 1. - uPock * 0.25 * fine * (1. - smoothstep(0.1, 0.3, length(f2 + (sHash(floor(g2)) - 0.5) * 0.4)));
  // shavings: pale curls drifted along the keel and under the walks
  float inHull = smoothstep(46., 30., abs(p.x)) * smoothstep(20., -10., p.z) * smoothstep(-470., -440., p.z);
  float drift = smoothstep(0.42, 0.75, sFbm(p.xz * 0.045 + 31.)) * inHull;
  float curl = step(0.6, sNoise(p.xz * 1.7)) * step(0.45, sNoise(p.xz * 4.3 + 5.));
  alb = mix(alb, uShaving * (0.75 + 0.5 * sHash(floor(p.xz * 1.3))), clamp(drift * (0.35 + 0.65 * curl * fine), 0., 1.));
  alb = mix(alb, alb * alb * 0.9, uWetAll * 0.5);
  // contact shade: the hull overhead, the keel, the post rows
  float ao = 1. - 0.5 * inHull * smoothstep(40., 4., abs(p.x));
  float pz = abs(fract((p.z - 10.) / 30.) - 0.5) * 30.;
  float px = min(abs(abs(p.x) - 60.), abs(abs(p.x) - 88.));
  ao *= 1. - 0.5 * (1. - smoothstep(1.5, 6., length(vec2(px, pz))));
  float outside = max(smoothstep(87., 93., abs(p.x)), smoothstep(${SHED_Z0}.0 + 2., ${SHED_Z0}.0 + 8., p.z));
  float coin = hifCoin(p);
  vec3 nUp = vec3(0., 1., 0.);
  // beyond the eaves: white sand in full sun, dappled by the palms that stand over it, rippled
  vec3 sunW = mix(uCoinCol, vec3(dot(uCoinCol, vec3(0.3, 0.5, 0.2))) * vec3(1.05, 1.0, 0.92), 0.65);
  float palmSh = smoothstep(0.38, 0.62, sFbm(p.xz * 0.055 + vec2(0.7 * sin(uTime * 0.4 + p.z * 0.03), 0.))) ;
  float beach = step(0., p.x) * smoothstep(-140., -165., p.z);
  float dap = mix(1., 0.42 + 0.58 * palmSh, smoothstep(92., 104., abs(p.x)) * (1. - 0.6 * beach));
  vec3 col = alb * (hifShade(nUp, p) * ao * 0.62 * (1. + 0.1 * relief) + (uCoinCol * coin * (1. - outside) * (1. + 0.3 * relief) + sunW * outside * uSunOut * dap * (1. + 0.45 * relief)) * uSunDir.y);
  col += uGlaze * (1.0 + coin * 5.);
  // the gap in the mat screen: a soft cool pool on the sand in front of it
  float sp = smoothstep(uSpill.x - 9., uSpill.x + 4., p.x) * (1. - smoothstep(uSpill.y - 4., uSpill.y + 9., p.x)) * step(uSpill.z, p.z) * exp(-max(p.z - uSpill.z, 0.) * uSpill.w);
  col += alb * uSpillCol * sp;
  // the bending fire: a warm pool on the sand round the trough, breathing with the embers
  vec3 dE = p - vec3(6., 0., clamp(p.z, 27., 73.));
  col += alb * uEmber * uPool * exp(-dot(dE, dE) / 85.) * (0.82 + 0.18 * sin(uTime * 1.3 + sNoise(p.xz * 0.3) * 6.));
  vec3 v = normalize(cameraPosition - p);
  float fres = 1. - max(v.y, 0.); fres *= fres; fres *= fres;
  col += uWetAll * uFillUp * 0.5 * fres;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;
// the thatch from below: rows of nipa, bamboo battens, and every pinhole as a point of day
const thatchFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
uniform vec3 uThatch; uniform float uHoleGain;
varying vec3 vWp; varying vec2 vUv;
void main() {
  vec3 p = vWp;
  float row = fract(vUv.y / 2.4);
  float fib = sNoise(vec2(p.z * 2.1, vUv.y * 0.6)) * 0.6 + sNoise(vec2(p.z * 0.31, vUv.y * 0.2)) * 0.4;
  vec3 alb = uThatch * (0.55 + 0.6 * fib) * (0.72 + 0.4 * row);
  alb *= 1. - 0.5 * smoothstep(0.42, 0.5, abs(fract(p.z / 7.5) - 0.5));          // rafter shadow lines
  float glow = 0.5 + 0.5 * smoothstep(60., 0., abs(p.x) - 30.);                   // bounce is strongest over the nave
  vec3 col = alb * uFillDown * 0.4 * glow;
  // light seeping through the thatch between rows
  col += uCoinCol * 0.012 * uThatch * smoothstep(0.75, 1., sNoise(vec2(p.z * 0.9, vUv.y * 0.42 + 3.)));
  float cell = max(uRoof.z, 0.1);
  vec2 uv = vec2(p.x * 1.25, p.z) / cell;
  vec2 base = floor(uv - 0.5);
  float aa = max(length(fwidth(uv)) * 1.1, 1e-4);
  float acc = 0.;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      vec4 hole = hifHole(base + vec2(float(i), float(j)));
      float rr = (0.12 + 0.42 * hole.z) / cell;
      float d = length(uv - hole.xy);
      // energy kept when a hole is under a pixel: wider and dimmer
      float w = max(rr, aa);
      acc = max(acc, hole.w * (1. - smoothstep(w * 0.55, w * 1.15, d)) * min(1., (rr * rr) / (w * w) * 2.5));
    }
  }
  col += uCoinCol * acc * uHoleGain;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;
// the mat screen in the bow gable: rows of woven palm mats hung from poles, each bellying a little in the wind.
// normal carries (width, height, belly) of the mat; aCol = (tone, id, 1 for the flat backing sheet); uv = (0..1 across, 0 top..1 hem)
const MAT_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec3 aCol;
uniform float uTime; uniform float uStir;
varying vec3 vCol; varying vec2 vUv; varying vec3 vWp; varying vec3 vWn; varying vec2 vWH;
void main() {
  vec3 pos = position;
  float id = aCol.g, front = 1. - aCol.b;
  float W = max(normal.x, 1.), Hh = max(normal.y, 1.);
  float gust = 0.6 * sin(uTime * 0.8 - position.x * 0.045 + id * 6.283) + 0.3 * sin(uTime * 1.7 + position.x * 0.11 + id * 17.);
  float amp = (normal.z + uStir * gust) * front;
  float su = sin(3.14159 * uv.x), cu = cos(3.14159 * uv.x);
  float prof = uv.y * (0.35 + 0.65 * uv.y);
  float flut = uStir * 0.22 * front * uv.y * sin(uTime * 1.9 + position.y * 0.6 + id * 9. + uv.x * 5.);
  pos.z += amp * su * prof + flut;
  vec3 nrm = normalize(vec3(-(amp * 3.14159 / W * cu * prof + flut * 0.5), amp * su * (0.35 + 1.3 * uv.y) / Hh, 1.));
  vec4 wp = modelMatrix * vec4(pos, 1.);
  vWn = normalize(mat3(modelMatrix) * nrm);
  vCol = aCol; vUv = uv; vWp = wp.xyz; vWH = vec2(W, Hh);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const matFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
uniform vec3 uOut; uniform vec3 uMat; uniform vec3 uSkyC; uniform vec4 uSlot; uniform vec3 uSpillCol; uniform float uMatGain;
varying vec3 vWp; varying vec2 vUv; varying vec3 vCol; varying vec3 vWn; varying vec2 vWH;
// one strip of an unevenly cut plait: x in strips -> (which strip, 0..1 across it); the edges are jittered by a hash
vec2 mStrip(float x, float salt) {
  float i = floor(x);
  float e0 = i + (sHash(vec2(i, salt)) - 0.5) * 0.56;
  float e1 = i + 1. + (sHash(vec2(i + 1., salt)) - 0.5) * 0.56;
  if (x < e0) { e1 = e0; i -= 1.; e0 = i + (sHash(vec2(i, salt)) - 0.5) * 0.56; }
  else if (x >= e1) { e0 = e1; i += 1.; e1 = i + 1. + (sHash(vec2(i + 1., salt)) - 0.5) * 0.56; }
  return vec2(i, clamp((x - e0) / max(e1 - e0, 1e-3), 0., 1.));
}
void main() {
  float tone = vCol.r, id = vCol.g, back = step(0.5, vCol.b), front = 1. - back;
  vec2 m = mix(vUv * vWH, vWp.xy, back);                       // metres across and down the mat (world metres on the backing)
  float hemD = mix(vWH.y - m.y, 9., back);                     // metres above the hem
  // the gap where two mats are tied back: the backing sheet is torn open there, its sides frayed
  float fy = floor(vWp.y * 2.6);
  float gl = uSlot.x + 0.4 + 2.2 * sNoise(vec2(vWp.y * 0.38, 3.)) + 0.9 * sHash(vec2(fy, 7.)) * sHash(vec2(fy, 13.));
  float gr = uSlot.y - 0.4 - 2.2 * sNoise(vec2(vWp.y * 0.38, 11.)) - 0.9 * sHash(vec2(fy, 19.)) * sHash(vec2(fy, 23.));
  if (back > 0.5 && vWp.x > gl && vWp.x < gr && vWp.y > uSlot.z && vWp.y < uSlot.w) discard;
  // the frayed hem: strands of different lengths, coarse enough to read from the nave
  float t1 = sHash(vec2(floor(m.x * 2.1), id * 91. + 3.)), t2 = sHash(vec2(floor(m.x * 7.3), id * 57. + 9.));
  if (hemD < 0.15 + 0.95 * t1 * t1 + 0.3 * t2) discard;
  // ragged sides: the outer strips have worked loose and broken off at different lengths
  float sideD = mix(min(m.x, vWH.x - m.x), 9., back);
  float t3 = sHash(vec2(floor(m.y * 1.9), id * 77. + 5.));
  if (sideD < 0.04 + 0.34 * t3 * t3) discard;
  // The plait: a twill of palm strips cut by eye, no two the same width, wandering a little, the lie of the weave
  // turning every few rows. Each strip has its own tone, is cupped (darker toward its edges) and shows its fibre,
  // so close to it is a soft pattern of uneven ribs and slanting steps, never of squares; it fades out with distance.
  vec2 wv = m + vec2(0.3 * sNoise(vec2(m.y * 0.4, id * 9. + 1.)), 0.36 * sNoise(vec2(m.x * 0.33, id * 7. + 4.)));
  vec2 ws = wv / vec2(0.34, 0.52);
  float wf = 1. - smoothstep(0.2, 0.7, fwidth(ws.x) + fwidth(ws.y));
  vec2 sx = mStrip(ws.x, id * 37. + 3.), sy = mStrip(ws.y, id * 53. + 11.);
  float lie = mod(floor(sy.x / 5. + sHash(vec2(id * 3.1, 5.)) * 5.), 2.) * 2. - 1.;
  float over = step(mod(sx.x + lie * sy.x, 4.), 1.5);
  over = abs(over - step(0.88, sHash(vec2(sx.x * 1.7 + 3., sy.x * 1.3) + id * 5.)));      // a strip missed here and there
  float across = mix(sy.y, sx.y, over);
  float cup = 1. - 0.24 * smoothstep(0.3, 1., abs(across - 0.5) * 2.);
  float stripTone = mix(0.95 + 0.12 * sHash(vec2(sy.x, id * 3. + 7.)), 0.86 + 0.28 * sHash(vec2(sx.x, id * 3. + 1.)), over);
  float fibre = 0.93 + 0.14 * sNoise(mix(vec2(wv.x * 1.1, wv.y * 17.), vec2(wv.x * 21., wv.y * 0.9), over));
  float big = sFbm(m * 0.13 + id * 37.);                         // stains, and where the weave is looser
  vec3 alb = uMat * (0.86 + 0.24 * tone) * (0.78 + 0.44 * big);
  alb = mix(alb, alb * vec3(0.84, 1.03, 0.76), step(0.72, sHash(vec2(id * 13.7, 2.))) * 0.6);      // a few fresher, greener mats
  alb *= mix(0.93, stripTone * cup * fibre, wf);
  // sun-bleached where it has hung longest, darker in the damp near the hem
  alb *= 1. + 0.2 * (sNoise(vec2(m.x * 0.21 + id * 5., m.y * 0.09)) - 0.5);
  float v01 = clamp(m.y / max(vWH.y, 1.), 0., 1.);
  float tuck = mix(0.4 + 0.6 * smoothstep(0., 0.2, v01), 0.5, back);     // each row is in the shade of the one above
  float high = 1. - 0.55 * smoothstep(30., 140., vWp.y);                // the gable falls away into the dark of the roof
  vec3 n = normalize(vWn);
  // hanging folds, lit from the port eave: each bellied mat is paler on the side that turns to the light
  n = normalize(n + vec3(0.2 * cos(m.x * 1.7 + id * 31.) * (0.3 + 0.7 * v01) * front, 0., 0.));
  vec3 col = alb * hifShade(n, vWp) / max(hifFormK(n), 0.3) * 0.5 * tuck * high * clamp(1. - 1.5 * n.x, 0.5, 1.6) * uMatGain;
  float coin = hifCoin(vWp);
  col += alb * uCoinCol * coin * (0.05 + max(dot(n, uSunDir), 0.)) * 0.7 * front;
  // daylight through the weave: cool where it is loose, warm at the thin hem
  float loose = smoothstep(0.42, 0.8, big);
  col += uSkyC * uOut * (0.007 + 0.02 * loose) * high * (1. - 0.5 * back);
  col += uCoinCol * uOut * alb * 0.07 * smoothstep(2.4, 0.4, hemD);
  // pricks of day where the weave gapes; they wink as the mat moves
  vec2 pg = m / 1.7; vec2 pc = floor(pg);
  float h = sHash(pc + id * 51. + 41.);
  vec2 off = (vec2(sHash(pc + 7.3), sHash(pc + 19.1)) - 0.5) * 0.6;
  float aa = max(length(fwidth(pg)) * 1.2, 1e-4);
  float rr = 0.05 + 0.07 * sHash(pc + 3.);
  float wr = max(rr, aa);
  float d = length(fract(pg) - 0.5 - off);
  float tw = 0.55 + 0.45 * sin(uTime * (0.7 + h * 9.) + h * 40. + vWp.z * 3.);
  float prick = step(0.9, h) * (1. - smoothstep(wr * 0.5, wr * 1.1, d)) * min(1., rr * rr / (wr * wr) * 3.);
  col += uCoinCol * uOut * prick * tw * 0.42;
  // the lagoon's light spilling round the edges of the gap onto the mats beside it
  vec2 dS = vec2(max(max(uSlot.x - vWp.x, vWp.x - uSlot.y), 0.), max(max(uSlot.z - vWp.y, vWp.y - uSlot.w), 0.));
  col += uSpillCol * (alb * 3. + 0.02) * exp(-length(dS) * 0.17) * (0.35 + 0.65 * front);
  col += uGlaze * 1.2;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;
// what is outside the eaves: uv.x = metres along the wall, uv.y = height; vCol.r = 1 on the lagoon side
const cardFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
uniform vec3 uOut; uniform vec3 uGreen; uniform vec3 uTurq; uniform vec3 uSkyC; uniform vec3 uSandC; uniform float uFogKeep; uniform float uSeaGain; uniform float uSlotGain; uniform float uRainSky;
varying vec3 vWp; varying vec2 vUv; varying vec3 vCol; varying vec3 vWn;
// The sky, by the direction looked in, so it is one sky behind the palms and beyond the lagoon: pale at the horizon,
// blue above, slow heaps of cloud standing on the horizon. Between showers (uRainSky) it is rinsed grey-white, and a
// dark shower hangs slanting from the cloud base out over the lagoon.
vec3 hifSkyAt(vec3 vd) {
  float el = vd.y / max(length(vd.xz), 1e-3);
  float az = atan(vd.x + 1e-5, -vd.z);
  float h = el * 1000.;
  vec3 s2 = mix(uSkyC * vec3(1.06, 1.03, 0.96), uSkyC * vec3(0.42, 0.68, 1.0), smoothstep(0., 330., h)) * 0.8;
  float cl = sFbm(vec2(az * 3.6 + uTime * 0.0035, h * 0.011)) * 0.7 + 0.3 * sFbm(vec2(az * 12. - uTime * 0.005, h * 0.03 + 4.));
  float heap = smoothstep(0.5, 0.7, cl + 0.22 * smoothstep(170., 30., h) - 0.25 * smoothstep(150., 330., h));
  s2 = mix(s2, mix(uSkyC * vec3(0.78, 0.82, 0.9), vec3(1.02, 1.0, 0.95), smoothstep(0.5, 0.9, cl + (h - 60.) * 0.002)) * 0.86, heap * 0.9);
  vec3 wash = vec3(1.36, 1.17, 1.12) * (0.84 + 0.2 * cl + 0.1 * smoothstep(0., 260., h));
  wash = mix(wash, vec3(0.92, 0.84, 0.84), heap * 0.55);
  float slant = az - el * 0.55;
  float fall = max(1. - smoothstep(0.1, 0.34, abs(slant - 0.62)), 0.7 * (1. - smoothstep(0.06, 0.2, abs(slant - 1.45))));
  fall *= (1. - smoothstep(70., 250., h)) * (0.7 + 0.3 * sNoise(vec2(slant * 46., h * 0.004 + uTime * 0.02)));
  wash = mix(wash, vec3(0.5, 0.5, 0.55), fall * 0.85);
  return mix(s2, wash, uRainSky);
}
void main() {
  vec2 uv = vUv;
  float lag = vCol.r;
  vec3 sky = hifSkyAt(normalize(vWp - cameraPosition));
  // the starboard palms end at a point: their canopy sinks to the sand over the wall's last hundred metres (uv.x 250
  // at its end), single palms standing on out of it. Where nothing grows the wall is not drawn, and the band of
  // glare painted on the wall behind it shows.
  float tk = 1.;
  if (uv.x > 240. && uv.x < 700. && lag < 0.5) tk = smoothstep(250., 345., uv.x + 26. * sNoise(vec2(uv.x * 0.045, 2.)));
  vec2 q = vec2(uv.x + 0.9 * sin(uTime * 0.5 + uv.x * 0.05) * uv.y * 0.02, uv.y);
  vec3 haze = uSkyC * vec3(0.62, 0.72, 0.62);
  // a far rank of palms, pale in the heat, behind the near one
  float topF = (74. + 12. * sFbm(vec2(uv.x * 0.021, 7.)) + 6. * abs(sin(q.x * 0.31 + 2. * sNoise(vec2(q.x * 0.04, 5.))))) * tk * tk;
  float cover = smoothstep(3., -3., uv.y - topF);
  vec3 c = mix(sky, mix(uGreen * vec3(0.5, 0.66, 0.4), haze, 0.48), cover);
  // the near canopy: masses of light and dark leaf, a soft hatching of fronds, sun-bleached, hazier with height
  float n1 = sFbm(q * vec2(0.05, 0.07) + 3.);
  float n2 = sFbm(q * vec2(0.21, 0.16) + 11.);
  float lightm = smoothstep(0.3, 0.8, n1 * 0.6 + n2 * 0.5);
  vec3 g = uGreen * mix(vec3(0.16, 0.22, 0.13), vec3(0.78, 0.86, 0.42), lightm);
  g *= 0.8 + 0.4 * sNoise(vec2(q.x * 0.9 + q.y * 0.6 * sign(n2 - 0.5), q.y * 0.25 + 0.3 * sin(uTime * 0.6 + q.x * 0.1)));
  g = mix(g * vec3(1.0, 1.08, 0.9), haze, 0.14 + 0.26 * smoothstep(30., 75., uv.y));
  float gap = smoothstep(0.6, 0.78, sFbm(q * vec2(0.06, 0.05) + 2.)) * smoothstep(34., 58., uv.y);
  float top = (58. + 13. * sFbm(vec2(uv.x * 0.018, 3.))) * tk;
  // palm heads standing out of the canopy: a burst of drooping fronds on each trunk
  float cellT = floor(q.x / 17.);
  float hx = sHash(vec2(cellT, 3.)), hx2 = sHash(vec2(cellT, 8.));
  float lean = (hx2 - 0.5) * 7.;
  float cx = cellT * 17. + 8.5 - (hx - 0.5) * 9. - lean * 1.24;
  float cy = mix(27. + 22. * hx, 58. + 13. * sFbm(vec2(cx * 0.018, 3.)), tk) + 2. + 5. * hx2;
  vec2 dq = vec2(q.x - cx, q.y - cy);
  float rr = length(dq);
  float ang = atan(dq.y + 0.035 * dq.x * dq.x, abs(dq.x) < 1e-3 ? 1e-3 : dq.x);
  // (no two heads alike and none a star: every frond its own length, their spacing uneven, the tuft's edge feathered)
  vec2 dirF = dq / max(rr, 1e-3);
  float flen = 0.5 + 0.55 * sNoise(dirF * 2.1 + hx * 17.);
  float feather = smoothstep(0.2, 0.75, abs(sin(ang * 6.5 + hx * 6.3 + 1.3 * sNoise(dirF * 1.6 + hx * 31.))));
  float frond = feather * smoothstep(11.5 * flen, 3. * flen, rr) * step(-0.6, ang + 0.2 * sin(hx * 40.));
  frond = max(frond, smoothstep(3.6, 1.4, rr * (0.8 + 0.4 * sNoise(dirF * 2.7 + hx * 5.)))) * step(0.04, tk);
  float edge = max(smoothstep(3., -3., uv.y - top), frond);
  // (a head that stands clear above the canopy is a far one: it sinks into the haze behind the real crowns)
  c = mix(c, mix(g * (1. - 0.25 * frond), mix(g, haze, 0.6), frond * smoothstep(-2., 4., uv.y - top)), edge * (1. - gap * (1. - frond)));
  cover = max(cover, edge * (1. - gap * (1. - frond)));
  // trunks: grey leaning lines under the crowns
  float tx = q.x - cellT * 17. - 8.5 + (hx - 0.5) * 9. + lean * (q.y / 50.);
  float trunk = (1. - smoothstep(0.45, 1.1, abs(tx))) * smoothstep(mix(cy + 1., 60., tk), mix(cy - 14., 40., tk), uv.y) * step(mix(2.5, 6., tk), uv.y) * step(0.04, tk);
  c = mix(c, uSandC * vec3(0.4, 0.37, 0.33) * (0.8 + 0.25 * sNoise(vec2(q.x * 0.4, q.y * 0.5))), trunk * mix(0.95, 0.6, tk));
  cover = max(cover, trunk);
  // banana leaves: big blades low down, some in the sun
  float bh = (21. + 12. * sFbm(vec2(uv.x * 0.05, 11.))) * tk;
  float bl = smoothstep(2., -2., uv.y - bh);
  cover = max(cover, bl);
  if (tk < 0.999 && cover < 0.5 && uv.y < 95. && uv.y > 2.5) discard;
  float blade = sNoise(vec2(q.x * 0.22 + q.y * 0.12, q.y * 0.07 + 4.)) * 0.7 + 0.3 * sNoise(vec2(q.x * 0.7 - q.y * 0.3, q.y * 0.2));
  c = mix(c, mix(uGreen * vec3(0.5, 0.86, 0.34) * (0.3 + 0.9 * blade), haze, 0.22), bl);
  // the lagoon side: LIGHT, never a view. White sand, a band of turquoise glare with moving glitter that melts upward
  // into a pale strip of sky: no line where water meets sky, no waves, no far shore
  float gl = sNoise(vec2(uv.x * 0.12 + uTime * 0.5, uv.y * 0.5)) * sNoise(vec2(uv.x * 0.07 - uTime * 0.3, uv.y * 0.4 + 9.));
  float deep = smoothstep(13., 38., uv.y);
  float melt = smoothstep(22., 47., uv.y + 4. * sNoise(vec2(uv.x * 0.021, 5.)));
  vec3 sea = mix(uTurq * (1.3 + 0.5 * deep), vec3(0.86, 1.0, 0.96), 0.3 + 0.3 * deep) * uSeaGain * 1.25 + vec3(1.0, 0.98, 0.9) * smoothstep(0.1, 0.8, gl) * 0.3 * (1. - melt);
  vec3 lc = mix(uSandC, sea, smoothstep(11., 14., uv.y + 2. * sNoise(vec2(uv.x * 0.05, 1.))));
  lc = mix(lc, mix(vec3(1.), uSkyC, 0.5) * 1.03, melt);
  c = mix(c, lc, lag);
  c = mix(c, uSandC, (1. - lag) * smoothstep(3.5, 1.5, uv.y));
  // (the wall's own sky takes no haze, like the far sky it stands for)
  float keep = uFogKeep * max(max(cover, lag), smoothstep(3.5, 1.5, uv.y));
  vec3 col = c * uOut * mix(1., uSlotGain, vCol.g);
  gl_FragColor = vec4(col, 1.);
  #ifdef USE_FOG
    float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, ff * keep);
  #endif
}
`;
// hens (and the rooster): instanced, lit like everything else, pecking and scratching in the vertex shader
const HEN_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec3 aCol;
attribute vec4 iA;        // phase, peck rate, tint, rooster flag
uniform float uTime; uniform float uWing;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn; varying float vTint; varying vec4 vOp;
void main() {
  vec3 pos = position; vec3 nrm = normal;
  float part = uv.x;       // 0 body, 1 head and neck, 2 wing, 3 tail
  vOp = vec4(position, iA.w + 2. * part);
  float t = uTime * (0.5 + iA.y) + iA.x * 6.2832;
  // peck: now and then the head goes down twice; otherwise it jerks about
  float cyc = fract(t * 0.13);
  float peck = smoothstep(0.55, 0.62, cyc) * (1. - smoothstep(0.9, 0.97, cyc)) * (0.5 + 0.5 * sin(t * 5.)) * (1. - iA.w);
  float look = 0.35 * sin(floor(t * 1.3) * 2.4 + iA.x * 9.) * (1. - peck);
  if (part > 0.5 && part < 1.5) {
    vec3 piv = vec3(0., 0.62, 0.22);
    vec3 d = pos - piv;
    float a = peck * 1.25 + 0.08 * sin(t * 2.1);
    float ca = cos(a), sa = sin(a);
    d = vec3(d.x, d.y * ca - d.z * sa, d.y * sa + d.z * ca);
    float cl = cos(look), sl = sin(look);
    d = vec3(d.x * cl + d.z * sl, d.y, -d.x * sl + d.z * cl);
    pos = piv + d;
  }
  // rooster: a wing unfolds and shakes
  if (part > 1.5 && part < 2.5) {
    float side = sign(pos.x);
    float open = uWing * iA.w * step(0., pos.x);
    vec3 piv = vec3(0.16 * side, 0.66, 0.05);
    vec3 d = pos - piv;
    float a = side * open * (0.85 + 0.22 * sin(uTime * 17.));
    float ca = cos(a), sa = sin(a);
    d = vec3(d.x * ca - d.y * sa, d.x * sa + d.y * ca, d.z);
    d.x *= 1. + open * 0.9; d.y *= 1. + open * 0.5;
    pos = piv + d;
  }
  if (part > 2.5) pos.y += 0.04 * sin(t * 2.1 + 1.) + peck * 0.12;
  pos.y += 0.02 * sin(t * 3.3) + uWing * iA.w * 0.05 * sin(uTime * 17.);
  vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.);
  vWn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * nrm);
  vCol = aCol; vWp = wp.xyz; vTint = iA.z;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const henFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
uniform vec3 uCoatA; uniform vec3 uCoatB; uniform vec3 uCoatC;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn; varying float vTint; varying vec4 vOp;
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  float part = floor(vOp.w * 0.5 + 0.01), roo = vOp.w - 2. * part;
  // feathers: overlapping rows round the body, each row dark at its root and pale at its tip, the rows staggered
  vec2 fq = vec2(atan(vOp.x, vOp.y - 0.4) * 4.5, (vOp.z - vOp.y * 0.6) * (part > 2.5 ? 9. : 17.));
  fq.x += 0.5 * floor(fq.y);
  float row = fract(fq.y), across = abs(fract(fq.x) - 0.5) * 2.;
  float tip = smoothstep(0.55, 1., row + 0.3 * (1. - across * across) - 0.3);
  float feather = (0.66 + 0.2 * row + 0.34 * tip) * (0.9 + 0.1 * across);
  float fw = clamp(fwidth(fq.y), 0., 1.);
  feather = mix(feather, 0.86, smoothstep(0.25, 0.7, fw));
  // vCol: r = feather mask (1 = takes the coat colour), g = shade, b = comb red
  vec3 coat = vTint < 0.34 ? uCoatA : (vTint < 0.67 ? uCoatB : uCoatC);
  float sp = sNoise(vWp.xy * 3.1 + vWp.z * 2.7);
  coat *= 0.75 + 0.5 * sp;
  coat = mix(coat, vec3(0.035, 0.06, 0.05), smoothstep(0.7, 0.55, vCol.g) * 0.85);              // dark tail and wing tips
  coat = mix(coat, vec3(0.8, 0.76, 0.66), step(0.67, vTint) * step(0.62, sp) * 0.8);     // speckled hens
  // the rooster: a golden hackle down his neck, a green-black tail
  coat = mix(coat, vec3(0.9, 0.5, 0.1) * (0.7 + 0.5 * row), roo * step(0.5, part) * step(part, 1.5) * smoothstep(0.9, 0.62, vOp.y));
  coat = mix(coat, vec3(0.02, 0.07, 0.05), roo * step(2.5, part) * 0.9);
  vec3 alb = mix(vec3(0.75, 0.6, 0.25), coat * feather, vCol.r) * vCol.g;
  alb = mix(alb, vec3(0.75, 0.07, 0.05), vCol.b);
  float coin = hifCoin(vWp);
  float ndl = max(dot(n, uSunDir), 0.);
  // round form: the belly and the side turned from the roof fall away; a coin on a back is a hot patch of light
  float form = 0.5 + 0.5 * smoothstep(-0.7, 0.55, n.y);
  vec3 col = alb * (hifShade(n, vWp) * form + uCoinCol * coin * (0.45 + 0.75 * ndl)) + uGlaze * (0.6 + coin * 4.);
  // a dull gloss on feathers turned to the roof, green on the dark tail
  float upf = n.y * 0.5 + 0.5;
  col += vCol.r * (uFillUp * 0.06 * upf * upf * tip + step(2.5, part) * vec3(0.01, 0.05, 0.035) * upf);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;
// the goats: one small body many times over; uv.x = part (0 body, 1 neck and head, 2 legs, 3 tail)
const GOAT_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec3 aCol;
attribute vec4 iA;        // phase, rate, coat, lying flag
uniform float uTime;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn; varying float vTint; varying vec3 vOp;
void main() {
  vec3 pos = position; vec3 nrm = normal;
  float part = uv.x;
  float lying = iA.w;
  float t = uTime * (0.6 + 0.5 * iA.y) + iA.x * 40.;
  // now and then the head goes down to nose at the bark and comes up chewing; between times it looks about
  float cyc = fract(t * 0.045 + iA.x);
  float down = smoothstep(0.5, 0.6, cyc) * (1. - smoothstep(0.86, 0.96, cyc)) * (1. - lying);
  float look = 0.5 * sin(t * 0.31 + iA.x * 9.) * sin(t * 0.17 + 2.) * (1. - down);
  if (part > 0.5 && part < 1.5) {
    vec3 piv = vec3(0., 0.56, 0.3);
    vec3 d = pos - piv;
    float a = down * 1.0 + 0.035 * sin(t * 5.3) + 0.03 * sin(t * 0.7);
    float ca = cos(a), sa = sin(a);
    d = vec3(d.x, d.y * ca - d.z * sa, d.y * sa + d.z * ca);
    nrm = vec3(nrm.x, nrm.y * ca - nrm.z * sa, nrm.y * sa + nrm.z * ca);
    float cl = cos(look), sl = sin(look);
    d = vec3(d.x * cl + d.z * sl, d.y, -d.x * sl + d.z * cl);
    nrm = vec3(nrm.x * cl + nrm.z * sl, nrm.y, -nrm.x * sl + nrm.z * cl);
    pos = piv + d;
  }
  if (part > 2.5) pos.x += 0.04 * sin(t * 7.) * smoothstep(0.6, 1., sin(t * 0.9 + iA.x * 5.));
  if (part < 0.5) pos.x *= 1. + 0.025 * sin(t * 1.6);
  // lying: the legs folded flat under the body, which rests on the log
  float leg = step(1.5, part) * step(part, 2.5);
  pos.y = mix(pos.y, mix(pos.y - 0.235, pos.y * 0.2 + 0.03, leg), lying);
  vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.);
  vWn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * nrm);
  vCol = aCol; vWp = wp.xyz; vTint = iA.z; vOp = position;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const goatFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn; varying float vTint; varying vec3 vOp;
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  // vCol: r = coat mask (0 = horn, hoof), g = shade, b = dark. Five coats: white, cream, tan, near black, pied.
  vec3 coat = vTint < 0.2 ? vec3(0.5, 0.47, 0.4) : (vTint < 0.4 ? vec3(0.5, 0.4, 0.28) : (vTint < 0.6 ? vec3(0.4, 0.26, 0.15) : (vTint < 0.8 ? vec3(0.12, 0.095, 0.08) : vec3(0.5, 0.47, 0.41))));
  float pied = smoothstep(0.5, 0.56, sNoise(vOp.zy * 4.2 + vTint * 37.));
  coat = mix(coat, vec3(0.1, 0.075, 0.06), pied * step(0.8, vTint));
  float eel = (1. - smoothstep(0.015, 0.04, abs(vOp.x))) * step(0.55, vOp.y) * step(0.2, vTint) * step(vTint, 0.6);
  coat = mix(coat, coat * 0.35, eel);
  // a marked face (dark cheeks either side of a pale blaze), dark stockings, a paler belly; long hair in locks
  float face = step(0.43, vOp.z) * step(0.69, vOp.y);
  coat = mix(coat, coat * 0.36, face * smoothstep(0.022, 0.045, abs(vOp.x)) * (1. - smoothstep(0.86, 0.9, vOp.y)) * step(vTint, 0.6) * 0.8);
  coat = mix(coat, vec3(0.5, 0.47, 0.4), face * (1. - smoothstep(0.012, 0.03, abs(vOp.x))) * step(0.6, vTint) * step(vTint, 0.8) * 0.8);
  coat = mix(coat, coat * 0.42, (1. - smoothstep(0.1, 0.24, vOp.y)) * step(0.2, vTint) * (1. - face));
  coat *= 0.72 + 0.56 * sNoise(vec2(vOp.z * 23. + vOp.x * 9., vOp.y * 4.5 + vOp.z * 2.));
  vec3 alb = mix(vec3(0.4, 0.36, 0.31), coat, vCol.r) * vCol.g;
  alb = mix(alb, vec3(0.045, 0.038, 0.034), vCol.b);
  float coin = hifCoin(vWp);
  float ndl = max(dot(n, uSunDir), 0.);
  // lit from above and from the open side: backs and flanks toward the eaves catch the day, bellies and far flanks fall off
  float form = mix(0.34, 1.12, smoothstep(-0.75, 0.5, n.y)) * (0.78 + 0.34 * max(n.x, 0.));
  vec3 col = alb * (hifShade(n, vWp) * form + uCoinCol * coin * (0.2 + 0.4 * ndl)) + uGlaze * (0.6 + coin * 4.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;
// motes: a box of points that wraps round the camera; each one flares where a pinhole's ray crosses it
const DUST_VERT = /* glsl */`
attribute vec4 aSeed;
uniform float uTime; uniform vec3 uCam; uniform vec3 uBox; uniform float uPx; uniform float uSize;
varying float vSeed; varying vec3 vWp; varying float vFade;
void main() {
  vec3 p = position * uBox;
  p += vec3(sin(uTime * 0.21 + aSeed.x * 40.), sin(uTime * 0.17 + aSeed.y * 40.) * 0.6 - uTime * 0.12 * (0.3 + aSeed.z), cos(uTime * 0.19 + aSeed.z * 40.)) * 1.6;
  p = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;
  p.y = max(p.y, 0.3);
  vec4 mv = viewMatrix * vec4(p, 1.);
  float d = max(-mv.z, 0.1);
  vFade = smoothstep(1.5, 5., d) * (1. - smoothstep(uBox.z * 0.38, uBox.z * 0.5, d));
  vSeed = aSeed.w; vWp = p;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize * (0.5 + aSeed.w) * uPx / d, 1.5, 9.);
}
`;
const dustFrag = (glsl) => /* glsl */`
${glsl}
uniform vec3 uDustCol; uniform float uDustGain;
varying float vSeed; varying vec3 vWp; varying float vFade;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float a = 1. - smoothstep(0.1, 0.5, length(q));
  float coin = hifCoin(vWp);
  float tw = 0.6 + 0.4 * sin(uTime * (2. + vSeed * 5.) + vSeed * 60.);
  vec3 col = uDustCol * (0.035 + coin * 1.5 * tw) * uDustGain;
  gl_FragColor = vec4(col * a * vFade, 0.);
}
`;
// leaves, fringe, plaits: thin sheets that glow a little when the day is behind them
const leafFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
uniform float uSunOut; uniform float uBack;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn; varying vec2 vUv;
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  float coin = hifCoin(vWp);
  float rib = 0.8 + 0.2 * smoothstep(0.02, 0.1, abs(fract(vUv.x * 6.) - 0.5));
  vec3 col = vCol * rib * (hifShade(n, vWp) + uCoinCol * coin * (0.35 + 0.65 * abs(dot(n, uSunDir))));
  float outside = smoothstep(86., 92., abs(vWp.x));
  col += vCol * uCoinCol * uSunOut * uBack * outside * 0.5;
  col += uGlaze * (0.8 + coin * 4.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

// cloth: hand-woven and sun-faded. Warp and weft a little uneven, bleached in patches where the sun has had it longest,
// darker in the hollows of its folds; coins of sun lie on it as on everything else.
const clothFrag = (glsl) => /* glsl */`
#include <fog_pars_fragment>
${glsl}
${NOISE}
uniform float uSunOut; uniform float uBack;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn; varying vec2 vUv;
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  float coin = hifCoin(vWp);
  float dist = length(vWp - cameraPosition);
  float h = vWp.x * 0.83 + vWp.z;
  float nearK = 1. - smoothstep(18., 60., dist);
  float weave = 0.5 + 0.25 * sin(vWp.y * 31.) + 0.25 * sin(h * 31.);
  float slub = sNoise(vec2(h * 0.7, vWp.y * 6.)) * 0.6 + sNoise(vec2(h * 8., vWp.y * 0.6)) * 0.4;
  float fold = 0.5 + 0.5 * sin(h * 3.9 + 2.6 * sNoise(vec2(h * 0.35, vWp.y * 0.12 + 3.)));
  float bleach = smoothstep(0.35, 0.8, sFbm(vec2(h * 0.09, vWp.y * 0.13) + 7.));
  vec3 alb = vCol * (0.8 + 0.36 * slub) * (1. + nearK * 0.24 * (weave - 0.5));
  float lum = dot(alb, vec3(0.3, 0.55, 0.15));
  alb = mix(alb, mix(alb, vec3(lum) * vec3(1.12, 1.04, 0.9), 0.55) * 1.3 + 0.025, bleach * 0.55);
  alb *= 0.62 + 0.48 * fold;
  vec3 col = alb * (hifShade(n, vWp) / max(hifFormK(n), 0.3) + uCoinCol * coin * (0.35 + 0.65 * abs(dot(n, uSunDir))));
  float outside = smoothstep(86., 92., abs(vWp.x));
  col += alb * uCoinCol * uSunOut * uBack * outside * 0.5;
  col += uGlaze * (0.8 + coin * 4.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

export default {
  id: 'hull-in-frames',
  name: 'Ribs of the Unfinished Ship',
  category: 'interior',
  weirdness: 0.05,
  media: ['interior', 'cable'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1;
    const disposables = [];
    // ---------------------------------------------------------------- looks
    const hour = vary.hour || 'any';
    // four looks in a table of nine by seed: dry noon (ironwood, cream coins, goats), late light (amber coins drawn
    // into ovals, the bow third in new timber, a buffalo calf, pale hens), between showers, the night before the feast
    const pick = ((ctx.seed >>> 0) % 9);
    let lookName = ['noon', 'amber', 'rain', 'noon', 'night', 'amber', 'rain', 'noon', 'night'][pick];
    if (hour === 'night') lookName = 'night';
    else if (hour === 'dawn' || hour === 'golden') lookName = 'amber';
    else if (hour === 'day' && lookName === 'night') lookName = 'noon';
    const amber = lookName === 'amber';
    const L = LOOKS[lookName], night = lookName === 'night', rain = lookName === 'rain';
    const swap = rng.fork('swaps');
    const swapA = swap.chance(0.35), swapB = swap.chance(0.4);      // (two draws kept in their old order)
    const calf = amber, paleHens = amber || (night && swapB && !swapA);
    const pal = PALETTE.map((h) => new THREE.Color(h));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(L.bg).multiplyScalar(night ? 1 : 0.9);
    scene.fog = new THREE.FogExp2(new THREE.Color(L.fog), L.dens);
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const time = { value: 0 };
    await ctx.yield();

    // ---------------------------------------------------------------- hero
    // THE BRIEF'S PATH, point for point (only its last two points stop 6 and 30 m short, at the ring): in from astern
    // at y 24 on x 6 to 6.5, so the black upright of sternpost and rudder stands on the axis in the bright mouth of
    // the ribcage, past it 9.5 m to port and under the counter, up to y 34 at the first ribs, then the one stately run down the nave under the ridge rope (never
    // above the rib heads, never outside the hull), easing left across the keel from z -300 as the plank swings to
    // its berth, along the plank 24 m off closing to 7, off its tip, and 54 m straight to the portal beside the stem.
    const PTS = [[6, 24, 85], [6.5, 24, 55], [9, 24, 25], [9.5, 26, -5], [9.5, 30, -35], [9.5, 34, -65], [9.5, 32.5, -125], [9.5, 31, -190],
      [9.5, 31.5, -250], [8, 33, -300], [0, 34, -345], [-7.5, 34, -374], [-9.5, 34, -392], [-9.5, 34, -420], [-9.5, 34, -446]];
    const path = makePath(PTS);
    // TIMBER, the brief's seeded swap: dark ironwood or pale teak by the seed's own draw (swapA) by day; in rain and
    // by night the hero draws it itself as before
    // frangipani on the stem by day (the white garland is the bow's accent); by night frangipani or plaited palm, by seed
    const garland = night && swap.chance(0.5) ? 'palm' : 'frangipani';
    // the ridge rope: 18 m above the path from the stern tripod (z 100) to the bow A-frame (z -420), x 6 to -6
    const ROPE = [[6, 42, 100], [4.3, 42.6, 25], [2.2, 52.6, -65], [-0.7, 49.6, -190], [-4.3, 52.6, -345], [-6, 52, -420]];
    const hopts = { palette: PALETTE, path: PTS, garland, rope: ROPE, ride: { left: 4, down: 5, ahead: 10, rise: 4 } };
    // by day a teak hull stands in pale timber (a clear step lighter and yellower than posts, poles and thatch) and an
    // ironwood hull stands nearly black against them, its lit edges and coins the brighter for it.
    // Two places where the thatch has worn thin: a dense cluster of pinhole rays falls on the steam before the
    // sternpost and another on the second curtain of shavings inside the starboard ribs (no wide shaft there).
    const day = !(rain || night), dayPale = day && swapA;
    const SUN_AMBER = [0.46, 0.82, 0.32];
    const THIN = [[3, 22, 62, 12, 0.5], [20, 30, -258, 10, 0.55]];
    const hero = await buildHero(ctx, day ? { ...hopts, look: 'noon', teak: swapA, paleRibs: swapA, day: true, newRibs: amber ? 19 : 0, thin: THIN, sun: amber ? SUN_AMBER : null }
      : { ...hopts, look: lookName, thin: THIN });
    scene.add(hero.object);
    const carried = hero.carried;                   // the plank and its slings: posed by the hero from the camera, hidden while u <= 0.12
    const LU = hero.light.uniforms, GL = hero.light.glsl, T = hero.tools, A = hero.anchors, HC = T.C;
    LU.uRoof.value.x = RIDGE_Y; LU.uRoof.value.y = ROOF_SLOPE;
    // tune the looks where the hero's own values were too dark or too hot in the pictures
    if (night) { LU.uGlaze.value.setRGB(0.011, 0.018, 0.046); LU.uFillUp.value.multiplyScalar(0.62); LU.uFillDown.value.multiplyScalar(0.62); }
    if (rain) { LU.uFillUp.value.multiplyScalar(1.9); LU.uFillDown.value.multiplyScalar(1.9); LU.uWetAll.value = 0.7; }
    if (amber) { LU.uSunDir.value.set(SUN_AMBER[0], SUN_AMBER[1], SUN_AMBER[2]).normalize(); LU.uCoinCol.value.setRGB(5.7, 4.25, 2.2); }
    // by day the shade is brown (thatch-light from above on up-turned faces, warm sand-light from below on
    // down-turned ones), with green leaf light from port and the lagoon's turquoise from starboard; a face turned fore
    // or aft is the shaded flank (the hero's uForm). In the late look the shade from above is bluer against the amber coins.
    if (amber) { LU.uFillUp.value.setRGB(0.5, 0.6, 0.64); LU.uFillDown.value.setRGB(0.9, 0.68, 0.42); }
    // an ironwood hull drinks the fills: they are raised a little so the dark timber still shows its form
    if (day && !swapA) { LU.uFillUp.value.multiplyScalar(1.28); LU.uFillDown.value.multiplyScalar(1.28); }
    const wood = hero.materials.plain, woodDbl = hero.materials.cloth;
    const lin = (c, k = 1) => [c.r * k, c.g * k, c.b * k];
    const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const mesh = (acc, mat, name) => { const m = new THREE.Mesh(T.accGeometry(acc), mat); m.name = name; scene.add(m); return m; };
    const basicMat = (frag, uniforms, o = {}) => new THREE.ShaderMaterial({ vertexShader: BASIC_VERT, fragmentShader: frag, fog: true, side: o.side ?? THREE.FrontSide,
      uniforms: { ...fogU(), ...LU, uStir: { value: o.stir || 0 }, ...uniforms } });
    await ctx.yield();

    // the one gap in the bow's mat screen (two mats tied back, right of the stem) and the cool light it lets in
    const SLOT = { x0: 21, x1: 47, y0: 22.4, y1: 35.6 };
    const spillCol = night ? new THREE.Color(0.012, 0.03, 0.075) : pal[6].clone().multiplyScalar(rain ? 0.17 : 0.24);
    // ---------------------------------------------------------------- sand
    {
      const g = new THREE.PlaneGeometry(700, 900, 1, 1).rotateX(-Math.PI / 2).translate(0, 0, -190);
      const m = new THREE.ShaderMaterial({ fog: true, fragmentShader: sandFrag(GL),
        vertexShader: '#include <fog_pars_vertex>\nvarying vec3 vWp;\nvoid main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
        uniforms: { ...fogU(), ...LU, uSand: { value: pal[5].clone().multiplyScalar(0.6) }, uShaving: { value: pal[1].clone().lerp(pal[3], 0.45).multiplyScalar(0.8) }, uSunOut: { value: L.sunOut }, uPock: { value: rain ? 1 : 0 }, uPool: { value: night ? 0.85 : rain ? 0.26 : 0.2 },
          uSpill: { value: new THREE.Vector4(SLOT.x0, SLOT.x1, SHED_Z1, 0.055) }, uSpillCol: { value: spillCol } } });
      const sand = new THREE.Mesh(g, m); sand.name = 'sand'; scene.add(sand);
    }
    // ---------------------------------------------------------------- outside the eaves: palms to port, lagoon to starboard forward
    const cardU = { uOut: { value: new THREE.Vector3(...L.out) }, uMat: { value: pal[4].clone().lerp(pal[2], 0.45).multiplyScalar(0.56) }, uGreen: { value: new THREE.Color('#62993a').multiplyScalar(0.95) }, uSeaGain: { value: night ? 3.2 : 1 }, uSlotGain: { value: night ? 0.34 : rain ? 0.8 : 0.72 },
      uTurq: { value: pal[6].clone().multiplyScalar(1.15) }, uSkyC: { value: new THREE.Color(rain ? '#b9cfd8' : '#cfe6f2').multiplyScalar(1.15) }, uRainSky: { value: rain ? 1 : 0 }, uSandC: { value: pal[5].clone().multiplyScalar(1.25) } };
    {
      const acc = T.makeAcc();
      const wall = (x, zs, lag, flip) => {
        for (let i = 0; i < zs.length - 1; i++) {
          const b = acc.n, z0 = zs[i], z1 = zs[i + 1];
          for (const [z, y, l] of [[z0, -2, lag[i]], [z1, -2, lag[i + 1]], [z1, 170, lag[i + 1]], [z0, 170, lag[i]]]) {
            acc.pos.push(x, y, z); acc.nrm.push(x < 0 ? 1 : -1, 0, 0); acc.col.push(l, 0, 0); acc.uv.push(z + (flip ? 400 : 0), y);
          }
          acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); acc.n += 4;
        }
      };
      wall(-168, [220, -620], [0, 0], false);
      // to starboard the palms thin out forward of z -150 and give way to the lagoon's glare: a band of white sand and
      // turquoise light under a pale strip of sky, painted on the wall (light, never a view: no water is built)
      wall(168, [220, -150, -215, -620], [0, 0, 1, 1], true);
      wall(176, [-40, -620], [1, 1], true);      // the same band behind the thinning palms
      // astern, behind the open gable: palms and sky (a steady camera can look that way)
      {
        const b = acc.n;
        for (const [x, y] of [[-168, -2], [176, -2], [176, 200], [-168, 200]]) { acc.pos.push(x, y, 220); acc.nrm.push(0, 0, -1); acc.col.push(0, 0, 0); acc.uv.push(x - 1500, y); }
        acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); acc.n += 4;
      }
      // the lagoon again beyond the bow gable, for the one slot left open in the mat screen (sea level raised so the slot holds glare, not beach)
      {
        const b = acc.n;
        for (const [x, y] of [[-30, -2], [120, -2], [120, 90], [-30, 90]]) { acc.pos.push(x, y, SHED_Z1 - 40); acc.nrm.push(0, 0, 1); acc.col.push(1, 1, 0); acc.uv.push(x + 900, y - 9.5); }
        acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); acc.n += 4;
      }
      const m = basicMat(cardFrag(GL), { ...cardU, uFogKeep: { value: 0.38 } }, { side: THREE.DoubleSide });
      mesh(acc, m, 'outside');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- shed: thatch, fringe, mat screen
    const roofY = (x) => RIDGE_Y - ROOF_SLOPE * Math.abs(x);
    {
      const acc = T.makeAcc();
      for (const s of [-1, 1]) {
        const b = acc.n, xe = 98, sl = Math.hypot(xe, ROOF_SLOPE * xe);
        for (const [x, z, v] of [[0, SHED_Z0 + 6, 0], [0, SHED_Z1 - 4, 0], [s * xe, SHED_Z1 - 4, sl], [s * xe, SHED_Z0 + 6, sl]]) {
          acc.pos.push(x, roofY(x) + 0.6, z); acc.nrm.push(-s * 0.6, -0.8, 0); acc.col.push(1, 1, 1); acc.uv.push(z, v);
        }
        acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); acc.n += 4;
      }
      const m = basicMat(thatchFrag(GL), { uThatch: { value: pal[4].clone().lerp(pal[0], 0.35) }, uHoleGain: { value: night ? 0.5 : 0.62 } }, { side: THREE.DoubleSide });
      mesh(acc, m, 'thatch');
    }
    const leafMat = (stir, back) => basicMat(leafFrag(GL), { uSunOut: { value: L.sunOut }, uBack: { value: back } }, { side: THREE.DoubleSide, stir });
    const palmTrunks = [], pointTrunks = [], beachNuts = [];
    {
      // frond fringe: tips hanging from both eaves and from the stern gable, stirring
      const acc = T.makeAcc(), fr = rng.fork('fringe');
      const dry = lin(pal[4], 0.9), green = [0.2, 0.34, 0.08];
      const tip = (x, y, z, ax, az, len, w) => {
        const b = acc.n, t = fr(), c = [lerp(dry[0], green[0], t * 0.6), lerp(dry[1], green[1], t * 0.6), lerp(dry[2], green[2], t * 0.6)];
        const k = 0.7 + 0.5 * fr();
        acc.pos.push(x - ax * w, y, z - az * w, x + ax * w, y, z + az * w, x + (fr() - 0.5) * 1.5 * az, y - len, z + (fr() - 0.5) * 1.5 * ax);
        for (let j = 0; j < 3; j++) { acc.nrm.push(az, 0.2, ax); acc.col.push(c[0] * k, c[1] * k, c[2] * k); }
        acc.uv.push(0, 0, 1, 0, 0.5, 1);
        acc.idx.push(b, b + 1, b + 2); acc.n += 3;
      };
      for (const s of [-1, 1]) for (let z = SHED_Z0 + 6; z > SHED_Z1; z -= 1.5) tip(s * (96 + fr() * 2), roofY(97) + 1 + fr() * 1.5, z + fr(), 0, 1, 3.5 + fr() * 4.5, 0.8);
      for (let x = -96; x < 96; x += 1.5) tip(x + fr(), roofY(x) + 0.4, SHED_Z0 + 6, 1, 0, 3 + fr() * 4, 0.8);
      await ctx.yield();
      // real fronds reaching in under both eaves near the entry, so the palm wall has something in front of it
      const frond = (x, y, z, dx, dz, len, droop, gcol) => {
        const N = 9, sx = -dz, sz = dx;
        for (let i = 1; i <= N; i++) {
          const t = i / N, px = x + dx * len * t, pz = z + dz * len * t, py = y + len * (0.28 * t - droop * t * t);
          for (const sd of [-1, 1]) {
            const b = acc.n, ll = len * 0.3 * (1 - 0.55 * t) * (0.8 + 0.4 * fr()), k = 0.7 + 0.6 * fr(), w = 0.55;
            acc.pos.push(px - dx * w, py, pz - dz * w, px + dx * w, py, pz + dz * w, px + sd * sx * ll + dx * ll * 0.35, py - ll * (0.55 + 0.5 * t), pz + sd * sz * ll + dz * ll * 0.35);
            for (let j = 0; j < 3; j++) { acc.nrm.push(sd * sx * 0.5, 0.8, sd * sz * 0.5); acc.col.push(gcol[0] * k, gcol[1] * k, gcol[2] * k); }
            acc.uv.push(0, 0.3 * t, 1, 0.3 * t, 0.5, 0.4 + 0.6 * t);
            acc.idx.push(b, b + 1, b + 2); acc.n += 3;
          }
        }
      };
      for (let k = 0; k < 22; k++) {
        const s = k & 1 ? 1 : -1, z = 96 - k * 9 - fr() * 6, x0 = s * (104 + fr() * 6), g = 0.75 + 0.5 * fr();
        frond(x0, 36 + fr() * 12, z, -s * (0.75 + 0.2 * fr()), (fr() - 0.5) * 0.9, 13 + fr() * 6, 0.5 + 0.3 * fr(), [0.16 * g, 0.36 * g, 0.07 * g]);
      }
      // beyond the eaves, in front of the painted palm wall: whole palm heads at three depths and clumps of banana,
      // sun-bleached and paler with distance, so the screen of leaves has real fronds that move
      const pm2 = rng.fork('palms'), hazeC = night ? [0.3, 0.4, 0.6] : rain ? [0.42, 0.5, 0.5] : [0.5, 0.6, 0.46];
      const blade = (x, y, z, dx, dz, len, w, gcol) => {
        const N = 4, sx = -dz, sz = dx, b = acc.n;
        for (let i = 0; i <= N; i++) {
          const t = i / N, run = len * t * (1 - 0.25 * t), ww = w * Math.sin(Math.PI * (0.1 + 0.84 * t));
          for (const sd of [-1, 0, 1]) {
            const k = (sd === 0 ? 1.2 : 0.8 + 0.3 * pm2());
            acc.pos.push(x + dx * run + sd * sx * ww, y + len * (0.8 * t - 0.66 * t * t) - Math.abs(sd) * ww * 0.3, z + dz * run + sd * sz * ww);
            acc.nrm.push(sd * sx * 0.4, 0.9, sd * sz * 0.4); acc.col.push(gcol[0] * k, gcol[1] * k, gcol[2] * k); acc.uv.push(0.5 + sd * 0.5, 0.15 + 0.6 * t);
          }
        }
        for (let i = 0; i < N; i++) for (let j = 0; j < 2; j++) { const a0 = b + i * 3 + j, a1 = a0 + 1, c0 = a0 + 3, d0 = c0 + 1; acc.idx.push(a0, c0, a1, a1, c0, d0); }
        acc.n += (N + 1) * 3;
      };
      for (let k = 0; k < 28; k++) {
        const sd = k & 1 ? 1 : -1, row = (k >> 1) % 3, x = sd * (106 + row * 15 + pm2() * 9), z = 112 - (k >> 1) * 24 - pm2() * 14, top = 30 + row * 9 + pm2() * 14;
        const hz = 0.12 + 0.2 * row, g = 0.8 + 0.5 * pm2(), base = [0.27 * g, 0.45 * g, 0.1 * g];
        const gc = [lerp(base[0], hazeC[0], hz), lerp(base[1], hazeC[1], hz), lerp(base[2], hazeC[2], hz)];
        const nf = 10, a0 = pm2() * 6.28;
        for (let q = 0; q < nf; q++) { const an = a0 + q / nf * 6.283 + (pm2() - 0.5) * 0.3; frond(x, top, z, Math.cos(an), Math.sin(an), 15 + pm2() * 7, 0.55 + 0.4 * pm2(), gc); }
        for (let q = 0; q < 3; q++) { const an = pm2() * 6.28; frond(x, top + 1, z, Math.cos(an) * 0.5, Math.sin(an) * 0.5, 11 + pm2() * 4, 0.1, [gc[0] * 1.25, gc[1] * 1.2, gc[2] * 1.1]); }     // young fronds standing up
        palmTrunks.push([x + (pm2() - 0.5) * 16, x, top, z, 0.7 + 0.25 * pm2()]);
        if ((k & 3) === 3) await ctx.yield();   // four crowns per step
      }
      for (let k = 0; k < 22; k++) {
        const sd = k & 1 ? 1 : -1, x = sd * (99 + pm2() * 9), z = 108 - (k >> 1) * 21 - pm2() * 12, g = 0.8 + 0.5 * pm2();
        for (let q = 0; q < 6; q++) { const an = pm2() * 6.28; blade(x, 2 + pm2() * 5, z, Math.cos(an), Math.sin(an), 9 + pm2() * 5, 1.5 + pm2() * 0.7, [0.3 * g, 0.56 * g, 0.11 * g]); }
      }
      await ctx.yield();
      // palms on the beach to starboard, leaning to the water, coconuts under their crowns
      const bp = ctx.core.makeRng('hif-beach:' + ctx.seed);
      for (let k = 0; k < 10; k++) {
        const z = -166 - k * 34 - bp() * 16, x = 96 + bp() * 20, top = 36 + bp() * 18, lean = 5 + bp() * 9, g = 0.85 + 0.4 * bp();
        const gc = night ? [0.1 * g, 0.2 * g, 0.16 * g] : [0.3 * g, 0.52 * g, 0.12 * g], a0 = bp() * 6.28;
        for (let q = 0; q < 11; q++) { const an = a0 + q / 11 * 6.283 + (bp() - 0.5) * 0.3; frond(x + lean, top, z, Math.cos(an), Math.sin(an), 15 + bp() * 7, 0.55 + 0.4 * bp(), gc); }
        palmTrunks.push([x, x + lean, top, z, 0.8 + 0.25 * bp()]); beachNuts.push([x + lean, top - 1.4, z]);
      }
      await ctx.yield();
      // palms on the point where the starboard palms end: single trees at four depths in front of the dwindling wall
      // and out on the spit, so the screen of leaves breaks up into crowns and trunks against the lagoon
      const pp = ctx.core.makeRng('hif-point:' + ctx.seed);
      for (let k = 0; k < 7; k++) {
        const z = -84 - k * 9.5 - pp() * 5, x = 136 + (k % 4) * 13 + pp() * 10, top = 30 + pp() * 20, lean = 3 + pp() * 9, g = 0.8 + 0.4 * pp(), hz = 0.1 + 0.07 * (k % 4);
        const b0 = night ? [0.1 * g, 0.2 * g, 0.16 * g] : [0.28 * g, 0.48 * g, 0.11 * g], gc = [lerp(b0[0], hazeC[0], hz), lerp(b0[1], hazeC[1], hz), lerp(b0[2], hazeC[2], hz)], a0 = pp() * 6.28;
        for (let q = 0; q < 10; q++) { const an = a0 + q / 10 * 6.283 + (pp() - 0.5) * 0.3; frond(x + lean, top, z, Math.cos(an), Math.sin(an), 14 + pp() * 7, 0.55 + 0.4 * pp(), gc); }
        pointTrunks.push([x, x + lean, top, z, 0.75 + 0.25 * pp(), 0.8 + 0.4 * pp()]);
      }
      await ctx.yield();
      // fronds and banana blades reaching across the gap between the port mats and the bow gable: dark shapes against the sunlit palms
      for (let k = 0; k < 7; k++) {
        const g = 0.5 + 0.5 * bp(), an = -0.5 + bp() * 1.0;
        frond(-70 - bp() * 14, 24 + k * 6.5 + bp() * 4, -428 - bp() * 52, Math.cos(an) * 0.95, Math.sin(an) * 0.6, 15 + bp() * 8, 0.45 + 0.4 * bp(), night ? [0.03 * g, 0.06 * g, 0.07 * g] : [0.09 * g, 0.2 * g, 0.05 * g]);
      }
      for (let k = 0; k < 3; k++) { const x = -66 - bp() * 10, z = -436 - k * 16 - bp() * 6, g = 0.6 + 0.5 * bp(); for (let q = 0; q < 6; q++) { const an = bp() * 6.28; blade(x, 3 + bp() * 6, z, Math.cos(an), Math.sin(an), 10 + bp() * 6, 1.6 + bp() * 0.8, night ? [0.05 * g, 0.1 * g, 0.1 * g] : [0.16 * g, 0.36 * g, 0.07 * g]); } }
      // close against the painted palm wall, standing in and over its canopy: two more ranks of real crowns on their
      // trunks, paler with depth, so the wall of leaves is overlapping layers of moving fronds with haze between them
      // (their own random stream; frond() draws from the fringe's stream, which nothing uses after this)
      const pw = ctx.core.makeRng('hif-wall:' + ctx.seed);
      for (const sd of [-1, 1]) {
        const zEnd = sd < 0 ? -520 : -62;
        for (let z = 118; z > zEnd; z -= 18) for (let row = 0; row < 2; row++) {
          const zz = z - pw() * 13 - row * 8, x = sd * (146 + row * 10 + pw() * 6), fadeS = sd > 0 ? smoothstep(-75, -10, zz) : 1;
          const top = (50 + row * 13 + pw() * 14) * (0.55 + 0.45 * fadeS), hz = 0.3 + 0.2 * row, g = 0.8 + 0.45 * pw();
          const b0 = night ? [0.1 * g, 0.2 * g, 0.16 * g] : [0.27 * g, 0.47 * g, 0.11 * g], gc = [lerp(b0[0], hazeC[0], hz), lerp(b0[1], hazeC[1], hz), lerp(b0[2], hazeC[2], hz)];
          const a0 = pw() * 6.28;
          for (let q = 0; q < 9; q++) { const an = a0 + q / 9 * 6.283 + (pw() - 0.5) * 0.3; frond(x, top, zz, Math.cos(an), Math.sin(an), 15 + pw() * 7, 0.55 + 0.4 * pw(), gc); }
          pointTrunks.push([x + (pw() - 0.5) * 10, x, top, zz, 0.8 + 0.25 * pw(), 0.75 + 0.3 * pw()]);
          if (row === 1) await ctx.yield();   // a pair of crowns per step
        }
      }
      await ctx.yield();
      mesh(acc, leafMat(0.5, 1), 'fringe');
      await ctx.yield();
    }
    await ctx.yield();

    // ---------------------------------------------------------------- bamboo: every culm is one instance (built at the end of the timber sections)
    const culms = [];
    // bamboo is the grey-green of the palette, kept apart from the honey of new timber and the dark of ironwood
    // (by day, with the hull in pale new timber, poles and props are a darker, warmer brown: weathered culms, a few still green)
    const bcol = dayPale ? [lin(pal[4].clone().lerp(pal[2], 0.55).lerp(pal[0], 0.24), 0.5), lin(pal[2].clone().lerp(pal[4], 0.25).lerp(pal[0], 0.34), 0.52), lin(pal[2].clone().lerp(pal[0], 0.42), 0.46), [0.066, 0.092, 0.042], [0.055, 0.04, 0.03]]
      : [lin(pal[4].clone().lerp(pal[2], 0.4), 0.66), lin(pal[4].clone().lerp(pal[2], 0.75), 0.6), lin(pal[2], 0.52), [0.12, 0.15, 0.06], [0.075, 0.055, 0.04]];
    const lash = (x, y, z, r, len = 1.8) => culms.push(x, y - len / 2, z, x, y + len / 2, z, r, 0.075, 0.055, 0.04);
    const br = rng.fork('bamboo');
    const culm = (x0, y0, z0, x1, y1, z1, r, tone) => {
      const a = bcol[tone ?? (br() < 0.6 ? 0 : br() < 0.6 ? 1 : br() < 0.7 ? 2 : 3)], k = 0.75 + 0.5 * br();
      culms.push(x0, y0, z0, x1, y1, z1, r, a[0] * k, a[1] * k, a[2] * k);
    };
    // three culms lashed together (posts of the gantry, tower legs)
    const culm3 = (x0, y0, z0, x1, y1, z1, r) => {
      for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5, dx = Math.cos(a) * r * 0.95, dz = Math.sin(a) * r * 0.95; culm(x0 + dx, y0, z0 + dz, x1 + dx, y1 + (k - 1) * 1.2, z1 + dz, r); }
    };

    for (const [xf, x, top, z, r] of palmTrunks) culm(xf, -1, z + 1, x, top + 0.5, z, r, 2);      // ringed grey trunks of the palms outside
    // (the palms on the point, and the washing line's pole further on, take nothing from the bamboo's random stream)
    for (const [xf, x, top, z, r, k] of pointTrunks) culms.push(xf, -1, z + 1, x, top + 0.5, z, r, bcol[2][0] * k, bcol[2][1] * k, bcol[2][2] * k);
    // ---------------------------------------------------------------- shed timber: posts, plates, ridge pole, gantry, tripod
    const timber = T.makeAcc();                    // everything of sawn or grown wood that the world adds, one mesh
    const trunkC = dayPale ? lin(pal[2].clone().lerp(pal[0], 0.5).lerp(pal[1], 0.12), 0.9) : lin(pal[2].clone().lerp(pal[0], 0.45), 1.0), newC = HC.newWood, ironC = HC.iron, paleC = HC.pale;
    {
      const pr = rng.fork('posts'), cc = [0, 0, 0];
      let n = 0;
      for (let z = 100; z >= -500; z -= 30) {
        for (const x of [-88, -60, 60, 88]) {
          const top = roofY(x) - 0.5, P = [], lean = (pr() - 0.5) * 2.4, lz = (pr() - 0.5) * 2.4, r = 1.35 + pr() * 0.35, tone = 0.8 + pr() * 0.45;
          const N = 6;
          for (let i = 0; i <= N; i++) { const t = i / N; P.push(V3(x + lean * Math.sin(t * 3.1) + (pr() - 0.5) * 0.5, top * t - 1, z + lz * Math.sin(t * 2.2 + 1) + (pr() - 0.5) * 0.5)); }
          T.bar(timber, P, 1, 9, (i, j) => { const t = i / N, k = tone * (0.55 + 0.45 * smoothstep(0, 0.25, t)) * (0.85 + 0.3 * ((j * 7 + i * 3) % 5) / 5); cc[0] = trunkC[0] * k; cc[1] = trunkC[1] * k; cc[2] = trunkC[2] * k; return cc; },
            { taper: (i) => r * (1.25 - 0.35 * i / N + (i === 0 ? 0.35 : 0)) });
          // a forked head and a knee to the plate
          const s = Math.sign(x);
          const kn = Math.abs(x) < 70 ? 0.62 : 1;      // (short knees on the inner rows)
          T.beam(timber, V3(x - s * 5 * kn, top - 9 * kn, z), V3(x + s * 0.5, top - 1.5, z), 0.7, 0.7, 0.15, shade(trunkC, 0.8 * tone), V3(0, 0, 1));
          if ((++n & 7) === 0) await ctx.yield();
        }
      }
      // wall plates along the post heads and the ridge pole
      for (const x of [-88, -60, 60, 88]) for (let z = 100; z > -500; z -= 30) T.beam(timber, V3(x, roofY(x) - 1.6, z + 2), V3(x, roofY(x) - 1.6, z - 32), 0.9, 0.9, 0.2, shade(trunkC, 0.75 + 0.3 * pr()), V3(0, 1, 0));
      for (let z = 115; z > -500; z -= 41) T.beam(timber, V3(0, RIDGE_Y - 1.4, z + 2), V3(0, RIDGE_Y - 1.4, z - 43), 1.0, 1.0, 0.2, shade(trunkC, 0.7), V3(0, 1, 0));
    }
    await ctx.yield();
    // rafters (bamboo, at the lines the thatch shader shades) and purlins
    for (let z = 112.5; z > -500; z -= 7.5) for (const s of [-1, 1]) culm(s * 0.5, RIDGE_Y - 0.6, z, s * 97, roofY(97) - 0.4, z + (br() - 0.5), 0.55, 0);
    for (const x of [-74, -44, -22, 22, 44, 74]) for (let z = 114; z > -500; z -= 61) culm(x, roofY(x) - 1.3, z + 3, x, roofY(x) - 1.3, z - 64, 0.5, 1);
    // the gantry that frames the portal: upright at x = -18, bar at y = 43.5, a brace, and lashings to the stem
    const GZ = A.gantry.z, GX = A.gantry.uprightX, GY = A.gantry.barY;
    // (slim: nothing of it is wider than a twentieth of the frame on the last straight, and its braces stay left of and above the ring)
    culm3(GX, -1, GZ, GX, 52, GZ, 0.46); lash(GX, GY + 0.6, GZ + 0.2, 1.12, 2.4); lash(GX, 39.5, GZ - 0.3, 1.08, 1.4); lash(GX, 50, GZ - 0.3, 1.08, 1.4); lash(GX, 12, GZ - 0.4, 1.08, 1.4);
    culm3(GX - 3.5, GY + 0.6, GZ + 0.4, 5.5, GY + 0.6, GZ + 0.4, 0.4);
    culm(GX - 9, -1, GZ - 3, GX - 0.2, 40, GZ - 0.8, 0.38);
    culm(GX, 50, GZ - 0.8, GX + 10, GY + 1.1, GZ - 0.8, 0.34);
    culm(GX + 1, 12, GZ - 1.2, GX + 1, 12, GZ - 40, 0.4);
    // the rope's far end: an A-frame of bamboo at z = -420, and the tripod behind the entry
    const ry0 = A.ridgeRope[1].y;
    const rx0 = A.ridgeRope[1].x;
    // a wide A-frame astride the path: seen from the nave its legs stand either side of the portal and the stem
    // (each leg two slim culms one behind the other, feet far out: from the last straight they are thin lines well clear of the ring)
    for (const dz of [-0.45, 0.45]) { culm(-58, -1, -420 + dz, rx0 - 0.4, ry0 + 3.5, -420 + dz, 0.44, dz < 0 ? 0 : 1); culm(44, -1, -420 + dz, rx0 + 0.4, ry0 + 3.5, -420 + dz, 0.44, dz < 0 ? 1 : 0); }
    lash(rx0, ry0 + 1.6, -420, 1.25, 3.0);
    culm(rx0 - 7.4, ry0 - 3.6, -419.0, rx0 + 7.2, ry0 - 3.6, -419.0, 0.34, 1); lash(rx0 - 6.5, ry0 - 3.6, -419.7, 0.95, 1.2); lash(rx0 + 6.4, ry0 - 3.6, -419.7, 0.95, 1.2);     // its tie, 14 m above the eye
    // ---------------------------------------------------------------- the bow gable: a hanging screen of woven palm mats
    // Rows of mats hang from bamboo poles, each row's frayed hem over the head of the row below, in front of one dim
    // backing sheet. One slot is left open to starboard of the stem (a row of mats rolled away): the lagoon's glare.
    {
      const mr = rng.fork('mats'), ms = T.makeAcc(), MZ = SHED_Z1 + 0.6, PITCH = 10.4;
      {
        const b = ms.n;
        for (const [x, y] of [[-99, -1], [99, -1], [99, RIDGE_Y + 2], [-99, RIDGE_Y + 2]]) { ms.pos.push(x, y, MZ - 1.3); ms.nrm.push(1, 1, 0); ms.col.push(0.5, 0.37, 1); ms.uv.push(0, 0); }
        ms.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); ms.n += 4;
      }
      let matN = 0;
      for (let r = 0; r < 15; r++) {
        const yTop = 12.2 + PITCH * r, halfRow = Math.min(96, (RIDGE_Y - (yTop - 12.5)) / ROOF_SLOPE);
        if (halfRow < 4) break;
        const xe = Math.min(97, (RIDGE_Y - yTop) / ROOF_SLOPE + 5);
        culm(-xe, yTop + 0.25 + (mr() - 0.5) * 0.3, MZ + 0.5, xe, yTop + 0.25 + (mr() - 0.5) * 0.3, MZ + 0.5, 0.42, 2);
        let x = -halfRow - mr() * 3;
        while (x < halfRow) {
          const W = (6.6 + mr() * 3.2) * (mr() < 0.16 ? 1.7 : mr() < 0.15 ? 0.6 : 1), Hh = r === 0 ? 11.5 + mr() * 0.6 : 11.7 + mr() * 2.2, gap = mr() < 0.2 ? 0.25 + mr() * 0.5 : -0.2 - mr() * 0.5;
          const xc = x + W / 2, inSlot = xc > SLOT.x0 - 2 && xc < SLOT.x1 + 2, open = r === 2 && inSlot;
          const tone = mr(), id = mr(), belly = 0.35 + mr() * 0.95, hemSag = 0.3 + mr() * 1.0, tilt = (mr() - 0.5) * 0.09, drop = mr() < 0.3 ? mr() * 0.9 : 0, dz = (matN % 3) * 0.14 + mr() * 0.05, sagT = 0.2 + mr() * 0.5;
          if (!open) {
            const b = ms.n, NU = 6, NV = 5, Hm = r === 3 && inSlot ? 9.1 + 0.5 * tone : Hh;   // the row above the slot is hitched short
            for (let iv = 0; iv <= NV; iv++) for (let iu = 0; iu <= NU; iu++) {
              const u = iu / NU, v = iv / NV;
              ms.pos.push(xc + (u - 0.5) * W + tilt * v * Hm, yTop - drop - v * Hm - 4 * u * (1 - u) * (sagT * (1 - v) + hemSag * v), MZ + dz);
              ms.nrm.push(W, Hm, belly); ms.col.push(tone, id, 0); ms.uv.push(u, v);
            }
            for (let iv = 0; iv < NV; iv++) for (let iu = 0; iu < NU; iu++) { const a0 = b + iv * (NU + 1) + iu, b0 = a0 + 1, c0 = a0 + NU + 1, d0 = c0 + 1; ms.idx.push(a0, c0, b0, b0, c0, d0); }
            ms.n += (NU + 1) * (NV + 1);
          }
          x += W + gap; matN++;
        }
        if ((r & 3) === 3) await ctx.yield();
      }
      const matMat = (gain) => new THREE.ShaderMaterial({ vertexShader: MAT_VERT, fragmentShader: matFrag(GL), fog: true, side: THREE.DoubleSide,
        uniforms: { ...fogU(), ...LU, ...cardU, uStir: { value: 0.55 }, uMatGain: { value: gain }, uSlot: { value: new THREE.Vector4(SLOT.x0, SLOT.x1, SLOT.y0, SLOT.y1) }, uSpillCol: { value: spillCol } } });
      const mm = matMat(1.15), mmPort = matMat(1.5);
      const mg = T.accGeometry(ms); mg.boundingSphere = new THREE.Sphere(V3(0, 60, MZ), 140);
      const mats = new THREE.Mesh(mg, mm); mats.name = 'mats'; scene.add(mats);
      // The same mats hung outside the port staging abreast of the berth, three rows from poles lashed to uprights:
      // seen from inside, the new ribs the plank is bent to stand against their shade (pricked with day) and not
      // against the sunlit sand and palms. The screen runs straight beside the ribs and stops just past the last of
      // them; a short return of three looser mats then turns away to port, so that from the final straight only a
      // narrow, receding edge of it is left at the side of the frame. Each run is one mesh in its own frame: local x
      // runs forward along it, local z points inboard. (Its own random stream, so nothing built after it changes.)
      {
        const pr = ctx.core.makeRng('hif-port-mats:' + ctx.seed), zA = -306, zK = -389;
        const poleX = (z) => Math.max(A.halfBreadth(Math.max(z, -385), 26), A.halfBreadth(Math.max(z, -385), 47)) + 2.7 + 3.4 + 3.2;
        let xa = poleX(zA) + 2.2, xb = poleX(-385) + 2.2; const slope = (xb - xa) / (-385 - zA);
        let push = 0; for (let z = zA; z >= -385; z -= 6) push = Math.max(push, poleX(z) + 2.0 - (xa + slope * (z - zA)));
        xa += push;
        const K = V3(-(xa + slope * (zK - zA)), 0, zK), turn = 0.21, LR = 28.5;
        const run = (P0, P1, loose, name) => {
          const ps = T.makeAcc(), len = P0.distanceTo(P1), dx = (P1.x - P0.x) / len, dz = (P1.z - P0.z) / len;
          const at = (xl, y, off) => V3(P0.x + dx * xl - dz * off, y, P0.z + dz * xl + dx * off);     // off = metres inboard of the screen
          let matN = 0;
          for (let r = 0; r < 5; r++) {
            const yTop = 76.2 - 11.9 * r, a0 = at(-2, yTop + 0.25, 0.45), a1 = at(len + 2, yTop + 0.25 + (pr() - 0.5) * 0.4 - loose * 0.5 * r, 0.45);
            culm(a0.x, a0.y, a0.z, a1.x, a1.y, a1.z, 0.36, 2);
            let x = -pr() * 2;
            while (x < len - 1) {
              let W = (7 + pr() * 3.4) * (pr() < 0.16 ? 1.5 : 1); const Hm = 12.9 + pr() * 1.9 - loose * pr() * 2.5, gap = pr() < 0.12 ? 0.15 + pr() * 0.35 : -0.25 - pr() * 0.5;
              if (x + W > len - 3.5) W = Math.max(len - x + 0.3, 3.5);                          // the last mat of a row ends at the end of its pole
              const xc = x + W / 2, tone = pr(), id = pr(), belly = 0.45 + pr() * 1.0 + loose * 0.5, hemSag = 0.4 + pr() * 1.1 + loose * 0.5, tilt = (pr() - 0.5) * 0.1, drop = pr() < 0.3 ? pr() * 0.8 : 0, zo = (matN % 3) * 0.14 + pr() * 0.05, sagT = 0.25 + pr() * 0.65;
              // now and then a tie has slipped and one top corner hangs low
              const slipR = pr(), slip = slipR < 0.22 + 0.3 * loose ? 0.5 + pr() * 1.3 : pr() * 0, slipSide = pr() < 0.5 ? 1 : 0;
              const b = ps.n, NU = 6, NV = 5;
              for (let iv = 0; iv <= NV; iv++) for (let iu = 0; iu <= NU; iu++) {
                const u = iu / NU, v = iv / NV, cu = slipSide ? u : 1 - u;
                ps.pos.push(xc + (u - 0.5) * W + tilt * v * Hm, yTop - drop - v * Hm - 4 * u * (1 - u) * (sagT * (1 - v) + hemSag * v) - slip * cu * cu * (1 - 0.4 * v), zo);
                ps.nrm.push(W, Hm, belly); ps.col.push(tone, id, 0); ps.uv.push(u, v);
              }
              for (let iv = 0; iv < NV; iv++) for (let iu = 0; iu < NU; iu++) { const q0 = b + iv * (NU + 1) + iu, q1 = q0 + 1, q2 = q0 + NU + 1, q3 = q2 + 1; ps.idx.push(q0, q2, q1, q1, q2, q3); }
              ps.n += (NU + 1) * (NV + 1);
              x += W + gap; matN++;
            }
          }
          // uprights the poles are lashed to, footed in the sand outside the staging
          const nUp = Math.max(1, Math.round(len / 15.5));
          for (let k = 0; k <= nUp; k++) {
            if (loose && k === 0) continue;                 // (the return starts at the straight run's last upright)
            const xl = 2 + (len - 4) * k / nUp, f = at(xl + (pr() - 0.5) * 2, -1, -0.5 - pr() * 1.5), h = at(xl, 79 + pr() * 2, 0.9);
            culm(f.x, f.y, f.z, h.x, h.y, h.z, 0.42);
            for (let r = 0; r < 5; r++) { const l = at(xl, 76.4 - 11.9 * r, 0.8); lash(l.x, l.y, l.z, 0.62, 1.2); }
          }
          const pg = T.accGeometry(ps); pg.boundingSphere = new THREE.Sphere(V3(len / 2, 40, 0), len * 0.5 + 45);
          const pm = new THREE.Mesh(pg, mmPort); pm.name = name; pm.position.copy(P0); pm.rotation.y = Math.atan2(-dz, dx); scene.add(pm);
        };
        run(V3(-xa, 0, zA), K, 0, 'port-mats');
        run(K.clone(), V3(K.x - Math.sin(turn) * LR, 0, K.z - Math.cos(turn) * LR), 1, 'port-mats-return');
      }
      // gable posts in front of the screen, and the bundle of the rolled row above the slot
      for (const x of [-30, 0, 30]) {
        const top = roofY(x) - 1, P = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6; P.push(V3(x + 0.8 * Math.sin(t * 3 + x), top * t - 1, MZ + 1.6 + 0.4 * Math.sin(t * 2.2 + x))); }
        T.bar(timber, P, 1, 9, shade(trunkC, 0.62 + 0.2 * mr()), { taper: (i) => 1.25 * (1.2 - 0.3 * i / 6) });
      }
      // the two mats of the gap, gathered and tied back to either side: pleated bundles pinched by a rope
      const matC = lin(pal[4].clone().lerp(pal[2], 0.45), 0.42), cc2 = [0, 0, 0];
      for (const [xb, lean, tn] of [[SLOT.x0 + 0.6, -1.5, 1], [SLOT.x1 - 0.8, 1.9, 0.82]]) {
        const P = [], N = 9, yT = 33.0, yB = 22.9 + 0.9 * mr();
        for (let i = 0; i <= N; i++) { const t = i / N; P.push(V3(xb + lean * Math.sin(t * 2.2) + 0.5 * Math.sin(t * 7 + xb), yT - (yT - yB) * t, MZ + 0.9 + 0.5 * Math.sin(t * 3.1))); }
        const fr = T.framesFrom(P, V3(0, 0, 1));
        // wide where it hangs from the pole, pinched at the tie two thirds down, flaring again to the frayed hem
        const wide = (i) => { const t = i / N; return 2.7 - 2.0 * smoothstep(0, 0.62, t) + 1.5 * smoothstep(0.68, 1, t); };
        T.sweep(timber, P, fr.A, fr.B, T.profRound(1, 9, 0.4), { sa: wide, sb: (i) => 0.55 + 0.25 * wide(i),
          col: (i, j) => { const k = tn * (0.62 + 0.5 * ((j * 5 + i) % 3) / 2) * (0.75 + 0.25 * (j & 1)); cc2[0] = matC[0] * k; cc2[1] = matC[1] * k; cc2[2] = matC[2] * k; return cc2; } });
        const tie = P[6];
        { const R = []; for (let q = 0; q <= 10; q++) { const an = q / 10 * 6.2832; R.push(V3(tie.x + Math.cos(an) * 1.0, tie.y + 0.15 * Math.cos(an), tie.z + Math.sin(an) * 0.62)); } T.bar(timber, R, 0.13, 5, shade(HC.rope, 1.3), { caps: false, up: V3(0, 1, 0) }); }
        T.bar(timber, [V3(tie.x, tie.y, tie.z), V3(tie.x + lean * 2.2, tie.y + 2.6, MZ + 0.5)], 0.1, 5, shade(HC.rope, 1.2));
      }
      // poles left leaning across the gap, and the rope that held the mats
      culm(SLOT.x0 - 4, 20.5, MZ + 1.3, SLOT.x1 - 5, 36.4, MZ + 1.0, 0.42, 1);
      culm(40.5, -1, MZ + 1.9, 38.6, 47, MZ + 0.8, 0.5, 0); lash(39.9, 22.6, MZ + 1.5, 1.0, 1.4);
      culm(24, 37.2, MZ + 1.1, 46, 34.6, MZ + 1.2, 0.3, 2);
      T.bar(timber, [V3(SLOT.x0 + 2, 33.2, MZ + 0.7), V3(29, 31.6, MZ + 0.9), V3(36, 32.3, MZ + 0.8), V3(SLOT.x1 - 2, 33.3, MZ + 0.7)], 0.11, 5, shade(HC.rope, 1.2));
    }
    await ctx.yield();
    // the next strakes, sawn and stacked on bearers to starboard of the stem, with jars beside them
    {
      const pr2 = rng.fork('stack');
      for (const z of [-441, -458, -475]) T.beam(timber, V3(12, 0.8, z), V3(31, 0.8, z + 0.6), 0.6, 0.6, 0.12, shade(trunkC, 0.7), V3(0, 1, 0));
      for (let layer = 0; layer < 3; layer++) for (let k = 0; k < 5 - layer; k++) {
        const x = 14.2 + k * 2.75 + layer * 1.2 + (pr2() - 0.5) * 0.4, y = 1.66 + layer * 0.52, sk = (pr2() - 0.5) * 1.2, t = pr2();
        T.beam(timber, V3(x, y, -435 - pr2() * 3), V3(x + sk, y, -479 + pr2() * 3), 1.16, 0.24, 0.07, T.mixC(newC, paleC, 0.25 + 0.55 * t), V3(0, 1, 0), { capTone: 1.2 });
      }
    }
    await ctx.yield();
    // ---------------------------------------------------------------- cloth: washing, a tarpaulin, pennants (one mesh, stirring)
    // The yard's few bright things: sarongs drying on the staging rails and on the tower, a blue tarpaulin, red and
    // yellow pennants. at(u, v) gives a point of the sheet (v = 0 at the edge it hangs by), tint(iu, iv) its colour;
    // every cell has its own corners, so stripes and borders stay crisp. uv.y drives how far the wind moves it.
    const cloth = T.makeAcc();
    // Sun-faded vegetable dyes: madder red, ochre and indigo, each in two strengths, and unbleached white. (The keys
    // are the old names; nothing here is turquoise, magenta or cobalt any more: the lagoon is the one cool accent.)
    const DYE = { red: [0.43, 0.075, 0.05], saffron: [0.6, 0.36, 0.07], indigo: [0.06, 0.085, 0.23], magenta: [0.34, 0.09, 0.075], turq: [0.15, 0.2, 0.32], white: [0.7, 0.66, 0.56], green: [0.47, 0.3, 0.08], cobalt: [0.15, 0.185, 0.27] };
    const PEN = { red: [0.58, 0.04, 0.03], saffron: [0.82, 0.46, 0.035] };
    const sheet = (NU, NV, at, tint, n, loose = (u, v) => v) => {
      const q = [V3(), V3(), V3(), V3()];
      for (let iv = 0; iv < NV; iv++) for (let iu = 0; iu < NU; iu++) {
        const b = cloth.n, c = tint(iu, iv);
        const cs = [[iu, iv], [iu + 1, iv], [iu + 1, iv + 1], [iu, iv + 1]];
        for (let k = 0; k < 4; k++) {
          const u = cs[k][0] / NU, v = cs[k][1] / NV; at(u, v, q[k]);
          cloth.pos.push(q[k].x, q[k].y, q[k].z); cloth.nrm.push(n.x, n.y, n.z); cloth.col.push(c[0], c[1], c[2]); cloth.uv.push(u, loose(u, v));
        }
        cloth.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); cloth.n += 4;
      }
    };
    // a sarong over a line from a to b (top corners), H long: a body colour, a broad band, a pale selvedge at the hem
    const sarong = (a, b, H, body, band, k = 1) => {
      const n = V3(-(b.z - a.z), 0, b.x - a.x).normalize(), W = a.distanceTo(b);
      sheet(5, 6, (u, v, o) => o.set(lerp(a.x, b.x, u) + n.x * 0.5 * v * Math.sin(u * 3.1), lerp(a.y, b.y, u) - 0.06 * W * 4 * u * (1 - u) * (1 - v) - v * H, lerp(a.z, b.z, u) + n.z * 0.5 * v * Math.sin(u * 3.1)),
        (iu, iv) => shade(iv === 5 ? DYE.white : iv === 3 || iv === 0 ? band : body, k * (0.95 + 0.1 * ((iu * 3 + iv * 5) % 4) / 3)), n);
    };
    // a string of pennants from a to b, n of them, alternately red and yellow
    const pennants = (a, b, nP, len = 2.6) => {
      T.bar(timber, [a, a.clone().lerp(b, 0.5).add(V3(0, -0.8, 0)), b], 0.07, 4, shade(HC.rope, 1.3));
      const d = b.clone().sub(a), W = d.length() / nP * 0.72, nn = V3(-d.z, 0, d.x).normalize();
      for (let k = 0; k < nP; k++) {
        const t0 = (k + 0.14) / nP, c = k & 1 ? PEN.saffron : PEN.red, sag = (t) => -0.8 * 4 * t * (1 - t);
        sheet(1, 2, (u, v, o) => { const t = t0 + (0.5 + (u - 0.5) * (1 - v)) * W / d.length(); return o.set(a.x + d.x * t, a.y + d.y * t + sag(t) - v * len, a.z + d.z * t); }, () => c, nn, (u, v) => 0.6 * v);
      }
    };

    const ry1 = A.ridgeRope[0].y;
    // red and yellow pennants from the gantry's upright to the stem, above the ring; a line of washing between two posts at the entry
    pennants(V3(GX + 0.6, 50.5, GZ - 0.3), V3(-1.6, 49.2, -452.2), 9, 2.3);
    pennants(V3(GX - 0.8, 51, GZ - 0.6), V3(-57, 30, -431), 12, 2.6);
    { let z = 37.5; for (const [a, b] of [['indigo', 'saffron'], ['red', 'white'], ['saffron', 'magenta'], ['turq', 'white'], ['magenta', 'saffron']]) { sarong(V3(60.2, 17.5, z), V3(60.2, 17.5, z - 4.6), 6.4, DYE[a], DYE[b]); z -= 5.3; } }
    T.bar(timber, [V3(60.2, 17.7, 40), V3(60.2, 17.2, 25), V3(60.2, 17.7, 10)], 0.09, 4, shade(HC.rope, 1.3));
    culms.push(60.6, -1, 9.6, 60.1, 21.5, 10.1, 0.42, bcol[0][0] * 0.95, bcol[0][1] * 0.95, bcol[0][2] * 0.95); culms.push(64.5, -1, 4.5, 60.3, 15, 9.9, 0.3, bcol[1][0] * 1.05, bcol[1][1] * 1.05, bcol[1][2] * 1.05); lash(60.2, 15.2, 10.0, 0.5, 1.2);     // the line's forward pole and its stay
    // a faded indigo cloth thrown over the after end of the stacked strakes
    sheet(5, 6, (u, v, o) => o.set(12.6 + 16.5 * u, 3.5 - 2.6 * Math.pow(Math.abs(u - 0.5) * 2, 4) - 2.2 * Math.pow(Math.max(0, v - 0.6) / 0.4, 2) + 0.12 * Math.sin(u * 19 + v * 7), -433.5 - 17 * v),
      (iu, iv) => shade(DYE.cobalt, 0.9 + 0.14 * ((iu * 3 + iv * 5) % 4) / 3), V3(0, 1, 0), (u, v) => 0.12);
    culm3(-9, -1, 108, 6, ry1 + 3, 100.5, 0.75); culm3(21, -1, 108, 6, ry1 + 3, 100.5, 0.75); culm3(6, -1, 124, 6, ry1 + 3, 100.5, 0.75);

    // ---------------------------------------------------------------- props under the turn of the bilge
    {
      const pr = rng.fork('props');
      const perRib = Math.max(3, Math.round(5 * Math.min(density, 1.1)));
      for (let i = 0; i < 70; i++) {
        const z = -60 - 4.7 * i, far = i > 45 ? detail : 1;
        for (const s of [-1, 1]) {
          for (let k = 0; k < perRib; k++) {
            if (pr() > far) continue;
            const y = 12 + pr() * 20 + (k === 0 ? 14 : 0), zz = z + (pr() - 0.5) * 3.4;
            const xo = A.halfBreadth(zz, y) + 2.7;
            const reach = 7 + (y - 10) * (0.55 + pr() * 0.5);
            culm(s * (xo + reach), -0.5, zz + (pr() - 0.5) * 6, s * (xo - 0.2), y, zz, 0.38 + pr() * 0.2);
          }
        }
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- small makers for props
    const UPV = V3(0, 1, 0);
    // a turned shape: prof = [[radius, height], ...] from the bottom up
    const lathe = (acc, x, y, z, prof, sides, col) => {
      const P = prof.map((p) => V3(x, y + p[1], z));
      T.bar(acc, P, 1, sides, col, { taper: (i) => Math.max(prof[i][0], 0.01), up: V3(1, 0, 0.01) });
    };
    // a ring of rope or rattan round `c`, in the plane whose normal is n
    const ring = (acc, c, R, r, n, col, sides = 6, seg = 14, wob = 0) => {
      const a = V3(n.z + 0.01, 0.02, -n.x).normalize(), b = new THREE.Vector3().crossVectors(n, a).normalize(), P = [];
      for (let i = 0; i <= seg; i++) { const t = i / seg * Math.PI * 2, rr = R * (1 + wob * Math.sin(t * 3)); P.push(c.clone().addScaledVector(a, Math.cos(t) * rr).addScaledVector(b, Math.sin(t) * rr)); }
      T.bar(acc, P, r, sides, col, { caps: false, up: n });
    };
    // staging boards: weathered and trodden by day (greyer and a step darker than the hull's new timber)
    const plankC = (k) => (dayPale ? shade(T.mixC(T.mixC(newC, paleC, 0.3 + 0.5 * k), HC.ash, 0.62), 0.58) : T.mixC(newC, paleC, 0.3 + 0.5 * k));
    // an adze: a crooked handle and a pale-edged iron blade; p = foot of the handle, q = its head
    const adze = (acc, p, q) => {
      const d = q.clone().sub(p), m = p.clone().addScaledVector(d, 0.55).add(V3(0.15, 0.2, 0.1));
      T.bar(acc, [p, m, q], 0.2, 6, shade(newC, 0.7));
      const side = V3(-d.z, 0, d.x).normalize();
      T.beam(acc, q.clone().addScaledVector(side, -0.2), q.clone().addScaledVector(side, 1.5).add(V3(0, -0.5, 0)), 0.42, 0.09, 0.03, [0.1, 0.1, 0.11], d.clone().normalize());
    };
    const mallet = (acc, p, yaw) => {
      const dx = Math.cos(yaw), dz = Math.sin(yaw);
      T.bar(acc, [p.clone(), p.clone().add(V3(dx * 2.6, 0.5, dz * 2.6))], 0.16, 6, shade(newC, 0.75));
      T.bar(acc, [p.clone().add(V3(dx * 2.6 - dz * 0.8, 0.5, dz * 2.6 + dx * 0.8)), p.clone().add(V3(dx * 2.6 + dz * 0.8, 0.5, dz * 2.6 - dx * 0.8))], 0.5, 8, shade(ironC, 1.5));
    };
    // a basket of pegs: woven wall, dark inside, pegs standing out of it
    const basket = (acc, x, y, z, R, hgt, pr) => {
      lathe(acc, x, y, z, [[R * 0.7, 0], [R * 0.95, hgt * 0.5], [R, hgt], [R * 0.85, hgt], [R * 0.6, hgt * 0.35]], 10, (i, j, cc) => { const k = (i === 3 || i === 4 ? 0.3 : 0.8) * (0.8 + 0.4 * ((i + j) & 1)); cc[0] = HC.rattan[0] * k; cc[1] = HC.rattan[1] * k; cc[2] = HC.rattan[2] * k; return cc; });
      ring(acc, V3(x, y + hgt, z), R, 0.12, UPV, shade(HC.rattan, 1.1));
      for (let k = 0; k < 7; k++) { const a = pr() * 6.28, r = pr() * R * 0.6; T.bar(acc, [V3(x + Math.cos(a) * r, y + hgt * 0.4, z + Math.sin(a) * r), V3(x + Math.cos(a) * r * 1.5, y + hgt + 0.5 + pr() * 0.9, z + Math.sin(a) * r * 1.5)], 0.14, 5, shade(HC.peg, 0.8 + pr() * 0.4)); }
    };
    // dark blob on a deck or the sand under a thing (drawn as a thin dark disc of timber)
    const blob = (acc, x, y, z, R) => lathe(acc, x, y + 0.09, z, [[R, 0], [R * 0.9, 0.03], [0.01, 0.035]], 10, [0.02, 0.015, 0.01]);

    // ---------------------------------------------------------------- staging: plank walks at two heights outside the ribs
    {
      const sr = rng.fork('staging');
      for (const s of [-1, 1]) {
        for (const y of [26, 47]) {
          for (let i = 0; i < 35; i++) {
            const z0 = -60 - 9.4 * i, z1 = z0 - 9.4;
            const x0 = A.halfBreadth(z0, y) + 2.7 + 3.4, x1 = A.halfBreadth(z1, y) + 2.7 + 3.4;
            for (let k = 0; k < 2; k++) {
              const off = (k - 0.5) * 2.3, dy = (sr() - 0.5) * 0.2, za = z0 + 0.6 - sr(), zb = z1 - 0.6 + sr(), pc = plankC(sr());
              // (the lower walk's boards are lifted on the port side abreast of the berth: the plank is seen against open frames)
              if (!(s < 0 && y < 40 && i >= 31)) T.beam(timber, V3(s * (x0 + off), y + dy, za), V3(s * (x1 + off), y + dy, zb), 1.08, 0.22, 0.07, pc, UPV);
            }
            // frame: two poles and a ledger under each joint, a brace now and then
            culm(s * (x0 - 2.6), -0.5, z0, s * (x0 - 2.4), y + (y > 40 ? 7 : -0.2), z0, 0.36);
            culm(s * (x0 + 3.2), -0.5, z0 + 0.4, s * (x0 + 2.8), y + (y > 40 ? 6 : -0.2), z0 + 0.4, 0.36);
            culm(s * (x0 - 3.6), y - 0.6, z0 + 0.2, s * (x0 + 4), y - 0.6, z0 + 0.2, 0.3);
            if (i % 3 === 0 && y < 40) culm(s * (x0 + 3), 2, z0, s * (x1 + 3), y - 1, z1, 0.28);
            if (y > 40) culm(s * (x0 + 2.9), y + 5, z0, s * (x1 + 2.9), y + 5, z1, 0.25);
          }
        }
        await ctx.yield();
      }
      // washing on the upper rails: sarongs in the colours of the coast, each a few metres of saturated cloth
      {
        const dyes = [['red', 'saffron'], ['indigo', 'white'], ['saffron', 'magenta'], ['turq', 'white'], ['magenta', 'saffron'], ['cobalt', 'saffron'], ['green', 'saffron']];
        let dk = 0;
        for (const [s, zs] of [[1, [-70, -78, -104, -112, -121, -187, -196, -204, -238, -247]], [-1, [-96, -105, -150, -159, -168, -226, -235]]]) for (const z of zs) {
          const xa = s * (A.halfBreadth(z, 47) + 2.7 + 3.4 + 2.95), xb = s * (A.halfBreadth(z - 5.6, 47) + 2.7 + 3.4 + 2.95), dy = dyes[dk++ % dyes.length];
          sarong(V3(xa, 52.1, z), V3(xb, 52.1, z - 5.6), 5.2 + sr() * 1.6, DYE[dy[0]], DYE[dy[1]], 0.85 + 0.3 * sr());
        }
      }
      // a line of washing from the tower's forward corner to a starboard rib, 10 m above the eye's line: the one run of
      // colour in the nave's air, to the right as the eye leaves the tower (clear of the plank's slings, which pass to port of it)
      {
        const a = V3(20, 42.4, -174.4), zb = -216, b = V3(A.halfBreadth(zb, 42) - 0.9, 42, zb), d = b.clone().sub(a);
        const sag = (t) => -1.0 * 4 * t * (1 - t), on = (t) => a.clone().addScaledVector(d, t).add(V3(0, sag(t), 0));
        T.bar(timber, [a, on(0.25), on(0.5), on(0.75), b], 0.09, 4, shade(HC.rope, 1.3));
        const dy = [['red', 'saffron'], ['white', 'indigo'], ['saffron', 'red'], ['indigo', 'white'], ['magenta', 'saffron'], ['white', 'red']];
        for (let k = 0; k < 6; k++) sarong(on((k + 0.12) / 6), on((k + 0.9) / 6), 7.2 + 1.5 * ((k * 5) % 3) / 2, DYE[dy[k][0]], DYE[dy[k][1]], 1.4);
        // and a long string of pennants from high on the same leg down to a rib forward: it comes down across the upper
        // right of the view as the eye leaves the tower (all of it to starboard of the eye's line and of the slings)
        pennants(V3(20.3, 55, -175), V3(A.halfBreadth(-240, 39) - 0.7, 39, -240), 16, 3.6);
      }
      // a low stage inside the starboard ribs forward of amidships, where the hens have taken over: the eye passes 4 m
      // inboard of it and 4 m above its deck (u 0.61-0.69). Legs to the floor timbers, a ladder at its after end.
      {
        const fr = ctx.core.makeRng('hif-fstage:' + ctx.seed), X0 = 13.6, X1 = 19.6, Z0 = -267.6, Z1 = -284.6, DY = 28;
        const cF = (x0, y0, z0, x1, y1, z1, r, tone) => { const a = bcol[tone], k = 0.8 + 0.4 * fr(); culms.push(x0, y0, z0, x1, y1, z1, r, a[0] * k, a[1] * k, a[2] * k); };
        for (let j = 0; j < 3; j++) {
          const z = lerp(Z0 - 0.5, Z1 + 0.5, j / 2);
          cF(X0 + 0.2, 7.6, z + 0.3, X0 + 0.1, DY - 0.2, z, 0.34, j & 1); cF(X1 + 0.4, 9.0, z - 0.3, X1 - 0.1, DY + 4.6, z, 0.34, 1 - (j & 1));
          cF(X0 - 0.9, DY - 0.6, z + 0.25, X1 + 0.9, DY - 0.6, z + 0.25, 0.3, 0);
          lash(X0 + 0.1, DY - 0.7, z, 0.5, 1.1); lash(X1 - 0.1, DY - 0.7, z, 0.5, 1.1); lash(X1 - 0.1, DY + 3.6, z, 0.46, 0.9);
        }
        cF(X1 - 0.1, DY + 3.6, Z0 + 0.6, X1 - 0.1, DY + 3.6, Z1 - 0.6, 0.24, 1);                                     // the outboard rail
        cF(X0 + 0.2, 9, Z0 - 0.4, X0 + 0.1, DY - 1, (Z0 + Z1) / 2, 0.26, 2); cF(X1 + 0.3, 10, Z1 + 0.4, X1, DY - 1, (Z0 + Z1) / 2, 0.26, 2);   // braces
        for (let k = 0; k < 5; k++) for (let h = 0; h < 2; h++) {
          const x = X0 + 0.62 + k * 1.19, za = lerp(Z0, Z1, h / 2) + 0.3 * fr(), zb = lerp(Z0, Z1, (h + 1) / 2) - 0.3 * fr();
          T.beam(timber, V3(x, DY + (fr() - 0.5) * 0.12, za), V3(x + (fr() - 0.5) * 0.2, DY + (fr() - 0.5) * 0.12, zb), 1.08, 0.22, 0.07, plankC(fr()), UPV);
        }
        // the ladder
        for (const dx of [-0.7, 0.7]) cF(16.4 + dx, 7.8, Z0 + 5.6, 16.4 + dx, DY + 1.6, Z0 + 0.2, 0.2, 0);
        for (let k = 0; k < 9; k++) { const t = (k + 0.7) / 10; culms.push(15.5, lerp(7.8, DY + 1.6, t), lerp(Z0 + 5.6, Z0 + 0.2, t) - 0.2, 17.3, lerp(7.8, DY + 1.6, t), lerp(Z0 + 5.6, Z0 + 0.2, t) - 0.2, 0.13, bcol[1][0], bcol[1][1], bcol[1][2]); }
        // what the builders left on it
        basket(timber, X1 - 1.3, DY + 0.11, Z0 - 2.2, 1.25, 1.7, fr); basket(timber, X0 + 1.4, DY + 0.11, Z1 + 1.6, 1.05, 1.4, fr);
        ring(timber, V3(X1 - 1.5, DY + 0.45, Z1 + 3.4), 1.3, 0.28, UPV, shade(HC.rattan, 0.95), 6, 14, 0.05); ring(timber, V3(X1 - 1.3, DY + 0.95, Z1 + 3.2), 1.2, 0.28, UPV, shade(HC.rattan, 1.1), 6, 14, 0.05);
        lathe(timber, X1 - 1.2, DY + 0.11, (Z0 + Z1) / 2 - 1, [[0.5, 0], [1.0, 0.6], [1.15, 1.5], [0.7, 2.3], [0.45, 2.6], [0.6, 2.9]], 10, shade(HC.rattan, 0.55));
        adze(timber, V3(X0 + 2.4, DY + 0.25, Z0 - 6.5), V3(X0 + 3.4, DY + 0.5, Z0 - 9.4)); mallet(timber, V3(X0 + 0.9, DY + 0.3, Z0 - 11.5), 0.9);
        sarong(V3(X1 - 0.05, DY + 3.6, Z0 - 2.6), V3(X1 - 0.05, DY + 3.6, Z0 - 7.2), 3.0, DYE.red, DYE.saffron, 1.3);
        sarong(V3(X1 - 0.05, DY + 3.6, Z0 - 10.4), V3(X1 - 0.05, DY + 3.6, Z0 - 14.6), 2.7, DYE.white, DYE.indigo, 1.25);
      }
      // the forward end of the port lower walk, by the berth: a basket, coils and a water jar, so it is not a bare pale end
      { const z = -384.5, x = -(A.halfBreadth(z, 26) + 2.7 + 3.4); basket(timber, x + 0.4, 26.22, z, 1.3, 1.8, sr); ring(timber, V3(x - 0.5, 26.6, z + 3.4), 1.3, 0.28, UPV, shade(HC.rattan, 0.95), 6, 14, 0.05); ring(timber, V3(x - 0.3, 27.1, z + 3.2), 1.2, 0.28, UPV, shade(HC.rattan, 1.1), 6, 14, 0.05); mallet(timber, V3(x + 0.6, 26.7, z - 2.6), 2.2); }
      // things left on the walks: baskets and coils where the eye passes
      for (const [s, y, i] of [[1, 26, 6], [1, 26, 17], [-1, 26, 11], [-1, 26, 24], [1, 26, 27], [-1, 26, 3]]) {
        const z = -60 - 9.4 * i - 4, x = s * (A.halfBreadth(z, y) + 2.7 + 3.4);
        basket(timber, x, y + 0.22, z, 1.5, 2.0, sr);
        ring(timber, V3(x + 0.5, y + 0.6, z - 4.5), 1.5, 0.3, UPV, shade(HC.rattan, 0.9), 6, 14, 0.05);
        ring(timber, V3(x + 0.3, y + 1.1, z - 4.3), 1.4, 0.3, UPV, shade(HC.rattan, 1.1), 6, 14, 0.05);
      }
    }

    // ---------------------------------------------------------------- the staging tower at the close pass
    // (the builders rest on its upper walk, 28.5 m up, level with the eye at the close pass: rail at 34.2. Its legs
    // stand on above that to a lookout deck and a head frame under the thatch, hung with washing and a tarpaulin)
    const TW = { x0: 20, x1: 28, z0: -142, z1: -174, deck: 28.5, low: 14, top: 72.5, rail: 34.2, hiRail: 78.2, head: 80.5 };
    const steamAt = [];                           // kettle spout and the four glasses
    {
      const tr = rng.fork('tower');
      for (const x of [TW.x0, TW.x1]) for (const z of [TW.z0, -158, TW.z1]) { culm3(x, -1, z, x, TW.head, z, 0.55); for (const y of [TW.low - 0.55, TW.deck - 0.55, 44, 58, TW.top - 0.55, TW.rail, TW.hiRail, TW.head - 1.5]) lash(x, y, z, 1.22); }
      for (const y of [TW.low, TW.deck, TW.top]) {
        for (let k = 0; k < 5; k++) {
          const x = TW.x0 - 0.6 + (k + 0.5) * 1.84, dy = (tr() - 0.5) * 0.12;
          T.beam(timber, V3(x, y + dy, TW.z0 + 1.5 + tr()), V3(x + (tr() - 0.5) * 0.2, y + dy, TW.z1 - 1.5 - tr()), 0.86, 0.2, 0.06, plankC(tr()), UPV);
        }
        for (const z of [TW.z0, -150, -158, -166, TW.z1]) culm(TW.x0 - 1.5, y - 0.55, z, TW.x1 + 1.5, y - 0.55, z, 0.34);
        for (const x of [TW.x0, TW.x1]) culm(x, y - 1.1, TW.z0 + 1.5, x, y - 1.1, TW.z1 - 1.5, 0.34);
      }
      // braces, rails, a ladder pole
      culm(TW.x1, 1, TW.z0, TW.x1, TW.low - 1, TW.z1, 0.3); culm(TW.x1, TW.low + 1, TW.z1, TW.x1, TW.deck - 1, TW.z0, 0.3);
      culm(TW.x0, 1, TW.z1, TW.x1, TW.low - 1, TW.z1, 0.3); culm(TW.x0, TW.low + 1, TW.z0, TW.x1, TW.deck - 1, TW.z0, 0.3);
      for (const ry of [TW.rail, TW.hiRail]) {
        culm(TW.x1, ry, TW.z0 + 1, TW.x1, ry, TW.z1 - 1, 0.3); culm(TW.x0 - 1, ry, TW.z0, TW.x1 + 1, ry, TW.z0, 0.32);
        culm(TW.x0 - 1, ry, TW.z1, TW.x1 + 1, ry, TW.z1, 0.3);
      }
      // the inboard rail of the first bay: the rooster's perch
      culm(TW.x0, TW.rail, TW.z0 + 0.6, TW.x0, TW.rail, TW.z1 - 0.6, 0.3); culm(TW.x0 - 1.2, 44, TW.z0, TW.x1 + 1.2, 44, TW.z0, 0.3); culm(TW.x0 - 1.2, 44, TW.z1, TW.x1 + 1.2, 44, TW.z1, 0.3);
      culm(TW.x1 + 3.5, -0.5, TW.z0 - 5, TW.x1 + 0.4, TW.deck + 3, TW.z0 - 1.2, 0.3); culm(TW.x0 - 1.1, 44.4, TW.z0 + 1, TW.x0 - 1.1, 44.4, TW.z1 - 1, 0.3);
      // the upper storeys: ledgers at 58, cross braces, a ladder pole, the head frame the tarpaulin and the lines are tied to
      for (const z of [TW.z0, -158, TW.z1]) culm(TW.x0 - 1.2, 58, z, TW.x1 + 1.2, 58, z, 0.3);
      for (const x of [TW.x0, TW.x1]) { culm(x, 58, TW.z0 + 1, x, 58, TW.z1 - 1, 0.3); culm(x, 30, TW.z0, x, 57, -158, 0.3); culm(x, 30, TW.z1, x, 57, -158, 0.3); culm(x, 59, -158, x, TW.top - 1.5, TW.z0, 0.3); culm(x, 59, -158, x, TW.top - 1.5, TW.z1, 0.3); }
      culm(TW.x0, 45, TW.z0, TW.x1, TW.top - 1.5, TW.z0, 0.3); culm(TW.x1, 45, TW.z1, TW.x0, TW.top - 1.5, TW.z1, 0.3);
      culm(TW.x0 - 1.4, TW.deck, TW.z0 + 4, TW.x0 - 1.0, TW.top + 3.5, TW.z0 + 11, 0.3);
      for (const z of [TW.z0, -158, TW.z1]) culm(TW.x0 - 1.2, TW.head - 1.5, z, TW.x1 + 1.2, TW.head - 1.5, z, 0.3);
      for (const x of [TW.x0, TW.x1]) culm(x, TW.head - 1.2, TW.z0 + 1.2, x, TW.head - 1.2, TW.z1 - 1.2, 0.3);
      // a blue tarpaulin over the after half of the top deck, sagging between its lashings, and washing on a line behind the rest
      {
        const y0 = TW.head - 1.9, xa = TW.x0 - 1.6, xb = TW.x1 + 1.6, za = TW.z0 + 1.2, zb = -157.2;
        sheet(6, 6, (u, v, o) => o.set(lerp(xa, xb, u), y0 - 1.5 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI) - 0.5 * v, lerp(za, zb, v)),
          (iu, iv) => shade(DYE.cobalt, (0.9 + 0.14 * ((iu * 5 + iv * 3) % 4) / 3) * (iu === 0 || iu === 5 || iv === 0 || iv === 5 ? 0.8 : 1)), V3(0, 1, 0), (u, v) => 0.5 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI));
        let zq = -159.4;
        for (const [a, b] of [['red', 'saffron'], ['saffron', 'indigo'], ['magenta', 'white']]) { const w = 3.9 + tr() * 0.8; sarong(V3(TW.x0 - 0.7, TW.head - 1.7, zq), V3(TW.x0 - 0.7, TW.head - 1.7, zq - w), 5.6 + tr() * 1.2, DYE[a], DYE[b]); zq -= w + 0.5; }
        pennants(V3(TW.x1 + 1.2, TW.head - 1.3, TW.z1), V3(38.5, 66, TW.z1 - 26), 8);
      }
      const D = TW.deck + 0.2;
      // a cobalt enamel kettle on a clay stove, four glasses of tea on a tray, the tools: all about the middle frame and
      // in the forward bay, 10 to 20 m ahead and to starboard of the eye while it looks at the tower (the after bay
      // holds the stack of planks, so the walk fills the view from the rooster on its rail to the far baskets)
      const kx = 23.0, kz = -160.6;
      lathe(timber, kx, D, kz, [[0.9, 0], [1.1, 0.5], [1.0, 1.0], [0.75, 1.1]], 10, [0.34, 0.16, 0.09]);
      lathe(timber, kx, D + 1.1, kz, [[0.6, 0], [1.0, 0.35], [1.05, 0.9], [0.7, 1.35], [0.35, 1.45], [0.3, 1.6], [0.01, 1.62]], 10, (i, j, cc) => { const k = (i > 4 ? 0.5 : 0.85) + 0.5 * (j === 2 || j === 3 ? 1 : 0), w = i === 4 ? 1 : 0; cc[0] = lerp(0.02, 0.8, w) * k; cc[1] = lerp(0.13, 0.78, w) * k; cc[2] = lerp(0.62, 0.72, w) * k; return cc; });
      T.bar(timber, [V3(kx - 0.9, D + 1.7, kz), V3(kx - 1.5, D + 2.2, kz), V3(kx - 1.8, D + 2.75, kz)], 0.14, 6, [0.02, 0.12, 0.56]);
      ring(timber, V3(kx, D + 2.75, kz), 0.75, 0.07, V3(1, 0, 0), [0.08, 0.08, 0.09], 5, 10);
      steamAt.push([kx - 1.8, D + 2.8, kz, 1]);
      T.beam(timber, V3(22.6, D + 0.12, -163.6), V3(22.6, D + 0.12, -166.8), 1.3, 0.1, 0.04, shade(newC, 0.8), UPV);
      for (let k = 0; k < 4; k++) {
        const gx = 22.1 + (k & 1) * 1.0, gz = -164.4 - (k >> 1) * 1.5;
        lathe(timber, gx, D + 0.22, gz, [[0.26, 0], [0.3, 0.08], [0.36, 0.95], [0.3, 0.95], [0.26, 0.7]], 8, (i, j, cc) => { const tea = i < 3 ? 1 : 0.4; cc[0] = 0.78 * tea; cc[1] = 0.4 * tea; cc[2] = 0.1 * tea; return cc; });
        steamAt.push([gx, D + 1.25, gz, 0.5]);
      }
      // baskets of pegs, rattan, mallets, adzes against the rail, a bow drill
      basket(timber, 26, D, -157.2, 1.5, 2.0, tr); basket(timber, 25.6, D, -168.0, 1.25, 1.7, tr);
      blob(timber, 26, D, -157.2, 2.0); blob(timber, 25.6, D, -168.0, 1.7); blob(timber, kx, D, kz, 1.6);
      for (let k = 0; k < 3; k++) ring(timber, V3(25.4, D + 0.3 + k * 0.5, -161.6), 1.35 - k * 0.08, 0.26, UPV, shade(HC.rattan, 0.85 + 0.15 * k), 6, 14, 0.06);
      mallet(timber, V3(21.2, D + 0.45, -143.7), 0.5); mallet(timber, V3(21.6, D + 0.45, -169.0), -1.2);
      adze(timber, V3(27.2, D, -162.9), V3(28.0, TW.rail + 0.2, -163.3)); adze(timber, V3(27.0, D, -165.6), V3(28.0, TW.rail + 0.2, -165.2)); adze(timber, V3(24.3, D + 0.2, -164.6), V3(25.7, D + 0.5, -167.2));
      // (two more stand against the inboard rail beside the rooster, their pale edges toward the eye)
      adze(timber, V3(20.9, D, -165.4), V3(20.1, TW.rail + 0.2, -165.8)); adze(timber, V3(21.0, D, -170.6), V3(20.1, TW.rail + 0.2, -170.2));
      // bow drill: a bow, its cord and the spindle
      T.bar(timber, [V3(27.4, D, -158.9), V3(27.9, D + 2.6, -159.2), V3(28.0, D + 5.4, -158.9)], 0.13, 5, shade(newC, 0.8));
      T.bar(timber, [V3(27.4, D, -158.9), V3(28.0, D + 5.4, -158.9)], 0.05, 4, shade(HC.rope, 1.3));
      T.bar(timber, [V3(27.3, D, -160.3), V3(27.9, D + 4.2, -160.6)], 0.16, 6, shade(ironC, 1.4));
      // the after bay: a stack of short planks, two more baskets and a coil, so no bay of the walk is bare
      for (let k = 0; k < 4; k++) T.beam(timber, V3(23.4 + (k & 1) * 0.3, D + 0.22 + k * 0.4, -145.2 - (k & 1) * 0.5), V3(23.2, D + 0.22 + k * 0.4, -153.6 + (k & 1) * 0.6), 0.95, 0.19, 0.06, plankC(0.2 + 0.2 * k), UPV, { capTone: 1.2 });
      basket(timber, 26.2, D, -147.0, 1.35, 1.8, tr); basket(timber, 26.0, D, -153.6, 1.2, 1.6, tr); blob(timber, 26.2, D, -147.0, 1.9); blob(timber, 26.0, D, -153.6, 1.7);
      ring(timber, V3(26.2, D + 0.35, -150.4), 1.4, 0.28, UPV, shade(HC.rattan, 0.95), 6, 14, 0.05); ring(timber, V3(26.3, D + 0.85, -150.2), 1.3, 0.28, UPV, shade(HC.rattan, 1.1), 6, 14, 0.05);
      // coils of rattan hanging on the legs
      ring(timber, V3(TW.x1 + 0.9, 37, TW.z1), 2.0, 0.28, V3(1, 0, 0.1).normalize(), shade(HC.rattan, 1.0), 6, 16, 0.04);
      ring(timber, V3(TW.x1 + 1.2, 36.6, -158), 1.8, 0.28, V3(1, 0, -0.1).normalize(), shade(HC.rattan, 0.8), 6, 16, 0.04);
      // (and on the two inboard legs the eye passes last, at its own height: no leg of the tower is a plain pole)
      ring(timber, V3(TW.x0 - 0.9, 31.4, -158), 1.6, 0.28, V3(1, 0, 0.12).normalize(), shade(HC.rattan, 1.05), 6, 16, 0.04);
      ring(timber, V3(TW.x0 - 0.95, 36.2, TW.z1), 2.1, 0.3, V3(1, 0, -0.1).normalize(), shade(HC.rattan, 0.95), 6, 16, 0.04);
      ring(timber, V3(TW.x0 - 1.0, 35.2, TW.z1 + 0.3), 1.7, 0.28, V3(1, 0, 0.14).normalize(), shade(HC.rattan, 1.15), 6, 16, 0.04);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the entry: trough on its embers, logs, sawpit, canoes, jars
    const TR = { x: 6, z0: 74, z1: 30, y: 4.6, r: 2.3 };
    let saw = null, coils = null, embers = null;
    {
      const er = rng.fork('entry'), cc = [0, 0, 0];
      // the trough: a hollowed trunk on stone cradles; wet palm mats laid over it, lifted at the gaps where the steam leaks
      const P = []; for (let i = 0; i <= 11; i++) P.push(V3(TR.x + Math.sin(i * 0.9) * 0.25, TR.y + Math.sin(i * 1.7) * 0.15, TR.z0 - (TR.z0 - TR.z1) * i / 11));
      T.bar(timber, P, 1, 10, (i, j) => { const k = (0.5 + 0.35 * ((i * 5 + j * 3) % 4) / 4) * (j > 5 ? 0.45 : 1); cc[0] = ironC[0] * 1.5 * k + 0.02; cc[1] = ironC[1] * 1.3 * k; cc[2] = ironC[2] * 1.2 * k; return cc; }, { taper: (i) => TR.r * (1 + 0.08 * Math.sin(i * 2.3)) });
      for (let i = 0; i < 6; i++) {
        const z = TR.z0 - 3 - i * 7.6, wet = shade(lin(pal[4], 0.5), 0.6 + 0.5 * er());
        const M = []; for (let k = 0; k <= 6; k++) { const a = -1.25 + 2.5 * k / 6; M.push(V3(TR.x + Math.sin(a) * (TR.r + 0.25), TR.y + Math.cos(a) * (TR.r + 0.25) + (k === 3 ? 0.2 : 0), z)); }
        const fr = T.framesFrom(M, V3(0, 0, 1));
        T.sweep(timber, M, fr.A, fr.B, T.profRect(0.1, 2.9 + er() * 0.6, 0.04), { col: wet });
      }
      for (let i = 0; i < 5; i++) { const z = TR.z0 - 4 - i * 9; for (const s of [-1, 1]) lathe(timber, TR.x + s * 2.6, 0, z, [[1.5, -0.3], [1.7, 0.6], [1.3, 1.9], [0.6, 2.4], [0.01, 2.45]], 7, shade(lin(pal[2], 0.55), 0.7 + 0.5 * er())); }
      // charred billets in the fire bed
      for (let i = 0; i < 16; i++) { const z = TR.z0 - 1 - er() * 42, x = TR.x + (er() - 0.5) * 5, a = er() * 3.1; T.bar(timber, [V3(x - Math.cos(a) * 2.2, 0.35, z - Math.sin(a) * 2.2), V3(x + Math.cos(a) * 2.2, 0.6, z + Math.sin(a) * 2.2)], 0.4, 6, [0.035, 0.028, 0.025]); }
      await ctx.yield();
      // log pile to starboard: three layers; the goats stand on the top one
      const LP = { x: 28, z: 32, len: 34 };
      let li = 0;
      for (const [n, y, r] of [[6, 1.9, 1.9], [5, 5.2, 1.9], [4, 8.5, 1.9]]) {
        for (let k = 0; k < n; k++) {
          const x = LP.x + (k - (n - 1) / 2) * 3.75, zo = (er() - 0.5) * 5, rr = r * (0.92 + er() * 0.16), tone = 0.75 + 0.5 * er(), pale = er() < 0.15;
          const Q = [V3(x, y, LP.z + LP.len / 2 + zo), V3(x + (er() - 0.5) * 0.4, y, LP.z + zo), V3(x, y, LP.z - LP.len / 2 + zo)];
          T.bar(timber, Q, 1, 10, (i, j) => { const k2 = tone * (0.8 + 0.3 * ((j * 3 + li) % 4) / 4); const b = pale ? newC : trunkC; cc[0] = b[0] * k2; cc[1] = b[1] * k2; cc[2] = b[2] * k2; return cc; }, { taper: (i) => rr * (1 - 0.06 * i) });
          li++;
        }
      }
      for (const z of [LP.z + 9, LP.z - 9]) T.beam(timber, V3(LP.x - 13, 0.2, z), V3(LP.x + 13, 0.2, z), 0.5, 0.5, 0.1, shade(trunkC, 0.6), UPV);
      // sawing trestle to port: a log on two frames, the two-handed saw standing in the cut
      const SX = -17, SZ = 50;
      T.bar(timber, [V3(SX, 9.2, SZ + 15), V3(SX, 9.2, SZ - 15)], 1.7, 10, (i, j) => { const k = 0.8 + 0.25 * (j % 3) / 3; cc[0] = newC[0] * k; cc[1] = newC[1] * k; cc[2] = newC[2] * k; return cc; });
      for (const z of [SZ + 10, SZ - 10]) {
        culm(SX - 5, -0.5, z, SX - 1.2, 8, z, 0.45); culm(SX + 5, -0.5, z, SX + 1.2, 8, z, 0.45);
        T.beam(timber, V3(SX - 3.4, 7.3, z), V3(SX + 3.4, 7.3, z), 0.45, 0.45, 0.1, shade(trunkC, 0.9), UPV);
      }
      lathe(timber, SX, 0.04, SZ, [[7, 0], [6.4, 0.05], [0.01, 0.06]], 12, shade(newC, 1.0));      // a drift of sawdust under the cut
      const sa = T.makeAcc();
      T.beam(sa, V3(0, -7.5, 0), V3(0, 6.5, 0), 0.07, 0.75, 0.02, [0.2, 0.2, 0.21], V3(0, 0, 1));
      for (const y of [-7.9, 6.9]) T.bar(sa, [V3(-1.3, y, 0), V3(1.3, y, 0)], 0.2, 6, shade(newC, 0.8));
      saw = new THREE.Mesh(T.accGeometry(sa), wood); saw.name = 'saw'; saw.position.set(SX, 9.2, SZ + 3); scene.add(saw);
      // two dugout canoes on the sand to port, one on billets
      const canoe = (cx, cz, yaw, len, y0, tone) => {
        const N = 12, PP = [], hull = [];
        const ca = Math.cos(yaw), sn = Math.sin(yaw);
        for (let i = 0; i <= N; i++) { const t = i / N - 0.5; PP.push(V3(cx + sn * t * len, y0 + 1.5 + 2.2 * Math.pow(Math.abs(t * 2), 3), cz + ca * t * len)); }
        for (let k = 0; k <= 8; k++) { const a = Math.PI * (1 + k / 8); hull.push({ a: Math.cos(a) * 1.6, b: Math.sin(a) * 1.5, na: Math.cos(a), nb: Math.sin(a), v: k * 0.5 }); }
        for (let k = 0; k <= 8; k++) { const a = Math.PI * (2 - k / 8); hull.push({ a: Math.cos(a) * 1.3, b: Math.sin(a) * 1.2 + 0.05, na: -Math.cos(a), nb: -Math.sin(a), v: 5 + k * 0.5 }); }
        hull.push({ ...hull[0], v: 10 }); hull.pairs = false;
        const fr = T.framesFrom(PP, UPV);
        T.sweep(timber, PP, fr.A, fr.B, hull, { col: (i, j) => { const k = tone * (j > 8 && j < 18 ? 0.45 : 0.9) * (0.85 + 0.3 * ((i + j) % 3) / 3); cc[0] = trunkC[0] * k * 1.2; cc[1] = trunkC[1] * k * 1.1; cc[2] = trunkC[2] * k; return cc; },
          sa: (i) => 0.25 + 0.75 * Math.sin(Math.PI * (0.06 + 0.88 * i / N)), sb: (i) => 0.45 + 0.55 * Math.sin(Math.PI * (0.06 + 0.88 * i / N)) });
        blob(timber, cx, 0, cz, 4.5);
      };
      canoe(-34, 26, 0.35, 34, 0.1, 1.0); canoe(-45, 60, -0.2, 30, 1.2, 0.8);
      for (const z of [52, 68]) T.bar(timber, [V3(-49, 0.7, z), V3(-41, 0.7, z + 1)], 0.7, 7, shade(trunkC, 0.7));
      // water jars
      for (const [x, z, s] of [[15, 47, 1], [17.5, 49.5, 0.8], [15.5, 52, 0.65], [-12, 18, 1], [-14.5, 20, 0.75], [33, -128, 0.9], [35.4, -126.5, 0.7], [-12, -402, 0.9], [18, -330, 0.8], [9.5, -470, 1], [12, -466.5, 0.7], [-27, -468, 0.9], [-24.5, -471, 0.65]]) {
        const tone = 0.7 + er() * 0.5;
        lathe(timber, x, 0, z, [[0.9 * s, 0], [1.9 * s, 1.4 * s], [2.1 * s, 2.6 * s], [1.5 * s, 3.9 * s], [0.8 * s, 4.5 * s], [1.05 * s, 4.9 * s], [0.75 * s, 4.9 * s], [0.6 * s, 4.2 * s]], 10,
          (i, j) => { const k = tone * (i > 5 ? 0.3 : 0.8 + 0.25 * (j % 2)); cc[0] = 0.42 * k; cc[1] = 0.2 * k; cc[2] = 0.11 * k; return cc; });
        blob(timber, x, 0, z, 2.6 * s);
      }
      // ember bed under the trough: its own glowing sheet
      const eg = new THREE.PlaneGeometry(10, 46, 1, 1).rotateX(-Math.PI / 2).translate(TR.x, 0.25, (TR.z0 + TR.z1) / 2);
      const em = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, uniforms: { ...fogU(), uTime: LU.uTime, uGain: { value: night ? 6.5 : rain ? 3.6 : 3.2 } },
        vertexShader: '#include <fog_pars_vertex>\nvarying vec3 vWp;\nvoid main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
        fragmentShader: `#include <fog_pars_fragment>\n${NOISE}\nuniform float uTime; uniform float uGain; varying vec3 vWp;
void main(){ vec2 p = vWp.xz; float edge = smoothstep(4.7, 1.6, abs(p.x - ${TR.x}.0)) * smoothstep(${TR.z0}.0 + 1.5, ${TR.z0}.0 - 2., p.y) * smoothstep(${TR.z1}.0 - 1.5, ${TR.z1}.0 + 2., p.y);
  float coal = sNoise(p * 1.3) * 0.6 + sNoise(p * 3.7 + 4.) * 0.4;
  float breath = 0.55 + 0.45 * sin(uTime * 1.3 + sNoise(p * 0.4) * 9.) * sin(uTime * 0.7 + p.y * 0.3);
  float hot = smoothstep(0.35, 0.8, coal) * (0.5 + 0.5 * breath);
  vec3 col = mix(vec3(0.03, 0.02, 0.02), vec3(1.0, 0.24, 0.03) * uGain, hot) + vec3(1.0, 0.7, 0.25) * uGain * smoothstep(0.8, 1., coal * breath);
  float al = smoothstep(4.9, 3.7, abs(p.x - ${TR.x}.0)) * smoothstep(${TR.z0}.0 + 2., ${TR.z0}.0 + 0.5, p.y) * smoothstep(${TR.z1}.0 - 2., ${TR.z1}.0 - 0.5, p.y);
  gl_FragColor = vec4(col * edge + vec3(0.02, 0.015, 0.012) * (1. - edge), al);
  #include <fog_fragment>
}` });
      embers = new THREE.Mesh(eg, em); embers.name = 'embers'; scene.add(embers);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- hung things that swing, bananas, creepers, plaits
    {
      const hr = rng.fork('hung');
      coils = new THREE.Group(); coils.name = 'hung'; scene.add(coils);
      const hang = (x, yTop, z, drop, what) => {
        const acc = T.makeAcc();
        T.bar(acc, [V3(0, 0, 0), V3(0, -drop + 3, 0)], 0.14, 5, shade(HC.rope, 1.2));
        if (what === 0) {
          for (let k = 0; k < 4; k++) ring(acc, V3((k - 1.5) * 0.45, -drop, (hr() - 0.5) * 0.4), 3.1 - 0.25 * hr(), 0.3, V3(1, 0, (hr() - 0.5) * 0.5).normalize(), shade(HC.rattan, 0.75 + 0.4 * hr()), 6, 18, 0.03);
          ring(acc, V3(0, -drop + 3, 0), 0.5, 0.16, V3(0, 0, 1), shade(HC.rope, 1.3), 5, 8);
          // more turns, wider and looser, so the bundle is a big thing to fly past; loose ends hang from it
          for (let k = 0; k < 6; k++) ring(acc, V3((k - 2.5) * 0.5, -drop - 0.5 + (k & 1) * 0.35, (k % 3 - 1) * 0.3), 3.75 + 0.22 * ((k * 3) % 4), 0.33, V3(1, 0, (k % 3 - 1) * 0.16).normalize(), shade(HC.rattan, 0.7 + 0.12 * ((k * 5) % 4)), 6, 20, 0.035);
          for (let k = 0; k < 3; k++) T.bar(acc, [V3((k - 1) * 0.7, -drop - 3.6, (k - 1) * 1.2), V3((k - 1) * 0.9, -drop - 5.5 - k, (k - 1) * 1.5 + 0.4), V3((k - 1) * 0.8 + 0.3, -drop - 7.6 - 1.4 * k, (k - 1) * 1.3)], 0.2, 5, shade(HC.rattan, 0.95));
        } else {
          // a carrying pole with a mallet, an adze and a basket slung from it
          T.bar(acc, [V3(-3.5, -drop + 3, 0), V3(3.5, -drop + 3, 0)], 0.22, 6, bcol[0]);
          basket(acc, -2.6, -drop - 0.5, 0, 1.2, 1.7, hr); T.bar(acc, [V3(-2.6, -drop + 3, 0), V3(-2.6, -drop + 1.2, 0)], 0.08, 4, shade(HC.rope, 1.2));
          adze(acc, V3(0.4, -drop - 1.6, 0), V3(0.2, -drop + 2.8, 0)); mallet(acc, V3(2.8, -drop + 2.8, 0), -1.5);
        }
        const m = new THREE.Mesh(T.accGeometry(acc), wood); m.position.set(x, yTop, z); coils.add(m);
      };
      // (both hang on long ropes from the roof, clear of the plank's way down into the bow)
      hang(-6, roofY(6) - 2, -218, roofY(6) - 2 - 37.5, 0);
      hang(-22, roofY(22) - 2, -262, roofY(22) - 2 - 38, 1);
      // a hand of green bananas under the tower's cross pole
      const bx = TW.x0 - 1.1, bz = -151;
      T.bar(timber, [V3(bx, 44, bz), V3(bx - 0.2, 40, bz), V3(bx, 35.5, bz)], 0.22, 6, [0.18, 0.22, 0.07]);
      for (let tier = 0; tier < 5; tier++) for (let k = 0; k < 8; k++) {
        const a = k / 8 * 6.283 + tier * 0.4, y = 40.3 - tier * 1.0, r0 = 0.35, r1 = 1.0 - tier * 0.06, g = 0.75 + 0.5 * hr();
        T.bar(timber, [V3(bx + Math.cos(a) * r0, y, bz + Math.sin(a) * r0), V3(bx + Math.cos(a) * r1, y - 0.35, bz + Math.sin(a) * r1), V3(bx + Math.cos(a) * r1 * 1.05, y + 0.75, bz + Math.sin(a) * r1 * 1.05)], 0.24, 5, [0.2 * g, 0.42 * g, 0.07 * g], { taper: (i) => (i === 1 ? 1.15 : 0.7) });
      }
      // creepers up two posts, and (the night before the feast) a plaited palm leaf on every tenth rib
      const lf = T.makeAcc();
      const leaf = (p, dirx, dirz, size, c) => {
        const b = lf.n, sx = -dirz, sz = dirx;
        lf.pos.push(p.x, p.y, p.z, p.x + (dirx * 0.5 + sx * 0.5) * size, p.y - 0.25 * size, p.z + (dirz * 0.5 + sz * 0.5) * size, p.x + dirx * size, p.y - 0.8 * size, p.z + dirz * size, p.x + (dirx * 0.5 - sx * 0.5) * size, p.y - 0.25 * size, p.z + (dirz * 0.5 - sz * 0.5) * size);
        for (let j = 0; j < 4; j++) { lf.nrm.push(dirx, 0.5, dirz); lf.col.push(c[0], c[1], c[2]); }
        lf.uv.push(0.5, 0, 1, 0.4, 0.5, 1, 0, 0.4); lf.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); lf.n += 4;
      };
      for (const [px, pz] of [[60, -230], [-60, -200], [60, 40]]) {
        const S = []; const turns = 3.2, top = 46 + hr() * 14;
        for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * turns * 6.283; S.push(V3(px + Math.cos(a) * 1.9, top * t, pz + Math.sin(a) * 1.9)); if (i % 1 === 0 && i > 2) { for (let k = 0; k < 3; k++) { const a2 = a + (hr() - 0.5) * 1.2, g = 0.6 + 0.7 * hr(); leaf(V3(px + Math.cos(a2) * 2.1, top * t + hr() * 1.2, pz + Math.sin(a2) * 2.1), Math.cos(a2), Math.sin(a2), 1.3 + hr() * 1.1, [0.1 * g, 0.3 * g, 0.05 * g]); } } }
        T.bar(timber, S, 0.16, 5, [0.1, 0.13, 0.05]);
      }
      if (night) {
        for (let i = 4; i < 60; i += 10) for (const s of [-1, 1]) {      // (none on the ribs of the berth, where the plank goes on)
          const p = A.ribAt(i, s, 40); p.x -= s * 0.35;
          for (let k = 0; k < 7; k++) leaf(V3(p.x, p.y - k * 0.75, p.z + (k & 1 ? 0.5 : -0.5)), -s, (k & 1 ? 0.4 : -0.4), 1.5, shade(HC.pale, 0.9 + 0.2 * (k & 1)));
        }
      }
      mesh(lf, leafMat(0.25, 0.3), 'leaves');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- finish the timber mesh and the bamboo instances
    // green coconuts: under the crowns of the beach palms, a heap by the water jars at the entry, a few on the tower
    {
      const nr = ctx.core.makeRng('hif-nuts:' + ctx.seed), cc = [0, 0, 0];
      const nut = (x, y, z, r) => { const g = 0.75 + 0.5 * nr(), hue = nr(); lathe(timber, x, y, z, [[0.3 * r, 0], [0.82 * r, 0.3 * r], [r, 0.95 * r], [0.8 * r, 1.6 * r], [0.3 * r, 1.95 * r], [0.01, 2 * r]], 7,
        (i, j) => { const k = g * (0.75 + 0.35 * i / 5) * (0.85 + 0.3 * (j % 2)); cc[0] = lerp(0.16, 0.42, hue * hue) * k; cc[1] = 0.46 * k; cc[2] = 0.07 * k; return cc; }); };
      for (const [x, y, z] of beachNuts) for (let k = 0; k < 6; k++) { const a = k * 1.047 + nr(); nut(x + Math.cos(a) * 1.3, y - 1.4 - nr() * 0.8, z + Math.sin(a) * 1.3, 0.85 + 0.2 * nr()); }
      for (let k = 0; k < 16; k++) { const lay = k < 9 ? 0 : k < 14 ? 1 : 2, a = k * 2.4, rr = (lay === 0 ? 2.6 : lay === 1 ? 1.5 : 0.5) * Math.sqrt(nr()); nut(19.5 + Math.cos(a) * rr, lay * 1.25, 42 + Math.sin(a) * rr, 0.8 + 0.2 * nr()); }
      blob(timber, 19.5, 0, 42, 3.6);
      for (let k = 0; k < 5; k++) nut(22.0 + (k % 2) * 1.4, TW.deck + 0.2, -154.8 - (k >> 1) * 1.5, 0.75);
    }
    {
      const cm = basicMat(clothFrag(GL), { uSunOut: { value: L.sunOut }, uBack: { value: 0.35 } }, { side: THREE.DoubleSide, stir: 0.55 });
      const cg = T.accGeometry(cloth); cg.boundingSphere = new THREE.Sphere(V3(0, 40, -190), 420);
      const cmesh = new THREE.Mesh(cg, cm); cmesh.name = 'cloth'; scene.add(cmesh);
    }
    mesh(timber, T.makeWood(LU, { scallop: 0.45 }), 'timber');          // a little of the adze on every sawn and grown thing
    await ctx.yield();
    {
      // unit culm along +Y: 8 sides, a slight swelling at each of the 11 nodes the lash shader bands
      const SIDES = 6, RINGS = 3, pos = [], nrm = [], uv = [], idx = [];
      for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SIDES; j++) {
        const a = j / SIDES * Math.PI * 2, t = i / RINGS, r = 1 - 0.18 * t;
        pos.push(Math.cos(a) * r, t, Math.sin(a) * r); nrm.push(Math.cos(a), 0, Math.sin(a)); uv.push(j / SIDES * 3, t * 2);
      }
      for (let i = 0; i < RINGS; i++) for (let j = 0; j < SIDES; j++) { const a = i * (SIDES + 1) + j, b = a + 1, c = a + SIDES + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const n = culms.length / 10, colA = new Float32Array(n * 3);
      const bmat = T.makeWood(LU, { scallop: 0, node: 1 });
      const im = new THREE.InstancedMesh(g, bmat, n); im.name = 'bamboo';
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), d = new THREE.Vector3(), p0 = new THREE.Vector3(), sc = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const o = i * 10;
        p0.set(culms[o], culms[o + 1], culms[o + 2]); d.set(culms[o + 3] - culms[o], culms[o + 4] - culms[o + 1], culms[o + 5] - culms[o + 2]);
        const len = Math.max(d.length(), 0.01); d.multiplyScalar(1 / len); q.setFromUnitVectors(UPV, d); sc.set(culms[o + 6], len, culms[o + 6]);
        m4.compose(p0, q, sc); im.setMatrixAt(i, m4);
        colA[i * 3] = culms[o + 7]; colA[i * 3 + 1] = culms[o + 8]; colA[i * 3 + 2] = culms[o + 9];
        if ((i & 255) === 255) await ctx.yield();
      }
      g.setAttribute('aCol', new THREE.InstancedBufferAttribute(colA, 3));
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- hens and the rooster
    let henMat = null;
    const roosterAt = V3(TW.x0, TW.rail + 0.3, -162.4);
    {
      const pos = [], nrm = [], col = [], uv = [], idx = []; let nv = 0;
      // an ellipsoid; part: 0 body, 1 head and neck, 2 wing, 3 tail; c = [feather mask, shade, comb]
      const ell = (cx, cy, cz, rx, ry, rz, part, c, tilt = 0) => {
        const S = 7, R = 5, ct = Math.cos(tilt), st = Math.sin(tilt);
        for (let i = 0; i <= R; i++) for (let j = 0; j <= S; j++) {
          const th = i / R * Math.PI, ph = j / S * Math.PI * 2;
          let x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
          let px = x * rx, py = y * ry, pz = z * rz, nx = x / rx, ny = y / ry, nz = z / rz;
          const py2 = py * ct - pz * st, pz2 = py * st + pz * ct, ny2 = ny * ct - nz * st, nz2 = ny * st + nz * ct;
          const l = Math.hypot(nx, ny2, nz2) || 1;
          pos.push(cx + px, cy + py2, cz + pz2); nrm.push(nx / l, ny2 / l, nz2 / l); col.push(c[0], c[1] * (0.8 + 0.2 * (y * 0.5 + 0.5)), c[2]); uv.push(part, 0);
        }
        for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) { const a = nv + i * (S + 1) + j, b = a + 1, c2 = a + S + 1, d = c2 + 1; idx.push(a, b, c2, b, d, c2); }
        nv += (R + 1) * (S + 1);
      };
      ell(0, 0.46, 0, 0.19, 0.2, 0.3, 0, [1, 1, 0], -0.25);                      // body
      ell(0, 0.42, 0.16, 0.16, 0.17, 0.17, 0, [1, 0.9, 0]);                       // breast
      ell(0, 0.68, 0.23, 0.075, 0.17, 0.085, 1, [1, 1.05, 0], 0.25);              // neck
      ell(0, 0.86, 0.29, 0.075, 0.08, 0.09, 1, [1, 1.1, 0]);                      // head
      ell(0, 0.85, 0.4, 0.022, 0.025, 0.06, 1, [0, 1.1, 0]);                      // beak
      ell(0, 0.955, 0.29, 0.014, 0.06, 0.075, 1, [0, 1, 1]);                      // comb
      ell(0, 0.775, 0.36, 0.02, 0.05, 0.03, 1, [0, 0.9, 1]);                      // wattle
      for (const s of [-1, 1]) {
        ell(s * 0.19, 0.5, -0.02, 0.045, 0.13, 0.23, 2, [1, 0.72, 0], -0.2);      // wings
        ell(s * 0.07, 0.15, 0.02, 0.022, 0.16, 0.022, 0, [0, 0.9, 0]);            // legs
        ell(s * 0.07, 0.012, 0.06, 0.035, 0.012, 0.09, 0, [0, 0.8, 0]);           // feet
      }
      ell(0, 0.66, -0.33, 0.05, 0.22, 0.13, 3, [1, 0.6, 0], -0.7);                // tail
      ell(0, 0.56, -0.27, 0.1, 0.12, 0.14, 3, [1, 0.8, 0], -0.4);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const hr = rng.fork('hens');
      const walkX = (z, y) => A.halfBreadth(z, y) + 2.7 + 3.4;
      const D = TW.deck + 0.2;
      const spots = [[0.5, 10.1, -88], [-0.8, 10.1, -131], [0.3, 10.1, -204], [-0.7, 10.1, -221], [0.7, 10.1, -229], [-0.5, 10.1, -262], [0.6, 10.1, -318], [21.3, D, -148.6], [25.5, TW.low + 0.2, -150],
        [walkX(-120, 26), 26.25, -120], [walkX(-236, 26) - 0.6, 26.25, -236], [-walkX(-180, 26), 26.25, -180], [13, 0, 40], [14, 0, 29], [-9, 0, 24], [15, 0, 5],
        [18.5, 2.95, -449], [23, 2.95, -462], [3.5, 0, -437], [-3, 0, -462], [-19, 0, -440],
        [15.3, 28.25, -270.6], [17.4, 28.25, -273.8], [14.9, 28.25, -277.4], [16.6, 28.25, -279.6], [15.6, 28.25, -283.2]];      // (the last five: on the forward stage)
      const n = spots.length + 1, iA = new Float32Array(n * 4);
      henMat = new THREE.ShaderMaterial({ vertexShader: HEN_VERT, fragmentShader: henFrag(GL), fog: true, side: THREE.DoubleSide,
        uniforms: { ...fogU(), ...LU, uWing: { value: 0 }, uCoatA: { value: new THREE.Color(paleHens ? '#d8c8a0' : '#b8521c') }, uCoatB: { value: new THREE.Color('#1c1a1c') }, uCoatC: { value: new THREE.Color('#7a7468') } } });
      const im = new THREE.InstancedMesh(g, henMat, n); im.name = 'hens';
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const rooster = i === n - 1, s = rooster ? 4.4 : 2.6 + hr() * 0.7;
        if (rooster) { p.copy(roosterAt); e.set(0, -0.35, 0); } else { p.set(spots[i][0], spots[i][1], spots[i][2]); e.set(0, hr() * 6.283, 0); }
        q.setFromEuler(e); sc.set(s, s, s); m4.compose(p, q, sc); im.setMatrixAt(i, m4);
        iA[i * 4] = hr(); iA[i * 4 + 1] = hr(); iA[i * 4 + 2] = rooster ? 0.1 : hr(); iA[i * 4 + 3] = rooster ? 1 : 0;
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
      im.frustumCulled = false; scene.add(im);
      // contact shade under the hens that stand on sand or decks
      const sh = T.makeAcc();
      for (const sp of spots) blob(sh, sp[0], sp[1] - 0.05, sp[2], 1.3);
      mesh(sh, wood, 'hen-shade');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- goats on the log pile (not in the late light, which has the calf)
    // Five village goats, stocky: a deep barrel on short legs, a short neck, short horns swept back, a beard, a short
    // tail held up. They stand along the crests of the top logs; one lies with its legs folded under it. Each noses
    // down at the bark now and then, looks about, chews, flicks its tail (GOAT_VERT).
    if (!calf) {
      const pos = [], nrm = [], col = [], uv = [], idx = []; let nv = 0;
      // an ellipsoid; part: 0 body, 1 neck and head, 2 legs, 3 tail; c = [coat mask, shade, dark]; tilt leans its top forward (+z)
      const ell = (cx, cy, cz, rx, ry, rz, part, c, tilt = 0) => {
        const S = 8, R = 5, ct = Math.cos(tilt), st = Math.sin(tilt);
        for (let i = 0; i <= R; i++) for (let j = 0; j <= S; j++) {
          const th = i / R * Math.PI, ph = j / S * Math.PI * 2;
          const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
          const px = x * rx, py = y * ry, pz = z * rz, nx = x / rx, ny = y / ry, nz = z / rz;
          const py2 = py * ct - pz * st, pz2 = py * st + pz * ct, ny2 = ny * ct - nz * st, nz2 = ny * st + nz * ct;
          const l = Math.hypot(nx, ny2, nz2) || 1;
          pos.push(cx + px, cy + py2, cz + pz2); nrm.push(nx / l, ny2 / l, nz2 / l); col.push(c[0], c[1] * (0.74 + 0.26 * (y * 0.5 + 0.5)), c[2]); uv.push(part, 0);
        }
        for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) { const a = nv + i * (S + 1) + j, b = a + 1, c2 = a + S + 1, d = c2 + 1; idx.push(a, b, c2, b, d, c2); }
        nv += (R + 1) * (S + 1);
      };
      ell(0, 0.47, -0.02, 0.17, 0.19, 0.36, 0, [1, 1, 0]);                         // barrel
      ell(0, 0.41, -0.04, 0.19, 0.17, 0.27, 0, [1, 0.88, 0]);                      // deep belly
      ell(0, 0.53, -0.29, 0.15, 0.15, 0.14, 0, [1, 0.97, 0]);                      // rump
      ell(0, 0.5, 0.27, 0.135, 0.17, 0.13, 0, [1, 0.95, 0]);                       // chest
      ell(0, 0.66, 0.37, 0.078, 0.17, 0.09, 1, [1, 1, 0], 0.6);                    // short neck
      ell(0, 0.8, 0.5, 0.066, 0.074, 0.125, 1, [1, 1.05, 0], 0.35);                // head
      ell(0, 0.745, 0.6, 0.042, 0.043, 0.06, 1, [0.55, 0.9, 0.25], 0.35);          // muzzle
      ell(0, 0.665, 0.565, 0.017, 0.075, 0.026, 1, [1, 0.72, 0], -0.2);            // beard
      ell(0, 0.742, 0.652, 0.027, 0.02, 0.018, 1, [0, 0.6, 0.9], 0.35);            // nose
      ell(0, 0.6, -0.4, 0.024, 0.065, 0.03, 3, [1, 0.85, 0], -0.5);                // tail, held up
      for (const sd of [-1, 1]) {
        ell(sd * 0.1, 0.81, 0.43, 0.052, 0.02, 0.034, 1, [1, 0.8, 0], 0.3);        // ears, out sideways
        ell(sd * 0.038, 0.915, 0.425, 0.022, 0.085, 0.03, 1, [0, 1.0, 0.72], -0.7);  // horns: ridged, swept back and out
        ell(sd * 0.052, 0.968, 0.335, 0.018, 0.07, 0.024, 1, [0, 0.9, 0.78], -1.2);
        ell(sd * 0.07, 0.975, 0.245, 0.012, 0.05, 0.016, 1, [0, 0.8, 0.84], -1.65);
        ell(sd * 0.062, 0.828, 0.512, 0.014, 0.017, 0.021, 1, [0, 0.5, 1]);          // eye
        for (const fz of [0.25, -0.27]) {
          ell(sd * 0.1, 0.29, fz, 0.047, 0.13, 0.055, 2, [1, 0.9, 0]);              // upper leg
          ell(sd * 0.1, 0.11, fz + 0.005, 0.025, 0.1, 0.028, 2, [1, 0.8, 0.2]);     // cannon
          ell(sd * 0.1, 0.02, fz + 0.015, 0.031, 0.022, 0.038, 2, [0, 0.7, 1]);     // hoof
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const gr = ctx.core.makeRng('hif-goats:' + ctx.seed);
      // [x, z, heading, lying]: on the crests of the four top logs (x 22.4, 26.1, 29.9, 33.6; crest y about 10.3)
      const spots = [[22.4, 40.5, 0.35, 0], [26.1, 26.5, 2.7, 0], [29.9, 36, 0.2, 1], [33.6, 30, -2.6, 0], [22.4, 21.5, -0.4, 0]];
      const n = spots.length, iA = new Float32Array(n * 4);
      const gm = new THREE.ShaderMaterial({ vertexShader: GOAT_VERT, fragmentShader: goatFrag(GL), fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU } });
      disposables.push(g, gm);
      const im = new THREE.InstancedMesh(g, gm, n); im.name = 'goats';
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const sz = (i === 4 ? 5.9 : 7.3) + gr() * 1.1;
        p.set(spots[i][0] + (gr() - 0.5) * 0.3, 10.24, spots[i][1] + (gr() - 0.5) * 2); e.set(0, spots[i][2] + (gr() - 0.5) * 0.4, 0);
        q.setFromEuler(e); sc.set(sz * 1.14, sz * 0.92, sz * 1.06); m4.compose(p, q, sc); im.setMatrixAt(i, m4);
        iA[i * 4] = gr(); iA[i * 4 + 1] = gr(); iA[i * 4 + 2] = (i + 0.5) / n; iA[i * 4 + 3] = spots[i][3];
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
      im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- kit fauna: a calf in the late light, swallows, butterflies or fireflies, the hornbill
    const DUR = 48;
    const fauna = F.makeFauna(scene, { light: { sunDir: LU.uSunDir.value.clone(), ...L.fauna } });
    {
      const top = 10.45;
      if (calf) fauna.add(F.makeHerd({ rng: rng.fork('calf'), species: 'bison', count: 1, size: 6.5, center: [22, 0, 4], radius: 6, roam: 0.4, pause: 0.4, coat: '#8a7462', blobShadow: true }));
      else rng.fork('goats');                 // (the goats are the yard's own now, built above; the draw is kept so everything after it stays as it was)
      await ctx.yield();
      const swift = night ? { body: '#080c18', wingC: '#0c1224', belly: '#3c4870' } : { body: '#10141c', wingC: '#141a24', belly: '#e8e0d0' };
      fauna.add(F.makeFlock({ rng: rng.fork('sw1'), species: 'swifts', count: 8, size: 5, speed: 24, spread: [16, 8, 20], ...swift, closed: true,
        route: [[-52, 38, -80], [0, 44, -110], [50, 40, -150], [0, 50, -200], [-50, 42, -250], [0, 46, -300], [46, 40, -340], [0, 56, -280], [-40, 52, -200], [10, 58, -120]] }));
      fauna.add(F.makeFlock({ rng: rng.fork('sw2'), species: 'swifts', count: 8, size: 9, spread: [7, 3.5, 11], ...swift,
        cross: { path, u: 0.52, lead: 17, angle: 74, side: 1, height: 3.5, offset: 2, span: 150, duration: DUR } }));
      fauna.add(F.makeFlock({ rng: ctx.core.makeRng('hif-sw3:' + ctx.seed), species: 'swifts', count: 3, size: 8.5, spread: [3.5, 2, 6], ...swift,
        cross: { path, u: 0.61, lead: 20, angle: 60, side: -1, height: 4, offset: 8, span: 130, duration: DUR } }));
      await ctx.yield();
      if (night) fauna.add(F.makeFireflies({ rng: rng.fork('ff'), path, uFrom: 0.1, uTo: 0.98, count: Math.round(340 * detail * density), spread: 36, clear: 6, lift: [-24, 16], size: 0.95, halo: 2.4, color: '#ffc860', color2: '#ffe9a0' }));
      else fauna.add(F.makeButterflies({ rng: rng.fork('bf'), path, uFrom: 0.39, uTo: 0.95, count: Math.round(30 * density), spread: 22, clear: 7, lift: [-9, 10], size: 7, roam: [8, 3.5, 0.45, 0.03], varieties: [['#ffd21a', '#141008'], ['#ffe45a', '#2a1c08'], ['#f6c010', '#0c0a06']] }));
    }
    // butterflies (fireflies by night) gathering round the ring at the bow
    {
      const rr2 = rng.fork('ring'), ringPts = [];
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283 + rr2() * 0.3, R = 8.6 + rr2() * 3.4; ringPts.push([-9.5 + Math.cos(a) * R, 34 + Math.sin(a) * R * 0.9, A.portalSeat.position.z + 1.5 + rr2() * 7]); }
      if (night) fauna.add(F.makeFireflies({ rng: rng.fork('ffr'), positions: ringPts, count: 40, size: 0.9, halo: 2.2, color: '#ffc860', color2: '#ffe9a0' }));
      else fauna.add(F.makeButterflies({ rng: rng.fork('bfr'), positions: ringPts, count: 16, size: 7, roam: [2.6, 2.0, 0.5, 0.03], varieties: [['#ffd21a', '#141008'], ['#ffe45a', '#2a1c08'], ['#fff2c0', '#2a1c08']] }));
    }
    // ---------------------------------------------------------------- the rare visitor: a red-knobbed hornbill, 12 m across the wings
    // Built here (forward = -z, y up) and flown by update(): it comes in high over the hull from port at u 0.38, flies 24 m
    // ahead of the plank, a little to port of the eye's line and below it, from u 0.43 to 0.57 (its back and spread
    // wings seen from above against the ship), then dives away between the port ribs; gone by u 0.62.
    let hornbill = null, hbMat = null;
    if (vary.rare) {
      const hb = T.makeAcc(), BK = [0.032, 0.032, 0.042], WHT = [0.92, 0.9, 0.82];
      const tube = (pts, radii, col, sides = 8) => T.bar(hb, pts.map((q) => V3(q[0], q[1], q[2])), 1, sides, col, { taper: (i) => radii[i], up: V3(0, 1, 0.01) });
      tube([[0, 0.08, 2.9], [0, 0.14, 2.3], [0, 0.2, 1.5], [0, 0.24, 0.6], [0, 0.27, -0.3], [0, 0.31, -1.1], [0, 0.37, -1.7], [0, 0.44, -2.15]], [0.16, 0.52, 0.86, 1.03, 1.02, 0.86, 0.66, 0.5], BK, 10);
      for (const sd of [-1, 1]) tube([[sd * 0.5, 0.36, -1.3], [sd * 0.95, 0.42, -0.6], [sd * 1.0, 0.4, 0.5], [sd * 0.6, 0.3, 1.3]], [0.3, 0.5, 0.46, 0.2], BK, 7);      // shoulders
      tube([[0, 0.4, -1.8], [0, 0.75, -2.7], [0, 0.95, -3.3]], [0.52, 0.45, 0.5], [0.46, 0.25, 0.09]);                       // rufous neck
      tube([[0, 0.95, -3.2], [0, 1.0, -3.7], [0, 0.95, -4.05]], [0.5, 0.56, 0.36], [0.52, 0.3, 0.1]);                        // head
      tube([[0, 0.9, -3.9], [0, 0.78, -4.9], [0, 0.45, -5.8], [0, 0.12, -6.2]], [0.37, 0.31, 0.18, 0.04], [0.95, 0.66, 0.1]);   // the great yellow bill
      tube([[0, 1.36, -3.45], [0, 1.56, -4.1], [0, 1.34, -4.75]], [0.2, 0.4, 0.12], [0.8, 0.05, 0.035]);                     // the red knob
      tube([[0, 0.5, -3.6], [0, 0.3, -4.05]], [0.3, 0.2], [0.1, 0.2, 0.6], 6);                                             // blue throat
      // flat sheets: uv.x = how far out along the wing (0 at the shoulder), uv.y = side (0 for the tail)
      const sheet = (grid, colAt, wAt, side) => {
        const nr = grid.length, nc = grid[0].length, b0 = hb.n;
        for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { const q = grid[i][j], c = colAt(i, j); hb.pos.push(q[0], q[1], q[2]); hb.nrm.push(0, 1, 0); hb.col.push(c[0], c[1], c[2]); hb.uv.push(wAt(i, j), side); }
        for (let i = 0; i < nr - 1; i++) for (let j = 0; j < nc - 1; j++) { const a0 = b0 + i * nc + j, a1 = a0 + 1, c0 = a0 + nc, d0 = c0 + 1; hb.idx.push(a0, c0, a1, a1, c0, d0); }
        hb.n += nr * nc;
      };
      // the tail: seven separate feathers fanned out, white with a black band at the root, the middle pair longest
      for (let k = -3; k <= 3; k++) {
        const an = k * 0.2, len = 5.3 - 0.22 * k * k, sn = Math.sin(an), cs = Math.cos(an), grid = [], yk = 0.2 - 0.035 * Math.abs(k);
        const ts = [0, 0.26, 0.34, 0.7, 0.93, 1], ws = [0.2, 0.36, 0.4, 0.47, 0.4, 0.12];
        for (let i = 0; i < ts.length; i++) { const d = 1.6 + len * ts[i], cx = sn * d, cz = 0.4 + cs * d, row = []; for (const e of [-1, 0, 1]) row.push([cx + cs * ws[i] * e, yk - 0.05 * ts[i] * len * 0.2 + 0.03 * Math.abs(e), cz - sn * ws[i] * e]); grid.push(row); }
        const tone = 0.88 + 0.12 * ((k + 3) % 2);
        sheet(grid, (i, j) => (i < 2 ? BK : i === 2 ? [0.3, 0.3, 0.3] : [WHT[0] * tone * (j === 1 ? 1 : 0.86), WHT[1] * tone * (j === 1 ? 1 : 0.86), WHT[2] * tone * (j === 1 ? 1 : 0.84)]), () => 0, 0);
      }
      // wings: broad, with fingered tips
      for (const sd of [-1, 1]) {
        const grid = [], NS = 7;
        for (let i = 0; i <= NS; i++) {
          const w = i / NS, x = sd * (0.7 + 5.0 * w), le = -1.5 + 0.9 * w * w, te = 1.7 - 0.5 * w - 0.7 * w * w * w, row = [];
          for (let j = 0; j <= 3; j++) row.push([x, 0.35 + 0.22 * Math.sin(w * 3.1) - 0.1 * (j / 3), le + (te - le) * (j / 3)]);
          grid.push(row);
        }
        sheet(grid, (i, j) => (j === 3 ? [0.06, 0.06, 0.075] : BK), (i) => i / NS, sd);
        for (let k = 0; k < 5; k++) {
          const z0 = -0.55 + k * 0.32, z1 = -1.0 + k * 0.62, x0 = sd * 5.55, x1 = sd * (6.75 - 0.22 * k), hw2 = 0.17;
          sheet([[[x0, 0.3, z0 - hw2], [x0, 0.3, z0 + hw2]], [[x1, 0.3, z1 - hw2 * 0.6], [x1, 0.3, z1 + hw2 * 0.6]]], () => BK, (i) => (i ? 1.22 : 0.97), sd);
        }
      }
      hbMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU, uFlap: { value: 0 }, uSheenK: { value: night ? 0.6 : 1 } },
        vertexShader: `#include <fog_pars_vertex>
attribute vec3 aCol; uniform float uFlap;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn;
void main() {
  vec3 pos = position; vec3 nrm = normal;
  float w = uv.x, side = uv.y;
  if (abs(side) > 0.5) {
    // the arm follows the shoulder; the hand lags behind it and folds a little on the upstroke
    float ang = (0.08 + 0.4 * sin(uFlap)) * w + 0.24 * sin(uFlap - 0.9) * w * w;
    float r = abs(pos.x) - 0.7, ca = cos(ang), sa = sin(ang);
    pos.x = side * (0.7 + r * ca); pos.y += r * sa;
    nrm = vec3(-side * sa, ca, 0.);
  } else if (pos.z > 1.8) {
    pos.y += 0.1 * (pos.z - 1.8) * sin(uFlap - 1.6);
  }
  vec4 wp = modelMatrix * vec4(pos, 1.);
  vWn = normalize(mat3(modelMatrix) * nrm);
  vCol = aCol; vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
        fragmentShader: `#include <fog_pars_fragment>
${GL}
uniform float uSheenK;
varying vec3 vCol; varying vec3 vWp; varying vec3 vWn;
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  float coin = hifCoin(vWp);
  float ndl = max(dot(n, uSunDir), 0.);
  float dark = 1. - smoothstep(0.04, 0.2, max(vCol.r, max(vCol.g, vCol.b)));
  // white feathers take only a quarter of a coin, so the tail flashes without burning out
  float wht = smoothstep(0.4, 0.75, min(vCol.r, vCol.g));
  vec3 col = vCol * (hifShade(n, vWp) * mix(1., 0.8, wht) + uCoinCol * coin * (0.3 + 0.7 * ndl) * mix(1., 0.24, wht));
  // glossy black feathers: a blue-grey sheen from above, and a flash where a coin lands
  float upf = n.y * 0.5 + 0.5;
  col += dark * (vec3(0.03, 0.037, 0.058) * upf * upf * uSheenK + uCoinCol * coin * 0.035 * (0.3 + 0.7 * ndl));
  col += uGlaze * (0.6 + coin * 4.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}` });
      hornbill = new THREE.Mesh(T.accGeometry(hb), hbMat); hornbill.name = 'hornbill'; hornbill.frustumCulled = false; hornbill.visible = false; scene.add(hornbill);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- air: motes, shavings, smoke layers, steam, beads, peg dust
    const set = fx.fxGroup(); scene.add(set.object);
    let pkSteam = null;
    const CURT = { x: 18.5, z: -126 };            // where the curtain of shavings falls in its broad shaft: 9 m to the right of the path
    const CURT2 = { x: 20, z: -250 };             // the second curtain, forward, in front of the lagoon's glare between the starboard ribs (pinhole pencils, no shaft)
    const SUN = LU.uSunDir.value.clone();
    let dustMat = null;
    {
      const n = Math.round(2600 * detail), pos = new Float32Array(n * 3), seed = new Float32Array(n * 4), dr = rng.fork('dust');
      for (let i = 0; i < n; i++) { pos[i * 3] = dr() - 0.5; pos[i * 3 + 1] = dr() - 0.5; pos[i * 3 + 2] = dr() - 0.5; seed[i * 4] = dr(); seed[i * 4 + 1] = dr(); seed[i * 4 + 2] = dr(); seed[i * 4 + 3] = dr(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      dustMat = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: dustFrag(GL), transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
        uniforms: { ...LU, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(96, 60, 96) }, uPx: { value: 400 }, uSize: { value: 0.16 },
          uDustCol: { value: new THREE.Vector3(...L.dust) }, uDustGain: { value: night ? 0.8 : 1 } } });
      const pts = new THREE.Points(g, dustMat); pts.name = 'motes'; pts.frustumCulled = false; pts.renderOrder = 3; scene.add(pts);
    }
    await ctx.yield();
    {
      // shavings falling in curls from four places where the adzes were just at work; the first is the curtain at u 0.33
      const places = [[CURT.x, 44, CURT.z], [-15, 38, -232], [CURT2.x, 42, CURT2.z], [-13, 38, -128]];
      const shCols = night ? ['#8a9ac8', '#6a78a8', '#b8c4e8'] : ['#f0d49a', '#c8a46a', '#fff0c8'];
      for (let k = 0; k < 4; k++) {
        set.add(fx.makeParticles({ rng: rng.fork('shav' + k), preset: 'leaves', time, follow: false, center: places[k], box: k === 0 ? [3.6, 62, 9] : k === 2 ? [4.2, 62, 34] : [7, 62, 12], count: Math.round((k === 0 ? 560 : k === 2 ? 1000 : 190) * detail),
          colors: shCols, size: k === 0 ? [0.7, 1.5] : k === 2 ? [0.75, 1.6] : [0.5, 1.15], velocity: [0, -5.5, 0], intensity: night ? 0.8 : k === 0 ? 1.5 : k === 2 ? 1.6 : 1.15, lightDir: SUN }));
      }
      await ctx.yield();
      // smoke from the bending fire, hanging in layers between 45 and 90 m
      set.add(fx.makeMist({ rng: rng.fork('smoke'), time, count: Math.round(64 * Math.max(detail, 0.8)), area: [120, 36, 600], center: [0, 68, -190], size: [34, 70], color: L.smoke, opacity: night ? 0.1 : 0.085,
        drift: [0.5, 0, 0.9], flatten: 0.32, follow: false }));
      await ctx.yield();
      // steam leaking from the mats over the trough, lit from below by the embers
      const st = rain ? 1.3 : 1;
      const steamCol = night ? { color: '#7a86b8', colorTop: '#56608e', shadowColor: '#2a3058', ambient: '#1a2040' } : { color: '#efe4cc', colorTop: '#d8ccb4', shadowColor: '#9a8a70', ambient: '#6a5a46' };
      // (the fourth column stands at the trough's forward end and leans to port, so its steam drifts across the foot of
      // the rudder and the sternpost as the eye comes up beside them; by night all four are lit warm from the embers)
      // (the fifth lies low and drifts forward over the sand from the same end, under the eye's line and 6 m and more
      // below it: from astern it hangs lit in front of the foot of the ribcage's open mouth)
      for (const [z, h, wx, wz, ox] of [[56, 6.5, 0.75, -0.45, 1.2], [44, 8, 0.75, -0.45, 1.2], [33, 8.5, 0.75, -0.45, 1.2], [31, 23, -0.62, -0.5, -0.8], [30.5, 11, 0.12, -1, 0.5]]) {
        const tall = h > 10, fwd = z === 30.5;
        const col = fx.makeSmokeColumn({ rng: fwd ? ctx.core.makeRng('hif-steamF:' + ctx.seed) : rng.fork('steam' + z), time, position: [TR.x + ox, TR.y + TR.r, z], height: h * (rain ? 1.2 : 1), radius: [1.3, fwd ? 3.4 : tall ? 5.2 : 3.6], size: [2.2, fwd ? 5.5 : tall ? 7.4 : 5.2], count: Math.round((tall ? 38 : 24) * st),
          ...steamCol, hot: night ? '#ff6a1c' : rain ? '#ff7226' : '#ff7a30', hotFalloff: night ? 3.6 : rain ? 10 : 7, opacity: (night ? 0.3 : 0.2) * st * (tall ? 0.95 : 1), rate: 0.1, wind: [wx, 0, wz], bend: fwd ? 3.0 : 0.6, sunDir: SUN, sunColor: night ? '#8aa0ff' : '#fff0c8', rim: 0.7, scatter: 0.6 });
        if (night && col.uniforms && col.uniforms.uHot) col.uniforms.uHot.value.multiplyScalar(1.7);
        set.add(col);
      }
      // the plank's own cloud: it comes up out of the trough wrapped in steam. The cloud stands on the plank's forward
      // half (the part of it in view, to port and below) and streams aft along it past the eye, never as high as the
      // eye: the wet black tip slides forward out of it. It thins away by the time the plank rides (u 0.12-0.33)
      pkSteam = fx.makeSmokeColumn({ rng: ctx.core.makeRng('hif-pksteam:' + ctx.seed), time, position: [5, 4, 40], height: 4.4, radius: [1.3, 3.3], size: [2.4, 5.4], count: 34,
        ...steamCol, opacity: 0, rate: 0.24, wind: [-0.14, 0, 1], bend: 3.2, sunDir: SUN, sunColor: night ? '#8aa0ff' : '#fff0c8', rim: 0.7, scatter: 0.6 });
      set.add(pkSteam);
      // kettle and tea glasses
      set.add(fx.makeSmokeColumn({ rng: rng.fork('kettle'), time, position: steamAt[0].slice(0, 3), height: 9, radius: [0.25, 1.8], size: [0.9, 3.4], count: 26, ...steamCol, opacity: 0.5, rate: 0.16, wind: [0.1, 0, -0.25], bend: 0.3, sunDir: SUN }));
      set.add(fx.makeSmokeColumn({ rng: rng.fork('tea'), time, position: [22.6, TW.deck + 1.5, -165.2], height: 4.5, radius: [0.9, 1.6], size: [0.6, 1.8], count: 22, ...steamCol, opacity: 0.38, rate: 0.2, wind: [0.05, 0, -0.15], bend: 0.3, sunDir: SUN }));
      await ctx.yield();
      // between two showers: beads of water falling from every pinhole and off the eaves
      if (rain) set.add(fx.makeParticles({ rng: rng.fork('beads'), preset: 'rain', time, count: Math.round(2200 * detail), box: [90, 60, 90], velocity: [0, -34, 0], velocityRandom: [0.6, 5, 0.6], colors: ['#dff0ff', '#b8d8f0', '#ffffff'], size: [0.07, 0.14], intensity: 0.9, stretch: 0.035 }));
    }
    let glareMat = null;
    // the lagoon's glare where it comes in between the starboard ribs forward of amidships: a soft blade of lit haze in
    // every gap at eye height, brightest at the ribs, so a cool band flickers down the right of the nave as we pass
    {
      const ga = T.makeAcc();
      for (let i = 31; i < 69; i++) {
        const z = -60 - 4.7 * (i + 0.5), xo = A.halfBreadth(z, 33) + 1.2, len = 7 + 4 * ((i * 7) % 5) / 5, b = ga.n, ph = (i * 0.37) % 1;
        for (const [x, y, ux, vy] of [[xo - len, 23, 0, 0], [xo, 23, 1, 0], [xo, 44, 1, 1], [xo - len, 44, 0, 1]]) { ga.pos.push(x, y, z + (ux ? 0 : 2.5)); ga.nrm.push(0, 0, 1); ga.col.push(ph, smoothstep(31, 40, i), 0); ga.uv.push(ux, vy); }
        ga.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); ga.n += 4;
      }
      const gm = glareMat = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { ...fogU(), uTime: LU.uTime, uFar: { value: new THREE.Vector2(55, 135) }, uGlare: { value: new THREE.Color(night ? '#1c3a6a' : rain ? '#7fb8c0' : '#69d8cf').multiplyScalar(night ? 0.4 : rain ? 0.28 : 0.39) } },
        vertexShader: '#include <fog_pars_vertex>\nattribute vec3 aCol; varying vec2 vUv; varying vec3 vCol;\nvoid main(){ vUv = uv; vCol = aCol; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
        fragmentShader: `#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uGlare; uniform vec2 uFar; varying vec2 vUv; varying vec3 vCol;
void main() {
  float y = 2. * vUv.y - 1.;
  float a = vUv.x * vUv.x * (1. - y * y) * (1. - y * y);
  a *= 0.6 + 0.4 * sin(uTime * 1.7 + vCol.r * 40.) * sin(uTime * 0.9 + vCol.r * 17. + vUv.y * 6.);      // the water's glitter, come indoors
  gl_FragColor = vec4((uGlare + vec3(0.2) * uGlare.g * vUv.x * vUv.x) * a * vCol.g, 1.);
  #ifdef USE_FOG
    float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    // light in the near air only: far off the blades would pile up into a beam
    gl_FragColor.rgb *= (1. - ff) * smoothstep(4., 16., vFogDepth) * (1. - smoothstep(uFar.x, uFar.y, vFogDepth));
  #endif
}` });
      const glare = new THREE.Mesh(T.accGeometry(ga), gm); glare.name = 'glare'; glare.renderOrder = 2; scene.add(glare);
    }
    // haze in front of the gap in the mat screen: the lagoon's glare hangs in the air there, so the opening is a
    // soft bloom of light and not a clean-edged panel
    {
      const ha = T.makeAcc(), xm = (SLOT.x0 + SLOT.x1) / 2, hw = (SLOT.x1 - SLOT.x0) / 2 + 13, zc = SHED_Z1 + 3.2;
      for (const sd of [-1, 1]) {
        const b = ha.n;
        for (const [x, y, ux, vy] of [[xm + sd * hw, 13, 0, 0], [xm, 13, 1, 0], [xm, 45, 1, 1], [xm + sd * hw, 45, 0, 1]]) { ha.pos.push(x, y, zc); ha.nrm.push(0, 0, 1); ha.col.push(sd * 0.21 + 0.4, 1, 0); ha.uv.push(ux, vy); }
        ha.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); ha.n += 4;
      }
      const hm = glareMat.clone();
      hm.uniforms.uTime = LU.uTime; hm.uniforms.uFar.value.set(700, 900);
      hm.uniforms.uGlare.value.copy(spillCol).multiplyScalar(night ? 1.6 : 1.15);
      const haze = new THREE.Mesh(T.accGeometry(ha), hm); haze.name = 'gap-haze'; haze.renderOrder = 2; scene.add(haze);
    }
    // the one broad shaft, where a panel of thatch has been lifted over the place the adzes were last at work: the
    // curtain of shavings (the first of the four falls) comes down through it. (The second curtain, forward, has no
    // shaft: it falls through a dense cluster of pinhole pencils where the thatch has worn thin.)
    {
      const sa = T.makeAcc();
      for (const cq of [CURT]) {
        const p0 = V3(cq.x, 10, cq.z), tTop = (roofY(p0.x + 9) - p0.y) / SUN.y, p1 = p0.clone().addScaledVector(SUN, tTop);
        for (const [ox, oz] of [[1, 0], [0, 1]]) {
          const b = sa.n, hw = 2.9;
          for (const [q, sx, vy] of [[p0, -1, 0], [p0, 1, 0], [p1, 1, 1], [p1, -1, 1]]) { sa.pos.push(q.x + ox * sx * hw, q.y, q.z + oz * sx * hw); sa.nrm.push(0, 1, 0); sa.col.push(1, 1, 1); sa.uv.push(sx, vy); }
          sa.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); sa.n += 4;
        }
      }
      const sm = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { ...fogU(), uTime: LU.uTime, uShaft: { value: LU.uCoinCol.value.clone().multiplyScalar(night ? 0.016 : 0.04) } },
        vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vUv; varying vec3 vWp;\nvoid main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
        fragmentShader: `#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uShaft; varying vec2 vUv; varying vec3 vWp;
void main() {
  float x = vUv.x;
  float a = 1. - x * x; a *= a;
  float streak = 0.62 + 0.38 * sin(x * 9. + 2. * sin(uTime * 0.21 + vUv.y * 3.)) * sin(x * 4.3 - uTime * 0.13);
  float lay = 0.62 + 0.38 * sin(vWp.y * 0.19 + uTime * 0.07 + vWp.z * 0.02);
  float h = smoothstep(0., 0.22, vUv.y) * (1. - 0.3 * vUv.y);
  gl_FragColor = vec4(uShaft * a * streak * lay * h, 1.);
  #ifdef USE_FOG
    float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    gl_FragColor.rgb *= (1. - ff * 0.85) * smoothstep(5., 20., vFogDepth);
  #endif
}` });
      const shaft = new THREE.Mesh(T.accGeometry(sa), sm); shaft.name = 'shaft'; shaft.renderOrder = 4; scene.add(shaft);
    }
    // petals let go by the garland, drifting down past the stem
    set.add(fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time, follow: false, center: [-2.5, 22, -441], box: [20, 42, 20], count: Math.round(120 * detail),
      colors: night ? ['#aab8e8', '#8090c8', '#d0d8ff'] : ['#fff6e0', '#ffe9b0', '#ffffff'], size: [0.32, 0.62], velocity: [0.2, -1.7, 0.5], intensity: night ? 0.7 : 1.1, lightDir: SUN }));
    // for every knock on a peg at the berth: a spray of twelve chips and grains of sawdust, each no bigger than a
    // thumbnail on screen and crisp, thrown out along the face and inboard from where the peg goes in, falling, gone
    // before the next knock (never a soft pale cloud). Their state is one small attribute.
    const NPQ = 12, puffState = new Float32Array(9 * NPQ * 4), pegNow = new THREE.Vector3();
    let puffAttr = null;
    {
      const pg = new THREE.InstancedBufferGeometry(), pr = rng.fork('puffs'), seeds = new Float32Array(9 * NPQ * 4);
      pg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
      for (let i = 0; i < seeds.length; i++) seeds[i] = pr();
      for (let i = 0; i < 9 * NPQ; i++) puffState[i * 4 + 3] = -1;
      pg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
      puffAttr = new THREE.InstancedBufferAttribute(puffState, 4); puffAttr.setUsage(THREE.DynamicDrawUsage); pg.setAttribute('aPeg', puffAttr);
      pg.instanceCount = 9 * NPQ; pg.boundingSphere = new THREE.Sphere(T.berthPos.clone(), 40);
      const pm = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false,
        uniforms: { ...fogU(), ...LU, uBX: { value: T.bX.clone() }, uBY: { value: T.bY.clone() }, uPuffCol: { value: new THREE.Color(night ? '#7c8cc4' : rain ? '#dfe6e4' : '#f6d9a4').multiplyScalar(night ? 0.42 : rain ? 0.5 : 0.6) } },
        vertexShader: `#include <fog_pars_vertex>
attribute vec4 aSeed; attribute vec4 aPeg; uniform vec3 uBX; uniform vec3 uBY;
varying vec2 vQ; varying float vA; varying vec3 vWp; varying float vSeed;
void main() {
  // aPeg.w: progress of the knock now landing on this peg (below 0: none). The mallet lands at 0.16.
  float age = clamp((aPeg.w - 0.16) / 0.84, 0., 1.);
  float e = 1. - (1. - age) * (1. - age);
  vec3 c = aPeg.xyz + uBY * (0.3 + 1.5 * e * aSeed.x) + (uBX * (aSeed.y - 0.5) * 2. + vec3(0., (aSeed.z - 0.35) * 2., 0.)) * 1.5 * e;
  c.y -= 1.5 * age * age;
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  float size = max((0.035 + 0.045 * aSeed.w) * (1. - 0.3 * age), 0.0019 * -mvPosition.z);
  // (a chip tumbles: its quad turns and narrows)
  float tw = aSeed.w * 40. + age * (4. + 9. * aSeed.x);
  vec2 q2 = vec2(position.x * (0.45 + 0.55 * abs(cos(tw * 0.7))), position.y);
  mvPosition.xy += vec2(q2.x * cos(tw) - q2.y * sin(tw), q2.x * sin(tw) + q2.y * cos(tw)) * size;
  vQ = position.xy; vSeed = aSeed.w; vWp = c;
  vA = step(0.16, aPeg.w) * smoothstep(0., 0.05, age) * (1. - smoothstep(0.6, 1., age));
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
        fragmentShader: `#include <fog_pars_fragment>
${GL}
uniform vec3 uPuffCol; varying vec2 vQ; varying float vA; varying vec3 vWp; varying float vSeed;
void main() {
  float a = vA * (1. - smoothstep(0.7, 1., max(abs(vQ.x), abs(vQ.y))));
  vec3 col = uPuffCol * (0.7 + 0.5 * vSeed) * (1. + 0.6 * hifCoin(vWp)) + uGlaze;
  gl_FragColor = vec4(col, a * 0.95);
  #include <fog_fragment>
}` });
      const puffs = new THREE.Mesh(pg, pm); puffs.name = 'peg-dust'; puffs.frustumCulled = false; puffs.renderOrder = 3; scene.add(puffs);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the flight
    const s01 = (a, b, x) => smoothstep(a, b, x);
    const camPos = new THREE.Vector3(), size2 = new THREE.Vector2(), travelDir = new THREE.Vector3(0, 0, -1);
    const PL = path.length;
    // Path progress -> the story's own clock (the hero's keys). They are the same until the bow; there the plank is
    // taken ahead to its berth over path u 0.715-0.803 (story 0.69-0.765), and is bent and pegged from 0.806 on
    // (story 0.80), each peg struck 9 to 12 m ahead of the eye.
    const SU = [[0, 0], [0.6, 0.6], [0.715, 0.69], [0.803, 0.765], [0.806, 0.80], [0.87, 0.868], [1, 1]];
    const WING = [0.402, 0.418, 0.448, 0.461], pkGain = night ? 0.34 : rain ? 0.46 : 0.42;
    const storyU = (u) => { let k = 0; while (k < SU.length - 2 && u > SU[k + 1][0]) k++; const a = SU[k], b = SU[k + 1]; return lerp(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]), 0, 1)); };
    // THE GAZE. The eye looks down the line of travel (the nave, and the ring from u 0.27 on) except for three slow
    // looks, each a point of interest of its own at full weight that the engine eases in, holds and eases out; between
    // them a short look down along the keel, which is a pitch only. Yaw in degrees (+ to starboard) and pitch (+ up)
    // are added to the line of travel:
    //   tower    0.375-0.505 (held 0.414-0.466): to starboard at the tower's top walk: the rooster on its rail, the
    //            kettle, the glasses and the tools; the washing comes into the upper left of it as it eases out
    //   glare    0.545-0.66 (held 0.58-0.625): to starboard at the forward curtain of shavings in the lagoon's glare
    //   keel     0.655-0.75 (held 0.693-0.712): down along the keel, no turn
    //   berth    0.745-0.915 (held 0.79-0.87): to port at the peg that is being driven
    // NO look turns further than keeps the whole ring in frame: the yaw is clamped to the ring's own bearing plus or
    // minus half the view's width less the ring's radius and a margin for sway and bank (ringClamp). There is no look
    // on the way in: the path itself puts the black upright of sternpost and rudder in the mouth of the ribcage.
    const TOWER_AT = V3(21, 33, -152), CURT2_AT = V3(20, 36, -251), PORTAL_AT = V3(-9.5, 34, -446);
    const HALF_VIEW = 46.85 - 3.4, RING_R = 7.6;                 // degrees (16:9, fov 62), metres (with the ring's glow)
    const gzA = new THREE.Vector3(), gzB = new THREE.Vector3(), gzOut = new THREE.Vector3(), gzP = new THREE.Vector3(), gzQ = new THREE.Vector3();
    // the hornbill's place for a path progress uu: ahead of the eye along the path, to starboard (+) and above (+)
    const hbP = new THREE.Vector3(), hbA = new THREE.Vector3(), hbB = new THREE.Vector3(), hbT = new THREE.Vector3();
    const hbX = new THREE.Vector3(), hbY = new THREE.Vector3(), hbZ = new THREE.Vector3(), hbM = new THREE.Matrix4(), hbQ = new THREE.Quaternion(), hbE = new THREE.Euler();
    const hbAt = (uu, out) => {
      const sN = clamp((uu - 0.38) / 0.24, 0, 1);
      const ahead = lerp(54, 26, s01(0, 0.3, sN)) + 30 * s01(0.74, 1, sN);
      // in between the starboard ribs over the far end of the tower, down to just under the eye line (so its back and
      // spread wings show) a little right of the middle of the nave; then up and out between the port ribs
      const lat = lerp(40, 5.5, s01(0, 0.2, sN)) + 1.5 * Math.sin(sN * 17) * s01(0.3, 0.4, sN) * (1 - s01(0.7, 0.8, sN)) - 52 * s01(0.74, 1, sN);
      const up = lerp(21, -3.2, s01(0.04, 0.42, sN)) + 0.8 * Math.sin(sN * 29) + 15 * s01(0.76, 1, sN);
      const d = uu * PL + ahead;
      path.posAtDist(d, out); path.tangentAtDist(d, hbT);
      const l = Math.hypot(hbT.x, hbT.z) || 1;
      out.x += (-hbT.z / l) * lat; out.z += (hbT.x / l) * lat; out.y += up;
      return out;
    };
    // bearing of a point from the eye (at gzA), in degrees to starboard of the heading yaw0
    const bearing = (p, yaw0) => { let b = Math.atan2(p.x - gzA.x, -(p.z - gzA.z)) - yaw0; if (b > Math.PI) b -= 2 * Math.PI; if (b < -Math.PI) b += 2 * Math.PI; return b * 57.29578; };
    const gzYaw0 = (u) => { path.posAtDist(u * PL, gzA); path.posAtDist(u * PL + 26, gzB); gzB.sub(gzA).normalize(); return Math.atan2(gzB.x, -gzB.z); };
    const ringClamp = (yawK, yaw0) => {
      const b = bearing(PORTAL_AT, yaw0), lim = Math.max(HALF_VIEW - Math.atan2(RING_R, Math.hypot(PORTAL_AT.x - gzA.x, PORTAL_AT.z - gzA.z)) * 57.29578, 0);
      return clamp(yawK, b - lim, b + lim);
    };
    const aim = (yawK, pitK, yaw0) => {
      const yaw = yaw0 + yawK * 0.017453, pit = Math.asin(clamp(gzB.y, -1, 1)) + pitK * 0.017453, cp = Math.cos(pit);
      return gzOut.set(gzA.x + Math.sin(yaw) * cp * 60, gzA.y + Math.sin(pit) * 60, gzA.z - Math.cos(yaw) * cp * 60);
    };
    // (the rare visit: the looks at the tower and the glare are eased while the hornbill flies the nave)
    const hbEase = (u) => (hornbill ? 1 - 0.55 * s01(0.4, 0.44, u) * (1 - s01(0.57, 0.62, u)) : 1);
    const towerPoi = (t, u) => { const yaw0 = gzYaw0(u), e = hbEase(u); return aim(ringClamp(clamp(bearing(TOWER_AT, yaw0), 0, 60), yaw0) * e, (1.5 + 2.5 * s01(0.45, 0.49, u)) * e, yaw0); };
    const glarePoi = (t, u) => { const yaw0 = gzYaw0(u), e = hbEase(u); return aim(ringClamp(clamp(bearing(CURT2_AT, yaw0), 0, 60), yaw0) * e, 0, yaw0); };
    const keelPoi = (t, u) => { const yaw0 = gzYaw0(u); return aim(ringClamp(0, yaw0), -23, yaw0); };
    // the berth: the eye follows the peg that is being driven (the first of them while the plank is still swinging in)
    const berthPoi = (t, u) => {
      const yaw0 = gzYaw0(u), f = clamp((storyU(u) - T.PEG_U0) / T.PEG_DU, 0, 8), i = Math.min(Math.floor(f), 7);
      T.pegAt(i, gzP); T.pegAt(i + 1, gzQ); gzP.lerp(gzQ, s01(0, 1, f - i));
      return aim(ringClamp(clamp(bearing(gzP, yaw0), -80, 0), yaw0), -5, yaw0);
    };
    const portal = { shape: 'circle', radius: 7, color: night ? '#8fd8e8' : '#6fd8d0', glow: night ? 0.8 : 0.9, revealDistance: 430, blendDistance: 60 };

    return {
      scene, path, duration: DUR,
      // the brief's pace: a little brisker as the nave opens, slow beside the berth, at its own speed into the portal
      pace: (u) => 1 + 0.1 * s01(0.20, 0.30, u) - 0.45 * s01(0.72, 0.80, u) + 0.3 * s01(0.90, 0.97, u),
      title: rain ? 'Ribs of the Unfinished Ship, Between Showers' : night ? 'Ribs of the Unfinished Ship, the Night Before the Feast' : amber ? 'Ribs of the Unfinished Ship, Late Light' : 'Ribs of the Unfinished Ship',
      camera: { fov: 62, near: 0.5, far: 1800, lookAhead: 26, sway: 0.5, bank: 0.4 },
      pois: [{ at: towerPoi, from: 0.375, to: 0.505, weight: 1, fade: 0.3 }, { at: glarePoi, from: 0.545, to: 0.66, weight: 1, fade: 0.3 },
        { at: keelPoi, from: 0.655, to: 0.75, weight: 1, fade: 0.4 }, { at: berthPoi, from: 0.745, to: 0.915, weight: 1, fade: 0.265 }],
      portal,
      post: { exposure: L.exposure, bloom: { strength: 0.4, radius: 0.6, threshold: 1.0 },
        grade: { saturation: L.sat, contrast: 1.05, tint: L.tint, shadowTint: L.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        const raw = u; u = storyU(u);               // the hero's scripted moments run on the story clock; the path's own u is `raw`
        // where the plank hangs from the eye, as the brief has it: 4 m to port, 5 m below, its middle 10 m ahead (10 m
        // behind the eye to 30 m ahead); its sway and slow yaw are the hero's
        hero.ride.left = 4; hero.ride.down = 5; hero.ride.rise = 4; hero.ride.ahead = 10;
        // the hung rudder turns in its slings as we come in: its blade swings from lying over to port (the broad dark
        // upright of the first view) to trail nearly fore and aft as the eye comes up beside it, and back once it is astern
        hero.rudder.yaw = -0.46 + 0.5 * s01(0.012, 0.075, raw) - 0.38 * s01(0.12, 0.2, raw);
        path.tangentAt(raw, travelDir); travelDir.y = 0;
        hero.setProgress(u, travelDir);
        hero.update(dt, t, camera);
        {
          const k = s01(0.11, 0.15, raw) * (1 - s01(0.255, 0.33, raw));
          T.plankAt(12.5, 0.2, 0, pkSteam.uniforms.uBase.value);
          pkSteam.uniforms.uOpacity.value = pkGain * k; pkSteam.object.visible = k > 0.004;
        }
        carried.visible = u > 0.12 && !ctx.through;   // never carried while u is 0 (the portal picture): the hero hides it until it rises from the steam
        camera.getWorldPosition(camPos);
        ctx.renderer.getDrawingBufferSize(size2);
        dustMat.uniforms.uCam.value.copy(camPos);
        dustMat.uniforms.uPx.value = 0.5 * size2.y * camera.projectionMatrix.elements[5];
        fauna.update(dt, t, camera, raw);
        set.update(dt, t, camera);
        // rare: the hornbill flies the nave ahead of the plank, banking with its turns
        if (hornbill) {
          const on = raw > 0.378 && raw < 0.622;
          hornbill.visible = on;
          if (on) {
            hbAt(raw - 0.004, hbA); hbAt(raw + 0.004, hbB); hbAt(raw, hbP);
            hbZ.subVectors(hbA, hbB).normalize();                            // the bird's +z is its tail
            hbX.set(hbZ.z, 0, -hbZ.x).normalize();                           // its right wing
            hbY.crossVectors(hbZ, hbX);
            hbM.makeBasis(hbX, hbY, hbZ); hornbill.quaternion.setFromRotationMatrix(hbM);
            const turn = (hbA.x + hbB.x - 2 * hbP.x) * hbX.x + (hbA.z + hbB.z - 2 * hbP.z) * hbX.z;
            hbE.set(0.05 * Math.sin(t * 5.2 - 1.2), 0, -Math.atan(turn)); hbQ.setFromEuler(hbE); hornbill.quaternion.multiply(hbQ);
            hornbill.position.copy(hbP); hornbill.position.y -= 0.3 * Math.sin(t * 5.2 - 0.5);
            const sc = Math.max(0.02, s01(0.378, 0.39, raw) * (1 - s01(0.61, 0.622, raw)));
            hornbill.scale.setScalar(sc);
            hbMat.uniforms.uFlap.value = t * 5.2;
          }
        }
        // ambient: the saw sways in its cut, hung coils and tools swing
        saw.rotation.set(0.05 * Math.sin(t * 0.9), 0, 0.035 * Math.sin(t * 1.3 + 1));
        const hc = coils.children;
        hc[0].rotation.set(0.018 * Math.sin(t * 0.5), 0.25 * Math.sin(t * 0.31), 0.015 * Math.sin(t * 0.43 + 2));
        hc[1].rotation.set(0.017 * Math.sin(t * 0.47 + 1), 0.4 * Math.sin(t * 0.23 + 2), 0.022 * Math.sin(t * 0.55));
        // scripted: the rooster shakes and stretches a wing as the tower passes
        henMat.uniforms.uWing.value = s01(WING[0], WING[1], raw) * (1 - s01(WING[2], WING[3], raw));
        // scripted: each of the nine pegs takes three knocks; each knock lifts a puff of dust
        for (let k = 0; k < 9; k++) {
          const tk = T.knock(u, k), fr = tk > 0 && tk < 3 ? tk - Math.floor(tk) : -1;
          T.pegAt(k, pegNow);
          for (let q = 0; q < NPQ; q++) { const o = (k * NPQ + q) * 4; puffState[o] = pegNow.x; puffState[o + 1] = pegNow.y; puffState[o + 2] = pegNow.z; puffState[o + 3] = fr; }
        }
        puffAttr.needsUpdate = true;
      },
      dispose() { for (const d of disposables) d.dispose(); },
    };
  },
};
