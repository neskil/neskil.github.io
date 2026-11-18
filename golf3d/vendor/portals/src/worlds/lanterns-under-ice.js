// LANTERNS UNDER THE ICE
// The black ocean under the ice shell of a distant moon. A sea-bed valley of pillow lava and smoking mineral
// chimneys, an ice ceiling split by glowing fissures, hundreds of amber lantern-jellies rising like sky lanterns,
// fish that are only spines of light, and the Leviathan (src/parts/lanterns-under-ice.js) rising out of a chasm
// ahead-left and swimming over the camera (head on at u 0.52, overhead u 0.55..0.64) while its light reveals the valley.
// A travelling company of big lanterns keeps beside the flight from u 0.13 to the portal, with a lower tier over the sea
// bed, and the GREAT LANTERNS (giant lantern-jellies with bells 11 to 17 m across, canals of amber light, turquoise beads on
// margin and tentacles) hang as landmarks 20 to 60 m from the path at u 0.305, 0.395, 0.47, by the brine column, 0.80, 0.842,
// 0.885 and 0.925, each laying a wide pool of amber on the sea bed (baked); on the way: the curtain hall (u 0.27..0.33, algae curtains with shafts of fissure light), a shoal of light-spines
// round a near smoker (u 0.385), the chasm glowing before the Leviathan shows (u 0.43), the brine column, two hoops of
// lanterns before the chimney ring (four on the rare visit, ctx.vary.rare).
//
// Everything is lit by emitters. The sea bed, chimneys and rocks share one "abyss" shader: the light of up to NV
// vents and of the lanterns hanging near is baked per vertex at build time, the Leviathan's light, the travelling company's amber and the portal's glow are added per vertex live, plus a dim caustic-flickered blue from the
// ice; bacterial mats, vent mouths, glowing lava creases and brine frost are emissive masks in the same shader.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';
import { buildHero } from '../parts/lanterns-under-ice.js';

const NV = 100;                // vent lights baked into the rock
const DURATION = 46;           // seconds
const U_PASS = 0.55;           // path fraction of the place where the Leviathan crosses over the path
const T_PASS = 0.63;           // path fraction of the camera at the moment the Leviathan's mid-body is over that place: its head
                               // meets the camera at u = 0.52..0.55 and the camera then runs under it from chin to tail
// 3x3 cellular noise: (F1, approximate distance to the cell edge, cell id). A third of the cost of fx.GLSL_VORONOI,
// which matters because the sea bed and the ice fill the whole frame.
const NOISE_GLSL = fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
vec3 cell2(vec2 x) {
  vec2 n = floor(x), f = fract(x); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = hash22(n + g); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = o.x; } else if (d < d2) { d2 = d; }
  }
  d1 = sqrt(d1); d2 = sqrt(d2);
  return vec3(d1, (d2 - d1) * 0.5, id);
}
`;

// ---------------------------------------------------------------------------------------------- abyss (rock) shader
const ABYSS_VERT = /* glsl */`
attribute vec4 aFx;                       // x bacterial mat, y hot (vent glow), z mineral crust, w brine frost
attribute vec2 aBake;                     // x light of all the vents, y light of the lantern-jellies that hang near: both summed once at build time (per vertex or per instance)
uniform vec3 uVentCol, uLevPos, uLevCol, uPortalPos, uPortalCol, uLanCol, uLampPos, uLampCol;
uniform float uTime, uLevFall;
varying vec3 vW, vN, vLight; varying vec4 vFx;
#include <fog_pars_vertex>
void main() {
  vec4 lp = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * lp;
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vFx = aFx;
  // warm vent light, shimmering as the hot water wavers
  float bk = aBake.x * (0.84 + 0.16 * sin(uTime * 2.3 + vW.x * 0.23 + vW.z * 0.19 + vW.y * 0.31));
  vec3 L = uVentCol * bk + vec3(1.0, 0.7, 0.4) * (0.3 * bk * bk);   // hotter light is whiter
  // amber of the lanterns hanging near (baked), breathing slowly as they pulse and drift
  L += uLanCol * (aBake.y * (0.8 + 0.2 * sin(uTime * 1.3 + vW.x * 0.11 - vW.z * 0.13)));
  vec3 d = uLampPos - vW; float r2 = dot(d, d);            // and of the company of lanterns travelling beside the camera (live)
  L += uLampCol * (max(dot(vN, d * inversesqrt(r2 + 0.01)) * 0.6 + 0.4, 0.0) / (1.0 + r2 * 0.0035));
  d = uLevPos - vW; r2 = dot(d, d);
  L += uLevCol * (1.5 * max(dot(vN, d * inversesqrt(r2 + 0.01)) * 0.6 + 0.4, 0.0) / (1.0 + r2 * uLevFall * 0.6));
  d = uPortalPos - vW; r2 = dot(d, d);
  L += uPortalCol * (max(dot(vN, d * inversesqrt(r2 + 0.01)) * 0.6 + 0.4, 0.0) / (1.0 + r2 * 0.004));
  vLight = L;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ABYSS_FRAG = /* glsl */`
uniform vec3 uIceCol, uVentCol, uMatCol, uFrostCol;
uniform float uTime, uSun;
varying vec3 vW, vN, vLight; varying vec4 vFx;
${NOISE_GLSL}
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(vN);
  vec2 p = vW.xz + vW.y * vec2(0.37, 0.29);
  float n1 = vnoise(p * 0.13), n2 = vnoise(p * 0.55 + 3.1), n3 = vnoise(p * 2.3);
  vec3 vo = cell2(p * 0.4 + n1 * 1.3);                     // pillow-lava lobes with dark creases
  float crease = smoothstep(0.0, 0.14, vo.y);
  vec3 rock = mix(vec3(0.028, 0.034, 0.046), vec3(0.12, 0.135, 0.16), n1 * 0.55 + n2 * 0.45);
  rock *= (0.5 + 0.5 * crease) * (0.7 + 0.6 * n3) * (0.75 + 0.5 * vo.z);
  vec3 mineral = mix(vec3(0.15, 0.1, 0.06), vec3(0.24, 0.225, 0.19), n2) * (0.65 + 0.7 * n3);
  vec3 alb = rock;
  if (vFx.z > 0.01) {                                        // mineral crust, running down the chimney walls
    float streak = vnoise(vec2(p.x * 1.3 + p.y * 0.4, vW.y * 0.22));
    float pores = vnoise(p * 4.1 + vW.y * 1.9);
    alb = mix(rock, mineral * (0.3 + 0.7 * crease) * (0.4 + 1.25 * streak), clamp(vFx.z * (0.2 + 0.8 * n2), 0.0, 0.85));
    alb *= mix(1.0, 0.35 + 1.3 * pores * (0.5 + n3), vFx.z);
    // on the steep chimney walls: beads of sulphide, dark runnels and pale mineral bands
    float steep = smoothstep(0.25, 0.75, 1.0 - n.y * n.y) * vFx.z;
    float h = dot(vW.xz, abs(n.x) > abs(n.z) ? vec2(0.22, 1.0) : vec2(1.0, 0.22));    // along the wall, whichever way it faces
    vec3 bd = cell2(vec2(h * 0.95, vW.y * 0.8) + 2.0 * n1);
    float bead = smoothstep(0.6, 0.1, bd.x);
    float knob = vnoise(vec2(h * 3.4, vW.y * 2.9) + 7.0);
    float runnel = vnoise(vec2(h * 1.7, vW.y * 0.1));
    float band = smoothstep(0.58, 0.8, vnoise(vec2(h * 0.2, vW.y * 0.75 + n2 * 1.5)));
    alb *= mix(1.0, (0.3 + 0.95 * bead * (0.45 + 0.55 * bd.z)) * (0.5 + 1.0 * knob) * (0.5 + 0.8 * smoothstep(0.25, 0.75, runnel)), steep);
    alb = mix(alb, alb * 0.5 + vec3(0.17, 0.16, 0.13) * (0.3 + 0.7 * knob), band * steep * 0.55);
  }
  // dim blue from the ice, flickering like caustics from the fissures
  float ca = vnoise(vW.xz * 0.09 + uTime * vec2(0.19, 0.13)) * vnoise(vW.xz * 0.21 - uTime * vec2(0.11, 0.17) + 5.0);
  vec3 ice = uIceCol * uSun * (0.22 + 0.78 * max(n.y, 0.0)) * (0.6 + 2.6 * ca);
  vec3 col = alb * (ice + vLight);
  // glowing bacterial mats
  float mm = vFx.x;
  float matN = vnoise(p * 0.6 + 9.0) * 0.55 + n3 * 0.3 + n2 * 0.15;
  float matP = smoothstep(0.55, 0.8, matN + mm * 0.3) * smoothstep(0.08, 0.5, mm);
  float pulse = 0.62 + 0.38 * sin(uTime * 0.7 + n1 * 12.0 + vW.x * 0.05);
  col += uMatCol * (matP * pulse * (0.75 + 0.25 * crease) * (0.25 + 0.75 * n3) * (0.35 + 0.65 * mm));
  // vent mouths and glowing lava in the creases near vents
  float hot = vFx.y;
  col += uVentCol * (smoothstep(0.8, 1.0, hot) * 4.0 + hot * (1.0 - smoothstep(0.0, 0.07, vo.y)) * (0.4 + 0.6 * n2) * 3.6) * (0.75 + 0.25 * sin(uTime * 2.3 + n1 * 20.0));
  // away from the vents too the pillow lava is young in patches: embers in the creases, breathing slowly
  float em = smoothstep(0.55, 0.78, vnoise(p * 0.043 + 17.0)) * (1.0 - vFx.z) * (1.0 - smoothstep(0.25, 0.7, hot)) * max(n.y, 0.0);
  col += uVentCol * (em * (1.0 - smoothstep(0.0, 0.045, vo.y)) * (0.25 + 0.75 * n2) * 1.4 * (0.7 + 0.3 * sin(uTime * 0.9 + n1 * 25.0 + vo.z * 6.0)));
  // brine frost creeping over the sea bed
  if (vFx.w > 0.002) {
    float fa = vnoise(p * 0.8 + 4.0), fb = vnoise(p * 3.3 + 1.3), fc = vnoise(p * 8.5 + 2.0);
    float frost = smoothstep(0.78 - 0.5 * vFx.w, 1.1 - 0.42 * vFx.w, fa * 0.5 + fb * 0.32 + fc * 0.18 + 0.3 * vFx.w);   // soft patches, denser at the foot
    vec3 f2 = cell2(p * 2.4 + 4.0 + fb);
    float feather = smoothstep(0.5, 0.0, f2.x) * (0.4 + 0.6 * fc);                                                 // rosettes of crystals
    float glint = smoothstep(0.78, 0.95, fc * (0.6 + 0.4 * sin(uTime * 1.3 + f2.z * 40.0)));
    col += uFrostCol * vFx.w * (frost * (0.22 + 0.55 * feather + 0.5 * glint) + 0.03 + 0.1 * n3 * n1);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------- ice ceiling
const ICE_VERT = /* glsl */`
varying vec3 vW, vN;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ICE_FRAG = /* glsl */`
uniform vec3 uIceCol, uCrackCol, uLevPos, uLevCol, uPortalPos, uPortalCol;
uniform float uTime, uSun, uLevFall, uSeed, uFis;
uniform vec2 uEntry;
varying vec3 vW, vN;
${NOISE_GLSL}
#include <fog_pars_fragment>
void main() {
  vec2 p = vW.xz + uSeed;
  vec2 wq = vec2(vnoise(p / 55.0), vnoise(p / 55.0 + 7.3));
  vec2 q = p / 27.0 + 0.6 * wq;
  vec3 v1 = cell2(q);                                        // plates
  float crack = 1.0 - smoothstep(0.0, 0.02, v1.y);
  float leak = exp(-v1.y * 9.0);
  vec3 v2 = cell2(q * 3.1 + 11.0);                           // crazing inside the plates
  float fine = 1.0 - smoothstep(0.0, 0.03, v2.y);
  float act = smoothstep(0.2, 0.65, vnoise(p / 75.0 + 21.0)); // where sunlight finds its way down the cracks
  vec2 de = vW.xz - uEntry;
  float thin = exp(-dot(de, de) / 2600.0);                   // the dip of ice ahead of the entry is thin: always lit, and it glows through
  act = max(act, sqrt(thin));
  // the great fissures: two families of long wandering lines
  float s1 = (p.x * 0.97 + p.y * 0.26) / 170.0 + 0.2 * wq.x + uFis, s2 = (p.y * 0.87 - p.x * 0.5) / 260.0 + 0.4 * wq.y;
  float fz = min(abs(fract(s1) - 0.5), abs(fract(s2) - 0.5) * 1.5);
  float fissure = 1.0 - smoothstep(0.0, 0.007, fz);
  float fglow = exp(-fz * 45.0);
  float cell = v1.z;
  float flick = 0.7 + 0.3 * sin(uTime * (0.5 + cell) + cell * 40.0);
  float shimmer = 0.55 + 0.9 * vnoise(p * 0.12 + uTime * vec2(0.23, 0.17));
  float facing = 0.5 + 0.5 * abs(normalize(vN).y);
  vec3 col = uIceCol * uSun * (0.022 + 0.055 * cell) * facing * shimmer * (0.55 + 0.9 * act);
  col += uCrackCol * uSun * shimmer * ((crack * 1.3 + leak * 0.22) * flick * (0.2 + 0.8 * act) + fine * 0.08 * act + fissure * 3.0 + fglow * 0.5);
  col += uCrackCol * uSun * shimmer * thin * (0.05 + 0.45 * leak + 0.16 * cell);
  vec3 d = uLevPos - vW;
  col += uIceCol * uLevCol * (0.007 + 0.13 * leak + 0.4 * crack + 0.016 * cell) / (1.0 + dot(d, d) * uLevFall);
  d = uPortalPos - vW;
  col += uIceCol * uPortalCol * 0.3 / (1.0 + dot(d, d) * 0.004);
  #ifdef FOG_EXP2
    float fd = fogDensity * vFogDepth * 0.8;                 // the glow of the cracks carries a little further
    col = mix(col, fogColor, 1.0 - exp(-fd * fd));
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// brine stalactites (instanced cones) and the brine column (one tube): self-lit ice
const BRINE_VERT = /* glsl */`
attribute float aT;
varying float vT, vT2; varying vec3 vW, vN; varying vec2 vUv2;
#include <fog_pars_vertex>
void main() {
  vec4 lp = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * lp;
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vT = fract(aT); vT2 = floor(aT) * 0.01; vUv2 = uv;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BRINE_FRAG = /* glsl */`
uniform vec3 uIceCol, uCrackCol, uLevPos, uLevCol, uPortalPos, uPortalCol;
uniform float uTime, uSun, uLevFall, uFlow;
varying float vT, vT2; varying vec3 vW, vN; varying vec2 vUv2;
${NOISE_GLSL}
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
  float fres = max(1.0 - abs(dot(n, v)), 0.0); fres *= fres;
  vec3 col = uCrackCol * uSun * (exp(-vT * 3.2) * 0.9 + 0.04) * (0.45 + 0.9 * fres);
  col += uIceCol * uSun * (0.03 + 0.2 * fres);
  if (uFlow > 0.0) {                                         // the brine column: light and dense brine sinking inside it
    float a = abs(vUv2.x - 0.5) * 6.2831853;                 // mirrored, so there is no seam
    float f1 = vnoise(vec2(a * 2.2 + sin(vW.y * 0.2), vW.y * 0.2 + uTime * 1.8));      // veins of dense brine sinking
    float f2 = vnoise(vec2(a * 5.0, vW.y * 0.7 + uTime * 2.6));
    float veins = f1 * f1 * f1 * f1 * (0.5 + f2);
    vec3 pl = cell2(vec2(a * 2.6, vW.y * 0.3) + 3.0);                                  // frozen plates with bright seams
    float seam = 1.0 - smoothstep(0.0, 0.06, pl.y);
    float flute = vT2;                                                                 // 1 in the grooves between the flutes
    col *= (0.16 + 0.42 * pl.z) * (1.0 - 0.6 * flute);
    col += uCrackCol * uFlow * (0.012 + 3.4 * veins * (0.35 + 0.65 * flute) + 0.3 * seam * (0.4 + 0.6 * f2) + 0.22 * flute * f2) * (0.75 + 0.25 * sin(uTime * 0.8 - vW.y * 0.15));
    col += uIceCol * uFlow * (0.9 * fres * fres + 0.05 * pl.z);
  }
  vec3 d = uLevPos - vW;
  col += uIceCol * uLevCol * (0.25 + 0.5 * fres) / (1.0 + dot(d, d) * uLevFall);
  d = uPortalPos - vW;
  col += uIceCol * uPortalCol * (0.25 + 0.5 * fres) / (1.0 + dot(d, d) * 0.004);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ice-algae curtains hanging from the ceiling: cut-out strands, green-gold, swaying
const ALGAE_VERT = /* glsl */`
attribute vec4 aHang;                     // depth 0..1, length m, phase, metres along the curtain
uniform float uTime; uniform vec2 uCur;
varying vec4 vHang;
#include <fog_pars_vertex>
void main() {
  float v = aHang.x, len = aHang.y;
  vec3 p = position;
  p.y -= v * len;
  float sw = v * v * (0.9 + 0.12 * len);
  p.x += sin(uTime * 0.55 + aHang.z + v * 2.2 + aHang.w * 0.35) * sw + uCur.x * v * len * 0.22;
  p.z += cos(uTime * 0.43 + aHang.z * 1.7 + v * 1.7 + aHang.w * 0.27) * sw + uCur.y * v * len * 0.22;
  vHang = aHang;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ALGAE_FRAG = /* glsl */`
uniform vec3 uAlgaeA, uAlgaeB; uniform float uTime, uSun;
varying vec4 vHang;
${fx.GLSL_HASH}
#include <fog_pars_fragment>
void main() {
  float v = vHang.x, s = vHang.w * 2.4 + vHang.z;               // strands a few decimetres wide
  float id = floor(s), f = fract(s);
  float h = hash11(id * 1.37 + 0.11), h2 = hash11(id * 2.91 + 5.0);
  float reach = 0.3 + 0.7 * h;
  float prof = (1.0 - abs(f - 0.5) * 2.0) * (1.0 - v / reach * 0.75);
  if (v > reach || prof < 0.22 + 0.25 * h2) discard;
  float sh = 0.55 + 0.45 * sin(uTime * 1.1 + id * 2.0 - v * 7.0);
  vec3 col = mix(uAlgaeA, uAlgaeB, smoothstep(0.1, 1.0, v / reach) * (0.5 + 0.5 * h2));
  col *= (0.22 + 0.5 * uSun) * (0.4 + 0.9 * prof) * (0.6 + 0.6 * sh) * (1.0 + 1.6 * exp(-v * 5.0));
  gl_FragColor = vec4(min(col, vec3(1.5)), 1.0);                 // a strand one pixel wide never outshines the bloom threshold by much
  #include <fog_fragment>
}`;

// shafts of light in the water: the turquoise that falls from a fissure through the algae curtains (kind 0, bright at
// the ice) and the glow that stands in the chasm as the Leviathan rises (kind 1, bright at the floor, driven by uGain.y)
const SHAFT_VERT = /* glsl */`
attribute vec4 aBase;                     // x, top y, z, length m
attribute vec4 aShaft;                    // width m, phase, kind, lean
uniform float uTime;
varying vec3 vS; varying float vKind, vFar;
#include <fog_pars_vertex>
void main() {
  float ph = aShaft.y, lean = aShaft.w;
  vec3 axis = normalize(vec3(sin(ph * 5.0) * lean, -1.0, cos(ph * 3.0) * lean));
  vec3 c = aBase.xyz + axis * (position.y * aBase.w);
  vec3 cr = cross(axis, cameraPosition - c);
  vec3 right = cr * inversesqrt(max(dot(cr, cr), 1e-6));
  vec3 w = c + right * (position.x * aShaft.x * (0.55 + 0.9 * position.y));
  vS = vec3(position.x, position.y, ph); vKind = aShaft.z;
  vFar = smoothstep(5.0, 22.0, distance(cameraPosition, w));
  vec4 mvPosition = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uShaftA, uShaftB; uniform vec2 uGain; uniform float uTime;
varying vec3 vS; varying float vKind, vFar;
${fx.GLSL_HASH + fx.GLSL_VALUE_NOISE}
#include <fog_pars_fragment>
void main() {
  float x = vS.x, v = vS.y, e = max(1.0 - x * x, 0.0);
  float streak = 0.45 + 0.9 * vnoise(vec2(x * 3.2 + vS.z * 9.0, uTime * 0.35 + vS.z)) * vnoise(vec2(x * 7.5 - vS.z * 4.0, v * 2.0 - uTime * 0.22));
  float top = smoothstep(0.0, 0.05, v) * (1.0 - v) * (1.0 - v) * (0.35 + 0.65 * (1.0 - v));
  float bot = smoothstep(1.0, 0.9, v) * v * v * smoothstep(0.0, 0.45, v);
  vec3 col = vKind < 0.5 ? uShaftA * (top * uGain.x) : uShaftB * (bot * uGain.y);
  col *= e * e * streak * vFar;
  #ifdef FOG_EXP2
    float fd = fogDensity * vFogDepth * 0.62;
    col *= exp(-fd * fd);
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------------------------------------- lantern-jellies
// One instanced mesh: a pulsing bell, an amber core (billboard that never shrinks below a few pixels, so far
// jellies remain as warm lights hanging in the dark) and six trailing strands with beads of light.
// They rise from the sea bed to the ice and are reborn below, fading at both ends.
const JELLY_VERT = /* glsl */`
attribute vec4 aCfg;                      // part (0 bell, 1 core, 2 strand), a, b, c
attribute vec4 aPos;                      // x, base y, z, rise height
attribute vec4 aParm;                     // size, phase, rise speed, seed
uniform float uTime, uMinAng;
varying vec4 vCfg; varying vec2 vUv2; varying vec3 vNrm, vView; varying float vFade, vSeed, vNear;
#include <fog_pars_vertex>
void main() {
  float seed = aParm.w, size = aParm.x;
  float f = fract(aParm.y + uTime * aParm.z / aPos.w);
  vFade = smoothstep(0.0, 0.07, f) * (1.0 - smoothstep(0.9, 1.0, f));
  float ph = uTime * (1.5 + seed * 1.1) + seed * 40.0;
  float beat = 0.5 + 0.5 * sin(ph);                          // 1 = contracted
  vec3 c = vec3(aPos.x, aPos.y + f * aPos.w, aPos.z);
  c.x += sin(uTime * 0.21 + seed * 17.0) * 1.3; c.z += cos(uTime * 0.17 + seed * 29.0) * 1.3;
  c.y += size * 0.4 * sin(ph - 1.2);
  vec3 toCam = cameraPosition - c; float dist = length(toCam); vec3 vd = toCam / max(dist, 0.001);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), vd)); vec3 up = cross(vd, right);
  vec3 lp; vec3 nrm = vd;
  vNear = smoothstep(7.0, 34.0, dist);
  vec4 cc = projectionMatrix * viewMatrix * vec4(c, 1.0);    // a lantern close beside the lens dissolves as it slides out of the picture: no bell is cut by the frame
  if (cc.w > 0.05 && dist < 30.0) {
    float er = clamp(size * 1.3 / dist, 0.04, 0.6);
    vFade *= 1.0 - smoothstep(1.0 - er * 1.1, 1.0 + er * 0.25, max(abs(cc.x), abs(cc.y)) / cc.w) * (1.0 - smoothstep(18.0, 30.0, dist));
  }
  if (aCfg.x < 0.5) {                                        // bell
    float w = aCfg.y;
    float sq = 1.0 - 0.27 * beat * w * w;
    lp = vec3(position.x * sq, position.y * (1.0 + 0.12 * beat) - 0.12 * w * beat, position.z * sq);
    lp.xz *= 1.0 + 0.06 * w * w * sin(aCfg.z * 8.0 + ph * 1.5);
    nrm = normalize(vec3(position.x, position.y * 1.3 + 0.2, position.z));
    lp *= size;
  } else if (aCfg.x < 1.5) {                                 // core
    float s = max(size * 3.0, dist * uMinAng);
    lp = vec3(0.0, size * 0.3, 0.0) + (right * position.x + up * position.y) * s;
  } else {                                                   // trailing strand
    float v = aCfg.y; float L = size * (2.8 + 2.0 * fract(aCfg.w * 7.7 + seed * 3.0));
    vec3 root = vec3(position.x, 0.0, position.z) * size * (1.0 - 0.27 * beat);
    vec3 sway = vec3(sin(ph * 0.7 - v * 3.5 + aCfg.w * 9.0), 0.0, cos(ph * 0.6 - v * 3.0 + aCfg.w * 5.0)) * (0.4 * size * v);
    vec3 cp = root * (1.0 - 0.4 * v) + vec3(0.0, -v * L - 0.12 * size, 0.0) + sway;
    float wdt = max(size * 0.06, dist * 0.0011) * (1.0 - 0.5 * v);
    lp = cp + right * (aCfg.z * wdt);
  }
  vec3 w = c + lp;
  vCfg = aCfg; vUv2 = position.xy; vSeed = seed; vNrm = nrm; vView = cameraPosition - w;
  vec4 mvPosition = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const JELLY_FRAG = /* glsl */`
uniform vec3 uCore, uBell, uBead; uniform float uTime;
varying vec4 vCfg; varying vec2 vUv2; varying vec3 vNrm, vView; varying float vFade, vSeed, vNear;
#include <fog_pars_fragment>
void main() {
  vec3 col; float a;
  if (vCfg.x < 0.5) {
    float w = vCfg.y;
    float ndv = abs(dot(normalize(vNrm), normalize(vView)));
    float fres = pow(max(1.0 - ndv, 0.0), 2.2);
    float rb = 0.5 + 0.5 * cos(vCfg.z * 14.0), ribs = rb * rb * rb;
    float inner = pow(max(1.0 - w, 0.0), 1.4);
    float rim = smoothstep(0.86, 1.0, w);
    col = uBell * ((0.05 + 0.5 * fres + 0.1 * ribs * w + 0.45 * rim) * (0.55 + 0.45 * vNear)) + uCore * (0.5 * inner + 0.1 + (0.16 + 0.2 * (1.0 - vNear)) * ribs * (1.0 - w * 0.6));
    a = 0.1 + 0.4 * fres + 0.2 * rim + 0.08 * ribs;
  } else if (vCfg.x < 1.5) {
    float r2 = dot(vUv2, vUv2);
    float k = max(0.0, 1.0 - r2);                            // the skirt reaches zero smoothly at the quad's edge
    float g = exp(-r2 * 17.0) * 1.25 * k + 0.085 * k * k * k;
    float pul = 0.8 + 0.2 * sin(uTime * (1.5 + vSeed * 1.1) + vSeed * 40.0 + 1.0);
    col = (uCore * g * pul + vec3(1.0, 0.86, 0.6) * exp(-r2 * 74.0) * 0.55) * (0.3 + 0.7 * vNear);
    a = 0.0;
  } else {
    float v = vCfg.y;
    float bead = smoothstep(0.5, 1.0, sin(v * 24.0 - uTime * 2.2 + vCfg.w * 12.0 + vSeed * 6.0));
    float acr = 1.0 - abs(vCfg.z);
    col = (uBell * 0.14 * (1.0 - v) + uBead * bead * 2.4 * (1.0 - v * 0.6)) * (0.35 + 0.65 * acr);
    a = 0.14 * (1.0 - v) * acr;
  }
  float fa = 1.0, fe = 1.0;
  #ifdef FOG_EXP2
    float fd = fogDensity * vFogDepth;
    fa = exp(-fd * fd); fe = exp(-fd * fd * 0.45);           // the lights carry further than the membranes
  #endif
  gl_FragColor = vec4(col * vFade * fe, a * vFade * fa);
}`;

function jellyGeometry() {
  const pos = [], cfg = [], idx = [];
  const SEG = 10, RINGS = 5;
  for (let j = 0; j <= RINGS; j++) {
    const v = j / RINGS, th = v * Math.PI * 0.5 * 1.14;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      pos.push(Math.sin(th) * Math.cos(a), Math.cos(th) * 0.86, Math.sin(th) * Math.sin(a));
      cfg.push(0, v, a, 0);
    }
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  let n = pos.length / 3;
  for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); cfg.push(1, 0, 0, 0); }
  idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  const STR = 5, SS = 4;
  for (let k = 0; k < STR; k++) {
    const a = (k / STR) * Math.PI * 2 + 0.4, rx = Math.cos(a) * 0.72, rz = Math.sin(a) * 0.72;
    for (let j = 0; j <= SS; j++) for (const side of [-1, 1]) { pos.push(rx, 0, rz); cfg.push(2, j / SS, side, k / STR + 0.07); }
    for (let j = 0; j < SS; j++) { const b = n + j * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    n += (SS + 1) * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCfg', new THREE.Float32BufferAttribute(cfg, 4));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------- the Great Lanterns
// A handful of giant lantern-jellies (bells 11 to 15 m across) hanging in the valley as landmarks: a glass bell with
// glowing radial canals and a beaded margin, an amber heart, frilled oral arms and a skirt of long tentacles with
// travelling beads of light. One instanced mesh; they pulse slowly and stay where they hang.
const GREAT_VERT = /* glsl */`
attribute vec4 aCfg;                      // part (0 bell, 1 heart glow, 2 tentacle, 3 oral arm), a, b, c
attribute vec4 gPos;                      // x, y, z of the bell, bell radius
attribute vec4 gParm;                     // phase, seed, length of the tentacles, light
uniform float uTime;
varying vec4 vCfg; varying vec2 vUv2; varying vec3 vNrm, vView; varying float vSeed, vGain, vEdge;
#include <fog_pars_vertex>
void main() {
  float size = gPos.w, seed = gParm.y;
  float ph = uTime * (0.6 + 0.25 * seed) + gParm.x * 6.2832;
  float beat = 0.5 + 0.5 * sin(ph); beat = beat * beat * (3.0 - 2.0 * beat);      // 1 = contracted
  vec3 c = gPos.xyz;
  c.y += 0.16 * size * sin(ph - 1.3); c.x += sin(uTime * 0.11 + seed * 17.0) * 1.4; c.z += cos(uTime * 0.09 + seed * 29.0) * 1.4;
  vec3 toCam = cameraPosition - c; float dist = length(toCam); vec3 vd = toCam / max(dist, 0.001);
  float hl = max(length(vd.xz), 0.001);
  vec3 right = vec3(vd.z, 0.0, -vd.x) / hl; vec3 up = cross(vd, right);
  vec3 lp; vec3 nrm = vd;
  float edgeFade = 1.0;
  vec4 cc = projectionMatrix * viewMatrix * vec4(c, 1.0);    // passing out of the picture it dims instead of being cut by the frame
  if (cc.w > 0.05) {
    float er = clamp(size * 1.3 / dist, 0.04, 0.8);
    edgeFade = 1.0 - smoothstep(1.0 - er * 0.7, 1.0 + er * 0.45, max(abs(cc.x), abs(cc.y)) / cc.w) * (1.0 - smoothstep(40.0, 60.0, dist));
  }
  if (aCfg.x < 0.5) {                                        // bell
    float w = aCfg.y, w2 = w * w;
    float sq = 1.0 - 0.2 * beat * w2;
    lp = vec3(position.x * sq, position.y * (1.0 + 0.1 * beat) - 0.1 * w2 * beat, position.z * sq);
    lp.xz *= 1.0 + w2 * w2 * (0.045 * cos(aCfg.z * 14.0) + 0.03 * sin(aCfg.z * 5.0 + ph * 2.0));
    nrm = normalize(vec3(position.x, position.y * 1.3 + 0.2, position.z));
    lp *= size;
  } else if (aCfg.x < 1.5) {                                 // heart glow and halo
    lp = vec3(0.0, size * 0.22, 0.0) + (right * position.x + up * position.y) * (size * aCfg.y);
  } else if (aCfg.x < 2.5) {                                 // tentacle from the margin
    float v = aCfg.y; float L = gParm.z * (0.62 + 0.38 * fract(aCfg.w * 7.7 + seed * 3.0));
    vec3 root = vec3(position.x, -0.1, position.z) * size * (1.0 - 0.2 * beat);
    vec3 sway = vec3(sin(ph * 0.8 - v * 4.0 + aCfg.w * 9.0), 0.0, cos(ph * 0.7 - v * 3.4 + aCfg.w * 5.0)) * (0.2 * size * v);
    vec3 cp = root * (1.0 - 0.3 * v * (1.0 - v)) + vec3(0.0, -v * L - 0.05 * L * v * sin(ph - v * 3.0), 0.0) + sway;
    float wdt = max(size * 0.03, dist * 0.0012) * (1.0 - 0.55 * v);
    lp = cp + right * (aCfg.z * wdt);
  } else {                                                   // frilled oral arm from under the heart
    float v = aCfg.y; float L = gParm.z * (0.5 + 0.2 * fract(aCfg.w * 5.3 + seed * 7.0));
    vec3 root = vec3(position.x, 0.0, position.z) * size;
    vec3 sway = vec3(sin(ph * 0.6 - v * 2.6 + aCfg.w * 7.0), 0.0, cos(ph * 0.5 - v * 2.2 + aCfg.w * 11.0)) * (0.24 * size * v);
    vec3 cp = root * (1.0 + 0.8 * v) + vec3(0.0, 0.1 * size - v * L, 0.0) + sway;
    float tw = v * 5.0 + aCfg.w * 6.2832 + ph * 0.25;
    vec3 across = right * cos(tw) + vec3(right.z, 0.0, -right.x) * sin(tw);         // the ribbon turns as it hangs
    float wdt = size * 0.17 * (1.0 - 0.75 * v) * (0.8 + 0.2 * sin(v * 26.0 - ph * 2.0));
    lp = cp + across * (aCfg.z * wdt);
  }
  vec3 w = c + lp;
  vCfg = aCfg; vUv2 = position.xy; vSeed = seed; vNrm = nrm; vView = cameraPosition - w; vGain = gParm.w * (0.85 + 0.15 * (1.0 - beat)); vEdge = edgeFade;
  vec4 mvPosition = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GREAT_FRAG = /* glsl */`
uniform vec3 uCore, uBell, uBead, uBead2; uniform float uTime;
varying vec4 vCfg; varying vec2 vUv2; varying vec3 vNrm, vView; varying float vSeed, vGain, vEdge;
#include <fog_pars_fragment>
void main() {
  vec3 col; float a;
  if (vCfg.x < 0.5) {
    float w = vCfg.y, ang = vCfg.z;
    float ndv = abs(dot(normalize(vNrm), normalize(vView)));
    float fres = 1.0 - ndv; fres = fres * fres;
    float cn = 0.5 + 0.5 * cos(ang * 16.0); cn = cn * cn; cn = cn * cn; cn = cn * cn;                 // sixteen radial canals
    float canal = cn * smoothstep(0.1, 0.3, w) * (0.55 + 0.45 * sin(w * 9.0 - uTime * 1.4 + vSeed * 9.0));   // light running out to the margin
    float ring = smoothstep(0.06, 0.0, abs(w - 0.86));                                                  // the ring canal
    float gon = smoothstep(0.1, 0.0, abs(w - 0.34 - 0.1 * cos(ang * 4.0))) * smoothstep(-0.2, 0.6, cos(ang * 4.0));   // four horseshoes round the heart
    float inner = max(1.0 - w, 0.0); inner = inner * sqrt(inner);
    float margin = smoothstep(0.93, 1.0, w);
    float bd = 0.5 + 0.5 * cos(ang * 32.0); bd = bd * bd * bd;
    float beads = bd * margin * (0.35 + 0.65 * (0.5 + 0.5 * sin(ang * 3.0 - uTime * 1.3 + vSeed * 20.0)));
    col = uBell * (0.02 + 0.3 * fres + 0.22 * margin) + uCore * ((0.1 * inner + 0.62 * canal * (1.0 - 0.4 * w) + 0.3 * ring + 0.7 * gon) * vGain) + uBead2 * (beads * 2.4);
    a = 0.07 + 0.36 * fres + 0.16 * margin + 0.14 * cn + 0.2 * gon;
  } else if (vCfg.x < 1.5) {
    float r2 = dot(vUv2, vUv2), k = max(0.0, 1.0 - r2);
    float g = vCfg.z < 0.5 ? exp(-r2 * 8.0) * 0.6 * k : 0.035 * k * k * k;
    col = (uCore * g + vec3(1.0, 0.88, 0.66) * (vCfg.z < 0.5 ? exp(-r2 * 40.0) * 0.3 : 0.0)) * vGain;
    a = 0.0;
  } else if (vCfg.x < 2.5) {
    float v = vCfg.y;
    float bead = smoothstep(0.55, 1.0, sin(v * 30.0 - uTime * 2.0 + vCfg.w * 12.0 + vSeed * 6.0));
    float acr = 1.0 - abs(vCfg.z);
    col = (uBell * 0.12 * (1.0 - v) + uCore * 0.22 * (1.0 - v) + mix(uBead, uBead2, smoothstep(0.15, 0.7, v)) * bead * 2.3 * (1.0 - v * 0.5)) * (0.35 + 0.65 * acr);
    a = 0.16 * (1.0 - v) * acr;
  } else {
    float v = vCfg.y, s = vCfg.z;
    float edge = smoothstep(0.55, 1.0, abs(s));
    float frill = 0.5 + 0.5 * sin(v * 60.0 + s * 5.0 - uTime * 1.6 + vCfg.w * 9.0);
    float fadeT = (1.0 - v) * smoothstep(0.0, 0.06, v);
    col = (uCore * (0.42 * (1.0 - edge) + 0.5 * edge * frill) + uBead * (0.9 * edge * frill * frill)) * fadeT * vGain + uBell * 0.05 * fadeT;
    a = (0.22 + 0.2 * edge * frill) * fadeT;
  }
  float fa = 1.0, fe = 1.0;
  #ifdef FOG_EXP2
    float fd = fogDensity * vFogDepth;
    fa = exp(-fd * fd); fe = exp(-fd * fd * 0.4);
  #endif
  gl_FragColor = vec4(col * (fe * vEdge), a * fa * vEdge);
}`;

function greatGeometry() {
  const pos = [], cfg = [], idx = [];
  const SEG = 28, RINGS = 8;
  for (let j = 0; j <= RINGS; j++) {
    const v = j / RINGS, th = v * Math.PI * 0.5 * 1.18;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      pos.push(Math.sin(th) * Math.cos(a), Math.cos(th) * 0.8, Math.sin(th) * Math.sin(a));
      cfg.push(0, v, a, 0);
    }
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  let n = pos.length / 3;
  for (const [scale, kind] of [[0.9, 0], [3.6, 1]]) {
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); cfg.push(1, scale, kind, 0); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  }
  const strip = (part, count, SS, rad, a0) => {
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + a0, rx = Math.cos(a) * rad, rz = Math.sin(a) * rad;
      for (let j = 0; j <= SS; j++) for (const side of [-1, 1]) { pos.push(rx, 0, rz); cfg.push(part, j / SS, side, k / count + 0.031); }
      for (let j = 0; j < SS; j++) { const b = n + j * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      n += (SS + 1) * 2;
    }
  };
  strip(2, 20, 8, 0.93, 0.2);
  strip(3, 6, 12, 0.2, 0.5);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCfg', new THREE.Float32BufferAttribute(cfg, 4));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------- small helpers
const sminf = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
const smaxf = (a, b, k) => -sminf(-a, -b, k);

// One mineral spire appended to shared buffers. Returns the mouth position.
function addSpire(B, rng, noise, cx, cz, baseY, H, R, seg, rings, o = {}) {
  const leanX = rng.range(-0.1, 0.1), leanZ = rng.range(-0.1, 0.1), bendA = rng() * 6.283, bend = rng.range(0.4, 1.6);
  const pitch = rng.range(3.2, 5.5), ph = rng() * 6.283, sx = rng.range(0.85, 1.2), so = rng() * 50;
  const first = B.pos.length / 3, hot = o.hot ?? 1, crust = o.crust ?? 1;
  let ax = cx, az = cz, topR = R;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings, y = baseY - 3 + t * (H + 3);
    const prof = R * (0.3 + 0.7 * Math.pow(1 - t, 1.25)) * (1 + 0.95 * Math.exp(-t * 7)) * (1 + 0.16 * Math.sin(t * 8.5 + ph * 1.7) * (1 - t));
    const fl = Math.pow(Math.max(0, Math.sin(t * H / pitch * 6.283 + ph)), 4);
    ax = cx + leanX * t * H + Math.cos(bendA) * bend * Math.sin(t * 3.1) * R * 0.5;
    az = cz + leanZ * t * H + Math.sin(bendA) * bend * Math.sin(t * 3.1) * R * 0.5;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * 6.283185, ca = Math.cos(a), sa = Math.sin(a);
      const nz = noise.fbm3(ca * 1.4 + so, y * 0.16, sa * 1.4 + so, 3);
      const kn = Math.max(0, noise.n3(ca * 3.1 + so, y * 0.45, sa * 3.1 - so));
      const rib = 0.09 * Math.sin(a * 7 + nz * 4 + so) * (1 - t * 0.5);
      const fine = noise.n3(ca * 5.5 - so, y * 0.85, sa * 5.5 + so);
      const r = prof * (1 + 0.5 * fl * (0.3 + 0.7 * (0.5 + 0.5 * nz))) * (1 + 0.42 * nz + 0.42 * kn * kn + rib + 0.13 * fine);
      B.pos.push(ax + ca * r * sx, y, az + sa * r);
      if (o.ledges && fl > 0.7 && t > 0.06 && t < 0.86 && rng() < o.ledges) B.ledges.push([ax + ca * r * sx * 0.93, y, az + sa * r * 0.93, o.big ? 1 : 0]);
      B.ao.push(clamp((0.42 * nz + 0.42 * kn * kn + rib + 0.13 * fine + 0.3 * fl + 0.3) / 0.62, 0, 1));    // hollows stay dark, knobs and flanges catch the vent light
      const fissure = Math.max(0, noise.n3(ca * 2.2 - so, y * 0.3, sa * 2.2 + so) - 0.5) * 2.4 * (1 - t * 0.6);
      B.fx.push(0, hot * Math.min(0.7, fissure * fissure + (t > 0.965 ? 0.5 : 0)),
        crust * clamp(0.35 + 0.5 * nz + 0.5 * fl + t * 0.3, 0, 1), 0);
      topR = prof;
    }
  }
  const yTop = baseY + H;
  for (let i = 0; i < seg; i++) {                            // the mouth: a glowing throat
    const a = (i / seg) * 6.283185;
    B.pos.push(ax + Math.cos(a) * topR * 0.55 * sx, yTop - 1.6, az + Math.sin(a) * topR * 0.55);
    B.fx.push(0, hot, crust, 0); B.ao.push(1);
  }
  B.pos.push(ax, yTop - 2.4, az); B.fx.push(0, hot, crust, 0); B.ao.push(1);
  for (let j = 0; j <= rings; j++) for (let i = 0; i < seg; i++) {
    const a = first + j * seg + i, b = first + j * seg + (i + 1) % seg, c = a + seg, d = b + seg;
    B.idx.push(a, c, b, b, c, d);
  }
  const cap = first + (rings + 1) * seg, ctr = cap + seg;
  for (let i = 0; i < seg; i++) B.idx.push(cap + i, ctr, cap + (i + 1) % seg);
  return [ax, yTop, az];
}

// ---------------------------------------------------------------------------------------------- the world
export default {
  id: 'lanterns-under-ice',
  name: 'Lanterns under the Ice',
  category: 'alien',
  weirdness: 0.55,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const scene = new THREE.Scene();
    const vr = rng.fork('variation');

    // ---- per-seed character ------------------------------------------------------------------------------
    const mood = vr.pick(['polar night', 'twilight', 'noon above']);     // how much sun reaches the ice shell
    const sun = mood === 'polar night' ? 0.68 : mood === 'twilight' ? 0.92 : 1.2;
    const mirror = vr.sign();                                // which way the valley meanders
    const wig = vr.range(0.8, 1.2) * mirror;
    const hueShift = vr.range(-0.035, 0.06);                 // turquoise fissures ... blue fissures
    const ventPink = vr.range(0, 0.4);                      // orange vents ... pink vents
    const jellyCount = Math.round(vr.range(300, 400) * (mood === 'polar night' ? 1.15 : 1));
    const snowK = vr.range(0.55, 1.5);                       // marine snow: thin drift ... blizzard
    const curA = vr.range(-0.7, 0.7), curK = vr.range(0.5, 1.3);
    const current = new THREE.Vector3(-Math.cos(curA), 0, Math.sin(curA));   // always away from the close chimney pass
    const withEels = vr.chance(0.6), schools = vr.int(2, 3), brineSide = vr.sign();
    const bloomU = vr.range(0.37, 0.42);
    const brineU = vr.range(0.74, 0.8), heroH = vr.range(34, 46), heroComp = vr.int(2, 4), ringR = vr.range(29, 33);

    const pal = ['#9fe8ff', '#1c6f8f', '#0a2f4f', '#04121f', '#010409', '#19ffd0', '#ff7a3c'];
    const iceCol = new THREE.Color(pal[0]).offsetHSL(hueShift, 0, 0);
    const crackCol = new THREE.Color('#22e6d2').offsetHSL(hueShift * 1.6, 0, 0);
    const ventCol = new THREE.Color(pal[6]).lerp(new THREE.Color('#ff3f6c'), ventPink);
    const matCol = new THREE.Color(pal[5]);
    const coreCol = new THREE.Color('#ffb060').lerp(new THREE.Color(vr.chance(0.5) ? '#ff8f6a' : '#ffcf6a'), vr.range(0, 0.45));
    const portalCol = new THREE.Color('#bfeeff');
    const fogCol = new THREE.Color('#04192b').multiplyScalar(0.72 + 0.3 * sun);
    scene.fog = new THREE.FogExp2(fogCol, 0.0085);
    scene.background = fogCol.clone();

    // ---- camera path ---------------------------------------------------------------------------------------
    // opening high under the ice -> descend past the hero chimney -> jelly bloom -> long straight under the
    // Leviathan -> past the brine column -> straight into the chimney ring
    const path = makePath([
      [-34 * wig, 45, 0], [-34 * wig, 44.5, -55], [-27 * wig, 38, -115], [-9 * wig, 27.5, -178],
      [13 * wig, 20.5, -245], [26 * wig, 17.5, -320], [30 * wig, 17, -400], [30 * wig, 17, -470],
      [30 * wig, 17.5, -540], [22 * wig, 19, -610], [8 * wig, 21, -678], [0, 22, -740], [0, 22, -770], [0, 22, -800],
    ]);
    const near = T.pathNearest(path);
    const portalPos = path.end.clone();

    // ---- the Leviathan first: the sea bed and the ice make room for its track -----------------------------
    const LIGHT_POWER = 300;                                 // with decay 1 (set below): as bright at 30 m as 9000 cd was, far gentler close to
    const hero = await buildHero(ctx, { palette: pal, lightPower: LIGHT_POWER, progress: 0.15 });
    {
      const p = path.pointAt(U_PASS), t = path.tangentAt(U_PASS);
      hero.object.position.copy(p);
      hero.object.rotation.y = Math.atan2(t.x, t.z) + Math.PI;
      hero.object.updateMatrixWorld(true);
      scene.add(hero.object);
      if (hero.light) hero.light.decay = 1;
    }
    await ctx.yield();
    const track = [];                                        // world-space samples of its swim track
    for (let d = -600; d <= 420; d += 12) track.push(hero.trackPoint(d, new THREE.Vector3()).applyMatrix4(hero.object.matrixWorld));
    const trackOut = { dist: 0, y: 0 };
    const trackNear = (x, z) => {
      let best = 1e12, bi = 0;
      for (let i = 0; i < track.length; i++) { const dx = track[i].x - x, dz = track[i].z - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      trackOut.dist = Math.sqrt(best); trackOut.y = track[bi].y;
      return trackOut;
    };

    // ---- chimneys: positions first (the terrain builds mounds under them) ---------------------------------
    const chimneys = [];
    const brineP = path.pointAt(brineU), brineT = path.tangentAt(brineU);
    const brine = { x: brineP.x + brineT.z * 19 * brineSide * -1, z: brineP.z - brineT.x * 19 * brineSide * -1 };
    {
      const hu = 0.212, p = path.pointAt(hu), t = path.tangentAt(hu);
      chimneys.push({ x: p.x + t.z * 14, z: p.z - t.x * 14, H: heroH, R: 4.4, active: true, hero: true, seg: 44, rings: 76 });
      for (let k = 0; k < 6; k++) {
        const a = (k + 0.5) / 6 * Math.PI * 2;
        chimneys.push({ x: portalPos.x + Math.sin(a) * ringR, z: portalPos.z + Math.cos(a) * ringR, H: vr.range(27, 44), R: vr.range(3, 4), active: true, ring: true, seg: 26, rings: 40 });
      }
      // smokers on the camera's left: beyond the hero chimney, and on the walls of the Leviathan's chasm, so that
      // side of the frame has warm pools and silhouettes instead of a void
      for (const [u, l0, l1] of [[0.275, 44, 80], [0.345, 52, 90], [0.645, 26, 112], [0.705, 26, 116], [0.765, 26, 116], [0.825, 30, 110]]) {
        const p = path.pointAt(u), t = path.tangentAt(u);
        for (let lat = l0 + vr.range(0, 6); lat <= l1; lat += 5) {
          const x = p.x + t.z * lat, z = p.z - t.x * lat;
          if (near(x, z).dist < 24 || trackNear(x, z).dist < 46) continue;
          if (Math.hypot(x - brine.x, z - brine.z) < 26 || Math.hypot(x - portalPos.x, z - portalPos.z) < ringR + 24) continue;
          if (chimneys.some((c) => Math.hypot(c.x - x, c.z - z) < 24)) continue;
          chimneys.push({ x, z, H: vr.range(26, 40), R: vr.range(3, 3.9), active: true, far: true, seg: 22, rings: 34, lat });
          break;
        }
      }
      const cr = rng.fork('chimneys');
      for (let tries = 0; tries < 400 && chimneys.length < 28; tries++) {
        const u = cr.range(0.04, 0.9), side = cr.sign(), lat = cr.range(side > 0 ? 30 : 24, 78);
        const p = path.pointAt(u), t = path.tangentAt(u);
        const x = p.x - t.z * lat * side, z = p.z + t.x * lat * side;
        if (near(x, z).dist < 23) continue;
        if (Math.hypot(x - brine.x, z - brine.z) < 30 || Math.hypot(x - portalPos.x, z - portalPos.z) < ringR + 28) continue;
        if (chimneys.some((c) => Math.hypot(c.x - x, c.z - z) < 24)) continue;
        let H = cr.range(20, 50);
        const tn = trackNear(x, z);
        if (tn.dist < 55) { H = Math.min(H, tn.y - 30); if (H < 14) continue; }
        chimneys.push({ x, z, H, R: H * cr.range(0.085, 0.11), active: false, seg: 16, rings: 22, lat });
      }
      // one more smoker close on the right at u 0.385, for the shoal of light-spines to wheel round (added last: nothing else moves)
      {
        const p = path.pointAt(0.385), t = path.tangentAt(0.385), x = p.x - t.z * 16, z = p.z + t.x * 16;
        const hit = chimneys.find((c) => Math.hypot(c.x - x, c.z - z) < 20);
        if (hit) hit.fishy = true;
        else chimneys.push({ x, z, H: 34, R: 3.3, active: true, far: true, fishy: true, seg: 28, rings: 44, lat: 99 });
      }
      // the ones nearest the path smoke
      const loose = chimneys.filter((c) => !c.hero && !c.ring && !c.far).sort((a, b) => a.lat - b.lat);
      loose.slice(0, 8).forEach((c) => { c.active = true; });
    }

    // ---- height fields --------------------------------------------------------------------------------------
    const groundAt = (x, z) => {
      const q = near(x, z), d = q.dist, py = q.y;
      let h = 1.5 + 2.6 * noise.fbm2(x * 0.011 + 3, z * 0.011, 3);
      h += 9 * Math.pow(Math.max(0, noise.fbm2(x * 0.019 + 40, z * 0.019 - 17, 3)), 1.3);          // mounds
      const rk = smoothstep(46, 150, d + 16 * noise.n2(x * 0.009, z * 0.009));
      h += rk * (44 + 28 * noise.fbm2(x * 0.0075 + 9, z * 0.0075 + 2, 3));                         // the ridges
      const pil = 1 - Math.abs(noise.n2(x * 0.045, z * 0.045));
      h += pil * pil * (1.4 + 4 * rk);                                                           // pillow lava
      const dr = Math.hypot(x - portalPos.x, z - portalPos.z);
      h = lerp(3.5 + 0.4 * (h - 3.5), h, smoothstep(34, 75, dr));                                  // the ring's floor
      return sminf(h, py - 15 + Math.max(0, d - 8) * 0.6, 6);                                      // stay under the camera
    };
    // the chasm the Leviathan rises from
    const chasmCut = (h, x, z) => {
      const tn = trackNear(x, z);
      return tn.dist < 90 ? sminf(h, tn.y - 27 + smoothstep(34, 90, tn.dist) * 70, 5) : h;
    };
    for (const c of chimneys) {
      c.y = chasmCut(groundAt(c.x, c.z), c.x, c.z);
      if (c.far) { c.H = Math.min(58, Math.max(c.H, near(c.x, c.z).y + 5 - c.y)); c.R = Math.max(c.R, c.H * 0.085); }   // tops reach camera height
    }
    let lastCut = 0;
    const heightAt = (x, z) => {
      let h = groundAt(x, z);
      for (let i = 0; i < chimneys.length; i++) {
        const c = chimneys[i], dx = x - c.x, dz = z - c.z, d2 = dx * dx + dz * dz, r = c.R * 3.6;
        if (d2 < r * r * 6) h += c.H * 0.13 * Math.exp(-d2 / (r * r));
      }
      const hc = chasmCut(h, x, z);
      lastCut = h - hc;
      return hc;
    };
    const sag = path.pointAt(0.135);                         // the ice dips toward the path ahead of the entry: the opening image
    const ceilAt = (x, z) => {
      const q = near(x, z), d = q.dist;
      let c = 63 + 7 * noise.fbm2(x * 0.006 + 50, z * 0.006 + 20, 3) - 15 * Math.pow(noise.ridged2(x * 0.008 + 7, z * 0.008 - 3, 3), 2);
      const db = Math.hypot(x - brine.x, z - brine.z);
      c -= 15 * Math.exp(-db * db / 500);                      // the ice sags into the brine column
      c -= 14 * Math.exp(-((x - sag.x) * (x - sag.x) + (z - sag.z) * (z - sag.z)) / 2400);
      c = smaxf(c, q.y + 17 - Math.max(0, d - 12) * 0.5, 4);
      const tn = trackNear(x, z);                              // and vaults over the Leviathan
      if (tn.dist < 95) c = smaxf(c, tn.y + 24 - smoothstep(32, 95, tn.dist) * 70, 5);
      return c;
    };

    // ---- shared uniforms -------------------------------------------------------------------------------------
    const vents = [];                                        // [x, y, z, power]
    const ventLight = (x, y, z, nx, ny, nz) => {
      let L = 0;
      for (let i = 0; i < vents.length; i++) {
        const v = vents[i], dx = v[0] - x, dy = v[1] - y, dz = v[2] - z, r2 = dx * dx + dy * dy + dz * dz;
        if (r2 > 40000) continue;
        L += v[3] * Math.max(0, (nx * dx + ny * dy + nz * dz) / Math.sqrt(r2 + 0.01) * 0.65 + 0.35) / (1 + r2 * 0.006);
      }
      return L;
    };
    const U = {
      uTime: { value: 0 }, uSun: { value: sun }, uVentCol: { value: ventCol.clone().multiplyScalar(2.3) },
      uLevPos: { value: new THREE.Vector3(0, -500, 0) }, uLevCol: { value: new THREE.Color(0, 0, 0) }, uLevFall: { value: 1 / (95 * 95) },
      uPortalPos: { value: portalPos.clone() }, uPortalCol: { value: portalCol.clone().multiplyScalar(0.6) },
      uIceCol: { value: iceCol.clone().lerp(new THREE.Color(pal[1]), 0.35) }, uCrackCol: { value: crackCol },
      uMatCol: { value: matCol.clone().multiplyScalar(0.5) }, uFrostCol: { value: iceCol.clone().lerp(crackCol, 0.4).multiplyScalar(0.9) },
      uSeed: { value: vr.range(0, 400) }, uFlow: { value: 0 }, uFis: { value: 0 }, uEntry: { value: new THREE.Vector2(sag.x, sag.z) },
    };
    // one great fissure is made to cross the path axis at the dip ahead of the entry: the opening image's leading line
    U.uFis.value = 0.5 - (((sag.x + U.uSeed.value) * 0.97 + (sag.z + U.uSeed.value) * 0.26) / 170 + 0.1);
    U.uLanCol = { value: coreCol.clone().multiplyScalar(1.5) };          // the lanterns' amber on the rock (baked per vertex once the jellies are placed)
    U.uLampPos = { value: new THREE.Vector3(0, -500, 0) }; U.uLampCol = { value: new THREE.Color(0, 0, 0) };   // the travelling company's light (live)
    const smokes = [];                                       // the smoke columns' colours, so the Leviathan's light can fall on them
    const lanJobs = [];                                      // { bake, pos, nor, ao }: vertex sets whose aBake.y is filled when the lanterns exist
    const shader = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o });
    const abyssMat = shader(ABYSS_VERT, ABYSS_FRAG, {}, { side: THREE.DoubleSide });

    // ---- mineral chimneys (one mesh), their vent lights, smoke and mouth glows -------------------------------
    const time = { value: 0 };
    const set = fx.fxGroup(); scene.add(set.object);
    const mouths = [];                                       // [x, y, z, chimney]
    const ledges = [];                                       // points on the chimneys' flanges where tube worms grow
    {
      const B = { pos: [], fx: [], idx: [], ao: [], ledges }, cr = rng.fork('spires');
      const addVent = (x, y, z, w) => { if (vents.length < NV) vents.push([x, y, z, w]); };
      for (const c of chimneys) {
        c.H = Math.max(7, Math.min(c.H, ceilAt(c.x, c.z) - c.y - 6));
        const hot = c.active ? 1 : 0.12, crust = c.active ? 1 : 0.55;
        const m = addSpire(B, cr, noise, c.x, c.z, c.y, c.H, c.R, c.seg, c.rings, { hot, crust, ledges: c.hero ? 0.13 : 0.02, big: c.hero });
        c.top = m;
        if (c.hero) {                                        // side vents on the camera side light its flank for the close pass
          const hp = path.pointAt(0.2), dx = hp.x - c.x, dz = hp.z - c.z, dl = Math.hypot(dx, dz);
          for (const [f, w] of [[0.3, 0.5], [0.6, 0.55], [0.82, 0.38]]) addVent(c.x + dx / dl * (c.R + 4.5), c.y + c.H * f, c.z + dz / dl * (c.R + 4.5), w);
        }
        if (c.active) { mouths.push([m[0], m[1], m[2], c]); addVent(m[0], m[1] + 1.5, m[2], c.ring ? 0.6 : cr.range(1.0, 1.5)); }
        // companions fused to its foot, on the side away from the camera
        const q = near(c.x, c.z), pp = path.pointAt(q.u), away = Math.atan2(c.z - pp.z, c.x - pp.x);
        const n = c.hero ? heroComp : c.ring ? 1 : cr.int(1, 2);
        let fa = away, fd = c.R * 1.5;
        for (let k = 0; k < n; k++) {
          const a = away + cr.range(-1.3, 1.3), dd = c.R * cr.range(1.0, 1.9), hh = c.H * cr.range(0.28, 0.62);
          const sx = c.x + Math.cos(a) * dd, sz = c.z + Math.sin(a) * dd;
          const sm = addSpire(B, cr, noise, sx, sz, c.y, hh, c.R * cr.range(0.45, 0.7), Math.max(10, Math.round(c.seg * 0.6)), Math.max(12, Math.round(c.rings * 0.6)), { hot, crust });
          if (k === 0) { fa = a; fd = dd; if (c.hero) mouths.push([sm[0], sm[1], sm[2], null]); }
        }
        // diffuse flow at the foot: a warm pool of light on the sea bed
        addVent(c.x - Math.cos(fa) * fd * 1.4, c.y + 3.5, c.z - Math.sin(fa) * fd * 1.4, c.ring ? 0.3 : c.active ? cr.range(0.55, 0.9) : 0.25);
        await ctx.yield();
      }
      // vents on the floor of the chasm: a glowing rift under the Leviathan's track
      const rift = [];
      for (let d = -120; d >= -310; d -= 38) {
        const tp = track[Math.round((d + 600) / 12)], x = tp.x + cr.range(-12, 12), z = tp.z + cr.range(-8, 8), fy = tp.y - 27;
        if (groundAt(x, z) - fy < 8) continue;
        addVent(x, fy + 5, z, 1.5); rift.push([x, fy + 4, z]);
      }
      if (rift.length) set.add(fx.makeGlows({ rng: cr.fork('rift'), time, positions: rift, color: ventCol.clone().lerp(new THREE.Color('#ffd0a0'), 0.2), size: 34, sizeJitter: 0.3,
        intensity: 0.5, flicker: 0.3, halo: 1, core: 0.12, fogAmount: 0.5 }));
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
      g.setAttribute('aFx', new THREE.Float32BufferAttribute(B.fx, 4));
      g.setIndex(B.idx); await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
      {
        const P = g.attributes.position, Nn = g.attributes.normal, bake = new Float32Array(P.count * 2);
        for (let i = 0; i < P.count; i++) { bake[i * 2] = ventLight(P.getX(i), P.getY(i), P.getZ(i), Nn.getX(i), Nn.getY(i), Nn.getZ(i)) * (0.3 + 0.7 * B.ao[i]); if (i % 4000 === 3999) await ctx.yield(); }
        g.setAttribute('aBake', new THREE.BufferAttribute(bake, 2));
        lanJobs.push({ bake, pos: P.array, nor: Nn.array, ao: B.ao });
      }
      const m = new THREE.Mesh(g, abyssMat); m.frustumCulled = false; m.name = 'chimneys';
      scene.add(m);
      await ctx.yield();

      // smoke: black, glowing at the throat, bent by the current; the ring's smoke is lit by the portal
      const sr = rng.fork('smoke');
      // (the smoke takes the Leviathan's light while it passes: see update)
      for (const [x, y, z, c] of mouths) {
        if (!c) continue;
        const toPortal = new THREE.Vector3(portalPos.x - x, 6, portalPos.z - z).normalize();
        const s = fx.makeSmokeColumn({
          rng: sr.fork('s'), time, position: [x, y - 0.5, z], count: c.hero ? 72 : c.ring ? 64 : 46,
          height: Math.max(14, Math.min(c.hero ? 34 : c.ring ? 50 : 40, ceilAt(x, z) - y - 1)), radius: [c.R * 0.3, c.R * (c.ring ? 1.2 : 1.7)], size: c.ring ? [c.R * 0.7, c.R * 3.0] : [c.R * 0.9, c.R * 4.2],
          color: c.ring ? '#0c1319' : c.far ? '#13232a' : '#0d1218', colorTop: c.ring ? '#17232d' : c.far ? '#1c373d' : '#151d26', shadowColor: '#020407', ambient: '#03060a',
          sunDir: c.ring ? toPortal : [0.2, 1, 0.1], sunColor: c.ring ? portalCol.clone().multiplyScalar(0.45) : iceCol.clone().multiplyScalar(0.35 * sun),
          hot: ventCol.clone().multiplyScalar(c.hero ? 2.8 : 2.2), hotFalloff: 15, opacity: c.far ? 0.62 : 0.82, rate: sr.range(0.04, 0.06),
          wind: [current.x, 0, current.z], bend: (c.ring ? 0.12 : 0.3) * curK, rim: 0.5,
        });
        set.add(s);
        smokes.push({ amb: s.uniforms.uAmbient.value, amb0: s.uniforms.uAmbient.value.clone(), col: s.uniforms.uColor.value, col0: s.uniforms.uColor.value.clone(),
          top: s.uniforms.uColorTop.value, top0: s.uniforms.uColorTop.value.clone(), sh: s.uniforms.uShadow.value, sh0: s.uniforms.uShadow.value.clone() });
      }
      const glowPos = mouths.map((m2) => [m2[0], m2[1] + 0.6, m2[2]]);
      set.add(fx.makeGlows({ rng: sr.fork('g'), time, positions: glowPos, color: ventCol.clone().lerp(new THREE.Color('#ffd0a0'), 0.25), size: 9, sizeJitter: 0.3,
        intensity: 1.5, flicker: 0.35, halo: 1, core: 0.7, fogAmount: 0.55 }));
    }
    await ctx.yield();

    // ---- sea bed ------------------------------------------------------------------------------------------------
    const X0 = -244, X1 = 244, Z0 = -984, Z1 = 92, CELL = 4;
    // big grids are cut into strips across the valley that share their vertex buffers: strips behind the camera are
    // frustum-culled and strips lost in the fog are hidden in update()
    const zoned = [];                                        // { object, z, half, reach }
    const addStrips = (attrs, idx, gx, gz, cell, material, name) => {
      const rows = Math.round(120 / cell);
      for (let j0 = 0; j0 < gz - 1; j0 += rows) {
        const j1 = Math.min(gz - 1, j0 + rows), g = new THREE.BufferGeometry();
        for (const k in attrs) g.setAttribute(k, attrs[k]);
        g.setIndex(new THREE.BufferAttribute(idx.subarray(j0 * (gx - 1) * 6, j1 * (gx - 1) * 6), 1));
        const zc = Z0 + (j0 + j1) * 0.5 * cell, half = (j1 - j0) * 0.5 * cell;
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3((X0 + X1) / 2, 30, zc), Math.hypot((X1 - X0) / 2, half, 70));
        const m = new THREE.Mesh(g, material); m.name = name;
        scene.add(m); zoned.push({ object: m, z: zc, half, reach: name === 'seabed' ? 265 : 350 });
      }
    };
    const nx = Math.round((X1 - X0) / CELL) + 1, nz = Math.round((Z1 - Z0) / CELL) + 1;
    {
      const hs = new Float32Array(nx * nz), cut = new Float32Array(nx * nz);
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) { hs[j * nx + i] = heightAt(X0 + i * CELL, Z0 + j * CELL); cut[j * nx + i] = lastCut; }
        if (j % 24 === 23) await ctx.yield();
      }
      const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), fxa = new Float32Array(nx * nz * 4), bake = new Float32Array(nx * nz * 2);
      for (let j = 0; j < nz; j++) { if (j % 16 === 15) await ctx.yield(); for (let i = 0; i < nx; i++) {
        const k = j * nx + i, x = X0 + i * CELL, z = Z0 + j * CELL, y = hs[k];
        pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
        const hx = hs[j * nx + Math.min(nx - 1, i + 1)] - hs[j * nx + Math.max(0, i - 1)], hz = hs[Math.min(nz - 1, j + 1) * nx + i] - hs[Math.max(0, j - 1) * nx + i];
        const il = 1 / Math.hypot(hx, 2 * CELL, hz);
        nor[k * 3] = -hx * il; nor[k * 3 + 1] = 2 * CELL * il; nor[k * 3 + 2] = -hz * il;
        let mat = Math.max(0, noise.n2(x * 0.021 + 70, z * 0.021 - 30) - 0.45) * 1.3, hot = 0, crust = 0;
        for (let c = 0; c < chimneys.length; c++) {
          const ch = chimneys[c], dx = x - ch.x, dz = z - ch.z, d2 = dx * dx + dz * dz;
          if (d2 > 3600) continue;
          const g = Math.exp(-d2 / (ch.R * ch.R * 22));
          mat += g * 0.85; crust += Math.exp(-d2 / (ch.R * ch.R * 9));
          if (ch.active) hot += Math.exp(-d2 / (ch.R * ch.R * 4.5)) * 0.75;
        }
        if (cut[k] > 3) {                                    // the chasm: glowing mats on its walls, lava in the creases of its floor
          const td = trackNear(x, z).dist, deep = smoothstep(3, 14, cut[k]);
          mat = Math.max(mat, 0.9 * deep * smoothstep(24, 40, td) * (1 - smoothstep(64, 84, td)));
          hot += 0.4 * deep * (1 - smoothstep(10, 40, td)) * (0.4 + 0.6 * smoothstep(-0.3, 0.3, noise.n2(x * 0.03 + 5, z * 0.03 + 8)));
        }
        const db = Math.hypot(x - brine.x, z - brine.z);
        fxa[k * 4] = Math.min(1, mat); fxa[k * 4 + 1] = Math.min(0.5, hot); fxa[k * 4 + 2] = Math.min(1, crust); fxa[k * 4 + 3] = Math.exp(-db * db / 300);
        bake[k * 2] = ventLight(x, y, z, nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2]);
      } }
      await ctx.yield();
      const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
      let o = 0;
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d;
      }
      addStrips({ position: new THREE.BufferAttribute(pos, 3), normal: new THREE.BufferAttribute(nor, 3), aFx: new THREE.BufferAttribute(fxa, 4), aBake: new THREE.BufferAttribute(bake, 2) }, idx, nx, nz, CELL, abyssMat, 'seabed');
      lanJobs.push({ bake, pos, nor });
    }
    await ctx.yield();

    // ---- pillow-lava boulders -------------------------------------------------------------------------------------
    {
      const rr = rng.fork('rocks');
      const g = T.rockGeometry({ rng: rr, kind: 'boulder', radius: 1, detail: 1 });
      g.setAttribute('aFx', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 4), 4));
      const N = 240, im = new THREE.InstancedMesh(g, abyssMat, N), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
      const rb = new Float32Array(N * 2), rp = new Float32Array(N * 3), rn = new Float32Array(N * 3);
      let n = 0;
      for (let tries = 0; tries < N * 8 && n < N; tries++) {
        const u = rr.range(0, 1), lat = rr.range(11, 85) * rr.sign(), p = path.pointAt(u), t = path.tangentAt(u);
        const x = p.x - t.z * lat, z = p.z + t.x * lat, y = heightAt(x, z), s = 0.9 + 4.2 * Math.pow(rr(), 2.2);
        if (y + s * 1.2 > near(x, z).y - 8) continue;
        e.set(rr.range(-0.3, 0.3), rr() * 6.283, rr.range(-0.3, 0.3)); q4.setFromEuler(e);
        s3.set(s * rr.range(1, 1.5), s * rr.range(0.55, 0.85), s * rr.range(1, 1.5)); p3.set(x, y + s * 0.12, z);
        rb[n * 2] = ventLight(x, y + s, z, 0, 1, 0); rp.set([x, y + s, z], n * 3); rn[n * 3 + 1] = 1;
        im.setMatrixAt(n++, m4.compose(p3, q4, s3));
      }
      g.setAttribute('aBake', new THREE.InstancedBufferAttribute(rb, 2));
      lanJobs.push({ bake: rb, pos: rp.subarray(0, n * 3), nor: rn });
      im.count = n; im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'boulders';
      scene.add(im);
    }
    await ctx.yield();

    // ---- three.js lights (for the kit flora): dim ice light, the hero chimney, the portal, + the Leviathan's own
    scene.add(new THREE.HemisphereLight(iceCol.clone().lerp(new THREE.Color(pal[1]), 0.5), ventCol.clone().multiplyScalar(0.35), 0.5 * sun + 0.25));
    const heroCh = chimneys[0];
    const ventLamp = new THREE.PointLight(ventCol, 300, 110, 1);
    {
      const hp = path.pointAt(0.212);                        // between the chimney and the camera, low, so the worms catch it
      ventLamp.position.set(lerp(heroCh.x, hp.x, 0.45), heroCh.y + 10, lerp(heroCh.z, hp.z, 0.45));
    }
    const portalLamp = new THREE.PointLight(portalCol, 3200, 150, 2);
    portalLamp.position.copy(portalPos).add(new THREE.Vector3(0, 2, 6));
    scene.add(ventLamp, portalLamp);
    const lampHome0 = ventLamp.position.clone();

    // ---- tube worms, filter fans, anemones around the vents (kit flora, swaying in one slow current) ----------
    const sea = flora.makeWind({ direction: [current.x, current.z], speed: 0.4, strength: 1.3 * curK, gustScale: 0.03, gustiness: 0.4 });
    const floraSets = [];
    {
      const fr = rng.fork('flora');
      await ctx.yield();
      const seaMat = flora.windMaterial({ wind: sea, backlight: 0, ambient: 1.6, leafAmbient: 1.6, detail: 0.1, glow: 1 });
      const worm = (d, o) => flora.tendrilGeometry({ rng: fr.fork('w'), detail: d, height: 3.4, curl: 0.22, flex: 1.2, ...o });
      const kinds = [
        { base: '#6a625c', mid: '#e9e2d6', tip: '#ff2f45', glow: 1.25, count: 9 },         // white tubes, crimson plumes
        { base: '#5a1a22', mid: '#c8283a', tip: '#ff6a5a', glow: 1.0, count: 8 },          // crimson
        { base: '#77706a', mid: '#f4efe6', tip: '#ffd9c8', glow: 0.9, count: 10 },         // pale
      ];
      const nearV = [], farV = [];
      await ctx.yield();
      for (const k of kinds) { nearV.push(worm(1, k)); await ctx.yield(); }
      for (const k of kinds) { farV.push(worm(0, k)); await ctx.yield(); }
      const pts = [];
      for (const c of chimneys) {
        const n = c.hero ? 28 : c.ring ? 6 : c.active ? 9 : 5;
        for (let k = 0; k < n; k++) {
          const a = fr() * 6.283, r = c.R * fr.range(1.5, c.hero ? 4.2 : 3.6), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
          const q = near(x, z);
          if (q.dist < 7.5) continue;
          pts.push({ x, y: heightAt(x, z), z, s: fr.range(0.6, 1.45) * (c.hero ? 1.25 : 1), rot: fr() * 6.283, d: q.dist, u: q.u, v: fr.int(0, 2) });
        }
      }
      const lpts = [];
      for (const l of ledges) {                              // worms wreathing the chimneys themselves
        const q = near(l[0], l[2]);
        lpts.push({ x: l[0], y: l[1], z: l[2], s: l[3] ? fr.range(0.6, 1.05) : fr.range(0.4, 0.8), rot: fr() * 6.283, d: q.dist, u: q.u, v: fr.int(0, 2) });
      }
      // no worm within 7.5 m of the vent lamp: a plume two metres from it burns to a white square in the bloom
      for (let i = lpts.length - 1; i >= 0; i--) { const l = lpts[i]; if (Math.hypot(l.x - ventLamp.position.x, l.y - ventLamp.position.y, l.z - ventLamp.position.z) < 7.5) lpts.splice(i, 1); }
      await ctx.yield();
      const ledgeV = [];
      for (const k of kinds) { ledgeV.push(worm(0, { ...k, count: 5 })); await ctx.yield(); }
      floraSets.push(flora.makeScatter({ rng: fr.fork('ledge'), points: lpts, variants: ledgeV, chunks: 4, cullDistance: 190, material: seaMat, tint: 0.15, hue: 0.03, sink: 0.05, tilt: 0.3 }));
      await ctx.yield();
      floraSets.push(flora.makeScatter({ rng: fr.fork('worms'), points: pts, variants: nearV, farVariants: farV, farDistance: 15, chunks: 5, cullDistance: 205, material: seaMat, tint: 0.15, hue: 0.03, sink: 0.05, tilt: 0.12 }));
      await ctx.yield();
      await ctx.yield();
      const fan = (d, color, tip) => flora.coralGeometry({ rng: fr.fork('f'), kind: 'fan', size: 2.6, detail: d, color, tip, shade: '#16324a', glow: 0.5 });
      floraSets.push(flora.makeScatter({ rng: fr.fork('fans'), path, heightAt, radius: 80, corridor: 9, count: 230, chunks: 5, cullDistance: 230, spacing: 1.2, scale: [0.6, 1.9], falloff: 0.7,
        variants: [fan(1, '#9fc8e8', '#e8f6ff'), fan(1, '#c8a8e8', '#fff0ff'), fan(2, '#8fd8d0', '#f0fff8')], material: seaMat, tint: 0.2, hue: 0.05,
        density: (x, z) => 0.35 + 0.65 * smoothstep(-0.2, 0.4, noise.n2(x * 0.03 + 11, z * 0.03 - 5)) }));
      await ctx.yield();
      floraSets.push(flora.makeAnemones({ rng: fr.fork('anem'), path, heightAt, radius: 46, corridor: 8, count: 50, chunks: 4, cullDistance: 240, scale: [1.2, 3], material: seaMat, glow: 0.9,
        colors: ['#ff8a6a', '#ffd0b0', '#ff5a7a', '#ffe8d0'] }));
      for (const s of floraSets) scene.add(s.object);
    }
    await ctx.yield();

    // ---- the ice ceiling ---------------------------------------------------------------------------------------
    {
      const C2 = 8, cx = Math.round((X1 - X0) / C2) + 1, cz = Math.round((Z1 - Z0) / C2) + 1;
      const pos = new Float32Array(cx * cz * 3), idx = new Uint32Array((cx - 1) * (cz - 1) * 6);
      for (let j = 0; j < cz; j++) { if (j % 20 === 19) await ctx.yield(); for (let i = 0; i < cx; i++) {
        const k = (j * cx + i) * 3, x = X0 + i * C2, z = Z0 + j * C2;
        pos[k] = x; pos[k + 1] = ceilAt(x, z); pos[k + 2] = z;
      } }
      let o = 0;
      for (let j = 0; j < cz - 1; j++) for (let i = 0; i < cx - 1; i++) {
        const a = j * cx + i, b = a + 1, c = a + cx, d = c + 1;
        idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = b; idx[o++] = d; idx[o++] = c;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
      addStrips({ position: g.attributes.position, normal: g.attributes.normal }, idx, cx, cz, C2, shader(ICE_VERT, ICE_FRAG, {}, { side: THREE.DoubleSide }), 'ice');
      g.setIndex(null);
    }
    await ctx.yield();

    // ---- brine stalactites ------------------------------------------------------------------------------------
    const brineMat = shader(BRINE_VERT, BRINE_FRAG);
    {
      const sr = rng.fork('stalactites');
      const g = new THREE.ConeGeometry(1, 1, 6, 2, true).rotateX(Math.PI).translate(0, -0.5, 0);
      const at = new Float32Array(g.attributes.position.count);
      for (let i = 0; i < at.length; i++) at[i] = Math.min(0.995, -g.attributes.position.getY(i));
      g.setAttribute('aT', new THREE.BufferAttribute(at, 1));
      const N = 520, im = new THREE.InstancedMesh(g, brineMat, N), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
      let n = 0, cxs = 0, czs = 0, left = 0;
      for (let tries = 0; tries < N * 6 && n < N; tries++) {
        if (left <= 0) {                                     // they grow in clusters
          const u = sr.range(-0.03, 1) * sr.range(0.35, 1), lat = sr.range(0, 95) * sr.sign(), p = path.pointAt(u), t = path.tangentAt(u);
          cxs = p.x - t.z * lat; czs = p.z + t.x * lat; left = sr.int(3, 9);
        }
        left--;
        let x = cxs + sr.gauss() * 5, z = czs + sr.gauss() * 5;
        const skirt = n < 30;
        const entry = !skirt && n < 56;                      // and a row of long ones hanging from the dip ahead of the entry
        if (skirt) { const a = sr() * 6.283, r = sr.range(3.5, 13); x = brine.x + Math.cos(a) * r; z = brine.z + Math.sin(a) * r; }
        else if (entry) { x = sag.x + sr.range(-20, 20); z = sag.z + sr.range(-16, 16); }
        const c = ceilAt(x, z), q = near(x, z);
        let len = skirt ? sr.range(5, 15) : entry ? sr.range(6, 12) : 2.5 + 12 * Math.pow(sr(), 1.8);
        if (q.dist < 11) len = Math.min(len, c - q.y - 9);
        const tn = trackNear(x, z);
        if (tn.dist < 45) len = Math.min(len, c - tn.y - 20);
        if (len < 1.5) continue;
        e.set(sr.range(-0.06, 0.06), sr() * 6.283, sr.range(-0.06, 0.06)); q4.setFromEuler(e);
        const r = len * sr.range(0.05, 0.11) + 0.15;
        s3.set(r, len, r); p3.set(x, c + 0.6, z);
        im.setMatrixAt(n++, m4.compose(p3, q4, s3));
      }
      im.count = n; im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'stalactites';
      scene.add(im);
    }
    await ctx.yield();

    // ---- ice-algae curtains ----------------------------------------------------------------------------------
    const algaeMat = shader(ALGAE_VERT, ALGAE_FRAG, {
      uAlgaeA: { value: new THREE.Color('#4cae3a').multiplyScalar(1.05) }, uAlgaeB: { value: new THREE.Color('#e8c24a').multiplyScalar(1.45) },
      uCur: { value: new THREE.Vector2(current.x * curK, current.z * curK) },
    }, { side: THREE.DoubleSide });
    const shafts = [];                                       // [x, top y, z, length, width, kind, lean]
    const own = makeRng(hashSeed('lanterns-polish:' + ctx.seed));   // a random stream of this polish's own: the older layout does not move
    {
      const ar = rng.fork('algae'), pos = [], hang = [], idx = [];
      const NC = 54, SEGS = 12, ROWS = 6;
      for (let c = 0; c < NC; c++) {
        const u = c < 16 ? ar.range(0.0, 0.2) : ar.range(0.0, 0.98), lat = ar.range(8, c < 16 ? 34 : 70) * ar.sign(), p = path.pointAt(u), t = path.tangentAt(u);
        let x = p.x - t.z * lat, z = p.z + t.x * lat, dir = ar() * 6.283;
        const ringed = c === 0;
        if (ringed) { x = brine.x + 10 * Math.cos(dir); z = brine.z + 10 * Math.sin(dir); dir += Math.PI / 2; }
        const total = ringed ? 52 : ar.range(12, 30), step = total / SEGS, ph = ar() * 6.283, base = pos.length / 3, lenK = ar.range(5, 11.5);
        for (let i = 0; i <= SEGS; i++) {
          const q = near(x, z), cy = ceilAt(x, z), tn = trackNear(x, z);
          let len = lenK * (0.6 + 0.4 * Math.sin(i / SEGS * Math.PI)) * (0.8 + 0.2 * Math.sin(i * 1.7 + ph));
          if (q.dist < 12) len = Math.min(len, cy - q.y - 8);
          if (tn.dist < 45) len = Math.min(len, cy - tn.y - 18);
          len = Math.max(0.5, len);
          for (let r = 0; r <= ROWS; r++) { pos.push(x, cy + 0.4, z); hang.push(r / ROWS, len, ph, i * step); }
          dir += ringed ? step / 10 : ar.range(-0.45, 0.45); x += Math.cos(dir) * step; z += Math.sin(dir) * step;
        }
        for (let i = 0; i < SEGS; i++) for (let r = 0; r < ROWS; r++) {
          const a = base + i * (ROWS + 1) + r, b = a + 1, c2 = a + ROWS + 1, d = c2 + 1;
          idx.push(a, c2, b, b, c2, d);
        }
      }
      // THE CURTAIN HALL (u 0.27..0.33): long curtains hung across the way, one behind another, with a fissure's light
      // falling through them in shafts; the flight passes under their hems
      for (let c = 0; c < 8; c++) {
        const u = 0.268 + c * 0.0082 + own.range(-0.002, 0.002), p = path.pointAt(u), t = path.tangentAt(u);
        const total = own.range(24, 36), step = total / SEGS, ph = own() * 6.283, base = pos.length / 3, lenK = own.range(17, 25);
        let dir = Math.atan2(t.x, -t.z) + own.range(-0.45, 0.45), lat = -total * 0.5 + own.range(-9, 9);
        let x = p.x - t.z * lat, z = p.z + t.x * lat;
        for (let i = 0; i <= SEGS; i++) {
          const q = near(x, z), cy = ceilAt(x, z);
          let len = lenK * (0.55 + 0.45 * Math.sin(i / SEGS * Math.PI)) * (0.8 + 0.2 * Math.sin(i * 1.7 + ph));
          if (q.dist < 13) len = Math.min(len, cy - q.y - 6.5);
          len = Math.max(0.5, len);
          for (let r = 0; r <= ROWS; r++) { pos.push(x, cy + 0.4, z); hang.push(r / ROWS, len, ph, i * step); }
          if (i % 4 === 2) shafts.push([x + own.range(-2, 2), cy + 1, z + own.range(-2, 2), Math.min(46, cy - heightAt(x, z) - 2), own.range(3.2, 6.5), 0, 0.16]);
          dir += own.range(-0.3, 0.3); x += Math.cos(dir) * step; z += Math.sin(dir) * step;
        }
        for (let i = 0; i < SEGS; i++) for (let r = 0; r < ROWS; r++) {
          const a = base + i * (ROWS + 1) + r, b = a + 1, c2 = a + ROWS + 1, d = c2 + 1;
          idx.push(a, c2, b, b, c2, d);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aHang', new THREE.Float32BufferAttribute(hang, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, algaeMat); m.frustumCulled = false; m.name = 'algae';
      scene.add(m);
    }
    await ctx.yield();

    // ---- the brine column: ice to sea bed ---------------------------------------------------------------------
    const brineTop = ceilAt(brine.x, brine.z) + 2, brineBot = heightAt(brine.x, brine.z) - 1.5;
    // ---- shafts of light: through the curtain hall, round the brine column, and the glow standing in the chasm ----
    const shaftGain = new THREE.Vector2(1, 0);
    {
      for (let k = 0; k < 5; k++) { const a = own() * 6.283, r = own.range(7, 15); shafts.push([brine.x + Math.cos(a) * r, brineTop - 3, brine.z + Math.sin(a) * r, own.range(24, 36), own.range(2.5, 4.5), 0, 0.14]); }
      for (let d = -40; d >= -330; d -= 24) {
        const tp = track[Math.round((d + 600) / 12)], x = tp.x + own.range(-11, 11), z = tp.z + own.range(-9, 9), fy = tp.y - 27;
        shafts.push([x, fy + 45, z, 47, own.range(24, 38), 1, 0.1]);   // its top stays under the ice vault (track + 24)
      }
      const n = shafts.length, aBase = new Float32Array(n * 4), aShaft = new Float32Array(n * 4);
      shafts.forEach((h, i) => { aBase.set([h[0], h[1], h[2], h[3]], i * 4); aShaft.set([h[4], own() * 6.283, h[5], h[6]], i * 4); });
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(aBase, 4)); g.setAttribute('aShaft', new THREE.InstancedBufferAttribute(aShaft, 4));
      g.instanceCount = n;
      const m = new THREE.Mesh(g, shader(SHAFT_VERT, SHAFT_FRAG, {
        uShaftA: { value: crackCol.clone().lerp(iceCol, 0.25).multiplyScalar(0.8 * (0.6 + 0.4 * sun)) },
        uShaftB: { value: new THREE.Color(pal[5]).lerp(iceCol, 0.2).multiplyScalar(0.8) }, uGain: { value: shaftGain },
      }, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 1; m.name = 'light-shafts';
      scene.add(m);
    }
    await ctx.yield();
    {
      const br = rng.fork('brine'), SEG = 32, RINGS = 76, pos = [], uvs = [], at = [], idx = [], so = br() * 50;
      for (let j = 0; j <= RINGS; j++) {
        const t = j / RINGS, y = lerp(brineTop, brineBot, t);
        const prof = 1.2 + 7.5 * Math.exp(-t * 8) + 3.6 * Math.exp(-(1 - t) * 9) + 0.45 * Math.sin(t * 21 + so) + 0.55 * Math.pow(Math.max(0, Math.sin(t * 55 + so * 2)), 3) * (1 - t * 0.5);
        const ax = brine.x + Math.sin(t * 5.3 + so) * 1.3 * Math.sin(t * Math.PI), az = brine.z + Math.cos(t * 4.1 + so) * 1.3 * Math.sin(t * Math.PI);
        for (let i = 0; i <= SEG; i++) {
          const a = (i / SEG) * 6.283185, ii = i % SEG, an = (ii / SEG) * 6.283185;
          const fl = Math.abs(Math.sin(an * 3.5 + y * 0.09 + so)), fl2 = Math.abs(Math.sin(an * 8 - y * 0.05 + so * 3));   // a bundle of fused icicles
          const r = prof * (1 + 0.22 * noise.fbm3(Math.cos(an) * 1.5 + so, y * 0.12, Math.sin(an) * 1.5, 3)) * (0.82 + 0.3 * fl + 0.09 * fl2);
          pos.push(ax + Math.cos(a) * r, y, az + Math.sin(a) * r); uvs.push(i / SEG, t);
          at.push(Math.floor(clamp(1 - fl, 0, 1) * 99) + 0.62 + t * 0.3);
        }
      }
      for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
        const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(at, 1)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, shader(BRINE_VERT, BRINE_FRAG, { uFlow: { value: 1 } }, { side: THREE.DoubleSide })); m.name = 'brine-column';
      scene.add(m);
      const gp = [0.12, 0.38, 0.64, 0.9].map((t) => [brine.x, lerp(brineTop, brineBot, t), brine.z]);
      set.add(fx.makeGlows({ rng: br.fork('g'), time, positions: gp, color: crackCol, size: 22, sizes: [1.3, 0.8, 0.8, 1.2], intensity: 0.3, halo: 1, core: 0.15, flicker: 0.12, fogAmount: 0.6 }));
    }

    // ---- lantern-jellies ------------------------------------------------------------------------------------------
    {
      const jr = rng.fork('jellies'), N = jellyCount, CAP = N + 260, aPos = new Float32Array(CAP * 4), aParm = new Float32Array(CAP * 4);
      const lamps = [];                                      // [x, y, z, power]: where lanterns hang low or near enough to light the rock
      const greats = [];                                     // [x, y, z, bell radius, phase, seed, tentacle length, light]
      const bloomC = path.pointAt(bloomU);
      let n = 0;
      // a dense cluster of big lanterns on the axis of the entry view, rising through the camera's level
      for (let k = 0; k < 36 && n < N; k++) {
        const u = jr.range(0.05, 0.125), lat = (9 + 10 * jr()) * jr.sign(), size = jr.range(1.1, 1.5), p = path.pointAt(u), t = path.tangentAt(u);
        const x = p.x - t.z * lat, z = p.z + t.x * lat, yb = p.y - jr.range(9, 16), H = Math.min(27, ceilAt(x, z) - 2.5 - yb);
        if (H < 12) continue;
        aPos.set([x, yb, z, H], n * 4); aParm.set([size, jr(), jr.range(0.45, 0.9), jr()], n * 4); n++;
        lamps.push([x, yb + H * 0.4, z, 0.8 * size]);
      }
      for (let tries = 0; tries < N * 10 && n < N; tries++) {
        const size = 0.5 + 1.0 * Math.pow(jr(), 1.6), pick = jr();
        let x, z;
        if (pick < 0.06) {                                    // a loose swarm ahead of the entry: the opening image
          const u = jr.range(0.03, 0.14), lat = (8 + size + 30 * jr()) * jr.sign(), p = path.pointAt(u), t = path.tangentAt(u);
          x = p.x - t.z * lat; z = p.z + t.x * lat;
        } else if (pick < 0.29) {                            // the bloom the camera flies through
          const a = jr() * 6.283, r = 7 + 44 * Math.pow(jr(), 0.8);
          x = bloomC.x + Math.cos(a) * r; z = bloomC.z + Math.sin(a) * r * 1.5;
        } else if (pick < 0.4) {                             // rising around the portal
          const a = jr() * 6.283, r = 9 + 46 * jr();
          x = portalPos.x + Math.cos(a) * r; z = portalPos.z + Math.sin(a) * r;
        } else if (pick < 0.54) {                            // rising out of the Leviathan's chasm
          const tp = track[jr.int(24, 46)];
          x = tp.x + jr.gauss() * 20; z = tp.z + jr.gauss() * 14;
        } else {
          const u = jr.range(-0.02, 1.02), lat = (8 + size + 150 * Math.pow(jr(), 1.7)) * jr.sign(), p = path.pointAt(u), t = path.tangentAt(u);
          x = p.x - t.z * lat; z = p.z + t.x * lat;
        }
        const nq = near(x, z);
        if (nq.dist < 6.5 + size * 1.4 || (nq.u < 0.045 && nq.dist < 17)) continue;   // clear of the camera, and of the entry view
        if (chimneys.some((c) => Math.hypot(c.x - x, c.z - z) < c.R * 2 + size)) continue;
        if (Math.hypot(x - brine.x, z - brine.z) < 9) continue;
        const yb = heightAt(x, z) + 1.5, H = ceilAt(x, z) - 2.5 - yb;
        if (H < 12) continue;
        aPos.set([x, yb, z, H], n * 4); aParm.set([size, jr(), jr.range(0.45, 1.25), jr()], n * 4); n++;
        lamps.push([x, yb + 4, z, 0.4 * size]);
      }
      // THE TRAVELLING COMPANY (its own random stream, so nothing else in the valley moves): big lanterns hanging beside
      // the whole flight at the camera's level, a lower tier drifting just over the sea bed that lays pools of amber on
      // the pillow lava, and two hoops of lanterns round the way into the chimney ring. They rise a few metres, fade and
      // are reborn, so they stay where the flight passes instead of leaving for the ice.
      {
        const co = makeRng(hashSeed('lanterns-company:' + ctx.seed));
        const put = (x, yb, z, H, size, speed, pw) => {
          if (n >= CAP || chimneys.some((c) => Math.hypot(c.x - x, c.z - z) < c.R * 2.2 + size)) return;
          if (Math.hypot(x - brine.x, z - brine.z) < 10) return;
          aPos.set([x, yb, z, H], n * 4); aParm.set([size, co(), speed, co()], n * 4); n++;
          lamps.push([x, yb + H * 0.5, z, pw]);
        };
        const kd = (0.6 + 0.4 * (ctx.quality?.detail ?? 1)) * clamp(ctx.vary?.density ?? 1, 0.85, 1.2);
        const festival = !!ctx.vary?.rare;                   // the rare visit: four hoops of lanterns instead of two, a lantern-lit way to the portal
        for (let u = 0.132, side = co.sign(); u < 0.975; u += co.range(0.009, 0.0135) / kd) {        // beside the lens
          side = co.chance(0.72) ? -side : side;
          const size = co.range(1.15, 2.0), lat = (5.6 + size + 7.5 * co() * co()) * side, p = path.pointAt(u), t = path.tangentAt(u);
          const x = p.x - t.z * lat, z = p.z + t.x * lat, H = co.range(10, 14), yb = Math.max(heightAt(x, z) + 2, p.y - H * 0.5 - co.range(-1.5, 2.5));
          if (yb + H > ceilAt(x, z) - 2 || trackNear(x, z).dist < 14) continue;
          put(x, yb, z, H, size, co.range(0.22, 0.4), 1.0 * size);
        }
        for (let u = 0.115; u < 0.985; u += co.range(0.008, 0.0125) / kd) {                          // low over the sea bed
          const size = co.range(0.85, 1.5), lat = co.range(7, 36) * co.sign(), p = path.pointAt(u), t = path.tangentAt(u);
          const x = p.x - t.z * lat, z = p.z + t.x * lat, yb = heightAt(x, z) + 1.4, H = co.range(7, 11);
          if (yb + H > p.y - 2.5 && Math.abs(lat) < 11) continue;
          put(x, yb, z, H, size, co.range(0.16, 0.32), 1.7 * size);
        }
        for (const [u, R, cnt] of festival ? [[0.835, 11.5, 14], [0.905, 10, 12], [0.765, 12.5, 14], [0.87, 10.8, 13]] : [[0.835, 11.5, 14], [0.905, 10, 12]]) {                             // hoops round the way to the portal
          const p = path.pointAt(u), t = path.tangentAt(u), a0 = co() * 6.283;
          for (let k = 0; k < cnt; k++) {
            const a = a0 + k / cnt * 6.283, ca = Math.cos(a) * R, sa = Math.sin(a) * R * 0.92;
            put(p.x - t.z * ca, p.y + sa - 2.5, p.z + t.x * ca, 5, co.range(1.0, 1.5), co.range(0.1, 0.16), 1.2);
          }
        }
      }
      // THE GREAT LANTERNS (their own random stream): giant lantern-jellies hanging in the valley as landmarks, one to each
      // stretch of the flight, 17 to 26 m to the side of the path, each laying a wide pool of amber on the sea bed.
      {
        const gr = makeRng(hashSeed('lanterns-greats:' + ctx.seed));
        const bs = Math.sign(brineSide) || 1;
        for (const [u, lat0, up, size, far] of [[0.305, 19, 5, 6.6], [0.395, -21, 2, 7.4], [0.47, 23, -1, 6.2], [brineU - 0.012, -25 * bs, 3, 6.4],
          [0.842, 22 * bs, 2, 7.2], [0.925, -21 * bs, 9, 5.6], [0.80, -60, -3, 7.6, 1], [0.885, -46, -7, 8.6, 1]]) {   // the last two hang far off, over the chasm: the far distance
          const p = path.pointAt(u), t = path.tangentAt(u);
          let done = false;
          for (let k = 0; k < 6 && !done; k++) {              // step outward until it hangs clear of chimneys, the brine column and the Leviathan's way
            const lat = lat0 + Math.sign(lat0) * k * 4, uu = u + (k % 2 ? 0.012 : 0) * (k > 2 ? -1 : 1);
            const pp = k ? path.pointAt(uu) : p, tt = k ? path.tangentAt(uu) : t;
            const x = pp.x - tt.z * lat, z = pp.z + tt.x * lat, gy = heightAt(x, z), cy = ceilAt(x, z);
            const y = Math.min(pp.y + up, cy - size * 0.9 - 3);
            if (y - gy < size * 1.6) continue;
            if (chimneys.some((c) => Math.hypot(c.x - x, c.z - z) < c.R * 2.4 + size + 2)) continue;
            if (Math.hypot(x - brine.x, z - brine.z) < size + 13) continue;
            const tn = trackNear(x, z);
            if (!far && tn.dist < size + 16 && tn.y - 14 < y + size) continue;
            greats.push([x, y, z, size, gr(), gr(), Math.min(size * 2.9, y - gy - 0.6), gr.range(0.9, 1.1)]);
            done = true;
          }
        }
      }
      {                                                      // and the greatest of them hangs behind and above the portal, its tentacles falling round the ring: the way out is under it
        const t = path.tangentAt(1), x = portalPos.x + t.x * 17, z = portalPos.z + t.z * 17, size = 9.5;
        const y = Math.min(portalPos.y + 17, ceilAt(x, z) - size * 0.9 - 2), gy = heightAt(x, z);
        greats.push([x, y, z, size, 0.37, 0.61, Math.min(size * 3.2, y - gy - 0.6), 1.15]);
      }
      await ctx.yield();
      // the lanterns' light on sea bed, chimneys and boulders: summed per vertex through a coarse grid
      {
        const GC = 30, grid = new Map(), key = (i, j) => i * 4096 + j;
        for (const l of lamps) { const k = key(Math.floor(l[0] / GC) + 2048, Math.floor(l[2] / GC) + 2048); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(l); }
        let work = 0;
        for (const job of lanJobs) {
          const P = job.pos, Nn = job.nor, cnt = P.length / 3;
          for (let i = 0; i < cnt; i++) {
            const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], gi = Math.floor(x / GC) + 2048, gj = Math.floor(z / GC) + 2048;
            let L = 0;
            for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
              const cell = grid.get(key(gi + a, gj + b));
              if (!cell) continue;
              for (let c = 0; c < cell.length; c++) {
                const l = cell[c], dx = l[0] - x, dy = l[1] - y, dz = l[2] - z, r2 = dx * dx + dy * dy + dz * dz;
                if (r2 > 900) continue;
                const w = 1 - r2 / 900;
                L += l[3] * w * w * Math.max(0, (Nn[i * 3] * dx + Nn[i * 3 + 1] * dy + Nn[i * 3 + 2] * dz) / Math.sqrt(r2 + 0.01) * 0.6 + 0.4) / (1 + r2 * 0.022);
              }
            }
            for (let c = 0; c < greats.length; c++) {          // the Great Lanterns: fewer, far wider pools
              const l = greats[c], dx = l[0] - x, dy = l[1] - y, dz = l[2] - z, r2 = dx * dx + dy * dy + dz * dz;
              if (r2 > 7000) continue;
              const w = 1 - r2 / 7000;
              L += 3.0 * l[7] * w * w * Math.max(0, (Nn[i * 3] * dx + Nn[i * 3 + 1] * dy + Nn[i * 3 + 2] * dz) / Math.sqrt(r2 + 0.01) * 0.6 + 0.4) / (1 + r2 * 0.0042);
            }
            job.bake[i * 2 + 1] = job.ao ? L * (0.35 + 0.65 * job.ao[i]) : L;
            if (++work % 1200 === 0) await ctx.yield();
          }
        }
      }
      await ctx.yield();
      const base = jellyGeometry();
      const mat = shader(JELLY_VERT, JELLY_FRAG, {
        uCore: { value: coreCol.clone().multiplyScalar(1.25) }, uBell: { value: new THREE.Color('#ffe9d2').lerp(iceCol, 0.35) },
        uBead: { value: coreCol.clone().lerp(new THREE.Color('#ff7a5a'), 0.35) }, uMinAng: { value: 0.0076 },
      }, { transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide });
      if (greats.length) {
        const gb = greatGeometry(), g = new THREE.InstancedBufferGeometry();
        g.index = gb.index; g.setAttribute('position', gb.attributes.position); g.setAttribute('aCfg', gb.attributes.aCfg);
        const gp = new Float32Array(greats.length * 4), gq = new Float32Array(greats.length * 4);
        greats.forEach((l, i) => { gp.set([l[0], l[1], l[2], l[3]], i * 4); gq.set([l[4], l[5], l[6], l[7]], i * 4); });
        g.setAttribute('gPos', new THREE.InstancedBufferAttribute(gp, 4)); g.setAttribute('gParm', new THREE.InstancedBufferAttribute(gq, 4));
        g.instanceCount = greats.length;
        const m = new THREE.Mesh(g, shader(GREAT_VERT, GREAT_FRAG, {
          uCore: { value: coreCol.clone().multiplyScalar(1.2) }, uBell: { value: new THREE.Color('#ffe9d2').lerp(iceCol, 0.45) },
          uBead: { value: coreCol.clone().lerp(new THREE.Color('#ff7a5a'), 0.3) }, uBead2: { value: crackCol.clone().lerp(iceCol, 0.3) },
        }, { transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide }));
        m.frustumCulled = false; m.renderOrder = 3; m.name = 'great-lanterns';
        scene.add(m);
      }
      const NZ = 6, zs = (Z1 - Z0) / NZ;                       // zones along the valley, hidden once they are lost in the fog
      for (let b = 0; b < NZ; b++) {
        const za = Z0 + b * zs, pa = [], pb = [];
        for (let i = 0; i < n; i++) {
          const z = aPos[i * 4 + 2];
          if ((z >= za && z < za + zs) || (b === 0 && z < Z0) || (b === NZ - 1 && z >= Z1)) { for (let k = 0; k < 4; k++) { pa.push(aPos[i * 4 + k]); pb.push(aParm[i * 4 + k]); } }
        }
        if (!pa.length) continue;
        const g = new THREE.InstancedBufferGeometry();
        g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('aCfg', base.attributes.aCfg);
        g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(pa), 4)); g.setAttribute('aParm', new THREE.InstancedBufferAttribute(new Float32Array(pb), 4));
        g.instanceCount = pa.length / 4;
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'lantern-jellies';
        scene.add(m); zoned.push({ object: m, z: za + zs / 2, half: zs / 2, reach: 300 });
      }
    }
    await ctx.yield();

    // ---- fish that are only spines of light, ribbon eels --------------------------------------------------------
    const creatures = [];
    {
      const cr = rng.fork('fauna');
      const dark = { sunDir: [0.1, 1, 0.1], sunColor: '#3a86a8', sunIntensity: 0.22 * sun, sky: pal[1], skyIntensity: 0.3, ground: '#3a1408', groundIntensity: 0.25 };
      // the kit's glowfish with the body made invisible: black, drawn additively, squeezed to a sliver, so that only
      // the glowing lateral line is left
      const fish = (o) => {
        const fs2 = F.makeFishSchool({ rng: cr.fork('fish'), species: 'glowfish', lod: 'mid', count: 280, size: 2.7, spread: [6, 3, 22], speed: 6, light: dark, caustics: 0, rim: 0, spec: 0,
          top: '#000000', belly: '#000000', fin: '#000000', glow: '#9fe8ff', glowIntensity: 2.5, ...o });
        const g = fs2.geometry, P = g.attributes.position, A = g.attributes.aAnim, G = g.attributes.aGlow;
        if (P && A && G) {
          for (let i = 0; i < P.count; i++) {
            const thin = A.getX(i) > 0.5;
            P.setY(i, P.getY(i) * (thin ? 0.55 : 0.42)); P.setX(i, P.getX(i) * 0.6);
            G.setX(i, thin ? 0.1 : 1);
          }
          P.needsUpdate = true; G.needsUpdate = true;
        }
        const m = fs2.material, mu = m.uniforms;
        m.transparent = true; m.blending = THREE.AdditiveBlending; m.depthWrite = false;
        for (const k of ['uRim', 'uSpec', 'uBack', 'uFill']) if (mu[k]) mu[k].value = 0;
        m.fragmentShader = m.fragmentShader.replace('#include <fog_fragment>', `
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * 0.7);
    #endif
  #endif`);
        m.needsUpdate = true;
        fs2.object.renderOrder = 2;
        return fs2;
      };
      // one school sweeps across the descent, in front of the hero chimney
      creatures.push(fish({ cross: { path, u: 0.3, lead: 38, span: 320, window: 0.22, angle: 68, side: -mirror, height: -1 } }));
      await ctx.yield();
      // one circles the brine column
      creatures.push(fish({ count: 220, center: [brine.x, lerp(brineBot, brineTop, 0.45), brine.z], radius: 26, height: 9, speed: 5 }));
      await ctx.yield();
      // and on some visits a third escorts the camera into the ring
      if (schools > 2) creatures.push(fish({ count: 200, along: { path, side: 10 * mirror, up: -4, lead: 36, from: 0.74, to: 0.99 } }));
      await ctx.yield();
      if (withEels) {
        const p = path.pointAt(0.9);
        creatures.push(F.makeRibbonEels({ rng: cr.fork('eels'), count: cr.int(5, 8), length: 22, width: 0.5, speed: 7, color: '#d2f0ff', color2: coreCol, intensity: 1.5,
          hueVariety: 0.15, center: [p.x - 28 * mirror, p.y + 12, p.z], radius: 48, height: 14, spread: [10, 6, 50] }));
      }
      await ctx.yield();
      const spans = [[0, 0.46], [0.45, 1], ...(schools > 2 ? [[0.68, 1]] : []), [0.55, 1]];
      creatures.forEach((c, i) => { c.span = spans[i]; scene.add(c.object); });
      {                                                        // a shoal wheeling round the near smoker of the middle stretch
        const c = chimneys.find((ch) => ch.fishy), q = near(c.x, c.z);
        const sh = fish({ count: Math.round(200 * (0.6 + 0.4 * (ctx.quality?.detail ?? 1))), center: [c.x, q.y + 1, c.z], radius: 12.5, height: 7, speed: 6.5, size: 3.0, lod: 'low' });
        sh.span = [0.16, 0.56]; scene.add(sh.object); creatures.push(sh);
      }
    }
    await ctx.yield();

    // ---- marine snow, plankton and vent bubbles ------------------------------------------------------------------
    const snow = set.add(fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time, count: Math.round(2600 * snowK), box: [58, 38, 58],
      velocity: [current.x * 0.55 * curK, -0.32, current.z * 0.55 * curK], velocityRandom: [0.25, 0.2, 0.25], turbulence: [0.45, 0.2, 0.5],
      size: [0.035, 0.11], colors: ['#d4ecff', '#9fd2ea', '#ffe2c4'], intensity: 0.85, opacity: 0.8, additive: 0.6, shape: 'disc' }));
    await ctx.yield();
    const uw = Water.makeUnderwater({ rng: rng.fork('uw'), light: 'night', surfaceY: 66, floorY: 2, rays: false,
      particles: { count: 420, range: 42, size: 0.06, color: '#7fb8d8', glowColor: coreCol, glowFraction: 0.3, glowIntensity: 2.2 },
      bubbles: { count: 240, size: 0.17, sources: mouths.map((m) => [m[0], m[1], m[2]]) } });
    if (uw.surface) uw.surface.visible = false;
    scene.add(uw.object);

    // a soft beacon behind the portal so its glow carries down the valley from u = 0.65
    set.add(fx.makeGlow({ time, position: [portalPos.x, portalPos.y, portalPos.z - 2.5], color: portalCol, size: 60, intensity: 0.42, halo: 1, core: 0.1, rays: 0, flicker: 0.06,
      fogAmount: 0.22, depthBias: 0 }));


    // ---- flight ---------------------------------------------------------------------------------------------------
    const gaze = new THREE.Vector3(), tmp = new THREE.Vector3();
    const revealAt = (u) => smoothstep(0.3, 0.48, u) * (1 - smoothstep(0.66, 0.79, u));   // its light arrives before it and lingers as an after-glow
    const camP = new THREE.Vector3(), lampP = new THREE.Vector3(), lampHome = lampHome0, lanCol = coreCol.clone();
    // where to look at the Leviathan: its head while that is ahead, then the part of the body that is 30 m ahead of the camera
    const gazeAt = (u) => {
      const cp = path.pointAt(u), tg = path.tangentAt(u);
      let s0 = 58, d0 = 0;
      for (let s = 58; s >= -66; s -= 6) {
        hero.bodyPosition(s, gaze);
        const d = (gaze.x - cp.x) * tg.x + (gaze.z - cp.z) * tg.z;
        if (d >= 30) { if (s < 58) hero.bodyPosition(lerp(s0, s, clamp((30 - d0) / Math.max(1e-3, d - d0), 0, 1)), gaze); break; }
        s0 = s; d0 = d;
      }
      return gaze;
    };
    // until it is close the Leviathan is almost dark: only its photophore rows show in the distance
    const ambTop0 = hero.uniforms.uAmbTop.value.clone(), ambBot0 = hero.uniforms.uAmbBot.value.clone();
    const driveHero = (u) => {
      const ap = smoothstep(0.33, 0.45, u);
      hero.setProgress(hero.progressAt(u, DURATION, T_PASS)); hero.setReveal(lerp(-0.3, 0.02, ap) + 0.78 * revealAt(u));
      hero.uniforms.uAmbTop.value.copy(ambTop0).multiplyScalar(0.2 + 0.8 * ap); hero.uniforms.uAmbBot.value.copy(ambBot0).multiplyScalar(0.2 + 0.8 * ap);
    };
    driveHero(0);

    return {
      scene, path, duration: DURATION,
      title: 'Lanterns under the Ice',
      camera: { fov: 64, near: 0.4, far: 1400, lookAhead: 34, sway: 1, bank: 0.7 },
      pois: [
        { at: [heroCh.x, heroCh.y + 31, heroCh.z], from: 0.07, to: 0.27, weight: 0.42 },
        { at: (t, u) => { driveHero(u); return gazeAt(u); }, from: 0.4, to: 0.675, weight: 0.68, fade: 0.35 },
        { at: [brine.x, lerp(brineTop, brineBot, 0.6), brine.z], from: 0.66, to: 0.8, weight: 0.3 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#bfeeff', glow: 1.3, revealDistance: 260 },
      post: {
        exposure: 1.1, bloom: { strength: 0.66, radius: 0.75, threshold: 0.85 },
        grade: { saturation: 1.12, contrast: 1.05, tint: '#eef6ff', shadowTint: '#01060e', vignette: 0.42, grain: 0.03, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t; U.uTime.value = t;
        const r = revealAt(u);
        shaftGain.y = 1.5 * smoothstep(0.26, 0.42, u) * (1 - smoothstep(0.56, 0.68, u));
        driveHero(u); hero.update(dt, t, camera);
        if (hero.light) {                                    // the Leviathan's light on the valley: PointLight for the flora, uniforms for rock and ice
          hero.light.intensity = r > 0.004 ? LIGHT_POWER * r : 0;   // dimmed to zero, never switched off: a change in the number of lights recompiles every lit shader in view
          tmp.copy(hero.light.position).applyMatrix4(hero.object.matrixWorld);
          const appr = smoothstep(0.34, 0.42, u) * (1 - smoothstep(0.44, 0.5, u));   // while it is still rising in the chasm its light reaches far up the valley: the chasm wakes
          U.uLevFall.value = lerp(1 / 9025, 1 / 44000, appr);
          U.uLevPos.value.copy(tmp); U.uLevCol.value.copy(hero.light.color).multiplyScalar(1.3 * r * (1 + 1.5 * appr));
        }
        for (const sm of smokes) {                             // black smoke against lit water read as holes: it takes the teal while the valley is lit
          const lc = U.uLevCol.value;
          sm.amb.setRGB(sm.amb0.r + lc.r * 0.32, sm.amb0.g + lc.g * 0.32, sm.amb0.b + lc.b * 0.32);
          sm.col.setRGB(sm.col0.r + lc.r * 0.3, sm.col0.g + lc.g * 0.3, sm.col0.b + lc.b * 0.3);
          sm.sh.setRGB(sm.sh0.r + lc.r * 0.22, sm.sh0.g + lc.g * 0.22, sm.sh0.b + lc.b * 0.22);
          sm.top.setRGB(sm.top0.r + lc.r * 0.4, sm.top0.g + lc.g * 0.4, sm.top0.b + lc.b * 0.4);
        }
        // the company's light: a lamp a little ahead of the lens for rock (uniforms) and, once the hero chimney is behind, for the flora too
        const lk = smoothstep(0.26, 0.34, u), on = smoothstep(0.085, 0.2, u);
        path.pointAt(Math.min(1, u + 0.02), lampP); lampP.y -= 4;
        U.uLampPos.value.copy(lampP); U.uLampCol.value.copy(lanCol).multiplyScalar(0.7 * on * (0.9 + 0.1 * Math.sin(t * 1.7)));
        ventLamp.position.lerpVectors(lampHome, lampP, lk); ventLamp.color.lerpColors(ventCol, lanCol, lk);
        ventLamp.intensity = lerp(300, 110, lk) * (0.82 + (0.12 * Math.sin(t * 3.1) + 0.06 * Math.sin(t * 7.7 + 1.3)) * (1 - 0.6 * lk));
        camP.setFromMatrixPosition(camera.matrixWorld);
        const cz = camP.z;
        for (const zn of zoned) zn.object.visible = Math.abs(cz - zn.z) < zn.half + zn.reach;
        hero.centerPosition(tmp);                              // 100k triangles: only drawn while it can be seen through the fog
        { const near = u > 0.41 && tmp.distanceTo(camP) < 340; for (const c of hero.object.children) if (c !== hero.light) c.visible = near; }   // the light itself stays in the scene: hiding it would change the number of lights and recompile every lit shader in view
        set.update(dt, t, camera); uw.update(dt, t, camera); sea.update(t);
        for (const s of floraSets) s.update(dt, t, camera);
        for (const c of creatures) { const on = u >= c.span[0] && u <= c.span[1]; c.object.visible = on; if (on) c.update(dt, t, camera, u); }
      },
      dispose() { hero.dispose(); },
    };
  },
};
