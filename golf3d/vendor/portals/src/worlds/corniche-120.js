// Corniche at 120 BPM
// A neon vector coast road ridden flat-out on a wire motorbike: a hooped sea tunnel, S-bends cut into a
// contour-line cliff, a headland with a lighthouse, then the Corkscrew (a twisted-ladder causeway that
// rolls us once round its axis) and the Equaliser City, a skyline that is a live spectrum analyser.
// Everything is unlit line drawing in custom shaders on one clock (beat = 80 * u), so style: 'none'.
//
// Layout: the hero's space is the world's space (landfall at the origin, travel toward -Z). The corniche
// is laid out backward from the causeway's start. The lean and the roll are done by counter-rolling the
// world's root group about the camera's view axis; the bike is drawn in camera space and never moves.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeLines, makeTrail, GLSL_INK, GLSL_WET, GLSL_FOG_PARS_V, GLSL_FOG_PARS_F, GLSL_FOG_ADD, GLSL_FOG_MIX } from '../parts/corniche-120.js';

const LEN = 1020, BLVD = 1050, EYE = 1.2, ROAD_Y = 61, DECK_Y = 13;
const BEATS = 80, D0_BEATS = 30;
const BEAT_LEN = (LEN + BLVD) / (BEATS - D0_BEATS);      // 41.4 m ridden per beat
const D0 = D0_BEATS * BEAT_LEN;                          // length of the corniche before the causeway
const TUNNEL = 160, SBEND = 440, LAUNCH = 172, SWEEP = D0 - TUNNEL - SBEND - LAUNCH;
const SWEEP_ANG = 40 * Math.PI / 180, S_R = 140;
const BACK = 150;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const LOOKS = {
  dusk: {
    palette: ['#0A0418', '#1B0F4A', '#3A1470', '#FF2BD6', '#19F0FF', '#FF5A7A', '#FFB000'],
    top: '#150b3c', mid: '#3A1470', hor: '#b03a5c', horK: 0.5, below: '#0b0520', fog: '#241050', sun: '#FFB000', sun2: '#ff4a8a',
    stars: 0.22, crescent: 0, inkGain: 1, cityGain: 1, band: 0.74, exposure: 1.0, tint: '#fff4ff', shadow: '#06021a', glow: 0.6,
  },
  night: {
    palette: ['#05020e', '#0c0730', '#24105a', '#FF2BD6', '#19F0FF', '#FF5A7A', '#FFB000'],
    top: '#0b0630', mid: '#22106a', hor: '#5a22a8', horK: 1.3, below: '#04020c', fog: '#0f0730', sun: '#FFB000', sun2: '#FFB000',
    stars: 0.66, crescent: 1, inkGain: 1.15, cityGain: 1.13, band: 0.9, exposure: 1.05, tint: '#f4f0ff', shadow: '#03010e', glow: 1,
  },
  dawn: {
    palette: ['#06101c', '#0d2f4a', '#1f5a70', '#FF2BD6', '#19F0FF', '#FF8A9A', '#FFC24a'],
    top: '#082338', mid: '#14606a', hor: '#d9627c', horK: 0.55, below: '#06141f', fog: '#12384c', sun: '#FFC24a', sun2: '#ff6a8a',
    stars: 0.08, crescent: 0, inkGain: 1, cityGain: 1, band: 0.74, exposure: 1.0, tint: '#f6fbff', shadow: '#02101a', glow: 0.5,
  },
};

// ---------------------------------------------------------------- the road before the causeway
// centreline every `step` metres from d = -BACK (behind the entry, inside the tunnel) to d = D0
function layCorniche(step) {
  // signed curvature (positive = right) as a function of distance, smoothed at the joins
  const arcs = [[TUNNEL, 0], [73, -1 / S_R], [147, 1 / S_R], [147, -1 / S_R], [73, 1 / S_R], [SWEEP, SWEEP_ANG / SWEEP], [LAUNCH, 0]];
  const kRaw = (d) => { let a = 0; for (const [len, k] of arcs) { if (d < a + len) return k; a += len; } return 0; };
  const kAt = (d) => { let s = 0; for (let i = -4; i <= 4; i++) s += kRaw(d + i * 6); return s / 9; };
  // integrate heading backward from the causeway start (heading 0 = -Z) so the end lands exactly
  const fine = 1, n = Math.round((D0 + BACK) / fine);
  const xs = new Float64Array(n + 1), zs = new Float64Array(n + 1), hs = new Float64Array(n + 1);
  let x = 14, z = LEN, psi = 0;
  xs[n] = x; zs[n] = z; hs[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    const d = -BACK + (i + 0.5) * fine;
    psi -= kAt(d) * fine;
    x -= Math.sin(psi) * fine; z += Math.cos(psi) * fine;
    xs[i] = x; zs[i] = z; hs[i] = psi;
  }
  const at = (d) => {
    const f = clamp((d + BACK) / fine, 0, n), i = Math.min(n - 1, Math.floor(f)), t = f - i;
    const psiD = lerp(hs[i], hs[i + 1], t);
    return { x: lerp(xs[i], xs[i + 1], t), z: lerp(zs[i], zs[i + 1], t), psi: psiD, tx: Math.sin(psiD), tz: -Math.cos(psiD), k: kAt(d) };
  };
  const pts = [];
  for (let d = 0; d < D0 - 1; d += step) pts.push(at(d));
  return { at, pts, kAt };
}

// ---------------------------------------------------------------- sky: nine flat bands, slit sun, plus-stars, cloud bars
function buildSky(look, sunDir, U, rng, hue = 0) {
  // `hue` turns the three band colours a little by seed, so two visits with the same look still differ
  const top = new THREE.Color(look.top).offsetHSL(hue, 0, 0), mid = new THREE.Color(look.mid).offsetHSL(hue, 0, 0), hor = new THREE.Color(look.hor).offsetHSL(hue * 1.5, 0, 0).multiplyScalar(look.horK);
  const bands = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8, c = new THREE.Color();
    if (t < 0.45) c.copy(hor).lerp(mid, Math.pow(t / 0.45, 0.8)); else c.copy(mid).lerp(top, (t - 0.45) / 0.55);
    bands.push(c.multiplyScalar(look.band));
  }
  const clouds = [];
  for (let i = 0; i < 3; i++) clouds.push(new THREE.Vector4(rng.range(-1.6, 0.4), (7 + i * 5.5 + rng.range(-1, 1)) * Math.PI / 180, rng.range(0.22, 0.42), rng.range(0.6, 1.2)));
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false, side: THREE.BackSide, fog: false,
    uniforms: {
      uBand: { value: bands }, uBelow: { value: new THREE.Color(look.below) }, uSunDir: { value: sunDir },
      uSunA: { value: new THREE.Color(look.sun) }, uSunB: { value: new THREE.Color(look.sun2) }, uMag: { value: new THREE.Color(look.palette[3]) },
      uBeat: U.uBeat, uTime: { value: 0 }, uStars: { value: look.stars }, uCrescent: { value: look.crescent }, uCloud: { value: clouds },
      uSeed: { value: rng.range(0, 50) }, uGlow: { value: look.glow },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      varying vec3 vDir;
      uniform vec3 uBand[9]; uniform vec3 uBelow, uSunDir, uSunA, uSunB, uMag; uniform vec4 uCloud[3];
      uniform float uBeat, uTime, uStars, uCrescent, uSeed, uGlow;
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir + vec3(0.0, 0.0, 1e-5));
        float el = asin(clamp(d.y, -1.0, 1.0)), e = degrees(el);
        float w = max(fwidth(e), 1e-4) * 0.75;
        float f = smoothstep(2.6 - w, 2.6 + w, e) + smoothstep(6.0 - w, 6.0 + w, e) + smoothstep(10.5 - w, 10.5 + w, e) + smoothstep(16.0 - w, 16.0 + w, e)
          + smoothstep(23.0 - w, 23.0 + w, e) + smoothstep(32.0 - w, 32.0 + w, e) + smoothstep(44.0 - w, 44.0 + w, e) + smoothstep(60.0 - w, 60.0 + w, e);
        float fi = floor(min(f, 7.999));
        vec3 col = mix(uBand[int(fi)], uBand[int(fi) + 1], f - fi);
        // the city's glow: the low bands ahead of us (toward the bay) are lifted in magenta, band by band, so the
        // towers stand against light
        float az = atan(d.x, -d.z + 1e-5);
        col += uMag * 0.10 * uGlow * exp(-f * 0.62) * (1.0 - smoothstep(0.55, 1.05, abs(az)));
        // the sun: a disc cut by slits that step downward once a beat
        float ca = clamp(dot(d, uSunDir), -1.0, 1.0);
        float ang = acos(ca), R = 0.0785, wa = max(fwidth(ang), 1e-5);
        float disc = 1.0 - smoothstep(R - wa, R + wa, ang);
        float sunEl = asin(clamp(uSunDir.y, -1.0, 1.0));
        float sy = (el - sunEl) / R;
        float stepB = floor(uBeat) + smoothstep(0.0, 0.3, fract(uBeat));
        float sl = fract(sy * 3.0 + stepB), duty = 0.12 + 0.3 * (0.5 - 0.5 * sy);
        float wsl = max(fwidth(sy * 3.0), 1e-4);
        float slit = smoothstep(duty - wsl, duty + wsl, sl) * (1.0 - smoothstep(1.0 - wsl, 1.0, sl));
        slit = mix(slit, 1.0, smoothstep(0.35, 0.8, sy));
        vec3 sunC = mix(uSunB, uSunA, smoothstep(-1.0, 0.3, sy)) * 1.55;
        // night: a thin crescent with the same slits
        vec3 off = normalize(uSunDir + vec3(0.02, 0.022, 0.012));
        float ang2 = acos(clamp(dot(d, off), -1.0, 1.0));
        float bite = 1.0 - smoothstep(R - wa, R + wa, ang2);
        float shape = disc * mix(1.0, 1.0 - bite, uCrescent) * mix(slit, max(slit, 0.6), uCrescent);
        col = mix(col, sunC, shape);
        col += uSunA * 0.07 * exp(-ang * ang / 0.09) * (1.0 - 0.6 * uCrescent);
        // plus-mark stars in the top bands, twinkling on the sixteenths
        vec2 sp = d.xz / (0.45 + max(d.y, 0.0)) * 6.5;
        vec2 cell = floor(sp), q = fract(sp) - 0.5;
        float hs = h21(cell);
        vec2 o = (vec2(h21(cell + 3.1), h21(cell + 7.7)) - 0.5) * 0.6;
        vec2 a = abs(q - o); float ws = max(fwidth(sp.x) + fwidth(sp.y), 1e-4) * 0.6;
        float arm = 0.07 + 0.05 * h21(cell + 1.3);
        float plus = (1.0 - smoothstep(ws * 0.6, ws * 1.5, min(a.x, a.y))) * (1.0 - smoothstep(arm, arm + ws, max(a.x, a.y)));
        float tw = 0.45 + 0.55 * step(0.45, h21(cell + floor(uBeat * 4.0) * 0.37));
        col += vec3(0.75, 0.95, 1.0) * plus * step(1.0 - uStars, hs) * tw * smoothstep(16.0, 26.0, e) * 1.25;
        // three cloud bars: pairs of parallel lines sliding slowly right
        for (int i = 0; i < 3; i++) {
          vec4 c = uCloud[i];
          float da = az - (c.x + uTime * 0.006 * c.w);
          da = mod(da + 3.14159, 6.28318) - 3.14159;
          float m = 1.0 - smoothstep(c.z * 0.85, c.z, abs(da));
          float de = abs(abs(el - c.y) - 0.0065);
          float we = max(w * 0.0233, 1e-5);
          col += uMag * (1.0 - smoothstep(we * 0.5, we * 1.6, de)) * m * 0.8;
        }
        col = mix(uBelow, col, smoothstep(-w, w, e));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(5200, 48, 24), mat);
  mesh.renderOrder = -1; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- road strip and cliff (dark fills with drawn lines)
function buildRoad(U, lay, song, rain) {
  const P = [], R = [], I = [];
  const step = 4, n = Math.round((D0 + BACK) / step);
  for (let i = 0; i <= n; i++) {
    const d = -BACK + i * step, c = lay.at(d), hw = lerp(4.5, 3.5, smoothstep(D0 - LAUNCH, D0 - 20, d));
    const rx = Math.cos(c.psi), rz = Math.sin(c.psi);       // right of travel
    P.push(c.x - rx * hw, ROAD_Y, c.z - rz * hw, c.x + rx * hw, ROAD_Y, c.z + rz * hw);
    R.push(-hw, d, hw, hw, d, hw);
    if (i < n) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('aR', new THREE.BufferAttribute(new Float32Array(R), 3));
  g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide, defines: { SONG: song, RAIN: rain ? 1 : 0 },
    vertexShader: /* glsl */`
      attribute vec3 aR; varying vec3 vR; varying vec3 vP; varying float vD;
      ${GLSL_FOG_PARS_V}
      void main() {
        vR = aR; vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vD = -mv.z; gl_Position = projectionMatrix * mv;
        #ifdef USE_FOG
          vFogDepth = -mv.z;
        #endif
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vR; varying vec3 vP; varying float vD;
      uniform vec3 uFill, uHaze; uniform float uBeat, uBeatLen;
      ${GLSL_INK} ${GLSL_WET} ${GLSL_FOG_PARS_F}
      float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      void main() {
        float x = vR.x, s = vR.y, hw = vR.z;
        float wx = fwidth(x), ws = fwidth(s);
        float dim = mix(1.0, 0.36, clamp(vD / 1500.0, 0.0, 1.0));
        vec3 col = mix(uFill, uHaze * 0.16, clamp(vD / 2200.0, 0.0, 1.0));
        vec3 cA = ink(0.0, vP.z);
        float kerb = lineP(abs(abs(x) - hw + 0.25), wx, 0.14);
        float lane = lineP(abs(abs(x) - hw + 0.7), wx, 0.05) * 0.35;
        col += hot(cA, kerb) * dim + cA * lane * dim;
        // surface joints on the sixteenths and dotted lane guides, so the tarmac streaks when we lean over it
        float jp = uBeatLen * 0.25;
        float joint = lineP(abs(fract(s / jp + 0.5) - 0.5) * jp, ws, 0.06) * 0.4 * step(abs(x), hw - 0.3);
        float guide = lineP(abs(abs(x) - 2.3), wx, 0.045) * 0.55 * step(fract(s / (jp * 0.5)), 0.5);
        guide += lineP(abs(abs(x) - 1.2), wx, 0.04) * 0.4 * step(0.5, fract(s / (jp * 0.5)));
        col += cA * (joint + guide) * dim * (1.0 - smoothstep(200.0, 600.0, vD));
        // centre dashes laid one per beat (in pairs for the half-time song, four short for the broken beat)
        float ds = fract(s / uBeatLen);
        #if SONG == 1
          float dmask = step(ds, 0.1) + step(0.16, ds) * step(ds, 0.26);
        #elif SONG == 2
          float d4 = fract(ds * 4.0); float dmask = step(d4, 0.42) * smoothstep(0.0, 0.02, d4);
        #else
          float dmask = step(ds, 0.3);
        #endif
        float dash = lineP(abs(x), wx, 0.12) * dmask;
        col += mix(cA, vec3(1.0), 0.3) * dash * 1.2 * dim;
        // the dash's faint sheen on the tarmac either side of it
        col += cA * 0.12 * dmask * (1.0 - smoothstep(0.1, 0.8, abs(x))) * dim * (1.0 - smoothstep(120.0, 400.0, vD));
        // launch straight: chevrons on the surface chasing forward under the wheel
        float L0 = ${(D0 - LAUNCH).toFixed(1)};
        float cb = floor(s / (uBeatLen * 0.5)), cs = s - cb * uBeatLen * 0.5;
        float chev = lineP(abs(cs - 8.0 + abs(x) * 1.1) * 0.67, max(ws, wx), 0.16) * step(abs(x), hw - 0.9) * step(0.5, abs(x)) * smoothstep(L0 - 30.0, L0 + 40.0, s);
        col += cA * chev * (0.3 + 1.5 * exp(-5.0 * fract(uBeat * 0.5 - cb / 8.0))) * dim;
        // oncoming traffic on the far lane: pairs of headlight dashes
        float gap = uBeatLen * 3.0;
        float q = (s + uBeat * uBeatLen * 0.75) / gap;
        float cell = floor(q), f = fract(q) * gap;
        float on = step(0.15, hash1(cell));
        float lx = -2.35 + (hash1(cell + 7.0) - 0.5) * 0.5;
        float hd = lineP(abs(abs(x - lx) - 0.62), wx, 0.13) * (1.0 - smoothstep(4.5, 6.0, f)) * smoothstep(0.0, 0.4, f) * on;
        float fan = (1.0 - smoothstep(0.0, 1.9, abs(x - lx))) * smoothstep(34.0, 6.0, f) * step(6.0, f) * on * 0.16;
        col += hot(cA, hd) * 1.25 * dim + cA * fan * dim;
        // the road is wet: the light of the hoops, the palms and the cliff lies on it as broken strokes that shimmer
        // on the beat, and the headlamp's amber under the fan
        vec3 cB = ink(1.0, vP.z);
        float wmask = step(abs(x), hw - 0.35), wfade = 1.0 - smoothstep(40.0, 260.0, vD);
        col += (cB * 0.5 * wetStreak(x, s, wx, ws, uBeat, 0.5, 4.0, 3.0) + cA * 0.32 * wetStreak(x + 0.3, s + 2.0, wx, ws, uBeat, 1.1, 7.0, 11.0)) * wfade * dim * wmask;
        col += uAmber * 0.42 * wetLamp(x, s, wx, ws, vD) * wmask;
        #if RAIN == 1
          // rain doubled on the road as short broken dashes, stepping on the sixteenths
          vec2 rc = vec2(floor(x / 0.45), floor(s / 3.2));
          float rh = hash1(rc.x * 13.7 + rc.y * 3.1 + floor(uBeat * 4.0) * 0.61);
          float rd = lineP(abs(fract(x / 0.45) - 0.5) * 0.45, wx, 0.035) * step(fract(s / 3.2), 0.4) * step(0.9, rh);
          col += cA * rd * 0.7 * dim * (1.0 - smoothstep(60.0, 220.0, vD));
        #endif
        ${GLSL_FOG_MIX}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// the cliff: a profile swept along the road (sea 61 m below on the left, 120 m of rock on the right),
// drawn as stacked contour lines
function makeCliff(lay, noise) {
  const Lp = [[-52, -66], [-40, -61.4], [-34, -50], [-28, -32], [-20, -15], [-14.5, -4], [-11.6, -0.12], [-4.3, -0.12]];
  const Rp = [[4.3, 0], [5.6, 0], [7.2, 0.07], [10, 0.17], [15, 0.3], [23, 0.47], [34, 0.64], [50, 0.8], [70, 0.92], [95, 1.0], [112, 0.96]];
  const NP = Lp.length + Rp.length;
  const H = (d) => lerp(lerp(120, 14, smoothstep(660, 1000, d)), 2.5, smoothstep(1030, 1170, d)) * (0.9 + 0.1 * Math.sin(d * 0.013));
  // lateral offset (m, right positive) and height above the road of profile point j at distance d
  function point(d, j, out) {
    const k = smoothstep(D0 - 64, D0 - 24, d);
    let lat, h;
    if (j < Lp.length) {
      lat = Lp[j][0]; h = Lp[j][1];
      const w = clamp((-lat - 11.6) / 30, 0, 1);
      lat -= w * 7 * noise.fbm2(d * 0.011, j * 1.9 + 3, 3);
      if (j < Lp.length - 2) { lat = lerp(lat, -4.6 - (Lp.length - 2 - j) * 0.5, k); h = lerp(h, -66, k * (j < 5 ? 1 : 0.6)); }
    } else {
      const q = Rp[j - Lp.length], hh = H(d), sc = lerp(0.42, 1, clamp(hh / 120, 0, 1));
      lat = 5.6 + (q[0] - 5.6) * (q[0] > 5.6 ? sc : 1); h = q[1] * hh - 0.12;
      const w = clamp((q[0] - 5.6) / 40, 0, 1);
      lat += w * 9 * noise.fbm2(d * 0.012 + 40, j * 1.7, 3) + w * 2.5 * Math.sin(d * 0.045 + j);
      h += w * 0.1 * hh * noise.fbm2(d * 0.02 + 9, j * 0.9, 2);
      if (q[0] > 4.4) { lat = lerp(lat, 4.6 + (j - Lp.length) * 0.4, k); h = lerp(h, -66, k); }
    }
    const c = lay.at(d), rx = Math.cos(c.psi), rz = Math.sin(c.psi);
    return out.set(c.x + rx * lat, ROAD_Y + h, c.z + rz * lat);
  }
  return { point, NP, nL: Lp.length, H };
}

function buildCliff(U, cliff) {
  const P = [], Dd = [], I = [], v = V3(0, 0, 0);
  const d0 = TUNNEL - 2, d1 = D0 - 22, step = 5, n = Math.round((d1 - d0) / step), NP = cliff.NP;
  for (let i = 0; i <= n; i++) {
    const d = d0 + (i / n) * (d1 - d0);
    for (let j = 0; j < NP; j++) { cliff.point(d, j, v); P.push(v.x, v.y, v.z); Dd.push(d, j); }
    if (i < n) for (let j = 0; j < NP - 1; j++) { const a = i * NP + j; I.push(a, a + 1, a + NP, a + 1, a + NP + 1, a + NP); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(Dd), 2));
  g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aD; varying float vS, vJ;
      varying vec3 vP; varying float vD;
      ${GLSL_FOG_PARS_V}
      void main() {
        vP = position; vS = aD.x; vJ = aD.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vD = length(mv.xyz); gl_Position = projectionMatrix * mv;
        #ifdef USE_FOG
          vFogDepth = -mv.z;
        #endif
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying float vD; varying float vS, vJ;
      uniform vec3 uFill, uHaze; uniform float uBeat, uBeatLen;
      ${GLSL_INK} ${GLSL_FOG_PARS_F}
      float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      void main() {
        float y = vP.y, wy = fwidth(y), wsd = fwidth(vS);
        float far = clamp(vD / 1500.0, 0.0, 1.0), dim = mix(1.0, 0.4, far);
        float c1 = lineP(abs(fract(y / 2.0 + 0.5) - 0.5) * 2.0, wy, 0.07) * (1.0 - smoothstep(0.6, 1.6, wy));
        // strata ticks: short vertical strokes every 10 m of road, broken by height, on the rock close to us
        float nearK = 1.0 - smoothstep(90.0, 150.0, vD);
        float tk = floor(vS / 5.0 + 0.5);
        float tick = lineP(abs(vS - tk * 5.0), wsd, 0.08) * step(fract(y / 6.0 + hash1(tk)), 0.45) * 0.6 * nearK;
        // close rock: metre contours between the 2 m ones
        float c05 = lineP(abs(fract(y + 0.5) - 0.5), wy, 0.05) * (1.0 - smoothstep(0.25, 0.7, wy)) * (1.0 - smoothstep(30.0, 60.0, vD));
        // a band of light that leaves the rider on every beat and runs down the wall ahead along the 10 m strata
        float strata = exp(-6.0 * fract(uBeat * 1.25 - vS / (uBeatLen * 4.0))) * (1.0 - smoothstep(150.0, 420.0, vD));
        float c5 = lineP(abs(fract(y / 10.0 + 0.5) - 0.5) * 10.0, wy, 0.14) * (1.0 - 0.6 * smoothstep(1.5, 4.0, wy));
        // a slow pulse of brightness climbing the contours once a bar
        float climb = 0.75 + 0.5 * exp(-4.0 * fract(uBeat * 0.25 - y / 240.0));
        vec3 c = ink(1.0, vP.z);
        vec3 col = mix(uFill, uHaze * 0.16, smoothstep(0.1, 1.3, far));
        // the seaward verge (profile points 6..7, 7.3 m wide) is flat, so contours leave it bare: dotted lines along it
        // that streak past, and a firm line on its lip where the rock drops to the sea
        float vj = vJ - 6.0, wj = fwidth(vJ) * 7.3, hd = fract(vS / 5.2);
        float verge = (lineP(abs(vj - 0.22) * 7.3, wj, 0.045) * step(hd, 0.5) + lineP(abs(vj - 0.5) * 7.3, wj, 0.045) * step(0.5, hd) + lineP(abs(vj - 0.76) * 7.3, wj, 0.045) * step(hd, 0.5))
          * 0.5 * step(0.0, vj) * step(vj, 1.0) * (1.0 - smoothstep(120.0, 320.0, vD));
        float lip = lineP(abs(vj) * 6.0, wj, 0.1) * 0.75 * step(vJ, 6.5) * step(5.0, vJ);
        tick += verge + lip;
        col += (c * (c1 * mix(0.45, 0.8, nearK) + c05 * 0.4 + tick + c5 * strata * 0.9) * climb + hot(c, c5) * 0.7 * mix(0.8, 1.2, climb - 0.75)) * dim;
        ${GLSL_FOG_MIX}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- static line work
function addTunnel(L, lay, root, U) {
  // the bore: a dark tube that hides the world until the mouth
  const P = [], AD = [], I = [], NA = 28, ds = [-BACK, -70, 0, 60, 120, TUNNEL], CY = ROAD_Y + 4, RT = 15;
  ds.forEach((d, i) => {
    const c = lay.at(d), rx = Math.cos(c.psi), rz = Math.sin(c.psi);
    for (let a = 0; a <= NA; a++) {
      const an = (a / NA) * Math.PI * 2, co = Math.cos(an) * RT, si = Math.sin(an) * RT;
      P.push(c.x + rx * co, CY + si, c.z + rz * co); AD.push(an, d);
      if (i < ds.length - 1 && a < NA) { const k = i * (NA + 1) + a; I.push(k, k + 1, k + NA + 1, k + 1, k + NA + 2, k + NA + 1); }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setIndex(I);
  g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(AD), 2));
  // the wall is the dark fill plus faint dashes between the stringers that stream toward us with the beat, so the bore
  // is never still even when the bike is
  const tube = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec2 aD; varying vec2 vA; varying vec3 vP;
      void main() { vA = aD; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      varying vec2 vA; varying vec3 vP;
      uniform vec3 uFill; uniform float uBeat, uBeatLen;
      ${GLSL_INK} ${GLSL_WET}
      void main() {
        float wa = fwidth(vA.x) * 15.0, wd = fwidth(vA.y);
        float q = vA.x / 0.14, st = wetH(floor(q) + 2.0);
        float dl = abs(fract(q) - 0.5) * 0.14 * 15.0;
        float sg = fract(vA.y / (uBeatLen * 0.5) + uBeat + st * 5.0);
        float on = mix(smoothstep(0.0, 0.04, sg) * (1.0 - smoothstep(0.3, 0.42, sg)), 0.36, smoothstep(1.0, 4.0, wd));
        float l = lineP(dl, wa, 0.06) * on * step(0.55, st) * step(-0.26, sin(vA.x)) * (1.0 - smoothstep(0.5, 1.2, wa));
        vec3 col = uFill * 0.7 + mix(ink(1.0, vP.z), ink(0.0, vP.z), step(0.72, st)) * l * (0.22 + 0.3 * exp(-6.0 * fract(uBeat * 1.25 - vA.y / (uBeatLen * 4.0))));
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  tube.frustumCulled = false; root.add(tube);
  // hoops: one per beat (they flare as we pass on the beat), thin ones on the quarters, two wall stringers
  const ring = (d, r, a0, a1, N, width, slot, phase, gain) => {
    const c = lay.at(d), rx = Math.cos(c.psi), rz = Math.sin(c.psi);
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const an = lerp(a0, a1, i / N), p = V3(c.x + rx * Math.cos(an) * r, CY + Math.sin(an) * r, c.z + rz * Math.cos(an) * r);
      if (prev) L.add(prev, p, width, slot, phase, gain);
      prev = p;
    }
  };
  const A0 = -0.27, A1 = Math.PI + 0.27;
  for (let k = -3; k * BEAT_LEN < TUNNEL - 5; k++) {
    const d = k * BEAT_LEN, ph = (((k % 4) + 4) % 4) / 4;
    // phase 2..3 is the beat pulse: it leaves the rider on every beat and runs up the bore ahead of us
    const chase = (dd) => 2 + (((dd / BEAT_LEN / 4) % 1) + 1) % 1;
    ring(d, 14.5, A0, A1, 22, 0.5, 0, chase(d), 1.0);
    ring(d + 0.9, 14.1, A0, A1, 22, 0.25, 0, chase(d), 0.45);
    for (let q = 1; q < 4; q++) ring(d + q * BEAT_LEN / 4, 14.6, A0, A1, 16, 0.2, 1, chase(d + q * BEAT_LEN / 4), 0.9);
  }
  ring(TUNNEL - 0.3, 14.7, A0, A1, 26, 0.6, 1, -1, 1.1);
  // six wall stringers, dashed, none over the rider's head; the beat pulse chases along their dashes
  const dl = BEAT_LEN / 4;
  [0.3, 0.72, 1.14, Math.PI - 1.14, Math.PI - 0.72, Math.PI - 0.3].forEach((an, j) => {
    for (let d = -BACK + (j % 2) * dl * 0.5; d < TUNNEL; d += dl) {
      const a = lay.at(d), b = lay.at(Math.min(TUNNEL, d + dl * 0.62)), co = Math.cos(an) * 14.6, si = CY + Math.sin(an) * 14.6;
      L.add(V3(a.x + Math.cos(a.psi) * co, si, a.z + Math.sin(a.psi) * co), V3(b.x + Math.cos(b.psi) * co, si, b.z + Math.sin(b.psi) * co), 0.24, 1, 2 + (((d / BEAT_LEN / 4) % 1) + 1) % 1, 0.5);
    }
  });
}

function addRail(L, lay) {
  let prev = null;
  for (let d = TUNNEL + 6; d < D0 - 4; d += 10) {
    const c = lay.at(d), k = smoothstep(D0 - LAUNCH, D0 - 20, d), lat = -lerp(5.3, 3.65, k);
    const x = c.x + Math.cos(c.psi) * lat, z = c.z + Math.sin(c.psi) * lat;
    const b = V3(x, ROAD_Y, z), t = V3(x, ROAD_Y + 0.95, z), m = V3(x, ROAD_Y + 0.5, z);
    L.add(b, t, 0.2, 0, -1, 0.75);
    if (prev) { L.add(prev.t, t, 0.22, 0, -1, 0.65); L.add(prev.m, m, 0.14, 0, -1, 0.3); }
    prev = { t, m };
    // right-hand kerb reflector posts every other one
    // cat's-eye studs at the foot of the wall every 5 m: the beat pulse runs along them
    if (d < D0 - LAUNCH - 10) for (const dd of [d, d + 5]) {
      const a = lay.at(dd), b = lay.at(dd + 0.7);
      L.add(V3(a.x + Math.cos(a.psi) * 4.85, ROAD_Y + 0.1, a.z + Math.sin(a.psi) * 4.85), V3(b.x + Math.cos(b.psi) * 4.85, ROAD_Y + 0.1, b.z + Math.sin(b.psi) * 4.85), 0.16, 0, 2 + (((dd / BEAT_LEN / 4) % 1) + 1) % 1, 0.8);
    }
    if (Math.round(d / 10) % 2 === 0 && d < D0 - 70) {
      const xr = c.x + Math.cos(c.psi) * 5.1, zr = c.z + Math.sin(c.psi) * 5.1;
      L.add(V3(xr, ROAD_Y, zr), V3(xr, ROAD_Y + 0.7, zr), 0.2, 1, -1, 0.6);
    }
  }
}

function addGantries(L) {
  for (let k = 0; k < 12; k++) {
    const z = -BLVD + k * BEAT_LEN + (k === 0 ? 0.6 : 0), ph = (11 - k) / 12;
    for (let n = 0; n < 5; n++) {
      const w = 17.3 - n * 1.4, sh = DECK_Y + 14 - n * 1.7, ap = DECK_Y + 25 - n * 2.2, g = 1 - n * 0.13;
      const p = [V3(-w, DECK_Y, z), V3(-w, sh, z), V3(0, ap, z), V3(w, sh, z), V3(w, DECK_Y, z)];
      for (let i = 0; i < 4; i++) L.add(p[i], p[i + 1], n === 0 ? 0.42 : 0.26, 1, ph, g * 0.55);
    }
    for (const sg of [1, -1]) L.add(V3(sg * 17.3, DECK_Y + 14, z), V3(sg * 11.7, DECK_Y + 7.2, z), 0.2, 1, ph, 0.3);
  }
  // the portal's seat: a sixth, innermost chevron on the last gantry, a cyan and a magenta ring round the opening
  // (the arcs above the deck), and two kerb lines converging on it over the last 120 m
  const z0 = -BLVD + 0.6, w6 = 8.6, pc = DECK_Y + EYE;
  const p6 = [V3(-w6, DECK_Y, z0), V3(-w6, DECK_Y + 6.3, z0), V3(0, DECK_Y + 10.5, z0), V3(w6, DECK_Y + 6.3, z0), V3(w6, DECK_Y, z0)];
  for (let i = 0; i < 4; i++) L.add(p6[i], p6[i + 1], 0.3, 0, 11 / 12, 1.2);
  for (const [r, slot, gn] of [[7.8, 0, 1.2], [8.6, 1, 1.0]]) {
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2;
      if (Math.sin((a0 + a1) / 2) * r < -EYE + 0.2) continue;
      L.add(V3(Math.cos(a0) * r, Math.max(DECK_Y, pc + Math.sin(a0) * r), z0 - 0.3), V3(Math.cos(a1) * r, Math.max(DECK_Y, pc + Math.sin(a1) * r), z0 - 0.3), 0.24, slot, 11 / 12, gn);
    }
  }
  for (const sg of [1, -1]) for (let i = 0; i < 8; i++) {
    const t0 = i / 8, t1 = (i + 1) / 8, xa = sg * lerp(13.2, 7.4, t0), xb = sg * lerp(13.2, 7.4, t1);
    L.add(V3(xa, DECK_Y + 0.06, -BLVD + 120 * (1 - t0)), V3(xb, DECK_Y + 0.06, -BLVD + 120 * (1 - t1)), 0.45, 0, 2 + (((-(120 * (1 - t0)) / BEAT_LEN / 4) % 1) + 1) % 1, 1.6);
  }
}

function addLighthouse(L, base) {
  const rings = [[0, 4.2], [12, 3.3], [24, 2.6], [26, 3.6], [30.5, 1.7]], N = 8;
  const pt = (h, r, i) => V3(base.x + Math.cos((i / N) * Math.PI * 2) * r, base.y + h, base.z + Math.sin((i / N) * Math.PI * 2) * r);
  rings.forEach(([h, r], k) => { for (let i = 0; i < N; i++) L.add(pt(h, r, i), pt(h, r, i + 1), 0.3, 0, -1, k === 3 ? 0.9 : 0.6); });
  for (let i = 0; i < N; i++) {
    L.add(pt(0, 4.2, i), pt(12, 3.3, i), 0.26, 0, -1, 0.55); L.add(pt(12, 3.3, i), pt(24, 2.6, i), 0.26, 0, -1, 0.55);
    L.add(pt(12, 3.3, i), pt(24, 2.6, i + 1), 0.16, 0, -1, 0.25);
    L.add(pt(26, 1.7, i), pt(30.5, 1.7, i), 0.2, 0, -1, 0.7); L.add(pt(30.5, 1.7, i), V3(base.x, base.y + 34, base.z), 0.2, 0, -1, 0.6);
    L.add(pt(24, 2.6, i), pt(26, 3.6, i), 0.2, 0, -1, 0.5);
  }
  return V3(base.x, base.y + 28.2, base.z);
}

function addAgave(L, p, tan, size, slot) {
  // an eight-pointed line star standing in the plane of the road's direction
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI, c = Math.cos(a) * size, s = Math.sin(a) * size * (i === 2 ? 1.25 : 1);
    L.add(V3(p.x - tan.x * c, p.y - s * 0.55 + size * 0.5, p.z - tan.z * c), V3(p.x + tan.x * c, p.y + s + size * 0.5, p.z + tan.z * c), 0.14, slot, -1, 0.55);
  }
}

// a wire palm: a trunk that is one curved line and nine fronds that are arcs
function addPalm(L, Q, base, h, lean, row, rng, slotT, slotF) {
  const q = () => Q.push(base.x, base.y, base.z, row);
  let prev = base.clone();
  const crown = V3(0, 0, 0);
  for (let i = 1; i <= 4; i++) {
    const t = i / 4, p = V3(base.x + lean.x * t * t, base.y + h * t, base.z + lean.z * t * t);
    L.add(prev, p, 0.2, slotT, -1, 0.8); q(); prev = p; if (i === 4) crown.copy(p);
  }
  const a0 = rng.range(0, 6.28);
  for (let j = 0; j < 9; j++) {
    const a = a0 + (j / 9) * Math.PI * 2 + rng.range(-0.2, 0.2), cx = Math.cos(a), cz = Math.sin(a), len = rng.range(3.4, 4.6), lift = rng.range(0.5, 1.4);
    let pp = crown.clone();
    for (const [r, y] of [[0.36, 0.55], [0.72, 0.42], [1.0, -0.28]]) {
      const p = V3(crown.x + cx * len * r, crown.y + lift * y * 1.6 - (r > 0.9 ? 0.9 : 0), crown.z + cz * len * r);
      L.add(pp, p, 0.16, slotF, -1, 0.85); q(); pp = p;
    }
  }
}
const PALM_PRE = /* glsl */`
  attribute vec4 aQ; uniform vec3 uEye, uTravel; uniform float uTime, uLife;`;
const PALM_XFORM = /* glsl */`
  {
    vec3 rel = aQ.xyz - uEye; float dd = dot(rel, rel);
    float gust = exp(-dd / 8000.0);
    vec3 wind = uTravel * (3.2 * gust) + vec3(sin(uTime * 1.3 + aQ.w * 0.7), 0.0, cos(uTime * 1.1 + aQ.w * 1.3)) * 0.4;
    float ha = max(A.y - aQ.y, 0.0) / 12.0, hb = max(B.y - aQ.y, 0.0) / 12.0;
    A += wind * ha * ha * 2.2; B += wind * hb * hb * 2.2;
    A.y -= gust * ha * ha * 1.2; B.y -= gust * hb * hb * 1.2;
    // each palm flares for a quarter of a beat on the off-beat, the flare running down the row away from us
    float fl = exp(-9.0 * fract(uBeat - 0.5 - aQ.w * 0.125));
    gMul = (0.5 + 1.3 * fl * uLife) * mix(0.4, 1.0, uLife) * mix(1.0, 0.22, clamp(sqrt(dd) / 700.0, 0.0, 1.0));
  }`;

// ---------------------------------------------------------------- lines rewritten on the CPU every frame
function makeDyn(U, n, opt) {
  const L = makeLines(U, opt), z = V3(0, 0, 0);
  for (let i = 0; i < n; i++) L.add(z, z, 0.2, 0, -1, 0);
  const mesh = L.build(null, true), at = mesh.geometry.attributes;
  const A = at.aA.array, B = at.aB.array, W = at.aW.array;
  let k = 0;
  const D = {
    mesh,
    begin() { k = 0; },
    seg(ax, ay, az, bx, by, bz, width, slot, gain) {
      if (k >= n) return;
      const o = k * 3, w = k * 4;
      A[o] = ax; A[o + 1] = ay; A[o + 2] = az; B[o] = bx; B[o + 1] = by; B[o + 2] = bz;
      W[w] = width; W[w + 1] = slot; W[w + 2] = -1; W[w + 3] = gain; k++;
    },
    // a model segment [ax,ay,az,bx,by,bz,width,slot,gain] (x right, y up, z forward) placed by frame F
    put(F, m, gain = 1) {
      const o = F.o, r = F.r, u = F.u, f = F.f;
      D.seg(o.x + r.x * m[0] + u.x * m[1] + f.x * m[2], o.y + r.y * m[0] + u.y * m[1] + f.y * m[2], o.z + r.z * m[0] + u.z * m[1] + f.z * m[2],
        o.x + r.x * m[3] + u.x * m[4] + f.x * m[5], o.y + r.y * m[3] + u.y * m[4] + f.y * m[5], o.z + r.z * m[3] + u.z * m[4] + f.z * m[5], m[6], m[7], m[8] * gain);
    },
    end() { mesh.geometry.instanceCount = Math.max(1, k); if (k === 0) W[3] = 0; at.aA.needsUpdate = at.aB.needsUpdate = at.aW.needsUpdate = true; },
  };
  return D;
}
const frameF = () => ({ o: V3(0, 0, 0), r: V3(1, 0, 0), u: V3(0, 1, 0), f: V3(0, 0, -1) });

// ---------------------------------------------------------------- vehicle and boat models (segment lists)
function polyline(out, pts, w, slot, gain, close = false) {
  for (let i = 0; i < pts.length - (close ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; out.push([a[0], a[1], a[2], b[0], b[1], b[2], w, slot, gain]); }
}
function modelConvertible() {
  const m = [], W = 0.95, w = 0.09;
  polyline(m, [[-W, 0.3, -2.7], [W, 0.3, -2.7], [W, 0.3, 2.7], [-W, 0.3, 2.7]], w, 1, 0.8, true);
  polyline(m, [[-W, 0.85, -2.7], [W, 0.85, -2.7], [W, 0.85, 2.5], [-W, 0.85, 2.5]], w, 1, 0.9, true);
  for (const sx of [-1, 1]) {
    polyline(m, [[sx * W, 0.85, -0.9], [sx * W, 1.38, -2.75], [sx * W, 0.3, -2.7]], w, 1, 1.0);          // the fin
    polyline(m, [[sx * W, 0.3, 2.7], [sx * W, 0.85, 2.5]], w, 1, 0.7);
    polyline(m, [[sx * 0.82, 0.85, 0.75], [sx * 0.76, 1.32, 0.42]], w, 1, 0.8);
    for (const z of [-1.7, 1.7]) polyline(m, [[sx * W, 0.3, z - 0.42], [sx * W, 0.02, z - 0.2], [sx * W, 0.02, z + 0.2], [sx * W, 0.3, z + 0.42]], w, 1, 0.5);
    m.push([sx * 0.52, 0.7, -2.74, sx * 0.86, 0.7, -2.74, 0.16, 2, 1.7]);                              // tail-lights
  }
  polyline(m, [[-0.76, 1.32, 0.42], [0.76, 1.32, 0.42]], w, 1, 0.8);
  polyline(m, [[-0.55, 1.2, -0.25], [-0.4, 1.42, -0.2], [-0.25, 1.2, -0.25]], w, 1, 0.8, true);       // the driver
  return { segs: m, scarf: [-0.4, 1.3, -0.3], lat: 2.7, tail: 0.86 };
}
function modelCoach() {
  const m = [], W = 1.25, w = 0.1, Z = 5.6;
  for (const y of [0.4, 3.3]) polyline(m, [[-W, y, -Z], [W, y, -Z], [W, y, Z], [-W, y, Z]], w, 1, 0.9, true);
  for (const sx of [-1, 1]) {
    for (const z of [-Z, Z]) polyline(m, [[sx * W, 0.4, z], [sx * W, 3.3, z]], w, 1, 0.9);
    for (const y of [1.6, 2.7]) polyline(m, [[sx * W, y, -Z], [sx * W, y, Z]], w, 0, 0.55);
    for (let z = -Z + 1.4; z < Z - 0.5; z += 1.4) polyline(m, [[sx * W, 1.6, z], [sx * W, 2.7, z]], w, 0, 0.4);
    m.push([sx * 0.7, 0.85, -Z - 0.03, sx * 1.12, 0.85, -Z - 0.03, 0.18, 2, 1.7]);
    m.push([sx * 0.95, 3.1, -Z - 0.03, sx * 1.12, 3.1, -Z - 0.03, 0.14, 2, 1.2]);
  }
  polyline(m, [[-0.95, 1.7, -Z], [0.95, 1.7, -Z], [0.95, 2.8, -Z], [-0.95, 2.8, -Z]], w, 0, 0.6, true);
  return { segs: m, scarf: null, lat: 2.85, tail: 1.12 };
}
function modelRival() {
  const m = [], w = 0.07;
  for (const zc of [-0.72, 0.75]) { const p = []; for (let i = 0; i < 8; i++) p.push([0, 0.34 + Math.sin(i * Math.PI / 4) * 0.34, zc + Math.cos(i * Math.PI / 4) * 0.34]); polyline(m, p, w, 1, 0.8, true); }
  polyline(m, [[0, 0.34, -0.72], [0, 0.8, -0.5], [0, 0.82, 0.3], [0, 0.34, 0.75]], w, 1, 0.8);
  polyline(m, [[0, 0.8, -0.5], [0, 1.02, -0.95]], w, 1, 0.8);
  polyline(m, [[0, 0.9, -0.3], [0, 1.36, 0.08], [0, 1.52, 0.28]], w, 0, 1.0);                           // the rider's back
  polyline(m, [[-0.24, 1.3, 0.05], [0.24, 1.3, 0.05]], w, 0, 0.9);
  for (const sx of [-1, 1]) polyline(m, [[sx * 0.24, 1.3, 0.05], [sx * 0.32, 1.0, 0.55], [0, 0.95, 0.5]], w, 0, 0.8);
  polyline(m, [[-0.1, 1.5, 0.22], [0, 1.66, 0.3], [0.1, 1.5, 0.22], [0, 1.44, 0.34]], w, 0, 0.9, true);
  m.push([-0.14, 0.9, -0.97, 0.14, 0.9, -0.97, 0.16, 2, 1.8]);
  return { segs: m, scarf: [0, 1.5, 0.15], lat: 2.2, tail: 0.14 };
}
function modelYacht() {
  const m = [], w = 0.5;
  polyline(m, [[-9, 1.3, 0], [-7, 0, 0], [6, 0, 0], [9.5, 1.7, 0], [-9, 1.3, 0]], w, 0, 0.9);
  polyline(m, [[0, 1.4, 0], [0, 25, 0]], w, 0, 0.9);
  polyline(m, [[-0.4, 24, 0], [-8.5, 3.2, 0], [-0.4, 3.2, 0]], w, 1, 1.0);
  polyline(m, [[0.5, 21.5, 0], [8.8, 2.4, 0], [0.6, 2.4, 0]], w, 1, 0.8);
  return m;
}
function modelLiner() {
  const m = [], w = 0.9;
  polyline(m, [[-120, 11, 0], [-112, 0, 0], [104, 0, 0], [124, 12, 0], [-120, 11, 0]], w, 0, 1.0);
  polyline(m, [[-84, 11, 0], [-84, 19, 0], [72, 19, 0], [78, 11.6, 0]], w, 0, 0.8);
  polyline(m, [[-62, 19, 0], [-62, 26, 0], [50, 26, 0], [54, 19, 0]], w, 0, 0.7);
  for (const x of [-40, -8, 24]) polyline(m, [[x - 6, 26, 0], [x - 9, 41, 0], [x + 1, 41, 0], [x + 4, 26, 0]], w, 1, 1.0);
  polyline(m, [[96, 12, 0], [96, 30, 0]], w, 0, 0.6); polyline(m, [[-104, 11, 0], [-104, 24, 0]], w, 0, 0.6);
  for (let x = -104; x < 100; x += 9) m.push([x, 5.5, 0, x + 4, 5.5, 0, 0.8, 1, 0.9]);
  for (let x = -78; x < 68; x += 9) m.push([x, 15, 0, x + 4, 15, 0, 0.7, 1, 0.7]);
  for (let x = -56; x < 46; x += 9) m.push([x, 22.5, 0, x + 4, 22.5, 0, 0.7, 1, 0.6]);
  return m;
}

// ---------------------------------------------------------------- the bike: wire handlebars in camera space
// The whole bike rides DROP lower than its model so it owns only the bottom quarter of the frame (fov 78):
// mirror tops and windscreen apex near 73% down, the gauge near 84%, the bar near 93%.
const BIKE_DROP = -0.23, MIR_X = 0.52, MIR_Y = -0.17;
function buildBike(U, pal) {
  const cyan = new THREE.Color(pal[4]), mag = new THREE.Color(pal[3]), fill = new THREE.Color(pal[0]);
  // its inks never change key: the bars are the fixed reference in frame
  const Ub = Object.assign({}, U, {
    uInkA: { value: cyan.clone() }, uInkB: { value: mag.clone() }, uInkA2: { value: cyan.clone() }, uInkB2: { value: mag.clone() },
    uWipeZ: { value: 1e9 }, uSplit: { value: 0 },
  });
  // ...except the gauge lamps, the mirror rims and the road in the mirrors, which take the current key's near ink
  const keyInk = cyan.clone(), Uk = Object.assign({}, Ub, { uInkA: { value: keyInk }, uInkA2: { value: keyInk } });
  const rims = [];
  const group = new THREE.Group(); group.matrixAutoUpdate = false; group.frustumCulled = false;
  const L = makeLines(Ub, { depthTest: false, renderOrder: 22 });
  const seg = (a, b, slot = 0, gain = 0.9, width = 0.011) => L.add(V3(a[0], a[1], a[2]), V3(b[0], b[1], b[2]), width, slot, -1, gain * 0.78);
  const line = (pts, slot, gain, width, close = false) => { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) seg(pts[i], pts[(i + 1) % pts.length], slot, gain, width); };
  const FP = [], FI = [];
  const fan = (pts) => { const n = FP.length / 3; for (const p of pts) FP.push(p[0], p[1], p[2]); for (let i = 1; i < pts.length - 1; i++) FI.push(n, n + i, n + i + 1); };
  // handlebar and grips
  const bar = [[-0.34, -0.315, -0.72], [-0.30, -0.315, -0.74], [-0.14, -0.325, -0.80], [0, -0.335, -0.81], [0.14, -0.325, -0.80], [0.30, -0.315, -0.74], [0.34, -0.315, -0.72]];
  line(bar, 0, 1.0, 0.014);
  line(bar.map((p) => [p[0], p[1] - 0.014, p[2]]), 0, 0.5, 0.008);
  for (const sx of [-1, 1]) {
    for (const dy of [0.016, -0.016]) seg([sx * 0.34, -0.315 + dy, -0.72], [sx * 0.475, -0.327 + dy, -0.655], 0, 0.9, 0.01);
    seg([sx * 0.475, -0.305, -0.655], [sx * 0.475, -0.349, -0.655], 0, 0.9);
    // the gauntlet: fist, knuckles, flared cuff running out of the bottom corner
    const cx = sx * 0.405, cy = -0.318, cz = -0.685, fist = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; fist.push([cx + Math.cos(a) * 0.072, cy + Math.sin(a) * 0.05 + 0.006, cz + sx * Math.cos(a) * 0.03]); }
    fan(fist); line(fist, 1, 0.95, 0.012, true);
    if (sx < 0) for (let k = -1; k <= 1; k++) seg([cx + k * 0.034, cy + 0.05, cz], [cx + k * 0.036, cy + 0.014, cz - 0.004], 1, 0.6, 0.008);
    const cuff = [[cx - 0.062, cy - 0.03, cz + 0.02], [cx + 0.062, cy - 0.03, cz + 0.02], [sx * 0.50 + 0.1, -0.5, -0.5], [sx * 0.50 - 0.1, -0.5, -0.5]];
    fan(cuff);
    seg(cuff[0], cuff[3], 1, 0.8); seg(cuff[1], cuff[2], 1, 0.8);
    // mirror stalk and mirror frame
    seg([sx * 0.27, -0.317, -0.752], [sx * (MIR_X - 0.09), MIR_Y - 0.03, -0.84], 0, 0.8);
    const mx = sx * MIR_X, my = MIR_Y, mz = -0.84, a = 0.088, b = 0.044;
    const rim = [[mx - a, my - b * 0.6, mz], [mx - a * 0.8, my + b, mz], [mx + a * 0.8, my + b, mz], [mx + a, my - b * 0.6, mz], [mx + a * 0.7, my - b, mz], [mx - a * 0.7, my - b, mz]];
    for (let i = 0; i < 6; i++) rims.push([rim[i], rim[(i + 1) % 6]]);
  }
  // low arc of windscreen
  const ws = [];
  for (let i = 0; i <= 12; i++) { const t = i / 6 - 1, k = 1 - t * t; ws.push([0.33 * t, -0.30 + 0.095 * k, -1.02 - 0.1 * k]); }
  line(ws, 0, 0.75, 0.011);
  seg(ws[0], [-0.2, -0.322, -0.78], 0, 0.5); seg(ws[12], [0.2, -0.322, -0.78], 0, 0.5);
  // speedometer: an arc of twelve ticks
  const SC = [0, -0.30, -0.92], SR = 0.076, dash = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; dash.push([SC[0] + Math.cos(a) * (SR + 0.016), SC[1] + Math.sin(a) * (SR + 0.016), SC[2] + 0.004]); }
  fan(dash);
  const tickA = (i) => Math.PI * (1.18 - (i / 11) * 1.36);
  for (let i = 0; i < 12; i++) { const a = tickA(i), c = Math.cos(a), s = Math.sin(a); seg([SC[0] + c * SR * 0.8, SC[1] + s * SR * 0.8, SC[2]], [SC[0] + c * SR, SC[1] + s * SR, SC[2]], i >= 9 ? 1 : 3, i >= 9 ? 1.0 : 0.7, 0.009); }
  const arc = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.22 - (i / 14) * 1.44); arc.push([SC[0] + Math.cos(a) * (SR + 0.012), SC[1] + Math.sin(a) * (SR + 0.012), SC[2]]); }
  line(arc, 0, 0.6, 0.008);
  // tank top and filler cap, fork clamp
  const tank = [[-0.2, -0.7, -0.5], [-0.135, -0.44, -0.66], [-0.06, -0.365, -0.76], [0.06, -0.365, -0.76], [0.135, -0.44, -0.66], [0.2, -0.7, -0.5]];
  fan(tank); line(tank, 0, 0.85, 0.013);
  const cap = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; cap.push([Math.cos(a) * 0.026, -0.378 + Math.sin(a) * 0.007, -0.74]); }
  line(cap, 1, 0.6, 0.008, true);
  for (const sx of [-1, 1]) seg([sx * 0.05, -0.337, -0.805], [sx * 0.055, -0.365, -0.762], 0, 0.5, 0.009);
  const lines = L.build(); group.add(lines);
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FP), 3)); fg.setIndex(FI);
  const fills = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: fill.clone().multiplyScalar(0.85), side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, opacity: 0.7, fog: false }));
  fills.renderOrder = 20; fills.frustumCulled = false; group.add(fills);
  // mirrors: a tiny shader of a receding road, not a reflection
  const mU = { uBeat: U.uBeat, uA: { value: keyInk }, uB: { value: mag }, uAmber: { value: new THREE.Color(pal[6]) }, uFill: { value: fill }, uCar: { value: new THREE.Vector2(0, 0) } };
  const mg = new THREE.BufferGeometry(), MP = [], MUV = [], MI = [];
  for (const sx of [-1, 1]) {
    const mx = sx * MIR_X, my = MIR_Y, mz = -0.84, a = 0.088, b = 0.044, n = MP.length / 3;
    const pts = [[-a, -b * 0.6], [-a * 0.8, b], [a * 0.8, b], [a, -b * 0.6], [a * 0.7, -b], [-a * 0.7, -b]];
    for (const p of pts) { MP.push(mx + p[0], my + p[1], mz); MUV.push(p[0] / a, p[1] / b, sx); }
    for (let i = 1; i < 5; i++) MI.push(n, n + i, n + i + 1);
  }
  mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MP), 3)); mg.setAttribute('aM', new THREE.BufferAttribute(new Float32Array(MUV), 3)); mg.setIndex(MI);
  const mirrors = new THREE.Mesh(mg, new THREE.ShaderMaterial({
    uniforms: mU, depthTest: false, depthWrite: false, transparent: true, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`attribute vec3 aM; varying vec3 vM; void main() { vM = aM; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      varying vec3 vM; uniform float uBeat; uniform vec3 uA, uB, uAmber, uFill; uniform vec2 uCar;
      void main() {
        vec2 p = vM.xy; float hz = 0.2, w = max(fwidth(p.y), 1e-4);
        vec3 col = uFill * 0.9;
        float below = max(hz - p.y, 0.02), zz = 1.0 / below;
        float road = step(p.y, hz);
        float ex = abs(abs(p.x - vM.z * 0.15) - below * 0.95);
        col += uA * (1.0 - smoothstep(w, w * 2.5, ex)) * road * 0.9;
        float dsh = step(fract(zz * 0.55 - uBeat), 0.4) * (1.0 - smoothstep(w * 0.8, w * 2.2, abs(p.x - vM.z * 0.15))) * road;
        col += mix(uA, vec3(1.0), 0.4) * dsh * (1.0 - smoothstep(4.0, 14.0, zz));
        col += uB * (1.0 - smoothstep(w, w * 2.5, abs(p.y - hz))) * 0.6;
        col += uB * 0.1 * step(hz, p.y) * step(fract(p.y * 3.0), 0.5);
        // what we have just overtaken: two amber dots shrinking in the right-hand mirror
        float cy = hz - 0.9 / max(uCar.x, 0.9), sp = uCar.y / max(uCar.x, 1.0) * 1.1;
        float cx = vM.z * 0.15 - 0.5 * (hz - cy);
        float dot2 = 1.0 - smoothstep(0.03, 0.09, min(length(p - vec2(cx - sp, cy)), length(p - vec2(cx + sp, cy))) / max(0.25, 2.0 / max(uCar.x, 1.0)));
        col += uAmber * 1.6 * dot2 * step(0.0, vM.z) * step(1.0, uCar.x) * (1.0 - smoothstep(120.0, 220.0, uCar.x));
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  mirrors.renderOrder = 21; mirrors.frustumCulled = false; group.add(mirrors);
  // needle, beat lamps and the right gauntlet's knuckles are rewritten every frame
  const dyn = makeDyn(Uk, 32, { depthTest: false, renderOrder: 23 }); group.add(dyn.mesh);
  const shake = new THREE.Matrix4();
  return {
    group, mU,
    update(dt, camera, beat, time, speedK, lampsOn, rise = 1, land = false) {
      // land: the place has jumped (the world's update tells it by the place's own step). The key ink is then put
      // outright at the colour it is heading for on this call, whatever the clock step, so a still, or a visitor set
      // down mid-route, shows the ink a flight shows there; the ease below then has no gap left to close
      if (land) keyInk.copy(U.uInkA2.value);
      // eased by the clock step, not by the call (0.08 of the gap per sixtieth of a second): the same fade at any
      // frame rate, and none at all while the clock stands
      if (dt > 0) keyInk.lerp(U.uInkA2.value, 1 - Math.pow(1 - 0.08, dt * 60));
      const a = tickA(lerp(7.2, 11, speedK) + 0.25 * Math.sin(time * 7.3) * (0.3 + speedK));
      dyn.begin();
      dyn.seg(SC[0] - Math.cos(a) * 0.012, SC[1] - Math.sin(a) * 0.012, SC[2] - 0.002, SC[0] + Math.cos(a) * SR * 0.92, SC[1] + Math.sin(a) * SR * 0.92, SC[2] - 0.002, 0.013, 2, 1.5);
      const lamp = Math.floor(((beat % 4) + 4) % 4), fr = beat - Math.floor(beat);
      for (let i = 0; i < 4; i++) {
        const on = i === lamp ? 0.55 + 1.1 * Math.exp(-3.5 * fr) : 0.22, x = -0.054 + i * 0.036;
        dyn.seg(x - 0.011, -0.354, -0.905, x + 0.011, -0.354, -0.905, 0.014, 0, on * 1.25 * lampsOn);
      }
      for (let i = 0; i < rims.length; i++) { const r = rims[i]; dyn.seg(r[0][0], r[0][1], r[0][2], r[1][0], r[1][1], r[1][2], 0.011, 0, 0.9 * 0.78); }
      // the right wrist rolls on as we accelerate
      const roll = (speedK - 0.5) * 0.03, cx = 0.405, cy = -0.318, cz = -0.685;
      for (let k = -1; k <= 1; k++) dyn.seg(cx + k * 0.034, cy + 0.05 - roll * 0.4, cz, cx + k * 0.036, cy + 0.014 - roll, cz - 0.004, 0.008, 1, 0.6);
      dyn.end();
      // the bars shiver
      shake.makeTranslation(Math.sin(time * 37.0) * 0.0012, Math.sin(time * 53.0 + 1.0) * 0.0016 + Math.sin(time * 2.1) * 0.002 + BIKE_DROP - 0.55 * (1 - rise), 0);
      group.matrix.multiplyMatrices(camera.matrixWorld, shake);
      group.matrixWorldNeedsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'corniche-120',
  name: 'Corniche at 120 BPM',
  category: 'bizarre',
  media: ['open'],
  weirdness: 0.55,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // ---- what this visit is (all draws up front, in a fixed order)
    const hourPick = rng(), songPick = rng(), castPick = rng(), boatPick = rng();
    const keys = rng.shuffle([0, 1, 2]);
    const sunAz = -rng.range(42, 68) * Math.PI / 180, rollDir = rng.sign(), skyHue = rng.range(-0.05, 0.05);
    const h = vary.hour;
    const lookName = h === 'night' ? 'night' : (h === 'dawn' || h === 'day') ? 'dawn' : h === 'golden' ? 'dusk' : (hourPick < 0.5 ? 'dusk' : hourPick < 0.76 ? 'night' : 'dawn');
    const look = LOOKS[lookName];
    const song = songPick < 0.5 ? 0 : songPick < 0.75 ? 1 : 2;
    const cast = castPick < 0.4 ? 'convertible' : castPick < 0.7 ? 'rival' : 'coach';
    const liner = boatPick < 0.3, rare = !!vary.rare;
    const sunEl = 4 * Math.PI / 180;
    const sunDir = V3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunAz) * Math.cos(sunEl));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(look.below);
    scene.fog = new THREE.Fog(new THREE.Color(look.fog), 500, 5400);
    const root = new THREE.Group(); root.name = 'corniche-root'; scene.add(root);

    // ---- the hero: causeway, boulevard deck, city, sea
    const hero = await buildHero(ctx, { palette: look.palette, rollDir, beatLength: BEAT_LEN, seaRadius: 4300, sunDir: sunDir.toArray(), song, inkGain: look.inkGain, cityGain: look.cityGain, beatOffset: D0_BEATS, gantryZ: -BLVD });
    root.add(hero.object);
    const U = hero.uniforms, AN = hero.anchors;
    U.uTime = { value: 0 }; U.uTravel = { value: V3(0, 0, -1) }; U.uLife = { value: 1 }; U.uRainOn = { value: 0 };
    await ctx.yield();

    // ---- the route: corniche centreline, the strand, the boulevard
    const lay = layCorniche(15);
    const pts = lay.pts.map((p) => [p.x, ROAD_Y + EYE, p.z]);
    for (const r of AN.ride) pts.push(r.p);
    for (let z = -20; z > -BLVD + 5; z -= 20) pts.push([14 * (1 - smoothstep(40, 350, -z)), DECK_Y + EYE, z]);
    pts.push([0, DECK_Y + EYE, -BLVD]);
    const path = makePath(pts, { samples: 900 });
    const Ltot = path.length;
    await ctx.yield();

    // ---- sky
    const sky = buildSky(look, sunDir, U, rng.fork('sky'), skyHue);
    root.add(sky);
    await ctx.yield();

    // ---- road, cliff, tunnel
    root.add(buildRoad(U, lay, song, lookName === 'night'));
    await ctx.yield();
    const cliff = makeCliff(lay, ctx.noise);
    await ctx.yield();
    root.add(buildCliff(U, cliff));
    await ctx.yield();
    const SL = makeLines(U);
    addTunnel(SL, lay, root, U);
    addRail(SL, lay);
    addGantries(SL);
    await ctx.yield();
    const tmp = V3(0, 0, 0), tmp2 = V3(0, 0, 0);
    const lampPos = addLighthouse(SL, cliff.point(1112, cliff.nL + 5, V3(0, 0, 0)).clone());
    const ra = rng.fork('agave');
    for (let d = TUNNEL + 12; d < 1010; d += ra.range(2.5, 6.5) / density) {
      const right = ra.chance(0.72), j = right ? cliff.nL + ra.int(2, 5) : ra.int(3, 5), t = ra();
      cliff.point(d, j, tmp); cliff.point(d, j + 1, tmp2); tmp.lerp(tmp2, t);
      const c = lay.at(d);
      addAgave(SL, tmp, { x: c.tx, z: c.tz }, ra.range(0.8, 1.9), 0);
    }
    const slMesh = SL.build();
    root.add(slMesh, makeTrail(U, slMesh));
    await ctx.yield();

    // ---- wire palms: seaward verge of the corniche, both kerbs of the boulevard
    const PL = makeLines(U, { pre: PALM_PRE, xform: PALM_XFORM }), PQ = [], rp = rng.fork('palms');
    let row = 0;
    for (let d = TUNNEL + 16; d < D0 - LAUNCH + 50; d += 12.5 / density) {
      const c = lay.at(d), rx = Math.cos(c.psi), rz = Math.sin(c.psi), lat = -9.7 + rp.range(-0.5, 0.5), ln = rp.range(0.8, 2.6);
      addPalm(PL, PQ, V3(c.x + rx * lat, ROAD_Y - 0.12, c.z + rz * lat), rp.range(9, 14), { x: -rx * ln + c.tx * rp.range(-1, 1), z: -rz * ln + c.tz * rp.range(-1, 1) }, row++, rp, 1, 0);
      if (row % 12 === 0) await ctx.yield();
    }
    row = 0;
    for (let z = -34; z > -BLVD + 14; z -= BEAT_LEN / (2 * density)) {
      for (const sx of [-1, 1]) addPalm(PL, PQ, V3(sx * 15.4, DECK_Y, z + rp.range(-1, 1)), rp.range(9, 13), { x: sx * rp.range(0.4, 1.8), z: rp.range(-1, 1) }, row, rp, 0, 1);
      row++;
      if (row % 8 === 0) await ctx.yield();
    }
    const palmMesh = PL.build({ aQ: { array: new Float32Array(PQ), size: 4 } });
    root.add(palmMesh);
    await ctx.yield();

    // ---- weather by look: vector rain at night, strata of mist lines at dawn
    let mist = null;
    if (lookName === 'night') {
      const RL = makeLines(U, {
        pre: /* glsl */`uniform vec3 uEye; uniform float uRainOn;`,
        xform: /* glsl */`{
          vec3 box = vec3(150.0, 70.0, 220.0);
          float t = floor(uBeat * 4.0) * 0.25 + 0.25 * smoothstep(0.0, 0.7, fract(uBeat * 4.0));
          vec3 p = aA * box; p.y -= t * 46.0; p.x += t * 14.0;
          p = mod(p - uEye + box * 0.5, box) - box * 0.5 + uEye;
          A = p; B = p + vec3(0.42, -1.4, 0.0) * (0.8 + aA.x);
          gMul = uRainOn;
        }`,
      });
      const rr = rng.fork('rain'), nr = Math.round(800 * density * detail);
      for (let i = 0; i < nr; i++) { const p = V3(rr(), rr(), rr()); RL.add(p, p, 0.05, 0, -1, 0.5); }
      root.add(RL.build());
    } else if (lookName === 'dawn') {
      const ML = makeLines(U), rm = rng.fork('mist');
      for (const y0 of [9, 19, 30, 43, 55]) {
        for (let i = 0; i < 13; i++) {
          const x = rm.range(-1100, 1100), z = rm.range(60, 1000), hl = rm.range(140, 520), y = y0 + rm.range(-1.6, 1.6);
          ML.add(V3(x - hl, y, z), V3(x + hl, y, z + rm.range(-20, 20)), 0.45, 3, -1, rm.range(0.1, 0.24));
        }
      }
      mist = ML.build(); root.add(mist);
    }

    await ctx.yield();

    // ---- everything that travels: gulls, boats, the car, the lighthouse beam, the headlamp fan
    const dyn = makeDyn(U, 1500); root.add(dyn.mesh);
    const carModel = cast === 'convertible' ? modelConvertible() : cast === 'coach' ? modelCoach() : modelRival();
    const boatModel = liner ? modelLiner() : modelYacht();
    // tail-light streaks: two fading strokes behind each amber lamp
    const carTrail = [];
    for (const m of carModel.segs) if (m[7] === 2) {
      const cx = (m[0] + m[3]) / 2;
      carTrail.push([cx, m[1], m[2], cx, m[1], m[2] - 3.2, 0.1, 2, 0.4], [cx, m[1], m[2] - 3.2, cx, m[1], m[2] - 6.4, 0.1, 2, 0.2]);
    }
    const M9 = [0, 0, 0, 0, 0, 0, 0.08, 0, 1.1];
    const rb = rng.fork('boats'), boats = [];
    for (let i = 0; i < 12; i++) {
      const left = i < 8;
      boats.push({ x: left ? -rb.range(70, 760) : rb.range(70, 430), z: rb.range(140, 980), v: rb.range(2.5, 6) * rb.sign(), ph: rb.range(0, 6) });
    }
    const rg = rng.fork('gulls'), wheel = [];
    const cA = lay.at(420), flockC = [V3(cA.x - Math.cos(cA.psi) * 150, 52, cA.z - Math.sin(cA.psi) * 150), V3(-190, 44, 560), V3(-120, 50, -330)];
    for (let i = 0; i < 48; i++) wheel.push({ c: flockC[i < 22 ? 0 : i < 36 ? 1 : 2], r: rg.range(25, 95), w: rg.range(0.12, 0.3) * rg.sign(), ph: rg.range(0, 6.28), h: rg.range(-18, 22), span: rg.range(2.2, 3.4) });
    await ctx.yield();

    // ---- the bike and the scanlines ride with the camera
    const bike = buildBike(U, look.palette);
    scene.add(bike.group);
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, transparent: true, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
      vertexShader: /* glsl */`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`void main() { float l = mod(floor(gl_FragCoord.y), 3.0) < 1.0 ? 0.88 : 1.0; gl_FragColor = vec4(vec3(l), 1.0); }`,
    }));
    scan.renderOrder = 30; scan.frustumCulled = false; scene.add(scan);
    await ctx.yield();

    // ---- per-frame state
    const camPos = V3(0, 0, 0), camFwd = V3(0, 0, -1), camUp = V3(0, 1, 0), upT = V3(0, 1, 0), crossV = V3(0, 0, 0);
    const t0 = V3(0, 0, 0), t1 = V3(0, 0, 0), pA = V3(0, 0, 0), pB = V3(0, 0, 0), pC = V3(0, 0, 0), q = new THREE.Quaternion();
    const Y = V3(0, 1, 0), F = frameF(), G = frameF();
    const FR = { p: V3(0, 0, 0), up: V3(0, 1, 0), tangent: V3(0, 0, -1), axis: V3(0, 0, 0), roll: 0 };
    const SPEED = Ltot / 40, PERSIST = 0.09;      // m/s at 1x pace; seconds a moving line's afterimage lasts
    let lastU = -1, idle = 0;
    const B1 = D0_BEATS - 0.5, B2 = D0_BEATS + LEN / BEAT_LEN - 0.6, WIPE = 4;
    const uPass = cast === 'rival' ? 0.275 : 0.25, dPass = uPass * Ltot;
    const speedKeys = [[0, 0.45], [TUNNEL / Ltot, 0.3], [0.18, 0.3], [0.22, 0.5], [0.31, 0.55], [0.375, 1.0], [0.46, 0.8], [0.6, 0.78], [0.7, 0.9], [1, 0.92]];
    const speedAt = (u) => { for (let i = 1; i < speedKeys.length; i++) if (u <= speedKeys[i][0]) { const a = speedKeys[i - 1], b = speedKeys[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], u)); } return 0.9; };
    // the road's own frame at path distance d: eye point, up and right (the strand's on the causeway)
    const roadFrame = (d, o) => {
      path.posAtDist(d, o.o); path.tangentAtDist(d, o.f);
      if (d > D0 - 2 && o.o.z > 0 && o.o.z < LEN) o.u.copy(AN.frameInto(LEN - o.o.z, FR).up); else o.u.set(0, 1, 0);
      o.r.crossVectors(o.f, o.u).normalize();
      return o;
    };
    // one M of four strokes; `ph` is the flap phase. Two fainter Ms a moment earlier in the flap (and `back` metres
    // behind along f, for birds that cross the frame) are the bird's afterimage.
    const gull = (p, f, up, span, ph, gain, back = 0) => {
      crossV.crossVectors(f, up).normalize();
      const r = crossV, e = span * 0.5;
      for (let g = 0; g < 3; g++) {
        const flap = Math.sin(ph - g * 0.85), gg = g === 0 ? gain : gain * (g === 1 ? 0.4 : 0.2), bk = -back * g;
        const ey = span * (0.16 + 0.2 * flap), ty = span * (0.06 + 0.42 * flap);
        const px = p.x + f.x * bk, py = p.y + f.y * bk, pz = p.z + f.z * bk;
        for (let sg = -1; sg <= 1; sg += 2) {
          const ex = px + r.x * e * sg + up.x * ey, eyy = py + r.y * e * sg + up.y * ey, ez = pz + r.z * e * sg + up.z * ey;
          dyn.seg(px, py, pz, ex, eyy, ez, 0.1 * span, 0, gg);
          dyn.seg(ex, eyy, ez, px + r.x * span * sg + up.x * ty, py + r.y * span * sg + up.y * ty, pz + r.z * span * sg + up.z * ty, 0.08 * span, 0, gg);
        }
      }
    };

    function update(dt, time, camera, u) {
      const onPath = u > 0, dist = u * Ltot;
      // a jump of place (a still, a visitor set down mid-route) is told from a step of flight by the place's own step
      // since the last call and by nothing else. The longest step a flight makes in one frame is 0.05 s (the engine's
      // largest clock step) x 2.5 (the viewer's Pace) x 5 (the hurry to a portal) / 40 s (this world's duration) = 0.0156
      // of the route, and stills are posed 0.25 apart: 0.05 is three times the one and a fifth of the other. Before the
      // first call the last place counts as the entry (lastU is -1 then), so the builder's own call below is no jump
      const jump = Math.abs(u - Math.max(lastU, 0)) > 0.05;
      // the clock is path distance. The song does not stop when the bike does: if the camera is held at one place
      // the towers, lamps and pulses free-run from there at two beats a second (key changes stay with the path).
      if (onPath && Math.abs(u - lastU) < 1e-9) idle += dt; else idle = 0;
      lastU = u;
      const beatPath = onPath ? dist / BEAT_LEN : time * 2, beat = beatPath + idle * 2;
      camPos.setFromMatrixPosition(camera.matrixWorld);
      camFwd.set(0, 0, -1).transformDirection(camera.matrixWorld);
      camUp.set(0, 1, 0).transformDirection(camera.matrixWorld);

      // ---- the lean and the roll: counter-roll the world about the view axis so the bars stay level in frame
      root.quaternion.identity(); root.position.set(0, 0, 0);
      if (onPath) {
        if (dist > D0 - 2 && camPos.z > 0 && camPos.z < LEN) upT.copy(AN.frameInto(LEN - camPos.z, FR).up);
        else {
          path.tangentAtDist(dist - 12, t0); path.tangentAtDist(dist + 22, t1);
          const kappa = -Math.asin(clamp(t0.z * t1.x - t0.x * t1.z, -1, 1)) / 34;
          const lean = 0.63 * Math.tanh(kappa * S_R * 1.6);
          path.tangentAtDist(dist, t0); crossV.crossVectors(t0, Y).normalize();
          upT.copy(Y).multiplyScalar(Math.cos(lean)).addScaledVector(crossV, Math.sin(lean));
        }
        upT.addScaledVector(camFwd, -upT.dot(camFwd));
        if (upT.lengthSq() > 1e-6) {
          upT.normalize();
          const ang = Math.atan2(crossV.crossVectors(upT, camUp).dot(camFwd), upT.dot(camUp));
          q.setFromAxisAngle(camFwd, ang);
          root.quaternion.copy(q);
          root.position.copy(camPos).sub(pA.copy(camPos).applyQuaternion(q));
        }
      }
      root.updateMatrixWorld(true);
      sky.position.copy(camPos);

      // ---- one clock
      const energy = rare ? 1 - smoothstep(47.6, 48.4, beatPath) * (1 - smoothstep(56, 56.7, beatPath)) : 1;
      hero.setBeat(beat); hero.setEnergy(energy);
      let k0 = keys[0], k1 = keys[0], p = 0;
      if (beatPath >= B2 + WIPE) k0 = k1 = keys[2];
      else if (beatPath >= B2) { k0 = keys[1]; k1 = keys[2]; p = (beatPath - B2) / WIPE; }
      else if (beatPath >= B1 + WIPE) k0 = k1 = keys[1];
      else if (beatPath >= B1) { k0 = keys[0]; k1 = keys[1]; p = (beatPath - B1) / WIPE; }
      hero.setKey(k0, k1, k0 === k1 ? 1e9 : camPos.z + 25 - p * p * 3400);
      U.uSplit.value = lerp(k0 === 2 ? 1 : 0, k1 === 2 ? 1 : 0, smoothstep(0.1, 0.8, p));
      U.uTime.value = time; U.uLife.value = energy;
      U.uRainOn.value = onPath ? smoothstep((TUNNEL - 10) / Ltot, (TUNNEL + 40) / Ltot, u) : 0;
      sky.material.uniforms.uTime.value = time;
      if (onPath) {
        path.tangentAtDist(dist, U.uTravel.value);
        U.uVel.value.copy(U.uTravel.value).multiplyScalar(SPEED * PERSIST * smoothstep(0, 0.012, u));
      } else U.uVel.value.set(0, 0, 0);
      hero.update(dt, time, camera);
      if (mist) mist.position.x = Math.sin(time * 0.05) * 60;

      // ---- travelling lines
      dyn.begin();
      // lighthouse: a single line going round once a bar
      const la = beat * Math.PI * 0.5, lc = Math.cos(la), ls = Math.sin(la);
      dyn.seg(lampPos.x, lampPos.y, lampPos.z, lampPos.x + lc * 520, lampPos.y - 6, lampPos.z + ls * 520, 1.3, 0, 1.2);
      dyn.seg(lampPos.x, lampPos.y, lampPos.z, lampPos.x - lc * 70, lampPos.y, lampPos.z - ls * 70, 0.9, 0, 0.5);
      if (onPath) {
        // headlamp: a fan of five amber lines 35 m down the road (its far half fades on the approach, so it does not
        // sit under the portal as a second light)
        const fanFar = 0.7 * (1 - 0.7 * smoothstep(0.8, 0.9, u));
        roadFrame(dist + 5, F); pA.copy(F.o).addScaledVector(F.u, 0.07 - EYE); t0.copy(F.r);
        roadFrame(dist + 20, F); pB.copy(F.o).addScaledVector(F.u, 0.07 - EYE); t1.copy(F.r);
        roadFrame(dist + 36, F); pC.copy(F.o).addScaledVector(F.u, 0.07 - EYE);
        for (let k = -2; k <= 2; k++) {
          const a = k * 0.22, b = k * 0.95, c = k * 1.75;
          dyn.seg(pA.x + t0.x * a, pA.y + t0.y * a, pA.z + t0.z * a, pB.x + t1.x * b, pB.y + t1.y * b, pB.z + t1.z * b, 0.1, 2, 1.5);
          dyn.seg(pB.x + t1.x * b, pB.y + t1.y * b, pB.z + t1.z * b, pC.x + F.r.x * c, pC.y + F.r.y * c, pC.z + F.r.z * c, 0.1, 2, fanFar);
        }
      }
      // the car (or coach, or rival bike) we overtake on the headland
      let behind = 0;
      {
        let dCar = dPass + (dist - dPass) * 0.6, lat = carModel.lat;
        if (cast === 'rival') {
          const lead = 30 + 14 * Math.sin(dist * 0.011), close = smoothstep(dPass - 260, dPass + 40, dist);
          dCar = dist + lerp(lead, -(dist - dPass) * 0.4 - 2, close);
          lat = 2.3 + 1.1 * Math.sin(dist * 0.019) * (1 - close);
        }
        behind = dist - dCar;
        if (dCar > TUNNEL - 60 && dCar < D0 - 8 && behind < 60) {
          const c = lay.at(dCar);
          G.r.set(Math.cos(c.psi), 0, Math.sin(c.psi)); G.u.set(0, 1, 0); G.f.set(c.tx, 0, c.tz);
          if (cast === 'rival') { const ln = 0.6 * Math.tanh(c.k * S_R * 1.6); G.u.set(G.r.x * Math.sin(ln), Math.cos(ln), G.r.z * Math.sin(ln)); G.r.crossVectors(G.f, G.u); }
          G.o.set(c.x + Math.cos(c.psi) * lat, ROAD_Y, c.z + Math.sin(c.psi) * lat);
          for (let i = 0; i < carModel.segs.length; i++) dyn.put(G, carModel.segs[i]);
          for (let i = 0; i < carTrail.length; i++) dyn.put(G, carTrail[i]);
          if (carModel.scarf) {
            // the scarf and two afterimages of where it whipped a moment ago
            const s = carModel.scarf;
            for (let g = 0; g < 3; g++) {
              const tt = time - g * 0.07; let px = s[0], py = s[1], pz = s[2];
              M9[8] = g === 0 ? 1.1 : g === 1 ? 0.45 : 0.22;
              for (let k = 1; k <= 8; k++) {
                const nx = s[0] + Math.sin(tt * 11 - k * 0.9) * 0.05 * k, ny = s[1] + Math.cos(tt * 9 - k * 0.8) * 0.045 * k + 0.02 * k, nz = s[2] - 0.5 * k;
                M9[0] = px; M9[1] = py; M9[2] = pz; M9[3] = nx; M9[4] = ny; M9[5] = nz;
                dyn.put(G, M9); px = nx; py = ny; pz = nz;
              }
            }
          }
        }
      }
      // boats on the bay, lifted in turn by the swell
      if (liner) {
        const x = -900 + ((time * 5) % 420), z = 610;
        G.o.set(x, 0.25 * (AN.seaLine(x, z, beat) - z - beat * 1.5), z); G.r.set(1, 0, 0); G.u.set(0, 1, 0); G.f.set(0, 0, 1);
        for (let j = 0; j < boatModel.length; j++) dyn.put(G, boatModel[j]);
      } else {
        for (let i = 0; i < boats.length; i++) {
          const b = boats[i], x = b.x + Math.sin(time * 0.02 * b.v + b.ph) * 90, z = b.z;
          const lift = 0.45 * (AN.seaLine(x, z, beat) - z - beat * 1.5), heel = 0.1 * Math.sin(beat * 0.8 + b.ph) + lift * 0.03;
          const dir = Math.cos(time * 0.02 * b.v + b.ph) * b.v >= 0 ? 1 : -1;
          G.o.set(x, lift, z); G.r.set(dir, 0, 0); G.u.set(0, Math.cos(heel), Math.sin(heel)); G.f.set(0, -Math.sin(heel), Math.cos(heel));
          for (let j = 0; j < boatModel.length; j++) dyn.put(G, boatModel[j]);
        }
      }
      // gulls: an M that flaps exactly once per beat
      const gl = 0.45 + 0.55 * energy, tau = Math.PI * 2;
      if (onPath && u > 0.1 && u < 0.31) {
        const peel = smoothstep(0.235, 0.3, u), arrive = 1 - smoothstep(0.105, 0.15, u);
        for (let i = 0; i < 12; i++) {
          roadFrame(dist + 7 + i * 3.3 + 70 * arrive + 40 * peel, F);
          const lat = -(10.5 + (i % 4) * 1.8) - 95 * peel * peel * (1 + 0.1 * i), hh = -0.5 + (i % 3) * 1.1 + 0.4 * Math.sin(time * 1.7 + i) - 48 * peel * peel;
          pA.copy(F.o).addScaledVector(F.r, lat); pA.y += hh;
          gull(pA, F.f, Y, 1.5, tau * beat + i * 0.5, 0.95 * gl);
        }
      }
      if (onPath && dist > D0 - 450 && dist < D0 + LEN + 200) {
        const sBase = dist - D0 + 58 + 26 * Math.sin(beat * 0.2);
        for (let i = 0; i < 20; i++) {
          const s = Math.max(4 + i * 3, sBase + i * 5.5), fr = AN.frameInto(Math.min(s, LEN), FR), over = Math.max(0, s - LEN);
          crossV.crossVectors(fr.tangent, fr.up).normalize();
          const lat = ((i % 2) * 2 - 1) * Math.ceil(i / 2) * 1.25, v = 2.2 + 0.9 * Math.sin(i * 1.3 + time * 1.4) + over * 0.3;
          pA.copy(fr.axis).addScaledVector(crossV, lat).addScaledVector(fr.up, v); pA.z -= over;
          t0.copy(fr.tangent);
          gull(pA, t0, pB.copy(fr.up), 1.7, tau * beat + i * 0.35, 0.9 * gl);
        }
      }
      for (let i = 0; i < wheel.length; i++) {
        const w = wheel[i], a = w.ph + time * w.w;
        pA.set(w.c.x + Math.cos(a) * w.r, w.c.y + w.h + Math.sin(a * 2 + i) * 4, w.c.z + Math.sin(a) * w.r);
        t0.set(-Math.sin(a) * Math.sign(w.w), 0, Math.cos(a) * Math.sign(w.w));
        gull(pA, t0, Y, w.span, tau * beat + i * 0.7, 0.8 * gl, Math.abs(w.w) * w.r * 0.08);
      }
      dyn.end();

      // ---- the bike
      bike.mU.uCar.value.set(behind > 1 && behind < 230 ? behind : 0, carModel.tail);
      bike.update(dt, camera, beat, time, onPath ? speedAt(u) + 0.03 * Math.sin(beat * Math.PI) : 0.45, 1, onPath ? smoothstep(0, 0.012, u) : 0, jump);
    }
    update(0, 0, { matrixWorld: path.frameAt(0) }, 0);
    // the clock stood at nought in that call, so the bike's key ink (the mirrors' uA) did not ease: one step toward the
    // first key's near ink is given by hand, so a flight starts with the mirrors a little way into that colour
    bike.mU.uA.value.lerp(U.uInkA2.value, 0.08);

    return {
      scene, path,
      duration: 40,
      title: lookName === 'night' ? 'Corniche at 120 BPM, after midnight' : lookName === 'dawn' ? 'Corniche at 120 BPM, first light' : 'Corniche at 120 BPM',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 78, near: 0.3, far: 6000, lookAhead: 45, sway: 0, bank: 0 },
      pois: [{ at: [0, 70, 300], from: 0.24, to: 0.385, weight: 0.3 }],
      portal: { shape: 'circle', radius: 7, color: '#fff2ff', glow: 1, revealDistance: 1200 },
      post: {
        exposure: look.exposure,
        bloom: { strength: 0.38, radius: 0.5, threshold: 0.9 },
        grade: { saturation: 1.12, contrast: 1.06, tint: look.tint, shadowTint: look.shadow, vignette: 0.38, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
