// THE CANOPY: hero set piece of "Norther on the Malecon".
//
// One swell detonating against the seawall: a 24 m fan of white water, 40 m wide, that climbs in a
// second, leans inland on the wind, hangs as an arch over the seaward lanes and falls on the road as
// curtains. It is three nested ballistic sheets (opaque, lace-torn, depth-writing), about a thousand
// billows (round shaded puffs that make the young burst a lobed white wall with a cauliflower crest and
// thin to spray as it tears), about 12,000 billboard drops, finger jets, mist and road splashes
// that fly the same drag-and-wind arcs, a mirrored fan laid into the wet road, and its stage: 96 m of
// weathered coursed seawall with scuppers, a repair and a missing coping stone, heaved two-tone
// pavement, three cast-iron lamp standards, crates, rope, tyre fender, ladder, the jagged rock shelf
// and a heaving sea whose swell hump runs in and bursts exactly at the eruption.
//
// LOCAL SPACE  origin = foot of the seawall's landward face at ROAD level, under the fan's centre.
//   +Y up. +Z = landward (the road; "front", where the viewer is). -Z = sea. X runs along the wall.
//   With the sea on the car's right the car travels toward -X. Wall: z -0.9..0, top y 1.02 (low enough to see the sea over).
//   Pavement z 0..5 (y 0.15), kerb to 5.25, road beyond at y 0. Shelf at y -3, sea level y -4.
// SIZE   radius 20 (the fan; the stage runs 48 m each way), height 22-27 by seed. center = (0, 8, 4).
// COST   about 106k triangles, 6 draw calls with everything on (fan 40k, drops 25k, stage 26k,
//        sea 13k, mirror 3k); 4 calls and 93k with road:false, sea:false. No lights, no textures.
//        Build about 200-350 ms in five yielded steps. All motion is in shaders.
// LIGHT  made for a low warm sun from astern-seaward (brief: local (0.68, 0.29, -0.68)) so the car
//        sees the arch back-lit: the underside glows jade-white by transmission, the sunward face
//        is pure white. The custom shaders take sun and sky from the first DirectionalLight and
//        HemisphereLight found in the scene (or opts.sunDir / sunColor / skyColor) and use scene fog.
//
// PROGRESS  hero.setProgress(u), u 0..1, drives the whole event (never wall-clock):
//   tau = -1.5 s + u * 10 s.   hero.timeline (in u): swell 0, erupt 0.15, apex 0.30,
//   overhead 0.35..impact (the arch stands 10 m+ over the lane), impact about 0.6 (water first
//   comes down to car height in the lane within 8 m of the centre), drained 1.
//   hero.impactTauAt(x) = seconds after eruption at which the curtain reaches car height in the
//   lane at local x (the far side edge, x about -20, comes down near 3.9 s: with the car 55 m out
//   at eruption and 19 m/s that is where it drives into the curtain; use it for the whiteout). setProgress(null) (the default) loops the
//   event on time with a 10 s period. hero.life = 10. hero.tauAt(u) gives seconds since eruption.
//   hero.crestAt(u, target) returns the crest position (local) for gaze or shadow work.
//
// opts
//   palette   brief palette [indigo, teal, white, pink, jade, ochre, turquoise] (hex strings)
//   stage     true: seawall, pavement, lamp standards, props and rock shelf (one mesh)
//   road      true: preview wet-asphalt mirror plane at y 0 (260 m). PASS false IN THE WORLD
//   sea       true: preview sea with the hero swell (320 m). Pass false if the world has its own
//   mirror    true: the fan's reflection, drawn as a decal projected onto the plane y 0 along the
//             view ray, so it shows on ANY opaque road at local y 0 and depth-tests against cars
//   scale     1: size factor of the fan alone (the stage stays to scale)
//   wind      landward wind m/s (4.2): how far the crest leans inland
//   sunDir, sunColor, skyColor, skyTop, skyHorizon   lighting overrides (world space, linear)
//
// anchors (local space)
//   flyThrough   ordered points of the seaward lane, z 9, y 1.25, from +60 to -60 along X (car heads
//                -X). Solid things keep 3.75 m+ from it sideways (kerb) and lamps stand at z 1.3 (7.7 m clear);
//                only water crosses it, on purpose.
//   erupt        root of the fan behind the wall;  crest: apex of the arch at mid-hang
//   canopy       point under the middle of the arch at car height (best "under it" viewpoint)
//   trigger      where the car should be when u = 0.15 (55 m short of the site on the lane)
//   viewpoints   approach (from the car, 55 m out), under (looking up), seaward (from over the sea)
//   lamps        feet of the three lamp standards;  scuppers: scupper mouths on the landward face
//   portalSeat   null: the exit portal is not on this piece (it stands on the point, 250 m on)
//   res       [ns, ne] sheet resolution for every layer (default: the full hero resolution per layer)
//   layers    which of the three sheets to build (default [0, 1, 2])
//   particles multiplier on every particle count (1)
//   phase     seconds added to the clock when the event loops on time (2.1)
//   tear      0..1 (0): how early and how hard the sheet tears into streaks and spray (1 for the world's sister fans)
//   transmit  1: strength of the jade back-light through the sheet;  lampGlow: linear colour of lamp light on its foot
//   mist      1: opacity factor of the spindrift and root mist
//   throat    0: by lamplight (1) the hollow under the arch and the foot of the wall go to indigo shade and every grazing edge takes the lamp colour
//   deep      1: how far thick water seen from under goes to deep jade (0.35 on a clear day: the underside stays green-white)
//   day       (none): given a number, the fan is compiled with its daylight block and this is its strength: 1 for the canopy (hanging
//             water seen from beneath, the sun beyond it, glows green-white to aqua by its thickness and is laced with white foam),
//             0 for a fan that shares the program and keeps the plain shading. Leave it out by lamplight
//   billow    [size, plume] ([1, 0]): size factor of the billows, and how far each is drawn out into a plume along the line from
//             the root of the burst (1 by lamplight: a sheaf of radial lobes, not a heap of round puffs)
//   nearFade  [from, to] metres ([9, 24]): by lamplight (throat 1) the billows thin out nearer than this, leaving the veined sheet
//   stageLamp, stageAmb   linear colours: the pools of light under the stage's three lamp standards and a night fill, added
//             to the stage's own material (lamp-lit looks; black by default)
//   twin      another fan's handle: this one reuses its sheet and particle geometry and its burst (res, layers and
//             particles are then the twin's); scale, tear, phase and light stay its own. For far sisters of one size
//   lite      true: skip the lane-impact table (impactTauAt returns Infinity). With res/layers/particles this
//             gives the world its cheap fans along the wall (about 8k triangles, 2 draw calls each)
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const G = 9.8, KD = 1.2, T_PRE = 1.5, LIFE = 10, TE = 2.4;
const DEFAULT_PALETTE = ['#252C5E', '#1D6E72', '#F5F8F4', '#E8929A', '#9AD4B8', '#E3A84B', '#17B3AE'];

// shared GLSL -------------------------------------------------------------------------------
const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * vn(p) + 0.25 * vn(p * 2.03 + 11.) + 0.125 * vn(p * 4.1 + 23.) + 0.0625 * vn(p * 8.2 + 37.); }
// foam lace: thin veins where two noise fields cross their mid level
float veins(vec2 p){ float a = abs(fbm(p) - 0.47), b = abs(fbm(p * 1.9 + 17.3) - 0.47); return min((1. - smoothstep(0.0, 0.075, a)) * 0.8 + (1. - smoothstep(0.0, 0.05, b)) * 0.55, 1.); }
`;
// (round 13) THE SEA WALL'S STANDARDS, as the world's ground builder stands them: one every 16 m at stations 8 + 16 k up to
// 600, 1.3 m landward of the wall's foot, the lantern 5.55 m over the road; none from station 262 to 358, where the hero's
// stage carries its own three (288, 320, 352). wallLamps(s, l, y) is how much of one standard's light reaches a point at
// station s, l metres landward of the wall's foot and y metres over the road: the two nearest of each row, each
// 1 / (1 + 0.2 r2) (r: metres to its lantern; 13e: 0.05 stood, and no water along the wall was ever out of the lamps'
// light, so a body of spray seen close by was pink from foot to crest), and little of it upward past the lantern's iron cap (1 level with the
// lantern and below, 0.15 from 45 degrees above it). A law of the place alone: no eye, no clock, no table.
export const LAMP_GLSL = /* glsl */`
float lamp1(float ds, float q, float dy){ float r2 = ds * ds + q; return (1. - 0.85 * smoothstep(0., 0.7, dy * inversesqrt(r2 + 1e-4))) / (1. + 0.2 * r2); }
float wallLamps(float s, float l, float y){
  float dl = l - 1.3, dy = y - 5.55, q = dl * dl + dy * dy;
  float a = 8. + 16. * floor((s - 8.) / 16.), a1 = a + 16., b = clamp(288. + 32. * floor((s - 288.) / 32.), 288., 320.);
  float oa = (1. - step(262., a) * step(a, 358.)) * step(a, 604.), oa1 = (1. - step(262., a1) * step(a1, 358.)) * step(a1, 604.);
  return oa * lamp1(s - a, q, dy) + oa1 * lamp1(s - a1, q, dy) + lamp1(s - b, q, dy) + lamp1(s - b - 32., q, dy);
}
`;
// the lace: which parts of a sheet are water. s along the wall, e emission order, L layer
const LACE = /* glsl */`
uniform float uTear, uTau, uScale; uniform vec3 uVT;
// the frame the water's patterns are laid in: metres, riding a slow reference drop (thrown up at 16 m/s with the burst, then
// falling and drifting at terminal velocity). Emission order stretches fivefold where the water is fast, so a pattern laid in
// it is ruled lines and long shards near the root; in this frame the cells are round at every age and old water carries them
vec2 waterFrame(vec3 loc, float L){
  float t = max(uTau, 0.), E = (1. - exp(-${KD.toFixed(2)} * t)) / ${KD.toFixed(2)};
  vec3 Pm = loc / uScale - uVT * t - vec3(0., (16. - uVT.y) * E, 0.);
  return vec2(Pm.x, Pm.y + 0.7 * Pm.z) + L * vec2(17.3, 5.1);
}
float gEdge;      // how far inside the sheet's side limits a fragment is (0 at the limit), left by lace() for the caller
float lace(vec3 uv, float age, vec2 pw, out float n1, out float n2){
  float s = uv.x, e = uv.y, L = uv.z;
  vec2 q = pw * 0.9;
  q += 1.6 * vec2(vn(q * 0.33 + 3.), vn(q * 0.33 + 9.));
  n1 = fbm(q); n2 = fbm(q * vec2(2.6, 1.9) + 7.7);
  float streak = vn(vec2(s * 85. + L * 31., e * 2.2 + 1.3));
  float breakup = smoothstep(mix(2.5, 1.5, uTear), mix(5.2, 3.6, uTear), age);
  // no ruled edge anywhere: the side and trailing limits of the sheet wander with the lace's own noise
  // (the side limits come and go in lobes a few metres across, so the end of a sheet is never a ruled rising line)
  float nl = vn(pw * 0.22 + 31.);
  float edgeS = (1. - smoothstep(0.74 - 0.22 * n2 - 0.24 * nl, 1.02 - 0.1 * n2 - 0.12 * nl, abs(s)));
  gEdge = edgeS;
  float lead = smoothstep(0.0, 0.2, e);
  float trail = 1. - smoothstep(mix(0.9, 0.76, step(0.5, uTear)) - 0.3 * n1, 1.03 - 0.12 * n1, e);
  float dens = edgeS * trail * (0.5 + 0.5 * smoothstep(0.0, 0.5, e)) * (0.5 + 0.5 * lead) * (1. - mix(0.55, 0.8, uTear) * breakup);
  // streaks belong to old, falling, torn water: the young sheet has none, and its froth is round grain, not hair
  float torn = smoothstep(1.0, 2.2, age);
  float froth = mix(vn(pw * vec2(5.3, 5.9)), vn(vec2(s * 420. + L * 9., e * 70.)), torn);
  float h = 0.5 * n1 + 0.22 * n2 + (0.14 * torn + 0.5 * breakup) * streak + 0.2 * froth;
  // water just thrown is an unbroken wall for its first second: it tears into lace only as it ages
  // (but its leading rim is left to the lace: a ragged crest under the billows, never the straight edge of the sheet itself)
  float young = 0.6 * (1. - smoothstep(0.6, 2.0, age)) * edgeS * trail * smoothstep(0.0, 0.06, e);
  return dens * 1.08 + 0.03 + young - h - uTear * (0.12 * breakup + 0.05 * (1. - lead));
}
`;
// ballistic flight with drag toward a terminal velocity uVT = (wind.x, -g/k, wind.z)
const SHEET_VERT_HEAD = /* glsl */`
uniform float uTau, uScale; uniform vec3 uVT;
attribute vec3 aV0, aDvs, aDve, aUv; attribute vec4 aT;
varying vec3 vW, vN, vUv, vLoc; varying float vAge, vBorn;
#include <fog_pars_vertex>
vec3 flight(out vec3 nrm){
  float born = uTau - aT.x, age = max(born, 0.), live = step(0., born);
  float ex = exp(-${KD.toFixed(2)} * age), E = (1. - ex) / ${KD.toFixed(2)};
  vec3 lp = position + ((aV0 - uVT) * E + uVT * age) * uScale;
  vec3 vel = (aV0 - uVT) * ex + uVT;
  vec3 dPs = vec3(aT.w, 0., 0.) + aDvs * E - vel * (aT.y * live);
  vec3 dPe = aDve * E - vel * (aT.z * live) + vec3(0., 1e-4, 0.);
  vec3 n = cross(dPs, dPe);
  nrm = n / max(length(n), 1e-6);
  vAge = age; vBorn = born; vUv = aUv; vLoc = lp;
  return lp;
}
`;
const WET = /* glsl */`
float wetMask(vec2 p){ return smoothstep(0.30, 0.62, fbm(p * 0.085 + 3.3) * 0.75 + vn(p * 0.31 + 9.) * 0.3); }
`;
const SHEET_VERT = SHEET_VERT_HEAD + /* glsl */`
void main(){
  vec3 n; vec3 lp = flight(n);
  vec4 wp = modelMatrix * vec4(lp, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-5, 0.));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHEET_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uJade, uTeal, uLampGlow, uIndigo; uniform float uTransmit, uThroat, uDeepK, uRimW; uniform vec3 uLampP;
#ifdef CANOPY_DAY
uniform float uDay;
#endif
varying vec3 vW, vN, vUv, vLoc; varying float vAge, vBorn;
#include <fog_pars_fragment>
${NOISE}${LACE}${LAMP_GLSL}
// cauliflower: round heads with sharp creases between them
float billow(vec2 p){ return 0.65 * abs(2. * vn(p) - 1.) + 0.35 * abs(2. * vn(p * 2.3 + 5.) - 1.); }
void main(){
  if (vBorn < 0.) discard;
  if (vLoc.z > 0.05 && vLoc.y < 0.04) discard;
  if (vLoc.y < -4.4) discard;
  vec2 pw = waterFrame(vLoc, vUv.z);
  float n1, n2; float m = lace(vUv, vAge, pw, n1, n2);
  float dCam = length(cameraPosition - vW);
  // a torn sister seen from close by is lace and spray, never a hanging panel: its sheet thins as the viewer nears it
  m -= step(0.5, uTear) * 0.42 * (1. - smoothstep(12., 38., dCam));
  // and the low body and back plume of every fan open into lace within 18 m of the viewer: never a slab beside the car
  m -= step(0.5, vUv.z) * 0.5 * (1. - smoothstep(5., 18., dCam));
  // (the canopy itself too, once it is old: no hard-edged shard hangs over the viewer)
  m -= (1. - step(0.5, vUv.z)) * (1. - smoothstep(5., 20., dCam)) * max(0.2 * smoothstep(1.5, 3., vAge), 0.3 * smoothstep(0.45, 0.8, vUv.y));
  if (m < 0.) discard;
  // the rim of every hole breaks into grains of spray instead of a knife edge: wider on old water and close to the viewer
  float nearK = 1. - smoothstep(8., 30., dCam);
  float grainH = h21(floor(gl_FragCoord.xy) * 0.37 + floor(vAge * 14.));
  // (and the ends of a sheet thin out into the same grains)
  // (round 13: by lamplight, uRimW > 0, neither the ends nor the rims are cut into grains: they thin by opacity, at the foot of this shader)
  float rimG = 0.11 * max(uTear, 0.6) * (1. + 2.2 * smoothstep(2.0, 4.5, vAge) + 1.6 * nearK);
  if (uRimW <= 0. && gEdge < 0.8 * h21(floor(gl_FragCoord.xy) * 0.53 + 7.3 + floor(vAge * 14.))) discard;
  if (uRimW <= 0. && m < rimG * grainH) discard;
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (dot(N, V) < 0.) N = -N;
  N = normalize(N + V * (0.75 * uTear));
  // billows: the face of the sheet is lumped like cauliflower, round heads and creases (strongest while it is young)
  float youngK = 1. - smoothstep(1.0, 2.4, vAge);
  vec2 bp = pw * vec2(0.3, 0.55);
  float b0 = billow(bp), bx = billow(bp + vec2(0.1, 0.)) - b0, by = billow(bp + vec2(0., 0.1)) - b0;
  vec3 T1 = normalize(cross(N, vec3(1., 0., 0.)) + vec3(0., 1e-4, 2e-4)), T2 = cross(N, T1);
  N = normalize(N - (T2 * bx + T1 * by) * (2.5 + 3.5 * youngK) + vec3(0., 1e-5, 0.));
  // grain: round froth cells in the water frame and a finer break fixed in the air, so no part of a sheet shades like silk
  float fr = vn(pw * vec2(4.3, 5.1));
  N = normalize(N + (vec3(n1, n2, fr) - 0.5) * 0.6 + (vec3(vn(vLoc.xz * 7.), vn(vLoc.xy * 7. + 3.), vn(vLoc.zy * 7. + 9.)) - 0.5) * 0.7 + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSun);
  float front = clamp(ndl * 0.5 + 0.5, 0., 1.);
  float back = clamp(-ndl * 0.85 + 0.15, 0., 1.);
  float root = smoothstep(0.3, 0.95, vUv.y);
  float thin = clamp(1. - m * 3.2, 0., 1.);
  float foam = 0.8 + 0.25 * n1;
  float glass = smoothstep(0.15, 0.85, vUv.y) * (1. - smoothstep(0.35, 1.7, vAge)) * (0.55 + 0.45 * n2);
  glass *= 1. - 0.7 * smoothstep(0.55, 0.75, vn(pw * 0.3 + 3.));
  vec3 alb = mix(vec3(0.93, 0.96, 0.95), uJade * 0.95, glass * 0.6) * foam * (0.9 + 0.2 * fr);
  float hollow = 0.72 + 0.28 * smoothstep(0.25, 0.6, n1);
  float tn = fbm(pw * 0.32 + 7.);
  hollow *= 0.82 + 0.36 * tn;
  vec3 col = alb * (uSunCol * front * front * 1.12 * hollow + uSky * 1.1 * (0.4 + 0.6 * front));
  float dense = clamp(0.1 + 1.25 * tn + 0.3 * root - 0.5 * thin, 0., 1.);
  vec3 deep = mix(uJade * uJade * 1.5, uTeal, 0.4);
  vec3 tcol;
  // seen from under, the sheet is not one tone: thin lace lets the light through, ribs of thick water hold it back as deep jade
  float v1 = veins(pw * 0.26 + 3.1);
  float v2 = veins(pw * 0.85 + 5.);
  float laceT = clamp(v1 * 0.75 + v2 * 0.5, 0., 1.);
  // (the ribs run down the fall: they belong to the hanging and falling water, not to the wall just thrown)
  float rib = smoothstep(0.42, 0.78, fbm(vec2(vUv.x * 17. + vUv.z * 5., vUv.y * 2.3 + 3.))) * (1. - 0.85 * youngK);
  dense = clamp(dense + 0.4 * rib - 0.3 * laceT, 0., 1.);
  tcol = mix(vec3(0.82, 1.0, 0.92), deep, smoothstep(0.42, 0.95, dense) * uDeepK);
  col += tcol * uSunCol * back * (1.6 - 0.9 * dense) * uTransmit * (0.55 + 1.0 * laceT) * (1. - 0.4 * rib);
  col *= (0.86 + 0.24 * laceT - 0.2 * rib) * (1. - 0.22 * rib * (1. - laceT) * back);      // veined foam on the lit side too
  // the thrown wall has weight: the creases between its billows are shaded and its heart is blue-grey under a bright crest
  col *= mix(1., 0.6 + 0.4 * smoothstep(0.0, 0.3, b0), 0.35 + 0.65 * youngK);
  col = mix(col, col * vec3(0.68, 0.77, 0.92), 0.55 * youngK * smoothstep(0.06, 0.4, vUv.y));
  // the hanging sheet is foam cells, bright threads round darker water, and so is any water seen from close by
  col *= mix(1., 0.75 + 0.5 * veins(pw * 2.2 + 9.), max(smoothstep(1.5, 2.2, vAge), 1. - smoothstep(10., 28., dCam)));
  // the crest catches the sun as a bright rim
  float rimF = 1. - abs(dot(normalize(vN + vec3(0., 1e-5, 0.)), V)); rimF = rimF * rimF * rimF;
  col += uSunCol * rimF * 1.5 * (1. - smoothstep(0.08, 0.15, vUv.y));
  // by lamplight the fan has a dark heart: the hollow under the arch and the foot of the wall fall to indigo shade, the
  // plumes above stay pale, and every edge that turns away from the eye takes the lamps' amber
  // (the young wall only: old, falling water is lace and keeps its own light)
  float throat = uThroat * (1. - smoothstep(1.5 * uScale, 13. * uScale, vLoc.y)) * (0.45 + 0.55 * root) * (0.55 + 0.45 * smoothstep(0.35, 0.65, tn)) * (1. - 0.75 * smoothstep(1.8, 3.2, vAge));
  // (seen from far off the heart is shallower: at a distance the fan is a pale tower, its dark heart is for the viewer under it)
  col = mix(col, col * (uIndigo * 2.2 + 0.06), mix(0.8, 0.4, smoothstep(22., 55., dCam)) * throat);
  // (round 13) the standards' light BY PLACE, in the fan's own frame: uLampP = the fan's station, its metres landward of the
  // wall's foot, and 1 where it stands along the wall's line (0 for the breakers past the last standards). The amber rim takes it
  float lampL = uLampP.z * wallLamps(uLampP.x - vLoc.x, uLampP.y + vLoc.z, vLoc.y);
  col += uLampGlow * rimF * 0.5 * uThroat * (0.4 + 0.6 * n2) * lampL;
  // seen from close by under the lamps the wall is not one pale mass: its thick water is slate-indigo and only the lace is bright
  float nearD = uThroat * (1. - smoothstep(40., 110., dCam));
  float body = nearD * smoothstep(0.3, 0.75, dense) * (1. - 0.6 * laceT);
  col = mix(col, col * vec3(0.3, 0.4, 0.75), 0.75 * body) * (1. - 0.18 * nearD);
  // (round 13: in place of one constant amber in three fixed pools) the water takes the lanterns' light where it is: strongest
  // low and by the wall under a standard, less between two, little above the lantern heads; faces turned toward the lanterns
  // (downward above their height, upward below it) take the most of it, and the bright lace more than the dark water
  float lampW = 0.62 + 0.38 * clamp(0.5 - 0.6 * N.y * clamp((vLoc.y - 5.55) / 5., -1., 1.), 0., 1.);
  col += alb * uLampGlow * lampL * lampW * (0.45 + 0.55 * tn) * (0.2 + 1.1 * laceT);      // (13b: the lace takes the lanterns' light, clear dark water little of it)
  col += uSunCol * thin * front * 0.45;
  float sp = max(dot(reflect(-uSun, N), V), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col += uSunCol * sp * 0.9;
  col *= 1. - 0.3 * root * (1. - front) * (1. - back);
#ifdef CANOPY_DAY
  // BY DAY (opts.day; this block is compiled only for sunlit looks, the lamp-lit ones never see it) the water that hangs over the
  // viewer is seen from beneath with the sun beyond it. A low sun grazes that face, so the lit term above (front squared) and the
  // transmitted one (back) both come to little there and its roughened normal flips between them: what was left was skylight on
  // foam and a warm sun through jade, a grey-olive mottle like lichen on rock. Thrown water is a body of light, not a surface:
  // here it glows by its thickness alone, green-white where it is thin (the lip, the rims of the holes), pale aqua in the hang,
  // jade only in the throat by the wall, laced with white foam, and the roughened normal has no say in it
  if (uDay > 0.) {
    vec3 Ng = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(Ng, V) < 0.) Ng = -Ng;
    float beyond = 1. - 0.5 * smoothstep(0.4, 0.95, dot(Ng, uSun));      // a wide wrap: scattering water has no terminator
    // hanging water, any of it looked up at, and all of it from close by (the young wall far off keeps its sunlit face)
    float seen = max(max(smoothstep(0.7, 1.6, vAge), smoothstep(0.1, 0.45, -V.y)), 1. - smoothstep(25., 45., dCam));
    float th = 0.2 + 0.5 * smoothstep(0.25, 0.95, vUv.y) + 0.35 * (1. - smoothstep(2. * uScale, 12. * uScale, vLoc.y)) * smoothstep(0.2, 0.6, vUv.y)
      + 0.3 * (tn - 0.45) + 0.22 * rib - 0.3 * thin;
    th = clamp(th, 0., 1.);
    vec3 sunW = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.59, 0.11))), 0.7);      // water takes the red out of a warm sun: no olive
    vec3 wc = mix(vec3(0.74, 1.0, 0.88), vec3(0.42, 0.93, 0.80), smoothstep(0.1, 0.55, th));
    wc = mix(wc, vec3(0.08, 0.47, 0.40), smoothstep(0.5, 1.05, th));
    // (its grain: froth cells, and on old water the streaks of the fall, so no reach of it is a smooth pale panel)
    vec3 g = wc * (sunW * mix(1.0, 0.55, smoothstep(0.1, 1.0, th)) + uSky * 0.9) * (0.88 + 0.12 * fr + 0.12 * smoothstep(1.0, 2.2, vAge) * vn(vec2(vUv.x * 85. + vUv.z * 31., vUv.y * 2.2 + 1.3)));
    float fl = clamp(0.85 * v2 + 0.6 * v1 + 0.3 * veins(pw * 2.2 + 9.), 0., 1.);
    g = mix(g, vec3(0.95, 1.0, 0.98) * (sunW * 1.08 + uSky * 1.1), fl * (0.5 + 0.3 * th));
    g += sunW * (0.32 * (1. - smoothstep(0.02, 0.16, vUv.y)) + 0.22 * thin);      // the torn lip and the rim of every hole burn white
    col = mix(col, g, uDay * beyond * seen);
  }
#endif
  // (round 13) BY LAMPLIGHT THE SHEET THINS TO NOTHING AT ITS RIM (uRimW > 0; the material is then blended): its opacity is the
  // lace's own margin m, how far inside the water this point of the sheet is by the lace law, so thin water lets the dark through
  // and the young heart stays solid; the band is uRimW plus the width the day's grains break up (wider on old water and close
  // by); inside it the opacity breaks into the froth's own cells (0.23 m, in the water's frame) where the day cuts single grains;
  // the ends thin the same way, and the leading crest thins over the first 0.18 of the emission order (its points were hard);
  // (13b) old falling water is NOT thinned as a whole. By day uRimW is 0: opacity 1, the grains and the hard sunlit edge, as before
  float al = uRimW > 0. ? smoothstep(0., uRimW + rimG, m + 0.3 * (fr - 0.5)) * smoothstep(0., 0.8, gEdge) * smoothstep(-0.02, 0.18, vUv.y) : 1.;
  if (al < 0.02) discard;
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}`;
// the reflection: every vertex is mirrored in the road plane, then slid along the view ray onto
// the plane itself, so it lands where a true mirror image would but lies ON the road.
const MIRROR_VERT = SHEET_VERT_HEAD + /* glsl */`
uniform mat4 uInv; uniform float uRoadY, uTime;
varying vec3 vP;
void main(){
  vec3 n; vec3 lp = flight(n);
  vec4 wp = modelMatrix * vec4(lp, 1.);
  vec3 M = vec3(wp.x, 2. * uRoadY - max(wp.y, uRoadY + 0.3), wp.z), C = cameraPosition;
  float t = (C.y - uRoadY) / max(C.y - M.y, 1e-3);
  vec3 P = C + (M - C) * t;
  P.xz += 0.12 * vec2(sin(P.z * 1.9 + uTime * 2.3), sin(P.x * 1.6 - uTime * 1.9));
  P.y = uRoadY + 0.03;
  vP = (uInv * vec4(P, 1.)).xyz; vW = P; vN = n;
  vec4 mvPosition = viewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
  if (C.y < uRoadY + 0.2) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;
const MIRROR_FRAG = /* glsl */`
uniform vec3 uSunCol, uSky, uJade, uLampGlow, uLampP; uniform float uTime;
varying vec3 vW, vN, vUv, vLoc, vP; varying float vAge, vBorn;
#include <fog_pars_fragment>
${NOISE}${LACE}${WET}${LAMP_GLSL}
void main(){
  if (vBorn < 0. || vLoc.y < 0.4 || vP.z < 5.25) discard;
  float n1, n2; float m = lace(vUv, vAge, waterFrame(vLoc, vUv.z), n1, n2);
  if (m < 0.) discard;
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  float g = 1. - clamp(V.y, 0., 1.);
  float fres = 0.22 + 0.78 * g * g * g;
  float wet = 0.22 + 0.78 * wetMask(vP.xz);
  vec3 col = mix(vec3(0.93, 0.96, 0.95), uJade, 0.3 * smoothstep(0.3, 0.9, vUv.y)) * (0.8 + 0.3 * n1) * (uSunCol * 0.85 + uSky * 1.1 + uLampGlow * (uLampP.z * wallLamps(uLampP.x - vLoc.x, uLampP.y + vLoc.z, vLoc.y)));      // (round 13: the image carries the water's lamplight)
  float rip = (0.5 + 0.5 * vn(vec2(vP.x * 1.4 + uTime * 0.7, vP.z * 0.3 - uTime * 0.5))) * smoothstep(0., 0.3, m);
  gl_FragColor = vec4(col, 0.85 * fres * wet * rip * smoothstep(0.4, 2.5, vLoc.y));
  #include <fog_fragment>
}`;

// velocity field of the burst: out = [p0x,p0y,p0z, vx,vy,vz, te]
const LAYERS = [
  { speed: 1.0, spread: 0.42, lean: 0.10, w0: 13.0, z0: -1.6, ns: 150, ne: 84 },  // the canopy
  { speed: 0.62, spread: 0.5, lean: -0.12, w0: 15.0, z0: -3.0, ns: 84, ne: 44 },   // low body: falls on the pavement
  { speed: 0.9, spread: 0.34, lean: 0.04, w0: 10.0, z0: -2.5, ns: 84, ne: 44 },    // back plume
];
function makeField(noise, V) {
  return function field(s, e, L, out) {
    const ly = LAYERS[L], sd = V.sd + L * 13.7;
    const lob = 0.6 * noise.n2(s * 1.6 * V.lobes + sd, L * 3.1) + 0.32 * noise.n2(s * 4.3 + sd, 7.3 + L);
    const fing = noise.n2(s * 13 + sd, e * 1.4 + L * 5.1);
    const as = Math.abs(s), edge = 1 - Math.pow(as, 2.4);
    const amp = V.v0 * ly.speed * (0.55 + 0.45 * edge) * (1 + 0.25 * lob + 0.07 * fing)
      * (1 - 0.55 * Math.pow(e, 1.3)) * (1 + 0.045 * noise.n2(s * 5 + sd, e * 4));
    const phi = s * ly.spread * V.spread + 0.05 * noise.n2(s * 3 - sd, e * 2);
    const th = ly.lean + V.lean + 0.09 * noise.n2(s * 2.2 + sd * 0.7, 2 + L) + e * 0.1;
    const cp = Math.cos(phi);
    out[0] = s * ly.w0 + 0.5 * noise.n2(s * 4, sd); out[1] = -2.7 + 1.3 * e; out[2] = ly.z0 + 0.35 * noise.n2(s * 3, sd + 9);
    out[3] = amp * Math.sin(phi); out[4] = amp * cp * Math.cos(th); out[5] = amp * cp * Math.sin(th);
    out[6] = TE * e + 0.3 * Math.pow(Math.abs(s - V.s0), 1.3) + 0.07 * noise.n2(s * 6 + sd, 3);
    return out;
  };
}
// closed-form flight (same as the shaders): position after `age` seconds
function fly(f, age, k, wx, wz, sc, out) {
  const a = Math.max(age, 0), ex = Math.exp(-k * a), E = (1 - ex) / k, ty = -G / k;
  out.x = f[0] + ((f[3] - wx) * E + wx * a) * sc;
  out.y = f[1] + ((f[4] - ty) * E + ty * a) * sc;
  out.z = f[2] + ((f[5] - wz) * E + wz * a) * sc;
  return out;
}
async function buildSheet(field, layers, res, pause) {
  let nv = 0, ni = 0;
  const dims = layers.map((L) => { const ns = res ? res[0] : LAYERS[L].ns, ne = res ? res[1] : LAYERS[L].ne; nv += (ns + 1) * (ne + 1); ni += ns * ne * 6; return [ns, ne]; });
  const pos = new Float32Array(nv * 3), v0 = new Float32Array(nv * 3), dvs = new Float32Array(nv * 3), dve = new Float32Array(nv * 3);
  const uv = new Float32Array(nv * 3), tt = new Float32Array(nv * 4), idx = new Uint32Array(ni);
  const a = new Float64Array(7), b = new Float64Array(7), c = new Float64Array(7), D = 0.004;
  let o = 0, io = 0;
  for (let li = 0; li < layers.length; li++) {
    const L = layers[li], [ns, ne] = dims[li], base = o;
    for (let j = 0; j <= ne; j++) for (let i = 0; i <= ns; i++, o++) {
      if (i === 0) await pause();      // hand the page back every row
      const s = (i / ns) * 2 - 1, e = j / ne;
      field(s, e, L, a); field(s + D, e, L, b); field(s, e + D, L, c);
      pos[o * 3] = a[0]; pos[o * 3 + 1] = a[1]; pos[o * 3 + 2] = a[2];
      for (let q = 0; q < 3; q++) { v0[o * 3 + q] = a[3 + q]; dvs[o * 3 + q] = (b[3 + q] - a[3 + q]) / D; dve[o * 3 + q] = (c[3 + q] - a[3 + q]) / D; }
      uv[o * 3] = s; uv[o * 3 + 1] = e; uv[o * 3 + 2] = L;
      tt[o * 4] = a[6]; tt[o * 4 + 1] = (b[6] - a[6]) / D; tt[o * 4 + 2] = (c[6] - a[6]) / D; tt[o * 4 + 3] = (b[0] - a[0]) / D;
    }
    for (let j = 0; j < ne; j++) for (let i = 0; i < ns; i++) {
      const p = base + j * (ns + 1) + i, q = p + ns + 1;
      idx[io++] = p; idx[io++] = p + 1; idx[io++] = q; idx[io++] = p + 1; idx[io++] = q + 1; idx[io++] = q;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aV0', new THREE.BufferAttribute(v0, 3));
  g.setAttribute('aDvs', new THREE.BufferAttribute(dvs, 3));
  g.setAttribute('aDve', new THREE.BufferAttribute(dve, 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(tt, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 8), 60);
  return g;
}

// drops, finger jets, mist, the detonation at the root and splashes where the curtain lands
const PART_VERT = /* glsl */`
uniform float uTau, uScale, uPix, uMist; uniform vec2 uWind, uBil, uNrR; uniform vec3 uLampP;
attribute vec3 aV0, aS; attribute vec4 aP; attribute vec2 aC;
varying vec2 vC, vAx, vLmp; varying float vA, vSoft, vSeed, vBil, vDis, vShade, vNear, vDk, vNr; varying vec3 vW;
#include <fog_pars_vertex>
${LAMP_GLSL}
void main(){
  float born = uTau - aP.x, age = max(born, 0.), k = aP.y, type = aP.w;
  vec3 vT = vec3(uWind.x, -9.8 / k, uWind.y);
  float ex = exp(-k * age), E = (1. - ex) / k;
  vec3 lp = position + ((aV0 - vT) * E + vT * age) * uScale;
  vec3 vel = (aV0 - vT) * ex + vT;
  // (round 13) the standards' light at this particle's own place (see the sheet), and how far above or below the lanterns it flies
  vLmp = vec2(uLampP.z * wallLamps(uLampP.x - lp.x, uLampP.y + lp.z, lp.y), clamp((lp.y - 5.55) / 5., -1., 1.));
  float life = aS.y;
  float fade = step(0., born) * (1. - smoothstep(life * 0.55, life, age)) * smoothstep(0., 0.08, age) * (type > 3.5 ? 1. : aS.z);
  float gy = lp.z > 0.05 ? (lp.z < 5.1 ? 0.15 : 0.) : -4.2;
  fade *= smoothstep(gy - 0.1, gy + 0.25, lp.y);
  float soft = step(0.5, type) * (1. - step(1.5, type)) + step(2.5, type);
  // a billow (type 4) is a round shaded puff of thrown water: the body and the cauliflower crest of the young wall
  float bil = step(3.5, type);
  float sz = aP.z * mix(1., 1. + age * (type > 2.5 ? 1.3 : 0.75), soft);
  sz = mix(sz, aP.z * uScale * 1.25 * (0.6 + 0.4 * smoothstep(0., 0.3, age) + 0.3 * age), bil);
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  // (the billows are larger only from a distance, where they must close into one wall: close by they stay small and open, and the
  // lace of the sheet shows between them)
  vNr = 1. - smoothstep(uNrR.x, uNrR.y, -mvPosition.z);
  sz *= mix(1., mix(uBil.x, 1., vNr), bil);
  vec3 vv = (modelViewMatrix * vec4(vel, 0.)).xyz;
  fade *= mix(mix(smoothstep(3.0, 12.0, -mvPosition.z), smoothstep(6., 30., -mvPosition.z), soft), smoothstep(3., 10., -mvPosition.z), bil);
  fade *= mix(1., uMist, soft * (1. - bil));
  // ordinary drops (type 0) show only once the sheet starts to tear: the young burst is a wall, not a brush
  fade *= mix(1., smoothstep(0.5, 1.4, age), step(-0.5, type) * (1. - step(0.5, type)));
  float boost = max(1., max(-mvPosition.z, 0.1) * uPix / sz); sz *= boost; fade /= boost;
  vNear = 1. - smoothstep(12., 35., -mvPosition.z);
  vDk = 1. - smoothstep(30., 95., -mvPosition.z);
  // a soft puff is drawn in front of the sheet it rides in (pulled about its own radius toward the eye, at the same size on
  // screen): a billboard cut by the sheet shows as a ruled line across the water
  float pull = soft * min(1.2 * sz, 0.5 * max(-mvPosition.z - 1.5, 0.)), pk = 1. - pull / max(-mvPosition.z, 0.1);
  mvPosition.xyz *= pk; sz *= pk;
  float sp = length(vv.xy); vec2 ax = sp > 1e-3 ? vv.xy / sp : vec2(0., 1.);
  // a billow keeps the shape it was thrown with: a plume drawn out along the line from the root of the burst (uBil.y), so the
  // standing wall is a sheaf of radial lobes and streaks of water, never a heap of balls
  vec2 dv = (modelViewMatrix * vec4(lp - position, 0.)).xy; float dl = length(dv);
  float plume = bil * uBil.y * smoothstep(0.5, 3., dl) * smoothstep(0.5, 1., aP.z);      // (the fine fringe stays round: drawn out, it is splinters)
  ax = normalize(mix(ax, dv / max(dl, 1e-3), plume) + vec2(0., 1e-4));
  // a finger jet (type -1) is a file of drops down one trajectory, each stretched to overlap the next: a continuous thread
  float jet = 1. - step(-0.5, type);
  // a thread frays and dies in the air: gone before it can come down on the road as a rod
  // (and it is seen only while it is fast: once it slows at the top of its arc its links drift apart into a ladder of dashes)
  fade *= mix(1., (1. - smoothstep(1.2, 2.0, age)) * smoothstep(0.8, 2.5, lp.y - gy) * smoothstep(5., 11., length(vel)) * smoothstep(8., 22., -mvPosition.z), jet);
  float late = smoothstep(1.6, 2.6, age);
  float stretch = (1. - soft) * mix(min(sp * mix(0.022, 0.05, late), mix(0.6, 0.9, late)) * smoothstep(2., 16., -mvPosition.z), min(sp * 0.05, 1.1), jet);
  // a billow is drawn out along its flight while it is fast (a thrown plume) and rounds off as it slows
  stretch += bil * sz * max(min(sp * 0.028, 0.75), 0.85 * plume);
  // falling drops are drawn as short streaks of water, not balls: narrower across their flight than along it
  float wide = mix(1., mix(0.7, 0.5, late), (1. - soft) * (1. - jet) * smoothstep(2., 16., -mvPosition.z)) * mix(1., mix(0.4, 0.75, smoothstep(6., 30., -mvPosition.z)), jet);
  wide *= 1. - 0.22 * plume;
  mvPosition.xy += aC.x * sz * wide * vec2(ax.y, -ax.x) + aC.y * (sz + stretch) * ax;
  vC = aC; vA = fade; vSoft = soft; vSeed = aS.x; vBil = bil; vAx = ax; vShade = mix(aS.z * mix(0.7, 1., smoothstep(-3., 11., lp.y)), 1., 0.8 * vNear); vDis = smoothstep(life * 0.35, life, age); vW = (modelMatrix * vec4(lp, 1.)).xyz;
  gl_Position = projectionMatrix * mvPosition;
  if (fade < 0.004) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;
const PART_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uJade, uLampGlow; uniform float uThroat, uScale, uVeil;
#ifdef CANOPY_DAY
uniform float uDay;
#endif
varying vec2 vC, vAx, vLmp; varying float vA, vSoft, vSeed, vBil, vDis, vShade, vNear, vDk, vNr; varying vec3 vW;
#include <fog_pars_fragment>
${NOISE}
void main(){
  float r = length(vC);
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  float fs = max(dot(-V, uSun), 0.); fs = fs * fs * fs;
  float a, lampW = 1.; vec3 col;
  if (vBil > 0.5) {
    // a lumped ball of white water: sunlit on one side, blue-grey on the other, creased like cauliflower, a lit rim;
    // as it ages its edge eats inward and holes open, so the wall tears into lace and then into mist
    vec2 p = vC * 1.9 + vSeed * 43.;
    float c1 = vn(p), c2 = vn(p * 2.6 + 7.), c3 = vn(p * 6.1 + 3.);
    float hgt = 0.5 * abs(2. * c1 - 1.) + 0.32 * abs(2. * c2 - 1.) + 0.18 * abs(2. * c3 - 1.);
    float d = r * 1.18 + 0.34 * (0.62 - c1) + 0.2 * (0.6 - c2) + 0.12 * (0.6 - c3);
    float e0 = 0.8 - 0.5 * vDis;
    // (round 13: by lamplight its edge follows the day's law, a band of 0.19, where it was 0.065: with the sheet behind it the hard
    // lobes fused into one pale block. And by lamplight, uVeil 1, a lobe is spray the lanterns shine through: 0.6 opaque at
    // its heart, 0.12 at its rim (13c: 0.28 and 0.056 stood, and a body of spray had too little form), so a body of water is many of them one behind another, with the sheet behind them, and its
    // outline thins. By day and at dawn uVeil is 0)
    a = (1. - smoothstep(e0 - 0.14, e0 + 0.05, d)) * (1. - 0.85 * vDis * smoothstep(0.35, 0.6, c2)) * (1. - smoothstep(0.88, 1., r));
    a *= mix(1., 0.6 * (1. - 0.8 * smoothstep(0.15, 0.85, r)), uVeil);
    // then into grains of spray (and from close by it is clumps of spray from the start, never a smooth ball)
    vec2 gq = mat2(0.8, -0.6, 0.6, 0.8) * vC * (8. + 9. * vNear) + 2.2 * vec2(c1, c2) + vSeed * 91.;
    a *= mix(1., smoothstep(0.3, 0.6, 0.62 * vn(gq) + 0.38 * vn(gq * 2.4 + 5.)), max(smoothstep(0.2, 0.85, vDis), 0.75 * vNear)) * (1. - 0.3 * vNear);
    vec2 gr = vec2(vn(p + vec2(0.2, 0.)) - c1, vn(p + vec2(0., 0.2)) - c1) + 0.4 * vec2(vn(p * 2.6 + vec2(7.3, 7.)) - c2, vn(p * 2.6 + vec2(7., 7.3)) - c2);
    vec2 nq = vC * 0.95 - gr * 3.4;
    vec3 Nv = normalize(vec3(nq.x * vec2(vAx.y, -vAx.x) + nq.y * vAx, sqrt(max(1. - r * r, 0.) + 0.05)));
    vec3 Lv = normalize((viewMatrix * vec4(uSun, 0.)).xyz + vec3(0., 1e-5, 0.));
    float lit = clamp(dot(Nv, Lv) * 0.5 + 0.5, 0., 1.);
    float skyl = 0.55 + 0.45 * dot(Nv, (viewMatrix * vec4(0., 1., 0., 0.)).xyz);
    // (round 13) the lanterns light the side of a lobe that is turned to them: its underside above their height, its top below it
    lampW = (0.62 + 0.38 * clamp(0.5 - 0.6 * dot(Nv, (viewMatrix * vec4(0., 1., 0., 0.)).xyz) * vLmp.y, 0., 1.)) * (0.66 + 0.34 * smoothstep(0., 0.28, hgt));
    // by lamplight the moon stands beyond the water and its light comes through the spray: every lobe is a solid pale body, bright
    // on its moonward shoulder and falling to blue shade on the other (wl: the same light wrapped round to the viewer's side)
    vec3 Lw = normalize(vec3(Lv.xy, 0.4 + 0.6 * abs(Lv.z)));
    float wl = clamp(dot(Nv, Lw) * 0.5 + 0.5, 0., 1.);
    float key = mix(0.16 + 0.96 * lit * lit, (0.17 + 0.6 * wl * wl) * (1. - 0.45 * vNr), uThroat);
    // (round 13: by lamplight the sky's fill is 1.3 where it was 2.2: with the standards lighting the water from below, a fan white
    // from foot to crest under the sky alone was the pale block)
    col = vec3(0.86, 0.88, 0.88) * (uSunCol * key + uSky * mix(1.2, 1.3, uThroat) * skyl) * (0.66 + 0.34 * smoothstep(0., 0.28, hgt)) * (0.9 + 0.2 * vSeed);
    // the heart of the wall is in its own shade: blue-grey under the white crest
    col *= mix(vec3(0.38, 0.5, 0.76), vec3(1.), clamp(vShade * (1. - 0.15 * uThroat) * (0.7 + 0.6 * vn(vW.xy * 0.13 + vW.z * 0.09)), 0., 1.));
    // by lamplight, from close by, the wall of spray is not one pale mass: whole reaches of it stand in slate-indigo shade
    col = mix(col, col * vec3(0.24, 0.32, 0.62), mix(0.3, 0.8, vNr) * uThroat * vDk * smoothstep(0.3, 0.7, vn(vW.xy * 0.11 + vW.z * 0.07 + 5.)));
    // its leading tip thins into spray, and close by the whole lobe is thinner: the veined sheet behind it is the picture there
    a *= (1. - 0.75 * uThroat * smoothstep(0.15, 0.95, vC.y)) * (1. - 0.8 * uThroat * vNr);
    // the lit rim: all round a lobe by day, by lamplight only on the shoulder that is turned to the moon
    col += uSunCol * (0.6 * fs * mix(1., 0.75 * wl * wl * wl, uThroat) + 0.3 * lit * vShade) * smoothstep(0.4, 0.9, d);
#ifdef CANOPY_DAY
    // by day a lobe of spray looked up at from under the arch has the sun beyond it and glows: white heads, pale aqua in the
    // creases, never the blue-grey shade and beige of a lump lit from one side (see the sheet's day block). The young wall keeps
    // its sunlit cauliflower: this is for lobes that have begun to thin, and for any lobe seen from right beneath
    if (uDay > 0.) {
      vec3 sunW = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.59, 0.11))), 0.7);
      vec3 gb = mix(vec3(0.5, 0.93, 0.82), vec3(0.94, 1.0, 0.97), smoothstep(0.02, 0.35, hgt)) * (sunW * (0.45 + 0.55 * lit) + uSky * 1.0) * (0.92 + 0.16 * vSeed);
      float up = -V.y, kb = max(smoothstep(0.45, 0.8, up), smoothstep(0.1, 0.45, up) * smoothstep(0.05, 0.6, vDis));
      col = mix(col, gb, uDay * kb * (1. - 0.7 * smoothstep(28., 55., length(cameraPosition - vW))));
    }
#endif
  } else if (vSoft > 0.5) {
    a = exp(-r * r * 3.0) * (1. - smoothstep(0.7, 1., r)) * (0.55 + 0.7 * vn(vC * 1.6 + vSeed * 40.));
    col = mix(vec3(0.93, 0.96, 0.96), uJade, 0.25 * fs) * (uSunCol * (0.5 + 0.5 * fs) + uSky * 1.1) * (1. - 0.5 * uThroat);
  } else {
    a = (1. - smoothstep(0.15, 1., r)) * 0.7;
    col = vec3(0.95, 0.98, 0.97) * (uSunCol * (0.85 + 1.0 * step(0.95, vSeed) + 0.8 * fs) + uSky * 1.15);
  }
  // by lamplight the low water is in shade (indigo); the plumes above it stay pale
  float low = uThroat * (1. - smoothstep(1.5 * uScale, 16. * uScale, vW.y)) * step(-0.5, vW.y);
  col = mix(col, col * vec3(0.24, 0.3, 0.56), mix(0.7, mix(0.55, 0.6, vNr), vBil) * low);      // (round 13: billows 0.55 to 0.6, were 0.25 to 0.4: the low water is the lamps')
  // (round 13: in place of one constant amber on the low water) and every lobe, veil and drop takes the standards' light where it flies
  col += vec3(0.88) * uLampGlow * (vLmp.x * lampW) * mix(1., 0.3, step(0.5, vSoft) * (1. - step(0.5, vBil)));      // (13c: the fine soft mist takes three tenths of the lanterns' light: lit whole it stood as a pink fog at a fan's foot)
  a *= vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;
async function buildParticles(field, rng, V, detail, pk, pause) {
  const P = [], f = new Float64Array(7), q = { x: 0, y: 0, z: 0 }, g = () => rng.gauss();
  const add = (x, y, z, vx, vy, vz, te, k, size, type, life, alpha) => { P.push(x, y, z, vx, vy, vz, te, k, size, type, rng(), life, alpha); };
  const pickL = () => (rng() < 0.6 ? 0 : rng() < 0.5 ? 1 : 2);
  // billows: round shaded puffs that ride in the sheets and crown their crests, so the water just thrown is a thick lobed
  // wall with a cauliflower top, not a brush. Laid down far side first (the car comes from +X), under the drops and the mist.
  // Their last slot is not opacity but light: 1 on the crest, less in the heart of the wall
  for (let i = 0, n = Math.round(620 * Math.max(pk, 0.55)); i < n; i++) {
    if ((i & 127) === 0) await pause();
    const s = (-1 + (2 * (i + rng())) / n) * 0.97, top = rng() < 0.36, L = pickL(), e = top ? rng() * 0.05 : 0.05 + 0.5 * Math.pow(rng(), 1.3);
    field(s, e, L, f);
    const j = top ? 1 + rng.range(-0.03, 0.02) : 1 + rng.range(-0.1, -0.01), size = (top ? 0.55 + 1.3 * Math.pow(rng(), 1.6) : rng.range(0.9, 2.2)) * (1 - 0.35 * Math.abs(s * s * s));
    add(f[0], f[1], f[2] + g() * 0.5, f[3] * j + g() * 0.5, f[4] * j, f[5] * j + g() * (top ? 0.6 : 1.4), f[6] + rng() * 0.04, KD * (top ? 1 : rng.range(1.0, 1.2)), size, 4, top ? rng.range(1.8, 2.4) : rng.range(1.5, 2.3), top ? rng.range(0.8, 1) : rng.range(0.1, 0.7));
  }
  // and fine ones flung a little ahead of the crest and off the ends: a ragged, spitting fringe on the lobes
  for (let i = 0, n = Math.round(340 * Math.max(pk, 0.5)); i < n; i++) {
    if ((i & 127) === 0) await pause();
    const s = (-1 + (2 * (i + rng())) / n) * 0.99, L = pickL();
    field(s, rng() * 0.1, L, f);
    const j = 1 + rng.range(-0.02, 0.08);
    add(f[0], f[1], f[2] + g() * 0.4, f[3] * j + g() * 1.1, f[4] * j + g() * 0.8, f[5] * j + g() * 1.1, f[6] + rng() * 0.06, KD * rng.range(0.95, 1.3), rng.range(0.22, 0.6), 4, rng.range(1.3, 2.2), 1);
  }
  // drops riding inside the sheets
  for (let i = 0, n = Math.round(6500 * detail); i < n; i++) {
    if ((i & 255) === 0) await pause();
    field(rng.range(-1, 1), Math.pow(rng(), 1.25), pickL(), f); const j = 1 + rng.range(-0.1, 0.05);
    add(f[0] + g() * 0.3, f[1], f[2] + g() * 0.3, f[3] * j + g() * 1.2, f[4] * j + g() * 1.2, f[5] * j + g() * 1.2,
      f[6] + rng() * 0.05, KD * rng.range(0.9, 1.25), 0.025 + 0.09 * Math.pow(rng(), 3), 0, 7.5, 1);
  }
  // finger jets: chains of drops that lead the crest
  for (let c = 0, nc = Math.round(48 * pk); c < nc; c++) {
    if ((c & 15) === 0) await pause();
    const s = rng.range(-0.95, 0.95), L = rng() < 0.7 ? 0 : 2, e0 = rng() * 0.3, boost = rng.range(1.03, 1.16), n = 26, dt = rng.range(0.005, 0.009);
    // every link flies the same arc, a moment later than the one before, so the chain lies along its own velocity:
    // stretched drops overlap into one tapering thread that breaks into beads only at its tail
    field(s, e0, L, f);
    const cx = g() * 1.1, cz = g() * 1.1;      // each thread is thrown with a twist, so it bows as it flies instead of standing as a rod
    for (let m = 0; m < n; m++) {
      const k = m / n, j = boost * (1 + g() * 0.006 * k * k);
      add(f[0], f[1], f[2], f[3] * j + cx * k, f[4] * j, f[5] * j + cz * k, f[6] + (m + rng.range(-0.45, 0.45)) * dt, KD * 0.95 * (1 + 0.08 * k), lerp(0.11, 0.03, k) * rng.range(0.6, 1.4), -1, 2.8, lerp(0.62, 0.15, k));
    }
  }
  // spindrift: half thrown from the root, half shed from the hanging sheet
  for (let i = 0, n = Math.round(2100 * detail); i < n; i++) {
    if ((i & 255) === 0) await pause();
    field(rng.range(-1, 1), i % 3 ? Math.pow(rng(), 2.2) * 0.6 : rng(), pickL(), f);
    const k = rng.range(2.4, 4.2), size = i % 3 ? rng.range(0.8, 2.0) : rng.range(1.4, 3.2), life = rng.range(3.5, 6), al = i % 3 ? rng.range(0.06, 0.13) : rng.range(0.04, 0.09);
    if (i % 3 === 0) { const m = rng.range(0.75, 1.0); add(f[0], f[1], f[2], f[3] * m + g() * 2, f[4] * m + g() * 2, f[5] * m + g() * 2, f[6] + rng() * 0.3, k, size, 1, life, al); } else {
      const a0 = rng.range(0.35, 3.2), ex = Math.exp(-KD * a0), ty = -G / KD; fly(f, a0, KD, V.wx, V.wz, V.scale, q);
      add(q.x, q.y, q.z, ((f[3] - V.wx) * ex + V.wx) * 0.6 + g(), ((f[4] - ty) * ex + ty) * 0.6 + g(), ((f[5] - V.wz) * ex + V.wz) * 0.6 + g(), f[6] + a0, k, size, 1, life * 0.8, al);
    }
  }
  // the detonation at the foot of the wall
  await pause();
  for (let i = 0, nd = Math.round(520 * pk); i < nd; i++) {
    const s = rng.range(-1, 1), te = 0.3 * Math.pow(Math.abs(s - V.s0), 1.3) + rng() * 0.5;
    add(s * 14.5, -3.2 + rng() * 2.6, -2.2 - rng() * 3.2, s * 5 + g() * 3, rng.range(9, 25), g() * 2 - 3, te + (i % 3) * 0.7, rng.range(2.2, 3.4), rng.range(1.6, 3.4), 3, rng.range(1.2, 2.0), rng.range(0.11, 0.21));
  }
  // splashes where the falling curtain meets road, pavement and sea
  for (let i = 0, n = Math.round(2000 * detail); i < n; i++) {
    if ((i & 127) === 0) await pause();
    field(rng.range(-1, 1), rng(), rng() < 0.6 ? 0 : 1, f);
    let age = 0.3, hit = 0;
    for (let it = 0; it < 130 && !hit; it++) { age += 0.06; fly(f, age, KD, V.wx, V.wz, V.scale, q); if (q.z > 0.3 ? q.y < (q.z < 5.1 ? 0.2 : 0.05) : q.y < -4) hit = q.z > 0.3 ? 1 : 2; }
    if (!hit || (hit === 2 && rng() < 0.6)) continue;
    const y = hit === 1 ? (q.z < 5.1 ? 0.2 : 0.05) : -3.9, te = f[6] + age;
    if (rng() < 0.68) add(q.x, y, q.z, g() * 2.2, rng.range(2, 6.5), 1.5 + g() * 1.8, te, 1.3, rng.range(0.03, 0.09), 2, 1.1, 1);
    else add(q.x, y + 0.2, q.z, g(), rng.range(1, 3), 1.5 + rng() * 2, te, 3, rng.range(0.7, 1.8), 3, 0.95, 0.24);
  }
  const n = P.length / 13, pos = new Float32Array(n * 12), v0 = new Float32Array(n * 12), ap = new Float32Array(n * 16), as = new Float32Array(n * 12), ac = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
  const CX = [-1, 1, 1, -1], CY = [-1, -1, 1, 1];
  for (let i = 0; i < n; i++) {
    if ((i & 255) === 0) await pause();
    const b = i * 13;
    for (let c = 0; c < 4; c++) {
      const o = i * 4 + c;
      pos[o * 3] = P[b]; pos[o * 3 + 1] = P[b + 1]; pos[o * 3 + 2] = P[b + 2];
      v0[o * 3] = P[b + 3]; v0[o * 3 + 1] = P[b + 4]; v0[o * 3 + 2] = P[b + 5];
      ap[o * 4] = P[b + 6]; ap[o * 4 + 1] = P[b + 7]; ap[o * 4 + 2] = P[b + 8]; ap[o * 4 + 3] = P[b + 9];
      as[o * 3] = P[b + 10]; as[o * 3 + 1] = P[b + 11]; as[o * 3 + 2] = P[b + 12];
      ac[o * 2] = CX[c]; ac[o * 2 + 1] = CY[c];
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aV0', new THREE.BufferAttribute(v0, 3));
  geo.setAttribute('aP', new THREE.BufferAttribute(ap, 4));
  geo.setAttribute('aS', new THREE.BufferAttribute(as, 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(ac, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 8), 70);
  return geo;
}

// ---------- stage: wall, pavement, lamps, props, rock shelf (one merged vertex-coloured mesh) ----------
const C = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const FACES = [[1, 3, 7, 5], [0, 4, 6, 2], [2, 6, 7, 3], [0, 1, 5, 4], [4, 5, 7, 6], [0, 2, 3, 1]];
const FSHADE = [0.92, 0.92, 1.08, 0.55, 0.97, 0.97];
function makeBuilder() {
  const pos = [], nor = [], col = [], idx = [];
  const m4 = new THREE.Matrix4(), eu = new THREE.Euler(), v = new THREE.Vector3(), nm = new THREE.Matrix3(), cs = new Float64Array(24);
  return {
    // box by centre and full size; o: { ry, rx, rz, taper (top shrink), top (top-face colour) }
    box(cx, cy, cz, sx, sy, sz, c, o = {}) {
      const tp = o.taper ?? 1, rot = o.ry || o.rx || o.rz;
      if (rot) m4.makeRotationFromEuler(eu.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'));
      for (let i = 0; i < 8; i++) {
        const up = i & 2, k = up ? tp : 1;
        v.set((i & 1 ? 0.5 : -0.5) * sx * k, (up ? 0.5 : -0.5) * sy, (i & 4 ? 0.5 : -0.5) * sz * k);
        if (rot) v.applyMatrix4(m4);
        cs[i * 3] = v.x + cx; cs[i * 3 + 1] = v.y + cy; cs[i * 3 + 2] = v.z + cz;
      }
      for (let f = 0; f < 6; f++) {
        const q = FACES[f], a = q[0] * 3, b = q[1] * 3, d = q[2] * 3, base = pos.length / 3;
        const ux = cs[b] - cs[a], uy = cs[b + 1] - cs[a + 1], uz = cs[b + 2] - cs[a + 2], wx = cs[d] - cs[a], wy = cs[d + 1] - cs[a + 1], wz = cs[d + 2] - cs[a + 2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        const fc = f === 2 && o.top ? o.top : c, sh = FSHADE[f];
        for (let k = 0; k < 4; k++) {
          const p = q[k] * 3, low = f !== 2 && f !== 3 && !(q[k] & 2) ? 0.82 : 1;
          pos.push(cs[p], cs[p + 1], cs[p + 2]); nor.push(nx, ny, nz); col.push(fc[0] * sh * low, fc[1] * sh * low, fc[2] * sh * low);
        }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    },
    // any BufferGeometry, transformed, coloured by colFn(x, y, z, ny) in its own space
    geo(g, matrix, colFn) {
      const p = g.attributes.position, n = g.attributes.normal, base = pos.length / 3;
      nm.getNormalMatrix(matrix);
      for (let i = 0; i < p.count; i++) {
        const c = colFn(p.getX(i), p.getY(i), p.getZ(i), n.getY(i));
        v.fromBufferAttribute(p, i).applyMatrix4(matrix); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(c[0], c[1], c[2]);
      }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(base + g.index.getX(i)); else for (let i = 0; i < p.count; i++) idx.push(base + i);
      g.dispose();
    },
    raw(px, py, pz, nx, ny, nz, c) { pos.push(px, py, pz); nor.push(nx, ny, nz); col.push(c[0], c[1], c[2]); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    async build(pause) {      // an attribute a step
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      await pause();
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      await pause();
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      await pause();
      g.setIndex(idx);
      await pause();
      g.computeBoundingSphere();
      return g;
    },
  };
}
const SCUPPERS = [-44, -36, -28, -20, -12, -4, 4, 12, 20, 28, 36, 44], LAMPS = [-40, -8, 24];
async function buildWall(B, rng, pal, pause) {
  const stone = C('#b3a58c'), stone2 = C('#958d7e'), salt = C('#d6d1c0'), weed = C('#34502a'), algae = C('#6f9a2c'), rust = C('#7a3f1c'), concrete = C('#8a8d8b'), dark = [0.03, 0.03, 0.035];
  const bone = mul3(C(pal[2]), 0.62), pink = mix3(C(pal[3]), bone, 0.55);
  const wetAt = (x) => lerp(0.6, 1, smoothstep(9, 24, Math.abs(x)));
  const scupD = (x) => { let d = 99; for (const s of SCUPPERS) d = Math.min(d, Math.abs(x - s)); return d; };
  B.box(0, 0.535, -0.45, 96, 0.77, 0.78, dark);
  B.box(0, -1.65, -0.55, 96, 3.6, 0.5, dark);
  // two coursed rows above the pavement, full depth so both faces are real stone (a wall to sit on: the sea shows over it)
  for (let c = 0; c < 2; c++) {
    let x = -48 - rng() * 0.9;
    while (x < 48) {
      const len = Math.min(rng.range(1.1, 2.0), 48.02 - x), xc = x + len / 2; x += len;
      if (len < 0.15) continue;
      let k = mix3(stone, stone2, rng()); k = mul3(k, rng.range(0.82, 1.08) * wetAt(xc));
      if (xc > 21 && xc < 28.5 && rng() < 0.75) k = mul3(concrete, rng.range(0.8, 1.0));
      if (scupD(xc) < 0.7) k = mix3(k, rust, 0.3);
      if (rng() < 0.06) k = mix3(k, weed, 0.35);
      B.box(xc, 0.315 + c * 0.33, -0.45, len - 0.03, 0.305, 0.9 + rng.range(-0.035, 0.035), k, { top: mul3(k, 0.5) });
    }
    await pause();
  }
  // coping: bleached, chamfered, one stone gone where the wall was breached and patched
  for (let i = 0; i < 64; i++) {
    const xc = -47.25 + i * 1.5; if (Math.abs(xc - 24.75) < 0.8) continue;
    const k = mul3(mix3(stone, salt, rng.range(0.35, 0.75)), rng.range(0.85, 1.05) * lerp(0.72, 1, smoothstep(9, 24, Math.abs(xc))));
    B.box(xc, 0.915 + rng.range(-0.006, 0.006), -0.45, 1.47, 0.21, 1.05, k, { taper: 0.95, ry: rng.range(-0.006, 0.006) });
  }
  await pause();
  B.box(24.75, 0.84, -0.45, 1.5, 0.07, 0.86, mul3(concrete, 0.7));
  B.box(25.6, 0.27, 1.45, 1.47, 0.21, 1.05, mul3(mix3(stone, salt, 0.4), 0.8), { taper: 0.95, ry: 0.5, rz: 0.07 });
  B.box(27.4, 0.31, 0.75, 0.8, 0.32, 0.5, mul3(concrete, 0.85), { ry: -0.3 }); B.box(27.6, 0.6, 0.8, 0.6, 0.26, 0.45, mul3(stone2, 0.8), { ry: 0.4 });
  // sea face: six big wet courses down to the shelf, weed and algae toward the waterline
  for (let c = 0; c < 6; c++) {
    let x = -48 - rng() * 1.2; const y = -0.145 - c * 0.59;
    while (x < 48) {
      const len = Math.min(rng.range(1.5, 2.4), 48.02 - x), xc = x + len / 2; x += len;
      if (len < 0.2) continue;
      let k = mul3(mix3(stone2, stone, rng() * 0.5), rng.range(0.62, 0.85) * wetAt(xc));
      k = mix3(k, weed, clamp((c - 1.5) / 3, 0, 1) * rng.range(0.4, 0.8)); if (c > 3) k = mix3(k, algae, rng() * 0.45);
      if (scupD(xc) < 0.6) k = mix3(k, weed, 0.5);
      B.box(xc, y, -0.68, len - 0.035, 0.56, 0.5 + rng.range(-0.05, 0.05), k);
    }
    await pause();
  }
  for (const s of SCUPPERS) {
    B.box(s, 0.245, 0.012, 0.56, 0.17, 0.035, [0.012, 0.012, 0.015]);
    B.box(s, 0.345, 0.02, 0.68, 0.035, 0.05, mul3(rust, 0.8)); B.box(s - 0.19, 0.245, 0.03, 0.025, 0.17, 0.02, mul3(rust, 0.6)); B.box(s + 0.19, 0.245, 0.03, 0.025, 0.17, 0.02, mul3(rust, 0.6)); B.box(s, 0.245, 0.03, 0.025, 0.17, 0.02, mul3(rust, 0.6));
    B.box(s, 0.08, -1.08, 0.34, 0.15, 0.4, mul3(stone2, 0.5), { rx: -0.12 });
    B.box(s + rng.range(-0.05, 0.05), -1.45, -0.94, 0.4, 2.7, 0.03, mul3(weed, 0.6));
  }
  await pause();
  // pavement: two-tone slabs, heaved and cracked, darker where the sea keeps landing; granite kerb
  for (let r = 0; r < 3; r++) for (let i = 0; i < 40; i++) {
    if (i === 0) await pause();
    const xc = -46.8 + i * 2.4, zc = 0.86 + r * 1.66, bad = rng() < 0.14;
    let k = mul3((i + r) & 1 ? bone : pink, rng.range(0.78, 1.0) * lerp(0.66, 1, smoothstep(8, 26, Math.abs(xc))));
    if (bad) k = mul3(k, 0.7); if (rng() < 0.04) k = mul3(concrete, 0.6);
    B.box(xc, 0.075 + (bad ? rng.range(-0.02, 0.025) : 0), zc, 2.37, 0.15, 1.63, k, { rz: bad ? rng.range(-0.014, 0.014) : 0, rx: bad ? rng.range(-0.012, 0.012) : 0 });
  }
  await pause();
  for (let i = 0; i < 48; i++) B.box(-47 + i * 2, 0.085, 5.125, 1.97, 0.17, 0.25, mul3(C('#7d7f84'), rng.range(0.75, 1.0)), { taper: 0.96 });
}
function buildLamp(B, rng, noise, x, z, o) {
  const iron = C('#1d2b27'), rust = C('#7a3f1c'), saltc = C('#a9b0a6'), sd = rng() * 50;
  const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(o.rx || 0, rng() * 6.28, o.rz || 0, 'XZY')).setPosition(x, 0.15, z);
  const pts = [[0, 0], [0.46, 0], [0.46, 0.12], [0.4, 0.16], [0.4, 0.52], [0.45, 0.58], [0.33, 0.68], [0.21, 0.95], [0.16, 1.05], [0.2, 1.1], [0.13, 1.2]];
  for (let y = 1.3; y < 4.56; y += 0.36) pts.push([lerp(0.125, 0.082, (y - 1.3) / 3.3), y]);
  pts.push([0.082, 4.6], [0.15, 4.64], [0.15, 4.72], [0.09, 4.78], [0.075, 5.0], [0.19, 5.06], [0.2, 5.12]);
  const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 16), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 1.25 && y < 4.58) { const k = 1 + 0.08 * Math.cos(8 * Math.atan2(p.getZ(i), p.getX(i))); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
  g.computeVertexNormals();
  const ironCol = (px, py, pz) => {
    const n = noise.n3(px * 3 + sd, py * 1.4, pz * 3) * 0.5 + 0.5;
    let k = mix3(iron, rust, smoothstep(0.35, 0.8, n + (py < 0.7 ? 0.25 : 0) - py * 0.03));
    return mix3(k, saltc, 0.3 * smoothstep(0.3, 0.9, noise.n3(px * 1.5, py * 0.6 + sd, pz * 1.5) * 0.5 + 0.5));
  };
  B.geo(g, M, ironCol);
  const R = o.broken ? M.clone().multiply(new THREE.Matrix4().makeTranslation(0.12, 5.62, 0)).multiply(new THREE.Matrix4().makeRotationZ(0.5)).multiply(new THREE.Matrix4().makeTranslation(0, -5.74, 0)) : M;
  if (!o.broken) B.geo(new THREE.LatheGeometry([new THREE.Vector2(0.15, 5.12), new THREE.Vector2(0.27, 5.74)], 6), M, (px, py) => mul3([0.5, 0.58, 0.5], 0.7 + 0.5 * (py - 5.12)));
  B.geo(new THREE.LatheGeometry([[0.34, 5.74], [0.31, 5.8], [0.12, 6.02], [0.045, 6.08], [0.07, 6.16], [0, 6.3]].map((q) => new THREE.Vector2(q[0], q[1])), 6), R, ironCol);
  const a = new THREE.Vector3(0, 4.87, 0).applyMatrix4(M);
  B.box(a.x, a.y, a.z, 0.95, 0.05, 0.05, mul3(iron, 1.1)); B.box(a.x - 0.47, a.y, a.z, 0.1, 0.1, 0.1, rust); B.box(a.x + 0.47, a.y, a.z, 0.1, 0.1, 0.1, iron);
}
function buildProps(B, rng, noise, pal) {
  const rust = C('#7a3f1c'), iron = C('#1d2b27'), wood = C('#6b4a2c'), rope = mul3(C(pal[5]), 0.6);
  const M = new THREE.Matrix4(), E = new THREE.Euler(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), T = new THREE.Vector3();
  const mat = (x, y, z, rx, ry, rz, s = 1, sy = s) => M.compose(T.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(s, sy, s)).clone();
  // fish crates, rope coil, a tyre left as a fender, bollards
  const tints = [mul3(C(pal[4]), 0.5), mul3(C(pal[5]), 0.55), mul3(C(pal[6]), 0.45), mul3(C(pal[3]), 0.5)];
  let cy = 0.15;
  for (let i = 0; i < 4; i++) {
    const cx = i < 3 ? -21.5 + rng.range(-0.06, 0.06) : -20.4, k = mul3(rng.pick(tints), rng.range(0.8, 1.1)), y = i < 3 ? cy + 0.2 : 0.35, ry = rng.range(-0.25, 0.25);
    B.box(cx, y, 0.75, 0.82, 0.4, 0.56, k, { ry, top: [0.03, 0.03, 0.03] });
    B.box(cx, y + 0.16, 0.75, 0.86, 0.06, 0.6, mul3(k, 1.15), { ry, top: [0.03, 0.035, 0.04] });
    if (i < 3) cy += 0.41;
  }
  for (let i = 0; i < 4; i++) B.geo(new THREE.TorusGeometry(0.34 - i * 0.03, 0.065, 6, 16), mat(-19.0, 0.22 + i * 0.11, 1.4, Math.PI / 2, 0, i * 0.7), (x, y, z) => mul3(rope, 0.8 + 0.4 * noise.n2(x * 9, y * 9 + i)));
  B.geo(new THREE.TorusGeometry(0.34, 0.13, 8, 18), mat(31, 0.6, 0.32, 0.28, 0.3, 0), () => [0.02, 0.02, 0.022]);
  for (const bx of [-34, 34, 6]) B.geo(new THREE.LatheGeometry([[0, 0], [0.2, 0], [0.2, 0.06], [0.15, 0.1], [0.13, 0.5], [0.2, 0.56], [0.22, 0.66], [0.12, 0.74], [0, 0.75]].map((q) => new THREE.Vector2(q[0], q[1])), 10), mat(bx, 0.15, 4.4, 0, 0, 0), (x, y, z) => mix3(iron, rust, smoothstep(-0.2, 0.6, noise.n3(x * 6 + bx, y * 4, z * 6))));
  // iron ladder over the wall down to the shelf
  for (const dx of [-0.25, 0.25]) { B.box(-30 + dx, -1.17, -1.0, 0.05, 4.56, 0.05, rust); B.box(-30 + dx, 1.29, -0.55, 0.05, 0.05, 1.0, rust); B.box(-30 + dx, 1.17, -0.08, 0.05, 0.3, 0.05, rust); }
  for (let i = 0; i < 12; i++) B.box(-30, 0.87 - i * 0.36, -1.0, 0.5, 0.035, 0.035, mul3(rust, 0.8));
  // the repair: striped trestle (no lettering) and planks
  for (let i = 0; i < 8; i++) B.box(22.2 + i * 0.3, 0.98, 1.9, 0.3, 0.16, 0.035, i & 1 ? mul3(wood, 1.5) : [0.3, 0.07, 0.04], { ry: 0 });
  for (const dx of [22.3, 24.3]) { B.box(dx, 0.58, 1.72, 0.05, 0.9, 0.05, wood, { rx: 0.35 }); B.box(dx, 0.58, 2.08, 0.05, 0.9, 0.05, wood, { rx: -0.35 }); }
  B.box(26.6, 0.62, 0.2, 0.22, 1.5, 0.04, mul3(wood, 0.9), { rx: 0.2, rz: 0.1 }); B.box(26.95, 0.58, 0.22, 0.22, 1.35, 0.04, mul3(wood, 1.2), { rx: 0.22, rz: -0.06 });
}
async function buildRocks(B, rng, noise, pause) {
  const basalt = [0.05, 0.052, 0.06], dry = [0.15, 0.14, 0.125], algae = C('#5f7d2a'), weed = C('#2c4724');
  const NX = 110, NZ = 24, X0 = -60, X1 = 60, Z0 = -18.5, Z1 = -0.8;
  const hAt = (x, z) => {
    const w = 10.5 + 4.5 * noise.n2(x * 0.03, 5.1), d = Math.max(0, (Z1 - z) / w);
    const rough = noise.ridged2(x * 0.11 + 3, z * 0.17, 4) * 2.4 * (0.25 + 0.75 * Math.min(1, d * 2.2)) + 0.22 * noise.n2(x * 0.9, z * 0.9);
    return d < 1 ? lerp(-3.0, -4.3, Math.pow(d, 1.5)) + rough * (1 - 0.6 * d) - 0.5 : -4.6 - (d - 1) * 7 + rough * 0.3;
  };
  const base = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    if (i === 0) await pause();      // a row of the shelf at a time
    const x = lerp(X0, X1, i / NX) + (i > 0 && i < NX ? rng.range(-0.3, 0.3) : 0), z = lerp(Z0, Z1, j / NZ) + (j > 0 && j < NZ ? rng.range(-0.2, 0.2) : 0), y = hAt(x, z);
    const nx = hAt(x - 0.4, z) - hAt(x + 0.4, z), nz = hAt(x, z - 0.4) - hAt(x, z + 0.4), l = Math.hypot(nx, 0.8, nz);
    let k = mul3(basalt, 0.8 + 0.5 * rng());
    k = mix3(k, dry, smoothstep(-3.0, -2.0, y) * 0.8);
    if (0.8 / l > 0.9 && y < -3.25 && y > -3.95) k = mix3(k, algae, 0.2 + 0.3 * rng());
    if (y < -3.7) k = mix3(k, weed, 0.5);
    base.push(B.raw(x, y, z, nx / l, 0.8 / l, nz / l, k));
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = base[j * (NX + 1) + i], b = a + 1, c = base[(j + 1) * (NX + 1) + i], d = c + 1; B.tri(a, c, b); B.tri(b, c, d); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), T = new THREE.Vector3(), S = new THREE.Vector3();
  for (let r = 0; r < 22; r++) {
    await pause();
    const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, sd = rng() * 90;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.34 * noise.n3(x * 1.3 + sd, y * 1.3, z * 1.3) + 0.12 * noise.n3(x * 3.7, y * 3.7 + sd, z * 3.7); p.setXYZ(i, x * k, y * k, z * k); }
    g.computeVertexNormals();
    const x = rng.range(-56, 56), z = -1.6 - rng() * rng() * 13, s = rng.range(0.7, 2.3), tone = rng.range(0.7, 1.5);
    M.compose(T.set(x, hAt(x, z) + s * 0.25, z), Q.setFromEuler(E.set(rng() * 6, rng() * 6, rng() * 6)), S.set(s * rng.range(0.9, 1.5), s * rng.range(0.6, 0.9), s));
    B.geo(g, M, (px, py, pz) => mix3(mul3(basalt, tone), dry, 0.35 * smoothstep(-0.2, 0.8, noise.n3(px * 2 + sd, py * 2, pz * 2))));
  }
}

// ---------- wet road (preview mirror plane) and sea ----------
const SKYFN = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uSkyTop, uSkyHor;
vec3 skyRefl(vec3 R){
  vec2 az = R.xz / max(length(R.xz), 1e-4), sz = uSun.xz / max(length(uSun.xz), 1e-4);
  float toward = smoothstep(-0.3, 0.9, dot(az, sz)) * (1. - smoothstep(0.02, 0.45, R.y));
  return mix(uSkyTop * (1. + 0.6 * (1. - smoothstep(0.0, 0.5, R.y))), uSkyHor, toward);
}`;
const PLANE_VERT = /* glsl */`
uniform float uTime, uTau, uSea;
varying vec3 vW, vL;
#include <fog_pars_vertex>
float swell(vec2 p, float t){ return 0.95 * sin(0.085 * (p.y * 0.95 + p.x * 0.31) - 0.9 * t) + 0.5 * sin(0.19 * (p.y - 0.42 * p.x) - 1.35 * t + 1.) + 0.22 * sin(0.41 * (p.y * 0.8 + p.x * 0.6) - 2.1 * t + 4.); }
void main(){
  vec3 lp = position;
  if (uSea > 0.5) {
    vec2 p = lp.xz;
    float zc = min(uTau, 0.) * 13. - 3.;
    float amp = 2.9 * smoothstep(-2.4, -0.6, uTau) * (1. - smoothstep(0., 0.7, uTau));
    float a = (p.y - zc) / 6.5, b = p.x / 22.;
    float damp = 0.3 + 0.7 * (1. - smoothstep(-24., -3., p.y));
    lp.y = -4. + swell(p, uTime) * damp + amp * exp(-a * a) * exp(-b * b);
  }
  vL = lp; vec4 wp = modelMatrix * vec4(lp, 1.); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROAD_FRAG = /* glsl */`
uniform float uTau, uTime; uniform vec4 uShadow; uniform vec2 uShDir;
varying vec3 vW, vL;
#include <fog_pars_fragment>
${NOISE}${WET}${SKYFN}
void main(){
  vec2 p = vL.xz;
  float rim = 1. - smoothstep(170., 255., length(p));
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  vec3 col;
  if (vL.y < -0.02) {
    col = vec3(0.07, 0.068, 0.066) * (0.5 + 0.9 * fbm(vec2(p.x * 0.4, vL.y * 1.3))) * (uSunCol * 0.25 + uSky);
  } else {
    float a1 = fbm(p * 0.33), grain = vn(p * 21.);
    vec3 asph = mix(vec3(0.05, 0.052, 0.062), vec3(0.105, 0.1, 0.1), a1) * (0.8 + 0.4 * grain);
    asph *= 1. - 0.22 * smoothstep(0.55, 0.6, fbm(p * 0.37 + 31.));
    float lz = (p.y - 5.25) / 3.0;
    float seam = (1. - smoothstep(0.0, 0.03, abs(fract(lz + 0.5) - 0.5))) * step(5.2, p.y) * step(p.y, 23.4);
    asph *= 1. - 0.45 * seam * (0.4 + 0.6 * vn(p * vec2(0.5, 3.)));
    asph *= 0.72 + 0.28 * smoothstep(0.0, 0.018, abs(vn(p * 0.8 + 50.) - 0.5));
    float wet = 0.5 + 0.5 * wetMask(p);
    float cf = 1. / (1. + length(cameraPosition - vW) * 0.05);
    float env = smoothstep(1.4, 2.6, uTau) * (1. - smoothstep(5.6, 8.6, uTau));
    float reach = clamp((uTau - 1.5) * 6.2, 0., 25.) * (1. - smoothstep(11., 31., abs(p.x))) * (0.72 + 0.5 * fbm(vec2(p.x * 0.16, 3.7)));
    float inSheet = (1. - smoothstep(reach - 4., reach, p.y)) * env;
    float flowS = 5.5 * min(uTau, 5.2) - 2.2 * max(uTau - 5.2, 0.);
    float lacef = veins(vec2(p.x * 0.5, (p.y - flowS) * 0.3));
    float edge = (1. - smoothstep(0., 1.6, abs(p.y - reach))) * env * step(0.5, reach);
    float foam = clamp(inSheet * lacef * 0.8 + edge * (0.2 + 0.7 * lacef), 0., 1.);
    wet = max(wet, inSheet * 0.92);
    // ripples: five short wave trains crossing at odd angles on a slowly warped field, so no lattice shows in the mirror
    vec2 wq = p + 1.3 * vec2(vn(p * 0.21 + 3.), vn(p * 0.21 + 17.));
    float c1 = cos(dot(wq, vec2(0.80, 0.60)) * 2.3 + uTime * 1.9), c2 = cos(dot(wq, vec2(-0.45, 0.89)) * 3.1 - uTime * 2.3 + 1.7), c3 = cos(dot(wq, vec2(0.97, -0.24)) * 4.4 + uTime * 2.9 + 4.1);
    float c4 = cos(dot(wq, vec2(0.28, 0.96)) * 5.9 - uTime * 3.4 + 2.6), c5 = cos(dot(wq, vec2(-0.87, -0.50)) * 1.5 + uTime * 1.3 + 5.2);
    float m1 = smoothstep(0.3, 0.7, vn(p * 0.31 + 11.)), m2 = smoothstep(0.3, 0.7, vn(p * 0.27 + 23.)), m3 = smoothstep(0.3, 0.7, vn(p * 0.23 + 37.));
    c1 *= m1; c2 *= m2 * (1. - m1); c3 *= m3 * (1. - m2) * (1. - m1) * 0.7; c4 *= (1. - m1) * (1. - m2) * (1. - m3) * 0.6; c5 *= 0.5;
    float rx = 0.80 * c1 - 0.45 * c2 + 0.97 * c3 + 0.28 * c4 - 0.87 * c5, rz = 0.60 * c1 + 0.89 * c2 - 0.24 * c3 + 0.96 * c4 - 0.50 * c5;
    vec3 N = normalize(vec3(rx * 0.022 * wet * cf, 1., rz * 0.022 * wet * cf));
    vec3 R = reflect(-V, N); R.y = abs(R.y);
    float g = 1. - clamp(dot(N, V), 0., 1.); float F = 0.06 + 0.94 * g * g * g;
    vec2 d = p - uShadow.xy; float al = dot(d, uShDir); vec2 pe = d - al * uShDir;
    float sh = uShadow.w * exp(-(dot(pe, pe) + al * al * 0.3) / max(uShadow.z * uShadow.z, 1.));
    col = asph * (uSunCol * max(uSun.y, 0.) * (1. - 0.75 * sh) + uSky) * (1. - 0.45 * wet);
    col = mix(col, skyRefl(R), F * (0.3 + 0.7 * wet));
    float gl = pow(max(dot(R, uSun), 0.), 420.);
    col += uSunCol * gl * 1.1 * wet * (1. - sh);
    col = mix(col, vec3(0.92, 0.96, 0.95) * (uSunCol * (0.85 - 0.5 * sh) + uSky * 1.1), foam);
  }
  gl_FragColor = vec4(col, rim);
  #include <fog_fragment>
}`;
const SEA_FRAG = /* glsl */`
uniform float uTau, uTime; uniform vec3 uJade, uTeal, uIndigo;
varying vec3 vW, vL;
#include <fog_pars_fragment>
${NOISE}${SKYFN}
float swell(vec2 p, float t){ return 0.95 * sin(0.085 * (p.y * 0.95 + p.x * 0.31) - 0.9 * t) + 0.5 * sin(0.19 * (p.y - 0.42 * p.x) - 1.35 * t + 1.) + 0.22 * sin(0.41 * (p.y * 0.8 + p.x * 0.6) - 2.1 * t + 4.); }
void main(){
  vec2 p = vL.xz;
  float rim = 1. - smoothstep(210., 315., length(p));
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  float h = vL.y + 4.;
  float damp = 0.3 + 0.7 * (1. - smoothstep(-24., -3., p.y));
  float sx = (swell(p + vec2(0.6, 0.), uTime) - swell(p - vec2(0.6, 0.), uTime)) / 1.2 * damp;
  float sz = (swell(p + vec2(0., 0.6), uTime) - swell(p - vec2(0., 0.6), uTime)) / 1.2 * damp;
  vec2 rp = p * 0.7 + vec2(uTime * 0.5, uTime * 0.9), rq = p * 2.1 - vec2(uTime * 0.7, -uTime * 1.2);
  float chop = 0.5 * fbm(rp) + 0.25 * vn(rq);
  float cf = 1. / (1. + length(cameraPosition - vW) * 0.03);
  float cx = (fbm(rp + vec2(0.4, 0.)) - fbm(rp - vec2(0.4, 0.))) * cf, cz = (fbm(rp + vec2(0., 0.4)) - fbm(rp - vec2(0., 0.4))) * cf;
  vec3 N = normalize(vec3(-sx - cx * 0.9, 1., -sz - cz * 0.9));
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float g = 1. - clamp(dot(N, V), 0., 1.); float F = 0.04 + 0.96 * g * g * g * g;
  float ndl = clamp(dot(N, uSun), 0., 1.);
  vec3 body = mix(uIndigo * 0.55, uTeal * 0.5, smoothstep(-0.8, 1.4, h) * 0.8 + 0.2 * chop);
  body += uJade * 0.22 * smoothstep(0.7, 2.6, h);
  vec3 col = body * (uSunCol * (0.35 + 0.65 * ndl) + uSky * 1.2);
  col = mix(col, skyRefl(R), F);
  col += uSunCol * pow(max(dot(R, uSun), 0.), 240.) * 1.1;
  float shelf = smoothstep(-22., -7., p.y);
  float caps = smoothstep(0.52, 0.7, fbm(p * vec2(0.09, 0.42) + vec2(0.2 * uTime, -0.9 * uTime))) * smoothstep(0.35, 1.3, h) * 0.8;
  float lacef = veins(p * 0.32 + vec2(sin(uTime * 0.4) * 0.6, uTime * 0.3));
  float streaks = smoothstep(0.5, 0.7, fbm(p * vec2(0.45, 0.1) + vec2(0., -uTime * 0.25))) * 0.35;
  float rb = length((p - vec2(0., -6.)) * vec2(0.6, 1.));
  float bloom = (1. - smoothstep(5. + uTau * 2.2, 10. + uTau * 3.6, rb)) * smoothstep(-0.2, 0.5, uTau) * (1. - smoothstep(4.5, 9.5, uTau));
  float hump = smoothstep(1.6, 2.8, h) * 0.8;
  float foam = clamp(caps * (0.3 + 0.6 * lacef) + shelf * lacef * 0.8 + streaks * (0.25 + 0.75 * shelf) + bloom * (0.12 + 0.7 * lacef) + hump * lacef, 0., 1.);
  col = mix(col, uJade * 0.55 * (uSunCol + uSky), clamp(bloom * 0.6 + shelf * 0.2, 0., 1.));
  col = mix(col, vec3(0.92, 0.96, 0.95) * (uSunCol * (0.45 + 0.6 * ndl) + uSky * 1.15), foam);
  gl_FragColor = vec4(col, rim);
  #include <fog_fragment>
}`;
function buildRoadGeo() {
  const g = new THREE.BufferGeometry(), R = 260, z0 = -0.4;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-R, 0, z0, R, 0, z0, R, 0, R, -R, 0, R, -R, 0, z0, R, 0, z0, R, -4.8, z0, -R, -4.8, z0], 3));
  g.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7]);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 130), 400);
  return g;
}
function buildSeaGeo() {
  const g = new THREE.PlaneGeometry(2, 1, 110, 60); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), t = 0.5 - p.getZ(i);
    p.setXYZ(i, Math.sign(x) * 320 * Math.pow(Math.abs(x), 1.7), 0, -0.4 - 320 * t * t);
  }
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -4, -160), 480);
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  // per-seed character of the burst: where it unzips from, how tall, how lobed, how it leans
  const tw = opts.twin ? opts.twin.shared : null;
  const V = tw ? { ...tw.V, scale: opts.scale ?? 1 } : {
    sd: rng.range(0, 100), s0: rng.range(-0.55, 0.55), v0: 42 * rng.range(0.95, 1.1), lean: rng.range(-0.02, 0.03),
    spread: rng.range(0.9, 1.12), lobes: rng.range(0.8, 1.45), wx: rng.range(-1.3, 1.3), wz: opts.wind ?? 4.2, scale: opts.scale ?? 1,
  };
  const field = makeField(noise, V);
  const group = new THREE.Group(); group.name = 'malecon-norther-canopy';
  const col = (hex) => new THREE.Color(hex);
  const U = {
    uTau: { value: 2.6 }, uTime: { value: 0 }, uScale: { value: V.scale }, uPix: { value: 0.004 }, uRoadY: { value: 0 },
    uVT: { value: new THREE.Vector3(V.wx, -G / KD, V.wz) }, uWind: { value: new THREE.Vector2(V.wx, V.wz) },
    uSun: { value: new THREE.Vector3(0.68, 0.29, -0.68).normalize() }, uSunCol: { value: col('#FFE9C4').multiplyScalar(3 / Math.PI) },
    uSky: { value: new THREE.Color(0.2, 0.25, 0.4) }, uJade: { value: col(pal[4]) }, uTeal: { value: col(pal[1]) }, uIndigo: { value: col(pal[0]) },
    uSkyTop: { value: opts.skyTop ? col(opts.skyTop) : col(pal[0]).lerp(new THREE.Color(0.06, 0.065, 0.075), 0.35).multiplyScalar(1.4) }, uSkyHor: { value: opts.skyHorizon ? col(opts.skyHorizon) : col('#C9DDE6').multiplyScalar(0.8) },
    uTear: { value: opts.tear ?? 0 }, uMist: { value: opts.mist ?? 1 }, uTransmit: { value: opts.transmit ?? 1 }, uThroat: { value: opts.throat ?? 0 }, uDeepK: { value: opts.deep ?? 1 }, uLampGlow: { value: opts.lampGlow ? new THREE.Color().copy(opts.lampGlow) : new THREE.Color(0, 0, 0) },
    uBil: { value: new THREE.Vector2(opts.billow ? opts.billow[0] : 1, opts.billow ? opts.billow[1] : 0) }, uNrR: { value: new THREE.Vector2(opts.nearFade ? opts.nearFade[0] : 9, opts.nearFade ? opts.nearFade[1] : 24) },
    uShadow: { value: new THREE.Vector4(0, 9, 13, 0) }, uShDir: { value: new THREE.Vector2(1, 0) }, uInv: { value: new THREE.Matrix4() },
    // (round 13) opts.lampAt [station, metres landward of the wall, 1]: where this fan stands on the wall, for the standards' light by
    // place (none given, or a last 0: no standard reaches it); opts.rim: the width, in the lace's own margin, over which the sheet
    // thins to nothing at its edge by lamplight (0: the solid sheet and its hard edge); opts.veil: how far a billow's opacity falls to its rim
    uLampP: { value: opts.lampAt ? new THREE.Vector3(opts.lampAt[0], opts.lampAt[1], opts.lampAt[2]) : new THREE.Vector3(0, 0, 0) }, uRimW: { value: opts.rim ?? 0 }, uVeil: { value: opts.veil ?? 0 },
  };
  const pause = () => ctx.yield?.();
  // opts.day: the sheet and the spray are compiled with their daylight block and given its strength. Without it (the lamp-lit
  // looks) no uniform and no define is added: their programs are the ones they always were
  const dayDef = opts.day != null ? { defines: { CANOPY_DAY: 1 } } : {};
  if (opts.day != null) U.uDay = { value: opts.day };
  const mat = (vs, fs, extra = {}, more = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...more }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });

  // the fan: three nested sheets in one draw
  // (round 13: by lamplight, opts.rim > 0, the sheet is blended and drawn after the road and its foam and before the spray and the
  // lamps' halos. It writes no depth then: a rim that is nearly nothing would cut whatever is drawn after it and lies behind it,
  // its own farther layers, the spray, a halo, along a hard line. By day it is the opaque sheet it always was)
  const sheet = new THREE.Mesh(tw ? tw.sheetGeo : await buildSheet(field, opts.layers || [0, 1, 2], opts.res || null, pause), mat(SHEET_VERT, SHEET_FRAG, { side: THREE.DoubleSide, ...dayDef, ...(opts.rim > 0 ? { transparent: true, depthWrite: false } : {}) }));
  sheet.frustumCulled = false; if (opts.rim > 0) sheet.renderOrder = 2.5; group.add(sheet);
  await ctx.yield?.();
  if (opts.mirror !== false) {
    const mirror = new THREE.Mesh(await buildSheet(field, [0], [56, 30], pause), mat(MIRROR_VERT, MIRROR_FRAG, { side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 }));
    mirror.frustumCulled = false; mirror.renderOrder = 3; group.add(mirror);
  }
  await pause();
  const parts = new THREE.Mesh(tw ? tw.partGeo : await buildParticles(field, rng, V, detail * (opts.particles ?? 1), opts.particles ?? 1, pause), mat(PART_VERT, PART_FRAG, { transparent: true, depthWrite: false, ...dayDef }));
  parts.frustumCulled = false; parts.renderOrder = 4; group.add(parts);
  const size = new THREE.Vector2();
  parts.onBeforeRender = (renderer, scene, camera) => { renderer.getDrawingBufferSize(size); U.uPix.value = 3.0 / Math.max(1, camera.projectionMatrix.elements[5] * size.y); };
  await ctx.yield?.();

  if (opts.stage !== false) {
    const B = makeBuilder();
    await buildWall(B, rng, pal, pause);
    await pause();
    for (let i = 0; i < LAMPS.length; i++) {
      buildLamp(B, rng, noise, LAMPS[i], 1.3, i === 1 ? { rz: 0.03, rx: -0.02 } : i === 2 ? { broken: true, rz: -0.012 } : { rz: 0.008 });
      await pause();
    }
    buildProps(B, rng, noise, pal);
    await ctx.yield?.();
    await buildRocks(B, rng, noise, pause);
    await pause();
    const stageM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.04 });
    const stageU = { uLampK: { value: opts.stageLamp ? new THREE.Color().copy(opts.stageLamp) : new THREE.Color(0, 0, 0) }, uNightAmb: { value: opts.stageAmb ? new THREE.Color().copy(opts.stageAmb) : new THREE.Color(0, 0, 0) } };
    stageM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, stageU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStageP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvStageP = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vStageP; uniform vec3 uLampK, uNightAmb;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec2 sd0 = vStageP.xz - vec2(-40., 1.3), sd1 = vStageP.xz - vec2(-8., 1.3), sd2 = vStageP.xz - vec2(24., 1.3);
          float pools = exp(-dot(sd0, sd0) / 40.) + exp(-dot(sd1, sd1) / 40.) + exp(-dot(sd2, sd2) / 40.);
          totalEmissiveRadiance += diffuseColor.rgb * (uLampK * pools * (1. - smoothstep(4.5, 6.5, vStageP.y)) * smoothstep(-2.5, 0., vStageP.y) + uNightAmb); }`);
    };
    stageM.customProgramCacheKey = () => 'malecon-stage-lamps';
    const stage = new THREE.Mesh(await B.build(pause), stageM);
    group.add(stage);
    await ctx.yield?.();
  }
  if (opts.sea !== false) {
    const sea = new THREE.Mesh(buildSeaGeo(), mat(PLANE_VERT, SEA_FRAG, { transparent: true }, { uSea: { value: 1 } }));
    sea.renderOrder = 1; sea.frustumCulled = false; group.add(sea);
  }
  if (opts.road !== false) {
    const road = new THREE.Mesh(buildRoadGeo(), mat(PLANE_VERT, ROAD_FRAG, { transparent: true }, { uSea: { value: 0 } }));
    road.renderOrder = 2; group.add(road);
  }

  // when falling water first comes below 2.2 m over the seaward lane (z 6.5..11.5), per 2 m of X
  const f7 = new Float64Array(7), q = { x: 0, y: 0, z: 0 }, lane = new Float32Array(31).fill(99);
  if (!opts.lite) for (let L = 0; L < 3; L++) for (let si = -30; si <= 30; si++) for (let ei = 0; ei <= 16; ei++) {
    if (ei === 0 && (si & 7) === 0) await pause();
    field(si / 30, ei / 16, L, f7);
    for (let age = 0.7; age < 7; age += 0.08) {
      fly(f7, age, KD, V.wx, V.wz, V.scale, q);
      if (q.y < 2.2) { const b = Math.round(q.x / 2) + 15; if (q.z > 6.5 && q.z < 11.5 && b >= 0 && b < 31) lane[b] = Math.min(lane[b], f7[6] + age); break; }
    }
  }
  const impactTauAt = (x) => { const b = clamp(Math.round(x / 2) + 15, 0, 30); return lane[b] > 90 ? Infinity : lane[b]; };
  let impactTau = 9; for (let b = 11; b <= 19; b++) impactTau = Math.min(impactTau, lane[b]);
  if (impactTau > 8) impactTau = 4.8;
  await ctx.yield?.();
  const uOf = (tau) => clamp((tau + T_PRE) / LIFE, 0, 1);

  let prog = null, sunL = null, hemiL = null, tries = 0, tau = 2.6;
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q4 = new THREE.Quaternion(), crest = new THREE.Vector3();
  const g7 = new Float64Array(7);
  const crestAtTau = (t, out) => { const f7 = g7; field(0.05, 0.12, 0, f7); fly(f7, t - f7[6], KD, V.wx, V.wz, V.scale, q); return out.set(q.x, Math.max(q.y, 0), q.z); };
  const fixedSun = opts.sunDir ? new THREE.Vector3().copy(opts.sunDir).normalize() : null;
  if (opts.sunColor) U.uSunCol.value.copy(opts.sunColor);
  if (opts.skyColor) U.uSky.value.copy(opts.skyColor);

  function update(dt, time, camera) {
    if (prog != null) tau = -T_PRE + prog * LIFE;
    else tau = (((time + (opts.phase ?? 2.1)) % LIFE) + LIFE) % LIFE - T_PRE;
    U.uTau.value = tau; U.uTime.value = time;
    group.updateWorldMatrix(true, false);
    U.uInv.value.copy(group.matrixWorld).invert();
    U.uRoadY.value = v1.setFromMatrixPosition(group.matrixWorld).y;
    // light: the scene's own sun and sky unless told otherwise
    if (!sunL && tries < 6) { tries++; let root = group; while (root.parent) root = root.parent; root.traverse((o) => { if (o.isDirectionalLight && !sunL) sunL = o; if (o.isHemisphereLight && !hemiL) hemiL = o; }); }
    if (fixedSun) U.uSun.value.copy(fixedSun);
    else if (sunL) { sunL.getWorldPosition(v1); sunL.target.getWorldPosition(v2); v1.sub(v2); if (v1.lengthSq() > 1e-8) U.uSun.value.copy(v1.normalize()); }
    if (sunL && !opts.sunColor) U.uSunCol.value.copy(sunL.color).multiplyScalar(sunL.intensity / Math.PI);
    if (hemiL && !opts.skyColor) U.uSky.value.copy(hemiL.color).lerp(hemiL.groundColor, 0.25).multiplyScalar(hemiL.intensity / Math.PI);
    // the fan's shadow on the road: crest projected down the sun's rays (in local space)
    crestAtTau(tau, crest);
    v2.copy(U.uSun.value).applyQuaternion(group.getWorldQuaternion(q4).invert());
    const k = crest.y / Math.max(v2.y, 0.14), hl = Math.hypot(v2.x, v2.z) || 1;
    U.uShadow.value.set(crest.x - v2.x * k * 0.6, crest.z - v2.z * k * 0.6, 12, smoothstep(0.3, 1.3, tau) * (1 - smoothstep(4.0, 5.4, tau)) * 0.85);
    U.uShDir.value.set(v2.x / hl, v2.z / hl);
  }

  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    object: group, radius: 20, height: 22, center: P(0, 8, 4), ground: false, groundY: 0,
    life: LIFE,
    timeline: { swell: 0, erupt: uOf(0), apex: uOf(1.5), overhead: [uOf(2.0), uOf(impactTau)], impact: uOf(impactTau), drained: 1 },
    setProgress(u) { prog = u == null ? null : clamp(u, 0, 1); },
    tauAt: (u) => -T_PRE + clamp(u, 0, 1) * LIFE, uAt: uOf, impactTauAt,
    crestAt: (u, target = new THREE.Vector3()) => crestAtTau(-T_PRE + clamp(u, 0, 1) * LIFE, target),
    uniforms: U, shared: { V, sheetGeo: sheet.geometry, partGeo: parts.geometry },
    anchors: {
      flyThrough: [P(60, 1.25, 9), P(30, 1.25, 9), P(0, 1.25, 9), P(-30, 1.25, 9), P(-60, 1.25, 9)],
      travelDir: P(-1, 0, 0), landward: P(0, 0, 1),
      erupt: P(0, -2.7, -1.6), crest: crestAtTau(2.4, new THREE.Vector3()), canopy: P(0, 1.25, 9), trigger: P(55, 1.25, 9),
      viewpoints: {
        approach: { position: P(55, 1.25, 9), target: P(0, 12, 4) },
        under: { position: P(5, 1.25, 9), target: P(-6, 15, 7) },
        seaward: { position: P(34, 9, -62), target: P(0, 10, 2) },
      },
      lamps: LAMPS.map((x) => P(x, 0.15, 1.3)), scuppers: SCUPPERS.map((x) => P(x, 0.25, 0)),
      wallTop: 1.02, seaLevel: -4, portalSeat: null,
    },
    update,
    dispose() {},
  };
}

// =====================================================================================================================
// ROUND 11. Three additions by places; nothing above this line is changed.
//
// THE FOOT OF A STREET FAN. The two fans that close the side street are seen front-on from it, and a sheet seen front-on
// with nothing in front of it reads as a slab. This gives a fan what stands in front of it on the street's side, in the
// fan's own local space (+Z landward; the seaward pavement is z 0..5, its kerb 5.25):
//   a cloud of spray rolling in off the wall at its foot, whose top climbs to a third of the fan's own crest height while
//     the fan stands (billows and mist, born from 0.15 to 4.6 s after the burst, each thrown to its own height);
//   a curtain of heavy drops shed from the overhanging sheet (from 0.4 to 0.8 of its crest height), every one aimed to land
//     on the seaward pavement between the fan and the junction (z 0.6..4.8), with the splashes of those that land in its
//     seaward half. They fall under the canopy and in front of the sheet's root, which stands at z -1.7..1 below 6 m.
// It is one more mesh of the fan's own particles: the same buffers' layout, the fan's own particle material (so its
// clock, its scale, its wind and its light are the fan's, with no line of their own), added to the fan's own group (so
// it is drawn exactly when the fan is). Dice: a stream of its own; every draw of a particle (and of the splash a drop may
// make) is taken before any bound or test is applied, so no bound deals the rest anew.
export function buildFootSpray(h, rng) {
  const own = h.object.children.find((c) => c.isMesh && c.geometry === h.shared.partGeo);
  const U = h.uniforms, sc = U.uScale.value, wx = U.uWind.value.x, wz = U.uWind.value.y, crestY = h.anchors.crest.y, Hc = crestY / 3;
  const P = [], g = () => rng.gauss();
  const add = (x, y, z, vx, vy, vz, te, k, size, type, life, alpha, r = rng()) => { P.push(x, y, z, vx, vy, vz, te, k, size, type, r, life, alpha); };
  const E = (k, t) => (1 - Math.exp(-k * t)) / k;
  // the launch speed that carries a particle of drag k to a rise of `up` metres (the shader's own flight, scaled by the fan)
  const riseOf = (v, k) => { const ty = G / k, r = ty / (v + ty), t = Math.log(1 / r) / k; return ((v + ty) * (1 - r) / k - ty * t) * sc; };
  const launch = (up, k) => { let a = 0, b = 60; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (riseOf(m, k) < up) a = m; else b = m; } return (a + b) / 2; };
  // the landward speed at birth that leaves a particle no farther landward than zEnd when it dies (wind carries it there)
  const vzCap = (z0, k, life, zEnd) => wz + ((zEnd - z0) / sc - wz * life) / E(k, life);
  // the cloud's billows: round lobes of white water that rise off the coping and roll in over the pavement
  for (let i = 0, n = 110; i < n; i++) {
    const s = -1 + (2 * (i + rng())) / n, te = rng.range(0.15, 4.4), y0 = rng.range(0.9, 1.5), z0 = rng.range(0.15, 1.6), k = KD * rng.range(1.0, 1.2), life = rng.range(1.25, 1.7);
    const size = rng.range(0.9, 1.9) * (1 - 0.3 * Math.abs(s * s * s)), light = rng.range(0.45, 1), vx = g() * 0.8, vzD = rng.range(-2.5, 0.5), top = rng.range(0.7, 1);
    const up = Math.max(0.3, 1.2 + (Hc - 1.2) * (0.3 + 0.7 * te / 4.4) * top - y0);
    add(s * 12.5, y0, z0, vx, launch(up, k), Math.min(vzD, vzCap(z0, k, life, 4.8)), te, k, size, 4, life, light);
  }
  // its mist: soft veils between the lobes
  for (let i = 0, n = 50; i < n; i++) {
    const s = -1 + (2 * (i + rng())) / n, te = rng.range(0.1, 4.6), y0 = rng.range(1.1, 1.5), z0 = rng.range(-0.8, 0.6), k = rng.range(2.2, 3.4), life = rng.range(1.3, 2.0);
    const size = rng.range(1.6, 3.0), alpha = rng.range(0.1, 0.2), vx = g(), vzD = rng.range(-1, 1), top = rng.range(0.6, 1);
    const up = Math.max(0.3, 1.2 + (Hc - 1.2) * (0.3 + 0.7 * te / 4.6) * top - y0);
    add(s * 13.5, y0, z0, vx, launch(up, k), Math.min(vzD, vzCap(z0, k, life, 4.8)), te, k, size, 3, life, alpha);
  }
  // the curtain: heavy drops shed from the overhanging sheet (half the drag of the sheet's own water, so they fall steeply and
  // the wind carries them little). Each is given where it lands, and starts where the flight has to shed it for that
  for (let i = 0, n = 420; i < n; i++) {
    const s = -1 + (2 * (i + rng())) / n, zt = rng.range(0.6, 4.8), y0 = rng.range(0.4, 0.8) * crestY, vx = g() * 0.8, vy = rng.range(-2, 0), vz = rng.range(-1, 0.5);
    const k = KD * rng.range(0.45, 0.6), te = rng.range(0.6, 5.6), size = 0.05 + 0.09 * Math.pow(rng(), 2), hop = rng(), ty = G / k;
    const sx = g() * 2.2, sy = rng.range(2, 6.5), sz = 1.5 + g() * 1.2, ss = rng.range(0.03, 0.09), sr = rng();
    let a = 0.1, b = 8; for (let j = 0; j < 30; j++) { const m = (a + b) / 2; if (y0 + ((vy + ty) * E(k, m) - ty * m) * sc > 0.15) a = m; else b = m; }
    const tf = (a + b) / 2, e = E(k, tf);
    add(s * 13 - ((vx - wx) * e + wx * tf) * sc, y0, zt - ((vz - wz) * e + wz * tf) * sc, vx, vy, vz, te, k, size, 0, tf / 0.55 + 0.01, 1);
    if (hop < 0.45 && zt < 2.2) add(s * 13, 0.2, zt, sx, sy, sz, te + tf, 1.3, ss, 2, 1.1, 1, sr);
  }
  const n = P.length / 13, pos = new Float32Array(n * 12), v0 = new Float32Array(n * 12), ap = new Float32Array(n * 16), as = new Float32Array(n * 12), ac = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
  const CX = [-1, 1, 1, -1], CY = [-1, -1, 1, 1];
  for (let i = 0; i < n; i++) {
    const b = i * 13;
    for (let c = 0; c < 4; c++) {
      const o = i * 4 + c;
      pos[o * 3] = P[b]; pos[o * 3 + 1] = P[b + 1]; pos[o * 3 + 2] = P[b + 2];
      v0[o * 3] = P[b + 3]; v0[o * 3 + 1] = P[b + 4]; v0[o * 3 + 2] = P[b + 5];
      ap[o * 4] = P[b + 6]; ap[o * 4 + 1] = P[b + 7]; ap[o * 4 + 2] = P[b + 8]; ap[o * 4 + 3] = P[b + 9];
      as[o * 3] = P[b + 10]; as[o * 3 + 1] = P[b + 11]; as[o * 3 + 2] = P[b + 12];
      ac[o * 2] = CX[c]; ac[o * 2 + 1] = CY[c];
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aV0', new THREE.BufferAttribute(v0, 3));
  geo.setAttribute('aP', new THREE.BufferAttribute(ap, 4));
  geo.setAttribute('aS', new THREE.BufferAttribute(as, 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(ac, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  // (everything it flies through lies within x -16.5..16.5, y 0..0.8 of the crest height (20 m at most), z -5.3..5: it is
  // left out of the draw when that is out of view, which the fan's own spray, flying 70 m, cannot be)
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 9, 0), 26);
  const mesh = new THREE.Mesh(geo, own.material);
  mesh.renderOrder = own.renderOrder;
  h.object.add(mesh);
  return { object: mesh, count: n, triangles: n * 2, cloudTop: Hc, crestY };
}

// THE TONGUE IN THE STREET MOUTH. The water of the same two fans, fallen on the road, is live's road foam: it runs landward
// over the carriageway at 6.2 m/s times the fan's size from 1.5 s after the burst, and live's carriageway ends at z = 23 (z:
// metres landward of the wall), so there the sheet is cut. This carries it on: across the last of the junction and 3.5 to
// 5 m (times the fan's size) into the mouth of the side street (the street's axis is x 0, its mouth z 27.25), and back.
// One flat quad just over the roadway (pavements and kerbs stand above it and hide what lies under them), world space.
// For each fan: the front keeps live's speed and start; the lace rides in with it at live's 5.5 m/s and, once the front
// has stopped, both drain back at live's 2.2 m/s; it comes and goes with live's own envelope (in over 1.4..2.6 s, away
// over 5.6..8.6 s), lit as live's foam is (sun on the carriageway under the drifting cloud shadows and the cars, none in
// the street). It begins softly over the last four metres of the carriageway, so no ruled edge shows where live's ends.
// o: { tau: [uTauA, uTauB] (the two fans' own clock uniforms), fans: [[x, scale], [x, scale]], on (Vector2 uniform),
//      sunCol, amb, shade, time, ldir, car (the world's own uniforms), lamp (the standards' light on foam, a colour uniform) }
const TONGUE_FRAG = /* glsl */`
uniform float uTauA, uTauB, uShade, uTime; uniform vec2 uOn; uniform vec4 uFans, uCar[14]; uniform vec3 uSunCol, uAmb, uLDir, uLamp;
varying vec3 vW;
#include <fog_pars_fragment>
${NOISE}${LAMP_GLSL}
float tongue(float tau, float xc, float k, float sd){
  float x = vW.x, z = vW.z;
  float zmax = 27.25 + k * (3.5 + 1.5 * vn(vec2(x * 0.45, 7.3 + sd)));
  float ts = 1.5 + 31. / (6.2 * k);
  float back = 2.2 * max(tau - ts, 0.);
  float front = min(6.2 * k * (tau - 1.5), zmax) - back;
  float flowS = 5.5 * min(tau, ts) - back;
  float env = smoothstep(1.4, 2.6, tau) * (1. - smoothstep(5.6, 8.6, tau));
  float hw = mix(7.5, 4.6, smoothstep(14., 27.25, z)) + 1.2 * (vn(vec2(z * 0.35, sd + 3.)) - 0.5);
  float side = 1. - smoothstep(hw - 2.2, hw, abs(x));
  float feed = 1. - smoothstep(11. * k, 31. * k, abs(x - xc));
  float inS = 1. - smoothstep(front - 4., front, z);
  float lacef = veins(vec2(x * 0.5 + sd, (z - flowS) * 0.3));
  float edge = 1. - smoothstep(0., 1.6, abs(z - front));
  return clamp(inS * lacef * 0.8 + edge * (0.2 + 0.7 * lacef), 0., 1.) * env * side * feed * smoothstep(19., 23., z);
}
void main(){
  float foam = max(tongue(uTauA, uFans.x, uFans.y, 0.) * uOn.x, tongue(uTauB, uFans.z, uFans.w, 5.) * uOn.y);
  if (foam < 0.004) discard;
  vec2 p = vW.xz; float occ = 0.;
  for (int i = 1; i < 14; i++) { vec4 c = uCar[i]; vec2 fw = vec2(cos(c.z), sin(c.z)), rel = p - c.xy + uLDir.xz * 0.5;
    occ = max(occ, (1. - smoothstep(1.7, 2.9, abs(dot(rel, fw)))) * (1. - smoothstep(0.6, 1.25, abs(dot(rel, vec2(-fw.y, fw.x)))))); }
  float sun = (1. - step(23., vW.z)) * (1. - uShade * smoothstep(0.42, 0.62, fbm(p * 0.012 + uTime * vec2(0.1, 0.055)))) * (1. - 0.85 * occ);
  // (round 13: and the wall's standards light it by place; at the junction the station is -x and z is the metres landward of the wall)
  gl_FragColor = vec4(vec3(0.92, 0.96, 0.95) * (uSunCol * (0.8 * sun + 0.1) + uAmb * 1.1 + uLamp * wallLamps(-vW.x, vW.z, 0.)), foam);
  #include <fog_fragment>
}`;
export function buildStreetTongue(o) {
  const g = new THREE.BufferGeometry(), y = 0.02;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-9, y, 18.5, 9, y, 18.5, 9, y, 33.5, -9, y, 33.5], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
  g.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTauA: o.tau[0], uTauB: o.tau[1], uOn: o.on, uFans: { value: new THREE.Vector4(o.fans[0][0], o.fans[0][1], o.fans[1][0], o.fans[1][1]) },
      uSunCol: o.sunCol, uAmb: o.amb, uShade: o.shade, uTime: o.time, uLDir: o.ldir, uCar: o.car, uLamp: o.lamp || { value: new THREE.Color(0, 0, 0) } },
    vertexShader: /* glsl */`varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: TONGUE_FRAG, fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(g, material); mesh.renderOrder = 1.6;
  return mesh;
}

// THE BOUGAINVILLEA. One wall of one house: from its roof terrace a cascade of magenta bracts falls over the side wall
// that faces the palm square. Made of the flora kit's own pieces (hanging vines with leaf sprays and dangling strands,
// low bushes for the mound on the terrace) in the kit's wind material, so it tosses in the same wind as the palms; the
// sway of every vertex of the cascade is then set by how far it hangs below the roof's edge (fixed at the edge, half a
// metre at nine metres). The fallen bracts are small flat cards on the square's paving whose "sway" is a slide along the
// ground, so they shift downwind as each gust front passes, and flutter.
// LOCAL FRAME of the house (o.matrix places it): +X along its frontage, +Z out toward the road, the side wall is the
// plane x = 0 from z = -depth to 0 and faces -X; the roof is y = H.
// o: { flora, merge, rng, matrix, H, depth, magenta: [leaf, light, dark], pavementY, pause (awaited between its pieces),
//      glow (the share of its own colour it gives back under the lamps at night: the kit's leaves take no lamp light) }
export async function buildCascade(o) {
  const { flora, rng, H, depth } = o, M = o.matrix, v = new THREE.Vector3(), W = (x, y, z) => { v.set(x, y, z).applyMatrix4(M); return [v.x, v.y, v.z]; };
  const top = H + 0.35, z0 = -Math.min(depth - 2.3, 9.7), z1 = -0.5, wide = z1 - z0, parts = [];
  const bract = { leaf: o.magenta[0], leafLight: o.magenta[1], leafDark: o.magenta[2], stem: '#4a3c2a' }, green = { leaf: '#3f7a30', leafLight: '#a0c050', leafDark: '#1f4526', stem: '#4a3c2a' };
  // two curtains of vines down the wall, one against it and one half a metre proud; every fourth vine is in green leaf
  const spansB = [], spansG = [];
  for (let lay = 0; lay < 2; lay++) for (let i = 0, n = 18; i < n; i++) {
    const z = z0 + wide * (i + 0.5 + rng.range(-0.3, 0.3)) / n, fall = (4.2 + 2.0 * Math.sin(Math.PI * (i + 0.5) / n)) * rng.range(0.9, 1), out = 0.18 + lay * 0.32 + rng.range(0, 0.12), dz = rng.range(-0.5, 0.5);
    ((i + lay * 2) % 4 === 3 ? spansG : spansB).push([W(-out * 0.6, top, z), W(-out - rng.range(0, 0.2), top - fall, z + dz)]);
  }
  parts.push(flora.vineGeometry({ rng, spans: spansB, sag: 0.03, thickness: 0.05, leaves: 1.25, hangers: 1.3, detail: 1, ...bract, flower: o.magenta[1] }));
  await o.pause?.();
  parts.push(flora.vineGeometry({ rng, spans: spansG, sag: 0.03, thickness: 0.05, leaves: 1.25, hangers: 0.8, detail: 1, ...green, flower: o.magenta[0] }));
  await o.pause?.();
  // how far each vertex of the cascade hangs below the roof's edge sets its sway
  for (const geo of parts) { const p = geo.attributes.position, w = geo.attributes.wind; for (let i = 0; i < p.count; i++) w.setX(i, 0.04 + 0.46 * Math.pow(Math.min(1, Math.max(0, top - p.getY(i)) / 9), 1.4)); }
  // the mound on the terrace it grows from: five low bushes in bract along the roof's edge over that wall
  for (let i = 0; i < 5; i++) {
    const b = flora.bushGeometry({ rng, size: rng.range(1.5, 2.0), detail: 0, ...bract, bark: '#4a3c2a', flowers: 1, flowerColor: o.magenta[1] }), p = W(rng.range(0.5, 1.3), H - 0.1, z0 + wide * (i + 0.5 + rng.range(-0.25, 0.25)) / 5);
    b.applyMatrix4(new THREE.Matrix4().makeRotationY(rng() * Math.PI * 2).setPosition(p[0], p[1], p[2])); parts.push(b);
  }
  await o.pause?.();
  // fallen bracts on the square's paving, thick at the wall's foot and thinning over six metres
  { const P = [], N = [], C = [], Wd = [], T = [], I = [], c0 = new THREE.Color(o.magenta[0]), c1 = new THREE.Color(o.magenta[1]), c = new THREE.Color();
    for (let i = 0, n = 90; i < n; i++) {
      const x = -0.3 - 6 * Math.pow(rng(), 1.6), z = rng.range(-depth + 0.5, 1.5), r = rng.range(0.07, 0.13), a = rng() * Math.PI * 2, t = rng(), k = rng.range(0.75, 1.1), sw = 0.25 * rng.range(0.6, 1.2), b = P.length / 3;
      c.copy(c0).lerp(c1, t).multiplyScalar(k);
      for (let q = 0; q < 4; q++) { const aa = a + q * Math.PI / 2, rr = q % 2 ? r * 0.6 : r, w = W(x + Math.cos(aa) * rr, o.pavementY + 0.04, z + Math.sin(aa) * rr); P.push(w[0], w[1], w[2]); N.push(0, 1, 0); C.push(c.r, c.g, c.b); Wd.push(sw, 1.2, 1, 0); T.push(0.875, 0.75); }
      I.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    geo.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2)); geo.setIndex(I);
    parts.push(geo);
  }
  const tris = parts.map((q) => q.index.count / 3), geometry = o.merge(parts);
  if (o.glow > 0) { const w = geometry.attributes.wind; for (let i = 0; i < w.count; i++) w.setW(i, o.glow); }
  geometry.computeBoundingSphere(); geometry.boundingSphere.radius += 1.5;
  return { geometry, triangles: geometry.index.count / 3, vines: tris[0] + tris[1], mound: tris.slice(2, 7).reduce((a, b) => a + b, 0), bracts: tris[7], top, spans: spansB.length + spansG.length };
}

// =====================================================================================================================
// ROUND 12. Four additions by places; nothing above this line is changed. Each new thing has a stream of its own.
//
// RIDING (the owner's test). A gull or a person by the wall may know that the fan at its own place is about to burst or has
// fallen only by asking that fan: the tau that live's update gives the fan (seconds since its burst, on the fan's own clock)
// is handed in, and the fan's own functions say what it means. No station of the car, no u and no time is typed here.
export const fanLiftCue = (h, lead) => h.tauAt(h.timeline.erupt) - lead;      // the fan's tau at which it is `lead` seconds short of its burst
export const fanDrained = (h) => h.tauAt(h.timeline.drained);                 // the fan's tau at which its water has fallen

// WHERE A FAN'S WATER PASSES: its own sheet (the buffers the fan is drawn from: root, launch velocity, emission time) flown by
// the fan's own flight law (fly(), the closed form its shaders use) with its own scale and wind, sampled every 0.04 s, and
// laid on a 1 m grid of the fan's local ground (x along the wall, z landward) wherever water is higher than `above` (the
// coping, 1.02 m). over(x, z, r) says whether any water passes within r metres of that place; strip() gives the reach along
// the wall line itself. Nothing is drawn and no stream is touched.
export function fanFootprint(h, o = {}) {
  const g = h.shared.sheetGeo, P = g.attributes.position, V0 = g.attributes.aV0, T = g.attributes.aT, U = h.uniforms;
  const sc = U.uScale.value, wx = U.uWind.value.x, wz = U.uWind.value.y, above = o.above ?? 1.02;
  const X0 = -40, Z0 = -8, nx = 80, nz = 40, cells = new Uint8Array(nx * nz), f = new Float64Array(7), q = { x: 0, y: 0, z: 0 };
  const stride = Math.max(1, Math.ceil(P.count / (o.samples || 1400)));
  for (let i = 0; i < P.count; i += stride) {
    f[0] = P.getX(i); f[1] = P.getY(i); f[2] = P.getZ(i); f[3] = V0.getX(i); f[4] = V0.getY(i); f[5] = V0.getZ(i); f[6] = T.getX(i);
    for (let age = 0.04; age < 7; age += 0.04) {
      fly(f, age, KD, wx, wz, sc, q);
      if (q.y < -4.4 || (q.z > 0.05 && q.y < 0.04)) break;      // below these the sheet's own shader draws no water
      if (q.y < above) continue;
      const cx = Math.floor(q.x - X0), cz = Math.floor(q.z - Z0);
      if (cx >= 0 && cx < nx && cz >= 0 && cz < nz) cells[cz * nx + cx] = 1;
    }
  }
  const at = (x, z) => { const cx = Math.floor(x - X0), cz = Math.floor(z - Z0); return cx >= 0 && cx < nx && cz >= 0 && cz < nz && cells[cz * nx + cx] === 1; };
  return {
    over(x, z, r = 0) { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dz * dz <= r * r + 0.01 && at(x + dx, z + dz)) return true; return false; },
    // the reach along a line z = const (say the wall top): [first x, last x] with water over it, or null
    strip(z) { let a = null, b = null; for (let x = X0; x < X0 + nx; x++) if (at(x + 0.5, z)) { if (a == null) a = x; b = x + 1; } return a == null ? null : [a, b]; },
  };
}

// A STANDING GULL out of the kit's flying one. foldWings(geometry, S) takes the geometry of ONE flock (the kit builds a fresh
// one for each flock, so no other flock is touched) and (1) lays each wing along the flank: a wing vertex is known by its side
// (aAnim.y), its metres out from the shoulder (aAnim.x) and its place across the chord (aAnim.z); it goes to the same share of
// a folded wing whose tip crosses just behind the tail, as a gull's does. The wing weights are then cleared, so the kit's wing
// beat leaves it alone; the head gets a small weight of the tail's kind with the other sign, so the kit's slow tail swing
// lifts the head as it dips the tail (a bird rocking on its feet in the wind). (2) It stands the bird up: the body pitched 18
// degrees head-up about its middle, on two legs one and a half girths long with a toe forward, in the kit's own leg colour
// (the kit's gull trails no legs in flight, so a standing one needs them). S: the kit's own gull numbers. Returns how high the
// body's axis stands above the feet, for a bird of scale 1.
export function foldWings(geometry, S) {
  const P = geometry.attributes.position, N = geometry.attributes.normal, A = geometry.attributes.aAnim, L = S.len, G = S.girth, W = S.span, wz = 0.16 * L + S.chord * 0.35;
  const tipZ = -0.5 * L + 0.1 * L - S.tail - 0.05 * L;                    // 3 cm of the body's length behind the tail's end
  const ca = Math.cos(0.314), sa = Math.sin(0.314);
  for (let i = 0; i < P.count; i++) {
    const side = A.getY(i);
    if (side) {
      const t = Math.min(1, A.getX(i) / W), tr = A.getZ(i);
      P.setXYZ(i, side * G * (0.98 - 0.8 * t + 0.15 * Math.sin(Math.PI * tr) * (1 - t)), G * (0.82 - 0.31 * t) - tr * 1.25 * G * (1 - 0.75 * t), wz + (tipZ - wz) * t);
      N.setXYZ(i, side * 0.86, 0.5, 0); A.setXYZW(i, 0, 0, 0, 0);
    } else if (P.getZ(i) > 0.29 * L) A.setW(i, -0.7 * Math.min(1, (P.getZ(i) - 0.29 * L) / (0.17 * L)));
    const y = P.getY(i), z = P.getZ(i), ny = N.getY(i), nz = N.getZ(i);
    P.setY(i, y * ca + z * sa); P.setZ(i, z * ca - y * sa); N.setY(i, ny * ca + nz * sa); N.setZ(i, nz * ca - ny * sa);
  }
  // the legs: two three-sided shanks from under the belly to the stone, each with a toe
  const leg = 1.5 * G, hip = -0.6 * G, foot = hip - leg, r = 0.11 * G, c = new THREE.Color(S.legC), add = [], tri = [], n0 = P.count;
  for (const sx of [-1, 1]) {
    const x = sx * 0.38 * G, z = -0.03 * L, b = n0 + add.length;
    for (const yy of [hip + 0.3 * G, foot]) for (let k = 0; k < 3; k++) { const a = k * 2.0944; add.push([x + Math.cos(a) * r, yy, z + Math.sin(a) * r, Math.cos(a), 0, Math.sin(a)]); }
    for (let k = 0; k < 3; k++) { const k1 = (k + 1) % 3; tri.push(b + k, b + k1, b + 3 + k, b + k1, b + 3 + k1, b + 3 + k); }
    const t0 = n0 + add.length; add.push([x - 2.2 * r, foot + 0.004, z, 0, 1, 0], [x + 2.2 * r, foot + 0.004, z, 0, 1, 0], [x, foot + 0.004, z + 0.6 * G, 0, 1, 0]); tri.push(t0, t0 + 1, t0 + 2);
  }
  for (const k in geometry.attributes) {
    const at = geometry.attributes[k]; if (at.isInstancedBufferAttribute) continue;
    const sz = at.itemSize, arr = new Float32Array((n0 + add.length) * sz); arr.set(at.array);
    add.forEach((v, j) => { const o = (n0 + j) * sz; if (k === 'position') arr.set(v.slice(0, 3), o); else if (k === 'normal') arr.set(v.slice(3, 6), o); else if (k === 'color') arr.set([c.r, c.g, c.b].slice(0, sz), o); });
    geometry.setAttribute(k, new THREE.BufferAttribute(arr, sz));
  }
  const ix = Array.from(geometry.index.array); geometry.setIndex(ix.concat(tri));
  return -foot;
}

// THE LOOP A GROUP FLIES when its fan sends it up, in the group's own frame: the origin where it stands on the coping, +Z into
// the wind, +X to the side that `d` (+1 or -1) says is away from the fan's middle, metres. Up and out to seaward off the wall
// (a bird takes off into the wind), back over the wall above head height, one and a half turns of a wheel 7 m wide whose
// middle is 12 m downwind (over the carriageway: the wind blows within 35 degrees of straight landward all round this bay),
// 8 to 10.5 m up, then off the wheel in one glide across the carriageway to the fan's side, 13 m out along the wall and not
// under 4.95 m on the way, one round turn there on this frame's seaward half (z over 0), down along the wall from the fan's
// side and the last metres along the coping itself, turning into the wind. Closed: the last point runs on into the first.
// Nothing here knows the car, the eye or a time.
// (flock cure 2) THE WAY DOWN KEEPS 2.0 M OF CLEAR AIR FROM THE FLOWN LINE, BY PLACE: for a group anywhere on the coping from
// s 20 to s 600, either turn d, the wall lying up to 31 degrees either way across this frame (the wind is one, the wall turns
// under it), every bird at every mix of its standing and its loose place, with its wander's box and its ball. The flown line
// runs 9.3 m landward of the coping at the least, and landward is anywhere within those 31 degrees of -z: so the course keeps
// 4.95 m or more until z is over 0 and comes down there in a turn (points 13 to 15: one point more than the two it had), no
// longer in a slant over the lane. Point 12 came in so that the loop is under a tenth longer (113.0 m for 103.6). The first
// twelve points and the last two are as they were; the least clear air, 2.05 m, is at the landing point [-5.5, 1.9, -0.3]
// itself, where the wall bears 57 degrees (s 560 and on) and d is -1.
export function gullLoop(d) {
  return [[0, 0, 0], [0.3, 1.0, 0.9], [1.5, 2.6, 0.6], [4, 5, -3], [7, 7.5, -8], [5, 9.5, -17], [-2, 10.5, -19], [-7, 10, -13], [-4, 9.5, -6.5], [3, 9.5, -5.5],
    [7, 9, -11], [4, 8, -17.5], [-4, 7, -15.5], [-12.8, 4.95, 0.3], [-11.1, 4.1, 2.6], [-8.1, 3.1, 2.3], [-5.5, 1.9, -0.3], [-1.6, 0.5, -0.3]].map((p) => [p[0] * d, p[1], p[2]]);
}
// the share of the loop flown at share x of the time in the air, and its slope: the pace is 1 - 0.8 cos^6(pi x), so a bird
// leaves the wall and comes back to it at a fifth of its middle pace and nowhere flies faster than 1.33 times its mean
export function loopShare(x, out = [0, 0]) {
  x = Math.min(1, Math.max(0, x));
  const a = 0.8, th = 2 * Math.PI * x, s = Math.sin(th), c2 = 0.5 + 0.5 * Math.cos(th);
  const I = (x + 3 * s / (2 * Math.PI) + 3 * (x / 2 + Math.sin(2 * th) / (8 * Math.PI)) + (s - s * s * s / 3) / (2 * Math.PI)) / 8;
  out[0] = (x - a * I) / (1 - a * 5 / 16); out[1] = (1 - a * c2 * c2 * c2) / (1 - a * 5 / 16);
  return out;
}

// =====================================================================================================================
// ROUND 14. Two additions; nothing above this line is changed and no stream is touched.
//
// HOW TALL A FAN STANDS AND HOW FAR ITS WATER REACHES, AT ANY SIZE. A fan's water is its sheet's roots plus its flight times
// the fan's size (fly(), the closed form its shaders use): so the same buffers say what the fan would do at another size.
// fanExtent(h) reads every vertex of the sheet the fan is drawn from (and, with { spray: true }, every drop, finger jet and billow
// of its spray, each with its own drag and for its own life), and answers for a size sc:
//   topAt(sc)            the sheet's highest water (each vertex at the top of its own climb, in closed form)
//   scaleForTop(y)       the size at which the sheet's highest water stands at y
//   at(sc, above)        { top, land / sea: the most landward and the most seaward water (the fan's own local z: + toward where
//                          it leans), half: the widest water either side of its middle }, of the water at or over the height
//                          `above` (the fan's local y; the coping is 1.02), every tenth of a second of its flight
//   scaleForLand(z, a)   the largest size at which no water at or over the height a stands landward of z
// Nothing is drawn; no stream, no eye, no clock.
export function fanExtent(h, o = {}) {
  const U = h.uniforms, wx = U.uWind.value.x, wz = U.uWind.value.y, sg = h.shared.sheetGeo.attributes, pg = o.spray ? h.shared.partGeo.attributes : null;
  const ns = sg.position.count, DT = 0.1, NA = 70, tyS = -G / KD, ES = new Float32Array(NA + 1);
  for (let k = 1; k <= NA; k++) ES[k] = (1 - Math.exp(-KD * k * DT)) / KD;
  // every vertex of the sheet: where it starts and how high one unit of scale lifts it (closed form: where its climb stops)
  const scaleForTop = (y) => {
    let s = 1e9;
    for (let i = 0; i < ns; i++) { const vy = sg.aV0.getY(i); if (vy <= 0) continue; const a = Math.log((vy - tyS) / -tyS) / KD, up = (vy - tyS) * (1 - Math.exp(-KD * a)) / KD + tyS * a, q = (y - sg.position.getY(i)) / up; if (q < s) s = q; }
    return s;
  };
  const topAt = (sc) => {
    let t = -1e9;
    for (let i = 0; i < ns; i++) { const vy = sg.aV0.getY(i), py = sg.position.getY(i); if (vy <= 0) { if (py > t) t = py; continue; } const a = Math.log((vy - tyS) / -tyS) / KD, y = py + ((vy - tyS) * (1 - Math.exp(-KD * a)) / KD + tyS * a) * sc; if (y > t) t = y; }
    return t;
  };
  // every tenth of a second of every element's flight: fn(start x, y, z, and what one unit of scale adds to each)
  const each = (fn) => {
    for (let i = 0; i < ns; i++) {
      const px = sg.position.getX(i), py = sg.position.getY(i), pz = sg.position.getZ(i), ax = sg.aV0.getX(i) - wx, ay = sg.aV0.getY(i) - tyS, az = sg.aV0.getZ(i) - wz;
      for (let k = 1; k <= NA; k++) { const a = k * DT, E = ES[k]; fn(px, py, pz, ax * E + wx * a, ay * E + tyS * a, az * E + wz * a); }
    }
    if (!pg) return;
    for (let i = 0, n = pg.position.count; i < n; i += 4) {
      const type = pg.aP.getW(i); if (!(type < 0.5 || type > 3.5)) continue;      // drops, finger jets and billows; not mist, not the splashes laid where water lands
      const kd = pg.aP.getY(i), life = pg.aS.getY(i), ty = -G / kd, px = pg.position.getX(i), py = pg.position.getY(i), pz = pg.position.getZ(i), ax = pg.aV0.getX(i) - wx, ay = pg.aV0.getY(i) - ty, az = pg.aV0.getZ(i) - wz;
      for (let k = 1; k <= NA && k * DT < life; k++) { const a = k * DT, E = (1 - Math.exp(-kd * a)) / kd; fn(px, py, pz, ax * E + wx * a, ay * E + ty * a, az * E + wz * a); }
    }
  };
  const at = (sc, above = 1.02) => {
    let land = -1e9, sea = 1e9, half = 0;
    each((px, py, pz, dx, dy, dz) => { if (py + dy * sc < above) return; const z = pz + dz * sc, x = Math.abs(px + dx * sc); if (z > land) land = z; if (z < sea) sea = z; if (x > half) half = x; });
    return { top: topAt(sc), land, sea, half };
  };
  // the largest scale at which nothing of it stands at or above `above` landward of z (each sample: the scale that carries it to z,
  // or the scale that lifts it to `above`, whichever is the greater; the least of those)
  const scaleForLand = (z, above = 1.02) => {
    let s = 1e9;
    each((px, py, pz, dx, dy, dz) => { if (dz <= 0 || dy <= 0) return; const q = Math.max((z - pz) / dz, (above - py) / dy); if (q < s) s = q; });
    return s;
  };
  return { at, topAt, scaleForTop, scaleForLand };
}
// A FAN GIVEN ITS SIZE AFTER IT IS BUILT (a size that is a rule of its own sheet can only be known once the sheet is made):
// the size its shaders fly it with and the size its crest and shadow are worked out with. Its particles' buffers are not
// touched (the far sisters already share one fan's buffers at four sizes).
export function fanResize(h, scale) { h.uniforms.uScale.value = scale; h.shared.V.scale = scale; return scale; }
