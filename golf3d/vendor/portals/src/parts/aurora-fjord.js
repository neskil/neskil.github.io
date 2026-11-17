// AURORA FJORD hero set piece: THE GLACIER GATE
// ---------------------------------------------------------------------------------------------
// A 260 m wide, ~60 m tall glacier front with a 30 m meltwater cave in its centre. The ice around
// the cave is translucent turquoise with aurora light "trapped" inside it (moving curtains and rays
// in the shader), cut by deep blue crevasse lines; snow caps every up-facing ledge. A loose avenue
// of calved icebergs (blue glowing waterlines) leads to the cave, with pancake floes between them,
// and a faint aurora curtain leaks from the top crevasses back into the sky.
//
// Local space: origin = centre of the cave mouth at the waterline (y = 0 is the water), +Y up,
// front (+Z) is the side the camera arrives from. Nothing sits below y = 0.
// Size: radius ~150 m (glacier x = +-130, bergs out to z ~ +290, ice body back to z ~ -180),
// height ~75 m of ice (the aurora leak rises to ~200 m).
//
// opts
//   palette   [night, teal, auroraGreen, violet, deepBlue, snow, warm] hex strings (brief default)
//   mirror    true   build the y-flipped reflection copies (same geometry, 0.75 brightness) under y=0
//   water     true   build a glass-calm water disc (alpha 0.9 looking down -> 0.2 grazing) over the
//                    mirror. Pass water:false if the world lays its own water plane at y = 0.
//                    Pass mirror:false too if the world mirrors the whole group itself (the ice
//                    shader lights from the object-space normal, so a scale.y=-1 copy stays correct).
//   waterRadius 1600 radius of that disc
//   plume     1      strength of the aurora leak above the glacier (0 removes it)
//   width 260, depth 120   glacier front width and how far the ice body runs back
//   avenueFar 0   > 300: extend the iceberg avenue (taller bergs, wider spacing) out to this z; flyThrough then starts ~40 m beyond it
//
// anchors (all local space, plain arrays unless noted)
//   portalSeat   { position:[0,9,z], normal:[0,0,1], radius:7 }  centre of the 14 m exit portal in
//                the cave mouth, facing +Z (toward the arriving camera). Opening there is >= 26 m wide.
//   portalStreak { position, size:[w,len] }  where to lay the additive portal-colour smear on the water
//   flyThrough   ordered [x,y,z] points, far to near, weaving through the iceberg avenue with
//                >= 8 m clearance and ending in a 75 m dead-straight level run into portalSeat
//   viewpoints   { reveal, avenue, closePass }  good camera positions (first sight, mid avenue,
//                skimming the tallest berg)
//   caveMouth    { center, width, height }      icebergs: [{ position, radius, height }]
//   waterY 0, glacierTop (height of the ice wall), frontZ (z of the ice wall beside the cave)
//
// hooks
//   setProgress(u)  0..1 journey progress: the gate brightens and its pulse rings quicken as the
//                   camera arrives (never wall-clock). setAurora(color, intensity) retints the key light.
//
// Lighting: self-lit. Expects NO sun; it lights itself with a soft green aurora key from straight
// above (snow takes it, steep ice stays dark) plus its own inner glow (HDR 1-5, wants bloom).
// Scene lights are ignored; scene fog is respected. Cost: 120-135k triangles (per seed) and 10 draw
// calls with mirror + water (~65k / 6 calls with mirror:false, water:false), build ~150-270 ms on
// the shared software-GL test box, no lights, no textures or render targets.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#020712', '#0e3842', '#3dffb0', '#a25bff', '#16324a', '#cfe9f5', '#ffb060'];

const GLSL_NOISE = /* glsl */`
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
`;
// additive materials fade out in fog instead of mixing toward the fog colour
const GLSL_FOG_FADE = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFade = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogFade = 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb *= fogFade;
#endif
`;

const ICE_VERT = /* glsl */`
attribute vec3 aData;            // x glow amount, y hue (0 aurora turquoise .. 1 glacial blue), z occlusion
varying vec3 vLocal, vWorld, vN, vNw, vData;
#include <fog_pars_vertex>
void main(){
  vLocal = position; vN = normal; vData = aData;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz; vNw = mat3(modelMatrix) * normal;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const ICE_FRAG = /* glsl */`
uniform float uTime, uBright, uGlow, uPulse, uWave;
uniform vec3 uCDeep, uCTurq, uCGreen, uCViolet, uCSnow, uCSky, uCrev, uLight;
varying vec3 vLocal, vWorld, vN, vNw, vData;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 p = vLocal;
  vec3 V = normalize(cameraPosition - vWorld);
  // object-space normal (lighting from above survives the mirrored copy)
  vec3 Ns = normalize(vN);
  vec3 Nf = normalize(cross(dFdx(p), dFdy(p)));
  if (dot(Nf, Ns) < 0.0) Nf = -Nf;
  vec3 N = normalize(mix(Ns, Nf, 0.35));
  // fine chiselled-ice bump
  float mpp = max(max(length(dFdx(p)), length(dFdy(p))), 1e-4);     // metres per pixel
  float k1 = clamp(1.25 - mpp * 1.1, 0.0, 1.0), k2 = clamp(1.0 - mpp * 4.0, 0.0, 1.0);
#ifndef MIRROR_COPY
  vec3 bp = p * 0.6;
  float b0 = vnoise(bp);
  vec3 grad = (vec3(vnoise(bp + vec3(0.3, 0.0, 0.0)), vnoise(bp + vec3(0.0, 0.3, 0.0)), vnoise(bp + vec3(0.0, 0.0, 0.3))) - b0) * k1;
  vec3 bq = p * 2.1 + 5.0;
  float c0 = vnoise(bq);
  grad += 0.4 * k2 * (vec3(vnoise(bq + vec3(0.3, 0.0, 0.0)), vnoise(bq + vec3(0.0, 0.3, 0.0)), vnoise(bq + vec3(0.0, 0.0, 0.3))) - c0);
  N = normalize(N - 2.2 * (grad - dot(grad, N) * N));
#endif
  float up = N.y;
  // world-space normal for view effects
  vec3 Fw = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (dot(Fw, V) < 0.0) Fw = -Fw;
  vec3 Nw = normalize(mix(normalize(vNw), Fw, 0.35));
  float ndv = clamp(dot(Nw, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);

  float n1 = fbm(p * 0.045);
  float n2 = fbm(p * vec3(0.6, 0.22, 0.6) + 7.0);
  float strata = 0.5 + 0.5 * sin(p.y * 0.9 + n1 * 9.0 + p.x * 0.03);
  // crevasse lines: iso-lines of stretched noise, kept a constant width in metres
  float va = vnoise(vec3(p.x * 0.05 + n1 * 1.0, p.y * 0.006 + 3.0, p.z * 0.05 - n1 * 0.6));
  float wa = max(0.42, mpp * 0.9);
  float crack = (1.0 - smoothstep(wa * 0.5, wa, abs(va - 0.5) / max(fwidth(va) / mpp, 1e-4))) * clamp(0.55 / wa, 0.35, 1.0);
  float vb = vnoise(vec3(p.x * 0.17 - n2 * 0.8, p.y * 0.022, p.z * 0.17 + 9.0));
  float wb = max(0.14, mpp * 0.9);
  crack = max(crack, 0.6 * (1.0 - smoothstep(wb * 0.5, wb, abs(vb - 0.5) / max(fwidth(vb) / mpp, 1e-4))) * clamp(0.18 / wb, 0.0, 1.0));

  float g = vData.x;
  float aur = 1.0 - vData.y;                          // 1 on the glacier, ~0.2 on bergs
  float snow = smoothstep(0.42, 0.78, up + (n2 - 0.5) * 0.4) * (1.0 - smoothstep(0.5, 1.2, g));
  float frost = smoothstep(0.45, 0.9, vData.z + (n2 - 0.5) * 0.6) * (1.0 - snow);

  // surface under aurora light from straight above
  vec3 light = uLight * (0.14 + 0.86 * clamp(up * 0.6 + 0.4, 0.0, 1.0)) * (0.8 + 0.2 * uPulse) + uCSky;
  vec3 iceAlb = mix(uCDeep, uCTurq * 0.6, 0.25 + 0.5 * n1) * (0.7 + 0.3 * strata);
  iceAlb = mix(iceAlb, uCSnow * 0.5, frost * 0.65);
  vec3 alb = mix(iceAlb, uCSnow * 0.78, snow);
  vec3 col = alb * light * (0.5 + 0.5 * vData.z);
  float sp = step(0.988, hash3(floor(p * 2.5))) * snow * k2;
  col += uCSnow * sp * 0.5 * (0.3 + 0.7 * ndv);

  // the aurora trapped in the ice: a turquoise body glow ...
  float cur = fbm(vec3(p.x * 0.035 + uTime * 0.012, p.y * 0.012 - uTime * 0.02, p.z * 0.035));
  float body = 0.12 + 2.0 * cur * cur * cur + 0.2 * n2;
  vec3 em = mix(uCTurq, uCrev * 0.9 + uCTurq * 0.45, vData.y) * g * body;
  // ... and real curtains hanging inside it: sharp lower hem, rays fading upward to violet
  float fold = fbm(vec3(p.x * 0.016 + uTime * 0.01, 2.0, p.z * 0.016 - uTime * 0.006));
  float rays = vnoise(vec3(p.x * 0.24 + fold * 9.0, p.y * 0.012 - uTime * 0.035, p.z * 0.24));
  float hem = 6.0 + 30.0 * (0.5 + 0.5 * sin(fold * 9.0 + p.x * 0.02));
  float hh = (p.y - hem) / 26.0;
  float curtain = smoothstep(-0.3, 0.0, hh) * exp(-max(hh, 0.0) * 2.2) * (0.35 + 1.3 * rays * rays);
  vec3 cc = mix(uCGreen, uCViolet * 1.5, smoothstep(0.25, 1.1, hh));
  em += cc * curtain * min(g, 1.6) * aur * 1.1;
  float depthView = 0.35 + 0.65 * pow(ndv, 0.7);
  em *= depthView * (1.0 - 0.8 * frost);
  vec3 crevC = mix(uCrev, uCTurq, 0.16);
  float halo = 1.0 - smoothstep(0.0, 2.2, abs(va - 0.5) / max(fwidth(va) / mpp, 1e-4));
  em = mix(em, crevC * (0.25 + 0.5 * g), halo * 0.22 * k1);          // blue bleeding out of each crevasse
  em = mix(em, crevC * (0.1 + 0.42 * g), crack * 0.88);
  em *= 1.0 - 0.92 * snow;
  float ring = 0.5 + 0.5 * sin(length(p.xy - vec2(0.0, 10.0)) * 0.07 - uWave);
  em *= uGlow * (0.8 + 0.35 * ring * ring);
  col += em;
  col += (uLight * 0.5 + uCSky) * fres * (0.3 + 0.7 * clamp(up + 0.4, 0.0, 1.0));

  gl_FragColor = vec4(col * uBright, 1.0);
  #include <fog_fragment>
}`;

const FOG_VERT = /* glsl */`
#include <fog_pars_vertex>
`;

// aurora leaking out of the top crevasses: a swaying ray curtain
const PLUME_VERT = /* glsl */`
uniform float uTime;
varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vUv = uv;
  vec3 p = position;
  float v = uv.y, s = uv.x;
  p.x += sin(s * 9.0 + uTime * 0.15 + v * 1.5) * 16.0 * v + sin(s * 23.0 - uTime * 0.21) * 5.0 * v;
  p.z += cos(s * 7.0 - uTime * 0.11 + v * 2.0) * 24.0 * v;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PLUME_FRAG = /* glsl */`
uniform float uTime, uStrength, uPulse;
uniform vec3 uCGreen, uCViolet, uCTurq;
varying vec2 vUv;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float s = vUv.x, v = vUv.y;
  float fold = vnoise(vec3(s * 6.0 + uTime * 0.02, uTime * 0.03, 1.0));
  float rays = vnoise(vec3(s * 70.0 + fold * 10.0, v * 0.8 - uTime * 0.06, uTime * 0.05));
  float fine = vnoise(vec3(s * 210.0 + fold * 20.0, v * 0.5, uTime * 0.08));
  rays = 0.2 + 0.55 * rays + 0.45 * fine * fine;
  float band = smoothstep(0.2, 0.7, vnoise(vec3(s * 3.2 - uTime * 0.015, 3.0, uTime * 0.025)));
  float top = mix(0.3, 1.0, vnoise(vec3(s * 4.5, 7.0, uTime * 0.03)));
  float vv = v / top;
  float prof = smoothstep(0.0, 0.05, vv) * pow(max(1.0 - vv, 0.0), 1.4);
  float edge = smoothstep(0.0, 0.28, s) * smoothstep(1.0, 0.72, s);
  vec3 c = mix(uCTurq, uCGreen, smoothstep(0.0, 0.15, vv));
  c = mix(c, uCViolet * 1.6, smoothstep(0.3, 0.9, vv));
  float I = prof * edge * rays * (0.3 + 0.7 * band) * (0.75 + 0.25 * uPulse) * uStrength;
  gl_FragColor = vec4(c * I, 1.0);
  ${GLSL_FOG_FADE}
}`;

// glass-calm water over the mirrored copies
const WATER_VERT = /* glsl */`
varying vec3 vWorld; varying vec3 vLocal;
#include <fog_pars_vertex>
void main(){
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform float uTime, uRadius;
uniform vec3 uBody, uCSky, uLight;
varying vec3 vWorld; varying vec3 vLocal;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 V = normalize(cameraPosition - vWorld);
  float dist = length(cameraPosition - vWorld);
  vec2 q = vWorld.xz;
  float lod = 1.0 / (1.0 + dist * 0.01);
  float r1 = vnoise(vec3(q * vec2(0.9, 0.22) + vec2(uTime * 0.05, uTime * 0.02), uTime * 0.07));
  float r2 = vnoise(vec3(q * vec2(0.25, 0.06) - vec2(uTime * 0.02, 0.0), uTime * 0.03 + 5.0));
  float rip = (r1 - 0.5) * lod + (r2 - 0.5) * 0.6;
  float ndv = clamp(abs(V.y) + rip * 0.05, 0.0, 1.0);
  float a = mix(0.2, 0.9, smoothstep(0.0, 0.8, ndv));
  a = clamp(a + rip * 0.10, 0.08, 0.95);
  vec3 col = uBody + uCSky * pow(1.0 - ndv, 4.0) * 1.2;
  col += uLight * 0.06 * smoothstep(0.25, 0.5, rip) * pow(1.0 - ndv, 2.0);
  a *= 1.0 - smoothstep(uRadius * 0.82, uRadius, length(vLocal.xy));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// soft smear of cave light lying on the water in front of the gate
const SPILL_FRAG = /* glsl */`
uniform float uTime, uGlow;
uniform vec3 uCTurq, uCGreen;
varying vec3 vWorld; varying vec3 vLocal;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float x = vLocal.x, z = -vLocal.y;                 // plane is rotated flat: local -y runs toward +Z
  float zo = max(z, 0.0);
  float w = 6.0 + zo * 0.2;
  float I = exp(-abs(x) / w) * exp(-zo / 85.0) * smoothstep(-75.0, -15.0, z);
  float streak = vnoise(vec3(x * 0.45, z * 0.035 - uTime * 0.04, uTime * 0.05));
  float streak2 = vnoise(vec3(x * 1.7, z * 0.11 + uTime * 0.06, 3.0));
  I *= 0.45 + 0.75 * streak + 0.35 * streak2 * streak2;
  I *= smoothstep(45.0, 20.0, abs(x)) * smoothstep(195.0, 120.0, z);
  vec3 c = mix(uCTurq, uCGreen, 0.25 + 0.4 * streak);
  gl_FragColor = vec4(c * I * 0.5 * uGlow, 1.0);
  ${GLSL_FOG_FADE}
}`;

// ice crystals drifting out of the cave on its cold breath
const MOTE_VERT = /* glsl */`
attribute vec4 aSeed;
uniform float uTime, uScale;
varying float vTw;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float life = fract(aSeed.x + uTime * (0.012 + 0.02 * aSeed.y));
  p.z = mix(-45.0, 150.0, life);
  float spread = 0.55 + life * 2.2;
  p.x = p.x * spread + sin(uTime * 0.3 + aSeed.z * 40.0) * 2.0;
  p.y = 1.0 + p.y * (0.6 + life * 0.9) + sin(uTime * 0.23 + aSeed.w * 30.0) * 1.2;
  vTw = (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.5 + aSeed.w * 3.0) + aSeed.z * 60.0), 3.0)) * sin(life * 3.14159);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(uScale * (0.12 + 0.2 * aSeed.y) / max(-mvPosition.z, 1.0), 1.0, 9.0);
  #include <fog_vertex>
}`;
const MOTE_FRAG = /* glsl */`
uniform vec3 uCTurq, uCSnow;
varying float vTw;
#include <fog_pars_fragment>
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.05, length(d));
  gl_FragColor = vec4(mix(uCTurq, uCSnow, 0.45) * a * vTw * 2.2, 1.0);
  ${GLSL_FOG_FADE}
}`;

// ---------- small indexed mesh builder with per-patch winding repair ----------
function makeBuilder() {
  const P = [], D = [], I = [];
  const b = {
    P, D, I,
    v(x, y, z, glow, hue, ao) { P.push(x, y < 0 ? 0 : y, z); D.push(glow, hue, ao); return P.length / 3 - 1; },
    // tris: flat index list; expect(cx,cy,cz,out) writes the direction faces should point
    patch(tris, expect) {
      const e = [0, 0, 0]; let s = 0;
      for (let i = 0; i < tris.length; i += 3) {
        const a = tris[i] * 3, bb = tris[i + 1] * 3, c = tris[i + 2] * 3;
        const ux = P[bb] - P[a], uy = P[bb + 1] - P[a + 1], uz = P[bb + 2] - P[a + 2];
        const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        expect((P[a] + P[bb] + P[c]) / 3, (P[a + 1] + P[bb + 1] + P[c + 1]) / 3, (P[a + 2] + P[bb + 2] + P[c + 2]) / 3, e);
        s += (uy * vz - uz * vy) * e[0] + (uz * vx - ux * vz) * e[1] + (ux * vy - uy * vx) * e[2];
      }
      if (s < 0) for (let i = 0; i < tris.length; i += 3) I.push(tris[i], tris[i + 2], tris[i + 1]);
      else for (let i = 0; i < tris.length; i++) I.push(tris[i]);
    },
    grid(nu, nv, at, expect) {
      const t = [];
      for (let u = 0; u < nu - 1; u++) for (let v = 0; v < nv - 1; v++) {
        const a = at(u, v), bq = at(u + 1, v), c = at(u + 1, v + 1), d = at(u, v + 1);
        t.push(a, bq, c, a, c, d);
      }
      b.patch(t, expect);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 3));
      g.setIndex(I);
      g.computeVertexNormals();
      g.computeBoundingSphere();
      return g;
    },
    // build(), bit for bit, for a big mesh: the same geometry, in slices with a hand-back between them (three's two
    // calls, computeVertexNormals() and computeBoundingSphere(), are written out below, slice by slice)
    async buildInSteps(tick) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      await tick();
      g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 3));
      await tick();
      g.setIndex(I);
      const p = g.attributes.position.array, ix = g.index.array, n = p.length, na = new THREE.BufferAttribute(new Float32Array(n), 3), N = na.array;
      g.setAttribute('normal', na);
      await tick();
      for (let t = 0, tl = ix.length; t < tl; t += 3000) { faceSums(ix, p, N, t, Math.min(tl, t + 3000)); await tick(); }
      for (let v = 0; v < n; v += 6000) { unitNormals(N, v, Math.min(n, v + 6000)); await tick(); }
      na.needsUpdate = true;
      const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      for (let v = 0; v < n; v += 6000) { boxOf(p, v, Math.min(n, v + 6000), box); await tick(); }
      const none = box[3] < box[0] || box[4] < box[1] || box[5] < box[2];
      const cx = none ? 0 : (box[0] + box[3]) * 0.5, cy = none ? 0 : (box[1] + box[4]) * 0.5, cz = none ? 0 : (box[2] + box[5]) * 0.5;
      let m = 0;
      for (let v = 0; v < n; v += 6000) { m = farthest(p, v, Math.min(n, v + 6000), cx, cy, cz, m); await tick(); }
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(m));
      return g;
    },
  };
  return b;
}

// geometry.computeVertexNormals() and geometry.computeBoundingSphere() of three, bit for bit (the same sums in the same
// order, the same float32 stores, as canyon-of-light has them), one stretch of the mesh at a call: for buildInSteps
function faceSums(ix, p, N, t, tl) {                  // each face's normal added to its three corners, faces t/3 .. tl/3
  for (; t < tl; t += 3) {
    const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3;
    const bx = p[b], by = p[b + 1], bz = p[b + 2];
    const cx = p[c] - bx, cy = p[c + 1] - by, cz = p[c + 2] - bz, ax = p[a] - bx, ay = p[a + 1] - by, az = p[a + 2] - bz;
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    const a0 = N[a] + nx, a1 = N[a + 1] + ny, a2 = N[a + 2] + nz, b0 = N[b] + nx, b1 = N[b + 1] + ny, b2 = N[b + 2] + nz, c0 = N[c] + nx, c1 = N[c + 1] + ny, c2 = N[c + 2] + nz;
    N[a] = a0; N[a + 1] = a1; N[a + 2] = a2; N[b] = b0; N[b + 1] = b1; N[b + 2] = b2; N[c] = c0; N[c + 1] = c1; N[c + 2] = c2;
  }
}
function unitNormals(N, v, vl) {                      // each summed normal to length one (a zero one stays zero)
  for (; v < vl; v += 3) {
    const x = N[v], y = N[v + 1], z = N[v + 2], s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    N[v] = x * s; N[v + 1] = y * s; N[v + 2] = z * s;
  }
}
function boxOf(p, v, vl, box) {                       // the box of the positions so far: [x0, y0, z0, x1, y1, z1]
  let x0 = box[0], y0 = box[1], z0 = box[2], x1 = box[3], y1 = box[4], z1 = box[5];
  for (; v < vl; v += 3) {
    const x = p[v], y = p[v + 1], z = p[v + 2];
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z); x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z);
  }
  box[0] = x0; box[1] = y0; box[2] = z0; box[3] = x1; box[4] = y1; box[5] = z1;
}
function farthest(p, v, vl, cx, cy, cz, m) {          // the largest squared distance from the box's centre so far
  for (; v < vl; v += 3) {
    const dx = cx - p[v], dy = cy - p[v + 1], dz = cz - p[v + 2];
    m = Math.max(m, dx * dx + dy * dy + dz * dz);
  }
  return m;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, N = ctx.noise;
  const tick = async () => { if (ctx.yield) await ctx.yield(); };
  const src = opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE;
  const pal = src.map((h) => new THREE.Color(h));
  const W = opts.width ?? 260, halfW = W / 2, DEPTH = opts.depth ?? 120, H0 = 60;

  // ---------- per-seed character ----------
  const ox = rng.range(-400, 400), oz = rng.range(-400, 400);
  const caveA = rng.range(13.5, 16.5), caveB = rng.range(28, 32), caveN = rng.range(2.1, 2.9);
  const caveLean = rng.range(-0.1, 0.1), bend = rng.sign() * rng.range(0.5, 1), caveDepth = rng.range(75, 95);
  const towerAmp = rng.range(9, 17), hBase = rng.range(52, 58), bow = rng.range(22, 40);
  const zMouth = -2.5;

  const rIn = (th) => {
    const c = Math.abs(Math.cos(th)), s = Math.sin(th);
    const r = 1 / Math.pow(Math.pow(c / caveA, caveN) + Math.pow(Math.max(s, 0) / caveB, caveN), 1 / caveN);
    return r * (1 + 0.07 * s * N.n2(th * 2.3 + ox, 1.7) + 0.025 * s * N.n2(th * 9 + ox, 4.1));
  };
  const towers = (x) => towerAmp * Math.pow(Math.max(0, N.n2(x * 0.045 + ox, 3.3)), 1.3) + 4 * Math.pow(1 - Math.abs(N.n2(x * 0.09 + ox, 9.1)), 2) - 2;
  const hSlow = (x) => (hBase + 5 * N.n2(x * 0.012 + ox, 5.5)) * (1 - 0.22 * smoothstep(0.7, 1, Math.abs(x) / halfW));
  const Htop = (x) => hSlow(x) + towers(x);
  const crevAt = (x, d) => Math.pow(Math.max(0, Math.sin(d * 0.085 + 3 * N.fbm2((x + ox) * 0.008, d * 0.008 + oz, 2) + 1.2)), 8) * smoothstep(8, 25, d);
  const topH = (x, d) => hSlow(x) + towers(x) * Math.exp(-d / 22) + 38 * (1 - Math.exp(-d / 110))
    + 4 * N.fbm2((x + ox) * 0.03, (d + oz) * 0.03, 3) * (1 - Math.exp(-d / 10)) - 9 * crevAt(x, d);
  const zr = { z: 0, rec: 0 };
  const zf = (x, y, near) => {
    const fx = x / halfW;
    const col = N.fbm2((x + ox) * 0.03, y * 0.006 + oz, 3);
    const q = N.fbm2((x + ox) * 0.011 + 40, y * 0.02 + oz, 2) * 2.2, qf = Math.floor(q);
    const steps = qf + smoothstep(0.45, 1.0, q - qf);
    const mid = N.n3((x + ox) * 0.11, y * 0.035, oz) * 1.8;
    const fine = N.n3((x + ox) * 0.4, y * 0.3, oz + 5) * 0.45;
    const amp = lerp(0.25, 1, smoothstep(0, 14, near));
    const fl = 1 - Math.abs(N.n2((x + ox) * 0.07, y * 0.005 + oz * 2)), flute = fl * fl * 6 - 2.5;
    let z = -bow * fx * fx - 30 * Math.pow(fx, 6) - y * 0.1 * smoothstep(0, 20, near) + (col * 8 + flute + steps * 3.2 + mid + fine) * amp;
    const bev = 1 - smoothstep(0, 5, near); z -= 2.5 * bev * bev;
    const nt = 1 - clamp(y / 2.5, 0, 1); z -= 2 * nt * nt * smoothstep(1, 6, near);
    zr.z = z; zr.rec = clamp(0.5 - (col * 8 + flute + mid) / 13, 0, 1);
    return zr;
  };

  // ---------- glacier: front wall (polar grid around the cave), top + flanks, cave tube, icicles ----------
  const G = makeBuilder();
  const NT = 168, NR = 50, M = 30, NK = 30;
  const wall = (i, j) => i * (NR + 1) + j;
  const ringX = new Float32Array(NT + 1), ringTop = new Uint8Array(NT + 1);
  for (let i = 0; i <= NT; i++) {
    if (i % 16 === 0) await tick();                                    // hand back every 16 rows (takes no draw)
    const th = Math.PI * i / NT, c = Math.cos(th), s = Math.max(0, Math.sin(th));
    const ri = rIn(th), ro = Math.min(halfW / Math.max(Math.abs(c), 1e-6), H0 / Math.max(s, 1e-6));
    ringTop[i] = H0 / Math.max(s, 1e-6) <= halfW / Math.max(Math.abs(c), 1e-6) ? 1 : 0;
    for (let j = 0; j <= NR; j++) {
      const t = j / NR, tt = 0.3 * t + 0.7 * t * t, r = ri + (ro - ri) * tt, near = r - ri;
      const x0 = r * c, y0 = r * s, ht = Htop(x0);
      const y = y0 + (ht - H0) * smoothstep(0.45, 1, y0 / H0);
      // flanks lean inward with height so the front reads as an ice lobe, not a box
      const x = x0 + caveLean * y * (1 - tt) * (1 - tt) - Math.sign(x0) * 20 * smoothstep(0.72, 1, Math.abs(x0) / halfW) * Math.pow(clamp(y / ht, 0, 1), 1.3);
      const { z, rec } = zf(x, y, near);
      let glow = (0.2 + 0.95 * Math.exp(-near / 38)) * (0.3 + 1.5 * rec * rec)
        * (0.75 + 0.45 * N.fbm2((x + ox) * 0.02, y * 0.025 + oz + 9, 2)) * (1 - 0.45 * smoothstep(0.6, 1, y / ht));
      const rim = Math.exp(-near / 2.5); glow *= 1 - 0.65 * rim;   // frosted lip so the arch reads against the lit interior
      G.v(x, y, z, glow, 0.05 + 0.4 * smoothstep(50, 125, near), lerp(1 - rec, 1, rim));
      if (j === NR) ringX[i] = x0;
    }
  }
  await tick();                                                        // the wall's triangles start on a fresh step
  G.grid(NT + 1, NR + 1, wall, (x, y, z, e) => { e[0] = 0; e[1] = 0; e[2] = 1; });
  await tick();

  // top surface and flanks: extrude the wall's outer ring back along -Z
  const ext0 = G.P.length / 3;
  const ext = (i, m) => (m === 0 ? wall(i, NR) : ext0 + i * M + (m - 1));
  for (let i = 0; i <= NT; i++) {
    if (i % 16 === 0) await tick();                                    // hand back every 16 rows (takes no draw)
    const w = wall(i, NR) * 3, x0 = G.P[w], y0 = G.P[w + 1], z0 = G.P[w + 2];
    const frac = ringTop[i] ? 1 : clamp(y0 / Htop(ringX[i]), 0, 1), side = !ringTop[i];
    for (let m = 1; m <= M; m++) {
      const d = DEPTH * Math.pow(m / M, 1.3);
      const back = 1 - Math.pow(smoothstep(0.4, 1, d / DEPTH), 2);
      const x = x0 + (side ? (N.n2(d * 0.04 + ox, y0 * 0.05) * 6 + N.n2(d * 0.13 + ox, y0 * 0.15 + 3) * 2.5) * Math.min(1, d / 12) : 0);
      const cv = crevAt(ringX[i], d);
      const y = frac * topH(ringX[i], d) * back;
      G.v(x * (0.72 + 0.28 * back), y, z0 - d, side ? 0.5 * back : 0.05 + 1.9 * cv, 0.2, side ? 0.45 : 1 - cv);
    }
  }
  await tick();
  G.grid(NT + 1, M + 1, ext, (x, y, z, e) => { e[0] = x * 0.3; e[1] = y; e[2] = 0; });
  await tick();

  // cave tube: arch rings marching back, shrinking and bending, brighter with depth
  const tube0 = G.P.length / 3;
  const tube = (i, k) => (k === 0 ? wall(i, 0) : tube0 + i * NK + (k - 1));
  const tubeCx = (d) => bend * 30 * Math.pow(clamp(d / caveDepth, 0, 1), 2);
  for (let i = 0; i <= NT; i++) {
    if (i % 16 === 0) await tick();                                    // hand back every 16 rows (takes no draw)
    const th = Math.PI * i / NT, c = Math.cos(th), s = Math.max(0, Math.sin(th)), ri = rIn(th);
    const z0 = G.P[wall(i, 0) * 3 + 2];
    for (let k = 1; k <= NK; k++) {
      const f = k / NK, d = caveDepth * Math.pow(f, 1.2);
      const sc = k === NK ? 0.03 : 1 - 0.78 * Math.pow(f, 1.5);
      const r = ri * sc * (1 + s * (0.14 * N.n3(c * 2.2 + ox, s * 2.2, d * 0.09) + 0.06 * N.n3(c * 6, s * 6 + oz, d * 0.3)));
      const y = r * s, x = tubeCx(d) + r * c + caveLean * y;
      const glow = (0.45 + 1.5 * Math.pow(f, 0.8)) * (0.8 + 0.4 * N.n3(c * 3 + oz, s * 3, d * 0.12));
      G.v(x, y, lerp(z0, zMouth, Math.min(1, k / 3)) - d, glow, 0.0, 0.3);
    }
  }
  await tick();
  G.grid(NT + 1, NK + 1, tube, (x, y, z, e) => { e[0] = tubeCx(-z) - x; e[1] = 8 - y; e[2] = 0; });

  // icicles under the arch
  const nIc = rng.int(60, 90);
  for (let n = 0; n < nIc; n++) {
    const th = Math.PI * rng.range(0.2, 0.8), s = Math.sin(th), c = Math.cos(th);
    const d = rng.range(0.3, 9), f = d / caveDepth, r = rIn(th) * (1 - 0.78 * Math.pow(f, 1.25)) * 0.99;
    const ry = r * s + 0.8, rx = r * c + caveLean * ry, rz = zMouth - d;
    const L = rng.range(1.4, 6.5) * s * s * (rng.chance(0.15) ? 1.5 : 1), rad = rng.range(0.16, 0.42) * (0.6 + L * 0.12);
    const lx = rng.range(-0.25, 0.25), lz = rng.range(-0.25, 0.25), a0 = rng.range(0, 6.28);
    const first = G.P.length / 3, tris = [];
    for (let ring = 0; ring < 2; ring++) for (let q = 0; q < 5; q++) {
      const a = a0 + q * 1.2566, rr = rad * (ring ? 0.5 : 1), yy = ry - L * 0.42 * ring;
      G.v(rx + Math.cos(a) * rr + lx * ring * 0.4, yy, rz + Math.sin(a) * rr + lz * ring * 0.4, 1.5 + ring * 0.5, 0.1, 0.2);
    }
    const tip = G.v(rx + lx, ry - L, rz + lz, 2.6, 0.05, 0.2);
    for (let q = 0; q < 5; q++) {
      const q1 = (q + 1) % 5;
      tris.push(first + q, first + q1, first + 5 + q1, first + q, first + 5 + q1, first + 5 + q, first + 5 + q, first + 5 + q1, tip);
    }
    G.patch(tris, (x, y, z, e) => { e[0] = x - rx; e[1] = 0; e[2] = z - rz; });
  }
  await tick();                                                        // the glacier's normals and sphere go in slices (buildInSteps): build() in one piece was one long step
  const glacierGeo = await G.buildInSteps(tick);
  const glacierTop = hBase + towerAmp * 0.5;
  await tick();

  // ---------- the iceberg avenue ----------
  // camera line: weaves between the bergs, then runs dead straight for the last 75 m
  const weaveA = rng.range(9, 14) * rng.sign(), weaveL = rng.range(130, 170);
  const seatX = caveLean * 9;
  const pathX = (z) => seatX + weaveA * Math.sin(((z - 75) / weaveL) * Math.PI * 2) * smoothstep(75, 135, z);
  const pathDist = (x, z) => { let m = 1e9; for (let q = z - 40; q <= z + 40; q += 2) m = Math.min(m, Math.hypot(x - pathX(q), z - q)); return m; };
  const pathY = (z) => 9 + 4 * smoothstep(90, 300, z);
  const B = makeBuilder(), bergs = [];
  const addBerg = (bx, bz, R, Hb, type, NS, NG) => {
    const rot = rng.range(0, 6.28), cr = Math.cos(rot), sr = Math.sin(rot), ell = rng.range(0.62, 1), so = rng.range(0, 100);
    const pw = type === 0 ? rng.range(4, 7) : type === 1 ? rng.range(1.3, 1.9) : rng.range(2.2, 3.2);
    const peaks = [];
    for (let k = rng.int(1, 3); k > 0; k--) peaks.push([rng.range(-0.45, 0.45) * R, rng.range(-0.45, 0.45) * R * ell, rng.range(0.28, 0.5) * R, rng.range(0.55, 1)]);
    peaks[0][3] = 1;
    const tx = rng.range(-0.45, 0.45), tz = rng.range(-0.45, 0.45), notch = Math.min(1.5, Hb * 0.09), step = Hb / rng.range(4, 6.5);
    const hLoc = (dx, dz) => {
      let pk = 0; for (const p of peaks) pk = Math.max(pk, p[3] * Math.exp(-((dx - p[0]) ** 2 + (dz - p[1]) ** 2) / (p[2] * p[2])));
      const base = type === 0 ? 0.78 + 0.22 * N.n2(dx * 0.12 + so, dz * 0.12) : 0.28 + 0.78 * pk;
      return Hb * base * clamp(1 + (tx * dx + tz * dz) / R, 0.35, 1.5);
    };
    const first = B.P.length / 3; let top = 0;
    for (let j = 0; j < NG; j++) {
      const rho = j === 0 ? 0.92 : j === 1 ? 1 : 1 - Math.pow((j - 1) / (NG - 1), 1.35), cliff = 1 - Math.pow(rho, pw);
      for (let q = 0; q < NS; q++) {
        const ph = (q / NS) * Math.PI * 2, cp = Math.cos(ph), sp = Math.sin(ph);
        const rr = R * rho * (0.78 + 0.28 * N.n2(cp * 1.3 + so, sp * 1.3 + so) + 0.08 * N.n2(cp * 4 + so, sp * 4 - so));
        let dx = cp * rr, dz = sp * rr * ell, y = 0;
        if (j > 0) {
          y = notch + hLoc(dx, dz) * cliff;
          if (j > 1) y = lerp(y, Math.round(y / step) * step + notch, 0.45);
          const jit = R * 0.07; dx += N.n3(dx * 0.3 + so, y * 0.3, dz * 0.3) * jit; dz += N.n3(dx * 0.3, y * 0.3 + so, dz * 0.3) * jit;
        }
        top = Math.max(top, y);
        B.v(bx + dx * cr - dz * sr, y, bz + dx * sr + dz * cr, 0.07 + 1.1 * Math.exp(-y / (0.11 * Hb + 0.7)), 0.8, 0.35 + 0.5 * cliff);
      }
    }
    const cen = B.v(bx, notch + hLoc(0, 0), bz, 0.07, 0.8, 0.85);
    const ex = (x, y, z, e) => { e[0] = x - bx; e[1] = R * 0.5; e[2] = z - bz; };
    B.grid(NS + 1, NG, (u, v) => first + v * NS + (u % NS), ex);
    const fan = []; for (let q = 0; q < NS; q++) fan.push(first + (NG - 1) * NS + q, first + (NG - 1) * NS + ((q + 1) % NS), cen);
    B.patch(fan, ex);
    bergs.push({ position: [bx, 0, bz], radius: R * 1.1, height: top });
  };
  const clearOf = (x, z, R, gap) => bergs.every((b) => Math.hypot(b.position[0] - x, b.position[2] - z) > b.radius + R + gap);
  // the avenue proper: alternating sides, hugging the inside of each bend, 9+ m off the camera line
  const nMain = rng.int(9, 12); let side = rng.sign(), zc = rng.range(46, 58), tallest = null;
  for (let k = 0; k < nMain; k++) {
    await tick();                                                      // hand back between bergs (takes no draw)
    const far = smoothstep(40, 200, zc), R = rng.range(6, 10) + 6 * far * rng(), Hb = clamp(R * rng.range(1.0, 1.75), 7, 23);
    let x = pathX(zc) + side * (R * 1.1 + 9 + rng.range(0, 9));
    for (let t = 0; t < 14 && pathDist(x, zc) < R * 1.15 + 8.5; t++) x += side * 2;
    if (clearOf(x, zc, R, 3)) { addBerg(x, zc, R, Hb, rng.pick([0, 1, 1, 2]), 44, 13); const b = bergs[bergs.length - 1]; if (!tallest || b.height > tallest.height) tallest = b; }
    side = rng.chance(0.8) ? -side : side; zc += rng.range(17, 27);
  }
  await tick();
  // optional outer avenue (opts.avenueFar > 300): fewer, taller bergs further down the fjord for the world's mid-flight weave
  const avFar = opts.avenueFar ?? 0;
  if (avFar > 300) {
    let zo = Math.max(zc, 300) + rng.range(8, 22), so = side;
    while (zo < avFar) {
      await tick();
      const R = rng.range(9, 14.5), Hb = clamp(R * rng.range(1.35, 1.9), 15, 24);
      let x = pathX(zo) + so * (R * 1.1 + 9.5 + rng.range(0, 12));
      for (let t = 0; t < 14 && pathDist(x, zo) < R * 1.15 + 9; t++) x += so * 2;
      if (clearOf(x, zo, R, 3)) { addBerg(x, zo, R, Hb, rng.pick([0, 1, 1, 2]), 44, 13); const b = bergs[bergs.length - 1]; if (!tallest || b.height > tallest.height) tallest = b; }
      so = rng.chance(0.75) ? -so : so; zo += rng.range(24, 40);
    }
    for (let k = 0, n = rng.int(4, 7); k < n; k++) {
      await tick();
      const R = rng.range(6, 13), z = rng.range(280, avFar + 30), x = rng.sign() * rng.range(45, 100);
      if (pathDist(x, z) > R * 1.15 + 14 && clearOf(x, z, R, 6)) addBerg(x, z, R, clamp(R * rng.range(0.7, 1.4), 5, 18), rng.pick([0, 0, 1, 2]), 36, 11);
    }
    await tick();
  }
  // outliers to the flanks and small growlers for depth
  for (let k = 0, n = rng.int(5, 8); k < n; k++) {
    await tick();
    const R = rng.range(7, 16), z = rng.range(25, 250), x = rng.sign() * rng.range(42, 112);
    if (pathDist(x, z) > R * 1.15 + 12 && z > 20 + R && clearOf(x, z, R, 6)) addBerg(x, z, R, clamp(R * rng.range(0.7, 1.5), 6, 24), rng.pick([0, 0, 1, 2]), 40, 12);
  }
  for (let k = 0, n = rng.int(12, 18); k < n; k++) {
    await tick();
    const R = rng.range(1.4, 3.6), z = rng.range(14, 270), x = rng.range(-95, 95);
    if (pathDist(x, z) > R * 1.15 + 8.5 && clearOf(x, z, R, 2)) addBerg(x, z, R, R * rng.range(0.6, 1.3), rng.pick([1, 2]), 18, 7);
  }
  await tick();                                                        // the bergs in slices too: whole, they inherit the cold start of three's computeVertexNormals
  const bergGeo = await B.buildInSteps(tick);
  await tick();

  // pancake floes and brash ice, thickest near the ice front
  const F = makeBuilder();
  for (let n = 0, nF = rng.int(230, 300); n < nF; n++) {
    const nearFront = rng.chance(0.45);
    const x = rng.range(-1, 1) * (nearFront ? halfW * 0.95 : 105), fx = x / halfW;
    const z = -bow * fx * fx - 30 * Math.pow(fx, 6) + (nearFront ? rng.range(11, 45) : rng.range(20, 290));
    const R = rng.range(0.7, 3.2) * (nearFront ? 0.8 : 1);
    if (!clearOf(x, z, R, 0.5)) continue;
    const sides = rng.int(7, 10), a0 = rng.range(0, 6.28), ell = rng.range(0.6, 1), th = rng.range(0.16, 0.4);
    const first = F.P.length / 3, tris = [], cr = Math.cos(a0), sr = Math.sin(a0);
    const cen = F.v(x, th * 0.7, z, 0.04, 0.5, 1);
    for (let q = 0; q < sides; q++) {
      const a = (q / sides) * 6.2832, rr = R * rng.range(0.8, 1.1), dx = Math.cos(a) * rr, dz = Math.sin(a) * rr * ell;
      const px = x + dx * cr - dz * sr, pz = z + dx * sr + dz * cr;
      F.v(x + (px - x) * 0.86, th, z + (pz - z) * 0.86, 0.04, 0.5, 1);
      F.v(px, 0, pz, 0.5, 0.7, 0.8);
    }
    for (let q = 0; q < sides; q++) {
      const a = first + 1 + q * 2, b = first + 1 + ((q + 1) % sides) * 2;
      tris.push(cen, a, b, a, a + 1, b + 1, a, b + 1, b);
    }
    F.patch(tris, (cx, cy, cz, e) => { e[0] = cx - x; e[1] = R; e[2] = cz - z; });
  }
  await tick();
  const floeGeo = F.build();
  await tick();

  // ---------- materials ----------
  const white = new THREE.Color(1, 1, 1);
  const cTurq = pal[2].clone().lerp(new THREE.Color('#19b6ff'), rng.range(0.42, 0.62));
  const cCrev = new THREE.Color('#0b3dff').lerp(pal[4], 0.25);
  const cSky = pal[0].clone().lerp(pal[4], 0.5).multiplyScalar(0.3);
  const lightCol = pal[2].clone().lerp(white, 0.45);
  const glowBase = rng.range(0.95, 1.15);
  const shared = {
    uTime: { value: 0 }, uGlow: { value: glowBase }, uPulse: { value: 0.5 }, uWave: { value: 0 },
    uCDeep: { value: pal[4].clone() }, uCTurq: { value: cTurq }, uCGreen: { value: pal[2].clone() },
    uCViolet: { value: pal[3].clone().multiplyScalar(rng.range(0.7, 1.3)) }, uCSnow: { value: pal[5].clone() },
    uCSky: { value: cSky }, uCrev: { value: cCrev }, uLight: { value: lightCol.clone().multiplyScalar(0.5) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const iceMat = (bright, defines) => new THREE.ShaderMaterial({
    uniforms: { ...shared, uBright: { value: bright }, ...fogU() }, defines,
    vertexShader: ICE_VERT, fragmentShader: ICE_FRAG, fog: true,
  });
  const matIce = iceMat(1, {}), matIceMirror = iceMat(0.75, { MIRROR_COPY: 1 });   // the reflection skips the fine chiselled bump
  const additive = (vs, fs, extra) => new THREE.ShaderMaterial({
    uniforms: { ...shared, ...extra, ...fogU() }, vertexShader: vs, fragmentShader: fs, fog: true,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });

  const object = new THREE.Group(); object.name = 'glacier-gate';
  const mirror = new THREE.Group(); mirror.name = 'mirror'; mirror.scale.y = -1;
  const wantMirror = opts.mirror !== false, wantWater = opts.water !== false;
  const glacier = new THREE.Mesh(glacierGeo, matIce), bergMesh = new THREE.Mesh(bergGeo, matIce), floes = new THREE.Mesh(floeGeo, matIce);
  object.add(glacier, bergMesh, floes);
  if (wantMirror) { mirror.add(new THREE.Mesh(glacierGeo, matIceMirror), new THREE.Mesh(bergGeo, matIceMirror)); object.add(mirror); }

  // ---------- aurora leak above the top crevasses ----------
  const plumeK = opts.plume ?? 1;
  if (plumeK > 0) {
    const NSx = 120, NV = 10, pos = [], uv = [], idx = [];
    const ph = rng.range(0, 6.28), wig = rng.range(0.8, 1.6), Hp = rng.range(170, 220);
    for (let i = 0; i <= NSx; i++) {
      const s = i / NSx, x = lerp(-0.44 * W, 0.44 * W, s), fx = x / halfW;
      const d = 34 + 22 * Math.sin(s * Math.PI * 2 * wig + ph) + 8 * N.n2(s * 6 + ox, 2.2);
      const y0 = topH(x, d) - 4, hh = Hp * (0.8 + 0.2 * N.n2(s * 3 + oz, 8.8));
      for (let j = 0; j <= NV; j++) { const v = j / NV; pos.push(x, y0 + v * hh, -bow * fx * fx - d); uv.push(s, v); }
    }
    for (let i = 0; i < NSx; i++) for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    pg.setIndex(idx); pg.computeBoundingSphere(); pg.boundingSphere.radius += 45;
    const pm = additive(PLUME_VERT, PLUME_FRAG, { uStrength: { value: 0.9 * plumeK } });
    const plume = new THREE.Mesh(pg, pm); plume.name = 'aurora-leak'; object.add(plume);
    if (wantMirror) mirror.add(new THREE.Mesh(pg, additive(PLUME_VERT, PLUME_FRAG, { uStrength: { value: 0.65 * plumeK } })));
  }

  // ---------- water, light spill, drifting crystals ----------
  const waterRadius = opts.waterRadius ?? 1600;
  if (wantWater) {
    const wm = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uRadius: { value: waterRadius }, uBody: { value: new THREE.Color('#020a12') },
        uCSky: { value: cSky.clone().lerp(pal[2], 0.06) }, uLight: shared.uLight, ...fogU() },
      vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true, transparent: true, depthWrite: false,
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(waterRadius, 72), wm);
    water.rotation.x = -Math.PI / 2; water.renderOrder = 2; water.name = 'water'; object.add(water);
  }
  const sg = new THREE.PlaneGeometry(100, 280, 1, 1); sg.translate(0, -60, 0);
  const spill = new THREE.Mesh(sg, additive(WATER_VERT, SPILL_FRAG, {}));
  spill.rotation.x = -Math.PI / 2; spill.position.y = 0.04; spill.renderOrder = 3; spill.name = 'light-spill'; object.add(spill);

  const nM = 420, mp = new Float32Array(nM * 3), ms = new Float32Array(nM * 4);
  for (let i = 0; i < nM; i++) {
    mp[i * 3] = rng.gauss() * 5; mp[i * 3 + 1] = rng.range(0, 15); mp[i * 3 + 2] = 0;
    ms[i * 4] = rng(); ms[i * 4 + 1] = rng(); ms[i * 4 + 2] = rng(); ms[i * 4 + 3] = rng();
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg.setAttribute('aSeed', new THREE.BufferAttribute(ms, 4));
  const motes = new THREE.Points(mg, additive(MOTE_VERT, MOTE_FRAG, { uScale: { value: 900 } }));
  motes.frustumCulled = false; motes.renderOrder = 4; motes.name = 'ice-crystals'; object.add(motes);

  // ---------- anchors ----------
  const seat = [seatX, 9, zMouth - 2.5];
  const flyThrough = [];
  for (let z = Math.max(330, Math.ceil((avFar + 40) / 25) * 25 + 5); z > 80; z -= 25) flyThrough.push([pathX(z), pathY(z), z]);
  flyThrough.push([seat[0], 9, 75], [seat[0], 9, 40], [seat[0], 9, 12], seat.slice());
  const tb = tallest || { position: [20, 0, 150], radius: 10, height: 18 };
  const anchors = {
    portalSeat: { position: seat.slice(), normal: [0, 0, 1], radius: 7 },
    portalStreak: { position: [seat[0], 0.06, 28], size: [9, 60] },
    flyThrough,
    viewpoints: {
      reveal: [pathX(330), 14, 330],
      avenue: [pathX(170), pathY(170), 170],
      closePass: [pathX(tb.position[2]), pathY(tb.position[2]), tb.position[2]],
    },
    caveMouth: { center: [caveLean * 12, caveB * 0.45, zMouth], width: caveA * 2, height: caveB },
    icebergs: bergs, waterY: 0, glacierTop, frontZ: 0,
  };

  let progress = 0.75, auroraK = 1;
  const ss = (a, b, x) => smoothstep(a, b, x);
  return {
    object, radius: 150, height: 60, center: new THREE.Vector3(0, 16, -40), anchors,
    ground: !wantWater, groundY: 0,
    setProgress(u) { progress = clamp(u, 0, 1); },
    setAurora(color, intensity = 1) { shared.uLight.value.set(color).lerp(white, 0.45).multiplyScalar(0.5); auroraK = intensity; },
    update(dt, time) {
      shared.uTime.value = time;
      shared.uPulse.value = 0.5 + 0.35 * Math.sin(time * 0.31) + 0.15 * Math.sin(time * 0.83 + 1.3);
      shared.uWave.value = time * 0.45 + progress * 14;
      shared.uGlow.value = glowBase * auroraK * (0.82 + 0.4 * ss(0.45, 0.95, progress));
    },
    dispose() {},
  };
}
