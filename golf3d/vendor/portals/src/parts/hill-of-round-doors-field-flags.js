// hill-of-round-doors, the field builder's part: THE STRINGS OF FLAGS. Strings run from bough to bough under the party
// tree and from the boughs out to tall poles in the field; small pennants hang from them in plain strong colours, some
// with a simple shape on them (two bands, a diamond, a dot: nothing lettered), fluttering and leaning in the wind by the
// world's clock. The strings out to the poles carry lanterns too, beyond the crown. Every string, flag and pole keeps
// its clear air from the flown line (see layStrings).
import { lerp } from './hill-of-round-doors-field-geo.js';
import { SHAPES, TINTS, LANTERN_AIR, LINE_F } from './hill-of-round-doors-field-lanterns.js';

const PAINTS = ['#d6402c', '#f1bd2c', '#3d70c2', '#ee8628', '#f3ecd6', '#8b4a90', '#2c9792'];       // red, yellow, blue, orange, cream, plum, teal
const FLAG_DROP = 1.35;                                         // a flag's tip hangs this far under its string, at most

// a string from a to b sagging by `sag` in the middle: its places every metre or so
function hang(a, b, sag) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(4, Math.ceil(len / 1.2)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)]); }
  return pts;
}

// layStrings(rng, o) -> { strings: [pts], flags: [...], poles: [{ x, z, y0, y1 }], lanterns: [...] }
// o: { ties: [[x, y, z, bough]] in the world, trunk: [x, z], density, ground(x, z), route(x, y, z) -> metres from the
//      flown line, over(x, z) -> { dist, y } in plan, lowY: no flag lower than this within `near` metres of the line in
//      plan, near, poleRing: [a, b] metres from the trunk, crown: the crown's reach (lanterns hang on the pole strings
//      beyond it), wind: [x, z] }
export async function layStrings(rng, o) {
  const strings = [], flags = [], poles = [], lanterns = [], T = o.ties;
  const fits = (pts) => {
    for (const p of pts) {
      if (o.route(p[0], p[1], p[2]) < LANTERN_AIR || o.route(p[0], p[1] - FLAG_DROP, p[2]) < LANTERN_AIR) return false;
      if (p[1] - FLAG_DROP < o.lowY && o.over(p[0], p[2]).dist < o.near) return false;
      if (Math.hypot(p[0] - o.trunk[0], p[2] - o.trunk[1]) < 5.2) return false;
    }
    return true;
  };
  // flags along a string; `skip`: arc places already taken (by a lantern's tie)
  const dress = (pts, skip = [], r = rng) => {
    let acc = 0, next = 0.8, k = Math.floor(r() * PAINTS.length);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), hx = b[0] - a[0], hz = b[2] - a[2], hl = Math.hypot(hx, hz) || 1;
      while (next <= acc + seg) {
        const t = (next - acc) / seg, size = r.range(0.92, 1.18), kr = r(), k2 = r(), ph = r();
        k = (k + 1 + Math.floor(k2 * 2)) % PAINTS.length;
        const taken = skip.some((s) => Math.abs(s - next) < 0.9);
        if (!taken) {
          const nx = -hz / hl, nz = hx / hl;
          flags.push({ x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t) - 0.04, z: lerp(a[2], b[2], t), cos: hx / hl, sin: hz / hl, size, phase: ph,
            a: PAINTS[k], b: PAINTS[(k + 3 + Math.floor(k2 * 3)) % PAINTS.length], kind: kr < 0.5 ? 0 : kr < 0.68 ? 1 : kr < 0.85 ? 2 : 3, lean: nx * o.wind[0] + nz * o.wind[1] >= 0 ? 1 : -1 });
        }
        next += 1.22;
      }
      acc += seg;
    }
  };
  // from bough to bough
  const want = Math.round(13 * o.density);
  for (let t = 0, made = 0; t < want * 12 && made < want && T.length > 1; t++) {
    if (o.pause && t % 12 === 11) await o.pause();
    const i = Math.floor(rng() * T.length), j = Math.floor(rng() * T.length), sag = rng.range(0.5, 1.1);
    const a = T[i], b = T[j], d = Math.hypot(a[0] - b[0], a[2] - b[2]);
    if (a[3] === b[3] || d < 9 || d > 26) continue;
    const pts = hang(a, b, sag * (0.6 + d / 30)); if (!fits(pts)) continue;
    strings.push(pts); dress(pts); made++;
  }
  // the poles, and two strings out to each: one of flags, one of flags and lanterns
  const np = 9, a0 = rng() * Math.PI * 2;
  for (let i = 0; i < np; i++) {
    const az = a0 + Math.PI * 2 * (i + rng.range(-0.25, 0.25)) / np, rho = rng.range(o.poleRing[0], o.poleRing[1]), tall = rng.range(15.6, 16.6);
    const x = o.trunk[0] + rho * Math.cos(az), z = o.trunk[1] + rho * Math.sin(az), y0 = o.ground(x, z), y1 = Math.max(y0 + 12.5, o.lowY + 1.6 + (tall - 15.6));
    const pick = [rng(), rng()], sags = [rng.range(0.5, 0.9), rng.range(0.5, 0.9)], dice = []; for (let k = 0; k < 10; k++) dice.push([rng(), rng(), rng(), rng(), rng()]);
    const dice0 = []; if (o.moreRng) for (let k = 0; k < 10; k++) dice0.push([o.moreRng(), o.moreRng(), o.moreRng(), o.moreRng(), o.moreRng()]);     // the first string's lanterns, on their own stream
    if (o.over(x, z).dist < o.near + 0.8 || y1 - y0 > 17.5) continue;
    // the ties nearest this pole's bearing, far enough out along their boughs
    const cand = T.filter((q) => { const r = Math.hypot(q[0] - o.trunk[0], q[2] - o.trunk[1]); return r > 12 && r < 27; })
      .map((q) => { const d = Math.atan2(q[2] - o.trunk[1], q[0] - o.trunk[0]) - az; return [Math.abs(Math.atan2(Math.sin(d), Math.cos(d))), q]; })      // the angle between the tie's bearing and the pole's, wrapped into half a turn either way
      .sort((p, q) => p[0] - q[0]).slice(0, 6);                                                                                                           // the six ties nearest the pole's own bearing: no string runs round the tree
    let hung = 0; const used = new Set();
    for (let s = 0; s < 2 && cand.length; s++) {
      const q = cand[Math.floor(pick[s] * cand.length)][1]; if (used.has(q[3])) continue;
      const pts = hang(q, [x, y1 - 0.25, z], sags[s]); if (!fits(pts)) continue;
      used.add(q[3]); strings.push(pts); hung++;
      const skip = [];
      {                                                         // lanterns on both, out beyond the crown
        let acc = 0, di = 0; const dc = s === 1 ? dice : dice0;
        for (let k = 1; k < pts.length && di < dc.length; k++) {
          const p = pts[k]; acc += Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1], p[2] - pts[k - 1][2]);
          if (Math.hypot(p[0] - o.trunk[0], p[2] - o.trunk[1]) < o.crown + 1.5 || (skip.length && acc - skip[skip.length - 1] < 2.5)) continue;
          const [u1, u2, u3, u4, u5] = dc[di++], kind = Math.floor(u1 * SHAPES.length), size = lerp(0.5, 0.8, u2), L = lerp(1.5, 2.9, u3), S = SHAPES[kind], amp = Math.min(0.1, 0.42 / L);
          const yc = p[1] - L - S.c * size;
          if (o.route(p[0], yc, p[2]) < LANTERN_AIR + S.h * size * 0.62 + amp * (L + S.h * size) || yc - S.h * size * 0.5 < y0 + 4.4) continue;
          lanterns.push({ ax: p[0], ay: p[1], az: p[2], L, size, kind, tint: Math.floor(u4 * TINTS.length), phase: u5, amp, x: p[0], y: yc, z: p[2] });
          skip.push(acc);
        }
      }
      dress(pts, skip);
    }
    if (hung) poles.push({ x, z, y0, y1 });
    if (o.pause && i % 2 === 1) await o.pause();
  }
  // THE BANK beyond the tree (o.bank: the places of tall poles, in order; a pole is strung from the tree's nearest bough
  // tie when `tree` is set and from the pole before it when `chain` is set), with flags and lanterns, on its own
  // stream o.bankRng
  if (o.bank && o.bankRng) {
    const r = o.bankRng; let prev = null;
    for (const b of o.bank) {
      const y0 = o.ground(b.x, b.z), y1 = y0 + r.range(12.5, 14), sag = r.range(0.7, 1.1), dice = []; for (let k = 0; k < 24; k++) dice.push([r(), r(), r(), r(), r()]);
      const head = [b.x, y1 - 0.25, b.z], from = [];
      if (o.over(b.x, b.z).dist < o.near + 0.8) { prev = null; continue; }
      if (b.tree) {
        let best = null, bd = Infinity;
        for (const q of T) { const rt = Math.hypot(q[0] - o.trunk[0], q[2] - o.trunk[1]), d = Math.hypot(q[0] - b.x, q[2] - b.z); if (rt > 14 && d < bd) { bd = d; best = q; } }
        if (best) from.push(best);
      }
      if (b.chain && prev) from.push(prev);
      let hung = 0, di = 0;
      for (const a of from) {
        const d = Math.hypot(a[0] - b.x, a[2] - b.z), pts = hang(a, head, sag * (0.7 + d / 28)); if (!fits(pts)) continue;
        strings.push(pts); hung++;
        const skip = []; let acc = 0;
        for (let k = 1; k < pts.length && di < dice.length; k++) {
          const p = pts[k]; acc += Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1], p[2] - pts[k - 1][2]);
          if (Math.hypot(p[0] - o.trunk[0], p[2] - o.trunk[1]) < o.crown + 1.5 || (skip.length && acc - skip[skip.length - 1] < 2.5)) continue;
          const [u1, u2, u3, u4, u5] = dice[di++], kind = Math.floor(u1 * SHAPES.length), size = lerp(0.5, 0.8, u2), L = lerp(1.5, 2.9, u3), S = SHAPES[kind], amp = Math.min(0.1, 0.42 / L), yc = p[1] - L - S.c * size;
          if (o.route(p[0], yc, p[2]) < LANTERN_AIR + S.h * size * 0.62 + amp * (L + S.h * size) || yc - S.h * size * 0.5 < o.ground(p[0], p[2]) + 4.4) continue;
          lanterns.push({ ax: p[0], ay: p[1], az: p[2], L, size, kind, tint: Math.floor(u4 * TINTS.length), phase: u5, amp, x: p[0], y: yc, z: p[2] });
          skip.push(acc);
        }
        dress(pts, skip, r);
      }
      if (hung || b.chain || b.keep) poles.push({ x: b.x, z: b.z, y0, y1 });
      prev = head;
      if (o.pause) await o.pause();
    }
  }
  return { strings, flags, poles, lanterns };
}

// makeFlags(THREE, laid, { lampAt, lamp }) -> { object, time, triangles, drawCalls, dispose() }: all the flags in one
// instanced mesh (a Lambert material: the scene's sun, fill and fog; the lanterns' light by place), all the strings in
// another (ribbons never thinner than a pixel and a half).
export function makeFlags(THREE, laid, o) {
  const object = new THREE.Group(), time = { value: 0 }, owned = [], U = { uHillTime: time, uHillLamp: { value: o.lamp } };
  let triangles = 0, drawCalls = 0;
  const F = laid.flags, n = F.length;
  if (n) {
    // a pennant: 1 wide, 1.25 long, hanging from y 0; uv: across, down
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.25, -0.625, 0, 0.25, -0.625, 0, 0, -1.25, 0], 3));
    base.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    base.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.25, 0.5, 0.75, 0.5, 0.5, 1], 2));
    base.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3]);
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    const P = new Float32Array(n * 3), D = new Float32Array(n * 4), A = new Float32Array(n * 3), B = new Float32Array(n * 3), K = new Float32Array(n * 3), ca = new THREE.Color(), mid = new THREE.Vector3();
    F.forEach((f, i) => {
      P.set([f.x, f.y, f.z], i * 3); D.set([f.cos, f.sin, f.size, f.phase], i * 4); mid.x += f.x / n; mid.y += f.y / n; mid.z += f.z / n;
      ca.set(f.a); A.set([ca.r, ca.g, ca.b], i * 3); ca.set(f.b); B.set([ca.r, ca.g, ca.b], i * 3); K.set([f.kind, o.lampAt(f.x, f.y - 0.6, f.z), f.lean], i * 3);
    });
    let rad = 1; for (const f of F) rad = Math.max(rad, Math.hypot(f.x - mid.x, f.y - mid.y, f.z - mid.z) + 3);
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('aDir', new THREE.InstancedBufferAttribute(D, 4));
    g.setAttribute('aColA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aColB', new THREE.InstancedBufferAttribute(B, 3)); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(K, 3));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(mid, rad);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uHillTime; attribute vec3 aPos; attribute vec4 aDir; attribute vec3 aColA; attribute vec3 aColB; attribute vec3 aKind;\nvarying vec3 vColA; varying vec3 vColB; varying vec4 vFlag;')
        .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(-aDir.y, 0.0, aDir.x);')
        .replace('#include <begin_vertex>', /* glsl */`float fv = -position.y / 1.25, fph = aDir.w * 6.2832;
          vec3 fl = position * aDir.z;
          float fwave = sin(uHillTime * 5.2 + fph + fv * 2.6) * 0.15 + sin(uHillTime * 8.7 + fph * 2.7 + fv * 4.0) * 0.06;
          fl.z += (fwave + aKind.z * 0.26 * (0.6 + 0.4 * sin(uHillTime * 0.9 + fph * 1.4))) * fv * fv * aDir.z;      // flutter, and a lean down the wind
          vec3 transformed = aPos + vec3(fl.x * aDir.x - fl.z * aDir.y, fl.y, fl.x * aDir.y + fl.z * aDir.x);
          vColA = aColA; vColB = aColB; vFlag = vec4(uv, aKind.xy);`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uHillLamp; varying vec3 vColA; varying vec3 vColB; varying vec4 vFlag;')
        .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
          float gk = floor(vFlag.z + 0.5), gw = max(fwidth(vFlag.y), 1e-5) * 1.5, gm = 0.0;
          if (gk == 1.0) gm = smoothstep(0.2 - gw, 0.2 + gw, vFlag.y) - smoothstep(0.42 - gw, 0.42 + gw, vFlag.y);             // a band
          else if (gk == 2.0) gm = 1.0 - smoothstep(0.5 - gw * 3.0, 0.5 + gw * 3.0, abs(vFlag.x - 0.5) * 2.6 + abs(vFlag.y - 0.34) * 2.4);   // a diamond
          else if (gk == 3.0) gm = 1.0 - smoothstep(0.17 - gw, 0.17 + gw, length(vec2(vFlag.x - 0.5, (vFlag.y - 0.32) * 1.25)));       // a dot
          diffuseColor.rgb = mix(vColA, vColB, gm) * (0.93 + 0.07 * sin(vFlag.y * 9.0 + vFlag.x * 4.0));`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uHillLamp * max(vFlag.w, 0.0);')
        .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
          #if NUM_DIR_LIGHTS > 0
          reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb * (RECIPROCAL_PI * 0.5 * clamp(-dot(normal, directionalLights[0].direction), 0.0, 1.0));   // sun through the cloth
          #endif`);
    };
    mat.customProgramCacheKey = () => 'hill-field-flag-1';
    object.add(new THREE.Mesh(g, mat)); owned.push(g, base, mat); triangles += 3 * n; drawCalls++;
  }
  return { object, time, triangles, drawCalls, owned, dispose() { for (const x of owned) x.dispose(); } };
}

// makeStrings(THREE, lines) -> { object, triangles, drawCalls, dispose() }: every span of every string as one
// instanced ribbon turned to the eye (lines: lists of places). Used for the flags' strings.
export function makeStrings(THREE, lines) {
  const object = new THREE.Group(), owned = [], A = [], B = [];
  for (const pts of lines) for (let i = 1; i < pts.length; i++) { A.push(pts[i - 1][0], pts[i - 1][1], pts[i - 1][2]); B.push(pts[i][0], pts[i][1], pts[i][2]); }
  const n = A.length / 3; if (!n) return { object, triangles: 0, drawCalls: 0, dispose() {} };
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 3));
  g.instanceCount = n;
  const mid = new THREE.Vector3(); for (let i = 0; i < n; i++) mid.add(new THREE.Vector3(A[i * 3], A[i * 3 + 1], A[i * 3 + 2])); mid.multiplyScalar(1 / n);
  let rad = 1; for (let i = 0; i < n; i++) rad = Math.max(rad, Math.hypot(A[i * 3] - mid.x, A[i * 3 + 1] - mid.y, A[i * 3 + 2] - mid.z) + 3);
  g.boundingSphere = new THREE.Sphere(mid, rad);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, uCord: { value: new THREE.Color(0.06, 0.045, 0.032) } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aA; attribute vec3 aB; varying float vC; varying float vW;
      #ifdef USE_FOG
      varying float vFogDepth;
      #endif
      void main() {
        vec4 va = modelViewMatrix * vec4(aA, 1.0), vb = modelViewMatrix * vec4(aB, 1.0), mvPosition = mix(va, vb, position.y);
        vec2 dir = vb.xy / max(-vb.z, 0.05) - va.xy / max(-va.z, 0.05); float dl = length(dir);
        vec2 side = dl > 1e-6 ? vec2(-dir.y, dir.x) / dl : vec2(1.0, 0.0);
        float half_ = max(0.05, 0.004 * max(-mvPosition.z, 0.0));
        mvPosition.xy += side * position.x * half_; vC = position.x; vW = 0.025 / half_;
        gl_Position = projectionMatrix * mvPosition;
        #ifdef USE_FOG
        vFogDepth = -mvPosition.z;
        #endif
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCord; varying float vC; varying float vW;
      #ifdef USE_FOG
      uniform vec3 fogColor; varying float vFogDepth; uniform float fogDensity; uniform float fogNear; uniform float fogFar;
      #endif
      ` + LINE_F + /* glsl */`
      void main() {
        float a = hillLine(vC, vW); vec3 c = uCord;
        #ifdef USE_FOG
          #ifdef FOG_EXP2
          c = mix(c, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
          #else
          c = mix(c, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
          #endif
        #endif
        gl_FragColor = vec4(c, a);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.renderOrder = 2; object.add(m); owned.push(g, mat);
  return { object, triangles: 2 * n, drawCalls: 1, dispose() { for (const x of owned) x.dispose(); } };
}
