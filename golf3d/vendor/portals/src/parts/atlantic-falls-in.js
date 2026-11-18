// Hero set piece for "atlantic-falls-in" (Where the Sea Ends, 5.33 million years ago): THE LIP AND THE WALL.
// The Atlantic irons flat into a glass-green tongue, tips down a convex ramp through five standing waves that
// hold still while the water tears through them, beside a sunlit limestone wall whose old tide line stays dead
// level at y 8 while the sea that drew it falls away; a pillow of white water climbs a buttress; the wall ends
// in the prow of the Rock, and round it the shaded east face.
//
// COORDINATES. Local x = brief x - 520 (XO): +x is east (downstream), y 0 is the old sea level, north is -z.
//   The camera line of the brief starts at local (-520, 8, 0). "Front" (+z) is the sunlit south face of the wall.
// SIZE. Water ribbon: local x -480..+560, from the wall line out 1,000 m south. Wall and Rock: 1,200 m of face,
//   crest +60 (west) .. +128 (close pass) .. +260 (the Rock), foot down to -300. radius 330, height 560 (-300..+260).
// OPTS. palette (brief's 7 hex strings: cobalt, glass green, white, honey rock, bone rock, haze blue, sun gold),
//   detail 0.6..1 (thins the crest and pillow spray only), gannets (count of the hero's own skein, default 7; false = none),
//   sunDir [x,y,z] toward the sun, sunColor, skyColor, bounceColor, shade ('#5F7FA8', the tone the shaded east face settles to).
// LIGHT. No three.js lights are read: every material is a ShaderMaterial lit by shared uniforms (one warm key
//   from behind-right, blue sky fill, ochre bounce from the basin). Call hero.setLight({ sunDir, sunColor, sunIntensity,
//   sky, bounce }) to match your scene. All shaders write linear HDR and honour scene.fog (Fog or FogExp2).
//   Glitter peaks about 4, lit spray rims about 1.3, white water albedo 0.78 with blue shadows.
// ANCHORS (all local space):
//   flyThrough   ordered [x,y,z] points of the brief's camera line (y 8 throughout); clearance is 9 m or more from the
//                wall (closest between local x -40 and +180) and 15 m+ over the first standing crest
//   portalSeat   { position, facing } the ring's centre and the direction it faces (back along the line), in blue shade
//   firstCrest, pillow, caveMouth, prowTip, rockCrest, tideLine (y of the weed/barnacle boundary)
//   ledges       [{ position, normal, size, low, colony }] flat spots above the tide line for palms, olives, pines and perched gannets;
//                low: a notch cut INTO the face along the close pass (y 11.5 to 21); colony: the long eye-level ledge at brief x 497
//   viewpoints   named camera stands for the brief's must-work frames
//   waterHeight(x, z, time) and wallZ(x): the same analytic functions the shaders use (for trunks, shearwaters, spray)
// PROGRESS. hero.setProgress(u) (or uniforms.uProgress) times the pillow's big surge to u 0.47 (the pillow now heaps 44 m up the buttress) and the first crest's
//   thrown spray to u 0.39; without it both just loop. update(dt, time, camera) drives everything else.
// EXPORTS. FLOOD_FAR (GLSL: the far look of the flood, shared with the world's basin floor so the ribbon's east end has no seam);
//   buildHero; gannetGeometry() and buildGannets(count, uniforms) so the world can fly its own escort of the same bird
//   (place(i, { position, yaw, pitch, bank, phase, dive, flap, scale }), commit()); dive 0..1 throws the wings back to an arrow.
// COST. 120k triangles, 5 draw calls (tongue 52.8k, wall and Rock 51.6k, spray 1.8k, six pine trunks 5.4k, seven gannets 7.5k),
//   no lights, no textures, about 250-350 ms of build in steps under 40 ms.
import * as THREE from 'three';
import { smoothstep, clamp, lerp } from '../kit/core.js';

const XO = 520;                       // local x = brief x - XO
const TAN20 = Math.tan(20 * Math.PI / 180);
const DEF_PALETTE = ['#1C4FA0', '#2F9C8E', '#F3F7F5', '#C9A46A', '#EFE6D2', '#8FB0CF', '#F4C56A'];

// ---------------------------------------------------------------------------------------------------------
// The camera line and the wall line (brief coordinates), tabulated every 2 m of x.
// ---------------------------------------------------------------------------------------------------------
function makeLines() {
  const X0 = -60, X1 = 860, N = (X1 - X0) / 2 + 1;
  const pz = new Float32Array(N), wz = new Float32Array(N);
  let z = 0;
  const heading = (x) => (14 * smoothstep(250, 480, x) + 22 * smoothstep(700, 860, x)) * Math.PI / 180;
  for (let i = 0; i < N; i++) {
    const x = X0 + i * 2;
    pz[i] = z; z -= Math.tan(heading(x + 1)) * 2;
    const f = 1 - smoothstep(-40, 480, x);
    wz[i] = pz[i] - (11 + 239 * f * Math.sqrt(f));     // 250 m off at the start, 11 m (9 after relief) from x 480
  }
  const samp = (arr, x) => { const f = clamp((x - X0) / 2, 0, N - 1.001), i = Math.floor(f), t = f - i; return arr[i] * (1 - t) + arr[i + 1] * t; };
  const pathZ = (x) => samp(pz, x);
  const wallZ = (x) => (x <= 712 ? samp(wz, x) : samp(wz, 712) - (x - 712) * 0.249);   // straight continuation east of the prow (water only)
  const wallSlope = (x) => (wallZ(x + 1) - wallZ(x - 1)) * 0.5;
  // camera line as points (brief coords), then 150 m straight at 36 degrees north of east
  const pts = [];
  for (let x = 0; x <= 860; x += 20) pts.push([x, 8, pathZ(x)]);
  const c36 = Math.cos(36 * Math.PI / 180), s36 = Math.sin(36 * Math.PI / 180);
  for (let d = 25; d <= 150; d += 25) pts.push([860 + c36 * d, 8, pathZ(860) - s36 * d]);
  return { pathZ, wallZ, wallSlope, pts, endDir: [c36, 0, -s36] };
}

// ---------------------------------------------------------------------------------------------------------
// The water surface: ONE analytic height function, mirrored exactly in GLSL (WATER_H below).
// bx = brief x, d = distance south of the wall line, z = local z (only the travelling swell uses it), t = seconds.
// ---------------------------------------------------------------------------------------------------------
const RAMP_L = 185;
function rampY(bx) {                                       // drawdown, then the convex ramp: -36 at 450, -128 at 600, -228 at 720, -490 at 1000
  const u = Math.max(bx - 330, 0);
  return -4 * smoothstep(200, 330, bx) - (u - RAMP_L * (1 - Math.exp(-u / RAMP_L)));
}
function standY(bx, d, t) {                                // everything that stands still in world space
  const bow = 55 * (1 - Math.exp(-Math.max(d, 0) / 160)) + 9 * Math.sin(d * 0.021 + 1.3);
  const env = smoothstep(350, 425, bx) * (1 - smoothstep(880, 1010, bx));
  const ph = 6.2831853 * (bx - bow - 420) / 110;
  const psi = ph - 0.45 * (1 - Math.cos(ph));               // steeper face upstream
  const amp = 12.5 * env * (0.78 + 0.22 * Math.sin(d * 0.0131 + bx * 0.004)) * lerp(1, 0.6, smoothstep(250, 700, d));
  let h = amp * Math.cos(psi);
  const renv = smoothstep(235, 430, bx) * (1 - 0.5 * smoothstep(800, 1000, bx));
  const r1 = 0.5 + 0.5 * Math.cos(6.2831853 * (d - 0.5 * bx) / 74), r2 = 0.5 + 0.5 * Math.cos(6.2831853 * (d + 0.5 * bx) / 61 + 1.7);
  h += renv * (4.6 * r1 * r1 * r1 + 3.8 * r2 * r2 * r2 - 2.0);
  const px = bx - 556 + 0.35 * d, heave = 1 + 0.09 * Math.sin(t * 1.3) + 0.05 * Math.sin(t * 2.9 + 1.0);
  const gp = Math.exp(-px * px / 2300 - d * d / 1150);          // the pillow against the buttress: the flood heaps 56 m up the rock (40 m/s stood on end is 80 m of head)
  const boil = Math.sin(bx * 0.37 + t * 1.9) * Math.sin(d * 0.45 - t * 1.3 + bx * 0.11) + 0.6 * Math.sin(bx * 0.21 - t * 2.3 + d * 0.3);
  h += gp * (56 * heave + 4.5 * boil * smoothstep(0.1, 0.5, gp));      // and it boils: lumps a dozen metres across heave and tear
  return h;
}
function swellY(bx, z, t) {
  const k = 1 - smoothstep(200, 330, bx);
  if (k <= 0) return 0;
  return k * (0.85 * Math.sin(bx * 0.071 + z * 0.018 - t * 0.83) + 0.45 * Math.sin(bx * 0.118 - z * 0.052 - t * 1.07 + 2.0)
    + 0.22 * Math.sin(bx * 0.27 + z * 0.19 - t * 1.62 + 4.0));
}

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material
// ---------------------------------------------------------------------------------------------------------
const G_COMMON = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce;
uniform float uTime;
float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return 0.5 * vn(p) + 0.3 * vn(p * 2.03 + 17.1) + 0.2 * vn(p * 4.11 + 41.7); }
`;
const G_FOG_V = /* glsl */`
#ifdef USE_FOG
varying float vFogDepth;
#endif
`;
const G_FOG_F = /* glsl */`
#ifdef USE_FOG
uniform vec3 fogColor; varying float vFogDepth;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear; uniform float fogFar;
#endif
#endif
float fogAmt(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
  return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
vec3 fogMix(vec3 c){
#ifdef USE_FOG
  return mix(c, fogColor, fogAmt());
#else
  return c;
#endif
}
`;

// The lower chute seen from far above, drawn the same way by the ribbon's east end and by the world's basin floor
// (needs h21/vn/fbm3 and uSunCol, uSkyCol). p: local xz. Foam patches a few tens of metres across ride the flow.
export const FLOOD_FAR = /* glsl */`
float floodFoam(vec2 p, float t){
  float fx = p.x - t * 30.;
  float a = fbm3(vec2(fx * 0.011, p.y * 0.028));
  float b = vn(vec2(fx * 0.033, p.y * 0.085) + 7.);
  float pch = fbm3(p * 0.0055 - vec2(t * 0.1, 0.));
  return smoothstep(0.36, 0.62, a * 0.55 + b * 0.3 + pch * 0.4 - 0.08);
}
vec3 floodFarCol(vec2 p, float t, vec3 green, vec3 white, vec3 haze){
  float f = floodFoam(p, t);
  vec3 g = green * 0.42 * (uSkyCol * 0.9 + uSunCol * 0.45), w = white * 0.74 * (uSunCol * 0.70 + haze * 0.40 + uSkyCol * 0.25);
  return mix(g, w, f);
}
`;

// The water height function in GLSL: the same numbers as rampY / standY / swellY above.
const WATER_H = /* glsl */`
uniform float uSurge;
float gCrest, gRidge, gPillow;
float rampY(float bx){ float u = max(bx - 330., 0.); return -4. * smoothstep(200., 330., bx) - (u - 185. * (1. - exp(-u / 185.))); }
float standY(float bx, float d, float t){
  float bow = 55. * (1. - exp(-max(d, 0.) / 160.)) + 9. * sin(d * 0.021 + 1.3);
  float env = smoothstep(350., 425., bx) * (1. - smoothstep(880., 1010., bx));
  float ph = 6.2831853 * (bx - bow - 420.) / 110.;
  float psi = ph - 0.45 * (1. - cos(ph));
  float amp = 12.5 * env * (0.78 + 0.22 * sin(d * 0.0131 + bx * 0.004)) * mix(1., 0.6, smoothstep(250., 700., d));
  float h = amp * cos(psi);
  gCrest = env * smoothstep(0.35, 1., cos(psi - 0.55));
  float renv = smoothstep(235., 430., bx) * (1. - 0.5 * smoothstep(800., 1000., bx));
  float r1 = 0.5 + 0.5 * cos(6.2831853 * (d - 0.5 * bx) / 74.), r2 = 0.5 + 0.5 * cos(6.2831853 * (d + 0.5 * bx) / 61. + 1.7);
  r1 = r1 * r1 * r1; r2 = r2 * r2 * r2;
  h += renv * (4.6 * r1 + 3.8 * r2 - 2.0);
  gRidge = renv * max(r1, r2);
  float px = bx - 556. + 0.35 * d, heave = 1. + 0.09 * sin(t * 1.3) + 0.05 * sin(t * 2.9 + 1.0) + 0.12 * uSurge;
  gPillow = exp(-px * px / 2300. - d * d / 1150.);
  float boil = sin(bx * 0.37 + t * 1.9) * sin(d * 0.45 - t * 1.3 + bx * 0.11) + 0.6 * sin(bx * 0.21 - t * 2.3 + d * 0.3);
  h += gPillow * (56. * heave + 4.5 * boil * smoothstep(0.1, 0.5, gPillow));
  return h;
}
float swellY(float bx, float z, float t){
  float k = 1. - smoothstep(200., 330., bx);
  return k * (0.85 * sin(bx * 0.071 + z * 0.018 - t * 0.83) + 0.45 * sin(bx * 0.118 - z * 0.052 - t * 1.07 + 2.0)
    + 0.22 * sin(bx * 0.27 + z * 0.19 - t * 1.62 + 4.0));
}
float waterH(float bx, float d, float z, float t){ return rampY(bx) + standY(bx, d, t) + swellY(bx, z, t); }
// travel time of the stream to brief-x (seconds): 1/v = 0.025 + 0.375 * (1 - tanh((bx-300)/70)) / 2, integrated exactly
float flowT(float bx){ float q = (bx - 300.) / 70., aq = abs(q);
  float lncosh = aq + log(1. + exp(-2. * aq)) - 0.6931472;
  return 0.025 * bx + 0.1875 * (bx - 70. * lncosh); }
float flowV(float bx){ float q = clamp((bx - 300.) / 70., -9., 9.); float th = 1. - 2. / (exp(2. * q) + 1.);
  return 1. / (0.025 + 0.1875 * (1. - th)); }
`;

const WATER_VERT = /* glsl */`
attribute float aD; attribute float aSlope;
varying vec3 vL; varying float vBx, vD, vSlope;
${G_FOG_V}
uniform float uTime;
${WATER_H}
void main(){
  float bx = position.x + ${XO}.;
  vec3 p = position; p.y = waterH(bx, aD, position.z, uTime);
  vBx = bx; vD = aD; vSlope = aSlope;
  vL = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  #ifdef USE_FOG
  vFogDepth = -mvPosition.z;
  #endif
  gl_Position = projectionMatrix * mvPosition;
}`;

const WATER_FRAG = /* glsl */`
precision highp float;
${G_COMMON}
${G_FOG_F}
${WATER_H}
${FLOOD_FAR}
uniform vec3 uCam, uCobalt, uGreen, uWhite, uHaze, uGold;
varying vec3 vL; varying float vBx, vD, vSlope;
void main(){
  float t = uTime, e = 0.7;
  float hx = waterH(vBx + e, vD - e * vSlope, vL.z, t);
  float hz = waterH(vBx, vD + e, vL.z + e, t);
  float h0 = waterH(vBx, vD, vL.z, t);
  float crest = gCrest, ridge = gRidge, pillow = gPillow;
  vec3 N = vec3(-(hx - h0) / e, 1., -(hz - h0) / e);
  float v = flowV(vBx), T = flowT(vBx);
  vec3 toCam = uCam - vL; float dist = max(length(toCam), 0.01); vec3 V = toCam / dist;
  float lod = 1. - smoothstep(120., 800., dist);
  // FLOW COORDINATES: (seconds along the stream minus time, metres across). Patterns drawn here travel at the
  // local speed (2.6 m/s on the swell, 40 m/s down the ramp) through shapes that stand still.
  vec2 fc = vec2(T - t, vD);
  float wide = mix(0.36, 1., lod);                                          // seen from far above the foam reads as patches, not as a comb
  float n1 = fbm3(vec2(fc.x * 0.9, fc.y * 0.22 * wide));
  float n2 = fbm3(vec2(fc.x * 2.7 + 9., fc.y * 0.61 * wide + 3.));
  float n3 = vn(vec2(fc.x * 7.3, fc.y * 1.9));
  float slow = 1. - smoothstep(4., 12., v), fast = smoothstep(10., 40., v);
  float lod2 = 1. - smoothstep(30., 160., dist);
  float n4 = vn(vec2(fc.x * 21., fc.y * 5.7));
  float nearI = (1. - smoothstep(18., 120., dist)) * smoothstep(7., 18., v);                    // POLISH 2: under the lens the grain of fast water is round (lumps, holes, bubbles), not combed
  n3 = mix(n3, vn(vec2(fc.x * 14. + 1., fc.y * 0.47)), nearI); n4 = mix(n4, vn(vec2(fc.x * 60., fc.y * 2.)), nearI);
  float thr = smoothstep(0.7, 0.95, vn(vec2(fc.x * 3.7 + 5., fc.y * 2.9))) * lod;
  float fn = n1 * 0.48 + n2 * 0.30 + mix(0.09, n3 * 0.18, lod) + (n4 - 0.5) * 0.14 * lod2 + thr * 0.2 * fast;
  float lacePat = 1. - abs(2. * fbm3(vec2(fc.x * 1.3 + vL.z * 0.05, fc.y * 0.33)) - 1.);
  float iso = fbm3(vec2(fc.x * 3.6 + 2., fc.y * 0.11 + 5.));                 // torn cells a dozen metres across, carried with the flow: fast water is blotched, not combed
  fn = mix(fn, fn * 0.5 + iso * 0.5, fast * 0.8);
  fn = mix(fn, 0.15 + 0.5 * lacePat * lacePat + 0.25 * n2, slow);
  // POLISH 2: seen from the void the racing water is drawn ALONG its run: long foam streaks and dark glass lanes between them
  float farK = fast * (1. - lod2);
  float stA = vn(vec2(fc.x * 1.15 + 3., fc.y * 0.17)), stB = vn(vec2(fc.x * 2.9, fc.y * 0.47 + 9.)), stC = vn(vec2(fc.x * 6.7 + 1., fc.y * 1.3));
  float streakF = stA * 0.5 + stB * 0.32 + stC * 0.18 * lod;
  fn = mix(fn, fn * 0.35 + streakF * 0.65, farK * 0.85);
  vec2 pc = vec2(vL.x * 0.085 + vL.y * 0.07, vL.z * 0.085 - vL.y * 0.05) + t * vec2(0.55, -0.35);            // (taken on the slope itself, so nothing stretches into stripes down its flanks)
  float pboil = 0.5 * fbm3(pc) + 0.3 * vn(pc * 2.9 + 7.) + 0.2 * vn(pc * 7.3 - t * 0.4);
  float nearC = nearI;
  fn = mix(fn, 0.15 * fn + 0.50 * vn(vec2(fc.x * 6.5, fc.y * 0.21)) + 0.35 * vn(vec2(fc.x * 15. + 3., fc.y * 0.52 + 1.)), nearC * 0.92);     // POLISH 2: under the lens torn water is lumps and lace a few metres across, never a smear of streaks
  fn = mix(fn, 0.10 + 0.86 * pboil, smoothstep(0.12, 0.45, pillow));     // the pillow boils: torn white with green holes, no streaks run up it
  float crestN = smoothstep(0.42, 1., crest);                                   // the torn line itself, not the whole back of the hill
  float A = 0.10 * fast * lod2 + 0.60 * crestN + 0.42 * ridge * smoothstep(5., 25., v) + smoothstep(0.30, 0.85, pillow) * (0.50 + 0.30 * n2) + 0.25 * pillow
          + 0.32 * smoothstep(520., 900., vBx) + slow * (0.07 + 0.15 * vn(vL.xz * 0.02 + 3.))
          + 0.5 * (fbm3(vL.xz * 0.0055 - vec2(t * 0.1, 0.)) - 0.5) * fast * (1. - lod);     // far off: whiter and greener reaches a hundred metres across
  A = clamp(A, 0., 1.25);
  float foam = smoothstep(0.80 - A * 0.74, mix(0.99 - A * 0.60, 0.80 - A * 0.74 + 0.11, fast * (1. - 0.5 * lod2)), fn);      // fast water tears: hard-edged white, not a soft smear
  float pK = smoothstep(0.10, 0.40, pillow);
  foam = mix(foam, smoothstep(0.50, 0.60, pboil + 0.13 * smoothstep(0.45, 0.95, pillow)), pK);
  float clot = 0.6 * vn(vec2(fc.x * 38., fc.y * 1.6 + 2.)) + 0.4 * vn(vec2(fc.x * 90. + 5., fc.y * 3.7));      // under the lens the white is clots and lace with green in the holes, not a streak
  foam *= mix(1., 0.30 + 0.80 * smoothstep(0.26, 0.56, clot), (1. - smoothstep(14., 75., dist)) * fast * (1. - pK));
  // fine relief: wind chop on the open sea, ironed smooth in the tongue, torn where the water is fast and white
  vec2 q = vec2(fc.x * 3.1, fc.y * 0.9); float q0 = vn(q);
  vec2 g1 = vec2(vn(q + vec2(0.35, 0.)) - q0, vn(q + vec2(0., 0.35)) - q0);
  vec2 qc = vL.xz * 0.42 + t * vec2(0.55, 0.21); float c0 = vn(qc);
  vec2 g2 = vec2(vn(qc + vec2(0.3, 0.)) - c0, vn(qc + vec2(0., 0.3)) - c0);
  vec2 qd = vL.xz * 1.9 - t * vec2(0.8, 0.5); float d0 = vn(qd);
  vec2 g3 = vec2(vn(qd + vec2(0.3, 0.)) - d0, vn(qd + vec2(0., 0.3)) - d0);
  float chop = 1. - smoothstep(180., 320., vBx);
  vec2 qi = vec2(fc.x * 20., fc.y * 0.66); float i0 = vn(qi);
  vec2 gI = vec2(vn(qi + vec2(0.35, 0.)) - i0, vn(qi + vec2(0., 0.35)) - i0);
  N.xz += (mix(g1, gI, 0.8 * nearI) * (0.10 + 0.55 * fast + 0.5 * foam) + (g2 * 0.55 + g3 * 0.35 * lod) * chop) * (0.35 + 0.65 * lod);
  N = normalize(N);
  float ndl = dot(N, uSunDir), ndv = max(dot(N, V), 0.);
  // body colour by speed: cobalt -> glass green -> milk
  float g = smoothstep(2.8, 9., v);
  vec3 deep = mix(uCobalt * 0.42, uGreen * 0.6, g);
  float lift = clamp(crest * 0.7 + ridge * 0.5 + max(h0 - rampY(vBx), 0.) * 0.035, 0., 1.);
  deep = mix(deep, uGreen * 1.1 + vec3(0.01, 0.07, 0.04), lift * 0.6 * g);
  deep = mix(deep, mix(uGreen, uWhite, 0.5) * 0.72, 0.14 * smoothstep(22., 40., v) * (0.4 + 0.6 * n1));
  deep *= mix(1., 0.50 + 1.05 * lift + 0.35 * (streakF - 0.5), fast * (1. - 0.6 * lod2));           // dark glass in the troughs and lanes, bright jade on the faces that climb
  deep = mix(deep, uGreen * 1.35 + vec3(0.0, 0.10, 0.06), 0.85 * smoothstep(0.06, 0.3, pillow));                 // glass green where the heap is thin: its flanks and the holes in its foam
  vec3 body = deep * (uSkyCol * 0.9 + uSunCol * (0.3 + 0.6 * max(ndl, 0.)));
  float om = 1. - ndv, fres = 0.02 + 0.98 * om * om * om * om * om;
  vec3 R = reflect(-V, N); float ry = sqrt(clamp(R.y, 0., 1.));
  vec3 skyRef = mix(uHaze * 1.05, uSkyCol * 1.5, ry);
  vec3 col = mix(body, skyRef, fres * 0.9 * (1. - 0.6 * fast));              // torn fast water does not mirror the sky
  vec3 Hh = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  float ndh = max(dot(N, Hh), 0.);
  float s1 = ndh * ndh; s1 *= s1; s1 *= s1; s1 *= s1; float s2 = s1 * s1; s2 *= s2; s2 *= s2;     // ^16, ^256
  col += uSunCol * uGold * (s2 * 5. + s1 * 0.12) * (1. - foam);
  float lipK = smoothstep(215., 300., vBx) * (1. - smoothstep(335., 400., vBx)) * om * om * smoothstep(120., 260., dist);   // seen low and from afar the ironed tongue is a bright glittering line
  col += (uSunCol * 0.55 + uSkyCol * 0.7) * lipK * (0.55 + 0.9 * smoothstep(0.45, 0.8, vn(vec2(vL.x * 0.5 - t * 3., vL.z * 0.12))));
  // white water: albedo 0.78, shadows tinted haze blue so it never clips
  float wrap = clamp(ndl * 0.45 + 0.62, 0., 1.);           // spray scatters: the east-facing ramp still glows under a low sun
  vec3 foamLit = uWhite * (0.66 + 0.12 * n3) * (uSunCol * wrap * 0.92 + uHaze * 0.5 + uSkyCol * 0.25);
  foamLit *= mix(1., 0.62 + 0.75 * pboil, pK);                                  // boils stand in their own blue shade
  // POLISH 2: the pillow is torn, boiling water: domes a few metres across, each lit on its crown, with blue-grey creases where
  // they meet and green glass in the holes, never a blank white egg
  float pcr = abs(vn(pc * 2.3 + 3.) - 0.5) * 2., pcr2 = abs(vn(pc * 5.9 + 11.) - 0.5) * 2., pcr3 = abs(vn(pc * 13. + 5.) - 0.5) * 2.;
  float crease = clamp((1. - smoothstep(0.0, 0.24, pcr)) * 0.75 + (1. - smoothstep(0.0, 0.30, pcr2)) * 0.5 + (1. - smoothstep(0.0, 0.35, pcr3)) * 0.3 * lod2, 0., 1.);
  foamLit *= mix(vec3(1.), mix(vec3(1.10), vec3(0.46, 0.60, 0.78), crease), pK);
  float nearF = 1. - smoothstep(25., 140., dist);
  float ftex = 0.5 * mix(vn(vec2(fc.x * 9. + 3., fc.y * 0.9)), vn(vec2(fc.x * 24. + 3., fc.y * 0.8)), fast) + 0.3 * n4 + 0.2 * vn(vec2(fc.x * 47., fc.y * 4.3 + 7.));      // close to: lumps, torn holes and bubble grain, blue in the hollows
  foamLit *= mix(vec3(1.), mix(vec3(0.60, 0.72, 0.86), vec3(1.12), smoothstep(0.25, 0.75, ftex)), nearF * (1. - pK));
  col = mix(col, foamLit, foam * 0.94);
  // behind the Rock the flood spreads north over raw ground: torn white water streaked with green, never a calm sheet
  float spreadK = (1. - smoothstep(-70., -4., vD)) * smoothstep(700., 760., vBx) * (1. - smoothstep(880., 1000., vBx));
  vec2 sq = vec2((vL.x + vL.z * 0.35) - t * 26., vL.z - vL.x * 0.35);                 // streaks drawn in world space along the run of the flood
  float sst = fbm3(vec2(sq.x * 0.003, sq.y * 0.06)) * 0.5 + vn(vec2(sq.x * 0.008, sq.y * 0.2)) * 0.4 + vn(vec2(sq.x * 0.03, sq.y * 0.6)) * 0.25 * lod;
  vec3 spreadCol = mix(uGreen * 0.42 * (uSkyCol * 0.9 + uSunCol * 0.45), foamLit, smoothstep(0.3, 0.62, sst));
  col = mix(col, spreadCol, spreadK * 0.9);
  col = mix(col, floodFarCol(vL.xz, t, uGreen, uWhite, uHaze), smoothstep(880., 1040., vBx));     // the world carries the chute on below in the same hand
  col = mix(col, floodFarCol(vL.xz, t, uGreen, uWhite, uHaze), 0.85 * smoothstep(560., 860., vD) * smoothstep(700., 800., vBx));     // POLISH 2: the far side of the flood is flood, not a blue slab
  col = mix(col, uHaze * 0.8, 0.5 * smoothstep(700., 1000., vD) * (1. - smoothstep(700., 800., vBx)));
  gl_FragColor = vec4(fogMix(col), 1.);
}`;

async function buildWaterGeometry(L, ctx) {
  const NX = 240, NZ = 110;
  const xs = new Float32Array(NX + 1);
  { // brief x -160..1060 (160 m of sea behind the entry), three times denser between 200 and 800
    const rho = (x) => (x < 200 ? 1 : x < 800 ? 3 : 1.2);
    let tot = 0; for (let x = -160; x < 1060; x += 2) tot += rho(x) * 2;
    let acc = 0, i = 1, x = -160; xs[0] = -160;
    while (i <= NX && x < 1060) { acc += rho(x) * 0.5; x += 0.5; if (acc >= tot * i / NX) xs[i++] = x; }
    for (; i <= NX; i++) xs[i] = 1060;
  }
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), aD = new Float32Array((NX + 1) * (NZ + 1)), aS = new Float32Array((NX + 1) * (NZ + 1));
  let k = 0;
  for (let j = 0; j <= NZ; j++) {
    const dj = -6 + 2.2 * j + 5.74e-4 * j * j * j, w = 1 - j / NZ;
    for (let i = 0; i <= NX; i++, k++) {
      const bx = xs[i], spread = Math.max(bx - 712, 0) * 1.5 + 260 * smoothstep(712, 760, bx);   // east of the prow the flood spreads north, its edge buried in the rock and the bank
      const d = dj - spread * w * w * w;
      pos[k * 3] = bx - XO; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = L.wallZ(bx) + d;
      aD[k] = d; aS[k] = L.wallSlope(bx);
    }
    if (j % 16 === 15) await ctx.yield();
  }
  await ctx.yield();
  const idx = new Uint32Array(NX * NZ * 6); let q = 0;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aD', new THREE.BufferAttribute(aD, 1));
  geo.setAttribute('aSlope', new THREE.BufferAttribute(aS, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(30, -200, 300), 1000);
  return geo;
}

// ---------------------------------------------------------------------------------------------------------
// The north wall and the Rock: one displaced grid (columns along the face line, rows up the face).
// ---------------------------------------------------------------------------------------------------------
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function faceStations(L) {                      // [{x, z, nx, nz, s, bx, e}] in brief coords; n = outward (toward the camera side)
  const st = [];
  let x = 40;
  while (x < 712) { st.push({ x, z: L.wallZ(x), a: Math.atan(-L.wallSlope(x)) }); x += x < 400 ? 8 : x < 440 ? 4 : 2; }
  const a0 = Math.atan(0.249), R = 22, P0 = { x: 712, z: L.wallZ(712) };
  const dir = (a) => [Math.cos(a), -Math.sin(a)];
  const c = dir(a0 + Math.PI / 2), C = [P0.x + R * c[0], P0.z + R * c[1]];
  const a1 = 84 * Math.PI / 180;
  for (let i = 0; i <= 14; i++) { const a = a0 + (a1 - a0) * i / 14, d = dir(a + Math.PI / 2); st.push({ x: C[0] - R * d[0], z: C[1] - R * d[1], a, e: 0.01 + i }); }
  let px = st[st.length - 1].x, pz = st[st.length - 1].z, e = 15, step = 2.5;
  for (let i = 0; i < 50; i++) {                 // the east face, swinging slowly east into the old coast's escarpment
    const a = a1 - (26 * Math.PI / 180) * smoothstep(0, 50, i) + 0.10 * Math.sin(i * 0.33);
    const d = dir(a); px += d[0] * step; pz += d[1] * step; e += step; step = Math.min(step * 1.065, 15);
    st.push({ x: px, z: pz, a, e });
  }
  let s = 0;
  for (let i = 0; i < st.length; i++) {
    const p = st[i]; if (i) s += Math.hypot(p.x - st[i - 1].x, p.z - st[i - 1].z);
    p.s = s; p.nx = Math.sin(p.a); p.nz = Math.cos(p.a); p.e = p.e || 0; p.bx = Math.min(p.x, 712 + p.e * 0.2);
  }
  return st;
}

// Vertex normals for an indexed mesh in short steps (the same area-weighted result as computeVertexNormals, on
// typed arrays, with a yield every few thousand triangles so no step of the build holds the page).
export async function normalsAsync(geo, ctx) {
  const pos = geo.attributes.position.array, idx = geo.index.array, nrm = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3, ax = pos[a], ay = pos[a + 1], az = pos[a + 2];
    const ux = pos[b] - ax, uy = pos[b + 1] - ay, uz = pos[b + 2] - az, vx = pos[c] - ax, vy = pos[c + 1] - ay, vz = pos[c + 2] - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    if (i % 24000 === 23997) await ctx.yield();
  }
  for (let i = 0; i < nrm.length; i += 3) {
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
    if (i % 60000 === 59997) await ctx.yield();
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
}

async function buildWallGeometry(ctx, L, shelves) {
  const noise = ctx.noise, st = faceStations(L), NC = st.length;
  const ROWS_LO = 24, ROWS_MID = 46, ROWS_HI = 24, ROWS_BACK = 7, NR = ROWS_LO + ROWS_MID + ROWS_HI + ROWS_BACK;
  const pos = new Float32Array(NC * NR * 3), info = new Float32Array(NC * NR * 4), RH = 100 / ROWS_MID;
  let k = 0;
  for (let c = 0; c < NC; c++) {
    const p = st[c], east = smoothstep(0, 40, p.e), fin = smoothstep(0, 3, p.e);             // 0 on the south wall, 1 on the Rock's east face
    const crest = (75 + 53 * smoothstep(150, 470, p.x)) * (1 - east) + 132 * smoothstep(560, 700, p.x) * (1 - east)
      + east * (262 - 96 * smoothstep(40, 480, p.e)) + 11 * noise.fbm2(p.s * 0.012, 3.3, 3) + 14 * noise.n2(p.s * 0.0065, 1.7) + 5 * noise.n2(p.s * 0.06, 9.1);
    const foot = lerp(Math.min(rampY(p.bx) - 14, -8), Math.min(-300, rampY(p.x) - 80), smoothstep(700, 716, p.x));   // the east face goes on down under the flood
    const tight = smoothstep(320, 370, p.x) * (1 - smoothstep(4, 30, p.e));   // where the camera passes at 9 m
    let crestRel = 0;
    for (let r = 0; r < NR; r++, k++) {
      let y, back = 0, isBack = false;
      if (r < ROWS_LO) { const t = r / ROWS_LO; y = lerp(foot, -40, 1 - (1 - t) * (1 - t)); }
      else if (r < ROWS_LO + ROWS_MID) y = -40 + (r - ROWS_LO) * (100 / ROWS_MID);
      else if (r < NR - ROWS_BACK) { const t = (r - ROWS_LO - ROWS_MID) / (ROWS_HI - 1); y = lerp(60, crest, t * (0.55 + 0.45 * t)); }
      else {                                                  // the land behind: an upland falling away north from the crest
        const kb = r - (NR - ROWS_BACK) + 1, depth = lerp(430, lerp(70, 150, east), fin); isBack = true;
        if (kb === ROWS_BACK) { y = -300; back = depth + 12; }
        else { const t = kb / (ROWS_BACK - 1); y = lerp(crest, 36 + 16 * noise.n2(p.s * 0.008, t * 2.5), t * t * (3 - 2 * t)); back = 4 + depth * Math.pow(t, 1.3);
          y = lerp(y, crest - (crest - 40) * Math.pow(t, 1.5) + 9 * noise.n2(p.s * 0.02, t * 4) * t, fin); }      // behind the east face: the fin's rounded west flank
      }
      // lean: sheer and a little undercut below the tide line, battered back above; scree apron under the east face
      const yl = isBack ? crest : y, up = Math.max(yl - 20, 0);
      const roll = Math.max(yl - (crest - 60), 0);
      let out = -(0.2 * up + 0.0011 * up * up) - 0.006 * roll * roll - back - 0.6 * smoothstep(9, 4, y) * (1 - east);
      out += east * 0.12 * Math.max(-90 - y, 0);
      // relief: big masses, tilted beds stepping in and out, jointed blocks, gullies
      const b = y - TAN20 * p.s * 0.8;
      const fresh = smoothstep(9.5, 6, y);                                     // below the tide line: freshly broken
      const big = 8 * noise.fbm2(p.s * 0.011, y * 0.009, 3) + 4.5 * noise.fbm2(p.s * 0.04 + 7, y * 0.03, 2);
      const bq = b / 6.5 + 0.35 * noise.n2(p.s * 0.02, 5.5), bi = Math.floor(bq), fb = bq - bi;
      let fine = (hash1(bi) - 0.5) * 4.4 + (hash1(Math.floor(bq / 3) + 90) - 0.5) * 6 + 0.9 * smoothstep(0.7, 0.95, fb) - 0.8 * smoothstep(0.22, 0.0, fb);
      const ji = Math.floor((p.s + hash1(bi + 40) * 5) / (4.5 + 3 * hash1(bi + 7)));
      fine += (hash1(ji * 13.7 + bi * 3.1) - 0.5) * (1.3 + 1.6 * fresh);
      const gully = -7 * smoothstep(0.55, 0.9, noise.fbm2(p.s * 0.03 + 20, y * 0.004, 2) * 0.5 + 0.5) * smoothstep(20, 70, y);
      fine *= 1 - 0.4 * east;
      const eastBig = east * (22 * noise.fbm2(p.s * 0.012 + 40, y * 0.007, 3) + 9 * noise.n2(p.s * 0.035, y * 0.02));   // buttresses and couloirs on the shaded face
      let rel = big + fine + gully + eastBig;
      if (isBack) { const tb = (r - (NR - ROWS_BACK)) / 3; rel = lerp(crestRel, big * 0.5, smoothstep(0, 1, tb)); } else if (r === NR - ROWS_BACK - 1) crestRel = rel;
      let cave = 0, shelf = 0, recess = 0, ySnap = y;
      if (east < 0.5 && !isBack) {
        const dxb = (p.x - 578) / 17; rel += 17 * Math.exp(-dxb * dxb) * smoothstep(-2, -42, y);          // the buttress the pillow climbs
        const cx = (p.x - 628) / 8.5, cy = (y - 23) / 6.5; cave = Math.exp(-cx * cx - cy * cy * (y > 23 ? 1.6 : 0.8));
        for (const sh of shelves) {                                                                       // ledges for plants and birds
          const ds = Math.abs(p.s - sh.s) / sh.w; if (ds > 1.4) continue;
          const dy = sh.y - y, m = (1 - smoothstep(0.7, 1.3, ds));
          if (sh.low) {                                                                                   // a notch: flat floor, back wall, the face closing over it 9 m up
            if (dy < -0.1) recess = Math.max(recess, m * sh.d * (1 - smoothstep(1.5, 9, -dy)));
            if (Math.abs(dy + RH) < 0.02) ySnap = lerp(y, sh.y + 0.3, smoothstep(0.3, 0.8, m));
            continue;
          }
          if (dy >= -0.5) shelf = Math.max(shelf, m * sh.d * (1 - smoothstep(0, sh.d * 2.6, dy)));
          else rel -= m * 2.2 * (1 - smoothstep(0.5, 6, -dy));                                            // recess above the shelf
        }
      }
      const zone = tight * smoothstep(-8, -2, y) * (1 - smoothstep(20, 30, y));
      // at the close pass the big masses are damped but beds and joints step in at full strength (recesses only: never nearer than 9 m)
      const relZ = isBack ? rel : clamp(big * 0.45 + (fine + gully) * 1.25 - 1.6, -8, 1.9);
      rel = lerp(rel, relZ, zone) + shelf * (1 - zone) - recess - 13 * cave;
      y = ySnap;
      out += rel;
      pos[k * 3] = p.x + p.nx * out - XO; pos[k * 3 + 1] = y; pos[k * 3 + 2] = p.z + p.nz * out;
      info[k * 4] = bq; info[k * 4 + 1] = p.s; info[k * 4 + 2] = isBack ? lerp(r === NR - ROWS_BACK ? 1.45 : 2, 1, fin) : clamp(1 + fine * 0.16 + gully * 0.05 - cave * 1.1 - recess * 0.17, 0.12, 1.15);   // 2 marks the upland behind the crest
      info[k * 4 + 3] = p.bx;
    }
    if (c % 4 === 3) await ctx.yield();
  }
  const idx = new Uint32Array((NC - 1) * (NR - 1) * 6); let q = 0;
  for (let c = 0; c < NC - 1; c++) for (let r = 0; r < NR - 1; r++) {
    const a = c * NR + r, b2 = a + NR, c2 = a + 1, d = b2 + 1;
    idx[q++] = a; idx[q++] = b2; idx[q++] = c2; idx[q++] = c2; idx[q++] = b2; idx[q++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  await normalsAsync(geo, ctx);
  await ctx.yield();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(100, 0, -250), 900);
  return { geo, st, NR };
}

const WALL_VERT = /* glsl */`
attribute vec4 aInfo;
varying vec3 vL, vN; varying vec4 vInfo;
${G_FOG_V}
void main(){
  vL = position; vN = normal; vInfo = aInfo;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  #ifdef USE_FOG
  vFogDepth = -mvPosition.z;
  #endif
  gl_Position = projectionMatrix * mvPosition;
}`;
const WALL_FRAG = /* glsl */`
precision highp float;
${G_COMMON}
${G_FOG_F}
uniform vec3 uCam, uHoney, uBone, uHaze, uShade, uWhite;
uniform float uTide;
varying vec3 vL, vN; varying vec4 vInfo;
float rampY(float bx){ float u = max(bx - 330., 0.); return -4. * smoothstep(200., 330., bx) - (u - 185. * (1. - exp(-u / 185.))); }
// jointed blocks: a jittered brick lattice (rows offset by half a block). x = distance to the block's centre,
// y = distance to its nearest joint (0 on the joint), zw = the block
vec4 fracCell(vec2 p, float jit){ vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.; vec2 best = vec2(0.);
  for (int yy = -1; yy <= 1; yy++) for (int xx = -2; xx <= 1; xx++) { vec2 c = i + vec2(float(xx), float(yy));
    vec2 r = c + vec2(0.5 + jit * (h21(c) - 0.5) + 0.5 * mod(c.y, 2.), 0.5 + jit * (h21(c + 71.3) - 0.5)) - p; r.y *= 1.25; float d = max(abs(r.x), abs(r.y)) * 0.8 + 0.2 * length(r);
    if (d < d1) { d2 = d1; d1 = d; best = c; } else if (d < d2) d2 = d; }
  return vec4(d1, d2 - d1, best); }
void main(){
  float y = vL.y, s = vInfo.y, bq = vInfo.x, backF = smoothstep(1.2, 1.9, vInfo.z), ao = min(vInfo.z, 1.15);
  vec2 gp = mix(vec2(s, y), vL.xz, backF);
  float dist = length(uCam - vL), lod = 1. - smoothstep(90., 600., dist), lod2 = 1. - smoothstep(25., 160., dist);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  float eastF = smoothstep(713.5, 720., vInfo.w) * (1. - backF) * smoothstep(-0.5, -0.1, N.x), freshF = 1. - smoothstep(6., 9.5, y);     // the shaded east FACE only: the upland behind the crest takes the sun
  vec3 fN = cross(dFdx(vL), dFdy(vL)); fN = normalize(fN + N * 1e-5);                 // broken, faceted rock
  N = normalize(mix(N, fN, min(0.22 + 0.2 * freshF + 0.36 * (1. - smoothstep(20., 90., dist)) + 0.26 * eastF, 0.9))); vec3 Nm = N;     // up close the face is broken planes, not a dune
  // rock detail: bed partings, joints, facets
  float wob = vn(vec2(s * 0.05, y * 0.05));
  float bqq = bq + (wob - 0.5) * 0.18;
  float fb = fract(bqq), bi = floor(bqq);
  float fb2 = fract(bqq * 3.7 + 0.3);
  float part = (1. - smoothstep(0.0, 0.10, fb)) * (0.3 + 0.7 * vn(vec2(s * 0.23, bi * 7.3))) * 0.8
             + (1. - smoothstep(0.0, 0.12, fb2)) * 0.3 * lod2 * vn(vec2(s * 0.5, floor(bqq * 3.7) * 3.1));
  float jw = 4.5 + 3. * h21(vec2(bi, 7.));
  float sj = s + (vn(vec2(y * 0.3, bi * 3.1)) - 0.5) * 1.8 + (fb - 0.5) * 3.2 * (h21(vec2(bi, 3.)) - 0.5);
  float jq = (sj + h21(vec2(bi, 40.)) * 5.) / jw;
  float jf = fract(jq), ji = floor(jq);
  float joint = (1. - smoothstep(0.0, 0.05, jf)) * 0.7 * step(0.3, h21(vec2(ji, bi + 9.)))
              + (1. - smoothstep(0., 0.07, fract(jq * 2.3 + 0.4 * fb))) * 0.25 * lod2 * step(0.5, h21(vec2(floor(jq * 2.3 + 0.4 * fb), bi)));
  float flatTop = smoothstep(0.5, 0.8, N.y), lineK = (1. - flatTop) * (1. - backF) * (0.25 + 0.75 * lod) * (1. - 0.25 * eastF);
  part *= lineK; joint *= lineK;
  float blockTone = mix(0.5, h21(vec2(ji, bi)), lineK), bandTone = h21(vec2(floor(bqq / 3.), 3.));
  float grain = fbm3(gp * 0.9), grain2 = vn(gp * 4.1);
  // bump from the same pattern (cheap normal tilt)
  vec3 Tn = normalize(vec3(N.z, 0., -N.x) + vec3(1e-4, 0., 0.));
  float bumpS = vn(vec2(s * 0.9 + 0.4, y * 0.9)) - vn(vec2(s * 0.9 - 0.4, y * 0.9));
  float bumpY = vn(vec2(s * 0.9, y * 0.9 + 0.4)) - vn(vec2(s * 0.9, y * 0.9 - 0.4));
  N = normalize(N - (Tn * bumpS + vec3(0., 1., 0.) * (bumpY + (part - 0.2) * 0.5)) * 0.34 * (0.3 + 0.7 * lod));
  float nearK = 1. - smoothstep(14., 70., dist);
  float b2S = vn(vec2(s * 3.1 + 0.15, y * 3.1)) - vn(vec2(s * 3.1 - 0.15, y * 3.1)), b2Y = vn(vec2(s * 3.1, y * 3.1 + 0.15)) - vn(vec2(s * 3.1, y * 3.1 - 0.15));
  N = normalize(N - (Tn * b2S + vec3(0., 1., 0.) * b2Y) * 0.55 * nearK * (1. - backF));
  // colour by height: weathered honey-grey above the old tide line, raw bone below it
  float tj = (vn(vec2(s * 0.6, 3.)) - 0.5) * 0.5 + (vn(vec2(s * 3.3, 9.)) - 0.5) * 0.22;
  float crust = (vn(vec2(s * 0.9, 21.)) - 0.5) * 1.1 + (vn(vec2(s * 4.7, y * 0.6)) - 0.5) * 0.5;                    // the barnacle band's upper edge: uneven, crusted
  float wtop = uTide + 0.42 * (vn(vec2(s * 0.47, 31.)) - 0.5) + 0.34 * (vn(vec2(s * 1.9, 13.)) - 0.5) + 0.12 * (vn(vec2(s * 7.1, 5.)) - 0.5);      // the old tide line: level, but drawn by living things, never ruled
  float above = max(smoothstep(wtop - 0.35 + tj * 0.4, wtop + 0.30 + tj * 0.4, y + 0.3 * (grain2 - 0.5)), eastF);
  // BROKEN ROCK: two sizes of fracture cell skewed along the beds. Below the tide line the face is days old: angular blocks,
  // each its own plane and tone, open dark joints with a lit lip, a few blocks fallen out. Above it the same joints, weathered.
  vec2 fp = vec2(s * 0.40 + y * 0.06, (y - 0.29 * s) * 0.80 + 0.22 * vn(vec2(s * 0.21, y * 0.3)));
  vec4 fr1 = fracCell(fp, 0.62), fr2 = fracCell(fp * 0.34 + 9.3, 0.5);
  float fId = h21(fr1.zw + 3.1), fId2 = h21(fr1.zw + 17.7), gId = h21(fr2.zw + 5.9), gId2 = h21(fr2.zw + 23.3);
  float fK = (1. - above) * (1. - backF) * (1. - eastF) * lod2, gK = (1. - backF) * (1. - eastF) * (0.25 + 0.75 * lod) * (1. - 0.5 * flatTop);
  float open1 = 0.35 + 0.65 * smoothstep(0.25, 0.7, vn(fp * 0.9 + 5.));                                    // some joints gape, some are hairlines
  float gape = smoothstep(0.42, 0.78, open1);
  float crackF = (1. - smoothstep(0.016, 0.02 + 0.085 * gape, fr1.y)) * fK * (0.12 + 0.88 * gape), crackG = (1. - smoothstep(0.008, 0.03, fr2.y)) * gK * 0.55;
  float jointAO = (1. - smoothstep(0.0, 0.30, fr1.y)) * fK * (0.3 + 0.7 * gape);
  float lipF = smoothstep(0.05, 0.09, fr1.y) * (1. - smoothstep(0.09, 0.22, fr1.y)) * fK;
  // POLISH 2: a third, small size of break inside half of the plates (shattered rock, chips, rubble faces), close to only
  vec4 fr3 = fracCell(fp * 3.3 + 4.7, 0.7); float hId = h21(fr3.zw + 9.1), hId2 = h21(fr3.zw + 31.7);
  float hK = fK * (1. - smoothstep(30., 110., dist)) * smoothstep(0.38, 0.58, vn(fp * 0.45 + 13.));
  float socket = step(0.88, fId) * fK * smoothstep(0.03, 0.10, fr1.y);
  vec3 honey = mix(uHoney, vec3(0.42, 0.40, 0.37), 0.30 + 0.25 * grain) * (0.62 + 0.3 * blockTone);
  float streak = smoothstep(0.52, 0.8, vn(vec2(s * 0.42, y * 0.035 + bi * 0.37)) * (0.6 + 0.4 * vn(vec2(s * 1.7, y * 0.1))));
  honey = mix(honey, vec3(0.045, 0.04, 0.04), streak * 0.72 * smoothstep(0.1, 0.5, 1. - fb + 0.3) * (1. - flatTop) * (1. - backF) * (1. - 0.6 * eastF));   // black water stains under ledges
  float lichen = smoothstep(0.66, 0.78, fbm3(vec2(s * 0.33 + 5., y * 0.33))) * (0.5 + 0.5 * grain2) * lod;
  honey = mix(honey, vec3(0.62, 0.30, 0.07), lichen * 0.5);
  float top = smoothstep(0.55, 0.85, N.y);                                                             // dusty ledge tops
  honey = mix(honey, uHoney * 0.8 + 0.06, top * 0.5);
  honey = mix(honey, mix(vec3(0.25, 0.28, 0.17), vec3(0.34, 0.35, 0.22), backF), max(top, backF) * mix(0.6, 0.6, backF) * smoothstep(0.35, 0.6, fbm3(vL.xz * 0.035)) * (0.6 + 0.4 * grain2));   // maquis on the flats
  honey *= mix(1., 0.88 + 0.24 * gId, gK * above) * (1. - 0.30 * crackG * above * lod2);                     // weathered blocks, their joints grown soft
  vec3 bone = uBone * (0.34 + 0.22 * blockTone + 0.24 * fId * fK + 0.12 * gId + 0.08 * grain);                // fresh breaks: every block its own tone
  // POLISH 2: a fresh break in limestone is a mosaic: bone-white new fractures beside joint faces that were already stained
  // honey and rust inside the rock, so the wall below the tide line is the same stone as the wall above it, newly opened.
  float stainB = smoothstep(0.50, 0.60, gId * 0.55 + fId2 * 0.45 + 0.3 * (grain - 0.5));
  bone = mix(bone, uHoney * (0.50 + 0.30 * fId) * (0.8 + 0.4 * grain2), 0.78 * stainB);
  bone = mix(bone, uBone * dot(honey, vec3(0.333)) / max(dot(uHoney, vec3(0.333)), 0.05) * 0.60, 0.35);              // and it carries the wall's own beds and streaks
  float lamQ = bqq * 13. + 0.5 * vn(vec2(s * 0.3, y * 0.1)), lam = (1. - smoothstep(0., 0.22, fract(lamQ))) * smoothstep(0.25, 0.7, vn(vec2(s * 0.17, floor(lamQ) * 1.7)));
  bone *= 1. - 0.30 * lam * lod2;
  bone *= mix(1., 0.74 + 0.5 * hId, hK) * (1. - 0.62 * (1. - smoothstep(0.02, 0.075, fr3.y)) * hK);                                                                                  // thin beds inside every block
  bone *= (1. - 0.86 * crackF) * (1. - 0.30 * jointAO) * (1. - 0.5 * crackG * (1. - above)) * (1. + 0.26 * lipF) * (1. - 0.30 * socket);
  bone *= 1. - 0.34 * smoothstep(0.5, 0.78, vn(vec2(s * 0.45, y * 0.03 + bi * 0.21))) * (0.6 + 0.4 * grain2);     // wet streaks still draining
  bone *= 1. - 0.8 * clamp(joint * 1.7 + part * 1.1, 0., 1.) * lod;                                           // open joints between angular blocks
  bone = mix(bone, uHoney * 0.75, 0.25 * smoothstep(0.55, 0.9, vn(vec2(s * 0.07, y * 0.07 + 11.))));    // old stained faces among the fresh
  float waterY = rampY(vInfo.w);
  float wet = 1. - smoothstep(3., 40., y - waterY + 22. * (vn(vec2(s * 0.75, y * 0.02)) - 0.5) + 8. * vn(vec2(s * 0.08, uTime * 0.07)));     // the wet reach ends in drips, not in a blot
  bone *= mix(1., 0.62, wet);
  vec3 alb = mix(bone, honey, above);
  N = normalize(N + (Tn * (h21(vec2(ji, bi + 3.)) - 0.5) + vec3(0., 1., 0.) * (h21(vec2(ji + 5., bi)) - 0.5)) * 0.6 * (1. - above) * lineK * (1. - eastF));      // below the tide line each block is its own broken plane
  N = normalize(N + (Tn * (hId - 0.5) + vec3(0., 1., 0.) * (hId2 - 0.5)) * 1.0 * hK + (Tn * (fId - 0.5) + vec3(0., 1., 0.) * (fId2 - 0.5)) * 1.1 * fK + (Tn * (gId - 0.5) + vec3(0., 1., 0.) * (gId2 - 0.5)) * mix(0.3, 0.8, 1. - above) * gK);
  // the old tide line: 2 m of dark weed under 1 m of white barnacle, dead level
  float tong = vn(vec2(s * 0.85, 4.)); tong = tong * tong * (0.55 + 0.45 * vn(vec2(s * 3.9, 7.))) + 0.25 * vn(vec2(s * 9., 1.));   // the weed hangs in ragged tongues
  float strand = vn(vec2(s * 9., y * 0.8)) * 0.6 + vn(vec2(s * 23., y * 2.1)) * 0.4;
  float wlen = 0.55 + 3.0 * tong, wgap = smoothstep(0.26, 0.42, vn(vec2(s * 0.31, 12.)) * 0.75 + vn(vec2(s * 1.7, 6.)) * 0.35);      // stretches where the rock shows through
  float wv = (wtop - y) / max(wlen, 0.05);                                                             // 0 at the line, 1 at the frond tips
  float weed = smoothstep(-0.06, 0.04, wtop - y) * (1. - smoothstep(0.45, 1.05, wv + 0.75 * (strand - 0.5))) * wgap * (1. - eastF);     // tips fray into single strands
  vec3 weedCol = mix(vec3(0.030, 0.034, 0.018), vec3(0.17, 0.115, 0.045), strand * (0.55 + 0.45 * grain2)) * (1. - 0.35 * smoothstep(0.3, 1., wv));
  weedCol += vec3(0.10, 0.12, 0.10) * smoothstep(0.72, 0.9, vn(vec2(s * 13., y * 3.5)));                 // wet glints
  float drip = (1. - smoothstep(0.5, 9., wtop - y + 5. * (vn(vec2(s * 1.1, 9.)) - 0.5))) * smoothstep(0.30, 0.62, vn(vec2(s * 1.6, y * 0.06 + 2.))) * (1. - above) * (1. - eastF);
  alb *= 1. - 0.42 * drip;                                                                              // the rock under the weed is still dark with what drains out of it
  alb = mix(alb, weedCol, weed * 0.95);
  // barnacle: a crust of tiny pale cones, dense for half a metre above the weed, breaking upward into ragged patches
  float bz = y - wtop, bTop = 0.55 + 1.1 * vn(vec2(s * 0.62, 21.)) + 0.35 * (vn(vec2(s * 2.7, 3.)) - 0.5);
  float bDense = smoothstep(-0.05, 0.06, bz) * (1. - smoothstep(0.2, max(bTop, 0.3), bz));
  float bPatch = smoothstep(0.50, 0.60, vn(gp * 2.9 + 40.) * 0.55 + vn(gp * 7.7) * 0.25 + 0.85 * bDense - 0.12 * clamp(part + joint, 0., 1.));
  float cones = mix(0.5, vn(gp * 26.) * 0.55 + vn(gp * 67.) * 0.45, 1. - smoothstep(12., 60., dist));
  vec3 crustCol = mix(uBone * 0.52, uWhite * 0.70, smoothstep(0.30, 0.68, cones)) * (0.90 + 0.2 * grain2);
  float barn = bPatch * step(0., bz + 0.05) * (1. - eastF) * (1. - backF);
  alb = mix(alb, crustCol, barn * 0.92);
  alb *= (1. - 0.74 * clamp(part + joint, 0., 1.) * (0.35 + 0.65 * lod)) * (0.8 + 0.3 * bandTone);
  // at the 9 m pass: pits, pores and hair cracks so the face is never a smooth slab
  float lod3 = 1. - smoothstep(14., 70., dist);
  float pit = vn(gp * 7.3) * vn(gp * 17. + 3.), crk = abs(vn(gp * 2.6 + 20.) + 0.35 * vn(gp * 6.1) - 0.68);
  alb *= 1. - lod3 * (1. - backF) * (0.12 * smoothstep(0.22, 0.55, pit) + 0.22 * (vn(gp * 31.) - 0.5) + 0.12 * above * (1. - smoothstep(0.0, 0.03, crk)));
  // light: warm key, blue sky fill, ochre bounce from the basin; shade settles to slate blue
  float mdl = dot(Nm, uSunDir);
  float lm = clamp(mdl * mix(1.15, 1.5, eastF) + mix(0.6, 0.5, eastF), 0., 1.);
  float det = clamp(1. + (dot(N, uSunDir) - mdl) * 1.5, 0.5, 1.45);
  float ndl = lm * det;
  float aoK = clamp(ao, 0., 1.15);
  float skyW = 0.55 + 0.45 * N.y, bncW = 0.5 - 0.5 * N.y;
  vec3 amb = (uSkyCol * skyW + uBounce * bncW * 0.55 + uSunCol * vec3(0.9, 0.8, 0.62) * (0.13 + 0.40 * (1. - lm)) * (1. - eastF)) * (0.35 + 0.65 * aoK);      // shade on the sunlit wall is filled warm by the rock around it
  vec3 col = alb * (uSunCol * ndl * (0.45 + 0.55 * aoK) + amb);
  float sh = 1. - smoothstep(0.06, 0.5, lm);
  col *= 1. + 0.75 * eastF * sh;                                                                     // POLISH 2: the east face is the same honey stone in shade, not a second material:
  col = mix(col, mix(uShade, uHoney * dot(uShade, vec3(0.45)), 0.30 * eastF) * (0.25 + 1.3 * dot(alb, vec3(0.33))) * (0.4 + 0.6 * aoK), sh * mix(0.09, 0.42, eastF));      // its beds and stains show through the blue
  col = mix(col, col * vec3(1.24, 1.03, 0.80), 0.55 * eastF);                                         // POLISH 2: honey stone under blue light is grey-mauve, not blue
  // the shaded east face keeps its form: beds, buttresses and gullies in two blues, ochre bounce on the lower cliffs
  float eb = fbm3(vec2(s * 0.012, y * 0.02)), eg = smoothstep(0.45, 0.75, vn(vec2(s * 0.045, 1.)) * (0.7 + 0.3 * vn(vec2(s * 0.2, y * 0.03))));
  float ebed = 1. - 0.5 * (1. - smoothstep(0.0, 0.14, fb)) - 0.25 * (1. - smoothstep(0.0, 0.1, fb2));
  float eb2 = smoothstep(0.3, 0.7, eb), strata = 0.78 + 0.44 * h21(vec2(bi, 5.)) * (0.5 + 0.5 * h21(vec2(floor(bqq / 4.), 8.)));
  col *= mix(1., (0.62 + 0.62 * eb2) * (1. - 0.4 * eg) * (0.85 + 0.3 * fb) * ebed * strata * (0.75 + 0.6 * clamp(Nm.y + 0.3, 0., 1.)), eastF);
  col += eastF * uBounce * 0.5 * (1. - smoothstep(-260., 80., y)) * (0.4 + alb);
  float bl = clamp(dot(N, vec3(0.72, -0.24, -0.65)) * 0.6 + 0.5, 0., 1.);                  // soft light off the bright basin models the facets
  col *= mix(1., 0.5 + 1.05 * bl, eastF);
  col = mix(col, col * vec3(1.26, 1.02, 0.74), eastF * clamp(0.4 - 0.9 * N.y + 0.4 * (strata - 1.), 0., 0.6));      // warm off the bright floor on faces that look down or out; ledge tops keep the sky's blue
  col *= smoothstep(0.1, 0.45, ao) * 0.85 + 0.15;                                                       // the cave mouth goes dark
  // water still draining out of the new rock: thin runnels sliding down below the tide line
  float runMask = smoothstep(0.60, 0.78, vn(vec2(s * 0.8, 2.))) * smoothstep(0.35, 0.6, vn(vec2(s * 0.5, y * 0.11 + 5.))) * (1. - above) * (1. - weed) * lod2 * (1. - eastF);
  float runT = vn(vec2(s * 5., y * 0.45 + uTime * 2.6)) * vn(vec2(s * 9., y * 1.4 + uTime * 4.1));
  col += (uSkyCol * 1.3 + uSunCol * 0.45) * runMask * smoothstep(0.34, 0.6, runT) * 0.42;
  col *= 1. - 0.25 * runMask;
  // spray mist hangs against the foot of the wall
  float mist = (1. - smoothstep(0., 60., y - waterY)) * smoothstep(380., 560., vInfo.w);
  col = mix(col, uHaze * 0.75 + uSunCol * 0.1, mist * 0.28);
  gl_FragColor = vec4(fogMix(col), 1.);
}`;

// ---------------------------------------------------------------------------------------------------------
// Spray: soft billboards pinned to the standing crests and to the pillow, thrown downwind on a 1.5 s loop.
// ---------------------------------------------------------------------------------------------------------
const SPRAY_VERT = /* glsl */`
attribute vec3 aPin;      // local x, local z, distance from the wall
attribute vec4 aRnd;      // phase, size, kind (0 crest, 1 pillow), variation
varying vec2 vUv; varying vec3 vSunV; varying vec4 vK;
${G_FOG_V}
uniform float uTime, uBurst; uniform vec3 uSunDir;
${WATER_H}
void main(){
  float bx = aPin.x + ${XO}.;
  float kind = aRnd.z, r = aRnd.w;
  float life = fract(uTime / (1.5 + 0.9 * kind) + aRnd.x), tau = life * (1.5 + 0.9 * kind);
  float burst = uBurst * (1. - smoothstep(450., 480., bx)) * (1. - kind);
  float gain = 1. + 0.5 * burst + 0.7 * uSurge * kind;
  vec3 p = vec3(aPin.x, waterH(bx, aPin.z, aPin.y, uTime - tau) - 1.5, aPin.y);
  vec3 vel = mix(vec3(15. + 11. * r, 6.5 + 7. * fract(r * 7.3), (fract(r * 13.7) - 0.5) * 7.),
                 vec3(8. + 6. * r, 10. + 8. * fract(r * 7.3), 1. + 5. * fract(r * 13.7)), kind) * gain;
  float drag = 1. - exp(-tau * 1.1), sheet = kind * step(0.6, r);               // two fifths of the pillow's spray is the thin sheet that climbs the wall past the old tide line
  vel = mix(vel, vec3(5. + 4. * fract(r * 5.1), 0., 0.4), sheet);
  p += vel * drag / 1.1; p.y -= 2.6 * tau * tau * (1. - 0.7 * kind) * (1. - sheet);
  p.y += sheet * (42. + 20. * fract(r * 7.3)) * (1. - exp(-tau * 1.4)) * (0.85 + 0.3 * uSurge);
  p.x += 9. * tau;                                        // the gale blows the way the water goes
  float size = aRnd.y * (0.45 + 1.5 * life) * (1. + 0.25 * kind) * (1. + 0.12 * burst);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  mvPosition.xy += position.xy * size * vec2(1.45, 0.95);
  float fade = smoothstep(0., 0.12, life) * (1. - life) * sqrt(1. - life);
  float nearF = smoothstep(8., 120., -mvPosition.z) * (0.45 + 0.55 * smoothstep(60., 260., -mvPosition.z));                 // POLISH 2: spray thins toward the lens: droplets past us, never a milky sheet
  vK = vec4(fade * nearF * (0.55 + 0.45 * fract(r * 3.1)) * min(gain, 1.25) * mix(0.25, 0.30, kind) * mix(1., 0.85, sheet), aRnd.x * 37., life, kind);
  vUv = position.xy; vSunV = normalize(mat3(modelViewMatrix) * uSunDir);
  #ifdef USE_FOG
  vFogDepth = -mvPosition.z;
  #endif
  gl_Position = projectionMatrix * mvPosition;
}`;
const SPRAY_FRAG = /* glsl */`
precision highp float;
${G_COMMON}
${G_FOG_F}
uniform vec3 uWhite, uHaze, uGold;
varying vec2 vUv; varying vec3 vSunV; varying vec4 vK;
void main(){
  float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
  float n = fbm3(vUv * 2.2 + vK.y + vec2(0., -vK.z * 1.5));
  float n2 = vn(vUv * 5.3 + vK.y * 1.7);
  float a = (1. - smoothstep(0.15, 1., r2 + (n - 0.5) * 1.1 + (n2 - 0.5) * 0.5)) * (0.35 + 0.65 * n) * vK.x;
  vec3 nrm = normalize(vec3(vUv * 0.9, sqrt(max(1. - r2, 0.)) + 0.25));
  float lit = clamp(dot(nrm, vSunV) * 0.6 + 0.45, 0., 1.);
  float rim = smoothstep(0.35, 0.95, r2) * max(-vSunV.z, 0.);                     // backlit edge takes the gold
  vec3 sunW = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.5, 0.2))), 0.62);                 // spray is white water: it takes the sun's strength, little of its gold
  vec3 col = uWhite * 0.78 * (sunW * lit * 0.9 + uHaze * (0.42 + 0.2 * n)) + uGold * uSunCol * rim * 0.3;
  gl_FragColor = vec4(fogMix(col), min(a * 0.95, 0.8));
}`;

function buildSpray(rng, L, U, fogU, detail) {
  const nCrest = Math.round(600 * detail), nPil = Math.round(300 * detail), n = nCrest + nPil;
  const pin = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    let bx, d, kind = 0;
    if (i < nCrest) {
      const w = i % 5, u = rng(); d = 3 + 430 * Math.pow(u, 1.4);
      const bow = 55 * (1 - Math.exp(-d / 160)) + 9 * Math.sin(d * 0.021 + 1.3);
      bx = 420 + 110 * w + bow + rng.range(1, 11);
    } else { kind = 1; d = Math.abs(rng.gauss()) * 7 + 0.5; bx = 566 - 0.35 * d + Math.abs(rng.gauss()) * 12; }
    pin[i * 3] = bx - XO; pin[i * 3 + 1] = L.wallZ(bx) + d; pin[i * 3 + 2] = d;
    rnd[i * 4] = rng(); rnd[i * 4 + 1] = rng.range(3.2, 7.5); rnd[i * 4 + 2] = kind; rnd[i * 4 + 3] = rng();
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aPin', new THREE.InstancedBufferAttribute(pin, 3));
  geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  geo.instanceCount = n;
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(120, -150, 150), 700);
  const u = fogU(); for (const k of ['uTime', 'uSurge', 'uBurst', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uWhite', 'uHaze', 'uGold']) u[k] = U[k];
  const mat = new THREE.ShaderMaterial({ vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, uniforms: u, fog: true, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'crest-spray'; mesh.renderOrder = 5;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// Six whole pines torn from the wall, riding the tongue: 12 m trunks with root plates, rolling in the waves.
// ---------------------------------------------------------------------------------------------------------
const flowTjs = (bx) => { const q = (bx - 300) / 70, aq = Math.abs(q); return 0.025 * bx + 0.1875 * (bx - 70 * (aq + Math.log(1 + Math.exp(-2 * aq)) - 0.6931472)); };
const SOLID_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vCol, vN, vL;
${G_FOG_V}
void main(){
  vec4 lp = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vL = lp.xyz; vN = n; vCol = color;
  vec4 mvPosition = modelViewMatrix * lp;
  #ifdef USE_FOG
  vFogDepth = -mvPosition.z;
  #endif
  gl_Position = projectionMatrix * mvPosition;
}`;
const SOLID_FRAG = /* glsl */`
precision highp float;
${G_COMMON}
${G_FOG_F}
uniform vec3 uHaze;
varying vec3 vCol, vN, vL;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float ndl = clamp(dot(N, uSunDir) * 0.8 + 0.2, 0., 1.);
  float g = 0.8 + 0.4 * vn(vL.xz * 6. + vL.y * 3.);
  vec3 col = vCol * g * (uSunCol * ndl + uSkyCol * (0.6 + 0.4 * N.y) + uBounce * (0.3 - 0.3 * N.y));
  col += uSkyCol * 0.5 * pow(1. - abs(N.y), 3.) * 0.6;                         // wet sheen
  gl_FragColor = vec4(fogMix(col), 1.);
}`;

function trunkGeometry(rng) {
  const P = [], C = [], I = [];
  const bark = new THREE.Color('#5A2E1C'), wet = new THREE.Color('#2A1710'), pale = new THREE.Color('#B89A72'), needle = new THREE.Color('#2F4A2C');
  const tmp = new THREE.Color();
  const tube = (pts, radii, sides, colAt) => {             // pts: array of Vector3; a lofted, tapered, bent limb
    const base = P.length / 3, up = new THREE.Vector3(0, 1, 0), t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < pts.length; i++) {
      t.subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
      a.crossVectors(t, Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize(); b.crossVectors(t, a);
      for (let j = 0; j < sides; j++) {
        const an = j / sides * 6.2831853, r = radii[i] * (1 + 0.12 * Math.sin(an * 3 + i * 1.7));
        P.push(pts[i].x + (a.x * Math.cos(an) + b.x * Math.sin(an)) * r, pts[i].y + (a.y * Math.cos(an) + b.y * Math.sin(an)) * r, pts[i].z + (a.z * Math.cos(an) + b.z * Math.sin(an)) * r);
        const c = colAt(i / (pts.length - 1), j); C.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < sides; j++) {
      const p0 = base + i * sides + j, p1 = base + i * sides + (j + 1) % sides, p2 = p0 + sides, p3 = p1 + sides;
      I.push(p0, p2, p1, p1, p2, p3);
    }
  };
  // trunk along +x from the root plate (x -6) to the broken top (x +6), a little bowed
  const pts = [], rad = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector3(-6 + 12 * u, 0.35 * Math.sin(u * 3.1), 0.2 * Math.sin(u * 5 + 1))); rad.push(i === 0 ? 0.3 : lerp(0.62, 0.2, Math.pow(u, 0.8)) * (i === 12 ? 0.5 : 1)); }
  tube(pts, rad, 8, (u, j) => tmp.copy(bark).lerp(wet, 0.35 + 0.4 * hash1(j * 3.3 + u * 40)).lerp(pale, u > 0.97 || u < 0.02 ? 0.7 : 0).clone());
  // root plate: a fan of torn roots
  for (let k = 0; k < 9; k++) {
    const an = k / 9 * 6.2831853 + rng.range(-0.2, 0.2), len = rng.range(1.5, 2.9), rp = [], rr = [];
    for (let i = 0; i <= 4; i++) { const u = i / 4, out = len * u; rp.push(new THREE.Vector3(-5.9 - 0.9 * u * u - 0.2 * u, Math.cos(an) * out, Math.sin(an) * out)); rr.push(lerp(0.26, 0.05, u)); }
    tube(rp, rr, 5, (u) => tmp.copy(wet).lerp(pale, 0.25 + 0.5 * u).clone());
  }
  // snapped branch stubs and what is left of the umbrella crown
  for (let k = 0; k < 7; k++) {
    const x0 = rng.range(1.5, 5.6), an = rng.range(0, 6.28), len = rng.range(0.9, 2.6), bp = [], br = [];
    for (let i = 0; i <= 3; i++) { const u = i / 3; bp.push(new THREE.Vector3(x0 + len * 0.5 * u, Math.cos(an) * len * u, Math.sin(an) * len * u)); br.push(lerp(0.13, 0.04, u)); }
    tube(bp, br, 4, () => tmp.copy(bark).lerp(wet, 0.5).clone());
    if (k < 5) {                                           // a tuft of needles at the stub's end
      const c = bp[3], tp = [], tr = [];
      for (let i = 0; i <= 3; i++) { const u = i / 3; tp.push(new THREE.Vector3(c.x - 0.5 + 1.1 * u, c.y, c.z)); tr.push(0.55 * Math.sin(Math.PI * (0.08 + 0.84 * u))); }
      tube(tp, tr, 6, (u, j) => tmp.copy(needle).multiplyScalar(0.7 + 0.5 * hash1(j + k * 7)).clone());
    }
  }
  // POLISH 2: what is left of the umbrella crown, still green: from a distance the thing in the water must read as a whole tree
  // (root plate, red trunk, dark flat crown), not as a brown splinter. Placed by hash so no seeded draw moves.
  for (let k = 0; k < 9; k++) {
    const an = hash1(k * 3.7 + 1) * 6.2831853, rr = 0.7 + 2.0 * Math.sqrt(hash1(k * 5.1 + 2)), cx = 4.4 + 2.4 * hash1(k * 7.9 + 3), cy = Math.cos(an) * rr, cz = Math.sin(an) * rr;
    tube([new THREE.Vector3(cx - 1.8, 0.1, 0), new THREE.Vector3(cx - 0.7, cy * 0.6, cz * 0.6), new THREE.Vector3(cx, cy, cz)], [0.13, 0.09, 0.05], 4, () => tmp.copy(bark).lerp(wet, 0.4).clone());
    for (let q = 0; q < 7; q++) {                          // a bough: a spray of stiff needle spikes, ragged against the water (never a smooth lump)
      const a2 = hash1(k * 4.1 + q * 2.7) * 6.2831853, el = (hash1(k * 1.3 + q * 5.9) - 0.35) * 1.5, len = 0.9 + 0.9 * hash1(k * 6.7 + q * 3.3);
      const dx = Math.cos(el) * Math.cos(a2) * 0.7 + 0.45, dy = Math.sin(el), dz = Math.cos(el) * Math.sin(a2), dl = Math.hypot(dx, dy, dz) || 1;
      const sp = [new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx + dx / dl * len * 0.55, cy + dy / dl * len * 0.55, cz + dz / dl * len * 0.55), new THREE.Vector3(cx + dx / dl * len, cy + dy / dl * len, cz + dz / dl * len)];
      tube(sp, [0.10, 0.30, 0.03], 4, (u) => tmp.copy(needle).multiplyScalar(0.7 + 0.8 * hash1(q * 1.7 + k * 7) + 0.3 * u).clone());
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  geo.setIndex(I); geo.computeVertexNormals();
  return geo;
}

function buildTrunks(rng, L, U, fogU, updaters) {
  const n = 6, geo = trunkGeometry(rng);
  const u = fogU(); for (const k of ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uHaze']) u[k] = U[k];
  const mat = new THREE.ShaderMaterial({ vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, uniforms: u, fog: true });
  const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.name = 'pine-trunks'; mesh.frustumCulled = false;
  const T0 = flowTjs(250), T1 = flowTjs(1000), span = T1 - T0;
  const tr = []; for (let i = 0; i < n; i++) tr.push({ ph: (i + rng.range(0, 0.7)) / n, d: i === 0 ? 30 : rng.range(22, 190), spin: rng.range(0.5, 1.1) * (rng.chance(0.5) ? 1 : -1), yaw: rng.range(-0.5, 0.5), wob: rng.range(0, 6) });
  for (const t of tr) t.yaw = (t.yaw < 0 ? -1 : 1) * (0.6 + 1.1 * Math.abs(t.yaw));      // lying across the flow: end-on from astern a trunk was only its root plate, a brown star
  const m = new THREE.Matrix4(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0);
  const place = (time, prog = -1) => {
    for (let i = 0; i < n; i++) {
      const t = tr[i], f = (time / span + t.ph) % 1, target = T0 + f * span;
      let lo = 250, hi = 1000; for (let k = 0; k < 18; k++) { const mid = (lo + hi) * 0.5; if (flowTjs(mid) < target) lo = mid; else hi = mid; }
      const keyed = i === 0 && prog >= 0, bx = keyed ? (prog < 0.47 ? 380 + (prog - 0.33) / 0.14 * 180 : 560 + (prog - 0.47) * 3000) : lo, z = L.wallZ(bx) + t.d;
      const h = (x) => rampY(x) + standY(x, t.d, time) + swellY(x, z, time);
      const y = h(bx), slope = (h(bx + 3) - h(bx - 3)) / 6;
      e.set(0, t.yaw + 0.3 * Math.sin(time * 0.4 + t.wob), Math.atan(slope), 'YZX'); qa.setFromEuler(e);
      qb.setFromAxisAngle(X, time * t.spin + t.wob); qa.multiply(qb);
      const s = keyed ? 1 - smoothstep(0.5, 0.58, prog) : smoothstep(0, 0.04, f) * (1 - smoothstep(0.93, 1, f));
      pos.set(bx - XO, y - 0.25 + 0.3 * Math.sin(time * 1.1 + t.wob), z); sc.setScalar(Math.max(s, 1e-3));
      m.compose(pos, qa, sc); mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  place(0);
  updaters.push((dt, time, cam, prog) => place(time, prog));
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// GANNET (exported for the world coder): 0.95 m long, 1.8 m span, facing +x, up +y, wings along +-z.
// Side view: cigar body, dagger bill a tenth of the length running straight into a flat crown, short thick neck,
// wedge tail; long narrow wings set mid-body, angled back at the wrist, the outer third black; buff head and nape,
// blue-grey bill, a dark line round a pale eye, black feet tucked under the tail.
// ---------------------------------------------------------------------------------------------------------
export function gannetGeometry() {
  const P = [], C = [], A = [], I = [], VC = [];      // VC: chord position of a wing vertex (for the folded wing)
  const WHITE = [0.76, 0.76, 0.73], BUFF = new THREE.Color('#E9C877'), BILL = new THREE.Color('#AFC3CF'), BLACK = [0.02, 0.02, 0.025];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const buff = [BUFF.r * 0.9, BUFF.g * 0.9, BUFF.b * 0.9], bill = [BILL.r * 0.85, BILL.g * 0.85, BILL.b * 0.85];
  // body: rings of [x, top, bottom, halfWidth]
  const R = [[0.480, .003, .003, .003], [0.455, .010, .008, .007], [0.420, .017, .013, .011], [0.385, .024, .020, .017], [0.360, .034, .030, .030],
    [0.330, .043, .038, .040], [0.290, .050, .046, .047], [0.240, .058, .056, .055], [0.180, .074, .075, .072], [0.110, .090, .095, .088],
    [0.020, .098, .108, .097], [-0.080, .094, .104, .092], [-0.180, .080, .086, .078], [-0.270, .060, .058, .060], [-0.340, .036, .028, .050],
    [-0.410, .014, .010, .046], [-0.470, .006, .004, .022], [-0.500, .003, .002, .004]];
  const SIDES = 14;
  for (let i = 0; i < R.length; i++) {
    const [x, top, bot, hw] = R[i];
    for (let j = 0; j < SIDES; j++) {
      const a = j / SIDES * 6.2831853, sn = Math.sin(a), cs = Math.cos(a);
      const y = (sn > 0 ? top : bot) * sn * (0.82 + 0.18 * Math.abs(sn)), z = hw * cs;
      P.push(x, y, z);
      let c = WHITE.slice();
      const hb = smoothstep(0.13, 0.27, x) * (0.6 + 0.4 * smoothstep(-0.3, 0.6, sn));          // buff wash on head and nape, strongest on the crown
      c = mixc(c, buff, hb * 0.95);
      if (x > 0.372) c = mixc(bill, BLACK, Math.abs(sn) < 0.25 && x < 0.47 ? 0.75 : 0);          // bill with its dark cutting edge
      else if (x > 0.345) { const de = Math.hypot(x - 0.362, y - 0.010); if (Math.abs(cs) > 0.5) c = mixc(c, BLACK, 1 - smoothstep(0.008, 0.024, de)); }   // dark skin round the eye, running to the bill
      c = mixc(c, [0.55, 0.57, 0.6], 0.22 * smoothstep(0.3, -0.9, sn) * smoothstep(0.3, 0.1, x)); // soft shade under the belly
      C.push(c[0], c[1], c[2]); A.push(0, 0, 0, smoothstep(0.17, 0.3, x));
    }
  }
  for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < SIDES; j++) {
    const a = i * SIDES + j, b = i * SIDES + (j + 1) % SIDES, c = a + SIDES, d = b + SIDES;
    I.push(a, b, c, b, d, c);
  }
  const fan = (cx, cy, cz, r, col, side, n = 8, hw = 1) => {       // a small disc facing +-z (eye parts)
    const base = P.length / 3; P.push(cx, cy, cz); C.push(...col); A.push(0, 0, 0, hw);
    for (let k = 0; k < n; k++) { const a = k / n * 6.2831853; P.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz - side * r * 0.25); C.push(...col); A.push(0, 0, 0, hw); }
    for (let k = 0; k < n; k++) { const p1 = base + 1 + k, p2 = base + 1 + (k + 1) % n; if (side > 0) I.push(base, p1, p2); else I.push(base, p2, p1); }
  };
  for (const s of [-1, 1]) {
    fan(0.362, 0.011, s * 0.0305, 0.0085, [0.72, 0.78, 0.80], s);            // pale iris
    fan(0.3625, 0.011, s * 0.0318, 0.0040, BLACK, s, 6);                      // pupil
    fan(0.3645, 0.0135, s * 0.0326, 0.0016, [2.2, 2.2, 2.2], s, 4);           // one bright highlight
    // black webbed foot tucked flat under the tail
    const base = P.length / 3, fz = s * 0.022;
    P.push(-0.33, -0.030, fz, -0.43, -0.012, fz - 0.009, -0.43, -0.012, fz + 0.009, -0.38, -0.034, fz);      // (small and far back: from below they must not read as marks on the belly)
    for (let k = 0; k < 4; k++) { C.push(0.16, 0.16, 0.17); A.push(0, 2, k, 0); }      // aAnim.y 2 marks a foot
    I.push(base, base + 1, base + 2, base, base + 3, base + 1, base, base + 2, base + 3, base + 3, base + 2, base + 1);
  }
  // wings: an airfoil sheet, top and bottom, NS stations out along the span
  const NS = 13, NCH = 6, HALF = 0.83;
  for (const s of [-1, 1]) for (const face of [1, -1]) {
    const base = P.length / 3;
    for (let i = 0; i <= NS; i++) {
      const u = i / NS, h = Math.max(0, (u - 0.42) / 0.58);
      const le = u < 0.42 ? lerp(0.13, 0.175, u / 0.42) : lerp(0.175, -0.11, Math.pow(h, 1.15));
      const ch = u < 0.42 ? lerp(0.215, 0.19, u / 0.42) : lerp(0.19, 0.028, Math.pow(h, 1.35));
      for (let j = 0; j <= NCH; j++) {
        const v = j / NCH, th = 0.11 * ch * Math.sqrt(v) * (1 - v) * 2.2 * (1 - 0.6 * u);
        const y = 0.048 + 0.018 * Math.sin(u * 3.0) - 0.03 * u * u + 0.02 * ch * Math.sin(v * 3.14159) + (face > 0 ? th : -th * 0.35);
        P.push(le - ch * v, y, s * (0.065 + HALF * u));
        const blackness = smoothstep(0.60, 0.68, u + 0.22 * (v - 0.45));
        let c = mixc(WHITE, BLACK, blackness);
        c = mixc(c, mixc(c, [0.3, 0.3, 0.32], 0.5), 0.5 * (1 - blackness) * smoothstep(0.75, 1, v) * (face < 0 ? 1 : 0.4));   // grey along the trailing edge
        C.push(c[0], c[1], c[2]); A.push(s, u, h, 0); VC[P.length / 3 - 1] = v;
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NCH; j++) {
      const a = base + i * (NCH + 1) + j, b = a + 1, c = a + NCH + 1, d = c + 1;
      if (s * face > 0) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d);
    }
  }
  // THE STANDING POSE (ledge birds; aBird.w blends to it): body upright at 50 degrees on black feet, neck raised, head level
  // with the dagger bill horizontal, wings folded along the flanks with the black tips crossed over the tail.
  const nv = P.length / 3, PP = new Float32Array(nv * 3), TH = 0.87, GY = -0.275;
  const rot = (x, y, px, py, a) => { const c = Math.cos(a), s = Math.sin(a), dx = x - px, dy = y - py; return [px + dx * c - dy * s, py + dx * s + dy * c]; };
  for (let i = 0; i < nv; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], side = A[i * 4], u = A[i * 4 + 1];
    let X, Y, Z = z;
    if (u > 1.5) {                                         // a foot: ankle in the belly feathers, two toes spread forward on the rock, a heel
      const k = A[i * 4 + 2], s = z < 0 ? -1 : 1, c = s * 0.04;
      [X, Y, Z] = [[-0.035, GY + 0.11, c], [0.085, GY, c + 0.034], [0.085, GY, c - 0.034], [-0.04, GY, c]][k];
    } else if (Math.abs(side) > 0.5) {
      const v = VC[i], t = smoothstep(0.55, 1, u);
      const xf = 0.11 - 0.60 * u - 0.03 * (v - 0.5), yf = 0.064 - 0.045 * u + (0.5 - v) * 0.10 * (1 - 0.75 * u);
      [X, Y] = rot(xf, yf, 0, 0, TH); Z = side * lerp(0.099, -0.014, t); Y = Math.max(Y, GY + 0.03);
    } else {
      let q = rot(x, y, 0.28, 0.0, -(TH + 0.28) * smoothstep(0.25, 0.34, x));      // the head comes level
      q = rot(q[0], q[1], 0.12, 0.0, 0.28 * smoothstep(0.10, 0.26, x));            // the neck stretches up
      [X, Y] = rot(q[0], q[1], 0, 0, TH); Y = Math.max(Y, GY + 0.012 + 0.02 * Math.abs(z));      // the tail rests on the ledge
    }
    PP[i * 3] = X; PP[i * 3 + 1] = Y; PP[i * 3 + 2] = Z;
  }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(PP, 3)); tg.setIndex(I); tg.computeVertexNormals();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aPerch', new THREE.BufferAttribute(PP, 3)); geo.setAttribute('aPerchN', tg.attributes.normal);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  geo.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
  geo.setIndex(I); geo.computeVertexNormals();
  return geo;
}

const GANNET_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aAnim;   // wing side (-1, 0, +1), span 0..1, hand 0..1 beyond the wrist, head weight
attribute vec4 aBird;                         // per bird: phase 0..1, dive 0..1 (wings thrown back), flap 0..1 (1 = beat without gliding), perch 0..1 (standing, wings folded)
attribute vec3 aPerch, aPerchN;
uniform float uTime;
varying vec3 vCol, vN; varying vec2 vWing;
${G_FOG_V}
void main(){
  vec3 p = position, n = normal;
  float side = aAnim.x, u = aAnim.y, hand = aAnim.z, dive = aBird.y;
  float tt = uTime + aBird.x * 4., ph = mod(tt, 4.);
  // shallow beats at 3 Hz for 2 s, then a 2 s glide on flat wings
  float flap = mix(smoothstep(0., 0.35, ph) * (1. - smoothstep(1.7, 2.05, ph)), 1., aBird.z) * (1. - dive);
  float w = 18.849556 * tt, sw = sin(w), cw = cos(w);
  if (abs(side) > 0.5) {
    vec3 piv = vec3(0.06, 0.048, side * 0.065);
    vec3 q = p - piv;
    float sweep = dive * (1.05 + 0.45 * hand) + flap * 0.12 * hand * max(cw, 0.);      // hand folds back on the upstroke; arrow in the dive
    float cs = cos(sweep), sn = sin(sweep), zz = abs(q.z);
    q = vec3(q.x * cs - zz * sn, q.y, q.x * sn + zz * cs);
    float ang = flap * (0.36 * sw + 0.07) * (0.35 + 0.65 * u) + flap * 0.30 * sin(w - 1.0) * hand
              + (1. - flap) * (0.035 * sin(tt * 0.8) + 0.02) - dive * 0.08;
    float ca = cos(ang), sa = sin(ang);
    float y2 = q.y * ca + q.z * sa, z2 = q.z * ca - q.y * sa;
    p = piv + vec3(q.x, y2, side * z2);
    n = vec3(n.x, n.y * ca + side * n.z * sa, n.z * ca - side * n.y * sa);
  }
  p.y += (1. - aAnim.w) * 0.03 * sin(w - 1.4) * flap;                                   // the body rises and falls, the head holds still
  float perch = clamp(aBird.w, 0., 1.);
  p = mix(p, aPerch, perch); n = mix(n, aPerchN, perch) + vec3(0., 1e-5, 0.);
  vec4 lp = vec4(p, 1.);
  #ifdef USE_INSTANCING
  lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vN = n; vCol = color; vWing = vec2(u, abs(side));
  vec4 mvPosition = modelViewMatrix * lp;
  #ifdef USE_FOG
  vFogDepth = -mvPosition.z;
  #endif
  gl_Position = projectionMatrix * mvPosition;
}`;
const GANNET_FRAG = /* glsl */`
precision highp float;
${G_COMMON}
${G_FOG_F}
varying vec3 vCol, vN; varying vec2 vWing;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float ndl = clamp(dot(N, uSunDir) * 0.7 + 0.3, 0., 1.);
  float feather = 1. - 0.07 * vWing.y * smoothstep(0.3, 0.5, vWing.x) * (1. - smoothstep(0.08, 0.3, abs(fract(vWing.x * 27.) - 0.5)));   // feather partings along the wing
  vec3 col = vCol * feather * (uSunCol * ndl * 0.9 + uSkyCol * (0.9 + 0.7 * N.y) + uBounce * (0.6 - 0.6 * N.y));
  gl_FragColor = vec4(fogMix(col), 1.);
}`;

// buildGannets(count, uniforms): uniforms must hold uTime, uSunDir, uSunCol, uSkyCol, uBounce (hero.uniforms does; uSunDir is in the
// hero's local frame, so add the mesh to hero.object or to a parent with the same orientation). Returns { object, count, place(i, o), commit() }
// place(i, { position: Vector3, yaw, pitch, bank, phase, dive, flap, scale }) writes one bird; commit() uploads. 1,060 triangles a bird, 1 draw call.
export function buildGannets(count, uniforms) {
  const geo = gannetGeometry();
  const bird = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); bird.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aBird', bird);
  const u = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  for (const k of ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce']) u[k] = uniforms[k];
  const mat = new THREE.ShaderMaterial({ vertexShader: GANNET_VERT, fragmentShader: GANNET_FRAG, uniforms: u, fog: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count); mesh.name = 'gannets'; mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  return {
    object: mesh, count, geometry: geo, material: mat,
    place(i, o) {
      e.set(o.bank || 0, o.yaw || 0, o.pitch || 0, 'YZX'); q.setFromEuler(e); sc.setScalar(o.scale ?? 1);
      m.compose(o.position, q, sc); mesh.setMatrixAt(i, m);
      bird.setXYZW(i, o.phase ?? (i * 0.37) % 1, o.dive || 0, o.flap || 0, o.perch || 0);
    },
    commit() { mesh.instanceMatrix.needsUpdate = true; bird.needsUpdate = true; },
  };
}

// the hero's own skein: gannets strung out in a line, working a long racetrack over the lip where the swell irons flat
function buildSkein(rng, U, n, updaters) {
  const G = buildGannets(n, U), pos = new THREE.Vector3();
  const birds = []; for (let i = 0; i < n; i++) birds.push({ off: i * 0.085 + rng.range(-0.02, 0.02), dy: rng.range(-1.5, 2.5), dz: rng.range(-5, 5), ph: rng(), sc: rng.range(0.94, 1.06) });
  const A = 150, B = 44, W = -0.15, cx = -270, cz = 62;
  const at = (th, out) => out.set(cx + A * Math.cos(th), 0, cz + B * Math.sin(th));
  const p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
  const fly = (time) => {
    for (let i = 0; i < n; i++) {
      const b = birds[i], th = time * W - b.off + 1.2;
      at(th, pos); at(th + 0.02 * Math.sign(W), p1); at(th + 0.04 * Math.sign(W), p2);
      const y1 = Math.atan2(-(p1.z - pos.z), p1.x - pos.x), y2 = Math.atan2(-(p2.z - p1.z), p2.x - p1.x);
      let dy = y2 - y1; if (dy > Math.PI) dy -= 6.2831853; if (dy < -Math.PI) dy += 6.2831853;
      pos.y = 15 + b.dy + 3.5 * Math.sin(th * 2 + i) + 0.5 * Math.sin(time * 0.7 + i * 2.1); pos.z += b.dz;
      G.place(i, { position: pos, yaw: y1, bank: clamp(-dy * 22, -0.7, 0.7), pitch: 0.05 * Math.cos(th * 2 + i), phase: b.ph, scale: b.sc });
    }
    G.commit();
  };
  fly(0); updaters.push((dt, time) => fly(time));
  return G;
}

// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const L = makeLines();
  const group = new THREE.Group(); group.name = 'atlantic-falls-in-hero';
  const sunWorld = new THREE.Vector3(-0.828, 0.407, 0.386);
  const U = {
    uTime: { value: 0 }, uSurge: { value: 0 }, uBurst: { value: 0 }, uProgress: { value: -1 },
    uSunDir: { value: sunWorld.clone() },
    uSunCol: { value: new THREE.Color('#F4C56A').lerp(new THREE.Color('#ffffff'), 0.4).multiplyScalar(1.18) },
    uSkyCol: { value: new THREE.Color('#5E8FD0').multiplyScalar(0.42) },
    uBounce: { value: new THREE.Color('#C9A46A').multiplyScalar(0.30) },
    uCam: { value: new THREE.Vector3(0, 8, 200) },
    uCobalt: { value: pal[0] }, uGreen: { value: pal[1] }, uWhite: { value: pal[2] }, uHoney: { value: pal[3] },
    uBone: { value: pal[4] }, uHaze: { value: pal[5] }, uGold: { value: pal[6] },
    uShade: { value: new THREE.Color(opts.shade || '#5F7FA8') }, uTide: { value: 8 },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const pick = (...names) => { const o = fogU(); for (const n of names) o[n] = U[n]; return o; };
  const LIGHT = ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uCam'];

  // per-seed variety: where the ledges are, the weed line's wobble, the swell's set
  const seedPhase = rng.range(0, 100);

  // ---- water -------------------------------------------------------------------------------------------
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true,
    uniforms: pick(...LIGHT, 'uSurge', 'uCobalt', 'uGreen', 'uWhite', 'uHaze', 'uGold'),
  });
  const water = new THREE.Mesh(await buildWaterGeometry(L, ctx), waterMat); water.name = 'tongue';
  group.add(water);
  await ctx.yield();

  // ---- wall and Rock -----------------------------------------------------------------------------------
  const ROW_H = 100 / 46;
  const shelves = [];
  for (let i = 0; i < 18; i++) {
    const bx = i < 13 ? lerp(445, 706, (i + rng.range(0.1, 0.9)) / 13) : rng.range(200, 430);
    shelves.push({ bx, y: -40 + Math.round((rng.range(24, 62) + 40) / ROW_H) * ROW_H, w: rng.range(5, 12), d: rng.range(2.6, 5.2), s: 0 });
  }
  for (let i = 0; i < 10; i++) {                         // low ledges along the close pass: cut INTO the face, so the 9 m clearance holds
    const bx = i === 0 ? 516 : lerp(534, 704, (i - 1 + rng.range(0.15, 0.85)) / 9);          // the first is the gannets' ledge, where the wall closes in
    shelves.push({ bx, y: -40 + Math.round(((i === 0 ? 12.2 : i % 2 ? rng.range(13.5, 21) : rng.range(11.5, 12.6)) + 40) / ROW_H) * ROW_H, w: i === 0 ? 8.5 : rng.range(5, 9), d: i === 0 ? 3.7 : rng.range(2.6, 3.8), s: 0, low: true, colony: i === 0 });
  }
  { const st0 = faceStations(L); for (const sh of shelves) { let b = st0[0]; for (const p of st0) if (p.e === 0 && Math.abs(p.x - sh.bx) < Math.abs(b.x - sh.bx)) b = p; sh.s = b.s; sh.st = b; } }
  const wallB = await buildWallGeometry(ctx, L, shelves);
  const wallMat = new THREE.ShaderMaterial({
    vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.DoubleSide,      // (a block face that folds back on itself must not open a window into the hill)
    uniforms: pick(...LIGHT, 'uHoney', 'uBone', 'uHaze', 'uShade', 'uWhite', 'uTide'),
  });
  const wall = new THREE.Mesh(wallB.geo, wallMat); wall.name = 'wall-and-rock';
  group.add(wall);
  await ctx.yield();
  // ledge anchors read back from the built face
  const ledges = [];
  { const P = wallB.geo.attributes.position, st = wallB.st;
    for (const sh of shelves) {
      const c = Math.max(st.findIndex((p) => p.s === sh.s), 0), r = 24 + Math.round((sh.y + 40) / ROW_H), k = c * wallB.NR + r;
      ledges.push({ position: [P.getX(k) - sh.st.nx * sh.d * 0.45, P.getY(k) + 0.1, P.getZ(k) - sh.st.nz * sh.d * 0.45], normal: [sh.st.nx, 0, sh.st.nz], size: sh.w, low: !!sh.low, colony: !!sh.colony });
    } }

  const updaters = [];
  group.add(buildSpray(rng, L, U, fogU, detail));
  await ctx.yield();
  group.add(buildTrunks(rng, L, U, fogU, updaters));
  await ctx.yield();
  const nGannets = opts.gannets === false ? 0 : Math.round(opts.gannets ?? 7);
  const skein = nGannets > 0 ? buildSkein(rng, U, nGannets, updaters) : null;
  if (skein) group.add(skein.object);
  await ctx.yield();
  // --- more pieces ---

  // ---- anchors -----------------------------------------------------------------------------------------
  const toL = (p) => [p[0] - XO, p[1], p[2]];
  const fly = L.pts.map(toL), end = fly[fly.length - 1];
  const waterHeight = (x, z, time = 0) => { const bx = x + XO, d = z - L.wallZ(bx); return rampY(bx) + standY(bx, d, time) + swellY(bx, z, time); };
  const anchors = {
    flyThrough: fly,
    portalSeat: { position: end, facing: [-L.endDir[0], 0, -L.endDir[2]], radius: 7 },
    firstCrest: [420 + 4 - XO, waterHeight(424 - XO, L.pathZ(424)), L.pathZ(424)],
    pillow: [556 - XO, rampY(556) + 56, L.wallZ(556) + 2],
    caveMouth: [628 - XO, 23, L.wallZ(628) + 2],
    prowTip: [735 - XO, 8, L.wallZ(712) - 12],
    rockCrest: [700 - XO, 255, L.wallZ(700) - 60],
    tideLine: 8, ledges,
    viewpoints: {
      entry: { position: toL([0, 8, 0]), lookAt: toL([330, 0, -20]) },
      firstWave: { position: toL([395, 8, L.pathZ(395)]), lookAt: toL([440, -12, L.pathZ(440) + 6]) },
      wallPass: { position: toL([585, 8, L.pathZ(585)]), lookAt: toL([640, 2, L.pathZ(640) - 4]) },
      pastProw: { position: toL([790, 8, L.pathZ(790)]), lookAt: toL([900, -120, L.pathZ(790) + 60]) },
      lookBack: { position: toL([930, 8, L.pathZ(860) - 50]), lookAt: toL([640, -60, L.wallZ(640) + 60]) },
    },
    waterHeight, wallZ: (x) => L.wallZ(x + XO), pathZ: (x) => L.pathZ(x + XO),
  };

  const inv = new THREE.Matrix4(), q = new THREE.Quaternion(), camW = new THREE.Vector3();
  let progress = -1;
  const hero = {
    object: group, radius: 300, height: 200, center: new THREE.Vector3(60, 55, -60), anchors, uniforms: U,
    ground: false, groundY: -300,
    setProgress(u) { progress = u; U.uProgress.value = u; },
    setLight(o = {}) {
      if (o.sunDir) sunWorld.copy(o.sunDir.isVector3 ? o.sunDir : new THREE.Vector3().fromArray(o.sunDir)).normalize();
      if (o.sunColor) U.uSunCol.value.set(o.sunColor).multiplyScalar(o.sunIntensity ?? 1.18);
      if (o.sky) U.uSkyCol.value.set(o.sky).multiplyScalar(o.skyIntensity ?? 0.42);
      if (o.bounce) U.uBounce.value.set(o.bounce).multiplyScalar(o.bounceIntensity ?? 0.30);
    },
    update(dt, time, camera) {
      U.uTime.value = time + seedPhase;
      group.updateWorldMatrix(true, false);
      inv.copy(group.matrixWorld).invert();
      if (camera) { camW.setFromMatrixPosition(camera.matrixWorld); U.uCam.value.copy(camW).applyMatrix4(inv); }
      group.getWorldQuaternion(q).invert();
      U.uSunDir.value.copy(sunWorld).applyQuaternion(q).normalize();
      // progress-keyed accents (eased bells); without setProgress they stay at their ambient level
      const bellU = (u0, w) => { const x = (progress - u0) / w; return progress < 0 ? 0 : Math.exp(-x * x); };
      U.uSurge.value = bellU(0.47, 0.05); U.uBurst.value = bellU(0.39, 0.035);
      for (const f of updaters) f(dt, time, camera, progress);
    },
    dispose() {},
  };
  if (opts.sunDir || opts.sunColor || opts.skyColor || opts.bounceColor) hero.setLight({ sunDir: opts.sunDir, sunColor: opts.sunColor, sky: opts.skyColor, bounce: opts.bounceColor });
  hero.update(0, 0, null);
  return hero;
}
