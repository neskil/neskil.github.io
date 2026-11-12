// Spore Rain hero: THE PARASOL AS CATHEDRAL.
// A parasol mushroom (Macrolepiota procera) at 150x life: snakeskin-banded stalk over a bulb, loose
// double ring, shaggy brown scales on a cream cap with a dark boss, 200 wedge gills (plus 200 short
// ones) each beaded with water, spore curtains sifting out of the vault and curling up round the
// rim, and the wood's one sunbeam drawn analytically in every material.
//
// SIZE     radius ~18 m (cap 34 m across), height ~36 m, rim ~28 m up, stalk 2.6 m over a 5 m bulb.
//          Origin = centre of the bulb's base, +Y up, front = +Z (the camera arrives from +Z heading -Z).
// COST     ~82k triangles (57k in frost: no water), 14 draw calls (13 with shaft:false, 12 without the
//          sibling), 9k point sprites and up to 4.2k glitter points in the shaft, no lights, no textures, ~150 ms build.
// LIGHT    Self-lit: every material here is a ShaderMaterial that ignores scene lights and uses
//          hero.uniforms: uSkyCol (shadowless pearl skylight), uGroundCol (copper bounce), uSunCol and
//          uSunDir (toward the sun, hero-local), and the shaft as a soft cylinder (uShaftP point on its
//          axis, uShaftR radius). The cap casts an analytic disc shadow, so the stalk is raked gold
//          below a slanting shadow line and the spores are grey above that line and gold glitter
//          below it and inside the shaft. Scene fog is honoured (fog: true). Default sun is on the
//          LEFT of a camera arriving from +Z: direction (-0.956, 0.292, 0), 17 degrees up.
//          Wants bloom threshold ~0.9: only droplet glints, spore glitter and the lit stalk exceed 1.
// OPTS     palette  [copper, umber, moss, pearl, cream, gold, scarlet] hex strings (brief default)
//          hour     'afternoon' (default) | 'dawn' (rose shaft from the right, +X) | 'day' (pale silver)
//                   | 'night' (cold blue-silver, no warm light)
//          weather  'drip' (default) | 'shower' (more and faster drips, streaked curtain)
//                   | 'frost' (no water beads, hoar sparkle, spores hang thick)
//          season   'october' (default) | 'early' (lemon and green litter) | 'late' (dark litter)
//          sunDir   THREE.Vector3 toward the sun in hero-local space (overrides hour's direction)
//          shaft    false to leave out the visible fog bar (the lighting still uses the shaft)
//          sibling  true | false to force the young drumstick parasol beside the hero (default: seed)
// HOOKS    hero.setProgress(u): 0..1 across the pass under the vault (suggested: world u 0.70 -> 0.85).
//          It thickens the curtain as the camera arrives and lets a staged row of big drips go from
//          the rim ahead of the camera. Never wall-clock. Defaults to a gentle ambient state.
//          hero.uniforms: shared uniform table (set uSunDir / uShaftP / uShaftR / colours to match the
//          world's own shaft). hero.shaft = { point, dir, radius } mirrors the defaults.
//          hero.uniforms.uFogK (default 1) thins the scene fog on the parasol's own surfaces.
//          hero.uniforms.uGlitR (default the shaft's radius): the radius of the part of the shaft in which spores glitter.
// ANCHORS  (hero-local)
//          hub         centre of the gill vault where blades meet the stalk: the gaze target (weight 0.7)
//          flyThrough  ordered eye points (1.9 m above base level) for the pass: in from the front,
//                      10 m left of the stalk, curving right behind it and out on heading ~40 deg right
//                      of -Z. Clear of stalk, ring, bulb and sibling by more than 7 m everywhere.
//          curtainLine where the shaft's edge crosses the spore curtain on that line (grey | gold)
//          portalSeat  { position, facing }: a suggestion only, 60 m beyond the pass along its exit
//                      heading (the brief seats the real portal in the hollow log)
//          viewpoints  entry (far, on the axis), arc (from the agaric arc), vault (under the gills)
//          rimDrip     a point under the rim on the camera side where staged drips fall
//          siblingBase base of the young parasol, or null
import * as THREE from 'three';
import { makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#B5622B', '#5A2E17', '#4E7A2E', '#C9D4C2', '#F1E6C8', '#FFD27A', '#D8281C'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- shared GLSL
export const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol, uShaftP, uCapC, uCapN, uCamL;
uniform float uShaftR, uCoreR, uCapR, uWet, uFrost, uDomeH;
float h31(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11, 0.23, 0.37)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.03 + 7.1) + 0.2 * vnoise(p * 4.1 + 13.7); }
// 1 inside the sunbeam, soft edge
float shaftMask(vec3 p){
  vec3 d = p - uShaftP; float along = dot(d, uSunDir);
  float dist = length(d - uSunDir * along);
  return 1.0 - smoothstep(uShaftR * 0.78, uShaftR * 1.06, dist);
}
// 1 inside the bar that is seen in the air (the shaft's core: hero.shaft.core, the whole shaft unless a world narrows it)
float coreMask(vec3 p){
  vec3 d = p - uShaftP; float along = dot(d, uSunDir);
  float dist = length(d - uSunDir * along);
  return 1.0 - smoothstep(uCoreR * 0.8, uCoreR * 1.04, dist);
}
// 1 where the cap does not shadow the point
float capLit(vec3 p){
  float dn = max(dot(uSunDir, uCapN), 0.02);
  float t = dot(uCapC - p, uCapN) / dn;
  vec3 h = p + uSunDir * t - uCapC;
  float rr = length(h - uCapN * dot(h, uCapN));
  if (t > 0.0) return smoothstep(uCapR - 1.6, uCapR + 0.5, rr);
  // above the rim plane: lit only outside the dome's own volume (the vault under it stays in shade)
  vec3 e = p - uCapC; float hp = dot(e, uCapN);
  float q = min(length(e - uCapN * hp) / max(uCapR, 1.0), 1.0);
  float domeY = uDomeH * (1.0 - q * q) - 0.9;
  return smoothstep(domeY, domeY + 0.5, hp);
}
`;

const SURF_VERT = /* glsl */`
attribute vec3 aCol;
attribute vec2 aux;
uniform mat4 uPart;
uniform vec3 uSway, uWave;
uniform float uCapRad;
varying vec3 vL, vN, vP, vCol;
varying vec2 vAux;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 p = position; vec3 n = normal;
  #if KIND == 2
    // blades waver a little along their length
    p.z += sin(p.x * 0.9 + float(gl_InstanceID) * 2.4) * 0.05 * aux.x * p.x * 0.12;
  #endif
  #if KIND == 6
    // litter leaves rock on their keel
    float rk = sin(uTime * (0.7 + fract(float(gl_InstanceID) * 0.37)) + float(gl_InstanceID)) * 0.05;
    p.y += p.x * rk;
  #endif
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
  #endif
  #if KIND == 2
    // follow the cap's scalloped margin (same wave as the cap top, see makeShape.waveAt)
    float wr = min(length(p.xz) / uCapRad, 1.05); float wth = atan(p.z, abs(p.x) + abs(p.z) < 1e-4 ? 1.0 : p.x);
    p.y += uWave.x * wr * wr * wr * (0.6 * sin(wth * 3.0 + uWave.y) + 0.4 * sin(wth * 5.0 + uWave.z));
  #endif
  vP = p;
  vec4 lp = uPart * vec4(p, 1.0);
  float hh = clamp(lp.y / 36.0, 0.0, 1.2);
  lp.xyz += uSway * hh * hh;
  vL = lp.xyz; vN = mat3(uPart) * n; vCol = aCol; vAux = aux;
  #ifdef USE_INSTANCING_COLOR
    vCol *= instanceColor;
  #endif
  #if KIND == 2
    vCol *= 0.8 + 0.35 * fract(float(gl_InstanceID) * 0.618);
  #endif
  vec4 mvPosition = modelViewMatrix * lp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SURF_FRAG = /* glsl */`
uniform vec3 cCopper, cUmber, cMoss, cPearl, cCream, cGold;
uniform float uRingY, uCapRad, uSeed, uLitter, uFogK;
varying vec3 vL, vN, vP, vCol;
varying vec2 vAux;
#include <fog_pars_fragment>
${GLSL_COMMON}
vec3 bumpN(vec3 N, vec3 p, float h, float k){
  vec3 dpx = dFdx(p), dpy = dFdy(p); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 g = sign(det) * (hx * r1 + hy * r2);
  return normalize(abs(det) * N - k * g + N * 1e-6);
}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamL - vL + vec3(0.0, 1e-4, 0.0));
  vec3 alb = vCol; float gloss = 0.35, ao = 1.0, sss = 0.0, h = 0.0, bumpK = 0.0;
  #if KIND == 0
    // ---- stalk: brown felt cracked into snakeskin zigzag bands over cream
    float ang = vAux.y * 6.28318; vec3 q = vec3(cos(ang), 0.0, sin(ang));
    float y = vP.y;
    float above = smoothstep(uRingY - 0.4, uRingY + 0.8, y);
    float zig = y * 1.25 + 0.30 * sin(ang * 5.0 + y * 0.4) + 0.22 * sin(ang * 11.0 - y * 0.9)
              + 1.3 * fbm3(vec3(q.x * 1.6, y * 0.3, q.z * 1.6) + uSeed);
    float b = fract(zig), row = floor(zig);
    float pat = smoothstep(0.02, 0.14, b) * (1.0 - smoothstep(0.50, 0.66, b));
    float brk = vnoise(vec3(q.x * 4.0, row * 3.7 + uSeed, q.z * 4.0) + y * 0.25);
    pat *= smoothstep(0.24, 0.46, brk);
    pat *= mix(1.0, 0.22, above);
    float fib = vnoise(vec3(q.x * 22.0, y * 0.5, q.z * 22.0));
    float low = 1.0 - smoothstep(1.0, 7.0, y);
    vec3 felt = mix(cUmber, cCopper, 0.18 + 0.3 * brk) * (0.75 + 0.4 * fib);
    vec3 skin = mix(cCream * 0.92, cCream * vec3(0.9, 0.84, 0.72), fib * 0.6 + low * 0.3);
    float fleck = smoothstep(0.6, 0.74, vnoise(vec3(q.x * 9.0, y * 2.4, q.z * 9.0) + uSeed)) * (1.0 - pat) * (0.4 - 0.25 * above);
    alb = mix(skin, felt, clamp(pat * 0.9 + low * 0.12 + fleck, 0.0, 1.0));
    h = pat * 0.8 + fib * 0.15; bumpK = 0.07; gloss = mix(0.5, 0.28, pat);
    ao = 0.55 + 0.45 * smoothstep(0.0, 4.0, y);
    ao *= 1.0 - 0.5 * smoothstep(uCapC.y - 1.0, uCapC.y + 4.0, y);
  #elif KIND == 1
    // ---- cap top: cream fibrils, concentric shaggy brown scales, dark boss
    float r = length(vP.xz); float th = atan(vP.z, abs(vP.x) + abs(vP.z) < 1e-4 ? 1.0 : vP.x);
    float rn = r / uCapRad;
    float ringW = 1.02; float ri = floor(r / ringW); float rc = (ri + 0.5) * ringW;
    float nC = max(floor(6.28318 * rc / 1.3), 3.0);
    float a = (th / 6.28318 + 0.5) * nC + 0.5 * mod(ri, 2.0);
    vec2 cuv = vec2(fract(a) - 0.5, (r - rc) / ringW);
    float cid = mod(floor(a), nC);
    float big = vnoise(vec3(cid * 1.7, ri * 2.3, uSeed));
    float sz = mix(0.62, 0.24, smoothstep(0.15, 1.0, rn)) * (0.7 + 0.6 * big);
    float dd = length(vec2(cuv.x * 1.15, cuv.y + 0.12 - abs(cuv.x) * 0.5));
    float sc = 1.0 - smoothstep(sz * 0.72, sz, dd + 0.10 * vnoise(vP * 3.0));
    float boss = 1.0 - smoothstep(1.9, 3.3, r + 0.7 * vnoise(vP * 1.3 + uSeed));
    sc = max(sc, boss);
    float fibr = vnoise(vec3(th * 40.0, r * 0.35, uSeed));
    float fib2 = vnoise(vec3(th * 110.0, r * 0.8, 3.0));
    vec3 ground = mix(cCream * 0.86, cCream * vec3(0.84, 0.74, 0.58), fibr * 0.55 + 0.25 * (1.0 - rn));
    ground *= 0.86 + 0.2 * fib2;
    vec3 scale = mix(cUmber * 1.05, cCopper * 0.8, 0.5 * big + 0.3 * rn) * (0.7 + 0.5 * fib2);
    scale = mix(scale, cUmber * 0.55, boss * 0.8);
    alb = mix(ground, scale, sc);
    float split = smoothstep(0.86, 1.0, rn) * smoothstep(0.55, 0.9, vnoise(vec3(th * 26.0, 1.0, uSeed)));
    alb *= 1.0 - 0.35 * split;
    h = sc * 0.9 + fibr * 0.2; bumpK = 0.16; gloss = mix(0.42, 0.6, boss);
    sss = smoothstep(0.7, 1.0, rn) * 0.5;
  #elif KIND == 2
    // ---- gills: cream wedges, dark up in the slots, bright wet edge
    float v = vAux.x;
    ao = mix(0.16, 1.0, pow(max(v, 0.0), 0.75));
    float fl = vnoise(vec3(vP.x * 2.0, vP.y * 6.0, vP.z * 2.0));
    alb = mix(cCream * vec3(0.80, 0.70, 0.60), cCream * 0.9, v) * (0.9 + 0.14 * fl) * vCol;
    alb = mix(alb, cCream * vec3(0.78, 0.60, 0.44), 0.35 * smoothstep(0.55, 1.0, vAux.y) * (1.0 - v));
    gloss = 0.25 + 0.5 * smoothstep(0.86, 1.0, v); sss = 0.16 * v;
  #elif KIND == 3
    // ---- flesh, ring, sibling: vertex colour with felt fibres
    float f3 = vnoise(vP * vec3(7.0, 1.2, 7.0)); float g3 = vnoise(vP * 1.7 + uSeed);
    alb = vCol * (0.8 + 0.3 * f3) * (0.88 + 0.24 * g3);
    h = f3 * 0.6 + g3; bumpK = 0.025; gloss = 0.3; ao = 0.6 + 0.4 * vAux.x; sss = 0.12 * vAux.y;
  #elif KIND == 4
    // ---- shaggy scale flaps
    float f4 = vnoise(vP * vec3(9.0, 9.0, 9.0));
    alb = vCol * (0.7 + 0.5 * f4); gloss = 0.3; ao = 0.55 + 0.45 * vAux.y; sss = 0.3 * vAux.y;
  #elif KIND == 5
    // ---- mound: haircap moss turf over wet humus and leaf mould
    float m1 = fbm3(vP * 0.4 + uSeed), m2 = vnoise(vP * 1.3), m3 = fbm3(vP * 3.2);
    vec3 moss = mix(cMoss * 0.5, mix(cMoss, cGold, 0.2), m2) * (0.6 + 0.6 * m3);
    vec3 humus = mix(cUmber * 0.5, mix(cCopper * 0.7, cGold * 0.6, uLitter), m2 * m2) * (0.7 + 0.5 * m3);
    float mk = smoothstep(0.40, 0.58, m1 + 0.25 * vAux.x);
    alb = mix(humus, moss, mk);
    h = m3 * 0.6 + m2 * 0.6; bumpK = 0.22; gloss = mix(0.5, 0.2, mk); ao = 0.55 + 0.45 * (1.0 - vAux.x);
  #else
    // ---- beech leaves: copper plates with midrib and veins, amber when back-lit
    vec2 uv = vAux; float mid = 1.0 - smoothstep(0.0, 0.035, abs(uv.y));
    float vv = 1.0 - smoothstep(0.03, 0.09, abs(fract(uv.x * 7.0 - abs(uv.y) * 2.2) - 0.5));
    float bl = vnoise(vec3(uv * 9.0, vCol.r * 20.0));
    alb = vCol * (0.75 + 0.4 * bl) * (1.0 - 0.3 * vv) * (1.0 - 0.45 * mid);
    alb *= 0.72; gloss = 0.45; sss = 0.42; h = vv * 0.5 + mid; bumpK = 0.08;
  #endif
  if (bumpK > 0.0) N = bumpN(N, vL, h, bumpK);
  // ---- light: pearl skylight, copper bounce, the one shaft, wet sky highlights
  float beam = shaftMask(vL) * capLit(vL);
  float ndl = dot(N, uSunDir);
  float dif = clamp(ndl * 0.88 + 0.12, 0.0, 1.0);
  vec3 sky = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  vec3 col = alb * sky * ao;
  col += alb * uSunCol * dif * beam;
  // translucency: light through thin flesh and leaves, toward the bright side
  float back = max(dot(V, -uSunDir), 0.0); back = back * back;
  col += alb * mix(cCopper, uSunCol, 0.6) * sss * (0.25 + 1.3 * back) * shaftMask(vL) * (0.35 + 0.65 * clamp(-ndl + 0.4, 0.0, 1.0));
  #if KIND == 2
    // warm light bounced up into the vault from the lit stalk and floor
    float hub = 1.0 - smoothstep(2.0, 15.0, length(vP.xz));
    col += alb * mix(uSunCol, uSkyCol * 1.6, 0.45) * shaftMask(vL) * (0.02 + 0.3 * hub * hub) * (0.3 + 0.7 * vAux.x);
    // on a frosty morning the vault is the one warm place in the wood: the stalk's light goes up into it, amber at
    // the hub and cream out to the rim, so the gills stand paler and warmer than the mist behind them
    col += alb * vec3(1.0, 0.72, 0.4) * uFrost * (0.2 + 0.55 * hub * hub) * (0.4 + 0.6 * vAux.x);
  #endif
  vec3 R = reflect(-V, N);
  float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
  float wet = gloss * uWet;
  col += uSkyCol * wet * (0.5 * fres * smoothstep(-0.2, 0.6, R.y) + 1.3 * pow(max(R.y, 0.0), 14.0) * 0.35) * ao;
  vec3 Hh = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0));
  col += uSunCol * wet * beam * 2.2 * pow(max(dot(N, Hh), 0.0), 60.0);
  // hoar frost: pale sparkle on up-facing edges
  float fr = uFrost * (0.2 + 0.32 * smoothstep(0.3, 0.8, fbm3(vL * 9.0))) * clamp(N.y * 0.7 + 0.5, 0.0, 1.0);
  col = mix(col, uSkyCol * 1.15 + uSunCol * beam * 0.6, fr * 0.6);
  #if KIND == 2
    // hoar along the blades' lower edges, thickest round the rim: a white fringe, its crystals catching the sky one
    // by one as the eye moves under them
    float rimK = smoothstep(0.78, 0.98, length(vP.xz) / uCapRad);
    float hoar = uFrost * smoothstep(0.8, 0.97, vAux.x) * (0.22 + 0.78 * rimK);
    col = mix(col, uSkyCol * 1.25, hoar * 0.55);
    col += uSkyCol * 2.6 * hoar * smoothstep(0.7, 0.86, vnoise(vL * 5.0 + V * 5.0));
  #endif
  gl_FragColor = vec4(col, 1.0);
  #if defined(USE_FOG) && defined(FOG_EXP2)
    // scene fog, thinned by uFogK (1 = as the scene; a world may let the parasol stand clearer of the haze)
    float fd = fogDensity * uFogK;
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fd * fd * vFogDepth * vFogDepth));
  #else
    #include <fog_fragment>
  #endif
}`;

// ---------------------------------------------------------------- water beads and drips
const BEAD_VERT = /* glsl */`
attribute vec4 iB;          // phase, kind (0 bead, 1 dripper, 2 staged dripper), fall height, period
uniform vec3 uSway;
uniform float uProgress;
varying vec3 vL, vN;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 c = instanceMatrix[3].xyz;
  float s = length(instanceMatrix[0].xyz);
  vec3 p = position; vec3 sc = vec3(1.0); float drop = 0.0;
  float tremble = sin(uTime * (4.0 + 5.0 * fract(iB.x * 7.3)) + iB.x * 40.0);
  if (iB.y < 0.5) {
    sc = vec3(1.0 - 0.05 * tremble, 0.82 + 0.07 * tremble, 1.0 - 0.05 * tremble);
  } else {
    float tf;                                  // seconds since letting go (negative: still hanging)
    float grow;
    if (iB.y < 1.5) { float t = fract(uTime / iB.w + iB.x); tf = (t - 0.72) * iB.w; grow = clamp(t / 0.72, 0.0, 1.0); }
    else { tf = (uProgress - iB.x) * 9.0; grow = 1.0; }
    float f = max(tf, 0.0);
    drop = min(15.0 * f * f, 25.0 * f);        // accelerates to the slowed 25 m/s
    float gone = step(iB.z, drop);
    float wob = sin(f * 15.0 + iB.x * 9.0) * 0.16 * step(0.001, f);
    float hang = mix(0.45, 1.0, grow);
    sc = hang * vec3(1.0 + wob, 1.0 + 0.25 * grow * (1.0 - step(0.001, f)) - wob * 1.4, 1.0 + wob) * (1.0 - gone);
    sc *= 1.0 + 0.04 * tremble * (1.0 - step(0.001, f));
  }
  vec3 lp = c + p * s * sc - vec3(0.0, drop, 0.0);
  float hh = clamp(c.y / 36.0, 0.0, 1.2);
  lp += uSway * hh * hh * (1.0 - step(0.001, drop));
  vL = lp; vN = normalize(position / max(sc, vec3(0.2)));
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

export const BEAD_FRAG = /* glsl */`
uniform vec3 cCopper, cUmber, cMoss, cPearl, cCream, cGold;
varying vec3 vL, vN;
#include <fog_pars_fragment>
${GLSL_COMMON}
// the canopy dome as the drop sees it: copper, lemon and green mosaic with pearl gaps, dark floor below
vec3 envCol(vec3 d){
  float n = vnoise(d * 5.0 + 3.0), m = vnoise(d * 11.0);
  vec3 can = mix(cCopper, cGold * 0.9, smoothstep(0.35, 0.7, n));
  can = mix(can, cMoss * 1.2, smoothstep(0.55, 0.8, m) * 0.6);
  can = mix(can * 0.55, uSkyCol * 1.5, smoothstep(0.62, 0.8, vnoise(d * 7.0 + 9.0)));
  vec3 flo = mix(cCopper * 0.45, cGold * 0.5, n);
  return mix(flo, can, smoothstep(-0.15, 0.25, d.y));
}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(uCamL - vL + vec3(0.0, 1e-4, 0.0));
  float nv = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = reflect(-V, N);
  vec3 T = refract(-V, N, 0.75);
  float fres = 0.03 + 0.97 * pow(1.0 - nv, 4.0);
  vec3 col = mix(envCol(vec3(-T.x, -T.y, -T.z)), uSkyCol, 0.3) * 0.62;          // the wood upside down inside the drop
  col += envCol(R) * fres * 0.9;
  float beam = shaftMask(vL) * capLit(vL);
  vec3 skyD = normalize(vec3(0.25, 1.0, 0.3));
  col += uSkyCol * 5.0 * pow(max(dot(R, skyD), 0.0), 70.0);  // the sharp sky highlight
  col += uSkyCol * 0.8 * pow(max(dot(R, normalize(vec3(-0.5, 0.6, -0.4))), 0.0), 30.0);
  float hz = 1.0 - abs(R.y); hz *= hz; hz *= hz;
  col += uSkyCol * 1.1 * hz * hz;
  col += uSunCol * shaftMask(vL) * 1.6 * pow(max(-R.y, 0.0), 10.0);
  col += uSunCol * beam * (4.0 * pow(max(dot(R, uSunDir), 0.0), 30.0) + 1.4 * pow(max(dot(N, -uSunDir), 0.0), 3.0));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- spores
// where a speck of the glitter is in the sun. uGlitR: the radius of the part of the shaft in which spores glitter (the
// whole shaft, unless the look narrows the bar that is seen in the air); uGlitTint: what the sun's colour is multiplied
// by on a spore (deep gold where the sun is warm, the spores' own cream under a silver sun, nothing by moonlight)
const SPORE_LIGHT = /* glsl */`
uniform float uGlitR;
uniform vec3 uGlitTint;
float glitMask(vec3 p){
  vec3 d = p - uShaftP; float along = dot(d, uSunDir);
  float dist = length(d - uSunDir * along);
  return 1.0 - smoothstep(uGlitR * 0.78, uGlitR * 1.06, dist);
}
// 1 on the sun's side of the stalk, 0 in its lee, with a soft ragged line between them that runs through the stalk:
// the half of the curtain that hangs in the lee of the stalk and the cap is grey smoke, the glitter is on the other half
float sunSide(vec3 p){
  vec2 b = normalize(uSunDir.xz + vec2(1e-4, 0.0));
  float s = dot(p.xz - uCapC.xz, b) + 2.4 * (vnoise(vec3(p.xz * 0.17, p.y * 0.11)) - 0.5);
  return smoothstep(-2.6, 2.6, s);
}`;
const SPORE_VERT = /* glsl */`
attribute vec4 aS;
uniform mat4 uPart;
uniform vec3 uSway;
uniform float uPx, uFall, uCapRad, uArrive, uThick, uGroundDrop;
varying vec4 vC;
varying float vSoft, vFog;
${GLSL_COMMON}
void main(){
  const float T = 46.0;
  float a = fract(aS.z + uTime / T) * T;
  float th = aS.x * 6.28318, r, y, fade;
  float h1 = fract(aS.w * 13.7), h2 = fract(aS.w * 71.3);
  if (aS.w < 0.64) {
    // the curtain: sifts straight out of the slots, bends outward with the air sliding off the cap
    float r0 = mix(2.6, uCapRad - 0.7, sqrt(aS.y));
    float y0 = mix(1.3, -0.15, smoothstep(3.0, 13.0, r0)) - 0.2;
    float sheet = floor(aS.x * 9.0), acr = fract(aS.x * 9.0) - 0.5;
    th = (sheet + 0.5) * 0.69813 + (r0 / uCapRad) * (0.7 + 0.5 * fract(sheet * 0.37)) + acr * abs(acr) * 1.1;
    r = r0 + (0.03 + 0.15 * r0 / uCapRad) * a * (1.0 + 0.008 * a);
    y = y0 - uFall * a;
    r += 0.55 * sin(a * 0.19 + aS.x * 31.0) * smoothstep(0.0, 8.0, a);
    y += 0.35 * sin(a * 0.13 + aS.y * 43.0) * smoothstep(0.0, 8.0, a);
    th += 0.035 * sin(a * 0.11 + h1 * 6.28) * smoothstep(0.0, 10.0, a);
    fade = smoothstep(0.0, 1.5, a) * (1.0 - smoothstep(T * 0.72, T, a));
    fade *= smoothstep(-uGroundDrop + 0.3, -uGroundDrop + 5.0, y);
    // each sheet thins and thickens as it falls, and no two sheets are equally thick: they hang apart as veils
    fade *= (0.5 + 0.5 * sin(a * 0.35 + sheet * 2.1 + r0 * 0.5)) * (0.55 + 0.9 * fract(sheet * 0.618 + 0.3));
  } else {
    // the rim eddy: falls a little, is drawn out past the lip, curls up and back over the cap
    float r0 = mix(uCapRad - 6.0, uCapRad - 0.6, aS.y);
    float y0 = mix(1.3, -0.15, smoothstep(3.0, 13.0, r0)) - 0.2;
    float t1 = 3.0 + 7.0 * h1;
    float a1 = min(a, t1), b = max(a - t1, 0.0);
    float r1 = r0 + 0.42 * t1, y1 = y0 - uFall * t1;
    float rho0 = max(uCapRad + 0.8 + 2.6 * h2 - r1, 1.3);
    float phi = min(b * 0.85 / rho0, 5.6);
    float rho = rho0 * (1.0 + 0.16 * phi);
    r = r0 + 0.42 * a1 + step(0.0001, b) * (rho0 - rho * cos(phi));
    y = y0 - uFall * a1 - step(0.0001, b) * rho * sin(phi) + 0.10 * b * smoothstep(3.0, 5.0, phi);
    r += 0.3 * sin(a * 0.23 + aS.x * 17.0); th += 0.025 * sin(a * 0.15 + h2 * 6.28);
    fade = smoothstep(0.0, 1.5, a) * (1.0 - smoothstep(4.2, 5.5, phi)) * (1.0 - smoothstep(T * 0.8, T, a));
    fade *= 0.6 + 0.4 * sin(th * 2.0 - uTime * 0.13 + 1.7);
  }
  vec4 lp = uPart * vec4(cos(th) * r, y, sin(th) * r, 1.0);
  float hh = clamp(lp.y / 36.0, 0.0, 1.2);
  lp.xyz += uSway * hh * hh * 1.6;
  float lit = coreMask(lp.xyz) * capLit(lp.xyz);
  float tw = 0.5 + 0.5 * sin(uTime * (3.0 + 9.0 * h2) + aS.w * 300.0);
  tw = tw * tw; tw = tw * tw;
  float glit = step(0.58, h1);                         // some stay dim dust even in the light
  vec3 gold = uSunCol * (0.4 + glit * (0.6 + 4.0 * tw));
  vec3 grey = uSkyCol * 0.62;
  float aGrey = 0.065 * uThick * (0.8 + 1.1 * uArrive * uArrive);       // as the eye comes under the vault the grey veils thicken into sheets
  float aGold = mix(0.10, 0.55, glit) * (0.8 + 0.4 * uArrive);
  float litS = smoothstep(0.45, 0.9, lit);          // only well-lit spores become crisp glitter
  float size = mix(1.5 + 1.1 * h1, 0.11 + 0.12 * h2 + 0.10 * (1.0 - glit), litS);
  vec4 mv = modelViewMatrix * lp;
  float px = size * projectionMatrix[1][1] * uPx * 0.5 / max(-mv.z, 0.5);
  float pmax = mix(30.0, 7.0, litS);
  float pc = clamp(px, 1.6, pmax);
  float cov = min(px / 1.6, 1.0); cov = mix(cov * cov, min(px / 0.6, 1.0), litS);       // glitter in the bar is still seen from the bank
  float al = mix(aGrey, aGold, litS) * fade * cov * (px > pmax ? pmax / px : 1.0) * smoothstep(1.5, 5.0, -mv.z);
  vC = vec4(mix(grey, gold, lit) * al, al * mix(1.0, 0.25, lit));
  vSoft = mix(0.0, 0.35, litS);
  vFog = -mv.z;
  gl_PointSize = pc;
  gl_Position = projectionMatrix * mv;
}`;

const SPORE_FRAG = /* glsl */`
uniform vec3 fogColor;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear, fogFar;
#endif
varying vec4 vC;
varying float vSoft, vFog;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float s = 1.0 - smoothstep(vSoft, 1.0, d);
  s = mix(s * s, s, step(0.01, vSoft));
  vec4 c = vC * s;
  float f = 0.0;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      f = 1.0 - exp(-fogDensity * fogDensity * vFog * vFog);
    #else
      f = smoothstep(fogNear, fogFar, vFog);
    #endif
  #endif
  c.rgb = mix(c.rgb, fogColor * c.a, f);
  gl_FragColor = c;
}`;

// gold glitter: spores adrift in the part of the shaft that passes beside the cap, below its rim. Crisp points, each
// winking; nothing where the cap's shadow falls, so the stalk stands dark behind them
const GLIT_VERT = /* glsl */`
attribute vec4 aS;
uniform float uPx, uFall, uGroundDrop;
uniform vec3 uSway;
varying vec4 vC;
varying float vSoft, vFog;
${GLSL_COMMON}
${SPORE_LIGHT}
void main(){
  float top = uGroundDrop + 1.5;
  float T = top / max(uFall * 0.7, 0.05);
  float a = fract(aS.z + uTime / T);
  float y = top * (1.0 - a) + 0.4;
  vec3 c = uShaftP + uSunDir * ((y - uShaftP.y) / max(uSunDir.y, 0.2));
  vec3 e1 = normalize(cross(uSunDir, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 1e-4, 0.0)), e2 = cross(uSunDir, e1);
  float th = aS.x * 6.28318 + 0.3 * sin(uTime * 0.07 + aS.w * 20.0), rr = uGlitR * 0.86 * sqrt(aS.y);
  vec3 p = c + (e1 * cos(th) + e2 * sin(th)) * rr;
  p.x += 0.4 * sin(uTime * 0.21 + aS.w * 31.0); p.z += 0.4 * sin(uTime * 0.17 + aS.w * 57.0);
  p.y = max(p.y, 0.3);
  float hh = clamp(p.y / 36.0, 0.0, 1.2);
  p += uSway * hh * hh * 1.6;
  float lit = glitMask(p) * sunSide(p) * capLit(p);
  // (where the look narrows the part of the shaft that glitters, the specks are thinned with its width, so that the
  // narrow bar is not packed with all that the whole shaft would hold: the rest are not drawn)
  lit *= step(fract(aS.w * 7.31 + aS.x * 3.17), uGlitR / max(uShaftR, 1.0));
  float h2 = fract(aS.w * 71.3);
  float tw = 0.5 + 0.5 * sin(uTime * (3.0 + 9.0 * h2) + aS.w * 300.0);
  tw = tw * tw; tw = tw * tw;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float size = 0.1 + 0.14 * h2;
  float px = size * projectionMatrix[1][1] * uPx * 0.5 / max(-mv.z, 0.5);
  float pc = clamp(px, 1.6, 4.5);
  // (a speck finer than a pixel is drawn a pixel and a half wide and that much fainter, so that from far off the
  // glitter is a faint shimmer in the bar and never a pale cloud in front of the cap)
  float cov = min(px, 1.0); cov *= sqrt(cov);
  float al = 0.5 * smoothstep(0.5, 0.95, lit) * cov * (px > 4.5 ? 4.5 / px : 1.0) * smoothstep(1.5, 5.0, -mv.z) * smoothstep(0.0, 0.06, a) * (1.0 - smoothstep(0.92, 1.0, a));
  vC = vec4(uSunCol * uGlitTint * (0.8 + 4.0 * tw) * al, al * 0.25);
  vSoft = 0.35;
  vFog = -mv.z;
  gl_PointSize = pc;
  gl_Position = projectionMatrix * mv;
}`;

// ---------------------------------------------------------------- the visible shaft
const SHAFT_VERT = /* glsl */`
uniform mat4 uPart;
varying vec3 vL;
void main(){ vec4 lp = uPart * vec4(position, 1.0); vL = lp.xyz; gl_Position = projectionMatrix * modelViewMatrix * lp; }`;

const SHAFT_FRAG = /* glsl */`
uniform float uStrength;
varying vec3 vL;
${GLSL_COMMON}
void main(){
  vec3 ro = uCamL; vec3 rd = normalize(vL - uCamL + vec3(0.0, 1e-4, 0.0));
  vec3 oc = ro - uShaftP;
  vec3 rdp = rd - uSunDir * dot(rd, uSunDir), ocp = oc - uSunDir * dot(oc, uSunDir);
  float a = max(dot(rdp, rdp), 1e-4), b = dot(rdp, ocp), c = dot(ocp, ocp) - uCoreR * uCoreR;
  float disc = b * b - a * c;
  if (disc <= 0.0) discard;
  float sq = sqrt(disc);
  float t0 = max((-b - sq) / a, 0.0), t1 = max((-b + sq) / a, 0.0);
  float chord = max(t1 - t0, 0.0);
  float dmin = sqrt(max(c + uCoreR * uCoreR - b * b / a, 0.0)) / max(uCoreR, 1.0);
  float edge = 1.0 - smoothstep(0.35, 1.0, dmin);
  vec3 p1 = ro + rd * (t0 + chord * 0.2), p2 = ro + rd * (t0 + chord * 0.4), p3 = ro + rd * (t0 + chord * 0.6), p4 = ro + rd * (t0 + chord * 0.8);
  float lit = 0.45 + 0.55 * 0.25 * (capLit(p1) + capLit(p2) + capLit(p3) + capLit(p4));
  // above the floor only, and thinning toward the canopy
  float gy = 0.25 * (smoothstep(-1.0, 4.0, p1.y) + smoothstep(-1.0, 4.0, p2.y) + smoothstep(-1.0, 4.0, p3.y) + smoothstep(-1.0, 4.0, p4.y));
  vec3 pm = ro + rd * (t0 + chord * 0.5) - uShaftP;
  float along = dot(pm, uSunDir);
  float fadeA = 1.0 - smoothstep(60.0, 150.0, along);
  // leaf-gap streaks that slide as the canopy sways
  vec3 perp = pm - uSunDir * along;
  float streak = 0.72 + 0.28 * vnoise(vec3(perp.y * 0.35 + uTime * 0.05, perp.z * 0.35, uTime * 0.03))
               + 0.18 * vnoise(vec3(perp.y * 1.1, perp.z * 1.1 - uTime * 0.04, 2.0));
  float dens = 1.0 - exp(-chord * 0.011);
  vec3 col = uSunCol * uStrength * dens * edge * lit * gy * fadeA * streak;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- geometry helpers
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mixn = (a, b, t) => a + (b - a) * t;

// Parametric grid: fn(u, v, out, i, j) fills out.p (xyz), out.c (rgb), out.a (aux xy). wrap welds the u seam's normals.
export function gridGeo(nu, nv, wrap, fn) {
  const G = gridBuffers(nu, nv);
  gridRows(G, fn, 0, nv + 1);
  return gridNormals(gridIndexed(G), nu, nv, wrap);
}
// The same grid filled `step` rows at a time, handing the page back in between: for the large or costly grids.
export async function gridGeoAsync(ctx, nu, nv, wrap, fn, step = 8) {
  const G = gridBuffers(nu, nv);
  for (let j = 0; j <= nv; j += step) { gridRows(G, fn, j, Math.min(nv + 1, j + step)); await ctx.yield?.(); }
  const g = gridIndexed(G);
  await ctx.yield?.();
  return gridNormals(g, nu, nv, wrap);
}
function gridBuffers(nu, nv) {
  const n = (nu + 1) * (nv + 1);
  return { nu, nv, pos: new Float32Array(n * 3), col: new Float32Array(n * 3), aux: new Float32Array(n * 2), o: { p: [0, 0, 0], c: [1, 1, 1], a: [0, 0] } };
}
function gridRows({ nu, nv, pos, col, aux, o }, fn, j0, j1) {
  const cols = nu + 1;
  for (let j = j0, k = j0 * cols; j < j1; j++) for (let i = 0; i < cols; i++, k++) {
    fn(i / nu, j / nv, o, i, j);
    pos[k * 3] = o.p[0]; pos[k * 3 + 1] = o.p[1]; pos[k * 3 + 2] = o.p[2];
    col[k * 3] = o.c[0]; col[k * 3 + 1] = o.c[1]; col[k * 3 + 2] = o.c[2];
    aux[k * 2] = o.a[0]; aux[k * 2 + 1] = o.a[1];
  }
}
function gridIndexed({ nu, nv, pos, col, aux }) {
  const cols = nu + 1, n = cols * (nv + 1);
  const idx = new (n > 65535 ? Uint32Array : Uint16Array)(nu * nv * 6);
  for (let j = 0, k = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aux', new THREE.BufferAttribute(aux, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
function gridNormals(g, nu, nv, wrap) {
  g.computeVertexNormals();
  if (wrap) {
    const nr = g.attributes.normal.array, cols = nu + 1;
    for (let j = 0; j <= nv; j++) {
      const a = (j * cols) * 3, b = (j * cols + nu) * 3;
      let x = nr[a] + nr[b], y = nr[a + 1] + nr[b + 1], z = nr[a + 2] + nr[b + 2];
      const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
      nr[a] = nr[b] = x; nr[a + 1] = nr[b + 1] = y; nr[a + 2] = nr[b + 2] = z;
    }
  }
  return g;
}

// The parasol's proportions for one seed. All cap functions are in cap space: origin on the axis at
// rim height, +Y up along the cap's own (slightly tilted) axis.
function makeShape(rng, noise) {
  const S = rng.range(0.97, 1.03);
  const sh = {
    S, Rc: 17 * S * rng.range(0.97, 1.03), rimY: 28 * S,
    dome: rng.range(4.9, 5.9) * S, umbo: rng.range(1.3, 1.9) * S, umboR: rng.range(2.3, 3.0) * S,
    leanDir: rng.range(0, TAU), lean: rng.range(0.5, 2.0) * S,
    ringY: rng.range(19.5, 22.5) * S, wave: [rng.range(0.25, 0.5) * S, rng.range(0, TAU), rng.range(0, TAU)],
    seed: rng.range(0, 50), NG: 200, rIn: 2.15 * S, stalkR: 1.3 * S, bulbR: 2.5 * S,
  };
  sh.stalkTop = sh.rimY + sh.dome * 0.86;
  sh.waveAt = (r, th) => sh.wave[0] * Math.pow(Math.min(r / sh.Rc, 1.05), 3) * (0.6 * Math.sin(th * 3 + sh.wave[1]) + 0.4 * Math.sin(th * 5 + sh.wave[2]));
  sh.topY = (r) => { const q = Math.min(r / sh.Rc, 1); return 0.5 * S + sh.dome * Math.pow(1 - Math.pow(q, 2.3), 0.85) + sh.umbo * Math.exp(-(r / sh.umboR) * (r / sh.umboR)); };
  sh.thick = (r) => 0.5 * S + 1.9 * S * (1 - Math.pow(Math.min(r / sh.Rc, 1), 1.5));
  sh.underY = (r) => sh.topY(r) - sh.thick(r);
  sh.depth = (r) => 2.5 * S * sstep(sh.rIn, sh.rIn + 2.6 * S, r) * (1 - 0.86 * Math.pow(sstep(sh.Rc * 0.6, sh.Rc, r), 1.4));
  sh.edgeY = (r) => sh.underY(r) - sh.depth(r);
  // stalk centre line (hero space) and radius
  sh.axis = (y) => { const q = Math.max(y, 0) / sh.stalkTop, o = sh.lean * q * q; return [Math.cos(sh.leanDir) * o, Math.sin(sh.leanDir) * o]; };
  sh.stalkRad = (y) => {
    const base = mixn(sh.stalkR, sh.stalkR * 0.84, Math.min(1, Math.max(0, y / sh.stalkTop)));
    const bulb = (sh.bulbR - sh.stalkR) * Math.exp(-Math.pow(Math.max(y - 0.6, 0) / (3.1 * S), 2)) * sstep(-1.2, 0.8, y);
    const fl = sstep(sh.stalkTop - 3.5 * S, sh.stalkTop, y);
    return (base + bulb + 0.75 * S * fl * fl) * (y < 0 ? 0.9 + 0.1 * sstep(-1.2, 0, y) : 1);
  };
  return sh;
}

function buildStalk(ctx, sh, noise, C) {
  const y0 = -1.2, y1 = sh.stalkTop;
  return gridGeoAsync(ctx, 40, 92, true, (u, v, o) => {
    const th = u * TAU, y = mixn(y0, y1, Math.pow(v, 0.92));
    const ax = sh.axis(y), cs = Math.cos(th), sn = Math.sin(th);
    let r = sh.stalkRad(y);
    r *= 1 + 0.035 * noise.fbm3(cs * 1.3, y * 0.22, sn * 1.3 + sh.seed, 3) + 0.012 * noise.n3(cs * 5, y * 1.3, sn * 5);
    o.p[0] = ax[0] + cs * r; o.p[1] = y; o.p[2] = ax[1] + sn * r;
    o.c[0] = C.cream.r; o.c[1] = C.cream.g; o.c[2] = C.cream.b;
    o.a[0] = v; o.a[1] = u;
  });
}

// loose double ring: two ruffled felt flanges, slipped a little askew
function buildRing(sh, rng, noise, C) {
  const prof = [[0.0, 1.0, 0], [0.22, 0.8, 0], [0.9, 1.0, 0.2], [1.8, 1.35, 0.9], [2.05, 1.2, 1], [1.25, 0.6, 0.35], [0.72, 0.15, 0.1],
    [1.3, -0.3, 0.3], [2.2, -0.8, 0.9], [2.3, -1.08, 1], [1.45, -0.78, 0.5], [0.55, -0.62, 0.15], [0.0, -0.95, 0]];
  const p1 = rng.range(0, TAU), p2 = rng.range(0, TAU), tx = rng.range(-0.12, 0.12), tz = rng.range(-0.12, 0.12);
  const k1 = rng.int(6, 9), k2 = rng.int(11, 15), S = sh.S;
  const rs = sh.stalkRad(sh.ringY) - 0.06, ax = sh.axis(sh.ringY);
  const n = prof.length - 1;
  return gridGeo(64, n * 2, true, (u, v, o) => {
    const th = u * TAU, f = v * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
    const a = prof[i], b = prof[i + 1];
    const tip = mixn(a[2], b[2], t);
    let dr = mixn(a[0], b[0], t) * S, dy = mixn(a[1], b[1], t) * S;
    const ruff = 0.06 * Math.sin(th * k1 + p1) + 0.05 * Math.sin(th * k2 + p2) + 0.16 * noise.n2(Math.cos(th) * 1.9 + sh.seed, Math.sin(th) * 1.9) + 0.05 * noise.n2(Math.cos(th) * 6 + 3, Math.sin(th) * 6);
    dr *= 1 + ruff * tip; dy += tip * S * (0.12 * Math.sin(th * (k1 - 2) + p2) + 0.07 * Math.sin(th * k2 + p1) + 0.2 * noise.n2(Math.cos(th) * 1.4 + 9, Math.sin(th) * 1.4 + sh.seed));
    const r = rs + dr, x = Math.cos(th) * r, z = Math.sin(th) * r;
    o.p[0] = ax[0] + x; o.p[1] = sh.ringY + dy + (x * tx + z * tz) * (0.4 + tip); o.p[2] = ax[1] + z;
    const m = tip * tip * tip * 0.8, under = 0;
    o.c[0] = mixn(C.cream.r * 0.9, C.umber.r * 1.3, m * 0.75 + under); o.c[1] = mixn(C.cream.g * 0.86, C.umber.g * 1.3, m * 0.75 + under); o.c[2] = mixn(C.cream.b * 0.8, C.umber.b * 1.3, m * 0.75 + under);
    o.a[0] = 0.5 + 0.5 * tip; o.a[1] = tip * 0.9;
  });
}

// cap top with rolled lip (KIND 1), in cap space
function buildCapTop(ctx, sh, noise) {
  const nDome = 30, nLip = 5, nv = nDome + nLip, lipR = 0.3 * sh.S;
  return gridGeoAsync(ctx, 112, nv, true, (u, v, o, i, j) => {
    const th = u * TAU; let r, y;
    if (j <= nDome) { r = sh.Rc * Math.pow(j / nDome, 0.85); y = sh.topY(r); }
    else { const ph = ((j - nDome) / nLip) * Math.PI * 0.95; r = sh.Rc + lipR * Math.sin(ph) * 0.9; y = sh.topY(sh.Rc) - lipR * (1 - Math.cos(ph)); }
    const cs = Math.cos(th), sn = Math.sin(th), q = r / sh.Rc;
    // shaggy relief and a gently scalloped margin
    y += sh.waveAt(r, th) + 0.11 * noise.n3(cs * r * 0.9, sn * r * 0.9, sh.seed) * Math.min(1, r * 0.4);
    const rr = r * (1 + 0.012 * q * q * Math.sin(th * 9 + sh.wave[1]) + 0.008 * q * q * noise.n2(th * 6, sh.seed));
    o.p[0] = cs * rr; o.p[1] = y; o.p[2] = sn * rr;
    o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = q; o.a[1] = u;
  });
}

// flesh between the gills (KIND 3)
function buildUnderside(sh, C) {
  return gridGeo(56, 6, true, (u, v, o) => {
    const th = u * TAU, r = mixn(sh.stalkR * 0.9, sh.Rc + 0.05, v);
    o.p[0] = Math.cos(th) * r; o.p[1] = sh.underY(r) + sh.waveAt(r, th) + 0.02; o.p[2] = Math.sin(th) * r;
    o.c[0] = C.cream.r * 0.8; o.c[1] = C.cream.g * 0.72; o.c[2] = C.cream.b * 0.62;
    o.a[0] = 0.15 + 0.5 * (1 - sstep(0, 0.25, v)); o.a[1] = 0.2;
  });
}

// one wedge gill (KIND 2): x = radius, y = height, z = tangential. rA..rB radial span, wK = share of the slot.
function buildBlade(sh, rA, rB, ns, wK, short) {
  const slot = Math.PI / sh.NG;
  return gridGeo(ns, 3, false, (u, v, o, i, j) => {
    const r = mixn(rA, rB, u);
    let d = sh.depth(r);
    if (short) d *= sstep(rA, rA + 2.2, r) * 0.82;
    const top = sh.underY(r) + 0.12, bot = sh.underY(r) - d;
    const crowd = short ? 1 : mixn(0.86, 0.5, sstep(sh.Rc * 0.42, sh.Rc * 0.56, r));   // makes room for the short gills
    const w = slot * r * wK * crowd * Math.min(1, d / 0.8 + 0.15);
    const z = j === 0 ? w : j === 1 ? 0.04 : j === 2 ? -0.04 : -w;
    o.p[0] = r; o.p[1] = (j === 0 || j === 3) ? top : bot; o.p[2] = z;
    o.c[0] = o.c[1] = o.c[2] = 1;
    o.a[0] = (j === 0 || j === 3) ? 0 : 1; o.a[1] = r / sh.Rc;
  });
}

// a curled, shaggy scale flap (KIND 4): attached along z = 0, free tip lifted
function buildFlap(C) {
  return gridGeo(3, 2, false, (u, v, o) => {
    const x = (u - 0.5) * (1 - 0.55 * v * v);
    o.p[0] = x * 1.25; o.p[1] = 0.03 + 0.2 * v * v * v + 0.1 * (0.25 - x * x) * (1 - v) + 0.05 * Math.sin(u * 9.4) * v; o.p[2] = v * 0.95 - 0.3;
    const t = v * v;
    o.c[0] = mixn(C.umber.r * 0.95, C.copper.r * 0.9, t); o.c[1] = mixn(C.umber.g * 0.95, C.copper.g * 0.9, t); o.c[2] = mixn(C.umber.b * 0.95, C.copper.b * 0.85, t);
    o.a[0] = u; o.a[1] = v;
  });
}

// a beech leaf (KIND 6): x along the midrib (-0.5..0.5), toothed ovate outline, curled, keeled
export function buildLeaf() {
  return gridGeo(12, 6, false, (u, v, o) => {
    const s = u, t = (v - 0.5) * 2;
    const wid = 0.33 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.75) * (1 + 0.035 * Math.sin(s * 44));
    const x = s - 0.5, z = t * wid;
    o.p[0] = x; o.p[2] = z;
    o.p[1] = 0.10 * Math.abs(t) * wid * 3 + 0.16 * x * x - 0.05 * Math.sin(s * 9) * Math.abs(t) + 0.02 * Math.sin(s * 22 + t * 3) * t;
    o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = s; o.a[1] = t * wid * 3;
  });
}

// mossy hummock the stalk rises from (KIND 5)
function buildMound(sh, noise) {
  return gridGeo(72, 14, true, (u, v, o) => {
    const th = u * TAU, r = mixn(sh.stalkR * 0.9, 15.5, Math.pow(v, 1.25));
    const cs = Math.cos(th), sn = Math.sin(th), x = cs * r, z = sn * r;
    const far = sstep(9, 15.5, r);
    let y = 1.25 * Math.exp(-(r / 4.4) * (r / 4.4)) + (0.32 * noise.fbm2(x * 0.22 + sh.seed, z * 0.22, 3) + 0.1 * noise.n2(x * 0.9, z * 0.9)) * (1 - far) * Math.min(1, r / 3);
    y = y * (1 - far) - 0.55 * far;
    o.p[0] = x; o.p[1] = y; o.p[2] = z;
    o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = r / 15.5; o.a[1] = u;
  });
}

// ---------------------------------------------------------------- variations
const HOURS = {
  afternoon: { el: 17, side: -1, sun: null, sunI: 2.0, sky: null, skyI: 0.52, ground: 0.2, shaft: 0.16 },
  dawn: { el: 12, side: 1, sun: '#FFB9A6', sunI: 1.5, sky: '#E6E2E0', skyI: 0.68, ground: 0.2, shaft: 0.26 },
  day: { el: 34, side: -1, sun: '#E9EEF2', sunI: 1.0, sky: '#DCE2DC', skyI: 0.8, ground: 0.24, shaft: 0.1 },
  night: { el: 24, side: -1, sun: '#9DB6FF', sunI: 1.35, sky: '#40507C', skyI: 0.36, ground: 0.06, shaft: 0.16 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('spore-rain-hero') : ctx.rng;
  const noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const C = { copper: pal[0], umber: pal[1], moss: pal[2], pearl: pal[3], cream: pal[4], gold: pal[5], scarlet: pal[6] || new THREE.Color('#D8281C') };
  const hourName = HOURS[opts.hour] ? opts.hour : 'afternoon';
  const hour = HOURS[hourName];
  const weather = opts.weather === 'shower' || opts.weather === 'frost' ? opts.weather : 'drip';
  const season = opts.season === 'early' || opts.season === 'late' ? opts.season : 'october';

  const sh = makeShape(rng, noise);
  const root = new THREE.Group(); root.name = 'spore-rain-parasol';

  // ---- light state shared by every material
  const el = THREE.MathUtils.degToRad(hour.el);
  const sunDir = opts.sunDir ? new THREE.Vector3().copy(opts.sunDir).normalize()
    : new THREE.Vector3(hour.side * Math.cos(el), Math.sin(el), hourName === 'afternoon' ? 0 : 0.12).normalize();
  const sunCol = (hour.sun ? new THREE.Color(hour.sun) : C.gold.clone()).multiplyScalar(hour.sunI);
  const skyCol = (hour.sky ? new THREE.Color(hour.sky) : C.pearl.clone()).multiplyScalar(hour.skyI);
  const groundCol = (hourName === 'night' ? new THREE.Color('#222f4c') : C.copper.clone().lerp(skyCol.clone().multiplyScalar(1 / hour.skyI), 0.55)).multiplyScalar(hourName === 'night' ? 1 : hour.ground * 2.1);
  const shaft = { point: new THREE.Vector3(0, 15, 9), dir: sunDir, radius: 22.5, sway: 1.5 };

  // cap frame: pivot on the leaning axis at rim height, tilted along the lean
  const pv = sh.axis(sh.rimY);
  const tilt = Math.atan(2 * sh.lean * sh.rimY / (sh.stalkTop * sh.stalkTop)) * 1.3 + rng.range(-0.015, 0.03);
  const capM = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.sin(sh.leanDir), 0, -Math.cos(sh.leanDir)), tilt);
  capM.setPosition(pv[0], sh.rimY, pv[1]);
  const ident = new THREE.Matrix4();
  const capN = new THREE.Vector3(0, 1, 0).transformDirection(capM);
  const capC = new THREE.Vector3(0, 0.6, 0).applyMatrix4(capM);

  // how warm the sun is in this look (1 afternoon gold and dawn rose, 0 the day's silver and the moon): the glitter's tint
  const sunWarm = Math.min(1, Math.max(0, (sunCol.r - sunCol.b) / Math.max(sunCol.r, 1e-3) * 2.5));
  const U = {
    uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol },
    uGroundCol: { value: groundCol }, uShaftP: { value: shaft.point.clone() }, uShaftR: { value: shaft.radius }, uCoreR: { value: shaft.radius },
    uCapC: { value: capC }, uCapN: { value: capN }, uCapR: { value: sh.Rc + 0.3 }, uDomeH: { value: sh.dome }, uCamL: { value: new THREE.Vector3(0, 10, 80) },
    uWet: { value: weather === 'frost' ? 0.45 : weather === 'shower' ? 1.25 : 1 }, uFrost: { value: weather === 'frost' ? 1 : 0 },
    uSway: { value: new THREE.Vector3() }, uWave: { value: new THREE.Vector3(sh.wave[0], sh.wave[1], sh.wave[2]) },
    uCapRad: { value: sh.Rc }, uRingY: { value: sh.ringY }, uSeed: { value: sh.seed },
    uLitter: { value: season === 'early' ? 0.8 : season === 'late' ? 0 : 0.3 }, uProgress: { value: -1 }, uFogK: { value: 1 },
    uGlitR: { value: shaft.radius }, uGlitTint: { value: hourName === 'night' ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(1.05, 0.95, 0.76).lerp(new THREE.Vector3(1.12, 0.86, 0.45), sunWarm) },
    cCopper: { value: C.copper }, cUmber: { value: C.umber }, cMoss: { value: C.moss }, cPearl: { value: C.pearl },
    cCream: { value: C.cream }, cGold: { value: C.gold },
  };
  const mats = [];
  const withFog = (extra) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra });
  const surf = (kind, part) => {
    const m = new THREE.ShaderMaterial({
      defines: { KIND: kind }, uniforms: withFog({ uPart: { value: part } }),
      vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, fog: true, side: THREE.DoubleSide,
    });
    mats.push(m); return m;
  };
  const add = (mesh, name) => { mesh.name = name; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; root.add(mesh); return mesh; };

  // ---- stalk, ring, mound
  add(new THREE.Mesh(await buildStalk(ctx, sh, noise, C), surf(0, ident)), 'stalk');
  await ctx.yield?.();
  add(new THREE.Mesh(buildRing(sh, rng, noise, C), surf(3, ident)), 'ring');
  await ctx.yield?.();
  add(new THREE.Mesh(buildMound(sh, noise), surf(5, ident)), 'mound');
  await ctx.yield?.();

  // ---- cap: top, flesh, 200 long gills + 200 short ones
  add(new THREE.Mesh(await buildCapTop(ctx, sh, noise), surf(1, capM)), 'cap');
  add(new THREE.Mesh(buildUnderside(sh, C), surf(3, capM)), 'flesh');
  await ctx.yield?.();
  const gillMat = surf(2, capM);
  const slot = TAU / sh.NG, bladeTh = new Float32Array(sh.NG);
  const mtx = new THREE.Matrix4(), v3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3();
  const longG = new THREE.InstancedMesh(buildBlade(sh, sh.rIn, sh.Rc - 0.22, 14, 0.9, false), gillMat, sh.NG);
  const shortG = new THREE.InstancedMesh(buildBlade(sh, sh.Rc * 0.5, sh.Rc - 0.22, 8, 0.4, true), gillMat, sh.NG);
  for (let i = 0; i < sh.NG; i++) {
    const th = (i + rng.range(-0.07, 0.07)) * slot; bladeTh[i] = th;
    longG.setMatrixAt(i, mtx.makeRotationY(-th));
    shortG.setMatrixAt(i, mtx.makeRotationY(-(th + slot * (0.5 + rng.range(-0.06, 0.06)))));
  }
  add(longG, 'gills'); add(shortG, 'gills-short');
  const lod = [[shortG, 230]];            // [mesh, distance from the cap beyond which it is not drawn]
  await ctx.yield?.();

  // ---- shaggy scale flaps, seated on the same polar cells the cap shader paints
  {
    const cells = [];
    const ringW = 1.02, nR = Math.floor(sh.Rc / ringW);
    for (let ri = 3; ri < nR; ri++) {
      const rc = (ri + 0.5) * ringW, nC = Math.max(Math.floor(TAU * rc / 1.3), 3), rn = rc / sh.Rc;
      for (let ci = 0; ci < nC; ci++) {
        if (!rng.chance(mixn(0.95, 0.5, rn))) continue;
        cells.push([rc, ((ci + 0.5 - 0.5 * (ri % 2)) / nC - 0.5) * TAU, rn]);
      }
    }
    const flaps = new THREE.InstancedMesh(buildFlap(C), surf(4, capM), cells.length);
    const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), col = new THREE.Color();
    cells.forEach(([rc, th, rn], i) => {
      const r = rc + rng.range(-0.12, 0.12), cs = Math.cos(th), sn = Math.sin(th);
      const slope = (sh.topY(r + 0.3) - sh.topY(r - 0.3)) / 0.6;
      Z.set(cs, slope, sn).normalize(); X.set(sn, 0, -cs); Y.crossVectors(Z, X).normalize();
      const s = mixn(1.5, 0.62, sstep(0.15, 1, rn)) * rng.range(0.75, 1.25) * sh.S;
      mtx.makeBasis(X, Y, Z);
      mtx.multiply(new THREE.Matrix4().makeRotationY(rng.range(-0.3, 0.3)));
      mtx.scale(s3.set(s, s * rng.range(0.5, 1.15), s));
      mtx.setPosition(cs * r, sh.topY(r) + sh.waveAt(r, th) + 0.01, sn * r);
      flaps.setMatrixAt(i, mtx);
      const k = rng.range(0.75, 1.25); flaps.setColorAt(i, col.setRGB(k, k * rng.range(0.92, 1.05), k * rng.range(0.85, 1)));
    });
    add(flaps, 'scales'); lod.push([flaps, 270]);
  }
  await ctx.yield?.();

  // ---- water: beads on every gill edge, drops on the cap, drips swelling and letting go at the rim
  const rimDrip = new THREE.Vector3();
  if (weather !== 'frost') {
    const nGill = Math.round(950 * detail), nTop = Math.round(260 * detail), nLip = weather === 'shower' ? 90 : 44, nStage = 10;
    const n = nGill + nTop + nLip + nStage;
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const iB = new Float32Array(n * 4);
    const mat = new THREE.ShaderMaterial({ uniforms: withFog({}), vertexShader: BEAD_VERT, fragmentShader: BEAD_FRAG, fog: true });
    mats.push(mat);
    const beads = new THREE.InstancedMesh(geo, mat, n);
    const dripShare = weather === 'shower' ? 0.45 : 0.12;
    const put = (i, r, th, yCap, rad, kind, phase) => {
      v3.set(Math.cos(th) * r, yCap, Math.sin(th) * r).applyMatrix4(capM);
      mtx.makeScale(rad, rad, rad).setPosition(v3);
      beads.setMatrixAt(i, mtx);
      iB[i * 4] = phase; iB[i * 4 + 1] = kind; iB[i * 4 + 2] = Math.max(v3.y - 0.3, 1);
      iB[i * 4 + 3] = weather === 'shower' ? rng.range(2.5, 6) : rng.range(7, 16);
      return v3;
    };
    let k = 0;
    for (let i = 0; i < nGill; i++) {
      const th = bladeTh[rng.int(0, sh.NG - 1)], r = mixn(sh.rIn + 1.6, sh.Rc - 0.5, Math.sqrt(rng()));
      const rad = rng.range(0.09, 0.21) * (rng.chance(0.12) ? 1.5 : 1);
      put(k++, r, th, sh.edgeY(r) + sh.waveAt(r, th) - rad * 0.5, rad, rng.chance(dripShare) ? 1 : 0, rng());
    }
    for (let i = 0; i < nTop; i++) {
      const th = rng.range(0, TAU), r = sh.Rc * Math.sqrt(rng.range(0.02, 0.98));
      const rad = rng.range(0.14, 0.4);
      put(k++, r, th, sh.topY(r) + sh.waveAt(r, th) + rad * 0.45, rad, 0, rng());
    }
    for (let i = 0; i < nLip; i++) {
      const th = rng.range(0, TAU), r = sh.Rc + 0.1, rad = rng.range(0.32, 0.46);
      put(k++, r, th, sh.topY(sh.Rc) + sh.waveAt(r, th) - 0.6 * sh.S - rad * 0.4, rad, 1, rng());
    }
    // staged drips: along the rim over the camera's line, sun side round to the back (left of the pass)
    for (let i = 0; i < nStage; i++) {
      const th = Math.PI * mixn(0.92, 1.55, i / (nStage - 1)) + rng.range(-0.04, 0.04), r = sh.Rc + 0.1, rad = rng.range(0.42, 0.48);
      const p = put(k++, r, th, sh.topY(sh.Rc) + sh.waveAt(r, th) - 0.6 * sh.S - rad * 0.4, rad, 2, 0.12 + 0.075 * i + rng.range(-0.02, 0.02));
      if (i === 4) rimDrip.copy(p).setY(1.9);
    }
    geo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    add(beads, 'water'); lod.push([beads, 125]);
  } else rimDrip.set(-sh.Rc, 1.9, -4);
  await ctx.yield?.();

  // ---- spores: the curtain and the rim eddy
  const nSpore = Math.round(9000 * detail * (weather === 'frost' ? 1.25 : 1));
  const sporeU = withFog({
    uPart: { value: capM }, uPx: { value: 900 }, uFall: { value: weather === 'shower' ? 1.5 : weather === 'frost' ? 0.32 : 0.6 },
    uArrive: { value: 0.35 }, uThick: { value: weather === 'frost' ? 1.7 : 1 }, uGroundDrop: { value: sh.rimY },
    uGlitR: U.uGlitR, uGlitTint: U.uGlitTint,
  });
  {
    const aS = new Float32Array(nSpore * 4);
    for (let i = 0; i < aS.length; i++) aS[i] = rng();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nSpore * 3), 3));
    g.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: sporeU, vertexShader: SPORE_VERT, fragmentShader: SPORE_FRAG, fog: true, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    mats.push(m);
    const pts = add(new THREE.Points(g, m), 'spores'); pts.renderOrder = 3;
    // the glitter (a stream of its own, made from the world's seed and its name: the part's stream is left as it was)
    {
      const nG = Math.round(4200 * detail), gS = new Float32Array(nG * 4);
      const rg = makeRng(hashSeed('spore-rain-glitter:' + ctx.seed));
      for (let i = 0; i < gS.length; i++) gS[i] = rg();
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nG * 3), 3));
      gg.setAttribute('aS', new THREE.BufferAttribute(gS, 4));
      const gm = new THREE.ShaderMaterial({
        uniforms: sporeU, vertexShader: GLIT_VERT, fragmentShader: SPORE_FRAG, fog: true, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      });
      mats.push(gm);
      const glit = add(new THREE.Points(gg, gm), 'spore-glitter'); glit.renderOrder = 3; glit.frustumCulled = false;
    }
  }
  await ctx.yield?.();

  // ---- the visible shaft: one soft slanting bar, cut by the cap's shadow
  const shaftM = new THREE.Matrix4();
  let shaftMesh = null;
  if (opts.shaft !== false) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, uPart: { value: shaftM }, uStrength: { value: hour.shaft } }, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG,
      side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    mats.push(m);
    shaftMesh = add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 28, 1, true), m), 'shaft'); shaftMesh.renderOrder = 4;
  }

  // ---- beech leaves 12 m long, lying on the hummock on the side the camera does not cross
  {
    const tones = season === 'early' ? ['#C9B13A', '#9AA83A', '#B5622B', '#D9C25A'] : season === 'late' ? ['#4A2A18', '#5A2E17', '#6B3A1C', '#3A2114']
      : ['#B5622B', '#9A4A1E', '#C87A34', '#7A3A18'];
    const tc = tones.map((h, i) => (i === 0 && season === 'october' ? C.copper.clone() : new THREE.Color(h)));
    const nLeaf = rng.int(6, 8);
    const leaves = new THREE.InstancedMesh(buildLeaf(), surf(6, ident), nLeaf);
    const e = new THREE.Euler(), col = new THREE.Color();
    for (let i = 0; i < nLeaf; i++) {
      const th = THREE.MathUtils.degToRad(mixn(-35, 105, (i + rng.range(0.1, 0.9)) / nLeaf));
      const leanOn = i === 0;                              // one leaf leans on the bulb
      const r = leanOn ? 4.6 : rng.range(7.5, 11.5), len = rng.range(10, 13);
      e.set(rng.range(-0.1, 0.1), rng.range(0, TAU), leanOn ? 0 : rng.range(-0.07, 0.07), 'YXZ');
      if (leanOn) { e.y = -th; e.z = 0.62; }
      q4.setFromEuler(e);
      v3.set(Math.cos(th) * r, leanOn ? 3.4 : 0.35 + 0.5 * Math.exp(-(r / 4.4) * (r / 4.4)) + i * 0.06, Math.sin(th) * r);
      leaves.setMatrixAt(i, mtx.compose(v3, q4, s3.set(len, len, len)));
      leaves.setColorAt(i, col.copy(rng.pick(tc)).multiplyScalar(rng.range(0.8, 1.1)));
    }
    add(leaves, 'leaves');
  }
  await ctx.yield?.();

  // ---- a young drumstick parasol beside the hero (most seeds)
  let siblingBase = null;
  if (opts.sibling ?? rng.chance(0.7)) {
    const th = THREE.MathUtils.degToRad(rng.range(20, 70)), r = rng.range(7.5, 9.5), hS = rng.range(8.5, 12), ld = th + rng.range(-0.5, 0.5), ln = rng.range(0.6, 1.4);
    siblingBase = new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r);
    const sm = new THREE.Matrix4().makeTranslation(siblingBase.x, 0.1, siblingBase.z);
    const axis = (y) => { const q = y / hS, o = ln * q * q; return [Math.cos(ld) * o, Math.sin(ld) * o]; };
    const sg = gridGeo(20, 30, true, (u, v, o) => {
      const a = u * TAU, y = mixn(-0.8, hS + 0.6, v), ax = axis(Math.max(y, 0));
      const rr = 0.72 * (1 - 0.16 * v) + 0.75 * Math.exp(-Math.pow(Math.max(y, 0) / 1.7, 2));
      o.p[0] = ax[0] + Math.cos(a) * rr; o.p[1] = y; o.p[2] = ax[1] + Math.sin(a) * rr;
      o.c[0] = C.cream.r; o.c[1] = C.cream.g; o.c[2] = C.cream.b; o.a[0] = v; o.a[1] = u;
    });
    add(new THREE.Mesh(sg, surf(0, sm)), 'sibling-stalk');
    await ctx.yield?.();
    const top = axis(hS), capR = rng.range(2.1, 2.6), capH = capR * rng.range(1.15, 1.4);
    const cg = gridGeo(30, 16, true, (u, v, o) => {
      const a = u * TAU, ph = v * Math.PI * 0.87, cs = Math.cos(a), sn = Math.sin(a);
      const rr = capR * Math.pow(Math.sin(ph), 0.85) * (1 + 0.03 * noise.n3(cs * 2, v * 4, sn * 2 + sh.seed));
      const y = hS + capH * 0.85 + capH * Math.cos(ph);
      o.p[0] = top[0] + cs * rr; o.p[1] = y; o.p[2] = top[1] + sn * rr;
      const crack = sstep(0.3, 0.75, v + 0.3 * noise.n3(cs * 3.3, v * 7, sn * 3.3 + 9));
      const band = 0.5 + 0.5 * Math.sin(v * 38 + 3 * noise.n2(a * 2, v * 3));
      const m = Math.min(1, crack * (0.55 + 0.6 * band));
      o.c[0] = mixn(C.umber.r * 1.1, C.cream.r * 0.92, m); o.c[1] = mixn(C.umber.g * 1.1, C.cream.g * 0.88, m); o.c[2] = mixn(C.umber.b * 1.1, C.cream.b * 0.8, m);
      o.a[0] = 1 - 0.6 * sstep(0.7, 1, v); o.a[1] = 0.1;
    });
    add(new THREE.Mesh(cg, surf(3, sm)), 'sibling-cap');
  }
  await ctx.yield?.();

  // ---- anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const flyThrough = [V(-7, 1.9, 44), V(-9.5, 1.9, 26), V(-10.5, 1.9, 12), V(-10.2, 1.9, 0), V(-7, 1.9, -8.6), V(0.5, 1.9, -13.6), V(9.5, 1.9, -19.8), V(22, 1.9, -33)];
  const outDir = flyThrough[7].clone().sub(flyThrough[6]).normalize();
  const hub = V(0, sh.edgeY(sh.rIn + 2.5) + 0.4, 0).applyMatrix4(capM);
  const perp = new THREE.Vector3();
  const curtainAt = (y) => { const dy = (y - shaft.point.y) * Math.abs(sunDir.x); return shaft.point.z - Math.sqrt(Math.max(shaft.radius * shaft.radius - dy * dy, 0)); };
  const anchors = {
    hub, flyThrough,
    curtainLine: { position: V(0, 12, curtainAt(12)), goldSide: V(0, 0, 1) },
    portalSeat: { position: flyThrough[7].clone().addScaledVector(outDir, 60).setY(7), facing: outDir.clone().negate() },
    viewpoints: { entry: V(0, 1.9, 300), arc: V(-8, 1.9, 150), vault: V(-10.2, 1.9, 2) },
    rimDrip, siblingBase,
  };

  // ---- per-frame
  const inv = new THREE.Matrix4(), size = new THREE.Vector2(), up = new THREE.Vector3(0, 1, 0), yq = new THREE.Quaternion();
  const swayDir = new THREE.Vector3(Math.cos(sh.leanDir + 1.1), 0, Math.sin(sh.leanDir + 1.1));
  let progress = -1;
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (camera) {
      inv.copy(root.matrixWorld).invert();
      U.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      // far off, the beads, the short gills and the scale flaps are smaller than a pixel: they are not drawn
      const dC = U.uCamL.value.distanceTo(capC);
      for (const e of lod) e[0].visible = dC < e[1];
    }
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); sporeU.uPx.value = size.y; }
    // the canopy sways and the shaft's edge slides a few metres
    U.uSunDir.value = shaft.dir; U.uShaftR.value = shaft.radius; U.uCoreR.value = Math.min(shaft.core || shaft.radius, shaft.radius);
    perp.crossVectors(shaft.dir, up); if (perp.lengthSq() < 1e-6) perp.set(0, 0, 1); perp.normalize();
    const sl = shaft.sway * (0.7 * Math.sin(time * 0.21) + 0.3 * Math.sin(time * 0.53 + 1.3));
    U.uShaftP.value.copy(shaft.point).addScaledVector(perp, sl);
    if (shaftMesh) {
      yq.setFromUnitVectors(up, shaft.dir);
      v3.copy(U.uShaftP.value).addScaledVector(shaft.dir, 45);
      shaftM.compose(v3, yq, s3.set(shaft.radius, 300, shaft.radius));
    }
    // a 36 m mushroom barely moves: a slow nod in the cool air
    U.uSway.value.copy(swayDir).multiplyScalar(0.16 * Math.sin(time * 0.43) + 0.06 * Math.sin(time * 1.13 + 2));
  }
  function setProgress(u) {
    progress = u;
    U.uProgress.value = u;
    sporeU.uArrive.value = 0.35 + 0.65 * sstep(0, 0.35, u) * (1 - sstep(0.8, 1, u));
  }
  update(0, 0, null);

  return {
    object: root, radius: sh.Rc + 1, height: sh.rimY + sh.dome + sh.umbo + 0.5, center: new THREE.Vector3(pv[0] * 0.5, sh.rimY * 0.62, pv[1] * 0.5),
    anchors, update, setProgress, uniforms: U, shaft, shape: { capRadius: sh.Rc, rimY: sh.rimY, ringY: sh.ringY, capMatrix: capM },
    get progress() { return progress; },
    dispose() {}, ground: true, groundY: -0.02,
  };
}
