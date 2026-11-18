// hill-of-round-doors, the field builder's part: THE PAPER LANTERNS of the party tree. Four shapes (a round globe, a
// long pleated tube, an onion with gores, a flat concertina) in four soft colours, each on a cord of its own length tied
// under a limb or a string, swinging a little by the world's clock like a pendulum about its tie. Each glows in its own
// shader by how far the lanterns are alight (look.lit: none by day, soft in the evening, bright at night) and wears a
// halo; the cord is a ribbon that never draws thinner than a pixel and a half. No light is added to the scene: what a
// lantern lights (leaves, cloths, boards) is painted by place from lampField().
// A lantern and its cord keep LANTERN_AIR from the flown line at every reach of their swing.
import { lerp } from './hill-of-round-doors-field-geo.js';

export const LANTERN_AIR = 10.4;                               // 9 m is asked; the plan's measure is good to a metre, and a tassel hangs a little under its lantern
// the shapes, in units of a lantern's size, hanging down from the cord's end: prof [radius, height], segs round, h the
// whole height, c the middle's depth below the cord's end
export const SHAPES = [
  { prof: [[0, -0.05], [0.75, -0.45], [1.0, -1.12], [0.75, -1.79], [0, -2.19]], segs: 8, h: 2.24, c: 1.12 },
  { prof: [[0, -0.05], [0.6, -0.3], [0.6, -2.5], [0, -2.75]], segs: 6, h: 2.8, c: 1.4 },
  { prof: [[0, -0.05], [0.7, -0.6], [0.96, -1.3], [0.55, -2.0], [0, -2.5]], segs: 6, h: 2.55, c: 1.25 },
  { prof: [[0, -0.05], [1.08, -0.5], [1.08, -1.15], [0, -1.6]], segs: 8, h: 1.65, c: 0.82 },
];
export const TINTS = ['#fff0d2', '#ff93ad', '#f2604f', '#8fdcae', '#86bdf5'];       // the bunting's pastels: cream, pink, red, green, blue (never amber or gold)

// placeLanterns(rng, hangs, o) -> the list of lanterns that hang in the tree.
// hangs: [{ p: [x, y, z] (measured from o.at), depth }]; o: { count, at, floorY (no lantern's foot under it), route(x, y, z)
// -> metres from the flown line, sticks: [[x, y, z, r]] the tree's wood in the world, trunk: [x, z, r], pause }
// Each lantern: { ax, ay, az (the tie), L (cord), size, kind, tint, phase, amp (radians of swing), x, y, z (its middle at rest) }
export async function placeLanterns(rng, hangs, o) {
  const out = [], most = o.count * 16, cell = 4, grid = new Map();
  const key = (x, y, z) => Math.floor(x / cell) + ',' + Math.floor(y / cell) + ',' + Math.floor(z / cell);
  for (const s of o.sticks) { const k = key(s[0], s[1], s[2]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(s); }
  const woodNear = (x, y, z, r) => {
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const l = grid.get((Math.floor(x / cell) + i) + ',' + (Math.floor(y / cell) + j) + ',' + (Math.floor(z / cell) + k)); if (!l) continue;
      for (const s of l) if (Math.hypot(s[0] - x, s[1] - y, s[2] - z) < s[3] + r) return true;
    }
    return false;
  };
  const airy = (x, ay, z, L, size, S, amp) => {
    if (o.route(x, ay - L - S.c * size, z) < LANTERN_AIR + S.h * size * 0.62 + amp * (L + S.h * size)) return false;
    for (let k = 0; k <= 3; k++) if (o.route(x, ay - L * k / 4, z) < LANTERN_AIR + amp * L * k / 4) return false;
    return true;
  };
  for (let t = 0; t < most && out.length < o.count; t++) {
    if (o.pause && t % 300 === 299) await o.pause();
    const hi = Math.floor(rng() * hangs.length), u1 = rng(), size = rng.range(0.55, 0.92), kr = rng(), tint = Math.floor(rng() * TINTS.length), phase = rng(), sw = rng.range(0.6, 1);
    const h = hangs[hi], kind = kr < 0.34 ? 0 : kr < 0.58 ? 1 : kr < 0.8 ? 2 : 3, S = SHAPES[kind];
    const x = h.p[0] + o.at[0], ay = h.p[1] + o.at[1] - 0.05, z = h.p[2] + o.at[2];
    if (Math.hypot(x - o.trunk[0], z - o.trunk[1]) < o.trunk[2]) continue;
    const Lmax = ay - o.floorY - S.h * size, Lmin = h.depth === 2 ? 1.6 : 1.2; if (Lmax < Lmin) continue;
    const span = h.depth === 0 ? [3.5, 12.5] : h.depth === 1 ? [1.8, 10] : [1.6, 7];
    let L = Math.min(Lmax, lerp(span[0], span[1], u1)), amp = Math.min(0.1, 0.42 / L) * sw;
    if (!airy(x, ay, z, L, size, S, amp)) { L = Lmin + 0.8 * u1; amp = Math.min(0.1, 0.42 / L) * sw; if (L > Lmax || !airy(x, ay, z, L, size, S, amp)) continue; }
    const y = ay - L - S.c * size;
    let ok = true; for (const q of out) if (Math.hypot(q.x - x, q.y - y, q.z - z) < 3.3) { ok = false; break; }
    if (!ok || woodNear(x, y, z, S.h * size * 0.62 + amp * (L + S.h * size) + 0.3)) continue;
    out.push({ ax: x, ay, az: z, L, size, kind, tint, phase, amp, x, y, z });
  }
  return out;
}

// lampField(list) -> lampAt(x, y, z): how much lantern light falls at a place (about 1 at a metre or two from one
// lantern, more among many; 0 far from all), from a coarse grid filled once.
export function lampField(list) {
  if (!list.length) return () => 0;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const q of list) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); z0 = Math.min(z0, q.z); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); z1 = Math.max(z1, q.z); }
  const C = 2.5, R = 10, pad = R + C; x0 -= pad; y0 -= pad; z0 -= pad;
  const nx = Math.ceil((x1 + pad - x0) / C) + 1, ny = Math.ceil((y1 + pad - y0) / C) + 1, nz = Math.ceil((z1 + pad - z0) / C) + 1, g = new Float32Array(nx * ny * nz), n = Math.ceil(R / C);
  for (const q of list) {
    const ci = Math.round((q.x - x0) / C), cj = Math.round((q.y - y0) / C), ck = Math.round((q.z - z0) / C), pow = q.size * q.size * 1.6;
    for (let k = ck - n; k <= ck + n; k++) for (let j = cj - n; j <= cj + n; j++) for (let i = ci - n; i <= ci + n; i++) {
      if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) continue;
      const d = Math.hypot(x0 + i * C - q.x, y0 + j * C - q.y, z0 + k * C - q.z); if (d > R) continue;
      const f = 1 - d / R; g[(k * ny + j) * nx + i] += pow * f * f / (0.35 + d * d * 0.22);
    }
  }
  return (x, y, z) => {
    const fx = (x - x0) / C, fy = (y - y0) / C, fz = (z - z0) / C; if (fx < 0 || fy < 0 || fz < 0 || fx >= nx - 1 || fy >= ny - 1 || fz >= nz - 1) return 0;
    const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz), a = fx - i, b = fy - j, c = fz - k, at = (ii, jj, kk) => g[(kk * ny + jj) * nx + ii];
    const v = lerp(lerp(lerp(at(i, j, k), at(i + 1, j, k), a), lerp(at(i, j + 1, k), at(i + 1, j + 1, k), a), b), lerp(lerp(at(i, j, k + 1), at(i + 1, j, k + 1), a), lerp(at(i, j + 1, k + 1), at(i + 1, j + 1, k + 1), a), b), c);
    return Math.min(3, v);
  };
}

// the swing every part of a lantern shares: a pendulum about the tie, by the world's clock
const SWING = /* glsl */`
uniform float uHillTime; attribute vec3 aAnchor; attribute vec4 aHang;        // aHang: cord length, size, phase, swing in radians
vec3 hillSwing(vec3 p) {
  float w = 2.0 / sqrt(max(aHang.x, 0.6)), ph = aHang.z * 6.2832;
  float ax = aHang.w * sin(uHillTime * w + ph), az = aHang.w * 0.7 * sin(uHillTime * w * 0.83 + ph * 1.7);
  float c = cos(ax), s = sin(ax); p = vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
  c = cos(az); s = sin(az); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}`;

function shapeGeometry(THREE, S) {
  const P = [], N = [], T = [], I = [], n = S.prof.length, segs = S.segs, ring = [];
  for (let i = 0; i < n; i++) {
    const [r, y] = S.prof[i], a = S.prof[Math.max(0, i - 1)], b = S.prof[Math.min(n - 1, i + 1)];
    let ny = -(b[0] - a[0]), nr = -(b[1] - a[1]); const nl = Math.hypot(ny, nr) || 1; ny /= nl; nr /= nl;
    ring.push(P.length / 3);
    for (let k = 0; k <= segs; k++) {
      const ang = k / segs * Math.PI * 2, ca = Math.cos(ang), sa = Math.sin(ang);
      P.push(ca * r, y, sa * r); N.push(ca * nr, -ny, sa * nr); T.push(k / segs, (y - S.prof[0][1]) / (S.prof[n - 1][1] - S.prof[0][1]));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < segs; k++) {
    const a = ring[i] + k, b = ring[i] + k + 1, c = ring[i + 1] + k + 1, d = ring[i + 1] + k;
    if (S.prof[i][0] > 0) I.push(a, b, c); if (S.prof[i + 1][0] > 0) I.push(a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2));
  g.setIndex(I);
  return g;
}

// the paper body: a Lambert material (the scene's sun, fill and fog), swung, with the paper's pattern and its glow
function bodyMaterial(THREE, U) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + SWING + '\nattribute vec3 aTint; attribute vec4 aLook; varying vec3 vTint; varying vec3 vLuv; varying float vFlick;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = hillSwing(objectNormal);')
      .replace('#include <begin_vertex>', /* glsl */`vec3 transformed = aAnchor + hillSwing(position * aHang.y + vec3(0.0, -aHang.x, 0.0));
        vTint = aTint; vLuv = vec3(uv, aLook.x);
        vFlick = 0.9 + 0.1 * sin(uHillTime * 2.3 + aHang.z * 40.0) * sin(uHillTime * 3.7 + aHang.z * 17.0);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uHillLit; uniform float uHillCore; varying vec3 vTint; varying vec3 vLuv; varying float vFlick;')
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float lk = floor(vLuv.z + 0.5), lu = vLuv.x, lv = vLuv.y, lpap = 1.0;
        float lends = 1.0 - smoothstep(0.05, 0.085, lv) * (1.0 - smoothstep(0.915, 0.95, lv));            // the wooden hoops at the two ends
        float lfu = max(fwidth(lu), 1e-5), lfv = max(fwidth(lv), 1e-5);
        if (lk == 0.0) {            // globe: ribs down it and fine hoops round it
          float rib = abs(fract(lu * 8.0) - 0.5) * 2.0;
          lpap = 1.0 - 0.42 * smoothstep(0.84 - lfu * 8.0, 0.98, rib) - 0.2 * clamp(1.0 - lfv * 40.0, 0.0, 1.0) * smoothstep(0.7, 0.95, abs(fract(lv * 11.0) - 0.5) * 2.0);
        } else if (lk == 1.0) {     // tube: pleats round it
          lpap = 0.8 + 0.2 * clamp(1.0 - lfv * 30.0, 0.0, 1.0) * sin(lv * 88.0);
        } else if (lk == 2.0) {     // onion: gores of two tones
          lpap = mix(0.7, 1.0, smoothstep(-lfu * 6.0, lfu * 6.0, abs(fract(lu * 3.0) - 0.5) - 0.25)) * (1.0 - 0.3 * smoothstep(0.88 - lfu * 6.0, 0.98, abs(fract(lu * 6.0) - 0.5) * 2.0));
        } else {                    // concertina: broad pleats and a pale band round the middle
          lpap = (0.86 + 0.14 * clamp(1.0 - lfv * 14.0, 0.0, 1.0) * sin(lv * 38.0)) * (1.0 + 0.25 * smoothstep(0.1, 0.0, abs(lv - 0.5) - 0.06));
        }
        vec3 lpaper = vTint * lpap, lskin = lpaper * lpaper;            // the paper, and the same paper seen edge on: deeper in colour
        diffuseColor.rgb = mix(mix(lskin, lpaper, 0.45) * 0.86, vec3(0.2, 0.13, 0.08), lends);`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          float lface = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), lmid = (lv - 0.55) * 2.2;
          float lf2 = lface * lface;                                                                          // a coloured paper skin, deeper at its rim, lit from within
          totalEmissiveRadiance += mix(lskin, lpaper, lf2) * (uHillLit * vFlick * (1.0 - lends) * (0.5 + 1.4 * lf2) * (0.55 + 0.7 * exp(-lmid * lmid)));
          float lcore = lf2 * sqrt(lf2) * exp(-lmid * lmid * 1.5);                                            // the light itself seen through the paper: a warm white heart
          totalEmissiveRadiance += mix(lpaper, vec3(1.0, 0.94, 0.8), 0.6) * (uHillCore * vFlick * (1.0 - lends) * lcore);
        }`)
      .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
        #if NUM_DIR_LIGHTS > 0
        reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb * (RECIPROCAL_PI * 0.45 * (1.0 - lends) * clamp(-dot(normal, directionalLights[0].direction), 0.0, 1.0));   // sun through the paper
        #endif`);
  };
  mat.customProgramCacheKey = () => 'hill-field-lantern-3';
  return mat;
}

const FOG_V = '#ifdef USE_FOG\nvarying float vFogDepth;\n#endif\n', FOG_F = /* glsl */`
#ifdef USE_FOG
uniform vec3 fogColor; varying float vFogDepth;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear; uniform float fogFar;
#endif
#endif
float hillFog() {
#ifdef USE_FOG
  #ifdef FOG_EXP2
  return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.0;
#endif
}`;

// the halo: a soft round glow about each lantern's middle, turned to the eye, added over the picture
function haloMaterial(THREE, U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: SWING + '\n' + FOG_V + /* glsl */`
      attribute vec3 aTint; attribute vec4 aLook; varying vec3 vTint; varying vec2 vP;
      void main() {
        vec3 c = aAnchor + hillSwing(vec3(0.0, -aHang.x - aLook.z * aHang.y, 0.0));
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        mvPosition.xy += position.xy * aHang.y * 3.6; mvPosition.z += aHang.y * 1.2;       // a little toward the eye, so the body does not cut it
        vTint = aTint * (0.9 + 0.1 * sin(uHillTime * 2.3 + aHang.z * 40.0) * sin(uHillTime * 3.7 + aHang.z * 17.0)); vP = position.xy;
        gl_Position = projectionMatrix * mvPosition;
        #ifdef USE_FOG
        vFogDepth = -mvPosition.z;
        #endif
      }`,
    fragmentShader: FOG_F + /* glsl */`
      uniform float uHillLit; varying vec3 vTint; varying vec2 vP;
      void main() {
        float d2 = dot(vP, vP), a = (0.36 * exp(-d2 * 5.0) + 0.16 * exp(-d2 * 2.2)) * smoothstep(1.0, 0.6, sqrt(d2));
        gl_FragColor = vec4(vTint * (uHillLit * a * (1.0 - 0.75 * hillFog())), 1.0);
      }`,
  });
}

// a line's alpha across a ribbon: vC runs -1..1 across, vW is the true half width over the ribbon's; never under a
// pixel and a half, and fainter by as much as it is drawn wider than true
export const LINE_F = /* glsl */`
float hillLine(float c, float w) {
  float f = max(fwidth(c), 1e-5), hw = max(w, 0.75 * f);
  return smoothstep(hw + f, hw, abs(c)) * clamp(w / hw, 0.3, 1.0);
}`;

// the cord: a ribbon from the tie to the lantern's head, turned to the eye in the vertex shader
function cordMaterial(THREE, U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U, uCord: { value: new THREE.Color(0.05, 0.036, 0.026) } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: SWING + '\n' + FOG_V + /* glsl */`
      varying float vC; varying float vW;
      void main() {
        vec3 b = aAnchor + hillSwing(vec3(0.0, -aHang.x, 0.0));
        vec4 va = modelViewMatrix * vec4(aAnchor, 1.0), vb = modelViewMatrix * vec4(b, 1.0), mvPosition = mix(va, vb, position.y);
        vec2 dir = vb.xy / max(-vb.z, 0.05) - va.xy / max(-va.z, 0.05); float dl = length(dir);
        vec2 side = dl > 1e-6 ? vec2(-dir.y, dir.x) / dl : vec2(1.0, 0.0);
        float half_ = max(0.05, 0.004 * max(-mvPosition.z, 0.0));                  // drawn wide enough for a pixel or two at any distance
        mvPosition.xy += side * position.x * half_; vC = position.x; vW = 0.022 / half_;
        gl_Position = projectionMatrix * mvPosition;
        #ifdef USE_FOG
        vFogDepth = -mvPosition.z;
        #endif
      }`,
    fragmentShader: FOG_F + LINE_F + /* glsl */`
      uniform vec3 uCord; varying float vC; varying float vW;
      void main() {
        float a = hillLine(vC, vW);
        #ifdef USE_FOG
        gl_FragColor = vec4(mix(uCord, fogColor, hillFog()), a);
        #else
        gl_FragColor = vec4(uCord, a);
        #endif
      }`,
  });
}

// the tassel under each lantern: a short ribbon from its foot, turned to the eye, drawn as a cord, a bead and a skirt
// of threads in the lantern's own colour, deeper; it swings with its lantern
function tasselMaterial(THREE, U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: SWING + '\n' + FOG_V + /* glsl */`
      attribute vec3 aTint; attribute vec4 aLook; varying vec2 vQ; varying vec3 vTint;
      void main() {
        float foot = aHang.x + aLook.w * aHang.y;                                  // from the tie down to the lantern's foot
        vec3 a = aAnchor + hillSwing(vec3(0.0, -foot + 0.06 * aHang.y, 0.0)), b = aAnchor + hillSwing(vec3(0.0, -foot - 0.85 * aHang.y, 0.0));
        vec4 va = modelViewMatrix * vec4(a, 1.0), vb = modelViewMatrix * vec4(b, 1.0), mvPosition = mix(va, vb, position.y);
        vec2 dir = vb.xy / max(-vb.z, 0.05) - va.xy / max(-va.z, 0.05); float dl = length(dir);
        vec2 side = dl > 1e-6 ? vec2(-dir.y, dir.x) / dl : vec2(1.0, 0.0);
        mvPosition.xy += side * position.x * 0.2 * aHang.y; vQ = position.xy; vTint = aTint;
        gl_Position = projectionMatrix * mvPosition;
        #ifdef USE_FOG
        vFogDepth = -mvPosition.z;
        #endif
      }`,
    fragmentShader: FOG_F + /* glsl */`
      varying vec2 vQ; varying vec3 vTint;
      void main() {
        float c = abs(vQ.x), t = vQ.y, f = max(fwidth(vQ.x), 1e-4);
        float cord = smoothstep(0.1 + f, 0.1, c) * step(t, 0.34);
        float bead = smoothstep(1.0 + f * 2.0, 1.0, length(vec2(c / 0.5, (t - 0.3) / 0.085)));
        float wid = 0.4 + 0.5 * smoothstep(0.36, 1.0, t);
        float skirt = smoothstep(wid + f, wid, c) * step(0.36, t) * (1.0 - 0.55 * smoothstep(0.82, 1.0, t) * step(0.5, fract(vQ.x * 3.5 + 0.25)));
        float a = max(max(cord, bead), skirt); if (a < 0.02) discard;
        vec3 col = mix(vTint * vTint * 0.62, vec3(0.93, 0.86, 0.7), bead * (1.0 - skirt)) * (0.75 + 0.25 * (1.0 - c));
        #ifdef USE_FOG
        col = mix(col, fogColor, hillFog());
        #endif
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// makeLanterns(THREE, list, { lit }) -> { object, time (the clock's uniform), triangles, drawCalls, dispose() }
// One instanced mesh for each shape that hangs, one for all the cords, and (where the lanterns are alight) one for all
// the halos. Every instance is placed by its own tie, cord and swing: none is left unplaced.
export function makeLanterns(THREE, list, o) {
  const object = new THREE.Group(), time = { value: 0 }, lit = o.lit, owned = [];
  const U = { uHillTime: time, uHillLit: { value: lit * (1.27 - 0.65 * lit) }, uHillCore: { value: lit * (1.32 - 0.97 * lit) } };   // lit: 0.34 by day to 1 at night; soft by day, bright at night without burning white
  const tints = TINTS.map((c) => new THREE.Color(c)), mid = new THREE.Vector3(); let rad = 1;
  for (const q of list) mid.add(new THREE.Vector3(q.x, q.y, q.z)); if (list.length) mid.multiplyScalar(1 / list.length);
  for (const q of list) rad = Math.max(rad, Math.hypot(q.x - mid.x, q.ay - mid.y, q.z - mid.z) + q.L + 4);
  const instanced = (base, items) => {
    const g = new THREE.InstancedBufferGeometry(), n = items.length; g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    const A = new Float32Array(n * 3), H = new Float32Array(n * 4), T = new Float32Array(n * 3), K = new Float32Array(n * 4);
    items.forEach((q, i) => {
      A.set([q.ax, q.ay, q.az], i * 3); H.set([q.L, q.size, q.phase, q.amp], i * 4);
      const c = tints[q.tint]; T.set([c.r, c.g, c.b], i * 3); K.set([q.kind, q.phase, SHAPES[q.kind].c, SHAPES[q.kind].h], i * 4);
    });
    g.setAttribute('aAnchor', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aHang', new THREE.InstancedBufferAttribute(H, 4));
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(T, 3)); g.setAttribute('aLook', new THREE.InstancedBufferAttribute(K, 4));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(mid.clone(), rad);
    owned.push(g, base);
    return g;
  };
  let triangles = 0, drawCalls = 0;
  if (!list.length) return { object, time, triangles, drawCalls, dispose() {} };
  const body = bodyMaterial(THREE, U); owned.push(body);
  SHAPES.forEach((S, kind) => {
    const items = list.filter((q) => q.kind === kind); if (!items.length) return;
    const base = shapeGeometry(THREE, S);
    object.add(new THREE.Mesh(instanced(base, items), body)); triangles += base.index.count / 3 * items.length; drawCalls++;
  });
  const quad = (x0, y0, x1, y1) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  };
  const cords = cordMaterial(THREE, U); owned.push(cords);
  const cm = new THREE.Mesh(instanced(quad(-1, 0, 1, 1), list), cords); cm.renderOrder = 2; object.add(cm); triangles += 2 * list.length; drawCalls++;
  const tassels = tasselMaterial(THREE, U); owned.push(tassels);
  const tm = new THREE.Mesh(instanced(quad(-1, 0, 1, 1), list), tassels); tm.renderOrder = 2; object.add(tm); triangles += 2 * list.length; drawCalls++;
  if (lit > 0) {
    const halos = haloMaterial(THREE, { uHillTime: time, uHillLit: { value: lit * (1.02 - 0.72 * lit) } }); owned.push(halos);
    const glowing = list.filter((q, i) => i % 2 === 0);          // a halo to every other lantern: fewer and softer, so that night does not burn white
    const hm = new THREE.Mesh(instanced(quad(-1, -1, 1, 1), glowing), halos); hm.renderOrder = 3; object.add(hm); triangles += 2 * glowing.length; drawCalls++;
  }
  return { object, time, triangles, drawCalls, dispose() { for (const x of owned) x.dispose(); } };
}
