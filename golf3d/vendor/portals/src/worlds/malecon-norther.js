// NORTHER ON THE MALECON. A winter morning on a Caribbean seafront boulevard as a cold front arrives, driven flat
// out in a 1950s convertible the world builds round the camera: down a shaded side street of balconies and laundry,
// left round the corner house into the glare, round the bay on mirror-wet asphalt past crumbling pastel arcades
// while swells burst on the seawall into white fans, under the hero fan ("The Canopy", src/parts/malecon-norther.js)
// which falls on us (top down, no glass: one whiteout on the lens that the wind tears away), and out along the point to a portal that hangs over the rocks beside the fortress
// and the lighthouse.
//
// LAYOUT  Everything on the boulevard is an offset of one reference line, the landward foot of the seawall:
//   station s (m along it; s = 0 where the side street's axis meets it) and lateral l (m landward of it).
//   l 0..5 seaward pavement, 5.25..23.25 carriageway (lanes at 9, 12.5, 16, 19.5, 22), ..27.25 landward pavement,
//   27.25 the column line of the arcades. The line runs straight to s 40, bends right on a 400 m radius to s 250,
//   is straight for the hero (site s 312) to s 370, bends right again to s 560 and is straight to the apron (s 650).
//   World axes at the junction: the boulevard heads -X, the sea is -Z, the side street comes down from +Z.
// LOOKS (ctx.vary.hour, else by seed): morning (default), gold (storm light, sun 7 degrees), dawn (lamps and windows
//   lit), night (sodium lamps, streaked road), rain (the front has arrived, the lens streaked), clear (an hour before).
//   Also by seed: the flooded road, the car's colours, bunting for laundry, sidecars for sedans; (round 19) the stream of
//   old cars that fills the road from the square to the point (which cars, how far each follows the one before it).
//   Rare event: the rogue set, three fans in a row down the wall and a last one that buries the lighthouse.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as S from '../kit/structures.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { rockGeometry } from '../kit/terrain.js';
import { LAMP_GLSL, buildHero, buildFootSpray, buildStreetTongue, buildCascade, fanFootprint, fanLiftCue, fanDrained, foldWings, gullLoop, loopShare, fanExtent, fanResize } from '../parts/malecon-norther.js';

const PI = Math.PI, TAU = PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sm = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// (round 12b) the run of the people at a keyed fan, as a share of their way, from that fan's tau (seconds since its burst): they start
// 0.4 s before the burst and are out 1.4 s after it. Live's law for its twelve at the two keyed fans; the people at the wall call it too.
const keyedRun = (tau) => sm(-0.4, 1.4, tau);
const mix = (a, b, t) => a + (b - a) * t;
const PALETTE = ['#252C5E', '#1D6E72', '#F5F8F4', '#E8929A', '#9AD4B8', '#E3A84B', '#17B3AE'];
const SURF = S.SURF, lin = S.lin;
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const EYE = 1.6, RW = 400;
// (round 13) the standards' light on the water (fans, foot cloud, tongue, the road's foam): the road light's colour times the look's
// lamp level times this; and on the front row of palms, through the flora kit's glow channel
const WAVE_LAMP = 1.8, PALM_LAMP = 0.105;
// (round 19) the places in the list of vehicles that the road, the wheels' spray and the car lamps read: our own car, live's thirteen
// and the stream that fills the road from the square on (twenty at the most, by STREAM's last column). The stream's cars are ONE
// mesh and its mirror, each car set on the road in the vertex shader from this list (as the spray and the lamps are), so the whole
// stream costs two draw calls however many of its cars are in sight
const NVEH_LIVE = 14, NVEH = 34;
// (round 19) the road's ends, in stations, said once: a vehicle is on the road from `from` to `endOn` (one that comes toward us)
// or `endOur` (one that goes our way), and from close0 to close1 the lanes close on ours for the apron. The traffic's law and the
// stream's dealing both read these (live's law carried the same five numbers in its lines)
const ROAD = { from: -156, endOn: 640, endOur: 649, close0: 600, close1: 632 };
// (round 19) the stream's four lanes: the lane (metres from the sea wall's foot), its pace as a share of ours (negative: it comes
// toward us), the name of its own stream of chance (fixed: a lane's cars do not change when another lane's rule does), the most cars
const STREAM = [[19.5, -0.8, 'mn19-oncoming-inner', 7], [22, -0.65, 'mn19-oncoming-kerb', 8], [12.5, 0.55, 'mn19-beside', 3], [16, 0.72, 'mn19-middle', 2]];
// (round 14) the fortress's lanterns on its walls and on the rock under them (the kit's floodlight amount at a lantern's foot, by night);
// the night moon's strength on the bluff's wet faces; the bluff's own stone (live's ball is about 0.19 on its flanks)
const FORT_WASH = 1.5, BLUFF_MOON = 0.9, BLUFF_ROCK = 0.15;
const ST = { east: -60, a0: 40, a1: 250, h1: 370, b1: 560, end: 650, hero: 312, apron: 626, lF: 27.25, sq0: 205, sq1: 245, fEnd: 590 };
const STREET = { hw: 5.5, z0: 27.25, z1: 97.25, sqz: 127.25, roof: 15.2, shell0: 54, shell1: 68 };
const STREET_LAMPS = [[-1, 45], [1, 50.5], [-1, 74], [1, 84], [-1, 93]];      // side (x sign) and z of the wall lanterns in the side street

// ---------- looks ----------
// the night's moon stands ahead and to seaward: to the right of the bonnet round the bay, upper right of the portal on the point
const MOON_AZ = -24, MOON_EL = 30, WALL_TOP = 1.02;
const CLOUDS = { coverage: 0.4, softness: 0.24, scale: 1.5, opacity: 0.92, wind: [0.045, 0.03], haze: 0.3 };
const LOOKS = {
  morning: {
    title: 'Norther on the Malecón',
    sky: { preset: 'day', zenith: '#323c8a', mid: '#2a3276', horizon: '#232a62', ground: '#1a2048', horizonPow: 2.2, midPow: 1.1,
      scatterColor: '#C9DDE6', scatter: 1.7, scatterPow: 3.4, scatterHigh: 0.07, scatterFall: 2.2, sunColor: '#FFE9C4', sunSize: 1.2, sunIntensity: 12, sunGlow: 0.8,
      clouds: { ...CLOUDS, coverage: 0.28, lit: '#cfd0e0', shade: '#343a6c' }, clouds2: false,
      lightColor: '#FFE9C4', lightIntensity: 3.3, ambientColor: '#8494dc', groundLight: '#a57c6a', ambientIntensity: 2.0 },
    el: 17, fog: '#4c5890', density: 0.0012, exposure: 1.08, night: 0, wet: [0.75, 0.5], shade: 0.5, rain: 0, fanK: 1, lamp: 0, beam: 0.3,
    portal: '#bfeee0', grade: { tint: '#fbfaf6', shadowTint: '#10142e', saturation: 1.08 }, cloudLit: '#f6efdc', cloudShade: '#2c3266', sea: ['#18224e', '#1D6E72'],
  },
  gold: {
    title: 'Storm Light on the Malecón',
    sky: { preset: 'sunset', zenith: '#272c66', mid: '#262a5c', horizon: '#2e2c56', ground: '#16162e', horizonPow: 2.2, midPow: 1.1,
      scatterColor: '#ffb768', scatter: 1.5, scatterPow: 7, scatterHigh: 0.03, scatterFall: 3, sunColor: '#ffc27a', sunSize: 1.3, sunIntensity: 13, sunGlow: 1.0,
      clouds: { ...CLOUDS, coverage: 0.5, lit: '#ffc98a', shade: '#2c2c5a' }, clouds2: false,
      lightColor: '#ffb45c', lightIntensity: 3.8, ambientColor: '#6a70c4', groundLight: '#8a6450', ambientIntensity: 2.0, lightElevationMin: 6 },
    el: 7, fog: '#3f3c6c', density: 0.0013, exposure: 1.24, night: 0.12, wet: [0.8, 0.4], shade: 0.65, rain: 0, fanK: 1, lamp: 0.3, beam: 0.6,
    portal: '#ffd9a0', grade: { tint: '#fff6ea', shadowTint: '#0e1034', saturation: 1.1 }, cloudLit: '#ffcf96', cloudShade: '#2a2a56', sea: ['#1a1c40', '#3a5a58'],
  },
  dawn: {
    title: 'Blue Dawn on the Malecón',
    sky: { preset: 'dawn', zenith: '#1c2a66', mid: '#2a3f86', horizon: '#4d6aa8', ground: '#1a2446', horizonPow: 2.6, midPow: 1.2,
      scatterColor: '#e6a488', scatter: 0.8, scatterPow: 6, scatterHigh: 0.03, scatterFall: 4, sunIntensity: 0, sunGlow: 0.3, stars: 0.1,
      clouds: { ...CLOUDS, lit: '#8fa0d0', shade: '#1c2450' }, clouds2: false,
      lightColor: '#a9bcf0', lightIntensity: 1.3, ambientColor: '#5a74c0', groundLight: '#4a3c3a', ambientIntensity: 1.4, lightElevationMin: 14 },
    el: 3, fog: '#34467e', density: 0.0013, exposure: 1.28, night: 0.62, wet: [0.8, 0.4], shade: 0.2, rain: 0, fanK: 1, lamp: 1, beam: 1,
    portal: '#ffd0a0', grade: { tint: '#f4f6ff', shadowTint: '#060a26', saturation: 1.08 }, cloudLit: '#9fb0e0', cloudShade: '#1a2250', sea: ['#101c44', '#225a70'],
  },
  night: {
    title: 'Night Norther',
    sky: { preset: 'blueHour', zenith: '#0b1030', mid: '#111a44', horizon: '#1c2858', ground: '#0a0e22', horizonPow: 2.6, midPow: 1.2,
      scatterColor: '#3a4a8a', scatter: 0.4, scatterPow: 5, sunIntensity: 0, sunGlow: 0.1, stars: 0.25,
      bodies: [],
      clouds: { ...CLOUDS, coverage: 0.5, lit: '#7080b8', shade: '#0c1028', silver: 1.3 }, clouds2: false,
      lightColor: '#8fa6d8', lightIntensity: 1.4, ambientColor: '#4a62a8', groundLight: '#3a2c22', ambientIntensity: 1.05, lightElevationMin: 30 },
    el: 30, fog: '#161e44', density: 0.0014, exposure: 1.32, night: 1, wet: [0.85, 0.3], shade: 0, rain: 0, fanK: 1, lamp: 1.6, beam: 1.3,
    portal: '#ffc890', grade: { tint: '#f6f4ff', shadowTint: '#04071c', saturation: 1.1 }, cloudLit: '#5c6ca8', cloudShade: '#0c1028', sea: ['#070d26', '#143456'],
  },
  rain: {
    title: 'The Front Arrives',
    sky: { preset: 'storm', zenith: '#454c7a', mid: '#535a86', horizon: '#6a7296', ground: '#262a48', horizonPow: 2.4, midPow: 1.2,
      scatterColor: '#aebbd0', scatter: 0.8, scatterPow: 4, scatterHigh: 0.1, scatterFall: 2.4, sunIntensity: 0, sunGlow: 0.25, lightning: 0.16,
      clouds: { ...CLOUDS, coverage: 0.72, lit: '#cfd5e2', shade: '#3a4068' }, clouds2: false,
      lightColor: '#f2ead8', lightIntensity: 2.6, ambientColor: '#6a78b4', groundLight: '#6c6068', ambientIntensity: 1.8, lightElevationMin: 15 },
    el: 20, fog: '#5e6789', density: 0.0019, exposure: 1.18, night: 0.2, wet: [1, 0.1], shade: 0.85, rain: 1, fanK: 1.1, lamp: 0.4, beam: 0.8,
    portal: '#c8e6ee', grade: { tint: '#f6f8fb', shadowTint: '#0a0f30', saturation: 1.02 }, cloudLit: '#d2d8e6', cloudShade: '#383e66', sea: ['#262f52', '#3a6a70'],
  },
  clear: {
    title: 'An Hour Before the Norther',
    sky: { preset: 'day', zenith: '#1c58b8', mid: '#3f7fd0', horizon: '#9fcbe6', ground: '#3a6a9a', horizonPow: 3.2, midPow: 1.4,
      scatterColor: '#fff0d0', scatter: 0.6, scatterPow: 6, scatterHigh: 0.08, scatterFall: 3, sunColor: '#fff2d6', sunSize: 1.2, sunIntensity: 12, sunGlow: 0.7,
      clouds: { ...CLOUDS, coverage: 0.26, lit: '#ffffff', shade: '#8a9cc0' }, clouds2: false,
      lightColor: '#fff0d2', lightIntensity: 3.5, ambientColor: '#7ea6e0', groundLight: '#8a7260', ambientIntensity: 1.5 },
    el: 24, fog: '#8fb4d8', density: 0.0008, exposure: 1.0, night: 0, wet: [0.12, 1.2], shade: 0.3, rain: 0, fanK: 0.55, lamp: 0, beam: 0.2,
    portal: '#d8f6ea', grade: { tint: '#fffdf6', shadowTint: '#0a1a44', saturation: 1.12 }, cloudLit: '#ffffff', cloudShade: '#7f92ba', sea: ['#0d4682', '#1fa0a0'],
  },
};

// ---------- the reference line (wall foot) and the lane the car keeps ----------
function makeLine() {
  const s0 = -160, n = 900, X = new Float32Array(n + 1), Z = new Float32Array(n + 1), i0 = -s0;
  const theta = (s) => (Math.min(Math.max(s, ST.a0), ST.a1) - ST.a0 + Math.min(Math.max(s, ST.h1), ST.b1) - ST.h1) / RW;
  for (let i = i0 + 1; i <= n; i++) { const th = theta(s0 + i - 0.5); X[i] = X[i - 1] - Math.cos(th); Z[i] = Z[i - 1] - Math.sin(th); }
  for (let i = i0 - 1; i >= 0; i--) { X[i] = X[i + 1] + 1; Z[i] = 0; }
  // world point at station s, lateral l (landward), written into out as [x, z]; returns out
  const at = (s, l, out = [0, 0]) => {
    const f = Math.min(Math.max(s - s0, 0), n - 1e-3), i = Math.floor(f), k = f - i, th = theta(s);
    out[0] = X[i] + (X[i + 1] - X[i]) * k - Math.sin(th) * l; out[1] = Z[i] + (Z[i + 1] - Z[i]) * k + Math.cos(th) * l;
    return out;
  };
  return { at, theta, v3: (s, l, y, out = new THREE.Vector3()) => { const p = at(s, l); return out.set(p[0], y, p[1]); } };
}
// (round 19) LANE_HOME: the station where our own car is back in its lane after its swing round the square (laneOf's last number,
// said once: the stream's lanes of our way begin there)
const LANE_HOME = 276;
const laneOf = (s) => 9 + 3.5 * sm(70, 115, s) + 5.75 * sm(176, 215, s) - 9.25 * sm(222, LANE_HOME, s);

// ---------- shared GLSL ----------
const GLSL_N = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * vn(p) + 0.25 * vn(p * 2.03 + 11.) + 0.125 * vn(p * 4.1 + 23.) + 0.0625 * vn(p * 8.2 + 37.); }
float veins(vec2 p){ float a = abs(fbm(p) - 0.47), b = abs(fbm(p * 1.9 + 17.3) - 0.47); return min((1. - smoothstep(0.0, 0.075, a)) * 0.8 + (1. - smoothstep(0.0, 0.05, b)) * 0.55, 1.); }
`;
// the kit sky's clear-sky gradient, so every mirror in this world reflects the sky that is drawn
const GLSL_SKY = /* glsl */`
uniform vec3 uZenith, uMid, uHorizon, uScatterColor, uSunDir, uLDir; uniform vec4 uGrad, uGrad2;
vec3 skyAt(vec3 d){
  float inv = 1. - clamp(d.y, 0., 1.);
  vec3 c = mix(uZenith, uMid, pow(inv, uGrad2.x));
  c = mix(c, uHorizon, pow(inv, uGrad.x));
  float side = clamp(.5 + .5 * dot(d, uSunDir), 0., 1.);
  float sc = pow(side, uGrad.z) * mix(uGrad2.y, 1., pow(inv, uGrad2.z));
  return mix(c, uScatterColor, clamp(sc * uGrad.y, 0., 1.));
}
`;
const GLSL_FOGF = /* glsl */`
float fogK(){
  #ifdef USE_FOG
    return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return 0.;
  #endif
}
vec3 fogC(){
  #ifdef USE_FOG
    return fogColor;
  #else
    return vec3(0.);
  #endif
}
`;
const VERT_W = /* glsl */`
  vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;

// ---------- the wet road: a sky backstop, the mirrored town under it, a depth seal, then the surface ----------
const ROAD_VERT = /* glsl */`
  attribute vec2 aSL; varying vec3 vW; varying vec2 vSL;
  #include <fog_pars_vertex>
  void main(){ vSL = aSL; ${VERT_W} }`;
function makeRoadMaterials(U) {
  const base = () => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U });
  const surface = new THREE.ShaderMaterial({
    fog: true, transparent: true, premultipliedAlpha: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    uniforms: base(), vertexShader: ROAD_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb, uLampCol, uCloudCol, uPortCol, uFoamLamp; uniform float uTime, uShade, uFlood, uMirK; uniform vec2 uWet; uniform vec4 uFan[6], uSlab, uFanSh, uCar[${NVEH}], uLamp[8], uPort;
      varying vec3 vW; varying vec2 vSL;
      #include <fog_pars_fragment>
      ${GLSL_N}${GLSL_SKY}${GLSL_FOGF}${LAMP_GLSL}
      void main(){
        vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
        vec2 p = vW.xz; float street = step(50., vSL.y);
        float inSlab = smoothstep(uSlab.x - .8, uSlab.x + .8, p.y) * (1. - smoothstep(uSlab.y - .8, uSlab.y + .8, p.y)) * (1. - smoothstep(uSlab.z - 1.5, uSlab.z + 1.5, p.x));
        float sun = mix(1., inSlab, street);
        sun *= 1. - uShade * smoothstep(.42, .62, fbm(p * .012 + uTime * vec2(.1, .055)));
        vec2 dsh = vSL - uFanSh.xy; sun *= 1. - uFanSh.w * exp(-dot(dsh, dsh) / max(uFanSh.z * uFanSh.z, 1.));
        float occ = 0., beam = 0., wakeF = 0.;                        // soft contact shadows under every vehicle (x, z, heading, speed), the pool of its headlamps ahead
        for (int i = 0; i < ${NVEH}; i++) {
          // (round 19) a vehicle further from this point of the road than its shadow, its wake and its lamps' pool reach (34 m ahead of
          // our own car, 20 m ahead of another) adds nothing here and is passed over: the same picture, and a longer list costs less than live's
          vec4 c = uCar[i]; vec2 r0 = p - c.xy; if (dot(r0, r0) > (i == 0 ? 3600. : 900.)) continue;
          vec2 fw = vec2(cos(c.z), sin(c.z)), rel = p - c.xy - uLDir.xz * -.5;
          float lx = dot(rel, fw), ly = dot(rel, vec2(-fw.y, fw.x));
          float own = 1. - step(.5, float(i));           // slot 0 is our own car: no contact patch under the eye, a wider and longer pool of light ahead
          occ = max(occ, (1. - smoothstep(1.7, 2.9, abs(lx))) * (1. - smoothstep(.6, 1.25, abs(ly))) * (1. - own));
          // on a flooded road every vehicle pushes a bow wake: two foam lines opening behind its nose
          vec2 r2 = p - c.xy; float bx = 2.3 - dot(r2, fw), by = abs(dot(r2, vec2(-fw.y, fw.x)));
          wakeF = max(wakeF, (1. - smoothstep(.04, .13 + .014 * bx, abs(by - .55 - bx * .3 - .12 * sin(bx * 2.1 + uTime * 3.)))) * step(0., bx) * (1. - smoothstep(1.5, 9., bx)) * step(.5, abs(c.w)));
          beam = max(beam, smoothstep(mix(2.3, .6, own), mix(5., 3.5, own), lx) * (1. - smoothstep(mix(7., 12., own), mix(20., 34., own), lx)) * exp(-ly * ly / (mix(.8, 3., own) + mix(.03, .06, own) * lx * lx)) * step(.5, abs(c.w)) * (1. + .5 * own));
        }
        sun *= 1. - .85 * occ;
        float a1 = fbm(p * .33), grain = .6 * vn(mat2(.8, -.6, .6, .8) * p * 13.) + .4 * vn(mat2(.6, .8, -.8, .6) * p * 23. + 7.);
        float nearK = 1. - smoothstep(8., 34., dist);
        float grainK = 1. + .6 * (grain - .5) * (1. - smoothstep(2.5, 6., dist));
        vec3 alb = mix(vec3(.06, .062, .07), vec3(.16, .15, .14), a1) * grainK;
        alb *= 1. - .3 * smoothstep(.55, .6, fbm(p * .37 + 31.));
        alb = mix(alb, alb * 1.55 + .01, smoothstep(.6, .62, fbm(p * .17 + 7.3)) * (1. - street));          // newer patches
        float lz = (vSL.y - 5.25) / 3.;
        float seam = (1. - smoothstep(0., .03, abs(fract(lz + .5) - .5))) * (1. - street);
        alb *= 1. - .4 * seam * (.4 + .6 * vn(vec2(vSL.x * .5, vSL.y * 3.)));
        alb *= 1. - .22 * nearK * (1. - smoothstep(0., .018, abs(vn(p * .8 + 50.) - .5)));
        // faded lane paint: dashes between lanes, a double line down the middle; none on the apron
        float lb = min(min(abs(vSL.y - 10.75), abs(vSL.y - 17.75)), abs(vSL.y - 20.75));
        float paint = (1. - smoothstep(.06, .1, lb)) * step(fract(vSL.x / 9.), .36) + (1. - smoothstep(.04, .07, abs(abs(vSL.y - 14.25) - .13)));
        paint *= smoothstep(.3, .62, fbm(p * 1.1 + 3.)) * (1. - street) * (1. - step(606., vSL.x)) * .6;
        alb = mix(alb, vec3(.46, .44, .36), paint);
        alb = mix(alb, vec3(.42, .4, .36), (1. - smoothstep(.1, .22, abs(length(vSL - vec2(626., 9.)) - 15.1))) * step(609., vSL.x) * (1. - street) * .7);
        // the side street is setts, drier and warmer
        float sett = smoothstep(.03, .09, abs(fract(p.x * 2.4 + floor(p.y * 3.6) * .5) - .5)) * smoothstep(.04, .12, abs(fract(p.y * 3.6) - .5));
        alb = mix(alb, alb * vec3(1.5, 1.34, 1.15) * mix(.92, .5 + .7 * sett, 1. - smoothstep(16., 55., dist)), street);
        float pud = smoothstep(.34, .6, fbm(p * .085 + 3.3) * .75 + vn(p * .31 + 9.) * .3);
        float wet = clamp(uWet.x + (pud - .5) * uWet.y, 0., 1.) * mix(1., .3 + .35 * pud, street) * (1. - .5 * paint);
        float foam = 0.;
        for (int i = 0; i < 6; i++) {             // (slots 4 and 5: the breakers behind the portal, whose water runs back across the apron toward the car)
          vec4 f = uFan[i]; float x = mix(f.x - vSL.x, vSL.y - f.x, f.w), z = mix(vSL.y, 653. - vSL.x, f.w), tau = f.y;
          float env = smoothstep(1.4, 2.6, tau) * (1. - smoothstep(5.6, 8.6, tau));
          float reach = clamp((tau - 1.5) * 6.2 * (1. + f.w), 0., 25. + 35. * f.w) * f.z * (1. - smoothstep(11. * f.z, 31. * f.z, abs(x))) * (.72 + .5 * fbm(vec2(x * .16, 3.7 + f.x)));
          float on = step(.5, reach) * env;
          float inS = (1. - smoothstep(reach - 4., reach, z)) * on;
          float flowS = 5.5 * min(tau, 5.2) - 2.2 * max(tau - 5.2, 0.);
          float lacef = veins(vec2(x * .5, (z - flowS) * .3));
          float edge = (1. - smoothstep(0., 1.6, abs(z - reach))) * on;
          foam = max(foam, clamp(inS * lacef * .8 + edge * (.2 + .7 * lacef), 0., 1.));
          wet = max(wet, inS * .95);
        }
        foam = max(foam, wakeF * uFlood * .75 * smoothstep(.2, .6, vn(p * 2.7 + uTime * vec2(.9, .4))));
        // ripples: five short wave trains crossing at odd angles on a slowly warped field (never lattice noise: its grid shows as a
        // chequer in the mirror), fading with distance
        float cf = 1. / (1. + dist * .08);
        vec2 wq = p + 1.3 * vec2(vn(p * .21 + 3.), vn(p * .21 + 17.));
        float c1 = cos(dot(wq, vec2(.80, .60)) * 2.3 + uTime * 1.9), c2 = cos(dot(wq, vec2(-.45, .89)) * 3.1 - uTime * 2.3 + 1.7), c3 = cos(dot(wq, vec2(.97, -.24)) * 4.4 + uTime * 2.9 + 4.1);
        float c4 = cos(dot(wq, vec2(.28, .96)) * 5.9 - uTime * 3.4 + 2.6), c5 = cos(dot(wq, vec2(-.87, -.50)) * 1.5 + uTime * 1.3 + 5.2);
        // (each train lives in its own drifting patches, so one direction leads at any spot: cat's paws, never a woven lattice)
        float m1 = smoothstep(.3, .7, vn(p * .31 + 11.)), m2 = smoothstep(.3, .7, vn(p * .27 + 23.)), m3 = smoothstep(.3, .7, vn(p * .23 + 37.));
        c1 *= m1; c2 *= m2 * (1. - m1); c3 *= m3 * (1. - m2) * (1. - m1) * .7; c4 *= (1. - m1) * (1. - m2) * (1. - m3) * .6; c5 *= .5;
        float rx = .80 * c1 - .45 * c2 + .97 * c3 + .28 * c4 - .87 * c5, rz = .60 * c1 + .89 * c2 - .24 * c3 + .96 * c4 - .50 * c5;
        float rs = mix(mix(.02, .034, uMirK), .05, uFlood) * wet * cf;
        vec3 N = normalize(vec3(rx * rs, 1., rz * rs));
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        // (where water stands on the road it mirrors from a steeper angle than damp asphalt does: the sky and its cloud come close to the car)
        float g = 1. - clamp(dot(N, V), 0., 1.); float g2 = g * g; float Fr = .04 + .96 * g2 * g * mix(g2, sqrt(g), uMirK);
        float refl = Fr * (.22 + .78 * wet) * (1. - foam);
        // gusts roughen the flood in drifting patches (cat's-paws): there the mirror dulls
        refl *= 1. - .3 * uFlood * (1. - smoothstep(.35, .65, vn(p * .06 + uTime * vec2(.08, .05))));
        // (the side street's setts take the light bounced down off its sunlit upper storeys, and stay drier)
        vec3 lit = alb * (uSunCol * (max(uLDir.y, 0.) * sun + .2 * street) + uAmb * (1. - .55 * occ)) * (1. - .45 * wet * (1. - .6 * street));
        // (round 13: the fallen water's foam takes the wall's standards by place, as the fans it fell from do: see LAMP_GLSL in the parts)
        vec3 surf = mix(lit, vec3(.92, .96, .95) * (uSunCol * (.8 * sun + .1) + uAmb * 1.1 + uFoamLamp * wallLamps(vSL.x, vSL.y, 0.)), foam);
        float sd = max(dot(normalize(R), uLDir), 0.); float gl = pow(sd, 420.);
        vec3 add = uSunCol * gl * 1.1 * wet * sun;
        float camH = max(cameraPosition.y, .2);
        add += vec3(1., .8, .58) * dot(uLampCol, vec3(.2)) * beam * (alb * 1.7 + .012 * wet);
        // every lamp lays a narrow streak from its foot toward the eye, broken into dashes by the ripples on the standing water,
        // and a soft pool of its own light on the asphalt round its foot
        float shim = (vn(p * 1.9 + vec2(uTime * 1.1, -uTime * .8)) - .5) * .6 * wet;
        for (int i = 0; i < 8; i++) {
          vec3 L = uLamp[i].xyz; vec2 e = L.xz - cameraPosition.xz; float D = length(e) + 1e-3; e /= D;
          vec2 rel = p - cameraPosition.xz; float al = dot(rel, e), pe = rel.x * e.y - rel.y * e.x;
          float q = D * camH / (camH + L.y), w = .1 + .0045 * max(al, 0.), ln = (al - q) / (.5 * D + 3.);
          float dash = smoothstep(.3, .7, vn(vec2(pe * 4., al * 1.1 - uTime * 1.6)));
          pe += shim * w;
          add += uLampCol * uLamp[i].w * exp(-pe * pe / (w * w)) * exp(-ln * ln) * step(0., al) * (1. - smoothstep(D - 2., D + 1., al)) * wet * (20. / (20. + D)) * (.25 + 1.5 * dash);
          vec2 dl = p - L.xz;
          add += uLampCol * alb * uLamp[i].w * step(2., L.y) * 1.1 / (1. + dot(dl, dl) * .07);
        }
        { // the portal's own light lies on the wet apron as a broad broken path
          vec2 e = uPort.xz - cameraPosition.xz; float D = length(e) + 1e-3; e /= D;
          vec2 rel = p - cameraPosition.xz; float al = dot(rel, e), pe = rel.x * e.y - rel.y * e.x, w = 1.6 + .03 * max(al, 0.);
          float dash = .35 + .65 * smoothstep(.25, .7, vn(vec2(pe * 1.3, al * .8 - uTime * 1.3)));
          vec2 dl = p - uPort.xz;
          add += uPortCol * uPort.w * (exp(-pe * pe / (w * w)) * step(0., al) * (1. - smoothstep(D - 3., D, al)) * smoothstep(D - 70., D - 12., al) * (.35 + .65 * wet) * dash + alb / grainK * 1.6 / (1. + dot(dl, dl) * .02));
        }
        add += uLampCol * .13 * smoothstep(9., 26., vSL.y) * (1. - street) * (alb * 2. + .3 * wet * Fr) * (.6 + .4 * vn(vec2(vSL.x * .14, 3.)));
        float fk = fogK();
        gl_FragColor = vec4((surf * (1. - refl) + add) * (1. - fk) + fogC() * fk, 1. - refl * (1. - fk));
      }`,
  });
  // what the mirror shows where nothing stands: the sky, seen by reflection
  const back = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false, uniforms: base(),
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`varying vec3 vW; uniform float uTime, uFlood, uMirK; uniform vec3 uCloudCol; ${GLSL_N}${GLSL_SKY}
      void main(){
        vec3 Vv = cameraPosition - vW + vec3(0., 1e-4, 0.); float dist = length(Vv); vec3 V = Vv / dist;
        // the standing water is never glass: two crossing trains of ripples and the gusts' cat's-paws bend what it mirrors
        vec2 p = vW.xz, wq = p + 1.3 * vec2(vn(p * .21 + 3.), vn(p * .21 + 17.));
        float m1 = smoothstep(.3, .7, vn(p * .31 + 11.)), gust = 1. - smoothstep(.35, .65, vn(p * .06 + uTime * vec2(.08, .05)));
        float c1 = cos(dot(wq, vec2(.80, .60)) * 2.3 + uTime * 1.9) * m1, c2 = cos(dot(wq, vec2(-.45, .89)) * 3.1 - uTime * 2.3 + 1.7) * (1. - m1);
        float rk = mix(mix(.012, .028, uMirK), .03 + .03 * gust, uFlood) / (1. + dist * .03);
        vec3 R = normalize(vec3(-V.x + (.8 * c1 - .45 * c2) * rk, abs(V.y) + .01 + abs(c1 + c2) * rk * .6, -V.z + (.6 * c1 + .89 * c2) * rk));
        // the torn cloud that is drawn overhead, and low down the bright roll of the shelf cloud over the sea
        float cl = smoothstep(mix(.4, .34, uMirK), mix(.68, .6, uMirK), fbm(R.xz / (R.y + .3) * .8 + vW.xz * .0009 + uTime * vec2(.006, .004)));
        float seaward = .5 + .5 * dot(R.xz / max(length(R.xz), 1e-4), vec2(-.6, -.8));
        cl = max(cl * smoothstep(0., .06, R.y) * mix(.8, 1., uMirK), uMirK * .6 * (1. - smoothstep(.02, .22, R.y)) * (.3 + .7 * seaward));
        vec3 col = mix(skyAt(R), uCloudCol, cl) * .9;
        col *= 1. - .16 * uFlood * gust;
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const seal = new THREE.ShaderMaterial({
    colorWrite: false,
    vertexShader: /* glsl */`void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; }`,
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }',
  });
  return { surface, back, seal };
}
// the town upside down under the road: facade shells (kit Builder geometry) redrawn by a small unlit program
function makeMirrorMaterial(U, sunVis) {
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uSunVis: { value: sunVis } },
    vertexShader: /* glsl */`
      attribute vec3 win; uniform float uTime; varying vec3 vCol, vWin, vW, vN; varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); float d = max(-wp.y, 0.), a = min(d * .014, .3);
        wp.x += sin(wp.z * .9 + uTime * 1.7 + d * .8) * a; wp.z += cos(wp.x * .8 - uTime * 1.3 + d * .6) * a;
        vW = wp.xyz; vN = mat3(modelMatrix) * normal; vCol = color; vWin = win; vUv = uv;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb, uGnd; uniform float uSunVis, uNight; varying vec3 vCol, vWin, vW, vN; varying vec2 vUv;
      #include <fog_pars_fragment>
      ${GLSL_SKY}
      float h21m(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        if (vW.y > -.02) discard;
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); N.y = -N.y;
        float st = floor(vWin.x + .5); vec3 base = vCol, glow = vec3(0.);
        if ((st > .5 && st < 7.5) || (st > 8.5 && st < 9.5)) {
          vec2 f = fract(vUv);
          float m = smoothstep(.16, .24, f.x) * (1. - smoothstep(.76, .84, f.x)) * smoothstep(.12, .2, f.y) * (1. - smoothstep(.8, .88, f.y));
          base = mix(base, vec3(.03, .045, .07), m * .85);
          // by night nearly half the windows are lit, and the wet road carries them as amber smears
          glow = vec3(1., .62, .25) * .7 * m * step(.55, h21m(floor(vUv) + st + floor(vWin.y * 7.))) * smoothstep(.5, .6, uNight);
        }
        vec3 col = base * (mix(uGnd, uAmb, .5 + .5 * N.y) + uSunCol * max(dot(N, uLDir), 0.) * uSunVis) + glow;
        vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
        float fade = exp(vW.y * .03) * (1. - smoothstep(200., 330., dist));
        col = mix(skyAt(normalize(vec3(-V.x, abs(V.y) + .01, -V.z))) * .9, col, fade * .92);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- gloss: car paint, chrome, glass, rubber (ours and everyone else's), lit by the sky this world draws ----------
// aM: 0 paint, 1 chrome, 2 glass, 3 matte, 4 lamp. own: our car (canopy shadow on the bonnet, water sheeting back)
function makeGlossMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uSunVis: o.sunVis || { value: 1 }, uFlip: { value: o.flip ? -1 : 1 },
      uShadeLine: o.shadeLine || { value: new THREE.Vector2(9, 0) }, uSheet: o.sheet || { value: 0 }, uOwn: { value: o.own ? 1 : 0 }, uGround: { value: new THREE.Color(0.03, 0.035, 0.06) },
      uLampPh: o.lampPh || { value: 0 }, uCloudCol: o.cloud || { value: new THREE.Color(0.5, 0.5, 0.55) }, ...(o.veh ? { uVeh: { value: o.veh } } : {}) },
    // (round 19) o.veh: the stream's cars in one mesh: each vertex carries its car's place in the list (aV) and is set on the road
    // here by that car's x, z and heading, with the small bounce on the seams every car of the traffic has (live's sum, by its number)
    vertexShader: o.veh ? /* glsl */`
      attribute float aM, aV; uniform vec4 uVeh[${NVEH}]; uniform float uTime; varying vec3 vW, vN, vCol, vL; varying float vM;
      #include <fog_pars_vertex>
      void main(){ vL = position; vCol = color; vM = aM;
        vec4 v = uVeh[int(aV + .5)]; vec2 f = vec2(cos(v.z), sin(v.z));
        vec3 P = vec3(v.x + f.x * position.z + f.y * position.x, position.y + abs(sin(uTime * 6.3 + (aV - 1.) * 2.1)) * .012, v.y + f.y * position.z - f.x * position.x);
        vN = mat3(modelMatrix) * vec3(f.x * normal.z + f.y * normal.x, normal.y, f.y * normal.z - f.x * normal.x);
        vec4 wp = modelMatrix * vec4(P, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }` : /* glsl */`
      attribute float aM; varying vec3 vW, vN, vCol, vL; varying float vM;
      #include <fog_pars_vertex>
      void main(){ vL = position; vN = mat3(modelMatrix) * normal; vCol = color; vM = aM; ${VERT_W} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb, uGnd, uGround, uSheen, uCloudCol; uniform float uSunVis, uFlip, uSheet, uOwn, uTime, uNight, uLampPh; uniform vec2 uShadeLine;
      varying vec3 vW, vN, vCol, vL; varying float vM;
      #include <fog_pars_fragment>
      ${GLSL_N}${GLSL_SKY}
      void main(){
        if (uFlip < 0. && vW.y > -.01) discard;
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (uFlip < 0.) N.y = -N.y;
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.)); if (uFlip < 0.) V.y = -V.y;
        float chrome = step(.5, vM) * (1. - step(1.5, vM)), glass = step(1.5, vM) * (1. - step(2.5, vM)), matte = step(2.5, vM) * (1. - step(3.5, vM)), lamp = step(3.5, vM);
        float sv = uSunVis * (1. - uShadeLine.y * smoothstep(uShadeLine.x - .3, uShadeLine.x + .3, -vL.z));
        float ndl = max(dot(N, uLDir), 0.);
        vec3 R = reflect(-V, N);
        vec3 env = mix(uGround + uAmb * .05, skyAt(normalize(vec3(R.x, abs(R.y) + .01, R.z))), smoothstep(-.12, .06, R.y));
        // chrome is a neutral, darker mirror: sky and horizon greyed, the ground line kept, so it never reads as a blue overlay
        float lum = dot(env, vec3(.3, .55, .15));
        env = mix(env, (mix(vec3(lum), env, .3) * 1.05 + uHorizon * .12 + uAmb * .22) * (.4 + .6 * smoothstep(-.1, .45, R.y)), chrome);
        // our own paint mirrors the scud racing over
        if (uOwn > .5) env = mix(env, uCloudCol, .6 * smoothstep(.42, .68, fbm(R.xz / (abs(R.y) + .2) * 1.4 + uTime * .05)) * smoothstep(0., .15, R.y));
        vec3 alb = vCol * mix(1., .6, uOwn * smoothstep(.5, 1., uNight));
        float fr = 1. - clamp(dot(N, V), 0., 1.); float f5 = fr * fr * fr * fr * fr;
        float Fr = mix(.06 + .55 * f5, .84, chrome); Fr = mix(Fr, .14 + .8 * f5, glass); Fr *= 1. - matte;
        vec3 col = alb * (mix(uGnd, uAmb, .5 + .5 * N.y) + uSunCol * ndl * sv) * (1. - chrome * .8);
        col = mix(col, env * mix(vec3(1.), vCol + .25, chrome * .35), Fr);
        float sp = max(dot(R, uLDir), 0.); float s2 = sp * sp; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;
        col += uSunCol * s2 * sv * mix(.8, 2.8, chrome) * (1. - matte);
        col += vCol * lamp * (2.2 + 7. * uNight);
        // lamp light at dawn and night: paint keeps its colour, chrome and glass catch a warm line
        float upk = .35 + .65 * max(N.y, 0.), ry = max(R.y, 0.);
        col += uSheen * (alb * upk * .55 * (1. - chrome) * (1. - glass) * (1. - lamp) + (chrome * .9 + glass * .2) * ry * ry);
        // a bright line along every chrome tube and trim, where it turns to the sky above the viewer
        vec3 Hh = normalize(V + vec3(0., 1.3, 0.)); float hl = max(dot(N, Hh), 0.); hl *= hl; hl *= hl; hl *= hl; hl *= hl;
        col += chrome * hl * (uAmb * 2.6 + uSunCol * .35 * uSunVis + uSheen * 1.2) * (1. + 1.5 * uOwn);
        col += chrome * uOwn * (uAmb * .8 + uSunCol * .1 * uSunVis + uSheen * .45) * (.5 + .5 * max(N.y, 0.));
        if (uOwn > .5) {
          vec2 q = vec2(vL.x * 14., vL.z * .9 - uTime * 5.);                    // thin rivulets driven back by the wind
          float lace = smoothstep(.68, .78, fbm(q)) * min(uSheet * 1.6, 1.) * (1. - chrome);
          float cx = floor(vL.x * 34.);                                           // beads crawl back up the bonnet, each file at its own pace
          vec2 c = vec2(vL.x * 34., (vL.z - uTime * (.2 + .5 * h21(vec2(cx, 3.7)))) * 34.); vec2 id = floor(c); float h = h21(id);
          float bead = step(.965 - .3 * uSheet, h) * (1. - smoothstep(.06, .2, length(fract(c) - .5 - (vec2(h21(id + 3.), h21(id + 7.)) - .5) * .5)));
          col = mix(col, vec3(.9, .95, .94) * (uSunCol * (.25 + .7 * sv) + uAmb), lace * .4);
          col += (uSunCol * sv * .9 + uAmb * .5) * lace * smoothstep(.55, .8, vn(q * vec2(1.7, 6.) + 3.1)) * .5;
          col += (uSunCol * sv + uAmb) * bead * .22 * step(.5, N.y);
          float zb = mix(-2.5, -.75, uLampPh), gz = (vL.z - zb) / .2, gx = (vL.x - .42) / .34;      // each lamp standard passing: its glint runs up the bonnet
          col += uSheen * (vCol + .12) * exp(-gz * gz - gx * gx) * 3.2 * smoothstep(0., .2, uLampPh) * (1. - smoothstep(.8, 1., uLampPh)) * step(.3, N.y) * (1. - matte);
          // (round 15) and the lantern itself in the lacquer: a small warm light, longer than wide, that rides in the middle of that glint
          float lz = (vL.z - zb) / .34, lx = (vL.x - .42 - .05 * sin(vL.z * 9.)) / .07;
          col += uSheen * exp(-lz * lz - lx * lx) * 2.6 * smoothstep(0., .2, uLampPh) * (1. - smoothstep(.8, 1., uLampPh)) * step(.3, N.y) * (1. - matte) * (1. - chrome);
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the lens: with the top down there is no glass, so the whiteout lands on the eye itself. One veil of foam when the
// curtain comes down, torn open from the middle by the wind into streaks that run outward, and beads that drain off after it
function makeLensMaterial(U, G) {
  return new THREE.ShaderMaterial({
    transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: false,
    uniforms: { uSunCol: U.uSunCol, uAmb: U.uAmb, uTime: U.uTime, uSoak: G.soak, uWhite: G.white, uTear: G.tear, uBead: G.bead },
    vertexShader: /* glsl */`varying vec2 vG;
      void main(){
        vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        vG = c.xy / max(c.w, 1e-4) * vec2(projectionMatrix[1][1] / max(projectionMatrix[0][0], 1e-4), 1.);
        gl_Position = c;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb; uniform float uTime, uSoak, uWhite, uTear, uBead;
      varying vec2 vG;
      ${GLSL_N}
      void main(){
        vec2 g = vG; vec3 light = uSunCol * .95 + uAmb * 1.3;
        float r = length(g) + 1e-4; vec2 dir = g / r;
        float foamN = min(.62 + .3 * fbm(g * vec2(3.2, 2.4) + vec2(0., -uTime * 2.5)) + .11 * veins(g * 1.5 + vec2(0., -uTime * 1.8)), 1.);
        float n = .6 * vn(dir * 5. + vec2(3.1, r * 1.2 - uTime * 1.5)) + .4 * vn(dir * 17. + vec2(r * 3. - uTime * 4., 8.7));
        float bias = n * .6 + .4 * smoothstep(0., 1.3, r);
        float veil = uWhite * (1. - smoothstep(bias - .12, bias + .12, uTear * 1.3 - .15));
        // as it lands the water is a sheet running down the eye, before the wind tears it open
        float sheetK = uWhite * (1. - smoothstep(0., .35, uTear));
        foamN = min(foamN + .3 * sheetK * smoothstep(.25, .75, vn(vec2(g.x * 7., g.y * 1.4 + uTime * 9.))), 1.);
        float a = clamp(veil * foamN, 0., .97);
        vec3 col = vec3(.9, .95, .94) * light * a;
        col += light * .3 * veins(g * 2.2 + vec2(0., -uTime * 3.)) * a;
        // streaks the wind drives outward: never ruled lines, each wanders a little and runs in broken lengths
        vec2 wob = dir + .07 * (vec2(vn(g * 2.3 + uTime * .3), vn(g * 2.3 + 9.1 - uTime * .3)) - .5);
        float sk = smoothstep(.84, .98, vn(wob * 21. + vec2(5.3, r * 2.4 - uTime * 1.9)));
        sk *= smoothstep(.3, .62, vn(vec2(dot(dir, vec2(37., 91.)), r * 11. - uTime * 3.5))) * smoothstep(.4, 1.05, r) * uSoak;
        vec2 c = (g - dir * (1. - uBead) * .25) * 24.; vec2 id = floor(c); float h = h21(id); vec2 o = (vec2(h21(id + 3.1), h21(id + 7.7)) - .5) * .6;
        float rr = .05 + .13 * h21(id + 1.3), d = length(fract(c) - .5 - o);
        float on = step(1. - uBead * .45, h);
        float bead = on * (1. - smoothstep(rr * .7, rr, d));
        float hi = on * (1. - smoothstep(0., rr * .45, length(fract(c) - .5 - o - vec2(-.3, .35) * rr)));
        float ab = bead * .13 * (1. - a); col += light * .4 * ab; a += ab;
        float ah = (hi * .55 + sk * .18) * (1. - a); col += light * 1.3 * ah; a += ah;
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// ---------- cloth: laundry, awnings, bunting, the torn curtain, sagging wires (one merged mesh) ----------
function makeCloth(U) {
  const P = [], C = [], A = [], I = [], pixel = { value: 0.002 };
  // a grid between four corners (p00 top-left, p10 top-right, p01 bottom-left, p11 bottom-right); pin(u, v) = how free a vertex is
  // thin = 1 marks a string: its lower edge drops with distance so the ribbon never falls under about 1.6 pixels
  const add = (p00, p10, p01, p11, nu, nv, col, pin, amp, lit = 1, sag = 0, thin = 0) => {
    const base = P.length / 3, ph = (p00[0] * 0.37 + p00[2] * 0.51 + p00[1] * 0.23) % TAU;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, c = typeof col === 'function' ? col(u, v) : col;
      for (let k = 0; k < 3; k++) P.push(mix(mix(p00[k], p10[k], u), mix(p01[k], p11[k], u), v) - (k === 1 ? sag * 4 * u * (1 - u) : 0));
      C.push(c[0], c[1], c[2]); A.push(pin(u, v) * amp, ph + u * 2.1 + v * 1.3, lit, thin && j === nv ? 1 : 0);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + nu + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  };
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I); g.computeBoundingSphere();
    const m = new THREE.ShaderMaterial({
      fog: true, vertexColors: true, side: THREE.DoubleSide,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uPixel: pixel },
      vertexShader: /* glsl */`
        attribute vec4 aC; uniform float uTime, uPixel; uniform vec3 uWindDir; varying vec3 vW, vCol; varying float vLit;
        #include <fog_pars_vertex>
        void main(){
          vec3 p = position; float w = aC.x, ph = aC.y;
          float gust = .55 + .45 * sin(uTime * .7 + p.x * .05 + p.z * .07);
          float f = sin(uTime * 5.3 + ph * 3.) * .45 + sin(uTime * 8.9 + ph * 5.3) * .25 + .9;
          p += uWindDir * (w * gust * f) + vec3(0., w * gust * (.35 + .25 * sin(uTime * 6.7 + ph * 4.)), 0.);
          // cloth flutters across the wind as well as streaming down it: seen along the wind (the side street) it still moves
          p += vec3(-uWindDir.z, 0., uWindDir.x) * (w * (.4 + .6 * gust) * (.5 * sin(uTime * 7.1 + ph * 4.3) + .3 * sin(uTime * 11.3 + ph * 7.1)));
          vCol = color; vLit = aC.z;
          vec4 wp = modelMatrix * vec4(p, 1.);
          wp.y -= aC.w * max(0., 1.6 * uPixel * distance(cameraPosition, wp.xyz) - .035); vW = wp.xyz;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunCol, uAmb, uGnd, uLDir; uniform vec4 uStreet; varying vec3 vW, vCol; varying float vLit;
        #include <fog_pars_fragment>
        void main(){
          vec3 dx = dFdx(vW), dy = dFdy(vW); vec3 N = normalize(cross(dx, dy) + vec3(0., 1e-6, 0.));
          float sv = vLit;
          if (vLit < .5) {    // inside the side street: lit only above the shadow of the east roofline, or in the gap of the shell
            float line = uStreet.y - (uStreet.x - vW.x) * uStreet.z;
            sv = max(smoothstep(-.4, .4, vW.y - line), smoothstep(uStreet.w - 1., uStreet.w + 1., vW.z) * (1. - smoothstep(uStreet.w + 13., uStreet.w + 15., vW.z)) * smoothstep(1.5, 2.5, vW.y - (uStreet.x - vW.x) * uStreet.z));
          }
          float nl = dot(N, uLDir);
          vec3 col = vCol * ((uAmb + uGnd) * .62 + uSunCol * sv * (abs(nl) * .75 + .25 + .35 * max(-nl * sign(dot(N, cameraPosition - vW)), 0.)));
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(g, m), size = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => { renderer.getDrawingBufferSize(size); pixel.value = 2 / Math.max(1, camera.projectionMatrix.elements[5] * size.y); };
    return mesh;
  };
  return { add, build };
}

// ---------- spray thrown by wheels: rooster tails behind every vehicle, a bow wave at our own front corners ----------
function makeSpray(U, nVeh, per, rng) {
  const n = nVeh * per, pos = new Float32Array(n * 12), aS = new Float32Array(n * 16), aC = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
  const CX = [-1, 1, 1, -1], CY = [-1, -1, 1, 1];
  for (let i = 0; i < n; i++) {
    const v = Math.floor(i / per), s0 = rng(), s1 = rng(), s2 = rng();
    for (let c = 0; c < 4; c++) { const o = i * 4 + c; aS.set([v, s0, s1, s2], o * 4); aC.set([CX[c], CY[c]], o * 2); }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setAttribute('aC', new THREE.BufferAttribute(aC, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const veh = []; for (let i = 0; i < nVeh; i++) veh.push(new THREE.Vector4(0, -100, 0, 0));
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uVeh: { value: veh }, uTail: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec4 aS; attribute vec2 aC; uniform vec4 uVeh[${nVeh}]; uniform float uTime, uTail; varying vec2 vC; varying float vA;
      #include <fog_pars_vertex>
      void main(){
        int vi = int(aS.x + .5); vec4 v = uVeh[vi];                 // x, z, heading, speed (negative: the bow wave of our own car)
        float own = step(v.w, -.001), sp = abs(v.w);
        float ph = fract(uTime * (.9 + .5 * aS.y) + aS.z * 7.);
        vec2 fwd = vec2(cos(v.z), sin(v.z)), side = vec2(-fwd.y, fwd.x);
        float lat = (aS.w < .5 ? -1. : 1.) * (.78 + ph * (.5 + 1.4 * aS.y) * mix(1., 1.6, own));
        float back = mix(-2.3 - ph * sp * .32, 1.5 - ph * sp * .2, own);
        float hgt = .1 + sin(ph * 3.1416) * (.25 + .6 * aS.z) * min(sp * .07, 1.3) * mix(1., .55, own);
        vec3 P = vec3(v.x + fwd.x * back + side.x * lat, hgt, v.y + fwd.y * back + side.y * lat);
        float sz = (.14 + ph * (.55 + .5 * aS.y)) * min(sp * .08, 1.2) * mix(1., .5, own);
        vec4 mvPosition = viewMatrix * vec4(P, 1.);
        mvPosition.xy += aC * sz;
        vC = aC; vA = (1. - ph) * smoothstep(0., .12, ph) * mix(.36, .14, own) * uTail * smoothstep(3., 9., sp) * smoothstep(.7, 2.2, -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        if (vA < .004) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb; varying vec2 vC; varying float vA;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vC); float a = exp(-r * r * 3.2) * (1. - smoothstep(.7, 1., r)) * vA;
        if (a < .004) discard;
        gl_FragColor = vec4(vec3(.92, .96, .96) * (uSunCol * .45 + uAmb * .9), a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { mesh, veh, uniforms: m.uniforms };
}

// ---------- houses: one generator for the boulevard arcades, the side street and the little square ----------
const WALLS = ['#E8929A', '#9AD4B8', '#E3A84B', '#8CC3E0', '#EDE4CF', '#E58A6B', '#C3A6D8', '#6CC5BC', '#F0C987', '#D9B8A0', '#E8929A', '#9AD4B8'].map(lin);
const SHUTS = ['#3f6f9a', '#3d8a78', '#7a5a3a', '#2f6f7f', '#8a3f3a', '#d8d0bc', '#4a7a4a'].map(lin);
const CLOTHS = ['#f2f0e8', '#e8eef4', '#9cc4e4', '#f0a0a8', '#f4d878', '#d0483c', '#8ad0b4', '#f2f0e8', '#3a6ea8', '#f08a4a'].map(lin);
const BRICK = lin('#a5583c'), RENDER = lin('#8f877a'), IRON = lin('#2a2420'), RUST = lin('#6a3a24'), BONE = lin('#ece4d0');
function houseSpec(rng, bays, street) {
  const wi = rng.int(0, WALLS.length - 1), fade = rng.range(0, 0.38), k = rng.range(0.74, 0.98);
  const wall = mul3(mix3(WALLS[wi], [0.62, 0.6, 0.55], fade), k);
  const trim = rng.chance(0.75) ? mul3(BONE, rng.range(0.8, 1)) : mul3(mix3(wall, [1, 1, 1], 0.5), 0.95);
  return {
    bays, w: bays * 7, floors: street ? 4 : rng.int(2, 4), fh: street ? 2.9 : rng.range(3.3, 4.2), gh: street ? 3.6 : 5.5, arcade: !street, depth: street ? 9.5 : 12,
    wall, trim, wall2: rng.chance(0.5) ? mul3(wall, 0.82) : mul3(mix3(WALLS[rng.int(0, WALLS.length - 1)], [0.6, 0.58, 0.54], 0.3), 0.8),
    shut: SHUTS[rng.int(0, SHUTS.length - 1)], iron: rng.chance(0.6) ? IRON : RUST, style: rng.int(0, 2), wpb: street ? 3 : rng.int(2, 3),
    win: rng.chance(street ? 0.2 : 0.45) ? SURF.ARCHED : SURF.WINDOW, top: rng.int(0, 3), shutP: rng.chance(0.75) ? rng.range(0.3, 0.8) : 0,
    balc: street ? 2 : rng.int(0, 3), solid: rng.chance(0.22), awn: rng.chance(street ? 0.3 : 0.4), decay: rng.range(0.3, 1), street, lit: street ? 0 : 1,
  };
}
// M places the house: local +X along the frontage, +Z out toward the street, origin at ground on the frontage line.
function house(B, D, rng, M, o, ex) {
  B.push(M); D.push(M);
  const W = o.w, nb = o.bays, bw = W / nb, nf = o.floors, fh = o.fh, gh = o.gh, H = gh + nf * fh, dep = o.depth, wall = o.wall, trim = o.trim, wall2 = o.wall2;
  const nwin = nb * o.wpb, cw = W / nwin, v = new THREE.Vector3();
  const toW = (x, y, z) => { v.set(x, y, z).applyMatrix4(M); return [v.x, v.y, v.z]; };
  if (o.arcade) {
    B.col(wall2, 0.42, 0.85).surf(SURF.ARCHED, rng(), 0.7); B.wall(0, -3.5, W, -3.5, 0.15, gh - 0.55, { cellW: 1, cols: nb * 2, rows: 1 });
    B.surf(SURF.PLAIN).col(mix3(wall2, [0.62, 0.36, 0.26], 0.35), 0.6, 0.6);
    B.quad([0, gh - 0.55, -3.5], [W, gh - 0.55, -3.5], [W, gh - 0.55, 0], [0, gh - 0.55, 0]);
    B.col(wall, 0.86, 1); B.box(0, gh - 0.55, -0.6, W, gh, 0, { bottom: true });
    for (let k = 0; k <= nb; k++) {
      const x = k === 0 ? 0.48 : k === nb ? W - 0.48 : k * bw, half = k > 0 && k < nb ? 1 : 0.62;
      if (o.style === 0) {
        const r = 0.4 * (half < 1 ? 0.85 : 1);
        B.surf(SURF.PLAIN).col(trim, 0.7, 0.95); B.cbox(x, 0.15, -0.3, r * 2.7, 0.5, r * 2.7);
        B.surf(SURF.FLUTED).col(trim, 0.8, 1); B.lathe(x, 0.65, -0.3, [[r, 0], [r * 0.97, (gh - 1.6) * 0.45], [r * 0.84, gh - 1.6]], 10, { smooth: true, uvBand: [16, 0, 1] });
        B.surf(SURF.PLAIN).col(trim, 0.85, 1); B.cbox(x, gh - 0.95, -0.3, r * 2.5, 0.4, r * 2.5, { bottom: true });
      } else {
        const hw = 0.46 * half;
        B.surf(o.style === 1 ? SURF.MASONRY : SURF.PLAIN, 0, 1.2).col(o.style === 1 ? mul3(wall, 0.92) : trim, 0.72, 1); B.box(x - hw, 0.15, -0.72, x + hw, gh - 0.55, 0.06, { m: 1 });
        B.surf(SURF.PLAIN).col(trim, 0.6, 0.8); B.box(x - hw - 0.08, 0.15, -0.8, x + hw + 0.08, 0.7, 0.14);
      }
    }
    if (o.style === 2) {            // segmental arches between the piers
      B.surf(SURF.PLAIN).col(wall, 0.84, 0.98);
      for (let k = 0; k < nb; k++) {
        const xa = k * bw + 0.46, xb = (k + 1) * bw - 0.46, yt = gh - 0.55, rise = 1.25, n = 8;
        for (let i = 0; i < n; i++) {
          const u0 = i / n * 2 - 1, u1 = (i + 1) / n * 2 - 1, x0 = mix(xa, xb, i / n), x1 = mix(xa, xb, (i + 1) / n), y0 = yt - rise * u0 * u0, y1 = yt - rise * u1 * u1;
          B.quad([x0, y0, 0.04], [x1, y1, 0.04], [x1, yt, 0.04], [x0, yt, 0.04]);
          B.quad([x1, y1, -0.6], [x0, y0, -0.6], [x0, yt, -0.6], [x1, yt, -0.6]);
          B.quad([x0, y0, -0.6], [x1, y1, -0.6], [x1, y1, 0.04], [x0, y0, 0.04]);
        }
      }
    }
  } else {
    B.col(wall2, 0.62, 0.96).surf(rng.chance(0.4) ? SURF.SHOP : SURF.ARCHED, rng(), 0.7); B.wall(0, 0, W, 0, 0.15, gh, { cellW: 1, cols: Math.max(2, Math.round(W / 2.7)), rows: 1 });
    // the ground floor of a side-street house is never a row of blank panels: most bays have a roller shutter pulled down or a
    // panelled door in a stone frame with a step (chosen from where the house stands, so no random draw is spent on them)
    const ng = Math.max(2, Math.round(W / 2.7)), gw = W / ng;
    for (let i = 0; i < ng; i++) {
      const hsh = Math.abs(Math.sin(M.elements[12] * 12.9898 + M.elements[14] * 78.233 + i * 37.719) * 43758.5453) % 1, x0 = i * gw, x1 = x0 + gw, xm = (x0 + x1) / 2;
      if (hsh < 0.4) {
        D.surf(SURF.PLANKS).col(mul3(o.shut, 0.55 + 0.5 * ((hsh * 17) % 1)), 0.8, 1); D.box(x0 + 0.32, 0.15, 0, x1 - 0.32, 2.75, 0.07);
        D.surf(SURF.PLAIN).col(mul3(trim, 0.8), 0.9, 1); D.box(x0 + 0.22, 2.75, 0, x1 - 0.22, 2.95, 0.13, { bottom: true });
      } else if (hsh < 0.66) {
        D.surf(SURF.PLANKS).col(mul3(o.shut, 0.5), 0.75, 1); D.box(xm - 0.55, 0.15, 0, xm + 0.55, 2.5, 0.06);
        D.surf(SURF.PLAIN).col(trim, 0.7, 1); D.box(xm - 0.72, 0.15, 0, xm - 0.55, 2.68, 0.14); D.box(xm + 0.55, 0.15, 0, xm + 0.72, 2.68, 0.14); D.box(xm - 0.72, 2.5, 0, xm + 0.72, 2.68, 0.14, { bottom: true });
        D.box(xm - 0.8, 0.15, 0, xm + 0.8, 0.3, 0.3);
      }
    }
  }
  // upper storeys: windows in the shader, courses, pilasters, party walls
  for (let f = 0; f < nf; f++) {
    const y0 = gh + f * fh;
    B.col(wall, 0.8 + 0.12 * rng(), 1).surf(o.win, rng(), 1); B.wall(0, 0, W, 0, y0, y0 + fh, { cellW: 1, cols: nwin, rows: 1 });
    B.surf(SURF.PLAIN).col(trim, 0.78, 1); B.box(-0.03, y0 - 0.1, 0, W + 0.03, y0 + 0.12, 0.13, { bottom: true });
  }
  B.surf(SURF.PLAIN).col(mul3(wall, 0.74), 0.7, 1);
  const sideG = (x, sgn) => {     // ground storey of a side elevation (sgn 1: the +X end)
    const z0 = o.arcade ? -3.5 : 0, yt = o.arcade ? gh - 0.55 : gh, n = Math.max(2, Math.round((dep + z0) / 2.9));
    B.surf(SURF.ARCHED, rng(), 0.7).col(wall2, 0.5, 0.95);
    if (sgn > 0) B.wall(x, z0, x, -dep, 0.15, yt, { cellW: 1, cols: n, rows: 1 }); else B.wall(x, -dep, x, z0, 0.15, yt, { cellW: 1, cols: n, rows: 1 });
    B.surf(SURF.PLAIN).col(wall, 0.86, 1);
    if (o.arcade) { if (sgn > 0) B.wall(x, 0, x, -dep, yt, gh); else B.wall(x, -dep, x, 0, yt, gh); }
    B.col(trim, 0.6, 0.85); B.box(sgn > 0 ? x : x - 0.1, 0.15, -dep, sgn > 0 ? x + 0.1 : x, 0.8, z0);
    B.col(trim, 0.78, 1); B.box(sgn > 0 ? x : x - 0.12, gh - 0.1, -dep, sgn > 0 ? x + 0.12 : x, gh + 0.12, 0.13, { bottom: true });
    B.surf(SURF.PLAIN).col(mul3(wall, 0.74), 0.7, 1);
  };
  if (o.sideR) { sideG(W, 1); B.surf(o.win, rng(), 1).col(wall, 0.82, 1); B.wall(W, 0, W, -dep, gh, H, { cellW: 1, cols: Math.round(dep / 2.4), rows: nf }); B.surf(SURF.PLAIN).col(mul3(wall, 0.74), 0.7, 1); }
  else B.wall(W, 0, W, -dep, 0.15, H);
  if (o.sideL) { sideG(0, -1); B.surf(o.win, rng(), 1).col(wall, 0.82, 1); B.wall(0, -dep, 0, 0, gh, H, { cellW: 1, cols: Math.round(dep / 2.4), rows: nf }); }
  else B.wall(0, -dep, 0, 0, 0.15, H);
  B.surf(SURF.PLAIN).col(trim, 0.8, 1);
  if (!o.street) for (let k = 0; k <= nb; k++) { const x = Math.min(Math.max(k * bw, 0.31), W - 0.31); B.box(x - 0.3, gh, 0, x + 0.3, H - 0.3, 0.15); }
  B.col(trim, 0.72, 1); B.box(-0.12, H - 0.32, -0.2, W + 0.12, H + 0.05, 0.5, { bottom: true });
  B.col(wall, 0.9, 1); B.box(0, H + 0.05, -0.35, W, H + 0.95, 0);
  const yb = H + 0.95, xm = W / 2;
  if (o.top === 1) { D.surf(SURF.PLAIN).col(trim, 0.8, 1); for (let x = 0.4; x < W - 0.3; x += 1.1) D.box(x - 0.11, yb, -0.3, x + 0.11, yb + 0.55, -0.05); D.box(0, yb + 0.55, -0.36, W, yb + 0.68, 0.02, { bottom: true }); }
  else if (o.top === 2 && nb !== 2) { const hw = Math.min(3.3, W / 2 - 0.2); B.col(wall, 0.92, 1); B.tri([xm - hw, yb, 0], [xm + hw, yb, 0], [xm, yb + 1.6, 0]); B.col(trim, 0.85, 1); B.beam([xm - hw - 0.1, yb, 0.08], [xm, yb + 1.7, 0.08], 0.24); B.beam([xm, yb + 1.7, 0.08], [xm + hw + 0.1, yb, 0.08], 0.24); }
  else if (o.top === 3) { const hw = Math.min(3.2, W / 2 - 0.2); B.col(wall, 0.92, 1); B.tri([xm - hw, yb, 0], [xm - 0.7, yb, 0], [xm - 0.7, yb + 1.15, 0]); B.tri([xm + 0.7, yb, 0], [xm + hw, yb, 0], [xm + 0.7, yb + 1.15, 0]); D.surf(SURF.PLAIN).col(trim, 0.7, 1); D.cyl(xm, yb, -0.15, 0.22, 0.34, 0.9, 7); }
  // balconies: slabs cast shadows (shell), rails are detail
  const balc = (xa, xb, y) => {
    if (ex && ex.rails && o.street) ex.rails.push([toW(xa, y + 0.97, 1.03), toW(xb, y + 0.97, 1.03)]);
    B.surf(SURF.PLAIN).col(trim, 0.55, 0.95); B.box(xa, y - 0.16, 0, xb, y, 1.0, { bottom: true });
    for (const bx of [xa + 0.22, xb - 0.22]) B.box(bx - 0.08, y - 0.52, 0, bx + 0.08, y - 0.16, 0.55);
    if (o.solid) { D.surf(SURF.PLAIN).col(trim, 0.7, 1); D.box(xa, y, 0.84, xb, y + 0.9, 1.0); return; }
    D.surf(SURF.PLAIN).col(o.iron, 0.85, 1); D.box(xa, y + 0.9, 0.9, xb, y + 0.98, 1.0, { bottom: true });
    const nbar = Math.max(2, Math.round((xb - xa) / 0.4));
    for (let i = 0; i <= nbar; i++) { const x = xa + 0.035 + (xb - xa - 0.07) * i / nbar; D.wall(x - 0.032, 0.95, x + 0.032, 0.95, y, y + 0.9); }
    for (const z of [0.32, 0.64]) { D.wall(xa, z - 0.032, xa, z + 0.032, y, y + 0.9); D.wall(xb, z + 0.032, xb, z - 0.032, y, y + 0.9); }
    D.box(xa, y + 0.9, 0, xa + 0.07, y + 0.98, 0.9); D.box(xb - 0.07, y + 0.9, 0, xb, y + 0.98, 0.9);
    if (ex && rng.chance(0.3)) ex.plants.push([...toW(mix(xa, xb, rng.range(0.15, 0.85)), y, 0.6), rng.range(0.5, 0.9), o.lit]);
  };
  for (let f = 0; f < nf; f++) {
    const y0 = gh + f * fh + 0.02, mode = o.balc === 3 ? (f === 0 ? 1 : 2) : o.balc === 2 ? 2 : o.balc === 1 && f === 0 ? 1 : 0;
    if (mode === 1) balc(0.35, W - 0.35, y0);
    else if (mode === 2) for (let i = 0; i < nwin; i++) if (rng.chance(o.street ? 0.72 : 0.6)) balc((i + 0.1) * cw, (i + 0.9) * cw, y0);
    // shutters, some swung open
    if (o.shutP > 0) for (let i = 0; i < nwin; i++) if (rng.chance(o.shutP)) {
      const cx = (i + 0.5) * cw, sw = cw * 0.2, ya = y0 + 0.14 * fh, yc = y0 + 0.86 * fh;
      D.surf(SURF.PLANKS).col(mul3(o.shut, rng.range(0.75, 1.1)), 0.85, 1);
      for (const sgn of [-1, 1]) {
        if (rng.chance(0.2)) continue;
        const open = rng.chance(0.35) ? -rng.range(0.3, 1.2) * sgn : 0;
        D.tr(cx + sgn * cw * 0.33, 0, 0.03, open);
        D.box(sgn > 0 ? 0 : -sw, ya, 0, sgn > 0 ? sw : 0, yc, 0.05, { bottom: true });
        D.pop();
      }
    }
  }
  // decay: bare brick and grey render on the wall-only zones, drips under the cornice
  const np = Math.round((2 + nb * 2.5) * o.decay);
  for (let i = 0; i < np; i++) {
    const brick = rng.chance(0.55); D.surf(brick ? SURF.MASONRY : SURF.PLAIN, 0, 0.5).col(brick ? mul3(BRICK, rng.range(0.7, 1.05)) : mul3(RENDER, rng.range(0.8, 1.1)), 0.85, 1);
    if (rng.chance(0.5)) { const x = rng.int(0, nwin) * cw, f = rng.int(0, nf - 1), pw = rng.range(0.12, 0.17) * cw, ya = gh + (f + rng.range(0.05, 0.5)) * fh; for (let q = 0; q < 2; q++) { const dx = rng.range(-0.08, 0.08), hh = rng.range(0.5, 1.4); D.wall(Math.max(0, x - pw + dx), 0.012 + q * 0.004, Math.min(W, x + pw + dx), 0.012 + q * 0.004, ya + q * 0.3, Math.min(H - 0.35, ya + q * 0.3 + hh), { m: 1 }); } }
    else { const f = rng.int(1, nf - 1), y = gh + f * fh, x = rng.range(0, W - 2.5), pw = rng.range(0.8, 2.4); for (let q = 0; q < 2; q++) D.wall(x + q * pw * 0.3, 0.14 + q * 0.004, Math.min(W, x + pw * (1 - q * 0.25)), 0.14 + q * 0.004, y + 0.12, y + 0.12 + rng.range(0.12, 0.14) * fh, { m: 1 }); }
  }
  D.surf(SURF.PLAIN);
  for (let i = 0; i <= nwin; i++) if (rng.chance(0.4 * o.decay)) { const x = Math.min(i * cw, W - 0.3); D.col(mul3(wall, 0.95), 1, 0.5); D.wall(x, 0.011, x + rng.range(0.15, 0.3), 0.011, H - 0.35 - rng.range(0.8, 2.2), H - 0.33); }
  // roof clutter against the sky, weeds on the cornice, a sign blade, an awning
  if (rng.chance(0.55)) { const x = rng.range(1.2, W - 1.2); D.col(lin(rng.chance(0.5) ? '#4a6a8a' : '#6a6a66'), 0.7, 1); D.cyl(x, yb + 0.5, -2.2, 0.72, 0.72, 1.25, 8); for (const a of [-0.45, 0.45]) D.box(x + a - 0.05, yb - 0.9, -2.25, x + a + 0.05, yb + 0.5, -2.15); }
  if (rng.chance(0.5)) { const x = rng.range(0.5, W - 0.5); D.col(IRON, 1, 1); D.box(x - 0.035, yb - 0.9, -1.5, x + 0.035, yb + rng.range(2, 3.6), -1.43); D.box(x - 0.5, yb + 1.6, -1.49, x + 0.5, yb + 1.66, -1.44); }
  if (rng.chance(0.3)) { const x = rng.range(1.5, W - 1.5); D.col(mul3(wall, 0.8), 0.8, 1); D.box(x - 1.1, yb - 0.9, -4.5, x + 1.1, yb + 1.4, -2.4); }
  if (ex) {
    for (let i = 0, n = rng.int(0, 2 + nb); i < n; i++) ex.plants.push([...toW(rng.range(0.3, W - 0.3), rng.chance(0.6) ? H + 0.05 : gh + rng.int(0, nf - 1) * fh + 0.12, 0.22), rng.range(0.45, 1.0), o.lit]);
    if (o.arcade && rng.chance(0.4)) { const x = rng.int(1, Math.max(1, nb - 1)) * bw + rng.range(-0.5, 0.5), c = mul3(CLOTHS[rng.int(2, 9)], 0.8); D.col(c, 0.8, 1); D.box(x - 0.04, 3.3, 0.06, x + 0.04, 4.3, 0.95, { bottom: true }); D.col(IRON, 1, 1); D.box(x - 0.02, 4.3, 0, x + 0.02, 4.36, 1.0); }
    if (o.awn) for (let k = 0; k < nb; k++) if (rng.chance(0.6)) {
      const xa = k * bw + 0.8, xb = (k + 1) * bw - 0.8, yt = gh - (o.arcade ? 0.75 : 0.5), c = mul3(CLOTHS[rng.int(2, 9)], rng.range(0.6, 0.85)), c2 = mul3(c, 1.25), dz = o.arcade ? 1.9 : 1.2, dy = o.arcade ? 1.1 : 0.7;
      ex.cloth.add(toW(xa, yt, 0.06), toW(xb, yt, 0.06), toW(xa, yt - dy, dz), toW(xb, yt - dy, dz), 6, 3, (u, vv) => (vv > 0.8 ? c2 : c), (u, vv) => vv * (0.25 + 0.75 * Math.sin(u * PI)), 0.16, o.lit);
    }
    if (o.arcade) ex.arcades.push(toW(W / 2, 0.15, -1.9).concat([W]));
  }
  B.pop(); D.pop();
  return H;
}

// ---------- the town: arcades round the bay, the side street, the square, the propped shell ----------
async function buildTown(line, rng, ex, pause) {
  const chunks = new Map(), M = new THREE.Matrix4();
  const get = (k) => { let c = chunks.get(k); if (!c) chunks.set(k, c = { B: new S.Builder(8192), D: new S.Builder(8192), street: k[0] === 's' }); return c; };
  const kap = (s) => ((s > ST.a0 && s < ST.a1) || (s > ST.h1 && s < ST.b1) ? 1 / RW : 0);
  const front = (a, b) => { let L = 0; for (let s = a; s < b; s += 0.5) L += 0.5 * (1 + ST.lF * kap(s)); return L; };
  const adv = (s, len) => { let L = 0; while (L < len) { s += 0.25; L += 0.25 * (1 + ST.lF * kap(s)); } return s; };
  const row = async (a, b, lF, flagA, flagB) => {
    let s = a;
    while (s < b - 0.5) {
      const rem = front(s, b), left = Math.max(1, Math.round(rem / 7));
      const bays = Math.min(left, rng.pick([1, 1, 1, 2, 2, 3])), o = houseSpec(rng, bays, false), last = bays === left;
      o.w = last ? rem : bays * 7;
      if (s === a && flagA) o.sideL = true; if (last && flagB) o.sideR = true;
      const p = line.at(s, lF); M.makeRotationY(PI - line.theta(s)).setPosition(p[0], 0, p[1]);
      const c = get('b' + Math.floor((s + 62) / 90));
      const H = house(c.B, c.D, rng, M, o, ex);
      if (ex && ex.fronts) ex.fronts.push({ s, lF, H, depth: o.depth, matrix: M.clone() });
      s = last ? b : adv(s, o.w);
      await pause();
    }
  };
  await row(-61.5, -5.5, ST.lF, false, true); await row(5.5, ST.sq0 - 3.5, ST.lF, true, true); await row(ST.sq1 + 3.5, ST.fEnd, ST.lF, true, false);
  await row(ST.sq0 - 3.5, ST.sq1 + 3.5, ST.lF + 40, false, false);            // the back of the palm square
  // side street and square: [x, z of the local origin, yaw, width, flags]
  const hw = STREET.hw, E = -PI / 2, Wd = PI / 2, list = [];
  const east = [39.25, 46.6, STREET.shell0, STREET.shell1, 77.75, 87.5, STREET.z1], west = [39.25, 49, 59.5, 68, 78, 88.25, STREET.z1];
  for (let i = 0; i < east.length - 1; i++) if (east[i] !== STREET.shell0) list.push([hw, east[i], E, east[i + 1] - east[i], i === east.length - 2 ? 'R' : '', 's0']);
  for (let i = 0; i < west.length - 1; i++) list.push([-hw, west[i + 1], Wd, west[i + 1] - west[i], i === west.length - 2 ? 'L' : '', 's1']);
  for (let i = 0; i < 3; i++) { list.push([15, STREET.z1 + i * 10, E, 10, '', 's0']); list.push([-15, STREET.z1 + (i + 1) * 10, Wd, 10, '', 's1']); }
  for (const [x, z, ry, w, flag, key] of list) {
    const o = houseSpec(rng, Math.max(2, Math.round(w / 2.5)), true); o.w = w; o.wpb = 1; o.sideR = flag === 'R'; o.sideL = flag === 'L';
    M.makeRotationY(ry).setPosition(x, 0, z); const c = get(key); house(c.B, c.D, rng, M, o, ex);
    await pause();
  }
  // the roofless shell: a stub of front wall, a low back wall, rubble, raking and flying shores holding the neighbours apart
  { const c = get('s0'), B = c.B, D = c.D, z0 = STREET.shell0, z1 = STREET.shell1, timber = lin('#6a4a2c');
    B.surf(SURF.MASONRY, 0, 0.5).col(mul3(BRICK, 0.9), 0.7, 1);
    for (let z = z0; z < z1 - 0.1; z += 2) B.box(hw, 0.15, z, hw + 0.45, 0.6 + rng.range(0.2, 0.9), Math.min(z + 2, z1), { m: 1 });
    for (let z = z0; z < z1 - 0.1; z += 3.5) if (rng.chance(0.8)) B.box(15, 0.1, z, 15.4, rng.range(1.4, 2.6), Math.min(z + 3.5, z1), { m: 1 });
    B.surf(SURF.PLAIN).col(lin('#5c554c'), 0.8, 1); B.box(hw + 0.45, 0, z0, 15, 0.16, z1);
    D.surf(SURF.MASONRY, 0, 0.5);
    for (let i = 0; i < 16; i++) { const x = rng.range(6.4, 14), z = rng.range(z0 + 0.6, z1 - 0.6), r = rng.range(0.25, 0.8); D.col(mul3(rng.chance(0.5) ? BRICK : RENDER, rng.range(0.6, 1)), 0.7, 1); D.tr(x, 0.1, z, rng() * TAU); D.box(-r, 0, -r * 0.7, r, r * rng.range(0.5, 1.1), r * 0.7, { m: 1 }); D.pop(); if (ex && i % 3 === 0) ex.plants.push([x + 0.5, 0.16, z, rng.range(0.7, 1.3), 0]); }
    B.surf(SURF.PLANKS).col(timber, 0.8, 1);
    for (const [x, y] of [[7.5, 7.2], [11.5, 11.2], [9.5, 4.2]]) B.beam([x, y, z0 + 0.05], [x, y, z1 - 0.05], 0.3);
    for (const x of [7.2, 10.5]) { B.beam([x + 0.8, 0.2, (z0 + z1) / 2 - 1], [x, 8.6, z0 + 0.15], 0.28); B.beam([x + 0.8, 0.2, (z0 + z1) / 2 + 1], [x, 8.6, z1 - 0.15], 0.28); }
    if (ex) ex.cloth.add([7.5, 7.05, z0 + 3], [7.5, 7.05, z0 + 4.6], [7.5, 5.2, z0 + 3.1], [7.5, 5.6, z0 + 4.4], 3, 4, mul3(CLOTHS[5], 0.8), (u, v) => v, 0.4, 0);
  }
  return chunks;
}

// ---------- ground: seawall, pavements, kerbs, lamp standards, the apron ring (kit facade material, receives shadows) ----------
async function buildGround(line, rng, lampPts, noHero, pause) {
  const groups = [], stone = lin('#9a9284'), pave = lin('#8f8a80'), pave2 = lin('#a39a8a'), P = (s, l, y) => { const p = line.at(s, l); return [p[0], y, p[1]]; };
  const top = (B, s0, s1, l0, l1, y) => B.quad(P(s0, l1, y), P(s0, l0, y), P(s1, l0, y), P(s1, l1, y), [l1, s0, l0, s1]);
  const face = (B, s0, s1, l, y0, y1, land) => { const a = line.at(land ? s1 : s0, l), b = line.at(land ? s0 : s1, l); B.wall(a[0], a[1], b[0], b[1], y0, y1, { m: 1 }); };
  const lamp = (B, x, z, st) => {
    B.surf(SURF.PLAIN).col(lin('#2c3430'), 0.7, 1); B.cbox(x, 0.15, z, 0.52, 0.5, 0.52); B.cyl(x, 0.65, z, 0.13, 0.09, 0.5, 7, { cap: false }); B.cyl(x, 1.15, z, 0.085, 0.06, 4.1, 7, { cap: false });
    B.cbox(x, 5.2, z, 0.5, 0.07, 0.5, { bottom: true }); B.cbox(x, 5.85, z, 0.42, 0.12, 0.42, { bottom: true }); B.cyl(x, 5.97, z, 0.05, 0.01, 0.4, 5);
    B.surf(SURF.GLOW, 0, 1.6).col(lin('#ffd9a0')); B.cbox(x, 5.3, z, 0.3, 0.52, 0.3, { bottom: true }); B.surf(SURF.PLAIN);
    lampPts.push([x, 5.55, z, st]);
  };
  for (let a = -160; a < 620; a += 96) {
    const B = new S.Builder(4096), b = Math.min(a + 96, 620);
    for (let s = a; s < b; s += 4) {
      const s1 = Math.min(s + 4, b), hero = noHero(s + 2) || s >= 612, mouth = s + 2 > -5.5 && s + 2 < 5.5;
      if (!hero) {
        if (s1 <= 608) {
          B.surf(SURF.MASONRY, 0, 1.5).col(stone, 0.62, 1); face(B, s, s1, 0, 0.15, WALL_TOP - 0.16, true); face(B, s, s1, -0.9, -4.6, WALL_TOP - 0.16, false);
          B.col(mix3(stone, [0.7, 0.68, 0.6], 0.5), 0.9, 1); face(B, s, s1, 0.06, WALL_TOP - 0.16, WALL_TOP, true); face(B, s, s1, -0.96, WALL_TOP - 0.16, WALL_TOP, false);      // a bleached coping course, proud of the wall
          B.col(mix3(stone, [0.7, 0.68, 0.6], 0.5), 1, 1); top(B, s, s1, -0.96, 0.06, WALL_TOP);
        } else { B.surf(SURF.MASONRY, 0, 2.2).col(pave, 1, 1); top(B, s, s1, -6, 0, 0.15); }
        if (s1 <= 608 && ((s % 8) + 8) % 8 === 0) { B.surf(SURF.PLAIN).col([0.012, 0.012, 0.014]); const p0 = line.at(s + 2.3, 0.012), p1 = line.at(s + 1.7, 0.012); B.wall(p0[0], p0[1], p1[0], p1[1], 0.17, 0.4); }
        B.surf(SURF.MASONRY, 0, 2.2).col(rng.chance(0.5) ? pave : pave2, 1, 1);
        if (s < 600) {
          top(B, s, s1, 0, 5, 0.15);
          B.surf(SURF.PLAIN).col(mul3(pave, 0.7)); B.quad(P(s, 5.25, 0), P(s, 5, 0.15), P(s1, 5, 0.15), P(s1, 5.25, 0));
        }
        if (((s % 16) + 16) % 16 === 8) { const p = line.at(s, 1.3); lamp(B, p[0], p[1], s); }
      }
      if (!mouth) {
        B.surf(SURF.PLAIN).col(mul3(pave, 0.7)); B.quad(P(s, 23.25, 0.15), P(s, 23, 0), P(s1, 23, 0), P(s1, 23.25, 0.15));
        B.surf(SURF.MASONRY, 0, 2.2).col(rng.chance(0.5) ? pave : pave2, 1, 1); top(B, s, s1, 23.25, ST.lF, 0.15);
        const sq = s + 2 > ST.sq0 - 3.5 && s + 2 < ST.sq1 + 3.5, open = s + 2 > ST.fEnd;
        B.surf(SURF.MASONRY, 0, 3).col(mul3(mix3(pave2, [0.6, 0.4, 0.34], sq ? 0.45 : 0.1), sq ? 0.62 : 0.6), 1, 1);
        if (!open && !sq) top(B, s, s1, ST.lF, ST.lF + 3.6, 0.15);
        else if (!open) {
          const edge = s < ST.sq0 || s1 > ST.sq1, warm = mix3(pave2, [0.62, 0.4, 0.32], 0.5), bone = mix3(pave2, [0.8, 0.76, 0.66], 0.6);
          for (let l = 0; l < 44; l += 4) {
            const band = edge || l === 0 || l === 4 * 10, star = !band && ((Math.round(s / 4) + l / 4) & 1) === 0;
            B.surf(SURF.MASONRY, 0, band ? 1.6 : 3).col(mul3(band ? bone : star ? warm : mix3(warm, pave, 0.55), band ? 0.66 : 0.6), 1, 1); top(B, s, s1, ST.lF + l, ST.lF + l + 4, 0.15);
          }
        }
        else { B.surf(SURF.MASONRY, 0, 1.5).col(stone, 0.62, 1); face(B, s, s1, ST.lF, 0.15, 1.2, false); face(B, s, s1, ST.lF + 0.8, -4.6, 1.2, true); B.col(stone, 1, 1); top(B, s, s1, ST.lF, ST.lF + 0.8, 1.2); }
      }
    }
    groups.push(B);
    await pause();
  }
  // side street and square pavements; the apron's ring wall with its gap for the exit and two lamp standards
  const B = new S.Builder(2048), hw = STREET.hw;
  B.surf(SURF.MASONRY, 0, 2.2).col(pave, 1, 1);
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? hw - 1.4 : -hw, x1 = x0 + 1.4;
    for (let z = STREET.z0; z < STREET.z1; z += 7) { const z1 = Math.min(z + 7, STREET.z1); B.col(rng.chance(0.5) ? pave : pave2, 1, 1); B.quad([x0, 0.15, z1], [x1, 0.15, z1], [x1, 0.15, z], [x0, 0.15, z], [x0, z, x1, z1]); }
    B.surf(SURF.PLAIN).col(mul3(pave, 0.7)); const xk = sx > 0 ? hw - 1.4 : -hw + 1.4; B.wall(xk, sx > 0 ? STREET.z0 : STREET.z1, xk, sx > 0 ? STREET.z1 : STREET.z0, 0, 0.15); B.surf(SURF.MASONRY, 0, 2.2);
  }
  const ap = line.at(ST.apron, 9), th = line.theta(ST.apron), tx = -Math.cos(th), tz = -Math.sin(th), nx = -Math.sin(th), nz = Math.cos(th);
  const ring = (f, r) => [ap[0] + r * (Math.cos(f) * tx + Math.sin(f) * nx), ap[1] + r * (Math.cos(f) * tz + Math.sin(f) * nz)];
  for (const [f0, f1] of [[-2.675, -0.34], [0.34, 1.99]]) {
    const n = Math.ceil((f1 - f0) / 0.1);
    for (let i = 0; i < n; i++) {
      const fa = mix(f0, f1, i / n), fb = mix(f0, f1, (i + 1) / n), a = ring(fa, 20), b = ring(fb, 20), a2 = ring(fa, 20.9), b2 = ring(fb, 20.9);
      B.surf(SURF.MASONRY, 0, 1.5).col(stone, 0.62, 1); B.wall(a[0], a[1], b[0], b[1], 0, 0.7, { m: 1 }); B.wall(b2[0], b2[1], a2[0], a2[1], -4.6, 0.7, { m: 1 });
      B.col(stone, 1, 1); B.quad([a[0], 0.7, a[1]], [a2[0], 0.7, a2[1]], [b2[0], 0.7, b2[1]], [b[0], 0.7, b[1]]);
    }
  }
  // a paved walk inside the ring wall, carrying the two pavements round the apron to the gap (so neither ends as a cut slab)
  // (the seaward pavement does not stop square at the apron: its kerb turns out on a 16 m fillet and runs into the ring walk)
  const kerbL = (s) => s < 601.54 ? 5 : -11 + Math.sqrt(Math.max(256 - (s - 601.54) * (s - 601.54), 0)), outL = (s) => s <= 612 ? 0 : -2.63 + 0.8125 * (s - 612);
  for (let i = 0; i < 14; i++) {
    const s0 = 600 + i, s1 = Math.min(s0 + 1, 613.9), k0 = kerbL(s0), k1 = kerbL(s1), o0 = s0 >= 612 ? outL(s0 + 1e-3) : 0, o1 = outL(s1);
    B.surf(SURF.MASONRY, 0, 2.2).col(i & 2 ? pave : pave2, 1, 1); B.quad(P(s0, k0, 0.15), P(s0, o0, 0.15), P(s1, o1, 0.15), P(s1, k1, 0.15), [k0, s0, o0, s1]);
    B.surf(SURF.PLAIN).col(mul3(pave, 0.7)); B.quad(P(s0, k0 + 0.25, 0), P(s0, k0, 0.15), P(s1, k1, 0.15), P(s1, k1 + 0.25, 0));
  }
  for (const [f0, f1] of [[-2.456, -0.36], [0.36, 2.22]]) {
    const n = Math.ceil((f1 - f0) / 0.12);
    for (let i = 0; i < n; i++) {
      const fa = mix(f0, f1, i / n), fb = mix(f0, f1, (i + 1) / n), rin = (f) => 15.6 - 1.4 * sm(-2.5, -2.8, f), a = ring(fa, rin(fa)), b2 = ring(fb, rin(fb)), c = ring(fb, 20), d = ring(fa, 20);
      B.surf(SURF.MASONRY, 0, 2.2).col(i & 1 ? pave : pave2, 1, 1);
      const up = (a[0] - d[0]) * (c[1] - d[1]) - (a[1] - d[1]) * (c[0] - d[0]) < 0;
      if (up) B.quad([d[0], 0.152, d[1]], [a[0], 0.152, a[1]], [b2[0], 0.152, b2[1]], [c[0], 0.152, c[1]], [fa * 20, 0, fb * 20, 4.4]);
      else B.quad([a[0], 0.152, a[1]], [d[0], 0.152, d[1]], [c[0], 0.152, c[1]], [b2[0], 0.152, b2[1]], [fa * 20, 0, fb * 20, 4.4]);
      B.surf(SURF.PLAIN).col(mul3(pave, 0.7)); B.wall(a[0], a[1], b2[0], b2[1], 0, 0.152); B.wall(b2[0], b2[1], a[0], a[1], 0, 0.152);
    }
  }
  B.surf(SURF.PLAIN).col(lin('#262e2a'), 0.7, 1.1);
  for (const [f0, f1] of [[-2.45, -0.5], [0.5, 2.05]]) for (let f = f0; f <= f1; f += 0.17) { const p = ring(f, 15.95); B.cyl(p[0], 0.152, p[1], 0.13, 0.1, 0.62, 7, { cap: false }); B.cyl(p[0], 0.772, p[1], 0.15, 0.02, 0.14, 7); }
  for (const f of [-0.4, 0.4]) { const p = ring(f, 19.2); lamp(B, p[0], p[1], 644); }
  for (const [f, st] of [[-1.25, 628], [1.25, 628], [-2.1, 612], [1.95, 614]]) { const p = ring(f, 19.0); lamp(B, p[0], p[1], st); }
  // wall lanterns down the side street: an iron bracket and a glazed box under the first balconies
  for (const [sx, z] of STREET_LAMPS) {
    const x = sx * (hw - 0.42);
    B.surf(SURF.PLAIN).col(lin('#1f2623'), 0.8, 1); B.box(Math.min(x, sx * hw) - 0.02, 3.02, z - 0.025, Math.max(x, sx * hw) + 0.02, 3.07, z + 0.025);
    B.box(sx * hw - (sx > 0 ? 0.06 : 0), 2.5, z - 0.05, sx * hw + (sx > 0 ? 0 : 0.06), 3.1, z + 0.05); B.beam([sx * hw, 2.62, z], [x + sx * 0.06, 3.02, z], 0.03);
    B.cbox(x, 2.98, z, 0.3, 0.05, 0.3, { bottom: true }); B.cbox(x, 2.5, z, 0.2, 0.04, 0.2, { bottom: true }); B.cyl(x, 3.03, z, 0.04, 0.005, 0.12, 5);
    B.surf(SURF.GLOW, 0, 1.6).col(lin('#ffd9a0')); B.cbox(x, 2.54, z, 0.22, 0.44, 0.22, { bottom: true }); B.surf(SURF.PLAIN);
    lampPts.push([x, 2.76, z, 22 - z]);
  }
  B.surf(SURF.MASONRY, 0, 1.5).col(stone, 0.5, 0.9);
  { const n = 14; for (let i = 0; i < n; i++) { const a = ring(mix(-0.34, 0.34, i / n), 20.0), b = ring(mix(-0.34, 0.34, (i + 1) / n), 20.0); B.wall(b[0], b[1], a[0], a[1], -4.6, 0, { m: 1 }); } }
  groups.push(B);
  return { groups, ring, apron: ap };
}

// the road surface: boulevard strip, apron disc, side street and square; aSL = (station, lateral), lateral >= 100 off the boulevard
function buildRoadGeometry(line) {
  const P = [], SL = [], I = [];
  const quad = (a, b, c, d) => { const o = P.length / 3; for (const q of [a, b, c, d]) { P.push(q[0], 0, q[1]); SL.push(q[2], q[3]); } I.push(o, o + 1, o + 2, o, o + 2, o + 3); };
  const pt = (s, l) => { const p = line.at(s, l); return [p[0], p[1], s, l]; };
  for (let s = -160; s < ST.apron - 14; s += 4) { const s1 = Math.min(s + 4, ST.apron - 14); for (const [l0, l1] of [[5.25, 14.1], [14.1, 23]]) quad(pt(s, l1), pt(s, l0), pt(s1, l0), pt(s1, l1)); }
  for (let s = ST.apron - 26; s < ST.apron - 14; s += 4) quad(pt(s, 5.25), pt(s, 0), pt(s + 4, 0), pt(s + 4, 5.25));
  const ap = line.at(ST.apron, 9), th = line.theta(ST.apron), tx = -Math.cos(th), tz = -Math.sin(th), nx = -Math.sin(th), nz = Math.cos(th);
  const FA = Math.acos(-0.7), r = (f, k) => { const c = Math.cos(f) * 20 * k, sn = Math.sin(f) * 20 * k; return [ap[0] + c * tx + sn * nx, ap[1] + c * tz + sn * nz, ST.apron + c, 9 + sn]; };
  for (let i = 0; i < 40; i++) { const f0 = -FA + (i / 40) * FA * 2, f1 = -FA + ((i + 1) / 40) * FA * 2; quad(r(f0, 0), r(f0, 1), r(f1, 1), r(f1, 0)); }
  quad(r(FA, 1), r(-FA, 1), r(0, 0), r(0, 0));
  for (let i = 0; i < 9; i++) {      // a tongue of road through the gap in the ring wall, out to the portal
    const la = -4.5 + i, lb = la + 1, ca = Math.sqrt(400 - la * la), cb = Math.sqrt(400 - lb * lb), e = (c, sn) => [ap[0] + c * tx + sn * nx, ap[1] + c * tz + sn * nz, ST.apron + c, 9 + sn];
    quad(e(ca, la), e(26.5, la), e(26.5, lb), e(cb, lb));
  }
  const hw = STREET.hw - 1.4;
  quad([-hw, STREET.z1, 0, 100], [hw, STREET.z1, 0, 100], [hw, 23, 0, 100], [-hw, 23, 0, 100]);
  quad([-hw - 1.4, 27.25, 0, 100], [-hw, 27.25, 0, 100], [-hw, 23, 0, 100], [-hw - 1.4, 23, 0, 100]); quad([hw, 27.25, 0, 100], [hw + 1.4, 27.25, 0, 100], [hw + 1.4, 23, 0, 100], [hw, 23, 0, 100]);
  quad([-15, STREET.sqz + 8, 0, 100], [15, STREET.sqz + 8, 0, 100], [15, STREET.z1, 0, 100], [-15, STREET.z1, 0, 100]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSL', new THREE.Float32BufferAttribute(SL, 2)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-200, 0, -100), 900);
  return g;
}

// ---------- gloss geometry: our car and the traffic (position, normal, color, aM) ----------
function tint(g, col, m) {
  const n = g.attributes.position.count, c = new Float32Array(n * 3), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2]; a[i] = m; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aM', new THREE.BufferAttribute(a, 1)); g.deleteAttribute('uv');
  return g;
}
const gBox = (sx, sy, sz, x, y, z, col, m, ry = 0) => { const g = new THREE.BoxGeometry(sx, sy, sz); if (ry) g.rotateY(ry); g.translate(x, y, z); return tint(g, col, m); };
const gSph = (r, x, y, z, sx, sy, sz, col, m, seg = 10) => { const g = new THREE.SphereGeometry(r, seg, Math.max(5, seg - 3)); g.scale(sx, sy, sz); g.translate(x, y, z); return tint(g, col, m); };
const gWheel = (r, w, x, y, z, col, m, seg = 12) => { const g = new THREE.CylinderGeometry(r, r, w, seg); g.rotateZ(PI / 2); g.translate(x, y, z); return tint(g, col, m); };
const _qa = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _Y = new THREE.Vector3(0, 1, 0);
const gBar = (a, b, w, col, m, d = w) => {
  _va.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _va.length(); _qa.setFromUnitVectors(_Y, _va.normalize());
  const g = new THREE.BoxGeometry(w, len, d); g.applyMatrix4(_m4.compose(_vb.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _qa, new THREE.Vector3(1, 1, 1)));
  return tint(g, col, m);
};
const gCyl = (rt, rb, h, x, y, z, col, m, seg = 7, sz = 1, rx = 0) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.scale(1, 1, sz); if (rx) g.rotateX(rx); g.translate(x, y, z); return tint(g, col, m); };
// a mudguard: a flattened part-ring over the wheel at (x, y, z), from angle a0 to a1 (0 forward, PI / 2 over the top)
const gGuard = (x, y, z, r, w, col, m, a0, a1) => { const g = new THREE.TorusGeometry(r, 0.035, 5, 10, a1 - a0); g.rotateZ(a0); g.rotateY(-PI / 2); g.scale(w / 0.07, 1, 1); g.translate(x, y, z); return tint(g, col, m); };
// a body lofted through sections [z, halfWidth, yBottom, yTop]; look(si, k, up) -> [colour, aM]
function gLoft(secs, look, ring = 12, e = 0.55) {
  const P = [], C = [], A = [], I = [], sp = (x) => Math.sign(x) * Math.pow(Math.abs(x), e), n = secs.length;
  for (let s = 0; s < n; s++) {
    const [z, hw, y0, y1] = secs[s];
    for (let k = 0; k < ring; k++) { const a = (k / ring) * TAU, up = Math.sin(a), lk = look(s, k, up); P.push(hw * sp(Math.cos(a)), (y0 + y1) / 2 + (y1 - y0) / 2 * sp(up), z); C.push(...lk[0]); A.push(lk[1]); }
  }
  for (let s = 0; s < n - 1; s++) for (let k = 0; k < ring; k++) { const a = s * ring + k, b = s * ring + (k + 1) % ring, c = a + ring, d = b + ring; I.push(a, b, c, b, d, c); }
  for (const s of [0, n - 1]) { const o = P.length / 3, [z, , y0, y1] = secs[s], lk = look(s, 0, 0); P.push(0, (y0 + y1) / 2, z); C.push(...lk[0]); A.push(lk[1]); for (let k = 0; k < ring; k++) { const a = s * ring + k, b = s * ring + (k + 1) % ring; if (s === 0) I.push(o, b, a); else I.push(o, a, b); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(A, 1));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
const CHROME = [0.78, 0.8, 0.82], TYRE = [0.02, 0.02, 0.022], GLASSC = [0.03, 0.045, 0.06], WHITEW = [0.75, 0.74, 0.7];
function wheels(parts, list) { for (const [x, y, z, r] of list) { parts.push(gWheel(r, 0.22, x, y, z, TYRE, 3), gWheel(r * 0.72, 0.24, x, y, z, WHITEW, 3), gWheel(r * 0.34, 0.26, x, y, z, CHROME, 1, 8)); } }
// a chrome bumper: a bar rounded in section whose ends wrap back round the body's corners, with two over-riders
function bumper(parts, z, dir) {
  const hw = 0.95, g = gLoft([[-hw, 0.025, 0.41, 0.47], [-hw + 0.06, 0.065, 0.375, 0.505], [-hw * 0.6, 0.075, 0.37, 0.51], [hw * 0.6, 0.075, 0.37, 0.51], [hw - 0.06, 0.065, 0.375, 0.505], [hw, 0.025, 0.41, 0.47]], () => [CHROME, 1], 8, 0.7);
  g.rotateY(PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const w = Math.max(0, Math.abs(p.getX(i)) / hw - 0.6) / 0.4; p.setZ(i, p.getZ(i) - 0.32 * w * w); }
  g.computeVertexNormals(); if (dir < 0) g.rotateY(PI); g.translate(0, 0, z);
  parts.push(g);
  for (const sx of [-1, 1]) parts.push(gSph(0.05, sx * 0.32, 0.45, z + dir * 0.08, 1, 2, 1, CHROME, 1, 6));
}
function sedanGeometry(body, roof, long = 1) {
  const parts = [], L = 2.45 * long;
  parts.push(gLoft([[-L, 0.62, 0.44, 0.82], [-L + 0.3, 0.9, 0.34, 0.95], [-1.0, 0.94, 0.3, 0.98], [0.7, 0.94, 0.3, 1.0], [1.5, 0.93, 0.3, 0.97], [L - 0.15, 0.86, 0.34, 0.9], [L, 0.55, 0.44, 0.74]], () => [body, 0]));
  parts.push(gLoft([[-1.5, 0.66, 0.93, 1.0], [-0.85, 0.72, 0.93, 1.48], [0.3, 0.72, 0.93, 1.46], [0.8, 0.68, 0.93, 1.0]], (s, k, up) => (up > 0.75 ? [roof, 0] : [GLASSC, 2])));
  wheels(parts, [[-0.86, 0.36, 1.45, 0.36], [0.86, 0.36, 1.45, 0.36], [-0.86, 0.36, -1.45, 0.36], [0.86, 0.36, -1.45, 0.36]]);
  bumper(parts, L + 0.03, 1); bumper(parts, -L - 0.03, -1);
  parts.push(gSph(0.5, 0, 0.64, L - 0.06, 1.1, 0.2, 0.16, CHROME, 1, 10));      // the grille: one oval chrome mouth
  for (const sx of [-1, 1]) {
    parts.push(gSph(0.12, sx * 0.64, 0.78, L - 0.14, 1, 1, 0.7, [0.5, 0.47, 0.38], 4, 8), gSph(0.08, sx * 0.7, 0.8, -L + 0.06, 1, 1.4, 0.7, [0.5, 0.03, 0.02], 4, 6));
    parts.push(gBox(0.025, 0.05, 3.3 * long, sx * 0.945, 0.72, 0, CHROME, 1), gBox(0.05, 0.2, 0.9, sx * 0.86, 1.02, -L + 0.5, body, 0));
  }
  const g = mergeGeometries(parts, false); g.userData.lamps = [[L - 0.08, 0.64, 0.78, 0], [L - 0.08, -0.64, 0.78, 0], [-L - 0.02, 0.7, 0.8, 1], [-L - 0.02, -0.7, 0.8, 1]];
  return g;
}
function taxiGeometry(body) {
  const parts = [gSph(1, 0, 1.05, -0.1, 0.98, 0.92, 1.3, body, 0, 14), gSph(1, 0, 1.12, 0.32, 0.86, 0.72, 1.05, [0.03, 0.03, 0.035], 3, 12), gBox(0.9, 0.4, 0.5, 0, 0.75, -0.3, [0.06, 0.05, 0.05], 3)];
  wheels(parts, [[0, 0.3, 1.05, 0.3], [-0.78, 0.3, -0.75, 0.3], [0.78, 0.3, -0.75, 0.3]]);
  parts.push(gSph(0.1, 0, 0.95, 1.2, 1, 1, 0.7, [0.5, 0.47, 0.38], 4, 6));
  const g = mergeGeometries(parts, false); g.userData.lamps = [[1.28, 0, 0.95, 0], [-1.36, 0.45, 0.8, 1], [-1.36, -0.45, 0.8, 1]];
  return g;
}
function sidecarGeometry(body, shirt) {
  const blk = [0.04, 0.04, 0.045], skin = [0.3, 0.17, 0.11], straw = [0.62, 0.55, 0.38], trouser = [0.05, 0.05, 0.07], coat = [0.6, 0.55, 0.45], parts = [];
  // the bike: engine, tank, saddle, frame tubes, forks, handlebar and grips, a headlamp nacelle, mudguards, an exhaust
  parts.push(gSph(0.2, 0, 0.5, 0.05, 0.75, 0.8, 1.25, mul3(CHROME, 0.45), 1, 8), gSph(0.2, 0, 0.92, 0.28, 0.8, 0.7, 1.5, body, 0, 8), gSph(0.2, 0, 0.93, -0.3, 0.85, 0.4, 1.6, blk, 3, 8));
  parts.push(gBar([0, 0.86, 0.6], [0, 0.4, 0.3], 0.05, blk, 3), gBar([0, 0.9, -0.55], [0, 0.36, -0.78], 0.05, blk, 3), gBar([0, 0.4, 0.3], [0, 0.36, -0.78], 0.06, blk, 3));
  for (const sx of [-1, 1]) parts.push(gBar([sx * 0.07, 1.08, 0.58], [sx * 0.08, 0.33, 0.8], 0.04, CHROME, 1), gBar([sx * 0.24, 1.12, 0.6], [sx * 0.37, 1.12, 0.59], 0.05, blk, 3));
  parts.push(gBar([-0.33, 1.12, 0.6], [0.33, 1.12, 0.6], 0.035, CHROME, 1), gSph(0.11, 0, 1.0, 0.8, 1, 1, 1.25, CHROME, 1, 8), gSph(0.09, 0, 1.0, 0.9, 1, 1, 0.5, [0.5, 0.47, 0.38], 4, 6));
  parts.push(gGuard(0, 0.33, 0.8, 0.39, 0.13, body, 0, 0.5, 2.6), gGuard(0, 0.33, -0.8, 0.39, 0.14, body, 0, 0.7, 3.0), gBar([-0.12, 0.42, -0.4], [-0.16, 0.38, -1.02], 0.055, CHROME, 1));
  // the sidecar: a torpedo tub with an open cockpit, a little screen on its nose, its own mudguard, two struts to the bike
  { const tub = gLoft([[-1.0, 0.1, 0.5, 0.62], [-0.8, 0.33, 0.34, 0.8], [-0.2, 0.39, 0.28, 0.86], [0.45, 0.37, 0.28, 0.84], [0.9, 0.24, 0.34, 0.72], [1.12, 0.07, 0.44, 0.58]], () => [body, 0], 10, 0.7); tub.translate(0.78, 0, 0); parts.push(tub);
    const scr = new THREE.BoxGeometry(0.5, 0.26, 0.015); scr.rotateX(-0.55); scr.translate(0.78, 0.95, 0.24); parts.push(tint(scr, GLASSC, 2)); }
  parts.push(gSph(0.3, 0.78, 0.85, -0.25, 0.95, 0.2, 1.3, blk, 3, 8), gBar([0.53, 0.86, 0.3], [1.03, 0.86, 0.3], 0.025, CHROME, 1), gGuard(1.14, 0.3, -0.1, 0.36, 0.13, body, 0, 0.5, 2.8));
  parts.push(gBar([0.08, 0.5, 0.35], [0.5, 0.45, 0.35], 0.04, CHROME, 1), gBar([0.08, 0.5, -0.45], [0.5, 0.45, -0.45], 0.04, CHROME, 1));
  wheels(parts, [[0, 0.33, 0.8, 0.33], [0, 0.33, -0.8, 0.33], [1.14, 0.3, -0.1, 0.3]]);
  // the rider, leaning to the bars: tapered torso, arms out to the grips, knees forward on the pegs, a helmet and goggles
  parts.push(gCyl(0.2, 0.15, 0.56, 0, 1.27, -0.2, shirt, 3, 7, 0.62, 0.3), gCyl(0.05, 0.06, 0.09, 0, 1.6, -0.09, skin, 3, 5), gSph(0.105, 0, 1.71, -0.06, 1, 1.1, 1, skin, 3, 7));
  { const h = new THREE.SphereGeometry(0.125, 8, 5, 0, TAU, 0, PI * 0.56); h.translate(0, 1.73, -0.07); parts.push(tint(h, [0.62, 0.58, 0.48], 0), gBox(0.2, 0.045, 0.03, 0, 1.73, 0.04, blk, 3)); }
  for (const sx of [-1, 1]) {
    parts.push(gBar([sx * 0.23, 1.48, -0.12], [sx * 0.3, 1.26, 0.2], 0.08, shirt, 3), gBar([sx * 0.3, 1.26, 0.2], [sx * 0.31, 1.13, 0.58], 0.062, skin, 3));
    parts.push(gBar([sx * 0.1, 0.98, -0.28], [sx * 0.2, 0.8, 0.14], 0.12, trouser, 3, 0.13), gBar([sx * 0.2, 0.8, 0.14], [sx * 0.19, 0.4, 0.02], 0.1, trouser, 3), gBox(0.09, 0.06, 0.22, sx * 0.19, 0.38, 0.08, blk, 3));
  }
  // the passenger low in the tub: a straw hat, hands on the rim, a red scarf streaming back
  parts.push(gCyl(0.19, 0.16, 0.44, 0.78, 1.0, -0.3, coat, 3, 7, 0.62), gCyl(0.05, 0.06, 0.08, 0.78, 1.25, -0.3, skin, 3, 5), gSph(0.1, 0.78, 1.36, -0.29, 1, 1.1, 1, skin, 3, 7));
  parts.push(gCyl(0.2, 0.21, 0.025, 0.78, 1.45, -0.29, straw, 3, 8), gCyl(0.1, 0.115, 0.1, 0.78, 1.5, -0.29, mul3(straw, 1.15), 3, 7), gBar([0.78, 1.26, -0.4], [0.73, 1.34, -0.98], 0.15, [0.7, 0.1, 0.12], 3, 0.015));
  for (const sx of [-1, 1]) parts.push(gBar([0.78 + sx * 0.2, 1.17, -0.3], [0.78 + sx * 0.31, 0.9, -0.04], 0.07, coat, 3));
  const g = mergeGeometries(parts, false); g.userData.lamps = [[0.92, 0, 0.98, 0], [-1.0, 0, 0.72, 1]];
  return g;
}
// our own car, in camera space (eye at the origin, looking down -Z), top down and no glass across the view: bonnet, chrome
// spear, winged ornament; behind them (below the frame on any screen the world pitches the car for) the cowl, the
// windscreen-foot rail and two parked wipers
function ownCarGeometry(body) {
  const parts = [], nu = 26, nv = 16, P = [], C = [], A = [], I = [];
  const yAt = (x, t) => {
    const ax = Math.abs(x) / 0.95;
    return mix(-0.555, -0.725, t) - 0.07 * t * t * t * t - 0.07 * ax * ax * (1 - 0.3 * t) + 0.04 * Math.exp(-Math.pow((Math.abs(x) - 0.7) / 0.17, 2)) * (1 - 0.5 * t)
      + 0.016 * Math.exp(-Math.pow(x / 0.06, 2)) - 0.3 * sm(0.86, 1, ax);
  };
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const t = j / nv, hw = mix(0.98, 0.86, t * t), x = (i / nu * 2 - 1) * hw, z = -0.9 - 1.42 * t - 0.12 * t * t * (1 - Math.pow(Math.abs(x) / hw, 2));
    P.push(x, yAt(x / hw * 0.95, t), z); C.push(...body); A.push(0);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
  const hood = new THREE.BufferGeometry();
  hood.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); hood.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); hood.setAttribute('aM', new THREE.Float32BufferAttribute(A, 1));
  hood.setIndex(I); hood.computeVertexNormals(); parts.push(hood);
  parts.push(gBar([0, -0.535, -0.95], [0, -0.7, -2.12], 0.03, CHROME, 1, 0.014));                         // centre spear
  // the ornament, the highest thing on the bonnet (the world pitches the car so that little else of it shows): a rocket body
  // on a short pylon and two swept wings rising from it
  parts.push(gSph(0.035, 0, -0.655, -2.2, 0.9, 1.15, 3.4, CHROME, 1, 8), gBox(0.016, 0.06, 0.1, 0, -0.71, -2.19, CHROME, 1));
  for (const sx of [-1, 1]) parts.push(gBar([sx * 0.02, -0.665, -2.21], [sx * 0.23, -0.622, -2.06], 0.055, CHROME, 1, 0.008));
  // the cowl lip behind the hood, the chrome rail at the windscreen's foot, two wipers parked along it
  parts.push(gBox(1.9, 0.03, 0.14, 0, -0.578, -0.835, mul3(body, 0.85), 0));
  parts.push(gBar([-0.81, -0.556, -0.89], [0.81, -0.556, -0.89], 0.022, CHROME, 1));
  for (const x0 of [-0.64, 0.06]) {
    parts.push(gBar([x0, -0.548, -0.908], [x0 + 0.52, -0.541, -0.902], 0.012, [0.03, 0.03, 0.035], 3), gSph(0.014, x0, -0.546, -0.906, 1, 1, 1, CHROME, 1, 6));
  }
  return mergeGeometries(parts, false);
}

// ---------- people implied: bright specks strolling under the arcades, a dozen that run from the wall ----------
function makePeople(U, list, sunny, lampK) {
  const cyl = (rt, rb, h, x, y, z, sz, col, m, seg = 6) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.scale(1, 1, sz); g.translate(x, y, z); return tint(g, col, m); };
  const trouser = [0.05, 0.05, 0.07], skin = [0.3, 0.17, 0.11], straw = [0.62, 0.55, 0.38];
  // a figure that reads as a person at twenty metres and more: shoulders wider than the waist, a stride, arms that hang, a hat
  const parts = [cyl(0.23, 0.15, 0.62, 0, 1.21, 0, 0.6, [1, 1, 1], 1, 7), cyl(0.16, 0.17, 0.16, 0, 0.86, 0, 0.62, trouser, 0, 7),
    gBar([-0.09, 0.84, 0], [-0.1, 0, -0.1], 0.11, trouser, 0, 0.13), gBar([0.09, 0.84, 0], [0.1, 0, 0.12], 0.11, trouser, 0, 0.13),
    gSph(0.105, 0, 1.66, 0, 1, 1.1, 1, skin, 0, 7), cyl(0.05, 0.06, 0.08, 0, 1.54, 0, 1, skin, 0, 5),
    gBar([-0.25, 1.46, 0], [-0.29, 1.12, 0.07], 0.075, [1, 1, 1], 1), gBar([-0.29, 1.12, 0.07], [-0.27, 0.86, 0.02], 0.06, skin, 0),
    gBar([0.25, 1.46, 0], [0.29, 1.12, -0.07], 0.075, [1, 1, 1], 1), gBar([0.29, 1.12, -0.07], [0.27, 0.86, -0.02], 0.06, skin, 0),
    cyl(0.2, 0.21, 0.025, 0, 1.76, 0, 1, straw, 0, 8), cyl(0.1, 0.115, 0.1, 0, 1.81, 0, 1, mul3(straw, 1.15), 0, 7)];
  { const g = new THREE.ConeGeometry(0.62, 0.24, 8); g.translate(0.1, 2.12, 0); parts.push(tint(g, [1, 1, 1], 2), gBox(0.025, 0.7, 0.025, 0.1, 1.75, 0, [0.05, 0.05, 0.05], 2)); }
  const base = mergeGeometries(parts, false), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of ['position', 'normal', 'color', 'aM']) g.setAttribute(k, base.attributes[k]);
  const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), iF = new Float32Array(n * 3), iG = new Float32Array(n);
  list.forEach((p, i) => { iA.set(p.a, i * 4); iB.set(p.b, i * 4); iC.set(p.c, i * 4); iF.set(p.f, i * 3); iG[i] = p.g || 0; });
  g.setAttribute('iG', new THREE.InstancedBufferAttribute(iG, 1));
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iF', new THREE.InstancedBufferAttribute(iF, 3));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const flee = { value: new THREE.Vector3() };          // x: the hero's burst, y and z: the two keyed fans further round the bay
  const m = new THREE.ShaderMaterial({
    fog: true, vertexColors: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uFlee: flee, uSunny: { value: sunny }, uLampK: { value: lampK || 0 } },
    vertexShader: /* glsl */`
      attribute float aM, iG; attribute vec4 iA, iB, iC; attribute vec3 iF; uniform float uTime; uniform vec3 uFlee; varying vec3 vCol, vN; varying float vD;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; if (aM > 1.5) p *= iC.w;                                 // umbrellas only where flagged
        vec2 d = iB.xy; p = vec3(p.x * d.y + p.z * d.x, p.y, -p.x * d.x + p.z * d.y);
        float w = (abs(fract(uTime * iB.z / max(iB.w, 1.) + iA.w) * 2. - 1.) - .5) * iB.w;
        float fl = iG < .5 ? uFlee.x : iG < 1.5 ? uFlee.y : uFlee.z;
        float run = fl * step(.001, abs(iF.x) + abs(iF.z));
        p += iA.xyz + vec3(d.x, 0., d.y) * w * (1. - run) + iF * fl + vec3(0., abs(sin(uTime * (5. + 4. * run) + iA.w * 40.)) * .05, 0.);
        vCol = aM > 1.5 ? iC.brg : aM > .5 ? iC.rgb : color; vN = vec3(normal.x * d.y + normal.z * d.x, normal.y, -normal.x * d.x + normal.z * d.y);
        vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition; vD = length(mvPosition.xyz);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb, uGnd, uLDir; uniform float uSunny, uLampK; varying vec3 vCol, vN; varying float vD;
      #include <fog_pars_fragment>
      void main(){
        // people are specks: anyone the car comes within a few metres of is lost in the spray instead of standing there as a dummy
        vec2 fc = floor(gl_FragCoord.xy); if (fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453) > smoothstep(8., 16., vD)) discard;
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        gl_FragColor = vec4(vCol * (mix(uGnd, uAmb, .5 + .5 * N.y) + uSunCol * uSunny * (.2 + .6 * max(dot(N, uLDir), 0.)) + vec3(1., .64, .34) * uLampK * (.3 + .4 * abs(N.x))), 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return { mesh, flee };
}

// far rain under the shelf cloud: grey veils that slide along the horizon
function makeVeils(quads, color) {
  const P = [], UV = [], E = [], I = [];
  quads.forEach((q, k) => { const o = P.length / 3; P.push(...q[0], ...q[1], ...q[2], ...q[3]); UV.push(0, 0, 1, 0, 1, 1, 0, 1); E.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(o, o + 1, o + 2, o, o + 2, o + 3); for (let i = 0; i < 4; i++) UV[UV.length - 8 + i * 2] += k * 3.7; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 2)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */`attribute vec2 aE; varying vec2 vUv, vE; void main(){ vUv = uv; vE = aE; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uCol; varying vec2 vUv, vE; ${GLSL_N}
      void main(){
        float e = smoothstep(0., .25, vE.x) * (1. - smoothstep(.75, 1., vE.x)) * smoothstep(0., .12, vE.y) * (1. - smoothstep(.5, .92, vE.y));
        float st = .45 + .55 * vn(vec2(vUv.x * 46. + vUv.y * 5. + uTime * .05, vUv.y * 1.6 - uTime * .25));
        float body = smoothstep(.25, .7, fbm(vec2(vUv.x * 3. - uTime * .012, vUv.y * 1.3)));
        gl_FragColor = vec4(uCol, e * st * body * .5);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 0.5; mesh.frustumCulled = false;
  return { mesh, uniforms: m.uniforms };
}

// headlamps and tail lamps of the traffic, lit at dawn, at night and in the rain: one additive sprite per lamp, placed in the
// vertex shader from the same per-vehicle uniforms the spray uses (x, z, heading, speed)
function makeCarLamps(U, veh, list, power) {
  const n = list.length, pos = new Float32Array(n * 12), aL = new Float32Array(n * 16), aC = new Float32Array(n * 12), idx = new Uint32Array(n * 6);
  const CX = [-1, 1, 1, -1], CY = [-1, -1, 1, 1];
  list.forEach((l, i) => {
    for (let c = 0; c < 4; c++) { const o = i * 4 + c; aL.set([l[1], l[2], l[3], l[4]], o * 4); aC.set([CX[c], CY[c], l[0]], o * 3); }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aL', new THREE.BufferAttribute(aL, 4)); g.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uVeh: { value: veh }, uPower: { value: power }, uTime: U.uTime },
    vertexShader: /* glsl */`
      attribute vec4 aL; attribute vec3 aC; uniform vec4 uVeh[${veh.length}]; uniform float uPower; varying vec2 vC; varying vec3 vCol;
      #include <fog_pars_vertex>
      void main(){
        vec4 v = uVeh[int(aC.z + .5)]; vec2 fw = vec2(cos(v.z), sin(v.z)), sd = vec2(-fw.y, fw.x);
        vec3 P = vec3(v.x + fw.x * aL.x + sd.x * aL.y, aL.z, v.y + fw.y * aL.x + sd.y * aL.y);
        vec3 toC = cameraPosition - P; float d = length(toC); toC /= max(d, 1e-3);
        float tail = step(.5, aL.w), face = max(dot(toC.xz, fw) * (1. - 2. * tail), 0.);
        float k = mix(.12 + .88 * face * face, .25 + .75 * face, tail) * uPower * smoothstep(1.5, 5., d) * step(.5, abs(v.w));
        vCol = mix(vec3(1., .82, .56) * 2.4, vec3(1., .07, .03) * 1.5, tail) * k;
        float sz = mix(.75, .34, tail) * (1. + .012 * d);
        vec4 mvPosition = viewMatrix * vec4(P, 1.); mvPosition.xy += aC.xy * sz; vC = aC.xy;
        gl_Position = projectionMatrix * mvPosition;
        if (k < .01) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying vec3 vCol;
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vC, vC), a = exp(-r2 * 5.) * .55 + exp(-r2 * 60.) * 1.6 + exp(-vC.y * vC.y * 90. - vC.x * vC.x * 2.5) * .28;
        a *= 1. - smoothstep(.6, 1., r2);
        float fk = 0.;
        #ifdef USE_FOG
          fk = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        #endif
        gl_FragColor = vec4(vCol * a * (1. - fk), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return mesh;
}

// runoff: after every burst the water on the seaward pavement races back to the scuppers in the wall and pours through them
function makeRunoff(U, fanU, stations, line, base) {
  const P = [], A = [], I = [];
  for (const s of stations) {
    const o = P.length / 3, pt = (ds, l, u, v) => { const p = line.at(s + ds, l); P.push(p[0], 0.165, p[1]); A.push(u, v, s); };
    pt(-0.42, 0.03, -1, 0); pt(0.42, 0.03, 1, 0); pt(1.5, 1.6, 1, 0.34); pt(-1.5, 1.6, -1, 0.34); pt(3.3, 4.85, 1, 1); pt(-3.3, 4.85, -1, 1);
    I.push(o, o + 3, o + 1, o + 1, o + 3, o + 2, o + 3, o + 5, o + 2, o + 2, o + 5, o + 4);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-200, 0, -100), 900);
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uFan: { value: fanU }, uBase: { value: base } },
    vertexShader: /* glsl */`
      attribute vec3 aR; varying vec3 vR;
      #include <fog_pars_vertex>
      void main(){ vR = aR; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb; uniform float uTime, uBase; uniform vec4 uFan[4]; varying vec3 vR;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        float flow = uBase;
        for (int i = 0; i < 4; i++) { vec4 f = uFan[i]; flow = max(flow, (1. - smoothstep(12. * f.z, 34. * f.z, abs(f.x - vR.z))) * smoothstep(2.2, 3.6, f.y) * (1. - smoothstep(6.8, 8.4, f.y))); }
        float x = vR.x, y = vR.y, sp = 1.3 + 2.2 * (1. - y);
        float lace = veins(vec2(x * (1.2 + 2.4 * y) + vR.z, y * 3.2 + uTime * sp));
        float lip = 1. - smoothstep(0., .1, y);
        float a = (lace * (.25 + .75 * (1. - y)) + lip * .8) * (1. - x * x * x * x) * (1. - smoothstep(.75, 1., y)) * flow;
        if (a < .01) discard;
        gl_FragColor = vec4(vec3(.9, .95, .94) * (uSunCol * .5 + uAmb * 1.1), min(a, .9));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 2;
  return mesh;
}

// the wet ground continued below the entry line, for the camera that looks in through the previous world's portal: the engine
// clips the square's floor there, so this hangs from the entry line and carries on its mirror (sky slot in the middle, house
// fronts either side, two faint lamp streaks) into the dark, with no edge where it meets the road
function makeApronMaterial(U, fogHex, lampK, skyRefl) {
  return new THREE.ShaderMaterial({
    uniforms: { uAmb: { value: U.uAmb.value.clone().add(U.uSunCol.value.clone().multiplyScalar(0.2)) }, uTime: U.uTime, uFogC: { value: new THREE.Color(fogHex) }, uLampK: { value: lampK }, uSkyRefl: { value: skyRefl } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAmb, uFogC, uSkyRefl; uniform float uTime, uLampK; varying vec3 vW;
      ${GLSL_N}
      void main(){
        // read the hanging plane as the ground carrying on toward a viewer 1.6 m up and 5 m back: setts in perspective, a mirror that
        // is strong at the grazing top and dies away below, the sky slot of the street down its middle
        float d = max(-vW.y, 0.), h = 1.6, k = h / (h + d);
        vec2 g = vec2(vW.x * k, 5. * d / (h + d));
        float rip = vn(vec2(g.x * 1.3, g.y * 1.6 - uTime * .5)) - .5;
        float sett = smoothstep(.03, .09, abs(fract(g.x * 3.8 + floor(g.y * 5.8) * .5) - .5)) * smoothstep(.04, .12, abs(fract(g.y * 5.8) - .5));
        vec3 alb = mix(vec3(.06, .062, .07), vec3(.16, .15, .14), vn(g * .33 + 3.)) * vec3(1.5, 1.34, 1.15) * (.62 + .5 * sett);
        float slot = 1. - smoothstep(.9, 2.7, abs(g.x + rip * .6));
        vec3 refl = mix(uAmb * vec3(.55, .44, .4) * (.7 + .6 * vn(vec2(g.x * .5, 7.))), uSkyRefl, slot);
        float fr = 1. - (h + d) / length(vec2(h + d, 5.)); fr = .04 + .96 * fr * fr * fr * fr * fr;
        vec3 col = mix(alb * uAmb * 1.25, refl, clamp(fr * 3.4, 0., .62) * (.75 + .5 * rip));
        float sx = (abs(g.x) - 3.9) / (.22 + g.y * .12);
        col += vec3(1., .55, .2) * exp(-sx * sx) * uLampK * .28 * clamp(fr * 4., 0., 1.);
        col = mix(col, uFogC * .14, smoothstep(.2, .9, d / 14.));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// ---------- the night's moon: a gibbous disc with its maria and a wide halo that lights the torn cloud round it ----------
// (the kit sky's own moon sits behind the dome's cloud layer and is lost on most nights; this one hangs in front of it)
function makeMoon() {
  const m = new THREE.ShaderMaterial({
    transparent: true, premultipliedAlpha: true, depthWrite: false,
    uniforms: { uCol: { value: new THREE.Color('#e9eeff').multiplyScalar(3.0) }, uGlow: { value: new THREE.Color('#8ea6f4').multiplyScalar(0.9) } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uCol, uGlow; varying vec2 vUv; ${GLSL_N}
      void main(){
        float r = length(vUv), R = .16;
        float disc = 1. - smoothstep(R - .008, R + .008, r);
        vec2 q = vUv / R; float z = sqrt(max(1. - dot(q, q), 0.));
        float lit = smoothstep(-.12, .3, dot(vec3(q, z), vec3(-.42, .24, .875)));
        float maria = smoothstep(.42, .62, fbm(q * 1.7 + 3.)) * .34 + smoothstep(.5, .7, fbm(q * 4.1 + 9.)) * .12;
        vec3 col = uCol * (1. - maria) * (.12 + .88 * lit) * (.72 + .28 * z);
        float halo = (exp(-r * r * 16.) * .6 + exp(-r * 3.4) * .14) * (1. - smoothstep(.7, 1., r));
        gl_FragColor = vec4(col * disc + uGlow * halo * (1. - disc * lit), disc);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); mesh.renderOrder = -0.9; mesh.frustumCulled = false; mesh.scale.setScalar(1700);
  return mesh;
}

// ---------- the cloud noise the kit's cloud fields read (same recipe as the kit's own: tileable fbm in R and G, shifted copies
// in B and A), built here in short steps so no single call into the kit holds the page for the 25 ms the kit's version takes
async function makeCloudNoise(rng, pause, size = 256) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        if ((y & 31) === 0) await pause();
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
          acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
        }
      }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = 0; y < size; y++) {
    if ((y & 31) === 0) await pause();
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s]); data[p * 4 + 3] = px(f[0][s2]);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// ---------- the sea beside the road: swells that steepen and stand up as they run in on the wall, tall enough to show over it ----------
// (the kit's ocean lies 4 m under the road, where a low car beside a wall never sees it; this strip rides above it for 250 m out)
const SWELL_H = /* glsl */`
float gCrest;
float swellH(vec2 q, float t){
  float s = q.x, d = q.y, sh = exp(-d / 70.);
  float grp = .58 + .42 * sin(s * .031 + d * .043 - t * .21) * sin(s * .0117 - t * .13 + 1.7);
  float c1 = .5 + .5 * sin(d * .155 + s * .034 + t * 1.05), c2 = .5 + .5 * sin(d * .262 - s * .051 + t * 1.42 + 1.3);
  float h = 1.9 * c1 * c1 * grp + .8 * c2 * c2 * (1.3 - grp) + .22 * sin(d * .47 + s * .12 + t * 2. + 4.) - .75;
  gCrest = h;
  float y = mix(-3.6, -1.5, sh) + mix(1.2, 2.2, sh) * h;
  y = min(y, .9 + (d - 1.) * .22);
  float sink = smoothstep(170., 250., d) + (1. - smoothstep(-158., -120., s)) + smoothstep(566., 606., s);
  return y - 3.4 * min(sink, 1.);
}
`;
function makeSwell(U, line, look, glintDir, glintCol) {
  const DS = [1, 2.6, 4.6, 7, 10, 13.5, 17.5, 22, 27, 33, 40, 48, 57, 67, 79, 93, 110, 130, 154, 182, 215, 255], S0 = -160, S1 = 608, step = 4, ns = (S1 - S0) / step, nd = DS.length;
  const P = new Float32Array((ns + 1) * nd * 3), A = new Float32Array((ns + 1) * nd * 3), I = [], q = [0, 0];
  for (let i = 0, o = 0; i <= ns; i++) { const s = S0 + i * step, th = line.theta(s); for (let j = 0; j < nd; j++, o += 3) { line.at(s, -DS[j], q); P[o] = q[0]; P[o + 2] = q[1]; A[o] = s; A[o + 1] = DS[j]; A[o + 2] = th; } }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nd - 1; j++) { const a = i * nd + j, b = a + nd; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.BufferAttribute(A, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-200, 0, -100), 1000);
  const m = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uDeep: { value: new THREE.Color(look.sea[0]) }, uShal: { value: new THREE.Color(look.sea[1]) },
      uGlintDir: { value: glintDir.clone().normalize() }, uGlintCol: { value: glintCol } },
    vertexShader: /* glsl */`
      attribute vec3 aS; uniform float uTime; varying vec3 vW, vS;
      #include <fog_pars_vertex>
      ${SWELL_H}
      void main(){
        vS = aS; vec4 wp = modelMatrix * vec4(position.x, swellH(aS.xy, uTime), position.z, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uAmb, uDeep, uShal, uGlintDir, uGlintCol; uniform float uTime; varying vec3 vW, vS;
      #include <fog_pars_fragment>
      ${GLSL_N}${GLSL_SKY}${SWELL_H}
      void main(){
        float s = vS.x, d = vS.y, th = vS.z, e = .7;
        float hs = (swellH(vec2(s + e, d), uTime) - swellH(vec2(s - e, d), uTime)) / (2. * e), hd = (swellH(vec2(s, d + e), uTime) - swellH(vec2(s, d - e), uTime)) / (2. * e);
        swellH(vec2(s, d), uTime); float crest = gCrest;
        vec2 T = vec2(-cos(th), -sin(th)), Sd = vec2(sin(th), -cos(th));            // along the wall, and out to sea
        vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
        vec2 cp = vW.xz * .55 + uTime * vec2(.5, .8); float cf = 1. / (1. + dist * .02);
        vec2 chop = vec2(fbm(cp + vec2(.4, 0.)) - fbm(cp - vec2(.4, 0.)), fbm(cp + vec2(0., .4)) - fbm(cp - vec2(0., .4))) * 1.6 * cf;
        vec3 N = normalize(vec3(-(hs * T.x + hd * Sd.x) - chop.x, 1., -(hs * T.y + hd * Sd.y) - chop.y));
        float ndl = max(dot(N, uLDir), 0.);
        float g = 1. - max(dot(N, V), 0.); float g2 = g * g; float F = .03 + .97 * g2 * g2 * g;
        vec3 R = reflect(-V, N); R.y = abs(R.y) + .02; R = normalize(R);
        // the body of the sea, thin and green where a crest stands up against the light
        vec3 col = mix(uDeep, uShal, smoothstep(.2, 1.6, crest) * .85) * (uSunCol * (.3 + .7 * ndl) + uAmb * 1.3);
        col = mix(col, skyAt(R), F * .8);
        float sp = max(dot(R, uGlintDir), 0.), sp2 = sp * sp, sp4 = sp2 * sp2, sp8 = sp4 * sp4, sp16 = sp8 * sp8;
        col += uGlintCol * (sp16 * sp16 * sp16 * sp16 * 1.3 + sp8 * sp4 * .05);
        // foam: caps where the crests break, lace sliding down their backs, churned water at the foot of the wall
        float caps = smoothstep(1.05, 1.7, crest + .55 * (fbm(vec2(s * .21 + uTime * .2, d * .35 + uTime * .9)) - .5));
        float lacef = veins(vec2(s * .3 + sin(uTime * .4) * .6, d * .3 + uTime * .35));
        float shore = 1. - smoothstep(2., 16., d);
        float foam = clamp(caps * (.5 + .5 * lacef) + shore * lacef * .8 + smoothstep(.55, .75, fbm(vec2(s * .09, d * .4 + uTime * .5))) * lacef * .3, 0., 1.);
        col = mix(col, vec3(.92, .96, .95) * (uSunCol * (.4 + .6 * ndl) + uAmb * 1.25 + uGlintCol * .2), foam);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 0.5;
  return mesh;
}

// ---------- (round 14) THE BLUFF OF THE DESIGN: 'over the channel a 45 m bluff carries the fortress and a 25 m lighthouse' ----------
// A place with a plan and a section, standing on live's flattened ball (which stays, with its sixteen rocks, as its wave-cut foot).
// TWO MASSES of one rock, each a face drawn about its own middle by the same rule:
//   the CRAG: its top is the fortress's footprint over its bastions and 2.6 to 3.2 m of rim (a squared oval in the fortress's own
//     frame, half-axes A and B), with a round tip under the lighthouse; 41 m over the road;
//   the SPUR: a lower shoulder running out from under the lighthouse's tip toward the sea, behind the surf at the bluff's foot:
//     the face the sea climbs and drains from. Its crest falls from two thirds of the bluff's height over the sea at the crag to
//     two fifths at its seaward end, lumpy and notched; that end's foot (rim, run and buttress) is set two ring radii left of
//     the exit's axis (RING_R), a rule of the ground; its ledges and joints stand 0.3 to 1.8 m beyond that (six seeds counted).
// SECTION: sheer above, running out toward the sea's level (0.15 v + 0.85 v^4 of the run, v the depth below the top), in buttresses
// that stand out more the lower they go; ledges at the given shares of the height, each broken along its length; joints every
// `joint` metres along the face, set over from tier to tier, the columns between them standing in and out. Never overhanging.
// WHERE IT MAY STAND: `barred(x, z)` says where no rock may be (nearer the portal, the apron or the flown line than live's ball is,
// or where the surf at its foot flies); every bearing is walked outward from the middle and the face is held inside the first
// barred metre, stepping back from it tier by tier as it rises and cut back between its buttresses (so a held face keeps its
// ledges and its gullies). Two forms of the one surface:
// the near one (every bearing, four rows to a riser) and the far one (every third bearing, one row to a riser), swapped by the
// eye's distance alone (BLUFF.lod heights of the bluff).
const BLUFF = { top: 41, sea: -4, A: 25.6, B: 19.6, pow: 6, tipR: 6.4, runNear: 5, runRoad: 5, runFar: 6, runLand: 14,
  ledges: [0.2, 0.42, 0.62, 0.8], ledgeW: [0.8, 1.1, 1.5, 2.0], rib: 3.2, ribRim: 1.2, gully: 1.6, nphi: 216,
  // the spur: its crest over the sea as shares of the bluff's (at the crag, at its seaward end), how far it rises and falls along
  // the way and how deep its notches are; its half-lengths along and across the exit's axis; its middle is given by the build,
  // from the surf it stands behind and the portal it stands clear of
  sTop: 2 / 3, sLow: 2 / 5, sLump: 1.8, sNotch: 2.5, sA: 9.5, sB: 14.5, sPow: 4, sRun: 3, sLedges: [0.25, 0.5, 0.75], sLedgeW: [0.8, 1.1, 1.4], sRib: 1.5, sGully: 2.2, sNphi: 96,
  joint: 3.6, blocks: 26, lod: 7,
  // (round 16) the stair's bay on the crag: how far the limit must stand beyond the rim where it begins (every tier, the stair and
  // its landing stage), how many bearings wide it is, its ledges' least width, the stair's parapet (round 17: 0.6 m high and 0.2 m
  // thick, for 0.9 and 0.3), the lanterns' height, and (round 17) the square of the distance at which a stair lantern's light is half
  // (its light is 1 over 1 plus the fourth power of the distance over 3 m, 1 in 17 at 6 m; a fortress lantern's falls with the square)
  // and its strength on the masonry near it (the stair's dark stone, and the fortress's wall round the postern's lantern) against a fortress lantern's
  bayRoom: 17, bayCols: 20, bayW: 1.2, stairLip: 0.15, parapet: 0.6, parapetT: 0.2, stage: 1.0, lampUp: 2.25, stairHalf2: 9, stairGlow: 1.5 };
// (round 16) how many lanterns the rock's shader reads: the fortress's six, the stair's (six at the most) and the postern's
const BLUFF_LANT = 14;
// (14b) the radius of the portal's ring, as the portal's spec in the build's return gives it (that block is live's own and is made
// after the bluff is built, so the number stands here once more: the two must be changed together)
const RING_R = 6.5;
async function buildBluff(o) {
  const { n3, rng, c, eX, eZ, tip, shoulder, ballAt, barred, pause, rockGeometry, makeRng, road } = o, Q = BLUFF, sd = rng.range(0, 60);
  // ---- a mass: every bearing's rim, run, buttress, how far out it is free, its ledges' levels and widths, its metres round the rim
  const mass = async (b) => {
    const NF = b.nphi, K = b.ledges.length, cols = []; let s = 0, px = 0, pz = 0;
    for (let i = 0; i < NF; i++) {
      const ph = i / NF * TAU, cs = Math.cos(ph), sn = Math.sin(ph), wx = b.eX[0] * cs + b.eZ[0] * sn, wz = b.eX[1] * cs + b.eZ[1] * sn;
      const rib = sm(-0.1, 0.55, n3.n3(cs * 2.4, sn * 2.4, 40 + sd + b.sd)), rt = b.rim(cs, sn) + rib * b.ribRim;
      if (i) s += Math.hypot(rt * cs - px, rt * sn - pz); px = rt * cs; pz = rt * sn;
      let free = 80;
      for (let t = b.walk; t < 80; t += 1) if (barred(b.c[0] + wx * t, b.c[1] + wz * t)) { free = t - 1; for (let q = 0; q < 4 && !barred(b.c[0] + wx * (free + 0.25), b.c[1] + wz * (free + 0.25)); q++) free += 0.25; break; }
      const top = b.topAt(b.c[0] + wx * rt, b.c[1] + wz * rt), H = top - Q.sea, lev = [], w = [];
      // (round 16) toward the road (the bearing's own outward way set against the exit's axis: a rule of the ground, no eye in it)
      // the ledges are whole, as wide as written; elsewhere the noise breaks them as before
      const face = sm(0.2, 0.7, wx * road[0] + wz * road[1]);
      for (let k = 0; k < K; k++) { lev.push(top - (b.ledges[k] + 0.035 * n3.n3(cs * 1.9, sn * 1.9, 5.1 + 17 * k + sd + b.sd)) * H); w.push(b.ledgeW[k] * mix(sm(-0.25, 0.35, n3.n3(cs * 2.7, sn * 2.7, 9.4 + 31 * k + sd + b.sd)), 1, face)); }
      // (j0: the joint column's own step, the same on every tier, for a held face and for the stair's bay)
      cols.push({ cs, sn, rt, wx, wz, s, free, top, H, lev, w, rib, ribF: rib, win: 0, j0: n3.n2(Math.floor(s / Q.joint) * 7.31 + sd + b.sd, 0), run: b.run(cs, sn) });
      if (i % 24 === 23) await pause();
    }
    for (let i = 0; i < NF; i++) cols[i].rmax = Math.min(cols[(i + NF - 1) % NF].free, cols[i].free, cols[(i + 1) % NF].free);
    // (round 16) THE STAIR'S BAY (the crag alone): going round from the surf at its foot toward the land, the first bearing where
    // the limit stands Q.bayRoom beyond the rim, and Q.bayCols bearings on from it. In the bay the ledges lie level and are each at
    // least a stair's width, the buttresses are evened, the joints run straight up through every tier and the face's small relief
    // is damped, so that a flight can stand on each ledge; the window fades over three bearings to either side. No bay where the limit comes nearer along it.
    let bay = null;
    if (b.bayFrom != null) {
      const a0 = Math.round(b.bayFrom / TAU * NF);
      for (let i = a0; i < a0 + NF / 4 && !bay; i++) if (i + Q.bayCols + 4 < NF && cols[i].rmax - 0.4 - cols[i].rt >= Q.bayRoom) bay = { i0: i, i1: i + Q.bayCols };
      if (bay) for (let i = bay.i0; i <= bay.i1; i++) if (cols[i].rmax - 0.4 - cols[i].rt < Q.bayRoom - 4.5) { bay = null; break; }
      if (bay) for (let i = bay.i0 - 3; i <= bay.i1 + 3; i++) {
        const col = cols[i], win = sm(bay.i0 - 3.5, bay.i0 - 0.5, i) * sm(bay.i1 + 3.5, bay.i1 + 0.5, i);
        col.win = win; col.ribF = mix(col.rib, 0.5, win);
        for (let k = 0; k < K; k++) { col.lev[k] = mix(col.lev[k], col.top - b.ledges[k] * col.H, win); col.w[k] = mix(col.w[k], Math.max(b.ledgeW[k], Q.bayW), win); }
      }
    }
    for (let i = 0; i < NF; i++) { const col = cols[i]; col.all = 0.8 + b.gully; for (let k = 0; k < K; k++) col.all += col.w[k]; }      // (the most a held face can step back in all)
    const sAll = s + Math.hypot(cols[0].rt - px, pz);      // once round the rim (the first bearing lies along the mass's own X)
    // the face at a bearing, on tier t (the riser under t ledges), at height y
    const R = (col, t, y) => {
      const v = (col.top - y) / col.H, r0 = col.rt + col.run * (0.15 * v + 0.85 * v * v * v * v) + col.ribF * b.rib * sm(0, 0.5, v), x = b.c[0] + col.wx * r0, z = b.c[1] + col.wz * r0;
      const jt = n3.n2(Math.floor(col.s / Q.joint + 0.37 * t) * 7.31 + sd + b.sd, t * 3.7), jn = col.win > 0 ? mix(jt, 0.35 * col.j0, col.win) : jt;
      let r = r0, below = 0;
      for (let k = 0; k < K; k++) { if (k < t) r += col.w[k]; else below += col.w[k]; }
      r += 0.55 * jn * sm(0.02, 0.1, v) + 0.9 * n3.n3(x * 0.045, y * 0.05, z * 0.045 + sd) * sm(0, 0.15, v) + 0.3 * n3.n3(x * 0.3, y * 0.33, z * 0.3) * sm(0, 0.08, v) * (1 - 0.8 * col.win);
      // (round 16) HELD: the foot stands at the limit (less its joint column's own step, the same on every tier, and its gully) and
      // every tier above stands back by the whole width of each ledge under it, so a held face keeps its ledges as written. The
      // spur's rim is cut back for them (never by more than six tenths of its radius); the crag's is the fortress's plan and is never cut: where
      // the room between its rim and the limit is less than the whole step, the tiers share that room in proportion.
      const lim = col.rmax - 0.4, room = lim - col.rt, give = 0.45 * (0.5 + 0.5 * col.j0) + 0.35 * (0.5 + 0.5 * n3.n3(x * 0.2, y * 0.25 + 7, z * 0.2)) + (1 - col.ribF) * b.gully;
      const held = b.cut ? Math.max(lim - give - below, 0.4 * Math.min(col.rt, lim)) : room >= col.all ? lim - give - below : room > 0 ? col.rt + room * (1 - (give + below) / col.all) : lim;
      return Math.min(r, held);
    };
    let rimHeld = 0;
    for (let i = 0; i < NF; i++) { const col = cols[i], rb = R(col, K, 3); col.foot = rb; col.bench = Math.max(Q.sea, Math.min(6.4, ballAt(b.c[0] + col.wx * (rb + 0.5), b.c[1] + col.wz * (rb + 0.5)))); if (R(col, 0, col.top) < col.rt - 0.05) rimHeld++; }
    await pause();
    return { b, cols, R, sAll, K, NF, rimHeld, bay };
  };
  const rTop = (cs, sn) => {
    const sq = Math.pow(Math.pow(Math.abs(cs) / Q.A, Q.pow) + Math.pow(Math.abs(sn) / Q.B, Q.pow), -1 / Q.pow);
    const cd = tip[0] * cs + tip[1] * sn, disc = Q.tipR * Q.tipR - (tip[0] * tip[0] + tip[1] * tip[1]) + cd * cd, tp = disc > 0 ? cd + Math.sqrt(disc) : 0;
    return Math.log(Math.exp(1.5 * sq) + Math.exp(1.5 * tp)) / 1.5;
  };
  const crag = await mass({ c, eX, eZ, top: Q.top, topAt: () => Q.top, warm: 1, rim: rTop, run: (cs, sn) => cs * cs * (cs < 0 ? Q.runNear : Q.runFar) + sn * sn * (sn > 0 ? Q.runRoad : Q.runLand),
    ledges: Q.ledges, ledgeW: Q.ledgeW, rib: Q.rib, ribRim: Q.ribRim, gully: Q.gully, nphi: Q.nphi, walk: 4, sd: 0, cut: false, bayFrom: o.bayFrom });
  // the spur's crest: by place, from the crag's end (its own -Z) to the sea's (+Z), lumpy, with notches
  const sHi = Q.sea + (Q.top - Q.sea) * Q.sTop, sLo = Q.sea + (Q.top - Q.sea) * Q.sLow;
  const spurTop = (x, z) => mix(sHi, sLo, sm(-0.8 * Q.sB, Q.sB, (x - shoulder.c[0]) * shoulder.eZ[0] + (z - shoulder.c[1]) * shoulder.eZ[1])) + Q.sLump * n3.n3(x * 0.09, sd + 100, z * 0.09) - Q.sNotch * sm(0.5, 0.75, 0.5 + 0.5 * n3.n3(x * 0.2 + 7, sd, z * 0.2));
  const step = await mass({ c: shoulder.c, eX: shoulder.eX, eZ: shoulder.eZ, top: sHi, topAt: spurTop, warm: 0, rim: (cs, sn) => Math.pow(Math.pow(Math.abs(cs) / Q.sA, Q.sPow) + Math.pow(Math.abs(sn) / Q.sB, Q.sPow), -1 / Q.sPow),
    run: () => Q.sRun, ledges: Q.sLedges, ledgeW: Q.sLedgeW, rib: Q.sRib, ribRim: 0, gully: Q.sGully, nphi: Q.sNphi, walk: 2, sd: 100, cut: true });
  const masses = [crag, step];
  // (round 16) THE STAIR'S PLAN, from the crag's top down to the ground: flights to and fro between the bay's two ends, the first
  // from the rim at the end nearer the surf. Each stands on its ledge with its wall just inside that ledge's lip and its treads
  // against the riser behind (the lowest stands on the ground, against the foot), level for one bearing at either end where the
  // next is met. It ends where it meets the ground (the mound's skin or a rock on it), or, where the foot stands in the sea, runs
  // out level as a landing stage over the water. A lantern at the head, at every turn and at the foot. Every place is read from
  // the crag's own face; no die is drawn.
  const stair = await (async () => {
    const bay = crag.bay; if (!bay) return null;
    const { cols, R, K } = crag, n = Q.bayCols, mid = cols[(bay.i0 + bay.i1) >> 1], gAt = o.groundNear(c[0] + mid.wx * (mid.foot + 2), c[1] + mid.wz * (mid.foot + 2), 34);
    const lev = cols[bay.i0].lev, stage = Q.sea + Q.stage, drop = (lev[K - 2] - lev[K - 1]) / (n - 2), flights = [], lamps = [], posts = [];
    let foot = null;
    const lamp = (st) => { posts.push(st); lamps.push([c[0] + st.wx * (st.ro + 0.3), st.y + Q.lampUp, c[1] + st.wz * (st.ro + 0.3)]); };
    for (let f = 0; f <= K && !foot; f++) {
      const yT = f === 0 ? cols[bay.i0].top : lev[f - 1], yB = f < K ? lev[f] : stage, run = [];
      for (let j = 0; j <= n; j++) {
        const col = cols[f % 2 ? bay.i1 - j : bay.i0 + j];
        const y = f < K ? (j <= 1 ? yT : j >= n - 1 ? yB : mix(yT, yB, (j - 1) / (n - 2))) : Math.max(stage, yT - drop * Math.max(0, j - 1)), flat = f === K && y <= stage + 1e-6;
        const ro = Math.min(col.rmax - 0.1, f < K ? R(col, f + 1, col.lev[f] - 0.25) - Q.stairLip : R(col, K, y) + (flat ? 2.4 : 1.3)), ri = R(col, f, f < K ? Math.max(y, col.lev[f]) : y) - 0.3;
        const xo = c[0] + col.wx * ro, zo = c[1] + col.wz * ro, g = gAt(xo, zo), st = { xo, zo, xi: c[0] + col.wx * ri, zi: c[1] + col.wz * ri, y, yb: f < K ? col.lev[f] - 0.4 : Math.max(g - 0.6, Q.sea - 1.5), wx: col.wx, wz: col.wz, ro, f, j };
        if (f === K && barred(xo, zo)) { foot = run.length ? run[run.length - 1] : flights[flights.length - 1][n]; break; }
        run.push(st);
        if ((f > 0 || j > 1) && y <= Math.max(Q.sea, g) + 0.1) { foot = st; break; }      // it has come down to the ground
      }
      if (run.length > 1) flights.push(run);
      if (f === 0) lamp(run[0]);                                                             // the head, at the rim
      if (!foot && f < K) lamp(run[n]);                                                      // a turn
      if (f === K && !foot) foot = run[run.length - 1];                                      // the stage's end
      await pause();
    }
    if (foot && (foot.j >= 5 || foot.f === 0)) lamp(foot);                                    // the foot (a turn's lantern serves it where it is near one)
    const head = flights[0][0], hx = c[0] + head.wx * cols[bay.i0].rt - c[0], hz = c[1] + head.wz * cols[bay.i0].rt - c[1];
    return { flights, lamps, posts, foot: { y: foot.y, f: foot.f, j: foot.j, sea: foot.f === K && foot.y <= stage + 1e-6 }, headZ: hx * eZ[0] + hz * eZ[1], bay: [bay.i0 / crag.NF * 360, bay.i1 / crag.NF * 360] };
  })();
  // the fallen blocks: every die of every block first (its bearing, how far out, its size, kind, turn and the seed of its own shape), then the test
  const dice = [];
  for (let i = 0; i < Q.blocks; i++) dice.push({ ph: rng(), out: rng.range(0.3, 4.5), rad: rng.range(1.3, 3.3), slab: rng.chance(0.5), spin: rng() * TAU, seed: rng.int(1, 2147483646) });
  const form = async (stp, m, blockDetail) => {
    const parts = [], layout = [];
    for (const M of masses) {
      const { b, cols, R, sAll, K, NF } = M, P = [], C = [], UV = [], I = [], nc = NF / stp, per = (K + 1) * (m + 1);
      for (let a = 0; a <= nc; a++) {        // (the first bearing is laid again at the end with the rim's whole length, so the joints' count runs on round the back)
        const col = cols[(a % nc) * stp], sC = a === nc ? sAll : col.s;
        for (let t = 0; t <= K; t++) {
          const yT = t === 0 ? col.top : col.lev[t - 1] - 0.25, yB = t < K ? col.lev[t] : Q.sea - 1.2, jc = Math.floor(col.s / Q.joint + 0.37 * t);
          for (let j = 0; j <= m; j++) {
            const y = yT + (yB - yT) * j / m, r = R(col, t, y), x = b.c[0] + col.wx * r, z = b.c[1] + col.wz * r;
            // dark basalt, darker than live's rocks; a column a little lighter or darker than its neighbours; pale where a ledge's lip is
            // scoured, dark under it; dry and warm for the last metres under the walls
            const k = BLUFF_ROCK * (0.8 + 0.3 * n3.n2(jc * 3.1 + sd + b.sd, t * 5.3) + 0.16 * n3.n3(x * 0.11, y * 0.21, z * 0.11)) * (t > 0 && j === 0 ? 1.3 : t > 0 && j === 1 && m > 1 ? 0.8 : 1), warm = b.warm * 0.55 * sm(9, 0, col.top - y);
            P.push(x, y, z); C.push(mix(k, k * 1.75, warm), mix(k * 1.02, k * 1.42, warm), mix(k * 1.1, k * 0.98, warm)); UV.push(sC / Q.joint + 0.37 * t, y - col.bench);
          }
        }
        if (a % 36 === 35) await pause();
      }
      const flip = (() => { const a = 0, q = per, d = 1, ux = P[q * 3] - P[a * 3], uz = P[q * 3 + 2] - P[a * 3 + 2], vy = P[d * 3 + 1] - P[a * 3 + 1]; return (-vy * uz) * cols[0].wx + (ux * vy) * cols[0].wz < 0; })();   // which winding faces outward
      const tri = (a, q, d) => { if (flip) I.push(a, d, q); else I.push(a, q, d); };
      for (let a = 0; a < nc; a++) for (let j = 0; j < per - 1; j++) { const p = a * per + j, q = p + per; tri(p, q, p + 1); tri(q, q + 1, p + 1); }
      // the top: bare trodden rock, as live's flat top is (the fortress stands on nearly all of the crag's; the spur's is wet and dark)
      const base = P.length / 3, sh = b.warm ? 0.9 : 0.5;
      P.push(b.c[0], b.topAt(b.c[0], b.c[1]) + 0.2, b.c[1]); C.push(0.2 * sh, 0.17 * sh, 0.11 * sh); UV.push(0.5, 40);
      for (let a = 0; a < nc; a++) { const col = cols[a * stp], r = Math.min(col.rt, R(col, 0, col.top)) * 0.6, x = b.c[0] + col.wx * r, z = b.c[1] + col.wz * r, k = sh * (0.9 + 0.2 * n3.n2(x * 0.2, z * 0.2));
        P.push(x, b.topAt(x, z) + 0.15 + 0.1 * n3.n2(x * 0.3 + 5, z * 0.3), z); C.push(0.2 * k, 0.17 * k, 0.11 * k); UV.push(0.5, 40); }
      for (let a = 0; a < nc; a++) { const ia = base + 1 + a, ib = base + 1 + (a + 1) % nc, ra = a * per, rb = ra + per;
        if (flip) { I.push(base, ia, ib, ia, ra, rb, ia, rb, ib); } else { I.push(base, ib, ia, ia, rb, ra, ia, ib, rb); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
      parts.push(g); layout.push({ nc, per, verts: P.length / 3, c: b.c, eX: b.eX, eZ: b.eZ, top: b.top });
      await pause();
    }
    let laid = 0;
    for (const d of dice) {
      const ci = Math.floor(d.ph * crag.NF) % crag.NF, col = crag.cols[ci], r = col.foot + d.out + d.rad * 0.6, x = c[0] + col.wx * r, z = c[1] + col.wz * r;
      if (crag.bay && ci >= crag.bay.i0 - 2 && ci <= crag.bay.i1 + 2) continue;      // (round 16) none on the stair
      if (barred(x, z) || barred(x + col.wx * d.rad, z + col.wz * d.rad) || barred(x - col.wz * d.rad, z + col.wx * d.rad) || barred(x + col.wz * d.rad, z - col.wx * d.rad)) continue;
      const yb = Math.max(Q.sea - 0.5, ballAt(x, z)), bg = rockGeometry({ rng: makeRng(d.seed), noise: n3, kind: d.slab ? 'slab' : 'rock', detail: blockDetail, radius: d.rad, color: '#5b5c64', colorB: '#44454c' });
      bg.rotateY(d.spin); bg.translate(x, yb + d.rad * (d.slab ? 0.08 : 0.3), z); bg.deleteAttribute('normal');
      const n = bg.attributes.position.count, uv = new Float32Array(n * 2), ix = new Array(n);
      for (let i = 0; i < n; i++) { uv[i * 2] = 0.5; uv[i * 2 + 1] = bg.attributes.position.getY(i) - Math.max(Q.sea, yb); ix[i] = i; }
      bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setIndex(ix); parts.push(bg); laid++;
      if (laid % 8 === 0) await pause();
    }
    const geo = mergeGeometries(parts, false); geo.computeBoundingSphere();
    return { geo, laid, tris: geo.index.count / 3, layout };
  };
  const near = await form(1, 4, 1);
  await pause();
  const far = await form(3, 1, 0);
  // (14b) the wash line's clock: one start time, the stream's last die (after every block's), evenly over ten whole turns of the wash's sine
  return { near, far, stair, rimHeld: [crag.rimHeld, step.rimHeld], washAt: rng.range(0, 10) * TAU / 0.9 };
}
// its rock: live's rocks' own standard material (so the look's light, shadows and fog are theirs), flat shaded, and on it by place:
// hairline joints and beds; the wet band (the lower face darker and glossy as high as the surf at its foot climbs); the white wash
// line at its foot; the water of that surf draining down the face in runnels (a film first, thinning to threads); by night the
// moon on its wet faces; and the fortress's lanterns on the last metres under the walls.
const BLUFF_PARS = /* glsl */`
uniform float uBTime, uBPhase; uniform vec4 uBSurf, uBFan, uBLant[${BLUFF_LANT}]; uniform vec3 uBMoon, uBMoonCol, uBLantCol;
varying vec3 vBW; varying vec2 vBUv;
float bh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(bh(i), bh(i + vec2(1., 0.)), f.x), mix(bh(i + vec2(0., 1.)), bh(i + vec2(1., 1.)), f.x), f.y); }
float bfb(vec2 p){ return 0.5 * bvn(p) + 0.3 * bvn(p * 2.03 + 11.) + 0.2 * bvn(p * 4.1 + 23.); }
`;
const BLUFF_MAIN = /* glsl */`
{ vec3 nW = inverseTransformDirection(normal, viewMatrix);
  float steep = 1. - smoothstep(0.55, 0.85, nW.y), hb = vBUv.y;
  // joints (whole numbers of the face's own count along the rim) and beds: dark hairlines on the faces
  // (a joint wanders as it runs down the face, one in two is strong, and each is broken along its length; beds are few and bent)
  float jx = vBUv.x + 0.3 * (bvn(vec2(vBUv.x * 0.9, vBW.y * 0.11)) - 0.5), jk = bh(vec2(floor(jx + 0.5), 3.1));
  float jn = smoothstep(0.88, 0.985, abs(fract(jx) - 0.5) * 2.) * smoothstep(0.25, 0.6, jk) * smoothstep(0.3, 0.55, bvn(vec2(floor(jx + 0.5) * 1.7, vBW.y * 0.21)));
  float bed = smoothstep(0.9, 0.985, abs(fract(vBW.y * 0.19 + 0.9 * bvn(vBW.xz * 0.05)) - 0.5) * 2.) * 0.6 * smoothstep(0.35, 0.6, bvn(vec2(vBUv.x * 0.31, vBW.y * 0.19)));
  diffuseColor.rgb *= 1. - 0.5 * max(jn, bed) * steep;
  diffuseColor.rgb *= 0.86 + 0.28 * bfb(vec2(vBUv.x * 1.9, vBW.y * 0.22));
  // the fan at its foot, in the fan's own frame: xf metres along its width; how high its water climbs at this place
  float xf = dot(vBW.xz - uBFan.xy, uBFan.zw), q = xf / max(uBSurf.w, 1.), zone = 1. - smoothstep(0.8, 1.15, abs(q));
  float reach = uBSurf.z * (1. - 0.4 * q * q) * (0.86 + 0.28 * bvn(vec2(xf * 0.31, 2.7)));
  // wet: always below the wash, and as high as the surf climbs where it climbs
  float hs = vBW.y - (${BLUFF.sea.toFixed(1)});
  float wet = max(max(1. - smoothstep(2., 6.5, hb + 2. * bvn(vec2(vBUv.x * 2.3, 1.3))), 1. - smoothstep(4., 9., hs + 2.5 * bvn(vec2(vBUv.x * 1.9, 4.4)))), zone * (1. - smoothstep(reach - 3., reach + 1.5, vBW.y)));
  diffuseColor.rgb *= mix(1., 0.56, wet); roughnessFactor = mix(roughnessFactor, 0.16, wet * 0.9);
  // the surf's water running back down: a film over the wetted face as the surge falls, drawn out into runnels that thin until the next
  float under = zone * steep * (1. - smoothstep(reach - 2.5, reach + 0.5, vBW.y)) * smoothstep(-0.5, 1.5, hb);
  float chn = 0.62 * bvn(vec2(xf * 0.55, 3.7)) + 0.38 * bvn(vec2(xf * 2.3, 9.1)), thr = mix(0.6, 0.22, uBSurf.y);
  float bT = uBTime + uBPhase;     // (14b) the world's clock from this world's own drawn start: the lace, the film's scroll and the wash run on it
  float lace = smoothstep(0.3, 0.72, bfb(vec2(xf * 1.6, (vBW.y + bT * 5.5) * 0.42)));
  float run = under * uBSurf.x * smoothstep(thr, thr + 0.1, chn) * (0.4 + 0.6 * lace);
  float film = under * uBSurf.y * 0.75 * smoothstep(0.32, 0.6, bfb(vec2(xf * 0.8, (vBW.y + bT * 3.5) * 0.3)));
  // the wash at the foot: white water heaving up and down the lowest metres over the sea's level, wherever the rock stands in the sea
  float sw = 1.6 + 1.1 * sin(bT * 0.9 + vBUv.x * 1.7) + 1.2 * bvn(vec2(vBUv.x * 2.9, bT * 0.45));
  float wash = (1. - smoothstep(sw * 0.55, sw, hs)) * (0.45 + 0.55 * smoothstep(0.3, 0.6, bfb(vec2(vBUv.x * 5., hs * 1.3 - bT * 0.8))));
  float white = clamp(max(max(run, film), wash), 0., 1.);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.95, 0.94), white); roughnessFactor = mix(roughnessFactor, 0.7, white);
  // the night's moon, standing beyond the bluff: a sheen on wet faces turned between it and the eye, and silver on faces turned to it
  vec3 vE = normalize(cameraPosition - vBW);
  float sp = pow(max(dot(nW, normalize(uBMoon + vE)), 0.), 14.);
  totalEmissiveRadiance += uBMoonCol * (sp * (0.12 + 0.88 * wet) * 0.9 + diffuseColor.rgb * 0.5 * max(dot(nW, uBMoon), 0.));
  // the fortress's lanterns and (round 16) the stair's: their light on the rock they can see, half of it left at 6 m from a fortress
  // lantern and (round 17) at 3 m from a stair lantern, whose light falls with the fourth power of the distance (w holds the half
  // distance's square, negative for a stair lantern; 0 is no lantern); none on a face turned away
  float ll = 0.;
  for (int i = 0; i < ${BLUFF_LANT}; i++) { vec3 d = uBLant[i].xyz - vBW; float r2 = dot(d, d), w = uBLant[i].w, q = r2 / max(abs(w), 1.); ll += step(.5, abs(w)) / (1. + (w < 0. ? q * q : q)) * max(dot(nW, d) * inversesqrt(r2), 0.); }
  totalEmissiveRadiance += diffuseColor.rgb * uBLantCol * ll;
}`;
function makeBluffMaterial(BU) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, flatShading: true });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, BU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBW; varying vec2 vBUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBW = (modelMatrix * vec4(position, 1.)).xyz; vBUv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + BLUFF_PARS).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + BLUFF_MAIN);
  };
  m.customProgramCacheKey = () => 'malecon-bluff-17';
  return m;
}
// a battered block of the fortress as the kit's frustum lays it (same faces, same courses, same cap), its faces in panels so
// that the lanterns' light can fall along a wall by place (the kit's floodlight amount is one number per vertex)
function panelFrustum(B, cx, cz, w0, d0, w1, d1, y0, y1, nw, nd, nv, cap) {
  const a = [[cx - w0 / 2, cz + d0 / 2], [cx + w0 / 2, cz + d0 / 2], [cx + w0 / 2, cz - d0 / 2], [cx - w0 / 2, cz - d0 / 2]], b = [[cx - w1 / 2, cz + d1 / 2], [cx + w1 / 2, cz + d1 / 2], [cx + w1 / 2, cz - d1 / 2], [cx - w1 / 2, cz - d1 / 2]];
  const k = B.c, g0 = B.g0, g1 = B.g1, P = (i, j, u, v) => [mix(mix(a[i][0], a[j][0], u), mix(b[i][0], b[j][0], u), v), mix(y0, y1, v), mix(mix(a[i][1], a[j][1], u), mix(b[i][1], b[j][1], u), v)];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, len = Math.hypot(a[j][0] - a[i][0], a[j][1] - a[i][1]), nu = i % 2 ? nd : nw;
    for (let q = 0; q < nv; q++) for (let p = 0; p < nu; p++) {
      const u0 = p / nu, u1 = (p + 1) / nu, v0 = q / nv, v1 = (q + 1) / nv;
      B.quad(P(i, j, u0, v0), P(i, j, u1, v0), P(i, j, u1, v1), P(i, j, u0, v1), [len * u0, mix(y0, y1, v0), len * u1, mix(y0, y1, v1)], mul3(k, mix(g0, g1, v0)), mul3(k, mix(g0, g1, v1)));
    }
  }
  const st = B.style; B.style = 0; B.c = cap; B.g0 = g1;
  B.quad([b[0][0], y1, b[0][1]], [b[1][0], y1, b[1][1]], [b[2][0], y1, b[2][1]], [b[3][0], y1, b[3][1]]);
  B.style = st; B.c = k; B.g0 = g0;
}
// THE FORTRESS'S LANTERNS (round 14), a law of the place as round 13's is for the sea wall's row: a lantern hangs at each sentry
// box and over each gate; its light on a face falls with the square of the distance, half of it left at 6 m, and a face turned
// away from it takes none. Written into the kit's own floodlight channel (one amount per vertex of plain and masonry stone, which
// the kit's facade material adds, in its warm floodlight colour, by the look's night); no light object, no eye, no clock.
function lanternWash(B, from, lanterns, k, floodDir, near = [], half2 = 36, nearK = 1) {      // (round 17) `near`: lanterns whose light is half at the root of half2 metres and falls with the fourth power, nearK times as strong
  const P = B.P, N = B.N, W = B.W;
  for (let i = from; i < B.nv; i++) {
    const st = W[i * 3]; if (!(st === 0 || st === 10 || st >= 16)) continue;
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2]; let e = 0;
    for (const L of lanterns) { const dx = L[0] - x, dy = L[1] - y, dz = L[2] - z, r2 = dx * dx + dy * dy + dz * dz, r = Math.sqrt(r2) || 1, f = (nx * dx + ny * dy + nz * dz) / r; if (f > -0.15) e += Math.max(0.4 + 0.6 * f, 0) / (1 + r2 / 36); }
    for (const L of near) { const dx = L[0] - x, dy = L[1] - y, dz = L[2] - z, r2 = dx * dx + dy * dy + dz * dz, r = Math.sqrt(r2) || 1, f = (nx * dx + ny * dy + nz * dz) / r; if (f > -0.15) e += nearK * Math.max(0.4 + 0.6 * f, 0) / (1 + (r2 / half2) * (r2 / half2)); }
    // (the kit weighs its floodlight by a face's turn to one fixed side; that weight is taken out here, so the light is the lanterns' alone)
    const fk = Math.min(1, Math.max(0, (nx * floodDir.x + ny * floodDir.y + nz * floodDir.z) * 0.62 + 0.5));
    W[i * 3 + 1] = k * e / (0.2 + 1.15 * fk * fk);
  }
}

// =====================================================================================================================
export default {
  id: 'malecon-norther',
  name: 'Norther on the Malecón',
  category: 'city',
  weirdness: 0.05,
  media: ['open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = Math.min(1.4, Math.max(0.5, vary.density ?? 1));
    // ---- which morning is it ----
    const pick = rng.fork('look'), r0 = pick(), hour = vary.hour || 'any';
    const lookName = hour === 'golden' ? 'gold' : hour === 'dawn' ? 'dawn' : hour === 'night' ? 'night'
      : hour === 'day' ? (r0 < 0.2 ? 'rain' : r0 < 0.4 ? 'clear' : 'morning')
        : r0 < 0.14 ? 'gold' : r0 < 0.24 ? 'dawn' : r0 < 0.34 ? 'night' : r0 < 0.46 ? 'rain' : r0 < 0.58 ? 'clear' : 'morning';
    const look = LOOKS[lookName], rare = !!vary.rare;
    const flooded = lookName !== 'clear' && pick() < 0.2, bunting = pick() < 0.3, sidecars = pick() < 0.3, carPick = Math.floor(pick() * 3);
    const shadows = lookName === 'morning' || lookName === 'gold' || lookName === 'clear';
    const sunny = shadows ? 1 : lookName === 'rain' ? 0.45 : 0.3;

    // ---- the route: down the side street, left round the corner house, round the bay in the lanes, out to the point ----
    const line = makeLine(), pts = [];
    for (const z of [107, 93, 79, 65, 50, 35]) pts.push([0, EYE, z]);
    for (const a of [22.5, 45, 67.5]) { const r = a * PI / 180; pts.push([-26 + 26 * Math.cos(r), EYE, 35 - 26 * Math.sin(r)]); }
    for (let s = 26; s <= 642; s += 12) { const p = line.at(s, laneOf(s)); pts.push([p[0], EYE, p[1]]); }
    { const p = line.at(ST.end, 9); pts.push([p[0], EYE, p[1]]); }
    const path = makePath(pts, { samples: 480 }), duration = 42, speed = path.length / duration;
    await ctx.yield?.();
    // camera station along the wall for every u (negative while still in the side street: metres short of the junction)
    const NS = 512, camS = new Float32Array(NS + 1), pv = new THREE.Vector3(), q2 = [0, 0];
    { let join = -1, sPrev = 26;
      for (let i = 0; i <= NS; i++) {
        path.posAtDist(i / NS * path.length, pv);
        if (join < 0 && pv.x <= -26) join = i;
        if (join >= 0) {
          let s = sPrev;
          for (let k = 0; k < 6; k++) { line.at(s, 0, q2); const th = line.theta(s); s += ((pv.x - q2[0]) * -Math.cos(th) + (pv.z - q2[1]) * -Math.sin(th)) * 0.92; }
          camS[i] = sPrev = s;
        }
      }
      for (let i = 0; i < join; i++) camS[i] = camS[join] - (join - i) / NS * path.length;
    }
    await ctx.yield?.();
    const uOfS = (s) => { let i = 0; while (i < NS && camS[i] < s) i++; return i / NS; };
    const stationAt = (u) => { const f = sat(u) * NS, i = Math.min(NS - 1, Math.floor(f)); return camS[i] + (camS[i + 1] - camS[i]) * (f - i); };

    // ---- sky, light, fog ----
    const scene = new THREE.Scene(), pause = () => ctx.yield?.();
    await pause();
    // the shelf cloud takes its colours from the sky: on the default morning its body is held toward indigo, so the fans stand
    // white against it and only the sun-struck rim of the roll is cream
    const shelfLit = lookName === 'morning' ? '#' + new THREE.Color(look.cloudLit).lerp(new THREE.Color(look.cloudShade), 0.55).getHexString() : look.cloudLit;
    const sky = makeSky({ rng, bodies: [], ...look.sky, sunElevation: look.el, sunAzimuth: 78, cloudLit: shelfLit, cloudShade: look.cloudShade });
    scene.add(sky.object);
    await pause();
    scene.fog = new THREE.FogExp2(look.fog, look.density);
    const rig = makeLightRig(sky, { shadow: shadows, shadowRange: 105, bounce: 0.25 }); scene.add(rig.object);
    await pause();
    const su = sky.uniforms, LD = sky.lightDirection, T = { value: 0 };
    const U = {
      uTime: T, uSunCol: { value: sky.lightColor.clone().multiplyScalar(sky.lightIntensity / PI) }, uAmb: { value: sky.ambientColor.clone().multiplyScalar(sky.ambientIntensity / PI) },
      uLDir: { value: LD.clone() }, uZenith: su.uZenith, uMid: su.uMid, uHorizon: su.uHorizon, uScatterColor: su.uScatterColor, uSunDir: su.uSunDir, uGrad: su.uGrad, uGrad2: su.uGrad2,
      uWindDir: { value: new THREE.Vector3(-0.45, 0, 0.9).normalize() },
      uStreet: { value: new THREE.Vector4(STREET.hw, STREET.roof, LD.y / Math.max(LD.x, 0.05), STREET.shell0 + 1.2) },
      uGnd: { value: rig.hemi.groundColor.clone().multiplyScalar(rig.hemi.intensity / PI) },
      uNight: { value: look.night }, uSheen: { value: new THREE.Color('#ffd9a0').multiplyScalar(Math.min(look.lamp, 1.15) * sm(0.08, 0.6, look.night) * 0.4) },
    };
    // the sun slab that falls into the side street through the roofless shell (z0, z1, x of its edge on the road)
    const slabX = STREET.hw - 1.5 * Math.max(LD.x, 0.05) / Math.max(LD.y, 0.02);
    const fanU = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(-999, -5, 1, 0)), lampU = [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(1e5, 5.5, 1e5, 0));
    const UR = {
      ...U, uLampCol: { value: new THREE.Color('#ffb060').multiplyScalar(look.lamp * 1.5) }, uShade: { value: look.shade },
      uFoamLamp: { value: new THREE.Color('#ffb060').multiplyScalar(look.lamp * WAVE_LAMP) },
      uWet: { value: new THREE.Vector2(flooded ? 1 : look.wet[0], flooded ? 0.1 : look.wet[1]) }, uFan: { value: fanU },
      uSlab: { value: shadows ? new THREE.Vector4(STREET.shell0 + 1.2, STREET.shell1 + 1.2, slabX, 0) : new THREE.Vector4(1, 0, -99, 0) },
      uFanSh: { value: new THREE.Vector4(0, 0, 12, 0) }, uLamp: { value: lampU }, uPort: { value: new THREE.Vector4(1e5, 4, 1e5, 0) }, uPortCol: { value: new THREE.Color(look.portal) }, uCloudCol: { value: new THREE.Color(look.cloudLit).multiplyScalar(lookName === 'night' || lookName === 'dawn' ? 0.5 : 0.8) }, uFlood: { value: flooded ? 1 : 0 }, uMirK: { value: flooded ? 1 : sm(0.5, 0.95, look.wet[0]) },
    };
    await pause();
    const mats = S.makeMaterials({ night: look.night, streetY: 0.15, beam: look.beam, lampDay: 0.25 });
    mats.setSky({ top: look.sky.zenith, horizon: look.sky.horizon, sun: look.sky.scatterColor, sunDir: LD.toArray() });
    await pause();

    // ---- the sea and the shelf cloud of the front ----
    // by night the sea is lit by the moon that hangs over it (the town's key light stays astern, where the lamps are)
    const moonDir = lookName === 'night' ? new THREE.Vector3(Math.sin(MOON_AZ * PI / 180) * Math.cos(MOON_EL * PI / 180), Math.sin(MOON_EL * PI / 180), -Math.cos(MOON_AZ * PI / 180) * Math.cos(MOON_EL * PI / 180)) : null;
    const moon = moonDir ? makeMoon() : null; if (moon) scene.add(moon);
    const ocean = Water.makeOcean({ rng: rng.fork('sea'), light: moonDir ? Water.waterLight({ sky, sunDir: moonDir, sunColor: '#bcd0ff', sunIntensity: 2.4, glint: 1 }) : Water.waterLight(sky), preset: lookName === 'clear' ? 'swell' : 'storm', level: -4, height: lookName === 'clear' ? 1.4 : 2.3,
      radius: 3000, rings: Math.round(84 * detail), segments: Math.round(104 * detail), spray: false });
    scene.add(ocean.object);
    await pause();
    scene.add(makeSwell(U, line, look, moonDir || LD, moonDir ? new THREE.Color('#bcd0ff').multiplyScalar(1.6) : U.uSunCol.value.clone().multiplyScalar(sunny)));
    await pause();
    const shelfAt = [], cr = rng.fork('shelf');
    for (let i = 0; i < 9; i++) {
      const a = (168 + i * 16 + cr.range(-5, 5)) * PI / 180, r = cr.range(1000, 1500) * (lookName === 'clear' ? 1.5 : 1);
      shelfAt.push([-280 + Math.cos(a) * r, cr.range(120, 190), -120 + Math.sin(a) * r, cr.range(560, 900)]);
    }
    // (built as two fields with a yield between them, both reading one noise texture made here in short steps: nine clouds and
    // the kit's own noise in one call is a step of about 50 ms)
    const cloudNoise = await makeCloudNoise(ctx.core.makeRng((((ctx.seed | 0) ^ 0x2f6b3a11) >>> 0) || 1), pause);
    await ctx.yield?.();
    const shelfOpt = { rng, sky, noiseTexture: cloudNoise, puffs: Math.round(40 * detail), fogFade: 0.35, opacity: 0.9, litColor: shelfLit, shadeColor: look.cloudShade, wind: [-0.6, 0, 2.2] };
    const shelfA = makeCloudField({ ...shelfOpt, at: shelfAt.slice(0, 5) });
    scene.add(shelfA.object);
    await ctx.yield?.();
    const shelfB = makeCloudField({ ...shelfOpt, at: shelfAt.slice(5) });
    scene.add(shelfB.object);
    const shelf = { update: (dt, time, camera) => { shelfA.update(dt, time, camera); shelfB.update(dt, time, camera); } };
    await ctx.yield?.();

    // ---- the town, the ground, the wet road ----
    const cloth = makeCloth(U), ex = { plants: [], cloth, arcades: [], rails: [], fronts: [] };
    const chunks = await buildTown(line, rng.fork('town'), ex, pause);
    await ctx.yield?.();
    const mirB = makeMirrorMaterial(U, sunny), mirS = makeMirrorMaterial(U, 0.4 * sunny), townMeshes = [];
    await pause();
    for (const [key, c] of chunks) {
      const gs = c.B.toGeometry();
      await pause();
      const shell = new THREE.Mesh(gs, mats.facades), det = new THREE.Mesh(c.D.toGeometry(), mats.facades);
      shell.castShadow = shell.receiveShadow = det.receiveShadow = shadows; shell.name = key;
      const mir = new THREE.Mesh(gs, c.street ? mirS : mirB); mir.scale.y = -1; mir.renderOrder = -2;
      scene.add(shell, det, mir); townMeshes.push(shell, det, mir);
      await pause();
    }
    await ctx.yield?.();
    const lampPts = [], noHero = (s) => s > ST.hero - 48 && s < ST.hero + 48;
    const ground = await buildGround(line, rng.fork('ground'), lampPts, noHero, pause);
    // the land behind the houses: dusty back lots so no gap between buildings opens on nothing
    { const B = new S.Builder(1024), P3 = (s, l) => { const p = line.at(s, l); return [p[0], 0.1, p[1]]; }, cuts = [-160, -15, -5.5, 5.5, 15];
      for (let s = 24; s < ST.fEnd; s += 12) cuts.push(s);
      cuts.push(ST.fEnd);
      B.surf(SURF.MASONRY, 0, 6);
      for (let i = 0; i < cuts.length - 1; i++) {
        const a = cuts[i], b = cuts[i + 1], m = (a + b) / 2, spans = Math.abs(m) < 5.5 ? [[STREET.sqz + 8, 190]] : Math.abs(m) < 15 ? [[ST.lF + 3.6, STREET.z1], [STREET.sqz + 8, 190]] : [[ST.lF + 3.6, 190]];
        for (const [l0, l1] of spans) { B.col(mul3(lin('#6f6658'), 0.75 + 0.2 * rng()), 1, 1); B.quad(P3(a, l1), P3(a, l0), P3(b, l0), P3(b, l1), [l1 / 4, a / 4, l0 / 4, b / 4]); }
      }
      // taller blocks behind the arcades for a broken skyline (none east of the shell: its sun slab must stay open)
      for (let st = -150; st < ST.fEnd - 16; st += rng.range(13, 22)) {
        if ((st > -78 && st < 26) || (st > ST.sq0 - 14 && st < ST.sq1 + 14)) continue;
        const w = rng.range(9, 15), d = rng.range(9, 13), h = rng.range(15, 30), p = line.at(st, ST.lF + rng.range(19, 30)), wall = mul3(mix3(rng.pick(WALLS), [0.6, 0.58, 0.54], 0.45), rng.range(0.6, 0.85));
        B.tr(p[0], 0, p[1], PI - line.theta(st));
        const rows = Math.round(h / 3.3), cw2 = Math.round(w / 2.8), cd2 = Math.round(d / 2.8);
        B.surf(SURF.WINDOW, Math.floor(rng() * 90), 1).col(wall, 0.75, 1); B.wall(-w / 2, d / 2, w / 2, d / 2, 0, h, { cellW: 1, cols: cw2, rows });
        B.col(mul3(wall, 0.9), 0.72, 1); B.wall(w / 2, d / 2, w / 2, -d / 2, 0, h, { cellW: 1, cols: cd2, rows }); B.wall(-w / 2, -d / 2, -w / 2, d / 2, 0, h, { cellW: 1, cols: cd2, rows });
        B.wall(w / 2, -d / 2, -w / 2, -d / 2, 0, h, { cellW: 1, cols: cw2, rows });
        B.surf(SURF.PLAIN).col(mul3(wall, 0.6), 1, 1); B.quad([-w / 2, h, d / 2], [w / 2, h, d / 2], [w / 2, h, -d / 2], [-w / 2, h, -d / 2]);
        B.col(mul3(wall, 0.95), 0.9, 1); B.box(-w / 2 - 0.15, h - 0.25, -d / 2 - 0.15, w / 2 + 0.15, h + 0.5, -d / 2 + 0.2); B.box(-w / 2 - 0.15, h - 0.25, d / 2 - 0.2, w / 2 + 0.15, h + 0.5, d / 2 + 0.15);
        B.surf(SURF.PLAIN).col(lin('#3a342e'), 0.8, 1); B.cyl(rng.range(-2, 2), h, rng.range(-2, 2), 1.1, 1.1, 1.9, 8); B.cbox(rng.range(-3, 3), h, rng.range(-3, 3), 2.4, 1.3, 2.0);
        B.pop();
      }
      ground.groups.push(B);
    }
    await pause();
    for (const B of ground.groups) { const m = new THREE.Mesh(B.toGeometry(), mats.facades); m.receiveShadow = shadows; scene.add(m); await pause(); }
    const roadG = buildRoadGeometry(line), RM = makeRoadMaterials(UR);
    for (const [mat, order] of [[RM.back, -3], [RM.seal, -1.5], [RM.surface, 1.5]]) { const m = new THREE.Mesh(roadG, mat); m.renderOrder = order; scene.add(m); }
    { const st = []; for (let s = -152; s <= 600; s += 8) if (!noHero(s + 2)) st.push(s + 2);
      scene.add(makeRunoff(U, fanU, st, line, look.rain ? 0.55 : flooded ? 0.6 : lookName === 'clear' ? 0 : 0.14)); }
    // seen from the previous world the portal's camera stands behind the start and the engine clips everything nearer than
    // the opening, the square's floor included: this apron hangs from the entry line so the lower part of the opening shows
    // dark wet ground, not the sea and the mirrored town that live under the road (from inside it is hidden by the road)
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 14), makeApronMaterial(U, look.fog, look.lamp, new THREE.Color(look.sky.horizon).multiplyScalar(0.5).add(new THREE.Color(look.cloudLit).multiplyScalar(0.28)))); m.position.set(0, -7.0, 106.9); scene.add(m);
      const lid = new THREE.Mesh(new THREE.PlaneGeometry(120, 9), m.material); lid.rotation.x = -PI / 2; lid.position.set(0, -3.2, 111.4); scene.add(lid); }
    await ctx.yield?.();

    // ---- the hero fan and its smaller sisters along the wall ----
    const heroScale = look.fanK < 1 ? 0.72 : 1;
    // before sunrise and at night the water is lit by the lamps and the pale sky, brighter than the weak key light alone
    // (round 13: the moon and the dawn sky are the upper and rim light now, 1.25 and 1.4 where they were 1.7 and 1.6: the standards
    // light the water from below, by place)
    const fanLight = lookName === 'dawn' ? { sunColor: new THREE.Color('#c4d6ff').multiplyScalar(1.4), skyColor: U.uAmb.value.clone().multiplyScalar(0.8) }
      : lookName === 'night' ? { sunDir: moonDir, sunColor: new THREE.Color('#c0ceff').multiplyScalar(1.25), skyColor: U.uAmb.value.clone().multiplyScalar(0.75) } : {};
    // (by night the moon stands beyond the wall, so a fan is seen against its light: silver rims and glowing lace round an indigo
    // heart, amber at its foot where the lamps reach it. Never a teal wall and never a bank of fog)
    const dim = look.night > 0.5, fanPal = dim ? PALETTE.map((c, i) => (i === 4 ? '#cfe6e0' : i === 1 ? '#7fa6b0' : c)) : PALETTE;
    // (round 13: by lamplight the billows are the day's size, 1, where night's were 1.25 times larger from a distance: see the report's pair)
    const fanOpt = { billow: dim ? [1, 1] : [1, 0.35], palette: fanPal, transmit: lookName === 'night' ? 0.6 : dim ? 0.3 : lookName === 'rain' ? 0.7 : lookName === 'clear' ? 0.85 : 1, deep: lookName === 'clear' ? 0.35 : 1, throat: dim ? 1 : 0,
      // (round 13) lampGlow: the road light's own colour at the look's lamp level, laid by place in the parts' shaders (it was one
      // constant amber in three fixed pools); rim, veil: by lamplight the sheet thins to nothing at its rim and a billow to its edge
      lampGlow: new THREE.Color('#ffb060').multiplyScalar(look.lamp * WAVE_LAMP), rim: lookName === 'night' ? 0.6 : 0, veil: lookName === 'night' ? 1 : 0, mist: dim ? 0.45 : 1, ...fanLight };
    // by day (never by lamplight: night and dawn pass no such option and keep the programs and the values they had) the canopy
    // seen from beneath glows green-white to aqua with the sun beyond it. Its sisters share the program at strength 0: unchanged
    if (!dim) fanOpt.day = 0;
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, { road: false, sea: false, scale: heroScale, tear: dim ? 0.85 : 0.3, ...fanOpt, ...(dim ? {} : { day: 1 }), nearFade: [14, 40], lampAt: [ST.hero, 0, 1],
      // (the kit's pavements carry a night fill and a warm street glow of their own: the stage is given the same, and pools under its lamps)
      stageLamp: new THREE.Color('#ffb060').multiplyScalar(look.lamp > 0.2 ? look.lamp * 0.45 : 0),
      stageAmb: new THREE.Color(0.05, 0.07, 0.12).add(new THREE.Color('#ffb060').multiplyScalar(0.12)).multiplyScalar(sm(0.12, 0.7, look.night)) });
    { const p = line.at(ST.hero, 0); hero.object.position.set(p[0], 0, p[1]); hero.object.rotation.y = -line.theta(ST.hero); scene.add(hero.object); }
    hero.object.traverse((o) => { if (o.isMesh && o.material.isMeshStandardMaterial) o.receiveShadow = shadows; });
    // how far short of the site the car is when it erupts, chosen so the curtain comes down on the car just past the middle
    let heroD = 55, tauHit = Infinity;
    { let best = 1e9;
      for (let d = 40; d <= 76; d++) for (let tau = 0.5; tau < 7; tau += 0.02) {
        const x = d - speed * tau; if (x < -30) break;
        if (x < 30 && hero.impactTauAt(x) <= tau) { const e = Math.abs(x + 12); if (e < best) { best = e; heroD = d; tauHit = tau; } break; }
      }
    }
    await pause();
    const fans = [];
    const addFan = async (s, o = {}) => {
      const scale = (o.scale ?? 1) * (o.abs ? 1 : look.fanK);
      const h = await buildHero({ ...ctx, rng: o.rng || rng.fork('fan' + fans.length) },   // (round 15) a fan added since may bring a stream of its own: a fork draws once from the world's stream
        { stage: false, sea: false, road: false, mirror: false, lite: true, res: o.res || [40, 22], layers: o.layers || [0, 1], particles: o.particles ?? 0.16, phase: o.phase ?? 0, scale, tear: o.tear ?? 1, wind: o.wind, twin: o.twin, ...fanOpt, mist: o.mist ?? fanOpt.mist, transmit: fanOpt.transmit * 0.6,
          // (round 13: where it stands on the wall, for the standards' light. The breakers and the bluff's surf, turned to the apron's
          // rim 26 m and more beyond the last standard, are given none: the moon and the sky light them)
          lampAt: o.ry != null ? [0, 0, 0] : [s, o.lat ?? 0, 1] });
      const p = o.at || line.at(s, 0); h.object.position.set(p[0], 0, p[1]); h.object.rotation.y = o.ry ?? -line.theta(s); scene.add(h.object);
      if (o.trig != null) h.setProgress(0);
      fans.push({ h, s, trig: o.trig ?? null, phase: o.phase ?? 0, scale, foam: !o.at, tau: -5, on: false });
      await pause();
      return h;
    };
    // the two at the end of the side street run on the clock, five seconds apart, so one of them is always in the air: they
    // are the focal point of the view through the entry portal and must never hang frozen while the car waits to cross
    // (and they keep their full height on a quiet morning too: a white fan always closes the street)
    const fEnd = await addFan(-6, { phase: 0.4, res: [48, 26], particles: 0.3, abs: true });
    await addFan(8, { phase: 5.4, scale: 0.85, res: [48, 26], particles: 0.25, abs: true });
    // every fan round the bay is keyed to the car, so each stretch of the drive has its own event and the middle of the flight is
    // never one view repeated. Out of the corner one already stands over the seaward lanes 55 m ahead and comes down across the
    // road as the car reaches it; the next arches ahead as the car pulls out round the slow sedans; one bursts beside the car
    const arcOpt = dim ? {} : { tear: 0.7, mist: 0.6 };      // by day the ones that come down across the road keep a torn sheet and falling streaks, not a cloud of mist
    const fCorner = await addFan(88, { trig: -10, scale: 1, res: [48, 26], layers: [0, 1, 2], particles: 0.4, ...arcOpt });
    await addFan(150, { trig: 60, scale: 0.85, twin: fCorner, tear: 0.9, ...arcOpt });
    const fBeside = await addFan(200, { trig: 141, res: [56, 30], layers: [0, 1, 2], particles: 0.35, tear: 0.8 });
    await ctx.yield?.();
    // one goes up 30 m ahead as the palm square passes and comes down beside the car as the hero erupts; after the hero one hangs
    // over the lanes as the lens clears, and the next comes down across the road in front of the car just as the point, the
    // lighthouse and the portal swing into view (it has fallen and drained well before the last third of the flight)
    const iKeyA = fans.length; await addFan(260, { trig: 197, scale: 0.7, twin: fCorner, tear: 0.9 });
    const iKeyB = fans.length; await addFan(392, { trig: 320, scale: 0.9, twin: fBeside, tear: 0.8 });
    let iKeyC = -1;
    if (rare) { const r1 = await addFan(440, { trig: 399, res: [60, 32], layers: [0, 1, 2] }); await addFan(490, { trig: 449, twin: r1 }); await addFan(540, { trig: 499, twin: r1, scale: 1.06 }); }   // the rogue set
    else { iKeyC = fans.length; await addFan(422, { trig: 340, scale: 0.8, twin: fEnd, ...arcOpt }); }
    // down the last of the bay the swells break on the outer edge of the rock shelf, 10 m off the wall, and the wind is dropping:
    // white towers to seaward of the road that never lean across the line of sight to the portal
    const farOpt = dim ? {} : { mist: 0.55, tear: 0.7 };
    // (round 15: the first of them stands 8 m off the wall, as the second always did, and taller: the one tower of the last stretch that the eye turns to)
    const fFar = await addFan(530, { at: line.at(530, -8), lat: -8, trig: 458, scale: 0.78, layers: [0, 1, 2], particles: 0.35, wind: 1.5, ...farOpt });
    await addFan(588, { at: line.at(588, -8), lat: -8, trig: 514, scale: 0.6, twin: fFar, ...farOpt });
    await ctx.yield?.();
    const thE = line.theta(ST.end), tE = [-Math.cos(thE), -Math.sin(thE)], nE = [-Math.sin(thE), Math.cos(thE)], pE = line.at(ST.end, 9);
    const off = (a, b) => [pE[0] + tE[0] * a + nE[0] * b, pE[1] + tE[1] * a + nE[1] * b];
    // the breakers behind the portal, all keyed so that white water is climbing behind the ring all the way down the last
    // straight (never a hanging slab: seen front-on that reads as ice). The first goes up to seaward of the ring while the car
    // is still on the bay, and its water runs back across the apron as the car arrives; the next rears behind the ring itself
    const iBrk = fans.length, brk = await addFan(700, { at: off(26, 4), ry: PI / 2 - thE, trig: 598, scale: 0.9, res: [52, 28], layers: [0, 1, 2], particles: 0.4 });
    await addFan(700, { at: off(30, -9), ry: PI / 2 - thE, trig: 627, scale: 0.8, twin: brk });
    const iSurf = fans.length; await addFan(700, { at: off(34, -17), ry: PI / 2 - thE, trig: 520, scale: 1.0, twin: brk });
    const Bc = off(62, 56), lhAt = [Bc[0] - tE[0] * 4 - nE[0] * 13, Bc[1] - tE[1] * 4 - nE[1] * 13];   // the bluff left of the last straight; the lighthouse on its near tip
    // (14b) its phase is drawn once, over its whole period of 10 s, from a stream of its own, own('mn-footsurf') (own is defined further down)
    const footPhase = ctx.core.makeRng(ctx.core.hashSeed('mn-footsurf' + ':' + ctx.seed)).range(0, 10);
    await addFan(640, { at: off(33, 23), ry: PI / 2 - thE, phase: footPhase, scale: 0.62, twin: fFar, ...farOpt });      // surf climbing the bluff's road-facing foot
    await addFan(640, { at: [Bc[0] + tE[0] * 30 - nE[0] * 4, Bc[1] + tE[1] * 30 - nE[1] * 4], ry: PI / 2 - thE, trig: rare ? 548 : null, phase: 4.4, scale: rare ? 2.1 : 1.25, ...(rare ? { res: [64, 34], layers: [0, 1, 2] } : { twin: fFar, ...farOpt }) });   // surf beyond the bluff (rare: it buries the lighthouse)
    // (round 14, T3) 'surf climbing half-way up the bluff': the surf at the bluff's road-facing foot stands as tall as half the bluff
    // over the sea (its own sheet's highest water, by fanExtent), times the look's own measure of every fan; its clock, period
    // and place are live's (its phase: drawn, above)
    const iFoot = fans.length - 2, iBeyond = fans.length - 1, footExt = fanExtent(fans[iFoot].h);
    fans[iFoot].scale = fanResize(fans[iFoot].h, footExt.scaleForTop(BLUFF.sea + (BLUFF.top - BLUFF.sea) / 2) * look.fanK);
    // (round 15) one more white tower on the shelf's outer edge, between the last fan on the wall and the two above: it goes up as
    // that one's water drains, so the last of the bay is not a bare road. Added last and on a stream of its own (mn-fan476: own is
    // defined further down), so every fan of live's keeps its number and nothing dealt after it from the world's stream is dealt anew
    await addFan(476, { at: line.at(476, -9), lat: -9, trig: 404, scale: 0.66, twin: fFar, rng: ctx.core.makeRng(ctx.core.hashSeed('mn-fan476' + ':' + ctx.seed)), ...farOpt });
    UR.uPort.value.set(pE[0], 4, pE[1], look.lamp > 0.2 ? 0.5 : 0.26);
    await ctx.yield?.();

    // ---- traffic: every vehicle is tied to the camera's station, so the passes happen where they were composed ----
    const sunVis = { value: sunny }, glossM = makeGlossMaterial(U, { sunVis }), glossF = makeGlossMaterial(U, { sunVis, flip: true }), glossS = makeGlossMaterial(U, { sunVis: { value: 0.08 } });
    const C3 = (hex, k = 1) => mul3(lin(hex), k), cream = C3('#efe6cf');
    await pause();
    const sedan = (a, b, long) => sedanGeometry(C3(a), b ? C3(b) : C3(a), long), bike = (a, b) => sidecarGeometry(C3(a), C3(b));
    const cast = [
      // geometry (built below, one a step), lane, station where the camera passes it, speed as a fraction of ours (negative: oncoming)
      [() => sidecars ? bike('#3f6f9a', '#f2f0e8') : sedan('#E8929A', '#efe6cf'), 8.5, 158, 0.62],
      [() => sedan('#3f7fb0'), 8.4, 136, 0.75],
      [() => sedan('#f1dd6a', '#f1dd6a', 1.08), 19.5, 118, -0.8],
      [() => taxiGeometry(C3('#f2c230')), 22, 152, -0.6],
      [() => taxiGeometry(C3('#f2c230')), 22, 208, -0.6],
      [() => sedan('#9AD4B8', '#efe6cf'), 9, 221, 0.6],
      [() => sidecars ? bike('#8a3f3a', '#f4d878') : sedan('#b3202c', null, 1.06), 12.5, 224, 0.45],
      [() => sedan('#ef7f5a', '#efe6cf'), 19.5, 335, -0.75],
      [() => bike('#2f6f7f', '#f0a0a8'), 12.5, 455, 0.55],
      [() => sedan('#efe6cf', '#7a2f2a'), 22, 430, -0.7],
      [() => sedan('#f08a3a'), 9, 1300, 0.9],
      [() => sedan('#E8929A'), 19.5, 520, -0.8],
      [() => sedan('#7fb6d8', '#efe6cf'), 19.5, -5.3, -0.8],
    ];
    // (round 19) THE ROAD FROM THE SQUARE TO THE POINT IS NOT EMPTY. Live's table composes thirteen passes; after the square the eye
    // had the carriageway nearly to itself (one car met at station 335, one at 430, one at 520, the sidecar overtaken at 455). Now
    // the town's old cars fill it, by ONE RULE OF THE ROAD in each of STREAM's four lanes: a car follows the one before it at
    // 4 to 9 seconds at the lane's own pace (so many metres of road between them; in the far lanes they come toward us, in the lane
    // beside ours and the middle lane they roll our way, slower, and we overtake each). A lane's cars begin where the lane is
    // free of our own car (the far lanes from the square's far end, our lanes from LANE_HOME, where our car is home in its lane
    // by laneOf), the first of them a chance share of one headway past that, so no station of the road is the first car's on every
    // seed. A far lane ends where a car could no longer have come from the road's end unseen (one that would have to appear on the
    // apron nearer than APPEAR_FAR of the eye is not dealt; live's own last one appears 270 m off); a lane of ours ends with the
    // last car we are CLEAR_AHEAD of before its lane closes on ours. No car is dealt that would come within LANE_GAP of a car of
    // live's table in its lane at any moment of the flight, or of our own car while that is in its lane. The cars are the town's
    // saloons in a dozen paints, one in two with a cream roof, three in ten the long one; a yellow three-wheeler now and then, in
    // the far kerb lane only, as live's two are. Each is tied to the camera's station by the law live's thirteen obey (sPass, r),
    // and each lane is dealt on a stream of its own: no live stream is drawn from and live's thirteen keep their numbers.
    { const LANE_GAP = 16, APPEAR_FAR = 250, CLEAR_AHEAD = 12, FREE_FAR = ST.sq1, FREE_OURS = LANE_HOME, nLive = cast.length;
      const HUES = ['#2f6f7f', '#b3202c', '#3d8a78', '#E8929A', '#f4d878', '#17B3AE', '#c9c2b0', '#E3A84B', '#8CC3E0', '#C3A6D8', '#9AD4B8', '#e9e2cc'];
      const place = (sP, r, sc) => sP + r * (sc - sP), onRoad = (s, r) => s > ROAD.from && s < (r < 0 ? ROAD.endOn : ROAD.endOur);
      const clear = (lane, sP, r) => {
        for (let sc = camS[0]; sc <= ST.end; sc += 4) { const a = place(sP, r, sc); if (!onRoad(a, r)) continue;
          if (Math.abs(laneOf(sc) - lane) <= 1.5 && Math.abs(a - sc) < LANE_GAP) return false;                        // our own car
          for (let i = 0; i < nLive; i++) { const c = cast[i]; if (Math.abs(c[1] - lane) > 1.5) continue;
            const b = place(c[2], c[3], sc); if (onRoad(b, c[3]) && Math.abs(a - b) < LANE_GAP) return false; } }
        return true; };
      for (const [lane, r, name, most] of STREAM) {
        const tr = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)), step = () => Math.abs(r) * speed * tr.range(4, 9) / (1 - r);
        // the lane's last place: where a car coming toward us would have to appear nearer than APPEAR_FAR; where a car going our
        // way would reach the closing of the lanes before we are CLEAR_AHEAD of it
        const last = r < 0 ? ROAD.endOn - APPEAR_FAR / (1 + 1 / -r) : (ROAD.close0 - (ROAD.close0 + CLEAR_AHEAD) * r) / (1 - r);
        let n = 0;
        for (let sP = (r < 0 ? FREE_FAR : FREE_OURS) + tr() * step(); sP <= last && n < most; sP += step()) {
          const h = tr.pick(HUES), k = tr(), two = tr.chance(0.5);
          if (!clear(lane, sP, r)) continue;
          cast.push([k < 0.14 && lane > 20 ? () => taxiGeometry(C3('#f2c230')) : () => sedan(h, two ? '#efe6cf' : null, k > 0.7 ? 1.07 : 1), lane, sP, r]); n++;
        }
      }
    }
    for (const c of cast) { c[0] = c[0](); await pause(); }
    const spray = makeSpray(U, NVEH, Math.round(22 * detail), rng.fork('spray')); scene.add(spray.mesh);
    spray.uniforms.uTail.value = lookName === 'clear' ? 0.25 : flooded ? 1.5 : 1;
    UR.uCar = { value: spray.veh }; RM.surface.uniforms.uCar = UR.uCar;
    const traffic = cast.map(([g, lane, sPass, r], i) => {
      if (i >= NVEH_LIVE - 1) return { mesh: null, lane, sPass, r, veh: spray.veh[i + 1], on: false, x: 0, z: 0 };      // (round 19) a car of the stream: no mesh of its own
      const mesh = new THREE.Mesh(g, glossM), mir = new THREE.Mesh(g, glossF); mir.scale.y = -1; mir.renderOrder = -2; mesh.add(mir);
      mesh.castShadow = shadows; scene.add(mesh);
      return { mesh, lane, sPass, r, veh: spray.veh[i + 1], on: false, x: 0, z: 0 };
    });
    for (let i = cast.length + 1; i < NVEH; i++) spray.veh[i].set(1e5, 1e5, 0, 0);      // (round 19) a place the stream left empty lies off the map
    if (cast.length > NVEH_LIVE - 1) {                                                   // (round 19) the stream: one mesh and its mirror in the road
      const parts = [];
      for (let i = NVEH_LIVE - 1; i < cast.length; i++) { const g = cast[i][0]; g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(i + 1), 1)); parts.push(g); }
      await pause();
      const sg = mergeGeometries(parts, false);
      await pause();
      const stream = new THREE.Mesh(sg, makeGlossMaterial(U, { sunVis, veh: spray.veh })), mir = new THREE.Mesh(sg, makeGlossMaterial(U, { sunVis, flip: true, veh: spray.veh }));
      mir.scale.y = -1; mir.renderOrder = -2; stream.add(mir); stream.frustumCulled = mir.frustumCulled = false; stream.name = 'mn19:stream'; scene.add(stream);
    }
    if (look.lamp > 0.2) { const list = []; cast.forEach(([g], i) => { for (const l of g.userData.lamps || []) list.push([i + 1, ...l]); });
      scene.add(makeCarLamps(U, spray.veh, list, Math.min(1.4, 0.35 + look.night * 1.1))); }
    { const g = sedan('#b9a0d6', '#efe6cf'), m = new THREE.Mesh(g, glossS);                     // the one on blocks in the side street
      m.position.set(3.1, 0.2, 74); m.rotation.set(0.02, PI + 0.05, 0.035); scene.add(m);
      const mir = new THREE.Mesh(g, makeGlossMaterial(U, { sunVis: { value: 0.08 }, flip: true })); mir.scale.y = -1; mir.renderOrder = -2; mir.position.set(3.1, -0.2, 74); mir.rotation.set(-0.02, PI + 0.05, -0.035); scene.add(mir);
    }

    await pause();

    // ---- round 11: what stands in FRONT of the two fans that close the side street, on the street's side ----
    // (every new thing has a stream of its own, made from the world's seed and its name; none draws from a live stream)
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // at each one's foot a cloud of spray that climbs to a third of its height while it stands, and a curtain of drops falling
    // on the seaward pavement between it and the junction: one more mesh of the fan's own particles, in the fan's own group and
    // material, so it runs on that fan's clock and is drawn when the fan is, with no line of its own in update()
    // (round 12b, named) The foot cloud, the curtain and the tongue below are new PARTS of live's two street fans, not things
    // with a time of their own: each reads its own fan's uTau (the cloud and curtain through that fan's particle material, the
    // tongue through the two uTau uniforms handed to it), which live's update sets from the world's clock and live's typed
    // phases. They hold no clock offset, phase or period themselves and follow whatever live gives those two fans.
    const fStreet = [fans[0], fans[1]], footSpray = [];
    for (const f of fStreet) { footSpray.push(buildFootSpray(f.h, own('mn-footspray:' + f.s))); await pause(); }
    // and their water runs on from the carriageway a few metres into the street's mouth and drains back: one quad over the
    // roadway that reads the two fans' own clock uniforms (the objects their sheets read) and the road's own light
    const tongueOn = { value: new THREE.Vector2(0, 0) };
    const tongue = buildStreetTongue({ tau: fStreet.map((f) => f.h.uniforms.uTau), fans: fStreet.map((f) => [f.h.object.position.x, f.scale]), on: tongueOn,
      sunCol: U.uSunCol, amb: U.uAmb, shade: UR.uShade, time: U.uTime, ldir: U.uLDir, car: { value: spray.veh.slice(0, NVEH_LIVE) }, lamp: UR.uFoamLamp });
    scene.add(tongue);
    await pause();

    // ---- our own car, top down: the nose of the bonnet with its spear and ornament low in the frame, and the lens the sea lands on ----
    const BODY = [C3('#17B3AE'), C3('#b3202c'), C3('#f0a030')][carPick];
    const G = { soak: { value: 0 }, white: { value: 0 }, tear: { value: 0 }, bead: { value: 0 } };
    const ownSun = { value: 0.1 }, shadeLine = { value: new THREE.Vector2(9, 0) }, sheetU = { value: 0 };
    const lampPh = { value: 0 }, ownM = makeGlossMaterial(U, { sunVis: ownSun, own: true, shadeLine, sheet: sheetU, lampPh, cloud: UR.uCloudCol });
    // everything carried with the camera hangs under one group (hidden while the world is seen through a portal): the car,
    // which update() pitches and shrinks about the eye so the bonnet stays a low hump on any screen, and the unpitched lens
    const carried = new THREE.Group(), car = new THREE.Group(), carBody = new THREE.Mesh(ownCarGeometry(BODY), ownM);
    await pause();
    const lower = new THREE.Group(); lower.add(carBody); car.add(lower);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), makeLensMaterial(U, G)); lens.position.z = -0.5; lens.renderOrder = 50;
    carried.add(car, lens); carried.traverse((o) => { o.frustumCulled = false; }); scene.add(carried);
    await ctx.yield?.();

    // ---- cloth: laundry (or bunting) across the side street, with the wires it hangs from ----
    { const cr2 = rng.fork('laundry'), wire = [0.03, 0.03, 0.035];
      for (const z of [43.5, 49, 51.5, 58, 64.5, 71.5, 75, 81, 86.5, 92, 95.5]) {
        const y = cr2.range(7.6, 12.2), sag = cr2.range(0.35, 0.7), zz = z + cr2.range(-0.8, 0.8), x0 = -5.25, x1 = 5.25, yAt = (u) => y - sag * 4 * u * (1 - u);
        cloth.add([x0, y, zz], [x1, y, zz], [x0, y - 0.035, zz], [x1, y - 0.035, zz], 12, 1, wire, () => 0.3, 0.05, 0, sag, 1);
        const n = bunting ? 13 : cr2.int(4, 7);
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5 + cr2.range(-0.25, 0.25)) / n, w = bunting ? 0.6 : cr2.range(0.55, 1.25), h = bunting ? 0.85 : cr2.range(0.6, 1.5), xa = mix(x0, x1, u) - w / 2, xb = xa + w;
          const ua = (xa - x0) / (x1 - x0), ub = (xb - x0) / (x1 - x0), ya = yAt(ua) - 0.02, yb = yAt(ub) - 0.02, c = bunting ? CLOTHS[(i * 3 + Math.round(z)) % CLOTHS.length] : cr2.pick(CLOTHS);
          if (bunting) cloth.add([xa, ya, zz], [xb, yb, zz], [(xa + xb) / 2 - 0.01, ya - h, zz], [(xa + xb) / 2 + 0.01, yb - h, zz], 2, 3, c, (uu, v) => v, 0.55, 0);
          else cloth.add([xa, ya, zz], [xb, yb, zz], [xa + 0.03, ya - h, zz], [xb - 0.03, yb - h, zz], 3, 4, c, (uu, v) => v * v + 0.15 * v, 0.6, 0);
        }
      }
      // towels and sheets over the balcony rails of the side street, snapping in the norther: the first view is never still
      for (const [a, b] of ex.rails) {
        if (!cr2.chance(0.75)) continue;
        const len = Math.hypot(b[0] - a[0], b[2] - a[2]), w = Math.min(len - 0.3, cr2.range(0.7, 1.4)), t0 = cr2.range(0.1, Math.max(0.1, len - 0.1 - w)) / len, t1 = t0 + w / len, h = cr2.range(0.55, 1.05), c = cr2.pick(CLOTHS);
        if (w < 0.4) continue;
        const pa = [mix(a[0], b[0], t0), a[1], mix(a[2], b[2], t0)], pb = [mix(a[0], b[0], t1), a[1], mix(a[2], b[2], t1)];
        cloth.add(pa, pb, [pa[0], pa[1] - h, pa[2]], [pb[0], pb[1] - h, pb[2]], 3, 3, c, (uu, v) => v * v + 0.15 * v, 0.5, 0);
      }
      if (bunting) for (const s0 of [60, 150, 420, 500]) {        // and strung from the arcades to the lamp standards on fiesta mornings
        const a = line.at(s0, ST.lF), b = line.at(s0 + 6, 23.6), pa = [a[0], 9.5, a[1]], pb = [b[0], 6.2, b[1]];
        cloth.add(pa, pb, [pa[0], pa[1] - 0.035, pa[2]], [pb[0], pb[1] - 0.035, pb[2]], 6, 1, wire, () => 0.3, 0.05, 1, 0.3, 1);
        for (let i = 0; i < 7; i++) { const u = (i + 0.5) / 7, m = (k, d) => mix(pa[k], pb[k], u + d) - (k === 1 ? 0.3 * 4 * (u + d) * (1 - u - d) : 0);
          cloth.add([m(0, -0.05), m(1, -0.05), m(2, -0.05)], [m(0, 0.05), m(1, 0.05), m(2, 0.05)], [m(0, 0), m(1, 0) - 0.6, m(2, 0)], [m(0, 0.004), m(1, 0) - 0.6, m(2, 0.004)], 2, 3, CLOTHS[(i * 3) % CLOTHS.length], (uu, v) => v, 0.5, 1); }
      }
    }
    const clothMesh = cloth.build(); clothMesh.frustumCulled = false; scene.add(clothMesh);
    await pause();

    // ---- palms in the square, things growing in pots and on parapets ----
    const wind = flora.makeWind({ direction: [-0.45, 0.9], strength: 1.7, speed: 1.5 });
    await pause();
    const floraOpts = { wind };
    await flora.prepareLeafTexture(floraOpts, ctx.yield);      // kit: the leaf atlas in short steps, so windMaterial draws nothing
    const floraM = flora.windMaterial(floraOpts);
    await pause();
    const scatters = [], fr = rng.fork('flora'), palmPts = [], P2 = (s, l, sc, v) => { const p = line.at(s, l); palmPts.push({ x: p[0], y: 0.15, z: p[1], s: sc, rot: fr() * TAU, d: 0, u: 0, v }); };
    for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) P2(ST.sq0 + 3 + i * 5.7 + fr.range(-0.8, 0.8), ST.lF + 9 + j * 15 + fr.range(-1, 1), fr.range(0.85, 1.15), i + j);
    for (const [s, l] of [[-9, 118], [10, 122], [596, 33], [603, 35]]) P2(s, l, fr.range(0.8, 1), 1);
    const palmA = flora.palmGeometry({ rng: fr, height: 17, curve: 0.08, detail });
    await pause();
    const palmB = flora.palmGeometry({ rng: fr, height: 14.5, curve: 0.2, detail });
    await pause();
    const palms = flora.makeScatter({ rng: fr, material: floraM, wind, points: palmPts, castShadow: shadows, tilt: 0.03, variants: [palmA, palmB] });
    scene.add(palms.object);
    await pause();
    // under the palms: sea-grape and almond trees, a bandstand, benches
    { const tp = [], T2 = (s0, l, sc, v) => { const p = line.at(s0, ST.lF + l); tp.push({ x: p[0], y: 0.15, z: p[1], s: sc, rot: fr() * TAU, d: 0, u: 0, v }); };
      for (const [s0, l, v] of [[209.5, 16.5, 0], [216.5, 17.5, 1], [234, 16, 1], [240.5, 17, 0], [211.5, 32.5, 1], [225, 33.5, 0], [238.5, 32, 0], [203, 5, 1], [247, 5.5, 0]]) T2(s0, l, fr.range(0.85, 1.15), v);
      const oakA = flora.oakGeometry({ rng: fr, height: 6.2, detail, leaf: '#3f7a3c', leafLight: '#86b060', leafDark: '#1f4a2a' });
      await pause();
      const oakB = flora.oakGeometry({ rng: fr, height: 7, detail, leaf: '#5a8a34', leafLight: '#c0763a', leafDark: '#2c5226' });
      await pause();
      const trees = flora.makeScatter({ rng: fr, material: floraM, wind, points: tp, castShadow: shadows, tilt: 0.04, variants: [oakA, oakB] });
      scene.add(trees.object); scatters.push(trees);
      await pause();
      const B = new S.Builder(2048), iron = lin('#27312d'), wood = lin('#6a4a2c');
      for (const [s0, l, ry] of [[213, 5.2, 0], [237, 5.2, 0], [219.5, 21.5, PI], [230.5, 21.5, PI], [206.5, 13, -PI / 2], [243.5, 13, PI / 2]]) {
        const p = line.at(s0, ST.lF + l); B.tr(p[0], 0.15, p[1], PI - line.theta(s0) + ry);
        B.surf(SURF.PLANKS).col(wood, 0.85, 1); B.box(-1, 0.42, -0.24, 1, 0.48, 0.24, { bottom: true }); B.box(-1, 0.62, -0.3, 1, 0.98, -0.24, { bottom: true });
        B.surf(SURF.PLAIN).col(iron, 0.8, 1); for (const x of [-0.92, 0.92]) { B.box(x - 0.04, 0, -0.3, x + 0.04, 0.98, -0.22); B.box(x - 0.04, 0, 0.14, x + 0.04, 0.6, 0.22); B.box(x - 0.04, 0.56, -0.26, x + 0.04, 0.62, 0.22); }
        B.pop();
      }
      { const p = line.at(225, ST.lF + 17); B.tr(p[0], 0.15, p[1], PI - line.theta(225));
        B.surf(SURF.MASONRY, 0, 1.2).col(lin('#b9ad98'), 0.7, 1); B.cyl(0, 0, 0, 3.5, 3.3, 0.95, 8); B.cbox(0, 0, 3.6, 2.0, 0.32, 1.0); B.cbox(0, 0.32, 3.4, 2.0, 0.32, 0.6);
        B.surf(SURF.PLAIN).col(iron, 0.9, 1);
        for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU, x = Math.cos(a) * 3.0, z = Math.sin(a) * 3.0, a2 = (i + 1.5) / 8 * TAU, x2 = Math.cos(a2) * 3.0, z2 = Math.sin(a2) * 3.0;
          B.cyl(x, 0.95, z, 0.09, 0.07, 3.3, 6, { cap: false });
          if (i !== 1) { B.beam([x, 1.85, z], [x2, 1.85, z2], 0.06); B.beam([x, 1.4, z], [x2, 1.4, z2], 0.04); }
          B.beam([x, 4.1, z], [x2, 4.1, z2], 0.12); }
        B.col(lin('#9a3a2c'), 0.75, 1.05); B.cyl(0, 4.2, 0, 3.8, 0.35, 1.7, 8); B.col(iron, 1, 1); B.cyl(0, 5.9, 0, 0.12, 0.02, 1.1, 5);
        B.surf(SURF.GLOW, 0, 1.4).col(lin('#ffd9a0')); B.cbox(0, 3.6, 0, 0.3, 0.4, 0.3, { bottom: true }); B.surf(SURF.PLAIN);
        B.pop(); }
      const m = new THREE.Mesh(B.toGeometry(), mats.facades); m.castShadow = m.receiveShadow = shadows; scene.add(m);
    }
    await pause();
    const potPts = ex.plants.map((p, i) => ({ x: p[0], y: p[1], z: p[2], s: p[3] * 0.55, rot: fr() * TAU, d: 0, u: 0, v: i }));
    const potV = [flora.fernGeometry({ rng: fr, size: 1.2, detail: 0 }), flora.bushGeometry({ rng: fr, size: 1.3, detail: 0, flowers: 0.5, flowerColor: '#E8929A' }), flora.fernGeometry({ rng: fr, size: 1.4, detail: 0, leaf: '#5a9a48' })];
    await pause();
    const pots = flora.makeScatter({ rng: fr, material: floraM, wind, points: potPts, sink: 0, tilt: 0.12, receiveShadow: shadows, variants: potV });
    scene.add(pots.object);
    await pause();
    // round 11: the first house past the palm square (whichever the town's dice make it) carries a cascade of magenta
    // bougainvillea from its roof terrace down the side wall that faces the square, with its fallen bracts on the square's
    // paving; it tosses in the palms' own wind and casts its shadow where the look has shadows. One wall only.
    // (a look constant: under the lamps at night it gives back 0.3 of its own colour times the look's night, as the lit wall
    // behind it does; without it the kit's leaves are black against a lamp-lit wall)
    const corner = ex.fronts.find((h) => h.s === ST.sq1 + 3.5 && h.lF === ST.lF);
    const cascade = await buildCascade({ flora, merge: mergeGeometries, rng: own('mn-bougainvillea'), matrix: corner.matrix, H: corner.H, depth: corner.depth, magenta: ['#c21e7a', '#f0589f', '#7c1250'], pavementY: 0.15, pause, glow: 0.3 * look.night });
    await pause();
    { const m = new THREE.Mesh(cascade.geometry, floraM); m.castShadow = m.receiveShadow = shadows; if (shadows) m.customDepthMaterial = floraM.userData.depthMaterial; scene.add(m); }
    await ctx.yield?.();

    // ---- birds ----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), dark = { body: '#14151b', belly: '#1c1d24', wingC: '#101116', tip: '#0a0a0e', head: '#18191f' };
    // twelve frigatebirds hanging on the wind over the wall: scythe wings, forked tails, never a wingbeat
    const frig = { species: 'swifts', size: 6.2, lod: 'high', ...dark, flap: 0.4, amp: 0.03, glide: 1, bank: 0.5, wander: [5, 2.5, 5, 0.12], maxSigma: 3 };
    fauna.add(F.makeFlock({ rng: rng.fork('frigate'), ...frig, count: 7, spread: [50, 12, 70], along: { path, side: 32, up: 34, lead: 110, from: 0.14, to: 1.08, drift: 10 } }));
    await pause();
    fauna.add(F.makeFlock({ rng: rng.fork('frigate2'), ...frig, count: 5, spread: [36, 9, 50], along: { path, side: 20, up: 48, lead: 150, from: 0.2, to: 1.1, drift: 8 } }));
    await pause();
    fauna.add(F.makeFlock({ rng: rng.fork('pelican'), species: 'geese', count: Math.round(7 * dens), form: 'line', size: 1.5, lod: 'low', body: '#8d8778', wingC: '#6c675c', head: '#e8e0c8', along: { path, side: 15, up: 4.5, lead: 52, from: 0.26, to: 0.5, drift: 6 } }));
    await pause();
    fauna.add(F.makeFlock({ rng: rng.fork('pigeon'), species: 'crows', count: Math.round(15 * dens), size: 0.7, lod: 'low', body: '#8b8f9c', wingC: '#6d7180', head: '#5e6270', belly: '#a2a6b0', spread: [30, 4, 30], wander: [0.6, 0.3, 0.6, 0.4], maxSigma: 3, keepClear: { path, dist: 2, from: 0, to: 0.2, step: 2, up: true }, cross: { path, u: 0.0, lead: 40, span: 70, angle: 75, side: 1, height: 8.5, rise: 9, duration } }));
    await pause();
    fauna.add(F.makeFlock({ rng: rng.fork('gullA'), species: 'gulls', count: Math.round(11 * dens), size: 1.6, lod: 'low', spread: [34, 6.5, 34], wander: [5, 2.5, 4, 0.35], maxSigma: 3, cross: { path, u: 0.8, lead: 62, span: 170, angle: 50, side: -1, height: 15, offset: 14, duration } }));
    await pause();
    // the gulls that stand on the wall lift off in a white flurry just ahead of a burst: by the fan at s 200, and before the hero
    const iWall = fauna.items.length;      // (round 12) where live's four wall flocks begin in the list, so the standing gulls can keep clear of where they rise
    for (const [k, sW, n] of [['wallA', 141 - 30, 14], ['wallB', ST.hero - heroD - 34, 18], ['wallC', 330, 12], ['wallD', 392, 12]]) {
      fauna.add(F.makeFlock({ rng: rng.fork(k), species: 'gulls', count: Math.round(n * dens), size: 1.25, lod: 'high', spread: [16, 3, 14], flap: 4.2, glide: 0.1, wander: [1, 0.6, 1, 0.35], maxSigma: 3, keepClear: { path, dist: 2, from: uOfS(sW) - 0.01, to: uOfS(sW) + 0.15, step: 2, up: true },
        cross: { path, u: uOfS(sW), lead: 46, span: 54, angle: 68, side: -1, height: 9.5, offset: -6, rise: 17, duration } }));
      await pause();
    }
    fauna.add(F.makeFlock({ rng: rng.fork('gullB'), species: 'gulls', count: Math.round(9 * dens), size: 1.6, lod: 'low', spread: [34, 6, 34], wander: [1.6, 1, 1.6, 0.35], maxSigma: 3, keepClear: { path, dist: 2, from: 0, to: 0.3, step: 2, up: true }, center: [-8, 15, -14], radius: 26 }));
    await pause();
    { const p = off(40, 40); fauna.add(F.makeFlock({ rng: rng.fork('gullC'), species: 'gulls', count: Math.round(12 * dens), size: 1.7, lod: 'low', wander: [5, 2.5, 4, 0.35], maxSigma: 3, center: [p[0], 32, p[1]], radius: 34 })); }
    await pause();

    // ---- people, implied: strollers under the arcades (the promenaders too), a knot on the seaward pavement who run when the hero goes up ----
    const pr = rng.fork('people'), folk = [], shirt = () => mul3(pr.pick(CLOTHS), 0.9), brolly = lookName === 'rain' ? 0.6 : 0.06;
    for (const a of ex.arcades) {
      let bs = 0, bd = 1e9;
      for (let s = -160; s < 600; s += 3) { line.at(s, ST.lF + 1.9, q2); const d = (q2[0] - a[0]) ** 2 + (q2[1] - a[2]) ** 2; if (d < bd) { bd = d; bs = s; } }
      if (bd > 64) continue;
      const th = line.theta(bs), n = pr.chance(0.75 * dens) ? pr.int(1, 2) : 0;
      for (let i = 0; i < n; i++) { const o = pr.range(-0.4, 0.4) * a[3], sg = pr.chance(0.5) ? 1 : -1, c = shirt();
        folk.push({ a: [a[0] - Math.cos(th) * o + Math.sin(th) * pr.range(-1, 1), a[1], a[2] - Math.sin(th) * o - Math.cos(th) * pr.range(-1, 1), pr()], b: [-Math.cos(th) * sg, -Math.sin(th) * sg, pr.range(0.7, 1.4), pr.range(4, 12)], c: [c[0], c[1], c[2], pr.chance(brolly * 0.4) ? 1 : 0], f: [0, 0, 0] }); }
    }
    for (let i = 0; i < 21; i++) {       // promenaders on the seaward pavement, and the ones who run
      const run = i < 11, s = run ? ST.hero + pr.range(4, 28) : pr.pick([pr.range(45, 240), pr.range(380, 600)]), l0 = pr.range(0.7, 3.2), l = run ? l0 : ST.lF + 1 + (l0 - 0.7) * 0.8, p = line.at(s, l), th = line.theta(s), sg = pr.chance(0.5) ? 1 : -1, c = shirt();
      folk.push({ a: [p[0], 0.15, p[1], pr()], b: [-Math.cos(th) * sg, -Math.sin(th) * sg, pr.range(0.7, 1.3), run ? 2 : pr.range(5, 14)], c: [c[0], c[1], c[2], pr.chance(brolly) ? 1 : 0],
        f: run ? [-Math.cos(th) * pr.range(9, 15) - Math.sin(th) * pr.range(1, 3), 0, -Math.sin(th) * pr.range(9, 15) + Math.cos(th) * pr.range(1, 3)] : [0, 0, 0] });
    }
    for (let i = 0; i < 12; i++) {       // and by the two keyed fans further round the bay: knots just past each site who run on along the wall as it goes up
      const first = i < 6, s = (first ? 392 : 422) + pr.range(14, 30), p = line.at(s, first ? pr.range(0.9, 3.4) : ST.lF - pr.range(0.9, 3.4)), th = line.theta(s), sg = pr.chance(0.5) ? 1 : -1, c = shirt(), on = pr.range(8, 15), in2 = pr.range(0, 1.4);
      folk.push({ a: [p[0], 0.15, p[1], pr()], b: [-Math.cos(th) * sg, -Math.sin(th) * sg, pr.range(0.7, 1.3), 2], c: [c[0], c[1], c[2], 0], g: first ? 1 : 2,
        f: [-Math.cos(th) * on - Math.sin(th) * in2, 0, -Math.sin(th) * on + Math.cos(th) * in2] });
    }
    const people = makePeople(U, folk, sunny, look.lamp > 0.2 ? 0.55 * look.lamp : 0); scene.add(people.mesh);
    await pause();

    // ---- air: spindrift blown off the wall, leaves, rain when the front is here; lamp glows; mist where swells strike ----
    const air = fx.makeParticles({ rng: rng.fork('spin'), preset: 'snow', time: T, count: Math.round(1500 * dens * detail), box: [54, 14, 54], velocity: [-3.4, -0.5, 7.5], velocityRandom: [1.5, 0.8, 2.5],
      turbulence: [0.9, 0.3, 0.8], size: [0.02, 0.06], colors: ['#ffffff', '#eaf6f2', '#d8ece8'], opacity: lookName === 'clear' ? 0.25 : 0.7 });
    await pause();
    const leaves = fx.makeParticles({ rng: rng.fork('leaf'), preset: 'leaves', time: T, count: Math.round(60 * dens), velocity: [-2.6, -0.6, 6], size: [0.03, 0.07], colors: ['#c9a24a', '#8a9a48', '#b0703a'] });
    await pause();
    const rain = look.rain ? fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: T, count: Math.round(5200 * detail), velocity: [-3, -22, 7], colors: ['#c4d0e0', '#e6eef6', '#a8b8cc'] }) : null;
    scene.add(air.object, leaves.object); if (rain) scene.add(rain.object);
    await pause();
    { const p = line.at(ST.hero, 0), th = line.theta(ST.hero); for (const lx of [-40, -8, 24]) lampPts.push([p[0] + Math.cos(th) * lx - Math.sin(th) * 1.3, 5.55, p[1] + Math.sin(th) * lx + Math.cos(th) * 1.3, ST.hero - lx]); }
    lampPts.sort((a, b) => a[3] - b[3]);

    // =================================================================================================================
    // ROUND 12: four things the design gives the drive and the picture lacked, each by a rule of its place. Every one has a
    // stream of its own (own(name)); none draws from a live stream; none reads the car's station, u, the flight's clock or the
    // eye. Two of them RIDE on the fans (see the update): they ask the fan at their own place what it is doing.
    const r12 = { palms: [], gulls: [], gullsOut: [], folk: [], folkOut: [], rise: [] }, q12 = [0, 0], v12 = new THREE.Vector3();
    // the station of a place in the world (build time only)
    const sOf = (x, z) => { let bs = 0, bd = 1e18;
      for (let s = -160; s <= 740; s += 2) { line.at(s, 0, q12); const dd = (q12[0] - x) ** 2 + (q12[1] - z) ** 2; if (dd < bd) { bd = dd; bs = s; } }
      for (let k = 0; k < 6; k++) { line.at(bs, 0, q12); const th = line.theta(bs); bs += (x - q12[0]) * -Math.cos(th) + (z - q12[1]) * -Math.sin(th); }
      return bs; };

    // ---- A1: the palm square shows itself to the road ----
    // A front row of royal palms along the square's own opening: from the wall of the house that ends 3.5 m short of the square's
    // first station to the wall of the house that begins 3.5 m past its last (s 201.5 to 248.5, 47 m). One palm every 9.4 m is
    // five, the first and the last half a spacing in from the two walls (s 206.2, 215.6, 225.0, 234.4, 243.8). They stand on the
    // landward pavement's kerb side, the trunk's axis 1.75 m in from the kerb (l 25.0): the nearest the road can have them while
    // the trunk still passes more than 6 m from an eye in the lane that runs nearest (the lane's own formula tops at l 18.25).
    // Live's palm builder makes them: two more of its palms, straight as live's taller one. The builder's `height` is not the
    // palm's top (the crown comes out about 1.13 times it), so each palm is sized by the built crown's own top above the
    // pavement (0.97 of it: live's scatter sinks a palm 3% into the ground): the first, third and fifth 16 to 18 m, the second and
    // fourth 18 to 20 m, by the stream (the design's 16 to 20 m; builder heights 15 and 16.8 so that no palm is stretched or
    // shrunk by more than a tenth). Live's scatter plants them in live's wind and material, and they cast
    // shadows where the look has shadows, as the fourteen do. Live's palms drop no fronds, so none lie here.
    { const pr2 = own('mn-squarefront'), a0 = ST.sq0 - 3.5, a1 = ST.sq1 + 3.5, n = Math.round((a1 - a0) / 9.4), step = (a1 - a0) / n, lP = 23.25 + 1.75, pts = [];
      const frontA = flora.palmGeometry({ rng: pr2, height: 15, curve: 0.08, detail });
      await pause();
      const frontB = flora.palmGeometry({ rng: pr2, height: 16.8, curve: 0.08, detail });
      await pause();
      for (let i = 0; i < n; i++) { const s = a0 + (i + 0.5) * step, p = line.at(s, lP), H = i % 2 ? pr2.range(18, 20) : pr2.range(16, 18), k = H / (0.97 * (i % 2 ? frontB : frontA).userData.height); pts.push({ x: p[0], y: 0.15, z: p[1], s: k, rot: pr2() * TAU, d: 0, u: 0, v: i }); r12.palms.push({ s, l: lP, x: p[0], z: p[1], k, H }); }
      // (round 13) BY LAMPLIGHT THE FRONT ROW TAKES THE STANDARDS' LIGHT: through the flora kit's own glow channel (the fourth
      // number of a vertex's wind attribute: its own colour, emitted), written on these two geometries only: PALM_LAMP times the
      // look's lamp level, full up to the lanterns' height (5.55 m) and falling over them as 1 / (1 + ((y - 5.55) / 12)^2), y
      // being the vertex's height on a planted palm (these stand 1.167 times their builder's height). The kit's channel has no
      // side: trunk and crown take it alike (the crown is seen from the road, from beneath). With the lamps out nothing is written
      if (look.lamp > 0) for (const g of [frontA, frontB]) {
        const wa = g.attributes.wind, pa = g.attributes.position;
        for (let i = 0; i < wa.count; i++) { const dy = (pa.getY(i) * 1.167 - 5.55) / 12; wa.setW(i, PALM_LAMP * look.lamp * (dy <= 0 ? 1 : 1 / (1 + dy * dy))); }
      }
      const front = flora.makeScatter({ rng: pr2, material: floraM, wind, points: pts, castShadow: shadows, tilt: 0.03, stretch: 0, variants: [frontA, frontB] });
      front.object.name = 'mn12:palms'; scene.add(front.object); scatters.push(front); r12.front = front; r12.frontGeo = [frontA, frontB];
      await pause();
      // at each foot a tree pit: a frame of the square's own bone-coloured band stone (its colour typed again from the ground
      // builder, where it is a local), 2 m square and 2 cm proud of the pavement, round a dark iron grate
      const B = new S.Builder(512), bone = mix3(lin('#a39a8a'), [0.8, 0.76, 0.66], 0.6), iron = lin('#27312d');
      for (const q of r12.palms) { B.tr(q.x, 0.15, q.z, PI - line.theta(q.s));
        B.surf(SURF.MASONRY, 0, 2.2).col(bone, 0.9, 1); B.box(-1, 0, -1, 1, 0.02, -0.7); B.box(-1, 0, 0.7, 1, 0.02, 1); B.box(-1, 0, -0.7, -0.7, 0.02, 0.7); B.box(0.7, 0, -0.7, 1, 0.02, 0.7);
        B.surf(SURF.PLAIN).col(iron, 0.8, 1); B.box(-0.7, 0, -0.7, 0.7, 0.012, 0.7);
        B.pop(); }
      const pit = new THREE.Mesh(B.toGeometry(), mats.facades); pit.receiveShadow = shadows; pit.name = 'mn12:pits'; scene.add(pit);
    }
    await pause();

    // ---- what the fans reach: each fan's own water, flown by its own law, laid on the ground of its own frame (parts) ----
    // ride[]: every fan with the two things a rider may ask it: tau() is what live's update last gave that fan (seconds since its
    // burst on the fan's own clock; the hero's is handed over in the update), h is the fan's own handle with its own functions
    const heroRide = { tau: -5 };
    const ride = [...fans.map((f) => ({ h: f.h, s: f.s, looped: f.trig == null, tau: () => f.tau })), { h: hero, s: ST.hero, looped: false, tau: () => heroRide.tau }];
    for (let i = 0; i < ride.length; i++) { ride[i].h.object.updateMatrixWorld(true); ride[i].reach = fanFootprint(ride[i].h); if (i % 4 === 3) await pause(); }
    await pause();
    // the fans whose water passes within r metres of a place above the coping's height
    const reachedBy = (x, z, r, out = []) => { for (const a of ride) { v12.set(x, 0, z); a.h.object.worldToLocal(v12); if (a.reach.over(v12.x, v12.z, r) && !out.includes(a)) out.push(a); } return out; };
    r12.ride = ride;

    // ---- A3: people at the wall, on the seaward pavement from the junction to the canopy ----
    // (round 12b) Where: each group's place is drawn along s 30 to 300 by the people's own stream. Every die is drawn first, in a
    // fixed pattern: how many groups are wanted (six to eight), then 400 candidate groups of 35 draws each whatever their size
    // (place, size, who points, four figures' values of which the first "size" are used). Then the tests, in this order, on the
    // candidates in the order drawn, until the wanted number stands: (a) the place, the group's middle on the figures' line, is
    // 6 m or more in plan from the foot of every lamp standard (live's lampPts: the entries with a head over 5 m up); (b) it is
    // 20 m or more along the wall from every group already kept; (c) the water of no clock-run fan reaches a figure of it. A test
    // keeps or leaves a candidate and draws nothing. 400: the standards stand 16 m apart, so (a) leaves 4 m between two of
    // them, and of the 270 m a given such band is missed by all 400 with a chance of 0.3 percent.
    // Two to four of live's own figures (live's builder, with its shader that dissolves a figure near the eye), shoulder to
    // shoulder 0.55 to 0.95 m from the wall's foot, facing the sea; one of each group points out to sea. Colours from live's
    // cloths, umbrellas by live's own chance for the look (six in ten in the rain).
    const folk12 = [], folkGroups = [];
    // (round 15) and a second set down the last of the bay, s 440 to 596, three to five groups, by the same rules in the same order
    // on a stream of its own (mn-wallfolk2), so the first set is dealt as it was
    for (const [stream, sA, sB, gA, gB] of [['mn-wallfolk', 30, 300, 6, 8], ['mn-wallfolk2', 440, 596, 3, 5]]) {
      const pw = own(stream), feet = lampPts.filter((p) => p[1] > 5), g0 = folkGroups.length, nGr = g0 + pw.int(gA, gB), cand = [];
      for (let k = 0; k < 400; k++) {
        const sG = pw.range(sA, sB), size = pw.int(2, 4), point = Math.min(size - 1, Math.floor(pw() * size)), figs = [];
        for (let j = 0; j < 4; j++) { const f = { ds: (j - (size - 1) / 2) * 0.85 + pw.range(-0.1, 0.1), l: pw.range(0.55, 0.95), turn: pw.range(-0.3, 0.3), col: mul3(pw.pick(CLOTHS), 0.9), brolly: pw.chance(brolly) ? 1 : 0, ph: pw(), back: pw.range(2.6, 3.6), along: pw.range(1, 3) }; if (j < size) figs.push(f); }
        cand.push({ s: sG, point, figs });
      }
      if (!g0) r12.folkSeen = 0;
      for (const c of cand) {
        if (folkGroups.length >= nGr) break;
        if (!g0) r12.folkSeen++;
        // (a) clear of every standard's foot; the place is taken on the middle of the figures' line, l 0.75
        line.at(c.s, 0.75, q12); if (feet.some((p) => Math.hypot(p[0] - q12[0], p[2] - q12[1]) < 6)) continue;
        // (b) clear of every group that already stands
        if (folkGroups.some((g) => Math.abs(g.s - c.s) < 20)) continue;
        // (c) a place the water of a clock-run fan reaches (the two that close the side street burst every ten seconds) is no place to stand
        const th = line.theta(c.s), hit = []; for (const f of c.figs) { line.at(c.s + f.ds, f.l, q12); reachedBy(q12[0], q12[1], 1, hit); }
        if (hit.some((a) => a.looped)) { r12.folkOut.push({ s: c.s, n: c.figs.length, why: 'clock-run fan' }); continue; }
        // which way is away: along the wall, off the middle of the nearest fan that reaches them
        let near = null; for (const a of hit) if (!near || Math.abs(a.s - c.s) < Math.abs(near.s - c.s)) near = a;
        const away = near && near.s > c.s ? -1 : 1, grp = { s: c.s, fans: hit, i0: folk12.length, n: c.figs.length, F: [], Fn: [Math.cos(th), Math.sin(th)], ph: [], arm: -1, on: false };
        c.figs.forEach((f, j) => {
          const p = line.at(c.s + f.ds, f.l), sx = Math.sin(th), sz = -Math.cos(th), ct = Math.cos(f.turn), st = Math.sin(f.turn);
          if (j === c.point) grp.arm = folk12.length;
          folk12.push({ a: [p[0], 0.15, p[1], f.ph], b: [sx * ct - sz * st, sx * st + sz * ct, 1, 0], c: [f.col[0], f.col[1], f.col[2], f.brolly], f: [0, 0, 0] });
          // the run: back across the pavement (2.6 to 3.6 m landward: they end 3.2 to 4.6 m from the wall, short of the kerb at 5) and 1 to 3 m along it, away
          grp.F.push(-Math.sin(th) * f.back - Math.cos(th) * f.along * away, Math.cos(th) * f.back - Math.sin(th) * f.along * away); grp.ph.push(f.ph * TAU);
        });
        folkGroups.push(grp); r12.folk.push({ s: c.s, n: c.figs.length, fans: hit.map((a) => a.s) });
      }
    }
    let wallFolk = null, wallArms = null;
    if (folk12.length) {
      wallFolk = makePeople(U, folk12, sunny, look.lamp > 0.2 ? 0.55 * look.lamp : 0); wallFolk.mesh.name = 'mn12:folk'; scene.add(wallFolk.mesh);
      // live's law moves a figure by its flee vector times a channel of the flee uniform; here the channel stands at 1 and each
      // group's vector is scaled by its own fan's state in the update, so every group can ride its own fan
      wallFolk.flee.value.set(1, 1, 1);
      // the pointing arm: one more bar of the figure's kind (sleeve in the shirt's colour, forearm in live's skin tone, typed again
      // from live's builder where it is a local), drawn with the figures' own material and each pointer's own instance values
      const skin = [0.3, 0.17, 0.11], ab = mergeGeometries([gBar([0.25, 1.46, 0], [0.31, 1.5, 0.34], 0.075, [1, 1, 1], 1), gBar([0.31, 1.5, 0.34], [0.34, 1.6, 0.66], 0.06, skin, 0)], false);
      const ag = new THREE.InstancedBufferGeometry(), pg = wallFolk.mesh.geometry, who = folkGroups.map((g) => g.arm);
      ag.index = ab.index; for (const k of ['position', 'normal', 'color', 'aM']) ag.setAttribute(k, ab.attributes[k]);
      for (const [k, sz] of [['iA', 4], ['iB', 4], ['iC', 4], ['iF', 3], ['iG', 1]]) { const src = pg.attributes[k].array, arr = new Float32Array(who.length * sz); who.forEach((fi, i) => { for (let c = 0; c < sz; c++) arr[i * sz + c] = src[fi * sz + c]; }); ag.setAttribute(k, new THREE.InstancedBufferAttribute(arr, sz)); }
      ag.instanceCount = who.length; ag.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      wallArms = new THREE.Mesh(ag, wallFolk.mesh.material); wallArms.frustumCulled = false; wallArms.name = 'mn12:arms'; scene.add(wallArms);
    }
    await pause();

    // ---- A2: gulls stand on the wall ----
    // Forty times the engine's density (as live's flocks are counted), in loose groups of three to seven, on the coping between
    // s 20 and s 600: the stretch is cut into as many equal cells as there are groups and each group stands in its own cell, at
    // least 6 m in from the cell's ends, so no two are nearer than 12 m. Each bird is the kit's own gull as live's wall flocks
    // have it (same call and detail; the size is live's near gulls'), its wings folded and standing on two legs (parts), 0.45 m behind the wall's road face,
    // head to the wind. All dice are drawn before any test, the birds' own too: the stream is forked once, before the tests, for
    // the standing flock ('stand') and once for every dealt group's flight ('fly'), kept or not, so a group left out deals no
    // other bird anew. Left out by rules of the place: a group within 15 m of where one of live's four wall flocks rises (the
    // two never double), and a group the water of a clock-run fan reaches (no rest there).
    // RIDING OF THE KEEPING-CLEAR KIND (named): the 15 m rule keeps the new birds off a live animal's ground. Where that ground
    // lies is asked of the live flock itself (the first point of its own route, fauna.items[iWall + k].f.route.pointAt(0));
    // no station, key or u of live's is typed again here. It moves with whatever live's own lines give that flock.
    // GULL_LEAD: the design's two seconds ahead of the burst. GULL_DOWN: 2.5 s from the fan's water having fallen to the birds
    // standing again (the last 9 m of their loop, along the coping, at the pace they land at). The people's run out is live's
    // keyedRun (called in the update). FOLK_BACK: 3 s to walk back 3 to 4.5 m. FOLK_SHAKE: 1.5 s.
    // GULL_SIZE: 1.6, the size live gives its near loop of gulls (live's flocks are 1.25, 1.6 and 1.7); chosen by eye between 1.25 and 1.6 on strips at chance
    // positions on four looks (night, morning, rain, clear), as the order allows: at 1.25 a standing bird 30 m off is a mark, at 1.6 a bird.
    const GULL_LEAD = 2, GULL_DOWN = 2.5, FOLK_BACK = 3, FOLK_SHAKE = 1.5, GULL_SIZE = 1.6, share12 = [0, 0];
    const gullGroups = []; let gullStand = null;
    { const gw = own('mn-wallgulls'), nG = Math.round(40 * dens), sizes = [], cand = [];
      for (let left = nG; left > 0;) { const k = Math.min(left, gw.int(3, 7)); sizes.push(k); left -= k; }
      if (sizes.length > 1 && sizes[sizes.length - 1] < 3) { const c = sizes.pop() + sizes.pop(); if (c <= 7) sizes.push(c); else sizes.push(c - 3, 3); }
      const cell = (600 - 20) / sizes.length;
      for (let k = 0; k < sizes.length; k++) {
        const sG = 20 + (k + 0.5) * cell + gw.range(-1, 1) * Math.max(0, cell / 2 - 6), birds = []; let x = 0;
        for (let j = 0; j < sizes[k]; j++) { birds.push({ ds: x, l: -0.45 + gw.range(-0.12, 0.12), ox: gw.range(-1.6, 1.6), oy: gw.range(-0.5, 0.8), oz: gw.range(-1.6, 1.6), lag: gw.range(0, 0.3) }); x += gw.range(0.5, 1.1); }
        const mid = birds[birds.length - 1].ds / 2; for (const b of birds) b.ds -= mid;
        cand.push({ s: sG, birds });
      }
      // (round 12b) the last draws of this stream, before any test: a fork for the standing flock and one for each dealt group's flight
      const standRng = gw.fork('stand'); let b0 = 0;
      for (const c of cand) { c.fly = gw.fork('fly'); c.b0 = b0; b0 += c.birds.length; }
      // (flock cure 1) the rise place is taken where live's own lines lay it: where the kit has moved the flock's whole course bodily to
      // keep it off the flown line (keepClear, no ease), that one shift is taken off again, so the 15 m rule leaves out the groups it left out before
      for (let k = 0; k < 4; k++) { const f = fauna.items[iWall + k].f, p = f.route.pointAt(0, v12), sh = f.kept ? f.kept.shift : null; r12.rise.push(sOf(p.x - (sh ? sh[0] : 0), p.z - (sh ? sh[2] : 0))); }
      const kept = [];
      for (const c of cand) {
        // riding of the keeping-clear kind (see above): the rise place is the live flock's own
        if (r12.rise.some((s) => Math.abs(s - c.s) < 15)) { r12.gullsOut.push({ s: c.s, n: c.birds.length, why: 'live flock rises here' }); continue; }
        const hit = []; for (const b of [c.birds[0], c.birds[c.birds.length - 1], { ds: 0, l: -0.45 }]) { line.at(c.s + b.ds, b.l, q12); reachedBy(q12[0], q12[1], 1, hit); }
        if (hit.some((a) => a.looped)) { r12.gullsOut.push({ s: c.s, n: c.birds.length, why: 'clock-run fan' }); continue; }
        kept.push({ c, hit });
      }
      const total = kept.reduce((t, k) => t + k.c.birds.length, 0);
      if (total) {
        // one flock of the kit's gulls for all that stand: no travel (its lead point is held; the small "speed" only gives each bird
        // a heading, which the kit takes from its course), a sway of 3 cm that turns the bird a little to and fro across the wind,
        // a slow rock of tail and head in place of the wing beat
        const wd = U.uWindDir.value, aW = Math.atan2(-wd.x, -wd.z), ca = Math.cos(aW), sa = Math.sin(aW), PRE = F.BIRD_PRESETS.gulls;
        // (round 12b) dealt for every dealt bird from the stream's own 'stand' fork; the birds that stand are moved to the front below
        const st = F.makeFlock({ rng: standRng, species: 'gulls', count: b0, size: GULL_SIZE, lod: 'high', wander: [0.03, 0, 0.012, 0.5], flap: 0.35, amp: 0.25, glide: 0, route: [[0, 0, -2], [0, 0, -0.7], [0, 0, 0.7], [0, 0, 2]], closed: false });
        const standH = foldWings(st.geometry, PRE); st.setLight(fauna.light);
        // (after the first night picture, 19:17 UTC: by live's flock light alone a standing bird is a grey mark on grey stone under the
        // lamps. Where the look lights its lamps the standing birds take the lamp light live gives its figures on this pavement:
        // live's colour (1, 0.64, 0.34) and strength 0.55 x the look's lamp, at the middle 0.5 of the figures' 0.3 to 0.7, times pi
        // because the kit's bird shader divides its light by pi and live's figure shader does not. No number of its own.)
        // (round 12b) the same birds in the air take the same term by the same law (below), so a bird keeps its light when it lifts off.
        const lampC = look.lamp > 0.2 ? new THREE.Color(1, 0.64, 0.34).multiplyScalar(0.55 * look.lamp * 0.5 * PI) : null;
        if (lampC) { st.uniforms.uSkyColor.value.add(lampC); st.uniforms.uGroundColor.value.add(lampC); }
        const u = st.uniforms, c0 = st.route.pointAt(st.route.length / 2), iA = st.geometry.attributes.iA, iB = st.geometry.attributes.iB, iT = st.geometry.attributes.iTint;
        u.uSpeed.value = 0.06; u.uBank.value = 0.2; u.uTravel.value = st.route.length / 2;
        st.object.rotation.y = aW; st.object.frustumCulled = false; st.object.name = 'mn12:gulls'; scene.add(st.object);
        let i = 0;
        for (const { c, hit } of kept) {
          const th = line.theta(c.s), o = line.at(c.s, -0.45), g = { s: c.s, n: c.birds.length, i0: i, fans: hit, near: null, fly: null, air: false, hop: false, sc: [], y: [], base: [], loose: [], lag: [], L: 0 };
          for (const a of ride) if (!a.looped && (!g.near || Math.abs(a.s - c.s) < Math.abs(g.near.s - c.s))) g.near = a;
          for (let j = 0; j < c.birds.length; j++) {
            // the bird's own dealt values (beat, size, seed, tint) come from its place in the whole deal (c.b0 + j), whoever else was left out
            const b = c.birds[j], src = c.b0 + j; iA.setW(i, iA.getW(src)); iB.setXYZ(i, iB.getX(src), iB.getY(src), iB.getZ(src)); iT.setXYZ(i, iT.getX(src), iT.getY(src), iT.getZ(src));
            const p = line.at(c.s + b.ds, b.l), sB = c.s + b.ds, sc = iB.getX(i);
            // the feet are on the stone: the coping's top, or the patch 0.145 m lower where the stage's one coping stone is gone (parts: 24 to 25.5 m short of the hero's site)
            const y = (sB > ST.hero - 25.5 && sB < ST.hero - 24 ? WALL_TOP - 0.145 : WALL_TOP) + standH * sc;
            iA.setXYZ(i, p[0] * ca - p[1] * sa - c0.x, y - c0.y, 0); iB.setW(i, p[0] * sa + p[1] * ca - c0.z);
            // the same bird in the frame of its group's own flight (origin at the group's middle on the coping, +Z into the wind)
            g.base.push((p[0] - o[0]) * ca - (p[1] - o[1]) * sa, y - (WALL_TOP + 0.1), (p[0] - o[0]) * sa + (p[1] - o[1]) * ca); g.loose.push(b.ox, b.oy, b.oz); g.lag.push(b.lag); g.sc.push(sc); g.y.push(y - c0.y);
            i++;
          }
          if (hit.length) {
            // it flies when its fan sends it up: one small flock of live's wall-flock kind (same beat and glide) on the loop of parts,
            // turned so the loop's +Z is into the wind and its +X is the side away from the fan's middle
            let nearF = hit[0]; for (const a of hit) if (Math.abs(a.s - c.s) < Math.abs(nearF.s - c.s)) nearF = a;
            const aw = nearF.s > c.s ? -1 : 1, d = (-Math.cos(th) * ca + Math.sin(th) * sa) * aw < 0 ? -1 : 1;
            const fl = F.makeFlock({ rng: c.fly, species: 'gulls', count: g.n, size: GULL_SIZE, lod: 'high', flap: 4.2, glide: 0.1, wander: [0, 0, 0, 0.9], route: gullLoop(d) });
            fl.setLight(fauna.light); if (lampC) { fl.uniforms.uSkyColor.value.add(lampC); fl.uniforms.uGroundColor.value.add(lampC); }
            fl.object.position.set(o[0], WALL_TOP + 0.1, o[1]); fl.object.rotation.y = aW; fl.object.visible = false; fl.object.name = 'mn12:gulls-air'; scene.add(fl.object);
            const fA = fl.geometry.attributes.iA, fB = fl.geometry.attributes.iB, fT = fl.geometry.attributes.iTint;
            for (let j = 0; j < g.n; j++) { fA.setZ(j, 0); fA.setW(j, iA.getW(g.i0 + j)); fB.setX(j, iB.getX(g.i0 + j)); fB.setZ(j, iB.getZ(g.i0 + j)); fT.setXYZ(j, iT.getX(g.i0 + j), iT.getY(g.i0 + j), iT.getZ(g.i0 + j)); }
            g.fly = fl; g.L = fl.route.length; g.c1 = fl.route.pointAt(0);
            await pause();
          }
          gullGroups.push(g); r12.gulls.push({ s: c.s, n: g.n, fans: hit.map((a) => a.s), near: g.near ? g.near.s : null });
        }
        st.geometry.instanceCount = total; iA.needsUpdate = iB.needsUpdate = iT.needsUpdate = true; gullStand = st;
      }
    }
    await pause();
    r12.gullGroups = gullGroups; r12.folkGroups = folkGroups;
    // ================================================= end of round 12's build =================================================

    const lampOn = look.lamp > 0.2, lampNear = new Float64Array(NVEH);
    const glows = lampOn ? fx.makeGlows({ rng, positions: lampPts.map((p) => [p[0], p[1], p[2]]), color: '#ffbe6e', size: 2.6, intensity: 1.2 + look.lamp * 1.6, time: T, flicker: 0.12 }) : null;
    if (glows) scene.add(glows.object);
    await pause();
    // far lights: the freighter's (masthead, bridge, a red one on her funnel) and the town across the harbour mouth, low on the ridges
    const SHIP = [-535, -695, 1.45], farPos = [], farCol = [], farSize = [];
    if (lampOn) {
      const cs = Math.cos(SHIP[2]), sn = Math.sin(SHIP[2]), sr = rng.fork('shore');
      for (const [x, y, z, c, k] of [[0, 20, 30, '#fff4dc', 1.5], [0, 16.5, 2, '#fff4dc', 1.2], [0, 15.5, -30, '#ffd9a0', 1.6], [0, 22.5, -40, '#ff5a3a', 1.1], [0, 4.5, 50, '#ffd9a0', 0.9], [0, 12, -44, '#ffd9a0', 1.2]]) {
        farPos.push([SHIP[0] + x * cs + z * sn, y, SHIP[1] - x * sn + z * cs]); farCol.push(c); farSize.push(k);
      }
      for (let i = 0; i < 70; i++) {
        const l = sr.chance(0.6) ? 247 : 396, p = line.at(sr.range(430, 735), l), y = sr.range(1.5, l < 300 ? 9 : 22);
        farPos.push([p[0], y, p[1]]); farCol.push(sr.chance(0.75) ? '#ffc070' : '#ffe2b8'); farSize.push(sr.range(0.7, 1.4) * (l < 300 ? 1 : 1.5));
      }
    }
    const farGlows = farPos.length ? fx.makeGlows({ rng, positions: farPos, colors: farCol, sizes: farSize, size: 5, intensity: 1.6 + look.night * 1.6, time: T, flicker: 0.2, minAngle: 0.006 }) : null;
    if (farGlows) scene.add(farGlows.object);
    await pause();
    const mistPos = []; for (let s = -30; s < 600; s += 26) { const p = line.at(s + rng.range(-8, 8), rng.range(-4, -1)); mistPos.push([p[0], rng.range(1.5, 4), p[1]]); }
    const mist = fx.makeMist({ rng: rng.fork('mist'), positions: mistPos, size: [9, 20], color: lookName === 'night' ? '#55628c' : lookName === 'gold' ? '#ffd9a8' : '#e8f2f2', opacity: lookName === 'clear' ? 0.06 : lookName === 'rain' ? 0.1 : 0.16, drift: [-1.2, 0, 2.6], time: T });
    scene.add(mist.object);
    await ctx.yield?.();

    // ---- the point: basalt round the apron, the bluff with its fortress and lighthouse, far shores, a freighter, rain under the shelf ----
    const rk = rng.fork('rocks'), rockParts = [], n3 = ctx.noise;
    // (cure 14c) the rim rocks keep clear of the road tongue and the exit. The place, in the apron's own frame (c metres along the exit's
    // axis from the apron's middle, s metres across it; a rim rock's two ring dice give c and s): the tongue's half width (4.5 m, the
    // road's builder) plus 2.0 m of clear air either side of the axis, from the apron's rim (the circle of 20 m) to 3 m beyond the
    // tongue's end (26.5 m). A rock's reach in plan is its radius times 1 + ROCK_RELIEF, the most rock() can give it. The test is the
    // plan's and reads no height, no eye, no seed and no station of the route. The tongue's three numbers stand in the road's builder
    // too: the two must be changed together.
    const ROCK_RELIEF = 0.36, RIM_CLEAR = { half: 4.5 + 2.0, rim: 20, end: 26.5 + 3 };
    const rimClear = (f, rr, r) => {
      const c = rr * Math.cos(f), s = rr * Math.sin(f), s1 = Math.max(-RIM_CLEAR.half, Math.min(RIM_CLEAR.half, s));
      const c1 = Math.max(Math.sqrt(RIM_CLEAR.rim * RIM_CLEAR.rim - s1 * s1), Math.min(RIM_CLEAR.end, c));
      return Math.hypot(c - c1, s - s1) >= (1 + ROCK_RELIEF) * r;
    };
    // (cure 14c) the tone is rock()'s own die, drawn on entry as before unless the caller has drawn it already
    const rock = (x, y, z, r, sy = 0.7, det = 1, flat = 1e9, lift = 1.5, sh = rk.range(0.75, 1.15)) => {
      const g = new THREE.IcosahedronGeometry(r, det), pa = g.attributes.position, c = new Float32Array(pa.count * 3), k = 1.3 / r;
      for (let i = 0; i < pa.count; i++) {
        const px = pa.getX(i), py = pa.getY(i), pz = pa.getZ(i), d = 1 + ROCK_RELIEF * n3.n3(px * k + x * 0.31, py * k + y * 0.31, pz * k + z * 0.31), yy = Math.min(py * d * sy + y, flat);
        pa.setXYZ(i, px * d + x, yy, pz * d + z);
        const top = sm(flat - 1.2, flat - 0.1, yy), w = (0.045 + 0.04 * sat(py / r + 0.5)) * sh * lift * (1 + 0.5 * n3.n3(px * k * 2.7 + 9, py * k * 6, pz * k * 2.7));
        c[i * 3] = mix(w, 0.2 * sh, top); c[i * 3 + 1] = mix(w * 1.02, 0.17 * sh, top); c[i * 3 + 2] = mix(w * 1.1, 0.11 * sh, top);
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.deleteAttribute('uv'); g.computeVertexNormals(); rockParts.push(g);
    };
    // (cure 14c) dice before the test: every one of the 44 draws its six values in live's order (the ring's angle and radius, height,
    // radius, squash, tone) and only then is tested; one that fails is not laid and nothing is drawn or laid in its place
    for (let i = 0; i < 44; i++) {
      const f = rk.range(-2.7, 2.05), rr = rk.range(22.5, 30), y = rk.range(-4.4, -1.6), r = rk.range(1.6, 3.6), sy = rk.range(0.5, 0.9), sh = rk.range(0.75, 1.15);
      if (rimClear(f, rr, r)) { const p = ground.ring(f, rr); rock(p[0], y, p[1], r, sy, 1, 1e9, 1.5, sh); }
      await pause();
    }
    for (let i = 0; i < 10; i++) { const p = off(rk.range(-2, 12), rk.range(-9, 9)); rock(p[0], rk.range(-5, -3.6), p[1], rk.range(1.8, 3.2), 0.6); await pause(); }
    for (let i = 0; i < 12; i++) { const k = i / 11, p = off(mix(-6, 40, k) + rk.range(-3, 3), mix(26, 36, k) + rk.range(-3, 3)); rock(p[0], rk.range(-4.6, -3), p[1], rk.range(2, 4.5), 0.6); await pause(); }
    await pause();
    const iBall = rockParts.length;
    rock(Bc[0], -5, Bc[1], 40, 0.34, 3, 6.4, 3.0);
    await pause();
    for (let i = 0; i < 16; i++) { const a = rk() * TAU, r = rk.range(30, 44); rock(Bc[0] + Math.cos(a) * r, rk.range(-4.5, -2), Bc[1] + Math.sin(a) * r, rk.range(3, 7), 0.6, 1, 1e9, 2.7); await pause(); }
    const rocks = new THREE.Mesh(mergeGeometries(rockParts, false), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, flatShading: true }));
    rocks.receiveShadow = shadows; scene.add(rocks);
    await pause();
    // ---- (round 14) the bluff of the design: 41 m over the road where live's ball lies, the fortress on its whole top, the lighthouse on its near tip ----
    // the fortress's frame (live's: its origin 3 m on and 6 m left of the ball's middle, its long axis 0.22 rad off the exit's): the bluff is cut to it
    const fortAt = [Bc[0] + tE[0] * 3 + nE[0] * 6, Bc[1] + tE[1] * 3 + nE[1] * 6], thF = thE - 0.22, eXf = [-Math.cos(thF), -Math.sin(thF)], eZf = [Math.sin(thF), -Math.cos(thF)], FORT_Y = BLUFF.top - 0.2, FORT_K = 1.2;
    const fortW = (x, y, z) => [fortAt[0] + (eXf[0] * x + eZf[0] * z) * FORT_K, FORT_Y + y * FORT_K, fortAt[1] + (eXf[1] * x + eZf[1] * z) * FORT_K];
    // its lanterns: one on the outer corner of each sentry box, one over each gate (where live's gate lights are)
    const fortLamps = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => fortW(sx * 17.95, 10.3, sz * 12.95)).concat([fortW(0, 2.75, 10.9), fortW(0, 2.75, -10.9)]);
    const nightR = sm(0.12, 0.7, look.night), washK = lampOn && nightR > 0.01 ? FORT_WASH * (look.lamp / 1.6) / nightR : 0;
    const bluffU = { uBTime: T, uBPhase: { value: 0 }, uBSurf: { value: new THREE.Vector4(0.45, 0, 18, 20) }, uBFan: { value: new THREE.Vector4(0, 0, 1, 0) }, uBLant: { value: Array.from({ length: BLUFF_LANT }, (_, i) => i < fortLamps.length ? new THREE.Vector4(fortLamps[i][0], fortLamps[i][1], fortLamps[i][2], 36) : new THREE.Vector4(0, -1000, 0, 0)) },
      uBMoon: { value: moonDir ? moonDir.clone() : new THREE.Vector3(0, 1, 0) }, uBMoonCol: { value: new THREE.Color(moonDir ? '#bcd0ff' : '#000000').multiplyScalar(BLUFF_MOON) },
      uBLantCol: { value: new THREE.Color('#ffb878').multiplyScalar(washK * nightR) } };
    let bluffNear, bluffFar, stair = null, postZ = 0; const stairLamps = [];      // (round 16) the stair up the crag's road face, its postern's place along the fortress's short end, their lanterns
    { const ballP = rockParts[iBall].attributes.position.array, ballN = ballP.length / 9, apC = line.at(ST.apron, 9), route = [];
      // live's ball under a place (its upper skin), or -99 where it does not lie
      const ballAt = (x, z) => {
        let best = -99;
        for (let t = 0; t < ballN; t++) {
          const o = t * 9, ax = ballP[o], az = ballP[o + 2], bx = ballP[o + 3], bz = ballP[o + 5], cx = ballP[o + 6], cz = ballP[o + 8], d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
          if (Math.abs(d) < 1e-9) continue;
          const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
          if (u < 0 || v < 0 || u + v > 1) continue;
          const y = u * ballP[o + 1] + v * ballP[o + 4] + (1 - u - v) * ballP[o + 7]; if (y > best) best = y;
        }
        return best;
      };
      // how near live's ball comes to the flown line (the last 300 m of it, every 2 m), to the apron's middle and to the portal: no new rock nearer
      for (let d = path.length; d > path.length - 300; d -= 2) { path.posAtDist(d, pv); route.push(pv.x, pv.z); }
      const toLine = (x, z) => { let m = 1e18; for (let i = 0; i < route.length; i += 2) { const dx = x - route[i], dz = z - route[i + 1], q = dx * dx + dz * dz; if (q < m) m = q; } return Math.sqrt(m); };
      const liveNear = [1e9, 1e9, 1e9];
      for (let i = 0; i < ballP.length; i += 3) if (ballP[i + 1] >= BLUFF.sea - 0.5) { const x = ballP[i], z = ballP[i + 2]; liveNear[0] = Math.min(liveNear[0], toLine(x, z)); liveNear[1] = Math.min(liveNear[1], Math.hypot(x - apC[0], z - apC[1])); liveNear[2] = Math.min(liveNear[2], Math.hypot(x - pE[0], z - pE[1])); }
      await pause();
      // and where the surf at its foot flies (its own sheet at its own size, from the sea's level up): the face stands 1.2 m behind its
      // most seaward water for the fan's whole width and 2 m to either side, a recess the sea has cut
      const fo = fans[iFoot].h.object.position, fe = footExt.at(fans[iFoot].scale, BLUFF.sea);
      const barred = (x, z) => {
        if (Math.hypot(x - pE[0], z - pE[1]) < liveNear[2] || Math.hypot(x - apC[0], z - apC[1]) < liveNear[1] || toLine(x, z) < liveNear[0]) return true;
        return Math.abs((x - fo.x) * nE[0] + (z - fo.z) * nE[1]) < fe.half + 2 && -((x - fo.x) * tE[0] + (z - fo.z) * tE[1]) > fe.sea - 1.2;
      };
      // the spur stands behind that surf: its face toward the car a ledge's width behind the recess, its middle half its own length
      // behind that; across, (14b) its seaward foot (rim, run and buttress, before its ledges and joints) stands two ring radii
      // left of the exit's axis: a rule of the ground, with no eye's place in it
      const sFace = (fo.x - pE[0]) * tE[0] + (fo.z - pE[1]) * tE[1] - fe.sea + 1.2 + 2, sFoot = 2 * RING_R;
      const sAt = off(sFace + BLUFF.sA, sFoot + BLUFF.sRun + BLUFF.sRib + BLUFF.sB);
      // (round 16) every rock's upper skin under a place within reach of a point (the ball's and the rocks' on and round it), or -99
      const groundNear = (cx, cz, rad) => {
        const G = [];
        for (const g of rockParts) { const p = g.attributes.position.array;
          for (let q = 0; q < p.length; q += 9) if (Math.max(p[q], p[q + 3], p[q + 6]) > cx - rad && Math.min(p[q], p[q + 3], p[q + 6]) < cx + rad && Math.max(p[q + 2], p[q + 5], p[q + 8]) > cz - rad && Math.min(p[q + 2], p[q + 5], p[q + 8]) < cz + rad) for (let e = 0; e < 9; e++) G.push(p[q + e]); }
        return (x, z) => {
          let best = -99;
          for (let q = 0; q < G.length; q += 9) {
            const ax = G[q], az = G[q + 2], bx = G[q + 3], bz = G[q + 5], cx2 = G[q + 6], cz2 = G[q + 8], d = (bz - cz2) * (ax - cx2) + (cx2 - bx) * (az - cz2);
            if (Math.abs(d) < 1e-9) continue;
            const u = ((bz - cz2) * (x - cx2) + (cx2 - bx) * (z - cz2)) / d, v = ((cz2 - az) * (x - cx2) + (ax - cx2) * (z - cz2)) / d;
            if (u < 0 || v < 0 || u + v > 1) continue;
            const y = u * G[q + 1] + v * G[q + 4] + (1 - u - v) * G[q + 7]; if (y > best) best = y;
          }
          return best;
        };
      };
      // (round 16) where the stair's bay is looked for from: the bearing, in the crag's own frame, of the surf at its foot
      const bayFrom = (Math.atan2((fo.x - fortAt[0]) * eZf[0] + (fo.z - fortAt[1]) * eZf[1], (fo.x - fortAt[0]) * eXf[0] + (fo.z - fortAt[1]) * eXf[1]) + TAU) % TAU;
      const built = await buildBluff({ n3, rng: own('mn-bluff'), c: fortAt, eX: eXf, eZ: eZf, tip: [((lhAt[0] - fortAt[0]) * eXf[0] + (lhAt[1] - fortAt[1]) * eXf[1]), ((lhAt[0] - fortAt[0]) * eZf[0] + (lhAt[1] - fortAt[1]) * eZf[1])],
        shoulder: { c: sAt, eX: tE, eZ: [-nE[0], -nE[1]] }, ballAt, barred, pause, rockGeometry, makeRng: ctx.core.makeRng, road: [-tE[0], -tE[1]], bayFrom, groundNear });
      // (round 16) the stair's lanterns and the postern's join the fortress's six in the rock's light
      stair = built.stair;
      if (stair) { postZ = Math.max(-3.6, Math.min(3.6, stair.headZ / FORT_K)); for (const p of stair.lamps) stairLamps.push(p); stairLamps.push(fortW(-15.25, 2.7, postZ)); }
      stairLamps.forEach((p, i) => bluffU.uBLant.value[fortLamps.length + i].set(p[0], p[1], p[2], -BLUFF.stairHalf2));
      const bm = makeBluffMaterial(bluffU);
      bluffNear = new THREE.Mesh(built.near.geo, bm); bluffFar = new THREE.Mesh(built.far.geo, bm); bluffNear.name = 'mn-bluff'; bluffFar.name = 'mn-bluff-far';
      bluffNear.receiveShadow = bluffFar.receiveShadow = shadows; bluffNear.visible = false; scene.add(bluffNear, bluffFar);
      bluffU.uBSurf.value.set(0.45, 0, fe.top, fe.half); bluffU.uBFan.value.set(fo.x, fo.z, -nE[0], -nE[1]); bluffU.uBPhase.value = built.washAt;
      bluffNear.userData = { liveNear, rimHeld: built.rimHeld, laid: built.near.laid, tris: [built.near.tris, built.far.tris], surf: [fans[iFoot].scale, fe.top, fe.sea, fe.half], layout: built.near.layout,
        stair: stair ? { bay: stair.bay, flights: stair.flights.length, lamps: stairLamps.length, foot: stair.foot } : null };
    }
    await pause();
    { // the fortress: battered ashlar curtain walls, four corner bastions with sentry boxes, merlons, a keep with lit slits
      // (round 14: live's builder, plan and scale 1.2, lifted with the top; its walls in panels and washed by its lanterns)
      const B = new S.Builder(4096), honey = lin('#c9a468'), glowK = 0.25 + look.night * 1.6;
      B.tr(fortAt[0], FORT_Y, fortAt[1], PI - thE + 0.22, FORT_K);
      B.surf(SURF.MASONRY, 0, 2.4).col(honey, 0.58, 1.02); panelFrustum(B, 0, 0, 31, 21, 24, 15, -2.5, 8.2, 10, 7, 3, mul3(honey, 0.7));
      B.col(mul3(honey, 0.86), 0.9, 1); B.box(-12.1, 8.2, -7.55, 12.1, 8.75, -7.05, { m: 1 }); B.box(-12.1, 8.2, 7.05, 12.1, 8.75, 7.55, { m: 1 });
      B.box(-12.1, 8.2, -7.05, -11.6, 8.75, 7.05, { m: 1 }); B.box(11.6, 8.2, -7.05, 12.1, 8.75, 7.05, { m: 1 });
      for (let i = -7; i <= 7; i++) for (const z of [-7.3, 7.3]) B.cbox(i * 1.55, 8.75, z, 0.85, 0.7, 0.5);
      for (let i = -4; i <= 4; i++) for (const x of [-11.85, 11.85]) B.cbox(x, 8.75, i * 1.5, 0.5, 0.7, 0.85);
      for (const [x, z] of [[-14.5, -9.5], [14.5, -9.5], [-14.5, 9.5], [14.5, 9.5]]) {
        B.surf(SURF.MASONRY, 0, 2.4).col(mul3(honey, 0.94), 0.55, 1.02); panelFrustum(B, x, z, 9.2, 9.2, 5.6, 5.6, -3, 9.5, 2, 2, 3, mul3(honey, 0.66));
        B.col(mul3(honey, 0.88), 0.9, 1); for (const [dx, dz] of [[-2.3, 0], [2.3, 0], [0, -2.3], [0, 2.3], [-2.3, -2.3], [2.3, 2.3], [-2.3, 2.3], [2.3, -2.3]]) B.cbox(x + dx, 9.5, z + dz, 1.0, 0.75, 1.0);
        const gx = x + Math.sign(x) * 2.5, gz = z + Math.sign(z) * 2.5;                                             // the sentry box on the outer corner
        B.surf(SURF.PLAIN).col(mul3(honey, 1.02), 0.8, 1); B.cyl(gx, 8.3, gz, 0.55, 0.95, 1.2, 8); B.cyl(gx, 9.5, gz, 0.95, 0.95, 2.1, 8); B.cyl(gx, 11.6, gz, 1.1, 0.05, 1.25, 8);
        B.col([0.02, 0.02, 0.03]); B.cbox(gx + Math.sign(x) * 0.9, 10.2, gz, 0.2, 0.8, 0.34); B.cbox(gx, 10.2, gz + Math.sign(z) * 0.9, 0.34, 0.8, 0.2);
        B.surf(SURF.GLOW, 0, glowK * 1.4).col(lin('#ffb060')); B.cbox(gx + Math.sign(x) * 0.95, 10.05, gz + Math.sign(z) * 0.95, 0.34, 0.5, 0.34);      // (round 14) its lantern
      }
      B.surf(SURF.MASONRY, 0, 2.4).col(mul3(honey, 0.9), 0.7, 1); B.frustum(-2, 0, 11.5, 8, 10.6, 7.2, 8.2, 12.2, { m: 1, capColor: mul3(honey, 0.6) });
      B.frustum(-4.5, 0, 4.4, 4.4, 3.8, 3.8, 12.2, 15.6, { m: 1, capColor: mul3(honey, 0.6) });
      for (let i = -3; i <= 3; i++) for (const z of [-3.75, 3.75]) B.cbox(-2 + i * 1.6, 12.2, z, 0.8, 0.6, 0.4);
      B.surf(SURF.GLOW, 0, glowK).col(lin('#ffc27a'));
      for (const z of [-3.82, 3.82]) for (const x of [-5, -2, 1]) B.cbox(x, 9.6, z, 0.5, 1.3, 0.1);
      for (const x of [-7.42, 3.42]) B.cbox(x, 9.6, 0, 0.1, 1.3, 0.5);
      for (const z of [-10.2, 10.2]) { B.surf(SURF.PLAIN).col([0.02, 0.018, 0.02]); B.cbox(0, -2.4, z + Math.sign(z) * 0.32, 3.0, 4.6, 0.3); B.surf(SURF.GLOW, 0, glowK * 1.4).col(lin('#ffb060')); B.cbox(0, 2.5, z + Math.sign(z) * 0.5, 0.4, 0.5, 0.3); }
      B.surf(SURF.PLAIN).col(lin('#2c3430')); B.cyl(-4.5, 15.6, 0, 0.08, 0.04, 6.5, 5);
      if (stair) {      // (round 16) the postern the stair comes up to, in the short end toward the road: a dark door under a stone hood, a lantern over it
        B.surf(SURF.PLAIN).col([0.02, 0.018, 0.02]); B.cbox(-14.55, -2.4, postZ, 0.3, 4.3, 1.5);
        B.surf(SURF.MASONRY, 0, 2.4).col(mul3(honey, 0.8), 0.9, 1); B.cbox(-14.45, 1.9, postZ, 0.8, 0.32, 2.0, { m: 1 });
        B.surf(SURF.GLOW, 0, glowK * 1.4).col(lin('#ffb060')); B.cbox(-14.95, 2.45, postZ, 0.3, 0.5, 0.36);
      }
      B.pop();
      if (stair) {      // (round 16) THE STAIR's masonry, in the fortress's own mesh: under each flight a wall from its ledge up to
        // the treads, a parapet on it, the treads behind; a pier with a lantern at the head, at every turn and at the foot
        // (round 17: its walls, parapets and piers of the rock's own grey, a tone darker than the face; the copings and the treads a
        // little lighter; no honey on it: the fortress is the one golden thing on the bluff)
        const stone = [BLUFF_ROCK * 0.78, BLUFF_ROCK * 0.78, BLUFF_ROCK * 0.82], cope = mul3(stone, 1.9), step = mul3(stone, 1.6), UP = [0, 1, 0];
        const q4 = (a, b, c, d, out, u0, u1, k0, k1) => {      // a, b below and d, c over them; turned to face `out`; its courses level (v is the height)
          let nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
          const l = Math.hypot(nx, ny, nz) || 1, fl = nx * out[0] + ny * out[1] + nz * out[2] < 0 ? -1 : 1; nx *= fl / l; ny *= fl / l; nz *= fl / l;
          const i0 = B.v(a[0], a[1], a[2], nx, ny, nz, k0[0], k0[1], k0[2], u0, a[1]), i1 = B.v(b[0], b[1], b[2], nx, ny, nz, k0[0], k0[1], k0[2], u1, b[1]);
          const i2 = B.v(c[0], c[1], c[2], nx, ny, nz, k1[0], k1[1], k1[2], u1, c[1]), i3 = B.v(d[0], d[1], d[2], nx, ny, nz, k1[0], k1[1], k1[2], u0, d[1]);
          if (fl > 0) B.quad4(i0, i1, i2, i3); else B.quad4(i0, i3, i2, i1);
        };
        const PH = BLUFF.parapet, PT = BLUFF.parapetT, at = (st, y, back = 0) => [st.xo - st.wx * back, y, st.zo - st.wz * back];
        for (const run of stair.flights) {
          let u = 0;
          for (let j = 0; j + 1 < run.length; j++) {
            const A = run[j], C = run[j + 1], out = [A.wx + C.wx, 0, A.wz + C.wz], len = Math.hypot(C.xo - A.xo, C.zo - A.zo), hA = A.y - A.yb, hC = C.y - C.yb, rows = Math.max(1, Math.ceil(Math.max(hA, hC) / 3.2));
            B.surf(SURF.MASONRY, 0, 2.4);
            for (let r = 0; r < rows; r++) { const t0 = r / rows, t1 = (r + 1) / rows; q4(at(A, A.yb + hA * t0), at(C, C.yb + hC * t0), at(C, C.yb + hC * t1), at(A, A.yb + hA * t1), out, u, u + len, mul3(stone, mix(0.8, 1, t0)), mul3(stone, mix(0.8, 1, t1))); }
            q4(at(A, A.y), at(C, C.y), at(C, C.y + PH), at(A, A.y + PH), out, u, u + len, stone, stone);
            B.surf(SURF.PLAIN);
            q4(at(A, A.y + PH), at(C, C.y + PH), at(C, C.y + PH, PT), at(A, A.y + PH, PT), UP, u, u + len, cope, cope);
            q4(at(A, A.y, PT), at(C, C.y, PT), [C.xi, C.y, C.zi], [A.xi, A.y, A.zi], UP, u, u + len, step, step);
            u += len;
          }
          // its upper end, where no flight stands beyond it: the wall's end face
          const E = run[0], F = run[1], away = [E.xo - F.xo, 0, E.zo - F.zo];
          B.surf(SURF.MASONRY, 0, 2.4); q4(at(E, E.yb), [E.xi, E.yb, E.zi], [E.xi, E.y + PH, E.zi], at(E, E.y + PH), away, 0, Math.hypot(E.xo - E.xi, E.zo - E.zi), mul3(stone, 0.8), stone);
        }
        for (const st of stair.posts) {      // the piers: 0.8 m square on the wall's line, 2 m over the treads; a lantern on each
          const tx = -st.wz, tz = st.wx, cx = st.xo - st.wx * 0.2, cz = st.zo - st.wz * 0.2, y0 = st.y - 0.2, y1 = st.y + 2.0, P = (r, t, y) => [cx + st.wx * r + tx * t, y, cz + st.wz * r + tz * t];
          B.surf(SURF.MASONRY, 0, 2.4);
          q4(P(0.4, -0.4, y0), P(0.4, 0.4, y0), P(0.4, 0.4, y1), P(0.4, -0.4, y1), [st.wx, 0, st.wz], 0, 0.8, mul3(stone, 0.9), stone);
          q4(P(-0.4, -0.4, y0), P(-0.4, 0.4, y0), P(-0.4, 0.4, y1), P(-0.4, -0.4, y1), [-st.wx, 0, -st.wz], 0, 0.8, mul3(stone, 0.9), stone);
          q4(P(-0.4, 0.4, y0), P(0.4, 0.4, y0), P(0.4, 0.4, y1), P(-0.4, 0.4, y1), [tx, 0, tz], 0, 0.8, mul3(stone, 0.9), stone);
          q4(P(-0.4, -0.4, y0), P(0.4, -0.4, y0), P(0.4, -0.4, y1), P(-0.4, -0.4, y1), [-tx, 0, -tz], 0, 0.8, mul3(stone, 0.9), stone);
          B.surf(SURF.PLAIN); q4(P(-0.4, -0.4, y1), P(0.4, -0.4, y1), P(0.4, 0.4, y1), P(-0.4, 0.4, y1), UP, 0, 0.8, cope, cope);
          B.surf(SURF.GLOW, 0, glowK * 1.4).col(lin('#ffb060')); B.cbox(cx + st.wx * 0.2, y1, cz + st.wz * 0.2, 0.4, 0.5, 0.4, { bottom: true });
        }
      }
      lanternWash(B, 0, fortLamps, washK, mats.uniforms.uFloodDir.value, stairLamps, BLUFF.stairHalf2, BLUFF.stairGlow);
      const m = new THREE.Mesh(B.toGeometry(), mats.facades); m.castShadow = m.receiveShadow = shadows; m.name = 'mn-fortress'; scene.add(m);
    }
    await pause();
    const fortGlows = lampOn ? fx.makeGlows({ rng: own('mn-fortlamps'), positions: fortLamps.concat(stairLamps), color: '#ffbe6e', size: 2.2, intensity: 1.2 + look.lamp * 1.6, time: T, flicker: 0.12 }) : null;
    if (fortGlows) scene.add(fortGlows.object);
    const lighthouse = S.makeBuilding({ rng: rng.fork('light'), style: 'lighthouse', height: 27, width: 6.4, cottage: false, beamSpeed: 0.785, beamLength: 150, mats, palette: { accent: '#c9a468', wall: '#d6c7a4' }, position: [lhAt[0], BLUFF.top - 0.3, lhAt[1]] });
    scene.add(lighthouse.object);
    await pause();
    // (round 14, T3) the rare fan: 'the last climbs the whole bluff and buries the lighthouse to its lamp': its highest water stands 2 m
    // under the lamp (the built beam's own height), by its own sheet; on an hour whose fans are smaller, smaller by that hour's measure
    let lampY = BLUFF.top; lighthouse.object.traverse((o) => { if (o.isMesh && o.material === mats.beam) lampY = lighthouse.object.position.y + o.position.y; });
    if (rare) fans[iBeyond].scale = fanResize(fans[iBeyond].h, fanExtent(fans[iBeyond].h).scaleForTop(lampY - 2) * Math.min(1, look.fanK));
    // (round 14, T3) the water on the bluff's road face is read from the surf at its foot: that fan's own handle says when it bursts,
    // when it stands at its height and when it has fallen
    const footH = fans[iFoot].h, footApex = footH.tauAt(footH.timeline.apex), footLift = fanLiftCue(footH, 0), footDown = fanDrained(footH);
    { // a plain stone tower: the kit's banded shaft is sleeved in the fortress's honey masonry (its gallery, lantern and beam are kept)
      const B = new S.Builder(512), honey = lin('#c9a468'), r0 = 3.2, r1 = r0 * 0.56, bH = 1.8, H = 27 * 0.76 - bH, rAt = (t) => mix(r0, r1, t) + 0.07;
      B.tr(lhAt[0], BLUFF.top - 0.3, lhAt[1], 0);
      B.surf(SURF.MASONRY, 0, 1.6).col(mul3(honey, 0.92), 0.6, 1.04);
      B.lathe(0, bH, 0, [[rAt(0), 0], [rAt(0.5), H * 0.5], [rAt(1 - 0.95 / H), H - 0.95]], 14, { smooth: true, m: 1 });
      B.col(mul3(honey, 0.7), 1, 1); B.lathe(0, bH, 0, [[rAt(0) + 0.14, 0], [rAt(0) + 0.14, 0.35], [rAt(0.02), 0.5]], 14, { m: 1 });      // a plinth course
      B.surf(SURF.GLOW, 0, 0.25 + look.night * 1.6).col(lin('#ffc27a'));
      for (let i = 0; i < 4; i++) { const t = 0.16 + i * 0.2, r = rAt(t) + 0.02, a = i * PI / 2, cx = Math.cos(a), sz = Math.sin(a); B.cbox(cx * r, bH + H * t, sz * r, 0.14 + 0.36 * Math.abs(sz), 1.25, 0.14 + 0.36 * Math.abs(cx)); }
      B.pop();
      lanternWash(B, 0, fortLamps, washK, mats.uniforms.uFloodDir.value);
      const m = new THREE.Mesh(B.toGeometry(), mats.facades); m.castShadow = m.receiveShadow = shadows; m.name = 'mn-lightsleeve'; scene.add(m);
    }
    await pause();
    { // far shores of the inner bay: three ridges of town and hill dissolving into the weather
      const P = [], C = [], I = [], rr = rng.fork('ridge');
      for (const [l, h, col] of [[250, 16, '#3f4a55'], [400, 44, '#37506a'], [590, 80, '#2c4468']]) {
        const o = P.length / 3, c = lin(col), sd = rr() * 50;
        for (let s = -160, i = 0; s <= 736; s += 16, i++) {
          const p = line.at(s, l), y = h * (0.3 + 0.7 * sat(0.5 + 0.9 * n3.fbm2(s * 0.006 + sd, l * 0.01, 3))) * sm(-170, -60, s) * (1 - sm(660, 740, s));
          P.push(p[0], -5, p[1], p[0], y, p[1]); C.push(c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, c[0], c[1], c[2]);
          if (s > -160) { const a = o + i * 2; I.push(a - 2, a, a - 1, a - 1, a, a + 1); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: new THREE.Color().copy(U.uAmb.value).multiplyScalar(2.2).addScalar(0.15) })); scene.add(m);
    }
    const ship = new THREE.Mesh(mergeGeometries([gBox(15, 9, 105, 0, 1.5, 0, [0.09, 0.03, 0.03], 3), gBox(15.2, 2.2, 105.2, 0, 6.6, 0, [0.035, 0.035, 0.04], 3), gBox(13, 11, 15, 0, 13, -38, [0.7, 0.69, 0.64], 3),
      gBox(4, 7, 5, 0, 22, -40, [0.75, 0.3, 0.1], 3), gBox(0.6, 16, 0.6, 0, 15, 30, [0.25, 0.2, 0.15], 3), gBox(0.6, 13, 0.6, 0, 13.5, 2, [0.25, 0.2, 0.15], 3),
      ...(lampOn ? [gBox(13.1, 0.8, 0.3, 0, 16.4, -30.5, [0.5, 0.42, 0.26], 4), gBox(13.1, 0.7, 0.3, 0, 13.2, -30.5, [0.4, 0.33, 0.2], 4), gBox(0.3, 0.8, 13, 6.5, 16.4, -38, [0.5, 0.42, 0.26], 4), gBox(0.3, 0.8, 13, -6.5, 16.4, -38, [0.5, 0.42, 0.26], 4),
        gBox(0.3, 0.5, 60, 7.55, 6.2, 10, [0.16, 0.13, 0.08], 4), gBox(0.3, 0.5, 60, -7.55, 6.2, 10, [0.16, 0.13, 0.08], 4)] : [])], false), glossM);
    ship.position.set(SHIP[0], -4, SHIP[1]); ship.rotation.y = SHIP[2]; scene.add(ship);
    const veilQ = [];
    if (lookName !== 'clear') for (let i = 0; i < 5; i++) {
      const a = (188 + i * 24 + rng.range(-6, 6)) * PI / 180, r = rng.range(760, 980), cx = -280 + Math.cos(a) * r, cz = -120 + Math.sin(a) * r, w = rng.range(170, 300), tx = -Math.sin(a) * w, tz = Math.cos(a) * w, top = rng.range(130, 190);
      veilQ.push([[cx - tx, -4, cz - tz], [cx + tx, -4, cz + tz], [cx + tx + 30, top, cz + tz], [cx - tx + 30, top, cz - tz]]);
    }
    const veils = veilQ.length ? makeVeils(veilQ, look.cloudShade) : null; if (veils) scene.add(veils.mesh);
    await ctx.yield?.();

    // ---- the flight ----
    const heroTrig = ST.hero - heroD, heroFx = hero.object.children.filter((o) => o.material && o.material.isShaderMaterial);
    const crestW = hero.anchors.crest.clone(); hero.object.updateMatrixWorld(true); crestW.applyMatrix4(hero.object.matrixWorld);
    const uHero = uOfS(ST.hero);
    // glances: the view leaves the bonnet for the balconied corner house while the car turns, for the wall and the sea as each
    // keyed fan goes up, and comes back to the road between them (the car keeps its heading: the bonnet slides aside)
    const pois = [
      { at: [0, 10, 2], from: 0.0, to: 0.1, weight: 0.3 },
      // (round 15) the corner house is looked at across its arcade and first balconies, not up its wall: the glance is lower and
      // weaker, and the camera leans less in the turn (bank, below), so the bay opens level as the car comes round
      { at: [-10, 8, 31], from: 0.085, to: 0.14, weight: 0.45 },
      { at: line.v3(214, -3, 10), from: uOfS(147), to: uOfS(192), weight: 0.7 },
      { at: line.v3(266, -4, 11), from: uOfS(204), to: uOfS(244), weight: 0.6 },
      { at: crestW, from: uOfS(heroTrig - 6), to: uHero + 0.012, weight: 0.4 },
      { at: line.v3(398, -3, 12), from: uOfS(338), to: uOfS(372), weight: 0.6 },
      { at: line.v3(426, -3, 11), from: uOfS(374), to: uOfS(398), weight: 0.35 },
      // from here on the gaze favours the portal on the point: it is in the open for the whole of the last third
      // (round 15) and out to the white tower that climbs off the shelf's edge as the last of the bay opens
      { at: line.v3(530, -8, 9), from: uOfS(462), to: uOfS(508), weight: 0.55 },
      { at: [pE[0], 5, pE[1]], from: uOfS(424), to: 0.9, weight: 0.3 },
    ];
    const camP = new THREE.Vector3(), camS3 = new THREE.Vector3(), ATAN_CREST = Math.atan(0.2795);     // the ornament's back, the highest thing on the bonnet
    const camF = new THREE.Vector3(), tanV = new THREE.Vector3(), tanB = new THREE.Vector3(), p2 = [0, 0], slotI = [-1, -1, -1], slotD = [0, 0, 0];
    const baseSoak = look.rain ? 0.3 : 0, slab = UR.uSlab.value, sh = hero.uniforms.uShadow.value;
    let soakPulse = 0;
    function update(dt, time, camera, u) {
      T.value = time;
      const sc = stationAt(u || 0), cp = camP.setFromMatrixPosition(camera.matrixWorld);
      sky.update(dt, time, camera); rig.update(dt, time, camera); ocean.update(dt, time, camera); shelf.update(dt, time, camera); mats.update(dt, time);
      wind.update(time); palms.update(dt, time, camera); pots.update(dt, time, camera); for (let i = 0; i < scatters.length; i++) scatters[i].update(dt, time, camera); fauna.update(dt, time, camera, u);
      air.update(dt, time, camera); leaves.update(dt, time, camera); if (rain) rain.update(dt, time, camera); if (glows) glows.update(dt, time, camera); mist.update(dt, time, camera);
      lighthouse.update(dt, time); if (veils) veils.uniforms.uTime.value = time;
      if (moon) { moon.position.copy(cp).addScaledVector(moonDir, 3700); moon.lookAt(cp); }

      // the hero: its whole life is a function of where the car is
      const tauH = (sc - heroTrig) / speed, fxOn = tauH > -0.2 && tauH < 8.6;
      hero.setProgress(hero.uAt(tauH)); hero.update(dt, time, camera);
      for (let i = 0; i < heroFx.length; i++) heroFx[i].visible = fxOn;
      fanU[0].set(ST.hero, tauH, heroScale, 0);
      UR.uFanSh.value.set(ST.hero - sh.x, sh.y, 12 * heroScale, sh.w * (shadows ? 1 : 0.35));
      people.flee.value.set(sm(-1.2, 1.0, tauH), keyedRun(fans[iKeyB].tau), iKeyC < 0 ? 0 : keyedRun(fans[iKeyC].tau));
      // the others: keyed ones follow the car, the rest loop on time; the three nearest lay their foam on the road
      slotI[0] = slotI[1] = slotI[2] = -1; slotD[0] = slotD[1] = slotD[2] = 1e9;
      let near = 0;
      for (let i = 0; i < fans.length; i++) {
        const f = fans[i]; let tau;
        if (f.trig != null) { tau = (sc - f.trig) / speed; f.h.setProgress(f.h.uAt(tau)); } else tau = ((time + f.phase) % 10 + 10) % 10 - 1.5;
        const on = tau > -0.1 && tau < 8.4 && f.s > sc - 70 && f.s < sc + 520;
        f.h.object.visible = on; f.tau = tau;
        if (!on) continue;
        f.h.update(dt, time, camera);
        if (!f.foam) continue;
        if (tau > 1.5 && tau < 6.5 && Math.abs(f.s - sc) < 26 * f.scale) near = Math.max(near, f.scale);
        let d = Math.abs(f.s - sc - 40), k = i;
        for (let j = 0; j < 3; j++) if (d < slotD[j]) { const td = slotD[j], tk = slotI[j]; slotD[j] = d; slotI[j] = k; d = td; k = tk; }
      }
      for (let j = 0; j < 3; j++) { const k = slotI[j]; if (k < 0) fanU[j + 1].set(-999, -5, 1, 0); else fanU[j + 1].set(fans[k].s, fans[k].tau, fans[k].scale, 0); }
      // (round 11) the tongue in the street mouth is drawn for a street fan exactly while that fan itself is
      tongueOn.value.set(fStreet[0].h.object.visible ? 1 : 0, fStreet[1].h.object.visible ? 1 : 0); tongue.visible = fStreet[0].h.object.visible || fStreet[1].h.object.visible;
      fanU[4].set(2, fans[iSurf].tau, fans[iSurf].scale, 1); fanU[5].set(13, fans[iBrk].tau, fans[iBrk].scale, 1);        // the breakers' water on the apron (lateral centre, age, size)
      // (round 14) the bluff: its near form within BLUFF.lod heights of the eye, its far form beyond. The water on its road face, by the
      // age of the surf at its foot since that last stood at its height (the fan's own clock, wrapped by its own life): a film over
      // the wetted face while the surge stands and falls, runnels from then on, thinning until the next surge climbs
      { const close = Math.hypot(cp.x - fortAt[0], cp.z - fortAt[1]) < BLUFF.lod * (BLUFF.top - BLUFF.sea); bluffNear.visible = close; bluffFar.visible = !close;
        const age = ((fans[iFoot].tau - footApex) % footH.life + footH.life) % footH.life, rise = sm(footH.life - (footApex - footLift) + 0.3, footH.life, age);
        bluffU.uBSurf.value.x = Math.max(rise, mix(1, 0.4, sm(0, footDown - footApex, age))); bluffU.uBSurf.value.y = Math.max(rise, 1 - sm(1.2, 4.2, age));
        if (fortGlows) fortGlows.update(dt, time, camera); }

      // ---- round 12: what rides on the fans ----
      // RIDING. Each line below that learns what a fan is doing asks that fan: a.tau() is the tau that live's lines above have just
      // given it (f.tau; the hero's is tauH), and the fan's own handle says what that means: fanLiftCue is h.tauAt(h.timeline.erupt)
      // less a lead, fanDrained is h.tauAt(h.timeline.drained). No station, no u, no eye; `time` only beats wings and sways birds.
      heroRide.tau = tauH;
      if (gullStand) {
        const su = gullStand.uniforms, iA = gullStand.geometry.attributes.iA, iB = gullStand.geometry.attributes.iB; let dirty = false;
        su.uTime.value = su.uQ.value = su.uPhase.value = time;
        for (let k = 0; k < gullGroups.length; k++) {
          const g = gullGroups[k];
          if (g.fly) {
            // RIDING (a group in a fan's reach): A, seconds since the first of its fans was GULL_LEAD short of its burst; B, seconds
            // until the last of them has drained and the birds are down again. In the air between the two.
            let A = -1e9, B = -1e9;
            for (let j = 0; j < g.fans.length; j++) { const a = g.fans[j], t = a.tau(); A = Math.max(A, t - fanLiftCue(a.h, GULL_LEAD)); B = Math.max(B, fanDrained(a.h) + GULL_DOWN - t); }
            const air = A > 0 && B > 0;
            if (air !== g.air) { g.air = air; g.fly.object.visible = air; for (let j = 0; j < g.n; j++) iB.setX(g.i0 + j, air ? 0 : g.sc[j]); dirty = true; }
            if (air) {
              const x = A / (A + B), w = sm(0, 0.12, x) * (1 - sm(0.88, 1, x)), fu = g.fly.uniforms, fA = g.fly.geometry.attributes.iA, fB = g.fly.geometry.attributes.iB;
              loopShare(x, share12);
              fu.uTravel.value = g.L * share12[0]; fu.uSpeed.value = g.L * share12[1] / (A + B); fu.uTime.value = fu.uQ.value = fu.uPhase.value = time; fu.uWander.value.set(0.5 * w, 0.35 * w, 0.5 * w, 0.9);
              for (let j = 0; j < g.n; j++) { fA.setXY(j, mix(g.base[j * 3], g.loose[j * 3], w) - g.c1.x, mix(g.base[j * 3 + 1], g.loose[j * 3 + 1], w) - g.c1.y); fB.setW(j, mix(g.base[j * 3 + 2], g.loose[j * 3 + 2], w) - g.c1.z); }
              fA.needsUpdate = fB.needsUpdate = true;
            }
          } else if (g.near) {
            // RIDING (a group out of every fan's reach, the flinch): the first 0.8 s after the nearest fan's own burst instant
            const t = g.near.tau() - fanLiftCue(g.near.h, 0), hop = t > 0 && t < 0.8;
            if (hop || g.hop) { g.hop = hop; for (let j = 0; j < g.n; j++) iA.setY(g.i0 + j, g.y[j] + (hop ? 0.06 * Math.sin(PI * sat((t - g.lag[j]) / 0.4)) : 0)); dirty = true; }
          }
        }
        if (dirty) { iA.needsUpdate = true; iB.needsUpdate = true; }
      }
      if (wallFolk) {
        const iF = wallFolk.mesh.geometry.attributes.iF, aF = wallArms.geometry.attributes.iF; let dirty = false;
        for (let k = 0; k < folkGroups.length; k++) {
          const g = folkGroups[k]; let run = 0, shake = 0, tS = 0;
          for (let j = 0; j < g.fans.length; j++) {
            // RIDING (people at the wall): out by live's own run law for the people at a keyed fan (keyedRun, the function live's
            // flee line calls, here with this group's own fan's tau), back over FOLK_BACK once the fan's own water has drained,
            // then FOLK_SHAKE of shaking off
            const a = g.fans[j], t = a.tau(), t1 = fanDrained(a.h), e = (t - t1 - FOLK_BACK) / FOLK_SHAKE;
            run = Math.max(run, keyedRun(t) * (1 - sm(t1, t1 + FOLK_BACK, t)));
            if (e > 0 && e < 1 && 1 - e > shake) { shake = 1 - e; tS = t; }
          }
          const on = run > 0 || shake > 0;
          if (!on && !g.on) continue;
          g.on = on; dirty = true;
          for (let j = 0; j < g.n; j++) { const i = g.i0 + j, wob = shake * 0.035 * Math.sin(tS * 40 + g.ph[j]);
            iF.setXYZ(i, g.F[j * 2] * run + wob * g.Fn[0], 0, g.F[j * 2 + 1] * run + wob * g.Fn[1]); if (i === g.arm) aF.setXYZ(k, iF.getX(i), 0, iF.getZ(i)); }
        }
        if (dirty) { iF.needsUpdate = true; aF.needsUpdate = true; }
      }

      // the lens: one whiteout when the curtain lands (eased in over 0.22 s), which the wind tears open from the middle into
      // streaks running outward (gone by 1.3 s) and beads that drain off after it; a light steady streaking in the rain
      const tw = tauH - tauHit;
      G.white.value = tw > 0 && tw < 3 ? sm(0, 0.22, tw) : 0;
      G.tear.value = sm(0.7, 1.3, tw);
      G.bead.value = tw > 0 ? sm(0.7, 1.0, tw) * (1 - sm(1.2, 2.8, tw)) : 0;
      soakPulse = Math.max(soakPulse * Math.exp(-dt / 1.2), near * 0.15);
      G.soak.value = Math.min(0.6, baseSoak + Math.max(soakPulse, tw > 0 ? 0.6 * sm(0.6, 0.9, tw) * (1 - sm(1.2, 2.2, tw)) : 0));
      sheetU.value = Math.max(look.rain ? 0.08 : 0, tw > 0 ? sm(0, 0.3, tw) * (1 - sm(1.0, 3.2, tw)) : 0);
      const e = ST.hero - sh.x - 9 * heroScale - sc;                      // the fan's shadow coming up the bonnet
      shadeLine.value.set(Math.min(9, Math.max(0.35, e)), sh.w * (shadows ? 1 : 0.3) * (1 - sm(-14, -22, e)));
      const inSlab = shadows ? sm(slab.x - 1, slab.x + 1, cp.z) * (1 - sm(slab.y - 1, slab.y + 1, cp.z)) : 0.4;
      ownSun.value = mix(inSlab * sunny, sunny, sm(37, 25, cp.z));

      // our car rides the camera; the bonnet lags the gaze a little in bends and shudders on the seams
      camera.getWorldDirection(camF);
      const dist = sat(u || 0) * path.length; path.posAtDist(dist - 1, tanB); path.posAtDist(dist + 2, tanV); tanV.sub(tanB);
      let yaw = Math.atan2(-tanV.x, -tanV.z) - Math.atan2(-camF.x, -camF.z); if (yaw > PI) yaw -= TAU; else if (yaw < -PI) yaw += TAU;
      // the car keeps to the road while the eye glances aside: the bonnet slides toward the edge of the frame instead of following the gaze
      yaw = Math.max(-0.42, Math.min(0.42, yaw * 0.85));
      camera.matrixWorld.decompose(carried.position, carried.quaternion, camS3);
      // pitched about the eye so the ornament's back sits 87% down the frame whatever the picture's shape (round 15: it, the spear
      // and the bonnet's nose as a low hump reach in, enough to be read as the car we ride; at 93% it was a sliver that read as a
      // stray object at the picture's foot), and on a tall, narrow picture (a steep pitch) shrunk about the eye as well
      const aim = Math.atan(0.74 / Math.max(camera.projectionMatrix.elements[5], 1e-3));
      car.rotation.set(ATAN_CREST - aim, yaw, 0, 'YXZ');
      car.scale.setScalar(Math.min(1.15, 1.2 / (2.45 * Math.max(Math.sin(aim), 0.05))));
      // seen through the previous portal (u = 0, another camera) nothing carried is drawn: the portal's plane would cut slices
      // off the bonnet. In the first third of a second after the crossing the bonnet rises into the frame from below
      const arrive = 1 - sm(0, 0.008, u || 0);
      carried.visible = u > 0;
      lens.visible = G.white.value + G.soak.value + G.bead.value > 0.004;
      lower.position.y = -0.9 * arrive;
      lampPh.value = (((sc - 8) / 16) % 1 + 1) % 1;
      car.position.y = Math.sin(time * 31) * 0.0015 + Math.sin(time * 13.7) * 0.002 + G.white.value * (1 - G.tear.value) * Math.sin(time * 47) * 0.006;
      spray.veh[0].set(cp.x, cp.z, Math.atan2(tanV.z, tanV.x), -speed);

      // traffic
      for (let i = 0; i < traffic.length; i++) {
        const v = traffic[i], s = v.sPass + v.r * (sc - v.sPass), on = s > ROAD.from && s < (v.r < 0 ? ROAD.endOn : ROAD.endOur);
        v.on = on; if (v.mesh) v.mesh.visible = on;
        if (!on) { v.veh.set(1e5, 1e5, 0, 0); continue; }
        line.at(s, s > ROAD.close0 ? mix(v.lane, 9, sm(ROAD.close0, ROAD.close1, s) * (v.r < 0 ? 0.3 : 1)) : v.lane, p2);
        const th = line.theta(s), dir = v.r < 0 ? -1 : 1, dx = -Math.cos(th) * dir, dz = -Math.sin(th) * dir;
        v.x = p2[0]; v.z = p2[1];
        if (v.mesh) { v.mesh.position.set(p2[0], Math.abs(Math.sin(time * 6.3 + i * 2.1)) * 0.012, p2[1]); v.mesh.rotation.y = Math.atan2(dx, dz); }
        v.veh.set(p2[0], p2[1], Math.atan2(dz, dx), Math.abs(v.r) * speed);
      }
      if (lampOn) {
        let k = 0; for (let i = 0; i < lampPts.length && k < 5; i++) { const L = lampPts[i]; if (L[3] > sc - 6) lampU[k++].set(L[0], L[1], L[2], 1); }
        // oncoming headlamps streak the wet road too: (round 19) the NEAREST ahead take the places the standards leave free (live took
        // the table's first in range: the same cars wherever no more are in range than there are places), set in the table's order
        let far = 190;
        { let m = 0; for (let i = 0; i < traffic.length; i++) { const v = traffic[i]; if (v.r > 0 || !v.on) continue;
            const a = v.sPass + v.r * (sc - v.sPass) - sc; if (a < 7 || a > 190) continue;
            let b = m++; for (; b > 0 && lampNear[b - 1] > a; b--) lampNear[b] = lampNear[b - 1]; lampNear[b] = a; }      // kept in order, nearest first
          if (m > 8 - k) far = lampNear[8 - k - 1]; }
        for (let i = 0; i < traffic.length && k < 8; i++) {
          const v = traffic[i]; if (v.r > 0 || !v.on) continue;
          const a = v.sPass + v.r * (sc - v.sPass) - sc; if (a < 7 || a > far) continue;      // the same sum as above, so the car the limit was taken from keeps its place
          lampU[k++].set(v.x, 0.8, v.z, 0.75);
        }
        for (; k < 8; k++) lampU[k].set(1e5, 5.5, 1e5, 0);
      }
      ship.position.y = -4.6 + Math.sin(time * 0.55) * 0.9; if (farGlows) farGlows.update(dt, time, camera); ship.rotation.x = Math.sin(time * 0.43) * 0.035; ship.rotation.z = Math.sin(time * 0.61 + 1) * 0.05;
    }
    await pause();
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 5200); path.posAtDist(0, c0.position); path.posAtDist(22, pv); c0.lookAt(pv); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await pause();
    if (ctx.renderer) await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration, ride: 'none',
      title: look.title + (rare ? ': the Rogue Set' : ''),
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 5200, lookAhead: 22, sway: 0.3, bank: 0.14 },
      pois,
      portal: { shape: 'circle', radius: 6.5, color: look.portal, glow: 1.5, revealDistance: 320 },
      post: { exposure: look.exposure, bloom: { strength: 0.32 + look.night * 0.16, radius: 0.6, threshold: 1.0 },
        grade: { saturation: look.grade.saturation, contrast: 1.05, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); for (const f of fans) f.h.dispose?.(); },
    };
  },
};
