// THE GLOWWOOD: a night flight down a glowing stream through a bioluminescent forest to the Mother-Tree.
//
// Layout (world space, metres): the Mother-Tree (src/parts/glowwood.js) stands at the origin, front = +Z, the
// moon low behind it on -Z. The camera enters at z = 640 above the stream, passes under two root arches
// (z ~ 520 / 496), leaves the stream where the six-legged grazers drink (z ~ 392, 30 m to the left), swings
// right, then turns onto the tree's axis at z ~ 290 (the reveal) and flies the hero's `flyThrough` line through
// the parted filament curtain to the portal in the root cleft.
//
// Light: one weak directional + one hemisphere (the moon rig). Everything else is emissive. Every glowing
// plant, root vein, tendril and the stream share one "ripple" (GW_GLSL): a wave that leaves the Mother-Tree
// when its pulse reaches the crown and runs outward at 60 m/s, plus a boost near the camera.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as SKY from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as W from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/glowwood.js';

const TAU = Math.PI * 2;
const PALETTE = ['#02040c', '#0b1238', '#2a1458', '#7a4dff', '#ff4fd8', '#19e6c8', '#e8ff7a'];
const U_REVEAL = 0.58, DURATION = 46;

// ---------------------------------------------------------------- the shared ripple
const GW_GLSL = /* glsl */`
uniform vec4 uGwO;    // tree x, tree z, seconds since the pulse left the crown, period
uniform vec3 uGwCam;  // camera position
uniform vec3 uGwK;    // resting level, ripple gain, proximity gain
float gwRipple(vec3 wp){
  float d = length(wp.xz - uGwO.xy);
  float t = mod(uGwO.z - d / 60.0 + uGwO.w * 0.12, uGwO.w) - uGwO.w * 0.12;
  float w = t < 0.0 ? exp(-t * t * 30.0) : exp(-t * 1.25);
  float nr = 1.0 - smoothstep(7.0, 44.0, distance(wp, uGwCam));
  return uGwK.x + uGwK.y * w + uGwK.z * nr * nr;
}
`;
const gwUniforms = (G, k) => ({ uGwO: G.uGwO, uGwCam: G.uGwCam, uGwK: { value: new THREE.Vector3(k[0], k[1], k[2]) } });

// makes a flora windMaterial's emissive follow the ripple (falls back to the plain glow if the kit shader changes)
function patchGlow(mat, G, k) {
  const U = gwUniforms(G, k), prev = mat.onBeforeCompile, key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : 'flora';
  mat.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(mat, shader, renderer);
    const hook = 'vec3 fE = vColor.rgb * (abs(vFlora.y) * uFloraGlow);';
    if (shader.fragmentShader.includes(hook) && shader.fragmentShader.includes('vFloraWorld')) {
      Object.assign(shader.uniforms, U);
      // Clamped: with antialiasing a sample on a triangle thinner than a pixel (the gill wedges that meet at a mushroom's stem) reads
      // its colour and glow far outside what the vertices hold, and that one sample, hundreds of times too bright, was spread into a
      // glowing square by the bloom. Colour x tint stays under 2 and |glow| under 4 on every plant here, so nothing in range changes.
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + GW_GLSL)
        .replace(hook, 'vec3 fE = clamp(vColor.rgb, 0.0, 2.0) * (min(abs(vFlora.y), 4.0) * uFloraGlow) * gwRipple(vFloraWorld);');
    }
  };
  mat.customProgramCacheKey = () => key + '-gw';
  return mat;
}

// ---------------------------------------------------------------- roots: swept tubes, self-lit shader
function makeAcc() { return { pos: [], nor: [], uv: [], idx: [] }; }
function sweep(acc, pts, radAt, radial, seed) {
  const n = pts.length, base = acc.pos.length / 3;
  const Tn = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), pT = new THREE.Vector3(), ax = new THREE.Vector3(), q = new THREE.Vector3();
  let v = 0;
  for (let i = 0; i < n; i++) {
    Tn.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    if (i === 0) { N.set(0, 1, 0); if (Math.abs(Tn.y) > 0.9) N.set(1, 0, 0); }
    else {
      ax.crossVectors(pT, Tn); const s = ax.length();
      if (s > 1e-6) N.applyAxisAngle(ax.multiplyScalar(1 / s), Math.asin(Math.min(1, s)));
      v += pts[i].distanceTo(pts[i - 1]);
    }
    N.addScaledVector(Tn, -N.dot(Tn)).normalize(); B.crossVectors(Tn, N); pT.copy(Tn);
    const r = radAt(i / (n - 1));
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU; q.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      acc.pos.push(pts[i].x + q.x * r, pts[i].y + q.y * r, pts[i].z + q.z * r); acc.nor.push(q.x, q.y, q.z); acc.uv.push(j / radial + seed, v);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) { const a = base + i * (radial + 1) + j, b = a + radial + 1; acc.idx.push(a, b, a + 1, a + 1, b, b + 1); }
}
function accGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2)); g.setIndex(acc.idx); g.computeBoundingSphere();
  return g;
}

// A braided root arch standing across direction (ax, az) at (x, z): three strands twisting round a pointed arch,
// splaying into the ground at both feet. Pushes hanger anchors (underside points) into `hangs`.
function addArch(acc, hangs, o) {
  const { x, z, ax, az, half, H, r, rng, y0 } = o, turns = rng.range(0.8, 1.3) * rng.sign(), ph = rng() * TAU, SEG = 40;
  const c = (s, out) => { const th = Math.PI * s, lx = -half * Math.cos(th) * (1 + 0.1 * Math.sin(th * 2)); return out.set(x + ax * lx, y0 - 1.6 + (H + 1.6) * Math.pow(Math.max(0, Math.sin(th)), 0.72), z + az * lx); };
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), tan = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(-az, 0, ax);
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const s = i / SEG, st = Math.sin(Math.PI * s); c(s, p0); c(Math.min(1, s + 0.01), p1); tan.copy(p1); c(Math.max(0, s - 0.01), p1); tan.sub(p1).normalize();
      e1.crossVectors(tan, e2).normalize();
      const R = r * (0.75 + 1.25 * (1 - st)), a = ph + (k * TAU) / 3 + s * TAU * turns;
      pts.push(p0.clone().addScaledVector(e1, Math.cos(a) * R).addScaledVector(e2, Math.sin(a) * R));
    }
    sweep(acc, pts, (s) => r * (0.72 + 0.75 * (1 - Math.sin(Math.PI * s))), 7, rng());
  }
  if (hangs) {
    const n = o.hangers ?? 90;
    for (let i = 0; i < n; i++) {
      const s = rng.range(0.14, 0.86); c(s, p0);
      hangs.push({ x: p0.x + e2.x * rng.range(-1.6, 1.6), y: p0.y - r * 1.3, z: p0.z + e2.z * rng.range(-1.6, 1.6), len: rng.range(1.4, 6.5) * (0.6 + 0.4 * Math.sin(Math.PI * s)), seed: rng() });
    }
  }
}

function makeRootMaterial(G, o) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...fx.fogUniforms(), ...gwUniforms(G, [0.45, 1.5, 0.5]), uMoonDir: { value: o.moonDir }, uMoonCol: { value: o.moonCol },
      uBark: { value: new THREE.Color(o.bark) }, uAmb: { value: new THREE.Color(o.ambient) }, uVein: { value: new THREE.Color(o.vein) } },
    vertexShader: /* glsl */`
      varying vec3 vN, vW; varying vec2 vUv;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMoonDir, uMoonCol, uBark, uAmb, uVein; varying vec3 vN, vW; varying vec2 vUv;
      ${fx.GLSL_NOISE} ${fx.GLSL_FOG_PARS_FRAG} ${GW_GLSL}
      void main(){
        vec3 V = normalize(cameraPosition - vW), N = normalize(vN); if (dot(N, V) < 0.0) N = -N;
        float grain = fbm(vec2(vUv.x * 9.0, vUv.y * 0.35)), wander = snoise(vec2(vUv.y * 0.11, 3.0));
        float a = fract(vUv.x * 3.0 + wander * 0.45), vein = smoothstep(0.86, 0.985, 1.0 - abs(a - 0.5) * 2.0);
        vein *= 0.55 + 0.45 * snoise(vec2(vUv.y * 0.3, vUv.x * 2.0));
        float dist = length(cameraPosition - vW), nearK = 1.0 - smoothstep(22.0, 70.0, dist);
        float fibre = mix(0.5, fbm(vec2(vUv.x * 34.0 + wander * 2.0, vUv.y * 0.8)) * 0.65 + vnoise(vec2(vUv.x * 80.0, vUv.y * 2.2)) * 0.35, nearK);
        vec3 base = uBark * (0.45 + 0.9 * grain) * (0.35 + 1.3 * fibre);
        float dif = clamp((dot(N, uMoonDir) + 0.45) / 1.45, 0.0, 1.0);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * (0.25 + 0.75 * smoothstep(-0.3, 0.8, dot(-V, uMoonDir)));
        vec3 col = base * (uAmb * (0.55 + 0.45 * N.y) * (1.0 + 1.3 * nearK) + uMoonCol * dif * 0.55) + uMoonCol * rim * 0.34 * (0.4 + 1.2 * fibre);
        col += uVein * max(vein, 0.0) * gwRipple(vW) * 1.6;
        gl_FragColor = vec4(fxApplyFog(col), 1.0);
      }`,
  });
}

// ---------------------------------------------------------------- hanging tendrils (additive ribbons, sway in the shader)
function makeHangers(list, G, o) {
  const SEG = 7, n = list.length, pos = new Float32Array(n * (SEG + 1) * 2 * 3), aH = new Float32Array(n * (SEG + 1) * 2 * 4), idx = [];
  let v = 0;
  for (const h of list) {
    const base = v;
    for (let i = 0; i <= SEG; i++) for (let s = -1; s <= 1; s += 2) { pos.set([h.x, h.y, h.z], v * 3); aH.set([i / SEG, s, h.len, h.seed], v * 4); v++; }
    for (let i = 0; i < SEG; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 4)); g.setIndex(idx);
  const uniforms = { ...fx.fogUniforms(), ...gwUniforms(G, [0.5, 1.6, 0.9]), uTime: o.time, uA: { value: new THREE.Color(o.colorA) }, uB: { value: new THREE.Color(o.colorB) }, uWidth: { value: o.width ?? 0.09 } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aH; uniform float uTime, uWidth; varying vec3 vW; varying vec3 vK;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        float t = aH.x, len = aH.z, sd = aH.w, sw = t * t; vec3 p = position;
        p.y -= len * t * (1.0 - 0.04 * sin(uTime * 0.8 + sd * 40.0));
        p.x += sw * len * (0.11 * sin(uTime * 0.7 + sd * 17.0 + p.z * 0.07) + 0.035 * sin(uTime * 1.9 + sd * 51.0 + t * 4.0));
        p.z += sw * len * (0.09 * cos(uTime * 0.55 + sd * 11.0 + p.x * 0.05) + 0.03 * sin(uTime * 2.3 + sd * 29.0 + t * 5.0));
        vW = p; vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        float tip = smoothstep(0.82, 1.0, t), w = max(uWidth * (1.0 - 0.55 * t + 2.2 * tip), -mvPosition.z * 0.0011);
        mvPosition.x += aH.y * w; vK = vec3(t, aH.y, sd);
        gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA, uB; varying vec3 vW; varying vec3 vK;
      ${fx.GLSL_FOG_PARS_FRAG} ${GW_GLSL}
      void main(){
        // clamped: far off a ribbon is thinner than a pixel, and antialiasing then samples it outside its own width and length
        float t = clamp(vK.x, 0.0, 1.0), tip = smoothstep(0.84, 1.0, t), edge = 1.0 - min(vK.y * vK.y, 1.0);
        vec3 col = mix(uA * 0.35, uB, t * t) * (0.5 + 3.2 * tip) * edge * gwRipple(vW) * smoothstep(0.0, 0.12, t);
        gl_FragColor = vec4(col * (1.0 - fxFog()), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'glowwood-hangers';
  return { object: mesh, material, uniforms, count: n };
}

// ---------------------------------------------------------------- the stream's own light: an additive ribbon of flowing filaments
function makeStreamGlow(pts, widthAt, G, o) {
  const n = pts.length, M = 6, pos = [], uv = [], idx = [], S = new THREE.Vector3();
  let len = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; S.set(-(b.z - a.z), 0, b.x - a.x).normalize();
    if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
    const hw = widthAt(i / (n - 1)) * 0.5;
    for (let j = 0; j <= M; j++) { const k = (j / M) * 2 - 1; pos.push(pts[i].x + S.x * hw * k, pts[i].y, pts[i].z + S.z * hw * k); uv.push(k, len); }
    if (i < n - 1) for (let j = 0; j < M; j++) { const a0 = i * (M + 1) + j, b0 = a0 + M + 1; idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const uniforms = { ...fx.fogUniforms(), ...gwUniforms(G, [0.7, 1.3, 0.25]), uTime: o.time, uColor: { value: new THREE.Color(o.color) }, uHot: { value: new THREE.Color(o.hot) }, uKeep: { value: o.keep ?? 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uKeep; uniform vec3 uColor, uHot; varying vec2 vUv; varying vec3 vW;
      ${fx.GLSL_NOISE} ${fx.GLSL_FOG_PARS_FRAG} ${GW_GLSL}
      void main(){
        float x = vUv.x, y = vUv.y, flow = uTime * (1.5 + 1.1 * (1.0 - x * x));          // faster down the middle
        vec2 q = vec2(x * 2.4, (y - flow) * 0.16);
        float wob = snoise(q * 0.7 + vec2(0.0, uTime * 0.05));
        float f1 = 1.0 - abs(snoise(q + vec2(wob * 0.55, 0.0))), f2 = 1.0 - abs(snoise(q * vec2(2.3, 1.7) + vec2(4.0 + wob * 0.4, -flow * 0.03)));
        float fil = pow(max(f1, 0.0), 5.0) * 0.8 + pow(max(f2, 0.0), 7.0) * 0.45;
        float motes = smoothstep(0.82, 0.97, vnoise(vec2(x * 9.0, (y - flow * 1.25) * 1.3)));
        float edge = smoothstep(1.0, 0.45, abs(x)), dist = length(cameraPosition - vW);
        float body = 0.2 + 0.18 * snoise(q * 0.35 - vec2(0.0, uTime * 0.02)) + 0.3 * uKeep;
        vec3 col = uColor * (body + fil * mix(1.0, mix(0.45, 0.8, uKeep), smoothstep(40.0, 220.0, dist))) + uHot * motes * 0.4 * smoothstep(120.0, 20.0, dist);
        col *= edge * gwRipple(vW);
        col *= mix(1.0, max(uKeep, smoothstep(230.0, 90.0, dist)), smoothstep(210.0, 130.0, vW.z));      // no hard teal line across the clearing
        gl_FragColor = vec4(col * (1.0 - fxFog()), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.renderOrder = 2; mesh.name = 'glowwood-stream-glow';
  return { object: mesh, material, uniforms };
}

// ---------------------------------------------------------------- the six-legged grazer
// The kit quadruped with a long body, a third (middle) pair of legs cloned from the hind pair, and rows of
// glowing blobs along both flanks. Only the blobs carry aGlow, so the creature is a dark, rim-lit silhouette
// with violet lights.
const GRAZER = { ...F.HERD_PRESETS.deer, h: 3.0, bodyLen: 1.3, width: 0.34, depth: 0.46, hip: 0.96, leg: [0.07, 0.04, 0.028], neckLen: 0.66, neckAng: 54,
  neck: [0.15, 0.08], headLen: 0.3, headR: 0.08, headPitch: 24, ears: 0.1, tail: 0.5, tailType: 'flow', antlers: 0, horns: 0.24, graze: 1.55,
  coat: '#1a1840', belly: '#221f52', legs: '#141238', sock: '#100e2c', accent: '#3a3478', horn: '#c0b8f0', pattern: 'none', speed: 0.8, stride: 1.0, varieties: 1 };
function grazerGeometry(spotColor) {
  const S = GRAZER, H = S.h, bl = S.bodyLen * H, rx = (S.width * H) / 2, ry = (S.depth * H) / 2;
  const base = F.quadrupedGeometry(S), A = {}, names = ['position', 'normal', 'color', 'aAnim', 'aPivot', 'aGlow'];
  for (const k of names) A[k] = Array.from(base.attributes[k].array);
  const idx = Array.from(base.index.array), n0 = base.attributes.position.count;
  for (let i = 0; i < n0; i++) A.aGlow[i] = 0;
  // middle legs: copies of the hind legs moved to mid-body, stepping out of phase with both other pairs
  const map = new Map(), shift = 0.5 * bl;
  for (let i = 0; i < n0; i++) {
    if (A.aAnim[i * 4 + 2] > 0.5 && A.aAnim[i * 4 + 2] < 1.5 && A.aPivot[i * 3 + 2] < 0) {
      const j = A.position.length / 3; map.set(i, j);
      A.position.push(A.position[i * 3], A.position[i * 3 + 1], A.position[i * 3 + 2] + shift);
      A.normal.push(A.normal[i * 3], A.normal[i * 3 + 1], A.normal[i * 3 + 2]); A.color.push(A.color[i * 3], A.color[i * 3 + 1], A.color[i * 3 + 2]);
      A.aAnim.push((A.aAnim[i * 4] + 0.62) % 1, A.aAnim[i * 4 + 1], 1, A.aAnim[i * 4 + 3]);
      A.aPivot.push(A.aPivot[i * 3], A.aPivot[i * 3 + 1], A.aPivot[i * 3 + 2] + shift); A.aGlow.push(0);
    }
  }
  for (let t = 0, m = idx.length; t < m; t += 3) { const a = map.get(idx[t]), b = map.get(idx[t + 1]), c = map.get(idx[t + 2]); if (a !== undefined && b !== undefined && c !== undefined) idx.push(a, b, c); }
  // flank lights
  const g = new F.Geo(), col = new THREE.Color(spotColor), hipY = H * S.hip;
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const t = 0.12 + (i / 5) * 0.7, z = -bl / 2 + bl * t, y = hipY + (H - hipY) * t - ry * (0.78 + 0.3 * Math.sin(i * 2.1)), rr = H * (0.06 + 0.018 * Math.sin(i * 1.7 + 1));
    const r = g.blob(sx * rx * (0.98 + 0.06 * Math.sin(t * Math.PI)), y, z, rr * 0.55, rr, rr * 1.25, col, null, 6, 3); g.glow(r, 1);
  }
  const spots = g.build(), off = A.position.length / 3;
  for (const k of names) { const src = spots.attributes[k].array; for (let i = 0; i < src.length; i++) A[k].push(src[i]); }
  for (const i of spots.index.array) idx.push(i + off);
  spots.dispose(); base.dispose();
  const out = new THREE.BufferGeometry();
  const sizes = { position: 3, normal: 3, color: 3, aAnim: 4, aPivot: 3, aGlow: 1 };
  for (const k of names) out.setAttribute(k, new THREE.Float32BufferAttribute(A[k], sizes[k]));
  out.setIndex(idx);
  return out;
}

// 1D Catmull-Rom through [z, x] knots (z descending or ascending), sampled into a table: x(z) and the cosine of the bank angle
function makeCourse(knots, z0, z1, step) {
  const K = knots.slice().sort((a, b) => a[0] - b[0]), n = Math.round((z1 - z0) / step) + 1, xs = new Float32Array(n), cs = new Float32Array(n);
  const raw = (z) => {
    let i = 0; while (i < K.length - 2 && z > K[i + 1][0]) i++;
    const a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)];
    const t = clamp((z - b[0]) / (c[0] - b[0]), 0, 1), h = c[0] - b[0], m0 = ((c[1] - a[1]) / (c[0] - a[0])) * h, m1 = ((d[1] - b[1]) / (d[0] - b[0])) * h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * b[1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * c[1] + (t3 - t2) * m1;
  };
  for (let i = 0; i < n; i++) { const z = z0 + i * step; xs[i] = raw(z); const sl = (raw(z + 1) - raw(z - 1)) / 2; cs[i] = 1 / Math.sqrt(1 + sl * sl); }
  const at = (arr, z) => { const f = clamp((z - z0) / step, 0, n - 1.001), i = Math.floor(f), k = f - i; return arr[i] + (arr[i + 1] - arr[i]) * k; };
  return { x: (z) => at(xs, z), cos: (z) => at(cs, z), slope: (z) => (at(xs, z + 2) - at(xs, z - 2)) / 4 };
}

// ================================================================ the world
export default {
  id: 'glowwood',
  name: 'The Glowwood',
  category: 'alien',
  weirdness: 0.5,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const scene = new THREE.Scene();
    const time = { value: 0 };
    const C = (h) => new THREE.Color(h);

    // ---------------- per-seed character
    const V = {
      moonEl: rng.range(10.5, 15), moonAz: rng.range(-6, 6), moonSize: rng.range(5.6, 8.2),
      hue: rng.range(-1, 1),                       // violet leans blue (-) or purple (+); rose follows
      mist: rng.range(0.4, 1.6),                  // weather: clear night .. heavy ground mist
      meander: rng.range(0.82, 1.2),
      grazers: rng.int(3, 5), flyers: rng.pick(['bats', 'bats', 'swifts', 'none']),
      clouds: rng.chance(0.35), meteors: rng.chance(0.6), nebula: rng.range(0.3, 0.6),
      fireflies: rng.range(0.7, 1.4), rosy: rng.range(0.2, 0.6),
    };
    // layout variety from its own generator (keeps the main sequence): mirrored course, arch count and spacing, flora mix
    const lr = ctx.core.makeRng('gw-layout:' + ctx.seed);
    const L = { mir: lr.sign(), arches: lr.int(2, 3), archGap: lr.range(21, 25), mush: lr.int(110, 170), bulbs: lr.int(40, 70), gate: lr.range(262, 276) };
    // The moon stands between the entry axis and the bearing of the tree from the entry, so it is in the first view
    // (and in the view through the previous portal) with the Mother-Tree in its disc, and still behind the tree on the final axis.
    V.moonAz = L.mir * -5.6 * V.meander + V.moonAz * 0.25;
    const violet = C(PALETTE[3]).lerp(C(V.hue < 0 ? '#5668ff' : '#9a42ff'), Math.abs(V.hue) * 0.78);
    const rose = C(PALETTE[4]).lerp(C(V.hue < 0 ? '#e060ff' : '#ff5fb0'), Math.abs(V.hue) * 0.7);
    const deep = C(PALETTE[2]), teal = C(PALETTE[5]), gold = C(PALETTE[6]), moonCol = C('#aab4ff');
    const hex = (c) => '#' + c.getHexString();
    const mixHex = (a, b, t) => hex(a.clone().lerp(b, t));

    // ---------------- sky, moon, light rig
    const sky = SKY.makeSky({
      rng: rng.fork('sky'), preset: 'night', quality: 0.5,
      zenith: '#03061a', mid: '#080d34', horizon: '#171d60', ground: '#04061a', horizonPow: 3.2,
      stars: 1.3, starDensity: 1, twinkle: 0.5, milkyWay: 1.1, milkyColor: '#8f80ff',
      nebula: V.nebula, nebulaColors: [hex(violet), hex(rose), '#2a1458'], nebulaCoverage: 0.42, nebulaSeed: rng.range(0, 90),
      bodies: [{ elevation: V.moonEl, azimuth: V.moonAz, size: V.moonSize, color: '#aab4ff', color2: '#7f88d8', texture: 0.5, phase: 1, intensity: 1.05, dark: 0.03,
        glow: 0.34, glowColor: '#8c98ff', glowSize: 3.4, horizonFade: 0.25, seed: rng.range(0, 50) }],
      key: 0, clouds: V.clouds ? { coverage: 0.3, softness: 0.4, lit: '#8a92dc', shade: '#141a48', opacity: 0.7, silver: 1.2, absorb: 1.8, wind: [0.006, 0.002] } : false,
      lightColor: '#aab4ff', lightIntensity: 2.6, ambientColor: '#282c70', groundLight: '#1a1448', ambientIntensity: 0.36, lightElevationMin: 9,
    });
    scene.add(sky.object);
    const moonDir = (sky.bodyDirections && sky.bodyDirections[0] ? sky.bodyDirections[0] : SKY.skyDirection(V.moonEl, V.moonAz)).clone().normalize();
    const fogColor = C('#101850');
    // thick between the trunks, thinner once the clearing opens so the Mother-Tree keeps her glow at the reveal
    const FOG_WOOD = 0.0030 + 0.0011 * V.mist, FOG_CLEAR = 0.0019 + 0.0006 * V.mist;
    scene.fog = new THREE.FogExp2(fogColor, FOG_WOOD);
    const rig = SKY.makeLightRig(sky, { intensity: 1, ambient: 1 });
    scene.add(rig.object);
    await ctx.yield();

    // ---------------- the hero
    const hero = await buildHero(ctx, { palette: PALETTE, moonDir, moonColor: '#aab4ff', progress: 0, filaments: 3600, spores: 3000 });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ---------------- stream course and camera path
    const m = V.meander;
    const mir = L.mir;
    const course = makeCourse([[760, 74 * m], [700, 57 * m], [640, 38 * m], [590, 30 * m], [530, -8 * m], [470, -34 * m], [430, -43 * m], [392, -32], [350, -34], [300, -60],
      [240, -80], [150, -90], [60, -84], [0, -78], [-100, -94], [-300, -135], [-420, -150]].map((k) => [k[0], k[1] * mir]), -400, 800, 2);
    const sx = course.x;
    const pathPts = [[sx(640), 5.6, 640], [sx(590), 5.4, 590], [sx(530), 6.0, 530], [sx(476) + 2 * mir, 6.4, 476], [-12 * mir, 6.4, 422], [4 * mir, 6.2, 374], [24 * mir, 7.2, 334], [10 * mir, 6.5, 288]];
    for (const p of A.flyThrough) pathPts.push([p.x, p.y, p.z]);
    const path = makePath(pathPts);
    // Seen through the previous world's portal the camera stands up to ~60 m BEHIND the entry point, looking down the
    // entry axis: nothing tall may stand (or hang a cap) over that run-up or round the entry itself.
    const eP = path.posAtDist(0).clone(), eT = path.tangentAtDist(0).clone(), eL = Math.hypot(eT.x, eT.z) || 1;
    const runUp = (x, z, lat) => { const rx = x - eP.x, rz = z - eP.z, al = (rx * eT.x + rz * eT.z) / eL; return al < 10 && al > -110 && Math.abs(rx * eT.z - rz * eT.x) / eL < lat; };

    // ---------------- terrain: a basin with a carved stream and a level clearing round the tree
    const WY = -0.25;
    // the route as x(z), y(z) (it never doubles back in z): keeps the ground 4.5 m under the camera without a path search per sample
    const PZ0 = 10, PZ1 = 644, pxT = new Float32Array(PZ1 - PZ0 + 1), pyT = new Float32Array(PZ1 - PZ0 + 1);
    {
      const q = new THREE.Vector3(); let k = 0; path.pointAt(0, q); let ax = q.x, ay = q.y, az = q.z;
      for (let zi = PZ1; zi >= PZ0; zi--) {
        while (k < 1400 && q.z > zi) { ax = q.x; ay = q.y; az = q.z; k++; path.pointAt(k / 1400, q); }
        const t = az - q.z > 1e-4 ? clamp((az - zi) / (az - q.z), 0, 1) : 0;
        pxT[zi - PZ0] = lerp(ax, q.x, t); pyT[zi - PZ0] = lerp(ay, q.y, t);
      }
    }
    // The rill: a tributary that leaves the stream at the grazers' pool, runs beside the route on the stream side, swings onto
    // the Mother-Tree's axis in the clearing and ends in a still pool at the edge of her root apron. It is the glowing leading
    // line of the middle of the flight (the main stream leaves the view after the first third).
    const pathX = (z) => { const f = clamp(z, PZ0, PZ1 - 1) - PZ0, i = Math.floor(f); return lerp(pxT[i], pxT[i + 1], f - i); };
    const RZ0 = 60, RZ1 = 400;
    const rill = makeCourse([[410, sx(410)], [400, sx(400)], [388, sx(388) + 8 * mir], [374, pathX(374) - 13 * mir], [352, pathX(352) - 10.5 * mir], [330, pathX(330) - 10 * mir],
      [308, pathX(308) - 10 * mir], [286, pathX(286) - 10 * mir], [262, pathX(262) - 9.5 * mir], [240, -8.5 * mir], [205, -6.5 * mir], [170, -3.5 * mir], [140, -1 * mir], [118, 0], [90, 0], [50, 0]], 50, 412, 2);
    const rillHalf = (z) => 2.6 * (1 + 1.5 * smoothstep(104, 80, z)) * smoothstep(RZ0, 70, z);      // widens into the pool, closes to a point
    const dRill = (x, z) => (z < RZ0 || z > RZ1 ? 1e3 : Math.abs(x - rill.x(z)) * rill.cos(z) - (rillHalf(z) - 2.6));      // distance to a 5.2 m channel
    const height = (x, z) => {
      let h = 1.3 + 1.7 * noise.fbm2(x * 0.011, z * 0.011, 3) + 0.35 * noise.n2(x * 0.06, z * 0.06);
      const lat = Math.abs(x - sx(z) * 0.45), beh = Math.max(0, -z - 90), e = Math.hypot(lat, beh), wall = smoothstep(105, 290, e);
      if (wall > 0) h += (wall * wall * (52 + 24 * noise.fbm2(x * 0.006 + 9, z * 0.006, 3)) + wall * 7 * noise.ridged2(x * 0.012, z * 0.012, 3)) * lerp(1, 0.35, beh / (e + 1e-3));
      h = lerp(h, 0, smoothstep(102, 56, Math.hypot(x, z)));
      const ds = Math.abs(x - sx(z)) * course.cos(z);
      if (ds < 40) { h = lerp(h, 0.35, 0.8 * smoothstep(40, 9, ds)); h = lerp(h, -1.75, smoothstep(9.5, 3.0, ds)); }
      const dr = dRill(x, z);
      if (dr < 13) { const k = smoothstep(RZ0 - 4, RZ0 + 6, z); h = lerp(h, Math.min(h, 0.3), 0.8 * k * smoothstep(13, 6.5, dr)); h = lerp(h, Math.min(h, -1.25), k * smoothstep(8, 4, dr)); }
      if (z > PZ0 && z < PZ1) {
        const f = z - PZ0, i = Math.floor(f), dp = Math.abs(x - lerp(pxT[i], pxT[i + 1], f - i));
        if (dp < 17) h = Math.min(h, lerp(pyT[i] - 4.5, h, smoothstep(6, 17, dp)));
      }
      else if (z >= PZ1 && runUp(x, z, 17)) {                                        // the run-up behind the entry
        const dp = Math.abs((x - eP.x) * eT.z - (z - eP.z) * eT.x) / eL; h = Math.min(h, lerp(eP.y - 4.5, h, smoothstep(6, 17, dp)));
      }
      return h;
    };
    const cA = C('#1c1c44'), cB = C('#2a1e50'), cC = C('#122240'), cRock = C('#16143a'), cClear = C('#3a1c5c');
    const groundColor = (x, z, y, ny, out) => {
      const o = out || new THREE.Color(), n = 0.5 + 0.5 * noise.fbm2(x * 0.03 + 4, z * 0.03, 3), k = 0.5 + 0.5 * noise.n2(x * 0.11, z * 0.11);
      o.copy(cA).lerp(cB, smoothstep(0.35, 0.75, n)).lerp(cC, smoothstep(2.2, -0.6, y) * 0.7);
      if (ny !== undefined) o.lerp(cRock, smoothstep(0.85, 0.6, ny));
      o.lerp(cClear, 0.5 * smoothstep(130, 40, Math.hypot(x, z)));                     // the clearing floor takes the tree's light
      return o.multiplyScalar(0.7 + 0.5 * k);
    };
    const landOpts = {
      rng: rng.fork('land'), noise, path, height, bounds: [-330, -380, 330, 780], cell: 3.5, near: 36, levels: 5,
      corridor: false, biome: 'alien', color: groundColor, waterLevel: WY, ao: 0.5,
      palette: { rock: '#18163a', rockB: '#261f4c', strata: 0.25, patch: '#30285e', patchAmount: 0.3, glow: hex(violet), glowLevel: 0.03, glowRange: 0.05, glowIntensity: 0.22,
        shore: '#161f44', bed: '#0a1c2c', wet: 0.35, roughness: 0.9 },
    };
    const land = T.makeTerrainAsync ? await T.makeTerrainAsync(landOpts, () => ctx.yield()) : T.makeTerrain(landOpts);
    scene.add(land.object);
    const hAt = land.heightAt;
    await ctx.yield();

    // ---------------- shared ripple state
    const G = { uGwO: { value: new THREE.Vector4(0, 0, 0, hero.pulse.period) }, uGwCam: { value: new THREE.Vector3(0, 1e4, 0) } };

    // ---------------- water: kit river + its own teal light
    const riverPts = [], glowPts = [];
    for (let z = 772; z >= -330; z -= 11) riverPts.push([sx(z), WY, z]);
    for (let z = 772; z >= -330; z -= 4) glowPts.push(new THREE.Vector3(sx(z), WY + 0.07, z));
    const river = W.makeRiver({ rng: rng.fork('river'), light: sky, glint: 0.16, points: riverPts, width: 15.5, speed: 2.4, segments: 420, across: 8,
      deep: '#041c2a', shallow: '#0c3c44', foam: 0.12, bankFoam: 0.3, opacity: 0.62, bankFade: 1.6, ripple: 1.1 });
    scene.add(river.object);
    const streamGlow = makeStreamGlow(glowPts, () => 14, G, { time, color: hex(teal.clone().multiplyScalar(0.12)), hot: '#5fcfc0' });
    scene.add(streamGlow.object);
    await ctx.yield();
    const rillPts = [], rillGlowPts = [], RN = Math.round((RZ1 - 2 - (RZ0 + 1)) / 3);
    for (let i = 0; i <= RN; i++) { const z = RZ1 - 2 - (i / RN) * (RZ1 - 2 - (RZ0 + 1)); rillGlowPts.push(new THREE.Vector3(rill.x(z), WY + 0.07, z)); if (i % 3 === 0 || i === RN) rillPts.push([rill.x(z), WY, z]); }
    const rillW = (t) => 2 * rillHalf(lerp(RZ1 - 2, RZ0 + 1, t));
    const rillWater = W.makeRiver({ rng: ctx.core.makeRng('gw-rill:' + ctx.seed), light: sky, glint: 0.07, points: rillPts, width: (t) => rillW(t) + 3.4, speed: 1.5, segments: 220, across: 6,
      deep: '#041c2a', shallow: '#0c3c44', foam: 0.04, bankFoam: 0.15, opacity: 0.45, bankFade: 1.4, ripple: 0.9 });
    rillWater.object.name = 'glowwood-rill'; scene.add(rillWater.object);
    await ctx.yield();
    const rillGlow = makeStreamGlow(rillGlowPts, (t) => rillW(t) + 1.2, G, { time, color: hex(teal.clone().multiplyScalar(0.3)), hot: '#5fcfc0', keep: 1 });      // keep: lit all the way across the clearing
    rillGlow.object.name = 'glowwood-rill-glow'; scene.add(rillGlow.object);
    await ctx.yield();

    // ---------------- flora materials (one atlas, three programs)
    const wind = flora.makeWind({ direction: [0.45, -0.9], strength: 0.85, speed: 0.8, gustiness: 0.6 });
    const matOpts = { wind, backlight: 1.2, backlightTint: '#aab4ff', ambient: 0.5, leafAmbient: 0.5, wrap: 0.5 };
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture({ ...matOpts }, ctx.yield);
    const matBig = patchGlow(flora.windMaterial({ ...matOpts }), G, [0.62, 1.25, 0.3]);
    const atlas = matBig.map;
    const matSmall = patchGlow(flora.windMaterial({ ...matOpts, backlight: 1.3, map: atlas }), G, [0.42, 1.2, 0.9]);      // fronds and tendrils flare as the camera passes
    const matCover = patchGlow(flora.windMaterial({ wind, map: atlas, fade: [84, 118], detail: 0, wrap: 0.3, backlight: 1.1, backlightTint: '#aab4ff', ambient: 0.45, leafAmbient: 0.45, sheen: 0.4 }), G, [0.3, 1.9, 1.0]);

    // ---------------- where things may grow
    const dTree = (x, z) => Math.hypot(x, z);
    const dStream = (x, z) => Math.abs(x - sx(z)) * course.cos(z);
    const inClearing = (x, z) => dTree(x, z) < 128 || (z > 0 && z < 325 && Math.abs(x) < lerp(16, 46, smoothstep(310, 130, z)));
    // the grazers' drinking place (on the path side of the stream): kept open so they read as whole silhouettes
    const gz = 378, gx = sx(gz) + 6 * mir, nearHerd = (x, z) => Math.hypot(x - gx, z - gz) < 14;
    // a sight line from the entry to the Mother-Tree stays open, so her glow shows over the treeline in the opening view
    const ex0 = sx(640), inSight = (x, z) => z > 390 && Math.abs(x - (ex0 * z) / 640) < 17;
    const bigDensity = (x, z) => (inClearing(x, z) || inSight(x, z) || nearHerd(x, z) || dStream(x, z) < 10 || dRill(x, z) < 8 || runUp(x, z, 24) ? 0 : hAt(x, z) > 26 ? 0.45 : 1);

    // ---------------- giant mushrooms
    const extraScatters = [];
    const fr = rng.fork('flora');
    const gillB = mixHex(violet, rose, V.rosy);
    const dimV = hex(violet.clone().multiplyScalar(0.45)), dimB = hex(C(gillB).multiplyScalar(0.45));     // cap rims: dark albedo, the glow does the work
    const mushOpts = [
      { height: 15, capColor: '#1c0e40', capRim: dimV, spot: '#d2c6ff', gill: hex(violet), stemColor: '#958bd0' },
      { height: 21, capColor: '#180c38', capRim: dimB, spot: '#e6d0ff', gill: gillB, stemColor: '#8f86c8' },
      { height: 27, capColor: '#1e1046', capRim: dimV, spot: '#cfc8ff', gill: mixHex(violet, C('#b8a8ff'), 0.3), stemColor: '#9c92d8' },
    ];
    const mushNear = [], mushFar = [];
    for (let i = 0; i < 3; i++) { mushNear.push(flora.mushroomGeometry({ rng: fr, detail: 1, babies: i === 2 ? 3 : 2, gillGlow: 2.8, spotGlow: 1.7, capGlow: 0.5, ...mushOpts[i] })); await ctx.yield(); }
    for (let i = 0; i < 3; i++) { mushFar.push(flora.mushroomGeometry({ rng: fr, detail: 0, gillGlow: 2.8, spotGlow: 1.7, capGlow: 0.5, ...mushOpts[i] })); await ctx.yield(); }
    const mushrooms = flora.makeScatter({ rng: rng.fork('mush'), path, heightAt: hAt, material: matBig, variants: mushNear, farVariants: mushFar, farDistance: 50,
      count: L.mush, radius: 185, corridor: 12.5, spacing: 9, falloff: 0.55, scale: [0.72, 1.28], density: bigDensity, chunks: 4, cullDistance: 340, tint: 0.14, hue: 0.05, tilt: 0.06,
      groundGlow: { intensity: 0.2, radius: 1.9 } });
    scene.add(mushrooms.object);
    await ctx.yield();
    // the wood beyond the clearing and behind the tree (never near the path: far variants only)
    const backwood = flora.makeScatter({ rng: rng.fork('back'), bounds: [-300, -330, 300, 250], heightAt: hAt, material: matBig, variants: mushFar,
      count: 100, spacing: 10, scale: [0.9, 1.6], tint: 0.14, hue: 0.05,
      density: (x, z) => (inClearing(x, z) || dTree(x, z) < 132 || dTree(x, z) > 330 || z > 235 - Math.abs(x) * 0.5 || dStream(x, z) < 10 || path.nearestXZ(x, z).dist < 60 ? 0 : 1) });
    scene.add(backwood.object);
    await ctx.yield();

    // two giants either side of the axis past the gateway: the last dark frame before the open clearing
    {
      const zf = L.gate - 46, pts = [-1, 1].map((sd, i) => { const x = sd * (22 + i * 3), z = zf - i * 9; return { x, y: hAt(x, z), z, s: 1.4 - i * 0.12, rot: 1.3 + i * 2.1, d: Math.abs(x), u: 0.62, v: 2 - i }; });
      const flank = flora.makeScatter({ rng: rng.fork('flank'), heightAt: hAt, material: matBig, variants: mushNear, points: pts, tint: 0.1, hue: 0.04, groundGlow: { intensity: 0.2, radius: 1.9 } });
      flank.object.name = 'glowwood-flank'; scene.add(flank.object); extraScatters.push(flank);
    }

    // ---------------- bulb-trees with lantern fruit
    const bulbOpts = [
      { height: 19, bulb: hex(rose), bulbCore: '#ff9fe6' },
      { height: 23, bulb: mixHex(violet, rose, 0.25), bulbCore: '#c9b0ff' },
    ];
    await ctx.yield();
    const bulbNear = [];
    for (const o of bulbOpts) { bulbNear.push(flora.bulbTreeGeometry({ rng: fr, detail: 1, bark: '#1e1a3c', barkLight: '#4e3f86', bulbGlow: 0.6, ...o })); await ctx.yield(); }
    const bulbFar = [flora.bulbTreeGeometry({ rng: fr, detail: 0, bark: '#1e1a3c', barkLight: '#4e3f86', bulbGlow: 0.6, ...bulbOpts[0] })];
    await ctx.yield();
    const bulbs = flora.makeScatter({ rng: rng.fork('bulb'), path, heightAt: hAt, material: matBig, variants: bulbNear, farVariants: bulbFar, farDistance: 48,
      count: L.bulbs, radius: 150, corridor: 12, spacing: 8, falloff: 0.6, scale: [0.8, 1.25], density: bigDensity, chunks: 3, cullDistance: 380, tint: 0.12, hue: 0.04,
      groundGlow: { intensity: 0.16, radius: 1.5 } });
    scene.add(bulbs.object);
    await ctx.yield();

    // ---------------- frond spirals and tendril knots close to the route
    const smallVar = [
      flora.frondSpiralGeometry({ rng: fr, detail: 1, height: 7, stalk: '#2a2470', stalkTip: hex(violet), leaf: '#2a2070', leafTip: hex(rose), glow: 1.0 }),
      flora.frondSpiralGeometry({ rng: fr, detail: 1, height: 9, heads: 3, stalk: '#261f66', stalkTip: hex(violet), leaf: '#241c68', leafTip: hex(violet), glow: 1.0 }),
      flora.tendrilGeometry({ rng: fr, detail: 1, height: 6.5, base: '#1a1a4c', mid: '#46299c', tip: hex(rose), glow: 2.3 }),
      flora.tendrilGeometry({ rng: fr, detail: 1, height: 5, count: 6, base: '#1a1a4c', mid: '#3a2a90', tip: mixHex(rose, violet, 0.4), glow: 2.3 }),
    ];
    await ctx.yield();
    smallVar.push(smallVar[2], smallVar[3]);           // mostly tendril knots, a few fiddleheads
    const smallDensity = (x, z, d) => (dTree(x, z) < 66 || dStream(x, z) < 6.5 || dRill(x, z) < 5 || runUp(x, z, 12) || nearHerd(x, z) ? 0 : inClearing(x, z) ? 0.5 : 1);
    const smallFar = [
      flora.frondSpiralGeometry({ rng: fr, detail: 0, height: 8, stalk: '#2a2470', stalkTip: hex(violet), leaf: '#2a2070', leafTip: hex(rose), glow: 1.0 }),
      flora.tendrilGeometry({ rng: fr, detail: 0, height: 6, base: '#1a1a4c', mid: '#46299c', tip: hex(rose), glow: 2.3 }),
    ];
    await ctx.yield();
    const smalls = flora.makeScatter({ rng: rng.fork('small'), path, heightAt: hAt, material: matSmall, variants: smallVar, farVariants: smallFar, farDistance: 27,
      count: 130, radius: 62, corridor: 11, spacing: 3.5, falloff: 0.85, scale: [0.55, 1.45], density: smallDensity, chunks: 3, cullDistance: 300, tint: 0.14, hue: 0.05,
      groundGlow: { intensity: 0.22, radius: 2.0 } });
    scene.add(smalls.object);
    await ctx.yield();

    // ---------------- rose light on the rill's banks: low tendril knots and young mushrooms, each throwing a pool of rose on the moss
    const xr = ctx.core.makeRng('gw-banks:' + ctx.seed);          // its own generator: the main sequence stays as released
    const roseGill = mixHex(violet, rose, 0.8);
    const bankVar = [
      flora.tendrilGeometry({ rng: xr, detail: 1, height: 4.2, count: 7, base: '#16123c', mid: '#5a2488', tip: hex(rose), glow: 3.2 }),
      flora.mushroomGeometry({ rng: xr, detail: 1, height: 3.4, babies: 3, gillGlow: 3.0, spotGlow: 2.4, capGlow: 0.6, capColor: '#1c0e40', capRim: hex(C(roseGill).multiplyScalar(0.5)), spot: hex(rose), gill: roseGill, stemColor: '#8f86c8' }),
      flora.tendrilGeometry({ rng: xr, detail: 1, height: 3.2, count: 5, base: '#16123c', mid: '#4a2a94', tip: mixHex(rose, violet, 0.25), glow: 3.2 }),
    ];
    const bankFar = [
      flora.tendrilGeometry({ rng: xr, detail: 0, height: 4, count: 6, base: '#16123c', mid: '#5a2488', tip: hex(rose), glow: 3.2 }),
      flora.mushroomGeometry({ rng: xr, detail: 0, height: 3.4, gillGlow: 3.0, spotGlow: 2.4, capGlow: 0.6, capColor: '#1c0e40', capRim: hex(C(roseGill).multiplyScalar(0.5)), spot: hex(rose), gill: roseGill, stemColor: '#8f86c8' }),
    ];
    await ctx.yield();
    const bankDensity = (x, z) => { const d = dRill(x, z); return d < 4.9 || nearHerd(x, z) || dTree(x, z) < 58 ? 0 : (d < 12 ? 1 : 0.1) * (dTree(x, z) < 128 ? 0.75 : 1); };
    const banks = flora.makeScatter({ rng: xr.fork('scatter'), path, heightAt: hAt, material: matSmall, variants: bankVar, farVariants: bankFar, farDistance: 12, count: 96, radius: 24, corridor: 7, spacing: 4.2, falloff: 0.3,
      uRange: [0.25, 0.93], scale: [0.5, 1.05], density: bankDensity, chunks: 2, cullDistance: 260, tint: 0.12, hue: 0.04, groundGlow: { intensity: 0.2, radius: 3.4 } });
    banks.object.name = 'glowwood-banks'; scene.add(banks.object); extraScatters.push(banks);
    await ctx.yield();

    // ---------------- luminous ground cover: moss-grass and giant ferns
    // the carpet runs up to the root apron, and between the two great roots to the foot of the portal
    const inCleftRun = (x, z) => z > 20 && Math.abs(x) < lerp(7.5, 18, smoothstep(30, 46, z));
    const coverDensity = (x, z) => ((dTree(x, z) < 40 && !inCleftRun(x, z)) || dStream(x, z) < 5.2 || dRill(x, z) < 4.7 ? 0 : 1);
    const grassOpts = { rng: rng.fork('grass'), path, heightAt: hAt, material: matCover, wind, fade: [84, 118], count: 15000, radius: 38, bias: 2.2, chunks: 4,
      width: [0.8, 1.4], height: [0.5, 1.1], root: '#14143a', tip: mixHex(violet, C('#b9a6ff'), 0.2), dry: hex(rose), dryAmount: 0.2, glow: 0.55,
      flowers: 0.015, flowerColors: [hex(rose), hex(violet)], density: coverDensity };
    const grass = flora.makeGrassAsync ? await flora.makeGrassAsync(grassOpts, ctx.yield) : flora.makeGrass(grassOpts);
    scene.add(grass.object);
    await ctx.yield();
    const fernVar = [0, 1].map((i) => flora.fernGeometry({ rng: fr, size: 1.3, fronds: 9, detail: 1, leaf: i ? '#3a2a9a' : '#2c2e96', leafLight: i ? hex(violet) : mixHex(violet, rose, 0.3), leafDark: '#181648', glow: 0.9 }));
    await ctx.yield();
    const ferns = flora.makeScatter({ rng: rng.fork('fern'), path, heightAt: hAt, material: matCover, variants: fernVar, count: 340, radius: 44, corridor: 5, clear: 0, falloff: 0.85,
      scale: [1.0, 2.5], sink: 0.02, tilt: 0.12, chunks: 3, cullDistance: 118, density: coverDensity });
    scene.add(ferns.object);
    await ctx.yield();

    // ---------------- root arches: two over the stream on the route, more as silhouettes in the wood
    const rootAcc = makeAcc(), hangs = [], rr = rng.fork('roots');
    const archAt = (x, z, ax, az, half, H, r, hangers) => {
      const y0 = Math.min(hAt(x - ax * half, z - az * half), hAt(x + ax * half, z + az * half));
      addArch(rootAcc, hangs, { x, z, ax, az, half, H, r, rng: rr, y0, hangers });
    };
    for (let i = 0; i < L.arches; i++) {
      const z = 523 - i * L.archGap;
      const sl = course.slope(z), k = 1 / Math.hypot(1, sl);            // stream tangent = (sl, 1) / |..|, the arch stands across it
      archAt(sx(z), z, k, -sl * k, 11.2 + rr.range(0, 1.2), rr.range(17.5, 20), 1.15, 120);
      await ctx.yield();
    }
    // the gateway: one great arch astride the route where the clearing opens, so the Mother-Tree is first seen through a dark frame
    {
      const gzz = L.gate, f = gzz - PZ0, i = Math.floor(f), px = lerp(pxT[i], pxT[i + 1], f - i), sl = (pxT[i + 4] - pxT[i - 4]) / 8, k = 1 / Math.hypot(1, sl);
      archAt(px, gzz, k, -sl * k, 16, 24, 1.45, 150);
    }
    await ctx.yield();
    for (let i = 0, made = 0; i < 40 && made < 7; i++) {
      const d = rr.range(0.03, 0.57) * path.length, p = path.posAtDist(d), t = path.tangentAtDist(d), side = rr.sign() * rr.range(30, 88);
      const x = p.x - t.z * side, z = p.z + t.x * side, half = rr.range(10, 19), yaw = rr.range(0, Math.PI);
      if (inClearing(x, z) || path.nearestXZ(x, z).dist < half + 13 || hAt(x, z) > 16 || Math.abs(z - 510) < 40) continue;
      archAt(x, z, Math.cos(yaw), Math.sin(yaw), half, half * rr.range(1.0, 1.5), rr.range(0.9, 1.5), 46); made++;
      await ctx.yield();
    }
    await ctx.yield();
    const roots = new THREE.Mesh(accGeometry(rootAcc), makeRootMaterial(G, { moonDir, moonCol, bark: '#262250', ambient: '#343a8c', vein: hex(violet) }));
    roots.name = 'glowwood-roots'; scene.add(roots);
    await ctx.yield();
    // tendrils never reach into the camera corridor
    const hangList = [];
    for (const h of hangs) {
      const nr = path.nearestXZ(h.x, h.z);
      if (nr.dist < 8) h.len = Math.min(h.len, h.y - (nr.y + 6.8));
      if (h.len > 0.7) hangList.push(h);
    }
    const hangers = makeHangers(hangList, G, { time, colorA: hex(violet), colorB: hex(rose), width: 0.1 });
    scene.add(hangers.object);
    await ctx.yield();

    // ---------------- atmosphere: moonlit ground mist, drifting puffs over the water
    const set = fx.fxGroup(); set.object.name = 'gw-fx'; scene.add(set.object);
    const mistK = 0.6 + 0.54 * (V.mist - 0.4);                    // 0.6 clear night .. 1.25 heavy mist
    const GFOG = 0.3 * mistK;
    const gfog = set.add(fx.makeGroundFog({ rng: rng.fork('fog'), time, layers: 9, size: 760, y: -0.3, height: 9, color: '#4854b8', opacity: GFOG, coverage: 0.66, scale: 0.016, near: [14, 60],
      wind: [0.9, -0.5], sunDir: moonDir, sunColor: '#aab4ff', scatter: 0.6 }));
    // a second, higher and broader sheet: the trunks stand in pale bands, near / middle / far
    const gfog2 = set.add(fx.makeGroundFog({ rng: rng.fork('fog2'), time, layers: 7, size: 900, y: 5, height: 14, color: '#4450b4', opacity: 0.13 * mistK, coverage: 0.5, scale: 0.008, near: [20, 80],
      wind: [0.6, -0.3], sunDir: moonDir, sunColor: '#aab4ff', scatter: 0.6 }));
    await ctx.yield();
    const farFromPath = (p, d) => path.distanceTo(p[0], p[1], p[2]) > d;
    const mistPos = [];
    for (let z = 700; z >= -200; z -= 26) mistPos.push([sx(z) + rng.range(-12, 12), rng.range(1, 3.5), z + rng.range(-6, 6)]);
    for (let i = 0; i < 16; i++) { const a = rng() * TAU, r = rng.range(58, 125); mistPos.push([Math.cos(a) * r, rng.range(2, 5), Math.sin(a) * r]); }
    mistPos.push([gx - 12 * mir, 3, gz - 14]);                    // a pale bank behind the grazers: they stand as dark shapes against light
    set.add(fx.makeMist({ rng: rng.fork('mist'), time, positions: mistPos.filter((p) => farFromPath(p, 12)), size: [16, 34], color: '#8894f0', opacity: 0.2 * mistK, drift: [0.5, 0, -0.3] }));
    await ctx.yield();
    // big slow banks between the trunks either side of the route
    const bankPos = [], mr = rng.fork('banks');
    for (let i = 0; i < 44; i++) {
      const d = mr.range(0.03, 0.55) * path.length, p = path.posAtDist(d), t = path.tangentAtDist(d), side = (i % 2 ? 1 : -1) * mr.range(30, 85);
      const x = p.x - t.z * side, z = p.z + t.x * side;
      bankPos.push([x, hAt(x, z) + mr.range(4, 9), z]);
    }
    set.add(fx.makeMist({ rng: rng.fork('mist2'), time, positions: bankPos.filter((p) => farFromPath(p, 26)), size: [28, 60], color: '#7884e6', opacity: 0.3 * mistK, drift: [0.35, 0, -0.2] }));

    await ctx.yield();
    // ---------------- particles: gold fireflies, rose spores, both round the camera and placed in the world
    const goldHex = hex(gold), roseHex = hex(rose);
    set.add(fx.makeParticles({ rng: rng.fork('ff'), preset: 'fireflies', time, count: Math.round(220 * V.fireflies), colors: [goldHex, goldHex, '#f4ffb0'], size: [0.1, 0.22] }));
    const spores = set.add(fx.makeParticles({ rng: rng.fork('spores'), preset: 'magic', time, count: 800, colors: [roseHex, mixHex(rose, C('#ffffff'), 0.4), mixHex(rose, violet, 0.5)] }));
    if (V.meteors) set.add(fx.makeShootingStars({ rng: rng.fork('met'), time, count: 9, color: '#e6e9ff', tailColor: hex(violet), intensity: 4 }));
    // the far rose glow over the treeline: swells with the tree's heartbeat
    const beacon = set.add(fx.makeGlow({ time, position: [A.crown.x, A.crown.y - 16, A.crown.z], color: roseHex, size: 230, intensity: 0.6, halo: 1, core: 0.3, fogAmount: 0.3, depthBias: 0.2 }));

    await ctx.yield();
    const critters = [];
    const ffA = F.makeFireflies({ rng: rng.fork('ffa'), path, uFrom: 0.01, uTo: 0.62, count: Math.round(260 * V.fireflies), spread: 36, clear: 2.5, lift: [-5, 6], color: goldHex, color2: '#f6ffb8', mix: 0.2, size: 0.32, blink: 0.3 });
    const ffPos = [];
    for (let i = 0, n = Math.round(520 * V.fireflies); i < n; i++) {
      const a = rng() * TAU, r = 16 + 105 * Math.pow(rng(), 0.8), x = Math.cos(a) * r, z = Math.sin(a) * r * (Math.sin(a) > 0 ? 1.7 : 1), y = rng.range(0.8, 5) + Math.pow(rng(), 2.2) * 30;
      ffPos.push([x, y, z]);
    }
    const ffB = F.makeFireflies({ rng: rng.fork('ffb'), positions: ffPos, count: ffPos.length, color: goldHex, color2: '#f6ffb8', mix: 0.2, size: 0.34, blink: 0.34, sync: 0.25 });
    const ffLow = [];
    for (let i = 0, n = Math.round(300 * V.fireflies); i < n; i++) {
      const z = xr.range(RZ0 + 4, RZ1 - 6), k = xr.gauss() * 3.6, p = [rill.x(z) + k, WY + 0.5 + Math.pow(xr(), 1.8) * 4.2, z + xr.range(-1.5, 1.5)];
      if (path.distanceTo(p[0], p[1], p[2]) > 3.2) ffLow.push(p);
    }
    const ffC = F.makeFireflies({ rng: xr.fork('ff'), positions: ffLow, count: ffLow.length, color: goldHex, color2: '#f6ffb8', mix: 0.2, size: 0.4, blink: 0.3, sync: 0.15 });
    critters.push(ffA, ffB, ffC);
    await ctx.yield();

    // ---------------- fauna: the grazers at the water, moths at the lanterns, night fliers across the moon
    const fLight = { sunDir: moonDir, sunColor: '#aab4ff', sunIntensity: 3.4, sky: '#3a44b0', skyIntensity: 0.8, ground: '#241a60', groundIntensity: 0.5 };
    const herd = F.makeHerd({ rng: rng.fork('herd'), preset: GRAZER, geometry: grazerGeometry(hex(violet)), count: V.grazers, size: 1.7, sizes: [1, 0.52, 0.45, 0.9, 0.5], light: fLight,
      heightAt: (x, z) => Math.max(hAt(x, z), WY - 0.9), center: [gx, 0, gz], radius: 8, roam: 0.36, pause: 0.2, path, clear: 15, glow: hex(violet), glowIntensity: 1.9, rim: 2.4 });
    critters.push(herd);
    await ctx.yield();
    const lamps = bulbs.points.filter((p) => p.d < 46).slice(0, 14).map((p) => [p.x, p.y + 15 * p.s, p.z]);
    if (lamps.length) critters.push(F.makeMoths({ rng: rng.fork('moth'), positions: lamps, jitter: 3, count: 110, size: 2.4, light: fLight }));
    if (V.flyers !== 'none') {
      critters.push(F.makeFlock({ rng: rng.fork('fly'), species: V.flyers, count: V.flyers === 'bats' ? 150 : 46, size: V.flyers === 'bats' ? 1.8 : 2.2, light: fLight,
        cross: { path, u: 0.6, window: 0.24, lead: 150, span: 460, angle: 78, side: rng.sign(), height: 36 } }));
    }
    for (const c of critters) scene.add(c.object);
    await ctx.yield();

    // ---------------- the heartbeat: world time, gently slewed so the pulse reaches the crown as the tree is revealed
    const P = hero.pulse.period, target = hero.pulse.crownAt - 1.0;      // at the reveal the gold is half-way up the trunk; it reaches the crown two seconds later
    let off = rng.range(0, P), lastU = -1;
    const wrapP = (x) => x - P * Math.round(x / P);
    const syncPulse = (dt, t, u) => {
      const jump = lastU < 0 || Math.abs(u - lastU) > 0.03; lastU = u;
      if (u < 0.25) return;
      const err = wrapP(target - (t + off + (U_REVEAL - u) * DURATION));
      if (jump) off += err; else if (u < U_REVEAL) off += clamp(err, -0.3 * dt, 0.3 * dt);
    };

    const grazerAt = new THREE.Vector3(gx, hAt(gx, gz) + 3.2, gz);
    const treeAt = new THREE.Vector3(A.pulseOrigin.x, 88, A.pulseOrigin.z), cleftAt = new THREE.Vector3(A.pulseOrigin.x, 30, A.pulseOrigin.z);
    const scatters = [mushrooms, backwood, bulbs, smalls, ferns, ...extraScatters];

    return {
      scene, path, duration: DURATION,
      camera: { fov: 64, near: 0.4, far: 3200, lookAhead: 28, sway: 1, bank: 0.8 },
      pois: [
        { at: grazerAt, from: 0.27, to: 0.46, weight: 0.7 },
        { at: treeAt, from: 0.47, to: 0.8, weight: 0.85, fade: 0.25 },       // up into the crown at the reveal
        { at: cleftAt, from: 0.74, to: 0.9, weight: 0.5 },                   // then settling on the cleft and the portal
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: '#ffd2f2', glow: 0.55, revealDistance: 300 },
      post: { exposure: 1.05, bloom: { strength: 0.65, radius: 0.72, threshold: 0.9 },
        grade: { saturation: 1.12, contrast: 1.05, tint: '#f1f0ff', shadowTint: '#0c0a2c', vignette: 0.42, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        syncPulse(dt, t, u);
        hero.setPulseClock(t + off);
        hero.setProgress(smoothstep(0.45, 0.72, u));
        scene.fog.density = lerp(FOG_WOOD, FOG_CLEAR, smoothstep(0.42, 0.6, u));
        hero.update(dt, t, camera);
        const heart = hero.uniforms.uHeart.value;
        G.uGwO.value.z = hero.pulse.cycle(t) - hero.pulse.crownAt;
        G.uGwCam.value.setFromMatrixPosition(camera.matrixWorld);
        sky.update(dt, t, camera);
        rig.update(dt, t);       // no camera: the kit rig calls camera.getWorldDirection(), which resets the engine's portal camera (matrixAutoUpdate = false) to the origin
        land.update(dt, t); river.update(dt, t, camera); rillWater.update(dt, t, camera);
        flora.updateWind(wind, t);
        for (const s of scatters) s.update(dt, t, camera);
        grass.update(dt, t, camera);
        spores.setOpacity(lerp(0.3, 1, smoothstep(0.42, 0.8, u)));
        beacon.uniforms.uIntensity.value = (lerp(0.6, 0.35, smoothstep(0, 0.1, u)) + 0.9 * heart) * (1 - smoothstep(0.45, 0.7, u));
        gfog.uniforms.uOpacity.value = GFOG * lerp(1, 0.8, smoothstep(0.6, 0.86, u));       // the mist thins a little in the clearing, where the camera looks down on it
        set.update(dt, t, camera);
        herd.object.visible = u > 0.16 && u < 0.62;
        for (const c of critters) if (c.object.visible) c.update(dt, t, camera, u);
      },
      dispose() {
        hero.dispose();
        for (const k of [sky, rig, land, river, rillWater, set, grass, ...scatters, ...critters]) if (k && typeof k.dispose === 'function') k.dispose();
      },
    };
  },
};
