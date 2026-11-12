// Terrain kit, part 5: distant mountain silhouettes for cheap far depth.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeNoise } from '../core.js';

const C = (c) => (c && c.isColor ? c.clone() : new THREE.Color(c));

const VERT = /* glsl */`
attribute vec3 aInfo;
uniform float uFogScale;
varying vec3 vW; varying vec3 vInfo;
#include <fog_pars_vertex>
void main() {
  vInfo = aInfo; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #ifdef USE_FOG
    vFogDepth = -mvPosition.z * uFogScale;
  #endif
}`;
const FRAG = /* glsl */`
uniform vec3 uNear, uHaze, uSunDir, uSunColor, uAmbient, uSnow, uRim;
uniform vec4 uP;      // haze of the nearest layer, haze of the farthest, extra haze pooled at the foot, snow line (0..1 of peak height)
uniform vec2 uQ;      // snow amount, rim amount
varying vec3 vW; varying vec3 vInfo;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); if (n.y < 0.) n = -n;
  float l = max(dot(n, uSunDir), 0.);
  vec3 rock = uNear * (.8 + .4 * vInfo.z) * mix(.74, 1.14, clamp(vInfo.y, 0., 1.));      // darker foot, lighter crest: no flat cut-outs
  float sn = smoothstep(uP.w - .07, uP.w + .07, vInfo.y + (vInfo.z - .5) * .25 - (1. - n.y) * .15) * uQ.x;
  rock = mix(rock, uSnow * (.62 + .2 * vInfo.z), sn);                                       // lit snow lands near 0.75: never clipped
  vec3 c = min(rock * (uAmbient + uSunColor * l), vec3(.86));
  float hz = mix(uP.x, uP.y, vInfo.x);
  hz = mix(hz, 1., uP.z * exp(-max(vInfo.y, 0.) * 5.));
  c = mix(c, uHaze, clamp(hz, 0., 1.));
  // sun-side glow: ridges between the camera and a low sun pick up its colour
  vec3 v = normalize(vW - cameraPosition);
  c += uRim * uQ.y * pow(max(dot(v, uSunDir), 0.), 6.) * (.35 + .65 * hz);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// Rings of low-poly mountain silhouettes that follow the camera (they are "at infinity"): layered, faceted,
// lit by the sun and tinted toward the haze colour with distance. One draw call, layers * segments * 8 triangles (8960 by default).
// opts: rng, layers 4, radius [1500, 3300], height [150, 520] (peak height of the nearest / farthest ring),
//   base -30 (world y of the foot), segments 280, jagged 0.6, coverage 0.75 (how much of each ring carries mountains),
//   colorNear '#35465a', haze (default: the colour of `fog` when you pass fog: scene.fog, else '#a9bdd3'), hazeNear 0.35, hazeFar 0.86, footHaze 0.6,
//   sunDir [0.4,0.5,0.3], sunColor '#ffd9a8', sunIntensity 1.0, ambient '#7f93b4', snow null | true | colour, snowLine 0.62,
//   rim 0.5, follow 1 (< 1 lets them drift slowly for parallax), fog (scene.fog: copy its colour as the haze; true: also apply
//   the scene fog chunk at fogScale 0.25 of the real distance)
export function makeHorizonRidges(opts = {}) {
  const { rng, layers = 4, radius = [1500, 3300], height = [150, 520], base = -30, segments = 280, jagged = 0.6, coverage = 0.75, follow = 1 } = opts;
  const fogObj = opts.fog && opts.fog.color ? opts.fog : null, V = [0, 0.24, 0.5, 0.78, 1];
  const noise = opts.noise || makeNoise(rng ? rng.int(1, 2147483646) : 11);
  const rows = 5, per = (segments + 1) * rows, pos = new Float32Array(layers * per * 3), info = new Float32Array(layers * per * 3), idx = [];
  for (let l = 0; l < layers; l++) {
    const t = layers > 1 ? l / (layers - 1) : 0, R = lerp(radius[0], radius[1], t), H = lerp(height[0], height[1], t), off = 17.3 * l + (rng ? rng.range(0, 50) : 0);
    const spread = H * 1.5, f = 1.1 + 0.5 * l;
    for (let i = 0; i <= segments; i++) {
      const a = ((i % segments) / segments) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const mass = smoothstep(-coverage, 1 - coverage, noise.fbm2(ca * 0.9 + off, sa * 0.9 - off, 2) + 0.15);
      const rd = 1 - Math.abs(noise.fbm2(ca * f * 1.7 + off, sa * f * 1.7 + off, 4, 2.1, 0.55));
      const jag = noise.n2(ca * f * 9 + off, sa * f * 9 - off) + 0.45 * noise.n2(ca * f * 23 - off, sa * f * 23 + off);
      const h = H * clamp((0.22 + 0.78 * Math.pow(rd, 1.6)) * (0.3 + 0.7 * mass) + jagged * 0.12 * jag, 0.05, 1.2);
      for (let r = 0; r < rows; r++) {
        const k = l * per + i * rows + r, v = V[r];
        const j1 = noise.n2(ca * 23 + r * 7.7 + off, sa * 23 - r * 3.1), j2 = noise.n2(ca * 41 - r * 5.3, sa * 41 + off + r);
        const rr = R - spread * (1 - v) * (1 + 0.25 * j1 * (r > 0 && r < rows - 1 ? 1 : 0)) + (r === rows - 1 ? 0 : spread * 0.12 * j2);
        const y = r === 0 ? -H * 0.15 : h * (v + (r < rows - 1 ? 0.13 * j2 * jagged : 0));
        pos[k * 3] = ca * rr; pos[k * 3 + 1] = y; pos[k * 3 + 2] = sa * rr;
        info[k * 3] = t; info[k * 3 + 1] = y / H; info[k * 3 + 2] = 0.5 + 0.5 * noise.n2(ca * 31 + off + r * 2.2, sa * 31 + r * 1.3);
      }
    }
    for (let i = 0; i < segments; i++) for (let r = 0; r < rows - 1; r++) {
      const a = l * per + i * rows + r, b = a + rows, c = a + 1, d = b + 1;
      if ((i + r) & 1) idx.push(a, b, d, a, d, c); else idx.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geometry.setAttribute('aInfo', new THREE.BufferAttribute(info, 3));
  geometry.setIndex(idx);
  const sun = (opts.sunDir ? (opts.sunDir.isVector3 ? opts.sunDir.clone() : new THREE.Vector3().fromArray(opts.sunDir)) : new THREE.Vector3(0.4, 0.5, 0.3)).normalize();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uNear: { value: C(opts.colorNear ?? '#35465a') }, uHaze: { value: C(opts.haze ?? (fogObj ? fogObj.color : '#a9bdd3')) }, uSunDir: { value: sun },
    uSunColor: { value: C(opts.sunColor ?? '#ffd9a8').multiplyScalar(opts.sunIntensity ?? 1.0) }, uAmbient: { value: C(opts.ambient ?? '#7f93b4') },
    uSnow: { value: C(opts.snow && opts.snow !== true ? opts.snow : '#d6dde9') }, uRim: { value: C(opts.sunColor ?? '#ffd9a8') },
    uP: { value: new THREE.Vector4(opts.hazeNear ?? 0.35, opts.hazeFar ?? 0.86, opts.footHaze ?? 0.6, opts.snowLine ?? 0.62) },
    uQ: { value: new THREE.Vector2(opts.snow ? 1 : 0, opts.rim ?? 0.5) }, uFogScale: { value: opts.fogScale ?? 0.25 },
  }]);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, fog: opts.fog === true || !!opts.sceneFog, side: THREE.DoubleSide });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'horizonRidges'; object.frustumCulled = false; object.position.y = base;
  return {
    object, geometry, material, uniforms, triangles: idx.length / 3,
    update(dt, time, camera) { if (camera) { object.position.x = camera.position.x * follow; object.position.z = camera.position.z * follow; } },
  };
}
