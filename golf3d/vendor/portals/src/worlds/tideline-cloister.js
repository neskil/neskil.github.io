// THE TIDELINE CLOISTER
// High tide in a mangrove forest, ridden at the bow of a painted canoe with the lens half under water.
// The frame is drawn twice: the engine's own pass is the AIR half (eye 0.25 m above the surface), and every
// frame this world renders a second, SEA pass (eye below the surface, 1.33x narrower field of view, its own
// fog, light and grade) into a render target that a clip-space quad lays over the rows below the seam.
// A meniscus line joins the two; the seam breathes, dunks right over the lens twice and drains off again.
// Scene graph: air (only in the engine pass), sea (only in the lower pass), both.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { makeBuilding } from '../kit/structures.js';
import { buildHero, patch, makeBuilder, finish, finishAsync, icoIndexed, tube, makeLeafTexture, WOOD_VHEAD, WOOD_OPTS, SPONGE_OPTS, SWAY_OPTS, LEAF_OPTS, POD_OPTS } from '../parts/tideline-cloister.js';

const V3 = THREE.Vector3;
const EYE = 0.25;                 // air eye above the water
const LAG = { x: 0, z: -40 };     // lagoon centre
const MOUTH_Z = 140;              // the channel opens into the lagoon here
const DUR = 41;

// ------------------------------------------------------------------ shared GLSL
const TC_NOISE = /* glsl */`
float tcHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float tcNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(tcHash(i), tcHash(i + vec3(1,0,0)), f.x), mix(tcHash(i + vec3(0,1,0)), tcHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(tcHash(i + vec3(0,0,1)), tcHash(i + vec3(1,0,1)), f.x), mix(tcHash(i + vec3(0,1,1)), tcHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float tcCaustic(vec2 p, float t){ float c = 0.0; vec2 q = p;
  for (int i = 0; i < 3; i++){ float fi = float(i) + 1.0;
    q += vec2(sin(q.y * 1.7 + t * 0.9 + fi), cos(q.x * 1.5 - t * 0.7 + fi * 2.0)) * 0.6;
    c += abs(sin(q.x * 1.2 + fi) * sin(q.y * 1.2 - fi)); }
  c = 1.0 - c / 3.0; c = clamp(c, 0.0, 1.0); return c * c * c * 3.0; }
`;
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const VERT_WORLD = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vW;
void main(){ vW = (modelMatrix * vec4(position, 1.0)).xyz; vec4 mvPosition = viewMatrix * vec4(vW, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---- the water surface: top (sky / canopy reflection, glints, rain rings) and underside (silver mirror, window, dimples)
const WATER_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${TC_NOISE}
uniform float uTime, uRain, uChop, uBio, uMouth; uniform vec3 uSun, uSunCol, uHor, uZen, uCanopy, uCoin, uTea, uTurq, uUnder, uCam, uAlmDir, uAlm;
varying vec3 vW;
void main(){
  vec3 p = vW, V = uCam - p; float dist = max(length(V), 1e-3); V /= dist; float t = uTime; vec2 q = p.xz;
  float w1 = cos(q.x * 0.9 + q.y * 0.3 + t * 1.1), w2 = cos(q.y * 1.7 + q.x * 0.5 - t * 1.4);
  vec2 gr = 0.05 * w1 * vec2(1.0, 0.33) + 0.04 * w2 * vec2(0.3, 1.0);
  float n1 = tcNoise(vec3(q * 2.3, t * 0.6)), n2 = tcNoise(vec3(q * 2.3 + vec2(0.2, 0.0), t * 0.6)), n3 = tcNoise(vec3(q * 2.3 + vec2(0.0, 0.2), t * 0.6));
  gr += vec2(n2 - n1, n3 - n1) * 0.55; gr *= uChop / (1.0 + dist * 0.02);
  float ring = 0.0;
  if (uRain > 0.01) { for (int k = 0; k < 2; k++) {
    vec2 c = q * (k == 0 ? 0.8 : 1.7) + float(k) * 13.7, id = floor(c), f = fract(c) - 0.5; float h = tcHash(vec3(id, 3.0 + float(k)));
    vec2 ctr = (vec2(tcHash(vec3(id, 7.0)), tcHash(vec3(id, 11.0))) - 0.5) * 0.4; float ph = fract(t * (0.8 + 0.5 * h) + h * 9.0), d = length(f - ctr);
    float r1 = smoothstep(0.035, 0.0, abs(d - ph * 0.42)) * (1.0 - ph) * step(h, uRain * 0.9);
    ring += r1; gr += (f - ctr) / max(d, 0.02) * r1 * 0.5 / (1.0 + dist * 0.03); } }
  vec3 N = normalize(vec3(-gr.x, 1.0, -gr.y));
  float forest = smoothstep(uMouth - 8.0, uMouth + 6.0, p.z + (n1 - 0.5) * 6.0), dome = 1.0 - smoothstep(14.0, 27.0, length(q));
  vec3 col;
  if (gl_FrontFacing) {
    float fr = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
    vec3 sky = mix(uHor, uZen, pow(clamp(R.y, 0.0, 1.0), 0.5));
    vec2 cq = q + R.xz / max(R.y, 0.1) * 5.0;
    float cn = tcNoise(vec3(cq * 0.33, t * 0.05)) * 0.65 + tcNoise(vec3(cq * 0.9 + 4.0, t * 0.08)) * 0.35;
    vec3 can = mix(uCanopy * (0.45 + 0.9 * tcNoise(vec3(cq * 1.1, 1.0))), uCoin, smoothstep(0.56, 0.68, cn));
    vec3 refl = mix(sky, can, max(forest, dome * 0.85));
    float tea = smoothstep(uMouth - 34.0, uMouth, p.z + (tcNoise(vec3(q * 0.07, t * 0.03)) - 0.5) * 26.0);
    vec3 body = mix(uTurq * (0.55 + 0.25 * n1), uTea * 0.42, tea) * (1.0 - 0.45 * max(forest, dome));
    float open = 1.0 - max(forest, dome) * 0.85;
    float glint = pow(max(dot(R, uSun), 0.0), 380.0) * 22.0 * open
      + smoothstep(0.86, 1.0, tcNoise(vec3(q * 4.0 + N.xz * 9.0, t * 1.2))) * (0.25 + 0.75 * smoothstep(0.56, 0.68, cn) * (1.0 - open)) * 0.9 / (1.0 + dist * 0.03);
    col = mix(body, refl, fr) + uSunCol * glint + (uHor * 0.6 + uUnder * uBio * 6.0) * ring * 0.7;
  } else {
    vec3 Nd = normalize(vec3(-gr.x * 4.0, 1.0, -gr.y * 4.0)); float c = max(dot(V, -Nd), 0.0);
    float kk = 1.0 - 1.777 * (1.0 - c * c), win = smoothstep(-0.25, 0.1, kk + (n1 - 0.5) * 0.5 + max(-V.y, 0.0) * 0.9 - 0.25);
    float sil = 0.5 + 0.5 * tcNoise(vec3(q * 1.3 + gr * 30.0, t * 0.8));
    vec3 mir = uUnder * (0.7 + 2.4 * sil * sil) + vec3(0.07, 0.07, 0.05) * sil * (1.0 - uBio);
    float cn = tcNoise(vec3(q * 0.33, t * 0.05));
    float cn2 = tcNoise(vec3(q * 1.7 + 3.0, t * 0.07));      // the window shows the canopy: blue-green leaf masses and coins of sky
    vec3 above = mix(mix(uHor, uZen, 0.4) * 1.7, mix(uCanopy * (1.3 + 3.2 * cn2) + vec3(0.0, 0.03, 0.035), uCoin * 1.3, smoothstep(0.46, 0.64, cn)), max(forest, dome * 0.8));
    col = mix(mir, above, win * 0.92);
    col *= 1.0 - ring * 0.5; col += (uSunCol * 0.25 + uUnder * uBio * 14.0) * ring * smoothstep(0.0, 0.5, ring);
  }
  gl_FragColor = vec4(col, 1.0);
  #ifdef USE_FOG
    float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    vec3 ad = -V - uAlmDir; float ag = gl_FrontFacing ? 0.0 : exp(-(ad.x * ad.x + ad.z * ad.z) * 9.0 - ad.y * ad.y * 55.0);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor + uAlm * ag, ff);
  #endif
}`;

// ---- sand floor: ripples, caustics that change character from tannin to turquoise, grass stain, canopy shade
const FLOOR_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${TC_NOISE}
uniform float uTime, uMouth, uBio; uniform vec3 uSunCol, uAmb, uSand, uGrass, uAbsorb, uSun, uCam, uAlmDir, uAlm;
varying vec3 vW; varying float vG;
void main(){
  vec3 p = vW; float t = uTime;
  float rip = sin(p.x * 7.0 + sin(p.z * 1.6) * 2.2 + tcNoise(vec3(p.xz * 0.5, 0.0)) * 5.0);
  vec3 alb = uSand * (0.78 + 0.2 * tcNoise(vec3(p.xz * 2.4, 1.0)) + 0.07 * rip);
  float lag = 1.0 - smoothstep(uMouth - 30.0, uMouth - 6.0, p.z);
  float g = smoothstep(0.3, 0.7, max(vG, 0.0) * (0.7 + 0.6 * tcNoise(vec3(p.xz * 0.5, 5.0))));
  float bank = clamp(-vG, 0.0, 1.0) * (0.75 + 0.5 * tcNoise(vec3(p.xz * 0.8, 3.0)));     // under the roots the sand is dark with litter and shade
  alb = mix(alb, uGrass, g * 0.7);
  alb = mix(alb, vec3(0.1, 0.07, 0.035), min(bank, 1.0) * 0.72);
  alb = mix(alb, vec3(0.16, 0.11, 0.05), (1.0 - lag) * smoothstep(0.5, 0.75, tcNoise(vec3(p.xz * 0.6, 8.0))) * 0.42);   // leaf litter in the channel
  vec2 cq = p.xz - uSun.xz / max(uSun.y, 0.25) * p.y;
  float fast = tcCaustic(cq * 0.9, t * 1.6), slow = tcCaustic(cq * 0.72 + 3.0, t * 0.55);
  float ca = mix(slow * 1.35, fast * 1.25, lag);
  float cn = tcNoise(vec3(cq * 0.33, t * 0.05)) * 0.65 + tcNoise(vec3(cq * 0.9 + 4.0, t * 0.08)) * 0.35;
  float shade = mix(0.3 + 1.0 * smoothstep(0.5, 0.66, cn), 1.0, lag);
  vec3 col = alb * (uAmb * (1.0 - 0.45 * min(bank, 1.0)) + uSunCol * mix(0.1 + min(ca, 1.7) * 0.62, 0.28 + min(ca, 2.3) * 0.62, lag) * shade * (1.0 - 0.7 * min(bank, 1.0)) * exp(p.y * 0.06));
  col *= mix(vec3(1.0), uAbsorb, 1.0 - exp(p.y * 0.2));
  col += vec3(0.1, 0.5, 0.9) * uBio * smoothstep(0.93, 1.0, tcNoise(vec3(p.xz * 3.0, t * 0.4))) * 1.5;
  gl_FragColor = vec4(col, 1.0);
  #ifdef USE_FOG
    // the haze glows green-gold toward the tunnel's vanishing point (uAlmDir): an almond of light the roots stand against
    float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    vec3 ad = normalize(vW - uCam) - uAlmDir; float ag = exp(-(ad.x * ad.x + ad.z * ad.z) * 9.0 - ad.y * ad.y * 55.0);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor + uAlm * ag, ff);
  #endif
}`;

const FLOOR_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aG; varying vec3 vW; varying float vG;
void main(){ vW = position; vG = aG; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---- flat mangrove wall (far root colonnade + leaf mass), used behind the 3D roots and round the lagoon
const WALL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aW; varying vec3 vA; varying vec3 vW;
void main(){ vA = aW; vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${TC_NOISE}
uniform vec3 uLeaf, uShade, uRoot, uSunCol, uAmb; uniform float uTime;
varying vec3 vA; varying vec3 vW;
void main(){
  float s = vA.x, v = vA.y, y = vW.y, sunny = vA.z;
  float top = 0.7 + 0.3 * tcNoise(vec3(s * 0.11, 2.0, sunny * 7.0)) - 0.12 * tcNoise(vec3(s * 0.7, 5.0, 0.0)) - 0.05 * tcNoise(vec3(s * 2.6, y * 2.0, 1.0));
  if (v > top) discard;
  float sway = sin(uTime * 0.9 + s * 0.3) * 0.15;
  float leaf = tcNoise(vec3(s * 0.45 + sway, y * 0.55, 1.0)) * 0.55 + tcNoise(vec3(s * 1.6 + sway, y * 1.8, 4.0)) * 0.45;
  float lit = smoothstep(0.38, 0.78, leaf + (v / max(top, 0.1) - 0.6) * 0.5);
  vec3 col = mix(uShade * 0.5, uLeaf, lit * (0.35 + 0.65 * sunny)) * (uAmb + uSunCol * (0.25 + 0.75 * lit) * (0.3 + 0.7 * sunny));
  float trunk = smoothstep(0.62, 0.8, tcNoise(vec3(s * 1.9, y * 0.12, 9.0))) * (1.0 - smoothstep(2.5, 6.0, y));
  float arch = smoothstep(0.55, 0.75, tcNoise(vec3(s * 1.2 + y * 0.8, y * 0.5, 3.0))) * (1.0 - smoothstep(0.5, 3.2, y));
  float gloom = 1.0 - smoothstep(0.3, 4.5, y);
  col = mix(col, uShade * 0.1 * uAmb, gloom * 0.85);
  col = mix(col, uRoot * (0.25 + 0.5 * sunny) * (uAmb + uSunCol * 0.4 * sunny), max(trunk, arch) * 0.9);
  if (y < 0.0) col = uRoot * 0.12 * uAmb;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- lower half of the frame: the sea pass, its grade, the meniscus line
const COMP_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, -1.0, 1.0); }`;
const COMP_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tUnder; uniform float uSeam, uTime, uMen, uWob, uShift; uniform vec3 uTint, uLine, uLift;
varying vec2 vUv;
void main(){
  float x = vUv.x, y = vUv.y, t = uTime;
  float seam = uSeam + uWob * (0.0035 * sin(x * 17.0 + t * 2.3) + 0.002 * sin(x * 41.0 - t * 3.7) + 0.0015 * sin(x * 7.0 + t * 1.1));
  float d = y - seam;
  if (d > uMen * 0.45) discard;
  vec2 uv = vUv;
  float near = smoothstep(-0.07, 0.0, d);
  uv.x += (sin(y * 90.0 + t * 2.6) * 0.0012 + sin(y * 37.0 - t * 1.7) * 0.0016) * (0.4 + 2.2 * near);
  uv.y = min(uv.y, seam) - near * near * 0.012 + uShift;      // uShift lifts the sea eye's horizon above the seam: a strip of the mirror shows under the line
  vec3 col = textureLod(tUnder, clamp(uv, 0.001, 0.999), 0.0).rgb;
  col = max(col, 0.0) * uTint * mix(0.62, 1.0, smoothstep(0.0, 0.75, y / max(seam, 0.1))) + uLift;
  col *= mix(1.0, 0.28, smoothstep(-uMen, -uMen * 0.15, d));                 // dark underside of the meniscus
  float line = smoothstep(uMen * 0.45, uMen * 0.2, d) * smoothstep(-uMen * 0.12, uMen * 0.05, d);
  col = mix(col, uLine * (1.1 + 0.9 * sin(x * 63.0 + t * 4.0) * sin(x * 23.0 - t * 2.0)), line);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- lens overlay: the sheet of water draining off the upper half after a dunk, and the beads it leaves
const LENS_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; uniform float uSeam, uDrain, uAspect, uTime; varying vec2 vQ; varying vec4 vB; varying float vK;
void main(){
  vQ = position.xy; vB = iB; vec2 c; vec2 h;
  if (iB.x < 0.5) {            // the sheet: from the seam up to a falling upper edge
    float topY = mix(1.0, uSeam, smoothstep(0.0, 0.55, 1.0 - uDrain));
    c = vec2(0.5, (uSeam + topY) * 0.5); h = vec2(0.5, max(topY - uSeam, 0.0) * 0.5); vK = topY;
  } else {                     // beads: appear as the sheet passes, slide a little, dry out
    float born = smoothstep(0.0, 0.55, 1.0 - uDrain), yy = mix(uSeam + 0.03, 0.98, iA.y);
    float topY = mix(1.0, uSeam, born);
    float on = step(topY, yy + 0.02) * smoothstep(0.0, 0.12, uDrain);
    yy -= (1.0 - uDrain) * iA.w * 0.1;
    c = vec2(iA.x, max(yy, uSeam + 0.02)); float r = iA.z * on * (0.6 + 0.4 * uDrain); h = vec2(r / uAspect, r * 1.25); vK = on;
  }
  vec2 ndc = (c + position.xy * h) * 2.0 - 1.0; gl_Position = vec4(ndc, -0.999, 1.0);
}`;
const LENS_FRAG = /* glsl */`
precision highp float;
uniform float uDrain, uTime; uniform vec3 uSkyC, uDarkC; varying vec2 vQ; varying vec4 vB; varying float vK;
void main(){
  if (vB.x < 0.5) {
    float e = smoothstep(0.75, 1.0, vQ.y + 0.06 * sin(vQ.x * 21.0 + uTime * 3.0) + 0.04 * sin(vQ.x * 57.0 - uTime * 5.0));
    float a = (0.1 + 0.05 * sin(vQ.x * 33.0 + vQ.y * 9.0 - uTime * 6.0)) * smoothstep(0.0, 0.2, uDrain) + e * 0.0;
    float edge = smoothstep(0.82, 0.93, vQ.y + 0.06 * sin(vQ.x * 21.0 + uTime * 3.0)) * (1.0 - smoothstep(0.96, 1.0, vQ.y));
    gl_FragColor = vec4(mix(uSkyC * 0.6, uSkyC * 1.5, edge), min(1.0, a + edge * 0.28) * uDrain);
  } else {
    float r = length(vQ); if (r > 1.0 || vK < 0.01) discard;
    float rim = smoothstep(0.6, 1.0, r);
    vec3 c = mix(uSkyC * 1.5, uDarkC, smoothstep(-0.5, 0.45, vQ.y));          // a drop shows the world upside down
    c += uSkyC * 3.0 * smoothstep(0.3, 0.0, length(vQ - vec2(-0.35, 0.4)));
    gl_FragColor = vec4(c, (0.55 + 0.4 * rim) * smoothstep(1.0, 0.85, r) * min(1.0, uDrain * 3.0));
  }
}`;

// ---- additive sun shafts under water, wrapped around the camera
const RAY_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aD; attribute vec3 aO; uniform vec3 uCam, uRay, uCtr; uniform float uTime, uLen, uWid, uFrac; varying vec4 vD; varying float vDep;
void main(){
  vec2 cell = vec2(32.0, 32.0);
  vec2 o = mod(aO.xz - uCtr.xz + cell * 0.5, cell) - cell * 0.5 + uCtr.xz;
  vec3 c = vec3(o.x, 0.0, o.y) + uRay * aD.y * uLen + vec3(sin(uTime * 0.3 + aD.w * 30.0), 0.0, cos(uTime * 0.23 + aD.w * 17.0)) * 0.4;
  vec3 sd = normalize(cross(uRay, uCam - c) + vec3(1e-4, 0.0, 0.0));
  vec3 pos = c + sd * aD.x * aD.z * uWid * step(aD.w, uFrac) * (1.0 + aD.y * 0.8);      // half of them only show in the lagoon, where they are fine and many
  vD = aD; vec4 mvPosition = viewMatrix * vec4(pos, 1.0); gl_Position = projectionMatrix * mvPosition; vDep = -mvPosition.z;
  #include <fog_vertex>
}`;
const RAY_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uCol; uniform float uTime; varying vec4 vD; varying float vDep;
void main(){
  float ac = cos(clamp(vD.x, -1.0, 1.0) * 1.5708); ac *= ac; ac *= ac;                     // soft across the width: no quad edge
  float al = smoothstep(0.0, 0.25, vD.y) * (1.0 - smoothstep(0.5, 1.0, vD.y));              // and faded out at both ends
  float fl = 0.55 + 0.45 * sin(uTime * 1.1 + vD.w * 40.0 + vD.y * 3.0);
  vec3 col = uCol * ac * al * fl * smoothstep(0.7, 3.2, vDep);                              // a shaft beside the lens never fills the frame
  #ifdef USE_FOG
    col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * 0.5);
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- shafts of sunlight through gaps in the canopy (air pass): soft additive ribbons that turn to face the lens
const SHAFT_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aD; uniform vec3 uDir; uniform float uTime; varying vec4 vD; varying float vDep;
void main(){
  vec3 c = position + uDir * aD.y + vec3(sin(uTime * 0.21 + aD.w * 30.0), 0.0, cos(uTime * 0.17 + aD.w * 17.0)) * 0.25;
  vec3 sd = normalize(cross(uDir, cameraPosition - c) + vec3(1e-4, 0.0, 0.0));
  vec3 pos = c + sd * aD.x * aD.z * (0.8 + 0.5 * aD.y);
  vD = aD; vec4 mvPosition = viewMatrix * vec4(pos, 1.0); gl_Position = projectionMatrix * mvPosition; vDep = -mvPosition.z;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${TC_NOISE}
uniform vec3 uCol; uniform float uTime; varying vec4 vD; varying float vDep;
void main(){
  float ac = cos(clamp(vD.x, -1.0, 1.0) * 1.5708); ac *= ac;
  float al = smoothstep(0.0, 0.18, vD.y) * (1.0 - smoothstep(0.72, 1.0, vD.y));
  float dust = 0.55 + 0.45 * tcNoise(vec3(vD.x * 2.5 + vD.w * 9.0, vD.y * 5.0 - uTime * 0.12, uTime * 0.1 + vD.w * 5.0));
  float fl = 0.75 + 0.25 * sin(uTime * 0.9 + vD.w * 40.0);
  vec3 col = uCol * ac * al * dust * fl * smoothstep(1.2, 6.0, vDep);
  #ifdef USE_FOG
    col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * 0.6);
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- small round sprites in world space (bubbles, sand puffs, splash): each rises / drifts on its own clock
const SPR_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 iA; attribute vec4 iB; uniform vec3 uOrg, uFlow; uniform float uTime, uOn, uTop; varying vec2 vQ; varying float vA;
void main(){
  float ph = fract(uTime * iB.x + iB.y);
  vec3 c = uOrg + iA.xyz + uFlow * ph * iB.z + vec3(sin(uTime * 3.0 + iB.y * 40.0), 0.0, cos(uTime * 2.3 + iB.y * 31.0)) * 0.05;
  c.y = min(c.y + ph * iB.w, uTop);
  vQ = position.xy; vA = sin(ph * 3.1416) * uOn;
  vec4 mvPosition = viewMatrix * vec4(c, 1.0); mvPosition.xy += position.xy * iA.w * (0.5 + ph);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPR_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uCol; uniform float uSoft; varying vec2 vQ; varying float vA;
void main(){
  float r = length(vQ); if (r > 1.0) discard;
  float rim = mix(smoothstep(0.55, 0.95, r) * 0.8 + 0.15 + smoothstep(0.35, 0.0, length(vQ - vec2(-0.3, 0.35))), 1.0 - r, uSoft);
  gl_FragColor = vec4(uCol * rim, 1.0) * vA * smoothstep(1.0, 0.8, r);
  #ifdef USE_FOG
    gl_FragColor *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
}`;

// ---- feather-duster worms: a banded funnel of gills on a root that snaps shut when the lens comes close
const WORM_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 iP; attribute vec4 iD; uniform vec3 uEye; uniform float uTime; varying vec3 vC; varying vec2 vQ;
void main(){
  vec3 ax = normalize(iD.xyz), tx = normalize(cross(ax, vec3(0.31, 0.2, 0.93))), bx = cross(ax, tx);
  float open = smoothstep(1.7, 2.9, distance(iP.xyz, uEye)) * (0.9 + 0.1 * sin(uTime * 2.0 + iD.w * 40.0));
  vec3 lp = position; lp.xz *= mix(0.1, 1.0, open) * (1.0 + 0.08 * sin(uTime * 3.1 + iD.w * 17.0 + position.x * 30.0)); lp.y *= mix(0.3, 1.0, open);
  vec3 wp = iP.xyz + (tx * lp.x + ax * lp.y + bx * lp.z) * iP.w;
  vC = mix(vec3(0.95, 0.86, 0.7), fract(iD.w * 3.7) > 0.5 ? vec3(0.75, 0.2, 0.12) : vec3(0.45, 0.2, 0.6), step(0.5, fract(position.y * 22.0)));
  vQ = vec2(position.y, open);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WORM_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uLit; varying vec3 vC; varying vec2 vQ;
void main(){
  gl_FragColor = vec4(vC * uLit * (0.45 + 4.0 * vQ.x), 1.0);
  #include <fog_fragment>
}`;
// ---- the last silversides: a ribbon streaming round the lower rim of the exit ring, flank-on to the lens
const RIB_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aS; uniform float uTime; uniform vec4 uRing; varying float vF; varying vec2 vB;
void main(){
  float k = fract(aS.x + uTime * (0.05 + 0.02 * aS.y)), ang = 3.14159 * (1.0 + k);
  float R = uRing.w + 0.45 + aS.z * 1.25 + 0.22 * sin(uTime * 1.7 + aS.w * 20.0);
  vec3 P = uRing.xyz + vec3(cos(ang) * R, sin(ang) * R, (aS.w - 0.5) * 1.5 + 0.3 * sin(uTime + aS.x * 30.0) + 0.6);
  vec3 fw = vec3(-sin(ang), cos(ang), 0.0), up = vec3(cos(ang), sin(ang), 0.0);
  float sz = 0.5 * (0.7 + 0.6 * aS.y) * smoothstep(0.0, 0.07, k) * smoothstep(1.0, 0.93, k);
  float wag = sin(uTime * 12.0 + aS.z * 40.0) * smoothstep(0.1, -0.5, position.x) * 0.15;
  vec3 pos = P + (fw * position.x + up * position.y + vec3(0.0, 0.0, wag)) * sz; pos.y = min(pos.y, -0.06);
  vF = smoothstep(0.2, 1.0, sin(ang * 5.0 - uTime * 2.6 + aS.w * 2.0)); vB = position.xy;
  vec4 mvPosition = viewMatrix * vec4(pos, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RIB_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uLit, uSunCol; varying float vF; varying vec2 vB;
void main(){
  float yb = vB.y / 0.14;
  vec3 alb = mix(vec3(0.74, 0.8, 0.78), vec3(0.42, 0.55, 0.58), smoothstep(-0.9, -0.15, yb)); alb = mix(alb, vec3(0.05, 0.13, 0.15), smoothstep(0.2, 0.62, yb));
  float stripe = smoothstep(0.2, 0.0, abs(yb - 0.08));
  gl_FragColor = vec4(alb * uLit + uSunCol * vF * (0.25 + 0.75 * stripe) * 0.9, 1.0);
  #include <fog_fragment>
}`;
// ---- the hut's cooking smoke: one soft ribbon that turns to face the lens, torn by scrolling noise and leaning downwind
const SMOKE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform vec3 uBase, uWind; uniform float uTime, uH; varying vec2 vQ;
void main(){
  float h = position.y; vec3 c = uBase + vec3(0.0, h * uH, 0.0) + uWind * h * h * uH * 0.5;
  c.x += sin(uTime * 0.5 + h * 5.0) * 0.5 * h; c.z += cos(uTime * 0.37 + h * 4.0) * 0.4 * h;
  vec3 sd = normalize(cross(vec3(0.0, 1.0, 0.0), cameraPosition - c) + vec3(1e-4, 0.0, 0.0));
  vec3 wp = c + sd * position.x * mix(0.6, 12.0, pow(h, 0.8)); vQ = vec2(position.x * 2.0, h);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${TC_NOISE}
uniform vec3 uCol; uniform float uTime; varying vec2 vQ;
void main(){
  float n = tcNoise(vec3(vQ.x * 1.3, vQ.y * 7.0 - uTime * 0.55, uTime * 0.07)) * 0.6 + tcNoise(vec3(vQ.x * 3.1 + 5.0, vQ.y * 16.0 - uTime * 0.9, 2.0)) * 0.4;
  float edge = 1.0 - smoothstep(0.25, 1.0, abs(vQ.x) + (n - 0.5) * 0.7);
  float a = edge * smoothstep(0.0, 0.04, vQ.y) * (1.0 - vQ.y * vQ.y) * smoothstep(0.15, 0.7, n + 0.4 * (1.0 - vQ.y)) * 0.85;
  gl_FragColor = vec4(uCol * (0.8 + 0.35 * n), a);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ per-visit variations
function pickLook(ctx) {
  const vr = ctx.rng.fork('look'), vary = ctx.vary || {};
  let hour = vary.hour === 'day' || vary.hour === 'golden' || vary.hour === 'night' ? vary.hour : vary.hour === 'dawn' ? 'golden' : null;
  const hr = vr(); if (!hour) hour = hr < 0.14 ? 'night' : hr < 0.4 ? 'golden' : 'day';
  const wr = vr();
  const weather = hour === 'day' ? (wr < 0.25 ? 'squall' : wr < 0.5 ? 'calm' : 'shower') : (wr < 0.45 ? 'calm' : 'shower');
  const ebb = vr() > 0.62;
  const bird = vr.pick(['ibis', 'ibis', 'spoonbill', 'egret']), shark = vr.pick(['lemon', 'lemon', 'blacktip']), big = vr.pick(['manatee', 'manatee', 'turtle', 'rays']);
  const accent = { ibis: '#E8202A', spoonbill: '#F08BA6', egret: '#F6F2E6' }[bird];
  const L = {
    hour, weather, ebb, bird, shark, big, accent, rare: !!vary.rare, density: clamp(vary.density ?? 1, 0.7, 1.3),
    palette: ['#8FD3F0', '#2E7D4F', '#B9C94A', '#6B4A35', '#C9922E', '#2FA89A', accent],
    sky: { preset: 'day', zenith: '#2F7FD0', mid: '#4C9FE2', horizon: '#86CEF0', horizonPow: 2.6, scatter: 0.16, sunElevation: 65, sunAzimuth: -22, clouds: false, clouds2: { coverage: 0.35 } },
    hazeDen: [0.011, 0.0015], rig: { intensity: 1, ambient: 1, bounce: 0.4 },
    tea: new THREE.Color(0.25, 0.12, 0.024), mix: new THREE.Color(0.15, 0.25, 0.07), coin: [0.34, 1.3], shaft: 0.5, turq: new THREE.Color(0.03, 0.36, 0.31), seaDen: [0.125, 0.018],
    seaSun: new THREE.Color(1.0, 0.72, 0.36), seaSunLag: new THREE.Color(0.8, 1.0, 0.95), rayCol: new THREE.Color(1.0, 0.62, 0.22), rayLag: new THREE.Color(0.55, 0.9, 0.8),
    tint: new THREE.Color(1.0, 1.0, 1.0), bio: 0, rain: weather === 'squall' ? 1 : weather === 'shower' ? 0.75 : 0, chop: weather === 'calm' ? 0.35 : weather === 'squall' ? 1.9 : 1,
    post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.6, threshold: 0.9 }, grade: { saturation: 1.1, contrast: 1.05, tint: '#fffaf0', shadowTint: '#03100c', vignette: 0.26, grain: 0.02, aberration: 0 } },
    portal: '#bff6ea', title: 'The Tideline Cloister',
  };
  if (hour === 'golden') {
    // a sun that keeps a warm core instead of a clipped white blob
    Object.assign(L.sky, { preset: 'goldenHour', zenith: undefined, horizon: undefined, sunElevation: 14, sunAzimuth: -34, sunColor: '#ff9c40', sunIntensity: 3.0, sunSize: 1.6, sunGlow: 0.36 });
    L.mix.setRGB(0.2, 0.23, 0.05); L.coin = [0.45, 2.1]; L.shaft = 1;
    delete L.sky.zenith; delete L.sky.horizon;
    L.palette[2] = '#C9C24A'; L.tea.setRGB(0.32, 0.128, 0.02); L.turq.setRGB(0.05, 0.3, 0.27); L.seaSun.setRGB(1.0, 0.6, 0.25); L.seaSunLag.setRGB(1.0, 0.85, 0.6);
    L.rayCol.setRGB(1.0, 0.5, 0.15); L.rayLag.setRGB(0.9, 0.75, 0.45); L.post.grade.tint = '#fff0d8'; L.portal = '#ffe6b0'; L.title = 'The Tideline Cloister, Roosting Hour';
  } else if (hour === 'night') {
    L.sky = { preset: 'night', bodies: [{ elevation: 46, azimuth: -24, size: 2.6, phase: 1, glow: 0.7, intensity: 1.5 }], key: 0, clouds: false, bake: true, renderer: ctx.renderer };
    L.rig = { intensity: 1.5, ambient: 2.1, bounce: 0.5 }; L.hazeDen = [0.009, 0.0016];
    L.tea.setRGB(0.012, 0.04, 0.058); L.mix.setRGB(0.01, 0.04, 0.058); L.shaft = 0.12; L.turq.setRGB(0.008, 0.04, 0.058); L.seaSun.setRGB(0.45, 0.6, 0.8); L.seaSunLag.setRGB(0.4, 0.7, 0.9);
    L.rayCol.setRGB(0.12, 0.2, 0.3); L.rayLag.setRGB(0.12, 0.3, 0.4); L.bio = 1; L.portal = '#8fd8ff'; L.title = 'The Tideline Cloister, Full Moon';
    L.post = { exposure: 1.3, bloom: { strength: 0.6, radius: 0.7, threshold: 0.8 }, grade: { saturation: 1.0, contrast: 1.06, tint: '#e6f0ff', shadowTint: '#02060c', vignette: 0.34, grain: 0.03, aberration: 0 } };
  } else if (weather === 'squall') {
    L.sky = { preset: 'overcast', sunElevation: 60, sunAzimuth: -22 };
    L.hazeDen = [0.013, 0.0042]; L.tea.multiplyScalar(0.6); L.mix.multiplyScalar(0.6); L.shaft = 0.15; L.turq.setRGB(0.035, 0.2, 0.19); L.seaSun.multiplyScalar(0.6); L.seaSunLag.multiplyScalar(0.6);
    L.rayCol.multiplyScalar(0.3); L.rayLag.multiplyScalar(0.3); L.post.grade.saturation = 0.95; L.post.grade.tint = '#eef4f2'; L.title = 'The Tideline Cloister, Squall';
  }
  return L;
}

// ================================================================== world
export default {
  id: 'tideline-cloister',
  name: 'The Tideline Cloister',
  category: 'ocean',
  media: ['water', 'underwater'],
  weirdness: 0.05,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, renderer = ctx.renderer;
    const detail = ctx.quality?.detail ?? 1;
    const L = pickLook(ctx), DEN = L.density * detail;
    const pal = L.palette.map((h) => new THREE.Color(h));
    const [cSky, cShade, cLeaf, cRoot, cGold, cTurq, cAccent] = pal;
    const night = L.hour === 'night', squall = L.weather === 'squall';

    const scene = new THREE.Scene();
    const air = new THREE.Group(), sea = new THREE.Group(), both = new THREE.Group();
    air.name = 'air'; sea.name = 'sea'; both.name = 'both'; scene.add(air, sea, both);
    const updaters = [];          // (dt, time, camera, u) for kit pieces
    const disposables = [];

    // ---------------------------------------------------------------- sky and light
    const sky = makeSky({ rng, ...L.sky });
    air.add(sky.object); await ctx.yield();
    const rig = makeLightRig(sky, L.rig); both.add(rig.object); await ctx.yield();
    const sunDir = sky.lightDirection.clone().normalize();
    const sunCol = sky.lightColor.clone();
    const cHor = sky.horizonColor.clone(), cZen = sky.zenithColor.clone();
    const amb = sky.ambientColor.clone().multiplyScalar(night ? 0.9 : 0.55);
    const hazeTunnel = cLeaf.clone().lerp(cHor, 0.5).multiplyScalar(night ? 0.05 : squall ? 0.55 : 0.8);
    if (L.hour === 'golden') hazeTunnel.lerp(new THREE.Color('#e8a84a'), 0.45);
    if (night) hazeTunnel.set(0.02, 0.034, 0.05);
    const hazeLagoon = sky.fogColor.clone();
    const fog = new THREE.FogExp2(hazeTunnel.clone(), L.hazeDen[0]); scene.fog = fog;
    const airFog = new THREE.Color(), seaFog = new THREE.Color(), seaBg = new THREE.Color();
    const cloudFields = [];
    if (!squall) {
      const cr = rng.fork('clouds'), at = [];
      const n = night ? 9 : 24;
      for (let i = 0; i < n; i++) { const a = cr.range(-2.2, 2.2), r = cr.range(220, 700); at.push([Math.sin(a) * r, cr.range(95, 190), -40 - Math.cos(a) * r, cr.range(70, 150)]); }
      if (L.weather === 'shower') at.push([18, 135, -20, 210]);
      // five fields across the sky, left to right and growing (the first calls run cold), so that none is one long build step
      at.sort((a, b) => a[0] - b[0]); const cut = [0, 0.08, 0.2, 0.4, 0.68, 1].map((f) => Math.round(at.length * f));
      for (let k = 0; k < 5; k++) {
        const part = at.slice(cut[k], cut[k + 1]); if (!part.length) continue;
        await ctx.yield();
        const cf = makeCloudField({ rng, sky, at: part, puffs: 26, wind: [-3.2, 0, 0.5], height: 0.5, opacity: 0.95 });
        air.add(cf.object); cloudFields.push(cf);
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- layout
    const lr = rng.fork('layout');
    const ampS = lr.sign() * lr.range(9, 14), a1 = lr.range(0, 6.28), a2 = lr.range(0, 6.28);
    const chX = (z) => ampS * Math.sin(((z - 145) / 200) * Math.PI * 2) * smoothstep(145, 185, z);
    const halfW = (z) => 3.6 + 1.0 * noise.n2(z * 0.045, 7.3) + 0.45 * noise.n2(z * 0.17, 1.1);
    const ringR = (th) => 185 + 14 * Math.sin(3 * th + a1) + 9 * Math.sin(7 * th + a2);
    const floorY = (x, z) => {
      const r = Math.hypot(x, z), nz = noise.n2(x * 0.21, z * 0.21);
      const front = lerp(-7.4, -2.9, smoothstep(50, 132, r)), back = -7.4 - 1.8 * smoothstep(46, 72, r);
      let lg = lerp(back, front, smoothstep(-30, 30, z)); lg = lerp(-8.7, lg, smoothstep(43, 48, r)) + 0.15 * nz;
      const k = smoothstep(MOUTH_Z - 25, MOUTH_Z + 5, z); if (k <= 0) return lg;
      const lat = Math.abs(x - chX(z)), w = halfW(z);
      const ch = -3.0 + 0.95 * smoothstep(1.2, w + 2.5, lat) + 1.15 * smoothstep(w + 3.5, w + 10, lat) + 0.12 * nz;
      return lerp(lg, ch, k);
    };
    const pts = [];
    for (let z = 345; z >= 145; z -= 20) pts.push([chX(z), EYE, z]);
    for (const z of [120, 92, 62, 42, 26, 14, 0, -9, -28, -48, -68]) pts.push([0, EYE, z]);
    const path = makePath(pts);
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const uMouth = uAt(0, MOUTH_Z), uDome = uAt(0, 27), uLintel = uAt(0, 14.3), uTrunk = uAt(0, 0), uOut = uAt(0, -27);
    const uSurf = 0.08, uKing = 0.24;
    const _pp = new V3(), _pt = new V3();
    // a point beside the path: lateral metres to the right of travel
    const NT = 420, tabP = new Float32Array((NT + 1) * 2), tabT = new Float32Array((NT + 1) * 2);
    for (let i = 0; i <= NT; i++) { const u = -0.05 + (i / NT) * 1.12; path.pointAt(u, _pp); path.tangentAt(clamp(u, 0, 1), _pt); const tl = Math.hypot(_pt.x, _pt.z) || 1; tabP[i * 2] = _pp.x; tabP[i * 2 + 1] = _pp.z; tabT[i * 2] = _pt.x / tl; tabT[i * 2 + 1] = _pt.z / tl; }
    const beside = (u, side, y, out = new V3()) => {
      const f = clamp((u + 0.05) / 1.12, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)), k = f - i;
      const px = lerp(tabP[i * 2], tabP[i * 2 + 2], k), pz = lerp(tabP[i * 2 + 1], tabP[i * 2 + 3], k), tx = lerp(tabT[i * 2], tabT[i * 2 + 2], k), tz = lerp(tabT[i * 2 + 1], tabT[i * 2 + 3], k);
      return out.set(px - tz * side, y, pz + tx * side);
    };

    // ---------------------------------------------------------------- the Mother Tree
    const hero = await buildHero(ctx, { palette: L.palette, water: false, floor: true, sunDir, underHaze: 0, tide: L.ebb ? 0.9 : 0, strike: 0, floorFade: 0.15 });
    hero.setAvoid(null, 2.5);
    both.add(hero.object);
    const HU = hero.uniforms;
    hero.setLight({ sunColor: night ? new THREE.Color(0.55, 0.8, 1.3) : sunCol.clone().multiplyScalar(L.hour === 'golden' ? 1.9 : 2.2), absorb: night ? new THREE.Color(0.35, 0.6, 0.85) : new THREE.Color(0.42, 0.86, 0.84) });
    await ctx.yield();

    HU.uHcForest.value = MOUTH_Z; HU.uHcSil.value = night ? 0.4 : 0.5; HU.uHcCoin.value.set(L.coin[0], L.coin[1]); HU.uLeafK.value.set(0.1, night ? 0.25 : 1, 0.85);
    // shared uniform blocks for patched materials outside the tree (their own absorption; canopy shade set per material).
    // Materials patched with the hero's own keys and option blocks ('wood', 'leaf', 'pod', 'sway', 'sponge') reuse its programs.
    const uCanopy = { value: 1 };
    const UC = { ...HU, uHcAbsorb: { value: night ? new THREE.Color(0.4, 0.55, 0.6) : new THREE.Color(0.95, 0.62, 0.3) }, uHcHaze: { value: new THREE.Vector4(0, 0, 0, 0) }, uTcCanopy: uCanopy };
    const UL = { ...HU, uHcHaze: { value: new THREE.Vector4(0, 0, 0, 0) }, uTcCanopy: uCanopy, uHcShadeK: { value: 0 } };
    const PRE_UNI = 'uniform float uTcCanopy;\n#define HC_AMT(p) uTcCanopy\n';
    const tmpC = new THREE.Color();
    const bark = cRoot.clone().lerp(new THREE.Color('#7a3f2c'), 0.35), barkPale = bark.clone().lerp(new THREE.Color('#b9a58a'), 0.45), barkDark = bark.clone().multiplyScalar(0.5);
    const barkCol = (seed, top) => (i, j, out) => {
      const k = 0.5 + 0.5 * Math.sin(seed * 31 + i * 1.7 + j * 2.1);
      tmpC.copy(barkDark).lerp(bark, 0.35 + 0.65 * k).lerp(barkPale, top * (0.3 + 0.4 * ((j * 7 + i) % 3 === 0 ? 1 : 0.3)));
      out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b;
    };
    const woodMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }), {
      ...UC, uSpA: { value: cGold.clone().lerp(new THREE.Color('#ff7a1a'), 0.35) }, uSpB: { value: new THREE.Color('#7b3fa8') },
    }, 'wood', WOOD_OPTS);

    // ---------------------------------------------------------------- the channel: red mangroves on prop roots
    const mr = rng.fork('mangrove');
    const NCH = 6, chunkB = []; for (let i = 0; i < NCH; i++) chunkB.push(makeBuilder());
    const chunkOf = (z) => clamp(Math.floor((358 - z) / 38), 0, NCH - 1);
    const crabSpots = [], perches = [], clumps = [], underPts = [];
    const latOf = (x, z) => x - chX(z);
    const channelOk = (x, z) => { if (z < MOUTH_Z - 6) return Math.hypot(x, z) > 60 && Math.abs(x) > 9; const l = latOf(x, z); return l > 2.9 || l < -2.3; };
    const _ta = new V3(), _tb = new V3();
    function addRoot(B, ctrl, o) {
      // curvature-adaptive rings: they crowd into the bends and below the line, so a leg is a round curving root, not two planks
      const NF = 30, fine = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getPoints(NF), cost = [0], pts = [];
      if (!o.free) for (const p of fine) if (p.y < 7 && !channelOk(p.x, p.z)) return false;
      for (let i = 1; i <= NF; i++) {
        const len = fine[i].distanceTo(fine[i - 1]); let ang = 0;
        if (i < NF) { _ta.subVectors(fine[i], fine[i - 1]).normalize(); _tb.subVectors(fine[i + 1], fine[i]).normalize(); ang = Math.acos(clamp(_ta.dot(_tb), -1, 1)); }
        cost.push(cost[i - 1] + len * (fine[i].y < 0.4 ? 0.8 : 0.4) + ang * 2.0);
      }
      for (let k = 0, j = 0; k <= o.n; k++) {
        const target = cost[NF] * k / o.n; while (j < NF - 1 && cost[j + 1] < target) j++;
        pts.push(fine[j].clone().lerp(fine[j + 1], clamp((target - cost[j]) / Math.max(1e-6, cost[j + 1] - cost[j]), 0, 1)));
      }
      const n = pts.length;
      let Ls = 0; const ss = [0]; for (let i = 1; i < n; i++) { Ls += pts[i].distanceTo(pts[i - 1]); ss.push(Ls); }
      const sp = mr.range(1.1, 1.9), ph = mr(), seed = mr.range(0, 100), rad = new Array(n);
      for (let i = 0; i < n; i++) {
        const t = ss[i] / Ls, y = pts[i].y;
        let r = o.r0 * (1 - 0.42 * t) * (1 + 0.5 * Math.max(0, 1 - t * 8));
        if (o.tip) r *= 1 - 0.88 * smoothstep(o.blunt ? 0.9 : 0.72, 1, t);                               // free-hanging: tapers to a point
        else r *= 1 + 0.8 * smoothstep(0.88, 1, t) * (o.flare ?? 1);                     // planted: the foot spreads into the sand
        r *= 1 + 0.3 * Math.pow(Math.max(0, Math.cos((ss[i] / sp + ph) * 6.283)), 4);    // knuckles
        r *= 1 + (o.swell ?? 0.12) * smoothstep(0.2, -1.2, y);
        rad[i] = Math.max(0.018, r);
        if (o.front && y < -0.45 && t < 0.96) underPts.push({ p: pts[i], r: rad[i] });
      }
      tube(B, pts, (i) => rad[i], o.sides, barkCol(seed, 0.35), (i, j, p) => 1 + 0.12 * noise.n3(p.x * 1.3 + seed, p.y * 1.3, p.z * 1.3 + j * 0.7));
      return { pts, rad };
    }
    // where a leg can plant its foot: as far along (ux, uz) as the clear lane beside the lens allows
    const footAt = (ex, ez, ux, uz, want) => { for (const k of [1, 0.6, 0.3, 0]) if (channelOk(ex + ux * want * k * 1.15, ez + uz * want * k * 1.15)) return want * k; return 0; };
    // a stilt: a second root springing from an arch, looping along the bank and plunging to the sand beside its parent
    function stilt(B, p0, nx, nz, r0, big) {
      const sd = mr.sign(), L = big ? mr.range(1.3, 2.3) : mr.range(0.7, 1.4), inw = mr.range(0.1, 0.6);
      const ex = p0.x + nx * inw, ez = p0.z + sd * L + nz * inw;
      if (!channelOk(ex, ez) || !channelOk(lerp(p0.x, ex, 0.5), lerp(p0.z, ez, 0.5))) return null;
      const spl = footAt(ex, ez, nx, nz, mr.range(0.2, 0.6)), fx = ex + nx * spl, fz = ez + nz * spl + sd * mr.range(0.1, 0.5), fy = floorY(fx, fz) - 0.3;
      return addRoot(B, [p0.clone(), new V3(lerp(p0.x, ex, 0.4), p0.y + mr.range(0.1, 0.45), lerp(p0.z, ez, 0.4)), new V3(lerp(p0.x, ex, 0.86), p0.y * 0.55, lerp(p0.z, ez, 0.86)), new V3(ex, 0, ez),
        new V3(lerp(ex, fx, 0.35), fy * 0.45, lerp(ez, fz, 0.35)), new V3(lerp(ex, fx, 0.8), fy * 0.85, lerp(ez, fz, 0.8)), new V3(fx, fy, fz)],
      { n: big ? 12 : 8, sides: big ? 6 : 4, r0, front: true, flare: 1.1 });
    }
    function mangrove(tx, tz, nx, nz, o) {
      const B = chunkB[chunkOf(tz)], y0 = mr.range(2.3, 3.9), H = mr.range(8, 11.5) * (o.tall ?? 1);
      const lx = nx * mr.range(0.4, 1.8) + mr.range(-0.6, 0.6), lz = nz * mr.range(0.4, 1.8) + mr.range(-0.6, 0.6), tr = mr.range(0.2, 0.34);
      const tp = []; for (let i = 0; i <= 4; i++) { const f = i / 4; tp.push(new V3(tx + lx * f * f + Math.sin(f * 5 + tx) * 0.2, lerp(y0 - 0.3, H, f), tz + lz * f * f)); }
      tube(B, tp, (i) => tr * (1.25 - 0.6 * i / 4), 5, barkCol(tx, 0.5), (i, j, p) => 1 + 0.15 * noise.n3(p.x + j, p.y * 0.5, p.z));
      clumps.push({ c: new V3(tx + lx + nx * 1.2, H + mr.range(-0.5, 1.2), tz + lz + nz * 1.2), r: mr.range(2.7, 3.7) });
      if (o.front) clumps.push({ c: new V3(tx + nx * mr.range(2.5, 4.5), mr.range(6.8, 8.6), tz + nz * mr.range(2.5, 4.5) + mr.range(-1.5, 1.5)), r: mr.range(2.2, 3) });
      const nr = o.roots, a0 = Math.atan2(nx, nz);
      for (let k = 0; k < nr; k++) {
        const a = a0 + ((k + 0.5) / nr - 0.5) * 2.5 + mr.range(-0.25, 0.25), Lr = o.reach * mr.range(0.75, 1.25) * (1 - 0.35 * Math.abs((k + 0.5) / nr - 0.5));
        const dx = Math.sin(a) * Lr, dz = Math.cos(a) * Lr, ex = tx + dx, ez = tz + dz;
        const px = -dz / Lr, pz = dx / Lr, w = mr.range(-1, 1), kneeY = mr.range(0.8, 1.9), apex = y0 + mr.range(-0.2, 0.9);
        // below the line the leg keeps the arch's own curve: on inward and down, splaying to a foot in the sand
        const ux = dx / Lr, uz = dz / Lr, spl = footAt(ex, ez, ux, uz, mr.range(0.45, 1.05)), jx = mr.range(-0.2, 0.2), jz = mr.range(-0.3, 0.3);
        const fx = ex + ux * spl + jx, fz = ez + uz * spl + jz, fy = floorY(fx, fz) - 0.3;
        const res = addRoot(B, [new V3(tx, y0, tz), new V3(tx + dx * 0.38 + px * w * 0.5, apex, tz + dz * 0.38 + pz * w * 0.5),
          new V3(tx + dx * 0.8 - px * w * 0.25, lerp(apex, kneeY, 0.6), tz + dz * 0.8 - pz * w * 0.25), new V3(tx + dx * 0.96, kneeY * 0.7, tz + dz * 0.96),
          new V3(ex, 0, ez), new V3(lerp(ex, fx, 0.3), fy * 0.42, lerp(ez, fz, 0.3)), new V3(lerp(ex, fx, 0.78), fy * 0.84, lerp(ez, fz, 0.78)), new V3(fx, fy, fz)],
        { n: o.front ? 12 : 5, sides: o.front ? 6 : 4, r0: mr.range(o.r0, o.r0 * 1.5), front: o.front });
        if (res && o.front) {
          const np = res.pts.length;
          for (let i = 1; i < np; i++) { const p = res.pts[i], q = res.pts[i - 1];
            if (q.y > 0.3 && p.y <= 0.3) { const f = (q.y - 0.3) / Math.max(1e-3, q.y - p.y); crabSpots.push({ x: lerp(q.x, p.x, f) + nx * res.rad[i] * 0.9, y: 0.3, z: lerp(q.z, p.z, f) + nz * res.rad[i] * 0.9, a: a0 }); } }
          let ai = 1; for (let i = 1; i < np; i++) if (res.pts[i].y > res.pts[ai].y) ai = i;
          const ap = res.pts[Math.min(np - 1, ai + 1)]; if (ap.y > 1.2 && ap.y < 4) perches.push({ x: ap.x, y: ap.y + res.rad[ai] * 0.9, z: ap.z });
          // one in two arches throws a stilt root that plants beside it; one in six drops a thin aerial rootlet that has not reached the water yet
          const pick = mr();
          if (pick < 0.38) { let si = ai; for (let i = ai; i < np; i++) if (res.pts[i].y > 0.75) si = i; const sp0 = res.pts[si]; if (sp0.y > 0.75 && sp0.y < 2.6) stilt(B, sp0, ux, uz, res.rad[si] * 0.72, false); }
          else if (pick < 0.55) {
            const sp0 = res.pts[Math.min(np - 1, ai + 1)], ex2 = sp0.x + mr.range(-0.4, 0.4), ez2 = sp0.z + mr.range(-0.5, 0.5);
            if (sp0.y > 1.3 && channelOk(ex2, ez2)) addRoot(B, [sp0.clone(), new V3(lerp(sp0.x, ex2, 0.6), sp0.y * 0.7, lerp(sp0.z, ez2, 0.6)), new V3(ex2, sp0.y * 0.3, ez2), new V3(ex2 + 0.05, mr.range(0.15, 0.5), ez2)], { n: 4, sides: 4, r0: mr.range(0.03, 0.045), tip: true });
          }
        }
      }
    }
    // rows along both banks (front row has detailed roots; a thinner row behind), then the fringe facing the lagoon
    let nTree = 0;
    for (const s of [-1, 1]) {
      for (let z = 358; z > MOUTH_Z - 4; z -= mr.range(2.0, 2.9)) {
        const w = halfW(z), lat = w + mr.range(2.4, 4.6);
        mangrove(chX(z) + s * lat, z, -s, 0, { front: true, roots: mr.int(4, 5), reach: lat - w + 0.9, r0: 0.1 });
        await ctx.yield();
      }
      for (let z = 357; z > MOUTH_Z; z -= mr.range(3.8, 5.4)) {
        const w = halfW(z), lat = w + mr.range(6.5, 10);
        mangrove(chX(z) + s * lat, z, -s, 0, { front: false, roots: 3, reach: mr.range(2.5, 4), r0: 0.07, tall: 1.15 });
        if ((++nTree & 3) === 0) await ctx.yield();
      }
      for (let arc = 14; arc < 64; arc += mr.range(2.4, 3.4)) {
        const th = s * arc / 185, R = ringR(th) + mr.range(0.5, 4), nx = -Math.sin(th), nz = -Math.cos(th);
        mangrove(LAG.x + Math.sin(th) * R, LAG.z + Math.cos(th) * R, nx, nz, { front: arc < 40, roots: 4, reach: mr.range(3, 4.6), r0: 0.085 });
        if ((++nTree & 1) === 0) await ctx.yield();
      }
    }
    await ctx.yield();
    // a framing colonnade of thick knuckled legs close to the lens: seven a side through the opening 60 m, then one
    // every few metres down the tunnel (more on the left, where the canoe is not)
    const bigLegs = [];
    const bigRoot = (z, s, o = {}) => {
      const w = halfW(z), cx = chX(z), lim = s < 0 ? 2.5 : 3.1, lat = o.lat ?? (s < 0 ? mr.range(3.0, 4.5) : mr.range(3.6, 5.0));
      const ex = cx + s * lat, ez = z + mr.range(-0.8, 0.8), spl = Math.min(mr.range(0.45, 0.95), Math.max(0, lat - lim - 0.15)) * (o.splay ?? 1), fz = ez + mr.range(-0.5, 0.5);
      const fx = chX(fz) + s * Math.max(lim + 0.1, lat - spl), fy = floorY(fx, fz) - 0.3;
      const tx = cx + s * (w + mr.range(2.6, 4)), y0 = o.y0 ?? mr.range(3.2, 4.6), tz = z + mr.range(-2.5, 2.5), B = chunkB[chunkOf(z)];
      const res = addRoot(B, [new V3(tx, y0, tz), new V3(lerp(tx, ex, 0.45), y0 + mr.range(0.1, 0.7), lerp(tz, ez, 0.45)), new V3(lerp(tx, ex, 0.85), Math.min(1.5, y0 * 0.6), lerp(tz, ez, 0.85)),
        new V3(ex, 0, ez), new V3(lerp(ex, fx, 0.28), fy * 0.4, lerp(ez, fz, 0.28)), new V3(lerp(ex, fx, 0.75), fy * 0.82, lerp(ez, fz, 0.75)), new V3(fx, fy, fz)],
      { n: 16, sides: 8, r0: o.r0 ?? mr.range(0.17, 0.25), front: true, flare: 1.25 });
      if (!res) return;
      for (let i = 0; i < res.pts.length; i++) if (res.pts[i].y < -0.3) bigLegs.push({ p: res.pts[i], r: res.rad[i], top: i > 0 && res.pts[i - 1].y >= -0.3 });
      if (o.plain) return;
      for (let k = 0, i0 = 2; k < 2; k++) {      // two stilts loop off every big arch, one up-channel and one down
        let si = -1; for (let i = i0; i < res.pts.length; i++) if (res.pts[i].y > 0.9 && res.pts[i].y < 2.8) { si = i; break; }
        if (si < 0) break; i0 = si + 2;
        const st = stilt(B, res.pts[si], -s, 0, res.rad[si] * 0.7, true);
        if (st) for (let i = 0; i < st.pts.length; i++) if (st.pts[i].y < -0.3) bigLegs.push({ p: st.pts[i], r: st.rad[i], top: false });
      }
    };
    for (const s of [-1, 1]) {
      for (let z = 338; z > 283; z -= mr.range(5.5, 8)) { bigRoot(z, s); await ctx.yield(); }
      for (let z = 276; z > MOUTH_Z + 6; z -= s < 0 ? mr.range(7, 11) : mr.range(11, 16)) { bigRoot(z, s); await ctx.yield(); }
      // the ribs of the drowned tunnel: long buttress roots that leave the bank low, cross the channel's edge under water and
      // plant at the rim of the clear lane, so the opening is a nave of leaning ribs in the lower half as well
      for (let z = 341, k = 0; z > 279; z -= mr.range(6.5, 9), k++) bigRoot(z + (s < 0 ? 0 : 3.5), s, { lat: (s < 0 ? 3.9 : 4.4) + mr.range(0, 1.2), y0: mr.range(1.5, 2.4), r0: mr.range(0.12, 0.17), splay: 1.6, plain: true });
      await ctx.yield();
    }
    await ctx.yield();
    // the ribs of the vault: boughs leaning right across the channel, high above the lens
    for (let z = 352, s = 1; z > MOUTH_Z + 2; z -= mr.range(6.5, 10), s = -s) {
      const w = halfW(z), cx = chX(z), x0 = cx + s * (w + 3.4), z1 = z + mr.range(-3, 3);
      const ctrl = [new V3(x0, 3.6, z), new V3(cx + s * (w + 1), 6.6, lerp(z, z1, 0.3)), new V3(cx + s * 0.5, mr.range(8.3, 9.4), lerp(z, z1, 0.65)), new V3(cx - s * mr.range(2.5, 5), mr.range(7.6, 8.8), z1)];
      const bp = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getPoints(8);
      tube(chunkB[chunkOf(z)], bp, (i) => lerp(0.3, 0.1, i / 8), 6, barkCol(z, 0.6), (i, j, p) => 1 + 0.14 * noise.n3(p.x, p.y, p.z + j));
      for (const k of [4, 6, 8]) clumps.push({ c: bp[k].clone().add(new V3(mr.range(-1, 1), mr.range(0.2, 1.4), mr.range(-1.5, 1.5))), r: mr.range(2.4, 3.3) });
    }
    // one low root slung right across the channel: the lens glides under it, a second leg and a fringe of rootlets hang from it
    const GAP_Z = 215, SLING_Z = 250;
    {
      const z = SLING_Z, cx = (zz) => chX(zz), w = halfW(z), B = chunkB[chunkOf(z)];
      const xl = cx(z - 1.8) - 4.3, fyl = floorY(xl - 0.4, z - 2) - 0.3;
      const res = addRoot(B, [new V3(cx(z + 1.6) + w + 4.2, 4.3, z + 1.6), new V3(cx(z + 1) + 4.3, 2.9, z + 1), new V3(cx(z + 0.4) + 2.0, 2.05, z + 0.4), new V3(cx(z) - 0.4, 1.75, z), new V3(cx(z - 0.8) - 2.6, 1.5, z - 0.8),
        new V3(xl + 0.5, 0.75, z - 1.5), new V3(xl, 0, z - 1.8), new V3(xl - 0.2, fyl * 0.5, z - 1.9), new V3(xl - 0.4, fyl, z - 2)], { n: 22, sides: 8, r0: 0.21, front: true, free: true, flare: 1.25 });
      for (let i = 0; i < res.pts.length; i++) if (res.pts[i].y < -0.3) bigLegs.push({ p: res.pts[i], r: res.rad[i], top: false });
      const at = (f) => res.pts[Math.round(f * (res.pts.length - 1))];
      { const p0 = at(0.2), ex = cx(z + 2.4) + 3.5, ez = z + 2.4, fy = floorY(ex + 0.3, ez) - 0.3;      // the right-hand leg
        addRoot(B, [p0.clone(), new V3(lerp(p0.x, ex, 0.5), p0.y - 0.3, lerp(p0.z, ez, 0.5)), new V3(ex, 0.9, ez), new V3(ex, 0, ez + 0.1), new V3(ex + 0.2, fy * 0.5, ez + 0.2), new V3(ex + 0.3, fy, ez + 0.2)], { n: 12, sides: 6, r0: 0.12, front: true, free: true, flare: 1.2 }); }
      for (const [f, len] of [[0.3, 0.7], [0.36, 1.25], [0.46, 0.5], [0.52, 0.8], [0.58, 0.45], [0.64, 0.9]]) {      // aerial rootlets that have not reached the water
        const p0 = at(f), dx = mr.range(-0.15, 0.15), r0 = mr.range(0.03, 0.045), lat = p0.x - chX(p0.z), endY = Math.max(lat > 0.6 && lat < 3 ? 1.4 : 0.55, p0.y - len);      // clear of our prow
        if (p0.y - endY > 0.2) addRoot(B, [p0.clone(), new V3(p0.x + dx * 0.4, lerp(p0.y, endY, 0.45), p0.z + 0.05), new V3(p0.x + dx, endY, p0.z + 0.1)], { n: 4, sides: 4, r0, tip: true, free: true });
      }
    }
    // fish-trap stakes down the right-hand side, a cormorant's perch among them
    const stakes = [];
    for (let i = 0; i < 20; i++) {
      const u = 0.27 + i * 0.0032, p = beside(u, 3.05 + 0.22 * Math.sin(i * 1.7), 0), fy = floorY(p.x, p.z), top = 1.1 + 0.35 * mr();
      const lean = mr.range(-0.12, 0.12), sp = [new V3(p.x, fy - 0.2, p.z), new V3(p.x + lean * 0.4, 0, p.z), new V3(p.x + lean, top, p.z + lean * 0.5)];
      tube(chunkB[chunkOf(p.z)], sp, () => 0.045, 4, (a, b, out) => { out[0] = 0.33; out[1] = 0.27; out[2] = 0.2; });
      stakes.push(sp[2]);
    }
    const channelMeshes = [];
    for (let i = 0; i < NCH; i++) { const m = new THREE.Mesh(await finishAsync(chunkB[i], ctx), woodMat); m.name = 'channel-wood-' + i; both.add(m); channelMeshes.push(m); await ctx.yield(); }
    // ---- the chandelier comes to the lens: a dozen aerial roots hang from the vault into the nave, 3.5-6 m either side of the
    // line the dunk takes through the bait ball, thin in the air and thick, knuckled and sponge-furred below
    const dunkPts = [];
    {
      const D = makeBuilder(), dr = rng.fork('dunk');
      for (let i = 0; i < 18; i++) {
        const sd = i % 2 ? 1 : -1, x = sd * (sd > 0 ? dr.range(4.5, 6.7) : dr.range(4.0, 6.4)), z = lerp(24, -23, (i + dr.range(0, 0.8)) / 18), dep = dr.range(3.4, 5.4);
        const y0 = dr.range(7.4, 9.2), x0 = x * dr.range(1.25, 1.6), z0 = z + dr.range(-1.5, 1.5);
        const res = addRoot(D, [new V3(x0, y0, z0), new V3(lerp(x0, x, 0.55), y0 * 0.62, lerp(z0, z, 0.6)), new V3(x + sd * 0.1, 2.2, z), new V3(x, 0, z), new V3(x + dr.range(0.05, 0.3), -dep * 0.55, z + dr.range(-0.2, 0.2)), new V3(x + dr.range(0.2, 0.6), -dep, z + dr.range(-0.3, 0.3))],
          { n: 14, sides: 7, r0: dr.range(0.1, 0.14), tip: true, free: true, swell: 1.15, blunt: true });
        for (let k = 0; k < res.pts.length; k++) if (res.pts[k].y < -0.4 && res.pts[k].y > -dep + 0.5) dunkPts.push({ p: res.pts[k], r: res.rad[k] });
      }
      const m = new THREE.Mesh(finish(D), woodMat); m.name = 'dunk-roots'; both.add(m);
    }
    await ctx.yield();

    // ---- canopy: leaf-sprig cards on every clump (air only); at GAP_Z the vault is open to the sky
    for (let i = clumps.length - 1; i >= 0; i--) { const c = clumps[i].c; if (Math.hypot(c.x - chX(GAP_Z), c.z - GAP_Z) < 7.2) clumps.splice(i, 1); }
    const leafTex = makeLeafTexture(rng.fork('leaf')); await ctx.yield();
    {
      const nCards = Math.round(3000 * DEN); let rsum = 0; for (const cl of clumps) rsum += cl.r * cl.r;
      const iPos = [], iQuat = [], iData = [], iCol = [], iN = [];
      const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), nrm = new V3(), dir = new V3(), Z = new V3(0, 0, 1), col = new THREE.Color();
      const warm = cLeaf.clone().lerp(cGold, 0.35), deep = cShade.clone().multiplyScalar(0.55);
      let ci = 0;
      for (const cl of clumps) {
        if ((++ci & 31) === 0) await ctx.yield();
        const cnt = Math.round(nCards * cl.r * cl.r / rsum);
        for (let i = 0; i < cnt; i++) {
          dir.set(mr.gauss(), mr.gauss(), mr.gauss()).normalize();
          const rr = cl.r * mr.range(0.5, 1.1);
          const x = cl.c.x + dir.x * rr, y = Math.max(6.9, cl.c.y + dir.y * rr * 0.6), z = cl.c.z + dir.z * rr;
          iPos.push(x, y, z);
          nrm.set(dir.x + mr.range(-0.7, 0.7), dir.y + mr.range(-0.5, 0.9), dir.z + mr.range(-0.7, 0.7)).normalize();
          q.setFromUnitVectors(Z, nrm); q2.setFromAxisAngle(Z, mr.range(0, 6.283)); q.multiply(q2);
          iQuat.push(q.x, q.y, q.z, q.w); iData.push(mr.range(2.2, 3.6), mr.int(0, 3), mr.range(0, 6.283), 0);
          const light = clamp(0.42 + 0.34 * dir.y + 0.12 * dir.dot(sunDir) + mr.range(-0.22, 0.22), 0, 1);
          col.copy(deep).lerp(cLeaf, Math.pow(light, 1.2)); if (mr.chance(0.14)) col.lerp(warm, mr.range(0.2, 0.7) * light);
          col.multiplyScalar(mr.range(0.8, 1.0)); iCol.push(col.r, col.g, col.b); iN.push(dir.x * 0.6, dir.y * 0.6 + 0.75, dir.z * 0.6);
        }
      }
      await ctx.yield();
      const pg = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
      g.index = pg.index; g.setAttribute('position', pg.getAttribute('position')); g.setAttribute('normal', pg.getAttribute('normal')); g.setAttribute('uv', pg.getAttribute('uv'));
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3)); g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(new Float32Array(iQuat), 4));
      g.setAttribute('iData', new THREE.InstancedBufferAttribute(new Float32Array(iData), 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(iCol), 3));
      g.setAttribute('iN', new THREE.InstancedBufferAttribute(new Float32Array(iN), 3));
      g.instanceCount = iPos.length / 3; g.boundingSphere = new THREE.Sphere(new V3(0, 8, 245), 150);
      const mat = patch(new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1, metalness: 0 }), { ...UL, uLeafK: { value: new V3(0.22, night ? 0.25 : 1, 0.9) } }, 'leaf', LEAF_OPTS);
      const leaves = new THREE.Mesh(g, mat); leaves.name = 'canopy'; air.add(leaves);
    }
    await ctx.yield();

    // ---- shafts of sun slanting down through the gaps in the vault (air only, additive)
    {
      const sr0 = rng.fork('shafts'), top = [], dat = [], idx = [];
      const dir = new V3(-sunDir.x * 0.55, -1, -sunDir.z * 0.55).normalize(), H = 10.5, len = H / -dir.y;
      const spots = [[GAP_Z + 2, -1.6, 1.3], [GAP_Z, 0.6, 1.0], [GAP_Z - 2.5, 2.2, 0.8], [GAP_Z + 4.5, 1.5, 0.6], [306, -2.6, 0.7], [283, 2.4, 0.55], [266, -1.2, 0.6], [SLING_Z - 8, 1.8, 0.5], [190, -2.2, 0.7], [172, 1.4, 0.6], [154, -0.8, 0.8]];
      spots.forEach(([z, lat, w], i) => {
        const x = chX(z) + lat - dir.x * len, zz = z - dir.z * len, sd = sr0();
        for (const [sx, t] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { top.push(x, H, zz); dat.push(sx, t, w, sd); }
        idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3);
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(dat, 4)); g.setIndex(idx);
      const sc = sunCol.clone(); sc.multiplyScalar(1 / Math.max(sc.r, sc.g, sc.b, 1e-3)).lerp(new THREE.Color(1, 0.95, 0.75), 0.35);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), uDir: { value: dir.clone().multiplyScalar(len) }, uTime: HU.uHcTime, uCol: { value: sc.multiplyScalar(0.34 * L.shaft) } },
        vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.name = 'sun-shafts'; m.frustumCulled = false; m.renderOrder = 3; air.add(m);
    }
    await ctx.yield();

    // ---- flat walls: behind the channel roots and all round the lagoon (air only)
    const wallU = { ...fogU(), uLeaf: { value: cLeaf.clone().lerp(cShade, 0.35).multiplyScalar(0.5) }, uShade: { value: cShade }, uRoot: { value: bark }, uSunCol: { value: sunCol.clone().multiplyScalar(night ? 0.5 : 0.8) }, uAmb: { value: amb.clone().multiplyScalar(0.9) }, uTime: HU.uHcTime };
    {
      const pos = [], aW = [], idx = [];
      const ribbon = (line, y0, hgt, sunny) => {
        const b0 = pos.length / 3; let s = 0;
        for (let i = 0; i < line.length; i++) {
          if (i > 0) s += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
          const h = typeof hgt === 'function' ? hgt(i) : hgt;
          pos.push(line[i][0], y0, line[i][1], line[i][0], y0 + h, line[i][1]); aW.push(s, 0, sunny, s, 1, sunny);
          if (i > 0) { const p = b0 + (i - 1) * 2; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
        }
      };
      for (const s of [-1, 1]) {
        const line = []; for (let z = 366; z >= MOUTH_Z + 4; z -= 4) line.push([chX(z) + s * (halfW(z) + 9.5 + 2 * noise.n2(z * 0.1, s * 3)), z]);
        const th0 = s * 0.075; line.push([LAG.x + Math.sin(th0) * (ringR(th0) + 2), LAG.z + Math.cos(th0) * (ringR(th0) + 2)]);
        ribbon(line, -0.5, 15.5, 0.3 + 0.001 * s);
      }
      for (const [off, h, sunny] of [[2.5, 13, 1], [15, 20, 0.72]]) {
        const line = []; for (let i = 0; i <= 210; i++) { const th = 0.07 + (i / 210) * (Math.PI * 2 - 0.14), R = ringR(th) + off; line.push([LAG.x + Math.sin(th) * R, LAG.z + Math.cos(th) * R]); }
        ribbon(line, -0.6, (i) => h + 3 * noise.n2(i * 0.12, off), sunny);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aW, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new V3(0, 5, 60), 420);
      const wall = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: wallU, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.DoubleSide }));
      wall.name = 'mangrove-walls'; air.add(wall);
    }

    // ---- seedling pods over the channel: dangling, dropping, spearing the water, bobbing upright
    {
      const P = makeBuilder(), green = cLeaf.clone().multiplyScalar(0.8), tipc = new THREE.Color('#6a4a22');
      const pp = [new V3(0, 0, 0), new V3(0, -0.12, 0), new V3(0, -0.5, 0), new V3(0, -0.85, 0), new V3(0, -1, 0)], rr = [0.02, 0.05, 0.062, 0.04, 0.004];
      tube(P, pp, (i) => rr[i], 3, (i, j, out) => { tmpC.copy(green).lerp(tipc, i / 4 * 0.8); if (i === 0) tmpC.copy(tipc); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; });
      const base = finish(P), g = new THREE.InstancedBufferGeometry();
      g.index = base.index; for (const k of ['position', 'normal', 'color']) g.setAttribute(k, base.getAttribute(k));
      const n = Math.round(150 * DEN), iA = new Float32Array(n * 4), iB = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        const u = mr.range(0.07, uMouth + 0.01), s = mr.sign(), p = beside(u, s * mr.range(s > 0 ? 3.1 : 2.2, 5.2), mr.range(6.4, 7.4)), falling = i % 2 === 0;
        iA.set([p.x, p.y, p.z, mr()], i * 4); iB.set([falling ? mr.range(5, 9) : 0, mr.range(0.8, 1.25)], i * 2);
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 2));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new V3(0, 3, 245), 140);
      const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }), UC, 'pod', POD_OPTS);
      const pods = new THREE.Mesh(g, mat); pods.name = 'pods'; both.add(pods);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- water surface (both passes see one side each)
    const waterU = {
      ...fogU(), uTime: HU.uHcTime, uRain: { value: 0 }, uChop: { value: L.chop }, uBio: { value: L.bio }, uMouth: { value: MOUTH_Z },
      uSun: { value: sunDir }, uSunCol: { value: sunCol.clone().multiplyScalar(night ? 1.4 : 1.0) }, uHor: { value: cHor }, uZen: { value: cZen },
      uCanopy: { value: cShade.clone().multiplyScalar(night ? 0.06 : 0.42) }, uCoin: { value: night ? new THREE.Color(0.1, 0.14, 0.2) : cHor.clone().lerp(new THREE.Color(1, 0.96, 0.8), 0.5).multiplyScalar(1.15) },
      uAlmDir: { value: new V3(0, 0, -1) }, uAlm: { value: new THREE.Color(0, 0, 0) }, uTea: { value: L.tea.clone().multiplyScalar(night ? 3 : 1) }, uTurq: { value: night ? new THREE.Color(0.01, 0.03, 0.045) : cTurq.clone().multiplyScalar(squall ? 0.6 : 1) }, uUnder: { value: seaFog }, uCam: { value: new V3() },
    };
    let waterMesh = null, curtain = null;
    {
      const g = new THREE.CircleGeometry(720, 40); g.rotateX(-Math.PI / 2);
      const water = waterMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: waterU, vertexShader: VERT_WORLD, fragmentShader: WATER_FRAG, fog: true, side: THREE.DoubleSide }));
      water.position.set(0, 0, 40); water.name = 'water'; water.frustumCulled = false; both.add(water);
      // a curtain of the same (fully fogged) water round the sea eye closes the sliver between sea bed and surface at the far plane
      const cg = new THREE.CylinderGeometry(225, 225, 40, 24, 1, true);
      curtain = new THREE.Mesh(cg, water.material); curtain.name = 'far-curtain'; curtain.frustumCulled = false; curtain.renderOrder = -6; sea.add(curtain);
    }

    // ---------------------------------------------------------------- sand floor along the route + turtle grass (sea pass only)
    const grassAt = (x, z) => smoothstep(0.02, 0.32, noise.fbm2(x * 0.05 + 3, z * 0.05 - 5, 3) + 0.2 * Math.sin(x * 0.21 + z * 0.13)) * (1 - smoothstep(MOUTH_Z - 34, MOUTH_Z - 12, z));
    const floorU = {
      ...fogU(), uTime: HU.uHcTime, uMouth: { value: MOUTH_Z }, uBio: { value: L.bio }, uSunCol: { value: new THREE.Color() }, uAmb: { value: new THREE.Color() },
      uSand: { value: new THREE.Color('#E9DDB8').multiplyScalar(0.92) }, uGrass: { value: cShade.clone().lerp(cLeaf, 0.25).multiplyScalar(0.5) }, uAbsorb: { value: new THREE.Color(1, 1, 1) }, uSun: { value: sunDir },
      uCam: waterU.uCam, uAlmDir: waterU.uAlmDir, uAlm: waterU.uAlm,
    };
    {
      const NS = 170, NA = 26, WID = 52, pos = [], aG = [], idx = [], p = new V3();
      for (let i = 0; i <= NS; i++) {
        const u = -0.035 + (i / NS) * 1.09;
        for (let j = 0; j <= NA; j++) {
          const t = (j / NA) * 2 - 1, lat = Math.sign(t) * Math.pow(Math.abs(t), 1.9) * WID;
          beside(u, lat, 0, p); pos.push(p.x, floorY(p.x, p.z), p.z);
          const ga = grassAt(p.x, p.z), hw = halfW(p.z); aG.push(ga > 0.002 ? ga : -smoothstep(hw - 0.2, hw + 3.6, Math.abs(latOf(p.x, p.z))) * smoothstep(MOUTH_Z - 16, MOUTH_Z + 8, p.z));
          if (i < NS && j < NA) { const a = i * (NA + 1) + j; idx.push(a, a + 1, a + NA + 1, a + 1, a + NA + 2, a + NA + 1); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(aG, 1)); g.setIndex(idx); g.computeBoundingSphere();
      const floor = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: floorU, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, fog: true, side: THREE.DoubleSide }));
      floor.name = 'sand'; floor.frustumCulled = false; sea.add(floor);
    }
    {
      const G = makeBuilder(), gr = rng.fork('grass'), grA = cShade.clone().multiplyScalar(0.7), grB = cLeaf.clone().multiplyScalar(0.85), p = new V3();
      const alA = new THREE.Color('#2f6a1e'), alB = new THREE.Color('#8fb83a'), alC = new THREE.Color('#4f7a2c'), alD = new THREE.Color('#1c4a1c');
      const strip = (x, y, z, len, w0, ang, bend, dir = 1, cA = grA, cB = grB) => {
        const b0 = G.pos.length / 3, ph = gr.range(0, 6.283), cx = Math.cos(ang), sz = Math.sin(ang);
        for (let i = 0; i <= 2; i++) {
          const t = i / 2, w = lerp(w0, 0.03, t) * 0.5, yy = y + dir * len * t;
          for (const sd of [-1, 1]) { G.pos.push(x + cx * w * sd, yy, z + sz * w * sd); G.nor.push(-sz * 0.4, 0.9, cx * 0.4); tmpC.copy(cA).lerp(cB, t); G.col.push(tmpC.r, tmpC.g, tmpC.b); G.ext.push(t * t * len * bend, ph); }
          if (i < 2) { const q = b0 + i * 2; G.idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
      };
      for (let k = 0, na = Math.min(underPts.length, Math.round(1300 * DEN)); k < na; k++) { if ((k & 255) === 255) await ctx.yield(); const q = k % 3 === 0 && bigLegs.length ? bigLegs[Math.floor(gr() * bigLegs.length)] : underPts[Math.floor(gr() * underPts.length)], a = gr.range(0, 6.283);
        strip(q.p.x + Math.cos(a) * q.r * 0.8, q.p.y, q.p.z + Math.sin(a) * q.r * 0.8, gr.range(0.5, 1.5), gr.range(0.1, 0.22), gr.range(0, 3.14), 0.5, -1, alA, alB); }
      for (const src of [bigLegs, dunkPts]) for (let k = 0; k < src.length; k += src === bigLegs ? 2 : 1) {       // long beards streaming from the thick legs
        const q = src[k]; if (q.p.y < -2.4 && src === bigLegs) continue;
        for (let b = 0; b < 2; b++) { const a = gr.range(0, 6.283); strip(q.p.x + Math.cos(a) * q.r * 0.85, q.p.y, q.p.z + Math.sin(a) * q.r * 0.85, gr.range(0.9, 1.9), gr.range(0.16, 0.3), gr.range(0, 3.14), 0.6, -1, src === bigLegs ? alA : alD, src === bigLegs ? alB : alC); }
      }
      await ctx.yield();
      const want = Math.round(7500 * DEN);
      for (let k = 0, made = 0; k < want * 6 && made < want; k++) {
        beside(gr.range(uMouth - 0.04, 1.02), gr.sign() * Math.pow(gr(), 1.4) * 30, 0, p);
        if (Math.hypot(p.x, p.z) < 44.5 || gr() > grassAt(p.x, p.z)) continue;
        strip(p.x, floorY(p.x, p.z) - 0.05, p.z, gr.range(0.5, 1.15), gr.range(0.11, 0.18), gr.range(0, 3.14), 0.5); made++;
        if ((made & 255) === 0) await ctx.yield();
      }
      await ctx.yield();
      for (let k = 0, nk = Math.round(2600 * DEN), u0 = 1 - 30 / path.length; k < nk; k++) {       // the meadow thickens round the exit ring
        beside(gr.range(u0, 1.03), gr.sign() * Math.pow(gr(), 1.2) * 17, 0, p);
        if (Math.hypot(p.x, p.z) < 44.5 || gr() > 0.3 + 0.7 * grassAt(p.x, p.z)) continue;
        strip(p.x, floorY(p.x, p.z) - 0.05, p.z, gr.range(0.5, 1.2), gr.range(0.11, 0.18), gr.range(0, 3.14), 0.5);
        if ((k & 255) === 255) await ctx.yield();
      }
      for (let z = 339, k = 0; z > MOUTH_Z + 8; z -= gr.range(7.5, 10), k++) {       // meadows of turtle grass down the middle of the channel floor
        const cx0 = chX(z) + (k % 2 ? gr.range(0.4, 1.5) : -gr.range(0.6, 2.0)), nb = Math.round(gr.int(36, 54) * DEN);
        if ((k & 3) === 3) await ctx.yield();
        for (let b = 0; b < nb; b++) { const a = gr.range(0, 6.283), rr = Math.sqrt(gr()), x = cx0 + Math.cos(a) * rr * 1.1, zz = z + Math.sin(a) * rr * 2.0; strip(x, floorY(x, zz) - 0.05, zz, gr.range(0.35, 0.85), gr.range(0.09, 0.15), gr.range(0, 3.14), 0.45); }
      }
      for (let k = 0, nk = Math.round(50 * DEN); k < nk; k++) {       // tufts of turtle grass on the channel sand, so the floor is never bare
        beside(gr.range(-0.02, uMouth - 0.03), gr.sign() * gr.range(0.4, 3.4), 0, p); const cx0 = p.x, cz0 = p.z;
        for (let b = 0, nb = gr.int(7, 14); b < nb; b++) { const x = cx0 + gr.range(-0.5, 0.5), z = cz0 + gr.range(-0.5, 0.5); strip(x, floorY(x, z) - 0.05, z, gr.range(0.3, 0.8), gr.range(0.08, 0.14), gr.range(0, 3.14), 0.45); }
      }
      G.uv.length = 0;
      await ctx.yield();
      const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), UL, 'sway', SWAY_OPTS);
      const grass = new THREE.Mesh(await finishAsync(G, ctx, 'aSw', 2), mat); grass.name = 'turtle-grass'; sea.add(grass);
    }
    await ctx.yield();

    // ---- sponge fur on the near roots, barrel sponges on the sand, feather-duster worms (sea pass)
    const spongeMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), UC, 'sponge', SPONGE_OPTS);
    const nearU = underPts.filter((q) => Math.abs(latOf(q.p.x, q.p.z)) < 5.4 && q.p.z > MOUTH_Z - 4);
    const channelSea = [];        // sea-pass meshes that only matter in and near the channel
    const wormU = { ...fogU(), uEye: { value: new V3() }, uTime: HU.uHcTime, uLit: { value: new THREE.Color() } };
    {
      let S = makeBuilder(); const ico1 = icoIndexed(1), ico0 = icoIndexed(0), v = new V3(), c = new THREE.Color(), sr0 = rng.fork('sponge'); let ip = ico1, nBlob = 0;
      const cols = ['#f08c1c', '#7b3fa8', '#e8b83a', '#a8508c', '#f59a30', '#9a4fd0'].map((h) => new THREE.Color(h));
      const blob = (ox, oy, oz, sx, sy, sz, tubeS) => {
        const base = cols[(nBlob++ + (sr0.chance(0.25) ? 2 : 0)) % cols.length], b0 = S.pos.length / 3, sd = sr0.range(0, 50);
        for (let k = 0; k < ip.idx.length; k++) S.idx.push(b0 + ip.idx[k]);
        for (let i = 0; i < ip.count; i++) {
          v.set(ip.pos[i * 3], ip.pos[i * 3 + 1], ip.pos[i * 3 + 2]);
          const d = 1 + 0.26 * Math.sin(v.x * 5 + sd) * Math.sin(v.y * 6 + sd * 1.3) + 0.2 * Math.sin(v.z * 7 + sd * 0.7) + (tubeS ? 0.25 * v.y : -0.15 * Math.abs(v.y));
          S.pos.push(ox + v.x * sx * d, oy + v.y * sy * d, oz + v.z * sz * d); S.nor.push(v.x, v.y, v.z);
          c.copy(base).multiplyScalar(0.42 + 0.3 * (d - 0.6) + 0.2 * Math.max(0, v.y)); S.col.push(c.r, c.g, c.b);
        }
      };
      const onRoot = (q) => { const a = sr0.range(0, 6.283), s = sr0.range(0.05, 0.11) + q.r * 0.2, tubeS = sr0.chance(0.25);
        blob(q.p.x + Math.cos(a) * (q.r + s * 0.4), q.p.y + sr0.range(-0.25, 0.25), q.p.z + Math.sin(a) * (q.r + s * 0.4), s * sr0.range(0.8, 1.3), s * (tubeS ? sr0.range(1.8, 2.8) : sr0.range(0.7, 1.2)), s * sr0.range(0.8, 1.3), tubeS); };
      for (let k = 0, n = Math.min(bigLegs.length * 2, Math.round(300 * DEN)); k < n; k++) { onRoot(bigLegs[Math.floor(sr0() * bigLegs.length)]); if ((k & 63) === 63) await ctx.yield(); }
      ip = ico0;       // the small fur: three times as many, on every leg within reach of the lens
      for (let k = 0, n = Math.min(bigLegs.length * 3, Math.round(420 * DEN)); k < n; k++) { onRoot(bigLegs[Math.floor(sr0() * bigLegs.length)]); if ((k & 127) === 127) await ctx.yield(); }
      await ctx.yield();
      for (let k = 0, n = nearU.length ? Math.round(520 * DEN) : 0; k < n; k++) { onRoot(nearU[Math.floor(sr0() * nearU.length)]); if ((k & 127) === 127) await ctx.yield(); }
      await ctx.yield();
      ip = ico1;
      const pf = new V3();
      for (let k = 0; k < 26; k++) {       // barrel and vase sponges standing on the sand beside the route
        const sd = sr0.sign(); beside(sr0.range(0.005, uMouth - 0.04), sd < 0 ? -sr0.range(1.3, 3.3) : sr0.range(2.6, 3.6), 0, pf);
        const s = sr0.range(0.09, 0.17); blob(pf.x, floorY(pf.x, pf.z) + s * 1.1, pf.z, s, s * sr0.range(1.5, 2.3), s, true);
      }
      await ctx.yield();
      const sponges = new THREE.Mesh(await finishAsync(S, ctx), spongeMat); sponges.name = 'channel-sponges'; sponges.frustumCulled = false; sea.add(sponges); channelSea.push(sponges);
      S = makeBuilder();            // and the fur on the roots that hang beside the dunk
      for (let k = 0, n = dunkPts.length ? 130 : 0; k < n; k++) { if (k === 60) ip = ico0; onRoot(dunkPts[Math.floor(sr0() * dunkPts.length)]); }
      const ds = new THREE.Mesh(finish(S), spongeMat); ds.name = 'dunk-sponges'; sea.add(ds);
      await ctx.yield();
      // worms
      const src = bigLegs.concat(nearU), n = src.length ? Math.round(150 * DEN) : 0;
      if (n > 0) {
        const fan = [], NP = 9; for (let i = 0; i < NP; i++) { const a0 = (i / NP) * 6.283, a1 = ((i + 0.72) / NP) * 6.283; fan.push(0, 0, 0, Math.cos(a0) * 0.085, 0.11, Math.sin(a0) * 0.085, Math.cos(a1) * 0.085, 0.11, Math.sin(a1) * 0.085); }
        const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(fan, 3));
        const iP = new Float32Array(n * 4), iD = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) {
          const q = src[Math.floor(sr0() * src.length)], inx = chX(q.p.z) - q.p.x, sg = Math.sign(inx) || 1, a = sr0.range(-1.1, 1.1);
          const dx = Math.cos(a) * sg, dz = Math.sin(a);
          iP.set([q.p.x + dx * q.r * 0.95, q.p.y + sr0.range(-0.15, 0.15), q.p.z + dz * q.r * 0.95, sr0.range(0.9, 1.7)], i * 4); iD.set([dx, sr0.range(0.3, 0.9), dz, sr0()], i * 4);
        }
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4)); g.instanceCount = n;
        const worms = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: wormU, vertexShader: WORM_VERT, fragmentShader: WORM_FRAG, fog: true, side: THREE.DoubleSide }));
        worms.name = 'feather-dusters'; worms.frustumCulled = false; sea.add(worms); channelSea.push(worms);
      }
    }
    await ctx.yield();

    // ---- slanting shafts of light below the surface (sea pass)
    const rayDir = new V3(-sunDir.x * 0.7, -1, -sunDir.z * 0.7).normalize();
    const rayU = { ...fogU(), uCam: { value: new V3() }, uCtr: { value: new V3() }, uRay: { value: rayDir }, uTime: HU.uHcTime, uLen: { value: 3.4 }, uWid: { value: 1 }, uFrac: { value: 0.5 }, uCol: { value: new THREE.Color() } };
    {
      const n = 96, top = [], dat = [], org = [], idx = [], rr = rng.fork('rays');
      for (let i = 0; i < n; i++) {
        const x = rr.range(0, 32), z = rr.range(0, 32), w = rr.range(0.12, 0.5), sd = rr();
        for (const [s, t] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { top.push(0, 0, 0); org.push(x, 0, z); dat.push(s, t, w, sd); }
        idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3)); g.setAttribute('aO', new THREE.Float32BufferAttribute(org, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(dat, 4)); g.setIndex(idx);
      const rays = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: rayU, vertexShader: RAY_VERT, fragmentShader: RAY_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      rays.name = 'shafts'; rays.frustumCulled = false; rays.renderOrder = 3; sea.add(rays);
    }

    // ---------------------------------------------------------------- far shore: sand cays with palms, the stilt hut
    const fxTime = { value: 0 };
    const sr = rng.fork('shore'), flip = sr.sign();
    const cays = [[-100 * flip, -98, 24], [92 * flip, -150, 20], [150 * flip, -24, 17]].map(([x, z, r]) => ({ x: x + sr.range(-8, 8), z: z + sr.range(-8, 8), r: r * sr.range(0.85, 1.15) }));
    {
      const C = makeBuilder(), sand = new THREE.Color('#E9DDB8').multiplyScalar(0.82), wet = new THREE.Color('#9c8a62').multiplyScalar(0.7);
      const palmSpots = [];
      for (const c of cays) {
        const b0 = C.pos.length / 3, rings = 7, segs = 20;
        for (let i = 0; i <= rings; i++) for (let j = 0; j <= segs; j++) {
          const f = i / rings, a = (j / segs) * 6.283, r = f * c.r * (1 + 0.18 * Math.sin(a * 3 + c.x) + 0.1 * Math.sin(a * 5 + c.z));
          const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r * 0.7, y = 1.7 * (1 - f * f) - 0.7 * f + 0.15 * noise.n2(x * 0.3, z * 0.3) * (1 - f);
          C.pos.push(x, y, z); C.nor.push(0, 1, 0); tmpC.copy(wet).lerp(sand, smoothstep(0.05, 0.5, y)); C.col.push(tmpC.r, tmpC.g, tmpC.b);
          if (i < rings && j < segs) { const p = b0 + i * (segs + 1) + j; C.idx.push(p, p + 1, p + segs + 1, p + 1, p + segs + 2, p + segs + 1); }
        }
        const np = sr.int(2, 4); for (let k = 0; k < np; k++) { const a = sr.range(0, 6.283), r = sr.range(0, c.r * 0.4); palmSpots.push([c.x + Math.cos(a) * r, 1.0, c.z + Math.sin(a) * r * 0.7]); }
      }
      const g = finish(C); g.computeVertexNormals();
      const cay = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); cay.name = 'cays'; air.add(cay); await ctx.yield();
      const wind = flora.makeWind({ direction: [-0.9, 0.2], strength: squall ? 2 : 1 }); await ctx.yield();
      const pm = flora.windMaterial({ wind, map: null, color: 0x9fa894 }); await ctx.yield();      // no leaf atlas: the palms are 100 m off, and making that texture is one 60 ms step
      const variants = [flora.palmGeometry({ rng: sr.fork('p1'), height: 11, detail: 0, fronds: 10 })]; await ctx.yield();
      variants.push(flora.palmGeometry({ rng: sr.fork('p2'), height: 14, detail: 0, fronds: 10, curve: 0.8 })); await ctx.yield();
      const dm = new THREE.Object3D();
      variants.forEach((vg, vi) => {
        const mine = palmSpots.filter((_, i) => i % 2 === vi); if (!mine.length) { vg.dispose(); return; }
        const im = new THREE.InstancedMesh(vg, pm, mine.length);
        mine.forEach((p, i) => { dm.position.set(p[0], p[1], p[2]); dm.rotation.set(0, sr.range(0, 6.283), 0); dm.scale.setScalar(sr.range(0.85, 1.15)); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
        im.frustumCulled = false; im.name = 'palms'; air.add(im);
      });
      updaters.push((dt, time) => flora.updateWind(pm, time));
    }
    const hutAt = new V3(-74 * flip, 0, -66);
    await ctx.yield();
    {
      const hut = makeBuilding({ rng: sr.fork('hut'), style: 'stilt', width: 6.5, depth: 5, height: 3.4, stilts: 2.3, pileDepth: 3.5, lit: 1, position: [hutAt.x, 0, hutAt.z], rotationY: flip > 0 ? 1.0 : -1.0,
        palette: { roof: '#8a4a2e', wall: '#8f7a58', trim: '#3a2a1c', wood: '#5a4230' } });
      air.add(hut.object); if (hut.update) updaters.push((dt, time, cam) => hut.update(dt, time, cam)); await ctx.yield();
      const sg = new THREE.PlaneGeometry(1, 1, 2, 20); sg.translate(0, 0.5, 0);
      const smoke = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { ...fogU(), uBase: { value: new V3(hutAt.x + 1.2, 6.0, hutAt.z) }, uWind: { value: new V3(-0.55, 0, 0.12) }, uH: { value: 30 }, uTime: fxTime,
        uCol: { value: night ? new THREE.Color(0.1, 0.12, 0.15) : sunCol.clone().lerp(new THREE.Color(0.75, 0.82, 1), 0.65).multiplyScalar(squall ? 0.4 : 0.55) } },
        vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      smoke.name = 'cooking-smoke'; smoke.frustumCulled = false; smoke.renderOrder = 2; air.add(smoke);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- canoes: ours (prow at frame right), one tied at the hut, three under sail
    const HX = 1.77, BOW = -1.9, STERN = 3.9;      // our hull's centreline, metres right of the lens; its ends along the line of travel
    const makeCanoeGeo = (NR) => {
      // lofted hull, 56 stations (crowded into the bow) by 27 around; paint is done in the shader from aRuv = (v, t): v 0 keel .. 1 gunwale
      // outside, 1 .. 2 inside; 3 the gunwale lip, 4 the stem post, 5 the painter (bow rope)
      const C = makeBuilder();
      const H = [[0, 0, 0], [0.22, 0.008, 0.04], [0.42, 0.03, 0.1], [0.6, 0.075, 0.18], [0.74, 0.15, 0.28], [0.85, 0.27, 0.4], [0.92, 0.42, 0.54], [0.965, 0.58, 0.68], [0.99, 0.74, 0.8], [1, 0.88, 0.9], [1.005, 0.94, 0.95], [1, 0.985, 0.99], [0.93, 1, 1.0],
        [0.85, 0.985, 1.05], [0.82, 0.8, 1.3], [0.74, 0.58, 1.6], [0, 0.46, 2]];
      const ring = []; for (let k = 0; k < H.length; k++) ring.push([H[k][0], H[k][1], H[k][2]]); for (let k = H.length - 2; k >= 1; k--) ring.push([-H[k][0], H[k][1], H[k][2]]);
      const M = ring.length;
      const sn = (t) => Math.sin(Math.PI * clamp(t * 0.98 + 0.01, 0, 1)), beam = (t) => 0.38 * Math.pow(sn(t), 0.6);
      const sheer = (t) => 0.28 + 0.46 * Math.pow(smoothstep(0.5, 0, t), 1.6) + 0.12 * smoothstep(0.75, 1, t);          // the gunwale sweeps up to the prow
      const keel = (t) => lerp(sheer(t) - 0.08, -0.8, Math.pow(sn(t), 0.34));
      const stZ = (t, v) => lerp(BOW, STERN, t) - 0.42 * v * v * smoothstep(0.3, 0, t);                                // a raked stem: the prow overhangs its forefoot
      for (let i = 0; i <= NR; i++) {
        const t = Math.pow(i / NR, 1.6), b = beam(t), yTop = sheer(t), yBot = keel(t);
        for (let k = 0; k <= M; k++) { const r = ring[k % M]; C.pos.push(r[0] * b, lerp(yBot, yTop, r[1]), stZ(t, r[1])); C.nor.push(0, 1, 0); C.col.push(1, 1, 1); C.uv.push(r[2], t);
          if (i < NR && k < M) { const p = i * (M + 1) + k; C.idx.push(p, p + 1, p + M + 1, p + 1, p + M + 2, p + M + 1); } }
      }
      const white = (i, j, out) => { out[0] = 1; out[1] = 1; out[2] = 1; };
      const mark = (v0, m) => { for (let k = v0; k < C.uv.length / 2; k++) C.uv[k * 2] = m; };
      for (const sx of [-1, 1]) {      // a rounded gunwale lip along each rim
        const lp = [], v0 = C.uv.length / 2;
        for (let i = 0; i <= NR; i++) { const t = Math.pow(i / NR, 1.6); lp.push(new V3(sx * beam(t) * 0.985, sheer(t) + 0.004, stZ(t, 1))); }
        tube(C, lp, (i) => 0.032 * (0.8 + 0.2 * Math.sin(Math.PI * i / NR)), 6, white); mark(v0, 3);
      }
      {   // the stem post: up the cutwater, past the gunwale and curling over into a carved knob
        const v0 = C.uv.length / 2, y0 = keel(0), y1 = sheer(0), sp = [];
        for (let k = 0; k <= 5; k++) { const v = k / 5; sp.push(new V3(0, lerp(y0 - 0.02, y1, v), stZ(0, v) - 0.015)); }
        sp.push(new V3(0, y1 + 0.13, BOW - 0.52), new V3(0, y1 + 0.26, BOW - 0.57), new V3(0, y1 + 0.37, BOW - 0.54), new V3(0, y1 + 0.42, BOW - 0.45), new V3(0, y1 + 0.4, BOW - 0.38));
        const pr = [0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.05, 0.043, 0.05, 0.068, 0.02];
        tube(C, sp, (i) => pr[i], 7, white); mark(v0, 4);
      }
      {   // the painter: a hemp rope looped round the post and draped along the near side to a cleat
        const v0 = C.uv.length / 2, rp = [];
        for (let k = 0; k <= 12; k++) { const f = k / 12, t = f * 0.2; rp.push(new V3(-(beam(t) * 0.96 + 0.03 + 0.05 * Math.sin(Math.PI * f)), sheer(t) + 0.03 - 0.17 * Math.sin(Math.PI * Math.pow(f, 0.8)) + (k === 0 ? 0.08 : 0), stZ(t, 1) - (k === 0 ? 0.05 : 0))); }
        tube(C, rp, () => 0.016, 5, white); mark(v0, 5);
      }
      const g = finish(C); g.computeVertexNormals(); return g;
    };
    const canoeGeo = makeCanoeGeo(56), canoeFar = makeCanoeGeo(12);      // the boats across the lagoon need a fifth of the stations
    const canoeMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide }), UL, night ? 'tc-canoe-n' : 'tc-canoe', {
      pre: 'uniform float uTcCanopy;\n#define HC_AMT(p) (uTcCanopy * 0.9)\n', vHead: WOOD_VHEAD, vBody: 'vRuv = aRuv;', fHead: 'varying vec2 vRuv; float tcWet = 0.0;\n',
      fColor: /* glsl */`{
        float cv = vRuv.x, y = vHcP.y;
        float grain = hcNoise(vHcP * vec3(16.0, 16.0, 1.5)) * 0.6 + hcNoise(vHcP * vec3(41.0, 41.0, 5.0)) * 0.4;
        float fib = hcNoise(vec3(vHcP.x * 30.0, vHcP.y * 60.0, vHcP.z * 2.2));                                    // the grain runs the length of the hull
        vec3 wood = vec3(0.3, 0.2, 0.1) * (0.55 + 0.9 * grain);
        // planks: strakes a hand and a half wide, butt joints staggered from row to row, every plank faded a little differently
        float row = floor(cv * 8.33 + 0.83), sf = fract(cv * 8.33 + 0.33), sm = abs(sf - 0.5), sk = step(cv, 0.885) * step(0.12, cv);
        float bz = vHcP.z * 0.62 + row * 0.37, bf = abs(fract(bz + 0.5) - 0.5), pid = hcHash(vec3(row, floor(bz + 0.5), 3.0));
        vec3 paint = mix(vec3(0.014, 0.03, 0.028), vec3(0.075, 0.37, 0.34), smoothstep(0.1, 0.2, cv));              // tarred bottom, faded turquoise sides
        paint *= (0.8 + 0.26 * hcNoise(vHcP * vec3(3.0, 3.0, 0.9) + 2.0)) * (0.86 + 0.28 * fib) * (0.78 + 0.44 * pid);
        paint = mix(paint, paint * vec3(1.3, 1.12, 0.92) + vec3(0.02, 0.025, 0.02), smoothstep(0.55, 0.88, cv) * 0.55);  // bleached by the sun toward the rail
        float stripe = smoothstep(0.893, 0.899, cv) * (1.0 - smoothstep(0.956, 0.962, cv));
        paint = mix(paint, vec3(0.17, 0.05, 0.036) * (0.85 + 0.3 * fib), stripe);                                 // the gunwale stripe: a crisp band of dull red-brown
        // chipped, worn paint: through to a pale undercoat and then bare wood along the seams, the plank ends, the rail and the waterline
        float wn = hcNoise(vHcP * vec3(9.0, 9.0, 3.0) + 3.0) * 0.6 + hcNoise(vHcP * 37.0) * 0.4;
        float rub = (smoothstep(0.2, 0.04, sm) * 0.16 + smoothstep(0.1, 0.0, bf) * 0.16) * sk + 0.2 * smoothstep(0.84, 1.0, cv) + 0.2 * smoothstep(0.22, 0.03, y) * step(cv, 1.0);
        float under = smoothstep(0.57, 0.63, wn + rub), chip = smoothstep(0.66, 0.72, wn + rub);
        vec3 col = mix(paint, vec3(0.34, 0.4, 0.34) * (0.7 + 0.4 * fib), under * 0.6 * (1.0 - stripe * 0.6));
        col = mix(col, wood * 0.9, chip * 0.9);
        col *= 1.0 - 0.75 * smoothstep(0.075, 0.02, sm) * sk;                                                     // the seam between strakes, its lower edge lit
        col *= 1.0 + 0.3 * smoothstep(0.2, 0.09, sm) * step(sf, 0.5) * sk;
        col *= 1.0 - 0.6 * smoothstep(0.014, 0.005, bf) * sk;                                                     // butt joints
        { vec2 nq = vec2((bf - 0.04) * 1.6, (abs(sf - 0.5) - 0.3) * 0.12); float nail = smoothstep(0.013, 0.006, length(nq)) * sk;
          float weep = smoothstep(0.012, 0.0, abs(bf - 0.04) * 1.6) * smoothstep(0.3, 0.2, abs(sf - 0.5)) * step(sf, 0.5) * sk * 0.35;   // a rust weep under every nail
          col = mix(col, vec3(0.2, 0.08, 0.035), max(nail, weep)); }
        if (cv > 0.965) col = wood * mix(1.25, 0.5, smoothstep(1.03, 1.5, cv)) * (1.0 - 0.45 * smoothstep(0.1, 0.0, abs(fract(vRuv.y * 13.0) - 0.5)) * step(1.04, cv));   // bare gunwale cap, ribbed inside
        if (cv > 2.5) col = vec3(0.4, 0.27, 0.13) * (0.75 + 0.7 * fib);                                           // the rounded lip, worn pale by hands
        if (cv > 3.5) { float band = step(0.5, fract(y * 5.2 + 0.2));                                             // the stem post: banded red and bare wood, the knob worn pale
          col = mix(vec3(0.19, 0.05, 0.035), vec3(0.42, 0.3, 0.15), band * 0.8) * (0.7 + 0.6 * grain); col = mix(col, vec3(0.5, 0.38, 0.2), smoothstep(0.98, 1.08, y) * 0.7); }
        if (cv > 4.5) col = vec3(0.5, 0.41, 0.25) * (0.55 + 0.6 * step(0.5, fract(vRuv.y * 34.0 + grain * 0.6)));  // the painter: twisted hemp
        float hullK = step(cv, 1.0);
        tcWet = smoothstep(0.085, 0.012, y) * step(0.0, y) * hullK;
        col *= mix(1.0, 0.42, smoothstep(0.1, 0.035, y + 0.02 * (fib - 0.5)) * hullK);                            // a dark wet band above the line
        col = mix(col, vec3(0.1, 0.12, 0.045), smoothstep(0.045, 0.0, abs(y - 0.01)) * 0.7 * hullK);              // scum at the waterline
        if (y < -0.01) { col = mix(col, vec3(0.05, 0.1, 0.05), 0.5 + 0.3 * grain);                               // weed and barnacles below it
          col = mix(col, vec3(0.62, 0.6, 0.52), smoothstep(0.64, 0.7, hcNoise(vHcP * 23.0 + 7.0)) * smoothstep(-0.02, -0.12, y) * 0.85); }
        diffuseColor.rgb = col; }`,
      fLit: /* glsl */`outgoingLight += diffuseColor.rgb * 0.1;${night ? ' outgoingLight *= 0.42;' : ''}
        { float tcRim = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0); tcRim *= tcRim;
          float tcSpark = smoothstep(0.62, 0.95, hcNoise(vec3(vHcP.z * 11.0, vHcP.y * 30.0 - uHcTime * 0.7, uHcTime * 1.6)));
          outgoingLight += uHcSunCol * (0.05 + 0.3 * tcRim + 0.5 * tcSpark) * tcWet${night ? ' * 0.3' : ''};         // the wet band shines and glints
          // the water throws its net of light up the side of the hull
          float tcNet = hcCaustic(vec2(vHcP.z * 2.4 + vHcP.x, vHcP.y * 4.5), uHcTime * 1.3) * smoothstep(0.62, 0.06, vHcP.y) * step(0.0, vHcP.y) * step(vRuv.x, 1.0);
          outgoingLight += (diffuseColor.rgb + 0.02) * uHcSunCol * tcNet * ${night ? '0.1' : '0.32'}; }
        #ifdef USE_FOG
          if (vHcP.y < 0.0 && uHcCamY < 0.0) { float rimK = 1.0 - abs(dot(normal, normalize(vViewPosition))); outgoingLight += fogColor * (0.35 + 2.4 * rimK * rimK); }   // sea-light wrapping the dark hull
        #endif`,
    });
    const canoe = new THREE.Group(); canoe.name = 'our-canoe'; both.add(canoe);
    { const hull = new THREE.Mesh(canoeGeo, canoeMat); hull.position.x = HX; hull.frustumCulled = false; canoe.add(hull); }
    const foamU = { uTime: HU.uHcTime, uCol: { value: night ? new THREE.Color(0.25, 0.9, 1.6) : new THREE.Color(1, 1, 0.97).multiplyScalar(squall ? 0.6 : 0.95) }, uSpeed: { value: 1 } };
    {
      const g = new THREE.PlaneGeometry(2.6, 3.6); g.rotateX(-Math.PI / 2);
      const foam = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: foamU, transparent: true, depthWrite: false,
        vertexShader: 'varying vec2 vP; void main(){ vP = vec2(position.x, position.z + 1.6); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: TC_NOISE + /* glsl */`uniform float uTime, uSpeed; uniform vec3 uCol; varying vec2 vP;
          void main(){ float hb = 0.4 * sqrt(clamp(vP.y / 2.2, 0.0, 1.0)) + 0.04, d = abs(vP.x) - hb;
            float wake = smoothstep(0.55, 0.0, d - vP.y * 0.14) * smoothstep(-0.06, 0.03, d) * smoothstep(-0.3, 0.1, vP.y) * (1.0 - smoothstep(1.4, 3.3, vP.y));
            float n = tcNoise(vec3(vP.x * 9.0, vP.y * 5.0 - uTime * 6.0, uTime * 1.5));
            gl_FragColor = vec4(uCol, wake * smoothstep(0.3, 0.75, n + wake * 0.35) * 0.85 * uSpeed); }` }));
      foam.position.set(HX, 0.025, BOW + 1.45); foam.renderOrder = 2; foam.frustumCulled = false; canoe.add(foam);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 1, 5).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#8a6a44', roughness: 0.8 }));
    pole.name = 'pole'; pole.frustumCulled = false; both.add(pole);
    // cloth: sails, washing, hammock (one swaying material)
    const clothMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), UL, 'tc-cloth', {
      pre: '#define HC_AMT(p) 0.0\n', vHead: 'attribute float aFlex;\n',
      vBody: 'transformed.x += sin(uHcTime * 2.3 + position.y * 2.1 + position.z * 1.7) * 0.1 * aFlex; transformed.z += cos(uHcTime * 1.7 + position.y * 1.3 + position.x) * 0.07 * aFlex;',
      // cloth against the light glows through
      fLit: '{ vec3 clL = normalize((viewMatrix * vec4(uHcSun, 0.0)).xyz); float clB = max(dot(normalize(-vViewPosition), clL), 0.0); outgoingLight += diffuseColor.rgb * (0.14 + uHcSunCol * 0.32 * clB * clB); }',
    });
    const clothQuad = (B, a, b, c, d, col, fa, fb, fc, fd) => { const b0 = B.pos.length / 3; for (const [p, f] of [[a, fa], [b, fb], [c, fc], [d, fd]]) { B.pos.push(p[0], p[1], p[2]); B.nor.push(0, 0, 1); B.col.push(col.r, col.g, col.b); B.ext.push(f); } B.idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); };
    const sailGeo = (() => {
      // a bellied spritsail of faded ochre cloth in sewn panels (alternate cloths a shade apart, one patched), on a mast, boom and sprit
      const S = makeBuilder(), ochre = new THREE.Color('#d8b56e').multiplyScalar(0.8), pale = new THREE.Color('#e9dcc0').multiplyScalar(0.8), mc = new THREE.Color('#5a4630').multiplyScalar(0.6), c = new THREE.Color();
      const T = [0, 0.55, -0.6], Cw = [0, 0.75, 2.0], Hd = [0, 3.7, -0.6], Pk = [0, 2.8, 1.05], NU = 6, NV = 5;
      const pt = (u, v) => { const k = Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.7 * v)); return [0.42 * k, lerp(lerp(T[1], Cw[1], u), lerp(Hd[1], Pk[1], u), v) - 0.08 * Math.sin(Math.PI * u) * (1 - v), lerp(lerp(T[2], Cw[2], u), lerp(Hd[2], Pk[2], u), v)]; };
      const fl = (u, v) => Math.sin(Math.PI * u) * (0.35 + 0.65 * v) + 0.5 * u * v;
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
        const u0 = i / NU, u1 = (i + 1) / NU - 0.012, v0 = j / NV, v1 = (j + 1) / NV;
        c.copy(i === 3 && j === 1 ? pale : ochre).multiplyScalar((i % 2 ? 0.88 : 1) * lerp(1.06, 0.78, (u0 + u1) * 0.5) * lerp(0.82, 1.08, (v0 + v1) * 0.5));      // sunlit luff, shadowed leech
        clothQuad(S, pt(u0, v0), pt(u1, v0), pt(u0, v1), pt(u1, v1), c, fl(u0, v0), fl(u1, v0), fl(u0, v1), fl(u1, v1));
      }
      const spar = (a, b, w) => {      // two crossed ribbons read as a round spar from any side
        clothQuad(S, [a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [b[0] - w, b[1], b[2]], [b[0] + w, b[1], b[2]], mc, 0, 0, 0, 0);
        const dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dy, dz) || 1, ny = -dz / l * w, nz = dy / l * w;
        clothQuad(S, [a[0], a[1] - ny, a[2] - nz], [a[0], a[1] + ny, a[2] + nz], [b[0], b[1] - ny, b[2] - nz], [b[0], b[1] + ny, b[2] + nz], mc, 0, 0, 0, 0);
      };
      spar([0, 0.1, -0.6], [0, 4.0, -0.6], 0.05); spar([0, 0.52, -0.6], [0, 0.72, 2.15], 0.035); spar([0, 0.7, -0.6], [0, 2.9, 1.12], 0.03);
      const g = finish(S, 'aFlex', 1); g.computeVertexNormals(); return g;
    })();
    const boats = [];
    {
      const tied = new THREE.Mesh(canoeFar, canoeMat); tied.position.set(hutAt.x + 3.4 * flip, 0, hutAt.z + 3); tied.rotation.y = 0.5; air.add(tied); boats.push({ o: tied, tied: true });
      const routes = [[[62, -150], [44, 118], 0.1], [[-40, -30], [-13, 132], -1], [[-150, -150], [150, -122], 0.3]];
      for (const [a, b, ph] of routes) {
        const o = new THREE.Group(), h = new THREE.Mesh(canoeFar, canoeMat), sl = new THREE.Mesh(sailGeo, clothMat); o.add(h, sl); air.add(o);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]); o.rotation.y = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
        boats.push({ o, a, b, ph, T: len / 2.6, keyed: ph < 0 });
      }
      // washing on a line and a hammock at the hut
      const W = makeBuilder(), cols = ['#e8e4d8', '#7fb7c9', '#e3c66a', '#f1efe6', '#6f9a6a'].map((c) => new THREE.Color(c).multiplyScalar(0.8)), rope = new THREE.Color('#40382c');
      const x0 = hutAt.x - 2.5, x1 = hutAt.x + 6.5, z0 = hutAt.z + 3.6, yl = 4.3;
      clothQuad(W, [x0, yl, z0], [x1, yl, z0], [x0, yl + 0.05, z0], [x1, yl + 0.05, z0], rope, 0, 0, 0, 0);
      clothQuad(W, [x1, 0, z0], [x1 + 0.08, 0, z0], [x1, yl + 0.1, z0], [x1 + 0.08, yl + 0.1, z0], rope, 0, 0, 0, 0);
      for (let i = 0; i < 6; i++) { const x = x0 + 1 + i * 1.25, w = 0.95, h = sr.range(0.8, 1.5); clothQuad(W, [x, yl - h, z0], [x + w, yl - h, z0], [x, yl, z0], [x + w, yl, z0], cols[i % cols.length], 1, 1, 0, 0); }
      const hz = hutAt.z - 1, hy = 1.5; for (let i = 0; i < 6; i++) { const f0 = i / 6, f1 = (i + 1) / 6, sag = (f) => hy - 0.55 * Math.sin(f * Math.PI), fx0 = hutAt.x - 1.6 + f0 * 3.2, fx1 = hutAt.x - 1.6 + f1 * 3.2;
        clothQuad(W, [fx0, sag(f0), hz - 0.4], [fx1, sag(f1), hz - 0.4], [fx0, sag(f0), hz + 0.4], [fx1, sag(f1), hz + 0.4], cols[1], Math.sin(f0 * Math.PI), Math.sin(f1 * Math.PI), Math.sin(f0 * Math.PI), Math.sin(f1 * Math.PI)); }
      const wg = finish(W, 'aFlex', 1); wg.computeVertexNormals(); const wash = new THREE.Mesh(wg, clothMat); wash.name = 'washing'; air.add(wash);
    }

    // ---------------------------------------------------------------- manatee and calf (drawn in both passes: nostrils break the line)
    const seaCows = [];
    if (L.big === 'manatee') {
      const Mb = makeBuilder(), top = new THREE.Color('#8d877c').multiplyScalar(0.62), bel = new THREE.Color('#b9b2a2').multiplyScalar(0.66);
      // a smooth lofted body: blunt bristled muzzle, barrel chest, a waist, then the broad flat paddle of the tail
      const prof = new THREE.CatmullRomCurve3([[1.6, 0.06], [1.55, 0.17], [1.42, 0.235], [1.2, 0.29], [0.85, 0.43], [0.4, 0.56], [-0.1, 0.6], [-0.6, 0.54], [-1.05, 0.4], [-1.4, 0.25], [-1.65, 0.2], [-1.95, 0.27], [-2.15, 0.2], [-2.24, 0.04]].map(([z, r]) => new V3(r, 0, z)), false, 'centripetal').getPoints(30);
      const NSD = 16, mp = prof.map((q) => new V3(0, -0.8 - 0.07 * smoothstep(0.9, 1.6, q.z) + 0.05 * smoothstep(-1.2, -2.2, q.z), q.z));
      tube(Mb, mp, (i) => prof[i].x, NSD, (i, j, out) => { const up = Math.sin((j / NSD) * 6.283); tmpC.copy(bel).lerp(top, smoothstep(-0.55, 0.25, up)); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; },
        (i, j) => { const an = (j / NSD) * 6.283, cs = Math.cos(an), sn = Math.sin(an), k = smoothstep(-1.35, -1.8, prof[i].z), m = smoothstep(1.15, 1.5, prof[i].z);
          return Math.hypot(lerp(1.0, 2.7, k) * (1 + 0.12 * m) * cs, lerp(0.9, 0.3, k) * (1 - 0.1 * m) * sn); });
      for (const sx of [-1, 1]) tube(Mb, [new V3(sx * 0.42, -1.0, 0.78), new V3(sx * 0.6, -1.14, 0.72), new V3(sx * 0.76, -1.3, 0.58), new V3(sx * 0.88, -1.44, 0.4), new V3(sx * 0.93, -1.53, 0.24)], (i) => [0.1, 0.13, 0.15, 0.13, 0.05][i], 8, (i, j, out) => { out[0] = top.r; out[1] = top.g; out[2] = top.b; },
        (i, j) => { const an = (j / 8) * 6.283; return Math.hypot(1.5 * Math.cos(an), 0.45 * Math.sin(an)); });
      const mg = finish(Mb); mg.computeVertexNormals();
      const mm = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), UL, 'tc-cow', {
        pre: '#define HC_AMT(p) 0.0\n', vBody: 'transformed.y += sin(uHcTime * 1.3 + position.z * 0.9) * 0.14 * smoothstep(-0.5, -2.1, position.z);',
        fColor: /* glsl */`{ vec3 cq = vHcP;
          diffuseColor.rgb *= 0.78 + 0.4 * hcNoise(cq * 5.0) ;
          diffuseColor.rgb *= 0.9 + 0.2 * hcNoise(vec3(cq.x * 3.0, cq.y * 3.0, cq.z * 26.0));                                      // skin folds round the body
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.27, 0.13), smoothstep(0.55, 0.78, hcNoise(cq * 2.3 + 4.0)) * 0.4 * smoothstep(-0.95, -0.6, cq.y));   // algae on the back
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.48, 0.44), smoothstep(0.02, 0.0, abs(hcNoise(cq * 1.7 + 9.0) - 0.5)) * 0.5);                        // old propeller scars
          float eye = smoothstep(0.05, 0.028, length(vec3(abs(cq.x) - 0.235, cq.y + 0.74, cq.z - 1.2)));
          float nos = smoothstep(0.04, 0.02, length(vec3(abs(cq.x) - 0.06, cq.y + 0.69, cq.z - 1.52)));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.012, 0.014), max(eye, nos)); }`,
        fLit: /* glsl */`{ vec3 cwUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); float cwT = clamp(dot(normal, cwUp), -1.0, 1.0), cwR = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          vec3 cwAmb = vec3(0.2, 0.26, 0.26);
          #ifdef USE_FOG
            cwAmb = mix(cwAmb, fogColor * 1.5 + 0.05, 0.55);
          #endif
          float cwNet = hcCaustic(vHcP.xz * 2.2 + 3.0, uHcTime * 1.4) * smoothstep(0.05, 0.8, cwT);                                // the caustic net crawling over its back
          outgoingLight = outgoingLight * 0.35 + diffuseColor.rgb * (cwAmb * (0.8 + 0.45 * cwT) + uHcSunCol * (0.14 * max(cwT, 0.0) + 0.26 * cwNet)) * (0.45 + 0.4 * cwR); }`,
      });
      const side = -1;                 // ahead-left of the exit ring, within 15 m of the lens as it leaves the dome
      for (const [dx, dz, sc, ph] of [[4.7, -57.5, 1, 0], [6.1, -59.6, 0.55, 0.4]]) {
        const m = new THREE.Mesh(mg, mm); m.scale.setScalar(sc * 1.15); m.rotation.order = 'YXZ'; m.frustumCulled = false; both.add(m);
        seaCows.push({ m, x: dx * side, z: dz, sc, ph });
      }
    }

    // rings spreading on the surface where the cow's nostrils break it
    let cowRing = null;
    if (seaCows.length) {
      const rg = new THREE.PlaneGeometry(1, 1); rg.rotateX(-Math.PI / 2);
      cowRing = new THREE.Mesh(rg, new THREE.ShaderMaterial({ uniforms: { uTime: HU.uHcTime, uOn: { value: 0 }, uCol: { value: cHor.clone().lerp(new THREE.Color(1, 1, 1), 0.4).multiplyScalar(night ? 0.3 : 1.15) } }, transparent: true, depthWrite: false,
        vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xz * 2.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: /* glsl */`uniform float uTime, uOn; uniform vec3 uCol; varying vec2 vQ;
          void main(){ float r = length(vQ), a = 0.0;
            for (int i = 0; i < 3; i++) { float ph = fract(uTime * 0.33 + float(i) / 3.0); a += smoothstep(0.06, 0.0, abs(r - ph)) * (1.0 - ph); }
            gl_FragColor = vec4(uCol, a * uOn * smoothstep(1.0, 0.8, r) * 0.85); }` }));
      cowRing.scale.setScalar(3.6); cowRing.position.y = 0.03; cowRing.renderOrder = 2; cowRing.frustumCulled = false; cowRing.name = 'breath-rings'; air.add(cowRing);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- small custom animals
    const birdMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide }), UL, 'tc-bird', {
      pre: PRE_UNI, vHead: WOOD_VHEAD, vBody: 'vRuv = aRuv; if (aRuv.x < -0.5) transformed.y += sin(uHcTime * (aRuv.x < -1.5 ? 2.2 : 34.0)) * aRuv.y;', fHead: 'varying vec2 vRuv;\n', fLit: 'outgoingLight += diffuseColor.rgb * 0.08;',
    });
    const wingTri = (B, a, b, c, col, fa, fb, fc, kind) => { const b0 = B.pos.length / 3; for (const [p, f] of [[a, fa], [b, fb], [c, fc]]) { B.pos.push(p[0], p[1], p[2]); B.nor.push(0, 1, 0); B.col.push(col.r, col.g, col.b); B.uv.push(kind, f); } B.idx.push(b0, b0 + 1, b0 + 2); };
    // green kingfisher: plunges through the line beside the lens
    const kingfisher = (() => {
      const K = makeBuilder(), gr = new THREE.Color('#1f7a55').multiplyScalar(0.8), wh = new THREE.Color('#f2efe2').multiplyScalar(0.85), ru = new THREE.Color('#b0562c').multiplyScalar(0.8), bl = new THREE.Color('#161616');
      const kz = [0.26, 0.15, 0.1, 0.04, -0.04, -0.12, -0.2], kr = [0.003, 0.012, 0.034, 0.036, 0.046, 0.034, 0.006];
      tube(K, kz.map((z) => new V3(0, 0, z)), (i) => kr[i], 6, (i, j, out) => { const up = Math.sin((j / 6) * 6.283); tmpC.copy(i < 2 ? bl : up > 0.2 ? gr : i < 4 ? wh : ru); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; });
      for (let i = 0; i < K.uv.length; i += 2) K.uv[i] = 0.5;
      for (const sx of [-1, 1]) { wingTri(K, [sx * 0.03, 0.02, 0.05], [sx * 0.03, 0.02, -0.1], [sx * 0.24, 0.03, -0.03], gr, 0, 0, 0.13, -1); wingTri(K, [sx * 0.24, 0.03, -0.03], [sx * 0.03, 0.02, -0.1], [sx * 0.2, 0.03, -0.11], gr, 0.13, 0, 0.11, -1); }
      const g = finish(K); g.computeVertexNormals(); const m = new THREE.Mesh(g, birdMat); m.scale.setScalar(1.9); m.frustumCulled = false; m.visible = false; both.add(m); return m;
    })();
    // cormorant drying its wings on a trap stake
    {
      const K = makeBuilder(), dk = new THREE.Color('#1b1f1d'), br = new THREE.Color('#3a352a'), yl = new THREE.Color('#c79a3a');
      const cp = [new V3(0, 0, -0.1), new V3(0, 0.12, -0.04), new V3(0, 0.34, 0.02), new V3(0, 0.5, 0.03), new V3(0, 0.66, 0.0), new V3(0, 0.76, 0.05), new V3(0, 0.75, 0.2)], cr = [0.02, 0.09, 0.11, 0.06, 0.035, 0.04, 0.006];
      tube(K, cp, (i) => cr[i], 6, (i, j, out) => { tmpC.copy(i === 6 ? yl : i > 3 ? br : dk); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; });
      for (let i = 0; i < K.uv.length; i += 2) K.uv[i] = 0.5;
      for (const sx of [-1, 1]) { wingTri(K, [sx * 0.08, 0.42, 0], [sx * 0.08, 0.2, -0.02], [sx * 0.5, 0.5, -0.03], dk, 0, 0, 0.02, -2); wingTri(K, [sx * 0.5, 0.5, -0.03], [sx * 0.08, 0.2, -0.02], [sx * 0.62, 0.2, -0.05], br, 0.02, 0, 0.035, -2); }
      const g = finish(K); g.computeVertexNormals(); const m = new THREE.Mesh(g, birdMat); const st = stakes[7]; m.position.set(st.x, st.y, st.z); m.rotation.y = flip * 1.3 + 1.6; m.scale.setScalar(1.5); m.name = 'cormorant'; air.add(m);
    }
    // fiddler crabs on the barnacle band, waving one outsized claw in unison
    {
      const K = makeBuilder(), body = new THREE.Color('#7a4f30').multiplyScalar(0.8), claw = new THREE.Color('#f0c070').multiplyScalar(0.9);
      const v = (x, y, z, c, f) => { K.pos.push(x, y, z); K.nor.push(0, 1, 0); K.col.push(c.r, c.g, c.b); K.ext.push(f); return K.pos.length / 3 - 1; };
      const c0 = v(0, 0.035, 0, body, 0); const rim = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; rim.push(v(Math.cos(a) * 0.07, 0.012, Math.sin(a) * 0.05, body, 0)); }
      for (let i = 0; i < 6; i++) K.idx.push(c0, rim[(i + 1) % 6], rim[i]);
      const k0 = v(0.06, 0.02, 0.03, claw, 0), k1 = v(0.1, 0.03, 0.09, claw, 0.6), k2 = v(0.16, 0.05, 0.05, claw, 1), k3 = v(0.11, 0.1, 0.03, claw, 1); K.idx.push(k0, k1, k2, k0, k2, k3);
      for (const sx of [-1, 1]) for (let l = 0; l < 3; l++) { const z = -0.04 + l * 0.035, a = v(sx * 0.06, 0.02, z, body, 0), b = v(sx * 0.13, 0.0, z + 0.01, body, 0), c = v(sx * 0.07, 0.02, z + 0.015, body, 0); K.idx.push(a, b, c); }
      const g = finish(K, 'aClaw', 1); g.computeVertexNormals();
      const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), UC, 'tc-crab', {
        pre: '#define HC_AMT(p) 0.6\n', vHead: 'attribute float aClaw;\n', vBody: /* glsl */`
          float cm = step(1.5, aClaw), ck = min(aClaw, 1.0) * (1.0 - cm);                 // aClaw 2 marks a mudskipper: it hops on its own clock
          float cph = uHcTime * 3.2 + cm * (instanceMatrix[3].x * 5.0 + instanceMatrix[3].z * 3.0), hop = max(sin(cph * 0.55), 0.0);
          transformed.y += ck * (0.05 + 0.05 * sin(cph)) + cm * 0.2 * hop * hop * hop;
          transformed.x += ck * 0.03 * sin(cph); transformed.z += cm * 0.22 * smoothstep(-0.9, 0.9, sin(cph * 0.55 - 0.9));`,
      });
      const cr = rng.fork('crabs'), n = Math.min(crabSpots.length, Math.round((L.ebb ? 420 : 130) * DEN));
      cr.shuffle(crabSpots);
      const im = new THREE.InstancedMesh(g, mat, Math.max(1, n)), dm = new THREE.Object3D();
      for (let i = 0; i < n; i++) { const s = crabSpots[i]; dm.position.set(s.x, s.y + cr.range(-0.12, L.ebb ? 0.8 : 0.25), s.z); dm.rotation.set(0, s.a + cr.range(-1, 1), 0); dm.scale.setScalar(cr.range(1.3, 2.1)); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }
      im.count = n; im.frustumCulled = false; im.name = 'fiddler-crabs'; air.add(im);
      // mudskippers on the tunnel roots just above the line, hopping
      const Mk = makeBuilder(), mud = new THREE.Color('#6a5a3c').multiplyScalar(0.8), pale = new THREE.Color('#b8a070').multiplyScalar(0.8);
      const mz = [0.1, 0.075, 0.03, -0.03, -0.09, -0.13], mrad = [0.006, 0.022, 0.024, 0.017, 0.009, 0.014];
      tube(Mk, mz.map((z, i) => new V3(0, 0.022 + (i === 1 ? 0.008 : 0), z)), (i) => mrad[i], 5, (i, j, out) => { tmpC.copy(j === 3 || j === 4 ? pale : mud); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; });
      Mk.uv.length = 0; while (Mk.ext.length < Mk.pos.length / 3) Mk.ext.push(2);
      const spots = crabSpots.slice(n).concat(crabSpots.slice(0, n)).filter((sp) => { const q = path.nearestXZ(sp.x, sp.z); return q.u > 0.08 && q.dist < 7; }), nm = Math.min(spots.length, Math.round(70 * DEN));
      if (nm > 0) {
        const mim = new THREE.InstancedMesh(finish(Mk, 'aClaw', 1), mat, nm);
        for (let i = 0; i < nm; i++) { const sp = spots[i]; dm.position.set(sp.x, sp.y + cr.range(0.02, 0.3), sp.z); dm.rotation.set(0, sp.a + cr.range(-1.4, 1.4), 0); dm.scale.setScalar(cr.range(1.6, 2.4)); dm.updateMatrix(); mim.setMatrixAt(i, dm.matrix); }
        mim.frustumCulled = false; mim.name = 'mudskippers'; air.add(mim);
      }
    }
    // a seahorse gripping a root on the left at ten seconds
    let seahorse = null;
    {
      const want = beside(0.2, -2.9, -0.9); let best = null, bd = 1e9;
      for (const q of underPts) { const d = q.p.distanceToSquared(want); if (d < bd && q.p.y > -1.5 && q.p.y < -0.5) { bd = d; best = q; } }
      if (best) {
        const K = makeBuilder(), gold = new THREE.Color('#d9a43a').multiplyScalar(0.85), pale = new THREE.Color('#f0d890').multiplyScalar(0.85);
        const sp = [[0.03, -0.17], [0.0, -0.2], [-0.035, -0.17], [-0.02, -0.12], [0.02, -0.08], [0.035, 0.0], [0.03, 0.08], [0.0, 0.14], [-0.01, 0.2], [0.03, 0.24], [0.09, 0.225], [0.15, 0.2]].map(([x, y]) => new V3(x, y, 0));
        const sr2 = [0.006, 0.009, 0.012, 0.016, 0.024, 0.036, 0.034, 0.024, 0.026, 0.03, 0.014, 0.008];
        tube(K, sp, (i) => sr2[i], 5, (i, j, out) => { tmpC.copy(gold).lerp(pale, (i % 2) * 0.5); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; });
        const g = finish(K); g.deleteAttribute('aRuv');
        seahorse = new THREE.Mesh(g, spongeMat);
        const tx = chX(best.p.z); seahorse.position.set(best.p.x + (tx > best.p.x ? 1 : -1) * (best.r + 0.03), best.p.y + 0.17, best.p.z); seahorse.rotation.y = tx > best.p.x ? 0 : Math.PI; seahorse.scale.setScalar(1.6); sea.add(seahorse);
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- kit wildlife
    const airLight = { sunDir: sunDir.toArray(), sunColor: sunCol, sunIntensity: sky.lightIntensity * L.rig.intensity, sky: sky.ambientColor, skyIntensity: sky.ambientIntensity * L.rig.ambient, ground: sky.groundColor, groundIntensity: sky.ambientIntensity * 0.7 };
    const seaLightOf = (fogC, sunC) => ({ sunDir: [sunDir.x * 0.4, 0.9, sunDir.z * 0.4], sunColor: sunC, sunIntensity: night ? 1.3 : 2.3, sky: fogC.clone().multiplyScalar(night ? 9 : 2.4), skyIntensity: 1.2, ground: fogC.clone().multiplyScalar(night ? 5 : 1.2), groundIntensity: 1 });
    const seaLight = seaLightOf(L.tea, L.seaSun), lagLight = seaLightOf(L.turq, L.seaSunLag);
    const fr = rng.fork('fauna');
    const addF = (group, f) => { group.add(f.object); updaters.push((dt, time, cam, u) => f.update(dt, time, cam, u)); return f; };
    const sharkCol = L.shark === 'lemon' ? { top: '#9c8a52', belly: '#d9d2b4', fin: '#7d6e40' } : { top: '#6f7a80', belly: '#e6e8e4', fin: '#121416' };
    const pups = (count, o) => addF(sea, F.makeShark({ rng: fr.fork('s' + count + (o.cross?.u ?? o.along?.from)), count, length: fr.range(0.75, 0.95), light: seaLight, caustics: 0.5, ...sharkCol, ...o }));
    { const c = beside(12.5 / path.length, -1.45, -1.95); pups(2, { center: [c.x, c.y, c.z], radius: 1.3, height: 0.2, speed: 0.8 }); }      // two pups circle in the murk of the opening, a body length from the lens as it passes
    await ctx.yield();
    pups(3, { cross: { path, u: 0.05, lead: 3, height: -1.7, angle: 22, side: 1, span: 38, duration: DUR } });      // one slides out of the haze at the entry
    await ctx.yield();
    pups(2, { cross: { path, u: 0.06, lead: 3.4, height: -1.3, angle: 20, side: -1, span: 40, duration: DUR } });
    await ctx.yield();
    pups(3, { cross: { path, u: 0.265, lead: 2.6, height: -1.2, angle: 16, side: -1, span: 46, duration: DUR } });
    await ctx.yield();
    pups(Math.round(3 * DEN), { along: { path, side: -2.7, up: -1.6, lead: 7.5, from: 0.34, to: uMouth + 0.03, drift: 2 } });
    await ctx.yield();
    pups(Math.round(4 * DEN), { cross: { path, u: uMouth - 0.035, lead: 6, height: -1.9, angle: 38, side: 1, span: 44, duration: DUR } });
    await ctx.yield();
    // the mid layer of the reveal: pups and a school 8-20 m ahead of the lens all the way from the mouth to the dome
    pups(3, { light: lagLight, spread: [2.6, 0.7, 5], along: { path, side: -3.2, up: -2.3, lead: 10, from: uMouth - 0.03, to: uDome + 0.02, drift: 3 } });
    await ctx.yield();
    pups(3, { light: lagLight, spread: [3, 0.8, 6], along: { path, side: 2.6, up: -2.9, lead: 17, from: uMouth - 0.02, to: uDome + 0.03, drift: 4 } });
    await ctx.yield();
    pups(3, { light: lagLight, spread: [1.6, 0.5, 3.2], cross: { path, u: uTrunk + 0.004, lead: 4.6, height: -2.2, angle: 26, side: -flip, span: 34, duration: DUR } });      // through the hole the ball opens round the lens
    await ctx.yield();
    pups(3, { light: lagLight, spread: [2.2, 0.6, 4], cross: { path, u: 0.945, lead: 9, height: -3.4, angle: 58, side: flip, span: 46, duration: DUR } });                   // and under the exit ring
    await ctx.yield();
    addF(sea, F.makeFishSchool({ rng: fr.fork('lagoon'), species: 'mackerel', count: Math.round(70 * DEN), size: 0.5, top: '#3f7a86', belly: '#f2f4ee', fin: '#e8d060', light: lagLight, spread: [3.2, 1.2, 7],
      along: { path, side: -0.6, up: -2.6, lead: 13, from: uMouth - 0.03, to: uDome + 0.02, drift: 4 } }));
    await ctx.yield();
    {   // upside-down jellyfish pulsing on the sand: bell down, frilled arms to the light
      const K = makeBuilder(), cB = new THREE.Color('#eadfc6').multiplyScalar(0.72), cR = new THREE.Color('#f4f6ee').multiplyScalar(0.85), cA = new THREE.Color(night ? '#3fb8e8' : '#58c8b4').multiplyScalar(0.95), cT = new THREE.Color('#e6d8a8').multiplyScalar(0.85);
      const v = (x, y, z, c, f) => { K.pos.push(x, y, z); K.nor.push(0, 1, 0); K.col.push(c.r, c.g, c.b); K.ext.push(f); return K.pos.length / 3 - 1; };
      const NS2 = 10, c0 = v(0, 0.07, 0, cB, 0), r1 = [], r2 = [];
      for (let i = 0; i < NS2; i++) { const a = (i / NS2) * 6.283; r1.push(v(Math.cos(a) * 0.13, 0.075, Math.sin(a) * 0.13, cB, 0.4)); r2.push(v(Math.cos(a) * 0.22, 0.015, Math.sin(a) * 0.22, cR, 1)); }
      for (let i = 0; i < NS2; i++) { const n1 = (i + 1) % NS2; K.idx.push(c0, r1[n1], r1[i], r1[i], r1[n1], r2[n1], r1[i], r2[n1], r2[i]); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 + 0.3, ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca;
        const b = v(ca * 0.03, 0.08, sa * 0.03, cA, 0.2), l = v(ca * 0.1 + px * 0.045, 0.15, sa * 0.1 + pz * 0.045, cA, 0.7), r = v(ca * 0.1 - px * 0.045, 0.13, sa * 0.1 - pz * 0.045, cA, 0.7), t = v(ca * 0.17, 0.2, sa * 0.17, cT, 1.3);
        K.idx.push(b, l, r, l, t, r); }
      const g = finish(K, 'aJ', 1); g.computeVertexNormals();
      const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, side: THREE.DoubleSide }), UC, night ? 'tc-jelly-n' : 'tc-jelly', {
        pre: '#define HC_AMT(p) 0.4\n', vHead: 'attribute float aJ;\n',
        vBody: 'float jph = instanceMatrix[3].x * 3.1 + instanceMatrix[3].z * 1.7, jpu = sin(uHcTime * 2.4 + jph); transformed.xz *= 1.0 + aJ * 0.17 * jpu; transformed.y *= 1.0 - aJ * 0.22 * jpu; transformed.x += aJ * aJ * 0.012 * sin(uHcTime * 1.1 + jph * 2.0);',
        fLit: '{ float jr = 1.0 - abs(dot(normal, normalize(vViewPosition))); outgoingLight += diffuseColor.rgb * (' + (night ? 'vec3(0.25, 1.1, 1.9)' : 'vec3(0.22)') + ' + ' + (night ? 'vec3(0.2, 0.9, 1.4)' : 'uHcSunCol * 0.3') + ' * jr * jr); }',
      });
      const nScat = Math.round(18 * DEN), nClu = 9, n = nScat + 6 + nClu * 5, im = new THREE.InstancedMesh(g, mat, n), dm = new THREE.Object3D();
      const put = (i, uu, lat, sc) => { const p = beside(uu, lat, 0); dm.position.set(p.x, floorY(p.x, p.z) + 0.01, p.z); dm.rotation.set(fr.range(-0.1, 0.1), fr.range(0, 6.283), fr.range(-0.1, 0.1)); dm.scale.setScalar(sc); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); };
      let ji = 0;
      for (let i = 0; i < nScat; i++) put(ji++, fr.range(0.0, 0.4), fr.range(-3.2, 3.2), fr.range(1.2, 2.0));
      for (let i = 0; i < 6; i++) put(ji++, (6 + i * 1.6 + fr.range(-0.3, 0.3)) / path.length, (i % 2 ? 1 : -1) * fr.range(0.25, 1.5), fr.range(1.3, 1.75));          // six half-metre bells in the opening view
      for (let c = 0; c < nClu; c++) { const uc = 0.05 + c * 0.042 + fr.range(-0.008, 0.008), lc = (c % 2 ? -1 : 1) * fr.range(0.5, 1.9); for (let k = 0; k < 5; k++) put(ji++, uc + fr.range(-0.004, 0.004), lc + fr.range(-0.8, 0.8), fr.range(1.2, 1.9)); }
      im.frustumCulled = false; im.name = 'jellyfish'; sea.add(im);
    }
    addF(sea, F.makeFishSchool({ rng: fr.fork('needle'), species: 'mackerel', count: Math.round(22 * DEN), size: 0.9, top: '#6f9a8a', belly: '#f0f2ea', light: seaLight, spread: [2.4, 0.12, 6],
      along: { path, side: -1.2, up: -0.52, lead: 5.5, from: 0.1, to: uMouth + 0.06, drift: 2 } }));      // needlefish hanging just under the mirror
    await ctx.yield();
    addF(sea, F.makeFishSchool({ rng: fr.fork('nursery'), species: 'mackerel', count: Math.round(46 * DEN), size: 0.55, top: '#8a8a4a', belly: '#f0e2a0', fin: '#e0c040', light: seaLight, spread: [2.4, 0.9, 6],
      along: { path, side: 1.2, up: -1.75, lead: 7, from: -0.05, to: 0.3, drift: 3 } }));
    await ctx.yield();
    addF(sea, F.makeMantaRay({ rng: fr.fork('sting'), span: 0.6, top: '#8a7858', belly: '#e8e0c8', light: seaLight, cross: { path, u: 0.43, lead: 5.5, height: -2.7, angle: 32, side: -1, span: 30, rise: 1.3, duration: DUR } }));
    await ctx.yield();
    if (L.big === 'turtle') addF(sea, F.makeTurtle({ rng: fr.fork('turtle'), length: 1.5, count: 1, light: lagLight, center: [-4.6, -1.15, -49], radius: 3.1, height: 0.7, speed: 0.8 }));
    await ctx.yield();
    if (L.big === 'rays') addF(sea, F.makeMantaRay({ rng: fr.fork('eagle'), span: 1.15, count: 2, top: '#2c3440', belly: '#f0f0ea', light: lagLight, center: [-5.6, -1.9, -49], radius: 4.2, height: 0.9 }));
    await ctx.yield();
    if (L.rare) addF(sea, F.makeShark({ rng: fr.fork('tarpon'), count: 1, length: 2.3, top: '#9fb0b4', belly: '#f4f6f4', fin: '#8a9a9e', spec: 2, speed: 7, light: lagLight, cross: { path, u: uDome - 0.05, lead: 46, height: -2.9, angle: 75, side: flip, span: 70, duration: DUR } }));
    await ctx.yield();
    await ctx.yield();
    const birdCol = { body: L.accent, belly: L.accent, wingC: L.accent, head: L.accent, neckC: L.accent, tailC: L.accent, trail: L.accent, tip: L.bird === 'egret' ? L.accent : '#141212', beak: L.bird === 'egret' ? '#e0a828' : '#4a2620', legC: L.bird === 'egret' ? '#20201c' : '#b8433a' };
    const lines = L.hour === 'golden' ? 3 : night ? 0 : 1;
    for (let i = 0; i < lines; i++) addF(air, F.makeFlock({ rng: fr.fork('line' + i), species: 'flamingos', count: Math.round((L.hour === 'golden' ? 20 : 11) * DEN), size: 1.05, glide: 0.25, light: airLight, ...birdCol,
      cross: { path, u: uMouth + 0.1 + i * 0.09, lead: 62 - i * 8, height: 13 + i * 5, angle: 62 + i * 14, side: i % 2 ? -flip : flip, span: 320, duration: DUR } }));
    await ctx.yield();
    addF(air, F.makeFlock({ rng: fr.fork('tunnel'), species: 'flamingos', count: Math.round(5 * DEN), size: 0.95, glide: 0.75, spacing: 5, light: airLight, ...birdCol, along: { path, side: -0.6, up: 4.0, lead: 24, from: 0.09, to: uMouth + 0.05, drift: 5 } }));
    await ctx.yield();
    {   // the accent birds strung through the tunnel, standing on the root arches and probing
      const pr = fr.fork('perch'), mine = perches.filter((p) => { const q = path.nearestXZ(p.x, p.z); return q.u > 0.085 && q.u < uMouth + 0.03 && q.dist > 3; });
      pr.shuffle(mine); const n = Math.min(mine.length, Math.round(42 * DEN));
      await ctx.yield();
      if (n > 0) {
        const pos = mine.slice(0, n).map((p) => [p.x, p.y, p.z]);
        const hAt = (x, z) => { let b = 0, bd = 1e9; for (const p of pos) { const d = (p[0] - x) * (p[0] - x) + (p[2] - z) * (p[2] - z); if (d < bd) { bd = d; b = p[1]; } } return b; };
        addF(air, F.makeWaders({ rng: pr, species: 'egret', count: n, positions: pos, heightAt: hAt, level: 0, size: 1.05, blobShadow: false, light: airLight,
          body: L.accent, belly: L.accent, wing: L.accent, neckC: L.accent, cap: L.accent, beakC: birdCol.beak, legC: birdCol.legC }));
      }
    }
    await ctx.yield();
    if (!night) addF(air, F.makeDragonflies({ rng: fr.fork('dragon'), path, uFrom: 0.09, uTo: uMouth + 0.06, count: Math.round(34 * DEN), clear: 1.6, spread: 5.5, lift: [0.1, 2.4], size: 2.2, light: airLight }));
    await ctx.yield();
    await ctx.yield();

    // ---------------------------------------------------------------- particles
    const rainP = L.rain > 0 ? fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: fxTime, count: Math.round((squall ? 9000 : 3200) * detail), velocity: [squall ? -7 : -3.5, -22, 1],
      colors: night ? ['#9fc0e0', '#c8e0ff', '#7fa0c0'] : squall ? ['#c8d4d8', '#e0e8ea', '#a8b8be'] : ['#fff0c0', '#ffe2a0', '#ffffff'], intensity: squall ? 1.5 : 1.5 }) : null;
    await ctx.yield();
    if (rainP) { air.add(rainP.object); rainP.setOpacity(0); }
    const motes = fx.makeParticles({ rng: rng.fork('motes'), preset: night ? 'plankton' : 'dust', time: fxTime, count: Math.round(2400 * detail), box: [16, 7, 16],
      velocity: [0.28, 0.03, 0.12], size: [0.014, 0.05], ...(night ? { colors: ['#49c8ff', '#8fe8ff', '#2a8fff'], intensity: 2.6 } : { colors: ['#ffd27a', '#e8a040', '#fff0c0'], intensity: 1.2 }) });
    await ctx.yield();
    sea.add(motes.object);
    const sprQuad = new THREE.PlaneGeometry(2, 2);
    const sprites = (n, sr3, o) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = sprQuad.index; g.setAttribute('position', sprQuad.getAttribute('position'));
      const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { iA.set([sr3.range(-1, 1) * o.box[0], sr3.range(-1, 1) * o.box[1], sr3.range(-1, 1) * o.box[2], sr3.range(o.size[0], o.size[1])], i * 4); iB.set([sr3.range(o.rate[0], o.rate[1]), o.fixed ? 0.5 + 0 * sr3() : sr3(), o.flow, sr3.range(0.5, 1) * o.rise], i * 4); }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = n;
      const U = { ...fogU(), uOrg: { value: new V3() }, uFlow: { value: new V3() }, uTime: HU.uHcTime, uOn: { value: 1 }, uTop: { value: o.top ?? -0.03 }, uCol: { value: new THREE.Color(o.color) }, uSoft: { value: o.soft ?? 0 } };
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, fog: o.fog !== false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.frustumCulled = false; m.renderOrder = 4; sea.add(m); return { m, U };
    };
    const sp3 = rng.fork('sprites');
    const bubCol = night ? new THREE.Color(0.2, 0.9, 1.8) : new THREE.Color(0.9, 0.95, 0.9);
    const bowBub = sprites(90, sp3, { box: [0.3, 0.22, 0.25], size: [0.012, 0.035], rate: [0.5, 1.3], flow: 4.5, rise: 0.2, color: bubCol });
    await ctx.yield();
    const kingBub = sprites(70, sp3, { box: [0.16, 0.3, 0.16], size: [0.012, 0.04], rate: [1.2, 2.4], flow: 0, rise: 1.3, color: bubCol });
    await ctx.yield();
    const puff = sprites(26, sp3, { box: [0.2, 0.05, 0.2], size: [0.14, 0.36], rate: [0.25, 0.25], flow: 0, rise: 0.5, color: night ? '#0a2a3a' : '#5a4a2a', soft: 1, top: -0.3 });
    await ctx.yield();
    // the last silversides streaming round the lower rim of the exit ring
    const ribU = { ...fogU(), uTime: HU.uHcTime, uRing: { value: new THREE.Vector4(path.end.x, EYE, path.end.z, 7) }, uLit: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() } };
    {
      const g = new THREE.InstancedBufferGeometry(), n = Math.round(300 * DEN), aS = new Float32Array(n * 4); for (let i = 0; i < aS.length; i++) aS[i] = sp3();
      g.setAttribute('position', new THREE.Float32BufferAttribute([0.5, 0, 0, 0.17, 0.14, 0, -0.36, 0, 0, 0.5, 0, 0, -0.36, 0, 0, 0.17, -0.125, 0, -0.34, 0, 0, -0.52, 0.15, 0, -0.52, -0.15, 0], 3));
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.instanceCount = n;
      const rib = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: ribU, vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, fog: true, side: THREE.DoubleSide }));
      rib.name = 'rim-silversides'; rib.frustumCulled = false; sea.add(rib);
    }
    disposables.push(sprQuad);

    // ---------------------------------------------------------------- the split: sea-pass target, composite quad, lens overlay
    const samples = ctx.quality?.level === 'ultra' ? 4 : ctx.quality?.level === 'high' ? 2 : 0;
    const rt = new THREE.WebGLRenderTarget(8, 8, { type: THREE.HalfFloatType, depthBuffer: true, samples });
    rt.texture.minFilter = THREE.LinearFilter; rt.texture.magFilter = THREE.LinearFilter; rt.texture.generateMipmaps = false; rt.scissorTest = true;
    const underCam = new THREE.PerspectiveCamera(48, 1.78, 0.25, 260);
    const compU = { tUnder: { value: rt.texture }, uSeam: { value: 1.06 }, uTime: HU.uHcTime, uMen: { value: 0.02 }, uWob: { value: 1 }, uShift: { value: 0 }, uTint: { value: L.tint.clone() }, uLine: { value: new THREE.Color() }, uLift: { value: new THREE.Color(0, 0, 0) } };
    const comp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: compU, vertexShader: COMP_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: true, fog: false, toneMapped: false }));
    comp.material.depthTest = true; comp.material.depthFunc = THREE.AlwaysDepth;
    comp.frustumCulled = false; comp.renderOrder = -100000; comp.name = 'sea-half'; scene.add(comp);
    const lensU = { uSeam: compU.uSeam, uDrain: { value: 0 }, uAspect: { value: 1.78 }, uTime: HU.uHcTime, uSkyC: { value: cHor.clone().lerp(new THREE.Color(1, 1, 1), 0.3).multiplyScalar(night ? 0.25 : 0.9) }, uDarkC: { value: cShade.clone().multiplyScalar(night ? 0.03 : 0.25) } };
    const lens = (() => {
      const g = new THREE.InstancedBufferGeometry(); g.index = sprQuad.index; g.setAttribute('position', sprQuad.getAttribute('position'));
      const n = 41, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), lrg = rng.fork('lens');
      for (let i = 1; i < n; i++) { iA.set([lrg.range(0.03, 0.97), lrg(), lrg.range(0.006, 0.02), lrg.range(0.2, 1)], i * 4); iB.set([1, 0, 0, 0], i * 4); }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: lensU, vertexShader: LENS_VERT, fragmentShader: LENS_FRAG, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
      m.frustumCulled = false; m.renderOrder = 100000; m.name = 'lens'; scene.add(m); return m;
    })();

    // ---------------------------------------------------------------- per-frame
    const sunL = rig.sun, hemiL = rig.hemi;
    const sunBase = { c: sunL.color.clone(), i: sunL.intensity }, hemiBase = { c: hemiL.color.clone(), g: hemiL.groundColor.clone(), i: hemiL.intensity };
    const _ref = new V3(), _p = new V3(), _q = new THREE.Quaternion(), _s = new V3(), _f = new V3(), _a = new V3(), _b = new V3(), _sz = new THREE.Vector2(), Y = new V3(0, 1, 0);
    const seaSunNow = new THREE.Color(), rayNow = new THREE.Color(), sandC = new THREE.Color('#E9DDB8');
    const drainAfter = (u, e) => (u > e ? 1 - smoothstep(e, e + 0.075, u) : 0);
    const breatheK = L.weather === 'calm' ? 0 : squall ? 1.5 : 1;
    const eKing = uKing + 0.024, eDuck = uTrunk + 0.022, eSurf = uSurf + 0.024;
    const split = (u, time, pre) => {
      const open = smoothstep(uSurf - 0.004, eSurf, u);
      let seam = lerp(1.07, 0.5, open * open * (3 - 2 * open));
      const hold = Math.max(smoothstep(uMouth - 0.03, uMouth - 0.01, u) * (1 - smoothstep(uMouth + 0.075, uMouth + 0.1, u)), smoothstep(0.93, 0.955, u), 1 - smoothstep(eSurf, eSurf + 0.03, u));
      seam += (0.042 * Math.sin(time * 1.25) + 0.018 * Math.sin(time * 2.7 + 1)) * breatheK * (1 - hold);
      const d1 = smoothstep(uKing - 0.008, uKing - 0.001, u) * (1 - smoothstep(uKing + 0.012, eKing, u));
      const d2 = smoothstep(uLintel - 0.03, uLintel - 0.013, u) * (1 - smoothstep(uTrunk + 0.004, eDuck, u));
      seam = lerp(seam, 1.07, Math.max(d1, d2));
      // seen through the previous portal the opening shows the split itself (canopy above, tea-gold below); the line
      // then rises over the lens in the last metres before the crossing, so the trip still starts fully under water
      seam = lerp(seam, 0.5 + 0.02 * Math.sin(time * 1.25) * breatheK, pre);
      let eyeY = lerp(-1.9, -0.35, smoothstep(0.0, uSurf, u));
      eyeY = lerp(eyeY, -0.95, d1); eyeY = lerp(eyeY, -1.75, d2); eyeY = lerp(eyeY, -0.9, pre);
      const drain = Math.max(drainAfter(u, eSurf - 0.006), drainAfter(u, eKing - 0.004), drainAfter(u, eDuck - 0.006));
      const shift = lerp(0.045, 0.022, smoothstep(uMouth - 0.035, uMouth + 0.045, u)) * (1 - smoothstep(uTrunk + 0.01, uOut, u)) * (1 - smoothstep(0.6, 0.85, seam));
      return { seam, eyeY, drain, d1, d2, shift };
    };
    const kfPos = (k, u, out) => {
      let ahead, lat, y;
      if (k < 0.35) { const e = k / 0.35; ahead = lerp(17, 5.5, e); lat = lerp(-6.5, -1.9, e); y = lerp(4.6, 0, e * e); }
      else if (k < 0.7) { const e = (k - 0.35) / 0.35; ahead = lerp(5.5, 4.6, e); lat = lerp(-1.9, -1.3, e); y = -1.15 * Math.sin(Math.PI * e); }
      else { const e = (k - 0.7) / 0.3; ahead = lerp(4.6, 14, e); lat = lerp(-1.3, -6, e); y = lerp(0, 3.8, Math.sqrt(e)); }
      return beside(u + ahead / path.length, lat, y, out);
    };
    const chunkZ = (i) => 358 - 38 * (i + 0.5);
    const seaStats = { triangles: 0, calls: 0 };
    // ENGINE DEPENDENCY: the engine adds the exit portal's object to this scene at path.end. It is found once by position,
    // cached, and looked for again only now and then if missing; if the engine renames or drops it, the lower arc is simply
    // not drawn into the sea half.
    const own = new Set([air, sea, both, comp, lens]), visBuf = [];
    let gate = null, gateWait = 0;
    const findGate = () => {
      if (gate && gate.parent === scene) return gate;
      gate = null; if (gateWait-- > 0) return null; gateWait = 20;
      for (const c of scene.children) if (!own.has(c) && _a.setFromMatrixPosition(c.matrixWorld).distanceToSquared(path.end) < 4) gate = c;
      return gate;
    };
    const heroAir = hero.airOnly || [], heroSea = hero.seaOnly || [];

    function update(dt, time, camera, u) {
      fxTime.value = time;
      const preS = smoothstep(1.5, 9, camera.near);
      const S = split(u, time, preS);
      const fa = smoothstep(uMouth - 0.13, uMouth + 0.04, u), fs = smoothstep(uMouth - 0.16, uMouth + 0.03, u);
      airFog.copy(hazeTunnel).lerp(hazeLagoon, fa); const airDen = lerp(L.hazeDen[0], L.hazeDen[1], fa);
      // tea, then green-gold where the two waters marble, then turquoise: full turquoise still lands at the mouth
      if (fs < 0.5) seaFog.copy(L.tea).lerp(L.mix, smoothstep(0, 0.5, fs)); else seaFog.copy(L.mix).lerp(L.turq, smoothstep(0.5, 1, fs));
      const seaDen = lerp(L.seaDen[0], L.seaDen[1], fs * fs);
      camera.matrixWorld.decompose(_p, _q, _s);
      _f.set(0, 0, -1).applyQuaternion(_q); _ref.copy(_p).addScaledVector(_f, camera.near);
      const camR = Math.hypot(_ref.x, _ref.z), dome = 1 - smoothstep(16, 27, camR);
      uCanopy.value = Math.max(smoothstep(MOUTH_Z - 6, MOUTH_Z + 6, _ref.z), dome * 0.9);
      const rainK = L.weather === 'shower' ? smoothstep(uMouth + 0.13, uDome - 0.03, u) * (1 - smoothstep(uOut + 0.01, 0.97, u)) * L.rain : L.rain;
      waterU.uRain.value = rainK; if (rainP) rainP.setOpacity(rainK * (squall ? 1 : 0.6));
      // the rare tarpon strike: the ball bursts while the lens is still 40 m out, then pulls itself together again before
      // the dunk goes through it; the birds it scared stay in the air
      hero.setAvoid(null, lerp(2.5, 3.1, S.d2));
      if (L.rare) { const k = smoothstep(uDome - 0.1, uDome - 0.04, u); hero.setStrike(k, k * (1 - 0.88 * smoothstep(uDome - 0.02, uLintel - 0.004, u))); }

      // our canoe rides with the lens
      const yaw = Math.atan2(-_f.x, -_f.z);
      canoe.position.set(_p.x, 0.03 * Math.sin(time * 1.7), _p.z); canoe.rotation.set(0.03 * Math.sin(time * 1.3 + 0.8), yaw, 0.03 * Math.sin(time * 1.1));
      bowBub.U.uOrg.value.set(HX, -0.55, BOW + 0.45).applyAxisAngle(Y, yaw).add(canoe.position); bowBub.U.uFlow.value.set(-_f.x, 0, -_f.z);
      const fyCam = floorY(_p.x, _p.z);
      pole.visible = fyCam > -4.2;
      if (pole.visible) {
        const c = (time / 4) % 1, planted = c < 0.6, k = planted ? c / 0.6 : (c - 0.6) / 0.4;
        _a.set(HX + 0.6, 1.6, 1.6).applyAxisAngle(Y, yaw).add(canoe.position);
        _b.set(HX + 0.75, 0, planted ? lerp(-6.8, -0.4, k) : lerp(-0.4, -6.8, k * k * (3 - 2 * k))).applyAxisAngle(Y, yaw).add(canoe.position);
        _b.y = floorY(_b.x, _b.z) + (planted ? 0.02 : 1.9 * Math.sin(Math.PI * k));
        if (planted && k < 0.3) puff.U.uOrg.value.copy(_b);
        puff.U.uOn.value = planted ? (1 - smoothstep(0.15, 0.9, k)) * 0.8 : 0;
        pole.position.copy(_b); _a.sub(_b); const len = _a.length(); pole.scale.set(1, len, 1); pole.quaternion.setFromUnitVectors(Y, _a.multiplyScalar(1 / len));
      } else puff.U.uOn.value = 0;
      // manatees rise to breathe
      for (const c of seaCows) {       // one breath each, keyed to progress: nostrils break the line as the lens comes out of the dome
        const b = smoothstep(0.885 + c.ph * 0.03, 0.918 + c.ph * 0.03, u) * (1 - smoothstep(0.972 + c.ph * 0.012, 0.998, u));
        c.m.position.set(c.x + Math.sin(time * 0.1 + c.ph * 5) * 0.3, lerp(-1.3 * c.sc, 0.38 * c.sc + 0.1, b) + 0.04 * Math.sin(time * 0.8 + c.ph * 9), c.z + Math.sin(time * 0.07 + c.ph * 3) * 0.5);
        c.m.rotation.set(-0.34 * b + 0.04 * Math.sin(time * 0.6 + c.ph), 1.15 + 0.2 * Math.sin(time * 0.05 + c.ph * 2), 0);
        if (c === seaCows[0]) { const yw = c.m.rotation.y; cowRing.position.set(c.m.position.x + Math.sin(yw) * 1.3, 0.03, c.m.position.z + Math.cos(yw) * 1.3); cowRing.material.uniforms.uOn.value = smoothstep(0.5, 0.95, b); }
      }
      // the kingfisher's plunge, keyed to progress
      const kk = (u - (uKing - 0.03)) / 0.07;
      kingfisher.visible = kk > 0 && kk < 1;
      if (kingfisher.visible) {
        kfPos(kk, u, kingfisher.position); kfPos(Math.min(1, kk + 0.02), u + 0.0014, _a); kingfisher.lookAt(_a);
        kingBub.U.uOrg.value.copy(kingfisher.position); kingBub.U.uOrg.value.y = Math.min(-0.45, kingfisher.position.y);
      }
      kingBub.U.uOn.value = smoothstep(0.35, 0.4, kk) * (1 - smoothstep(0.72, 0.98, kk));
      for (const b of boats) {
        if (b.tied) { b.o.position.y = 0.03 * Math.sin(time * 1.3); b.o.rotation.z = 0.05 * Math.sin(time * 0.9); continue; }
        const f = b.keyed ? clamp((u - 0.46) / 0.4, 0, 1) : (time / b.T + b.ph) % 1, sc = smoothstep(0, 0.04, f) * (1 - smoothstep(0.96, 1, f));
        b.o.position.set(lerp(b.a[0], b.b[0], f), 0.03 * Math.sin(time * 1.1 + b.ph * 9), lerp(b.a[1], b.b[1], f)); b.o.rotation.z = 0.06 * Math.sin(time * 0.8 + b.ph * 5); b.o.scale.setScalar(Math.max(0.001, sc) * 2.0);
      }
      if (seahorse) seahorse.rotation.z = 0.14 * Math.sin(time * 1.1);
      foamU.uSpeed.value = 1;

      // ---- kit pieces follow the engine's camera
      sky.update(dt, time, camera); rig.update(dt, time, camera); for (let i = 0; i < cloudFields.length; i++) cloudFields[i].update(dt, time, camera);
      for (const f of updaters) f(dt, time, camera, u);
      sunBase.c.copy(sunL.color); sunBase.i = sunL.intensity; hemiBase.c.copy(hemiL.color); hemiBase.g.copy(hemiL.groundColor); hemiBase.i = hemiL.intensity;

      // ---- SEA PASS: its own eye, field of view, fog and light, into the target
      renderer.getDrawingBufferSize(_sz);
      const w = Math.max(8, Math.round(_sz.x)), h = Math.max(8, Math.round(_sz.y));
      if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
      rt.scissor.set(0, 0, w, Math.min(h, Math.ceil(h * (S.seam + 0.04 + S.shift))));
      // While this world is only seen through the previous portal, the engine's camera stands far behind the entry
      // with its near plane on the portal: 9 m of tannin would then show as flat fog. The sea eye is dollied up to
      // within 6 m of that plane and widened to frame the same window (identical again by the time of the crossing).
      const nearD = camera.near, backD = Math.min(nearD, 6), pre = smoothstep(2, 6, nearD);
      underCam.position.set(_p.x + _f.x * (nearD - backD), S.eyeY, _p.z + _f.z * (nearD - backD)); underCam.quaternion.copy(_q);
      underCam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) / 1.33 * (nearD / backD)));
      underCam.aspect = camera.aspect; underCam.near = backD; underCam.far = 240; underCam.updateProjectionMatrix(); underCam.updateMatrixWorld(true);
      seaSunNow.copy(L.seaSun).lerp(L.seaSunLag, fs); rayNow.copy(L.rayCol).lerp(L.rayLag, fs).multiplyScalar(night ? 0.3 : lerp(0.9, 0.18, fs));
      fog.color.copy(seaFog); fog.density = seaDen * lerp(1, 0.55, pre); seaBg.copy(seaFog); scene.background = seaBg;
      sunL.color.copy(sunBase.c).multiply(seaSunNow); sunL.intensity = sunBase.i * 0.8;
      hemiL.color.copy(seaFog).multiplyScalar(night ? 12 : 2.6); hemiL.groundColor.copy(sandC).multiply(seaFog).multiplyScalar(night ? 10 : 2.2); hemiL.intensity = night ? 1.6 : 1.5;
      floorU.uSunCol.value.copy(seaSunNow).multiplyScalar(night ? 0.5 : lerp(2.3, 0.95, fs)); floorU.uAmb.value.copy(seaFog).multiplyScalar(night ? 3.4 : lerp(1.05, 0.8, fs)); if (!night) { floorU.uAmb.value.r += 0.1 * fs; floorU.uAmb.value.g += 0.05 * fs; }      // warm sand under the turquoise, not mint
      floorU.uAbsorb.value.setRGB(lerp(0.95, 0.42, fs), lerp(0.62, 0.86, fs), lerp(0.3, 0.84, fs));
      rayU.uCol.value.copy(rayNow); rayU.uLen.value = lerp(3.2, 8, fs); rayU.uWid.value = lerp(1, 0.8, fs); rayU.uFrac.value = lerp(0.5, 1, fs); rayU.uCam.value.copy(underCam.position); rayU.uCtr.value.copy(_ref).addScaledVector(_f, 9); waterU.uCam.value.copy(underCam.position);
      air.visible = false; sea.visible = true; comp.visible = false; lens.visible = false;
      const heroShow = u > uMouth - 0.15;
      hero.object.visible = camR < 175 && fs > 0.02 && (camR - 26) * seaDen < 4.6;      // beyond that it is pure fog colour
      { const reach = Math.max(clamp(4.6 / seaDen, 36, 62), 62 * pre); for (let i = 0; i < NCH; i++) channelMeshes[i].visible = Math.abs(chunkZ(i) - _ref.z) < reach; }
      hero.update(dt, time, underCam);
      for (let i = 0; i < heroAir.length; i++) heroAir[i].visible = false;
      for (let i = 0; i < channelSea.length; i++) channelSea[i].visible = _ref.z > MOUTH_Z - 14;
      if (hero.baitBall) hero.baitBall.geometry.instanceCount = Math.round(hero.fishCount * lerp(1, 0.45, smoothstep(55, 80, camR)));     // far off the fish are drawn larger, so fewer will do
      for (let i = 0; i < heroSea.length; i++) heroSea[i].visible = true;
      wormU.uEye.value.copy(underCam.position); wormU.uLit.value.copy(floorU.uAmb.value).multiplyScalar(1.2).add(tmpC.copy(seaSunNow).multiplyScalar(night ? 0.15 : 0.4));
      ribU.uLit.value.copy(seaFog).multiplyScalar(night ? 6 : 1.3).add(tmpC.copy(seaSunNow).multiplyScalar(night ? 0.2 : 0.45)); ribU.uSunCol.value.copy(seaSunNow).multiplyScalar(night ? 0.6 : 1.3);
      beside(u + 16 / path.length, 0, S.eyeY - 0.5, _a).sub(underCam.position); if (_a.lengthSq() < 1 || preS > 0) _a.copy(_f); waterU.uAlmDir.value.copy(_a).normalize();
      if (night) waterU.uAlm.value.setRGB(0.012, 0.05, 0.075).multiplyScalar(1 - fs); else { const ak = smoothstep(0.1, 0.26, u);       // the almond at the tunnel's end turns from green-gold to lagoon turquoise long before the water does
        waterU.uAlm.value.setRGB(lerp(0.52, -0.16, ak), lerp(0.8, 0.62, ak), lerp(0.22, 0.74, ak)).multiplyScalar((squall ? 0.5 : 1) * (1 - smoothstep(0.55, 1, fs))); }      // (the red is negative: it takes the tea out of the fog there)
      curtain.position.set(underCam.position.x, 0, underCam.position.z);
      waterMesh.material.depthWrite = false; waterMesh.renderOrder = -5;      // the mirror goes down first: wood above the line then shows over it, as if through the surface
      const g8 = findGate();
      const gateWas = g8 ? g8.visible : false; if (g8) g8.visible = false;
      const prevRT = renderer.getRenderTarget(), i0 = renderer.info.render.triangles, c0 = renderer.info.render.calls;
      renderer.setRenderTarget(rt); renderer.render(scene, underCam);
      if (g8 && gateWas && u > uTrunk + 0.004) {
        // the exit portal's lower arc is drawn with the engine's own camera, so the ring and the world inside it run
        // unbroken across the seam (its picture of the next world only exists where that camera sees the portal)
        const kids = scene.children, nk = kids.length; for (let i = 0; i < nk; i++) { visBuf[i] = kids[i].visible; kids[i].visible = kids[i] === g8; }
        const ac = renderer.autoClear; renderer.autoClear = false; scene.background = null;
        renderer.render(scene, camera);
        renderer.autoClear = ac; for (let i = 0; i < nk; i++) kids[i].visible = visBuf[i];
      }
      renderer.setRenderTarget(prevRT);
      if (g8) g8.visible = gateWas;
      seaStats.triangles = renderer.info.render.triangles - i0; seaStats.calls = renderer.info.render.calls - c0;

      // ---- back to the AIR pass the engine is about to draw
      scene.background = null; fog.color.copy(airFog); fog.density = airDen;
      sunL.color.copy(sunBase.c); sunL.intensity = sunBase.i; hemiL.color.copy(hemiBase.c); hemiL.groundColor.copy(hemiBase.g); hemiL.intensity = hemiBase.i;
      const above = S.seam < 1.0;
      air.visible = above; sea.visible = false; comp.visible = true;
      hero.object.visible = heroShow && above;
      { const far = lerp(168, 125, preS); for (let i = 0; i < NCH; i++) channelMeshes[i].visible = above && _ref.z > 60 && Math.abs(chunkZ(i) - _ref.z) < far; }      // beyond that the tunnel is haze
      for (let i = 0; i < heroAir.length; i++) heroAir[i].visible = true;
      for (let i = 0; i < heroSea.length; i++) heroSea[i].visible = false;
      waterU.uCam.value.copy(_p); hero.setEye(camera); waterMesh.material.depthWrite = true; waterMesh.renderOrder = 0;
      compU.uSeam.value = S.seam; compU.uShift.value = S.shift; compU.uWob.value = breatheK > 0 ? 0.35 + 0.65 * breatheK : 0.06;
      compU.uLine.value.copy(cHor).lerp(sunCol, 0.3).multiplyScalar(night ? 0.5 : 1.5).lerp(airFog, 0.25 * (1 - fa));
      lensU.uDrain.value = S.drain; lensU.uAspect.value = camera.aspect; lens.visible = above && S.drain > 0.003;
    }

    scene.background = null;
    await sky.prewarm(renderer, null, scene);

    return {
      scene, path, duration: DUR, title: L.title,
      // the tunnel is a link: hurry it; linger from the mouth through the reveal and the dome; an unhurried last tenth
      pace: (u) => lerp(1, 1.45, smoothstep(0.12, 0.2, u) * (1 - smoothstep(0.38, 0.47, u))) * lerp(1, 0.72, smoothstep(0.47, 0.55, u) * (1 - smoothstep(0.78, 0.88, u))),
      ride: 'none', companion: 'none',
      camera: { fov: 62, near: 0.25, far: 1700, lookAhead: 16, sway: 0, bank: 0 },
      pois: [{ at: [0, EYE, 0], from: uMouth - 0.04, to: uLintel, weight: 0.5 }],
      portal: { shape: 'circle', radius: 7, color: L.portal, glow: 1, revealDistance: 170 },
      post: L.post,
      look: L, seaStats,
      update,
      dispose() { rt.dispose(); sky.dispose?.(); for (const d of disposables) d.dispose(); hero.dispose?.(); },
    };
  },
};
