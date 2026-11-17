// HALL OF STRINGS: a flight between the strings of a concert grand while it is being played.
// World space == the hero's local space: canyon floor centre at the origin, +Z toward the tail, bass at -X,
// soundboard y = 40, treble strings y = 46, bass strings 48.5..54, plate z -78..-15, damper rank z = 30.
// Looks (per seed / ctx.vary.hour): concert spotlight, warm rehearsal work-light, moonlight with the hall dark.
// Pieces: nocturne | toccata | bells. Cast: one moth, two moths, or none and a slow fall of rosin dust.
// Rare event (ctx.vary.rare): a bass string snaps mid-chord and whips back up the hall.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/hall-of-strings.js';

const PAL = ['#05060a', '#1a2440', '#cfd8e6', '#c47a3a', '#e8c98a', '#6e6048', '#b3122a'];
const Y_SB = 40, X_W = 165, Z_TAIL = 490, Z_KEY = -80;
const LID_Y0 = 106, LID_K = 0.576;                 // lid plane: y = LID_Y0 + LID_K * (x + X_W)
const STRUT_A = [-122, -40, 40, 100, 150], STRUT_B = [-80, -66, 8, 40, 66], STRUT_Z0 = -15, STRUT_Z1 = 480, STRUT_Y = 69.5;
const strutX = (i, z) => lerp(STRUT_A[i], STRUT_B[i], (z - STRUT_Z0) / (STRUT_Z1 - STRUT_Z0));

const NOISE = /* glsl */`
float wHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i), wHash(i + vec3(1,0,0)), f.x), mix(wHash(i + vec3(0,1,0)), wHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0,0,1)), wHash(i + vec3(1,0,1)), f.x), mix(wHash(i + vec3(0,1,1)), wHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
const BENT_Z0 = 90, BENT_DX = 205, BENT_P = 1.45;      // the bentside: x = X_W - BENT_DX * ((z - BENT_Z0) / 400) ^ BENT_P
const bentX = (z) => X_W - BENT_DX * Math.pow(clamp((z - BENT_Z0) / (Z_TAIL - BENT_Z0), 0, 1), BENT_P);
const bentZ = (x) => BENT_Z0 + (Z_TAIL - BENT_Z0) * Math.pow(clamp((X_W - x) / BENT_DX, 0, 1), 1 / BENT_P);
const POOL = /* glsl */`
float wBentX(float z){ return 165.0 - 205.0 * pow(clamp((z - 90.0) / 400.0, 0.0, 1.0), 1.45); }
uniform vec3 uKeyDir, uKeyCol, uFillCol, uAmbCol, uPoolC, uHaze, uSpruce; uniform vec2 uPool; uniform float uGobo, uShaftK;
// the pool of the key light: a round spot, or (uGobo, moonlight) four slanted window panes with a transom
float wSpot(vec3 p){ vec3 d = p - uPoolC; vec3 q = d - uKeyDir * dot(d, uKeyDir); float perp = length(q);
  float round = 1.0 - smoothstep(uPool.x * 0.7, uPool.x * 1.2, perp);
  float a = q.z, b = q.x * 1.3 + 0.42 * q.z, bb = abs(fract(b / 30.0) - 0.5) * 30.0;
  float pane = smoothstep(2.6, 4.6, bb) * (1.0 - smoothstep(57.0, 60.5, abs(b))) * (1.0 - smoothstep(70.0, 74.0, abs(a))) * smoothstep(1.4, 3.2, abs(a + 12.0));
  return mix(uPool.y, 1.0, mix(round, pane, uGobo)); }
// how much of the lit shaft a ray from o along R (unit) passes through: a soft column, for mirrors
float wShaft(vec3 o, vec3 R){ vec3 w = o - uPoolC; float b = dot(R, uKeyDir), d = dot(R, w), e = dot(uKeyDir, w), den = max(1.0 - b * b, 0.02);
  float s = (b * e - d) / den, t = (e - b * d) / den; vec3 q = w + R * s - uKeyDir * t; float r = uPool.x * 0.55;
  return exp(-dot(q, q) / (r * r)) * smoothstep(0.0, 20.0, s) * smoothstep(-20.0, 30.0, t) * uShaftK; }
`;

// one material for everything static the world adds (soundboard, bronze, lacquer, maple, felt)
function hallMaterial(S, o = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...S,
      uGrain: { value: o.grain ?? 0 }, uSpec: { value: o.spec ?? 0.1 }, uShin: { value: o.shin ?? 30 }, uFuzz: { value: o.fuzz ?? 0 }, uTremble: { value: 0 }, uGain: { value: o.gain ?? 1 }, uRefl: { value: o.refl ?? 0 }, uSelfLit: { value: o.self ?? 0 }, uRim: { value: o.rim ?? 0 }, uBounce: { value: o.bounce ?? 0 }, uSpecTint: { value: new THREE.Color(o.specTint ?? '#ffffff') }, uMetal: { value: o.metal ?? 0 } },
    fog: true, vertexColors: true, side: o.side ?? THREE.FrontSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime, uTremble;
      varying vec3 vW, vN, vC;
      ${o.soft ? 'attribute float aAlpha; varying float vA;' : ''}
      void main(){
        ${o.soft ? 'vA = aAlpha;' : ''}
        vec3 p = position;
        p += normal * uTremble * 0.22 * sin(uTime * 34.0 + position.x * 1.7 + position.z * 0.9);
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uGrain, uSpec, uShin, uFuzz, uTime, uGain, uRefl, uSelfLit, uRim, uBounce, uPedal, uMetal; uniform sampler2D uEnv; uniform vec3 uPortal, uPortalCol, uCopperC, uSilverC, uSpecTint, uLampP, uLampCol;
      varying vec3 vW, vN, vC;
      ${o.soft ? 'varying float vA;' : ''}
      ${NOISE}
      ${POOL}
      void main(){
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vW);
        vec3 alb = vC;
        if (uGrain > 0.5) {
          float l = vW.x / 0.8, fw = fwidth(l);
          float g = wNoise(vec3(vW.x * 2.6, 0.0, vW.z * 0.03)) * 0.6 + 0.4 * mix(wNoise(vec3(vW.x * 9.0, 3.0, vW.z * 0.08)), 0.5, clamp(fw * 4.0, 0.0, 1.0));
          g = mix(g, 0.5, clamp(fw * 1.2 - 0.3, 0.0, 1.0));
          float line = smoothstep(0.7, 1.0, abs(fract(l) - 0.5) * 2.0);
          alb *= (0.6 + 0.7 * g) * (1.0 - 0.4 * mix(line, 0.15, clamp(fw * 1.5, 0.0, 1.0)));
          alb *= 0.8 + 0.3 * wNoise(vec3(vW.x * 0.03, 1.0, vW.z * 0.012));
          alb *= 0.55 + 0.45 * wNoise(vec3(vW.x * 0.011, 4.0, vW.z * 0.009));                 // broad value structure: the board is not one flat tan
          alb *= 0.74 + 0.5 * wNoise(vec3(vW.x * 0.37, 2.0, vW.z * 0.016)) * wNoise(vec3(vW.x * 0.09, 6.0, vW.z * 0.05)) * 1.6;   // plank-wide figure that survives a grazing view
        } else {
          alb *= 0.76 + 0.48 * (wNoise(vW * 0.5) * 0.6 + wNoise(vW * 2.1) * 0.4);
        }
        float ndv = max(dot(N, V), 0.0);
        if (uFuzz > 0.0) alb *= 0.65 + 0.7 * wNoise(vW * 5.0);
        float spot = wSpot(vW);
        float key = max(dot(N, uKeyDir), 0.0);
        vec3 Li = uKeyCol * (key * spot + 0.2 * pow(1.0 - ndv, 3.0) * spot)
                + uFillCol * (max(-N.y, 0.0) * 1.0 * spot + 0.14) + uAmbCol * (0.7 + 0.3 * N.y) + uHaze * (0.45 + 0.35 * max(N.x, 0.0) + 0.2 * N.y) + vec3(uSelfLit)
                + uLampCol * 0.8 * exp(-dot(vW - uLampP, vW - uLampP) / 40000.0) * max(dot(N, (uLampP - vW) / max(length(uLampP - vW), 1e-3)), 0.0)   // the music-desk lamp warms the keyboard end
                + uKeyCol * uRim * pow(1.0 - ndv, 4.0) + uSpruce * uKeyCol * uBounce * max(-N.y, 0.0) * (0.22 + 0.78 * spot);     // light thrown back up by the lit soundboard
        float sp = pow(max(dot(N, normalize(uKeyDir + V)), 0.0), uShin) * uSpec * spot;
        vec3 col = alb * Li * uGain + uKeyCol * uSpecTint * sp + alb * uFuzz * pow(1.0 - ndv, 2.0) * (uKeyCol * spot + uAmbCol) * 0.8;
        if (uGrain > 0.5) {                                  // the board is lit from above by whichever strings are sounding: music written on the spruce
          float kb = (vW.x + 139.7 - 0.2126 * (vW.z + 17.0)) / 3.172, kt = (vW.x + 138.0) / 3.172;
          float isB = step(-1.0, kb) * step(kb, 25.5) * step(vW.z, 450.0 - 3.42 * kb);
          float isT = (1.0 - isB) * step(25.5, kt) * step(kt, 87.5) * step(vW.z, 43.0 + 350.0 * pow(clamp(1.0 - (kt - 26.0) / 61.0, 0.0, 1.0), 1.5));
          float kk = clamp(mix(kt, kb, isB), 0.0, 87.0), k0 = floor(kk);
          float a0 = texelFetch(uEnv, ivec2(int(k0 + 0.5), 0), 0).g, a1 = texelFetch(uEnv, ivec2(int(min(k0 + 1.0, 87.0) + 0.5), 0), 0).g;
          float am = mix(a0, a1, smoothstep(0.0, 1.0, kk - k0));
          col += alb * mix(uSilverC * 0.55, uCopperC * 1.7, isB) * (am * 1.15 + uPedal * 0.22) * (isB + isT);
        }
        if (uMetal > 0.0) {                                   // cast bronze: a dull metal that carries the room, not a matte stone
          vec3 Rm = reflect(-V, N); float up = smoothstep(-0.25, 0.5, Rm.y), fm = 0.3 + 0.7 * pow(1.0 - ndv, 4.0);
          float pat = wNoise(vW * 0.21 + 5.0) * 0.6 + wNoise(vW * 1.3) * 0.4;
          vec3 env = mix(uSpruce * (uKeyCol * (0.15 + 0.6 * spot) + uAmbCol + uHaze), uHaze * 0.8 + uKeyCol * (0.05 + 0.25 * spot), up);
          col = mix(col, col * 0.6 + uSpecTint * env * 1.7 * fm, uMetal) * (0.8 + 0.4 * pat);
          col += uKeyCol * uSpecTint * pow(max(dot(Rm, uKeyDir), 0.0), 7.0) * 0.4 * spot * uMetal * (0.5 + pat);
          col = mix(col, vec3(0.05, 0.12, 0.1) * (uKeyCol * key * spot + uAmbCol + uHaze), 0.3 * uMetal * smoothstep(0.6, 0.85, wNoise(vW * 0.33 + 7.0)));   // a breath of verdigris
        }
        if (uRefl > 0.0) {
          vec3 R = reflect(-V, N); float fr = 0.05 + 0.6 * pow(1.0 - ndv, 3.0);
          vec3 hz = mix(uHaze, vec3(dot(uHaze, vec3(0.3, 0.5, 0.2))), 0.55);
          float streak = 0.55 + 0.45 * wNoise(vec3(vW.x * 0.9 + vW.z * 0.9, vW.y * 0.04, 3.0)) + 0.25 * wNoise(vec3(vW.x * 4.0 + vW.z * 4.0, vW.y * 0.1, 9.0));
          col += hz * (0.3 + 0.45 * smoothstep(-0.05, 0.3, R.y)) * fr * uRefl;
          // the copper of the string field climbing the lacquer: walls face sideways, so no bounce term reaches them otherwise
          col += uCopperC * uRefl * 0.34 * mix(0.4, 1.0, smoothstep(-80.0, 20.0, vW.z)) * exp(-max(vW.y - 50.0, 0.0) / 16.0) * (0.35 + 0.65 * spot) * (1.0 + 0.8 * uPedal) * (0.6 + 0.4 * streak);
          col += uKeyCol * (0.1 * fr * streak * (0.35 + 0.65 * smoothstep(40.0, 110.0, vW.y)) + 0.22 * wShaft(vW, R) * (0.2 + fr) * streak) * uRefl;
          if (R.y < -0.02) {
            float t = (40.0 - vW.y) / R.y; vec3 Sp = vW + R * t;
            float inside = step(-165.0, Sp.x) * step(Sp.x, wBentX(Sp.z)) * step(14.0, Sp.z) * step(Sp.z, 490.0);
            inside *= smoothstep(14.0, 70.0, Sp.z) * smoothstep(-165.0, -125.0, Sp.x) * 0.7;                // no hard-edged plank where the mirrored board begins
            col += uSpruce * (uKeyCol * uKeyDir.y * wSpot(Sp) + uAmbCol + uHaze) * inside * fr * uRefl * exp(-(t * fogDensity) * (t * fogDensity));
          }
          // the string field in the lacquer: every string a hairline, every sounding string a ribbon of light
          float ry = min(R.y, -0.02), okR = step(R.y, -0.02), rs = abs(R.y) < 0.02 ? -0.02 : R.y, ts = (50.0 - vW.y) / rs; vec3 Q = vW + R * ts;
          float kb = (Q.x + 139.7 - 0.2126 * (Q.z + 17.0)) / 3.172, kt = (Q.x + 138.0) / 3.172;
          float isB = smoothstep(-0.5, 2.0, kb) * step(kb, 25.5) * step(Q.z, 450.0 - 3.42 * kb);
          float isT = (1.0 - isB) * step(25.5, kt) * step(kt, 87.5) * step(Q.z, 43.0 + 350.0 * pow(clamp(1.0 - (kt - 26.0) / 61.0, 0.0, 1.0), 1.5));
          float kk = mix(kt, kb, isB), fk = fwidth(kk);
          vec4 e = texelFetch(uEnv, ivec2(int(clamp(kk, 0.0, 87.0) + 0.5), 0), 0);
          float ln = mix(1.0 - smoothstep(0.12, 0.42, abs(fract(kk + 0.5) - 0.5)), 0.4, clamp(fk * 1.6, 0.0, 1.0));
          float amp = max(e.g, uPedal * 0.09), fl = 1.0 + 1.6 * exp(-e.b * 4.0);
          vec3 sc = mix(mix(uSilverC, vec3(0.5, 0.68, 1.0), 0.4), uCopperC * vec3(1.5, 1.2, 0.9), isB);
          col += sc * (ln * 0.22 * (uKeyCol * wSpot(Q) + uAmbCol) + mix(ln, 1.0, amp) * amp * fl * 1.8) * (isB + isT) * step(0.02, abs(R.y)) * step(0.0, ts) * step(-17.0, Q.z) * (0.25 + fr) * uRefl * exp(-(ts * fogDensity) * (ts * fogDensity));
          // the lit porthole and its shaft, mirrored
          float tp = (uPortal.y - vW.y) / ry; vec2 dp = (vW + R * tp).xz - uPortal.xz;
          vec2 rh = R.xz / max(length(R.xz), 1e-3), tov = uPortal.xz - vW.xz;
          float bx = (rh.x * tov.y - rh.y * tov.x) / 4.5;
          float beam = exp(-bx * bx) * step(0.0, dot(rh, tov)) * smoothstep(-0.5, 0.1, R.y) * exp(-dot(tov, tov) / 4900.0);
          col += uPortalCol * (1.6 * exp(-dot(dp, dp) / 90.0) * okR * step(0.0, tp) + 0.35 * beam) * (0.15 + fr) * uRefl;
        }
        gl_FragColor = vec4(col, ${o.soft ? 'vA * vA * (3.0 - 2.0 * vA) * 0.6' : '1.0'});
        #include <fog_fragment>
      }`,
  });
  if (o.soft) { mat.transparent = true; mat.depthWrite = false; }
  return mat;
}

// ---- small geometry helpers (non-indexed, position + normal + color)
function paint(g, col, fn) {
  if (g.index) g = g.toNonIndexed();
  g.deleteAttribute('uv'); g.computeVertexNormals();
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const q = fn ? fn(p.getX(i), p.getY(i), p.getZ(i)) : col;
    c[i * 3] = q.r; c[i * 3 + 1] = q.g; c[i * 3 + 2] = q.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
function box(w, h, d, x, y, z, col, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return paint(g, col);
}
// grid quad: corner o, edges u and v; faces along u x v
function quad(o, u, v, su, sv, col, fn) {
  const pos = [];
  const P = (a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b];
  for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) {
    const a0 = i / su, a1 = (i + 1) / su, b0 = j / sv, b1 = (j + 1) / sv;
    pos.push(...P(a0, b0), ...P(a1, b0), ...P(a1, b1), ...P(a0, b0), ...P(a1, b1), ...P(a0, b1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return paint(g, col, fn);
}
// loft a 4-sided section (half width hw, bottom yb(p), top yt(p)) along a polyline of [x, z]; yb/yt get the point index
function loft(pts, hw, yb, yt, col, fn) {
  const pos = [], n = pts.length;
  const ring = (i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const sx = tz, sz = -tx, [x, z] = pts[i], w = typeof hw === 'function' ? hw(i) : hw, B = yb(i), T = yt(i);
    return [[x - sx * w, B, z - sz * w], [x + sx * w, B, z + sz * w], [x + sx * w * 0.8, T, z + sz * w * 0.8], [x - sx * w * 0.8, T, z - sz * w * 0.8]];
  };
  let r0 = ring(0);
  for (let i = 1; i < n; i++) {
    const r1 = ring(i);
    for (let k = 0; k < 4; k++) { const a = r0[k], b = r0[(k + 1) % 4], c = r1[(k + 1) % 4], d = r1[k]; pos.push(...a, ...c, ...d, ...a, ...b, ...c); }
    r0 = r1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return paint(g, col, fn);
}

// loft an I-section (web 2 m, flanges 7 m, chamfered) along a polyline of [x, z]
function ibeam(pts, yb, yt, col, fn) {
  const pos = [], n = pts.length;
  const ring = (i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const sx = tz, sz = -tx, [x, z] = pts[i], B = yb(i), T = yt(i);
    return [[-3.5, B], [-0.75, B], [-0.45, B - 0.55], [0.45, B - 0.55], [0.75, B], [3.5, B], [3.5, B + 0.7], [1, B + 1.8], [1, T - 1.8], [3.5, T - 0.7], [3.5, T], [0.95, T], [0.6, T + 0.6], [-0.6, T + 0.6], [-0.95, T], [-3.5, T], [-3.5, T - 0.7], [-1, T - 1.8], [-1, B + 1.8], [-3.5, B + 0.7]].map(([o, y]) => [x + sx * o, y, z + sz * o]);
  };
  let r0 = ring(0);
  const M = r0.length;
  for (let k = 1; k < M - 1; k++) pos.push(...r0[0], ...r0[k + 1], ...r0[k]);                 // end cap
  for (let i = 1; i < n; i++) {
    const r1 = ring(i);
    for (let k = 0; k < M; k++) { const a = r0[k], b = r0[(k + 1) % M], c = r1[(k + 1) % M], d = r1[k]; pos.push(...a, ...c, ...d, ...a, ...b, ...c); }
    r0 = r1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return paint(g, col, fn);
}
// rivet bosses hanging under a flange: one low truncated pyramid per [x, y, z] (y = the flange face)
function bosses(list, col, r = 0.5, h = 0.32) {
  const pos = [];
  for (const [x, y, z, upK] of list) {
    if (upK) {                                               // standing on a top face: a low pyramid, r wide, upK high
      const T = [[-r, -r], [r, -r], [r, r], [-r, r]].map((q) => [x + q[0], y, z + q[1]]), U = [[-r, -r], [r, -r], [r, r], [-r, r]].map((q) => [x + q[0] * 0.6, y + upK, z + q[1] * 0.6]);
      for (let k = 0; k < 4; k++) { const a = T[k], b = T[(k + 1) % 4], c = U[(k + 1) % 4], d = U[k]; pos.push(...a, ...c, ...b, ...a, ...d, ...c); }
      pos.push(...U[0], ...U[2], ...U[1], ...U[0], ...U[3], ...U[2]);
      continue;
    }
    const T = [[-r, 0, -r], [r, 0, -r], [r, 0, r], [-r, 0, r]].map((q) => [x + q[0], y, z + q[2]]), Bq = [[-r, 0, -r], [r, 0, -r], [r, 0, r], [-r, 0, r]].map((q) => [x + q[0] * 0.6, y - h, z + q[2] * 0.6]);
    for (let k = 0; k < 4; k++) { const a = T[k], b = T[(k + 1) % 4], c = Bq[(k + 1) % 4], d = Bq[k]; pos.push(...a, ...b, ...c, ...a, ...c, ...d); }
    pos.push(...Bq[0], ...Bq[1], ...Bq[2], ...Bq[0], ...Bq[2], ...Bq[3]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return paint(g, col);
}
// a tapered cast gusset filling the I between the flanges: 6.4 m wide (x), long at the bottom flange, short at the top
function gusset(x, yb, yt, z, ry, col) {
  const sh = new THREE.Shape(); sh.moveTo(-3.4, yb); sh.lineTo(3.4, yb); sh.lineTo(1.4, yb + 1.6); sh.lineTo(0.45, yt - 1.4); sh.lineTo(1.2, yt); sh.lineTo(-1.2, yt); sh.lineTo(-0.45, yt - 1.4); sh.lineTo(-1.4, yb + 1.6); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 6.6, bevelEnabled: false }); g.translate(0, 0, -3.3); g.rotateY(Math.PI / 2 + ry); g.translate(x, 0, z);
  return paint(g, col);
}

// ---- the lid: black lacquer with an analytic mirror image of the soundboard and the struts
function lidMaterial(S, look) {
  return new THREE.ShaderMaterial({
    uniforms: { ...S, uStrA: { value: STRUT_A }, uStrB: { value: STRUT_B }, uLac: { value: new THREE.Color(PAL[0]) },
      uBronze: { value: new THREE.Color(PAL[5]).multiplyScalar(0.5) }, uMirror: { value: look.mirror }, uFogCol: { value: look.fog.clone() }, uFogD: { value: look.fogD } },
    depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLac, uBronze, uFogCol; uniform float uMirror, uFogD, uTime, uPedal; uniform float uStrA[5]; uniform float uStrB[5];
      varying vec3 vW;
      ${NOISE}
      ${POOL}
      void main(){
        vec3 n = normalize(vec3(${LID_K.toFixed(3)}, -1.0, 0.0));
        vec3 Vd = vW - cameraPosition; float d0 = length(Vd); vec3 V = Vd / max(d0, 1e-3);
        vec3 R = reflect(V, n);
        if (vW.x > wBentX(vW.z)) discard;                    // the lid is cut to the wing shape of the case
        float fres = 0.35 + 0.65 * pow(1.0 - abs(dot(V, n)), 3.0);
        vec3 col = uLac * 0.6 + uHaze * 0.4 * fres;
        // the shaft and its lit haze, mirrored: the top of the frame is never an empty black
        col += uKeyCol * (0.15 * wShaft(vW, R) + 0.012) * fres * (1.0 + 0.6 * uPedal);
        if (R.y < -0.02) {
          float t = (${Y_SB.toFixed(1)} - vW.y) / R.y; vec3 Sp = vW + R * t;
          float inside = smoothstep(${(-X_W - 10).toFixed(1)}, ${(-X_W + 10).toFixed(1)}, Sp.x) * (1.0 - smoothstep(-10.0, 10.0, Sp.x - wBentX(Sp.z))) * smoothstep(4.0, 24.0, Sp.z) * (1.0 - smoothstep(${(Z_TAIL - 10).toFixed(1)}, ${(Z_TAIL + 10).toFixed(1)}, Sp.z));
          float g = 0.7 + 0.5 * wNoise(vec3(Sp.x * 0.6, 0.0, Sp.z * 0.02));
          vec3 sb = uSpruce * g * (uKeyCol * uKeyDir.y * wSpot(Sp) + uAmbCol + uHaze + uFillCol * 0.9) * (1.0 + 0.8 * uPedal);
          // string field as a faint sheen of lines over the board
          sb *= 0.8 + 0.2 * sin(Sp.x * 2.0);
          float t2 = (${STRUT_Y.toFixed(1)} - vW.y) / R.y; vec3 Q = vW + R * t2; float bar = 0.0;
          float zt = clamp((Q.z - ${STRUT_Z0.toFixed(1)}) / ${(STRUT_Z1 - STRUT_Z0).toFixed(1)}, 0.0, 1.0);
          for (int i = 0; i < 5; i++) { float sx = mix(uStrA[i], uStrB[i], zt); bar = max(bar, 1.0 - smoothstep(3.2, 4.4, abs(Q.x - sx))); }
          bar *= step(${STRUT_Z0.toFixed(1)}, Q.z) * step(Q.z, ${STRUT_Z1.toFixed(1)});
          sb = mix(sb * inside, uBronze * (uKeyCol * 0.5 * wSpot(Q) + uAmbCol + uHaze), bar);
          float ft = exp(-pow((d0 + t) * uFogD * 0.6, 2.0));
          col += sb * uMirror * fres * ft;
        }
        float f = 1.0 - exp(-pow(d0 * uFogD, 2.0));
        gl_FragColor = vec4(mix(col, uFogCol, f * 0.7), 1.0);
      }`,
  });
}

// ---- mirrored twin of the string ribbons, seen in the lid (shares the hero's instanced geometry and envelope texture)
function mirrorStringMaterial(S, look) {
  return new THREE.ShaderMaterial({
    uniforms: { ...S, uPedalF: S.uPedal, uCopper: { value: new THREE.Color(PAL[3]) }, uSilver: { value: new THREE.Color(PAL[2]) }, uMirror: { value: look.mirror }, uFogD: { value: look.fogD } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 iA; attribute vec3 iB; attribute vec4 iInfo;
      uniform sampler2D uEnv; uniform float uTime, uPedal, uPx;
      varying float vV, vEnvF, vAmp, vKind, vSeed, vAge, vT; varying vec3 vW;
      void main(){
        float t = position.x, sd = position.y, amp = 0.0, age = 99.0;
        if (iInfo.x > -0.5) {
          vec4 e = texelFetch(uEnv, ivec2(int(iInfo.x + 0.5), 0), 0); age = e.b;
          amp = max(e.g, uPedal * 0.07 * (0.6 + 0.4 * sin(uTime * 3.1 + iInfo.w * 40.0)));
        }
        float shape = 0.62 * abs(sin(3.14159 * t)) + 0.26 * abs(sin(6.28318 * t)) + 0.14 * abs(sin(9.42478 * t));
        float env = 1.5 * amp * shape;
        vec3 P = mix(iA, iB, t);
        vec4 w = modelMatrix * vec4(P, 1.0); vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vec3 dv = (modelViewMatrix * vec4(iB - iA, 0.0)).xyz; dv /= max(length(dv), 1e-4);
        vec3 sdv = cross(dv, mv.xyz); sdv /= max(length(sdv), 1e-4);
        float dist = length(mv.xyz);
        float hw = max(max(iInfo.y, env), 1.1 * uPx * dist);
        mv.xyz += sdv * sd * hw;
        vV = sd; vEnvF = env / hw; vAmp = amp; vKind = iInfo.z; vSeed = iInfo.w; vAge = age; vT = t;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCopper, uSilver, uKeyCol, uAmbCol; uniform float uMirror, uFogD, uTime, uPedalF;
      varying float vV, vEnvF, vAmp, vKind, vSeed, vAge, vT; varying vec3 vW;
      void main(){
        // only where the line of sight actually meets the lid
        vec3 n = normalize(vec3(${LID_K.toFixed(3)}, -1.0, 0.0)), p0 = vec3(${(-X_W).toFixed(1)}, ${LID_Y0.toFixed(1)}, 0.0);
        vec3 D = vW - cameraPosition; float dn = dot(D, n);
        float th = dot(p0 - cameraPosition, n) / (abs(dn) > 1e-4 ? dn : 1e-4);
        vec3 H = cameraPosition + D * th;
        float xb = ${X_W.toFixed(1)} - ${BENT_DX.toFixed(1)} * pow(clamp((H.z - ${BENT_Z0.toFixed(1)}) / ${(Z_TAIL - BENT_Z0).toFixed(1)}, 0.0, 1.0), ${BENT_P.toFixed(1)});
        float inLid = (1.0 - smoothstep(xb - 45.0, xb - 3.0, H.x)) * smoothstep(${(-X_W + 2).toFixed(1)}, ${(-X_W + 30).toFixed(1)}, H.x) * smoothstep(${Z_KEY.toFixed(1)}, ${(Z_KEY + 40).toFixed(1)}, H.z) * (1.0 - smoothstep(${(Z_TAIL - 40).toFixed(1)}, ${(Z_TAIL + 5).toFixed(1)}, H.z));
        inLid *= smoothstep(0.0, 0.14, vT) * (1.0 - smoothstep(0.68, 0.98, vT));
        if (th < 0.0 || th > 1.0 || inLid < 0.01) discard;
        float a = abs(vV);
        vec3 gcol = mix(mix(uSilver, vec3(0.5, 0.68, 1.0), 0.45), uCopper * vec3(1.5, 1.0, 0.62), vKind);
        vec3 base = mix(uSilver * 0.24, uCopper * 0.5, vKind) * (uAmbCol * 1.2 + uKeyCol * 0.5);
        vec3 rgb = base * (1.0 - a) * 0.6 * 0.4 + gcol * (1.0 - a) * 0.3 * uPedalF * (0.7 + 0.3 * sin(uTime * 3.1 + vSeed * 40.0));   // the whole twin glows on a pedal lift
        if (vEnvF > 0.002) {
          float q = a / vEnvF, inside = 1.0 - smoothstep(0.9, 1.0, q);
          float dens = 0.1 + 0.9 * pow(min(q, 1.0), 6.0);
          rgb += gcol * 1.1 * dens * inside * (0.2 + 0.8 * vAmp) * (1.0 + 1.6 * exp(-vAge * 4.0)) * smoothstep(0.0, 0.25, vEnvF);
        }
        float ft = exp(-pow(length(D) * uFogD * 0.6, 2.0));
        gl_FragColor = vec4(rgb * uMirror * 5.0 * ft * inLid, 1.0);
      }`,
  });
}

// ---- the clothes moth: 8 m wingspan, cream with silver scales
function makeMoth(S, rng) {
  const cream = new THREE.Color(0.80, 0.74, 0.60), silver = new THREE.Color(PAL[2]).multiplyScalar(0.72), dusk = new THREE.Color(0.30, 0.25, 0.21), umber = new THREE.Color(0.16, 0.12, 0.1);
  // a wing as a smooth cambered grid: spine P(s), half chord h(s), across-vector n
  const wingPart = (P, h, n, bandF) => {
    const NSp = 12, NC = 6, pos = [], col = [], idx = [], c = new THREE.Color();
    for (let i = 0; i <= NSp; i++) for (let j = 0; j <= NC; j++) {
      const sp = i / NSp, ch = j / NC, [px, py] = P(sp), hh = h(sp), o = (ch - 0.5) * 2 * hh;
      const scal = j === 0 ? 1 + 0.06 * Math.cos(i * Math.PI) : 1;                         // faintly scalloped trailing edge
      const x = px + n[0] * o * scal, y = py + n[1] * o * scal;
      pos.push(x, 0.16 * Math.sin(Math.PI * ch) * hh + 0.1 * sp - 0.3 * sp * sp, -y);
      const r = sp, band = Math.exp(-Math.pow((r - bandF) / 0.07, 2)) + 0.7 * Math.exp(-Math.pow((r - bandF - 0.27) / 0.05, 2));
      c.copy(cream).lerp(silver, smoothstep(0.5, 1, r) * 0.65 + 0.2 * (0.5 + 0.5 * Math.sin(r * 31 + ch * 9)))
        .lerp(dusk, 0.6 * band * (0.6 + 0.4 * Math.sin(ch * 11 + i))).lerp(umber, 0.75 * smoothstep(0.3, 0.0, ch) * (0.55 + 0.45 * Math.cos(i * Math.PI)))
        .lerp(dusk, 0.5 * smoothstep(0.9, 1, r));
      const spot = Math.exp(-(Math.pow((r - 0.45) / 0.07, 2) + Math.pow((ch - 0.62) / 0.16, 2))); c.lerp(umber, 0.8 * spot);
      col.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < NSp; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const fore = wingPart((q) => [0.25 + 3.75 * q, 0.2 + 1.3 * q + 0.35 * Math.sin(Math.PI * q)], (q) => 0.05 + (0.3 + 0.95 * Math.pow(Math.sin(Math.PI * Math.min(1, q * 0.97 + 0.03)), 0.6)) * (1 - 0.3 * q) * smoothstep(1.0, 0.86, q), [0.33, -0.94], 0.36);
  const hind = wingPart((q) => [0.25 + 2.0 * q, -0.35 - 1.8 * q], (q) => 0.05 + (0.22 + 0.95 * Math.pow(Math.sin(Math.PI * Math.min(1, q * 0.96 + 0.04)), 0.6)) * smoothstep(1.0, 0.82, q), [-0.72, -0.69], 0.5);
  hind.translate(0, -0.06, 0);
  const wing = mergeGeometries([fore, hind]); fore.dispose(); hind.dispose();
  const mat = hallMaterial(S, { fuzz: 0.8, spec: 0.2, shin: 12, side: THREE.DoubleSide, gain: 0.9, self: 0.12 });
  const L = new THREE.Mesh(wing, mat), R = new THREE.Mesh(wing, mat); R.scale.x = -1;
  const tint = (g, fn) => { if (g.index) g = g.toNonIndexed(); g.deleteAttribute('uv'); const p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const q = fn(p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = q.r; c[i * 3 + 1] = q.g; c[i * 3 + 2] = q.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
  const body = new THREE.CapsuleGeometry(0.4, 2.3, 4, 10); body.rotateX(Math.PI / 2); body.scale(1, 0.9, 1); body.translate(0, 0, 0.3);
  const thorax = new THREE.SphereGeometry(0.62, 10, 8); thorax.scale(1, 0.9, 1.35); thorax.translate(0, 0.08, -0.75);
  const head = new THREE.SphereGeometry(0.4, 10, 8); head.translate(0, 0.08, -1.75);
  const parts = [tint(body, (x, y, z) => cream.clone().lerp(dusk, 0.35 + 0.3 * Math.sin(z * 7))), tint(thorax, () => cream.clone().lerp(silver, 0.3)), tint(head, (x, y, z) => (Math.abs(x) > 0.24 && z < -1.8 ? umber : dusk))];
  for (const sx of [-1, 1]) {                                                               // antennae swept forward and out
    const an = new THREE.CylinderGeometry(0.035, 0.085, 2.5, 5); an.translate(0, 1.25, 0); an.rotateX(-1.15); an.rotateY(-sx * 0.5); an.translate(sx * 0.18, 0.3, -1.95);
    parts.push(tint(an, () => umber));
  }
  const B = new THREE.Mesh(mergeGeometries(parts), mat); parts.forEach((g) => g.dispose());
  const object = new THREE.Group(); object.add(L, R, B);
  const ph = rng() * 6.28, _f = new THREE.Vector3(), _m = new THREE.Matrix4(), _u = new THREE.Vector3(0, 1, 0);
  return {
    object, phase: ph, mat,
    // place at p, facing along dir, wings at angle a (0 flat, + up); up optional
    set(p, dir, a, up) {
      object.position.copy(p);
      _f.copy(p).sub(dir);                                   // lookAt target behind => -Z faces dir
      _m.lookAt(_f, p, up || _u); object.quaternion.setFromRotationMatrix(_m);
      L.rotation.z = a; R.rotation.z = -a;
    },
  };
}

// ---- the dark concert hall beyond the open side: out-of-focus aisle lights in three curved tiers and one chandelier
function makeHallLights(rng, look, detail) {
  const P = [], C = [], A = [], F = [];
  const warm = new THREE.Color(PAL[4]);
  const put = (az, el, size, col, k, ph, soft = 0) => {
    const ce = Math.cos(el); P.push(Math.cos(az) * ce * 2500, Math.sin(el) * 2500, Math.sin(az) * ce * 2500);
    C.push(col.r * k, col.g * k, col.b * k); A.push(size, ph ?? rng() * 6.28, rng()); F.push(soft);
  };
  const tiers = [0.035, 0.085, 0.14], n = Math.round(133 * detail);
  if (look.bokeh > 0.01) for (let t = 0; t < 3; t++) for (let i = 0; i < n; i++) {
    const az = lerp(-1.3, 1.3, (i + rng.range(-0.3, 0.3)) / n);
    if (Math.abs(Math.sin(az * 9 + t)) < 0.12) continue;                           // aisles between the blocks
    const el = tiers[t] + 0.03 * az * az + rng.range(-0.006, 0.006);
    put(az, el, rng.range(0.008, 0.02) * (1 - t * 0.15), warm, look.bokeh * rng.range(0.25, 0.5));
  }
  for (const w of look.lamps) for (let i = 0; i < w.n; i++) put(w.az + rng.range(-w.spread, w.spread), w.el + rng.range(-w.spread, w.spread) * 0.5, w.size * rng.range(0.6, 1.2), new THREE.Color(w.color), w.k * rng.range(0.6, 1.1), undefined, w.soft ? 1 : 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aSoft', new THREE.Float32BufferAttribute(F, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPtScale: { value: 400 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute vec3 aA; attribute float aSoft; uniform float uTime, uPtScale; varying vec3 vC; varying float vSoft;
      void main(){
        vSoft = aSoft;
        vC = aCol * (0.8 + 0.2 * sin(uTime * (0.5 + aA.z) + aA.y)) * (0.93 + 0.07 * sin(uTime * 7.0 * aA.z + aA.y * 3.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(aA.x * 2.0 * uPtScale * (1.0 + 0.06 * sin(uTime * 0.4 + aA.y)), 2.0, 90.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; varying float vSoft;
      void main(){ float d = length(gl_PointCoord * 2.0 - 1.0); float disc = (1.0 - smoothstep(0.78, 1.0, d)) * (0.55 + 0.45 * smoothstep(0.45, 0.9, d));
        float lamp = (exp(-d * d * 3.5) + 2.2 * exp(-d * d * 40.0)) * (1.0 - smoothstep(0.8, 1.0, d));      // a work-light: hot core, soft falloff
        gl_FragColor = vec4(vC * mix(disc, lamp, vSoft), 1.0); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = -3;
  return { object: pts, uniforms: mat.uniforms };
}

const LOOKS = {
  // concert: one cool silver spot from high right through the lid opening, the hall a constellation of aisle lights
  spot: { hero: 'spot', keyDir: [0.5, 0.8, 0.26], fog: '#0a1026', haze: '#465680', hall: '#3a2a18', fogD: 0.0033, pool: [-85, 46, 90, 120, 0.3], gobo: 0, mirror: 0.9, bokeh: 1, copper: [1.5, 0], sat: 1.06,
    lamps: [{ az: 0.18, el: 0.33, n: 34, spread: 0.035, size: 0.006, color: '#ffe6b8', k: 1.3 }, { az: 0.18, el: 0.33, n: 1, spread: 0, size: 0.05, color: '#e8c98a', k: 0.35, soft: 1 }],
    rays: ['#cfd8e6', 0.28], exposure: 1.28, tint: '#eef2ff', shadow: '#080d2a', portal: '#dfe6f5' },
  // rehearsal: one warm work-light from the hall side with a soft shaft of its own, a lit centre falling off into warm dark,
  // the lid a bright mirror, a few dim lamps in the empty tiers
  rehearsal: { hero: 'rehearsal', keyDir: [0.62, 0.7, 0.34], fog: '#131018', haze: '#6c5a56', hall: '#2c2014', fogD: 0.0027, pool: [-66, 46, 104, 86, 0.3], gobo: 0, mirror: 1.0, bokeh: 0.35, copper: [1.6, 0], sat: 0.98,
    lamps: [{ az: 0.35, el: 0.5, n: 5, spread: 0.3, size: 0.04, color: '#fff0dc', k: 0.8, soft: 1 }, { az: -0.7, el: 0.1, n: 3, spread: 0.2, size: 0.012, color: '#7dffb0', k: 0.35 }],
    rays: ['#ffe2b0', 0.14], exposure: 1.32, tint: '#fff4e4', shadow: '#0e0f1e', portal: '#ffe6c0' },
  // moonlight: the hall dark, a blue window thrown across the trebles from the other side, copper gone to pewter
  moon: { hero: 'moon', keyDir: [-0.3, 0.88, 0.3], fog: '#050a1e', haze: '#22346e', hall: '#0c1638', fogD: 0.0034, pool: [5, 46, 150, 95, 0.34], rayR: 44, gobo: 1, mirror: 0.6, bokeh: 0.0, copper: [0.8, 0.4], sat: 0.8,
    lamps: [{ az: -0.9, el: 0.06, n: 2, spread: 0.3, size: 0.01, color: '#ff5a4a', k: 0.4 }, { az: 0.4, el: 0.24, n: 3, spread: 0.5, size: 0.045, color: '#8fa8ff', k: 0.2, soft: 1 }],
    rays: ['#8fb0ff', 0.13], exposure: 1.5, tint: '#dfe8ff', shadow: '#040a26', portal: '#a9c2ff' },
};

export default {
  id: 'hall-of-strings',
  name: 'Hall of Strings',
  category: 'interior',
  weirdness: 0.2,
  media: ['interior', 'tiny', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const rL = rng.fork('look'), rM = rng.fork('moth'), rG = rng.fork('geo');
    // ---- the three looks, three pieces and three casts
    const hour = vary.hour || 'any';
    const lookName = hour === 'night' ? 'moon' : hour === 'golden' || hour === 'dawn' ? 'rehearsal' : hour === 'day' ? 'spot' : rL.pick(['spot', 'rehearsal', 'moon']);
    const look = { ...LOOKS[lookName] }; look.fog = new THREE.Color(look.fog);
    const piece = rL.pick(['nocturne', 'nocturne', 'toccata', 'bells']);
    const cast = rL.pick(['one', 'one', 'two', 'rosin']);
    const rare = !!vary.rare;
    const keyDir = new THREE.Vector3(look.keyDir[0] + rL.range(-0.06, 0.06), look.keyDir[1], look.keyDir[2] + rL.range(-0.05, 0.05)).normalize();

    const scene = new THREE.Scene();
    scene.background = look.fog.clone();
    scene.fog = new THREE.FogExp2(look.fog.clone(), look.fogD);

    // ---- the hero: the hammer line, strings, dampers, pins and plate
    const hero = await buildHero(ctx, { palette: PAL, piece, light: look.hero, keyDir: keyDir.toArray(), apron: false, dust: Math.round(12000 * detail * density) });
    scene.add(hero.object);
    const A = hero.anchors, HU = hero.uniforms;
    const poolC = new THREE.Vector3(look.pool[0] + rL.range(-12, 12), look.pool[1], look.pool[2] + rL.range(-15, 15));
    const S = { uTime: HU.uTime, uPedal: HU.uPedal, uEnv: HU.uEnv, uPx: HU.uPx, uKeyDir: HU.uKeyDir, uKeyCol: HU.uKeyCol, uFillCol: HU.uFillCol, uAmbCol: HU.uAmbCol,
      uPoolC: { value: poolC }, uPool: { value: new THREE.Vector2(look.pool[3], look.pool[4]) },
      uHaze: { value: new THREE.Color(look.haze) }, uSpruce: { value: new THREE.Color(PAL[4]).multiplyScalar(0.5) }, uGobo: { value: look.gobo }, uShaftK: { value: look.rays[1] > 0.01 ? 1 : 0.25 },
      uPortal: { value: A.portalSeat.position.clone() }, uPortalCol: { value: new THREE.Color(look.portal) }, uCopperC: { value: new THREE.Color(PAL[3]) }, uSilverC: { value: new THREE.Color(PAL[2]) }, uLampP: HU.uLampP, uLampCol: HU.uLampCol };
    HU.uLampCol.value.multiplyScalar(lookName === 'moon' ? 0.45 : 1);
    HU.uAmbCol.value.multiplyScalar(3.0); HU.uShaft.value.set(-12, 36);
    {
      const su = hero.parts.strings.material.uniforms, cu = su.uCopper.value;
      cu.lerp(new THREE.Color(1.0, 0.5, 0.2), 0.35).lerp(new THREE.Color(PAL[2]), look.copper[1]).multiplyScalar(look.copper[0]);      // moonlight turns the copper to pewter
      S.uCopperC.value.copy(cu).multiplyScalar(0.67); hero.parts.dust.material.uniforms.uCopper.value.lerp(new THREE.Color(PAL[2]), look.copper[1]);
      su.uGlow.value *= 1.8 * (piece === 'bells' ? 1.6 : piece === 'toccata' ? 0.7 : 1);          // sounding strings are light; the piece shows in the whole ribbon field
      if (lookName === 'rehearsal') HU.uShaft.value.set(-30, 10);
    }
    await ctx.yield();

    // ---- the flight
    const portalP = A.portalSeat.position, dive = A.diveDir;
    // in along the bass strings from the tail, sweeping across the overstrung field and under struts 1 and 0, then over the
    // last damper, two turns down and up the string-free slot of the hammer canyon, out over the pins and down the porthole
    // three pictures on the way up the hall: high over the whole fan (level for the first 60 m), down between struts 2 and 1
    // to skim the bass strings and pass under strut 1, then up over strut 0 so the damper rank, the slot and the hammer line
    // lie below as the first pedal lift comes
    // (the entry is level and low, 22 m over the bass strings, so the copper fan fills the lower half of the previous portal)
    const pts = [[-16, 74, 402], [-25, 73.5, 348], [-36, 70, 300], [-49, 57.5, 240], [-84, 75, 186], [-100, 88, 124], [-127, 78, 84], [-146, 62, 47], [-150, 52, 23]];
    const HX = -153.5, HR = 5.5, I_POOL = 5, I_A0 = pts.length;
    const helY = (deg) => (deg <= 270 ? lerp(46, 35.5, deg / 270) : deg <= 360 ? lerp(35.5, 36.5, (deg - 270) / 90) : lerp(36.5, 54, smoothstep(0, 1, (deg - 360) / 270) * 0.35 + 0.65 * (deg - 360) / 270));
    for (let d = 0; d <= 630; d += 45) { const a = -d * Math.PI / 180; pts.push([HX + HR * Math.cos(a), helY(d), HR * Math.sin(a)]); }
    const I_HANG = I_A0 + 6, I_TOP = pts.length - 1;
    pts.push([-147.6, 60.5, -10], [-144, 72, -25]); const I_PINS = pts.length - 1;
    pts.push([-114, 88, -44], [-99, 97.5, -61]);
    for (const d of [60, 40, 20, 0]) pts.push([portalP.x - dive.x * d, portalP.y - dive.y * d, portalP.z - dive.z * d]);
    const path = makePath(pts);
    await ctx.yield();
    const uAt = [];                                           // progress (0..1) of each control point
    {
      const N = 1600, tab = new Float32Array((N + 1) * 3), v = new THREE.Vector3(); let j = 0;
      for (let k = 0; k <= N; k++) { path.pointAt(k / N, v); tab[k * 3] = v.x; tab[k * 3 + 1] = v.y; tab[k * 3 + 2] = v.z; if ((k & 511) === 511) await ctx.yield(); }
      for (const p of pts) {
        let best = 1e9, bj = j;
        for (let k = j; k <= Math.min(N, j + 300); k++) { const d = (tab[k * 3] - p[0]) ** 2 + (tab[k * 3 + 1] - p[1]) ** 2 + (tab[k * 3 + 2] - p[2]) ** 2; if (d < best) { best = d; bj = k; } }
        j = bj; uAt.push(bj / N);
      }
    }
    await ctx.yield();
    const U_POOL = uAt[I_POOL], U_A0 = uAt[I_A0], U_HANG = uAt[I_HANG], U_TOP = uAt[I_TOP], U_PINS = uAt[I_PINS];
    const KNOTS = [[0, 0.4], [U_POOL, 14.4], [U_A0, 19.2], [U_HANG, 20.5], [U_TOP, 27.4], [U_PINS, 29.7], [1, 39.6]];
    const scoreAt = (u) => { for (let i = 1; i < KNOTS.length; i++) if (u <= KNOTS[i][0]) { const a = KNOTS[i - 1], b = KNOTS[i]; return lerp(a[1], b[1], (u - a[0]) / Math.max(1e-5, b[0] - a[0])); } return 39.6; };
    const uOfScore = (t) => { for (let i = 1; i < KNOTS.length; i++) if (t <= KNOTS[i][1]) { const a = KNOTS[i - 1], b = KNOTS[i]; return lerp(a[0], b[0], (t - a[1]) / (b[1] - a[1])); } return 1; };
    const duration = clamp(path.length / 14, 42, 50);

    // ---- string ends (from the hero's instanced ribbons) for bridges, felts, hitch pins and the tail plate
    const sg = hero.parts.strings.geometry, NS = sg.instanceCount / 2, iA = sg.attributes.iA, iB = sg.attributes.iB, iI = sg.attributes.iInfo;
    const ends = [];
    for (let i = 0; i < NS; i++) ends.push({ i, key: Math.round(iI.getX(i)), bass: iI.getZ(i) > 0.5, ax: iA.getX(i), ay: iA.getY(i), az: iA.getZ(i), bx: iB.getX(i), by: iB.getY(i), bz: iB.getZ(i) });
    const back = (e, d) => { const L = Math.hypot(e.bx - e.ax, e.bz - e.az); const t = 1 - d / L; return [lerp(e.ax, e.bx, t), lerp(e.ay, e.by, t), lerp(e.az, e.bz, t)]; };
    const zEnd = (x) => { let m = 30; for (const e of ends) if (Math.abs(e.bx - x) < 7 && e.bz > m) m = e.bz; return m; };

    const cSpr = new THREE.Color(PAL[4]), cCop = new THREE.Color(PAL[3]), cBrz = new THREE.Color(PAL[5]), cInd = new THREE.Color(PAL[1]), cLac = new THREE.Color(PAL[0]), cCri = new THREE.Color(PAL[6]);
    const bronze = cBrz.clone().multiplyScalar(0.8), lacq = cLac.clone().lerp(cInd, lookName === 'rehearsal' ? 0.06 : 0.15).multiplyScalar(lookName === 'rehearsal' ? 1.3 : 2), maple = cSpr.clone().lerp(cCop, 0.35).multiplyScalar(0.5), brass = cSpr.clone().lerp(cCop, 0.4).multiplyScalar(0.7);
    if (lookName === 'rehearsal') bronze.multiplyScalar(0.6).lerp(new THREE.Color(0.075, 0.075, 0.075), 0.45);
    const tone = (c, f = 0.05, a = 0.22) => (x, y, z) => c.clone().multiplyScalar(1 - a + a * (0.5 + 0.5 * ctx.noise.n2(x * f + y * f, z * f)));

    await ctx.yield();
    // soundboard: a varnished spruce plain with ruler-straight grain
    const bentPts = [[X_W, 14], [X_W, 52]];                   // the bentside, keyboard end to tail: [x, z]
    for (let k = 0; k <= 40; k++) { const z = lerp(BENT_Z0, Z_TAIL, k / 40); bentPts.push([bentX(z), z]); }
    const boardGeo = (() => {
      const pos = [];
      for (let k = 1; k < bentPts.length; k++) { const [x0, z0] = bentPts[k - 1], [x1, z1] = bentPts[k]; pos.push(-X_W, Y_SB, z0, x1, Y_SB, z1, x0, Y_SB, z0, -X_W, Y_SB, z0, -X_W, Y_SB, z1, x1, Y_SB, z1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return paint(g, cSpr.clone().multiplyScalar(0.5));
    })();
    const board = new THREE.Mesh(boardGeo, hallMaterial(S, { grain: 1, spec: 0.5, shin: 70, refl: 0.35 }));
    board.name = 'soundboard'; scene.add(board);

    // bronze: struts, tail plate, ribs; maple bridges; hitch pins
    const bz = [], lq = [], br = [];                         // bronze + maple | lacquer | bright brass trim
    const strutYc = (z) => lerp(53.5, STRUT_Y, smoothstep(STRUT_Z0, 14, z)) - (STRUT_Y - 47.5) * smoothstep(425, 480, z) + 1.5 * Math.sin(Math.PI * clamp(z / 430, 0, 1));
    const strutBot = (s, z) => strutYc(z) - 4.2 + 1.5 * Math.abs(Math.sin(Math.PI * (z - 30 - s * 9) / 46)) * smoothstep(14, 30, z) * (1 - smoothstep(410, 430, z));   // shallow arches between the ribs
    for (let s = 0; s < 5; s++) {
      const line = [], NSEG = 110;
      for (let k = 0; k <= NSEG; k++) { const z = lerp(STRUT_Z0, STRUT_Z1, k / NSEG); line.push([strutX(s, z), z]); }
      const ry = Math.atan2(STRUT_B[s] - STRUT_A[s], STRUT_Z1 - STRUT_Z0);
      bz.push(ibeam(line, (i) => strutBot(s, line[i][1]), (i) => strutYc(line[i][1]) + 4.5, bronze, tone(bronze, 0.04, 0.3)));
      await ctx.yield();
      const rv = [], cr = Math.cos(ry), sr = Math.sin(ry);
      for (let z = 22 + s * 3; z < 424; z += 6.5) for (const o of [-2.5, 2.5]) { rv.push([strutX(s, z) + o * cr, strutBot(s, z), z - o * sr]); rv.push([strutX(s, z) + o * cr, strutYc(z) + 4.5, z - o * sr, 0.3]); }
      for (let c = 0; c < rv.length; c += 64) { bz.push(bosses(rv.slice(c, c + 64), bronze.clone().multiplyScalar(1.25))); await ctx.yield(); }
      for (let z = 30 + s * 9; z < 420; z += 46) bz.push(gusset(strutX(s, z), strutBot(s, z) + 0.6, strutYc(z) + 3.9, z, ry, bronze.clone().multiplyScalar(0.8)));
      await ctx.yield();
      // a casting, not a slab: thin polished lines down both edges of both flanges, and lightening holes through the web
      for (const o of [-3.45, 3.45]) {
        const e = []; for (let k = 2; k <= NSEG - 6; k += 2) e.push([line[k][0] + o * cr, line[k][1] - o * sr]);
        br.push(loft(e, 0.2, (i) => strutYc(e[i][1]) + 4.32, (i) => strutYc(e[i][1]) + 4.68, brass.clone().multiplyScalar(1.2)));
        br.push(loft(e, 0.2, (i) => strutBot(s, e[i][1]) - 0.16, (i) => strutBot(s, e[i][1]) + 0.2, brass.clone().multiplyScalar(1.0)));
      }
      await ctx.yield();
      for (let z = 99 + s * 9; z < 410; z += 46) for (const sd of [0, 1]) {
        const x = strutX(s, z), y = (strutBot(s, z) + strutYc(z) + 4.5) / 2, k = sd ? -1.06 : 1.06, kr = sd ? -1.1 : 1.1;
        const d = new THREE.CircleGeometry(1, 18); d.scale(4.5, 1.45, 1); d.rotateY(Math.PI / 2 + ry + sd * Math.PI); d.translate(x + k * cr, y, z - k * sr); lq.push(paint(d, cLac.clone().multiplyScalar(0.4)));
        const t = new THREE.TorusGeometry(1, 0.07, 4, 18); t.scale(4.6, 1.55, 3.5); t.rotateY(Math.PI / 2 + ry + sd * Math.PI); t.translate(x + kr * cr, y, z - kr * sr); bz.push(paint(t, bronze.clone().multiplyScalar(1.5)));
      }
      bz.push(box(9, 5.5, 4.6, STRUT_A[s], 53.6, STRUT_Z0 - 1.6, bronze.clone().multiplyScalar(0.95)), box(10.5, 1.2, 6, STRUT_A[s], 50.6, STRUT_Z0 - 1.8, bronze.clone().multiplyScalar(1.1)));   // foot shoe over the agraffes
    }
    await ctx.yield();
    {
      const shp = new THREE.Shape(); shp.moveTo(-46, Z_TAIL); shp.lineTo(-46, zEnd(-40) - 12);
      for (let x = -40; x <= 140; x += 9) shp.lineTo(x, zEnd(x) - 10);
      shp.lineTo(152, 34); shp.lineTo(X_W - 1, 34);
      for (let k = 1; k < bentPts.length; k++) shp.lineTo(bentPts[k][0] - 1, bentPts[k][1] - (k === bentPts.length - 1 ? 0 : 0));
      shp.closePath();
      const holes = [[76, 255], [120, 160], [38, 305]];
      for (const [hx, hz] of holes) { const h = new THREE.Path(); h.absarc(hx, hz, 8, 0, Math.PI * 2, true); shp.holes.push(h); }
      const ex = new THREE.ExtrudeGeometry(shp, { depth: 4.8, bevelEnabled: false, curveSegments: 20 }); ex.rotateX(Math.PI / 2); ex.translate(0, 45.2, 0);
      bz.push(paint(ex, bronze, tone(bronze, 0.05, 0.25)));
      for (const [hx, hz] of holes) {
        const d = new THREE.CircleGeometry(8.4, 24); d.rotateX(-Math.PI / 2); d.translate(hx, 40.3, hz); bz.push(paint(d, cLac.clone().multiplyScalar(0.4)));
        const t = new THREE.TorusGeometry(8.1, 0.35, 5, 40); t.rotateX(Math.PI / 2); t.translate(hx, 45.3, hz); br.push(paint(t, brass.clone().multiplyScalar(1.5)));
      }
      for (const x of [-20, 30, 62, 98, 136, 156]) { const z0 = zEnd(x) - 6, len = bentZ(x + 4) - 4 - z0; bz.push(box(2.4, 1.3, len, x, 45.8, z0 + len / 2, bronze.clone().multiplyScalar(1.1))); }
      for (let i = 0; i < 40; i++) { const x = rG.range(-30, 150), z = rG.range(zEnd(x) + 6, Math.max(zEnd(x) + 7, bentZ(x + 6) - 6)); if (!holes.some((h) => Math.hypot(h[0] - x, h[1] - z) < 11)) bz.push(box(rG.range(1, 3.4), 0.6, rG.range(2.4, 3.4), x, 45.5, z, bronze.clone().multiplyScalar(1.15))); }
    }
    await ctx.yield();
    const seen = new Set(), one = ends.filter((e) => (seen.has(e.key) ? false : (seen.add(e.key), true)));
    const treb = one.filter((e) => !e.bass && e.key % 2 === 0), bass = one.filter((e) => e.bass && e.key % 2 === 0);
    const tb = treb.map((e) => back(e, 14)), bb = bass.map((e) => back(e, 24));
    bz.push(loft(tb.map((q) => [q[0], q[2]]), 2.6, () => Y_SB, () => 45.75, maple, tone(maple, 0.2, 0.3)));
    bz.push(loft(bb.map((q) => [q[0], q[2]]), 3.0, () => Y_SB, (i) => bb[i][1] - 0.55, maple, tone(maple, 0.2, 0.3)));
    await ctx.yield();
    bz.push(loft(bass.map((e) => [e.bx + 0.4, e.bz + 2.5]), 4.5, () => Y_SB, (i) => bass[i].by - 1.25, bronze, tone(bronze, 0.06, 0.25)));   // bass hitch shelf
    bz.push(bosses(ends.map((e) => [e.bx, e.by + 0.25, e.bz + 0.3]), brass, 0.5, 1.5));          // hitch pins
    await ctx.yield();
    // case rim and music desk in black lacquer
    lq.push(quad([-X_W, Y_SB, Z_TAIL], [0, 0, 14 - Z_TAIL], [0, LID_Y0 - Y_SB, 0], 8, 2, lacq));
    lq.push(quad([-X_W, 46, 14], [0, 0, Z_KEY - 14], [0, LID_Y0 - 46, 0], 2, 2, lacq));
    {                                                         // the bentside: the curved wing of the case, brass-capped, against the hall
      const wall = bentPts.map(([x, z], i) => [x + 1.6 + (i > 1 ? 0.4 : 0), z]);
      lq.push(loft(wall, 1.6, () => Y_SB - 3, () => Y_SB + 22, lacq));
      br.push(loft(wall, 1.5, () => Y_SB + 22, () => Y_SB + 23.3, brass.clone().multiplyScalar(2.0)));
      br.push(loft(bentPts.map(([x, z]) => [x - 0.1, z]), 0.3, () => Y_SB + 8.6, () => Y_SB + 9.4, brass.clone().multiplyScalar(1.3)));
      // the lid's open edge and its hinge line: thin warm lines that draw the outline overhead
      const yLid = (i) => LID_Y0 + LID_K * (bentPts[i][0] + X_W);
      br.push(loft([[X_W, Z_KEY], ...bentPts.slice(1)], 1.7, (i) => yLid(i) - 1.6, (i) => yLid(i) + 0.4, brass.clone().multiplyScalar(2.2)));
      br.push(box(1.6, 1.4, Z_TAIL - Z_KEY, -X_W + 1.2, LID_Y0 - 1.0, (Z_TAIL + Z_KEY) / 2, brass.clone().multiplyScalar(2.0)));
    }
    await ctx.yield();
    lq.push(quad([X_W, 46, Z_KEY], [0, 0, 14 - Z_KEY], [0, 16, 0], 2, 1, lacq));
    lq.push(quad([bentX(Z_TAIL) + 2, Y_SB, Z_TAIL], [-X_W - bentX(Z_TAIL) - 2, 0, 0], [0, 22, 0], 4, 1, lacq));
    lq.push(quad([-X_W, 44, Z_KEY], [2 * X_W, 0, 0], [0, 44, 0], 6, 2, lacq));
    lq.push(quad([-X_W, 88, Z_KEY], [2 * X_W, 0, 0], [0, 0, -190], 6, 3, lacq));                                                  // the shelf over the keys
    lq.push(quad([-110, 88, -168], [220, 0, 0], [0, 78, -26], 6, 3, lacq));                                                       // music desk
    await ctx.yield();
    for (let i = 0; i < 9; i++) lq.push(box(2.4, 70, 1.6, -96 + i * 24, 126, -178, lacq.clone().multiplyScalar(1.6), 0));
    for (let z = 40; z < Z_TAIL; z += 37.5) lq.push(box(1.4, LID_Y0 - Y_SB, 3.2, -X_W + 0.7, (LID_Y0 + Y_SB) / 2, z, lacq.clone().multiplyScalar(1.5)));    // pilasters on the hinge wall
    br.push(box(1.0, 1.6, Z_TAIL - 14, -X_W + 1.0, 62.4, (Z_TAIL + 14) / 2, brass.clone().multiplyScalar(2.0)));
    br.push(box(0.8, 1.6, Z_TAIL - 14, -X_W + 0.8, 86, (Z_TAIL + 14) / 2, brass.clone().multiplyScalar(2.0)));
    for (let z = 40; z < Z_TAIL; z += 37.5) br.push(box(0.5, LID_Y0 - Y_SB - 6, 0.8, -X_W + 1.5, (LID_Y0 + Y_SB) / 2, z, brass.clone().multiplyScalar(2.2)));   // brass inlay line on each pilaster
    br.push(box(2 * X_W, 0.9, 0.7, 0, 56, Z_KEY + 0.6, brass.clone().multiplyScalar(1.6)), box(2 * X_W, 0.7, 0.6, 0, 82, Z_KEY + 0.5, brass.clone().multiplyScalar(1.4)));     // rails on the wall behind the plate
    for (let i = 0; i < 12; i++) br.push(box(0.4, 26, 0.5, -150 + i * 27.3, 69, Z_KEY + 1.9, brass.clone().multiplyScalar(1.6)));
    for (let i = 0; i < 12; i++) lq.push(box(1.2, 30, 1.6, -150 + i * 27.3, 66, Z_KEY + 0.9, lacq.clone().multiplyScalar(1.5)));   // fretwork of the music desk
    br.push(box(2.2, 1.4, 14 - Z_KEY, X_W - 0.6, 62.4, (14 + Z_KEY) / 2, brass.clone().multiplyScalar(2.0)));
    br.push(box(X_W + bentX(Z_TAIL), 1.4, 2.2, (bentX(Z_TAIL) - X_W) / 2, 62.6, Z_TAIL - 0.6, brass.clone().multiplyScalar(2.0)));
    for (const z of [60, 250, 440]) br.push(box(3, 5, 26, -X_W + 1.5, LID_Y0 - 3, z, brass.clone().multiplyScalar(1.5)));                                      // lid hinges
    await ctx.yield();
    const bronzeMesh = new THREE.Mesh(mergeGeometries(bz), hallMaterial(S, { spec: 0.6, shin: 18, rim: 0.8, bounce: 1.3, specTint: '#b9a27a', metal: lookName === 'rehearsal' ? 0.5 : 0.85 })); bronzeMesh.name = 'struts-plate-bridges';
    await ctx.yield();
    const brassMesh = new THREE.Mesh(mergeGeometries(br), hallMaterial(S, { spec: 1.6, shin: 22, rim: 1.0, bounce: 1.3, specTint: '#ffd9a0', self: 0.22 })); brassMesh.name = 'brass-trim'; scene.add(brassMesh);
    br.forEach((g) => g.dispose());
    await ctx.yield();
    const lacMesh = new THREE.Mesh(mergeGeometries(lq), hallMaterial(S, { spec: 1.2, shin: 50, refl: lookName === 'rehearsal' ? 0.55 : 1, self: 0.05 })); lacMesh.name = 'case';
    scene.add(bronzeMesh, lacMesh);
    bz.forEach((g) => g.dispose()); lq.forEach((g) => g.dispose());
    await ctx.yield();

    await ctx.yield();
    // listing felt woven through the strings: crimson over the trebles and behind the agraffes, moss green over the bass
    const moss = new THREE.Color('#4c5d33').multiplyScalar(0.8), crim = cCri.clone().multiplyScalar(0.95), fl = [];
    const tf = treb.map((e) => back(e, 6)), bf = bass.map((e) => back(e, 11));
    { const k0 = treb.findIndex((e) => e.key >= 44); fl.push(loft(tf.slice(k0).map((q) => [q[0], q[2]]), 1.3, () => 45.2, () => 47.1, crim)); }
    fl.push(loft(bf.map((q) => [q[0], q[2]]), 1.5, (i) => bf[i][1] - 1.1, (i) => bf[i][1] + 1.0, moss));
    fl.push(loft([[-141, -20.4], [-100, -20.4], [-57, -20.4]], 1.0, () => 47.7, () => 49.5, moss));
    fl.push(loft([[-54, -20.4], [40, -20.4], [140, -20.4]], 1.0, () => 45.2, () => 46.9, crim));
    fl.push(loft([[-163, -78.8], [-60, -78.8], [40, -78.8], [163, -78.8]], 0.95, () => 44.6, () => 48.4, crim));        // listing felt along the wall behind the plate
    const feltMat = hallMaterial(S, { fuzz: 1, spec: 0, gain: 0.8 });
    const felt = new THREE.Mesh(mergeGeometries(fl), feltMat); felt.name = 'listing-felt'; scene.add(felt);
    fl.forEach((g) => g.dispose());
    await ctx.yield();
    // grey dust lying in drifts like lichen along the bridges, the canyon lip and the foot of the case
    {
      const rD = rng.fork('drift'), dl = [], edge = new THREE.Color(0.42, 0.33, 0.18), grey = new THREE.Color(0.45, 0.36, 0.2);
      const spots = [];
      for (let i = 0; i < 16; i++) { const q = tb[Math.floor(rD() * tb.length)]; spots.push([q[0] + rD.range(-3, 3), q[2] + rD.range(4, 9) * (rD() < 0.5 ? -1 : 1)]); }
      for (let i = 0; i < 12; i++) { const q = bb[Math.floor(rD() * bb.length)]; spots.push([q[0] + rD.range(-3, 3), q[2] + rD.range(5, 10) * (rD() < 0.5 ? -1 : 1)]); }
      for (let i = 0; i < 24; i++) spots.push([i < 12 ? rD.range(-160, -90) : rD.range(-90, 140), rD.range(17, 28)]);
      for (const [cx, cz] of spots) {
        const R = rD.range(1.1, 2.6), el = rD.range(2.5, 5), ph = rD() * 6.28, n = 16, pos = [], col = [], al = [];
        const rim = []; for (let k = 0; k < n; k++) { const a = k / n * 6.2832, r = R * (0.7 + 0.2 * Math.sin(a * 3 + ph) + 0.14 * Math.sin(a * 5 + ph * 2.3)); rim.push([cx + Math.cos(a) * r * 0.5, cz + Math.sin(a) * r * el * 0.5]); }
        for (let k = 0; k < n; k++) { const a = rim[k], b = rim[(k + 1) % n];
          const ai = [lerp(cx, a[0], 0.55), lerp(cz, a[1], 0.55)], bi = [lerp(cx, b[0], 0.55), lerp(cz, b[1], 0.55)];
          pos.push(cx, 0, cz, bi[0], 0, bi[1], ai[0], 0, ai[1], ai[0], 0, ai[1], bi[0], 0, bi[1], b[0], 0, b[1], ai[0], 0, ai[1], b[0], 0, b[1], a[0], 0, a[1]);
          for (const c of [grey, grey, grey, grey, grey, edge, grey, edge, edge]) { col.push(c.r, c.g, c.b); al.push(c === edge ? 0 : 1); } }
        al[0] = 1; for (let q = 0; q < al.length; q += 9) al[q] = 1;
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.translate(0, Y_SB + 0.12, 0); g.computeVertexNormals();
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aAlpha', new THREE.Float32BufferAttribute(al, 1)); dl.push(g);
      }
      const dm = hallMaterial(S, { spec: 0, gain: 1.0, soft: 1 }); dm.polygonOffset = true; dm.polygonOffsetFactor = -2; dm.polygonOffsetUnits = -4;
      const drifts = new THREE.Mesh(mergeGeometries(dl), dm); drifts.name = 'dust-drifts'; scene.add(drifts);
      dl.forEach((g) => g.dispose());
    }

    await ctx.yield();
    // ---- the lid overhead and the inverted twin of the string field in it
    const lidGeo = new THREE.BufferGeometry();
    const yL = LID_Y0, yR = LID_Y0 + LID_K * 2 * X_W;
    lidGeo.setAttribute('position', new THREE.Float32BufferAttribute([-X_W, yL, Z_KEY, X_W, yR, Z_KEY, X_W, yR, Z_TAIL + 10, -X_W, yL, Z_KEY, X_W, yR, Z_TAIL + 10, -X_W, yL, Z_TAIL + 10], 3));
    const lid = new THREE.Mesh(lidGeo, lidMaterial(S, look)); lid.name = 'lid'; lid.renderOrder = -2; lid.frustumCulled = false; scene.add(lid);
    const mirror = new THREE.Mesh(sg, mirrorStringMaterial(S, look)); mirror.name = 'lid-twin'; mirror.frustumCulled = false; mirror.renderOrder = 1;
    {
      const n = new THREE.Vector3(LID_K, -1, 0).normalize(), d = -n.dot(new THREE.Vector3(-X_W, LID_Y0, 0));
      mirror.matrixAutoUpdate = false;
      mirror.matrix.set(1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, -2 * d * n.x, -2 * n.x * n.y, 1 - 2 * n.y * n.y, -2 * n.y * n.z, -2 * d * n.y, -2 * n.x * n.z, -2 * n.y * n.z, 1 - 2 * n.z * n.z, -2 * d * n.z, 0, 0, 0, 1);
    }
    scene.add(mirror);
    await ctx.yield();

    // ---- light shafts, dust, glows
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const rayPos = poolC.clone().addScaledVector(keyDir, 300);
    if (look.rays[1] > 0.01) set.add(fx.makeGodRays({ rng: rng.fork('rays'), time, position: rayPos.toArray(), direction: keyDir.clone().negate().toArray(), radius: look.rayR ?? Math.min(look.pool[3], 120) * 0.7,
      count: 24, length: 335, width: [8, 22], color: look.rays[0], intensity: look.rays[1] * 1.2, speed: 0.6, falloff: 0.4, fogAmount: 0.3 }));
    set.add(fx.makeGodRays({ rng: rng.fork('wellrays'), time, position: [portalP.x - 4, portalP.y + 104, portalP.z + 3], direction: [0.04, -1, -0.03], radius: 7,
      count: 7, length: 108, width: [5, 11], color: look.rays[0], intensity: Math.max(look.rays[1], 0.1) * 1.2, speed: 0.8, falloff: 0.8, fogAmount: 0.6, near: [1.5, 6] }));   // thins as the dive nears it: no veil over the plate
    const motes = set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(600 * density * detail), box: [46, 28, 46],
      velocity: [0.15, 0.5, -0.1], colors: [PAL[2], PAL[4], PAL[3]], size: [0.16, 0.5], intensity: 0.4, minAngle: 0.0012 }));
    let rosin = null;
    if (cast === 'rosin') rosin = set.add(fx.makeParticles({ rng: rng.fork('rosin'), preset: 'dust', time, count: Math.round(2200 * density * detail), box: [70, 44, 70], minAngle: 0.0014,
      velocity: [0.2, -0.9, 0.1], colors: ['#e8c98a', '#f4e2b8', '#c47a3a'], size: [0.08, 0.24], intensity: 1.3 }));
    const fishN = 2, fish = [];
    const glows = set.add(fx.makeGlows({ rng: rng.fork('glows'), time, positions: [[14, 120, -150], [0, 41, 100], [0, 41, 200], [0, -200, 0]], colors: ['#ffc88a', '#dfe8ff', '#dfe8ff', new THREE.Color('#f3e6c4').multiplyScalar(0.2)],
      size: 1, sizes: [lookName === 'moon' ? 22 : 34, 2.6, 2.6, 6.5], intensity: lookName === 'moon' ? 0.7 : 1.5, fogAmount: 0.5 }));
    // two silverfish slipping along the grain
    {
      const g = new THREE.SphereGeometry(1, 8, 6); g.scale(0.34, 0.2, 1.5);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setX(i, p.getX(i) * (z < 0 ? 1.25 : 0.6 + 0.4 * (1 - z / 1.5))); }
      const fg = paint(g, new THREE.Color(PAL[2]).multiplyScalar(0.6)), fm = hallMaterial(S, { spec: 3, shin: 40 });
      for (let i = 0; i < fishN; i++) {
        const m = new THREE.Mesh(fg, fm); scene.add(m);
        fish.push({ m, x: i ? rG.range(20, 70) : rG.range(-136, -122), z0: i ? 170 : 70, span: i ? 150 : 120, sp: rG.range(5, 8), ph: rG.range(0, 100) });
      }
    }
    await ctx.yield();
    const hall = makeHallLights(rng.fork('hall'), look, detail); scene.add(hall.object);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({
      uniforms: { uFogCol: { value: look.fog.clone() }, uHall: { value: new THREE.Color(look.hall) }, uTime: HU.uTime,
        uLamp: { value: new THREE.Vector3(look.lamps[0].az, look.lamps[0].el, look.lamps[0].spread) }, uLampCol: { value: new THREE.Color(look.lamps[0].color).multiplyScalar(look.lamps[0].soft ? 0.07 : 0) } }, side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec3 uFogCol, uHall, uLamp, uLampCol; uniform float uTime; varying vec3 vD;
        void main(){
          vec3 d = normalize(vD); float el = asin(clamp(d.y, -1.0, 1.0)), az = atan(d.z, abs(d.x) + 1e-4);
          float side = smoothstep(-0.15, 0.5, d.x);
          vec3 col = uFogCol * (1.0 - 0.45 * smoothstep(0.1, 0.9, d.y));
          float e1 = (el - 0.1) / 0.2, e2 = (el - 0.34) / 0.08, a2 = (az - 0.18) / 0.3;
          col += uHall * side * (0.22 * exp(-e1 * e1) + 0.1 * exp(-e2 * e2 - a2 * a2));
          float tiers = 0.0;
          for (int i = 0; i < 3; i++) { float e0 = 0.022 + 0.05 * float(i) + 0.03 * az * az; tiers += (1.0 - smoothstep(0.0, 0.012, abs(el - e0))) * (0.6 + 0.4 * sin(az * 40.0 + float(i))); }
          col += uHall * side * tiers * 0.1 * (0.9 + 0.1 * sin(uTime * 0.5));
          float le = (el - uLamp.y) / 0.2, la = (az - uLamp.x) / (0.25 + uLamp.z);
          col += uLampCol * side * exp(-le * le - la * la);                                  // the work-lights' glow in the haze
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    dome.renderOrder = -5; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();

    // ---- moths
    const moths = [];
    if (cast === 'one' || cast === 'two') moths.push({ kind: 'fly', ...makeMoth(S, rM) });
    if (cast === 'two') moths.push({ kind: 'perch', ...makeMoth(S, rM) });
    moths.forEach((m) => scene.add(m.object));
    // the flying moth circles in the shaft between struts 1 and 0, 15 m off the route as the camera climbs past it, then moves
    // to a slow figure of eight over the far rim of the exit porthole, lit by the well, so the dive looks down on its open wings
    const mothC0 = new THREE.Vector3(-67 + rM.range(-1, 1), 74, 150 + rM.range(-6, 6)), mothC1 = new THREE.Vector3(portalP.x + 8.5, portalP.y + 6, portalP.z);
    const perchZ = 150 + rM.range(-10, 10), perchP = new THREE.Vector3(strutX(0, perchZ), strutBot(0, perchZ) - 1.0, perchZ), perchDir = new THREE.Vector3(STRUT_A[0] - STRUT_B[0], 0, STRUT_Z0 - STRUT_Z1).normalize();   // hanging under strut 0
    const mothPos = mothC0.clone(), mothDir = new THREE.Vector3(0, 0, -1), _c = new THREE.Vector3();
    await ctx.yield();
    // dust spiralling down into the lit porthole
    {
      const n = Math.round(420 * detail), P = new Float32Array(n * 3), D = new Float32Array(n * 4), rS = rng.fork('spiral');
      for (let i = 0; i < n * 4; i++) D[i] = rS();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.BufferAttribute(D, 4));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: HU.uTime, uPtScale: HU.uPtScale, uO: S.uPortal, uCol: S.uPortalCol }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec4 aD; uniform float uTime, uPtScale; uniform vec3 uO; varying float vA;
          void main(){
            float c = fract(aD.x + uTime * 0.05 * (0.6 + aD.w));
            float r = mix(4.0 + 13.0 * aD.y, 0.8, c * c), an = aD.z * 6.2832 + c * (7.0 + 5.0 * aD.w) + uTime * 0.2;
            vec3 p = uO + vec3(r * cos(an), mix(3.0 + 30.0 * aD.z * aD.y, -1.5, c * sqrt(c)), r * sin(an));
            vA = smoothstep(0.0, 0.12, c) * (1.0 - smoothstep(0.93, 1.0, c)) * (0.5 + 0.5 * sin(uTime * 5.0 + aD.x * 90.0)) * (0.4 + 0.6 * c);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp((0.2 + 0.26 * aD.w) * uPtScale / max(-mv.z, 0.1), 1.5, 7.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying float vA;
          void main(){ float d = length(gl_PointCoord * 2.0 - 1.0); gl_FragColor = vec4(uCol * 2.0 * vA * exp(-d * d * 4.0), 1.0); }`,
      });
      const sp = new THREE.Points(g, mat); sp.name = 'porthole-dust'; sp.frustumCulled = false; sp.renderOrder = 4; scene.add(sp);
    }
    await ctx.yield();
    // the shaft that pours from the lid opening straight down into the open porthole: one soft column of lit haze, 16 m wide
    // at the plate, standing 120 m tall so it is seen over the pin block from the canyon climb onward
    {
      const H = 122, g = new THREE.CylinderGeometry(11.5, 8.0, H, 40, 1, true); g.translate(portalP.x, portalP.y + H / 2 - 1, portalP.z);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: HU.uTime, uPedal: HU.uPedal, uCol: { value: new THREE.Color(look.rays[0]).multiplyScalar(0.09 + 0.3 * look.rays[1]) }, uFogD: { value: look.fogD }, uY0: { value: portalP.y - 1 }, uH: { value: H }, uAx: { value: new THREE.Vector2(portalP.x, portalP.z) } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec3 vW, vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: /* glsl */`
          uniform vec3 uCol; uniform vec2 uAx; uniform float uTime, uPedal, uFogD, uY0, uH; varying vec3 vW, vN;
          ${NOISE}
          void main(){
            vec3 D = cameraPosition - vW; float d = max(length(D), 1e-3); vec3 N = normalize(vN);
            float ndv = abs(dot(N, D / d)), body = ndv * ndv * ndv;                             // a column of haze, not a tube: the limbs fade out
            float h = clamp((vW.y - uY0) / uH, 0.0, 1.0);
            float st = 0.5 + 0.5 * wNoise(vec3(N.x * 3.2, vW.y * 0.016 - uTime * 0.05, N.z * 3.2 + uTime * 0.03));
            st *= 0.62 + 0.38 * wNoise(vec3(N.x * 9.0 + 4.0, vW.y * 0.05 + uTime * 0.09, N.z * 9.0));
            float k = smoothstep(0.0, 0.03, h) * (1.0 - smoothstep(0.6, 1.0, h)) * mix(1.25, 0.5, h) * smoothstep(7.0, 30.0, d) * smoothstep(8.0, 36.0, length(cameraPosition.xz - uAx)) * exp(-(d * uFogD) * (d * uFogD));
            gl_FragColor = vec4(uCol * body * st * k * (1.0 + 0.5 * uPedal), 1.0);
          }`,
      });
      const cone = new THREE.Mesh(g, mat); cone.name = 'porthole-shaft'; cone.frustumCulled = false; cone.renderOrder = 3; scene.add(cone);
    }
    // scales shed by the flying moth on each loud chord
    let scales = null;
    if (moths.length) {
      const n = 200, P = new Float32Array(n * 3), D = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const a = rM() * 6.28, e = rM.range(-0.6, 0.9), r = rM.range(1, 5); D.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r, rM()], i * 4); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.BufferAttribute(D, 4));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uAge: { value: 99 }, uO: { value: new THREE.Vector3() }, uTime: HU.uTime, uPtScale: HU.uPtScale, uCol: { value: new THREE.Color(PAL[2]) } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec4 aD; uniform float uAge, uTime, uPtScale; uniform vec3 uO; varying float vA;
          void main(){
            float a = max(uAge, 0.0);
            vec3 p = uO + aD.xyz * (1.0 - exp(-a * 1.6)) * 2.2 + vec3(0.0, -0.9 * a - 0.12 * a * a, 0.0) + 0.5 * vec3(sin(uTime * 1.3 + aD.w * 40.0), 0.0, cos(uTime * 1.1 + aD.w * 23.0));
            vA = step(0.001, uAge) * smoothstep(0.0, 0.2, a) * (1.0 - smoothstep(3.0, 7.0, a)) * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 9.0 + aD.w * 80.0), 4.0));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(0.14 * uPtScale / max(-mv.z, 0.1), 1.5, 7.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying float vA;
          void main(){ float d = length(gl_PointCoord * 2.0 - 1.0); gl_FragColor = vec4(uCol * 1.2 * vA * exp(-d * d * 4.0), 1.0); }`,
      });
      scales = new THREE.Points(g, mat); scales.frustumCulled = false; scales.renderOrder = 4; scene.add(scales);
    }

    await ctx.yield();
    // ---- rare event: a bass string snaps mid-chord and whips back up the hall
    let snap = null;
    if (rare) {
      // key 4's string parts 55 m ahead of the lens; the tail-side piece (anchored at its hitch pin) recoils past the camera
      // toward the tail in a damped coil and lies slack; the keyboard-side stub is simply gone: a dark gap in the ribbon field
      const e = ends.find((q) => q.key === 4), T_SNAP = 10.32, u0 = uOfScore(T_SNAP);
      const cz = path.pointAt(u0).z - 55, tb = clamp((cz - e.az) / (e.bz - e.az), 0.15, 0.8);
      const Av = new THREE.Vector3(e.ax, e.ay, e.az), Bv = new THREE.Vector3(e.bx, e.by, e.bz), dirS = Bv.clone().sub(Av), len = dirS.length(); dirS.normalize();
      const side = new THREE.Vector3(dirS.z, 0, -dirS.x).normalize();
      const N = 96, wg = new THREE.BufferGeometry(), wp = new Float32Array((N + 1) * 6), sv = new Float32Array((N + 1) * 4), idx = [];
      for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      for (let i = 0; i <= N; i++) sv.set([i / N, -1, i / N, 1], i * 4);
      wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setAttribute('aSV', new THREE.BufferAttribute(sv, 2)); wg.setIndex(idx);
      const whipMat = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uKeyCol: HU.uKeyCol, uFillCol: HU.uFillCol, uAmbCol: HU.uAmbCol, uCopper: hero.parts.strings.material.uniforms.uCopper,
          uLen: { value: (1 - tb) * len }, uGlint: { value: 0 } }, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec2 aSV; varying vec2 vSV;
          void main(){ vSV = aSV; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uKeyCol, uFillCol, uAmbCol, uCopper; uniform float uLen, uGlint; varying vec2 vSV;
          void main(){
            float sl = vSV.x * uLen / 0.6, fs = fwidth(sl), nx = clamp(vSV.y, -1.0, 1.0), cyl = sqrt(max(1.0 - nx * nx, 0.0)), hx = (nx - 0.35) / 0.13;
            vec3 base = uCopper * 0.5 * mix(0.5 + 0.5 * (0.5 + 0.5 * sin(6.2832 * sl)), 0.76, clamp(fs * 2.5, 0.0, 1.0));      // the copper winding
            vec3 col = base * (uAmbCol * 1.2 + uKeyCol * 0.6 * cyl + uFillCol * 0.9 * (0.5 - 0.5 * nx)) + uKeyCol * exp(-hx * hx) * (0.3 + 3.0 * uGlint) + uCopper * uGlint * 1.5 * cyl;
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      });
      const whip = new THREE.Mesh(wg, whipMat);
      whip.frustumCulled = false; scene.add(whip);                // always drawn (so its shader compiles with the world); collapsed to a point until the string snaps
      const nd = Math.round(4000 * detail), dp = new Float32Array(nd * 3), dd = new Float32Array(nd * 3);
      for (let i = 0; i < nd; i++) { const t = rG(); dp.set([lerp(e.ax, e.bx, t) + rG.range(-1, 1), lerp(e.ay, e.by, t), lerp(e.az, e.bz, t)], i * 3); dd.set([Math.abs(t - tb) * len / 150, rG(), rG()], i * 3); }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('aD', new THREE.BufferAttribute(dd, 3));
      const dm = new THREE.ShaderMaterial({
        uniforms: { uTau: { value: -1 }, uTime: HU.uTime, uPtScale: HU.uPtScale, uCol: { value: new THREE.Color(PAL[2]) } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec3 aD; uniform float uTau, uTime, uPtScale; varying float vA;
          void main(){
            float a = max(uTau - aD.x, 0.0);
            vec3 p = position; p.y += (2.0 + 14.0 * aD.y * aD.y) * (1.0 - exp(-a * 2.2)) - 0.5 * a;
            p.x += (aD.z - 0.5) * 5.0 * (1.0 - exp(-a)) + 0.4 * sin(uTime * 0.7 + aD.y * 60.0);
            vA = step(0.001, uTau - aD.x) * smoothstep(0.0, 0.2, a) * (1.0 - smoothstep(3.0, 9.0, a)) * (0.4 + 0.6 * aD.z);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp((0.25 + 0.35 * aD.z) * uPtScale / max(-mv.z, 0.1), 1.5, 10.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying float vA;
          void main(){ float d = length(gl_PointCoord * 2.0 - 1.0); gl_FragColor = vec4(uCol * 0.35 * vA * exp(-d * d * 4.0), 1.0); }`,
      });
      const wall = new THREE.Points(dg, dm); wall.frustumCulled = false; wall.renderOrder = 4; scene.add(wall);
      snap = { e, T_SNAP, tb, Av, Bv, dirS, len, side, N, wp, wg, whip, whipMat, dm, broken: false, shown: false };
    }
    await ctx.yield();

    // ---- per-frame
    const envData = hero.envTexture.image.data, pedalTimes = hero.pedalTimes || [15, 30];
    const strU = hero.parts.strings.material.uniforms, glow0 = strU.uGlow.value;
    const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _s = new THREE.Vector3(), _cam = new THREE.Vector3(), _dn = new THREE.Vector3(0, -1, 0);
    let scaleKey = -1, stall = 0, lastU = -1, lastT = 0;
    // centre line of the recoiling string at s (0 hitch pin .. 1 free end)
    const whipAt = (s, tau, out) => {
      const k = smoothstep(0, 2.6, tau), ext = (1 - snap.tb) * snap.len * (1 - 0.7 * k);
      const grow = (1 - Math.exp(-tau * 5)) * Math.exp(-tau * 0.5), ph = s * (9 + 12 * k) + 17.5 * (1 - Math.exp(-tau * 0.4)), r = 4.4 * s * s * grow;
      const rest = smoothstep(2, 6, tau), lift = 3.6 * Math.sin(Math.min(tau, 2) / 2 * Math.PI);
      out.copy(snap.Bv).addScaledVector(snap.dirS, -ext * s).addScaledVector(snap.side, r * Math.cos(ph) + 1.3 * s * rest * Math.sin(s * 8.0 + 1.0));
      out.y = lerp(out.y + r * Math.sin(ph) + s * s * lift, lerp(snap.e.by, 46.9, smoothstep(0, 0.12, s)), rest * smoothstep(0, 0.1, s));
      return out;
    };
    function update(dt, t, camera, u = 0) {
      time.value = t;
      camera.getWorldPosition(_cam);
      // score time: keyed to progress. While the world is only seen through a portal it loops slowly; if the flight is
      // held still (u unchanged while the clock runs) the music keeps playing in a short loop instead of freezing
      const live = smoothstep(0, 0.02, u);
      if (u === lastU && u > 0.004) stall = (stall + Math.max(0, Math.min(2, t - lastT))) % 2.4; else stall = 0;
      lastU = u; lastT = t;
      // seen through the previous portal (u = 0) the opening chord sounds again every 2.6 s, its ribbons half as bright again
      const pv = t % 2.6, pvK = smoothstep(0.0, 0.25, pv) * (1 - smoothstep(2.2, 2.58, pv));
      const sT = Math.max(0.05, lerp(0.3 + pv, scoreAt(u) + stall, live));
      strU.uGlow.value = glow0 * lerp(1.5 * pvK, 1, live);
      hero.setProgress(sT / 40);
      hero.update(dt, t, camera);
      let bassAmp = 0; for (let k = 0; k < 26; k++) bassAmp += envData[k * 4 + 1];
      feltMat.uniforms.uTremble.value = Math.min(1, bassAmp * 0.35 + HU.uPedal.value * 0.5);
      hall.object.position.copy(_cam); dome.position.copy(_cam); hall.uniforms.uTime.value = t; hall.uniforms.uPtScale.value = HU.uPtScale.value;
      glows.setPosition(0, 14 + 3.2 * Math.sin(t * 1.2566), 120 + 0.5 * Math.cos(t * 2.513), -150);
      HU.uLampP.value.set(14 + 3.2 * Math.sin(t * 1.2566), 120 + 0.5 * Math.cos(t * 2.513), -150);
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i], p = t * f.sp / f.span + f.ph, c = Math.floor(p * 5), q = (c + smoothstep(0.15, 0.7, p * 5 - c)) / 5;
        const tri = Math.abs((q % 2) - 1), fwd = (q % 2) < 1 ? -1 : 1, z = f.z0 + f.span * tri, x = f.x + 0.35 * Math.sin(t * 2.1 + i);
        f.m.position.set(x, 40.22, z); f.m.rotation.y = (fwd > 0 ? 0 : Math.PI) + 0.16 * Math.sin(t * 13 + i * 2);
        glows.setPosition(i + 1, x, 40.9, z);
      }
      set.update(dt, t, camera);
      // moths: startle on the two pedal chords
      let st = 0, sAge = -1, sKey = -1;
      for (let i = 0; i < pedalTimes.length; i++) { const s = sT - pedalTimes[i]; st = Math.max(st, smoothstep(0, 0.3, s) * (1 - smoothstep(1.4, 3.6, s))); if (s > 0 && s < 8) { sAge = s; sKey = i; } }
      for (const m of moths) {
        if (m.kind === 'fly') {
          const su = smoothstep(U_TOP - 0.03, U_PINS + 0.04, u), a = t * 0.4 + m.phase, k = 1 - su;
          _c.copy(mothC0).lerp(mothC1, su);
          mothPos.set(_c.x + lerp(10 * Math.cos(a), 3 * Math.sin(2 * a), su), _c.y + 2 * Math.sin(a * 0.7) * k, _c.z + lerp(10, 7, su) * Math.sin(a));
          mothPos.x += st * 2.2 * Math.sin(t * 9.1) * k; mothPos.y += (st * 1.6 * Math.sin(t * 12.3 + 1) + 0.5 * Math.sin(t * 5.2)) * (0.3 + 0.7 * k); mothPos.z += st * 2.2 * Math.cos(t * 7.7) * k;
          mothDir.set(lerp(-10 * Math.sin(a), 6 * Math.cos(2 * a), su), (0.2 * Math.cos(a * 0.7) + st * 0.4 * Math.sin(t * 11)) * k * 8, lerp(10, 7, su) * Math.cos(a)).normalize();
          // quick beats in the hall; over the porthole a slow open-winged glide (1.5 Hz, shallow) so the wing plan faces the dive
          m.set(mothPos, mothDir, lerp(0.2, 0.35, su) + 0.85 * k * Math.sin(t * 6.2832 * 3.1 * (1 + 0.8 * st)) + 0.25 * su * Math.sin(t * 6.2832 * 1.5));
          m.mat.uniforms.uSelfLit.value = lerp(0.14, 0.42, su);
          glows.setSize(3, lerp(6.5, 4.5, su));
          glows.setPosition(3, mothPos.x, mothPos.y + 0.4, mothPos.z);
        } else {
          _p.copy(perchP); _p.y -= st * 0.5 * Math.abs(Math.sin(t * 15));
          m.set(_p, perchDir, 0.75 - 0.7 * (0.5 + 0.5 * Math.sin(t * 6.2832 + m.phase)) + st * 0.25 * Math.sin(t * 40), _dn);
        }
      }
      if (scales) {
        const su = scales.material.uniforms;
        if (sAge > 0 && (sAge < 0.25 || scaleKey !== sKey)) { su.uO.value.copy(mothPos); scaleKey = sKey; }
        su.uAge.value = sAge;
      }
      if (snap) {
        const tau = sT - snap.T_SNAP, on = u > 0.004 && tau >= 0, e = snap.e;
        if (on !== snap.broken) {
          snap.broken = on;
          if (on) iB.setXYZ(e.i, e.ax + snap.dirS.x * 0.05, e.ay, e.az + snap.dirS.z * 0.05); else iB.setXYZ(e.i, e.bx, e.by, e.bz);
          iB.needsUpdate = true;
        }
        if (!on && snap.shown) { snap.wp.fill(0); snap.wg.attributes.position.needsUpdate = true; }
        snap.shown = on; snap.dm.uniforms.uTau.value = on ? tau : -1;
        if (on) {
          const N = snap.N, wp = snap.wp;
          snap.whipMat.uniforms.uGlint.value = smoothstep(0, 0.04, tau) * ((1 - smoothstep(0.08, 0.3, tau)) + 0.22 * Math.exp(-tau * 1.1));
          for (let j = 0; j <= N; j++) {
            const s = j / N; whipAt(s, tau, _p); whipAt(Math.min(1, s + 1 / N), tau, _t);
            _t.sub(_p); if (j === N) _t.copy(snap.dirS).negate();
            const hw = 0.55 * (1 - smoothstep(0.7, 1, s));                                     // tapers to nothing at the free end
            _s.copy(_cam).sub(_p).cross(_t); const l = _s.length(); _s.multiplyScalar(hw / Math.max(l, 1e-4));
            wp[j * 6] = _p.x - _s.x; wp[j * 6 + 1] = _p.y - _s.y; wp[j * 6 + 2] = _p.z - _s.z; wp[j * 6 + 3] = _p.x + _s.x; wp[j * 6 + 4] = _p.y + _s.y; wp[j * 6 + 5] = _p.z + _s.z;
          }
          snap.wg.attributes.position.needsUpdate = true;
        }
      }
    }

    const names = { spot: 'Hall of Strings', rehearsal: 'Hall of Strings: Rehearsal', moon: 'Hall of Strings by Moonlight' };
    return {
      scene, path, duration,
      // quick up the hall, long in the canyon while the rank plays, unhurried to the porthole
      pace: (u) => lerp(lerp(1.4, 0.72, smoothstep(U_A0 - 0.1, U_A0 + 0.02, u)), 0.95, smoothstep(U_TOP - 0.06, U_TOP, u)),
      title: names[lookName],
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.8, bank: 0.25 },
      pois: [
        { at: [-70, 46, 215], from: 0, to: uAt[2] + 0.02, weight: 0.6, fade: 0.3 },             // the opening: down over the whole fan and the pool of the shaft
        { at: [-72, 47, 172], from: uAt[2] - 0.03, to: uAt[4] + 0.01, weight: 0.8, fade: 0.3 },     // skimming the bass strings: eyes on the ribbons and the pool ahead
        { at: [-98, 44, 4], from: uAt[4] - 0.04, to: U_A0 - 0.02, weight: 0.7, fade: 0.3 },   // the damper rank, the slot and the hammer line from above
        { at: A.canyonLook.clone().add(new THREE.Vector3(0, 4, 12)), from: U_A0 - 0.07, to: U_TOP + 0.02, weight: 0.96, fade: 0.2 },
        { at: A.portalSeat.position, from: U_TOP - 0.12, to: 1, weight: 0.9, fade: 0.3 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.5, tilt: true, revealDistance: 260 },
      post: { exposure: look.exposure, bloom: { strength: 0.65, radius: 0.6, threshold: 0.9 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadow, vignette: 0.34, grain: 0.03, aberration: 0 } },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
