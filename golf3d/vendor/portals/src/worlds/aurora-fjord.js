// AURORA FJORD: a polar-night glide down a mirror-still fjord under a sky-wide aurora, past a stilt hamlet,
// a pod of orcas and an avenue of blue icebergs to the Glacier Gate (src/parts/aurora-fjord.js).
//
// Layout: the hero sits at the world origin facing +Z; the camera flies from z ~ +965 toward -Z.
// True mirror by geometry: everything that reflects (sky dome, aurora ribbons, fjord walls, glacier, bergs,
// hamlet, far ridges, orcas) exists a second time y-flipped under the water plane, which is a translucent
// sheet (alpha 0.9 looking down -> 0.2 at grazing angles) drawn over the copies. Nothing real dips below y = 0.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import * as S from '../kit/structures.js';
import { buildHero } from '../parts/aurora-fjord.js';

const GLSL_N = /* glsl */`
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.875; }
// slow patches of aurora light sliding over the ground (shared by snow, floes and water)
float auroraPatch(vec2 xz, float t){ return 0.5 + 1.0 * vnoise(vec3(xz.x * 0.0042 + t * 0.013, xz.y * 0.0031 - t * 0.021, t * 0.027)); }
`;

// ---------- fjord walls: snow above black rock, lit by the aurora from above and a low moon ----------
const WALL_VERT = /* glsl */`
varying vec3 vP; varying vec3 vN;
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALL_FRAG = /* glsl */`
uniform float uTime, uBright, uPulse, uDetail;
uniform vec3 uLight, uSky, uSnow, uRock, uMoonDir, uMoonCol;
varying vec3 vP; varying vec3 vN;
#include <fog_pars_fragment>
${GLSL_N}
void main(){
  vec3 p = vP;
  vec3 N = normalize(vN);
  float mpp = max(max(length(dFdx(p)), length(dFdy(p))), 1e-4);
  float kd = clamp(1.25 - mpp * 0.4, 0.0, 1.0);
  vec3 bp = p * vec3(0.06, 0.1, 0.06);
  vec3 Ng = N;
  float n1 = vnoise(p * 0.011 + 3.0);
  float n2 = vnoise(p * vec3(0.23, 0.5, 0.23));
  float v0 = vnoise(bp);
  vec3 g = vec3(vnoise(bp + vec3(0.4, 0.0, 0.0)), vnoise(bp + vec3(0.0, 0.4, 0.0)), vnoise(bp + vec3(0.0, 0.0, 0.4))) - v0;
  // a broader bump too, so the lighting never follows the mesh triangles
  vec3 bq = p * vec3(0.017, 0.03, 0.017) + 7.0;
  float w0 = vnoise(bq);
  vec3 g2 = vec3(vnoise(bq + vec3(0.3, 0.0, 0.0)), vnoise(bq + vec3(0.0, 0.3, 0.0)), vnoise(bq + vec3(0.0, 0.0, 0.3))) - w0;
  g = (1.5 * kd) * g + 0.9 * g2;
  N = normalize(N - uDetail * (g - dot(g, N) * N));
  float up = N.y;
  // snow lies wherever the slope lets it, with ragged noisy edges; steep faces stay dark rock with snow in the cracks
  float snow = smoothstep(0.33, 0.6, mix(Ng.y, up, 0.6) + (n1 - 0.5) * 0.2 + (n2 - 0.5) * 0.25 + (w0 - 0.5) * 0.2);
  float strata = 0.5 + 0.5 * sin(p.y * 0.42 + n1 * 9.0 + n2 * 1.5);
  vec3 rock = uRock * (0.55 + 0.9 * strata * (0.35 + 0.65 * n2));
  // wind-packed drifts and sastrugi: long low ridges across the slope, strongest near the shore
  float sas = vnoise(vec3(p.x * 0.5 + p.z * 0.22, p.y * 0.9, p.z * 0.07 - p.x * 0.03));
  float drift = vnoise(vec3(p.x * 0.05, p.y * 0.08, p.z * 0.021) + 31.0);
  float snowAlb = 0.66 + 0.12 * v0 + (0.16 * (sas - 0.5) * kd + 0.2 * (drift - 0.5)) * (0.5 + 0.5 * smoothstep(120.0, 10.0, p.y));
  vec3 alb = mix(rock, uSnow * snowAlb, snow);
  // the aurora hangs over the fjord: light falls from above and from the water side, in slow sliding patches
  vec3 Lk = normalize(vec3(-sign(p.x) * 0.62, 0.74, -0.22));
  float key = clamp(dot(N, Lk) * 0.72 + 0.28, 0.0, 1.0);
  float ap = auroraPatch(p.xz, uTime);
  float open = 0.4 + 0.6 * smoothstep(0.0, 280.0, p.y);                  // the fjord floor sees less sky
  vec3 light = uLight * (0.2 + 0.8 * key * key) * ap * open * (0.72 + 0.28 * uPulse) + uSky * (0.55 + 0.6 * up);
  light += uMoonCol * max(dot(N, uMoonDir), 0.0);
  vec3 col = alb * light;
#ifndef MIRROR
  float sp = step(0.99, hash3(floor(p * 3.0))) * snow * clamp(1.0 - mpp * 6.0, 0.0, 1.0);
  col += uSnow * sp * 0.6 * (0.5 + 0.5 * sin(uTime * 3.0 + p.x * 9.0));
#endif
  gl_FragColor = vec4(col * uBright, 1.0);
  #include <fog_fragment>
}`;

// ---------- the water: a dark translucent sheet over the mirrored copies ----------
const WATER_VERT = /* glsl */`
varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform float uTime, uPulse;
uniform vec3 uBody, uSheen, uLight;
uniform vec4 uRing[6];            // x, z, radius, strength
uniform vec4 uLamp[5];            // xyz of a light above the water, w strength
uniform vec3 uLampCol[5];
varying vec3 vWorld;
#include <fog_pars_fragment>
${GLSL_N}
void main(){
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec2 q = vWorld.xz;
  float lod = 1.0 / (1.0 + dist * 0.012);
  float r1 = vnoise(vec3(q * vec2(0.8, 0.2) + vec2(uTime * 0.05, uTime * 0.02), uTime * 0.07));
  float r2 = vnoise(vec3(q * vec2(0.21, 0.05) - vec2(uTime * 0.02, 0.0), uTime * 0.03 + 5.0));
  float rip = (r1 - 0.5) * lod + (r2 - 0.5) * 0.6;
  // rings spreading from the orcas and the whale
  float ring = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 R = uRing[i];
    float d = length(q - R.xy), w = 0.7 + R.z * 0.06;
    float a = (d - R.z) / w, b = (d - R.z * 0.55) / w;
    ring += R.w * (exp(-a * a) + 0.5 * exp(-b * b));
  }
  float ndv = clamp(abs(V.y) + rip * 0.05, 0.0, 1.0);
  float a = mix(0.34, 0.9, smoothstep(0.0, 0.8, ndv));
  a = clamp(a + rip * 0.17 + ring * 0.5, 0.06, 0.96);
  vec3 body = uBody + uSheen * pow(1.0 - ndv, 4.0);
  // soft glints of aurora light on the slow ripples and on the ring crests
  body += uLight * (0.07 * smoothstep(0.22, 0.5, rip) * pow(1.0 - ndv, 2.0) + 0.5 * ring) * (0.7 + 0.3 * uPulse);
  // long reflections of the warm lights (and the portal): narrow in azimuth, stretched toward the eye
  vec3 streak = vec3(0.0);
  vec3 Rv = vec3(-V.x, V.y, -V.z);
  vec2 rh = normalize(Rv.xz);
  for (int i = 0; i < 5; i++) {
    vec4 L = uLamp[i];
    vec3 toL = L.xyz - vWorld;
    float d2 = dot(toL, toL);
    vec3 Ld = toL * inversesqrt(d2);
    vec2 lh = normalize(Ld.xz);
    float da = rh.x * lh.y - rh.y * lh.x + rip * 0.03;
    float de = (Ld.y - Rv.y) / (Ld.y + Rv.y + 0.01);
    float sa = (0.008 + 0.022 * abs(de)) * (i == 4 ? 3.2 : 1.0);
    float s = exp(-da * da / (sa * sa) - de * de * 2.6) * step(0.0, dot(rh, lh)) / (1.0 + d2 / 8100.0);
    streak += uLampCol[i] * (s * L.w);
  }
  streak *= 0.6 + 0.8 * r1;
  #ifdef USE_FOG
    float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    body = mix(body, fogColor, ff); streak *= 1.0 - ff;
  #endif
  gl_FragColor = vec4(body * a + streak, a);       // premultiplied: the mirror below shows through by (1 - a)
}`;

// ---------- pancake ice: instanced floes drifting and turning slowly on the mirror ----------
const FLOE_VERT = /* glsl */`
attribute vec4 aFloe;            // x, z, radius, seed
uniform float uTime;
varying vec3 vP; varying float vRim; varying float vSeed; varying vec2 vL;
#include <fog_pars_vertex>
void main(){
  float sd = aFloe.w, ang = sd * 40.0 + uTime * 0.02 * (sd - 0.5);
  float c = cos(ang), s = sin(ang);
  vec3 p = position;
  vRim = p.y; vSeed = sd; vL = p.xz;
  p.x *= 0.82 + 0.36 * fract(sd * 13.7);
  p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z) * aFloe.z;
  p.y = p.y * (0.6 + 0.4 * aFloe.z) + 0.012 * sin(uTime * 0.5 + sd * 50.0);
  vec2 drift = vec2(sin(uTime * 0.045 + sd * 31.0), cos(uTime * 0.038 + sd * 17.0)) * 1.4;
  vec3 wp = vec3(aFloe.x + drift.x + p.x, p.y + 0.02, aFloe.y + drift.y + p.z);
  vP = wp;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLOE_FRAG = /* glsl */`
uniform float uTime, uPulse;
uniform vec3 uLight, uSky, uSnow, uDeep;
varying vec3 vP; varying float vRim; varying float vSeed; varying vec2 vL;
#include <fog_pars_fragment>
${GLSL_N}
void main(){
  float n = fract(vSeed * 7.31);
  float r = length(vL);
  vec3 gp = vec3(vL * 5.0, vSeed * 40.0);
  float grain = vnoise(gp * 2.6), blot = vnoise(gp * 0.55 + 9.0);
  // a frosted, bumped-up rim around a greyer, wetter centre; slush at the very edge
  float rim = smoothstep(0.62, 0.88, r + (blot - 0.5) * 0.22) * (1.0 - 0.5 * smoothstep(0.98, 1.06, r));
  float cover = clamp(0.42 + 0.35 * n + 0.55 * rim + 0.3 * (blot - 0.5) + 0.22 * (grain - 0.5), 0.0, 1.0);
  vec3 alb = mix(uDeep, uSnow * 0.85, cover) * smoothstep(0.0, 0.07, vRim) * (0.86 + 0.28 * grain);
  vec3 light = uLight * auroraPatch(vP.xz, uTime) * (0.72 + 0.28 * uPulse) * (0.5 + 0.25 * rim) + uSky;
  gl_FragColor = vec4(alb * light, 1.0);
  #include <fog_fragment>
}`;

// ---------- orcas and the whale: wet black bodies, clipped at the waterline (uFlip = -1 for the mirror copy) ----------
const WHALE_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vW; varying vec3 vNw; varying vec3 vCol;
#include <fog_pars_vertex>
void main(){
  vCol = color;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vNw = mat3(modelMatrix) * normal;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WHALE_FRAG = /* glsl */`
uniform float uFlip, uBright, uPulse;
uniform vec3 uLight, uSky, uMoonDir, uMoonCol;
varying vec3 vW; varying vec3 vNw; varying vec3 vCol;
#include <fog_pars_fragment>
void main(){
  if (vW.y * uFlip < 0.0) discard;
  vec3 N = normalize(vNw); N.y *= uFlip;
  vec3 V = normalize(cameraPosition - vW); V.y *= uFlip;
  if (dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = reflect(-V, N);
  vec3 light = uLight * (0.72 + 0.28 * uPulse);
  vec3 col = vCol * (light * (0.45 + 0.55 * clamp(N.y, 0.0, 1.0)) + uSky);
  col += light * (0.012 + 0.03 * clamp(N.y, 0.0, 1.0) + 0.2 * pow(clamp(R.y, 0.0, 1.0), 24.0));     // a dull wet gleam along the back
  col += light * 1.5 * pow(1.0 - ndv, 3.0) * (1.0 - 0.8 * N.y * N.y);                             // wet rim on flanks and fin edges, not on the flat of the back
  col += uMoonCol * (pow(max(dot(R, uMoonDir), 0.0), 40.0) * 2.5 + 0.25 * max(dot(N, uMoonDir), 0.0));
  col += light * 0.17 * smoothstep(0.5, 3.2, vW.y * uFlip);             // tall fins and the raised fluke stand up into the aurora light
  float wl = 1.0 - smoothstep(0.0, 0.14, vW.y * uFlip);               // bright wet line where the body cuts the mirror
  col += light * wl * 0.7;
  gl_FragColor = vec4(col * uBright, 1.0);
  #include <fog_fragment>
}`;

// breath: a few soft sprites per animal, lit green from above
const BLOW_VERT = /* glsl */`
attribute vec4 aSeed;            // x: which animal, yzw: random
uniform vec4 uBlow[6];           // x, z, age (s, < 0 = none), heading
uniform float uScale;
varying float vA;
void main(){
  vec4 B = uBlow[int(aSeed.x + 0.5)];
  float t = B.z / 3.2;
  float live = step(0.0, B.z) * step(t, 1.0);
  float k = 1.0 - exp(-t * 3.0);
  vec2 fw = vec2(sin(B.w), cos(B.w));
  vec3 p = vec3(B.x, 0.35, B.y);
  float cone = 0.25 + 0.75 * aSeed.y;
  p.y += k * (6.4 + 5.0 * aSeed.z) * cone - t * t * 1.6;
  p.xz += fw * (-0.8 * k - 1.6 * t) + vec2(aSeed.w - 0.5, fract(aSeed.w * 7.3) - 0.5) * (0.5 + 2.6 * k) + vec2(0.9, 0.35) * t * 1.6;
  vA = live * smoothstep(0.0, 0.06, t) * pow(max(1.0 - t, 0.0), 1.6) * (0.5 + 0.5 * aSeed.z);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = live * clamp(uScale * (0.7 + 2.3 * k) * (0.6 + 0.8 * aSeed.y) / max(-mvPosition.z, 1.0), 1.0, 110.0);
}`;
const BLOW_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uBright;
varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(d));
  gl_FragColor = vec4(uColor * (a * a * vA * uBright), 1.0);
}`;

// mirrored sky: a cheap copy of the dome's gradient, stars and moon, drawn only below the horizon with the direction flipped
const MIRROR_SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position * vec3(1.0, -1.0, 1.0);
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww;
}`;
const MIRROR_SKY_FRAG = /* glsl */`
uniform vec3 uZen, uMid, uHor, uGreen, uMoonDir, uMoonCol;
uniform vec3 uP;                 // horizonPow, midPow, moon cos radius
uniform float uTime, uPulse;
varying vec3 vDir;
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main(){
  vec3 d = normalize(vDir);
  float inv = 1.0 - clamp(d.y, 0.0, 1.0);
  vec3 c = mix(mix(uZen, uMid, pow(inv, uP.y)), uHor, pow(inv, uP.x));
  vec3 q = d * 150.0, id = floor(q), f = fract(q) - 0.5;
  float h = hash3(id);
  c += vec3(0.75, 0.88, 1.0) * step(0.99, h) * smoothstep(0.32, 0.0, length(f)) * (0.5 + 0.5 * sin(uTime * 2.3 + h * 90.0)) * smoothstep(0.02, 0.25, d.y) * 1.4;
  c += uGreen * 0.05 * (0.7 + 0.3 * uPulse) * smoothstep(0.02, 0.5, d.y);        // the dome's faint aurora wash
  float md = dot(d, uMoonDir);
  c += uMoonCol * (0.3 * pow(max(md, 0.0), 30000.0) + 0.03 * pow(max(md, 0.0), 1500.0));
  gl_FragColor = vec4(c * 0.85, 1.0);
}`;

// ---------- aurora curtains: strips hung along the fjord axis, folded into S-curves in the vertex shader ----------
const AUR_VERT = /* glsl */`
uniform float uTime, uSpeed;
attribute vec4 aRib;             // u along the ribbon, v (0 hem .. 1 top), phase, fold amplitude (m)
attribute vec3 aDir;             // horizontal unit normal of the curtain (x, z) and arc length (m)
varying vec2 vUv; varying float vPh; varying vec3 vW; varying vec3 vTan;
void main(){
  float t = uTime * uSpeed, ph = aRib.z * 6.2831853, s = aDir.z;
  float fold = sin(s * 0.0105 + t * 0.16 + ph) + 0.55 * sin(s * 0.027 - t * 0.23 + ph * 2.1) + 0.3 * sin(s * 0.066 + t * 0.31 + ph * 3.3);
  vec3 p = position;
  float amp = aRib.w * (0.7 + 0.3 * aRib.y);
  float dfold = 0.0105 * cos(s * 0.0105 + t * 0.16 + ph) + 0.01485 * cos(s * 0.027 - t * 0.23 + ph * 2.1) + 0.0198 * cos(s * 0.066 + t * 0.31 + ph * 3.3);
  p.xz += aDir.xy * (fold * amp);
  p.y += sin(s * 0.006 + t * 0.1 + ph) * aRib.w * 0.3;
  vUv = aRib.xy; vPh = aRib.z;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vTan = vec3(-aDir.y + aDir.x * dfold * amp, 0.0, aDir.x + aDir.y * dfold * amp);      // tangent of the folded sheet
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const AUR_FRAG = /* glsl */`
uniform vec3 uColorA, uColorB, uColorC;
uniform float uTime, uSpeed, uRays, uIntensity, uEnds, uEdge, uFar;
varying vec2 vUv; varying float vPh; varying vec3 vW; varying vec3 vTan;
${GLSL_N}
void main(){
  float u = vUv.x, v = vUv.y, t = uTime * uSpeed, ph = vPh * 37.0;
  float n1 = vnoise(vec3(u * uRays + ph, t * 0.2, ph * 0.3));                    // rays
  float n2 = vnoise(vec3(u * uRays * 2.3 + ph * 2.0, v * 1.5 - t * 0.3, 1.0));   // fine shimmer running up them
  float n3 = vnoise(vec3(u * uRays * 0.21 - t * 0.05, ph, t * 0.04));            // hem height and ray length
  float slow = vnoise(vec3(u * 9.0 + t * 0.07 + ph, t * 0.03, 4.0));             // brightness travelling along the curtain
  float lo = 0.02 + 0.08 * n3 + 0.07 * n1;                                       // a ragged hem: each ray ends at its own height
  float bottom = smoothstep(lo * 0.15, lo + 0.13, v);
  float top = exp(-max(v - lo, 0.0) * (1.7 + 3.0 * n3)) * smoothstep(1.0, 0.7, v);
  float curtain = (0.42 + 0.66 * n1) * (0.8 + 0.2 * n2);                        // soft sheets, not bars
  float ends = smoothstep(0.0, uEnds, u) * smoothstep(1.0, 1.0 - uEnds, u);
  // a sheet seen along its own length stacks into a hard striped column: fade it there
  // (also where a fold turns end-on to the eye, so folds brighten softly instead of becoming bars)
  vec3 toP = vW - cameraPosition; float dCam = length(toP);
  float along = abs(dot(normalize(toP.xz + 1e-3), normalize(vTan.xz)));
  float edge = mix(uEdge, 1.0, smoothstep(0.0, 0.74, sqrt(max(1.0 - along * along, 0.0)))) * mix(1.0, uFar, smoothstep(600.0, 1700.0, dCam));
  float I = bottom * top * curtain * (0.35 + 0.65 * smoothstep(0.2, 0.7, slow)) * ends * edge;
  vec3 col = mix(uColorA, uColorB, smoothstep(0.22, 0.85, v + (n1 - 0.5) * 0.3));
  col = mix(uColorC, col, smoothstep(lo * 0.15, lo + 0.2, v));
  gl_FragColor = vec4(col * (I * uIntensity), 1.0);
}`;

// ---------- small geometry helpers ----------
function finish(P, C, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  if (C) g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

// a body of revolution along +Z (nose at +Z) with a dorsal fin; orca markings in vertex colour
function orcaGeometry(len, finH) {
  const P = [], C = [], I = [], NS = 18, NR = 14, R = len * 0.13;
  const black = [0.014, 0.017, 0.022], white = [0.5, 0.55, 0.58], grey = [0.06, 0.075, 0.09];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, z = (0.5 - t) * len;
    const r = R * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.75) * (1 - 0.25 * t) + 0.02;
    for (let j = 0; j < NR; j++) {
      const a = (j / NR) * Math.PI * 2, x = Math.sin(a) * r * 0.9, y = Math.cos(a) * r;
      P.push(x, y, z);
      const eye = t > 0.1 && t < 0.2 && Math.abs(Math.abs(a - Math.PI) - 2.2) < 0.36;     // white patch behind each eye
      const saddle = t > 0.5 && t < 0.66 && Math.cos(a) > 0.55;                               // grey saddle behind the fin
      const c = (Math.cos(a) < -0.82 && t < 0.72) ? white : eye ? white : saddle ? grey : black;      // white chin and belly, black tail stock
      C.push(c[0], c[1], c[2]);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
    const a = i * NR + j, b = i * NR + (j + 1) % NR, c = a + NR, d = b + NR;
    I.push(a, c, b, b, c, d);
  }
  // dorsal fin: a tall swept blade, two-sided thin wedge
  const f0 = P.length / 3, zf = len * 0.06, cl = len * 0.2, th = 0.07 * len / 7;
  const prof = [[0, 0, 0.5], [0.3, 0.42, 0.34], [0.62, 0.8, 0.2], [0.9, 1.0, 0.07]];     // back-sweep, height, chord (fractions)
  for (const [sw, h, ch] of prof) for (const sx of [-1, 1]) {
    const zc = zf - sw * cl * 0.9, y = R * 0.92 + h * finH;
    P.push(sx * th * (1 - h * 0.8), y, zc + ch * cl, sx * th * (1 - h * 0.8), y, zc - ch * cl);
    C.push(...black, ...black);
  }
  for (let k = 0; k < prof.length - 1; k++) {
    const a = f0 + k * 4, b = a + 4;
    I.push(a, b, a + 1, a + 1, b, b + 1, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);      // left and right faces
    I.push(a, a + 2, b, a + 2, b + 2, b, a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);      // leading and trailing edges
  }
  const top = f0 + (prof.length - 1) * 4; I.push(top, top + 2, top + 1, top + 1, top + 2, top + 3);
  return finish(P, C, I);
}

// a whale's tail stock rising along +Y from the origin with the flukes spread in X at the top
function flukeGeometry(span) {
  const P = [], C = [], I = [], dark = [0.02, 0.024, 0.03], pale = [0.07, 0.085, 0.1];
  const NS = 8, NR = 8, H = span * 0.9;
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, y = t * H, rx = lerp(span * 0.17, span * 0.035, Math.pow(t, 0.7)), rz = lerp(span * 0.24, span * 0.05, Math.pow(t, 0.6));
    for (let j = 0; j < NR; j++) { const a = (j / NR) * Math.PI * 2; P.push(Math.sin(a) * rx, y, Math.cos(a) * rz); C.push(...dark); }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
    const a = i * NR + j, b = i * NR + (j + 1) % NR, c = a + NR, d = b + NR;
    I.push(a, b, c, b, d, c);
  }
  // flukes: swept lobes with a centre notch, thin wedge section (front z+, back z-)
  const f0 = P.length / 3, NF = 7, th = span * 0.018;
  for (const sx of [-1, 1]) for (let k = 0; k <= NF; k++) {
    const t = k / NF, x = sx * t * span * 0.5;
    const lead = H + span * (0.02 + 0.2 * Math.sin(t * 1.9)), chord = span * (0.26 * (1 - Math.pow(t, 1.7)) + 0.02), trail = lead - chord + span * 0.07 * (1 - t) * (1 - t);
    for (const sz of [1, -1]) { const tk = th * (1 - t * 0.7); P.push(x, lead, sz * tk * 0.4, x, trail, sz * tk * 0.15); C.push(...(sz > 0 ? dark : pale), ...(sz > 0 ? dark : pale)); }
  }
  for (let s = 0; s < 2; s++) for (let k = 0; k < NF; k++) {
    const a = f0 + (s * (NF + 1) + k) * 4, b = a + 4;
    I.push(a, b, a + 1, a + 1, b, b + 1, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2, a, a + 2, b, a + 2, b + 2, b, a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);
  }
  return finish(P, C, I);
}

// one pancake of ice: low disc with the raised rim real pancake ice has
function floeGeometry() {
  const P = [0, 0.1, 0], I = [], n = 14;
  for (let q = 0; q < n; q++) {
    const a = (q / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), w = 1 + 0.1 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 5) + 0.045 * Math.sin(a * 8 + 2.2) + 0.03 * Math.sin(a * 11 + 0.7);
    P.push(c * 0.78 * w, 0.12, s * 0.78 * w, c * 0.95 * w, 0.2, s * 0.95 * w, c * 1.06 * w, 0.0, s * 1.06 * w);
  }
  for (let q = 0; q < n; q++) {
    const a = 1 + q * 3, b = 1 + ((q + 1) % n) * 3;
    I.push(0, b, a, a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, a + 2, b + 1, b + 2, a + 2);
  }
  return finish(P, null, I);
}

const PALETTES = {
  emerald: { green: '#3dffb0', violet: '#a25bff', fringe: '#ff6fa8', portal: '#d8c4ff', title: 'Aurora Fjord' },
  jade: { green: '#3fe0ff', violet: '#4a52ff', fringe: '#7fffe0', portal: '#c4dcff', title: 'Aurora Fjord' },          // cold cyan and indigo
  storm: { green: '#6aff8a', violet: '#ff3fd0', fringe: '#ff4f8a', portal: '#ffc8f0', title: 'Aurora Fjord' },         // a substorm: magenta upper fringes
};

export default {
  id: 'aurora-fjord',
  name: 'Aurora Fjord',
  category: 'wilderness',
  weirdness: 0.1,
  async build(ctx) {
    const R = ctx.rng, N = ctx.noise;
    const scene = new THREE.Scene();
    const tick = async () => { if (ctx.yield) await ctx.yield(); };
    const time = { value: 0 };
    const updaters = [];                      // (dt, t, camera, u) => void
    const trash = [];                         // things to dispose that the scene may not reach

    // ---------- per-seed character ----------
    const mood = R.pick(['emerald', 'jade', 'storm', 'emerald', 'jade', 'storm', 'emerald']);
    const PV = PALETTES[mood];
    const activity = mood === 'storm' ? R.range(1.6, 2.0) : mood === 'jade' ? R.range(0.6, 0.9) : R.range(0.8, 1.15);      // how fast and bright the aurora moves
    const hs = R.chance(0.6) ? 1 : -1;                                                // which shore the hamlet sits on (+1 = right)
    const avenueFar = R.pick([420, 470, 520]);                                        // how far the iceberg avenue reaches (and how many bergs)
    const snowfall = R.pick([0.6, 0.8, 1.0, 1.3, 1.6]);
    const mistK = R.range(0.75, 1.25);
    const hamletZ = R.range(728, 772);
    const orcaCount = R.int(3, 4);
    const moonAz = R.sign() * R.range(8, 25), moonEl = R.range(14, 24), moonPhase = R.range(0.07, 0.5);
    const palette = ['#020712', '#0e3842', PV.green, PV.violet, '#16324a', '#cfe9f5', '#ffb060'];
    const cGreen = new THREE.Color(PV.green), cViolet = new THREE.Color(PV.violet), cSnow = new THREE.Color('#cfe9f5');
    const white = new THREE.Color(1, 1, 1);
    const lightCol = cGreen.clone().lerp(white, 0.52).multiplyScalar(0.56);          // aurora key on snow and ice
    const skyAmb = new THREE.Color('#0a1a44').multiplyScalar(0.5);                  // cold sky fill

    // ---------- the hero: the Glacier Gate at the origin, facing +Z ----------
    const hero = await buildHero({ ...ctx, rng: R.fork('hero') }, { palette, mirror: true, water: false, avenueFar });
    scene.add(hero.object);
    hero.setAurora(PV.green, 1);
    const A = hero.anchors, seat = A.portalSeat.position;
    await tick();

    // ---------- the fjord: shoreline and wall height ----------
    const sOff = R.range(0, 500);
    const halfW = (z, s) => {
      const w = 126 + 13 * N.n2(z * 0.0042 + sOff, s * 3.1) + 5 * N.n2(z * 0.014, s * 8.3 + sOff);
      return lerp(lerp(98, 112, smoothstep(-70, 0, z)), w, smoothstep(0, 120, z));
    };
    const wallH = (s, d, z) => {
      if (d <= 0) return 0;
      const x = s * (halfW(z, s) + d);
      const big = N.fbm2(x * 0.0015 + 11 * s + sOff, z * 0.0015, 3);
      const rid = N.ridged2(x * 0.0034 + 5 + sOff, z * 0.0034 + s * 9, 4);
      const prof = 1 - Math.exp(-Math.pow(d / (235 + 60 * N.n2(z * 0.003 + sOff, s * 7)), 1.25));
      const rib = N.ridged2(z * 0.0105 + sOff, x * 0.0022 + s * 4, 3);                 // buttresses and gullies running down the slope
      let y = (440 + 120 * big) * prof * (0.62 + 0.36 * rid + 0.3 * rib);
      const stepH = 72, w = 0.8 * N.n2(x * 0.005, z * 0.005 + s * 3 + sOff), f = y / stepH + w, fl = Math.floor(f);
      const yT = stepH * (fl + smoothstep(0.3, 0.7, f - fl) - w);
      y = lerp(y, yT, 0.5 * smoothstep(0, 40, d));
      y += 7 * N.fbm2(x * 0.021, z * 0.021, 3) * smoothstep(0, 45, d);
      y += 55 * smoothstep(-15, -70, z) * smoothstep(0, 28, d);                        // shoulders that bury the glacier's flanks
      if (s === hs) {                                                                   // a gentle shelf behind the hamlet
        const k = Math.exp(-Math.pow((z - hamletZ) / 75, 2));
        y = y * lerp(1, smoothstep(0, 120, d), k) + k * 2.4 * smoothstep(0, 9, d);
      }
      return Math.max(y, 0.15 * Math.min(d, 4));
    };

    // ---------- camera path: entry low over the water, past the hamlet, toward the orcas, then the hero's avenue ----------
    const fly = A.flyThrough.map((p) => [p[0], Math.min(p[1], 7.2 + 6 * smoothstep(600, 380, p[2])), p[2]]);
    const ex = hs * R.range(-14, 4), hamX = hs * R.range(44, 54);
    const pts = [
      [ex, 5, 968], [ex + 3 * hs, 5, 905], [lerp(ex, hamX, 0.6), 5.2, 845], [hamX, 5.6, hamletZ + 6],
      [hamX * 0.45, 6, hamletZ - 72], [-6 * hs, 6.6, 652], [lerp(-6 * hs, fly[0][0], 0.6), 7, 612],
      ...fly,
    ];
    const path = makePath(pts);
    const pAt = (u) => path.posAtDist(u * path.length, new THREE.Vector3());
    const tAt = (u) => path.tangentAtDist(u * path.length, new THREE.Vector3());

    // ---------- sky: polar night, dome aurora turned down, thin crescent low on the left ----------
    const sky = makeSky({
      rng: R.fork('sky'), preset: 'polar', quality: 0.5, renderOrder: 1000, bake: !!ctx.renderer, renderer: ctx.renderer, aurora: 0.3, auroraColors: [PV.green, PV.violet], auroraSpeed: activity,
      stars: 1, starDensity: R.range(0.8, 1), milkyWay: R.range(0.45, 0.8), milkyAngle: R.range(0, 60),
      bodies: [{ elevation: moonEl, azimuth: moonAz, size: 1.5, phase: moonPhase, phaseAngle: R.range(-50, -20), intensity: 2.2, glow: 0.22, glowColor: '#a8c8ff', color: '#e8f1ff' }],
    });
    scene.add(sky.object);
    const moonDir = sky.bodyDirections[0] ? sky.bodyDirections[0].clone() : new THREE.Vector3(-0.2, 0.3, -0.93).normalize();
    const fogColor = new THREE.Color('#0a2a33').lerp(cGreen, 0.06).multiplyScalar(0.8);
    scene.fog = new THREE.FogExp2(fogColor, 0.0011 * mistK);
    scene.background = new THREE.Color('#020712');
    const rig = makeLightRig(sky, { intensity: 1.1, ambient: 0.7, bounce: 0.35 });
    scene.add(rig.object);
    rig.sun.color.copy(cGreen).lerp(white, 0.4);
    const sunBase = rig.sun.intensity;
    updaters.push((dt, t, cam) => { sky.update(dt, t, cam); rig.update(dt, t, cam); });

    // everything that reflects lives a second time in here, y-flipped about the waterline
    const mirror = new THREE.Group(); mirror.name = 'mirror'; mirror.scale.y = -1; scene.add(mirror);
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const uPulse = { value: 0.5 };

    {   // only the upper half of the dome is ever seen; the lower half is its (cheap) reflection under the water
      // (the cap lying in the horizon plane passes through the eye and rasterises as a stray sliver: drop it)
      const halfBox = (dy, capStart) => { const b = new THREE.BoxGeometry(2, 1, 2); b.translate(0, dy, 0); const ix = Array.from(b.index.array); ix.splice(capStart, 6); b.setIndex(ix); b.clearGroups(); return b; };
      const top = halfBox(0.5, 18);                      // faces: +x -x +y -y +z -z, six indices each
      sky.object.geometry.dispose(); sky.object.geometry = top;
      const g = halfBox(-0.5, 12);
      const so = sky.options || {};
      const m = new THREE.ShaderMaterial({
        name: 'MirrorSky', vertexShader: MIRROR_SKY_VERT, fragmentShader: MIRROR_SKY_FRAG, side: THREE.DoubleSide, depthWrite: false, depthTest: true, fog: false,
        uniforms: { uTime: time, uPulse, uZen: { value: sky.zenithColor.clone() }, uMid: { value: sky.uniforms.uMid ? sky.uniforms.uMid.value.clone() : sky.zenithColor.clone().lerp(sky.horizonColor, 0.4) },
          uHor: { value: sky.horizonColor.clone() }, uGreen: { value: cGreen.clone() }, uMoonDir: { value: moonDir.clone() }, uMoonCol: { value: new THREE.Color('#e8f1ff') },
          uP: { value: new THREE.Vector3(so.horizonPow ?? 3.4, so.midPow ?? 1.5, Math.cos(1.5 * Math.PI / 180)) } },
      });
      const ms = new THREE.Mesh(g, m); ms.name = 'sky-mirror'; ms.frustumCulled = false; ms.renderOrder = 1000; scene.add(ms);
    }

    // ---------- fjord walls (and their reflection) ----------
    const wallU = {
      uTime: time, uPulse, uLight: { value: lightCol.clone() }, uSky: { value: skyAmb.clone() },
      uSnow: { value: cSnow.clone() }, uRock: { value: new THREE.Color('#232e3a') },
      uMoonDir: { value: moonDir.clone() }, uMoonCol: { value: new THREE.Color('#9fc0ff').multiplyScalar(0.16) },
    };
    const wallMat = (bright, detail, defines) => new THREE.ShaderMaterial({
      uniforms: { ...wallU, uBright: { value: bright }, uDetail: { value: detail }, ...fogU() }, defines, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.DoubleSide,
    });
    const wMat = wallMat(1, 1, {}), wMatM = wallMat(0.5, 0.5, { MIRROR: 1 });       // the reflection: a soft dark mass, half the relief
    const Z0 = -520, Z1 = 1160, NZ = 260, NJ = 48, DMAX = 640;
    for (const s of [-1, 1]) {
      const P = new Float32Array((NZ + 1) * (NJ + 1) * 3), I = [];
      for (let i = 0; i <= NZ; i++) {
        if (i % 16 === 0) await tick();                                 // hand back every 16 rows (takes no draw)
        const z = lerp(Z0, Z1, i / NZ), hw = halfW(z, s);
        for (let j = 0; j <= NJ; j++) {
          const d = DMAX * Math.pow(j / NJ, 1.7), k = (i * (NJ + 1) + j) * 3;
          P[k] = s * (hw + d); P[k + 1] = wallH(s, d, z); P[k + 2] = z;
        }
      }
      for (let i = 0; i < NZ; i++) for (let j = 0; j < NJ; j++) {
        const a = i * (NJ + 1) + j, b = a + NJ + 1, c = b + 1, d = a + 1;
        if (s > 0) I.push(a, b, c, a, c, d); else I.push(a, c, b, a, d, c);
      }
      await tick();                                                     // the wall's normals (one three.js call) start on a fresh step
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
      const wall = new THREE.Mesh(g, wMat); wall.name = 'fjord-wall'; scene.add(wall);
      // the reflection: same vertices, every second row, every column (the slope profile keeps its full resolution)
      const I2 = [];
      for (let i = 0; i < NZ; i += 2) for (let j = 0; j < NJ; j++) {
        const a = i * (NJ + 1) + j, b = a + 2 * (NJ + 1), c = b + 1, d = a + 1;
        I2.push(a, b, c, a, c, d);
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', g.attributes.position); g2.setAttribute('normal', g.attributes.normal); g2.setIndex(I2); g2.boundingSphere = g.boundingSphere.clone();
      const wm = new THREE.Mesh(g2, wMatM); wm.name = 'fjord-wall-mirror'; mirror.add(wm);
      await tick();
    }

    // far peaks beyond the glacier (kit), and their reflection
    {
      const ro = { layers: 3, radius: [1900, 3300], height: [260, 560], base: 60, jagged: 0.75, coverage: 0.8,
        colorNear: '#070d14', haze: fogColor.clone().multiplyScalar(1.1), hazeNear: 0.2, hazeFar: 0.55, footHaze: 0.75,
        sunDir: [0.05, 0.96, 0.25], sunColor: cGreen.clone().lerp(white, 0.4), sunIntensity: 0.16, ambient: '#06121c', snow: '#cfe9f5', snowLine: 0.35, rim: 0 };
      const ridges = T.makeHorizonRidges({ ...ro, rng: makeRng(ctx.seed + 77) });
      scene.add(ridges.object);
      const rm = new THREE.Mesh(ridges.geometry, ridges.material); rm.frustumCulled = false; rm.position.y = 60; mirror.add(rm);
      updaters.push((dt, t, cam) => { ridges.update(dt, t, cam); rm.position.x = ridges.object.position.x; rm.position.z = ridges.object.position.z; });
    }

    // ---------- the aurora that matters: curtains hung in world space, each mirrored. One runs along the fjord axis;
    // the others cross the fjord diagonally so the camera sees them broadside, arching from wall to wall. ----------
    const ribbons = [];
    {
      const SEG = 260;
      const addCurtain = (k, line, hemAt, height, base, ends, edge, far = 1) => {
        const ph = R(), amp = k === 0 ? R.range(34, 58) : R.range(24, 38);
        const XZ = new Float32Array((SEG + 1) * 2), arc = new Float32Array(SEG + 1);
        for (let i = 0; i <= SEG; i++) {
          const q = line(i / SEG); XZ[i * 2] = q[0]; XZ[i * 2 + 1] = q[1];
          if (i > 0) arc[i] = arc[i - 1] + Math.hypot(q[0] - XZ[i * 2 - 2], q[1] - XZ[i * 2 - 1]);
        }
        const P = new Float32Array((SEG + 1) * 6), Q = new Float32Array((SEG + 1) * 8), D = new Float32Array((SEG + 1) * 6), I = [];
        for (let i = 0; i <= SEG; i++) {
          const u = i / SEG, i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, SEG);
          const tx = XZ[i1 * 2] - XZ[i0 * 2], tz = XZ[i1 * 2 + 1] - XZ[i0 * 2 + 1], tl = Math.hypot(tx, tz) || 1;
          const x = XZ[i * 2], z = XZ[i * 2 + 1], y = hemAt(u, x, z) * (1 + 0.1 * Math.sin(u * 5.1 + ph * 9));
          for (let j = 0; j < 2; j++) {
            const o = i * 2 + j;
            P[o * 3] = x; P[o * 3 + 1] = y + j * height; P[o * 3 + 2] = z;
            Q[o * 4] = u; Q[o * 4 + 1] = j; Q[o * 4 + 2] = ph; Q[o * 4 + 3] = amp;
            D[o * 3] = tz / tl; D[o * 3 + 1] = -tx / tl; D[o * 3 + 2] = arc[i];
          }
          if (i < SEG) { const q = i * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aRib', new THREE.BufferAttribute(Q, 4));
        g.setAttribute('aDir', new THREE.BufferAttribute(D, 3)); g.setIndex(I);
        const rays = arc[SEG] / R.range(55, 80);
        const mk = () => new THREE.ShaderMaterial({
          uniforms: { uTime: time, uSpeed: { value: activity }, uRays: { value: rays }, uIntensity: { value: base }, uEnds: { value: ends }, uEdge: { value: edge }, uFar: { value: far },
            uColorA: { value: cGreen.clone() }, uColorB: { value: cViolet.clone() }, uColorC: { value: new THREE.Color(PV.fringe) } },
          vertexShader: AUR_VERT, fragmentShader: AUR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
        });
        const m = mk(), mesh = new THREE.Mesh(g, m); mesh.name = 'aurora'; mesh.frustumCulled = false; mesh.renderOrder = 0; scene.add(mesh);
        const mm = mk(), mesh2 = new THREE.Mesh(g, mm); mesh2.frustumCulled = false; mesh2.renderOrder = 0; mirror.add(mesh2);
        ribbons.push({ m, mm, base, ph: R.range(0, 6.28) });
      };
      // the axial ribbon: overhead for the whole flight, converging on the glacier (dimmed where it is seen end-on)
      {
        const lane = R.range(-60, 60), alt = R.range(300, 400), off = R.range(0, 90);
        addCurtain(0, (u) => { const z = lerp(1560, -2300, u); return [lane + 80 * N.n2(z * 0.0011 + off, 7.3), z]; },
          () => alt, R.range(340, 420), 0.5 * R.range(0.85, 1.15), 0.1, 0.3, 0.5);
      }
      // broadside curtains: 25-40 degrees to the axis, alternating, from one wall top across the fjord to the other
      const centres = mood === 'storm' ? [520, 60, -420, -1250] : R.chance(0.5) ? [350, -300, -1200] : [430, -120, -700, -1300];
      let sg = R.sign();
      for (let k = 0; k < centres.length; k++) {
        const zc = centres[k] + R.range(-70, 70), th = R.range(25, 40) * Math.PI / 180, ct = 1 / Math.tan(th), off = R.range(0, 90);
        const hem = R.range(180, 250), dir = sg; sg = -sg;
        addCurtain(k + 1, (u) => { const x = lerp(-900, 900, u); return [x, zc - dir * x * ct + 110 * N.n2(x * 0.0013 + off, k * 5.1 + 2)]; },
          (u, x) => hem + 0.62 * Math.max(Math.abs(x) - 130, 0), R.range(350, 450), (mood === 'storm' ? 0.98 : 0.8) * R.range(0.85, 1.15), 0.25, 0.16);
      }
    }
    updaters.push((dt, t) => {
      for (const r of ribbons) {
        const k = r.base * (0.72 + 0.4 * uPulse.value + 0.12 * Math.sin(t * 0.21 * activity + r.ph));
        r.m.uniforms.uIntensity.value = k; r.mm.uniforms.uIntensity.value = k * 0.9;        // the water sheet already dims the copy
      }
    });
    await tick();

    // ---------- the hamlet: five stilt houses, a jetty with one lamp, a moored boat. The only warm light. ----------
    const lampPos = [], lampCol = [];                       // lights the water stretches into long reflections
    const warm = new THREE.Color('#ffb060');
    const mats = S.makeMaterials({ night: 1, lit: 1, glow: 4.2, warm: '#ffb060', halo: 1.1 });
    mats.setSky({ top: '#020712', horizon: '#0e3842', sun: PV.green, sunDir: [0, 1, 0] });
    const hr = R.fork('hamlet');
    const houses = [], smokeAt = [];
    const hz0 = [-52, -27, -3, 24, 49];
    const housePal = { wall: ['#5a3a34', '#3d4a52', '#6b4a32', '#4a2f2f'], roof: ['#cfe0ea', '#b8ccd8'], trim: '#2a2422', wood: '#4a3a2e', accent: '#ffb060' };
    for (let i = 0; i < 5; i++) {
      const z = hamletZ + hz0[i] + hr.range(-4, 4), x = hs * (halfW(z, hs) - hr.range(7, 17) - (i === 2 ? 5 : 0));
      const rot = -hs * hr.range(0.55, 1.25);
      const h = S.makeBuilding({ rng: hr.fork('h' + i), style: 'stilt', stilts: hr.range(2.4, 3.4), pileDepth: 0, lit: hr.range(0.85, 1.25), mats, palette: housePal, position: [x, 0, z], rotationY: rot });
      houses.push(h);
      if (i % 2 === 0) {
        lampPos.push(new THREE.Vector4(x + Math.sin(rot) * 3.2, 4.4, z + Math.cos(rot) * 3.2, hr.range(0.85, 1.2)));
        lampCol.push(new THREE.Color('#ffb060').multiplyScalar(1.1));
      }
      if (i % 2 === 0 || hr.chance(0.3)) smokeAt.push([x, h.size.h - 0.4, z]);
      await tick();                                                     // hand back between houses (takes no draw)
    }
    const jz = hamletZ + hr.range(6, 16), jx = hs * (halfW(jz, hs) - 4), jLen = hr.range(26, 34);
    const jetEnd = [jx - hs * jLen, 0, jz + hr.range(2, 8)];
    const pier = S.makePier({ rng: hr.fork('pier'), from: [jx, 0, jz], to: jetEnd, width: 3, height: 1.7, pileDepth: 0, lamps: false, ladder: false, mats });
    const lampAt = [jetEnd[0] + 2.4 * hs, 1.7, jetEnd[2] - 0.6];
    const lamp = S.makeLamps({ rng: hr.fork('lamp'), mats, positions: [lampAt], type: 'post', height: 3.3, color: '#ffb060', power: 2.8, poolPower: 0.45 });
    const lampHead = [lampAt[0], lampAt[1] + 3.3, lampAt[2]];
    lampPos.push(new THREE.Vector4(lampHead[0], lampHead[1], lampHead[2], 1.5)); lampCol.push(new THREE.Color('#ffb060').multiplyScalar(1.6));
    const boat = S.makeBoat({ rng: hr.fork('boat'), type: hr.pick(['rowboat', 'rowboat', 'sailboat']), mats, lit: 1,
      position: [jetEnd[0] + hs * hr.range(3, 7), 0, jetEnd[2] + hr.range(3.5, 5)], heading: hr.range(0, 6.28),
      heightAt: (x, z, t) => 0.05 * Math.sin(t * 0.7 + x * 0.4) + 0.03 * Math.sin(t * 1.1 + z * 0.5) });
    await tick();
    const baked = S.mergeObjects([...houses, pier, lamp]);
    scene.add(baked.object, boat.object);
    await tick();
    const refl = S.makeReflection([baked, boat], { mats, waterY: 0 });
    scene.add(refl.object);
    const above = (o, order) => o.traverse((m) => { if (m.isMesh && m.material && m.material.transparent) m.renderOrder = order; });
    above(baked.object, 4); above(boat.object, 4); above(refl.object, 0);
    const lampLight = new THREE.PointLight('#ffb060', 140, 70, 2); lampLight.position.set(lampHead[0], lampHead[1], lampHead[2]); scene.add(lampLight);
    updaters.push((dt, t) => { mats.update(dt, t); boat.update(dt, t); lampLight.intensity = 140 * (0.9 + 0.07 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1)); });
    for (const p of smokeAt) {
      // pale vapour, lighter than the snow behind it, warm where it leaves the chimney, gone by ~25 m
      const sm = fx.makeSmokeColumn({ rng: hr.fork('smoke'), time, position: p, height: hr.range(22, 27), radius: [0.3, 3.2], size: [0.7, 4.6], count: 80,
        color: '#8fa8b4', colorTop: '#7fa0ae', shadowColor: '#4c6672', ambient: '#2a3c46', hot: '#6a3a18', hotFalloff: 9, opacity: 0.25, rate: 0.06,
        wind: [-0.9, 0, -0.5], sunDir: [0, 1, 0], sunColor: PV.green, rim: 0.3, renderOrder: 5 });
      scene.add(sm.object);
    }
    await tick();

    // ---------- sparse snow-laden conifers on the lower slopes ----------
    {
      const tr = R.fork('trees');
      const wind = flora.makeWind({ direction: [0.8, 0.45], strength: 0.7, speed: 0.7 });
      await tick();
      const tmat = flora.windMaterial({ wind, backlight: 0, ambient: 1.5, leafAmbient: 1.5 });
      await tick();                                                     // the trees start on a fresh step after the leaf picture
      const tp = { leaf: '#1d3d2e', leafLight: '#46705a', leafDark: '#08160f', bark: '#3a2c24', barkDark: '#1a130f', snowColor: '#cfe9f5' };
      const near = [0, 1].map((i) => flora.coniferGeometry({ rng: tr, detail: 1, snow: 0.9, slim: 1 + i * 0.25, ...tp }));
      const far = [0, 1, 2].map((i) => flora.coniferGeometry({ rng: tr, detail: 0, snow: 1, slim: 0.95 + i * 0.2, ...tp }));
      await tick();
      const points = [];
      const tryTree = (s, z, d, nearSet) => {
        const y = wallH(s, d, z); if (y > 185 || y < 0.6) return;
        if ((wallH(s, d + 5, z) - wallH(s, Math.max(d - 5, 0.01), z)) / 10 > 0.95) return;
        const x = s * (halfW(z, s) + d);
        if (!nearSet && N.n2(x * 0.011 + sOff, z * 0.011) < -0.15 - 0.25 * tr()) return;
        points.push({ x, y, z, s: tr.range(0.65, 1.3) * (nearSet ? 0.8 : 1) * (1 - 0.3 * smoothstep(60, 185, y)), rot: tr.range(0, 6.28), d: nearSet ? 0 : 999, u: 0, v: tr.int(0, 5) });
      };
      for (let k = 0; k < 2600 && points.length < 300; k++) tryTree(tr.sign(), tr.range(-40, 1130), 6 + 250 * Math.pow(tr(), 1.5), false);
      // stands on the lower 60 m of both slopes: clusters of bigger trees around seeded centres
      const nA = points.length;
      for (let c = 0; c < 40 && points.length < nA + 240; c++) {
        const cs = tr.sign(), cz = tr.range(40, 1100), cd = tr.range(10, 95), n = tr.int(5, 11);
        for (let k = 0; k < n; k++) {
          const z = cz + tr.gauss() * 16, d = Math.max(cd + tr.gauss() * 13, 5), before = points.length;
          if (wallH(cs, d, z) > 62) continue;
          tryTree(cs, z, d, true);
          if (points.length > before) { const q = points[points.length - 1]; q.s *= 1.6; q.d = 999; }
        }
      }
      const nFar = points.length;
      for (let k = 0; k < 700 && points.length < nFar + 64; k++) {
        const before = points.length;
        tryTree(hs, hamletZ + tr.range(-110, 110), 11 + 95 * Math.pow(tr(), 1.4), true);
        if (points.length > before) points[points.length - 1].s *= 1.45;
      }
      await tick();                                                     // the scatter (one kit call) starts on a fresh step
      const trees = flora.makeScatter({ rng: tr, points, variants: near, farVariants: far, farDistance: 100, material: tmat, sink: 0.04, tint: 0.15, hue: 0.03 });
      scene.add(trees.object);
      updaters.push((dt, t, cam) => trees.update(dt, t, cam));
    }
    await tick();

    // ---------- the water plane over the mirror, with rings and long warm reflections ----------
    const portalCol = new THREE.Color(PV.portal);
    lampPos.push(new THREE.Vector4(seat[0], seat[1], seat[2], 0.5)); lampCol.push(portalCol.clone().multiplyScalar(1.5));
    while (lampPos.length < 5) { lampPos.push(new THREE.Vector4(0, 1, 0, 0)); lampCol.push(new THREE.Color(0, 0, 0)); }
    const rings = []; for (let i = 0; i < 6; i++) rings.push(new THREE.Vector4(0, 0, 0, 0));
    {
      const g = new THREE.PlaneGeometry(600, 1560, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, 560);
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uPulse, uBody: { value: new THREE.Color('#020a12') }, uSheen: { value: new THREE.Color('#0b2a36').multiplyScalar(0.5) },
          uLight: { value: lightCol.clone() }, uRing: { value: rings }, uLamp: { value: lampPos.slice(0, 5) }, uLampCol: { value: lampCol.slice(0, 5) }, ...fogU() },
        vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
      });
      const water = new THREE.Mesh(g, m); water.name = 'water'; water.renderOrder = 2; water.frustumCulled = false; scene.add(water);
    }

    // ---------- pancake ice drifting on the mirror ----------
    {
      const fr = R.fork('floes'), bergs = A.icebergs, data = [];
      const inBerg = (x, z, r) => bergs.some((b) => Math.hypot(b.position[0] - x, b.position[2] - z) < b.radius + r + 1);
      for (let k = 0; k < 4000 && data.length < 620 * 4; k++) {
        if (k % 256 === 0) await tick();                                // hand back every 256 tries (takes no draw)
        const u = fr.range(0, 0.94), p = pAt(u), t = tAt(u);
        const lat = fr.sign() * (2 + 95 * Math.pow(fr(), 1.6));
        const x = p.x - t.z * lat + fr.range(-6, 6), z = p.z + t.x * lat + fr.range(-10, 10);
        if (Math.abs(x) > halfW(z, Math.sign(x)) - 4 || z < 30) continue;
        if (N.n2(x * 0.02 + sOff, z * 0.02) < -0.25 + 0.5 * fr()) continue;       // loose rafts with open leads between
        const r = 0.45 + 2.3 * Math.pow(fr(), 2.2);
        if (inBerg(x, z, r)) continue;
        data.push(x, z, r, fr());
      }
      const base = floeGeometry(), g = new THREE.InstancedBufferGeometry();
      g.index = base.index; g.setAttribute('position', base.attributes.position);
      g.setAttribute('aFloe', new THREE.InstancedBufferAttribute(new Float32Array(data), 4));
      g.instanceCount = data.length / 4;
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uPulse, uLight: { value: lightCol.clone() }, uSky: { value: skyAmb.clone() }, uSnow: { value: cSnow.clone() },
          uDeep: { value: new THREE.Color('#1c4a5c') }, ...fogU() },
        vertexShader: FLOE_VERT, fragmentShader: FLOE_FRAG, fog: true, side: THREE.DoubleSide,
      });
      const floes = new THREE.Mesh(g, m); floes.name = 'pancake-ice'; floes.frustumCulled = false; scene.add(floes);
    }
    await tick();

    // ---------- orcas (pod travelling ahead on the side away from the hamlet from the start, overtaken at ~0.44) and the whale's fluke (ahead-right at u = 0.6) ----------
    const whaleU = { uPulse, uLight: { value: lightCol.clone() }, uSky: { value: skyAmb.clone().multiplyScalar(1.5) },
      uMoonDir: { value: moonDir.clone() }, uMoonCol: { value: new THREE.Color('#9fc0ff').multiplyScalar(0.5) } };
    const whaleMat = (flip, bright) => new THREE.ShaderMaterial({
      uniforms: { ...whaleU, uFlip: { value: flip }, uBright: { value: bright }, ...fogU() },
      vertexShader: WHALE_VERT, fragmentShader: WHALE_FRAG, fog: true, side: THREE.DoubleSide,
    });
    const wmA = whaleMat(1, 1), wmB = whaleMat(-1, 0.75);
    const blows = []; for (let i = 0; i < 6; i++) blows.push(new THREE.Vector4(0, 0, -1, 0));
    const orcas = [], podFocus = new THREE.Vector3();
    let podAt = () => podFocus;
    const or = R.fork('orcas');
    {
      const bull = orcaGeometry(8, 2.6), cow = orcaGeometry(6.2, 2.4);
      const c35 = pAt(0.44), t35 = tAt(0.44); t35.y = 0; t35.normalize();
      const side = -hs, dist = or.range(23, 28), podPeriod = or.range(9, 10.5), podPhase = or();                                 // on the side away from the hamlet (left by default)
      const anchor = new THREE.Vector3(c35.x - t35.z * side * dist, 0, c35.z + t35.x * side * dist);
      const cross = or.range(0.5, 0.68), nx = -t35.z * side, nz = t35.x * side;
      const yaw = Math.atan2(t35.x * Math.cos(cross) - nx * Math.sin(cross), t35.z * Math.cos(cross) - nz * Math.sin(cross));
      for (let i = 0; i < orcaCount; i++) {
        const geo = i === 0 ? bull : cow, sc = (i === 0 ? 1 : or.range(0.8, 1.05)) * 1.6;
        const a = new THREE.Mesh(geo, wmA), b = new THREE.Mesh(geo, wmB);
        for (const m of [a, b]) { m.rotation.order = 'YXZ'; m.scale.setScalar(sc); m.frustumCulled = false; }
        scene.add(a); mirror.add(b);
        orcas.push({ a, b, sc, lat: (i - (orcaCount - 1) / 2) * or.range(5, 7) + or.range(-1.5, 1.5), along: or.range(-16, 16),
          period: podPeriod, phase: (podPhase + 0.5 * i / orcaCount + or.range(-0.04, 0.04)) % 1, finH: i === 0 ? 1.9 : 1.0 });
      }
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), rgt = new THREE.Vector3(fwd.z, 0, -fwd.x);
      podAt = (u) => { const adv = Math.max(Math.min((u - 0.42) * 700, 8), -92); return podFocus.set(anchor.x + fwd.x * adv, 2, anchor.z + fwd.z * adv); };
      updaters.push((dt, t, cam, u) => {
        const adv = Math.max(Math.min((u - 0.42) * 700, 8), -92);
        for (let i = 0; i < orcas.length; i++) {
          const o = orcas[i], c = (t / o.period + o.phase) % 1, sec = c * o.period, show = 0.74 * o.period;
          const q = Math.min(c / 0.74, 1), rise = Math.pow(Math.sin(Math.PI * q), 0.55);
          const al = adv + o.along + sec * 1.5 - 6;
          const x = anchor.x + fwd.x * al + rgt.x * o.lat, z = anchor.z + fwd.z * al + rgt.z * o.lat;
          const y = (-3.4 + 3.68 * rise) * o.sc, pitch = 0.2 * Math.cos(Math.PI * q) * (q < 1 ? 1 : 0);
          for (const m of [o.a, o.b]) { m.position.set(x, y, z); m.rotation.set(-pitch, yaw, 0.06 * Math.sin(t * 0.9 + i)); m.visible = q < 1; }
          const bAge = sec - 0.3 * show;
          blows[i].set(x + fwd.x * 1.6 * o.sc, z + fwd.z * 1.6 * o.sc, bAge >= 0 && bAge < 3.2 ? bAge : -1, yaw);
          const rAge = sec - 0.12 * show;
          if (rAge > 0) rings[i].set(x - fwd.x * 1.5 * rAge, z - fwd.z * 1.5 * rAge, 1.4 + rAge * 1.7, 0.95 * Math.exp(-rAge / 4.2) * smoothstep(0, 0.6, rAge));
          else rings[i].w = 0;
        }
      });
    }
    let flukeAt = null;
    {
      // the whale: 90 m ahead and to the right of where the camera is at u = 0.6, in a gap between the bergs
      const c60 = pAt(0.6), t60 = tAt(0.6); t60.y = 0; t60.normalize();
      let best = null;
      for (let k = 0; k < 14 && !best; k++) {
        const ahead = 42 + (k % 3) * 5, lat = 20 + k * 4;
        const x = c60.x + t60.x * ahead - t60.z * lat, z = c60.z + t60.z * ahead + t60.x * lat;
        const ok = A.icebergs.every((b) => Math.hypot(b.position[0] - x, b.position[2] - z) > b.radius + 9) && path.nearestXZ(x, z).dist > 16;
        if (ok) best = [x, z];
      }
      if (!best) best = [c60.x + t60.x * 66 - t60.z * 40, c60.z + t60.z * 66 + t60.x * 40];
      flukeAt = new THREE.Vector3(best[0], 4, best[1]);
      const c55 = pAt(0.55), span = or.range(8.5, 10), geo = flukeGeometry(span), yaw = Math.atan2(best[0] - c55.x, best[1] - c55.z) + or.range(-0.25, 0.25);
      const a = new THREE.Mesh(geo, wmA), b = new THREE.Mesh(geo, wmB);
      for (const m of [a, b]) { m.rotation.order = 'YXZ'; m.frustumCulled = false; }
      scene.add(a); mirror.add(b);
      updaters.push((dt, t, cam, u) => {
        // rises fast, stands fully raised from s = 0.3 to 0.72 (swaying a little), then slides under
        const s = (u - 0.47) / 0.19, on = s > 0 && s < 1;
        for (const m of [a, b]) m.visible = on;
        const y = lerp(lerp(-span * 1.25, -0.4, smoothstep(0, 0.3, s)), -span * 1.5, smoothstep(0.72, 1, s)) + 0.25 * Math.sin(t * 0.7);
        const tilt = lerp(-1.15, 0.04, smoothstep(0.03, 0.32, s)) + 0.35 * smoothstep(0.7, 1, s) + 0.05 * Math.sin(t * 0.55);
        for (const m of [a, b]) { m.position.set(best[0], y, best[1]); m.rotation.set(tilt, yaw, 0.05 * Math.sin(t * 0.8)); }
        rings[4].set(best[0], best[1], 2 + Math.max(s - 0.08, 0) * 34, s > 0.08 && s < 1.8 ? 1.1 * Math.exp(-Math.max(s - 0.5, 0) * 2.2) : 0);
        rings[5].set(best[0], best[1], 1 + Math.max(s - 0.7, 0) * 30, s > 0.7 && s < 2.2 ? 1.0 * Math.exp(-(s - 0.7) * 1.6) : 0);
        const bAge = (u - 0.43) * 62;                                              // the breath before the dive
        blows[5].set(best[0] + Math.sin(yaw) * 9, best[1] + Math.cos(yaw) * 9, bAge >= 0 && bAge < 3.2 ? bAge : -1, yaw);
        const dAge = ((u - 0.485) * 62) % 2.6;                                     // water sheeting off the flukes while they stand
        blows[4].set(best[0], best[1], s > 0.08 && s < 0.8 && dAge >= 0 ? dAge * 1.2 : -1, yaw);
      });
    }
    {   // breath sprites (and their reflection)
      const n = 6 * 24, P = new Float32Array(n * 3), Sd = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { Sd[i * 4] = Math.floor(i / 24); Sd[i * 4 + 1] = or(); Sd[i * 4 + 2] = or(); Sd[i * 4 + 3] = or(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(Sd, 4));
      const size = new THREE.Vector2(960, 540); if (ctx.renderer && ctx.renderer.getDrawingBufferSize) ctx.renderer.getDrawingBufferSize(size);
      const mk = (bright, order) => {
        const m = new THREE.ShaderMaterial({
          uniforms: { uBlow: { value: blows }, uScale: { value: size.y * 0.87 }, uColor: { value: lightCol.clone().lerp(white, 0.1).multiplyScalar(1.0) }, uBright: { value: bright } },
          vertexShader: BLOW_VERT, fragmentShader: BLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const pts3 = new THREE.Points(g, m); pts3.frustumCulled = false; pts3.renderOrder = order; return pts3;
      };
      scene.add(mk(1, 4)); mirror.add(mk(0.6, 0));
    }
    await tick();

    // ---------- air: ice crystals and shooting stars (the cold mist is the scene fog) ----------
    const air = fx.fxGroup(); scene.add(air.object);
    air.add(fx.makeParticles({ rng: R.fork('snow'), preset: 'snow', time, count: Math.round(1300 * snowfall), velocity: [0.7, -0.75, 0.3], velocityRandom: [0.5, 0.4, 0.5],
      colors: ['#e8f6ff', '#b4ffdc', '#cfe9f5'], size: [0.03, 0.09], intensity: 1.35, additive: 0.5, twinkle: 0.5, renderOrder: 6 }));
    await tick();                                                       // hand back between the air's kit calls (takes no draw)
    air.add(fx.makeShootingStars({ rng: R.fork('stars'), time, count: R.int(5, 8), period: [6, 18], minElevation: 0.16, color: '#f0ffff', tailColor: PV.green, intensity: 2.5 }));
    await tick();

    const mistCol = fogColor.clone().lerp(cGreen, 0.08).multiplyScalar(1.5);
    air.add(fx.makeMist({ rng: R.fork('mist'), time, count: 90, area: [560, 5, 560], center: [0, 2, 0], size: [50, 120], color: mistCol,
      opacity: 0.13 * mistK, drift: [0.8, 0, 0.45], flatten: 0.3, follow: true, renderOrder: 5 }));
    await tick();
    {   // a second band that stays put: along the glacier foot and the hamlet shore, where the ice glow and the lamp catch it
      const mr = R.fork('mist2'), positions = [];
      for (let i = 0; i < 18; i++) positions.push([mr.range(-125, 125), mr.range(2, 5), mr.range(18, 110)]);
      for (let i = 0; i < 14; i++) { const z = hamletZ + mr.range(-95, 95); positions.push([hs * (halfW(z, hs) - mr.range(-12, 55)), mr.range(1.5, 4), z]); }
      air.add(fx.makeMist({ rng: mr, time, positions, size: [34, 80], color: mistCol.clone().lerp(new THREE.Color('#7fd8e8'), 0.25), opacity: 0.16 * mistK,
        drift: [0.25, 0, 0.12], flatten: 0.3, renderOrder: 5 }));
    }

    // ---------- gaze ----------
    const hamletFocus = [hs * (halfW(hamletZ, hs) - 14), 4, hamletZ - 6];
    const gate = new THREE.Vector3(A.caveMouth.center[0], 15, 0);
    const pois = [
      { at: hamletFocus, from: 0.02, to: 0.26, weight: 0.58, fade: 0.35 },
      { at: (t, u) => podAt(u), from: 0.26, to: 0.45, weight: 0.7 },
      { at: flukeAt, from: 0.47, to: 0.65, weight: 0.5 },
      { at: gate, from: 0.66, to: 0.93, weight: 0.3 },
    ];

    return {
      scene, path, duration: 46, title: PV.title,
      camera: { fov: 60, near: 0.5, far: 7000, lookAhead: 34, sway: 0.6, bank: 0.55 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: PV.portal, glow: 0.7, revealDistance: 320 },
      post: {
        exposure: 1.18, bloom: { strength: 0.62, radius: 0.72, threshold: 0.8 },
        grade: { saturation: 1.08, contrast: 1.06, tint: '#eef8ff', shadowTint: '#030a16', vignette: 0.38, grain: 0.03, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t;
        const pulse = 0.5 + 0.35 * Math.sin(t * 0.31) + 0.15 * Math.sin(t * 0.83 + 1.3);       // same beat as the hero's inner glow
        uPulse.value = pulse;
        rig.sun.intensity = sunBase * (0.75 + 0.5 * pulse);
        for (const f of updaters) f(dt, t, camera, u);
        air.update(dt, t, camera);
        // the gate's inner glow: pushed through the haze at the far end of the fjord, eased off on the final approach so the ice keeps its colour
        hero.setAurora(PV.green, lerp(1.45, 1, smoothstep(0.05, 0.55, u)) * lerp(1, 0.62, smoothstep(0.78, 0.96, u)));
        hero.setProgress(Math.min(u, 0.7));
        hero.update(dt, t, camera);
      },
      dispose() {
        hero.dispose();
        if (sky.dispose) sky.dispose();
        for (const o of trash) o.dispose && o.dispose();
      },
    };
  },
};
