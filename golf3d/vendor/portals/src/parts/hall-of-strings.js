// HALL OF STRINGS: hero set piece: "The hammer line".
//
// The action of a concert grand at x200: a canyon 330 m long (x) and 30 m wide (z) in which 88 felt
// hammers on 26 m maple shanks strike upward out of the dark at the strings stretched across its mouth.
// A fixed 40 second score (keyed to PROGRESS, not time) drives everything from one 88x1 float texture:
// hammer throw and rebound, string ribbons of light (long-exposure standing waves), damper hops and
// the two sustain-pedal lifts, strike flashes and leaping dust.
//
// LOCAL SPACE (metres). Origin = centre of the canyon floor, +Y up, front = +Z = toward the piano's tail.
//   y = 0 canyon floor (the dark action), y = 40 soundboard, y = 46 treble strings, 48.5..54 bass strings.
//   Canyon: x -165..165, z -15..+15 (recess to z=20 under the soundboard lip). Hammer heads at z ~ -9.
//   Pin block + bronze plate: z -78..-15, top at y = 46. Damper rank at z = +30. Strings run to z ~ +490.
//   In the brief's hall coordinates (keyboard at z=0, soundboard y=0): place object at (150, -40, 45).
//   Bass is at -X, treble at +X. Keys run 0 (x=-138) .. 87 (x=+138).
//
// opts
//   palette      7 hex strings (brief order: lacquer, indigo, silver, copper, spruce/gold, bronze, crimson)
//   piece        'nocturne' | 'toccata' | 'bells'   (default: per seed, mostly nocturne)
//   light        'spot' | 'rehearsal' | 'moon'      (default: per seed, mostly spot) colours of the self light
//   selfLight    0..n (default 1): the piece carries an analytic key (cool, from high +X) / amber bounce /
//                indigo ambient in its own shaders so it reads in a dark hall. Set 0 to use scene lights only.
//   strings      true: build the 230 string ribbons (full length). stringLength: cap length in m (default 490)
//   clearKeys    [0,5] and clearWindow [17,27] seconds: hammers never thrown there (camera corridor)
//   dust         number of dust points bound to strings (default 6000)
//   apron        false: leave out the soundboard apron (the world lays its own soundboard)
//   keyDir       [x,y,z] direction TO the key light (default: high +X, per-seed jitter)
//
// anchors (local space, THREE.Vector3 unless noted)
//   flyThrough   ordered points, >= 6 m clear of everything: over the bass end of the damper rank, down the
//                string-free slot at x ~ -153, hang in the canyon, climb out over the pins, dive to the porthole
//   canyonHang   where the camera hangs for the reveal; canyonLook: a point far down the rank to look at
//   rankStart / rankEnd   head line at string height, key 0 and key 87 (for pois)
//   portalSeat   { position, normal(+Y), radius 7 } centre of the open porthole in the plate (portal lies flat,
//                tilt: true); diveStart = start of a 60 m straight approach at 55 degrees
//   damperLine   two points: ends of the damper rank (z=+30);  spotAxis: direction TO the key light
//   portholes    centres of the two sealed portholes (dark wells) for dressing
//
// handle extras: setProgress(u 0..1) (the world MUST call this every frame with path progress scaled so
//   that u*40 s matches the journey; until it is called the piece self-plays from time/40), score (event
//   list [t, key, vel]), pedalTimes, envTexture (88x1 RGBA float: R hammer lift, G string amplitude,
//   B seconds since strike, A damper lift 0..1), uniforms (shared: uPedal, uKeyDir, uKeyCol, uFillCol,
//   uAmbCol, uSelf...), parts { strings, hammers, dampers, pins, agraffes, dust } for mirrored lid copies,
//   keyX(k), bounds.
//
// Size: radius/height returned are a VIEW size (62 / 24) for the orbit viewer; true extent x +-165,
// y 0..60, z -78..+473 (bounds). Cost: ~140k triangles, 9 draw calls, no lights, ~250 ms build.
// Lighting: made for a dark hall (night). Scene lights add on top of the self light; keep them low.
// Outer faces of the canyon are back-face culled on purpose so the viewer can look in from outside.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PAL = ['#05060a', '#1a2440', '#cfd8e6', '#c47a3a', '#e8c98a', '#6e6048', '#b3122a'];
const NK = 88, SCORE_LEN = 40;
const Y_SB = 40, Y_STR = 46, Y_BASS = 48.5, Y_BASS_FAR = 54;
const PIV_Y = 36, PIV_Z = 17, SHANK = 26.5, HEAD_TOP = 3.5;
const Z_AGR = -17, Z_DAMP = 30, X0 = -138, DX = 276 / 87;
const keyX = (k) => X0 + k * DX;
const isBass = (k) => k < 26;
const nStr = (k) => (k < 8 ? 1 : k < 26 ? 2 : 3);

// ---------------------------------------------------------------- geometry helpers
function colored(geo, col, o = {}) {
  let g = geo.index && !o.smooth ? geo.toNonIndexed() : geo;
  if (o.smooth && !g.index) g = g; // keep
  if (g.index) g = g.toNonIndexed();
  g.deleteAttribute('uv');
  if (o.m) g.applyMatrix4(o.m);
  if (!o.smooth) g.computeVertexNormals();
  const n = g.attributes.position.count, c = new Float32Array(n * 3), p = g.attributes.position;
  for (let i = 0; i < n; i++) {
    let r = col.r, gg = col.g, b = col.b;
    if (o.fn) { const q = o.fn(p.getX(i), p.getY(i), p.getZ(i)); r = q.r; gg = q.g; b = q.b; }
    c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
function xf(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(E.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
}
// box with chamfered top and bottom edges and optional taper; origin at its centre
function chamferBox(w, h, d, b = 0.2, taper = 1) {
  const g = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2, h, 4, 3, false, Math.PI / 4);
  const p = g.attributes.position, bb = Math.min(b, h * 0.45);
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i), x = p.getX(i), z = p.getZ(i);
    const ring = Math.round((y / h + 0.5) * 3); // 0..3
    const yy = [-h / 2, -h / 2 + bb, h / 2 - bb, h / 2][ring];
    const inset = ring === 0 || ring === 3 ? bb : 0;
    const tp = lerp(1, taper, yy / h + 0.5);
    const r = Math.hypot(x, z);
    if (r > 1e-4) { x = Math.sign(x) * Math.max(0.02, (w / 2 - inset) * tp) * (Math.abs(x) > 0.1 ? 1 : 0); z = Math.sign(z) * Math.max(0.02, (d / 2 - inset) * tp) * (Math.abs(z) > 0.1 ? 1 : 0); }
    p.setXYZ(i, x, yy, z);
  }
  return g;
}
// one-sided grid quad: corner o, edge vectors u and v (arrays); faces along u x v
function quad(o, u, v, su = 1, sv = 1) {
  const pos = [];
  const P = (a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b];
  for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) {
    const a0 = i / su, a1 = (i + 1) / su, b0 = j / sv, b1 = (j + 1) / sv;
    pos.push(...P(a0, b0), ...P(a1, b0), ...P(a1, b1), ...P(a0, b0), ...P(a1, b1), ...P(a0, b1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// drop triangles facing -Z (so wall dressing vanishes, like the wall itself, when seen from behind)
function noBack(g) {
  const p = g.attributes.position.array, n = g.attributes.normal.array, c = g.attributes.color.array, P = [], N = [], Cc = [];
  for (let i = 0; i < p.length; i += 9) {
    if ((n[i + 2] + n[i + 5] + n[i + 8]) / 3 < -0.5) continue;
    for (let j = 0; j < 9; j++) { P.push(p[i + j]); N.push(n[i + j]); Cc.push(c[i + j]); }
  }
  const o = new THREE.BufferGeometry();
  o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); o.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  return o;
}

// ---------------------------------------------------------------- the score
function buildScore(rng, piece, clearKeys, clearWin) {
  const ev = [];
  const add = (t, k, v, d = 1) => {
    k = Math.round(k);
    if (k < 0 || k > 87 || t < 0.25 || t > SCORE_LEN - 0.5) return;
    if (k >= clearKeys[0] && k <= clearKeys[1] && t > clearWin[0] - 0.8 && t < clearWin[1] + 0.8) return;
    ev.push([t, k, clamp(v, 0.2, 1), d]);
  };
  const root = 6 + rng.int(0, 5);
  const prog = rng.pick([[0, 5, 7, 3], [0, -2, 3, 5], [0, 7, 5, 8], [0, 3, -2, 5]]);
  const MIN = [0, 7, 12, 15, 19, 24, 27, 31, 36, 39], MAJ = [0, 7, 12, 16, 19, 24, 28, 31, 36, 40];
  const scale = [0, 2, 3, 5, 7, 8, 10];
  const pedalTimes = [15, 30];
  // a low chord as the flight begins: three ribbons swell beside the lens in every piece
  add(0.45, root + 4, 1, 1.7); add(0.6, root + 8, 0.95, 1.6); add(0.78, root + 11, 0.9, 1.6);
  if (piece === 'nocturne') {
    add(1.2, root + 3, 1, 1.4); // the low note beside the lens at the entry
    for (let i = 0, t = 2.6; t < 39; i++, t += 2.5) {
      const r = root + prog[i % 4], iv = (i % 4 === 0 || rng.chance(0.6)) ? MIN : MAJ;
      for (let j = 0; j < iv.length; j++) add(t + j * 0.105, r + iv[j], 0.62 + 0.25 * Math.sin(j * 0.6), 1);
    }
    let deg = rng.int(2, 9);
    for (let t = 3.2; t < 39;) {
      deg = clamp(deg + rng.pick([-2, -1, -1, 1, 1, 2, 3]), 0, 13);
      add(t, 51 + (root % 12) + 12 * Math.floor(deg / 7) + scale[deg % 7], 0.85, 1.3);
      t += rng.pick([1.25, 1.25, 1.25, 2.5, 0.625]);
    }
  } else if (piece === 'toccata') {
    const pat = [0, 12, 7, 15, 3, 12, 7, 19];
    for (let i = 0, t = 0.8; t < 39.2; i++, t += 0.125) {
      const bar = Math.floor(t / 2.5), r = root + prog[bar % 4];
      if (i % 2 === 0) add(t, r + 12 + pat[(i >> 1) % 8], 0.6, 0.6);
      else add(t, r + 36 + pat[(i * 3 >> 1) % 8] + (bar % 2) * 5, 0.7, 0.6);
      if (i % 16 === 0) add(t, r, 0.95, 1.2);
    }
  } else { // bells
    for (let t = 1.2; t < 39; t += 1.7) {
      const k = 30 + scaleSnap(rng.int(0, 54), root, scale);
      add(t, k, 1, 2.2); add(t + 0.85, k - 12, 0.6, 2.2);
      if (rng.chance(0.35)) add(t + 0.42, k + 7, 0.75, 2);
    }
  }
  // two fast runs like wind over wheat (both inside the reveal), and the two pedal chords
  for (let j = 0; j <= 41; j++) add(20.4 + j * 0.021, 68 - j, 0.8 - 0.2 * Math.cos(j * 0.15), 0.8);
  for (let j = 0; j <= 41; j++) add(24.3 + j * 0.019, 24 + j * 1.0, 0.8, 0.8);
  // the hover in the canyon (20-27.5 s): the rank never rests in any piece. Two long runs sweep the whole rank toward
  // the lens, and a rolled arpeggio climbs the hammers just beyond the camera corridor every 1.2 s
  for (const t0 of [22.0, 25.5]) for (let j = 0; j <= 79; j++) add(t0 + j * 0.0145, 87 - j, 0.85 - 0.2 * Math.cos(j * 0.11), 0.7);
  const ROLL = [0, 3, 5, 8, 10, 13, 17, 20, 22, 19, 15, 12, 7, 2];                            // up and back down: no rests
  for (let t = 17.7, i = 0; t < 27.7; t += 1.2, i++) for (let j = 0; j < 14; j++) add(t + j * 0.0857, 8 + (i % 3) * 2 + ROLL[j] * (j < 8 ? 1 : 0.9), 0.7 + 0.25 * Math.sin(j * 0.7), 0.9);
  if (piece === 'bells') for (const t0 of [21, 25]) [0, 7, 12, 16, 19, 24, 28, 31].forEach((o, j) => add(t0 + j * 0.06, 34 + (root % 5) + o, 1, 2.2));
  for (const pt of pedalTimes) [0, 12, 19, 24, 28, 31, 36, 43, 48, 55, 60].forEach((o, j) => add(pt + j * 0.028, root + 2 + o, 1, 1.6));
  ev.sort((a, b) => a[0] - b[0]);
  return { ev, pedalTimes };
}
function scaleSnap(n, root, scale) { const o = Math.floor(n / 12), d = n % 12; let best = 0; for (const s of scale) if (Math.abs((s + root) % 12 - d) < Math.abs((best + root) % 12 - d)) best = s; return o * 12 + (best + root) % 12; }

const liftPulse = (dt) => {
  if (dt < -0.15 || dt > 0.75) return 0;
  if (dt < 0) { const s = 1 + dt / 0.15; return s * s; }
  if (dt < 0.4) { const s = dt / 0.4; return 1 - s * s; }
  return 0.13 * Math.sin(Math.PI * (dt - 0.4) / 0.35);
};
// the second (last) lift is held 3 s longer: the hall still shimmers as the camera climbs out over the pins
const pedalAt = (t, times) => { let p = 0; for (let i = 0; i < times.length; i++) { const pt = times[i], h = i === times.length - 1 && i > 0 ? 3.0 : 0; p = Math.max(p, smoothstep(pt - 0.5, pt + 0.5, t) * (1 - smoothstep(pt + 3.6 + h, pt + 5.0 + h, t))); } return p; };
function evalScore(score, t, data) {
  const { ev, pedalTimes } = score, ped = pedalAt(t, pedalTimes);
  for (let k = 0; k < NK; k++) { data[k * 4] = 0; data[k * 4 + 1] = 0; data[k * 4 + 2] = 99; data[k * 4 + 3] = ped; }
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i], dt = t - e[0];
    if (dt < -0.15) break;
    const o = e[1] * 4;
    const l = liftPulse(dt) * (0.8 + 0.2 * e[2]);
    if (l > data[o]) data[o] = l;
    if (dt >= 0) {
      const tau = lerp(3.4, 0.9, e[1] / 87) * e[3] * (1 + ped * 0.8);
      data[o + 1] = Math.min(1, data[o + 1] + e[2] * Math.exp(-dt / tau) * smoothstep(0, 0.03, dt));
      data[o + 2] = dt;
      const d = smoothstep(-0.02, 0.07, dt) * (1 - smoothstep(0.5, 0.85, dt));
      if (d > data[o + 3]) data[o + 3] = d;
    }
  }
  return ped;
}

// ---------------------------------------------------------------- shader pieces
const V_HEAD = /* glsl */`
uniform sampler2D uEnv;
varying vec3 vWPos; varying vec3 vWN; varying vec3 vGlow;
vec4 hEnv(float k){ return texelFetch(uEnv, ivec2(int(k + 0.5), 0), 0); }
`;
const V_WORLD = /* glsl */`
{
  vec4 hW = vec4(transformed, 1.0); vec3 hN = objectNormal;
  #ifdef USE_INSTANCING
    hW = instanceMatrix * hW; hN = mat3(instanceMatrix) * hN;
  #endif
  vWPos = (modelMatrix * hW).xyz; vWN = normalize(mat3(modelMatrix) * hN);
}
`;
const F_HEAD = /* glsl */`
uniform vec3 uKeyDir, uKeyCol, uFillCol, uAmbCol, uLampP, uLampCol; uniform float uSelf, uSpec, uShin, uGrain, uFillK, uFillMin, uDeep, uPinK, uPedalF, uTimeF; uniform vec2 uShaft; uniform mat4 uInvModel;
varying vec3 vWPos; varying vec3 vWN; varying vec3 vGlow;
float hFeltK = 0.0;                                         // 1 on white hammer felt (set by the hammer's colour patch): fuzz rim
float hHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hHash(i), hHash(i + vec3(1,0,0)), f.x), mix(hHash(i + vec3(0,1,0)), hHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hHash(i + vec3(0,0,1)), hHash(i + vec3(1,0,1)), f.x), mix(hHash(i + vec3(0,1,1)), hHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
const F_LIGHT = /* glsl */`
{
  vec3 hN = normalize(vWN); if (!gl_FrontFacing) hN = -hN;
  vec3 hV = normalize(cameraPosition - vWPos);
  vec3 hL = (uInvModel * vec4(vWPos, 1.0)).xyz;            // hero-local position
  float hn = hNoise(hL * 0.55) * 0.6 + hNoise(hL * 2.3) * 0.4;
  // spruce grain on the soundboard apron (lengthwise lines) and long streaks on the walls
  float hg = hNoise(vec3(hL.x * 2.6, hL.y * 0.4, hL.z * 0.03)) * 0.6 + 0.4 * hNoise(vec3(hL.x * 9.0, 0.0, hL.z * 0.08));
  float hSb = uGrain * step(abs(hL.y - 40.0), 0.06), hPool = 1.0;
  diffuseColor.rgb *= mix(0.78 + 0.44 * hn, 0.55 + 0.75 * hg, max(hSb, uGrain * 0.35));
  // the plate: dull antique bronze, sand-cast (pitted bump, warm metallic sheen)
  float hPl = uGrain * step(43.6, hL.y) * (1.0 - step(-15.3, hL.z));
  if (hPl > 0.5) {
    vec3 hq = hL * 6.2; float hn0 = hNoise(hq) + 0.5 * hNoise(hq * 3.1);
    float hnx = hNoise(hq + vec3(0.4, 0.0, 0.0)) + 0.5 * hNoise(hq * 3.1 + vec3(0.4, 0.0, 0.0));
    float hnz = hNoise(hq + vec3(0.0, 0.0, 0.4)) + 0.5 * hNoise(hq * 3.1 + vec3(0.0, 0.0, 0.4));
    hN = normalize(hN + vec3(hn0 - hnx, 0.0, hn0 - hnz) * 0.15);
    float hPat = hNoise(hL * 0.16) * 0.6 + hNoise(hL * 5.5) * 0.4;
    diffuseColor.rgb *= vec3(1.0, 0.7, 0.36) * (0.34 + 0.5 * hPat * hPat);
    vec2 hd = hL.xz - vec2(-60.0, -62.0); hPool = mix(0.36, 1.3, exp(-dot(hd, hd) / 2600.0));   // the well's light pools round the open porthole
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.12, 0.1), 0.22 * smoothstep(0.62, 0.9, hNoise(hL * 0.33 + 7.0)));   // a breath of verdigris
  }
  float hShaft = smoothstep(uShaft.x, uShaft.y, hL.y);
  float hK = max(dot(hN, uKeyDir), 0.0);
  float hRim = pow(1.0 - max(dot(hN, hV), 0.0), 3.0);
  float hNdv = 1.0 - max(dot(hN, hV), 0.0);
  vec3 hLi = uKeyCol * (hK * hShaft * hPool + 0.25 * hRim * hShaft + 0.32 * hFeltK * hNdv * hNdv * (0.3 + 0.7 * hShaft))
           + uFillCol * uDeep * (1.0 - smoothstep(6.0, 40.0, hL.y)) * (0.65 + 0.35 * hN.y)
           + uFillCol * uFillK * (max(-hN.y, 0.0) * 0.9 + 0.1 + 0.25 * uFillMin) * max(smoothstep(22.0, 42.0, hL.y), uFillMin)
           + uAmbCol * (0.6 + 0.4 * hN.y) * (0.35 + 0.65 * smoothstep(-5.0, 46.0, hL.y));
  // the music-desk lamp: a warm pool over the keyboard end (uLampP is in world space), against the cool spot
  vec3 hLd = uLampP - vWPos; float hLl = max(length(hLd), 1e-3); hLd /= hLl;
  float hLamp = exp(-hLl * hLl / 40000.0);
  hLi += uLampCol * 1.0 * (1.0 - 0.8 * uPinK) * hLamp * smoothstep(30.0, 46.0, hL.y) * max(dot(hN, hLd), 0.0);
  float hS = pow(max(dot(hN, normalize(uKeyDir + hV)), 0.0), uShin) * uSpec * (0.15 + 0.85 * hShaft) * (1.0 - 0.7 * hPl);
  vec3 hPin = vec3(0.0);
  if (uPinK > 0.0) {                                       // chrome pins: each carries its lights as vertical streaks
    vec2 hNx = hN.xz / max(length(hN.xz), 1e-3), hVx = hV.xz / max(length(hV.xz), 1e-3);
    vec2 hH1 = hLd.xz / max(length(hLd.xz), 1e-3) + hVx; hH1 /= max(length(hH1), 1e-3);
    vec2 hH2 = uKeyDir.xz / max(length(uKeyDir.xz), 1e-3) + hVx; hH2 /= max(length(hH2), 1e-3);
    float hSt1 = pow(max(dot(hNx, hH1), 0.0), 30.0), hSt2 = pow(max(dot(hNx, hH2), 0.0), 30.0) + 0.5 * pow(max(dot(hNx, hH2), 0.0), 6.0) * uPedalF, hEdge = pow(clamp(1.0 - abs(dot(hNx, hVx)), 0.0, 1.0), 6.0);
    hPin = (mix(uLampCol, vec3(dot(uLampCol, vec3(0.4))), 0.3) * (1.4 * hSt1 + 0.12 * hEdge) * (0.2 + 0.8 * hLamp) + uKeyCol * (0.95 * hSt2 + 0.1 * hEdge)) * uPinK * (1.0 - smoothstep(0.5, 0.9, abs(hN.y))) * smoothstep(0.15, 0.75, dot(hV.xz, hV.xz));   // seen from above a pin shows its cap, not a streak
  }
  float hNdh = max(dot(hN, normalize(uKeyDir + hV)), 0.0);
  vec2 hd2 = hL.xz - vec2(-60.0, -62.0); float hPoolS = mix(0.16, 1.0, exp(-dot(hd2, hd2) / 1000.0));      // the sheen gathers round the lit porthole
  vec3 hWarm = vec3(0.58, 0.38, 0.145) * hPl * hPoolS * 0.62 * pow(hNdh, 18.0) * (0.3 + 1.3 * hn * hn) * dot(uKeyCol, vec3(0.33))      // cast bronze: a broad warm metallic lobe
    + vec3(1.0, 0.76, 0.42) * hPl * hPool * (0.1 * hPoolS * pow(hNdh, 30.0) + 0.05 * pow(max(dot(reflect(-hV, hN), normalize(vec3(0.2, 0.6, -0.75))), 0.0), 6.0) + 0.05 * hRim) * dot(uKeyCol + uAmbCol, vec3(0.33));
  hPin += uKeyCol * uPinK * (0.3 * pow(hNdh, 5.0) + 0.12 * uPedalF * (0.5 + 0.5 * sin(uTimeF * 3.1 + hL.x * 1.9)));      // caps and shoulders carry the spot; a shimmer of sympathy on the pedal
  totalEmissiveRadiance += (diffuseColor.rgb * hLi + uKeyCol * hS + hWarm + hPin) * uSelf + vGlow;
  if (hFeltK > 0.0) totalEmissiveRadiance = min(totalEmissiveRadiance, vec3(0.85) + vGlow * 2.2);      // felt never blooms, but a white head flashes as it strikes
}
`;
function patch(mat, U, o = {}) {
  const own = { uSpec: { value: o.spec ?? 0.08 }, uShin: { value: o.shin ?? 30 }, uGrain: { value: o.grain ?? 0 }, uFillK: { value: o.fillK ?? 1 }, uFillMin: { value: o.fillMin ?? 0 }, uDeep: { value: o.deep ?? 0 }, uPinK: { value: o.pin ?? 0 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, own);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + V_HEAD + (o.vhead || ''))
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvGlow = vec3(0.0);\n' + (o.vnormal || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (o.vpos || ''))
      .replace('#include <project_vertex>', V_WORLD + '\n#include <project_vertex>');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + F_HEAD + (o.fhead || ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (o.fcolor || ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + F_LIGHT);
  };
  mat.customProgramCacheKey = () => 'hos-' + (o.key || 'base');
  return mat;
}
const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
const FOG_F = /* glsl */`
float hFog(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.0;
  #endif
}
`;

// ---------------------------------------------------------------- hammer (pivot at origin, shank along -Z)
function hammerGeometry(C, rng) {
  const parts = [];
  const maple = C.maple, mapleD = C.maple.clone().multiplyScalar(0.6);
  // shank: tapered octagon with a slight belly
  const sh = new THREE.CylinderGeometry(0.3, 0.42, SHANK + 1, 8, 3);
  parts.push(colored(sh, maple, { smooth: true, m: xf(0, 0, -SHANK / 2 + 0.5, Math.PI / 2, 0, 0), fn: (x, y, z) => maple.clone().multiplyScalar((0.72 + 0.3 * Math.sin(z * 1.7) * Math.sin(z * 0.31) + 0.12 * Math.sin(z * 9.0 + x * 5.0)) * (Math.abs(z + 11) < 0.5 || Math.abs(z + 12.4) < 0.25 ? 0.45 : 1)) }));
  parts.push(colored(new THREE.CylinderGeometry(0.52, 0.52, 0.9, 8), C.brass.clone().multiplyScalar(1.3), { smooth: true, m: xf(0, 0, -SHANK + 2.3, Math.PI / 2, 0, 0) }));          // brass ferrule under the head
  parts.push(colored(new THREE.CylinderGeometry(0.5, 0.54, 2.2, 8), C.leather.clone().multiplyScalar(0.55), { smooth: true, m: xf(0, 0, -6.6, Math.PI / 2, 0, 0) }));                  // dark leather wrap at the knuckle
  parts.push(colored(new THREE.CylinderGeometry(0.34, 0.34, 2.6, 6), C.brass.clone().multiplyScalar(1.4), { smooth: true, m: xf(0, 0.2, 0.9, 0, 0, Math.PI / 2) }));                    // flange pin
  // flange fork + centre pin + drop screw
  parts.push(colored(chamferBox(1.5, 1.5, 3.4, 0.25), mapleD, { m: xf(0, -0.1, 1.2) }));
  parts.push(colored(new THREE.CylinderGeometry(0.22, 0.22, 2.0, 6), C.brass, { smooth: true, m: xf(0, 0, 0, 0, 0, Math.PI / 2) }));
  // knuckle (leather roller under the shank)
  parts.push(colored(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 8), C.leather, { smooth: true, m: xf(0, -0.75, -4.2, 0, 0, Math.PI / 2) }));
  parts.push(colored(chamferBox(0.9, 0.9, 1.5, 0.15), mapleD, { m: xf(0, -0.3, -4.2) }));
  // head: wooden moulding with tapered tail
  parts.push(colored(chamferBox(1.5, 3.4, 1.9, 0.25, 0.75), C.mould, { m: xf(0, -0.2, -SHANK, Math.PI, 0, 0) }));
  parts.push(colored(chamferBox(1.2, 2.2, 1.3, 0.2, 0.45), C.mould, { m: xf(0, -2.6, -SHANK - 0.25, Math.PI, 0, 0) }));
  // felt egg: pointed top, flat sides, crimson underfelt collar
  const egg = new THREE.SphereGeometry(1, 12, 10);
  const p = egg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    x = Math.sign(x) * Math.pow(Math.abs(x), 0.55);                 // flat cheeks
    const up = Math.max(y, 0), nose = 1 - 0.42 * Math.pow(up, 1.6);
    z *= nose * (y < 0 ? 1 - 0.25 * y * y : 1);
    const band = Math.exp(-Math.pow((y + 0.32) / 0.3, 2));         // collar bulge
    p.setXYZ(i, x * 1.2 * (1 + 0.12 * band), 1.0 + y * 2.5, z * 1.75 * (1 + 0.12 * band));
  }
  egg.computeVertexNormals();
  const wear = rng.range(0.0, 0.25);
  // felt, crimson underfelt and the tail of the moulding are painted in the hammer's fragment patch (soft seams, fibre)
  parts.push(colored(egg, C.felt, { smooth: true, m: xf(0, 0, -SHANK) }));
  return mergeGeometries(parts);
}

// ---------------------------------------------------------------- damper (origin where the felt sole meets the string)
function damperGeometry(C) {
  const parts = [];
  parts.push(colored(chamferBox(1.9, 0.55, 5.6, 0.12), C.crimson, { m: xf(0, 0.28, 0) }));                 // felt sole
  parts.push(colored(chamferBox(1.5, 0.5, 2.0, 0.1, 0.7), C.crimson, { m: xf(0, -0.2, 1.2, Math.PI, 0, 0) })); // wedge felt between strings
  parts.push(colored(chamferBox(2.0, 1.7, 6.0, 0.35, 0.86), C.lacquer, { m: xf(0, 1.4, 0) }));              // lacquer block
  parts.push(colored(chamferBox(1.1, 0.5, 3.4, 0.2, 0.7), C.lacquer, { m: xf(0, 2.45, 0.2) }));             // top moulding
  parts.push(colored(new THREE.CylinderGeometry(0.11, 0.11, 30, 5, 1, true), C.steel, { smooth: true, m: xf(0, -14.4, 2.2) }));  // damper wire
  parts.push(colored(chamferBox(0.6, 0.6, 0.9, 0.1), C.brass, { m: xf(0, 0.4, 2.2) }));
  return mergeGeometries(parts);
}

function pinGeometry(C) {
  const prof = [[0.74, 0], [0.74, 1.0], [0.98, 1.12], [1.0, 2.1], [0.74, 2.25], [0.66, 4.7]].map((q) => new THREE.Vector2(q[0], q[1]));
  const body = colored(new THREE.LatheGeometry(prof, 7), C.chrome, { smooth: true, fn: (x, y, z) => (y > 1.05 && y < 2.2 ? C.steel.clone().multiplyScalar(0.7 + 0.3 * Math.sin(y * 40)) : C.chrome) });
  const sq = colored(chamferBox(0.86, 1.4, 0.86, 0.14, 0.82), C.chrome, { m: xf(0, 5.35, 0) });
  return mergeGeometries([body, sq]);
}
function agraffeGeometry(C) {
  const prof = [[0.62, -0.4], [0.62, 0.0], [0.38, 0.15], [0.36, 0.75], [0.5, 0.95], [0.0, 1.4]].map((q) => new THREE.Vector2(q[0], q[1]));
  return colored(new THREE.LatheGeometry(prof, 5), C.brass, { smooth: true });
}

// ---------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('hall-of-strings-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map((h) => new THREE.Color(h));
  const piece = opts.piece || rng.pick(['nocturne', 'nocturne', 'nocturne', 'toccata', 'bells']);
  const lightState = opts.light || rng.pick(['spot', 'spot', 'spot', 'rehearsal', 'moon']);
  const selfLight = opts.selfLight ?? 1;
  const withStrings = opts.strings !== false, maxLen = opts.stringLength ?? 490;
  const clearKeys = opts.clearKeys || [0, 5], clearWin = opts.clearWindow || [17, 27];
  const nDust = opts.dust ?? 6000;

  const [cLac, cInd, cSil, cCop, cSpr, cBrz, cCri] = pal;
  const warm = rng.range(-0.06, 0.06);                         // per-seed temperature drift of the woods
  const C = {
    lacquer: cLac.clone().lerp(cInd, 0.3).multiplyScalar(1.6),
    indigo: cInd.clone(), silver: cSil.clone(), copper: cCop.clone(),
    spruce: cSpr.clone().multiplyScalar(0.42), bronze: cBrz.clone().multiplyScalar(0.9), crimson: cCri.clone().multiplyScalar(0.95),
    maple: cSpr.clone().lerp(new THREE.Color(1, 1, 1), 0.15 - warm).multiplyScalar(0.6),
    mould: cSpr.clone().lerp(cCop, 0.55 + warm).multiplyScalar(0.36),
    felt: new THREE.Color(0.70, 0.69, 0.66), leather: cCop.clone().lerp(cSpr, 0.4).multiplyScalar(0.5),
    brass: cSpr.clone().lerp(cCop, 0.4).multiplyScalar(0.7), chrome: cSil.clone().multiplyScalar(0.5), steel: cSil.clone().multiplyScalar(0.34),
    dark: cLac.clone().lerp(cInd, 0.5).multiplyScalar(0.9),
  };
  const LS = {
    spot: { key: cSil.clone().multiplyScalar(1.5), fill: cCop.clone().multiplyScalar(0.3), amb: cInd.clone().multiplyScalar(0.55) },
    rehearsal: { key: new THREE.Color('#ffe2b0').multiplyScalar(1.3), fill: cCop.clone().multiplyScalar(0.4), amb: new THREE.Color('#4a4a66').multiplyScalar(0.42) },
    moon: { key: new THREE.Color('#8fb0ff').multiplyScalar(1.25), fill: cCop.clone().lerp(cInd, 0.5).multiplyScalar(0.12), amb: new THREE.Color('#10204e').multiplyScalar(0.8) },
  }[lightState] || null;
  const keyJit = rng.range(-0.08, 0.08);
  const keyDirLocal = opts.keyDir ? new THREE.Vector3().fromArray(opts.keyDir).normalize() : new THREE.Vector3(0.5 + keyJit, 0.8, 0.26).normalize();

  const envData = new Float32Array(NK * 4);
  const envTex = new THREE.DataTexture(envData, NK, 1, THREE.RGBAFormat, THREE.FloatType);
  envTex.minFilter = envTex.magFilter = THREE.NearestFilter; envTex.generateMipmaps = false; envTex.needsUpdate = true;
  const U = {
    uEnv: { value: envTex }, uTime: { value: 0 }, uPedal: { value: 0 },
    uKeyDir: { value: keyDirLocal.clone() }, uKeyCol: { value: LS.key }, uFillCol: { value: LS.fill }, uAmbCol: { value: LS.amb },
    uSelf: { value: selfLight }, uShaft: { value: new THREE.Vector2(16, 44) }, uInvModel: { value: new THREE.Matrix4() },
    uPx: { value: 0.002 }, uPtScale: { value: 500 },
    uLampP: { value: new THREE.Vector3(14, 120, -150) }, uLampCol: { value: new THREE.Color('#ffc88a') },
  };
  U.uPedalF = U.uPedal; U.uTimeF = U.uTime;                                        // the pedal again under a fragment-side name (pins shimmer in sympathy)
  const score = buildScore(rng, piece, clearKeys, clearWin);
  const root = new THREE.Group(); root.name = 'hall-of-strings-hero';

  // ---- layout: strings, pins
  const T12 = Math.tan(12 * Math.PI / 180), S12 = Math.sin(12 * Math.PI / 180), C12 = Math.cos(12 * Math.PI / 180);
  const Y_PLATE = 44.8, Y_SHELF = 47.3;
  const strings = [];   // { key, ax, ay, az, bx, by, bz, r, bass, px, pz, py }
  for (let k = 0; k < NK; k++) {
    const n = nStr(k), bass = isBass(k);
    for (let s = 0; s < n; s++) {
      const off = (s - (n - 1) / 2) * (bass ? 1.05 : 0.72);
      const L = Math.min(maxLen, bass ? 478 - k * 3.5 : 60 + 350 * Math.pow(1 - (k - 26) / 61, 1.5));
      const ax = keyX(k) + off - (bass ? T12 * 8 : 0), ay = bass ? Y_BASS : Y_STR, az = Z_AGR;
      const o = { key: k, ax, ay, az, r: bass ? (n === 1 ? 0.5 : 0.36) : 0.1, bass, L };
      if (bass) { o.bx = ax + S12 * L; o.by = lerp(Y_BASS, Y_BASS_FAR, Math.min(1, L / 300)); o.bz = az + C12 * L; }
      else { o.bx = ax; o.by = Y_STR; o.bz = az + L; }
      const i = strings.length;
      o.px = ax + rng.range(-0.1, 0.1); o.pz = -23 - (i % 4) * 5.6 - rng.range(0, 0.5); o.py = bass ? Y_SHELF : Y_PLATE;
      strings.push(o);
    }
  }
  const strAt = (s, z) => { const t = (z - s.az) / (s.bz - s.az); return [lerp(s.ax, s.bx, t), lerp(s.ay, s.by, t), z]; };
  const firstOfKey = []; strings.forEach((s, i) => { if (firstOfKey[s.key] === undefined) firstOfKey[s.key] = i; });
  const keyStr = (k) => strings[firstOfKey[k] + ((nStr(k) - 1) >> 1)];
  const strikeAngle = [], restAngle = [];
  const RR = Math.hypot(HEAD_TOP, SHANK), PHI = Math.atan2(HEAD_TOP, SHANK);
  for (let k = 0; k < NK; k++) {
    const ys = strAt(keyStr(k), -9)[1] - keyStr(k).r;
    strikeAngle[k] = Math.asin((ys - PIV_Y) / RR) - PHI;
    restAngle[k] = strikeAngle[k] - 0.56;
  }
  await ctx.yield?.();

  // ---- static structure: canyon, action, plate
  const st = [];
  const wallFn = (base, amt = 0.25) => (x, y, z) => base.clone().multiplyScalar(1 - amt + amt * (0.5 + 0.5 * Math.sin(x * 0.11 + y * 0.3) * Math.cos(z * 0.17 + x * 0.043)));
  const dk = C.dark, lac = C.lacquer;
  const flr = C.mould.clone().lerp(dk, 0.35).multiplyScalar(0.8);
  st.push(colored(quad([-165, 0, 20], [330, 0, 0], [0, 0, -35], 22, 2), flr, { fn: wallFn(flr) }));
  await ctx.yield?.();
  for (let i = 0; i <= 22; i++) {                                 // pilasters and beams on the pin block face
    const x = -157.5 + i * (315 / 22);
    st.push(noBack(colored(chamferBox(3.2, Y_PLATE - 6, 0.9, 0.3, 0.82), C.mould.clone().multiplyScalar(0.8), { m: xf(x, (Y_PLATE - 6) / 2, -14.7) })));
    st.push(noBack(colored(chamferBox(5.0, 2.2, 1.3, 0.4, 0.7), C.mould, { m: xf(x, Y_PLATE - 6, -14.6, Math.PI, 0, 0) })));
    if (i % 4 === 3) await ctx.yield?.();
  }
  st.push(noBack(colored(chamferBox(326, 2.0, 1.1, 0.4), C.mould.clone().multiplyScalar(0.9), { m: xf(0, 30, -14.6) })));
  st.push(noBack(colored(chamferBox(326, 1.4, 1.0, 0.3), cBrz.clone().multiplyScalar(0.6), { m: xf(0, 16, -14.6) })));
  await ctx.yield?.();
  // a pale maple rail along the wall at eye height in the hang, carried on brass action brackets every 6 m
  st.push(noBack(colored(chamferBox(326, 1.5, 1.3, 0.35), C.maple.clone().multiplyScalar(1.05), { m: xf(0, 35.2, -14.3), fn: (x) => C.maple.clone().multiplyScalar(0.95 + 0.14 * Math.sin(x * 0.9) * Math.sin(x * 0.23)) })));
  st.push(noBack(colored(chamferBox(326, 0.5, 0.9, 0.15), C.crimson, { m: xf(0, 36.15, -14.35) })));
  for (let x = -162; x <= 162; x += 6) {
    st.push(noBack(colored(chamferBox(1.0, 4.4, 0.7, 0.2, 0.8), C.brass.clone().multiplyScalar(1.25), { m: xf(x, 33.6, -14.5) })));
    st.push(noBack(colored(chamferBox(1.6, 0.6, 1.7, 0.2, 0.7), C.brass.clone().multiplyScalar(1.4), { m: xf(x, 34.2, -14.1, Math.PI, 0, 0) })));
    st.push(colored(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 6), C.steel.clone().multiplyScalar(1.6), { m: xf(x, 32.2, -13.95, Math.PI / 2, 0, 0) }));
    if ((x + 162) % 60 === 54) await ctx.yield?.();
  }
  await ctx.yield?.();
  st.push(noBack(colored(chamferBox(326, 1.6, 1.0, 0.3), cBrz.clone().multiplyScalar(0.8), { m: xf(0, Y_PLATE - 3.6, -14.7) })));                 // floor
  st.push(colored(quad([-165, 0, -15], [330, 0, 0], [0, Y_PLATE - 1, 0], 22, 3), lac, { fn: wallFn(C.mould, 0.4) })); // pin block face
  await ctx.yield?.();
  st.push(colored(quad([165, 0, 20], [-330, 0, 0], [0, 38.5, 0], 22, 3), lac, { fn: wallFn(dk) }));               // far wall under the lip
  st.push(colored(quad([-165, 0, -15], [0, Y_PLATE, 0], [0, 0, 35], 2, 2), lac, { fn: wallFn(dk) }));
  st.push(colored(quad([165, 0, -15], [0, 0, 35], [0, Y_PLATE, 0], 2, 2), lac, { fn: wallFn(dk) }));
  st.push(colored(quad([-165, 38.5, 14], [330, 0, 0], [0, 0, 6], 22, 1), C.mould));                                // lip underside
  st.push(colored(quad([165, 38.5, 14], [-330, 0, 0], [0, 1.5, 0], 22, 1), C.spruce));                             // lip face
  if (opts.apron !== false) st.push(colored(quad([-165, Y_SB, 70], [330, 0, 0], [0, 0, -56], 30, 4), C.spruce, { fn: wallFn(C.spruce, 0.15) })); // soundboard apron
  await ctx.yield?.();
  // rails
  const restY = PIV_Y + 19 * Math.sin(restAngle[60]) - 0.5;
  st.push(colored(chamferBox(286, 2.4, 3.0, 0.4), C.mould, { m: xf(0, PIV_Y - 2.0, PIV_Z + 0.9) }));               // hammer rail
  st.push(colored(chamferBox(282, 1.3, 2.2, 0.3), C.mould, { m: xf(0, restY - 1.15, PIV_Z - 19) }));               // rest rail
  st.push(colored(chamferBox(282, 0.55, 2.0, 0.2), C.crimson, { m: xf(0, restY - 0.25, PIV_Z - 19) }));            // its crimson felt
  st.push(colored(chamferBox(300, 1.5, 1.5, 0.3), C.mould, { m: xf(0, 22, 13.5) }));                               // let-off rail
  st.push(colored(chamferBox(300, 0.9, 3.2, 0.3), C.crimson, { m: xf(0, 5.6, -11.5) }));                           // back-rail cloth
  st.push(colored(chamferBox(300, 1.2, 3.0, 0.3), cBrz.clone().multiplyScalar(0.5), { m: xf(0, 9.9, 8) }));        // balance rail
  for (let x = -120; x <= 120; x += 30) {
    st.push(colored(chamferBox(2.2, PIV_Y - 3, 2.6, 0.4, 0.8), C.mould, { m: xf(x + 1.6, (PIV_Y - 3) / 2, PIV_Z + 1.6) }));
    st.push(colored(chamferBox(1.3, restY - 1.6, 1.3, 0.3, 0.7), C.mould, { m: xf(x + 1.6, (restY - 1.6) / 2, PIV_Z - 19) }));
  }
  // the action below, one unit per key
  for (let k = 0; k < NK; k++) {
    const x = keyX(k), j = rng.range(-0.25, 0.25), tone = 0.8 + rng.range(0, 0.35);
    const wood = C.maple.clone().multiplyScalar(0.55 * tone);
    st.push(colored(chamferBox(2.5, 1.8, 33, 0.3), wood, { m: xf(x, 8 + j, 2.2, 0.012, 0, 0) }));                  // key lever
    st.push(colored(chamferBox(1.5, 1.7, 14, 0.35), wood, { m: xf(x, 24.4 + j, 10.5, -0.1, 0, 0) }));              // wippen
    st.push(colored(chamferBox(0.9, 8.2, 1.2, 0.2, 0.7), C.mould.clone().multiplyScalar(tone), { m: xf(x, 29.3 + j, 12.7, 0.06, 0, 0) })); // jack
    st.push(colored(chamferBox(0.8, 14.5, 0.8, 0.2), C.brass, { m: xf(x, 16.5 + j, 6.2) }));                       // capstan / sticker
    if ((k & 7) === 7) await ctx.yield?.();
  }
  await ctx.yield?.();
  // bronze plate with chamfered portholes
  const holes = [[-60, -62], [22, -62], [104, -62]];
  {
    const shp = new THREE.Shape();
    shp.moveTo(-165, 15.5); shp.lineTo(165, 15.5); shp.lineTo(165, 78); shp.lineTo(-165, 78); shp.closePath();
    for (const [hx, hz] of holes) { const h = new THREE.Path(); h.absarc(hx, -hz, 8.1, 0, Math.PI * 2, true); shp.holes.push(h); }
    const ex = new THREE.ExtrudeGeometry(shp, { depth: 2, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.6, bevelSegments: 1, curveSegments: 16, steps: 1 });
    ex.rotateX(-Math.PI / 2); ex.translate(0, Y_PLATE - 2.6, 0);
    const brz = C.bronze;
    await ctx.yield?.();
    st.push(colored(ex, brz, { fn: (x, y, z) => brz.clone().multiplyScalar(0.78 + 0.22 * ctx.noise.n2(x * 0.05, z * 0.05)) }));
    await ctx.yield?.();
    st.push(colored(chamferBox(84, Y_SHELF - Y_PLATE, 31, 0.5, 0.985), brz, { m: xf(-99, (Y_SHELF + Y_PLATE) / 2, -31.5) }));  // bass shelf
    st.push(colored(chamferBox(192, 0.5, 2.6, 0.2), brz.clone().multiplyScalar(1.15), { m: xf(42, Y_PLATE + 0.25, Z_AGR) }));  // agraffe bar
    st.push(colored(chamferBox(326, 1.3, 2.0, 0.4), brz, { m: xf(0, Y_PLATE + 0.65, -47.5) }));
    st.push(colored(chamferBox(326, 1.8, 2.4, 0.5), brz, { m: xf(0, Y_PLATE + 0.9, -76.5) }));
    for (let x = -150; x <= 150; x += 20.5) {                      // ribs fanning across the web, skipping the portholes
      if (holes.some((h) => Math.abs(x - h[0]) < 11.5)) continue;
      st.push(colored(chamferBox(1.8, 1.2, 27, 0.4, 0.8), brz, { m: xf(x, Y_PLATE + 0.6, -62, 0, (x / 150) * 0.12, 0) }));
    }
    for (const [hx, hz] of holes) {                                // bolt circle + dark well
      for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; st.push(colored(new THREE.CylinderGeometry(0.55, 0.8, 0.7, 6), C.brass, { m: xf(hx + Math.cos(a) * 10.2, Y_PLATE + 0.35, hz + Math.sin(a) * 10.2) })); }
      const well = new THREE.CylinderGeometry(7.6, 6.6, 16, 24, 1, true); well.scale(-1, 1, 1);
      st.push(colored(well, dk, { m: xf(hx, Y_PLATE - 2.6 - 8, hz), fn: (x, y, z) => dk.clone().multiplyScalar(0.25 + 0.75 * smoothstep(Y_PLATE - 16, Y_PLATE - 2, y)) }));
      await ctx.yield?.();
    }
    for (let hi = 0; hi < holes.length; hi++) {                   // cast collar chamfered down into each porthole
      const [hx, hz] = holes[hi];
      const prof = [[7.72, Y_PLATE - 0.45], [8.25, Y_PLATE + 0.7], [9.0, Y_PLATE + 0.7], [9.55, Y_PLATE]].map((q) => new THREE.Vector2(q[0], q[1]));
      st.push(colored(new THREE.LatheGeometry(prof, 56), brz.clone().multiplyScalar(1.2), { smooth: true, m: xf(hx, 0, hz) }));
      // foundry lettering cast in an arc on the tail side of the porthole, and a pair of raised bosses
      for (let a = 0.26; a < Math.PI - 0.26;) {
        const w = rng.range(0.05, 0.13), r = 12.4;
        st.push(colored(chamferBox(r * w, 0.4, rng.range(1.3, 1.8), 0.16), brz.clone().multiplyScalar(1.18), { m: xf(hx + Math.cos(a + w / 2) * r, Y_PLATE + 0.3, hz + Math.sin(a + w / 2) * r, 0, Math.PI / 2 - (a + w / 2), 0) }));
        a += w + rng.range(0.025, 0.06);
      }
      for (const sx of [-1, 1]) {
        st.push(colored(new THREE.CylinderGeometry(1.5, 2.0, 0.9, 10), brz.clone().multiplyScalar(1.15), { m: xf(hx + sx * 15.5, Y_PLATE + 0.45, hz - 6.5) }));
        st.push(colored(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 6), C.brass, { m: xf(hx + sx * 15.5, Y_PLATE + 1.1, hz - 6.5) }));
        if (hi === 0 || sx > 0) st.push(colored(chamferBox(1.5, 0.9, 11, 0.35, 0.7), brz.clone().multiplyScalar(1.1), { m: xf(hx + sx * 13.2, Y_PLATE + 0.45, hz - 8.5, 0, sx * 0.5, 0) }));
      }
      await ctx.yield?.();
    }
    await ctx.yield?.();
    for (const [hx, hz] of holes.slice(1)) st.push(colored(quad([hx - 7, Y_PLATE - 18.5, hz + 7], [14, 0, 0], [0, 0, -14]), dk.clone().multiplyScalar(0.2)));
    // "foundry lettering": abstract raised bosses in two rows
    for (const row of [[-52.5, -140, -84], [-52.5, -36, -2], [-52.5, 46, 80], [-71.5, 40, 86]]) {
      for (let x = row[1]; x < row[2];) { const w = rng.range(0.8, 3.2); st.push(colored(chamferBox(w, 0.55, rng.range(2.2, 3.2), 0.2), brz.clone().multiplyScalar(1.12), { m: xf(x + w / 2, Y_PLATE + 0.27, row[0]) })); x += w + rng.range(0.4, 1.4); }
    }
  }
  await ctx.yield?.();
  const staticGeo = mergeGeometries(st);
  await ctx.yield?.();
  const staticMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.0 }), U, { key: 'static', grain: 1, spec: 0.12, shin: 24, deep: 3.4 });
  const staticMesh = new THREE.Mesh(staticGeo, staticMat); staticMesh.name = 'canyon'; root.add(staticMesh);
  st.forEach((g) => g.dispose());
  await ctx.yield?.();

  // ---- hammers
  const hamGeo = hammerGeometry(C, rng);
  await ctx.yield?.();
  const kaArr = new Float32Array(NK * 3);
  const hamMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 }), U, {
    key: 'hammer', spec: 0.05, shin: 14, fillK: 1.6, fillMin: 0.7,
    vhead: 'attribute vec3 aKA;\nfloat hc, hs;\nvarying vec4 vHam;\n',
    fhead: 'varying vec4 vHam;\n',
    fcolor: `if (vColor.g > 0.6) {
      vec3 hq = vec3(vHam.x, vHam.y - 1.0, vHam.z + ${SHANK.toFixed(1)}); float ly = hq.y / 2.5;
      float fib = hNoise(hq * 6.0 + vHam.w * 3.7) * 0.6 + hNoise(hq * 19.0 + vHam.w) * 0.4;                 // felt fibre
      float rr = length(vec2(ly, hq.z / 1.75));
      vec3 felt = ${v3(C.felt)} * 1.12 * (0.8 + 0.2 * clamp(ly + 0.6, 0.0, 1.0)) * (0.7 + 0.5 * fib) * (0.9 + 0.1 * sin(rr * 30.0)) * (0.86 + 0.14 * hNoise(vec3(hq.x * 2.0, hq.y * 26.0, hq.z * 26.0)));   // pressed layers, fibre
      float groove = smoothstep(0.78, 0.93, ly) * (1.0 - smoothstep(0.05, 0.17, abs(abs(hq.x) - 0.45)));   // the strings' grooves pressed into the crown
      felt *= 1.0 - 0.45 * groove;
      float wf = smoothstep(-0.07, 0.2, ly + 0.05 * (fib - 0.5));                                                               // 0.3 m of soft seam down to the underfelt
      vec3 hc3 = mix(${v3(C.crimson)} * (0.6 + 0.6 * fib), felt, wf);
      diffuseColor.rgb = mix(${v3(C.mould)}, hc3, smoothstep(-0.76, -0.66, ly));
      hFeltK = wf;
    }`,
    vnormal: `vec4 hE = hEnv(aKA.x); float hA = mix(aKA.y, aKA.z, hE.r); hc = cos(hA); hs = sin(hA);
      objectNormal.yz = vec2(objectNormal.y * hc - objectNormal.z * hs, objectNormal.y * hs + objectNormal.z * hc);`,
    vpos: `transformed.yz = vec2(transformed.y * hc - transformed.z * hs, transformed.y * hs + transformed.z * hc);
      vHam = vec4(position, aKA.x);
      vGlow = vec3(0.80, 0.86, 1.0) * smoothstep(0.5, 0.62, color.g) * (1.0 - smoothstep(0.06, 0.2, color.r - color.b)) * smoothstep(0.0, 0.3, (position.y - 1.0) / 2.5)
        * (0.2 * hE.r * hE.r * hE.r + 0.75 * smoothstep(-0.1, 0.03, hE.b) * exp(-max(hE.b, 0.0) * 5.0));`,
  });
  const hammers = new THREE.InstancedMesh(hamGeo, hamMat, NK); hammers.name = 'hammers'; hammers.frustumCulled = false;
  for (let k = 0; k < NK; k++) {
    const fat = 1 + 0.16 * (1 - k / 87) + rng.range(-0.02, 0.02);
    hammers.setMatrixAt(k, xf(keyX(k), PIV_Y, PIV_Z, 0, 0, 0, fat, 1, 1));
    kaArr[k * 3] = k; kaArr[k * 3 + 1] = restAngle[k] + rng.range(-0.006, 0.006); kaArr[k * 3 + 2] = strikeAngle[k];
  }
  hamGeo.setAttribute('aKA', new THREE.InstancedBufferAttribute(kaArr, 3));
  root.add(hammers);

  await ctx.yield?.();
  // ---- dampers (keys 0..69)
  const ND = 70, damGeo = damperGeometry(C), dk2 = new Float32Array(ND);
  const damMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0 }), U, {
    key: 'damper', spec: 0.9, shin: 60, vhead: 'attribute float aKey;\n', vpos: 'transformed.y += hEnv(aKey).a * 3.0;',
  });
  const dampers = new THREE.InstancedMesh(damGeo, damMat, ND); dampers.name = 'dampers'; dampers.frustumCulled = false;
  for (let k = 0; k < ND; k++) {
    const s = keyStr(k), q = strAt(s, Z_DAMP);
    dampers.setMatrixAt(k, xf(q[0], q[1] + s.r, q[2] + (k % 2) * 0.5, 0, s.bass ? Math.atan(T12) : 0, 0, s.bass ? 1.1 : 1, 1, 1));
    dk2[k] = k;
  }
  damGeo.setAttribute('aKey', new THREE.InstancedBufferAttribute(dk2, 1));
  root.add(dampers);

  await ctx.yield?.();
  // ---- tuning pins and agraffes
  const NS = strings.length;
  const pinMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0 }), U, { key: 'pin', spec: 4, shin: 46, pin: 1 });
  const pins = new THREE.InstancedMesh(pinGeometry(C), pinMat, NS); pins.name = 'pins';
  const agrMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0 }), U, { key: 'agraffe', spec: 1.2, shin: 30 });
  const agraffes = new THREE.InstancedMesh(agraffeGeometry(C), agrMat, NS); agraffes.name = 'agraffes';
  strings.forEach((s, i) => {
    pins.setMatrixAt(i, xf(s.px, s.py, s.pz, rng.range(-0.05, 0.02), rng.range(0, 6.28), 0, 1, 1 + rng.range(-0.04, 0.04), 1));
    const sc = s.bass ? 1.25 : 0.8;
    agraffes.setMatrixAt(i, xf(s.ax, s.ay - 1.05 * sc, s.az, 0, 0, 0, sc, sc, sc));
  });
  root.add(pins, agraffes);
  await ctx.yield?.();

  // ---- strings: instanced camera-facing ribbons (speaking length + the run from agraffe back to the pin)
  let stringMesh = null;
  if (withStrings) {
    const SEG = 32, base = new Float32Array((SEG + 1) * 2 * 3), idx = [];
    for (let i = 0; i <= SEG; i++) { base.set([i / SEG, -1, 0, i / SEG, 1, 0], i * 6); if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setIndex(idx);
    const iA = new Float32Array(NS * 6), iB = new Float32Array(NS * 6), iI = new Float32Array(NS * 8);
    strings.forEach((s, i) => {
      const sd = rng();
      iA.set([s.ax, s.ay, s.az], i * 3); iB.set([s.bx, s.by, s.bz], i * 3); iI.set([s.key, s.r, s.bass ? 1 : 0, sd], i * 4);
      const j = NS + i;
      iA.set([s.px, s.py + 1.65, s.pz + 0.8], j * 3); iB.set([s.ax, s.ay, s.az], j * 3); iI.set([-1, s.r * (s.bass ? 0.55 : 1), s.bass ? 1 : 0, sd], j * 4);
    });
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 3));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 3));
    g.setAttribute('iInfo', new THREE.InstancedBufferAttribute(iI, 4));
    g.instanceCount = NS * 2;
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
      vertexShader: /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        attribute vec3 iA; attribute vec3 iB; attribute vec4 iInfo;
        uniform sampler2D uEnv; uniform float uTime, uPedal, uPx;
        varying float vV, vCore, vEnvF, vAmp, vKind, vLen, vSeed, vAge, vT;
        void main(){
          float t = position.x, sd = position.y, amp = 0.0, age = 99.0;
          if (iInfo.x > -0.5) {
            vec4 e = texelFetch(uEnv, ivec2(int(iInfo.x + 0.5), 0), 0); age = e.b;
            amp = max(e.g, uPedal * 0.07 * (0.6 + 0.4 * sin(uTime * 3.1 + iInfo.w * 40.0)));
          }
          float s1 = abs(sin(PI * t)), s2 = abs(sin(2.0 * PI * t)), s3 = abs(sin(3.0 * PI * t));
          float shape = 0.62 * s1 + 0.26 * s2 * (0.6 + 0.4 * sin(uTime * 5.3 + iInfo.w * 17.0)) + 0.14 * s3 * (0.6 + 0.4 * sin(uTime * 8.1 + iInfo.w * 31.0));
          float env = 1.5 * amp * shape;
          vec3 P = mix(iA, iB, t);
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
          vec3 dv = normalize((modelViewMatrix * vec4(iB - iA, 0.0)).xyz);
          vec3 side = normalize(cross(dv, mvPosition.xyz));
          float dist = length(mvPosition.xyz), r = iInfo.y;
          float hw = max(max(r, env), 0.8 * uPx * dist);
          mvPosition.xyz += side * sd * hw;
          vV = sd; vCore = r / hw; vEnvF = env / hw; vAmp = amp; vKind = iInfo.z; vSeed = iInfo.w; vAge = age; vT = t;
          vLen = t * length(iB - iA);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform vec3 uCopper, uSilver, uKeyCol, uFillCol, uAmbCol; uniform float uTime, uGlow, uSelf, uPedalF, uIdle;
        varying float vV, vCore, vEnvF, vAmp, vKind, vLen, vSeed, vAge, vT;
        ${FOG_F}
        void main(){
          float a = abs(vV), fw = max(fwidth(vV), 1e-4);
          bool sub = vCore < fw;
          float core = sub ? min(1.0, 2.0 * vCore / fw) * (1.0 - a) : clamp((vCore - a) / fw + 0.5, 0.0, 1.0);
          vec3 base = mix(uSilver * 0.24, uCopper * 0.5, vKind);
          float s = vLen / 0.6, fs = fwidth(s);
          base *= mix(1.0, mix(0.5 + 0.5 * (0.5 + 0.5 * sin(6.2832 * s)), 0.76, clamp(fs * 2.5, 0.0, 1.0)), vKind);
          float nx = clamp(vV / max(vCore, 1e-3), -1.0, 1.0), cyl = sqrt(1.0 - nx * nx);
          float hlGain = mix(0.3, uIdle, vKind) + 1.8 * vAmp;
          vec3 gcol = mix(mix(uSilver, vec3(0.5, 0.68, 1.0), 0.45), uCopper * vec3(1.5, 1.0, 0.62), vKind);
          vec3 hlCol = mix(uKeyCol, uKeyCol * (0.45 + 0.9 * uCopper), 0.6 * vKind);                 // a copper string carries the key as a warm line
          vec3 lit = sub ? base * (uAmbCol * 1.2 + uKeyCol * 0.4 + uFillCol * 0.4) + hlCol * 0.14 * hlGain
                         : base * (uAmbCol * 1.2 + uKeyCol * 0.6 * cyl + uFillCol * 0.9 * (0.5 - 0.5 * nx)) + hlCol * exp(-pow((nx - 0.35) / 0.11, 2.0)) * hlGain;
          lit *= max(uSelf, 0.15);
          // sympathy: with the dampers lifted every string of the field carries a little light of its own
          float symp = uPedalF * step(0.0, vAge) * (0.7 + 0.3 * sin(uTime * 3.1 + vSeed * 40.0));
          lit += gcol * uGlow * symp * mix(0.4, 0.3, vKind) * (sub ? 1.0 : 0.45 + 0.55 * cyl);
          // the ribbon: long exposure of a standing wave, bright at the turning points, with ghost strands
          vec3 rgb = lit * core; float alpha = core;
          if (vEnvF > 0.002) {
            float q = a / vEnvF, inside = 1.0 - smoothstep(1.0 - max(fw / vEnvF, 0.03), 1.0, q);
            float dens = 0.1 + 0.92 * pow(min(q, 1.0), 7.0);
            float sv = vV / vEnvF;
            for (int i = 0; i < 3; i++) {
              float gp = sin(uTime * (9.0 + 4.0 * float(i)) + vSeed * 20.0 + float(i) * 2.1 + vT * 5.0);
              dens += 0.26 * exp(-pow((sv - gp) / (0.05 + fw / vEnvF), 2.0));
            }
            float flash = 1.0 + 1.2 * exp(-vAge * 4.0);
            rgb += gcol * uGlow * mix(0.5, 1.0, vKind) * dens * inside * (0.2 + 0.8 * max(vAmp, 0.35 * symp)) * flash * smoothstep(0.0, 0.25, vEnvF) * mix(0.2, 1.0, smoothstep(0.0, 12.0, abs(vLen - 8.0)));
            alpha += 0.05 * inside * vAmp * (1.0 - core);
          }
          #ifdef USE_FOG
            rgb = mix(rgb, fogColor * alpha, hFog());
          #endif
          gl_FragColor = vec4(rgb, alpha);
        }`,
    });
    Object.assign(mat.uniforms, { uEnv: U.uEnv, uTime: U.uTime, uPedal: U.uPedal, uPx: U.uPx, uKeyCol: U.uKeyCol, uFillCol: U.uFillCol, uAmbCol: U.uAmbCol, uSelf: U.uSelf,
      uCopper: { value: cCop.clone() }, uSilver: { value: cSil.clone() }, uGlow: { value: 0.62 }, uPedalF: U.uPedal, uIdle: { value: 0.5 } });
    stringMesh = new THREE.Mesh(g, mat); stringMesh.name = 'strings'; stringMesh.frustumCulled = false; stringMesh.renderOrder = 2;
    root.add(stringMesh);
  }
  await ctx.yield?.();

  await ctx.yield?.();
  // ---- dust bound to strings (leaps in the shape of the standing wave) + one strike flash per key
  const NP = nDust + NK, dPos = new Float32Array(NP * 3), dD = new Float32Array(NP * 4);
  for (let i = 0; i < nDust; i++) {
    const s = strings[Math.floor(rng() * strings.length)];
    const t = Math.min(0.98, (0.01 + Math.pow(rng(), 1.5) * 190) / s.L + 0.01);
    const q = strAt(s, lerp(s.az, s.bz, t));
    dPos.set([q[0] + rng.range(-0.4, 0.4), q[1] + 0.3 + rng() * 1.2, q[2]], i * 3);
    dD.set([s.key, t, rng(), rng()], i * 4);
  }
  await ctx.yield?.();
  for (let k = 0; k < NK; k++) {
    const s = keyStr(k), q = strAt(s, -9), i = nDust + k;
    dPos.set([q[0], q[1] - 0.2, q[2]], i * 3); dD.set([k, 0, rng(), 2], i * 4);
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('aD', new THREE.BufferAttribute(dD, 4));
  const dMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aD; uniform sampler2D uEnv; uniform float uTime, uPtScale, uPedal; uniform vec3 uCopper, uSilver, uKeyCol;
      varying vec3 vCol; varying float vFlash;
      void main(){
        vec4 e = texelFetch(uEnv, ivec2(int(aD.x + 0.5), 0), 0);
        float age = e.b, sz, mn = 1.5; vec3 p = position; vec3 tint = mix(uSilver, uCopper * 1.3, step(aD.x, 25.5));
        if (aD.w > 1.5) {
          float f = exp(-age * 7.0) * step(age, 2.0);
          sz = 6.0 * (0.35 + 0.65 * f); vCol = mix(tint, uKeyCol, 0.5) * 1.3 * f; vFlash = 1.0; mn = 0.0;
        } else {
          float shape = abs(sin(PI * aD.y * (1.0 + floor(aD.w * 3.0))));
          float up = (3.0 + 3.0 * aD.z) * shape * (1.0 - exp(-age * 5.0)) * exp(-age * 0.5) * step(age, 30.0) + uPedal * 0.7 * aD.z;
          p.y += up + 0.25 * sin(uTime * 0.4 + aD.z * 50.0);
          p.x += 0.5 * sin(uTime * 0.23 + aD.w * 70.0) + up * 0.25 * sin(aD.z * 91.0);
          p.z += 0.5 * cos(uTime * 0.19 + aD.z * 33.0);
          sz = 0.2 + 0.25 * aD.w; vFlash = 0.0;
          vCol = tint * (0.2 + 1.7 * min(up / 3.0, 1.0)) * (0.6 + 0.4 * sin(uTime * 2.0 + aD.z * 80.0));
        }
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        float ideal = sz * uPtScale / max(-mvPosition.z, 0.1);
        gl_PointSize = clamp(ideal, mn, 150.0);
        if (aD.w < 1.5) vCol *= min(1.0, pow(ideal / 1.5, 2.0));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      varying vec3 vCol; varying float vFlash;
      ${FOG_F}
      void main(){
        vec2 c = gl_PointCoord * 2.0 - 1.0; float d = length(c);
        float soft = 1.0 - smoothstep(0.35, 1.0, d);
        float star = exp(-d * d * 7.0) + 0.6 * exp(-c.y * c.y * 160.0) * exp(-c.x * c.x * 3.5) * (1.0 - smoothstep(0.7, 1.0, abs(c.x)));
        vec3 rgb = vCol * mix(soft, star, vFlash) * (1.0 - hFog());
        gl_FragColor = vec4(rgb, 1.0);
      }`,
  });
  Object.assign(dMat.uniforms, { uEnv: U.uEnv, uTime: U.uTime, uPedal: U.uPedal, uPtScale: U.uPtScale, uKeyCol: U.uKeyCol, uCopper: { value: cCop.clone() }, uSilver: { value: cSil.clone() } });
  const dust = new THREE.Points(dGeo, dMat); dust.name = 'dust'; dust.frustumCulled = false; dust.renderOrder = 3;
  root.add(dust);

  await ctx.yield?.();
  // ---- thin warm line on the chamfered porthole rims (the exit one is brightest)
  const rims = holes.map(([hx, hz], i) => {
    const hot = cSpr.clone().multiplyScalar(i === 0 ? 8.0 : 0.9);
    return colored(new THREE.TorusGeometry(7.72, i === 0 ? 0.16 : 0.1, 5, 72), hot, { smooth: true, m: xf(hx, Y_PLATE - 0.25, hz, Math.PI / 2, 0, 0) });
  });
  rims.push(colored(new THREE.TorusGeometry(8.28, 0.1, 5, 72), cSpr.clone().multiplyScalar(4.5), { smooth: true, m: xf(holes[0][0], Y_PLATE + 0.72, holes[0][1], Math.PI / 2, 0, 0) }));
  rims.push(colored(new THREE.TorusGeometry(9.5, 0.07, 5, 72), cSpr.clone().multiplyScalar(2.4), { smooth: true, m: xf(holes[0][0], Y_PLATE + 0.06, holes[0][1], Math.PI / 2, 0, 0) }));
  // the rims carry a slow shimmer that walks round each ring
  const rimMat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uPedalF: U.uPedal }, fog: true, vertexColors: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vC; varying vec2 vXZ;
      void main(){ vC = color; vXZ = position.xz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uPedalF; varying vec3 vC; varying vec2 vXZ;
      void main(){
        vec2 d = vXZ - vec2(${holes[0][0].toFixed(1)}, ${holes[0][1].toFixed(1)}); float an = atan(d.y, d.x + 1e-4);
        float sh = 0.62 + 0.3 * sin(an * 3.0 - uTime * 0.9) + 0.22 * sin(an * 7.0 + uTime * 1.7) + 0.3 * uPedalF;
        gl_FragColor = vec4(vC * sh, 1.0);
        #include <fog_fragment>
      }`,
  });
  const rimMesh = new THREE.Mesh(mergeGeometries(rims), rimMat);
  rimMesh.name = 'porthole-rims'; root.add(rimMesh);

  // ---- anchors
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const portal = v(holes[0][0], Y_PLATE - 0.6, holes[0][1]);
  const diveDir = v(Math.cos(55 * Math.PI / 180), -Math.sin(55 * Math.PI / 180), 0);
  const diveStart = portal.clone().addScaledVector(diveDir, -60);
  const anchors = {
    flyThrough: [v(-153, 60, 78), v(-153, 57, 42), v(-154, 49, 15), v(-155, 35, 3), v(-155, 31, -1), v(-155, 47, -4), v(-153, 61, -22), v(-128, 84, -52), diveStart.clone(), portal.clone()],
    canyonHang: v(-155, 31, -1), canyonLook: v(140, 37, -9),
    rankStart: v(keyX(0), Y_STR, -9), rankEnd: v(keyX(87), Y_STR, -9),
    portalSeat: { position: portal, normal: v(0, 1, 0), radius: 7 }, diveStart, diveDir,
    damperLine: [v(strAt(keyStr(0), Z_DAMP)[0], Y_BASS + 2, Z_DAMP), v(strAt(keyStr(69), Z_DAMP)[0], Y_STR + 2, Z_DAMP)],
    portholes: holes.slice(1).map(([hx, hz]) => v(hx, Y_PLATE, hz)),
    spotAxis: keyDirLocal.clone(),
  };

  // ---- runtime
  let manual = false, prog = 0;
  const size = new THREE.Vector2();
  function setProgress(u) { manual = true; prog = clamp(u, 0, 1); }
  function update(dt, time, camera) {
    const t = (manual ? prog : (time / SCORE_LEN) % 1) * SCORE_LEN;
    U.uPedal.value = evalScore(score, t, envData); envTex.needsUpdate = true;
    U.uTime.value = time;
    root.updateWorldMatrix(true, false);
    U.uInvModel.value.copy(root.matrixWorld).invert();
    U.uKeyDir.value.copy(keyDirLocal).transformDirection(root.matrixWorld);
    if (camera) {
      let h = 720; if (ctx.renderer?.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 720;
      const p11 = camera.projectionMatrix.elements[5];
      U.uPx.value = 2 / (p11 * h); U.uPtScale.value = p11 * h / 2;
    }
  }
  update(0, 0, null);

  return {
    object: root, radius: 62, height: 24, center: new THREE.Vector3(0, 34, 1.5),
    bounds: { min: v(-165, 0, -78), max: v(165, 60, Z_AGR + Math.min(maxLen, 490)) },
    anchors, update, setProgress,
    setSelfLight(x) { U.uSelf.value = x; },
    score: score.ev, pedalTimes: score.pedalTimes, scoreSeconds: SCORE_LEN, piece, lightState,
    envTexture: envTex, uniforms: U, keyX,
    parts: { strings: stringMesh, hammers, dampers, pins, agraffes, dust, canyon: staticMesh },
    dispose() { envTex.dispose(); },
    ground: false, groundY: 0,
  };
}
