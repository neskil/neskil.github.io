// THE EYE: hero set piece of "The Storm Bands" (src/parts/storm-bands.js)
//
// A cyclone 1600 m across set into the cloud deck of a gas giant: a shallow funnel of cream and
// rust spiral cloud bands that drops 250 m from a billowing rim cliff to a violet-black well
// 300 m wide. The bands rotate differentially (one turn per 90 s at the rim, faster inward),
// lightning strobes inside the well and flickers inside the band clouds, scud races round the
// wall, and Floaters (veined gas-bag creatures with a cyan inner glow) ride the far inner wall
// in a slow descending spiral until they sink into the well. Two more hold station either side
// of the portal seat.
//
// SPACE   Origin = centre of the Eye at deck level (y = 0 is the top of the cream deck).
//         +Y up, the camera is expected to arrive from +Z looking toward -Z.
//         Rim radius 800 m; a ragged spiral apron of deck cloud continues to ~1150 m and is meant
//         to be hidden under the world's own deck puffs. Funnel floor: y = -55 just inside the
//         rim cliff to y = -250 at the well lip (r = 150), well bottom about y = -480.
//         radius = 800, height = 520 (well bottom to the top of the highest Floater). Cloud crests on the
//         rim and apron reach about y = +40. `center` (0, 90, 0) is only a framing point for the orbit viewer:
//         aim POIs at anchors.lookAt instead.
//
// OPTS    palette   array of 7 hex strings (brief order: indigo, tan, cream, rust, dark rust, plum, cyan)
//         sunDir    [x,y,z] direction TOWARD the sun in the hero's local space (default behind-left, 55 deg up)
//         sunColor  hex, sunIntensity number (default '#fff4e2', 1.1)
//         floaters  number riding the wall (default 6)      attendants  true: two Floaters flanking the portal seat
//         spin      +1 / -1 rotation sense seen from above (default per seed)
//         apronCut  radius beyond which the ragged apron is not drawn (default: all of it). A world that builds its own
//                   collar of deck cloud round the rim passes ~870 so only the rim crest and the funnel remain
//         pod       extra free Floaters drawn in the same two draw calls: [{ position [x,y,z] = bell base centre (local),
//                   size (bell height, m; tendrils hang ~1.2 x size below), yaw, drift [ax, az] slow wander amplitude (m) }]
//         revealU   path progress at which setProgress() fires the arrival strike (default 0.6)
//
// ANCHORS (all local space)
//         portalSeat   { position, facing }  centre of the 14 m exit portal: 450 m in from the rim on the +Z
//                      side, 120 m above the spiral, directly in front of the well; facing = +Z (toward the camera)
//         flyThrough   ordered Vector3 list: over the deck, across the rim at +20 m, a gentle banked descent
//                      along the inner wall, then 100 m straight and level into portalSeat. Clearance is > 20 m to
//                      cloud crests and scud everywhere; Floaters never enter the +Z sector (nearest ~300 m).
//         viewpoints   [{ position, lookAt, note }] good camera stations (edge-on notch, rim reveal, wall pass)
//         lookAt       the well mouth (POI target), wellCenter, rimRadius, wellRadius, apronRadius
//         attendants   [Vector3, Vector3] the two Floaters beside the portal
//         floaterPosition(i, time, target)  live local position of wall Floater i (bell centre)
//
// HOOKS   update(dt, time, camera)  ambient motion (rotation, scud, Floater pulse, random lightning)
//         setProgress(u)            call every frame with path progress: guarantees a big multi-stroke
//                                   strike in the well as the camera crosses the rim (u ~ revealU)
//         uniforms                  shared uniform block (uSunDir, uSunCol, uFlash, ...) if the world wants to tune
//
// COST    ~104k triangles, 7 draw calls (eye 1, mist 1, bolts 1, scud 1, Floater solids 1, membrane 2),
//         no real-time lights, ~200 ms build. The eye's fragment shader is the
//         heavy part (6 texture lookups per pixel, analytic normals from gradient textures); three 256x256
//         textures in total.
// LIGHT   Self-lit: every shader takes the sun from opts.sunDir (hard key, crisp terminator, rust/plum shade,
//         indigo depth) and ignores scene lights; all materials honour scene fog. Emissive (bloom) only on
//         lightning (4-8), Floater glow (2-5); sunlit cream stays below ~0.8.

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1a2a5a', '#e8c79a', '#f6e9d2', '#c9743a', '#7a3a2a', '#2a1a2a', '#6fffe0'];
const TAU = Math.PI * 2;
const RIM = 800, WELL = 150, CLIFF = 55, DEPTH = 250, WELL_DEPTH = 200, R_OUT = 1180;

// ---- funnel profile (kept identical in JS and GLSL) ----
function profileY(r) {
  const lip = 12 * Math.exp(-Math.pow((r - RIM - 40) / 60, 2));
  const cliff = -CLIFF * smoothstep(RIM + 40, RIM - 110, r);
  const t = clamp((RIM - 75 - r) / (RIM - 75 - WELL), 0, 1);
  const fun = -(DEPTH - CLIFF) * Math.pow(t, 1.5);
  const w = smoothstep(WELL + 20, WELL - 60, r);
  const well = -WELL_DEPTH * w - 40 * (1 - smoothstep(0, WELL, r)) * w;
  return lip + cliff + fun + well;
}

const GLSL_COMMON = /* glsl */`
#define TAU 6.28318530718
const float RIM = ${RIM.toFixed(1)}, WELL = ${WELL.toFixed(1)}, CLIFF = ${CLIFF.toFixed(1)};
const float DEPTH = ${DEPTH.toFixed(1)}, WELL_DEPTH = ${WELL_DEPTH.toFixed(1)}, R_OUT = ${R_OUT.toFixed(1)};
const float LN_OUT = ${Math.log(R_OUT).toFixed(5)}, DL = 0.4;
uniform sampler2D uNoise;
uniform float uTime, uSpin, uArms, uTwist, uWRim;
float eyeProfile(float r) {
  float q = (r - RIM - 40.) / 60.;
  float lip = 12. * exp(-q * q);
  float cliff = -CLIFF * smoothstep(RIM + 40., RIM - 110., r);
  float t = clamp((RIM - 75. - r) / (RIM - 75. - WELL), 0., 1.);
  float fun = -(DEPTH - CLIFF) * t * sqrt(t);
  float w = smoothstep(WELL + 20., WELL - 60., r);
  float well = -WELL_DEPTH * w - 40. * (1. - smoothstep(0., WELL, r)) * w;
  return lip + cliff + fun + well;
}
// angular velocity of the vortex at radius r (rad/s): rim = one turn per 90 s, faster inward, still outside
float eyeOmega(float r) {
  return uWRim * pow(RIM / clamp(r, 60., RIM), 0.6) * (1. - smoothstep(RIM + 20., R_OUT - 40., r));
}
float hash1(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
// Differential rotation without wind-up: the disc is a stack of rigidly rotating log-spaced rings,
// each sampling the same spiral-warped noise at its own angle; neighbours cross-fade by radius.
vec4 swirl(float r, float th, float m, float k, float c, vec2 gx, vec2 gy) {
  float lr = log(max(r, 12.));
  float L = max((LN_OUT - lr) / DL, 0.);
  float i = floor(L), f = fract(L);
  f = f * f * (3. - 2. * f);
  float r0 = R_OUT * exp(-DL * i), r1 = R_OUT * exp(-DL * (i + 1.));
  float a0 = fract(eyeOmega(r0) * uTime / TAU), a1 = fract(eyeOmega(r1) * uTime / TAU);
  float u = (th + uSpin * k * lr) / TAU;
  vec2 uv0 = vec2((u - uSpin * a0) * m + hash1(i), lr * c + hash1(i + 7.3));
  vec2 uv1 = vec2((u - uSpin * a1) * m + hash1(i + 1.), lr * c + hash1(i + 8.3));
  vec4 s = mix(NTEX(uv0, gx, gy), NTEX(uv1, gx, gy), f);
  return (s - 0.5) / sqrt(f * f + (1. - f) * (1. - f)) + 0.5;
}
float reliefAmp(float r) {
  float a = clamp(r * 0.05, 5., 38.);
  a *= mix(0.45, 1., smoothstep(WELL - 70., WELL + 60., r));       // calmer inside the well
  a *= mix(1., 0.32, smoothstep(RIM + 30., R_OUT - 80., r));              // flattening into the deck
  return a;
}
// relief in metres above the base profile, plus the raw fields for colouring
float eyeRelief(float r, float th, vec2 g1x, vec2 g1y, vec2 g2x, vec2 g2y, out vec4 A, out vec4 B) {
  A = swirl(r, th, uArms, uTwist, uArms / TAU / 5.0, g1x, g1y);
  B = swirl(r, th, uArms * 3., uTwist * 0.85, uArms * 3. / TAU / 2.2, g2x, g2y);
  float h = (A.r - 0.5) * 1.5 + (B.g - 0.45) * 0.9;
  return h * reliefAmp(r);
}
`;

// ---- tileable noise texture: R fbm, G billow, B fine fbm, A ridged ----
async function makeNoiseTexture(rng, ctx, size = 256) {
  const chans = [{ p: 4, oct: 5, mode: 0 }, { p: 6, oct: 4, mode: 1 }, { p: 16, oct: 4, mode: 0 }, { p: 5, oct: 4, mode: 2 }];
  const data = new Uint8Array(size * size * 4);
  const acc = new Float32Array(size * size), floats = [];
  for (let c = 0; c < 4; c++) {
    acc.fill(0);
    const { p, oct, mode } = chans[c];
    let amp = 1;
    for (let o = 0; o < oct; o++) {
      const n = p << o;
      if (n > size / 2) break;
      const g = new Float32Array(n * n);
      for (let i = 0; i < g.length; i++) g[i] = rng();
      const sc = n / size;
      for (let y = 0; y < size; y++) {
        if (y % 16 === 0) await ctx.yield?.();   // a pass that runs cold is long in itself: ask every 16 rows
        const fy = y * sc, y0 = Math.floor(fy), ty0 = fy - y0, ty = ty0 * ty0 * (3 - 2 * ty0);
        const ya = (y0 % n) * n, yb = ((y0 + 1) % n) * n;
        for (let x = 0; x < size; x++) {
          const fx = x * sc, x0 = Math.floor(fx), tx0 = fx - x0, tx = tx0 * tx0 * (3 - 2 * tx0);
          const xa = x0 % n, xb = (x0 + 1) % n;
          let v = lerp(lerp(g[ya + xa], g[ya + xb], tx), lerp(g[yb + xa], g[yb + xb], tx), ty);
          if (mode === 1) v = Math.abs(v * 2 - 1);
          else if (mode === 2) { v = 1 - Math.abs(v * 2 - 1); v *= v; }
          acc[y * size + x] += v * amp;
        }
      }
      amp *= 0.5;
      await ctx.yield?.();   // one octave is a few ms: hand back between octaves (takes no draw)
    }
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < acc.length; i++) { if (i % 8192 === 0) await ctx.yield?.(); if (acc[i] < lo) lo = acc[i]; if (acc[i] > hi) hi = acc[i]; }
    const k = 255 / (hi - lo);
    const f = new Float32Array(acc.length);
    for (let i = 0; i < acc.length; i++) { if (i % 8192 === 0) await ctx.yield?.(); data[i * 4 + c] = (acc[i] - lo) * k; f[i] = (acc[i] - lo) / (hi - lo); }
    floats.push(f);
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 1; tex.needsUpdate = true;
  return { tex, floats, size };
}

// (height, dH/du, dH/dv, spare) so one fetch gives the eye shader a height and its slope.
// The gradient is a central difference over +-K texels (pre-smoothed normals), stored 0.5-biased.
async function makeGradTexture(ctx, h, spare, size, K) {
  const n = size * size, gx = new Float32Array(n), gy = new Float32Array(n);
  let gmax = 1e-6;
  const sc = size / (2 * K);
  for (let y = 0; y < size; y++) {
    if (y % 16 === 0) await ctx.yield?.();   // by rows (takes no draw)
    const ym = ((y - K + size) % size) * size, yp = ((y + K) % size) * size, y0 = y * size;
    for (let x = 0; x < size; x++) {
      const xm = (x - K + size) % size, xp = (x + K) % size;
      const a = (h[y0 + xp] - h[y0 + xm]) * sc, b = (h[yp + x] - h[ym + x]) * sc;
      gx[y0 + x] = a; gy[y0 + x] = b;
      if (Math.abs(a) > gmax) gmax = Math.abs(a); if (Math.abs(b) > gmax) gmax = Math.abs(b);
    }
  }
  const scale = gmax * 0.75, data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    if (i % 4096 === 0) await ctx.yield?.();
    data[i * 4] = h[i] * 255;
    data[i * 4 + 1] = clamp(127.5 + 127.5 * gx[i] / scale, 0, 255);
    data[i * 4 + 2] = clamp(127.5 + 127.5 * gy[i] / scale, 0, 255);
    data[i * 4 + 3] = spare[i] * 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return { tex, scale };
}

const hash01 = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
const linColor = (hex) => new THREE.Color(hex);

const FOG_UNIFORMS = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ---------------------------------------------------------------------------------------------
// The Eye: one polar grid, displaced in the vertex shader, shaded as sun-struck cloud
// ---------------------------------------------------------------------------------------------
async function buildEyeMesh(shared, ctx) {
  const SEG = 352;
  const radii = [];
  const span = (a, b, n, pow = 1) => { for (let i = 0; i < n; i++) radii.push(a + (b - a) * Math.pow(i / n, pow)); };
  span(5, WELL - 30, 9); span(WELL - 30, WELL + 30, 8); span(WELL + 30, RIM - 90, 58);
  span(RIM - 90, RIM + 40, 17); span(RIM + 40, R_OUT, 20, 1.15); radii.push(R_OUT);
  const NR = radii.length, W = SEG + 1;
  const pos = new Float32Array(NR * W * 3), polar = new Float32Array(NR * W * 2);
  for (let j = 0; j < NR; j++) for (let i = 0; i < W; i++) {
    if (i === 0 && j % 8 === 0) await ctx.yield?.();   // every 8 rings of the grid (no draw is taken in here)
    // the grid's radial lines are wound along the spiral arms, so band crests follow mesh edges instead of
    // cutting diagonally across the quads (which gave every crest a saw-tooth silhouette)
    const r = radii[j], th = (i / SEG) * TAU - shared.uSpin.value * shared.uTwist.value * Math.log(Math.max(r, 12)), o = j * W + i;
    pos[o * 3] = Math.sin(th) * r; pos[o * 3 + 1] = profileY(r); pos[o * 3 + 2] = Math.cos(th) * r;
    polar[o * 2] = r; polar[o * 2 + 1] = th;
  }
  const idx = new Uint32Array((NR - 1) * SEG * 6);
  let k = 0;
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < SEG; i++) {
    if (i === 0 && j % 16 === 0) await ctx.yield?.();
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPolar', new THREE.BufferAttribute(polar, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -200, 0), R_OUT + 120);

  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...shared, ...FOG_UNIFORMS() },
    vertexShader: /* glsl */`
      #define NTEX(uv, gx, gy) textureLod(uNoise, uv, gx.x)
      ${GLSL_COMMON}
      attribute vec2 aPolar; uniform float uApronCut;
      varying vec2 vPolar; varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        float r = aPolar.x, th = aPolar.y;
        vec4 A, B;
        float h = eyeProfile(r) + eyeRelief(r, th, vec2(3.5), vec2(0.), vec2(4.7), vec2(0.), A, B);   // blurrier than the grid can resolve: no faceted crests
        h -= 95. * smoothstep(uApronCut - 52., uApronCut + 4., r);     // the cut edge curls down into the world's collar cloud: never a floating razor edge
        vec3 p = vec3(sin(th) * r, h, cos(th) * r);
        vPolar = aPolar;
        vWorld = (modelMatrix * vec4(p, 1.)).xyz;
        vec4 mvPosition = viewMatrix * vec4(vWorld, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define NTEX(uv, gx, gy) texture2D(uNoise, uv)
      ${GLSL_COMMON}
      uniform sampler2D uTexA, uTexB;      // (height, dH/du, dH/dv, spare): A = band fbm + ridged, B = billow + fine fbm
      uniform vec2 uGradScale;
      uniform vec3 uSunDir, uSunCol, uIndigo, uTan, uCream, uRust, uRustDark, uPlum, uBoltCol;
      uniform vec4 uFlash[3];
      uniform mat4 uInvModel; uniform float uApronCut; uniform vec3 uWell;
      varying vec2 vPolar; varying vec3 vWorld;
      #include <fog_pars_fragment>
      // fragment fast path: ring parameters once per pixel, one fetch per ring returns height AND its gradient
      float gF, gNorm, gA0, gA1; vec4 gH;
      void ringSetup(float lr) {
        float L = max((LN_OUT - lr) / DL, 0.);
        float i = floor(L);
        gF = fract(L); gF = gF * gF * (3. - 2. * gF);
        gNorm = sqrt(gF * gF + (1. - gF) * (1. - gF));
        float r0 = R_OUT * exp(-DL * i), r1 = r0 * exp(-DL);
        gA0 = fract(eyeOmega(r0) * uTime / TAU); gA1 = fract(eyeOmega(r1) * uTime / TAU);
        gH = vec4(hash1(i), hash1(i + 7.3), hash1(i + 1.), hash1(i + 8.3));
      }
      vec4 swirlT(sampler2D tex, float lr, float th, float m, float k, float c, float lod) {
        float u = (th + uSpin * k * lr) / TAU;
        vec2 uv0 = vec2((u - uSpin * gA0) * m + gH.x, lr * c + gH.y);
        vec2 uv1 = vec2((u - uSpin * gA1) * m + gH.z, lr * c + gH.w);
        return mix(textureLod(tex, uv0, lod), textureLod(tex, uv1, lod), gF);
      }
      float lodOf(vec2 uv) {
        vec2 dx = dFdx(uv), dy = dFdy(uv);
        return max(0., 0.5 * log2(max(dot(dx, dx), dot(dy, dy)) * 65536. + 1e-12));
      }
      void main() {
        float r = vPolar.x, th = vPolar.y, lr = log(max(r, 12.));
        float mA = uArms, kA = uTwist, cA = uArms / TAU / 5.0;
        float mB = uArms * 3., kB = uTwist * 0.85, cB = uArms * 3. / TAU / 2.2;
        float mC = uArms * 9., kC = uTwist * 0.7, cC = uArms * 9. / TAU / 1.6;
        // mip levels from the continuous coordinates (the per-ring offsets would break the derivatives)
        float lodA = lodOf(vec2((th + uSpin * kA * lr) / TAU * mA, lr * cA));
        float lodB = lodOf(vec2((th + uSpin * kB * lr) / TAU * mB, lr * cB));
        float lodC = lodOf(vec2((th + uSpin * kC * lr) / TAU * mC, lr * cC));
        ringSetup(lr);
        vec4 sa = swirlT(uTexA, lr, th, mA, kA, cA, lodA);
        vec4 sb = swirlT(uTexB, lr, th, mB, kB, cB, lodB);
        vec4 sc = swirlT(uTexB, lr, th, mC, kC, cC, lodC);
        // same channel layout the shading below was written for: A.r bands, A.a ridged, B.g billow, C.g billow, C.b fine
        vec4 A = vec4((sa.r - 0.5) / gNorm + 0.5, 0., 0., (sa.a - 0.5) / gNorm + 0.5);
        vec4 B = vec4(0., (sb.r - 0.5) / gNorm + 0.5, 0., 0.);
        vec4 C = vec4(0., (sc.r - 0.5) / gNorm + 0.5, (sc.a - 0.5) / gNorm + 0.5, 0.);
        // analytic normal: chain rule from texture gradients to (radius, angle)
        vec2 gA = (sa.gb * 2. - 1.) * (uGradScale.x / gNorm);
        vec2 gB = (sb.gb * 2. - 1.) * (uGradScale.y / gNorm);
        float amp = reliefAmp(r);
        float dAth = gA.x * mA / TAU, dAlr = gA.x * uSpin * kA * mA / TAU + gA.y * cA;
        float dBth = gB.x * mB / TAU, dBlr = gB.x * uSpin * kB * mB / TAU + gB.y * cB;
        float dHth = amp * (1.5 * dAth + 0.9 * dBth) / r;
        float dHr = amp * (1.5 * dAlr + 0.9 * dBlr) / r;
        float dPr = (eyeProfile(r + 2.) - eyeProfile(r - 2.)) * 0.25;
        vec3 er = vec3(sin(th), 0., cos(th)), et = vec3(cos(th), 0., -sin(th));
        float apron = smoothstep(RIM + 30., R_OUT - 80., r);
        float bs = mix(mix(0.9, 1.35, smoothstep(230., 600., r)), 3.4, apron);   // the flattened apron keeps its billow in the shading
        vec3 N = normalize(vec3(0., 1., 0.) - er * (dPr + dHr * bs) - et * (dHth * bs));
        N = normalize(N + (er * (C.b - 0.5) + et * (C.g - 0.5)) * 0.3);

        // ragged outer edge: the feeder arms dissolve into the deck
        float edge = (r - (RIM + 45.)) / (R_OUT - RIM - 140.);
        float thr = A.r * 0.8 + B.g * 0.45 + (C.b - 0.5) * 0.5 - 0.08;
                if (edge > thr || r > uApronCut) discard;
        float thin = smoothstep(0.16, 0., thr - edge);              // cloud thins toward its torn edge

        float hN = clamp((A.r - 0.5) * 1.5 + (B.g - 0.45) * 0.9, -1., 1.) * 0.5 + 0.5;
        float ao = smoothstep(0.08, 0.72, hN);

        // band colour: cream crests, tan flanks, rust lanes, more rust toward the well
        float bz = A.a * 0.8 + (A.r - 0.5) * 0.4 + (C.b - 0.5) * 0.16 + 0.06;
        bz -= smoothstep(520., 170., r) * 0.2;
        bz += smoothstep(RIM - 120., RIM + 80., r) * 0.22;
        float rimK = smoothstep(RIM - 75., RIM - 5., r);            // the cliff and its crest are plain cream: no hard band edge on the silhouette
        bz = mix(bz, max(bz, 0.7), rimK);
        vec3 alb = mix(uRust, uTan, smoothstep(0.22, 0.46, bz));
        alb = mix(alb, uCream, smoothstep(0.44, 0.66, bz));
        alb = mix(alb, uRustDark, (1. - smoothstep(0.08, 0.3, hN)) * 0.4 * (1. - 0.8 * rimK));
        alb *= mix(0.76, 1.0, C.b) * 0.86;

        vec3 sunL = normalize(uSunDir);
        float ndl = dot(N, sunL);
        float lit = smoothstep(-0.12, 0.36, ndl);
        float y = (uInvModel * vec4(vWorld, 1.)).y;
        float sunReach = 1. - smoothstep(-200., -292., y);
        // the bowl's own terminator: the wall under the sun-side rim sits in shade
        float macro = dot(normalize(vec3(0., 1., 0.) - er * dPr * 1.7), sunL);
        lit *= mix(0.12, 1., smoothstep(0.3, 0.68, macro));
        lit *= sunReach * mix(0.5, 1., ao) * mix(1., mix(0.72, 1.04, smoothstep(0.15, 0.7, B.g)), apron);
        vec3 shade = mix(uPlum * 0.85, mix(uRustDark, uRust, 0.3) * 0.62, ao);
        shade += uIndigo * 0.2 * clamp(N.y, 0., 1.);
        vec3 col = alb * uSunCol * lit + shade * (1. - lit * 0.8) * (0.55 + 0.6 * alb.r);
        col += uRust * (lit * (1. - lit)) * 0.5;                    // warm bleed along the terminator

        col = mix(col, mix(uRust, uTan, 0.45) * 0.42, thin * 0.6);
        // depth: funnel falls to indigo, the well to violet-black
        float dz = smoothstep(-165., -300., y);
        col = mix(col, uIndigo * (0.9 + 0.7 * ao) + col * 0.3, dz * 0.75);
        float wz = smoothstep(-250., -390., y);
        col = mix(col, uWell * (0.6 + ao), wz);

        // lightning: slot 0 is the well bolt, 1 and 2 are sheet flashes inside the bands
        vec3 lp = (uInvModel * vec4(vWorld, 1.)).xyz;
        for (int i = 0; i < 3; i++) {
          vec3 d = uFlash[i].xyz - lp;
          float dist = length(d);
          float R = i == 0 ? 130. : 75.;
          float blot = mix(0.5, 1., B.g) * mix(0.65, 1., A.r);
          float wrap = clamp(dot(N, d / max(dist, 1.)) * 0.5 + 0.65, 0., 1.);
          col += uBoltCol * (uFlash[i].w * exp(-dist / R) * blot * wrap * (i == 0 ? 3.6 : 3.0));
        }
        if (!gl_FrontFacing) col = mix(uPlum, uRustDark, 0.45) * (0.45 + 0.6 * ao);     // underside, only ever seen from outside
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'eye';
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// Well mist: two stacked spinning veils that hide the bottom and catch the lightning from inside
// ---------------------------------------------------------------------------------------------
function buildMist(shared) {
  const layers = [{ y: -335, r: 150, a: 0.9, li: 1 }, { y: -272, r: 168, a: 0.55, li: 0 }];   // deep veil first
  const pos = [], uv = [], lay = [], idx = [];
  const SEG = 64, RINGS = 10;
  layers.forEach((L) => {
    const li = L.li;
    const base = pos.length / 3;
    for (let j = 0; j <= RINGS; j++) for (let i = 0; i <= SEG; i++) {
      const r = (j / RINGS) * L.r, th = (i / SEG) * TAU;
      pos.push(Math.sin(th) * r, L.y, Math.cos(th) * r); uv.push(r / L.r, th); lay.push(li, L.a);
    }
    for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
      const a = base + j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aRT', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...shared, ...FOG_UNIFORMS() },
    vertexShader: /* glsl */`
      attribute vec2 aRT, aLayer;
      varying vec2 vRT, vLayer; varying vec3 vLocal;
      #include <fog_pars_vertex>
      void main() {
        vRT = aRT; vLayer = aLayer; vLocal = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uNoise; uniform float uTime, uSpin;
      uniform vec3 uIndigo, uBoltCol, uWell; uniform vec4 uFlash[3];
      varying vec2 vRT, vLayer; varying vec3 vLocal;
      #include <fog_pars_fragment>
      void main() {
        float rn = vRT.x, th = vRT.y;
        float w = 0.24 + vLayer.x * 0.1;
        float lr = log(rn * 6. + 0.4);
        vec2 gx = dFdx(vec2(th / 6.2832 * 3., lr * 0.5)), gy = dFdy(vec2(th / 6.2832 * 3., lr * 0.5));
        gx = clamp(gx, -0.05, 0.05); gy = clamp(gy, -0.05, 0.05);
        float sp = (th + uSpin * 2.6 * lr) / 6.2832;
        vec4 n1 = textureGrad(uNoise, vec2((sp - uSpin * fract(uTime * w / 6.2832)) * 3. + vLayer.x * 0.37, lr * 0.5), gx, gy);
        vec4 n2 = textureGrad(uNoise, vec2((sp - uSpin * fract(uTime * w * 1.7 / 6.2832)) * 6. + 0.5, lr * 1.1 + 0.3), gx * 2., gy * 2.);
        float dens = n1.r * 0.65 + n2.g * 0.5;
        float alpha = smoothstep(0.28, 0.85, dens + (1. - vLayer.x) * -0.08 + vLayer.x * 0.3);
        alpha *= (1. - smoothstep(0.62, 1.0, rn)) * vLayer.y;
        vec3 violet = uWell * 2.4, deep = uWell * 0.42;
        vec3 col = mix(deep, mix(violet, uIndigo * 0.5, n2.g * 0.6), smoothstep(0.35, 0.9, dens));
        col *= mix(1.0, 0.45, vLayer.x);
        col += uWell * 5.2 * pow(1. - rn, 2.) * (0.55 + 0.45 * sin(uTime * 0.7 + lr * 3.)) * 0.6;   // faint violet heart
        vec3 d = uFlash[0].xyz - vLocal;
        float fall = exp(-length(d.xz) / 85.);
        col += uBoltCol * uFlash[0].w * fall * (0.35 + dens * dens * 1.6) * 4.0;
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'well-mist'; mesh.renderOrder = 2;
  return mesh;
}

const FOG_FADE = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogK = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogK = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb *= 1.0 - fogK;
  #endif`;

// ---------------------------------------------------------------------------------------------
// Lightning bolts: jagged crossed ribbons from deep in the well, up the wall and out over the floor.
// Only the bolt named by uStrike.x is drawn, at intensity uStrike.y.
// ---------------------------------------------------------------------------------------------
function buildBolts(rng, shared, count = 6) {
  const pos = [], att = [], idx = [];
  const flashPos = [];
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const ribbon = (pts, w0, w1, id) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      d.subVectors(p1, p0).normalize();
      a.crossVectors(d, Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
      b.crossVectors(d, a).normalize();
      const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
      for (const ax of [a, b]) {
        const base = pos.length / 3, wa = lerp(w0, w1, t0), wb = lerp(w0, w1, t1);
        pos.push(p0.x - ax.x * wa, p0.y - ax.y * wa, p0.z - ax.z * wa, p0.x + ax.x * wa, p0.y + ax.y * wa, p0.z + ax.z * wa,
          p1.x - ax.x * wb, p1.y - ax.y * wb, p1.z - ax.z * wb, p1.x + ax.x * wb, p1.y + ax.y * wb, p1.z + ax.z * wb);
        att.push(id, -1, t0, id, 1, t0, id, -1, t1, id, 1, t1);
        idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
  };
  for (let id = 0; id < count; id++) {
    let phi = (id / count) * TAU + rng.range(-0.4, 0.4);
    const pts = [];
    // inside the well: from the depths up to the lip
    let r = rng.range(8, 60), y = -455;
    const lipR = WELL - 6, lipY = -258, n1 = 11;
    for (let i = 0; i <= n1; i++) {
      const t = i / n1, rr = lerp(r, lipR, Math.pow(t, 1.6)), yy = lerp(y, lipY, t);
      const j = i === 0 || i === n1 ? 0 : 1;
      phi += rng.range(-0.12, 0.12) * j;
      pts.push(new THREE.Vector3(Math.sin(phi) * rr + rng.range(-9, 9) * j, yy + rng.range(-6, 6) * j, Math.cos(phi) * rr + rng.range(-9, 9) * j));
    }
    // out over the funnel floor, hugging the cloud
    const rEnd = rng.range(240, 360), n2 = rng.int(9, 13);
    for (let i = 1; i <= n2; i++) {
      const rr = lerp(lipR, rEnd, i / n2);
      phi += rng.range(-0.11, 0.11);
      pts.push(new THREE.Vector3(Math.sin(phi) * rr, profileY(rr) + rng.range(8, 17), Math.cos(phi) * rr));
    }
    ribbon(pts, 3.2, 1.6, id);
    flashPos.push(pts[n1 - 2].clone().lerp(pts[n1 + 1], 0.5));
    // branches
    const nb = rng.int(3, 5);
    for (let k = 0; k < nb; k++) {
      const s = rng.int(3, pts.length - 3), bp = [pts[s].clone()];
      const dir = new THREE.Vector3().subVectors(pts[s + 1], pts[s]).normalize();
      dir.applyAxisAngle(up, rng.range(0.5, 1.1) * rng.sign());
      const len = rng.int(3, 6);
      for (let i = 1; i <= len; i++) {
        const q = bp[i - 1].clone().addScaledVector(dir, rng.range(10, 18));
        q.x += rng.range(-5, 5); q.z += rng.range(-5, 5);
        const qr = Math.hypot(q.x, q.z);
        q.y = qr > WELL ? profileY(qr) + rng.range(7, 15) : q.y + rng.range(-8, 4);
        bp.push(q);
      }
      ribbon(bp, 1.5, 0.5, id);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aBolt', new THREE.Float32BufferAttribute(att, 3));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...shared, ...FOG_UNIFORMS() },
    vertexShader: /* glsl */`
      attribute vec3 aBolt; uniform vec2 uStrike; uniform float uTime;
      varying vec2 vB;
      #include <fog_pars_vertex>
      void main() {
        vB = aBolt.yz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        if (abs(aBolt.x - uStrike.x) > 0.5 || uStrike.y < 0.02) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec2 uStrike; uniform vec3 uBoltCol; uniform float uTime;
      varying vec2 vB;
      #include <fog_pars_fragment>
      void main() {
        float core = 1. - abs(vB.x);
        float I = uStrike.y * (0.75 + 0.25 * sin(vB.y * 31. + uTime * 47.));
        vec3 col = mix(uBoltCol, vec3(1.), core * core) * (core * core * I * 9.);
        gl_FragColor = vec4(col, 1.);
        ${FOG_FADE}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'bolts'; mesh.renderOrder = 1; mesh.frustumCulled = false;
  return { mesh, flashPos };
}

// ---------------------------------------------------------------------------------------------
// Scud: soft lit cloud puffs. Big ones tumble over the rim cliff, small ones race round the wall.
// ---------------------------------------------------------------------------------------------
function buildScud(rng, shared, twist) {
  const P = [], S = [];
  const add = (r, th, h, size, stretch, kind) => { P.push(r, th, h, size); S.push(rng(), kind, stretch, rng.range(0.75, 1)); };
  for (let i = 0; i < 380; i++) {          // billows crowning the rim cliff
    const r = RIM + rng.range(-62, 34) + rng.gauss() * 8, size = rng.range(26, 54);
    const th = rng() * TAU, dth = Math.atan2(Math.sin(th - 0.15), Math.cos(th - 0.15));
    if (Math.abs(dth) < 0.3) continue;      // keep the fly-through notch over the rim clear
    add(r, th, size * rng.range(0.2, 0.36) + (r < RIM - 20 ? 6 : 0), size, rng.range(1.1, 1.7), 0);
  }
  for (let i = 0; i < 170; i++) {          // low soft banks over the apron, thickest at its ragged edge
    const r = lerp(RIM + 90, R_OUT - 60, Math.pow(rng(), 0.55)), size = rng.range(44, 86);
    const th = rng() * TAU, dth = Math.atan2(Math.sin(th - 0.13), Math.cos(th - 0.13));
    if (Math.abs(dth) < 0.34) continue;     // nothing soft and screen-filling under the approach line
    add(r, th, size * rng.range(0.06, 0.16), size * 0.5, rng.range(2.4, 3.6), 0);
  }
  for (let i = 0; i < 270; i++) {          // wall scud, in loose spiral streets
    const street = rng.int(0, 4), t = rng();
    const r = lerp(215, 735, Math.sqrt(t)) + rng.range(-18, 18);
    const th = street * TAU / 5 - twist * Math.log(r / 200) + rng.gauss() * 0.14;
    const size = rng.range(15, 32) * (0.6 + r / 900);
    add(r, th, rng.range(10, 30) * (0.5 + r / 800), size, rng.range(1.8, 3.2), 1);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4));
  geo.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(S), 4));
  geo.instanceCount = P.length / 4;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...shared, ...FOG_UNIFORMS() },
    vertexShader: /* glsl */`
      #define NTEX(uv, gx, gy) textureLod(uNoise, uv, gx.x)
      ${GLSL_COMMON}
      attribute vec4 aP, aS;
      uniform vec3 uSunDir;
      varying vec2 vQ; varying vec4 vS; varying vec3 vSunView; varying float vY, vNear;
      #include <fog_pars_vertex>
      void main() {
        float r = aP.x;
        float th = aS.y > 0.5 ? aP.y * uSpin + uSpin * eyeOmega(r) * uTime : aP.y;   // rim billows stay put
        float bob = sin(uTime * 0.31 + aS.x * 40.) * 2.5;
        vec3 c = vec3(sin(th) * r, eyeProfile(r) + aP.z + bob, cos(th) * r);
        vY = c.y;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        vNear = smoothstep(25., 110., -mvPosition.z) * mix(0.6, 1., smoothstep(120., 260., -mvPosition.z));    // dissolve rather than fill the screen if the camera comes close
        float breathe = 1. + 0.06 * sin(uTime * 0.23 + aS.x * 17.);
        mvPosition.xy += position.xy * aP.w * breathe * vec2(aS.z, 1.);
        vQ = position.xy; vS = aS;
        vSunView = normalize((viewMatrix * modelMatrix * vec4(uSunDir, 0.)).xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uNoise; uniform float uTime;
      uniform vec3 uSunCol, uIndigo, uTan, uCream, uRust, uRustDark, uPlum;
      varying vec2 vQ; varying vec4 vS; varying vec3 vSunView; varying float vY, vNear;
      #include <fog_pars_fragment>
      void main() {
        vec2 q = vQ;
        vec2 nuv = q * vec2(0.34, 0.2) + vec2(vS.x * 7.31, vS.x * 3.17) + vec2(uTime * 0.004, 0.);
        vec4 n = texture2D(uNoise, nuv);
        vec4 n2 = texture2D(uNoise, nuv * 2.7 + 0.37);
        float d = length(q);
        float a = 1. - smoothstep(0.06, 0.92, d + (n.g - 0.45) * 1.0 + (n2.b - 0.5) * 0.45);     // edges eaten by the noise
        a *= smoothstep(-0.95, -0.15, q.y + (n.r - 0.5) * 0.5) * vNear;
        if (a < 0.01) discard;
        // a small cumulus, not a smudge: sun-struck cream top and sun side, rust and plum underneath
        vec3 Nv = normalize(vec3(q * 1.0 + (vec2(n.r, n2.g) - 0.5) * 1.1, sqrt(max(0.04, 1. - d * d))));
        float top = smoothstep(-0.6, 0.45, q.y + (n.r - 0.5) * 0.8);
        float lit = smoothstep(-0.2, 0.45, dot(Nv, vSunView)) * mix(0.65, 1., n.g) * mix(0.3, 1., top);
        vec3 alb = uCream * 0.8 * mix(0.86, 1., vS.w);
        vec3 shade = mix(uPlum * 1.3 + uRustDark * 0.4, uRust * 0.5 + uPlum * 0.4, 0.25 + 0.75 * n.g);
        vec3 col = alb * uSunCol * lit + shade * (1. - lit * 0.85) + uRust * lit * (1. - lit) * 0.35;
        float dz = smoothstep(-120., -270., vY);
        col = mix(col, uIndigo * 0.5 + col * 0.25, dz * 0.75);
        gl_FragColor = vec4(col, a * mix(0.9, 0.62, vS.y));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'scud'; mesh.renderOrder = 3; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// Floaters: gored gas-bag bell (translucent, veined, cyan inner glow) + core organ, oral arms and
// trailing tendrils. Unit space: bell height 1, origin at the centre of the bell's base, -Z = travel.
// ---------------------------------------------------------------------------------------------
function buildFloaterGeometry(rng) {
  // bell
  const SEG = 60, NR = 26, W = SEG + 1;
  const pos = new Float32Array((NR + 1) * W * 3), uv = new Float32Array((NR + 1) * W * 2);
  for (let j = 0; j <= NR; j++) {
    const t = j / NR;
    let R;
    if (t < 0.42) { const x = t / 0.42; R = 0.4 * Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))); }
    else { const s = (t - 0.42) / 0.58, e = s * s * (3 - 2 * s); R = lerp(0.4, 0.2, Math.pow(e, 0.9)) + 0.1 * Math.pow(smoothstep(0.8, 1, t), 2); }
    const y = 1 - t - 0.03 * Math.sin(t * Math.PI);
    for (let i = 0; i < W; i++) {
      const ph = (i / SEG) * TAU, sn = Math.sin(5 * ph);
      const crease = 1 - 0.075 * Math.exp(-Math.pow(sn / 0.24, 2)) * smoothstep(0.02, 0.18, t);
      const o = j * W + i, rr = R * crease;
      pos[o * 3] = Math.sin(ph) * rr; pos[o * 3 + 1] = y; pos[o * 3 + 2] = Math.cos(ph) * rr;
      uv[o * 2] = i / SEG; uv[o * 2 + 1] = t;
    }
  }
  const idx = [];
  for (let j = 0; j < NR; j++) for (let i = 0; i < SEG; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const bell = new THREE.BufferGeometry();
  bell.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  bell.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  bell.setIndex(idx);
  bell.computeVertexNormals();
  // weld the seam normals
  const nrm = bell.attributes.normal;
  for (let j = 0; j <= NR; j++) {
    const a = j * W, b = j * W + SEG;
    const nx = nrm.getX(a) + nrm.getX(b), ny = nrm.getY(a) + nrm.getY(b), nz = nrm.getZ(a) + nrm.getZ(b), l = Math.hypot(nx, ny, nz) || 1;
    nrm.setXYZ(a, nx / l, ny / l, nz / l); nrm.setXYZ(b, nx / l, ny / l, nz / l);
  }

  // solids: core (kind 0), tendrils (1), oral arms (2).  aK = (kind, t, phase, across)
  const sp = [], sk = [], sn = [], si = [];
  const core = new THREE.SphereGeometry(1, 14, 10);
  { const p = core.attributes.position, n = core.attributes.normal, base = 0;
    for (let i = 0; i < p.count; i++) { sp.push(p.getX(i) * 0.13, 0.5 + p.getY(i) * 0.21, p.getZ(i) * 0.13); sn.push(n.getX(i), n.getY(i), n.getZ(i)); sk.push(0, 0, 0, 0); }
    const ix = core.index.array; for (let i = 0; i < ix.length; i++) si.push(base + ix[i]); core.dispose(); }
  const strip = (x, z, y0, len, w0, w1, nseg, kind, phase, ang) => {
    const base = sp.length / 3, cx = Math.cos(ang), sz = Math.sin(ang);
    for (let i = 0; i <= nseg; i++) {
      const t = i / nseg, w = lerp(w0, w1, Math.pow(t, 0.7)) * (kind === 2 ? 1 + 0.35 * Math.sin(t * 19 + phase * 9) : 1);
      const y = y0 - len * t;
      sp.push(x - cx * w, y, z - sz * w, x + cx * w, y, z + sz * w);
      sn.push(-sz, 0, cx, -sz, 0, cx);
      sk.push(kind, t, phase, -1, kind, t, phase, 1);
      if (i < nseg) { const a = base + i * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  const NT = 14;
  for (let i = 0; i < NT; i++) {
    const ph = (i / NT) * TAU + rng.range(-0.1, 0.1), r = 0.27;
    strip(Math.sin(ph) * r, Math.cos(ph) * r, 0.02, rng.range(0.75, 1.2), 0.03, 0.008, 20, 1, rng(), ph + Math.PI / 2 + rng.range(-0.5, 0.5));
  }
  for (let i = 0; i < 4; i++) {
    const ph = (i / 4) * TAU + 0.4, r = 0.06, len = rng.range(0.55, 0.8), p = rng();
    strip(Math.sin(ph) * r, Math.cos(ph) * r, 0.34, len, 0.075, 0.02, 16, 2, p, ph);
    strip(Math.sin(ph) * r, Math.cos(ph) * r, 0.34, len, 0.075, 0.02, 16, 2, p, ph + Math.PI / 2);
  }
  const solids = new THREE.BufferGeometry();
  solids.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  solids.setAttribute('normal', new THREE.Float32BufferAttribute(sn, 3));
  solids.setAttribute('aK', new THREE.Float32BufferAttribute(sk, 4));
  solids.setIndex(si);
  return { bell, solids };
}

const FLOATER_VERT_COMMON = /* glsl */`
  attribute vec4 aInst;                 // phase, tint, glow, fade
  uniform float uTime;
  float pulseAt(float t) { return sin(uTime * 0.85 + aInst.x * 6.2832 - t * 3.0); }
`;

function buildFloaterMaterials(shared) {
  const membrane = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...shared, ...FOG_UNIFORMS() },
    vertexShader: /* glsl */`
      ${FLOATER_VERT_COMMON}
      varying vec2 vUv; varying vec3 vN, vWorld; varying vec4 vInst;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vInst = aInst;
        float t = uv.y;
        vec3 p = position;
        float sw = 1. + 0.075 * pulseAt(t) * smoothstep(0.15, 1., t);
        sw += 0.05 * sin(uv.x * 62.83 + uTime * 1.4 + aInst.x * 9.) * smoothstep(0.84, 1., t);
        p.xz *= sw;
        p.y += 0.025 * pulseAt(0.) * (1. - t);
        mat4 m = modelMatrix * instanceMatrix;
        vWorld = (m * vec4(p, 1.)).xyz;
        vN = normalize(mat3(m) * normal);
        vec4 mvPosition = viewMatrix * vec4(vWorld, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uNoise; uniform float uTime;
      uniform vec3 uSunDir, uSunCol, uIndigo, uTan, uCream, uRust, uRustDark, uPlum, uCyan;
      uniform mat4 uInvModel;
      varying vec2 vUv; varying vec3 vN, vWorld; varying vec4 vInst;
      #include <fog_pars_fragment>
      void main() {
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vWorld);
        float nv = abs(dot(N, V)), fr = pow(1. - nv, 2.0);
        float t = vUv.y;
        // veins: trunk lines down the gores, branching capillaries from the ridged noise
        float gore = exp(-pow(sin(vUv.x * 31.4159) / 0.085, 2.));
        vec4 n1 = texture2D(uNoise, vec2(vUv.x * 3. + vInst.x, t * 1.3 + vInst.y));
        vec4 n2 = texture2D(uNoise, vec2(vUv.x * 7. + vInst.y, t * 3.1 + vInst.x));
        float vein = max(smoothstep(0.6, 0.82, n1.a), smoothstep(0.66, 0.86, n2.a) * 0.7);
        vein = max(vein, gore * 0.85) * smoothstep(0.03, 0.2, t);
        float mott = n2.g;

        vec3 sunL = normalize(uSunDir);
        float ndl = dot(N, sunL);
        float lit = smoothstep(-0.2, 0.45, ndl);
        float thru = smoothstep(0.2, -0.8, ndl);
        vec3 base = mix(mix(uRust, uTan, 0.25 + 0.3 * vInst.y), uCream, smoothstep(0.04, 0.72, t + (mott - 0.5) * 0.3));
        base = mix(base, uTan, smoothstep(0.8, 1., t) * 0.6) * 0.8;
        vec3 col = base * uSunCol * lit * (0.8 + 0.2 * mott) + mix(uPlum, uRustDark, 0.5) * (1. - lit) * 0.7 + base * uTan * thru * 0.3;
        col = mix(col, uRustDark * 0.5, vein * 0.8);
        col += uCream * fr * lit * 0.35;
        float y = (uInvModel * vec4(vWorld, 1.)).y;
        col = mix(col, uIndigo * 0.4 + col * 0.3, smoothstep(-110., -280., y) * 0.7);

        // inner light: strongest looking straight through the bag, pulsing, bleeding along the veins
        float beat = 0.6 + 0.4 * sin(uTime * 0.85 + vInst.x * 6.2832);
        float inner = pow(nv, 1.6) * smoothstep(0.05, 0.4, t) * (1. - smoothstep(0.75, 1., t) * 0.6);
        beat *= mix(0.3, 1., smoothstep(60., 260., distance(cameraPosition, vWorld)));   // close by, the glow must not clip to white
        col += uCyan * vInst.z * beat * (inner * 0.5 + vein * 1.1 * (0.4 + inner) + fr * 0.2) * 1.5;

        float alpha = mix(0.62, 0.97, fr) + vein * 0.3;
        if (!gl_FrontFacing) alpha *= 0.55;
        gl_FragColor = vec4(col, clamp(alpha, 0., 1.) * vInst.w);
        #include <fog_fragment>
      }`,
  });
  const solid = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...shared, ...FOG_UNIFORMS() },
    vertexShader: /* glsl */`
      ${FLOATER_VERT_COMMON}
      attribute vec4 aK;
      varying vec4 vK, vInst; varying vec3 vN, vWorld;
      #include <fog_pars_vertex>
      void main() {
        vK = aK; vInst = aInst;
        vec3 p = position;
        float t = aK.y, ph = aK.z;
        if (aK.x > 0.5) {
          float amp = aK.x > 1.5 ? 0.05 : 0.11;
          p.x += sin(uTime * 0.7 + ph * 6.28 + t * 5.0 + aInst.x * 5.) * t * t * amp;
          p.z += cos(uTime * 0.55 + ph * 9.1 + t * 4.0) * t * t * amp + t * t * (aK.x > 1.5 ? 0.16 : 0.42);   // drag behind
          p.y += 0.05 * pulseAt(1.) * t;
          p.xz *= 1. + 0.075 * pulseAt(1.) * (1. - t);
        } else {
          p.xz *= 1. + 0.1 * pulseAt(0.5);
        }
        mat4 m = modelMatrix * instanceMatrix;
        vWorld = (m * vec4(p, 1.)).xyz;
        vN = normalize(mat3(m) * normal);
        vec4 mvPosition = viewMatrix * vec4(vWorld, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec3 uSunDir, uSunCol, uIndigo, uTan, uCream, uRust, uRustDark, uPlum, uCyan;
      varying vec4 vK, vInst; varying vec3 vN, vWorld;
      #include <fog_pars_fragment>
      void main() {
        float t = vK.y;
        float beat = (0.6 + 0.4 * sin(uTime * 0.85 + vInst.x * 6.2832)) * mix(0.3, 1., smoothstep(60., 260., distance(cameraPosition, vWorld)));
        vec3 col;
        if (vK.x < 0.5) {
          vec3 V = normalize(cameraPosition - vWorld);
          float rim = 1. - abs(dot(normalize(vN), V));
          col = uCyan * vInst.z * beat * (3.2 + 2.2 * (1. - rim)) + vec3(0.5, 0.9, 1.) * (1. - rim) * beat;
        } else {
          float lit = 0.45 + 0.55 * abs(dot(normalize(vN), normalize(uSunDir)));
          vec3 base = vK.x > 1.5 ? mix(uTan, uRust, t * 0.8) : mix(uRust, vec3(0.42, 0.36, 0.1), t);
          col = base * uSunCol * lit * 0.6 * (1. - 0.3 * abs(vK.w));
          float bead = smoothstep(0.72, 1., sin(t * 26. - uTime * 1.6 + vK.z * 20.));
          col += uCyan * vInst.z * (bead * (0.4 + 2.6 * t) + (1. - t) * (1. - t) * beat * 1.3);
        }
        gl_FragColor = vec4(col * vInst.w, 1.);
        #include <fog_fragment>
      }`,
  });
  return { membrane, solid };
}

// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('storm-eye') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(linColor);
  // per-seed character
  const spin = opts.spin ?? rng.sign();
  const arms = rng.int(4, 6);
  const twist = rng.range(2.8, 3.8);
  const hueShift = rng.range(-0.012, 0.012), rustSat = rng.range(-0.06, 0.1);
  pal[3].offsetHSL(hueShift, rustSat, 0); pal[4].offsetHSL(hueShift, rustSat * 0.5, 0); pal[1].offsetHSL(hueShift * 0.5, 0, 0);
  const seedF = rng.range(1, 90);
  const periods = [rng.range(3.2, 4.3), rng.range(4.8, 6.0), rng.range(6.6, 8.2)];
  const revealU = opts.revealU ?? 0.6;

  const sunDir = new THREE.Vector3().fromArray(opts.sunDir || [-0.38, 0.82, 0.43]).normalize();
  const sunCol = new THREE.Color(opts.sunColor || '#fff4e2').multiplyScalar(opts.sunIntensity ?? 1.1);

  const noise = await makeNoiseTexture(rng.fork ? rng.fork('tex') : rng, ctx);
  const noiseTex = noise.tex;
  await ctx.yield?.();
  const texA = await makeGradTexture(ctx, noise.floats[0], noise.floats[3], noise.size, 2);   // band fbm + ridged
  const texB = await makeGradTexture(ctx, noise.floats[1], noise.floats[2], noise.size, 6);   // billow + fine fbm
  await ctx.yield?.();

  const shared = {
    uNoise: { value: noiseTex }, uTexA: { value: texA.tex }, uTexB: { value: texB.tex },
    uGradScale: { value: new THREE.Vector2(texA.scale, texB.scale) }, uTime: { value: 0 }, uSpin: { value: spin }, uArms: { value: arms }, uTwist: { value: twist },
    uWRim: { value: TAU / 90 },
    uSunDir: { value: sunDir }, uSunDirW: { value: sunDir.clone() }, uSunCol: { value: sunCol },
    uIndigo: { value: pal[0] }, uTan: { value: pal[1] }, uCream: { value: pal[2] }, uRust: { value: pal[3] },
    uRustDark: { value: pal[4] }, uPlum: { value: pal[5] }, uCyan: { value: pal[6] },
    uBoltCol: { value: new THREE.Color(0.62, 0.74, 1.0) },
    uFlash: { value: [new THREE.Vector4(0, -300, 0, 0), new THREE.Vector4(0, -100, 0, 0), new THREE.Vector4(0, -100, 0, 0)] },
    uStrike: { value: new THREE.Vector2(0, 0) },
    uInvModel: { value: new THREE.Matrix4() },
    uApronCut: { value: opts.apronCut ?? 1e6 },
    uWell: { value: new THREE.Vector3().fromArray(opts.wellColor || [0.03, 0.013, 0.065]) },
  };

  const object = new THREE.Group();
  object.name = 'storm-bands-eye';
  const eye = await buildEyeMesh(shared, ctx);
  object.add(eye);
  await ctx.yield?.();
  object.add(buildMist(shared));
  const bolts = buildBolts(rng.fork ? rng.fork('bolts') : rng, shared, 6);
  object.add(bolts.mesh);
  object.add(buildScud(rng.fork ? rng.fork('scud') : rng, shared, twist));
  await ctx.yield?.();

  // ---- Floaters ----
  const nWall = Math.max(0, Math.min(10, opts.floaters ?? 6));
  const nAtt = opts.attendants === false ? 0 : 2;
  const nF = nWall + nAtt + (Array.isArray(opts.pod) ? Math.min(opts.pod.length, 12) : 0);
  const frng = rng.fork ? rng.fork('floaters') : rng;
  const seat = new THREE.Vector3(0, profileY(350) + 120, 350);
  const fl = [];
  for (let i = 0; i < nWall; i++) {
    fl.push({ wall: true, size: frng.range(38, 76), phase: (i + frng.range(-0.22, 0.22)) / nWall, bob: frng.range(0, TAU), hover: frng.range(10, 26) });
  }
  const attPos = [];
  for (let i = 0; i < nAtt; i++) {
    const size = frng.range(40, 50), side = i === 0 ? -1 : 1;
    const p = new THREE.Vector3(side * (85 + frng.range(-4, 4)), seat.y - size * 0.55 + frng.range(-6, 6), seat.z - frng.range(70, 88));
    fl.push({ wall: false, size, base: p, bob: frng.range(0, TAU), yaw: frng.range(-0.5, 0.5) });
    attPos.push(p.clone().setY(p.y + size * 0.5));
  }
  // the drifting pod over the deck (world-supplied): [{ position: [x, y, z] (bell base centre), size, yaw, drift: [ax, az] }]
  const pod = Array.isArray(opts.pod) ? opts.pod.slice(0, 12) : [];
  for (const q of pod) {
    fl.push({ wall: false, size: q.size ?? 50, base: new THREE.Vector3().fromArray(q.position), bob: frng.range(0, TAU), yaw: q.yaw ?? frng.range(-0.6, 0.6), drift: q.drift || [0, 0] });
  }
  const LIFE = 280, PHI0 = 62 * Math.PI / 180, SWEEP = 236 * Math.PI / 180;
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _e = new THREE.Euler();
  // state of wall Floater i at a given time: base position (bell base centre), yaw, scale, fade
  function wallState(f, time, out) {
    const s = (((f.phase + time / LIFE) % 1) + 1) % 1;
    const phi = spin * (PHI0 + SWEEP * s);
    const r = lerp(645, 112, Math.pow(s, 0.85));
    const emerge = smoothstep(0, 0.06, s), sink = smoothstep(0.88, 1, s);
    const amp = clamp(r * 0.05, 5, 38) * 0.8;
    let y = profileY(Math.max(r, WELL + 25)) + amp + f.hover + f.size * 0.95 + Math.sin(time * 0.21 + f.bob) * 4;
    y -= (1 - emerge) * f.size * 1.7 + sink * 190;
    out.pos.set(Math.sin(phi) * r, y, Math.cos(phi) * r);
    // heading: along the spiral, slightly inward
    const dx = spin * Math.cos(phi) - Math.sin(phi) * 0.25, dz = -spin * Math.sin(phi) - Math.cos(phi) * 0.25;
    out.yaw = Math.atan2(-dx, -dz);
    out.scale = f.size * (0.3 + 0.7 * emerge) * (1 - 0.8 * smoothstep(0.93, 1, s));
    out.fade = emerge * (1 - smoothstep(0.95, 1, s));
    return out;
  }
  const st = { pos: new THREE.Vector3(), yaw: 0, scale: 1, fade: 1 };
  let membrane = null, solids = null, instAttr = null;
  if (nF > 0) {
    const fg = buildFloaterGeometry(frng);
    const fm = buildFloaterMaterials(shared);
    fm.membrane.uniforms.uSunDir = shared.uSunDirW; fm.solid.uniforms.uSunDir = shared.uSunDirW;
    const inst = new Float32Array(nF * 4);
    for (let i = 0; i < nF; i++) { inst[i * 4] = frng(); inst[i * 4 + 1] = frng(); inst[i * 4 + 2] = frng.range(0.8, 1.15); inst[i * 4 + 3] = 1; }
    instAttr = new THREE.InstancedBufferAttribute(inst, 4);
    instAttr.setUsage(THREE.DynamicDrawUsage);
    fg.bell.setAttribute('aInst', instAttr); fg.solids.setAttribute('aInst', instAttr);
    solids = new THREE.InstancedMesh(fg.solids, fm.solid, nF);
    membrane = new THREE.InstancedMesh(fg.bell, fm.membrane, nF);
    solids.frustumCulled = membrane.frustumCulled = false;
    solids.name = 'floater-solids'; membrane.name = 'floater-membrane';
    membrane.renderOrder = 4;
    object.add(solids, membrane);
  }
  function placeFloaters(time) {
    if (!nF) return;
    for (let i = 0; i < nF; i++) {
      const f = fl[i];
      let fade = 1;
      if (f.wall) {
        wallState(f, time, st);
        _p.copy(st.pos); _s.setScalar(Math.max(st.scale, 0.001)); fade = st.fade;
        _e.set(0.1, st.yaw, 0, 'YXZ');
      } else {
        _p.copy(f.base); _p.y += Math.sin(time * 0.24 + f.bob) * 3.5; _p.x += Math.sin(time * 0.13 + f.bob * 2) * 2;
        if (f.drift) { _p.x += Math.sin(time * 0.05 + f.bob) * f.drift[0]; _p.z += Math.cos(time * 0.043 + f.bob * 1.7) * f.drift[1]; }
        _s.setScalar(f.size);
        _e.set(0.04 * Math.sin(time * 0.2 + f.bob), f.yaw + Math.sin(time * 0.07 + f.bob) * 0.3, 0, 'YXZ');
      }
      _q.setFromEuler(_e);
      _m.compose(_p, _q, _s);
      solids.setMatrixAt(i, _m); membrane.setMatrixAt(i, _m);
      instAttr.array[i * 4 + 3] = fade;
    }
    solids.instanceMatrix.needsUpdate = true; membrane.instanceMatrix.needsUpdate = true; instAttr.needsUpdate = true;
  }
  placeFloaters(0);

  // ---- lightning schedule (pure function of time + seed) ----
  function strike(time, slot) {
    const P = periods[slot], k = Math.floor(time / P), lt = time - k * P;
    const h1 = hash01(k, slot, seedF), h2 = hash01(k, slot + 9.1, seedF), h3 = hash01(k + 0.5, slot + 3.7, seedF);
    const dt = lt - h1 * P * 0.5;
    let I = 0;
    if (dt >= 0 && dt < 1.0) {
      const n = 2 + Math.floor(h2 * 3);
      for (let j = 0; j < n; j++) {
        const tj = dt - j * (0.09 + 0.06 * hash01(k, j, slot));
        if (tj >= 0) I += Math.exp(-tj * 12) * (j === 0 ? 1 : 0.55 + 0.45 * hash01(j, k, 3.3));
      }
    }
    return { I: Math.min(I, 1.3), h2, h3 };
  }
  let progress = -1;
  function updateLightning(time) {
    const fa = shared.uFlash.value;
    const s0 = strike(time, 0);
    let id = Math.floor(s0.h3 * 6) % 6, I0 = s0.I;
    if (progress >= 0) {      // the arrival barrage, keyed to path progress
      const A = smoothstep(revealU - 0.004, revealU + 0.004, progress) * (1 - smoothstep(revealU + 0.03, revealU + 0.06, progress));
      if (A > 0.01) {
        const fl2 = 0.5 + 0.5 * Math.abs(Math.sin(time * 21)) * (0.6 + 0.4 * Math.sin(time * 57));
        const Ia = A * fl2 * 1.25;
        if (Ia > I0) { I0 = Ia; id = Math.floor(time * 3.5) % 6; }
      }
    }
    const fp = bolts.flashPos[id];
    fa[0].set(fp.x, fp.y, fp.z, I0);
    shared.uStrike.value.set(id, I0);
    for (let s = 1; s < 3; s++) {
      const q = strike(time, s);
      const r = lerp(230, 720, q.h2), th = q.h3 * TAU;
      fa[s].set(Math.sin(th) * r, profileY(r) + 4, Math.cos(th) * r, q.I * 0.85);
    }
  }
  updateLightning(0);

  // ---- anchors ----
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: seat.clone(), facing: V(0, 0, 1) },
    flyThrough: [V(150, 95, 1250), V(135, 80, 1000), V(115, 68, 815), V(75, 40, 660), V(35, -5, 540), V(8, -32, 462), V(0, seat.y, 450), seat.clone()],
    viewpoints: [
      { position: V(60, 60, 1900), lookAt: V(0, -40, 0), note: 'edge-on: the Eye is a dark notch in the deck horizon' },
      { position: V(115, 68, 815), lookAt: V(0, -150, 0), note: 'rim reveal: the deck falls away and the spiral opens' },
      { position: V(35, -5, 540), lookAt: V(-spin * 260, -120, -140), note: 'banked pass along the inner wall, Floaters beyond' },
    ],
    lookAt: V(0, -150, 0), wellCenter: V(0, -250, 0),
    rimRadius: RIM, wellRadius: WELL, apronRadius: R_OUT - 30,
    attendants: attPos,
    spin,
    floaterPosition(i, time, target = new THREE.Vector3()) {
      const f = fl[Math.max(0, Math.min(nWall - 1, i))];
      if (!f) return target.set(0, 0, 0);
      wallState(f, time, st);
      return target.copy(st.pos).setY(st.pos.y + st.scale * 0.5);
    },
  };

  const _w = new THREE.Vector3();
  return {
    object,
    radius: RIM, height: 520,
    center: new THREE.Vector3(0, 90, 0),     // orbit-viewer framing point; use anchors.lookAt for POIs
    anchors, uniforms: shared,
    ground: false, groundY: 0,
    setProgress(u) { progress = u; },
    update(dt, time, camera) {
      shared.uTime.value = time;
      shared.uInvModel.value.copy(object.matrixWorld).invert();
      shared.uSunDirW.value.copy(_w.copy(sunDir).transformDirection(object.matrixWorld));
      updateLightning(time);
      placeFloaters(time);
    },
    dispose() { noiseTex.dispose(); texA.tex.dispose(); texB.tex.dispose(); },
  };
}
