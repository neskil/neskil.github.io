// OVER THE RIM: a red cable-car cabin glides over a plateau market of striped tarpaulins, passes between zigzag
// mansions, tips over the canyon rim, and a terracotta city poured into a bowl opens underfoot beneath a
// triple-summit ice mountain; then it runs down the wall a few metres above the tin roofs.
// World coordinates are the brief's: +X east along the cable (travel), +Z south (right of travel), Y above the
// plateau, the cliff lip at x = 0. The bowl, ropeway and peak are the hero (src/parts/over-the-rim.js); this file
// adds the cabin we ride, the market, mansions, the full-detail houses of the two close passes, traffic, kites,
// birds and the looks.
// Looks by seed / ctx.vary.hour: noon (default), golden (late afternoon, near wall in shade), night (basin of
// lights, lantern cabins), cloudsea (morning cloud sea in the bowl). Season wet/dry and festival days by seed.
// Rare event: a condor rises at the rim and glides beside the cabin down the first spur.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField, skyDirection } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import { buildHero, RIM_GLSL, RIM_PLACES, returnZ } from '../parts/over-the-rim.js';

const PALETTE = ['#143F9E', '#B4603D', '#CFA57C', '#F4F8FC', '#D62222', '#10A56B', '#7A3DB8'];
const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const C3 = (h) => new THREE.Color(h);

// ---------- looks ----------
// The air of the bowl by day, one rule of distance for every day look (the shader's bowlAir): DAY_AIR is the haze that
// gathers between 150 m and 1.5 km and pools low in the bowl, DAY_AIR_FAR the veil that grows from 1.3 km to the far rim
// at 3.9 km, so every ridge of the far wall stands a value lighter than the one before it. The colour of that air is
// each look's own (haze: the colour of its horizon sky at that hour). The night keeps its own thinner veil; the dawn
// look has none, its bowl is under the cloud deck.
const DAY_AIR = 0.12, DAY_AIR_FAR = 0.50;
const LOOKS = {
  // the default hour: afternoon, a warm sun 28 degrees up behind the cabin and to its left. Spurs, ridges and the towers
  // on the floor throw long blue shadows, the far wall takes the light full on, and the air is thin: the city stays crisp.
  noon: {
    title: 'Over the Rim', el: 28, az: -44, night: 0, rim: 0, cloudY: -1e5, bounce: 1.5, air: DAY_AIR, airFar: DAY_AIR_FAR, farK: [0.18, 0.4],
    sky: { preset: 'day', zenith: '#10338c', mid: '#2553b2', horizon: '#b4cdea', ground: '#9aa9c0', horizonPow: 5.5, midPow: 1.15, scatterColor: '#ffe2b8', scatter: 0.25, scatterPow: 6,
      sunColor: '#FFEFD6', sunSize: 0.7, sunIntensity: 13, sunGlow: 0.45, clouds: false, clouds2: false,
      lightColor: '#FFDDB0', lightIntensity: 3.3, ambientColor: '#40609f', groundLight: '#7a5a42', ambientIntensity: 1.5 },
    sun: [1.48, 1.07, 0.69], skyc: [0.125, 0.195, 0.40], haze: [0.52, 0.63, 0.88], zen: [0.05, 0.14, 0.42],
    fog: '#b4c8e6', density: 0.00015, exposure: 1.0, bloom: { strength: 0.18, radius: 0.45, threshold: 1.0 },
    grade: { saturation: 1.05, contrast: 1.10, tint: '#fff9f0', shadowTint: '#070b26', vignette: 0.24, grain: 0.015 }, portal: '#8fe6ff',
  },
  golden: {
    title: 'Over the Rim, Late Sun', el: 15, az: -52, night: 0, rim: 0.65, cloudY: -1e5, bounce: 1.0, air: DAY_AIR, airFar: DAY_AIR_FAR, farK: [0.14, 0.35],
    sky: { preset: 'goldenHour', zenith: '#16307a', mid: '#6a6aa8', horizon: '#ffb47a', ground: '#8a6a68', horizonPow: 9, midPow: 1.3, scatterColor: '#ff9a4a', scatter: 0.9, scatterPow: 5,
      sunColor: '#ffc27a', sunSize: 0.9, sunIntensity: 13, sunGlow: 0.9, clouds: false, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.5, lit: '#ffc9a0', shade: '#7a6a90', haze: 1.4 },
      lightColor: '#ffb46a', lightIntensity: 3.0, ambientColor: '#5a62a0', groundLight: '#7a5040', ambientIntensity: 1.5, lightElevationMin: 12 },
    sun: [1.40, 0.90, 0.56], skyc: [0.18, 0.25, 0.52], haze: [0.84, 0.66, 0.58], zen: [0.07, 0.12, 0.36],
    fog: '#d8a890', density: 0.00012, exposure: 1.04, bloom: { strength: 0.22, radius: 0.5, threshold: 1.0 },
    grade: { saturation: 1.0, contrast: 1.08, tint: '#fff6ea', shadowTint: '#0a0a2c', vignette: 0.26, grain: 0.015 }, portal: '#9fe8ff',
  },
  night: {
    title: 'Over the Rim by Night', el: 52, az: -34, night: 1, rim: 0, cloudY: -1e5, air: 0.12, airFar: 0.3,
    sky: { preset: 'night', zenith: '#030716', mid: '#07102a', horizon: '#1a2748', ground: '#0a0e1a', horizonPow: 3, stars: 1, clouds: false, clouds2: false,
      bodyOverrides: { 0: { elevation: 52, azimuth: -34, size: 1.6 } },
      lightColor: '#9db8ff', lightIntensity: 0.7, ambientColor: '#34488a', groundLight: '#3a2a22', ambientIntensity: 0.95, lightElevationMin: 30 },
    sun: [0.17, 0.23, 0.38], skyc: [0.07, 0.095, 0.18], haze: [0.07, 0.10, 0.19], zen: [0.010, 0.016, 0.045],
    fog: '#101830', density: 0.00016, exposure: 1.12, bloom: { strength: 0.3, radius: 0.6, threshold: 0.9 },
    grade: { saturation: 1.12, contrast: 1.03, tint: '#f4f6ff', shadowTint: '#03061a', vignette: 0.26, grain: 0.02 }, portal: '#9fe8ff',
  },
  cloudsea: {
    title: 'Over the Rim, Cloud Sea', el: 12, az: 34, night: 0, rim: 0, cloudY: -198,
    sky: { preset: 'dawn', zenith: '#1c3a8a', mid: '#5a78b8', horizon: '#f6c8b4', ground: '#b8a8b8', horizonPow: 3, midPow: 1.3, scatterColor: '#ff9e7a', scatter: 0.8, scatterPow: 5,
      sunColor: '#ffd0a0', sunSize: 0.9, sunIntensity: 12, sunGlow: 0.9, stars: 0, cloudLit: '#ffe4cc', cloudShade: '#66709e', clouds: false, clouds2: { coverage: 0.28, stretch: 1, opacity: 0.5, lit: '#ffd2c0', shade: '#8088b0', haze: 1.4 },
      lightColor: '#ffbe94', lightIntensity: 2.9, ambientColor: '#5a70b0', groundLight: '#8a7078', ambientIntensity: 1.5, lightElevationMin: 12 },
    sun: [1.42, 0.92, 0.66], skyc: [0.14, 0.17, 0.31], haze: [0.92, 0.72, 0.68], zen: [0.08, 0.15, 0.40],
    fog: '#e6c4c0', density: 0.00014, exposure: 1.0, bloom: { strength: 0.24, radius: 0.5, threshold: 1.0 },
    grade: { saturation: 1.08, contrast: 1.06, tint: '#fff8f2', shadowTint: '#0a0c2a', vignette: 0.24, grain: 0.015 }, portal: '#9fe8ff',
  },
};

// ---------- a small merged-geometry builder: position, normal, aCol, uv (metres), aK = (kind, seed, wind, emit) ----------
const KIND = { PLAIN: 0, BRICK: 1, TIN: 2, MANSION: 3, CLOTH: 4, GLASS: 5, CONC: 6, ROAD: 7, LEAF: 8, NICHE: 9, MURAL: 10 };
class GB {
  constructor() { this.P = []; this.N = []; this.C = []; this.U = []; this.K = []; this.I = []; this.r = 1; this.g = 1; this.b = 1; this.k = [0, 0, 0, 0]; this.ox = 0; this.oy = 0; this.oz = 0; this.cs = 1; this.sn = 0; this.shade = 1; }
  at(x, y, z, ry = 0) { this.ox = x; this.oy = y; this.oz = z; this.cs = Math.cos(ry); this.sn = Math.sin(ry); return this; }
  col(c, m = 1) { if (typeof c === 'string') c = C3(c); this.r = c.r * m; this.g = c.g * m; this.b = c.b * m; return this; }
  rgb(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
  kind(kind, seed = 0, wind = 0, emit = 0) { this.k = [kind, seed, wind, emit]; return this; }
  v(x, y, z, nx, ny, nz, u, w, m = 1) {
    const c = this.cs, s = this.sn;
    this.P.push(this.ox + c * x + s * z, this.oy + y, this.oz - s * x + c * z); this.N.push(c * nx + s * nz, ny, -s * nx + c * nz);
    this.C.push(this.r * m, this.g * m, this.b * m); this.U.push(u, w); this.K.push(this.k[0], this.k[1], this.k[2], this.k[3]);
    return this.P.length / 3 - 1;
  }
  // four corners counter-clockwise seen from the front; uv = (0,0) (w,0) (w,h) (0,h) in metres unless given
  quad(a, b, c, d, uv = null, m0 = 1, m1 = 1) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const w = Math.hypot(ux, uy, uz), h = Math.hypot(vx, vy, vz), q = uv || [0, 0, w, h];
    const i = this.v(a[0], a[1], a[2], nx, ny, nz, q[0], q[1], m0);
    this.v(b[0], b[1], b[2], nx, ny, nz, q[2], q[1], m0); this.v(c[0], c[1], c[2], nx, ny, nz, q[2], q[3], m1); this.v(d[0], d[1], d[2], nx, ny, nz, q[0], q[3], m1);
    this.I.push(i, i + 1, i + 2, i, i + 2, i + 3); return this;
  }
  // box centred on x,z with its base at y; ry = extra yaw; m0 darkens the foot of the walls; faces: bit mask (1 top, 2 sides, 4 bottom)
  box(w, h, d, x, y, z, ry = 0, m0 = 1, faces = 3, u0 = 0) {
    const c = Math.cos(ry), s = Math.sin(ry), hw = w / 2, hd = d / 2;
    const p = (lx, ly, lz) => [x + c * lx + s * lz, y + ly, z - s * lx + c * lz];
    if (faces & 2) {
      this.quad(p(-hw, 0, hd), p(hw, 0, hd), p(hw, h, hd), p(-hw, h, hd), [u0, 0, u0 + w, h], m0, 1);
      this.quad(p(hw, 0, hd), p(hw, 0, -hd), p(hw, h, -hd), p(hw, h, hd), [u0 + w, 0, u0 + w + d, h], m0, 1);
      this.quad(p(hw, 0, -hd), p(-hw, 0, -hd), p(-hw, h, -hd), p(hw, h, -hd), [u0 + w + d, 0, u0 + 2 * w + d, h], m0, 1);
      this.quad(p(-hw, 0, -hd), p(-hw, 0, hd), p(-hw, h, hd), p(-hw, h, -hd), [u0 + 2 * w + d, 0, u0 + 2 * (w + d), h], m0, 1);
    }
    if (faces & 1) this.quad(p(-hw, h, hd), p(hw, h, hd), p(hw, h, -hd), p(-hw, h, -hd), [-hw, -hd, hw, hd]);
    if (faces & 4) this.quad(p(-hw, 0, -hd), p(hw, 0, -hd), p(hw, 0, hd), p(-hw, 0, hd), [-hw, -hd, hw, hd], m0, m0);
    return this;
  }
  // upright cylinder (or cone) with a top cap
  cyl(r0, r1, h, x, y, z, sides = 8, cap = true, m0 = 1) {
    const b = [];
    for (let i = 0; i <= sides; i++) {
      const a = i / sides * TAU, ca = Math.cos(a), sa = Math.sin(a);
      b.push(this.v(x + ca * r0, y, z + sa * r0, ca, 0.2, sa, i / sides * TAU * r0, 0, m0)); this.v(x + ca * r1, y + h, z + sa * r1, ca, 0.2, sa, i / sides * TAU * r0, h, 1);
    }
    for (let i = 0; i < sides; i++) { const q = b[i], n = b[i + 1]; this.I.push(q, q + 1, n, q + 1, n + 1, n); }
    if (cap && r1 > 0.01) {
      const c0 = this.v(x, y + h, z, 0, 1, 0, 0, 0);
      for (let i = 0; i <= sides; i++) { const a = i / sides * TAU; this.v(x + Math.cos(a) * r1, y + h, z + Math.sin(a) * r1, 0, 1, 0, Math.cos(a) * r1, Math.sin(a) * r1); }
      for (let i = 0; i < sides; i++) this.I.push(c0, c0 + i + 2, c0 + i + 1);
    }
    return this;
  }
  // a squashed blob (octahedron subdivided once) for crowns, sacks, heaps; uv.y = height fraction (wind weight)
  blob(rx, ry, rz, x, y, z, m0 = 0.6) {
    const V = [[0, 1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1, 0]], T = [[0, 2, 1], [0, 3, 2], [0, 4, 3], [0, 1, 4], [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1]];
    for (const t of T) {
      const a = V[t[0]], b = V[t[1]], c = V[t[2]], mid = (p, q) => { const m = [p[0] + q[0], p[1] + q[1], p[2] + q[2]], l = Math.hypot(m[0], m[1], m[2]); return [m[0] / l, m[1] / l, m[2] / l]; };
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      for (const f of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) {
        const i0 = this.P.length / 3;
        for (const n of f) this.v(x + n[0] * rx, y + n[1] * ry, z + n[2] * rz, n[0], n[1], n[2], 0, n[1] * 0.5 + 0.5, lerp(m0, 1, n[1] * 0.5 + 0.5));
        this.I.push(i0, i0 + 1, i0 + 2);
      }
    }
    return this;
  }
  world(x, y, z) { return [this.ox + this.cs * x + this.sn * z, this.oy + y, this.oz - this.sn * x + this.cs * z]; }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.K, 4)); g.setIndex(this.I);
    g.computeBoundingSphere();
    return g;
  }
  // the same geometry for the big merged meshes, handing the page back between attributes
  async buildAsync(ctx) {
    const g = new THREE.BufferGeometry();
    for (const [name, a, n] of [['position', this.P, 3], ['normal', this.N, 3], ['aCol', this.C, 3], ['uv', this.U, 2], ['aK', this.K, 4]]) { g.setAttribute(name, new THREE.Float32BufferAttribute(a, n)); await ctx.yield(); }
    g.setIndex(this.I); await ctx.yield();
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- shaders (self-lit like the hero: its sun, sky, night, rim shade and height-map shadow uniforms are shared) ----------
const FOGV = '#include <common>\n#include <fog_pars_vertex>\n', FOGF = '#include <common>\n#include <fog_pars_fragment>\n';
const PROP_VERT = FOGV + /* glsl */`
  attribute vec3 aCol; attribute vec4 aK; uniform float uTime;
  varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vK;
  void main(){
    vec3 p = position; vec3 n = normal; vCol = aCol; vK = aK; vUv = uv;
    float w = abs(aK.z) * uv.y * (aK.x > 3.5 && aK.x < 4.5 ? 1.8 : 1.0);   // cloth snaps harder than leaves toss
    if (w > 0.0) {
      float ph = aK.y * 40.0 + position.x * 0.6 + position.z * 0.8;
      float fl = sin(uTime * 4.4 + ph) * 0.6 + sin(uTime * 7.9 + ph * 1.7) * 0.4;
      p += (aK.z > 0.0 ? normal * fl * w : vec3(0.0)) + vec3(0.8, 0.0, 0.5) * w * (0.35 + 0.65 * sin(uTime * 1.3 + ph * 0.3)) * (aK.z > 0.0 ? 0.6 : 1.0);
    }
    #ifdef USE_INSTANCING
      p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
    #endif
    #ifdef USE_INSTANCING_COLOR
      if (aK.w < 0.0) vCol *= instanceColor;
    #endif
    vec4 wp = modelMatrix * vec4(p, 1.0); vP = wp.xyz; vN = mat3(modelMatrix) * n;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const PROP_FRAG = FOGF + RIM_GLSL + /* glsl */`
  uniform float uSelf; uniform float uBounce; uniform vec3 uAcc[3];
  varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vK;
  float tri(float x){ return abs(fract(x) - 0.5) * 2.0; }
  void main(){
    vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)); if (!gl_FrontFacing) N = -N;
    float kind = vK.x, seed = vK.y; vec2 uv = vUv; vec2 dU = fwidth(uv); float px = max(max(dU.x, dU.y), 1e-4);
    vec3 V = normalize(uCam - vP + vec3(0.0, 1e-3, 0.0)); vec3 R = reflect(-V, N);
    vec3 skyR = mix(uHaze, uZen, smoothstep(0.0, 0.7, R.y)) * (0.35 + 0.65 * smoothstep(-0.3, 0.1, R.y));
    float n1 = vn(vP.xz * 0.9 + vP.y * 1.3), n2 = vn(vP.xz * 4.3 + vP.y * 5.1);
    if (uSelf > 0.5) { n1 = 0.40 + 0.3 * vn(uv * 9.0); n2 = 0.5; }                 // the cab travels: its paint must not swim in world space
    vec3 alb = vCol; vec3 over = vec3(0.0); float overA = 0.0; float wm = 0.0; vec3 emit = vec3(0.0); float glint = 0.0; float thin = 0.0; float twk = 0.0;
    vec3 lampC = mix(vec3(1.0, 0.62, 0.26), vec3(0.85, 0.92, 1.0), step(0.6, fract(seed * 7.7)));
    if (kind < 0.5) { alb *= 0.86 + 0.26 * n1; }
    else if (kind < 1.5) {
      // bare brick in a grey concrete frame: courses, windows with frames, curtains and black holes, doors, damp
      float lod = 1.0 - smoothstep(0.08, 0.32, px), blod = 1.0 - smoothstep(0.015, 0.05, px);
      float bay = 3.0 + fract(seed * 7.3) * 0.8; vec2 g = vec2(uv.x / bay, uv.y / 2.7); vec2 id = floor(g), f = fract(g);
      vec2 bq = vec2(uv.x / 0.27 + 0.5 * floor(uv.y / 0.09), uv.y / 0.09);
      float mortar = max(step(0.9, fract(bq.x)), step(0.8, fract(bq.y)));
      float painted = step(0.62, max(vCol.g, vCol.b));
      vec3 brick = vCol * (0.84 + 0.3 * h21(floor(bq) + seed * 9.0) * blod * (1.0 - painted) + 0.22 * vn(uv * 1.4 + seed * 30.0) - 0.1);
      brick = mix(brick, vec3(0.56, 0.53, 0.49), mortar * blod * 0.55 * (1.0 - painted));
      float frame = max(step(f.y, 0.1), step(0.455, abs(f.x - 0.5))) * (1.0 - 0.7 * painted);
      vec3 conc = vec3(0.47, 0.46, 0.44) * (0.82 + 0.3 * n1);
      float hw = h21(id + seed * 91.0), ww = 0.2 + 0.07 * fract(hw * 9.0);
      float wx = abs(f.x - 0.5) / ww, wy = (f.y - 0.36) / 0.4;
      float solid = step(vK.w, -0.5);
      float isWin = step(0.3, hw) * step(0.5, id.y + step(0.5, hw)) * (1.0 - solid);
      float win = isWin * step(wx, 1.0) * step(0.0, wy) * step(wy, 1.0);
      float wfr = win * max(step(0.84, wx), max(step(0.9, wy), max(step(wy, 0.08), step(abs(wx - 0.02), 0.06))));
      float door = (1.0 - solid) * step(id.y, 0.5) * step(hw, 0.3) * step(abs(f.x - 0.5), 0.17) * step(f.y, 0.78) * step(0.1, f.y);
      float open = step(0.84, hw);
      vec3 curtain = 0.45 + 0.4 * cos(6.2832 * (fract(hw * 23.0) + vec3(0.0, 0.33, 0.67)));
      vec3 glass = mix(vec3(0.03, 0.04, 0.06), skyR * 1.2, (1.0 - open) * 0.7);
      glass = mix(glass, curtain * 0.5 * (uSunCol * 0.4 + uSkyCol), step(0.5, fract(hw * 5.0)) * (1.0 - open) * step(wy, 0.62));
      alb = mix(brick, conc, frame);
      alb = mix(alb, mix(vec3(0.16, 0.30, 0.42), vec3(0.36, 0.2, 0.12), step(0.5, fract(hw * 13.0))) * (0.8 + 0.3 * step(0.5, fract(f.y * 9.0))), door * lod);
      alb = mix(alb, vec3(0.7, 0.69, 0.64) * (0.5 + 0.5 * fract(hw * 3.0)), wfr * lod);
      alb = mix(alb, conc * 1.15, isWin * lod * step(wx, 1.25) * step(abs(wy + 0.07), 0.07));
      float streak = vn(vec2(uv.x * 1.7 + seed * 13.0, 0.5)) * (1.0 - smoothstep(0.0, 1.6, uv.y)) + 0.5 * vn(vec2(uv.x * 5.0, uv.y * 0.4 + seed)) * isWin * step(wy, 0.0) * step(wx, 1.1);
      alb *= 1.0 - 0.3 * streak * lod;
      over = glass; overA = win * (1.0 - wfr) * lod; glint = overA * (1.0 - open);
      emit = uNight * lampC * overA * step(0.5, fract(hw * 37.0)) * (1.0 - open) * 2.6;
    } else if (kind < 2.5) {
      // corrugated tin in sheets, bright galvanised ones beside dull and rusted ones (about three sheets in ten have
      // rusted through); rust also stains in patches and gathers along the laps; four roofs in ten are painted
      float lod = 1.0 - smoothstep(0.03, 0.14, px);
      vec2 sg = vec2(uv.x / 2.4, uv.y / 0.95) + seed * 31.0; vec2 sf = fract(sg); float hs = h21(floor(sg));
      // rust stains in patches with a hard edge close to the eye
      float rustN = 0.6 * vn(uv * 0.7 + seed * 11.0) + 0.4 * vn(vec2(uv.x * 1.5, uv.y * 3.0) + seed * 5.0);
      float re = 0.035 + 2.0 * px;
      float oldS = step(0.70, fract(hs * 7.31 + seed * 3.1));
      float rust = max(0.85 * oldS, 0.8 * smoothstep(0.66 - re, 0.66 + re, rustN + 0.10 * (hs - 0.5)));
      rust = max(rust, 0.5 * (1.0 - smoothstep(0.0, 0.08, min(sf.x, 1.0 - sf.x))) * smoothstep(0.35, 0.6, rustN));
      vec3 tin = mix(vec3(0.50, 0.52, 0.56), vCol, step(0.6, fract(seed * 9.7)) * 0.85);
      tin *= (0.78 + 0.44 * hs) * (1.0 + 0.08 * vec3(hs - 0.5, 0.0, 0.5 - hs));
      tin = mix(tin, vec3(0.40, 0.21, 0.11) * (0.8 + 0.5 * vn(uv * 3.0 + seed)), rust);
      // ribs 0.19 m apart running down the fall of the roof, box-filtered so they fade out before they can beat with the pixels
      float ra = 3.1416 * dU.y / 0.19, ramp = ra < 3.1 ? sin(ra) / max(ra, 1e-3) : 0.0; ramp *= ramp;
      float rib = sin(uv.y * 33.07);
      float corr = 1.0 + ramp * (0.20 * rib - 0.10 * smoothstep(0.75, 0.95, -rib));
      float lapE = 0.012 + px;
      float lap = clamp((1.0 - smoothstep(0.0, lapE * 2.0, sf.x)) + 0.7 * (1.0 - smoothstep(0.0, lapE, sf.y)), 0.0, 1.0);
      alb = tin * corr * (1.0 - 0.45 * lap * (1.0 - smoothstep(0.06, 0.3, px))) * (0.95 + 0.1 * n1);
      vec2 nq = vec2((fract(uv.x / 0.8) - 0.5) * 3.4, fract(uv.y / 0.2375) - 0.5);
      alb *= 1.0 - 0.55 * lod * (1.0 - smoothstep(0.05, 0.09, length(nq)));
      glint = step(0.4, hs) * 0.8 * (1.0 - rust);
      // a nail head or a dent on three sheets in ten catches the sun and lets it go again
      vec2 tq = (sf - 0.5 - (h22(floor(sg) + 5.0) - 0.5) * 0.5) * vec2(2.4, 0.95);
      twk = step(0.7, hs) * (1.0 - rust) * (1.0 - smoothstep(0.04, 0.10 + px, length(tq))) * pow(max(sin(uTime * (1.1 + 2.0 * fract(hs * 7.3)) + hs * 80.0 + seed * 40.0), 0.0), 20.0);
    } else if (kind < 3.5) {
      // the mansions: white render with zigzag and stepped bands in two accents, round mirror windows, shop shutters
      float lod = 1.0 - smoothstep(0.1, 0.4, px);
      vec3 A = vCol, B = uAcc[int(mod(floor(seed * 37.0), 3.0))], Wt = vec3(0.80, 0.80, 0.77) * (0.92 + 0.1 * n1);
      float bay = 3.3 + fract(seed * 5.3) * 0.5, fh = 3.2, gy = uv.y - 3.6;
      float cx = fract(uv.x / bay) - 0.5, ax = abs(cx) * 2.0;
      float stepped = step(0.5, fract(seed * 11.0));
      float zz = mix(ax, floor(ax * 4.0 + 0.5) / 4.0, stepped);
      float c = fract((gy + zz * 2.1) / (fh * (1.0 + step(0.5, fract(seed * 17.0)))));
      float e = clamp(px / fh * 1.5, 0.002, 0.2);
      float bA = smoothstep(0.0, e, c) * (1.0 - smoothstep(0.2, 0.2 + e, c)), bB = smoothstep(0.42, 0.42 + e, c) * (1.0 - smoothstep(0.52, 0.52 + e, c));
      float bC = smoothstep(0.26, 0.26 + e, c) * (1.0 - smoothstep(0.30, 0.30 + e, c));
      vec3 up = mix(Wt, A, bA); up = mix(up, B, bB); up = mix(up, B * 0.45, bC);
      float pil = 1.0 - smoothstep(0.04, 0.04 + px / bay, 0.5 - abs(cx)); up = mix(up, mix(A, B, step(0.5, fract(seed * 23.0))) * 0.8, pil);
      float fy = fract(gy / fh); float corn = step(fy, 0.07) * step(0.0, gy); up = mix(up, Wt * (fy < 0.035 ? 0.55 : 1.12), corn * lod);
      // round mirror window in each bay
      vec2 wq = vec2(cx * bay, (fy - 0.56) * fh); float rr = length(wq), r0 = 0.86;
      float ring = 1.0 - smoothstep(r0 + 0.2, r0 + 0.2 + px, rr), disc = 1.0 - smoothstep(r0, r0 + px, rr);
      vec3 mirrorT = mix(vec3(0.75, 0.82, 1.0), mix(vec3(1.0, 0.8, 0.5), vec3(0.6, 1.0, 0.8), step(0.5, fract(seed * 7.0))), step(0.4, fract(seed * 3.0)));
      float bars = step(abs(wq.x), 0.035) + step(abs(wq.y), 0.035);
      vec3 mirror = skyR * mirrorT * 1.25 * (1.0 - 0.6 * clamp(bars, 0.0, 1.0) * lod) + vec3(0.02);
      up = mix(up, mix(B, A, step(0.5, fract(seed * 29.0))) * 0.9, ring * step(0.0, gy));
      // ground floor: rolling shutters between pilasters
      vec3 shut = mix(vec3(0.16, 0.28, 0.5), mix(vec3(0.1, 0.42, 0.3), vec3(0.5, 0.5, 0.52), step(0.5, fract(seed * 13.0 + floor(uv.x / bay) * 0.37))), step(0.4, fract(floor(uv.x / bay) * 0.61 + seed)));
      shut *= 0.7 + 0.3 * step(0.5, fract(uv.y * 7.0)) * lod;
      vec3 gf = mix(shut, Wt * 0.9, max(step(0.4, abs(cx)), step(3.0, uv.y)));
      gf = mix(gf, A, step(3.25, uv.y));
      alb = uv.y < 3.6 ? gf : up;
      float isM = disc * step(0.0, gy);
      over = mirror; overA = isM; glint = isM * 2.0;
      float lw = h21(floor(vec2(uv.x / bay, gy / fh)) + seed * 50.0);
      emit = uNight * (isM * step(0.58, lw) * mix(vec3(1.0, 0.72, 0.42), vec3(0.6, 0.78, 1.0), step(0.9, lw)) * (0.5 + 0.9 * fract(lw * 7.0)) * (0.55 + 0.45 * (1.0 - smoothstep(0.0, r0, rr))) + ring * step(0.0, gy) * B * 0.25);
      alb *= 1.0 - 0.18 * vn(vec2(uv.x * 2.0, 0.3)) * (1.0 - smoothstep(0.0, 1.2, uv.y));
    } else if (kind < 4.5) {
      // striped cloth: tarpaulins, awnings, washing, bunting
      float band = floor(uv.x / (0.22 + 0.3 * fract(seed * 3.7)) + seed * 7.0);
      float plainC = step(0.45, fract(seed * 5.3));
      vec3 c2 = mix(vec3(0.86, 0.85, 0.8), 0.5 + 0.45 * cos(6.2832 * (fract(seed * 17.0) + vec3(0.0, 0.33, 0.67))), step(0.6, fract(seed * 11.0)));
      alb = mix(mix(vCol, c2, step(0.5, fract(band * 0.5))), vCol, plainC) * (0.9 + 0.15 * n2);
      alb *= 0.8 + 0.2 * sin(uv.x * 9.0 + seed * 20.0) * sin(uv.y * 7.0);            // folds and creases
      thin = 1.0;
    } else if (kind < 5.5) {
      over = skyR * vCol * 1.6 + vec3(0.015); overA = 1.0; glint = 2.0; alb = vCol * 0.2;
      emit = uNight * vec3(1.0, 0.8, 0.55) * 0.5 * step(0.5, seed);
    } else if (kind < 6.5) {
      // poured concrete: form lines, cracks, damp
      float lod = 1.0 - smoothstep(0.03, 0.12, px);
      float fl = abs(fract(uv.y / 0.6) - 0.5) * 0.6, formL = (1.0 - smoothstep(0.018, 0.018 + px, fl)) * clamp(0.05 / px, 0.0, 1.0) * step(N.y, 0.8);
      alb = vCol * (0.84 + 0.2 * n1 + 0.1 * n2) * (1.0 - 0.16 * formL) * (1.0 - 0.2 * lod * smoothstep(0.55, 0.6, vn(uv * 0.7 + seed * 9.0)) * step(vn(uv * 0.7 + seed * 9.0), 0.65));
      // a roof slab is screeded in bays: thin dark joints, each bay a touch lighter or darker than the next
      vec2 jb = uv / 2.4 + seed * 7.0; vec2 jg = abs(fract(jb) - 0.5) * 2.4; float jd = 1.2 - max(jg.x, jg.y);
      float joint = (1.0 - smoothstep(0.025, 0.025 + px, jd)) * clamp(0.10 / px, 0.0, 1.0) * step(0.8, N.y);
      alb *= (1.0 - 0.45 * joint) * (1.0 + 0.26 * (h21(floor(jb)) - 0.5) * step(0.8, N.y) * (1.0 - smoothstep(0.3, 1.2, px)));
      alb = mix(alb, alb * vec3(0.55, 0.6, 0.5), 0.3 * smoothstep(0.55, 0.9, fbm(uv * 0.35 + seed * 3.0)));
    } else if (kind < 7.5) {
      // packed-dirt avenue: wheel tracks, a worn centre line, dusty edges
      float ax = abs(uv.x);
      alb = vCol * (0.8 + 0.3 * fbm(vP.xz * 0.35)) * (1.0 - 0.22 * (1.0 - smoothstep(0.25, 0.7, abs(ax - 1.9))) * vn(vec2(uv.x * 3.0, uv.y * 0.15)));
      float dash = (1.0 - smoothstep(0.07, 0.07 + px, ax)) * step(fract(uv.y / 7.0), 0.45) * step(0.3, vn(vec2(floor(uv.y / 7.0), 3.0)));
      alb = mix(alb, vec3(0.62, 0.6, 0.52), dash * 0.7);
      alb = mix(alb, vec3(0.60, 0.50, 0.38), smoothstep(3.2, 4.6, ax) * 0.8);
    } else if (kind < 8.5) {
      alb = vCol * (0.85 + 0.25 * n2) * (0.88 + 0.24 * vn(vP.xz * 0.6)); thin = 0.7;
      // eucalyptus turns the pale underside of its leaves to each gust
      float gust = 0.5 + 0.5 * sin(uTime * 1.3 + (seed * 40.0 + vP.x * 0.6 + vP.z * 0.8) * 0.3);
      alb = mix(alb, vec3(0.50, 0.58, 0.50) * (0.8 + 0.4 * n2), 0.3 * gust * step(0.45, -vK.z) * smoothstep(0.5, 0.8, vn(vP.xz * 2.1 + vec2(vP.y * 1.3, -vP.y * 0.9) + uTime * 0.6)));
    } else if (kind < 9.5) {
      // a wall of burial niches: whitewash, a dark arched mouth to each, flowers in some, a candle in a few at night
      float lod = 1.0 - smoothstep(0.10, 0.45, px);
      vec2 g = vec2(uv.x / 0.9, uv.y / 0.8); vec2 id = floor(g), f = fract(g) - vec2(0.5, 0.45);
      float hn = h21(id + seed * 77.0);
      float arch = max(abs(f.x) - 0.30, max(-f.y - 0.30, length(vec2(f.x, max(f.y - 0.05, 0.0))) - 0.30));
      float mouth = 1.0 - smoothstep(-0.02, 0.02 + px, arch);
      alb = vec3(0.80, 0.79, 0.75) * (0.9 + 0.14 * n1) * mix(0.78, 1.0, lod);
      vec3 inC = mix(vec3(0.06, 0.06, 0.08), 0.5 + 0.45 * cos(6.2832 * (hn * 5.0 + vec3(0.0, 0.33, 0.67))), step(0.45, hn) * step(f.y, -0.06));
      alb = mix(alb, inC, mouth * lod);
      emit = uNight * vec3(1.0, 0.6, 0.25) * mouth * lod * step(0.8, hn) * 1.2;
    } else {
      // a mural the height of the wall (vCol.r = its width over its height; uv.y runs 0..1 up it): a black condor on a rayed sun
      // over three snow peaks and a town of roofs, a woven band along the foot. Flat paint in hard shapes, no lettering
      float asp = max(vCol.r, 0.2); vec2 q = vec2(uv.x - 0.5 * asp, uv.y); float xn = q.x / asp, e = px * 1.2 + 0.002;
      float sv = step(0.2, fract(seed * 2.0)), mo = step(0.5, seed);
      vec3 m = mix(mix(vec3(0.04, 0.50, 0.60), vec3(0.85, 0.30, 0.10), sv), mix(vec3(0.07, 0.10, 0.42), vec3(0.30, 0.06, 0.34), sv), smoothstep(0.35, 1.0, q.y));
      vec2 sc = q - vec2(0.0, 0.68); float sr = length(sc), sa = atan(sc.y, sc.x + 1e-5);
      float ray = smoothstep(0.25 - e * 1.9 / max(sr, 0.05), 0.25 + e * 1.9 / max(sr, 0.05), abs(fract(sa * 1.9099) - 0.5));
      m = mix(m, vec3(0.93, 0.56, 0.05), 0.92 * ray * (1.0 - smoothstep(0.30 - e, 0.30 + e, sr)));
      m = mix(m, vec3(0.96, 0.78, 0.10), 1.0 - smoothstep(0.18 - e, 0.18 + e, sr));
      m = mix(m, vec3(0.90, 0.38, 0.06), (1.0 - smoothstep(0.012 - e, 0.012 + e, abs(sr - 0.135))) * 0.9);
      float ridge = max(max(0.50 - abs(xn + 0.29) * 0.85, 0.57 - abs(xn - 0.02) * 0.95), 0.49 - abs(xn - 0.33) * 0.8);
      vec3 rock = mix(vec3(0.09, 0.12, 0.34), vec3(0.20, 0.10, 0.36), sv);
      float snowL = ridge - 0.05 - 0.025 * tri(xn * 13.0);
      rock = mix(rock, vec3(0.86, 0.87, 0.90), smoothstep(snowL - e, snowL + e, q.y));
      m = mix(m, rock, 1.0 - smoothstep(ridge - e, ridge + e, q.y));
      float hx = floor(xn * 9.0 + 40.0), hh = 0.27 + 0.07 * h21(vec2(hx, seed * 31.0));
      m = mix(m, mix(vec3(0.72, 0.30, 0.14), vec3(0.85, 0.52, 0.12), h21(vec2(hx, 7.0 + seed))), 1.0 - smoothstep(hh - e, hh + e, q.y));
      float band = floor(q.y * 22.0 + 1.5 * tri(xn * 6.0));
      vec3 wc = mix(0.5 + 0.45 * cos(6.2832 * (h11(band + seed * 9.0) + vec3(0.0, 0.33, 0.67))), vec3(0.82, 0.08, 0.30), step(0.5, fract(band * 0.5)));
      m = mix(m, mix(wc * 0.85, vec3(0.62, 0.22, 0.28), smoothstep(0.15, 0.5, px * 22.0)), 1.0 - smoothstep(0.20 - e, 0.20 + e, q.y));
      vec2 b = (q - vec2(0.0, 0.71)) / 0.30; float eb = e * 3.4;
      float th = 0.15 * (1.0 - smoothstep(0.0, 1.3, abs(b.x))) + 0.02;
      float bird = (1.0 - smoothstep(th - eb, th + eb, abs(b.y - (0.55 * abs(b.x) - 0.42 * b.x * b.x)))) * (1.0 - smoothstep(1.3 - eb, 1.3 + eb, abs(b.x)));
      bird = max(bird, 1.0 - smoothstep(0.17 - eb, 0.17 + eb, length(b * vec2(1.7, 0.75) + vec2(0.0, 0.10))));
      // on the other side of the street the sun carries a stepped cross with a round eye instead of the condor
      vec2 ck = abs(b + vec2(0.0, 0.10)) / 0.62;
      float crs = min(min(max(ck.x - 1.0, ck.y - 0.34), max(ck.x - 0.67, ck.y - 0.67)), max(ck.x - 0.34, ck.y - 1.0));
      float cm = (1.0 - smoothstep(-eb, eb, crs * 0.62)) * smoothstep(0.13 - eb, 0.13 + eb, length(b + vec2(0.0, 0.10)));
      m = mix(mix(m, vec3(0.05, 0.05, 0.08), bird), mix(m, mix(vec3(0.72, 0.06, 0.22), vec3(0.05, 0.30, 0.42), sv), cm), mo);
      m = mix(m, vec3(0.82, 0.81, 0.77), 1.0 - smoothstep(0.012 - e, 0.012 + e, min(min(q.y, 1.0 - q.y), 0.5 * asp - abs(q.x))));
      alb = m * (0.9 + 0.14 * n1);
    }
    if (uWet > 0.5 && N.y > 0.8 && ((kind > 1.5 && kind < 2.5) || (kind > 5.5 && kind < 6.5))) {
      wm = smoothstep(0.48, 0.60, vn(vP.xz * 0.5 + 3.0)) * (kind < 2.5 ? 0.6 : 1.0);       // standing water on four tenths of the roof
      glint = max(glint, 1.5 * wm);
    }
    float sh = uSelf > 0.5 ? 1.0 : hmShade(vP, N) * rimShade(vP) * cabShade(vP) * cloudShade(vP.xz);
    float ndl = dot(N, uSunDir);
    float sunT = (max(ndl, 0.0) + thin * 0.5 * max(-ndl, 0.0)) * sh;
    vec3 light = uSunCol * sunT + uSkyCol * (0.62 + 0.38 * N.y) * (1.0 + 0.7 * (1.0 - sh) * (1.0 - uNight)) + uSunCol * vec3(0.30, 0.22, 0.15) * uBounce * (0.55 - 0.45 * N.y) * (0.4 + 0.6 * sh)
      + uSunCol * vec3(0.15, 0.115, 0.085) * uBounce * (1.0 - sh) * (1.0 - uNight) * (1.0 - uSelf);
    if (uNight > 0.5 && uSelf < 0.5) light += lampPool(vP) * 2.3 * (0.55 + 0.45 * N.y);              // pools of lamp light on the roofs and alleys
    vec3 col = alb * light;
    if (wm > 0.0) {                                                                   // dark water that takes the sky at a glancing angle
      float fre = 0.22 + 0.78 * pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 3.0);
      col = mix(col, mix(col * 0.5, mix(uHaze, uZen, smoothstep(0.02, 0.22, R.y)) * (0.5 + 0.5 * sh), fre), wm);
    }
    float sp = pow(max(dot(R, uSunDir), 0.0), 500.0) * sh * (1.0 - uNight);
    col = mix(col, over * (0.55 + 0.6 * sunT), overA) + uSunCol * 6.0 * sp * glint + uSunCol * 3.2 * twk * sh * step(0.3, N.y) * (1.0 - uNight);
    col += emit + vCol * max(vK.w, 0.0) * (0.25 + 2.75 * uNight);
    if (uSelf > 0.5) {
      // inside the cabin: skylight through the windows and a little bounce, never direct sun, so the frame sits darker than the view
      vec3 Nc = normalize(mat3(viewMatrix) * N + vec3(0.0, 0.0, 1e-4));
      float hiSun = (1.0 - uNight) * smoothstep(0.4, 0.85, uSunDir.y);                 // a high sun floods the cabin with bounce
      vec3 inL = (uSkyCol * 0.9 + vec3(dot(uSunCol, vec3(0.3, 0.5, 0.2)) * (0.26 + 0.70 * hiSun) + 0.03) + (1.0 - uNight) * vec3(0.03) + uNight * vec3(0.20, 0.10, 0.05)) * (0.70 + 0.30 * Nc.y + 0.25 * max(-Nc.z, 0.0));
      col = min(mix(alb, vec3(dot(alb, vec3(0.333))), 0.3 * hiSun) * inL, vec3(0.62));
    }
    col = mix(col, uHaze * 1.25 * (uSunCol * 0.55 + uSkyCol * 1.4), seaVeil(vP.y) * 0.9 * (1.0 - uSelf));
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

// tarpaulins: 4 triangles that belly in the wind plus their flat shadow on the dust (aS = 1: the four corners' shadows, 2 triangles), one instanced draw
const TARP_VERT = FOGV + /* glsl */`
  attribute float aS; attribute vec4 iPos; attribute vec4 iSize; attribute vec3 iCol; uniform float uTime; uniform vec3 uSunDir; uniform vec3 uCam;
  varying vec3 vP; varying vec2 vUv; varying vec3 vCol; varying vec2 vSS; varying float vEdge;
  float hh(float n){ return fract(sin(n * 91.345) * 47453.5453); }
  void main(){
    float seed = iSize.z, c = cos(iPos.w), s = sin(iPos.w);
    vec2 l = position.xz * iSize.xy; float centre = position.y;
    float corner = position.x * 2.0 + position.z + 1.5;
    float base = iSize.w;
    float y = base + iPos.y + mix((hh(seed * 13.0 + corner) - 0.5) * 0.9, -0.28 + 0.34 * sin(uTime * 1.7 + seed * 40.0) + 0.1 * sin(uTime * 4.3 + seed * 9.0), centre) * min(1.0, iSize.x / 3.4);
    vec3 w = vec3(iPos.x + c * l.x + s * l.y, y, iPos.z - s * l.x + c * l.y);
    if (aS > 0.5) {
      vec2 off = uSunDir.xz / max(uSunDir.y, 0.3) * (w.y - base);
      if (base < -0.5) off *= min(1.0, 1.3 / max(length(off), 1e-3)); else w.x = min(w.x - off.x, -3.0) + off.x;   // a terrace shadow stays on its deck, a plateau one behind the lip
      w.xz -= off; w.y = base + 0.05 + 0.0005 * length(uCam - w);
    }
    vP = w; vUv = l + iSize.xy * 0.5; vCol = iCol; vSS = vec2(seed, aS); vEdge = 1.0 - centre;
    vec4 mvPosition = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const TARP_FRAG = FOGF + RIM_GLSL + /* glsl */`
  varying vec3 vP; varying vec2 vUv; varying vec3 vCol; varying vec2 vSS; varying float vEdge;
  void main(){
    float seed = vSS.x; vec3 col;
    vec3 dust = mix(vec3(0.60, 0.44, 0.30), vec3(0.62, 0.52, 0.40), 0.45) * 0.86;
    if (vSS.y > 0.5) { col = dust * (uSkyCol * 1.0 + uSunCol * 0.05); }
    else {
      vec3 N = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0.0, 1e-5, 0.0)); if (N.y < 0.0) N = -N;
      float sw = 0.35 + 0.35 * fract(seed * 3.7);
      float tq = vUv.x / sw + seed * 7.0, px = max(fwidth(tq), 1e-4);
      float st = smoothstep(0.5 - px, 0.5 + px, abs(fract(tq * 0.5) - 0.5) * 2.0);
      vec3 c2 = mix(vec3(0.84, 0.83, 0.78), 0.5 + 0.45 * cos(6.2832 * (fract(seed * 17.0) + vec3(0.0, 0.33, 0.67))), step(0.55, fract(seed * 11.0)));
      float plainC = step(0.62, fract(seed * 5.3));
      vec3 alb = mix(mix(vCol, c2, st * (1.0 - smoothstep(0.6, 1.4, px))), vCol, plainC);
      alb *= 0.86 + 0.2 * vn(vUv * 1.3 + seed * 20.0);
      alb *= 1.0 - 0.25 * smoothstep(0.9, 1.0, vEdge);
      float sh = hmShade(vP, vec3(0.0, 1.0, 0.0)) * cabShade(vP) * cloudShade(vP.xz) * rimShade(vP);
      float ndl = max(dot(N, uSunDir), 0.0);
      col = alb * (uSunCol * ndl * sh + uSkyCol * 0.95 + uSunCol * vec3(0.2, 0.15, 0.1));
      col += uNight * alb * vec3(1.0, 0.7, 0.4) * 1.5 * step(0.55, fract(seed * 23.0)) * (1.0 - smoothstep(0.0, 0.75, vEdge));
    }
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

// market crowd: instanced specks (and parasols) that drift along the aisles; aPart 0 body, 1 hat, 2/3 parasol gores
const CROWD_VERT = FOGV + /* glsl */`
  attribute float aPart; attribute vec4 iA; attribute vec4 iB; attribute vec3 iCol; attribute float iY; uniform float uTime;
  varying vec3 vP; varying vec3 vCol; varying vec3 vQ; varying float vNy;
  void main(){
    float L = iA.w, sp = iB.x, ph = iB.y;
    float s = mod(ph * L + uTime * sp, L);
    float fade = smoothstep(0.0, 1.5, s) * smoothstep(0.0, 1.5, L - s);
    vec2 d = vec2(cos(iA.z), sin(iA.z)), fw = d * (sp < 0.0 ? -1.0 : 1.0);
    vec2 base = iA.xy + d * (s - L * 0.5) + vec2(-d.y, d.x) * 0.35 * sin(uTime * 0.31 + ph * 50.0);
    float bob = abs(sin(uTime * 3.2 * (0.6 + abs(sp)) + ph * 30.0)) * 0.08 * step(0.02, abs(sp));
    vec3 l = position * iB.z * fade;
    vec3 w = vec3(base.x + fw.x * l.x - fw.y * l.z, iY + l.y + bob * fade, base.y + fw.y * l.x + fw.x * l.z);
    vP = w; vCol = iCol; vQ = vec3(aPart, position.y, iB.w); vNy = normal.y;
    vec4 mvPosition = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const CROWD_FRAG = FOGF + RIM_GLSL + /* glsl */`
  varying vec3 vP; varying vec3 vCol; varying vec3 vQ; varying float vNy;
  void main(){
    float part = vQ.x, sd = vQ.z; vec3 alb = vCol;
    vec3 cl = clamp(vCol, 0.0, 0.8) * 0.9 + 0.06;                                    // cloth: never pure black, never pure white
    if (part < 0.5) alb = mix(mix(cl.brg * 0.55 + vec3(0.05, 0.04, 0.06), cl * 0.62, step(0.5, fract(sd * 7.0))), cl, step(0.55, vQ.y)) * (0.8 + 0.2 * step(0.5, fract(vQ.y * 5.0 + sd)));
    else if (part < 1.5) alb = mix(vec3(0.17, 0.12, 0.09), mix(vec3(0.34, 0.23, 0.15), vec3(0.72, 0.68, 0.58), step(0.6, fract(sd * 13.0))), step(0.35, fract(sd * 5.0)));
    else if (part > 3.5) alb = vec3(0.50, 0.33, 0.23);
    else if (part > 2.5) alb = mix(vec3(0.80, 0.79, 0.74), cl.gbr, step(0.5, fract(sd * 3.0)));
    float sh = hmShade(vP, vec3(0.0, 1.0, 0.0)) * cabShade(vP) * cloudShade(vP.xz) * rimShade(vP);
    vec3 col = alb * (uSunCol * (0.35 + 0.65 * max(vNy, 0.0)) * sh + uSkyCol * 0.9 + uSunCol * vec3(0.2, 0.15, 0.1) * 0.6);
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

// kites: a two-tone diamond with a wriggling ribbon tail (aT = 0 on the diamond, 0..1 down the tail)
const KITE_VERT = FOGV + /* glsl */`
  attribute vec2 aT; attribute vec4 iPos; attribute vec3 iCol; attribute vec3 iCol2; uniform float uTime; uniform float uPxK;
  varying vec3 vCol; varying float vT;
  void main(){
    float ph = iPos.w, t = uTime, sz = 1.5 + fract(ph * 3.3) * 1.1;
    vec3 c = iPos.xyz + vec3(sin(t * 0.45 + ph) * 7.0 + sin(t * 1.1 + ph * 2.0) * 2.0, sin(t * 0.8 + ph * 1.7) * 4.0 + sin(t * 2.3 + ph) * 0.8, cos(t * 0.37 + ph * 1.3) * 6.0);
    float roll = 0.35 * sin(t * 1.4 + ph * 2.0);
    vec3 w; float side = 0.0;
    if (aT.x <= 0.0) {
      vec2 q = vec2(position.x * cos(roll) - position.y * sin(roll), position.x * sin(roll) + position.y * cos(roll)) * sz;
      w = c + vec3(-q.y * 0.4, q.y * 0.92, q.x);
      vCol = aT.y > 0.0 ? iCol : iCol2;
    } else {
      float s = aT.x, len = sz * 5.0;
      w = c + vec3(0.4, -0.92, 0.0) * sz * 0.62 + vec3(0.55, -0.8, 0.0) * s * len
        + vec3(0.0, sin(t * 6.0 - s * 9.0 + ph * 5.0), cos(t * 5.0 - s * 7.0 + ph * 3.0)) * 0.55 * s * sz * 0.5;
      side = aT.y; vCol = iCol2 * (0.66 + 0.34 * step(0.5, fract(s * 5.0)));   // one colour down the tail, banded light and dark
    }
    vT = aT.x;
    vec4 mvPosition = viewMatrix * vec4(w, 1.0);
    mvPosition.x += side * max(0.09, 0.85 * uPxK * length(mvPosition.xyz));   // about 1.7 px wide at any resolution
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const KITE_FRAG = FOGF + RIM_GLSL + /* glsl */`
  varying vec3 vCol; varying float vT;
  void main(){
    vec3 col = vCol * (uSunCol * 0.78 + uSkyCol * 1.1);
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

function makeMat(U, vertexShader, fragmentShader, extra = {}, opts = {}) {
  const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader, fragmentShader,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, extra]), ...opts });
  Object.assign(m.uniforms, U);
  return m;
}
function instanced(base, attrs, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0].subarray(0, count * attrs[k][1]), attrs[k][1]));
  g.instanceCount = count;
  return g;
}
const polyLen = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2])); return cum; };
function distToPoly(pts, x, z) {
  let best = 1e9;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0], az = pts[i - 1][2], bx = pts[i][0] - ax, bz = pts[i][2] - az, t = sat(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz || 1));
    const d = Math.hypot(x - ax - bx * t, z - az - bz * t); if (d < best) best = d;
  }
  return best;
}

// ---------- prop builders (all write into a GB in the local frame set by G.at) ----------
const CLOTH = ['#D62222', '#143F9E', '#f2c21a', '#10A56B', '#e8e6de', '#F08A1C', '#7A3DB8', '#e84a9a', '#1fa8c0'].map(C3);
const TARPC = ['#1c4fb4', '#1c4fb4', '#D62222', '#f0c020', '#10A56B', '#e6e4dc', '#1c4fb4', '#F08A1C'].map(C3);
const PRODUCE = ['#f28a1a', '#d8261c', '#3a9a2e', '#f2d21e', '#7a2d8a', '#e8e0c8', '#b4d030', '#c8501e'].map(C3);
const PAINTS = ['#9fc4dc', '#e9e6dc', '#a9d8c0', '#d9c48f', '#e0a8a0'].map(C3);
const dull = (c, k = 0.7, d = 0.25) => { const l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; return new THREE.Color(lerp(c.r, l, d) * k, lerp(c.g, l, d) * k, lerp(c.b, l, d) * k); };
const DRYING = ['#e8b820', '#c83a1c', '#6a2a7a', '#e8e0c8', '#d87a1c', '#e8b820'].map(C3).map((c) => dull(c));
const WOOD = C3('#7a5636'), CONCRETE = C3('#8e8a84'), DARK = C3('#141416'), STEEL = C3('#9aa0a6');

function buildStall(G, rng, lampOn) {
  const w = rng.range(2.7, 3.3), d = 2.5, h0 = rng.range(2.1, 2.35), h1 = h0 + rng.range(0.3, 0.6), cl = rng.pick(CLOTH), sd = rng();
  G.kind(KIND.PLAIN).col(WOOD, rng.range(0.7, 1.1));
  for (const sx of [-1, 1]) { G.box(0.07, h0, 0.07, sx * w / 2, 0, d / 2, 0, 0.7, 2); G.box(0.07, h1, 0.07, sx * w / 2, 0, -d / 2, 0, 0.7, 2); }
  G.kind(KIND.CLOTH, sd, 0.03).col(cl, 0.85).quad([-w / 2 - 0.25, h1, -d / 2 - 0.2], [w / 2 + 0.25, h1, -d / 2 - 0.2], [w / 2 + 0.25, h0, d / 2 + 0.3], [-w / 2 - 0.25, h0, d / 2 + 0.3]);
  G.kind(KIND.CLOTH, sd, 0.4).quad([-w / 2 - 0.25, h0, d / 2 + 0.3], [w / 2 + 0.25, h0, d / 2 + 0.3], [w / 2 + 0.25, h0 - 0.35, d / 2 + 0.32], [-w / 2 - 0.25, h0 - 0.35, d / 2 + 0.32]);
  G.kind(KIND.PLAIN).col(WOOD, 0.9).box(w - 0.4, 0.8, 1.0, 0, 0, -0.5, 0, 0.6);
  G.col(rng.pick(CLOTH), 0.6).box(w - 0.3, 0.04, 1.1, 0, 0.8, -0.5);
  const kindOf = rng.int(0, 2);
  for (let i = 0; i < 4; i++) {                                           // on the table
    const x = (i - 1.5) * (w - 0.6) / 4;
    if (kindOf === 2) G.col(rng.pick(CLOTH), 0.9).box(0.22, 0.16 + 0.1 * rng(), 0.95, x, 0.84, -0.5, rng.range(-0.1, 0.1));
    else { G.col(WOOD, 0.6).box(0.55, 0.2, 0.8, x, 0.84, -0.5, 0, 1, 2); G.col(rng.pick(PRODUCE), 0.95).box(0.5, 0.2, 0.75, x, 0.86, -0.5, 0, 1, 1); }
  }
  // the display spilling into the aisle: a ground cloth with heaps, tubs and sacks
  G.col(rng.pick(TARPC), 0.55).quad([-w / 2, 0.06, d / 2 + 2.3], [w / 2, 0.06, d / 2 + 2.3], [w / 2, 0.06, d / 2 + 0.5], [-w / 2, 0.06, d / 2 + 0.5]);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * (w - 0.5) / 5 + rng.range(-0.1, 0.1), zz = d / 2 + rng.range(0.9, 1.9), t = rng();
    if (t < 0.5) G.col(rng.pick(PRODUCE)).cyl(0.3, 0.03, 0.25, x, 0.07, zz, 6, false, 0.75);
    else if (t < 0.8) G.col(rng.pick(CLOTH), 0.9).cyl(0.26, 0.31, 0.3, x, 0.07, zz, 7, true, 0.7);
    else G.col('#b8a078', rng.range(0.8, 1.1)).blob(0.3, 0.36, 0.28, x, 0.4, zz, 0.6);
  }
  if (lampOn) G.kind(KIND.PLAIN, 0, 0, 1.2).col('#ffb060').box(0.16, 0.16, 0.16, 0, h0 - 0.5, 0.2);
  return { w, d, h: h1 };
}

// one mansion: zigzag facade on every side, floor cornices, balconies, shop awnings, and a gabled house perched on the roof
// plain = no balusters under the balcony rails and no flag on the aerial (the further streets)
function buildMansion(G, rng, w, d, floors, front, acc, plain = false) {
  const H = 3.6 + (floors - 1) * 3.2, sd = rng(), A = acc[0], B = acc[1], white = C3('#dedcd4');
  G.kind(KIND.MANSION, sd).col(A).box(w, H, d, 0, 0, 0, 0, 0.85, 2);
  G.kind(KIND.CONC, sd).col(CONCRETE, 1.05).box(w + 0.5, 0.3, d + 0.5, 0, H, 0);
  G.kind(KIND.PLAIN).col(rng.chance(0.5) ? A : B, 0.9);
  for (const s of [-1, 1]) { G.box(w + 0.5, 0.8, 0.2, 0, H + 0.3, s * (d / 2 + 0.15)); G.box(0.2, 0.8, d + 0.1, s * (w / 2 + 0.15), H + 0.3, 0); }
  const zf = front * d / 2;
  for (let k = 0; k < floors; k++) G.col(white, 1.05).box(w + 0.3, 0.13, 0.28, 0, 3.6 + k * 3.2 - 0.06, zf + front * 0.12);
  for (let k = 1; k < floors; k++) {                                      // balconies on the front
    if (!rng.chance(0.7)) continue;
    const bw = rng.range(2.2, w * 0.7), bx = rng.range(-1, 1) * (w - bw) * 0.4, y = 3.6 + (k - 1) * 3.2 + 0.25;
    G.col(white).box(bw, 0.12, 0.95, bx, y, zf + front * 0.5);
    G.col(rng.chance(0.5) ? B : A, 0.8).box(bw, 0.05, 0.05, bx, y + 0.95, zf + front * 0.95).box(bw, 0.05, 0.05, bx, y + 0.5, zf + front * 0.95);
    for (let i = 0; i <= 4 && !plain; i++) G.box(0.05, 0.95, 0.05, bx + (i / 4 - 0.5) * bw, y + 0.1, zf + front * 0.95, 0, 1, 2);
  }
  for (let i = 0; i < 2; i++) {                                            // shop awnings
    if (!rng.chance(0.75)) continue;
    const aw = w * 0.42, ax = (i - 0.5) * w * 0.5, z0 = zf + front * 0.05, z1 = zf + front * 1.5;
    G.kind(KIND.CLOTH, rng(), 0.04).col(rng.pick(CLOTH), 0.85).quad([ax - aw / 2, 3.2, z0], [ax + aw / 2, 3.2, z0], [ax + aw / 2, 2.65, z1], [ax - aw / 2, 2.65, z1]);
  }
  // the little house on the roof
  const cw = w * rng.range(0.55, 0.72), cd = d * rng.range(0.36, 0.5), cz = -front * d * 0.12, ch = 2.7, y0 = H + 0.3, ridge = cw * 0.36;
  G.kind(KIND.PLAIN).col(rng.chance(0.5) ? white : B, 0.95).box(cw, ch, cd, 0, y0, cz, 0, 0.9, 2);
  G.kind(KIND.GLASS, 1).col('#9fc4ec');
  for (const sx of [-0.25, 0.25]) for (const s of [-1, 1]) G.box(cw * 0.22, 1.1, 0.06, sx * cw, y0 + 0.9, cz + s * (cd / 2 + 0.01));
  const roofC = rng.pick(['#b83a2a', '#2a7a5a', '#3a5a9a', '#8a3a2a'].map(C3)), e = 0.45;
  G.kind(KIND.TIN, rng()).col(roofC);
  G.quad([-cw / 2 - e, y0 + ch - 0.15, cz + cd / 2 + e], [0, y0 + ch + ridge, cz + cd / 2 + e], [0, y0 + ch + ridge, cz - cd / 2 - e], [-cw / 2 - e, y0 + ch - 0.15, cz - cd / 2 - e]);
  G.quad([0, y0 + ch + ridge, cz + cd / 2 + e], [cw / 2 + e, y0 + ch - 0.15, cz + cd / 2 + e], [cw / 2 + e, y0 + ch - 0.15, cz - cd / 2 - e], [0, y0 + ch + ridge, cz - cd / 2 - e]);
  G.kind(KIND.PLAIN).col(white);
  for (const s of [-1, 1]) G.quad([-cw / 2, y0 + ch, cz + s * cd / 2], [cw / 2, y0 + ch, cz + s * cd / 2], [0, y0 + ch + ridge, cz + s * cd / 2], [0, y0 + ch + ridge, cz + s * cd / 2]);
  // roof plant: a tank, an aerial with a flag
  G.col(rng.chance(0.5) ? '#101012' : '#143F9E').cyl(0.6, 0.6, 1.2, w * 0.36, y0, front * d * 0.3, 8);
  const px = -w * 0.38, pz = front * d * 0.34;
  G.col(STEEL, 0.7).box(0.07, 4.2, 0.07, px, y0, pz, 0, 1, 2);
  if (!plain) G.kind(KIND.CLOTH, rng(), 0.3).col(rng.pick(CLOTH)).quad([px, y0 + 3.2, pz], [px, y0 + 4.1, pz], [px + 1.5, y0 + 4.1, pz + 0.2], [px + 1.5, y0 + 3.2, pz + 0.2]);
  return { H, top: y0 + ch + ridge };
}

// rooftop kit shared by the town blocks and the close-pass houses; up = how far clutter may rise above the roof.
// ex (optional) = { night, people: [] }: bulbs on the washing lines at night, and where a figure stands or sits
function roofSlab(G, rng, w, d, y, wallC, up, ex = null) {
  const fin = rng();
  G.kind(KIND.CONC, rng()).col(fin < 0.5 ? CONCRETE : fin < 0.78 ? C3('#8e4c38') : C3('#9a8f80'), rng.range(0.62, 0.86)).quad([-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2], [-w / 2, -d / 2, w / 2, d / 2]);
  const ph = Math.min(0.55, up);
  // the parapet's shade and the dirt that gathers under it
  G.kind(KIND.PLAIN).rgb(0.16, 0.15, 0.17);
  for (const s of [-1, 1]) {
    G.quad([-w / 2 + 0.16, y + 0.03, s * (d / 2 - 0.16)], [w / 2 - 0.16, y + 0.03, s * (d / 2 - 0.16)], [w / 2 - 0.16, y + 0.03, s * (d / 2 - 0.5)], [-w / 2 + 0.16, y + 0.03, s * (d / 2 - 0.5)]);
    G.quad([s * (w / 2 - 0.16), y + 0.03, -d / 2 + 0.5], [s * (w / 2 - 0.16), y + 0.03, d / 2 - 0.5], [s * (w / 2 - 0.5), y + 0.03, d / 2 - 0.5], [s * (w / 2 - 0.5), y + 0.03, -d / 2 + 0.5]);
  }
  if (rng.chance(0.5)) for (let i = rng.int(1, 3); i > 0; i--) G.kind(KIND.CLOTH, 0.1 + 0.003 * i, 0).col(rng.pick(DRYING), rng.range(0.8, 1)).box(Math.min(1.4, rng.range(0.9, 1.9)), 0.05, rng.range(0.7, 1.3), rng.range(-0.28, 0.28) * w, y + 0.04, rng.range(-0.28, 0.28) * d, rng.range(0, 3), 1, 1);
  G.kind(KIND.PLAIN);
  for (let i = rng.int(1, 4); i > 0; i--) G.col(rng.pick(TARPC), 0.7).cyl(0.2, 0.25, Math.min(0.5, up * 0.5), rng.range(-0.38, 0.38) * w, y, rng.range(-0.38, 0.38) * d, 6, true, 0.7);
  for (let i = rng.int(3, 6); i > 0; i--) {                              // loose bricks, a tyre or two
    const px = rng.range(-0.4, 0.4) * w, pz = rng.range(-0.4, 0.4) * d;
    if (rng.chance(0.75)) { const sz = rng.range(0.18, 0.34); G.col(rng.chance(0.5) ? '#8a8076' : '#a8502e', rng.range(0.7, 1.1)).box(sz, sz * 0.6, sz * rng.range(0.7, 1.4), px, y, pz, rng.range(0, 3), 0.8); }
    else G.col('#0b0b0c').cyl(0.34, 0.3, 0.16, px, y, pz, 8, false).col('#1a1a1c').cyl(0.2, 0.2, 0.02, px, y, pz, 8, true);
  }
  if (up > 2.4 && rng.chance(0.45)) {
    const hx = (rng.chance(0.5) ? -1 : 1) * (w / 2 - 1.15), hz = (rng.chance(0.5) ? -1 : 1) * (d / 2 - 1.2);
    G.kind(KIND.BRICK, rng()).col(wallC, 0.92).box(1.9, 2.1, 2.0, hx, y, hz, 0, 0.8, 2).kind(KIND.TIN, rng()).col('#4a4e54').box(2.3, 0.06, 2.4, hx, y + 2.1, hz);
  }
  for (let i = rng.int(0, 3); i > 0; i--) {                              // blankets aired over the parapet
    const xx = (rng.chance(0.8) ? -1 : 1) * (w / 2 + 0.03), z0 = rng.range(-0.4, 0.2) * d, cw = rng.range(0.7, 1.4);
    G.kind(KIND.CLOTH, rng(), 0.12).col(rng.pick(CLOTH), 0.9).quad([xx, y + ph + 0.02, z0], [xx, y + ph + 0.02, z0 + cw], [xx, y + ph - rng.range(0.5, 1.0), z0 + cw], [xx, y + ph - 0.7, z0]);
  }
  G.kind(KIND.BRICK, rng(), 0, -1).col(wallC, 0.95);
  for (const s of [-1, 1]) { G.box(w, ph, 0.16, 0, y, s * (d / 2 - 0.08), 0, 1, 3); G.box(0.16, ph, d - 0.3, s * (w / 2 - 0.08), y, 0, 0, 1, 3); }
  G.kind(KIND.PLAIN);
  if (up > 1.0 && rng.chance(0.75)) {                                    // a water tank, on a stand where there is headroom
    const tx = rng.range(-0.3, 0.3) * w, tz = rng.range(-0.3, 0.3) * d, st = up > 1.9 ? 0.6 : 0.2, th = Math.min(0.95, up - st - 0.08);
    G.col(CONCRETE, 0.7);
    if (st > 0.5) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.box(0.1, st, 0.1, tx + sx * 0.42, y, tz + sz * 0.42, 0, 0.8, 2); G.box(1.05, 0.07, 1.05, tx, y + st - 0.07, tz); }
    else G.box(1.0, st, 1.0, tx, y, tz);
    G.col(rng.chance(0.55) ? '#0c0c0e' : '#16409e').cyl(0.5, 0.5, th, tx, y + st, tz, 8, true, 0.8);
  }
  for (let li = 0, nl = up > 1.0 && rng.chance(0.9) ? (up > 1.5 && rng.chance(0.45) ? 2 : 1) : 0; li < nl; li++) {   // washing on lines, strung across the slope so it faces the cabin
    const lx = (nl > 1 ? (li ? 0.24 : -0.24) + rng.range(-0.06, 0.06) : rng.range(-0.3, 0.3)) * w, z0 = -d / 2 + 0.45, z1 = d / 2 - 0.45, ly = y + Math.min(1.75, up - 0.05);
    G.kind(KIND.PLAIN).col(WOOD, 0.6).box(0.05, ly - y, 0.05, lx, y, z0, 0, 1, 2).box(0.05, ly - y, 0.05, lx, y, z1, 0, 1, 2);
    G.col(DARK).box(0.035, 0.035, z1 - z0, lx, ly - 0.04, (z0 + z1) / 2, 0, 1, 3);
    for (let z = z0 + 0.15; z < z1 - 0.6;) {
      const cw = Math.min(z1 - 0.1 - z, rng.range(0.9, 1.4)), chh = rng.range(0.5, Math.min(1.15, ly - y - 0.2));
      if (rng.chance(0.88)) G.kind(KIND.CLOTH, rng(), 0.4).col(rng.chance(0.3) ? '#e8e6de' : rng.pick(CLOTH), 0.9).quad([lx, ly - 0.05, z], [lx, ly - 0.05, z + cw], [lx, ly - 0.05 - chh, z + cw], [lx, ly - 0.05 - chh, z]);
      z += cw + rng.range(0.06, 0.2);
    }
    if (ex && ex.night) { G.kind(KIND.PLAIN, 0, 0, 1.3).col('#ffcf8a'); for (let z = z0 + 0.3; z < z1; z += 0.62) G.box(0.09, 0.07, 0.09, lx + 0.06, ly + 0.02, z, 0, 1, 1); }
    if (ex && li === 0 && up > 1.75 && rng.chance(0.45)) ex.people.push({ p: G.world(lx + 0.5, y, rng.range(-0.25, 0.25) * d), s: 1, yaw: rng.range(0, TAU) });
    G.kind(KIND.PLAIN);
  }
  if (up > 0.9) for (let k = rng.int(0, 2); k > 0; k--) {                // rebar left sprouting for the next floor
    const cx = (rng.chance(0.5) ? -1 : 1) * (w / 2 - 0.2), cz = (rng.chance(0.5) ? -1 : 1) * (d / 2 - 0.2), rh = Math.min(1.2, up - 0.06);
    G.kind(KIND.CONC, rng()).col(CONCRETE, 0.95).box(0.3, 0.22, 0.3, cx, y + ph, cz).kind(KIND.PLAIN).col('#3a1e14');
    for (let q = 0; q < 4; q++) G.box(0.04, rh * rng.range(0.7, 1) - ph, 0.04, cx + ((q & 1) - 0.5) * 0.18 + rng.range(-0.03, 0.03), y + ph + 0.2, cz + ((q >> 1) - 0.5) * 0.18, 0, 1, 2);
  }
  for (let i = rng.int(0, 4); i > 0; i--) {                              // geraniums and maize in tins
    const px = (rng.chance(0.5) ? -1 : 1) * (w / 2 - 0.45), pz = rng.range(-0.4, 0.4) * d;
    G.col(rng.pick(['#8a8f96', '#a04a2a', '#2a4a8a'].map(C3))).box(0.3, 0.28, 0.3, px, y, pz);
    if (rng.chance(0.6)) G.kind(KIND.LEAF, rng(), -0.05).col('#2f6a2a').blob(0.3, 0.26, 0.3, px, y + 0.5, pz).kind(KIND.PLAIN).col('#d8262a').box(0.2, 0.1, 0.2, px, y + 0.7, pz);
    else if (up > 1.3) G.kind(KIND.LEAF, rng(), -0.1).col('#5a8a2a').box(0.07, 1.0, 0.3, px, y + 0.28, pz, rng.range(0, 3), 0.7, 2).kind(KIND.PLAIN);
  }
  if (up > 0.9 && rng.chance(0.4)) {                                     // dish
    const px = rng.range(-0.35, 0.35) * w, pz = (rng.chance(0.5) ? -1 : 1) * (d / 2 - 0.5);
    G.col(STEEL, 0.6).box(0.05, 0.6, 0.05, px, y, pz, 0, 1, 2); G.col('#c8c8c4').cyl(0.04, 0.42, 0.16, px, y + 0.55, pz, 8, true);
  }
  if (ex && up >= 1.0 && rng.chance(0.3)) ex.people.push({ p: G.world((rng.chance(0.5) ? -1 : 1) * (w / 2 - 0.45), y - 0.1, rng.range(-0.3, 0.3) * d), s: 0.6, yaw: rng.range(0, TAU) });   // someone sitting by the parapet
}
function roofTin(G, rng, w, d, y, up) {
  const rise = Math.min(up - 0.25, rng.range(0.35, 0.8)), e = 0.3, sd = rng();
  const tc = rng.pick(['#3a5a94', '#2f7a58', '#9a2a1e', '#4a4e54', '#1f6f86', '#a8521e'].map(C3));
  G.kind(KIND.TIN, sd).col(tc).quad([-w / 2 - e, y + 0.06, d / 2 + e], [w / 2 + e, y + 0.06 + rise, d / 2 + e], [w / 2 + e, y + 0.06 + rise, -d / 2 - e], [-w / 2 - e, y + 0.06, -d / 2 - e], [-w / 2, -d / 2, w / 2, d / 2]);
  const yAt = (x) => y + 0.06 + rise * (x + w / 2 + e) / (w + 2 * e);
  G.kind(KIND.PLAIN);
  for (let i = rng.int(8, 14); i > 0; i--) {                              // stones, bricks and old tyres hold the sheets down
    const px = rng.range(-0.46, 0.46) * w, pz = (rng.chance(0.6) ? (rng.chance(0.5) ? -1 : 1) * rng.range(0.34, 0.47) : rng.range(-0.4, 0.4)) * d;
    if (rng.chance(0.72)) { const s = rng.range(0.24, 0.46); G.col(rng.chance(0.7) ? '#8a8076' : '#a8502e', rng.range(0.7, 1.15)).box(s, s * rng.range(0.5, 0.8), s * rng.range(0.7, 1.2), px, yAt(px) - 0.02, pz, rng.range(0, 3), 0.7); }
    else G.col('#0b0b0c').cyl(0.36, 0.32, 0.18, px, yAt(px), pz, 8, false).col('#1a1a1c').cyl(0.2, 0.2, 0.02, px, yAt(px), pz, 8, true);
  }
  for (let i = rng.int(0, 2); i > 0; i--) {                               // a plank or a length of pipe laid across the laps
    const px = rng.range(-0.3, 0.3) * w, len = rng.range(0.5, 0.85) * d;
    G.col(rng.chance(0.6) ? WOOD : STEEL, rng.range(0.5, 0.8)).box(0.14, 0.05, len, px, yAt(px), rng.range(-0.06, 0.06) * d, 0, 0.8);
  }
  if (rng.chance(0.3)) {                                                 // a blue tarpaulin patch over a leak
    const x0 = rng.range(-0.4, 0.05) * w, x1 = x0 + Math.min(1.4, rng.range(1.2, 2.4)), z0 = rng.range(-0.4, 0.0) * d, z1 = z0 + Math.min(1.4, rng.range(1.2, 2.2));
    G.kind(KIND.CLOTH, 0.3 + 0.05 * rng(), 0).col(dull(C3(rng.chance(0.7) ? '#1c4fb4' : '#e8c020'))).quad([x0, yAt(x0) + 0.03, z1], [x1, yAt(x1) + 0.03, z1], [x1, yAt(x1) + 0.03, z0], [x0, yAt(x0) + 0.03, z0]).kind(KIND.PLAIN);
  }
  if (up > 1.0 && rng.chance(0.55)) { const px = rng.range(-0.3, 0.3) * w; G.col('#3a3a3c').cyl(0.08, 0.08, Math.min(1.0, up - 0.3), px, yAt(px), rng.range(-0.3, 0.3) * d, 6, true); }
  // gable infill under the high edge
  G.kind(KIND.BRICK, sd, 0, -1).col('#B4603D', 0.9).quad([w / 2, y, d / 2], [w / 2, y, -d / 2], [w / 2, y + rise, -d / 2], [w / 2, y + rise, d / 2]);
}
function roofUnfinished(G, rng, w, d, y, wallC, up) {
  G.kind(KIND.CONC, rng()).col(CONCRETE, rng.range(0.5, 0.68)).quad([-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2], [-w / 2, -d / 2, w / 2, d / 2]);
  const ch = Math.min(2.5, up - 0.9), nx = Math.max(2, Math.round(w / 3)), nz = Math.max(2, Math.round(d / 3));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    if (i > 0 && i < nx - 1 && j > 0 && j < nz - 1) continue;
    const px = (i / (nx - 1) - 0.5) * (w - 0.3), pz = (j / (nz - 1) - 0.5) * (d - 0.3), hh = ch > 0.6 ? ch * rng.range(0.75, 1) : 0.15;
    G.kind(KIND.CONC, rng()).col(CONCRETE, 0.95).box(0.27, hh, 0.27, px, y, pz, 0, 0.85, 3);
    G.kind(KIND.PLAIN).col('#3a1e14');
    for (let k = 0; k < 4; k++) G.box(0.045, rng.range(0.5, 0.9), 0.045, px + ((k & 1) - 0.5) * 0.17 + rng.range(-0.02, 0.02), y + hh, pz + ((k >> 1) - 0.5) * 0.17, 0, 1, 2);
  }
  if (ch > 1.2) for (let s = 0; s < 2; s++) if (rng.chance(0.6)) G.kind(KIND.BRICK, rng(), 0, -1).col(wallC).box(w - 0.6, ch * rng.range(0.3, 0.7), 0.14, 0, y, (s ? 1 : -1) * (d / 2 - 0.15));
  G.kind(KIND.PLAIN).col('#a8502e', rng.range(0.8, 1.1)).box(0.9, 0.4, 0.6, rng.range(-0.2, 0.2) * w, y, rng.range(-0.2, 0.2) * d, rng.range(0, 3));
  G.col('#b8a888').cyl(0.7, 0.05, 0.35, rng.range(-0.25, 0.25) * w, y, rng.range(-0.25, 0.25) * d, 7, false, 0.8);
}

function minibusGeometry() {
  const G = new GB(), white = C3('#d8d6d0');
  G.kind(KIND.PLAIN).col(white).box(5.0, 1.1, 1.9, 0, 0.35, 0, 0, 0.8).box(4.7, 0.1, 1.9, -0.1, 2.15, 0);
  for (const x of [-2.3, -1.0, 0.4, 1.6]) G.box(0.13, 0.7, 1.9, x, 1.45, 0, 0, 1, 2);
  G.kind(KIND.GLASS, 1).col('#b8d0f0').box(4.5, 0.7, 1.84, -0.1, 1.45, 0, 0, 1, 2).box(0.08, 0.66, 1.7, 2.2, 1.45, 0, 0, 1, 2);
  G.kind(KIND.PLAIN, 0, 0, -1).col('#ffffff').box(4.4, 0.05, 0.8, -0.1, 2.25, 0).box(5.02, 0.16, 1.92, 0, 0.95, 0, 0, 1, 2);
  G.kind(KIND.PLAIN).col(STEEL, 0.5).box(2.9, 0.06, 1.5, -0.6, 2.3, 0);
  G.col('#1c4fb4').box(1.5, 0.3, 1.2, -1.1, 2.36, 0, 0.1).col('#b8a078').box(0.9, 0.34, 1.0, 0.3, 2.36, 0.1, -0.2).col('#D62222', 0.9).box(0.5, 0.22, 0.6, -0.2, 2.66, -0.2);
  G.col(DARK);
  for (const x of [-1.6, 1.6]) for (const z of [-0.88, 0.88]) G.box(0.72, 0.72, 0.24, x, 0, z);
  G.kind(KIND.PLAIN, 0, 0, 1.5).col('#fff0c0').box(0.05, 0.14, 0.3, 2.52, 0.75, 0.62).box(0.05, 0.14, 0.3, 2.52, 0.75, -0.62);
  G.kind(KIND.PLAIN, 0, 0, 0.9).col('#ff2010').box(0.05, 0.14, 0.24, -2.52, 0.85, 0.7).box(0.05, 0.14, 0.24, -2.52, 0.85, -0.7);
  return G.build();
}
function crowdGeometry(parasol) {
  const G = new GB();
  G.kind(0).cyl(0.38, 0.17, 1.34, 0, 0, 0, 4, false, 0.8);                                       // skirt or poncho, wide at the hem
  G.kind(4).cyl(0.14, 0.13, 0.25, 0, 1.31, 0, 3, false);                                         // head
  G.kind(1).box(0.46, 0.03, 0.46, 0, 1.55, 0, 0.6, 1, 1);                                        // the brim of a hat, seen from above
  if (parasol) for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU, i0 = G.P.length / 3; G.kind(2 + (i & 1));
    G.v(0, 2.35, 0, 0, 1, 0, 0, 0); G.v(Math.cos(a1) * 1.05, 2.05, Math.sin(a1) * 1.05, 0, 1, 0, 0, 0); G.v(Math.cos(a0) * 1.05, 2.05, Math.sin(a0) * 1.05, 0, 1, 0, 0, 0);
    G.I.push(i0, i0 + 1, i0 + 2);
  }
  const g = new THREE.BufferGeometry(), part = new Float32Array(G.K.length / 4);
  for (let i = 0; i < part.length; i++) part[i] = G.K[i * 4];
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.N, 3));
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); g.setIndex(G.I);
  return g;
}
function kiteGeometry() {
  const P = [], T = [], I = [], d = [[0, 0.62], [0.45, 0], [0, -0.72], [-0.45, 0]];
  for (let i = 0; i < 4; i++) { const a = d[i], b = d[(i + 1) % 4], q = P.length / 3; P.push(0, 0, 0, a[0], a[1], 0, b[0], b[1], 0); const f = i === 0 || i === 2 ? 1 : -1; T.push(0, f, 0, f, 0, f); I.push(q, q + 1, q + 2); }
  const b0 = P.length / 3, segs = 8;
  for (let i = 0; i <= segs; i++) { const s = 0.02 + 0.98 * i / segs; for (const sd of [-1, 1]) { P.push(0, 0, 0); T.push(s, sd); } if (i < segs) { const q = b0 + i * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 2)); g.setIndex(I);
  return g;
}
function dogGeometry(c) {
  const G = new GB();
  G.kind(KIND.PLAIN, 0, 0, -1).col(c).box(0.72, 0.28, 0.24, 0, 0.32, 0, 0, 0.8).box(0.26, 0.22, 0.2, 0.44, 0.5, 0).col(c, 0.6).box(0.14, 0.1, 0.12, 0.62, 0.52, 0);
  for (const x of [-0.27, 0.27]) for (const z of [-0.08, 0.08]) G.box(0.08, 0.34, 0.08, x, 0, z, 0, 1, 2);
  G.box(0.06, 0.1, 0.05, 0.4, 0.72, 0.07).box(0.06, 0.1, 0.05, 0.4, 0.72, -0.07);
  G.kind(KIND.CLOTH, 0.3, 0.5, -1).col(c, 0.9).quad([-0.36, 0.52, 0.03], [-0.36, 0.58, -0.03], [-0.62, 0.86, -0.03], [-0.62, 0.8, 0.03]);
  return G.build();
}
// a cabin of the second ropeway, hanging from its grip at the origin
function yellowCabinGeometry() {
  const G = new GB(), yel = C3('#f2c21a');
  G.kind(KIND.PLAIN).col(DARK).box(0.5, 0.22, 0.22, 0, -0.12, 0).box(0.08, 1.8, 0.08, 0, -1.9, 0, 0, 1, 2);
  G.col(yel, 0.95).box(2.0, 0.14, 1.9, 0, -2.04, 0).box(1.95, 0.9, 1.85, 0, -3.9, 0, 0, 0.75);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.box(0.14, 0.96, 0.14, sx * 0.9, -3.0, sz * 0.85, 0, 1, 2);
  G.col('#e8e6de').box(1.98, 0.09, 1.88, 0, -3.04, 0, 0, 1, 2);
  G.kind(KIND.GLASS, 1).col('#9fc4ec').box(1.84, 0.96, 1.74, 0, -3.0, 0, 0, 1, 2);
  return G.build();
}
// a person: two legs, a shirt that takes the instance colour and is broader at the shoulders, arms, a head, dark hair
function figureGeometry() {
  const G = new GB();
  G.kind(KIND.PLAIN).col('#22222a');
  for (const sx of [-1, 1]) G.box(0.15, 0.84, 0.17, sx * 0.1, 0, 0, 0, 0.85, 2);
  G.kind(KIND.PLAIN, 0, 0, -1).col('#ffffff').cyl(0.19, 0.25, 0.6, 0, 0.82, 0, 5, true, 0.85);
  for (const sx of [-1, 1]) G.box(0.1, 0.56, 0.11, sx * 0.3, 0.84, 0, 0, 0.9, 2);
  G.kind(KIND.PLAIN).col('#8a5c40').cyl(0.115, 0.12, 0.24, 0, 1.44, 0, 5, false, 0.9);
  G.col('#18130f').cyl(0.135, 0.11, 0.09, 0, 1.62, 0, 5, true);
  return G.build();
}
// the shoppers the cabin passes close over on the terrace market: a full skirt, a shawl, a head and a bowler hat
function crowdGeometryNear(parasol) {
  const G = new GB();
  G.kind(0).cyl(0.40, 0.22, 0.78, 0, 0, 0, 6, false, 0.75).cyl(0.21, 0.27, 0.42, 0, 0.78, 0, 5, true);
  G.kind(4).cyl(0.115, 0.12, 0.26, 0, 1.2, 0, 4, false);
  G.kind(1).cyl(0.21, 0.20, 0.035, 0, 1.45, 0, 6, true).cyl(0.125, 0.10, 0.13, 0, 1.48, 0, 4, true);
  if (parasol) for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU, i0 = G.P.length / 3; G.kind(2 + (i & 1));
    G.v(0, 2.35, 0, 0, 1, 0, 0, 0); G.v(Math.cos(a1) * 1.05, 2.05, Math.sin(a1) * 1.05, 0, 1, 0, 0, 0); G.v(Math.cos(a0) * 1.05, 2.05, Math.sin(a0) * 1.05, 0, 1, 0, 0, 0);
    G.I.push(i0, i0 + 1, i0 + 2);
  }
  const g = new THREE.BufferGeometry(), part = new Float32Array(G.K.length / 4);
  for (let i = 0; i < part.length; i++) part[i] = G.K[i * 4];
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.N, 3));
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); g.setIndex(G.I);
  return g;
}
// a eucalyptus: a tall pale trunk and a narrow drooping crown of five slim blobs, grey-green, lighter toward the top
function treeGeometry(rng, own) {
  for (let i = 0; i < 21; i++) rng();                                    // the draws the old crown took, so every later draw stays as it was
  const G = new GB(), lit = C3('#5f7f5a'), shade = C3('#3c5a44'), N = 5;
  G.kind(KIND.PLAIN).col('#b0a08e').box(0.24, 9.4, 0.24, 0, -1.5, 0, 0.3, 0.65, 2);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), a = i * 2.4 + own.range(-0.5, 0.5), r = (i === N - 1 ? 0 : own.range(0.4, 0.95)) * (1 - 0.4 * t), rad = own.range(0.7, 1.1) * (1 - 0.15 * t);
    G.kind(KIND.LEAF, own(), -0.5).col(shade.clone().lerp(lit, 0.2 + 0.8 * t), own.range(0.88, 1.12)).blob(rad, rad * own.range(1.5, 1.9), rad, Math.cos(a) * r, 4.4 + 4.6 * t + own.range(-0.3, 0.3), Math.sin(a) * r, 0.85);
  }
  return G.build();
}
// ichu: seven narrow blades splayed in a ring, paler toward the tips
function tuftGeometry() {
  const G = new GB(); G.kind(KIND.LEAF, 0.3, -0.35).col('#cdb672');
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU + 0.4 * Math.sin(i * 2.7), tilt = (30 + 25 * (0.5 + 0.5 * Math.sin(i * 4.1 + 1))) * Math.PI / 180, L = 0.5 + 0.3 * (0.5 + 0.5 * Math.cos(i * 3.3));
    const ca = Math.cos(a), sa = Math.sin(a), r0 = 0.05, hw = 0.045, tx = ca * (r0 + Math.sin(tilt) * L), tz = sa * (r0 + Math.sin(tilt) * L), ty = Math.cos(tilt) * L;
    const i0 = G.v(ca * r0 - sa * hw, 0, sa * r0 + ca * hw, 0, 1, 0, 0, 0, 0.6);
    G.v(ca * r0 + sa * hw, 0, sa * r0 - ca * hw, 0, 1, 0, 0, 0, 0.6); G.v(tx, ty, tz, 0, 1, 0, 0, 1, 1.15);
    G.I.push(i0, i0 + 1, i0 + 2);
  }
  return G.build();
}

export default {
  id: 'over-the-rim',
  name: 'Over the Rim',
  category: 'city',
  weirdness: 0.05,
  media: ['cable', 'air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, vr = rng.fork('rim-look');
    const pickv = vr(), hour = vary.hour || 'any';
    const lookName = hour === 'day' ? 'noon' : hour === 'golden' ? 'golden' : hour === 'night' ? 'night' : hour === 'dawn' ? 'cloudsea'
      : pickv < 0.44 ? 'noon' : pickv < 0.66 ? 'golden' : pickv < 0.84 ? 'night' : 'cloudsea';
    const look = LOOKS[lookName], isNight = look.night > 0.5;
    const wet = vr.chance(0.35), festival = vr.chance(0.3), rare = !!vary.rare, density = Math.min(1.25, Math.max(0.7, vary.density ?? 1));
    const busy = detail * (0.75 + 0.25 * density);

    const scene = new THREE.Scene();
    const sky = makeSky({ rng, ...look.sky, sunElevation: isNight ? -30 : look.el, sunAzimuth: look.az, bake: isNight, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(look.fog, look.density);
    const rig = makeLightRig(sky, { bounce: 0.3, follow: false }); scene.add(rig.object);   // follow would call camera.getWorldDirection, which resets the portal camera
    const sunDir = skyDirection(look.el, look.az);
    await ctx.yield();

    // ---- the hero: bowl, ropeway, peak (brief frame = world frame) ----
    const CLEAR = 24, CEM = { x0: 108, x1: 146, z0: 42, z1: 70 }, STK = { x: 352, z: 36 };   // the niche cemetery on the first spur; the painted stack of houses beside the last roofs
    // the terrace market beside the first stair alley (two decks stepping down the spur) and the yellow ropeway that crosses the gully
    const PLZ = { z0: 8, z1: 30, t: [{ x0: 153.5, x1: 168.5, y: 0 }, { x0: 168.5, x1: 183.5, y: 0 }] }, YX = 213, YPZ = [-128, -80, -38, 38, 80, 128];
    // The further streets of mansions (built below, after the other streets). Each is a lane with houses down one side of
    // it, and the houses front their lane. A ropeway keeps a strip clear beside its cable and a lane runs along the edge of
    // that strip (a clearance beside a ropeway is a rule of the place): WAY_CLIFF either side of the line at the foot of the
    // cliff, a lane on the bench under the cliff, which climbs a few metres toward the first spur; WAY_SPUR to the left on
    // the gantry spur, a stair lane down the flank beside the retaining walls that hold it (they stand 27 to 40 m out). The
    // houses stand on the side of their lane away from the cable, behind up to FORECOURT of forecourt: faces 13 to 15 m and
    // 33 to 35 m from the line.
    // Along the line a street runs between named places. The cliff-foot lanes: from TALUS beyond the foot of the cliff (the
    // strip under a cliff where rock comes down: nobody puts a mansion there) to PLOTS short of the first spur's street
    // (two plots left open where the lanes meet it). The gantry spur lane: from GULLY beyond the end of the second spur's
    // left row (the end of that spur, where the ground drops away) to POLES short of the gantry (its streamer poles stand
    // up to 30 m up the line from it; 3 m clear of the outermost).
    // lo, cap = the fewest and the most floors a house of the street has above its uphill sill: 4 is a shop, a hall and two
    // floors of flats (the fewest any mansion of this town has), 7 the most on the bench under the cliff; on the steep
    // flank of the gantry spur every plot has to be cut and walled into the slope, and a plot that dear is not built
    // under 6 floors, nor over 10.
    const LANE_W = 3, WAY_CLIFF = 13, WAY_SPUR = 33, FORECOURT = 2, PLOT_D = 16;   // PLOT_D: a plot from the building line to its back wall (the deepest house is 11.5 m, and a yard)
    const SPUR1_STREET = 111, SPUR2_ROW_END = 315;                      // where the first spur's street begins and where the second spur's left row ends (the canyonRow calls below)
    const TALUS = 20, PLOTS = 18, GULLY = 23, POLES = 33;
    // The gate streets (round 16): two more streets by the same law, on the gantry spur either side of the line, between
    // the same named places as the spur's left street (GULLY beyond the second spur's left row, POLES short of the gantry),
    // their lanes along the edges of the ropeway's strip (WAY_CLIFF from the line, as under the cliff): the painted houses
    // close round the cabin once more before the gantry. The ground there lies 25 to 33 m under the cable and the gate must
    // stand over the line, so the law of these two streets is: no house under 12 floors above its uphill sill, none over 14.
    // On the left the return cable swings out to the gantry's far bay (returnZ): the left street ends where the side of a
    // return cabin (CABIN_HALF from its cable: the cabin is 2 m across at its drip rail) comes within GATE_AIR of air of
    // the street's building line.
    const GATE_AIR = 3, CABIN_HALF = 1.0;
    let gateEnd = SPUR2_ROW_END + GULLY; while (gateEnd < RIM_PLACES.gantry - POLES && CABIN_HALF + GATE_AIR - returnZ(gateEnd) < WAY_CLIFF) gateEnd += 0.1;
    const ROWS = [{ x0: RIM_PLACES.cliffFoot + TALUS, x1: SPUR1_STREET - PLOTS, lane: -(WAY_CLIFF - LANE_W / 2), lo: 4, cap: 7 },
      { x0: RIM_PLACES.cliffFoot + TALUS, x1: SPUR1_STREET - PLOTS, lane: WAY_CLIFF - LANE_W / 2, lo: 4, cap: 7 },
      { x0: SPUR2_ROW_END + GULLY, x1: RIM_PLACES.gantry - POLES, lane: -(WAY_SPUR - LANE_W / 2), lo: 6, cap: 10 },
      { x0: SPUR2_ROW_END + GULLY, x1: RIM_PLACES.gantry - POLES, lane: WAY_CLIFF - LANE_W / 2, lo: 12, cap: 14, gate: true },
      { x0: SPUR2_ROW_END + GULLY, x1: gateEnd, lane: -(WAY_CLIFF - LANE_W / 2), lo: 12, cap: 14, gate: true }];
    // the ground a street takes (the hero builds none of its houses there): its lane and its plots, and 4 m past each end
    const rowGround = (r) => { const a = Math.abs(r.lane) - LANE_W / 2, b = Math.abs(r.lane) + LANE_W / 2 + FORECOURT + PLOT_D; return r.lane < 0 ? [r.x0 - 4, r.x1 + 4, -b, -a] : [r.x0 - 4, r.x1 + 4, a, b]; };
    const hero = await buildHero(ctx, { palette: PALETTE, frame: 'brief', clearNear: CLEAR, sunDir, green: wet ? 0.95 : undefined,
      keepOut: [[150, 187, 5, 34], [331, 438, -37, 37], ...ROWS.map(rowGround), [CEM.x0 - 3, CEM.x1 + 3, CEM.z0 - 3, CEM.z1 + 3], [STK.x - 12, STK.x + 12, STK.z - 11, STK.z + 12], [236, 300, 23, 30.5], ...YPZ.map((z) => [YX - 5, YX + 5, z - 5, z + 5])] });
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors, heightAt = hero.heightAt, eyeY = hero.eyeYAt;
    hero.setSun(sunDir, new THREE.Color().setRGB(look.sun[0], look.sun[1], look.sun[2]), new THREE.Color().setRGB(look.skyc[0], look.skyc[1], look.skyc[2]));
    U.uNight.value = look.night; U.uHaze.value.setRGB(look.haze[0], look.haze[1], look.haze[2]); U.uZen.value.setRGB(look.zen[0], look.zen[1], look.zen[2]);
    U.uRimSh.value.set(sunDir.y / Math.max(0.25, -sunDir.x), 0, look.rim); U.uCloudY.value = look.cloudY; U.uWet.value = wet ? 1 : 0;
    U.uFarK.value.set(look.farK ? look.farK[0] : 0.36, look.farK ? look.farK[1] : 1, look.bounce ?? 1); U.uAir.value.set(look.air ?? 0, look.airFar ?? 0, 0, 0);
    hero.setCabinGlow(isNight ? 1.2 : 0); hero.setPitchDots(0);
    for (const t of PLZ.t) t.y = Math.max(heightAt(t.x0, PLZ.z0), heightAt(t.x0, 19), heightAt(t.x0, PLZ.z1)) + 0.35;
    const path = makePath(A.flyThrough);
    await ctx.yield();
    // A street is broken by what crosses it. The gate streets are laid in stretches. A stretch is a run of the street
    // where its whole ground across (its lane, its forecourt and as far back as the deepest house of the law stands,
    // HOUSE_DEEP) keeps KERB clear of the kerbs of the switchback road that crosses the spur (hero.roadLines[0]) and of
    // the edge of the third stair alley (at STAIR3; its steps are twice STAIR_HALF wide and run from 2.6 m to CLEAR + 6 m
    // right of the line): the road and the alley stay open, and the alley is seen down between two houses. A stretch no
    // longer than the last house of a street may be narrow (6 m, the streets' law) is left as it was. A stretch takes
    // its ground like a street (rowGround). The first three streets meet neither road nor stair: one stretch each.
    const KERB = 1.5, STAIR3 = 372, STAIR_HALF = 0.95, HOUSE_DEEP = 11.5, RUN_STEP = 0.1, EAVES = 0.25, gateGround = [];
    for (const R of ROWS) {
      R.runs = [[R.x0, R.x1]];
      if (!R.gate) continue;
      const off = Math.sign(R.lane), za = R.lane - off * LANE_W / 2, zb = R.lane + off * (LANE_W / 2 + FORECOURT + HOUSE_DEEP), r0 = hero.roadLines[0];
      let i0 = r0.length, i1 = -1;
      for (let i = 0; i < r0.length; i++) if (r0[i][0] > R.x0 - 60 && r0[i][0] < R.x1 + 60 && Math.abs(r0[i][2]) < 90) { i0 = Math.min(i0, i); i1 = i; }
      const road = r0.slice(Math.max(0, i0 - 1), i1 + 2), stair = Math.min(za, zb) < CLEAR + 6 + KERB && Math.max(za, zb) > 2.6 - KERB;
      const free = (x) => {
        if (stair && Math.abs(x - STAIR3) < STAIR_HALF + KERB) return false;
        for (let k = 0; k <= 8 && road.length > 1; k++) if (distToPoly(road, x, lerp(za, zb, k / 8)) < RIM_PLACES.road0Width / 2 + KERB) return false;
        return true;
      };
      R.runs = [];
      for (let k = 0, a = null; ; k++) {
        const x = R.x0 + k * RUN_STEP, ok = x <= R.x1 + 1e-6 && free(x);
        if (ok && a === null) a = x;
        if (!ok && a !== null) { if (x - RUN_STEP - a > 6) R.runs.push([a, x - RUN_STEP]); a = null; }
        if (x > R.x1) break;
      }
      for (const run of R.runs) gateGround.push(rowGround({ x0: run[0], x1: run[1], lane: R.lane }));
    }
    // a full house whose footprint reaches into the ground of a gate street is not built (it takes its dice all the same)
    const inGateGround = (x, z, hw, hd) => { for (const g of gateGround) if (x + hw > g[0] && x - hw < g[1] && z + hd > g[2] && z - hd < g[3]) return true; return false; };
    await ctx.yield();

    const acc3 = [C3(PALETTE[5]), C3('#F08A1C'), C3(PALETTE[6])];
    const bounceU = { value: look.bounce ?? 1 };
    const propU = () => ({ uSelf: { value: 0 }, uBounce: bounceU, uAcc: { value: acc3 } });
    const propMat = makeMat(U, PROP_VERT, PROP_FRAG, propU());
    const hmW = 1100, hmH = 200, HX0 = -112, HZ0 = -50, HRES = 0.5, hm = new Float32Array(hmW * hmH);
    // terrain into the height map (plateau = 0; the wall on a 5 m lattice, bilinear)
    {
      const nx = 90, nz = 21, lat = new Float32Array(nx * nz);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) lat[j * nx + i] = heightAt(i * 5, HZ0 + j * 5);
      await ctx.yield();
      for (let j = 0; j < hmH; j++) for (let i = 224; i < hmW; i++) {
        if (i === 224 && (j & 15) === 0) await ctx.yield();
        const fx_ = Math.min(nx - 1.001, (HX0 + (i + 0.5) * HRES) / 5), fz = Math.min(nz - 1.001, (j + 0.5) * HRES / 5), ix = Math.floor(fx_), iz = Math.floor(fz), tx = fx_ - ix, tz = fz - iz;
        hm[j * hmW + i] = lerp(lerp(lat[iz * nx + ix], lat[iz * nx + ix + 1], tx), lerp(lat[(iz + 1) * nx + ix], lat[(iz + 1) * nx + ix + 1], tx), tz);
      }
    }
    await ctx.yield();
    const stamp = (cx, cz, hw, hd, yaw, top) => {
      const c = Math.cos(yaw), s = Math.sin(yaw), r = Math.hypot(hw, hd);
      const i0 = Math.max(0, Math.floor((cx - r - HX0) / HRES)), i1 = Math.min(hmW - 1, Math.ceil((cx + r - HX0) / HRES));
      const j0 = Math.max(0, Math.floor((cz - r - HZ0) / HRES)), j1 = Math.min(hmH - 1, Math.ceil((cz + r - HZ0) / HRES));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const dx = HX0 + (i + 0.5) * HRES - cx, dz = HZ0 + (j + 0.5) * HRES - cz, lx = c * dx - s * dz, lz = s * dx + c * dz;
        if (Math.abs(lx) <= hw && Math.abs(lz) <= hd && hm[j * hmW + i] < top) hm[j * hmW + i] = top;
      }
    };

    // ---- plateau layout: avenues, mansions, the rim town ----
    const roads = [
      [[-236, 0.05, 31], [-60, 0.05, 31], [-48, 0.05, 34], [-40, 0.05, 42], [-36, 0.05, 56], [-36, 0.05, 300]],
      [[-236, 0.05, -40], [-60, 0.05, -40], [-48, 0.05, -43], [-40, 0.05, -51], [-36, 0.05, -65], [-36, 0.05, -300]],
      [[-72, 0.05, -300], [-72, 0.05, 300]],
    ];
    const onPlateau = (x, z) => heightAt(x + 5, z) > -0.5;
    const rects = [];                                                     // footprints: [cx, cz, hw, hd]
    const blocked = (x, z, m) => { for (const r of rects) if (Math.abs(x - r[0]) < r[2] + m && Math.abs(z - r[1]) < r[3] + m) return true; return false; };
    const GP = new GB(), GM = new GB();                                   // plateau props, mansions
    for (const pts of roads) {
      const cum = polyLen(pts), n = pts.length; GP.at(0, 0, 0).kind(KIND.ROAD).rgb(0.33, 0.30, 0.27);
      let prev = -1;
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], tz = b[2] - a[2]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        const q = GP.v(pts[i][0] - tz * 4.6, 0.05, pts[i][2] + tx * 4.6, 0, 1, 0, 4.6, cum[i]); GP.v(pts[i][0] + tz * 4.6, 0.05, pts[i][2] - tx * 4.6, 0, 1, 0, -4.6, cum[i]);
        if (prev >= 0) GP.I.push(prev, q, prev + 1, prev + 1, q, q + 1);
        prev = q;
      }
    }
    const mrng = rng.fork('mansions');
    const mansion = (x, zf, w, d, floors, front) => {
      const sh = mrng.shuffle([0, 1, 2]), cz = zf - front * d / 2;
      GM.at(x, 0, cz, 0);
      const m = buildMansion(GM, mrng, w, d, floors, front, [acc3[sh[0]], acc3[sh[1]]]);
      rects.push([x, cz, w / 2, d / 2]); stamp(x, cz, w / 2 - 0.2, d / 2 - 0.2, 0, m.H + 1.0); stamp(x, cz, w * 0.3, d * 0.2, 0, m.top - 0.6);
      return m;
    };
    let tallest = 0;
    for (let x = -58, i = 0; i < 7; i++) { const w = i === 6 ? -4 - x : mrng.range(6.6, 8.4), g = mrng.range(0.2, 0.9); const m = mansion(x + w / 2, -13 - (i % 2) * mrng.range(0, 0.8), w - g, mrng.range(12, 14.5), mrng.int(5, 6), 1); tallest = Math.max(tallest, m.top); x += w; await ctx.yield(); }
    for (let x = -45, i = 0; i < 5; i++) { const w = i === 4 ? -4.5 - x : mrng.range(7.2, 8.8), g = mrng.range(0.2, 0.9); mansion(x + w / 2, 10 + (i % 2) * mrng.range(0, 0.8), w - g, mrng.range(11, 13), i < 2 ? 4 : mrng.int(4, 5), -1); x += w; await ctx.yield(); }
    mansion(-58, 41, 9, 13, 5, -1); mansion(-58, -49.5, 9.5, 13, 6, 1);
    await ctx.yield();
    // brick blocks of the rim town, each with a furnished roof
    const brickC = C3(PALETTE[1]), trng = rng.fork('town');
    const wallColour = (r) => (r.chance(0.2) ? r.pick(PAINTS).clone().multiplyScalar(r.range(0.72, 0.9)) : brickC.clone().lerp(r.chance(0.6) ? C3('#cf7f4c') : C3('#7e432b'), r() * 0.7).multiplyScalar(r.range(0.9, 1.15)));
    const townBlock = (x, z, w, d, floors, yaw) => {
      if (!onPlateau(x + d * 0.5, z) || blocked(x, z, Math.max(w, d) * 0.5)) return;
      for (const pts of roads) if (distToPoly(pts, x, z) < 5.2 + Math.max(w, d) * 0.5) return;
      const H = floors * 2.7 + 0.3, wc = wallColour(trng), t = trng();
      GP.at(x, 0, z, yaw).kind(KIND.BRICK, trng()).col(wc).box(w, H, d, 0, 0, 0, 0, 0.72, 2);
      if (t < 0.55) roofSlab(GP, trng, w, d, H, wc, 3); else if (t < 0.85) roofTin(GP, trng, w, d, H, 3); else roofUnfinished(GP, trng, w, d, H, wc, 3.4);
      rects.push([x, z, (Math.abs(Math.cos(yaw)) * w + Math.abs(Math.sin(yaw)) * d) / 2, (Math.abs(Math.sin(yaw)) * w + Math.abs(Math.cos(yaw)) * d) / 2]);
      stamp(x, z, w / 2 - 0.2, d / 2 - 0.2, yaw, H + 0.3);
    };
    let tbn = 0;
    for (const sg of [-1, 1]) {
      for (let z = sg > 0 ? 27 : -31; Math.abs(z) < 250;) { const w = trng.range(8, 12.5); if (trng.chance(0.88)) { townBlock(-19 + trng.range(-2.5, 2), z + sg * w / 2, trng.range(12, 17), w, trng.int(2, 5), trng.range(-0.06, 0.06)); if (++tbn % 5 === 0) await ctx.yield(); } z += sg * (w + trng.range(0.4, 3)); }
      await ctx.yield();
      for (let z = sg > 0 ? 66 : -74; Math.abs(z) < 250;) { const w = trng.range(8, 12); if (trng.chance(0.6)) { townBlock(-50 + trng.range(-2, 2), z + sg * w / 2, trng.range(10, 14), w, trng.int(2, 4), trng.range(-0.06, 0.06)); if (++tbn % 5 === 0) await ctx.yield(); } z += sg * (w + trng.range(1, 9)); }
      await ctx.yield();
    }
    await ctx.yield();

    // ---- the market: stalls under the line, tarpaulins, crowd ----
    const srng = rng.fork('stalls'); let sn = 0;
    for (const row of [[-9.6, 0, -106, -4.4], [2.2, Math.PI, -106, -4.4], [6.9, 0, -106, -48]]) {
      for (let x = row[2]; x < row[3]; x += srng.range(3.8, 4.3)) {
        if (x > -9 && heightAt(x + 2.2, row[0]) < -0.2) continue;
        if (row[0] < -9 && x > -8.6) continue;                                                          // a minibus is parked here
        if (Math.abs(x + 72) < 7 || (Math.abs(x + 60) < 3.2 && Math.abs(row[0] + 3.5) < 4) || !srng.chance(0.93)) continue;
        GP.at(x, 0, row[0], row[1] + srng.range(-0.05, 0.05));
        const s = buildStall(GP, srng, isNight); stamp(x, row[0], s.w / 2 + 0.2, s.d / 2 + 0.2, 0, s.h - 0.1);
        if (++sn % 5 === 0) await ctx.yield();
      }
      await ctx.yield();
    }
    // handcarts, crate stacks and gas bottles along the aisles
    for (let i = 0; i < 46; i++) {
      const x = srng.range(-106, -8), z = srng.pick([-4.6, -2.6, -12.2, 9.2]) + srng.range(-0.3, 0.3);
      if (Math.abs(x + 72) < 6 || blocked(x, z, 0.8) || (Math.abs(z + 3.5) < 2.4 && (Math.abs(x + 60) < 3 || Math.abs(x + 6) < 3))) continue;
      GP.at(x, 0, z, srng.range(0, TAU)).kind(KIND.PLAIN);
      const t = srng();
      if (t < 0.4) { GP.col(WOOD, 0.8).box(1.5, 0.12, 0.9, 0, 0.55, 0).col(DARK).box(0.5, 0.5, 0.08, 0, 0.1, 0.5).box(0.5, 0.5, 0.08, 0, 0.1, -0.5); for (let k = 0; k < 3; k++) GP.col(srng.pick(PRODUCE)).box(0.42, 0.3, 0.7, (k - 1) * 0.46, 0.67, 0); }
      else if (t < 0.75) for (let k = srng.int(2, 5); k > 0; k--) GP.col(srng.chance(0.5) ? WOOD : srng.pick(CLOTH), 0.8).box(0.6, 0.36, 0.45, srng.range(-0.3, 0.3), (k - 1) * 0.36, srng.range(-0.2, 0.2), srng.range(-0.3, 0.3), 0.8);
      else for (let k = 0; k < 3; k++) GP.col(srng.chance(0.6) ? '#e8c020' : '#2a5ab0').cyl(0.16, 0.16, 0.62, k * 0.36 - 0.36, 0, 0, 7, true, 0.7);
    }
    await ctx.yield();
    const trn = rng.fork('tarps'), PITCH = 3.9, TMAX = Math.round(8000 * busy);
    const TCAP = TMAX + 200, tPos = new Float32Array(TCAP * 4), tSize = new Float32Array(TCAP * 4), tCol = new Float32Array(TCAP * 3);
    const tarpPal = trn.shuffle(TARPC.slice()); let tn = 0;
    for (const lx of [-11.4, -7.7, -4.2]) for (let z = -11.2; z < 8.6 && tn < TMAX; z += 3.75) {
      if (Math.abs(lx + 6) < 3.4 && Math.abs(z + 3.5) < 3.3) continue;                                  // the rim tower stands here
      if (lx < -10 && z > -8 && z < 0.6) continue;                                                      // the aisle stays open further back
      const c = trn.pick(tarpPal), m = trn.range(0.62, 0.86);
      const hy0 = trn.range(3.7, 4.2), hy = Math.abs(z) > 4.5 ? 5.6 + (hy0 - 3.7) * 1.6 : (z > 3 && lx > -5 ? hy0 + 1.5 : hy0);
      tPos[tn * 4] = lx + trn.range(-0.3, 0.3); tPos[tn * 4 + 1] = hy; tPos[tn * 4 + 2] = z + trn.range(-0.3, 0.3); tPos[tn * 4 + 3] = trn.range(-0.2, 0.2);
      tSize[tn * 4] = trn.range(3.7, 4.3); tSize[tn * 4 + 1] = trn.range(3.7, 4.3); tSize[tn * 4 + 2] = trn();
      if (hy > 5.5) {                                                                                   // scaffold poles under the high ones
        GP.at(tPos[tn * 4], 0, tPos[tn * 4 + 2], 0).kind(KIND.PLAIN).col(WOOD, 0.75);
        for (const px of [-1, 1]) for (const pz of [-1, 1]) if (heightAt(tPos[tn * 4] + px * 1.8 + 1.2, tPos[tn * 4 + 2] + pz * 1.8) > -0.3) GP.box(0.09, hy + 0.35, 0.09, px * 1.8, 0, pz * 1.8, 0, 0.7, 2);
      }
      tCol[tn * 3] = c.r * m; tCol[tn * 3 + 1] = c.g * m; tCol[tn * 3 + 2] = c.b * m; tn++;
    }
    await ctx.yield();
    const PARKED = [[-4.2, 6.6, Math.PI / 2], [-4.2, -8.0, -Math.PI / 2]], prn = ctx.core.makeRng('rim-parked:' + ctx.seed);   // its own stream: a fork would shift every later draw
    for (const pb of PARKED) {
      stamp(pb[0], pb[1], 0.95, 2.5, 0, 2.5);
      for (const dz of [-1.6, 0.3, 1.9]) {
        const cx = pb[0] + 2.0 + prn.range(-0.15, 0.15), cz = pb[1] + dz;
        if (heightAt(cx + 1.4, cz) < -0.3) continue;
        GP.at(cx, 0, cz, prn.range(-0.3, 0.3)).kind(KIND.PLAIN);
        for (let k = prn.int(3, 6); k > 0; k--) GP.col(prn.chance(0.5) ? WOOD : prn.pick(CLOTH), 0.75).box(0.62, 0.4, 0.5, prn.range(-0.08, 0.08), (k - 1) * 0.4, prn.range(-0.08, 0.08), prn.range(-0.2, 0.2), 0.8);
        stamp(cx, cz, 0.3, 0.3, 0, 1.6);
      }
    }
    const freeSpot = (x, z, m) => {
      if (z > -11.6 && z < 9 && x > -108.5) return false;
      if (z >= 9 && z < 11 && x > -108.5 && x < -47) return false;
      if (blocked(x, z, m) || !onPlateau(x, z)) return false;
      for (const pts of roads) if (distToPoly(pts, x, z) < 4.8 + m) return false;
      return true;
    };
    for (let ix = 0; ix < 60 && tn < TMAX; ix++) for (let iz = 0; iz < 156 && tn < TMAX; iz++) {
      if (iz === 0) await ctx.yield();                                                                  // once a row of pitches
      if (ix % 6 === 0 || iz % 5 === 0) continue;
      const x = -236 + ix * PITCH + trn.range(-0.35, 0.35), z = -304 + iz * PITCH + trn.range(-0.35, 0.35), r = Math.hypot(x + 60, z);
      if (trn() < sstep(120, 250, r) * 0.9 + 0.06 || !freeSpot(x, z, 1.9)) continue;
      const nearLine = Math.abs(z) < 9, c = trn() < 0.34 ? tarpPal[0] : trn.pick(tarpPal);
      tPos[tn * 4] = x; tPos[tn * 4 + 1] = nearLine ? trn.range(2.3, 2.9) : trn.range(2.2, 3.4); tPos[tn * 4 + 2] = z; tPos[tn * 4 + 3] = trn.range(-0.22, 0.22) + (trn.chance(0.1) ? trn.range(-0.6, 0.6) : 0);
      tSize[tn * 4] = trn.range(3.1, 4.3); tSize[tn * 4 + 1] = trn.range(3.0, 4.2); tSize[tn * 4 + 2] = trn(); 
      const m = trn.range(0.62, 0.86); tCol[tn * 3] = c.r * m; tCol[tn * 3 + 1] = c.g * m; tCol[tn * 3 + 2] = c.b * m; tn++;
    }
    await ctx.yield();
    const stairRun = Math.ceil((PLZ.t[0].y - PLZ.t[1].y) / 0.36) * 0.5;
    {                                                                     // the terrace market: small tarpaulins in rows, an aisle down each deck
      const pr = ctx.core.makeRng('rim-plaza:' + ctx.seed);
      for (const t of PLZ.t) for (let ix = 0; ix < 5; ix++) for (let z = PLZ.z0 + 1.6; z < PLZ.z1 - 1.5 && tn < TCAP; z += 2.4) {
        const x = t.x0 + 1.6 + ix * 2.4;
        if (ix === 2 || !pr.chance(0.93) || (t === PLZ.t[1] && x < t.x0 + stairRun + 1.4 && z < PLZ.z0 + 3.4)) continue;
        const c = pr() < 0.3 ? tarpPal[0] : pr.pick(tarpPal), m = pr.range(0.66, 0.9);
        tPos[tn * 4] = x + pr.range(-0.15, 0.15); tPos[tn * 4 + 1] = pr.range(2.2, 2.8); tPos[tn * 4 + 2] = z + pr.range(-0.15, 0.15); tPos[tn * 4 + 3] = pr.range(-0.15, 0.15);
        tSize[tn * 4] = pr.range(2.1, 2.5); tSize[tn * 4 + 1] = pr.range(2.1, 2.5); tSize[tn * 4 + 2] = pr(); tSize[tn * 4 + 3] = t.y;
        tCol[tn * 3] = c.r * m; tCol[tn * 3 + 1] = c.g * m; tCol[tn * 3 + 2] = c.b * m; tn++;
      }
    }
    {                                                                     // awnings lean out over both kerbs of the cross-road under the entry, so no bare strip of road lies across the first view
      const kr = ctx.core.makeRng('rim-kerb:' + ctx.seed);
      for (const kx of [-77.9, -66.1]) for (let z = -27; z < 27.5 && tn < TCAP; z += 3.7) {
        const c = kr.pick(tarpPal), m = kr.range(0.66, 0.9);
        tPos[tn * 4] = kx + kr.range(-0.2, 0.2); tPos[tn * 4 + 1] = kr.range(3.0, 3.6); tPos[tn * 4 + 2] = z + kr.range(-0.2, 0.2); tPos[tn * 4 + 3] = kr.range(-0.12, 0.12);
        tSize[tn * 4] = kr.range(3.3, 3.7); tSize[tn * 4 + 1] = kr.range(3.3, 3.7); tSize[tn * 4 + 2] = kr(); tSize[tn * 4 + 3] = 0;
        tCol[tn * 3] = c.r * m; tCol[tn * 3 + 1] = c.g * m; tCol[tn * 3 + 2] = c.b * m; tn++;
      }
    }
    {
      const P = [], S = [], I = [];
      for (let s = 0; s < 2; s++) { const b = P.length / 3; P.push(-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, 0, 1, 0); for (let k = 0; k < 5; k++) S.push(s); if (s === 0) for (let k = 0; k < 4; k++) I.push(b + 4, b + (k + 1) % 4, b + k); else I.push(b + 1, b, b + 3, b + 1, b + 3, b + 2); }   // the shadow lies flat: its fan of four was the same quad
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); base.setIndex(I);
      const tarps = new THREE.Mesh(instanced(base, { iPos: [tPos, 4], iSize: [tSize, 4], iCol: [tCol, 3] }, tn), makeMat(U, TARP_VERT, TARP_FRAG));
      tarps.frustumCulled = false; scene.add(tarps);
    }
    await ctx.yield();

    const crn = rng.fork('crowd'), CMAX = Math.round((2500 + (festival ? 460 : 0)) * busy);
    const cCap = [CMAX, CMAX, 240, 240], cA = cCap.map((n) => new Float32Array(n * 4)), cB = cCap.map((n) => new Float32Array(n * 4)), cC = cCap.map((n) => new Float32Array(n * 3)), cY = cCap.map((n) => new Float32Array(n)), cn = [0, 0, 0, 0];   // sets 2 and 3: the terrace shoppers, drawn with a fuller figure
    const person = (x, z, ang, L, speed, col, ph, par, y = 0) => {
      const k = (y !== 0 ? 2 : 0) + (par ? 1 : 0), i = cn[k]++; if (i >= cCap[k]) { cn[k]--; return; }
      cY[k][i] = y;
      cA[k][i * 4] = x; cA[k][i * 4 + 1] = z; cA[k][i * 4 + 2] = ang; cA[k][i * 4 + 3] = L;
      cB[k][i * 4] = speed; cB[k][i * 4 + 1] = ph; cB[k][i * 4 + 2] = crn.range(0.88, 1.12); cB[k][i * 4 + 3] = crn();
      cC[k][i * 3] = col.r; cC[k][i * 3 + 1] = col.g; cC[k][i * 3 + 2] = col.b;
    };
    const walker = (x, z, ang, L) => { const st = crn.chance(0.22); person(x, z, ang, st ? 3 : L, st ? 0 : crn.range(0.5, 1.3) * (crn.chance(0.5) ? -1 : 1), crn.chance(0.25) ? C3('#3a2a22') : crn.pick(CLOTH).clone().multiplyScalar(crn.range(0.5, 0.95)), crn(), crn.chance(0.11)); };
    for (let i = 0; i < Math.round(420 * busy); i++) walker(crn.range(-104, -10), crn.pick([-4.4, -3.4, -2.6, -12.4]) + crn.range(-0.5, 0.5), 0, crn.range(14, 40));
    await ctx.yield();
    for (let i = 0, tries = 0; i < Math.round(2000 * busy) && tries < 9000; tries++) {
      if ((tries & 127) === 0) await ctx.yield();
      const alongX = crn.chance(0.5);
      const x = alongX ? crn.range(-225, -12) : -236 + crn.int(1, 9) * 6 * PITCH + crn.range(-0.8, 0.8), z = alongX ? -304 + crn.int(2, 29) * 5 * PITCH + crn.range(-0.8, 0.8) : crn.range(-230, 230);
      if (Math.hypot(x + 60, z) > 240 || !freeSpot(x, z, 0.6) && !(z > -11.6 && z < 11)) continue;
      if (blocked(x, z, 1.2) || !onPlateau(x, z) || (Math.abs(z) < 12 && x > -108.5)) continue;
      walker(x, z, alongX ? 0 : Math.PI / 2, crn.range(10, 26)); i++;
    }
    if (festival) for (let i = 0; i < 460; i++) { const row = i % 5, ph = Math.floor(i / 5) / 92; person(-130, 28.4 + row * 1.3, 0, 160, 0.9, CLOTH[Math.floor(ph * 23) % CLOTH.length], ph + crn.range(-0.002, 0.002), false); }
    {                                                                     // shoppers on the terrace market: down the aisle and along the edges of each deck
      const pw = ctx.core.makeRng('rim-plaza-crowd:' + ctx.seed), zc = (PLZ.z0 + PLZ.z1) / 2, L = PLZ.z1 - PLZ.z0 - 2.4;
      for (let i = 0; i < Math.round(150 * busy); i++) {
        const t = PLZ.t[i & 1], lane = pw(), x = lane < 0.6 ? t.x0 + 6.4 + pw.range(-0.8, 0.8) : lane < 0.8 ? t.x0 + 0.75 : t.x1 - 0.75, st = pw.chance(0.25);
        if (t === PLZ.t[1] && x < t.x0 + 1) continue;
        person(x, zc + (st ? pw.range(-0.4, 0.4) * L : 0), Math.PI / 2, st ? 3 : L, st ? 0 : pw.range(0.5, 1.2) * (pw.chance(0.5) ? -1 : 1), pw.chance(0.25) ? C3('#3a2a22') : pw.pick(CLOTH).clone().multiplyScalar(pw.range(0.5, 0.95)), pw(), pw.chance(0.14), t.y);
      }
    }
    await ctx.yield();
    const crowdMat = makeMat(U, CROWD_VERT, CROWD_FRAG);
    for (let k = 0; k < 4; k++) {
      if (!cn[k]) continue;
      const m = new THREE.Mesh(instanced(k < 2 ? crowdGeometry(k === 1) : crowdGeometryNear(k === 3), { iA: [cA[k], 4], iB: [cB[k], 4], iCol: [cC[k], 3], iY: [cY[k], 1] }, cn[k]), crowdMat);
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- the two close passes: full-detail houses on the spurs the hero left clear ----
    const hrng = rng.fork('houses'), GH = [new GB(), new GB()], hRects = [], dogRoofs = [], CELL = 6.3;
    const roofEx = { night: isNight, people: [] }, canyon = [], cyn = ctx.core.makeRng('rim-canyon:' + ctx.seed), bun = ctx.core.makeRng('rim-bunting:' + ctx.seed);   // own streams: a fork would shift every later draw
    // a street of mansions down each spur: zigzag facades and mirror windows ten metres either side of the cabin,
    // their roofs above the eye line (they stop short of the terrace market and leave the pitch in view)
    const GX = new GB(), lowr = ctx.core.makeRng('rim-canyon-low:' + ctx.seed);
    const canyonRow = (x0, x1, side, lowFrom = 1e9) => {
      for (let x = x0; x < x1 - 6;) {
        const w = Math.min(cyn.range(8.4, 10.8), x1 - x), d = cyn.range(9.5, 11.5), face = side * cyn.range(9.8, 11.8), xc = x + w / 2, zc = face + side * d / 2;
        const hs = [heightAt(xc - w / 2, face), heightAt(xc + w / 2, face), heightAt(xc - w / 2, face + side * d), heightAt(xc + w / 2, face + side * d)];
        const g0 = Math.min(...hs), base = Math.max(...hs) - 0.7;
        const floors = Math.max(4, Math.min(7, Math.round((eyeY(xc) + cyn.range(3, 7.5) - base - 3.6) / 3.2) + 1));
        const GR = GH[xc < 204 ? 0 : 1], low = xc > lowFrom, G = low ? GX : GR, sh = cyn.shuffle([0, 1, 2]);   // GX is thrown away: a mansion that is not built still takes its draws
        GR.at(xc, g0 - 1.5, zc, 0).kind(KIND.CONC, cyn()).col(CONCRETE, 0.8).box(w + 0.4, base - g0 + 1.5, d + 0.4, 0, 0, 0, 0, 0.7, 2);   // plinth down the slope
        G.at(xc, base, zc, 0);
        const m = buildMansion(G, cyn, w, d, floors, -side, [acc3[sh[0]], acc3[sh[1]]]);
        {                                                                 // pennants along the parapet that faces the cabin, a flag at its corner
          const zf = -side * (d / 2 + 0.3), yl = m.H + 1.55, n = Math.round(w / 0.66);
          G.kind(KIND.PLAIN).col(STEEL, 0.6);
          for (const sx of [-1, 1]) G.box(0.05, 0.6, 0.05, sx * (w / 2 + 0.1), m.H + 1.0, zf, 0, 1, 2);
          G.col(DARK).box(w + 0.2, 0.02, 0.02, 0, yl, zf, 0, 1, 3);
          for (let i = 0; i < n; i++) {
            const x0 = -w / 2 + (i + 0.14) * w / n, x1 = -w / 2 + (i + 0.86) * w / n, sag = (t) => yl - 0.35 * Math.sin(Math.PI * t);
            G.kind(KIND.CLOTH, 0.5 + 0.013 * i, 0.3).col(bun.pick(CLOTH), 0.95).quad([x0, sag((i + 0.14) / n), zf], [x1, sag((i + 0.86) / n), zf], [(x0 + x1) / 2, sag((i + 0.5) / n) - 0.62, zf], [(x0 + x1) / 2, sag((i + 0.5) / n) - 0.62, zf]);
          }
          const fx_ = (bun.chance(0.5) ? -1 : 1) * (w / 2 - 0.5), fz = -side * (d / 2 - 0.5), fy = m.H + 1.1, fh = bun.range(4.2, 5.4), fw = bun.range(1.9, 2.5);
          G.kind(KIND.PLAIN).col(STEEL, 0.75).box(0.08, fh, 0.08, fx_, fy, fz, 0, 1, 2);
          G.kind(KIND.CLOTH, bun(), 0.34).col(bun.pick(CLOTH)).quad([fx_, fy + fh - 1.35, fz], [fx_, fy + fh - 0.05, fz], [fx_ + fw, fy + fh - 0.05, fz + 0.3], [fx_ + fw, fy + fh - 1.35, fz + 0.3]);
          // long striped banners let down the facade from the parapet, swaying slowly in the updraught
          const zb = -side * (d / 2 + 0.14);
          for (const bx of [-0.27, 0.27]) {
            if (!bun.chance(0.85)) continue;
            const cx = bx * w + bun.range(-0.3, 0.3), bw = bun.range(1.3, 1.9), L = Math.min(m.H - 4.5, bun.range(5.5, 9)), yt = m.H + 0.25;
            GX.at(xc, base, zc, 0).kind(KIND.CLOTH, bun(), -0.05).col(bun.pick(CLOTH), 0.95).quad([cx - bw / 2, yt, zb], [cx + bw / 2, yt, zb], [cx + bw / 2, yt - L, zb], [cx - bw / 2, yt - L, zb]);   // not drawn: over the zigzags they read as clashing layers
          }
        }
        if (low) {                                                        // two floors of brick with a furnished roof, well under the eye: the view opens over it
          const hl = 5.7, wc = wallColour(lowr);
          GR.at(xc, 0, zc, 0).kind(KIND.BRICK, lowr()).col(wc).box(w, hl, d, 0, base, 0, 0, 0.7, 2);
          GR.at(xc, base + hl, zc, 0); roofSlab(GR, lowr, w, d, 0, wc, 3.1, roofEx);
          stamp(xc, zc, w / 2 - 0.2, d / 2 - 0.2, 0, base + hl + 0.12);
        } else { stamp(xc, zc, w / 2 - 0.2, d / 2 - 0.2, 0, base + m.H + 1.0); stamp(xc, zc, w * 0.3, d * 0.2, 0, base + m.top - 0.6); }
        if (x === x0) {                                                   // the first of each street carries a mural on the wall that faces the cabin as it comes down
          const mh = m.H - 4.5, md = d - 1.2, sdm = (side > 0 ? 0.5 : 0) + (x0 > 200 ? 0.25 : 0) + 0.07, mx = -w / 2 - 0.15;
          G.at(xc, base, zc, 0).kind(KIND.MURAL, sdm).rgb(md / mh, 1, 1).quad([mx, 4.0, -md / 2], [mx, 4.0, md / 2], [mx, 4.0 + mh, md / 2], [mx, 4.0 + mh, -md / 2], [0, 0, md / mh, 1]);
        }
        canyon.push([xc, zc, w / 2, d / 2]); hRects.push([xc, zc, Math.max(w, d) / 2]);
        x += w + cyn.range(0.8, 2.6);
      }
    };
    canyonRow(111, 175, -1); await ctx.yield(); canyonRow(111, 141, 1, 121); await ctx.yield();
    canyonRow(241, 315, -1); await ctx.yield(); canyonRow(303, 320, 1); await ctx.yield();
    {                                                                     // the terrace market: two decks on a brick market hall, steps between them
      const G = GH[0], cz = (PLZ.z0 + PLZ.z1) / 2, d = PLZ.z1 - PLZ.z0;
      for (let k = 0; k < PLZ.t.length; k++) {
        const t = PLZ.t[k], cx = (t.x0 + t.x1) / 2, w = t.x1 - t.x0;
        let g0 = 1e9; for (const px of [t.x0, t.x1]) for (const pz of [PLZ.z0, cz, PLZ.z1]) g0 = Math.min(g0, heightAt(px, pz));
        G.at(cx, 0, cz, 0).kind(KIND.BRICK, 0.37 + 0.21 * k).col(brickC, 1.0).box(w, t.y - 0.25 - g0 + 2, d, 0, g0 - 2, 0, 0, 0.7, 2);
        G.kind(KIND.CONC, 0.6 + 0.1 * k).col(CONCRETE, 0.66).box(w + 0.5, 0.25, d + 0.5, 0, t.y - 0.25, 0);
        G.kind(KIND.BRICK, 0.2 + 0.3 * k, 0, -1).col(k ? '#cf7f4c' : '#9fc4dc', 0.85);
        for (const sg of [-1, 1]) G.box(w + 0.5, 0.55, 0.16, 0, t.y, sg * (d / 2 + 0.17), 0, 1, 3);
        if (k === PLZ.t.length - 1) G.box(0.16, 0.55, d + 0.5, w / 2 + 0.17, t.y, 0, 0, 1, 3);
        G.kind(KIND.PLAIN);
        for (let i = 0; i < 9; i++) {                                     // crates and sacks at the ends of the rows
          const px = (i % 2 ? -1 : 1) * (w / 2 - 0.6), pz = -d / 2 + 1.5 + i * (d - 3) / 8;
          G.col(i % 3 ? WOOD : CLOTH[(i + k * 3) % CLOTH.length], 0.8).box(0.6, 0.4 + 0.3 * (i % 3), 0.5, px, t.y, pz, i * 0.7, 0.8);
        }
        stamp(cx, cz, w / 2, d / 2, 0, t.y);
      }
      const a = PLZ.t[0], b = PLZ.t[1], n = Math.ceil((a.y - b.y) / 0.36);
      G.at(0, 0, 0).kind(KIND.CONC, 0.45).col(CONCRETE, 0.85);
      for (let i = 0; i < n; i++) G.box(0.5, Math.max(0.2, a.y - (i + 1) * 0.36 - b.y), 2.2, a.x1 + 0.25 + i * 0.5, b.y, PLZ.z0 + 1.3, 0, 0.8, 3);
    }
    await ctx.yield();
    {                                                                     // the cemetery on the first spur, out to the right where the reveal looks: white walls of niches stepping down the slope,
      // a stair down the middle, a chapel at the top and a few dark cypresses (hashes of the place, no random draws)
      const G = GH[0], zm = (CEM.z0 + CEM.z1) / 2, hsh = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
      for (let xr = CEM.x0 + 7, r = 0; xr < CEM.x1 - 1; xr += 5.6, r++) for (const sg of [-1, 1]) {
        const za = sg < 0 ? CEM.z0 : zm + 1.6, zb = sg < 0 ? zm - 1.6 : CEM.z1, zc = (za + zb) / 2, len = zb - za;
        const ha = heightAt(xr, za), hb = heightAt(xr, zb), hc = heightAt(xr, zc), g0 = Math.min(ha, hb, hc) - 1.2, top = Math.max(ha, hb, hc) + 3.5;
        G.at(xr, 0, zc, 0).kind(KIND.NICHE, hsh(xr, sg)).col('#e4e2da').box(1.7, top - g0, len, 0, g0, 0, 0, 0.85, 2);
        G.kind(KIND.PLAIN).col('#e8e6de', 0.95).box(2.1, 0.2, len + 0.3, 0, top, 0);
        if (hsh(xr, sg + 3) < 0.7) { const cz = (hsh(xr, sg + 5) - 0.5) * (len - 3), gy = heightAt(xr + 2.8, zc + cz); G.kind(KIND.LEAF, hsh(xr, sg + 7), -0.04).col('#1f4a2a', 0.9).blob(0.8, 3.0, 0.8, 2.8, gy + 2.7, cz, 0.6).kind(KIND.PLAIN).col(WOOD, 0.6).box(0.18, 1.2, 0.18, 2.8, gy - 0.3, cz, 0, 1, 2); }
      }
      G.at(0, 0, 0).kind(KIND.CONC, 0.52).col(CONCRETE, 1.0);
      for (let x = CEM.x0 + 5; x < CEM.x1; x += 0.95) G.box(1.0, 0.7, 2.4, x, heightAt(x, zm) - 0.42, zm, 0, 0.8, 3);
      const cx = CEM.x0 + 2.5, cg = Math.min(heightAt(cx - 2.5, zm), heightAt(cx + 2.5, zm)), ct = Math.max(heightAt(cx - 2.5, zm), heightAt(cx + 2.5, zm)) + 4.6;
      G.at(cx, 0, zm, 0).kind(KIND.PLAIN).col('#e8e6de', 0.95).box(5, ct - cg + 1, 6.4, 0, cg - 1, 0, 0, 0.85, 2);
      G.kind(KIND.TIN, 0.41).col('#1f6f86');
      G.quad([-2.9, ct - 0.1, 3.6], [0, ct + 1.9, 3.6], [0, ct + 1.9, -3.6], [-2.9, ct - 0.1, -3.6]).quad([0, ct + 1.9, 3.6], [2.9, ct - 0.1, 3.6], [2.9, ct - 0.1, -3.6], [0, ct + 1.9, -3.6]);
      G.kind(KIND.PLAIN).col('#e8e6de', 0.95);
      for (const sz of [-1, 1]) G.quad([-2.5, ct, sz * 3.2], [2.5, ct, sz * 3.2], [0, ct + 1.9, sz * 3.2], [0, ct + 1.9, sz * 3.2]);
      G.box(1.7, 4.2, 1.7, 0, ct, -4.3, 0, 0.9, 2).box(1.7, ct - cg + 1, 1.7, 0, cg - 1, -4.3, 0, 0.85, 2).col('#1f6f86').cyl(1.35, 0.05, 1.7, 0, ct + 4.2, -4.3, 4, false);
    }
    await ctx.yield();
    let hn = 0;
    for (let gx = 97; gx < 334; gx += CELL) {
      for (let gz = -CLEAR + 2.6; gz < CLEAR - 2; gz += CELL) {
        const x = gx + hrng.range(-0.5, 0.5), z = gz + hrng.range(-0.5, 0.5), gully = x > 187 && x < 221;
        if ((Math.abs(x - 150) < 2.3 || Math.abs(x - 272) < 2.3) && z > 2) continue;                 // stair alleys
        if (Math.abs(x - 200) < 6.5 && Math.abs(z + 3.5) < 6.5) continue;                              // the gully mast
        if (hrng.chance(gully ? 0.5 : 0.06)) continue;
        let taken = x > 151 && x < 186 && z > 4.6 && z < 34;                                           // the terrace market
        for (const c of canyon) if (Math.abs(x - c[0]) < c[2] + 3.6 && Math.abs(z - c[1]) < c[3] + 3.6) { taken = true; break; }
        if (taken || (Math.abs(x - YX) < 5.5 && Math.abs(Math.abs(z) - 38) < 5)) continue;
        let w = hrng.range(4.9, 6.1), d = hrng.range(4.8, 6.0); const yaw = hrng.range(-0.09, 0.09) + (hrng.chance(0.08) ? hrng.range(-0.3, 0.3) : 0);
        if ((Math.abs(x - 150) < 5.4 || Math.abs(x - 272) < 5.4) && z > 2) w = Math.min(w, 2 * (Math.min(Math.abs(x - 150), Math.abs(x - 272)) - 1.1));
        const hc = heightAt(x, z), hs = [heightAt(x - w / 2, z - d / 2), heightAt(x + w / 2, z - d / 2), heightAt(x - w / 2, z + d / 2), heightAt(x + w / 2, z + d / 2)];
        const g0 = Math.min(hc, ...hs), g1 = Math.max(hc, ...hs);
        const reach = Math.max(0, Math.abs(z) - (w + d) * 0.3), eyeMin = eyeY(x + w / 2 + 0.8);
        const cap = eyeMin - (reach < 6.2 ? 5.4 : z > 8 && x > 212 && x < 300 ? 9.5 : 2.2);        // low on the right of the second spur: the pitch is beyond
        let floors = hrng() < 0.3 ? 1 : hrng() < 0.75 ? 2 : 3, top = hc + floors * 2.7 + 0.3;
        while (top > cap && floors > 1) { floors--; top = hc + floors * 2.7 + 0.3; }
        if (top > cap || (reach < 6.2 && hrng.chance(0.62))) top = cap - hrng.range(0, 1.3);
        if (top < g1 + 2.1) continue;
        const up = reach < 3.4 ? 1.05 : reach < 6.2 ? 1.9 : 3.1, wc = wallColour(hrng), G = GH[x < 204 ? 0 : 1], t = hrng();
        G.at(x, 0, z, yaw).kind(KIND.BRICK, hrng()).col(wc).box(w, top - g0 + 1.5, d, 0, g0 - 1.5, 0, 0, 0.62, 2);
        G.at(x, top, z, yaw);
        if (t < 0.5) roofTin(G, hrng, w, d, 0, up);
        else if (t < 0.84) { roofSlab(G, hrng, w, d, 0, wc, up, roofEx); if (x > 236 && x < 318 && z > 1.5 && z < 9.5) dogRoofs.push({ x, y: top + Math.min(0.55, up), z, yaw, w, d }); }
        else roofUnfinished(G, hrng, w, d, 0, wc, up);
        hRects.push([x, z, Math.max(w, d) / 2]); stamp(x, z, w / 2 - 0.2, d / 2 - 0.2, yaw, top + 0.12);
        if (++hn % 3 === 0) await ctx.yield();
      }
      await ctx.yield();
    }
    {                                                                     // the spur under the portal gantry: the same full houses, so the
      // city the cabin sinks toward in the last seconds is real (the eye is 25 to 33 m up here: roofs take every kind of clutter)
      const arn = ctx.core.makeRng('rim-approach:' + ctx.seed), G = GH[1], AC = 7.0; let an = 0;
      for (let gx = 337.4; gx < 432; gx += AC) {
        for (let gz = -28; gz < 28.5; gz += AC) {
          const x = gx + arn.range(-0.6, 0.6), z = gz + arn.range(-0.6, 0.6);
          let w = arn.range(4.9, 6.2); const d = arn.range(4.8, 6.1), yaw = arn.range(-0.09, 0.09) + (arn.chance(0.1) ? arn.range(-0.3, 0.3) : 0);
          const fl = arn(), t = arn(), wc = wallColour(arn), sd = arn();
          if (arn.chance(0.07)) continue;
          if (Math.abs(x - 415) < 10.5 && ((z > -20.5 && z < -5.2) || (z > 5.2 && z < 14.6))) continue;   // the gantry stands here
          if (Math.abs(x - 372) < 2.3 && z > 2) continue;                                                 // a stair alley
          if (Math.abs(x - STK.x) < 12.5 && z > STK.z - 14) continue;                                     // the painted stack stands here
          if (Math.abs(x - 372) < 5.4 && z > 2) w = Math.min(w, 2 * (Math.abs(x - 372) - 1.1));
          const hc = heightAt(x, z), hs = [heightAt(x - w / 2, z - d / 2), heightAt(x + w / 2, z - d / 2), heightAt(x - w / 2, z + d / 2), heightAt(x + w / 2, z + d / 2)];
          const g0 = Math.min(hc, ...hs), g1 = Math.max(hc, ...hs);
          let top = hc + (fl < 0.28 ? 1 : fl < 0.72 ? 2 : 3) * 2.7 + 0.3; if (top < g1 + 2.2) top = g1 + 2.4;
          if (top + 3.4 > eyeY(x) - 9) continue;
          // where a gate street has taken the ground the house is drawn into GX, which is thrown away: its dice are taken, so
          // the houses after it stand as they stood; it throws no shadow, the people on its roof are not shown, and its
          // ground stays kept (hRects): nothing is planted where a street took a house
          const gone = inGateGround(x, z, w / 2, d / 2), GA = gone ? GX : G, np = roofEx.people.length;
          GA.at(x, 0, z, yaw).kind(KIND.BRICK, sd).col(wc).box(w, top - g0 + 1.5, d, 0, g0 - 1.5, 0, 0, 0.62, 2);
          GA.at(x, top, z, yaw);
          if (t < 0.5) roofTin(GA, arn, w, d, 0, 3.1); else if (t < 0.84) roofSlab(GA, arn, w, d, 0, wc, 3.1, roofEx); else roofUnfinished(GA, arn, w, d, 0, wc, 3.1);
          hRects.push([x, z, Math.max(w, d) / 2]);
          if (gone) for (let i = np; i < roofEx.people.length; i++) roofEx.people[i].gone = true; else stamp(x, z, w / 2 - 0.2, d / 2 - 0.2, yaw, top + 0.12);
          if (++an % 3 === 0) await ctx.yield();
        }
        await ctx.yield();
      }
    }
    {                                                                     // beside the last roofs of the second spur: houses stacked up a clay pinnacle in steps, each a different paint,
      // their fronts and roofs turned to the cabin as it leaves the spur for the gantry (its own stream of draws)
      const sr = ctx.core.makeRng('rim-stack:' + ctx.seed), G = GH[1], SP = ['#1fa8c0', '#e84a9a', '#f2c21a', '#a9d8c0', '#7A3DB8', '#e8e6de', '#F08A1C', '#10A56B', '#9fc4dc'].map(C3);
      let g0 = 1e9; for (const dx of [-10, 0, 10]) for (const dz of [-11, 0, 11]) g0 = Math.min(g0, heightAt(STK.x + dx, STK.z + dz));
      const FL = 5.4, topY = eyeY(STK.x) - 1.8, n = Math.min(6, Math.max(2, Math.ceil((topY - g0) / FL)));
      for (let t = 0; t < n; t++) {
        const y = topY - (t + 1) * FL, zt = STK.z + 7.5 - t * 2.9, hd = (STK.z + 11 - (zt - 2.6)) / 2;
        G.at(STK.x, 0, zt - 2.6 + hd, 0).kind(KIND.CONC, 0.31 + 0.1 * t).col('#b98a62', 0.82).box(19.5, y - g0 + 2.5, hd * 2, 0, g0 - 2.5, 0, 0, 0.7, 3);
        stamp(STK.x, zt - 2.6 + hd, 9.7, hd, 0, y);
        for (let j = 0; j < 3; j++) {
          const w = sr.range(5.4, 6.3), d = sr.range(5.2, 6.0), x = STK.x + (j - 1) * 6.4 + sr.range(-0.25, 0.25), z = zt + sr.range(-0.3, 0.3), h = FL + sr.range(-0.6, 0.5) - (t === 0 ? sr.range(0, 1.6) : 0);
          const wc = sr.pick(SP).clone().multiplyScalar(sr.range(0.62, 0.8)), yaw = sr.range(-0.05, 0.05), kindR = sr();
          G.at(x, 0, z, yaw).kind(KIND.BRICK, sr()).col(wc).box(w, h + 0.4, d, 0, y - 0.4, 0, 0, 0.7, 2);
          G.at(x, y + h, z, yaw);
          if (kindR < 0.55) roofTin(G, sr, w, d, 0, 1.6); else roofSlab(G, sr, w, d, 0, wc, 1.9);
          stamp(x, z, w / 2 - 0.2, d / 2 - 0.2, yaw, y + h + 0.12);
        }
      }
      hRects.push([STK.x, STK.z, 12]);
    }
    await ctx.yield();
    {                                                                     // the gantry dressed for the arrival: pennants across the top of the bay, a flag at each end of the truss, and
      // streamers of pennants let down from the truss ends to poles among the roofs on either side (its own stream of draws)
      const gq = ctx.core.makeRng('rim-gantry:' + ctx.seed), G = GH[1], gp = A.portalSeat.position, gx = gp.x, topY = gp.y + 10.2;
      const strand = (ax, ay, az, bx, by, bz, sag, n, sz) => {
        for (let i = 0; i < n; i++) {
          const yAt = (t) => lerp(ay, by, t) - sag * Math.sin(Math.PI * t), P = (t, dy) => [lerp(ax, bx, t), yAt(t) - dy, lerp(az, bz, t)], tm_ = (i + 0.5) / n;
          G.kind(KIND.CLOTH, 0.5 + 0.011 * i, 0.3).col(gq.pick(CLOTH), 0.95).quad(P((i + 0.06) / n, 0), P((i + 0.94) / n, 0), P(tm_, sz), P(tm_, sz));
        }
      };
      G.at(0, 0, 0); strand(gx, topY - 0.15, -9.3, gx, topY - 0.15, 9.3, 0.45, 15, 1.5);
      for (const e of [[11.1, 1], [-16.8, -1]]) {
        const z0 = e[0], sg = e[1];
        G.kind(KIND.PLAIN).col(STEEL, 0.7).box(0.1, 5.6, 0.1, gx, topY + 2.2, z0, 0, 1, 2);
        G.kind(KIND.CLOTH, gq(), 0.34).col(sg > 0 ? CLOTH[0] : CLOTH[2]).quad([gx, topY + 5.6, z0], [gx, topY + 7.7, z0], [gx + 3.4, topY + 7.7, z0 + 0.3], [gx + 3.4, topY + 5.6, z0 + 0.3]);
        for (const dx of [-27, -9, 9, 27]) {
          const bx = gx + dx + gq.range(-3, 3), bz = z0 + sg * gq.range(24, 34), g = heightAt(bx, bz), by = g + 8, L = Math.hypot(bx - gx, by - topY - 2, bz - z0);
          G.kind(KIND.PLAIN).col(WOOD, 0.7).box(0.14, 9.5, 0.14, bx, g - 1.5, bz, 0, 0.8, 2);
          strand(gx, topY + 2.0, z0, bx, by, bz, L * 0.05, Math.round(L / 1.5), 1.7);
        }
      }
    }
    await ctx.yield();
    {                                                                     // between the second spur and the ledge pitch: one more row of low full houses (the hero leaves the strip free);
      // the three low retaining walls on the bare flank left of the last roofs are built further down, after the further streets
      const pr2 = ctx.core.makeRng('rim-pitchrow:' + ctx.seed), pt = hero.pitchInfo, G = GH[1], zr = Math.min(27.6, pt.z - pt.hz - 3.7);
      for (let gx = 239.5; gx < 299; gx += 6.5) {
        const x = gx + pr2.range(-0.4, 0.4), z = zr + pr2.range(-0.3, 0.3), w = pr2.range(4.9, 5.9), d = pr2.range(4.0, 4.5), yaw = pr2.range(-0.08, 0.08), fl = pr2(), t = pr2(), wc = wallColour(pr2), sd = pr2();
        if (Math.abs(x - 272) < 2.4 + w / 2) continue;
        const hc = heightAt(x, z), hs = [heightAt(x - w / 2, z - d / 2), heightAt(x + w / 2, z - d / 2), heightAt(x - w / 2, z + d / 2), heightAt(x + w / 2, z + d / 2)], g0 = Math.min(hc, ...hs), g1 = Math.max(hc, ...hs);
        const top = Math.min(hc + (fl < 0.5 ? 1 : 2) * 2.7 + 0.3, eyeY(x + w / 2 + 0.8) - 9.5);
        if (top < g1 + 2.1) continue;
        G.at(x, 0, z, yaw).kind(KIND.BRICK, sd).col(wc).box(w, top - g0 + 1.5, d, 0, g0 - 1.5, 0, 0, 0.62, 2);
        G.at(x, top, z, yaw);
        if (t < 0.5) roofTin(G, pr2, w, d, 0, 3.1); else roofSlab(G, pr2, w, d, 0, wc, 3.1, roofEx);
        hRects.push([x, z, Math.max(w, d) / 2]); stamp(x, z, w / 2 - 0.2, d / 2 - 0.2, yaw, top + 0.12);
      }
    }
    await ctx.yield();
    // The further streets of mansions (their lanes and ends are set out with ROWS above). A house's floors are a count of
    // the street's own, between the street's bounds, standing on the sill at the uphill corner of its plot; where the ground
    // falls under the house, as many more storeys as the fall leaves room for stand below that sill, and a plinth takes
    // what is left. Its front is the face on the lane. The gable at the street's uphill end, found from the ground at the
    // lane's two ends, carries a mural; which mural is the last draw of the street's stream. No pennants, flags or banners.
    // A stream to each street.
    // The gate streets by the same law, with what their place adds: a street is laid stretch by stretch (R.runs); where a
    // house stands beside the painted stack its plot ends at the stack's ground (the rect the hero keeps for it: 12 m
    // either side of STK.x, from 11 m short of STK.z), so the house is as deep as that leaves its eaves (EAVES), never
    // under the law's least depth (the building line is 12 m short of that ground). Their footprints are kept apart
    // (gateRects) from the first three streets' (rowRects): what stood before them (walls, trees, ichu) takes its dice as
    // it did and is then tested against them. The two gate streets do not carry the same mural: a mural is one of four,
    // by its motif and its colours (MURALS: the bounds of the four on the mural's number, in the shader's order); where
    // the second street draws the first's, it takes the next of the four at the same place within it.
    const rowRects = [], gateRects = [], MURALS = [0, 0.1, 0.5, 0.6, 1];
    const muralOf = (v) => (v < MURALS[1] ? 0 : v < MURALS[2] ? 1 : v < MURALS[3] ? 2 : 3);
    {
      let gateMural = -1;
      for (let ri = 0; ri < ROWS.length; ri++) {
        const R = ROWS[ri], off = Math.sign(R.lane), nr = ctx.core.makeRng(ctx.core.hashSeed((ri ? 'rim-rows-' + (ri + 1) : 'rim-rows') + ':' + ctx.seed));   // off: the side of the lane the houses stand on, away from the cable. A stream to each street: how many mansions one takes deals nothing to the next
        let first = null, last = null;
        for (const run of R.runs) for (let x = run[0]; x < run[1] - 6;) {
          const w = Math.min(nr.range(8.4, 10.8), run[1] - x), dd = nr.range(9.5, 11.5), face = R.lane + off * (LANE_W / 2 + nr.range(0, FORECOURT)), xc = x + w / 2;
          const d = R.gate && off * STK.z > 0 && x < STK.x + 12 && x + w > STK.x - 12 ? Math.min(dd, Math.abs(STK.z) - 11 - EAVES - Math.abs(face)) : dd, zc = face + off * d / 2;
          const hs = [heightAt(xc - w / 2, face), heightAt(xc + w / 2, face), heightAt(xc - w / 2, face + off * d), heightAt(xc + w / 2, face + off * d)];
          const g0 = Math.min(...hs), sill = Math.max(...hs) - 0.7, under = Math.max(0, Math.floor((sill - g0) / 3.2)), base = sill - under * 3.2;
          const floors = nr.int(R.lo, R.cap) + under;
          const G = GH[xc < 204 ? 0 : 1], sh = nr.shuffle([0, 1, 2]);
          G.at(xc, g0 - 1.5, zc, 0).kind(KIND.CONC, nr()).col(CONCRETE, 0.8).box(w + 0.4, base - g0 + 1.5, d + 0.4, 0, 0, 0, 0, 0.7, 2);   // plinth down the slope
          G.at(xc, base, zc, 0);
          const m = buildMansion(G, nr, w, d, floors, -off, [acc3[sh[0]], acc3[sh[1]]], true);
          stamp(xc, zc, w / 2 - 0.2, d / 2 - 0.2, 0, base + m.H + 1.0); stamp(xc, zc, w * 0.3, d * 0.2, 0, base + m.top - 0.6);
          last = { xc, zc, w, d, base, H: m.H, sill: under * 3.2 }; if (!first) first = last;
          (R.gate ? gateRects : rowRects).push([xc, zc, w / 2, d / 2, base + m.top]);
          x += w + nr.range(0.8, 2.6);
        }
        if (first) {                                                      // the mural: on the end wall of the house at the lane's higher end, from 4 m over its sill to the parapet
          const up0 = heightAt(R.x0, R.lane) >= heightAt(R.x1, R.lane), e = up0 ? first : last, sx = up0 ? -1 : 1;
          const mh = e.H - e.sill - 4.5, md = e.d - 1.2, mx = sx * (e.w / 2 + 0.15), y0 = e.sill + 4.0, za = sx * md / 2;
          let mv = nr();
          if (R.gate) {
            const k = muralOf(mv), n = (k + 1) % 4;
            if (k === gateMural) mv = MURALS[n] + (mv - MURALS[k]) / (MURALS[k + 1] - MURALS[k]) * (MURALS[n + 1] - MURALS[n]);
            gateMural = muralOf(mv);
          }
          GH[e.xc < 204 ? 0 : 1].at(e.xc, e.base, e.zc, 0).kind(KIND.MURAL, mv).rgb(md / mh, 1, 1).quad([mx, y0, za], [mx, y0, -za], [mx, y0 + mh, -za], [mx, y0 + mh, za], [0, 0, md / mh, 1]);
        }
        await ctx.yield();
      }
    }
    const inRow = (x, z, m) => { for (const r of rowRects) if (Math.abs(x - r[0]) < r[2] + m && Math.abs(z - r[1]) < r[3] + m) return true; return false; };
    // a kite never flies inside one of those mansions: within reach of its roof it rides 8 m above it
    const overRow = (x, y, z) => { for (const r of rowRects.concat(gateRects)) if (Math.abs(x - r[0]) < r[2] + 9.5 && Math.abs(z - r[1]) < r[3] + 6.5) y = Math.max(y, r[4] + 8); return y; };
    const inGate = (x, z, m) => { for (const r of gateRects) if (Math.abs(x - r[0]) < r[2] + m && Math.abs(z - r[1]) < r[3] + m) return true; return false; };
    // the three retaining walls on the flank left of the last roofs, where neither a house nor a mansion stands. A stream
    // of their own: how many are built depends on what stands on the flank
    const pw = ctx.core.makeRng(ctx.core.hashSeed('walls:' + ctx.seed));
    for (const wl of [[338, -27, 22], [357, -40, 26], [381, -31, 20]]) {
      for (let k = 0, n = Math.round(wl[2] / 3.2); k < n; k++) {
        const x = wl[0] + (k - n / 2) * 3.2, z = wl[1] + 2.2 * Math.sin(k * 0.6 + wl[0]), g = Math.min(heightAt(x - 1.6, z), heightAt(x + 1.6, z));
        if (!hero.houseAt(x, z) && !inRow(x, z, 1.7)) { const tint = 0.85 + 0.1 * pw(); if (!inGate(x, z, 1.7)) GH[1].at(x, 0, z, 0).kind(KIND.CONC, 0.2 + 0.07 * k).col(CONCRETE, tint).box(3.3, 2.6, 0.45, 0, g - 0.9, 0, 0, 0.75, 3); }
      }
    }
    {                                                                     // goal frames on the ledge pitch, and bunting strung down both touchlines
      const pt = hero.pitchInfo, G = GH[1], pb = ctx.core.makeRng('rim-pitch-bunting:' + ctx.seed);
      for (const sz of [-1, 1]) {
        const zl = pt.z + sz * (pt.hz + 1.3), x0 = pt.x - pt.hx, L = pt.hx * 2, yl = pt.y + 5.2, n = Math.round(L / 0.8);
        G.at(0, 0, 0).kind(KIND.PLAIN).col(WOOD, 0.7);
        for (let k = 0; k <= 2; k++) G.box(0.12, 5.4, 0.12, x0 + k * L / 2, pt.y - 0.1, zl, 0, 0.8, 2);
        for (let i = 0; i < n; i++) {
          const t0 = (i + 0.12) / n, t1 = (i + 0.88) / n, tm_ = (i + 0.5) / n, sag = (t) => yl - 0.9 * Math.abs(Math.sin(Math.PI * 2 * t));
          G.kind(KIND.CLOTH, 0.5 + 0.007 * i, 0.3).col(pb.pick(CLOTH), 0.95).quad([x0 + t0 * L, sag(t0), zl], [x0 + t1 * L, sag(t1), zl], [x0 + tm_ * L, sag(tm_) - 0.85, zl], [x0 + tm_ * L, sag(tm_) - 0.85, zl]);
        }
      }
      G.at(0, 0, 0).kind(KIND.PLAIN).col('#e4e2da');
      for (const sx of [-1, 1]) {
        const gx = pt.x + sx * pt.hx * 0.94;
        for (const sz of [-1, 1]) { G.box(0.16, 2.1, 0.16, gx, pt.y, pt.z + sz * 2.5, 0, 0.9, 2); G.box(0.1, 0.1, 1.5, gx + sx * 0.75, pt.y + 0.95, pt.z + sz * 2.5, 0, 1, 3); }
        G.box(0.16, 0.16, 5.16, gx, pt.y + 2.0, pt.z, 0, 1, 7);
        G.col('#e4e2da', 0.55).box(0.08, 0.08, 5.0, gx + sx * 1.45, pt.y + 0.05, pt.z, 0, 1, 3).col('#e4e2da');
      }
    }
    for (const ax of [150, 272, 372]) {                                    // concrete stair alleys dropping away to the right
      const G = GH[ax < 204 ? 0 : 1]; G.at(0, 0, 0).kind(KIND.CONC, 0.4).col(CONCRETE, 0.9);
      for (let z = 2.6; z < CLEAR + 6; z += 0.95) G.box(1.9, 0.7, 1.0, ax, heightAt(ax, z) - 0.42, z, 0, 0.8, 3);
      G.kind(KIND.PLAIN).col(STEEL, 0.5);
      for (let z = 3; z < CLEAR + 5; z += 3.8) G.box(0.05, 1.0, 0.05, ax - 0.9, heightAt(ax, z) + 0.2, z, 0, 1, 2);
      if (isNight) {                                                       // lit doorways down the alley
        G.kind(KIND.PLAIN, 0, 0, 1.0).col('#ffb060');
        for (let z = 4.2, k = 0; z < CLEAR + 4; z += 4.6, k++) { const x = ax + (k % 2 ? 1.14 : -1.14), y0 = heightAt(ax, z) + 0.35; G.quad([x, y0, z], [x, y0, z + 0.9], [x, y0 + 1.9, z + 0.9], [x, y0 + 1.9, z]); }
      }
    }

    await ctx.yield();

    // ---- a second ropeway: yellow cabins crossing the gully under ours, on six masts ----
    const yTop = YPZ.map((z) => Math.max(heightAt(YX, z) + 16, Math.abs(z) < 40 ? eyeY(YX) - 19 : -1e9));
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < YPZ.length - 1; i++) for (let k = 1; k < 6; k++) {
      const t = k / 6, need = heightAt(YX, lerp(YPZ[i], YPZ[i + 1], t)) + 13 - lerp(yTop[i], yTop[i + 1], t);
      if (need > 0) { yTop[i] += need; yTop[i + 1] += need; }
    }
    for (const i of [2, 3]) yTop[i] = Math.min(yTop[i], eyeY(YX) - 12.5);          // always well under our own cabin
    const yPts = [[-YPZ[YPZ.length - 1] - 9, 0]];
    for (let i = 0; i < YPZ.length; i++) yPts.push([YPZ[i], yTop[i]]);
    yPts.push([YPZ[YPZ.length - 1] + 9, 0]); yPts[0][1] = yTop[0] - 2.5; yPts[yPts.length - 1][1] = yTop[yTop.length - 1] - 2.5;
    const yCum = [0]; for (let i = 1; i < yPts.length; i++) yCum.push(yCum[i - 1] + Math.hypot(yPts[i][0] - yPts[i - 1][0], yPts[i][1] - yPts[i - 1][1]));
    const yTotal = yCum[yCum.length - 1];
    let yCross = 0; { const i = 3, t = (0 - yPts[i][0]) / (yPts[i + 1][0] - yPts[i][0]); yCross = lerp(yCum[i], yCum[i + 1], t); }   // where the line passes under ours
    {
      const GY = GH[1], brickY = brickC.clone().multiplyScalar(0.95);
      for (let i = 0; i < YPZ.length; i++) {
        const z = YPZ[i], g = heightAt(YX, z), H = yTop[i] + 0.9 - g;
        GY.at(YX, 0, z, 0).kind(KIND.CONC, 0.3).col(CONCRETE, 0.9).box(2.2, 2.2, 2.2, 0, g - 1.0, 0, 0, 0.8);
        GY.kind(KIND.PLAIN).col('#c9c4b4', 0.8).cyl(0.42 + H * 0.01, 0.3, H, 0, g, 0, 8, true, 0.7);
        for (let y = g + 4; y < yTop[i] - 2; y += 4) GY.col('#f2c21a', 0.75).cyl(0.47 + (yTop[i] - y) * 0.004, 0.47 + (yTop[i] - y) * 0.004, 0.25, 0, y, 0, 8, false);
        GY.col('#f2c21a', 0.8).box(5.8, 0.42, 0.5, 0, yTop[i] + 0.45, 0).col(DARK);
        for (const sx of [-1, 1]) for (const dz of [-0.9, 0, 0.9]) GY.box(0.14, 0.5, 0.5, sx * 2.3, yTop[i] - 0.02, dz);
        stamp(YX, z, 0.6, 0.6, 0, yTop[i]);
      }
      for (const e of [0, yPts.length - 1]) {                            // a small station at each end
        const z = yPts[e][0], g = heightAt(YX, z), top = yPts[e][1] + 2.2;
        GY.at(YX, 0, z, 0).kind(KIND.BRICK, 0.71 + 0.1 * e).col(brickY).box(11, top - g + 2, 9, 0, g - 2, 0, 0, 0.7, 2);
        GY.kind(KIND.TIN, 0.83).col('#f2c21a', 0.8).box(12, 0.3, 10, 0, top, 0);
      }
      await ctx.yield();
      const lines = [];
      for (const sx of [-1, 1]) {
        const pts = [];
        for (let i = 0; i < yPts.length - 1; i++) for (let k = 0; k < 6; k++) pts.push([YX + sx * 2.3, lerp(yPts[i][1], yPts[i + 1][1], k / 6), lerp(yPts[i][0], yPts[i + 1][0], k / 6)]);
        pts.push([YX + sx * 2.3, yPts[yPts.length - 1][1], yPts[yPts.length - 1][0]]); lines.push(pts);
      }
      scene.add(hero.makeCable(lines));
    }
    await ctx.yield();
    const YCABS = 12, yCabs = new THREE.InstancedMesh(yellowCabinGeometry(), propMat, YCABS); yCabs.frustumCulled = false; scene.add(yCabs);
    await ctx.yield();

    // ---- flora: eucalyptus clumps in the gullies, ichu on the cliff lip ----
    const frng = rng.fork('flora'), tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), te = new THREE.Euler(), tp = new THREE.Vector3(), ts = new THREE.Vector3();
    const TREES = Math.round(150 * busy), trees = new THREE.InstancedMesh(treeGeometry(frng, ctx.core.makeRng('rim-tree:' + ctx.seed)), propMat, TREES + 34 + 56); let nt = 0;
    for (let tries = 0; tries < 5000 && nt < TREES; tries++) {
      if ((tries & 127) === 0) await ctx.yield();
      const inStrip = tries < 400, x = inStrip ? frng.range(186, 224) : frng.range(40, 620), z = inStrip ? frng.range(-CLEAR, CLEAR) : frng.range(60, 230) * (frng.chance(0.5) ? -1 : 1);
      if (!inStrip && hero.barrioAt(x, z) > 0.22) continue;
      if (inStrip) { let hit = false; for (const r of hRects) if (Math.hypot(x - r[0], z - r[1]) < r[2] + 1.6) { hit = true; break; } if (hit || (Math.abs(x - 200) < 5 && Math.abs(z + 3.5) < 5)) continue; }
      const h = heightAt(x, z); if (Math.abs(heightAt(x + 3, z) - h) > 3.2 || Math.abs(heightAt(x, z + 3) - h) > 3.2 || h < -330) continue;
      const sc = frng.range(0.75, 1.4); if (Math.abs(z) < 12 && eyeY(x) - (h + 11 * sc) < 6.5) continue;
      trees.setMatrixAt(nt++, tm.compose(tp.set(x, h, z), tq.setFromEuler(te.set(0, frng.range(0, TAU), 0)), ts.set(sc, sc * frng.range(0.9, 1.25), sc)));
    }
    const flr = ctx.core.makeRng('rim-flank:' + ctx.seed);
    const flankFree = (x, z, m) => { if (hero.houseAt(x, z) || Math.abs(x - YX) < 7 || inRow(x, z, m)) return false; if (Math.abs(z) < CLEAR + 12) for (const r of hRects) if (Math.hypot(x - r[0], z - r[1]) < r[2] + m) return false; return true; };
    const flt = ctx.core.makeRng(ctx.core.hashSeed('flank-trees:' + ctx.seed));   // the trees' own stream: how many tries they take depends on what stands on the flank
    for (let tries = 0, add = 0; tries < 1200 && add < 34; tries++) {    // eucalyptus on the bare flanks of the gully and below the second spur
      const x = flt.chance(0.55) ? flt.range(186, 236) : flt.range(325, 392), z = flt.range(11, 60) * (flt.chance(0.5) ? -1 : 1), sc = flt.range(0.7, 1.25), ry = flt.range(0, TAU);
      if (!flankFree(x, z, 2.2) || inRow(x, z, 3.2) || inGate(x, z, 3.2)) continue;
      const h = heightAt(x, z); if (Math.abs(heightAt(x + 3, z) - h) > 4 || Math.abs(heightAt(x, z + 3) - h) > 4 || eyeY(x) - (h + 12.5 * sc) < 7) continue;
      trees.setMatrixAt(nt++, tm.compose(tp.set(x, h, z), tq.setFromEuler(te.set(0, ry, 0)), ts.set(sc, sc * 1.1, sc))); add++;
    }
    {                                                                     // clumps of eucalyptus fill the gully left of the gantry spur
      const gr = ctx.core.makeRng('rim-gully:' + ctx.seed);
      for (let c = 0, add = 0; c < 18 && add < 56; c++) {
        const cx = gr.range(322, 432), cz = -gr.range(30, 125);
        for (let k = gr.int(3, 6); k > 0 && add < 56; k--) {
          const x = cx + gr.range(-7, 7), z = cz + gr.range(-7, 7), sc = gr.range(0.7, 1.3), ry = gr.range(0, TAU);
          if (!flankFree(x, z, 2.2) || Math.abs(z) < 26 || inRow(x, z, 3.2) || inGate(x, z, 3.2)) continue;
          const h = heightAt(x, z); if (Math.abs(heightAt(x + 3, z) - h) > 7 || Math.abs(heightAt(x, z + 3) - h) > 7) continue;
          trees.setMatrixAt(nt++, tm.compose(tp.set(x, h - 0.6, z), tq.setFromEuler(te.set(0, ry, 0)), ts.set(sc, sc * 1.1, sc))); add++;
        }
      }
    }
    trees.count = nt; trees.frustumCulled = false; scene.add(trees);
    await ctx.yield();
    const TUFTS = Math.round(700 * busy), tufts = new THREE.InstancedMesh(tuftGeometry(), propMat, TUFTS + 450 + 150); let nf = 0;
    for (let i = 0; i < TUFTS; i++) {
      const z = frng.range(-150, 150), x = frng.chance(0.6) ? frng.range(-3.6, 0.2) : frng.range(-10, -3.6), h = heightAt(x, z);
      if (h < -1.2 || blocked(x, z, 0.3) || (Math.abs(z) < 12 && x < -3.4)) continue;
      const sc = frng.range(0.7, 1.7); tufts.setMatrixAt(nf++, tm.compose(tp.set(x, h - 0.03, z), tq.setFromEuler(te.set(0, frng.range(0, TAU), 0)), ts.set(sc, sc, sc)));
    }
    await ctx.yield();
    for (let tries = 0, add = 0; tries < 2400 && add < Math.round(450 * busy); tries++) {   // ichu on the same flanks
      if ((tries & 255) === 255) await ctx.yield();
      const x = flr.chance(0.6) ? flr.range(186, 236) : flr.range(325, 392), z = flr.range(-60, 60), sc = flr.range(0.8, 1.6), ry = flr.range(0, TAU);
      if (!flankFree(x, z, 0.6) || inGate(x, z, 0.6)) continue;
      tufts.setMatrixAt(nf++, tm.compose(tp.set(x, heightAt(x, z) - 0.04, z), tq.setFromEuler(te.set(0, ry, 0)), ts.set(sc, sc, sc))); add++;
    }
    { const fl2 = ctx.core.makeRng('rim-flank2:' + ctx.seed);
      for (let tries = 0, add = 0; tries < 900 && add < Math.round(150 * busy); tries++) {   // and on the bare flank left of the approach
        const x = fl2.range(326, 402), z = -fl2.range(16, 62), sc = fl2.range(0.9, 1.8), ry = fl2.range(0, TAU);
        if (!flankFree(x, z, 0.6) || inGate(x, z, 0.6)) continue;
        tufts.setMatrixAt(nf++, tm.compose(tp.set(x, heightAt(x, z) - 0.04, z), tq.setFromEuler(te.set(0, ry, 0)), ts.set(sc, sc, sc))); add++;
      } }
    tufts.count = nf; tufts.frustumCulled = false; scene.add(tufts);
    await ctx.yield();

    // ---- the lanes of the further streets (ROWS), built ----
    // Each street's lane is a paved way LANE_W wide on the lane's own line, from the street's first plot to its last, poured
    // in equal bays of about LANE_BAY (the bay this town's concrete is screeded in). It lies on the ground as the picture
    // draws it (hero.groundAt): heightAt, which seats the houses, stands up to 2.5 m over or under that ground between the
    // vertices of the terrain and would bury the way or hang it in the air. The way is level across. At each joint between
    // bays it stands HAND (a hand's width) over the highest ground across its width; where the ground between two joints
    // stands over the straight pitch between them, the nearer joint is raised until the pitch clears it by the same hand.
    // So the way is nowhere under the ground, and where the ground falls away from it it is filled, never cut. A bay
    // pitched steeper than a walked ramp (1 in RAMP) is a flight of steps of equal run: the fewest risers that are no
    // higher than RISER_HI, on level treads; where no whole count gives a riser of at least RISER_LO, the risers are
    // RISER_HI and the treads take the last centimetres as fall. A riser stands at the low end of its tread, so a flight
    // is never under its pitch. Every bay is closed on both sides by a wall of the same stone from the edge of the way (in
    // a flight from the line of the step noses, as a cheek) down to LANE_FOOT under the ground (as deep as the stair
    // alleys sit in it), and so is each end. The stone is that of the three retaining walls on the gantry flank: their
    // concrete, their tints, their darkened foot. A stream of the lanes' own deals each lane the stain of its concrete and
    // each bay its tint. A plot is half of PLOTS; no lane end comes within one of a street, stair or wall it does not
    // touch already (the gantry lane runs beside the first of those walls and ends along the third), so each lane ends
    // with its street.
    // A gate street's lane is poured stretch by stretch, like its houses: each stretch's way ends KERB short of the road's
    // kerb or of the stair's edge, so the road and the stair stay open across it. The first three streets' lanes take
    // their dice first, as they did; the gate lanes' dice come after them on the same stream.
    {
      const HAND = 0.1, LANE_BAY = 2.4, RAMP = 8, RISER_LO = 0.15, RISER_HI = 0.18, LANE_FOOT = 0.42;
      const lr = ctx.core.makeRng(ctx.core.hashSeed('rim-lanes:' + ctx.seed)), ground = (x, z) => hero.groundAt(x, z);
      const across = (x, zc) => { let h = -1e9; for (let k = 0; k <= 12; k++) h = Math.max(h, ground(x, zc + (k / 12 - 0.5) * LANE_W)); return h; };
      for (const R of ROWS) for (const run of R.runs) {
        const X0 = run[0], X1 = run[1];
        const G = GH[X1 < 204 ? 0 : 1], L = X1 - X0, nb = Math.round(L / LANE_BAY), bay = L / nb, zl = R.lane - LANE_W / 2, zr = R.lane + LANE_W / 2, y = [], tint = [];
        for (let i = 0; i <= nb; i++) y.push(across(X0 + i * bay, R.lane) + HAND);
        for (let i = 0; i < nb; i++) for (let k = 1; k < 8; k++) {
          const f = k / 8, over = across(X0 + (i + f) * bay, R.lane) + HAND - lerp(y[i], y[i + 1], f);
          if (over > 0) { if (f < 0.5) y[i] += over / (1 - f); else y[i + 1] += over / f; }
        }
        G.at(0, 0, 0).kind(KIND.CONC, lr());
        for (let i = 0; i < nb; i++) tint.push(0.85 + 0.1 * lr());
        for (let i = 0; i < nb; i++) {
          const x0 = X0 + i * bay, x1 = x0 + bay, y0 = y[i], y1 = y[i + 1], rise = Math.abs(y1 - y0), u0 = i * bay;
          let cheek = 0;
          G.col(CONCRETE, tint[i]);
          if (rise * RAMP <= bay) G.quad([x0, y0, zr], [x1, y1, zr], [x1, y1, zl], [x0, y0, zl], [u0, 0, u0 + bay, LANE_W]);
          else {
            let n = Math.ceil(rise / RISER_HI); if (rise / n < RISER_LO) n = Math.max(1, Math.floor(rise / RISER_LO));
            const riser = Math.min(RISER_HI, rise / n), fall = rise / n - riser, run = bay / n, up = y1 > y0 ? 1 : -1, xlow = up > 0 ? x0 : x1, ylow = Math.min(y0, y1);
            for (let k = 0; k < n; k++) {
              const xa = xlow + up * k * run, xb = xa + up * run, ya = ylow + k * (riser + fall), yt = ya + riser;   // the riser stands at xa from ya to yt; its tread runs from xa to xb
              if (up > 0) G.quad([xa, ya, zl], [xa, ya, zr], [xa, yt, zr], [xa, yt, zl]).quad([xa, yt, zr], [xb, yt + fall, zr], [xb, yt + fall, zl], [xa, yt, zl], [u0 + k * run, 0, u0 + (k + 1) * run, LANE_W]);
              else G.quad([xa, ya, zr], [xa, ya, zl], [xa, yt, zl], [xa, yt, zr]).quad([xb, yt + fall, zr], [xa, yt, zr], [xa, yt, zl], [xb, yt + fall, zl], [u0 + bay - (k + 1) * run, 0, u0 + bay - k * run, LANE_W]);
            }
            cheek = riser;
          }
          G.quad([x0, ground(x0, zr) - LANE_FOOT, zr], [x1, ground(x1, zr) - LANE_FOOT, zr], [x1, y1 + cheek, zr], [x0, y0 + cheek, zr], null, 0.75, 1);
          G.quad([x1, ground(x1, zl) - LANE_FOOT, zl], [x0, ground(x0, zl) - LANE_FOOT, zl], [x0, y0 + cheek, zl], [x1, y1 + cheek, zl], null, 0.75, 1);
        }
        const e0 = Math.min(ground(X0, zl), ground(X0, zr)) - LANE_FOOT, e1 = Math.min(ground(X1, zl), ground(X1, zr)) - LANE_FOOT;
        G.col(CONCRETE, tint[0]).quad([X0, e0, zl], [X0, e0, zr], [X0, y[0], zr], [X0, y[0], zl], null, 0.75, 1);
        G.col(CONCRETE, tint[nb - 1]).quad([X1, e1, zr], [X1, e1, zl], [X1, y[nb], zl], [X1, y[nb], zr], null, 0.75, 1);
        await ctx.yield();
      }
    }

    // ---- height-map shadows for everything near the ride ----
    const hmHalf = new Uint16Array(hmW * hmH);
    for (let i = 0; i < hm.length; i++) { hmHalf[i] = THREE.DataUtils.toHalfFloat(hm[i]); if ((i & 16383) === 0) await ctx.yield(); }
    const hmTex = new THREE.DataTexture(hmHalf, hmW, hmH, THREE.RedFormat, THREE.HalfFloatType);
    hmTex.magFilter = hmTex.minFilter = THREE.LinearFilter; hmTex.wrapS = hmTex.wrapT = THREE.ClampToEdgeWrapping; hmTex.generateMipmaps = false; hmTex.needsUpdate = true;
    U.uHM.value = hmTex; U.uHMRect.value.set(HX0, HZ0, 1 / (hmW * HRES), 1 / (hmH * HRES));
    for (const G of [GP, GM, GH[0], GH[1]]) { await ctx.yield(); const m = new THREE.Mesh(await G.buildAsync(ctx), propMat); scene.add(m); }
    await ctx.yield();

    // ---- minibuses on the avenues and the switchbacks ----
    const brng = rng.fork('bus'), lanes = [];
    for (const pts of roads) { const lp = pts === roads[2] ? [[-72, 0.05, -120], [-72, 0.05, 120]] : pts; lanes.push({ pts: lp, cum: polyLen(lp), len: 0, lift: 0.02 }); }
    for (let i = 0; i < Math.min(3, hero.roadLines.length); i++) { const pts = hero.roadLines[i]; lanes.push({ pts, cum: polyLen(pts), len: 0, lift: 0.1, cap: i === 0 ? 1500 : 800 }); }
    for (const L of lanes) L.len = Math.min(L.cum[L.cum.length - 1], L.cap || 1e9);
    const BUSES = Math.round(84 * (0.7 + 0.3 * busy)), laneOf = [2, 0, 3, 1, 2, 0, 3, 3, 4, 3, 3, 2, 3, 5], buses = new THREE.InstancedMesh(minibusGeometry(), propMat, BUSES + PARKED.length);
    const bus = { lane: new Uint8Array(BUSES), s0: new Float32Array(BUSES), v: new Float32Array(BUSES), off: new Float32Array(BUSES), seg: new Uint16Array(BUSES) };
    for (let i = 0; i < BUSES; i++) {
      const li = laneOf[i % laneOf.length], dir = brng.chance(0.5) ? 1 : -1;
      bus.lane[i] = li < lanes.length ? li : i % 3; bus.s0[i] = brng() * lanes[bus.lane[i]].len; bus.v[i] = dir * (bus.lane[i] < 3 ? brng.range(2.2, 4.4) : brng.range(4, 7)); bus.off[i] = dir * 2.1;
      buses.setColorAt(i, brng.pick(CLOTH)); buses.setMatrixAt(i, tm.identity());
    }
    { let nf = 0, nb = 0; for (let i = 0; i < BUSES; i++) if (bus.lane[i] === 2) { if (bus.v[i] > 0) nf++; else nb++; }
      let kf = 0, kb = 0; for (let i = 0; i < BUSES; i++) if (bus.lane[i] === 2) { const fw = bus.v[i] > 0; bus.v[i] = fw ? 3.0 : -3.0; bus.s0[i] = ((fw ? kf++ : kb++) + (fw ? 0.25 : 0.6)) * lanes[2].len / Math.max(1, fw ? nf : nb); } }
    for (let i = 0; i < PARKED.length; i++) { buses.setColorAt(BUSES + i, CLOTH[(i * 3 + 1) % CLOTH.length]); buses.setMatrixAt(BUSES + i, tm.compose(tp.set(PARKED[i][0], 0.02, PARKED[i][1]), tq.setFromEuler(te.set(0, PARKED[i][2], 0)), ts.setScalar(1))); }
    buses.frustumCulled = false; scene.add(buses);
    const placeBus = (i, time) => {
      const L = lanes[bus.lane[i]], cum = L.cum, pts = L.pts; let s = (bus.s0[i] + time * bus.v[i]) % L.len; if (s < 0) s += L.len;
      let k = bus.seg[i]; if (k >= cum.length - 1) k = 0;
      while (k > 0 && cum[k] > s) k--; while (k < cum.length - 2 && cum[k + 1] < s) k++;
      bus.seg[i] = k;
      const a = pts[k], b = pts[k + 1], t = (s - cum[k]) / Math.max(1e-3, cum[k + 1] - cum[k]), dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], hl = Math.hypot(dx, dz) || 1;
      const sg = bus.v[i] < 0 ? -1 : 1, edge = Math.min(1, s / 6, (L.len - s) / 6);
      te.set(0, Math.atan2(-dz * sg, dx * sg), Math.atan2(dy * sg, hl), 'YZX');
      tp.set(a[0] + dx * t - dz / hl * bus.off[i], a[1] + dy * t + L.lift, a[2] + dz * t + dx / hl * bus.off[i]);
      buses.setMatrixAt(i, tm.compose(tp, tq.setFromEuler(te), ts.setScalar(Math.max(0.001, edge))));
    };

    await ctx.yield();

    // ---- kites over the plateau ----
    const KITES = isNight ? 0 : Math.round((festival ? 440 : 300) * busy), BK0 = isNight ? 0 : Math.round(125 * busy), XK = isNight ? 0 : 58, BK = BK0 + XK;
    if (KITES > 0) {
      const krng = rng.fork('kites'), kp = new Float32Array((KITES + BK) * 4), kc = new Float32Array((KITES + BK) * 3), kc2 = new Float32Array((KITES + BK) * 3);
      for (let i = 0; i < KITES; i++) {
        const ahead = krng.chance(0.7);
        kp[i * 4] = ahead ? krng.range(-110, -6) : krng.range(-230, -6); kp[i * 4 + 2] = (krng.chance(0.5) ? -1 : 1) * krng.range(ahead ? 14 : 30, ahead ? 150 : 320);
        kp[i * 4 + 1] = krng.range(26, 46) + Math.abs(kp[i * 4 + 2]) * krng.range(0.05, 0.3); kp[i * 4 + 3] = krng.range(0, 60);
        const a = krng.pick(CLOTH), b = krng.pick(CLOTH); kc[i * 3] = a.r; kc[i * 3 + 1] = a.g; kc[i * 3 + 2] = a.b; kc2[i * 3] = b.r; kc2[i * 3 + 1] = b.g; kc2[i * 3 + 2] = b.b;
      }
      // children fly them from the roofs of the barrios as well: a scatter of kites hangs over the spurs the cabin
      // comes down, level with it and below, never nearer the line than 20 m (their own stream of draws)
      const kb = ctx.core.makeRng('rim-barrio-kites:' + ctx.seed);
      for (let i = KITES; i < KITES + BK0; i++) {
        const x = kb.range(60, 520), z = (kb.chance(0.62) ? 1 : -1) * kb.range(27, 170), g = heightAt(x, z);
        kp[i * 4] = x; kp[i * 4 + 2] = z; kp[i * 4 + 1] = overRow(x, Math.max(g + kb.range(16, 40), eyeY(Math.min(x, 430)) - kb.range(2, 34)), z); kp[i * 4 + 3] = kb.range(0, 60);
        const a = kb.pick(CLOTH), b = kb.pick(CLOTH); kc[i * 3] = a.r; kc[i * 3 + 1] = a.g; kc[i * 3 + 2] = a.b; kc2[i * 3] = b.r; kc2[i * 3 + 1] = b.g; kc2[i * 3 + 2] = b.b;
      }
      {                                                                   // thirty over the ledge pitch, level with the cabin as it passes; the rest round the gantry spur, below the line
        const kx = ctx.core.makeRng('rim-pitch-kites:' + ctx.seed), pt = hero.pitchInfo;
        for (let i = KITES + BK0, j = 0; i < KITES + BK; i++, j++) {
          const overPitch = j < 30, x = overPitch ? pt.x + kx.range(-22, 24) : kx.range(350, 470), z = overPitch ? pt.z + kx.range(-6, 20) : (kx.chance(0.5) ? 1 : -1) * kx.range(24, 85);
          kp[i * 4] = x; kp[i * 4 + 2] = z; kp[i * 4 + 1] = overPitch ? pt.y + kx.range(9, 27) : overRow(x, Math.max(heightAt(x, z) + 12, eyeY(Math.min(x, 430)) - kx.range(5, 26)), z); kp[i * 4 + 3] = kx.range(0, 60);
          const a = kx.pick(CLOTH), b = kx.pick(CLOTH); kc[i * 3] = a.r; kc[i * 3 + 1] = a.g; kc[i * 3 + 2] = a.b; kc2[i * 3] = b.r; kc2[i * 3 + 1] = b.g; kc2[i * 3 + 2] = b.b;
        }
      }
      const km = new THREE.Mesh(instanced(kiteGeometry(), { iPos: [kp, 4], iCol: [kc, 3], iCol2: [kc2, 3] }, KITES + BK), makeMat(U, KITE_VERT, KITE_FRAG));
      km.frustumCulled = false; scene.add(km);
    }

    await ctx.yield();

    // ---- rooftop dogs on the second spur ----
    const drng = rng.fork('dogs'), DOGS = Math.min(3, dogRoofs.length), dogs = new THREE.InstancedMesh(dogGeometry(C3('#ffffff')), propMat, Math.max(1, DOGS));
    const dogAt = drng.shuffle(dogRoofs).slice(0, DOGS), dogCols = ['#b88a52', '#2a2422', '#d8d0c0'];
    for (let i = 0; i < Math.max(1, DOGS); i++) { dogs.setColorAt(i, C3(dogCols[i % 3])); dogs.setMatrixAt(i, tm.makeScale(0.001, 0.001, 0.001)); }
    dogs.count = Math.max(1, DOGS); dogs.frustumCulled = false; scene.add(dogs);
    const pit = hero.pitchInfo, PLAYERS = 14, SPECT = 18, people = roofEx.people.slice(0, 60), NFIG = PLAYERS + people.length + SPECT;
    const figs = new THREE.InstancedMesh(figureGeometry(), propMat, NFIG), frn = ctx.core.makeRng('rim-figures:' + ctx.seed);
    for (let i = 0; i < PLAYERS; i++) { figs.setColorAt(i, C3(i % 2 ? '#d8261c' : '#1c4fb4')); figs.setMatrixAt(i, tm.makeScale(0.001, 0.001, 0.001)); }
    for (let i = 0; i < people.length; i++) {
      const q = people[i];
      figs.setColorAt(PLAYERS + i, frn.pick(CLOTH).clone().multiplyScalar(frn.range(0.6, 0.95)));
      figs.setMatrixAt(PLAYERS + i, q.gone ? tm.makeScale(0.001, 0.001, 0.001) : tm.compose(tp.set(q.p[0], q.p[1], q.p[2]), tq.setFromEuler(te.set(0, q.yaw, 0)), ts.set(1.1, 1.1 * q.s, 1.1)));
    }
    for (let i = 0; i < SPECT; i++) {                                     // people watching the game from the near touchline, in twos and threes
      const k = PLAYERS + people.length + i, sx = pit.x + ((Math.floor(i / 3) + 0.5) / 6 - 0.5) * 2 * pit.hx * 0.86 + (i % 3) * 0.95 + frn.range(-0.3, 0.3), sz = pit.z - pit.hz - frn.range(0.5, 1.5), sit = frn.chance(0.25);
      figs.setColorAt(k, frn.pick(CLOTH).clone().multiplyScalar(frn.range(0.6, 0.95)));
      figs.setMatrixAt(k, tm.compose(tp.set(sx, heightAt(sx, sz) - (sit ? 0.15 : 0.02), sz), tq.setFromEuler(te.set(0, Math.PI / 2 + frn.range(-0.4, 0.4), 0)), ts.set(1.5, sit ? 0.9 : 1.5, 1.5)));
    }
    figs.frustumCulled = false; scene.add(figs);
    const ballG = new GB(); ballG.kind(KIND.PLAIN).col('#e8e6de').blob(0.4, 0.4, 0.4, 0, 0, 0, 0.75);
    const ball = new THREE.Mesh(ballG.build(), propMat); ball.frustumCulled = false; scene.add(ball);

    await ctx.yield();

    // ---- life: birds, dust, clouds ----
    const DUR = 42, timeU = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), birdRng = rng.fork('birds');
    await ctx.yield();
    // CLEAR AIR: a body the clock moves keeps 2.0 m from the lens (the owner's rule). A bird's place is its route + its dealt scatter + a weave (a soaring bird: a ring) whose
    // phase and rate come from a float hash worked out on the graphics chip: they differ from chip to chip. So the place numbers marked "clear air" below are typed choices,
    // each set by a count of every dealt bird's WHOLE reach (route, scatter, the weave or ring at any phase, the model's own size; the kit's near guard not counted) against the
    // flown line on seeds 1 to 40 and 1234: the least whole metre (the swifts: half metre) at which every bird keeps 2.5 m from the lens wherever the lens is. No die is touched.
    // (flock cure 1) BY PLACE as well: no bird's body comes within 2 m of the flown line on any deal. The loose flocks are dealt with a bound (maxSigma 3) and their wander
    // written out. Where a course lies on or near our line (the crossing, the two flocks that fly down the streets ahead of us) the kit moves each bird that would come too
    // near by its own place, by what it alone lacks (keepClear with each); the condor's ring is lifted clear, upward only. The two caracara thermals lie 1 m and 5 m
    // further out, so that no ring the kit can deal reaches the line. Every other course, count and spread is as it was.
    const clearOf = (from, to, up) => ({ path, dist: 2, each: true, from, to, step: 2, ...(up ? { up: true } : {}) });
    fauna.add(F.makeFlock({ rng: birdRng, species: 'gulls', count: 60, size: 0.95, flap: 5.5, glide: 0.2, spread: [16, 6, 22], wander: [1.2, 0.8, 1.6, 0.35], maxSigma: 3, keepClear: clearOf(0.35, 0.72),
      palette: { body: '#c4c8d2', belly: '#e6e8ee', wingC: '#9aa0ae', trail: '#d2d6de', tip: '#34363e', head: '#6e7a8a', beak: '#3a3a3a' },
      // clear air: lead 57 (was 22: the flock's tail crossed at the lens). At 56 the last straggler's reach comes to 2.43 m of the lens, at 57 to 3.31 m (seed 29). The flock still
      // breaks out of the spur's roofs beside the line, ahead of us, and goes out over the gully; lower (height) would bury it in the spur
      cross: { path, u: 0.45, lead: 57, angle: 40, side: 1, height: -2, span: 250, rise: 26, duration: DUR } }));
    await ctx.yield();
    // clear air: the centre 29.5 m up (was 21: the loop's low birds came down to the line). At 29 the lowest reach is 2.32 m from the line, at 29.5 2.82 m (seed 27)
    fauna.add(F.makeFlock({ rng: birdRng, species: 'swifts', count: 12, center: [-6, 29.5, -3.5], radius: 15, height: 4, spread: [14, 5, 14], wander: [9, 5, 8, 0.7], maxSigma: 3 }));
    await ctx.yield();
    const caracara = { body: '#2a2220', belly: '#d8cdb8', wingC: '#2c2422', trail: '#1c1816', tip: '#e8e0d0', head: '#e8dcc8', tailC: '#e8e0d0', beak: '#f08a1c' };
    // clear air: the centre 36 m right of the line (was 25: a ring reached the line). At 35 the nearest ring's reach is 2.10 m from the line, at 36 3.10 m (seed 8)
    // (flock cure 1) 37: by place, over every loop the kit can deal, the nearest ring's reach is then 2.94 m from the line (at 36: 1.94 m)
    fauna.add(F.makeFlock({ rng: birdRng, species: 'eagles', count: 2, size: 1.2, center: [50, -4, 37], radius: 4, soarRadius: 9, soarLift: 3, spread: [10, 3, 10], palette: caracara }));
    await ctx.yield();
    {                                                                     // more life in the air beside the descent (their own stream of draws)
      const br = ctx.core.makeRng('rim-birds2:' + ctx.seed), pigeon = { body: '#c4c8d2', belly: '#e6e8ee', wingC: '#9aa0ae', trail: '#d2d6de', tip: '#34363e', head: '#6e7a8a', beak: '#3a3a3a' };
      // four more caracaras on the cliff thermal out to the right, where the gaze goes at the rim
      // clear air: the thermal's centre 55 m right of the line (was 30: rings crossed the line at the cabin's height). At 54 the nearest reach is 1.54 m, at 55 2.54 m (seed 9)
      // (flock cure 1) 60: by place, over every loop the kit can deal, the nearest ring's reach is then 3.13 m from the line (at 55 a ring could lie on the line)
      fauna.add(F.makeFlock({ rng: br, species: 'eagles', count: 6, size: 1.6, center: [95, eyeY(95) - 6, 60], radius: 6, soarRadius: 13, soarLift: 4, spread: [22, 5, 22], palette: caracara }));
      await ctx.yield();
      // pigeons wheeling all the time: over the terrace market, over the houses before the pitch and out over the gully
      // below the gantry spur. Each loop lies along the slope, level with the cabin or under it, 12 m or more off the line
      const loop = (cx, cz, rx, rz, dy) => { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, x = cx + Math.cos(a) * rx; pts.push([x, eyeY(x) + dy + 1.4 * Math.sin(a * 2), cz + Math.sin(a) * rz]); } return pts; };
      fauna.add(F.makeFlock({ rng: br, species: 'gulls', count: 30, size: 0.95, flap: 5.5, glide: 0.2, route: loop(171, 32, 15, 12, -2.5), spread: [6, 2.5, 6], wander: [5, 2.5, 4, 0.35], maxSigma: 3, palette: pigeon }));
      await ctx.yield();
      fauna.add(F.makeFlock({ rng: br, species: 'gulls', count: 30, size: 0.95, flap: 5.5, glide: 0.2, route: loop(266, 34, 16, 13, -2.5), start: 0.4, spread: [6, 2.5, 6], wander: [5, 2.5, 4, 0.35], maxSigma: 3, palette: pigeon }));
      await ctx.yield();
      fauna.add(F.makeFlock({ rng: br, species: 'gulls', count: 24, size: 1.0, flap: 5.2, glide: 0.25, route: loop(388, -46, 22, 16, -13), start: 0.7, spread: [9, 3, 9], wander: [5, 2.5, 4, 0.35], maxSigma: 3, palette: pigeon }));
      await ctx.yield();
      // a dozen that fly down each street of mansions ahead of the cabin
      fauna.add(F.makeFlock({ rng: br, species: 'gulls', count: 14, size: 0.95, flap: 5.5, glide: 0.2, along: { path, side: 3, up: -2, lead: 30, from: 0.33, to: 0.5, drift: 5 }, spread: [4, 1.5, 8], wander: [0.6, 0.4, 0.8, 0.35], maxSigma: 3, keepClear: clearOf(0.2, 0.65), palette: pigeon }));
      await ctx.yield();
      // clear air: lead 37 (was 30: the flock's tail with its drift and weave reached back to the lens). At 36 the last bird's reach is 1.61 m from the lens, at 37 2.61 m (seed 5)
      fauna.add(F.makeFlock({ rng: br, species: 'gulls', count: 40, size: 1.05, flap: 5.5, glide: 0.2, along: { path, side: 3, up: 1.5, lead: 37, from: 0.57, to: 0.80, drift: 6 }, spread: [8, 3, 10], wander: [0.6, 0.4, 0.8, 0.35], maxSigma: 3, keepClear: clearOf(0.42, 0.95),
        palette: { body: '#59606e', belly: '#8b909c', wingC: '#474c59', trail: '#6a707c', tip: '#22242a', head: '#3e4a58', beak: '#3a3a3a' } }));
      await ctx.yield();
      // forty out over the bowl to the right of the gantry, wheeling below the line as the cabin comes in
      fauna.add(F.makeFlock({ rng: ctx.core.makeRng('rim-birds3:' + ctx.seed), species: 'gulls', count: 40, size: 1.25, flap: 5.3, glide: 0.25, route: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const a = i / 10 * TAU; return [470 + Math.cos(a) * 34, eyeY(415) - 20 + 2.5 * Math.sin(a * 2), 62 + Math.sin(a) * 24]; }), start: 0.3, spread: [10, 3.5, 10], palette: pigeon }));
      await ctx.yield();
      // and forty over the cliff-foot houses, out to the right where the gaze goes at the reveal
      fauna.add(F.makeFlock({ rng: br, species: 'gulls', count: 50, size: 1.2, flap: 5.5, glide: 0.2, route: loop(100, 44, 20, 14, -9), start: 0.15, spread: [9, 3, 9], wander: [5, 2.5, 4, 0.35], maxSigma: 3, palette: pigeon }));
      await ctx.yield();
    }
    // clear air: the condor's ring written out and drawn in, soarRadius 16 (the kit's own 28 swept it across the line). At 17 its reach comes to 1.97 m of the lens, at 16 to 3.78 m
    // (the two rare seeds of 1 to 40: 3 and 37). Its place is dealt up to 70 m off the escort point: on a rare seed not counted the ring may still reach the line
    if (rare) fauna.add(F.makeFlock({ rng: birdRng, species: 'eagles', count: 1, size: 1.5, flap: 0.6, glide: 0.97, wander: [0.6, 0.5, 0.6, 0.15], soarRadius: 16, maxSigma: 3, keepClear: clearOf(0, 1, true),
      palette: { body: '#141416', belly: '#1a1a1c', wingC: '#18181a', trail: '#e8e6e0', tip: '#101012', head: '#c8a8a0', tailC: '#141416', beak: '#d8d0c0' },
      along: { path, side: 12, up: -1.2, lead: 17, from: 0.19, to: 0.56, drift: 3 } }));
    await ctx.yield();
    const fxSun = [sunDir.x, sunDir.y, sunDir.z];
    if (!isNight) for (const p of [[-80, 0, 58], [-34, 0, -92]]) { set.add(fx.makeDustDevil({ rng: rng.fork('devil' + p[0]), time: timeU, position: p, height: 30, radius: [0.7, 5.5], wander: 11, opacity: 0.34, sunDir: fxSun })); await ctx.yield(); }
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: timeU, count: Math.round(700 * detail), box: [70, 34, 70], size: [0.03, 0.08], opacity: isNight ? 0.25 : 0.32, additive: 0.15, intensity: 0.6,
      colors: isNight ? ['#ffb070', '#8090c0', '#ffd0a0'] : ['#e8c8a0', '#d8b088', '#f0e0c8'] }));
    await ctx.yield();
    // Two cumulus stand either side of the massif, beyond the far rim. Each is on the massif's bearing less or plus half the
    // angle the massif spans and CUM_OFF more (from the lip a cumulus 600 m in radius reaches 8.5 degrees either side of its
    // middle at that distance: 9 keeps it off the massif's foot), CUM_BEYOND past the far rim on that bearing (its radius
    // and half as much again: no part of it hangs over the bowl). Altitude and radius are each cloud's own.
    const CUM_OFF = 9 * Math.PI / 180, CUM_BEYOND = 900;
    const cumulus = (sgn, alt, r) => { const b = hero.massif.bearing + sgn * (hero.massif.half + CUM_OFF), dd = hero.farRimAt(b) + CUM_BEYOND; return [dd * Math.cos(b), alt, dd * Math.sin(b), r]; };
    let clouds = null;
    if (lookName === 'cloudsea') { clouds = makeCloudField({ rng, mode: 'sea', sky, altitude: look.cloudY, relief: 30, towers: 0, bump: 1.25, deckRadius: 3600, opacity: 0.9 });
      const hp = clouds.uniforms.uHazeP; if (hp && hp.value) { hp.value.z = Math.max(hp.value.z, 1100); hp.value.w = Math.max(hp.value.w, 3300); } }
    else if (!isNight) clouds = makeCloudField({ rng, sky, at: [[3700, 150, -900, 500], cumulus(-1, 250, 600), cumulus(1, 210, 440)], puffs: 40, extent: [6000, 6000], farFade: [6200, 7000], wind: [3.2, 0, 1.1], fogFade: 0.3 });
    if (clouds) scene.add(clouds.object);
    await ctx.yield();
    if (festival && !isNight) {                                          // bunting between the mansion rows, high over the line
      const GF = new GB(), fr = rng.fork('bunting');
      for (let x = -55; x < -8; x += fr.range(6, 9)) {
        const y0 = tallest - fr.range(1.2, 2.2), n = 22; GF.at(0, 0, 0);
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 0.72) / n, za = lerp(-13, 10, t0), zb = lerp(-13, 10, t1), sag = (t) => y0 - 4.5 * Math.sin(Math.PI * t) * 0.35;
          GF.kind(KIND.CLOTH, 0.5 + 0.01 * i, 0.5).col(fr.pick(CLOTH)).quad([x, sag(t0), za], [x, sag(t1), zb], [x, sag(t1) - 0.9, (za + zb) / 2], [x, sag(t0) - 0.9, (za + zb) / 2]);
        }
      }
      scene.add(new THREE.Mesh(GF.build(), propMat));
    }
    await ctx.yield();
    if (isNight) {                                                       // street lamps, beacons
      const pos = [], cols = [], gr = rng.fork('lamps');
      for (const pts of roads) { const cum = polyLen(pts); for (let s = 12; s < cum[cum.length - 1]; s += 26) { let k = 0; while (k < cum.length - 2 && cum[k + 1] < s) k++; const t = (s - cum[k]) / (cum[k + 1] - cum[k]); const x = lerp(pts[k][0], pts[k + 1][0], t), z = lerp(pts[k][2], pts[k + 1][2], t); if (Math.hypot(x + 60, z) < 230) { pos.push([x + 3, 6.5, z + 3]); cols.push('#ffb060'); } } }
      // one lamp on each lit cell of the 9 m lattice that lampPool() in the shaders lights the roofs and alleys from
      for (let cx = 11; cx <= 36; cx++) for (let cz = -4; cz <= 3; cz++) {
        if ((((cx * 3 + cz * 5) % 7) + 7) % 7 > 3.5) continue;
        const lx = (cx + 0.5) * 9 + 1.2 * Math.sin(cx * 1.7 + cz * 2.3), lz = (cz + 0.5) * 9 + 1.2 * Math.cos(cx * 2.9 + cz * 1.3), g = heightAt(lx, lz);
        const hi = Math.min(hmW - 1, Math.max(0, Math.floor((lx - HX0) / HRES))), hj = Math.min(hmH - 1, Math.max(0, Math.floor((lz - HZ0) / HRES)));
        const y = Math.min(Math.max(g, Math.abs(lz) < 49 ? hm[hj * hmW + hi] : g), g + 9) + 2.4;
        pos.push([lx, Math.min(y, eyeY(lx) - 2.6), lz]); cols.push((((cx * 2 + cz * 7) % 8) + 8) % 8 > 5.5 ? '#dfe8ff' : '#ffb060');
      }
      await ctx.yield();
      for (let li = 0; li < hero.roadLines.length; li++) {               // sodium strings down the switchbacks and along the floor avenue
        const pts = hero.roadLines[li], cum = polyLen(pts);
        for (let sd = 20, k = 0; sd < cum[cum.length - 1] && pos.length < 520; sd += 34) { while (k < cum.length - 2 && cum[k + 1] < sd) k++; const t = (sd - cum[k]) / Math.max(1e-3, cum[k + 1] - cum[k]); pos.push([lerp(pts[k][0], pts[k + 1][0], t), lerp(pts[k][1], pts[k + 1][1], t) + 5.5, lerp(pts[k][2], pts[k + 1][2], t)]); cols.push('#ffa850'); }
      }
      for (const t of PLZ.t) for (let i = 0; i < 4; i++) { pos.push([t.x0 + 6.4, t.y + 3.4, PLZ.z0 + 3 + i * 5.4]); cols.push('#ffd9a0'); }
      for (const py of A.pylons) { pos.push([py.top.x, py.top.y + 0.6, py.top.z]); cols.push('#ff3020'); }
      await ctx.yield();
      set.add(fx.makeGlows({ positions: pos, colors: cols, size: 3.6, intensity: 2.0, flicker: 0.15, time: timeU, minAngle: 0.003 }));
    }
    await ctx.yield();
    {
      const hz = C3(look.fog), amb = new THREE.Color().setRGB(look.skyc[0], look.skyc[1], look.skyc[2]).multiplyScalar(2.6), sc = new THREE.Color().setRGB(look.sun[0], look.sun[1], look.sun[2]).multiplyScalar(0.8);
      const range = makeHorizonRidges({ rng: ctx.core.makeRng('rim-range:' + ctx.seed), layers: 3, radius: [3500, 4700], height: [230, 560], base: -60, segments: 200, jagged: 0.7, coverage: 0.8,
        colorNear: '#3a4a66', haze: hz, hazeNear: 0.55, hazeFar: 0.8, footHaze: 0.8, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: sc, ambient: amb, snow: isNight ? '#8a98b8' : true, snowLine: 0.5, rim: 0.15, follow: 0 });
      range.object.position.set(1600, -60, 0); scene.add(range.object);   // centred on the bowl and never moved: it stands beyond the far rim and the peak
    }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const eT = new THREE.Euler(), cp = new THREE.Vector3();
    const CLOUD9_X = 270 / Math.hypot(270, 230), CLOUD9_Z = 230 / Math.hypot(270, 230), cloud9Ph = ctx.core.makeRng(ctx.core.hashSeed('rim-cloud9:' + ctx.seed)).range(0, 3600);   // the ninth cloud shadow's course and its drawn start
    const cloudK = lookName === 'noon' ? 0.62 : lookName === 'golden' ? 0.5 : 0, rideLen = A.rideLength, lineSlope = (eyeY(250) - eyeY(100)) / 150, lineB = eyeY(100) - lineSlope * 100;
    return {
      scene, path, duration: DUR, title: look.title + (festival ? ' (Festival Day)' : ''), ride: 'none',
      // the brief's pace: a slow glide over the market, gathering speed as the cabin tips over the rim, easing a little for the gantry
      pace: (u) => 0.64 + 0.58 * sstep(0.13, 0.28, u) - 0.12 * sstep(0.84, 0.96, u),
      camera: { fov: 62, near: 0.35, far: 7500, lookAhead: 22, sway: 0.45, bank: 0 },
      pois: [
        { at: [3000, 40, 1000], from: 0.07, to: 0.15, weight: 0.2 },                                             // a lean to the right before the rim: the tower head passes in the left third
        { at: [3000, -420, 800], from: 0.13, to: 0.40, weight: 0.5 },                                            // the reveal: bowl and peak together
        { at: [3000, 40, 1000], from: 0.36, to: 0.84, weight: 0.42, fade: 0.2 },                                  // down the wall: towers, far rim and the peak stay in the picture
        { at: [175, PLZ.t[1].y, 19], from: 0.40, to: 0.50, weight: 0.24 },                                      // a lean toward the terrace market
        { at: [YX + 4, yTop[3] - 9, 30], from: 0.475, to: 0.60, weight: 0.32 },                                   // the gully: yellow cabins crossing under, the switchback
        { at: [pit.x, pit.y + 1, pit.z], from: 0.62, to: 0.76, weight: 0.4 },                                    // the ledge pitch, ahead on the right
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1.5, tilt: true, revealDistance: 300, blendDistance: 30 },
      post: { exposure: look.exposure, bloom: look.bloom, grade: look.grade },
      update(dt, time, camera, u) {
        timeU.value = time;
        hero.setProgress(u); hero.update(dt, time, camera);
        sky.update(dt, time, camera); rig.update(dt, time, null); if (clouds) clouds.update(dt, time, camera);
        fauna.update(dt, time, camera, u); set.update(dt, time, camera);
        for (let i = 0; i < BUSES; i++) placeBus(i, time);
        buses.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < DOGS; i++) {
          const r = dogAt[i], ph = time * 0.55 + i * 2.1, sx = Math.sin(ph), back = Math.cos(ph) < 0, lx = (r.w / 2 - 0.55) * sx, lz = r.d / 2 - 0.08, c = Math.cos(r.yaw), s = Math.sin(r.yaw);
          tp.set(r.x + c * lx + s * lz, r.y + Math.abs(Math.sin(time * 9 + i)) * 0.035 * Math.abs(Math.cos(ph)), r.z - s * lx + c * lz);
          dogs.setMatrixAt(i, tm.compose(tp, tq.setFromEuler(eT.set(0, r.yaw + (back ? Math.PI : 0), 0)), ts.setScalar(1.15)));
        }
        if (DOGS) dogs.instanceMatrix.needsUpdate = true;
        // the ledge pitch: fourteen players drift round their places and close on the ball
        const bx = pit.x + 15 * Math.sin(time * 0.53) + 4 * Math.sin(time * 1.9), bz = pit.z + 8 * Math.sin(time * 0.41 + 1) + 2 * Math.sin(time * 1.3);
        ball.position.set(bx, pit.y + 0.45 + 1.3 * Math.abs(Math.sin(time * 2.3)), bz);
        for (let i = 0; i < PLAYERS; i++) {
          const hx = pit.x + ((i % 5) - 2) * 8.2, hz = pit.z + (Math.floor(i / 5) - 1) * 8.4;
          const px = lerp(hx + 3.2 * Math.sin(time * 0.7 + i * 1.9), bx, 0.3), pz = lerp(hz + 2.6 * Math.sin(time * 0.6 + i * 2.7), bz, 0.3);
          tp.set(px, pit.y + 0.04 + Math.abs(Math.sin(time * 7 + i * 1.3)) * 0.1, pz);
          figs.setMatrixAt(i, tm.compose(tp, tq.setFromEuler(eT.set(0, Math.atan2(-(bz - pz), bx - px) + Math.PI / 2, 0)), ts.setScalar(1.7)));
        }
        figs.instanceMatrix.needsUpdate = true;
        // the yellow line: keyed to u so that a cabin slides under ours in the gully
        for (let i = 0; i < YCABS; i++) {
          const fwd = i < YCABS / 2; let sd = (u * 143 + time * 0.25 + (i % (YCABS / 2)) * yTotal / (YCABS / 2) + yCross - 0.575 * 143 - 10) % yTotal; if (sd < 0) sd += yTotal;
          if (!fwd) sd = yTotal - sd;
          let k = 0; while (k < yCum.length - 2 && yCum[k + 1] < sd) k++;
          const t = (sd - yCum[k]) / Math.max(1e-3, yCum[k + 1] - yCum[k]), edge = Math.min(1, sd / 4, (yTotal - sd) / 4);
          tp.set(YX + (fwd ? -2.3 : 2.3), lerp(yPts[k][1], yPts[k + 1][1], t), lerp(yPts[k][0], yPts[k + 1][0], t));
          yCabs.setMatrixAt(i, tm.compose(tp, tq.setFromEuler(eT.set(0.03 * Math.sin(time * 1.1 + i * 2.3), Math.PI / 2, 0)), ts.setScalar(Math.max(0.001, edge))));
        }
        yCabs.instanceMatrix.needsUpdate = true;
        // one more cumulus shadow, a thing of the world like the eight in the shader: it runs on the world's clock from the cliff foot over the
        // first spur and on across the bowl (the line from (30, -60) through (300, 170)), at the others' 40 m/s over the same run of 3600 m with
        // the same fades at its ends; where it is when the clock starts is drawn (noon and golden only)
        const cs = (time * 40 + cloud9Ph) % 3600 - 200, ce = sstep(-200, 220, cs) * (1 - sstep(2980, 3400, cs));
        U.uCloudU.value.set(30 + CLOUD9_X * cs, -60 + CLOUD9_Z * cs, 118, cloudK * ce);
        // our own cabin is out of the picture; its square shadow still runs over the roofs
        cp.setFromMatrixPosition(camera.matrixWorld);                      // the camera's world position (a portal camera's matrix is set directly)
        U.uCab.value.set(cp.x, cp.y - 0.35, cp.z, u > 0.0002 ? 1.2 : 0);
        const d0 = u * rideLen; U.uLine.value.set(lineSlope, lineB, 38 + (d0 - 128.9) * 0.9272, 38 + (63 - d0 - 128.9) * 0.9272);
      },
      dispose() { sky.dispose?.(); hero.dispose?.(); hmTex.dispose(); },
    };
  },
};
