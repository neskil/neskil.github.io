// THE ALTAR AND THE ROAD TO IT: hero set piece of "marigold-way-home" (The Marigold Way Home), 8x life size.
//
// Seven white-clothed tiers stepped back like a stair (44 m wide at the foot, each 3 m high and 3.5 m
// deep, the top one 7 m deep), about 600 candles in rows (tapers, stubs and coloured glass votives, every
// flame a leaning billboard), round sugared loaves, pyramids of oranges and limes, arches of sugar cane,
// smoking clay censers, glasses of water, a dish of salt, a pair of small shoes, a spinning top, a folded
// shawl, a dozen EMPTY gilt frames each with its own candle, marigold suns and crosses pinned to the
// cloth, garland swags along every tier, and on the top tier a woven marigold bower 20 m wide whose
// 15 m opening holds the portal. The petal road arrives from +Z, widens into a 30 m carpet at the foot,
// climbs the clear 14 m aisle up the middle of the tiers and passes under the arch. Behind it all a
// plain deep-blue limewashed end wall (no candle on it) with two swags of cut-paper flags.
//
// SIZE     radius 30 m (altar and wall; the road stub runs on to z = 14 + road), height 41.5 m. Origin = floor centre under the middle of the altar, +Y up,
//          front = +Z. Tier i (0..6): riser at z = 14 - 3.5 i, top at y = 3 (i + 1), half width 22 - i.
//          End wall at z = -14 (opts.wall). Carpet and road stub run from z = 14 to z = 14 + opts.road.
// LIGHT    Night. NOTHING here reads scene lights: every material is a ShaderMaterial lit by (a) a cool
//          hemisphere (uSky cobalt from above, uGround orange petal bounce from below) and (b) candle
//          light BAKED per vertex / per instance from the actual candle positions, multiplied by uWarm
//          and a slow shared flicker. Petals and flames are emissive (petals ~1.4, flame cores ~6).
//          hero.setLight({ sky, ground, warm, ambient, petal }) retunes it per variation (hex or Color;
//          ambient and petal are gains). Fog: all materials honour scene.fog. Wants bloom ~0.35-0.5 at
//          threshold ~0.9 and a dark blue-violet room; do not add a bright light behind the arch.
// OPTS     palette  : 7 hex [indigo, cobalt, marigold, flame gold, violet, magenta, terracotta]
//          road     : length in metres of the carpet + road stub in front of the foot (default 46)
//          roadWidth: width of the road at its far end (default 10; it is 30 at the foot)
//          wall     : false | { width: 60, height: 46 } the blue end wall behind the altar
//          flags    : true  cut-paper swags on the wall;  burn: 0..1 candles burnt low (windy dawn)
// HOOKS    setProgress(u01) : 0 = house waiting, 1 = camera arriving at the arch: flames swell a little,
//                             petals start falling from the arch thicker, the bower glows warmer.
//          setWind(x, z, k) : flames stream and flags snap along (x, z); k 0..1.
//          setGust(g01)     : rare event: loose petals lift off floor and tiers and stream to the arch.
//          setLight({...})  : see LIGHT.   uniforms: the shared uniform table.
//          Flames within ~19 m behind the camera lean after it (camera motion is measured in update()).
//          buildPetalRoad(ctx, { points: [[x, z, width], ...], y, palette, uniforms: hero.uniforms })
//          (second export) lays the same glowing petal ribbon along the rest of the camera path.
// ANCHORS  (hero-local)
//   portalSeat  { position (0, 29.5, -10.2), normal (0, -0.326, 0.946), tilt 19 deg, width 14, height 17 }
//               centre of the 14 m arch portal inside the bower; the path's last 60 m should run along
//               -normal. The bower is 5.6 m deep so the tilted portal stays inside it.
//   flyThrough  ordered Vector3 list: level at y = 7 over the road, then the straight 19 degree climb
//               up the petal aisle to the portal. >= 7 m clear everywhere (aisle is 14 m wide, nothing
//               above the petals; nearest candles 7.6 m either side).
//   lookAt      Vector3 (0, 24, -8): aim the gaze here (arch foot / upper tiers).
//   viewpoints  { door, carpet, climb }: the best-room door frame, low over the carpet, mid climb.
//   foot        Vector3 (0, 0, 14); roadEnd Vector3 where the road stub stops (join buildPetalRoad here)
//   censers     [Vector3] bowl tops (add extra incense or mist here); candleGroups [{ position, count }]
//               (moth circles, rig lights); frames [Vector3]; top Vector3 (the spinning top);
//   keepOut     [{ min, max }] solid boxes (tiers, arch legs) for path planning.
// COST     ~115k triangles, 10 draw calls (10 shader programs), no lights, no textures; build ~150-280 ms in short slices.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#0B1230', '#1F47A8', '#FF9A1F', '#FFD98A', '#7A4FB0', '#D6336C', '#A8492E'];
const NT = 7, TH = 3, TD = 3.5, ZF = 14, ZW = -14, AISLE = 7;
const ARCH = { z: -10.2, y0: 21, spring: 31, r: 8.75, tr: 1.25, td: 2.8 };
const tierZ = (i) => ZF - TD * i, tierY = (i) => TH * (i + 1), tierHW = (i) => 22 - i;
const tierBack = (i) => (i >= NT - 1 ? ZW : tierZ(i + 1));

// ---------------------------------------------------------------- helpers
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function M(x, y, z, sx = 1, sy = sx, sz = sx, ry = 0, rx = 0, rz = 0) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
}
const lathe = (pts, seg = 10) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 1e-3), p[1])), seg);
const hex = (h) => new THREE.Color(h);
const mixc = (a, b, t) => a.clone().lerp(b, t);

// merges parts into one geometry with aCol (linear rgb) and aAux = (baked glow, emissive, gloss, kind)
function makeBatch() {
  // typed buffers that double when full: pushing 13 floats a vertex onto plain arrays was a tenth of the build
  let cap = 4096, P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), A = new Float32Array(cap * 4);
  let icap = 16384, I = new Uint32Array(icap), ni = 0, count = 0;
  const c = new THREE.Color(), n3 = new THREE.Matrix3(), bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  const grow = (old, n) => { const a = new old.constructor(n); a.set(old); return a; };
  return {
    get vertices() { return count; },
    // color: THREE.Color or (x, y, z, out) => void on local coordinates; aux = [emissive, gloss, kind]
    add(geo, mat, color, aux = [0, 0, 0], jitter = 0, rng = null) {
      const pa = geo.attributes.position, idx = geo.index, base = count, n = pa.count;
      const pA = pa.array, nA = geo.attributes.normal.array, e = mat.elements, fn = typeof color === 'function';
      const m = n3.getNormalMatrix(mat).elements, a0 = aux[0], a1 = aux[1], a2 = aux[2], jit = jitter && rng;
      if (count + n > cap) { while (count + n > cap) cap *= 2; P = grow(P, cap * 3); N = grow(N, cap * 3); C = grow(C, cap * 3); A = grow(A, cap * 4); }
      for (let i = 0, j = 0, o = base * 3, q = base * 4; i < n; i++, j += 3, o += 3, q += 4) {
        const lx = pA[j], ly = pA[j + 1], lz = pA[j + 2];
        if (fn) color(lx, ly, lz, c); else c.copy(color);
        if (jit) c.multiplyScalar(1 + (rng() - 0.5) * jitter);
        const x = e[0] * lx + e[4] * ly + e[8] * lz + e[12], y = e[1] * lx + e[5] * ly + e[9] * lz + e[13], z = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        P[o] = x; P[o + 1] = y; P[o + 2] = z;
        if (x < bb[0]) bb[0] = x; if (x > bb[3]) bb[3] = x; if (y < bb[1]) bb[1] = y; if (y > bb[4]) bb[4] = y; if (z < bb[2]) bb[2] = z; if (z > bb[5]) bb[5] = z;
        const ax = nA[j], ay = nA[j + 1], az = nA[j + 2];
        const ux = m[0] * ax + m[3] * ay + m[6] * az, uy = m[1] * ax + m[4] * ay + m[7] * az, uz = m[2] * ax + m[5] * ay + m[8] * az;
        const l = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1; N[o] = ux / l; N[o + 1] = uy / l; N[o + 2] = uz / l;
        C[o] = c.r; C[o + 1] = c.g; C[o + 2] = c.b; A[q] = 0; A[q + 1] = a0; A[q + 2] = a1; A[q + 3] = a2;
      }
      const add = idx ? idx.count : n;
      if (ni + add > icap) { while (ni + add > icap) icap *= 2; I = grow(I, icap); }
      if (idx) { const iA = idx.array; for (let i = 0; i < add; i++) I[ni++] = base + iA[i]; }
      else for (let i = 0; i < n; i++) I[ni++] = base + i;
      count += n; geo.dispose();
    },
    // async: the bake runs over every vertex, so it hands the page back as it goes (pass ctx)
    async build(bake, ctx) {
      for (let i = 0; i < count; i++) {
        if ((i & 1023) === 0) await ctx?.yield?.();
        A[i * 4] = bake(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, count * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, count * 3), 3));
      g.setAttribute('aCol', new THREE.BufferAttribute(C.slice(0, count * 3), 3));
      g.setAttribute('aAux', new THREE.BufferAttribute(A.slice(0, count * 4), 4));
      g.setIndex(new THREE.BufferAttribute(count > 65535 ? I.slice(0, ni) : Uint16Array.from(I.subarray(0, ni)), 1));
      // bounds come from the adds, so the renderer does not walk every vertex again
      if (count) g.boundingSphere = new THREE.Sphere(new THREE.Vector3((bb[0] + bb[3]) / 2, (bb[1] + bb[4]) / 2, (bb[2] + bb[5]) / 2), 0.5 * Math.hypot(bb[3] - bb[0], bb[4] - bb[1], bb[5] - bb[2]) + 1);
      await ctx?.yield?.();
      return g;
    },
  };
}

// grid surface from a function (i, j) -> [x, y, z, u, v]; extra per-vertex floats via fn's 6th value
function gridGeo(nu, nv, fn) {
  const P = [], U = [], E = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const r = fn(i / nu, j / nv); P.push(r[0], r[1], r[2]); U.push(r[3], r[4]); E.push(r[5] ?? 0, r[6] ?? 0, r[7] ?? 1); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  return { P, U, E, I, n: (nu + 1) * (nv + 1) };
}
function mergeGrids(grids, flipList = []) {
  const P = [], U = [], E = [], I = []; let base = 0;
  grids.forEach((g, k) => {
    P.push(...g.P); U.push(...g.U); E.push(...g.E);
    for (let i = 0; i < g.I.length; i += 3) { if (flipList[k]) I.push(base + g.I[i], base + g.I[i + 2], base + g.I[i + 1]); else I.push(base + g.I[i], base + g.I[i + 1], base + g.I[i + 2]); }
    base += g.n;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  geo.setAttribute('aE', new THREE.Float32BufferAttribute(E, 3));
  geo.setIndex(I); geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform vec3 uSky, uGround, uWarm; uniform float uTime, uAmb, uPetal, uProgress;
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p){ float n = hash21(p); return vec2(n, hash21(p + n + 17.17)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
float flick(vec3 p){ return 0.87 + 0.13 * sin(uTime * 1.7 + p.x * 0.11 + p.z * 0.07) * sin(uTime * 1.13 + p.y * 0.09 + 1.7)
  + 0.04 * sin(uTime * 4.3 + p.x * 0.31 + p.y * 0.2); }
vec3 lightAt(vec3 p, vec3 n, float glow){
  float up = n.y * 0.5 + 0.5;
  vec3 amb = (uSky * (0.3 + 0.7 * up) + uGround * (1. - up) * (1. - up) / (1. + max(p.y, 0.) * 0.045)) * uAmb;
  return amb + uWarm * glow * flick(p);
}`;
const FOG_V = '#include <fog_pars_vertex>\n', FOG_F = '#include <fog_pars_fragment>\n';
// additive things fade into fog instead of taking its colour
const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#endif`;

function shader(shared, o) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, o.uniforms || {}]),
    vertexShader: o.vertexShader, fragmentShader: o.fragmentShader, fog: true,
    side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true,
    blending: o.blending ?? THREE.NormalBlending,
  });
  for (const k in shared) mat.uniforms[k] = shared[k];
  return mat;
}

// ---------------------------------------------------------------- materials
const V_WORLD = /* glsl */`
  vec4 wpos = modelMatrix * vec4(P, 1.); vW = wpos.xyz;
  vec4 mvPosition = viewMatrix * wpos; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;

// props, wall, tier cores: vertex colour, baked candle glow, emissive, gloss
function litMaterial(U) {
  return shader(U, {
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 aCol; attribute vec4 aAux; uniform float uSpin;
      varying vec3 vCol, vN, vL, vW; varying vec4 vAux;
      void main(){ vCol = aCol; vAux = aAux; vL = position; vec3 P = position;
        vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${V_WORLD} }`,
    fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
      varying vec3 vCol, vN, vL, vW; varying vec4 vAux;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float nz = vnoise(vL.xz * 1.9 + vL.y * 1.3), nz2 = vnoise(vL.xy * 7. + vL.z * 5.);
        vec3 alb = vCol * (0.82 + 0.24 * nz + 0.12 * nz2);
        if (vAux.w > 0.5) { float m = vnoise(vL.xy * 0.21) * 0.6 + vnoise(vL.xy * vec2(1.1, 0.16)) * 0.4; alb *= 0.7 + 0.55 * m; }
        vec3 col = alb * lightAt(vL, n, vAux.x);
        vec3 R = reflect(-V, n);
        float sw = pow(max(dot(R, vec3(0., -0.301, 0.954)), 0.), 14.) + pow(max(dot(R, normalize(vec3(-0.5 * sign(vL.x), 0.2, 0.8))), 0.), 36.);
        float fr = 1. - max(dot(n, V), 0.); fr = fr * fr * fr;
        col += vAux.z * (uWarm * (0.3 + vAux.x) * sw * 1.5 * mix(vec3(1.), vCol * 1.8, 0.65) + uSky * pow(max(R.y, 0.), 6.) * 0.7 + uWarm * vCol * fr * 0.5 * vAux.x);
        col += vCol * vAux.y * (0.8 + 0.2 * flick(vL * 3.));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// white altar cloth: weave, embroidered band, lace scallop hem cut by discard. uv = (metres along, metres below the edge)
function clothMaterial(U, c1, c2, c3) {
  return shader(U, {
    side: THREE.DoubleSide,
    uniforms: { uC1: { value: c1 }, uC2: { value: c2 }, uC3: { value: c3 } },
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 aE; varying vec2 vUv; varying vec3 vE, vN, vL, vW;
      void main(){ vUv = uv; vE = aE; vL = position; vec3 P = position;
        vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${V_WORLD} }`,
    fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
      uniform vec3 uC1, uC2, uC3; varying vec2 vUv; varying vec3 vE, vN, vL, vW;
      void main(){
        float u = vUv.x, v = vUv.y;
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 alb = vec3(0.80, 0.765, 0.69) * (0.93 + 0.07 * sin(u * 40.) * sin(v * 40.)) * (0.9 + 0.14 * vnoise(vUv * 1.3));
        if (v > 0.) {
          float hem = 2.28 + 0.4 * abs(sin(u * 2.856));
          if (v > hem) discard;
          vec2 lp = vec2(fract(u / 0.55) - 0.5, (v - hem + 0.3) / 0.55);
          if (dot(lp, lp) < 0.036) discard;
          float lace = step(hem - 0.62, v); alb *= 1. - 0.1 * lace;
          float bv = (v - 1.42) / 0.5;
          if (abs(bv) < 1.35) {
            float cu = fract(u / 1.9) - 0.5, c2 = fract(u / 1.9 + 0.5) - 0.5;
            float dia = abs(cu) * 2.2 + abs(bv) * 0.82;
            float ring = step(dia, 0.66) * step(0.46, dia), core = step(dia, 0.26);
            float zig = abs(fract(u / 0.63) - 0.5) * 2.;
            float zz = step(abs(abs(bv) - 1.12 - (zig - 0.5) * 0.3), 0.075);
            vec2 fp = vec2(c2 * 1.9, bv * 0.5); float fr = length(fp);
            float fa = fr > 1e-3 ? atan(fp.y, fp.x) : 0.;
            float flower = step(fr, 0.3 * (0.62 + 0.38 * cos(fa * 6.))), eye = step(fr, 0.085);
            alb = mix(alb, uC1, ring * 0.9); alb = mix(alb, uC3, core * 0.9);
            alb = mix(alb, uC2, zz * 0.85); alb = mix(alb, uC3, flower * 0.9); alb = mix(alb, uC1, eye);
          }
        } else {
          alb = mix(alb, uC1, step(-0.62, v) * step(v, -0.4) * 0.85);
          alb = mix(alb, uC2, step(-0.84, v) * step(v, -0.76) * 0.8);
        }
        vec3 col = alb * lightAt(vL, n, vE.y);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// glowing petals: road, carpet, aisle runner and the arch's woven body. uv in metres, aE = (edge distance, glow, gain)
const PETAL_FRAG = /* glsl */`
  uniform vec3 uP1, uP2, uP3, uP4; uniform float uCell, uGust; varying vec2 vUv; varying vec3 vE, vN, vL, vW;
  void main(){
    vec2 p = (vUv + (vec2(vnoise(vUv * 2.3), vnoise(vUv * 2.3 + 7.7)) - 0.5) * 0.42) / uCell; vec2 ip = floor(p), fp = fract(p); float d1 = 8., d2 = 8.; vec2 id = ip, rv = vec2(0.);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y)); vec2 r = g + hash22(ip + g) - fp; float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; id = ip + g; rv = r; } else if (d < d2) { d2 = d; }
    }
    float h = hash21(id + 7.7);
    if (vE.x < hash21(id + 3.1) * 2.4 - 0.05) discard;
    if (vW.y < 1. && hash21(id + 4.7) * 0.5 + vnoise(vUv * 0.21 + 3.) * 0.65 < uGust * 0.92) discard;      // the rare gust lifts the road off the floor in patches, bare tile between the clumps
    float crease = smoothstep(0.0, 0.17, sqrt(d2) - sqrt(d1));
    float ha = hash21(id + 5.5) * 6.2832, sheen = clamp(0.85 + 0.8 * dot(rv, vec2(cos(ha), sin(ha))), 0.5, 1.45);
    vec3 base = mix(uP1, uP2, smoothstep(0.8, 1., h) * 0.8); base = mix(base, uP3, smoothstep(0.38, 0.05, h));
    vec2 cc = (id + 0.5) * uCell;
    if (hash21(id + 9.3) < 0.93) {
      if (vUv.y > 60.) {
        vec2 q = cc - vec2(0., 113.5); float r = length(q); float a = r > 1e-3 ? atan(q.y, q.x) : 0.;
        float pa = abs(fract(a * 1.9099 + 0.5) - 0.5) * 2., rp = clamp((r - 3.2) / 5.2, 0., 1.);
        if (r < 2.0) base = uP2 * 0.95;
        else if (r < 3.0) base = uP3 * 0.75;
        else if (r < 8.4 && pa < (1. - rp * rp) * 0.9 * smoothstep(0., 0.2, rp)) base = pa < 0.22 * (1. - rp) ? uP4 : uP2 * 0.92;
        else if (r > 9.0 && r < 9.8) base = uP3 * 0.7;
        else if (r > 9.8 && r < 11.0 && pa > 0.45) base = uP2 * 0.9;
      } else if (vUv.y > -500.) {
        float ax = abs(cc.x); if (ax > 4.7 && ax < 5.5) base = uP2 * 0.92; else if (ax > 5.5 && ax < 5.9) base = uP3 * 0.7;
      }
    }
    float body = (0.25 + 0.75 * crease) * sheen * (0.55 + 0.6 * hash21(id + 1.3)) * (0.8 + 0.4 * vnoise(vUv * 5.3)) * (0.75 + 0.5 * vnoise(vUv * 0.16 + 3.));
    vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
    vec3 col = base * body * (uPetal * vE.z * (0.9 + 0.1 * flick(vL)) + lightAt(vL, n, vE.y) * 0.7);
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;
function petalMaterial(U, pal) {
  return shader(U, {
    side: THREE.DoubleSide,
    uniforms: { uP1: { value: pal.orange.clone() }, uP2: { value: mixc(pal.gold, pal.orange, 0.4) }, uP3: { value: pal.deep.clone() }, uP4: { value: (pal.magenta || pal.deep).clone().multiplyScalar(0.8) }, uCell: { value: 0.27 } },
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 aE; varying vec2 vUv; varying vec3 vE, vN, vL, vW;
      void main(){ vUv = uv; vE = aE; vL = position; vec3 P = position;
        vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${V_WORLD} }`,
    fragmentShader: FOG_F + GLSL_COMMON + PETAL_FRAG,
  });
}

const QROT = 'vec3 qrot(vec4 q, vec3 v){ return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }\n';
// instanced marigold heads (and cockscomb): ruffles shaded in the fragment shader, a little fresnel glow
function headMaterial(U) {
  return shader(U, {
    vertexShader: FOG_V + QROT + /* glsl */`
      attribute vec3 iPos, iCol, iDat; attribute vec4 iQuat; attribute vec2 iSc; uniform float uTime;
      varying vec3 vCol, vDat, vN, vL, vW, vP;
      void main(){ vCol = iCol; vDat = iDat; vP = position;
        float ph = iDat.y * 40.;
        vec3 l = position * vec3(iSc.x, iSc.y, iSc.x);
        l.xz += vec2(sin(uTime * 2.1 + ph), cos(uTime * 1.7 + ph * 1.3)) * 0.06 * iSc.x * position.y;
        vec3 P = iPos + qrot(iQuat, l) + vec3(sin(uTime * 1.3 + ph * 0.7), sin(uTime * 1.9 + ph), 0.) * 0.035 * iSc.x;
        vL = P; vN = normalize(mat3(modelMatrix) * qrot(iQuat, normal) + vec3(0., 1e-5, 0.));
        ${V_WORLD} }`,
    fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
      varying vec3 vCol, vDat, vN, vL, vW, vP;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float r = length(vP.xz); float a = r > 1e-3 ? atan(vP.z, vP.x) : 0.;
        // a pom-pom: rings of small scalloped petals, more of them per ring outwards, each its own shade, a darker heart
        float np0 = 7. + 6. * floor(r * 3.6 + 0.25), p0 = abs(fract(a / 6.2832 * np0 + vDat.y * 7.) - 0.5) * 2.;
        float rr = r * 3.6 + 0.42 * p0 * p0, ri = floor(rr), rf = fract(rr), np = 7. + 6. * ri;
        float pc = a / 6.2832 * np + ri * 0.31 + vDat.y * 7., px = abs(fract(pc) - 0.5) * 2.;
        float ph = hash21(vec2(ri * 7.3 + floor(pc), floor(vDat.y * 97.)));
        float shade = mix(0.3, 1.16, smoothstep(0.05, 0.9, rf)) * (0.72 + 0.5 * ph) * (1. - 0.5 * smoothstep(0.62, 1., px));
        shade *= mix(0.45, 1., smoothstep(0.06, 0.3, r)) * (1. - 0.32 * smoothstep(0.84, 1., r)) * (0.86 + 0.28 * fract(vDat.y * 13.7));
        shade = mix(shade, 0.78, clamp((fwidth(rr) + fwidth(pc)) * 0.38, 0., 1.));
        vec3 alb = vCol * shade * mix(vec3(1.), vec3(1.14, 0.9, 0.66), ph * 0.55);
        float fr = 1. - max(dot(n, V), 0.);
        vec3 col = alb * (lightAt(vL, n, vDat.x) + vDat.z * uPetal * (0.55 + 0.6 * fr * fr + 0.25 * uProgress));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// instanced candle bodies: wax that glows under its flame, or a coloured glass votive lit from inside
function candleMaterial(U) {
  return shader(U, {
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 iPos, iCol, iDat; attribute vec2 iSc; uniform float uPool;
      varying vec3 vCol, vDat, vN, vL, vW, vP;
      void main(){ vCol = iCol; vDat = iDat; vP = position;
        vec3 P = iPos + position * vec3(iSc.x, iSc.y, iSc.x) * vec3(1., 1., 1.);
        if (position.y > 1.01) P.y = iPos.y + iSc.y + (position.y - 1.) * 0.9 * iSc.x * 2.;
        if (position.y < -0.2) { float pr = iSc.x * uPool * (1. - iDat.z) * (0.8 + 0.5 * iDat.y); P = iPos + vec3(position.x * pr, 0.05 + 0.05 * step(dot(position.xz, position.xz), 0.01), position.z * pr); }
        vL = P; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        ${V_WORLD} }`,
    fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
      varying vec3 vCol, vDat, vN, vL, vW, vP;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float h = clamp(vP.y, 0., 1.), f = flick(vL + vDat.y * 30.);
        float drip = step(0.72, vnoise(vec2(atan(vP.z, vP.x + 1e-4) * 2.2 + vDat.y * 9., vP.y * 1.5 + vDat.y * 5.)));
        vec3 col;
        if (vDat.z > 0.5) {
          float rim = 1. - max(dot(n, V), 0.);
          col = vCol * (0.25 + 1.2 * h * h + 0.35 * (1. - rim)) * f + uWarm * rim * rim * 0.5 + vCol * lightAt(vL, n, vDat.x) * 0.5;
          col *= 0.8 + 0.3 * step(0.86, h);
        } else {
          vec3 alb = vCol * (0.9 + 0.12 * drip);
          col = alb * lightAt(vL, n, vDat.x) + uWarm * alb * (smoothstep(0.4, 1., h) * 0.9 + 0.06) * f;
        }
        if (vP.y > 1.02) col = vec3(0.02, 0.012, 0.01);
        if (vP.y < -0.2) col *= 0.62;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// camera wake shared by flames and loose petals: 1 just behind the camera, fading over ~19 m
const WAKE = /* glsl */`
  uniform vec3 uCamPosW, uCamDirW, uWindDir; uniform float uLean, uWind, uGust;
  float wake(vec3 bw, float reach, out vec3 lat, out float ld){
    vec3 rel = bw - uCamPosW; float behind = -dot(rel, uCamDirW);
    lat = rel + uCamDirW * behind; ld = length(lat);
    return smoothstep(-2., 3., behind) * (1. - smoothstep(8., 19., behind)) * (1. - smoothstep(reach * 0.4, reach, ld)) * uLean;
  }`;

// all flames: one instanced additive billboard each; they flicker, stream in wind and bow after the camera
function flameMaterial(U) {
  return shader(U, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: FOG_V + WAKE + /* glsl */`
      attribute vec3 iPos, iInfo; uniform float uTime, uProgress, uFlame;
      varying vec2 vQ; varying float vPh, vK;
      void main(){
        vec3 bw = (modelMatrix * vec4(iPos, 1.)).xyz; float ph = iInfo.y;
        vec3 toC = cameraPosition - bw; float dist = length(toC);
        vec3 right = normalize(cross(vec3(0., 1., 0.), toC) + vec3(1e-4, 0., 0.));
        float s = iInfo.x * (1. + 0.55 * clamp(dist / 110., 0., 3.)) * (1. + 0.18 * uProgress) * uFlame;
        vec3 lat; float ld; float w = wake(bw - uCamDirW * 11., 30., lat, ld);
        vec3 lean = uCamDirW * 0.75 - lat / max(ld, 1e-3) * 0.65; lean.y = 0.;
        float h = max(position.y, 0.) / 1.6;
        float fl = sin(uTime * 9. + ph * 40.) * 0.035 + sin(uTime * 5.3 + ph * 17.) * 0.05;
        float tall = iInfo.z * (1. + 0.1 * sin(uTime * 6.1 + ph * 29.)) * (1. - 0.22 * w) * (1. + 0.22 * uWind);
        vec3 wp = bw + right * position.x * s + vec3(0., 1., 0.) * position.y * s * tall
          + (lean * w * 0.7 + right * fl + uWindDir * uWind * (0.75 + 0.3 * sin(uTime * 7. + ph * 9.))) * h * h * s * 1.6 * tall;
        vQ = position.xy; vPh = ph; vK = 1. / (1. + dist * 0.004);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + /* glsl */`
      uniform vec3 uWarm; uniform float uTime; varying vec2 vQ; varying float vPh, vK;
      void main(){
        float fy = clamp(vQ.y / 1.6, 0., 1.);
        float hw = 0.68 * sqrt(fy) * pow(max(1. - fy, 0.), 0.7) + 1e-3;
        float d = abs(vQ.x) / hw;
        float inY = step(0., vQ.y) * step(vQ.y, 1.6);
        float body = (1. - smoothstep(0.55, 1., d)) * inY, core = (1. - smoothstep(0.1, 0.75, d)) * inY * smoothstep(0.02, 0.3, fy);
        vec3 col = vec3(1., 0.4, 0.06) * body * 2.2 + vec3(1., 0.74, 0.3) * core * 4.2;
        col = mix(col, vec3(0.25, 0.4, 1.) * body * 2., (1. - smoothstep(0.0, 0.2, fy)) * 0.7);
        vec2 hp = vec2(vQ.x, (vQ.y - 0.55) * 0.75);
        col += vec3(1., 0.5, 0.13) * exp(-dot(hp, hp) * 3.2) * 0.2 * (0.85 + 0.15 * sin(uTime * 3.1 + vPh * 21.));
        col *= uWarm / max(uWarm.r, 1e-3);
        ${FOG_ADD}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// loose petals: lying on floor and tiers (lifting in the camera's wake and in the gust) and falling from the arch
function loosePetalMaterial(U) {
  return shader(U, {
    side: THREE.DoubleSide,
    vertexShader: FOG_V + WAKE + /* glsl */`
      attribute vec3 iPos; attribute vec4 iA, iB; uniform float uTime, uProgress;
      varying vec3 vCol; varying float vShade;
      void main(){
        float yaw = iA.x, tilt = iA.y, size = iA.z, mode = iA.w, ph = iB.w;
        vec3 base = iPos; vec3 l = position * size; l.y += position.x * position.x * size * 0.35;
        vec3 bw = (modelMatrix * vec4(base, 1.)).xyz; vec3 lat; float ld;
        if (mode > 0.5) {
          float T = 7. + 6. * fract(ph * 5.7), tt = fract(uTime / T + ph);
          base.y -= tt * tilt; base.x += sin(tt * 9. + ph * 20.) * 0.9; base.z += tt * 2.2 + sin(tt * 7. + ph * 31.) * 0.6;
          tilt = tt * 13. + ph * 6.; yaw += tt * 5.;
          // a petal that joins the fall as the arch nears grows in with the progress (in about half a second at the quickest, at the flight's own pace;
          // a faster flight shortens it); it used to switch on whole in one frame
          float jf = fract(ph * 11.3), join = max(step(jf, 0.4), smoothstep(jf, jf + 0.03, 0.4 + 0.63 * uProgress));
          l *= smoothstep(0., 0.06, tt) * (1. - smoothstep(0.92, 1., tt)) * join;
          // the kit's near law for petals (nothing at 0.6 m, whole from 2.5 m): a falling petal dwindles before the lens, never a flat shape across it
          l *= smoothstep(0.6, 2.5, length(cameraPosition - (modelMatrix * vec4(base, 1.)).xyz));
        } else {
          float w = wake(bw - uCamDirW * 9., 13., lat, ld) * (0.4 + 0.6 * fract(ph * 7.3));
          float g = smoothstep(0., 1., uGust * 1.7 - fract(ph * 3.1) * 0.7);
          float up = w * (0.3 + 1.4 * fract(ph * 9.7)) + g * (0.4 + 3.2 * fract(ph * 4.9) * fract(ph * 4.9));
          base.y += up; base += uCamDirW * w * 1.5 * step(0.5, uLean);
          base.x += g * sin(uTime * 1.3 + ph * 40.) * 1.2; float cyc = fract(uTime * (0.36 + 0.42 * fract(ph * 8.1)) + ph); base.z -= g * g * (6. + 10. * fract(ph * 2.3)) + g * cyc * 14.;
          l *= mix(1., smoothstep(0., 0.12, cyc) * (1. - smoothstep(0.85, 1., cyc)), g);
          tilt += up * (1.5 + 2. * fract(ph * 6.1)) * sin(uTime * 2.7 + ph * 30.); yaw += up * 1.3;
          tilt += 0.12 * sin(uTime * 1.6 + ph * 50.);
        }
        float c = cos(tilt), s = sin(tilt); l = vec3(l.x, l.y * c - l.z * s, l.y * s + l.z * c);
        c = cos(yaw); s = sin(yaw); l = vec3(l.x * c + l.z * s, l.y, -l.x * s + l.z * c);
        vec3 P = base + l; vCol = iB.rgb; vShade = 0.75 + 0.25 * position.z + 0.2 * position.x * position.x;
        vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + /* glsl */`
      uniform vec3 uSky; uniform float uPetal, uAmb; varying vec3 vCol; varying float vShade;
      void main(){
        vec3 col = vCol * vShade * (uPetal * 0.8 + uSky * uAmb * 0.4);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// incense: y-axis billboard ribbons with scrolling noise, warm at the bowl, violet above
function smokeMaterial(U, violet) {
  return shader(U, {
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uViolet: { value: violet } },
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 aBase; attribute float aPh; uniform float uTime, uWind; uniform vec3 uWindDir;
      varying vec2 vUv; varying float vPh;
      void main(){
        float h = uv.y, ph = aPh;
        vec3 c = aBase + vec3(sin(uTime * 0.5 + ph * 9. + h * 3.) * 1.3 * h + sin(uTime * 0.23 + h * 7. + ph) * 0.9 * h * h, h * 17.,
          cos(uTime * 0.4 + ph * 5. + h * 2.6) * 0.9 * h) + uWindDir * uWind * h * h * 9.;
        vec3 cw = (modelMatrix * vec4(c, 1.)).xyz;
        vec3 right = normalize(cross(vec3(0., 1., 0.), cameraPosition - cw) + vec3(1e-4, 0., 0.));
        vec3 wp = cw + right * uv.x * (0.3 + 3.6 * h);
        vUv = uv; vPh = ph;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
      uniform vec3 uViolet; varying vec2 vUv; varying float vPh;
      void main(){
        float h = vUv.y;
        vec2 q = vec2(vUv.x * 1.1 + vPh * 13., h * 4.5 - uTime * 0.32 + vPh * 7.);
        float n = vnoise(q) * 0.6 + vnoise(q * 2.3 + 3.1) * 0.4;
        float wisp = smoothstep(0.25, 0.8, n + 0.25 * sin(h * 9. - uTime * 0.6 + vUv.x * 3.));
        float a = (1. - smoothstep(0.15, 1., abs(vUv.x))) * smoothstep(0., 0.05, h) * pow(max(1. - h, 0.), 1.3) * (0.25 + 0.75 * wisp) * 0.55;
        vec3 col = mix(uWarm * 0.9, uViolet * 0.75 + uWarm * 0.12, smoothstep(0., 0.45, h));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}

// cut-paper flags: a few bold cuts (sun, flower, diamonds, zigzag), scalloped hem, fluttering. uv.y = 1 at the cord
function flagMaterial(U) {
  return shader(U, {
    side: THREE.DoubleSide,
    vertexShader: FOG_V + /* glsl */`
      attribute vec3 aCol, aK; uniform float uTime, uWind;
      varying vec2 vUv; varying vec3 vCol, vK, vL, vN, vW;
      void main(){ vUv = uv; vCol = aCol; float zr = step(7.5, aK.x); vK = vec3(aK.x - 8. * zr, aK.yz); vec3 P = position;
        float loose = (1. - clamp(uv.y, 0., 1.)) * step(-0.5, vK.x);
        float wv = sin(uTime * (2.3 + 4. * uWind) + mix(position.x, position.z, zr) * 0.8 + aK.y * 6.) + 0.5 * sin(uTime * 3.7 + position.y * 1.7 + aK.y * 11.);
        float push = wv * loose * (0.28 + 0.9 * uWind) + loose * loose * uWind * 1.2;
        P.z += push * (1. - zr); P.x += push * zr * 0.6; P.y += abs(wv) * loose * 0.06;
        vL = P; vN = normalize(mat3(modelMatrix) * mix(vec3(0.35 * wv * loose, 0., 1.), vec3(1., 0., 0.35 * wv * loose), zr));
        ${V_WORLD} }`,
    fragmentShader: FOG_F + GLSL_COMMON + /* glsl */`
      varying vec2 vUv; varying vec3 vCol, vK, vL, vN, vW;
      void main(){
        vec2 p = vUv;
        if (vK.x > -0.5) {
          if (p.y < 0.07 + 0.075 * abs(sin(p.x * 15.708))) discard;
          vec2 c = p - vec2(0.5, 0.53); float r = length(c * vec2(1., 0.9)); float a = r > 1e-3 ? atan(c.y, c.x) : 0.;
          float inner = step(0.1, p.x) * step(p.x, 0.9) * step(0.2, p.y) * step(p.y, 0.88), cut = 0.;
          if (vK.x < 0.5) cut = step(0.13, r) * step(r, 0.175) + step(0.215, r) * step(r, 0.36) * step(0.15, cos(a * 10.));
          else if (vK.x < 1.5) cut = step(0.095, r) * step(r, 0.33 * (0.55 + 0.45 * cos(a * 6.)));
          else if (vK.x < 2.5) { vec2 q = fract(p * 3.2 + 0.1) - 0.5; cut = step(abs(q.x) + abs(q.y), 0.3); }
          else cut = step(abs(fract(p.y * 3.6 + abs(fract(p.x * 4.) - 0.5)) - 0.5), 0.13);
          if (cut * inner > 0.5) discard;
          if (fract(p.x * 9. + 0.5) < 0.3 && p.y > 0.09 && p.y < 0.15 + 0.03) discard;
        }
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 col = vCol * (lightAt(vL, n, vK.z) + uWarm * 0.1 * vK.z);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// one marigold head: a low nine-sided dome (rim, shoulder, crown); the ruffled petals are drawn by headMaterial
function headBaseGeo() {
  const P = [], I = [], N = 9;
  for (let k = 0; k < N; k++) { const a = (k / N) * TAU; P.push(Math.cos(a), 0, Math.sin(a)); }
  for (let k = 0; k < N; k++) { const a = ((k + 0.5) / N) * TAU; P.push(Math.cos(a) * 0.74, 0.4, Math.sin(a) * 0.74); }
  P.push(0, 0.62, 0);
  for (let k = 0; k < N; k++) { const k2 = (k + 1) % N; I.push(k, N + k, k2, k2, N + k, N + k2, N + k, 2 * N, N + k2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
// a spilt pool of wax round a candle's foot (y = -0.5 marks it; candleMaterial spreads it by uPool): 8 upward triangles
const WAX_POOL = (() => { const o = []; for (let k = 0; k < 8; k++) { const a0 = (k / 8) * TAU, a1 = ((k + 1) / 8) * TAU, r0 = k % 2 ? 0.92 : 1.06, r1 = k % 2 ? 1.06 : 0.92; o.push(0, -0.5, 0, Math.cos(a1) * r1, -0.5, Math.sin(a1) * r1, Math.cos(a0) * r0, -0.5, Math.sin(a0) * r0); } return o; })();

// tube along a list of points with a radius function; returns an indexed geometry with normals
function tubeGeo(pts, radiusFn, sides = 6) {
  const P = [], I = [], n = pts.length, t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < n; i++) {
    t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    a.crossVectors(t, up); if (a.lengthSq() < 1e-6) a.set(1, 0, 0); a.normalize(); b.crossVectors(t, a);
    const r = radiusFn(i / (n - 1), i);
    for (let k = 0; k < sides; k++) { const an = (k / sides) * TAU, c = Math.cos(an) * r, s = Math.sin(an) * r; P.push(pts[i].x + a.x * c + b.x * s, pts[i].y + a.y * c + b.y * s, pts[i].z + a.z * c + b.z * s); }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides, p = i * sides, q = p + sides; I.push(p + k, p + k2, q + k, p + k2, q + k2, q + k); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}

// centre line of the marigold bower: s in metres from the left foot, over the top, to the right foot
const ARCH_LEN = 2 * (ARCH.spring - ARCH.y0) + Math.PI * ARCH.r;
function archFrame(s, out) {
  const leg = ARCH.spring - ARCH.y0;
  if (s < leg) { out.x = -ARCH.r; out.y = ARCH.y0 + s; out.rx = -1; out.ry = 0; }
  else if (s > ARCH_LEN - leg) { out.x = ARCH.r; out.y = ARCH.y0 + (ARCH_LEN - s); out.rx = 1; out.ry = 0; }
  else { const a = Math.PI - (s - leg) / ARCH.r; out.rx = Math.cos(a); out.ry = Math.sin(a); out.x = out.rx * ARCH.r; out.y = ARCH.spring + out.ry * ARCH.r; }
  return out;
}
// point and normal on the bower surface: phi 0 = outer face, PI/2 = front (+z), PI = inside the opening
function archSurface(s, phi, grow, out) {
  const f = archFrame(s, out), c = Math.cos(phi), sn = Math.sin(phi);
  const px = f.x + f.rx * ARCH.tr * c * grow, py = f.y + f.ry * ARCH.tr * c * grow, pz = ARCH.z + ARCH.td * sn * grow;
  let nx = f.rx * c / ARCH.tr, ny = f.ry * c / ARCH.tr, nz = sn / ARCH.td; const l = Math.hypot(nx, ny, nz) || 1;
  out.px = px; out.py = py; out.pz = pz; out.nx = nx / l; out.ny = ny / l; out.nz = nz / l;
  return out;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('marigold-altar') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const ph = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = { indigo: hex(ph[0]), cobalt: hex(ph[1]), orange: hex(ph[2]), gold: hex(ph[3]), violet: hex(ph[4]), magenta: hex(ph[5]), terra: hex(ph[6]) };
  pal.deep = mixc(pal.orange, pal.terra, 0.6); pal.orange.g *= 0.86; pal.orange.b *= 0.5;
  const road = Math.max(12, opts.road ?? 46), roadW = opts.roadWidth ?? 10, burn = clamp(opts.burn ?? 0, 0, 1);
  const wallOpt = opts.wall === false ? null : { width: 60, height: 46, ...(opts.wall || {}) };
  const root = new THREE.Group(); root.name = 'marigold-altar';

  // per-seed character
  const clothScheme = rng.pick([[pal.magenta, pal.violet, pal.orange], [pal.cobalt, pal.magenta, pal.gold], [pal.violet, pal.orange, pal.magenta]]);
  const flagScheme = rng.pick([[pal.magenta, pal.violet], [hex('#e9dcc4'), pal.orange], [pal.magenta, pal.orange, pal.violet, pal.cobalt]]);
  const goldShare = rng.range(0.14, 0.42), accentStyle = rng.int(0, 2), rowStyle = rng.int(0, 2), rowPhase = rng.range(0, TAU);
  const marigold = (r = rng()) => (r < goldShare ? mixc(pal.gold, pal.orange, rng.range(0, 0.35)) : mixc(pal.orange, pal.deep, rng.range(0, 0.45))).multiplyScalar(rng.range(0.8, 1.05));

  const U = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uAmb: { value: 1 }, uPetal: { value: 0.85 }, uFlame: { value: 1 },
    uSky: { value: mixc(pal.cobalt, hex('#7fa6ff'), 0.45).multiplyScalar(0.55) },
    uGround: { value: pal.orange.clone().multiplyScalar(0.3) },
    uWarm: { value: mixc(pal.gold, pal.orange, 0.55) },
    uPool: { value: 1 + 2.1 * burn },
    uCamPosW: { value: new THREE.Vector3(0, 1e4, 0) }, uCamDirW: { value: new THREE.Vector3(0, 0, -1) }, uLean: { value: 0 },
    uWindDir: { value: new THREE.Vector3(0, 0, -1) }, uWind: { value: 0 }, uGust: { value: 0 },
  };

  const B = makeBatch();
  const candles = [], heads = [], censers = [], frames = [], groups = [];
  const WAX = [hex('#efe3c8'), hex('#f3ead6'), hex('#e8c98a'), mixc(pal.orange, hex('#ffffff'), 0.25), mixc(pal.magenta, hex('#ffffff'), 0.2)];
  const GLASS = [mixc(pal.orange, pal.gold, 0.4), pal.magenta.clone(), mixc(pal.cobalt, hex('#6fa0ff'), 0.4), pal.violet.clone(), pal.orange.clone()];
  // kind 0 taper, 1 pillar, 2 glass votive
  function addCandle(x, y, z, kind, hk = 1) {
    let r, h, col, fs;
    if (kind === 0) { r = rng.range(0.1, 0.14); h = Math.max(0.42, rng.range(1.3, 2.5) * hk * (1 - 1.15 * burn)); col = WAX[rng() < 0.75 ? rng.int(0, 1) : rng.int(2, 4)]; fs = 0.3; }
    else if (kind === 1) { r = rng.range(0.24, 0.38); h = Math.max(0.35, rng.range(0.55, 1.25) * hk * (1 - 0.75 * burn)); col = WAX[rng.int(0, 2)]; fs = 0.34; }
    else { r = rng.range(0.27, 0.33); h = rng.range(0.7, 0.85); col = GLASS[rng() < 0.5 ? 0 : rng.int(0, 4)]; fs = 0.25; }
    candles.push({ x, y, z, r, h, kind, col, fs: fs * rng.range(0.9, 1.15) * (1 + 0.08 * burn), fy: y + (kind === 2 ? h * 0.55 : h + r * 0.5) });
  }
  function addHead(x, y, z, nx, ny, nz, r, col, em = 0.6, tall = 1) { heads.push({ x, y, z, nx, ny, nz, r, col, em, tall }); }

  // ---- candle rows on the tiers
  for (let i = 0; i < NT; i++) for (const sx of [-1, 1]) {
    const y = tierY(i), top = i === NT - 1, x0 = top ? 10.9 : AISLE + 0.75, x1 = tierHW(i) - 0.7;
    for (let x = x0 + rng.range(0, 0.3); x < x1; x += rng.range(0.9, 1.12)) if (!rng.chance(0.06)) addCandle(sx * x, y, tierZ(i) - rng.range(0.42, 0.6), 2);
    if (!top) {
      const xe = Math.min(x1, tierHW(i + 1) - 0.4);
      for (let x = x0 + rng.range(0, 0.3), k = 0; x < xe; x += rng.range(0.72, 0.9), k++) {
        const wave = rowStyle === 0 ? 1 : rowStyle === 1 ? 0.72 + 0.34 * Math.sin(x * 0.9 + rowPhase + i) : (k % 5 < 3 ? 1.08 : 0.62);
        addCandle(sx * x, y, tierBack(i) + rng.range(0.45, 0.7), rng.chance(0.86) ? 0 : 1, wave);
      }
      if (i < 4) for (let x = x0 + rng.range(0.3, 0.7); x < xe; x += rng.range(1.2, 1.9)) addCandle(sx * x, y, tierBack(i) + rng.range(1.05, 1.3), rng.chance(0.5) ? 0 : 1, 0.62);
    } else {
      for (let k = 0; k < 9; k++) addCandle(sx * rng.range(11, 15), y, rng.range(-12.9, -8.2), rng.chance(0.5) ? 1 : 0);
    }
    groups.push({ position: new THREE.Vector3(sx * (x0 + x1) * 0.5, y + 1.5, tierZ(i) - 1.75), count: 0 });
  }
  // ---- floor candles flanking the carpet, and two clusters at the corners of the foot
  const carpetHW = (s) => lerp(15, roadW * 0.5, smoothstep(0, Math.min(road, 42), s));
  for (const sx of [-1, 1]) {
    for (let s = 2.5; s < road - 1; s += rng.range(2.6, 3.6)) addCandle(sx * (carpetHW(s) + rng.range(1.0, 1.7)), 0, ZF + s, rng.chance(0.6) ? 1 : 0, 1.15);
    for (let k = 0; k < 16; k++) { const a = rng.range(0, TAU), d = rng.range(0.3, 2.6); addCandle(sx * 18.6 + Math.cos(a) * d, 0, ZF + 2.6 + Math.sin(a) * d * 0.8, rng.int(0, 2), 1.2); }
  }
  await ctx.yield?.();

  // ---- offerings (all go into the one lit batch)
  const C = {
    crust: hex('#c98a3c'), crustD: hex('#8a4f1c'), sugar: hex('#f1e2c0'), clay: pal.terra.clone().multiplyScalar(0.85), clayD: hex('#2a1a18'),
    gilt: hex('#d9a53a'), giltD: hex('#8a5a1a'), orangeF: hex('#ff8a1c'), lime: hex('#9db53c'), glass: hex('#9fc4e6'), white: hex('#efe9dc'),
    cane: hex('#5f7029'), caneD: hex('#4a2f45'), leaf: hex('#5e8a3a'), shoe: mixc(pal.magenta, hex('#3a0d14'), 0.55), wood: hex('#7a4a26'),
  };
  const tmpC = new THREE.Color();
  function loaves(x, y, z) {
    const n = rng.int(2, 3), a0 = rng.range(0, TAU);
    B.add(lathe([[0.02, 0], [1.75, 0], [1.9, 0.1], [1.8, 0.16], [0.02, 0.14]], 12), M(x, y, z), pal.cobalt.clone().multiplyScalar(0.7), [0, 0.5, 0], 0.1, rng);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * TAU, d = n === 2 ? 0.8 : 0.95, lx = x + Math.cos(a) * d, lz = z + Math.sin(a) * d * 0.75, s = rng.range(0.78, 0.95), ry = rng.range(0, TAU);
      const crust = (px, py, pz, o) => { o.copy(C.crustD).lerp(C.crust, clamp(py * 1.4 + 0.45, 0, 1)); if (rng() < 0.3) o.lerp(C.sugar, 0.55); };
      B.add(new THREE.SphereGeometry(1, 9, 6), M(lx, y + 0.5 * s, lz, s * 0.86, s * 0.56, s * 0.86, ry), crust);
      for (let b = 0; b < 2; b++) B.add(new THREE.SphereGeometry(1, 7, 4), M(lx, y + 0.86 * s, lz, s * 0.9, s * 0.2, s * 0.17, ry + b * Math.PI / 2, 0, 0), crust);
      B.add(new THREE.SphereGeometry(1, 6, 4), M(lx, y + 1.08 * s, lz, s * 0.22), crust);
    }
  }
  function fruitPyramid(x, y, z, lime) {
    B.add(lathe([[0.02, 0], [0.7, 0], [1.25, 0.22], [1.38, 0.3], [1.3, 0.34], [0.7, 0.14], [0.02, 0.12]], 12), M(x, y, z), C.clay, [0, 0.35, 0], 0.12, rng);
    const r = lime ? 0.3 : 0.36, base = lime ? C.lime : C.orangeF;
    for (let l = 0, n = 3; n >= 1; n--, l++) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      tmpC.copy(base).multiplyScalar(rng.range(0.78, 1.08)); if (lime && rng() < 0.3) tmpC.lerp(C.orangeF, 0.25);
      const fx = x + (a - (n - 1) / 2) * r * 1.95 + rng.range(-0.03, 0.03), fz = z + (b - (n - 1) / 2) * r * 1.95 + rng.range(-0.03, 0.03);
      const cc = tmpC.clone();
      B.add(new THREE.SphereGeometry(r, 7, 5), M(fx, y + 0.3 + r + l * r * 1.5, fz, 1, 0.93, 1, rng.range(0, TAU), rng.range(-0.4, 0.4)), (px, py, pz, o) => { o.copy(cc); if (py > r * 0.82) o.multiplyScalar(0.45); }, [0.05, 0.3, 0]);
    }
  }
  // an empty gilt frame leaning against the riser behind it; you see the cloth through it
  function frame(x, y, z, w, h) {
    const bw = Math.min(w, h) * 0.17, prof = [[0, 0], [0, 0.55], [0.3, 0.9], [0.55, 0.62], [0.8, 0.95], [1, 0.5], [1, 0]], P = [], I = [];
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let c = 0; c < 4; c++) for (let k = 0; k < prof.length; k++) P.push(cs[c][0] * (w / 2 - bw + prof[k][0] * bw), cs[c][1] * (h / 2 - bw + prof[k][0] * bw) + h / 2, prof[k][1] * bw * 0.8);
    for (let c = 0; c < 4; c++) for (let k = 0; k < prof.length - 1; k++) { const a = c * prof.length + k, b = ((c + 1) % 4) * prof.length + k; I.push(a, a + 1, b, b, a + 1, b + 1); }
    let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g = g.toNonIndexed(); g.computeVertexNormals();
    const lean = -rng.range(0.14, 0.24), ry = rng.range(-0.12, 0.12), mat = M(x, y, z, 1, 1, 1, ry, lean);
    const gcol = (px, py, pz, o) => { o.copy(C.giltD).lerp(C.gilt, clamp(pz / (bw * 0.6), 0, 1)); };
    B.add(g, mat, gcol, [0.04, 1, 0], 0.18, rng);
    for (const c of cs) B.add(new THREE.OctahedronGeometry(bw * 0.62, 1), mat.clone().multiply(M(c[0] * (w / 2 - bw * 0.5), c[1] * (h / 2 - bw * 0.5) + h / 2, bw * 0.6, 1, 1, 0.6)), C.gilt, [0.05, 1, 0]);
    B.add(new THREE.SphereGeometry(bw * 0.9, 7, 4), mat.clone().multiply(M(0, h + bw * 0.15, bw * 0.3, 1.5, 0.8, 0.5)), C.gilt, [0.05, 1, 0]);
    B.add(new THREE.BoxGeometry(bw * 0.5, h * 0.9, bw * 0.3), M(x, y + h * 0.42, z - h * 0.2, 1, 1, 1, ry, 0.22), C.wood);
    frames.push(new THREE.Vector3(x, y + h * 0.5, z));
    addCandle(x + rng.sign() * (w * 0.5 + 0.55), y, z + rng.range(0.5, 0.8), 1, 0.9);
    glassOfWater(x - Math.sign(x) * rng.range(0.2, 0.5) * w, y, z + rng.range(0.75, 1.05));
  }
  function glassOfWater(x, y, z) {
    B.add(lathe([[0.02, 0], [0.24, 0], [0.26, 0.03], [0.31, 0.74], [0.325, 0.76], [0.29, 0.74], [0.25, 0.1], [0.02, 0.08]], 9), M(x, y, z), C.glass, [0.1, 1, 0]);
    B.add(new THREE.CircleGeometry(0.28, 9), M(x, y + 0.56, z, 1, 1, 1, 0, -Math.PI / 2), mixc(C.glass, pal.gold, 0.35), [0.5, 1, 0]);
  }
  function censer(x, y, z) {
    const s = rng.range(1.15, 1.45), stripe = rng.pick([pal.cobalt, pal.magenta, C.white]);
    B.add(lathe([[0.02, 0], [0.52, 0], [0.56, 0.08], [0.26, 0.22], [0.18, 0.55], [0.3, 0.78], [0.62, 1.02], [0.76, 1.36], [0.72, 1.52], [0.63, 1.5], [0.6, 1.34], [0.02, 1.3]], 11), M(x, y, z, s),
      (px, py, pz, o) => { o.copy(C.clayD).lerp(C.clay, 0.35); if (py > 1.08 && py < 1.24) o.copy(stripe).multiplyScalar(0.8); if (py > 1.46) o.lerp(pal.orange, 0.5); }, [0, 0.45, 0]);
    B.add(new THREE.CircleGeometry(0.6, 10), M(x, y + 1.4 * s, z, s, s, s, 0, -Math.PI / 2), (px, py, pz, o) => { o.setRGB(1, 0.3, 0.05).multiplyScalar(rng.range(0.5, 1.3)); }, [3.2, 0, 0]);
    censers.push(new THREE.Vector3(x, y + 1.5 * s, z));
  }
  function vase(x, y, z, s, cock) {
    const band = rng.pick([pal.cobalt, pal.indigo, C.white]);
    B.add(lathe([[0.02, 0], [0.46, 0], [0.5, 0.06], [0.78, 0.5], [0.92, 1.1], [0.72, 1.7], [0.42, 2.02], [0.52, 2.26], [0.44, 2.22], [0.36, 2.0]], 11), M(x, y, z, s),
      (px, py, pz, o) => { o.copy(C.clay); if (py > 0.82 && py < 1.38) { o.copy(band).multiplyScalar(0.75); if (Math.sin(Math.atan2(pz, px) * 6) > 0.3 && py > 0.95 && py < 1.25) o.copy(C.clay).lerp(pal.gold, 0.5); } }, [0, 0.4, 0], 0.1, rng);
    const n = cock ? 9 : 13;
    for (let k = 0; k < n; k++) {
      const a = rng.range(0, TAU), el = k === 0 ? 1.5 : rng.range(0.25, 1.35), rr = (cock ? 0.75 : 0.95) * s;
      const nx = Math.cos(a) * Math.cos(el), ny = Math.sin(el), nz = Math.sin(a) * Math.cos(el);
      const col = cock ? mixc(pal.magenta, hex('#7a0f3a'), rng.range(0, 0.5)) : marigold();
      addHead(x + nx * rr, y + 2.35 * s + ny * rr * (cock ? 1.5 : 0.9), z + nz * rr, nx, ny + 0.4, nz, (cock ? 0.36 : 0.5) * s * rng.range(0.85, 1.15), col, cock ? 0.35 : 0.55, cock ? 2.6 : 1);
    }
  }
  function shoesAndSalt(x, y, z) {
    for (const k of [-1, 1]) {
      const m = M(x + k * 0.42 - 0.9, y, z + k * 0.12, 1, 1, 1, 0.5 + k * 0.1);
      B.add(new THREE.SphereGeometry(1, 8, 4), m.clone().multiply(M(0, 0.07, 0, 0.36, 0.08, 0.82)), C.clayD);
      B.add(new THREE.SphereGeometry(1, 8, 5), m.clone().multiply(M(0, 0.24, 0.36, 0.34, 0.24, 0.46)), C.shoe, [0, 0.9, 0]);
      B.add(new THREE.SphereGeometry(1, 8, 5), m.clone().multiply(M(0, 0.3, -0.34, 0.33, 0.33, 0.42)), C.shoe, [0, 0.9, 0]);
      B.add(new THREE.CircleGeometry(0.24, 8), m.clone().multiply(M(0, 0.615, -0.3, 1, 1.25, 1, 0, -Math.PI / 2)), C.clayD);
      B.add(new THREE.BoxGeometry(0.7, 0.07, 0.13), m.clone().multiply(M(0, 0.47, 0.0)), C.shoe, [0, 0.9, 0]);
      B.add(new THREE.SphereGeometry(0.07, 5, 3), m.clone().multiply(M(k * 0.33, 0.45, 0)), C.gilt, [0.1, 1, 0]);
    }
    B.add(lathe([[0.02, 0], [0.34, 0], [0.72, 0.16], [0.78, 0.24], [0.7, 0.22], [0.02, 0.1]], 10), M(x + 1.0, y, z + 0.2), pal.cobalt.clone().multiplyScalar(0.8), [0, 0.6, 0]);
    B.add(lathe([[0.6, 0.18], [0.34, 0.36], [0.02, 0.48]], 9), M(x + 1.0, y, z + 0.2), C.white, [0.03, 0, 0], 0.08, rng);
  }
  function shawl(x, y, z) {
    const ry = rng.range(-0.3, 0.3), stripes = [pal.magenta, pal.violet, pal.indigo, pal.magenta, pal.orange];
    const scol = (px, py, pz, o) => { const k = Math.floor((px + 3) * 2.4); o.copy(stripes[((k % 5) + 5) % 5]).multiplyScalar(k % 2 ? 0.8 : 0.55); };
    for (let l = 0; l < 3; l++) B.add(new THREE.BoxGeometry(2.7 - l * 0.12, 0.2, 1.7 - l * 0.1, 12, 1, 2), M(x, y + 0.1 + l * 0.2, z + l * 0.04, 1, 1, 1, ry + (l - 1) * 0.03), scol);
    const fr = new THREE.PlaneGeometry(2.5, 0.55, 16, 1); fr.rotateX(-Math.PI / 2);
    B.add(fr, M(x, y + 0.03, z + 1.05, 1, 1, 1, ry), (px, py, pz, o) => { o.copy(Math.round((px + 3) * 6.4) % 2 ? pal.magenta : pal.indigo).multiplyScalar(0.6); });
  }
  function caneArch(xa, xb, y, z) {
    const hc = rng.range(4.6, 6.2);
    for (let c = 0; c < 3; c++) {
      const pts = [], zo = (c - 1) * 0.3, hh = hc + (c - 1) * rng.range(0.2, 0.5), cc = mixc(C.cane, C.caneD, rng.range(0, 0.6));
      for (let k = 0; k <= 14; k++) { const t = k / 14, q = 2 * t - 1; pts.push(new THREE.Vector3(lerp(xa, xb, t) + (c - 1) * 0.12 * q, y + hh * Math.pow(Math.max(1 - q * q, 0), 0.62), z + zo + Math.sin(t * 5 + c) * 0.08)); }
      B.add(tubeGeo(pts, (t, k) => 0.17 * (k % 2 ? 1.22 : 1), 6), M(0, 0, 0), (px, py, pz, o) => { o.copy(cc).multiplyScalar(0.75 + 0.35 * Math.abs(Math.sin(px * 3.1 + py * 2.3))); }, [0, 0.15, 0]);
      for (let l = 0; l < 3; l++) {
        const t = rng.range(0.3, 0.7), q = 2 * t - 1, bx = lerp(xa, xb, t), by = y + hh * Math.pow(1 - q * q, 0.62), len = rng.range(1.8, 2.8), dir = rng.sign(), dz = rng.range(0.4, 1.2);
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.14, 0, 0, 0.14, dir * len * 0.5, 0.5, dz * 0.5 + 0.12, dir * len * 0.5, 0.5, dz * 0.5 - 0.12, dir * len, -0.5, dz], 3));
        lg.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4, 2, 1, 0, 3, 2, 0, 4, 2, 3]); lg.computeVertexNormals();
        B.add(lg, M(bx, by, z + zo), C.leaf, [0, 0.2, 0], 0.3, rng);
      }
    }
  }

  // ---- lay the offerings out: each tier side is cut into slots, a shuffled bag fills them
  const slots = [];
  for (let i = 0; i < NT - 1; i++) for (const sx of [-1, 1]) {
    const x0 = AISLE + 1.3, x1 = tierHW(i) - 1.5, n = Math.max(1, Math.floor((x1 - x0) / 3.2));
    for (let k = 0; k < n; k++) slots.push({ i, sx, x: sx * (x0 + (k + 0.5) * (x1 - x0) / n + rng.range(-0.25, 0.25)), y: tierY(i), z: tierZ(i) - 1.8 + rng.range(-0.15, 0.15), w: (x1 - x0) / n });
  }
  rng.shuffle(slots);
  const bag = [];
  const put = (kind, n) => { for (let k = 0; k < n; k++) bag.push(kind); };
  put('frame', 12); put('loaves', 8); put('orange', 6); put('lime', 3); put('censer', 6); put('vase', 4); put('cock', 3); put('shawl', 1);
  // the shoes and the top want to be seen: low tiers, next to the aisle
  const near = slots.filter((s) => s.i >= 1 && s.i <= 3 && Math.abs(s.x) < 12.5);
  const shoeSlot = near[0] || slots[0], topSlot = near.find((s) => s !== shoeSlot && s.sx !== shoeSlot.sx) || slots[1];
  let topPos = new THREE.Vector3(topSlot.x, topSlot.y, topSlot.z);
  shoesAndSalt(shoeSlot.x, shoeSlot.y, shoeSlot.z); addCandle(shoeSlot.x + 0.2, shoeSlot.y, shoeSlot.z - 0.75, 1, 0.8);
  glassOfWater(topSlot.x + 1.3, topSlot.y, topSlot.z + 0.3); addCandle(topSlot.x - 1.2, topSlot.y, topSlot.z - 0.5, 1, 0.8);
  let bi = 0;
  for (const s of slots) {
    if (s === shoeSlot || s === topSlot) continue;
    await ctx.yield?.();
    const kind = bag[bi++ % bag.length];
    if (kind === 'frame') { const big = rng.range(0.8, 1.4); frame(s.x, s.y, s.z - 0.6, 2.1 * big * rng.range(0.85, 1.15), 2.7 * big * rng.range(0.9, 1.2)); }
    else if (kind === 'loaves') loaves(s.x, s.y, s.z);
    else if (kind === 'orange' || kind === 'lime') fruitPyramid(s.x, s.y, s.z, kind === 'lime');
    else if (kind === 'censer') { censer(s.x, s.y, s.z); if (rng.chance(0.6)) addCandle(s.x + rng.sign() * 1.1, s.y, s.z + 0.3, 1, 0.8); }
    else if (kind === 'vase' || kind === 'cock') vase(s.x, s.y, s.z, rng.range(1.0, 1.3), kind === 'cock');
    else shawl(s.x, s.y, s.z);
    if (rng.chance(0.5)) addCandle(s.x + rng.sign() * s.w * 0.42, s.y, s.z + rng.range(-0.4, 0.5), rng.chance(0.5) ? 1 : 0, 0.8);
  }
  // sugar-cane arches over two or three tiers a side, big vases flanking the bower on the top tier
  const caneTiers = rng.shuffle([1, 2, 3, 4, 5]).slice(0, rng.int(1, 2));
  for (const i of caneTiers) for (const sx of [-1, 1]) { const a = AISLE + 1.0 + rng.range(0, 0.6), b = tierHW(i) - 1.1; caneArch(sx * a, sx * b, tierY(i), tierZ(i) - 1.15); await ctx.yield?.(); }
  for (const sx of [-1, 1]) { vase(sx * 12.6, tierY(6), -9.6, 1.9, false); vase(sx * 14.6, tierY(6), -11.6, 1.5, accentStyle === 1); }
  await ctx.yield?.();

  // ---- marigold suns and crosses pinned to the risers, garland swags under every tier edge
  const motifs = rng.int(7, 10);
  for (let k = 0; k < motifs; k++) {
    const i = rng.int(1, 6), sx = k % 2 ? 1 : -1, x = sx * rng.range(AISLE + 2.6, tierHW(i) - 2.8), yc = tierY(i) - 1.5, z = tierZ(i) + 0.16;
    if (k % 3 !== 2) {
      addHead(x, yc, z, 0, 0, 1, 0.62, marigold(0), 0.75);
      for (let a = 0; a < 8; a++) { const an = (a / 8) * TAU; addHead(x + Math.cos(an) * 0.88, yc + Math.sin(an) * 0.88, z, 0, 0, 1, 0.36, marigold(1), 0.7); }
      for (let a = 0; a < 8; a++) { const an = ((a + 0.5) / 8) * TAU; for (let q = 0; q < 2; q++) addHead(x + Math.cos(an) * (1.42 + q * 0.5), yc + Math.sin(an) * (1.42 + q * 0.5) * 0.9, z, 0, 0, 1, 0.3 - q * 0.07, marigold(1), 0.7); }
    } else {
      for (let q = -2; q <= 1; q++) addHead(x, yc - q * 0.6, z, 0, 0, 1, 0.4, marigold(), 0.7);
      for (const q of [-1.2, -0.6, 0.6, 1.2]) addHead(x + q, yc + 0.45, z, 0, 0, 1, 0.38, marigold(), 0.7);
    }
  }
  for (let i = 0; i < NT; i++) for (const sx of [-1, 1]) {
    const x0 = i === NT - 1 ? 10.4 : AISLE + 0.4, x1 = tierHW(i) - 0.2, n = Math.max(1, Math.round((x1 - x0) / 4.4)), w = (x1 - x0) / n;
    for (let k = 0; k < n; k++) for (let q = 0; q <= 10; q++) {
      const t = q / 10, sag = (0.75 + 0.03 * w * w) * (1 - (2 * t - 1) * (2 * t - 1));
      addHead(sx * (x0 + (k + t) * w), tierY(i) - 0.22 - sag + rng.range(-0.05, 0.05), tierZ(i) + 0.2 + rng.range(0, 0.1), rng.range(-0.3, 0.3), rng.range(-0.2, 0.4), 1, (q === 0 || q === 10 ? 0.42 : 0.31) * rng.range(0.85, 1.15), marigold(), 0.6);
    }
  }
  await ctx.yield?.();
  // ---- the bower: about 1300 heads over a woven body, fat at the feet and the crown
  const af = {}, nArch = Math.round(1320 * lerp(0.75, 1, (detail - 0.6) / 0.4));
  for (let k = 0; k < nArch; k++) {
    const s = rng.range(0, ARCH_LEN), phi = rng.range(-0.75, Math.PI + 0.8);
    archSurface(s, phi, 1.0 + rng.range(-0.04, 0.1), af);
    const band = accentStyle === 2 ? Math.sin(s * 0.9 + phi * 2.2) > 0.55 : accentStyle === 0 ? Math.abs(((s + 3) % 6.5) - 3.25) < 0.55 : false;
    let col = band ? mixc(pal.gold, pal.orange, rng.range(0, 0.2)).multiplyScalar(rng.range(0.9, 1.05)) : marigold();
    if (accentStyle === 1) for (const sc of [ARCH_LEN * 0.5, ARCH.spring - ARCH.y0, ARCH_LEN - (ARCH.spring - ARCH.y0)]) if (Math.abs(s - sc) < 1.5 && Math.abs(phi - Math.PI / 2) < 0.75) col = mixc(pal.magenta, hex('#7a0f3a'), rng.range(0, 0.4));
    addHead(af.px, af.py, af.pz, af.nx, af.ny, af.nz, rng.range(0.55, 1.0), col, 0.5);
  }
  for (let i = 0; i < NT; i++) for (let x = -6.3; x <= 6.3; x += rng.range(0.5, 0.66)) addHead(x, tierY(i) + 0.1, tierZ(i) + 0.05 + rng.range(-0.06, 0.06), rng.range(-0.2, 0.2), 1, 0.9, rng.range(0.24, 0.33), marigold(0), 0.9);
  for (const sx of [-1, 1]) for (let q = 0; q <= 38; q++) {
    const t = q / 38, sag = 2.6 * 4 * t * (1 - t);
    addHead(sx * lerp(7.4, tierHW(6) - 0.7, t), lerp(38.2, 21.5, t) - sag, lerp(-8.0, -7.5, t), rng.range(-0.3, 0.3), 0.3, 1, rng.range(0.36, 0.5), marigold(), 0.6);
  }
  // whole heads along both edges of the carpet and the road
  for (const sx of [-1, 1]) for (let s = 0.6; s < road; s += rng.range(0.7, 1.5) / Math.max(detail, 0.6)) addHead(sx * (carpetHW(s) - rng.range(-0.3, 0.9)), 0.2, ZF + s, rng.range(-0.3, 0.3), 1, rng.range(-0.3, 0.3), rng.range(0.32, 0.5), marigold(), 0.9);

  await ctx.yield?.();
  // ---- tier cores, wall
  const coreC = mixc(pal.indigo, pal.terra, 0.3).multiplyScalar(0.5);
  for (let i = 0; i < NT; i++) {
    const d = tierZ(i) - 0.14 - ZW, hw = tierHW(i) - 0.14;
    B.add(new THREE.BoxGeometry(hw * 2, TH - 0.07, d, 12, 1, 2), M(0, tierY(i) - TH / 2 - 0.035, ZW + d / 2), coreC);
  }
  if (wallOpt) {
    const W = wallOpt.width, H = wallOpt.height, blue = mixc(mixc(pal.indigo, pal.cobalt, 0.55), hex('#8a8aa0'), 0.14), dado = pal.terra.clone().multiplyScalar(0.75);
    B.add(new THREE.PlaneGeometry(W, H, Math.round(W / 2), Math.round(H / 2)), M(0, H / 2, ZW - 0.06), (px, py, pz, o) => {
      const y = py + H / 2; if (y < 8) o.copy(dado); else if (y < 8.5) o.copy(pal.gold).multiplyScalar(0.5); else o.copy(blue);
      o.multiplyScalar(1 - 0.45 * (y / H));
    }, [0, 0, 1]);
  }
  await ctx.yield?.();

  // ---- bake the candle light: candles are clustered on a 2.5 m grid, every vertex sums the clusters
  const cl = new Map();
  for (const c of candles) {
    const k = Math.round(c.x / 2.5) + ',' + Math.round(c.y / 3) + ',' + Math.round(c.z / 2.5);
    let e = cl.get(k); if (!e) cl.set(k, e = [0, 0, 0, 0]);
    e[0] += c.x; e[1] += c.fy; e[2] += c.z; e[3] += 1;
  }
  const CL = new Float32Array(cl.size * 4); let ci = 0;
  for (const e of cl.values()) { CL[ci++] = e[0] / e[3]; CL[ci++] = e[1] / e[3]; CL[ci++] = e[2] / e[3]; CL[ci++] = e[3]; }
  const bake = (x, y, z, nx, ny, nz) => {
    let g = 0;
    for (let k = 0; k < CL.length; k += 4) {
      const dz = CL[k + 2] - z; if (dz > 22 || dz < -22) continue;
      const dx = CL[k] - x, dy = CL[k + 1] - y, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > 484) continue;
      const wrap = (dx * nx + dy * ny + dz * nz) / Math.sqrt(d2 + 0.3) * 0.62 + 0.38;
      if (wrap <= 0) continue;
      const f = 1 + d2 * 0.22; g += CL[k + 3] * wrap / (f * Math.sqrt(f));
    }
    return Math.min(g * 0.32, 1.2);
  };
  for (const g of groups) { let n = 0; for (const c of candles) if (Math.abs(c.x - g.position.x) < 8 && Math.abs(c.y + 1.5 - g.position.y) < 1 ) n++; g.count = n; }

  const litMat = litMaterial(U);
  const lit = new THREE.Mesh(await B.build(bake, ctx), litMat); lit.name = 'offerings'; root.add(lit);
  await ctx.yield?.();

  // ---- the white cloth over the tiers (cut away under the petal aisle)
  const cloth = [];
  for (let i = 0; i < NT; i++) for (const sx of [-1, 1]) {
    const y = tierY(i), zf = tierZ(i), zb = tierBack(i), xa = 6.1, xb = tierHW(i), nx = Math.round((xb - xa) / 0.62);
    cloth.push(gridGeo(Math.ceil(nx / 2), 2, (a, b) => { const x = sx * lerp(xa, xb, a), z = lerp(zf + 0.04, zb, b); return [x, y, z, x, -0.001 - (zf + 0.04 - z), 0, bake(x, y, z, 0, 1, 0)]; }));
    cloth.push(gridGeo(nx, 4, (a, b) => {
      const xx = lerp(xa, xb + 0.04, a), v = b * 2.75, fold = 0.12 * Math.sin(xx * 2.4 + i * 1.7) * b + 0.05 * Math.sin(xx * 5.3 + i) * b * b;
      const z = zf + 0.04 + fold + 0.06 * b; return [sx * xx, y - v, z, sx * xx, v, 0, bake(sx * xx, y - v, z, 0, 0.15, 1)];
    }));
    cloth.push(gridGeo(Math.ceil((zf - ZW) / 0.7), 4, (a, b) => {
      const z = lerp(zf + 0.04, ZW + 0.02, a), v = b * 2.75, x = sx * (xb + 0.04 + 0.1 * Math.sin(z * 2.6 + i) * b + 0.06 * b);
      return [x, y - v, z, z + 50, v, 0, bake(x, y - v, z, sx, 0.15, 0.3) * 0.9 + 0.05];
    }));
    await ctx.yield?.();
  }
  const clothGeo = mergeGrids(cloth);
  await ctx.yield?.();
  const clothMesh = new THREE.Mesh(clothGeo, clothMaterial(U, clothScheme[0].clone().multiplyScalar(0.85), clothScheme[1].clone().multiplyScalar(0.85), clothScheme[2].clone().multiplyScalar(0.9)));
  clothMesh.name = 'cloth'; root.add(clothMesh);
  await ctx.yield?.();

  // ---- petals: carpet and road stub, the runner climbing the aisle, the woven body of the bower
  const pg = [];
  pg.push(gridGeo(14, Math.ceil(road / 2), (a, b) => {
    const s = b * road, hw = carpetHW(s) + 1.2, x = (a * 2 - 1) * hw;
    return [x, 0.15, ZF + s, x, s + 100, hw - Math.abs(x), bake(x, 0.15, ZF + s, 0, 1, 0), 1];
  }));
  await ctx.yield?.();
  let sAcc = 0;
  for (let i = 0; i < NT; i++) {
    const yb = i === 0 ? 0.15 : tierY(i - 1) + 0.08, yt = tierY(i) + 0.08, zf = tierZ(i) + 0.09, zb = tierBack(i) + (i === NT - 1 ? 0 : 0.09), s0 = sAcc;
    pg.push(gridGeo(10, 2, (a, b) => { const x = (a * 2 - 1) * 7.5, y = lerp(yb, yt, b); return [x, y, zf, x, s0 + (y - yb), (7.5 - Math.abs(x)) * 2, bake(x, y, zf, 0, 0.2, 1) * 0.7, lerp(0.42, 0.78, b)]; }));
    sAcc += yt - yb; const s1 = sAcc;
    pg.push(gridGeo(10, 2, (a, b) => { const x = (a * 2 - 1) * 7.5, z = lerp(zf, zb, b); return [x, yt, z, x, s1 + (zf - z), (7.5 - Math.abs(x)) * 2, bake(x, yt, z, 0, 1, 0), b < 0.25 ? 1.12 : b < 0.75 ? 1.0 : 0.55]; }));
    sAcc += zf - zb;
  }
  await ctx.yield?.();
  pg.push(gridGeo(60, 10, (a, b) => {
    const s = a * ARCH_LEN, phi = lerp(-0.95, Math.PI + 0.95, b); archSurface(s, phi, 0.92, af);
    return [af.px, af.py, af.pz, s, phi * 2.1 - 1000, 9, bake(af.px, af.py, af.pz, af.nx, af.ny, af.nz), 0.3];
  }));
  await ctx.yield?.();
  const petalMat = petalMaterial(U, pal);
  const petalMesh = new THREE.Mesh(mergeGrids(pg), petalMat); petalMesh.name = 'petals'; root.add(petalMesh);
  await ctx.yield?.();

  // ---- instanced flower heads
  {
    const base = headBaseGeo();
    const n = heads.length, iPos = new Float32Array(n * 3), iCol = new Float32Array(n * 3), iDat = new Float32Array(n * 3), iQuat = new Float32Array(n * 4), iSc = new Float32Array(n * 2);
    const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), nv = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      const h = heads[k];
      if ((k & 255) === 0) await ctx.yield?.();   // every 256 heads
      nv.set(h.nx, h.ny, h.nz).normalize(); q.setFromUnitVectors(up, nv); q2.setFromAxisAngle(up, rng.range(0, TAU)); q.multiply(q2);
      iPos.set([h.x, h.y, h.z], k * 3); iCol.set([h.col.r, h.col.g, h.col.b], k * 3); iQuat.set([q.x, q.y, q.z, q.w], k * 4);
      iSc.set([h.r, h.r * rng.range(0.85, 1.2) * h.tall], k * 2);
      iDat.set([bake(h.x, h.y, h.z, nv.x, nv.y, nv.z), rng(), h.em], k * 3);
    }
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal);
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
    g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 3)); g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(iQuat, 4));
    g.setAttribute('iSc', new THREE.InstancedBufferAttribute(iSc, 2)); g.instanceCount = n;
    const m = new THREE.Mesh(g, headMaterial(U)); m.frustumCulled = false; m.name = 'marigold-heads'; root.add(m);
  }
  await ctx.yield?.();

  // ---- candles: one instanced body, one instanced flame
  {
    const base = lathe([[1, 0], [0.97, 0.95], [0.72, 1.0], [0.02, 0.9]], 6).toNonIndexed();
    const wick = new THREE.CylinderGeometry(0.1, 0.12, 0.35, 3, 1, true).toNonIndexed(); wick.translate(0, 1.075, 0);
    const bp = [...base.attributes.position.array, ...wick.attributes.position.array, ...WAX_POOL];
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.computeVertexNormals();
    const n = candles.length, iPos = new Float32Array(n * 3), iCol = new Float32Array(n * 3), iDat = new Float32Array(n * 3), iSc = new Float32Array(n * 2), fPos = new Float32Array(n * 3), fInfo = new Float32Array(n * 3);
    candles.forEach((c, k) => {
      iPos.set([c.x, c.y, c.z], k * 3); iCol.set([c.col.r, c.col.g, c.col.b], k * 3); iSc.set([c.r, c.h], k * 2);
      const p = rng(); iDat.set([bake(c.x, c.y + c.h * 0.5, c.z, 0, 0.3, 0.95) * 0.6, p, c.kind === 2 ? 1 : 0], k * 3);
      fPos.set([c.x, c.kind === 2 ? c.y + c.h * 0.8 : c.y + c.h + c.r * 0.35, c.z], k * 3); fInfo.set([c.fs, p, 1 + 0.12 * burn], k * 3);
    });
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', bg.attributes.position); g.setAttribute('normal', bg.attributes.normal);
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
    g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 3)); g.setAttribute('iSc', new THREE.InstancedBufferAttribute(iSc, 2)); g.instanceCount = n;
    const m = new THREE.Mesh(g, candleMaterial(U)); m.frustumCulled = false; m.name = 'candles'; root.add(m);
    const quad = new THREE.PlaneGeometry(2.6, 3.2); quad.translate(0, 0.9, 0);
    const fg = new THREE.InstancedBufferGeometry(); fg.index = quad.index; fg.setAttribute('position', quad.attributes.position);
    fg.setAttribute('iPos', new THREE.InstancedBufferAttribute(fPos, 3)); fg.setAttribute('iInfo', new THREE.InstancedBufferAttribute(fInfo, 3)); fg.instanceCount = n;
    const fm = new THREE.Mesh(fg, flameMaterial(U)); fm.frustumCulled = false; fm.renderOrder = 3; fm.name = 'flames'; root.add(fm);
  }
  await ctx.yield?.();

  // ---- loose petals: lying round the carpet and on the tiers, and falling from the bower
  {
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1, 0.55, 0, -0.3, 0.5, 0, 0.5, 0, 0, 1, -0.5, 0, 0.5, -0.55, 0, -0.3], 3)); base.setIndex([0, 5, 1, 1, 5, 4, 1, 4, 2, 2, 4, 3]);
    const A = [], Bq = [], Pp = [];
    const push = (x, y, z, tilt, size, mode) => { const c = marigold(); Pp.push(x, y, z); A.push(rng.range(0, TAU), tilt, size, mode); Bq.push(c.r, c.g, c.b, rng()); };
    const nA = Math.round(900 * detail), nB = Math.round(520 * detail), nC = Math.round(520 * detail), nD = Math.round(190 * detail);
    for (let k = 0; k < nA; k++) { const s = rng.range(0, road), sx = rng.sign(); push(sx * (carpetHW(s) - 0.4 + Math.abs(rng.gauss()) * 1.7), 0.06, ZF + s, rng.range(-0.2, 0.2), rng.range(0.16, 0.3), 0); }
    for (let k = 0; k < nB; k++) { const s = rng.range(0, road); push(rng.range(-1, 1) * carpetHW(s), 0.24, ZF + s, rng.range(-0.3, 0.3), rng.range(0.16, 0.28), 0); }
    await ctx.yield?.();
    for (let k = 0; k < nC; k++) {
      const i = rng.int(0, NT - 1), edge = rng.chance(0.55), x = edge ? rng.sign() * (6.9 + Math.abs(rng.gauss()) * 1.1) : rng.range(-6.6, 6.6);
      push(x, tierY(i) + (Math.abs(x) < 7.4 ? 0.17 : 0.06), rng.range(tierBack(i) + 0.3, tierZ(i) - 0.1), rng.range(-0.3, 0.3), rng.range(0.16, 0.28), 0);
    }
    for (let k = 0; k < nD; k++) {
      archSurface(rng.range(ARCH_LEN * 0.12, ARCH_LEN * 0.88), rng.range(1.0, Math.PI + 0.3), 1.1, af);
      push(af.px, af.py, af.pz, af.py - ARCH.y0 - 0.2 + rng.range(0, 5), rng.range(0.2, 0.34), 1);
    }
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position);
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(Pp), 3)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(Bq), 4)); g.instanceCount = Pp.length / 3;
    const m = new THREE.Mesh(g, loosePetalMaterial(U)); m.frustumCulled = false; m.name = 'loose-petals'; root.add(m);
  }
  await ctx.yield?.();

  // ---- incense ribbons over the censers
  {
    const P = [], UV = [], BA = [], PH = [], I = []; let v0 = 0; const SEG = 14;
    for (const c of censers) for (let r = 0; r < 2; r++) {
      const ph = rng();
      for (let j = 0; j <= SEG; j++) for (const sd of [-1, 1]) { P.push(c.x, c.y, c.z); UV.push(sd, j / SEG); BA.push(c.x, c.y - 0.1, c.z); PH.push(ph); }
      for (let j = 0; j < SEG; j++) { const a = v0 + j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      v0 += (SEG + 1) * 2;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    g.setAttribute('aBase', new THREE.Float32BufferAttribute(BA, 3)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(PH, 1)); g.setIndex(I);
    const m = new THREE.Mesh(g, smokeMaterial(U, pal.violet.clone())); m.frustumCulled = false; m.renderOrder = 2; m.name = 'incense'; root.add(m);
  }

  // ---- cut-paper flags in two swags a side across the end wall
  if (wallOpt && opts.flags !== false) {
    const P = [], UV = [], CO = [], K = [], I = []; let v0 = 0; const xe = wallOpt.width / 2 - 0.8, zf = ZW + 0.5;
    const cordC = hex('#cdbf9f');
    for (const sx of [-1, 1]) for (const sw of [[10.8, 40.4, xe, 37.6, 1.6], [12.6, 33.6, xe, 28.6, 1.9]]) {
      if (sw[1] > wallOpt.height - 1) continue;
      const len = sw[2] - sw[0], n = Math.max(2, Math.floor(len / 3.05)), at = (t) => [sx * lerp(sw[0], sw[2], t), lerp(sw[1], sw[3], t) - sw[4] * 4 * t * (1 - t)];
      for (let j = 0; j <= 12; j++) { const p = at(j / 12); for (const o of [0.11, -0.11]) { P.push(p[0], p[1] + o, zf); UV.push(0.5, 0.5); CO.push(cordC.r, cordC.g, cordC.b); K.push(-1, 0, bake(p[0], p[1], zf, 0, -0.3, 1)); } }
      for (let j = 0; j < 12; j++) { const a = v0 + j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      v0 += 26;
      for (let k = 0; k < n; k++) {
        const p = at((k + 0.5) / n), col = flagScheme[(k + (sx > 0 ? 1 : 0)) % flagScheme.length].clone().multiplyScalar(0.8), pat = rng.int(0, 3), ph = rng(), gl = bake(p[0], p[1] - 1.5, zf, 0, -0.3, 1) + 0.12;
        const fw = 2.7, fh = rng.range(2.9, 3.3), slope = (at((k + 0.9) / n)[1] - at((k + 0.1) / n)[1]) / (0.8 * len / n);
        for (let b = 0; b <= 4; b++) for (let a = 0; a <= 4; a++) { const dx = (a / 4 - 0.5) * fw; P.push(p[0] + dx, p[1] + sx * dx * slope - (b / 4) * fh, zf + 0.04 + (b / 4) * 0.12); UV.push(a / 4, 1 - b / 4); CO.push(col.r, col.g, col.b); K.push(pat, ph, gl); }
        for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const q = v0 + b * 5 + a; I.push(q, q + 5, q + 1, q + 1, q + 5, q + 6); }
        v0 += 25;
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(CO, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3)); g.setIndex(I);
    const m = new THREE.Mesh(g, flagMaterial(U)); m.name = 'flags'; root.add(m);
  }

  // ---- the spinning top (its own little mesh so it can turn and nod)
  const topPivot = new THREE.Group(), topSpin = new THREE.Group();
  {
    const T = makeBatch(), ring = [pal.magenta, pal.gold, pal.cobalt, pal.orange];
    T.add(lathe([[0.02, 0], [0.07, 0.14], [0.42, 0.62], [0.52, 0.88], [0.44, 1.08], [0.2, 1.2], [0.12, 1.34], [0.17, 1.42], [0.02, 1.45]], 12), M(0, 0, 0, 1.25),
      (px, py, pz, o) => { const a = Math.atan2(pz, px); if (py < 0.2) o.copy(C.giltD); else if (py > 1.1) o.copy(C.wood); else o.copy(Math.sin(a * 2 + py * 5) > 0 ? ring[Math.floor(py * 4.2) % 4] : C.wood).multiplyScalar(0.9); }, [0.05, 0.8, 0]);
    const tm = new THREE.Mesh(await T.build(() => bake(topPos.x, topPos.y + 0.8, topPos.z, 0, 0.5, 0.85), ctx), litMat);
    topSpin.add(tm); topPivot.add(topSpin); topPivot.position.copy(topPos); topPivot.name = 'spinning-top'; root.add(topPivot);
  }
  await ctx.yield?.();

  // ---- anchors
  const TILT = (19 * Math.PI) / 180, dir = new THREE.Vector3(0, Math.sin(TILT), -Math.cos(TILT));
  const seat = new THREE.Vector3(0, 29.5, ARCH.z), zc = ARCH.z + (29.5 - 7) / Math.tan(TILT);
  const anchors = {
    portalSeat: { position: seat.clone(), normal: dir.clone().negate(), tilt: TILT, width: 14, height: 17 },
    flyThrough: [new THREE.Vector3(0, 7, zc + 70), new THREE.Vector3(0, 7, zc + 30), new THREE.Vector3(0, 7.25, zc + 8),
      seat.clone().addScaledVector(dir, -60), seat.clone().addScaledVector(dir, -40), seat.clone().addScaledVector(dir, -20), seat.clone()],
    lookAt: new THREE.Vector3(0, 24, -8),
    viewpoints: { door: new THREE.Vector3(0, 7, 116), carpet: new THREE.Vector3(0, 7, 62), climb: seat.clone().addScaledVector(dir, -30) },
    foot: new THREE.Vector3(0, 0, ZF), roadEnd: new THREE.Vector3(0, 0.15, ZF + road), roadWidth: roadW,
    censers: censers.map((c) => c.clone()), candleGroups: groups, frames, top: topPos.clone(),
    keepOut: [],
  };
  for (let i = 0; i < NT; i++) for (const sx of [-1, 1]) anchors.keepOut.push({ min: new THREE.Vector3(sx > 0 ? AISLE : -tierHW(i), 0, ZW), max: new THREE.Vector3(sx > 0 ? tierHW(i) : -AISLE, tierY(i) + 3, tierZ(i)) });
  for (const sx of [-1, 1]) anchors.keepOut.push({ min: new THREE.Vector3(sx * ARCH.r - 1.6, 21, ARCH.z - 3), max: new THREE.Vector3(sx * ARCH.r + 1.6, 42, ARCH.z + 3) });

  const camNow = new THREE.Vector3(), camPrev = new THREE.Vector3(), vel = new THREE.Vector3();
  let hasPrev = false, lean = 0, forced = false;
  const setCol = (u, v) => { if (v !== undefined && v !== null) u.value.set(v); };
  return {
    object: root, radius: 30, height: 41.5, center: new THREE.Vector3(0, 17, 4), anchors, uniforms: U,
    setProgress(u) { U.uProgress.value = clamp(u, 0, 1); },
    setWind(x, z, k = 1) { const l = Math.hypot(x, z); if (l > 1e-4) U.uWindDir.value.set(x / l, 0, z / l); U.uWind.value = clamp(k, 0, 1); },
    setGust(g) { U.uGust.value = clamp(g, 0, 1); },
    // optional: give the direction of travel (world space) and a lean amount yourself instead of letting update() measure them
    setTravel(d, k = 1) { forced = true; if (d && d.lengthSq() > 1e-6) U.uCamDirW.value.copy(d).normalize(); U.uLean.value = clamp(k, 0, 1); },
    setLight(o = {}) {
      setCol(U.uSky, o.sky); setCol(U.uGround, o.ground); setCol(U.uWarm, o.warm);
      if (o.ambient !== undefined) U.uAmb.value = o.ambient; if (o.petal !== undefined) U.uPetal.value = o.petal; if (o.flame !== undefined) U.uFlame.value = o.flame;
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      topSpin.rotation.y = time * 10.5; topPivot.rotation.set(0.12 * Math.sin(time * 1.3), 0, 0.12 * Math.cos(time * 1.3));
      if (!camera) return;
      camera.getWorldPosition(camNow); U.uCamPosW.value.copy(camNow);
      if (!forced && hasPrev && dt > 1e-4) {
        vel.subVectors(camNow, camPrev); const sp = vel.length() / dt;
        if (sp < 150) {
          if (sp > 0.5) { vel.multiplyScalar(1 / (sp * dt)); const d = U.uCamDirW.value.lerp(vel, Math.min(1, dt * 4)); if (d.lengthSq() > 1e-6) d.normalize(); else d.copy(vel); }
          lean += (smoothstep(2, 8, sp) - lean) * Math.min(1, dt * 3); U.uLean.value = lean;
        }
      }
      camPrev.copy(camNow); hasPrev = true;
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}

// The same glowing petal ribbon for the rest of the house: points = [[x, z, width], ...] in the space of the
// object you add it to (y = height above the floor, default 0.15). Pass uniforms: hero.uniforms to share light.
export function buildPetalRoad(ctx, o = {}) {
  const ph = o.palette && o.palette.length >= 7 ? o.palette : DEFAULT_PALETTE, pts = o.points || [[0, 0, 6], [0, 40, 6]], y = o.y ?? 0.15;
  const pal = { orange: hex(ph[2]), gold: hex(ph[3]) }; pal.deep = mixc(pal.orange, hex(ph[6]), 0.6); pal.orange.g *= 0.86; pal.orange.b *= 0.5;
  const U = o.uniforms || {
    uTime: { value: 0 }, uProgress: { value: 0 }, uAmb: { value: 1 }, uPetal: { value: 1.4 },
    uSky: { value: hex(ph[1]).multiplyScalar(0.45) }, uGround: { value: pal.orange.clone().multiplyScalar(0.3) }, uWarm: { value: mixc(pal.gold, pal.orange, 0.55) },
  };
  // resample the polyline every ~2 m
  const S = []; let acc = 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 2));
    for (let j = k === 0 ? 0 : 1; j <= n; j++) { const t = j / n; S.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), acc + len * t]); }
    acc += len;
  }
  const g = gridGeo(8, S.length - 1, (a, b) => {
    const k = Math.round(b * (S.length - 1)), p = S[k], q0 = S[Math.max(k - 1, 0)], q1 = S[Math.min(k + 1, S.length - 1)];
    let tx = q1[0] - q0[0], tz = q1[1] - q0[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const hw = p[2] * 0.5 + 0.5, lat = (a * 2 - 1) * hw, band = Math.min(1.3, hw * 0.55);
    return [p[0] + tz * lat, y, p[1] - tx * lat, lat, p[3] - 4000, (hw - Math.abs(lat)) * 2.4 / band, o.glow ?? 0, 1];
  });
  const mesh = new THREE.Mesh(mergeGrids([g]), petalMaterial(U, pal)); mesh.name = 'petal-road';
  return { object: mesh, uniforms: U, material: mesh.material, update(dt, time) { if (!o.uniforms) U.uTime.value = time; } };
}

// ---------------------------------------------------------------- shared with the world file
// The house uses the altar's shader family so everything sits in the same light. All take the hero's
// uniform table U and a bake(x, y, z, nx, ny, nz) -> candle glow function of the caller's own.
export const heroKit = { makeBatch, M, lathe, gridGeo, mergeGrids, tubeGeo, shader, litMaterial, hex, mixc, GLSL_COMMON, FOG_V, FOG_F, FOG_ADD, V_WORLD, WAKE, QROT };

// candles: [{ x, y, z, r, h, kind (0 taper, 1 pillar, 2 glass), col, fs (flame size) }] -> { body, flames } (2 draw calls)
export function makeCandleSet(U, candles, bake, rng, burn = 0) {
  const base = lathe([[1, 0], [0.97, 0.95], [0.72, 1.0], [0.02, 0.9]], 6).toNonIndexed();
  const wick = new THREE.CylinderGeometry(0.1, 0.12, 0.35, 3, 1, true).toNonIndexed(); wick.translate(0, 1.075, 0);
  const bp = [...base.attributes.position.array, ...wick.attributes.position.array, ...WAX_POOL];
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.computeVertexNormals();
  base.dispose(); wick.dispose();
  const n = candles.length, iPos = new Float32Array(n * 3), iCol = new Float32Array(n * 3), iDat = new Float32Array(n * 3), iSc = new Float32Array(n * 2), fPos = new Float32Array(n * 3), fInfo = new Float32Array(n * 3);
  candles.forEach((c, k) => {
    iPos.set([c.x, c.y, c.z], k * 3); iCol.set([c.col.r, c.col.g, c.col.b], k * 3); iSc.set([c.r, c.h], k * 2);
    const p = rng(); iDat.set([bake(c.x, c.y + c.h * 0.5, c.z, 0, 0.3, 0.95) * 0.6, p, c.kind === 2 ? 1 : 0], k * 3);
    fPos.set([c.x, c.kind === 2 ? c.y + c.h * 0.8 : c.y + c.h + c.r * 0.35, c.z], k * 3); fInfo.set([c.fs, p, 1 + 0.12 * burn], k * 3);
  });
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', bg.attributes.position); g.setAttribute('normal', bg.attributes.normal);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
  g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 3)); g.setAttribute('iSc', new THREE.InstancedBufferAttribute(iSc, 2)); g.instanceCount = n;
  const body = new THREE.Mesh(g, candleMaterial(U)); body.frustumCulled = false; body.name = 'house-candles';
  const quad = new THREE.PlaneGeometry(2.6, 3.2); quad.translate(0, 0.9, 0);
  const fg = new THREE.InstancedBufferGeometry(); fg.index = quad.index; fg.setAttribute('position', quad.attributes.position);
  fg.setAttribute('iPos', new THREE.InstancedBufferAttribute(fPos, 3)); fg.setAttribute('iInfo', new THREE.InstancedBufferAttribute(fInfo, 3)); fg.instanceCount = n;
  const flames = new THREE.Mesh(fg, flameMaterial(U)); flames.frustumCulled = false; flames.renderOrder = 3; flames.name = 'house-flames';
  return { body, flames };
}

// heads: [{ x, y, z, nx, ny, nz, r, col, em, tall }] -> one instanced mesh of flower heads (async: pass ctx and await it)
export async function makeHeadSet(U, heads, bake, rng, ctx) {
  const base = headBaseGeo();
  const n = heads.length, iPos = new Float32Array(n * 3), iCol = new Float32Array(n * 3), iDat = new Float32Array(n * 3), iQuat = new Float32Array(n * 4), iSc = new Float32Array(n * 2);
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), nv = new THREE.Vector3();
  for (let k = 0; k < n; k++) {
    const h = heads[k];
    if ((k & 255) === 0) await ctx?.yield?.();   // every 256 heads
    nv.set(h.nx, h.ny, h.nz); if (nv.lengthSq() < 1e-6) nv.set(0, 1, 0); nv.normalize(); q.setFromUnitVectors(up, nv); q2.setFromAxisAngle(up, rng.range(0, TAU)); q.multiply(q2);
    iPos.set([h.x, h.y, h.z], k * 3); iCol.set([h.col.r, h.col.g, h.col.b], k * 3); iQuat.set([q.x, q.y, q.z, q.w], k * 4);
    iSc.set([h.r, h.r * rng.range(0.85, 1.2) * (h.tall ?? 1)], k * 2);
    iDat.set([bake(h.x, h.y, h.z, nv.x, nv.y, nv.z), rng(), h.em ?? 0.6], k * 3);
  }
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
  g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 3)); g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(iQuat, 4));
  g.setAttribute('iSc', new THREE.InstancedBufferAttribute(iSc, 2)); g.instanceCount = n;
  const m = new THREE.Mesh(g, headMaterial(U)); m.frustumCulled = false; m.name = 'house-heads';
  return m;
}

// loose petals lying on the floor: list of [x, y, z, size, r, g, b]; they lift in the camera's wake and in the gust
export function makeLoosePetalSet(U, list, rng) {
  const base = new THREE.BufferGeometry();
  base.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1, 0.55, 0, -0.3, 0.5, 0, 0.5, 0, 0, 1, -0.5, 0, 0.5, -0.55, 0, -0.3], 3)); base.setIndex([0, 5, 1, 1, 5, 4, 1, 4, 2, 2, 4, 3]);
  const n = list.length, Pp = new Float32Array(n * 3), A = new Float32Array(n * 4), Bq = new Float32Array(n * 4);
  list.forEach((p, k) => { Pp.set([p[0], p[1], p[2]], k * 3); A.set([rng.range(0, TAU), rng.range(-0.25, 0.25), p[3], 0], k * 4); Bq.set([p[4], p[5], p[6], rng()], k * 4); });
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(Pp, 3)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(Bq, 4)); g.instanceCount = n;
  const m = new THREE.Mesh(g, loosePetalMaterial(U)); m.frustumCulled = false; m.name = 'house-loose-petals';
  return m;
}

// cut-paper flags on cords strung along x: rows = [{ x0, x1, y, z, sag, n, w, h, colors: [Color] }] -> one mesh
export function makeFlagSet(U, rows, bake, rng) {
  const P = [], UV = [], CO = [], K = [], I = []; let v0 = 0; const cordC = hex('#cdbf9f');
  for (const r of rows) {
    // a row runs along x at depth r.z, or (zrow) along z against a side wall at x = r.z, hanging on its room side (face)
    const zr = !!r.zrow, f = r.face ?? 1, put = (a, y, d) => { if (zr) P.push(r.z + f * d, y, a); else P.push(a, y, r.z + d); };
    const glowAt = (a, y) => (zr ? bake(r.z + f * 0.3, y, a, f, -0.3, 0) : bake(a, y, r.z, 0, -0.3, 1));
    const at = (t) => [lerp(r.x0, r.x1, t), r.y - r.sag * 4 * t * (1 - t)], len = Math.abs(r.x1 - r.x0), cw = r.cord ?? 0.13;
    for (let j = 0; j <= 12; j++) { const p = at(j / 12); for (const o of [cw, -cw]) { put(p[0], p[1] + o, 0); UV.push(0.5, 0.5); CO.push(cordC.r, cordC.g, cordC.b); K.push(-1, 0, glowAt(p[0], p[1])); } }
    for (let j = 0; j < 12; j++) { const a = v0 + j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    v0 += 26;
    for (let k = 0; k < r.n; k++) {
      const p = at((k + 0.5) / r.n), col = r.colors[k % r.colors.length].clone().multiplyScalar(0.8), pat = rng.int(0, 3) + (zr ? 8 : 0), ph = rng(), gl = glowAt(p[0], p[1] - r.h * 0.5) + 0.12;
      const fh = r.h * rng.range(0.94, 1.06), slope = (at((k + 0.9) / r.n)[1] - at((k + 0.1) / r.n)[1]) / Math.max(0.8 * len / r.n, 1e-3) * Math.sign(r.x1 - r.x0 || 1);
      for (let b = 0; b <= 4; b++) for (let a = 0; a <= 4; a++) { const dx = (a / 4 - 0.5) * r.w; put(p[0] + dx, p[1] + dx * slope - (b / 4) * fh, 0.04 + (b / 4) * 0.12); UV.push(a / 4, 1 - b / 4); CO.push(col.r, col.g, col.b); K.push(pat, ph, gl); }
      for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const q = v0 + b * 5 + a; I.push(q, q + 5, q + 1, q + 1, q + 5, q + 6); }
      v0 += 25;
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(CO, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3)); g.setIndex(I);
  const m = new THREE.Mesh(g, flagMaterial(U)); m.name = 'house-flags';
  return m;
}
