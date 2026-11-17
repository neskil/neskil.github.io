// HERO SET PIECE for "lanterns-under-ice": THE LEVIATHAN.
//
// WHAT IT IS
//   A 140 m eel-whale with a translucent body. Through the skin you see a glowing spinal cord with nerve
//   packets running head -> tail, a rib cage, gill arches, a slowly double-beating orange heart, a chain of
//   pulsing organs and a gut with travelling lumps of light. Rows of cyan photophores run along flanks and
//   belly in travelling waves. Huge feathered pectoral fans, pelvic fans, a feathered dorsal + ventral crest,
//   tail streamers, chin barbels tipped with lanterns, three ringed eyes per side, a soft halo of its own
//   light in the water and a few hundred attendant motes stirred along its flanks.
//   It swims with an eel wave (vertex shader) and BENDS ALONG ITS OWN BUILT-IN FLY-BY PATH (see below).
//
// LOCAL SPACE (not the usual base-centre origin, because this hero performs a pass)
//   Origin = the PASS POINT: where the world's camera should be when the Leviathan is directly overhead.
//   +Y up. The Leviathan faces and travels toward +Z; the camera is expected to fly toward -Z along the
//   line x = 0, y = 0 (anchors.flyThrough). The beast comes up out of the dark ahead-left of that camera
//   (-X, -Z, below), crosses diagonally over the origin with its belly ~25 m above it and leaves high and
//   behind-right. Place hero.object at the camera-path point for u ~ 0.55 and yaw it so local -Z is the
//   path tangent there (object.rotation.y = atan2(tangent.x, tangent.z) + Math.PI). Keep that stretch of
//   the camera path straight and level for ~200 m either side if you can.
//
// PROGRESS HOOK (never wall-clock)
//   setProgress(p)   p = 0..1 along the fly-by; p = 0.5 puts mid-body exactly over the origin. One unit of
//                    p is hero.travel metres of swimming (about 760). For a 13 m/s beast in a world of
//                    `duration` seconds passing at u0 = 0.55:   p = 0.5 + (u - u0) * duration * 13 / hero.travel
//                    The head is over the origin ~70 m (5 s) before that. Never called => p stays at
//                    opts.progress (0.5, the display pose).
//   setReveal(v)     -0.35..1.6 strength of "its light reveals the valley" (photophores, halo, PointLight).
//                    Default (or setReveal(null)) = automatic bell around p = 0.5 lasting ~6 s at 13 m/s.
//   gazePosition(out)   WORLD-space point for the camera poi: the head while it approaches, then sliding back
//                    along the belly as the body passes overhead
//                    (pois: [{ at: () => hero.gazePosition(v), from: 0.42, to: 0.68, weight: 0.7 }]).
//   headPosition(out), centerPosition(out), bodyPosition(s, out)   other WORLD-space points on the spine
//                    (s = metres from mid-body, +62 head ... -70 tail). hero is also at object.userData.hero.
//   light            the single THREE.PointLight (cyan, rides under the chest, intensity = opts.lightPower *
//                    reveal, distance 340). Remove it from hero.object if the world lights the valley itself.
//   uniforms         shared uniform block (uAmbTop, uAmbBot, uGlowCol, uReveal, ...) for tuning.
//
// OPTS
//   palette     7 hex strings in brief order (pale ice, sea blue, deep blue, abyss, black, cyan, vent orange)
//   progress    initial progress (default 0.5)
//   lightPower  PointLight intensity in candela at reveal = 1 (default 12000; 0 = no light created)
//   passHeight  height of the spine over the origin at the pass (default per-seed 34.5-37; belly is ~10 m lower)
//   ambTop / ambBot   hex colours of the dim light from the ice above / vents below on its skin
//   motes       true | false attendant motes (default true)
//   midFans     true | false third pair of feathered fans behind the pectorals (default per-seed, ~45%)
//
// ANCHORS (local space)
//   passPoint      (0,0,0) camera position at p = 0.5          cameraDir   (0,0,-1) camera heading there
//   flyThrough     ordered points of the safe camera line (+Z -> -Z through the origin). With the camera
//                  synced as above (0.5-3x the beast's speed) the body stays ~25 m and the lowest fin tips
//                  and barbel lanterns at least ~8 m above it; far from the pass the beast is 30+ m to the side.
//   riseFrom       where it emerges from the dark (path point ~330 m before the pass)
//   leaveTo        where it disappears afterwards
//   apex           spine position over the origin at p = 0.5 (== center)
//   viewpoints     [{ position, target, note }] good static vantage points at p = 0.5
//   (no portalSeat: the portal lives in the chimney ring, not on the Leviathan)
//
// SIZE / COST
//   radius 75 (half length), height 42 (fin tips to crest), 94-100k triangles, 5 draw calls (+1 PointLight),
//   one 512x3 half-float texture (the path), build ~100-250 ms. All meshes have frustumCulled = false (they are bent in the vertex shader).
//
// LIGHTING IT EXPECTS
//   None from the scene: it is self-lit (unlit shaders, linear HDR, emitters 2-7 so they bloom) plus a dim
//   two-tone ambient of its own (uAmbTop/uAmbBot). Wants near-black blue water fog (it honours scene fog;
//   emitters are fogged a little less than skin so the lights arrive before the body does), bloom threshold
//   ~0.9, and a dark background: against a bright sky the translucent body goes flat.
//
// WORLD HELPERS
//   trackPoint(d, out)  LOCAL-space point of the swim track, d metres after (+) or before (-) the pass point.
//                    The world uses it to carve the sea bed below and lift the ice ceiling above the beast.
//   progressAt(u, duration, u0, speed)  the setProgress value for a camera at path fraction u.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, bell } from '../kit/core.js';

const LEN = 140, HEAD_Z = 70, PATH_N = 512;
const DEFAULT_PALETTE = ['#9fe8ff', '#1c6f8f', '#0a2f4f', '#04121f', '#010409', '#19ffd0', '#ff7a3c'];
// photophore rows as sin(theta) around the body section (+1 = back, -1 = belly); shared by JS and GLSL
const ROWS = [0.24, -0.1, -0.44, -0.93];

// ------------------------------------------------------------------------------------------------ GLSL
const GLSL_DEFORM = /* glsl */`
uniform sampler2D uPath;
uniform float uPathLen, uPathN, uDist, uSwimPh, uSwimAmp, uSwimK, uTime, uReveal, uWavePh, uWaveK;
const float HEAD_Z = 70.0;
const float LEN = 140.0;
void levPath(float d, out vec3 P, out vec3 T) {
  float f = clamp(d / uPathLen, 0.0, 1.0) * (uPathN - 1.0);
  float i = min(floor(f), uPathN - 2.0);
  float k = f - i;
  ivec2 a = ivec2(int(i), 0);
  P = mix(texelFetch(uPath, a, 0).xyz + texelFetch(uPath, a + ivec2(0, 2), 0).xyz, texelFetch(uPath, a + ivec2(1, 0), 0).xyz + texelFetch(uPath, a + ivec2(1, 2), 0).xyz, k);
  T = normalize(mix(texelFetch(uPath, a + ivec2(0, 1), 0).xyz, texelFetch(uPath, a + ivec2(1, 1), 0).xyz, k));
}
// p, n: rest pose in body space (spine on the z axis, head at +70). Returns the object-space position.
vec3 levDeform(vec3 p, inout vec3 n) {
  float t = clamp((HEAD_Z - p.z) / LEN, 0.0, 1.4);
  float amp = uSwimAmp * (0.07 + 0.93 * t * t);
  float ph = p.z * uSwimK + uSwimPh;
  float sx = amp * sin(ph);
  float slope = amp * uSwimK * cos(ph);
  float sy = 0.2 * amp * sin(ph * 0.5 + 1.3);
  float roll = 0.45 * slope;
  float cr = cos(roll), sr = sin(roll);
  vec2 xy = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr);
  n = vec3(n.x * cr - n.y * sr, n.x * sr + n.y * cr, n.z);
  n = normalize(vec3(n.x + slope * n.z, n.y, n.z - slope * n.x));
  vec3 P, T;
  levPath(uDist + p.z - slope * xy.x, P, T);
  vec3 B = normalize(cross(vec3(0.0, 1.0, 0.0), T));
  vec3 N = cross(T, B);
  n = normalize(B * n.x + N * n.y + T * n.z);
  return P + B * (xy.x + sx) + N * (xy.y + sy);
}
`;

const GLSL_FOGF = /* glsl */`
float levFog() {
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * 0.55);   // its lights carry further than rock does: it reads whole from 150 m
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.0;
  #endif
}
`;

const GLSL_NOISE = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
`;

// ------------------------------------------------------------------------------------------------ body profile
// t = 0 at the nose, 1 at the tail tip. Returns half width, half height, top/bottom scale and spine height.
function makeProfile(girth) {
  return function prof(t) {
    const nose = t < 0.14 ? Math.pow(Math.sin((t / 0.14) * Math.PI * 0.5), 0.48) : 1;
    const tau = Math.max(0, (t - 0.14) / 0.86);
    const und = 1 + 0.035 * Math.sin(t * 31) * smoothstep(0.2, 0.4, t);
    const W = girth * 10.2 * nose * Math.pow(1 - tau, 1.22) * und + 0.1;
    const H = girth * 8.6 * nose * Math.pow(1 - tau, 0.9) * und + 0.3;
    const top = 0.8 + 0.2 * smoothstep(0.05, 0.35, t);
    const bot = 1 + 0.3 * bell(t, 0.0, 0.44, 0.45);
    const keel = 0.12 * smoothstep(0.18, 0.4, t);
    return { W, H, top, bot, keel, spineY: H * top * 0.42 };
  };
}
// point on the skin for section t at angle (c = cos, s = sin; s = +1 is the back). out = [x, y]
function skin(pr, c, s, out) {
  const cx = Math.sign(c) * Math.pow(Math.abs(c), 0.86);
  out[0] = pr.W * cx;
  out[1] = s > 0 ? pr.H * pr.top * s * (1 + pr.keel * Math.pow(s, 6)) : pr.H * pr.bot * s;
  return out;
}

// growable attribute bundle
function makeBuf(spec) {
  const b = { n: 0, idx: [], a: {} };
  for (const k in spec) b.a[k] = { size: spec[k], d: [] };
  b.toGeometry = (normals) => {
    const g = new THREE.BufferGeometry();
    for (const k in b.a) g.setAttribute(k, new THREE.Float32BufferAttribute(b.a[k].d, b.a[k].size));
    g.setIndex(b.idx);
    if (normals) g.computeVertexNormals();
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 900);
    return g;
  };
  return b;
}

// ------------------------------------------------------------------------------------------------ fly-by path
function buildPath(rng, passHeight) {
  const lat = rng.range(0.85, 1.2), dep = rng.range(0.9, 1.15), aft = rng.range(0.7, 1.3);
  const h = passHeight;
  const cps = [
    [-215 * lat, -70 * dep, -560], [-160 * lat, -58 * dep, -420], [-105 * lat, -40 * dep, -290],
    [-62 * lat, -18 * dep, -185], [-31 * lat, 8, -105], [-10, h - 6, -45], [0, h, 0], [12, h + 3.5, 60],
    [34 * aft, h + 7, 160], [64 * aft, h + 11, 280], [100 * aft, h + 16, 420], [140 * aft, h + 21, 560],
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(cps, false, 'centripetal');
  curve.arcLengthDivisions = 1600;
  const len = curve.getLength();
  const pts = curve.getSpacedPoints(PATH_N - 1);
  let mid = 0, best = 1e9;
  for (let i = 0; i < PATH_N; i++) { const d = pts[i].x * pts[i].x + pts[i].z * pts[i].z; if (d < best) { best = d; mid = i; } }
  const ox = pts[mid].x, oz = pts[mid].z;
  // half-float texture, three rows: position rounded to 8 m (exact in a half float), tangent, and the position's remainder
  // (under 4 m, so a few millimetres fine): the shader adds rows 0 and 2
  const data = new Uint16Array(PATH_N * 3 * 4), hf = THREE.DataUtils.toHalfFloat, c8 = (v) => Math.round(v / 8) * 8;
  const tan = [];
  for (let i = 0; i < PATH_N; i++) {
    pts[i].x -= ox; pts[i].z -= oz;
  }
  for (let i = 0; i < PATH_N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(PATH_N - 1, i + 1)];
    const t = new THREE.Vector3().subVectors(b, a).normalize(); tan.push(t);
    const p = pts[i], cx = c8(p.x), cy = c8(p.y), cz = c8(p.z);
    data.set([hf(cx), hf(cy), hf(cz), hf(1)], i * 4);
    data.set([hf(t.x), hf(t.y), hf(t.z), hf(0)], (PATH_N + i) * 4);
    data.set([hf(p.x - cx), hf(p.y - cy), hf(p.z - cz), hf(0)], (2 * PATH_N + i) * 4);
  }
  const tex = new THREE.DataTexture(data, PATH_N, 3, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const dMid = (mid / (PATH_N - 1)) * len;
  const travel = 2 * Math.min(dMid - 115, len - dMid - 85);
  // CPU sampler: position (and optional tangent) at arc distance d
  function at(d, P, T) {
    const f = clamp(d / len, 0, 1) * (PATH_N - 1), i = Math.min(Math.floor(f), PATH_N - 2), k = f - i;
    P.lerpVectors(pts[i], pts[i + 1], k);
    if (T) T.lerpVectors(tan[i], tan[i + 1], k).normalize();
    return P;
  }
  return { tex, len, dMid, travel, at };
}

// ------------------------------------------------------------------------------------------------ shaders
const SHELL_VERT = /* glsl */`
attribute vec3 aBT;
varying vec3 vBT, vWN, vWP;
#include <fog_pars_vertex>
${GLSL_DEFORM}
void main() {
  vec3 n = normal;
  vec3 q = levDeform(position, n);
  vec4 wp = modelMatrix * vec4(q, 1.0);
  vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * n); vBT = aBT;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHELL_FRAG = /* glsl */`
uniform vec3 uGlowCol, uRimCol, uAmbTop, uAmbBot, uInnerCol, uSkinBack, uSkinBelly, uPale;
uniform float uTime, uReveal, uWavePh, uWaveK, uRowPh, uPackK, uPackW;
varying vec3 vBT, vWN, vWP;
#include <fog_pars_fragment>
${GLSL_FOGF}
${GLSL_NOISE}
float rowWave(float t, float ph) { return pow(0.5 + 0.5 * sin(t * uWaveK - uWavePh + ph), 3.0); }
void main() {
  float t = vBT.x;
  float rl = max(length(vBT.yz), 1e-4);
  float sn = vBT.z / rl, cs = vBT.y / rl;
  float th = atan(sn, abs(cs));
  vec3 V = normalize(cameraPosition - vWP);
  vec3 N = normalize(vWN);
  #ifdef LEV_BACK
    N = -N;
  #endif
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.5);
  float belly = smoothstep(0.15, -0.65, sn);
  float girthU = th * (2.0 + 9.0 * (1.0 - t));
  float mott = vn(vec2(t * 85.0, girthU * 1.3)) * 0.6 + vn(vec2(t * 260.0, girthU * 4.0)) * 0.4;
  // throat pleats on the underside of the front third
  float pleatZone = belly * smoothstep(0.012, 0.05, t) * (1.0 - smoothstep(0.33, 0.44, t));
  float pleat = smoothstep(0.3, 0.0, abs(sin(th * 22.0 + (mott - 0.5) * 0.5))) * pleatZone;
  // myomere chevrons (muscle bands seen through the skin)
  float cph = t * (LEN_M / 2.4) * 6.2832 + abs(sn - 0.1) * 5.0;
  float chev = smoothstep(0.8, 1.0, sin(cph)) * smoothstep(0.1, 0.2, t);
  // freckle photophores scattered over back and flanks
  vec2 fu = vec2(t * 190.0, girthU * 1.6);
  vec2 cell = floor(fu);
  float r = h21(cell);
  vec2 fp = fract(fu) - 0.5 - (vec2(h21(cell + 3.1), h21(cell + 7.7)) - 0.5) * 0.6;
  float star = step(0.84, r) * smoothstep(0.17, 0.0, length(fp)) * (0.45 + 0.55 * sin(uTime * (0.5 + r * 2.0) + r * 40.0));
  star *= (1.0 - belly * 0.5) * (0.35 + rowWave(t, 1.0));
  // lateral line, jaw line, baleen comb
  float ll = exp(-pow((sn - 0.06) / 0.018, 2.0)) * smoothstep(0.1, 0.16, t);
  float snj = -0.2 - 0.55 * smoothstep(0.1, 0.19, t);
  float headWin = (1.0 - smoothstep(0.185, 0.2, t)) * smoothstep(0.004, 0.02, t);
  float jaw = exp(-pow((sn - snj) / 0.03, 2.0)) * headWin;
  float bl = smoothstep(snj, snj - 0.02, sn) * exp(-(snj - sn) * 9.0) * headWin * (0.5 + 0.5 * sin(t * 900.0));
  // light the skin receives from the photophore rows
  float pg = 0.0;
  pg += exp(-pow((sn - (${ROWS[0].toFixed(3)})) / 0.085, 2.0)) * (0.25 + rowWave(t, 0.0));
  pg += exp(-pow((sn - (${ROWS[1].toFixed(3)})) / 0.085, 2.0)) * (0.25 + rowWave(t, uRowPh));
  pg += exp(-pow((sn - (${ROWS[2].toFixed(3)})) / 0.085, 2.0)) * (0.25 + rowWave(t, uRowPh * 2.0));
  pg += exp(-pow((sn - (${ROWS[3].toFixed(3)})) / 0.12, 2.0)) * (0.25 + rowWave(t, uRowPh * 3.0));
  vec3 alb = mix(uSkinBack, uSkinBelly, belly) * (0.65 + 0.7 * mott);
  alb *= 1.0 - 0.55 * pleat;
  alb += uSkinBelly * 0.25 * chev;
  float scute = smoothstep(0.8, 1.0, sin(t * 733.0)) * smoothstep(-0.62, -0.88, sn) * smoothstep(0.38, 0.46, t);
  alb *= 1.0 - 0.5 * scute;
  float f = levFog();
  #ifdef LEV_BACK
    // inner wall, seen through the front skin: lit from the spinal cord
    float topness = smoothstep(-0.3, 0.9, sn);
    float pack = pow(0.5 + 0.5 * sin(t * uPackK - uTime * uPackW), 6.0);
    vec3 col = alb * uAmbTop * 0.12
             + uInnerCol * (0.035 + 0.07 * topness + 0.16 * pack * (0.3 + 0.7 * topness)) * (0.5 + 0.8 * mott) * (1.0 + 2.0 * chev);
    col *= 1.0 - smoothstep(0.75, 1.0, t) * 0.6;
    col = mix(col, fogColor, f);
    gl_FragColor = vec4(col, 1.0);
  #else
    vec3 lit = alb * (uAmbTop * (0.55 + 0.45 * N.y) + uAmbBot * (0.5 - 0.5 * N.y) + uGlowCol * pg * 0.55 * (0.6 + 0.5 * uReveal));
    vec3 emis = uGlowCol * (ll * 0.9 * (0.3 + rowWave(t, 0.5)) + star * 2.4) + uPale * (jaw * 0.5 + bl * 0.9);
    emis *= 0.6 + 0.5 * uReveal;
    vec3 rim = uRimCol * fres * (0.3 + 0.3 * uReveal);
    float alpha = mix(0.26, 0.9, fres) + (0.5 + 0.5 * sn) * 0.22 + pleat * 0.2 + scute * 0.18 + chev * 0.06 + (mott - 0.5) * 0.12;
    alpha += 0.25 * (1.0 - smoothstep(0.03, 0.14, t));
    alpha = clamp(alpha, 0.05, 0.96);
    vec3 col = lit * alpha + rim + emis;
    col = mix(col, fogColor * alpha, f);
    gl_FragColor = vec4(col, alpha);
  #endif
}`.replace(/LEN_M/g, LEN.toFixed(1));

const INNER_VERT = /* glsl */`
attribute vec3 aCol;
attribute vec4 aCen, aPar;
varying vec3 vCol, vWN, vWP;
varying vec2 vGS;
uniform float uPackK, uPackW;
#include <fog_pars_vertex>
${GLSL_DEFORM}
void main() {
  float kind = aCen.w;
  float tt = (HEAD_Z - position.z) / LEN;
  float pk;
  if (kind < 0.5) pk = pow(0.5 + 0.5 * sin(tt * uPackK - uTime * uPackW + aPar.w), 10.0);          // nerve packets
  else if (kind < 1.5) pk = 0.5 + 0.5 * sin(uTime * 0.7 + aPar.w);                                 // organ breathing
  else if (kind < 2.5) { float x = fract(uTime * 0.21 + aPar.w); pk = exp(-x * x * 90.0) + 0.7 * exp(-pow(x - 0.2, 2.0) * 120.0); } // heart
  else pk = pow(0.5 + 0.5 * sin(tt * 55.0 - uTime * 0.9 + aPar.w), 4.0);                           // gut lumps
  vec3 p = aCen.xyz + (position - aCen.xyz) * (1.0 + aPar.z * pk);
  vec3 n = normal;
  vec3 q = levDeform(p, n);
  vec4 wp = modelMatrix * vec4(q, 1.0);
  vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * n);
  vCol = aCol; vGS = vec2(aPar.x + aPar.y * pk, kind > 0.5 ? 1.0 : 0.0);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const INNER_FRAG = /* glsl */`
uniform float uReveal;
varying vec3 vCol, vWN, vWP;
varying vec2 vGS;
#include <fog_pars_fragment>
${GLSL_FOGF}
void main() {
  float ndv = abs(dot(normalize(vWN), normalize(cameraPosition - vWP)));
  float I = vGS.x * mix(0.75 + 0.25 * ndv, 0.2 + 1.15 * pow(ndv, 1.6), vGS.y);
  vec3 col = vCol * I * (0.65 + 0.4 * uReveal);
  col = mix(col, fogColor, levFog() * 0.8);
  gl_FragColor = vec4(col, 1.0);
}`;

const FIN_VERT = /* glsl */`
attribute vec4 aBend, aFin;
varying vec2 vUv;
varying vec4 vFin;
varying vec3 vWN, vWP;
uniform float uFlapW;
#include <fog_pars_vertex>
${GLSL_DEFORM}
void main() {
  float v = uv.y;
  vec3 p = position + aBend.xyz * (v * v) * sin(uTime * uFlapW + aBend.w - v * 1.7)
         + aBend.xyz * 0.12 * v * sin(uTime * uFlapW * 2.3 + aBend.w * 1.7 - v * 5.0);
  vec3 n = normal;
  vec3 q = levDeform(p, n);
  vec4 wp = modelMatrix * vec4(q, 1.0);
  vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * n); vUv = uv; vFin = aFin;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FIN_FRAG = /* glsl */`
uniform vec3 uGlowCol, uAmbTop, uAmbBot, uMembCol, uPale;
uniform float uTime, uReveal, uWavePh, uWaveK;
varying vec2 vUv;
varying vec4 vFin;
varying vec3 vWN, vWP;
#include <fog_pars_fragment>
${GLSL_FOGF}
${GLSL_NOISE}
void main() {
  float u = vUv.x, v = vUv.y, au = abs(u);
  float seed = vFin.y;
  float rk = max(150.0 / (1.0 + pow(fwidth(u) * 10.0, 2.0)), 24.0);
  float rach = exp(-u * u * rk);
  float wave = pow(0.5 + 0.5 * sin(vFin.z * uWaveK - uWavePh - v * 2.5 + 0.6), 2.0);
  float root = smoothstep(0.0, 0.05, v);
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  float graze = 1.0 - abs(dot(N, V));
  vec3 col; float alpha;
  if (vFin.x > 0.5) {                                   // filament (barbels)
    float ws = 1.0 + 12.0 * smoothstep(0.78, 0.84, v);
    float thread = exp(-u * u * rk * ws * ws);
    float bulb = exp(-(u * u * 6.8 + pow((v - 0.91) * vFin.w, 2.0)));
    alpha = (thread * 0.5 + bulb * 0.3) * root;
    col = uMembCol * alpha * uAmbTop + (uGlowCol * thread * (0.5 + 1.3 * wave) + mix(uGlowCol, uPale, 0.6) * bulb * (2.4 + 0.9 * sin(uTime * 0.8 + seed * 20.0))) * (0.55 + 0.55 * uReveal);
  } else {
    float ragged = 0.66 + 0.34 * vn(vec2(v * 40.0 + seed * 31.0, seed * 7.0 + sign(u) * 3.0));
    float edge = 1.0 - smoothstep(ragged - 0.2, ragged, au);
    float bc = (v - 0.07 * au) * 34.0;
    float barb = pow(0.5 + 0.5 * cos(bc * 6.2832), 2.0);
    barb = mix(barb, 0.4, smoothstep(0.25, 0.8, fwidth(bc)));
    float gap = smoothstep(0.16, 0.24, vn(vec2(bc * 0.5 + seed * 13.0, sign(u) * 2.0 + seed)));
    float memb = edge * (0.14 + 0.5 * barb * gap) * (1.0 - 0.4 * v) + graze * graze * 0.25 * edge;
    alpha = clamp(memb + rach * 0.5, 0.0, 0.9) * root;
    vec3 lit = uMembCol * (uAmbTop * 0.6 + uAmbBot * 0.4 + uGlowCol * 0.3 * (0.4 + wave) * (0.6 + 0.5 * uReveal));
    vec3 emis = uGlowCol * (rach * (0.45 + 1.7 * wave) + barb * gap * edge * 0.09 * (0.4 + wave)) * vFin.w
              + mix(uGlowCol, uPale, 0.6) * exp(-u * u * 6.0) * exp(-pow((0.95 - v) * 16.0, 2.0)) * 1.6;
    col = lit * alpha + emis * root * (0.55 + 0.55 * uReveal);
  }
  float f = levFog();
  col = mix(col, fogColor * alpha, f * 0.9);
  gl_FragColor = vec4(col, alpha);
}`;

const SPRITE_VERT = /* glsl */`
attribute vec3 aCol;
attribute vec4 aInfo;       // size, kind (0 photophore, 1 eye, 2 halo, 3 mote, 4 lantern), phase, brightness
varying vec2 vUv;
varying vec3 vCol;
varying float vKind;
#include <fog_pars_vertex>
${GLSL_DEFORM}
void main() {
  vec3 a = position;
  float kind = aInfo.y, ph = aInfo.z;
  float I = aInfo.w;
  if (kind > 2.5 && kind < 3.5) {
    float h1 = fract(ph * 7.31), h2 = fract(ph * 3.17), h3 = fract(ph * 5.71);
    float zz = mod(a.z - uTime * (2.5 + 4.5 * h1) + 115.0, 200.0) - 115.0;
    float tt = clamp((HEAD_Z - zz) / LEN, 0.0, 1.0);
    float ang = a.x + uTime * (0.04 + 0.1 * h2) * (h3 > 0.5 ? 1.0 : -1.0) + sin(zz * 0.05 + ph) * 0.5;
    float rr = a.y * (0.5 + 0.65 * (1.0 - tt) * smoothstep(-0.05, 0.12, tt + 0.05));
    a = vec3(cos(ang) * rr, sin(ang) * rr * 0.82, zz);
    I *= (0.5 + 0.5 * sin(uTime * (1.0 + 2.0 * h2) + ph * 20.0)) * smoothstep(-115.0, -95.0, zz) * (1.0 - smoothstep(70.0, 85.0, zz));
  } else if (kind < 0.5) {
    float tt = (HEAD_Z - a.z) / LEN;
    I *= (0.18 + 3.2 * pow(0.5 + 0.5 * sin(tt * uWaveK - uWavePh + ph), 3.0)) * (0.65 + 0.6 * uReveal);
  } else if (kind > 1.5 && kind < 2.5) {
    I *= (0.35 + 0.85 * uReveal) * (0.85 + 0.15 * sin(uTime * 0.4 + ph));
  } else if (kind > 3.5) {
    I *= 0.7 + 0.3 * sin(uTime * 0.8 + ph);
  }
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec3 q = levDeform(a, n);
  vec4 mvPosition = modelViewMatrix * vec4(q, 1.0);
  float sz = aInfo.x;
  float szMin = -mvPosition.z * 0.0019;
  if (kind < 2.0 || kind > 2.5) { I *= clamp(sz / max(szMin, 1e-3), 0.45, 1.0); sz = max(sz, szMin); }
  I *= 1.0 - smoothstep(210.0, 320.0, -mvPosition.z);     // far off, its lights go out before they shrink to one hot pixel
  mvPosition.xy += uv * sz;
  vUv = uv; vCol = aCol * I; vKind = kind;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SPRITE_FRAG = /* glsl */`
varying vec2 vUv;
varying vec3 vCol;
varying float vKind;
#include <fog_pars_fragment>
${GLSL_FOGF}
void main() {
  float d = length(vUv);
  float g;
  if (vKind > 0.5 && vKind < 1.5) g = exp(-pow((d - 0.56) / 0.13, 2.0)) + 0.5 * exp(-d * d * 45.0);
  else if (vKind > 1.5 && vKind < 2.5) g = pow(max(1.0 - d, 0.0), 2.4);
  else g = exp(-d * d * 11.0) + 0.16 * exp(-d * d * 2.6);
  g *= 1.0 - smoothstep(0.75, 1.0, d);
  vec3 col = vCol * g * (1.0 - levFog() * 0.72);
  gl_FragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------------------------------------ geometry
const _xy = [0, 0];
function skinPoint(prof, t, c, s, k, out) {
  skin(prof(t), c, s, _xy);
  return out.set(_xy[0] * k, _xy[1] * k, HEAD_Z - t * LEN);
}

async function buildShell(prof, ctx) {
  const M = 200, R = 56;
  const b = makeBuf({ position: 3, aBT: 3 });
  for (let i = 0; i < M; i++) {
    const t = Math.pow(i / (M - 1), 1.12), pr = prof(t), z = HEAD_Z - t * LEN;
    for (let j = 0; j < R; j++) {
      const a = (j / R) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      skin(pr, c, s, _xy);
      b.a.position.d.push(_xy[0], _xy[1], z); b.a.aBT.d.push(t, c, s);
    }
    if (i % 50 === 49) await ctx.yield?.();
  }
  for (let i = 0; i < M - 1; i++) for (let j = 0; j < R; j++) {
    const a = i * R + j, bb = i * R + (j + 1) % R, c = (i + 1) * R + j, d = (i + 1) * R + (j + 1) % R;
    b.idx.push(a, c, bb, bb, c, d);
  }
  await ctx.yield?.();
  return b.toGeometry(true);
}

const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _T = new THREE.Vector3(), _U = new THREE.Vector3(), _V = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0), XAX = new THREE.Vector3(1, 0, 0);

// tube along ptFn(k,out) (k 0..1) into the "inner" buffer. par = [base, wave, scale, phase]
function addTube(b, segs, sides, ptFn, radFn, col, par, kind) {
  const base = b.n;
  for (let i = 0; i <= segs; i++) {
    const k = i / segs;
    ptFn(Math.min(1, k + 0.004), _q); ptFn(Math.max(0, k - 0.004), _p);
    _T.subVectors(_q, _p).normalize();
    _U.crossVectors(Math.abs(_T.y) < 0.9 ? UP : XAX, _T).normalize(); _V.crossVectors(_T, _U);
    ptFn(k, _p);
    const r = radFn(k);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const nx = _U.x * ca + _V.x * sa, ny = _U.y * ca + _V.y * sa, nz = _U.z * ca + _V.z * sa;
      b.a.position.d.push(_p.x + nx * r, _p.y + ny * r, _p.z + nz * r);
      b.a.normal.d.push(nx, ny, nz);
      b.a.aCol.d.push(col.r, col.g, col.b);
      b.a.aCen.d.push(_p.x, _p.y, _p.z, kind);
      b.a.aPar.d.push(par[0], par[1], par[2], par[3]);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * sides + j, bb = base + i * sides + (j + 1) % sides, c = a + sides, d = bb + sides;
    b.idx.push(a, bb, c, bb, d, c);
  }
  b.n += (segs + 1) * sides;
}

// lumpy ellipsoid
function addBlob(b, noise, cx, cy, cz, rx, ry, rz, col, par, kind) {
  const base = b.n, W = 14, H = 10;
  for (let i = 0; i <= H; i++) {
    const v = i / H, phi = v * Math.PI, sp = Math.sin(phi), cp = Math.cos(phi);
    for (let j = 0; j <= W; j++) {
      const a = (j / W) * Math.PI * 2;
      const nx = sp * Math.cos(a), ny = cp, nz = sp * Math.sin(a);
      const d = 1 + 0.16 * noise.n3(nx * 1.7 + cx, ny * 1.7 + cy, nz * 1.7 + cz * 0.13);
      b.a.position.d.push(cx + nx * rx * d, cy + ny * ry * d, cz + nz * rz * d);
      const l = Math.hypot(nx / rx, ny / ry, nz / rz) || 1;
      b.a.normal.d.push(nx / rx / l, ny / ry / l, nz / rz / l);
      b.a.aCol.d.push(col.r, col.g, col.b);
      b.a.aCen.d.push(cx, cy, cz, kind);
      b.a.aPar.d.push(par[0], par[1], par[2], par[3]);
    }
  }
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const a = base + i * (W + 1) + j, bb = a + 1, c = a + W + 1, d = c + 1;
    b.idx.push(a, bb, c, bb, d, c);
  }
  b.n += (H + 1) * (W + 1);
}

function buildInner(prof, rng, noise, C, P) {
  const b = makeBuf({ position: 3, normal: 3, aCol: 3, aCen: 4, aPar: 4 });
  const boneCol = C.pale.clone().lerp(C.glow, 0.3), ribCol = C.sea.clone().lerp(C.pale, 0.45);
  // spinal cord with vertebra beads
  const nVert = 112;
  addTube(b, nVert * 4, 6, (k, o) => { const t = 0.035 + 0.95 * k; return o.set(0, prof(t).spineY, HEAD_Z - t * LEN); },
    (k) => (0.5 * (1 - 0.72 * k) + 0.08) * (1 + 0.75 * Math.pow(Math.abs(Math.cos(Math.PI * k * nVert)), 6)),
    boneCol, [1.5, 5.2, 0, 0], 0);
  // ribs
  const nRib = P.ribs;
  for (let i = 0; i < nRib; i++) {
    const f = i / (nRib - 1), t = 0.125 + 0.62 * f, pr = prof(t);
    const reach = lerp(-0.95, -0.2, Math.pow(f, 1.5));
    for (const sd of [-1, 1]) {
      addTube(b, 10, 4, (k, o) => {
        const a = lerp(1.36, reach, k), m = smoothstep(0, 0.28, k);
        skin(pr, Math.cos(a) * sd, Math.sin(a), _xy);
        return o.set(_xy[0] * 0.87 * m, lerp(pr.spineY, _xy[1] * 0.87, m), HEAD_Z - t * LEN - 1.8 * k * k);
      }, (k) => 0.17 * (1 - 0.7 * k) * (0.6 + 0.4 * (1 - f)) + 0.03, ribCol, [0.5, 1.9, 0, 0], 0);
    }
  }
  // tail: neural and haemal spines
  for (let i = 0; i < 44; i++) {
    const t = 0.755 + 0.215 * (i / 43), pr = prof(t), z = HEAD_Z - t * LEN;
    for (const sg of [-1, 1]) {
      const y1 = sg > 0 ? pr.H * pr.top * 0.9 : -pr.H * pr.bot * 0.85;
      addTube(b, 2, 3, (k, o) => o.set(0, lerp(pr.spineY, y1, k), z - 1.1 * k), (k) => 0.1 * (1 - 0.8 * k) + 0.02, ribCol, [0.5, 1.9, 0, 0], 0);
    }
  }
  // gill arches + jaw bones
  for (let i = 0; i < 5; i++) {
    const t = 0.148 + 0.016 * i, pr = prof(t);
    for (const sd of [-1, 1]) addTube(b, 8, 4, (k, o) => {
      const a = lerp(0.05, -1.15, k); skin(pr, Math.cos(a) * sd, Math.sin(a), _xy);
      return o.set(_xy[0] * 0.92, _xy[1] * 0.92, HEAD_Z - t * LEN - 1.2 * Math.sin(k * Math.PI));
    }, (k) => 0.2 * Math.sin(Math.PI * (0.08 + 0.84 * k)) + 0.04, C.glow, [1.0, 1.6, 0, i * 0.5], 0);
  }
  for (const sd of [-1, 1]) addTube(b, 20, 4, (k, o) => {
    const t = 0.012 + 0.185 * k, sn = -0.2 - 0.55 * smoothstep(0.1, 0.19, t), cs = Math.sqrt(1 - sn * sn);
    return skinPoint(prof, t, cs * sd, sn, 0.9, o);
  }, (k) => 0.22 * Math.sin(Math.PI * (0.1 + 0.8 * k)) + 0.05, ribCol, [0.7, 1.2, 0, 0], 0);
  // organs
  const prB = prof(0.07);
  addBlob(b, noise, 0, prB.spineY + 0.2, HEAD_Z - 0.07 * LEN, 1.7, 1.2, 2.6, C.pale, [0.7, 0.8, 0.05, 1.0], 1);
  addBlob(b, noise, 0, prB.spineY + 0.1, HEAD_Z - 0.092 * LEN, 1.1, 0.9, 1.6, C.pale, [0.6, 0.8, 0.05, 2.0], 1);
  const prH = prof(0.2), hy = -prH.H * 0.3, hz = HEAD_Z - 0.2 * LEN;
  addBlob(b, noise, -0.9, hy, hz, 2.3, 2.5, 2.9, C.accent, [0.9, 3.6, 0.16, 0.0], 2);
  addBlob(b, noise, 1.3, hy + 0.9, hz - 1.4, 1.7, 1.8, 2.2, C.accent, [0.9, 3.6, 0.16, 0.06], 2);
  addBlob(b, noise, 0.2, hy + 2.6, hz + 1.2, 0.9, 1.3, 1.0, C.accent, [0.7, 2.4, 0.1, 0.1], 2);
  const prS = prof(0.38);
  addBlob(b, noise, 0, prS.spineY - prS.H * 0.3, HEAD_Z - 0.38 * LEN, prS.W * 0.3, prS.H * 0.17, 12, C.pale.clone().lerp(C.sea, 0.5), [0.15, 0.2, 0.04, 0.5], 1);
  const orgCols = [C.glow, C.glow.clone().lerp(C.sea, 0.55), C.sea.clone().lerp(C.pale, 0.3)];
  for (let i = 0; i < P.organs; i++) {
    const f = i / (P.organs - 1), t = 0.25 + 0.36 * f + rng.range(-0.01, 0.01), pr = prof(t);
    const sd = i % 2 ? 1 : -1;
    addBlob(b, noise, sd * pr.W * rng.range(0.14, 0.3), -pr.H * rng.range(0.12, 0.38), HEAD_Z - t * LEN,
      pr.W * rng.range(0.26, 0.36), pr.H * rng.range(0.24, 0.34), rng.range(3.2, 5.6),
      orgCols[i % 3], [0.3, 1.1, 0.09, i * 0.9], 1);
  }
  // gut with travelling lumps of light
  const g1 = rng.range(18, 26), g2 = rng.range(13, 19);
  addTube(b, 260, 6, (k, o) => {
    const t = 0.24 + 0.63 * k, pr = prof(t);
    return o.set(pr.W * 0.27 * Math.sin(k * g1), -pr.H * pr.bot * 0.5 + pr.H * 0.13 * Math.cos(k * g2), HEAD_Z - t * LEN);
  }, (k) => 0.5 * (1 - 0.62 * k) + 0.1, C.glow.clone().lerp(C.pale, 0.35), [0.22, 2.4, 0.55, 0], 3);
  return b.toGeometry(false);
}

// one feather (or crossed filament) into the fin buffer
function addFeather(b, root, dir, wAxis, len, width, droop, bend, phase, style, seed, rootT, bright, S = 18, A = 4) {
  const nrm = new THREE.Vector3().crossVectors(dir, wAxis).normalize();
  const passes = style ? 2 : 1;
  for (let ps = 0; ps < passes; ps++) {
    const wa = ps ? nrm : wAxis, base = b.n;
    for (let i = 0; i <= S; i++) {
      const v = i / S;
      const w = style
        ? width * (1 - 0.5 * v) + 1.8 * smoothstep(0.78, 0.84, v)
        : width * (0.04 + Math.pow(Math.sin(Math.PI * (0.07 + 0.93 * v)), 0.8) * (1 - 0.25 * v));
      const cx = root.x + dir.x * len * v + droop.x * len * v * v;
      const cy = root.y + dir.y * len * v + droop.y * len * v * v;
      const cz = root.z + dir.z * len * v + droop.z * len * v * v;
      for (let j = 0; j <= A; j++) {
        const u = (j / A) * 2 - 1, cam = style ? 0 : 0.1 * w * (1 - u * u);
        b.a.position.d.push(cx + wa.x * u * w + nrm.x * cam, cy + wa.y * u * w + nrm.y * cam, cz + wa.z * u * w + nrm.z * cam);
        b.a.uv.d.push(u, v);
        b.a.aBend.d.push(bend.x, bend.y, bend.z, phase);
        b.a.aFin.d.push(style, seed, rootT, bright);
      }
    }
    for (let i = 0; i < S; i++) for (let j = 0; j < A; j++) {
      const a = base + i * (A + 1) + j, bb = a + 1, c = a + A + 1, d = c + 1;
      b.idx.push(a, bb, c, bb, d, c);
    }
    b.n += (S + 1) * (A + 1);
  }
}

function buildFins(prof, rng, P) {
  const b = makeBuf({ position: 3, uv: 2, aBend: 4, aFin: 4 });
  const root = new THREE.Vector3(), dir = new THREE.Vector3(), wA = new THREE.Vector3(), droop = new THREE.Vector3(), bend = new THREE.Vector3(), hint = new THREE.Vector3();
  // paired fans: pectoral and pelvic
  const fan = (t0, n, L, a0, a1, down, sn, spreadZ, flap) => {
    for (const sd of [-1, 1]) for (let i = 0; i < n; i++) {
      const f = i / (n - 1), a = lerp(a0, a1, f) + rng.range(-0.03, 0.03);
      const t = t0 + (spreadZ * f) / LEN;
      skinPoint(prof, t, Math.sqrt(1 - sn * sn) * sd, sn, 0.96, root);
      dir.set(sd * Math.cos(a), -down - 0.18 * f, -Math.sin(a)).normalize();
      hint.set(sd * 0.35, 1, 0.15);
      wA.crossVectors(dir, hint).normalize();
      const len = L * (0.6 + 0.4 * Math.sin(Math.PI * (0.12 + 0.72 * f))) * rng.range(0.93, 1.07);
      droop.set(0, -0.16 - 0.08 * f, -0.12);
      bend.crossVectors(dir, wA).normalize().multiplyScalar(len * flap);
      addFeather(b, root, dir, wA, len, len * 0.052 + 0.35, droop, bend, f * 1.5 + (sd > 0 ? 0 : 0.5) + t0 * 9, 0, rng(), t, 1);
    }
  };
  fan(0.185, P.pecN, P.pecL, -0.2, 1.22, 0.3, -0.3, 6.5, 0.13);
  fan(0.5, P.pelN, P.pelL, 0.35, 1.3, 0.42, -0.45, 4.0, 0.11);
  if (P.midFans) fan(0.335, P.pelN, P.pecL * 0.62, 0.15, 1.28, 0.36, -0.36, 5.0, 0.12);   // six-finned variant
  // dorsal and ventral crests
  const crest = (tA, tB, sign, scale) => {
    const n = Math.round(((tB - tA) * LEN) / 1.25);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), t = lerp(tA, tB, f), pr = prof(t);
      const lean = lerp(0.95, 1.25, f) + rng.range(-0.05, 0.05), splay = (i % 2 ? 1 : -1) * rng.range(0.14, 0.3);
      root.set(0, sign > 0 ? pr.H * pr.top * (1 + pr.keel) * 0.94 : -pr.H * pr.bot * 0.94, HEAD_Z - t * LEN);
      dir.set(splay, sign * Math.cos(lean), -Math.sin(lean)).normalize();
      wA.crossVectors(dir, XAX).normalize();
      const len = (P.crest * scale * Math.pow(Math.sin(Math.PI * Math.min(1, f * 0.86 + 0.1)), 0.6) + 2.2) * rng.range(0.82, 1.15);
      droop.set(0, -sign * 0.1, -0.2);
      bend.set(len * 0.11, 0, 0);
      addFeather(b, root, dir, wA, len, len * 0.15 + 0.45, droop, bend, -t * 26 + rng.range(-0.2, 0.2), 0, rng(), t, 0.6, 10, 2);
    }
  };
  crest(0.29, 0.975, 1, 1);
  crest(0.55, 0.975, -1, 0.72);
  // tail streamers
  for (let i = 0; i < P.tailN; i++) {
    const phi = (i / P.tailN) * Math.PI * 2 + rng.range(-0.15, 0.15);
    root.set(0, prof(0.985).spineY * 0.3 + Math.sin(phi) * 0.3, HEAD_Z - 0.985 * LEN);
    dir.set(Math.cos(phi) * 0.22, Math.sin(phi) * 0.5, -1).normalize();
    hint.set(Math.sin(phi * 2.3 + i), Math.cos(phi * 1.7), 0.2);
    wA.crossVectors(dir, hint).normalize();
    const len = P.tailL * rng.range(0.7, 1.15) * (0.8 + 0.3 * Math.abs(Math.sin(phi)));
    droop.set(0, 0, 0);
    bend.crossVectors(dir, wA).normalize().multiplyScalar(len * 0.13);
    addFeather(b, root, dir, wA, len, len * 0.045 + 0.4, droop, bend, phi * 1.3, 0, rng(), 1.0, 1);
  }
  // chin barbels with lantern tips
  for (let i = 0; i < P.barbels; i++) {
    const sd = i % 2 ? 1 : -1, t = 0.03 + 0.085 * (Math.floor(i / 2) / Math.max(1, Math.ceil(P.barbels / 2) - 1));
    skinPoint(prof, t, 0.62 * sd, -0.78, 0.98, root);
    dir.set(sd * rng.range(0.25, 0.5), -rng.range(0.3, 0.5), -1).normalize();
    wA.crossVectors(dir, UP).normalize();
    const len = P.barbL * rng.range(0.6, 1.1);
    droop.set(0, -0.12, 0);
    bend.set(sd * len * 0.05, len * 0.03, 0);
    addFeather(b, root, dir, wA, len, 0.3, droop, bend, i * 1.9, 1, rng(), t, len / 0.75, 26, 4);
  }
  return b.toGeometry(true);
}

function buildSprites(prof, rng, C, P) {
  const b = makeBuf({ position: 3, uv: 2, aCol: 3, aInfo: 4 });
  const add = (x, y, z, size, kind, phase, bright, col) => {
    const base = b.n;
    for (let k = 0; k < 4; k++) {
      b.a.position.d.push(x, y, z); b.a.uv.d.push(k & 1 ? 1 : -1, k & 2 ? 1 : -1);
      b.a.aCol.d.push(col.r, col.g, col.b); b.a.aInfo.d.push(size, kind, phase, bright);
    }
    b.idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    b.n += 4;
  };
  const v = new THREE.Vector3();
  const bigCol = C.glow.clone().lerp(C.pale, 0.55);
  // halos first (drawn first inside this mesh)
  for (let i = 0; i < 14; i++) {
    const t = 0.04 + 0.9 * (i / 13);
    add(0, prof(t).spineY * 0.5, HEAD_Z - t * LEN, 15 + 15 * (1 - t), 2, i * 1.7, 0.085 * (1.15 - 0.5 * t), C.glow.clone().lerp(C.sea, 0.45));
  }
  // photophore rows
  ROWS.forEach((sn, r) => {
    const step = r === 3 ? 1.5 : 1.15, cs = Math.sqrt(1 - sn * sn);
    for (const sd of [-1, 1]) {
      const n = Math.floor((0.93 * LEN) / step);
      for (let i = 0; i < n; i++) {
        const t = 0.04 + (i * step) / LEN;
        skinPoint(prof, t, cs * sd, sn, 1.012, v);
        const big = (i + r * 2) % 6 === 0;
        add(v.x, v.y, v.z, (big ? 1.05 : 0.5) * (1 - 0.4 * t), 0, r * P.rowPh + (sd > 0 ? 0 : P.sidePh), big ? 1.5 : 1, big ? bigCol : C.glow);
      }
    }
  });
  // head constellation
  for (let i = 0; i < 110; i++) {
    const t = rng.range(0.008, 0.17), a = rng.range(-1.2, 1.35), sd = rng.sign();
    skinPoint(prof, t, Math.cos(a) * sd, Math.sin(a), 1.012, v);
    add(v.x, v.y, v.z, rng.range(0.2, 0.5), 0, rng.range(0, 6.28), 0.7, rng.chance(0.3) ? bigCol : C.glow);
  }
  // eyes
  const eyes = [[0.05, 0.85], [0.068, 0.62], [0.084, 0.46], [0.098, 0.34]];
  for (const sd of [-1, 1]) for (const [t, s] of eyes) {
    skinPoint(prof, t, Math.cos(0.26) * sd, Math.sin(0.26), 1.02, v);
    add(v.x, v.y, v.z, s, 1, 0, 2.3, C.pale);
  }
  // attendant motes (position = angle, radius, z0; animated in the shader)
  if (P.motes) for (let i = 0; i < 280; i++) {
    add(rng.range(0, 6.283), rng.range(11, 27), rng.range(-115, 85), rng.range(0.2, 0.42), 3, rng(), rng.range(0.8, 1.8), rng.chance(0.75) ? C.pale : C.glow);
  }
  return b.toGeometry(false);
}

// ------------------------------------------------------------------------------------------------ hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('leviathan') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));

  // per-seed character
  const P = {
    girth: rng.range(0.92, 1.08),
    hue: rng.range(0, 0.38),
    passHeight: opts.passHeight ?? rng.range(34.5, 37),
    swimLambda: rng.range(84, 112),
    waves: rng.range(3, 6),
    rowPh: rng.pick([0.9, -0.9, 0, 1.6]),
    sidePh: rng.pick([0, 0, Math.PI]),
    ribs: rng.int(46, 58), organs: rng.int(5, 8),
    pecN: rng.int(24, 32), pecL: rng.range(26, 34), pelN: rng.int(14, 20), pelL: rng.range(13, 19),
    crest: rng.range(5.5, 9), tailN: rng.int(13, 19), tailL: rng.range(24, 34),
    barbels: rng.int(2, 4) * 2, barbL: rng.range(18, 28),
    midFans: opts.midFans ?? rng.chance(0.45),
    motes: opts.motes !== false,
  };
  const C = {
    pale: pal[0], sea: pal[1], deep: pal[2], abyss: pal[3], accent: pal[6],
    glow: pal[5].clone().lerp(pal[0], P.hue),
  };
  const prof = makeProfile(P.girth);
  const path = buildPath(rng, P.passHeight);

  const U = {
    uTime: { value: 0 }, uPath: { value: path.tex }, uPathLen: { value: path.len }, uPathN: { value: PATH_N },
    uDist: { value: path.dMid }, uSwimPh: { value: 0 }, uSwimAmp: { value: rng.range(5.2, 6.8) },
    uSwimK: { value: (Math.PI * 2) / P.swimLambda }, uReveal: { value: 1 }, uWavePh: { value: 0 },
    uWaveK: { value: Math.PI * 2 * P.waves }, uRowPh: { value: P.rowPh },
    uPackK: { value: Math.PI * 2 * rng.range(4, 6.5) }, uPackW: { value: 2.2 }, uFlapW: { value: rng.range(0.48, 0.62) },
    uGlowCol: { value: C.glow.clone() }, uRimCol: { value: C.pale.clone().lerp(C.glow, 0.4) },
    uInnerCol: { value: C.glow.clone().lerp(C.pale, 0.3) }, uPale: { value: C.pale.clone() },
    uSkinBack: { value: C.deep.clone().lerp(C.sea, 0.5).multiplyScalar(1.3) },
    uSkinBelly: { value: C.sea.clone().lerp(C.pale, 0.4).multiplyScalar(0.8) },
    uMembCol: { value: C.sea.clone().lerp(C.pale, 0.3) },
    uAmbTop: { value: opts.ambTop ? new THREE.Color(opts.ambTop) : C.pale.clone().multiplyScalar(0.55) },
    uAmbBot: { value: opts.ambBot ? new THREE.Color(opts.ambBot) : C.accent.clone().multiplyScalar(0.16).add(C.glow.clone().multiplyScalar(0.04)) },
  };
  const mat = (vs, fs, o) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...o,
  });

  const object = new THREE.Group();
  object.name = 'leviathan';
  let triangles = 0;
  const addMesh = (geo, material, order) => {
    const m = new THREE.Mesh(geo, material);
    m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false;
    triangles += geo.index.count / 3;
    object.add(m);
    return m;
  };

  await ctx.yield?.();
  const shellGeo = await buildShell(prof, ctx);
  await ctx.yield?.();
  addMesh(shellGeo, mat(SHELL_VERT, SHELL_FRAG, { side: THREE.BackSide, defines: { LEV_BACK: 1 } }), 0);
  await ctx.yield?.();
  addMesh(buildInner(prof, rng, noise, C, P), mat(INNER_VERT, INNER_FRAG, {}), 1);
  await ctx.yield?.();
  addMesh(shellGeo, mat(SHELL_VERT, SHELL_FRAG, { side: THREE.FrontSide, transparent: true, premultipliedAlpha: true, depthWrite: false }), 2);
  addMesh(buildFins(prof, rng, P), mat(FIN_VERT, FIN_FRAG, { side: THREE.DoubleSide, transparent: true, premultipliedAlpha: true, depthWrite: false }), 3);
  await ctx.yield?.();
  addMesh(buildSprites(prof, rng, C, P), mat(SPRITE_VERT, SPRITE_FRAG, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 4);
  await ctx.yield?.();

  const lightPower = opts.lightPower ?? 12000;
  let light = null;
  if (lightPower > 0) {
    light = new THREE.PointLight(C.glow.clone().lerp(C.pale, 0.35), lightPower, 340, 2);
    object.add(light);
  }

  // ---- state
  let progress = clamp(opts.progress ?? 0.5, 0, 1);
  let revealOverride = null;
  const revealAuto = (p) => smoothstep(0.24, 0.43, p) * (1 - smoothstep(0.59, 0.8, p));
  const distOf = (p) => path.dMid + (p - 0.5) * path.travel;
  const tmpP = new THREE.Vector3();
  const apply = () => {
    const d = distOf(progress);
    U.uDist.value = d;
    const bellV = revealOverride != null ? revealOverride : revealAuto(progress);
    U.uReveal.value = revealOverride != null ? revealOverride : 0.15 + 0.85 * bellV;
    if (light) {
      path.at(d + 28, tmpP);
      light.position.set(tmpP.x, tmpP.y - 11, tmpP.z);
      const li = lightPower * Math.max(0, bellV);
      light.intensity = li > 1 ? li : 0;   // dark by intensity, never by visibility (no shader recompile)
    }
  };
  apply();

  const local = (off, out) => path.at(distOf(progress) + off, out);
  const apex = path.at(path.dMid, new THREE.Vector3());
  const anchors = {
    passPoint: new THREE.Vector3(0, 0, 0),
    cameraDir: new THREE.Vector3(0, 0, -1),
    flyThrough: [[0, 0, 240], [0, 0, 120], [0, 0, 0], [0, 0, -120], [0, 0, -240]].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    riseFrom: path.at(path.dMid - 330, new THREE.Vector3()),
    leaveTo: path.at(path.dMid + 330, new THREE.Vector3()),
    apex: apex.clone(),
    viewpoints: [
      { position: new THREE.Vector3(0, 0, 45), target: new THREE.Vector3(2, apex.y - 6, -15), note: 'on the camera line just before the pass, looking up along the belly' },
      { position: new THREE.Vector3(-95, 12, 70), target: apex.clone(), note: 'three-quarter front-left, slightly below' },
      { position: new THREE.Vector3(115, 30, -15), target: apex.clone(), note: 'broadside' },
    ],
  };

  const radius = 75, height = 42;

  const api = {
    object, radius, height, center: apex.clone(), anchors,
    ground: true, groundY: -30,
    light, uniforms: U, travel: path.travel, triangles, params: P,
    setProgress(p) { progress = clamp(p, 0, 1); apply(); },
    getProgress() { return progress; },
    trackPoint(d, out = new THREE.Vector3()) { return path.at(path.dMid + d, out); },
    progressAt(u, duration, u0 = 0.55, speed = 13) { return clamp(0.5 + (u - u0) * duration * speed / path.travel, 0, 1); },
    setReveal(v) { revealOverride = v == null ? null : Math.max(-0.35, v); apply(); },   // below 0: dimmer than its resting glow
    // world-space point on the spine, s metres from mid-body (+62 = head, -70 = tail tip)
    bodyPosition(s, out = new THREE.Vector3()) { return local(s, out).applyMatrix4(object.matrixWorld); },
    headPosition(out = new THREE.Vector3()) { return api.bodyPosition(60, out); },
    centerPosition(out = new THREE.Vector3()) { return api.bodyPosition(0, out); },
    // where a camera on the fly-through line should look: the head while it approaches, then sliding
    // back along the belly toward the tail as the body passes overhead
    gazePosition(out = new THREE.Vector3()) {
      const c = (progress - 0.5) * path.travel;
      return api.bodyPosition(lerp(60, -55, smoothstep(-60, 30, c)), out);
    },
    update(dt, time /* , camera */) {
      U.uTime.value = time;
      U.uSwimPh.value = time * U.uSwimK.value * 15.5;
      U.uWavePh.value = time * 1.5;
    },
    dispose() { path.tex.dispose(); },
  };
  object.userData.hero = api;
  return api;
}
