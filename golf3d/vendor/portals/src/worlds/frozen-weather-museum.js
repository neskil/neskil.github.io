// Museum of Frozen Weather.
// A white marble museum with a mirror-black floor in which weather is kept as exhibits: a hanging rain shower,
// a gust of autumn leaves, a lightning bolt under glass, a tornado in a rotunda (the hero, src/parts) and a
// hurricane mounted on the end wall. A thaw front runs 40 m ahead of the camera, so everything is first seen
// frozen and wakes on approach. Sparrows, the cornice tram, the caretaker's balloon and steam are never frozen.
//
// Layout (world metres; the flight goes down -Z):
//   enfilade   x -30..30, y 0..40, z 365..86   (rain cube z 290..320, leaf gust z 280..96, lightning case z 140)
//   rotunda    radius 90 about the origin, drum to 130, dome to 220, oculus radius 15 (hero at the origin)
//   final hall x -120..120, y 0..240, z -88..-350, hurricane disc radius 110 about (0,120,-350), recess to z -400
// One analytic light model is shared by every shader here (GLSL `sunVis`): the sun reaches a point only if the
// line towards it passes through a skylight or the oculus, which gives the hard parallelograms on the floor,
// lit leaves and motes inside the shafts and matching volumetric shafts without a single shadow map.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as FX from '../kit/fx.js';
import { buildHero } from '../parts/frozen-weather-museum.js';

const TAU = Math.PI * 2;
const PAL = ['#F4F1EA', '#DCE6EE', '#C9CED3', '#B08D57', '#14181E', '#CFC4FF', '#D98A3A'];
const HC = new THREE.Vector3(0, 120, -350);      // hurricane centre on the end wall
const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

// ---------------------------------------------------------------------------------------------------------
// shared GLSL: noise, skylights, sun visibility, fog, the analytic room used for reflections
// ---------------------------------------------------------------------------------------------------------
const GLSL_LIGHT = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uSkyCol, uAmbCol, uFogCol, uFlashCol, uMarble, uBrassCol;
  uniform float uFogDen, uSkyGain, uHurT, uEye, uJarWash;
  uniform vec4 uFlash, uWarm;
  uniform vec3 uWarmCol, uKeyCol, uGoldCol;
  uniform float uFillBase, uGoldSpill, uFloorK;
  float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vn3(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float vn2(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y);
  }
  float band(float x, float w, float s) { return 1.0 - smoothstep(w - s, w + s, abs(x)); }
  // skylights: q = point in the ceiling plane (x, z)
  float skyE(vec2 q, float s) { float zz = mod(q.y - 330.0, 20.0) - 10.0; return band(zz, 3.0, s) * band(q.x, 17.0, s) * step(96.0, q.y) * step(q.y, 354.0); }
  float skyF(vec2 q, float s) { float zz = mod(q.y + 105.0, 50.0) - 25.0; return band(zz, 7.0, s) * band(q.x, 92.0, s) * step(-258.0, q.y) * step(q.y, -102.0); }
  float sunVis(vec3 p) {
    float ly = max(uSunDir.y, 0.05);
    if (p.z > 86.5) { float t = max(40.0 - p.y, 0.0) / ly; return skyE(p.xz + uSunDir.xz * t, 0.2 + 0.02 * t); }
    if (p.z > -89.0) { float t = max(220.0 - p.y, 0.0) / ly; float s = 0.5 + 0.02 * t; return 1.0 - smoothstep(15.0 - s, 15.0 + s, length(p.xz + uSunDir.xz * t)); }
    float t = max(240.0 - p.y, 0.0) / ly; return skyF(p.xz + uSunDir.xz * t, 0.4 + 0.02 * t);
  }
  vec3 applyFog(vec3 c, float d) { float f = 1.0 - exp(-uFogDen * uFogDen * d * d); return mix(c, uFogCol, f); }
  float safeDiv(float a, float b) { return a / (abs(b) < 1e-4 ? (b < 0.0 ? -1e-4 : 1e-4) : b); }
  // warm exhibit light (the look decides how strong): the tornado's dust glow and the wall of bell jars
  float jarRuns(float z) { return band(z - 210.0, 36.0, 3.0) + band(z - 133.5, 32.5, 3.0); }
  vec3 warmLight(vec3 p, vec3 N) {
    vec3 d = uWarm.xyz - p; d.y *= 0.45; float d2 = dot(d, d);
    vec3 w = uWarmCol * uWarm.w * (0.4 + 0.6 * max(dot(N, d * inversesqrt(max(d2, 1e-3))), 0.0)) * exp(-sqrt(d2) / 45.0) * step(p.z, 100.0);
    w += uWarmCol * uJarWash * jarRuns(p.z) * exp(-max(28.5 - p.x, 0.0) / 10.0) * (1.0 - smoothstep(16.0, 34.0, p.y)) * (0.45 + 0.55 * abs(N.x) + 0.3 * max(N.y, 0.0)) * step(86.5, p.z);
    return w;
  }
  // the hurricane's gold light on the marble around it: the recess, the surround and the near ends of walls and ceiling
  vec3 hurrGlow(vec3 p) {
    float rr = length(p.xy - vec2(0.0, 120.0)), dz = p.z + 350.0;
    float dr = length(vec2(max(rr - 113.0, 0.0), dz < 0.0 ? -dz * 2.2 : dz));
    return uGoldCol * uGoldSpill * uEye * (exp(-dr / 24.0) + 0.07 * exp(-dr / 120.0)) * step(p.z, -89.0);
  }
  // the hurricane as a flat picture (for reflections): d = offset from its centre in the wall plane
  vec3 hurrFlat(vec2 d) {
    float r = length(d) + 1e-3, a = atan(d.y, d.x + (abs(d.x) < 1e-4 ? 1e-4 : 0.0));
    float arms = 0.5 + 0.5 * sin(2.0 * a + 5.5 * log(r) - uHurT * 0.25);
    vec3 c = mix(vec3(0.10, 0.13, 0.19), vec3(0.62, 0.66, 0.72), arms * smoothstep(8.0, 30.0, r));
    c += vec3(1.0, 0.82, 0.5) * uEye * exp(-r / 16.0);
    return c;
  }
  // what a ray leaving point p in direction R sees: a coarse analytic copy of the three rooms
  vec3 roomEnv(vec3 p, vec3 R) {
    vec3 wallC = uMarble * (uAmbCol * 0.8 + uKeyCol * 0.3);
    if (p.z > 86.5) {
      float tx = safeDiv((R.x > 0.0 ? 30.0 : -30.0) - p.x, R.x), ty = R.y > 0.0 ? (40.0 - p.y) / max(R.y, 1e-4) : p.y / max(-R.y, 1e-4);
      float t = min(tx, ty); vec3 h = p + R * t; vec3 col;
      if (ty < tx) {
        if (R.y > 0.0) { vec2 cf = abs(fract(h.xz / 5.0) - 0.5); col = wallC * mix(0.5, 0.8, smoothstep(0.3, 0.36, max(cf.x, cf.y))); col = mix(col, uSkyCol * uSkyGain, skyE(h.xz, 0.3)); }
        else col = vec3(0.012);
      } else {
        float pil = band(mod(h.z, 10.0) - 5.0, 1.3, 0.15);
        col = wallC * mix(0.78, 1.0, pil) * (0.6 + 0.4 * h.y / 40.0) + uMarble * uSunCol * 0.3 * sunVis(h);
        col = mix(col, uBrassCol * 1.4, band(h.y - 30.0, 0.5, 0.2));
        if (R.x > 0.0) col += uWarmCol * uJarWash * jarRuns(h.z) * (1.2 + 5.0 * band(fract((h.y - 3.9) / 4.2) - 0.5, 0.16, 0.08)) * step(h.y, 22.5) * step(2.0, h.y);   // the lit jars
      }
      for (int i = 0; i < 3; i++) {                                   // the column screens
        float zs = i == 0 ? 250.0 : (i == 1 ? 170.0 : 96.0);
        float tz = safeDiv(zs - p.z, R.z);
        if (tz > 0.0 && tz < t) {
          vec3 q = p + R * tz; float ax = abs(q.x);
          float c1 = band(ax - 17.0, 1.5, 0.12) + band(ax - 21.5, 1.5, 0.12);
          float m = q.y < 34.0 ? clamp(c1, 0.0, 1.0) : step(q.y, 40.0);
          float sh = 0.55 + 0.45 * sqrt(max(1.0 - pow(min(abs(ax - 17.0), abs(ax - 21.5)) / 1.5, 2.0), 0.0));
          col = mix(col, wallC * (q.y < 34.0 ? sh : 0.85), m); t = mix(t, tz, m);
        }
      }
      if (p.z + R.z * t < 86.0) col = mix(col, wallC * 1.15 + uAmbCol * vec3(0.3, 0.24, 0.15), 0.7);     // the rotunda beyond the door
      return col;
    }
    if (p.z > -89.0) {
      float b = dot(p.xz, R.xz), a2 = max(dot(R.xz, R.xz), 1e-5), c = dot(p.xz, p.xz) - 8100.0;
      float tw = (-b + sqrt(max(b * b - a2 * c, 0.0))) / a2; vec3 h = p + R * tw;
      if (h.y < 0.0) return vec3(0.012);
      float k = clamp(h.y / 130.0, 0.0, 1.6);
      vec3 col = wallC * (0.55 + 0.4 * min(k, 1.0)) + uMarble * uSunCol * 0.3 * sunVis(h) + uMarble * warmLight(h, vec3(0.0, 1.0, 0.0)) * 0.6;
      if (h.y > 130.0) { float tt = (220.0 - p.y) / max(R.y, 1e-3); float rho = length(p.xz + R.xz * tt); col = mix(wallC * 0.9, uSkyCol * uSkyGain, 1.0 - smoothstep(14.0, 16.0, rho)); }
      return col;
    }
    float tx = safeDiv((R.x > 0.0 ? 120.0 : -120.0) - p.x, R.x), ty = R.y > 0.0 ? (240.0 - p.y) / max(R.y, 1e-4) : p.y / max(-R.y, 1e-4);
    float tz = R.z < 0.0 ? (-350.0 - p.z) / min(R.z, -1e-4) : (-88.0 - p.z) / max(R.z, 1e-4);
    float t = min(min(tx, ty), tz); vec3 h = p + R * t; vec3 col;
    if (t == ty) col = R.y > 0.0 ? mix(wallC * 0.7, uSkyCol * uSkyGain, skyF(h.xz, 0.5)) : vec3(0.012);
    else if (t == tx) col = wallC * mix(0.8, 1.0, band(mod(h.z, 26.0) - 13.0, 3.0, 0.3)) * (0.55 + 0.45 * h.y / 240.0) + uMarble * uSunCol * 0.3 * sunVis(h);
    else {
      col = wallC * (0.55 + 0.45 * h.y / 240.0);
      if (R.z < 0.0) { vec2 d = h.xy - vec2(0.0, 120.0); float rr = length(d); col = mix(hurrFlat(d), col, smoothstep(108.0, 114.0, rr)); }
    }
    return col;
  }
`;

// ---------------------------------------------------------------------------------------------------------
// the architecture material: one shader, a material id per vertex
//   0 marble  1 black mirror floor  2 brass  3 matte (vertex colour)  4 emissive (vertex colour)
//   5 flat ceiling (coffers + skylights)  6 dome (radial coffers)  7 glass (drawn in a separate transparent mesh)
//   8 foliage (mottled, swaying)  9 fruit (matte, sways with the foliage)
// ---------------------------------------------------------------------------------------------------------
function makeArchMaterial(SH, transparent = false) {
  return new THREE.ShaderMaterial({
    uniforms: { ...SH, uGlass: { value: transparent ? 1 : 0 } },
    side: THREE.DoubleSide, transparent, depthWrite: !transparent,
    vertexShader: /* glsl */`
      attribute float aMat; attribute vec3 color; uniform float uTime;
      varying vec3 vW, vN, vCol; varying float vMat;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vCol = color; vMat = aMat;
        if (aMat > 7.5) {                                       // foliage and fruit: the whole crown leans, the leaves shiver
          float ph = floor(w.x / 9.0 + 0.5) * 2.1 + floor(w.z / 9.0 + 0.5) * 1.3, k = smoothstep(4.0, 10.0, w.y) * (w.z < -89.0 ? 2.2 : 1.0);
          w.xz += vec2(sin(uTime * 0.83 + ph) + 0.4 * sin(uTime * 2.1 + ph * 1.7), cos(uTime * 0.67 + ph * 1.3)) * 0.085 * k;
          w.xyz += vN * 0.035 * k * sin(uTime * 2.7 + w.x * 2.9 + w.y * 3.7 + w.z * 3.1) * step(aMat, 8.5);
        }
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uGlass, uBoltGrow; uniform vec3 uBoltPos, uGlowCol;
      varying vec3 vW, vN, vCol; varying float vMat;
      float veins(vec3 p) {
        float n = vn3(p * 0.11) * 0.6 + vn3(p * 0.27 + 7.3) * 0.3 + vn3(p * 0.71) * 0.1;
        return 1.0 - smoothstep(0.0, 0.022, abs(n - 0.5));
      }
      void main() {
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
        vec3 N = normalize(vN); if (dot(N, V) < 0.0) N = -N;
        int m = int(vMat + 0.5);
        float sv = sunVis(vW), ndl = max(dot(N, uSunDir), 0.0);
        vec3 sun = uSunCol * sv * ndl;
        vec3 fd = uFlash.xyz - vW; float fl2 = dot(fd, fd);
        vec3 flash = uFlashCol * uFlash.w * (0.35 + 0.65 * max(dot(N, fd * inversesqrt(max(fl2, 1e-3))), 0.0)) / (1.0 + fl2 / 1600.0);
        float up = N.y * 0.5 + 0.5;
        vec3 amb = uAmbCol * mix(0.55, 1.0, up);
        vec3 warm = warmLight(vW, N);
        vec3 col;
        if (m == 1) {                                           // polished black marble
          vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
          float nv = clamp(V.y, 0.0, 1.0), fres = 0.035 + 0.32 * pow(1.0 - nv, 5.0);
          float vv = veins(vW * vec3(0.5, 1.0, 0.5));
          float tile = max(band(mod(vW.x + 30.0, 10.0) - 5.0, 4.96, 0.02), 0.0) * band(mod(vW.z, 10.0) - 5.0, 4.96, 0.02);
          vec3 base = vec3(0.016, 0.019, 0.024) * (0.6 + 0.6 * vn2(vW.xz * 0.05)) + vec3(0.018, 0.02, 0.023) * vv;
          base *= mix(0.45, 1.0, tile);
          col = base * (amb * 2.0 + flash * 3.0 + warm * 2.0 + hurrGlow(vW) * 2.0) + (base + 0.05) * sun * 1.6;
          vec3 env = roomEnv(vW + vec3(0.0, 0.02, 0.0), R) * mix(0.75, 1.0, sv) * uFloorK;
          // mirrored glows: the lightning (a vertical line of light) and the flash
          vec2 lp = uBoltPos.xz - vW.xz; float tl = dot(lp, R.xz) / max(dot(R.xz, R.xz), 1e-4);
          float dl = length(lp - R.xz * tl), hl = R.y * tl;
          float seen = step(0.0, tl) * step(36.0 * (1.0 - uBoltGrow), hl) * step(hl, 36.0);
          env += uGlowCol * seen * (6.0 * exp(-dl * dl * 1.5) + 0.8 * exp(-dl * 0.35)) * step(86.5, vW.z);
          col += env * fres * mix(0.8, 0.62, vv);
        } else if (m == 2) {                                    // brass
          vec3 R = reflect(-V, N);
          vec3 env = roomEnv(vW + N * 0.05, R);
          float sp = pow(max(dot(R, uSunDir), 0.0), 40.0) * sv;
          col = uBrassCol * (amb * 0.45 + sun * 0.6 + flash + warm + hurrGlow(vW) * 1.4 + env * 0.9 + uSunCol * sp * 1.5) * (0.85 + 0.3 * vn3(vW * 3.0));
        } else if (m == 3 || m == 9) {
          col = vCol * (amb + sun + flash + warm);
        } else if (m == 8) {                                    // foliage: mottled leaves, a sun term, light through the rim
          vec3 q = vW * 2.4;
          float l1 = vn3(q), l2 = vn3(q * 2.9 + 11.0), l3 = vn3(q * 7.3 + 5.0), lf = l1 * 0.4 + l2 * 0.35 + l3 * 0.25;
          if (dot(N, V) < (0.08 + 0.5 * (l1 * 0.45 + l2 * 0.55)) * (1.0 - smoothstep(30.0, 70.0, dist))) discard;   // a ragged, leafy outline instead of a faceted ball
          vec3 Nf = normalize(N + (vec3(l2, l3, vn3(q * 2.9 - 23.0)) - 0.5) * 1.2);
          float ndf = max(dot(Nf, uSunDir), 0.0), upf = Nf.y * 0.5 + 0.5;
          float occ = mix(0.3, 1.0, smoothstep(0.34, 0.6, lf)) * mix(0.5, 1.0, up);
          vec3 leaf = mix(vCol * 0.5, vCol * 1.55 + vec3(0.012, 0.03, 0.0), smoothstep(0.38, 0.7, lf));
          float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
          col = leaf * ((uAmbCol * mix(0.5, 1.2, upf) + uSunCol * sv * (0.2 + 0.8 * ndf)) * occ + flash + warm);
          col += vCol * vec3(1.4, 1.9, 0.6) * rim * (uAmbCol * 0.5 + uSunCol * sv * 0.4) * occ;
          col += uSkyCol * uSkyGain * 0.05 * smoothstep(0.78, 0.95, l3) * upf * occ;                       // gloss on single leaves
        } else if (m == 4) {
          col = vCol;
        } else if (m == 5) {                                    // flat coffered ceiling with skylights
          float per = vW.z > 86.5 ? 5.0 : 10.0;
          vec2 g = vec2(vW.x, vW.z) / per; vec2 cf = abs(fract(g) - 0.5);
          float e = max(cf.x, cf.y); float cof = smoothstep(0.30, 0.34, e), inner = 1.0 - smoothstep(0.12, 0.30, e);
          float sk = vW.z > 86.5 ? skyE(vW.xz, 0.12) : skyF(vW.xz, 0.3);
          float nearSky = vW.z > 86.5 ? skyE(vW.xz, 2.5) : skyF(vW.xz, 6.0);
          col = uMarble * uAmbCol * (mix(0.52, 0.86, cof) + 0.1 * inner + 0.35 * nearSky) + uMarble * (flash + warm * 0.6 + hurrGlow(vW) * mix(0.35, 1.0, cof));
          col += uBrassCol * 0.5 * (1.0 - smoothstep(0.03, 0.06, length(cf))) ;
          vec3 glass = uSkyCol * uSkyGain * (0.9 + 0.1 * band(mod(vW.x, 3.4) - 1.7, 1.62, 0.02));
          col = mix(col, glass, sk);
        } else if (m == 6) {                                    // dome
          float rho = length(vW.xz), k = clamp((rho - 15.0) / 75.0, 0.0, 1.0);
          float az = atan(vW.z, vW.x + (abs(vW.x) < 1e-4 ? 1e-4 : 0.0)) * 16.0 / 3.14159, rg = pow(k, 0.7) * 6.0;
          vec2 cf = abs(fract(vec2(az, rg)) - 0.5); float e = max(cf.x, cf.y);
          float cof = smoothstep(0.30, 0.35, e);
          col = uMarble * (uAmbCol * mix(0.46, 0.82, cof) * mix(1.25, 0.72, k) + uKeyCol * 0.5 * mix(0.4, 1.0, cof) * max(dot(N, vec3(-0.31, 0.38, 0.87)), 0.0) + sun * 0.8 + flash + warm * mix(0.5, 1.0, cof));
          col += uSkyCol * 0.25 * (1.0 - smoothstep(0.0, 0.25, k));
          col = mix(col, uBrassCol * 0.9, (1.0 - smoothstep(0.02, 0.05, length(cf))) * 0.6);
        } else {                                                // 0 marble (and 7 glass, shaded below)
          float vv = veins(vW) * (1.0 - smoothstep(22.0, 52.0, dist));
          vec3 alb = uMarble * (0.94 + 0.08 * vn3(vW * 0.04)) * mix(1.0, 0.87, vv * 0.55);
          float ao = 1.0, relief = 1.0;
          if (abs(N.y) < 0.5) {
            float H = vW.z > 86.5 ? 40.0 : (vW.z > -89.0 ? 130.0 : 240.0);
            float hy = clamp(vW.y / H, 0.0, 1.2);
            ao = (0.5 + 0.5 * smoothstep(0.0, 0.95, hy)) * (0.75 + 0.25 * smoothstep(0.0, 0.035, hy));
            if (vCol.g > 0.6 && vCol.r < 0.5) relief = mix(0.56, 1.05, smoothstep(0.05, 0.85, vCol.b));   // column shafts: shade in the flutes
            if (vCol.r > 0.5) {                                 // big wall surfaces carry painted relief
              float along, per, pw;
              if (vW.z > 86.5) { along = abs(N.x) > 0.5 ? vW.z : vW.x; per = 10.0; pw = 1.3; }
              else if (vW.z > -89.0) { along = atan(vW.z, vW.x + (abs(vW.x) < 1e-4 ? 1e-4 : 0.0)) * 90.0; per = 3.14159 * 180.0 / 32.0; pw = 2.6; }
              else { along = abs(N.x) > 0.5 ? vW.z : vW.x; per = 26.0; pw = 3.0; }
              float a = mod(along, per) - per * 0.5;
              float pil = band(a, pw, 0.06), edge = band(abs(a) - pw - 0.35, 0.35, 0.3);
              float panel = band(a, per * 0.5 - pw - 1.6, 0.1) * band(hy - 0.44, 0.30, 0.004);
              float top = band(hy - 0.80, 0.012, 0.003) + band(hy - 0.07, 0.006, 0.002);
              relief = mix(0.86, 1.0, pil) * (1.0 - 0.3 * edge * (1.0 - pil)) * (1.0 - 0.13 * panel) * (1.0 - 0.25 * clamp(top, 0.0, 1.0));
              relief *= 1.0 - 0.18 * panel * smoothstep(0.66, 0.74, hy);
            }
          }
          float kd = max(dot(N, vec3(-0.31, 0.38, 0.87)), 0.0);
          float fill = uFillBase + 0.08 * max(-N.z, 0.0);                                                     // so that returns and reveals read
          col = alb * relief * (amb * ao * fill + uKeyCol * kd * ao + sun * 0.6 + flash + warm + hurrGlow(vW) * (0.55 + 0.45 * max(-N.z, 0.0) + 0.3 * abs(N.y)));
        }
        float alpha = 1.0;
        if (uGlass > 0.5) {                                     // vitrine glass: a fresnel sheen and the room in it
          vec3 R = reflect(-V, N); float fr = pow(1.0 - abs(dot(N, V)), 3.0);
          col = roomEnv(vW + N * 0.05, R) * (0.25 + 0.75 * fr) + flash * 0.4; alpha = 0.06 + 0.5 * fr;
        }
        gl_FragColor = vec4(applyFog(col, dist), alpha);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------
// geometry bag: merged pieces with position, normal, color, aMat
// ---------------------------------------------------------------------------------------------------------
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function TRS(px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_p.set(px, py, pz), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
const WHITE = new THREE.Color(1, 1, 1), GREY = new THREE.Color(0.3, 0.3, 0.3);
function makeBag() {
  const list = [];
  const bag = {
    add(geo, mat, m, color = GREY) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      if (m) g.applyMatrix4(m);
      const n = g.attributes.position.count, col = new Float32Array(n * 3), am = new Float32Array(n).fill(mat);
      for (let i = 0; i < n; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aMat', new THREE.BufferAttribute(am, 1));
      list.push(g); return bag;
    },
    box(w, h, d, x, y, z, mat, color, ry = 0) { return bag.add(new THREE.BoxGeometry(w, h, d), mat, TRS(x, y, z, 0, ry, 0), color); },
    cyl(r0, r1, h, x, y, z, mat, color, seg = 12) { return bag.add(new THREE.CylinderGeometry(r1, r0, h, seg, 1, false), mat, TRS(x, y + h / 2, z), color); },
    quad(a, b, c, d, mat, color) {                               // a,b,c,d counter-clockwise, arrays
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...a, ...c, ...d]), 3)); g.computeVertexNormals();
      return bag.add(g, mat, null, color);
    },
    raw(g) { list.push(g); return bag; },                        // a geometry that already has position, normal, color and aMat (non-indexed)
    build() { const g = mergeGeometries(list, false); for (const x of list) x.dispose(); g.computeBoundingSphere(); return g; },
    get count() { return list.length; },
  };
  return bag;
}

// ---------------------------------------------------------------------------------------------------------
// architecture
// ---------------------------------------------------------------------------------------------------------
function columnInto(bag, x, z, h = 34) {
  const sh = new THREE.CylinderGeometry(1.3, 1.5, h - 4.4, 40, 3, true);
  const pos = sh.attributes.position;
  for (let i = 0; i < pos.count; i++) {                       // twenty flutes: every other meridian is pushed in
    const a = Math.atan2(pos.getZ(i), pos.getX(i)), k = Math.round(a / (TAU / 40));
    if (((k % 2) + 2) % 2 === 1) { pos.setX(i, pos.getX(i) * 0.9); pos.setZ(i, pos.getZ(i) * 0.9); }
  }
  const ridge = new Float32Array(pos.count * 3), H2 = (h - 4.4) / 2;
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i)), k = Math.round(a / (TAU / 40)), y = pos.getY(i) / H2;
    const ent = 1 + 0.035 * Math.max(0, 1 - Math.abs(y + 0.33) / 0.7);    // entasis: a slight swell a third of the way up
    pos.setX(i, pos.getX(i) * ent); pos.setZ(i, pos.getZ(i) * ent);
    ridge.set([0.3, 0.9, ((k % 2) + 2) % 2 === 1 ? 0 : 1], i * 3);          // flagged for the shader: b = 0 in the flute, 1 on the arris
  }
  sh.computeVertexNormals(); sh.deleteAttribute('uv'); sh.setAttribute('color', new THREE.BufferAttribute(ridge, 3));
  const shg = sh.toNonIndexed(); sh.dispose(); shg.applyMatrix4(TRS(x, 2 + H2, z));
  shg.setAttribute('aMat', new THREE.BufferAttribute(new Float32Array(shg.attributes.position.count), 1));
  bag.raw(shg);
  bag.box(4.2, 1.0, 4.2, x, 0.5, z, 0);
  bag.cyl(1.95, 1.6, 1.0, x, 1.0, z, 0, GREY, 20);
  bag.cyl(1.32, 2.0, 1.5, x, h - 2.4, z, 0, GREY, 20);
  bag.box(4.3, 0.9, 4.3, x, h - 0.45, z, 0);
  bag.cyl(1.62, 1.62, 0.22, x, 2.0, z, 2, GREY, 20);          // brass collar
}

async function buildArchitecture(V, ctx) {
  const bag = makeBag(), FY = -0.12, WIN = 40;                 // WIN: half width of the window between the rotunda and the final hall
  // ---- enfilade ----
  bag.quad([-30, FY, 365], [30, FY, 365], [30, FY, 84], [-30, FY, 84], 1);
  bag.quad([-30, 40, 84], [30, 40, 84], [30, 40, 365], [-30, 40, 365], 5);
  for (const sx of [-1, 1]) {
    bag.quad([30 * sx, 0, 365], [30 * sx, 0, 84.85], [30 * sx, 40, 84.85], [30 * sx, 40, 365], 0, WHITE);
    bag.box(1.5, 1.7, 280, 29.25 * sx, 34.2, 225, 0);                         // cornice
    bag.box(0.9, 0.7, 280, 28.9 * sx, 33.0, 225, 0);
    bag.box(0.25, 0.35, 280, 28.5 * sx, 32.5, 225, 2);                        // brass line under it
    bag.box(0.8, 1.6, 280, 29.6 * sx, 0.8, 225, 0);                           // skirting
  }
  for (let z = 105; z < 360; z += 10) {                                         // wall pilasters, real relief
    if (Math.abs(z - 250) < 6 || Math.abs(z - 170) < 6) continue;
    for (const sx of [-1, 1]) { bag.box(0.56, 32.3, 2.6, 29.73 * sx, 16.15, z, 0); bag.box(0.86, 1.9, 3.3, 29.6 * sx, 0.95, z, 0); bag.box(0.86, 1.1, 3.3, 29.6 * sx, 31.7, z, 0); bag.box(0.66, 0.3, 2.9, 29.68 * sx, 30.6, z, 0); }
  }
  await ctx.yield();
  bag.quad([-30, 0, 365], [-30, 40, 365], [30, 40, 365], [30, 0, 365], 0, WHITE);
  bag.box(22, 30, 1.2, 0, 15, 364.6, 3, new THREE.Color(0.05, 0.045, 0.04));  // closed bronze doors behind the entry
  bag.box(25, 1.5, 2.0, 0, 31, 364.2, 0); bag.box(1.6, 31, 2.0, -12, 15.5, 364.2, 0); bag.box(1.6, 31, 2.0, 12, 15.5, 364.2, 0);
  bag.box(0.4, 26, 0.5, 0, 14, 363.9, 2);
  for (const zs of [250, 170, 96]) {
    for (const dz of [-3.2, 3.2]) for (const ax of [17, 21.5]) { columnInto(bag, ax, zs + dz); columnInto(bag, -ax, zs + dz); }
    await ctx.yield();
    bag.box(60, 6, 10.6, 0, 37, zs, 0);
    bag.box(46, 0.5, 11.2, 0, 34.1, zs, 2);
    for (const sx of [-1, 1]) bag.box(2.4, 34, 9.6, 28.8 * sx, 17, zs, 0);
  }
  await ctx.yield();
  // ---- rotunda drum ----
  const R = 90, aE = Math.asin(30 / R), aX = Math.asin(WIN / R);
  const edges = [];
  const arc = (a0, a1, n, kind) => { for (let i = 0; i < n; i++) edges.push([lerp(a0, a1, i / n), lerp(a0, a1, (i + 1) / n), kind]); };
  // angles measured from +Z towards +X
  arc(-aE, aE, 6, 1); arc(aE, Math.PI - aX, 44, 0); arc(Math.PI - aX, Math.PI + aX, 4, 2); arc(Math.PI + aX, TAU - aE, 44, 0);
  const cp = (a, y) => [Math.sin(a) * R, y, Math.cos(a) * R];
  for (const [a0, a1, kind] of edges) {
    const spans = kind === 1 ? [[40, 130]] : kind === 2 ? [[0, 64], [116, 130]] : [[0, 130]];
    for (const [y0, y1] of spans) bag.quad(cp(a0, y0), cp(a0, y1), cp(a1, y1), cp(a1, y0), 0, WHITE);
  }
  const ring = (pts, mat, seg = 96, m = null) => bag.add(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg), mat, m);
  ring([[90, 124], [88.2, 125], [88.2, 127], [86.6, 128.5], [86.6, 131], [90, 131.5]], 0);     // cornice at the springing
  ring([[89.9, 121.5], [88.9, 121.9], [89.9, 122.3]], 2);
  ring([[90, 0], [88.8, 0], [88.8, 1.8], [90, 2.2]], 0, 96);                                     // base moulding (cut at doors by the camera never seeing it)
  for (let k = 0; k < 32; k++) {                                                                 // drum pilasters: 5.2 m wide, 1.3 m proud
    const th = (k + 0.5) * TAU / 32, cx = Math.cos(th), cz = Math.sin(th), ry = Math.PI / 2 - th;
    if ((cz > 0 && Math.abs(cx * R) < 34) || (cz < 0 && Math.abs(cx * R) < WIN + 6)) continue;
    bag.add(new THREE.BoxGeometry(5.2, 120, 1.5), 0, TRS(cx * 89.4, 60, cz * 89.4, 0, ry, 0));
    bag.add(new THREE.BoxGeometry(6.2, 4.4, 2.3), 0, TRS(cx * 89.1, 2.2, cz * 89.1, 0, ry, 0));
    bag.add(new THREE.BoxGeometry(6.2, 3.2, 2.3), 0, TRS(cx * 89.1, 119.2, cz * 89.1, 0, ry, 0));
    bag.add(new THREE.BoxGeometry(5.7, 0.8, 1.9), 0, TRS(cx * 89.25, 115.6, cz * 89.25, 0, ry, 0));
  }
  // dome and oculus
  const dp = []; for (let i = 0; i <= 12; i++) { const f = (i / 12) * Math.PI / 2; dp.push([15 + 75 * Math.cos(f), 131 + 89 * Math.sin(f)]); }
  ring(dp, 6, 64);
  ring([[15.2, 219], [13.8, 219.4], [13.8, 221.5], [15.2, 221.8]], 2, 48);
  const oc = new THREE.CircleGeometry(15, 40); oc.rotateX(Math.PI / 2);
  bag.add(oc, 4, TRS(0, 221.2, 0), V.skyGlow);
  // exit window: frame and balcony towards the final hall. The reveal is 13 m deep (the drum is curved, the hall wall flat),
  // so it carries its own relief: brass architrave bars, pilaster strips on the jambs, a ribbed soffit and a black marble sill.
  const JX = WIN + 1.4, WZ = -85.5, WD = 13;
  for (const sx of [-1, 1]) {
    bag.box(3, 56, WD, JX * sx, 90, WZ, 0);
    for (const z of [-79.3, -91.9]) bag.box(0.45, 51.6, 0.5, (WIN - 0.3) * sx, 90, z, 2);
    for (const z of [-82.4, -88.6]) { bag.box(0.5, 50.4, 1.7, (WIN - 0.3) * sx, 89.6, z, 0); bag.box(0.8, 1.6, 2.3, (WIN - 0.45) * sx, 65, z, 0); bag.box(0.8, 1.2, 2.3, (WIN - 0.45) * sx, 114.2, z, 0); }
    bag.box(0.2, 44, 0.2, (WIN - 0.2) * sx, 89.6, -85.5, 2);
  }
  bag.box(2 * JX + 3, 3.2, WD, 0, 117.6, WZ, 0); bag.box(2 * JX + 3, 2.4, WD + 0.4, 0, 62.8, WZ, 0);
  for (let x = -WIN + 4; x < WIN; x += 8) bag.box(0.8, 0.6, WD - 0.6, x, 115.75, WZ, 0);                 // soffit ribs
  for (const z of [-82.4, -88.6]) bag.box(2 * WIN, 0.45, 0.7, 0, 115.8, z, 0);
  bag.box(2 * WIN - 0.4, 0.4, 0.5, 0, 115.8, -78.8, 2); bag.box(2 * WIN - 0.4, 0.4, 0.5, 0, 115.8, -92.2, 2);
  bag.box(2 * WIN + 14, 1.6, 10, 0, 62.2, -96, 0);                                                   // balcony slab
  bag.quad([-WIN + 0.1, 64.03, -79.1], [WIN - 0.1, 64.03, -79.1], [WIN - 0.1, 64.03, -92.1], [-WIN + 0.1, 64.03, -92.1], 1);       // the sill and the balcony are floored in the black marble
  bag.quad([-WIN - 6.8, 63.03, -92.1], [WIN + 6.8, 63.03, -92.1], [WIN + 6.8, 63.03, -100.9], [-WIN - 6.8, 63.03, -100.9], 1);
  bag.box(2 * WIN + 13.2, 0.3, 0.3, 0, 66.2, -100.6, 2); bag.box(2 * WIN + 13.2, 0.16, 0.16, 0, 64.4, -100.6, 2);
  for (let x = -WIN - 6.6; x <= WIN + 6.7; x += 3.1) bag.cyl(0.13, 0.13, 3.2, x, 63.0, -100.6, 2, GREY, 6);
  for (const sx of [-1, 1]) { bag.box(0.3, 0.3, 9, (WIN + 6.6) * sx, 66.2, -96.4, 2); for (let i = 0; i < 3; i++) bag.cyl(0.13, 0.13, 3.2, (WIN + 6.6) * sx, 63.0, -92.5 - i * 2.8, 2, GREY, 6); }
  await ctx.yield();
  // entry threshold (brass strip where the two floors meet)
  bag.box(60, 0.06, 0.8, 0, 0.04, 85.2, 2);
  await ctx.yield();
  // ---- final hall ----
  bag.quad([-120, FY, -91], [120, FY, -91], [120, FY, -350], [-120, FY, -350], 1);
  bag.quad([-120, 240, -350], [120, 240, -350], [120, 240, -91], [-120, 240, -91], 5);
  for (const sx of [-1, 1]) bag.quad([120 * sx, 0, -91], [120 * sx, 0, -350], [120 * sx, 240, -350], [120 * sx, 240, -91], 0, WHITE);
  const wz = -91;                                                                               // near wall with the window
  bag.quad([-120, 0, wz], [-120, 240, wz], [-WIN, 240, wz], [-WIN, 0, wz], 0, WHITE);
  bag.quad([WIN, 0, wz], [WIN, 240, wz], [120, 240, wz], [120, 0, wz], 0, WHITE);
  bag.quad([-WIN, 0, wz], [-WIN, 64, wz], [WIN, 64, wz], [WIN, 0, wz], 0, WHITE);
  bag.quad([-WIN, 116, wz], [-WIN, 240, wz], [WIN, 240, wz], [WIN, 116, wz], 0, WHITE);
  for (let z = -117; z > -330; z -= 26) for (const sx of [-1, 1]) {                             // side-wall pilasters
    bag.box(1.4, 197, 5.2, 119.4 * sx, 98.5, z, 0); bag.box(2.4, 5.4, 6.4, 118.9 * sx, 2.7, z, 0); bag.box(2.2, 4.2, 6.4, 119 * sx, 195.4, z, 0); bag.box(1.8, 1.0, 5.8, 119.2 * sx, 190.5, z, 0);
  }
  const shp = new THREE.Shape(); shp.moveTo(-120, 0); shp.lineTo(120, 0); shp.lineTo(120, 240); shp.lineTo(-120, 240); shp.lineTo(-120, 0);
  const hole = new THREE.Path(); hole.absarc(0, HC.y, 112, 0, TAU, true); shp.holes.push(hole);
  bag.add(new THREE.ShapeGeometry(shp, 48), 0, TRS(0, 0, HC.z), WHITE);
  const rc = new THREE.CylinderGeometry(112, 112, 50, 72, 1, true); rc.rotateX(Math.PI / 2);
  bag.add(rc, 0, TRS(0, HC.y, HC.z - 25));
  bag.add(new THREE.TorusGeometry(115.5, 3.4, 10, 96), 0, TRS(0, HC.y, HC.z + 0.5));
  bag.add(new THREE.TorusGeometry(111.2, 0.9, 8, 96), 2, TRS(0, HC.y, HC.z + 2.2));
  bag.add(new THREE.TorusGeometry(120.5, 0.5, 6, 96), 2, TRS(0, HC.y, HC.z + 1.0));
  for (const sx of [-1, 1]) { bag.box(1.8, 3.2, 259, 119.1 * sx, 1.6, -220.5, 0); bag.box(3, 5, 259, 118.5 * sx, 200, -220.5, 0); bag.box(0.5, 0.8, 259, 116.9 * sx, 197.4, -220.5, 2); }
  bag.box(240, 3.2, 1.8, 0, 1.6, -349.1, 0);
  await ctx.yield();
  return bag.build();
}

// ---------------------------------------------------------------------------------------------------------
// museum furniture: ropes, plaques, benches, orange trees, shelves, the caretaker's desk, exhibit frames
// ---------------------------------------------------------------------------------------------------------
const VELVET = new THREE.Color(0.30, 0.025, 0.045), WOOD = new THREE.Color(0.16, 0.085, 0.04), LEAFG = new THREE.Color(0.045, 0.13, 0.05);
function ropeRun(bag, pts, postH = 2.3) {                       // brass posts joined by sagging velvet rope
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    bag.cyl(0.42, 0.34, 0.14, x, 0, z, 2, GREY, 10); bag.cyl(0.09, 0.09, postH, x, 0.1, z, 2, GREY, 8);
    bag.add(new THREE.SphereGeometry(0.2, 8, 6), 2, TRS(x, postH + 0.2, z));
    if (i + 1 < pts.length) {
      const [x1, z1] = pts[i + 1], c = [];
      for (let k = 0; k <= 6; k++) { const t = k / 6; c.push(new THREE.Vector3(lerp(x, x1, t), postH - 0.1 - 0.75 * Math.sin(Math.PI * t), lerp(z, z1, t))); }
      bag.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c), 8, 0.085, 5, false), 3, null, VELVET);
    }
  }
}
function rectPts(x0, z0, x1, z1, step = 5) {
  const pts = [], nx = Math.max(1, Math.round((x1 - x0) / step)), nz = Math.max(1, Math.round((z1 - z0) / step));
  for (let i = 0; i < nx; i++) pts.push([lerp(x0, x1, i / nx), z0]);
  for (let i = 0; i < nz; i++) pts.push([x1, lerp(z0, z1, i / nz)]);
  for (let i = 0; i < nx; i++) pts.push([lerp(x1, x0, i / nx), z1]);
  for (let i = 0; i <= nz; i++) pts.push([x0, lerp(z1, z0, i / nz)]);
  return pts;
}
function plaque(bag, x, z, ry = 0) {
  bag.box(0.9, 2.0, 0.9, x, 1.0, z, 0, GREY, ry);
  bag.add(new THREE.BoxGeometry(1.5, 0.08, 1.0), 2, TRS(x, 2.18, z, -0.5, ry, 0));
}
function bench(bag, x, z, ry = 0) {
  const m = TRS(x, 0, z, 0, ry, 0);
  const put = (w, h, d, px, py, pz, mat, c) => bag.add(new THREE.BoxGeometry(w, h, d), mat, m.clone().multiply(TRS(px, py, pz)), c);
  put(7, 0.45, 2.2, 0, 1.35, 0, 3, new THREE.Color(0.10, 0.03, 0.035)); put(7.2, 0.3, 2.4, 0, 1.0, 0, 0);
  put(0.7, 0.9, 2.2, -2.9, 0.45, 0, 0); put(0.7, 0.9, 2.2, 2.9, 0.45, 0, 0);
}
function smoothBlob(rng, r, detail, lump) {                     // a lumpy sphere with smooth normals
  const g0 = new THREE.IcosahedronGeometry(r, detail); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
  const g = mergeVertices(g0, 1e-4), pos = g.attributes.position, o1 = rng() * 9, o2 = rng() * 9; g0.dispose();
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) / r, py = pos.getY(i) / r, pz = pos.getZ(i) / r;
    const k = 1 + lump * (Math.sin(px * 4.3 + o1) * Math.sin(py * 3.9 + o2) + 0.8 * Math.sin(pz * 4.9 + py * 2.0 + o1) + 0.5 * Math.sin(px * 8.3 + pz * 7.1 + o2));
    pos.setXYZ(i, px * k * r, py * k * r, pz * k * r);
  }
  g.computeVertexNormals(); return g;
}
async function makeBlobPool(rng, ctx) {                          // a few lumpy blobs shared by every tree (welding them is the slow part)
  const pool = { big: [], small: [] };
  for (let i = 0; i < 3; i++) { pool.big.push(smoothBlob(rng, 2.25, 2, 0.1)); await ctx.yield(); }
  for (let i = 0; i < 6; i++) { pool.small.push(smoothBlob(rng, 1, 1, 0.14)); if (i & 1) await ctx.yield(); }
  return pool;
}
function orangeTree(bag, rng, pool, x, z, s = 1) {
  bag.cyl(1.3 * s, 1.7 * s, 2.2 * s, x, 0, z, 2, GREY, 14);
  bag.cyl(1.8 * s, 1.8 * s, 0.18 * s, x, 2.2 * s, z, 2, GREY, 14);
  bag.cyl(0.2 * s, 0.14 * s, 4.2 * s, x, 2.2 * s, z, 3, WOOD, 6);
  const green = LEAFG.clone().multiplyScalar(rng.range(0.8, 1.25)), cy = 7.6 * s;
  bag.add(rng.pick(pool.big), 8, TRS(x, cy, z, 0, rng() * TAU, 0, s, s * 0.94, s), green);
  for (let i = 0; i < 15; i++) {                                    // leaf clusters that break up the silhouette
    const a = rng() * TAU, e = Math.asin(rng.range(-0.55, 1)), r = rng.range(1.75, 2.25) * s, rs = rng.range(0.75, 1.2) * s;
    bag.add(rng.pick(pool.small), 8, TRS(x + Math.cos(a) * Math.cos(e) * r, cy + Math.sin(e) * r * 0.94, z + Math.sin(a) * Math.cos(e) * r, rng() * 3, rng() * 3, 0, rs, rs * rng.range(0.7, 0.95), rs),
      green.clone().multiplyScalar(rng.range(0.8, 1.2)));
  }
  for (let i = 0; i < 9; i++) {
    const a = rng() * TAU, e = rng.range(-0.5, 0.9), r = 2.95 * s;
    bag.add(new THREE.IcosahedronGeometry(0.26 * s, 1), 9, TRS(x + Math.cos(a) * Math.cos(e) * r, cy + Math.sin(e) * r * 0.92, z + Math.sin(a) * Math.cos(e) * r), new THREE.Color(0.9, 0.36, 0.03));
  }
}
function frameBox(bag, x0, y0, z0, x1, y1, z1, t, mat = 2) {      // twelve edge bars of a box
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, h = y1 - y0, d = z1 - z0;
  for (const x of [x0, x1]) for (const z of [z0, z1]) bag.box(t, h, t, x, cy, z, mat);
  for (const y of [y0, y1]) { for (const z of [z0, z1]) bag.box(w, t, t, cx, y, z, mat); for (const x of [x0, x1]) bag.box(t, t, d, x, y, cz, mat); }
}
async function buildProps(rng, V, ctx) {                         // returns several geometries: the furniture, then the trees in groups
  const bag = makeBag(), pool = await makeBlobPool(rng, ctx), out = [];
  let trees = makeBag(), nTree = 0;
  const tree = async (x, z, s) => {
    orangeTree(trees, rng, pool, x, z, s); await ctx.yield();
    if (++nTree % 6 === 0) { out.push(trees.build()); trees = makeBag(); await ctx.yield(); }
  };
  await ctx.yield();
  // rain cube: brass frame, low kerb, ropes with the path left open, plaque
  frameBox(bag, -15, 0.4, 290, 15, 31, 320, 0.35);
  for (const sx of [-1, 1]) { ropeRun(bag, [[18 * sx, 287], [18 * sx, 293], [18 * sx, 299], [18 * sx, 305], [18 * sx, 311], [18 * sx, 317], [18 * sx, 323]]); ropeRun(bag, [[18 * sx, 323], [13 * sx, 323], [8.5 * sx, 323]]); ropeRun(bag, [[18 * sx, 287], [13 * sx, 287], [8.5 * sx, 287]]); }
  plaque(bag, 10.5, 325.5, 0.3); plaque(bag, -12.5, 284.5, 2.6);
  await ctx.yield();
  // lightning vitrine: plinth, brass frame (the glass itself is a separate transparent mesh), ropes, plaque
  const lx = V.bolt.x, lz = V.bolt.z;
  bag.box(11.6, 1.2, 11.6, lx, 0.6, lz, 0); bag.box(10.6, 0.5, 10.6, lx, 36.6, lz, 2);
  frameBox(bag, lx - 5, 1.2, lz - 5, lx + 5, 36.4, lz + 5, 0.4);
  bag.cyl(0.5, 0.2, 1.0, lx, 35.4, lz, 2, GREY, 10); bag.cyl(0.9, 0.5, 0.5, lx, 1.2, lz, 2, GREY, 12);
  ropeRun(bag, rectPts(lx - 8.5, lz - 8.5, lx + 8.5, lz + 8.5, 4.25));
  plaque(bag, lx + 9.6, lz + 6.5, -1.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bag.box(0.14, 34.4, 0.14, lx + 4.7 * sx, 18.8, lz + 4.7 * sz, 4, V.edgeGlow);   // lit edges: the case reads from the far end of the hall
  for (const y of [1.55, 36.2]) for (const sx of [-1, 1]) { bag.box(0.12, 0.12, 9.4, lx + 4.7 * sx, y, lz, 4, V.edgeGlow); bag.box(9.4, 0.12, 0.12, lx, y, lz + 4.7 * sx, 4, V.edgeGlow); }
  await ctx.yield();
  // a second, small case on the left wall: a column of hanging snow (or hail) under its own lamp
  const m = V.mini;
  bag.box(7.6, 1.0, 7.6, m.x, 0.5, m.z, 0); bag.box(6.9, 0.3, 6.9, m.x, 1.15, m.z, 2);
  frameBox(bag, m.x - 3, 1.3, m.z - 3, m.x + 3, 13.3, m.z + 3, 0.22);
  bag.box(6.6, 0.5, 6.6, m.x, 13.55, m.z, 2); bag.box(4.6, 0.1, 4.6, m.x, 13.2, m.z, 4, V.lamp.clone().multiplyScalar(0.55));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bag.box(0.08, 11.8, 0.08, m.x + 2.82 * sx, 7.3, m.z + 2.82 * sz, 4, V.edgeGlow);
  plaque(bag, m.x + 5.6, m.z + 2.2, -1.0);
  // the rainbow's brass mist trough and its two posts
  const rb = V.rainbow;
  bag.box(21, 0.35, 1.1, rb.x, 0.17, rb.z, 2); bag.box(20.4, 0.06, 0.6, rb.x, 0.36, rb.z, 3, new THREE.Color(0.02, 0.025, 0.03));
  for (const sx of [-1, 1]) { bag.cyl(0.5, 0.36, 0.5, rb.x + 9.6 * sx, 0, rb.z, 2, GREY, 10); bag.add(new THREE.SphereGeometry(0.34, 10, 8), 2, TRS(rb.x + 9.6 * sx, 0.8, rb.z)); }
  plaque(bag, rb.x + 12.4, rb.z + 2.5, -0.6);
  await ctx.yield();
  // benches, umbrella, orange trees between the wall piers
  bench(bag, 9, 272, 0.0); bench(bag, -9, 232, 0); bench(bag, 10, 196, 0); bench(bag, -8, 120, Math.PI / 2); bench(bag, 9, 150, Math.PI / 2);
  bag.add(new THREE.ConeGeometry(0.22, 2.6, 8), 3, TRS(5.9, 1.25, 272.9, 0.42, 0, 0), new THREE.Color(0.02, 0.04, 0.10));
  bag.add(new THREE.TorusGeometry(0.2, 0.05, 5, 10, Math.PI), 3, TRS(5.9, 2.55, 273.45, 0.42, 0, 0), WOOD);
  for (let z = 345; z > 100; z -= 20) for (const sx of [-1, 1]) {
    if (Math.abs(z - 250) < 9 || Math.abs(z - 170) < 9 || (sx < 0 && (Math.abs(z - lz) < 12 || Math.abs(z - V.mini.z) < 8))) continue;
    await tree(24.2 * sx, z + rng.range(-1, 1), rng.range(0.85, 1.15));
  }
  // bell-jar shelves on the +X wall
  for (const [za, zb] of V.shelfRuns) for (const y of V.shelfY) {
    bag.box(1.9, 0.22, zb - za + 2, 28.9, y - 0.11, (za + zb) / 2, 3, WOOD);
    bag.box(0.12, 0.12, zb - za + 2, 28.05, y + 0.25, (za + zb) / 2, 2);
    for (let z = za; z <= zb + 0.1; z += 9) bag.box(0.2, 0.7, 0.2, 29.5, y - 0.5, z, 2);
  }
  // caretaker's desk with a cup (steam is a separate effect), a chair, a ledger
  const d = V.desk;
  bag.box(4.6, 0.22, 2.4, d.x, 2.1, d.z, 3, WOOD); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bag.box(0.22, 2.0, 0.22, d.x + 2.05 * sx, 1.0, d.z + 0.95 * sz, 3, WOOD);
  bag.cyl(0.2, 0.25, 0.36, d.x + 1.1, 2.21, d.z + 0.3, 3, new THREE.Color(0.75, 0.73, 0.68), 12);
  bag.box(1.3, 0.12, 0.95, d.x - 0.7, 2.27, d.z - 0.1, 3, new THREE.Color(0.24, 0.05, 0.05), 0.2);
  bag.box(1.5, 0.2, 1.5, d.x - 0.2, 1.3, d.z + 2.4, 3, WOOD); bag.box(1.5, 2.0, 0.2, d.x - 0.2, 2.3, d.z + 3.1, 3, WOOD);
  bag.cyl(0.5, 0.5, 0.1, d.x + 1.9, 2.21, d.z - 0.6, 2, GREY, 12); bag.cyl(0.06, 0.06, 1.2, d.x + 1.9, 2.3, d.z - 0.6, 2, GREY, 6);
  bag.add(new THREE.ConeGeometry(0.55, 0.5, 12, 1, true), 4, TRS(d.x + 1.9, 3.7, d.z - 0.6), V.lamp.clone());
  // crocus vitrine plinth (the snow and flowers are separate, they move)
  const c = V.crocus;
  bag.box(4.4, 1.0, 4.4, c.x, 0.5, c.z, 0); frameBox(bag, c.x - 2, 1.0, c.z - 2, c.x + 2, 3.6, c.z + 2, 0.12);
  // final hall: rope line and plaques before the hurricane, benches that give its size away
  const line = []; for (let x = -100; x <= 100; x += 8) line.push([x, -318]);
  ropeRun(bag, line, 2.6);
  for (const x of [-60, -20, 20, 60]) { bench(bag, x, -300, 0); plaque(bag, x + 9, -313, 0); }
  for (const sx of [-1, 1]) for (const z of [-130, -190, -250]) await tree(108 * sx, z, 2.2);
  if (trees.count) out.push(trees.build());
  for (const g of [...pool.big, ...pool.small]) g.dispose();
  await ctx.yield();
  out.unshift(bag.build());
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// instanced quad helper
// ---------------------------------------------------------------------------------------------------------
function instQuads(count, attrs, flat = false) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  if (flat) q.rotateX(-Math.PI / 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  for (const k of Object.keys(attrs)) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], attrs[k].length / count));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// exhibit 1: the hanging shower (rain / snow / hail), 30 m cube, with splash rings on the floor
// ---------------------------------------------------------------------------------------------------------
function makeShower(rng, SH, V, detail, o = {}) {
  const kind = o.kind || V.shower, n = Math.round((o.count || 6000) * detail), nHero = o.count ? 0 : 40, N = n + nHero;
  const aP = new Float32Array(N * 4), aS = new Float32Array(N * 2);
  const base = kind === 'snow' ? [0.05, 0.1] : kind === 'hail' ? [0.05, 0.11] : [0.04, 0.08];
  for (let i = 0; i < N; i++) {
    const hero = i >= n;
    aP.set([hero ? 0.5 + rng.range(-0.2, 0.2) : rng(), hero ? rng.range(0.08, 0.42) : rng(), rng(), rng()], i * 4);
    aS.set([hero ? rng.range(0.1, 0.17) : rng.range(base[0], base[1]), hero ? 1 : 0], i * 2);
  }
  const U = { ...SH, uFall: { value: rng() * 30 }, uSpeed: { value: 0 }, uMode: { value: kind === 'snow' ? 1 : kind === 'hail' ? 2 : 0 },
    uBoxMin: { value: new THREE.Vector3(...(o.min || [-15, 1, 290])) }, uBoxSize: { value: new THREE.Vector3(...(o.size || [30, 30, 30])) }, uPix: { value: 0.0018 }, uSelf: { value: o.self || 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      ${GLSL_LIGHT}
      attribute vec4 aP; attribute vec2 aS;
      uniform float uFall, uSpeed, uMode, uPix; uniform vec3 uBoxMin, uBoxSize;
      varying vec2 vUv; varying vec4 vInfo; varying float vDist;
      void main() {
        vec3 c = uBoxMin + aP.xyz * uBoxSize;
        float v = mix(0.7, 1.3, aP.w) * (uMode > 0.5 && uMode < 1.5 ? 0.22 : 1.0);
        float yy = mod(aP.y * uBoxSize.y - uFall * v, uBoxSize.y);
        c.y = uBoxMin.y + yy;
        if (uMode > 0.5 && uMode < 1.5) { c.x += sin(uFall * 0.11 + aP.w * 40.0) * 0.7; c.z += cos(uFall * 0.09 + aP.w * 23.0) * 0.7; }
        vec4 mv = viewMatrix * vec4(c, 1.0);
        float sz = max(aS.x, -mv.z * uPix);
        float st = 1.0 + uSpeed * (uMode < 0.5 ? mix(3.6, 1.6, aS.y) : (uMode > 1.5 ? 1.0 : 0.0));
        sz *= 1.0 - (uMode < 0.5 ? 0.6 : 0.0) * uSpeed;
        vec3 upv = (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
        mv.xyz += vec3(position.x * sz, 0.0, 0.0) + upv * position.y * sz * st;
        vUv = position.xy; vInfo = vec4(sunVis(c), st, aP.w, sz / max(aS.x, 1e-3)); vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uMode, uSpeed, uSelf;
      varying vec2 vUv; varying vec4 vInfo; varying float vDist;
      vec3 gallery(vec3 d) {                                     // the room a drop sees, as three flat tones
        vec3 wall = uMarble * uAmbCol * (0.75 + 0.25 * step(0.6, fract(atan(d.z, d.x + 1e-4) * 3.0)));
        vec3 ceil = mix(uMarble * uAmbCol * 0.8, uSkyCol * uSkyGain, step(abs(fract(d.x * 1.5 + d.z) - 0.5), 0.2));
        return d.y > 0.28 ? ceil : (d.y < -0.2 ? vec3(0.015, 0.018, 0.022) : wall);
      }
      void main() {
        float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
        float z = sqrt(1.0 - r2); vec3 n = vec3(vUv, z);
        vec3 col;
        vec3 Lv = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
        float nl = max(dot(n, Lv), 0.0), sv = vInfo.x;
        vec3 flash = uFlashCol * uFlash.w * 0.3;
        if (uMode < 0.5) {                                       // water: an upside-down gallery, a rim and a glint
          vec3 d = normalize(vec3(-vUv.x * 1.4, -vUv.y * 1.4, 0.35 + z * 0.3));
          d.xz = vec2(d.x + vInfo.z, d.z);
          col = gallery(normalize(d)) * 0.9;
          col += max(uSkyCol * uSkyGain * 0.3, vec3(0.2, 0.24, 0.3)) * pow(1.0 - z, 2.0);
          col += (max(uSkyCol * uSkyGain, vec3(0.9)) + uSunCol * sv * 2.0) * pow(max(dot(n, normalize(Lv + vec3(0.0, 0.0, 1.0))), 0.0), 60.0);
          col = mix(col, (uSkyCol * 0.45 + uSunCol * sv * 0.35) * (0.6 + 0.4 * z), smoothstep(1.4, 3.4, vInfo.y) * 0.8 + smoothstep(1.0, 3.0, vInfo.w) * 0.1);
          col += uSunCol * sv * 0.12 + flash;
        } else if (uMode < 1.5) {                                // snow: soft lit flakes
          col = vec3(0.9, 0.93, 1.0) * (uAmbCol * 1.1 + uSunCol * sv * 0.8 + flash + uSelf) * (0.55 + 0.45 * z);
        } else {                                                 // hail: milky ice
          col = vec3(0.8, 0.86, 0.95) * (uAmbCol * (0.5 + 0.5 * n.y) + uSunCol * (0.2 + sv) * nl + flash + uSelf * (0.4 + 0.6 * z)) + uSkyCol * 0.5 * pow(1.0 - z, 3.0);
        }
        gl_FragColor = vec4(applyFog(col, vDist), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(instQuads(N, { aP, aS }), mat); mesh.frustumCulled = false; mesh.name = 'shower';
  if (o.count) return { object: mesh, U, set(clockDt, speed) { U.uFall.value += clockDt * (kind === 'snow' ? 9 : 20); U.uSpeed.value = speed; } };
  // splash rings
  const NS = Math.round(260 * detail), sP = new Float32Array(NS * 4);
  for (let i = 0; i < NS; i++) sP.set([rng.range(-15, 15), rng.range(290, 320), rng(), rng.range(0.5, 1.3)], i * 4);
  const smat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aP; uniform float uFall; varying vec2 vUv; varying float vPh; varying vec3 vW;
      void main() {
        vPh = fract(aP.z + uFall * 0.13 * (0.7 + 0.6 * fract(aP.z * 7.13)));
        vec3 c = vec3(aP.x, 0.05, aP.y) + position * aP.w * (0.25 + 1.6 * vPh);
        vUv = position.xz; vW = c; gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uSpeed; varying vec2 vUv; varying float vPh; varying vec3 vW;
      void main() {
        float r = length(vUv); float ring = band(r - 0.8, 0.09, 0.07) + 0.5 * band(r - 0.45, 0.06, 0.05) * step(0.3, vPh);
        float a = ring * (1.0 - vPh) * (1.0 - vPh) * uSpeed;
        gl_FragColor = vec4((uSkyCol * 0.5 + uSunCol * 0.25 * sunVis(vW) + uFlashCol * uFlash.w * 0.2) * a, 1.0);
      }`,
  });
  const splash = new THREE.Mesh(instQuads(NS, { aP: sP }, true), smat); splash.frustumCulled = false; splash.renderOrder = 2;
  const group = new THREE.Group(); group.add(mesh, splash);
  const fallSpeed = kind === 'snow' ? 9 : kind === 'hail' ? 20 : 14;
  return { object: group, U, set(clockDt, speed) { U.uFall.value += clockDt * fallSpeed; U.uSpeed.value = speed; } };
}

// ---------------------------------------------------------------------------------------------------------
// exhibit 2: the gust (autumn leaves and pages / blossom / dandelion seed) on a spline flow field
// ---------------------------------------------------------------------------------------------------------
const NP = 46, SEG = 10;
function makeGust(rng, SH, V, detail, stream = null) {
  const ctrl = stream ? stream.ctrl.map((p) => new THREE.Vector3(p[0], p[1], p[2])) : [[6, 12, 283], [7, 14, 268], [3, 19, 250], [-5, 22, 232], [-7, 19, 214], [-2, 15, 198], [5, 17, 184], [6, 21, 170], [1, 19, 152],
    [-3, 16, 134], [1, 15, 116], [1, 14, 100], [-3, 12.5, 88], [-12, 10.5, 73], [-20, 10, 57], [-25, 12, 42], [-27, 16, 28]]
    .map((p, i) => new THREE.Vector3(p[0] + (i > 0 && i < 10 ? rng.range(-2.5, 2.5) : 0), p[1] + (i > 0 && i < 10 ? rng.range(-2, 2) : 0), p[2]));
  const curve = new THREE.CatmullRomCurve3(ctrl); curve.arcLengthDivisions = 600;
  const Ltot = Math.min(curve.getLength(), (NP - 2) * SEG), pts = [];
  for (let i = 0; i < NP; i++) pts.push(curve.getPointAt(clamp(i * SEG / curve.getLength(), 0, 1)));
  const N = Math.round((stream ? stream.count : 6000) * detail * (V.gust === 'dandelion' ? 0.7 : 1)), aA = new Float32Array(N * 4), aB = new Float32Array(N * 4);
  const pageShare = V.gust === 'leaves' ? rng.range(0.1, 0.18) : 0;
  for (let i = 0; i < N; i++) {
    const page = rng() < pageShare;
    aA.set([rng(), clamp(0.5 + rng.gauss() * 0.2, 0, 1), clamp(0.5 + rng.gauss() * 0.22, 0, 1), rng()], i * 4);
    const size = V.gust === 'leaves' ? (page ? rng.range(0.3, 0.44) : rng.range(0.17, 0.4)) : V.gust === 'blossom' ? rng.range(0.17, 0.33) : rng.range(0.17, 0.3);
    aB.set([page ? 1 : 0, size, rng(), rng() * TAU], i * 4);
  }
  const cols = V.gust === 'leaves' ? ['#D98A3A', '#a8401c', '#e3c23a'] : V.gust === 'blossom' ? ['#f6c9d6', '#fff1f2', '#e89ab4'] : ['#f6f4ea', '#fffdf2', '#e8e2c8'];
  const U = { ...SH, uPts: { value: pts }, uFlow: { value: 0 }, uFlut: { value: rng() * 10 }, uShiver: { value: 0 }, uTime: { value: 0 },
    uL0: { value: stream ? Ltot : 107 }, uLtot: { value: Ltot }, uWide: { value: stream ? stream.wide : 1 }, uShape: { value: V.gust === 'leaves' ? 0 : V.gust === 'blossom' ? 1 : 2 },
    uLeafA: { value: lin(cols[0], 0.8) }, uLeafB: { value: lin(cols[1], 0.8) }, uLeafC: { value: lin(cols[2], 0.8) }, uPage: { value: lin('#efeadb', 0.82) },
    uSelf: { value: V.gust === 'leaves' ? (V.look === 'night' ? 0.5 : 0.08) : (V.look === 'night' ? 0.95 : 0.22) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${GLSL_LIGHT}
      attribute vec4 aA, aB;
      uniform vec3 uPts[${NP}]; uniform float uFlow, uFlut, uShiver, uTime, uL0, uLtot, uShape, uWide;
      varying vec2 vUv; varying vec4 vInfo; varying vec3 vNrm; varying float vDist;
      vec3 curveAt(float f) {
        f = clamp(f, 0.0, ${(NP - 1).toFixed(1)} - 0.001); int i = int(floor(f)); float t = f - float(i);
        vec3 p0 = uPts[max(i - 1, 0)], p1 = uPts[i], p2 = uPts[min(i + 1, ${NP - 1})], p3 = uPts[min(i + 2, ${NP - 1})];
        return 0.5 * ((2.0 * p1) + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t);
      }
      void main() {
        float s = mod(aA.x * uL0 + uFlow * (0.75 + 0.5 * aA.w), uLtot);
        float f = s / ${SEG.toFixed(1)};
        vec3 c = curveAt(f), T = normalize(curveAt(f + 0.15) - c + vec3(0.0, 0.0, -1e-4));
        vec3 side = normalize(cross(T, vec3(0.0, 1.0, 0.0))), upv = cross(side, T);
        float env = smoothstep(0.0, 14.0, s) * (1.0 - smoothstep(uLtot - 30.0, uLtot, s));
        float w = mix(4.0, 11.0, smoothstep(0.0, 40.0, s)) * (1.0 - 0.45 * smoothstep(uLtot - 90.0, uLtot, s)) * uWide;
        float ph = aB.w;
        c += side * ((aA.y - 0.5) * 2.0 * w + sin(s * 0.07 + ph) * 1.6) + upv * ((aA.z - 0.5) * 1.1 * w + cos(s * 0.05 + ph * 1.7) * 1.2);
        c += vec3(sin(uTime * 17.0 + ph * 5.0), cos(uTime * 13.0 + ph * 3.0), sin(uTime * 15.0 + ph)) * 0.06 * uShiver;
        float A = ph + uFlut * (1.2 + 2.2 * aA.w), B = ph * 2.3 + uFlut * (0.6 + 1.3 * fract(aA.w * 7.0));
        float dc = distance(c, cameraPosition);
        float sz = aB.y * env * smoothstep(1.2, 6.0, dc), asp = aB.x > 0.5 ? 0.72 : (uShape > 1.5 ? 1.0 : 0.8);
        if (uShape > 0.5) { sz = max(sz, dc * 0.0042 * env); sz = min(sz, 0.035 + (uShape > 1.5 ? 0.02 : 0.022) * dc); }   // petals and seed hold a few pixels far off (the ribbon reads as a band) and never loom at the lens
        vec3 v = vec3(position.x * sz * asp, position.y * sz, 0.0), nn = vec3(0.0, 0.0, 1.0);
        float ca = cos(A), sa = sin(A), cb = cos(B), sb = sin(B);
        v = vec3(v.x, v.y * ca - v.z * sa, v.y * sa + v.z * ca); nn = vec3(nn.x, nn.y * ca - nn.z * sa, nn.y * sa + nn.z * ca);
        v = vec3(v.x * cb + v.z * sb, v.y, -v.x * sb + v.z * cb); nn = vec3(nn.x * cb + nn.z * sb, nn.y, -nn.x * sb + nn.z * cb);
        vec3 wp = c + v; vNrm = nn; vUv = position.xy; vInfo = vec4(sunVis(wp), aB.x, aB.z, wp.y);
        vec4 mv = viewMatrix * vec4(wp, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 uLeafA, uLeafB, uLeafC, uPage; uniform float uShape, uSelf;
      varying vec2 vUv; varying vec4 vInfo; varying vec3 vNrm; varying float vDist;
      void main() {
        vec3 col; float rib = 0.0;
        if (vInfo.y > 0.5) { col = uPage * (0.92 + 0.08 * step(0.5, fract(vUv.y * 9.0))); }
        else if (uShape < 0.5) {
          float yy = vUv.y, wdt = 0.9 * sqrt(max(1.0 - yy * yy, 0.0)) * (0.72 + 0.28 * cos(yy * 9.0 + vInfo.z * 20.0)) * (0.6 + 0.4 * smoothstep(-1.0, 0.2, yy));
          if (abs(vUv.x) > wdt) discard;
          rib = band(vUv.x, 0.05, 0.03);
          col = vInfo.z < 0.45 ? mix(uLeafA, uLeafB, vInfo.z / 0.45) : mix(uLeafA, uLeafC, (vInfo.z - 0.45) / 0.55);
          col *= 1.0 - 0.3 * rib;
        } else if (uShape < 1.5) {
          vec2 q = vUv * vec2(1.15, 1.0); if (dot(q, q) > 1.0 - 0.25 * smoothstep(0.5, 1.0, vUv.y) * band(vUv.x, 0.18, 0.1)) discard;
          col = mix(mix(uLeafA, uLeafB, vInfo.z), uLeafC, (1.0 - smoothstep(-1.0, -0.2, vUv.y)) * 0.6);
          col = mix(col, uLeafC * vec3(1.0, 0.62, 0.72), (1.0 - smoothstep(0.0, 0.6, length(q - vec2(0.0, -0.35)))) * 0.75) * (0.82 + 0.26 * vUv.y + 0.12 * vUv.x * vUv.x);   // a deeper pink heart, a cupped petal
        } else {
          vec2 pu = vUv - vec2(0.0, 0.3); float r = length(pu) / 0.7, a = atan(pu.y, pu.x + 1e-4);                 // a pappus above a thin stalk and seed
          float soft = (1.0 - smoothstep(0.35, 1.0, r)) * (0.45 + 0.55 * band(fract(a * 2.23) - 0.5, 0.2, 0.2));
          float stalk = band(vUv.x, 0.035, 0.03) * step(vUv.y, 0.3) * step(-0.95, vUv.y);
          float pap = max(soft * 0.75, stalk);
          if (pap < h12(gl_FragCoord.xy + vInfo.z * 91.0) * 0.8 + 0.12) discard;                                // dithered: a soft tuft, not a hard asterisk
          col = mix(uLeafA, uLeafB, vInfo.z) * mix(1.0, 0.3, stalk);
        }
        vec3 N = normalize(vNrm); float nl = abs(dot(N, uSunDir));
        vec3 lit = col * (uAmbCol * (0.75 + 0.25 * abs(N.y)) + uSunCol * vInfo.x * ((0.35 + 0.65 * nl) * 1.1 + (uShape > 0.5 ? 0.5 : 0.0)) + uFlashCol * uFlash.w * 0.5 + uSelf);
        gl_FragColor = vec4(applyFog(lit, vDist), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(instQuads(N, { aA, aB }), mat); mesh.frustumCulled = false; mesh.name = 'gust';
  return { object: mesh, U, curve };
}

// ---------------------------------------------------------------------------------------------------------
// exhibit 3: lightning under glass. A pre-built branching bolt of view-facing ribbons with a growth parameter.
// ---------------------------------------------------------------------------------------------------------
function makeBolt(rng, SH, V) {
  const pos = [], dir = [], side = [], grow = [], wid = [], idx = [];
  const top = new THREE.Vector3(V.bolt.x, 35.2, V.bolt.z), Ltot = 34;
  const seg = (a, b, g0, g1, w) => {
    const i0 = pos.length / 3, d = b.clone().sub(a).normalize();
    for (const [p, g] of [[a, g0], [b, g1]]) for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z); dir.push(d.x, d.y, d.z); side.push(s); grow.push(g); wid.push(w); }
    idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
  };
  const walk = (start, g0, len, heading, w, depth) => {
    let p = start.clone(), g = g0; const steps = Math.max(3, Math.round(len / 1.1));
    for (let i = 0; i < steps; i++) {
      const stp = len / steps, q = p.clone().addScaledVector(heading, stp).add(new THREE.Vector3(rng.gauss(), rng.gauss() * 0.4, rng.gauss()).multiplyScalar(stp * 0.42));
      q.x = clamp(q.x, V.bolt.x - 4.3, V.bolt.x + 4.3); q.z = clamp(q.z, V.bolt.z - 4.3, V.bolt.z + 4.3); q.y = Math.max(q.y, 1.5);
      const g1 = g + p.distanceTo(q) / Ltot * (depth ? 0.8 : 0.93);
      seg(p, q, g, g1, w * (depth ? 1 - 0.6 * i / steps : 1));
      if (depth < 2 && rng() < (depth ? 0.2 : 0.42) && q.y > 4) {
        const a = rng() * TAU, h = new THREE.Vector3(Math.cos(a) * 0.8, -rng.range(0.25, 0.9), Math.sin(a) * 0.8).normalize();
        walk(q, g1, rng.range(3, 10) * (depth ? 0.5 : 1), h, w * 0.55, depth + 1);
      }
      p = q; g = g1; if (p.y <= 1.55) break;
    }
  };
  walk(top, 0, 36.5, new THREE.Vector3(rng.range(-0.06, 0.06), -1, rng.range(-0.06, 0.06)).normalize(), 1, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1)); g.setAttribute('aG', new THREE.Float32BufferAttribute(grow, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(wid, 1));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(V.bolt.x, 18, V.bolt.z), 26);
  const U = { ...SH, uGrow: { value: 0.03 }, uI: { value: 0.5 }, uCol: { value: lin(PAL[5]) }, uTime: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aDir; attribute float aSide, aG, aW; uniform float uTime;
      varying float vS, vG, vW;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 t = normalize((modelViewMatrix * vec4(aDir, 0.0)).xyz);
        vec2 nrm = normalize(vec2(-t.y, t.x) + vec2(1e-5, 0.0));
        float w = max(0.55 * aW + 0.1, -mv.z * 0.0035);
        mv.xy += nrm * aSide * w; vS = aSide; vG = aG; vW = aW;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uGrow, uI; uniform vec3 uCol; varying float vS, vG, vW;
      void main() {
        if (vG > uGrow) discard;
        float x = abs(vS), core = 1.0 - smoothstep(0.0, 0.22, x), halo = (1.0 - x) * (1.0 - x);
        float tip = 1.0 - smoothstep(0.0, 0.07, uGrow - vG);
        float I = uI * (0.7 + 0.3 * vW) + tip * 2.2 * step(uGrow, 0.995);
        gl_FragColor = vec4((vec3(1.0, 0.97, 1.0) * core * 3.2 + uCol * halo * 1.1) * I, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 4; mesh.name = 'bolt';
  return { object: mesh, U };
}

// ---------------------------------------------------------------------------------------------------------
// two hundred bell jars, each holding a small wind of dust that starts as the thaw front reaches it
// ---------------------------------------------------------------------------------------------------------
function makeJars(rng, SH, V) {
  const list = [];
  for (const [za, zb] of V.shelfRuns) for (const y of V.shelfY) for (let z = za + 1; z <= zb - 1; z += 3) list.push([28.75, y, z + rng.range(-0.3, 0.3), rng()]);
  const N = list.length, aP = new Float32Array(N * 4); list.forEach((p, i) => aP.set(p, i * 4));
  const U = { ...SH, uFront: { value: 0 }, uTime: { value: 0 }, uDust: { value: lin(PAL[6], 1.1) }, uJarGlow: { value: V.jarGlow } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aP; uniform float uFront, uTime; varying vec2 vUv; varying vec3 vInfo; varying float vDist;
      void main() {
        vec3 c = aP.xyz; vec3 toC = cameraPosition - c; vec2 sd = normalize(vec2(toC.z, -toC.x) + vec2(1e-5, 0.0));
        vec3 wp = c + vec3(sd.x, 0.0, sd.y) * position.x * 1.0 + vec3(0.0, (position.y + 1.0) * 1.35, 0.0);
        float wake = max(uFront - (335.0 - c.z), 0.0);
        vInfo = vec3(aP.w, wake * 0.32 + uTime * 0.12, smoothstep(0.0, 14.0, wake)); vUv = position.xy;
        vec4 mv = viewMatrix * vec4(wp, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 uDust; uniform float uJarGlow; varying vec2 vUv; varying vec3 vInfo; varying float vDist;
      void main() {
        float y = vUv.y * 0.5 + 0.5, x = vUv.x;                  // y 0..1 up the jar
        float dq = max(y - 0.62, 0.0) / 0.33; float hw = 0.78 * sqrt(max(1.0 - dq * dq, 0.0));
        float knob = band(length(vec2(x, (y - 0.975) * 2.7)), 0.085, 0.02);
        float inside = (1.0 - smoothstep(hw - 0.02, hw + 0.02, abs(x))) * step(0.04, y) * step(y, 0.96);
        float basePl = band(y - 0.02, 0.022, 0.006) * band(x, 0.92, 0.02);
        float edge = inside * smoothstep(hw - 0.2, hw, abs(x));
        float streak = inside * band(x + 0.45 * hw / 0.78, 0.05, 0.04) * smoothstep(0.1, 0.3, y) * (1.0 - smoothstep(0.6, 0.85, y));
        // the little wind: a funnel of streaks
        float fy = clamp((y - 0.07) / 0.72, 0.0, 1.0), fw = 0.07 + 0.34 * pow(fy, 1.6) + 0.02 * sin(fy * 9.0 + vInfo.y);
        float cx = x - 0.07 * sin(fy * 5.0 + vInfo.y * 0.7 + vInfo.x * 6.0);
        float fun = (1.0 - smoothstep(fw * 0.55, fw, abs(cx))) * step(0.07, y) * (1.0 - smoothstep(0.7, 0.82, y));
        float sw = 0.55 + 0.45 * sin(fy * 26.0 - cx / max(fw, 0.02) * 2.2 - vInfo.y * 9.0 + vInfo.x * 30.0);
        float dust = fun * (0.35 + 0.65 * sw) * (0.5 + 0.5 * vInfo.z);
        vec3 lightC = uAmbCol + uFlashCol * uFlash.w * 0.3;
        vec3 col = max(uSkyCol, vec3(0.35, 0.4, 0.5)) * (edge * 0.8 + streak * 1.1) * (0.5 + 0.5 * lightC) + uDust * dust * ((0.6 + lightC) * 0.75 + uJarGlow * (0.6 + 0.4 * vInfo.z));
        float a = clamp(inside * 0.07 + edge * 0.3 + streak * 0.6 + dust * 0.85, 0.0, 1.0);
        col = mix(col, uBrassCol * lightC * 0.9, max(basePl, knob)); a = max(a, max(basePl, knob));
        if (a < 0.01) discard;
        float f = 1.0 - exp(-uFogDen * uFogDen * vDist * vDist);
        gl_FragColor = vec4(mix(col, uFogCol * a, f), a);
      }`,
  });
  const mesh = new THREE.Mesh(instQuads(N, { aP }), mat); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'bell-jars';
  return { object: mesh, U, count: N };
}

// ---------------------------------------------------------------------------------------------------------
// soft cloud puffs: the hurricane (flat on the wall, differential rotation) and the escaped cumulus (billboards)
// ---------------------------------------------------------------------------------------------------------
function makePuffMaterial(SH, U, free) {
  return new THREE.ShaderMaterial({
    uniforms: { ...SH, ...U }, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    defines: free ? { FREE: 1 } : {},
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec2 aB;
      uniform float uT; uniform vec3 uC;
      varying vec2 vUv; varying vec4 vInfo; varying vec3 vP; varying float vDist, vSize;
      void main() {
        float size = aB.x * (1.0 + 0.08 * sin(uT * 0.6 + aA.w * 40.0)); vSize = size;
        #ifdef FREE
          vec3 c = uC + aA.xyz + vec3(sin(uT * 0.4 + aA.w * 20.0), cos(uT * 0.33 + aA.w * 9.0), 0.0) * 0.5;
          vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * size;
          vInfo = vec4(0.75 + 0.25 * aA.y / 4.0, 99.0, aA.w, aB.y);
        #else
          float r = aA.x, th = aA.y + uT * 5.2 / pow(max(r, 10.0), 0.72);
          vec3 c = uC + vec3(cos(th) * r, sin(th) * r, -46.0 + aA.z * 7.5 + aA.w * 3.0);
          vec4 mv = viewMatrix * vec4(c + vec3(position.xy * size, 0.0), 1.0);
          vInfo = vec4(aA.z / 8.0, r, aA.w, aB.y);
        #endif
        vP = c; vUv = position.xy; vDist = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec4 uFl[3]; uniform float uCloudLit, uT; uniform vec3 uGold, uC, uArm;
      varying vec2 vUv; varying vec4 vInfo; varying vec3 vP; varying float vDist, vSize;
      void main() {
        float d = length(vUv), n = vn2(vUv * 2.1 + vInfo.z * 37.0) * 0.65 + vn2(vUv * 5.3 - vInfo.z * 11.0) * 0.35;
        float a = 1.0 - smoothstep(0.25, 1.0, d + (n - 0.5) * 0.7);
        a *= 1.0 - smoothstep(0.82, 1.0, d);                                                         // the quad edge never shows
        #ifdef FREE
          a *= smoothstep(2.0, 9.0, vDist);
        #else
          vec3 fp = vP + vec3(vUv * vSize, 0.0);
          a *= smoothstep(11.6, 16.5, length(fp.xy - uC.xy) + (n - 0.5) * 3.0);                      // nothing hangs inside the eye
          a *= smoothstep(3.0, 16.0, length(fp - cameraPosition));                                   // and nothing is sliced by the lens
        #endif
        if (a < 0.01) discard;
        float lit = clamp(0.5 + 0.6 * dot(vUv, vec2(-0.5, 0.85)) + (n - 0.5) * 0.8, 0.0, 1.0);
        float depth = vInfo.x, bnd = 1.0, gr = 0.0, isCore = step(1.5, vInfo.w), vary = vInfo.w - 2.0 * isCore;
        #ifndef FREE
          // spiral rain bands, the same on every layer: a lit crest and a dark trough winding in to the eye (self-similar, so they read at any range)
          vec2 hd = fp.xy - uC.xy; float hr = max(length(hd), 1.0), ha = atan(hd.y, hd.x + (abs(hd.x) < 1e-4 ? 1e-4 : 0.0));
          float ph = uArm.z * ha + uArm.y * log(hr) - uT * 0.42 + uArm.x + (n - 0.5) * 0.8;
          float bs = max(isCore, 1.0 - smoothstep(40.0, 70.0, hr));                                   // the core, and the wound-up inner ends of the arms; further out the real arms and their gaps do this
          bnd = mix(1.0, smoothstep(-0.5, 0.45, sin(ph)), bs);
          a *= mix(1.0, mix(mix(0.5, 0.04, isCore), 1.0, smoothstep(-0.9, -0.35, sin(ph))), bs * smoothstep(0.05, 0.4, depth));   // the troughs open onto the layers below
          if (a < 0.01) discard;
          gr = exp(-max(hr - 10.0, 0.0) / 24.0);
        #endif
        vec3 dark = mix(vec3(0.02, 0.03, 0.07), vec3(0.2, 0.25, 0.37), depth), bright = mix(vec3(0.2, 0.26, 0.4), vec3(0.98, 0.97, 0.95), depth);
        vec3 col = mix(dark, bright, smoothstep(0.2, 0.95, lit)) * (0.85 + 0.3 * vary) * uCloudLit * mix(0.2, 1.18, bnd);
        col += uGold * min(uEye, 1.3) * 0.62 * gr * (1.3 - depth) * (0.3 + 0.7 * lit) * mix(0.2, 1.0, bnd);   // the eye's gold on the inner bowl
        for (int i = 0; i < 3; i++) { vec2 q = vP.xy - uFl[i].xy; col += uFlashCol * uFl[i].z * exp(-dot(q, q) / (uFl[i].w * uFl[i].w)) * (0.25 + 1.0 * n) * mix(1.25, 0.6, depth) * mix(0.12, 1.0, bnd); }   // lightning inside the cloud: it lights the crests and leaves the troughs dark
        a *= 0.9;
        float f = 1.0 - exp(-uFogDen * uFogDen * vDist * vDist);
        gl_FragColor = vec4(mix(col, uFogCol, f) * a, a);
      }`,
  });
}

function makeHurricane(rng, SH, V, detail) {
  const N = Math.round(2500 * detail), aA = new Float32Array(N * 4), aB = new Float32Array(N * 2), items = [];
  const arms = V.arms, pitch = rng.range(1.2, 1.8), a0 = rng() * TAU;   // trailing arms: the faster inner turn only winds them further, it can never unwind them into straight spokes
  for (let i = 0; i < N; i++) {
    let layer = Math.min(8, Math.floor(rng() * 9)); const spill = layer >= 7;
    let r, th, core = 2;
    const kind = rng();
    if (kind < 0.14) { r = 11.5 + 9 * rng(); th = rng() * TAU; }                                     // the eyewall
    else if (kind < 0.24) { r = 18 + 26 * Math.pow(rng(), 1.3); th = rng() * TAU; }                  // central dense overcast
    else { core = 0; r = 16 + (spill ? 96 : 88) * Math.pow(rng(), 0.8); th = a0 + Math.floor(rng() * arms) * TAU / arms - pitch * Math.log(r / 12) + rng.gauss() * 0.08 * (1 + 14 / r); }
    // the stadium: the cloud tops step down towards the eye, so the dive is into a terraced bowl and not at a flat face
    layer = Math.min(layer, Math.floor(4.6 + (r - 11.5) / 7 + rng() * 1.2));
    const size = Math.min((3.4 + r * 0.085) * rng.range(0.8, 1.3), (r - 7.5) / 0.72);
    items.push([r, th, layer, rng(), Math.min(size, spill ? Math.max(4, 117 - r) : Math.max(4, 110 - r)), rng() + core]);
  }
  items.sort((p, q) => (p[2] * 7.5 + p[3] * 3) - (q[2] * 7.5 + q[3] * 3));                           // back to front
  items.forEach((p, i) => { aA.set([p[0], p[1], p[2], p[3]], i * 4); aB.set([p[4], p[5]], i * 2); });
  const U = { uT: { value: 4 + rng() * 10 }, uC: { value: HC.clone() }, uFl: { value: [new THREE.Vector4(0, 0, 0, 30), new THREE.Vector4(0, 0, 0, 30), new THREE.Vector4(0, 0, 0, 30)] },
    uCloudLit: { value: V.cloudLit }, uGold: { value: new THREE.Color(1.5, 1.12, 0.6) }, uArm: { value: new THREE.Vector3(rng() * TAU, 12, arms) },
    uTb: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(2, 0, 0, 0), new THREE.Vector4(4, 0, 0, 0)] }, uViolet: { value: lin(PAL[5]) }, uTun: { value: V.look === 'night' ? 0.42 : 1 } };
  const puffs = new THREE.Mesh(instQuads(N, { aA, aB }), makePuffMaterial(SH, U, false)); puffs.frustumCulled = false; puffs.renderOrder = 1;   // before the tornado's funnel, which stands in front of it when seen through the window
  puffs.name = 'hurricane';
  // backing disc and the eyewall tunnel
  const back = new THREE.Mesh(new THREE.CircleGeometry(113, 64), new THREE.ShaderMaterial({
    uniforms: { ...SH, ...U },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uCloudLit; varying vec3 vW;
      void main() { vec2 d = vW.xy - vec2(0.0, 120.0); vec3 c = (vec3(0.035, 0.05, 0.085) + 0.05 * hurrFlat(d)) * uCloudLit + vec3(1.0, 0.75, 0.42) * uEye * 0.6 * exp(-length(d) / 10.0);
        gl_FragColor = vec4(applyFog(c, length(cameraPosition - vW)), 1.0); }`,
  }));
  back.position.set(HC.x, HC.y, HC.z - 49.6);
  const tg = new THREE.CylinderGeometry(10.2, 11.5, 50, 40, 8, true); tg.rotateX(Math.PI / 2);
  const tunnel = new THREE.Mesh(tg, new THREE.ShaderMaterial({
    uniforms: { ...SH, ...U }, side: THREE.BackSide,
    vertexShader: `varying vec3 vL; varying vec3 vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uT, uCloudLit, uTun; uniform vec4 uTb[3]; uniform vec3 uGold, uViolet; varying vec3 vL; varying vec3 vW;
      float adiff(float a, float b) { float d = a - b; return d - 6.28318 * floor(d / 6.28318 + 0.5); }
      void main() {
        float z = vL.z, ang = atan(vL.y, vL.x + (abs(vL.x) < 1e-4 ? 1e-4 : 0.0)), a = ang + z * 0.07 + uT * 0.25;
        float k = clamp((z + 25.0) / 50.0, 0.0, 1.0);                                                // 0 at the portal, 1 at the mouth
        vec3 q = vec3(cos(a) * 2.2, sin(a) * 2.2, z * 0.11 - uT * 0.3);
        float n = vn3(q) * 0.55 + vn3(q * 2.7 + 3.1) * 0.3 + vn3(q * 6.9 + 1.7) * 0.15;
        float spiral = 0.5 + 0.5 * sin(ang * 3.0 + z * 0.35 - uT * 0.9 + (n - 0.5) * 5.0);
        float rib = smoothstep(0.25, 0.8, spiral);                                                  // three cloud bands winding down the wall
        vec3 gold = uGold * (0.03 + 0.9 * n * n * n) * (0.22 + 0.78 * rib) * (0.35 + 0.65 * min(uEye, 1.2)) * mix(2.2, 0.2, k);
        vec3 shade = mix(vec3(0.10, 0.085, 0.07), vec3(0.07, 0.066, 0.115), k) * (0.25 + 0.75 * n) * (0.4 + 0.6 * rib) * max(uCloudLit, 0.45);
        vec3 c = gold + shade;
        c += uGold * 0.5 * exp(-(z + 25.0) / 4.0) * min(uEye, 1.2);
        c *= uTun;                                                                                  // the night look's exposure and bloom are higher: keep the wall below the portal ring                                  // the lit rim where the wall meets the portal
        vec3 lip = vec3(0.74, 0.77, 0.83) * uCloudLit * (0.55 + 0.45 * n) + uGold * min(uEye, 1.3) * 0.42 * (0.45 + 0.55 * n);
        c = mix(c, lip, smoothstep(17.5, 25.0, z + (n - 0.5) * 7.0));                                  // the mouth feathers into the eyewall cloud, no hard rim
        float px = length(fwidth(vL.xy)) / max(length(vL.xy), 1.0) * 10.8, bsum = 0.0;              // one pixel, in the bolts' own units (taken before the loop)
        for (int i = 0; i < 3; i++) {                                                               // violet lightning running along the wall
          float sd = uTb[i].z, zz = z + 25.0;
          float wob = (vn2(vec2(zz * 0.21, sd)) - 0.5) * 1.5 + (vn2(vec2(zz * 0.9, sd + 7.0)) - 0.5) * 0.36 + (vn2(vec2(zz * 2.7, sd + 3.0)) - 0.5) * 0.1;
          float d0 = abs(adiff(ang, uTb[i].x + wob)) * 10.8;
          float fork = smoothstep(0.0, 9.0, zz - uTb[i].w) * 0.55 + (vn2(vec2(zz * 1.3, sd + 19.0)) - 0.5) * 0.2;
          float d1 = abs(adiff(ang, uTb[i].x + wob + fork * (fract(sd * 3.7) > 0.5 ? 1.0 : -1.0))) * 10.8 + 30.0 * (1.0 - step(uTb[i].w, zz));
          float bolt = (1.0 - smoothstep(max(0.1, 2.0 * px), max(0.34, 4.5 * px), d0)) * 5.0 + exp(-d0 * 2.2) * 0.5 + exp(-d0 * 0.6) * 0.1 + (1.0 - smoothstep(max(0.07, 1.5 * px), max(0.24, 3.5 * px), d1)) * 3.0 + exp(-d1 * 2.6) * 0.3;
          bsum += uTb[i].y * (bolt * smoothstep(0.0, 4.0, zz) + 0.06 * (0.3 + 0.7 * n));
        }
        c += uViolet * min(bsum, 2.6);
        gl_FragColor = vec4(applyFog(c, length(cameraPosition - vW)), 1.0);
      }`,
  }));
  tunnel.position.set(HC.x, HC.y, HC.z - 25);
  const group = new THREE.Group(); group.add(back, tunnel, puffs);
  return { object: group, U };
}

// a small pale rainbow standing in its trough of mist by the left wall (a moonbow at night); the mist wakes with the front
function makeRainbow(SH, V) {
  const U = { ...SH, uClock: { value: 0 }, uGain: { value: V.look === 'night' ? 0.3 : V.look === 'afternoon' ? 0.42 : 0.34 }, uPale: { value: V.look === 'night' ? 0.55 : 0.12 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uClock, uGain, uPale; varying vec2 vP; varying vec3 vW;
      vec3 spec(float t) { return vec3(smoothstep(0.38, 0.8, t) + 0.45 * (1.0 - smoothstep(0.0, 0.22, t)), clamp(1.0 - abs(t - 0.52) * 2.7, 0.0, 1.0), 1.0 - smoothstep(0.12, 0.6, t)); }
      void main() {
        vec2 q = vec2(vP.x, vP.y + 6.0);                          // the arc's centre is on the floor
        float r = length(q), aa = fwidth(r) * 1.5 + 0.02;
        float t = (r - 8.3) / 1.7, t2 = (6.9 - r) / 0.8;
        float arc = smoothstep(0.0, 0.16 + aa, t) * (1.0 - smoothstep(0.84 - aa, 1.0, t));
        float inner = smoothstep(0.0, 0.25, t2) * (1.0 - smoothstep(0.75, 1.0, t2)) * 0.22;
        float mist = 0.55 + 0.45 * vn2(vec2(q.x * 0.45 + 3.0, q.y * 0.35 - uClock * 0.5)) * (0.7 + 0.3 * vn2(vec2(q.x * 1.7, q.y * 1.3 - uClock * 1.1)));
        vec3 c = mix(spec(clamp(t, 0.0, 1.0)), vec3(0.8, 0.86, 1.0), uPale) * arc + mix(spec(clamp(1.0 - t2, 0.0, 1.0)), vec3(0.8, 0.86, 1.0), 0.4) * inner;
        c += vec3(0.5, 0.56, 0.66) * 0.1 * (1.0 - smoothstep(0.0, 3.2, q.y)) * (1.0 - smoothstep(8.6, 10.4, abs(q.x))) * mist;      // the mist rising from the trough
        float foot = smoothstep(0.1, 2.4, q.y);
        float d = length(cameraPosition - vW), f = exp(-uFogDen * uFogDen * d * d);
        gl_FragColor = vec4(c * uGain * mist * foot * f * smoothstep(4.0, 14.0, d) * (1.0 + 0.6 * uFlash.w * 0.2), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(22, 12), mat); mesh.position.set(V.rainbow.x, 6, V.rainbow.z); mesh.renderOrder = 5; mesh.name = 'rainbow';
  return { object: mesh, U };
}

function makeCumulus(rng, SH, hurU) {
  const N = 70, aA = new Float32Array(N * 4), aB = new Float32Array(N * 2), items = [];
  for (let i = 0; i < N; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 5.5, y = rng.range(0, 1); items.push([Math.cos(a) * r, y * y * 4.2 * (1 - r / 8), Math.sin(a) * r * 0.8, rng(), rng.range(1.8, 3.4) * (1 - 0.3 * y), rng()]); }
  items.forEach((p, i) => { aA.set(p.slice(0, 4), i * 4); aB.set(p.slice(4), i * 2); });
  const U = { uT: { value: 0 }, uC: { value: new THREE.Vector3(8, 22, 200) }, uFl: hurU.uFl, uCloudLit: { value: Math.max(hurU.uCloudLit.value, 0.45) * 1.05 }, uGold: { value: new THREE.Color(0, 0, 0) }, uArm: { value: new THREE.Vector3(0, 13, 2) } };
  const cloud = new THREE.Mesh(instQuads(N, { aA, aB }), makePuffMaterial(SH, U, true)); cloud.frustumCulled = false; cloud.renderOrder = 5;
  // its private rain: streaks falling onto a 4 m circle, and rings where they land
  const NR = 260, aP = new Float32Array(NR * 4);
  for (let i = 0; i < NR; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 2.0; aP.set([Math.cos(a) * r, rng(), Math.sin(a) * r, rng()], i * 4); }
  const rmat = new THREE.ShaderMaterial({
    uniforms: { ...SH, ...U }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aP; uniform float uT; uniform vec3 uC; varying vec2 vUv; varying float vK;
      void main() {
        float h = uC.y - 0.5, k = fract(aP.y - uT * (0.75 + 0.3 * aP.w));
        vec3 c = vec3(uC.x + aP.x, k * h, uC.z + aP.z); vK = k;
        vec4 mv = viewMatrix * vec4(c, 1.0); vec3 upv = (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
        mv.xyz += vec3(position.x * max(0.045, -mv.z * 0.0016), 0.0, 0.0) + upv * position.y * 0.8;
        vUv = position.xy; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      varying vec2 vUv; varying float vK;
      void main() { float a = (1.0 - abs(vUv.x)) * (1.0 - vUv.y * vUv.y) * smoothstep(0.0, 0.08, vK); gl_FragColor = vec4((max(uSkyCol, vec3(0.3, 0.36, 0.48)) * 0.95 + uAmbCol * 0.5) * a * (1.0 - smoothstep(0.9, 1.0, vK)), 1.0); }`,
  });
  const rain = new THREE.Mesh(instQuads(NR, { aP }), rmat); rain.frustumCulled = false; rain.renderOrder = 4;
  const NS = 46, sP = new Float32Array(NS * 4);
  for (let i = 0; i < NS; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 2.2; sP.set([Math.cos(a) * r, Math.sin(a) * r, rng(), rng.range(0.35, 0.8)], i * 4); }
  const smat = new THREE.ShaderMaterial({
    uniforms: { ...SH, ...U }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aP; uniform float uT; uniform vec3 uC; varying vec2 vUv; varying float vPh;
      void main() {
        vPh = fract(aP.z + uT * (0.9 + 0.7 * fract(aP.z * 7.13)));
        vec3 c = vec3(uC.x + aP.x, 0.06, uC.z + aP.y) + position * aP.w * (0.2 + 1.5 * vPh);
        vUv = position.xz; gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      varying vec2 vUv; varying float vPh;
      void main() {
        float r = length(vUv), ring = band(r - 0.8, 0.1, 0.08) + 0.5 * band(r - 0.42, 0.07, 0.06) * step(0.3, vPh);
        gl_FragColor = vec4((max(uSkyCol, vec3(0.3, 0.36, 0.48)) * 1.1 + uAmbCol * 0.5) * ring * (1.0 - vPh) * (1.0 - vPh), 1.0);
      }`,
  });
  const rings = new THREE.Mesh(instQuads(NS, { aP: sP }, true), smat); rings.frustumCulled = false; rings.renderOrder = 2;
  const group = new THREE.Group(); group.add(rings, rain, cloud);
  return { object: group, U };
}

// ---------------------------------------------------------------------------------------------------------
// light shafts: one sheared box per skylight, shaded by the length of the view ray inside it
// ---------------------------------------------------------------------------------------------------------
const SHAFTS = [];
for (let k = 0; k < 13; k++) SHAFTS.push([0, 340 - 20 * k, 17, 3, 40, 0]);
SHAFTS.push([0, 0, 15, 15, 220, 1]);
for (const z of [-130, -180, -230]) SHAFTS.push([0, z, 92, 7, 240, 0]);
function makeShafts(SH, V) {
  const N = SHAFTS.length, aC = new Float32Array(N * 4), aD = new Float32Array(N * 2);
  SHAFTS.forEach((s, i) => { aC.set([s[0], s[1], s[2], s[3]], i * 4); aD.set([s[4], s[5]], i * 2); });
  const g = new THREE.InstancedBufferGeometry(), b = new THREE.BoxGeometry(2, 2, 2);
  g.index = b.index; g.setAttribute('position', b.attributes.position);
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 2));
  g.instanceCount = N; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const U = { ...SH, uGain: { value: V.shaftGain }, uTime: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: /* glsl */`
      ${GLSL_LIGHT}
      attribute vec4 aC; attribute vec2 aD;
      varying vec3 vW; varying vec4 vC; varying vec2 vD;
      void main() {
        float H = aD.x, y = (position.y * 0.5 + 0.5) * H; vec2 k = uSunDir.xz / max(uSunDir.y, 0.05);
        vec3 w = vec3(aC.x + position.x * aC.z, y, aC.y + position.z * aC.w); w.xz -= k * (H - y);
        vW = w; vC = aC; vD = aD; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform float uGain, uTime;
      varying vec3 vW; varying vec4 vC; varying vec2 vD;
      void main() {
        float H = vD.x; vec2 k = uSunDir.xz / max(uSunDir.y, 0.05);
        vec3 ro = cameraPosition, rd = normalize(vW - ro);
        vec3 o = vec3(ro.x + k.x * (H - ro.y), ro.y, ro.z + k.y * (H - ro.y)), d = vec3(rd.x - k.x * rd.y, rd.y, rd.z - k.y * rd.y);
        vec3 c = vec3(vC.x, H * 0.5, vC.y), hs = vec3(vC.z, H * 0.5, vC.w);
        vec3 inv = vec3(safeDiv(1.0, d.x), safeDiv(1.0, d.y), safeDiv(1.0, d.z));
        vec3 ta = (c - hs - o) * inv, tb = (c + hs - o) * inv, tmn = min(ta, tb), tmx = max(ta, tb);
        float t0 = max(max(max(tmn.x, tmn.y), tmn.z), 0.0), t1 = min(min(tmx.x, tmx.y), tmx.z);
        float len = max(t1 - t0, 0.0);
        vec3 mid = o + d * (t0 + t1) * 0.5; vec2 e = hs.xz - abs(mid.xz - c.xz);
        float soft = vD.y > 0.5 ? 1.0 - smoothstep(9.0, 15.0, length(mid.xz - c.xz)) : smoothstep(0.0, 1.3, min(e.x, e.y) + 0.2);
        vec3 mw = ro + rd * (t0 + t1) * 0.5;
        float dust = 0.72 + 0.56 * vn3(mw * 0.16 + vec3(uTime * 0.12, -uTime * 0.22, uTime * 0.08));
        float a = (1.0 - exp(-len * (vD.y > 0.5 ? 0.03 : 0.05) * 40.0 / H)) * soft * dust * mix(0.55, 1.0, clamp(mw.y / H, 0.0, 1.0));
        a *= smoothstep(-352.0, -338.0, mw.z);                       // a low sun's shaft must not cut through the hurricane's eye tunnel
        float dist = length(mw - ro);
        gl_FragColor = vec4(uSunCol * uGain * a / (1.0 + dist / 70.0), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.name = 'shafts';
  return { object: mesh, U };
}

// dust motes inside the shafts: still sparks ahead of the thaw front, drifting behind it
function makeMotes(rng, SH, detail) {
  const N = Math.round(3600 * detail), aP = new Float32Array(N * 4), aQ = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const pick = rng(), s = pick < 0.62 ? SHAFTS[Math.floor(rng() * 13)] : pick < 0.8 ? SHAFTS[13] : SHAFTS[14 + Math.floor(rng() * 3)];
    let x, z; if (s[5]) { const a = rng() * TAU, r = Math.sqrt(rng()) * 14; x = Math.cos(a) * r; z = Math.sin(a) * r; } else { x = rng.range(-s[2], s[2]) * (s[2] > 50 ? 0.5 : 1); z = s[1] + rng.range(-s[3], s[3]); }
    const y = s[4] > 100 ? rng.range(1, s[4] * (s[5] ? 0.9 : 0.75)) : rng.range(0.5, 38);
    const wakeS = s[1] > 86 ? 335 - s[1] : s[5] ? 235 : 470;
    aP.set([x, y, z, s[4]], i * 4); aQ.set([rng() * TAU, rng(), wakeS, s[4] > 100 ? rng.range(0.14, 0.3) : rng.range(0.05, 0.11)], i * 4);
  }
  const U = { ...SH, uFront: { value: 0 }, uTime: { value: 0 }, uPix: { value: 0.0016 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      ${GLSL_LIGHT}
      attribute vec4 aP, aQ; uniform float uFront, uTime, uPix; varying vec2 vUv; varying float vB;
      void main() {
        vec2 k = uSunDir.xz / max(uSunDir.y, 0.05);
        vec3 c = aP.xyz; c.xz -= k * (aP.w - c.y);
        float wake = 0.2 + 0.8 * smoothstep(0.0, 26.0, uFront - aQ.z), ph = aQ.x, t = uTime;
        c += wake * vec3(sin(t * 0.31 + ph) + 0.5 * sin(t * 0.83 + ph * 3.0), 0.8 * sin(t * 0.23 + ph * 2.0) + 0.4 * cos(t * 0.7 + ph), cos(t * 0.27 + ph * 1.3) + 0.5 * sin(t * 0.9 + ph)) * (0.5 + aQ.y) * (aP.w > 100.0 ? 2.4 : 0.9);
        vec4 mv = viewMatrix * vec4(c, 1.0);
        float sz = max(aQ.w, -mv.z * uPix); mv.xy += position.xy * sz;
        float tw = 0.75 + 0.25 * sin(t * (0.4 + 2.2 * wake) * (0.6 + aQ.y) + ph * 9.0);
        vB = sunVis(c) * tw * min(1.0, aQ.w / sz + 0.25) * exp(-uFogDen * uFogDen * mv.z * mv.z) * smoothstep(3.0, 10.0, -mv.z);
        vUv = position.xy; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol; varying vec2 vUv; varying float vB;
      void main() { float r2 = dot(vUv, vUv); if (r2 > 1.0) discard; float a = (1.0 - r2); gl_FragColor = vec4(uSunCol * (0.28 * a * a * vB) + vec3(1.0, 0.9, 0.7) * 0.02 * a * vB, 1.0); }`,
  });
  const mesh = new THREE.Mesh(instQuads(N, { aP, aQ }), mat); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'motes';
  return { object: mesh, U };
}

// ---------------------------------------------------------------------------------------------------------
// the cornice tram: a closed monorail down both sides of the enfilade and round the rotunda
// ---------------------------------------------------------------------------------------------------------
const RAIL_Y = 31.5;
function makeTramCurve() {
  const pts = [];
  for (let z = 330; z >= 100; z -= 23) pts.push(new THREE.Vector3(-26, RAIL_Y, z));
  const a0 = Math.atan2(-26, 80);
  for (let i = 0; i <= 32; i++) { const a = a0 - (TAU + 2 * a0) * (i / 32); pts.push(new THREE.Vector3(Math.sin(a) * 85.5, RAIL_Y, Math.cos(a) * 85.5)); }
  for (let z = 100; z <= 330; z += 23) pts.push(new THREE.Vector3(26, RAIL_Y, z));
  for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; pts.push(new THREE.Vector3(Math.cos(a) * 26, RAIL_Y, 336 + Math.sin(a) * 25)); }
  const c = new THREE.CatmullRomCurve3(pts, true, 'centripetal'); c.arcLengthDivisions = 800; return c;
}
function buildRail(curve) {
  const bag = makeBag();
  bag.add(new THREE.TubeGeometry(curve, 420, 0.2, 6, true), 2);
  const L = curve.getLength(), p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let d = 4; d < L; d += 11.5) {
    curve.getPointAt(d / L, p); curve.getTangentAt(d / L, t);
    const nx = t.z, nz = -t.x, wall = p.z > 86 ? 30 - Math.abs(p.x) : 90 - Math.hypot(p.x, p.z);          // outward normal and reach to the wall
    const sgn = (p.z > 86 ? Math.sign(p.x) * nx : (p.x * nx + p.z * nz)) > 0 ? 1 : -1, len = Math.min(Math.max(wall, 0.5), 6);
    if (p.z > 333) continue;
    bag.box(0.16, 1.0, 0.16, p.x, RAIL_Y + 0.5, p.z, 2);
    bag.add(new THREE.BoxGeometry(len, 0.16, 0.16), 2, TRS(p.x + nx * sgn * len / 2, RAIL_Y + 1.0, p.z + nz * sgn * len / 2, 0, Math.atan2(-nz * sgn, nx * sgn), 0));
  }
  return bag.build();
}
function buildTramCar(V) {
  const bag = makeBag(), cream = new THREE.Color(0.62, 0.58, 0.5), red = new THREE.Color(0.36, 0.05, 0.05), lamp = V.lamp;
  bag.box(2.5, 1.0, 9.0, 0, -2.9, 0, 2);                              // lower body (brass)
  bag.box(2.5, 0.5, 9.0, 0, -1.05, 0, 3, red);
  bag.box(2.3, 1.15, 8.7, 0, -1.85, 0, 4, lamp);                      // lit window band
  for (let i = -3; i <= 3; i++) bag.box(2.56, 1.2, 0.22, 0, -1.85, i * 1.35, 2);
  for (const sz of [-1, 1]) bag.box(2.56, 1.2, 0.5, 0, -1.85, 4.35 * sz, 2);
  const roof = new THREE.CylinderGeometry(1.3, 1.3, 9.2, 12, 1, false, 0, Math.PI); roof.rotateX(Math.PI / 2); roof.rotateZ(Math.PI / 2);
  bag.add(roof, 3, TRS(0, -0.82, 0, 0, 0, 0, 1, 0.42, 1), cream);
  bag.box(0.2, 1.0, 0.2, 0, -0.4, 2.6, 2); bag.box(0.2, 1.0, 0.2, 0, -0.4, -2.6, 2);
  bag.box(0.5, 0.4, 1.0, 0, 0.1, 2.6, 2); bag.box(0.5, 0.4, 1.0, 0, 0.1, -2.6, 2);
  bag.add(new THREE.SphereGeometry(0.28, 8, 6), 4, TRS(0, -2.6, -4.55), lamp.clone().multiplyScalar(1.6));
  bag.add(new THREE.SphereGeometry(0.2, 8, 6), 4, TRS(0, -2.6, 4.55), new THREE.Color(1.6, 0.15, 0.1));
  bag.box(2.6, 0.18, 9.1, 0, -3.45, 0, 3, new THREE.Color(0.05, 0.05, 0.05));
  return bag.build();
}

// crocuses pushing through a square of snow (opened by the thaw front)
function buildCrocus(rng, V) {
  const snow = makeBag(), fl = makeBag(), c = V.crocus;
  const sg = new THREE.BoxGeometry(3.7, 0.5, 3.7, 6, 1, 6), pos = sg.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setY(i, 0.25 + 0.14 * Math.sin(pos.getX(i) * 2.1) * Math.cos(pos.getZ(i) * 1.7));
  sg.computeVertexNormals(); snow.add(sg, 3, TRS(c.x, 1.3, c.z), new THREE.Color(0.86, 0.9, 0.96));
  for (let i = 0; i < 14; i++) {
    const x = rng.range(-1.4, 1.4), z = rng.range(-1.4, 1.4), h = rng.range(0.7, 1.2), col = rng() < 0.7 ? new THREE.Color(0.36, 0.16, 0.7) : new THREE.Color(0.95, 0.7, 0.1);
    fl.cyl(0.04, 0.03, h, x, 0, z, 3, new THREE.Color(0.1, 0.3, 0.08), 5);
    const cup = new THREE.ConeGeometry(0.24, 0.6, 6, 1, true); cup.rotateX(Math.PI);
    fl.add(cup, 3, TRS(x, h + 0.25, z), col);
    fl.add(new THREE.SphereGeometry(0.06, 5, 4), 3, TRS(x, h + 0.3, z), new THREE.Color(1.0, 0.6, 0.05));
  }
  return { snow: snow.build(), flowers: fl.build() };
}

// ---------------------------------------------------------------------------------------------------------
// looks: three hours, chosen by seed unless the viewer asked for one
// ---------------------------------------------------------------------------------------------------------
function chooseLook(ctx) {
  const rng = ctx.rng.fork('look389'), vary = ctx.vary || {}, hour = vary.hour || 'any';
  const roll = rng.pick(['noon', 'noon', 'afternoon', 'night']);
  const look = hour === 'night' ? 'night' : hour === 'golden' || hour === 'dawn' ? 'afternoon' : hour === 'day' ? 'noon' : roll;
  const V = { look, rare: !!vary.rare, density: clamp(vary.density ?? 1, 0.7, 1.3) };
  V.shower = rng.pick(['rain', 'rain', 'rain', 'snow', 'hail']);
  V.gust = rng.pick(['leaves', 'leaves', 'leaves', 'blossom', 'dandelion']);
  V.boltKind = rng.pick(['bolt', 'bolt', 'bolt', 'elmo']);
  V.trams = V.rare || rng.chance(0.4) ? 2 : 1;
  V.arms = rng.pick([2, 2, 3]);
  const jx = rng.range(-0.06, 0.06);
  if (look === 'noon') Object.assign(V, {
    sunDir: new THREE.Vector3(-0.17 + jx, 0.866, 0.47).normalize(), sunCol: lin('#EEF4FF', 3.0), skyCol: lin('#DCE6EE'), skyGain: 1.9,
    amb: new THREE.Color(0.47, 0.52, 0.61), fog: lin('#E6E9EC', 0.8), fogDen: 0.0009, exposure: 1.0, cloudLit: 1.0, shaftGain: 0.085, eye: 1.0,
    lamp: new THREE.Color(2.4, 1.6, 0.75), hemi: 2.0, dir: 3.0, bloom: 0.3, heroKey: [1.3, 1.14, 0.9], heroAmb: [0.27, 0.31, 0.42], heroSky: '#EEF4FF',
    ground: '#7a7f88', jarGlow: 0, warm: 0, jarWash: 0, flashGain: 1, heroSelf: 0.1 });
  else if (look === 'afternoon') Object.assign(V, {
    sunDir: new THREE.Vector3(-0.2 + jx, 0.52, 0.83).normalize(), sunCol: lin('#FFAE5E', 3.6), skyCol: lin('#F6DDB4'), skyGain: 1.8,
    amb: new THREE.Color(0.46, 0.44, 0.47), fog: lin('#EADDC8', 0.75), fogDen: 0.001, exposure: 1.0, cloudLit: 0.92, shaftGain: 0.11, eye: 1.15,
    lamp: new THREE.Color(2.6, 1.7, 0.8), hemi: 1.7, dir: 3.2, bloom: 0.34, heroKey: [1.5, 1.0, 0.6], heroAmb: [0.30, 0.29, 0.36], heroSky: '#FFE2B8',
    ground: '#7f7a74', jarGlow: 0.15, warm: 0.05, jarWash: 0, flashGain: 1, heroSelf: 0.12 });
  else Object.assign(V, {
    // night: a cool, almost colourless moonlit room in which the exhibits are the warm lights (amber dust, jars, lamps; violet lightning)
    sunDir: new THREE.Vector3(-0.17 + jx, 0.866, 0.47).normalize(), sunCol: lin('#D2DCF4', 0.85), skyCol: lin('#2c3854'), skyGain: 0.4,
    amb: new THREE.Color(0.09, 0.10, 0.135), fog: lin('#0c0f16'), fogDen: 0.0013, exposure: 1.35, cloudLit: 0.3, shaftGain: 0.22, eye: 1.6,
    lamp: new THREE.Color(5.6, 3.1, 1.1), hemi: 0.55, dir: 0.8, bloom: 0.6, heroKey: [0.95, 0.62, 0.3], heroAmb: [0.075, 0.08, 0.11], heroSky: '#8090ba',
    ground: '#2a2c36', jarGlow: 1.8, warm: 0.55, jarWash: 0.55, flashGain: 1.6, heroSelf: 0.42,
    fillBase: 0.74, keyCol: lin('#D2DCF4', 0.21), goldSpill: 0.3, floorK: 0.8 });
  if (!V.keyCol) Object.assign(V, { fillBase: 0.84, keyCol: V.amb.clone().multiplyScalar(0.22), goldSpill: look === 'noon' ? 0.1 : 0.14, floorK: 1 });
  V.skyGlow = V.skyCol.clone().multiplyScalar(V.skyGain * 1.25);
  V.bolt = { x: -16, z: 140 };
  V.shelfRuns = [[176, 244], [103, 164]]; V.shelfY = [3.2, 7.4, 11.6, 15.8, 20.0];
  V.desk = { x: -19, z: 268 }; V.crocus = { x: 11.5, z: 222 };
  V.mini = { x: -20.5, z: 189 }; V.rainbow = { x: -17.5, z: 213 };
  V.edgeGlow = lin(PAL[3], look === 'night' ? 2.3 : 1.25);
  V.balloonAtHurricane = rng.chance(0.3);                             // cast change: the caretaker is dusting the hurricane today
  return V;
}

// ---------------------------------------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------------------------------------
export default {
  id: 'frozen-weather-museum',
  name: 'Museum of Frozen Weather',
  category: 'bizarre',
  weirdness: 0.85,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, detail = (ctx.quality && ctx.quality.detail) || 1;
    const V = chooseLook(ctx);
    const scene = new THREE.Scene();
    scene.background = V.fog.clone();
    scene.fog = new THREE.FogExp2(V.fog.clone(), V.fogDen);
    const hemi = new THREE.HemisphereLight(V.skyCol.clone().lerp(new THREE.Color(1, 1, 1), 0.3), new THREE.Color(V.ground), V.hemi);
    const sun = new THREE.DirectionalLight(V.sunCol.clone().multiplyScalar(1 / Math.max(V.sunCol.r, V.sunCol.g, V.sunCol.b)), V.dir);
    sun.position.copy(V.sunDir).multiplyScalar(300);
    scene.add(hemi, sun);

    // shared uniforms (the same objects in every material)
    const SH = {
      uSunDir: { value: V.sunDir }, uSunCol: { value: V.sunCol }, uSkyCol: { value: V.skyCol }, uSkyGain: { value: V.skyGain }, uAmbCol: { value: V.amb },
      uFogCol: { value: V.fog }, uFogDen: { value: V.fogDen }, uFlash: { value: new THREE.Vector4(V.bolt.x, 16, V.bolt.z, 0) }, uFlashCol: { value: lin(PAL[5], 1.0) },
      uMarble: { value: lin(PAL[0], 0.82) }, uBrassCol: { value: lin(PAL[3], 1.15) }, uHurT: { value: 0 }, uEye: { value: V.eye * 0.5 },
      uBoltPos: { value: new THREE.Vector3(V.bolt.x, 0, V.bolt.z) }, uBoltGrow: { value: 0 }, uGlowCol: { value: lin(PAL[5], 0.3) },
      uWarm: { value: new THREE.Vector4(0, 22, 0, V.warm) }, uWarmCol: { value: lin(PAL[6]) }, uJarWash: { value: V.jarWash }, uTime: { value: 0 },
      uKeyCol: { value: V.keyCol }, uGoldCol: { value: new THREE.Color(1.0, 0.72, 0.38) }, uFillBase: { value: V.fillBase }, uGoldSpill: { value: V.goldSpill }, uFloorK: { value: V.floorK },
    };

    // ---- path ----
    const hero = await buildHero(ctx, {
      palette: PAL, progress: 0, gust: 0, floor: true, floorRadius: 90, curb: false, room: { radius: 90, spring: 130, top: 220, oculus: 15 },
      lightDir: V.sunDir.toArray(), balloon: true, steps: Math.round(56 * (detail < 1 ? 0.75 : 1)),
      colors: { key: V.heroKey, amb: V.heroAmb, sky: V.heroSky, self: V.heroSelf, room: [V.amb.r / 0.47, V.amb.g / 0.52, V.amb.b / 0.61],
        ...(V.look === 'night' ? { oculus: V.skyGlow.clone().multiplyScalar(2).toArray() } : {}) },
      ...(V.balloonAtHurricane ? { balloonAt: [66, -308], balloonTether: 76, balloonScale: 1.8, balloonYaw: Math.PI / 2 } : {}),
    });
    scene.add(hero.object);
    await ctx.yield();
    const fly = hero.anchors.flyThrough;
    const pts = [[0, 8, 335], [0, 8, 318], [0.6, 8.4, 290], [1.2, 9.4, 250], [1.0, 10.2, 210], [0.5, 11.2, 170], [0, 12, 138]];
    for (let i = 0; i < 6; i++) pts.push([fly[i].x, fly[i].y, fly[i].z]);
    // leave the orbit early and swing onto the window's axis well before the wall, so the hurricane is framed by the opening
    pts.push([-52, 64, -22], [-36, 76, -40], [-16, 85.5, -54], [-4, 89.3, -66], [0, 90, -80], [0, 90, -99], [0, 92, -135], [0, 96.5, -172], [0, 109, -232], [0, 117.5, -282], [0, 120, -326], [0, 120, -362], [0, 120, -396]);
    const path = makePath(pts);
    const L = path.length, _pp = new THREE.Vector3();
    let sDoor = 245, sHall = 480, sOrbitEnd = 440;
    for (let d = 0, a = false, b = false; d < L; d += 2) {
      path.posAtDist(d, _pp);
      if (!a && _pp.z < 90) { sDoor = d; a = true; }
      if (a && !b && _pp.z < -91) { sHall = d; b = true; }
    }
    sOrbitEnd = sHall - 20;
    const flowTab = new Float32Array(Math.ceil(L / 4) + 2);          // leaves: distance flowed as a function of camera distance
    for (let i = 1; i < flowTab.length; i++) flowTab[i] = flowTab[i - 1] + 4 * 1.12 * smoothstep(30, 70, i * 4 - 2);
    const flowAt = (s) => { const f = clamp(s / 4, 0, flowTab.length - 1.001), i = Math.floor(f); return lerp(flowTab[i], flowTab[i + 1], f - i); };

    // ---- architecture and furniture ----
    const archMat = makeArchMaterial(SH);
    const arch = new THREE.Mesh(await buildArchitecture(V, ctx), archMat); arch.name = 'museum'; arch.frustumCulled = false; scene.add(arch);
    await ctx.yield();
    for (const g of await buildProps(rng.fork('props'), V, ctx)) { const props = new THREE.Mesh(g, archMat); props.name = 'furniture'; props.frustumCulled = false; scene.add(props); }
    await ctx.yield();
    const tramCurve = makeTramCurve(), tramL = tramCurve.getLength();
    const rail = new THREE.Mesh(buildRail(tramCurve), archMat); rail.frustumCulled = false; scene.add(rail);
    await ctx.yield();
    const carGeo = buildTramCar(V), cars = [];
    for (let t = 0; t < V.trams; t++) for (let c = 0; c < 3; c++) { const m = new THREE.Mesh(carGeo, archMat); m.frustumCulled = false; scene.add(m); cars.push({ mesh: m, off: t * tramL * 0.47 - c * 9.9, tram: t }); }
    await ctx.yield();
    const glassBag = makeBag();
    glassBag.box(9.6, 35.2, 9.6, V.bolt.x, 18.8, V.bolt.z, 7); glassBag.box(3.8, 2.6, 3.8, V.crocus.x, 2.3, V.crocus.z, 7); glassBag.box(5.8, 11.9, 5.8, V.mini.x, 7.3, V.mini.z, 7);
    const glass = new THREE.Mesh(glassBag.build(), makeArchMaterial(SH, true)); glass.renderOrder = 3; scene.add(glass);
    const croc = buildCrocus(rng.fork('crocus'), V);
    const snow = new THREE.Mesh(croc.snow, archMat); scene.add(snow);
    const flowers = new THREE.Mesh(croc.flowers, archMat); flowers.position.set(V.crocus.x, 1.25, V.crocus.z); scene.add(flowers);
    await ctx.yield();

    // ---- exhibits ----
    const shower = makeShower(rng.fork('shower'), SH, V, detail); scene.add(shower.object);
    await ctx.yield();
    const gust = makeGust(rng.fork('gust'), SH, V, detail); scene.add(gust.object);
    await ctx.yield();
    const mini = makeShower(rng.fork('mini'), SH, V, detail, { kind: V.shower === 'snow' ? 'hail' : 'snow', count: 700, min: [V.mini.x - 2.3, 1.4, V.mini.z - 2.3], size: [4.6, 11.4, 4.6], self: V.look === 'night' ? 0.55 : 0.1 });
    mini.object.name = 'snow-case'; scene.add(mini.object);
    await ctx.yield();
    const rainbow = makeRainbow(SH, V); scene.add(rainbow.object);
    await ctx.yield();
    // a second, thinner stream: what the hurricane draws out of the rotunda, through the window and down the hall to its eye
    const stream = makeGust(rng.fork('stream'), SH, V, detail * V.density, { count: 1500, wide: 0.72,
      ctrl: [[-40, 68, -26], [-28, 78, -47], [-13, 85, -66], [-3, 88, -96], [6, 91, -126], [10, 96, -160], [3, 103, -200], [-8, 110, -240], [-12, 116, -280], [-4, 106, -308],
        // ... and winds once and a quarter round the axis, with the storm's turn, down into the eye
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = -1.9 + i * 1.0, r = 15.5 - 1.25 * i; return [Math.cos(a) * r, 120 + Math.sin(a) * r, -318 - i * 9.4]; })] });
    stream.object.name = 'leaf-stream'; scene.add(stream.object);
    await ctx.yield();
    const bolt = makeBolt(rng.fork('bolt'), SH, V); scene.add(bolt.object);
    await ctx.yield();
    const jars = makeJars(rng.fork('jars'), SH, V); scene.add(jars.object);
    await ctx.yield();
    const hur = makeHurricane(rng.fork('hurricane'), SH, V, detail); scene.add(hur.object);
    const cumulus = V.rare ? makeCumulus(rng.fork('cumulus'), SH, hur.U) : null; if (cumulus) scene.add(cumulus.object);
    await ctx.yield();
    const shafts = makeShafts(SH, V); scene.add(shafts.object);
    await ctx.yield();
    const motes = makeMotes(rng.fork('motes'), SH, detail * V.density); scene.add(motes.object);

    // ---- kit effects: glows, steam, floor fog spilling from the hurricane's frame ----
    await ctx.yield();
    const fxTime = { value: 0 }, fxSet = FX.fxGroup(); scene.add(fxSet.object);
    const glows = fxSet.add(FX.makeGlows({ positions: [[V.bolt.x, 17, V.bolt.z], [0, 9, 0]], colors: [PAL[5], '#8a4a1a'], sizes: [1, 0.001], size: 16, intensity: 1.6, time: fxTime, rng: rng.fork('glow') }));
    await ctx.yield();
    fxSet.add(FX.makeSmokeColumn({ position: [V.desk.x + 1.1, 2.6, V.desk.z + 0.3], height: 3.4, radius: [0.08, 0.7], size: [0.35, 1.3], count: 18, color: '#d6dbe2', colorTop: '#f4f6f8', shadowColor: '#9aa2ac',
      ambient: V.look === 'night' ? '#30384a' : '#a8aeb6', opacity: 0.32, wind: [0.12, 0, 0.05], bend: 0.3, time: fxTime, rng: rng.fork('steam') }));
    await ctx.yield();
    fxSet.add(FX.makeMist({ count: Math.round(60 * detail), area: [230, 7, 120], center: [0, 3.5, -292], size: [20, 44], color: V.look === 'night' ? '#262a36' : '#e4e8ee', opacity: 0.17, drift: [0.25, 0, 1.5], time: fxTime, rng: rng.fork('mist') }));
    await ctx.yield();

    // ---- sparrows (never frozen) and two swallows ----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    const SP = { species: 'starlings', form: 'loose', lod: 'high', size: 3.4, speed: 9, flap: 7, glide: 0.25, body: '#8a6a48', belly: '#d9cfbc', wingC: '#5e4530', trail: '#7a5c3e', tip: '#2a2018', head: '#6b4a30', beak: '#3a3020',
      spread: [7, 3, 7], wander: [2.5, 1.6, 2.5, 0.8] };
    const nb = (n) => Math.max(2, Math.round(n * V.density * (V.look === 'night' ? 0.7 : 1)));
    // (the clear air round the line, 14 Oct: five of these flocks dealt a bird inside two metres of the flown line, down to 0.15 m at the
    // window ring. Each of the five now hands the kit its own clearing, per bird, so the ring or the escort itself stays where it was laid
    // and only the few birds that come too near are held off by their own offsets. The figure each one had is at its line.)
    // the escort: its birds are MEANT to fly beside the eye, so its clearing is bought with a steadier wander rather than with distance
    // (the kit clears a member's whole roam, not just its dealt place, so a wandering escort would be thrown six metres off and out of the frame)
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp0'), count: 5, spread: [3.5, 2, 4], wander: [0.8, 0.5, 0.8, 0.8], along: { path, side: 2.2, up: 1.0, lead: 13, from: -0.05, to: 0.1, drift: 3 },
      keepClear: { path, dist: 2, each: true } }));   // 1.48 m at the start of the flight
    await ctx.yield();
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp1'), count: nb(8), center: [0, 17, 300], radius: 24, height: 9, wobble: 0.5, keepClear: { path, dist: 2, each: true } }));   // 0.31 m early on
    await ctx.yield();
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp2'), count: nb(8), center: [V.bolt.x + 7, 27, V.bolt.z + 6], radius: 15, height: 6, wobble: 0.5, speed: 11 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp3'), count: nb(10), center: [0, 50, 0], radius: 58, height: 22, wobble: 0.25, speed: 16, spread: [5, 6, 14] }));
    await ctx.yield();
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp4'), count: nb(14), size: 5, center: [4, 96, -150], radius: 44, height: 16, wobble: 0.4, speed: 13, spread: [12, 8, 16], keepClear: { path, dist: 2, each: true } }));   // 0.77 m
    await ctx.yield();
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp6'), count: nb(10), size: 4.2, center: [0, 120, -326], radius: 22, height: 14, wobble: 0.5, speed: 15, spread: [7, 7, 7], keepClear: { path, dist: 2, each: true } }));   // circling the eye, across the dive; 0.75 m
    await ctx.yield();
    fauna.add(F.makeFlock({ ...SP, rng: rng.fork('sp5'), count: nb(9), size: 3.8, center: [0, 93, -104], radius: 19, height: 9, wobble: 0.45, speed: 12, spread: [6, 5, 6], keepClear: { path, dist: 2, each: true } }));   // in and out of the window; 0.15 m, the nearest in the world
    await ctx.yield();
    fauna.add(F.makeFlock({ species: 'swifts', rng: rng.fork('swallows'), count: 2, size: 2.6, center: [0, 116, 0], radius: 72, height: 6, wobble: 0.2, spread: [4, 2, 8] }));
    await ctx.yield();
    await ctx.yield();

    // ---- per-frame state ----
    const S = (a, b, x) => smoothstep(a, b, x);
    const pulse = (tt) => S(0, 0.1, tt) * Math.exp(-tt / 0.28);
    const elmo = V.boltKind === 'elmo';
    const _t = new THREE.Vector3(), _c = new THREE.Vector3(), poiHero = new THREE.Vector3(), poiBolt = new THREE.Vector3(V.bolt.x, 15, V.bolt.z);
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    let hurT = hur.U.uT.value, streamFlow = rng() * 100;
    const glowBase = lin(PAL[5]), TN = 512, tramP = new Float32Array((TN + 1) * 3), tramT = new Float32Array((TN + 1) * 3);
    for (let i = 0; i <= TN; i++) { tramCurve.getPointAt((i % TN) / TN, _c); tramCurve.getTangentAt((i % TN) / TN, _t); _c.toArray(tramP, i * 3); _t.toArray(tramT, i * 3); }
    await ctx.yield();
    const sWin = sHall - 3;                                          // camera distance at the window
    const pace = (u) => { const s = u * L; return 1 - 0.1 * S(sDoor + 10, sDoor + 60, s) * (1 - S(sWin - 150, sWin - 110, s)) + 0.6 * S(sWin - 105, sWin - 70, s) * (1 - S(sWin - 12, sWin + 30, s)); };
    const winC = new THREE.Vector3(0, 91, -90), poiHall = new THREE.Vector3();

    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.3, far: 1600, lookAhead: 26, sway: 0.3, bank: 0 },
      pois: [
        { at: poiBolt, from: 150 / L, to: 200 / L, weight: 0.3 },
        { at: (time, u) => poiHero.set(0, lerp(46, 80, S(sDoor - 20, sOrbitEnd, u * L)), 0), from: (sDoor - 35) / L, to: (sWin - 62) / L, weight: 0.8 },
        // first the window opening, then (once the camera is on its axis) the hurricane seen through it
        { at: (time, u) => poiHall.lerpVectors(winC, HC, S(sWin - 90, sWin - 45, u * L)), from: (sOrbitEnd - 130) / L, to: (sHall + 90) / L, weight: 0.85 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#ffe1a6', glow: 1.1, revealDistance: 300 },
      post: { exposure: V.exposure, bloom: { strength: V.bloom, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.02, contrast: 1.04, tint: V.look === 'afternoon' ? '#fff6ea' : '#f4f7ff', shadowTint: '#0b0e16', vignette: 0.24, grain: 0.03, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        const s = clamp(u, 0, 1) * L, front = s + 40 * S(0, 120, s), d = Math.min(Math.max(dt, 0), 0.1);
        fxTime.value = time; SH.uTime.value = time;
        // 1 the shower
        const wR = S(5, 30, s);
        shower.set(d * (0.05 + 0.95 * wR * wR), wR);
        const wM = S(70, 110, s); mini.set(d * (0.04 + 0.96 * wM * wM), wM);
        rainbow.U.uClock.value += d * (0.05 + 0.95 * S(62, 104, s));
        // 2 the gust: shivers, then flows with the camera into the rotunda
        gust.U.uFlow.value = flowAt(s) + time * 0.35;
        gust.U.uFlut.value += d * (0.04 + 0.96 * S(30, 70, s)) * 2.4;
        gust.U.uShiver.value = S(18, 30, s) * (1 - S(45, 75, s)); gust.U.uTime.value = time;
        const wS = S(sDoor + 20, sWin - 40, s);
        streamFlow += d * (1.5 + 15 * wS); stream.U.uFlow.value = streamFlow; stream.U.uFlut.value += d * (0.3 + 2.4 * wS); stream.U.uTime.value = time;
        // 3 the lightning: grows from the top, strikes as the camera passes, re-strikes
        let grow, I, idle = 0;
        if (elmo) { grow = 0.2 + 0.08 * Math.sin(time * 0.6); I = (0.35 + 0.25 * S(120, 165, s)) * (0.8 + 0.2 * Math.sin(time * 2.3)); }
        else {
          grow = 0.3 + 0.7 * S(120, 186, s);
          const strike = S(183, 187, s) * (1 - 0.8 * S(189, 206, s)), again = pulse(time % 1.45) * S(187, 192, s) * (1 - S(260, 340, s));
          I = Math.max(strike, 0.75 * again, 0.1 * grow);
          idle = (0.3 + 0.12 * Math.sin(time * 7.3) * Math.sin(time * 2.9)) * (1 - S(183, 187, s));       // asleep it still glows and flickers at the top of its case
        }
        bolt.U.uGrow.value = grow; bolt.U.uI.value = elmo ? 0.5 + I : 0.5 + 1.7 * Math.max(I, idle);
        SH.uFlash.value.w = (elmo ? 1.3 : 2.4) * I * V.flashGain; SH.uFlash.value.y = elmo ? 30 : 16;
        SH.uBoltGrow.value = grow; SH.uGlowCol.value.copy(glowBase).multiplyScalar(0.25 + Math.max(I, idle));
        glows.setSize(0, elmo ? 0.6 + 0.5 * I : 0.25 + 1.6 * I);
        if (elmo) glows.setPosition(0, V.bolt.x + Math.sin(time * 0.4) * 1.5, 30 + Math.sin(time * 0.27) * 2.5, V.bolt.z + Math.cos(time * 0.33) * 1.5);
        // bell jars and motes follow the front
        jars.U.uFront.value = front; jars.U.uTime.value = time; motes.U.uFront.value = front; motes.U.uTime.value = time; shafts.U.uTime.value = time;
        flowers.scale.y = 0.25 + 0.75 * S(95, 125, front); flowers.scale.x = flowers.scale.z = 0.6 + 0.4 * S(100, 130, front);
        // 4 the tornado
        const wT = S(sDoor - 30, sDoor + 55, s);
        hero.setProgress(wT); hero.setGust(S(sDoor - 15, sDoor + 120, s));
        SH.uWarm.value.w = V.warm * (0.55 + 0.45 * wT) * (1 + 0.06 * Math.sin(time * 1.7) + 0.04 * Math.sin(time * 4.1));
        hero.update(dt, time, camera);
        // 5 the hurricane
        const wH = S(sHall - 130, sHall + 30, s);
        hurT += d * (0.1 + 0.9 * wH); hur.U.uT.value = hurT; SH.uHurT.value = hurT;
        SH.uEye.value = V.eye * (0.45 + 0.55 * wH) * (1 - 0.3 * S(L - 62, L - 22, s));          // inside the eye the portal ring is the brightest thing
        for (let i = 0; i < 3; i++) {                                                           // lightning in the eyewall tunnel
          const per = 1.7 + i * 0.55, ph = time / per + i * 0.31, k = Math.floor(ph), tt = (ph - k) * per;
          hur.U.uTb.value[i].set(hash(k * 5.3 + i * 11) * TAU, S(0, 0.1, tt) * Math.exp(-tt / 0.45) * (V.look === 'night' ? 1.5 : 1.15), 1 + 40 * hash(k * 2.9 + i * 23), 5 + 24 * hash(k * 9.1 + i * 7));
        }
        for (let i = 0; i < 3; i++) {
          const per = 1.8 + i * 0.7, k = Math.floor(time / per + i * 0.37), tt = time + i * 0.37 * per - k * per, a = hash(k * 3.1 + i * 17) * TAU, r = 25 + 60 * hash(k * 7.7 + i * 5);
          hur.U.uFl.value[i].set(HC.x + Math.cos(a) * r, HC.y + Math.sin(a) * r, S(0, 0.1, tt) * Math.exp(-tt / 0.42) * (0.15 + 0.85 * wH) * (V.look === 'night' ? 2.0 : 1.5), 30 + 40 * hash(k + i * 3.3));
        }
        // the tram (never frozen), and the escaped cloud with its rain
        let cloudZ = 0;
        if (cumulus) {
          cloudZ = clamp(335 - s - 62, 158, 282) + Math.sin(time * 0.2) * 2;                   // it crosses to the jar wall and stops there, clear of the lightning case and the rotunda door
          cumulus.U.uC.value.set(-9 + 22 * S(40, 130, s) + Math.sin(time * 0.13) * 2, 22 + Math.sin(time * 0.31) * 0.8, cloudZ); cumulus.U.uT.value = time;
        }
        for (const c of cars) {
          let dd = time * 13 + c.off;
          if (cumulus && c.tram === 0) dd = (335 - cloudZ) - 24 + c.off + Math.sin(time * 0.5) * 1.5;
          const f = ((((dd / tramL) % 1) + 1) % 1) * TN, i0 = Math.min(Math.floor(f), TN - 1) * 3, fr = f - i0 / 3;
          _c.set(lerp(tramP[i0], tramP[i0 + 3], fr), lerp(tramP[i0 + 1], tramP[i0 + 4], fr), lerp(tramP[i0 + 2], tramP[i0 + 5], fr));
          _t.set(lerp(tramT[i0], tramT[i0 + 3], fr), 0, lerp(tramT[i0 + 2], tramT[i0 + 5], fr));
          c.mesh.position.copy(_c); c.mesh.rotation.y = Math.atan2(-_t.x, -_t.z); c.mesh.rotation.z = Math.sin(time * 1.3 + c.off) * 0.012;
        }
        fxSet.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
